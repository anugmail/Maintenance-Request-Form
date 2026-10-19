"use client";
/** Figma: `Checkbox` (Type=Unselected|Selected|Indeterminate · State=Default|Hover|Focused|Disabled) · `Checkbox with badge` (checkbox + `Pill outline`)
 *  ค่าเทียบ components.css .chks .cbox (20×20 · r4 · ขอบ 2 gray-300 · ติ๊ก = พื้น brand-900 + ถูกขาว · disabled พื้น gray-200 ·
 *  focus outline 3 primary-50) · .chks label (16/500 gray-700 · gap 10) · .filter-checks (คอลัมน์ ห่าง 12)
 *  ใช้ <input type=checkbox> จริงซ่อนไว้ (a11y/คีย์บอร์ด) */
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cx } from "./cx";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** ข้อความ/ป้าย (Checkbox with badge ใส่ <Badge> ได้) — ไม่ใส่ต้องมี aria-label */
  label?: ReactNode;
  indeterminate?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
  id?: string;
  className?: string;
}

export function Checkbox({ checked, onChange, label, indeterminate, disabled, id, className, ...rest }: CheckboxProps) {
  const auto = useId();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
  }, [indeterminate, checked]);
  const on = checked || indeterminate;
  return (
    <label
      htmlFor={id ?? auto}
      className={cx(
        "relative inline-flex items-center gap-2.5 text-md font-medium",
        disabled ? "cursor-not-allowed text-gray-400" : cx("cursor-pointer", checked ? "text-gray-900" : "text-gray-700"),
        className,
      )}
    >
      <input
        ref={ref}
        id={id ?? auto}
        type="checkbox"
        className="peer absolute size-px opacity-0"
        checked={checked}
        disabled={disabled}
        aria-label={rest["aria-label"]}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={cx(
          "flex size-5 shrink-0 items-center justify-center rounded-xs border-2 transition-colors duration-150 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-100",
          disabled ? "border-gray-300 bg-gray-200 text-gray-300" : on ? "border-brand-900 bg-brand-900 text-white" : "border-gray-300 bg-white text-transparent",
        )}
      >
        <span className="material-symbols-outlined text-[18px]! leading-none">{indeterminate && !checked ? "remove" : "check"}</span>
      </span>
      {label != null && <span className="min-w-0">{label}</span>}
    </label>
  );
}

export interface CheckboxListOption {
  value: string;
  label: ReactNode;
  /** ใช้เป็น aria-label เมื่อ label เป็นป้าย */
  text?: string;
  disabled?: boolean;
}

export interface CheckboxListProps {
  options: CheckboxListOption[];
  value: string[];
  onChange: (value: string[]) => void;
  /** column = เรียงลง ห่าง 12 (.filter-checks) · row = ไหลต่อกัน ห่าง 10/22 (.chks) */
  direction?: "column" | "row";
  className?: string;
}

export function CheckboxList({ options, value, onChange, direction = "column", className }: CheckboxListProps) {
  return (
    <div className={cx(direction === "column" ? "flex flex-col items-start gap-3" : "flex flex-wrap gap-x-[22px] gap-y-2.5", className)}>
      {options.map((o) => (
        <Checkbox
          key={o.value}
          checked={value.includes(o.value)}
          disabled={o.disabled}
          label={o.label}
          aria-label={o.text}
          onChange={(c) => onChange(c ? [...value, o.value] : value.filter((v) => v !== o.value))}
        />
      ))}
    </div>
  );
}
