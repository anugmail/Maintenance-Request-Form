"use client";

// หน้ารายการแผน Overhaul — โครง "หน้ารายการ (list page)" ของ design-system README หัวข้อ 4.2:
// .list-toolbar.split → .tblwrap > .tbl → .tblfoot · จอ ≤760px สลับเป็น .tbl-cards
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { usePlans } from "@/lib/store";
import { ApproveModal } from "@/components/ApproveModal";
import { planProgress } from "@/lib/overhaulExec";
import { EmptyState } from "@/components/EmptyState";
import { TableFoot, paginate } from "@/components/TableFoot";
import { FilterButton, FilterDrawer } from "@/components/FilterDrawer";
import {
  STATUS_BADGE,
  STATUS_LABEL,
  canApprove,
  canEdit,
  fmtBaht,
  fmtDate,
  fmtTime,
  isApprovedPlan,
  type OverhaulPlan,
  type PlanStatus,
} from "@/lib/overhaul";

export default function OverhaulListPage() {
  const router = useRouter();
  const { plans } = usePlans();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<PlanStatus | "all">("all");
  const [year, setYear] = useState<number | "all">("all");
  // ค่าในแผงตัวกรอง — ยังไม่กรองจนกด "ตกลง" (ตามแผงตัวกรองรายการ กบค. ใน mock/Maintenance-Request-Form.html)
  const [draft, setDraft] = useState<{ status: PlanStatus | "all"; year: number | "all" }>({ status: "all", year: "all" });
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [approving, setApproving] = useState<OverhaulPlan | null>(null);

  const years = useMemo(() => [...new Set(plans.map((p) => p.year))].sort((a, b) => b - a), [plans]);
  const filterCount = (status !== "all" ? 1 : 0) + (year !== "all" ? 1 : 0);

  const openFilter = () => {
    setDraft({ status, year });
    setFilterOpen(true);
  };
  const closeFilter = useCallback(() => setFilterOpen(false), []);
  const applyFilter = () => {
    setStatus(draft.status);
    setYear(draft.year);
    setPage(1);
    setFilterOpen(false);
  };
  // ล้างแล้วกรองใหม่ทันที แผงยังเปิดอยู่ — ตาม clearFilter() ของ mock
  const clearFilter = () => {
    setDraft({ status: "all", year: "all" });
    setStatus("all");
    setYear("all");
    setPage(1);
  };

  const rows = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return plans
      .filter((p) => status === "all" || p.status === status)
      .filter((p) => year === "all" || p.year === year)
      .filter((p) => !kw || p.planNo.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [plans, q, status, year]);

  const { pages, cur, slice, from, to } = paginate(rows, page, size);
  const open = (p: OverhaulPlan) => router.push(`/overhaul/${p.id}`);

  return (
    <>
      <div className="crumbs mb-6">
        <span className="ms">home</span>
        <span className="sep" aria-hidden="true" />
        <span className="cur">แผน Overhaul</span>
      </div>
      <h1 className="page-title">แผน Overhaul</h1>

      <div className="list-toolbar split">
        <div className="lt-search">
          <div className="search">
            <span className="ms">search</span>
            <input
              type="search"
              placeholder="เลขที่แผน, ชื่อแผน"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="lt-actions">
          <FilterButton count={filterCount} controls="ovh-filter" onClick={openFilter} />
          <Link className="btn btn-p" href="/overhaul/new">
            <span className="ms">note_add</span> สร้างแผน
          </Link>
        </div>
      </div>

      <FilterDrawer id="ovh-filter" open={filterOpen} onClose={closeFilter} onApply={applyFilter} onClear={clearFilter}>
        <div className="filter-field">
          <label htmlFor="ovh-status">สถานะแผน</label>
          <select
            id="ovh-status"
            value={draft.status}
            onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as PlanStatus | "all" }))}
          >
            <option value="all">ทั้งหมด</option>
            {(Object.keys(STATUS_LABEL) as PlanStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="ovh-year">ปีแผนงาน</label>
          <select
            id="ovh-year"
            value={draft.year}
            onChange={(e) => setDraft((d) => ({ ...d, year: e.target.value === "all" ? "all" : +e.target.value }))}
          >
            <option value="all">ทั้งหมด</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </FilterDrawer>

      {rows.length === 0 ? (
        filterCount || q.trim() ? (
          <EmptyState title="ไม่พบข้อมูลตามเงื่อนไขนี้" desc="ลองล้างตัวกรองหรือแก้คำค้น">
            <button
              className="btn btn-s"
              onClick={() => {
                clearFilter();
                setQ("");
              }}
            >
              <span className="ms">filter_alt_off</span> ล้างตัวกรอง
            </button>
          </EmptyState>
        ) : (
          <EmptyState title="ยังไม่มีแผน Overhaul" desc="กด “สร้างแผน” เพื่อเริ่มวางแผนแรก" />
        )
      ) : (
        <>
          <div className="tblwrap">
            <table className="tbl striped">
              <thead>
                <tr>
                  <th>เลขที่แผน</th>
                  <th>ชื่อแผนงาน</th>
                  <th>ปีแผนงาน</th>
                  <th className="text-right!">งบประมาณ (บาท)</th>
                  <th className="text-right!">จำนวนรถ</th>
                  <th>สถานะ</th>
                  <th>อัปเดตล่าสุด</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {slice.map((p) => (
                  <tr key={p.id} className="cursor-pointer" onClick={() => open(p)}>
                    <td>
                      <div className="cell-key">{p.planNo}</div>
                    </td>
                    <td>
                      <div className="cell-clip" title={p.name}>
                        {p.name}
                      </div>
                    </td>
                    <td>{p.year}</td>
                    <td className="text-right!">{fmtBaht(p.budget)}</td>
                    <td className="text-right!">
                      <div>{p.vehicles.length} คัน</div>
                      {isApprovedPlan(p) && (
                        <div className="cell-sub">
                          ปิดงาน {planProgress(p).done}/{planProgress(p).total}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                    </td>
                    <td>
                      <div>{fmtDate(p.updatedAt)}</div>
                      <div className="cell-sub">{fmtTime(p.updatedAt)}</div>
                    </td>
                    <td>
                      {/* ชิดขวา — แถวที่มีไอคอนอนุมัติเพิ่มมา ไอคอนดู/แก้ไขจะยังตรงคอลัมน์เดียวกับแถวอื่น */}
                      <div className="dt-action justify-end!" onClick={(e) => e.stopPropagation()}>
                        {canApprove(p) && (
                          <button className="btn" title="อนุมัติแผน" aria-label="อนุมัติแผน" onClick={() => setApproving(p)}>
                            <span className="ms">task_alt</span>
                          </button>
                        )}
                        <button className="btn" title="ดูรายละเอียด" aria-label="ดูรายละเอียด" onClick={() => open(p)}>
                          <span className="ms">quick_reference_all</span>
                        </button>
                        <button
                          className="btn"
                          title={canEdit(p) ? "แก้ไขแผน" : `${STATUS_LABEL[p.status]} — แก้ไขไม่ได้`}
                          aria-label="แก้ไขแผน"
                          disabled={!canEdit(p)}
                          onClick={() => router.push(`/overhaul/${p.id}/edit`)}
                        >
                          <span className="ms">edit</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tbl-cards">
            {slice.map((p) => (
              <div className="tbl-card" key={p.id}>
                <div className="tbl-card-row">
                  <span className="tbl-card-label">เลขที่แผน</span>
                  <span className="tbl-card-value">{p.planNo}</span>
                </div>
                <div className="tbl-card-row">
                  <span className="tbl-card-label">ชื่อแผนงาน</span>
                  <span className="tbl-card-value">{p.name}</span>
                </div>
                <div className="tbl-card-row">
                  <span className="tbl-card-label">ปี / งบประมาณ</span>
                  <span className="tbl-card-value">
                    {p.year} · {fmtBaht(p.budget)} บาท
                  </span>
                </div>
                <div className="tbl-card-row">
                  <span className="tbl-card-label">จำนวนรถ</span>
                  <span className="tbl-card-value">
                    {p.vehicles.length} คัน{isApprovedPlan(p) && ` · ปิดงาน ${planProgress(p).done}/${planProgress(p).total}`}
                  </span>
                </div>
                <div className="tbl-card-row">
                  <span className="tbl-card-label">สถานะ</span>
                  <span className="tbl-card-value">
                    <span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                  </span>
                </div>
                <div className="tbl-card-foot">
                  {canApprove(p) && (
                    <button className="btn btn-p" onClick={() => setApproving(p)}>
                      <span className="ms">task_alt</span> อนุมัติ
                    </button>
                  )}
                  {canEdit(p) && (
                    <Link className="btn btn-s" href={`/overhaul/${p.id}/edit`}>
                      <span className="ms">edit</span> แก้ไข
                    </Link>
                  )}
                  <Link className="btn btn-s" href={`/overhaul/${p.id}`}>
                    <span className="ms">quick_reference_all</span> ดูรายละเอียด
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
      {approving && <ApproveModal plan={approving} onClose={() => setApproving(null)} />}
    </>
  );
}
