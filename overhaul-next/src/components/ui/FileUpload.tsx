"use client";
/** Figma: `File upload` = `_File upload base` (กล่องลากวาง) + `_File upload item base` (State=Completed|Error) + `_File icon` / `Featured icon` sm Gray
 *  + `Create rental contract` (5.1) / `Modal / Edit Job` Content=Document (5.5) ของ UI Release#2
 *  ค่าเทียบ components.css .fu .fu-tx .fu-list .fu-item .fu-item-tx .fu-item-act .fu-item.err .ficon.sm.gray
 *  userflow: สูงสุด 10 ไฟล์ · PDF, JPEG · ดาวน์โหลดได้ · ดูตัวอย่างได้ (กดชื่อไฟล์) · ไฟล์ชนิดอื่นขึ้นรายการผิดพลาด (ไม่นับรวม)
 *  กล่องอัปโหลด 1 คอลัมน์เสมอ (เจ้าของงานเคาะ 19 ต.ค. 2569) · Progress bar ปิด (ต้นแบบไม่อัปโหลดจริง)
 *  readOnly = รายการอย่างเดียว (หน้ารายละเอียด) ปุ่มดาวน์โหลดอย่างเดียว · ว่าง = "—" */
import { useId, useRef, useState, type ReactNode } from "react";
import { OH2_FILE_ACCEPT, OH2_MAX_FILES } from "@/lib/mock/data";
import { fmtSize } from "@/lib/mock/format";
import type { FileRef } from "@/lib/mock/types";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { useToast } from "./Toast";
import { cx } from "./cx";

export interface FileUploadProps {
  files: FileRef[];
  onChange?: (files: FileRef[]) => void;
  label?: ReactNode;
  optional?: boolean;
  /** ข้อความผิดพลาดของช่อง (เช่น "กรุณาแนบไฟล์") — ขอบกล่องแดง */
  error?: ReactNode;
  readOnly?: boolean;
  maxFiles?: number;
  /** ค่าตั้งต้น PDF/JPEG */
  accept?: string;
  /** ค่าตั้งต้น: toast "ต้นแบบ — ยังไม่มีไฟล์จริง" */
  onPreview?: (f: FileRef) => void;
  onDownload?: (f: FileRef) => void;
  className?: string;
}

const okType = (name: string) => /\.(pdf|jpe?g)$/i.test(name);

function FileItem({ f, error, onPreview, onDownload, onRemove }: { f: FileRef; error?: string; onPreview?: () => void; onDownload?: () => void; onRemove?: () => void }) {
  return (
    <div className={cx("flex items-start gap-3 rounded-md border bg-white p-4", error ? "border-error-500" : "border-gray-300")}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Icon name="draft" size={24} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <b className="truncate text-sm leading-[21px] font-semibold text-gray-600">
          {onPreview && !error ? (
            <button type="button" onClick={onPreview} title="ดูตัวอย่าง" className="max-w-full cursor-pointer truncate text-left hover:underline">
              {f.name}
            </button>
          ) : (
            f.name
          )}
        </b>
        <small className={cx("text-xs", error ? "text-error-600" : "text-gray-600")}>{error ?? fmtSize(f.size)}</small>
      </span>
      <span className="-mt-2 -mr-2 flex shrink-0">
        {onDownload && !error && <Button variant="tertiary" iconOnly="download" aria-label={`ดาวน์โหลด ${f.name}`} onClick={onDownload} />}
        {onRemove && <Button variant="tertiary" iconOnly="delete" aria-label={`ลบ ${f.name}`} onClick={onRemove} />}
      </span>
    </div>
  );
}

