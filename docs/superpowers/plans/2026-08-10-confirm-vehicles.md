# ขั้นยืนยันรถเข้าร่วมแผน (CF) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เพิ่มขั้น "ยืนยันรถเข้าร่วมแผน" เข้าเฟส 1 ของโฟลว์บำรุงรักษาตามวาระ — กบค. ส่งคำขอไปหน่วยงานเจ้าของรถ เห็นผลตอบกลับรายคัน ตัดสินคันที่ไม่พร้อม แล้วแผนเดินทางจึงใช้จำนวนคันที่ยืนยันแล้ว

**Architecture:** static HTML + vanilla JS ไม่มี build step · logic ล้วนอยู่ `mock-yearly.js` (`window.MYD`) เทสด้วย node ได้ · state อยู่ localStorage · หน้าหน่วยงานเจ้าของรถเป็นหน้าใหม่ `confirm.html` ทำตามแพตเทิร์น list→detail ของ `supplies.html` ที่มีอยู่แล้ว

**Tech Stack:** HTML/CSS/vanilla JS (ES2020) · node test runner (assert ล้วน ไม่มี framework) · playwright-core + Chromium ที่ติดเครื่อง

**สเปก:** [`../specs/2026-08-10-confirm-vehicles-design.md`](../specs/2026-08-10-confirm-vehicles-design.md)

## Global Constraints

- **Design system บังคับ** — ก่อนแตะ HTML/CSS ต้องอ่าน `design-system/README.md` (กฎข้อ 0) + `design-system/components.css` · ใช้คลาสที่มีอยู่ก่อนเสมอ · ของใหม่เพิ่มใน `components.css` ห้ามเขียน CSS คอมโพเนนต์ใน `<style>` ของหน้า · สีใช้ `var(--…)` ห้าม hex · ไอคอน `<span class="ms">ชื่อ</span>` (Material Symbols) ห้าม emoji/inline svg · light เท่านั้น
- **แก้ `components.css`/`tokens.css` → บั๊ม `?v=` ทุกหน้าที่ลิงก์** + อัปเดตตารางหัวข้อ 4 และ Changelog หัวข้อ 8 ของ `design-system/README.md`
- **ห้ามเรียก `Date` ใน `mock-yearly.js`** — logic ที่นั่นต้อง pure/deterministic (กติกาเขียนไว้หัวไฟล์บรรทัด 20-21) · วันที่ส่งเข้ามาเป็นพารามิเตอร์
- **ห้ามเขียน record ลง localStorage ตั้งแต่เปิดหน้า** — บทเรียนจากบั๊ก `plan-new.html` 8 ส.ค. · เขียนเมื่อผู้ใช้กดจริงเท่านั้น
- **แก้ flow → อัปเดตผัง `Diagram/01-บำรุงรักษาตามวาระ/` ในคอมมิตเดียวกัน** และผังต้อง `parse()` + `render()` ผ่านจริง
- **push เสร็จ → ไล่อัปเดต `plan.md` (ราก) + `maintainance-yearly/plan.md` ให้ตรงทันที**
- ทดสอบด้วย `python3 -m http.server 8123 --bind 127.0.0.1` เท่านั้น **ห้าม `file://`**
- คำที่ใช้ในหน้าจอ: **กบค.** (ไม่ใช่ "กบก." — เป็นคำผิดที่ไล่แก้ไปแล้ว 113 จุด) · สถานะรถ `available` = **"พร้อมเข้าแผน"**

## ตัดสินใจที่ต่างจากรอบก่อน (ต้องรู้ก่อนลงมือ)

**เพิ่มแผนตัวอย่างเป็น 2 ใบ** — รอบ 8 ส.ค. ยุบเหลือ 1 ใบเพราะบั๊กสร้างร่างเปล่า แต่เหตุผลที่เจ้าของงานให้ไว้ตอนนั้นคือ *"เวลาจะทำเฟส 2 ต้องใช้แผนที่สร้างเสร็จแล้ว"* — ตรรกะเดียวกันใช้กับรอบนี้: จะทำ/เดโมขั้น CF ต้องมีแผนที่**ค้างอยู่ที่ขั้น CF** เพราะ `SEED_PLAN` เดิม `travelConfirmed: true` ⇒ CF ถูกล็อกตามกติกาข้อ 4 ตอบอะไรไม่ได้เลย

| แผน | เลขงาน | สภาพ | ใช้ทำอะไร |
|---|---|---|---|
| `SEED_PLAN` (เดิม) | `MT-2569-Q1-001` | เฟส 1 เสร็จ · CF ครบและล็อกแล้ว | ตัวตั้งต้นของเฟส 2 (เหมือนเดิม) |
| `SEED_PLAN_CF` 🆕 | `MT-2569-Q1-002` | เบิกอะไหล่แล้ว · **ค้างที่ CF** · `travelConfirmed: false` | เดโม/พัฒนา CF รอบนี้ |

---

# Task 1: โครงข้อมูล + logic ล้วน + node tests

**Files:**
- Modify: `maintainance-yearly/mock-yearly.js`
- Create: `maintainance-yearly/test/confirm.test.mjs`

**Interfaces:**
- Consumes: `MYD.loadPlans/savePlan/getPlan`, `MYD.SEED_VEHICLES`, `deepCopy` (มีอยู่แล้ว)
- Produces (Task 2-5 เรียกใช้):
  - `MYD.confirmStatus(plan, vehicleId, todayIso) -> 'pending'|'ready'|'notready'|'overdue'`
  - `MYD.isVehicleIn(plan, vehicleId) -> boolean`
  - `MYD.confirmResolved(plan, vehicleIds) -> boolean`
  - `MYD.confirmSummary(plan, vehicleIds, todayIso) -> {total,ready,waiting,notready,overdue,joining}`
  - `MYD.confirmLocked(plan) -> boolean`
  - `MYD.emptyConfirmEntry() -> entry` (entry เปล่า 1 ชุด)
  - `MYD.ensureConfirm(plan) -> plan.confirm` (สร้างโครงในหน่วยความจำ ไม่เขียน storage)
  - `MYD.vehicleConfirm(plan, vehicleId) -> entry` (คืน entry เปล่าถ้ายังไม่มี)
  - `MYD.loadSettings() -> {confirmDueDays}` · `MYD.saveSettings(s)`
  - `MYD.OWNER_DEPTS_BY_REGION` · `vehicle.ownerDept`
  - `MYD.SEED_PLAN_CF`

- [ ] **Step 1: เขียนเทสที่ต้องล้มก่อน**

สร้าง `maintainance-yearly/test/confirm.test.mjs` — สไตล์เดียวกับ `test/logic.test.mjs` (assert ล้วน ไม่มี framework)

```js
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
```

- [ ] **Step 2: รันเทสให้เห็นว่าล้ม**

```bash
cd Maintenance-Request/Maintenance-Request-Form/maintainance-yearly
node test/confirm.test.mjs
```
Expected: FAIL — `TypeError: MYD.confirmStatus is not a function`

- [ ] **Step 3: เพิ่ม `OWNER_DEPTS_BY_REGION` (ชื่อหน่วยงานจริง)**

`hierarchy-data.json` มี **12 ภาคจริงของ กฟภ.** (กฟน.1-3 · กฟก.1-3 · กฟฉ.1-3 · กฟต.1-3) พอดีกับ "เขต 1-12" ของต้นแบบ — ชื่อด้านล่างสกัดมาแล้วและ**แก้สระ า/ำ ที่เพี้ยนเรียบร้อย** วางลง `mock-yearly.js` ใต้ `BRANDS_BY_TYPE` ได้เลย

