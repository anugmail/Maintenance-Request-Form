"use client";
/** Figma: `Side panel` (header + footer) / `Bottom sheet` Type=Filter (ผ่าน <FilterPanel>) + ช่องตาม userflow —
 *    `Input dropdown` (งบประมาณ · ศูนย์ต้นทุน) · `Checkbox with badge` + `Pill outline` (สถานะ) · `Input dropdown` Leading icon=search + `Dropdown list` (รถ)
 *  ตาม `Filter Side panel` ของ UI Release#2 หน้า 5.1 Rental Contract Management
 *  พอร์ตจาก design-mock/overhaul-v2-01-plans.html (#fpanel): ค่าในแผงเป็นร่าง — กด "ตกลง" ถึงใช้ · "ล้างตัวกรอง" ล้างเฉพาะร่าง · "ยกเลิก" ทิ้งร่าง
 *  ป้ายตัวกรองที่ใช้อยู่ (`Badge outline with remove icon`) สร้างด้วย planFilterChips() */
import { useState } from "react";
import { CheckboxList, Combobox, FilterPanel, FilterSection, PlanStatusBadge, SelectField, type FilterChip } from "@/components/ui";
import { OH2_BUDGET_RANGES, OH2_PLAN, OH2_VEHICLES, PLAN_STATUSES, type PlanStatus } from "@/lib/mock";

export interface PlanFilterValue {
  /** ช่วงวงเงิน "a-b" ตาม OH2_BUDGET_RANGES ("" = ทั้งหมด) */
  budget: string;
  status: PlanStatus[];
  /** id รถ */
  car: string;
  /** เลขศูนย์ต้นทุน (WBS) */
  wbs: string;
}

export const EMPTY_PLAN_FILTER: PlanFilterValue = { budget: "", status: [], car: "", wbs: "" };

/** ป้ายของตัวกรองที่ใช้อยู่ — 1 ป้ายต่อเงื่อนไข (สถานะ 1 ป้ายต่อค่า) · key = "budget" | "status:P1" | "car" | "wbs" */
export function planFilterChips(f: PlanFilterValue): FilterChip[] {
  const chips: FilterChip[] = [];
  if (f.budget) chips.push({ key: "budget", label: OH2_BUDGET_RANGES.find((r) => r.value === f.budget)?.label ?? f.budget });
  f.status.forEach((s) => chips.push({ key: "status:" + s, label: OH2_PLAN[s][0] }));
  if (f.car) chips.push({ key: "car", label: OH2_VEHICLES.find((v) => v.id === f.car)?.plate ?? f.car });
  if (f.wbs) chips.push({ key: "wbs", label: f.wbs });
  return chips;
}

/** เอาเงื่อนไขของป้ายที่กด ✕ ออก */
export function removePlanFilterChip(f: PlanFilterValue, key: string): PlanFilterValue {
  if (key.startsWith("status:")) return { ...f, status: f.status.filter((s) => s !== key.slice(7)) };
  return { ...f, [key]: "" };
}

const CAR_OPTIONS = OH2_VEHICLES.map((v) => ({ value: v.id, label: v.plate, sub: `${v.brand} · ${v.type}` }));
const STATUS_OPTIONS = PLAN_STATUSES.map((s) => ({ value: s, label: <PlanStatusBadge status={s} />, text: OH2_PLAN[s][0] }));

/** เปิดใหม่ทุกครั้งให้ mount ใหม่ (render เฉพาะตอน open) ⇒ ร่างเริ่มจากค่าที่ใช้อยู่ */
export function PlanFilter({
  value, wbsOptions, onApply, onClose,
}: {
  value: PlanFilterValue;
  wbsOptions: string[];
  onApply: (v: PlanFilterValue) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<PlanFilterValue>(value);
  const set = (patch: Partial<PlanFilterValue>) => setDraft((d) => ({ ...d, ...patch }));
  return (
    <FilterPanel open onClose={onClose} onApply={() => onApply(draft)} onClear={() => setDraft(EMPTY_PLAN_FILTER)}>
      <SelectField
        label="งบประมาณ"
        placeholder="ทั้งหมด"
        value={draft.budget}
        onChange={(e) => set({ budget: e.target.value })}
        options={OH2_BUDGET_RANGES.map((r) => ({ value: r.value, label: r.label }))}
      />
      <FilterSection label="สถานะ">
        <CheckboxList value={draft.status} onChange={(v) => set({ status: v as PlanStatus[] })} options={STATUS_OPTIONS} />
      </FilterSection>
      <Combobox label="รถ" placeholder="ค้นหาทะเบียน" value={draft.car} onChange={(v) => set({ car: v })} options={CAR_OPTIONS} />
      <SelectField
        label="ศูนย์ต้นทุน"
        placeholder="ทั้งหมด"
        value={draft.wbs}
        onChange={(e) => set({ wbs: e.target.value })}
        options={wbsOptions.map((w) => ({ value: w, label: w }))}
      />
    </FilterPanel>
  );
}
