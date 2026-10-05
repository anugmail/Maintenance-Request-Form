"use client";

// ปิดแผน Overhaul — แผนมีหลายคัน แต่ละคันปิดงานของตัวเองที่ขั้น ⑦ รายงานปิดงาน
// ครบทุกคันแล้วจึง "ส่งอนุมัติปิดแผน" → หัวหน้า กบค. อนุมัติ (CLOSED) / ตีกลับพร้อมเหตุผล (กลับเป็น ACTIVE)
// เจ้าของงานเคาะ 1 ต.ค. 2569 "ปิดรายคัน + ปิดแผนตอนครบ" · สรุปค่าใช้จ่ายรวมทั้งแผนเทียบงบประมาณ (JO 7.4.1-01 งบประมาณ · 7.4.2-06)
// ⚠️ ปุ่มอนุมัติ/ตีกลับ กดแทนหัวหน้า — ยังไม่แยกสิทธิ์
import { useState } from "react";
import { usePlans } from "@/lib/store";
import { RoField } from "@/components/RoField";
import { APPROVER, fmtBaht, fmtDate, fmtTime, vehicleById, type OverhaulPlan } from "@/lib/overhaul";
import { EXEC_STAGE_BADGE, EXEC_STAGE_LABEL, costSummary, execStage, planProgress } from "@/lib/overhaulExec";

export function PlanCloseCard({ plan }: { plan: OverhaulPlan }) {
  const { update } = usePlans();
  const [reason, setReason] = useState("");
  const { done, total } = planProgress(plan);
  const rows = plan.vehicles.flatMap((pv) => {
    const v = vehicleById(pv.vehicleId);
    return v ? [{ pv, v, cost: costSummary(pv, v), stage: execStage(pv) }] : [];
  });
  const sum = rows.reduce((s, r) => ({ parts: s.parts + r.cost.parts, labor: s.labor + r.cost.labor, total: s.total + r.cost.total }), {
    parts: 0,
    labor: 0,
    total: 0,
  });
  const allDone = total > 0 && done === total;

  return (
    <div className="card">
      <div className="stack">
        <div className="sect">ปิดแผน Overhaul</div>
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>ทะเบียน</th>
                <th>สถานะงาน</th>
                <th>ใบรับรองความปลอดภัย</th>
                <th className="text-right">ค่าอะไหล่</th>
                <th className="text-right">ค่าแรง</th>
                <th className="text-right">ค่าใช้จ่ายรวม</th>
                <th className="text-right">% มูลค่ารถ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ pv, v, cost, stage }) => (
                <tr key={v.id}>
                  <td>
                    <div className="cell-key">{v.plate}</div>
                    <div className="cell-sub">{v.equipmentBrand}</div>
                  </td>
                  <td>
                    <span className={`badge ${EXEC_STAGE_BADGE[stage]}`}>{EXEC_STAGE_LABEL[stage]}</span>
                  </td>
                  <td>{pv.post?.certNo ?? <span className="cell-sub">—</span>}</td>
                  <td className="text-right">{fmtBaht(cost.parts)}</td>
                  <td className="text-right">{fmtBaht(cost.labor)}</td>
                  <td className="text-right">{fmtBaht(cost.total)}</td>
                  <td className="text-right">{cost.pct.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="fgrid m-0">
          <RoField label="ปิดงานแล้ว" icon="task_alt" value={`${done}/${total} คัน`} />
          <RoField label="งบประมาณ (บาท)" icon="account_balance_wallet" value={fmtBaht(plan.budget)} />
          <RoField label="ค่าใช้จ่ายรวมทั้งแผน (บาท)" icon="payments" value={fmtBaht(sum.total)} />
          <RoField label="งบประมาณคงเหลือ (บาท)" icon="savings" value={fmtBaht(plan.budget - sum.total)} />
        </div>

        {plan.status === "ACTIVE" && plan.closeRejectReason && (
          <div className="note note-warn">
            <span className="ms">info</span>
            <span>ตีกลับการปิดแผน — เหตุผล: {plan.closeRejectReason}</span>
          </div>
        )}
        {plan.status === "CLOSED" && plan.closedAt && (
          <div className="note note-ok">
            <span className="ms">task_alt</span>
            <span>
              ปิดแผนแล้วโดย {plan.closedBy} · {fmtDate(plan.closedAt)} {fmtTime(plan.closedAt)}
            </span>
          </div>
        )}

        {plan.status === "ACTIVE" && (
          <div className="flex justify-end">
            <button
              className="btn btn-p"
              disabled={!allDone}
              title={allDone ? undefined : `ปิดงานรายคันแล้ว ${done}/${total} คัน`}
              onClick={() => update(plan.id, { status: "CLOSING", closeSubmittedAt: new Date().toISOString(), closeRejectReason: undefined })}
            >
              <span className="ms">send</span> ส่งอนุมัติปิดแผน
            </button>
          </div>
        )}

        {plan.status === "CLOSING" && (
          <>
            <div className="f">
              <label htmlFor="plan-close-reject">เหตุผล (กรอกเมื่อตีกลับ)</label>
              <textarea id="plan-close-reject" rows={2} placeholder="ระบุเหตุผลที่ตีกลับ…" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="btn btn-d"
                disabled={!reason.trim()}
                onClick={() => {
                  update(plan.id, { status: "ACTIVE", closeSubmittedAt: undefined, closeRejectReason: reason.trim() });
                  setReason("");
                }}
              >
                <span className="ms">u_turn_left</span> ตีกลับ
              </button>
              <button
                className="btn btn-p"
                onClick={() => update(plan.id, { status: "CLOSED", closedAt: new Date().toISOString(), closedBy: APPROVER, closeRejectReason: undefined })}
              >
                <span className="ms">task_alt</span> อนุมัติปิดแผน
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