```js
// ----- หน่วยงานเจ้าของรถ (ผู้ตอบคำขอยืนยันรถเข้าร่วมแผน) -----
// ⚠️ ไม่ได้คิดชื่อขึ้นเอง — ยกจาก hierarchy-data.json (โครงสร้างหน้างาน 74 จังหวัด
// ที่ต้นแบบแจ้งซ่อมใช้อยู่) แล้วแก้สระ า/ำ ที่เพี้ยนจาก font subset ของ PDF ทีละชื่อ
// การจับคู่ "เขต N → ภาคจริง" เป็นการจำลอง (โมเดล 12 เขต/4 ภาคของต้นแบบเองก็จำลอง
// — ZONE_LABELS เหนือ/ตะวันออก/ใต้/ตะวันตก ไม่ตรงกับ น./ก./ฉ./ต. ของจริง)
// แต่ "ชื่อหน่วยงาน" เป็นของจริง — พอได้ dump mas_department ค่อย join ทับ
const OWNER_DEPTS_BY_REGION = {
  1:  ['กฟจ. พะเยา',      'กฟส. เชียงคำ',      'กฟส. จุน'],              // กฟน.1
  2:  ['กฟจ. กำแพงเพชร',  'กฟส. โกสัมพีนคร',   'กฟส. ปางศิลาทอง'],       // กฟน.2
  3:  ['กฟจ. ชัยนาท',     'กฟส. มโนรมย์',      'กฟส. เนินขาม'],          // กฟน.3
  4:  ['กฟจ. นครนายก',    'กฟส. บ้านนา',       'กฟส. ปากพลี'],           // กฟก.1
  5:  ['กฟจ. จันทบุรี',    'กฟส. สอยดาว',       'กฟส. ท่าใหม่'],          // กฟก.2
  6:  ['กฟจ. กาญจนบุรี',   'กฟส. ท่ามะกา',      'กฟส. ด่านมะขามเตี้ย'],    // กฟก.3
  7:  ['กฟจ. ชุมพร',      'กฟส. ท่าแซะ',       'กฟส. พะโต๊ะ'],           // กฟต.1
  8:  ['กฟจ. กระบี่',      'กฟส. เกาะลันตา',    'กฟส. เหนือคลอง'],        // กฟต.2
  9:  ['กฟจ. นราธิวาส',   'กฟส. สุไหงโก-ลก',   'กฟส. สุไหงปาดี'],        // กฟต.3
  10: ['กฟจ. ขอนแก่น',    'กฟส. บ้านไผ่',      'กฟส. น้ำพอง'],           // กฟฉ.1
  11: ['กฟจ. กาฬสินธุ์',   'กฟส. สมเด็จ',       'กฟส. หนองกุงศรี'],       // กฟฉ.2
  12: ['กฟจ. ชัยภูมิ',     'กฟส. แก้งคร้อ',     'กฟส. จัตุรัส'],          // กฟฉ.3
};
```

⚠️ **ห้าม replace `ำ`→`า` ทั้งชุดถ้าจะเพิ่มชื่ออื่นทีหลัง** — `เชียงคำ` · `กำแพงเพชร` · `น้ำพอง` มี `ำ` ที่ถูกต้องอยู่แล้ว ต้องดูทีละชื่อ

- [ ] **Step 4: เติม `ownerDept` ให้รถทุกคันใน `genSeedVehicles()`**

แก้ `mock-yearly.js:72-83` เพิ่มฟิลด์เข้า object ที่ push (deterministic เหมือนฟิลด์อื่น ไม่ใช้ random):

```js
        chassis: b.chassis,
        ownerDept: OWNER_DEPTS_BY_REGION[r][i % OWNER_DEPTS_BY_REGION[r].length],
        criteria: (r + i) % 2 === 0 ? 'truck' : 'net',
```

อัปเดตคอมเมนต์โครงข้อมูลบรรทัด 8 ให้มี `ownerDept`

- [ ] **Step 5: เพิ่ม `confirm` เข้า `INITIAL_PLAN` + ฟังก์ชัน logic**

`INITIAL_PLAN` (บรรทัด 116-117) เพิ่มก่อน `travelPlan`:

```js
  confirm: null,          // ตั้งค่าเมื่อ กบค. กด "ส่งคำขอยืนยัน" (ห้ามสร้างตั้งแต่เปิดหน้า)
```

เพิ่มใน object `MYD` ใต้ `planLines()`:

```js
  // ----- ยืนยันรถเข้าร่วมแผน (CF) -----
  // สถานะ/การเข้าทริป คำนวณจาก plan.confirm อย่างเดียว — pure ทั้งหมด
  // todayIso = 'YYYY-MM-DD' (ปี พ.ศ. ให้ตรงกับ <input type="date"> ที่ต้นแบบใช้)
  // เทียบวันด้วย string compare ได้เพราะรูปแบบ zero-padded เรียงตามลำดับเวลาอยู่แล้ว

  emptyConfirmEntry() {
    return { answer: 'pending', reason: '', meetPoint: '', by: '', at: '',
             history: [], verdict: null, verdictWhy: '', verdictAt: '' };
  },

  // สร้างโครงในหน่วยความจำเฉยๆ — ไม่เขียน storage (เขียนตอนกดส่งคำขอเท่านั้น)
  ensureConfirm(plan) {
    if (!plan.confirm) {
      plan.confirm = { requestedAt: null, dueAt: null, remindedAt: null, byVehicle: {} };
    }
    if (!plan.confirm.byVehicle) plan.confirm.byVehicle = {};
    return plan.confirm;
  },

  vehicleConfirm(plan, vehicleId) {
    const c = plan.confirm;
    return (c && c.byVehicle && c.byVehicle[vehicleId]) || this.emptyConfirmEntry();
  },

  confirmStatus(plan, vehicleId, todayIso) {
    const e = this.vehicleConfirm(plan, vehicleId);
    if (e.answer === 'ready' || e.answer === 'notready') return e.answer;
    const due = plan.confirm && plan.confirm.dueAt;
    // ยังไม่ส่งคำขอ (ไม่มี dueAt) → ยังไม่เริ่มนับ ไม่ใช่เลยกำหนด
    if (due && todayIso && todayIso > due) return 'overdue';
    return 'pending';
  },

  // verdict ของ กบค. ชนะคำตอบของหน่วยงานเสมอ
  isVehicleIn(plan, vehicleId) {
    const e = this.vehicleConfirm(plan, vehicleId);
    if (e.verdict === 'drop' || e.verdict === 'defer') return false;
    if (e.verdict === 'keep') return true;
    return e.answer === 'ready';
  },

  // มีข้อสรุปแล้ว = ตอบว่าพร้อม หรือ กบค. ตัดสินแล้ว
  confirmResolved(plan, vehicleIds) {
    return (vehicleIds || []).every(id => {
      const e = this.vehicleConfirm(plan, id);
      return e.answer === 'ready' || e.verdict !== null;
    });
  },

  confirmSummary(plan, vehicleIds, todayIso) {
    const out = { total: 0, ready: 0, waiting: 0, notready: 0, overdue: 0, joining: 0 };
    (vehicleIds || []).forEach(id => {
      out.total++;
      const st = this.confirmStatus(plan, id, todayIso);
      if (st === 'ready') out.ready++;
      else if (st === 'notready') out.notready++;
      else if (st === 'overdue') out.overdue++;
      else out.waiting++;
      if (this.isVehicleIn(plan, id)) out.joining++;
    });
    return out;
  },

  // ยืนยันแผนเดินทางแล้ว = ล็อกการแก้คำตอบ (เคาะกับเจ้าของงาน 10 ส.ค. 2569)
  confirmLocked(plan) {
    return plan.travelConfirmed === true;
  },
```

- [ ] **Step 6: เพิ่มที่เก็บค่าตั้งค่า**

