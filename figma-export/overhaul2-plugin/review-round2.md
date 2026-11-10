# Overhaul — รอบ 2 (6 พ.ย. 2569)

## A.5 — Dashboard ผู้บริหาร

Tabs ใช้ Active variant string True/False ตาม dump จริง ไม่ใช้ boolean (สาเหตุที่แท็บ 2 ไม่ active)

ใช้ Metric item จาก Component VMS Plus และโครง MA Overview จาก UI Release#2 ตามกติกา R22 ไม่มี chart component ใหม่หรือ import key ใหม่

- แถว 1: จำนวนรถตามตัวกรอง / ราคาประเมินซื้อใหม่ทดแทนรวม / ราคาประเมิน Overhaul รวม / ส่วนต่างประมาณการ
- แถว 2: ความคืบหน้าเฉลี่ยพร้อมจำนวนรถที่มีข้อมูล / รถที่ซ่อมถึง 100% / จำนวนประเภทรถ / ยี่ห้อที่ Overhaul บ่อยสุดจากข้อมูลรวม
- ตาราง 8 คอลัมน์: ทะเบียน / ยี่ห้อรุ่นและประเภท / ซื้อใหม่ทดแทน / ประเมิน Overhaul / ส่วนต่าง / progress / ราคาซื้อเดิม / ดูรายละเอียด
- ราคาซื้อใหม่ทดแทนไม่ใช่ราคาซื้อเดิม: fixtures จาก plan.cars ของ oh2Seed() ใน design-mock/overhaul-v2-mock.js
- ทุก metric และตารางใช้ข้อมูลหลังกรอง model/brand/type/query ชุดเดียวกัน ยกเว้นอันดับยี่ห้อที่ใช้ชุดรวม
- ส่วนต่าง = ราคาซื้อใหม่ทดแทน - ราคา Overhaul ของรถชุดเดียวกัน เฉพาะรถที่มีราคาครบคู่ แสดงจำนวนรถที่ข้อมูลครบ กรณีข้อมูลไม่ครบไม่สมมติเป็นศูนย์
- progress เฉลี่ยจากเปอร์เซ็นต์ที่มีจริง พร้อมจำนวนรถที่มีข้อมูล ไม่แปลงเลขขั้นตอนเป็นเปอร์เซ็นต์
- เพิ่ม state A.7 กรอง HINO FM2P (1 คัน ราคาซื้อใหม่ 2,700,000 / ประเมิน Overhaul 250,000 / ส่วนต่าง 2,450,000) และ A.8 ไม่พบรถ · A.1–A.6 คงรหัสเดิม
- ข้อมูลทั้งหมดเป็น fixture ปลั๊กอินไม่มี API หรือ product UI ที่เปลี่ยนค่าขณะกด filter; จอ Figma เป็น state ก่อน/หลังกรอง ไม่อ้างว่าเป็น dashboard interactive ที่เชื่อมข้อมูลจริง

## ส่วนที่แก้ตามคำยืนยัน

- B.3: ใช้เมนู … → modal ราคา สร้าง state B.13 modal ว่างเพิ่มจาก B.10 ที่มีค่า และคง validation/success states
- E.2: ใช้ vehPickSection เดียวกับ C.2 รวมคอลัมน์ราคาและ … แต่จำกัดรถจากแผน (override ด้วย o.planCars) · create fixture แผน 123458 มี c4; edit fixture แผน 123456 มี c1/c3/c6 ตาม oh2Seed()
- คำแสดง PO เปลี่ยนเป็น Purchase Order ผ่านตัวช่วยข้อความ คงรหัส PO-… และ identifier ภายใน
- H.1: ย้อนกลับซ้าย; กลุ่มขวา Tertiary ข้ามขั้นตอน ตามด้วย Primary ยืนยันนัดหมาย
- J.3/P.1: ตารางติดตามเพิ่ม progress จาก log[3] มีเปอร์เซ็นต์จริง ขาดข้อมูลแสดง —
- Toast ทุกจอชิดขวาบนที่ x=frame.width-toast.width, y=0 ไม่มี gap; มือถือเต็มกว้าง
- O.1: ค่าใช้จ่ายในการดำเนินการ Overhaul
- P.1: อะไหล่แยกตัวรถ/เครื่องมือกล และนำ success alert ออกจากหน้าสรุป (สถานะปิดงานยังอยู่ที่ badge หลัก)

## ยังไม่แก้แทนต้นฉบับ

- I.1: https://www.figma.com/design/bhYXsswc3XwG9Pk9hxgeDw/Maintain-D?node-id=1824-617793
- P.1 การ์ดยานพาหนะ: https://www.figma.com/design/bhYXsswc3XwG9Pk9hxgeDw/Maintain-D?node-id=2623-88498
- create_session ถูก MCP ปฏิเสธว่าไม่มี edit access แม้เป็นการอ่าน ไม่ได้ข้ามข้อจำกัดไปดึงจากช่องทางอื่น · รอสิทธิ์หรือ log อ่านจอที่เลือกของ node ทั้งสองเพื่อใช้ component เดิมตรงต้นฉบับ
- ไม่เพิ่ม key จากภาพหรือเดา key อีก (บทเรียน Checkbox with description ที่เคยทำให้เริ่มปลั๊กอินไม่ได้)

## ผลตรวจ

- test-overhaul-round2.js: ทดสอบชนิด variant จริงแบบ strict / dashboard หลังกรอง / รถเฉพาะแผนและราคาใน PO / กลุ่มปุ่มนัดหมาย / progress column / ชื่อค่าใช้จ่าย
- test-overhaul-review.js: สูตร dashboard + ราคาข้อมูลไม่ครบ + อันดับยี่ห้อคงเดิม / toast gap 0 / modal / overlay / gate ซ่อม 100%
- test-overhaul-component-loading.js และ test-overhaul-vehicle-summary.js ผ่าน
- Syntax และ git diff whitespace ผ่าน
- ยังไม่มีหลักฐานเรนเดอร์จริงใน Figma และ harness component เต็มชุดยังขาด Table definition จึงยังไม่ส่งเป็นงานสมบูรณ์พร้อมรัน
