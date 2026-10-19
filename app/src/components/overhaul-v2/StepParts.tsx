"use client";

// ① เบิกอะไหล่ — ตั้งต้นจากชุดอะไหล่ประจำรุ่น ปรับจำนวนได้ · กด "ข้ามขั้นนี้" ได้ (บริษัทจัดหาอะไหล่เอง)
import Link from "next/link";
import { PART_KIT, baht } from "@/lib/overhaulV2";
import { useJob } from "./common";

export function StepParts() {
  const { v, j, readOnly, edit, go } = useJob();

  if (j.partsSkipped)
    return (
      <div className="card">
        <div className="stack">
          <div className="sect">เบิกอะไหล่</div>
          <div className="note note-info">
            <span className="ms">info</span>
            <div>ข้ามขั้นนี้ — ไม่เบิกอะไหล่จากคลัง กฟภ.</div>
          </div>
          {!readOnly && (
            <div className="actions">
              <button type="button" className="btn btn-s" onClick={() => { edit((x) => { x.partsSkipped = false; x.parts ??= PART_KIT.map((p) => ({ ...p })); x.step = 1; }); go(1); }}>
                กลับมาเบิกอะไหล่
              </button>
            </div>
          )}
        </div>
      </div>
    );

  const rows = j.parts ?? [];
  const total = rows.reduce((a, p) => a + p.qty * p.price, 0);
  return (
    <div className="card">
      <div className="stack">
        <div className="sect">เบิกอะไหล่</div>
        <div className="sub">ตั้งต้นจากชุดอะไหล่ประจำรุ่น {v.model} · ปรับจำนวนได้ · ไม่ต้องเบิกให้กด &quot;ข้ามขั้นนี้&quot;</div>
        <div className="tblwrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>รายการ</th>
                <th className="num">คงคลัง</th>
                <th className="num">จำนวนเบิก</th>
                <th className="num">ราคาต่อหน่วย</th>
                <th className="num">รวม</th>
                {!readOnly && <th></th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.code}>
                  <td>
                    <span className="cell-key">{p.name}</span>
                    <div className="cell-sub">{p.code}</div>
                  </td>
                  <td className="num">
                    {p.stock} {p.unit}
                    {p.qty > p.stock && (
                      <div className="cell-sub">
                        <span className="badge b-out">ไม่พอ</span>
                      </div>
                    )}
                  </td>
                  <td className="num">
                    {readOnly ? (
                      `${p.qty} ${p.unit}`
                    ) : (
                      <div className="qty inline-flex">
                        <button type="button" onClick={() => edit((x) => { x.parts![i].qty = Math.max(1, x.parts![i].qty - 1); })}>−</button>
                        <span>{p.qty}</span>
                        <button type="button" onClick={() => edit((x) => { x.parts![i].qty += 1; })}>+</button>
                      </div>
                    )}
                  </td>
                  <td className="num">{baht(p.price)}</td>
                  <td className="num">{baht(p.qty * p.price)}</td>
                  {!readOnly && (
                    <td>
                      <button type="button" className="btn btn-t btn-icon" title="ลบ" onClick={() => edit((x) => { x.parts!.splice(i, 1); })}>
                        <span className="ms">delete</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={6}>
                    <div className="empty">ไม่มีรายการ</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between font-semibold">
          <span>รวมค่าอะไหล่</span>
          <span>{baht(total)}</span>
        </div>
        {!readOnly && (
          <div className="actions">
            <Link className="btn btn-g" href="/overhaul-v2">
              <span className="ms">arrow_back</span> ย้อนกลับ
            </Link>
            <button type="button" className="btn btn-o" onClick={() => { edit((x) => { x.partsSkipped = true; x.step = 2; return "ข้ามขั้นเบิกอะไหล่"; }, "ข้ามขั้นเบิกอะไหล่แล้ว"); go(2); }}>
              ข้ามขั้นนี้
            </button>
            <button type="button" className="btn btn-p" disabled={!rows.length} onClick={() => { edit((x) => { x.step = 2; return `เบิกอะไหล่ ${rows.length} รายการ`; }, "ส่งรายการเบิกอะไหล่แล้ว"); go(2); }}>
              เบิกอะไหล่
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