บนสุดของไฟล์ ใต้ `PLANS_KEY`:

```js
const SETTINGS_KEY = 'maintaind.yearly.settings.v1';
const DEFAULT_SETTINGS = { confirmDueDays: 7 };   // ยังไม่ได้ค่าจริงจากเจ้าของงาน — แก้ได้จาก Admin
```

ใน `MYD` ใต้ `saveMaster()`:

```js
  loadSettings() {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (!parsed || typeof parsed.confirmDueDays !== 'number') throw new Error('invalid');
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(s) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...s }));
  },
```

- [ ] **Step 7: เพิ่ม `confirm` ให้ `SEED_PLAN` + สร้าง `SEED_PLAN_CF`**

⚠️ **เก็บของเก่าที่ไม่ตรงกันด้วย** — `SEED_PLAN` เดิมเขียน `planName: 'ภาคตะวันออก'` และ `travelPlan.location: 'จุดรวมงาน กฟฉ. เขต 3 (นครราชสีมา)'` ทั้งที่รถอยู่เขต 3-4 ซึ่ง `regionZone()` ตีเป็น north+east · พอใส่ `ownerDept` จริง (เขต 3 = กฟจ. ชัยนาท) ความไม่ตรงจะเห็นชัดขึ้น
⇒ แก้ `location` ของ `SEED_PLAN` ให้อ้างหน่วยงานที่ตรงกับ `OWNER_DEPTS_BY_REGION` ของเขตนั้น (เช่น `'จุดรวมงาน กฟจ. ชัยนาท → หน้างาน อ.มโนรมย์ / อ.เนินขาม'`) และปรับ `planName` ให้ไม่ขัดกับเขตที่เลือก

`SEED_PLAN` (12 คัน เขต 3-4) เพิ่มก่อน `travelPlan` — CF ครบและถูกล็อกแล้ว:

```js
  confirm: {
    requestedAt: '2568-10-06', dueAt: '2568-10-13', remindedAt: null,
    byVehicle: [3, 4].reduce((acc, r) => {
      [1, 2, 3, 4, 5, 6].forEach(i => {
        acc[`v-${r}-${i}`] = { answer: 'ready', reason: '', meetPoint: 'จุดรวมงาน กฟฉ. เขต 3',
                               by: 'หน่วยงานเจ้าของรถ', at: '2568-10-08 10:00',
                               history: [], verdict: null, verdictWhy: '', verdictAt: '' };
      });
      return acc;
    }, {}),
  },
```

`SEED_PLAN_CF` ใหม่ ใต้ `SEED_PLAN` — 12 คัน เขต 5-6 · ค้างที่ CF:

```js
// ---------- แผนตัวอย่างใบที่ 2: ค้างอยู่ที่ขั้น "ยืนยันรถเข้าร่วมแผน" ----------
// เบิกอะไหล่แล้ว · ส่งคำขอยืนยันแล้ว · ตอบกลับมาบางส่วน · ยังไม่ทำแผนเดินทาง
// ⇒ ใช้เดโม/พัฒนา CF ได้ทันที (SEED_PLAN ใบเดิม travelConfirmed:true จึงถูกล็อก)
// ค่าคงที่ทั้งหมดเพื่อให้ลิงก์ #plan-seed-2569-002 ใช้ได้ตลอด
// dueAt เป็นวันในอดีต ⇒ 2 คันที่ยังไม่ตอบจะขึ้น "เลยกำหนด" — ตั้งใจ เพื่อให้เห็นทั้ง
// เส้น "ไม่พร้อม" และเส้น "เลยกำหนด" ซึ่งเป็น 2 ทางที่ต้องให้ กบค. ตัดสิน
const CF_VEHICLE_IDS = [5, 6].flatMap(r => [1, 2, 3, 4, 5, 6].map(i => `v-${r}-${i}`));

const SEED_PLAN_CF = {
  id: 'plan-seed-2569-002',
  createdAt: '2 ต.ค. 2568 09:30',
  phase: 'procurement',
  planName: 'บำรุงรักษาเครน/กระเช้า ภาคตะวันออก รอบ 2',
  selectedVehicleIds: CF_VEHICLE_IDS,
  itemAdj: {},
  quarter: 'Q1',
  year: 2569,
  workNumber: 'MT-2569-Q1-002',
  approvalStatus: 'issued',
  suppliesAckAt: '4 ต.ค. 2568 11:10',
  statusHistory: [
    { status: 'issued',       at: '2 ต.ค. 2568 10:15', note: 'กบค. ออกเลขงาน MT-2569-Q1-002' },
    { status: 'notified',     at: '2 ต.ค. 2568 10:15', note: 'ส่งเอกสารแจ้งฝ่ายพัสดุ' },
    { status: 'acknowledged', at: '4 ต.ค. 2568 11:10', note: 'ฝ่ายพัสดุรับทราบ' },
  ],
  partsRequisitioned: true,
  confirm: {
    requestedAt: '2568-10-05', dueAt: '2568-10-12', remindedAt: null,
    byVehicle: CF_VEHICLE_IDS.reduce((acc, id, idx) => {
      const base = { reason: '', meetPoint: '', by: '', at: '',
                     history: [], verdict: null, verdictWhy: '', verdictAt: '' };
      if (idx < 8) {
        acc[id] = { ...base, answer: 'ready', meetPoint: 'จุดรวมงาน กฟฉ. เขต 5',
                    by: 'หน่วยงานเจ้าของรถ', at: '2568-10-07 09:40' };
      } else if (idx < 10) {
        acc[id] = { ...base, answer: 'notready',
                    reason: idx === 8 ? 'ติดงานก่อสร้างสายส่งถึงสิ้นเดือน' : 'รถเข้าซ่อมเกียร์อยู่ที่อู่',
                    by: 'หน่วยงานเจ้าของรถ', at: '2568-10-07 14:05' };
      } else {
        acc[id] = { ...base, answer: 'pending' };   // ยังไม่ตอบ → เลยกำหนดแล้ว
      }
      return acc;
    }, {}),
  },
  travelPlan: null,
  travelConfirmed: false,
};
```

- [ ] **Step 8: ต่อสายแผนใบที่ 2 + บั๊ม schema**

- `SCHEMA_VERSION` 6 → **7** พร้อมแก้คอมเมนต์: `// 7 = + ownerDept ที่รถ, plan.confirm (ยืนยันรถเข้าร่วมแผน)`
- `loadPlans()` บรรทัด 212 · `reseedPlans()` บรรทัด 264 — `fresh` เป็น `[deepCopy(SEED_PLAN), deepCopy(SEED_PLAN_CF)]`
- export `SEED_PLAN_CF` และ `OWNER_DEPTS_BY_REGION` ใน object `MYD`

- [ ] **Step 9: รันเทสให้ผ่าน**

```bash
cd Maintenance-Request/Maintenance-Request-Form/maintainance-yearly
node test/confirm.test.mjs && node test/logic.test.mjs && node test/skeleton-data.test.js
```
Expected: PASS ทั้ง 3 ไฟล์ (`logic.test.mjs` ต้องไม่พังจากการเพิ่มฟิลด์)

- [ ] **Step 10: Commit**

```bash
git add maintainance-yearly/mock-yearly.js maintainance-yearly/test/confirm.test.mjs
git commit -m "feat(บำรุงรักษา): โครงข้อมูล + logic ขั้นยืนยันรถเข้าร่วมแผน (CF)"
```

---

# Task 2: หน้า กบค. — ขั้นยืนยันรถ (ขั้นที่ 2 ของเฟส 1)

**Files:**
- Modify: `maintainance-yearly/app.js:208-212` (`PROC_STEPS`), `:232-251` (nav + validate), `:294-304` (router), เพิ่ม render/bind ใหม่
- Test: เบราว์เซอร์ (headless Chromium ตาม `.claude/skills/verify`)

