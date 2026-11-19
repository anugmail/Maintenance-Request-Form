#!/usr/bin/env node
/* ============================================================
   เทส figjam-calendar-plugin/code.js บน mock ของ FigJam Plugin API
   ตรวจ: อ่าน CSV (มี , และ "" ในช่อง · ขึ้นบรรทัดในช่อง) · sprint → ช่วงวันที่
   (SP08 = 2–13 พ.ย. 2569) · การ์ด [SPxx] ไปคอลัมน์ "ยังไม่ลง sprint" · ข้าม template/defect
   · การ์ดเลขซ้ำนับใบเดียว (Done ชนะ) · กติกาฟอนต์ (แก้ text ก่อนโหลด Inter Medium = พัง)
   · รันซ้ำไม่ซ้อน section

   รัน:  node figma-export/test-figjam-calendar-plugin.js [ไฟล์.csv ...]
         ใส่ไฟล์ CSV จริงเพิ่มได้ — จะพิมพ์สรุปคอลัมน์/แถวของไฟล์นั้นด้วย
   ============================================================ */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let idSeq = 1;
const loadedFonts = new Set();
function textSublayer() {
  const state = { characters: '', fontName: { family: 'Inter', style: 'Medium' }, fontSize: 12, fills: [] };
  return new Proxy(state, {
    set(t, k, v) {
      const cur = t.fontName.family + ' ' + t.fontName.style;
      if ((k === 'fontName' || k === 'characters') && !loadedFonts.has(cur)) {
        throw new Error('in set_' + String(k) + ': Cannot write to node with unloaded font "' + cur + '"');
      }
      if (k === 'fontName' && !loadedFonts.has(v.family + ' ' + v.style)) {
        throw new Error('set fontName to unloaded font ' + v.family + ' ' + v.style);
      }
      t[k] = v; return true;
    }
  });
}
class MNode {
  constructor(type) {
    this.id = 'n' + (idSeq++); this.type = type; this.name = type; this.children = []; this.parent = null;
    this.x = 0; this.y = 0; this.width = 100; this.height = 100; this.fills = []; this.strokes = [];
    if (type === 'SHAPE_WITH_TEXT') { this.shapeType = 'SQUARE'; this.text = textSublayer(); }
  }
  appendChild(n) { if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1); n.parent = this; this.children.push(n); }
  remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
  resize(w, h) { this.width = w; this.height = h; }
  resizeWithoutConstraints(w, h) { this.width = w; this.height = h; }
  findOne(pred) {
    for (const c of this.children) {
      if (pred(c)) return c;
      const hit = c.findOne(pred);
      if (hit) return hit;
    }
    return null;
  }
}
const page = new MNode('PAGE');
const logs = [];
global.figma = {
  currentPage: page,
  editorType: 'figjam',
  loadFontAsync: async (f) => {
    if (f.family === 'IBM Plex Sans Thai' || f.family === 'Inter') { loadedFonts.add(f.family + ' ' + f.style); return; }
    throw new Error('font not found ' + f.family);
  },
  createSection() { const n = new MNode('SECTION'); page.appendChild(n); return n; },
  createShapeWithText() { const n = new MNode('SHAPE_WITH_TEXT'); page.appendChild(n); return n; },
  viewport: { scrollAndZoomIntoView() {} },
  ui: { postMessage(m) { if (m.type === 'log') logs.push(m.text); } }
};

const P = require('./figjam-calendar-plugin/code.js');

/* ---------- ฟังก์ชันล้วน ---------- */
const csv = [
  '"Card Name","Current List","Labels","Due Date","Completed Date","Moved To List","Description","Checklist"',
  '"[PEA-X.X.X][XX] Title > Menu","Template","sp02","","","","x",""',
  '"[PEA-1.24.7][SP08][J.1] [รวม] กบค. เพิ่ม/แก้ไข/ลบ การติดตามผล > Stepper 3","SP08","1pt; ❤️","","","","บรรทัด 1\nบรรทัด ""2"", มีจุลภาค",""',
  '"[PEA-1.23.12][SP08][E.1] กบค. สร้าง Purchase order > หน้าเพิ่ม Purchase order","SP08","5pt; ❤️","","","","",""',
  '"[PEA-1.23.9][SP08][B.1] กบค. สร้างแผน","SP08","3pt; ⭐️","","","","",""',
  '"[PEA-1.7.1][SPxx] เพิ่มกำหนดการบำรุงรักษายานพาหนะ > ตารางบำรุงรักษา","Backlog JO1","","","","","",""',
  '"[Defect][PEA-1.24.2][SP07] บั๊กอะไรสักอย่าง","📦 Done SP07","","","","","",""',
  '"[PEA-1.23.1][SP07] กบค. สร้างแผน Overhaul","📦 Done SP07","8pt; ⭐️","","","","",""',
  '"Save ข้อมูลจัดการงานซ่อมจริงทั้ง flow","📦 Done SP07","⭐️; sp03","","","","",""',
  '"[PEA-1.3.2] กบค. รับเรื่อง - นัดหมายคืนรถ","📦 Complete ClickUp","","","","","",""'
].join('\r\n');

