"use client";

// ③ ตรวจสภาพก่อน Overhaul (JO 7.4.2-01 · ภาพก่อน 7.4.2-05)
// โครงตามภาพระบบจริง flow/repair ขั้น "ตรวจสภาพก่อนซ่อม":
//   ข้อมูลยานพาหนะ → รายการเอกสารรับรถ 13 ข้อ (มี/ไม่มี/ชำรุด/ผิดรุ่น + หมายเหตุ) → ลงนามการรับมอบรถ
//   → รายละเอียดการตรวจสภาพก่อนซ่อม 24 ข้อ → "ยืนยันการตรวจสภาพ"
// + ของ Overhaul: ผลวิเคราะห์อาการ · ภาพก่อน
import { useState } from "react";
import type { PlanVehicle, Vehicle } from "@/lib/overhaul";
import { BATTERY_INDEX, INSPECTOR, freshPreAssessment, type PreAssessment, type ReceiptItem } from "@/lib/overhaulExec";
import { InspectTable, uncheckedCount } from "./InspectTable";
import { PhotoAttach, SectionTitle, SignBlock, StepActions, VehicleInfoBox } from "./common";

export function StepPre({ v, pv, save }: { v: Vehicle; pv: PlanVehicle; save: (patch: Partial<PlanVehicle>, msg: string) => void }) {
  const saved = pv.preAssessment;
  const locked = !!saved?.confirmedAt;
  const [draft, setDraft] = useState<PreAssessment | null>(null);
  const P = locked ? saved! : (draft ?? saved ?? freshPreAssessment());
  const edit = (patch: Partial<PreAssessment>) => setDraft({ ...P, ...patch });
  const setReceipt = (i: number, patch: Partial<ReceiptItem>) =>
    edit({ receipt: P.receipt.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const unchecked = uncheckedCount(P.items);
  const unanswered = P.receipt.filter((r) => r.has === undefined).length;
  const blockers = [
    unanswered ? `รายการเอกสารรับรถยังไม่ได้ระบุ ${unanswered} ข้อ` : "",
    unchecked ? `ยังไม่ได้ตรวจสภาพ ${unchecked} จาก ${P.items.length} รายการ` : "",
  ].filter(Boolean);

  return (
    <>

      <SectionTitle>ข้อมูลยานพาหนะ</SectionTitle>
      <VehicleInfoBox v={v} />

      <SectionTitle>รายการเอกสารรับรถ</SectionTitle>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>รายการ</th>
              <th className="text-center! w-20">มี</th>
              <th className="text-center! w-20">ไม่มี</th>
              <th className="text-center! w-20">ชำรุด</th>
              <th className="text-center! w-20">ผิดรุ่น</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {P.receipt.map((r, i) => (
              <tr key={r.label}>
                <td>
                  {i + 1}. {r.label}
                  {i === BATTERY_INDEX && (
                    <span className="inline-flex items-center gap-2 ml-2">
                      ยี่ห้อ
                      <input
                        type="text"
                        className="tbl-inline-md"
                        aria-label="ยี่ห้อแบตเตอรี่"
                        placeholder="ระบุยี่ห้อ"
                        value={r.brand ?? ""}
                        disabled={locked}
                        onChange={(e) => setReceipt(i, { brand: e.target.value })}
                      />
                      จำนวน
                      <input
                        type="text"
                        className="tbl-inline-sm"
                        aria-label="จำนวนแบตเตอรี่"
                        placeholder="0"
                        value={r.qty ?? ""}
                        disabled={locked}
                        onChange={(e) => setReceipt(i, { qty: e.target.value })}
                      />
                      ลูก
                    </span>
                  )}
                </td>
                {[true, false].map((val) => (
                  <td key={String(val)} className="text-center">
                    <input
                      type="radio"
                      name={`receipt-${i}`}
                      aria-label={`${r.label} — ${val ? "มี" : "ไม่มี"}`}
                      checked={r.has === val}
                      disabled={locked}
                      onChange={() => setReceipt(i, val ? { has: true } : { has: false, damaged: false, wrongModel: false })}
                    />
                  </td>
                ))}
                {(["damaged", "wrongModel"] as const).map((k) => (
                  <td key={k} className="text-center">
                    <input
                      type="checkbox"
                      aria-label={`${r.label} — ${k === "damaged" ? "ชำรุด" : "ผิดรุ่น"}`}
                      checked={r[k]}
                      disabled={locked || r.has !== true}
                      onChange={(e) => setReceipt(i, { [k]: e.target.checked })}
                    />
                  </td>
                ))}
                <td>
                  {locked ? (
                    r.note || <span className="cell-sub">—</span>
                  ) : (
                    <input
                      type="text"
                      placeholder="ระบุหมายเหตุ"
                      aria-label={`หมายเหตุ ${r.label}`}
                      value={r.note}
                      onChange={(e) => setReceipt(i, { note: e.target.value })}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>ลงนามการรับมอบรถ</SectionTitle>
      <SignBlock id="pre-sign" sign={P.sign} locked={locked} onChange={(sign) => edit({ sign })} />

      <SectionTitle>รายละเอียดการตรวจสภาพก่อน Overhaul</SectionTitle>
      <InspectTable name="pre" items={P.items} locked={locked} onChange={(items) => edit({ items })} />

      <SectionTitle>ผลวิเคราะห์อาการ</SectionTitle>
      <div className="f">
        <label htmlFor="pre-analysis">สรุปผลวิเคราะห์ / สิ่งที่ต้องดำเนินการ</label>
        {locked ? (
          <p>{P.analysis || <span className="cell-sub">—</span>}</p>
        ) : (
          <textarea
            id="pre-analysis"
            rows={4}
            placeholder="ระบุอาการที่พบ สาเหตุ และสิ่งที่ต้องดำเนินการ"
            value={P.analysis}
            onChange={(e) => edit({ analysis: e.target.value })}
          />
        )}
      </div>
      <PhotoAttach id="pre-photos" label="ภาพรถ/เครื่องมือกล ก่อน Overhaul" photos={P.photos ?? []} locked={locked} onChange={(photos) => edit({ photos })} />

      <StepActions
        locked={locked}
        blockers={blockers}
        confirmLabel="ยืนยันการตรวจสภาพ"
        onDraft={() => {
          save({ preAssessment: P }, "บันทึกร่างการตรวจสภาพก่อน Overhaul");
          setDraft(null);
        }}
        onConfirm={() => {
          save({ preAssessment: { ...P, confirmedAt: new Date().toISOString(), confirmedBy: INSPECTOR } }, "ยืนยันการตรวจสภาพก่อน Overhaul");
          setDraft(null);
        }}
      />
    </>
  );
}
