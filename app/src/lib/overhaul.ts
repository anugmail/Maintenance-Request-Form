// โมเดลข้อมูล Overhaul — อิง JO1-Tech-Data-Spec.md หัวข้อ 6 (TOR ข้อ 7.4.1)
//   overhaul_plans          → OverhaulPlan
//   overhaul_plan_vehicles  → PlanVehicle
// overhaul_executions (7.4.2) ยังไม่ทำในรอบนี้

import type { ApptStep, CloseStep, LogEntry, PartsStep, PostStep, PreAssessment, WorkStep } from "./overhaulExec";

export type PlanStatus = "DRAFT" | "PENDING" | "ACTIVE" | "CLOSING" | "CLOSED" | "CANCELLED";

// สเปกเขียนแค่ "สร้าง/แก้ไข/ยกเลิก" — ชื่อสถานะเป็นข้อเสนอ ต้องยืนยันกับ กฟภ.
// PENDING: สร้างแผนแล้วต้องให้หัวหน้าอนุมัติก่อน (เจ้าของงานสั่ง 29 ก.ย. 2569)
//   ส่งอนุมัติ → PENDING → อนุมัติ = ACTIVE · ไม่อนุมัติ = กลับเป็น DRAFT พร้อมเหตุผล
// CLOSING/CLOSED: ปิดงานรายคันครบทุกคันแล้ว "ส่งอนุมัติปิดแผน" → หัวหน้าอนุมัติ = CLOSED · ตีกลับ = กลับเป็น ACTIVE
//   (เจ้าของงานเคาะ 1 ต.ค. 2569 "ปิดรายคัน + ปิดแผนตอนครบ")
export const STATUS_LABEL: Record<PlanStatus, string> = {
  DRAFT: "ร่างแผน",
  PENDING: "รออนุมัติ",
  ACTIVE: "อนุมัติแล้ว",
  CLOSING: "รออนุมัติปิดแผน",
  CLOSED: "ปิดแผนแล้ว",
  CANCELLED: "ยกเลิก",
};

// คลาส badge ตาม design-system README หัวข้อ 4.2
export const STATUS_BADGE: Record<PlanStatus, string> = {
  DRAFT: "b-neutral",
  PENDING: "b-low", // ตาม approve-close.js ที่ใช้ b-low กับ "รออนุมัติ"
  ACTIVE: "b-ok",
  CLOSING: "b-low",
  CLOSED: "b-brand",
  CANCELLED: "b-out",
};

// selection_criteria — ตาม 6.2 (โครงสร้างดี/ไม่ผุ-บิด, ยี่ห้อทนทาน, อายุใช้งานสูง, หาอะไหล่ง่าย)
export const CRITERIA = [
  { key: "structure", label: "โครงสร้างดี ไม่ผุ/บิด" },
  { key: "brand", label: "ยี่ห้อทนทาน" },
  { key: "age", label: "อายุใช้งานสูง" },
  { key: "parts", label: "หาอะไหล่ง่าย" },
] as const;
export type CriterionKey = (typeof CRITERIA)[number]["key"];

export interface Vehicle {
  id: string;
  plate: string;
  vehicleType: string;
  orgUnit: string;
  registrationDate: string; // ISO — อายุคำนวณจากค่านี้ ไม่เก็บ (สเปก 3.1)
  equipmentBrand: string;
  equipmentNo: string;
  serialNo: string;
  odometerKm: number;
  machineHours: number;
  acquisitionValue: number; // มูลค่าที่ได้มา (JO 7.1-01) — ใช้เทียบค่าใช้จ่าย 7.4.2-06 · ⚠️ ค่าจำลอง รอถาม กฟภ.
}

