"use client";
/* S4 เพิ่ม Purchase Order (/po/new/?plan=) · S5 แก้ไข Purchase Order (/po/edit/?plan=&po=&from=plan|po)
   พอร์ตพฤติกรรมจาก design-mock/overhaul-v2-04-po-form.html (ข้อความ/เงื่อนไขตามตัวอักษร):
   · ชื่อ PO freetext · ศูนย์บริการ/อู่ search select · เลือกรถ (dual list ค้นทะเบียน/รุ่น) · ใบสั่งจ้าง (บังคับ) + อื่นๆ (ถ้ามี)
   · ช่องจำเป็น: ชื่อ PO · อู่ · รถ ≥ 1 คัน · ใบสั่งจ้าง ≥ 1 ไฟล์ — ผิดแล้วเลื่อนไปช่องแรกที่ผิด
   · ย้อนกลับ/ยกเลิก: มีการแก้ไข → ยืนยันการออก · แก้ไข: บันทึกเมื่อมีการเปลี่ยนเท่านั้นจึงถาม "ยืนยันการแก้ไข PO" (ไม่เปลี่ยน = กลับเลย)
   · "มาจาก 2 ทาง": from=po → กลับหน้ารายละเอียด PO · อื่นๆ → กลับหน้ารายละเอียดแผน (ทั้งตอนบันทึกและยกเลิก)
   · จำลองบันทึกไม่สำเร็จ → "general error"
   Figma (Component) VMS Plus: `Page header` (Back action) · `Breadcrumbs` · `Section header` Divider=false (หน้าสร้าง/แก้ไข) ·
     `Text input` + `Input label` (Info icon ปิด) · `Input dropdown` Leading icon=search + `Dropdown list` + `Dropdown list item` (Combobox) ·
     `List with checkbox` × 2 + `List header item` + `List with checkbox item` (DualList — เจ้าของงานจะออกแบบใหม่ ใช้ตามที่มี) ·
     `File upload` Type=Default 1 คอลัมน์ · `Secondary button` lg (ยกเลิก ซ้าย) + `Primary button` lg (บันทึก ขวา) ·
     `Modal` Type=Centered image (ยืนยันการออก / ยืนยันการแก้ไข — มือถือ = Bottom sheet) · `Notification`
   UI Release#2: "5.1 Rental Contract Management" เฟรม `Create rental contract` (โครงฟอร์ม) · `Contract vehicle list` ·
     "5.4" `Modal / Create appointment` (search select) */
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  Button, Combobox, ConfirmDialog, DualList, EmptyState, FileUpload, FooterActions, FormCell, FormGrid, PageHeader, SectionHeader, TextField, useToast,
} from "@/components/ui";
import { OH2_VEHICLES, OH2_VENDORS, fmtNum, useMockStore, type FileRef, type PoDocs } from "@/lib/mock";
import { routes } from "@/lib/routes";

type Field = "name" | "vendor" | "cars" | "order";
type Errors = Partial<Record<Field, string>>;

const VENDOR_OPTIONS = OH2_VENDORS.map((v, i) => ({ value: String(i), label: v.name, sub: `${v.tel} · ${v.addr}` }));
const CAR_ITEMS = OH2_VEHICLES.map((v) => ({
  id: v.id,
  label: v.plate,
  details: [`${v.brand} · ${v.type}`, `เลขไมล์ ${fmtNum(v.mileage)} กม.`, `อายุ ${v.age} ปี`],
}));
/** รถเรียงตามลำดับรายการรถ (เท่า HTML: OH2_VEHICLES.map(id).filter(sel)) */
const carOrder = (ids: string[]) => OH2_VEHICLES.map((v) => v.id).filter((id) => ids.includes(id));

