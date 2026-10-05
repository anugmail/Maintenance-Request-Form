"use client";

// จัดการงาน Overhaul — คิวงานรายคันของทุกแผนที่อนุมัติแล้ว (JO 7.4.2 · 7.4.2-12 ค้นหาและกรอง)
// โครงยกจาก "คิวงานซ่อม" ของ กบค. (incidentTable ใน mock/Maintenance-Request-Form.html · อิง figma/กบครับซ่อม.jpg):
// .list-toolbar.split → .tbl.striped หัวตารางกดเรียงได้ (th.sortable) → .tblfoot · ≤768px สลับเป็น .tbl-cards
// 1 แถว = รถ 1 คันในแผน (overhaul_plan_vehicles) — กดแล้วไปหน้าดำเนินการ Overhaul รายคัน
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { usePlans } from "@/lib/store";
import { EmptyState } from "@/components/EmptyState";
import { FilterButton, FilterDrawer } from "@/components/FilterDrawer";
import { TableFoot, paginate } from "@/components/TableFoot";
import { fmtDate, fmtTime, isApprovedPlan, vehicleById, type OverhaulPlan, type PlanVehicle, type Vehicle } from "@/lib/overhaul";
import {
  EXEC_STAGE_BADGE,
  EXEC_STAGE_LABEL,
  STAGE_ORDER,
  STEPS,
  currentStep,
  execStage,
  execUpdatedAt,
  type ExecStage,
} from "@/lib/overhaulExec";

interface Job {
  plan: OverhaulPlan;
  pv: PlanVehicle;
  v: Vehicle;
  stage: ExecStage;
  // บันทึกล่าสุดของงานคันนี้ · ยังไม่เริ่ม = วันที่แผนได้อนุมัติ (งานเกิดตอนนั้น)
  updatedAt: string;
}

type SortKey = "plan" | "plate" | "type" | "stage" | "updated";
// ขั้นที่กำลังทำ เช่น "2/5 เบิกอะไหล่" — ปิดงานแล้วไม่ต้องโชว์
const stepLabel = (pv: PlanVehicle) => {
  const i = currentStep(pv);
  return i < STEPS.length ? `${i + 1}/${STEPS.length} ${STEPS[i]}` : null;
};

// ชุดตัวกรอง — เฉพาะข้อที่มีข้อมูลรองรับจากชุดตัวกรอง F ของ JO (ประเภทยานพาหนะ · สังกัด · ยี่ห้อเครื่องมือกล)
// + สถานะงาน/แผน ของหน้านี้ · ข้อที่ยังไม่มีข้อมูล (รหัสทรัพย์สิน · หมายเลขตัวถัง ฯลฯ) ยังไม่ใส่ (no-data-no-ui)
interface Filters {
  stage: ExecStage | "all";
  planId: string;
  type: string;
  org: string;
  brand: string;
}
const NO_FILTER: Filters = { stage: "all", planId: "all", type: "all", org: "all", brand: "all" };

