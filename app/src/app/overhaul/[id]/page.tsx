"use client";

// หน้ารายละเอียดแผน Overhaul — ข้อมูลแผน (สเปก 6.1) + รถที่ผ่านคัดเลือก (สเปก 6.2)
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { usePlans } from "@/lib/store";
import { VehicleTable } from "@/components/VehicleTable";
import { RoField } from "@/components/RoField";
import { ApproveModal } from "@/components/ApproveModal";
import { EmptyState } from "@/components/EmptyState";
import { PlanCloseCard } from "@/components/PlanCloseCard";
import { planProgress } from "@/lib/overhaulExec";
import {
  STATUS_BADGE,
  STATUS_LABEL,
  canApprove,
  canEdit,
  fmtBaht,
  fmtDate,
  fmtTime,
  isApprovedPlan,
  vehicleById,
  type Vehicle,
} from "@/lib/overhaul";

export default function OverhaulDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { ready, get } = usePlans();
  const plan = get(id);
  const [approveOpen, setApproveOpen] = useState(false);

  if (!ready) return null;
  if (!plan)
    return (
      <EmptyState title="ไม่พบแผน Overhaul นี้" desc="แผนอาจถูกลบ หรือลิงก์ไม่ถูกต้อง">
        <Link className="btn btn-g" href="/overhaul">
          <span className="ms">arrow_back</span> กลับรายการ
        </Link>
      </EmptyState>
    );

  const vehicles = plan.vehicles.map((pv) => vehicleById(pv.vehicleId)).filter((v): v is Vehicle => !!v);

  return (
    <>
      <div className="crumbs mb-6">
        <span className="ms">home</span>
        <span className="sep" aria-hidden="true" />
        <Link href="/overhaul">แผน Overhaul</Link>
        <span className="sep" aria-hidden="true" />
        <span className="cur">{plan.planNo}</span>
      </div>
      <div className="page-title-row">
        <button className="page-back" aria-label="กลับรายการ" onClick={() => router.push("/overhaul")}>
          <span className="ms">arrow_back</span>
        </button>
        <h1 className="page-title">{plan.name}</h1>
        <span className={`badge ${STATUS_BADGE[plan.status]}`}>{STATUS_LABEL[plan.status]}</span>
      </div>

      <div className="stack loose">
        {plan.status === "DRAFT" && plan.rejectReason && (
          <div className="note note-warn">
            <span className="ms">info</span>
            <span>หัวหน้าไม่อนุมัติ — เหตุผล: {plan.rejectReason}</span>
          </div>
        )}
        {isApprovedPlan(plan) && plan.approvedAt && (
          <div className="note note-ok">
            <span className="ms">task_alt</span>
            <span>
              อนุมัติแล้วโดย {plan.approvedBy} · {fmtDate(plan.approvedAt)} {fmtTime(plan.approvedAt)}
            </span>
          </div>
        )}
        {plan.status === "CANCELLED" && plan.cancelReason && (
          <div className="note note-warn">
            <span className="ms">info</span>
            <span>ยกเลิกแผนแล้ว — เหตุผล: {plan.cancelReason}</span>
          </div>
        )}

        <div className="card">
          <div className="stack">
            <div className="sect">ข้อมูลแผนงาน</div>
            <div className="fgrid">
              <RoField label="เลขที่แผน" icon="tag" value={plan.planNo} />
              <RoField label="ชื่อแผนงาน" icon="description" value={plan.name} span="sp2" />
              <RoField label="ปีแผนงาน" icon="calendar_month" value={String(plan.year)} />
              <RoField label="งบประมาณ (บาท)" icon="payments" value={fmtBaht(plan.budget)} />
              <RoField
                label="จำนวนรถในแผน"
                icon="local_shipping"
                value={isApprovedPlan(plan) ? `${vehicles.length} คัน · ปิดงานแล้ว ${planProgress(plan).done}/${planProgress(plan).total}` : `${vehicles.length} คัน`}
              />
              <RoField
                label="อัปเดตล่าสุด"
                icon="schedule"
                value={`${fmtDate(plan.updatedAt)} ${fmtTime(plan.updatedAt)}`}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="stack">
            <div className="sect">รถที่เข้าแผน Overhaul ({vehicles.length} คัน)</div>
            {vehicles.length ? (
              <VehicleTable
                vehicles={vehicles}
                picked={plan.vehicles}
                execHref={isApprovedPlan(plan) ? (vid) => `/overhaul/${plan.id}/vehicles/${vid}` : undefined}
              />
            ) : (
              <EmptyState title="ยังไม่มีรถในแผนนี้" />
            )}
          </div>
        </div>

        {isApprovedPlan(plan) && <PlanCloseCard plan={plan} />}

        <div className="actions">
          <Link className="btn btn-g" href="/overhaul">
            <span className="ms">arrow_back</span> กลับรายการ
          </Link>
          {canEdit(plan) && (
            <Link className="btn btn-p" href={`/overhaul/${plan.id}/edit`}>
              <span className="ms">edit</span> แก้ไขแผน
            </Link>
          )}
          {canApprove(plan) && (
            <button className="btn btn-p" onClick={() => setApproveOpen(true)}>
              <span className="ms">task_alt</span> อนุมัติแผน
            </button>
          )}
        </div>
      </div>
      {approveOpen && <ApproveModal plan={plan} onClose={() => setApproveOpen(false)} />}
    </>
  );
}
