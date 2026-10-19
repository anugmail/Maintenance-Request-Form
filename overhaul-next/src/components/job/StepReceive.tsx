"use client";
/* ขั้น 2 ตรวจรับรถ (S8 · V4) — รายการตรวจสอบก่อนซ่อม + ลงนามรับรถ 2 ฝ่าย (กบค. + หน่วยงานเจ้าของรถ)
 * Figma (Component) VMS Plus: `Section header` · `Table` ทั้งก้อน (Alternating fills · ช่อง Lead checkbox / Text / Text input) ·
 *   มือถือ `Mobile table` · `Checkbox` · `Text input` · `Input dropdown` + `Input label` (ผู้ลงนาม) · `Secondary button` (เซ็น) ·
 *   `Pill outline` Success (ตรวจแล้ว / ลงนามแล้ว) · `Content item row` + `_Content item base` (ลงนามแล้ว อ่านอย่างเดียว) ·
 *   `Secondary button` / `Primary button` Size=lg
 * UI Release#2: "5.6 Replacement Vehicle" `Modal / Receive Car` (รับรถ)
 * พฤติกรรมตาม HTML: ยืนยันรับรถได้เมื่อติ๊กครบทุกข้อ + ลงนามครบ 2 ฝ่าย (กดแล้วขึ้นข้อผิดพลาดตรงจุดที่ขาด) ·
 *   ร่างการตรวจ (ck) อยู่ในหน้า ยังไม่บันทึกจนกด "ยืนยันรับรถ" */
import { useState } from "react";
import { Badge, Button, Checkbox, DataTable, FieldShell, Icon, KeyValueGrid, SelectField, TextField } from "@/components/ui";
import { OH2_CHECKLIST, OH2_STAFF, fmtDate, findStaff, todayIso, type CheckItem } from "@/lib/mock";
import { ErrorText, StepActions, StepSection, UNIT_STAFF, stageNum, type JobCtx } from "./shared";

type Side = "kbk" | "unit";
export interface CheckinDraft {
  items: CheckItem[];
  sign: Record<Side, { name: string; at: string } | null>;
}
export const newCheckinDraft = (): CheckinDraft => ({
  items: OH2_CHECKLIST.map((label) => ({ label, ok: false, remark: "" })),
  sign: { kbk: null, unit: null },
});

export function StepReceive({ ctx, draft, setDraft }: { ctx: JobCtx; draft: CheckinDraft; setDraft: (d: CheckinDraft) => void }) {
  const { job } = ctx;

  /* ผ่านขั้นนี้แล้ว — อ่านอย่างเดียว */
  if (stageNum(job.stage) > 4 && job.checkin) {
    const c = job.checkin;
    return (
      <div>
        <StepSection title="รายการตรวจสอบก่อนซ่อม" />
        <DataTable
          caption="รายการตรวจสอบก่อนซ่อม"
          pagination={false}
          rows={c.items}
          rowKey={(r) => r.label}
          columns={[
            { key: "label", header: "รายการตรวจสอบ", cell: (r) => r.label },
            {
              key: "ok",
              header: "ผลตรวจ",
              cell: (r) =>
                r.ok ? (
                  <Badge tone="ok">
                    <Icon name="check" size={16} />
                    ตรวจแล้ว
                  </Badge>
                ) : (
                  "—"
                ),
            },
            { key: "remark", header: "หมายเหตุ", cell: (r) => r.remark || "—" },
          ]}
        />
        <StepSection title="ลงนามรับรถ" spaced />
        <KeyValueGrid
          columns={3}
          items={[
            { label: "กบค.", value: `${findStaff(c.sign.kbk.who)?.name ?? "—"} · ลงนาม ${fmtDate(c.sign.kbk.at)}` },
            { label: "หน่วยงานเจ้าของรถ", value: `${c.sign.unit.who} · ลงนาม ${fmtDate(c.sign.unit.at)}` },
          ]}
        />
      </div>
    );
  }

  return <ReceiveForm ctx={ctx} draft={draft} setDraft={setDraft} />;
}

