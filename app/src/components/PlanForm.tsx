"use client";

import { EmptyState } from "./EmptyState";
// ฟอร์มสร้าง/แก้ไขแผน Overhaul — สเปก 6.1 (ชื่อแผน · ปี · งบ) + 6.2 (เลือกรถ + เกณฑ์คัดเลือก)
// โครงฟอร์ม .sect + .fgrid + .f · ปุ่มท้าย .actions · ป๊อปอัปยกเลิกแผน .modal (README หัวข้อ 4.1–4.2)
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { usePlans } from "@/lib/store";
import { useToast } from "@/components/Shell";
import { VehicleTable } from "@/components/VehicleTable";
import {
  VEHICLES,
  fmtBaht,
  type CriterionKey,
  type OverhaulPlan,
  type PlanStatus,
  type PlanVehicle,
} from "@/lib/overhaul";

const THIS_YEAR_BE = new Date().getFullYear() + 543;

export function PlanForm({ plan }: { plan?: OverhaulPlan }) {
  const router = useRouter();
  const toast = useToast();
  const { create, update } = usePlans();

  const [name, setName] = useState(plan?.name ?? "");
  const [year, setYear] = useState(String(plan?.year ?? THIS_YEAR_BE + 1));
  const [budget, setBudget] = useState(plan ? fmtBaht(plan.budget) : "");
  const [picked, setPicked] = useState<PlanVehicle[]>(plan?.vehicles ?? []);
  const [q, setQ] = useState("");
  const [tried, setTried] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const budgetNum = Number(budget.replace(/,/g, ""));
  const errors = {
    name: !name.trim() ? "กรุณาระบุชื่อแผนงาน" : "",
    year: !/^25\d\d$/.test(year) ? "ระบุปี พ.ศ. 4 หลัก" : "",
    budget: !(budgetNum > 0) ? "กรุณาระบุงบประมาณมากกว่า 0" : "",
    vehicles: picked.length === 0 ? "เลือกรถอย่างน้อย 1 คัน" : "",
  };
  const valid = !Object.values(errors).some(Boolean);
  const err = (k: keyof typeof errors) => (tried ? errors[k] : "");

  const shown = useMemo(() => {
    const kw = q.trim().toLowerCase();
    if (!kw) return VEHICLES;
    return VEHICLES.filter((v) =>
      [v.plate, v.vehicleType, v.orgUnit, v.equipmentBrand, v.equipmentNo, v.serialNo].some((s) =>
        s.toLowerCase().includes(kw),
      ),
    );
  }, [q]);

  const toggle = (id: string) =>
    setPicked((ps) =>
      ps.some((p) => p.vehicleId === id) ? ps.filter((p) => p.vehicleId !== id) : [...ps, { vehicleId: id, criteria: [] }],
    );
  const toggleCriteria = (id: string, key: CriterionKey) =>
    setPicked((ps) =>
      ps.map((p) =>
        p.vehicleId !== id
          ? p
          : { ...p, criteria: p.criteria.includes(key) ? p.criteria.filter((c) => c !== key) : [...p.criteria, key] },
      ),
    );

  const save = (status: PlanStatus) => {
    setTried(true);
    if (!valid) {
      toast("กรอกข้อมูลให้ครบก่อนบันทึก");
      return;
    }
    const data = { name: name.trim(), year: Number(year), budget: budgetNum, vehicles: picked, status };
    if (plan) {
      update(plan.id, data);
      toast(status === "PENDING" ? `ส่ง ${plan.planNo} ให้หัวหน้าอนุมัติแล้ว` : "บันทึกการแก้ไขแล้ว");
      router.push(`/overhaul/${plan.id}`);
    } else {
      const p = create(data);
      toast(status === "PENDING" ? `สร้างแผน ${p.planNo} แล้ว · ส่งให้หัวหน้าอนุมัติ` : `สร้างแผน ${p.planNo} แล้ว`);
      router.push(`/overhaul/${p.id}`);
    }
  };

  const cancelPlan = () => {
    if (!plan) return;
    update(plan.id, { status: "CANCELLED", cancelReason: cancelReason.trim() });
    toast("ยกเลิกแผนแล้ว");
    router.push("/overhaul");
  };

  const title = plan ? "แก้ไขแผน Overhaul" : "สร้างแผน Overhaul";
  const back = plan ? `/overhaul/${plan.id}` : "/overhaul";

  return (
    <>
      <div className="crumbs mb-6">
        <span className="ms">home</span>
        <span className="sep" aria-hidden="true" />
        <Link href="/overhaul">แผน Overhaul</Link>
        {plan && (
          <>
            <span className="sep" aria-hidden="true" />
            <Link href={back}>{plan.planNo}</Link>
          </>
        )}
        <span className="sep" aria-hidden="true" />
        <span className="cur">{plan ? "แก้ไข" : "สร้างแผน"}</span>
      </div>
      <div className="page-title-row">
        <button className="page-back" aria-label="ย้อนกลับ" onClick={() => router.push(back)}>
          <span className="ms">arrow_back</span>
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="stack loose">
        <div className="card">
          <div className="stack">
            <div className="sect">ข้อมูลแผนงาน</div>
            <div className="fgrid">
              {plan && (
                <div className="f ro">
                  <label>เลขที่แผน</label>
                  <div className="in">
                    <span className="ms">tag</span>
                    <input type="text" value={plan.planNo} readOnly />
                  </div>
                </div>
              )}
              <div className={`f sp2${err("name") ? " err" : ""}`}>
                <label htmlFor="pf-name">ชื่อแผนงาน</label>
                <div className="in">
                  <span className="ms">description</span>
                  <input type="text"
                    id="pf-name"
                    placeholder="เช่น Overhaul รถกระเช้า เขต ฉ.1 ปี 2570"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                {err("name") && <div className="help">{err("name")}</div>}
              </div>
              <div className={`f${err("year") ? " err" : ""}`}>
                <label htmlFor="pf-year">ปีแผนงาน (พ.ศ.)</label>
                <div className="in">
                  <span className="ms">calendar_month</span>
                  <input type="text"
                    id="pf-year"
                    inputMode="numeric"
                    maxLength={4}
                    value={year}
                    onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
                {err("year") && <div className="help">{err("year")}</div>}
              </div>
              <div className={`f${err("budget") ? " err" : ""}`}>
                <label htmlFor="pf-budget">งบประมาณ (บาท)</label>
                <div className="in">
                  <span className="ms">payments</span>
                  <input type="text"
                    id="pf-budget"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value.replace(/[^\d.,]/g, ""))}
                    onBlur={() => budgetNum > 0 && setBudget(fmtBaht(budgetNum))}
                    onFocus={() => setBudget(budget.replace(/,/g, ""))}
                  />
                </div>
                {err("budget") && <div className="help">{err("budget")}</div>}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="stack">
            <div className="sect">เลือกรถเข้าแผน (เลือกแล้ว {picked.length} คัน)</div>
            {err("vehicles") && (
              <div className="note note-warn">
                <span className="ms">warning</span>
                <span>{err("vehicles")}</span>
              </div>
            )}
            <div className="search">
              <span className="ms">search</span>
              <input
                type="search"
                placeholder="ค้นหาทะเบียน, ประเภท, สังกัด, ยี่ห้อ/หมายเลขเครน, S/N"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {shown.length ? (
              <VehicleTable vehicles={shown} picked={picked} onToggle={toggle} onCriteria={toggleCriteria} />
            ) : (
              <EmptyState title="ไม่พบรถที่ค้นหา" desc="ลองแก้คำค้น เช่น ทะเบียน ประเภท หรือสังกัด" />
            )}
          </div>
        </div>

        <div className="actions">
          {plan && (
            <button className="btn btn-td" style={{ marginRight: "auto" }} onClick={() => setCancelOpen(true)}>
              <span className="ms">cancel</span> ยกเลิกแผน
            </button>
          )}
          <Link className="btn btn-g" href={back}>
            ย้อนกลับ
          </Link>
          {(!plan || plan.status === "DRAFT") && (
            <button className="btn btn-s" onClick={() => save("DRAFT")}>
              บันทึกร่าง
            </button>
          )}
          {/* แผนใหม่/ร่าง → ส่งให้หัวหน้าอนุมัติ (PENDING) · แผนที่อนุมัติแล้วแก้ได้โดยคงสถานะเดิม (รอยืนยันกับ กฟภ.) */}
          <button className="btn btn-p" onClick={() => save(plan?.status === "ACTIVE" ? "ACTIVE" : "PENDING")}>
            {plan?.status === "ACTIVE" ? "บันทึกการแก้ไข" : "ส่งอนุมัติ"}
          </button>
        </div>
      </div>

      {cancelOpen && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setCancelOpen(false)}>
          <div className="modal md" role="dialog" aria-modal="true" aria-labelledby="cancel-title">
            <div className="modal-hd">
              <div className="modal-hd-c">
                <h2 id="cancel-title">ยกเลิกแผน Overhaul</h2>
                <button className="btn btn-t btn-icon" onClick={() => setCancelOpen(false)} aria-label="ปิด">
                  <span className="ms">close</span>
                </button>
              </div>
            </div>
            <div className="modal-bd">
              <div className="f">
                <label htmlFor="cancel-reason">ระบุเหตุผล</label>
                <textarea
                  id="cancel-reason"
                  rows={4}
                  placeholder="ระบุเหตุผลที่ยกเลิกแผน…"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-ft">
              <div className="modal-ft-a">
                <div className="modal-ft-r">
                  <button className="btn btn-s" onClick={() => setCancelOpen(false)}>
                    ปิด
                  </button>
                  <button className="btn btn-d" disabled={!cancelReason.trim()} onClick={cancelPlan}>
                    ยืนยันยกเลิกแผน
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
