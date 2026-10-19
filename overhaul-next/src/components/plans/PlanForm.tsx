"use client";
/** ฟอร์มสร้างแผน (S1) / แก้ไขแผน (S2) — ใช้ร่วมกันโดย /plans/new/ และ /plans/edit/?id=
 *  Figma (Component): `Page header` (Back action) + `Breadcrumbs` · `Section header` (Divider=false — หน้าสร้าง/แก้ไข R3) ·
 *    `Text input` / `Input dropdown` + `Input label` (Info icon=false R4) · แถว F10 วงเงิน + WBS · `File upload` Type=Default 1 คอลัมน์ ·
 *    `Secondary button` / `Primary button` Size=lg (ยกเลิกซ้าย · บันทึกขวา · ปุ่มเดียวขวา) · `Modal` Centered (ยืนยันการออก / ยืนยันการแก้ไขแผน) ·
 *    มือถือ = `Bottom sheet` · `Notification` Success/Error
 *  UI Release#2: หน้า 5.1 Rental Contract Management — `Create rental contract` / `- Filled` · `Modal / Edit contract`
 *  พอร์ตพฤติกรรมจาก design-mock/overhaul-v2-02-plan-form.html (userflow "Create Plan - Condition" / "Edit plan - Condition"):
 *   · ปีงบ: ค่าตั้งต้นปี พ.ศ. ปัจจุบัน นับไปข้างหน้า 5 ปี (แก้ไขแผนปีก่อนหน้า → ให้เห็นปีเดิมด้วย)
 *   · ตรวจตอนกดบันทึก (F9): ทุกช่องจำเป็นยกเว้น "อื่นๆ" · วงเงินต้องเป็นตัวเลขมากกว่า 0 · เลื่อนไปช่องผิดช่องแรก
 *   · ย้อนกลับ/ยกเลิก: มีการแก้ไข → ยืนยันการออก · ไม่มี → ออกเลย
 *   · บันทึก (สร้าง) → รายการแผน ?saved=create · (แก้ไข) มีการแก้ไข → ยืนยันการแก้ไขแผน · ไม่มี → ออกเลย
 *   · บันทึกไม่สำเร็จ (จำลอง) → "general error" อยู่หน้าเดิม */
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  Button, ConfirmDialog, FileUpload, FooterActions, FormCell, FormGrid, PageHeader, SectionHeader, SelectField, TextField, WbsRow, useToast,
} from "@/components/ui";
import { budgetYears, fmtMoney, OH2_MAX_FILES, useMockStore, type FileRef, type Plan, type PlanDocs } from "@/lib/mock";
import { routes } from "@/lib/routes";

type FieldKey = "name" | "year" | "budget" | "wbs" | "net" | "act";
type DocKey = keyof PlanDocs;
type ErrKey = FieldKey | "approve" | "budgetDoc";

const FIELDS: FieldKey[] = ["name", "year", "budget", "wbs", "net", "act"];
const LABEL: Record<FieldKey, string> = {
  name: "ชื่อแผน",
  year: "ประจำปีงบประมาณ",
  budget: "วงเงินอนุมัติ (บาท)",
  wbs: "เลข WBS",
  net: "เลขโครงข่าย",
  act: "เลขกิจกรรม",
};
/** กล่องเอกสาร (1 คอลัมน์) — required = ต้องมีอย่างน้อย 1 ไฟล์ */
const DOCS: { key: DocKey; err?: ErrKey; label: string }[] = [
  { key: "approve", err: "approve", label: "หนังสืออนุมัติหลักการ" },
  { key: "budget", err: "budgetDoc", label: "เอกสารอนุมัติงบ" },
  { key: "other", label: "อื่นๆ" },
];

/** ตัวเลขเงินแบบ HTML: ตัดจุลภาคแล้ว Number() (ว่าง → 0) */
const money = (v: string) => Number(String(v).replace(/,/g, ""));
const fid = (k: ErrKey | DocKey) => "pf-" + k;

export interface PlanFormProps {
  /** ไม่ใส่ = สร้างแผน */
  plan?: Plan;
  /** หน้าที่กลับไปเมื่อย้อนกลับ/ยกเลิก (และไม่มีการแก้ไขตอนบันทึก) */
  backHref: string;
  /** หน้าที่ไปหลังบันทึกการแก้ไขสำเร็จ (มี ?saved=edit) */
  savedHref?: string;
  /** หลังสร้างสำเร็จ (มี ?saved=create) */
  createdHref?: string;
}

