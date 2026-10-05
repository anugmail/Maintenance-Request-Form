// ดำเนินการ Overhaul รายคัน (JO 7.4.2 · สเปก 6.3 overhaul_executions)
// 🔴 1 ต.ค. 2569 เจ้าของงานสั่ง "ไปดูจาก flow/repair แล้วปรับให้คล้ายกัน" — Overhaul = ซ่อมใหญ่ ยกเครื่อง
//   ⇒ โครง 7 ขั้นตามหน้างานซ่อมระบบจริง (flow/repair/*.png = ภาพ UAT vms-plus-uat/maintain-d/repair งาน RRZ6900015)
//   ① เบิกอะไหล่ → ② นัดหมายวันซ่อม → ③ ตรวจสภาพก่อน → ④ ดำเนินการ → ⑤ นัดหมายวันคืนรถ → ⑥ ตรวจสภาพหลัง → ⑦ รายงานปิดงาน
//   ของเฉพาะ Overhaul ตาม JO 7.4.2 เสียบเข้าขั้นที่ตรงกัน: ผลวิเคราะห์+ภาพก่อน (③ · 01, 05) · รายการงาน (④ · 02)
//   · ทดสอบความปลอดภัย+ใบรับรอง+รับประกัน 180 วัน+ภาพหลัง (⑥ · 04, 05) · ค่าแรง+ค่าใช้จ่ายเทียบราคารถ (⑦ · 02, 06)
// ขอบเขตที่เจ้าของงานเคาะ: เครื่องมือกลเท่านั้น (29 ก.ย.) · กบค. ดำเนินการเอง (30 ก.ย.) · ค่าแรงกรอกตอนสรุป (30 ก.ย.)
import type { OverhaulPlan, PlanVehicle, Vehicle } from "./overhaul";

// ⚠️ ข้อมูลจำลอง — ของจริงต้องผูกกับผู้ login
export const INSPECTOR = "ช่าง กบค.";
export const APPROVER_CLOSE = "หัวหน้า กบค.";

// ช่างซ่อม กบค. — ยก TECHS จาก mock/Maintenance-Request-Form.html · ⚠️ ข้อมูลจำลอง
export const TECHS = [
  { id: "538877", name: "สุรชัย พันธ์ดี", posi: "หก.ซ่อมบำรุง", dept: "กบค.กฟก.1", tel: "081-770-3388" },
  { id: "540118", name: "ประสิทธิ์ แก้วมณี", posi: "ช่างระดับ 6", dept: "กบค.กฟก.1", tel: "081-455-2201" },
  { id: "541902", name: "วิรัตน์ ศรีสุข", posi: "ช่างระดับ 5", dept: "กบค.กฟก.1", tel: "089-330-7712" },
  { id: "546210", name: "ธนพล อินทร์ทอง", posi: "ช่างระดับ 5", dept: "กบค.กฟก.1", tel: "086-221-9043" },
  { id: "552341", name: "อนุวัฒน์ คำแหง", posi: "ช่างระดับ 4", dept: "กบค.กฟก.1", tel: "092-118-4460" },
];
export const techById = (id?: string) => TECHS.find((t) => t.id === id);
// ผู้ส่งมอบรถ (ฝั่งหน่วยงานเจ้าของรถ) — ชื่อจากภาพระบบจริง flow/repair · ⚠️ จำลอง
export const DELIVERERS = ["นางปาริชาติ พรหมเศรณี"];
export const RECEIVERS = ["นายรุจหิรัญ พันธัย", ...TECHS.map((t) => t.name)];

export interface Signature {
  by: string;
  signedAt?: string;
}
export interface SignPair {
  deliver: Signature; // ผู้ส่งมอบรถ
  receive: Signature; // ผู้รับมอบ (กบค.)
}
export const freshSign = (): SignPair => ({ deliver: { by: DELIVERERS[0] }, receive: { by: RECEIVERS[0] } });

