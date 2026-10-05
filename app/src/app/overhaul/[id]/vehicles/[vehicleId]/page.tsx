"use client";

// ดำเนินการ Overhaul รายคัน (JO 7.4.2) — โครงเดียวกับหน้างานซ่อมระบบจริง (flow/repair/*.png · เจ้าของงานสั่ง 1 ต.ค. 2569)
//   หัวหน้า: ชื่องาน + ป้ายสถานะตามขั้น · แท็บ กระบวนการ Overhaul · ข้อมูล Overhaul · ประวัติการซ่อม · ประวัติการดำเนินการ
//   stepper 7 ขั้น: ขั้นที่ผ่านแล้วกดย้อนดูได้ (อ่านอย่างเดียว) · ขั้นปัจจุบันแก้ไขได้ · ขั้นถัดไปล็อก
// เนื้อหาแต่ละขั้นอยู่ที่ components/overhaul-exec/Step*.tsx · โมเดลข้อมูลที่ lib/overhaulExec.ts
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { usePlans } from "@/lib/store";
import { EmptyState } from "@/components/EmptyState";
import { RepairHistoryTable } from "@/components/RepairHistoryTable";
import { RoField } from "@/components/RoField";
import { useToast } from "@/components/Shell";
import { CRITERIA, fmtBaht, isApprovedPlan, fmtDate, fmtTime, vehicleById, type PlanVehicle } from "@/lib/overhaul";
import { EXEC_STAGE_BADGE, EXEC_STAGE_LABEL, STEPS, currentStep, execStage, historyOf } from "@/lib/overhaulExec";
import { SectionTitle, VehicleInfoBox } from "@/components/overhaul-exec/common";
import { StepParts } from "@/components/overhaul-exec/StepParts";
import { StepAppt } from "@/components/overhaul-exec/StepAppt";
import { StepPre } from "@/components/overhaul-exec/StepPre";
import { StepWork } from "@/components/overhaul-exec/StepWork";
import { StepPost } from "@/components/overhaul-exec/StepPost";
import { StepClose } from "@/components/overhaul-exec/StepClose";

const TABS = ["กระบวนการ Overhaul", "ข้อมูล Overhaul", "ประวัติการซ่อม", "ประวัติการดำเนินการ"];

