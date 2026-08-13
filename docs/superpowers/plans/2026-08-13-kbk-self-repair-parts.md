# หน้าเบิกอะไหล่ (เส้น กบค. ซ่อมเอง) — เลย์เอาต์ 2 คอลัมน์ + stepper 6 ขั้น

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยนขั้น "จัดอะไหล่" จากตารางจัดกลุ่มตามแหล่งของ เป็นเลย์เอาต์ 2 คอลัมน์ (คลังอะไหล่ ↔ รายการที่เลือก) ตาม `design-mock/kbk-self-repair-parts.html` พร้อมเปลี่ยน stepper ของเส้นซ่อมเองเป็น 6 ขั้น

**Architecture:** ไฟล์เดียว `mock/Maintenance-Request-Form.html` (static HTML + inline JS ไม่มี build step) · `partsEditorHTML()` ถูกเขียนใหม่ทั้งฟังก์ชันโดยใช้คลาสจาก design system ล้วน · ตรรกะแหล่งของเปลี่ยนจาก "เลือกแหล่งเดียวต่อรายการ" เป็น "รวมยอด 2 คลัง ส่วนเกิน = จัดซื้อ" · `KSTEPS` 4 ขั้นยังใช้กับเส้นส่งอู่/หน้างาน ส่วนเส้นซ่อมเองใช้ `SELF_STEPS` 6 ขั้นชุดใหม่ · เทสด้วยการขับ Chromium จริงตามแบบ `maintainance-yearly/test/verify-*.js`

**Tech Stack:** HTML/CSS/JS ล้วน · `localStorage` เก็บ state · `playwright-core` + Chrome ที่ติดเครื่อง สำหรับเทส · `python3 -m http.server` เสิร์ฟ

**สเปกต้นทาง:** `docs/superpowers/specs/2026-08-13-kbk-self-repair-parts-design.md`

## Global Constraints

- 🔴 **ต้องอ่านก่อนแตะ HTML/CSS:** `design-system/README.md` (หัวข้อ 0 + ตารางหัวข้อ 4 คอลัมน์ "ใช้เมื่อ") · `design-system/components.css` · `design-system/SOURCES.md` — ลำดับคือ **อ่าน → เช็คว่าไลบรารีมีของนี้ไหม → ยกค่าจากไลบรารี → ค่อยเขียนโค้ด**
- ห้ามนิยาม component ใน `<style>` ของหน้า · ของใหม่ให้เพิ่มใน `components.css` แล้วบั๊ม `?v=` ทุกหน้าที่ลิงก์ + อัปเดตตารางหัวข้อ 4 และ Changelog หัวข้อ 8 ของ `design-system/README.md`
- สีใช้ `var(--…)` เท่านั้น ห้าม hardcode hex ในไฟล์ `.html`
- ไอคอนใช้ `<span class="ms">ชื่อ</span>` (Material Symbols) ห้าม emoji ห้าม inline `<svg>`
- ปุ่มใช้ `.btn` + `.btn-p`/`.btn-s`/`.btn-g`/`.btn-o`
- light mode เท่านั้น ห้าม `prefers-color-scheme:dark` รายหน้า
- วางคอมโพเนนต์ต่อกันแนวตั้ง → ห่อด้วย `.stack` เสมอ
- 🔴 **แก้ flow → อัปเดตผัง mermaid ใน `Diagram/` คอมมิตเดียวกัน** (Task 6)
- 🔴 **push เสร็จ → อัปเดต `plan.md` ทันที** (Task 6)
- ห้ามใช้ `file://` — ต้องเสิร์ฟผ่าน `python3 -m http.server 8123 --bind 127.0.0.1`

## เลขบรรทัดอ้างอิง (ณ คอมมิต `b5a52ba`)

| ของ | บรรทัด |
|---|---|
| `KSTEPS` · `stepOf()` | 4374 · 4381 |
| `kbkActionHTML()` | 4401 |
| `renderKbkDetail()` | 4532 |
| `invCell()` | 4643 |
| `partsRowsHTML()` | 4652 |
| `partsEditorHTML()` | 4705 |
| `addListHTML()` · `renderAddList()` | 4764 · 4792 |
| `partsSummaryHTML()` | 4797 |
| `kbkPartsConfirm()` | 4851 |
| `.ops-detail-layout` (page CSS) | 1577 |
| `KBK_STEPS` | 2566 |
| `inspFormHTML()` · `costFieldsHTML()` | 4281 · 5002 |

---

## File Structure

| ไฟล์ | หน้าที่ | การเปลี่ยนแปลง |
|---|---|---|
| `mock/Maintenance-Request-Form.html` | ต้นแบบทั้งหมด | ตรรกะแหล่งของ · `partsEditorHTML` ใหม่ · `SELF_STEPS` · เรียง state ใหม่ · CSS เลย์เอาต์เต็มความกว้าง |
| `mock/test/verify-parts.js` | เทสขับเบราว์เซอร์ (สร้างใหม่) | ยืนยัน 2 คอลัมน์ · ยอดเบิก/จัดซื้อ · stepper 6 ขั้น |
| `Diagram/02-แจ้งซ่อม-กบค/01-flow-กบค-6ช่วง.md` | ผังภาพรวม | ลำดับขั้นใหม่ของเส้นซ่อมเอง |
| `Diagram/02-แจ้งซ่อม-กบค/03-กบค-รับงาน-นัดรับ-ตรวจสภาพ.md` | ผังรายละเอียด | นัดหมายย้ายมาก่อนซ่อม |
| `plan.md` | บันทึกงานสะสม | ปิดรายการค้าง |

**โครงข้อมูลที่ใช้ (มีอยู่แล้ว ไม่ต้องสร้าง)**
- `PARTS[]` จาก `config.js` — `{sym, fit, code, name, need, unit, stock, stockAlt, wh, icon, price}` · `fit:'all'` = ของกลาง · `fit:['SK17A']` = ตรงรุ่น
- `j.parts[]` — `{code, name, unit, qty, price, src}` · `src:'req'` = ผู้แจ้งเลือกมา · `src:'kbk'` = กบค. เพิ่ม
- `E` = state ชั่วคราวของหน้า (`E.q` คำค้น · `E.equip` รุ่นอุปกรณ์)

---

## Task 1: ตรรกะแหล่งของใหม่ + ปรับ `partsRowsHTML` เป็นตัวอ่านอย่างเดียว

**Files:**
- Modify: `mock/Maintenance-Request-Form.html:4643-4703` (`invCell` → ลบ · `partsRowsHTML` → เขียนใหม่)
- Test: `mock/test/verify-parts.js` (สร้างใหม่)

**Interfaces:**
- Produces: `partsSplit(x) -> { onHand, fromStock, toBuy, unit, leadDays }` — `x` คือรายการใน `j.parts` · `leadDays` = `30` เมื่อคลังว่างทั้งคู่ · `'7–14'` เมื่อมีแต่ไม่พอ · `null` เมื่อไม่ต้องจัดซื้อ
- Produces: `partsCost(list) -> { stockCost, buyCost, total }`

