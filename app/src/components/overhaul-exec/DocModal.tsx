"use client";

// กล่องแสดงเอกสาร (ใบรับรอง/รายงาน) — โครง modal เดียวกับ ApproveModal (.modal > .modal-hd/.modal-bd/.modal-ft)
// ⚠️ แบบฟอร์มจำลอง — กฟภ. ยังไม่ส่งแบบจริง (เจ้าของงานให้จำลองไปก่อน 30 ก.ย. 2569)
import { useEffect } from "react";

export function DocModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal lg" role="dialog" aria-modal="true" aria-labelledby="doc-title">
        <div className="modal-hd">
          <div className="modal-hd-c">
            <h2 id="doc-title">{title}</h2>
            <button className="btn btn-t btn-icon" onClick={onClose} aria-label="ปิด">
              <span className="ms">close</span>
            </button>
          </div>
        </div>
        <div className="modal-bd">
          {children}
        </div>
        <div className="modal-ft">
          <div className="modal-ft-a">
            <div className="modal-ft-r">
              <button className="btn btn-s" onClick={onClose}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
