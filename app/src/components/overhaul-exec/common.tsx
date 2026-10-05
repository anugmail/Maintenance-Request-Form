"use client";

// ส่วนที่ใช้ร่วมทุกขั้นของหน้าดำเนินการ Overhaul รายคัน — โครงตามภาพระบบจริง flow/repair:
// หัวข้อส่วนเป็นแถบม่วง (.parts-pane-title) วางเรียงตรงๆ ไม่มีการ์ดครอบ · ข้อมูลยานพาหนะเป็นกล่องเทา (.incident-summary)
import Link from "next/link";
import { fmtDate, fmtNum, fmtTime, type Vehicle } from "@/lib/overhaul";
import { DELIVERERS, RECEIVERS, type SignPair } from "@/lib/overhaulExec";

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="parts-pane-title">{children}</h2>;
}

// แถบปุ่มท้ายขั้น — ปุ่มหลักปิดใช้จนกว่าจะครบ (สิ่งที่ยังขาดอยู่ใน title ของปุ่ม ไม่แสดงเป็นข้อความ — ไม่มีในภาพระบบจริง)
export function StepActions({
  locked,
  blockers,
  confirmLabel,
  onDraft,
  onConfirm,
  extra,
}: {
  locked: boolean;
  blockers: string[];
  confirmLabel: string;
  onDraft?: () => void;
  onConfirm: () => void;
  extra?: React.ReactNode; // ปุ่มเพิ่มเติมก่อนปุ่มหลัก
}) {
  return (
    <>
      <div className="actions">
        <Link className="btn btn-g" href="/overhaul-jobs">
          ย้อนกลับ
        </Link>
        {!locked && (
          <>
            {onDraft && (
              <button className="btn btn-s" onClick={onDraft}>
                บันทึกร่าง
              </button>
            )}
            {extra}
            <button
              className="btn btn-p"
              disabled={blockers.length > 0}
              title={blockers.length ? blockers.join(" · ") : undefined}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </>
        )}
      </div>
    </>
  );
}

// "ข้อมูลยานพาหนะ" — 11 หัวข้อเรียงตามภาพระบบจริง (ขั้นตรวจสภาพก่อน/หลังซ่อม) · กล่องเทา 4 คอลัมน์
// ช่องที่ต้นแบบยังไม่มีข้อมูล (ยี่ห้อ/รุ่นรถยนต์ · รหัสรถ) แสดง "-" แบบระบบจริง
export function VehicleInfoBox({ v }: { v: Vehicle }) {
  const [brand, ...model] = v.equipmentBrand.split(" ");
  const rows: [string, string][] = [
    ["ยี่ห้อรถยนต์", "-"],
    ["รุ่น", "-"],
    ["หมายเลข (S/N)", v.serialNo],
    ["ทะเบียน", v.plate],
    ["รหัสรถ", "-"],
    ["ยี่ห้อเครื่องมือกล", brand],
    ["รุ่นเครื่องมือกล", model.join(" ") || "-"],
    ["หมายเลข HC / เครน", v.equipmentNo],
    ["ชั่วโมงการทำงานเครื่องจักรสะสม", fmtNum(v.machineHours)],
    ["เลขไมล์สะสม", fmtNum(v.odometerKm)],
    ["ใช้งาน ณ สถานที่", v.orgUnit],
  ];
  return (
    <dl className="incident-summary md:grid-cols-4!">
      {rows.map(([l, val]) => (
        <div className="incident-field" key={l}>
          <dt>{l}</dt>
          <dd>{val}</dd>
        </div>
      ))}
    </dl>
  );
}

// ลงนามรับมอบ/ส่งคืนรถ — ผู้ส่งมอบรถ (หน่วยงานเจ้าของรถ) · ผู้รับมอบ (กบค.) + ปุ่ม "เซ็นลงนาม" (ตามภาพระบบจริง)
// ⚠️ ต้นแบบจำลองการเซ็นเป็นการกดปุ่มแล้วบันทึกเวลา — ของจริงต้องเป็นลายเซ็นอิเล็กทรอนิกส์
export function SignBlock({
  id,
  sign,
  locked,
  onChange,
}: {
  id: string;
  sign: SignPair;
  locked: boolean;
  onChange: (s: SignPair) => void;
}) {
  const col = (key: "deliver" | "receive", label: string, options: string[]) => {
    const s = sign[key];
    return (
      <div className="f">
        <label htmlFor={`${id}-${key}`}>{label}</label>
        <select
          id={`${id}-${key}`}
          value={s.by}
          disabled={locked || !!s.signedAt}
          onChange={(e) => onChange({ ...sign, [key]: { by: e.target.value } })}
        >
          {options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <div className="mt-3">
          {s.signedAt ? (
            <span className="badge b-ok">
              <span className="ms">draw</span> ลงนามแล้ว {fmtDate(s.signedAt)} {fmtTime(s.signedAt)}
            </span>
          ) : (
            <button
              type="button"
              className="btn btn-s"
              disabled={locked}
              onClick={() => onChange({ ...sign, [key]: { ...s, signedAt: new Date().toISOString() } })}
            >
              เซ็นลงนาม
            </button>
          )}
        </div>
      </div>
    );
  };
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {col("deliver", "ผู้ส่งมอบรถ", DELIVERERS)}
      {col("receive", "ผู้รับมอบ (กบค.)", RECEIVERS)}
    </div>
  );
}

// แนบภาพ (JO 7.4.2-05) — ต้นแบบเก็บแค่ชื่อไฟล์ · ของจริงอัปขึ้น Object Storage (สเปก 8.1)
export function PhotoAttach({
  id,
  label,
  photos,
  locked,
  onChange,
}: {
  id: string;
  label: string;
  photos: string[];
  locked: boolean;
  onChange: (p: string[]) => void;
}) {
  return (
    <div className="f">
      <label htmlFor={id}>{label}</label>
      {photos.length > 0 && (
        <div className="chips">
          {photos.map((n, i) => (
            <span key={n + i} className="chip cursor-default! gap-1">
              <span className="ms">image</span> {n}
              {!locked && (
                <button
                  type="button"
                  className="btn btn-t btn-icon"
                  aria-label={`ลบ ${n}`}
                  onClick={() => onChange(photos.filter((_, k) => k !== i))}
                >
                  <span className="ms">close</span>
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      {locked ? (
        !photos.length && <span className="text-sm text-[var(--gray-500)]">ไม่มีภาพแนบ</span>
      ) : (
        <input
          id={id}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name);
            onChange([...photos, ...names]);
            e.target.value = "";
          }}
        />
      )}
    </div>
  );
}