export interface PlanVehicle {
  vehicleId: string;
  criteria: CriterionKey[];
  // ดำเนินการ Overhaul รายคัน 7 ขั้นแบบงานซ่อมระบบจริง (JO 7.4.2 · สเปก 6.3) — ดู lib/overhaulExec.ts
  parts?: PartsStep; // ① เบิกอะไหล่ (7.4.2-08)
  appt?: ApptStep; // ② นัดหมายวันซ่อม
  preAssessment?: PreAssessment; // ③ ตรวจสภาพก่อน (7.4.2-01)
  work?: WorkStep; // ④ ดำเนินการ (7.4.2-02)
  ret?: ApptStep; // ⑤ นัดหมายวันคืนรถ
  post?: PostStep; // ⑥ ตรวจสภาพหลัง (7.4.2-04)
  close?: CloseStep; // ⑦ รายงานปิดงาน (7.4.2-06, 08, 10)
  log?: LogEntry[]; // ประวัติการดำเนินการ
}

export interface OverhaulPlan {
  id: string;
  planNo: string;
  name: string;
  year: number; // พ.ศ. — สเปกยังไม่ตกลงว่า พ.ศ./ค.ศ.
  budget: number;
  status: PlanStatus;
  cancelReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectReason?: string; // เหตุผลที่หัวหน้าไม่อนุมัติ — ล้างทิ้งเมื่ออนุมัติ
  // ปิดแผน (หลังทุกคันปิดงานรายคันครบ)
  closeSubmittedAt?: string;
  closedAt?: string;
  closedBy?: string;
  closeRejectReason?: string;
  vehicles: PlanVehicle[];
  updatedAt: string;
}

// แก้ไขได้ทุกสถานะยกเว้นยกเลิกแล้ว (สเปก 6.1: สร้าง/แก้ไข/ยกเลิก) — รอยืนยันกับ กฟภ.
// ระหว่างรออนุมัติล็อกไว้ ไม่ให้แผนเปลี่ยนใต้มือหัวหน้า
export const canEdit = (p: OverhaulPlan) => p.status === "DRAFT" || p.status === "ACTIVE";
// แผนที่อนุมัติแล้ว (รวมระหว่าง/หลังปิดแผน) = มีงานดำเนินการ Overhaul รายคัน
export const isApprovedPlan = (p: OverhaulPlan) => p.status === "ACTIVE" || p.status === "CLOSING" || p.status === "CLOSED";
export const canApprove = (p: OverhaulPlan) => p.status === "PENDING";

// ⚠️ ข้อมูลจำลอง — ของจริงต้องผูกกับผู้ login ที่มีสิทธิ์อนุมัติ
export const APPROVER = "หัวหน้า กบค."

