"use client";

// state ของ Overhaul v2 เก็บใน localStorage (คนละ key กับแผน Overhaul เดิม) — ยังไม่มี backend
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { nowStamp, seed, type Job, type OvhState } from "./overhaulV2";

const KEY = "vms-overhaul-v2";

interface Store {
  ready: boolean;
  state: OvhState;
  // แก้ไขงานรายคัน — fn ได้สำเนา (deep clone) ไปแก้ตรงๆ · log = ข้อความลงประวัติการดำเนินการ
  mutate: (vid: string, fn: (j: Job, s: OvhState) => string | void) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function OverhaulV2Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OvhState>(seed);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {}
  }, [state, ready]);

  const mutate = useCallback((vid: string, fn: (j: Job, s: OvhState) => string | void) => {
    setState((prev) => {
      const s = structuredClone(prev);
      const j = s.jobs[vid];
      const log = fn(j, s);
      if (log) j.history.push({ at: nowStamp(), text: log });
      return s;
    });
  }, []);

  const reset = useCallback(() => setState(seed()), []);

  return <Ctx.Provider value={{ ready, state, mutate, reset }}>{children}</Ctx.Provider>;
}

export function useOverhaulV2() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useOverhaulV2 ต้องอยู่ใน OverhaulV2Provider");
  return s;
}
