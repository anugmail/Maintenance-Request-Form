"use client";
/* รายละเอียด Purchase Order (?plan=&po=) — S4 ปลายทาง · S5 แก้ไข (ทางที่ 2) · S6 ลบ PO · S7 จุดเข้า "รถ → หน้างาน Overhaul"
   พอร์ตพฤติกรรมจาก design-mock/overhaul-v2-05-po-detail.html (ข้อความ/เงื่อนไขตามตัวอักษร)
   Figma (Component) VMS Plus: `Page header` (Back action · Actions = `Secondary danger button` + `Secondary button`) · `Breadcrumbs` ·
     `Section label` (หน้ารายละเอียด — จำนวนต่อท้าย "(n)" ตาม wireframe "รายการรถ (จำนวน xx)") ·
     `Content item row` + `_Content item base` Type=Text with label (KeyValueGrid) · `_File upload item base` อ่านอย่างเดียว ·
     `Table` ทั้งก้อน (Lead text · Text · Badge = `Pill outline` สถานะงาน · ปุ่ม `Secondary button` sm "หน้างาน") ·
     `Empty state/Search not found` · `Modal` Type=Destructive centered image with input (มือถือ = Bottom sheet) · `Notification`
   UI Release#2: "5.1 Rental Contract Management" เฟรม `Rental contract info` (รายละเอียด + เอกสาร) · `Contract vehicle list` (ตารางรถ + Pill สถานะ) */
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Button, ConfirmDialog, DataTable, EmptyState, FileUpload, JobStatusBadge, KeyValueGrid, PageHeader, SectionLabel, useToast, type Column,
} from "@/components/ui";
import { OH2_VENDORS, findCar, fmtNum, useMockStore, type Vehicle } from "@/lib/mock";
import { routes } from "@/lib/routes";
import { useSavedToast } from "./useSavedToast";

const SAVED: Record<string, string> = { poedit: "บันทึกการแก้ไข PO สำเร็จ" };

export function PoDetail() {
  const sp = useSearchParams();
  const planId = sp.get("plan") ?? "";
  const poId = sp.get("po") ?? "";
  const store = useMockStore();
  const toast = useToast();
  const router = useRouter();
  const plan = store.getPlan(planId);
  const po = store.getPo(planId, poId);
  const [confirm, setConfirm] = useState(false);
  /* ลบ PO แล้วกำลังกลับหน้าแผน — ไม่ต้องแสดง "ไม่พบ" ระหว่างรอเปลี่ยนหน้า */
  const [leaving, setLeaving] = useState(false);
  const planUrl = plan ? routes.planView(plan.id) : routes.plans();

  useSavedToast(sp.get("saved"), SAVED, "บันทึกสำเร็จ", routes.poView(planId, poId));
  useEffect(() => {
    if (po) document.title = `${po.id} | Maintain-D (Mock)`;
  }, [po]);

  if (leaving) return null;

  const crumbs = (cur: string) => [
    { label: "จัดการงาน Overhaul", href: routes.plans() },
    { label: plan ? `แผน ${plan.id}` : "แผน", href: planUrl },
    { label: cur },
  ];

  if (!plan || !po) {
    return (
      <>
        <PageHeader title="ไม่พบ Purchase Order" crumbs={crumbs("Purchase Order")} backHref={planUrl} />
        <EmptyState
          kind="notFound"
          title="ไม่พบ Purchase Order นี้"
          description="PO อาจถูกลบไปแล้ว"
          action={<Button variant="secondary" size="sm" href={routes.plans()}>กลับหน้ารายการแผน</Button>}
        />
      </>
    );
  }

  const vendor = OH2_VENDORS[po.vendor];
  const cars = po.cars.map(findCar).filter((c): c is Vehicle => !!c);

  const columns: Column<Vehicle>[] = [
    { key: "plate", header: "ทะเบียน", lead: true, cell: (c) => c.plate },
    { key: "brand", header: "ยี่ห้อ/รุ่น · ประเภท", cell: (c) => `${c.brand} · ${c.type}` },
    { key: "mileage", header: "เลขไมล์ (กม.)", numeric: true, cell: (c) => fmtNum(c.mileage) },
    { key: "age", header: "อายุการใช้งาน", numeric: true, cell: (c) => `${c.age} ปี` },
    { key: "stage", header: "สถานะงาน", cell: (c) => <JobStatusBadge stage={store.getJob(plan.id, c.id).stage} /> },
    {
      key: "job",
      header: <span className="sr-only">หน้างาน</span>,
      mobileLabel: "",
      width: "w-[120px]",
      cell: (c) => (
        <Button variant="secondary" size="sm" href={routes.job(plan.id, c.id, po.id)} aria-label={`หน้างาน ${c.plate}`}>
          หน้างาน
        </Button>
      ),
    },
  ];

  const confirmDelete = () => {
    const r = store.deletePo(plan.id, po.id);
    setConfirm(false);
    if (!r.ok) return toast.error(r.error);
    setLeaving(true);
    router.push(routes.planView(plan.id, "podel"));
  };

  return (
    <>
      <PageHeader
        title={`หมายเลข ${po.id}`}
        crumbs={crumbs(po.id)}
        backHref={planUrl}
        actions={
          <>
            <Button variant="secondaryDanger" iconLeft="delete" onClick={() => setConfirm(true)}>ลบ PO</Button>
            <Button variant="secondary" iconLeft="edit" href={routes.poEdit(plan.id, po.id, "po")}>แก้ไข</Button>
          </>
        }
      />

      <div className="flex flex-col gap-8">
        <section aria-labelledby="sec-info">
          <SectionLabel id="sec-info" title="รายละเอียด Purchase Order" />
          <KeyValueGrid
            items={[
              { label: "ชื่อแผน", value: plan.name, wide: true },
              { label: "ชื่อ Purchase Order", value: po.name },
              { label: "ศูนย์บริการ/อู่", value: vendor?.name ?? "—" },
              { label: "เบอร์โทรอู่", value: vendor?.tel ?? "—" },
              { label: "ที่อยู่", value: vendor?.addr ?? "—" },
            ]}
          />
        </section>

        <section aria-labelledby="sec-docs">
          <SectionLabel id="sec-docs" title="เอกสาร" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FileUpload readOnly label="ใบสั่งจ้าง" files={po.docs.order} />
            <FileUpload readOnly label="อื่นๆ" files={po.docs.other} />
          </div>
        </section>

        <section aria-labelledby="sec-cars">
          <SectionLabel id="sec-cars" title="รายการรถ" count={cars.length} />
          <DataTable caption="รายการรถใน Purchase Order" columns={columns} rows={cars} rowKey={(c) => c.id} pagination={false} />
        </section>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={confirmDelete}
        danger
        title="ยืนยันการลบ PO"
        description={`PO ${po.id} "${po.name}" และงานของรถ ${po.cars.length} คันใน PO นี้จะถูกลบ`}
      />
    </>
  );
}