const r = P.cardsFromCSV(csv);
assert.strictEqual(r.cards.length, 6, 'ได้การ์ด 6 ใบ (ข้าม template/defect/ไม่มีเลข)');
assert.deepStrictEqual(r.skipped, { template: 1, defect: 1, noNumber: 1 });
const j = r.cards.find(c => c.no === '1.24.7');
assert.strictEqual(j.uc, '1.24'); assert.strictEqual(j.sprint, 8); assert.strictEqual(j.team, 'heart'); assert.strictEqual(j.points, 1);
assert.strictEqual(j.title, '[รวม] กบค. เพิ่ม/แก้ไข/ลบ การติดตามผล > Stepper 3', 'ตัดวงเล็บนำหน้าแค่ชุดแรก ไม่กิน [รวม] ที่อยู่หลังช่องว่าง');
assert.strictEqual(r.cards.find(c => c.no === '1.7.1').sprint, null, '[SPxx] = ยังไม่ลง sprint');
assert.strictEqual(r.cards.find(c => c.no === '1.23.1').done, true);

assert.strictEqual(P.fmtRange(P.sprintRange(8, P.DEFAULTS)), '2–13 พ.ย. 2569');
assert.strictEqual(P.fmtRange(P.sprintRange(7, P.DEFAULTS)), '19–30 ต.ค. 2569');
assert.strictEqual(P.fmtRange(P.sprintRange(9, P.DEFAULTS)), '16–27 พ.ย. 2569');
assert.strictEqual(P.fmtRange(P.sprintRange(10, P.DEFAULTS)), '30 พ.ย. – 11 ธ.ค. 2569');
assert.strictEqual(P.fmtRange(P.sprintRange(12, P.DEFAULTS)), '28 ธ.ค. 2569 – 8 ม.ค. 2570');

