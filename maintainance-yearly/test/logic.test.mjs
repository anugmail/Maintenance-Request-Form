import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const MYD = require('../mock-yearly.js');

const v = (id, vehicleType) => ({ id, plate:id, vehicleType, criteria:'truck', status:'available', mileage:0, engineHours:0 });
const items = [
  { id:'o1', name:'น้ำมันเครื่อง', category:'oil', oilKind:'engine', unit:'ลิตร', appliesToTypes:['รถกระเช้า','รถเครน'], qtyPerVehicle:12 },
  { id:'p1', name:'ผ้าเบรก', category:'part', unit:'ชุด', appliesToTypes:['รถกระเช้า'], qtyPerVehicle:1 },
  { id:'f3', name:'ไส้กรองอากาศ', category:'filter', unit:'ชิ้น', appliesToTypes:['รถขุด'], qtyPerVehicle:1 },
];

// deriveItems
const lines = MYD.deriveItems([v('a','รถกระเช้า'), v('b','รถกระเช้า'), v('c','รถเครน')], items);
assert.deepEqual(lines.map(l => l.item.id), ['p1','o1'], 'part ก่อน oil, ไส้กรองอากาศถูกตัด (ไม่มีรถขุด)');
assert.equal(lines.find(l=>l.item.id==='o1').vehicleCount, 3);
assert.equal(lines.find(l=>l.item.id==='o1').totalQty, 36);
assert.equal(lines.find(l=>l.item.id==='p1').totalQty, 2);
assert.deepEqual(MYD.deriveItems([], items), [], 'ไม่มีรถ → []');

// workNumber — 1 แผน = 1 เลขงาน (8 ก.ย. 2569) ไม่มีส่วนไตรมาสในเลขแล้ว
assert.equal(MYD.workNumber(2569,1), 'MT-2569-001');
assert.equal(MYD.workNumber(2570,42), 'MT-2570-042');
assert.equal(MYD.workNumber(2569,123), 'MT-2569-123');

// ออกเลขให้แผน — ได้เลขเดียว เก็บที่ plan.workNumber
{
  const plan = MYD.newPlan('1 ต.ค. 2568 09:00');
  plan.year = 2571;
  const no = MYD.issueWorkNumber(plan, 7);
  assert.equal(no, 'MT-2571-007');
  assert.equal(plan.workNumber, 'MT-2571-007');
  assert.equal(plan.workNumbers, undefined, 'ไม่มีเลขรายไตรมาสแล้ว');
}

console.log('OK: all logic tests passed');
