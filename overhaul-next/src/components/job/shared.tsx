"use client";
/* ชิ้นส่วนร่วมของหน้างานรายคัน (S7–S14) — HTML ต้นทาง design-mock/overhaul-v2-06-job.html
 * Figma (Component) VMS Plus:
 *   - JobAlert = `Alert` (Color=Warning|Success|Info · ไอคอนนำ 20) — ค่าเทียบ components.css .note .note-warn .note-ok .note-info
 *     (ชุด UI ยังไม่มี Alert ⇒ ประกอบในหน้านี้ตามค่า .note — รายงานแล้วว่าควรยกขึ้น src/components/ui)
 *   - StepActions = แถว Actions ท้ายหน้า (`Secondary button` "ย้อนกลับ" ซ้าย + `Primary button` ขวา Size=lg) ผ่าน <FooterActions>
 *   - StepSection = `Section header` (Divider=false) — หน้างานรายคันใช้ Section header ทุกหัวข้อ (component-rules §2 แถว "หน้างานรายคัน" รอเคาะ) ·
 *     spaced = หัวข้อที่ 2 ขึ้นไปในขั้น ห่างจากเนื้อหาก่อนหน้า 32 (.sect.mt-8 ของ HTML)
 *   - ErrorText = Helper text State=Error ของ `Input label` (ผ่าน <FieldShell> ไม่มีช่อง)
 * ข้อมูลที่ทุกขั้นใช้ร่วมกันส่งผ่าน JobCtx (ไม่มี context — prop ตรง) */
import type { ReactNode } from "react";
import { Button, FieldShell, FooterActions, Icon, SectionHeader, cx } from "@/components/ui";
import type { Job, JobStage, Po, Vendor } from "@/lib/mock";

/** ผู้แทนหน่วยงานเจ้าของรถ (สมมติ — ลงนามรับรถขั้น 2) */
export const UNIT_STAFF = ["นายประวิทย์ แสงทอง", "นางสาวพิมพ์ชนก ศรีสุข", "นายธนากร บุญมา"];

export interface CommitOpts {
  /** ข้อความ Notification Success */
  ok?: string;
  okSub?: string;
  /** ข้อความ Notification Error (ค่าตั้งต้น = error ของ store "general error") */
  fail?: string;
}

/** ของที่ JobView ส่งให้ทุกขั้น */
export interface JobCtx {
  planId: string;
  carId: string;
  job: Job;
  po: Po;
  vendor: Vendor;
  /** บันทึก patch ลงงาน · เปลี่ยน stage ⇒ ย้ายไปดูขั้นของ stage ใหม่ + เลื่อนจอไปที่ stepper · คืน true เมื่อสำเร็จ */
  commit(patch: Partial<Job>, opts?: CommitOpts): boolean;
  /** ย้อนกลับไปหน้า PO (ถามก่อนถ้าฟอร์มมีการแก้ไข) */
  goBack(): void;
  /** ฟอร์มของขั้นลงทะเบียนตัวตรวจ "มีการแก้ไขไหม" (null = ล้าง) */
  registerDirty(fn: (() => boolean) | null): void;
}

export const stageNum = (s: JobStage) => Number(s.slice(1));

const TONE = {
  warn: "border-warning-200 bg-warning-50 text-warning-800",
  ok: "border-success-200 bg-success-50 text-success-700",
  info: "border-info-200 bg-info-50 text-info-700",
} as const;

/** Figma `Alert` — .note (pad 12 · ขอบ 1 · r8 · 14/20 · gap 12 · ไอคอน 20) */
export function JobAlert({ tone, icon, children, className }: { tone: keyof typeof TONE; icon?: string; children: ReactNode; className?: string }) {
  return (
    <div role={tone === "warn" ? "note" : "status"} className={cx("flex items-start gap-3 rounded-md border p-3 text-sm leading-5", TONE[tone], className)}>
      {icon && <Icon name={icon} size={20} />}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** แถวปุ่มท้ายขั้น: ย้อนกลับซ้าย · ปุ่มทำงานขวา (มือถือแบ่งเท่ากัน) */
export function StepActions({ onBack, children }: { onBack: () => void; children: ReactNode }) {
  return (
    <FooterActions
      className="mt-8"
      left={
        <Button variant="secondary" size="lg" onClick={onBack}>
          ย้อนกลับ
        </Button>
      }
      right={children}
    />
  );
}

/** ข้อความผิดพลาดใต้กลุ่ม (ไม่มีช่องกรอก) เช่น "ยังตรวจไม่ครบ n รายการ" */
export function ErrorText({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <FieldShell error={children} className={className}>
      {null}
    </FieldShell>
  );
}

/** หัวข้อในขั้น — spaced: ห่างก้อนก่อนหน้า 32 (SectionHeader มี mt-2 ในตัว ⇒ เติม 24) */
export function StepSection({ title, right, spaced }: { title: ReactNode; right?: ReactNode; spaced?: boolean }) {
  return (
    <div className={spaced ? "mt-6" : undefined}>
      <SectionHeader title={title} right={right} />
    </div>
  );
}
