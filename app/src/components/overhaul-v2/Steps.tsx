"use client";

// ② บันทึก PO · ③ ติดตามงาน (บันทึกการตรวจงานเพิ่มได้เรื่อยๆ) · ④ นัดหมายเจ้าของรถมารับรถที่บริษัท
import { useState } from "react";
import { ME, thDate, today, nowStamp } from "@/lib/overhaulV2";
import { FileChip, Modal, Ro, useJob } from "./common";
import { PoSection } from "./PoSection";
import { useToast } from "@/components/Shell";

// ── ② บันทึก PO ───────────────────────────────────────────────────
export function StepPo() {
  const { j, readOnly, edit, go } = useJob();
  return (
    <div className="card">
      <div className="stack">
        <div className="sect">บันทึกข้อมูล PO</div>
        <div className="sub">เพิ่มได้หลายบริษัท · แต่ละบริษัทเพิ่ม PO ได้หลายใบ</div>
        <PoSection mode={j.step <= 3 ? "edit" : "ro"} />
        {!readOnly && (
          <div className="actions">
            <button type="button" className="btn btn-g" onClick={() => go(1)}>
              <span className="ms">arrow_back</span> ย้อนกลับ
            </button>
            <button
              type="button"
              className="btn btn-p"
              disabled={!j.pos.length}
              title={j.pos.length ? undefined : "เพิ่ม PO อย่างน้อย 1 ใบก่อน"}
              onClick={() => { edit((x) => { x.step = 3; return `บันทึก PO ${x.pos.length} ใบ — ส่งรถให้บริษัทดำเนินการ`; }, "ส่งรถให้บริษัทดำเนินการแล้ว"); go(3); }}
            >
              ส่งรถให้บริษัทดำเนินการ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ③ ติดตามงาน ───────────────────────────────────────────────────
export function StepTrack() {
  const { j, readOnly, edit, go } = useJob();
  const [logOpen, setLogOpen] = useState(false);
  const allDone = j.pos.length > 0 && j.pos.every((p) => p.status === "done");
  const logs = [...j.logs].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="stack">
      <div className="card">
        <div className="stack">
          <div className="sect">งานของแต่ละบริษัท</div>
          <PoSection mode={readOnly ? "ro" : "track"} />
        </div>
      </div>
      <div className="card">
        <div className="stack">
          <div className="sect">บันทึกการตรวจงาน ({j.logs.length} ครั้ง)</div>
          {!readOnly && (
            <div>
              <button type="button" className="btn btn-p" onClick={() => setLogOpen(true)}>
                <span className="ms">add</span> เพิ่มบันทึกตรวจงาน
              </button>
            </div>
          )}
          {logs.map((l) => {
            const p = j.pos.find((x) => x.id === l.poId);
            return (
              <div className="job" key={l.id}>
                <div className="sp">
                  <div>
                    <b>ครั้งที่ {j.logs.indexOf(l) + 1}</b> · {thDate(l.date)} · {p?.vendor ?? "—"}
                  </div>
                  <div className="meta">
                    {p?.poNo} · ผู้ตรวจ {l.inspector}
                  </div>
                  <div className="mt-2">{l.note}</div>
                  {l.files.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {l.files.map((f) => <FileChip key={f} name={f} />)}
                    </div>
                  )}
                </div>
                <span className={`badge ${l.progress >= 100 ? "b-ok" : "b-info"}`}>{l.progress}%</span>
              </div>
            );
          })}
          {!logs.length && <div className="empty">ยังไม่มีบันทึกการตรวจงาน</div>}
        </div>
      </div>
      {!readOnly && (
        <div className="actions">
          <button type="button" className="btn btn-g" onClick={() => go(2)}>
            <span className="ms">arrow_back</span> ย้อนกลับ
          </button>
          <button
            type="button"
            className="btn btn-p"
            disabled={!allDone}
            title={allDone ? undefined : "ทุก PO ต้องส่งมอบงานแล้ว"}
            onClick={() => { edit((x) => { x.step = 4; return "งานเสร็จครบทุก PO"; }); go(4); }}
          >
            นัดหมายเจ้าของรถมารับรถ
          </button>
        </div>
      )}
      {logOpen && <LogModal onClose={() => setLogOpen(false)} />}
    </div>
  );
}

function LogModal({ onClose }: { onClose: () => void }) {
  const { j, edit } = useJob();
  const [date, setDate] = useState(today());
  const [pct, setPct] = useState("");
  const [poId, setPoId] = useState(j.pos[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [by, setBy] = useState(ME);
  const [files, setFiles] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const save = () => {
    const n = Number(pct);
    if (!date || !note.trim() || pct === "" || n < 0 || n > 100) { setErr("กรอกวันที่ · ความคืบหน้า 0–100 · ผลการตรวจ ให้ครบ"); return; }
    edit((x) => {
      x.logs.push({ id: `L${Date.now()}`, date, poId, progress: n, inspector: by.trim() || ME, note: note.trim(), files });
      return `บันทึกตรวจงานครั้งที่ ${x.logs.length}`;
    }, "บันทึกการตรวจงานแล้ว");
    onClose();
  };
  return (
    <Modal
      title="บันทึกการตรวจงาน"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>ยกเลิก</button>
          <button type="button" className="btn btn-p" onClick={save}>บันทึก</button>
        </>
      }
    >
      {err && (
        <div className="note note-warn">
          <span className="ms">warning</span>
          <div>{err}</div>
        </div>
      )}
      <div className="fgrid">
        <div className="f sp2">
          <label>วันที่ไปตรวจงาน</label>
          <div className="in">
            <span className="ms">event</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="f sp2">
          <label>ความคืบหน้า (%)</label>
          <div className="in">
            <span className="ms">percent</span>
            <input type="number" min={0} max={100} value={pct} onChange={(e) => setPct(e.target.value)} placeholder="0–100" />
          </div>
        </div>
        <div className="f sp4">
          <label>PO / บริษัทที่ไปตรวจ</label>
          <select value={poId} onChange={(e) => setPoId(e.target.value)}>
            {j.pos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.vendor} · {p.poNo}
              </option>
            ))}
          </select>
        </div>
        <div className="f sp4">
          <label>ผลการตรวจ / สิ่งที่พบ</label>
          <textarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น ถอดชุดปั๊มแล้ว พบซีลแตก 3 จุด" />
        </div>
        <div className="f sp2">
          <label>ผู้ตรวจ</label>
          <div className="in">
            <span className="ms">person</span>
            <input value={by} onChange={(e) => setBy(e.target.value)} />
          </div>
        </div>
        <div className="f sp2">
          <label>
            รูปภาพ / ไฟล์แนบ <small>ถ้ามี</small>
          </label>
          <label className="upload-field">
            <span className="ms">add_photo_alternate</span>
            <span>เลือกไฟล์</span>
            <input type="file" multiple accept="image/*,.pdf" onChange={(e) => { setFiles([...files, ...[...(e.target.files ?? [])].map((f) => f.name)]); e.target.value = ""; }} />
          </label>
          <div className="flex flex-wrap gap-2 mt-2">
            {files.map((f, i) => <FileChip key={f + i} name={f} onRemove={() => setFiles(files.filter((_, k) => k !== i))} />)}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ── ④ นัดหมายเจ้าของรถมารับรถที่บริษัท ────────────────────────────
export function StepAppt() {
  const { v, j, readOnly, edit, go } = useJob();
  const toast = useToast();
  const a = j.appt;
  const [poId, setPoId] = useState(a?.poId ?? j.pos[0]?.id ?? "");
  const [date, setDate] = useState(a?.date ?? "");
  const [time, setTime] = useState(a?.time ?? "09:00");
  const [contact, setContact] = useState(a?.contact ?? "");
  const [tel, setTel] = useState(a?.tel ?? "");
  const [note, setNote] = useState(a?.note ?? "");
  const [pick, setPick] = useState(today());

  if (a?.sentAt) {
    const p = j.pos.find((x) => x.id === a.poId);
    return (
      <div className="card">
        <div className="stack">
          <div className="sect">{a.pickedUpAt ? "เจ้าของรถรับรถแล้ว" : "รอเจ้าของรถมารับรถ"}</div>
          <div className="job">
            <div className="sp">
              <div className="no">
                {thDate(a.date)} · {a.time} น.
              </div>
              <div className="meta">ที่ {p?.vendor ?? "—"}</div>
              <div className="meta">
                ผู้ประสานงานบริษัท {a.contact} · {a.tel}
              </div>
              {a.note && <div className="meta">{a.note}</div>}
            </div>
            {a.pickedUpAt ? <span className="badge b-ok">รับรถแล้ว {thDate(a.pickedUpAt)}</span> : <span className="badge b-low">รอรับรถ</span>}
          </div>
          <div className="fgrid">
            <Ro label="ผู้รับรถ (เจ้าของรถ)" value={v.owner} />
            <Ro label="เบอร์โทร" value={v.ownerTel} />
            <Ro label="ส่งนัดหมายเมื่อ" value={thDate(a.sentAt)} />
          </div>
          {!readOnly && !a.pickedUpAt && (
            <>
              <div className="fgrid">
                <div className="f sp2">
                  <label>วันที่เจ้าของรถรับรถจริง</label>
                  <div className="in">
                    <span className="ms">event_available</span>
                    <input type="date" value={pick} onChange={(e) => setPick(e.target.value)} />
                  </div>
                </div>
              </div>
              <div className="actions">
                <button type="button" className="btn btn-g" onClick={() => edit((x) => { x.appt!.sentAt = ""; })}>
                  แก้นัดหมาย
                </button>
                <button type="button" className="btn btn-s" onClick={() => toast(`ส่งเตือนนัดหมายถึง ${v.owner} อีกครั้งแล้ว`)}>
                  <span className="ms">notifications</span> ส่งเตือนซ้ำ
                </button>
                <button
                  type="button"
                  className="btn btn-p"
                  disabled={!pick}
                  onClick={() => { edit((x) => { x.appt!.pickedUpAt = pick; x.step = 5; return `เจ้าของรถรับรถแล้ว — ${thDate(pick)}`; }, "บันทึกการรับรถแล้ว"); go(5); }}
                >
                  บันทึกเจ้าของรถรับรถแล้ว
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const send = () => {
    if (!date || !time || !contact.trim()) { toast("กรอกวันที่ · เวลา · ผู้ประสานงาน ให้ครบ"); return; }
    edit((x) => {
      x.appt = { poId, date, time, contact: contact.trim(), tel: tel.trim(), note: note.trim(), sentAt: nowStamp(), pickedUpAt: "" };
      return `ส่งนัดหมายรับรถให้เจ้าของรถ — ${thDate(date)} ${time}`;
    }, `ส่งนัดหมายให้ ${v.owner} แล้ว`);
  };
  return (
    <div className="card">
      <div className="stack">
        <div className="sect">นัดหมายเจ้าของรถมารับรถ</div>
        <div className="sub">เจ้าของรถรับรถที่บริษัทผู้รับจ้าง · วันที่รับรถจริงคือวันเริ่มนับรับประกัน</div>
        <div className="fgrid">
          <div className="f sp4">
            <label>สถานที่รับรถ (บริษัท)</label>
            <select value={poId} onChange={(e) => setPoId(e.target.value)} disabled={readOnly}>
              {j.pos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.vendor}
                </option>
              ))}
            </select>
          </div>
          <div className="f sp2">
            <label>วันที่นัด</label>
            <div className="in">
              <span className="ms">event</span>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} readOnly={readOnly} />
            </div>
          </div>
          <div className="f sp2">
            <label>เวลา</label>
            <div className="in">
              <span className="ms">schedule</span>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} readOnly={readOnly} />
            </div>
          </div>
          <div className="f sp2">
            <label>ผู้ประสานงานของบริษัท</label>
            <div className="in">
              <span className="ms">person</span>
              <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="ชื่อผู้ติดต่อที่บริษัท" readOnly={readOnly} />
            </div>
          </div>
          <div className="f sp2">
            <label>เบอร์โทร</label>
            <div className="in">
              <span className="ms">call</span>
              <input type="tel" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="0x-xxx-xxxx" readOnly={readOnly} />
            </div>
          </div>
          <div className="f sp4">
            <label>
              รายละเอียดเพิ่มเติม <small>ถ้ามี</small>
            </label>
            <div className="in">
              <span className="ms">edit_note</span>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น นำใบนำตัวมาด้วย" readOnly={readOnly} />
            </div>
          </div>
          <Ro label="ผู้รับรถ (เจ้าของรถ)" value={v.owner} span="sp2" />
          <Ro label="เบอร์โทร" value={v.ownerTel} span="sp2" />
        </div>
        {!readOnly && (
          <div className="actions">
            <button type="button" className="btn btn-g" onClick={() => go(3)}>
              <span className="ms">arrow_back</span> ย้อนกลับ
            </button>
            <button type="button" className="btn btn-p" onClick={send}>
              ส่งนัดหมายให้เจ้าของรถ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
