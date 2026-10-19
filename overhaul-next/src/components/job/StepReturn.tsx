"use client";
/* ขั้น 5 นัดรับรถ (S13 · V7–V9) — ใช้ฟอร์ม/การรอตอบ/ปฏิเสธชุดเดียวกับขั้น 1 (StepAppointment ret) · ชื่ออู่ตั้งต้นจาก PO
 * Figma: `RepairAppointmentStep` (ไฟล์ Maintain-D · RepairMethod=false · กติกา R16/R17) — ดูหัวไฟล์ StepAppointment.tsx
 *   (`Section header` · `Text input` · `Input dropdown` · `Text area` Readonly · `Empty state` · `Content item row` · `Alert` ·
 *   `Secondary button` / `Primary button` Size=lg) · ศูนย์บริการ/อู่ "(ค่าตั้งต้นจาก PO)" */
import { StepAppointment } from "./StepAppointment";
import type { JobCtx } from "./shared";

export function StepReturn({ ctx }: { ctx: JobCtx }) {
  return <StepAppointment ctx={ctx} ret />;
}
