/** Figma: `Breadcrumbs` = `_Breadcrumbs item / Home` + `_Breadcrumbs item / Separator` + `_Breadcrumbs item / Link` (Current=True|False)
 *  ค่าเทียบ components.css .crumbs .crumbs .sep .crumbs .cur — 12/Regular · gray-600 · หน้าปัจจุบัน brand-900 ·
 *  ตัวคั่นเป็นสี่เหลี่ยม 6×6 หมุน 45° (เส้นขวา+ล่าง gray-300) · ไอคอนบ้าน 20 gray-500 */
import Link from "next/link";
import { Fragment } from "react";
import { routes } from "@/lib/routes";
import { cx } from "./cx";
import { Icon } from "./Icon";

export interface Crumb {
  label: string;
  /** ไม่ใส่ = หน้าปัจจุบัน (ตัวสุดท้าย) */
  href?: string;
}

export interface BreadcrumbsProps {
  /** ไม่ต้องใส่ "หน้าแรก" — ใส่ให้เองจาก homeHref */
  items: Crumb[];
  homeHref?: string;
  homeLabel?: string;
  className?: string;
}

export function Breadcrumbs({ items, homeHref = routes.home(), homeLabel = "หน้าแรก", className }: BreadcrumbsProps) {
  const all: Crumb[] = [{ label: homeLabel, href: homeHref }, ...items];
  return (
    <nav aria-label="breadcrumb" className={cx("mb-1.5 flex flex-wrap items-center gap-2 py-2 text-xs text-gray-600", className)}>
      <Icon name="home" size={20} className="text-gray-500" />
      {all.map((c, i) => {
        const last = i === all.length - 1;
        return (
          <Fragment key={i}>
            {i > 0 && <span aria-hidden className="inline-block size-1.5 shrink-0 -rotate-45 border-r border-b border-gray-300" />}
            {last || !c.href ? (
              <span className={cx(last && "text-brand-900")} aria-current={last ? "page" : undefined}>
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="text-inherit no-underline hover:text-gray-700">
                {c.label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
