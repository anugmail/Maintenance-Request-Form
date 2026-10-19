"use client";
/** Figma: Buttons › `Primary button` · `Secondary button` · `Tertiary button` · `Tertiary brand button` · `Tertiary danger button`
 *  · `Primary danger button` · `Secondary danger button` (State=Default|Hover|Focused|Disabled|Loading · Size=md 40 | lg 48)
 *  ค่าเทียบ components.css .btn .btn-p .btn-s .btn-t .btn-tb .btn-td .btn-d .btn-ds .btn-sm .btn-lg .btn-icon .is-loading
 *  sm (36) เป็นส่วนขยายของต้นแบบ (วัดจาก pagination runtime) · ไอคอน 20 คงที่ทุกขนาด */
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "tertiaryBrand"
  | "tertiaryDanger"
  | "danger"
  | "secondaryDanger";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-1 rounded-md border font-semibold text-sm leading-[14px] whitespace-nowrap no-underline transition-[background-color,border-color,color,box-shadow] duration-150 focus-visible:outline-none";

const SIZE: Record<ButtonSize, string> = {
  sm: "h-9 px-3",
  md: "h-10 px-3",
  lg: "h-12 px-3 text-md leading-6",
};
const ICON_ONLY: Record<ButtonSize, string> = { sm: "size-9 p-0 gap-0", md: "size-10 p-0 gap-0", lg: "size-12 p-0 gap-0" };

/* ปกติ + hover (ไม่ใส่ hover ตอน disabled — กัน hover ทับสี disabled) */
const VARIANT: Record<ButtonVariant, { base: string; hover: string; ring: string }> = {
  primary: {
    base: "bg-btn-primary-bg border-btn-primary-border text-btn-primary-text shadow-field",
    hover: "hover:bg-btn-primary-bg-hover hover:border-btn-primary-border-hover",
    ring: "focus-visible:shadow-ring",
  },
  secondary: {
    base: "bg-white border-btn-secondary-border text-btn-secondary-text shadow-field",
    hover: "hover:bg-gray-200 hover:text-gray-800",
    ring: "focus-visible:shadow-ring",
  },
  tertiary: {
    base: "bg-transparent border-transparent text-btn-tertiary-text shadow-none",
    hover: "hover:bg-gray-100 hover:text-gray-700",
    ring: "focus-visible:shadow-ring",
  },
  tertiaryBrand: {
    base: "bg-transparent border-transparent text-btn-tertiary-brand-text shadow-none",
    hover: "hover:bg-badge-brand-bg",
    ring: "focus-visible:shadow-ring",
  },
  tertiaryDanger: {
    base: "bg-transparent border-transparent text-btn-tertiary-danger-text shadow-none",
    hover: "hover:bg-error-50",
    ring: "focus-visible:shadow-ring-error",
  },
  danger: {
    base: "bg-btn-destructive-bg border-btn-destructive-bg text-btn-destructive-text shadow-field",
    hover: "hover:bg-btn-destructive-bg-hover hover:border-btn-destructive-bg-hover",
    ring: "focus-visible:shadow-ring-error",
  },
  secondaryDanger: {
    base: "bg-white border-error-200 text-error-700 shadow-field",
    hover: "hover:bg-error-50",
    ring: "focus-visible:shadow-ring-error",
  },
};

const DISABLED_SOLID = "bg-btn-disabled-bg border-btn-disabled-bg text-btn-disabled-text shadow-none cursor-not-allowed";
const DISABLED_GHOST = "bg-transparent border-transparent text-btn-disabled-text shadow-none cursor-not-allowed";

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** ไอคอนนำหน้า (ชื่อ Material Symbols) */
  iconLeft?: string;
  /** ไอคอนตามหลัง เช่น chevron_right */
  iconRight?: string;
  /** ปุ่มไอคอนล้วน — ต้องใส่ aria-label · children ไม่แสดง */
  iconOnly?: string;
  loading?: boolean;
  /** ทำเป็นลิงก์ (next/link — เติม basePath ให้เอง) */
  href?: string;
  /** กว้างเต็มตัวครอบ */
  block?: boolean;
  children?: ReactNode;
}

export function buttonClass({
  variant = "primary",
  size = "md",
  iconOnly,
  disabled,
  block,
  className,
}: Pick<ButtonProps, "variant" | "size" | "disabled" | "block" | "className"> & { iconOnly?: boolean }) {
  const v = VARIANT[variant];
  const ghost = variant.startsWith("tertiary");
  return cx(
    BASE,
    iconOnly ? ICON_ONLY[size] : SIZE[size],
    disabled ? (ghost ? DISABLED_GHOST : DISABLED_SOLID) : cx(v.base, v.hover, v.ring, "cursor-pointer"),
    block && "w-full",
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  iconOnly,
  loading,
  href,
  block,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  const off = disabled || loading;
  const cls = buttonClass({ variant, size, iconOnly: !!iconOnly, disabled: disabled, block, className: cx(loading && "pointer-events-none", className) });
  const inner = (
    <>
      {loading && <span aria-hidden className="size-[1em] shrink-0 animate-spin-fast rounded-full border-2 border-current border-r-transparent" />}
      {iconOnly ? (
        <Icon name={iconOnly} size={20} />
      ) : (
        <>
          {iconLeft && !loading && <Icon name={iconLeft} size={20} />}
          {children}
          {iconRight && <Icon name={iconRight} size={20} />}
        </>
      )}
    </>
  );

  if (href && !off) {
    return (
      <Link href={href} className={cls} aria-label={rest["aria-label"]} title={rest.title} onClick={rest.onClick as never}>
        {inner}
      </Link>
    );
  }
  if (href && off) {
    return (
      <span className={cls} aria-disabled="true" aria-label={rest["aria-label"]} role="link">
        {inner}
      </span>
    );
  }
  return (
    <button type={type} className={cls} disabled={off} aria-busy={loading || undefined} {...rest}>
      {inner}
    </button>
  );
}