export function FileUpload({
  files, onChange, label, optional, error, readOnly, maxFiles = OH2_MAX_FILES, accept = OH2_FILE_ACCEPT, onPreview, onDownload, className,
}: FileUploadProps) {
  const toast = useToast();
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [bad, setBad] = useState<FileRef[]>([]);
  const [drag, setDrag] = useState(false);
  const full = files.length >= maxFiles;
  const preview = onPreview ?? ((f: FileRef) => toast.success("ดูตัวอย่าง " + f.name, "ต้นแบบ — ยังไม่มีไฟล์จริง"));
  const download = onDownload ?? ((f: FileRef) => toast.success("ดาวน์โหลด " + f.name, "ต้นแบบ — ยังไม่มีไฟล์จริง"));

  const add = (list: FileList | null) => {
    if (!list || readOnly) return;
    const next = [...files];
    const rejected: FileRef[] = [];
    for (const f of Array.from(list)) {
      if (!okType(f.name)) {
        rejected.push({ name: f.name, size: f.size });
        continue;
      }
      if (next.length >= maxFiles) break;
      next.push({ name: f.name, size: f.size });
    }
    if (rejected.length) setBad((b) => [...b, ...rejected]);
    if (next.length !== files.length) onChange?.(next);
  };

  if (readOnly) {
    return (
      <div className={className}>
        {label && <div className="mb-2 text-sm font-semibold text-black">{label}</div>}
        {files.length ? (
          <div className="flex flex-col gap-2">
            {files.map((f, i) => (
              <FileItem key={i} f={f} onPreview={() => preview(f)} onDownload={() => download(f)} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">—</div>
        )}
      </div>
    );
  }

  return (
    <div className={cx("min-w-0", className)}>
      {label && (
        <div id={id + "-l"} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {optional && <small className="text-sm font-normal text-gray-500"> (ถ้ามี)</small>}
        </div>
      )}
      <label
        aria-labelledby={label ? id + "-l" : undefined}
        aria-disabled={full}
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (!full) add(e.dataTransfer.files);
        }}
        className={cx(
          "relative m-0 flex w-full flex-col items-center gap-3 rounded-md border p-4 text-center transition-[border-color,box-shadow] duration-150",
          full ? "cursor-not-allowed bg-gray-50" : "cursor-pointer bg-white hover:border-brand-800 focus-within:border-brand-800 focus-within:shadow-ring",
          error ? "border-error-500" : drag ? "border-brand-800" : "border-gray-300",
        )}
      >
        <input
          ref={input}
          type="file"
          multiple
          accept={accept}
          disabled={full}
          className="absolute size-px opacity-0"
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <Icon name="cloud_upload" size={24} />
        </span>
        <span className="flex flex-col gap-1 text-sm text-gray-600">
          <span>
            <b className="font-semibold text-brand-900">คลิกเพื่อเลือกไฟล์</b> หรือลากไฟล์มาวางบริเวณนี้
          </span>
          <small className="text-xs">
            PDF, JPG · สูงสุด {maxFiles} ไฟล์ · {full ? `ครบ ${maxFiles} ไฟล์แล้ว` : `${files.length}/${maxFiles} ไฟล์`}
          </small>
        </span>
      </label>
      {error && <p className="mt-1.5 text-sm text-error-600" role="alert">{error}</p>}
      {(files.length > 0 || bad.length > 0) && (
        <div className="mt-2 flex flex-col gap-2">
          {files.map((f, i) => (
            <FileItem
              key={"f" + i}
              f={f}
              onPreview={() => preview(f)}
              onDownload={() => download(f)}
              onRemove={() => onChange?.(files.filter((_, j) => j !== i))}
            />
          ))}
          {bad.map((f, i) => (
            <FileItem key={"b" + i} f={f} error="อัปโหลดไม่สำเร็จ — รับเฉพาะไฟล์ PDF หรือ JPG" onRemove={() => setBad((b) => b.filter((_, j) => j !== i))} />
          ))}
        </div>
      )}
    </div>
  );
}

/** สำหรับแกลเลอรี: แสดงรายการผิดพลาดตั้งต้น (ปกติเกิดจากผู้ใช้เลือกไฟล์ผิดชนิด) */
export function FileErrorItem({ name }: { name: string }) {
  return <FileItem f={{ name, size: 0 }} error="อัปโหลดไม่สำเร็จ — รับเฉพาะไฟล์ PDF หรือ JPG" onRemove={() => {}} />;
}
