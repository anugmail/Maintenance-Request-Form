/* ตรรกะของ mock — พอร์ตจาก design-mock/overhaul-v2-mock.js (oh2Seed · oh2PlanCars · oh2PlanStatus ·
   oh2NextPlanId · oh2NextPoId · oh2EnsureJobs · oh2Job) เป็นฟังก์ชันบริสุทธิ์ (ไม่แก้ state ที่รับเข้ามา) */
import { OH2_CHECKLIST, OH2_STEP_OF, OH2_VEHICLES, OH2_VENDORS, OH2_STAFF } from "./data";
import { addDays } from "./format";
import type { Appointment, Job, JobStage, MockState, Plan, PlanDocs, PlanStatus, Po, StoredJob } from "./types";

export const jobKey = (planId: string, carId: string) => `${planId}:${carId}`;

/** seed ชุดเดียวกับ oh2Seed() — 7 แผน · PO 6 ใบ · งานรายคันอยู่คนละขั้นให้เห็นสถานะหลายแบบ */
export function seedState(): MockState {
  const po = (id: string, name: string, vendor: number, cars: string[]): Po => ({
    id, name, vendor, cars,
    docs: { order: [{ name: `ใบสั่งจ้าง-${id}.pdf`, size: 512000 }], other: [] },
  });
  /* เอกสารตัวอย่างของแผน — ชื่อไฟล์/ขนาดสมมติ (ให้หน้าแก้ไขมีไฟล์เดิมให้เห็น) */
  const docs = (id: string): PlanDocs => ({
    approve: [{ name: `หนังสืออนุมัติหลักการ-${id}.pdf`, size: 842000 }],
    budget: [{ name: `เอกสารอนุมัติงบ-${id}.pdf`, size: 615000 }],
    other: [],
  });
  const plan = (id: string, name: string, year: number, wbs: string, net: string, act: string, budget: number, created: string, pos: Po[]): Plan =>
    ({ id, name, year, wbs, net, act, budget, created, pos, docs: docs(id) });

  const s: MockState = {
    plans: [
      plan("123456", "Overhaul ประจำปีงบ 2569 — รถเครน", 2569, "C-69-OH-0101", "60001234", "0010", 10000000, "2026-08-12",
        [po("PO-690101", "ซ่อมระบบเครื่องยนต์", 0, ["c1", "c3"]), po("PO-690102", "ซ่อมระบบไฮดรอลิกเครน", 0, ["c6"]), po("PO-690103", "ซ่อมระบบแอร์", 1, ["c1"])]),
      plan("123457", "Overhaul ประจำปีงบ 2569 — รถกระเช้า", 2569, "C-69-OH-0102", "60001235", "0010", 8500000, "2026-08-20",
        [po("PO-690201", "ซ่อมระบบกระเช้าและช่วงล่าง", 1, ["c2", "c5", "c8"])]),
      plan("123458", "Overhaul ประจำปีงบ 2569 — รถเจาะหลุม", 2569, "C-69-OH-0103", "60001236", "0020", 6200000, "2026-09-02", []),
      plan("123459", "Overhaul ประจำปีงบ 2570 — รถเครน กฟน.1", 2570, "C-70-OH-0001", "60002101", "0010", 12400000, "2026-10-01", []),
      plan("123401", "Overhaul ประจำปีงบ 2568 — รถเครน", 2568, "C-68-OH-0101", "60000981", "0010", 9800000, "2025-07-15",
        [po("PO-680101", "ซ่อมระบบเครื่องยนต์และเกียร์", 0, ["c4", "c7"])]),
      plan("123402", "Overhaul ประจำปีงบ 2568 — รถกระเช้า", 2568, "C-68-OH-0102", "60000982", "0020", 4300000, "2025-08-01",
        [po("PO-680201", "ซ่อมระบบกระเช้า", 2, ["c5"])]),
      plan("123460", "Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้", 2570, "C-70-OH-0002", "60002102", "0030", 21500000, "2026-10-10",
        [po("PO-700201", "ซ่อมช่วงล่างและระบบเบรก", 2, ["c8"])]),
    ],
    jobs: {},
  };
  const st: Record<string, Record<string, JobStage>> = {
    "123456": { c1: "V5", c3: "V2", c6: "V1" },
    "123457": { c2: "V8", c5: "V3", c8: "V10" },
    "123401": { c4: "V11", c7: "V11" },
    "123402": { c5: "V11" },
    "123460": { c8: "V1" },
  };
  for (const [pid, m] of Object.entries(st)) for (const [cid, v] of Object.entries(m)) s.jobs[jobKey(pid, cid)] = { stage: v };
  return s;
}

/* ---------- lookup ---------- */
export const findPlan = (s: MockState, id: string | null | undefined) => s.plans.find((p) => p.id === id);
export const findPo = (plan: Plan | undefined, poId: string | null | undefined) => plan?.pos.find((o) => o.id === poId);
export const findCar = (id: string | null | undefined) => OH2_VEHICLES.find((v) => v.id === id);
export const findStaff = (id: string | null | undefined) => OH2_STAFF.find((v) => v.id === id);
export const vendorOf = (po: Po | undefined) => (po ? OH2_VENDORS[po.vendor] : undefined);

