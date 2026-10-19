/** Figma: `Section header` (Breakpoint=Desktop|Mobile) — Title 20/SemiBold ดำ + Badge (`Badge outline` นับจำนวน) + Supporting text 14 gray-600 + Actions
 *  **Divider = ปิด** (เจ้าของงานปิด divider ทั้งหมด 19 ต.ค. 2569)
 *  🔴 ใช้เฉพาะหน้า "สร้าง/แก้ไข" (ฟอร์ม) — หน้ารายละเอียดใช้ <SectionLabel> แทน (เจ้าของงานเคาะ 19 ต.ค. 2569)
 *  ค่าเทียบ components.css .sect (ตัดเส้นคั่น + padding ล่างของเส้นออก) · ระยะ Text↔Supporting 8 · Content gap 12 ตามไลบรารี */
import type { ReactNode } from "react";
import { Badge } from "./Badge";
import { cx } from "./cx";

export interface SectionHeaderProps {
  title: ReactNode;
  /** ตัวนับต่อท้ายชื่อ (Badge outline ทรงเหลี่ยม) */
  count?: number;
  subtitle?: ReactNode;
  /** ปุ่มชิดขวา */
  right?: ReactNode;
  /** ใส่ id ให้ <h2> (ผูก aria-labelledby ของ section) */
  id?: string;
  className?: string;
}

export function SectionHeader({ title, count, subtitle, right, id, className }: SectionHeaderProps) {
  return (
    <div className={cx("mt-2 mb-4 flex items-start gap-3 max-md:flex-col max-md:gap-5", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-3">
          <h2 id={id} className="text-lg font-semibold text-black">{title}</h2>
          {count != null && <Badge square>{count}</Badge>}
        </div>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-3 max-md:w-full">{right}</div>}
    </div>
  );
}