/* การ์ดที่ยังไม่มีเลข PEA — ชื่อ [MD-JO<n>-UC-<UC>(-<sub>)][SPxx] (ของที่สร้างจาก project_timeline ก่อนมีเลขจริง) */
const csvMd = [
  '"Card Name","Current List","Labels","Due Date","Completed Date","Moved To List","Description","Checklist"',
  '"[MD-JO1-UC-19][SPxx] ทะเบียนรถติดตั้งเครื่องมือกล","Backlog JO1","","","","","",""',
  '"[MD-JO1-UC-19-01][SPxx] สร้าง/แก้ไข ข้อมูลยานพาหนะที่ติดตั้ง","Backlog JO1","","","","","",""',
  '"[MD-JO1-UC-07][SPxx] กำหนดตารางบำรุงรักษา (เลข 0 นำหน้าต้องตัดให้ตรงกับ PEA-1.7.n)","Backlog JO1","","","","","",""',
  '"[MD-JO2-UC-01][SPxx] เริ่ม-จบงาน ผู้ควบคุมรถ","Backlog JO2","2pt; ⭐️","","","","",""',
  '"[MD-JO3-UC-PRE][SPxx] Pre-deploy JO3","Backlog JO3","","","","","",""'
].join('\r\n');
const rMd = P.cardsFromCSV(csvMd);
assert.strictEqual(rMd.cards.length, 5, 'การ์ดเลข MD-JO ถูกอ่านครบ ไม่ถูกข้ามเป็น noNumber');
assert.deepStrictEqual(rMd.skipped, { template: 0, defect: 0, noNumber: 0 });
assert.strictEqual(rMd.cards.find(c => c.raw.includes('UC-19]')).uc, '1.19', 'UC-19 เข้าแถวเดียวกับที่ PEA-1.19.n จะใช้ในอนาคต');
assert.strictEqual(rMd.cards.find(c => c.raw.includes('UC-19]')).no, 'J1-UC-19');
assert.strictEqual(rMd.cards.find(c => c.raw.includes('UC-19-01]')).uc, '1.19', 'UC-19-01 อยู่แถวเดียวกับ UC-19 (กลุ่มเดียวกัน)');
assert.strictEqual(rMd.cards.find(c => c.raw.includes('UC-19-01]')).no, 'J1-UC-19-01');
assert.strictEqual(rMd.cards.find(c => c.raw.includes('UC-07]')).uc, '1.7', 'ตัดเลข 0 นำหน้า UC-07 → "1.7" ไม่ใช่ "1.07" ให้ตรงกับการ์ด PEA เดิม');
assert.strictEqual(P.UC_NAMES['1.7'], rMd.cards.find(c => c.raw.includes('UC-07]')) && P.UC_NAMES['1.7'], 'UC_NAMES["1.7"] ต้องมีอยู่ (ไม่ fallback เป็น "UC 1.7")');
const j2 = rMd.cards.find(c => c.raw.includes('UC-01]') && c.raw.includes('JO2'));
assert.strictEqual(j2.uc, '2.1'); assert.strictEqual(j2.team, 'star'); assert.strictEqual(j2.points, 2);
assert.strictEqual(rMd.cards.find(c => c.raw.includes('UC-PRE]')).uc, '3.PRE', 'โค้ดที่ไม่ใช่ตัวเลข (PRE/DEP/POST) เก็บเป็นตัวอักษรตัวใหญ่');
assert.ok(rMd.cards.every(c => P.UC_NAMES[c.uc]), 'ทุก uc ของการ์ดเลข MD-JO ต้องมีชื่อใน UC_NAMES (ไม่ fallback เป็น "UC x.y")');
assert.strictEqual(P.layout(rMd.cards, {}, null).rows.map(x => x.uc).join(','), ['1.7', '1.19', '2.1', '3.PRE'].join(','), 'เรียงแถว: JO ก่อน แล้วเลข UC ก่อนตัวอักษร (PRE/DEP/POST ท้ายสุดของ JO นั้น)');

/* การ์ดรายงานสถานะ (เช่น JO-เลขข้อ-สถานะการ์ด.csv) — สี shape ตาม % ความคืบหน้าใน Labels แทน ⭐️/❤️ */
const csvProgress = [
  '"Card Name","Current List","Labels","Due Date","Completed Date","Moved To List","Description","Checklist"',
  '"[MD-JO1-UC-01][SPxx] [1.4] ยังไม่เริ่มเลย","Backlog JO1","0%","","","","",""',
  '"[MD-JO1-UC-02][SPxx] [1.4] มีไปบางแล้ว","Backlog JO1","40%","","","","",""',
  '"[MD-JO1-UC-03][SPxx] [1.4] ทำไปเยอะแล้ว พอดีเกณฑ์","Backlog JO1","70%","","","","",""',
  '"[MD-JO1-UC-04][SPxx] [1.4] ทำไปเยอะแล้ว","Backlog JO1","99%","","","","",""',
  '"[MD-JO1-UC-05][SPxx] [1.5] มีทีมด้วย ⭐️ ต้องชนะสี progress","Backlog JO1","60%; ⭐️","","","","",""'
].join('\r\n');
const rProgress = P.cardsFromCSV(csvProgress);
assert.strictEqual(rProgress.cards.find(c => c.raw.includes('UC-01]')).progress, 0, '0% อ่านค่าได้ถูก');
assert.strictEqual(rProgress.cards.find(c => c.raw.includes('UC-01]')).team, '', '0% ไม่ได้สีเหลือง/เขียว (ยังไม่เริ่ม)');
assert.strictEqual(rProgress.cards.find(c => c.raw.includes('UC-02]')).progress, 0.4);
assert.strictEqual(rProgress.cards.find(c => c.raw.includes('UC-02]')).team, 'yellow', 'มีไปบางแล้ว (< เกณฑ์เขียว) = เหลือง');
assert.strictEqual(rProgress.cards.find(c => c.raw.includes('UC-03]')).team, 'green', 'พอดีเกณฑ์ (70% = PROGRESS_GREEN_AT) ต้องเป็นเขียวแล้ว');
assert.strictEqual(rProgress.cards.find(c => c.raw.includes('UC-04]')).team, 'green', 'ทำไปเยอะแล้ว = เขียว');
assert.strictEqual(rProgress.cards.find(c => c.raw.includes('UC-05]')).team, 'star', 'มี ⭐️ ชัดเจน ต้องใช้สีทีมเดิม ไม่ใช่สี progress');
assert.ok(P.PROGRESS_GREEN_AT > 0 && P.PROGRESS_GREEN_AT < 1);

