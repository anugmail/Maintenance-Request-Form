#!/usr/bin/env node
/* ============================================================
   AC ระดับหน้า (.md ใน Diagram/) → สเปกบอร์ด FigJam แบบ "เอกสาร" (กล่องข้อความ + ตาราง)
   ------------------------------------------------------------
   ต้นทาง = ไฟล์ AC รายหน้า เช่น Diagram/01-บำรุงรักษาตามวาระ/18-overhaul-AC-หน้า1-รายการแผน.md
   (เจ้าของงานขอ 20 ต.ค. 2569: "เขียนใน FigJam เป็นกล่องข้อความหรือตาราง" ลงไฟล์เดียวกับบอร์ด userflow Overhaul)

   แปลง markdown → section ชนิด doc (section ละ 1 หัวข้อ `## `):
     `## N. ชื่อ`      → section ใหม่ ชื่อ "<prefix> · N. ชื่อ"
     `### ชื่อ`        → heading block
     `| a | b |`       → table block (ข้ามแถวคั่น |---|) · ความกว้างคอลัมน์คิดจากความยาวข้อความ
     `- ข้อ`           → text block รวมทุกข้อติดกันเป็นก้อนเดียว (คงขีดหน้าข้อ)
     บรรทัดธรรมดา     → text block (ย่อหน้าละก้อน) · บรรทัดสั้นที่ตามด้วยรายการขีด = heading ย่อย
     ลิงก์ [ข้อความ](ไฟล์) และ **ตัวหนา** → ข้อความล้วน (FigJam ไม่มีลิงก์ข้ามไฟล์ในตาราง)
   ไฟล์ .md ยังเป็นต้นฉบับที่เดียว — แก้ AC แล้วรันใหม่ + กดปลั๊กอินซ้ำ (anchor below: ล้างเฉพาะ section ชื่อเดียวกัน)

   รัน:  node figma-export/9-ac-board.js
         node figma-export/9-ac-board.js --src=Diagram/<เรื่อง>/NN-….md --out=board-ac-<เรื่อง>.json --prefix="AC หน้า 2 รายละเอียดแผน"
         # บำรุงรักษา (5 พ.ย. 2569): AC หน้าสร้างแผน + story map — แก้ไฟล์ .md แล้วรันใหม่ทั้งสองบรรทัด
         node figma-export/9-ac-board.js --src="Diagram/01-บำรุงรักษาตามวาระ/25-บำรุงรักษา-AC-หน้า-สร้างแผน.md" --out=board-maintainance-ac-create.json --prefix="AC หน้าสร้างแผน"
         # 9 พ.ย. 2569: AC ระดับหน้าทุกหน้าของ S1 (รายการแผน · รายละเอียดแผน · อะไหล่ของยานพาหนะ)
         node figma-export/9-ac-board.js --src="Diagram/01-บำรุงรักษาตามวาระ/29-บำรุงรักษา-AC-หน้า-S1.md" --out=board-maintainance-ac-s1.json --prefix="AC หน้า S1"
         node figma-export/9-ac-board.js --src="Diagram/01-บำรุงรักษาตามวาระ/28-บำรุงรักษา-AC.md" --out=board-maintainance-ac.json --prefix="AC ราย scenario"
         node figma-export/9-ac-board.js --src="Diagram/01-บำรุงรักษาตามวาระ/23-บำรุงรักษา-story-map-JO-7.3.md" --out=board-maintainance-story-map.json --prefix="Story Map บำรุงรักษา"
         # login + สิทธิ์ (30 ต.ค. 2569 · ภาพหน้าจริงอยู่นอกรีโป ก๊อปเข้า out/figjam/login/ ก่อน):
         node figma-export/9-ac-board.js --src="Diagram/08-login-และสิทธิ์/01-login-flow.md" --out=board-login-flow.json --prefix="Login" --shots=figjam/login
         node figma-export/9-ac-board.js --src="Diagram/08-login-และสิทธิ์/02-overhaul-สิทธิ์ตาม-role.md" --out=board-login-permission.json --prefix="สิทธิ์ Overhaul"
         node figma-export/9-ac-board.js --src="Diagram/08-login-และสิทธิ์/03-AC-login-รายจอ.md" --out=board-login-ac.json --prefix="AC Login"
   ผัง sequenceDiagram ใน .md → ตารางลำดับขั้น (ลำดับ · จาก → ถึง · ข้อความ) · ผัง mermaid ชนิดอื่นข้าม · `> ` ตัดเครื่องหมาย blockquote
   ผลลัพธ์: out/board-ac-overhaul-page1.json (ให้ปลั๊กอิน figjam-plugin โหลดตรง: http://localhost:8124/board-ac-overhaul-page1.json)
   เทส:  SPEC=board-ac-overhaul-page1.json node figma-export/test-figjam-plugin.js
   ============================================================ */

