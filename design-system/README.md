# 🧭 Maintain-D Design System

> **เวอร์ชัน:** v0.2 (17 ก.ค. 2569) · **สถานะ:** ใช้งานกับ prototype แล้ว
> **ที่มา:** อิงระบบ **VMS Plus** (vmsplus-dev.pea.co.th v2.1.1) — สกัดจาก CSS bundle สาธารณะ + screenshot หน้าจริง "สร้างคำขอใช้ยานพาหนะ" เพื่อให้ระบบซ่อมบำรุงรถ (Maintain-D) หน้าตาเป็นครอบครัวเดียวกับ VMS Plus
> **Style guide แบบเปิดดูได้:** [index.html](index.html) · **ตัวอย่างหน้าที่ใช้จริง:** [ฟอร์มแจ้งซ่อม (mock)](../mock/Maintenance-Request-Form.html)

---

## 1. หลักการ

1. **แหล่งความจริงเดียว (Single Source of Truth)** — ค่าสี/ฟอนต์/รัศมีทั้งหมดอยู่ใน `tokens.css` เท่านั้น
2. **ห้าม hardcode** — ในหน้าจอใช้ `var(--primary-600)` เสมอ ห้ามเขียน `#A80689` ตรงๆ
3. **Component ก่อน หน้าจอทีหลัง** — ถ้าต้องใช้ UI ที่ยังไม่มีในระบบ ให้เพิ่มเป็น component กลางใน `components.css` ก่อน แล้วค่อยเรียกใช้จากหน้าจอ
4. **อัปเดตจากของจริง** — ได้ screenshot หน้าจริงของ VMS Plus เพิ่มเมื่อไหร่ เทียบกับ style guide แล้วปรับ token/component ให้ตรง (แก้ที่เดียว ทุกหน้าเปลี่ยนตาม)

## 2. วิธีใช้

ทุกหน้า HTML ใส่ 4 บรรทัดนี้ใน `<head>`:

```html
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,300..600,0..1,0" rel="stylesheet">
<link rel="stylesheet" href="../design-system/tokens.css">
<link rel="stylesheet" href="../design-system/components.css">
```

```css
/* ✅ ถูก */  color: var(--primary-600);
/* ❌ ผิด */  color: #A80689;
```

ไอคอนใช้ Material Symbols ผ่านคลาส `.ms`:

```html
<span class="ms">build</span> <span class="ms">warehouse</span> <span class="ms">event_available</span>
```

## 3. Design Tokens (`tokens.css`)

### 3.1 สี Brand

| Token | ค่า | ใช้กับ |
|---|---|---|
| `--primary-700` | `#8A0570` | active/pressed เข้ม |
| `--primary-600` ★ | `#A80689` | สีหลัก — ปุ่ม, ลิงก์, active state, แถบ section (สีที่ใช้บ่อยสุดใน CSS จริงของ VMS Plus) |
| `--primary-500` | `#CF07AA` | hover, ปลาย gradient |
| `--primary-50` | `#FEEBFB` | พื้นหลังอ่อน chip/highlight |
| `--primary-25` | `#FFF5FD` | พื้นหลังอ่อนสุด (แถวที่เลือก) |
| `--secondary-600` | `#1B4DB1` | น้ำเงินรอง (tile "ส่งซ่อม กบค.") |
| `--secondary-700` | `#15409A` | น้ำเงินเข้ม hover |

### 3.2 สี Semantic (สถานะ)

| กลุ่ม | เข้ม | กลาง | พื้นอ่อน | ใช้กับ |
|---|---|---|---|---|
| Success | `--success-600` `#17B26A` | `--success-200` `#75E0A7` | `--success-50` `#ECFDF3` | พร้อมเบิก, จองสำเร็จ, เสร็จสิ้น |
| Warning | `--warning-600` `#F79009` · text `--warning-700` `#B54708` | `--warning-200` `#FEDF89` | `--warning-50` `#FFFAEB` | ใกล้หมด, แถบ mock/draft |
| Error | `--error-600` `#D92D20` · `--error-700` `#B42318` | `--error-500` `#F04438` · `--error-200` `#FECDCA` | `--error-50` `#FEF3F2` | หมด/รอของ, validation error |
| Info | `--info-600` `#6172F3` | — | — | ลิงก์/ข้อมูลเสริม |

