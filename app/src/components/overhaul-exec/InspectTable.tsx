// ตารางตรวจสภาพเครื่องมือกล ปกติ/ต้องแก้ไข + หมายเหตุ + เพิ่มรายการเอง — ใช้ทั้งขั้น ① (ก่อน) และ ④ (หลัง)
// ยกจาก preInspectFormHTML ใน mock/Maintenance-Request-Form.html (อิง figma/ตรวจสภาพก่อนซ่อมหน้างาน.svg)
// งานซ่อมใช้ตารางเดียวกันทั้งก่อน/หลังซ่อม — ขั้น ④ ส่ง before มาโชว์ผลตรวจก่อนเทียบทีละข้อ
import { INSPECT_STATUS_LABEL, type InspectItem, type InspectStatus } from "@/lib/overhaulExec";

const STATUSES: InspectStatus[] = ["OK", "FIX"];

interface Props {
  name: string; // prefix ของ radio group — กันชื่อชนกันเมื่อมีหลายตาราง
  items: InspectItem[];
  locked: boolean;
  onChange: (items: InspectItem[]) => void;
  before?: InspectItem[]; // ผลตรวจก่อน Overhaul (ขั้น ④)
}

export const uncheckedCount = (items: InspectItem[]) => items.filter((r) => !r.status || !r.label.trim()).length;

export function InspectTable({ name, items, locked, onChange, before }: Props) {
  const set = (i: number, patch: Partial<InspectItem>) =>
    onChange(items.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  const beforeOf = (label: string) => before?.find((b) => b.label === label)?.status;

  return (
    <>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>รายการ</th>
              {before && <th className="text-center! w-28">ก่อน Overhaul</th>}
              {STATUSES.map((s) => (
                <th key={s} className="text-center! w-28">
                  {INSPECT_STATUS_LABEL[s]}
                </th>
              ))}
              <th>หมายเหตุ</th>
              {!locked && <th className="w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((r, i) => {
              const b = before && beforeOf(r.label);
              return (
                <tr key={i}>
                  <td>
                    {r.custom && !locked ? (
                      <input
                        type="text"
                        className="tbl-row-label"
                        placeholder="ระบุรายการเพิ่มเติม"
                        aria-label={`ชื่อรายการที่ ${i + 1}`}
                        value={r.label}
                        onChange={(e) => set(i, { label: e.target.value })}
                      />
                    ) : (
                      `${i + 1}. ${r.label}`
                    )}
                  </td>
                  {before && (
                    <td className="text-center">
                      {b ? (
                        <span className={`badge ${b === "OK" ? "b-ok" : "b-out"}`}>{INSPECT_STATUS_LABEL[b]}</span>
                      ) : (
                        <span className="cell-sub">—</span>
                      )}
                    </td>
                  )}
                  {STATUSES.map((s) => (
                    <td key={s} className="text-center">
                      <input
                        type="radio"
                        name={`${name}-${i}`}
                        aria-label={`${r.label || `รายการที่ ${i + 1}`} — ${INSPECT_STATUS_LABEL[s]}`}
                        checked={r.status === s}
                        disabled={locked}
                        onChange={() => set(i, { status: s })}
                      />
                    </td>
                  ))}
                  <td>
                    {locked ? (
                      r.note || <span className="cell-sub">—</span>
                    ) : (
                      <input
                        type="text"
                        placeholder="ระบุหมายเหตุ"
                        aria-label={`หมายเหตุ ${r.label || `รายการที่ ${i + 1}`}`}
                        value={r.note}
                        onChange={(e) => set(i, { note: e.target.value })}
                      />
                    )}
                  </td>
                  {!locked && (
                    <td>
                      {r.custom && (
                        <div className="dt-action">
                          <button
                            className="btn"
                            title="ลบรายการ"
                            aria-label="ลบรายการ"
                            onClick={() => onChange(items.filter((_, k) => k !== i))}
                          >
                            <span className="ms">delete</span>
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!locked && (
        <div>
          <button className="btn btn-s" onClick={() => onChange([...items, { label: "", note: "", custom: true }])}>
            <span className="ms">add</span> เพิ่มรายการ
          </button>
        </div>
      )}
    </>
  );
}
