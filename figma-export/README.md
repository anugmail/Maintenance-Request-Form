# figma-export — ส่งหน้าจอจาก HTML prototype เข้า Figma

> **สถานะ:** ทั้ง 3 ท่อนใช้ได้แล้ว — 4 หน้าจอออกมาเป็น frame + auto-layout + ไอคอน SVG
> (`plan-skeleton` พักไว้ตามที่เจ้าของงานสั่ง 11 ส.ค. · `admin` ตัดออกเพราะใหญ่เกิน 3,770 node)
> ยังไม่ได้ทำ: ยกเป็น Figma component/variant จริง · gen Variables จาก `tokens.css`

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
   ▼ out/spec.json  + out/map-report.json
   │  serve.js       เสิร์ฟที่ localhost:8124 (ต้องมี CORS)
   ▼
plugin/  ปลั๊กอินดึง spec.json แล้วสร้างของใน Figma
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

## รูปแบบสเปก (v1)

```jsonc
{
  "version": 1,
  "pageName": "ชื่อ page ใน Figma",
  "screens": [ { "name": "ชื่อ frame", "root": <node> } ]
}
```

`<node>`

| คีย์ | ค่า |
|---|---|
| `type` | `frame` · `text` · `rect` · `ellipse` (`instance` ยังไม่รองรับ — จะ log เตือนแล้ววาดเป็น frame) |
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
