"use client";
/* ช่องช่วงวันที่ช่องเดียว "เลือกวันที่เริ่มต้น - วันที่สิ้นสุด" ของ `RepairAppointmentStep` (ไฟล์ Maintain-D · กติกา R16/R17)
 * Figma (Component) VMS Plus: `Text input` + `Input label` (Leading icon=calendar) · แผงเลือกใช้กรอบ `Dropdown list` (r8 · ขอบ gray-300 · เงา) ·
 *   ข้างในเป็น <DateRangeField> ของชุด UI (ตัวเลือกวันที่ของ browser 2 ช่อง)
 * ⚠ ไลบรารีมี `Date picker` Type=Dual แต่ชุด UI ยังไม่ได้ทำ (README "ยังไม่ได้ map") ⇒ ประกอบในหน้านี้ชั่วคราว — รายงานแล้ว
 * ค่าเทียบ components.css .f .in (h40 · r8 · pad 12) + .combo-list */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { DateRangeField, FieldShell, Icon, cx, fieldBoxClass, type DateRange } from "@/components/ui";
import { fmtDate } from "@/lib/mock";

export function DateRangeInput({
  label, value, onChange, error, placeholder = "เลือกวันที่เริ่มต้น - วันที่สิ้นสุด", minToday,
}: { label: ReactNode; value: DateRange; onChange: (v: DateRange) => void; error?: ReactNode; placeholder?: string; minToday?: boolean }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const key = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  const text = value.from || value.to ? `${fmtDate(value.from)} - ${fmtDate(value.to)}` : "";

  return (
    <div ref={root} className="relative">
      <FieldShell id={id} label={label} error={error}>
        <button
          id={id}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-invalid={error ? true : undefined}
          onClick={() => setOpen((o) => !o)}
          className={cx(fieldBoxClass({ error: !!error }), "cursor-pointer text-left", open && !error && "border-brand-800 shadow-field-focus")}
        >
          <Icon name="calendar_today" size={20} className="ml-0.5 text-gray-500" />
          <span className={cx("min-w-0 flex-1 truncate text-md", text ? "text-gray-900" : "text-gray-400")}>{text || placeholder}</span>
          <Icon name={open ? "keyboard_arrow_up" : "keyboard_arrow_down"} size={20} className="text-gray-500" />
        </button>
      </FieldShell>
      {open && (
        <div role="dialog" aria-label="เลือกช่วงวันที่" className="absolute top-[calc(100%+4px)] left-0 z-40 w-full min-w-[min(420px,calc(100vw-32px))] rounded-md border border-gray-300 bg-white p-3 shadow-float">
          <DateRangeField
            fromLabel="วันที่เริ่มต้น"
            toLabel="วันที่สิ้นสุด"
            minToday={minToday}
            value={value}
            onChange={(v) => {
              onChange(v);
              /* เลือกวันสิ้นสุดแล้ว → ปิดแผง */
              if (v.from && v.to && v.to !== value.to) setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