- [ ] **Step 1: เขียนเทสที่ยังไม่ผ่าน**

สร้าง `mock/test/verify-parts.js`:

```js
#!/usr/bin/env node
/* ขับ Chromium จริง ยืนยันหน้าเบิกอะไหล่ — ต้องมี :8123 รันอยู่
   รัน: NODE_PATH=<ที่ npm i playwright-core ไว้>/node_modules node mock/test/verify-parts.js */
const { chromium } = require('playwright-core');
const CHROME = '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const URL = 'http://127.0.0.1:8123/mock/Maintenance-Request-Form.html';

let bad = 0;
const ok = m => console.log('  ok   ' + m);
const fail = m => { console.log('  FAIL ' + m); bad++; };
const eq = (got, want, m) => got === want ? ok(m) : fail(m + ' (ได้ ' + JSON.stringify(got) + ' คาด ' + JSON.stringify(want) + ')');

(async () => {
  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));

  await page.goto(URL, { waitUntil: 'networkidle' });

  /* ---- ตรรกะแหล่งของ: รวม 2 คลัง ส่วนเกิน = จัดซื้อ ---- */
  const split = await page.evaluate(() => {
    // SL-4402 stock 6 + alt 4 = 10 · PM-2210 stock 0 + alt 0 = 0
    const a = partsSplit({ code: 'SL-4402', qty: 3, unit: 'ชุด' });
    const b = partsSplit({ code: 'PM-2210', qty: 1, unit: 'ตัว' });
    const c = partsSplit({ code: 'FT-2205', qty: 5, unit: 'ตัว' });   // stock 3 + alt 0 = 3
    return { a, b, c };
  });
  eq(split.a.fromStock, 3, 'SL-4402 ×3 เบิกได้ครบ');
  eq(split.a.toBuy, 0, 'SL-4402 ไม่ต้องจัดซื้อ');
  eq(split.a.leadDays, null, 'SL-4402 ไม่มีเวลารอ');
  eq(split.b.fromStock, 0, 'PM-2210 เบิกไม่ได้เลย');
  eq(split.b.toBuy, 1, 'PM-2210 ต้องจัดซื้อ 1');
  eq(split.b.leadDays, 30, 'PM-2210 รอ 30 วัน (คลังว่างทั้งคู่)');
  eq(split.c.fromStock, 3, 'FT-2205 เบิกได้ 3');
  eq(split.c.toBuy, 2, 'FT-2205 จัดซื้อ 2');
  eq(split.c.leadDays, '7–14', 'FT-2205 รอ 7–14 วัน (มีแต่ไม่พอ)');

  const cost = await page.evaluate(() => partsCost([
    { code: 'SL-4402', qty: 3, price: 1850, unit: 'ชุด' },
    { code: 'PM-2210', qty: 1, price: 18500, unit: 'ตัว' }
  ]));
  eq(cost.stockCost, 5550, 'ค่าของที่เบิกได้ = 3×1850');
  eq(cost.buyCost, 18500, 'ค่าของที่ต้องจัดซื้อ = 1×18500');
  eq(cost.total, 24050, 'รวมทั้งหมด');

  errs.length === 0 ? ok('ไม่มี pageerror') : fail('pageerror: ' + errs.join(' | '));
  await browser.close();
  console.log(bad ? '\nไม่ผ่าน ' + bad + ' ข้อ' : '\nผ่านทุกข้อ');
  process.exitCode = bad ? 1 : 0;
})();
```

- [ ] **Step 2: รันเทสให้เห็นว่าไม่ผ่าน**

```bash
python3 -m http.server 8123 --bind 127.0.0.1 &
NODE_PATH=<ที่ npm i playwright-core ไว้>/node_modules node mock/test/verify-parts.js
```

คาดว่า: `pageerror` หรือ `partsSplit is not defined`

- [ ] **Step 3: เขียน `partsSplit` + `partsCost` แล้วลบของเดิม**

ใน `mock/Maintenance-Request-Form.html` **ลบ** บล็อก `const SRC = {…}` · `function partSource(x){…}` · `function invCell(x){…}` (บรรทัด ~4630-4651) แล้วใส่แทน:

```js
// ---- แหล่งอะไหล่: Smart Inventory + คลังสำรอง เบิกได้เหมือนกัน (ต่างแค่ที่เก็บ) ----
// ยอดที่เกินสองคลังรวมกัน = ต้องจัดซื้อ · 1 รายการแตกเป็น "เบิก x + ซื้อ y" ได้
function partsSplit(x){
  const p = PARTS.find(q => q.code === x.code);
  if(!p) return { onHand:0, fromStock:0, toBuy:x.qty, unit:x.unit, leadDays:30 };
  const onHand = (p.stock||0) + (p.stockAlt||0);
  const fromStock = Math.min(x.qty, onHand);
  const toBuy = Math.max(0, x.qty - onHand);
  return { onHand, fromStock, toBuy, unit: p.unit || x.unit,
    leadDays: toBuy ? (onHand === 0 ? 30 : '7–14') : null };
}
function partsCost(list){
  let stockCost = 0, buyCost = 0;
  list.forEach(x => {
    const s = partsSplit(x);
    stockCost += s.fromStock * (x.price||0);
    buyCost   += s.toBuy     * (x.price||0);
  });
  return { stockCost, buyCost, total: stockCost + buyCost };
}
// ป้ายบอกที่มาของของในคลัง — ใช้ทั้งคอลัมน์ซ้ายและสรุปหลังยืนยัน
function stockBadge(p){
  if(p.stock > 0)  return { cls:'b-ok',  text:'Smart Inventory ' + baht(p.stock) + ' ' + p.unit };
  if(p.stockAlt)   return { cls:'b-low', text:'คลังสำรอง ' + baht(p.stockAlt) + ' ' + p.unit };
  return { cls:'b-out', text:'ไม่มีในคลัง — ต้องสั่งซื้อภายนอก' };
}
```

- [ ] **Step 4: เขียน `partsRowsHTML` ใหม่เป็นตัวอ่านอย่างเดียว**

`partsRowsHTML` เดิมรับ `(no, list, editable)` และถูกเรียก 2 ที่ — `partsEditorHTML` (จะไม่ใช้แล้ว) กับ `partsSummaryHTML` (ยังใช้) ⇒ ตัดพารามิเตอร์ `no`/`editable` ทิ้ง แทนที่ทั้งฟังก์ชัน (บรรทัด 4652-4703) ด้วย:

```js
// ตารางสรุปหลังยืนยันรายการแล้ว — อ่านอย่างเดียว ไม่มีปุ่มแก้
// ใช้ partsSplit ชุดเดียวกับหน้าเบิก ไม่งั้นยอดหลังยืนยันจะไม่ตรงกับตอนกดยืนยัน
function partsRowsHTML(list){
  if(!list.length) return '<div class="hint" style="margin:0">ยังไม่มีรายการอะไหล่</div>';
  const c = partsCost(list);
  return `<div class="scrollx" style="overflow-x:auto"><table class="tbl ptab">
    <thead><tr><th>อะไหล่</th><th>ที่มา</th><th style="text-align:center">จำนวน</th>
      <th style="text-align:right">ราคา/หน่วย</th><th style="text-align:right">รวม</th></tr></thead>
    <tbody>${list.map(x=>{
      const s = partsSplit(x);
      return `<tr>
        <td><b>${esc(x.name)}</b>
          <div class="pmeta">${esc(x.code)} · ${esc(x.unit)}
            ${x.src==='req'?'<span class="ptag req">ผู้แจ้งเลือกมา</span>':'<span class="ptag add">กบค. เพิ่ม</span>'}</div></td>
        <td>เบิกจากคลัง ${baht(s.fromStock)} ${esc(s.unit)}${s.toBuy?`<div class="invsub">จัดซื้อ ${baht(s.toBuy)} ${esc(s.unit)} · รอ ${s.leadDays} วันทำการ</div>`:''}</td>
        <td style="text-align:center">${x.qty}</td>
        <td style="text-align:right">${x.price?baht(x.price):'<span style="color:var(--gray-400)">—</span>'}</td>
        <td style="text-align:right"><b>${baht((x.price||0)*x.qty)}</b></td></tr>`;
    }).join('')}</tbody>
    <tfoot><tr><td colspan="4" style="text-align:right">เบิกจากคลัง ${baht(c.stockCost)} · ต้องจัดซื้อ ${baht(c.buyCost)} · รวมค่าอะไหล่ทั้งหมด</td>
      <td style="text-align:right"><b>${baht(c.total)} บาท</b></td></tr></tfoot>
  </table></div>`;
}
```

แล้วแก้ผู้เรียกใน `partsSummaryHTML` (บรรทัด ~4797) จาก `partsRowsHTML(j.no, j.parts, false)` เป็น `partsRowsHTML(j.parts)`

- [ ] **Step 5: รันเทสให้ผ่าน**

```bash
NODE_PATH=<…>/node_modules node mock/test/verify-parts.js
```

คาดว่า: `ผ่านทุกข้อ` (13 ข้อ)

- [ ] **Step 6: commit**

```bash
git add mock/Maintenance-Request-Form.html mock/test/verify-parts.js
git commit -m "feat(kbk): ตรรกะอะไหล่ใหม่ — รวม 2 คลัง ส่วนเกินเป็นจัดซื้อ"
```

---

## Task 2: หน้าจอเบิกอะไหล่ 2 คอลัมน์

**Files:**
- Modify: `mock/Maintenance-Request-Form.html:4705-4736` (`partsEditorHTML` — เขียนใหม่ทั้งฟังก์ชัน)
- Modify: `mock/Maintenance-Request-Form.html:4764-4795` (ลบ `addListHTML` · `renderAddList`)
- Test: `mock/test/verify-parts.js` (เพิ่มเคส)

**Interfaces:**
- Consumes: `partsSplit()` · `partsCost()` · `stockBadge()` จาก Task 1
- Produces: `renderStockCol(no)` — วาดคอลัมน์ซ้ายใหม่โดยไม่ re-render ทั้งหน้า (กัน focus ช่องค้นหาหลุด)
- Produces: `kbkPartBump(no, code, delta)` — เพิ่ม/ลดจำนวน · ลดถึง 0 = เอาออกจากรายการ

- [ ] **Step 1: เขียนเทสที่ยังไม่ผ่าน**

เพิ่มใน `mock/test/verify-parts.js` ก่อนบรรทัด `errs.length === 0 ?`:

```js
  /* ---- เข้าหน้าเบิกอะไหล่ของใบที่เลือก "ซ่อมเอง" แล้ว ---- */
  await page.goto(URL + '#kbk/MTD-690719-051/parts', { waitUntil: 'networkidle' });
  await page.waitForSelector('.ops-detail-main .fgrid', { timeout: 5000 });

  const cols = await page.$$eval('.ops-detail-main .fgrid > .f .sect',
    els => els.map(e => e.textContent.trim()));
  eq(cols[0], 'คลังอะไหล่', 'คอลัมน์ซ้ายคือคลังอะไหล่');
  eq(cols[1], 'รายการอะไหล่ที่ต้องการใช้งาน', 'คอลัมน์ขวาคือรายการที่เลือก');

  /* ค้นหาแล้วลิสต์ซ้ายต้องกรอง และ focus ต้องไม่หลุด */
  await page.fill('#pq', 'ไฮดรอลิก');
  await page.waitForTimeout(150);
  const focused = await page.evaluate(() => document.activeElement && document.activeElement.id);
  eq(focused, 'pq', 'พิมพ์ค้นหาแล้ว focus ไม่หลุด');
  const names = await page.$$eval('#stockcol .job .no', els => els.map(e => e.textContent));
  names.every(n => n.includes('ไฮดรอลิก')) && names.length > 0
    ? ok('ลิสต์ซ้ายกรองตามคำค้น ' + names.length + ' รายการ')
    : fail('ลิสต์ซ้ายกรองไม่ถูก: ' + JSON.stringify(names));

  /* กด + แล้วรายการขวาต้องเพิ่ม และยอดรวมต้องขยับ */
  await page.fill('#pq', '');
  await page.waitForTimeout(150);
  const before = await page.$$eval('#pickedcol .job', els => els.length);
  await page.click('#stockcol .job [data-add="PM-2210"]');
  await page.waitForTimeout(150);
  const after = await page.$$eval('#pickedcol .job', els => els.length);
  eq(after, before + 1, 'กด + แล้วรายการขวาเพิ่ม 1');
  const buyText = await page.textContent('#sum-buy');
  buyText.includes('18,500') ? ok('ยอด "ต้องจัดซื้อ" ขยับเป็น 18,500') : fail('ยอดจัดซื้อ = ' + buyText);

  /* ลดจนถึง 0 = เอาออกจากรายการ */
  await page.click('#pickedcol [data-dec="PM-2210"]');
  await page.waitForTimeout(150);
  const after2 = await page.$$eval('#pickedcol .job', els => els.length);
  eq(after2, before, 'ลดถึง 0 แล้วหลุดจากรายการ');

  /* ปุ่มที่ต้องไม่มีแล้ว */
  const gone = await page.evaluate(() => ({
    worth: !!document.querySelector('.ops-detail-main [onclick*="openWorth"]'),
    todo: !!document.querySelector('.ops-detail-main .todo')
  }));
  eq(gone.worth, false, 'ไม่มีปุ่มประเมินความคุ้มค่าแล้ว');
  eq(gone.todo, false, 'ไม่มีกล่อง TODO แล้ว');
```

- [ ] **Step 2: รันเทสให้เห็นว่าไม่ผ่าน**

```bash
NODE_PATH=<…>/node_modules node mock/test/verify-parts.js
```

คาดว่า: timeout ที่ `.ops-detail-main .fgrid` (ยังเป็นตารางเดิม)

- [ ] **Step 3: เขียน `partsEditorHTML` ใหม่**

