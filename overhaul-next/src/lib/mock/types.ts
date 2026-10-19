/* ชนิดข้อมูลของ mock Overhaul v2 — ยกโครงจาก design-mock/overhaul-v2-mock.js (localStorage oh2-mock-v3)
   โครง: แผน → PO (1 ใบหลายคัน) → งานรายคัน 6 ขั้น · สถานะ P1–P3 (แผน) · V1–V11 (งานรายคัน)
   ตามร่าง Diagram/01-บำรุงรักษาตามวาระ/12-overhaul-สถานะ.md */

/** ไฟล์แนบ (ต้นแบบเก็บแค่ชื่อกับขนาด — ไม่มีไฟล์จริง) */
export interface FileRef {
  name: string;
  size: number;
}

export type PlanStatus = "P1" | "P2" | "P3";
export type JobStage = "V1" | "V2" | "V3" | "V4" | "V5" | "V6" | "V7" | "V8" | "V9" | "V10" | "V11";

export interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  type: string;
  /** เลขไมล์สะสม (กม.) */
  mileage: number;
  /** อายุการใช้งาน (ปี) */
  age: number;
  /** ชั่วโมงสะสม */
  hours: number;
}

export interface Vendor {
  name: string;
  tel: string;
  addr: string;
}

export interface Staff {
  id: string;
  name: string;
  pos: string;
  tel: string;
}

export interface PoDocs {
  /** ใบสั่งจ้าง (บังคับ) */
  order: FileRef[];
  other: FileRef[];
}

export interface Po {
  /** เลข PO รูปแบบ PO-xxxxxx */
  id: string;
  name: string;
  /** index ใน OH2_VENDORS */
  vendor: number;
  /** id รถ (OH2_VEHICLES) */
  cars: string[];
  docs: PoDocs;
}

export interface PlanDocs {
  /** หนังสืออนุมัติหลักการ (บังคับ) */
  approve: FileRef[];
  /** เอกสารอนุมัติงบ (บังคับ) */
  budget: FileRef[];
  other: FileRef[];
}

export interface Plan {
  /** เลขแผน (ตัวเลข 6 หลัก) */
  id: string;
  name: string;
  /** ปีงบประมาณ พ.ศ. */
  year: number;
  /** เลข WBS (หน้ารายการแสดงในคอลัมน์ "ศูนย์ต้นทุน") */
  wbs: string;
  /** เลขโครงข่าย */
  net: string;
  /** เลขกิจกรรม */
  act: string;
  /** วงเงินอนุมัติ (บาท) */
  budget: number;
  /** วันที่สร้าง ISO yyyy-mm-dd */
  created: string;
  pos: Po[];
  docs: PlanDocs;
}

/** คำตอบของหน่วยงานต่อนัดหมาย */
export interface ApptReply {
  ok: boolean;
  remark: string;
  /** ISO date */
  at: string;
}

/** นัดหมาย (เข้าอู่ = appt · รับรถ = ret) */
export interface Appointment {
  /** ISO date */
  from: string;
  /** ISO date */
  to: string;
  /** id ผู้ประสานงาน (OH2_STAFF) */
  coord: string;
  remark: string;
  /** วันที่ส่งนัด ISO date */
  sentAt: string;
  /** null = ยังไม่ตอบ */
  reply: ApptReply | null;
}

export interface CheckItem {
  label: string;
  ok: boolean;
  remark: string;
}

export interface Signature {
  who: string;
  at: string;
}

export interface CheckIn {
  items: CheckItem[];
  sign: { kbk: Signature; unit: Signature };
  at: string;
}

export interface ProgressLog {
  /** ISO datetime yyyy-mm-ddTHH:mm */
  at: string;
  note: string;
}

export interface PartUsed {
  name: string;
  qty: number;
  unit: string;
}

/** งานรายคัน — คีย์ใน state.jobs = `${planId}:${carId}` */
export interface Job {
  stage: JobStage;
  appt?: Appointment;
  checkin?: CheckIn;
  logs: ProgressLog[];
  safety: FileRef[];
  ret?: Appointment;
  parts: PartUsed[];
  partFiles: FileRef[];
  /** ISO date */
  closedAt?: string;
}

/** งานตามที่เก็บจริง (seed เก็บแค่ stage — ช่องอื่นเติมตอนอ่านด้วย fillJob) */
export type StoredJob = Partial<Job> & { stage: JobStage };

export interface MockState {
  plans: Plan[];
  jobs: Record<string, StoredJob>;
}

export type BadgeTone = "neutral" | "low" | "out" | "info" | "brand" | "ok";
