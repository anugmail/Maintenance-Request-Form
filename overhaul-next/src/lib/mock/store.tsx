"use client";
/* MockStoreProvider — state ร่วมของทุกหน้า เก็บใน localStorage คีย์ oh2-next-v1
   - hydration-safe: static export prerender ไม่มี localStorage ⇒ ready=false จนกว่าจะโหลดเสร็จบน client
     (ใช้ <StoreGate> ห่อเนื้อหาที่อ่าน state — แสดงโครงหน้าเบาๆ ระหว่างรอ)
   - "จำลองบันทึกไม่สำเร็จ" (ช่องติ๊กในแถบ Prototype ของ HTML mock) = simulateFailure
     เปิดอยู่ ⇒ action ที่บันทึกทุกตัวคืน { ok:false, error:'general error' } และไม่แก้ข้อมูล
     หน้าจอแสดง toast.error(result.error) */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ensureJobs, fillJob, findPlan, findPo, jobKey, nextPlanId, nextPoId, planCars, planStatus, seedState } from "./logic";
import { todayIso } from "./format";
import type { Job, MockState, Plan, PlanDocs, PlanStatus, Po, PoDocs } from "./types";

export const STORE_KEY = "oh2-next-v1";

export type SaveResult<T = void> = { ok: true; value: T } | { ok: false; error: string };

/** ข้อมูลที่ฟอร์มสร้าง/แก้ไขแผนส่งมา (เลขแผน + วันที่สร้าง store ออกให้) */
export interface PlanInput {
  name: string;
  year: number;
  budget: number;
  wbs: string;
  net: string;
  act: string;
  docs: PlanDocs;
}

/** ข้อมูลที่ฟอร์มสร้าง/แก้ไข PO ส่งมา (เลข PO store ออกให้) */
export interface PoInput {
  name: string;
  vendor: number;
  cars: string[];
  docs: PoDocs;
}

export interface MockStore {
  /** false ระหว่าง prerender/ก่อนอ่าน localStorage */
  ready: boolean;
  state: MockState;
  simulateFailure: boolean;
  setSimulateFailure(on: boolean): void;

  /* ---- อ่าน ---- */
  getPlan(id: string | null | undefined): Plan | undefined;
  getPo(planId: string | null | undefined, poId: string | null | undefined): Po | undefined;
  planStatus(plan: Plan): PlanStatus;
  planCars(plan: Plan): string[];
  /** งานรายคัน (เติมรายละเอียดตามขั้นแล้ว — oh2Job) */
  getJob(planId: string, carId: string): Job;

  /* ---- เขียน (ทุกตัวเคารพ simulateFailure) ---- */
  createPlan(input: PlanInput): SaveResult<Plan>;
  updatePlan(id: string, patch: Partial<PlanInput>): SaveResult<Plan>;
  /** ลบแผน + PO ทั้งหมดในแผน + งานรายคันของแผน */
  deletePlan(id: string): SaveResult;
  /** สร้าง PO + เปิดงานรายคัน V1 ให้รถที่เลือก */
  createPo(planId: string, input: PoInput): SaveResult<Po>;
  updatePo(planId: string, poId: string, patch: Partial<PoInput>): SaveResult<Po>;
  /** ลบ PO + งานของรถที่ไม่อยู่ใน PO อื่นของแผนแล้ว */
  deletePo(planId: string, poId: string): SaveResult;
  /** แก้งานรายคัน — patch ทับบนงานที่เติมรายละเอียดแล้ว */
  updateJob(planId: string, carId: string, patch: Partial<Job>): SaveResult<Job>;
  /** คืนข้อมูลตัวอย่าง (seed) — ไม่สนใจ simulateFailure */
  resetAll(): void;
}

const Ctx = createContext<MockStore | null>(null);

interface Persisted {
  data: MockState;
  simulateFailure: boolean;
}

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Persisted;
      if (p && p.data && Array.isArray(p.data.plans)) return { data: p.data, simulateFailure: !!p.simulateFailure };
    }
  } catch {
    /* localStorage ใช้ไม่ได้ / ข้อมูลเสีย → เริ่มจาก seed */
  }
  return { data: seedState(), simulateFailure: false };
}

function save(p: Persisted) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(p));
  } catch {
    /* โหมดส่วนตัว/เต็ม — ข้อมูลอยู่แค่ในหน่วยความจำ */
  }
}

