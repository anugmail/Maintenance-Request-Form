# overhaul-next — ต้นแบบ Next.js "จัดการงาน Overhaul" (userflow v2 · 14 scenario)

ฐานของต้นแบบ Next.js ที่ทำหน้าจอตาม userflow "จัดการงาน Overhaul" (เจ้าของงานเคาะ 16 ต.ค. 2569)
ทุก element ต้องชี้กลับไปที่ component จริงของไลบรารี **(Component) VMS Plus** ได้ — ค่ายกมาจาก
`design-system/tokens.css` + `design-system/components.css` + `design-system/.figma-extract/component/` และกติการายจุด
[`figma-export/component-rules.md`](../figma-export/component-rules.md) (R1–R14) · ต้นแบบ HTML คู่กันอยู่ที่ `design-mock/overhaul-v2-0*.html`

> ข้อมูลทั้งหมดเป็นข้อมูลจำลอง เก็บใน `localStorage` คีย์ `oh2-next-v1` (คนละคีย์กับ HTML mock `oh2-mock-v3`)

## รัน / build

```bash
cd overhaul-next
npm install
npm run dev          # http://localhost:3010  (เปิด /kit/ เพื่อดูชุดคอมโพเนนต์)
npx tsc --noEmit     # ตรวจชนิด

# ส่งออก static (GitHub Pages) — ได้โฟลเดอร์ out/
NEXT_PUBLIC_BASE_PATH=/Maintenance-Request-Form/overhaul-v2-app npm run build
# ไม่มี basePath (ทดสอบ local)
npm run build
```

ทดสอบ export ที่มี basePath: ก๊อป `out/` ไปไว้ที่ `<tmp>/Maintenance-Request-Form/overhaul-v2-app/` แล้ว
`python3 -m http.server 8130 --bind 127.0.0.1` จาก `<tmp>` → http://127.0.0.1:8130/Maintenance-Request-Form/overhaul-v2-app/kit/

Stack (ตรึงเวอร์ชันเท่า `app/`): next 16.3.6 · react 19.3.0 · tailwindcss 4.3.3 · TypeScript · App Router · `src/`
ไม่มีไลบรารี UI อื่น (ไม่มี DaisyUI/shadcn/headless) — component เขียนเองด้วย Tailwind utility

## โครงไฟล์

| ที่ | อะไร |
|---|---|
| `src/styles/tokens.css` | ก๊อปจาก `design-system/tokens.css` (19 ต.ค. 2569) — ห้ามแก้มือ แก้ที่ต้นทางแล้วก๊อปทับ |
| `src/app/globals.css` | Tailwind 4 `@theme inline` — สี/ขนาดตัวอักษร/รัศมี/เงา ชี้ CSS var ของ tokens · ล้างค่าตั้งต้นของ Tailwind ทิ้ง (ใช้ได้แต่ token) |
| `src/components/ui/` | คอมโพเนนต์ทั้งหมด (`import { … } from "@/components/ui"`) |
| `src/components/shell/` | `AppShell` (Sidebar + Header navigation + เนื้อหา) · `PageStub` (หน้าชั่วคราว) |
| `src/lib/mock/` | ข้อมูลจำลอง + store (`import { … } from "@/lib/mock"`) |
| `src/lib/routes.ts` | ตัวสร้างลิงก์ทุกหน้า |
| `src/lib/basePath.ts` | `asset(path)` สำหรับ URL ดิบที่ไม่ผ่าน next/link |
| `src/app/kit/` | แกลเลอรีคอมโพเนนต์ทุก state (ให้เจ้าของงานเทียบกับ Figma) |

## Route ↔ scenario

static export ไม่มี dynamic segment ⇒ ใช้ query อ่านด้วย `useSearchParams()` **ภายใน `<Suspense>`** (ดูตัวอย่างใน `src/app/plans/edit/page.tsx`)

