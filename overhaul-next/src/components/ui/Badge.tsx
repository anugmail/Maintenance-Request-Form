/** Figma: Badge › `Pill outline` (Color=Gray|Warning|Error|Info|Brand|Success) · `Badge outline` Color=Gray (ตัวนับทรงเหลี่ยม)
 *  ค่าเทียบ components.css .badge .b-neutral .b-low .b-out .b-info .b-brand .b-ok · .badge.sq · .badge .dot
 *  สูง 24 · r9999 · pad 0/8 · 12/SemiBold · ขอบ+พื้น+ตัวอักษรชุดสีเดียวกัน · .sq = r4 พื้นขาว ขอบ gray-300 ตัวอักษร gray-600 */
import type { ReactNode } from "react";
import type { BadgeTone } from "@/lib/mock/types";
import { cx } from "./cx";

export type { BadgeTone };

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-gray-50 text-badge-neutral-text border-gray-200",
  low: "bg-warning-50 text-warning-700 border-warning-200",
  out: "bg-error-50 text-error-700 border-error-200",
  info: "bg-info-50 text-info-700 border-info-200",
  brand: "bg-badge-brand-bg text-brand-900 border-badge-brand-border",
  ok: "bg-success-50 text-success-700 border-success-200",
};

export interface BadgeProps {
  tone?: BadgeTone;
  /** `Badge outline` ทรงเหลี่ยม r4 — ใช้เป็นตัวนับในหัว List/Section */
  square?: boolean;
  /** จุดสถานะ 6px นำหน้า */
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "neutral", square, dot, className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        "inline-flex h-6 shrink-0 items-center gap-1 border px-2 text-xs font-semibold tracking-[-0.2px] whitespace-nowrap",
        square ? "rounded-xs border-gray-300 bg-white text-gray-600" : cx("rounded-full", TONE[tone]),
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />}
      {children}
    </span>
  );
}
