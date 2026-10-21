# กติกาการสร้างจอด้วย component จริง (Overhaul v2 · ใช้กับทุกงานสร้างจอของโปรเจกต์นี้)

> 🔴 เจ้าของงานสั่ง 19 ต.ค. 2569: _"อยากให้เซฟข้อมูลเงื่อนไขการสร้างแต่ละจุดไว้ด้วย การสร้างครั้งต่อไปของโปรเจ็คนี้จะใช้เงื่อนไข component ที่ถูกต้องเท่านั้น"_
>
> - ไฟล์นี้ = คำอธิบายรายจุด · [`component-rules.json`](component-rules.json) = กติกาฉบับที่เครื่องตรวจ (รหัส R1–R24 ตรงกัน) — **แก้กติกาต้องแก้ทั้งคู่**
> - ตัวตรวจ: [`check-component-rules.js`](check-component-rules.js) ถูกเรียกใน `node figma-export/test-overhaul2-plugin.js` — **ผิดกติกา = ทดสอบไม่ผ่าน** ต้องผ่านก่อนให้เจ้าของงานรันปลั๊กอินทุกครั้ง
> - ข้อที่ติดข้อจำกัดไลบรารีแสดงเป็น "รอเคาะ" (ไม่ทำให้ล้ม แต่ต้องรายงานเจ้าของงาน) — ห้ามประกอบเองเงียบๆ
> - ต้นแบบ HTML (`design-mock/`) และ Next.js (`overhaul-next/`) ใช้กติกาเดียวกันในส่วนที่เป็นหน้าตา
> - ที่มาของค่าทั้งหมด: ไลบรารี (Component) VMS Plus (ไฟล์ "component" ที่ publish แล้ว) · โค้ดสร้างจอ: `overhaul2-plugin/code.js`

## 1. โครงจอ

| จุด | component · variant | เงื่อนไข | ที่มา |
|---|---|---|---|
| เฟรมจอ (R14) | เฟรมพื้นขาว 1 จอ = 1 เฟรม | desktop **1440×1024** · mobile **402×874** วางข้างจอ desktop · scenario ละแถว · **ไม่ใช้ section** | 19 ต.ค. "1 จอ หนึ่งพื้นหลัง" · mobile 402×874 |
| เมนูซ้าย | `Sidebar navigation` State=Collapsed | เมนูแรก Active · mobile ไม่มี | หน้า 5.1 Contract list |
| แถบบน (R1) | `Header navigation` | **desktop = Breakpoint=Tablet** · mobile = Mobile · ช่องค้นหาในตัวเป็นของไลบรารี ไม่แตะ | รีวิว 19 ต.ค. |
| หัวหน้า (R2) | `Page header` Breakpoint ตามจอ | **Divider = false** · Back action เมื่อมีหน้าก่อนหน้า · breadcrumb ใช้ Link 1–3 + Current link · ปุ่มหลัก 1 ปุ่มใช้ Actions ในตัว · ปุ่มลบสีแดงวางกรอบแยกขวา (Page header ไม่มีปุ่มแดง) | รีวิว 19 ต.ค. |
| เส้นคั่น (R13) | — | **ไม่มีเส้นคั่นที่มองเห็นเลย** (property Divider ปิด · ชั้นชื่อ Divider ซ่อน) | คำสั่ง 19 ต.ค. |

## 2. หัวข้อ section

| หน้า | component | เงื่อนไข |
|---|---|---|
| **Create / Edit** (ฟอร์ม) | `Section header` (R3) | Divider = false · Badge เมื่อมีจำนวน · ปุ่มขวาใช้ Actions ในตัว |
| **Detail** (R11 — หัวหน้าขึ้นต้น "หมายเลข…") | `Section label` (R5) | **ห้ามใช้ Section header** · Info icon / More actions ปิด · ไม่มี badge ⇒ จำนวนต่อท้ายชื่อ "(n)" ตาม wireframe "รายการรถ (จำนวน xx)" · ปุ่มหลัก = Primary action (Tertiary brand button) · ปุ่มรอง = Secondary action (Tertiary button) |
| หน้างานรายคัน (มีขั้นตอน) | `Section header` | ⏳ รอเคาะว่านับเป็นหน้า Detail ไหม |

## 3. ช่องกรอก

| จุด | component | เงื่อนไข |
|---|---|---|
| ข้อความ (R6) | `Text input` Size=md · State Default/Filled/Error/Readonly | **Info icon ปิดทั้งชั้นบนและ `Input label` ที่ซ้อนข้างใน (R4)** — ตัวที่โผล่คือของ Input label · error = Helper + Helper text · ค่าที่ระบบเติม = State Readonly |
| เลือก (R7) | `Input dropdown` | Info icon ปิด · พิมพ์ค้นได้ = Leading icon search + รายการ `Dropdown list` ใต้ช่อง |
| ข้อความยาว | `Text area` | Info icon ปิด · "(ถ้ามี)" ผ่าน Optional |
| แถววงเงิน + WBS (R18) | Text input × 4 | **เลข WBS · เลขโครงข่าย · เลขกิจกรรม ไม่บังคับ — ป้ายมี "(ถ้ามี)" (Optional = true ทั้งช่องและ Input label ที่ซ้อน) ไม่มี error ตอนบันทึก** (เคาะ 19 ต.ค. 2569) · วงเงินบังคับ · วงเงินครึ่งซ้าย · กลุ่ม `WBS` (เลข WBS · โครงข่าย · กิจกรรม) ครึ่งขวา — **layoutGrow รับแค่ 0/1** ใช้ซ้อนกลุ่ม · mobile เรียงลง (plan.md F10) |
| อัปโหลด | `File upload` Type=Default | **1 คอลัมน์** · หน้า Detail ปิดกล่องอัปโหลด (File upload = false) แสดงแค่รายการไฟล์ · ไฟล์ error = `_File upload item base` State=Error |
| เลือกรถ (dual list) | `List with checkbox` × 2 | ⏳ ทีมออกแบบทำเอง — ไม่ปรับเพิ่ม |
| Content ในหน้า Create/Edit | — | ⏳ ทีมออกแบบปรับเอง |

