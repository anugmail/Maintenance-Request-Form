"use client";
/* ขั้น 4 ตรวจสภาพ — upload เอกสาร Safety Inspection (S12 · V6)
 * Figma (Component) VMS Plus: `Section header` · `File upload` Type=Default (1 คอลัมน์ · `_File upload base` + `_File upload item base`) ·
 *   ผ่านแล้ว = รายการไฟล์อย่างเดียว (File upload=false) · `Alert` Success · `Secondary button` / `Primary button` Size=lg
 * UI Release#2: `Create rental contract` (5.1) ส่วนแนบเอกสาร
 * พฤติกรรมตาม HTML: ไฟล์ที่อัปโหลดบันทึกทันที · ยืนยันได้เมื่อมีไฟล์อย่างน้อย 1 ไฟล์ ("กรุณาอัปโหลดเอกสาร Safety Inspection") */
import { useState } from "react";
import { Button, FileUpload } from "@/components/ui";
import { JobAlert, StepActions, StepSection, stageNum, type JobCtx } from "./shared";

export function StepSafety({ ctx }: { ctx: JobCtx }) {
  const { job } = ctx;
  const [err, setErr] = useState("");

  if (stageNum(job.stage) > 6) {
    return (
      <div>
        <StepSection title="เอกสาร Safety Inspection" />
        <FileUpload readOnly files={job.safety} />
        <JobAlert tone="ok" icon="check_circle" className="mt-4">
          ยืนยันการตรวจสอบแล้ว
        </JobAlert>
      </div>
    );
  }

  return (
    <div>
      <StepSection title="เอกสาร Safety Inspection" />
      <FileUpload
        label="อัปโหลดเอกสาร Safety Inspection"
        files={job.safety}
        error={err || undefined}
        onChange={(safety) => {
          setErr("");
          ctx.commit({ safety });
        }}
      />
      <StepActions onBack={ctx.goBack}>
        <Button
          size="lg"
          onClick={() => {
            if (!job.safety.length) return setErr("กรุณาอัปโหลดเอกสาร Safety Inspection");
            ctx.commit({ stage: "V7" }, { ok: "ยืนยันการตรวจสอบสำเร็จ" });
          }}
        >
          ยืนยันการตรวจสอบ
        </Button>
      </StepActions>
    </div>
  );
}
