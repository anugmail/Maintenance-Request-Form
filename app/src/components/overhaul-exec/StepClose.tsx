"use client";

// ⑦ รายงานปิดงาน (JO 7.4.2-06, 08, 10)
// โครงตามภาพระบบจริง flow/repair ขั้น "รายงานปิดงาน":
//   ข้อมูลเอกสาร → รายการสภาพวัสดุอะไหล่ (ใช้/คืน + จำนวนอะไหล่เก่า + หมายเหตุ)
//   → บันทึกตรวจสอบเอกสารปิดงาน 15 ข้อ (มี/ไม่มี/ไม่ต้องใช้ + อัพโหลดเอกสารแนบ) → "ส่งอนุมัติ"
//   ไม่มี "บันทึกข้อตกลงลูกค้า" — Overhaul มาจากแผนของ กบค. เอง ไม่ได้มีหน่วยงานมาแจ้งซ่อม
// + ของ Overhaul: ค่าแรงรายงาน (02 · เจ้าของงานเคาะให้กรอกตอนสรุป) · ค่าใช้จ่ายเทียบมูลค่าที่ได้มา (06)
// ส่งอนุมัติ → หัวหน้า กบค. อนุมัติปิดงาน / ตีกลับพร้อมเหตุผล (⚠️ กดแทนหัวหน้า — ยังไม่แยกสิทธิ์)
import { useCallback, useState } from "react";
import { RoField } from "@/components/RoField";
import { fmtBaht, fmtDate, fmtNum, type OverhaulPlan, type PlanVehicle, type Vehicle } from "@/lib/overhaul";
import {
  APPROVER_CLOSE,
  CLOSE_DOCS,
  DOC_STATUS_LABEL,
  WARRANTY_DAYS,
  addDays,
  costSummary,
  freshClose,
  issuedParts,
  partInfo,
  usedQty,
  type CloseStep,
  type DocStatus,
} from "@/lib/overhaulExec";
import { DocModal } from "./DocModal";
import { SectionTitle, StepActions } from "./common";

const DOC_STATUSES: DocStatus[] = ["HAS", "NONE", "NA"];

