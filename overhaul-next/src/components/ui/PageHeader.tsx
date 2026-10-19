/** Figma: `Page header` (Breakpoint=Desktop|Mobile) — Breadcrumbs + Back action (`Tertiary button` arrow_back) + Title +
 *  Badge + Supporting text + Actions · **Divider = ปิด** (เจ้าของงานเคาะ 19 ต.ค. 2569: ไม่มีเส้นใต้หัวหน้า)
 *  ค่าเทียบ components.css .crumbs + .page-title-row .page-title (32/600/48 · มือถือ 22) + .page-title-row .badge (ห่าง 10)
 *  Text and supporting text: ชื่อ (+ Badge ห่าง 10) แล้ว Supporting text 16 gray-600 ห่าง 8 · Actions gap 12 ชิดขวา
 *  มือถือ (< 768): Actions ลงไปอยู่ใต้ชื่อ ปุ่มสูง 48 แบ่งความกว้างเท่ากัน (Page header Breakpoint=Mobile · Actions gap 16) */
import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { Button } from "./Button";
import { cx } from "./cx";

export interface PageHeaderProps {
  title: ReactNode;
  /** ลำดับหน้า (ไม่ต้องใส่ "หน้าแรก") — ตัวสุดท้ายคือหน้านี้ */
  crumbs?: Crumb[];
  /** ลิงก์ย้อนกลับ → ปุ่ม arrow_back หน้าชื่อ */
  backHref?: string;
  /** ใช้แทน backHref เมื่อต้องถามก่อนออก (ฟอร์มมีการแก้ไข) */
  onBack?: () => void;
  /** ป้ายสถานะต่อท้ายชื่อ */
  badge?: ReactNode;
  /** Supporting text ใต้ชื่อ (16 gray-600) */
  subtitle?: ReactNode;
  /** ปุ่มขวาบน (desktop) / ใต้ชื่อ (มือถือ) */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, crumbs, backHref, onBack, badge, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cx("mb-5 max-md:mb-3.5", className)}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="flex flex-wrap items-start gap-x-3 gap-y-4">
        <div className="flex min-w-0 flex-1 basis-auto flex-col gap-2">
          <div className="flex min-w-0 items-center gap-1">
            {(backHref || onBack) && (
              <Button variant="tertiary" iconOnly="arrow_back" aria-label="ย้อนกลับ" href={onBack ? undefined : backHref} onClick={onBack} />
            )}
            <h1 className="min-w-0 text-title font-semibold text-black max-md:text-title-m">{title}</h1>
            {badge && <span className="ml-2.5 shrink-0">{badge}</span>}
          </div>
          {subtitle && <p className="text-md text-gray-600">{subtitle}</p>}
        </div>
        {actions && (
          <div className="ml-auto flex min-h-12 items-center gap-3 max-md:ml-0 max-md:w-full max-md:gap-4 max-md:[&>*]:h-12 max-md:[&>*]:flex-1">{actions}</div>
        )}
      </div>
    </header>
  );
}
