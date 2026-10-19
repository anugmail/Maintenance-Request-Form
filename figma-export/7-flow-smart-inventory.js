#!/usr/bin/env node
/* ============================================================
   Flow เบิกวัสดุผ่าน Smart Inventory → สเปกผัง swimlane สำหรับบอร์ด FigJam (out/diagram-smart-inventory.json)
   ------------------------------------------------------------
   ต้นทางของเนื้อหา = "flow-smart inventory.pdf" (รากโปรเจกต์ · sequence diagram ได้มา 9 ต.ค. 2569)
     เลือกวัสดุ → จองวัสดุ → กบค. คลังดำเนินการ → Scan Barcode → SAP ตัด Stock → Callback → Update Status
   แปลงจาก sequence (เส้นชีวิต 5 ตัว) เป็น swimlane: **เลน = actor (แถวแนวนอน) · flow ไหลซ้าย→ขวา**
   หน้าตายก Template ชุดเดียวกับ 6-flow-disposal.js (บอร์ด Planning 1-2 section "Template" node 6382:52992):
     start/End = ELLIPSE 112 ขาว · Action = ELLIPSE 176 ฟ้า · Display = SQUARE 176 เขียวน้ำทะเล ·
     Decision = DIAMOND 176 ม่วง · เส้น ELBOWED 4px สีตามกล่องต้นทาง
   ⇒ Action = สิ่งที่ actor ลงมือทำ/ระบบเรียก API · Display = ผลที่แสดง/สถานะที่บันทึก
   Request/Response body จาก PDF → sticky เทาแถวล่าง (ใต้คอลัมน์ของขั้นนั้น) · คำถามค้าง → sticky เหลือง

   9 ต.ค. 2569 วาดผ่าน Figma MCP ไว้ที่บอร์ด https://www.figma.com/board/OOozcSP8rZtUtFDpI15sFy (section 1:2)
     — ไฟล์ร่าง igZcpfUndwQbr3a6UIshdV ของ flow จำหน่าย บัญชี MCP ไม่มีสิทธิ์แก้ เลยสร้างบอร์ดใหม่ในทีมส่วนตัว

   รัน:  node figma-export/7-flow-smart-inventory.js
         node figma-export/3-figjam-board.js --inventory --only
         node figma-export/serve.js   → เปิดบอร์ด → ⌘⌥P (Maintain-D → FigJam board)
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

/* ---------- เลน = เส้นชีวิตใน PDF เรียงบนลงล่างตามลำดับเดิม ---------- */
const LANES = [
  { id: 'tech', label: 'ช่าง กบค.' },
  { id: 'md',   label: 'Maintain-D' },
  { id: 'si',   label: 'Smart Inventory' },
  { id: 'wh',   label: 'กบค. คลัง' },
  { id: 'sap',  label: 'SAP' }
];

/* ---------- ขั้น (ป้ายตัดบรรทัดเอง — ไทยไม่มีช่องว่าง วงกลม 176 จะตัดกลางคำ) ----------
   col = คอลัมน์ซ้าย→ขวา · row = แถวในเลน (0 = ทางหลัก/อนุมัติ · 1 = ทางปฏิเสธ) */
