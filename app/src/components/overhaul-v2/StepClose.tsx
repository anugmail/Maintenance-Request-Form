"use client";

// ⑤ ปิดงาน — Safety Inspection Checklist (ผ่าน/ไม่ผ่านทีละข้อ) + แนบใบ checklist ที่ลงนามแล้ว + จำนวนวันรับประกัน
// ปิดได้เมื่อ: ตรวจครบ · ผ่านทุกข้อ · แนบไฟล์ · ระบุวันรับประกัน → รถ "พร้อมใช้งาน" · รับประกันเริ่มวันที่เจ้าของรถรับรถ
import { useState } from "react";
import { ME, SAFETY_ITEMS, WARN_DAYS, addDays, baht, poTotal, thDate, today, warranty, type Safety } from "@/lib/overhaulV2";
import { FileChip, Modal, Ro, useJob } from "./common";

const blank = (): Safety => ({ rows: SAFETY_ITEMS.map((label) => ({ label, res: "", note: "" })), file: "", inspector: ME, warrantyDays: "" });

function gate(s: Safety) {
  if (s.rows.some((r) => !r.res)) return "ตรวจให้ครบทุกรายการ";
  if (s.rows.some((r) => r.res === "fail")) return "มีรายการไม่ผ่าน";
  if (!s.file) return "แนบใบ checklist";
  if (!(Number(s.warrantyDays) > 0)) return "ระบุจำนวนวันรับประกัน";
  return "";
}

export function StepClose() {
  const { j, readOnly, edit } = useJob();
  const [confirm, setConfirm] = useState(false);
  const s = j.safety ?? blank();
  const closed = j.step === 6;
  const lock = readOnly || closed;
  const start = j.warrantyStart || j.appt?.pickedUpAt || "";
  const end = start && Number(s.warrantyDays) > 0 ? addDays(start, s.warrantyDays) : "";
  const fails = s.rows.filter((r) => r.res === "fail").length;
  const why = gate(s);
  const w = warranty(j);
  // แก้ค่าในฟอร์ม safety — สร้าง j.safety ครั้งแรกที่แตะ
  const set = (fn: (x: Safety) => void) => edit((x) => { x.safety ??= blank(); fn(x.safety); });

  return (
    <div className="stack">
      {closed && w && (
        <div className="note note-ok">
          <span className="ms">check_circle</span>
          <div>
            <b>ปิดงานแล้ว {thDate(j.closedAt)}</b> · รถพร้อมใช้งาน · รับประกัน {thDate(j.warrantyStart)} – {thDate(j.warrantyEnd)} ({w.text}
            {w.left >= 0 && ` · เหลือ ${w.left} วัน`}) · แจ้งเตือนก่อนหมดประกัน {WARN_DAYS} วัน ({thDate(addDays(j.warrantyEnd, -WARN_DAYS))})
          </div>
        </div>
      )}
      <div className="card">
        <div className="stack">
          <div className="sect">Safety Inspection Checklist</div>
          {!lock && (
            <div>
              <button type="button" className="btn btn-s btn-sm" onClick={() => set((x) => x.rows.forEach((r) => (r.res = "pass")))}>
                <span className="ms">done_all</span> ผ่านทั้งหมด
              </button>
            </div>
          )}
          <div className="tblwrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>รายการตรวจ</th>
                  <th className="num">ผ่าน</th>
                  <th className="num">ไม่ผ่าน</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {s.rows.map((r, i) => (
                  <tr key={r.label}>
                    <td>
                      {i + 1}. {r.label}
                    </td>
                    {(["pass", "fail"] as const).map((val) => (
                      <td className="num" key={val}>
                        <input type="radio" name={`sf${i}`} checked={r.res === val} disabled={lock} onChange={() => set((x) => { x.rows[i].res = val; })} />
                      </td>
                    ))}
                    <td>
                      <input type="text" value={r.note} placeholder="ระบุหมายเหตุ" readOnly={lock} onChange={(e) => set((x) => { x.rows[i].note = e.target.value; })} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {fails > 0 && (
            <div className="note note-warn">
              <span className="ms">warning</span>
              <div>ไม่ผ่าน {fails} รายการ — ปิดงานไม่ได้ ให้บริษัทแก้ไขแล้วตรวจซ้ำ</div>
            </div>
          )}
          <div className="fgrid">
            <div className="f sp2">
              <label>ใบ checklist ที่ลงนามแล้ว</label>
              {s.file ? (
                <div>
                  <FileChip name={s.file} onRemove={lock ? undefined : () => set((x) => { x.file = ""; })} />
                </div>
              ) : (
                <label className="upload-field">
                  <span className="ms">upload_file</span>
                  <span>เลือกไฟล์</span>
                  <input type="file" accept=".pdf,image/*" onChange={(e) => { const n = e.target.files?.[0]?.name; if (n) set((x) => { x.file = n; }); }} />
                </label>
              )}
            </div>
            <div className="f sp2">
              <label>ผู้ตรวจ</label>
              <div className="in">
                <span className="ms">person</span>
                <input value={s.inspector} readOnly={lock} onChange={(e) => set((x) => { x.inspector = e.target.value; })} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card">
        <div className="stack">
          <div className="sect">ระยะรับประกัน</div>
          <div className="fgrid">
            <div className="f">
              <label>จำนวนวันรับประกัน</label>
              <div className="in">
                <span className="ms">verified_user</span>
                <input type="number" min={1} value={s.warrantyDays} placeholder="เช่น 180" readOnly={lock} onChange={(e) => set((x) => { x.warrantyDays = e.target.value; })} />
              </div>
            </div>
            <Ro label="วันเริ่ม (วันที่เจ้าของรถรับรถ)" value={thDate(start)} />
            <Ro label="วันสิ้นสุด" value={end ? thDate(end) : "—"} />
            <Ro label="รวมงบประมาณ PO" value={baht(poTotal(j))} />
          </div>
        </div>
      </div>
      {!lock && (
        <div className="actions">
          <button type="button" className="btn btn-p" disabled={!!why} title={why || undefined} onClick={() => setConfirm(true)}>
            ปิดงาน
          </button>
        </div>
      )}
      {confirm && (
        <Modal
          title="ยืนยันปิดงาน Overhaul"
          size="md"
          onClose={() => setConfirm(false)}
          footer={
            <>
              <button type="button" className="btn btn-s" onClick={() => setConfirm(false)}>ยกเลิก</button>
              <button
                type="button"
                className="btn btn-p"
                onClick={() => {
                  edit((x) => {
                    x.warrantyStart = start;
                    x.warrantyEnd = addDays(start, s.warrantyDays);
                    x.closedAt = today();
                    x.step = 6;
                    return `ปิดงาน — ผ่าน safety inspection · รับประกัน ${s.warrantyDays} วัน · รถพร้อมใช้งาน`;
                  }, "ปิดงานแล้ว — รถพร้อมใช้งาน");
                  setConfirm(false);
                }}
              >
                ปิดงาน
              </button>
            </>
          }
        >
          <div className="stack tight">
            <div>Safety inspection ผ่าน {s.rows.length}/{s.rows.length} รายการ</div>
            <div>
              PO เสร็จครบ {j.pos.length} ใบ · รวม {baht(poTotal(j))}
            </div>
            <div>
              รับประกัน {s.warrantyDays} วัน · {thDate(start)} – {thDate(end)}
            </div>
            <div>
              สถานะรถจะเปลี่ยนเป็น <span className="badge b-ok">พร้อมใช้งาน</span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
