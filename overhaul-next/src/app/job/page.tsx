"use client";
/* S7–S14 งานรายคัน 6 ขั้น (?plan=&car=&po=[&step=]) — HTML ต้นทาง design-mock/overhaul-v2-06-job.html
   Figma: `Page header` + `Empty state/Search not found` (ไม่พบงาน) · หน้าจริงประกอบใน src/components/job/JobView.tsx
   PO: ใช้ ?po= ถ้ารถอยู่ใน PO นั้น ไม่งั้นใช้ PO แรกของแผนที่มีรถคันนี้ (เหมือน HTML) */
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { JobView } from "@/components/job/JobView";
import { Button, EmptyState, PageHeader } from "@/components/ui";
import { findCar, posOfCar, useMockStore, vendorOf } from "@/lib/mock";
import { routes } from "@/lib/routes";

function Inner() {
  const sp = useSearchParams();
  const planId = sp.get("plan") ?? "";
  const carId = sp.get("car") ?? "";
  const poId = sp.get("po") ?? "";
  const step = Number(sp.get("step")) || undefined;
  const store = useMockStore();
  const plan = store.getPlan(planId);
  const car = findCar(carId);
  const pos = plan && car ? posOfCar(plan, car.id) : [];
  const po = pos.find((o) => o.id === poId) ?? pos[0];
  const vendor = vendorOf(po);

  if (!plan || !car || !po || !vendor) {
    return (
      <>
        <PageHeader title="ไม่พบงาน" crumbs={[{ label: "จัดการงาน Overhaul", href: routes.plans() }, { label: "หน้างาน" }]} backHref={routes.plans()} />
        <EmptyState
          kind="notFound"
          title="ไม่พบงานของรถคันนี้"
          description="ตรวจสอบแผนและรถอีกครั้ง"
          action={
            <Button variant="secondary" size="sm" href={routes.plans()}>
              กลับหน้ารายการแผน
            </Button>
          }
        />
      </>
    );
  }

  return (
    <JobView
      key={`${plan.id}:${car.id}:${po.id}`}
      plan={plan}
      car={car}
      po={po}
      vendor={vendor}
      job={store.getJob(plan.id, car.id)}
      initialStep={step}
    />
  );
}

export default function JobPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
