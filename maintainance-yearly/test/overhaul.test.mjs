// เกณฑ์เข้าข่าย Overhaul — ตรรกะล้วน ไม่ต้องเปิดเบราว์เซอร์
//   node maintainance-yearly/test/overhaul.test.mjs
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const MYD = require('../mock-yearly.js');

const cfg = {
  ageYears: 15,
  nearRatio: 0.8,
  byType: { 'รถเครน': { mileage: 160000, engineHours: 7000, maintCost: 250000 } },
};
const veh = o => ({ id: 'v1', vehicleType: 'รถเครน', status: 'available',
  mileage: 50000, engineHours: 1000, firstUseYear: 2560, ...o });

// ---------- อายุใช้งาน ----------
assert.equal(MYD.vehicleAgeYears(veh({ firstUseYear: 2554 }), 2569), 15);
assert.equal(MYD.vehicleAgeYears(veh({ firstUseYear: 2569 }), 2569), 0);
assert.equal(MYD.vehicleAgeYears(veh({ firstUseYear: 2575 }), 2569), 0, 'ปีในอนาคตไม่ติดลบ');
assert.equal(MYD.vehicleAgeYears({ vehicleType: 'รถเครน' }, 2569), null, 'ไม่มีปีที่เริ่มใช้ = ประเมินอายุไม่ได้');

// ---------- เข้าข่ายเพราะอายุ (ตัวอย่างที่เจ้าของงานยกมา: เกิน 15 ปี) ----------
{
  const r = MYD.overhaulAssess(veh({ firstUseYear: 2550 }), cfg, { fiscalYearNow: 2569 });
  assert.equal(r.level, 'due');
  assert.deepEqual(r.reasons.map(x => x.key), ['age'], 'ติดเฉพาะข้ออายุ');
  assert.equal(r.reasons[0].value, 19);
  assert.equal(r.reasons[0].limit, 15);
}
// อายุ 15 พอดี = ถึงเกณฑ์แล้ว (เกณฑ์เป็น >=)
assert.equal(MYD.overhaulAssess(veh({ firstUseYear: 2554 }), cfg, { fiscalYearNow: 2569 }).level, 'due');
// อายุ 14 ปี ยังไม่ถึง แต่ 14/15 = 0.93 ≥ 0.8 ⇒ ใกล้เกณฑ์
assert.equal(MYD.overhaulAssess(veh({ firstUseYear: 2555 }), cfg, { fiscalYearNow: 2569 }).level, 'near');

// ---------- เกณฑ์อื่น ----------
{
  const r = MYD.overhaulAssess(veh({ mileage: 170000, engineHours: 7200 }), cfg, { fiscalYearNow: 2569 });
  assert.equal(r.level, 'due');
  assert.deepEqual(r.reasons.map(x => x.key).sort(), ['hours', 'mileage']);
}
{
  const r = MYD.overhaulAssess(veh(), cfg, { fiscalYearNow: 2569, maintCost: 300000 });
  assert.deepEqual(r.reasons.map(x => x.key), ['cost'], 'ต้นทุนสะสมเกินก็เข้าข่าย');
}
assert.equal(MYD.overhaulAssess(veh(), cfg, { fiscalYearNow: 2569 }).level, 'ok', 'ยังไม่ถึงสักข้อ');

// ---------- ชนิดรถที่ไม่มีเกณฑ์ ----------
{
  const r = MYD.overhaulAssess(veh({ vehicleType: 'รถบรรทุกเล็ก', firstUseYear: 2560 }), cfg, { fiscalYearNow: 2569 });
  assert.deepEqual(r.metrics.map(m => m.key), ['age'], 'ชนิดที่ไม่มีเกณฑ์ เหลือเทียบได้แค่ข้ออายุ');
}

// ---------- ธงรอจำหน่าย ----------
assert.equal(MYD.overhaulAssess(veh({ status: 'disposal' }), cfg, { fiscalYearNow: 2569 }).disposalFlag, true);
assert.equal(MYD.overhaulAssess(veh({ status: 'decommissioned' }), cfg, { fiscalYearNow: 2569 }).disposalFlag, true);
assert.equal(MYD.overhaulAssess(veh(), cfg, { fiscalYearNow: 2569 }).disposalFlag, false);

// ---------- ค่าเกณฑ์ตั้งต้น + รถตัวอย่าง ----------
assert.equal(MYD.OVERHAUL_DEFAULTS.ageYears, 15);
assert.ok(MYD.SEED_VEHICLES.every(v => Number.isInteger(v.firstUseYear)), 'รถทุกคันมีปีที่เริ่มใช้งาน');
{
  const d = MYD.overhaulConfig();
  assert.equal(d.ageYears, 15, 'ยังไม่เคยตั้งค่า = ใช้ค่าตั้งต้น');
  assert.ok(d.byType['รถกระเช้า'].mileage > 0);
}
{
  const ages = MYD.SEED_VEHICLES.map(v => MYD.vehicleAgeYears(v, 2569));
  assert.ok(ages.some(a => a > 15) && ages.some(a => a < 15),
    'ข้อมูลตัวอย่างมีทั้งคันที่เกิน 15 ปีและยังไม่เกิน (ไม่งั้นเดโมเห็นด้านเดียว)');
}

console.log('OK: overhaul logic tests passed');