const NODES = [
  ['S',  'tech', 0,  'end',      'เริ่ม'],
  ['T1', 'tech', 1,  'action',   'เลือกรถ\nที่ต้องการซ่อม\n+ ระบุอาการ\nรายละเอียด\nงานซ่อม'],
  ['T2', 'tech', 2,  'action',   'เข้าหน้า\nเบิกอะไหล่'],
  ['M1', 'md',   3,  'action',   'ขอข้อมูลวัสดุ\nPOST\n/inventory/\ndetails/query'],
  ['I1', 'si',   4,  'action',   'ส่งข้อมูล\nราคาวัสดุ\n+ จำนวน\nคงเหลือ'],
  ['M2', 'md',   5,  'display',  'แสดงรายการวัสดุ\nชื่อ · Material Code\nMoving / Standard\nPrice\nคงเหลือ · หน่วย'],
  ['T3', 'tech', 6,  'action',   'เลือกวัสดุ\nใส่ Shopping\nCart + ตรวจ\nรายการ/จำนวน'],
  ['T4', 'tech', 7,  'action',   'กด Submit\nขอจองวัสดุ'],
  ['M3', 'md',   8,  'action',   'ส่งคำขอจอง\nPOST\n/inventory/\nrequisitions'],
  ['I2', 'si',   9,  'action',   'ตรวจรายการ\n+ จำนวน\nที่ขอจอง\n→ สร้าง\nRequisition'],
  ['M4', 'md',   10, 'display',  'บันทึก\nrequisition_code\nผูกกับงานซ่อม\nสถานะ:\nรออะไหล่\n(WAITING_FOR_\nMATERIALS)'],
  ['T5', 'tech', 11, 'display',  'เห็นสถานะ\nรออะไหล่\n+ เลขการจอง'],
  ['I3', 'si',   11, 'display',  'สร้างใบจอง\nจาก Requisition\nแสดงรายการ\nใบจองให้คลัง'],
  ['W1', 'wh',   12, 'action',   'เลือกใบจอง\n+ เลือกผู้\nที่จะเป็น\nผู้เบิกวัสดุ'],
  ['W2', 'wh',   13, 'decision', 'คลัง\nดำเนินการ\nเบิก?'],
  // ทางอนุมัติ
  ['W3', 'wh',   15, 'action',   'ยืนยัน\nรายการจอง'],
  ['I4', 'si',   16, 'display',  'ออกเอกสาร\nใบจอง /\nใบเบิก'],
  ['W4', 'wh',   17, 'action',   'เตรียมวัสดุ\nตามรายการ\nในใบจอง'],
  ['W5', 'wh',   18, 'action',   'Scan Barcode\nจากใบจอง /\nใบเบิก'],
  ['I5', 'si',   19, 'action',   'อ่าน Barcode\nตรวจ requisition\n_code + Material\nCode + จำนวน\nที่เบิกจริง'],
  ['I6', 'si',   20, 'action',   'ส่งข้อมูลเบิก\nเพื่อทำ\nGoods Issue /\nตัด Stock'],
  ['P1', 'sap',  21, 'action',   'ตรวจ\nรายการเบิก\n→ ตัด Stock\nตามจำนวน\nที่เบิกจริง'],
  ['P2', 'sap',  22, 'display',  'Goods Issue\nSuccess\nStock Updated'],
  ['I7', 'si',   23, 'action',   'Callback\nPOST /maintain-d\n/api/requisition\n/callback\n(พร้อมรับ)'],
  ['M5', 'md',   24, 'display',  'ค้นงานซ่อมจาก\nrequisition_code\nสถานะ:\nอะไหล่พร้อมใช้งาน\n(MATERIALS_\nREADY_FOR_\nPICKUP)'],
  ['T6', 'tech', 25, 'display',  'เห็นสถานะ\nอะไหล่\nพร้อมใช้งาน'],
  ['E',  'tech', 26, 'end',      'จบ'],
  // ทางปฏิเสธ — คอลัมน์เดียวขึ้นตรงๆ (คลัง → SI → Maintain-D → ช่าง) ไม่ให้เส้นซ้อนกับทางอนุมัติ
  // ไม่ออกวัสดุ · ไม่ Scan · ไม่ส่ง Goods Issue · Stock ไม่เปลี่ยน
  ['R1', 'wh',   14, 'action',   'ปฏิเสธ\nรายการจอง\n+ ระบุเหตุผล', 1],
  ['R2', 'si',   14, 'action',   'Callback\nPOST /maintain-d\n/api/requisition\n/callback\n(ปฏิเสธ)'],
  ['R3', 'md',   14, 'display',  'ค้นงานซ่อมจาก\nrequisition_code\nสถานะ:\nปฏิเสธการเบิก\nอะไหล่\n(REQUISITION_\nREJECTED)'],
  ['R4', 'tech', 14, 'display',  'เห็นสถานะ\nปฏิเสธการเบิก\nอะไหล่ +\nเหตุผล'],
  ['RE', 'tech', 15, 'end',      'จบ\n(ไม่ได้\nวัสดุ)']
];