| route | helper (`routes.*`) | scenario | HTML ต้นทาง |
|---|---|---|---|
| `/` | — (เด้งไป `/plans/`) | — | — |
| `/plans/` (`?saved=create\|edit\|delete`) | `plans(saved?)` / `home()` | S1–S3 จุดเข้า · รายการแผน | `overhaul-v2-01-plans.html` |
| `/plans/new/` | `planNew()` | S1 สร้างแผน | `overhaul-v2-02-plan-form.html` |
| `/plans/edit/?id=` | `planEdit(id)` | S2 แก้ไขแผน | `overhaul-v2-02-plan-form.html?id=` |
| `/plans/view/?id=` | `planView(id, saved?)` | รายละเอียดแผน · S3 ลบ · S4 จุดเข้า | `overhaul-v2-03-plan-detail.html` |
| `/po/new/?plan=` | `poNew(planId)` | S4 เพิ่ม PO | `overhaul-v2-04-po-form.html?plan=` |
| `/po/edit/?plan=&po=&from=plan\|po` | `poEdit(planId, poId, from?)` | S5 แก้ไข PO | `overhaul-v2-04-po-form.html?plan=&po=` |
| `/po/view/?plan=&po=` | `poView(planId, poId, saved?)` | รายละเอียด PO · S6 ลบ PO | `overhaul-v2-05-po-detail.html` |
| `/job/?plan=&car=&po=` | `job(planId, carId, poId?)` | S7–S14 งานรายคัน 6 ขั้น | `overhaul-v2-06-job.html` |
| `/kit/` | `kit()` | แกลเลอรีคอมโพเนนต์ | — |

ลิงก์ทุกอันใช้ `next/link` / `router.push` กับค่าจาก `routes.*` เท่านั้น (เติม basePath ให้เอง) · ห้ามเขียน `<a href="/…">` ตรง

## คอมโพเนนต์ (`src/components/ui`) ↔ component ในไลบรารี

| component | Figma (Component) VMS Plus | ค่าเทียบ components.css |
|---|---|---|
| `Icon` | ไอคอน Material Symbols ในทุก component | `.ms` |
| `Button` (primary · secondary · tertiary · tertiaryBrand · tertiaryDanger · danger · secondaryDanger × sm/md/lg) | Primary / Secondary / Tertiary / Tertiary brand / Tertiary danger / Primary danger / Secondary danger button | `.btn .btn-p .btn-s .btn-t .btn-tb .btn-td .btn-d .btn-ds .btn-icon .is-loading` |
| `Badge` · `PlanStatusBadge` · `JobStatusBadge` | Pill outline · Badge outline (square) | `.badge .b-* .badge.sq` |
| `Breadcrumbs` | Breadcrumbs (_Breadcrumbs item / Home · Separator · Link) | `.crumbs` |
| `PageHeader` | Page header (Divider=false) | `.page-title-row .page-title` |
| `SectionHeader` | Section header (Divider=false) — **เฉพาะหน้าสร้าง/แก้ไข** | `.sect` (ไม่มีเส้น) |
| `SectionLabel` | Section label (Info icon/More actions = false · จำนวน "(n)") — **เฉพาะหน้ารายละเอียด** | — (อ่านจาก .figma-extract 2011-6955) |
| `KeyValueGrid` | Content item row + _Content item base (Type=Text with label) | `.incident-summary .incident-field` |
| `TextField` · `DateField` · `TimeField` · `DateTimeField` · `DateRangeField` | Text input + Input label (Info icon=false) | `.f .in .help .f.err .f.ro .f.ro.dash` |
| `SelectField` | Input dropdown | `.f .in select` |
| `Combobox` | Input dropdown (Leading icon=search) + Dropdown list + Dropdown list item | `.combo .combo-list .combo-opt` |
| `TextArea` | Text area | `.f textarea` |
| `Checkbox` · `CheckboxList` | Checkbox · Checkbox with badge | `.chks .cbox .filter-checks` |
| `SearchInput` | Text input (ช่องค้นหาของ Table header) | `.search .lt-search` |
| `FileUpload` · `FileErrorItem` | File upload = _File upload base + _File upload item base (Completed/Error) · Featured icon sm | `.fu .fu-item .fu-item.err .ficon.sm.gray` |
| `DataTable` | **Table ทั้ง component** (Table header cell · Sort icon · Table cell Lead text/Text/Badge/Action icons · Alternating fills · Table pagination) · มือถือ Mobile table + Mobile table item | `.tblwrap .tbl .striped th.sortable .cell-key .num .dt-action` |
| `Pagination` | Table pagination (Items per page dropdown + Button groups pagination item) | (`.tblfoot .pager` — ยึดไลบรารี: ปุ่มติดกันในกรอบ r8) |
| `RowMenu` | Dropdown menu + _Dropdown menu item (Type=Shortcut) · มือถือ Bottom sheet | `.dd .dd-menu .dd-item .dd-sep` |
| `Modal` · `ConfirmDialog` · `BottomSheet` · `FeaturedIcon` | Modal Type=Form / Destructive centered image with input / Centered image · Modal header/footer · Bottom sheet (header + footer) · Featured icon | `.modal-overlay .modal .modal-hd(.center) .modal-ft-a(.fill) .ficon` |
| `ToastProvider` · `useToast` · `Notification` | Notification Type=Success/Error | `.notif` |
| `Stepper` · `stepStates()` | **Progress steps ทั้ง component** (กรอบ + Horizontal step item + Connector) · Mobile progress steps | `.wsteps .wstep .wsteps-m` |
| `DualList` | List with checkbox + List header item + List with checkbox item | `.dual .lchk` |
| `EmptyState` | Empty state/Data empty · Empty state/Search not found | `.filter-empty` |
| `FilterPanel` · `FilterSection` · `FilterChips` | Side panel (header + footer) · Bottom sheet Type=Filter · Badge outline with remove icon | `.filter-drawer .fchips .fchip` |
| `FooterActions` · `FormGrid` · `FormCell` · `WbsRow` | แถว Actions ท้ายหน้า · frame จัดวางฟอร์ม | `.actions .fgrid` |
| `DraftBanner` | — (ของต้นแบบ ไม่มีในไลบรารี) | `.draft` |
| `AppShell` (shell) | Sidebar navigation (Collapsed) + Nav button · Header navigation (Tablet ≥ 768 / Mobile < 768) | `.shell .side.wide .nv .content` |

