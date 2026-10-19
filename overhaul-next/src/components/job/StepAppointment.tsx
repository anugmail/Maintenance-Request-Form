"use client";
/* ขั้น 1 นัดเอารถเข้าอู่ (S7 · V1–V3) และขั้น 5 นัดรับรถ (S13 · V7–V9) — ret = นัดรับรถ
 * 🔴 กติกา R16/R17 (figma-export/component-rules.md §4.1 · เจ้าของงานสั่ง 19 ต.ค. 2569): ใช้แบบนัดหมายของงานซ่อม
 *   = `RepairAppointmentStep` (ไฟล์ Maintain-D หน้า Design) RepairMethod=false (ไม่มี section รูปแบบการซ่อม)
 *   - Type=In State=Default/Filled/Error: `Section header` "รายละเอียดการนัดหมาย" · แถวเดียว 3 ช่อง = ช่วงวัน (ช่องเดียว) ·
 *     `Input dropdown` Leading icon=search + `Dropdown list` (ผู้ประสานงาน — เลือกแล้วแสดงตำแหน่งใต้ชื่อ) · `Text input` State=Readonly (เบอร์ เติมให้) ·
 *     `Text area` Readonly เต็มแถว (ศูนย์บริการ/อู่ จาก PO) · ไม่มีช่องหมายเหตุ · ปุ่มท้าย `Secondary button` "ย้อนกลับ" + `Primary button` "ส่งนัดหมาย" Size=lg
 *   - Type=Wating: `Empty state` "รอตอบกลับจากหน่วยงาน" + `Secondary button` "แก้ไขนัดหมาย" · ไม่มีแถวปุ่มท้าย
 *   - Type=In State=ReturnReason: `Section header` "ผลตอบกลับ" + `Content item row` (เหตุผลการปฏิเสธ) + ฟอร์มนัดใหม่
 *   - ผ่านแล้ว: `Content item row` + `_Content item base` (สรุปนัดหมาย) + `Alert` Success
 *   มือถือ: component ไม่มี variant มือถือ ⇒ ช่องเรียงลง
 * พฤติกรรมตาม HTML (design-mock/overhaul-v2-06-job.html): เลือกวันก่อนวันนี้ไม่ได้ · แก้ไขนัดได้จนกว่าหน่วยงานตอบ ·
 *   กล่อง "เฉพาะต้นแบบ" จำลองหน่วยงานตอบรับ/ปฏิเสธ · Notification "การสร้าง นัดหมาย สำเร็จ" / "ไม่สามารถสร้าง นัดหมาย" */
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Combobox, EmptyState, KeyValueGrid, TextArea, TextField } from "@/components/ui";
import { OH2_STAFF, fmtDate, findStaff, todayIso, type Appointment, type Vendor } from "@/lib/mock";
import { DateRangeInput } from "./DateRangeInput";
import { JobAlert, StepActions, StepSection, stageNum, type JobCtx } from "./shared";

const STAGES = { appt: ["V1", "V2", "V3"], ret: ["V7", "V8", "V9"] } as const;
const SECT = "รายละเอียดการนัดหมาย";
const rangeLabel = (ret: boolean) => (ret ? "ช่วงวันนัดรับรถ" : "ช่วงวันนำรถเข้า");
const vendorText = (v: Vendor) => `${v.name} · ${v.tel} · ${v.addr}`;

export function StepAppointment({ ctx, ret = false }: { ctx: JobCtx; ret?: boolean }) {
  const { job } = ctx;
  const field = ret ? "ret" : "appt";
  const [F, W, R] = STAGES[field];
  const a = job[field];
  const n = stageNum(job.stage);
  const mine = (STAGES[field] as readonly string[]).includes(job.stage);
  const [editing, setEditing] = useState(false);
  const [rejRemark, setRejRemark] = useState("");

  /* ผ่านขั้นนี้แล้ว — อ่านอย่างเดียว */
  if (!mine || (n > stageNum(W) && job.stage !== R)) {
    const st = findStaff(a?.coord);
    return (
      <div>
        <StepSection title={SECT} />
        {a && (
          <KeyValueGrid
            columns={3}
            items={[
              { label: rangeLabel(ret), value: `${fmtDate(a.from)} - ${fmtDate(a.to)}` },
              { label: "ผู้ประสานงาน (กบค.)", value: st ? `${st.name} (${st.pos})` : "—" },
              { label: "เบอร์โทรผู้ประสานงาน (กบค.)", value: st?.tel ?? "—" },
              { label: "ศูนย์บริการ/อู่", value: vendorText(ctx.vendor), wide: true },
            ]}
          />
        )}
        <JobAlert tone="ok" icon="check_circle" className="mt-4">
          หน่วยงานเจ้าของรถยืนยันนัดแล้ว {a?.reply ? fmtDate(a.reply.at) : ""}
        </JobAlert>
      </div>
    );
  }

  /* V1/V7 นัดครั้งแรก · กำลังแก้ไขนัดที่รอตอบ */
  if (job.stage === F || editing || !a) {
    return <ApptForm ctx={ctx} ret={ret} onDone={() => setEditing(false)} />;
  }

  /* V3/V9 ปฏิเสธ — ผลตอบกลับ + ฟอร์มนัดใหม่ (ค่าเดิม) */
  if (job.stage === R) {
    return (
      <div>
        <StepSection title="ผลตอบกลับ" />
        <KeyValueGrid columns={3} items={[{ label: "เหตุผลการปฏิเสธ", value: a.reply?.remark || "—", wide: true }]} />
        <ApptForm ctx={ctx} ret={ret} spaced onDone={() => setEditing(false)} />
      </div>
    );
  }

  /* V2/V8 รอตอบกลับ */
  const reply = (ok: boolean) => {
    ctx.commit(
      {
        [field]: { ...a, reply: { ok, remark: ok ? "" : rejRemark.trim() || "วันดังกล่าวไม่สะดวก ขอเลื่อนนัด", at: todayIso() } },
        stage: ok ? (ret ? "V10" : "V4") : ret ? "V9" : "V3",
      },
      { ok: ok ? "หน่วยงานยืนยันนัดหมายแล้ว" : "หน่วยงานปฏิเสธนัดหมาย" },
    );
  };
  return (
    <div>
      <StepSection title={SECT} />
      <EmptyState
        icon="folder_open"
        title="รอตอบกลับจากหน่วยงาน"
        action={
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            แก้ไขนัดหมาย
          </Button>
        }
      />
      {/* เฉพาะต้นแบบ — หน่วยงานเจ้าของรถตอบนัดจากหน้าของหน่วยงาน (ยังไม่มีใน userflow) */}
      <JobAlert tone="warn" className="mt-8">
        <div className="flex flex-col items-start gap-3">
          <b className="font-semibold">เฉพาะต้นแบบ — จำลองคำตอบจากหน่วยงานเจ้าของรถ</b>
          <TextField
            className="w-full"
            aria-label="หมายเหตุที่ปฏิเสธ"
            placeholder="หมายเหตุที่ปฏิเสธ (ถ้าปฏิเสธ)"
            value={rejRemark}
            onChange={(e) => setRejRemark(e.target.value)}
          />
          <span className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => reply(true)}>
              หน่วยงานยืนยันนัด
            </Button>
            <Button variant="secondaryDanger" size="sm" onClick={() => reply(false)}>
              หน่วยงานปฏิเสธนัด
            </Button>
          </span>
        </div>
      </JobAlert>
    </div>
  );
}