// ---------- ① เบิกอะไหล่ (7.4.2-08 · 7.4.2-09 Smart Inventory "ถ้ามี") ----------
// ทะเบียนอะไหล่ = ยกจาก parts ใน config.js ของต้นแบบ static (ชุดเดียวกับงานซ่อม กบค.) เฉพาะช่องที่ใช้
// fit = "all" ของกลาง · [รุ่น] เฉพาะรุ่นเครื่องมือกล (จับคู่กับ equipmentBrand ของรถ)
// stock = คลังที่ 1 Smart Inventory · stockAlt = คลังที่ 2 คลังสำรอง — ⚠️ ยอดคงคลังจำลอง ยังไม่ตัด/คืนยอดจริง
export interface Part {
  code: string;
  name: string;
  unit: string;
  need: number; // จำนวนที่ใช้ตามปกติต่อคัน (ช่อง need ใน config.js) — ใช้เป็นจำนวนตั้งต้นของอะไหล่ประจำรุ่น
  price: number;
  stock: number;
  stockAlt: number;
  wh: string;
  icon: string;
  fit: "all" | string[];
}
export const PARTS: Part[] = [
  { fit: "all", code: "SL-4402", name: "ชุดซีลกระบอกไฮดรอลิก", need: 1, unit: "ชุด", stock: 6, stockAlt: 4, wh: "กบค. สนญ.", icon: "join_inner", price: 1850 },
  { fit: "all", code: "OL-0046", name: "น้ำมันไฮดรอลิก ISO VG46 18L", need: 1, unit: "ถัง", stock: 2, stockAlt: 6, wh: "กบค. สนญ.", icon: "oil_barrel", price: 2400 },
  { fit: "all", code: "PM-2210", name: "ปั๊มไฮดรอลิกเกียร์", need: 1, unit: "ตัว", stock: 0, stockAlt: 0, wh: "กบค. สนญ.", icon: "compress", price: 18500 },
  { fit: "all", code: "FT-1108", name: "ไส้กรองไฮดรอลิก", need: 2, unit: "ชิ้น", stock: 12, stockAlt: 0, wh: "กบค. สนญ.", icon: "filter_alt", price: 650 },
  { fit: "all", code: "HS-3808", name: 'สายไฮดรอลิกแรงดันสูง 3/8"', need: 2, unit: "เส้น", stock: 4, stockAlt: 10, wh: "คลังเขต", icon: "cable", price: 1200 },
  { fit: "all", code: "FT-2205", name: "ข้อต่อไฮดรอลิก", need: 4, unit: "ตัว", stock: 3, stockAlt: 0, wh: "คลังเขต", icon: "valve", price: 320 },
  { fit: "all", code: "WP-1030", name: "แผ่นสไลด์บูม (wear pad)", need: 4, unit: "แผ่น", stock: 8, stockAlt: 0, wh: "กบค. สนญ.", icon: "layers", price: 780 },
  { fit: "all", code: "GR-0002", name: "จาระบี EP2", need: 1, unit: "หลอด", stock: 20, stockAlt: 35, wh: "คลังเขต", icon: "colorize", price: 180 },
  { fit: "all", code: "WR-1000", name: "ลวดสลิง 10 มม.", need: 25, unit: "เมตร", stock: 0, stockAlt: 40, wh: "กบค. สนญ.", icon: "line_weight", price: 240 },
  { fit: "all", code: "LK-0770", name: "ชุดล็อกกระเช้า", need: 1, unit: "ชุด", stock: 5, stockAlt: 0, wh: "กบค. สนญ.", icon: "lock", price: 4600 },
  { fit: "all", code: "BT-0912", name: "แบตเตอรี่รีโมท", need: 2, unit: "ก้อน", stock: 15, stockAlt: 20, wh: "คลังเขต", icon: "battery_full", price: 120 },
  { fit: "all", code: "RC-5521", name: "ชุดรับสัญญาณรีโมท", need: 1, unit: "ชุด", stock: 1, stockAlt: 6, wh: "กบค. สนญ.", icon: "settings_remote", price: 9800 },
  { fit: "all", code: "SN-3310", name: "เซ็นเซอร์ load cell", need: 1, unit: "ตัว", stock: 0, stockAlt: 0, wh: "กบค. สนญ.", icon: "sensors", price: 12500 },
  { fit: ["SK17A"], code: "AC-1101", name: "ชุดล็อกกระเช้า Aichi SK17A", need: 1, unit: "ชุด", stock: 3, stockAlt: 0, wh: "กบค. สนญ.", icon: "lock", price: 5200 },
  { fit: ["SK17A"], code: "AC-1102", name: "มอเตอร์หมุนแท่นกระเช้า Aichi", need: 1, unit: "ตัว", stock: 1, stockAlt: 0, wh: "กบค. สนญ.", icon: "rotate_right", price: 24000 },
  { fit: ["SK17A"], code: "AC-1103", name: "เซ็นเซอร์ระดับกระเช้า Aichi", need: 1, unit: "ตัว", stock: 0, stockAlt: 2, wh: "กบค. สนญ.", icon: "sensors", price: 8900 },
  { fit: ["SK17A"], code: "AC-1104", name: "ยางกันกระแทกขอบกระเช้า", need: 4, unit: "เส้น", stock: 12, stockAlt: 5, wh: "คลังเขต", icon: "shield", price: 1450 },
  { fit: ["SK17A"], code: "AC-1105", name: "ชุดควบคุมบนกระเช้า Aichi", need: 1, unit: "ชุด", stock: 2, stockAlt: 0, wh: "กบค. สนญ.", icon: "dashboard", price: 15800 },
  { fit: ["TM-ZE"], code: "TD-2201", name: "ลวดสลิงเครน Tadano 12 มม.", need: 30, unit: "เมตร", stock: 80, stockAlt: 0, wh: "กบค. สนญ.", icon: "line_weight", price: 380 },
  { fit: ["TM-ZE"], code: "TD-2202", name: "แผ่นสไลด์บูม Tadano TM-ZE", need: 4, unit: "แผ่น", stock: 6, stockAlt: 3, wh: "กบค. สนญ.", icon: "layers", price: 1100 },
  { fit: ["URV"], code: "UN-3302", name: "ปั๊มไฮดรอลิก Unic URV554", need: 1, unit: "ตัว", stock: 0, stockAlt: 0, wh: "กบค. สนญ.", icon: "compress", price: 21000 },
  { fit: ["URV"], code: "UN-3304", name: "ซีลกระบอกขาช้าง (outrigger)", need: 2, unit: "ชุด", stock: 7, stockAlt: 0, wh: "คลังเขต", icon: "join_inner", price: 2300 },
];
export const partByCode = (code: string) => PARTS.find((p) => p.code === code);
// ของกลาง + ของตรงรุ่นเครื่องมือกลของรถคันนี้ (ของตรงรุ่นขึ้นก่อน — ตาม partsStockPaneHTML ของ mock)
export const partsFor = (v: Vehicle) =>
  PARTS.filter((p) => p.fit === "all" || p.fit.some((k) => v.equipmentBrand.includes(k))).sort(
    (a, b) => (Array.isArray(b.fit) ? 1 : 0) - (Array.isArray(a.fit) ? 1 : 0),
  );

