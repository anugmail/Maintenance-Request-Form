# วิธี export หน้าจอ prototype เข้า Figma — คู่มือทำตามทีละขั้น

> ไฟล์นี้คือ **ขั้นตอนปฏิบัติ** · ส่วน [`README.md`](README.md) คือ **อ้างอิง** (ทำไมออกแบบแบบนี้ · โครงสเปก · ข้อจำกัดทั้งหมด)
> ถ้าจะแก้ท่อ ให้อ่าน README ก่อน · ถ้าจะแค่ "ส่งหน้าจอเข้า Figma" อ่านไฟล์นี้พอ
>
> ↔️ ขา**อ่านออกจาก** Figma (REST API ไม่ผ่าน MCP) อยู่คนละไฟล์: [`design-system/HOWTO-read-figma.md`](../design-system/HOWTO-read-figma.md)

---

## 0. เลือกท่อให้ถูกก่อน — มี 2 ท่อ ไม่ทับกัน

| | **ท่อ A — FigJam board** (ทางหลัก) | **ท่อ B — Figma design** |
|---|---|---|
| ได้อะไร | **ภาพหน้าจอจริง** เรียงเป็น flow + ผัง flowchart แบบ native + ลูกศรเชื่อม | **frame + auto-layout + Variables + component** ที่ดีไซเนอร์แก้ได้จริง |
| เหมาะกับ | เอาไปคุย/รีวิว flow กับเจ้าของงาน | ส่งต่อให้ดีไซเนอร์ทำงานต่อในไฟล์ design |
| ชนิดไฟล์ Figma | **FigJam** | **Design** |
| ปลั๊กอิน | `figjam-plugin/` | `plugin/` |
| ไฟล์สเปก | `out/board.json` | `out/spec.json` (ชุด yearly) · `out/spec-report.json` (โฟลว์แจ้งซ่อม) |
| แก้ไขในไฟล์ได้ไหม | รูปเป็นภาพนิ่ง แก้ไม่ได้ | แก้ได้ทุก layer |

> เจ้าของงานเคาะ 12 ส.ค. 2569 ว่า**ทางหลักคือท่อ A** เพราะอยากเห็นภาพหน้าจอจริงเรียงเป็น flow
> ท่อ B กลับมาใช้เฉพาะเมื่อขอเป็นรายโฟลว์

**ทั้งสองท่อไม่ใช้ Figma token เลย** — Figma REST API เขียน node ไม่ได้ (เขียนได้แค่ comment / dev resource / webhook)
สร้าง frame/text/รูป ได้ทางเดียวคือ **Plugin API** ⇒ ต้องเป็น dev plugin บน Figma desktop

---

## 1. เตรียมเครื่อง — ทำครั้งเดียว

### 1.1 playwright-core (สคริปต์เปิดหน้าจริงต้องใช้)

สคริปต์ที่ต้องใช้: `1-extract.js` · `figjam-capture.js` · `flow-*-capture.js` · `flow-report-extract.js` · `4-figjam-diagram.js`

```bash
mkdir -p ~/pw && cd ~/pw && npm i playwright-core
export NODE_PATH=~/pw/node_modules      # ใส่ไว้ทุกครั้งที่รันสคริปต์กลุ่มนี้
```

**ไม่ต้องโหลด browser ของ playwright** — ใช้ Chrome ที่ติดเครื่องอยู่แล้ว
ค่าเริ่มต้นชี้ที่ `/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome`
เครื่องอื่นชื่อไม่ตรง ให้ override:

