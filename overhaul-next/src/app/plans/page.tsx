"use client";
/* S1–S3 รายการแผน "จัดการงาน Overhaul" (url จริง /overhaul-utility-vehicle) — HTML ต้นทาง design-mock/overhaul-v2-01-plans.html
   Figma (Component): Page header + Breadcrumbs · Primary/Secondary button · Text input (ช่องค้นหาของ Table header) ·
     Table ทั้ง component (Table header cell + Sort icon · Table cell Lead text/Text/Badge/Action icons · Alternating fills · Table pagination) ·
     Pill outline · Dropdown menu (เมนู "…") · Side panel / Bottom sheet Type=Filter · Badge outline with remove icon ·
     Modal Type=Destructive centered · Notification · Empty state/Data empty · Empty state/Search not found
   UI Release#2: หน้า 5.1 Rental Contract Management — `Contract list` · `- Empty` · `Search not found` · `Filter Side panel` · `Create contract - Success`
   1 แถว = 1 แผน · สถานะแผน P1–P3 · มุม กบค. (ดู + แก้ไข) */
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  Button, ConfirmDialog, DataTable, EmptyState, FilterChips, PageHeader, PlanStatusBadge, SearchInput, useToast,
  type Column, type SortState,
} from "@/components/ui";
import { EMPTY_PLAN_FILTER, PlanFilter, planFilterChips, removePlanFilterChip, type PlanFilterValue } from "@/components/plans/PlanFilter";
import { fmtDate, fmtMoney, PLAN_STATUSES, useMockStore, type Plan } from "@/lib/mock";
import { routes } from "@/lib/routes";

/** ข้อความแจ้งผลหลังกลับมาจากหน้าฟอร์ม/หน้ารายละเอียด (?saved=) — ตรงตัวอักษรกับ HTML */
const SAVED_TEXT: Record<string, string> = {
  create: "การสร้างแผน overhaul สำเร็จ",
  edit: "บันทึกการแก้ไขแผนสำเร็จ",
  delete: "ลบแผน overhaul สำเร็จ",
};

const SEARCH_ID = "plans-q";

