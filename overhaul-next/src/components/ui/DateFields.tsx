"use client";
/** Figma: `Text input` + `Input label` ในโหมดวันที่/เวลา (ช่องเดียวกับ HTML mock หน้า 6 "นำรถเข้าตั้งแต่วันที่ / ถึงวันที่")
 *  ใช้ตัวเลือกวันที่ของ browser (type=date/time/datetime-local) · ไลบรารีมี `Date picker` (Type=Single|Dual) แต่ HTML mock ยังไม่ได้ยก — ดู README หัวข้อ "ยังไม่ได้ map"
 *  ค่าเทียบ components.css input[type=date|time|datetime-local] (h40 · pad 0/12) + .f .in.noic
 *  DateRangeField = ช่วง จาก–ถึง 2 ช่องแถวเดียว (มือถือเรียงลง) · minToday = เลือกย้อนหลังไม่ได้ · ช่อง "ถึง" ห้ามก่อน "จาก" */
import type { ReactNode } from "react";
import { todayIso } from "@/lib/mock/format";
import { TextField, type TextFieldProps } from "./TextField";
import { cx } from "./cx";

type Base = Omit<TextFieldProps, "type" | "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
};

/** วันที่เดี่ยว — value เป็น ISO yyyy-mm-dd */
export function DateField({ value, onChange, minToday, min, ...rest }: Base & { minToday?: boolean }) {
  return <TextField type="date" value={value} min={minToday ? todayIso() : min} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

/** เวลา — value เป็น HH:mm */
export function TimeField({ value, onChange, ...rest }: Base) {
  return <TextField type="time" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

/** วันที่+เวลา — value เป็น yyyy-mm-ddTHH:mm (บันทึกความคืบหน้างานซ่อม) */
export function DateTimeField({ value, onChange, ...rest }: Base) {
  return <TextField type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
}

export interface DateRange {
  from: string;
  to: string;
}

export interface DateRangeFieldProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
  fromLabel?: ReactNode;
  toLabel?: ReactNode;
  /** เลือกวันก่อนวันนี้ไม่ได้ */
  minToday?: boolean;
  fromError?: ReactNode;
  toError?: ReactNode;
  readOnly?: boolean;
  disabled?: boolean;
  idPrefix?: string;
  className?: string;
}

export function DateRangeField({
  value, onChange, fromLabel = "ตั้งแต่วันที่", toLabel = "ถึงวันที่", minToday, fromError, toError, readOnly, disabled, idPrefix, className,
}: DateRangeFieldProps) {
  const min = minToday ? todayIso() : undefined;
  return (
    <div className={cx("grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2", className)}>
      <DateField
        id={idPrefix ? `${idPrefix}-from` : undefined}
        label={fromLabel}
        value={value.from}
        min={min}
        error={fromError}
        readOnly={readOnly}
        disabled={disabled}
        onChange={(from) => onChange({ from, to: value.to && from && value.to < from ? "" : value.to })}
      />
      <DateField
        id={idPrefix ? `${idPrefix}-to` : undefined}
        label={toLabel}
        value={value.to}
        min={value.from || min}
        error={toError}
        readOnly={readOnly}
        disabled={disabled}
        onChange={(to) => onChange({ ...value, to })}
      />
    </div>
  );
}
