"use client";
/* หน้างานรายคัน 6 ขั้น (S7–S14) — HTML ต้นทาง design-mock/overhaul-v2-06-job.html
 * Figma (Component) VMS Plus: `Page header` (Divider=false · Back action · Breadcrumbs · Badge = `Pill outline` สถานะ V1–V11) ·
 *   `Section header` "ข้อมูลยานพาหนะ" + `Content item row` / `_Content item base` (กล่องแสดงข้อมูล R12) ·
 *   `Progress steps` Type=Horizontal ทั้งก้อน 6 ขั้น (R10/R15 — ไลบรารีมี 5 ช่อง รอเคาะ) / `Mobile progress steps` ·
 *   `Modal` Type=Centered (ยืนยันการออก — มือถือ `Bottom sheet`) · `Empty state/Search not found` (ไม่พบงาน) · `Notification`
 * UI Release#2: "5.2 Vehicle Management" `Create vehicle (Step 1)` (stepper แนวนอน)
 * พฤติกรรมตาม HTML:
 *   - ขั้นที่ผ่านแล้วกดย้อนดูแบบอ่านอย่างเดียวได้ · ขั้นที่ยังไม่ถึงกดไม่ได้ (locked) · ขั้นที่ทำอยู่แต่ไม่ได้เปิดดู = upcoming (ไม่ไฮไลต์)
 *   - ?step= เปิดขั้นที่ระบุ (ไม่เกินขั้นปัจจุบัน)
 *   - ย้อนกลับ/เปลี่ยนขั้นขณะฟอร์มนัดหมายมีการแก้ไข → "ยืนยันการออก"
 *   - เปลี่ยนสถานะสำเร็จ → เปิดขั้นของสถานะใหม่ + เลื่อนจอไปที่ stepper + Notification */
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmDialog, JobStatusBadge, KeyValueGrid, PageHeader, Stepper, useToast, type Crumb, type StepItem } from "@/components/ui";
import { OH2_STEPS, fmtNum, stepOf, useMockStore, type Job, type Plan, type Po, type Vehicle, type Vendor } from "@/lib/mock";
import { routes } from "@/lib/routes";
import { StepAppointment } from "./StepAppointment";
import { StepClose } from "./StepClose";
import { StepProgress } from "./StepProgress";
import { StepReceive, newCheckinDraft, type CheckinDraft } from "./StepReceive";
import { StepReturn } from "./StepReturn";
import { StepSafety } from "./StepSafety";
import { StepSection, type CommitOpts, type JobCtx } from "./shared";

export interface JobViewProps {
  plan: Plan;
  car: Vehicle;
  po: Po;
  vendor: Vendor;
  job: Job;
  /** ?step= (1–6) */
  initialStep?: number;
}

export function JobView({ plan, car, po, vendor, job, initialStep }: JobViewProps) {
  const store = useMockStore();
  const toast = useToast();
  const router = useRouter();
  const cur = stepOf(job.stage);
  const done = job.stage === "V11";
  const [view, setView] = useState(() => (initialStep && initialStep >= 1 && initialStep <= cur ? initialStep : cur));
  const [draft, setDraft] = useState<CheckinDraft>(newCheckinDraft);
  const [leaveTo, setLeaveTo] = useState<(() => void) | null>(null);
  const dirty = useRef<(() => boolean) | null>(null);
  const stepsRef = useRef<HTMLElement>(null);
  const backHref = routes.poView(plan.id, po.id);

  useEffect(() => {
    document.title = `หน้างาน ${car.plate} | Maintain-D (Mock)`;
  }, [car.plate]);

  const registerDirty = useCallback((fn: (() => boolean) | null) => {
    dirty.current = fn;
  }, []);

  /** ทำ go ทันที หรือถามก่อนถ้าฟอร์มมีการแก้ไข */
  const guard = useCallback((go: () => void) => {
    if (dirty.current?.()) setLeaveTo(() => go);
    else go();
  }, []);

  const goBack = useCallback(() => guard(() => router.push(backHref)), [guard, router, backHref]);

  const commit = (patch: Partial<Job>, opts: CommitOpts = {}) => {
    const r = store.updateJob(plan.id, car.id, patch);
    if (!r.ok) {
      toast.error(opts.fail ?? r.error);
      return false;
    }
    if (patch.stage) {
      dirty.current = null;
      setView(stepOf(patch.stage));
      const el = stepsRef.current;
      if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
    }
    if (opts.ok) toast.success(opts.ok, opts.okSub);
    return true;
  };

  const ctx: JobCtx = { planId: plan.id, carId: car.id, job, po, vendor, commit, goBack, registerDirty };

  /* สถานะต่อขั้น ตาม .wstep ของ HTML: ผ่านแล้ว = done · กำลังเปิดดู = current · ยังไม่ถึง = locked · อื่นๆ = upcoming */
  const steps: StepItem[] = OH2_STEPS.map((label, i) => {
    const n = i + 1;
    const passed = n < cur || done;
    return { label, state: passed ? "done" : n > cur ? "locked" : n === view ? "current" : "upcoming" };
  });

  const crumbs: Crumb[] = [
    { label: "จัดการงาน Overhaul", href: routes.plans() },
    { label: plan.name, href: routes.planView(plan.id) },
    { label: po.id, href: backHref },
    { label: car.plate },
  ];

  const panel = [
    null,
    <StepAppointment key="s1" ctx={ctx} />,
    <StepReceive key="s2" ctx={ctx} draft={draft} setDraft={setDraft} />,
    <StepProgress key="s3" ctx={ctx} />,
    <StepSafety key="s4" ctx={ctx} />,
    <StepReturn key="s5" ctx={ctx} />,
    <StepClose key="s6" ctx={ctx} />,
  ][view];

  return (
    <>
      <PageHeader title={car.plate} crumbs={crumbs} badge={<JobStatusBadge stage={job.stage} />} onBack={goBack} />
      <div className="flex flex-col gap-8">
        <section aria-label="ข้อมูลยานพาหนะ">
          <StepSection title="ข้อมูลยานพาหนะ" />
          <KeyValueGrid
            items={[
              { label: "ทะเบียน", value: car.plate },
              { label: "ยี่ห้อ/รุ่น", value: car.brand },
              { label: "ประเภท", value: car.type },
              { label: "อายุการใช้งาน", value: `${car.age} ปี` },
              { label: "เลขไมล์สะสม", value: `${fmtNum(car.mileage)} กม.` },
              { label: "ชั่วโมงสะสม", value: `${fmtNum(car.hours)} ชม.` },
              { label: "Purchase Order", value: `${po.id} · ${po.name}` },
              { label: "ศูนย์บริการ/อู่", value: vendor.name },
            ]}
          />
        </section>
        <section ref={stepsRef} aria-label="ขั้นตอนงาน Overhaul">
          <Stepper steps={steps} selected={view - 1} onStepClick={(i) => i + 1 !== view && guard(() => { dirty.current = null; setView(i + 1); })} />
        </section>
        <section aria-label={OH2_STEPS[view - 1]}>{panel}</section>
      </div>

      <ConfirmDialog
        open={!!leaveTo}
        onClose={() => setLeaveTo(null)}
        title="ยืนยันการออก"
        description="ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก"
        cancelLabel="ปิด"
        confirmLabel="ยืนยัน"
        onConfirm={() => {
          const go = leaveTo;
          setLeaveTo(null);
          dirty.current = null;
          go?.();
        }}
      />
    </>
  );
}
