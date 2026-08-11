# 🧭 Maintain-D Design System

> **เวอร์ชัน:** v0.3 (8 ส.ค. 2569) · **สถานะ:** ใช้กับทุกหน้าใน prototype แล้ว (20/20)
> **ที่มา:** **Figma `EXT_PEA_VMS_v1.0.2_Component`** (`EXT-PEA-T0REUY1W-2026-V102`) — ค่าที่กำกับ `✔` ใน `tokens.css` อ่านจากไฟล์นั้นตรงๆ · ค่าที่กำกับ `~` มาจาก VMS Plus runtime (v2.1.1) รอบก่อน · `⚠` ยังไม่ยืนยัน
> **แหล่งที่มา + สถานะการอ่านจาก Figma:** [SOURCES.md](SOURCES.md) — 12 node ที่เจ้าของงานส่งมายังอ่านไม่ครบ (ติด rate limit)
> **Style guide:** [index.html](index.html) · **ปุ่มครบทุก variant:** [buttons.html](buttons.html) · **ตัวอย่างหน้าจริง:** [ฟอร์มแจ้งซ่อม (mock)](../mock/Maintenance-Request-Form.html)

---

## 0. 🔒 กฎบังคับสำหรับงานออกแบบทุกชิ้นนับจากนี้

> เจ้าของงานกำหนดไว้ **8 ส.ค. 2569:** *"นับจากนี้ การออกแบบให้อิงจาก design system ด้วย"*

**ก่อนสร้างหน้าใหม่หรือแก้หน้าเดิม ต้องผ่านทั้ง 5 ข้อ**

1. `<link>` **`tokens.css` + `components.css`** เสมอ — ห้ามทำหน้า self-contained ที่นิยาม palette เอง
2. **สี** ใช้ `var(--…)` เท่านั้น · ถ้าไม่มี token ที่ต้องการ **ให้เพิ่มใน `tokens.css` ก่อน** แล้วค่อยเรียกใช้ ห้าม hardcode hex ในหน้าจอ
3. **ไอคอน** ใช้ **Material Symbols Outlined** ผ่าน `<span class="ms">ชื่อไอคอน</span>` — ห้าม inline `<svg>` และห้าม emoji แทนไอคอน UI *(ยกเว้นกราฟ/แผนภาพที่เป็น data-visualization)*
4. **ปุ่ม** ใช้คลาสจาก `components.css` (`.btn` + `.btn-p/.btn-s/.btn-t/.btn-link/.btn-d` + `.btn-sm/lg/xl`) — ห้ามเขียนสไตล์ปุ่มเอง
5. **light เท่านั้น** — ยังไม่มี dark token ในระบบ ห้ามใส่ `prefers-color-scheme:dark` รายหน้า (ถ้าจะมี dark ต้องเพิ่มใน `tokens.css` ก่อนแล้วใช้ทั้งระบบพร้อมกัน)
6. 🔴 **ห้ามคิดเอง** — เจ้าของงานกำหนด **9 ส.ค. 2569:** *"ทำตาม design system ทั้งหมด ห้ามคิดเอง"*
   - **ต้องเปิดอ่าน `design-system/README.md` + `components.css` ก่อนลงมือทุกครั้ง** ห้ามเดาจากแพตเทิร์นของหน้าที่มีอยู่
   - ต้องใช้ **คลาสที่มีอยู่แล้ว** เป็นอันดับแรก · จะเขียน CSS ใหม่ได้ต่อเมื่อ**ยืนยันแล้วว่าไม่มีของเดิมที่ใช้ได้**
   - CSS ที่เขียนใหม่ **ต้องไปอยู่ `components.css`** ไม่ใช่ `<style>` ในหน้า · แล้วเพิ่มแถวในตารางข้อ 4 + Changelog ข้อ 8
   - `<style>` ในหน้าเก็บได้เฉพาะสิ่งที่**เป็นของหน้านั้นจริงๆ ใช้ที่อื่นไม่ได้** และต้องมีคอมเมนต์บอกเหตุผล
   - แก้ `components.css`/`tokens.css` เมื่อไหร่ → **บั๊ม `?v=` ทุกหน้าที่ลิงก์ไฟล์นั้น** (ไม่งั้น browser cache ค้าง)