**Interfaces:**
- Consumes: ทุกฟังก์ชันจาก Task 1 · `esc/toast/dateTh` จาก `common.js`
- Produces: `renderProcStepConfirm(plan)` · `bindProcStepConfirm(plan)` · ขั้นเดิมเลื่อนเลข (แผนเดินทาง 2→3 · ทวน 3→4)

- [ ] **Step 1: ขยาย `PROC_STEPS` เป็น 4 ขั้น**

```js
const PROC_STEPS = [
  { no: 1, label: 'เบิกอะไหล่' },
  { no: 2, label: 'ยืนยันรถเข้าร่วมแผน' },
  { no: 3, label: 'แผนเดินทาง' },
  { no: 4, label: 'ทวน + ยืนยัน' },
];
```

- [ ] **Step 2: ไล่แก้ทุกจุดที่ hardcode เลขขั้น**

⚠️ เลขขั้นกระจายอยู่หลายที่ แก้แค่ array ไม่พอ:

| ที่ | เดิม | ใหม่ |
|---|---|---|
| `nextProcSub()` | `if (state.sub >= 3) return;` | `if (state.sub >= PROC_STEPS.length) return;` |
| `renderProcWizard()` ป้ายปุ่ม | `state.sub === 3 ? 'ยืนยันแผนเดินทาง'` | `state.sub === PROC_STEPS.length ? 'ยืนยันแผนเดินทาง'` |
| `renderProcSubBody()` | `sub===1 / sub===2 / else` | `1→Step1 · 2→Confirm · 3→Step2(แผนเดินทาง) · else Step3(ทวน)` |
| `bindProcSubBody()` | `1→bindStep1 · 2→bindStep2` | `1→bindStep1 · 2→bindConfirm · 3→bindStep2` |

```js
function validateProcSub(plan, sub) {
  if (sub === 1) return !!plan.partsRequisitioned;
  if (sub === 2) return MYD.confirmResolved(plan, plan.selectedVehicleIds || []);
  if (sub === 3) {
    const tp = plan.travelPlan;
    return !!(tp && tp.location && tp.location.trim() && tp.dateFrom && tp.dateTo);
  }
  return true;
}
```

- [ ] **Step 3: เขียน `renderProcStepConfirm()`**

ใช้คลาสที่มีอยู่แล้วเท่านั้น (`card` `sect` `sub` `tblwrap` `tbl` `itbl` `badge` `b-ok`/`b-low`/`b-brand` `btn` `btn-o`/`btn-s`/`btn-g` `btn-sm` `empty` `num`) — ห้ามเขียน CSS คอมโพเนนต์ในหน้า

```js
// ----- ขั้น 2: ยืนยันรถเข้าร่วมแผน -----
// วันนี้แบบ ISO ปี พ.ศ. ให้ตรงรูปแบบที่ dueAt ใช้ (Date อยู่ฝั่ง browser เท่านั้น)
function todayIso() {
  const d = new Date();
  const y = d.getFullYear() + 543;
  return `${y}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const CF_STATUS_BADGE = {
  ready:    { cls: 'b-ok',    text: 'พร้อม' },
  notready: { cls: 'b-brand', text: 'ไม่พร้อม' },
  pending:  { cls: 'b-low',   text: 'รอตอบ' },
  overdue:  { cls: 'b-low',   text: 'เลยกำหนด' },
};
const CF_VERDICT_LABELS = { keep: 'เข้าตามเดิม', drop: 'ตัดออกจากแผน', defer: 'เลื่อนรอบหน้า' };

