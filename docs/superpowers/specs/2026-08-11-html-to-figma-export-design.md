# ส่ง HTML prototype เข้า Figma — ดีไซน์

> **วันที่** 11 ส.ค. 2569 · **ขอบเขตรอบแรก** 6 หน้าของโฟลว์บำรุงรักษา (`maintainance-yearly/`)
> **สถานะ** ท่อนที่ 3 (ปลั๊กอิน) เขียนเสร็จและทดสอบผ่านแล้ว · ท่อนที่ 1–2 ยังไม่เขียน

## 1. เป้าหมาย

ไฟล์ Figma ที่ **ดีไซเนอร์แก้ได้จริง** และ **dev เอาไปทำได้จริง** — สองอย่างนี้คนละเกณฑ์กัน

| | ดีไซเนอร์แก้ได้ | dev ใช้ได้ |
|---|---|---|
| ต้องการ | auto-layout ทุกชั้น · instance สลับ variant ได้ · fill ผูก variable | ค่าใน Inspect ถูก · ชื่อ layer map กลับหาโค้ดได้ |

จะได้ทั้งคู่ต้องมีครบ 3 อย่าง: **auto-layout · component instance · ชื่อ layer ตรงคลาสในโค้ด**
ตัวที่สามคือสะพานให้ dev และเป็นตัวเดียวที่จะจับได้ว่าไฟล์ Figma เริ่มหลุดจากโค้ดเมื่อไหร่

**ไม่ใช่เป้าหมาย** — ให้ Figma เป็นแหล่งความจริง โค้ดคือต้นทาง Figma คือปลายทางเสมอ

## 2. ข้อจำกัดที่เป็นตัวกำหนดสถาปัตยกรรม

| ข้อจำกัด | ผลที่ตามมา |
|---|---|
| Figma REST API เขียน node ไม่ได้ (เขียนได้แค่ comment / dev resource / webhook / variable ที่เป็น Enterprise) | ต้องใช้ **Plugin API** ⇒ งานนี้**ไม่ใช้ Figma token เลย** |
| ปลั๊กอิน dev ต้องใช้ **Figma desktop app** | เบราว์เซอร์ไม่มีเมนู Plugins → Development · แต่**คนใช้ผลลัพธ์ไม่ต้องลงอะไร** เปิดแก้ในเบราว์เซอร์ได้ปกติ |
| บัญชี `anu@odds.team` เป็น **Starter** และไลบรารี PEA อยู่คนละทีม | `importComponentByKeyAsync` ใช้ไม่ได้ ⇒ **สร้าง component เองในไฟล์ปลายทาง** |
| แพลนฟรีจำกัด **3 page ต่อไฟล์** | ทุกหน้าจอเป็น frame เรียงกันใน page เดียว ห้ามแตก page ละหน้าจอ |
| 6 หน้าเป็น **JS-rendered ทั้งหมด** (`<div id="planNewBody"></div>`) | parse HTML แบบ static ไม่ได้เลย ต้องเรนเดอร์ด้วยเบราว์เซอร์จริง |
| plugin sandbox ไม่มี `fetch` และไม่มี `eval` | โหลดสเปกที่ `ui.html` แล้ว postMessage เข้า sandbox · สเปกต้องเป็น JSON โครงตายตัว |
| `allowedDomains` ไม่รับ IP literal | ใช้ `http://localhost:8124` ใน `devAllowedDomains` · และ `serve.js` ต้อง listen ทั้ง `127.0.0.1` และ `::1` เพราะ macOS resolve `localhost` เป็น `::1` ก่อน |

**ทางที่พิจารณาแล้วไม่เอา** — pixel diff (Figma กับ Chromium คนละเอนจินฟอนต์ ยังไงก็แดงตลอด) · gen `.fig` เอง (format ปิด) · ขับ canvas ด้วย Playwright (เปราะ + สุ่มเสี่ยง ToS) · เขียน spec มือ (ทำซ้ำไม่ได้ และ 6 หน้าเป็น JS-rendered จึงเดาผลผิดแน่)