export function StepClose({
  plan,
  v,
  pv,
  save,
}: {
  plan: OverhaulPlan;
  v: Vehicle;
  pv: PlanVehicle;
  save: (patch: Partial<PlanVehicle>, msg: string) => void;
}) {
  const saved = pv.close;
  const submitted = !!saved?.submittedAt;
  const closed = !!saved?.approvedAt;
  const locked = submitted || closed;
  const [draft, setDraft] = useState<CloseStep | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reason, setReason] = useState("");
  const closeReport = useCallback(() => setReportOpen(false), []);
  const C = locked ? saved! : (draft ?? saved ?? freshClose());
  const edit = (patch: Partial<CloseStep>) => setDraft({ ...C, ...patch });
  const issued = issuedParts(pv);
  const works = pv.work?.items ?? [];
  const cost = costSummary({ ...pv, close: C }, v);
  const post = pv.post;
  const jobNo = `${plan.planNo}-${v.id.toUpperCase()}`;

  const missingLabor = works.filter((_, i) => C.labor?.[i] == null).length;
  const missingDocs = C.docs.filter((d) => !d.status).length;
  const blockers = [
    missingLabor ? `ยังไม่ได้กรอกค่าแรง ${missingLabor} งาน` : "",
    missingDocs ? `ยังไม่ได้ระบุเอกสารปิดงาน ${missingDocs} ข้อ` : "",
  ].filter(Boolean);

  return (
    <>
      {saved?.rejectReason && !submitted && (
        <div className="note note-warn">
          <span className="ms">info</span>
          <span>ถูกตีกลับ — เหตุผล: {saved.rejectReason}</span>
        </div>
      )}

      <SectionTitle>ข้อมูลเอกสาร</SectionTitle>
      <dl className="incident-summary md:grid-cols-3!">
        {(
          [
            ["เลขที่งาน", jobNo],
            ["หน่วยงานผู้ใช้บริการ", v.orgUnit],
            ["ชื่องาน", `Overhaul ${v.vehicleType} ${v.equipmentBrand} ${v.plate}`],
            ["วันที่รับงาน", pv.preAssessment?.confirmedAt ? fmtDate(pv.preAssessment.confirmedAt) : "-"],
            ["วันที่เสร็จงาน", post?.confirmedAt ? fmtDate(post.confirmedAt) : "-"],
          ] as [string, string][]
        ).map(([l, val]) => (
          <div className="incident-field" key={l}>
            <dt>{l}</dt>
            <dd>{val}</dd>
          </div>
        ))}
      </dl>

      <SectionTitle>รายการสภาพวัสดุอะไหล่</SectionTitle>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>ชื่ออะไหล่</th>
              <th className="text-right!">ราคาต่อหน่วย</th>
              <th className="text-right!">จำนวนที่ใช้</th>
              <th className="text-right!">ราคารวมที่ใช้</th>
              <th className="text-right!">จำนวนที่คืน</th>
              <th className="text-right!">ราคารวมที่คืน</th>
              <th>จำนวนอะไหล่เก่า</th>
              <th>หมายเหตุ</th>
            </tr>
          </thead>
          <tbody>
            {issued.map((l, i) => {
              const p = partInfo(l);
              const used = usedQty(pv, l.code, l.qty);
              const ret = l.qty - used;
              const old = C.oldParts[l.code] ?? used; // ตั้งต้น = จำนวนที่ใช้ (เปลี่ยนเท่าไรก็ได้ของเก่าเท่านั้น)
              const setOld = (n: number) => edit({ oldParts: { ...C.oldParts, [l.code]: Math.max(0, n) } });
              return (
                <tr key={l.code}>
                  <td>
                    {i + 1}. {p.name}
                  </td>
                  <td className="text-right">{fmtNum(p.price)}</td>
                  <td className="text-right">{fmtNum(used)}</td>
                  <td className="text-right">{fmtNum(p.price * used)}</td>
                  <td className="text-right">{fmtNum(ret)}</td>
                  <td className="text-right">{fmtNum(p.price * ret)}</td>
                  <td>
                    {locked ? (
                      fmtNum(old)
                    ) : (
                      <div className="qty w-fit">
                        <button type="button" aria-label={`ลดจำนวนอะไหล่เก่า ${p.name}`} onClick={() => setOld(old - 1)}>
                          −
                        </button>
                        <span>{old}</span>
                        <button type="button" aria-label={`เพิ่มจำนวนอะไหล่เก่า ${p.name}`} onClick={() => setOld(old + 1)}>
                          +
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    {locked ? (
                      C.partNotes[l.code] || <span className="cell-sub">—</span>
                    ) : (
                      <input
                        type="text"
                        placeholder="ระบุหมายเหตุ"
                        aria-label={`หมายเหตุ ${p.name}`}
                        value={C.partNotes[l.code] ?? ""}
                        onChange={(e) => edit({ partNotes: { ...C.partNotes, [l.code]: e.target.value } })}
                      />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SectionTitle>ค่าแรง</SectionTitle>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>รายการงาน</th>
              <th>ผู้ดำเนินการ</th>
              <th>ช่วงวันที่</th>
              <th className="text-right!">ค่าแรง (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {works.map((w, i) => (
              <tr key={i}>
                <td>{w.title}</td>
                <td>{w.by}</td>
                <td>{w.start && w.end ? `${fmtDate(w.start)} – ${fmtDate(w.end)}` : "—"}</td>
                <td className="text-right">
                  {locked ? (
                    fmtBaht(C.labor?.[i] ?? 0)
                  ) : (
                    <input
                      type="number"
                      min={0}
                      className="tbl-inline-md text-right"
                      aria-label={`ค่าแรง ${w.title}`}
                      placeholder="0"
                      value={C.labor?.[i] ?? ""}
                      onChange={(e) => {
                        const labor = works.map((_, k) => C.labor?.[k] ?? null);
                        labor[i] = e.target.value === "" ? null : Math.max(0, +e.target.value);
                        edit({ labor });
                      }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SectionTitle>สรุปค่าใช้จ่ายเทียบราคารถ</SectionTitle>
      <div className="fgrid m-0!">
        <RoField label="ค่าอะไหล่ (ใช้จริง)" icon="inventory_2" value={`${fmtBaht(cost.parts)} บาท`} />
        <RoField label="ค่าแรง" icon="engineering" value={`${fmtBaht(cost.labor)} บาท`} />
        <RoField label="ค่าใช้จ่ายรวม" icon="payments" value={`${fmtBaht(cost.total)} บาท`} />
        <RoField label="มูลค่าที่ได้มา" icon="account_balance" value={`${fmtBaht(cost.value)} บาท`} />
        <RoField label="สัดส่วนต่อมูลค่ารถ" icon="percent" value={`${cost.pct.toFixed(2)} %`} />
      </div>

      <SectionTitle>บันทึกตรวจสอบเอกสารปิดงาน</SectionTitle>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>รายการ</th>
              {DOC_STATUSES.map((s) => (
                <th key={s} className="text-center! w-24">
                  {DOC_STATUS_LABEL[s]}
                </th>
              ))}
              <th>เอกสารแนบ</th>
            </tr>
          </thead>
          <tbody>
            {CLOSE_DOCS.map((label, i) => {
              const d = C.docs[i] ?? {};
              const setDoc = (patch: Partial<typeof d>) => edit({ docs: C.docs.map((x, k) => (k === i ? { ...x, ...patch } : x)) });
              return (
                <tr key={label}>
                  <td>
                    {i + 1}. {label}
                  </td>
                  {DOC_STATUSES.map((s) => (
                    <td key={s} className="text-center">
                      <input
                        type="radio"
                        name={`doc-${i}`}
                        aria-label={`${label} — ${DOC_STATUS_LABEL[s]}`}
                        checked={d.status === s}
                        disabled={locked}
                        onChange={() => setDoc(s === "HAS" ? { status: s } : { status: s, file: undefined })}
                      />
                    </td>
                  ))}
                  <td>
                    {/* แบบระบบจริง flow/repair: ช่อง "อัพโหลดเอกสารแนบ" ทุกแถว ปิดใช้จนกว่าจะเลือก "มี" · เลือกไฟล์แล้วเป็น .file-chip */}
                    {d.file ? (
                      <div className="file-chip">
                        <span className="ms">check_circle</span>
                        <span className="file-chip-name" title={d.file}>
                          {d.file}
                        </span>
                        {!locked && (
                          <button type="button" className="file-chip-rm" aria-label={`ลบไฟล์แนบ ${label}`} onClick={() => setDoc({ file: undefined })}>
                            <span className="ms">close</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <label className="upload-field" aria-disabled={locked || d.status !== "HAS"}>
                          <span className="ms">attach_file</span>
                          อัพโหลดเอกสารแนบ
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            aria-label={`อัพโหลดเอกสารแนบ ${label}`}
                            disabled={locked || d.status !== "HAS"}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setDoc({ file: f.name });
                            }}
                          />
                        </label>
                        {!locked && d.status === "HAS" && <div className="upload-hint">รองรับไฟล์ประเภท pdf,png,jpg เท่านั้นขนาดไม่เกิน 10 MB</div>}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {submitted && !closed && (
        <div className="card">
          <div className="stack">
            <div className="note note-warn">
              <span className="ms">hourglass_top</span>
              <span>ส่งอนุมัติปิดงานแล้ว — รอ {APPROVER_CLOSE} อนุมัติ</span>
            </div>
            <div className="f">
              <label htmlFor="close-reject">เหตุผล (กรอกเมื่อตีกลับ)</label>
              <textarea id="close-reject" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ระบุเหตุผลที่ตีกลับ…" />
            </div>
            <div className="flex justify-end gap-3">
              <button
                className="btn btn-d"
                disabled={!reason.trim()}
                onClick={() => {
                  save({ close: { ...saved!, submittedAt: undefined, rejectReason: reason.trim() } }, `${APPROVER_CLOSE} ตีกลับรายงานปิดงาน — ${reason.trim()}`);
                  setReason("");
                }}
              >
                <span className="ms">u_turn_left</span> ตีกลับ
              </button>
              <button
                className="btn btn-p"
                onClick={() =>
                  save({ close: { ...saved!, approvedAt: new Date().toISOString(), approvedBy: APPROVER_CLOSE, rejectReason: undefined } }, `${APPROVER_CLOSE} อนุมัติปิดงาน`)
                }
              >
                <span className="ms">task_alt</span> อนุมัติปิดงาน
              </button>
            </div>
          </div>
        </div>
      )}

      {closed && (
        <div>
          <button className="btn btn-s" onClick={() => setReportOpen(true)}>
            <span className="ms">description</span> ดูรายงานผลการ Overhaul
          </button>
        </div>
      )}

      <StepActions
        locked={locked}
        blockers={blockers}
        confirmLabel="ส่งอนุมัติ"
        onDraft={() => {
          save({ close: C }, "บันทึกร่างรายงานปิดงาน");
          setDraft(null);
        }}
        onConfirm={() => {
          save({ close: { ...C, submittedAt: new Date().toISOString(), rejectReason: undefined } }, "ส่งรายงานปิดงานเพื่ออนุมัติ");
          setDraft(null);
        }}
      />

      {reportOpen && (
        <DocModal title="รายงานผลการ Overhaul" onClose={closeReport}>
          <div className="fgrid grid-cols-2! m-0!">
            <RoField label="แผน Overhaul" icon="list_alt" value={`${plan.planNo} · ${plan.name}`} span="sp4" />
            <RoField label="ทะเบียน" icon="directions_car" value={v.plate} />
            <RoField label="เครื่องมือกล" icon="precision_manufacturing" value={`${v.equipmentBrand} · ${v.equipmentNo}`} />
            <RoField label="วันที่รับงาน" icon="date_range" value={pv.preAssessment?.confirmedAt ? fmtDate(pv.preAssessment.confirmedAt) : "—"} />
            <RoField label="ปิดงาน" icon="event_available" value={saved?.approvedAt ? fmtDate(saved.approvedAt) : "—"} />
            <RoField label="ใบรับรองความปลอดภัย" icon="verified" value={post?.certNo ?? "—"} />
            <RoField
              label={`รับประกัน ${WARRANTY_DAYS} วัน`}
              icon="shield"
              value={post?.certDate ? `${fmtDate(post.certDate)} – ${fmtDate(addDays(post.certDate, WARRANTY_DAYS))}` : "—"}
            />
          </div>
          <div className="sect">ผลวิเคราะห์ก่อน Overhaul</div>
          <p className="text-sm">{pv.preAssessment?.analysis || "—"}</p>
          <div className="sect">งานที่ดำเนินการ</div>
          <ul className="list-disc pl-5 text-sm">
            {works.map((w, i) => (
              <li key={i}>
                {w.title} — {w.by} ({fmtDate(w.start)} ถึง {fmtDate(w.end)}) · ค่าแรง {fmtBaht(C.labor?.[i] ?? 0)} บาท
              </li>
            ))}
          </ul>
          {pv.work?.found && <p className="text-sm">พบอาการเพิ่มระหว่าง Overhaul: {pv.work.foundNote}</p>}
          <div className="sect">ค่าใช้จ่าย</div>
          <p className="text-sm">
            ค่าอะไหล่ {fmtBaht(cost.parts)} + ค่าแรง {fmtBaht(cost.labor)} = <b>{fmtBaht(cost.total)} บาท</b> · คิดเป็น{" "}
            <b>{cost.pct.toFixed(2)}%</b> ของมูลค่าที่ได้มา {fmtBaht(cost.value)} บาท · คะแนนประเมินคุณภาพ {post?.rating ?? "—"}/5
          </p>
        </DocModal>
      )}
    </>
  );
}