```bash
export CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

### 1.2 Figma desktop app

- **ต้องเป็น desktop app** — เปิดในเบราว์เซอร์จะไม่มีเมนู `Plugins → Development`
- ต้องเปิด **ไฟล์ที่แก้ไขได้** — ถ้าสิทธิ์เป็น view อย่างเดียว เมนู Plugins หายทั้งก้อน
- 🚫 **ห้ามรันปลั๊กอินในไฟล์ไลบรารี PEA** (`EXT_PEA_VMS_v1.0.2_Component`) — เจ้าของงานสั่งห้ามแก้เด็ดขาด

### 1.3 import ปลั๊กอิน (ทำครั้งเดียวต่อเครื่อง)

Figma desktop → ไอคอนมุมซ้ายบน → **Plugins → Development → Import new plugin from manifest…**
(หรือกด `⌘ /` แล้วพิมพ์ `import new plugin`)

| ท่อ | เลือกไฟล์ | จะไปอยู่ที่ |
|---|---|---|
| A — FigJam | `figma-export/figjam-plugin/manifest.json` | Plugins → Development → **Maintain-D → FigJam board** |
| B — Design | `figma-export/plugin/manifest.json` | Plugins → Development → **Maintain-D → Figma** |

รันซ้ำด้วย `⌘ ⌥ P` · **แก้โค้ดปลั๊กอินแล้วไม่ต้อง import ใหม่ แค่รันซ้ำ**

### 1.4 ฟอนต์

ถ้าเครื่องไม่มี **IBM Plex Sans Thai** ปลั๊กอินจะ fallback เป็น Inter แล้ว log เตือน (ไม่ crash)
อยากได้ผลตรงจริง ให้ลงฟอนต์จาก Google Fonts ก่อน

---

## 2. ท่อ A — FigJam board (ทางหลัก)

### 2.1 ภาพรวมท่อ

```
หน้า HTML  →  capture เป็น PNG  →  board.json  →  serve.js  →  ปลั๊กอิน FigJam  →  บอร์ด
              (+ ผัง mermaid → JSON)
```

### 2.2 ขั้นที่ 1 — เปิดเซิร์ฟเวอร์ prototype

```bash
cd /Users/anu.p/PEA/Maintain-D/Maintenance-Request/Maintenance-Request-Form
python3 -m http.server 8123 --bind 127.0.0.1 &
```

🚫 **ห้ามใช้ `file://`** — storage event ข้ามแท็บไม่เสถียร หน้าจะเรนเดอร์ไม่ตรงจริง

### 2.3 ขั้นที่ 2 — capture หน้าจอ

เลือกเฉพาะชุดที่ต้องใช้ ไม่ต้องรันทั้งหมด:

```bash
export NODE_PATH=~/pw/node_modules

# ทุกหน้า (25 หน้า · สไลซ์อัตโนมัติถ้าหน้าสูงเกิน 4000px)
node figma-export/figjam-capture.js

# หรือเลือกเป็นรายโฟลว์ — "ไล่กดจริง" ทีละขั้น ไม่ใช่ถ่ายสถานะแรกของหน้า
node figma-export/flow-plan-capture.js         # สร้างแผน / ออกเลขงาน  8 จอ
node figma-export/flow-after-issue-capture.js  # พัสดุรับทราบ + ยืนยันรถ  7 จอ
node figma-export/flow-trips-capture.js        # วางแผนการเดินทาง  8 จอ
node figma-export/flow-report-capture.js       # แจ้งซ่อม ฝั่งผู้แจ้ง  8 จอ
```

▼ ได้ `out/figjam/**/*.png` + `out/figjam/manifest.json`

> **ทำไมต้องมีสคริปต์ต่อโฟลว์:** เจ้าของงานต้องการเห็น wizard **ทีละขั้น** สคริปต์พวกนี้จึงกดปุ่มจริงในหน้า
> แล้วถ่ายภาพหลังทุกขั้น — ไม่ใช่เปิดหน้าแล้วถ่ายรูปเดียว

### 2.4 ขั้นที่ 3 — แปลงผัง mermaid เป็น node ของ FigJam (ถ้าต้องการ)

```bash
# ค่าเริ่มต้น = Diagram/01-บำรุงรักษาตามวาระ/01-ออกเลขงาน.md → out/diagram-plan.json
node figma-export/4-figjam-diagram.js

# ผังอื่น
node figma-export/4-figjam-diagram.js \
  --src=Diagram/01-บำรุงรักษาตามวาระ/03-เฟส2-ดำเนินการบำรุงรักษา.md \
  --out=diagram-maint.json
```

ผังที่ได้เป็น **ShapeWithText + connector จริงของ FigJam** — ลาก node แล้วเส้นตาม ไม่ใช่ภาพนิ่ง
(geometry มาจาก SVG ที่ mermaid จัด layout ให้ · ชนิด node กับเส้น parse จากซอร์ส `.md` ตรงๆ)

