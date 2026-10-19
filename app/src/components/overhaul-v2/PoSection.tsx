"use client";

// PO ของงาน — จัดกลุ่มตามบริษัทผู้รับจ้าง แต่ละบริษัทเพิ่ม PO ได้หลายใบ (ใช้ทั้งขั้น ② บันทึก PO และ ③ ติดตามงาน)
// 1 PO = รายการงานที่บริษัทรับทำ · วันเริ่มสัญญา + ระยะเวลาว่าจ้าง → วันสิ้นสุดสัญญา · งบประมาณ (แก้ไขได้)
import { useState } from "react";
import { VENDORS, addDays, baht, daysBetween, poTotal, thDate, today, type Po } from "@/lib/overhaulV2";
import { FileChip, Modal, useJob } from "./common";

type Mode = "edit" | "track" | "ro";

export function PoSection({ mode }: { mode: Mode }) {
  const { j } = useJob();
  // modal: vendor = เพิ่ม PO ให้บริษัทนั้น · "" = เลือกบริษัทเอง · editId = แก้ไข PO เดิม
  const [modal, setModal] = useState<{ vendor: string; editId?: string } | null>(null);
  const canAdd = j.step <= 3;
  const vendors = [...new Set(j.pos.map((p) => p.vendor))];

  return (
    <>
      {canAdd && (
        <div>
          <button type="button" className="btn btn-p" onClick={() => setModal({ vendor: "" })}>
            <span className="ms">add</span> เพิ่ม PO
          </button>
        </div>
      )}
      {vendors.map((v) => (
        <VendorBlock key={v} vendor={v} mode={mode} canAdd={canAdd} onAdd={() => setModal({ vendor: v })} onEdit={(id) => setModal({ vendor: "", editId: id })} />
      ))}
      {!vendors.length && <div className="empty">ยังไม่มี PO — กด &quot;เพิ่ม PO&quot;</div>}
      <div className="flex justify-between font-semibold">
        <span>
          รวมงบประมาณ ({vendors.length} บริษัท · {j.pos.length} ใบ)
        </span>
        <span>{baht(poTotal(j))}</span>
      </div>
      {modal && <PoModal vendor={modal.vendor} editId={modal.editId} onClose={() => setModal(null)} />}
    </>
  );
}

