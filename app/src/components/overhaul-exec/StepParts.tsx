"use client";

// ① เบิกอะไหล่ (JO 7.4.2-08 · 7.4.2-09) — ขั้นแรกแบบงานซ่อมระบบจริง (flow/repair: stepper เริ่มที่ "เบิกอะไหล่")
// ตั้งต้นรายการเบิก = อะไหล่ประจำรุ่นเครื่องมือกล (kitLines) — ไม่มีแถบคำอธิบาย (เจ้าของงานสั่งเอา help ที่ gen ออก 1 ต.ค. 2569) — เจ้าของงานแจ้ง 30 ก.ย. 2569 ว่ารู้อยู่แล้วว่ารุ่นนั้นใช้อะไหล่อะไร
// กด "ยืนยันเบิกอะไหล่" → modal สรุปรายการอะไหล่ (figma/สรุปรายการอะไหล่.svg) → "ยืนยัน" ค่อยบันทึก
import { useCallback, useState } from "react";
import type { PlanVehicle, Vehicle } from "@/lib/overhaul";
import { kitLines, type PartLine } from "@/lib/overhaulExec";
import { SectionTitle, StepActions } from "./common";
import { PartsPicker } from "./PartsPicker";
import { PartsSummary, PartsSummaryModal } from "./PartsSummary";

export function StepParts({ v, pv, save }: { v: Vehicle; pv: PlanVehicle; save: (patch: Partial<PlanVehicle>, msg: string) => void }) {
  const saved = pv.parts;
  const locked = !!saved?.confirmedAt;
  const [draft, setDraft] = useState<PartLine[] | null>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const closeSummary = useCallback(() => setSummaryOpen(false), []);
  const items = locked ? saved!.items : (draft ?? saved?.items ?? kitLines(v));
  const custom = items.filter((l) => l.wh === "buy");
  const blockers = [
    items.length ? "" : "ยังไม่มีรายการอะไหล่",
    custom.some((l) => !l.name?.trim()) ? "ระบุชื่ออะไหล่ที่เพิ่มเอง" : "",
    custom.some((l) => l.qty <= 0) ? "ระบุจำนวนอะไหล่ที่เพิ่มเอง" : "",
  ].filter(Boolean);

  return (
    <>
      {locked ? (
        <>
          <SectionTitle>สรุปรายการอะไหล่</SectionTitle>
          <PartsSummary items={items} />
        </>
      ) : (
        <PartsPicker v={v} items={items} onChange={setDraft} />
      )}

      <StepActions
        locked={locked}
        blockers={blockers}
        confirmLabel="ยืนยันเบิกอะไหล่"
        onDraft={() => {
          save({ parts: { items } }, "บันทึกร่างรายการเบิกอะไหล่");
          setDraft(null);
        }}
        onConfirm={() => setSummaryOpen(true)}
      />

      {summaryOpen && (
        <PartsSummaryModal
          items={items}
          onClose={closeSummary}
          onConfirm={() => {
            save({ parts: { items, confirmedAt: new Date().toISOString() } }, "ยืนยันเบิกอะไหล่");
            setDraft(null);
          }}
        />
      )}
    </>
  );
}
