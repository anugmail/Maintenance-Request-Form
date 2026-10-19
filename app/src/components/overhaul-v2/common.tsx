"use client";

// ชิ้นส่วนร่วมของหน้า Overhaul v2 — โครง modal เดียวกับ ApproveModal (.modal > .modal-hd/.modal-bd/.modal-ft · ไลบรารี Modal 2:16)
// · ไฟล์แนบ .file-chip (ไลบรารี File upload 3:25) · ช่องอ่านอย่างเดียว .f.ro
import { createContext, useContext } from "react";
import type { Job, OvhState, Vehicle } from "@/lib/overhaulV2";

export function Modal({
  title, sub, size = "lg", onClose, footer, children,
}: {
  title: string; sub?: string; size?: "md" | "lg"; onClose: () => void; footer: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-hd">
          <div className="modal-hd-c">
            <div className="flex-1 min-w-0">
              <h2>{title}</h2>
              {sub && <div className="modal-sub">{sub}</div>}
            </div>
            <button type="button" className="modal-x" onClick={onClose} aria-label="ปิด">
              <span className="ms">close</span>
            </button>
          </div>
        </div>
        <div className="modal-bd">{children}</div>
        <div className="modal-ft">
          <div className="modal-ft-a">
            <div className="modal-ft-r">{footer}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FileChip({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span className="file-chip">
      <span className="ms">description</span>
      <span className="file-chip-name">{name}</span>
      {onRemove && (
        <button type="button" className="file-chip-rm" onClick={onRemove} aria-label="ลบไฟล์">
          <span className="ms">close</span>
        </button>
      )}
    </span>
  );
}

export function Ro({ label, value, span }: { label: string; value: string; span?: string }) {
  return (
    <div className={`f ro${span ? ` ${span}` : ""}`}>
      <label>{label}</label>
      <div className="in noic">
        <input type="text" readOnly value={value} />
      </div>
    </div>
  );
}

// บริบทของงานที่กำลังเปิด — ส่งให้คอมโพเนนต์ทุกขั้นโดยไม่ต้องไล่ prop
export interface JobCtx {
  v: Vehicle;
  j: Job;
  s: OvhState;
  readOnly: boolean;
  // แก้ไขงาน — คืนข้อความเพื่อบันทึกลงประวัติการดำเนินการ
  edit: (fn: (j: Job, s: OvhState) => string | void, toastMsg?: string) => void;
  go: (step: number) => void;
}
export const JobContext = createContext<JobCtx | null>(null);
export const useJob = () => {
  const c = useContext(JobContext);
  if (!c) throw new Error("useJob ต้องอยู่ใน JobContext");
  return c;
};