// อะไหล่ประจำรุ่น — เจ้าของงานแจ้ง 30 ก.ย. 2569 "เค้าจะรู้แล้วว่ารถรุ่นนั้นมีอะไหล่อะไรบ้าง"
// ⇒ ขั้น ① ตั้งรายการเบิกให้เลยจากอะไหล่ที่ระบุรุ่นเครื่องมือกลของรถคันนี้ (fit = [รุ่น]) จำนวน = need · เบิกคลังที่ 1 ตั้งต้น
// ⚠️ ชุดอะไหล่ประจำรุ่นยังเป็นข้อมูลจำลองจากทะเบียนอะไหล่ต้นแบบ — รุ่นที่ไม่มีอะไหล่เฉพาะรุ่นจะได้รายการว่าง
export const modelKit = (v: Vehicle) =>
  PARTS.filter((p) => Array.isArray(p.fit) && p.fit.some((k) => v.equipmentBrand.includes(k)));
export const kitLines = (v: Vehicle): PartLine[] => modelKit(v).map((p) => ({ code: p.code, qty: p.need, wh: "si" }));

// แหล่งของรายการอะไหล่ — ตามหน้าเบิกอะไหล่ใน figma/หน้าเบิกอะไหล่-filled.jpg (บรรทัดล่างของการ์ด "<แหล่ง> : มีในคลัง N ชิ้น"):
//   si  = Smart Inventory — เกินยอดคงคลังได้ ส่วนที่เกิน "ต้องจัดซื้อ" (ระบบจัดซื้อให้) → "จัดซื้ออะไหล่เพิ่มโดย Smart Inventory"
//   alt = คลังสำรอง — เบิกได้ไม่เกินยอดคงคลัง (ปุ่ม + ปิดเมื่อครบ ตามภาพ)
//   buy = ซื้อเพิ่มเติม — อะไหล่ที่ "ระบุอะไหล่เพิ่มเติม" เอง (ไม่มีในทะเบียน) → "จัดซื้ออะไหล่เพิ่มโดย กบค."
export type Warehouse = "si" | "alt" | "buy";
export const WAREHOUSE_LABEL: Record<Warehouse, string> = { si: "Smart Inventory", alt: "คลังสำรอง", buy: "ซื้อเพิ่มเติม" };
export interface PartLine {
  code: string; // รหัสในทะเบียน · อะไหล่ที่ระบุเอง = "custom-<เวลา>"
  qty: number;
  wh: Warehouse;
  name?: string; // เฉพาะอะไหล่ที่ระบุเอง
  partNo?: string; // รหัสอะไหล่ (ถ้ามี) ที่ระบุเอง
  price?: number; // ราคาต่อชิ้น (ถ้ามี) ที่ระบุเอง
}
export interface PartsStep {
  items: PartLine[];
  confirmedAt?: string;
}
// ชื่อ/รหัส/ราคา/หน่วย ของรายการ — จากทะเบียน หรือจากที่ระบุเอง
export const partInfo = (l: PartLine) => {
  const p = partByCode(l.code);
  return p
    ? { name: p.name, code: p.code, price: p.price, unit: p.unit }
    : { name: l.name || "(ยังไม่ระบุชื่ออะไหล่)", code: l.partNo || "-", price: l.price ?? 0, unit: "ชิ้น" };
};
export const partHave = (l: PartLine) => {
  const p = partByCode(l.code);
  return !p ? 0 : l.wh === "si" ? p.stock : l.wh === "alt" ? p.stockAlt : 0;
};
export const partMax = (l: PartLine) => (l.wh === "alt" ? partHave(l) : Infinity);
export const partShort = (l: PartLine) => (l.wh === "buy" ? l.qty : l.wh === "alt" ? 0 : Math.max(0, l.qty - partHave(l)));
export const partsCost = (items: PartLine[]) => items.reduce((s, l) => s + partInfo(l).price * l.qty, 0);

