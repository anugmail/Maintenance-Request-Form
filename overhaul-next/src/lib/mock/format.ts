/* รูปแบบตัวเลข/วันที่ — ตามหน้าจริง (UI Release#2 Contract list: 09/08/2565 = ปี พ.ศ.)
   พอร์ตจาก oh2Money · oh2Num · oh2Date · oh2Size ใน design-mock/overhaul-v2-mock.js */

/** 10000000 → "10,000,000" */
export function fmtMoney(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString("th-TH");
}

/** 182400 → "182,400" */
export function fmtNum(n: number | null | undefined): string {
  return Number(n || 0).toLocaleString("th-TH");
}

/** "2026-08-12" → "12/08/2569" · ว่าง → "—" */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${Number(y) + 543}`;
}

/** "2026-08-12T09:30" → "12/08/2569 09:30" */
export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const time = iso.length > 10 ? iso.slice(11, 16) : "";
  return time ? `${fmtDate(iso)} ${time}` : fmtDate(iso);
}

/** ช่วงวันที่ "12/08/2569 – 14/08/2569" */
export function fmtDateRange(from?: string, to?: string): string {
  if (!from && !to) return "—";
  return `${fmtDate(from)} – ${fmtDate(to)}`;
}

/** ขนาดไฟล์ 842000 → "822 KB" · ≥ 1 MB → "1.2 MB" */
export function fmtSize(bytes: number): string {
  return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";
}

/** ISO yyyy-mm-dd ของวันนี้ (เวลาเครื่อง) */
export function todayIso(): string {
  return isoDate(new Date());
}

export function isoDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** วันนี้ ± n วัน เป็น ISO date (oh2Add) */
export function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return isoDate(d);
}

/** ปีงบประมาณ พ.ศ. ตั้งแต่ปีปัจจุบันนับไปข้างหน้า ไม่มีปีย้อนหลัง (userflow Create Plan) */
export function budgetYears(n = 5): number[] {
  const y = new Date().getFullYear() + 543;
  return Array.from({ length: n }, (_, i) => y + i);
}

/** แปลงข้อความเงิน "1,250,000.50" → 1250000.5 (ว่าง/ไม่ใช่ตัวเลข → NaN) */
export function parseMoney(s: string): number {
  const t = s.replace(/[,\s]/g, "");
  return t === "" ? NaN : Number(t);
}
