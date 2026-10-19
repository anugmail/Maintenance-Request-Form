"use client";
/* รายละเอียดแผน (?id=) — S1 ปลายทาง · S2 แก้ไข (จุดเข้า) · S3 ลบแผน · S4 + PO · S5 แก้ไข PO (ทางที่ 1) · S6 ลบ PO
   พอร์ตพฤติกรรมจาก design-mock/overhaul-v2-03-plan-detail.html (ข้อความ/เงื่อนไขตามตัวอักษร)
   Figma (Component) VMS Plus: `Page header` (Back action · Badge = `Pill outline` สถานะแผน · Actions = `Secondary danger button` + `Secondary button`) ·
     `Breadcrumbs` · `Section label` (หน้ารายละเอียด — จำนวน "(n)" · Primary action = `Tertiary brand button` · Secondary action = `Tertiary button`) ·
     `Content item row` + `_Content item base` Type=Text with label (KeyValueGrid) · `_File upload item base` อ่านอย่างเดียว (FileUpload readOnly) ·
     `Table` ทั้งก้อน (Lead text · Text · Action icons) + `Dropdown menu` / `_Dropdown menu item` · `Empty state/Data empty` · `Empty state/Search not found` ·
     `Modal` Type=Destructive centered image with input (ConfirmDialog · มือถือ = Bottom sheet) · `Notification`
   UI Release#2: "5.1 Rental Contract Management" เฟรม `Rental contract info` (Page header Page=Info + Section label + Content item row + เอกสาร) ·
     `Contract list` (ตาราง + เมนู "…") */
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Button, ConfirmDialog, DataTable, EmptyState, FileUpload, KeyValueGrid, PageHeader, PlanStatusBadge, SectionLabel, useToast, type Column,
} from "@/components/ui";
import { OH2_VENDORS, fmtDate, fmtMoney, useMockStore, type Po } from "@/lib/mock";
import { routes } from "@/lib/routes";
import { useSavedToast } from "@/components/po/useSavedToast";

/** ?saved= → ข้อความแจ้งผล (ตามตัวอักษรของ HTML mock) */
const SAVED: Record<string, string> = {
  edit: "บันทึกการแก้ไขแผนสำเร็จ",
  po: "การสร้าง purchase order สำเร็จ",
  poedit: "บันทึกการแก้ไข PO สำเร็จ",
  podel: "ลบ purchase order สำเร็จ",
};

type Del = { type: "plan" } | { type: "po"; po: Po } | null;