**ข้อยกเว้นที่อนุญาตให้เป็นค่าตายตัว** (มีเท่านี้ ต้องมีคอมเมนต์กำกับ)
`<meta name="theme-color">` (meta ใช้ `var()` ไม่ได้) · theme preset ใน `config.js`/`config-daily.js` (เป็น**ข้อมูล** ไม่ใช่สไตล์) · rainbow ของ colour picker ใน `admin-config.html` · หน้าเอกสารสีที่ตั้งใจโชว์ hex (`design-system/*.html`) · test harness

**ตรวจว่ายังสะอาดอยู่ไหม**
```bash
# ห้ามใช้ grep -o ตรงนี้ — มันตัดบริบททิ้ง ทำให้ filter บรรทัดถัดไปกรอง theme-color ไม่โดน
grep -rniE '#[0-9a-f]{3,8}\b' --include='*.html' . \
  | grep -viE '#fff|#000|design-system/|config.*\.js|admin-config|theme-color|/test/|backup'
```
```bash
# ห้ามมี emoji แทนไอคอน UI (ข้อ 3) — ต้องได้ผลว่าง
grep -rnP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' --include='*.html' --include='*.js' \
  maintainance-yearly/ mock/ daily-record/ | grep -v '/test/'
```

---

## 1. หลักการ

1. **แหล่งความจริงเดียว (Single Source of Truth)** — ค่าสี/ฟอนต์/ระยะ/รัศมีทั้งหมดอยู่ใน `tokens.css` เท่านั้น
2. **ห้าม hardcode** — ในหน้าจอใช้ `var(--brand-600)` เสมอ ห้ามเขียน `#A80689` ตรงๆ
3. **Component ก่อน หน้าจอทีหลัง** — ถ้าต้องใช้ UI ที่ยังไม่มีในระบบ ให้เพิ่มเป็น component กลางใน `components.css` ก่อน แล้วค่อยเรียกใช้จากหน้าจอ
4. **อัปเดตจากของจริง** — ดึงค่าจาก Figma ไลบรารีจริงเป็นหลัก (read-only เท่านั้น **ห้ามแก้ไฟล์ Figma**) แล้วปรับ token ให้ตรง — แก้ที่เดียว ทุกหน้าเปลี่ยนตาม
5. **token 3 ชั้น** ตามไลบรารีจริง — `primitive` (`--brand-600`, `--gray-*`) → `semantic` (`--color-text-secondary`) → `component` (`--btn-primary-bg`) · หน้าจอควรเรียกชั้น semantic/component ก่อน primitive

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

### 3.3 Gray scale (Untitled UI **v2** — ramp ที่ไลบรารีจริงใช้)

> ⚠️ **v0.1 ของเราเคยใช้ ramp v1** (`#344054` / `#D0D5DD` / `#667085` …) ซึ่งเป็น**คนละชุดกันทั้งแถบ**
> `tokens.css` เปลี่ยนเป็น v2 ตั้งแต่ 7 ส.ค. 2569 แต่ตารางนี้ค้างเป็น v1 อยู่จนถึง 11 ส.ค. — **แก้แล้ว**
> ถ้าเจอ hex ชุด v1 ที่ไหนในโปรเจกต์ แปลว่าเป็นของค้างที่ยังไม่ได้ไล่แก้

