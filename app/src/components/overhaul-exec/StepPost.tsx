"use client";

// ⑥ ตรวจสภาพหลัง Overhaul (JO 7.4.2-04 · ภาพหลัง 7.4.2-05)
// โครงตามภาพระบบจริง flow/repair ขั้น "ตรวจสภาพหลังซ่อม":
//   ข้อมูลยานพาหนะ + เลขไมล์/ชั่วโมงเครื่องจักรปัจจุบัน → ตรวจ 24 ข้อ → ลงนามการส่งคืนรถ
//   → คะแนนประเมินคุณภาพงานซ่อมบำรุง 1–5 → รายการสภาพวัสดุอะไหล่ (จำนวนที่ใช้ · ที่คืน = เบิก − ใช้ · ราคาต่อหน่วย · ราคารวม)
//   → "ยืนยันการตรวจสภาพ"
// + ของ Overhaul: ตาราง 24 ข้อมีคอลัมน์ผลก่อน Overhaul เทียบ · ทดสอบความปลอดภัย · ใบรับรอง · รับประกัน 180 วัน · ภาพหลัง
// ⚠️ รายการทดสอบความปลอดภัย · เลขที่ใบรับรอง · แบบฟอร์มใบรับรอง = จำลอง
import { useCallback, useState } from "react";
import { RoField } from "@/components/RoField";
import { fmtDate, fmtNum, type OverhaulPlan, type PlanVehicle, type Vehicle } from "@/lib/overhaul";
import {
  INSPECTOR,
  SAFETY_TESTS,
  WARRANTY_DAYS,
  addDays,
  freshInspect,
  freshSign,
  issuedParts,
  partInfo,
  type PostStep,
} from "@/lib/overhaulExec";
import { InspectTable, uncheckedCount } from "./InspectTable";
import { DocModal } from "./DocModal";
import { PhotoAttach, SectionTitle, SignBlock, StepActions, VehicleInfoBox } from "./common";