// แยกรายการตาม "สรุปรายการอะไหล่" (figma/สรุปรายการอะไหล่.svg):
//   เบิกที่ Smart Inventory / คลังสำรอง = ส่วนที่มีในคลัง
//   จัดซื้อโดย Smart Inventory = ส่วนที่เกินยอดคลังที่ 1 · จัดซื้อโดย กบค. = อะไหล่ที่ระบุเพิ่มเติม (ซื้อเพิ่มเติม)
export interface SumRow {
  code: string;
  name: string;
  qty: number;
  amount: number;
}
export function partsBreakdown(items: PartLine[]) {
  const rows = (pick: (l: PartLine) => number, wh: Warehouse): SumRow[] =>
    items
      .filter((l) => l.wh === wh)
      .map((l) => {
        const p = partInfo(l);
        const qty = pick(l);
        return { code: l.code, name: p.name, qty, amount: qty * p.price };
      })
      .filter((r) => r.qty > 0);
  const sum = (rs: SumRow[]) => rs.reduce((s, r) => s + r.amount, 0);
  const take = { si: rows((l) => Math.min(l.qty, partHave(l)), "si"), alt: rows((l) => l.qty, "alt") };
  const buy = { si: rows(partShort, "si"), alt: rows((l) => l.qty, "buy") };
  const t = { takeSi: sum(take.si), takeAlt: sum(take.alt), buySi: sum(buy.si), buyAlt: sum(buy.alt) };
  return { take, buy, totals: { ...t, take: t.takeSi + t.takeAlt, buy: t.buySi + t.buyAlt, all: t.takeSi + t.takeAlt + t.buySi + t.buyAlt } };
}

// ---------- ② นัดหมายวันซ่อม · ⑤ นัดหมายวันคืนรถ ----------
// ยกจาก figma/นัดหมายเข้าซ่อมสำนักงาน-filled.png (รูปแบบการซ่อม + ช่วงเวลา + ช่างซ่อม + เบอร์ + สถานที่ → "ส่งนัดหมาย")
// แล้วรอ "ต้นทางยืนยัน" แบบหน้า flow/repair (ขั้นนัดหมายวันคืนรถ: รอตอบกลับจากหน่วยงาน · แก้ไขนัดหมาย / ต้นทางยืนยัน)
export type ApptMode = "IN" | "ONSITE";
export const APPT_MODES: { key: ApptMode; label: string; desc: string }[] = [
  { key: "IN", label: "เข้าซ่อมที่ กบค.", desc: "นัดเข้ามาซ่อมที่สำนักงานใหญ่" },
  { key: "ONSITE", label: "จัดซ่อมที่หน้างาน", desc: "กบค. เดินทางไปซ่อม" },
];
export interface ApptStep {
  mode: ApptMode;
  from: string; // yyyy-mm-dd
  to: string;
  techId: string;
  place: string;
  sentAt?: string; // ส่งนัดหมายแล้ว → รอต้นทางยืนยัน
  confirmedAt?: string; // ต้นทางยืนยัน → ไปขั้นถัดไป
}
export const DEFAULT_PLACE = "การไฟฟ้าส่วนภูมิภาคสำนักงานใหญ่ อาคาร 9"; // ตามภาพ figma

