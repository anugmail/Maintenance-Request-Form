/** Figma: `Input label` + ช่อง `Text input` / `Input dropdown` / `Text area` (Size=md) + Helper/Error text
 *  ค่าเทียบ components.css .f · .f label (14/500 gray-700 ห่าง 6) · .f label small "(ถ้ามี)" · .f .help (error 14 error-600 ห่าง 6) ·
 *  .f .in input (h40 · r8 · pad 12 · ขอบ gray-300 · เงา xs · focus ขอบ brand-800 + วงแหวน) · .f.err (ขอบ error-300) · .f.ro (Display: พื้น gray-50 ตัวอักษร gray-700)
 *  - ช่องบังคับ "ไม่มี" เครื่องหมาย * (ไลบรารี Input label ไม่มี) — ช่องไม่บังคับต่อท้าย "(ถ้ามี)" ตามไลบรารี
 *  - **Info icon = ปิด** ทุกช่อง (เจ้าของงานเคาะ 19 ต.ค. 2569) — component นี้ไม่มีช่องให้ใส่ไอคอน info
 *  ⚠ ไลบรารี Input label = 16/SemiBold gray-600 ห่าง 8 · components.css = 14/500 gray-700 ห่าง 6 → ยึด components.css (ตรงกับ HTML mock) */
import type { ReactNode } from "react";
import { cx } from "./cx";

/** กล่องช่องกรอก (ใช้ร่วม TextField/SelectField/Combobox/DateField) — `focus-within` ให้วงแหวนตามกล่อง */
export function fieldBoxClass({ error, readOnly, autoFilled, disabled }: { error?: boolean; readOnly?: boolean; autoFilled?: boolean; disabled?: boolean }) {
  return cx(
    "relative flex h-10 w-full items-center gap-1.5 rounded-md border px-3 shadow-field transition-[border-color,box-shadow] duration-150",
    autoFilled
      ? "border-dashed border-gray-300 bg-gray-100 text-gray-700"
      : readOnly
        ? "border-gray-300 bg-gray-50 text-gray-700"
        : disabled
          ? "border-gray-300 bg-gray-100 text-gray-400"
          : "bg-white text-gray-900",
    !readOnly && !autoFilled && !disabled &&
      (error
        ? "border-error-300 focus-within:shadow-field-focus-error"
        : "border-gray-300 focus-within:border-brand-800 focus-within:shadow-field-focus"),
    readOnly && error && "border-error-300",
  );
}

/** ตัว input/select/textarea ในกล่อง — ไม่มีขอบเอง */
export const fieldControlClass =
  "h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-md text-inherit outline-none placeholder:text-gray-400 disabled:cursor-not-allowed";

export interface FieldShellProps {
  id?: string;
  label?: ReactNode;
  /** ต่อท้าย "(ถ้ามี)" */
  optional?: boolean;
  /** ข้อความผิดพลาด (แดง) — มีค่า = state Error */
  error?: ReactNode;
  /** ข้อความช่วย (ถ้าไม่มี error) — 12 gray-600 ตาม Helper ของไลบรารี */
  helper?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** โครง label + ช่อง + error/helper ของทุกช่องกรอก */
export function FieldShell({ id, label, optional, error, helper, className, children }: FieldShellProps) {
  return (
    <div className={cx("min-w-0", className)}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {optional && <small className="text-sm font-normal text-gray-500"> (ถ้ามี)</small>}
        </label>
      )}
      {children}
      {error ? (
        <p id={id ? `${id}-err` : undefined} className="mt-1.5 text-sm text-error-600" role="alert">
          {error}
        </p>
      ) : helper ? (
        <p className="mt-1.5 text-xs text-gray-600">{helper}</p>
      ) : null}
    </div>
  );
}