// dedupe: ใบ Done ชนะ
const d = P.dedupe([{ no: '1.1.1', done: true, defect: false }, { no: '1.1.1', done: false, defect: false }]);
assert.strictEqual(d.length, 1); assert.strictEqual(d[0].done, true);

// layout: คอลัมน์ SP07..SP10 + ยังไม่ลง sprint · วันนี้ = 5 พ.ย. 2569 อยู่ใน SP08
const today = Date.UTC(2026, 10, 5);
const OLD = Object.assign({}, P.DEFAULTS, { untilMonth: '', extraSprints: 2 });   // ชุดเทสเดิม: ถึง SP10
const lay = P.layout(r.cards, OLD, today);
// ค่าเริ่มต้น = ถึง ก.พ. 2570: sprint สุดท้ายคือตัวที่เริ่มก่อน 1 มี.ค. 2570
const feb = P.layout(r.cards, P.DEFAULTS, today);
const febSprints = feb.cols.filter(c => typeof c.key === 'number');
assert.strictEqual(febSprints[febSprints.length - 1].label, 'SP16');
assert.strictEqual(febSprints[febSprints.length - 1].date, '22 ก.พ. – 5 มี.ค. 2570');
assert.ok(feb.months.some(m => m.label === 'กุมภาพันธ์ 2570'), 'มีแถบเดือน ก.พ. 2570');
assert.ok(P.layout(r.cards, Object.assign({}, P.DEFAULTS, { untilMonth: '2570-02' }), today).cols.length === feb.cols.length, 'รับปี พ.ศ. ได้');
assert.deepStrictEqual(lay.cols.map(c => c.label), ['Done · ไม่ระบุ sprint', 'SP07', 'SP08', 'SP09', 'SP10', 'ยังไม่ลง sprint']);
assert.deepStrictEqual(lay.cols.map(c => c.state), ['past', 'past', 'now', 'future', 'future', 'unscheduled']);
assert.deepStrictEqual(lay.rows.map(x => x.uc), ['1.3', '1.7', '1.23', '1.24'], 'เรียง UC ตามตัวเลข ไม่ใช่ตามตัวอักษร');
assert.strictEqual(lay.cols[2].totals.heart, 6); assert.strictEqual(lay.cols[2].totals.star, 3);
assert.strictEqual(lay.cols[0].totals.count, 1, 'การ์ด Done ไม่มี sprint ไปคอลัมน์ซ้ายสุด ไม่ปนกับ ยังไม่ลง sprint');
assert.strictEqual(lay.cols[5].totals.count, 1, 'ยังไม่ลง sprint มีแค่งานที่ยังไม่ Done');
assert.ok(lay.today && lay.today.x > 360 + 640 && lay.today.x < 360 + 960, 'เส้นวันนี้อยู่ในคอลัมน์ SP08');
// แถบเดือน/สัปดาห์ (แบบ A): เดือนแบ่งตรงวันที่ 1 จริง แม้ตัดกลาง sprint
assert.deepStrictEqual(lay.months.map(m => m.label), ['ตุลาคม 2569', 'พฤศจิกายน 2569', 'ธันวาคม 2569']);
assert.deepStrictEqual(lay.months.map(m => m.now), [false, true, false]);
const nov1 = 360 + 320 + 13 / 14 * 320;   // SP07 เริ่ม 19 ต.ค. อยู่คอลัมน์ที่ 2 (หลัง Done)
assert.ok(Math.abs(lay.months[1].x - nov1) < 0.01, 'แถบ พ.ย. เริ่มตรง 1 พ.ย.');
assert.ok(Math.abs(lay.months[0].x + lay.months[0].w - lay.months[1].x) < 0.01, 'แถบเดือนต่อกันไม่มีช่อง');
assert.strictEqual(lay.weeks.length, 8);
assert.strictEqual(lay.weeks[0].label, '19–25 ต.ค.');
assert.strictEqual(lay.weeks[1].label, '26 ต.ค. – 1 พ.ย.');
assert.deepStrictEqual(lay.weeks.filter(w => w.now).map(w => w.label), ['2–8 พ.ย.']);
const nowWeek = lay.weeks.find(w => w.now);
assert.ok(lay.today.x > nowWeek.x && lay.today.x < nowWeek.x + nowWeek.w, 'เส้นวันนี้อยู่ในช่องสัปดาห์ปัจจุบัน');
// การ์ดในช่องเดียวกันไม่ทับกัน
const sameCell = lay.placed.filter(p => p.card.uc === '1.23' && p.card.sprint === 8);
for (let i = 1; i < sameCell.length; i++) assert.ok(sameCell[i].y >= sameCell[i - 1].y + sameCell[i - 1].h, 'การ์ดในช่องเดียวกันซ้อนลงไม่ทับ');