// acquisitionValue ทุกคันเป็นค่าจำลอง (เจ้าของงานให้จำลองไปก่อน 30 ก.ย. 2569 แล้วค่อยถาม กฟภ.)
export const VEHICLES: Vehicle[] = [
  { id: "v01", plate: "82-6789 ขอนแก่น", vehicleType: "รถกระเช้าฉนวนกันไฟฟ้า", orgUnit: "กฟจ.ขอนแก่น", registrationDate: "2011-03-14", equipmentBrand: "Aichi SK17A", equipmentNo: "AC-17-0412", serialNo: "SK17A-88213", odometerKm: 412380, machineHours: 9120, acquisitionValue: 3450000 },
  { id: "v02", plate: "82-1145 ขอนแก่น", vehicleType: "รถกระเช้าฉนวนกันไฟฟ้า", orgUnit: "กฟจ.ขอนแก่น", registrationDate: "2012-07-02", equipmentBrand: "Tadano AT-100", equipmentNo: "TD-10-0098", serialNo: "AT100-51720", odometerKm: 368900, machineHours: 8410, acquisitionValue: 3800000 },
  { id: "v03", plate: "82-3390 ขอนแก่น", vehicleType: "รถบรรทุกติดเครนไฮดรอลิก", orgUnit: "กฟอ.บ้านไผ่", registrationDate: "2010-11-21", equipmentBrand: "Unic URV", equipmentNo: "UN-UR-0231", serialNo: "URV-340-7781", odometerKm: 455120, machineHours: 10380, acquisitionValue: 2950000 },
  { id: "v04", plate: "83-4471 อุดรธานี", vehicleType: "รถกระเช้าฉนวนกันไฟฟ้า", orgUnit: "กฟจ.อุดรธานี", registrationDate: "2013-01-09", equipmentBrand: "Aichi SK21A", equipmentNo: "AC-21-0155", serialNo: "SK21A-60432", odometerKm: 301770, machineHours: 7050, acquisitionValue: 4100000 },
  { id: "v05", plate: "83-2218 อุดรธานี", vehicleType: "รถบรรทุกติดเครนไฮดรอลิก", orgUnit: "กฟอ.กุมภวาปี", registrationDate: "2009-08-30", equipmentBrand: "Tadano TM-ZE", equipmentNo: "TD-ZE-0077", serialNo: "TMZE-29018", odometerKm: 498210, machineHours: 11890, acquisitionValue: 3200000 },
  { id: "v06", plate: "84-9902 หนองคาย", vehicleType: "รถกระเช้าฉนวนกันไฟฟ้า", orgUnit: "กฟจ.หนองคาย", registrationDate: "2014-05-18", equipmentBrand: "Aichi SK17A", equipmentNo: "AC-17-0530", serialNo: "SK17A-90115", odometerKm: 276450, machineHours: 6320, acquisitionValue: 4350000 },
  { id: "v07", plate: "84-5566 หนองคาย", vehicleType: "รถขุดเจาะ", orgUnit: "กฟอ.ท่าบ่อ", registrationDate: "2011-12-05", equipmentBrand: "Hanta HD-20", equipmentNo: "HT-20-0044", serialNo: "HD20-11873", odometerKm: 233600, machineHours: 9870, acquisitionValue: 5600000 },
  { id: "v08", plate: "85-1177 เลย", vehicleType: "รถกระเช้าฉนวนกันไฟฟ้า", orgUnit: "กฟจ.เลย", registrationDate: "2012-02-27", equipmentBrand: "Tadano AT-120", equipmentNo: "TD-12-0019", serialNo: "AT120-40291", odometerKm: 389040, machineHours: 8760, acquisitionValue: 3900000 },
];

export const vehicleById = (id: string) => VEHICLES.find((v) => v.id === id);

export function vehicleAge(v: Vehicle, now = new Date()): number {
  const reg = new Date(v.registrationDate);
  let age = now.getFullYear() - reg.getFullYear();
  if (now < new Date(now.getFullYear(), reg.getMonth(), reg.getDate())) age--;
  return age;
}

export const SEED_PLANS: OverhaulPlan[] = [
  {
    id: "p1",
    planNo: "OVH-2570-001",
    name: "Overhaul รถกระเช้า เขต ฉ.1 ปี 2570",
    year: 2570,
    budget: 4_800_000,
    status: "ACTIVE",
    vehicles: [
      { vehicleId: "v01", criteria: ["structure", "age", "parts"] },
      { vehicleId: "v02", criteria: ["structure", "brand", "age"] },
      { vehicleId: "v08", criteria: ["brand", "age", "parts"] },
    ],
    updatedAt: "2026-09-12T10:20:00+07:00",
  },
  {
    id: "p2",
    planNo: "OVH-2570-002",
    name: "Overhaul รถเครนไฮดรอลิก ปี 2570",
    year: 2570,
    budget: 3_200_000,
    status: "PENDING",
    vehicles: [
      { vehicleId: "v03", criteria: ["structure", "age"] },
      { vehicleId: "v05", criteria: ["age", "parts"] },
    ],
    updatedAt: "2026-09-25T14:05:00+07:00",
  },
  {
    id: "p3",
    planNo: "OVH-2569-004",
    name: "Overhaul รถขุดเจาะ ปี 2569",
    year: 2569,
    budget: 1_500_000,
    status: "CANCELLED",
    cancelReason: "ย้ายงบไปแผนจัดซื้อรถใหม่",
    vehicles: [{ vehicleId: "v07", criteria: ["structure"] }],
    updatedAt: "2026-06-03T09:00:00+07:00",
  },
];

export const fmtNum = (n: number) => n.toLocaleString("th-TH");
export const fmtBaht = (n: number) =>
  n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
export const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
