"use client";

// ④ ดำเนินการ Overhaul
// โครงตามภาพระบบจริง flow/repair ขั้น "ดำเนินการซ่อม": "ผลการตรวจสอบอาการเพิ่มเติม" ไม่พบ/พบอาการเพิ่ม → "ซ่อมเสร็จสิ้น"
//   พบอาการเพิ่ม → ข้อมูลอาการที่พบ + ไม่เบิก/เบิกอะไหล่ → อะไหล่ที่ต้องใช้ (figma/ดำเนินการซ่อม - จัดที่สำนักงาน-พบอาการเพิ่ม-เบิกอะไหล่.svg)
// + ของ Overhaul (JO 7.4.2-02): รายการซ่อมบำรุงเครื่องมือกล · ผู้ดำเนินการ · วันเริ่ม-สิ้นสุด (ค่าแรงกรอกที่ขั้น ⑦)
//   รายการงานตั้งต้น = ข้อที่ "ต้องแก้ไข" จากขั้น ③
import { useCallback, useState } from "react";
import { fmtDate, type PlanVehicle, type Vehicle } from "@/lib/overhaul";
import { INSPECTOR, type WorkItem, type WorkStep } from "@/lib/overhaulExec";
import { SectionTitle, StepActions } from "./common";
import { PartsPicker } from "./PartsPicker";
import { PartsSummary, PartsSummaryModal } from "./PartsSummary";

const blank = (title = ""): WorkItem => ({ title, by: INSPECTOR, start: "", end: "", done: false });

function YesNo({ name, value, yes, no, locked, onChange }: { name: string; value?: boolean; yes: string; no: string; locked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="radcards md:max-w-[840px]" role="radiogroup">
      {[false, true].map((val) => (
        <label key={String(val)} className={`radcard${value === val ? " sel" : ""}${locked ? " is-readonly" : ""}`}>
          <input type="radio" name={name} checked={value === val} disabled={locked} onChange={() => onChange(val)} />
          <span className="rdot" />
          <span className="rc-tx">
            <b>{val ? yes : no}</b>
          </span>
        </label>
      ))}
    </div>
  );
}

