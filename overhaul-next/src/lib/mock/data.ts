/* ข้อมูลคงที่ของ mock — พอร์ตตรงจาก design-mock/overhaul-v2-mock.js (19 ต.ค. 2569)
   เลขแผน ทะเบียน ชื่อบริษัท ชื่อคน และตัวเลขทั้งหมดเป็นค่าสมมติ */
import type { BadgeTone, JobStage, PlanStatus, Staff, Vehicle, Vendor } from "./types";

/** รถที่เลือกเข้า PO ได้ — ช่องตาม wireframe ข้าง userflow (ทะเบียน · เลขไมล์ · อายุการใช้งาน) */
export const OH2_VEHICLES: Vehicle[] = [
  { id: "c1", plate: "8234 กค กทม", brand: "HINO FM2P", type: "รถเครน 10 ตัน", mileage: 182400, age: 12, hours: 9800 },
  { id: "c2", plate: "81-5521 นครปฐม", brand: "ISUZU FVM", type: "รถกระเช้า", mileage: 210050, age: 14, hours: 11200 },
  { id: "c3", plate: "70-1123 ชลบุรี", brand: "HINO FG8J", type: "รถเครน 5 ตัน", mileage: 150200, age: 11, hours: 8100 },
  { id: "c4", plate: "82-0457 สระบุรี", brand: "ISUZU FXZ", type: "รถเจาะหลุมปักเสา", mileage: 198700, age: 13, hours: 10400 },
  { id: "c5", plate: "71-9902 ขอนแก่น", brand: "MITSUBISHI FN", type: "รถกระเช้า", mileage: 233100, age: 15, hours: 12900 },
  { id: "c6", plate: "80-3316 เชียงใหม่", brand: "HINO FM1A", type: "รถเครน 10 ตัน", mileage: 176900, age: 10, hours: 7600 },
  { id: "c7", plate: "83-2210 นครราชสีมา", brand: "ISUZU FVZ", type: "รถเจาะหลุมปักเสา", mileage: 205400, age: 12, hours: 10900 },
  { id: "c8", plate: "72-6648 สงขลา", brand: "HINO FG1J", type: "รถกระเช้า", mileage: 221300, age: 16, hours: 13300 },
];

/** ศูนย์บริการ/อู่ — userflow เขียนว่า vendor list "(mockup)" ⇒ ยังไม่มีแหล่งข้อมูลจริง */
export const OH2_VENDORS: Vendor[] = [
  { name: "บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด", tel: "02-111-2201", addr: "เขตบางนา กรุงเทพฯ" },
  { name: "บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด", tel: "02-111-2202", addr: "เขตพระนคร กรุงเทพฯ" },
  { name: "บริษัท มิตซูบิชิ ฟูโซ่ ทรัค จำกัด", tel: "02-111-2203", addr: "อ.บางพลี สมุทรปราการ" },
];

/** กบค. ผู้ประสานงาน (ใช้ในนัดหมาย) — ชื่อ/เบอร์สมมติ · ของจริงต้องดึงจากระบบบุคลากร */
export const OH2_STAFF: Staff[] = [
  { id: "s1", name: "นายวิชัย ทองดี", pos: "วิศวกร กบค.", tel: "02-590-9123" },
  { id: "s2", name: "นางสาวกนกวรรณ ใจมั่น", pos: "พนักงานช่าง กบค.", tel: "02-590-9124" },
  { id: "s3", name: "นายสมศักดิ์ เรืองชัย", pos: "หัวหน้าแผนก กบค.", tel: "02-590-9125" },
];

/** สถานะงานรายคัน V1–V11 → [ข้อความ, โทนป้าย Pill outline] */
export const OH2_JOB: Record<JobStage, readonly [string, BadgeTone]> = {
  V1: ["รอนัดหมายเข้าอู่", "neutral"],
  V2: ["รอหน่วยงานตอบรับนัดเข้าอู่", "low"],
  V3: ["หน่วยงานปฏิเสธนัดเข้าอู่", "out"],
  V4: ["รอตรวจรับรถ", "low"],
  V5: ["กำลังซ่อม", "info"],
  V6: ["รอตรวจสภาพ Safety", "low"],
  V7: ["รอนัดหมายรับรถ", "neutral"],
  V8: ["รอหน่วยงานตอบรับนัดรับรถ", "low"],
  V9: ["หน่วยงานปฏิเสธนัดรับรถ", "out"],
  V10: ["รอปิดงาน", "brand"],
  V11: ["ปิดงานแล้ว", "ok"],
};

/** สถานะแผน P1–P3 → [ข้อความ, โทนป้าย] */
export const OH2_PLAN: Record<PlanStatus, readonly [string, BadgeTone]> = {
  P1: ["ยังไม่มี PO", "neutral"],
  P2: ["ดำเนินการ", "info"],
  P3: ["เสร็จสิ้น", "ok"],
};

export const JOB_STAGES = Object.keys(OH2_JOB) as JobStage[];
export const PLAN_STATUSES = Object.keys(OH2_PLAN) as PlanStatus[];

/** งานรายคัน 6 ขั้น (S7–S14) */
export const OH2_STEPS = ["นัดเอารถเข้าอู่", "ตรวจรับรถ", "ติดตามงานซ่อม", "ตรวจสภาพ", "นัดรับรถ", "ปิดงาน"] as const;

/** ขั้น ↔ สถานะ: 1 นัดเข้าอู่ V1–V3 · 2 ตรวจรับรถ V4 · 3 ติดตามงานซ่อม V5 · 4 ตรวจสภาพ V6 · 5 นัดรับรถ V7–V9 · 6 ปิดงาน V10–V11 */
export const OH2_STEP_OF: Record<JobStage, number> = {
  V1: 1, V2: 1, V3: 1, V4: 2, V5: 3, V6: 4, V7: 5, V8: 5, V9: 5, V10: 6, V11: 6,
};

/** รายการตรวจรับรถ (ขั้น 2) */
export const OH2_CHECKLIST = [
  "สำเนาคู่มือจดทะเบียนรถ",
  "กุญแจรถ (ตัวจริง + สำรอง)",
  "สภาพตัวรถภายนอกและสี",
  "ระบบไฟส่องสว่างและสัญญาณ",
  "ยางและล้อ (รวมยางอะไหล่)",
  "ระดับน้ำมันเครื่องและของเหลว",
  "เครื่องมือประจำรถ",
] as const;

/** ไฟล์แนบ: สูงสุด 10 ไฟล์ · PDF/JPEG (userflow) */
export const OH2_MAX_FILES = 10;
export const OH2_FILE_ACCEPT = ".pdf,.jpg,.jpeg,application/pdf,image/jpeg";

/** ตัวกรองงบประมาณของหน้ารายการแผน (ช่วงวงเงินเป็นการตีความ — รอเคาะ) */
export const OH2_BUDGET_RANGES = [
  { value: "0-5000000", label: "ไม่เกิน 5 ล้านบาท" },
  { value: "5000000-20000000", label: "5–20 ล้านบาท" },
  { value: "20000000-", label: "มากกว่า 20 ล้านบาท" },
] as const;
