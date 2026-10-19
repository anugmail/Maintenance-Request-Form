"use client";
/* ขั้น 3 ติดตามงานซ่อม (S9 เพิ่ม · S10 แก้ไข · S11 ลบความคืบหน้า · V5)
 * Figma (Component) VMS Plus: `Section header` + Actions (`Secondary button` sm "ความคืบหน้า") ·
 *   `Table` ทั้งก้อน (Alternating fills · ช่อง Text + Action icons = `Tertiary button` edit / `Tertiary danger button` delete) · มือถือ `Mobile table` ·
 *   `Empty state/Data empty` · `Modal` Type=Form (`Text input` วันที่/เวลา + `Text area`) — มือถือ `Bottom sheet` ·
 *   `Modal` Type=Destructive centered (ยืนยันลบ) · `Alert` Success · `Secondary button` / `Primary button` Size=lg
 * UI Release#2: "5.3" `Incident log` (ตารางบันทึกตามเวลา)
 * พฤติกรรมตาม HTML: ปุ่มลบมีเมื่อมีมากกว่า 1 รายการ · ยังไม่มีความคืบหน้า ปุ่ม "ซ่อมสำเร็จ" กดไม่ได้ · เรียงตามวันที่/เวลา */
import { useState } from "react";
import { Button, ConfirmDialog, DataTable, DateTimeField, EmptyState, Modal, TextArea } from "@/components/ui";
import { fmtDate, type ProgressLog } from "@/lib/mock";
import { JobAlert, StepActions, StepSection, stageNum, type JobCtx } from "./shared";

const fmtAt = (at: string) => `${fmtDate(at.slice(0, 10))} ${at.slice(11, 16)} น.`;
/** วันที่/เวลาปัจจุบันตามเวลาเครื่อง yyyy-mm-ddTHH:mm */
const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16);

export function StepProgress({ ctx }: { ctx: JobCtx }) {
  const { job } = ctx;
  const ro = stageNum(job.stage) > 5;
  const L = job.logs;
  const [edit, setEdit] = useState<{ i: number; at: string; note: string } | null>(null);
  const [err, setErr] = useState<{ at?: string; note?: string }>({});
  const [del, setDel] = useState(-1);

  const open = (i: number) => {
    const l = i >= 0 ? L[i] : { at: nowLocal(), note: "" };
    setErr({});
    setEdit({ i, at: l.at, note: l.note });
  };

  const save = () => {
    if (!edit) return;
    const e: typeof err = {};
    if (!edit.at) e.at = "กรุณาระบุวันที่/เวลา";
    if (!edit.note.trim()) e.note = "กรุณาระบุรายละเอียด";
    setErr(e);
    if (Object.keys(e).length) return;
    const l: ProgressLog = { at: edit.at, note: edit.note.trim() };
    const logs = edit.i >= 0 ? L.map((x, j) => (j === edit.i ? l : x)) : [...L, l];
    logs.sort((a, b) => a.at.localeCompare(b.at));
    if (ctx.commit({ logs }, { ok: edit.i >= 0 ? "แก้ไขความคืบหน้าสำเร็จ" : "เพิ่มความคืบหน้าสำเร็จ" })) setEdit(null);
  };

  const remove = () => {
    if (ctx.commit({ logs: L.filter((_, j) => j !== del) }, { ok: "ลบความคืบหน้าสำเร็จ" })) setDel(-1);
  };

  const rows = L.map((l, i) => ({ ...l, i }));

  return (
    <div>
      <StepSection
        title="รายละเอียดการติดตาม"
        right={
          !ro && (
            <Button variant="secondary" size="sm" iconLeft="add" onClick={() => open(-1)}>
              ความคืบหน้า
            </Button>
          )
        }
      />
      <DataTable
        caption="รายละเอียดการติดตาม"
        pagination={false}
        rows={rows}
        rowKey={(r) => r.at + "#" + r.i}
        empty={<EmptyState icon="build" title="ยังไม่มีความคืบหน้า" description={'เพิ่มความคืบหน้าอย่างน้อย 1 รายการก่อนกด "ซ่อมสำเร็จ"'} />}
        columns={[
          { key: "at", header: "วันที่/เวลา", width: "w-[200px]", cell: (r) => <span className="whitespace-nowrap">{fmtAt(r.at)}</span> },
          { key: "note", header: "รายละเอียด", cell: (r) => r.note },
          ...(ro
            ? []
            : [
                {
                  key: "act",
                  header: <span className="sr-only">จัดการ</span>,
                  mobileLabel: "จัดการ",
                  width: "w-[104px]",
                  cell: (r: (typeof rows)[number]) => (
                    <span className="flex justify-center gap-1">
                      <Button variant="tertiary" iconOnly="edit" aria-label="แก้ไข" onClick={() => open(r.i)} />
                      {L.length > 1 && <Button variant="tertiaryDanger" iconOnly="delete" aria-label="ลบ" onClick={() => setDel(r.i)} />}
                    </span>
                  ),
                },
              ]),
        ]}
      />
      {ro ? (
        <JobAlert tone="ok" icon="check_circle" className="mt-4">
          ซ่อมสำเร็จแล้ว
        </JobAlert>
      ) : (
        <StepActions onBack={ctx.goBack}>
          <Button
            size="lg"
            disabled={!L.length}
            title={L.length ? undefined : "ต้องมีความคืบหน้าอย่างน้อย 1 รายการ"}
            onClick={() => ctx.commit({ stage: "V6" }, { ok: "บันทึกซ่อมสำเร็จ" })}
          >
            ซ่อมสำเร็จ
          </Button>
        </StepActions>
      )}

      {/* S9 · S10 เพิ่ม/แก้ไขความคืบหน้า — Modal Type=Form (มือถือ Bottom sheet) */}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit && edit.i >= 0 ? "แก้ไขความคืบหน้า" : "เพิ่มความคืบหน้า"}
        confirmLabel="บันทึก"
        onConfirm={save}
      >
        {edit && (
          <>
            <DateTimeField
              label="วันที่/เวลา"
              value={edit.at}
              error={err.at}
              onChange={(at) => {
                setEdit({ ...edit, at });
                setErr((x) => ({ ...x, at: undefined }));
              }}
            />
            <TextArea
              label="รายละเอียด"
              rows={4}
              placeholder="ระบุความคืบหน้าของงานซ่อม"
              value={edit.note}
              error={err.note}
              onChange={(e) => {
                setEdit({ ...edit, note: e.target.value });
                setErr((x) => ({ ...x, note: undefined }));
              }}
            />
          </>
        )}
      </Modal>

      {/* S11 ยืนยันการลบความคืบหน้า */}
      <ConfirmDialog
        open={del >= 0}
        onClose={() => setDel(-1)}
        onConfirm={remove}
        danger
        title="ยืนยันการลบความคืบหน้า"
        description={del >= 0 && L[del] ? `ความคืบหน้า ${fmtAt(L[del].at)} จะถูกลบ` : undefined}
      />
    </div>
  );
}
