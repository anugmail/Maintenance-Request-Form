# Prototype งานบำรุงรักษาตามวาระ (To-be) — Implementation Plan (Static HTML)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้าง prototype แบบ static HTML (คลิกเล่นได้จริง ไม่ต้อง build) ของ flow *งานบำรุงรักษาตามวาระ (To-be)* เดินตาม happy path **สายตรวจเอง (กบค.)** ครบ 6 เฟส โดยลงมือ **Phase 1 — Master Plan** ก่อน พร้อมหน้า **Admin (Master Data)** แยกต่างหาก — **ให้แนวเดียวกับ prototype รอบเก่า** (`Maintenance-Request-Form/`) โดย **ใช้ design-system ร่วมกัน**

**Architecture:** Static HTML + vanilla JS + CSS (ไม่มี build step) เปิดผ่าน `http.server`. โครงแบบ **app-shell VMS Plus desktop**: `.shell` (sidebar `.side` + `.work`) และ stepper 6 เฟสแบบ chevron `.wsteps`. State เก็บใน `localStorage` (คีย์ `maintaind.yearly.*`). **repo แยกอิสระ (self-contained) สำหรับ GitHub Pages** — **vendored (ก็อป) design-system + ui-components.js เข้ามาในโฟลเดอร์** แล้วลิงก์ local (ไม่ลิงก์ข้ามโฟลเดอร์). แต่ละเฟส/ขั้นเป็นฟังก์ชัน `render...()` ที่วาด DOM จาก state.

**Tech Stack:** HTML5 · vanilla JS (ES2020, no framework) · CSS (design-system กลาง) · localStorage · IBM Plex Sans Thai + Material Symbols (Google Fonts) · logic ทดสอบด้วย `node` · UI verify ด้วย Playwright + Chrome ที่ติดเครื่อง (ตาม verify skill ของ `Maintenance-Request-Form/`)

## Global Constraints

- **ที่ตั้ง:** ไฟล์ prototype อยู่ใน `Maintenance-Request/maintainance-yearly/` (ห้ามแก้ `code-maintainD/`; ห้ามแก้ไฟล์ใน `Maintenance-Request-Form/` — แค่ **ลิงก์อ้างอิง** เท่านั้น)
- **Vendored design-system (self-contained repo):** ก็อป `design-system/{tokens,components}.css` + `ui-components.js` มาไว้ในโฟลเดอร์นี้แล้ว (ทำเสร็จแล้ว ตั้งต้นจาก `Maintenance-Request-Form/` commit `bc3be43`). ทุกหน้า HTML ต้อง `<link>`/`<script>` แบบ **local**:
  - `<link rel="stylesheet" href="design-system/tokens.css">`
  - `<link rel="stylesheet" href="design-system/components.css">`
  - `<script src="ui-components.js"></script>` (window.UIC — reuse `vehicleCard` ได้)
  - ห้ามลิงก์ข้ามไป `../Maintenance-Request-Form/` (repo นี้ต้องเปิด Pages ได้เดี่ยว). ถ้าจะปรับ token แก้ที่ต้นทางแล้ว re-sync ตาม `README.md`
- **GitHub (self-contained repo):** repo นี้ push เป็น `github.com/anugmail/maintainance-yearly` แยกจาก repo อื่น (แบบเดียวกับ `Maintenance-Request-Form`) · มี `.nojekyll` + `README.md` แล้ว · Pages URL = `https://anugmail.github.io/maintainance-yearly/`
- **ห้าม hardcode สี:** ใช้ CSS variables/คลาสจาก design-system เท่านั้น (เช่น `var(--primary-600)`, `.btn-p`, `.card`, `.tbl`, `.wsteps`, `.sect`, `.badge`, `.veh`) — ห้ามใส่ hex สีเองในหน้า
- **สีหลัก design-system เก่า:** `--primary-600:#A80689` (ปุ่ม/active), hover `--primary-500:#CF07AA` — ยึดตาม tokens.css เดิม
- **ภาษา UI:** ไทยทั้งหมด · ปี = **พ.ศ.** (default ปัจจุบัน = **2569**, ไทรมาสปัจจุบัน = **Q3**)
- **ขอบเขต flow:** happy path **สายตรวจเอง (กบค.) เท่านั้น** — ไม่ทำสายว่าจ้าง/ผู้รับจ้าง, ไม่ทำเคส "บำรุงรักษาไม่ได้"/loop ตีกลับ (แสดงทางเดียว)
- **สถานะรถ:** `available`=ไม่ใช้ · `pending_approval`=รออนุมัติ · `transferred`=โอน
- **เกณฑ์:** `truck`=ทรัค · `net`=เนต · **หมวดรายการ:** `part`=อะไหล่ · `oil`=น้ำมัน(oilKind: engine/gear/hydraulic) · `filter`=ไส้กรอง
- **localStorage keys:** `maintaind.yearly.master.v1` (ข้อมูลหลัก: รถ+รายการ) · `maintaind.yearly.plan.v1` (แผนที่กำลังสร้าง) — corrupt JSON ต้อง fallback เป็น seed ไม่ crash
- **Serve เพื่อทดสอบ:** `cd maintainance-yearly && python3 -m http.server 8124 --bind 127.0.0.1` แล้วเปิด `http://127.0.0.1:8124/index.html` (serve จากในโฟลเดอร์เอง เพราะ self-contained) — **ห้าม `file://`**
- **ทุก Task จบด้วย commit** ที่ทดสอบผ่าน/verify ได้จริง

---

## File Structure

```
Maintenance-Request/maintainance-yearly/          # = git repo (github.com/anugmail/maintainance-yearly)
  README.md               # อธิบายโฟลเดอร์ + ลิงก์ + note vendored (มีแล้ว)
  .nojekyll               # GitHub Pages marker (มีแล้ว)
  plan.md                 # ไฟล์นี้
  maintannance-yearly.md  # สรุป flow (มีอยู่แล้ว)
  index.html              # แอปหลัก: .shell + sidebar + 6-phase .wsteps + จุด mount เฟส
  app.js                  # flow logic: state กลาง, nav เฟส/ขั้น, renderPhaseN()
  admin.html              # หน้า Admin (Master Data) แยกต่างหาก
  admin.js                # admin logic: CRUD รถ + รายการ (เขียน localStorage)
  mock-yearly.js          # window.MYD: seed data + storage + logic (deriveItems/workNumber) + label maps
  design-system/          # VENDORED (ก็อปจาก Maintenance-Request-Form @bc3be43) — มีแล้ว
    tokens.css  components.css
  ui-components.js        # VENDORED (window.UIC) — มีแล้ว
  test/
    logic.test.mjs        # เทสต์ deriveItems + workNumber (รันด้วย node)
```

**หลักการแยกไฟล์:** `mock-yearly.js` = data + logic ล้วน (เทสต์ได้ด้วย node) · `app.js` = flow · `admin.js` = admin — แยกความรับผิดชอบชัด ไฟล์ละหน้าที่

---

## Data model + logic (mock-yearly.js → `window.MYD`)

```js
// โครงข้อมูล (plain objects)
// vehicle: { id, plate, vehicleType, criteria, status, mileage, engineHours }
// item:    { id, name, category, oilKind?, unit, appliesToTypes:[], qtyPerVehicle }
// plan:    { planName, criteria, selectedVehicleIds:[], quarter, year, preparedConfirmed, workNumber, approvalStatus }

window.MYD = {
  // ----- label maps (ภาษาไทย) -----
  CRITERIA_LABELS: { truck:'ทรัค', net:'เนต' },
  STATUS_LABELS:   { available:'ไม่ใช้', pending_approval:'รออนุมัติ', transferred:'โอน' },
  CATEGORY_LABELS: { part:'อะไหล่', oil:'น้ำมัน', filter:'ไส้กรอง' },
  OILKIND_LABELS:  { engine:'น้ำมันเครื่อง', gear:'น้ำมันเฟือง', hydraulic:'น้ำมันไฮดรอลิก' },
  SEED_VEHICLES: [ /* ~8 คัน (ดู Task 0.2) */ ],
  SEED_ITEMS:    [ /* ~8 รายการ (ดู Task 0.2) */ ],

  // ----- storage (fallback seed เมื่อว่าง/พัง) -----
  loadMaster(),          // → { vehicles, items } จาก maintaind.yearly.master.v1 (seed ถ้าไม่มี/พัง)
  saveMaster(master),    // เขียน localStorage
  loadPlan(),            // → plan (INITIAL_PLAN ถ้าไม่มี/พัง)
  savePlan(plan),
  resetPlan(),

  // ----- logic ล้วน (unit-tested) -----
  deriveItems(vehicles, items),  // → [{ item, vehicleCount, totalQty }] เรียง part→oil→filter แล้วชื่อ; ตัด vehicleCount===0
  workNumber(quarter, year, seq),// → `MT-<year>-<quarter>-<seq 3 หลัก>` เช่น 'MT-2569-Q3-001'
};
```
`INITIAL_PLAN = { planName:'', criteria:null, selectedVehicleIds:[], quarter:null, year:2569, preparedConfirmed:false, workNumber:null, approvalStatus:'draft' }`

