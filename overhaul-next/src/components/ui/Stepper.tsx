"use client";
/** Figma: `Progress steps` Type=Horizontal (ไฟล์ Component 2-10) — ทั้ง component ไม่ใช่แค่ step item (คำสั่ง 19 ต.ค. 2569):
 *    กรอบนอก r8 · ขอบ 1px gray-300 · แถวเดียวสูง 72 · ข้างในเป็น `Horizontal step item` (พื้นขาว · pad ซ้าย 24 บน-ล่าง 16 · gap 8)
 *    Content gap 16 = วงกลม 40 (ขอบ gray-300 เลข gray-400 → ขั้นปัจจุบัน ขอบ+เลข brand-900 → ผ่านแล้ว พื้น brand-900 + check ขาว)
 *    + Text 16/SemiBold (gray-600 → brand-900 ขั้นปัจจุบัน → ดำ เมื่อผ่าน) + Supporting text 12 (ถ้ามี)
 *    + Connector 21×72 = chevron "›" เส้น 1px gray-300 (ขั้นสุดท้ายไม่มี)
 *  มือถือ: `Mobile progress steps` (Collapsed=True|False) — กล่อง r8 ขอบ gray-300 pad 16 gap 16 · วงแหวน 72 (track gray-300 · progress brand-900)
 *    กลางวง "n / ทั้งหมด" 12/600 · ชื่อขั้น 16/600 + "ถัดไป: …" 12 · กดขยายเป็น `Vertical step item` (วงกลม 24)
 *  ค่าเทียบ components.css .wsteps .wstep .num .lbl .wstep.active/.passed/.locked .wsteps.wrap · .wsteps-m .wsm-head .wsm-ring .wsm-tx .wsm-next
 *  สถานะต่อขั้น: done (ผ่านแล้ว · กดย้อนดูได้) · current (กำลังทำ/กำลังดู) · upcoming (ยังไม่ถึงแต่กดได้) · locked (กดไม่ได้ จาง .55) */
import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./cx";

export type StepState = "done" | "current" | "upcoming" | "locked";

export interface StepItem {
  label: string;
  state: StepState;
  /** Supporting text ใต้ชื่อขั้น */
  supporting?: ReactNode;
}

export interface StepperProps {
  steps: StepItem[];
  /** ขั้นที่กำลังดู (0-based) — ใช้กับ aria-selected และ Mobile progress steps */
  selected?: number;
  /** กดขั้นที่ไม่ locked */
  onStepClick?: (index: number) => void;
  /** desktop | mobile | auto (สลับที่ 768) */
  variant?: "auto" | "desktop" | "mobile";
  className?: string;
}

/** ช่วยคำนวณสถานะ: progress = ขั้นที่ทำถึง (0-based) · complete = จบทุกขั้น */
export function stepStates(labels: readonly string[], progress: number, complete = false): StepItem[] {
  return labels.map((label, i) => ({
    label,
    state: complete || i < progress ? "done" : i === progress ? "current" : "locked",
  }));
}

function Num({ i, state, small }: { i: number; state: StepState; small?: boolean }) {
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full border font-semibold",
        small ? "size-6 text-xs" : "size-10 text-md",
        state === "done" ? "border-brand-900 bg-brand-900 text-white" : state === "current" ? "border-brand-900 bg-white text-brand-900" : "border-gray-300 bg-white text-gray-400",
      )}
    >
      {state === "done" ? <Icon name="check" size={small ? 16 : 24} /> : i + 1}
    </span>
  );
}

const labelColor = (s: StepState) => (s === "done" ? "text-black" : s === "current" ? "text-brand-900" : "text-gray-600");

export function Stepper({ steps, selected, onStepClick, variant = "auto", className }: StepperProps) {
  const [open, setOpen] = useState(false);
  const sel = selected ?? Math.max(0, steps.findIndex((s) => s.state === "current"));
  const clickable = (s: StepItem) => !!onStepClick && s.state !== "locked";

  const desktop = (
    <div
      role="tablist"
      aria-label="ขั้นตอน"
      className={cx(
        "flex items-stretch overflow-hidden rounded-md border border-gray-300 bg-white",
        variant === "auto" && "max-md:hidden",
        variant === "mobile" && "hidden",
      )}
    >
      {steps.map((s, i) => (
        <button
          key={i}
          type="button"
          role="tab"
          aria-selected={i === sel}
          aria-disabled={s.state === "locked" || undefined}
          tabIndex={s.state === "locked" ? -1 : 0}
          onClick={() => clickable(s) && onStepClick!(i)}
          className={cx(
            "flex min-w-0 flex-1 items-center gap-2 bg-white py-4 pl-6 text-left outline-none focus-visible:bg-gray-50",
            s.state === "locked" ? "cursor-not-allowed opacity-55" : clickable(s) ? "cursor-pointer" : "cursor-default",
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-4">
            <Num i={i} state={s.state} />
            <span className={cx("flex min-w-0 flex-col gap-1 py-1", labelColor(s.state))}>
              <span className="text-md leading-[1.35] font-semibold">{s.label}</span>
              {s.supporting && <span className="text-xs font-normal text-gray-600">{s.supporting}</span>}
            </span>
          </span>
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className="relative w-[21px] shrink-0 self-stretch -my-4 before:absolute before:top-0 before:right-0.5 before:h-1/2 before:w-px before:origin-bottom before:-rotate-[29deg] before:bg-gray-300 after:absolute after:right-0.5 after:bottom-0 after:h-1/2 after:w-px after:origin-top after:rotate-[29deg] after:bg-gray-300"
            />
          )}
        </button>
      ))}
    </div>
  );

  const cur = steps[sel];
  const next = steps[sel + 1];
  const p = Math.round(((sel + 1) / steps.length) * 100);
  const mobile = (
    <div className={cx("overflow-hidden rounded-md border border-gray-300 bg-white", variant === "auto" && "md:hidden", variant === "desktop" && "hidden")}>
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex w-full cursor-pointer items-center gap-4 p-4 text-left">
        <span
          className="flex size-[72px] shrink-0 items-center justify-center rounded-full"
          /* วงแหวนความคืบหน้า — เปอร์เซ็นต์เป็นค่าไดนามิก */
          style={{ background: `conic-gradient(var(--brand-900) ${p}%, var(--gray-300) 0)` }}
        >
          <span className="flex size-[60px] items-center justify-center rounded-full bg-white text-xs font-semibold text-black">
            {sel + 1}
            <i className="mx-0.5 font-normal text-gray-400 not-italic">/</i>
            {steps.length}
          </span>
        </span>
        <span className="min-w-0 flex-1">
          <b className="block text-md font-semibold text-black">{cur?.label}</b>
          {next && (
            <span className="mt-2 block text-xs text-gray-600">
              <b className="font-semibold">ถัดไป:</b> {next.label}
            </span>
          )}
        </span>
        <Icon name="keyboard_arrow_down" size={20} className={cx("text-gray-500 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="flex flex-col border-t border-gray-300 px-4 pt-2 pb-3">
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              disabled={s.state === "locked"}
              aria-current={i === sel ? "step" : undefined}
              onClick={() => {
                if (clickable(s)) {
                  onStepClick!(i);
                  setOpen(false);
                }
              }}
              className={cx("flex w-full items-center gap-2 py-2 text-left", s.state === "locked" ? "cursor-not-allowed opacity-55" : "cursor-pointer")}
            >
              <Num i={i} state={s.state} small />
              <span className={cx("text-sm font-semibold", labelColor(s.state))}>{s.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={className}>
      {desktop}
      {mobile}
    </div>
  );
}