/** รถทั้งหมดในแผน (ไม่ซ้ำ) */
export function planCars(p: Plan): string[] {
  return [...new Set(p.pos.flatMap((x) => x.cars))];
}

/** สถานะแผน: ไม่มี PO = P1 · รถทุกคันปิดงาน (V11) = P3 · อื่นๆ = P2 */
export function planStatus(s: MockState, p: Plan): PlanStatus {
  if (!p.pos.length) return "P1";
  const cars = planCars(p);
  return cars.length && cars.every((c) => s.jobs[jobKey(p.id, c)]?.stage === "V11") ? "P3" : "P2";
}

/** PO ที่มีรถคันนี้อยู่ (คันเดียวอยู่ได้หลาย PO ในแผนเดียว — seed แผน 123456 รถ c1) */
export function posOfCar(p: Plan, carId: string): Po[] {
  return p.pos.filter((o) => o.cars.includes(carId));
}

/** เลขแผนถัดไป = เลขมากสุด + 1 */
export function nextPlanId(s: MockState): string {
  return String(Math.max(0, ...s.plans.map((p) => Number(p.id) || 0)) + 1);
}

/** เลข PO ใหม่ — ต่อจากเลขมากสุดในทุกแผน (PO-<เลข 6 หลัก>) */
export function nextPoId(s: MockState): string {
  const n = Math.max(0, ...s.plans.flatMap((p) => p.pos.map((o) => Number(String(o.id).replace(/\D/g, "")) || 0)));
  return "PO-" + String(n + 1).padStart(6, "0");
}

/** งานรายคันเริ่มที่ V1 เมื่อรถถูกเลือกเข้า PO (คืน jobs ชุดใหม่) */
export function ensureJobs(jobs: MockState["jobs"], planId: string, cars: string[]): MockState["jobs"] {
  const next = { ...jobs };
  for (const c of cars) {
    const k = jobKey(planId, c);
    if (!next[k]) next[k] = { stage: "V1" };
  }
  return next;
}

/** ขั้น 1–6 ของสถานะ */
export const stepOf = (stage: JobStage) => OH2_STEP_OF[stage];

/* ---------- งานรายคัน: เติมรายละเอียดตัวอย่างตามขั้น (oh2Job) ----------
   seed เก็บแค่ stage — เปิดหน้างานขั้นไหนก็เห็นข้อมูลที่ควรมีถึงขั้นนั้น · วันที่อิง "วันนี้"
   ต่างจากต้นฉบับ: ไม่แก้ state เดิม (คืนสำเนา) — store บันทึกสำเนานี้ตอน updateJob */
export function fillJob(stored: StoredJob | undefined): Job {
  const j: Job = { logs: [], safety: [], parts: [], partFiles: [], ...(stored ?? { stage: "V1" }) } as Job;
  const n = Number(j.stage.slice(1));
  const appt = (days: number, ok: boolean | undefined): Appointment => ({
    from: addDays(days), to: addDays(days + 2), coord: "s1", remark: "", sentAt: addDays(days - 7),
    reply: ok === undefined ? null : {
      ok,
      remark: ok ? "" : "วันดังกล่าวรถติดภารกิจซ่อมบำรุงสายส่ง ขอเลื่อนเป็นสัปดาห์ถัดไป",
      at: addDays(days - 5),
    },
  });
  if (n >= 2 && !j.appt) j.appt = appt(n === 2 ? 7 : -60, n === 2 ? undefined : n === 3 ? false : true);
  if (n >= 5 && !j.checkin)
    j.checkin = {
      items: OH2_CHECKLIST.map((label) => ({ label, ok: true, remark: "" })),
      sign: { kbk: { who: "s1", at: addDays(-58) }, unit: { who: "หน่วยงาน", at: addDays(-58) } },
      at: addDays(-58),
    };
  if (n >= 5 && !stored?.logs)
    j.logs = [
      { at: addDays(-50) + "T09:30", note: "รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน" },
      { at: addDays(-35) + "T14:00", note: "เปลี่ยนชุดลูกสูบและแหวน ประกอบกลับ" },
    ].slice(0, n === 5 ? 1 : 2);
  if (n >= 7 && !stored?.safety) j.safety = [{ name: "Safety-Inspection.pdf", size: 420000 }];
  if (n >= 8 && !j.ret) j.ret = appt(n === 8 ? 5 : -3, n === 8 ? undefined : n === 9 ? false : true);
  if (n >= 11 && !stored?.parts) j.parts = [{ name: "ชุดลูกสูบพร้อมแหวน", qty: 6, unit: "ชุด" }, { name: "ปะเก็นฝาสูบ", qty: 1, unit: "ชิ้น" }];
  if (n >= 11 && !j.closedAt) j.closedAt = addDays(-1);
  return j;
}
