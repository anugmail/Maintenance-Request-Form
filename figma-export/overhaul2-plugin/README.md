# Maintain-D — Overhaul v2

## Acceptance Criteria — 9 พฤศจิกายน 2569

**ฉบับใหม่ที่แยกตามแต่ละเฟรม A–P:** [อ่านฉบับรวม](AC-A-P-new.md) · [เลือกอ่านแยก Flow](AC-new-A-P/README.md) · [ตาราง AC สำหรับติดตามผล](AC-A-P-new.csv). รวม **16 Flow / 78 เฟรม / 252 AC** ใช้รหัส `OH2-…-NEW-*` และคง 16 ข้อของ [A.1 ฉบับใหม่](AC-A1-new.md) ไว้ตามเดิม. ขอบเขตถึง P เท่านั้น ไม่รวมชุดทดลอง/แบบเก่า. เป็นเกณฑ์ตรวจรับ ไม่ใช่ผลทดสอบผ่าน.

[AC รวมก่อนแยกรายเฟรม](acceptance-criteria.md) 110 ข้อ และ [ตารางอ้างอิงเดิม](acceptance-criteria-frames.csv) 125 state รวม Summary/Notification/Toast ยังเก็บไว้แยกต่างหาก. เอกสารใน figjam-userstory-plugin ยังคงไว้เช่นกัน.

## Dashboard แบบกราฟ — 9 พฤศจิกายน 2569

Dashboard เดิมแท็บ “รถที่ Overhaul” (A.5 ในรายการสคริปต์) แทนกรอบตัวเลข 8 ใบด้วยกราฟ 4 ส่วน: แท่งเทียบราคาซื้อใหม่/ประเมิน Overhaul, วงแหวนความคืบหน้าเฉลี่ย, Polar Area จำนวนรถแยกประเภท และอันดับยี่ห้อข้อมูลรวม. ตัวกรองมีผลกับสามส่วนแรก; อันดับยี่ห้อคงข้อมูลรวมตามกติกาเดิม. กราฟใช้เลเยอร์ Figma แก้ไขได้ ไม่ใช่ภาพ screenshot.

ดู [พรีวิวกราฟ](dashboard-visual-preview.svg) ซึ่งสร้างจาก geometry ของ helper และ fixture เดียวกัน; ไม่ใช่ผล render จาก Figma และการแสดงฟอนต์ขึ้นกับเครื่องที่เปิด. ตำแหน่งบนหน้าและตัวอักษรต้องตรวจใน Figma จริง. ใช้ IBM Plex Sans Thai และ palette VMS Plus. Mobile คงรูปแบบเดิม.

อ้างอิง [Polar Area](https://www.chartjs.org/docs/latest/charts/polar.html) และ [Doughnut](https://www.chartjs.org/docs/latest/charts/doughnut.html) ของ Chart.js; URL ตัวอย่างรุ่น next ที่ให้มาเปิดผ่านเครื่องมือไม่ได้. ตัวเลขเป็นประมาณการ ไม่อ้างเป็นผลประหยัดจริง; แยกข้อมูลราคา/progress ที่ขาดและแสดง coverage.

นำเข้า `manifest.json` ใน Figma ผ่าน Plugins → Development → Import plugin from manifest

## Summary รายคันและประวัติการซ่อม — Scenario 19

กด **สร้าง Summary รายคัน + ประวัติการซ่อม** สร้างต่อท้ายในหน้าที่เปิดใช้ปลั๊กอินเสมอ โดยค่าเริ่มต้นเป็น Desktop ใช้ตัวเลือกอุปกรณ์ร่วมกับปุ่มอื่น เมื่อเสร็จจะเลือกเฟรมที่สร้างและซูมไปให้เห็น ไม่ต้องติ๊ก “วางต่อท้ายหน้าที่เปิดอยู่” สำหรับปุ่มนี้

สร้าง 4 เฟรม แยก state ตามรูปแบบ flow เดิม:

- `S19.1` สรุปรายคัน: ข้อมูลรถ ข้อมูลทะเบียน และสรุปประวัติการซ่อม
- `S19.2` ประวัติการซ่อม: เลขที่ใบแจ้งซ่อมและวันที่ อาการเสีย อะไหล่ที่ใช้ ผู้ซ่อม ชั่วโมงใช้งาน และเลขไมล์
- `S19.3` ไม่มีประวัติ: Empty state ไม่มีแถวข้อมูลเก่าและไม่มีปุ่มสร้างงาน
- `S19.4` โหลดไม่สำเร็จ: ข้อความแจ้งปัญหาและปุ่มลองใหม่ แยกจากไม่มีประวัติ

จุดเข้าที่ออกแบบไว้คือรถที่เลือกจากหน้ารายละเอียด PO หน้าทั้งหมดเป็นแบบอ่านข้อมูล ตัวอย่างรถ 82-6789 ขอนแก่นและประวัติ 2 รายการมาจาก `app/src/lib/overhaul.ts` / `overhaulExec.ts` ไม่ใช่ข้อมูลจาก API ปัจจุบัน ยี่ห้อ/รุ่นรถที่ต้นทางไม่มีแสดง “—” แทนการเดาจากยี่ห้ออุปกรณ์

ใช้ Page header, Tabs, Section label, Content item row, Table, Empty state และ Alert จาก component library เดิม ไม่มี component ใหม่ แท็บและปุ่มเป็นหน้าตาของแบบออกแบบ ยังไม่ได้เชื่อม prototype interaction หรือ API เฟรม S19 ยังแยกจากชุด AC 72 เฟรมใน figjam-userstory-plugin

ตรวจเนื้อหาและ dispatch:

```sh
node figma-export/test-overhaul-vehicle-summary.js
node --check figma-export/overhaul2-plugin/code.js
```

ตรวจ component เต็มชุดเมื่อมี dump ของ library definition:

```sh
MODE=build-vehicle-summary DEVICES=desktop FIRST=สรุปรายคัน node figma-export/test-overhaul2-plugin.js
```

ไฟล์ dump ใน workspace ณ วันที่ 28 ตุลาคม 2569 มีเฉพาะตัวอย่าง instance ในหน้าจอ ไม่มี component set `Table` ที่ harness ต้องใช้ จึงยังตรวจ component เต็มชุดและ layout จริงไม่ได้ ต้องเปิดรันใน Figma เพื่อตรวจข้อความล้น การจัดวาง และ library version