แทนที่ `partsEditorHTML` ทั้งฟังก์ชัน (บรรทัด 4705-4736) ด้วย:

```js
function partsEditorHTML(no, j){
  const list = initJobParts(j);
  const eq = equipOfJob(j);
  if(E.equip === undefined) E.equip = eq ? eq.key : 'all';   // ตั้งต้นตามรุ่นอุปกรณ์ของรถคันนี้
  return `<div class="fgrid" style="margin-top:20px">
    <div class="f sp2"><div class="card"><div class="stack">
      <div class="sect">คลังอะไหล่</div>
      <div class="sub">Smart Inventory และคลังสำรองเบิกได้เหมือนกัน — ไม่มีทั้งคู่ = ต้องสั่งซื้อภายนอก</div>
      <div class="f"><label>ยี่ห้อ/รุ่นอุปกรณ์</label>
        <select id="eqsel" onchange="E.equip=this.value;renderStockCol('${no}')">
          ${EQUIPS.map(e=>`<option value="${e.key}" ${E.equip===e.key?'selected':''}>${esc(e.label)}${eq&&eq.key===e.key?' — ของรถคันนี้':''}</option>`).join('')}
          <option value="all" ${E.equip==='all'?'selected':''}>ทุกยี่ห้อ (ทั้งคลัง)</option>
        </select></div>
      <div class="search"><span class="ms">search</span>
        <input type="text" id="pq" placeholder="ค้นหาชื่อหรือรหัสอะไหล่" value="${esc(E.q||'')}"
          oninput="E.q=this.value;renderStockCol('${no}')"></div>
      <div id="stockcol">${stockColHTML(no, j)}</div>
    </div></div></div>

    <div class="f sp2"><div class="card"><div class="stack">
      <div class="sect">รายการอะไหล่ที่ต้องการใช้งาน</div>
      <div class="sub">จำนวนที่เกินยอดในคลัง จะถูกตั้งเป็นรายการจัดซื้อให้อัตโนมัติ</div>
      <div id="pickedcol">${pickedColHTML(no, list)}</div>
    </div></div></div>
  </div>
  <div class="actions">
    <button class="btn btn-g" onclick="backToQueue()"><span class="ms">arrow_back</span> ย้อนกลับ</button>
    <button class="btn btn-p" onclick="kbkPartsConfirm('${no}')">ยืนยันรายการเบิก</button>
  </div>`;
}

// คอลัมน์ซ้าย — กรองด้วย (รุ่นอุปกรณ์ × คำค้น) · ของที่อยู่ในรายการแล้วยังโชว์ กด + เพิ่มจำนวนได้
// (ต่างจากของเดิมที่ซ่อน — สองคอลัมน์เห็นพร้อมกันอยู่แล้ว การหายไปทำให้สับสน)
function stockColHTML(no, j){
  const inList = new Set((j.parts||[]).map(x=>x.code));
  const q = (E.q||'').trim().toLowerCase();
  const rows = partsFitting(E.equip||'all')
    .filter(p => !q || (p.name + ' ' + p.code).toLowerCase().includes(q))
    .sort((a,b)=>(Array.isArray(b.fit)?1:0)-(Array.isArray(a.fit)?1:0));   // ของตรงรุ่นขึ้นก่อน
  if(!rows.length) return `<div class="empty">${q?'ไม่พบอะไหล่ที่ค้นหา':'ไม่มีอะไหล่ของรุ่นนี้ในคลัง'}</div>`;
  return rows.map(p=>{
    const b = stockBadge(p);
    return `<div class="job">
      <div class="sp">
        <div class="no">${esc(p.name)}</div>
        <div class="meta">${esc(p.code)} · ${baht(p.price)} บาท/${esc(p.unit)}</div>
        <span class="badge ${b.cls}">${esc(b.text)}</span>
        ${Array.isArray(p.fit)?'<span class="ptag fit">ตรงรุ่น</span>':'<span class="ptag gen">ของกลาง</span>'}
        ${inList.has(p.code)?'<span class="ptag add">อยู่ในรายการแล้ว</span>':''}
      </div>
      <button class="btn btn-s btn-sm" data-add="${esc(p.code)}" title="เพิ่มเข้ารายการ"
        onclick="kbkPartBump('${no}','${p.code}',1)"><span class="ms">add</span></button>
    </div>`;
  }).join('');
}

// คอลัมน์ขวา — รายการที่เลือก + ยอดแยกเบิก/จัดซื้อ
function pickedColHTML(no, list){
  const c = partsCost(list);
  const rows = list.length ? list.map(x=>{
    const s = partsSplit(x);
    return `<div class="job">
      <div class="sp">
        <div class="no">${esc(x.name)}</div>
        <div class="meta">${esc(x.code)} · ${baht(x.price)} บาท/${esc(x.unit)}
          ${x.src==='req'?'<span class="ptag req">ผู้แจ้งเลือกมา</span>':'<span class="ptag add">กบค. เพิ่ม</span>'}</div>
        <div class="meta">เบิกจากคลัง ${baht(s.fromStock)} ${esc(s.unit)}${s.toBuy?` · จัดซื้อ ${baht(s.toBuy)} ${esc(s.unit)}`:''}</div>
        ${s.toBuy?`<span class="badge b-low">อะไหล่ที่จัดซื้อใช้เวลา ${s.leadDays} วันทำการ</span>`:''}
      </div>
      <span class="qty">
        <button data-dec="${esc(x.code)}" aria-label="ลดจำนวน" onclick="kbkPartBump('${no}','${x.code}',-1)">−</button>
        <span>${x.qty}</span>
        <button data-inc="${esc(x.code)}" aria-label="เพิ่มจำนวน" onclick="kbkPartBump('${no}','${x.code}',1)">+</button>
      </span>
    </div>`;
  }).join('') : '<div class="empty">ยังไม่ได้เลือกอะไหล่ — เลือกจากคลังอะไหล่ทางซ้าย</div>';

  return rows + `<div class="sect">รวมค่าอะไหล่</div>
    <div class="fgrid">
      <div class="f sp2"><label>เบิกจากคลัง</label><div id="sum-stock">${baht(c.stockCost)} บาท</div></div>
      <div class="f sp2"><label>ต้องจัดซื้อ</label><div id="sum-buy">${baht(c.buyCost)} บาท</div></div>
      <div class="f sp4"><label>รวมทั้งหมด</label><div><b id="sum-all">${baht(c.total)} บาท</b></div></div>
    </div>`;
}

// วาดเฉพาะคอลัมน์ที่เปลี่ยน ไม่ re-render ทั้งหน้า — ไม่งั้นพิมพ์ค้นหาแล้ว focus หลุด
function renderStockCol(no){
  const j = JOBS.find(x=>x.no===no), box = $('stockcol');
  if(box) box.innerHTML = stockColHTML(no, j);
}
function renderPartsCols(no){
  const j = JOBS.find(x=>x.no===no);
  const s = $('stockcol'), p = $('pickedcol');
  if(s) s.innerHTML = stockColHTML(no, j);
  if(p) p.innerHTML = pickedColHTML(no, j.parts||[]);
}
function kbkPartBump(no, code, d){
  const j = JOBS.find(x=>x.no===no);
  const it = (j.parts||[]).find(x=>x.code===code);
  if(!it){
    if(d < 0) return;
    const p = PARTS.find(q=>q.code===code); if(!p) return;
    j.parts.push({ code:p.code, name:p.name, unit:p.unit, qty:1, price:p.price||0, src:'kbk' });
    toast('เพิ่ม ' + p.name + ' แล้ว');
  } else {
    it.qty += d;
    if(it.qty <= 0){ j.parts = j.parts.filter(x=>x.code!==code); toast('เอา ' + it.name + ' ออกจากรายการแล้ว'); }
  }
  renderPartsCols(no);
}
```

