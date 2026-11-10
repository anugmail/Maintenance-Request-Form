#!/usr/bin/env node
/* ============================================================
   use case (.csv ใน Diagram/) → .md ตารางแยกตามช่วงงาน สำหรับขึ้นบอร์ด FigJam ด้วย 9-ac-board.js (30 ต.ค. 2569)
   ต้นฉบับคือ CSV (คอลัมน์: รหัส · ช่วงงาน · scenario · บทบาท · use case · ผ่านเมื่อ · JO · สถานะใน flow · หมายเหตุ)
   รัน:  node figma-export/11-usecase-md.js
         node figma-export/9-ac-board.js --src="Diagram/01-บำรุงรักษาตามวาระ/24-บำรุงรักษา-usecase.md" --out=board-maintainance-usecase.json --prefix="Use case บำรุงรักษา"
   ============================================================ */
const fs = require('fs');
const path = require('path');
const arg = (k, d) => { const h = process.argv.slice(2).find(a => a.startsWith('--' + k + '=')); return h ? h.slice(k.length + 3) : d; };
const ROOT = path.join(__dirname, '..');
const SRC = path.resolve(ROOT, arg('src', 'Diagram/01-บำรุงรักษาตามวาระ/24-บำรุงรักษา-usecase.csv'));
const OUT = SRC.replace(/\.csv$/, '.md');

/* CSV แบบมีเครื่องหมายคำพูด (ไม่มีขึ้นบรรทัดใหม่ในช่อง) */
function parse(text) {
  const rows = [];
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const cells = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { cells.push(cur); cur = ''; } else cur += c;
    }
    cells.push(cur); rows.push(cells);
  }
  return rows;
}
const [head, ...rows] = parse(fs.readFileSync(SRC, 'utf8'));
const col = (r, name) => r[head.indexOf(name)] || '';
const count = (st) => rows.filter(r => col(r, 'สถานะใน flow') === st).length;
const cell = (s) => s.replace(/\|/g, '/');

const md = ['# Use case บำรุงรักษาตามวาระ', '',
  '> สร้างจาก [' + path.basename(SRC) + '](' + path.basename(SRC) + ') ด้วย `node figma-export/11-usecase-md.js` ห้ามแก้ไฟล์นี้มือ แก้ที่ CSV แล้วรันใหม่',
  '> 1 use case = บทบาท + ทำอะไรให้จบ 1 อย่าง + ผ่านเมื่อไหร่ · สถานะบอกว่า flow ปัจจุบัน (userflow ไฟล์ 14) ครอบแค่ไหน',
  '> รวม ' + rows.length + ' ข้อ · มีใน flow แล้ว ' + count('มีใน flow แล้ว') + ' · มีบางส่วน ' + count('มีบางส่วน') + ' · ยังไม่มี ' + count('ยังไม่มี') + ' · ขัดกับที่เคาะ ' + count('ขัดกับที่เคาะ')
    + (count('ตัดออก') ? ' · ตัดออก ' + count('ตัดออก') + ' (คงแถวไว้ให้ตามรอยได้)' : ''), ''];   // ตัดออก = scenario ของข้อนั้นถูกตัด (4 พ.ย. 2569 S11 S23)
const groups = [...new Set(rows.map(r => col(r, 'ช่วงงาน')))];
for (const g of groups) {
  const mine = rows.filter(r => col(r, 'ช่วงงาน') === g);
  md.push('## ' + g + ' (' + mine.length + ' ข้อ)', '', '| รหัส | scenario | บทบาท | use case | ผ่านเมื่อ | JO | สถานะ | หมายเหตุ |', '|---|---|---|---|---|---|---|---|');
  for (const r of mine) md.push('| ' + ['รหัส', 'scenario', 'บทบาท', 'use case', 'ผ่านเมื่อ', 'JO', 'สถานะใน flow', 'หมายเหตุ'].map(k => cell(col(r, k))).join(' | ') + ' |');
  md.push('');
}
/* 4 พ.ย. 2569 เจ้าของงาน "ปรับแก้ให้เหลืออันเดียวได้มั้ย" — เลิกส่วน "use case ตาม scenario" ใช้ตารางตามช่วงงาน (มีคอลัมน์ scenario + JO) ตารางเดียว */
fs.writeFileSync(OUT, md.join('\n'));
console.log('เขียน ' + path.relative(ROOT, OUT) + ' · ' + rows.length + ' use case · ' + groups.length + ' ช่วงงาน');