### 2.5 ขั้นที่ 4 — ประกอบเป็น board.json

```bash
node figma-export/3-figjam-board.js            # ค่าเริ่มต้น: ผังสร้างแผน + 4 โฟลว์หลัก
node figma-export/3-figjam-board.js --after    # + โฟลว์หลังออกเลขงาน (พัสดุ/ยืนยันรถ)
node figma-export/3-figjam-board.js --maint    # + เฟส 2 ดำเนินการบำรุงรักษา
node figma-export/3-figjam-board.js --pages    # + หน้ารวมทุกหน้าจัดหมวด
node figma-export/3-figjam-board.js --all      # ทุกชุด
```

▼ ได้ `out/board.json`

> ⚠️ **สโคป** — เจ้าของงานย้ำว่า *"ทำแค่ flow ที่บอก ไม่ใช่ทั้งหมด"*
> ค่าเริ่มต้นจึงไม่ใส่ทุกอย่าง · ใส่ชุดอื่นเมื่อถูกขอเท่านั้น

### 2.6 ขั้นที่ 5 — เทสก่อนเปิด Figma

```bash
node figma-export/test-figjam-plugin.js
```

รัน `figjam-plugin/code.js` บน **mock ของ Plugin API** ตรวจ: จำนวน node ตรง · ลูกศรผูกปลายถูก · รันซ้ำไม่ซ้อน
**ผ่านตรงนี้ก่อนค่อยเปิด Figma** — จะได้ไม่ต้องมานั่งลบของเสียในไฟล์จริง

### 2.7 ขั้นที่ 6 — เสิร์ฟให้ปลั๊กอิน

```bash
node figma-export/serve.js        # พอร์ต 8124
```

ปล่อยหน้าต่างนี้รันค้างไว้ · เสิร์ฟทั้ง `board.json` และรูปทั้งหมด (รองรับ path ย่อย)

### 2.8 ขั้นที่ 7 — กดในไฟล์ FigJam