## API ย่อ (ดูชนิดเต็มในไฟล์)

```tsx
<Button variant="primary|secondary|tertiary|tertiaryBrand|tertiaryDanger|danger|secondaryDanger" size="sm|md|lg"
        iconLeft="add" iconRight="chevron_right" iconOnly="more_horiz" aria-label="…" loading disabled href={routes.planNew()} block />
<Badge tone="neutral|low|out|info|brand|ok" square dot>…</Badge>   <PlanStatusBadge status="P2" />   <JobStatusBadge stage="V5" />
<PageHeader title crumbs={[{label, href?}]} backHref | onBack badge subtitle actions={<>…</>} />
<SectionHeader title count subtitle right id />      // หน้าสร้าง/แก้ไข
<SectionLabel  title count subtitle right id />      // หน้ารายละเอียด (count → "(n)")
<KeyValueGrid items={[{label, value, wide?}]} columns={4} />
<TextField label optional error helper icon prefix suffix readOnly autoFilled disabled inputMode … />
<SelectField label options={[{value,label}]} placeholder="ทั้งหมด" error readOnly … />
<Combobox label options={[{value,label,sub?}]} value onChange placeholder error emptyText />
<DateField value onChange minToday />  <TimeField />  <DateTimeField />  <DateRangeField value={{from,to}} onChange minToday fromLabel toLabel fromError toError />
<TextArea label optional error rows />
<Checkbox checked onChange label indeterminate disabled />   <CheckboxList options={[{value,label,text?}]} value onChange direction="column|row" />
<SearchInput value onChange placeholder aria-label className="w-full max-w-[415px]" />
<FileUpload label optional files onChange error readOnly maxFiles={10} accept onPreview onDownload />
<DataTable columns={[{key, header, cell, sortable?, sortValue?, numeric?, lead?, width?, mobileLabel?, hideOnMobile?}]}
           rows rowKey striped sort|onSortChange|defaultSort rowMenu={(r)=>RowMenuItem[]} rowMenuLabel empty={<EmptyState/>}
           pagination={{pageSize:10}} | false  forceCards caption />
<Pagination page pageSize total onPageChange onPageSizeChange pageSizes />
<RowMenu label items={[{label, icon, href|onSelect, disabled}, "divider"]} forceSheet />
<Modal open onClose variant="form|centered" size="md|lg|xl" title description icon iconTone
       cancelLabel onCancel hideCancel confirmLabel onConfirm confirmVariant="primary|danger" confirmLoading confirmDisabled footer headerAction mode="auto|sheet|dialog">…</Modal>
<ConfirmDialog open onClose onConfirm title description danger confirmLabel cancelLabel loading />
<BottomSheet open onClose title headerAction footer flush>…</BottomSheet>
const toast = useToast(); toast.success("การสร้างแผน overhaul สำเร็จ"); toast.error("general error");
<Stepper steps={stepStates(OH2_STEPS, progressIndex, complete?)} selected={i} onStepClick={(i)=>…} variant="auto|desktop|mobile" />
   // หรือ steps={[{label, state:"done|current|upcoming|locked", supporting?}]}
<DualList items={[{id,label,details?}]} value onChange leftTitle rightTitle searchPlaceholder error />
<EmptyState kind="empty|notFound" icon title description action />
<FilterPanel open onClose onApply onClear title description mode>…<FilterSection label>…</FilterSection></FilterPanel>
<FilterChips chips={[{key,label}]} onRemove />
<FooterActions left={<Button variant="secondary" size="lg">ยกเลิก</Button>} right={<Button size="lg">บันทึก</Button>} />
<FormGrid><FormCell span="wide|narrow|half|sixth|full">…</FormCell><WbsRow money wbs network activity /></FormGrid>
```