const fs = require('fs');
const path = require('path');

const arg = (k, d) => {
  const hit = process.argv.slice(2).find(a => a.startsWith('--' + k + '='));
  return hit ? hit.slice(k.length + 3) : d;
};
const ROOT = path.join(__dirname, '..');
const SRC = path.resolve(ROOT, arg('src', path.join('Diagram', '01-บำรุงรักษาตามวาระ', '18-overhaul-AC-หน้า1-รายการแผน.md')));
const OUT = path.join(__dirname, 'out', arg('out', 'board-ac-overhaul-page1.json'));
const PREFIX = arg('prefix', 'AC หน้า 1 รายการแผน');
const SHOTS = arg('shots', '');   // โฟลเดอร์ใต้ out/ ที่มีภาพ .png → section ภาพเรียงตามชื่อไฟล์ ต่อจากภาพรวม (30 ต.ค. 2569 ภาพหน้า login จริง)

/* ---- ขนาดบนบอร์ด (หน่วย px ของ FigJam) ---- */
const W = 2000;            // ความกว้างเนื้อหาใน section (ตารางฟิลด์ 6 คอลัมน์ต้องพออ่าน)
const PAD = 80;            // ขอบใน section
const GAP = 40;            // ระยะระหว่างบล็อก
const FONT_TEXT = 24;      // กล่องข้อความ
const FONT_CELL = 20;      // ตัวอักษรในตาราง
const FONT_H1 = 44, FONT_H2 = 32, FONT_H3 = 26;
const CHAR_W = 0.56;       // ความกว้างเฉลี่ยต่ออักขระ (เท่าของ fontSize) — ไทยผสมอังกฤษ ประมาณการ
const LINE = 1.5;          // line height
const CELL_PAD = 12;       // padding ในเซลล์ (ซ้าย+ขวา = 24)
const COL_MIN = 150, COL_MAX = 620;
const TINT = [247, 246, 243];   // พื้น section (กระดาษ) — ต่างจาก section รูป/ผังของชุด userflow

const clean = (s) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
const lines = (text, fontSize, width) => {
  const perLine = Math.max(1, Math.floor(width / (fontSize * CHAR_W)));
  return text.split('\n').reduce((n, l) => n + Math.max(1, Math.ceil(l.length / perLine)), 0);
};

