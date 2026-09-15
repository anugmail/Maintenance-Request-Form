#!/usr/bin/env node
/* ============================================================
   Swimlane จริง → สเปกผังสำหรับบอร์ด FigJam (out/diagram-repair-swimlane.json)
   ------------------------------------------------------------
   ทำไมไม่ใช้ mermaid เหมือนผังอื่น (4-figjam-diagram.js):
     **mermaid ไม่มี swimlane** — `subgraph` คือกล่องจัดกลุ่ม ไม่ใช่เลน
     layout engine วางกล่องตาม topology ของเส้น ⇒ เลนไม่เรียงเป็นแถวแนวนอน
     (ทดลองแล้ว 15 ก.ย. 2569 ทั้ง TB และ LR — เลนเยื้อง/ซ้อนกันมั่ว)
   ⇒ ไฟล์นี้คำนวณพิกัดเอง: **เลน = แถวแนวนอน · flow ไหลซ้าย→ขวา**
     ตามที่เจ้าของงานสั่ง 15 ก.ย. 2569

   ผลลัพธ์เป็นสเปกชุดเดียวกับ 4-figjam-diagram.js (w/h/clusters/nodes/edges)
   ⇒ figjam-plugin วาดได้เลย ไม่ต้องแก้ปลั๊กอิน

   ต้นทางของเนื้อหา = ตาราง 21 สถานะที่เจ้าของงานกรอกส่งมา 15 ก.ย. 2569
   (ผัง mermaid ที่อ่านง่ายสำหรับ GitHub ยังอยู่ที่
    Diagram/02-แจ้งซ่อม-กบค/06-swimlane-โฟลว์ซ่อมทั้งเส้น.md — แก้ทั้งสองที่ให้ตรงกัน)

   ⚠️ label ไม่ใส่เลข S นำหน้า (เจ้าของงานสั่ง 15 ก.ย. 2569 — รกเวลาคนทั่วไปอ่าน)
      แต่ `id` ยังเป็น S1..S21 ตรงกับแถวในตาราง 21 สถานะ ใช้อ้างอิงข้าม map-03/map-04 ได้เหมือนเดิม

   รัน:  node figma-export/5-swimlane.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

/* ---------- เลน (actor) เรียงบนลงล่าง ---------- */
const LANES = [
  { id: 'unit', label: '👤 หน่วยงานต้นทาง / ผู้แจ้งซ่อม' },
  { id: 'boss', label: '👔 หัวหน้าหน่วยงานต้นทาง' },
  { id: 'kry',  label: '🏢 กรย. / แผนก ผยค.' },
  { id: 'kbk',  label: '🔧 กบค. (แผนก A / B / C)' },
  { id: 'sup',  label: '📦 กบค. พัสดุ / แผนกผู้รับผิดชอบ' }
];

/* ---------- ช่วงงาน (คอลัมน์) เรียงซ้าย→ขวา ----------
   หัวคอลัมน์ช่วยให้อ่านแกนนอนออกว่า "ตอนนี้อยู่ช่วงไหนของกระบวนการ"
   ไม่ใช่แค่กล่องลอยๆ — เป็นหลักการพื้นฐานของ swimlane ที่อ่านง่าย */
const PHASES = [
  'เปิดเรื่อง', 'หัวหน้าอนุมัติ', 'กรย. คัดกรอง', 'กบค. รับเรื่อง',
  'เตรียมอะไหล่', 'นัดหมาย', 'ดำเนินการซ่อม', 'ส่งมอบรถ', 'ปิดงาน'
];

/* ---------- สถานะ ----------
   col = ดัชนีช่วงงานใน PHASES (คอลัมน์เดียวกัน = อยู่ช่วงเดียวกันของโฟลว์)
   lane = อยู่เลนไหน · kind: process | stadium | circle | decision
   cf = รอเจ้าของงาน CF แต่ทำก่อนได้ (S7/S9/S11) */