/* ---------- ฟอร์มนัดหมาย (RepairAppointmentStep Type=In) — สร้าง / แก้ไข / นัดใหม่หลังถูกปฏิเสธ ---------- */
function ApptForm({ ctx, ret, onDone, spaced }: { ctx: JobCtx; ret: boolean; onDone: () => void; spaced?: boolean }) {
  const field = ret ? "ret" : "appt";
  const a = ctx.job[field];
  const today = todayIso();
  const [range, setRange] = useState({ from: a?.from && a.from >= today ? a.from : "", to: a?.to && a.to >= today ? a.to : "" });
  const [coord, setCoord] = useState(a?.coord ?? "");
  const [err, setErr] = useState<{ range?: string; coord?: string }>({});
  const staff = findStaff(coord);
  const options = useMemo(() => OH2_STAFF.map((s) => ({ value: s.id, label: s.name, sub: s.pos })), []);

  /* ตัวตรวจ "มีการแก้ไข" — เทียบกับค่าตอนเปิดฟอร์ม */
  const snap = JSON.stringify([range.from, range.to, coord]);
  const first = useRef(snap);
  const cur = useRef(snap);
  cur.current = snap;
  const { registerDirty } = ctx;
  useEffect(() => {
    registerDirty(() => cur.current !== first.current);
    return () => registerDirty(null);
  }, [registerDirty]);

  const send = () => {
    const { from, to } = range;
    const e: typeof err = {};
    if (!from || !to || from < today || to < from) e.range = ret ? "กรุณาเลือกช่วงวันนัดรับรถ" : "กรุณาเลือกช่วงวันนำรถเข้า";
    if (!coord) e.coord = "กรุณาเลือกผู้ประสานงาน";
    setErr(e);
    if (Object.keys(e).length) return;
    const appt: Appointment = { from, to, coord, remark: "", sentAt: today, reply: null };
    const ok = ctx.commit({ [field]: appt, stage: ret ? "V8" : "V2" }, { ok: "การสร้าง นัดหมาย สำเร็จ", fail: "ไม่สามารถสร้าง นัดหมาย" });
    if (ok) onDone();
  };

  return (
    <div>
      <StepSection title={SECT} spaced={spaced} />
      {/* แถวเดียว 3 ช่อง (มือถือเรียงลง) + ศูนย์บริการ/อู่ เต็มแถว */}
      <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
        <DateRangeInput
          label={rangeLabel(ret)}
          minToday
          value={range}
          error={err.range}
          onChange={(r) => {
            setRange(r);
            setErr((x) => ({ ...x, range: undefined }));
          }}
        />
        <Combobox
          label="ผู้ประสานงาน (กบค.)"
          placeholder="ค้นหาชื่อ-นามสกุล, รหัสพนักงาน"
          options={options}
          value={coord}
          error={err.coord}
          helper={staff?.pos}
          onChange={(val) => {
            setCoord(val);
            setErr((x) => ({ ...x, coord: undefined }));
          }}
        />
        <TextField label="เบอร์โทรผู้ประสานงาน (กบค.)" autoFilled value={staff?.tel ?? ""} placeholder="แสดงเมื่อเลือกผู้ประสานงาน" />
        <TextArea
          className="md:col-span-3"
          label={ret ? "ศูนย์บริการ/อู่ (ค่าตั้งต้นจาก PO)" : "ศูนย์บริการ/อู่"}
          readOnly
          rows={2}
          value={vendorText(ctx.vendor)}
        />
      </div>
      <StepActions onBack={ctx.goBack}>
        <Button size="lg" onClick={send}>
          ส่งนัดหมาย
        </Button>
      </StepActions>
    </div>
  );
}