export default function OverhaulVehicleExecPage() {
  const { id, vehicleId } = useParams<{ id: string; vehicleId: string }>();
  const { ready, get, update } = usePlans();
  const toast = useToast();
  const plan = get(id);
  const pv = plan?.vehicles.find((x) => x.vehicleId === vehicleId);
  const v = vehicleById(vehicleId);
  const [tab, setTab] = useState(0);
  // ขั้นที่กำลังดู — null = ตามขั้นปัจจุบันของงาน
  const [view, setView] = useState<number | null>(null);

  if (!ready) return null;
  if (!plan || !pv || !v)
    return (
      <EmptyState title="ไม่พบรถคันนี้ในแผน" desc="รถอาจถูกนำออกจากแผน หรือลิงก์ไม่ถูกต้อง">
        <Link className="btn btn-g" href="/overhaul-jobs">
          <span className="ms">arrow_back</span> กลับ
        </Link>
      </EmptyState>
    );
  if (!isApprovedPlan(plan))
    return (
      <EmptyState title="ยังดำเนินการ Overhaul ไม่ได้" desc="ต้องเป็นแผนที่อนุมัติแล้วเท่านั้น">
        <Link className="btn btn-g" href={`/overhaul/${plan.id}`}>
          <span className="ms">arrow_back</span> กลับหน้าแผน
        </Link>
      </EmptyState>
    );

  const cur = currentStep(pv); // 0–6 · 7 = ปิดงานแล้ว
  const shown = Math.min(view ?? cur, STEPS.length - 1);
  const stage = execStage(pv);
  const history = historyOf(v.plate);
  // บันทึกงานรายคัน — ไม่ขยับ updatedAt ของแผน (touch=false) · ทุกครั้งที่บันทึกลง "ประวัติการดำเนินการ"
  const save = (patch: Partial<PlanVehicle>, msg: string) => {
    const log = [...(pv.log ?? []), { t: new Date().toISOString(), label: msg }];
    update(plan.id, { vehicles: plan.vehicles.map((x) => (x.vehicleId === vehicleId ? { ...x, ...patch, log } : x)) }, false);
    setView(null);
    toast(msg);
  };
  const props = { plan, v, pv, save };

  return (
    <>
      <div className="crumbs mb-6">
        <span className="ms">home</span>
        <span className="sep" aria-hidden="true" />
        <Link href="/overhaul-jobs">จัดการงาน Overhaul</Link>
        <span className="sep" aria-hidden="true" />
        <span className="cur">
          {plan.planNo} · {v.plate}
        </span>
      </div>
      <div className="page-title-row">
        <Link className="page-back" aria-label="กลับจัดการงาน Overhaul" href="/overhaul-jobs">
          <span className="ms">arrow_back</span>
        </Link>
        <h1 className="page-title">Overhaul {v.plate}</h1>
        <span className={`badge ${EXEC_STAGE_BADGE[stage]}`}>{EXEC_STAGE_LABEL[stage]}</span>
      </div>

      {/* จอแคบ: แถบแท็บเลื่อนแนวนอนในตัว (แบบ figma/สรุปรายการอะไหล่-mobile.svg ที่แท็บสุดท้ายล้นขอบ) ไม่ดันทั้งหน้า */}
      <div className="tabs overflow-x-auto whitespace-nowrap" role="tablist" aria-label="งาน Overhaul">
        {TABS.map((t, i) => (
          <button key={t} type="button" role="tab" aria-selected={tab === i} className={`tab-btn${tab === i ? " on" : ""}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 && (
        <>
          <div className="wsteps mt-6 mb-8" role="tablist" aria-label="ขั้นตอนดำเนินการ Overhaul">
            {STEPS.map((s, i) => {
              const reachable = i <= cur;
              return (
                <div
                  key={s}
                  role="tab"
                  aria-selected={i === shown}
                  aria-disabled={!reachable}
                  tabIndex={reachable ? 0 : -1}
                  className={`wstep${i === shown ? " active" : i < cur ? " passed" : ""}${reachable ? "" : " locked"}`}
                  title={reachable ? s : "ทำขั้นก่อนหน้าให้เสร็จก่อน"}
                  onClick={() => reachable && setView(i)}
                  onKeyDown={(e) => {
                    if (reachable && (e.key === "Enter" || e.key === " ")) {
                      e.preventDefault();
                      setView(i);
                    }
                  }}
                >
                  <span className="num">{i < cur && i !== shown ? <span className="ms">check</span> : i + 1}</span>
                  <span className="lbl">{s}</span>
                </div>
              );
            })}
          </div>
          {/* key = ขั้น — สลับขั้นแล้ว state ร่างของขั้นเดิมไม่ค้าง */}
          {/* ระยะตามภาพระบบจริง flow/repair (วัดพิกเซล): หัวข้อ↔เนื้อหา และเนื้อหา↔หัวข้อถัดไป 24 เท่ากันหมด
              ⇒ gap 24 (.stack.loose = 20) + ตัด margin-top ในตัวของ .tblwrap (12) / .radcards (10) ที่ทำให้ห่างเกิน */}
          <div className="stack gap-6! [&>.tblwrap]:mt-0! [&>.radcards]:mt-0!" key={shown}>
            {shown === 0 && <StepParts {...props} />}
            {shown === 1 && <StepAppt field="appt" {...props} />}
            {shown === 2 && <StepPre {...props} />}
            {shown === 3 && <StepWork {...props} />}
            {shown === 4 && <StepAppt field="ret" {...props} />}
            {shown === 5 && <StepPost {...props} />}
            {shown === 6 && <StepClose {...props} />}
          </div>
        </>
      )}

      {tab === 1 && (
        <div className="stack gap-6! mt-6 [&>.tblwrap]:mt-0!" role="tabpanel">
          <SectionTitle>ข้อมูลแผน Overhaul</SectionTitle>
          <div className="fgrid m-0!">
            <RoField label="เลขที่แผน" icon="tag" value={plan.planNo} />
            <RoField label="ชื่อแผนงาน" icon="description" value={plan.name} span="sp2" />
            <RoField label="ปีแผนงาน" icon="calendar_month" value={String(plan.year)} />
            <RoField label="มูลค่าที่ได้มาของรถ" icon="account_balance" value={`${fmtBaht(v.acquisitionValue)} บาท`} />
          </div>
          <div className="f">
            <label>เกณฑ์คัดเลือก</label>
            <div className="chips">
              {CRITERIA.filter((c) => pv.criteria.includes(c.key)).map((c) => (
                <span key={c.key} className="chip cursor-default!">
                  {c.label}
                </span>
              ))}
            </div>
          </div>
          <SectionTitle>ข้อมูลยานพาหนะ</SectionTitle>
          <VehicleInfoBox v={v} />
        </div>
      )}

      {tab === 2 && (
        <div className="stack gap-6! mt-6 [&>.tblwrap]:mt-0!" role="tabpanel">
          <SectionTitle>ประวัติการซ่อมย้อนหลัง — {v.plate}</SectionTitle>
          <RepairHistoryTable rows={history} />
        </div>
      )}

      {tab === 3 && (
        <div className="stack gap-6! mt-6 [&>.tblwrap]:mt-0!" role="tabpanel">
          <SectionTitle>ประวัติการดำเนินการ</SectionTitle>
          {pv.log?.length ? (
            <ul className="tl">
              {pv.log.map((h, i) => (
                <li key={i} className={i === pv.log!.length - 1 ? "on" : ""}>
                  {h.label}
                  <div className="cell-sub">
                    {fmtDate(h.t)} {fmtTime(h.t)}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="ยังไม่มีประวัติการดำเนินการ" />
          )}
        </div>
      )}
    </>
  );
}
