"use client";
/** Figma (desktop): `Modal` Type=Form (Size=md 500 | lg 800 | xl 1140) = `Modal header` + เนื้อหา + `Modal footer`
 *                   `Modal` Type=Destructive centered image with input / Centered image = `Modal header` Alignment=Center (`Featured icon` md)
 *                   + `Modal footer` Alignment=Horizontal fill (`Secondary button` + `Primary button` / `Primary danger button`)
 *  Figma (มือถือ < 768): `Bottom sheet` (Type=Form|Confirmation) = `Background overlay` + Sheet r[24,24,0,0] +
 *                   `Bottom sheet header` (Drag handle 32×4 · Text and action) + Content pad 16 + `Bottom sheet footer` (ปุ่ม lg 48 แบ่งเท่ากัน gap 16)
 *  ค่าเทียบ components.css .modal-overlay .modal(.md/.lg/.xl) .modal-hd(.center) .modal-hd-c .modal-sub .modal-bd .modal-ft .modal-ft-a(.fill) .modal-x .ficon
 *  - Divider ของหัว/ท้ายปิด (เจ้าของงานปิด divider ทั้งหมด 19 ต.ค. 2569) — ระยะคงเดิม
 *  - ปุ่มท้าย desktop: ยกเลิก/ปิด ซ้าย · ยืนยัน ขวา (Form = Tertiary ซ้าย + Primary 220 ขวา · Centered = เต็มแถวแบ่งเท่ากัน)
 *  - ปิดได้ด้วย ✕ · คลิกฉากหลัง · Esc */
import { useEffect, useId, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { useIsMobile } from "./useMediaQuery";
import { cx } from "./cx";

export type ModalSize = "md" | "lg" | "xl";
export type FeaturedTone = "brand" | "gray" | "error" | "success";

const SIZE: Record<ModalSize, string> = { md: "max-w-[500px]", lg: "max-w-[800px]", xl: "max-w-[1140px]" };
const FICON: Record<FeaturedTone, string> = {
  brand: "bg-brand-50 text-brand-900",
  gray: "bg-gray-100 text-gray-500",
  error: "bg-error-50 text-error-500",
  success: "bg-success-50 text-success-600",
};

/** Figma: `Featured icon` (Size=md 48 | sm 36) · components.css .ficon .ficon.sm .gray .err .ok */
export function FeaturedIcon({ name, tone = "brand", size = "md", className }: { name: string; tone?: FeaturedTone; size?: "md" | "sm"; className?: string }) {
  return (
    <span className={cx("inline-flex shrink-0 items-center justify-center rounded-full", size === "md" ? "size-12" : "size-9", FICON[tone], className)}>
      <Icon name={name} size={24} />
    </span>
  );
}

/** ล็อกการเลื่อนหน้า + Esc ปิด ระหว่างชั้นบนเปิดอยู่ */
export function useOverlay(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", key);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
}

/** render ลง document.body หลัง mount (static export prerender ไม่มี document) */
export function Portal({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => setEl(document.body), []);
  return el ? createPortal(children, el) : null;
}

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** หัว (Text and action) — ไม่ใส่ = มีแค่ drag handle */
  title?: ReactNode;
  /** Tertiary brand button ขวาของหัว เช่น "ล้างตัวกรอง" */
  headerAction?: ReactNode;
  /** แถวปุ่มท้าย (Bottom sheet footer) — ปุ่มแบ่งความกว้างเท่ากัน */
  footer?: ReactNode;
  children?: ReactNode;
  /** เนื้อหาไม่เว้นขอบซ้ายขวา (เช่น รายการเมนู) */
  flush?: boolean;
  labelledBy?: string;
}

