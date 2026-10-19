"use client";
/** Figma: `Table pagination` (Breakpoint=Desktop|Mobile) ของไฟล์ Component (Pagination 2-15)
 *  = Container (ข้อความ "แสดง a ถึง b จาก n รายการ" 14 ดำ + `Items per page dropdown` = `Input dropdown` 92×40 · gap 8)
 *  + Pagination (กรอบ r8 ขอบ gray-300 · `Button groups pagination item` 40×40 ขอบกั้น gray-300 · 14 gray-600 ·
 *    Hover/Active พื้น gray-200 · Previous/Next = keyboard_arrow_left/right 20 (Disabled gray-400 · ปกติ gray-500))
 *  Desktop: แถวเดียว ข้อความซ้าย ปุ่มหน้าขวา (gap 24) · Mobile: ปุ่มหน้าบน ข้อความล่าง จัดกลาง (gap 16)
 *  ⚠ components.css .pager เป็นปุ่มแยกกัน (runtime) — ยึดไลบรารีตามคำสั่ง 19 ต.ค. 2569 "ทำทั้ง component Table" */
import { Icon } from "./Icon";
import { cx } from "./cx";

export interface PaginationProps {
  /** หน้าเริ่มที่ 1 */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizes?: number[];
  className?: string;
}

/** เลขหน้าที่แสดง — เกิน 7 หน้าแทรก "..." */
function pageList(page: number, pages: number): Array<number | "..."> {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: Array<number | "..."> = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);
  if (from > 2) out.push("...");
  for (let i = from; i <= to; i++) out.push(i);
  if (to < pages - 1) out.push("...");
  out.push(pages);
  return out;
}

const ITEM = "flex size-10 shrink-0 items-center justify-center border-l border-gray-300 first:border-l-0 text-sm text-gray-600";

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange, pageSizes = [10, 25, 50], className }: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(total, page * pageSize);
  return (
    <div className={cx("flex items-center justify-between gap-6 max-md:flex-col-reverse max-md:gap-4", className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm text-black">
          แสดง {from} ถึง {to} จาก {total} รายการ
        </span>
        <span className="relative inline-flex">
          <select
            aria-label="จำนวนแถวต่อหน้า"
            value={pageSize}
            onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            className="h-10 w-[92px] cursor-pointer appearance-none rounded-md border border-gray-300 bg-white pr-8 pl-3 text-md text-gray-900 shadow-field outline-none focus:border-brand-800 focus:shadow-field-focus"
          >
            {[...new Set([...pageSizes, pageSize])].sort((a, b) => a - b).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <Icon name="keyboard_arrow_down" size={20} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500" />
        </span>
      </div>
      <nav aria-label="เลขหน้า" className="flex overflow-hidden rounded-md border border-gray-300 bg-white">
        <button
          type="button"
          aria-label="หน้าก่อน"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className={cx(ITEM, page <= 1 ? "cursor-not-allowed text-gray-400" : "cursor-pointer text-gray-500 hover:bg-gray-200")}
        >
          <Icon name="keyboard_arrow_left" size={20} />
        </button>
        {pageList(page, pages).map((p, i) =>
          p === "..." ? (
            <span key={"e" + i} className={ITEM}>...</span>
          ) : (
            <button
              key={p}
              type="button"
              aria-current={p === page ? "page" : undefined}
              onClick={() => onPageChange(p)}
              className={cx(ITEM, "cursor-pointer", p === page ? "bg-gray-200" : "bg-white hover:bg-gray-200")}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          aria-label="หน้าถัดไป"
          disabled={page >= pages}
          onClick={() => onPageChange(page + 1)}
          className={cx(ITEM, page >= pages ? "cursor-not-allowed text-gray-400" : "cursor-pointer text-gray-500 hover:bg-gray-200")}
        >
          <Icon name="keyboard_arrow_right" size={20} />
        </button>
      </nav>
    </div>
  );
}