| Token | ค่า | ที่มา | ใช้กับ |
|---|---|---|---|
| `--gray-950` | `#0A0D12` | ⚠ | เข้มสุด (ยังไม่ได้ใช้ในหน้าจอ) |
| `--gray-900` | `#181D27` | ⚠ | หัวข้อ, ตัวเลขสำคัญ (`--color-text-primary`) |
| `--gray-800` | `#252B37` | ✔ | `color/text/secondary-hover` |
| `--gray-700` | `#414651` | ✔ | เนื้อความหลัก (`--color-text-secondary`) |
| `--gray-600` | `#535862` | ✔ | เนื้อความรอง (`--color-text-tertiary`) |
| `--gray-500` | `#717680` | ⚠ | ข้อความ secondary, ไอคอนในช่องกรอก |
| `--gray-400` | `#A4A7AE` | ✔ | placeholder, ข้อความจาง (`--color-fg-disabled`) |
| `--gray-300` | `#D5D7DA` | ✔ | เส้นขอบช่องกรอก (`--color-border-primary`) |
| `--gray-200` | `#E9EAEB` | ✔ | เส้นคั่น, ขอบการ์ด (`--color-border-disabled-subtle`) |
| `--gray-100` | `#F5F5F5` | ✔ | พื้น hover, ปุ่มเทา (`--color-bg-disabled`) |
| `--gray-50` | `#FAFAFA` | ✔ | พื้นหลังหน้า (`--color-bg-primary-hover`) |

`✔` อ่านจาก Figma ตรงๆ (หน้า `↳ Buttons` node `1:1375`) · `⚠` ยังไม่ได้ยืนยัน ประมาณจาก ramp — ดู [SOURCES.md](SOURCES.md)

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
| Stepper หลายกลุ่ม | `.wgrp` + `.wsteps` (`.wrap`) | หัวกลุ่มเทาเล็กเหนือแถว · `.wrap` = ชื่อขั้นยาวให้ตัดบรรทัดแทน … |
| ขั้นที่ยังเข้าไม่ได้ | `.wstep.locked` | จาง + เคอร์เซอร์ห้าม — ต้องคู่กับการกันคลิกในโค้ด ไม่ใช่กันด้วยสไตล์อย่างเดียว |
| กล่องจัดกลุ่มรายการ | `.rzone` + `.rzone-head` / `-caret` / `-count` / `-allchk` / `-body` | ลิสต์ยาวที่แบ่งเป็นชั้น เช่น ภาค → จังหวัด → รถ · หัวกล่องกดพับ/กางได้ · `.rzone-body.flush` = ใส่ตารางเต็มความกว้างไม่ต้องมี padding |
| **แกลเลอรีพรีวิวหน้าจอ** | `.gallery` > `.gcard` > `.gframe` + `.gcard-body` | โชว์หน้าจริงย่อส่วนด้วย `<iframe>` + `pointer-events:none` = เห็น UI แต่กดไม่ได้ · ใช้ iframe แทนภาพนิ่งเพราะแก้หน้าไหนพรีวิวอัปเดตเอง |
| **เลือกช่วงวันที่** | `.daterange` > `.daterange-field` + `.cal` | กดเปิดปฏิทิน คลิกวันเริ่ม → คลิกวันสิ้นสุด · ใช้เมื่อต้องระบุ **ช่วง** ไม่ใช่วันเดียว (`<input type="date">` ทำช่วงไม่ได้) · เปิด/ปิดด้วยคลาส `.open` ที่ตัว `.daterange` |
| **คุมระยะแนวตั้ง** | `.stack` (`.tight` / `.loose`) | **ห่อทุกครั้งที่วางคอมโพเนนต์ต่อกันในแนวตั้ง** — ระยะมาจาก `gap` ที่เดียว ไม่ต้องพึ่ง margin ของแต่ละตัวซึ่งไม่สม่ำเสมอ · `.tight` 8px · ปกติ 12px · `.loose` 20px |

