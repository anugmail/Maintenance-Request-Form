"use client";
/** Figma: `Dropdown menu` + `_Dropdown menu item` (Type=Shortcut · Shortcut=ปิด · Icon=เปิด · Divider=True ก่อน "ลบ") · ไม่มี `_Dropdown menu header`
 *  ปุ่มเปิด = `Table cell` Style=Action icons → `Tertiary button` ไอคอน more_horiz · มือถือ = `Bottom sheet` ที่มีรายการเมนู (ตามปลั๊กอิน menuAt)
 *  ค่าเทียบ components.css .dd .dd-menu (w240 · r8 · ขอบ gray-200 · pad 4/0 · เงา pop) .dd-item (ขอบนอก 4 · ด้านใน r8 pad 8/12 · ไอคอน 16 gray-500 ·
 *  14/500 lh24 · hover gray-100 · focus gray-50 · disabled gray-400) .dd-sep (1px gray-200 ระยะ 4)
 *  ตำแหน่ง: position:fixed ชิดขวาใต้ปุ่ม (ไม่โดน .tblwrap ตัด) · ล้นจอล่างเปิดขึ้นบน · เลื่อนหน้าแล้วตามปุ่ม (oh2PlaceMenu) ·
 *  ปิดเมื่อคลิกนอก/Esc · ↑/↓ เลื่อนรายการ */
import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Button } from "./Button";
import { createPortal } from "react-dom";
import { BottomSheet } from "./Modal";
import { Icon } from "./Icon";
import { useIsMobile } from "./useMediaQuery";
import { cx } from "./cx";

export type RowMenuItem =
  | { label: string; icon?: string; href?: string; onSelect?: () => void; disabled?: boolean }
  | "divider";

export interface RowMenuProps {
  items: RowMenuItem[];
  /** aria-label ของปุ่ม เช่น "จัดการแผน 123456" */
  label: string;
  /** ไอคอนปุ่มเปิด (ค่าตั้งต้น more_horiz) */
  icon?: string;
  /** บังคับโหมดมือถือ (แกลเลอรี) */
  forceSheet?: boolean;
}

const MENU_W = 240;

export function RowMenu({ items, label, icon = "more_horiz", forceSheet }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const btn = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const mobile = useIsMobile();
  const sheet = forceSheet || mobile;
  const mid = useId();

  const place = useCallback(() => {
    const b = btn.current?.getBoundingClientRect();
    const h = menu.current?.offsetHeight ?? 0;
    if (!b) return;
    const below = b.bottom + 4;
    setPos({
      left: Math.max(8, b.right - MENU_W),
      top: below + h > window.innerHeight - 8 ? Math.max(8, b.top - 4 - h) : below,
    });
  }, []);

  useLayoutEffect(() => {
    if (open && !sheet) place();
  }, [open, sheet, place]);

  useEffect(() => {
    if (!open || sheet) return;
    const onScroll = () => place();
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menu.current?.contains(t) && !btn.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.querySelector("button")?.focus();
      }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const els = Array.from(menu.current?.querySelectorAll<HTMLElement>("[data-mi]:not([aria-disabled=true])") ?? []);
        const i = els.indexOf(document.activeElement as HTMLElement);
        const n = e.key === "ArrowDown" ? (i + 1) % els.length : (i - 1 + els.length) % els.length;
        els[n]?.focus();
      }
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    menu.current?.querySelector<HTMLElement>("[data-mi]")?.focus();
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, sheet, place]);

  const close = () => setOpen(false);

  const list = (
    <>
      {items.map((it, i) => {
        if (it === "divider") return <div key={i} role="separator" className="my-1 h-px bg-gray-200" />;
        const inner = (
          <span className={cx("flex items-center gap-2 rounded-md px-3 py-2 text-sm leading-6 font-medium", it.disabled ? "text-gray-400" : "text-black group-hover:bg-gray-100 group-focus-visible:bg-gray-50")}>
            {it.icon && <Icon name={it.icon} size={16} className="text-gray-500" />}
            {it.label}
          </span>
        );
        const cls = cx("group block w-full px-1 text-left no-underline outline-none", it.disabled ? "cursor-not-allowed" : "cursor-pointer");
        if (it.href && !it.disabled)
          return (
            <Link key={i} href={it.href} role="menuitem" data-mi className={cls} onClick={close}>
              {inner}
            </Link>
          );
        return (
          <button
            key={i}
            type="button"
            role="menuitem"
            data-mi
            aria-disabled={it.disabled || undefined}
            className={cls}
            onClick={() => {
              if (it.disabled) return;
              close();
              it.onSelect?.();
            }}
          >
            {inner}
          </button>
        );
      })}
    </>
  );

  return (
    <>
      <div ref={btn} className="inline-flex">
        <Button
          variant="tertiary"
          iconOnly={icon}
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? mid : undefined}
          onClick={() => setOpen((o) => !o)}
          className={cx("[&_.material-symbols-outlined]:[font-variation-settings:'wght'_300]", open && "bg-gray-100")}
        />
      </div>
      {open && !sheet && createPortal(
          <div
            ref={menu}
            id={mid}
            role="menu"
            aria-label={label}
            className={cx("fixed z-70 w-60 rounded-md border border-gray-200 bg-white py-1 text-left shadow-float", !pos && "invisible")}
            style={pos ?? { left: 0, top: 0 } /* ตำแหน่งคำนวณจากปุ่ม (ค่าไดนามิก) */}
          >
            {list}
          </div>,
          document.body,
      )}
      {sheet && (
        <BottomSheet open={open} onClose={close} flush>
          <div role="menu" aria-label={label} className="pb-2">
            {list}
          </div>
        </BottomSheet>
      )}
    </>
  );
}
