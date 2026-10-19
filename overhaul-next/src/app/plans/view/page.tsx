"use client";
/* รายละเอียดแผน (?id=) — S1 ปลายทาง · S2/S3 จุดเข้า · S4–S6 รายการ PO — HTML ต้นทาง design-mock/overhaul-v2-03-plan-detail.html
   เนื้อหาอยู่ใน src/components/plan-detail/PlanDetail.tsx */
import { Suspense } from "react";
import { PlanDetail } from "@/components/plan-detail/PlanDetail";

export default function PlanViewPage() {
  return (
    <Suspense>
      <PlanDetail />
    </Suspense>
  );
}
