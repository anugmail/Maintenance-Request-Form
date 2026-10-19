/** Figma: `Empty state/Data empty` · `Empty state/Search not found` (หน้า Table 2-14) — ใช้แทนตารางทั้งก้อน
 *  ตาม `Contract list - Empty state` / `Contract list - Search not found` ของ UI Release#2 (5.1)
 *  ค่าเทียบ components.css .filter-empty (สูงขั้นต่ำ 170 · ขอบประ gray-300 · r12 · พื้น gray-50 · pad 24 · ไอคอน 32 gray-400 ·
 *  หัวข้อ 16 gray-700 · ข้อความ 14 gray-500 · ปุ่มห่าง 8) */
import type { ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./cx";

export interface EmptyStateProps {
  /** empty = ยังไม่มีข้อมูล (inventory_2) · notFound = ค้น/กรองไม่เจอ (search_off) */
  kind?: "empty" | "notFound";
  icon?: string;
  title: ReactNode;
  description?: ReactNode;
  /** ปุ่ม (ขนาด sm) เช่น "ล้างคำค้นและตัวกรอง" */
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ kind = "empty", icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        "flex min-h-[170px] flex-col items-center justify-center gap-[5px] rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-gray-500",
        className,
      )}
    >
      <Icon name={icon ?? (kind === "notFound" ? "search_off" : "inventory_2")} size={32} className="mb-[3px] text-gray-400" />
      <b className="text-md font-bold text-gray-700">{title}</b>
      {description && <span className="text-sm">{description}</span>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