function renderProcStepConfirm(plan) {
  const master = MYD.loadMaster();
  const ids = plan.selectedVehicleIds || [];
  const vehicles = master.vehicles.filter(v => ids.includes(v.id));
  const days = MYD.loadSettings().confirmDueDays;

  if (!plan.confirm || !plan.confirm.requestedAt) {
    const depts = new Set(vehicles.map(v => v.ownerDept));
    return `
      <div class="sect">ขั้นที่ 2: ยืนยันรถเข้าร่วมแผน</div>
      <div class="sub">ส่งรายการรถให้หน่วยงานเจ้าของรถยืนยันว่าเข้าบำรุงรักษาได้จริง
        — ต้องรู้จำนวนรถที่แน่นอนก่อนวางแผนเดินทาง</div>
      <div class="card">
        <div>จะส่งคำขอไป <b>${depts.size}</b> หน่วยงาน รวม <b>${vehicles.length}</b> คัน</div>
        <div class="sub">กำหนดตอบภายใน ${days} วัน (แก้ได้ที่หน้า Admin)</div>
        <button class="btn btn-o" id="btnSendConfirm">
          <span class="ms">send</span> ส่งคำขอยืนยัน</button>
      </div>`;
  }

  const today = todayIso();
  const s = MYD.confirmSummary(plan, ids, today);
  const rows = vehicles.map(v => {
    const e = MYD.vehicleConfirm(plan, v.id);
    const st = MYD.confirmStatus(plan, v.id, today);
    const b = CF_STATUS_BADGE[st];
    const needsVerdict = (st === 'notready' || st === 'overdue') && e.verdict === null;
    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="sub">${esc(v.brand)}</div></td>
      <td>${esc(v.ownerDept)}<div class="sub">เขต ${esc(v.region)}</div></td>
      <td><span class="badge ${b.cls}">${b.text}</span>
        ${e.reason ? `<div class="sub">${esc(e.reason)}</div>` : ''}</td>
      <td>${esc(e.meetPoint || '—')}</td>
      <td>${esc(e.at || '—')}</td>
      <td>${e.verdict
            ? `<span class="badge b-brand">${CF_VERDICT_LABELS[e.verdict]}</span>
               ${e.verdictWhy ? `<div class="sub">${esc(e.verdictWhy)}</div>` : ''}`
            : needsVerdict
              ? `<button class="btn btn-s btn-sm" data-verdict-for="${esc(v.id)}">ตัดสิน</button>`
              : '—'}</td>
      <td>${MYD.isVehicleIn(plan, v.id)
            ? `<span class="badge b-ok">เข้าทริป</span>`
            : `<span class="badge b-low">ไม่เข้า</span>`}</td>
    </tr>`;
  }).join('');

  const left = ids.filter(id => {
    const e = MYD.vehicleConfirm(plan, id);
    return !(e.answer === 'ready' || e.verdict !== null);
  }).length;

  return `
    <div class="sect">ขั้นที่ 2: ยืนยันรถเข้าร่วมแผน</div>
    <div class="sub">ส่งคำขอเมื่อ ${dateTh(plan.confirm.requestedAt)}
      · ครบกำหนดตอบ ${dateTh(plan.confirm.dueAt)}
      ${plan.confirm.remindedAt ? `· เตือนซ้ำล่าสุด ${esc(plan.confirm.remindedAt)}` : ''}</div>
    <div class="card">
      <div class="sect">สรุปการยืนยัน</div>
      <div>
        <span class="badge b-ok">ยืนยันแล้ว ${s.ready}</span>
        <span class="badge b-low">รอตอบ ${s.waiting}</span>
        <span class="badge b-brand">ไม่พร้อม ${s.notready}</span>
        <span class="badge b-low">เลยกำหนด ${s.overdue}</span>
      </div>
      <div class="sub" style="margin-top:8px">
        เข้าทริปนี้ <b>${s.joining}</b> คัน จากรถในแผน ${s.total} คัน
        — ตัวเลขนี้คือจำนวนที่แผนเดินทางจะใช้</div>
      <button class="btn btn-g btn-sm" id="btnRemind">
        <span class="ms">notifications</span> ส่งเตือนซ้ำ</button>
    </div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th><th>คำตอบ</th>
        <th>จุดนัดรับ</th><th>ตอบเมื่อ</th><th>คำตัดสิน กบค.</th><th>ผล</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
    ${left ? `<div class="empty">เหลืออีก ${left} คันที่ยังไม่มีข้อสรุป — ทำแผนเดินทางต่อไม่ได้จนกว่าจะครบ</div>` : ''}`;
}
```

- [ ] **Step 4: เขียน `bindProcStepConfirm()`**

```js
function bindProcStepConfirm(plan) {
  const send = $('btnSendConfirm');
  if (send) {
    send.addEventListener('click', () => {
      // เขียน storage ตอนกดเท่านั้น — ห้ามสร้างตั้งแต่ render (บทเรียน plan-new.html)
      const c = MYD.ensureConfirm(plan);
      const days = MYD.loadSettings().confirmDueDays;
      const d = new Date(); d.setDate(d.getDate() + days);
      c.requestedAt = todayIso();
      c.dueAt = `${d.getFullYear() + 543}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      (plan.selectedVehicleIds || []).forEach(id => {
        if (!c.byVehicle[id]) c.byVehicle[id] = MYD.emptyConfirmEntry();
      });
      MYD.savePlan(plan);
      toast('ส่งคำขอยืนยันแล้ว');
      renderProcWizard(plan);
    });
  }

  const remind = $('btnRemind');
  if (remind) {
    remind.addEventListener('click', () => {
      MYD.ensureConfirm(plan).remindedAt = nowTh();
      MYD.savePlan(plan);
      toast('ส่งเตือนซ้ำแล้ว (ต้นแบบยังไม่มีระบบแจ้งเตือนจริง)');
      renderProcWizard(plan);
    });
  }

  document.querySelectorAll('[data-verdict-for]').forEach(btn => {
    btn.addEventListener('click', () => openVerdictModal(plan, btn.dataset.verdictFor));
  });
}
```

**`openVerdictRow()` — ใช้แถวขยายในตาราง ไม่ใช่ modal**

ตรวจแล้ว `components.css` **ไม่มีคลาส modal/dialog** ⇒ ห้ามเขียนเอง · ใช้คลาสที่มีจริง: `.rads` (กลุ่ม radio) · `.f` (ช่องกรอก) · `.btn` — ไม่ต้องเพิ่ม CSS ใหม่เลย

```js
function openVerdictRow(plan, vehicleId) {
  const tr = document.querySelector(`[data-verdict-for="${vehicleId}"]`).closest('tr');
  if (tr.nextElementSibling && tr.nextElementSibling.dataset.verdictRow) {
    tr.nextElementSibling.remove(); return;          // กดซ้ำ = ปิด
  }
  const row = document.createElement('tr');
  row.dataset.verdictRow = vehicleId;
  row.innerHTML = `<td colspan="7">
    <div class="rads">
      <label><input type="radio" name="vd" value="keep"> เข้าตามเดิม</label>
      <label><input type="radio" name="vd" value="drop"> ตัดออกจากแผน</label>
      <label><input type="radio" name="vd" value="defer"> เลื่อนรอบหน้า</label>
    </div>
    <div class="f"><label>เหตุผลการตัดสิน</label>
      <input type="text" id="vdWhy" placeholder="บันทึกไว้ให้ตรวจสอบย้อนหลังได้"></div>
    <button class="btn btn-o btn-sm" id="vdSave">บันทึกคำตัดสิน</button></td>`;
  tr.after(row);

  $('vdSave').addEventListener('click', () => {
    const picked = row.querySelector('input[name="vd"]:checked');
    if (!picked) { toast('เลือกคำตัดสินก่อน'); return; }
    const c = MYD.ensureConfirm(plan);
    const e = c.byVehicle[vehicleId] || (c.byVehicle[vehicleId] = MYD.emptyConfirmEntry());
    e.verdict = picked.value;
    e.verdictWhy = ($('vdWhy').value || '').trim();
    e.verdictAt = nowTh();
    MYD.savePlan(plan);
    toast('บันทึกคำตัดสินแล้ว');
    renderProcWizard(plan);
  });
}
```

ใน `bindProcStepConfirm()` เรียก `openVerdictRow(plan, btn.dataset.verdictFor)`

- [ ] **Step 5: ตรวจในเบราว์เซอร์**

```bash
cd Maintenance-Request/Maintenance-Request-Form
python3 -m http.server 8123 --bind 127.0.0.1
```
เปิด `http://127.0.0.1:8123/maintainance-yearly/index.html#plan-seed-2569-002` → ต้องเห็น stepper 4 ขั้น · ขั้น 2 แสดงสรุป 8/0/2/2 · เข้าทริป 8 คัน · ปุ่ม "ถัดไป" **ปิดอยู่** · ตัดสินครบ 4 คันแล้วปุ่มเปิด · **ไม่มี `pageerror`**

- [ ] **Step 6: Commit**

```bash
git add maintainance-yearly/app.js
git commit -m "feat(บำรุงรักษา): หน้า กบค. ขั้นยืนยันรถเข้าร่วมแผน + stepper เฟส 1 เป็น 4 ขั้น"
```

---

# Task 3: หน้าหน่วยงานเจ้าของรถ — `confirm.html` + `confirm.js`

**Files:**
- Create: `maintainance-yearly/confirm.html`, `maintainance-yearly/confirm.js`
- Modify: เมนูซ้ายของ `index.html` `plan-new.html` `supplies.html` `admin.html` `plan-skeleton.html` · `../more.html`

**Interfaces:**
- Consumes: Task 1 ทั้งหมด · `common.js`
- Produces: routing `confirm.html` (รายการ) · `confirm.html#<planId>/<deptIndex>` (รายใบ)

- [ ] **Step 1: 🐛 แก้ `{L}` ที่หลุดอยู่ในเมนูซ้าย**

`index.html:53` · `plan-new.html:49` · `supplies.html:36` มีสตริง `{L}` โผล่เป็นข้อความจริงในแถบเมนู (เศษจากการแก้เมนูรอบ 9 ส.ค.) — **ลบทิ้งทั้ง 3 ไฟล์**

```bash
grep -n '{L}' maintainance-yearly/*.html   # ต้องได้ผลว่างหลังแก้
```

- [ ] **Step 2: เพิ่มเมนู `confirm.html` ทุกหน้า (5 → 6 รายการ)**

วางถัดจาก `supplies.html` ในทั้ง 5 ไฟล์ — ไอคอน Material Symbols `fact_check`

```html
    <a class="nv" href="confirm.html" title="หน่วยงานเจ้าของรถ — ยืนยันรถเข้าร่วมแผน"><span class="ms">fact_check</span></a>
```

หน้าที่กำลังเปิดอยู่ใช้ `class="nv on"` ตามแพตเทิร์นเดิม

- [ ] **Step 3: สร้าง `confirm.html`**

คัดลอกโครงจาก `supplies.html` (โครงเดียวกันทั้งหมด: `shell` → `side` → `work` → `topbar` → `content`) เปลี่ยน:
- `<title>` → `ยืนยันรถเข้าร่วมแผน — Maintain-D (Mock)`
- `.draft` → `โหมดหน่วยงานเจ้าของรถ — ต้นแบบไม่มีระบบ login จึงเห็นทุกหน่วยงาน ของจริงจะเห็นเฉพาะหน่วยงานตัวเอง`
- id ของ container → `cfBody` · หัวข้อ → `cfTitle`
- `<script src="supplies.js">` → `<script src="confirm.js">`
- `?v=` ของ `tokens.css`/`components.css` ใช้ค่าเดียวกับหน้าอื่น ณ ตอนนั้น
- **ไม่ต้องมี `<style>` ประจำหน้า** (ตารางนี้ไม่ได้ fixed layout แบบหน้าพัสดุ)