**6 เฟส (ใน app.js):**
```js
const PHASES = [
  { id:'master-plan', no:1, label:'ออกเลขงาน' },
  { id:'procurement', no:2, label:'เบิก/จัดหา + แผนเดินทาง' },
  { id:'maintenance', no:3, label:'ดำเนินการบำรุงรักษา' },
  { id:'inspection',  no:4, label:'ตรวจรับ' },
  { id:'report',      no:5, label:'จัดทำรายงาน' },
  { id:'cost',        no:6, label:'คำนวณต้นทุน' },
];
```

---

# Phase 0 — Shell + shared design-system + data/logic

## Task 0.1: mock-yearly.js (data + logic) + node tests

**Files:**
- Create: `maintainance-yearly/mock-yearly.js`
- Create: `maintainance-yearly/test/logic.test.mjs`

**Interfaces:**
- Produces `window.MYD` ตาม "Data model" ด้านบน. `mock-yearly.js` ต้องทำงานได้ทั้งใน browser (`window.MYD=...`) และถูก import ใน node test ได้ — ทำโดยท้ายไฟล์ใส่ `if (typeof module!=='undefined') module.exports = MYD;` และประกาศ `const MYD = {...}; if (typeof window!=='undefined') window.MYD = MYD;`
- `deriveItems(vehicles, items)`: สำหรับแต่ละ item นับรถที่ `item.appliesToTypes.includes(v.vehicleType)` → `vehicleCount`; `totalQty = qtyPerVehicle*vehicleCount`; ตัด `vehicleCount===0`; เรียง `part(0)→oil(1)→filter(2)` แล้วชื่อ (`localeCompare('th')`)
- `workNumber(q,y,seq)` → `` `MT-${y}-${q}-${String(seq).padStart(3,'0')}` ``

- [ ] **Step 1: เขียน failing test** `test/logic.test.mjs` (ใช้ node built-in `assert` + dynamic import ของ CommonJS ผ่าน `createRequire`)

```js
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

// workNumber
assert.equal(MYD.workNumber('Q3',2569,1), 'MT-2569-Q3-001');
assert.equal(MYD.workNumber('Q1',2570,42), 'MT-2570-Q1-042');
assert.equal(MYD.workNumber('Q4',2569,123), 'MT-2569-Q4-123');

console.log('OK: all logic tests passed');
```

- [ ] **Step 2: รันให้ fail** — Run: `cd maintainance-yearly && node test/logic.test.mjs`
  Expected: FAIL — `Cannot find module '../mock-yearly.js'` (ยังไม่สร้าง)

- [ ] **Step 3: เขียน mock-yearly.js** — ประกาศ `const MYD = { ... }` ตาม Data model, ใส่ SEED (ดู Task 0.2 สำหรับข้อมูล seed — ใน task นี้ใส่ SEED เต็มได้เลย), implement `deriveItems`/`workNumber`/storage helpers, ปิดท้ายด้วย:
```js
if (typeof window !== 'undefined') window.MYD = MYD;
if (typeof module !== 'undefined') module.exports = MYD;
```
  storage helpers ใช้ `try{JSON.parse(localStorage.getItem(k))}catch{...}` + guard `typeof localStorage` (node ไม่มี localStorage — helper เหล่านี้ไม่ถูกเรียกใน test)

- [ ] **Step 4: รันให้ pass** — Run: `cd maintainance-yearly && node test/logic.test.mjs`
  Expected: PASS — "OK: all logic tests passed"

- [ ] **Step 5: git init + commit** (repo ใหม่ใน `maintainance-yearly/`)
```bash
cd /Users/anu.p/PEA/Maintain-D/Maintenance-Request/maintainance-yearly
git init -q
printf 'node_modules/\n.DS_Store\n' > .gitignore
git add -A && git commit -qm "feat: mock-yearly data model + deriveItems/workNumber logic with node tests"
```

## Task 0.2: seed data (รถ + รายการ) — ยืนยันเนื้อ SEED

> ทำใน Task 0.1 แล้ว (SEED อยู่ใน mock-yearly.js) — task นี้เป็น "ยืนยันเนื้อหา seed" ให้ใช้ค่าตรงนี้เป๊ะ ถ้ายังไม่ตรงให้แก้:

```js
SEED_VEHICLES: [
  { id:'v1', plate:'81-2345', vehicleType:'รถกระเช้า', criteria:'truck', status:'available',        mileage:120500, engineHours:3400 },
  { id:'v2', plate:'82-6677', vehicleType:'รถกระเช้า', criteria:'truck', status:'available',        mileage:98000,  engineHours:2900 },
  { id:'v3', plate:'83-1122', vehicleType:'รถเครน',   criteria:'truck', status:'pending_approval', mileage:145000, engineHours:5100 },
  { id:'v4', plate:'84-9090', vehicleType:'รถเครน',   criteria:'net',   status:'available',        mileage:76000,  engineHours:2100 },
  { id:'v5', plate:'85-3311', vehicleType:'รถขุด',    criteria:'net',   status:'available',        mileage:60000,  engineHours:4800 },
  { id:'v6', plate:'86-7788', vehicleType:'รถขุด',    criteria:'net',   status:'transferred',      mileage:52000,  engineHours:3900 },
  { id:'v7', plate:'87-4455', vehicleType:'รถกระเช้า', criteria:'net',   status:'available',        mileage:88000,  engineHours:2600 },
  { id:'v8', plate:'88-1200', vehicleType:'รถเครน',   criteria:'truck', status:'available',        mileage:132000, engineHours:4700 },
],
SEED_ITEMS: [
  { id:'p1', name:'ผ้าเบรก',              category:'part',   unit:'ชุด', appliesToTypes:['รถกระเช้า','รถเครน','รถขุด'], qtyPerVehicle:1 },
  { id:'p2', name:'สายไฮดรอลิก',          category:'part',   unit:'เส้น', appliesToTypes:['รถกระเช้า','รถเครน'],        qtyPerVehicle:2 },
  { id:'o1', name:'น้ำมันเครื่อง 15W-40',  category:'oil', oilKind:'engine',    unit:'ลิตร', appliesToTypes:['รถกระเช้า','รถเครน','รถขุด'], qtyPerVehicle:12 },
  { id:'o2', name:'น้ำมันเฟือง 90',        category:'oil', oilKind:'gear',      unit:'ลิตร', appliesToTypes:['รถเครน','รถขุด'],             qtyPerVehicle:6 },
  { id:'o3', name:'น้ำมันไฮดรอลิก 68',     category:'oil', oilKind:'hydraulic', unit:'ลิตร', appliesToTypes:['รถกระเช้า','รถเครน','รถขุด'], qtyPerVehicle:20 },
  { id:'f1', name:'ไส้กรองน้ำมันเครื่อง',   category:'filter', unit:'ชิ้น', appliesToTypes:['รถกระเช้า','รถเครน','รถขุด'], qtyPerVehicle:1 },
  { id:'f2', name:'ไส้กรองไฮดรอลิก',       category:'filter', unit:'ชิ้น', appliesToTypes:['รถกระเช้า','รถเครน','รถขุด'], qtyPerVehicle:1 },
  { id:'f3', name:'ไส้กรองอากาศ',          category:'filter', unit:'ชิ้น', appliesToTypes:['รถขุด'],                     qtyPerVehicle:1 },
],
```
- [ ] **Step 1:** ตรวจว่า SEED ใน `mock-yearly.js` ตรงตารางนี้ (ถ้าตรงแล้วจาก 0.1 ไม่ต้องแก้)
- [ ] **Step 2: verify** — `node test/logic.test.mjs` ยัง PASS
- [ ] **Step 3: commit** (ถ้ามีแก้) — `git commit -am "chore: confirm seed data"` (ข้ามได้ถ้าไม่แก้)

## Task 0.3: index.html shell + app.js (6-phase stepper + phase router)

**Files:**
- Create: `maintainance-yearly/index.html`
- Create: `maintainance-yearly/app.js`