## 3. สถาปัตยกรรม

```
หน้า HTML (JS-rendered)
   │  1-extract.js   playwright-core เปิดที่ 127.0.0.1:8123 รอ render จบ
   │                 เดิน DOM เก็บ rect + computed style + pseudo-element
   ▼ out/dom-<page>.json
   │  2-map.js       ใช้ mapping.js แปลคลาส → component / auto-layout
   ▼ out/spec.json
   │  serve.js       เสิร์ฟที่ localhost:8124 (ต้องมี CORS — iframe ปลั๊กอิน origin เป็น null)
   ▼
plugin/  ui.html fetch → postMessage → code.js สร้าง node
```

**ทำไมแยก extract กับ map** — ตาราง mapping จะผิดหลายรอบ ถ้ารวมเป็นสคริปต์เดียว แก้ทีต้องเปิด Chromium ใหม่ทุกครั้ง (6 หน้า JS-rendered เปิดทีนึงช้า) แยกแล้วรอบแก้เหลือวินาทีเดียว

รูปแบบ `spec.json` v1 อยู่ใน [`figma-export/README.md`](../../../figma-export/README.md)

## 4. โครงไฟล์ Figma ที่ได้

| page | เนื้อหา |
|---|---|
| `Foundations & Components` | Figma Variables · icon component 45 ตัว · component 14 ชุดทุก variant |
| `Screens — บำรุงรักษาประจำปี` | 6 frame เรียงแนวนอน ห่างกัน 160px |

เหลือว่างอีก 1 page ตามโควตาแพลนฟรี (ต้องลบ `Page 1` กับหน้าตัวอย่างทิ้งก่อน)

### 4.1 Variables

`tokens.css` มีโครง 3 ชั้นอยู่แล้ว แมปตรงกับ Figma Variables พอดี — gen เป็น 3 collection แล้ว**ผูก fill ของทุก component เข้ากับ variable** ไม่ทาสีดิบ

```
primitive/   brand-600, gray-300, success-50, space-3, …
semantic/    color-text-secondary, color-border-primary, …
component/   btn-primary-bg, btn-destructive-bg, …
```

แก้ `brand/600` ที่เดียว ทั้งไฟล์เปลี่ยนตาม — เทียบเท่ากับ `var(--brand-600)` ในโค้ด
Starter สร้าง local variable ได้ (จำกัดที่จำนวน mode ซึ่งเราใช้ mode เดียวอยู่แล้ว เพราะระบบเป็น light-only)

### 4.2 Component 14 ชุด

เลือกจากคลาสที่ 6 หน้านั้น**ใช้จริง** (นับจากโค้ด: `btn` 58 · `badge` 47 · `sect` 43 · `tbl` 26 · `card` 25)

| คลาสในโค้ด | component | variant |
|---|---|---|
| `.btn` + `.btn-p/s/t/o/g` × `.btn-sm/md` | `Button` | Hierarchy 5 × Size 2 |
| `.badge` + `.b-ok/low/out/brand` | `Badge` | Status 4 |
| `.f` + `.in` | `Form field` | ไอคอน 2 × สถานะ 3 |
| `.tbl th` · `.tbl td` | `Table header cell` · `Table cell` | — |
| `.nv` | `Sidebar item` | on / off |
| `.wstep` | `Stepper step` | default / active / passed |
| `.rzone` | `Review zone` | เปิด / ปิด |
| `.sect` `.card` `.crumbs` `.empty` `.toast` `.draft` | อย่างละตัว | — |

เก็บเฉพาะ **สถานะ default** — hover / focus / loading ไม่ทำ เพราะ prototype จับได้แค่สถานะเดียวต่อการเรนเดอร์หนึ่งครั้ง

### 4.3 การตั้งชื่อ layer

