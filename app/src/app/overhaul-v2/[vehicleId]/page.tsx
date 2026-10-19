"use client";

// Overhaul รายคัน (ยกจาก design-mock/overhaul-v2-job.html · เจ้าของงานเคาะ 12 ต.ค. 2569)
// แท็บชุดเดียวกับหน้ารับงานซ่อม กบค. (flow/repair): กระบวนการ Overhaul · ประวัติการซ่อม · ประวัติการดำเนินการ
// stepper 5 ขั้น: ① เบิกอะไหล่ (ข้ามได้) ② บันทึก PO ③ ติดตามงาน ④ นัดหมายรับรถ ⑤ ปิดงาน
// ขั้นที่ผ่านแล้วกดย้อนดูได้ (อ่านอย่างเดียว) · ขั้นปัจจุบันแก้ไขได้ · ขั้นถัดไปล็อก
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useOverhaulV2 } from "@/lib/storeV2";
import { useToast } from "@/components/Shell";
import { AGE_LIMIT, PART_KIT, REPAIRS, STEPS, ageYears, status, thDate, type RepairRecord } from "@/lib/overhaulV2";
import { JobContext, Ro, type JobCtx } from "@/components/overhaul-v2/common";
import { StepParts } from "@/components/overhaul-v2/StepParts";
import { StepAppt, StepPo, StepTrack } from "@/components/overhaul-v2/Steps";
import { StepClose } from "@/components/overhaul-v2/StepClose";

const TABS = ["กระบวนการ Overhaul", "ประวัติการซ่อม", "ประวัติการดำเนินการ"];
const STEP_VIEWS = [StepParts, StepPo, StepTrack, StepAppt, StepClose];

