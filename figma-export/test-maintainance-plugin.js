#!/usr/bin/env node
/* ทดสอบ maintainance-plugin/code.js บน mock Plugin API เดียวกับ Overhaul (test-overhaul2-plugin.js รับ CODE/PREFIX/FIRST/LOCAL)
   รัน:  node figma-export/build-plugin.js maintainance-plugin && node figma-export/test-maintainance-plugin.js
         MODE=build-desktop | build-mobile | build-pick PICK=0,4 DEVICES=desktop · EXISTING=1 = มีหน้า Maintainance อยู่แล้ว (ต้องวางต่อใต้ของเดิม)
   local component ที่ยืมจาก flow งานซ่อมในไฟล์ Maintain-D ต้องอยู่ในดัมป์ out/figma-dump/maintain-d/ — ไม่มี = ปลั๊กอินใช้แบบสำรอง (ไลบรารีล้วน) */
const path = require('path');
process.env.CODE = process.env.CODE || path.join(__dirname, 'maintainance-plugin', 'code.js');
process.env.PREFIX = 'MT';
process.env.FIRST = process.env.FIRST || 'รายการแผน';   // build-pick ที่ไม่มีบล็อก A ตั้ง FIRST= ชื่อจอแรกของบล็อกแรกเอง
process.env.LOCAL = process.env.LOCAL || 'RepairFeedback,ReturnPart,PartRequestStepPanel,PartsInventoryPanel,RequestedPartsPanel,Spare Part Card Item,Selecte Spare Part,IncidentPhotoGallery,VehicleAndReporterInfo,SummaryRequestedParts,BudgetSource,ReceiptChecklist,HandoverSignature,Modal Signature,InspectionChecklist,Device Type,Component 1';
process.env.UC_N = process.env.UC_N || '76';   // 4 พ.ย. 2569: + UC-MT-70 71 ผู้รับจ้าง (S23)
process.env.JOURNEY_N = process.env.JOURNEY_N || '21';   // 4 พ.ย. 2569: + S23 ผู้รับจ้าง   // 30 ต.ค. 2569: S3 พักไว้ · เพิ่ม S19 แก้ไขแผน S20 ลบแผน ⇒ journey 19 ผัง
process.env.JOURNEY_LINKS = process.env.JOURNEY_LINKS || '28';   // 4 พ.ย. 2569: S10→S11 ออก · S8→S23 · S23→S11 · S11→S23 (ส่งกลับ)   // S1→S2→S4 แทน S2→S3→S4 · S2 ส่งกลับไป S19 แล้วย้อนกลับ S2 · S1→S20
process.env.SCEN_N = process.env.SCEN_N || '23';   // ตาราง scenario: 21 scenario + ตัดออก 2 (4 พ.ย. 2569)
process.env.FLOW = process.env.FLOW || '1';   // ผัง userflow ข้างจอ (22 ต.ค. 2569) — ตรวจทุกบล็อกมีผังซ้ายสุด · ป้ายรหัสจอชี้จอจริง
require('./test-overhaul2-plugin.js');