### 3.3 Gray scale (โครง Untitled UI)

| Token | ค่า | ใช้กับ |
|---|---|---|
| `--gray-900` | `#101828` | หัวข้อ, ตัวเลขสำคัญ |
| `--gray-700` | `#344054` | เนื้อความหลัก |
| `--gray-600` | `#475467` | เนื้อความรอง |
| `--gray-500` | `#667085` | ข้อความ secondary, ไอคอนในช่องกรอก |
| `--gray-400` | `#98A2B3` | placeholder, ข้อความจาง |
| `--gray-300` | `#D0D5DD` | เส้นขอบช่องกรอก |
| `--gray-200` | `#EAECF0` | เส้นคั่น, ขอบการ์ด |
| `--gray-100` | `#F2F4F7` | พื้น hover, ปุ่มเทา |
| `--gray-50` | `#F9FAFB` | พื้นหลังหน้า |

### 3.4 Typography

| Token | ค่า | ใช้กับ |
|---|---|---|
| `--font` | `'IBM Plex Sans Thai', sans-serif` | ทั้งระบบ (ตรงกับ VMS Plus) |
| `--fs-h1` | 18px | หัวแอปบนแถบสี |
| `--fs-h2` | 16px | หัวการ์ด |
| `--fs-body` | 15px | เนื้อความ |
| `--fs-sm` | 13px | ข้อความรอง/label |
| `--fs-xs` | 11px | stepper, หมายเหตุ |
| ชื่อหน้า (web) | 28px/700 (`.page-title`) | หัวหน้าแบบหน้าจริง |
| ไอคอน | Material Symbols Outlined (`.ms`) | ทั้งระบบ |

### 3.5 รูปทรงและเอฟเฟกต์

| Token | ค่า | ใช้กับ |
|---|---|---|
| `--r-sm` | 8px | ปุ่ม |
| `--r-md` | 12px | การ์ดย่อย, รายการ, stepper กล่อง |
| `--r-lg` | 16px | การ์ดหลัก, tile |
| `--r-pill` | 99px | chip, badge |
| ช่องกรอก (web) | 10px, สูง 46px | `.f .in input` |
| `--shadow-app` | เงากรอบแอป | `.app` |
| `--shadow-pop` | เงา tile ที่เลือก | `.tile.sel` |
| `--grad-header` | gradient magenta | header มือถือ |

## 4. Components (`components.css`)

### 4.1 โครงหน้าเว็บ (จากหน้าจริง "สร้างคำขอใช้ยานพาหนะ")

| Component | คลาส | ลักษณะ |
|---|---|---|
| โครงหน้า | `.shell` > `.side` + `.work` > `.topbar` + `.content` | sidebar ซ้าย 96px + พื้นที่งาน |
| Sidebar | `.side` `.nv` `.nv.on` | ไอคอนอย่างเดียว, active = พื้นเทา+ไอคอน magenta |
| Topbar | `.topbar` | ขาว, ไอคอนธีม/กระดิ่งชิดขวา |
| Breadcrumb | `.crumbs` `.sep` `.cur` | บ้าน › ระดับกลาง › ปัจจุบัน (magenta) |
| ชื่อหน้า | `.page-title` | 28px หนา |
| Stepper ลูกศร | `.wsteps` > `.wstep` (`.active`/`.passed`) + `.num` `.lbl` | กล่องขาว คั่น chevron ›, ผ่านแล้ว = วงกลม magenta ✓ |
| หัวข้อ section | `.sect` | แถบตั้ง magenta 4px + ตัวหนา |
| ฟอร์ม grid | `.fgrid` (+ `.sp2` `.sp4` กว้าง 2/เต็มแถว) | 4 คอลัมน์ → 2 (≤1100px) → 1 (≤760px) |
| ช่องกรอก | `.f` > `label` + `.in` > `.ms` + `input` | label หนาอยู่บน, ไอคอนนำหน้าในช่อง |
| ช่อง readonly | `.f.ro` | เส้นประ พื้นเทาอ่อน (ข้อมูลดึงอัตโนมัติ) |
| ช่อง error | `.f.err` + `.help` | ขอบแดง + ข้อความแดงใต้ช่อง |
| Radio | `.rads` > `label` > `input[type=radio]` | accent magenta |
| ช่องจำนวน | `.numfld` | − ตัวเลข + |
| แถวปุ่มท้ายฟอร์ม | `.actions` | desktop ชิดขวา / มือถือตรึงขอบล่าง |

