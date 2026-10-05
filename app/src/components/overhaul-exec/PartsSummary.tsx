"use client";

// สรุปรายการอะไหล่ — ยกจาก figma/สรุปรายการอะไหล่.svg (+ -mobile.svg) · คลาส .psum-* ใน components.css (v0.66)
// ใช้ 2 ที่: modal ก่อนยืนยันเบิกอะไหล่ (PartsSummaryModal) และการ์ดสรุปหลังยืนยันแล้ว (ขั้น ② แบบอ่านอย่างเดียว)
import { useEffect } from "react";
import { fmtNum } from "@/lib/overhaul";
import { partsBreakdown, type PartLine, type SumRow } from "@/lib/overhaulExec";

const baht = (n: number) => `${fmtNum(n)} บาท`; // Figma แสดงจำนวนเต็ม ไม่มีทศนิยม ("2,580 บาท")

function Group({ title, rows }: { title: string; rows: SumRow[] }) {
  if (!rows.length) return null;
  return (
    <div className="psum-grp">
      <b>{title}</b>
      {rows.map((r) => (
        <div className="psum-row" key={r.code}>
          <span>
            {r.name} x{fmtNum(r.qty)}
          </span>
          <span>{baht(r.amount)}</span>
        </div>
      ))}
    </div>
  );
}

// บล็อก "รวมค่าอะไหล่" — full = 4 บรรทัดแบบ modal · ไม่ full = 2 บรรทัดแบบท้ายหน้าเบิกอะไหล่ (เบิกจากคลัง/ต้องจัดซื้อ)
export function PartsTotal({ items, full }: { items: PartLine[]; full?: boolean }) {
  const { totals: t } = partsBreakdown(items);
  const rows: [string, number][] = full
    ? [
        ["เบิกจาก Smart Inventory", t.takeSi],
        ["เบิกจากคลังสำรอง", t.takeAlt],
        ["จัดซื้ออะไหล่เพิ่มโดย Smart Inventory", t.buySi],
        ["จัดซื้ออะไหล่เพิ่มโดย กบค.", t.buyAlt],
      ]
    : [
        ["เบิกจากคลัง", t.take],
        ["ต้องจัดซื้อ", t.buy],
      ];
  return (
    <div className="psum-total">
      <h3 className="parts-pane-title">รวมค่าอะไหล่</h3>
      {rows.map(([l, v]) => (
        <div className="psum-row" key={l}>
          <span>{l}</span>
          <span>{baht(v)}</span>
        </div>
      ))}
      <div className="psum-row grand">
        <span>{full ? "รวม" : "รวมทั้งหมด"}</span>
        <span>{baht(t.all)}</span>
      </div>
    </div>
  );
}

export function PartsSummary({ items }: { items: PartLine[] }) {
  const { take, buy } = partsBreakdown(items);
  const hasTake = take.si.length + take.alt.length > 0;
  const hasBuy = buy.si.length + buy.alt.length > 0;
  return (
    <div>
      <div className="psum-sect">อะไหล่ที่เบิก</div>
      <div className="psum-box">
        {hasTake ? (
          <>
            <Group title="เบิกที่ Smart Inventory" rows={take.si} />
            <Group title="เบิกที่คลังสำรอง" rows={take.alt} />
          </>
        ) : (
          <p className="psum-empty">ไม่มีอะไหล่ที่เบิกจากคลัง</p>
        )}
      </div>
      <div className="psum-sect">อะไหล่ที่จัดซื้อ</div>
      <div className="psum-box">
        {hasBuy ? (
          <>
            <Group title="จัดซื้ออะไหล่เพิ่มโดย Smart Inventory" rows={buy.si} />
            <Group title="จัดซื้ออะไหล่เพิ่มโดย กบค." rows={buy.alt} />
          </>
        ) : (
          <p className="psum-empty">ไม่มีอะไหล่ที่ต้องจัดซื้อ</p>
        )}
      </div>
      <PartsTotal items={items} full />
    </div>
  );
}

export function PartsSummaryModal({ items, onClose, onConfirm }: { items: PartLine[]; onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal md psum-modal" role="dialog" aria-modal="true" aria-labelledby="psum-title">
        <div className="modal-hd">
          <div className="modal-hd-c">
            <h2 id="psum-title">สรุปรายการอะไหล่</h2>
            <button className="btn btn-t btn-icon" onClick={onClose} aria-label="ปิด">
              <span className="ms">close</span>
            </button>
          </div>
        </div>
        <div className="modal-bd">
          <PartsSummary items={items} />
        </div>
        <div className="modal-ft">
          <div className="modal-ft-a">
            <div className="modal-ft-r">
              <button className="btn btn-s" onClick={onClose}>
                ปิด
              </button>
              <button className="btn btn-p" onClick={onConfirm}>
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