**Interfaces:**
- `index.html`: โครง `.shell` — `.side` (โลโก้ + nav icon 2 อัน: "Flow" active, "Admin — ข้อมูลหลัก" ลิงก์ `admin.html`) + `.work` (`.topbar` + `.content` มี `<div class="draft">` แถบ Draft + `#stepper` + `#phase` จุด mount). โหลด fonts (Google) + local `design-system/tokens.css` + `design-system/components.css` + `ui-components.js` + `mock-yearly.js` + `app.js`
- `app.js`: state `{ phase:'master-plan', ... }`, `renderStepper()` วาด `.wsteps` 6 เฟส (active=เฟสปัจจุบัน, passed=เฟสที่ complete, เฟสถัดไปคลิกได้เมื่อเฟสก่อน complete), `goPhase(id)`, `renderPhase()` เรียก `renderMasterPlan()` (เฟส 1) หรือ `renderPlaceholder(phase)` (เฟส 2–6). เฟส 1 complete เมื่อ `MYD.loadPlan().approvalStatus==='approved'`
- Produces ฟังก์ชัน global: `goPhase`, `toast(msg)` (reuse pattern เดิม), `renderPhase`

- [ ] **Step 1:** เขียน `index.html` (ตามโครง `.shell` ของ components.css — ใช้ `.side/.nv/.work/.topbar/.content/.draft`)
- [ ] **Step 2:** เขียน `app.js` — state + `renderStepper()` (`.wsteps`) + `renderPhase()` + `renderPlaceholder()` ("เฟสนี้อยู่ในแผนถัดไป" + ชื่อเฟส) + `toast()`
- [ ] **Step 3: verify (browser)** — serve แล้วเปิด `index.html`:
  - เห็น sidebar + แถบ Draft + chevron stepper 6 เฟส (เฟส 1 active, 2–6 disabled/จาง)
  - พื้นที่เนื้อหาแสดง placeholder ของเฟส 1 (จะแทนด้วย Master Plan ใน Phase 1)
  - ปุ่ม "Admin — ข้อมูลหลัก" ลิงก์ไป `admin.html` (ยัง 404/ว่างได้ — สร้าง Phase A)
  - Console ไม่มี error
- [ ] **Step 4: commit** — `git add -A && git commit -qm "feat: app shell with sidebar + 6-phase chevron stepper + phase router"`

---

# Phase A — หน้า Admin (Master Data) *(ทำก่อน Phase 1 เพื่อป้อนข้อมูลเข้า flow)*

## Task A.1: admin.html + admin.js — ตารางรถ + รายการ (อ่าน)

**Files:**
- Create: `maintainance-yearly/admin.html`
- Create: `maintainance-yearly/admin.js`

**Interfaces:**
- `admin.html`: โครง `.shell` เหมือน index (sidebar: "Flow" ลิงก์ `index.html`, "Admin" active) + `.content` มี `<div class="draft">โหมดผู้ดูแลระบบ (Master Data)</div>` + แท็บ 2 อัน (ปุ่ม `.seg`): "ข้อมูลรถ" / "อะไหล่-น้ำมัน-ไส้กรอง" + `#adminBody`. โหลด fonts + local `design-system/*.css` + `ui-components.js` + `mock-yearly.js` + `admin.js`
- `admin.js`: `renderVehicles()` วาด `.tbl` (ทะเบียน/ประเภท/เกณฑ์/สถานะ `.badge`/ไมล์/ชม.) จาก `MYD.loadMaster().vehicles`; `renderItems()` วาด `.tbl` แยกกลุ่มหมวด. แท็บสลับด้วย state `tab`

- [ ] **Step 1:** เขียน `admin.html` (shell + แท็บ + mount)
- [ ] **Step 2:** เขียน `admin.js` — `renderVehicles()` + `renderItems()` (อ่านอย่างเดียวก่อน)
- [ ] **Step 3: verify (browser)** — เปิด `admin.html`: เห็นตารางรถ 8 คัน + แท็บรายการเห็น 8 รายการแยกหมวด · สลับแท็บได้ · badge สถานะสีถูก · console ไม่มี error
- [ ] **Step 4: commit** — `git commit -am "feat: admin master-data read views (vehicles + items)"`

## Task A.2: admin CRUD — เพิ่ม/แก้ไข/ลบ รถ

**Files:** Modify `admin.html` (modal), `admin.js`

**Interfaces:** ใช้ `MYD.loadMaster`/`MYD.saveMaster`. id ใหม่ = `'v'+Date.now()` (หมายเหตุ: node-only logic ไม่ใช้ Date; ที่นี่เป็น UI ผู้ใช้กด จึงใช้ได้)

- [ ] **Step 1:** ปุ่ม "+ เพิ่มรถ" เปิด modal (ใช้คลาส `.card` ใน overlay หรือ `<dialog>`), ฟอร์ม: ทะเบียน, ประเภท(select รถกระเช้า/รถเครน/รถขุด), เกณฑ์(truck/net), สถานะ, ไมล์, ชม. → `saveMaster` → `renderVehicles()`
- [ ] **Step 2:** ปุ่มแก้ไข/ลบต่อแถว (ลบ = confirm)
- [ ] **Step 3: verify (browser)** — เพิ่มรถ 1 คัน → แถวใหม่โผล่ · reload หน้า → ยังอยู่ (localStorage) · แก้ไข/ลบทำงาน
- [ ] **Step 4: commit** — `git commit -am "feat: admin vehicles CRUD (localStorage persisted)"`

## Task A.3: admin CRUD — เพิ่ม/แก้ไข/ลบ รายการ (อะไหล่/น้ำมัน/ไส้กรอง)

**Files:** Modify `admin.html`, `admin.js`

- [ ] **Step 1:** modal เพิ่ม/แก้ไขรายการ: ชื่อ, หมวด(part/oil/filter), oilKind(แสดงเมื่อ oil), หน่วย, qtyPerVehicle, appliesToTypes (checkbox รถกระเช้า/เครน/ขุด) → `saveMaster` → `renderItems()`
- [ ] **Step 2:** ปุ่มแก้ไข/ลบต่อแถว
- [ ] **Step 3: verify (browser)** — เพิ่มรายการน้ำมัน → โผล่ในกลุ่มน้ำมัน · reload ยังอยู่ · ลบได้
- [ ] **Step 4: commit** — `git commit -am "feat: admin items CRUD (parts/oils/filters)"`

---

# Phase 1 — Master Plan (โฟกัสหลัก)

`renderMasterPlan()` ใน app.js เป็น sub-stepper 5 ขั้น (ถือ `state.sub` 1..5) + ปุ่มท้าย `.actions` "ย้อนกลับ/ถัดไป" · อ่าน/เขียน plan ผ่าน `MYD.loadPlan`/`MYD.savePlan` · อ่านรถ/รายการจาก `MYD.loadMaster`

## Task 1.1: renderMasterPlan host + ขั้น 1 (เกณฑ์ + ชื่อแผน)

**Files:** Modify `app.js` (แทน placeholder เฟส master-plan ด้วย `renderMasterPlan()`)

**Interfaces:**
- `renderMasterPlan()` วาด sub-stepper 5 ขั้น (`.wsteps` เล็ก หรือ `.steps`) + เนื้อขั้นปัจจุบัน; `goSub(n)`, `nextSub()/backSub()`
- ขั้น 1: input ชื่อแผน (`.f`) + เลือกเกณฑ์ ทรัค/เนต (2 `.tile` หรือ `.seg`) → เขียน plan `planName`/`criteria` (เปลี่ยนเกณฑ์ต้องล้าง `selectedVehicleIds`); ปุ่มถัดไป disabled จนมีชื่อ+เกณฑ์

- [ ] **Step 1:** เขียน `renderMasterPlan()` + sub-stepper + ขั้น 1
- [ ] **Step 2: verify (browser)** — เฟส 1 แสดงฟอร์มชื่อแผน+เกณฑ์ · กรอกชื่อ+เลือกเกณฑ์ → ถัดไป enable → ไปขั้น 2 (ว่างชั่วคราว)
- [ ] **Step 3: commit** — `git commit -am "feat: master plan step 1 (criteria + plan name)"`

## Task 1.2: ขั้น 2 — เลือกรถเข้าแผน

**Files:** Modify `app.js`

**Interfaces:** ตารางรถ **กรองตาม `plan.criteria`** (`MYD.loadMaster().vehicles.filter(v=>v.criteria===plan.criteria)`) เป็น `.tbl` + checkbox ต่อแถว + "เลือกทั้งหมด" → เขียน `plan.selectedVehicleIds`; ปุ่มถัดไป disabled จนเลือก ≥1

- [ ] **Step 1:** เขียนขั้น 2 (ตาราง + checkbox + เลือกทั้งหมด, แสดง `.badge` สถานะ)
- [ ] **Step 2: verify (browser)** — เลือกเกณฑ์ "เนต" ขั้น 1 → ขั้น 2 เห็นเฉพาะรถ net · ติ๊ก 2 คัน → ถัดไป enable
- [ ] **Step 3: commit** — `git commit -am "feat: master plan step 2 (select trucks by criteria)"`

