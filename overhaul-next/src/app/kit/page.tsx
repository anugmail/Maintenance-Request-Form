"use client";
/* /kit — แกลเลอรีคอมโพเนนต์ทุกตัวทุก state ให้เจ้าของงานเทียบกับไลบรารี (Component) VMS Plus
   แต่ละบล็อกบอกชื่อ component ใน Figma ที่มันแทน · ข้อมูลตัวอย่างจาก mock (OH2_*) */
import { useState, type ReactNode } from "react";
import {
  Badge, Breadcrumbs, Button, Checkbox, CheckboxList, Combobox, ConfirmDialog, DataTable, DateField, DateRangeField, DateTimeField,
  DualList, EmptyState, FileErrorItem, FileUpload, FilterChips, FilterPanel, FilterSection, FooterActions, FormGrid, FormCell, JobStatusBadge,
  KeyValueGrid, Modal, Notification, PageHeader, Pagination, PlanStatusBadge, RowMenu, SearchInput, SectionHeader, SectionLabel, SelectField,
  Stepper, TextArea, TextField, TimeField, WbsRow, stepStates, useToast, type Column, type RowMenuItem,
} from "@/components/ui";
import {
  JOB_STAGES, OH2_BUDGET_RANGES, OH2_PLAN, OH2_STEPS, OH2_VEHICLES, OH2_VENDORS, PLAN_STATUSES, fmtDate, fmtMoney, fmtNum, useMockStore,
  type FileRef, type Plan,
} from "@/lib/mock";
import { routes } from "@/lib/routes";

