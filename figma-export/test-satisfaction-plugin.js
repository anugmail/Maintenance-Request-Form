#!/usr/bin/env node
/* ทดสอบ satisfaction-plugin/code.js (แบบประเมินความพึงพอใจ XCHO · เรื่องแยก 12 พ.ย. 2569 · R105) บน mock Plugin API เดียวกับ Overhaul (test-overhaul2-plugin.js รับ CODE/PREFIX/FIRST/LOCAL)
   รัน:  node figma-export/build-plugin.js satisfaction-plugin && node figma-export/test-satisfaction-plugin.js
         MODE=build-desktop | build-mobile | build-pick PICK=1 DEVICES=desktop FIRST='ฟอร์มประเมิน' · EXISTING=1 = มีหน้า "ประเมินความพึงพอใจ" อยู่แล้ว (ต้องวางต่อใต้ของเดิม)
         ดูข้อความในกล่องข้อมูลงาน: DUMP_PROPS=1 DUMP_TEXT='^SAT / (B\.[18]|C\.[123]) ' */
const path = require('path');
process.env.CODE = process.env.CODE || path.join(__dirname, 'satisfaction-plugin', 'code.js');
process.env.PREFIX = 'SAT';
process.env.FIRST = process.env.FIRST || 'แท็บยังไม่ได้ประเมิน';
process.env.LOCAL = process.env.LOCAL || 'Device Type,Component 1';
process.env.EXISTING_PAGE = process.env.EXISTING_PAGE || 'ประเมินความพึงพอใจ';
process.env.FLOW = process.env.FLOW || '1';
process.env.FLOW_KIND = process.env.FLOW_KIND || 'flowchart';   // flowchart กิจกรรมซ้ายของทุกบล็อก (build.json activity) — ตรวจว่ามีครบทุกบล็อก ไม่มีหน้าจอปน
/* R105 คำว่า "ยานพาหนะ" แทน "รถ" — ตรวจซอร์ส screens.js ก่อน (ข้อความที่ปลั๊กอินใส่เอง) แล้วจอที่สร้างตรวจซ้ำใน check-component-rules */
{
  const fs = require('fs'), { RULES, checkSourceWording } = require('./check-component-rules');
  const src = fs.readFileSync(path.join(__dirname, 'satisfaction-plugin', 'screens.js'), 'utf8');
  const errs = [];
  const rules = (RULES.wording || []).filter(r => /\^SAT/.test(r.screens));
  if (!rules.length) errs.push('R105 ไม่มีกติกาคำของจอ ^SAT / ใน component-rules.json');
  for (const r of rules) checkSourceWording(src, r).slice(0, 20).forEach(([ln, s]) => errs.push(r.id + ' screens.js:' + ln + ' ยังมีคำว่า "' + r.word + '" ต้องใช้ "' + r.use + '": ' + s.slice(0, 80)));
  if (errs.length) { errs.forEach(e => console.log('⚠ ' + e)); process.exit(1); }
  console.log('R105 ซอร์ส screens.js ไม่มีคำว่า "รถ" นอกข้อความที่ลอกจากแบบสำรวจ ✓');
}
require('./test-overhaul2-plugin.js');