- [ ] **Step 4: เขียน `confirm.js` — รายการคำขอ**

```js
// confirm.js — หน้าหน่วยงานเจ้าของรถ: ตอบคำขอยืนยันรถเข้าร่วมแผน
//
// routing: confirm.html                     -> รายการคำขอ (ทุกหน่วยงาน × ทุกแผนที่ส่งคำขอแล้ว)
//          confirm.html#<planId>/<deptIdx>  -> เปิดคำขอของหน่วยงานนั้น
// ต้นแบบไม่มี login — ของจริงจะกรองด้วยหน่วยงานของผู้ใช้
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้

// คำขอ = คู่ (แผน, หน่วยงาน) — 1 หน่วยงานอาจมีรถหลายคันในแผนเดียว
function buildRequests() {
  const master = MYD.loadMaster();
  const out = [];
  MYD.loadPlans().forEach(plan => {
    if (!plan.confirm || !plan.confirm.requestedAt) return;
    const vehicles = master.vehicles.filter(v => (plan.selectedVehicleIds || []).includes(v.id));
    const byDept = {};
    vehicles.forEach(v => { (byDept[v.ownerDept] = byDept[v.ownerDept] || []).push(v); });
    Object.keys(byDept).sort((a, b) => a.localeCompare(b, 'th')).forEach((dept, i) => {
      out.push({ plan, dept, deptIdx: i, vehicles: byDept[dept] });
    });
  });
  return out;
}

function render() {
  const hash = (location.hash || '').replace('#', '');
  if (!hash) { renderList(); return; }
  const [planId, idx] = hash.split('/');
  const req = buildRequests().find(r => r.plan.id === planId && String(r.deptIdx) === idx);
  if (!req) { location.hash = ''; renderList(); return; }
  renderRequest(req);
}

function renderList() {
  const reqs = buildRequests();
  const rows = reqs.map(r => {
    const answered = r.vehicles.filter(v => MYD.vehicleConfirm(r.plan, v.id).answer !== 'pending').length;
    const locked = MYD.confirmLocked(r.plan);
    return `<tr>
      <td><b style="color:var(--gray-900)">${esc(r.dept)}</b>
        <div class="sub">${esc(r.plan.workNumber)} · ${esc(r.plan.planName || '—')}</div></td>
      <td class="num">${r.vehicles.length}</td>
      <td class="num">${answered}</td>
      <td>${dateTh(r.plan.confirm.dueAt)}</td>
      <td>${locked ? `<span class="badge b-brand">ปิดรับคำตอบ</span>`
            : answered === r.vehicles.length ? `<span class="badge b-ok">ตอบครบแล้ว</span>`
            : `<span class="badge b-low">รอตอบ ${r.vehicles.length - answered}</span>`}</td>
      <td class="num"><a class="btn btn-s btn-sm" href="#${esc(r.plan.id)}/${r.deptIdx}">เปิดคำขอ</a></td>
    </tr>`;
  }).join('');

  $('crumbs').innerHTML = `<span class="ms">fact_check</span><span class="cur">รายการคำขอ</span>`;
  $('cfBody').innerHTML = `
    <div class="card">
      <div class="sect">คำขอยืนยันรถเข้าร่วมแผน จาก กบค.</div>
      <div class="sub">แต่ละแถวคือคำขอของหน่วยงานหนึ่งในแผนหนึ่ง — ตอบว่ารถแต่ละคันเข้าบำรุงรักษาได้ไหม</div>
      ${reqs.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>หน่วยงาน / แผน</th><th class="num">รถ (คัน)</th><th class="num">ตอบแล้ว</th>
          <th>กำหนดตอบ</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">ยังไม่มีคำขอ — รอ กบค. กด "ส่งคำขอยืนยัน" ในเฟส 1 ของแผน</div>`}
    </div>`;
}
```

- [ ] **Step 5: เขียนหน้าตอบรายใบ**

```js
function renderRequest(req) {
  const { plan, dept, vehicles } = req;
  const locked = MYD.confirmLocked(plan);
  const today = todayIsoCf();

  const rows = vehicles.map(v => {
    const e = MYD.vehicleConfirm(plan, v.id);
    const dis = locked ? 'disabled' : '';
    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="sub">${esc(v.brand)}</div></td>
      <td>${esc(MYD.STATUS_LABELS[v.status] || v.status)}</td>
      <td>
        <label><input type="radio" name="ans-${esc(v.id)}" value="ready"
          ${e.answer === 'ready' ? 'checked' : ''} ${dis}> พร้อม</label>
        <label><input type="radio" name="ans-${esc(v.id)}" value="notready"
          ${e.answer === 'notready' ? 'checked' : ''} ${dis}> ไม่พร้อม</label>
      </td>
      <td><input type="text" id="rsn-${esc(v.id)}" value="${esc(e.reason)}"
        placeholder="ระบุเมื่อไม่พร้อม" ${dis}></td>
      <td><input type="text" id="mp-${esc(v.id)}" value="${esc(e.meetPoint)}"
        placeholder="จุดนัดรับที่สะดวก" ${dis}></td>
      <td>${e.at ? esc(e.at) : '—'}
        ${e.history.length ? `<div class="sub">แก้ ${e.history.length} ครั้ง</div>` : ''}</td>
    </tr>`;
  }).join('');

  $('crumbs').innerHTML = `<a href="confirm.html" style="color:inherit;text-decoration:none">
      <span class="ms">fact_check</span> รายการคำขอ</a>
    <span class="sep">›</span><span class="cur">${esc(dept)}</span>`;
  $('cfBody').innerHTML = `
    <div class="card">
      <div class="sect">${esc(plan.workNumber)} — ${esc(plan.planName || '—')}</div>
      <div class="sub">หน่วยงานผู้ขอ: กบค. · ส่งคำขอ ${dateTh(plan.confirm.requestedAt)}
        · กำหนดตอบ ${dateTh(plan.confirm.dueAt)}
        ${today > plan.confirm.dueAt && !locked ? ' · <b>เลยกำหนดแล้ว</b>' : ''}</div>
    </div>
    ${locked ? `<div class="empty">แผนเดินทางถูกยืนยันแล้ว — ปิดรับการแก้คำตอบ
        หากมีการเปลี่ยนแปลงกรุณาติดต่อ กบค. โดยตรง</div>` : ''}
    <div class="card">
      <div class="sect">รถของ ${esc(dept)} ในแผนนี้</div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th>ทะเบียน</th><th>สถานะรถ</th><th>คำตอบ</th>
          <th>เหตุผลถ้าไม่พร้อม</th><th>จุดนัดรับ</th><th>ตอบเมื่อ</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      ${locked ? '' : `
        <div class="sect">ผู้ตอบ</div>
        <div class="sub">ยังไม่ได้เคาะว่าใครในหน่วยงานเป็นผู้มีสิทธิ์กด — ต้นแบบให้พิมพ์ชื่อไปก่อน</div>
        <input type="text" id="cfBy" placeholder="ชื่อผู้ตอบ">
        <button class="btn btn-o" id="btnAnswer"><span class="ms">send</span> ส่งคำตอบ</button>`}`;

  if (!locked) bindRequest(req);
}
```

- [ ] **Step 6: บันทึกคำตอบ + ประวัติการแก้**

```js
function bindRequest(req) {
  const { plan, vehicles } = req;
  $('btnAnswer').addEventListener('click', () => {
    const by = ($('cfBy').value || '').trim();
    if (!by) { toast('กรุณากรอกชื่อผู้ตอบ'); return; }

    const c = MYD.ensureConfirm(plan);
    let changed = 0, missing = 0;
    vehicles.forEach(v => {
      const picked = document.querySelector(`input[name="ans-${v.id}"]:checked`);
      if (!picked) { missing++; return; }
      const e = c.byVehicle[v.id] || (c.byVehicle[v.id] = MYD.emptyConfirmEntry());
      const reason = ($(`rsn-${v.id}`).value || '').trim();
      if (picked.value === 'notready' && !reason) { missing++; return; }
      if (e.answer !== picked.value || e.reason !== reason) {
        // เก็บประวัติเฉพาะการ "เปลี่ยนคำตอบที่เคยตอบไปแล้ว"
        if (e.answer !== 'pending') {
          e.history.push({ at: nowTh(), by, from: e.answer, to: picked.value, reason: e.reason });
        }
        changed++;
      }
      e.answer = picked.value;
      e.reason = picked.value === 'notready' ? reason : '';
      e.meetPoint = ($(`mp-${v.id}`).value || '').trim();
      e.by = by;
      e.at = nowTh();
    });

    if (missing) { toast(`ยังตอบไม่ครบ ${missing} คัน (ไม่พร้อมต้องระบุเหตุผล)`); return; }
    MYD.savePlan(plan);
    toast(changed ? 'ส่งคำตอบแล้ว' : 'ไม่มีการเปลี่ยนแปลง');
    render();
  });
}

