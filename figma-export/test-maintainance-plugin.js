#!/usr/bin/env node
/* ทดสอบ maintainance-plugin/code.js บน mock Plugin API เดียวกับ Overhaul (test-overhaul2-plugin.js รับ CODE/PREFIX/FIRST/LOCAL)
   รัน:  node figma-export/build-plugin.js maintainance-plugin && node figma-export/test-maintainance-plugin.js
         MODE=build-desktop | build-mobile | build-pick PICK=0,4 DEVICES=desktop · EXISTING=1 = มีหน้า Maintainance อยู่แล้ว (ต้องวางต่อใต้ของเดิม)
   local component ที่ยืมจาก flow งานซ่อมในไฟล์ Maintain-D ต้องอยู่ในดัมป์ out/figma-dump/maintain-d/ — ไม่มี = ปลั๊กอินใช้แบบสำรอง (ไลบรารีล้วน) */
const path = require('path');
process.env.CODE = process.env.CODE || path.join(__dirname, 'maintainance-plugin', 'code.js');
process.env.PREFIX = 'MT';
process.env.FIRST = process.env.FIRST || 'รายการแผน';   // build-pick ที่ไม่มีบล็อก A ตั้ง FIRST= ชื่อจอแรกของบล็อกแรกเอง
process.env.LOCAL = process.env.LOCAL || 'RepairFeedback,ReturnPart,PartRequestStepPanel,PartsInventoryPanel,RequestedPartsPanel,Spare Part Card Item,Selecte Spare Part,IncidentPhotoGallery,VehicleAndReporterInfo,SummaryRequestedParts,BudgetSource,Request Repair/Budget,ReceiptChecklist,HandoverSignature,Modal Signature,InspectionChecklist,Device Type,Component 1';
process.env.UC_N = process.env.UC_N || '92';   // 5 พ.ย. 2569 R75: + UC-MT-98   // 5 พ.ย. 2569 รีวิว S10: + UC-MT-93 ถึง 97   // 5 พ.ย. 2569 S25: + UC-MT-90 91 92   // 5 พ.ย. 2569: + UC-MT-86 (S1 รายละเอียดแผนหลังส่งอนุมัติ) 87 (S6 ทางเข้าหน้าไตรมาส)   // 4 พ.ย. 2569 ค่ำ: ตัด S11 S23 คงแถวไว้สถานะ ตัดออก 5 ข้อ   // 4 พ.ย. 2569: + UC-MT-83 84 85 (S24)   // 4 พ.ย. 2569: + UC-MT-70 71 ผู้รับจ้าง (S23)
process.env.JOURNEY_N = process.env.JOURNEY_N || '21';   // 5 พ.ย. 2569 S25: + S25 ย้ายรถไปไตรมาสอื่น   // 4 พ.ย. 2569 ค่ำ: ตัด S11 S23   // 4 พ.ย. 2569: + S24 ข้อมูลการบำรุงรักษา   // 4 พ.ย. 2569: + S23 ผู้รับจ้าง   // 30 ต.ค. 2569: S3 พักไว้ · เพิ่ม S19 แก้ไขแผน S20 ลบแผน ⇒ journey 19 ผัง
process.env.JOURNEY_LINKS = process.env.JOURNEY_LINKS || '27';   // 5 พ.ย. 2569 S25: + S10→S25 · S25→S6 (ย้อนกลับ)   // ตัด S11 S23: เอา 8→23 · 23→11 · 11→23 · 11→12 · 11→24 ออก (S8→S10 ทั้งสองแบบ)   // + S10→S24 · S11→S24   // 4 พ.ย. 2569: S10→S11 ออก · S8→S23 · S23→S11 · S11→S23 (ส่งกลับ)   // S1→S2→S4 แทน S2→S3→S4 · S2 ส่งกลับไป S19 แล้วย้อนกลับ S2 · S1→S20
process.env.SCEN_N = process.env.SCEN_N || '25';   // 5 พ.ย. 2569 S25: + S25   // 4 พ.ย. 2569 ค่ำ: 20 scenario + ตัดออก 4 (S3 S5 S11 S23)   // + S24   // ตาราง scenario: 21 scenario + ตัดออก 2 (4 พ.ย. 2569)
process.env.SWIM_N = process.env.SWIM_N || '43';   // 5 พ.ย. 2569 S25: + กล่อง k29   // 4 พ.ย. 2569 ค่ำ: ตัดกล่อง S11 S23 + เลนผู้รับจ้าง   // user journey swimlane (4 พ.ย. 2569) 26-บำรุงรักษา-swimlane.md: กล่อง · เส้น · lane
process.env.SWIM_EDGES = process.env.SWIM_EDGES || '51';   // 5 พ.ย. 2569 S25: + k19→k29 · k29→k7
process.env.SWIM_LANES = process.env.SWIM_LANES || '7';
process.env.FLOW = process.env.FLOW || '1';   // ผัง userflow ข้างจอ (22 ต.ค. 2569) — ตรวจทุกบล็อกมีผังซ้ายสุด · ป้ายรหัสจอชี้จอจริง
require('./test-overhaul2-plugin.js');