## Store (`src/lib/mock`)

`MockStoreProvider` ห่อทั้งแอปแล้ว (ใน `src/app/providers.tsx`) · เนื้อหาหน้าอยู่ใต้ `<StoreGate>` ใน AppShell
⇒ ตอน prerender/ก่อนอ่าน localStorage จะเห็นโครงหน้าเทาจาง แล้วค่อยแสดงหน้าจริง (hydration-safe)

```ts
const store = useMockStore();
store.ready; store.state.plans; store.state.jobs;          // jobs คีย์ `${planId}:${carId}`
store.getPlan(id); store.getPo(planId, poId);
store.planStatus(plan) /* P1|P2|P3 */; store.planCars(plan) /* id รถไม่ซ้ำ */;
store.getJob(planId, carId)   // งานรายคันที่เติมรายละเอียดตามขั้นแล้ว (oh2Job) — appt/checkin/logs/safety/ret/parts/closedAt
// เขียน — คืน SaveResult: { ok: true, value } | { ok: false, error: "general error" }
store.createPlan({ name, year, budget, wbs, net, act, docs })           // ออกเลขแผน + วันที่สร้างให้
store.updatePlan(id, patch);  store.deletePlan(id)                      // ลบแผน + PO + งานรายคันของแผน
store.createPo(planId, { name, vendor, cars, docs })                    // ออกเลข PO-xxxxxx + เปิดงาน V1 ให้รถที่เลือก
store.updatePo(planId, poId, patch);  store.deletePo(planId, poId)      // ลบงานของรถที่ไม่อยู่ใน PO อื่นแล้ว
store.updateJob(planId, carId, patch)                                   // patch ทับงานที่เติมแล้ว เช่น { stage: "V2", appt }
store.resetAll()                                                        // คืน seed
store.simulateFailure; store.setSimulateFailure(on)                     // "จำลองบันทึกไม่สำเร็จ" ในแถบ Prototype
```

แบบแผนการบันทึกในหน้า:

```ts
const r = store.createPlan(input);
if (!r.ok) return toast.error(r.error);          // "general error" เมื่อเปิดจำลองไม่สำเร็จ
router.push(routes.plans("create"));             // หน้ารายการอ่าน ?saved= แล้ว toast.success("การสร้างแผน overhaul สำเร็จ")
```

ข้อมูลคงที่/ตัวช่วย (พอร์ตครบจาก `design-mock/overhaul-v2-mock.js`): `OH2_VEHICLES` `OH2_VENDORS` `OH2_STAFF` `OH2_JOB` `OH2_PLAN`
`OH2_STEPS` `OH2_STEP_OF` `OH2_CHECKLIST` `OH2_MAX_FILES` `OH2_FILE_ACCEPT` `OH2_BUDGET_RANGES` · `seedState()` `planStatus()` `planCars()` `posOfCar()`
`nextPlanId()` `nextPoId()` `ensureJobs()` `fillJob()` `stepOf()` `findPlan()` `findPo()` `findCar()` `findStaff()` `vendorOf()` ·
รูปแบบ: `fmtMoney` `fmtNum` `fmtDate` (พ.ศ. dd/mm/yyyy) `fmtDateTime` `fmtDateRange` `fmtSize` `todayIso` `addDays` `budgetYears` `parseMoney`

## กติกาที่ต้องทำตาม (ทุกหน้า)

1. **ทุก element ต้องเป็น component ในตารางบน** — ไม่มีของที่ต้องการ = หยุดถามเจ้าของงาน ห้ามออกแบบเอง (CLAUDE.md)
2. **ไฟล์ component ใหม่ต้องขึ้นต้นด้วยคอมเมนต์** บอกชื่อ component ใน Figma + คลาส components.css ที่ค่าเทียบ
3. **ห้าม hex/rgb** — ใช้ utility ที่ชี้ token (`bg-brand-900` `text-gray-600` …) · `#fff`/`#000` ได้ (white/black) ·
   ห้าม `style=` ยกเว้นค่าไดนามิกจริง (ตำแหน่งเมนู · เปอร์เซ็นต์วงแหวน) · arbitrary value ได้เมื่อเป็นค่าเดียวกับ components.css (`max-w-[720px]`)
