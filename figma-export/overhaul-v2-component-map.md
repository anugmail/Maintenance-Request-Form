# Overhaul v2 หน้า 1 "จัดการงาน Overhaul" — ตารางจับคู่ส่วนของหน้า → component จริง

> 19 ต.ค. 2569 · ทำก่อนสร้างหน้าใน Figma ด้วยปลั๊กอินที่ `createInstance()` จาก component ในไฟล์ **(Component) VMS Plus ฉบับ duplicate**
> เจ้าของงานสั่ง: _"อ่านจาก component จริงเท่านั้น"_ ⇒ ทุกชิ้นในเฟรมต้องเป็น instance ของ component ในตารางนี้ ไม่วาดกล่องเอง
>
> - หน้า mock ต้นทาง: [`design-mock/overhaul-v2-01-plans.html`](../design-mock/overhaul-v2-01-plans.html) · userflow S1–S3
> - ข้อมูลอ่านจาก `design-system/.figma-extract/` — `component/` (ชื่อ component · variant · property) และ `ui-release2/` (หน้าจริงที่ใช้ component นั้น)
> - ชื่อในวงเล็บหลังชื่อหน้า = node id ของหน้าในไฟล์ Component · property ที่ไม่ได้ระบุ = ใช้ค่าตั้งต้นของ component
> - 🔶 = จุดที่หน้าจอจริง (UI Release#2) เคยต่างจาก mock — **เจ้าของงานเคาะครบ 19 ต.ค. 2569** และแก้ mock ให้ตรงแล้ว (สรุปท้ายไฟล์)

## หน้าจออ้างอิงใน UI Release#2

ไฟล์ UI Release#2 ไม่มีหน้าจอ Overhaul ⇒ ยึดหน้า **5.1 Rental Contract Management** ซึ่งมีครบทุก state ที่หน้านี้ต้องใช้

| state ของเรา | เฟรมอ้างอิง |
|---|---|
| รายการแผน · ผลกรอง | `Contract list` |
| ค้นไม่เจอ | `Contract list - Search not found` |
| ยังไม่มีแผน | `Contract list - Empty state` |
| ตัวกรอง | `Filter Side panel / 060605` |
| ลบสำเร็จ | `Create contract - Success` (Notification Success) · `Delete failed` (Notification Error) |
| ยืนยันลบแผน | 5.3 Vehicle Breakdown › `Modal` Type=Destructive centered image with input ("ยืนยันยกเลิกเหตุการณ์") |
| เมนู "…" | ไม่มีในหน้าจอจริง — ยึด component `Dropdown menu` ตาม userflow |

## 1. โครงหน้า (ทุก state)

| # | ส่วนของหน้า (mock) | Component · variant / property | หน้าในไฟล์ Component | หมายเหตุ |
|---|---|---|---|---|
| 1 | เมนูซ้าย `aside.side.wide` | `Sidebar navigation` State=**Collapsed** + `Nav button` State=Active (เมนู Overhaul) / Default | Sidebar navigation (2-2) | 🔶 ✅ แบบหุบ 80px ตามหน้าจริง (mock `.side.wide` หุบอยู่แล้ว กางเฉพาะตอน hover) · หน้าจริงอ้าง component ชื่อ `Sidebar` (key 4b0197…) ต้องเช็คในไฟล์ duplicate ว่าเป็นตัวเดียวกับ `Sidebar navigation` |
| 2 | แถบบน `.topbar` | `Header navigation` Breakpoint=Desktop (มี `Nav button/Notification` · `Nav button/Profile` · `Avatar` อยู่ข้างในแล้ว) | Header navigation (2-4) | mock แสดงชื่อผู้ใช้เป็นข้อความ · component ใช้รูป Avatar |
| 3 | แถบ "Prototype (Mock)" + ปุ่มคืนค่า/ดูหน้าว่าง `.draft` | — ไม่ใส่ | — | ของต้นแบบเท่านั้น ไม่มีในไลบรารี |
| 4 | breadcrumb `.crumbs` | `Breadcrumbs` = `_Breadcrumbs item / Home` + `_Breadcrumbs item / Separator` + `_Breadcrumbs item / Link` Current=True "จัดการงาน Overhaul" | Breadcrumbs (2-7) | ซ่อน Link/Truncate ที่เกิน (Breadcrumbs ไม่มี property ต้องซ่อน layer ใน instance) |
| 5 | หัวหน้า + ปุ่ม "สร้างแผน Overhaul" | `Page header` Breakpoint=Desktop · Title="จัดการงาน Overhaul" · Supporting text=ปิด · Badge=ปิด · Back/Copy/More actions=ปิด · Actions: `Primary button` State=Default Size=md (ไอคอน add) | Page headers | Breadcrumbs อยู่ใน Page header อยู่แล้ว (แถว 4 ใช้ตัวที่ฝังมา) |

## 2. แถบค้นหา + ตาราง (state รายการ · ผลกรอง)

| # | ส่วนของหน้า (mock) | Component · variant / property | หน้าในไฟล์ Component | หมายเหตุ |
|---|---|---|---|---|
| 6 | แถบค้นหา + ปุ่มตัวกรอง `.list-toolbar` | `Table header` Breakpoint=Desktop · Table title=ปิด · Badge=ปิด · Supporting text=ปิด · Filters=ตามสถานะ (ข้อ 9) | Table headers | |
| 7 | ช่องค้นหา `.search` | `Text input` State=Default Size=md · Label=ปิด · Helper=ปิด · Leading icon=search · Text="ค้นหาเลขแผน, ชื่อแผน, เลขศูนย์ต้นทุน" | Inputs (2-6) | |
| 8 | ปุ่ม "ตัวกรอง" | `Secondary button` State=Default Size=md (ไอคอน filter_list) | Button | |
| 9 | ป้ายตัวกรองที่ใช้อยู่ `.fchips > .fchip` | 🔶 ✅ `Badge outline with remove icon` Color=Brand 1 ป้ายต่อเงื่อนไข (Table header Filters=เปิด · ห่างกัน 12) | Badge (2-13) | แทนตัวเลขบนปุ่มเดิม · ปิดข้อ T6 |
| 10 | หัวคอลัมน์ `th` | `Table header cell` Checkbox=False × 9 · Sort icon=เปิดเฉพาะ เลขแผน/ชื่อแผน/ศูนย์ต้นทุน/สถานะ | Table (2-14) | ไอคอนเรียง = `Sort icon` Icon=Swap (ยังไม่เรียง) / Up / Down |
| 11 | คอลัมน์เลขแผน `.cell-key` | `Table cell` Style=**Lead text** · Supporting=ปิด | Table (2-14) | แถวคู่ Alternating fills=True (ตาราง `.striped`) |
| 12 | ชื่อแผน · ศูนย์ต้นทุน · งบประมาณ · PO · จำนวนรถ · วันที่สร้าง | `Table cell` Style=Text · Supporting=ปิด | Table (2-14) | วันที่รูปแบบ 09/08/2565 ตามหน้าจริง |
| 13 | สถานะ `.badge` | `Table cell` Style=Badge + `Pill outline` Color=Gray (ยังไม่มี PO) / Info (ดำเนินการ) / Success (เสร็จสิ้น) | Table (2-14) · Badge | |
| 14 | ปุ่ม "…" ท้ายแถว | `Table cell` Style=Action icons · View/Edit/Print=ปิด · เหลือ 1 ปุ่ม = `Tertiary button` ไอคอน more_horiz | Table (2-14) · Button | 🔶 ✅ คงเมนู "…" ตาม userflow (หน้าจริงใช้ไอคอนเรียง) |
| 15 | ท้ายตาราง `.tblfoot` | `Table pagination` Breakpoint=Desktop = `Items per page dropdown` + `Button groups pagination item` (Previous Disabled · Number Hover/Active "1" · Next Disabled) | Pagination (2-15) | |

## 3. state ที่มีชั้นบน

| # | state / ส่วนของหน้า | Component · variant / property | หน้าในไฟล์ Component | หมายเหตุ |
|---|---|---|---|---|
| 16 | เมนู "…" `.dd-menu` | `Dropdown menu` + `_Dropdown menu item` Type=Shortcut State=Default Divider=False × 3 (ดูรายละเอียด · แก้ไข · ลบ) · Shortcut=ปิด · Icon=visibility/edit/delete · `_Dropdown menu item` Divider=True ก่อน "ลบ" | Dropdowns (2-8) | `Dropdown menu` ไม่มี property ⇒ ต้องซ่อน layer `_Dropdown menu header` (หัวเมนูมี Avatar) และรายการที่เกินใน instance |
| 17 | แผงตัวกรอง `.filter-drawer` | `Side panel` = `Background overlay` + `Side panel header` (`Featured icon` Color=Gray Size=md · "ตัวกรอง") + `Side panel footer` (`Secondary button` "ยกเลิก" + `Primary button` "ตกลง") | Side panel (1931-12930) · Background overlay (2428-4927) | หน้าจริงมี `Tabs` บนแผง — ของเราไม่ต้องใช้ ซ่อน |
| 18 | ตัวกรอง "งบประมาณ" `select` | `Input dropdown` State=Default Size=md · Label="งบประมาณ" · Optional=ปิด | Dropdowns (2-8) | ช่วงวงเงินเป็นการตีความ (รอเคาะ) |
| 19 | ตัวกรอง "สถานะ" | 🔶 ✅ `Checkbox with badge` × 3 (`Checkbox` + `Pill outline` สีเดียวกับในตาราง · ห่าง 12) | Checkbox (2-18) | ตาม `Filter Side panel / 060605` |
| 20 | ตัวกรอง "รถ" (พิมพ์ค้น) `.combo` | `Input dropdown` State=Focused Size=md · Leading icon=search · Text="สงขลา" + `Dropdown list` + `Dropdown list item` State=Default · Avatar=ปิด · Supporting text="HINO FG1J · รถกระเช้า" | Dropdowns (2-8) | |
| 21 | ตัวกรอง "ศูนย์ต้นทุน" `select` | `Input dropdown` State=Default Size=md · Label="ศูนย์ต้นทุน" | Dropdowns (2-8) | |
| 22 | ปุ่ม "ล้างตัวกรอง" | `Tertiary brand button` State=Default | Button | อยู่ใน `Side panel footer` ฝั่งซ้าย — เช็คว่า footer มีช่องให้ไหม ถ้าไม่มีวางแยก |
| 23 | ยืนยันลบแผน `.modal-hd.center` | `Modal` Type=**Destructive centered image with input** Size=md · หัว = `Modal header` Alignment=Center (`Featured icon` Brand md) · ท้าย = `Modal footer` Alignment=Horizontal fill: `Secondary button` "ยกเลิก" + `Primary danger button` "ยืนยัน" | Modals (2-16) | ตามที่หน้าจริงใช้ตอนยืนยันยกเลิก (5.3) · `Modal` ไม่มี property ⇒ ซ่อน layer `Images` และ `Form` ใน instance (userflow ไม่มีช่องเหตุผล) |
| 24 | ลบสำเร็จ `.notif` | `Notification` Type=Success Breakpoint=Desktop · Text="ลบแผน overhaul สำเร็จ" · Actions=ปิด · Supporting text=ปิด (ซ่อน layer) | Notifications (1873-44383) | ข้อความเป็นการตีความ · กรณีไม่สำเร็จ = Type=Error "general error" |
| 25 | ค้นไม่เจอ `.filter-empty` | `Empty state/Search not found` (แทนตาราง · แถบค้นหายังอยู่) | Table (2-14) | ตาม `Contract list - Search not found` |
| 26 | ยังไม่มีแผน `.filter-empty` | `Empty state/Data empty` (แทนตาราง) · ไม่มี `Table header` | Table (2-14) | 🔶 ✅ ซ่อนแถบค้นหา/ตัวกรอง ตาม `Contract list - Empty state` |

## จุดที่หน้าจริงต่างจาก mock (🔶) — เจ้าของงานเคาะ 19 ต.ค. 2569 · แก้ mock ตามแล้ว

| # | เรื่อง | เคาะ |
|---|---|---|
| 1 | เมนูซ้าย | แบบหุบตามหน้าจริง (mock หุบอยู่แล้ว) |
| 2 | ตัวกรองที่ใช้อยู่ | ป้ายกดลบได้ใต้แถบค้นหา ตามหน้าจริง — เพิ่มคลาส `.fchips/.fchip` (components.css v0.70) |
| 3 | ปุ่มท้ายแถว | **เมนู "…" ตาม userflow** (ไม่ตามหน้าจริง) |
| 4 | ตัวกรองสถานะ | checkbox มีป้ายสี ตามหน้าจริง |
| 5 | หน้าว่าง | ซ่อนแถบค้นหา/ตัวกรอง ตามหน้าจริง |

## สิ่งที่ต้องเช็คในไฟล์ duplicate ก่อนเขียนปลั๊กอิน

- component ทุกตัวในตารางยังอยู่ และเป็น local (ไฟล์ duplicate ต้องได้ main component มาด้วย ไม่ใช่ instance ที่ชี้ไลบรารี)
- `Sidebar navigation` ตรงกับ `Sidebar` ที่หน้าจริงใช้ไหม
- `Side panel footer` มีช่องปุ่มซ้าย ("ล้างตัวกรอง") ไหม
- เพิ่มหน้าใหม่ในไฟล์ได้ไหม (แพลน Starter จำกัด 3 หน้า/ไฟล์ — ไฟล์ Component มี 55 หน้า)
