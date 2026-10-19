/** Figma: `Section label` (Breakpoint=Desktop|Mobile) ของไฟล์ Component (หน้า 2011-6955)
 *  Label 16/SemiBold ดำ (สูง 24) · Supporting text 12/Regular gray-600 ห่าง 4 · Content gap 12 จัดกลางแนวตั้ง ·
 *  Actions = Primary action (`Tertiary brand button`) · Secondary action (`Tertiary button`) สูง 40 ชิดขวา
 *  **Info icon = ปิด · More actions = ปิด · ไม่มี Badge** (กติกา R5 figma-export/component-rules.md · 19 ต.ค. 2569)
 *  🔴 ใช้กับหัวข้อแต่ละส่วนของ "หน้ารายละเอียด" — หน้าสร้าง/แก้ไขใช้ <SectionHeader> (เจ้าของงานเคาะ 19 ต.ค. 2569)
 *  components.css ยังไม่มีคลาสนี้ — ค่าอ่านจาก design-system/.figma-extract/component/2011-6955.json */
import type { ReactNode } from "react";
import { cx } from "./cx";

export interface SectionLabelProps {
  title: ReactNode;
  /** จำนวนต่อท้ายชื่อเป็น "(n)" — Section label ไม่มี Badge (กติกา R5 · wireframe "รายการรถ (จำนวน xx)") */
  count?: number;
  subtitle?: ReactNode;
  /** ปุ่ม Tertiary / Tertiary brand ชิดขวา */
  right?: ReactNode;
  id?: string;
  className?: string;
}

export function SectionLabel({ title, count, subtitle, right, id, className }: SectionLabelProps) {
  return (
    <div className={cx("mb-3 flex min-h-10 items-center gap-3", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-1">
          <h2 id={id} className="text-md font-semibold text-black">
            {title}
            {count != null && ` (${count})`}
          </h2>
        </div>
        {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center">{right}</div>}
    </div>
  );
}