- [ ] **Step 4: ลบโค้ดที่เลิกใช้แล้ว**

ลบทั้งฟังก์ชัน (อย่าปล่อยค้าง):
- `addListHTML(no, j)` (บรรทัด ~4764)
- `renderAddList(no)` (บรรทัด ~4792)
- `kbkPartQty(no, code, d)` และ `kbkPartDel(no, code)` — ถูกแทนด้วย `kbkPartBump`
- `kbkPartAdd(no, code)` — ถูกแทนด้วย `kbkPartBump`

แล้วลบ `E.addOpen` ออกจากทุกที่ที่ตั้งค่า — มี 2 จุด: บรรทัด ~4368 (`E.mode = null; …`) และใน `openStep()` บรรทัด ~4396

ตรวจว่าไม่มีของค้าง:

```bash
grep -n "addListHTML\|renderAddList\|kbkPartQty\|kbkPartDel\|kbkPartAdd\|E\.addOpen\|invCell\|partSource\|srcbar" mock/Maintenance-Request-Form.html
```

คาดว่า: ไม่มีผลลัพธ์

- [ ] **Step 5: รันเทสให้ผ่าน**

```bash
NODE_PATH=<…>/node_modules node mock/test/verify-parts.js
```

คาดว่า: `ผ่านทุกข้อ` (22 ข้อ) · ไม่มี `pageerror`

- [ ] **Step 6: ตรวจกฎ design system**

```bash
node design-system/audit-usage.js

grep -rniE '#[0-9a-f]{3,8}\b' --include='*.html' . \
  | grep -viE '#fff|#000|design-system/|config.*\.js|admin-config|theme-color|/test/|backup'

grep -rnP '[\x{1F300}-\x{1FAFF}]' --include='*.html' --include='*.js' \
  maintainance-yearly/ mock/ daily-record/ *.html | grep -v '/test/' | grep -v backup | grep -vE ':\s*(//|\*|/\*)'
```

คาดว่า: `audit-usage.js` ไม่รายงาน component ที่นิยามในหน้า · grep ทั้งสองได้ผลว่าง

- [ ] **Step 7: commit**

```bash
git add mock/Maintenance-Request-Form.html mock/test/verify-parts.js
git commit -m "feat(kbk): หน้าเบิกอะไหล่เป็น 2 คอลัมน์ คลังอะไหล่ ↔ รายการที่เลือก"
```

---

## Task 3: ให้ขั้นเบิกอะไหล่กินความกว้างเต็ม

**Files:**
- Modify: `mock/Maintenance-Request-Form.html:1577-1586` (`.ops-detail-layout` — เพิ่ม modifier)
- Modify: `mock/Maintenance-Request-Form.html:4565` (`renderKbkDetail` — ใส่คลาสตามขั้น)
- Test: `mock/test/verify-parts.js` (เพิ่มเคส)

**เหตุผล:** `.ops-detail-layout` เป็น grid `minmax(0,1.7fr) minmax(320px,.8fr)` บน `max-width:1280px` ⇒ คอลัมน์หลักเหลือ ~854px ถ้ายัด 2 คอลัมน์เข้าไปจะได้ ~415px ต่อคอลัมน์ ซึ่งแคบกว่าที่ `design-mock` ออกแบบไว้มาก · แก้ด้วยการให้**ขั้นเบิกอะไหล่ขั้นเดียว**เป็นคอลัมน์เดียว แล้วดันประวัติสถานะลงไปอยู่ด้านล่างแทน ขั้นอื่นไม่เปลี่ยน

> ถ้าเจ้าของงานอยากให้ประวัติอยู่ข้างเหมือนเดิม ให้ข้าม Task นี้ — หน้าจอยังทำงานได้ แค่แคบลง

- [ ] **Step 1: เขียนเทสที่ยังไม่ผ่าน**

เพิ่มใน `mock/test/verify-parts.js`:

```js
  /* ขั้นเบิกอะไหล่กินเต็มความกว้าง — 2 คอลัมน์ต้องกว้างพอ */
  const w = await page.evaluate(() => {
    const cards = document.querySelectorAll('.ops-detail-main .fgrid > .f');
    return cards.length === 2 ? Math.round(cards[0].getBoundingClientRect().width) : 0;
  });
  w >= 560 ? ok('คอลัมน์คลังอะไหล่กว้าง ' + w + 'px') : fail('คอลัมน์แคบไป ' + w + 'px (ต้อง ≥ 560)');
```

- [ ] **Step 2: รันเทสให้เห็นว่าไม่ผ่าน**

```bash
NODE_PATH=<…>/node_modules node mock/test/verify-parts.js
```

คาดว่า: `FAIL คอลัมน์แคบไป ~415px`

- [ ] **Step 3: เพิ่ม modifier ใน CSS ของหน้า**

`.ops-detail-layout` เป็น CSS เฉพาะหน้านี้อยู่แล้ว (ไม่ใช่คอมโพเนนต์ของ design system) เพิ่ม modifier ต่อท้ายบล็อกเดิมที่บรรทัด ~1586:

```css
    /* ขั้นเบิกอะไหล่วางของเป็น 2 คอลัมน์ในตัวเองอยู่แล้ว — ถ้าเบียดกับแถบประวัติอีกจะเหลือคอลัมน์ละ ~415px
       แคบกว่าที่ design-mock ออกแบบไว้ ⇒ ขั้นนี้ขั้นเดียวให้ประวัติลงไปอยู่ล่างแทน */
    .ops-detail-layout.stacked {
      grid-template-columns: minmax(0, 1fr)
    }
```

- [ ] **Step 4: ใส่คลาสตามขั้นใน `renderKbkDetail`**

แก้บรรทัด 4565 จาก:

```js
    <div class="ops-detail-layout" style="padding-top:8px">
```

เป็น:

```js
    <div class="ops-detail-layout ${stepOf(j)==='parts'?'stacked':''}" style="padding-top:8px">
```

- [ ] **Step 5: รันเทสให้ผ่าน**

```bash
NODE_PATH=<…>/node_modules node mock/test/verify-parts.js
NODE_PATH=<…>/node_modules node design-system/check-spacing.js
```

คาดว่า: เทสผ่านทุกข้อ · `check-spacing.js` ไม่รายงานระยะที่หลุดสเกล