// ---------- ③ ตรวจสภาพก่อน Overhaul (7.4.2-01) ----------
// โครงตามภาพระบบจริง flow/repair (ขั้น "ตรวจสภาพก่อนซ่อม"): ข้อมูลยานพาหนะ → รายการเอกสารรับรถ 13 ข้อ
// → ลงนามการรับมอบรถ → รายละเอียดการตรวจสภาพก่อนซ่อม 24 ข้อ → ยืนยันการตรวจสภาพ
// + ของ Overhaul: ผลวิเคราะห์อาการ · ภาพก่อน (7.4.2-05)
// รายการเอกสารรับรถ 13 ข้อ — ถอดจากภาพระบบจริง (ข้อ 5 มีช่องยี่ห้อ/จำนวนแบตเตอรี่แทรกกลางบรรทัด)
export const RECEIPT_ITEMS = [
  "แผ่นป้ายทะเบียนหน้า-หลัง",
  "ป้ายทะเบียนติดกระจก และ พรบ.",
  "กระจกมองข้างซ้าย-ขวา, กระจกมองหลัง",
  "ยางอะไหล่",
  "แบตเตอรี่",
  "เครื่องมือประจำรถ, แม่แรง, ประแจถอดล้อ",
  "ฝาถังน้ำมัน",
  "อุปกรณ์บนหน้าปัด, แตร",
  "ใบปัดน้ำฝน",
  "วิทยุ, ลำโพง, เสาอากาศ, วิทยุรับ-ส่ง",
  "ระบบไฟส่องสว่าง",
  "สภาพยาง",
  "สภาพตัวถังและสี",
];
export const BATTERY_INDEX = 4;
export interface ReceiptItem {
  label: string;
  has?: boolean; // มี / ไม่มี
  damaged: boolean; // ชำรุด (ติ๊กได้เมื่อ "มี")
  wrongModel: boolean; // ผิดรุ่น
  note: string;
  brand?: string; // เฉพาะแบตเตอรี่
  qty?: string;
}

// รายการตรวจสภาพเครื่องมือกล 24 ข้อ — ชื่อ/ลำดับตามภาพระบบจริง flow/repair (ตารางเดียวกันทั้งก่อนและหลังซ่อม)
// (เดิมยก INSPECT_LABELS จาก mock ซึ่งชุดเดียวกันแต่ลำดับไม่ตรงของจริง — เปลี่ยน 1 ต.ค. 2569)
export const EQUIP_INSPECT_ITEMS = [
  "ชุดเกียร์พีทีโอ", "ชุดกระบอกขาช้างหน้า ซ้าย ขวา", "ชุดกระบอกขาช้างหลัง ซ้าย ขวา", "ชุดวาร์ลคอนโทรลขาช้าง",
  "เพลาขับปั๊มน้ำมันไฮดรอลิค", "ชุดโรตารี่", "ชุดกระบอก UPPER BOOM", "ชุดกระบอก LOWER BOOM",
  "ชุดวาล์วล็อคต่างๆ", "รอกและเชือกวินซ์", "ชุด LIFT รุ่น 115 kV", "ชุดยึดฐานเครน",
  "ปั๊มน้ำมันไฮดรอลิค", "ชุดมอเตอร์และเฟืองหมุนฐานเครน", "ชุด CONTROL ล่าง", "ชุดกระบอก เทน้ำ-ปรับดิ่ง",
  "จุดเชื่อมต่อโครงสร้าง BOOM", "สายน้ำมันไฮดรอลิค", "ชุด CONTROL บน", "กระบอกปรับบิด",
  "BUCKET, LINER, ชุดการ์ดครอบ", "ระบบ EMERGENCY", "ระบบเร่งเครื่องยนต์", "สายสัญญาณต่างๆ",
];
export type InspectStatus = "OK" | "FIX";
export const INSPECT_STATUS_LABEL: Record<InspectStatus, string> = { OK: "ปกติ", FIX: "ต้องแก้ไข" };
export interface InspectItem {
  label: string;
  status?: InspectStatus;
  note: string;
  custom?: boolean;
}
export const freshInspect = (): InspectItem[] => EQUIP_INSPECT_ITEMS.map((label) => ({ label, note: "" }));

