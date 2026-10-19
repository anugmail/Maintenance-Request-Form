#!/usr/bin/env node
/* ============================================================
   Flow จำหน่ายยานพาหนะ → สเปกผังสำหรับบอร์ด FigJam (out/diagram-disposal.json)
   ------------------------------------------------------------
   ปลายทาง = บอร์ด "Planning 1-2" หน้า "โอนย้าย--จำหน่าย"
     https://www.figma.com/board/F7fvpwbTkpR4u8FAujNUaw/Planning-1-2?node-id=3337-35921
   หน้าตายกจาก section "Template" (node 6382:52992) ของบอร์ดนั้น — อ่านค่าจริงผ่าน MCP 5 ต.ค. 2569:
     start/End = ELLIPSE 112 ขาว เส้นเทา · Action = ELLIPSE 176 ฟ้า · Display = SQUARE 176 เขียวน้ำทะเล ·
     Decision = DIAMOND 176 ม่วง · เส้นทุกเส้น 4px · เส้นเชื่อม ELBOWED 4px สีตามกล่องต้นทาง · ARROW_LINES
   ⚠️ เขียนลงบอร์ด Planning 1-2 ผ่าน MCP ตรงๆ ไม่ได้ (ทั้ง 2 บัญชีไม่มี Full seat/สิทธิ์แก้ในทีมเจ้าของบอร์ด)
      ⇒ 5 ต.ค. 2569 วาดไว้ที่ไฟล์ร่าง https://www.figma.com/board/igZcpfUndwQbr3a6UIshdV (copy section ไปวาง)
      หรือรันปลั๊กอิน figjam-plugin ด้วยสิทธิ์ของผู้ใช้เองใน Figma desktop

   ต้นทางของเนื้อหา = Diagram/06-จำหน่ายทรัพย์สิน/01-จำหน่ายยานพาหนะ.md (ผัง D0–D13) · **แก้ทั้งสองที่ให้ตรงกัน**
   ขั้นที่ยังไม่ยืนยัน: "❓" ในป้าย + เส้นประ · คำถามค้างเป็น sticky เหลือง (บอร์ดนี้จดคำถามเป็น sticky อยู่แล้ว)

   รัน:  node figma-export/6-flow-disposal.js
         node figma-export/3-figjam-board.js --disposal --only
         node figma-export/serve.js   → เปิดบอร์ด Planning 1-2 → ⌘⌥P (Maintain-D → FigJam board)
   ============================================================ */

const fs = require('fs');
const path = require('path');

const rgb = (r, g, b) => ({ r, g, b });
const GRAY = rgb(0.4588235318660736, 0.4588235318660736, 0.4588235318660736);
const ST = {
  end:      { size: 112, fill: rgb(1, 1, 1), stroke: GRAY },
  action:   { size: 176, fill: rgb(0.7607843279838562, 0.8980392217636108, 1), stroke: rgb(0.239215686917305, 0.6784313917160034, 1) },
  display:  { size: 176, fill: rgb(0.7764706015586853, 0.9803921580314636, 0.9647058844566345), stroke: rgb(0.3529411852359772, 0.8470588326454163, 0.800000011920929) },
  decision: { size: 176, fill: rgb(0.8627451062202454, 0.800000011920929, 1), stroke: rgb(0.529411792755127, 0.30980393290519714, 1) }
};

const MID = 700;                      // แนวกลางของ flow หลัก
const COL = (i) => 40 + i * 280;      // ระยะคอลัมน์ — กล่อง 176 + ช่องให้เส้นหักมุม
const nodes = [];
function node(id, kind, label, x, y) {
  const s = ST[kind];
  nodes.push({
    id, kind, label, x, y: y === undefined ? MID - s.size / 2 : y, w: s.size, h: s.size,
    fill: s.fill, stroke: s.stroke, strokeWeight: 4, fontSize: 14
  });
}

node('S', 'end', 'เริ่ม', COL(0));
// จุดเริ่ม 5 ทาง ซ้อนแนวตั้งในคอลัมน์เดียว
[
  ['D0a', 'display', 'ระบบแจ้ง\nรถเข้าข่าย\nอายุ > 20 ปี /\nค่าซ่อม > 30%'],
  ['D0b', 'action',  'กบค.\nประเมินแล้ว\nไม่คุ้มซ่อม ❓'],
  ['D0c', 'action',  'กรรมการ\nOverhaul\nเสนอจำหน่าย ❓'],
  ['D0d', 'action',  'ได้รถทดแทน\nแล้ว\n(เริ่มนับ 90 วัน)'],
  ['D0e', 'action',  'หน่วยงาน\nแจ้งเลิกใช้เอง']
].forEach(([id, k, t], i) => node(id, k, t, COL(1), MID - 88 + (i - 2) * 216));