- [ ] **Step 6: commit**

```bash
git add mock/Maintenance-Request-Form.html mock/test/verify-parts.js
git commit -m "feat(kbk): ขั้นเบิกอะไหล่ใช้ความกว้างเต็ม ประวัติสถานะย้ายลงล่าง"
```

---

## Task 4: `SELF_STEPS` 6 ขั้นสำหรับเส้นซ่อมเอง

**Files:**
- Modify: `mock/Maintenance-Request-Form.html:4374-4390` (`KSTEPS` · `stepOf` · `stepIndex`)
- Modify: `mock/Maintenance-Request-Form.html:4537,4553-4556` (`renderKbkDetail` — เลือกชุดขั้น + breadcrumb)
- Test: `mock/test/verify-parts.js` (เพิ่มเคส)

**Interfaces:**
- Consumes: `stepOf(j)` เดิม (ยังใช้กับเส้นอื่น)
- Produces: `SELF_STEPS` — array 6 ตัว `{k, label, icon}`
- Produces: `selfStepIndex(j) -> number` — ดัชนี 0-5 ของขั้นปัจจุบันในเส้นซ่อมเอง
- Produces: `isSelfRoute(j) -> boolean` — `j.phase!=='pending' && j.route==='self'`

- [ ] **Step 1: เขียนเทสที่ยังไม่ผ่าน**

เพิ่มใน `mock/test/verify-parts.js`:

```js
  /* stepper 6 ขั้นเฉพาะเส้นซ่อมเอง */
  const steps = await page.$$eval('.kstepbar .kstep .lbl', els => els.map(e => e.textContent.trim()));
  eq(steps.length, 6, 'stepper มี 6 ขั้น');
  eq(steps[0], 'เบิกอะไหล่', 'ขั้น 1');
  eq(steps[1], 'นัดหมายวันซ่อม', 'ขั้น 2');
  eq(steps[5], 'รายงานการปิดงาน', 'ขั้น 6');
  const active = await page.$$eval('.kstepbar .kstep.active .lbl', els => els.map(e => e.textContent.trim()));
  eq(active[0], 'เบิกอะไหล่', 'ขั้นที่ active คือเบิกอะไหล่');
  const crumb = await page.textContent('.kstep-crumb');
  crumb.includes('ซ่อมเอง') ? ok('มี breadcrumb "รับเรื่องแล้ว › ซ่อมเอง"') : fail('breadcrumb = ' + crumb);
```

- [ ] **Step 2: รันเทสให้เห็นว่าไม่ผ่าน**

```bash
NODE_PATH=<…>/node_modules node mock/test/verify-parts.js
```

คาดว่า: `FAIL stepper มี 6 ขั้น (ได้ 4 คาด 6)`

- [ ] **Step 3: เพิ่มชุดขั้นใหม่**

ถัดจาก `KSTEPS` (บรรทัด 4374-4379) เพิ่ม:

```js
    // เส้น "ซ่อมเอง" มีขั้นของตัวเอง 6 ขั้น — รับเรื่อง/เลือกวิธีซ่อม ผ่านมาแล้วจึงไม่อยู่ใน stepper
    // เส้นส่งอู่ (quote) และซ่อมหน้างาน (onsite) ยังใช้ KSTEPS 4 ขั้นเหมือนเดิม
    const SELF_STEPS = [
      { k:'parts',   label:'เบิกอะไหล่',          icon:'inventory_2' },
      { k:'appt',    label:'นัดหมายวันซ่อม',      icon:'event' },
      { k:'inspin',  label:'ตรวจสภาพก่อนซ่อม',    icon:'fact_check' },
      { k:'work',    label:'ดำเนินการซ่อม',       icon:'engineering' },
      { k:'inspout', label:'ตรวจสภาพรถหลังซ่อม',  icon:'checklist' },
      { k:'close',   label:'รายงานการปิดงาน',     icon:'task_alt' }
    ];
    function isSelfRoute(j){ return j.phase !== 'pending' && j.route === 'self' && j.loc !== 'onsite' }
    // ขั้นที่ใบนี้อยู่ตอนนี้ — คิดจากสถานะจริง ไม่ให้ผู้ใช้เลือกเอง
    // TG.inspection ปิดอยู่ ⇒ ขั้น 3 กับ 5 ถูกข้าม (ยังแสดงใน stepper แต่เดินผ่านทันที)
    function selfStepIndex(j){
      if(!j.partsOK) return 0;
      if(j.phase === 'closed' || j.phase === 'gclosed') return 5;
      if(j.inspOut) return 5;
      if(!j.appt) return 1;
      if(TG.inspection && !j.inspIn) return 2;
      if(j.wi < 4) return 3;
      if(TG.inspection && !j.inspOut) return 4;
      return 5;
    }
```

- [ ] **Step 4: ให้ `renderKbkDetail` เลือกชุดขั้น**

แก้บรรทัด 4537 จาก:

```js
      const st=statusInfo(j), t=vehType(j), ok=vehUsable(j), cur=stepIndex(j);
```

เป็น:

```js
      const st=statusInfo(j), t=vehType(j), ok=vehUsable(j);
      const self=isSelfRoute(j);
      const STEPSET=self?SELF_STEPS:KSTEPS, cur=self?selfStepIndex(j):stepIndex(j);
```

แล้วแก้บล็อก `.kstepbar` (บรรทัด 4553-4556) เป็น:

```js
    ${self?'<div class="kstep-crumb"><span class="ms">check_circle</span>รับเรื่องแล้ว › ซ่อมเอง</div>':''}
    <div class="kstepbar">${STEPSET.map((x,i)=>
      `<div class="kstep ${i===cur?'active':i<cur?'passed':''}">
         <span class="num">${i<cur?'<span class=\"ms\">check</span>':i+1}</span>
         <span class="lbl"><span class="ms">${x.icon}</span>${x.label}</span></div>`).join('')}</div>
```

- [ ] **Step 5: เพิ่มสไตล์ breadcrumb**

`.kstepbar`/`.kstep` เป็น CSS เฉพาะหน้าอยู่แล้ว (บรรทัด 1051) — เพิ่มต่อท้ายบล็อกเดิม:

```css
    /* breadcrumb เหนือ stepper — แทนขั้น "รับเรื่อง/เลือกวิธีซ่อม" ที่ผ่านมาแล้วและไม่อยู่ใน stepper */
    .kstep-crumb {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--fs-text-sm);
      color: var(--gray-500);
      margin: 16px 0 -6px
    }

    .kstep-crumb .ms {
      font-size: 17px;
      color: var(--success-600)
    }
```

- [ ] **Step 6: รันเทสให้ผ่าน**

```bash
NODE_PATH=<…>/node_modules node mock/test/verify-parts.js
```

คาดว่า: `ผ่านทุกข้อ` (29 ข้อ)

- [ ] **Step 7: commit**

