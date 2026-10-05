// สถานะว่าง — ภาพ "โฟลเดอร์หน้าเศร้า EMPTY" ชุดเดียวกับหน้าเก่า (.parts-empty ของ components.css)
// ภาพยกจาก figma/รอตอบกลับจากหน่วยงาน.svg → assets/parts-requisition/screen-1-image-0.png
// ใช้อยู่แล้วที่ design-mock/kbk-self-repair-parts.html และ waitingReplyPanelHTML() ใน mock — import ตรงจาก assets/ ไม่ก๊อปซ้ำ
import emptyImg from "../../../assets/parts-requisition/screen-1-image-0.png";

export function EmptyState({ title, desc, children }: { title: string; desc?: string; children?: React.ReactNode }) {
  return (
    <div className="parts-empty">
      {/* eslint-disable-next-line @next/next/no-img-element -- ขนาดคุมด้วย .parts-empty-image */}
      <img className="parts-empty-image" src={emptyImg.src} alt="" />
      <b>{title}</b>
      {desc && <span>{desc}</span>}
      {children && <div className="flex justify-center gap-3 mt-6">{children}</div>}
    </div>
  );
}
