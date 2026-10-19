"use client";
/** Figma: `Table` (Alternating fills=True|False · Pagination=True) ของไฟล์ Component (Table 2-14) — ทำทั้ง component (คำสั่งเจ้าของงาน 19 ต.ค. 2569):
 *    Table = แนวตั้ง gap 20 → [Content with scrollbar (ตาราง + แถบเลื่อนแนวนอน gap 12)] + [`Table pagination`]
 *    ไม่มีกรอบ/เงารอบตาราง · `Table header cell` h44 พื้น gray-100 pad 12/16 14/600 ดำ (หัวแรก/สุดท้ายโค้ง 8) + `Sort icon` (Swap/Up/Down)
 *    `Table cell` h56 pad 8/16 เส้นล่าง gray-200 14 ดำ · Style=Lead text (คอลัมน์แรก หนา) / Badge / Action icons (`Tertiary button` more_horiz)
 *    Alternating fills = แถวคู่ gray-50
 *  มือถือ (< 768): `Mobile table` (การ์ด r8 ขอบ gray-300 pad บน 4 · การ์ดห่างกัน 12) + `Mobile table item` (h40 pad 8/12 · หัว 14/600 ซ้าย ·
 *    ค่า 14 ชิดขวา · เส้นล่าง gray-200 · แถวสุดท้าย = ปุ่ม action) + `Table pagination` Breakpoint=Mobile
 *  ค่าเทียบ components.css .tblwrap .tbl .tbl.striped th.sortable .cell-key .num .dt-action (+ .tbl-cards แต่ยึดค่าจาก Mobile table ของไลบรารี) */
import { useMemo, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { Pagination } from "./Pagination";
import { RowMenu, type RowMenuItem } from "./RowMenu";
import { cx } from "./cx";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  /** เปิดปุ่มเรียงบนหัวคอลัมน์ */
  sortable?: boolean;
  /** ค่าที่ใช้เรียง (ค่าตั้งต้น row[key]) */
  sortValue?: (row: T) => string | number;
  /** คอลัมน์ตัวเลข — กลาง + ตัวหนา (.num) */
  numeric?: boolean;
  /** Table cell Style=Lead text (.cell-key) */
  lead?: boolean;
  /** utility ความกว้าง เช่น "w-[160px]" */
  width?: string;
  /** หัวข้อบนการ์ดมือถือ (ค่าตั้งต้น = header ถ้าเป็นข้อความ) */
  mobileLabel?: string;
  /** ซ่อนบนการ์ดมือถือ */
  hideOnMobile?: boolean;
}

export type SortState = { key: string; dir: 1 | -1 };

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  /** Alternating fills (ค่าตั้งต้น true ตามหน้ารายการจริง) */
  striped?: boolean;
  /** เรียงแบบควบคุมจากภายนอก — ไม่ใส่ = เรียงเองภายใน */
  sort?: SortState | null;
  onSortChange?: (s: SortState) => void;
  defaultSort?: SortState;
  /** เมนู "…" ท้ายแถว */
  rowMenu?: (row: T) => RowMenuItem[];
  rowMenuLabel?: (row: T) => string;
  /** แสดงแทนตารางเมื่อไม่มีแถว (EmptyState) */
  empty?: ReactNode;
  /** Table pagination — false = ปิด · ค่าตั้งต้นเปิด 10 แถว/หน้า */
  pagination?: boolean | { pageSize?: number };
  /** บังคับแสดงแบบการ์ดมือถือ (แกลเลอรี) */
  forceCards?: boolean;
  /** aria-label ของตาราง */
  caption?: string;
  className?: string;
}

function defaultSortValue<T>(row: T, key: string): string | number {
  const v = (row as Record<string, unknown>)[key];
  return typeof v === "number" ? v : String(v ?? "");
}

