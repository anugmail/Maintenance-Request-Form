"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { usePlans } from "@/lib/store";
import { PlanForm } from "@/components/PlanForm";
import { EmptyState } from "@/components/EmptyState";
import { STATUS_LABEL, canEdit } from "@/lib/overhaul";

export default function EditOverhaulPlanPage() {
  const { id } = useParams<{ id: string }>();
  const { ready, get } = usePlans();
  const plan = get(id);

  if (!ready) return null;
  if (!plan || !canEdit(plan))
    return (
      <EmptyState
        title={!plan ? "ไม่พบแผน Overhaul นี้" : `${STATUS_LABEL[plan.status]} — แก้ไขไม่ได้`}
      >
        <Link className="btn btn-g" href={plan ? `/overhaul/${plan.id}` : "/overhaul"}>
          <span className="ms">arrow_back</span> {plan ? "กลับหน้าแผน" : "กลับรายการ"}
        </Link>
      </EmptyState>
    );
  // key = id ให้ state ในฟอร์มตั้งค่าใหม่เมื่อเปลี่ยนแผน
  return <PlanForm key={plan.id} plan={plan} />;
}