export interface PreAssessment {
  receipt: ReceiptItem[];
  sign: SignPair;
  items: InspectItem[];
  analysis: string; // ผลวิเคราะห์อาการ (Overhaul)
  photos?: string[];
  confirmedAt?: string;
  confirmedBy?: string;
}
export const freshPreAssessment = (): PreAssessment => ({
  receipt: RECEIPT_ITEMS.map((label) => ({ label, damaged: false, wrongModel: false, note: "" })),
  sign: freshSign(),
  items: freshInspect(),
  analysis: "",
});

// ---------- ประวัติการซ่อมย้อนหลังรายคัน (JO 7.4.1-05 · 7.2.2-04) ----------
// ⚠️ ข้อมูลจำลอง — ยก 2 รายการของ 82-6789 ขอนแก่น มาจาก VEHICLE_REPAIR_HISTORY ใน mock/Maintenance-Request-Form.html
// ตรงตัว (ทะเบียนซ้ำกับรถ v01 ของแอปพอดี) · คันอื่นยังไม่มีประวัติ ไม่แต่งเพิ่ม
export interface RepairRecord {
  no: string;
  plate: string;
  date: string;
  syms: string[];
  detail?: string;
  usedParts: { name: string; qty: number; unit: string }[];
  by: string;
  hours?: number;
  odo?: number;
}
export const REPAIR_HISTORY: RepairRecord[] = [
  {
    no: "MTD-690610-007", plate: "82-6789 ขอนแก่น", date: "9 มิ.ย. 2569",
    syms: ["บูมยืด-หดสะดุด"], detail: "อัดจาระบีรางสไลด์ + เปลี่ยนชุดซีล ทดสอบยืด-หดปกติ",
    usedParts: [{ name: "ชุดซีลกระบอกไฮดรอลิก", qty: 1, unit: "ชุด" }, { name: "จาระบี EP2", qty: 2, unit: "หลอด" }],
    by: "กบค.", hours: 3120, odo: 83450,
  },
  {
    no: "MTD-690412-045", plate: "82-6789 ขอนแก่น", date: "12 เม.ย. 2569",
    syms: ["ยางหน้าซ้ายสึกผิดปกติ"], detail: "เปลี่ยนยางคู่หน้า + ตั้งศูนย์ถ่วงล้อ",
    usedParts: [{ name: "ยาง 825R16", qty: 2, unit: "เส้น" }],
    by: "อู่ภายนอก (อู่ช่างเอก ขอนแก่น)", hours: 2980, odo: 80120,
  },
];
export const historyOf = (plate: string) => REPAIR_HISTORY.filter((r) => r.plate === plate);

// ---------- ④ ดำเนินการ Overhaul ----------
// ตามภาพระบบจริง: "ผลการตรวจสอบอาการเพิ่มเติม" ไม่พบ/พบอาการเพิ่ม → "ซ่อมเสร็จสิ้น"
// พบอาการเพิ่ม → ข้อมูลอาการที่พบ + ไม่เบิก/เบิกอะไหล่ (figma/ดำเนินการซ่อม - จัดที่สำนักงาน-พบอาการเพิ่ม-เบิกอะไหล่.svg)
// + ของ Overhaul (JO 7.4.2-02): รายการงานเครื่องมือกล · ผู้ดำเนินการ · วันเริ่ม-สิ้นสุด (ค่าแรงกรอกที่ ⑦)
export interface WorkItem {
  title: string;
  by: string;
  start: string;
  end: string;
  done: boolean;
}
export interface WorkStep {
  found?: boolean; // พบอาการเพิ่ม
  foundNote: string;
  needParts?: boolean; // เบิกอะไหล่เพิ่ม
  extraParts: PartLine[];
  items: WorkItem[];
  confirmedAt?: string;
}

// ---------- ⑥ ตรวจสภาพหลัง Overhaul (7.4.2-04) ----------
// ตามภาพระบบจริง: ข้อมูลยานพาหนะ + เลขไมล์/ชั่วโมงปัจจุบัน → ตรวจ 24 ข้อ → ลงนามการส่งคืนรถ
// → คะแนนประเมินคุณภาพงานซ่อมบำรุง 1–5 → รายการสภาพวัสดุอะไหล่ (จำนวนที่ใช้ · ที่คืน = เบิก − ใช้ · ราคา)
// + ของ Overhaul: ทดสอบความปลอดภัย + ใบรับรอง + รับประกัน 180 วัน + ภาพหลัง
// ⚠️ รายการทดสอบความปลอดภัย + แบบฟอร์มใบรับรองเป็นของจำลอง
export const SAFETY_TESTS = [
  "ทดสอบยกน้ำหนักตามพิกัด (Load Test)",
  "ทดสอบระบบหยุดฉุกเฉิน (Emergency Stop)",
  "ทดสอบความเป็นฉนวนของบูม/กระเช้า",
  "ทดสอบระบบล็อกและวาล์วกันตก",
];
export const WARRANTY_DAYS = 180;
export interface PostStep {
  odo: string;
  hours: string;
  items: InspectItem[];
  sign: SignPair; // ลงนามการส่งคืนรถ
  rating?: number; // คะแนนประเมินคุณภาพ 1–5 (JO 7.2.4-09)
  used: Record<string, number>; // code → จำนวนที่ใช้จริง (ตั้งต้น = จำนวนเบิก)
  tests: { label: string; pass?: boolean }[];
  photos: string[];
  certNo?: string;
  certDate?: string;
  confirmedAt?: string;
  confirmedBy?: string;
}
export const addDays = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString();
};

