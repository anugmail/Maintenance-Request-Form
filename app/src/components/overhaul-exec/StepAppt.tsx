"use client";

// ② นัดหมายวันซ่อม · ⑤ นัดหมายวันคืนรถ — ใช้ร่วมกัน (field = "appt" | "ret")
// ฟอร์มยกจาก figma/นัดหมายเข้าซ่อมสำนักงาน-filled.png: รูปแบบการซ่อม (radio card) → รายละเอียดการนัดหมาย
//   (ช่วงเวลาที่รับมอบรถ · ช่างซ่อม · เบอร์โทรศัพท์ผู้รับมอบรถ (อ่านอย่างเดียว เติมจากช่าง) · สถานที่รับรถ) → "ส่งนัดหมาย"
// ส่งแล้ว → "รอตอบกลับจากหน่วยงาน" + แก้ไขนัดหมาย / ต้นทางยืนยัน (ภาพระบบจริง flow/repair ขั้นนัดหมายวันคืนรถ)
// ⚠️ "ต้นทางยืนยัน" กดแทนหน่วยงานเจ้าของรถ (จำลอง) — ของจริงหน่วยงานยืนยันจากฝั่งตัวเอง
import { useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { fmtDate, type PlanVehicle } from "@/lib/overhaul";
import { APPT_MODES, DEFAULT_PLACE, TECHS, techById, type ApptStep } from "@/lib/overhaulExec";
import { SectionTitle, StepActions } from "./common";

export function StepAppt({
  field,
  pv,
  save,
}: {
  field: "appt" | "ret";
  pv: PlanVehicle;
  save: (patch: Partial<PlanVehicle>, msg: string) => void;
}) {
  const isRet = field === "ret";
  const saved = pv[field];
  const confirmed = !!saved?.confirmedAt;
  const [editing, setEditing] = useState(false);
  const fresh = (): ApptStep => ({
    mode: pv.appt?.mode ?? "IN",
    from: "",
    to: "",
    techId: pv.appt?.techId ?? TECHS[0].id,
    place: pv.appt?.place ?? DEFAULT_PLACE,
  });
  const [draft, setDraft] = useState<ApptStep | null>(null);
  const A = draft ?? saved ?? fresh();
  const edit = (patch: Partial<ApptStep>) => setDraft({ ...A, ...patch });
  const tech = techById(A.techId);
  const waiting = !!saved?.sentAt && !confirmed && !editing;
  const locked = confirmed;
  const what = isRet ? "วันคืนรถ" : "วันซ่อม";

  const blockers = [
    !A.from || !A.to ? "ระบุช่วงเวลาที่รับมอบรถ" : "",
    A.from && A.to && A.to < A.from ? "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม" : "",
    !A.place.trim() ? `ระบุสถานที่${isRet ? "คืนรถ" : "รับรถ"}` : "",
  ].filter(Boolean);

  if (waiting)
    return (
      <>
        <EmptyState title="รอตอบกลับจากหน่วยงาน">
          <button className="btn btn-s" onClick={() => setEditing(true)}>
            แก้ไขนัดหมาย
          </button>
          <button
            className="btn btn-p"
            onClick={() => save({ [field]: { ...saved!, confirmedAt: new Date().toISOString() } }, `ต้นทางยืนยันนัดหมาย${what}`)}
          >
            ต้นทางยืนยัน
          </button>
        </EmptyState>
      </>
    );

  return (
    <>

      <SectionTitle>รูปแบบการซ่อม</SectionTitle>
      <div className="radcards md:max-w-[760px]" role="radiogroup" aria-label="รูปแบบการซ่อม">
        {APPT_MODES.map((m) => (
          <label key={m.key} className={`radcard${A.mode === m.key ? " sel" : ""}${locked ? " is-readonly" : ""}`}>
            <input type="radio" name={`${field}-mode`} checked={A.mode === m.key} disabled={locked} onChange={() => edit({ mode: m.key })} />
            <span className="rdot" />
            <span className="rc-tx">
              <b>{m.label}</b>
              <small>{m.desc}</small>
            </span>
          </label>
        ))}
      </div>

      <SectionTitle>รายละเอียดการนัดหมาย</SectionTitle>
      <div className="fgrid cols-3 m-0!">
        <div className="f">
          <label htmlFor={`${field}-from`}>ช่วงเวลาที่{isRet ? "ส่งคืนรถ" : "รับมอบรถ"}</label>
          <div className="flex items-center gap-2">
            <input id={`${field}-from`} type="date" value={A.from} disabled={locked} onChange={(e) => edit({ from: e.target.value })} />
            <span>–</span>
            <input
              aria-label="วันสิ้นสุด"
              type="date"
              value={A.to}
              min={A.from || undefined}
              disabled={locked}
              onChange={(e) => edit({ to: e.target.value })}
            />
          </div>
        </div>
        <div className="f">
          <label htmlFor={`${field}-tech`}>ช่างซ่อม</label>
          <select id={`${field}-tech`} value={A.techId} disabled={locked} onChange={(e) => edit({ techId: e.target.value })}>
            {TECHS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} · {t.posi} {t.dept}
              </option>
            ))}
          </select>
        </div>
        <div className="f ro dash">
          <label htmlFor={`${field}-tel`}>เบอร์โทรศัพท์ผู้{isRet ? "ส่งคืน" : "รับมอบ"}รถ</label>
          <div className="in">
            <input id={`${field}-tel`} type="text" value={tech?.tel ?? ""} readOnly />
          </div>
        </div>
        <div className="f sp4">
          <label htmlFor={`${field}-place`}>สถานที่{isRet ? "คืนรถ" : "รับรถ"}</label>
          <textarea id={`${field}-place`} rows={3} value={A.place} disabled={locked} onChange={(e) => edit({ place: e.target.value })} />
        </div>
      </div>

      <StepActions
        locked={locked}
        blockers={blockers}
        confirmLabel="ส่งนัดหมาย"
        onConfirm={() => {
          save({ [field]: { ...A, sentAt: new Date().toISOString() } }, `ส่งนัดหมาย${what} ${fmtDate(A.from)} – ${fmtDate(A.to)}`);
          setDraft(null);
          setEditing(false);
        }}
      />
    </>
  );
}
