#!/usr/bin/env node
/* ทดสอบ contractor-eval-plugin/code.js บน mock Plugin API เดียวกับ Overhaul (test-overhaul2-plugin.js รับ CODE/PREFIX/FIRST/LOCAL)
   รัน:  node figma-export/build-plugin.js contractor-eval-plugin && node figma-export/test-contractor-eval-plugin.js
         MODE=build-desktop | build-mobile | build-pick PICK=1 DEVICES=desktop FIRST='ฟอร์มประเมิน' · EXISTING=1 = มีหน้าอยู่แล้ว (ต้องวางต่อใต้ของเดิม) */
const path = require('path');
process.env.CODE = process.env.CODE || path.join(__dirname, 'contractor-eval-plugin', 'code.js');
process.env.PREFIX = 'CE';
process.env.FIRST = process.env.FIRST || 'แท็บยังไม่ได้ประเมิน';
process.env.LOCAL = process.env.LOCAL || 'Device Type,Component 1';
process.env.EXISTING_PAGE = process.env.EXISTING_PAGE || 'ประเมินผู้รับจ้าง';   // EXISTING=1 จำลองไฟล์ที่มีหน้านี้อยู่แล้ว
require('./test-overhaul2-plugin.js');
