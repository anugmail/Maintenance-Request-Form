"use client";

// หน้าเบิกอะไหล่ 2 คอลัมน์ — ตามภาพออกแบบจริง figma/หน้าเบิกอะไหล่-{default,filled,empty}.jpg (เจ้าของงานสั่ง 1 ต.ค. 2569)
// ใช้ทั้งขั้น ① เบิกอะไหล่ และ "เบิกอะไหล่เพิ่ม" ตอนพบอาการเพิ่มในขั้น ④
//   ซ้าย "คลังอะไหล่": การ์ดละ 1 แหล่ง (อะไหล่เดียวกันใน Smart Inventory กับคลังสำรองเป็นคนละการ์ด) · ป้าย "แนะนำ" = อะไหล่ประจำรุ่น
//        การ์ดที่เลือกแล้วหายจากฝั่งซ้าย (ภาพ filled เหลือเฉพาะที่ยังไม่เลือก)
//   ขวา "อะไหล่ที่ต้องการใช้งาน": ไม่มีแท็บ · การ์ด .parts-picked-item.stacked · คลังสำรองเบิกไม่เกินยอด (+ ปิด)
//        Smart Inventory เกินยอดได้ → "| ต้องจัดซื้อ N ชิ้น" · "ระบุอะไหล่เพิ่มเติม" = การ์ดกรอกเอง (ซื้อเพิ่มเติม)
//        ท้ายคอลัมน์ "รวมค่าอะไหล่" เบิกจากคลัง / ต้องจัดซื้อ / รวมทั้งหมด
// ราคาแสดงเป็นจำนวนเต็มตามภาพ ("650 บาท/ชิ้น" · "6,500 บาท") · ⚠️ ยอดคงคลังจำลอง ยังไม่ตัด/คืนยอดจริง
import { useState } from "react";
import { EmptyState } from "@/components/EmptyState";
import { fmtNum, type Vehicle } from "@/lib/overhaul";
import {
  WAREHOUSE_LABEL,
  modelKit,
  partHave,
  partInfo,
  partMax,
  partShort,
  partsFor,
  type PartLine,
  type Warehouse,
} from "@/lib/overhaulExec";
import { PartsTotal } from "./PartsSummary";

