# figma-export — ส่งหน้าจอจาก HTML prototype เข้า Figma / FigJam

> **ทางหลักตอนนี้ (เจ้าของงานเคาะ 12 ส.ค. 2569): บอร์ด FigJam แบบ capture** — ดูหัวข้อ "FigJam board" ข้างล่าง
> ท่อ Figma design (frame/auto-layout/Variables/component) **พักไว้** — โค้ด+เทสเสร็จแล้ว ไม่ทิ้ง:
> 4 หน้าจอ + ไอคอน SVG + **Variables 99 ตัวจาก `tokens.css`** + **component 6 ชุด / instance 121 จุด**
> (`plan-skeleton` พักตามคำสั่ง 11 ส.ค. · `admin` ตัดออกเพราะใหญ่เกิน 3,770 node)

## FigJam board — capture ทุกโฟลว์/ทุกหน้า (ทางหลัก)

ทำไมเป็น capture: เจ้าของงานต้องการภาพหน้าจอจริง "เรียงต่อกัน" ให้ดู flow ได้ ไม่ใช่ไฟล์ design ให้แก้
และ MCP ของแพลน Starter จำกัด **20 call/เดือน** (เดือนนี้หมดแล้ว) ⇒ เข้าไฟล์ทาง **dev plugin** ที่ไม่กินโควตา

```
figjam-capture.js            capture ทุกหน้า (25 หน้า สไลซ์หน้าสูงเกิน 4000px อัตโนมัติ)
flow-plan-capture.js         ไล่กดโฟลว์ "สร้างแผน / ออกเลขงาน" จริง 8 หน้าจอ
flow-after-issue-capture.js  โฟลว์ต่อ: พัสดุรับทราบ + ส่งคำขอ/ตอบยืนยันรถ 7 หน้าจอ
flow-trips-capture.js        โฟลว์วางแผนการเดินทาง (เฟส 1 ขั้น 3) เส้นหลัก 8 หน้าจอ
                             (fast-forward gate ยืนยันรถด้วย verdict ตรงๆ แบบ test/verify-trips.js)
flow-report-capture.js       โฟลว์แจ้งซ่อม ฝั่งผู้แจ้ง 8 หน้าจอ (mock/ wizard 5 ขั้น → ส่งเรื่อง
                             → รอหัวหน้าอนุมัติ · เลือกอาการเฉพาะที่มีอะไหล่แนะนำ ให้ขั้นอะไหล่ไม่ว่าง)
4-figjam-diagram.js          ผัง mermaid Diagram/01-…/01-ออกเลขงาน.md → out/diagram-plan.json
                             (geometry จาก SVG ที่ mermaid จัด layout · เส้น/ชนิด node parse จากซอร์สตรงๆ)
   ▼ out/figjam/**/*.png + manifest.json + out/diagram-plan.json
3-figjam-board.js            → out/board.json · ค่าเริ่มต้น = ผังโฟลว์สร้างแผน + capture สร้างแผน 8 จอ
                             + วางแผนการเดินทาง 8 จอ + แจ้งซ่อมฝั่งผู้แจ้ง 8 จอ (เจ้าของงานสั่งทีละโฟลว์)
                             เพิ่มชุดอื่นด้วย --after / --pages / --all
serve.js                     เสิร์ฟ board.json + รูป (รองรับ path ย่อยแล้ว)
   ▼
figjam-plugin/               ปลั๊กอิน FigJam: section ผัง (ShapeWithText ตามชนิด node + connector ผูกปลายจริง
                             ลาก node แล้วเส้นตาม) + section รูป (IMAGE fill) + ป้าย + ลูกศร flow
                             รันซ้ำล้างของเดิม + เก็บกวาดรูปอัปโหลดค้าง
```

ใช้งาน (หลัง capture + gen board แล้ว):

```bash
python3 -m http.server 8123 --bind 127.0.0.1 &      # ตอน capture เท่านั้น
node figma-export/serve.js                          # เสิร์ฟให้ปลั๊กอิน พอร์ต 8124
```

