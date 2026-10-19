"use client";
/** Figma: `Sidebar navigation` State=Collapsed (80px) + `Nav button` (State=Active|Default · 40×40 r8 · ไอคอน 24) — กางตอน hover (.side.wide ของต้นแบบ)
 *        `Header navigation` — กติกา R1 (figma-export/component-rules.md · รีวิว 19 ต.ค. 2569): จอ ≥ 768 ใช้ Breakpoint=Tablet
 *          (h64 · pad 12/16 · gap 8 · เส้นล่าง gray-200 · ซ้าย = Brand logo + `Nav button` เมนู · ขวา = `Nav button` แจ้งเตือน + ผู้ใช้)
 *          จอ < 768 ใช้ Breakpoint=Mobile (ซ้าย = Brand logo · ขวา = แจ้งเตือน + `Nav button` เมนู) · ช่องค้นหาในตัวของไลบรารีไม่ได้ใส่ (ไม่มีฟังก์ชันค้นหา)
 *          กดเมนูเปิดแผงนำทางจากซ้าย
 *  ค่าเทียบ components.css .shell .side.wide .vlogo .nv(.on) .nvlbl .work (max 1536 กลาง) .topbar .content (pad 22/32/48 · มือถือ 16)
 *  ผู้ใช้แสดงเป็นข้อความตาม HTML mock (component ใช้ `Avatar`) */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { routes } from "@/lib/routes";
import { DraftBanner, Icon, cx } from "@/components/ui";
import { StoreGate } from "@/lib/mock/store";

const NAV = [{ href: routes.home(), match: ["/plans", "/po", "/job"], icon: "build_circle", label: "จัดการงาน Overhaul" }];
const USER = "นางสาวกนกวรรณ ใจมั่น — กบค.";

function Logo({ className }: { className?: string }) {
  return (
    <div className={cx("text-[20px] leading-none font-extrabold text-brand-900", className)}>
      VMS<em className="text-brand-accent not-italic">+</em>
    </div>
  );
}

/** Figma: `Nav button` (State=Default · 40×40 r8 pad 8 · ไอคอน 24 gray-500 · hover พื้น gray-200) */
function NavButton({ icon, label, onClick, expanded, className }: { icon: string; label: string; onClick?: () => void; expanded?: boolean; className?: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-expanded={expanded}
      onClick={onClick}
      className={cx("flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-200 focus-visible:shadow-ring focus-visible:outline-none", className)}
    >
      <Icon name={icon} size={24} />
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname() || "/";
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [path]);
  const active = (m: string[]) => m.some((p) => path.startsWith(p));

  return (
    <div className="flex min-h-dvh bg-white">
      {/* ---------- Sidebar navigation (≥ 768) ---------- */}
      <aside
        aria-label="เมนูหลัก"
        className="group/side peer/side sticky top-0 z-40 flex h-dvh w-20 shrink-0 flex-col items-center gap-5 overflow-hidden border-r border-gray-200 bg-white py-3 transition-[width,margin-right,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-mr-[200px] hover:w-[280px] hover:shadow-side max-md:hidden"
      >
        <Logo className="mb-1 w-20 shrink-0 self-start text-center" />
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            title={n.label}
            className={cx(
              "flex h-10 w-10 items-center justify-center gap-0 overflow-hidden rounded-md whitespace-nowrap no-underline transition-[width,gap,padding,background-color,color] duration-300 group-hover/side:w-[calc(100%-24px)] group-hover/side:justify-start group-hover/side:gap-3 group-hover/side:px-4",
              active(n.match) ? "bg-gray-200 text-brand-900" : "text-gray-500 hover:bg-gray-200",
            )}
          >
            <Icon name={n.icon} size={24} />
            <span className="block max-w-0 min-w-0 -translate-x-1.5 overflow-hidden text-sm font-medium text-ellipsis opacity-0 transition-[max-width,opacity,transform] duration-300 group-hover/side:max-w-[188px] group-hover/side:translate-x-0 group-hover/side:opacity-100">
              {n.label}
            </span>
          </Link>
        ))}
      </aside>
      {/* ฉากหลังจางตอนเมนูกาง (.shell:has(>.side.wide:hover)::after) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-35 bg-black/20 opacity-0 backdrop-blur-[5px] transition-opacity duration-300 peer-hover/side:opacity-100 max-md:hidden" />

      <div className="mx-auto flex min-w-0 max-w-[1536px] flex-1 flex-col bg-white">
        {/* ---------- Header navigation — ≥ 768 = Breakpoint=Tablet (กติกา R1) · < 768 = Breakpoint=Mobile ---------- */}
        <header className="flex h-16 items-center gap-2 border-b border-gray-200 bg-white px-4 py-3 text-gray-600">
          <div className="flex items-center gap-2">
            <Logo className="px-1" />
            <NavButton icon="menu" label="เปิดเมนู" expanded={drawer} onClick={() => setDrawer(true)} className="max-md:hidden" />
          </div>
          <div className="ml-auto flex min-w-0 items-center gap-2">
            <NavButton icon="notifications" label="การแจ้งเตือน" />
            <span className="flex min-w-0 items-center gap-1">
              <Icon name="account_circle" size={28} />
              <span className="truncate max-md:hidden">{USER}</span>
            </span>
            <NavButton icon="menu" label="เปิดเมนู" expanded={drawer} onClick={() => setDrawer(true)} className="md:hidden" />
          </div>
        </header>

        <main className="w-full px-8 pt-[22px] pb-12 max-md:p-4 max-md:pb-12">
          <DraftBanner />
          <StoreGate>{children}</StoreGate>
        </main>
      </div>

      {/* ---------- แผงนำทางบนจอแคบ ---------- */}
      {drawer && (
        <div className="fixed inset-0 z-60 bg-black/60" onMouseDown={(e) => e.target === e.currentTarget && setDrawer(false)}>
          <nav aria-label="เมนูหลัก" className="flex h-full w-[280px] max-w-[85vw] animate-drawer-left flex-col gap-5 bg-white py-3">
            <div className="flex items-center justify-between px-4">
              <Logo />
              <button type="button" aria-label="ปิดเมนู" onClick={() => setDrawer(false)} className="flex size-10 cursor-pointer items-center justify-center rounded-md text-gray-500 hover:bg-gray-200">
                <Icon name="close" size={24} />
              </button>
            </div>
            <div className="px-3 text-sm text-gray-600">{USER}</div>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cx("mx-3 flex h-10 items-center gap-3 rounded-md px-4 text-sm font-medium no-underline", active(n.match) ? "bg-gray-200 text-brand-900" : "text-gray-500 hover:bg-gray-200")}
              >
                <Icon name={n.icon} size={24} />
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
