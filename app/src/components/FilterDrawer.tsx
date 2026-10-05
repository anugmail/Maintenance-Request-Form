"use client";

// แผงตัวกรองเลื่อนจากขวา — .filter-drawer ของ components.css (README หัวข้อ 4 "Filter drawer")
// โครง/พฤติกรรมตามแผงตัวกรองรายการ กบค. ใน mock/Maintenance-Request-Form.html:
// เลือกค่าในแผงแล้วยังไม่กรองจนกด "ตกลง" · "ล้างตัวกรอง" ล้างและกรองใหม่ทันที · ปิดด้วย ✕ / คลิกพื้นหลัง / Esc
import { useEffect } from "react";

interface Props {
  id: string;
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  children: React.ReactNode; // .filter-field หลายช่อง
}

export function FilterDrawer({ id, open, onClose, onApply, onClear, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <div
      className={`filter-panel filter-drawer${open ? " open" : ""}`}
      id={id}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="filter-drawer-sheet" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
        <div className="filter-drawer-head">
          <span className="filter-drawer-icon">
            <span className="ms">filter_list</span>
          </span>
          <div className="filter-drawer-title">
            <h2 id={`${id}-title`}>ตัวกรอง</h2>
            <p>กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ</p>
          </div>
          <button type="button" className="filter-drawer-close" aria-label="ปิดตัวกรอง" onClick={onClose}>
            <span className="ms">close</span>
          </button>
        </div>
        <div className="filter-drawer-body">{children}</div>
        <div className="filter-drawer-foot">
          <button className="btn btn-link" onClick={onClear}>
            ล้างตัวกรอง
          </button>
          <button className="btn btn-s" onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn btn-p" onClick={onApply}>
            ตกลง
          </button>
        </div>
      </div>
    </div>
  );
}

// ปุ่ม "ตัวกรอง" บนแถบเครื่องมือ — โชว์จำนวนเงื่อนไขเสมอ รวมตอนเป็น 0 (ตาม markFilterBtn() ของ mock)
export function FilterButton({ count, controls, onClick }: { count: number; controls: string; onClick: () => void }) {
  return (
    <button className="btn btn-s" aria-controls={controls} onClick={onClick}>
      <span className="ms">filter_list</span> ตัวกรอง
      <span className="badge b-neutral">{count}</span>
    </button>
  );
}