export function StepPost({
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
  const saved = pv.post;
  const locked = !!saved?.confirmedAt;
  const before = pv.preAssessment?.items ?? [];
  const issued = issuedParts(pv);
  const fresh = (): PostStep => ({
    odo: "",
    hours: "",
    items: before.length ? before.map((r) => ({ label: r.label, note: "", custom: r.custom })) : freshInspect(),
    sign: freshSign(),
    used: Object.fromEntries(issued.map((l) => [l.code, l.qty])),
    tests: SAFETY_TESTS.map((label) => ({ label })),
    photos: [],
  });
  const [draft, setDraft] = useState<PostStep | null>(null);
  const [certOpen, setCertOpen] = useState(false);
  const closeCert = useCallback(() => setCertOpen(false), []);
  const P = locked ? saved! : (draft ?? saved ?? fresh());
  const edit = (patch: Partial<PostStep>) => setDraft({ ...P, ...patch });

  const unchecked = uncheckedCount(P.items);
  const stillFix = P.items.filter((r) => r.status === "FIX").length;
  const untested = P.tests.filter((t) => t.pass === undefined).length;
  const failed = P.tests.filter((t) => t.pass === false).length;
  const blockers = [
    !P.odo || !P.hours ? "ระบุเลขไมล์และชั่วโมงการทำงานเครื่องจักรปัจจุบัน" : "",
    unchecked ? `ยังไม่ได้ตรวจสภาพ ${unchecked} รายการ` : "",
    stillFix ? `ยังมี ${stillFix} รายการต้องแก้ไข` : "",
    untested ? `ยังไม่ได้บันทึกผลทดสอบความปลอดภัย ${untested} รายการ` : "",
    failed ? `ทดสอบไม่ผ่าน ${failed} รายการ — ออกใบรับรองไม่ได้` : "",
    P.rating ? "" : "ให้คะแนนประเมินคุณภาพ",
  ].filter(Boolean);

  const certNo = P.certNo ?? `SC-${plan.planNo.replace("OVH-", "")}-${v.id.toUpperCase()}`;
  const certDate = P.certDate ?? new Date().toISOString();
  const warrantyEnd = addDays(certDate, WARRANTY_DAYS);

  return (
    <>

      <SectionTitle>ข้อมูลยานพาหนะ</SectionTitle>
      <VehicleInfoBox v={v} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="f">
          <label htmlFor="post-odo">เลขไมล์ปัจจุบัน</label>
          <input id="post-odo" type="number" min={0} placeholder="ระบุเลขไมล์" value={P.odo} disabled={locked} onChange={(e) => edit({ odo: e.target.value })} />
        </div>
        <div className="f">
          <label htmlFor="post-hours">ชั่วโมงการทำงานเครื่องจักรปัจจุบัน</label>
          <input
            id="post-hours"
            type="number"
            min={0}
            placeholder="ระบุชั่วโมงการทำงานเครื่องจักรปัจจุบัน"
            value={P.hours}
            disabled={locked}
            onChange={(e) => edit({ hours: e.target.value })}
          />
        </div>
      </div>

      <SectionTitle>รายละเอียดการตรวจสภาพหลัง Overhaul</SectionTitle>
      <InspectTable name="post" items={P.items} before={before} locked={locked} onChange={(items) => edit({ items })} />

      <SectionTitle>ทดสอบมาตรฐานความปลอดภัย</SectionTitle>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>รายการทดสอบ</th>
              <th className="text-center! w-28">ผ่าน</th>
              <th className="text-center! w-28">ไม่ผ่าน</th>
            </tr>
          </thead>
          <tbody>
            {P.tests.map((t, i) => (
              <tr key={t.label}>
                <td>
                  {i + 1}. {t.label}
                </td>
                {[true, false].map((val) => (
                  <td key={String(val)} className="text-center">
                    <input
                      type="radio"
                      name={`safety-${i}`}
                      aria-label={`${t.label} — ${val ? "ผ่าน" : "ไม่ผ่าน"}`}
                      checked={t.pass === val}
                      disabled={locked}
                      onChange={() => edit({ tests: P.tests.map((x, k) => (k === i ? { ...x, pass: val } : x)) })}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PhotoAttach id="post-photos" label="ภาพรถ/เครื่องมือกล หลัง Overhaul" photos={P.photos} locked={locked} onChange={(photos) => edit({ photos })} />

      <SectionTitle>ลงนามการส่งคืนรถ</SectionTitle>
      <SignBlock id="post-sign" sign={P.sign} locked={locked} onChange={(sign) => edit({ sign })} />

      <SectionTitle>คะแนนประเมินคุณภาพงานซ่อมบำรุง</SectionTitle>
      <div className="radcards cols-5" role="radiogroup" aria-label="คะแนนประเมินคุณภาพ">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`radcard${P.rating === n ? " sel" : ""}${locked ? " is-readonly" : ""}`}>
            <input type="radio" name="rating" checked={P.rating === n} disabled={locked} onChange={() => edit({ rating: n })} />
            <span className="rdot" />
            <span className="rc-tx">
              <b>{n}</b>
            </span>
          </label>
        ))}
      </div>

      <SectionTitle>รายการสภาพวัสดุอะไหล่</SectionTitle>
      <div className="tblwrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>รายการ</th>
              <th>จำนวนที่ใช้</th>
              <th title="จำนวนที่คืน = จำนวนที่เบิก − จำนวนที่ใช้">จำนวนที่คืน</th>
              <th>ราคาต่อหน่วย</th>
              <th>ราคารวม</th>
            </tr>
          </thead>
          <tbody>
            {issued.map((l, i) => {
              const p = partInfo(l);
              const used = P.used[l.code] ?? l.qty;
              const setUsed = (n: number) => edit({ used: { ...P.used, [l.code]: Math.min(l.qty, Math.max(0, n)) } });
              return (
                <tr key={l.code}>
                  <td>
                    {i + 1}. {p.name}
                  </td>
                  <td>
                    {locked ? (
                      fmtNum(used)
                    ) : (
                      <div className="qty w-fit">
                        <button type="button" aria-label={`ลดจำนวนที่ใช้ ${p.name}`} onClick={() => setUsed(used - 1)}>
                          −
                        </button>
                        <span>{used}</span>
                        <button type="button" aria-label={`เพิ่มจำนวนที่ใช้ ${p.name}`} onClick={() => setUsed(used + 1)}>
                          +
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    <input className="tbl-cell-ro" readOnly aria-label={`จำนวนที่คืน ${p.name}`} value={fmtNum(l.qty - used)} />
                  </td>
                  <td>{fmtNum(p.price)}</td>
                  <td>
                    <input className="tbl-cell-ro" readOnly aria-label={`ราคารวม ${p.name}`} value={fmtNum(p.price * used)} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <SectionTitle>ใบรับรองความปลอดภัยและการรับประกัน</SectionTitle>
      <div className="fgrid m-0!">
        <RoField label="เลขที่ใบรับรอง" icon="verified" value={certNo} />
        <RoField label="วันที่ออกใบรับรอง" icon="calendar_month" value={fmtDate(certDate)} />
        <RoField label={`รับประกัน ${WARRANTY_DAYS} วัน ตั้งแต่`} icon="shield" value={fmtDate(certDate)} />
        <RoField label="สิ้นสุดรับประกัน" icon="event_busy" value={fmtDate(warrantyEnd)} />
      </div>
      {locked && (
        <div>
          <button className="btn btn-s" onClick={() => setCertOpen(true)}>
            <span className="ms">description</span> ดูใบรับรองความปลอดภัย
          </button>
        </div>
      )}

      <StepActions
        locked={locked}
        blockers={blockers}
        confirmLabel="ยืนยันการตรวจสภาพ"
        onDraft={() => {
          save({ post: P }, "บันทึกร่างการตรวจสภาพหลัง Overhaul");
          setDraft(null);
        }}
        onConfirm={() => {
          const now = new Date().toISOString();
          save(
            { post: { ...P, certNo, certDate: now, confirmedAt: now, confirmedBy: INSPECTOR } },
            `ยืนยันการตรวจสภาพหลัง Overhaul · ออกใบรับรองความปลอดภัย ${certNo}`,
          );
          setDraft(null);
        }}
      />

      {certOpen && (
        <DocModal title="ใบรับรองความปลอดภัย (หลัง Overhaul)" onClose={closeCert}>
          <div className="fgrid grid-cols-2! m-0!">
            <RoField label="เลขที่ใบรับรอง" icon="verified" value={certNo} />
            <RoField label="วันที่ออก" icon="calendar_month" value={fmtDate(certDate)} />
            <RoField label="ทะเบียน" icon="directions_car" value={v.plate} />
            <RoField label="สังกัด" icon="apartment" value={v.orgUnit} />
            <RoField label="ยี่ห้อเครื่องมือกล" icon="precision_manufacturing" value={v.equipmentBrand} />
            <RoField label="หมายเลขเครน / S/N" icon="tag" value={`${v.equipmentNo} · ${v.serialNo}`} />
            <RoField label="แผน Overhaul" icon="list_alt" value={plan.planNo} />
            <RoField label="ผู้ตรวจรับรอง" icon="person" value={P.confirmedBy ?? INSPECTOR} />
            <RoField label="รับประกันตั้งแต่" icon="shield" value={fmtDate(certDate)} />
            <RoField label="สิ้นสุดรับประกัน" icon="event_busy" value={fmtDate(warrantyEnd)} />
          </div>
          <div className="sect">ผลทดสอบมาตรฐานความปลอดภัย</div>
          <ul className="list-disc pl-5 text-sm">
            {P.tests.map((t) => (
              <li key={t.label}>
                {t.label} — <b>{t.pass ? "ผ่าน" : "ไม่ผ่าน"}</b>
              </li>
            ))}
          </ul>
          <p className="text-sm">
            ผลตรวจสภาพเครื่องมือกลหลัง Overhaul: ปกติ {P.items.filter((r) => r.status === "OK").length} จาก {P.items.length} รายการ
          </p>
        </DocModal>
      )}
    </>
  );
}