const FAIL = { ok: false, error: "general error" } as const;

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<MockState>(() => seedState());
  const [simulateFailure, setSimFail] = useState(false);
  const ref = useRef<Persisted>({ data: state, simulateFailure: false });

  useEffect(() => {
    const p = load();
    ref.current = p;
    setState(p.data);
    setSimFail(p.simulateFailure);
    setReady(true);
    save(p);
  }, []);

  const commit = useCallback((data: MockState) => {
    ref.current = { ...ref.current, data };
    setState(data);
    save(ref.current);
  }, []);

  const setSimulateFailure = useCallback((on: boolean) => {
    ref.current = { ...ref.current, simulateFailure: on };
    setSimFail(on);
    save(ref.current);
  }, []);

  const api = useMemo<MockStore>(() => {
    const cur = () => ref.current.data;
    const failing = () => ref.current.simulateFailure;
    const replacePlan = (s: MockState, plan: Plan): MockState => ({ ...s, plans: s.plans.map((p) => (p.id === plan.id ? plan : p)) });

    return {
      ready,
      state,
      simulateFailure,
      setSimulateFailure,
      getPlan: (id) => findPlan(state, id),
      getPo: (planId, poId) => findPo(findPlan(state, planId), poId),
      planStatus: (plan) => planStatus(state, plan),
      planCars,
      getJob: (planId, carId) => fillJob(state.jobs[jobKey(planId, carId)]),

      createPlan(input) {
        if (failing()) return FAIL;
        const s = cur();
        const plan: Plan = { id: nextPlanId(s), created: todayIso(), pos: [], ...input };
        commit({ ...s, plans: [plan, ...s.plans] });
        return { ok: true, value: plan };
      },
      updatePlan(id, patch) {
        if (failing()) return FAIL;
        const s = cur();
        const old = findPlan(s, id);
        if (!old) return { ok: false, error: "ไม่พบแผนนี้" };
        const plan = { ...old, ...patch };
        commit(replacePlan(s, plan));
        return { ok: true, value: plan };
      },
      deletePlan(id) {
        if (failing()) return FAIL;
        const s = cur();
        const jobs = Object.fromEntries(Object.entries(s.jobs).filter(([k]) => !k.startsWith(id + ":")));
        commit({ plans: s.plans.filter((p) => p.id !== id), jobs });
        return { ok: true, value: undefined };
      },
      createPo(planId, input) {
        if (failing()) return FAIL;
        const s = cur();
        const plan = findPlan(s, planId);
        if (!plan) return { ok: false, error: "ไม่พบแผนนี้" };
        const po: Po = { id: nextPoId(s), ...input };
        const next = replacePlan(s, { ...plan, pos: [...plan.pos, po] });
        commit({ ...next, jobs: ensureJobs(next.jobs, planId, po.cars) });
        return { ok: true, value: po };
      },
      updatePo(planId, poId, patch) {
        if (failing()) return FAIL;
        const s = cur();
        const plan = findPlan(s, planId);
        const old = findPo(plan, poId);
        if (!plan || !old) return { ok: false, error: "ไม่พบ Purchase Order นี้" };
        const po = { ...old, ...patch };
        const next = replacePlan(s, { ...plan, pos: plan.pos.map((o) => (o.id === poId ? po : o)) });
        commit({ ...next, jobs: ensureJobs(next.jobs, planId, po.cars) });
        return { ok: true, value: po };
      },
      deletePo(planId, poId) {
        if (failing()) return FAIL;
        const s = cur();
        const plan = findPlan(s, planId);
        if (!plan) return { ok: false, error: "ไม่พบแผนนี้" };
        const nextPlan = { ...plan, pos: plan.pos.filter((o) => o.id !== poId) };
        const keep = new Set(planCars(nextPlan));
        const jobs = Object.fromEntries(
          Object.entries(s.jobs).filter(([k]) => !k.startsWith(planId + ":") || keep.has(k.slice(planId.length + 1))),
        );
        commit({ plans: s.plans.map((p) => (p.id === planId ? nextPlan : p)), jobs });
        return { ok: true, value: undefined };
      },
      updateJob(planId, carId, patch) {
        if (failing()) return FAIL;
        const s = cur();
        const k = jobKey(planId, carId);
        const job: Job = { ...fillJob(s.jobs[k]), ...patch };
        commit({ ...s, jobs: { ...s.jobs, [k]: job } });
        return { ok: true, value: job };
      },
      resetAll() {
        commit(seedState());
      },
    };
  }, [ready, state, simulateFailure, setSimulateFailure, commit]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

/** ใช้ใน client component ใต้ <MockStoreProvider> */
export function useMockStore(): MockStore {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMockStore ต้องอยู่ใต้ <MockStoreProvider>");
  return v;
}

/** แสดง children เมื่อ store โหลดจาก localStorage แล้ว — ระหว่างรอแสดงโครงหน้าเบาๆ */
export function StoreGate({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const { ready } = useMockStore();
  if (!ready) return <>{fallback ?? <StoreSkeleton />}</>;
  return <>{children}</>;
}

/** โครงหน้าระหว่างโหลด (ไม่ใช่ component ไลบรารี — แค่บล็อกเทาจาง) */
export function StoreSkeleton() {
  return (
    <div aria-busy="true" aria-label="กำลังโหลดข้อมูลจำลอง" className="flex animate-pulse flex-col gap-6 py-2">
      <div className="h-4 w-48 rounded-xs bg-gray-100" />
      <div className="h-10 w-80 max-w-full rounded-md bg-gray-100" />
      <div className="h-40 w-full rounded-md bg-gray-50" />
    </div>
  );
}
