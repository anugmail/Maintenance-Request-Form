"use client";

// หัวหน้าอนุมัติแผน Overhaul — เปิดจากไอคอนอนุมัติในตารางรายการ และปุ่มในหน้ารายละเอียด
// โครง modal เดียวกับ "ยกเลิกแผน" ใน PlanForm (.modal md > .modal-hd/.modal-bd/.modal-ft)
// ไม่อนุมัติต้องมีเหตุผล (เหมือนยกเลิกแผน) — แผนกลับเป็นร่างให้ผู้วางแผนแก้แล้วส่งใหม่
import { useState } from "react";
import { usePlans } from "@/lib/store";
import { RoField } from "./RoField";
import { APPROVER, fmtBaht, type OverhaulPlan } from "@/lib/overhaul";

export function ApproveModal({ plan, onClose }: { plan: OverhaulPlan; onClose: () => void }) {
  const { update } = usePlans();
  const [reason, setReason] = useState("");

  const approve = () => {
    update(plan.id, {
      status: "ACTIVE",
      approvedBy: APPROVER,
      approvedAt: new Date().toISOString(),
      rejectReason: undefined,
    });
    onClose();
  };

  const reject = () => {
    update(plan.id, { status: "DRAFT", rejectReason: reason.trim() });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal md" role="dialog" aria-modal="true" aria-labelledby="approve-title">
        <div className="modal-hd">
          <div className="modal-hd-c">
            <h2 id="approve-title">อนุมัติแผน Overhaul</h2>
            <button className="btn btn-t btn-icon" onClick={onClose} aria-label="ปิด">
              <span className="ms">close</span>
            </button>
          </div>
        </div>
        <div className="modal-bd">
          <div className="fgrid grid-cols-2! m-0!">
            <RoField label="เลขที่แผน" icon="tag" value={plan.planNo} />
            <RoField label="ปีแผนงาน" icon="calendar_month" value={String(plan.year)} />
            <RoField label="ชื่อแผนงาน" icon="description" value={plan.name} span="sp4" />
            <RoField label="งบประมาณ (บาท)" icon="payments" value={fmtBaht(plan.budget)} />
            <RoField label="จำนวนรถในแผน" icon="local_shipping" value={`${plan.vehicles.length} คัน`} />
          </div>
          <div className="f">
            <label htmlFor="reject-reason">เหตุผล (กรอกเมื่อไม่อนุมัติ)</label>
            <textarea
              id="reject-reason"
              rows={3}
              placeholder="ระบุเหตุผลที่ไม่อนุมัติ…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-ft">
          <div className="modal-ft-a">
            <div className="modal-ft-r">
              <button className="btn btn-d" disabled={!reason.trim()} onClick={reject}>
                <span className="ms">block</span> ไม่อนุมัติ
              </button>
              <button className="btn btn-p" onClick={approve}>
                <span className="ms">task_alt</span> อนุมัติแผน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