## Task 1.3: ขั้น 3 — รายการอะไหล่/น้ำมัน/ไส้กรอง (auto)

**Files:** Modify `app.js`

**Interfaces:** `MYD.deriveItems(selectedVehicles, items)` แล้วแสดงแยก 3 กลุ่ม (อะไหล่/น้ำมัน/ไส้กรอง) เป็น `.tbl`: ชื่อ · ต่อคัน · จำนวนรถ · รวม · หน่วย (อ่านอย่างเดียว) + ยอดรวมรายการ

- [ ] **Step 1:** เขียนขั้น 3 (ใช้ `MYD.deriveItems`)
- [ ] **Step 2: verify (browser)** — เลือกรถกระเช้า 2 คัน → น้ำมันเครื่องรวม 24 ลิตร; ไม่เห็นไส้กรองอากาศ (ของรถขุด)
- [ ] **Step 3: commit** — `git commit -am "feat: master plan step 3 (auto-derived items)"`

## Task 1.4: ขั้น 4 — ระบุไทรมาส

**Files:** Modify `app.js`

**Interfaces:** เลือกไทรมาส Q1–Q4 (`.seg`/`.tile` พร้อมช่วงเดือนปีงบฯ: Q1 ต.ค.–ธ.ค., Q2 ม.ค.–มี.ค., Q3 เม.ย.–มิ.ย., Q4 ก.ค.–ก.ย.) + ปี พ.ศ. (default 2569) → เขียน `plan.quarter/year`; ถัดไป disabled จนเลือกไทรมาส

- [ ] **Step 1:** เขียนขั้น 4
- [ ] **Step 2: verify (browser)** — เลือก Q3/2569 → ถัดไป enable
- [ ] **Step 3: commit** — `git commit -am "feat: master plan step 4 (quarter)"`

## Task 1.5: ขั้น 5 — ทวน + ผบพ.เตรียมอะไหล่ + ขออนุมัติเลขงาน

**Files:** Modify `app.js`

**Interfaces:**
- แสดงสรุปแผน (ชื่อ, เกณฑ์, จำนวนรถ, ไทรมาส/ปี, สรุปอะไหล่รวม)
- checkbox "ผบพ. ตรวจ/เตรียมอะไหล่สำหรับไทรมาสนี้แล้ว" → `plan.preparedConfirmed`
- ปุ่ม "ขออนุมัติเลขงาน" (disabled จน preparedConfirmed) → set `approvalStatus='approved'`, `workNumber=MYD.workNumber(plan.quarter, plan.year, 1)`, savePlan
- หลังอนุมัติ: แสดงเลขงาน (`.badge b-ok`) + ตารางสรุปจำนวนรถตามแผนแยกสถานะ (ไม่ใช้/รออนุมัติ/โอน) + ปุ่ม "ไปเฟสถัดไป →" (`goPhase('procurement')`); stepper เฟส 1 กลายเป็น passed

- [ ] **Step 1:** เขียนขั้น 5
- [ ] **Step 2: verify (browser, happy path เต็ม Phase 1)** — serve → index.html → ชื่อ+เกณฑ์ → เลือกรถ → ดูอะไหล่ → ไทรมาส → ติ๊กเตรียม → ขออนุมัติ → ได้ `MT-2569-Q3-001`, เห็นสรุปสถานะรถ, stepper เฟส 1 = passed, เฟส 2 คลิกได้ · reload แล้ว plan ยังอยู่
- [ ] **Step 3: commit** — `git commit -am "feat: master plan step 5 (review + approve + work number)"`

---

# Phase 2 — เบิก/จัดหา + แผนเดินทาง (สายตรวจเอง)

`renderProcurement()` ใน app.js = wizard 3 ขั้น · ต้องมาหลัง Phase 1 อนุมัติแล้ว (มี `workNumber`) · ใช้ `state.sub` ร่วม โดย `goPhase()` reset `state.sub=1` ทุกครั้งที่สลับเฟส

**Field ใหม่ใน plan (INITIAL_PLAN):** `partsRequisitioned:false` · `travelPlan:null` (→ `{location,dateFrom,dateTo,perDiem,lodging,travel}`) · `travelConfirmed:false`
**`isPhaseComplete('procurement')`** = `plan.travelConfirmed === true` (เพื่อปลดล็อกเฟส 3)

## Task 2.1: renderProcurement wizard (เบิกอะไหล่ → แผนเดินทาง → ยืนยัน)

**Files:** Modify `mock-yearly.js` (เพิ่ม field ใน INITIAL_PLAN), `app.js` (แทน placeholder เฟส `procurement` + แก้ `goPhase` reset `state.sub` + ขยาย `isPhaseComplete`)

**Interfaces:**
- **ขั้น 1 — เบิกอะไหล่ (ระบบขออะไหล่):** recap `MYD.deriveItems(selectedVehicles, items)` (ตารางสรุปรวม เหมือน Master Plan ขั้น 3) + ปุ่ม "ส่งคำขอเบิกอะไหล่" → `plan.partsRequisitioned=true` + toast + แสดง `.badge b-ok` "ส่งคำขอแล้ว"; ปุ่มถัดไป disabled จน `partsRequisitioned`
- **ขั้น 2 — ทำแผนเดินทาง:** ฟอร์ม `.fgrid`/`.f`: สถานที่บำรุงรักษา (text), จากวันที่ (date), ถึงวันที่ (date), ค่าเบี้ยเลี้ยง (number บาท), ค่าที่พัก (number บาท), ค่าเดินทาง (number บาท) → เขียน `plan.travelPlan`; ถัดไป disabled จน `location`+`dateFrom`+`dateTo` ครบ
- **ขั้น 3 — ทวน + ยืนยัน:** สรุปแผนเดินทาง + รวมค่าใช้จ่าย (`perDiem+lodging+travel`) + ปุ่ม "ยืนยันแผนเดินทาง" → `plan.travelConfirmed=true`, savePlan → แสดง: mock "📨 ส่ง Noti แจ้งเจ้าของรถ N คัน + กรย. วันที่เข้าตรวจ" (`.card`) + ปุ่ม "ทำใบนำจ่าย (PEA Life)" (mock toast) + ปุ่ม "ไปเฟสถัดไป →" (`goPhase('maintenance')`); stepper เฟส 2 กลายเป็น `passed`
- เมื่อ `plan.travelConfirmed===true` แล้วกลับเข้าเฟส 2 → แสดง**สรุปยืนยันเลย** (ไม่เริ่ม wizard ใหม่) เหมือน Master Plan ตอน approved

- [ ] **Step 1:** เพิ่ม field ใน `INITIAL_PLAN` (mock-yearly.js): `partsRequisitioned:false, travelPlan:null, travelConfirmed:false` (node test เดิมยังต้อง PASS)
- [ ] **Step 2:** แก้ `goPhase()` ให้ reset `state.sub=1`; ขยาย `isPhaseComplete()` ให้ `'procurement'`→`travelConfirmed`
- [ ] **Step 3:** เขียน `renderProcurement()` 3 ขั้น + wire `renderPhase()` เฟส `procurement`
- [ ] **Step 4: verify (browser)** happy path: อนุมัติ Phase 1 → เข้าเฟส 2 → เบิกอะไหล่ → กรอกแผนเดินทาง → ยืนยัน → เห็น Noti + ปุ่มใบนำจ่าย → เฟส 3 ปลดล็อก; reload plan ยังอยู่
- [ ] **Step 5: commit + push** — `git commit -m "feat: phase 2 procurement + travel plan wizard"; git push origin main`

---

# Phase 3–6 — โครงเฟสถัดไป (Outline — จะแตกเป็น task ระดับ step เมื่อเริ่มเฟสนั้น)

> เดินสาย **ตรวจเอง (กบค.)** ต่อยอดจาก plan ที่มี workNumber แล้ว แต่ละเฟสเพิ่ม field ใน plan + แทน `renderPlaceholder` ด้วยหน้าจริงทีละเฟส (รูปแบบ/verify เหมือน Phase 1–2)
- **Phase 3 — ดำเนินการบำรุงรักษา:** กรย.เตรียมของที่จุดรวมงาน → ถ่ายรูปก่อน (mock upload) → บันทึกซ่อม+ยืนยันอะไหล่จริง+ไมล์+ชม. → เก็บตัวอย่างน้ำมันไฮดรอลิก → ถ่ายรูปหลัง → หน่วยพัสดุรับทราบ. Field: `results[]`
- **Phase 4 — ตรวจรับ:** ตรวจข้อมูล → ผ่าน → คืนอะไหล่/น้ำมันที่ไม่ได้ใช้. Field: `inspectionPassed`, `returnedItems[]`
- **Phase 5 — จัดทำรายงาน:** ตรวจสภาพไฟฟ้า/น้ำมัน/ไฮดรอลิก → บันทึกผลตรวจน้ำมัน → mock Noti → ครบทุกคัน → ผู้บังคับบัญชาตรวจประวัติ → ปิดงาน. Field: `oilTestResult`, `closed`
- **Phase 6 — คำนวณต้นทุน:** รายงานบน VMS+ (mock) → `computeCost()` (ค่าแรง+อะไหล่+เบี้ยเลี้ยง+เดินทาง+น้ำมัน) → SUM → ปุ่ม Export Excel (mock) → DONE. Logic ใหม่ (node-test): `MYD.computeCost(plan, master)`