function Qty({ value, min, max, label, onChange }: { value: number; min: number; max: number; label: string; onChange: (n: number) => void }) {
  return (
    <div className="qty lg">
      <button type="button" aria-label={`ลดจำนวน ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <span>{value}</span>
      <button type="button" aria-label={`เพิ่มจำนวน ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
    </div>
  );
}

export function PartsPicker({ v, items, onChange }: { v: Vehicle; items: PartLine[]; onChange: (items: PartLine[]) => void }) {
  const [q, setQ] = useState("");
  const rec = new Set(modelKit(v).map((p) => p.code));
  const key = (l: { code: string; wh: Warehouse }) => `${l.code}:${l.wh}`;
  const picked = new Set(items.map(key));
  const update = (k: string, patch: Partial<PartLine>) => onChange(items.map((l) => (key(l) === k ? { ...l, ...patch } : l)));
  const remove = (k: string) => onChange(items.filter((l) => key(l) !== k));

  // ฝั่งซ้าย: การ์ดละแหล่ง — Smart Inventory ทุกตัว (เกินยอดได้ ระบบจัดซื้อให้) · คลังสำรองเฉพาะที่มีของ
  const kw = q.trim().toLowerCase();
  const stock = partsFor(v)
    .flatMap((p) => [
      { p, wh: "si" as Warehouse, have: p.stock },
      ...(p.stockAlt > 0 ? [{ p, wh: "alt" as Warehouse, have: p.stockAlt }] : []),
    ])
    .filter((x) => !picked.has(key({ code: x.p.code, wh: x.wh })))
    .filter((x) => !kw || `${x.p.name} ${x.p.code}`.toLowerCase().includes(kw))
    .sort((a, b) => Number(rec.has(b.p.code)) - Number(rec.has(a.p.code)));

  return (
    <div className="parts-workspace mt-0">
      <section className="parts-pane">
        <h2 className="parts-pane-title">คลังอะไหล่</h2>
        <p className="parts-pane-sub">Smart Inventory และคลังสำรองเบิกได้เหมือนกัน</p>
        <div className="search">
          <span className="ms">search</span>
          <input type="search" placeholder="ค้นหาชื่อหรือรหัสอะไหล่" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="parts-scroll">
          {stock.length === 0 ? (
            <EmptyState title="ไม่พบรายการ" desc="กรุณาค้นหาอะไหล่" />
          ) : (
            <div className="parts-stock-list">
              {stock.map(({ p, wh, have }) => (
                <div className="parts-stock-item" key={`${p.code}:${wh}`}>
                  <div>
                    <b>{p.name}</b>
                    {rec.has(p.code) && <span className="badge b-info ml-2">แนะนำ</span>}
                    <div className="parts-line">
                      {p.code} · {fmtNum(p.price)} บาท/{p.unit}
                    </div>
                    <div className="parts-source">
                      <b>{WAREHOUSE_LABEL[wh]}</b> : มีในคลัง {fmtNum(have)} {p.unit}
                    </div>
                  </div>
                  <button
                    className="btn btn-s btn-icon"
                    aria-label={`เพิ่ม ${p.name} จาก${WAREHOUSE_LABEL[wh]}`}
                    onClick={() => onChange([...items, { code: p.code, qty: 1, wh }])}
                  >
                    <span className="ms">add</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="parts-pane">
        <h2 className="parts-pane-title">อะไหล่ที่ต้องการใช้งาน</h2>
        <p className="parts-pane-sub">
          {items.length
            ? "จำนวนที่เกินยอดในคลัง จะถูกตั้งเป็นรายการจัดซื้อให้อัตโนมัติ"
            : "เลือกอะไหล่จากคลังเพื่อเบิกหรือยื่นรายการจัดซื้อสำหรับงานซ่อมครั้งนี้"}
        </p>
        {items.length > 0 && (
          <div className="parts-picked-list has-items">
            {items.map((l) => {
              const k = key(l);
              const info = partInfo(l);
              const short = partShort(l);
              const side = (
                <div className="pp-side">
                  <button className="btn btn-t btn-icon" title="เอาออกจากรายการ" aria-label={`ลบ ${info.name}`} onClick={() => remove(k)}>
                    <span className="ms">delete</span>
                  </button>
                  <div className="pp-bottom">
                    <span className="parts-price">{fmtNum(info.price * l.qty)} บาท</span>
                    <Qty
                      value={l.qty}
                      min={l.wh === "buy" ? 0 : 1}
                      max={partMax(l)}
                      label={info.name}
                      onChange={(qty) => update(k, { qty })}
                    />
                  </div>
                </div>
              );
              if (l.wh === "buy")
                return (
                  <div className="parts-picked-item stacked" key={k}>
                    <div className="pp-main">
                      <div className="parts-manual-grid">
                        <div className="f wide">
                          <label htmlFor={`${k}-name`}>ชื่ออะไหล่</label>
                          <input id={`${k}-name`} type="text" placeholder="ระบุชื่ออะไหล่" value={l.name ?? ""} onChange={(e) => update(k, { name: e.target.value })} />
                        </div>
                        <div className="f">
                          <label htmlFor={`${k}-no`}>
                            รหัสอะไหล่ <span className="font-normal text-[var(--gray-500)]">(ถ้ามี)</span>
                          </label>
                          <input id={`${k}-no`} type="text" placeholder="ระบุรหัสอะไหล่" value={l.partNo ?? ""} onChange={(e) => update(k, { partNo: e.target.value })} />
                        </div>
                        <div className="f">
                          <label htmlFor={`${k}-price`}>
                            ราคาอะไหล่ต่อชิ้น <span className="font-normal text-[var(--gray-500)]">(ถ้ามี)</span>
                          </label>
                          <input
                            id={`${k}-price`}
                            type="number"
                            min={0}
                            placeholder="ระบุราคาอะไหล่ต่อชิ้น"
                            value={l.price ?? ""}
                            onChange={(e) => update(k, { price: e.target.value === "" ? undefined : Math.max(0, +e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>
                    {side}
                  </div>
                );
              return (
                <div className="parts-picked-item stacked" key={k}>
                  <div className="pp-main">
                    <div>
                      <b>{info.name}</b>
                      {rec.has(l.code) && <span className="badge b-info ml-2">แนะนำ</span>}
                    </div>
                    <div className="parts-line">
                      {info.code} · {fmtNum(info.price)} บาท/{info.unit}
                    </div>
                    <div className="parts-source">
                      <b>{WAREHOUSE_LABEL[l.wh]}</b> : มีในคลัง {fmtNum(partHave(l))} {info.unit}
                      {short > 0 && (
                        <>
                          {" "}
                          | ต้องจัดซื้อ {fmtNum(short)} {info.unit}
                        </>
                      )}
                    </div>
                  </div>
                  {side}
                </div>
              );
            })}
          </div>
        )}
        <button
          type="button"
          className="btn btn-s btn-lg parts-add-manual mt-4"
          onClick={() => onChange([...items, { code: `custom-${Date.now()}`, qty: 0, wh: "buy" }])}
        >
          <span className="ms">add</span> ระบุอะไหล่เพิ่มเติม
        </button>
        <div className="mt-4 border-t border-[var(--gray-200)] pt-4">
          <PartsTotal items={items} />
        </div>
      </section>
    </div>
  );
}