export default function OverhaulJobsPage() {
  const router = useRouter();
  const { ready, plans } = usePlans();
  const [q, setQ] = useState("");
  const [f, setF] = useState<Filters>(NO_FILTER);
  const [draft, setDraft] = useState<Filters>(NO_FILTER);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "updated", dir: "desc" });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const jobs = useMemo<Job[]>(
    () =>
      plans
        .filter(isApprovedPlan)
        .flatMap((plan) =>
          plan.vehicles.flatMap((pv) => {
            const v = vehicleById(pv.vehicleId);
            return v ? [{ plan, pv, v, stage: execStage(pv), updatedAt: execUpdatedAt(pv) ?? plan.approvedAt ?? plan.updatedAt }] : [];
          }),
        ),
    [plans],
  );
  const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, "th"));
  const opts = useMemo(
    () => ({
      plans: [...new Map(jobs.map((j) => [j.plan.id, j.plan])).values()],
      types: uniq(jobs.map((j) => j.v.vehicleType)),
      orgs: uniq(jobs.map((j) => j.v.orgUnit)),
      brands: uniq(jobs.map((j) => j.v.equipmentBrand)),
    }),
    [jobs],
  );

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    const val = (j: Job): string | number =>
      sort.key === "plan" ? j.plan.planNo
      : sort.key === "plate" ? j.v.plate
      : sort.key === "type" ? j.v.vehicleType
      : sort.key === "stage" ? STAGE_ORDER.indexOf(j.stage)
      : j.updatedAt;
    return jobs
      .filter((j) => f.stage === "all" || j.stage === f.stage)
      .filter((j) => f.planId === "all" || j.plan.id === f.planId)
      .filter((j) => f.type === "all" || j.v.vehicleType === f.type)
      .filter((j) => f.org === "all" || j.v.orgUnit === f.org)
      .filter((j) => f.brand === "all" || j.v.equipmentBrand === f.brand)
      .filter(
        (j) =>
          !kw ||
          [j.v.plate, j.plan.planNo, j.v.equipmentNo, j.v.serialNo].some((s) => s.toLowerCase().includes(kw)),
      )
      .sort((a, b) => {
        const x = val(a), y = val(b);
        const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "th");
        return (sort.dir === "asc" ? c : -c) || a.v.plate.localeCompare(b.v.plate, "th");
      });
  }, [jobs, q, f, sort]);

  const filterCount = (Object.keys(NO_FILTER) as (keyof Filters)[]).filter((k) => f[k] !== "all").length;
  const { pages, cur, slice, from, to } = paginate(rows, page, size);
  const open = (j: Job) => router.push(`/overhaul/${j.plan.id}/vehicles/${j.v.id}`);
  const closeFilter = useCallback(() => setFilterOpen(false), []);
  const toggleSort = (key: SortKey) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "updated" ? "desc" : "asc" }));
    setPage(1);
  };
  const sortIcon = (key: SortKey) =>
    sort.key !== key ? "swap_vert" : sort.dir === "asc" ? "arrow_upward_alt" : "arrow_downward_alt";
  const th = (k: SortKey, label: string) => (
    <th key={k} className={`sortable${sort.key === k ? " on" : ""}`} aria-sort={sort.key === k ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => toggleSort(k)}>
        {label}
        <span className="ms">{sortIcon(k)}</span>
      </button>
    </th>
  );
  const select = (id: keyof Filters, label: string, options: { value: string; label: string }[]) => (
    <div className="filter-field">
      <label htmlFor={`job-${id}`}>{label}</label>
      <select id={`job-${id}`} value={draft[id]} onChange={(e) => setDraft((d) => ({ ...d, [id]: e.target.value }))}>
        <option value="all">ทั้งหมด</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
  const asOpts = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));

  if (!ready) return null;

  return (
    <>
      <div className="crumbs mb-6">
        <span className="ms">home</span>
        <span className="sep" aria-hidden="true" />
        <span className="cur">จัดการงาน Overhaul</span>
      </div>
      <h1 className="page-title">จัดการงาน Overhaul</h1>

      <div className="list-toolbar split">
        <div className="lt-search">
          <div className="search">
            <span className="ms">search</span>
            <input
              type="search"
              placeholder="ทะเบียน, เลขที่แผน, หมายเลขเครน, S/N"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="lt-actions">
          <FilterButton
            count={filterCount}
            controls="job-filter"
            onClick={() => {
              setDraft(f);
              setFilterOpen(true);
            }}
          />
        </div>
      </div>

      <FilterDrawer
        id="job-filter"
        open={filterOpen}
        onClose={closeFilter}
        onApply={() => {
          setF(draft);
          setPage(1);
          setFilterOpen(false);
        }}
        onClear={() => {
          setDraft(NO_FILTER);
          setF(NO_FILTER);
          setPage(1);
        }}
      >
        {select("stage", "สถานะงาน", STAGE_ORDER.map((s) => ({ value: s, label: EXEC_STAGE_LABEL[s] })))}
        {select("planId", "แผน Overhaul", opts.plans.map((p) => ({ value: p.id, label: `${p.planNo} · ${p.name}` })))}
        {select("type", "ประเภทยานพาหนะ", asOpts(opts.types))}
        {select("org", "สังกัดหน่วยงาน", asOpts(opts.orgs))}
        {select("brand", "ยี่ห้อ-รุ่นเครื่องมือกล", asOpts(opts.brands))}
      </FilterDrawer>

      {rows.length === 0 ? (
        jobs.length === 0 ? (
          <EmptyState title="ยังไม่มีงาน Overhaul" desc="งานจะขึ้นที่นี่เมื่อแผน Overhaul ได้รับอนุมัติแล้ว">
            <Link className="btn btn-s" href="/overhaul">
              <span className="ms">list_alt</span> ไปที่แผน Overhaul
            </Link>
          </EmptyState>
        ) : (
          <EmptyState title="ไม่พบข้อมูลตามเงื่อนไขนี้" desc="ลองล้างตัวกรองหรือแก้คำค้น">
            <button
              className="btn btn-s"
              onClick={() => {
                setF(NO_FILTER);
                setQ("");
                setPage(1);
              }}
            >
              <span className="ms">filter_alt_off</span> ล้างตัวกรอง
            </button>
          </EmptyState>
        )
      ) : (
        <>
          <div className="tblwrap">
            <table className="tbl striped">
              <thead>
                <tr>
                  {th("plan", "เลขที่แผน")}
                  {th("plate", "ยานพาหนะ")}
                  {th("type", "ประเภทยานพาหนะ")}
                  <th>เครื่องมือกล</th>
                  {th("stage", "สถานะงาน")}
                  <th>ขั้นปัจจุบัน</th>
                  {th("updated", "อัปเดตล่าสุด")}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {slice.map((j) => {
                  const [no, ...prov] = j.v.plate.split(" ");
                  return (
                    <tr key={`${j.plan.id}-${j.v.id}`} className="cursor-pointer" onClick={() => open(j)}>
                      <td>
                        <div className="cell-key">{j.plan.planNo}</div>
                        <div className="cell-sub cell-clip" title={j.plan.name}>
                          {j.plan.name}
                        </div>
                      </td>
                      <td>
                        <div className="cell-key">{no}</div>
                        <div className="cell-sub">
                          {prov.join(" ")} · {j.v.orgUnit}
                        </div>
                      </td>
                      <td>
                        <div className="cell-clip" title={j.v.vehicleType}>
                          {j.v.vehicleType}
                        </div>
                      </td>
                      <td>
                        <div>{j.v.equipmentBrand}</div>
                        <div className="cell-sub">{j.v.equipmentNo}</div>
                      </td>
                      <td>
                        <span className={`badge ${EXEC_STAGE_BADGE[j.stage]}`}>{EXEC_STAGE_LABEL[j.stage]}</span>
                      </td>
                      <td>{stepLabel(j.pv) ?? <span className="cell-sub">—</span>}</td>
                      <td>
                        <div>{fmtDate(j.updatedAt)}</div>
                        <div className="cell-sub">{fmtTime(j.updatedAt)}</div>
                      </td>
                      <td>
                        <div className="dt-action" onClick={(e) => e.stopPropagation()}>
                          <button className="btn" title="ดำเนินการ Overhaul" aria-label={`ดำเนินการ Overhaul ${j.v.plate}`} onClick={() => open(j)}>
                            <span className="ms">build</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="tbl-cards">
            {slice.map((j) => (
              <div className="tbl-card" key={`${j.plan.id}-${j.v.id}`}>
                <div className="tbl-card-row">
                  <span className="tbl-card-label">ยานพาหนะ</span>
                  <span className="tbl-card-value">{j.v.plate}</span>
                </div>
                <div className="tbl-card-row">
                  <span className="tbl-card-label">แผน</span>
                  <span className="tbl-card-value">{j.plan.planNo}</span>
                </div>
                <div className="tbl-card-row">
                  <span className="tbl-card-label">ประเภท / สังกัด</span>
                  <span className="tbl-card-value">
                    {j.v.vehicleType} · {j.v.orgUnit}
                  </span>
                </div>
                <div className="tbl-card-row">
                  <span className="tbl-card-label">สถานะงาน</span>
                  <span className="tbl-card-value">
                    <span className={`badge ${EXEC_STAGE_BADGE[j.stage]}`}>{EXEC_STAGE_LABEL[j.stage]}</span>
                  </span>
                </div>
                <div className="tbl-card-row">
                  <span className="tbl-card-label">ขั้นปัจจุบัน</span>
                  <span className="tbl-card-value">{stepLabel(j.pv) ?? "—"}</span>
                </div>
                <div className="tbl-card-foot">
                  <Link className="btn btn-s" href={`/overhaul/${j.plan.id}/vehicles/${j.v.id}`}>
                    <span className="ms">build</span> ดำเนินการ Overhaul
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <TableFoot
            total={rows.length}
            from={from}
            to={to}
            cur={cur}
            pages={pages}
            size={size}
            onPage={setPage}
            onSize={(n) => {
              setSize(n);
              setPage(1);
            }}
          />
        </>
      )}
    </>
  );
}
