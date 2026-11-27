#!/usr/bin/env node
/* ทดสอบ safety-inspection-plugin/code.js บน mock Plugin API เดียวกับ Overhaul (test-overhaul2-plugin.js รับ CODE/PREFIX/FIRST/LOCAL)
   รัน:  node figma-export/build-plugin.js safety-inspection-plugin && node figma-export/test-safety-inspection-plugin.js
         MODE=build-desktop | build-mobile | build-pick PICK=1 DEVICES=desktop FIRST='ฟอร์มว่าง' · EXISTING=1 = มีหน้าอยู่แล้ว (ต้องวางต่อใต้ของเดิม) */
const path = require('path');
process.env.CODE = process.env.CODE || path.join(__dirname, 'safety-inspection-plugin', 'code.js');
process.env.PREFIX = 'SI';
process.env.FIRST = process.env.FIRST || 'รายการแผน';
process.env.LOCAL = process.env.LOCAL || 'Device Type,Component 1';
process.env.EXISTING_PAGE = process.env.EXISTING_PAGE || 'Safety Inspection';
require('./test-overhaul2-plugin.js');