---

## Verification (ทั้ง prototype)

- **Logic:** `cd maintainance-yearly && node test/logic.test.mjs` → PASS
- **UI (browser):** ใช้แนวเดียวกับ verify skill ของ `Maintenance-Request-Form/`:
  ```bash
  cd /Users/anu.p/PEA/Maintain-D/Maintenance-Request/maintainance-yearly && python3 -m http.server 8124 --bind 127.0.0.1
  ```
  ขับด้วย Playwright + Chrome ที่ติดเครื่อง (`executablePath` ตาม verify skill), เปิด `http://127.0.0.1:8124/index.html`
- **Regression:** ล้าง localStorage → index.html แสดง default (stepper 6 เฟส, เฟส1 active) · admin แสดง seed 8 รถ/8 รายการ · corrupt `maintaind.yearly.*` (`{{{broken`) → ไม่ crash (fallback seed)

## Self-Review
- **Coverage:** static HTML + แชร์ design-system รอบเก่า (ลิงก์) ✅ · 6 เฟส (P1 เต็ม, P2–6 outline) ✅ · admin master-data แยกหน้า (รถ+รายการ CRUD) ✅ · สายตรวจเองเท่านั้น ✅ · logic มี node test ✅
- **Placeholder scan:** logic task มีเทสต์จริง; UI task ใช้ browser-verify ระบุ input/expected ชัด; `renderPlaceholder` เป็นฟังก์ชันจริง; P2–6 เป็น outline ตั้งใจ (มีคำถามเปิดค้าง)
- **Type consistency:** `vehicleType`/`appliesToTypes`/`selectedVehicleIds`/`preparedConfirmed`/`workNumber` ใช้ชื่อตรงกันทุก task และตรงกับ `mock-yearly.js`
- **ข้อควรระวัง:** ปี พ.ศ. 2569 hardcode (ไม่พึ่ง Date ใน logic ที่เทสต์) · CRUD ใช้ `Date.now()` เป็น id เฉพาะฝั่ง UI (นอก node test)