function PlansList() {
  const store = useMockStore();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const plans = store.state.plans;

  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "id", dir: -1 });
  const [filter, setFilter] = useState<PlanFilterValue>(EMPTY_PLAN_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [delId, setDelId] = useState<string | null>(null);

  /* แจ้งผลจาก ?saved= แล้วล้าง query ทิ้ง (history.replaceState ของ HTML) — กันแจ้งซ้ำตอน effect รันสองรอบ */
  const savedDone = useRef<string | null>(null);
  const saved = params.get("saved");
  useEffect(() => {
    if (!saved || savedDone.current === saved) return;
    savedDone.current = saved;
    toast.success(SAVED_TEXT[saved] ?? "บันทึกสำเร็จ");
    router.replace(routes.plans());
  }, [saved, toast, router]);

  /* ศูนย์ต้นทุนในตัวกรอง = WBS ไม่ซ้ำของทุกแผน เรียงตามตัวอักษร */
  const wbsOptions = useMemo(() => [...new Set(plans.map((p) => p.wbs))].sort(), [plans]);

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return plans.filter((p) => {
      if (t && ![p.id, p.name, p.wbs].some((x) => String(x).toLowerCase().includes(t))) return false;
      if (filter.budget) {
        const [a, b] = filter.budget.split("-").map(Number);
        if (p.budget < a || (b && p.budget > b)) return false;
      }
      if (filter.status.length && !filter.status.includes(store.planStatus(p))) return false;
      if (filter.car && !store.planCars(p).includes(filter.car)) return false;
      if (filter.wbs && p.wbs !== filter.wbs) return false;
      return true;
    });
  }, [plans, q, filter, store]);

  /* คอลัมน์ที่ userflow ให้เรียงได้: เลขแผน · ชื่อแผน · ศูนย์ต้นทุน · สถานะ (เรียงตามข้อความแบบไทย เหมือน HTML) */
  const columns: Column<Plan>[] = [
    { key: "id", header: "เลขแผน", lead: true, sortable: true, cell: (p) => p.id },
    { key: "name", header: "ชื่อแผน", sortable: true, cell: (p) => p.name },
    { key: "wbs", header: "ศูนย์ต้นทุน", sortable: true, cell: (p) => p.wbs },
    { key: "budget", header: "งบประมาณ (บาท)", numeric: true, cell: (p) => fmtMoney(p.budget) },
    { key: "pos", header: "Purchase Order", numeric: true, cell: (p) => p.pos.length },
    { key: "cars", header: "จำนวนรถที่ Overhaul", numeric: true, cell: (p) => store.planCars(p).length },
    { key: "status", header: "สถานะ", sortable: true, sortValue: (p) => store.planStatus(p), cell: (p) => <PlanStatusBadge status={store.planStatus(p)} /> },
    { key: "created", header: "วันที่สร้าง", cell: (p) => fmtDate(p.created) },
  ];

  const none = !plans.length;
  const chips = planFilterChips(filter);
  const delPlan = delId ? store.getPlan(delId) : undefined;

  const clearAll = () => {
    setQ("");
    setFilter(EMPTY_PLAN_FILTER);
    document.getElementById(SEARCH_ID)?.focus();
  };

  /* S3 ลบแผน: เมนู "…" → modal ยืนยัน → ลบ + แจ้งผล */
  const confirmDelete = () => {
    if (!delId) return;
    const r = store.deletePlan(delId);
    setDelId(null);
    if (!r.ok) return toast.error(r.error);
    toast.success("ลบแผน overhaul สำเร็จ");
  };

  const createBtn = (size?: "sm") => (
    <Button href={routes.planNew()} iconLeft="add" size={size}>
      สร้างแผน Overhaul
    </Button>
  );

  return (
    <>
      <PageHeader title="จัดการงาน Overhaul" crumbs={[{ label: "จัดการงาน Overhaul" }]} actions={createBtn()} />

      <div className="flex w-full flex-col gap-3">
        {/* Table header: ค้นหา (ซ้าย) + ตัวกรอง (ขวา) — หน้าว่างซ่อนทั้งแถบ (เจ้าของงานเคาะ 19 ต.ค. 2569) */}
        {!none && (
          <div className="flex flex-wrap items-center justify-between gap-3 max-md:items-stretch">
            <SearchInput
              id={SEARCH_ID}
              value={q}
              onChange={setQ}
              placeholder="ค้นหาเลขแผน, ชื่อแผน, เลขศูนย์ต้นทุน"
              aria-label="ค้นหาแผน"
              className="min-w-[220px] flex-[0_1_415px] max-md:flex-[1_0_100%]"
            />
            <div className="ml-auto flex items-center gap-3 max-md:ml-0">
              <Button variant="secondary" iconLeft="filter_list" aria-haspopup="dialog" aria-expanded={filterOpen} onClick={() => setFilterOpen(true)}>
                ตัวกรอง
              </Button>
            </div>
          </div>
        )}

        {!none && <FilterChips chips={chips} onRemove={(k) => setFilter((f) => removePlanFilterChip(f, k))} />}

        {none ? (
          <EmptyState kind="empty" title="ยังไม่มีแผน Overhaul" description="สร้างแผนเพื่อเริ่มเพิ่ม Purchase Order และติดตามงานรายคัน" action={createBtn("sm")} />
        ) : (
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(p) => p.id}
            sort={sort}
            onSortChange={setSort}
            caption="รายการแผน Overhaul"
            rowMenuLabel={(p) => `จัดการแผน ${p.id}`}
            rowMenu={(p) => [
              { label: "ดูรายละเอียด", icon: "visibility", href: routes.planView(p.id) },
              { label: "แก้ไข", icon: "edit", href: routes.planEdit(p.id) },
              "divider",
              { label: "ลบ", icon: "delete", onSelect: () => setDelId(p.id) },
            ]}
            empty={
              <EmptyState
                kind="notFound"
                title="ไม่พบแผน Overhaul"
                description="ไม่มีแผนที่ตรงกับคำค้นหรือตัวกรอง"
                action={<Button variant="secondary" size="sm" onClick={clearAll}>ล้างคำค้นและตัวกรอง</Button>}
              />
            }
          />
        )}
      </div>

      {filterOpen && (
        <PlanFilter
          value={filter}
          wbsOptions={wbsOptions}
          onClose={() => setFilterOpen(false)}
          onApply={(v) => {
            setFilter({ ...v, status: PLAN_STATUSES.filter((s) => v.status.includes(s)) });
            setFilterOpen(false);
          }}
        />
      )}

      <ConfirmDialog
        open={!!delPlan}
        onClose={() => setDelId(null)}
        onConfirm={confirmDelete}
        danger
        title="ยืนยันการลบแผน"
        description={
          delPlan
            ? `แผน ${delPlan.id} "${delPlan.name}"${delPlan.pos.length ? ` และ Purchase Order ${delPlan.pos.length} ใบในแผนนี้` : ""} จะถูกลบ`
            : undefined
        }
      />
    </>
  );
}

export default function PlansPage() {
  return (
    <Suspense>
      <PlansList />
    </Suspense>
  );
}