const EDGES = [
  ['S', 'T1'], ['T1', 'T2'], ['T2', 'M1'], ['M1', 'I1'],
  ['I1', 'M2', 'ตอบกลับ\nราคา/คงเหลือ'],
  ['M2', 'T3'], ['T3', 'T4'], ['T4', 'M3'], ['M3', 'I2'],
  ['I2', 'M4', 'ตอบกลับ\nเลขการจอง'],
  ['M4', 'T5'], ['I2', 'I3'], ['I3', 'W1'], ['W1', 'W2'],
  ['W2', 'W3', 'อนุมัติ'],
  ['W3', 'I4'], ['I4', 'W4'], ['W4', 'W5'], ['W5', 'I5'], ['I5', 'I6'],
  ['I6', 'P1'], ['P1', 'P2'], ['P2', 'I7'], ['I7', 'M5'], ['M5', 'T6'], ['T6', 'E'],
  ['W2', 'R1', 'ปฏิเสธ', 'BOTTOM', 'LEFT'],
  ['R1', 'R2'], ['R2', 'R3'], ['R3', 'R4'], ['R4', 'RE']
];

/* ---------- ขนาด/ระยะ ---------- */
const LANE_LABEL_W = 300;   // แถบชื่อเลนทางซ้าย
const COL_W = 280;          // กล่อง 176 + ช่องให้เส้นหักมุม (เท่า 6-flow-disposal.js)
const ROW_GAP = 64;
const LANE_PAD = 56;
const BOX = 176;

