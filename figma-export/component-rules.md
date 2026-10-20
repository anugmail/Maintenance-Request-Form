# กติกาการสร้างจอด้วย component จริง (Overhaul v2 · ใช้กับทุกงานสร้างจอของโปรเจกต์นี้)

> 🔴 เจ้าของงานสั่ง 19 ต.ค. 2569: _"อยากให้เซฟข้อมูลเงื่อนไขการสร้างแต่ละจุดไว้ด้วย การสร้างครั้งต่อไปของโปรเจ็คนี้จะใช้เงื่อนไข component ที่ถูกต้องเท่านั้น"_
>
> - ไฟล์นี้ = คำอธิบายรายจุด · [`component-rules.json`](component-rules.json) = กติกาฉบับที่เครื่องตรวจ (รหัส R1–R18 ตรงกัน) — **แก้กติกาต้องแก้ทั้งคู่**
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
| กล่องแสดงข้อมูล (R12) | เฟรม `Content` > `Content item row` Column width=Full | ตามตัวอย่าง Maintain-D หน้า "Flow การซ่อม" (VehicleInfo > Content): **พื้น Color/surface/secondary-subtle (#F9FAFB) · มุม 8 · ขอบใน 24 · ระยะแถว 24** · แถวละ 4 ช่อง (mobile 2) · `_Content item base` Type=Text with label · **ไม่มีไอคอนนำ** · ผูกสีกับตัวแปรไลบรารีถ้าหาได้ |
| ตาราง (R8 R9) | **`Table`** Alternating fills=True | **เรียกทั้งก้อน** ห้ามวาง Table cell / Table header cell เดี่ยว · Scrollbar ปิด · Pagination ตามหน้ารายการ · คอลัมน์/แถวที่ไม่ใช้ซ่อน · ช่อง: Text / Lead text / Badge (Pill outline) / Action icons / Lead checkbox · mobile = การ์ด `Mobile table` |
| ป้ายสถานะ | `Pill outline` | สีตามตารางสถานะ `Diagram/…/12-overhaul-สถานะ.md` |
| ขั้นตอน (R10 R15) | **`Progress steps`** Type=Horizontal (instance) | **ใช้ instance ทั้งก้อนเสมอ** — เจ้าของงานเพิ่มช่องเป็น **7** แล้ว publish (19 ต.ค. 2569) ⇒ พอทั้งหน้างาน Overhaul 6 ขั้นและงานซ่อม 7 ขั้น · Step 2/3/4 = true แล้ว**ซ่อนช่องที่เกินจำนวนขั้น** · ช่อง: Status Completed/Current/Incomplete · Number "01" "02" … · Text ชื่อขั้น · Supporting ปิด · Connector ปิดช่องสุดท้าย · ไฟล์ที่ยังไม่อัปเดตไลบรารี (ช่องไม่พอ) ปลั๊กอินวางเฟรมมีกรอบแทนชั่วคราวแล้วรายงาน — อัปเดตไลบรารีแล้วกดปุ่มอีกรอบจะสลับเป็น instance · mobile = `Mobile progress steps` |
| ว่าง / ค้นไม่เจอ | `Empty state/Data empty` · `Empty state/Search not found` | ข้อความตามสถานการณ์ · ปุ่มที่ไม่ใช้ซ่อน |

## 4.1 การนัดหมาย (S7 นำรถเข้าอู่ · S13 นัดรับรถ) — R16 R17

> เจ้าของงานสั่ง 19 ต.ค. 2569: _"การนัดหมายเข้าซ่อมอยากให้ใช้แบบนี้ เพราะเรื่องการซ่อมบำรุงใช้แบบนี้ โดย section รูปแบบการซ่อม ไม่ต้องมี"_

| state | component · variant | เงื่อนไข |
|---|---|---|
| ฟอร์มว่าง | **`RepairAppointmentStep`** (component ในไฟล์ Maintain-D หน้า Design) Type=In · State=Default | **RepairMethod = false** (ไม่มี section รูปแบบการซ่อม) · หัวข้อ "รายละเอียดการนัดหมาย" ของ component |
| เลือก/กรอกแล้ว · แก้ไขนัด | Type=In · State=Filled | ผู้ประสานงานแสดงชื่อ + หน่วยงานใต้ชื่อ · เบอร์เติมอัตโนมัติ |
| กรอกไม่ครบ | Type=In · State=Default + ช่องที่ขาด State=Error + Helper | ข้อความ "กรุณาเลือกช่วงวัน…" · "กรุณาเลือกผู้ประสานงาน" |
| รอตอบกลับ | Type=**Wating** · State=Default | "รอตอบกลับจากหน่วยงาน" + ปุ่ม "แก้ไขนัดหมาย" ในตัว · ไม่มีแถวปุ่มท้าย |
| ปฏิเสธ | Type=In · State=**ReturnReason** | section "ผลตอบกลับ" แสดง "เหตุผลการปฏิเสธ" + ฟอร์มนัดใหม่ |
| ปุ่มท้าย | Secondary "ย้อนกลับ" ซ้าย · Primary **"ส่งนัดหมาย"** ขวา | ตามคำของงานซ่อม |

ช่องของงานซ่อม → ช่องของ Overhaul (userflow S7/S13): ช่วงเวลาที่รับมอบรถ → **ช่วงวันนำรถเข้า / ช่วงวันนัดรับรถ** · ช่างซ่อม → **ผู้ประสานงาน (กบค.)** ·
เบอร์โทรศัพท์ผู้รับมอบรถ → **เบอร์โทรผู้ประสานงาน (กบค.)** (เติมอัตโนมัติ) · สถานที่รับรถ → **ศูนย์บริการ/อู่** (ชื่อ · เบอร์ · ที่อยู่ จาก PO) · ไม่มีช่องหมายเหตุ (component ไม่มี) — ⏳ รอเจ้าของงานยืนยันการจับคู่ช่อง
mobile: component ไม่มี variant มือถือ ⇒ จอมือถือใช้แบบเดิม (ช่องเรียงลง) · ไฟล์ที่ไม่มี component นี้ ปลั๊กอินใช้แบบเดิมแทนและเทสต์ขึ้นผิดกติกา R17

## 5. ปุ่มและชั้นบน

| จุด | component | เงื่อนไข |
|---|---|---|
| แถวปุ่มท้ายหน้า | `Secondary button` / `Primary button` Size=lg | ย้อนกลับ/ยกเลิก **ชิดซ้าย** · ยืนยัน **ชิดขวา** · **ปุ่มเดียวชิดขวา** · mobile ปุ่มเต็มแถวแบ่งเท่ากัน |
| ปุ่มลบ | `Secondary danger button` (หน้า) · `Primary danger button` (ยืนยัน) | — |
| ยืนยันลบ | `Modal` Type=Destructive centered image with input | desktop กลางจอ · **mobile = bottom sheet** (Background overlay + Bottom sheet header/footer · มุมบน 24) |
| ฟอร์มใน popup | `Modal` Type=Form · แถว `Card form row` | mobile = bottom sheet |
| เมนู "…" | `Dropdown menu` | ดูรายละเอียด · แก้ไข · (คั่น) · ลบ · mobile = bottom sheet |
| แจ้งผล | `Notification` Success/Error | ข้อความตรงตัวอักษรตาม userflow (เช่น "การสร้างแผน overhaul สำเร็จ" · "general error") |
| ตัวกรอง | `Side panel header` + `Side panel footer` + ช่องกรอก · สถานะใช้ `Checkbox with badge` | mobile = bottom sheet |

## 5.1 การจัดวางจอบนหน้า (R19) — แพทเทิร์นของทีมออกแบบ ใช้ทุกครั้งจนกว่าจะเปลี่ยน

> เจ้าของงานสั่ง 20 ต.ค. 2569 (ส่งภาพหน้า Flow การซ่อม "B นัดหมายวันซ่อม › B1 เข้าซ่อมที่… › B1.1 Default …" เป็นแบบ): _"อยากให้แบ่ง แตกรายละเอียดเป็นแบบรูปตัวอย่าง"_ · _"เห็นมีส่วนที่แยก desktop mobile ด้วย อยากให้จำแพทเทิร์นด้วย ว่าต่อไปจะสร้างให้ทำแบบนี้ จนกว่าจะมีการเปลี่ยนแปลง"_

| ชั้น | component · variant | เงื่อนไข |
|---|---|---|
| แถบตัวอักษร (A · B · …) | `Header` Type=Subheader › `State` State=**Default** (ดำ #101828) + "S1 กบค. สร้างแผน…" | **1 scenario = 1 บล็อก · ตัวอักษร = scenario** (เจ้าของงานเคาะ 20 ต.ค. 2569 "อยากแยก scenario ออกจากกัน") · กว้างเท่าจำนวน state |
| แถบย่อย (B1 · B2) | `Header` › `State` State=**Sub Flow** (เทา #667085) | ใช้เฉพาะเมื่อกลุ่มหนึ่งมีหลาย scenario (ตอนนี้ไม่ใช้ — `buildGrid` ข้ามเมื่อ sub.code = g.code) |
| ป้าย state (A.1 · A.2) | `Header` › `State` State=**Sub Flow 2** (ฟ้า #9CACCC) กว้าง 1440 ต่อคอลัมน์ | **ตัวอักษร.ตัวเลข = state ของจอ** (ว่าง · กรอกไม่ครบ · กรอกครบ · ยืนยัน · สำเร็จ …) · ป้าย Device (`Device Type` Type=Device — เจ้าของงานสั่ง 20 ต.ค. 2569 เย็น ให้อ่านจาก component set นี้ · `Component 1` ชุดเก่าเป็นตัวสำรอง) ซ้ายสุด |
| แถว Desktop | จอ 1440 เรียงตามคอลัมน์ state · ป้าย `Device Type` Type=Desktop ซ้าย กว้าง 300 สูงเท่าแถว | — |
| แถว Mobile | จอ 402×874 **ใต้คอลัมน์เดียวกัน** (x เท่ากับ desktop) · ป้าย `Device Type` Type=Mobile | **แยกแถว desktop/mobile เสมอ** (เลิกวางคู่กันในแถวเดียว) |
| ระยะ | ป้ายข้าง 300 + ช่อง 80 · คอลัมน์ 1440 เว้น 200 · แถบ 120 เว้น 80 · desktop→mobile เว้น 160 · กลุ่มเว้น 400 | `GRID` ใน `plugin-lib/core.js` |

- โค้ด: `buildGrid()` ใน `plugin-lib/core.js` (สำเนาใน `overhaul2-plugin/code.js`) · กลุ่มประกาศใน `GROUPS` ของแต่ละปลั๊กอิน · ป้ายชื่อ `<prefix> · …` · ไม่ใช้ section · **สร้างบนหน้าใหม่ `<base>-N` ทุกครั้ง ไม่ลบ/ไม่แตะชุดเดิม** (เจ้าของงานสั่ง 20 ต.ค. 2569 "สร้างใหม่เลย ไม่รบกวนของเดิม") · แถบ Header ใส่ข้อความไม่ได้เพราะฟอนต์ LINE Seed Sans ไม่มีในเครื่อง → สลับฟอนต์สำรอง / แถบธรรมดา
- `Header`/`State` เป็น component จากอีกไลบรารี (หาได้จาก instance ในไฟล์ Maintain-D) — เปิดไม่ได้ปลั๊กอินวาดแถบธรรมดาสีเดียวกัน (ป้ายอยู่นอกจอ ไม่กระทบกติกา "ทุกชิ้นในจอเป็น instance")
- เทส: harness ตรวจว่ามีป้ายรหัส flow และจอ mobile ทุกจออยู่ใต้ desktop คอลัมน์เดียวกัน

## 6. ข้อจำกัดไลบรารี (instance เพิ่มลูกไม่ได้) — เกินแล้วต้องถาม

| component | ขนาดสูงสุด | ที่ติดอยู่ตอนนี้ (19 ต.ค. 2569) |
|---|---|---|
| `Table` | 8 คอลัมน์ × 10 แถว | ⏳ ตารางหน้ารายการแผนมี 9 คอลัมน์ (ข้อมูล 8 + เมนู "…") ⇒ ยังประกอบเองไว้ · รอเคาะ ตัด 1 คอลัมน์ / ขยาย Table ในไลบรารี |
| `Progress steps` | **7 ช่อง** (อัปเดต 19 ต.ค. 2569 · เดิม 5) | ✅ หน้างาน 6 ขั้นใช้ instance ได้แล้ว |

## 7. ส่วนที่ยังประกอบจากชิ้นไลบรารี (ไม่มี component ทั้งก้อนให้ใช้ — ยังไม่ผ่านรีวิว)

bottom sheet (ไลบรารีล็อกเนื้อหาตายตัว) · แผงตัวกรองด้านข้าง · กรอบปุ่มลบข้าง Page header · dual list

## ประวัติ

| วันที่ | เปลี่ยน |
|---|---|
| 20 ต.ค. 2569 | R19: จัดวางแบบตาราง flow ของทีมออกแบบ (1 scenario = 1 บล็อกตัวอักษร · A.1 A.2 = state · แถว Desktop แล้ว Mobile · ป้าย Header/State + Component 1 · หน้าใหม่ทุกครั้ง ไม่แตะชุดเดิม) — ใช้ทุกครั้งจนกว่าจะเปลี่ยน · (เคยเสนอกลุ่มตามหน้า/ขั้น เจ้าของงานเลือกแยกราย scenario) |
| 20 ต.ค. 2569 (เย็น) | R19 ป้ายข้างจอ: อ่านจาก component set `Device Type` (property Type = Device · Desktop · Mobile · กว้าง 300 · พื้น #667085) ของทีมออกแบบแทน `Component 1` (คงไว้เป็นตัวสำรอง · ปลั๊กอินจับชื่อ variant แบบไม่สนตัวพิมพ์ · ปุ่ม "เช็ค component" รายงาน variant ที่พบ) · เพิ่มบล็อก P toast + Q notification (ปุ่มแยก หน้า overhaul-noti-N · สเปก `Diagram/01-บำรุงรักษาตามวาระ/16-overhaul-toast-notification.md`) · ถอดปุ่มแก้เฉพาะจุด 3 ปุ่ม (นัดหมาย · รีวิว 19 ต.ค. · แถว WBS) ที่ใช้เสร็จแล้ว |
| 19 ต.ค. 2569 | R18: 3 ช่อง WBS ไม่บังคับ "(ถ้ามี)" |
| 19 ต.ค. 2569 | Progress steps ในไลบรารีเพิ่มเป็น 7 ช่อง ⇒ stepper เป็น instance ทุกจอ (ปุ่มนัดหมาย+stepper / แก้ตามรีวิว สลับให้) |
| 19 ต.ค. 2569 | R10 แก้: stepper 6 ขั้นทำแบบหน้างานซ่อม (เฟรมมีกรอบ/มุม 8) รวมกับปุ่มส่งออกนัดหมาย |
| 19 ต.ค. 2569 | R16–R17: การนัดหมาย S7/S13 ใช้ `RepairAppointmentStep` (RepairMethod ปิด) แบบงานซ่อม |
| 19 ต.ค. 2569 | R15: stepper ใช้ component `Progress steps` Type=Horizontal ทั้งก้อน (เจ้าของงานส่งภาพ component) |
| 19 ต.ค. 2569 | ตั้งไฟล์จากรีวิวทีมออกแบบ (Header Tablet · Page header ไม่มี divider · Section header เฉพาะ Create/Edit · Section label หน้า Detail · ปิด Info icon · Table/Progress steps ทั้งก้อน · กล่องแสดงข้อมูล) + กติกาเดิมของวันเดียวกัน (1 จอ 1 เฟรม · mobile 402×874 · ปุ่มท้ายซ้าย–ขวา · อัปโหลด 1 คอลัมน์ · แถว WBS · ปิด divider) |