const NODES = [
  { id: 'A0',  lane: 'unit', col: 0,  kind: 'circle',  label: 'กรอกใบแจ้งซ่อม' },
  { id: 'S1',  lane: 'boss', col: 1,  label: 'รอหัวหน้าหน่วยงานอนุมัติ' },

  { id: 'S3',  lane: 'unit', col: 1,  kind: 'stadium', label: 'ไม่อนุมัติ' },
  { id: 'S4',  lane: 'unit', col: 1,  label: 'รอผู้แจ้งซ่อมดำเนินการ (ตีกลับ)' },
  { id: 'S2',  lane: 'unit', col: 2,  label: 'รอหน่วยงานดำเนินการซ่อมเอง' },

  { id: 'S6',  lane: 'kry',  col: 2,  label: 'รอ กรย. พิจารณา' },
  { id: 'S5',  lane: 'unit', col: 2,  label: 'ส่งกลับต้นทางซ่อมเอง' },
  { id: 'S7',  lane: 'kry',  col: 3,  cf: true, label: 'กรย. เห็นชอบ — รอหน่วยงานซ่อมเอง' },
  { id: 'S8',  lane: 'kry',  col: 3,  label: 'รอ กรย. ดำเนินการ' },
  { id: 'S9',  lane: 'kry',  col: 3,  cf: true, label: 'กรย. ส่งซ่อมศูนย์บริการ/อู่' },

  { id: 'S10', lane: 'kbk',  col: 3,  label: 'รอ กบค. พิจารณา (routing ประเภทรถ × ภาค)' },
  { id: 'S11', lane: 'kbk',  col: 3,  cf: true, label: 'กบค. เห็นชอบ — รอหน่วยงานซ่อมเอง' },
  { id: 'S12', lane: 'kbk',  col: 4,  label: 'รอเตรียมอะไหล่' },
  { id: 'B1',  lane: 'sup',  col: 4,  label: 'จัดอะไหล่ตามรายการที่เบิก' },
  { id: 'S13', lane: 'unit', col: 5,  label: 'รอต้นทางยืนยันนัดหมาย' },
  { id: 'S14', lane: 'kbk',  col: 5,  label: 'พร้อมดำเนินการซ่อม' },
  { id: 'S15', lane: 'kbk',  col: 6,  label: 'อยู่ระหว่างดำเนินการซ่อม' },

  { id: 'S17', lane: 'kbk',  col: 6, label: 'พบอาการเพิ่มเติม — รอ กบค. ประเมิน' },
  { id: 'S18', lane: 'unit', col: 6, label: 'รอต้นทางพิจารณาอาการเพิ่มเติม' },
  { id: 'S16', lane: 'kbk',  col: 7, label: 'ซ่อมเสร็จ — รอส่งมอบรถ' },

  { id: 'S19', lane: 'unit', col: 7, label: 'รอต้นทางยืนยันรับรถ' },
  { id: 'S20', lane: 'unit', col: 7, label: 'รอต้นทางรับรถกลับไปใช้งาน' },
  { id: 'S21', lane: 'kbk',  col: 8, kind: 'stadium', label: 'ปิดงาน' }
];

const EDGES = [
  ['A0', 'S1', ''],
  ['S1', 'S3', 'ไม่อนุมัติ'],
  ['S1', 'S4', 'ตีกลับผู้แจ้งซ่อม'],
  ['S4', 'S1', 'แก้ไขแล้วส่งใหม่'],
  ['S1', 'S2', 'อนุมัติ · ต้นทางซ่อมเอง'],
  ['S1', 'S6', 'อนุมัติ · ส่งต่อ กรย.'],
  ['S6', 'S7', 'เห็นชอบ ให้ต้นทางซ่อมเอง', 'dotted'],
  ['S6', 'S5', 'ส่งกลับต้นทาง'],
  ['S6', 'S8', 'กรย. รับดำเนินการเอง'],
  ['S6', 'S9', 'ส่งซ่อมศูนย์บริการ/อู่', 'dotted'],
  ['S6', 'S10', 'ส่งซ่อม กบค.'],
  ['S7', 'S2', '', 'dotted'],
  ['S5', 'S2', ''],
  ['S2', 'S21', 'บันทึกผลซ่อม'],
  ['S8', 'S21', 'กรย. ซ่อมเสร็จ'],
  ['S8', 'S10', 'ต้องให้ กบค. ซ่อม'],
  ['S9', 'S21', 'อู่ซ่อมเสร็จ', 'dotted'],
  ['S10', 'S11', 'เห็นชอบ ให้หน่วยงานซ่อมเอง', 'dotted'],
  ['S10', 'S8', 'ส่งคืน กรย.'],
  ['S10', 'S12', 'รับซ่อม'],
  ['S11', 'S21', 'ซ่อมเสร็จ', 'dotted'],
  ['S12', 'B1', ''],
  ['B1', 'S13', 'อะไหล่พร้อม'],
  ['S13', 'S14', 'ต้นทางเลือกวันนัด'],
  ['S14', 'S15', 'รับรถ · ตรวจสภาพก่อนซ่อม'],
  ['S15', 'S17', 'พบอาการเพิ่มเติม'],
  ['S15', 'S16', 'ซ่อมเสร็จสิ้น'],
  ['S17', 'S18', 'ส่งให้ต้นทางตัดสิน'],
  ['S18', 'S12', 'เห็นชอบให้ซ่อมเพิ่ม'],
  ['S18', 'S16', 'ไม่ซ่อมเพิ่ม'],
  ['S16', 'S19', 'เปิดช่วงนัดรับรถ'],
  ['S19', 'S20', 'ยืนยันนัดรับ'],
  ['S20', 'S21', 'ตรวจสภาพหลังซ่อม · ส่งมอบ']
];