export default function OverhaulV2JobPage() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const { ready, state, mutate } = useOverhaulV2();
  const toast = useToast();
  const [tab, setTab] = useState(0);
  const [viewSel, setView] = useState<number | null>(null); // null = ตามขั้นปัจจุบัน

  const v = state.vehicles.find((x) => x.id === vehicleId);
  if (!ready) return null;
  if (!v)
    return (
      <div className="empty">
        ไม่พบรถคันนี้ · <Link href="/overhaul-v2">กลับไปรายการ</Link>
      </div>
    );
  const j = state.jobs[v.id];
  const cur = Math.min(j.step, 6);
  const view = viewSel ?? Math.min(Math.max(j.step, 1), 5);
  const st = status(v, j);
  const age = ageYears(v.reg);

  const ctx: JobCtx = {
    v, j, s: state,
    readOnly: view < j.step,
    edit: (fn, msg) => { mutate(v.id, fn); if (msg) toast(msg); },
    go: (n) => setView(n),
  };

  const start = () => {
    const nos = Object.values(state.jobs).filter((x) => x.jobNo.startsWith("OVH-2569")).map((x) => Number(x.jobNo.slice(-4)));
    const no = "OVH-2569-" + String(Math.max(0, ...nos) + 1).padStart(4, "0");
    ctx.edit((x) => { x.jobNo = no; x.step = 1; x.parts = PART_KIT.map((p) => ({ ...p })); return `เริ่มงาน Overhaul — ออกเลขงาน ${no}`; }, `ออกเลขงาน ${no} แล้ว`);
    setView(1);
  };

  const View = STEP_VIEWS[view - 1];
  return (
    <JobContext.Provider value={ctx}>
      <div className="crumbs">
        <span className="ms">home</span>
        <span className="sep">›</span>
        <Link href="/overhaul-v2">Overhaul</Link>
        <span className="sep">›</span>
        <span className="cur">{j.jobNo || v.plate}</span>
      </div>
      <div className="page-title-row mb-6">
        <h1 className="page-title">{j.jobNo ? `งาน Overhaul ${j.jobNo}` : v.plate}</h1>
        <span className={`badge ${st.badge}`}>{st.text}</span>
      </div>

      <div className="card mb-6">
        <div className="stack">
          <div className="sect">ข้อมูลยานพาหนะ</div>
          <div className="fgrid">
            <Ro label="หมายเลขทะเบียน" value={v.plate} />
            <Ro label="รหัสข้างรถ" value={v.code} />
            <Ro label="ประเภท" value={v.type} />
            <Ro label="ยี่ห้อ / รุ่น" value={v.model} />
            <Ro label="ใช้งานประจำ" value={v.org} />
            <Ro label="อายุรถ" value={`${age} ปี (จดทะเบียน ${thDate(v.reg)})`} />
            <Ro label="ผู้ดูแลรถ (เจ้าของรถ)" value={v.owner} />
            <Ro label="เบอร์โทร" value={v.ownerTel} />
          </div>
        </div>
      </div>

      <div className="tabs mb-6" role="tablist" aria-label="งาน Overhaul">
        {TABS.map((t, i) => (
          <button key={t} type="button" role="tab" aria-selected={tab === i} className={`tab-btn${tab === i ? " on" : ""}`} onClick={() => setTab(i)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 0 &&
        (j.step === 0 ? (
          <div className="card">
            <div className="stack">
              <div className="sect">ยังไม่ได้เริ่มงาน Overhaul</div>
              {age < AGE_LIMIT && (
                <div className="note note-warn">
                  <span className="ms">warning</span>
                  <div>
                    รถคันนี้อายุ {age} ปี — ยังไม่ถึงเกณฑ์ {AGE_LIMIT} ปี
                  </div>
                </div>
              )}
              <div className="actions">
                <Link className="btn btn-g" href="/overhaul-v2">
                  <span className="ms">arrow_back</span> ย้อนกลับ
                </Link>
                <button type="button" className="btn btn-p" onClick={start}>
                  เริ่มงาน Overhaul
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="wsteps wrap mb-8">
              {STEPS.map((lbl, i) => {
                const n = i + 1;
                const passed = n < cur;
                const active = n === view;
                const reachable = n <= Math.min(cur, 5);
                return (
                  <div
                    key={lbl}
                    className={`wstep ${active ? "active" : passed ? "passed" : n === cur ? "" : "locked"}`}
                    role={reachable ? "button" : undefined}
                    tabIndex={reachable ? 0 : undefined}
                    onClick={() => reachable && setView(n)}
                  >
                    <span className="num">{passed && !active ? <span className="ms">check</span> : n}</span>
                    <span className="lbl">
                      {lbl}
                      {n === 1 && j.partsSkipped && " (ข้าม)"}
                    </span>
                  </div>
                );
              })}
            </div>
            <View />
          </>
        ))}

      {tab === 1 && renderRepairHistory()}

      {tab === 2 && (
        <div className="card">
          <div className="stack">
            <div className="sect">ประวัติการดำเนินการ</div>
            {[...j.history].reverse().map((h, i) => (
              <div className="job" key={i}>
                <div className="sp">
                  <div>{h.text}</div>
                  <div className="meta">{thDate(h.at)}</div>
                </div>
              </div>
            ))}
            {!j.history.length && <div className="empty">ยังไม่มีประวัติ</div>}
          </div>
        </div>
      )}
    </JobContext.Provider>
  );

  // ประวัติการซ่อมย้อนหลัง — คอลัมน์ตาม vehHistoryTable() ของหน้ารับงานซ่อม · งาน Overhaul ที่ปิดแล้วขึ้นด้วย
  function renderRepairHistory() {
    const rows: RepairRecord[] = [...(REPAIRS[v!.id] ?? [])];
    if (j.step === 6)
      rows.push({
        no: j.jobNo, date: j.closedAt, syms: ["Overhaul"], detail: j.pos.flatMap((p) => p.items).join(" · "),
        parts: j.parts && !j.partsSkipped ? j.parts.map((p) => [p.name, p.qty, p.unit]) : [],
        by: [...new Set(j.pos.map((p) => p.vendor))].join(", ") || "กบค.", hours: 0, odo: 0,
      });
    rows.sort((a, b) => b.date.localeCompare(a.date));
    const byBadge = (b: string) => (/อู่|บจก|หจก/.test(b) ? "b-low" : /กบค|กรย/.test(b) ? "b-brand" : "b-ok");
    return (
      <div className="card">
        <div className="stack">
          <div className="sect">ประวัติการซ่อม</div>
          {rows.length ? (
            <>
              <div className="sub">
                ทั้งหมด {rows.length} ครั้ง · ล่าสุด {thDate(rows[0].date)}
              </div>
              <div className="tblwrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>เลขที่ใบแจ้งซ่อม · วันที่</th>
                      <th>อาการเสีย</th>
                      <th>อะไหล่ที่ใช้</th>
                      <th>ผู้ซ่อม</th>
                      <th className="num">ชั่วโมงใช้งาน</th>
                      <th className="num">เลขไมล์</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((x) => (
                      <tr key={x.no}>
                        <td>
                          <span className="cell-key">{x.no}</span>
                          <div className="cell-sub">{thDate(x.date)}</div>
                        </td>
                        <td>
                          {x.syms.join(", ")}
                          {x.detail && <div className="cell-sub">{x.detail}</div>}
                        </td>
                        <td>
                          {x.parts.length ? (
                            x.parts.map((p) => (
                              <div key={p[0]}>
                                {p[0]} ×{p[1]} {p[2]}
                              </div>
                            ))
                          ) : (
                            <span className="cell-sub">ไม่ได้ใช้อะไหล่</span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${byBadge(x.by)}`}>{x.by}</span>
                        </td>
                        <td className="num">{x.hours ? `${x.hours.toLocaleString("th-TH")} ชม.` : "—"}</td>
                        <td className="num">{x.odo ? `${x.odo.toLocaleString("th-TH")} กม.` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty">ไม่พบประวัติการซ่อมย้อนหลังของรถคันนี้</div>
          )}
        </div>
      </div>
    );
  }
}