/* ตาราง: ความกว้างคอลัมน์ตามข้อความยาวสุดในคอลัมน์ (clamp) แล้วบีบให้รวมไม่เกิน W */
function pushTable(rows) {
  const nCol = Math.max(...rows.map(r => r.length));
  rows.forEach(r => { while (r.length < nCol) r.push(''); });
  let colW = Array.from({ length: nCol }, (_, c) => {
    const longest = Math.max(...rows.map(r => r[c].length));
    return Math.min(COL_MAX, Math.max(COL_MIN, Math.round(longest * FONT_CELL * CHAR_W) + CELL_PAD * 2));
  });
  const total = colW.reduce((a, b) => a + b, 0);
  if (total > W) {
    const fixed = colW.filter(w => w === COL_MIN).reduce((a, b) => a + b, 0);
    const k = (W - fixed) / (total - fixed);
    colW = colW.map(w => w === COL_MIN ? w : Math.max(COL_MIN, Math.floor(w * k)));
  }
  const rowH = rows.map(r => Math.max(48, Math.max(...r.map((c, ci) => lines(c, FONT_CELL, colW[ci] - CELL_PAD * 2))) * FONT_CELL * LINE + CELL_PAD * 2));
  cur.blocks.push({ kind: 'table', rows, colW, rowH, h: Math.round(rowH.reduce((a, b) => a + b, 0)) });
}
/* sequenceDiagram → แถว [ลำดับ, จาก → ถึง, ข้อความ] · alt/else = แถวกรณี · Note = แถวหมายเหตุ */
function seqRows(body) {
  const who = {}, rows = [['ลำดับ', 'จาก → ถึง', 'ข้อความ']];
  let n = 0;
  for (const b of body) {
    let m;
    if ((m = b.match(/^(?:actor|participant)\s+(\S+)(?:\s+as\s+(.+))?$/))) who[m[1]] = m[2] || m[1];
    else if ((m = b.match(/^(\S+?)\s*-{1,2}>>?\s*(\S+?)\s*:\s*(.+)$/))) rows.push([String(++n), (who[m[1]] || m[1]) + ' → ' + (who[m[2]] || m[2]), clean(m[3])]);
    else if ((m = b.match(/^(alt|else|opt|loop)\s*(.*)$/))) rows.push(['', 'กรณี', clean(m[2])]);
    else if ((m = b.match(/^Note over ([^:]+):\s*(.+)$/))) rows.push(['', 'หมายเหตุ ' + m[1].split(',').map(x => who[x.trim()] || x.trim()).join(', '), clean(m[2])]);
  }
  return rows;
}

/* ---- อ่าน .md เป็นลำดับบล็อก ---- */
const md = fs.readFileSync(SRC, 'utf8').split('\n');
const sections = [];
let cur = null;
let i = 0;
const title = clean((md.find(l => l.startsWith('# ')) || '# AC').slice(2));
const open = (name) => { cur = { kind: 'doc', name: PREFIX + ' · ' + name, color: TINT, w: W, blocks: [] }; sections.push(cur); };
open('ภาพรวม');
cur.blocks.push({ kind: 'heading', text: title, size: FONT_H1 });

