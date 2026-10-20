#!/usr/bin/env node
/* ทดสอบ maintainance-plugin/code.js บน mock Plugin API เดียวกับ Overhaul (test-overhaul2-plugin.js รับ CODE/PREFIX/FIRST/LOCAL)
   รัน:  node figma-export/build-plugin.js maintainance-plugin && node figma-export/test-maintainance-plugin.js
   local component ที่ยืมจาก flow งานซ่อมในไฟล์ Maintain-D ต้องอยู่ในดัมป์ out/figma-dump/maintain-d/ — ไม่มี = ปลั๊กอินใช้แบบสำรอง (ไลบรารีล้วน) */
const path = require('path');
process.env.CODE = process.env.CODE || path.join(__dirname, 'maintainance-plugin', 'code.js');
process.env.PREFIX = 'MT';
process.env.FIRST = 'รายการแผน';
process.env.LOCAL = process.env.LOCAL || 'PartRequestStepPanel,PartsInventoryPanel,RequestedPartsPanel,Spare Part Card Item,Selecte Spare Part,IncidentPhotoGallery,VehicleAndReporterInfo,SummaryRequestedParts,BudgetSource,Component 1';
require('./test-overhaul2-plugin.js');
