"use client";

// โครงหน้า .shell > .side.wide + .work > .topbar + .content — design-system README หัวข้อ 4.1
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { usePlans } from "@/lib/store";
import { useOverhaulV2 } from "@/lib/storeV2";

// หน้าดำเนินการรายคัน (/overhaul/[id]/vehicles/…) นับเป็นเมนู "จัดการงาน Overhaul" ไม่ใช่ "แผน"
const isJob = (p: string) => p.startsWith("/overhaul-jobs") || p.includes("/vehicles/");
// เมนู "Overhaul" = ฉบับรายคัน + PO (เคาะ 12 ต.ค. 2569 · ยกจาก design-mock/overhaul-v2-*.html)
// 2 เมนูล่างคือฉบับแผน Overhaul เดิม (1 ต.ค. 2569) — เก็บไว้เทียบ
const NAV = [
  { href: "/overhaul-v2", icon: "build_circle", label: "Overhaul", match: (p: string) => p.startsWith("/overhaul-v2") },
  { href: "/overhaul", icon: "list_alt", label: "แผน Overhaul (เดิม)", match: (p: string) => p.startsWith("/overhaul") && !p.startsWith("/overhaul-v2") && !isJob(p) },
  { href: "/overhaul-jobs", icon: "event_note", label: "จัดการงาน (เดิม)", match: isJob },
];

const ToastCtx = createContext<(msg: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reset } = usePlans();
  const { reset: resetV2 } = useOverhaulV2();
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const toast = useCallback((m: string) => {
    setMsg(m);
    setShow(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShow(false), 2500);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      <div className="shell">
        <aside className="side wide">
          <div className="vlogo">
            VMS<em>+</em>
          </div>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`nv${n.match(pathname) ? " on" : ""}`} title={n.label}>
              <span className="ms">{n.icon}</span>
              <span className="nvlbl">{n.label}</span>
            </Link>
          ))}
        </aside>
        <div className="work">
          <div className="topbar">
            <button
              className="btn btn-o btn-sm mr-auto!"
              onClick={() => {
                reset();
                resetV2();
                toast("รีเซ็ตข้อมูลเดโมแล้ว");
              }}
            >
              <span className="ms">restart_alt</span> เริ่มเดโมใหม่
            </button>
            <span className="ms">account_circle</span>
            <span>นายวิชัย ช่างกล — กบค.</span>
          </div>
          <main className="content">
            <div className="draft">Prototype (Mock) — งาน Overhaul (TOR ข้อ 7.4.1) · ข้อมูลเก็บในเบราว์เซอร์</div>
            {children}
          </main>
        </div>
      </div>
      <div className={`toast${show ? " show" : ""}`}>{msg}</div>
    </ToastCtx.Provider>
  );
}
