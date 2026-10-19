"use client";
/** Figma: `Text area` (Size=md · State=Default|Focused|Disabled|Error) + `Input label` · **Info icon ปิด**
 *  ค่าเทียบ components.css .f textarea (r8 · pad 8/12 · ขอบ gray-300 · เงา xs · focus ขอบ brand-800 + วงแหวน) · .f.err textarea */
import { useId, type ReactNode, type TextareaHTMLAttributes } from "react";
import { FieldShell } from "./Field";
import { cx } from "./cx";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  optional?: boolean;
  error?: ReactNode;
  helper?: ReactNode;
  className?: string;
}

export function TextArea({ label, optional, error, helper, className, id, rows = 4, readOnly, disabled, ...rest }: TextAreaProps) {
  const auto = useId();
  const fid = id ?? auto;
  return (
    <FieldShell id={fid} label={label} optional={optional} error={error} helper={helper} className={className}>
      <textarea
        id={fid}
        rows={rows}
        readOnly={readOnly}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        className={cx(
          "block w-full rounded-md border px-3 py-2 text-md shadow-field outline-none placeholder:text-gray-400",
          readOnly ? "border-gray-300 bg-gray-50 text-gray-700" : disabled ? "border-gray-300 bg-gray-100 text-gray-400" : "bg-white text-gray-900",
          !readOnly && !disabled && (error ? "border-error-300 focus:shadow-field-focus-error" : "border-gray-300 focus:border-brand-800 focus:shadow-field-focus"),
        )}
        {...rest}
      />
    </FieldShell>
  );
}