```bash
git add mock/Maintenance-Request-Form.html mock/test/verify-parts.js
git commit -m "feat(kbk): stepper 6 ขั้นสำหรับเส้นซ่อมเอง + breadcrumb ขั้นที่ผ่านมาแล้ว"
```

---

## Task 5: เรียง state ใหม่ — นัดหมายวันซ่อมมาก่อนตรวจสภาพ/ซ่อม

**Files:**
- Modify: `mock/Maintenance-Request-Form.html:4401-4530` (`kbkActionHTML` — สลับลำดับกิ่ง)
- Modify: `mock/Maintenance-Request-Form.html:4851` (`kbkPartsConfirm`)
- Test: `mock/test/verify-parts.js` (เพิ่มเคสเดินทั้งเส้น)

**ลำดับเดิม:** `partsOK` → ตรวจสภาพขาเข้า + `KBK_STEPS` (`j.wi` 0-4) → เปิดตารางว่าง → `slots` → `appt` → ตรวจสภาพขาออก → `closed` (นัดหมาย = นัดรับรถคืน อยู่ท้าย)

**ลำดับใหม่:** `partsOK` → เปิดตารางว่าง → `slots` → `appt` (นัดหมายวันซ่อม) → ตรวจสภาพก่อนซ่อม → `KBK_STEPS` → ตรวจสภาพหลังซ่อม → ปิดงาน

- [ ] **Step 1: เขียนเทสที่ยังไม่ผ่าน**

เพิ่มใน `mock/test/verify-parts.js`:

```js
  /* กดยืนยันรายการเบิกแล้วต้องไปขั้น "นัดหมายวันซ่อม" ไม่ใช่แทร็กสถานะซ่อม */
  await page.click('.ops-detail-main .btn-p');
  await page.waitForTimeout(300);
  const cur = await page.$$eval('.kstepbar .kstep.active .lbl', els => els.map(e => e.textContent.trim()));
  eq(cur[0], 'นัดหมายวันซ่อม', 'ยืนยันเบิกแล้วไปขั้นนัดหมาย');
  const hasSlots = await page.evaluate(() => !!document.getElementById('dpk'));
  hasSlots ? ok('ขั้นนัดหมายแสดงตัวเลือกวัน') : fail('ไม่เจอตัวเลือกวันในขั้นนัดหมาย');
  const heading = await page.textContent('.ops-detail-main .sect');
  heading.includes('นัดหมายวันซ่อม') ? ok('หัวข้อเปลี่ยนเป็น "นัดหมายวันซ่อม"') : fail('หัวข้อ = ' + heading);
```

- [ ] **Step 2: รันเทสให้เห็นว่าไม่ผ่าน**

```bash
NODE_PATH=<…>/node_modules node mock/test/verify-parts.js
```

คาดว่า: `FAIL ยืนยันเบิกแล้วไปขั้นนัดหมาย (ได้ "ดำเนินการซ่อม")`

- [ ] **Step 3: แก้ `kbkPartsConfirm` ให้พาไปขั้นนัดหมาย**

แทนที่ `kbkPartsConfirm` (บรรทัด ~4851) ด้วย:

```js
function kbkPartsConfirm(no){
  const j = JOBS.find(x=>x.no===no);
  if(!j.parts.length && !confirm('ยังไม่มีรายการอะไหล่เลย — ยืนยันว่างานนี้ไม่ใช้อะไหล่?')) return;
  const c = partsCost(j.parts);
  j.partsOK = true;
  j.history.push({ t:nowStr(),
    label:`ยืนยันรายการเบิก ${j.parts.length} รายการ — เบิกจากคลัง ${baht(c.stockCost)} บาท`
      + (c.buyCost?` · ตั้งจัดซื้อ ${baht(c.buyCost)} บาท`:'') });
  if(c.buyCost) toast('ตั้งรายการจัดซื้อให้แล้ว — ต่อไปนัดหมายวันซ่อม');
  else toast('เบิกได้ครบ — ต่อไปนัดหมายวันซ่อม');
  renderKbkDetail(no);
}
```

- [ ] **Step 4: สลับลำดับกิ่งใน `kbkActionHTML`**

ในกิ่ง `if (j.phase === 'work')` (แทร็กงานใหญ่ บรรทัด ~4486) — เดิมแสดง `KBK_STEPS` tracker ทันทีหลัง `partsOK` · เปลี่ยนเป็นเช็คนัดหมายก่อน โดยแทรก**ก่อน**บล็อกนั้น:

```js
      // ซ่อมเอง: ยืนยันอะไหล่แล้วแต่ยังไม่มีวันนัด ⇒ ขั้น 2 นัดหมายวันซ่อม
      else if (j.phase === 'work' && j.route === 'self' && j.partsOK && !j.appt) {
        action = partsSummaryHTML(j) + slotPickerHTML(no, j);
      }
```

แล้วย้ายบล็อกเปิดตารางว่างที่เดิมอยู่ท้าย `phase==='work'` (ตอน `j.wi >= 4`) ออกมาเป็นฟังก์ชัน `slotPickerHTML(no, j)` — ยกเนื้อในเดิมมาทั้งก้อน เปลี่ยนแค่ 2 ข้อความ:
- `นัดรับรถ — เปิดตารางว่างของ กบค.` → `นัดหมายวันซ่อม — เปิดตารางว่างของ กบค.`
- `ตารางว่างจะไปแสดงที่หน้าจอนัดรับรถของผู้แจ้ง` → `ตารางว่างจะไปแสดงที่หน้าจอนัดหมายของผู้แจ้ง`

ใน `phase === 'appt'` (บรรทัด ~4528) เดิมทำตรวจสภาพ**ขาออก** ⇒ เปลี่ยนเป็นตรวจสภาพ**ก่อนซ่อม** แล้วต่อด้วยแทร็กซ่อม:

```js
      if (j.phase === 'appt') {
        action = `<div class="apptbox"><span class="ms" style="color:var(--primary-600)">event</span> <b>นัดหมายวันซ่อม:</b> ${j.appt.date} เวลา ${j.appt.time} น. ${j.appt.note ? '· ' + j.appt.note : ''}</div>`;
        if (TG.inspection && !j.inspIn) {
          if (!K.insp) K.insp = initInsp();
          action += `<div class="sect" style="margin-top:24px">ตรวจสภาพก่อนซ่อม <span style="font-weight:400;font-size:var(--fs-sm);color:var(--gray-500)">— ตรวจร่วมกับผู้ส่งรถก่อนเริ่มงาน</span></div>`
            + inspFormHTML(no, 'in', j);
        } else {
          action += workTrackHTML(no, j);
        }
      }
```

แล้วยกแทร็ก `KBK_STEPS` + ปุ่ม `kbkAdvance` + ตรวจสภาพขาออก + `costFieldsHTML` ที่เดิมอยู่ในกิ่ง `phase==='work'` มาเป็นฟังก์ชัน `workTrackHTML(no, j)` — ยกเนื้อในเดิมมาทั้งก้อน ตัดเฉพาะบล็อกเปิดตารางว่าง (ย้ายไป `slotPickerHTML` แล้ว) และเปลี่ยนหัวข้อตรวจสภาพขาออกจาก `ตรวจสภาพตอนรับรถคืน (ขาออก)` เป็น `ตรวจสภาพรถหลังซ่อม`