ตรงกับคลาสในโค้ดเสมอ คั่นด้วย ` / `

```
.btn.btn-p.btn-md   →   btn / primary / md
.badge.b-ok         →   badge / success
```

## 5. ห้าเคสที่ CSS ข้ามไป Figma ตรงๆ ไม่ได้

1. **pseudo-element 8 จุดที่มีภาพจริง** — แถบม่วง 4×20 ของ `.sect` · เส้นเฉียง ±16° ของ `.wstep` · จุดกลม + เส้นตั้งของ `.tl`
   `::before/::after` ไม่มีใน DOM ⇒ `getBoundingClientRect` มองไม่เห็น
   **แก้:** `1-extract.js` เรียก `getComputedStyle(el, '::before')` ทุก element ที่ `content` ไม่ใช่ `none` แล้ว emit เป็น node ลูกเพิ่ม
   ไม่ทำ = หน้าจอขาดแถบม่วงหัวข้อกับเส้นคั่น stepper ทั้งหมด

2. **ไอคอน Material Symbols 45 ตัว** — ดึง SVG จาก Google Fonts ตอน build แล้วสร้างเป็น icon component ใน Figma
   (ไม่ใช้วิธีปล่อยเป็น text เพราะคนที่เปิดไฟล์ต้องมีฟอนต์ในเครื่อง ไม่งั้นเห็นคำว่า `list_alt`)

3. **`<table>`** เป็น `display:table` ไม่ใช่ flex ⇒ แปลงเอง: ตาราง = auto-layout แนวตั้ง · แถว = แนวนอน · คอลัมน์ยึดความกว้างจริงที่วัดได้

4. **`.fgrid` เป็น CSS Grid 4 คอลัมน์** ⇒ แตกเป็นแถวละ 4 ช่อง (auto-layout ไม่มี grid)

5. **hover / transition** — เก็บ default state อย่างเดียว
   ผลที่ยอมรับ: `.side` กว้าง **96px ไม่ใช่ 280px** และป้ายชื่อเมนู sidebar จะไม่มี เพราะเป็น `::after{content:attr(title)}` ที่โผล่ตอน hover

## 6. เกณฑ์ว่าแปลงถูก

รันอัตโนมัติได้ 3 ข้อ:

1. **รายการ fallback = 0 หรืออธิบายได้ทุกตัว** — element ที่ไม่แมตช์คลาสจะถูกวางตาม geometry แล้ว log ไว้ · ถ้ามีเป็นร้อย แปลว่าตารางแปลงยังไม่พอ
2. **ข้อความไม่หาย** — เทียบชุด text จาก DOM กับที่สร้างใน Figma ต้องครบตัวต่อตัว (บั๊กที่เงียบที่สุด: กล่องมาครบแต่ตัวหนังสือหาย)
3. **ขนาด frame หลักตรง ±2px** เทียบกับ `getBoundingClientRect`

ความถูกต้องเชิงดีไซน์ใช้ตาดูเทียบ screenshot คู่กัน — อัตโนมัติไม่ได้

## 7. ที่ทำเสร็จแล้ว

`figma-export/plugin/` — import เข้า Figma ผ่านแล้ว สร้าง node จากสเปกตัวอย่างได้จริง
ยืนยันแล้วว่า: layer tree + ชื่อ layer ถูก · auto-layout ทำงาน · ภาษาไทยเรนเดอร์ปกติ · **รันซ้ำล้างของเดิมไม่สร้าง page ซ้อน**

`figma-export/serve.js` — 200 ทั้ง `127.0.0.1` / `::1` / `localhost` พร้อมส่วนหัว CORS

## 8. ที่ยังไม่ทำ

- `1-extract.js` · `mapping.js` · `2-map.js`
- gen Figma Variables จาก `tokens.css`
- ดึง SVG ไอคอน 45 ตัว
- รองรับ `type: "instance"` ใน `code.js` (ตอนนี้ log เตือนแล้ววาดเป็น frame)
