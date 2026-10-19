"use client";
/** Figma: `Text input` (Size=md · State=Default|Filled|Focused|Disabled|Readonly|Error) + `Input label` · **Info icon ปิด**
 *  `Number input` ใช้ตัวนี้ + inputMode="decimal"/"numeric"
 *  ค่าเทียบ components.css .f .in input · .f.err · .f.ro (Display) · .f.ro.dash (ค่าที่ระบบเติมให้) · .in > .ms (ไอคอนนำหน้า 20 gray-500)
 *  prefix/suffix = ข้อความ/หน่วยในกล่อง (เช่น "บาท") — ไลบรารีไม่มีช่องนี้ตรงๆ ใช้ตำแหน่ง Leading/Trailing icon แทน */
import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { FieldShell, fieldBoxClass, fieldControlClass } from "./Field";
import { Icon } from "./Icon";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "prefix" | "size"> {
  label?: ReactNode;
  optional?: boolean;
  error?: ReactNode;
  helper?: ReactNode;
  /** ไอคอนนำหน้า (Material Symbols) เช่น "search" */
  icon?: string;
  /** ข้อความ/หน่วยนำหน้าในกล่อง */
  prefix?: ReactNode;
  /** ข้อความ/หน่วยต่อท้ายในกล่อง เช่น "บาท" */
  suffix?: ReactNode;
  /** state Readonly ("Display") — พื้น gray-50 อ่านอย่างเดียว */
  readOnly?: boolean;
  /** ค่าที่ระบบเติมให้ (ขอบประ พื้น gray-100) — อ่านอย่างเดียว */
  autoFilled?: boolean;
  /** className ของตัวครอบทั้งช่อง */
  className?: string;
  inputClassName?: string;
}

export function TextField({
  label, optional, error, helper, icon, prefix, suffix, readOnly, autoFilled, disabled, className, inputClassName, id, type = "text", ...rest
}: TextFieldProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} optional={optional} error={error} helper={helper} className={className}>
      <div className={fieldBoxClass({ error: !!error, readOnly, autoFilled, disabled })}>
        {icon && <Icon name={icon} size={20} className="ml-0.5 text-gray-500" />}
        {prefix && <span className="shrink-0 text-md text-gray-600">{prefix}</span>}
        <input
          id={fid}
          type={type}
          readOnly={readOnly || autoFilled}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fid}-err` : undefined}
          className={fieldControlClass + (inputClassName ? " " + inputClassName : "")}
          {...rest}
        />
        {suffix && <span className="shrink-0 text-md text-gray-600">{suffix}</span>}
      </div>
    </FieldShell>
  );
}