```html
<div class="sect">ข้อมูลรถ</div>
<div class="fgrid">
  <div class="f sp2">
    <label>ค้นหารถที่มีปัญหา</label>
    <div class="in"><span class="ms">search</span><input type="text" placeholder="ค้นหาทะเบียน…"></div>
  </div>
  <div class="f ro">
    <label>สังกัด</label>
    <div class="in"><span class="ms">apartment</span><input value="กฟภ. เขต ฉ.3" readonly></div>
  </div>
  <div class="f err">
    <label>เบอร์ภายใน</label>
    <div class="in"><span class="ms">call</span><input type="text" placeholder="ระบุเบอร์ภายใน"></div>
    <div class="help">กรุณาระบุเบอร์ภายใน</div>
  </div>
</div>
```

### 4.2 Component ทั่วไป

| Component | คลาส | ใช้เมื่อ |
|---|---|---|
| ปุ่มหลัก | `.btn.btn-p` | action หลักของหน้า (ส่งเรื่อง, ถัดไป) |
| ปุ่มรอง (outline) | `.btn.btn-o` | action รอง (จองอะไหล่, แจ้งเรื่องใหม่) |
| ปุ่มเทา | `.btn.btn-g` | ย้อนกลับ/ยกเลิก |
| ปุ่มปิดใช้ | `.btn:disabled` | ทำไม่ได้ + บอกเหตุผลในตัวปุ่ม |
| Badge สถานะ | `.badge` + `.b-ok`/`.b-low`/`.b-out`/`.b-brand` | สถานะคลัง/สถานะเรื่อง |
| Chip (เลือกหลายอัน) | `.chips` > `.chip` (`.sel`) | อาการเสีย, tag |
| Segmented (เลือกอันเดียว) | `.seg` > `.sg` (`.sel`) | ตัวเลือกสั้นๆ 2–4 ตัว |
| ตัวปรับจำนวน | `.qty` | เพิ่ม/ลดจำนวนจอง |
| Tile เลือกใหญ่ | `.tile` + `.tile-magenta`/`.tile-blue` (`.sel`) | ทางเลือกใหญ่ 2 ทาง (ซ่อมเอง/ส่ง กบค.) |
| การ์ด | `.card` (+ `h2`, `.sub`) | กล่องเนื้อหาบนพื้นหน้า |
| Toast | `.toast` (`.show`) | แจ้งผลชั่วคราว ~2.5 วิ |
| แถบ mock/draft | `.draft` | ติดบนสุดของ prototype ทุกหน้า |
| อื่นๆ | `.hidden` `.empty` `.search` | utility |

### 4.3 โครงหน้าแบบมือถือ (legacy — ใช้กับ demo แอปมือถือ)

`.app` + `header` (gradient magenta) + `.steps`/`.st`/`.dot` (stepper แบบจุด) + `.footer` — ยังอยู่ใน components.css สำหรับหน้าจอสไตล์ mobile-app; งานใหม่แนะนำใช้โครง `.shell` (4.1) ที่ตรงกับหน้าจริง

## 5. กติกาเฉพาะโดเมน (ระบบซ่อมบำรุง)

### สถานะคลังอะไหล่ (ตาม US-07)

