/** Figma: Badge › `Pill outline` (สีตามสถานะ) — ป้ายสถานะแผน P1–P3 และงานรายคัน V1–V11
 *  ข้อความ/สีจาก OH2_PLAN · OH2_JOB (ร่าง Diagram/01-บำรุงรักษาตามวาระ/12-overhaul-สถานะ.md)
 *  ค่าเทียบ components.css .badge + .b-* (ผ่าน <Badge>) */
import { OH2_JOB, OH2_PLAN } from "@/lib/mock/data";
import type { JobStage, PlanStatus } from "@/lib/mock/types";
import { Badge } from "./Badge";

export function PlanStatusBadge({ status, className }: { status: PlanStatus; className?: string }) {
  const [text, tone] = OH2_PLAN[status];
  return <Badge tone={tone} className={className}>{text}</Badge>;
}

export function JobStatusBadge({ stage, className }: { stage: JobStage; className?: string }) {
  const [text, tone] = OH2_JOB[stage];
  return <Badge tone={tone} className={className}>{text}</Badge>;
}

export const planStatusText = (s: PlanStatus) => OH2_PLAN[s][0];
export const jobStageText = (s: JobStage) => OH2_JOB[s][0];