// อะไหล่ทั้งหมดที่เบิกให้คันนี้ (① + เบิกเพิ่มตอน ④) รวมตามรหัส
export function issuedParts(pv: PlanVehicle): PartLine[] {
  const m = new Map<string, PartLine>();
  for (const l of [...(pv.parts?.items ?? []), ...(pv.work?.extraParts ?? [])]) {
    const cur = m.get(l.code);
    m.set(l.code, cur ? { ...cur, qty: cur.qty + l.qty } : { ...l });
  }
  return [...m.values()];
}
export const usedQty = (pv: PlanVehicle, code: string, issued: number) => pv.post?.used[code] ?? issued;

// ---------- ⑦ รายงานปิดงาน (7.4.2-06, 08, 10) ----------
// ตามภาพระบบจริง: ข้อมูลเอกสาร → รายการสภาพวัสดุอะไหล่ (+ จำนวนอะไหล่เก่า · หมายเหตุ) → บันทึกตรวจสอบเอกสารปิดงาน 15 ข้อ
// (มี/ไม่มี/ไม่ต้องใช้ + แนบเอกสาร) → "ส่งอนุมัติ" · ไม่มี "บันทึกข้อตกลงลูกค้า" เพราะ Overhaul มาจากแผนของ กบค. เอง
// + ของ Overhaul: ค่าแรงรายงาน (02) · ค่าใช้จ่ายเทียบมูลค่าที่ได้มา (06)
// 15 ข้อยก CLOSE_CHECKLIST จาก mock (ตรงกับภาพระบบจริง)
export const CLOSE_DOCS = [
  "บันทึกสั่งงาน/สำเนาบันทึกสั่งงาน", "บันทึกรับงานเข้างาน", "ใบเบิกของ", "ใบส่งของคลัง",
  "สำเนาอนุมัติหลักการจัดซื้อ", "สำเนาบิลส่งของเรื่องจัดซื้อ", "สำเนาอนุมัติหลักการจัดจ้าง", "สำเนาบิลส่งของเรื่องจัดจ้าง",
  "บันทึกการตรวจสอบวัสดุอะไหล่", "สำเนาใบส่งคืนคลังพัสดุ", "บันทึกการตรวจสภาพบำรุงรักษา", "บันทึกทดสอบก่อนซ่อม/หลังซ่อม",
  "รายงานออกปฏิบัติงานส่วนภูมิภาค", "เรื่องแจ้งงานเสร็จ", "เรื่องแจ้งงดซ่อม",
];
export type DocStatus = "HAS" | "NONE" | "NA";
export const DOC_STATUS_LABEL: Record<DocStatus, string> = { HAS: "มี", NONE: "ไม่มี", NA: "ไม่ต้องใช้" };
export interface CloseStep {
  oldParts: Record<string, number>; // จำนวนอะไหล่เก่า
  partNotes: Record<string, string>;
  labor?: (number | null)[]; // ค่าแรงรายงาน (ตำแหน่งตรงกับ work.items)
  docs: { status?: DocStatus; file?: string }[];
  submittedAt?: string; // ส่งอนุมัติแล้ว
  approvedAt?: string; // อนุมัติปิดงาน = ปิดงานแล้ว
  approvedBy?: string;
  rejectReason?: string;
}
export const freshClose = (): CloseStep => ({ oldParts: {}, partNotes: {}, docs: CLOSE_DOCS.map(() => ({})) });
export const laborTotal = (c?: CloseStep) => (c?.labor ?? []).reduce<number>((s, n) => s + (n ?? 0), 0);
export function costSummary(pv: PlanVehicle, v: Vehicle) {
  const parts = issuedParts(pv).reduce((s, l) => s + partInfo(l).price * usedQty(pv, l.code, l.qty), 0);
  const labor = laborTotal(pv.close);
  const total = parts + labor;
  return { parts, labor, total, value: v.acquisitionValue, pct: v.acquisitionValue ? (total / v.acquisitionValue) * 100 : 0 };
}

