"use client";
/** Figma: `Notification` (Type=Success|Error · Breakpoint=Desktop|Mobile) ของไฟล์ Component (Notifications 1873-44383)
 *  + `Create contract - Success` / `Delete failed` ของ UI Release#2 (5.1) · Actions=ปิด
 *  ค่าเทียบ components.css .notif .notif-ic .notif-tx .notif-x — มุมขวาล่างห่าง 24 · w400 · r12 · พื้น gray-950 · ขอบ gray-dark-600 · pad 16 · gap 16 ·
 *  ไอคอนทึบ 24 (check_circle success-600 / cancel error-500) · หัวข้อ 16/600 gray-dark-50 · ข้อความรอง 14 gray-dark-300 · ปุ่มปิด 40
 *  หายเองใน 4 วินาที (เท่า HTML mock) · จอ ≤ 600 กว้างเต็ม ห่างขอบ 16
 *  ใช้: const toast = useToast(); toast.success("ลบแผน overhaul สำเร็จ"); toast.error("general error") */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";
import { cx } from "./cx";

type Kind = "success" | "error";
interface Item {
  id: number;
  kind: Kind;
  title: string;
  sub?: string;
}

export interface ToastApi {
  success(title: string, sub?: string): void;
  error(title: string, sub?: string): void;
  dismiss(id?: number): void;
}

const Ctx = createContext<ToastApi | null>(null);
const DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([]);
  const seq = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id?: number) => {
    setItems((xs) => (id == null ? [] : xs.filter((x) => x.id !== id)));
    if (id != null) {
      clearTimeout(timers.current.get(id));
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (kind: Kind, title: string, sub?: string) => {
      const id = ++seq.current;
      setItems((xs) => [...xs.slice(-2), { id, kind, title, sub }]);
      timers.current.set(id, setTimeout(() => dismiss(id), DURATION));
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({ success: (t, s) => push("success", t, s), error: (t, s) => push("error", t, s), dismiss }),
    [push, dismiss],
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-6 bottom-6 z-80 flex flex-col items-end gap-3 max-[600px]:right-4 max-[600px]:bottom-4 max-[600px]:left-4">
        {items.map((n) => (
          <Notification key={n.id} kind={n.kind} title={n.title} sub={n.sub} onClose={() => dismiss(n.id)} className="pointer-events-auto animate-fade-in" />
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useToast(): ToastApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useToast ต้องอยู่ใต้ <ToastProvider>");
  return v;
}

/** กล่อง Notification เดี่ยว (ใช้แสดงในแกลเลอรีได้) */
export function Notification({ kind, title, sub, onClose, className }: { kind: Kind; title: string; sub?: string; onClose?: () => void; className?: string }) {
  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      className={cx(
        "flex w-[400px] max-w-[calc(100vw-32px)] items-start gap-4 rounded-lg border border-gray-dark-600 bg-gray-950 p-4 shadow-float max-[600px]:w-full",
        className,
      )}
    >
      <Icon name={kind === "error" ? "cancel" : "check_circle"} size={24} filled className={kind === "error" ? "text-error-500" : "text-success-600"} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <b className="text-md font-semibold text-gray-dark-50">{title}</b>
        {sub && <span className="text-sm text-gray-dark-300">{sub}</span>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="ปิด"
          onClick={onClose}
          className="-mt-2 -mr-2 flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-dark-300 focus-visible:shadow-ring focus-visible:outline-none"
        >
          <Icon name="close" size={20} />
        </button>
      )}
    </div>
  );
}
