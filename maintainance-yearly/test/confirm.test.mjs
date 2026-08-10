import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const MYD = require('../mock-yearly.js');

// แผนจำลอง: 4 คัน · ส่งคำขอแล้ว · ครบกำหนด 2568-10-08
const mk = (byVehicle, travelConfirmed = false) => ({
  id: 'p1', selectedVehicleIds: ['a', 'b', 'c', 'd'], travelConfirmed,
  confirm: { requestedAt: '2568-10-01', dueAt: '2568-10-08', remindedAt: null, byVehicle },
});
const ids = ['a', 'b', 'c', 'd'];
const entry = o => Object.assign(
  { answer: 'pending', reason: '', meetPoint: '', by: '', at: '', history: [], verdict: null, verdictWhy: '', verdictAt: '' },
  o);

// ---------- confirmStatus ----------
{
  const p = mk({ a: entry({ answer: 'ready' }), b: entry({ answer: 'notready' }), c: entry({}) });
  const before = '2568-10-05', after = '2568-10-09';
  assert.equal(MYD.confirmStatus(p, 'a', before), 'ready');
  assert.equal(MYD.confirmStatus(p, 'b', before), 'notready');
  assert.equal(MYD.confirmStatus(p, 'c', before), 'pending', 'ยังไม่ถึงกำหนด = รอตอบ');
  assert.equal(MYD.confirmStatus(p, 'c', after), 'overdue', 'เลยกำหนดแล้ว = เลยกำหนด');
  assert.equal(MYD.confirmStatus(p, 'd', after), 'overdue', 'ไม่มี entry ก็นับเป็นยังไม่ตอบ');
  assert.equal(MYD.confirmStatus(p, 'a', after), 'ready', 'ตอบแล้วไม่กลายเป็นเลยกำหนด');
}
// ยังไม่ส่งคำขอ → ทุกคัน pending ไม่ว่าวันไหน
{
  const p = { id: 'p1', selectedVehicleIds: ids, confirm: null };
  assert.equal(MYD.confirmStatus(p, 'a', '2570-01-01'), 'pending', 'ยังไม่ส่งคำขอ = รอตอบ ไม่ใช่เลยกำหนด');
}

// ---------- isVehicleIn: verdict ชนะ answer เสมอ ----------
{
  const p = mk({
    a: entry({ answer: 'ready' }),                        // ตอบพร้อม ไม่มี verdict
    b: entry({ answer: 'notready' }),                     // ตอบไม่พร้อม ยังไม่ตัดสิน
    c: entry({ answer: 'notready', verdict: 'keep' }),    // กบค. สั่งเข้าตามเดิม
    d: entry({ answer: 'ready', verdict: 'drop' }),       // กบค. สั่งตัดออก
  });
  assert.equal(MYD.isVehicleIn(p, 'a'), true);
  assert.equal(MYD.isVehicleIn(p, 'b'), false);
  assert.equal(MYD.isVehicleIn(p, 'c'), true, 'verdict keep ชนะ answer notready');
  assert.equal(MYD.isVehicleIn(p, 'd'), false, 'verdict drop ชนะ answer ready');
  const e = mk({ a: entry({ answer: 'pending', verdict: 'defer' }) });
  assert.equal(MYD.isVehicleIn(e, 'a'), false, 'defer = ไม่เข้าทริปนี้');
}

// ---------- confirmResolved ----------
{
  const notYet = mk({ a: entry({ answer: 'ready' }), b: entry({ answer: 'notready' }), c: entry({}) });
  assert.equal(MYD.confirmResolved(notYet, ids), false, 'ยังมีคันไม่พร้อม/ไม่ตอบ ที่ไม่มี verdict');
  const done = mk({
    a: entry({ answer: 'ready' }),
    b: entry({ answer: 'notready', verdict: 'drop' }),
    c: entry({ answer: 'pending', verdict: 'defer' }),
    d: entry({ answer: 'ready' }),
  });
  assert.equal(MYD.confirmResolved(done, ids), true, 'ทุกคันมีข้อสรุปแล้ว');
}

// ---------- confirmSummary ----------
{
  const p = mk({
    a: entry({ answer: 'ready' }),
    b: entry({ answer: 'ready' }),
    c: entry({ answer: 'notready' }),
    d: entry({}),
  });
  const s = MYD.confirmSummary(p, ids, '2568-10-09');
  assert.equal(s.total, 4);
  assert.equal(s.ready, 2);
  assert.equal(s.notready, 1);
  assert.equal(s.overdue, 1);
  assert.equal(s.waiting, 0, 'เลยกำหนดแล้วไม่นับเป็นรอตอบซ้ำ');
  assert.equal(s.joining, 2, 'เข้าทริป = a, b');
}

// ---------- confirmLocked ----------
assert.equal(MYD.confirmLocked(mk({}, false)), false);
assert.equal(MYD.confirmLocked(mk({}, true)), true, 'ยืนยันแผนเดินทางแล้ว = ล็อก');

// ---------- settings ----------
assert.equal(MYD.loadSettings().confirmDueDays, 7, 'ค่าตั้งต้น 7 วัน');

// ---------- ownerDept + seed ----------
assert.ok(MYD.SEED_VEHICLES.every(v => typeof v.ownerDept === 'string' && v.ownerDept),
  'รถทุกคันมี ownerDept');
assert.ok(!MYD.SEED_VEHICLES.some(v => /^เขต /.test(v.ownerDept)),
  'ownerDept ต้องเป็นชื่อหน่วยงานจริง ไม่ใช่ "เขต N"');
{
  const cf = MYD.SEED_PLAN_CF;
  assert.equal(cf.travelConfirmed, false, 'แผนเดโม CF ต้องยังไม่ยืนยันแผนเดินทาง');
  assert.ok(cf.confirm && cf.confirm.requestedAt, 'ส่งคำขอไปแล้ว');
  const n = id => cf.selectedVehicleIds.filter(v => MYD.confirmStatus(cf, v, '2570-01-01') === id).length;
  assert.equal(n('ready'), 8, 'พร้อม 8');
  assert.equal(n('notready'), 2, 'ไม่พร้อม 2');
  assert.equal(n('overdue'), 2, 'ยังไม่ตอบ 2 (dueAt เป็นอดีต → เลยกำหนด)');
  assert.equal(MYD.confirmResolved(cf, cf.selectedVehicleIds), false, 'ยังตัดสินไม่ครบ — เดโมได้');
  assert.equal(MYD.SEED_PLAN.travelConfirmed, true, 'แผนเดิมยังเป็นตัวตั้งต้นของเฟส 2');
}

console.log('OK: confirm logic tests passed');
