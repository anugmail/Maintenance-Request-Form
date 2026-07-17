# 🎨 Design Reference — สกัดจาก VMS Plus (vmsplus-dev.pea.co.th, Version 2.1.1)

> **วิธีเก็บข้อมูล (17 ก.ค. 2569):** เข้าหน้า in-app (request-list) ไม่ได้เพราะบัญชีติดสิทธิ์ (ดู [00-README](00-README.md#-ผลการเข้าระบบ-vms-plus-dev-17-กค-2569)) — จึงสกัดจากสิ่งที่เข้าถึงได้สาธารณะ: หน้า landing, หน้า PEA SSO, หน้า login-os และไฟล์ CSS bundle ของแอป (`/_next/static/chunks/*.css` รวม ~330KB)
> ระบบเป็น **Next.js (App Router) + Tailwind CSS** · โครงสีแบบ **Untitled UI scale**

## 1) Design Tokens

### สีหลัก (Brand)

| Token | ค่า | ใช้กับ |
|---|---|---|
| `primary-600` | `#A80689` | สีหลัก VMS Plus (magenta) — ปุ่มหลัก, การ์ดเลือกประเภทผู้ใช้, active state |
| `primary-500` | `#CF07AA` | hover/accent |
| `primary-50` | `#FEEBFB` | พื้นหลังอ่อนของ primary (chip/highlight) |
| `primary-25` | `#FFF5FD` | พื้นหลังอ่อนสุด |
| secondary (ปุ่มน้ำเงิน "บุคคลภายนอก") | โทน `#1B4DB1`–`#2563EB` (จาก screenshot) | การ์ด/CTA รอง |

### สีสถานะ (semantic — ตรงกับที่พบใน CSS)

| กลุ่ม | เข้ม (ตัวอักษร/ไอคอน) | กลาง | พื้นหลังอ่อน | ใช้กับ |
|---|---|---|---|---|
| Success | `#17B26A` | `#75E0A7` | `#ECFDF3` | สถานะ "พร้อมเบิก", สำเร็จ |
| Warning | `#F79009` | `#FEDF89` | `#FFFAEB` | "ใกล้หมด", คำเตือน |
| Error | `#D92D20` / `#B42318` | `#F04438`, `#FECDCA` | `#FEF3F2` | "หมด", validation, toast error |
| Info/Indigo | `#6172F3` | — | — | ลิงก์/ข้อมูลเสริม |

### Gray scale (Untitled UI)

`#101828` (900 — heading) · `#344054` (700 — body) · `#475467` (600) · `#667085` (500 — secondary text) · `#98A2B3` (400 — placeholder) · `#D0D5DD` (300 — border) · `#EAECF0` (200 — divider) · `#F2F4F7` (100) · `#F9FAFB` (50 — page bg)

### Typography

| ที่ | ค่า |
|---|---|
| ฟอนต์หลักของแอป | **IBM Plex Sans Thai** (มี Looped ด้วย), fallback `sans-serif` |
| ฟอนต์หน้า SSO | Prompt / Noto Sans Thai (คนละธีมกับตัวแอป — อย่าเอามาปน) |
| ไอคอน | **Material Symbols Outlined** (ligature เช่น `smartphone`, `download`, `keyboard_arrow_left`) |

### รูปทรง

- การ์ดใหญ่ (เลือกประเภทผู้ใช้): มุมโค้งมาก ~20–24px, เงานุ่ม, ไอคอน line-art ขาวบนพื้นสีทึบ, ข้อความอยู่ล่างการ์ด
- ปุ่ม: มุมโค้ง ~8px, ปุ่มหลักพื้นทึบตัวอักษรขาว เต็มความกว้างบนมือถือ
- Input: label อยู่บนช่อง, กรอบ `#D0D5DD`, focus เป็นสี primary, มีปุ่ม toggle แสดงรหัสผ่าน (icon eye)

## 2) Component ที่พบ (ใช้เป็นแบบในฟอร์มแจ้งซ่อม)

| Component ใน VMS Plus | เห็นที่ไหน | นำมาใช้ในฟอร์มแจ้งซ่อมเป็น |
|---|---|---|
| การ์ดเลือกแบบ tile (รูป+ข้อความ, สีทึบ) | หน้า landing เลือก "พนักงาน กฟภ. / บุคคลภายนอก" | ตัวเลือกตัดสินใจ **ซ่อมเอง / ส่ง กบค.** |
| ปุ่มหลักเต็มความกว้าง | หน้า SSO "เข้าสู่ระบบ" | ปุ่ม "ถัดไป / ส่งเรื่องแจ้งซ่อม" |
| Toast แจ้งเตือนมุมบน (✕ + ข้อความ) | "คุณไม่มีสิทธิเข้าใช้งานระบบ" | แจ้งผล validation / จองสำเร็จ |
| Bottom-sheet ชวนติดตั้ง PWA | "ติดตั้ง VMS Plus กันเถอะ 🚨" + ปุ่ม "ไว้ทีหลัง/ไม่แสดงอีก" | แพทเทิร์น bottom-sheet สำหรับรายละเอียดอะไหล่ |
| แถบ progress หลายขั้น (จาก CSS มี stepper styles) | ฟอร์มจองรถ (อนุมานจาก class) | Stepper 4 ขั้นของฟอร์มแจ้งซ่อม |
| Badge สถานะหลายสี | โทนสี success/warning/error ครบใน CSS | Badge สถานะคลัง: พร้อมเบิก/ใกล้หมด/หมด/หมด-รอของ |
| Login ด้วย เบอร์โทร + OTP / ThaID | หน้า login-os (พนักงานขับรถ) | แนวทาง auth ของผู้ใช้หน้างานในระบบใหม่ (อ้างอิงอนาคต) |

## 2.1) Component จากหน้าจริง in-app (screenshot "สร้างคำขอใช้ยานพาหนะ" — ได้รับ 17 ก.ค. 2569)

> ผู้ใช้แคปหน้าจริงหลัง login มาให้ — ใช้เป็นแบบหลักของหน้าเว็บทุกหน้าใน Maintain-D (implement แล้วใน [design-system](../design-system/))

| Component | ลักษณะที่เห็นในหน้าจริง | คลาสใน design system |
|---|---|---|
| Sidebar ซ้าย | แถบขาวแคบ ~96px ไอคอนอย่างเดียว, active = พื้นเทาอ่อนมุมโค้ง + ไอคอน magenta, โลโก้ V บนสุด | `.shell` `.side` `.nv .on` |
| Topbar | ขาว มีปุ่มสลับธีม + กระดิ่งแจ้งเตือน (จุดเขียว) ชิดขวา | `.topbar` |
| Breadcrumb | ไอคอนบ้าน › ระดับกลาง › หน้าปัจจุบันเป็นสี magenta | `.crumbs .cur` |
| ชื่อหน้า | ~28px หนา สีเข้ม ใต้ breadcrumb | `.page-title` |
| Stepper แบบลูกศร | กล่องขาวขอบมน คั่นด้วยเส้นเฉียงรูป chevron ›, ขั้น active = วงกลมเลข + ตัวหนังสือ magenta, ขั้นอื่นเทา | `.wsteps .wstep .num` |
| หัวข้อ section | แถบตั้ง magenta 4px + ตัวหนา เช่น "▎ข้อมูลผู้ใช้ยานพาหนะ" | `.sect` |
| ฟอร์ม | grid 4 คอลัมน์, label หนาอยู่บนช่อง, ช่องสูง ~46px มุมโค้ง 10px มี**ไอคอนนำหน้าในช่อง** | `.fgrid` `.f .in` |
| ช่อง readonly | เส้นประ พื้นเทาอ่อน (เช่น ตำแหน่ง/สังกัด) | `.f.ro` |
| Validation error | ขอบช่องแดง + ข้อความแดงใต้ช่อง "กรุณาระบุ…" | `.f.err` `.help` |
| Radio | วงกลม accent สี magenta (เช่น ไป-กลับ/ค้างแรม) | `.rads` |
| ช่องจำนวน | − ตัวเลข + ในช่องเดียว | `.numfld` |

## 3) กติกาการนำไปใช้ใน Maintain-D

1. **ใช้โทน magenta `#A80689` เป็น primary เหมือน VMS Plus** เพื่อให้ผู้ใช้ กฟภ. รู้สึกเป็นระบบครอบครัวเดียวกัน (ถ้าภายหลังต้องแยกแบรนด์ ค่อยสลับ token เดียว)
2. ฟอนต์ **IBM Plex Sans Thai** + ไอคอน **Material Symbols Outlined** ทั้งระบบ
3. สถานะคลังใช้สี semantic ตามตาราง — ห้ามใช้สีเดา ให้อ่านรู้เรื่องโดยไม่ต้องอธิบาย (AC ของ [US-07](../backlog/BL01-แจ้งซ่อม-Suggest-อะไหล่/US-07-เห็นคงเหลือและสถานะคลัง.md))
4. Mobile-first: ช่างใช้จากมือถือหน้างานเป็นหลัก ([US-01](../backlog/BL01-แจ้งซ่อม-Suggest-อะไหล่/US-01-แจ้งซ่อมได้เองจากหน้างาน.md))

## 4) Screenshot อ้างอิง

| ไฟล์ | คืออะไร |
|---|---|
| `assets/vmsplus-landing.png` | หน้า landing — การ์ด tile 2 ใบ, โลโก้, โทนสี |
| `assets/pea-sso-login.png` | หน้า PEA SSO — ฟอร์ม input + ปุ่มหลัก + ThaID |
| `assets/vmsplus-login-os.png` | หน้า login พนักงานขับรถ — OTP + toast error + PWA bottom-sheet |
