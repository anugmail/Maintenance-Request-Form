/** Figma: `Content item row` + `_Content item base` (Type=Text with label) — กล่องแสดงข้อมูลอ่านอย่างเดียวของหน้ารายละเอียด
 *  🔴 กติกาเจ้าของงาน 19 ต.ค. 2569 (ตามตัวอย่าง Maintain-D "Flow การซ่อม" → VehicleInfo › Content):
 *     กล่องพื้น gray-50 (Color/surface/secondary-subtle) · r8 · pad 24 · ระยะแถว 24 · 4 ช่องต่อแถวบน desktop (มือถือ 2) ·
 *     แต่ละช่อง = label (เล็ก ตัวหนา สีเทา) อยู่บนค่า · ไม่มีไอคอนนำหน้า
 *  หน้ารายละเอียด: <SectionLabel> เป็นหัวข้อ + กล่องนี้
 *  ค่าเทียบ components.css .incident-summary (พื้น gray-50 · r8 · pad 24 · row-gap 24) + .incident-field dt/dd (14/600 · 16/400) */
import type { ReactNode } from "react";
import { cx } from "./cx";

export interface KeyValueItem {
  label: ReactNode;
  value: ReactNode;
  /** กินเต็มแถว (เช่น หมายเหตุยาว) */
  wide?: boolean;
}

export interface KeyValueGridProps {
  items: KeyValueItem[];
  /** ช่องต่อแถวบนจอ ≥ 768 (ค่าตั้งต้น 4) · มือถือ 2 เสมอ */
  columns?: 2 | 3 | 4;
  className?: string;
}

const COLS = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" } as const;

export function KeyValueGrid({ items, columns = 4, className }: KeyValueGridProps) {
  return (
    <dl className={cx("grid grid-cols-2 gap-x-6 gap-y-6 rounded-md bg-gray-50 p-6", COLS[columns], className)}>
      {items.map((it, i) => (
        <div key={i} className={cx("min-w-0", it.wide && "col-span-full")}>
          <dt className="mb-0.5 text-sm font-semibold text-gray-600">{it.label}</dt>
          <dd className="m-0 text-md break-words text-black">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