node('D1',  'action',   'หน่วยงาน\nผู้ครอบครอง\nเปิดเรื่อง\nเสนอจำหน่าย', COL(2));
node('D2',  'display',  'ระบบส่งเรื่อง\nตามสังกัด\nสนญ. → กบค.\nกฟข. → กรย.\nสถานะ: หมดสภาพ', COL(3));
node('D3',  'decision', 'กบค./กรย.\nเห็นควร\nจำหน่าย?', COL(4));
node('D3x', 'end',      'ไม่\nจำหน่าย ❓', COL(4) + 32, MID + 260);
node('D4',  'action',   'ผู้มีอำนาจ ❓\nอนุมัติ\nในหลักการ\n(ภายใน 90 วัน)\n→ รอจำหน่าย', COL(5));
// เช็กลิสต์ข้อ 25.1–25.5 — วาดคู่ขนาน ❓ ลำดับยังไม่ยืนยัน
[
  ['D5', 'หยุดชำระภาษี\n+ คืนป้าย\nทะเบียน'],
  ['D6', 'ระงับประกัน\n+ คืนป้าย\nพ.ร.บ.'],
  ['D7', 'ลบตรา /\nรหัส กฟภ.\nออกจากรถ'],
  ['D8', 'มีเครื่องจักรกล\nทุ่นแรง\n→ แจ้ง กบค.']
].forEach(([id, t], i) => node(id, 'action', t, COL(6), MID - 88 + (i - 1.5) * 216));
node('D9',  'action',  'ผู้มีอำนาจ ❓\nอนุมัติ\nจำหน่าย\nออกจากบัญชี', COL(7));
node('D10', 'action',  'คณะกรรมการ\nขาย (60 วัน)\nพร้อมเล่ม /\nขายซาก', COL(8));
node('D11', 'action',  'การเงิน\nรับเงิน\nจากการขาย', COL(9));
node('D12', 'action',  'บัญชีตัด\nออกจากบัญชี\nทรัพย์สิน\n(SAP AA)', COL(10));
node('D13', 'display', 'สถานะรถ:\nจำหน่ายแล้ว\nค้นประวัติ\nย้อนหลังได้', COL(11));
node('E',   'end',     'จบ', COL(12));

const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
const edges = [];
function edge(from, to, label = '', dashed = false, ms = 'RIGHT', me = 'LEFT') {
  if (!byId[from] || !byId[to]) throw new Error('เส้นชี้ node ที่ไม่มี: ' + from + '→' + to);
  edges.push({
    from, to, label, style: dashed ? 'dotted' : 'solid', dash: dashed ? [10, 10] : undefined,
    color: byId[from].stroke, weight: 4, lineType: 'ELBOWED', ms, me
  });
}
['D0a', 'D0b', 'D0c', 'D0d', 'D0e'].forEach(t => edge('S', t));
edge('D0a', 'D1');
edge('D0b', 'D1', '', true);
edge('D0c', 'D1', '', true);
edge('D0d', 'D1');
edge('D0e', 'D1');
edge('D1', 'D2');
edge('D2', 'D3');
edge('D3', 'D4', 'ใช่');
edge('D3', 'D3x', 'ไม่', true, 'BOTTOM', 'TOP');
['D5', 'D6', 'D7'].forEach(d => edge('D4', d));
edge('D4', 'D8', 'ถ้ามี');
['D5', 'D6', 'D7', 'D8'].forEach(d => edge(d, 'D9'));
edge('D9', 'D10');
edge('D10', 'D11');
edge('D11', 'D12');
edge('D12', 'D13');
edge('D13', 'E');

// คำถามค้าง (เลข Q ตรงกับไฟล์ .md) — วางแถวล่าง ใต้ขั้นที่เกี่ยว
const YELLOW = rgb(0xFF / 255, 0xE2 / 255, 0x99 / 255);
const QY = 1260;
const stickies = [
  [COL(1) - 30,  'Q1 ❓ เกณฑ์ 30% คิดจาก "ค่าซ่อมครั้งนี้" หรือ "ค่าซ่อมสะสม"? รวมค่าแรง/ค่าเดินทางไหม'],
  [COL(4) - 30,  'Q5 ❓ ครบเกณฑ์แล้วบังคับจำหน่าย หรือแค่ให้พิจารณา? ถ้าไม่เห็นควร รถกลับไปสถานะไหน'],
  [COL(5) + 250, 'Q8 ❓ ใครอนุมัติ? "อนุมัติในหลักการ" กับ "อนุมัติจำหน่าย" (ข้อ 25.4) เป็น 2 ครั้งหรือครั้งเดียว'],
  [COL(7) + 250, 'Q10 ❓ คืนป้าย / ระงับประกัน / ลบตรา ต้องทำก่อนอนุมัติจำหน่ายจริงไหม? ถ้าไม่อนุมัติทำยังไง'],
  [COL(9) - 30,  'Q14 ❓ ระบบต้องทำการขาย/ประมูลเอง หรือแค่บันทึกผล (ผู้ซื้อ · ราคา · สัญญา)?'],
  [COL(10) + 250, 'Q13 ❓ บริจาค / โอนให้หน่วยงานรัฐ / ทำลาย ใช้ระเบียบพัสดุฉบับไหน? (ระเบียบยานพาหนะมีแค่ "ขาย")']
].map(([x, text]) => ({ x, y: QY, text, color: YELLOW }));

const spec = {
  w: COL(12) + 112 + 40,
  h: QY + 300,
  // Template ใช้ Inter Bold แต่ Inter ไม่มีอักษรไทย (เรนเดอร์ฝั่งเซิร์ฟเวอร์ของ Figma ไม่มี fallback → ข้อความหาย)
  // ⇒ ใช้ IBM Plex Sans Thai Bold แทน · ขนาด 14 + ตัดบรรทัดเองตามคำ (ไทยไม่มีช่องว่าง วงกลม 176 จะตัดกลางคำ)
  font: { family: 'IBM Plex Sans Thai', style: 'Bold' },
  phases: [],
  clusters: [],
  nodes,
  edges,
  stickies
};

const out = path.join(__dirname, 'out', 'diagram-disposal.json');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(spec));
console.log('flow จำหน่าย: node ' + nodes.length + ' · เส้น ' + edges.length + ' · sticky ' + stickies.length +
  ' · ขนาด ' + spec.w + '×' + spec.h);
console.log('เขียน ' + path.relative(path.join(__dirname, '..'), out));