function VendorBlock({ vendor, mode, canAdd, onAdd, onEdit }: { vendor: string; mode: Mode; canAdd: boolean; onAdd: () => void; onEdit: (id: string) => void }) {
  const { j, edit } = useJob();
  const list = j.pos.filter((p) => p.vendor === vendor);
  const sub = list.reduce((a, p) => a + Number(p.amount || 0), 0);
  return (
    <div className="card">
      <div className="stack">
        <div className="flex flex-wrap items-center gap-3">
          <span className="ms text-gray-500">domain</span>
          <b className="mr-auto">{vendor}</b>
          <span className="badge b-neutral">
            {list.length} PO · งบ {baht(sub)}
          </span>
          {canAdd && (
            <button type="button" className="btn btn-o btn-sm" onClick={onAdd}>
              <span className="ms">add</span> เพิ่ม PO
            </button>
          )}
        </div>
        <div className="tblwrap">
          <table className="tbl striped">
            <thead>
              <tr>
                <th>เลขที่ PO</th>
                <th>รายการงานที่รับทำ</th>
                <th>ระยะเวลาสัญญา</th>
                <th className="num">งบประมาณ</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const done = p.status === "done";
                const left = daysBetween(today(), p.end);
                return (
                  <tr key={p.id}>
                    <td>
                      <span className="cell-key">{p.poNo}</span>
                      <div className="cell-sub">{thDate(p.poDate)}</div>
                      {p.file && (
                        <div className="mt-1">
                          <FileChip name={p.file} />
                        </div>
                      )}
                    </td>
                    <td>
                      {p.items.map((t, i) => (
                        <div key={i}>
                          {i + 1}. {t}
                        </div>
                      ))}
                    </td>
                    <td>
                      {thDate(p.start)} – {thDate(p.end)}
                      <div className="cell-sub">{p.days} วัน</div>
                      {!done &&
                        (left < 0 ? (
                          <span className="badge b-out">เกินสัญญา {-left} วัน</span>
                        ) : (
                          <span className="cell-sub">เหลือ {left} วัน</span>
                        ))}
                    </td>
                    <td className="num">{baht(p.amount)}</td>
                    <td>
                      {done ? (
                        <>
                          <span className="badge b-ok">เสร็จแล้ว</span>
                          <div className="cell-sub">{thDate(p.doneAt)}</div>
                        </>
                      ) : (
                        <span className="badge b-info">กำลังดำเนินการ</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {j.step < 6 && (
                          <button type="button" className="btn btn-t btn-icon" title="แก้ไข PO / งบประมาณ" onClick={() => onEdit(p.id)}>
                            <span className="ms">edit</span>
                          </button>
                        )}
                        {mode === "edit" && j.step === 2 && (
                          <button type="button" className="btn btn-t btn-icon" title="ลบ PO" onClick={() => edit((x) => { x.pos = x.pos.filter((y) => y.id !== p.id); }, "ลบ PO แล้ว")}>
                            <span className="ms">delete</span>
                          </button>
                        )}
                        {mode === "track" && !done && (
                          <button
                            type="button"
                            className="btn btn-o btn-sm"
                            onClick={() =>
                              edit((x) => {
                                const y = x.pos.find((z) => z.id === p.id)!;
                                y.status = "done";
                                y.doneAt = today();
                                return `บริษัทส่งมอบงาน ${y.poNo} — ${y.vendor}`;
                              }, `บันทึกส่งมอบงาน ${p.poNo} แล้ว`)
                            }
                          >
                            ส่งมอบงานแล้ว
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PoModal({ vendor: fixed, editId, onClose }: { vendor: string; editId?: string; onClose: () => void }) {
  const { j, s, edit } = useJob();
  const e = editId ? j.pos.find((p) => p.id === editId) : undefined;
  const used = [...new Set(j.pos.map((p) => p.vendor))];
  const others = VENDORS.concat(s.extraVendors).filter((v) => !used.includes(v));
  const [vendor, setVendor] = useState(e?.vendor ?? "");
  const [newVendor, setNewVendor] = useState("");
  const [poNo, setPoNo] = useState(e?.poNo ?? "");
  const [poDate, setPoDate] = useState(e?.poDate ?? today());
  const [items, setItems] = useState<string[]>(e ? [...e.items] : [""]);
  const [start, setStart] = useState(e?.start ?? today());
  const [days, setDays] = useState(e ? String(e.days) : "");
  const [amount, setAmount] = useState(e ? String(e.amount) : "");
  const [file, setFile] = useState(e?.file ?? "");
  const [err, setErr] = useState("");
  const end = start && Number(days) > 0 ? addDays(start, days) : "";

  const save = () => {
    const vName = fixed || (vendor === "__new" ? newVendor.trim() : vendor);
    const its = items.map((t) => t.trim()).filter(Boolean);
    if (!vName || !poNo.trim() || !its.length || !start || !(Number(days) > 0) || amount === "") {
      setErr("กรอกบริษัท · เลขที่ PO · รายการงาน · วันเริ่มสัญญา · ระยะเวลา · งบประมาณ ให้ครบ");
      return;
    }
    const data = { vendor: vName, poNo: poNo.trim(), poDate, items: its, start, days: Number(days), end, amount: Number(amount), file };
    edit((x, st) => {
      if (vendor === "__new" && !VENDORS.concat(st.extraVendors).includes(vName)) st.extraVendors.push(vName);
      if (e) {
        const p = x.pos.find((y) => y.id === e.id)!;
        const was = p.amount;
        Object.assign(p, data);
        return `แก้ไข PO ${p.poNo}` + (was !== p.amount ? ` — งบประมาณ ${baht(was)} → ${baht(p.amount)}` : "");
      }
      x.pos.push({ id: `P${Date.now()}`, ...data, status: "open", doneAt: "" } as Po);
      if (x.step >= 3) return `เพิ่ม PO ${data.poNo} — ${vName}`;
    }, e ? "บันทึกการแก้ไข PO แล้ว" : "บันทึก PO แล้ว");
    onClose();
  };

  return (
    <Modal
      title={e ? `แก้ไข PO ${e.poNo}` : "เพิ่ม PO"}
      sub={e ? e.vendor : fixed || "เลือกบริษัทจาก vendor list หรือเพิ่มบริษัทใหม่"}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-s" onClick={onClose}>ยกเลิก</button>
          <button type="button" className="btn btn-p" onClick={save}>{e ? "บันทึกการแก้ไข" : "บันทึก PO"}</button>
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
        {!fixed && (
          <div className="f sp4">
            <label>บริษัทผู้รับจ้าง</label>
            <select value={vendor} onChange={(ev) => setVendor(ev.target.value)}>
              <option value="">เลือกบริษัท (vendor list)</option>
              {used.length > 0 && (
                <optgroup label="บริษัทในงานนี้">
                  {used.map((v) => <option key={v}>{v}</option>)}
                </optgroup>
              )}
              <optgroup label="บริษัทอื่น">
                {others.map((v) => <option key={v}>{v}</option>)}
              </optgroup>
              <option value="__new">+ เพิ่มบริษัทใหม่</option>
            </select>
          </div>
        )}
        {vendor === "__new" && (
          <div className="f sp4">
            <label>ชื่อบริษัทใหม่</label>
            <div className="in">
              <span className="ms">domain_add</span>
              <input value={newVendor} onChange={(ev) => setNewVendor(ev.target.value)} placeholder="เช่น บจก. ตัวอย่าง เอ็นจิเนียริ่ง" />
            </div>
          </div>
        )}
        <div className="f sp2">
          <label>เลขที่ PO</label>
          <div className="in">
            <span className="ms">tag</span>
            <input value={poNo} onChange={(ev) => setPoNo(ev.target.value)} placeholder="PO-2569-xxxxx" />
          </div>
        </div>
        <div className="f sp2">
          <label>วันที่ PO</label>
          <div className="in">
            <span className="ms">event</span>
            <input type="date" value={poDate} onChange={(ev) => setPoDate(ev.target.value)} />
          </div>
        </div>
        <div className="f sp4">
          <label>รายการงานที่บริษัทรับทำ</label>
          <div className="stack tight">
            {items.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-6 text-right text-gray-500">{i + 1}.</span>
                <div className="in noic flex-1">
                  <input value={t} onChange={(ev) => setItems(items.map((x, k) => (k === i ? ev.target.value : x)))} placeholder="เช่น Overhaul ระบบไฮดรอลิกทั้งชุด" />
                </div>
                <button type="button" className="btn btn-t btn-icon" title="ลบรายการ" disabled={items.length < 2} onClick={() => setItems(items.filter((_, k) => k !== i))}>
                  <span className="ms">delete</span>
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <button type="button" className="btn btn-s btn-sm" onClick={() => setItems([...items, ""])}>
              <span className="ms">add</span> เพิ่มรายการงาน
            </button>
          </div>
        </div>
        <div className="f sp4">
          <div className="sect">ระยะเวลาสัญญา</div>
        </div>
        <div className="f">
          <label>วันเริ่มสัญญา</label>
          <div className="in">
            <span className="ms">event</span>
            <input type="date" value={start} onChange={(ev) => setStart(ev.target.value)} />
          </div>
        </div>
        <div className="f">
          <label>ระยะเวลาว่าจ้าง (วัน)</label>
          <div className="in">
            <span className="ms">timelapse</span>
            <input type="number" min={1} value={days} onChange={(ev) => setDays(ev.target.value)} placeholder="เช่น 90" />
          </div>
        </div>
        <div className="f ro sp2">
          <label>วันสิ้นสุดสัญญา</label>
          <div className="in">
            <span className="ms">event_available</span>
            <input readOnly value={end ? thDate(end) : ""} placeholder="คำนวณจากวันเริ่ม + ระยะเวลา" />
          </div>
        </div>
        <div className="f sp2">
          <label>งบประมาณ (บาท)</label>
          <div className="in">
            <span className="ms">payments</span>
            <input type="number" min={0} value={amount} onChange={(ev) => setAmount(ev.target.value)} placeholder="0" />
          </div>
        </div>
        <div className="f sp4">
          <label>ไฟล์ใบสั่งจ้าง (PO)</label>
          <label className="upload-field">
            <span className="ms">upload_file</span>
            <span>{file || "เลือกไฟล์"}</span>
            <input type="file" accept=".pdf,.jpg,.png" onChange={(ev) => setFile(ev.target.files?.[0]?.name ?? file)} />
          </label>
          <div className="upload-hint">PDF / JPG / PNG · งบประมาณบันทึกไว้อ้างอิงเท่านั้น ไม่ส่งเข้า SAP</div>
        </div>
      </div>
    </Modal>
  );
}
