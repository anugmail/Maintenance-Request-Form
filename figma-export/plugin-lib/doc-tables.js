/* เอกสารที่ปลั๊กอินวางเป็นกรอบบนหน้า Figma (30 ต.ค. 2569 เจ้าของงาน "ทุกอย่างอยู่ใน Figma") — build-plugin.js เรียกเมื่อ build.json มี "docs"
   - md: หัวข้อ `## ` + ตาราง `| … |` ต่อหัวข้อ → { title, sections: [{ h, head, rows }] } (ใช้กับ story map ไฟล์ 23)
   - csv: หัวตาราง + แถว → { head, rows } (ใช้กับ use case ไฟล์ 24)
   ตัด **ตัวหนา** / `โค้ด` / [ลิงก์](…) เหลือข้อความ */
const fs = require('fs');
const clean = (s) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
const cells = (line) => line.replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map(clean);

function md(file) {
  const out = { title: '', sections: [] };
  let cur = null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (line.startsWith('# ')) { out.title = clean(line.slice(2)); continue; }
    if (line.startsWith('## ')) { cur = { h: clean(line.slice(3)), head: null, rows: [], note: '' }; out.sections.push(cur); continue; }
    if (!cur) continue;
    if (line.startsWith('|')) {
      const c = cells(line);
      if (c.every(x => /^:?-{2,}:?$/.test(x))) continue;
      if (!cur.head) cur.head = c; else cur.rows.push(c);
    } else if (line.trim() && !line.startsWith('>')) cur.note = (cur.note ? cur.note + ' ' : '') + clean(line);
  }
  return out;
}

function csv(file) {
  const rows = [];
  for (const line of fs.readFileSync(file, 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const c = []; let cur = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
      else if (ch === '"') q = true; else if (ch === ',') { c.push(cur); cur = ''; } else cur += ch;
    }
    c.push(cur); rows.push(c);
  }
  const [head, ...body] = rows;
  return { head, rows: body };
}
module.exports = { md, csv };
