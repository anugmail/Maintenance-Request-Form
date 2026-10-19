"use client";
/** Figma (desktop): `Side panel` = `Background overlay` + `Side panel header` (`Featured icon` Color=Gray Size=md + "ตัวกรอง" + Supporting text)
 *    + เนื้อหา (pad 24 · gap 24) + `Side panel footer` (`Tertiary brand button` "ล้างตัวกรอง" ซ้าย · `Secondary button` "ยกเลิก" + `Primary button` "ตกลง" ขวา)
 *    ตาม `Filter Side panel / 060605` ของ UI Release#2 (5.1) · Tabs ซ่อน
 *  Figma (มือถือ): `Bottom sheet` Type=Filter (หัว "ตัวกรอง" + action "ล้างตัวกรอง" · ท้าย ยกเลิก/ตกลง แบ่งเท่ากัน)
 *  ค่าเทียบ components.css .filter-drawer .filter-drawer-sheet (w480) .filter-drawer-head .filter-drawer-icon .filter-drawer-title .filter-drawer-body .filter-drawer-foot
 *  เส้นคั่นหัว/ท้ายปิด (ปิด divider ทั้งหมด 19 ต.ค. 2569)
 *  FilterChips: `Badge outline with remove icon` Color=Brand (แถว Filters ของ `Table header` · gap 12) — components.css .fchips .fchip .fchip-x */
import { useId, type ReactNode } from "react";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { BottomSheet, FeaturedIcon, Portal, useOverlay } from "./Modal";
import { useIsMobile } from "./useMediaQuery";
import { cx } from "./cx";

export interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  /** auto = bottom sheet บนจอ < 768 · sheet = บังคับ (แกลเลอรี) */
  mode?: "auto" | "sheet" | "drawer";
}

export function FilterPanel({
  open, onClose, onApply, onClear, title = "ตัวกรอง", description = "กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ", children, mode = "auto",
}: FilterPanelProps) {
  const mobile = useIsMobile();
  const sheet = mode === "sheet" || (mode === "auto" && mobile);
  const tid = useId();
  useOverlay(open && !sheet, onClose);
  if (!open) return null;

  if (sheet) {
    return (
      <BottomSheet
        open
        onClose={onClose}
        title={title}
        headerAction={<Button variant="tertiaryBrand" onClick={onClear}>ล้างตัวกรอง</Button>}
        footer={
          <>
            <Button variant="secondary" size="lg" onClick={onClose}>ยกเลิก</Button>
            <Button variant="primary" size="lg" onClick={onApply}>ตกลง</Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">{children}</div>
      </BottomSheet>
    );
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-70 flex justify-end bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div role="dialog" aria-modal="true" aria-labelledby={tid} className="flex h-full w-[min(480px,100%)] animate-drawer-in flex-col bg-white">
          <div className="flex items-center gap-4 p-6">
            <FeaturedIcon name="filter_list" tone="gray" />
            <div className="min-w-0 flex-1">
              <h2 id={tid} className="text-md font-bold text-black">{title}</h2>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
            <button type="button" aria-label="ปิดตัวกรอง" onClick={onClose} className="cursor-pointer rounded-md p-1 text-gray-500 hover:bg-gray-100 focus-visible:shadow-ring focus-visible:outline-none">
              <Icon name="close" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 pb-6">{children}</div>
          <div className="mt-auto flex items-center justify-end gap-3 px-6 py-4">
            <Button variant="tertiaryBrand" onClick={onClear} className="mr-auto">ล้างตัวกรอง</Button>
            <Button variant="secondary" onClick={onClose}>ยกเลิก</Button>
            <Button variant="primary" onClick={onApply}>ตกลง</Button>
          </div>
        </div>
      </div>
    </Portal>
  );
}

/** หัวข้อย่อยในแผงตัวกรอง — `Input label` (ซ่อน (ถ้ามี)/info/action) + เนื้อหา gap 12 */
export function FilterSection({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col gap-3", className)}>
      <div className="text-sm font-medium text-gray-700">{label}</div>
      {children}
    </div>
  );
}

export interface FilterChip {
  key: string;
  label: string;
}

export function FilterChips({ chips, onRemove, className }: { chips: FilterChip[]; onRemove: (key: string) => void; className?: string }) {
  if (!chips.length) return null;
  return (
    <div aria-label="ตัวกรองที่ใช้อยู่" className={cx("flex flex-wrap items-center gap-3", className)}>
      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex h-6 items-center gap-1 rounded-xs border border-brand-200 bg-brand-50 pr-1 pl-2 text-xs font-semibold whitespace-nowrap text-brand-900"
        >
          {c.label}
          <button
            type="button"
            aria-label={`เอาตัวกรอง ${c.label} ออก`}
            onClick={() => onRemove(c.key)}
            className="flex size-3 cursor-pointer items-center justify-center text-brand-800"
          >
            <Icon name="close_small" size={16} />
          </button>
        </span>
      ))}
    </div>
  );
}
