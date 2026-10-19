"use client";
/* ขั้น 6 ปิดงาน (S14 · V10–V11) — ระบุอะไหล่ที่ใช้ (เพิ่มทีละรายการ / นำเข้าไฟล์) แล้วปิดงาน
 * Figma (Component) VMS Plus: `Section header` + Actions (`Secondary button` sm "นำเข้าไฟล์") · `Text input` (ชื่ออะไหล่ · จำนวน) ·
 *   `Input dropdown` (หน่วย) · `Secondary button` (เพิ่ม) · `Table` ทั้งก้อน (Text / ตัวเลข / Action icons `Tertiary danger button`) ·
 *   มือถือ `Mobile table` · `Empty state/Data empty` · `Alert` Success · `Secondary button` / `Primary button` Size=lg
 * พฤติกรรมตาม HTML: ต้องมีอะไหล่อย่างน้อย 1 รายการจึงปิดงานได้ (ทางแยก "ระบุอะไหล่ที่ใช้ ?") · นำเข้าไฟล์ (ต้นแบบ) เติมรายการตัวอย่าง 3 รายการ ·
 *   ปิดงานแล้ว (V11) อ่านอย่างเดียว */
import { useRef, useState } from "react";
import { Button, DataTable, EmptyState, FieldShell, SelectField, TextField, useToast } from "@/components/ui";
import { fmtDate, fmtNum, todayIso, type PartUsed } from "@/lib/mock";
import { ErrorText, JobAlert, StepActions, StepSection, type JobCtx } from "./shared";

const UNITS = ["ชิ้น", "ชุด", "ลิตร", "เส้น"];
/** รายการตัวอย่างที่ "นำเข้าไฟล์" เติมให้ (ต้นแบบ — ยังไม่อ่านไฟล์จริง) */
const SAMPLE: PartUsed[] = [
  { name: "กรองน้ำมันเครื่อง", qty: 2, unit: "ชิ้น" },
  { name: "น้ำมันเครื่อง 15W-40", qty: 18, unit: "ลิตร" },
  { name: "สายพานไทม์มิ่ง", qty: 1, unit: "เส้น" },
];

export function StepClose({ ctx }: { ctx: JobCtx }) {
  const { job } = ctx;
  const toast = useToast();
  const ro = job.stage === "V11";
  const P = job.parts;
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [unit, setUnit] = useState(UNITS[0]);
  const [err, setErr] = useState<{ name?: string; qty?: string; parts?: string }>({});

  const add = () => {
    const n = name.trim();
    const q = Number(qty);
    if (!n) return setErr({ name: "กรุณาระบุชื่ออะไหล่" });
    if (!(q > 0)) return setErr({ qty: "จำนวนต้องมากกว่า 0" });
    if (ctx.commit({ parts: [...P, { name: n, qty: q, unit }] })) {
      setErr({});
      setName("");
      setQty("1");
      setUnit(UNITS[0]);
    }
  };

  const importFile = (f: File | undefined) => {
    if (!f) return;
    if (ctx.commit({ parts: [...P, ...SAMPLE] })) {
      setErr({});
      toast.success("นำเข้าไฟล์ " + f.name + " สำเร็จ", "ต้นแบบ — เพิ่มรายการตัวอย่าง 3 รายการ");
    }
  };

  const rows = P.map((p, i) => ({ ...p, i }));

  return (
    <div>
      <StepSection
        title="รายการอะไหล่ที่ใช้"
        right={
          !ro && (
            <>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".xlsx,.xls,.csv"
                aria-label="นำเข้าไฟล์รายการอะไหล่"
                onChange={(e) => {
                  importFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <Button variant="secondary" size="sm" iconLeft="upload_file" onClick={() => fileRef.current?.click()}>
                นำเข้าไฟล์
              </Button>
            </>
          )
        }
      />
      {!ro && (
        <div className="mb-4 grid grid-cols-1 items-start gap-x-6 gap-y-8 md:grid-cols-4">
          <TextField
            className="md:col-span-2"
            label="ชื่ออะไหล่"
            placeholder="เช่น ชุดลูกสูบพร้อมแหวน"
            value={name}
            error={err.name}
            onChange={(e) => {
              setName(e.target.value);
              setErr({});
            }}
          />
          <TextField
            label="จำนวน"
            type="number"
            min={1}
            inputMode="numeric"
            value={qty}
            error={err.qty}
            onChange={(e) => {
              setQty(e.target.value);
              setErr({});
            }}
          />
          <FieldShell label="หน่วย">
            <div className="flex gap-3">
              <SelectField className="flex-1" aria-label="หน่วย" options={UNITS.map((u) => ({ value: u, label: u }))} value={unit} onChange={(e) => setUnit(e.target.value)} />
              <Button variant="secondary" iconLeft="add" onClick={add}>
                เพิ่ม
              </Button>
            </div>
          </FieldShell>
        </div>
      )}
      <DataTable
        caption="รายการอะไหล่ที่ใช้"
        pagination={false}
        rows={rows}
        rowKey={(r) => r.name + "#" + r.i}
        empty={<EmptyState icon="inventory_2" title="ยังไม่ได้ระบุอะไหล่ที่ใช้" description="เพิ่มทีละรายการหรือนำเข้าไฟล์ — ต้องมีอย่างน้อย 1 รายการจึงปิดงานได้" />}
        columns={[
          { key: "name", header: "ชื่ออะไหล่", cell: (r) => r.name },
          { key: "qty", header: "จำนวน", numeric: true, cell: (r) => fmtNum(r.qty) },
          { key: "unit", header: "หน่วย", cell: (r) => r.unit },
          ...(ro
            ? []
            : [
                {
                  key: "act",
                  header: <span className="sr-only">ลบ</span>,
                  mobileLabel: "จัดการ",
                  width: "w-[72px]",
                  cell: (r: (typeof rows)[number]) => (
                    <span className="flex justify-center">
                      <Button variant="tertiaryDanger" iconOnly="delete" aria-label="ลบ" onClick={() => ctx.commit({ parts: P.filter((_, j) => j !== r.i) })} />
                    </span>
                  ),
                },
              ]),
        ]}
      />
      <ErrorText className="mt-2">{err.parts}</ErrorText>
      {ro ? (
        <JobAlert tone="ok" icon="task_alt" className="mt-4">
          ปิดงานแล้ว {fmtDate(job.closedAt)} — รถคันนี้จบรอบ Overhaul
        </JobAlert>
      ) : (
        <StepActions onBack={ctx.goBack}>
          <Button
            size="lg"
            onClick={() => {
              if (!P.length) return setErr({ parts: "กรุณาระบุอะไหล่ที่ใช้อย่างน้อย 1 รายการ" });
              ctx.commit({ closedAt: todayIso(), stage: "V11" }, { ok: "ปิดงานสำเร็จ" });
            }}
          >
            ปิดงาน
          </Button>
        </StepActions>
      )}
    </div>
  );
}