4. **ไม่มีเส้นคั่นที่มองเห็น** ใต้ Page header / Section header / หัว-ท้าย modal (R2 R3 R13)
5. **หัวข้อ section**: หน้าสร้าง/แก้ไข = `SectionHeader` · หน้ารายละเอียด = `SectionLabel` + `KeyValueGrid` (R5 R11 R12)
6. **ช่องกรอกไม่มี Info icon** · ช่องบังคับไม่มี * · ช่องไม่บังคับใส่ `optional` → "(ถ้ามี)" (R4 R6 R7)
7. **ตาราง = `DataTable` ทั้งก้อน** · ขั้นตอน = `Stepper` ทั้งก้อน (R8–R10)
8. **มือถือ (< 768 = ต่ำกว่า `md`)**: ตาราง → การ์ด (อัตโนมัติ) · modal/เมนู/ตัวกรอง → bottom sheet มุมบน 24 (อัตโนมัติ) ·
   ปุ่มหัวหน้าลงใต้ชื่อ (อัตโนมัติ) · ช่องกรอกเรียงลง · ปุ่มท้ายแบ่งเท่ากัน · ออกแบบที่ 402×874
9. **ปุ่มท้ายหน้า (desktop)**: ยกเลิก/ย้อนกลับ **ซ้าย** · ยืนยัน **ขวา** · ปุ่มเดียว **ขวา** → ใช้ `FooterActions` · ขนาด `lg`
10. **กล่องอัปโหลด 1 คอลัมน์** · หน้ารายละเอียดใช้ `FileUpload readOnly` (ไม่มีกล่อง มีแต่รายการ)
11. **แถววงเงิน + WBS (plan.md F10)**: `<FormGrid><WbsRow money wbs network activity /></FormGrid>` —
    จอ ≥ 1280: วงเงินครึ่งซ้าย · เลข WBS · เลขโครงข่าย · เลขกิจกรรม แบ่งครึ่งขวา · 768–1279: วงเงินเต็มแถวแล้ว 3 ช่องใต้ · < 768: คอลัมน์เดียว
12. **ตัวเลือกรถ (DualList)** — เจ้าของงานจะออกแบบใหม่ ใช้ตามที่มี ไม่ต้องขัดเกลาเพิ่ม
13. ข้อความแจ้งผลใช้ตามตัวอักษรของ userflow (เช่น "การสร้างแผน overhaul สำเร็จ" · "general error")

## ยังไม่ได้ map / ต่างจากไลบรารี (รอเคาะ)

- **Progress steps มีได้ 5 ขั้น** แต่งานรายคันมี 6 ขั้น (R10 รอเคาะ) — `Stepper` วาด 6 ขั้นในกรอบเดียวกัน
- **Table สูงสุด 8 คอลัมน์** — ตารางแผนมี 8 + เมนู "…" (รอเคาะ)
- `Input label` ไลบรารี = 16/SemiBold gray-600 ห่าง 8 แต่ components.css/HTML mock = 14/500 gray-700 ห่าง 6 → ยึด components.css
- `Table pagination` ไลบรารีเป็นปุ่มติดกันในกรอบ r8 (ใช้ตามไลบรารี) ส่วน components.css `.pager` เป็นปุ่มแยก
- `Mobile table` ยึดค่าไลบรารี (หัว 14/600 ดำ · ค่า 14 ชิดขวา) ส่วน components.css `.tbl-card` อิงภาพหน้าจอ
- `Date picker` (Single/Dual) ของไลบรารียังไม่ได้ทำ — ใช้ตัวเลือกวันที่ของ browser เหมือน HTML mock
- `Header navigation`: ใช้ข้อความชื่อผู้ใช้ + ไอคอนแทน `Avatar` (ตาม HTML mock) · ช่องค้นหาในตัว (Mobile) ไม่ได้ใส่
- รัศมี 24 ของ Bottom sheet ไม่มีใน tokens.css — ตั้งเป็น `--radius-sheet` ใน theme
- Overlay ของ Modal ใช้ดำ 60% (ไลบรารีไม่เก็บค่า opacity) · แผงตัวกรองดำ 40%