/* ---------- build บน mock ---------- */
(async () => {
  const res = await P.build([{ name: 'test.csv', text: csv }], { untilMonth: '', extraSprints: 2 });
  assert.strictEqual(res.placed, 6);
  const secs = () => page.children.filter(n => n.type === 'SECTION' && n.name === P.SECTION_NAME);
  assert.strictEqual(secs().length, 1);
  const cards = secs()[0].children.filter(n => n.name.startsWith('card / '));
  assert.strictEqual(cards.length, 6);
  assert.ok(cards.every(c => c.text.fontName.family === 'IBM Plex Sans Thai'), 'ใช้ฟอนต์ไทย');
  const kids = secs()[0].children;
  assert.strictEqual(kids.filter(n => n.name.startsWith('month / ')).length, 3);
  assert.strictEqual(kids.filter(n => n.name.startsWith('week / ')).length, 8);
  assert.ok(kids.filter(n => n.name.startsWith('head / SP')).every(n => n.y === 96), 'หัว sprint อยู่ใต้แถบเดือน+สัปดาห์');
  await P.build([{ name: 'test.csv', text: csv }], {});
  assert.strictEqual(secs().length, 1, 'รันซ้ำไม่ซ้อน section');

  /* ---------- รันซ้ำ = update ในที่เดิม ไม่ใช่ลบแล้วสร้างใหม่ ---------- */
  const opt2 = { untilMonth: '', extraSprints: 2 };
  await P.build([{ name: 'test.csv', text: csv }], opt2);
  const sectionId1 = secs()[0].id;
  const cardIds1 = new Map(secs()[0].children.filter(n => n.name.startsWith('card / ')).map(n => [n.name, n.id]));
  assert.strictEqual(cardIds1.size, 6);

  // รันซ้ำด้วย CSV เดิมทุกใบ → section และโหนดการ์ดทุกใบต้องเป็นโหนดเดิม (id ไม่เปลี่ยน) ไม่ใช่ถูกลบสร้างใหม่
  await P.build([{ name: 'test.csv', text: csv }], opt2);
  assert.strictEqual(secs().length, 1, 'ยังมี section เดียว');
  assert.strictEqual(secs()[0].id, sectionId1, 'reuse section เดิม ไม่สร้างใหม่');
  const cardIds2 = new Map(secs()[0].children.filter(n => n.name.startsWith('card / ')).map(n => [n.name, n.id]));
  assert.strictEqual(cardIds2.size, 6);
  for (const [name, id] of cardIds1) assert.strictEqual(cardIds2.get(name), id, 'การ์ด ' + name + ' ถูก reuse โหนดเดิม (update ในที่เดิม) ไม่ใช่สร้างใหม่');

  // เอาการ์ด 1.23.1 ออกจาก CSV แล้วรันซ้ำ (เช่น เลือกไฟล์ไม่ครบ) → การ์ดเดิม "ต้องยังอยู่" ไม่ถูกลบ (ของเดิมต้องไม่หาย แม้ไฟล์รอบนี้ไม่มี)
  const csvMinusOne = csv.split('\r\n').filter(l => !l.includes('[PEA-1.23.1]')).join('\r\n');
  const res3 = await P.build([{ name: 'test.csv', text: csvMinusOne }], opt2);
  assert.strictEqual(secs().length, 1, 'ยังมี section เดียว');
  assert.strictEqual(secs()[0].id, sectionId1, 'reuse section เดิมแม้ข้อมูลเปลี่ยน');
  const cardIds3 = new Map(secs()[0].children.filter(n => n.name.startsWith('card / ')).map(n => [n.name, n.id]));
  assert.strictEqual(cardIds3.size, 6, 'ของเดิมที่ไฟล์รอบนี้ไม่มี (1.23.1) ต้องไม่ถูกลบ ยังมีครบ 6 ใบเหมือนเดิม');
  assert.strictEqual(cardIds3.get('card / 1.23.1'), cardIds2.get('card / 1.23.1'), '1.23.1 เป็นโหนดเดิม (ไม่ถูกลบแล้วสร้างใหม่ ไม่ถูกแตะเลยเพราะไม่อยู่ในไฟล์รอบนี้)');
  assert.ok(res3.kept > 0, 'build() รายงานว่ามีโหนดเดิมที่ไม่ถูกแตะรอบนี้ (เอา sprint 7 ตัวเดียวออกทำให้ช่วง sprint/เดือนที่แสดงเปลี่ยนทั้งก้อนด้วย)');
  for (const [name, id] of cardIds2) assert.strictEqual(cardIds3.get(name), id, 'การ์ดอื่นที่เหลือยังเป็นโหนดเดิม ไม่ถูกสร้างใหม่ทั้งก้อน');

  // section ต้องไม่ย่อเล็กกว่าที่เคยมี แม้รอบนี้มีการ์ดน้อยกว่าเดิม (กันของเก่าที่ยังไม่ถูกลบโดนบังด้วยขนาดใหม่)
  const sizeBefore = { w: secs()[0].width, h: secs()[0].height };
  await P.build([{ name: 'test.csv', text: '"Card Name","Current List","Labels","Due Date","Completed Date","Moved To List","Description","Checklist"\r\n"[PEA-1.1.1][SP08] x","SP08","","","","","",""' }], opt2);
  assert.ok(secs()[0].width >= sizeBefore.w && secs()[0].height >= sizeBefore.h, 'section ไม่ย่อเล็กกว่าที่เคยมี แม้ไฟล์รอบนี้มีการ์ดน้อยกว่าเดิมมาก');
  assert.strictEqual(secs()[0].children.filter(n => n.name.startsWith('card / ')).length, 7, 'การ์ดเก่าทั้ง 6 ใบยังอยู่ครบ + การ์ดใหม่ 1 ใบ = 7');

  // user ย้าย section เดิมไปอยู่ใต้โหนดอื่น (เช่น group ไว้กับของอื่นบนบอร์ด) — ต้องยังหาเจอและ reuse ไม่ใช่มองว่าหายแล้วสร้างซ้ำ
  const sectionBeforeMove = secs()[0];
  const wrapper = new MNode('FRAME');
  wrapper.name = 'กลุ่มอื่นบนบอร์ด';
  page.appendChild(wrapper);
  wrapper.appendChild(sectionBeforeMove);
  assert.strictEqual(secs().length, 0, 'ตอนนี้ section ไม่ใช่ลูกชั้นบนสุดของหน้าแล้ว (ย้ายเข้าไปอยู่ใน wrapper)');
  await P.build([{ name: 'test.csv', text: csv }], opt2);
  const secsDeep = () => page.findOne(n => n.type === 'SECTION' && n.name === P.SECTION_NAME) ? [page.findOne(n => n.type === 'SECTION' && n.name === P.SECTION_NAME)] : [];
  assert.strictEqual(page.children.filter(n => n.type === 'SECTION' && n.name === P.SECTION_NAME).length, 0, 'ไม่สร้าง section ใหม่ซ้อนที่ชั้นบนสุด');
  assert.strictEqual(secsDeep()[0].id, sectionId1, 'หา section เดิมเจอแม้ถูกย้ายไปอยู่ใต้โหนดอื่น แล้ว reuse ต่อ (ไม่ใช่สร้างใหม่จนดูเหมือนของเดิมหาย)');

  // ไฟล์จริงที่ส่งมาทาง argv
  const files = process.argv.slice(2);
  if (files.length) {
    const texts = files.map(f => ({ name: path.basename(f), text: fs.readFileSync(f, 'utf8') }));
    logs.length = 0;
    const out = await P.build(texts, {});
    console.log(logs.join('\n'));
    const s = secs()[0];
    console.log('คอลัมน์:', s.children.filter(n => n.name.startsWith('head / ') && n.name !== 'head / corner').map(n => n.name.slice(7)).join(' · '));
    console.log('แถว:', s.children.filter(n => n.name.startsWith('uc / ')).map(n => n.name.slice(5)).join(' · '));
    console.log('ขนาด section:', s.width + ' × ' + s.height, '· การ์ด', out.placed);
  }
  console.log('✓ test-figjam-calendar-plugin ผ่านทั้งหมด');
})().catch(e => { console.error('✗', e); process.exit(1); });