function ReceiveForm({ ctx, draft, setDraft }: { ctx: JobCtx; draft: CheckinDraft; setDraft: (d: CheckinDraft) => void }) {
  const [pick, setPick] = useState<Record<Side, string>>({ kbk: "", unit: "" });
  const [err, setErr] = useState<{ items?: string; kbk?: string; unit?: string }>({});

  const setItem = (i: number, patch: Partial<CheckItem>) => setDraft({ ...draft, items: draft.items.map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  const sign = (side: Side) => {
    if (!pick[side]) return setErr((e) => ({ ...e, [side]: "กรุณาเลือกผู้ลงนาม" }));
    setErr((e) => ({ ...e, [side]: undefined }));
    setDraft({ ...draft, sign: { ...draft.sign, [side]: { name: pick[side], at: todayIso() } } });
  };

  const confirm = () => {
    const miss = draft.items.filter((i) => !i.ok).length;
    const e: typeof err = {};
    if (miss) e.items = `ยังตรวจไม่ครบ ${miss} รายการ`;
    if (!draft.sign.kbk) e.kbk = "กรุณาลงนาม";
    if (!draft.sign.unit) e.unit = "กรุณาลงนาม";
    setErr(e);
    if (Object.keys(e).length) return;
    const kb = OH2_STAFF.find((s) => s.name === draft.sign.kbk!.name);
    const today = todayIso();
    ctx.commit(
      {
        checkin: {
          items: draft.items,
          sign: { kbk: { who: kb?.id ?? "s1", at: draft.sign.kbk!.at }, unit: { who: draft.sign.unit!.name, at: draft.sign.unit!.at } },
          at: today,
        },
        stage: "V5",
      },
      { ok: "ยืนยันรับรถสำเร็จ" },
    );
  };

  const signBlock = (side: Side, label: string, opts: string[]) => {
    const s = draft.sign[side];
    return (
      <FieldShell label={label} error={err[side]}>
        {s ? (
          <div className="flex min-h-10 flex-wrap items-center gap-3">
            <span className="text-md font-medium text-gray-900">{s.name}</span>
            <Badge tone="ok">
              <Icon name="draw" size={16} />
              ลงนามแล้ว {fmtDate(s.at)}
            </Badge>
          </div>
        ) : (
          <div className="flex gap-3">
            <SelectField
              className="flex-1"
              aria-label={`ผู้ลงนาม ${label}`}
              placeholder="เลือกผู้ลงนาม"
              options={opts.map((o) => ({ value: o, label: o }))}
              value={pick[side]}
              onChange={(e) => {
                const v = e.target.value;
                setPick((p) => ({ ...p, [side]: v }));
              }}
            />
            <Button variant="secondary" iconLeft="draw" onClick={() => sign(side)}>
              เซ็น
            </Button>
          </div>
        )}
      </FieldShell>
    );
  };

  return (
    <div>
      <StepSection title="รายการตรวจสอบก่อนซ่อม" />
      <DataTable
        caption="รายการตรวจสอบก่อนซ่อม"
        pagination={false}
        rows={draft.items.map((it, i) => ({ ...it, i }))}
        rowKey={(r) => r.label}
        columns={[
          {
            key: "ok",
            header: <span className="sr-only">ตรวจแล้ว</span>,
            mobileLabel: "ตรวจแล้ว",
            width: "w-[56px]",
            cell: (r) => (
              <Checkbox
                checked={r.ok}
                aria-label={`ตรวจแล้ว ${r.label}`}
                onChange={(c) => {
                  setItem(r.i, { ok: c });
                  setErr((e) => ({ ...e, items: undefined }));
                }}
              />
            ),
          },
          { key: "label", header: "รายการตรวจสอบ", cell: (r) => r.label },
          {
            key: "remark",
            header: "หมายเหตุ",
            cell: (r) => (
              <TextField
                className="w-full"
                aria-label={`หมายเหตุ ${r.label}`}
                placeholder="หมายเหตุ (ถ้ามี)"
                value={r.remark}
                onChange={(e) => setItem(r.i, { remark: e.target.value })}
              />
            ),
          },
        ]}
      />
      <ErrorText className="mt-2">{err.items}</ErrorText>
      <StepSection title="ลงนามรับรถ" spaced />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {signBlock("kbk", "กบค.", OH2_STAFF.map((s) => s.name))}
        {signBlock("unit", "หน่วยงานเจ้าของรถ", UNIT_STAFF)}
      </div>
      <StepActions onBack={ctx.goBack}>
        <Button size="lg" onClick={confirm}>
          ยืนยันรับรถ
        </Button>
      </StepActions>
    </div>
  );
}