- [ ] **Step 5: รันเทสให้ผ่าน**

```bash
NODE_PATH=<…>/node_modules node mock/test/verify-parts.js
```

คาดว่า: `ผ่านทุกข้อ` (32 ข้อ) · ไม่มี `pageerror`

- [ ] **Step 6: เดินทั้งโฟลว์ด้วยตาในเบราว์เซอร์**

```bash
python3 -m http.server 8123 --bind 127.0.0.1
```

เปิด `http://127.0.0.1:8123/mock/Maintenance-Request-Form.html#kbk` → เปิดใบที่ยังไม่รับเรื่อง → รับไว้ซ่อม → ซ่อมเองได้ → เดินครบ 6 ขั้น

**เกณฑ์:** ไม่มี error ใน console · stepper เดินหน้าตามจริงทุกขั้น · รีโหลดกลางทางแล้ว state ยังอยู่ · เส้นส่งอู่กับซ่อมหน้างานยังเป็น 4 ขั้นเหมือนเดิม

- [ ] **Step 7: commit**

```bash
git add mock/Maintenance-Request-Form.html mock/test/verify-parts.js
git commit -m "feat(kbk): เรียงเส้นซ่อมเองใหม่ — นัดหมายวันซ่อมมาก่อนตรวจสภาพและซ่อม"
```

---

## Task 6: อัปเดตผังงาน + เอกสาร แล้ว push

**Files:**
- Modify: `Diagram/02-แจ้งซ่อม-กบค/01-flow-กบค-6ช่วง.md`
- Modify: `Diagram/02-แจ้งซ่อม-กบค/03-กบค-รับงาน-นัดรับ-ตรวจสภาพ.md`
- Modify: `plan.md`

- [ ] **Step 1: อ่านผังเดิมก่อนแก้**

```bash
cat "Diagram/02-แจ้งซ่อม-กบค/03-กบค-รับงาน-นัดรับ-ตรวจสภาพ.md"
cat Diagram/README.md
```

หา node ที่แทนลำดับเดิม (จัดอะไหล่ → ซ่อม → นัดรับรถ) แล้วสลับให้เป็น เบิกอะไหล่ → นัดหมายวันซ่อม → ตรวจก่อนซ่อม → ซ่อม → ตรวจหลังซ่อม → ปิดงาน

- [ ] **Step 2: แก้ผัง mermaid ทั้งสองไฟล์**

ให้ลำดับในผังตรงกับ `SELF_STEPS` และตาราง `selfStepIndex` เป๊ะ · ถ้าผังมีคำว่า "นัดรับรถ" ในเส้นซ่อมเอง ให้เปลี่ยนเป็น "นัดหมายวันซ่อม" · เส้นส่งอู่กับซ่อมหน้างานห้ามแตะ

- [ ] **Step 3: ยืนยันว่าผัง parse ผ่านจริง**

```bash
node Diagram/check-mermaid.js
```

คาดว่า: ทุกไฟล์ parse ผ่าน ไม่มี error

- [ ] **Step 4: ปิดรายการค้างใน `plan.md`**

หา `- [ ] **หน้าเบิกอะไหล่ (เส้น กบค. ซ่อมเอง) → เลย์เอาต์ 2 คอลัมน์ + stepper 6 ขั้น**` แล้วเปลี่ยนเป็น `- [x] ~~…~~ — **เสร็จ 13 ส.ค.**` พร้อมสรุปสิ่งที่ทำจริง

เพิ่มรายการค้างใหม่ที่เกิดจากงานนี้:

```markdown
- [ ] **ขั้น 3/5 (ตรวจสภาพก่อน-หลังซ่อม) ยังใช้ฟอร์มตรวจสภาพชุดเดิม** — `inspFormHTML()` ตัวเดียวใช้ทั้งขาเข้า/ขาออก · `design-mock` ยังไม่ได้ออกแบบสองจอนี้
- [ ] **`design-mock/kbk-self-repair-appointment.html` ยังไม่ถูกยกเข้าต้นแบบ** — ขั้น 2 ใช้ตารางว่างของเดิม (เลือกรูปแบบการนัด/ผู้ประสานงาน/สถานที่นัด ในดีไซน์ยังไม่มีในโค้ด)
```

- [ ] **Step 5: ตรวจครบก่อนปิดงาน**

```bash
node design-system/verify-tokens.js
node design-system/compare-figma.js
node design-system/audit-usage.js
node Diagram/check-mermaid.js
node maintainance-yearly/test/skeleton-data.test.js
NODE_PATH=<…>/node_modules node mock/test/verify-parts.js

grep -rniE '#[0-9a-f]{3,8}\b' --include='*.html' . \
  | grep -viE '#fff|#000|design-system/|config.*\.js|admin-config|theme-color|/test/|backup'
```

คาดว่า: ทุกตัวผ่าน · grep ว่าง

- [ ] **Step 6: commit + push**

```bash
git add Diagram/ plan.md
git commit -m "docs: sync ผังงาน กบค. กับลำดับขั้นใหม่ของเส้นซ่อมเอง + ปิดรายการค้าง"
git push origin main
```

- [ ] **Step 7: ยืนยันหลัง push**

```bash
git fetch origin && git rev-list --left-right --count origin/main...main
```

คาดว่า: `0	0`

---

## Self-Review

**Spec coverage** — ทุกหัวข้อของสเปกมีเจ้าภาพ: ข้อ 1 (หน้าจอ) → Task 2+3 · ข้อ 2 (ตรรกะแหล่งของ + ปรับ `partsRowsHTML` + ลบของเลิกใช้) → Task 1+2 · ข้อ 3 (`SELF_STEPS`) → Task 4 · ข้อ 4 (เรียง state) → Task 5 · ข้อ 5 (ผัง) → Task 6 · ข้อ 6 (การตรวจ) → กระจายอยู่ทุก Task + รวบใน Task 6

**ส่วนที่สเปกไม่ได้ระบุแต่แผนตัดสินให้** — ความกว้างของขั้นเบิกอะไหล่ (Task 3) เพราะสเปกไม่ได้พูดถึงแถบประวัติสถานะ และวัดแล้วพบว่าเบียดจริง · ทำเป็น Task แยกเพื่อให้ข้ามได้ถ้าเจ้าของงานไม่เอา

**Type consistency** — `partsSplit()` คืน `{onHand, fromStock, toBuy, unit, leadDays}` ใช้ชื่อเดียวกันทุกจุด (Task 1 นิยาม · Task 1 `partsRowsHTML` · Task 2 `pickedColHTML` ใช้) · `partsCost()` คืน `{stockCost, buyCost, total}` ตรงกันทั้ง Task 1 และ 2 · `kbkPartBump(no, code, delta)` นิยามและเรียกด้วยลายเซ็นเดียวกันทั้ง `stockColHTML` และ `pickedColHTML`
