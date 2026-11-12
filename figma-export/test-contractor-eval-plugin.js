#!/usr/bin/env node
/* ทดสอบ contractor-eval-plugin/code.js บน mock Plugin API เดียวกับ Overhaul (test-overhaul2-plugin.js รับ CODE/PREFIX/FIRST/LOCAL)
   รัน:  node figma-export/build-plugin.js contractor-eval-plugin && node figma-export/test-contractor-eval-plugin.js
         MODE=build-desktop | build-mobile | build-pick PICK=1 DEVICES=desktop FIRST='ฟอร์มประเมิน' · EXISTING=1 = มีหน้าอยู่แล้ว (ต้องวางต่อใต้ของเดิม)
         สร้างแยกประเภทงาน (R76 · 5 พ.ย. 2569): MODE=build-repair | build-pm | build-oh DEVICES=desktop|mobile|both FIRST='ฟอร์มประเมิน'
         แบบประเมินความพึงพอใจ กบค. ที่รวมไว้ในหน้าต่างนี้ (include SAT · 12 พ.ย. 2569): CODE=figma-export/contractor-eval-plugin/code.js MODE=sat-build node figma-export/test-satisfaction-plugin.js
                                                                (MODE=sat-pick PICK=1 DEVICES=mobile FIRST='ฟอร์มประเมิน') · ชุดต่อกัน: PRE_MODE=sat-build node figma-export/test-contractor-eval-plugin.js
         ดูข้อความในกล่องข้อมูลผู้รับจ้าง: DUMP_PROPS=1 DUMP_TEXT='^CE / (B[123]|C[123])\.1 ' DUMP_TEXT_APPEND=1 DUMP_TEXT_OUT=<ไฟล์> */
const path = require('path');
process.env.CODE = process.env.CODE || path.join(__dirname, 'contractor-eval-plugin', 'code.js');
process.env.PREFIX = 'CE';
process.env.FIRST = process.env.FIRST || 'แท็บยังไม่ได้ประเมิน';
process.env.LOCAL = process.env.LOCAL || 'Device Type,Component 1';
process.env.EXISTING_PAGE = process.env.EXISTING_PAGE || 'ประเมินผู้รับจ้าง';   // EXISTING=1 จำลองไฟล์ที่มีหน้านี้อยู่แล้ว
require('./test-overhaul2-plugin.js');