## 4. แสดงข้อมูล

| จุด | component | เงื่อนไข |
|---|---|---|
| กล่องแสดงข้อมูล (R12) | เฟรม `Content` > `Content item row` Column width=Full | ตามตัวอย่าง Maintain-D หน้า "Flow การซ่อม" (VehicleInfo > Content): **พื้น Color/surface/secondary-subtle (#F9FAFB) · มุม 8 · ขอบใน 24 · ระยะแถว 24** · แถวละ 4 ช่อง (mobile 2) · `_Content item base` Type=Text with label · **ไม่มีไอคอนนำ** · ผูกสีกับตัวแปรไลบรารีถ้าหาได้ · **กล่อง "ข้อมูลยานพาหนะ" ของหน้างานรายคันทุกขั้น = 6 ช่องเท่านั้น** ทะเบียน · ยี่ห้อ/รุ่น · ประเภท · อายุการใช้งาน · เลขไมล์สะสม · ชั่วโมงสะสม (ไม่มี Purchase Order / อู่ — ภาพที่เจ้าของงานส่ง 21 ต.ค. 2569 "แสดงแค่ที่ส่งไปให้เท่านั้น") · หน้ารายคันของ dashboard ใช้กล่องเดียวกัน แล้วแยกกล่อง "งาน Overhaul" (แผน · PO · อู่ · หน่วยงาน · ปีแผน · สถานะ) |
| ตาราง (R8 R9) | **`Table`** Alternating fills=True | **เรียกทั้งก้อน** ห้ามวาง Table cell / Table header cell เดี่ยว · Scrollbar ปิด · Pagination ตามหน้ารายการ · คอลัมน์/แถวที่ไม่ใช้ซ่อน · ช่อง: Text / Lead text / Badge (Pill outline) / Action icons / Lead checkbox / Lead Progress Bar · mobile = การ์ด `Mobile table` |
| ช่องตาราง 2 บรรทัด · สีบรรทัดรอง | `Table cell` Style=Text + Supporting text | ข้อมูล 2 บรรทัด (ประเภทงบ+เลขที่งบ · ผู้แก้ไข+เวลา · ระยะสัญญา · รายละเอียดตามสถานะ) · **ใกล้ครบสัญญา = บรรทัดรองสีแดง error-600 #D92D20** (PO CF หน้า 2 · 21 ต.ค. 2569 · `tintSub()`) · **Style=Badge มีแต่ Pill ไม่มีบรรทัดรอง** ⇒ ข้อมูลประกอบสถานะ (วันนัด/วันอยู่อู่/ประกัน) ไปอยู่คอลัมน์ถัดไป "รายละเอียดตามสถานะ" (PO CF หน้า 3 ยอมรับทางเลือกนี้) |
| ป้ายสถานะ | `Pill outline` | สีตามตารางสถานะ `Diagram/…/12-overhaul-สถานะ.md` |
| ขั้นตอน (R10 R15) | **`Progress steps`** Type=Horizontal (instance) | **ใช้ instance ทั้งก้อนเสมอ** — เจ้าของงานเพิ่มช่องเป็น **7** แล้ว publish (19 ต.ค. 2569) ⇒ พอทั้งหน้างาน Overhaul 6 ขั้นและงานซ่อม 7 ขั้น · Step 2/3/4 = true แล้ว**ซ่อนช่องที่เกินจำนวนขั้น** · ช่อง: Status Completed/Current/Incomplete · Number "01" "02" … · Text ชื่อขั้น · Supporting ปิด · Connector ปิดช่องสุดท้าย · ไฟล์ที่ยังไม่อัปเดตไลบรารี (ช่องไม่พอ) ปลั๊กอินวางเฟรมมีกรอบแทนชั่วคราวแล้วรายงาน — อัปเดตไลบรารีแล้วกดปุ่มอีกรอบจะสลับเป็น instance · mobile = `Mobile progress steps` |
| ว่าง / ค้นไม่เจอ | `Empty state/Data empty` · `Empty state/Search not found` | ข้อความตามสถานการณ์ · ปุ่มที่ไม่ใช้ซ่อน |

## 4.1 การนัดหมาย (S7 นำรถเข้าอู่ · S13 นัดรับรถ) — R16 R17

> เจ้าของงานสั่ง 19 ต.ค. 2569: _"การนัดหมายเข้าซ่อมอยากให้ใช้แบบนี้ เพราะเรื่องการซ่อมบำรุงใช้แบบนี้ โดย section รูปแบบการซ่อม ไม่ต้องมี"_

| state | component · variant | เงื่อนไข |
|---|---|---|
| ฟอร์มว่าง | **`RepairAppointmentStep`** (component ในไฟล์ Maintain-D หน้า Design) Type=In · State=Default | **RepairMethod = false** (ไม่มี section รูปแบบการซ่อม) · **ภาพที่เจ้าของงานส่ง 21 ต.ค. 2569 (ค่ำ):** ส่วนนี้ = `Section header` "รายละเอียดการนัดหมาย" ของเรา → **กล่องแสดงข้อมูล (R12) 3 ช่อง ศูนย์บริการ/อู่ · เบอร์โทร ศูนย์บริการ/อู่ · ที่อยู่ (ค่าจาก PO)** → component (ซ่อนหัวข้อในตัว) ที่เหลือช่องกรอก 3 ช่อง — `apptSection()` ใช้กับทุก state ของ S7/S13 desktop |
| เลือก/กรอกแล้ว · แก้ไขนัด | Type=In · State=Filled | ผู้ประสานงานแสดงชื่อ + หน่วยงานใต้ชื่อ · เบอร์เติมอัตโนมัติ |
| กรอกไม่ครบ | Type=In · State=Default + ช่องที่ขาด State=Error + Helper | ข้อความ "กรุณาเลือกช่วงวัน…" · "กรุณาเลือกผู้ประสานงาน" |
| รอตอบกลับ | Type=**Wating** · State=Default | "รอตอบกลับจากหน่วยงาน" + ปุ่ม "แก้ไขนัดหมาย" ในตัว · ไม่มีแถวปุ่มท้าย |
| ปฏิเสธ | Type=In · State=**ReturnReason** | section "ผลตอบกลับ" แสดง "เหตุผลการปฏิเสธ" + ฟอร์มนัดใหม่ |
| ปุ่มท้าย | Secondary "ย้อนกลับ" ซ้าย · Primary **"ส่งนัดหมาย"** ขวา | ตามคำของงานซ่อม |

ช่องของงานซ่อม → ช่องของ Overhaul (userflow S7/S13): ช่วงเวลาที่รับมอบรถ → **ช่วงวันนำรถเข้า / ช่วงวันนัดรับรถ** · ช่างซ่อม → **ผู้ประสานงาน (กบค.)** ·
เบอร์โทรศัพท์ผู้รับมอบรถ → **เบอร์โทรผู้ประสานงาน (กบค.)** (เติมอัตโนมัติ) · **สถานที่รับรถ (Text area) ซ่อน — ไม่มีช่องอู่ในฟอร์ม** (อู่แสดงในกล่องข้อมูลยานพาหนะด้านบนแล้ว) · ไม่มีช่องหมายเหตุ — ✅ เจ้าของงานเคาะ 21 ต.ค. 2569 โดยส่งข้อความจากจอ S7 ที่แก้ไว้ให้ยึดตาม (ฟอร์ม = ช่วงวัน · ผู้ประสานงาน · เบอร์ · ปุ่ม ย้อนกลับ/ส่งนัดหมาย)
mobile: **ยังไม่ทำ** (เจ้าของงาน 21 ต.ค. 2569: "บนมือถือยังไม่ต้องแก้ ถ้ามีการทำมือถือ ให้อ่านจาก desktop แต่ตอนนี้ยังไม่ทำ mobile") — จอมือถือคงแบบประกอบเองเดิมไว้ (มีแถวอู่/หมายเหตุ) ตอนทำมือถือให้ยึดฟอร์ม desktop ตัดอู่/หมายเหตุตาม · หน้าต่างปลั๊กอินมีตัวเลือกอุปกรณ์ ค่าเริ่มต้น Desktop · ไฟล์ที่ไม่มี component นี้ ปลั๊กอินใช้แบบประกอบเองแทนและเทสต์ขึ้นผิดกติกา R17

## 4.2 ความคืบหน้างานซ่อม (S9 เพิ่ม · S10 แก้ไข · S11 ลบ) — R23 แบบที่เจ้าของงานส่งเป็นหลัก

> เจ้าของงานสั่ง 21 ต.ค. 2569 (ค่ำ) พร้อมวางข้อความจากเฟรม J.1–J.3 บนหน้า Figma เดิม: _"scen J ให้ปรับแก้ใน script เป็นแบบที่ส่งไป ครั้งหน้าถ้าต้อง gen ui ให้ยึดตามแบบที่ส่งไป"_

**R23 — ลำดับแหล่งความจริงของโครงจอ:** (1) ข้อความ/ภาพจากเฟรม Figma ที่เจ้าของงานส่งมา → (2) ชีต CF ของ PO → (3) userflow/AC เดิม · ถ้าชีต CF มีคอลัมน์ที่จอของเจ้าของงานไม่มี **ไม่ใส่** แล้วจดไว้ในไฟล์ 19 ว่า "รอเคาะ" · เทียบจอที่สร้างกับข้อความที่ส่งด้วย harness `DUMP_TEXT='^OH2 / J\.2 '` (พิมพ์ข้อความทุกชั้นตามลำดับ layer รวมที่ซ่อน) · mobile ยังไม่ทำ (อ่านจาก desktop ทีหลัง)

| จุด | component · variant | เงื่อนไข (ตามจอ J ที่ส่ง) |
|---|---|---|
| หัวข้อ | `Section header` "รายละเอียดการติดตาม" + Secondary "ความคืบหน้า" ไอคอน add | Badge ซ่อน |
| ตาราง (J.3) | `Table` คอลัมน์ **วันที่ · รายละเอียด · หมายเหตุ · ไอคอน** (190 / ยืด / 260 / 104) + `Table pagination` | ค่า "dd/mm/yyyy hh:mm น." · หมายเหตุว่าง = "-" · ไอคอนแก้ไข+ลบ (เหลือ 1 รายการ = แก้ไขอย่างเดียว) · **ไม่มี** คอลัมน์ ผู้บันทึก / รูป-ไฟล์แนบ ที่ PO เสนอในชีต (รอเคาะ) |
| ว่าง (J.1) | `Empty state/Data empty` | "ยังไม่มีความคืบหน้า" / "เพิ่มความคืบหน้าอย่างน้อย 1 รายการก่อนกด \"ซ่อมสำเร็จ\"" · ซ่อน Actions · ปุ่ม "ซ่อมสำเร็จ" Disabled |
| ฟอร์ม (J.2 · K.1) | `Modal` Type=Form · `Card form row` ×3 | วันที่/เวลา (Text input) · รายละเอียด (`Text area`) · **หมายเหตุ Optional=true (ป้าย "(ถ้ามี)") placeholder "ระบุหมายเหตุ"** · ปุ่ม ยกเลิก / บันทึก · `formModal` รองรับ `optional` + `placeholder` และ sync `Input label` ชั้นใน (R4) |
| state | J.1 ยังไม่มีความคืบหน้า · J.2 เพิ่มความคืบหน้า · J.3 มีความคืบหน้า 2 รายการ | toast 17/18 อยู่บนหน้า toast แยก (R20) · state "ดูรูปแนบ (lightbox)" ถอดออก (อยู่ใน `REMOVED_STATES` ปุ่มอัปเดตจอที่เลือกจะติดป้าย " · ตัดแล้ว" ไม่ลบ) |
| เทส | `MODE=build-pick PICK=9 DEVICES=desktop FIRST=S9 node figma-export/test-overhaul2-plugin.js` | checker R23: จอ `S9 — มีความคืบหน้า` desktop หัวตารางต้องเป็น วันที่ · รายละเอียด · หมายเหตุ |

## 4.3 เลือกรถในฟอร์ม PO (S4 สร้าง · S5 แก้ไข) — R24 dropdown + ชิป

> เจ้าของงานสั่ง 21 ต.ค. 2569 (ค่ำ): _"scen E จังหวะเลือกรถ อยากให้แก้ไขเป็น dropdown select พอเลือกรถ โดยมีรายละเอียดข้อมูล ทะเบียนรถ จังหวัดรถ เป็นเหมือน selected ของรถคันนั้น"_ · เคาะ: ชิปใต้ช่อง · แถวใน dropdown = ทะเบียน+จังหวัดอย่างเดียว · ตัวกรอง หน่วยงาน/เขต · ประเภทรถ ยังไม่ใส่

| จุด | component · variant | เงื่อนไข |
|---|---|---|
| ช่องเลือกรถ | `Input dropdown` Size=md · Leading icon = search · placeholder "ค้นหาทะเบียน, จังหวัด" | ครึ่งซ้ายของแถว (Spacer ขวา) · พิมพ์ค้นแล้ว State=Focused Text = คำค้น · ไม่มีข้อความ error (AC-S4 บังคับแค่ ชื่อ · อู่ · ใบสั่งจ้าง — ต้องเลือกรถอย่างน้อย 1 คันไหม ยังไม่เคาะ) |
| รายการที่เปิด | `Dropdown list` + `Dropdown list item` Supporting=false | แถวละ "ทะเบียน จังหวัด" (เช่น 72-6648 สงขลา) · กรองตามคำค้น · คันที่เลือกแล้ว State=Selected · แสดงได้เท่าช่องของ component (`comboAt`) |
| รถที่เลือกแล้ว | `Badge outline with remove icon` Color=Brand ต่อคัน ในกรอบ "Selected cars" (แนวนอน gap 8 ตัดบรรทัดได้) | ข้อความ = ทะเบียน จังหวัด · กด × เอาออก · ไม่มี dual list / ปุ่ม เพิ่ม-นำออก / `List with checkbox` บน desktop อีก (checker R24) |
| mobile | **ยังไม่ทำ** — คง dual list เดิม | ตอนทำมือถือให้อ่านจาก desktop (dropdown เต็มกว้าง + ชิปใต้ช่อง) |
| state | E.5 เลือกรถ (พิมพ์ค้นแล้วเลือกจาก dropdown) = พิมพ์ "7" → 3 คัน คันแรกเลือกแล้ว + ชิป 1 · E.6 กรอกครบ = ชิป 2 คัน · S5 ฟอร์มแก้ไข = ชิปรถเดิมใน PO | ชื่อ state เดิม "ติ๊กรถแล้วกดเพิ่ม" อยู่ใน `STATE_ALIAS` |
| เทส | `MODE=build-pick PICK=4,5 DEVICES=desktop FIRST=S4 node figma-export/test-overhaul2-plugin.js` | R24: จอ S4/S5 desktop ห้ามมี List with checkbox · จอ S4 เลือกรถ/กรอกครบ/บันทึกไม่สำเร็จ ต้องมี Badge outline with remove icon |

## 5. ปุ่มและชั้นบน

| จุด | component | เงื่อนไข |
|---|---|---|
| แถวปุ่มท้ายหน้า | `Secondary button` / `Primary button` Size=lg | ย้อนกลับ/ยกเลิก **ชิดซ้าย** · ยืนยัน **ชิดขวา** · **ปุ่มเดียวชิดขวา** · mobile ปุ่มเต็มแถวแบ่งเท่ากัน |
| ปุ่มลบ | `Secondary danger button` (หน้า) · `Primary danger button` (ยืนยัน) | — |
| ยืนยันลบ | `Modal` Type=Destructive centered image with input | desktop กลางจอ · **mobile = bottom sheet** (Background overlay + Bottom sheet header/footer · มุมบน 24) |
| ฟอร์มใน popup | `Modal` Type=Form · แถว `Card form row` | mobile = bottom sheet |
| จัดการท้ายแถว (R21) | `Table cell` / `Mobile table item` Style=**Action icons** | ไอคอน ดูรายละเอียด · แก้ไข · ลบ (ช่อง View/Edit/Print/Delete เปิดตามจำนวนไอคอน แล้วสลับไอคอน · `fillIcons()`) · **ห้ามใช้ `Dropdown menu` "…" ในจอ Overhaul** (PO CF 21 ต.ค. 2569 ทุกหน้า "ขอเป็น ICON Action") · mobile = แถวไอคอนท้ายการ์ด · ปุ่มไปหน้างาน = ไอคอนลูกศรขวา |
| lightbox รูปแนบ (**พักไว้** — ไม่อยู่ในจอ J ที่เจ้าของงานส่ง 21 ต.ค. ค่ำ · R23) | `Modal` Type=Centered image carousel · mobile = bottom sheet + `Images` Size=sm | PO CF หน้า 5 (21 ต.ค. 2569) "ทำเป็น Lightbox ขึ้นมาก็ได้" · ซ่อน Modal footer · หัว = วันเวลาของความคืบหน้า · ฟังก์ชัน `lightbox()` ยังอยู่ใน code.js เรียกกลับได้เมื่อเคาะ |
| แจ้งผล (toast) | `Notification` Success/Error | ถ้อยคำตามที่ PO confirm 21 ต.ค. 2569 (`TOASTS` ใน code.js · ไฟล์ 16 หัวข้อ 6) · ขวาล่าง ห่างขอบ 24 มี Supporting text · general error = รหัส status เช่น "500 Internal Server Error" · ไฟล์ผิดรูปแบบไม่ใช่ toast (validation ที่รายการไฟล์ `_File upload item base` State=Error) |
| ตัวกรอง | `Side panel header` + `Side panel footer` + ช่องกรอก · สถานะใช้ `Checkbox with badge` | mobile = bottom sheet |

## 5.1 การจัดวางจอบนหน้า (R19) — แพทเทิร์นของทีมออกแบบ ใช้ทุกครั้งจนกว่าจะเปลี่ยน

> เจ้าของงานสั่ง 20 ต.ค. 2569 (ส่งภาพหน้า Flow การซ่อม "B นัดหมายวันซ่อม › B1 เข้าซ่อมที่… › B1.1 Default …" เป็นแบบ): _"อยากให้แบ่ง แตกรายละเอียดเป็นแบบรูปตัวอย่าง"_ · _"เห็นมีส่วนที่แยก desktop mobile ด้วย อยากให้จำแพทเทิร์นด้วย ว่าต่อไปจะสร้างให้ทำแบบนี้ จนกว่าจะมีการเปลี่ยนแปลง"_

| ชั้น | component · variant | เงื่อนไข |
|---|---|---|
| แถบตัวอักษร (A · B · …) | `Header` Type=Subheader › `State` State=**Default** (ดำ #101828) + "S1 กบค. สร้างแผน…" | **1 scenario = 1 บล็อก · ตัวอักษร = scenario** (เจ้าของงานเคาะ 20 ต.ค. 2569 "อยากแยก scenario ออกจากกัน") · กว้างเท่าจำนวน state |
| แถบย่อย (B1 · B2) | `Header` › `State` State=**Sub Flow** (เทา #667085) | ใช้เฉพาะเมื่อกลุ่มหนึ่งมีหลาย scenario (ตอนนี้ไม่ใช้ — `buildGrid` ข้ามเมื่อ sub.code = g.code) |
| ป้าย state (A.1 · A.2) | `Header` › `State` State=**Sub Flow 2** (ฟ้า #9CACCC) กว้าง 1440 ต่อคอลัมน์ | **ตัวอักษร.ตัวเลข = state ของจอ** (ว่าง · กรอกไม่ครบ · กรอกครบ · ยืนยัน · สำเร็จ …) · ป้าย Device (`Device Type` Type=Device — เจ้าของงานสั่ง 20 ต.ค. 2569 เย็น ให้อ่านจาก component set นี้ · `Component 1` ชุดเก่าเป็นตัวสำรอง) ซ้ายสุด |
| แถว Desktop | จอ 1440 เรียงตามคอลัมน์ state · ป้าย `Device Type` Type=Desktop ซ้าย กว้าง 300 สูงเท่าแถว | — |
| แถว Mobile | จอ 402×874 **ใต้คอลัมน์เดียวกัน** (x เท่ากับ desktop) · ป้าย `Device Type` Type=Mobile | **แยกแถว desktop/mobile เสมอ** (เลิกวางคู่กันในแถวเดียว) · **21 ต.ค. 2569 เจ้าของงานสั่งแยกปุ่ม export**: "สร้าง Desktop" → หน้า `overhaul-desktop-N` (แถว Desktop อย่างเดียว) · "สร้าง Mobile" → หน้า `overhaul-mobile-N` (แถว Mobile อย่างเดียว) · ผังคอลัมน์/ป้ายเหมือนเดิม · harness ตรวจว่าหน้าอุปกรณ์เดียวมีป้ายและความกว้างตรงอุปกรณ์ |
| ระยะ | ป้ายข้าง 300 + ช่อง 80 · คอลัมน์ 1440 เว้น 200 · แถบ 120 เว้น 80 · desktop→mobile เว้น 160 · กลุ่มเว้น 400 | `GRID` ใน `plugin-lib/core.js` |

- โค้ด: `buildGrid()` ใน `plugin-lib/core.js` (สำเนาใน `overhaul2-plugin/code.js`) · กลุ่มประกาศใน `GROUPS` ของแต่ละปลั๊กอิน · ป้ายชื่อ `<prefix> · …` · ไม่ใช้ section · **สร้างบนหน้าใหม่ `<base>-N` ทุกครั้ง ไม่ลบ/ไม่แตะชุดเดิม** (เจ้าของงานสั่ง 20 ต.ค. 2569 "สร้างใหม่เลย ไม่รบกวนของเดิม") · แถบ Header ใส่ข้อความไม่ได้เพราะฟอนต์ LINE Seed Sans ไม่มีในเครื่อง → สลับฟอนต์สำรอง / แถบธรรมดา
- **แก้บนหน้าเดิมที่มีของแก้มือ (21 ต.ค. 2569):** ปุ่ม "อัปเดตจอที่เลือกเป็นฉบับ CF" สร้างจอฉบับปัจจุบันแทนที่เฉพาะเฟรมที่ผู้ใช้เลือก (ตำแหน่ง/ชื่อเดิม · จอที่ไม่ได้เลือกไม่แตะ · state ที่ CF ตัดติดป้าย " · ตัดแล้ว" ไม่ลบ) + state ใหม่ต่อท้ายแถวของ scenario นั้น (หน้าแบบ R19 ใช้คอลัมน์ถัดไป · หน้าแบบ 19 ต.ค. ที่ mobile วางคู่ desktop ต่อท้ายขอบขวา) · ปุ่ม "แก้คำ/ไอคอนทุกจอ" แตะแค่ property (ชื่อสถานะ · toast · ช่อง "…" → ไอคอน · placeholder) · checkbox "วางต่อท้ายหน้าที่เปิดอยู่" ใช้กับทุกปุ่มสร้าง · harness: `MODE=patch CODE=<code.js เก่า> PATCH=update-selected SELECT=all|regex [ADDNEW=0] [CHECK_ONLY=regex] [R19=0]`
- `Header`/`State` เป็น component จากอีกไลบรารี (หาได้จาก instance ในไฟล์ Maintain-D) — เปิดไม่ได้ปลั๊กอินวาดแถบธรรมดาสีเดียวกัน (ป้ายอยู่นอกจอ ไม่กระทบกติกา "ทุกชิ้นในจอเป็น instance")
- เทส: harness ตรวจว่ามีป้ายรหัส flow และจอ mobile ทุกจออยู่ใต้ desktop คอลัมน์เดียวกัน

## 5.2 หน้า toast แยก (R20) — เจ้าของงานสั่ง 21 ต.ค. 2569

> _"ส่วนที่เป็น toast ก็แยกออกเป็นอีกหน้าโดยไม่ต้องมีหน้า ui อย่างอื่นเข้ามา ทำเป็น toast แยกเลย พร้อมให้ export แบบแก้ไขได้"_

| จุด | component · variant | เงื่อนไข |
|---|---|---|
| เฟรม | เฟรมโปร่ง (ไม่มีพื้น) หุ้ม toast พอดี ชื่อ `TOAST / A.1 · 1 — T1 …` | **ไม่ใช่ขนาดจอ** (ยกเว้น R14) · ข้างในต้องมีแค่ instance `Notification` 1 ตัว ไม่มีเปลือกหน้า/ชิ้นอื่น · **ต้องมี Export settings** (SVG + PNG 2x) ⇒ เลือกเฟรมแล้ว Export ได้ทันที และยังแก้ข้อความ/สลับ Type ในไฟล์ได้ |
| toast | `Notification` Type=Success/Error · Breakpoint=Desktop (แถวบน) / Mobile กว้าง 370 (แถวล่าง) | ถ้อยคำตาม `TOASTS` (PO confirm) · Supporting text ตามสเปก 16 ข้อ 1.1 |
| จัดวาง | R19 เหมือนชุดอื่น (บล็อก A–E = หน้า 1–5 · ป้าย state = A.1 A.2 … · แถว Desktop แล้ว Mobile) | แถวสูงเท่าเนื้อหา (`rowMin: 0`) · หน้าใหม่ `overhaul-toast-N` ทุกครั้ง · toast ที่ชีตแท็บรายหน้าใช้ซ้ำข้ามหน้า สร้างซ้ำในบล็อกของหน้านั้น |
| เทส | `MODE=build-toast PREFIX=TOAST FIRST='T1 ' node figma-export/test-overhaul2-plugin.js` | checker: เฟรมชื่อขึ้นต้น `TOAST / ` ข้าม R14 แต่ต้องมี Notification · ไม่มี instance อื่น · มี exportSettings |

## 5.3 Dashboard งาน Overhaul (R22) — เจ้าของงานสั่ง 21 ต.ค. 2569

> _"outcome ที่อยากเห็น เป็นเรื่องของการ tracking อะไหล่ อายุการใช้หลังจาก overhaul ทั้งภาพรวม และรายคัน"_ · เอกสารคอลัมน์ `Diagram/01-บำรุงรักษาตามวาระ/20-overhaul-dashboard-หลัง-overhaul.md`

| จุด | component · variant | เงื่อนไข |
|---|---|---|
| โครงหน้า | ลอก **MA Overview** ของ UI Release#2 (351:181468) | Page header → `Tabs` (Tab item Active + `Pill outline` Brand นับ) → แถว `Metric item` ×4 (desktop ยืดเต็ม 1296 · mobile 2 ใบต่อแถว) → `Alert` Gray "ข้อมูล ณ วันที่" (+ Alert Info "คอลัมน์ที่ยังไม่มีข้อมูล" ในฉบับเป้าหมาย) → `Table header` → `Table` **≤ 8 คอลัมน์** → pagination / Empty state |
| Metric | `Metric item` Breakpoint=Desktop/Mobile · `Featured icon` ซ้อน Color = Brand/Gray/Info/Success/Warning/Error/Purple ตามความหมาย | ตัวเลข = Number · ป้าย = Text · ไม่มีเป้า ไม่มีคะแนนผู้รับจ้าง |
| กราฟ | **ไม่มี chart component ในไลบรารี** | ห้ามวาดกราฟ/SVG เอง — ใช้ Metric · Pill · Progress bar · ตาราง · กล่อง ก่อน→หลัง แทน |
| หน้ารายคัน | หน้า Detail (R5 R11 R12): `Section label` + `Content item row` | กล่อง "ก่อน → หลัง Overhaul" 2 ช่องต่อแถว · ตารางอะไหล่/งานซ่อมหลัง ≤ 8 คอลัมน์ |
| เฟส | ทุกบล็อกมี 2 state: "เฟส 1" (คอลัมน์ที่มีข้อมูลจริง) · "เป้าหมาย" (+ คอลัมน์ NONE ติด Alert) | ตามกติกา no-data-no-ui |
| เทส | `MODE=build-dash FIRST='DASH แผน' node figma-export/test-overhaul2-plugin.js` | checker: จอชื่อ `DASH แผน/รถหลัง/ซ่อมหลัง/อะไหล่` ต้องมี Tabs + Metric item |

## 6. ข้อจำกัดไลบรารี (instance เพิ่มลูกไม่ได้) — เกินแล้วต้องถาม

| component | ขนาดสูงสุด | ที่ติดอยู่ตอนนี้ (19 ต.ค. 2569) |
|---|---|---|
| `Table` | 8 คอลัมน์ × 10 แถว | ⏳ หน้ารายการแผนหลัง CF มี **13 คอลัมน์** (21 ต.ค. 2569 PO เพิ่มหน่วยงาน) ⇒ ยังประกอบเองไว้ กว้าง ~1,560 เกินจอ 1440 · หน้า 2 (7 คอลัมน์) หน้า 3 (8) ใช้ Table ได้แล้ว · รอเคาะ ซ่อน/รวมคอลัมน์ หรือทีมออกแบบขยาย Table |
| `Progress steps` | **7 ช่อง** (อัปเดต 19 ต.ค. 2569 · เดิม 5) | ✅ หน้างาน 6 ขั้นใช้ instance ได้แล้ว |

## 7. ส่วนที่ยังประกอบจากชิ้นไลบรารี (ไม่มี component ทั้งก้อนให้ใช้ — ยังไม่ผ่านรีวิว)

bottom sheet (ไลบรารีล็อกเนื้อหาตายตัว) · แผงตัวกรองด้านข้าง · กรอบปุ่มลบข้าง Page header · dual list

## ประวัติ

| วันที่ | เปลี่ยน |
|---|---|
| 21 ต.ค. 2569 (ค่ำ · รอบ 5) | **R24 เลือกรถในฟอร์ม PO = Input dropdown + ชิป** (S4/S5 desktop · แถว dropdown = ทะเบียน+จังหวัด · ชิป Badge outline with remove icon · ตัด dual list / List with checkbox · mobile คงเดิม) · `comboAt` ซ่อนบรรทัดรองเมื่อไม่ส่ง · state "ติ๊กรถแล้วกดเพิ่ม" → "เลือกรถ (พิมพ์ค้นแล้วเลือกจาก dropdown)" (STATE_ALIAS) |
| 21 ต.ค. 2569 (ค่ำ · รอบ 4) | **R23 แบบที่เจ้าของงานส่งเป็นหลัก** — scen J (S9) ปรับตามข้อความจากเฟรม J.1–J.3: ตาราง วันที่ · รายละเอียด · หมายเหตุ · ไอคอน + pagination · ฟอร์ม วันที่/เวลา · รายละเอียด · หมายเหตุ (ถ้ามี) "ระบุหมายเหตุ" · ถอดคอลัมน์ ผู้บันทึก / รูป-ไฟล์แนบ และ state lightbox (รอเคาะ) · S9 เหลือ 3 state (61 จอต่ออุปกรณ์) · `formModal` รับ optional/placeholder · `STATE_ALIAS` ชื่อ CF เช้า → ชื่อจอ J · ป้าย " · ตัดแล้ว" ใช้ข้อความกลาง |
| 21 ต.ค. 2569 (ค่ำ) | R16–R17 ฟอร์มนัดหมาย desktop: **ซ่อน Text area "สถานที่รับรถ"** (ไม่มีช่องอู่ในฟอร์ม) — เจ้าของงานส่งข้อความจากจอ S7 ที่แก้ไว้ให้ยึดตาม แล้วสั่งปรับ H1–H7 ให้สอดคล้อง · **มือถือยังไม่ทำ** คงเดิม (ถ้าทำให้อ่านจาก desktop) · ตัวเลือกอุปกรณ์ในหน้าต่างปลั๊กอิน ค่าเริ่มต้น Desktop ใช้กับทุกปุ่มสร้าง |
| 21 ต.ค. 2569 (ค่ำ) | ปุ่ม **"สร้างเฉพาะ scenario ที่เลือก"** (ติ๊ก A–O · Desktop/Mobile/ทั้งคู่ · รหัสคงเดิม · หน้า overhaul-sel-N) — ใช้ generate จอนัดหมาย S7/S13 ฉบับ CF มาเทียบกับหน้าเดิมโดยไม่สร้างทั้ง 14 |
| 21 ต.ค. 2569 (เย็น) | **R22 Dashboard งาน Overhaul** (แท็บ แผน · รถหลัง Overhaul · ซ่อมหลัง Overhaul · อะไหล่ + หน้ารายคัน · โครง MA Overview · Metric item/Tabs เข้า DIRECT · ปุ่ม "สร้าง Dashboard" 12 จอ × 2) · **แก้บนหน้าเดิม**: ปุ่ม "อัปเดตจอที่เลือกเป็นฉบับ CF" + "แก้คำ/ไอคอนทุกจอ" + checkbox "วางต่อท้ายหน้าที่เปิดอยู่" (เจ้าของงานถามเรื่องหน้า Figma ที่แก้มือไว้บางส่วน) |
| 21 ต.ค. 2569 (บ่าย) | แยกปุ่ม export **Desktop / Mobile** เป็น 2 ปุ่ม (หน้า overhaul-desktop-N / overhaul-mobile-N · `buildGrid` รับ `devices`) · รวบปุ่มปลั๊กอินเหลือ 5: Desktop · Mobile · toast · notification · เช็ค component — ถอดปุ่มแก้เฉพาะจุดชุดเก่า (จัดวางใหม่ · Device Type · ปิด Clip) ปุ่มเทียบก่อน/หลัง CF และบล็อก P toast ในชุด notification (toast มีหน้าแยกแล้ว) · โค้ดเก่าดูใน git ก่อน 21 ต.ค. |
| 21 ต.ค. 2569 | PO confirm ครบทุกหน้า (ชีต CF แท็บ 1–5 + OH-Toast) ⇒ ชุด 14 scenario เปลี่ยนเป็นฉบับ CF ทั้ง 5 หน้า (คอลัมน์ใหม่ · ชื่อสถานะ รอเลข PO/รอดำเนินการ · ถ้อยคำ toast `TOASTS` · state ไม่พบแผน/บันทึกไม่สำเร็จ/lightbox/validation ไฟล์) · **R21** จัดการท้ายแถว = Action icons ห้าม Dropdown menu · **R20** หน้า toast แยก (เฟรมโปร่งมีแค่ Notification + Export settings · ปุ่ม "สร้างหน้า toast") · Table cell 2 บรรทัด + บรรทัดรองสีแดง · lightbox = Modal carousel / Images |
| 20 ต.ค. 2569 | R19: จัดวางแบบตาราง flow ของทีมออกแบบ (1 scenario = 1 บล็อกตัวอักษร · A.1 A.2 = state · แถว Desktop แล้ว Mobile · ป้าย Header/State + Component 1 · หน้าใหม่ทุกครั้ง ไม่แตะชุดเดิม) — ใช้ทุกครั้งจนกว่าจะเปลี่ยน · (เคยเสนอกลุ่มตามหน้า/ขั้น เจ้าของงานเลือกแยกราย scenario) |
| 20 ต.ค. 2569 (เย็น) | R19 ป้ายข้างจอ: อ่านจาก component set `Device Type` (property Type = Device · Desktop · Mobile · กว้าง 300 · พื้น #667085) ของทีมออกแบบแทน `Component 1` (คงไว้เป็นตัวสำรอง · ปลั๊กอินจับชื่อ variant แบบไม่สนตัวพิมพ์ · ปุ่ม "เช็ค component" รายงาน variant ที่พบ) · เพิ่มบล็อก P toast + Q notification (ปุ่มแยก หน้า overhaul-noti-N · สเปก `Diagram/01-บำรุงรักษาตามวาระ/16-overhaul-toast-notification.md`) · ถอดปุ่มแก้เฉพาะจุด 3 ปุ่ม (นัดหมาย · รีวิว 19 ต.ค. · แถว WBS) ที่ใช้เสร็จแล้ว |
| 19 ต.ค. 2569 | R18: 3 ช่อง WBS ไม่บังคับ "(ถ้ามี)" |
| 19 ต.ค. 2569 | Progress steps ในไลบรารีเพิ่มเป็น 7 ช่อง ⇒ stepper เป็น instance ทุกจอ (ปุ่มนัดหมาย+stepper / แก้ตามรีวิว สลับให้) |
| 19 ต.ค. 2569 | R10 แก้: stepper 6 ขั้นทำแบบหน้างานซ่อม (เฟรมมีกรอบ/มุม 8) รวมกับปุ่มส่งออกนัดหมาย |
| 19 ต.ค. 2569 | R16–R17: การนัดหมาย S7/S13 ใช้ `RepairAppointmentStep` (RepairMethod ปิด) แบบงานซ่อม |
| 19 ต.ค. 2569 | R15: stepper ใช้ component `Progress steps` Type=Horizontal ทั้งก้อน (เจ้าของงานส่งภาพ component) |
| 19 ต.ค. 2569 | ตั้งไฟล์จากรีวิวทีมออกแบบ (Header Tablet · Page header ไม่มี divider · Section header เฉพาะ Create/Edit · Section label หน้า Detail · ปิด Info icon · Table/Progress steps ทั้งก้อน · กล่องแสดงข้อมูล) + กติกาเดิมของวันเดียวกัน (1 จอ 1 เฟรม · mobile 402×874 · ปุ่มท้ายซ้าย–ขวา · อัปโหลด 1 คอลัมน์ · แถว WBS · ปิด divider) |