| สถานะ | เงื่อนไข (mock) | Badge |
|---|---|---|
| 🟢 พร้อมเบิก | คงเหลือ > 3 | `.b-ok` เขียว |
| 🟡 ใกล้หมด | คงเหลือ 1–3 *(เกณฑ์จริงรอคำตอบลูกค้า — คำถามเปิด #3 ของ BL01)* | `.b-low` ส้ม |
| 🔴 หมด | คงเหลือ 0 | `.b-out` แดง |
| 🔴 หมด-รอของ | คงเหลือ 0 + มี ETA | `.b-out` แดง + "รอของ (ETA …)" |

- Badge ต้องอ่านรู้เรื่องโดยไม่ต้องอธิบาย: ใส่ทั้งคำ + จำนวน เช่น "พร้อมเบิก · เหลือ 6"
- แสดงเวลาอัปเดตข้อมูลคลังกำกับเสมอ · ปุ่มจองใช้ได้เฉพาะคงเหลือ > 0

### ระดับความรุนแรง

`ต่ำ / ปานกลาง / สูง / หยุดใช้งาน` — ใช้ radio (`.rads`)

## 6. Responsive

| ช่วงจอ | พฤติกรรม |
|---|---|
| > 1100px | ฟอร์ม 4 คอลัมน์, sidebar แสดง, ปุ่มชิดขวา |
| 761–1100px | ฟอร์มลดเหลือ 2 คอลัมน์ |
| ≤ 760px | sidebar ซ่อน, ฟอร์ม 1 คอลัมน์, stepper ย่อ (เลข + label เฉพาะขั้นปัจจุบัน), ปุ่มตรึงขอบล่าง (`.actions`), ชื่อหน้า 22px |

## 7. โครงไฟล์ + การอัปเดต

```
design-system/
├── README.md          ← เอกสารนี้
├── tokens.css         ← ค่าสี/ฟอนต์/รัศมี (แก้ที่นี่ที่เดียว)
├── components.css     ← component + pattern + responsive
└── index.html         ← style guide เปิดดู/เทียบกับ screenshot จริง
```

**ขั้นตอนเมื่อได้ screenshot หน้าจริงเพิ่ม:**

1. เปิด [index.html](index.html) เทียบข้างกันกับ screenshot
2. ต่างที่ *ค่า* (สี/ระยะ/ฟอนต์) → แก้ `tokens.css`
3. ต่างที่ *รูปแบบ* หรือเจอ component ใหม่ (ตาราง, modal, dropdown, tab ฯลฯ) → เพิ่มใน `components.css` + เพิ่มตัวอย่างใน `index.html` + เพิ่มแถวในตารางข้อ 4
4. บันทึกลง Changelog ด้านล่าง

## 8. Changelog

| วันที่ | เวอร์ชัน | สิ่งที่เปลี่ยน |
|---|---|---|
| 17 ก.ค. 2569 | v0.1 | เริ่มระบบ: tokens + component พื้นฐาน จาก CSS สาธารณะ + หน้า landing/SSO ของ VMS Plus |
| 17 ก.ค. 2569 | v0.2 | เพิ่ม pattern หน้าเว็บจาก screenshot หน้าจริง "สร้างคำขอใช้ยานพาหนะ": `.shell/.side/.topbar/.crumbs/.page-title/.wsteps/.sect/.fgrid/.f(.ro/.err)/.rads/.numfld/.actions` — mock ฟอร์มแจ้งซ่อมย้ายมาใช้โครงนี้ |
| 17 ก.ค. 2569 | v0.3 | เพิ่ม component สำหรับ flow กบค./ติดตามสถานะ: `.nv .cnt` (badge ตัวเลขบน sidebar) · `.job` (แถวรายการเรื่อง) · `.tl` (timeline ประวัติสถานะ) · `.chk` + checkbox (checklist ตรวจสภาพ) |
| 17 ก.ค. 2569 | v0.5 | เพิ่ม `.tbl` + `.tblwrap` (ตารางข้อมูล — เมนูคลังอะไหล่) — ตัดออกจากรายการ "สิ่งที่ยังขาด" ได้ |

## 9. สิ่งที่ยังขาด (รอ screenshot / รอตัดสินใจ)

- [ ] ตาราง list (เช่น หน้า request-list) — ยังเข้าไม่ได้เพราะบัญชี 700001 ติดสิทธิ์ 401
- [ ] Modal / Dialog ยืนยัน
- [ ] Dropdown/Select แบบเปิด, DatePicker, TimePicker
- [ ] Pagination, Tab, Table sort/filter
- [ ] Dark theme (topbar หน้าจริงมีปุ่มสลับธีม — ยังไม่รู้หน้าตาโหมดมืด)
- [ ] เกณฑ์ "ใกล้หมด" จริงจากลูกค้า (ตอนนี้ mock ≤3)