export function PoForm({ mode }: { mode: "new" | "edit" }) {
  const sp = useSearchParams();
  const store = useMockStore();
  const toast = useToast();
  const router = useRouter();

  const plan = store.getPlan(sp.get("plan"));
  /* หน้าแก้ไขเท่านั้นที่อ่าน ?po= (HTML ใช้ไฟล์เดียว: มี po = แก้ไข) */
  const po = mode === "edit" && plan ? store.getPo(plan.id, sp.get("po")) : undefined;
  const from = sp.get("from");
  const backTo = !plan ? routes.plans() : from === "po" && po ? routes.poView(plan.id, po.id) : routes.planView(plan.id);
  const backSaved = (flag: string) => (from === "po" && plan && po ? routes.poView(plan.id, po.id, flag) : plan ? routes.planView(plan.id, flag) : routes.plans());

  /* ค่าเริ่มต้นจับครั้งเดียวตอนเปิดหน้า (store อาจเปลี่ยนหลังบันทึก — ไม่ให้ฟอร์มรีเซ็ตตาม) */
  const [init] = useState(() => ({
    name: po?.name ?? "",
    vendor: po ? String(po.vendor) : "",
    cars: po ? carOrder(po.cars) : [],
    docs: (po ? structuredClone(po.docs) : { order: [], other: [] }) as PoDocs,
  }));
  const [name, setName] = useState(init.name);
  const [vendor, setVendor] = useState(init.vendor);
  const [cars, setCars] = useState<string[]>(init.cars);
  const [docs, setDocs] = useState<PoDocs>(init.docs);
  const [errors, setErrors] = useState<Errors>({});
  const [modal, setModal] = useState<"leave" | "edit" | null>(null);
  const [leaving, setLeaving] = useState(false);

  const snap = (n: string, v: string, c: string[], d: PoDocs) => JSON.stringify([n.trim(), v, [...c].sort(), d]);
  const start = useMemo(() => snap(init.name, init.vendor, init.cars, init.docs), [init]);
  const dirty = snap(name, vendor, cars, docs) !== start;

  /* ไม่พบแผน — แจ้งแบบ HTML (ฟอร์มยังแสดง แต่บันทึกไม่ได้) */
  const warned = useRef(false);
  useEffect(() => {
    if (mode === "new" && !plan && !warned.current) {
      warned.current = true;
      toast.error("ไม่พบแผน");
    }
  }, [mode, plan, toast]);

  const title = po ? `แก้ไข ${po.id}` : "เพิ่ม Purchase Order";
  useEffect(() => {
    document.title = `${title} | Maintain-D (Mock)`;
  }, [title]);

  const clearErr = (k: Field) => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  const go = (url: string) => {
    setLeaving(true);
    router.push(url);
  };

  const validate = () => {
    const e: Errors = {};
    if (!name.trim()) e.name = "กรุณาระบุชื่อ Purchase Order";
    if (vendor === "") e.vendor = "กรุณาเลือกศูนย์บริการ/อู่";
    if (!cars.length) e.cars = "กรุณาเลือกรถอย่างน้อย 1 คัน";
    if (!docs.order.length) e.order = "กรุณาแนบใบสั่งจ้าง";
    setErrors(e);
    const first = (["name", "vendor", "cars", "order"] as Field[]).find((k) => e[k]);
    if (first) document.getElementById("po-" + first)?.scrollIntoView({ block: "center", behavior: "smooth" });
    return !first;
  };

  const commit = () => {
    if (!plan) return false;
    const data = { name: name.trim(), vendor: Number(vendor), cars: carOrder(cars), docs };
    const r = po ? store.updatePo(plan.id, po.id, data) : store.createPo(plan.id, data);
    if (!r.ok) {
      toast.error(r.error);
      return false;
    }
    return true;
  };

  const onSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!plan || !validate()) return;
    if (po) {
      if (!dirty) return go(backTo);
      setModal("edit");
      return;
    }
    if (commit()) go(backSaved("po"));
  };

  const leave = () => (dirty ? setModal("leave") : go(backTo));

  if (leaving) return null;

  /* หน้าแก้ไขที่หา PO ไม่เจอ (ถูกลบไปแล้ว) — แสดงสถานะไม่พบแทนฟอร์มเปล่า (HTML ไฟล์เดียวจะกลายเป็นฟอร์มเพิ่ม PO) */
  if (mode === "edit" && !po) {
    return (
      <>
        <PageHeader
          title="ไม่พบ Purchase Order"
          crumbs={[
            { label: "จัดการงาน Overhaul", href: routes.plans() },
            { label: plan ? `แผน ${plan.id}` : "แผน", href: backTo },
            { label: "Purchase Order" },
          ]}
          backHref={backTo}
        />
        <EmptyState
          kind="notFound"
          title="ไม่พบ Purchase Order นี้"
          description="PO อาจถูกลบไปแล้ว"
          action={<Button variant="secondary" size="sm" href={routes.plans()}>กลับหน้ารายการแผน</Button>}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={title}
        crumbs={[
          { label: "จัดการงาน Overhaul", href: routes.plans() },
          { label: plan ? `แผน ${plan.id}` : "แผน", href: plan ? routes.planView(plan.id) : routes.plans() },
          { label: title },
        ]}
        onBack={leave}
      />

      <form className="flex flex-col gap-8" noValidate onSubmit={onSubmit}>
        <section aria-labelledby="sec-po-info">
          <SectionHeader id="sec-po-info" title="รายละเอียด Purchase Order" />
          <FormGrid>
            <FormCell span="half">
              <TextField
                id="po-name"
                label="ชื่อ Purchase Order"
                placeholder="เช่น ซ่อมระบบแอร์"
                value={name}
                error={errors.name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearErr("name");
                }}
              />
            </FormCell>
            <FormCell span="half">
              <Combobox
                id="po-vendor"
                label="ศูนย์บริการ/อู่"
                placeholder="ค้นหาชื่อศูนย์บริการ/อู่"
                options={VENDOR_OPTIONS}
                value={vendor}
                error={errors.vendor}
                onChange={(v) => {
                  setVendor(v);
                  clearErr("vendor");
                }}
              />
            </FormCell>
          </FormGrid>
        </section>

        <section aria-labelledby="sec-po-cars" id="po-cars">
          <SectionHeader id="sec-po-cars" title="เลือกรถ" />
          <DualList
            items={CAR_ITEMS}
            value={cars}
            error={errors.cars}
            onChange={(ids) => {
              setCars(ids);
              if (ids.length) clearErr("cars");
            }}
          />
        </section>

        <section aria-labelledby="sec-po-docs">
          <SectionHeader id="sec-po-docs" title="เอกสาร" />
          {/* กล่องอัปโหลด 1 คอลัมน์ (เจ้าของงานเคาะ 19 ต.ค. 2569) */}
          <div className="flex flex-col gap-6">
            <div id="po-order">
              <FileUpload
                label="ใบสั่งจ้าง"
                files={docs.order}
                error={errors.order}
                onChange={(f: FileRef[]) => {
                  setDocs((d) => ({ ...d, order: f }));
                  clearErr("order");
                }}
              />
            </div>
            <FileUpload label="อื่นๆ" optional files={docs.other} onChange={(f: FileRef[]) => setDocs((d) => ({ ...d, other: f }))} />
          </div>
        </section>

        <FooterActions
          left={po ? <Button variant="secondary" size="lg" onClick={leave}>ยกเลิก</Button> : undefined}
          right={<Button type="submit" size="lg">บันทึก</Button>}
        />
      </form>

      <ConfirmDialog
        open={modal === "leave"}
        onClose={() => setModal(null)}
        onConfirm={() => {
          setModal(null);
          go(backTo);
        }}
        title="ยืนยันการออก"
        description="ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก"
        cancelLabel="ปิด"
      />
      <ConfirmDialog
        open={modal === "edit"}
        onClose={() => setModal(null)}
        onConfirm={() => {
          setModal(null);
          if (commit()) go(backSaved("poedit"));
        }}
        title="ยืนยันการแก้ไข PO"
        description={po ? `บันทึกการเปลี่ยนแปลงของ ${po.id} "${name.trim()}"` : undefined}
      />
    </>
  );
}
