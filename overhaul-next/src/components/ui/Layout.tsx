/** โครงจัดวางของฟอร์ม/หน้า — ไม่ใช่ component ไลบรารีโดยตรง แต่จัดตาม frame ของหน้าจอใน Figma:
 *  - FooterActions: แถว `Actions` ท้ายหน้า (ปลั๊กอิน btnRow) — 2 ปุ่ม = ยกเลิก/ย้อนกลับชิดซ้าย · ยืนยันชิดขวา · ปุ่มเดียวชิดขวา ·
 *    มือถือ ปุ่มแบ่งความกว้างเท่ากัน gap 16 (แบบ `Bottom sheet footer`) — เจ้าของงานแก้ในแบบจริง 19 ต.ค. 2569
 *  - FormGrid/FormCell: กริดช่องกรอก 1 (มือถือ) / 3 (768–1279) / 6 (≥1280) คอลัมน์ · ระยะ 32/24 — components.css .fgrid + utility ของ HTML mock
 *  - WbsRow: กติกา F10 (plan.md) — วงเงินอนุมัติครึ่งซ้าย + เลข WBS · เลขโครงข่าย · เลขกิจกรรม แบ่งครึ่งขวา (จอกว้าง) ·
 *    แท็บเล็ต วงเงินเต็มแถวแล้ว 3 ช่องเรียงใต้ · มือถือ 1 คอลัมน์ */
import type { ReactNode } from "react";
import { cx } from "./cx";

export function FooterActions({ left, right, className }: { left?: ReactNode; right: ReactNode; className?: string }) {
  return (
    // มือถือ: ห่อทั้ง 2 ฝั่งด้วย div basis-0 ⇒ แบ่งกว้างเท่ากันจริง (เดิมปุ่มซ้ายถือ flex-1 เอง padding ของปุ่มทำให้กว้างไม่เท่า)
    <div className={cx("flex items-center justify-between gap-3 max-md:gap-4", className)}>
      {left ? <div className="flex items-center max-md:min-w-0 max-md:flex-1 max-md:basis-0 max-md:[&>*]:w-full">{left}</div> : <span className="max-md:hidden" />}
      <div className="ml-auto flex items-center gap-3 max-md:ml-0 max-md:min-w-0 max-md:flex-1 max-md:basis-0 max-md:[&>*]:min-w-0 max-md:[&>*]:flex-1">{right}</div>
    </div>
  );
}

export function FormGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3 xl:grid-cols-6", className)}>{children}</div>;
}

/** span ใน FormGrid (6 คอลัมน์จอกว้าง / 3 แท็บเล็ต / 1 มือถือ)
 *  full = เต็มแถว · wide = 4/6 (2/3) · narrow = 2/6 (1/3) · half = 3/6 (เต็มแถวแท็บเล็ต) · sixth = 1/6 (1/3) */
const SPAN = {
  full: "md:col-span-3 xl:col-span-6",
  wide: "md:col-span-2 xl:col-span-4",
  narrow: "xl:col-span-2",
  half: "md:col-span-3",
  sixth: "",
} as const;

export function FormCell({ span = "narrow", children, className }: { span?: keyof typeof SPAN; children: ReactNode; className?: string }) {
  return <div className={cx("min-w-0", SPAN[span], className)}>{children}</div>;
}

/** แถว F10 — ใส่ใน <FormGrid> · money = ช่องวงเงิน · wbs/network/activity = 3 ช่องตามลำดับนี้ */
export function WbsRow({ money, wbs, network, activity }: { money: ReactNode; wbs: ReactNode; network: ReactNode; activity: ReactNode }) {
  return (
    <>
      <FormCell span="half">{money}</FormCell>
      <FormCell span="sixth">{wbs}</FormCell>
      <FormCell span="sixth">{network}</FormCell>
      <FormCell span="sixth">{activity}</FormCell>
    </>
  );
}
