"use client";
/* S1 สร้างแผน — HTML ต้นทาง design-mock/overhaul-v2-02-plan-form.html (ฟอร์มอยู่ที่ src/components/plans/PlanForm.tsx)
   บันทึกสำเร็จ → รายการแผน ?saved=create ("การสร้างแผน overhaul สำเร็จ") · ย้อนกลับ → รายการแผน */
import { PlanForm } from "@/components/plans/PlanForm";
import { routes } from "@/lib/routes";

export default function PlanNewPage() {
  return <PlanForm backHref={routes.plans()} createdHref={routes.plans("create")} />;
}