1. เปิด **Figma desktop** → ไฟล์ FigJam
   (บอร์ดที่ใช้อยู่: `mDn6j6wVtdn0DMtFwiDsRQ` ใน **anu phetcharat's Team**)
2. `Plugins → Development → Maintain-D → FigJam board` (หรือ `⌘ ⌥ P`)
3. ช่อง URL ค่าเริ่มต้นคือ `http://localhost:8124/board.json` — ปกติไม่ต้องแก้
4. กดปุ่ม **"โหลด + สร้างบอร์ด"**

**รันซ้ำ = ล้างของเดิมสร้างใหม่** ไม่ซ้อนกันรก (เก็บกวาดรูปที่อัปโหลดค้างให้ด้วย)

---

## 3. ท่อ B — Figma design (frame + Variables + component)

### 3.1 ภาพรวมท่อ

```
หน้า HTML (JS-rendered)
   │ 1-extract.js / flow-report-extract.js   เดิน DOM เก็บ rect + computed style + pseudo-element
   ▼ out/dom-*.json  (+ out/shot-*.png)
   │ 2-map.js        geometry บอกโครง · CSS บอกหน้าตา
   │                 + tokens-vars.js อ่าน tokens.css → Variables 3 collection
   │                 + components-map.js ยกของซ้ำเป็น component แล้วแทนด้วย instance
   ▼ out/spec.json หรือ out/spec-report.json  (+ out/map-report.json)
   │ serve.js
   ▼ plugin/ → สร้าง Variables → หน้า Foundations & Components → หน้าจอ
```

### 3.2 แบบที่ 1 — ชุด yearly (4 หน้าจอ)

```bash
python3 -m http.server 8123 --bind 127.0.0.1 &
export NODE_PATH=~/pw/node_modules

node figma-export/1-extract.js     # เปิดหน้าจริง เก็บ DOM
node figma-export/0-icons.js       # โหลด SVG ไอคอนจาก Google Fonts (cache ที่ out/icons.json)
node figma-export/2-map.js         # → out/spec.json
node figma-export/test-plugin.js   # เทสบน mock Plugin API
node figma-export/serve.js         # เสิร์ฟพอร์ต 8124
```

⚠️ **`0-icons.js` ต้องรันหลัง `1-extract.js`** เพราะอ่านรายชื่อไอคอนจาก `out/dom-*.json`
แต่รันครั้งเดียวพอ ผลลัพธ์ cache ไว้

ในไฟล์ Figma **design** → `Plugins → Development → Maintain-D → Figma`
→ **แก้ช่อง URL เป็น `http://localhost:8124/spec.json`** (ค่าเริ่มต้นชี้ `spec-report.json`)
→ กด **"โหลด + สร้าง"**

### 3.3 แบบที่ 2 — โฟลว์แจ้งซ่อม ฝั่งผู้แจ้ง (8 state)

`flow-report-extract.js` เป็นคู่แฝดของ `flow-report-capture.js` — ไล่กด wizard เส้นเดียวกันเป๊ะ
แต่แทนที่จะถ่ายภาพ มันเก็บ DOM + computed style ทีละ state

```bash
export NODE_PATH=~/pw/node_modules
node figma-export/flow-report-extract.js    # ต้องมี :8123 รันอยู่ → out/dom-report-01..08.json
node figma-export/0-icons.js                # ไอคอนของ mock เพิ่ม (58 ตัว)
node figma-export/2-map.js --report         # → out/spec-report.json (ไม่แตะ spec.json)
node figma-export/test-plugin.js --report   # เทสก่อนเปิด Figma
node figma-export/serve.js
```

ในไฟล์ Figma design → กด **"โหลด + สร้าง"** ได้เลย (ค่าเริ่มต้นชี้ `spec-report.json` อยู่แล้ว)
ได้หน้าชื่อ `Screens — แจ้งซ่อม (ฝั่งผู้แจ้ง)` · node รวม 1,729 (หนักสุด 342/state)

### 3.4 ไม่อยากรัน server

กดปุ่ม **"ใช้ตัวอย่างในตัว"** — สเปกตัวอย่างฝังอยู่ใน `plugin/code.js` แล้ว ใช้ดูว่าปลั๊กอินทำงานไหม

---

## 3.5 ท่อ C — ใช้ component จริงของ VMS Plus (25 ส.ค. 2569)

**ปัญหา:** ท่อ B สร้าง component ขึ้นมาเองในไฟล์ ⇒ ค่าตรงแต่ไม่ได้ผูกกับ design system จริง
ดีไซเนอร์กดสลับ property (Badge / Actions / State / Breakpoint) ไม่ได้

**ทำไมไม่ import ตรงๆ:** `importComponentByKeyAsync` ต้องเปิดไลบรารีในไฟล์ ซึ่งต้อง Professional+
ตรวจแล้ว 25 ส.ค. 2569 — บัญชี `anu@odds.team` มีที่นั่ง **Full เฉพาะทีม starter** ส่วน org `ODDS` เป็น **View**
และ `get_libraries` ของไฟล์ PEA คืน `libraries_available_to_add: []` ⇒ **ไม่มีไลบรารีองค์กรให้เปิดเลย**

**ทางออกที่ใช้ได้จริง — โคลนจาก instance ที่มีอยู่แล้วในไฟล์**

```js
const sample = /* instance ตัวอย่างของ component นั้น */;
const copy = sample.clone();      // ยังผูก main component เดิม ⇒ property สลับได้ครบ
copy.setProperties({ 'Title': '…', 'Badge': false });
```

`clone()` ไม่ต้องใช้สิทธิ์ไลบรารี ⇒ **ทำได้บน starter** · ข้อแม้: component ที่จะใช้ต้องมี instance
อยู่ในไฟล์อย่างน้อย 1 ตัว

### ขั้นที่ 1 — ดัมป์แคตตาล็อกว่าไฟล์นั้นมี component อะไรให้ใช้บ้าง

ปลั๊กอิน **อ่านอย่างเดียว** ไม่แก้อะไรในไฟล์

```bash
node figma-export/serve.js        # ต้องรันค้างไว้ (รับ POST เขียนลง out/ แล้ว)
```

1. Figma desktop → เปิดไฟล์ที่จะใช้ (**ใช้ไฟล์ที่ duplicate มา ไม่ใช่ไฟล์งานจริงของทีม**)
2. Plugins → Development → **Import plugin from manifest** → `figma-export/catalog-plugin/manifest.json`
3. `⌘⌥P` → **"VMS Plus — ดัมป์แคตตาล็อก component"** → กด **"เริ่มอ่านไฟล์"**
4. ได้ `figma-export/out/figma-catalog.json` — ต่อ component มี: ชื่อ · มาจากไลบรารีหรือ local ·
   จำนวน instance · **property ทั้งหมดพร้อมตัวเลือก** · `sample.id` ของ instance ที่เอาไปโคลนได้

> ถ้า POST ไม่ผ่าน (ลืมรัน `serve.js`) UI จะโชว์ JSON ให้ก๊อปแทน

### ขั้นที่ 2–3 — ยังไม่ได้ทำ

2. ทำตารางแมป `components.css` ↔ ชื่อ component จริง (`.tbl` → Table · `.crumbs` → Breadcrumbs …)
3. แก้ `2-map.js` ให้สเปกอ้าง **ชื่อ component + ค่า property** แทนคำสั่งวาดกล่อง แล้วปลั๊กอิน clone + setProperties

---

## 4. เพิ่มโฟลว์ใหม่เข้าบอร์ด — ต้องแตะ 3 ที่

1. **เขียนสคริปต์ capture** — คัดลอกจาก `flow-plan-capture.js` แล้วแก้ลำดับการกด
   - ห้าม `fullPage: true` — element ที่ `position:fixed` จะวาดซ้ำทุกสไลซ์
     ให้ **ขยาย viewport เท่าความสูงหน้า** แทน
   - capture ที่ `scale: 1` และสไลซ์หน้าที่ยาวเกิน — **รูปใน FigJam เกิน 4096px ต่อด้านไม่ได้**
2. **เพิ่ม section ใน `3-figjam-board.js`** — ตั้งชื่อ section + ชี้ไปโฟลเดอร์รูปที่ capture ไว้
3. **รัน `test-figjam-plugin.js`** ให้ผ่าน แล้วให้ผู้ใช้กด `⌘ ⌥ P` ในไฟล์จริง

ถ้าโฟลว์นั้นมีผัง mermaid ด้วย ให้รัน `4-figjam-diagram.js --src=… --out=…` ก่อนขั้นที่ 2

---

## 5. ตรวจก่อนบอกว่าเสร็จ

```bash
node figma-export/test-figjam-plugin.js     # ท่อ A
node figma-export/test-plugin.js            # ท่อ B ชุด yearly
node figma-export/test-plugin.js --report   # ท่อ B โฟลว์แจ้งซ่อม
node figma-export/test-pseudo-geom.js       # เรขาคณิตของ pseudo-element ที่หมุน
```

แล้วเทียบตาทีละเฟรมกับ `out/shot-*.png` ที่ extract ถ่ายไว้ — **ค้างอยู่ ยังไม่ได้ทำ**

---

## 6. ปัญหาที่เจอแล้ว + วิธีแก้

| อาการ | สาเหตุ | วิธีแก้ |
|---|---|---|
| import plugin ไม่ผ่าน ฟ้อง *"must be a valid URL"* | `allowedDomains` **ไม่รับ IP literal** | ใช้ `http://localhost:8124` ไม่ใช่ `127.0.0.1` และวางใน `devAllowedDomains` (แก้ไว้แล้วใน manifest) |
| ปลั๊กอินต่อ server ไม่ติด หาสาเหตุไม่เจอ | macOS resolve `localhost` เป็น `::1` ก่อน | `serve.js` listen ทั้ง `127.0.0.1` และ `::1` แล้ว — ถ้ายังไม่ติด เช็คว่ารัน `serve.js` อยู่จริง |
| สร้าง page ใหม่ไม่ได้ | **แพลนฟรีจำกัด 3 page ต่อไฟล์** | ลบหน้า `Screens …` ชุดเก่าในไฟล์ทิ้งก่อนกด · ทุกหน้าจอต้องเป็น frame เรียงกันในหน้าเดียว ห้ามแตก page ละหน้าจอ |
| เมนู `Plugins` หายไปทั้งก้อน | เปิดไฟล์ที่มีสิทธิ์แค่ view หรือเปิดในเบราว์เซอร์ | เปิดไฟล์ที่แก้ได้ ใน desktop app |
| ตัวอักษรเป็น Inter ไม่ใช่ไทย | ไม่มี IBM Plex Sans Thai ในเครื่อง | ลงฟอนต์ แล้วรันปลั๊กอินซ้ำ |
| หน้า `admin` สร้างไม่ขึ้น | 3,770 node ใหญ่เกิน | ตัดออกจากชุดตั้งแต่ต้น — ไม่ต้องพยายามยัดเข้าไป |
| ได้ flow ผิดชุด | ช่อง URL ในปลั๊กอินชี้ไฟล์สเปกผิด | ดูให้ตรง: `spec.json` = yearly · `spec-report.json` = แจ้งซ่อม · `board.json` = FigJam |
| รูปในบอร์ดหาย/เพี้ยน | รูปเกิน 4096px ต่อด้าน | capture ที่ scale 1 + สไลซ์ (สคริปต์ทำให้แล้ว ถ้าเขียนสคริปต์ใหม่ต้องทำเอง) |
| MCP ของ Figma เรียกไม่ได้ | แพลน Starter จำกัด **20 call/เดือน** | ท่อนี้ **ไม่ใช้ MCP เลย** — ใช้ dev plugin ซึ่งไม่กินโควตา |

---

## 7. ข้อห้าม

- 🚫 **ห้ามรันปลั๊กอินในไฟล์ไลบรารี PEA** `EXT_PEA_VMS_v1.0.2_Component` — อ่านอย่างเดียว
- 🚫 **ห้าม `use_figma` (MCP)** กับไฟล์ไลบรารี — มันรันสคริปต์แก้ไฟล์ได้
- 🚫 **ห้าม commit `out/`** — อยู่ใน `.gitignore` แล้ว (hex ในนั้นมาจาก computed style ไม่ใช่สไตล์ที่เขียนเอง)
- ⚠️ **อ่าน design-system ก่อนวางเสมอ** (เจ้าของงานย้ำ 10 ส.ค. 2569) — ห้ามแปลง hex เป็น RGB ฮาร์ดโค้ดลงสคริปต์
  ต้องสร้าง **variable collection ใน Figma** ให้ตรงโครง 3 ชั้นของ `tokens.css` แล้ว **bind** fill/stroke เข้ากับ variable
- ⚠️ ไอคอน UI ต้องเป็น **Material Symbols จริง (import SVG)** ไม่ใช่พิมพ์ `+` เป็นตัวอักษร

---

## 8. สรุปคำสั่งแบบย่อ — ก๊อปวางได้เลย

**ท่อ A — บอร์ด FigJam**

```bash
cd /Users/anu.p/PEA/Maintain-D/Maintenance-Request/Maintenance-Request-Form
export NODE_PATH=~/pw/node_modules
python3 -m http.server 8123 --bind 127.0.0.1 &
node figma-export/flow-plan-capture.js
node figma-export/4-figjam-diagram.js
node figma-export/3-figjam-board.js
node figma-export/test-figjam-plugin.js
node figma-export/serve.js
# → Figma desktop → ไฟล์ FigJam → ⌘⌥P → "โหลด + สร้างบอร์ด"
```

**ท่อ B — ไฟล์ Figma design (โฟลว์แจ้งซ่อม)**

```bash
cd /Users/anu.p/PEA/Maintain-D/Maintenance-Request/Maintenance-Request-Form
export NODE_PATH=~/pw/node_modules
python3 -m http.server 8123 --bind 127.0.0.1 &
node figma-export/flow-report-extract.js
node figma-export/0-icons.js
node figma-export/2-map.js --report
node figma-export/test-plugin.js --report
node figma-export/serve.js
# → Figma desktop → ไฟล์ design → ⌘⌥P → "โหลด + สร้าง"
```