export function DataTable<T>({
  columns, rows, rowKey, striped = true, sort, onSortChange, defaultSort, rowMenu, rowMenuLabel, empty, pagination = true, forceCards, caption, className,
}: DataTableProps<T>) {
  const [innerSort, setInnerSort] = useState<SortState | null>(defaultSort ?? null);
  const s = sort !== undefined ? sort : innerSort;
  const paged = pagination !== false;
  const [pageSize, setPageSize] = useState(typeof pagination === "object" && pagination.pageSize ? pagination.pageSize : 10);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!s) return rows;
    const col = columns.find((c) => c.key === s.key);
    const val = (r: T) => (col?.sortValue ? col.sortValue(r) : defaultSortValue(r, s.key));
    return [...rows].sort((a, b) => {
      const x = val(a), y = val(b);
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "th");
      return c * s.dir;
    });
  }, [rows, s, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const cur = Math.min(page, pages);
  const visible = paged ? sorted.slice((cur - 1) * pageSize, cur * pageSize) : sorted;

  const toggleSort = (key: string) => {
    const next: SortState = s && s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: 1 };
    if (onSortChange) onSortChange(next);
    if (sort === undefined) setInnerSort(next);
  };

  if (!rows.length && empty) return <>{empty}</>;

  const pager = paged && (
    <Pagination
      page={cur}
      pageSize={pageSize}
      total={sorted.length}
      onPageChange={setPage}
      onPageSizeChange={(n) => {
        setPageSize(n);
        setPage(1);
      }}
    />
  );

  const label = (c: Column<T>) => c.mobileLabel ?? (typeof c.header === "string" ? c.header : c.key);

  return (
    <div className={cx("flex flex-col gap-5", className)}>
      {/* ---------- desktop: Table ---------- */}
      <div className={cx("overflow-x-auto overflow-y-hidden", forceCards ? "hidden" : "max-md:hidden")}>
        <table aria-label={caption} className="w-full border-separate border-spacing-0 text-black">
          <thead>
            <tr>
              {columns.map((c) => {
                const on = s?.key === c.key;
                const thCls = cx(
                  "h-11 bg-gray-100 text-sm leading-[21px] font-semibold tracking-[-0.2px] whitespace-nowrap text-black first:rounded-l-md last:rounded-r-md",
                  c.numeric ? "text-center" : "text-left",
                  c.sortable ? "p-0" : "px-4 py-3",
                  c.width,
                );
                return (
                  <th key={c.key} scope="col" className={thCls} aria-sort={c.sortable ? (on ? (s!.dir > 0 ? "ascending" : "descending") : "none") : undefined}>
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        className="inline-flex h-14 w-full cursor-pointer items-center gap-2 rounded-[inherit] px-4 py-3 text-left font-semibold hover:bg-gray-200"
                      >
                        {c.header}
                        <Icon name={on ? (s!.dir > 0 ? "arrow_upward" : "arrow_downward") : "swap_vert"} size={16} className={on ? "text-gray-700" : "text-gray-400"} />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                );
              })}
              {rowMenu && <th scope="col" aria-label="จัดการ" className="h-11 w-[72px] bg-gray-100 px-4 py-3 last:rounded-r-md" />}
            </tr>
          </thead>
          <tbody>
            {visible.map((r, i) => {
              const bg = striped && i % 2 === 1 ? "bg-gray-50" : "bg-white";
              const td = cx("border-b border-gray-200 px-4 py-2 align-middle text-sm leading-[21px] tracking-[-0.2px] text-black", bg, striped ? "group-hover:bg-gray-100" : "group-hover:bg-gray-50");
              return (
                <tr key={rowKey(r)} className="group">
                  {columns.map((c) => (
                    <td key={c.key} className={cx(td, c.numeric && "text-center font-semibold", c.lead && "font-semibold", c.width)}>
                      {c.cell(r, i)}
                    </td>
                  ))}
                  {rowMenu && (
                    <td className={td}>
                      <div className="flex justify-center gap-1">
                        <RowMenu items={rowMenu(r)} label={rowMenuLabel ? rowMenuLabel(r) : "จัดการ"} />
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------- มือถือ: Mobile table ---------- */}
      <div className={cx("flex flex-col gap-3", forceCards ? "" : "md:hidden")}>
        {visible.map((r, i) => (
          <div key={rowKey(r)} className="overflow-hidden rounded-md border border-gray-300 bg-white pt-1">
            {columns
              .filter((c) => !c.hideOnMobile)
              .map((c) => (
                <div key={c.key} className="flex min-h-10 items-center gap-2 border-b border-gray-200 px-3 py-2 last:border-b-0">
                  <span className="w-1/2 shrink-0 text-sm leading-[21px] font-semibold text-black">{label(c)}</span>
                  <span className={cx("flex w-1/2 min-w-0 justify-end text-right text-sm leading-[21px] text-black", c.lead && "font-medium")}>{c.cell(r, i)}</span>
                </div>
              ))}
            {rowMenu && (
              <div className="flex min-h-10 items-center justify-end px-3 py-1">
                <RowMenu items={rowMenu(r)} label={rowMenuLabel ? rowMenuLabel(r) : "จัดการ"} forceSheet={forceCards} />
              </div>
            )}
          </div>
        ))}
      </div>

      {pager}
    </div>
  );
}
