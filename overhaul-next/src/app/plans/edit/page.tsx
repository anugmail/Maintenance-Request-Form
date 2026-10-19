"use client";
/* S2 แก้ไขแผน (?id=<เลขแผน>[&from=detail]) — HTML ต้นทาง design-mock/overhaul-v2-02-plan-form.html?id= (ฟอร์มอยู่ที่ src/components/plans/PlanForm.tsx)
   userflow "Edit plan - Condition": มาจาก 2 ทาง — หน้ารายการ (กลับรายการ) · หน้ารายละเอียด from=detail (กลับรายละเอียด)
   บันทึกการแก้ไขสำเร็จ → หน้าที่มา ?saved=edit ("บันทึกการแก้ไขแผนสำเร็จ")
   ไม่พบเลขแผน → แจ้ง "ไม่พบแผน <id>" (Notification Error) แล้วแสดงฟอร์มสร้างแผนเหมือน HTML */
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { PlanForm } from "@/components/plans/PlanForm";
import { useToast } from "@/components/ui";
import { useMockStore } from "@/lib/mock";
import { routes } from "@/lib/routes";

function Inner() {
  const params = useSearchParams();
  const id = params.get("id") ?? "";
  const fromDetail = params.get("from") === "detail";
  const plan = useMockStore().getPlan(id);
  const toast = useToast();

  const warned = useRef(false);
  useEffect(() => {
    if (id && !plan && !warned.current) {
      warned.current = true;
      toast.error(`ไม่พบแผน ${id}`);
    }
  }, [id, plan, toast]);

  if (!plan) return <PlanForm key="new" backHref={routes.plans()} createdHref={routes.plans("create")} />;
  const back = fromDetail ? routes.planView(plan.id) : routes.plans();
  const saved = fromDetail ? routes.planView(plan.id, "edit") : routes.plans("edit");
  return <PlanForm key={plan.id} plan={plan} backHref={back} savedHref={saved} />;
}

export default function PlanEditPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
