"use client";

// state ของต้นแบบเก็บใน localStorage (เหมือนหน้า static อื่นในรีโป) — ยังไม่มี backend
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { SEED_PLANS, type OverhaulPlan } from "./overhaul";

// v2: เพิ่มสถานะ PENDING (รออนุมัติ) — เปลี่ยน key ให้ seed ใหม่โผล่ ไม่ปนข้อมูลชุดเก่า
// v3: ดำเนินการ Overhaul เปลี่ยนเป็น 7 ขั้นแบบงานซ่อม (1 ต.ค. 2569) — โครงข้อมูลรายคันไม่เข้ากับชุดเก่า
const KEY = "vms-overhaul-plans-v3";

type PlanInput = Omit<OverhaulPlan, "id" | "planNo" | "updatedAt">;

interface Store {
  ready: boolean;
  plans: OverhaulPlan[];
  get: (id: string) => OverhaulPlan | undefined;
  create: (p: PlanInput) => OverhaulPlan;
  // touch=false: ไม่ขยับ updatedAt ของแผน — ใช้ตอนบันทึกงานรายคัน (ไม่ใช่การแก้แผน)
  update: (id: string, p: Partial<PlanInput>, touch?: boolean) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

function nextPlanNo(plans: OverhaulPlan[], year: number) {
  const prefix = `OVH-${year}-`;
  const max = plans
    .filter((p) => p.planNo.startsWith(prefix))
    .reduce((m, p) => Math.max(m, Number(p.planNo.slice(prefix.length)) || 0), 0);
  return prefix + String(max + 1).padStart(3, "0");
}

export function PlanStoreProvider({ children }: { children: React.ReactNode }) {
  const [plans, setPlans] = useState<OverhaulPlan[]>(SEED_PLANS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPlans(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(plans));
    } catch {}
  }, [plans, ready]);

  const get = useCallback((id: string) => plans.find((p) => p.id === id), [plans]);

  const create = useCallback(
    (input: PlanInput) => {
      const plan: OverhaulPlan = {
        ...input,
        id: `p${Date.now()}`,
        planNo: nextPlanNo(plans, input.year),
        updatedAt: new Date().toISOString(),
      };
      setPlans((ps) => [plan, ...ps]);
      return plan;
    },
    [plans],
  );

  const update = useCallback((id: string, patch: Partial<PlanInput>, touch = true) => {
    setPlans((ps) =>
      ps.map((p) => (p.id === id ? { ...p, ...patch, ...(touch && { updatedAt: new Date().toISOString() }) } : p)),
    );
  }, []);

  const reset = useCallback(() => setPlans(SEED_PLANS), []);

  return (
    <Ctx.Provider value={{ ready, plans, get, create, update, reset }}>{children}</Ctx.Provider>
  );
}

export function usePlans() {
  const s = useContext(Ctx);
  if (!s) throw new Error("usePlans ต้องอยู่ใน PlanStoreProvider");
  return s;
}