function main() {
  const laneRows = {};
  for (const [, lane, , , , row = 0] of NODES) laneRows[lane] = Math.max(laneRows[lane] || 1, row + 1);

  const maxCol = Math.max(...NODES.map(n => n[2]));
  const W = LANE_LABEL_W + (maxCol + 1) * COL_W;
  const clusters = [];
  const laneY = {};
  let y = 0;
  for (const l of LANES) {
    const rows = laneRows[l.id] || 1;
    const h = rows * BOX + (rows - 1) * ROW_GAP + LANE_PAD * 2;
    clusters.push({ label: l.label, x: 0, y, w: W, h });
    laneY[l.id] = y;
    y += h;
  }
  const lanesBottom = y;

  const nodes = NODES.map(([id, lane, col, kind, label, row = 0]) => {
    if (laneY[lane] === undefined) throw new Error('ไม่รู้จักเลน "' + lane + '" ของ ' + id);
    const s = ST[kind];
    const off = (BOX - s.size) / 2;   // start/End 112 ให้อยู่กลางช่อง 176
    return {
      id, kind, label,
      x: LANE_LABEL_W + col * COL_W + (COL_W - BOX) / 2 + off,
      y: laneY[lane] + LANE_PAD + row * (BOX + ROW_GAP) + off,
      w: s.size, h: s.size,
      fill: s.fill, stroke: s.stroke, strokeWeight: 4, fontSize: 14
    };
  });
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const laneOf = Object.fromEntries(NODES.map(n => [n[0], n[1]]));
  const colOf = Object.fromEntries(NODES.map(n => [n[0], n[2]]));
  const laneIdx = Object.fromEntries(LANES.map((l, i) => [l.id, i]));

  const edges = EDGES.map(([from, to, label = '', ms, me]) => {
    if (!byId[from] || !byId[to]) throw new Error('เส้นชี้ node ที่ไม่มี: ' + from + '→' + to);
    // คอลัมน์เดียวกันคนละเลน → ลงตรงๆ บน/ล่าง · ที่เหลือออกขวาเข้าซ้าย (หักมุมระหว่างคอลัมน์)
    if (!ms && colOf[from] === colOf[to] && laneOf[from] !== laneOf[to]) {
      const down = laneIdx[laneOf[to]] > laneIdx[laneOf[from]];
      ms = down ? 'BOTTOM' : 'TOP'; me = down ? 'TOP' : 'BOTTOM';
    }
    return {
      from, to, label, style: 'solid', color: byId[from].stroke, weight: 4,
      lineType: 'ELBOWED', ms: ms || 'RIGHT', me: me || 'LEFT'
    };
  });

  /* ---------- sticky: payload จาก PDF (เทา) + คำถามค้าง (เหลือง) ---------- */
  const PAYLOAD = rgb(0xE6 / 255, 0xE6 / 255, 0xE6 / 255);
  const YELLOW = rgb(0xFF / 255, 0xE2 / 255, 0x99 / 255);
  const colX = (c) => LANE_LABEL_W + c * COL_W - 20;
  const PY = lanesBottom + 80;
  const QY = PY + 340;
  const stickies = [
    [3, PY, PAYLOAD, 'POST /inventory/details/query\nRequest\n{ "materialCodes": ["2-34-010-0640", "2-37-009-0010"] }'],
    [4.9, PY, PAYLOAD, 'Response (ต่อรายการ)\nmaterial_code · name · moving_price · standard_price · balance · unit\nเช่น 2-34-010-0640 น้ำมันเครื่อง 250.00 / 180.00 คงเหลือ 850.00 ลิตร'],
    [8, PY, PAYLOAD, 'POST /inventory/requisitions\nheader · dept_sap "3909" · division · department · vehicle_plate · send_to "กอง/คลังพัสดุ" · requested_by "กบค"\nmaterials: [{ material_code, requested_amount }]'],
    [9.9, PY, PAYLOAD, 'Response\n{ "status_code": "WAITING_FOR_MATERIALS", "message": "รออะไหล่", "requisition_code": "6908000109" }'],
    [14, PY, PAYLOAD, 'Callback (ปฏิเสธ)\n{ "status_code": "REQUISITION_REJECTED", "desc": "ไม่สามารถอนุมัติรายการเบิกวัสดุได้ เนื่องจากข้อมูลรายการเบิกไม่ถูกต้อง", "requisition_code": "6908000109" }'],
    [20, PY, PAYLOAD, 'ส่ง SAP เพื่อตัด Stock\nrequisition_code = 6908000109\n2-37-009-0010 · 100.00 ลิตร\n2-34-010-0640 · 100.00 ลิตร'],
    [23, PY, PAYLOAD, 'Callback (พร้อมรับ)\n{ "status_code": "MATERIALS_READY_FOR_PICKUP", "desc": "อะไหล่พร้อม ให้มาเอาไปใช้แล้ว", "requisition_code": "6908000109" }'],
    [25, PY, PAYLOAD, 'สถานะใน Maintain-D\nWAITING_FOR_MATERIALS = รออะไหล่\nMATERIALS_READY_FOR_PICKUP = อะไหล่พร้อมใช้งาน\nREQUISITION_REJECTED = ปฏิเสธการเบิกอะไหล่'],
    // คำถามค้าง — PDF ไม่ได้ระบุ
    [5, QY, YELLOW, '❓ คงเหลือไม่พอตอนเลือกลง Cart — ให้จองได้ไหม หรือบล็อกตั้งแต่หน้าเลือก?'],
    [9, QY, YELLOW, '❓ Smart Inventory ตรวจแล้วไม่ผ่าน (ของไม่พอ/รหัสผิด) ตอบกลับอะไร? PDF มีแต่ทางสำเร็จ'],
    [11, QY, YELLOW, '❓ ช่างแก้ไข/ยกเลิกใบจองหลัง Submit ได้ไหม? ใบจองมีวันหมดอายุไหม'],
    [18, QY, YELLOW, '❓ เบิกจริงน้อยกว่าที่ขอ (เบิกบางส่วน) — callback ส่งจำนวนจริงกลับมาไหม'],
    [22, QY, YELLOW, '❓ SAP ตัด Stock ไม่สำเร็จ — retry / แจ้งใคร? สถานะใน Maintain-D เป็นอะไร'],
    [24, QY, YELLOW, '❓ ช่างกด "รับของแล้ว" ในระบบไหม หรือ MATERIALS_READY_FOR_PICKUP คือจบ']
  ].map(([c, sy, color, text]) => ({ x: colX(c), y: sy, text, color }));

  const spec = {
    w: W,
    h: QY + 300,
    // Inter ไม่มีอักษรไทย (ดู 6-flow-disposal.js) ⇒ IBM Plex Sans Thai Bold ขนาด 14
    font: { family: 'IBM Plex Sans Thai', style: 'Bold' },
    phases: [],
    clusters,
    nodes,
    edges,
    stickies
  };

  const out = path.join(__dirname, 'out', 'diagram-smart-inventory.json');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(spec));
  const count = (k) => nodes.filter(n => n.kind === k).length;
  console.log('flow Smart Inventory: เลน ' + clusters.length + ' · node ' + nodes.length +
    ' (action ' + count('action') + ' · display ' + count('display') + ' · decision ' + count('decision') + ')' +
    ' · เส้น ' + edges.length + ' · sticky ' + stickies.length + ' · ขนาด ' + spec.w + '×' + spec.h);
  console.log('เขียน ' + path.relative(path.join(__dirname, '..'), out));
}

main();