/** Figma: `Bottom sheet` — ใช้ตรงๆ ได้ (เมนู "…" บนมือถือ) หรือผ่าน <Modal> ที่สลับให้เองบนจอ < 768 */
export function BottomSheet({ open, onClose, title, headerAction, footer, children, flush, labelledBy }: BottomSheetProps) {
  useOverlay(open, onClose);
  const tid = useId();
  if (!open) return null;
  return (
    <Portal>
      <div
        className="fixed inset-0 z-60 flex items-end bg-black/60"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy ?? (title ? tid : undefined)}
          className="flex max-h-[92dvh] w-full animate-sheet-up flex-col rounded-t-sheet bg-white"
        >
          <div className="flex h-10 shrink-0 items-start justify-center pt-[18px]">
            <span aria-hidden className="h-1 w-8 rounded-xs bg-gray-200" />
          </div>
          {title && (
            <div className="flex min-h-10 shrink-0 items-center gap-1 px-4 pb-6">
              <h2 id={tid} className="min-w-0 flex-1 text-lg font-semibold text-black">{title}</h2>
              {headerAction}
            </div>
          )}
          <div className={cx("flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto", !flush && "px-4", !footer && "pb-6")}>{children}</div>
          {footer && <div className="flex shrink-0 items-center gap-4 px-4 pt-6 pb-4 [&>*]:h-12 [&>*]:min-w-0 [&>*]:flex-1">{footer}</div>}
        </div>
      </div>
    </Portal>
  );
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** form = หัวซ้าย+ปุ่ม ✕ (Type=Form) · centered = ไอคอนกลาง หัวข้อกลาง (ยืนยัน/ยืนยันลบ) */
  variant?: "form" | "centered";
  size?: ModalSize;
  title: ReactNode;
  /** Supporting text ใต้หัวข้อ */
  description?: ReactNode;
  /** centered: ชื่อไอคอน Featured icon (ค่าตั้งต้น info) */
  icon?: string;
  iconTone?: FeaturedTone;
  children?: ReactNode;
  cancelLabel?: string;
  /** ค่าตั้งต้น = onClose */
  onCancel?: () => void;
  hideCancel?: boolean;
  confirmLabel?: string;
  onConfirm?: () => void;
  /** danger = Primary danger button (ยืนยันลบ) */
  confirmVariant?: "primary" | "danger";
  confirmLoading?: boolean;
  confirmDisabled?: boolean;
  /** ปุ่มท้ายแบบกำหนดเอง (แทน cancel/confirm) */
  footer?: ReactNode;
  /** Bottom sheet: ปุ่มขวาของหัว (Tertiary brand) */
  headerAction?: ReactNode;
  /** auto = สลับเป็น bottom sheet เมื่อจอ < 768 · sheet = บังคับ bottom sheet (ใช้ในแกลเลอรี) · dialog = บังคับกล่องกลาง */
  mode?: "auto" | "sheet" | "dialog";
}

