/** Figma: ไอคอน Material Symbols (Rounded/Outlined 20–24) ที่ฝังใน component ทุกตัวของ (Component) VMS Plus
 *  เช่น `search-24-300-round` · `more_horiz-20-400-round` · ค่าเทียบ components.css .ms
 *  ใช้ฟอนต์ Material Symbols Outlined (โหลดใน layout.tsx) — ห้าม emoji / inline svg
 *  ขนาดใช้ ! (important) เพราะสไตล์ชีตของ Google ตั้ง .material-symbols-outlined{font-size:24px} แบบไม่มี layer ซึ่งชนะ utility */
import { cx } from "./cx";

export type IconSize = 12 | 16 | 20 | 22 | 24 | 28 | 32;

const SIZE: Record<IconSize, string> = {
  12: "text-[12px]!",
  16: "text-[16px]!",
  20: "text-[20px]!",
  22: "text-[22px]!",
  24: "text-[24px]!",
  28: "text-[28px]!",
  32: "text-[32px]!",
};

export interface IconProps {
  /** ชื่อไอคอน Material Symbols เช่น "add" "more_horiz" */
  name: string;
  /** px — ค่าตั้งต้น 22 ตาม .ms */
  size?: IconSize;
  /** ไอคอนทึบ (FILL 1) เช่น check_circle ใน Notification */
  filled?: boolean;
  className?: string;
  /** ใส่เมื่อไอคอนสื่อความหมายเอง (ไม่มีข้อความข้างๆ) */
  label?: string;
}

export function Icon({ name, size = 22, filled, className, label }: IconProps) {
  return (
    <span
      className={cx(
        "material-symbols-outlined inline-block shrink-0 select-none align-middle leading-none antialiased",
        SIZE[size],
        filled && "[font-variation-settings:'FILL'_1]",
        className,
      )}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {name}
    </span>
  );
}