เปิด **Figma desktop** → ไฟล์ FigJam (บอร์ดปัจจุบัน: `mDn6j6wVtdn0DMtFwiDsRQ` ใน anu phetcharat's Team)
→ Plugins → Development → **Import new plugin from manifest…** → เลือก `figma-export/figjam-plugin/manifest.json`
→ กด **"โหลด + สร้างบอร์ด"** · รูปใน FigJam ใช้ `figma.createImage` + ShapeWithText (FigJam ไม่มี rectangle/frame)
· รูปห้ามเกิน 4096px ต่อด้าน — เป็นเหตุที่ capture ที่ scale 1 และสไลซ์หน้ายาว

เทสก่อนเปิด Figma: `node figma-export/test-figjam-plugin.js` (mock Plugin API — ตรวจจำนวน/ลูกศร/รันซ้ำไม่ซ้อน)

## ทำไมต้องเป็นปลั๊กอิน ไม่ใช่ REST API

Figma REST API **เขียน node ไม่ได้** — เขียนได้แค่ comment, dev resource, webhook และ variable (Enterprise เท่านั้น)
การสร้าง frame / text / auto-layout / component ทำได้ทางเดียวคือ **Plugin API** ⇒ งานนี้**ไม่ต้องใช้ Figma token เลย**

## ไปป์ไลน์

```
หน้า HTML (JS-rendered)
   │  1-extract.js   playwright-core เปิดที่ 127.0.0.1:8123 รอ render จบ
   │                 เดิน DOM เก็บ rect + computed style + pseudo-element
   ▼ out/dom-<page>.json  + out/shot-<page>.png
   │  2-map.js       ใช้ mapping.js แปลงเป็น frame + auto-layout
   │                 + tokens-vars.js อ่าน tokens.css → Variables 3 collection
   │                 + components-map.js ยกของซ้ำเป็น component + แทนด้วย instance
   ▼ out/spec.json  + out/map-report.json
   │  serve.js       เสิร์ฟที่ localhost:8124 (ต้องมี CORS)
   ▼
plugin/  สร้าง Variables → หน้า Foundations & Components → หน้าจอ (ตามลำดับ)
```

**หลักการตัดสินโครง: geometry เป็นคนบอกโครง · CSS เป็นคนบอกหน้าตา**
ไม่เชื่อ `display` ตรงๆ เพราะหน้าจอจริงมี `block` 272 · `table-cell` 215 · `flex` 173 · `inline-flex` 68 · `inline` 41 · `inline-block` 28 · `grid` 2 — เขียน rule แยกทุกค่าแล้วพลาดเคสผสมแน่ แต่ "ลูกเรียงลงล่าง / เรียงไปขวา" วัดจากพิกัดจริงได้แม่นกว่าและครอบคลุมทุก `display`

แยก extract กับ map เป็นคนละท่อน เพราะตาราง mapping จะผิดหลายรอบ — แก้แล้วรัน `2-map.js` ซ้ำได้ในวินาทีเดียว ไม่ต้องเปิด Chromium ใหม่ (6 หน้าเป็น JS-rendered ทั้งหมด เปิดทีนึงช้า)

## ติดตั้ง — ทำครั้งเดียว

1. เปิด **Figma desktop app** (เบราว์เซอร์ใช้ไม่ได้ ไม่มีเมนู Plugins → Development)
2. เปิดไฟล์ design ที่ **แก้ไขได้** — ถ้าเปิดไฟล์ที่มีสิทธิ์แค่ view เมนู Plugins จะหายไปทั้งก้อน
3. ไอคอน Figma มุมซ้ายบน → **Plugins → Development → Import new plugin from manifest…**
   (หรือกด `⌘ /` แล้วพิมพ์ `import new plugin`)
4. เลือก `figma-export/plugin/manifest.json`

ปลั๊กอินจะไปอยู่ที่ **Plugins → Development → Maintain-D → Figma** · รันซ้ำด้วย `⌘ ⌥ P`
แก้โค้ดปลั๊กอินแล้ว**ไม่ต้อง import ใหม่** แค่รันซ้ำ

## ใช้งาน

```bash
python3 -m http.server 8123 --bind 127.0.0.1 &      # เสิร์ฟ prototype
NODE_PATH=<ที่ npm i playwright-core ไว้>/node_modules \
  node figma-export/1-extract.js                    # เปิดหน้าจริง เก็บ DOM
node figma-export/0-icons.js                        # โหลด SVG ไอคอน (มี cache)
node figma-export/2-map.js                          # แปลงเป็น spec.json
node figma-export/serve.js                          # เสิร์ฟให้ปลั๊กอิน พอร์ต 8124
```

`0-icons.js` ต้องรัน**หลัง** `1-extract.js` เพราะมันอ่านรายชื่อไอคอนจาก `out/dom-*.json`
แต่รันแค่ครั้งเดียวพอ — ผลลัพธ์ cache ไว้ที่ `out/icons.json`

แล้วในปลั๊กอินกด **"โหลด + สร้าง"**
ถ้ายังไม่อยากรัน server กด **"ใช้ตัวอย่างในตัว"** ได้เลย — สเปกตัวอย่างฝังอยู่ใน `ui.html`

รันซ้ำชื่อ page เดิม = **ล้างของเดิมแล้วสร้างใหม่** ไม่ทับซ้อนกันรก

## ข้อจำกัดที่เจอแล้ว

| เรื่อง | ผลกับงาน |
|---|---|
| แพลนฟรี จำกัด **3 page ต่อไฟล์** | ทุกหน้าจอต้องเป็น **frame เรียงกันในหน้าเดียว** ห้ามแตก page ละหน้าจอ |
| plugin sandbox **ไม่มี `fetch`** | การโหลดสเปกทำที่ `ui.html` แล้ว `postMessage` เข้า `code.js` |
| plugin sandbox **ไม่มี `eval`** | ส่ง JS ดิบไปรันไม่ได้ — สเปกต้องเป็น JSON ที่มีโครงตายตัว |
| `allowedDomains` **ไม่รับ IP literal** | `http://127.0.0.1:8124` ทำให้ import ไม่ผ่าน (*"must be a valid URL"*) ⇒ ต้องใช้ `http://localhost:8124` และวางไว้ใน `devAllowedDomains` |
| macOS resolve `localhost` เป็น `::1` ก่อน | `serve.js` จึง listen ทั้ง `127.0.0.1` และ `::1` ไม่งั้นปลั๊กอินต่อไม่ติดแบบหาสาเหตุยาก |
| ไลบรารี PEA เป็นคนละไฟล์ + บัญชี Starter | ใช้ `importComponentByKeyAsync` ไม่ได้ ⇒ **สร้าง component เองในไฟล์นี้** |
| ฟอนต์ | ถ้า `IBM Plex Sans Thai` ไม่มีในเครื่อง จะ fallback เป็น Inter แล้ว log เตือน |

## Variables + Components (spec v2)

**Variables** — `tokens-vars.js` อ่าน `tokens.css` ทั้งไฟล์ แยกเป็น 3 collection ตามชั้นในไฟล์
(`primitive` / `semantic` / `component`) · `var(--x)` กลายเป็น alias จริงใน Figma
⇒ แก้ `brand/600` ที่เดียวทั้งไฟล์เปลี่ยน เทียบเท่า `var(--brand-600)` ในโค้ด
ชื่อ variable = ชื่อ CSS ตรงๆ เปลี่ยน `-` เป็น `/` (`--brand-600` → `brand/600`) — map กลับหาโค้ดได้เสมอ
ปลั๊กอิน**ผูก fill / stroke / สี text / radius เข้ากับ variable** ทุกจุดที่ค่าตรง token (สีดูจากชั้น primitive · #FFFFFF ไม่ผูกเพราะไม่มีชื่อ primitive ถือ)
รันซ้ำ = อัปเดตค่าตัวเดิม ไม่สร้างซ้ำ (เทสยืนยันแล้ว)

**Components** — `components-map.js` ใช้ชื่อ layer จาก `mapping.js` เป็นกุญแจ:

- **ชุด variant จริง + instance**: `btn` (Hierarchy×Size) · `badge` (Status) · `sidebar item` · `stepper step` (State) · `header cell` · `cell` — occurrence ที่โครงตรงตัวนิยามกลายเป็น instance พร้อม override (ข้อความ / สลับไอคอน / ซ่อนส่วนเกิน) ตัวที่โครงไม่ตรงคงเป็น frame แล้วรายงานใน `map-report.json`
- **specimen**: `card` `section header` `form field` `breadcrumb` `draft banner` `review zone` ฯลฯ — สถานะจับไม่ได้จากการเรนเดอร์รอบเดียว จึงเป็น component ตัวอย่างให้หยิบใช้ต่อ หน้าจอคงเป็น frame ตามจริง
- **icon component** ทุก glyph ที่ใช้ — ทุกจุดในหน้าจอเป็น instance สลับไอคอนได้

ตัวนิยามของ variant เลือกแบบ `rich` (โครงแบน เอาตัว node เยอะสุด — ปุ่มไม่มีไอคอน = ซ่อนไอคอน)
หรือ `common` (ข้างในหลากหลาย เช่นเซลล์ตาราง เอาโครงพบบ่อยสุด) — ตั้งใน `SETS` ของ `components-map.js`

**เทสก่อนเปิด Figma:** `node figma-export/test-plugin.js` — รัน `plugin/code.js` บน mock ของ Plugin API
ตรวจ: ข้อความครบตัวต่อตัว · alias ครบ · สีแบรนด์ไม่หลุดผูก · รันซ้ำ variable ไม่งอก

## รูปแบบสเปก (v2)

```jsonc
{
  "version": 2,
  "pageName": "ชื่อ page ใน Figma",
  "variables": { "collections": { "primitive": [], "semantic": [], "component": [] },
                 "colorIndex": { "#A80689": "brand/600" }, "radiusIndex": { "8": "rounded/md" } },
  "components": { "pageName": "Foundations & Components",
                  "sets": [ { "set": "btn", "variants": [ { "key": "Hierarchy=primary, Size=md", "root": {} } ] } ],
                  "specimens": [ { "name": "card", "root": {} } ],
                  "icons": [ { "glyph": "list_alt", "svg": "<svg…>" } ] },
  "screens": [ { "name": "ชื่อ frame", "root": <node> } ]
}
```

`<node>`

| คีย์ | ค่า |
|---|---|
| `type` | `frame` · `text` · `rect` · `ellipse` · `svg` (มี `glyph` จะวางเป็น instance ของ icon component) · `instance` (`set`+`key` ชี้เข้า components.sets · `overrides` = `{texts, icons, hidden}` index นับจากตัวนิยามแบบ pre-order) |
| `name` | ชื่อ layer — **ตั้งให้ตรงคลาสในโค้ด** เช่น `btn / primary / md` เพื่อ map กลับไปหา `.btn.btn-p.btn-md` ได้ |
| `layout` | `{ mode: VERTICAL\|HORIZONTAL\|NONE, gap, padding:[t,r,b,l], align, cross, wrap }` |
| `size` | `{ w, h, wMode, hMode }` — mode เป็น `FIXED` · `HUG` · `FILL` |
| `fill` | hex เช่น `#FFFFFF` |
| `stroke` | `{ color, weight, sides:[t,r,b,l] }` — `sides` ไว้ทำ border ด้านเดียว |
| `radius` | ตัวเลข หรือ `[tl,tr,br,bl]` |
| `shadows` | `[{ color, a, x, y, blur, spread }]` |
| `text` | `{ chars, size, weight, lineHeight, color, font, align }` |
| `children` | array ของ node |

`HUG` ใช้ได้เฉพาะ text กับ frame ที่มี auto-layout · `FILL` ใช้ได้เฉพาะเมื่อ parent เป็น auto-layout
ถ้าใช้ผิดเงื่อนไข ปลั๊กอินจะลดเป็น `FIXED` ให้แล้ว log เตือน ไม่ throw

## หมายเหตุเรื่องกฎ "ห้าม hardcode สี" ของโปรเจกต์

`plugin/ui.html` **ไม่มี hex สักตัว** ⇒ `grep` ตรวจสีของโปรเจกต์ยังได้ผลว่าง ไม่ต้องแก้คำสั่งตรวจ

- **สีของหน้าต่างปลั๊กอิน** ใช้ตัวแปรธีมของ Figma (`--figma-color-*`) ที่ `showUI({themeColors:true})` ฉีดเข้ามาให้
  (`<link>` ไปที่ `design-system/tokens.css` ไม่ได้ — iframe ของปลั๊กอินอ่านไฟล์ในเครื่องไม่ได้)
- **สเปกตัวอย่างอยู่ใน `code.js` ไม่ใช่ `ui.html`** เพราะมันต้องมีค่าสีจริง และ grep ตรวจเฉพาะไฟล์ `.html`
- **hex ใน `out/*.json`** เป็นข้อมูลที่ extract มาจาก computed style ไม่ใช่สไตล์ที่เขียนเอง · `out/` อยู่ใน `.gitignore` แล้ว