export function Modal(props: ModalProps) {
  const {
    open, onClose, variant = "form", size = "md", title, description, icon = "info", iconTone = "brand", children,
    cancelLabel = "ยกเลิก", onCancel, hideCancel, confirmLabel = "ยืนยัน", onConfirm, confirmVariant = "primary",
    confirmLoading, confirmDisabled, footer, headerAction, mode = "auto",
  } = props;
  const mobile = useIsMobile();
  const tid = useId();
  useOverlay(open && !(mode === "sheet" || (mode === "auto" && mobile)), onClose);
  if (!open) return null;

  const cancelBtn = !hideCancel && (
    <Button variant={variant === "form" ? "tertiary" : "secondary"} onClick={onCancel ?? onClose}>
      {cancelLabel}
    </Button>
  );
  const confirmBtn = onConfirm && (
    <Button variant={confirmVariant} onClick={onConfirm} loading={confirmLoading} disabled={confirmDisabled}>
      {confirmLabel}
    </Button>
  );

  /* ---------- มือถือ: Bottom sheet ---------- */
  if (mode === "sheet" || (mode === "auto" && mobile)) {
    const sheetFooter = footer ?? (
      <>
        {!hideCancel && (
          <Button variant="secondary" size="lg" onClick={onCancel ?? onClose}>
            {cancelLabel}
          </Button>
        )}
        {onConfirm && (
          <Button variant={confirmVariant} size="lg" onClick={onConfirm} loading={confirmLoading} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        )}
      </>
    );
    return (
      <BottomSheet
        open
        onClose={onClose}
        title={variant === "form" ? title : undefined}
        headerAction={headerAction}
        footer={sheetFooter}
        labelledBy={variant === "centered" ? tid : undefined}
      >
        {variant === "centered" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <FeaturedIcon name={icon} tone={iconTone} />
            <div className="flex flex-col gap-1">
              <h2 id={tid} className="text-lg font-semibold text-black">{title}</h2>
              {description && <p className="text-md text-gray-600">{description}</p>}
            </div>
          </div>
        )}
        {variant === "form" && description && <p className="-mt-4 text-md text-gray-600">{description}</p>}
        {children}
      </BottomSheet>
    );
  }

  /* ---------- desktop: Modal ---------- */
  return (
    <Portal>
      <div
        className="fixed inset-0 z-60 flex items-start justify-center overflow-auto bg-black/60 p-6"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={tid}
          className={cx("relative m-auto flex max-h-[calc(100dvh-48px)] w-full animate-fade-in flex-col overflow-hidden rounded-lg bg-white shadow-float", SIZE[size])}
        >
          {variant === "centered" ? (
            <div className="shrink-0 px-6 pt-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <FeaturedIcon name={icon} tone={iconTone} />
                <div className="flex w-full flex-col gap-1">
                  <h2 id={tid} className="text-lg font-semibold text-black">{title}</h2>
                  {description && <p className="text-md text-gray-600">{description}</p>}
                </div>
              </div>
              <Button variant="tertiary" iconOnly="close" aria-label="ปิด" onClick={onClose} className="absolute top-4 right-4" />
            </div>
          ) : (
            <div className="shrink-0 px-6 pb-4">
              <div className="flex min-h-16 items-center gap-2">
                <div className="min-w-0 flex-1">
                  <h2 id={tid} className="text-lg font-semibold text-gray-900">{title}</h2>
                  {description && <p className="text-md text-gray-600">{description}</p>}
                </div>
                <Button variant="tertiary" iconOnly="close" aria-label="ปิด" onClick={onClose} />
              </div>
            </div>
          )}
          {children != null && (
            <div className={cx("flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 [&>*]:shrink-0", variant === "centered" && "pt-4")}>{children}</div>
          )}
          <div className="shrink-0 px-6 pt-6 pb-6">
            {footer ? (
              <div className="flex flex-wrap items-center justify-between gap-3">{footer}</div>
            ) : variant === "centered" ? (
              <div className="flex items-center gap-3 [&>*]:min-w-0 [&>*]:flex-1">
                {cancelBtn}
                {confirmBtn}
              </div>
            ) : (
              <div className="flex min-h-10 flex-wrap items-center justify-between gap-3">
                {cancelBtn || <span />}
                <div className="ml-auto flex items-center gap-3 [&>*]:min-w-[220px]">{confirmBtn}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: ReactNode;
  description?: ReactNode;
  /** true = ยืนยันลบ (Primary danger button) */
  danger?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: string;
  loading?: boolean;
  mode?: ModalProps["mode"];
}

/** ทางลัดของ Modal variant="centered" — ยืนยัน / ยืนยันลบ / ยืนยันการออก */
export function ConfirmDialog({ open, onClose, onConfirm, title, description, danger, confirmLabel = "ยืนยัน", cancelLabel = "ยกเลิก", icon = "info", loading, mode }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="centered"
      title={title}
      description={description}
      icon={icon}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      onConfirm={onConfirm}
      confirmVariant={danger ? "danger" : "primary"}
      confirmLoading={loading}
      mode={mode}
    />
  );
}