// วันนี้แบบ ISO ปี พ.ศ. (ซ้ำกับ app.js เพราะคนละหน้า ไม่ได้โหลด app.js)
function todayIsoCf() {
  const d = new Date();
  return `${d.getFullYear() + 543}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

window.addEventListener('hashchange', render);
render();
```

- [ ] **Step 7: ตรวจ end-to-end ในเบราว์เซอร์**

เปิด `confirm.html` → เห็นรายการคำขอของแผน `MT-2569-Q1-002` → เปิดคำขอหน่วยงานหนึ่ง → เปลี่ยนคำตอบคันหนึ่งจากพร้อมเป็นไม่พร้อม + เหตุผล → ส่ง → กลับไป `index.html#plan-seed-2569-002` ขั้น 2 **ตัวเลขสรุปต้องเปลี่ยนตาม** · เปิดคำขอของแผน `MT-2569-Q1-001` (travelConfirmed) ต้อง **ล็อก ตอบไม่ได้**

```bash
grep -rniE '#[0-9a-f]{3,8}\b' --include='*.html' maintainance-yearly/ | grep -viE '#fff|#000|design-system/|theme-color|/test/'
grep -rnP '[\x{1F300}-\x{1FAFF}]' --include='*.html' --include='*.js' maintainance-yearly/ | grep -v '/test/'
```
ทั้งสองคำสั่งต้องได้ผลว่าง

- [ ] **Step 8: Commit**

```bash
git add maintainance-yearly/confirm.html maintainance-yearly/confirm.js maintainance-yearly/*.html ../more.html
git commit -m "feat(บำรุงรักษา): หน้าหน่วยงานเจ้าของรถ ตอบคำขอยืนยันรถ + แก้ {L} ที่หลุดในเมนู"
```

---

# Task 4: ผูกจำนวนคันที่ยืนยันแล้วเข้าแผนเดินทาง + หน้าทวน

**Files:**
- Modify: `maintainance-yearly/app.js` — `renderProcStep2()` (แผนเดินทาง) · `renderProcStep3()` (ทวน) · `renderProcurementConfirmed()`

**Interfaces:**
- Consumes: `MYD.isVehicleIn`, `MYD.confirmSummary` จาก Task 1

- [ ] **Step 1: แผนเดินทางบอกจำนวนคันที่เข้าทริป**

บนสุดของ `renderProcStep2()` เพิ่มก่อน `<div class="fgrid">`:

```js
  const master = MYD.loadMaster();
  const joining = (plan.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(plan, id));
  const plates = master.vehicles.filter(v => joining.includes(v.id)).map(v => v.plate);
  const dropped = (plan.selectedVehicleIds || []).length - joining.length;
```

แล้วแทรกใต้ `<div class="sect">ขั้นที่ 3: ทำแผนเดินทาง</div>`:

```js
    <div class="sub">คิดจากรถที่ยืนยันแล้ว <b>${joining.length}</b> คัน
      ${dropped ? `(ตัด/เลื่อน ${dropped} คันจากขั้นยืนยันรถ)` : ''}
      — เบี้ยเลี้ยง/ที่พัก/ค่าเดินทางให้กรอกตามจำนวนนี้</div>
    <div class="sub">${esc(plates.join(' · '))}</div>
```

- [ ] **Step 2: หน้าทวนแสดงคันที่ถูกตัด/เลื่อนพร้อมเหตุผล**

ใน `renderProcStep3()` เพิ่มบล็อกก่อนสรุปค่าใช้จ่าย:

```js
  const master3 = MYD.loadMaster();
  const outRows = (plan.selectedVehicleIds || [])
    .filter(id => !MYD.isVehicleIn(plan, id))
    .map(id => {
      const v = master3.vehicles.find(x => x.id === id);
      const e = MYD.vehicleConfirm(plan, id);
      return `<tr><td>${esc(v ? v.plate : id)}</td>
        <td>${esc(CF_VERDICT_LABELS[e.verdict] || 'ไม่พร้อม')}</td>
        <td>${esc(e.verdictWhy || e.reason || '—')}</td></tr>`;
    }).join('');
```

แสดงเป็นตาราง "รถที่ไม่เข้าทริปนี้" เฉพาะเมื่อ `outRows` ไม่ว่าง (ใช้คลาส `tblwrap`/`tbl` เดิม)

- [ ] **Step 3: ตรวจในเบราว์เซอร์**

ที่แผน `MT-2569-Q1-002` ตัดสินให้ครบ → ไปขั้น 3 ต้องเห็น "คิดจากรถที่ยืนยันแล้ว N คัน" ตรงกับสรุปขั้น 2 → ขั้น 4 เห็นตารางรถที่ไม่เข้าทริปพร้อมเหตุผล → กดยืนยันแผนเดินทาง → กลับไป `confirm.html` ต้องล็อก

- [ ] **Step 4: Commit**

```bash
git add maintainance-yearly/app.js
git commit -m "feat(บำรุงรักษา): แผนเดินทางใช้จำนวนรถที่ยืนยันแล้ว + หน้าทวนแสดงคันที่ตัด/เลื่อน"
```

---

# Task 5: Admin — คอลัมน์หน่วยงานเจ้าของรถ + ตั้งกำหนดวันตอบ

**Files:**
- Modify: `maintainance-yearly/admin.js`, `maintainance-yearly/admin.html`

- [ ] **Step 1: เพิ่มคอลัมน์ `ownerDept` ในตารางรถ**

จุดที่ต้องแก้ใน `admin.js` (ฟังก์ชัน `renderVehicles()` บรรทัด 49):

| บรรทัด | แก้อะไร |
|---|---|
| `:59` | หลัง `<td>` ของเขต เพิ่ม `<td>${esc(v.ownerDept || '—')}</td>` |
| `:86` | หัวตาราง เพิ่ม `<th>หน่วยงานเจ้าของรถ</th>` ถัดจาก `<th>เขต</th>` |
| `:117` | object ตั้งต้นของรถใหม่ เพิ่ม `ownerDept: ''` |
| `:129` | หลังช่อง "เขต" เพิ่มช่องกรอกในฟอร์ม (ดูโค้ดล่าง) |
| `:152` | ตอนบันทึก เพิ่ม `ownerDept: (fd.get('ownerDept') || '').trim(),` |

ช่องในฟอร์ม — ใช้ `<datalist>` ให้เลือกจากชื่อจริงของเขตนั้นได้ แต่พิมพ์เองก็ได้ (ของจริงจะ join กับ `mas_department`)

```js
`<div class="f sp2"><label>หน่วยงานเจ้าของรถ</label>
  <div class="in"><span class="ms">apartment</span>
    <input type="text" name="ownerDept" list="deptOpts" value="${esc(v.ownerDept || '')}"
      placeholder="เช่น กฟจ. ขอนแก่น"></div>
  <datalist id="deptOpts">${(MYD.OWNER_DEPTS_BY_REGION[Number(v.region) || 1] || [])
      .map(d => `<option value="${esc(d)}">`).join('')}</datalist></div>`
```

- [ ] **Step 2: เพิ่มการ์ดตั้งค่า**

ในหน้า Admin เพิ่มการ์ด **"ค่าตั้งค่าโฟลว์"**:

```js
  const st = MYD.loadSettings();
  // ... ใน HTML ของการ์ด
  `<div class="sect">ค่าตั้งค่าโฟลว์</div>
   <div class="sub">กำหนดให้หน่วยงานเจ้าของรถตอบคำขอยืนยันรถภายในกี่วัน
     — ยังไม่ได้ค่าจริงจากเจ้าของงาน ตั้ง 7 วันไว้ก่อน</div>
   <input type="number" id="cfDays" min="1" max="60" value="${st.confirmDueDays}">
   <button class="btn btn-o" id="btnSaveSettings">บันทึก</button>`
```

bind: อ่านค่า → `MYD.saveSettings({ confirmDueDays: Number(v) })` → toast

⚠️ เปลี่ยนค่านี้**ไม่ย้อนแก้ `dueAt` ของคำขอที่ส่งไปแล้ว** (คำนวณตอนกดส่ง) — ใส่ข้อความกำกับไว้ในการ์ด

- [ ] **Step 3: ตรวจ + Commit**

เปิด `admin.html` → เห็นคอลัมน์ใหม่ + แก้ค่าวันแล้วรีโหลดค่าอยู่ → สร้างแผนใหม่แล้วส่งคำขอ `dueAt` ต้องใช้ค่าที่ตั้ง

```bash
git add maintainance-yearly/admin.js maintainance-yearly/admin.html
git commit -m "feat(บำรุงรักษา): Admin จัดการหน่วยงานเจ้าของรถ + กำหนดวันตอบคำขอยืนยัน"
```

---

# Task 6: sync ผัง + skeleton + plan.md

**Files:**
- Modify: `Diagram/01-บำรุงรักษาตามวาระ/02-เฟส1-เบิกจัดหา-ยืนยันรถ-แผนเดินทาง.md`, `00-ภาพรวม.md`, `Diagram/README.md`
- Modify: `maintainance-yearly/skeleton-data.js`, `maintainance-yearly/test/skeleton-data.test.js`
- Modify: `plan.md`, `maintainance-yearly/plan.md`

- [ ] **Step 1: อัปเดตผังเฟส 1**

ในไฟล์ `02-เฟส1-*.md`:
- หัวไฟล์ `**ยืนยันรถ ⬜ ยังไม่ได้ทำ**` → `**ยืนยันรถ ✅ ทำแล้ว** (`app.js` ขั้น 2 + `confirm.html`)`
- subgraph `CONF` ตัด `⬜ ยังไม่ได้ทำ` ออกจากชื่อ
- แก้กล่อง `SRC` — ผู้ตอบเหลือ **หน่วยงานเจ้าของรถ** อย่างเดียว (เดิมเขียน "เจ้าของรถ + กรย. คนละหน้าที่")
- เพิ่มเส้นเลยกำหนด:

```
    V2 -->|"ไม่ตอบเลยกำหนด"| V3
```

- ตัดคำถามที่เคาะแล้ว 3 ข้อ (ใครตอบ · กี่วัน/ไม่ตอบถือว่าอะไร · แก้คำตอบได้ไหม) เหลือข้อ "หน่วยงานเจ้าของรถดึงจากไหน" + เพิ่ม "ใครในหน่วยงานเป็นผู้มีสิทธิ์กด"

- [ ] **Step 2: อัปเดต `00-ภาพรวม.md` + `Diagram/README.md`** — ตารางสถานะเฟส 1 เป็น ✅ ครบ

- [ ] **Step 3: ตรวจว่าผัง parse ได้จริง**

```bash
# โหลด mermaid 11 บน headless Chromium แล้วเรียก parse() + render() ทุกไฟล์ใน Diagram/01-*
```
Expected: ผ่านครบ 7/7 ไฟล์

- [ ] **Step 4: อัปเดต `skeleton-data.js`**

- จอ `ph1a`: `real: null` → `real: 'index.html'` · ฟิลด์ที่ทำแล้วติด `done: true`
- จอ `src1`: `real: null` → `real: 'confirm.html'` · แก้ title เป็น `ต้นทาง · ยืนยันรถ (หน่วยงานเจ้าของรถ)` · ฟิลด์ติด `done: true`
- `asks` ของ `ph1a`: ติ๊กข้อ 1a.1/1a.2/1a.3 เป็นเคาะแล้วพร้อมคำตอบ · เหลือ 1a.4 รอ + เพิ่มข้อใหม่ "ใครในหน่วยงานมีสิทธิ์กด"
- แก้ `test/skeleton-data.test.js` ที่นับจำนวนคำถาม/จอให้ตรงค่าใหม่ แล้วรัน `node test/skeleton-data.test.js` ให้ผ่าน

- [ ] **Step 5: อัปเดต plan.md ทั้งสองไฟล์**

`maintainance-yearly/plan.md` — เพิ่มหัวข้อ "รอบแก้ 10 ส.ค. 2569 — ขั้นยืนยันรถเข้าร่วมแผน (หน้าจริง)" สรุปสิ่งที่ทำ + กติกา 4 ข้อที่เคาะ + ที่ยังค้าง
`plan.md` (ราก) — ติ๊กปิด `[x] หน้าจริงของ "ยืนยันรถเข้าร่วมแผน"` และเพิ่มข้อค้างใหม่ที่เกิดจากรอบนี้

- [ ] **Step 6: รันเทสทั้งชุด + Commit**

```bash
cd Maintenance-Request/Maintenance-Request-Form/maintainance-yearly
node test/confirm.test.mjs && node test/logic.test.mjs && node test/skeleton-data.test.js
```

```bash
git add Diagram maintainance-yearly/skeleton-data.js maintainance-yearly/test plan.md maintainance-yearly/plan.md
git commit -m "docs(บำรุงรักษา): sync ผัง+skeleton+plan.md กับขั้นยืนยันรถที่ทำเสร็จแล้ว"
```

---

## Verification (ทั้งฟีเจอร์)

```bash
cd Maintenance-Request/Maintenance-Request-Form
node maintainance-yearly/test/confirm.test.mjs
node maintainance-yearly/test/logic.test.mjs
node maintainance-yearly/test/skeleton-data.test.js
python3 -m http.server 8123 --bind 127.0.0.1
```

ขับเบราว์เซอร์ตาม `.claude/skills/verify/SKILL.md` — เกณฑ์ขั้นต่ำ:
- ไม่มี `pageerror` ทุกหน้า
- เดินครบเส้น: ส่งคำขอ → ตอบจาก `confirm.html` → ผลไปโผล่ฝั่ง กบค. → ตัดสินคันที่ไม่พร้อม → ปุ่มถัดไปเปิด → แผนเดินทางใช้จำนวนคันที่ยืนยัน → ยืนยันแล้ว `confirm.html` ล็อก
- รีโหลดแล้วค่ายังอยู่ · ลิงก์เมนูทุกหน้าไม่ 404 · `grep` hex + emoji ได้ผลว่าง