while (i < md.length) {
  const l = md[i];
  if (l.startsWith('# ')) { i++; continue; }
  if (l.startsWith('## ')) { open(clean(l.slice(3))); cur.blocks.push({ kind: 'heading', text: clean(l.slice(3)), size: FONT_H2 }); i++; continue; }
  if (l.startsWith('### ')) { cur.blocks.push({ kind: 'heading', text: clean(l.slice(4)), size: FONT_H3 }); i++; continue; }
  if (l.startsWith('|')) {
    const rows = [];
    while (i < md.length && md[i].startsWith('|')) {
      const cells = md[i].replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map(c => clean(c));
      if (!cells.every(c => /^:?-{2,}:?$/.test(c))) rows.push(cells);
      i++;
    }
    pushTable(rows);
    continue;
  }
  /* ผัง mermaid: sequenceDiagram → ตารางลำดับขั้น (FigJam วาด sequence จาก mermaid ไม่ได้ · 30 ต.ค. 2569 ไฟล์ login) · ผังชนิดอื่นข้าม บอกให้ดูไฟล์ .md */
  if (l.startsWith('```')) {
    const body = []; i++;
    while (i < md.length && !md[i].startsWith('```')) { body.push(md[i].trim()); i++; }
    i++;
    if (l.startsWith('```mermaid') && body.some(b => b.startsWith('sequenceDiagram'))) pushTable(seqRows(body));
    else if (l.startsWith('```mermaid')) cur.blocks.push({ kind: 'text', text: '(ผัง mermaid — ดูภาพในไฟล์ .md)', h: Math.round(FONT_TEXT * LINE) });
    else { const text = body.join('\n'); cur.blocks.push({ kind: 'text', text, h: Math.round(lines(text, FONT_TEXT, W) * FONT_TEXT * LINE) }); }
    continue;
  }
  if (l.startsWith('- ')) {
    const items = [];
    while (i < md.length && md[i].startsWith('- ')) { items.push('- ' + clean(md[i].slice(2))); i++; }
    const text = items.join('\n');
    cur.blocks.push({ kind: 'text', text, h: Math.round(lines(text, FONT_TEXT, W) * FONT_TEXT * LINE) });
    continue;
  }
  if (!l.trim()) { i++; continue; }
  /* ย่อหน้า: รวมบรรทัดติดกัน · บรรทัดสั้นเดี่ยวที่ตามด้วยรายการขีด = หัวข้อย่อย (เช่น "ข้อห้าม") */
  const para = [];
  while (i < md.length && md[i].trim() && !/^(#|\||- |```)/.test(md[i])) { const t = clean(md[i].replace(/^>\s?/, '')); if (t) para.push(t); i++; }   // > = blockquote ตัดเครื่องหมายออก
  const next = md[i] || '';
  if (para.length === 1 && para[0].length <= 24 && next.startsWith('- ')) { cur.blocks.push({ kind: 'heading', text: para[0], size: FONT_H3 }); continue; }
  const text = para.join('\n');
  cur.blocks.push({ kind: 'text', text, h: Math.round(lines(text, FONT_TEXT, W) * FONT_TEXT * LINE) });
}

/* section ภาพ (ชนิดเดียวกับชุด userflow: cols[].images · ขนาดอ่านจากหัว PNG) */
if (SHOTS) {
  const dir = path.join(__dirname, 'out', SHOTS);
  const pngs = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort();
  const size = (f) => { const b = fs.readFileSync(path.join(dir, f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
  sections.splice(1, 0, { name: PREFIX + ' · ภาพหน้าจริง', color: [235, 255, 238], connect: 'sequence',
    cols: pngs.map(f => Object.assign({ label: f.replace(/\.png$/, ''), note: '', images: [Object.assign({ src: SHOTS + '/' + f }, size(f))] })) });
}

/* ความสูง section = บล็อกเรียงลง + ช่องว่าง (ปลั๊กอินคำนวณซ้ำจากขนาดจริง แต่ใส่ไว้ให้ harness/ผู้อ่านสเปกเห็น) */
for (const s of sections) {
  if (!s.blocks) continue;   // section ภาพ
  let y = PAD;
  for (const b of s.blocks) { b.y = y; y += (b.kind === 'heading' ? Math.round(b.size * LINE) : b.h) + GAP; }
  s.h = y - GAP + PAD;
  s.pad = PAD; s.gap = GAP; s.fontText = FONT_TEXT; s.fontCell = FONT_CELL;
}

const spec = {
  version: 1, anchor: 'below', generatedAt: new Date().toISOString(),
  title, src: path.relative(ROOT, SRC),
  font: { family: 'IBM Plex Sans Thai', style: 'Medium' },
  fallbackFont: { family: 'Inter', style: 'Medium' },
  sections
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(spec, null, 1));
const nTable = sections.reduce((a, s) => a + (s.blocks || []).filter(b => b.kind === 'table').length, 0);
const nText = sections.reduce((a, s) => a + (s.blocks || []).filter(b => b.kind !== 'table').length, 0);
console.log('เขียน ' + path.relative(ROOT, OUT) + ' · section ' + sections.length + ' · ตาราง ' + nTable + ' · กล่องข้อความ/หัวข้อ ' + nText);
sections.forEach(s => console.log('  ' + s.name + '  (' + (s.blocks ? s.blocks.length + ' บล็อก · สูง ' + s.h : s.cols.length + ' ภาพ') + ')'));
