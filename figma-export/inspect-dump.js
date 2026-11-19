#!/usr/bin/env node
/* ============================================================================
   สรุปผล figma-dump/<slug>/*.json หรือ figjam-dump/<slug>/*.json แบบย่อ
   ใช้แทนการเปิดไฟล์ดัมป์ดิบ (มักหลาย MB) เข้า context ของ AI ตรงๆ — ห้ามตาม
   design-system/HOWTO-read-figma.md ข้อ 4 "ห้ามโหลด figma-full.json เข้า context"

   ใช้:
     node figma-export/inspect-dump.js out/figma-dump/component-overhaul
     node figma-export/inspect-dump.js out/figjam-dump/overhaul-flow --depth=3
   ============================================================================ */
const fs = require('fs');
const path = require('path');

const [dirArg, ...flags] = process.argv.slice(2);
if (!dirArg) {
  console.error('ใช้: node figma-export/inspect-dump.js <โฟลเดอร์ใต้ figma-export/out/> [--depth=N]');
  process.exit(1);
}
const depthFlag = flags.find((f) => f.startsWith('--depth='));
const maxDepth = depthFlag ? Number(depthFlag.split('=')[1]) : 3;
const dir = path.isAbsolute(dirArg) ? dirArg : path.join(__dirname, dirArg);
if (!fs.existsSync(dir)) {
  console.error('ไม่พบโฟลเดอร์: ' + dir);
  process.exit(1);
}

const texts = new Map(); // text -> count
const typeCounts = {};
let totalNodes = 0;

function walk(n, depth, out) {
  totalNodes++;
  typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
  if (depth <= maxDepth && (n.name || n.type)) {
    out.push('  '.repeat(depth) + '· ' + (n.name || '(ไม่มีชื่อ)') + '  [' + n.type + ']' + (n.hasImage ? '  🖼' : ''));
  }
  if (n.text) texts.set(n.text, (texts.get(n.text) || 0) + 1);
  for (const k of n.kids || []) walk(k, depth + 1, out);
}

const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort();
if (!files.length) {
  console.error('โฟลเดอร์นี้ไม่มีไฟล์ .json: ' + dir);
  process.exit(1);
}

console.log('=== ' + dir + ' — ' + files.length + ' ไฟล์ ===\n');

for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8');
  const d = JSON.parse(raw);
  const label = d.section ? d.page + ' › ' + d.section : d.page;
  console.log('— ไฟล์ ' + f + ' (' + (raw.length / 1024).toFixed(0) + ' KB) — ' + label + ' —');
  const out = [];
  // รองรับทั้ง 2 รูปแบบ: dump-plugin ({ sets: [...] }) และ figjam-dump-plugin ({ root: {...} })
  const roots = d.sets || (d.root ? [d.root] : []);
  for (const r of roots) walk(r, 0, out);
  console.log(out.slice(0, 400).join('\n'));
  if (out.length > 400) console.log('  … (ตัดที่ 400 บรรทัด จากทั้งหมด ' + out.length + ' — ลด --depth หรือดูทีละไฟล์)');
  console.log();
}

console.log('=== สรุปรวม ===');
console.log('node ทั้งหมด: ' + totalNodes);
console.log('ชนิด node: ' + Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([t, n]) => t + '=' + n).join(' · '));
console.log('\nข้อความที่พบทั้งหมด (' + texts.size + ' รายการไม่ซ้ำ):');
for (const [t, n] of [...texts.entries()].sort((a, b) => b[1] - a[1])) {
  console.log('  [' + n + '×] ' + t.replace(/\n/g, ' ⏎ '));
}
