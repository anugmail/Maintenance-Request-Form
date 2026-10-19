"use client";
/** Figma: `Input dropdown` (Size=md · State=Default|Focused · Leading icon=search) + `Dropdown list` + `Dropdown list item` (Avatar=ปิด · Supporting text)
 *  ค่าเทียบ components.css .combo .combo-arrow .combo-list .combo-opt .combo-opt-tx .combo-empty
 *  รายการ: กล่อง r8 · ขอบ gray-300 · pad 12/8 · ห่างกัน 8 · สูงสุด 256 แล้วเลื่อน · แถว h40 r4 pad 8 · ข้อความ 16 · รอง 12 gray-600
 *  hover/ไฮไลต์คีย์บอร์ด = พื้น gray-200 · เลือกแล้ว = ตัวอักษร brand-900 + ติ๊ก brand-900 ขวา · ไม่พบ = "ไม่พบรายการ"
 *  คีย์บอร์ด: ↓/↑ เลื่อน · Enter เลือก · Esc ปิด */
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { FieldShell, fieldBoxClass, fieldControlClass } from "./Field";
import { Icon } from "./Icon";
import { cx } from "./cx";

export interface ComboOption {
  value: string;
  label: string;
  /** บรรทัดรอง (Supporting text) เช่น "HINO FG1J · รถกระเช้า" — ค้นได้ด้วย */
  sub?: string;
}

export interface ComboboxProps {
  options: ComboOption[];
  /** value ที่เลือก ("" = ยังไม่เลือก) */
  value: string;
  onChange: (value: string) => void;
  label?: ReactNode;
  optional?: boolean;
  placeholder?: string;
  error?: ReactNode;
  helper?: ReactNode;
  disabled?: boolean;
  emptyText?: string;
  id?: string;
  className?: string;
}

export function Combobox({
  options, value, onChange, label, optional, placeholder = "ค้นหา", error, helper, disabled, emptyText = "ไม่พบรายการ", id, className,
}: ComboboxProps) {
  const auto = useId();
  const fid = id ?? auto;
  const listId = fid + "-list";
  const picked = options.find((o) => o.value === value);
  const [text, setText] = useState(picked?.label ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  /* ค่าที่เลือกเปลี่ยนจากภายนอก (ล้างตัวกรอง / โหลดค่าเดิม) → ช่องแสดงชื่อตาม */
  useEffect(() => {
    setText(picked?.label ?? "");
  }, [picked?.label]);

  const rows = useMemo(() => {
    const q = typed ? text.trim().toLowerCase() : "";
    return options.filter((o) => !q || o.label.toLowerCase().includes(q) || (o.sub ?? "").toLowerCase().includes(q));
  }, [options, text, typed]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (o: ComboOption) => {
    onChange(o.value);
    setText(o.label);
    setTyped(false);
    setOpen(false);
  };

  return (
    <FieldShell id={fid} label={label} optional={optional} error={error} helper={helper} className={cx("relative", className)}>
      <div className={fieldBoxClass({ error: !!error, disabled })}>
        <Icon name="search" size={20} className="ml-0.5 text-gray-500" />
        <input
          id={fid}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && rows[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          disabled={disabled}
          placeholder={placeholder}
          value={text}
          className={fieldControlClass}
          onFocus={() => {
            setOpen(true);
            setActive(Math.max(0, rows.findIndex((o) => o.value === value)));
          }}
          onBlur={() => {
            setOpen(false);
            setTyped(false);
            setText(picked?.label ?? "");
          }}
          onChange={(e) => {
            setText(e.target.value);
            setTyped(true);
            setOpen(true);
            setActive(0);
            if (!e.target.value && value) onChange("");
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
              setActive((a) => Math.min(rows.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter") {
              if (open && rows[active]) {
                e.preventDefault();
                choose(rows[active]);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />
        <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={20} className="pointer-events-none text-gray-500" />
      </div>
      {open && (
        <div
          id={listId}
          role="listbox"
          ref={listRef}
          className="absolute top-[calc(100%+4px)] right-0 left-0 z-40 flex max-h-64 flex-col gap-2 overflow-y-auto rounded-md border border-gray-300 bg-white px-2 py-3 shadow-float"
        >
          {rows.length ? (
            rows.map((o, i) => {
              const sel = o.value === value;
              return (
                <button
                  key={o.value}
                  id={`${listId}-${i}`}
                  data-i={i}
                  type="button"
                  role="option"
                  aria-selected={sel}
                  tabIndex={-1}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    choose(o);
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={cx(
                    "flex min-h-10 w-full shrink-0 cursor-pointer items-center gap-2 rounded-xs px-2 text-left text-black",
                    i === active ? "bg-gray-200" : "bg-white",
                  )}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cx("text-md", sel && "text-brand-900")}>{o.label}</span>
                    {o.sub && <small className="text-xs text-gray-600">{o.sub}</small>}
                  </span>
                  <Icon name="check" size={24} className={cx("text-brand-900", !sel && "invisible")} />
                </button>
              );
            })
          ) : (
            <div className="p-2 text-sm text-gray-500">{emptyText}</div>
          )}
        </div>
      )}
    </FieldShell>
  );
}
