"use client";

// Overhaul — รายการรถ (ยกจาก design-mock/overhaul-v2-list.html · เจ้าของงานเคาะ 12 ต.ค. 2569)
// เรียง: อายุ ≥ 10 ปีอยู่บน (เก่าสุดก่อน) → อายุไม่ถึงอยู่ล่าง · คอลัมน์ประกัน = วันเริ่ม–วันสิ้นสุด + สถานะ
// โครงหน้า + ตาราง ยกจาก `Vehicle list` ของหน้า `5.2 Vehicle Management` (UI Release#2) — ชุดเดียวกับ transfer-01-list.html
// คลาสกลาง: .crumbs · .page-title-row · .list-toolbar.split · .search · .seg · .tblwrap/.tbl.striped · .cell-key/.cell-sub · .badge · .tblfoot
import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useOverhaulV2 } from "@/lib/storeV2";
import { AGE_LIMIT, ageYears, status, thDate, warranty } from "@/lib/overhaulV2";

type Filter = "all" | "due" | "wip" | "warr";
const FILTERS: [Filter, string][] = [
  ["all", "ทั้งหมด"],
  ["due", `ครบ ${AGE_LIMIT} ปี`],
  ["wip", "กำลังดำเนินการ"],
  ["warr", "อยู่ในประกัน"],
];

export default function OverhaulV2ListPage() {
  const { ready, state } = useOverhaulV2();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const all = useMemo(
    () =>
      state.vehicles
        .map((v) => ({ v, j: state.jobs[v.id], age: ageYears(v.reg) }))
        // อายุครบเกณฑ์อยู่บนสุด · ในกลุ่มเดียวกันเรียงเก่าสุดก่อน
        .sort((a, b) => Number(b.age >= AGE_LIMIT) - Number(a.age >= AGE_LIMIT) || b.age - a.age),
    [state],
  );
  const list = all.filter(({ v, j, age }) => {
    const s = q.trim().toLowerCase();
    if (s && ![v.plate, v.code, v.model, v.type, j.jobNo].some((x) => x.toLowerCase().includes(s))) return false;
    if (filter === "due") return age >= AGE_LIMIT;
    if (filter === "wip") return j.step >= 1 && j.step <= 5;
    if (filter === "warr") { const w = warranty(j); return !!w && w.left >= 0; }
    return true;
  });
  const firstYoung = list.findIndex((r) => r.age < AGE_LIMIT);

  if (!ready) return null;
  return (
    <>
      <div className="crumbs">
        <span className="ms">home</span>
        <span className="sep">›</span>
        <span className="cur">Overhaul</span>
      </div>
      <div className="page-title-row">
        <h1 className="page-title">Overhaul ยานพาหนะ</h1>
      </div>

      <div className="list-toolbar split mb-3">
        <div className="lt-search">
          <div className="search">
            <span className="ms">search</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ค้นหาทะเบียน · รหัสข้างรถ · รุ่น · เลขงาน" />
          </div>
        </div>
        <div className="lt-actions">
          <div className="seg">
            {FILTERS.map(([k, label]) => (
              <div key={k} className={`sg${filter === k ? " sel" : ""}`} onClick={() => setFilter(k)}>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tblwrap">
        <table className="tbl striped">
          <thead>
            <tr>
              <th>เลขทะเบียน</th>
              <th>ประเภทยานพาหนะ</th>
              <th>สังกัดปัจจุบัน</th>
              <th className="sortable on">
                <button type="button">
                  อายุรถ <span className="ms">swap_vert</span>
                </button>
              </th>
              <th>สถานะ</th>
              <th>ประกันหลัง Overhaul</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map(({ v, j, age }, i) => {
              const st = status(v, j);
              const w = warranty(j);
              const due = age >= AGE_LIMIT;
              const href = `/overhaul-v2/${v.id}`;
              return (
                <Fragment key={v.id}>
                  {i === firstYoung && (
                    <tr>
                      <td colSpan={7} className="bg-gray-50">
                        <span className="cell-sub">อายุไม่ถึง {AGE_LIMIT} ปี</span>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td>
                      <span className="cell-key">{v.plate}</span>
                      <div className="cell-sub">{v.code}</div>
                    </td>
                    <td>
                      {v.type}
                      <div className="cell-sub">{v.model}</div>
                    </td>
                    <td>{v.org}</td>
                    <td>
                      {due ? <span className="cell-key">{age} ปี</span> : `${age} ปี`}
                      <div className="cell-sub">จดทะเบียน {thDate(v.reg)}</div>
                    </td>
                    <td>
                      <span className={`badge ${st.badge}`}>{st.text}</span>
                      <div className="cell-sub">
                        {j.jobNo && `${j.jobNo} · `}
                        {st.sub}
                      </div>
                    </td>
                    <td>
                      {w ? (
                        <>
                          <span className={`badge ${w.badge}`}>{w.text}</span>
                          <div className="cell-sub">
                            {thDate(j.warrantyStart)} – {thDate(j.warrantyEnd)}
                          </div>
                          <div className="cell-sub">
                            {w.left >= 0 ? `เหลือ ${w.left} วัน` : "สิ้นสุดแล้ว"} · {j.safety?.warrantyDays} วัน
                          </div>
                        </>
                      ) : (
                        <span className="cell-sub">{j.step >= 1 ? "เริ่มนับเมื่อเจ้าของรถรับรถ" : "—"}</span>
                      )}
                    </td>
                    <td>
                      <div className="dt-action">
                        {j.step === 0 ? (
                          <Link className={`btn ${due ? "btn-p" : "btn-s"} btn-icon`} href={href} title="เริ่ม Overhaul">
                            <span className="ms">build</span>
                          </Link>
                        ) : (
                          <Link className="btn btn-s btn-icon" href={href} title={`เปิดงาน ${j.jobNo}`}>
                            <span className="ms">visibility</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
            {!list.length && (
              <tr>
                <td colSpan={7}>
                  <div className="empty">ไม่พบรายการ</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="tblfoot">
          <span>
            แสดง {list.length} จาก {all.length} รายการ · ครบเกณฑ์ {all.filter((r) => r.age >= AGE_LIMIT).length} คัน
          </span>
        </div>
      </div>
    </>
  );
}