> ⚠️ **`.search` เป็นช่องกรอกในฟอร์ม ไม่ใช่หัวลิสต์** — ไม่มี margin ในตัวเพราะออกแบบให้อยู่ใต้ `label` ซึ่งเป็นตัวให้ระยะ
> ถ้าจะวางเหนือลิสต์ **ต้องห่อด้วย `.stack`** ไม่งั้นจะติดกับรายการแรกสนิท 0px (เคยพลาดมาแล้ว 10 ส.ค. 2569)
| ป้ายสถานะบนขั้น | `.wstep` > `.st` > `.ms.done` / `.ms.todo` / `a` | ทำแล้ว (เขียว) · ยังไม่ทำ (เทา) · ลิงก์ไปหน้าจริง |
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
| 11 ส.ค. 2569 | v0.10 | เพิ่ม `.gallery` — แกลเลอรีพรีวิวหน้าจอด้วย iframe ย่อส่วนที่กดไม่ได้ ใช้กับ `design-mock/index.html` · บั๊ม `?v=20260811-ds10` |
| 11 ส.ค. 2569 | v0.9 | เพิ่ม `.daterange` + `.cal` — ปฏิทินเลือก**ช่วงวันที่**ในคลิกเดียว (คลิกวันเริ่ม → วันสิ้นสุด) · เกิดจากหน้านัดหมายวันซ่อมที่ต้องเสนอเป็นช่วงให้อีกฝ่ายเลือกวันเอง ซึ่ง `<input type="date">` ทำไม่ได้ · บั๊ม `?v=20260811-ds09` |
| 11 ส.ค. 2569 | v0.8 | เพิ่ม `.stack` — คุมระยะแนวตั้งที่ตัวครอบแทนการพึ่ง margin ของแต่ละคอมโพเนนต์ · เกิดจากบั๊กจริง: `.search` วางเหนือลิสต์แล้วติดกันสนิท 0px เพราะ `.search` ไม่มี margin ส่วน `.job` มีแต่ margin ล่าง · เพิ่มคำเตือนเรื่อง `.search` ในตารางข้อ 4 |
| 10 ส.ค. 2569 | v0.7 | ยก `.rzone*` (กล่องจัดกลุ่มรายการ) ขึ้นมาจาก `<style>` ของ `index.html` **และ** `plan-new.html` ที่นิยามไว้ซ้ำกันทั้งสองไฟล์ — หน้า "ยืนยันรถเข้าร่วมแผน" ต้องใช้ชุดเดียวกันเพื่อแบ่ง ภาค → จังหวัด · เพิ่ม `.rzone-body.flush` และ `.wstep.locked` ที่เดิมมีแต่คลาสไม่มีสไตล์ · บั๊ม `?v=20260810-ds07` |
| 9 ส.ค. 2569 | v0.6 | เพิ่ม `.wgrp` + `.wsteps.wrap` + `.wstep .st` (stepper หลายกลุ่ม + ป้ายสถานะบนขั้น) — เกิดจากหน้า `plan-skeleton` ที่มี 11 หน้าจอ 3 กลุ่มในหน้าเดียว · **ครั้งแรกที่โดนจับได้ว่าเขียน CSS คอมโพเนนต์ในหน้าแทนที่จะเพิ่มในระบบก่อน** — ย้ายกลับมาที่นี่แล้ว |

## 9. สิ่งที่ยังขาด (รอ screenshot / รอตัดสินใจ)

- [ ] ตาราง list (เช่น หน้า request-list) — ยังเข้าไม่ได้เพราะบัญชี 700001 ติดสิทธิ์ 401
- [ ] Modal / Dialog ยืนยัน
- [ ] Dropdown/Select แบบเปิด, DatePicker, TimePicker
- [ ] Pagination, Tab, Table sort/filter
- [ ] Dark theme (topbar หน้าจริงมีปุ่มสลับธีม — ยังไม่รู้หน้าตาโหมดมืด)
- [ ] เกณฑ์ "ใกล้หมด" จริงจากลูกค้า (ตอนนี้ mock ≤3)