// ---------- ความคืบหน้ารายคัน ----------
export const STEPS = ["เบิกอะไหล่", "นัดหมายวันซ่อม", "ตรวจสภาพก่อน Overhaul", "ดำเนินการ Overhaul", "นัดหมายวันคืนรถ", "ตรวจสภาพหลัง Overhaul", "รายงานปิดงาน"];
// ขั้นที่กำลังทำ (0–6) · 7 = ปิดงานแล้ว
export const currentStep = (pv: PlanVehicle) =>
  !pv.parts?.confirmedAt ? 0
  : !pv.appt?.confirmedAt ? 1
  : !pv.preAssessment?.confirmedAt ? 2
  : !pv.work?.confirmedAt ? 3
  : !pv.ret?.confirmedAt ? 4
  : !pv.post?.confirmedAt ? 5
  : !pv.close?.approvedAt ? 6
  : 7;

// ป้ายสถานะตามขั้น — ถ้อยคำแบบป้ายในระบบจริง ("รอตรวจสภาพก่อนซ่อม" · "ดำเนินการซ่อม" · "รอต้นทางยืนยันรับรถ" ฯลฯ)
export type ExecStage =
  | "NOT_STARTED" | "PARTS" | "APPT" | "APPT_WAIT" | "PRE" | "WORK" | "RET" | "RET_WAIT" | "POST" | "CLOSE" | "CLOSE_WAIT" | "CLOSED";
export const STAGE_ORDER: ExecStage[] = [
  "NOT_STARTED", "PARTS", "APPT", "APPT_WAIT", "PRE", "WORK", "RET", "RET_WAIT", "POST", "CLOSE", "CLOSE_WAIT", "CLOSED",
];
export function execStage(pv: PlanVehicle): ExecStage {
  const i = currentStep(pv);
  if (i === 0) return pv.parts ? "PARTS" : "NOT_STARTED";
  if (i === 1) return pv.appt?.sentAt ? "APPT_WAIT" : "APPT";
  if (i === 2) return "PRE";
  if (i === 3) return "WORK";
  if (i === 4) return pv.ret?.sentAt ? "RET_WAIT" : "RET";
  if (i === 5) return "POST";
  if (i === 6) return pv.close?.submittedAt ? "CLOSE_WAIT" : "CLOSE";
  return "CLOSED";
}
export const EXEC_STAGE_LABEL: Record<ExecStage, string> = {
  NOT_STARTED: "ยังไม่เริ่ม",
  PARTS: "รอเบิกอะไหล่",
  APPT: "รอนัดหมายวันซ่อม",
  APPT_WAIT: "รอต้นทางยืนยันนัดหมาย",
  PRE: "รอตรวจสภาพก่อน Overhaul",
  WORK: "ดำเนินการ Overhaul",
  RET: "รอนัดหมายวันคืนรถ",
  RET_WAIT: "รอต้นทางยืนยันรับรถ",
  POST: "รอ กบค. ตรวจสภาพหลัง Overhaul",
  CLOSE: "รอ กบค. ส่งรายงานปิดงาน",
  CLOSE_WAIT: "รออนุมัติปิดงาน",
  CLOSED: "ปิดงานแล้ว",
};
export const EXEC_STAGE_BADGE: Record<ExecStage, string> = {
  NOT_STARTED: "b-neutral",
  PARTS: "b-low",
  APPT: "b-low",
  APPT_WAIT: "b-low",
  PRE: "b-low",
  WORK: "b-info",
  RET: "b-low",
  RET_WAIT: "b-low",
  POST: "b-low",
  CLOSE: "b-low",
  CLOSE_WAIT: "b-low",
  CLOSED: "b-ok",
};

// ประวัติการดำเนินการ (แท็บ "ประวัติการดำเนินการ" แบบระบบจริง)
export interface LogEntry {
  t: string; // ISO
  label: string;
}
export const execUpdatedAt = (pv: PlanVehicle) => pv.log?.[pv.log.length - 1]?.t;

// ความคืบหน้าระดับแผน — นับคันที่ปิดงานรายคันแล้ว (หัวหน้าอนุมัติรายงานปิดงานขั้น ⑦)
export const planProgress = (plan: OverhaulPlan) => ({
  done: plan.vehicles.filter((pv) => !!pv.close?.approvedAt).length,
  total: plan.vehicles.length,
});