export function PlanDetail() {
  const sp = useSearchParams();
  const id = sp.get("id") ?? "";
  const store = useMockStore();
  const toast = useToast();
  const router = useRouter();
  const plan = store.getPlan(id);
  const [del, setDel] = useState<Del>(null);
  /* ลบแผนแล้วกำลังออกจากหน้า — ไม่ต้องแสดง "ไม่พบแผน" ระหว่างรอเปลี่ยนหน้า */
  const [leaving, setLeaving] = useState(false);

  useSavedToast(sp.get("saved"), SAVED, "บันทึกสำเร็จ", routes.planView(id));
  useEffect(() => {
    if (plan) document.title = `แผน ${plan.id} | Maintain-D (Mock)`;
  }, [plan]);

  if (leaving) return null;
  if (!plan) {
    return (
      <>
        <PageHeader title="ไม่พบแผน" crumbs={[{ label: "จัดการงาน Overhaul", href: routes.plans() }, { label: "รายละเอียดแผน" }]} backHref={routes.plans()} />
        <EmptyState
          kind="notFound"
          title="ไม่พบแผนนี้"
          description="แผนอาจถูกลบไปแล้ว"
          action={<Button variant="secondary" size="sm" href={routes.plans()}>กลับหน้ารายการแผน</Button>}
        />
      </>
    );
  }

  const confirmDelete = () => {
    if (!del) return;
    if (del.type === "plan") {
      const r = store.deletePlan(plan.id);
      setDel(null);
      if (!r.ok) return toast.error(r.error);
      setLeaving(true);
      router.push(routes.plans("delete"));
      return;
    }
    const r = store.deletePo(plan.id, del.po.id);
    setDel(null);
    if (!r.ok) return toast.error(r.error);
    toast.success("ลบ purchase order สำเร็จ");
  };

  const columns: Column<Po>[] = [
    { key: "id", header: "หมายเลข PO", lead: true, cell: (o) => o.id },
    { key: "name", header: "ชื่อ PO", cell: (o) => o.name },
    { key: "vendor", header: "ศูนย์บริการ/อู่", cell: (o) => OH2_VENDORS[o.vendor]?.name ?? "—" },
    { key: "cars", header: "จำนวนรถ", numeric: true, cell: (o) => o.cars.length },
  ];

  return (
    <>
      <PageHeader
        title={`หมายเลขแผน ${plan.id}`}
        crumbs={[{ label: "จัดการงาน Overhaul", href: routes.plans() }, { label: `แผน ${plan.id}` }]}
        backHref={routes.plans()}
        badge={<PlanStatusBadge status={store.planStatus(plan)} />}
        actions={
          <>
            <Button variant="secondaryDanger" iconLeft="delete" onClick={() => setDel({ type: "plan" })}>ลบแผน</Button>
            <Button variant="secondary" iconLeft="edit" href={routes.planEdit(plan.id, "detail")}>แก้ไข</Button>
          </>
        }
      />

      <div className="flex flex-col gap-8">
        <section aria-labelledby="sec-info">
          <SectionLabel id="sec-info" title="รายละเอียดแผน" />
          <KeyValueGrid
            items={[
              { label: "ชื่อแผน", value: plan.name, wide: true },
              { label: "ประจำปีงบประมาณ", value: plan.year },
              { label: "วงเงินอนุมัติ (บาท)", value: fmtMoney(plan.budget) },
              { label: "จำนวนรถที่ Overhaul", value: `${store.planCars(plan).length} คัน` },
              { label: "วันที่สร้าง", value: fmtDate(plan.created) },
              { label: "เลข WBS (ศูนย์ต้นทุน)", value: plan.wbs },
              { label: "เลขโครงข่าย", value: plan.net },
              { label: "เลขกิจกรรม", value: plan.act },
            ]}
          />
        </section>

        <section aria-labelledby="sec-docs">
          <SectionLabel id="sec-docs" title="เอกสาร" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <FileUpload readOnly label="หนังสืออนุมัติหลักการ" files={plan.docs.approve} />
            <FileUpload readOnly label="เอกสารอนุมัติงบ" files={plan.docs.budget} />
            <FileUpload readOnly label="อื่นๆ" files={plan.docs.other} />
          </div>
        </section>

        <section aria-labelledby="sec-po">
          <SectionLabel
            id="sec-po"
            title="Purchase Order"
            count={plan.pos.length}
            right={<Button variant="tertiaryBrand" iconLeft="add" href={routes.poNew(plan.id)}>PO</Button>}
          />
          <DataTable
            caption="รายการ Purchase Order"
            columns={columns}
            rows={plan.pos}
            rowKey={(o) => o.id}
            pagination={false}
            rowMenuLabel={(o) => "จัดการ " + o.id}
            rowMenu={(o) => [
              { label: "ดูรายละเอียด", icon: "visibility", href: routes.poView(plan.id, o.id) },
              { label: "แก้ไข", icon: "edit", href: routes.poEdit(plan.id, o.id, "plan") },
              "divider",
              { label: "ลบ", icon: "delete", onSelect: () => setDel({ type: "po", po: o }) },
            ]}
            empty={
              <EmptyState icon="receipt_long" title="ยังไม่มี Purchase Order" description="เพิ่ม PO เพื่อเลือกรถที่จะเข้า Overhaul และเริ่มงานรายคัน" />
            }
          />
        </section>

        <section aria-labelledby="sec-parts">
          <SectionLabel
            id="sec-parts"
            title="อะไหล่จากคลัง"
            right={
              <Button variant="tertiary" iconLeft="add" onClick={() => toast.success("เบิกอะไหล่จากคลัง — ยังไม่ได้ออกแบบ", "userflow จอง section ไว้เท่านั้น")}>
                เบิก
              </Button>
            }
          />
          <EmptyState
            icon="inventory_2"
            title="ยังไม่มีรายการเบิกอะไหล่"
            description="ส่วนนี้จองไว้ตาม userflow — ขั้นตอนเบิกอะไหล่จากคลังยังไม่ได้ออกแบบ"
          />
        </section>
      </div>

      <ConfirmDialog
        open={del !== null}
        onClose={() => setDel(null)}
        onConfirm={confirmDelete}
        danger
        title={del?.type === "po" ? "ยืนยันการลบ PO" : "ยืนยันการลบแผน"}
        description={
          del?.type === "po"
            ? `PO ${del.po.id} "${del.po.name}" และงานของรถ ${del.po.cars.length} คันใน PO นี้จะถูกลบ`
            : `แผน ${plan.id} "${plan.name}"${plan.pos.length ? ` และ Purchase Order ${plan.pos.length} ใบในแผนนี้` : ""} จะถูกลบ`
        }
      />
    </>
  );
}
