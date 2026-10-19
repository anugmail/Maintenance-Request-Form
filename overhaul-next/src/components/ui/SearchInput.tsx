"use client";
/** Figma: `Text input` (State=Default Size=md · Label=ปิด · Helper=ปิด · Leading icon=search) — ช่องค้นหาของ `Table header`
 *  ค่าเทียบ components.css .search (กล่อง h40 · ขอบ gray-300 · r8 · pad 0/12 · gap 8 · ไอคอน 20 gray-500 · focus-within ขอบ brand-800 + วงแหวน)
 *  + .list-toolbar .lt-search (กว้างสุด 415 ในแถบเครื่องมือ — ใส่ className="w-full max-w-[415px]") */
import type { InputHTMLAttributes } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";

export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "size"> {
  value: string;
  onChange: (value: string) => void;
  /** อ่านโดย screen reader (ไม่มี label ที่มองเห็น) */
  "aria-label": string;
  className?: string;
}

export function SearchInput({ value, onChange, className, ...rest }: SearchInputProps) {
  return (
    <div
      className={cx(
        "flex h-10 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-brand-800 focus-within:shadow-ring",
        className,
      )}
    >
      <Icon name="search" size={20} className="text-gray-500" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-full min-w-0 flex-1 border-0 bg-transparent p-0 text-md text-gray-900 outline-none placeholder:text-gray-400"
        {...rest}
      />
    </div>
  );
}
