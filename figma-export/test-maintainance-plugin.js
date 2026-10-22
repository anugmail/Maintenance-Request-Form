#!/usr/bin/env node
/* ทดสอบ maintainance-plugin/code.js บน mock Plugin API เดียวกับ Overhaul (test-overhaul2-plugin.js รับ CODE/PREFIX/FIRST/LOCAL)
   รัน:  node figma-export/build-plugin.js maintainance-plugin && node figma-export/test-maintainance-plugin.js
         MODE=build-desktop | build-mobile | build-pick PICK=0,4 DEVICES=desktop · EXISTING=1 = มีหน้า Maintainance อยู่แล้ว (ต้องวางต่อใต้ของเดิม)
   local component ที่ยืมจาก flow งานซ่อมในไฟล์ Maintain-D ต้องอยู่ในดัมป์ out/figma-dump/maintain-d/ — ไม่มี = ปลั๊กอินใช้แบบสำรอง (ไลบรารีล้วน) */
const path = require('path');
process.env.CODE = process.env.CODE || path.join(__dirname, 'maintainance-plugin', 'code.js');
process.env.PREFIX = 'MT';
process.env.FIRST = process.env.FIRST || 'รายการแผน';   // build-pick ที่ไม่มีบล็อก A ตั้ง FIRST= ชื่อจอแรกของบล็อกแรกเอง
process.env.LOCAL = process.env.LOCAL || 'PartRequestStepPanel,PartsInventoryPanel,RequestedPartsPanel,Spare Part Card Item,Selecte Spare Part,IncidentPhotoGallery,VehicleAndReporterInfo,SummaryRequestedParts,BudgetSource,Device Type,Component 1';
process.env.FLOW = process.env.FLOW || '1';   // ผัง userflow ข้างจอ (22 ต.ค. 2569) — ตรวจทุกบล็อกมีผังซ้ายสุด · ป้ายรหัสจอชี้จอจริง
require('./test-overhaul2-plugin.js');