export function StepWork({ v, pv, save }: { v: Vehicle; pv: PlanVehicle; save: (patch: Partial<PlanVehicle>, msg: string) => void }) {
  const saved = pv.work;
  const locked = !!saved?.confirmedAt;
  const seed = (): WorkStep => {
    const fixes = (pv.preAssessment?.items ?? []).filter((r) => r.status === "FIX");
    return {
      found: false, // ตั้งต้น "ไม่พบอาการเพิ่ม" ตามภาพระบบจริง
      foundNote: "",
      extraParts: [],
      items: fixes.length ? fixes.map((r) => blank(r.label + (r.note ? ` — ${r.note}` : ""))) : [blank()],
    };
  };
  const [draft, setDraft] = useState<WorkStep | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const closeSummary = useCallback(() => setSummaryOpen(false), []);
  const W = locked ? saved! : (draft ?? saved ?? seed());
  const edit = (patch: Partial<WorkStep>) => setDraft({ ...W, ...patch });
  const items = W.items;
  const setItems = (items: WorkItem[]) => edit({ items });
  const set = (i: number, patch: Partial<WorkItem>) => setItems(items.map((w, k) => (k === i ? { ...w, ...patch } : w)));
  const extra = W.found && W.needParts ? W.extraParts : [];

  const blockers = [
    W.found && !W.foundNote.trim() ? "ระบุอาการที่พบ" : "",
    W.found && W.needParts === undefined ? "เลือกว่าจะเบิกอะไหล่เพิ่มหรือไม่" : "",
    W.found && W.needParts && !W.extraParts.length ? "ยังไม่มีรายการอะไหล่ที่เบิกเพิ่ม" : "",
    W.found && W.needParts && W.extraParts.some((l) => l.wh === "buy" && (!l.name?.trim() || l.qty <= 0)) ? "ระบุชื่อและจำนวนอะไหล่ที่เพิ่มเอง" : "",
    items.length ? "" : "ยังไม่มีรายการงาน",
    items.some((w) => !w.title.trim() || !w.by.trim()) ? "กรอกชื่องานและผู้ดำเนินการให้ครบ" : "",
    items.some((w) => !w.start || !w.end) ? "ระบุวันเริ่ม-สิ้นสุดให้ครบ" : "",
    items.some((w) => w.start && w.end && w.end < w.start) ? "วันสิ้นสุดต้องไม่ก่อนวันเริ่ม" : "",
    items.some((w) => !w.done) ? `ยังไม่เสร็จ ${items.filter((w) => !w.done).length} งาน` : "",
  ].filter(Boolean);
  const finish = () => {
    const next = { ...W, extraParts: extra, confirmedAt: new Date().toISOString() };
    save({ work: next }, W.found ? `ดำเนินการ Overhaul เสร็จสิ้น — พบอาการเพิ่ม${extra.length ? ` · เบิกอะไหล่เพิ่ม ${extra.length} รายการ` : ""}` : "ดำเนินการ Overhaul เสร็จสิ้น");
    setDraft(null);
  };

  return (
    <>

      <SectionTitle>ผลการตรวจสอบอาการเพิ่มเติม</SectionTitle>
      <YesNo name="found" value={W.found} yes="พบอาการเพิ่ม" no="ไม่พบอาการเพิ่ม" locked={locked} onChange={(found) => edit({ found })} />

      {W.found && (
        <>
          <SectionTitle>ข้อมูลอาการที่พบ</SectionTitle>
          <div className="f">
            <label htmlFor="found-note">อาการที่พบ</label>
            {locked ? (
              <p>{W.foundNote}</p>
            ) : (
              <textarea id="found-note" rows={4} placeholder="ระบุอาการที่พบ" value={W.foundNote} onChange={(e) => edit({ foundNote: e.target.value })} />
            )}
          </div>
          <YesNo name="need-parts" value={W.needParts} yes="เบิกอะไหล่" no="ไม่เบิกอะไหล่" locked={locked} onChange={(needParts) => edit({ needParts })} />
          {W.needParts && (
            <>
              <SectionTitle>อะไหล่ที่ต้องใช้</SectionTitle>
              {locked ? <PartsSummary items={W.extraParts} /> : <PartsPicker v={v} items={W.extraParts} onChange={(extraParts) => edit({ extraParts })} />}
            </>
          )}
        </>
      )}

      <SectionTitle>รายการซ่อมบำรุงเครื่องมือกล</SectionTitle>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>รายการงาน</th>
              <th>ผู้ดำเนินการ</th>
              <th>วันที่เริ่ม</th>
              <th>วันที่สิ้นสุด</th>
              <th className="text-center!">เสร็จ</th>
              {!locked && <th className="w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((w, i) => (
              <tr key={i}>
                <td>
                  {locked ? (
                    w.title
                  ) : (
                    <input type="text" aria-label={`รายการงานที่ ${i + 1}`} placeholder="ระบุรายการงาน" value={w.title} onChange={(e) => set(i, { title: e.target.value })} />
                  )}
                </td>
                <td>
                  {locked ? (
                    w.by
                  ) : (
                    <input type="text" aria-label={`ผู้ดำเนินการงานที่ ${i + 1}`} value={w.by} onChange={(e) => set(i, { by: e.target.value })} />
                  )}
                </td>
                <td>
                  {locked ? (
                    fmtDate(w.start)
                  ) : (
                    <input type="date" aria-label={`วันที่เริ่มงานที่ ${i + 1}`} value={w.start} onChange={(e) => set(i, { start: e.target.value })} />
                  )}
                </td>
                <td>
                  {locked ? (
                    fmtDate(w.end)
                  ) : (
                    <input type="date" aria-label={`วันที่สิ้นสุดงานที่ ${i + 1}`} value={w.end} min={w.start || undefined} onChange={(e) => set(i, { end: e.target.value })} />
                  )}
                </td>
                <td className="text-center">
                  <input type="checkbox" aria-label={`งานที่ ${i + 1} เสร็จแล้ว`} checked={w.done} disabled={locked} onChange={(e) => set(i, { done: e.target.checked })} />
                </td>
                {!locked && (
                  <td>
                    <div className="dt-action">
                      <button className="btn" title="ลบงาน" aria-label={`ลบงานที่ ${i + 1}`} onClick={() => setItems(items.filter((_, k) => k !== i))}>
                        <span className="ms">delete</span>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!locked && (
        <div>
          <button className="btn btn-s" onClick={() => setItems([...items, blank()])}>
            <span className="ms">add</span> เพิ่มรายการงาน
          </button>
        </div>
      )}

      <StepActions
        locked={locked}
        blockers={blockers}
        confirmLabel="ดำเนินการเสร็จสิ้น"
        onDraft={() => {
          save({ work: W }, "บันทึกร่างการดำเนินการ Overhaul");
          setDraft(null);
        }}
        onConfirm={() => (extra.length ? setSummaryOpen(true) : finish())}
      />

      {summaryOpen && <PartsSummaryModal items={extra} onClose={closeSummary} onConfirm={finish} />}
    </>
  );
}