## หมายเหตุยืนยันกับเจ้าของกระบวนการ
- ✅ **กบค.** ยืนยันแล้ว (8 ส.ค. 2569) — ไม่มี "กบก." เป็นการพิมพ์ผิด
- ยังค้าง: **ผบพ., กบท.** และนิยาม **เกณฑ์ ทรัค/เนต**, สูตร **SUM ต้นทุน** — ดู [คำถามเปิดในสรุป flow](maintannance-yearly.md#คำถามเปิด)

---

## รอบแก้ 8 ส.ค. 2569 — เฟส 1 "ออกเลขงาน" = แผนประจำปี

> เจ้าของงานสั่งไล่ทีละหน้า พร้อมใส่เงื่อนไขไปด้วยกัน · เริ่มที่เฟส 1

### wizard 4 → 3 ขั้น

| | เดิม | ใหม่ |
|---|---|---|
| 1 | ชื่อแผน + เลือกรถ | เหมือนเดิม |
| 2 | รายการอะไหล่ (อ่านอย่างเดียว) | **จัดกลุ่มได้ 3 แบบ + ปรับจำนวน/เพิ่ม/ตัดออกได้** |
| 3 | ~~ระบุไทรมาส~~ | **ตัดทิ้ง** — เป็นแผนประจำปี ไม่ต้องเลือกไทรมาส |
| 4 | ทวน + อนุมัติ | → เลื่อนเป็นขั้น 3 **"สรุปแผนทั้งปี"** |

### เคาะกับเจ้าของงาน (8 ส.ค.)

1. **เลขงานคง `MT-ปี-ไทรมาส-NNN` ไว้** — แต่ผู้ทำแผนไม่ได้เลือกไทรมาส ⇒ ระบบเติมให้จาก**ไทรมาส ณ วันที่ฝ่ายพัสดุออกเลขงาน** (ปีงบประมาณ ต.ค.–ก.ย.) ผ่าน `MYD.quarterOfMonth()` ที่เพิ่มใหม่ (pure + เทสได้)
2. **config การจัดกลุ่มอะไหล่ = dropdown ในหน้า** สลับดูสดๆ ไม่ใช่ตั้งที่ Admin
3. **"ตามยี่ห้อ" ตัดออกก่อน** เหลือ 3 แบบ — ชนิดอะไหล่ / ภาค / เขต

### ขั้น 2 — รายการอะไหล่

- จัดกลุ่ม 3 แบบผ่าน `GROUP_MODES` (`cat` / `zone` / `region`) เก็บใน `state.grp` (memory ไม่ persist เหมือน `state.sub`)
- แก้มือเก็บที่ **`plan.itemAdj[itemId] = { qty, off, added }`** — แยกจากค่าที่ระบบคำนวณ
  ⇒ เปลี่ยนรถในขั้น 1 แล้วยอด auto อัปเดตตาม **แต่ของที่แก้มือไม่ถูกทับ**
- รายการที่แก้ติดป้าย `แก้จำนวนแล้ว` / `เพิ่มเอง` กันสับสนตอนตรวจ
- โหมดภาค/เขต: ปรับจำนวนมีผล**ทั้งแผน** (ไม่ใช่เฉพาะกลุ่ม) — มีข้อความกำกับในหน้า
- `computeLines(vehicles, master, adj)` แยกออกมาเพื่อใช้ซ้ำได้ทั้งภาพรวมและรายภาค/รายเขต

### ขั้น 3 — สรุปแผนทั้งปี

ชื่อแผน · ช่วงเวลา · **รถเข้าแผนกี่คัน** · **อะไหล่กี่รายการ** · แยกตามหมวด
\+ ตาราง **รถแยกตามภาค** (จำนวน + เขตที่มีรถ + แยกชนิดรถ) + ตาราง **อะไหล่ที่ต้องใช้ทั้งปี** (อ่านอย่างเดียว)
\+ checkbox ผบพ. เตรียมอะไหล่ → ปุ่มส่งขออนุมัติ

### ยังค้าง

- [ ] **จัดกลุ่ม "ตามยี่ห้อ"** — ต้องเพิ่มฟิลด์ยี่ห้อที่รถ + ผูกอะไหล่กับยี่ห้อ (ตอนนี้ผูกกับ `appliesToTypes` = ชนิดรถ) · ต้นแบบแจ้งซ่อมมียี่ห้อจริงอยู่แล้ว (Tadano TM-ZE304 · Aichi SK17A · Unic URV554) ใช้ชุดเดียวกันได้
- [ ] **dropdown "เพิ่มอะไหล่" ยังลองไม่ได้** — `SEED_ITEMS` มี 8 รายการและเข้าแผนครบทุกตัว ต้องเพิ่ม seed ที่ไม่ตรง `appliesToTypes` เพื่อให้เดโมได้
- [x] ~~กบค. คือหน่วยงานอะไร~~ — **เคาะแล้ว 8 ส.ค. 2569: เป็น กบค. เท่านั้น "กบก." คือพิมพ์ผิด** ไล่แก้ทั้งโค้ดและเอกสารแล้ว (113 จุด)
- [ ] ฝ่ายพัสดุอนุมัติทั้งแผน หรือรายเขตได้
- [ ] เฟส 3–6 ยังเป็นหน้าเปล่า — เงื่อนไขที่ต้องเคาะรวบรวมไว้ใน `skeleton.html` แล้ว (21 ข้อ)

### ไฟล์ที่แตะ

`app.js` (SUB_STEPS · computeLines · renderStep2/bindStep2 · renderStep3/bindStep3 · computePlanSummary) · `mock-yearly.js` (`quarterOfMonth`) · `supplies.js` (เติมไทรมาสตอนออกเลขงาน) · `index.html` (คอลัมน์ที่ 6 ของ `.itbl`) · `Diagram/01-บำรุงรักษาตามวาระ/01-ออกเลขงาน.md` (sync ผัง)

### โครงกระดูก 6 เฟส (ใหม่)

`maintainance-yearly/skeleton.html` — หน้าเปล่า 6 เฟส บอกว่าแต่ละหน้าคืออะไร ทำอะไร กดต่อได้ + รวม**เงื่อนไขที่ต้องเคาะ 21 ข้อ** ไว้ทีละเฟส · ไม่ทับ `index.html` ตัวเต็ม

### แก้เพิ่มรอบเดียวกัน (8 ส.ค. 2569 — รอบ 2)

**1 · ตัด "ผบพ. เตรียมอะไหล่" ออก** — ช่วงทำแผนยังไม่มีการเตรียมอะไหล่
ลบ checkbox + `plan.preparedConfirmed` ทั้งระบบ (`app.js` renderStep3/bindStep3/validateSub/updatePrimaryEnabled/renderWizard/issue · `mock-yearly.js` INITIAL_PLAN)

**2 · ฝ่ายพัสดุไม่ใช่ผู้อนุมัติ** — เปลี่ยนโครง workflow

| | เดิม | ใหม่ |
|---|---|---|
| ใครออกเลขงาน | ฝ่ายพัสดุ (อนุมัติ) | **กบค. กดเองที่หน้าสรุป** |
| บทบาทฝ่ายพัสดุ | อนุมัติ / ตีกลับ | **รับทราบ** เพื่อเตรียม/สั่งอะไหล่ |
| สถานะ | `draft → pending → approved \| rejected` | **`draft → issued`** + `suppliesAckAt` |
| ปลดล็อกเฟส 2 | เมื่อ `approved` | เมื่อ **มีเลขงาน** (พัสดุไม่บล็อก) |

- ตัด `renderPendingView` · `renderRejectedView` · `sendForApproval` · `approvePlan` · `openRejectModal` · `rejectReason` ทิ้งทั้งหมด
- `issueWorkNumber()` ใหม่ใน `app.js` — เติมไทรมาส + ออกเลข + ลง history 2 รายการ (`issued`, `notified`)
- `supplies.js` เขียนใหม่เป็นหน้า **เอกสารแจ้งเตรียม/สั่งอะไหล่**: เลขงาน · รถกี่คัน · **แยกภาค** · **แยกยี่ห้อ/รุ่นอุปกรณ์** · **ตารางอะไหล่ 3 หมวดพร้อมยอดรวมที่ต้องเตรียม** · timeline · ปุ่ม "รับทราบ"
- `SCHEMA_VERSION` 4 → 5 (แผนเก่าใน localStorage รีเซ็ตเอง)
- ย้าย logic รายการอะไหล่ไป `MYD.linesFor()` / `MYD.planLines()` เพื่อให้หน้า กบค. กับหน้าพัสดุเห็นตัวเลข**ชุดเดียวกัน**

**3 · เพิ่มยี่ห้อ/รุ่นอุปกรณ์** — แผนนี้บำรุงรักษาเครน/กระเช้า ยี่ห้อจึงต้องมี

- `vehicle` เพิ่มฟิลด์ **`brand`** (ยี่ห้อ/รุ่นอุปกรณ์) + **`chassis`** (ยี่ห้อรถบรรทุก)
- ⚠️ **ไม่ได้คิดขึ้นเอง** — ยกจากข้อมูลที่มีอยู่แล้วในโปรเจกต์ (`config.js` + `repair-history.html`):
  `TADANO TM-ZE304` (HINO FM8J 6 ล้อ) · `TADANO TM-ZE504` (HINO FM8J) · `UNIC URV554` (HINO XZU) · `AICHI SK17A` (ISUZU FTR) · `KOMATSU PC130-8`
- เปิดโหมดจัดกลุ่ม **"ตามยี่ห้อ/รุ่นอุปกรณ์"** (รวมเป็น 4 โหมด)
- แถวรถในขั้น 1 แสดงยี่ห้อใต้ชนิดรถ · ขั้น 3 เพิ่มตาราง **รถแยกตามยี่ห้อ** · หน้าพัสดุก็มีตารางเดียวกัน

**ยังค้างเพิ่ม**
- [ ] อะไหล่ยังผูกกับ **ชนิดรถ** (`appliesToTypes`) ไม่ได้ผูกกับ **ยี่ห้อ** ⇒ จัดกลุ่มตามยี่ห้อได้ แต่รายการอะไหล่ของยี่ห้อที่เป็นชนิดรถเดียวกันยังเหมือนกัน · ถ้าต้องแยกจริงต้องเพิ่ม `appliesToBrands`
- [ ] ยี่ห้อทั้ง 5 เป็นข้อมูลจำลอง ยังไม่ใช่ทะเบียนจริงของ กฟภ.

---

## รอบแก้ 8 ส.ค. 2569 — รอบ 3: แยก "ออกเลขงาน" ออกจาก stepper + หลายแผน

> เจ้าของงาน: *"เลขแผนที่ออกมาจะเป็นหัวข้อแผนบำรุงรักษาประจำปีนั้นๆ ของ กบค. และเรียกดูรายละเอียดเพื่อไปเฟสต่อไปได้ · เฟสต่อไปคือหยิบแผนที่สร้าง"* + *"กระบวนการออกเลขงานอยากให้เป็นเรื่องของการออกเลขงานอย่างเดียว ไม่ต้องเป็น stepper มารวมกับส่วนอื่น แยกออกไป"*

### โครงใหม่

```
plan-new.html   ออกเลขงาน (wizard 3 ขั้น · ไม่มี stepper)
      ↓ ได้ MT-2569-Q4-001
index.html      รายการแผน  →  เปิดแผน  →  stepper 5 เฟสปฏิบัติการ
supplies.html   รายการเอกสารแจ้งพัสดุ  →  เปิดเอกสาร  →  รับทราบ
```

| | เดิม | ใหม่ |
|---|---|---|
| stepper | **6 เฟส** รวมออกเลขงาน | **5 เฟส** เริ่มที่ เบิก/จัดหา |
| stepper เป็นของใคร | ทั้งระบบ (อันเดียว) | **ของแต่ละแผน** (`plan.phase`) |
| เก็บแผน | `plan.v1` **1 ก้อน** | **`plans.v1` = `{ plans:[] }`** |
| หน้าแรก | wizard เลย | **รายการแผน** |
| หน้าพัสดุ | เอกสารใบเดียว | **รายการเอกสาร** + เปิดรายใบ |

### ไฟล์

| ไฟล์ | สถานะ |
|---|---|
| `common.js` | 🆕 helper ร่วม (`$` `esc` `toast` `nowTh` `QUARTERS` `renderTimelineHtml` `quarterYearText` `planTitle`) |
| `plan-new.html` / `plan-new.js` | 🆕 ออกเลขงาน — ย้าย wizard 589 บรรทัดออกจาก `app.js` |
| `app.js` | เขียนใหม่ — รายการแผน + หน้าแผน + stepper 5 เฟส + procurement (เหลือ ~430 → ~720 บรรทัด) |
| `mock-yearly.js` | `loadPlans/savePlans/getPlan/savePlan(upsert)/newPlan/deletePlan/resetPlans` · `SCHEMA_VERSION` 5→6 |
| `supplies.js` | เขียนใหม่เป็นรายการเอกสาร + routing ด้วย hash |
| `admin.js` | หน้าเดโมสรุปเป็น "หลายแผน" + ปุ่มล้างแผนทั้งหมด |
| `index.html` `supplies.html` `admin.html` | เมนูซ้าย 5 อัน + โหลด `common.js` |

### เคาะแล้ว

- ✅ **หน่วยงานคือ กบค.** — ไม่มี "กบก." เป็นการพิมพ์ผิด **ไล่แก้ 113 จุด**ทั้งโค้ดและเอกสาร
- ✅ **1 ปีมีหลายแผนได้** — ออกแบบรองรับไว้ (เลขรัน NNN จึงมีความหมาย)
- ✅ **เลขงานคือหัวข้อของแผน** · ชื่อแผนเป็นคำอธิบายรอง
- ✅ ป้ายสถานะรถ `ไม่ใช้` → **`พร้อมเข้าแผน`** (ค่า `available` — ของเดิมอ่านแล้วเข้าใจผิด)

### ทดสอบแล้ว (headless Chrome)

seed 3 แผน (ออกเลข 2 · ร่าง 1) → รายการแผนแสดงครบพร้อมความคืบหน้า `เฟส 1/5` → เปิดแผนเห็น stepper 5 เฟส + procurement wizard → หน้าพัสดุเห็นรายการ 2 ใบ + badge `รอรับทราบ 2` → `plan-new.html` เปิด wizard ขั้น 1 ได้ (132 คัน 12 เขต)

### ยังค้าง

- [ ] เฟส 2–5 (ดำเนินการ · ตรวจรับ · รายงาน · ต้นทุน) ยังเป็นหน้าเปล่า
- [ ] แผนร่างยังลบไม่ได้จาก UI (`MYD.deletePlan()` มีแล้วแต่ยังไม่มีปุ่ม)
- [ ] `skeleton.html` ยังเป็นโครง 6 เฟสแบบเดิม — ควรอัปเดตให้ตรงโครงใหม่ (ออกเลขงานแยก + 5 เฟส)
- [ ] อะไหล่ยังผูกกับชนิดรถ ไม่ใช่ยี่ห้อ (`appliesToBrands`)

### รอบแก้ 8 ส.ค. 2569 — รอบ 4: seed แผนตั้งต้น · แถวสรุปรวม · จัดคอลัมน์ · skeleton

**1 · มีแผนประจำปีสร้างรออยู่แล้ว 1 ใบ**
`SEED_PLAN` ใน `mock-yearly.js` — **ค่าคงที่ทั้งหมด** (id `plan-seed-2569-001` · เลขงาน `MT-2569-Q1-001` · รถ 8 คัน เขต 1–2) เพื่อให้ลิงก์ `#<planId>` ใช้ได้ตลอด ไม่เปลี่ยนทุกครั้งที่โหลด
- โผล่เฉพาะตอนยังไม่เคยมีข้อมูลใน localStorage · `loadPlans()` คืนค่าโดย**ไม่เขียนกลับ** (แบบเดียวกับ `loadMaster()`)
- `resetPlans()` เขียน `[]` ลงไปจริง **ไม่ใช่ลบ key** ไม่งั้นแผนตั้งต้นจะกลับมาหลังกด "ล้างแผนทั้งหมด"
- เพิ่ม `reseedPlans()` ไว้เรียกแผนตั้งต้นกลับมา

**2 · แถวสรุปรวมท้ายทุกกลุ่ม** (`<tfoot class="sumrow">`)
หน่วยต่างกันบวกรวมกันไม่ได้ → helper `unitTotals()` **รวมแยกตามหน่วย** เช่น `36 ชุด · 48 เส้น · 432 ลิตร`
มีทั้งขั้น 2 (ทุกกลุ่มที่จัด) · ขั้น 3 (ภาค/ยี่ห้อ/อะไหล่) · หน้าฝ่ายพัสดุ

**3 · จัดคอลัมน์ 3 ตารางให้ตรงกัน**
ตาราง **ภาค** และ **ยี่ห้อ** เดิมเป็น 3 คอลัมน์อิสระ ไม่ตรงกับตารางอะไหล่ 6 คอลัมน์
→ ให้ทุกตารางใช้ `.itbl` (fixed layout) เหมือนกัน แล้วใช้ `colspan` จัดให้
**"จำนวนรถ" ของตารางภาค/ยี่ห้อ ตกตรงคอลัมน์ "รวม" ของตารางอะไหล่** และ "หน่วย" ตรงกันทั้งสามตาราง

**4 · `skeleton.html` sync กับโครงใหม่**
- การ์ดนำหน้า **"ก่อนเข้า stepper — ออกเลขงาน (แยกหน้า)"** ✅ ทำแล้ว พร้อมลิงก์ไป `plan-new.html`
- stepper เหลือ **5 เฟส** (เบิก/จัดหา → ดำเนินการ → ตรวจรับ → รายงาน → ต้นทุน)
- แต่ละเฟสติดป้าย **ทำแล้ว / ยังเป็นหน้าเปล่า**
- ตัดคำถามที่เคาะแล้วออก (กบค. · ไทรมาส · พัสดุอนุมัติ) เหลือ **17 ข้อ** จากเดิม 21
- แก้ข้อ 3.1 ให้สอดคล้อง: *"ปรับลดงานใครอนุมัติ — พัสดุเป็นแค่ผู้รับทราบแล้ว น่าจะเป็นผู้บังคับบัญชา กบค. ใช่ไหม"*

### รอบแก้ 8 ส.ค. 2569 — รอบ 5: แผนตัวอย่างที่ผ่านเฟส 1 แล้ว (ตัวตั้งต้นของเฟส 2)

เจ้าของงาน: *"อยากให้ทำตัวอย่างแผนที่ทำเสร็จแล้ว 1 แผน เพราะเวลาจะทำเฟส 2 ต้องใช้แผนที่สร้างเสร็จแล้ว"*

**ปัญหา** — `SEED_PLAN` เดิมออกเลขงานแล้วก็จริง แต่ยัง**ค้างที่เฟส 1** (`travelConfirmed` ยังเป็น false) ⇒ **เฟส 2 ล็อกอยู่** เข้าไปทำงานไม่ได้

**แก้** — เพิ่ม `SEED_PLAN_READY` (`plan-seed-2569-002` · `MT-2569-Q1-002`)

| | ค่า |
|---|---|
| รถ | **12 คัน** (เขต 3–4) |
| ฝ่ายพัสดุ | **รับทราบแล้ว** 3 ต.ค. 2568 |
| เบิกอะไหล่ | ✅ `partsRequisitioned: true` |
| แผนเดินทาง | ✅ ยืนยันแล้ว — จุดรวมงาน กฟฉ.เขต 3 → อ.ปากช่อง/อ.สีคิ้ว · 4–8 พ.ย. 2568 · เบี้ยเลี้ยง 12,000 + ที่พัก 9,000 + เดินทาง 6,500 = **27,500 บาท** |
| statusHistory | ครบ 3 รายการ (issued → notified → acknowledged) |
| ผล | **เฟส 2 ปลดล็อก** · เปิดแผนแล้วเห็นสรุปเฟส 1 + ปุ่ม "ไปเฟสถัดไป →" |

ค่าทั้งหมด**คงที่**เช่นเดียวกับ `SEED_PLAN` เพื่อให้ลิงก์ `#plan-seed-2569-002` ใช้ได้ตลอด

**เก็บงานเพิ่ม**
- `planProgressText()` — แผนที่ทำเฟสปัจจุบันเสร็จแล้วขึ้น `เฟส 1 ✓ พร้อมเฟส 2 · ดำเนินการบำรุงรักษา` แทน `เฟส 1/5`
- เพิ่ม `dateTh()` ใน `common.js` — `2568-11-04` → `4 พ.ย. 2568` (ค่าดิบจาก `<input type="date">` อ่านยาก)
- จำนวนเงินใส่ตัวคั่นหลักพัน `27,500 บาท`

**ตอนนี้เปิด prototype จะเจอ 2 แผน**
| เลขงาน | รถ | สถานะ |
|---|---|---|
| `MT-2569-Q1-001` | 8 | รอพัสดุรับทราบ · เฟส 1/5 (ยังไม่เริ่ม) |
| `MT-2569-Q1-002` | 12 | พัสดุรับทราบแล้ว · **เฟส 1 ✓ พร้อมเฟส 2** |

### 🐛 บั๊ก: `plan-new.html` สร้างแผนร่างเปล่าทุกครั้งที่เปิดหน้า (แก้ 8 ส.ค. 2569)

**อาการ** — เจ้าของงานเปิดหน้า "สร้างแผน" หลายครั้ง แล้วรายการแผนเต็มไปด้วย **`(แผนใหม่ ยังไม่ตั้งชื่อ)` 0 คัน 6 ใบ** และ**แผนตัวอย่างหายไป**

**สาเหตุ** — INIT ของ `plan-new.js` เขียนไว้ว่า
```js
PLAN = (id && MYD.getPlan(id)) || MYD.newPlan(nowTh());
if (!MYD.getPlan(PLAN.id)) MYD.savePlan(PLAN);   // "จองที่ให้แผนร่าง"
```
บันทึกลง localStorage **ทันทีที่เปิดหน้า** ทั้งที่ยังไม่ได้กรอกอะไร ⇒ เปิดกี่ครั้งได้ร่างเปล่าเท่านั้นใบ
และพอ key มีข้อมูลแล้ว `loadPlans()` ก็ไม่คืนแผนตัวอย่างอีก (ตามดีไซน์) ⇒ แผนตัวอย่างหาย

**แก้**
1. เพิ่ม `hasContent(plan)` + `persist(plan)` — **บันทึกก็ต่อเมื่อมีเนื้อแล้ว** (ตั้งชื่อ หรือเลือกรถ) · แทน `MYD.savePlan()` ทุกจุดในหน้านี้
2. **แผนตัวอย่างเหลือ 1 ใบ** ตามที่เจ้าของงานต้องการ = **แผนที่ทำเสร็จแล้ว** (`MT-2569-Q1-001` · 12 คัน · พัสดุรับทราบ · เฟส 1 ✓ · เฟส 2 ปลดล็อก) — ตัด `SEED_PLAN_READY` ที่ซ้ำซ้อนทิ้ง
3. ทางออกจากสภาพเละ — ปุ่ม **"คืนแผนตัวอย่าง (เดโม)"** ท้ายรายการ + ปุ่ม **"เริ่มเดโมใหม่"** บน topbar เปลี่ยนจาก *ล้างว่าง* เป็น **`reseedPlans()`** · Admin เพิ่มปุ่มเดียวกัน
4. เพิ่ม **ปุ่มลบแผนร่าง** 🗑 ในรายการ (มี `MYD.deletePlan()` อยู่แล้วแต่ไม่มี UI)

**บทเรียน** — อย่าเขียน record ลง storage ตั้งแต่เปิดหน้า ให้เขียนเมื่อผู้ใช้ใส่ข้อมูลจริงแล้วเท่านั้น

---

## Skeleton แบบ "แก้โครงได้" สำหรับเก็บ requirement (8 ส.ค. 2569)

เจ้าของงานถาม: *"ถ้าอยากทำ skeleton ขึ้นโครง แล้วเพิ่มเนื้อหาในแต่ละส่วนได้ เช่น หัวข้อ ทะเบียน/ประเภท/สถานะ อยากเพิ่ม ลด แก้ไข ได้หรือเปล่า"* → **เคาะแนวทาง B+**

### 3 แนวทางที่เสนอ

| | แนวทาง | ดี | เสีย |
|---|---|---|---|
| A | โหมดแก้โครงบนหน้าจริง | เห็นผลบนข้อมูลจริง | ต้องรื้อทุกตาราง · เสี่ยงของจริงพัง · **ใส่ฟิลด์ที่ยังไม่มีข้อมูลไม่ได้** |
| **B+** | **skeleton แก้ได้ + ดึงข้อมูลจริงมาโชว์** ⭐ | ปลอดภัย · **ใส่ฟิลด์ที่ยังไม่มีได้** · export เป็นเอกสาร | มี 2 แหล่งความจริง ต้องมีกติกา |
| C | โน้ตแปะบนหน้าจริง | ทำเร็วสุด | ไม่เห็นว่าแก้แล้วหน้าตาเป็นยังไง |

**เหตุผลที่เลือก B+** — ฟิลด์ที่**ยังไม่มีข้อมูล**คือสิ่งที่มีค่าที่สุดตอนเก็บ req เพราะนั่นแหละคือ requirement ใหม่ · แนวทาง A ทำข้อนี้ไม่ได้

**กติกากัน 2 แหล่งความจริงตีกัน** — *skeleton = สิ่งที่ตกลงไว้ (สัญญา)* · *หน้าจริง = สิ่งที่ทำแล้ว (สถานะ)* · ทุกฟิลด์มีธง `done` และมีตัวนับ **"ยังไม่ทำในหน้าจริง N"** ให้เห็นช่องว่างทันที

### `plan-skeleton.html` + `plan-skeleton.js` (ใหม่)

ครอบ **4 หน้าจอของฝั่งออกเลขงาน** — ขั้น 1 เลือกรถ · ขั้น 2 รายการอะไหล่ · ขั้น 3 สรุปทั้งปี · หน้าฝ่ายพัสดุ
รวม **41 ฟิลด์** ใน 9 หัวข้อ (= สิ่งที่หน้าจริงมีตอนนี้)

**ทำอะไรได้**
- แก้ชื่อฟิลด์/หัวข้อ · ติ๊ก **แสดง/ซ่อน** · **⬆⬇ เลื่อนลำดับ** · **➕ เพิ่ม / 🗑 ลบ** ฟิลด์และหัวข้อ
- เลือก **"ข้อมูลจากไหน"** จาก 22 แหล่งที่มีจริง (รถ · แผน · อะไหล่) — เลือก *"ยังไม่มีข้อมูลในระบบ"* ได้ ⇒ ขึ้นป้าย **`รอข้อมูล`**
- ช่อง **โน้ต** ต่อฟิลด์ — จดคำเจ้าของงานตรงนั้น
- **พรีวิว** ใต้ทุกหัวข้อ — เรนเดอร์เฉพาะฟิลด์ที่เปิด พร้อม**ข้อมูลจริงจากแผน `MT-2569-Q1-001`**
- **Export Markdown** → ตารางพร้อมแปะ `plan.md` เป็นข้อสรุปที่ตกลงกัน
- โหมด **ดูอย่างเดียว** สำหรับตอนพรีเซนต์ · **คืนโครงตั้งต้น**

เก็บใน localStorage **คนละ key** (`maintaind.yearly.skeleton.v1`) — แก้เท่าไหร่ก็ไม่กระทบ `plan-new.html`

### ยังค้าง

- [x] ~~ทำ skeleton แบบเดียวกันให้ **5 เฟสปฏิบัติการ**~~ — **เสร็จแล้ว 9 ส.ค.** (ดูหัวข้อถัดไป)
- [ ] ยังไม่มีปุ่ม **"ยกโครงจาก skeleton ไปหน้าจริง"** — ตอนนี้พอตกลงแล้วต้องมาแก้โค้ดหน้าจริงเอง
- [ ] `done` ยังตั้งมือใน `DEFAULT_SKEL` — ถ้าอยากให้แม่นต้อง sync กับหน้าจริงอัตโนมัติ

## รอบแก้ 9 ส.ค. 2569 — skeleton ครอบทั้งโฟลว์ 11 หน้าจอ + ขั้นยืนยันรถ

สเปก: [`../docs/superpowers/specs/2026-08-09-skeleton-5-phases-design.md`](../docs/superpowers/specs/2026-08-09-skeleton-5-phases-design.md)

**ยุบ `skeleton.html` ทิ้ง** — เนื้อที่เก็บไว้คือคำถามที่ยังไม่เคาะ ย้ายเข้า `plan-skeleton.html` · คำอธิบายเฟส (ใครทำ/ลำดับขั้น) **ตัดทิ้ง** เพราะ flow มีเจ้าของอยู่แล้วที่ `Diagram/`

| ไฟล์ | สถานะ |
|---|---|
| `skeleton-data.js` | 🆕 โครงตั้งต้น 11 หน้าจอ · `SAMPLE` 31 แหล่ง · คำถาม 21 ข้อ |
| `plan-skeleton.js` | เขียนใหม่ — เหลือแค่ render/แก้/migration/export · เพิ่มแถบนำทาง 3 กลุ่ม + การ์ดคำถาม |
| `plan-skeleton.html` | ตัดกล่อง "ใช้ยังไง" · โหลด `skeleton-data.js` |
| `skeleton.html` | **ลบ** — ไล่แก้เมนูซ้าย 5 หน้า (เดิมไม่มีหน้าไหนลิงก์มา `plan-skeleton` เลย เพิ่มให้ครบแล้ว) |
| `test/skeleton-data.test.js` | 🆕 เทสโครงข้อมูล 27 ข้อ |

**หน้าจอ 11 จอ / 3 กลุ่ม** — ออกเลขงาน 3 · เฟส 6 (เฟส 1 แตกเป็น `1a ยืนยันรถ` + `1b เบิก/จัดหา+แผนเดินทาง`) · หน่วยงานอื่น 2
⚠️ แตกเฉพาะใน skeleton — `PHASES` ใน `app.js` ยังเป็น **5 เฟส** ไม่แตะ

**ขั้นใหม่ "ยืนยันรถเข้าร่วมแผน"** ต้นเฟส 1 ก่อนทำแผนเดินทาง — ต้นทาง (เจ้าของรถ + กรย. คนละหน้าที่) กดตอบ → ผลมาโผล่ที่ กบค. · คันที่ไม่พร้อม **ค้างไว้ให้ กบค. ตัดสิน** ไม่ตัดอัตโนมัติ
เหตุผลที่อยู่ก่อนแผนเดินทาง — ต้องรู้ก่อนว่ารถคันไหนเข้าได้จริง ถึงวางวัน/จุดนัด/คำนวณเบี้ยเลี้ยงได้ถูก

**เทส** — node 27/27 · headless Chromium 36/36 · mermaid 7/7

### ยังค้างหลังรอบนี้

- [ ] **หน้าจริงของยืนยันรถ** ยังไม่ได้ทำ — ต้องเคาะ 4 ข้อก่อน (อยู่ในจอ `1a` ของ skeleton แล้ว)
- [ ] เฟส 2–5 ยังเป็นหน้าเปล่าเหมือนเดิม — แต่ตอนนี้มีโครงฟิลด์ให้เอาไปคุยแล้ว
- [ ] ปุ่ม "ยกโครงไปหน้าจริง" · auto-sync ธง `done`