/* ---------- ขนาด/ระยะ (หน่วยเดียวกับที่ 4-figjam-diagram.js ส่งให้ปลั๊กอิน) ---------- */
const LANE_LABEL_W = 420;   // แถบชื่อเลนทางซ้าย
const COL_W = 700;          // ความกว้างหนึ่งคอลัมน์ — เว้นกว้างไว้ให้เส้นเดินไม่ทับกัน
                            // (เจ้าของงานสั่ง 15 ก.ย. 2569: ลากยาวไปทางขวาได้ ขอแค่เส้นไม่ทับ)
const NODE_W = 420;
const NODE_H = 130;
const ROW_GAP = 70;         // ช่องไฟระหว่างกล่องที่อยู่เลน+คอลัมน์เดียวกัน
const LANE_PAD = 40;

function main() {
  // จัดกลุ่มเพื่อรู้ว่าแต่ละเลนต้องสูงเท่าไร (คอลัมน์ไหนมีหลายกล่องซ้อนกัน)
  const byLane = {};
  for (const l of LANES) byLane[l.id] = [];
  for (const n of NODES) {
    if (!byLane[n.lane]) throw new Error('ไม่รู้จักเลน "' + n.lane + '" ของ node ' + n.id);
    byLane[n.lane].push(n);
  }

  const laneRows = {};   // เลนนี้ต้องมีกี่แถวในแนวตั้ง
  for (const l of LANES) {
    const perCol = {};
    for (const n of byLane[l.id]) perCol[n.col] = (perCol[n.col] || 0) + 1;
    laneRows[l.id] = Math.max(1, ...Object.values(perCol));
  }

  const clusters = [];
  const placed = {};
  let y = LANE_PAD + 60;   // เว้นที่ให้แถบหัวคอลัมน์ด้านบน
  for (const l of LANES) {
    const rows = laneRows[l.id];
    const laneH = rows * NODE_H + (rows - 1) * ROW_GAP + LANE_PAD * 2;
    const maxCol = Math.max(...NODES.map(n => n.col));
    clusters.push({
      label: l.label,
      x: 0, y,
      w: LANE_LABEL_W + (maxCol + 1) * COL_W,
      h: laneH
    });

    // วางกล่องในเลนนี้ — คอลัมน์เดียวกันซ้อนลงล่างทีละแถว
    const used = {};
    for (const n of byLane[l.id]) {
      const row = used[n.col] || 0;
      used[n.col] = row + 1;
      placed[n.id] = {
        id: n.id,
        label: n.label,
        kind: n.kind || 'process',
        x: LANE_LABEL_W + n.col * COL_W + (COL_W - NODE_W) / 2,
        y: y + LANE_PAD + row * (NODE_H + ROW_GAP),
        w: NODE_W,
        h: NODE_H
      };
    }
    y += laneH;
  }

  const nodes = NODES.map(n => placed[n.id]);
  const ids = new Set(nodes.map(n => n.id));
  const edges = EDGES.map(([from, to, label, style]) => {
    if (!ids.has(from) || !ids.has(to)) throw new Error('เส้นชี้ node ที่ไม่มี: ' + from + '→' + to);
    return { from, to, label: label || '', style: style || 'solid' };
  });

  // หัวคอลัมน์ = node ชนิด phase ที่ปลั๊กอินวาดเป็นป้ายบนสุด (ไม่มีเส้นเชื่อม)
  const maxCol2 = Math.max(...NODES.map(n => n.col));
  const heads = PHASES.slice(0, maxCol2 + 1).map((label, i) => ({
    id: '_ph' + i, label: (i + 1) + '. ' + label, kind: 'phase',
    x: LANE_LABEL_W + i * COL_W + (COL_W - NODE_W) / 2, y: 0, w: NODE_W, h: LANE_PAD - 8
  }));

  const spec = {
    w: LANE_LABEL_W + (maxCol2 + 1) * COL_W,
    h: y + LANE_PAD,
    phases: heads,
    clusters,
    nodes,
    edges
  };

  const out = path.join(__dirname, 'out', 'diagram-repair-swimlane.json');
  fs.writeFileSync(out, JSON.stringify(spec));
  console.log('swimlane: เลน ' + clusters.length + ' · node ' + nodes.length + ' · เส้น ' + edges.length +
    ' · ขนาด ' + spec.w + '×' + spec.h);
  LANES.forEach(l => console.log('   ' + l.label + ' — ' + byLane[l.id].length + ' กล่อง · ' + laneRows[l.id] + ' แถว'));
  console.log('เขียน ' + path.relative(path.join(__dirname, '..'), out));
}

main();