function Block({ title, figma, children }: { title: string; figma: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-gray-200 pt-6">
      <div>
        <h2 className="text-lg font-semibold text-black">{title}</h2>
        <p className="text-xs text-gray-600">Figma: {figma}</p>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <div className="text-xs font-semibold text-gray-500">{label}</div>}
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

/** กรอบจำลองจอมือถือ 402px (ให้เห็นแบบการ์ด/บอททอมชีตบนจอ desktop) */
function Phone({ children }: { children: ReactNode }) {
  return <div className="w-full max-w-[402px] rounded-lg border border-gray-300 bg-white p-4">{children}</div>;
}

const MENU = (p: Plan): RowMenuItem[] => [
  { label: "ดูรายละเอียด", icon: "visibility", href: routes.planView(p.id) },
  { label: "แก้ไข", icon: "edit", href: routes.planEdit(p.id) },
  "divider",
  { label: "ลบ", icon: "delete", onSelect: () => {} },
];

const SAMPLE_FILES: FileRef[] = [
  { name: "หนังสืออนุมัติหลักการ-123456.pdf", size: 842000 },
  { name: "เอกสารอนุมัติงบ-123456.jpg", size: 1615000 },
];

export default function KitPage() {
  const store = useMockStore();
  const toast = useToast();
  const plans = store.state.plans;

  const [text, setText] = useState("Overhaul ประจำปีงบ 2570 — รถเครน");
  const [money, setMoney] = useState("10,000,000");
  const [year, setYear] = useState("2570");
  const [vendor, setVendor] = useState("");
  const [carFilter, setCarFilter] = useState("c8");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:30");
  const [dt, setDt] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [chk, setChk] = useState(true);
  const [statuses, setStatuses] = useState<string[]>(["P2"]);
  const [q, setQ] = useState("");
  const [chips, setChips] = useState([
    { key: "budget", label: "5–20 ล้านบาท" },
    { key: "P2", label: "ดำเนินการ" },
    { key: "car", label: "72-6648 สงขลา" },
  ]);
  const [filterOpen, setFilterOpen] = useState<false | "drawer" | "sheet">(false);
  const [modal, setModal] = useState<null | "form" | "confirm" | "danger" | "sheetForm" | "sheetConfirm">(null);
  const [files, setFiles] = useState<FileRef[]>(SAMPLE_FILES);
  const [fullFiles, setFullFiles] = useState<FileRef[]>(Array.from({ length: 10 }, (_, i) => ({ name: `ใบสั่งจ้าง-${i + 1}.pdf`, size: 300000 + i * 1000 })));
  const [cars, setCars] = useState<string[]>(["c1", "c3"]);
  const [view, setView] = useState(1);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const cols: Column<Plan>[] = [
    { key: "id", header: "เลขแผน", sortable: true, lead: true, cell: (p) => p.id },
    { key: "name", header: "ชื่อแผน", sortable: true, cell: (p) => p.name },
    { key: "wbs", header: "ศูนย์ต้นทุน", sortable: true, cell: (p) => p.wbs },
    { key: "budget", header: "งบประมาณ (บาท)", numeric: true, cell: (p) => fmtMoney(p.budget) },
    { key: "pos", header: "Purchase Order", numeric: true, cell: (p) => p.pos.length },
    { key: "cars", header: "จำนวนรถที่ Overhaul", numeric: true, cell: (p) => store.planCars(p).length },
    { key: "status", header: "สถานะ", sortable: true, sortValue: (p) => store.planStatus(p), cell: (p) => <PlanStatusBadge status={store.planStatus(p)} /> },
    { key: "created", header: "วันที่สร้าง", cell: (p) => fmtDate(p.created) },
  ];

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="ชุดคอมโพเนนต์ (Kit)"
        crumbs={[{ label: "ชุดคอมโพเนนต์" }]}
        subtitle="ทุก component ทุก state ของต้นแบบ Overhaul v2 — เทียบกับไลบรารี (Component) VMS Plus"
      />

      {/* ---------- Buttons ---------- */}
      <Block title="Button" figma="Primary / Secondary / Tertiary / Tertiary brand / Tertiary danger / Primary danger / Secondary danger button · Size md 40 · lg 48 (sm 36 ส่วนขยาย)">
        {(["primary", "secondary", "tertiary", "tertiaryBrand", "tertiaryDanger", "danger", "secondaryDanger"] as const).map((v) => (
          <Row key={v} label={v}>
            <Button variant={v} size="sm">ขนาด sm</Button>
            <Button variant={v}>ขนาด md</Button>
            <Button variant={v} size="lg">ขนาด lg</Button>
            <Button variant={v} iconLeft="add">ไอคอนนำ</Button>
            <Button variant={v} iconOnly="more_horiz" aria-label="เพิ่มเติม" />
            <Button variant={v} loading>กำลังบันทึก</Button>
            <Button variant={v} disabled>ปิดใช้</Button>
          </Row>
        ))}
        <Row label="ลิงก์ (href → next/link)">
          <Button href={routes.plans()} iconLeft="arrow_back" variant="secondary">กลับหน้ารายการแผน</Button>
          <Button href={routes.planNew()} iconLeft="add">สร้างแผน Overhaul</Button>
          <Button href={routes.planNew()} disabled>ลิงก์ปิดใช้</Button>
        </Row>
      </Block>

      {/* ---------- Badges ---------- */}
      <Block title="Badge / StatusBadge" figma="Pill outline (Gray · Warning · Error · Info · Brand · Success) · Badge outline Color=Gray (ตัวนับ)">
        <Row label="tone">
          {(["neutral", "low", "out", "info", "brand", "ok"] as const).map((t) => (
            <Badge key={t} tone={t}>{t}</Badge>
          ))}
          <Badge tone="info" dot>มีจุด</Badge>
          <Badge square>12</Badge>
        </Row>
        <Row label="สถานะแผน P1–P3">
          {PLAN_STATUSES.map((s) => <PlanStatusBadge key={s} status={s} />)}
        </Row>
        <Row label="สถานะงานรายคัน V1–V11">
          {JOB_STAGES.map((s) => <JobStatusBadge key={s} stage={s} />)}
        </Row>
      </Block>

      {/* ---------- Page header ---------- */}
      <Block title="Breadcrumbs / PageHeader" figma="Breadcrumbs · Page header (Back action · Badge · Supporting text · Actions · Divider=ปิด)">
        <Breadcrumbs items={[{ label: "จัดการงาน Overhaul", href: routes.plans() }, { label: "Overhaul ประจำปีงบ 2569 — รถเครน" }]} />
        <div className="rounded-md border border-dashed border-gray-300 p-4">
          <PageHeader
            title="Overhaul ประจำปีงบ 2569 — รถเครน"
            crumbs={[{ label: "จัดการงาน Overhaul", href: routes.plans() }, { label: "Overhaul ประจำปีงบ 2569 — รถเครน" }]}
            backHref={routes.plans()}
            badge={<PlanStatusBadge status="P2" />}
            subtitle="เลขแผน 123456 · ปีงบประมาณ 2569"
            actions={
              <>
                <Button variant="secondaryDanger" iconLeft="delete">ลบแผน</Button>
                <Button variant="secondary" iconLeft="edit">แก้ไข</Button>
              </>
            }
          />
        </div>
      </Block>

      {/* ---------- Section header / label ---------- */}
      <Block title="SectionHeader (หน้าสร้าง/แก้ไข) · SectionLabel (หน้ารายละเอียด)" figma="Section header (Divider=ปิด) · Section label (Info icon=ปิด)">
        <div className="rounded-md border border-dashed border-gray-300 p-4">
          <SectionHeader title="ข้อมูลแผน" />
          <SectionHeader title="Purchase Order" count={3} subtitle="รายการใบสั่งจ้างในแผนนี้" right={<Button size="sm" iconLeft="add">PO</Button>} />
        </div>
        <div className="rounded-md border border-dashed border-gray-300 p-4">
          <SectionLabel title="รายละเอียดแผน" />
          <SectionLabel title="Purchase Order" count={3} subtitle="Supporting text 12" right={<Button variant="tertiaryBrand" iconLeft="add">เพิ่ม PO</Button>} />
        </div>
      </Block>

      {/* ---------- Key/value ---------- */}
      <Block title="KeyValueGrid" figma="Content item row + _Content item base (Type=Text with label) — กล่องพื้น gray-50 r8 pad 24 · 4 ช่อง/แถว (มือถือ 2)">
        <div>
          <SectionLabel title="ข้อมูลยานพาหนะ" />
          <KeyValueGrid
            items={[
              { label: "ทะเบียน", value: OH2_VEHICLES[0].plate },
              { label: "ยี่ห้อ/รุ่น", value: OH2_VEHICLES[0].brand },
              { label: "ประเภท", value: OH2_VEHICLES[0].type },
              { label: "อายุการใช้งาน", value: OH2_VEHICLES[0].age + " ปี" },
              { label: "เลขไมล์สะสม", value: fmtNum(OH2_VEHICLES[0].mileage) + " กม." },
              { label: "ชั่วโมงสะสม", value: fmtNum(OH2_VEHICLES[0].hours) + " ชม." },
              { label: "Purchase Order", value: "PO-690101 · ซ่อมระบบเครื่องยนต์" },
              { label: "ศูนย์บริการ/อู่", value: OH2_VENDORS[0].name },
              { label: "หมายเหตุ (wide)", value: "ช่องที่กินเต็มแถว", wide: true },
            ]}
          />
        </div>
      </Block>

      {/* ---------- Inputs ---------- */}
      <Block title="TextField / SelectField / Combobox / TextArea / Date" figma="Text input · Input dropdown + Dropdown list item · Text area · Input label (Info icon=ปิด · ช่องไม่บังคับ “(ถ้ามี)”)">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-3">
          <TextField label="Default (ว่าง)" placeholder="เช่น Overhaul ประจำปีงบ 2570" />
          <TextField label="Filled" value={text} onChange={(e) => setText(e.target.value)} />
          <TextField label="Error" value="" onChange={() => {}} error="กรุณาระบุชื่อแผน" placeholder="ชื่อแผน" />
          <TextField label="Readonly (Display)" value="123456" readOnly />
          <TextField label="ค่าที่ระบบเติมให้" value="02-590-9123" autoFilled />
          <TextField label="Disabled" value="ปิดใช้" disabled />
          <TextField label="มีไอคอนนำหน้า" icon="search" placeholder="ค้นหา" />
          <TextField label="หน่วยต่อท้าย" value={money} onChange={(e) => setMoney(e.target.value)} inputMode="decimal" suffix="บาท" />
          <TextField label="อื่นๆ" optional placeholder="ช่องไม่บังคับ" helper="Helper text 12 gray-600" />
          <SelectField label="ประจำปีงบประมาณ" value={year} onChange={(e) => setYear(e.target.value)} options={["2569", "2570", "2571"].map((y) => ({ value: y, label: y }))} />
          <SelectField label="งบประมาณ" placeholder="ทั้งหมด" defaultValue="" options={OH2_BUDGET_RANGES.map((r) => ({ value: r.value, label: r.label }))} />
          <SelectField label="Select error" placeholder="เลือก" options={[]} defaultValue="" error="กรุณาเลือก" />
          <Combobox
            label="ศูนย์บริการ/อู่ (พิมพ์ค้น)"
            placeholder="ค้นหาชื่อศูนย์บริการ/อู่"
            value={vendor}
            onChange={setVendor}
            options={OH2_VENDORS.map((v, i) => ({ value: String(i), label: v.name, sub: `${v.tel} · ${v.addr}` }))}
          />
          <Combobox
            label="รถ (เลือกแล้ว)"
            placeholder="ค้นหาทะเบียน"
            value={carFilter}
            onChange={setCarFilter}
            options={OH2_VEHICLES.map((v) => ({ value: v.id, label: v.plate, sub: `${v.brand} · ${v.type}` }))}
          />
          <Combobox label="Combobox error" value="" onChange={() => {}} options={[]} error="กรุณาเลือกศูนย์บริการ/อู่" emptyText="ไม่พบรายการ" />
          <DateField label="วันที่ (min วันนี้)" value={date} onChange={setDate} minToday />
          <TimeField label="เวลา" value={time} onChange={setTime} />
          <DateTimeField label="วันที่/เวลา" value={dt} onChange={setDt} />
          <TextArea label="รายละเอียด" className="md:col-span-2" placeholder="ระบุความคืบหน้าของงานซ่อม" value={note} onChange={(e) => setNote(e.target.value)} />
          <TextArea label="Textarea error" error="กรุณาระบุรายละเอียด" rows={2} />
        </div>
        <DateRangeField value={range} onChange={setRange} minToday fromLabel="นำรถเข้าตั้งแต่วันที่" toLabel="ถึงวันที่" toError={!range.to ? "กรุณาเลือกวันที่สิ้นสุด" : undefined} />
      </Block>

      <Block title="FormGrid + WbsRow (กติกา F10)" figma="Row > [ช่องเงิน · WBS (3 ช่อง)] — จอกว้างครึ่ง/ครึ่ง · แท็บเล็ตเงินเต็มแถว · มือถือ 1 คอลัมน์">
        <FormGrid>
          <FormCell span="wide"><TextField label="ชื่อแผน" placeholder="เช่น Overhaul ประจำปีงบ 2570 — รถเครน" /></FormCell>
          <FormCell span="narrow"><SelectField label="ประจำปีงบประมาณ" options={[{ value: "2570", label: "2570" }]} /></FormCell>
          <WbsRow
            money={<TextField label="วงเงินอนุมัติ (บาท)" inputMode="decimal" placeholder="0" />}
            wbs={<TextField label="เลข WBS" placeholder="เช่น C-70-OH-0003" />}
            network={<TextField label="เลขโครงข่าย" inputMode="numeric" placeholder="เช่น 60002103" />}
            activity={<TextField label="เลขกิจกรรม" inputMode="numeric" placeholder="เช่น 0010" />}
          />
        </FormGrid>
      </Block>

      {/* ---------- Checkbox ---------- */}
      <Block title="Checkbox / CheckboxList" figma="Checkbox (Unselected · Selected · Indeterminate · Disabled) · Checkbox with badge">
        <Row>
          <Checkbox checked={chk} onChange={setChk} label="ติ๊กได้" />
          <Checkbox checked={false} onChange={() => {}} label="ยังไม่ติ๊ก" />
          <Checkbox checked={false} indeterminate onChange={() => {}} label="Indeterminate" />
          <Checkbox checked onChange={() => {}} disabled label="Disabled (ติ๊ก)" />
          <Checkbox checked={false} onChange={() => {}} disabled label="Disabled" />
        </Row>
        <Row label="Checkbox with badge (ตัวกรองสถานะ)">
          <CheckboxList
            value={statuses}
            onChange={setStatuses}
            options={PLAN_STATUSES.map((s) => ({ value: s, label: <PlanStatusBadge status={s} />, text: OH2_PLAN[s][0] }))}
          />
        </Row>
      </Block>

      {/* ---------- Search + filter ---------- */}
      <Block title="SearchInput / FilterChips / FilterPanel" figma="Table header (Search · Actions · Filters) · Badge outline with remove icon · Side panel / Bottom sheet Type=Filter">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={q} onChange={setQ} placeholder="ค้นหาเลขแผน, ชื่อแผน, เลขศูนย์ต้นทุน" aria-label="ค้นหาแผน" className="min-w-[220px] flex-[0_1_415px]" />
          <div className="flex gap-3">
            <Button variant="secondary" iconLeft="filter_list" onClick={() => setFilterOpen("drawer")}>ตัวกรอง</Button>
            <Button variant="secondary" iconLeft="filter_list" onClick={() => setFilterOpen("sheet")}>ตัวกรอง (bottom sheet)</Button>
          </div>
        </div>
        <FilterChips chips={chips} onRemove={(k) => setChips((c) => c.filter((x) => x.key !== k))} />
        <FilterPanel
          open={!!filterOpen}
          mode={filterOpen === "sheet" ? "sheet" : "auto"}
          onClose={() => setFilterOpen(false)}
          onApply={() => setFilterOpen(false)}
          onClear={() => setStatuses([])}
        >
          <SelectField label="งบประมาณ" placeholder="ทั้งหมด" defaultValue="" options={OH2_BUDGET_RANGES.map((r) => ({ value: r.value, label: r.label }))} />
          <FilterSection label="สถานะ">
            <CheckboxList value={statuses} onChange={setStatuses} options={PLAN_STATUSES.map((s) => ({ value: s, label: <PlanStatusBadge status={s} />, text: OH2_PLAN[s][0] }))} />
          </FilterSection>
          <Combobox label="รถ" placeholder="ค้นหาทะเบียน" value={carFilter} onChange={setCarFilter} options={OH2_VEHICLES.map((v) => ({ value: v.id, label: v.plate, sub: `${v.brand} · ${v.type}` }))} />
          <SelectField label="ศูนย์ต้นทุน" placeholder="ทั้งหมด" defaultValue="" options={[...new Set(plans.map((p) => p.wbs))].map((w) => ({ value: w, label: w }))} />
        </FilterPanel>
      </Block>

      {/* ---------- Table ---------- */}
      <Block title="DataTable" figma="Table (Alternating fills · Table header cell + Sort icon · Table cell Lead text/Text/Badge/Action icons · Table pagination) · Dropdown menu">
        <DataTable columns={cols} rows={plans} rowKey={(p) => p.id} defaultSort={{ key: "id", dir: -1 }} rowMenu={MENU} rowMenuLabel={(p) => `จัดการแผน ${p.id}`} pagination={{ pageSize: 5 }} caption="รายการแผน" />
        <Row label="ตารางว่าง (Empty state/Data empty) · ค้นไม่เจอ (Search not found)">
          <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
            <DataTable
              columns={cols.slice(0, 3)}
              rows={[]}
              rowKey={(p) => p.id}
              empty={<EmptyState title="ยังไม่มีแผน Overhaul" description="สร้างแผนเพื่อเริ่มเพิ่ม Purchase Order และติดตามงานรายคัน" action={<Button size="sm" iconLeft="add">สร้างแผน Overhaul</Button>} />}
            />
            <EmptyState kind="notFound" title="ไม่พบแผน Overhaul" description="ไม่มีแผนที่ตรงกับคำค้นหรือตัวกรอง" action={<Button variant="secondary" size="sm">ล้างคำค้นและตัวกรอง</Button>} />
          </div>
        </Row>
        <Row label="มือถือ (< 768): Mobile table + เมนู “…” เป็น bottom sheet">
          <Phone>
            <DataTable columns={cols} rows={plans.slice(0, 2)} rowKey={(p) => p.id} rowMenu={MENU} rowMenuLabel={(p) => `จัดการแผน ${p.id}`} forceCards pagination={false} />
          </Phone>
        </Row>
        <Row label="เมนู “…” เดี่ยว (Dropdown menu)">
          <RowMenu label="จัดการตัวอย่าง" items={[{ label: "ดูรายละเอียด", icon: "visibility" }, { label: "แก้ไข", icon: "edit" }, { label: "ปิดใช้", icon: "block", disabled: true }, "divider", { label: "ลบ", icon: "delete" }]} />
        </Row>
        <Row label="Table pagination (เดี่ยว)">
          <div className="w-full">
            <Pagination page={page} pageSize={size} total={95} onPageChange={setPage} onPageSizeChange={setSize} />
          </div>
        </Row>
      </Block>

      {/* ---------- Modal ---------- */}
      <Block title="Modal / ConfirmDialog / Bottom sheet" figma="Modal Type=Form · Destructive centered image with input · Centered image · Bottom sheet (Form · Confirmation)">
        <Row label="desktop (จอ < 768 สลับเป็น bottom sheet เอง)">
          <Button variant="secondary" onClick={() => setModal("form")}>Modal ฟอร์ม</Button>
          <Button variant="secondary" onClick={() => setModal("confirm")}>ยืนยัน</Button>
          <Button variant="secondaryDanger" onClick={() => setModal("danger")}>ยืนยันลบ</Button>
        </Row>
        <Row label="บังคับ bottom sheet">
          <Button variant="secondary" onClick={() => setModal("sheetForm")}>Bottom sheet ฟอร์ม</Button>
          <Button variant="secondary" onClick={() => setModal("sheetConfirm")}>Bottom sheet ยืนยันลบ</Button>
        </Row>
        <Modal
          open={modal === "form" || modal === "sheetForm"}
          mode={modal === "sheetForm" ? "sheet" : "auto"}
          onClose={() => setModal(null)}
          title="เพิ่มความคืบหน้า"
          confirmLabel="บันทึก"
          onConfirm={() => {
            setModal(null);
            toast.success("บันทึกความคืบหน้าสำเร็จ");
          }}
        >
          <DateTimeField label="วันที่/เวลา" value={dt} onChange={setDt} />
          <TextArea label="รายละเอียด" placeholder="ระบุความคืบหน้าของงานซ่อม" />
        </Modal>
        <ConfirmDialog
          open={modal === "confirm"}
          onClose={() => setModal(null)}
          onConfirm={() => setModal(null)}
          title="ยืนยันการออก"
          description="ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก"
          cancelLabel="ปิด"
        />
        <ConfirmDialog
          open={modal === "danger" || modal === "sheetConfirm"}
          mode={modal === "sheetConfirm" ? "sheet" : "auto"}
          danger
          onClose={() => setModal(null)}
          onConfirm={() => {
            setModal(null);
            toast.success("ลบแผน overhaul สำเร็จ");
          }}
          title="ยืนยันการลบแผน"
          description={`แผน 123456 "Overhaul ประจำปีงบ 2569 — รถเครน" และ Purchase Order 3 ใบในแผนนี้ จะถูกลบ`}
        />
      </Block>

      {/* ---------- Toast ---------- */}
      <Block title="Toast (Notification)" figma="Notification Type=Success | Error · Actions=ปิด">
        <Row>
          <Button variant="secondary" onClick={() => toast.success("การสร้างแผน overhaul สำเร็จ")}>toast.success</Button>
          <Button variant="secondary" onClick={() => toast.error("general error")}>toast.error</Button>
          <Button variant="secondary" onClick={() => toast.success("ดาวน์โหลด ใบสั่งจ้าง.pdf", "ต้นแบบ — ยังไม่มีไฟล์จริง")}>มีข้อความรอง</Button>
        </Row>
        <Row label="ตัวอย่างนิ่ง">
          <Notification kind="success" title="ลบแผน overhaul สำเร็จ" onClose={() => {}} />
          <Notification kind="error" title="general error" sub="ลองใหม่อีกครั้ง" onClose={() => {}} />
        </Row>
      </Block>

      {/* ---------- Stepper ---------- */}
      <Block title="Stepper" figma="Progress steps Type=Horizontal (กรอบ r8 ขอบ gray-300 + Horizontal step item + Connector) · Mobile progress steps">
        <Row label="ทำถึงขั้น 3 · กดขั้นที่ผ่านแล้วเพื่อย้อนดู">
          <Stepper className="w-full" variant="desktop" steps={stepStates(OH2_STEPS, 2)} selected={view} onStepClick={setView} />
        </Row>
        <Row label="สถานะ done / current / upcoming / locked + Supporting text">
          <Stepper
            className="w-full"
            variant="desktop"
            steps={[
              { label: "นัดเอารถเข้าอู่", state: "done", supporting: "12/08/2569" },
              { label: "ตรวจรับรถ", state: "current", supporting: "กำลังทำ" },
              { label: "ติดตามงานซ่อม", state: "upcoming" },
              { label: "ตรวจสภาพ", state: "locked" },
            ]}
          />
        </Row>
        <Row label="ปิดงานครบ">
          <Stepper className="w-full" variant="desktop" steps={stepStates(OH2_STEPS, 6, true)} selected={5} />
        </Row>
        <Row label="มือถือ (Mobile progress steps — กดเพื่อกาง)">
          <Phone>
            <Stepper variant="mobile" steps={stepStates(OH2_STEPS, 2)} selected={2} onStepClick={() => {}} />
          </Phone>
        </Row>
      </Block>

      {/* ---------- Dual list ---------- */}
      <Block title="DualList (เลือกรถ — รอเจ้าของงานออกแบบใหม่)" figma="List with checkbox + List header item + List with checkbox item · Secondary button">
        <DualList
          items={OH2_VEHICLES.map((v) => ({ id: v.id, label: v.plate, details: [`${v.brand} · ${v.type}`, `เลขไมล์ ${fmtNum(v.mileage)} กม.`, `อายุ ${v.age} ปี`] }))}
          value={cars}
          onChange={setCars}
        />
      </Block>

      {/* ---------- File upload ---------- */}
      <Block title="FileUpload" figma="File upload = _File upload base + _File upload item base (Completed · Error) · Featured icon sm Gray">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <FileUpload label="หนังสืออนุมัติหลักการ" files={files} onChange={setFiles} />
          <FileUpload label="อื่นๆ" optional files={[]} onChange={() => {}} />
          <FileUpload label="ใบสั่งจ้าง (error)" files={[]} onChange={() => {}} error="กรุณาแนบไฟล์อย่างน้อย 1 ไฟล์" />
          <div className="flex flex-col gap-2">
            <div className="text-xs font-semibold text-gray-500">รายการผิดพลาด (ไฟล์ผิดชนิด)</div>
            <FileErrorItem name="รูปรถ.png" />
          </div>
          <FileUpload label="ครบ 10 ไฟล์ (กล่องปิด)" files={fullFiles.slice(0, 10)} onChange={setFullFiles} className="lg:col-span-2 [&>div:last-child]:max-h-64 [&>div:last-child]:overflow-auto" />
          <FileUpload label="อ่านอย่างเดียว (หน้ารายละเอียด)" files={SAMPLE_FILES} readOnly />
          <FileUpload label="อ่านอย่างเดียว · ไม่มีไฟล์" files={[]} readOnly />
        </div>
      </Block>

      {/* ---------- Footer actions ---------- */}
      <Block title="FooterActions" figma="แถว Actions ท้ายหน้า — 2 ปุ่ม: ยกเลิกซ้าย · บันทึกขวา · ปุ่มเดียวชิดขวา · มือถือแบ่งเท่ากัน">
        <FooterActions left={<Button variant="secondary" size="lg">ยกเลิก</Button>} right={<Button size="lg">บันทึก</Button>} />
        <FooterActions right={<Button size="lg">บันทึก</Button>} />
        <Phone>
          <div className="flex items-center gap-4 [&>*]:flex-1">
            <Button variant="secondary" size="lg">ยกเลิก</Button>
            <Button size="lg">บันทึก</Button>
          </div>
        </Phone>
      </Block>
    </div>
  );
}
