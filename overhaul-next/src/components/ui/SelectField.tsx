"use client";
/** Figma: `Input dropdown` (Size=md · State=Default|Focused|Disabled|Error) + `Input label` — ลูกศร keyboard_arrow_down 20 ขวา
 *  ค่าเทียบ components.css .f .in select (h40 · r8 · pad 12) + .in.noic · ใช้ <select> จริง (a11y/มือถือ) ซ่อนลูกศรของ browser
 *  ใช้เมื่อตัวเลือกน้อยและไม่ต้องค้น — ตัวเลือกเยอะ/ต้องพิมพ์ค้นใช้ <Combobox> */
import { useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { FieldShell, fieldBoxClass, fieldControlClass } from "./Field";
import { Icon } from "./Icon";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?: ReactNode;
  optional?: boolean;
  error?: ReactNode;
  helper?: ReactNode;
  options: SelectOption[];
  /** ตัวเลือกแรกค่าว่าง เช่น "ทั้งหมด" / "เลือก…" */
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function SelectField({ label, optional, error, helper, options, placeholder, readOnly, disabled, className, id, ...rest }: SelectFieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} optional={optional} error={error} helper={helper} className={className}>
      <div className={fieldBoxClass({ error: !!error, readOnly, disabled })}>
        <select
          id={fid}
          disabled={disabled || readOnly}
          aria-invalid={error ? true : undefined}
          className={fieldControlClass + " cursor-pointer appearance-none pr-7"}
          {...rest}
        >
          {placeholder != null && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <Icon name="keyboard_arrow_down" size={20} className="pointer-events-none absolute right-3 text-gray-500" />
      </div>
    </FieldShell>
  );
}