export function PlanForm({ plan, backHref, savedHref, createdHref }: PlanFormProps) {
  const store = useMockStore();
  const toast = useToast();
  const router = useRouter();

  const [years] = useState(() => {
    const ys = budgetYears(5);
    if (plan && !ys.includes(plan.year)) ys.unshift(plan.year);
    return ys;
  });
  const [values, setValues] = useState<Record<FieldKey, string>>(() => ({
    name: plan?.name ?? "",
    year: String(plan?.year ?? years[0]),
    budget: plan ? fmtMoney(plan.budget) : "",
    wbs: plan?.wbs ?? "",
    net: plan?.net ?? "",
    act: plan?.act ?? "",
  }));
  const [docs, setDocs] = useState<PlanDocs>(() =>
    plan ? (JSON.parse(JSON.stringify(plan.docs)) as PlanDocs) : { approve: [], budget: [], other: [] },
  );
  const [errors, setErrors] = useState<Partial<Record<ErrKey, string>>>({});
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  /* มีการแก้ไขไหม — เทียบภาพรวมค่า (ตัดช่องว่าง) + เอกสาร กับตอนเปิดหน้า */
  const snap = () => JSON.stringify([FIELDS.map((f) => values[f].trim()), docs]);
  const start = useRef<string | null>(null);
  if (start.current === null) start.current = snap();
  const dirty = () => snap() !== start.current;

  const clearErr = (k: ErrKey) => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  const setField = (k: FieldKey, v: string) => {
    setValues((s) => ({ ...s, [k]: v }));
    clearErr(k);
  };
  const setDoc = (k: DocKey, files: FileRef[]) => {
    setDocs((d) => ({ ...d, [k]: files }));
    const err = DOCS.find((d) => d.key === k)?.err;
    if (err) clearErr(err);
  };

  /* ตรวจตอนกดบันทึก — ลำดับเดียวกับหน้าจอ · เลื่อนไปช่องแรกที่ผิด */
  const validate = () => {
    const next: Partial<Record<ErrKey, string>> = {};
    for (const f of FIELDS) {
      const v = values[f].trim();
      if (!v) next[f] = "กรุณาระบุ" + LABEL[f];
      else if (f === "budget" && !(money(v) > 0)) next[f] = "วงเงินต้องเป็นตัวเลขมากกว่า 0";
    }
    for (const d of DOCS) if (d.err && !docs[d.key].length) next[d.err] = "กรุณาแนบ" + d.label;
    setErrors(next);
    const first = (Object.keys(next) as ErrKey[])[0];
    if (first) {
      requestAnimationFrame(() => {
        const el = document.getElementById(fid(first));
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.focus({ preventScroll: true });
      });
    }
    return !first;
  };

  const commit = () => {
    const data = {
      name: values.name.trim(),
      year: Number(values.year),
      budget: money(values.budget),
      wbs: values.wbs.trim(),
      net: values.net.trim(),
      act: values.act.trim(),
      docs,
    };
    const r = plan ? store.updatePlan(plan.id, data) : store.createPlan(data);
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    return true;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (plan) {
      if (!dirty()) return router.push(backHref); // ไม่มีการแก้ไข → ไม่มี cf change
      setEditOpen(true);
      return;
    }
    if (commit()) router.push(createdHref ?? backHref);
  };

  const confirmEdit = () => {
    setEditOpen(false);
    if (commit()) router.push(savedHref ?? backHref);
  };

  /* ย้อนกลับ / ยกเลิก — มีการแก้ไขเท่านั้นถึงถาม */
  const leave = () => (dirty() ? setLeaveOpen(true) : router.push(backHref));

  const title = plan ? `แก้ไขแผน ${plan.id}` : "สร้างแผน Overhaul";
  const field = (k: FieldKey, extra: { placeholder: string; inputMode?: "decimal" | "numeric"; onBlur?: () => void }) => (
    <TextField
      id={fid(k)}
      label={LABEL[k]}
      value={values[k]}
      onChange={(e) => setField(k, e.target.value)}
      error={errors[k]}
      {...extra}
    />
  );

  return (
    <>
      <PageHeader title={title} crumbs={[{ label: "จัดการงาน Overhaul", href: routes.plans() }, { label: title }]} onBack={leave} />

      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-8">
        <section aria-labelledby="pf-s1">
          <SectionHeader id="pf-s1" title="ข้อมูลแผน" />
          <FormGrid>
            <FormCell span="wide">{field("name", { placeholder: "เช่น Overhaul ประจำปีงบ 2570 — รถเครน" })}</FormCell>
            <FormCell span="narrow">
              <SelectField
                id={fid("year")}
                label={LABEL.year}
                value={values.year}
                onChange={(e) => setField("year", e.target.value)}
                error={errors.year}
                options={years.map((y) => ({ value: String(y), label: String(y) }))}
              />
            </FormCell>
            <WbsRow
              money={field("budget", {
                placeholder: "0",
                inputMode: "decimal",
                onBlur: () => {
                  const n = money(values.budget);
                  if (n > 0) setValues((s) => ({ ...s, budget: fmtMoney(n) }));
                },
              })}
              wbs={field("wbs", { placeholder: "เช่น C-70-OH-0003" })}
              network={field("net", { placeholder: "เช่น 60002103", inputMode: "numeric" })}
              activity={field("act", { placeholder: "เช่น 0010", inputMode: "numeric" })}
            />
          </FormGrid>
        </section>

        <section aria-labelledby="pf-s2">
          <SectionHeader id="pf-s2" title="เอกสาร" />
          {/* กล่องอัปโหลด 1 คอลัมน์ (เจ้าของงานเคาะ 19 ต.ค. 2569) */}
          <div className="flex flex-col gap-6">
            {DOCS.map((d) => (
              <div key={d.key} id={fid(d.err ?? d.key)}>
                <FileUpload
                  label={d.label}
                  optional={!d.err}
                  files={docs[d.key]}
                  onChange={(f) => setDoc(d.key, f)}
                  error={d.err ? errors[d.err] : undefined}
                  maxFiles={OH2_MAX_FILES}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ยกเลิกชิดซ้าย (เฉพาะแก้ไข) · บันทึกชิดขวา · ปุ่มเดียวก็ชิดขวา */}
        <FooterActions
          left={plan ? <Button variant="secondary" size="lg" onClick={leave}>ยกเลิก</Button> : undefined}
          right={<Button type="submit" size="lg">บันทึก</Button>}
        />
      </form>

      <ConfirmDialog
        open={leaveOpen}
        onClose={() => setLeaveOpen(false)}
        onConfirm={() => router.push(backHref)}
        title="ยืนยันการออก"
        description="ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก"
        cancelLabel="ปิด"
      />
      {plan && (
        <ConfirmDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onConfirm={confirmEdit}
          title="ยืนยันการแก้ไขแผน"
          description={`บันทึกการเปลี่ยนแปลงของแผน ${plan.id} "${values.name.trim()}"`}
        />
      )}
    </>
  );
}
