# แผนงาน — export prototype เป็นไฟล์ Figma ที่ประกอบจาก component จริง

> **Goal:** เอาหน้าจอจาก HTML prototype ไปเป็นไฟล์ Figma โดยหน้าจอนั้นประกอบขึ้นจาก
> **component จริงของ VMS Plus** (ไม่ใช่กล่องที่วาดเอง) ⇒ ดีไซเนอร์เปิดไฟล์แล้ว
> **กดสลับ property ได้** (Badge · Actions · State · Breakpoint) เหมือน instance ในระบบจริง
>
> **เจ้าของงานสั่ง 25 ส.ค. 2569:** *"ทุกครั้งของการสร้าง prototype ให้มาอ่านจากของที่เพิ่งโหลดมา"*
> · *"อยากให้ปรับใช้กับทุกหน้าเลย"*
>
> **นำร่อง 1 หน้าก่อน:** `maintainance-yearly/trip-plan.html#repair` (สร้างแผนการเดินทางของงานซ่อม)
> พิสูจน์ว่าท่อทำงานถูกจริงก่อน ค่อยขยายไป 25 หน้า

---

## 0. สถานะตอนนี้ — อะไรเสร็จแล้ว อะไรยัง

| # | ขั้น | สถานะ |
|---|---|---|
| 1 | ดูดแคตตาล็อก component จากไฟล์ Figma จริง | ✅ **เสร็จ** — 42,510 instance → 183 component |
| 2 | กลั่นเป็นไฟล์ที่ commit ได้ (ถอดข้อมูลจริงออก) | ✅ **เสร็จ** — `design-system/figma-components.json` |
| 3 | แมป `components.css` ↔ component จริง | ✅ **เสร็จ** — `design-system/figma-map.json` 58 รายการ ตรวจผ่าน 58/58 |
| 4 | ตั้งเป็นกฎบังคับอ่านก่อนออกแบบ | ✅ **เสร็จ** — `CLAUDE.md` + `design-system/README.md` |
| 5 | รู้ว่าสร้าง instance ด้วยวิธีไหนได้ (import vs clone) | 🟡 **รอผล** — `build-test-plugin/` เขียนแล้ว รอเจ้าของงานรันแล้วบอกผล |
| 6 | ตัวแปลง DOM → spec ที่อ้าง component จริง | ✅ **เสร็จ** — `7-map-components.js` · 278 instance |
| 7 | ปลั๊กอินสร้าง instance จาก spec | ✅ **เสร็จ** — `component-plugin/` · เทส 11/11 |
| 8 | นำร่อง 1 หน้า (แผนเดินทางงานซ่อม) | 🟡 **พร้อมให้กดในไฟล์จริง** — รอผลจากเจ้าของงาน |
| 9 | ขยายทุกหน้า | ⬜ ยังไม่ทำ |

---

## 1. ภาพรวมท่อ

```
HTML prototype (หน้าจริง เปิดบน :8123)
   │  ① flow-repair-trip-extract.js — เปิดหน้า ไล่กดถึง state ที่ต้องการ
   │     แล้ว walkDom() เก็บ DOM + computed style + **ชื่อคลาสทุกตัว**
   ↓
out/dom-repair-trip-*.json
   │  ② 7-map-components.js — จับคลาส → component จริง ตาม figma-map.json
   │     ผลลัพธ์ไม่ใช่ "วาดกล่องสี่เหลี่ยม" แต่เป็น "instance ของ X ตั้ง property Y"
   ↓
out/spec-components.json
   │  ③ component-plugin/ — ในไฟล์ Figma: หา main component → createInstance
   │     → setProperties → จัด auto-layout ตามโครง
   ↓
หน้าจอใน Figma ที่กดสลับ property ได้
```

**ต่างจากท่อ B เดิมยังไง** — ท่อ B (`2-map.js`) แปลง computed style เป็น frame + fill + stroke
ได้หน้าตาเหมือน แต่เป็นกล่องตายๆ · ท่อนี้แปลงเป็น **instance** ⇒ ผูกกับ design system จริง

---

## 2. รูปแบบ spec (v3) — ต่างจาก spec v2 ของท่อ B

```jsonc
{
  "version": 3,
  "screen": "แผนการเดินทาง — งานซ่อม",
  "source": "maintainance-yearly/trip-plan.html#repair",
  "root": {
    "kind": "frame",                    // โครง — จาก .shell/.work/.content/.stack
    "layout": { "dir": "vertical", "gap": 12, "padding": [24,24,24,24] },
    "children": [
      {
        "kind": "instance",             // ← ของจริง ไม่ใช่กล่อง
        "component": "Page header",     // ต้องมีใน figma-components.json
        "properties": {
          "Title#1985:6": "แผนการเดินทาง — งานซ่อม",
          "Actions#1985:4": false,
          "Badge#1985:2": false
        },
        "from": ".page-title-row"       // มาจากคลาสไหน — ไว้ไล่ย้อนตอนดีบัก
      },
      {
        "kind": "instance",
        "component": "Alert",
        "properties": { "Color": "Info", "Text#1336:0": "ขอบเขตของต้นแบบรอบนี้…" },
        "from": ".note.note-info"
      },
      { "kind": "text", "characters": "มีรถที่ต้องออกไปซ่อม 6 คัน", "style": "body", "from": ".sub" }
    ]
  }
}
```

**กฎของ spec v3**
- `kind: "instance"` — `component` ต้องมีใน `figma-components.json` · `properties` key ต้องมีใน component นั้น
  (ตัวแปลงเช็คให้ก่อนเขียนไฟล์ ไม่ปล่อยให้ไปพังในปลั๊กอิน)
- `kind: "frame"` — เฉพาะคลาสที่ `figma-map.json` บอกว่า `kind: "layout"`
- `kind: "vector"` — เฉพาะคลาสที่บอกว่า `kind: "own"` (วาดเองตาม computed style เหมือนท่อ B)
- **ห้ามมี hex ใน spec** — สีมาจาก component หรือจาก variable ที่ผูกไว้แล้ว

---

## 3. งานรอบนี้ — นำร่อง 1 หน้า

### ✅ Task 1 — สคริปต์เก็บ DOM ของหน้าแผนเดินทางงานซ่อม (เสร็จ 25 ส.ค. 2569)

`figma-export/flow-repair-trip-extract.js` (ก๊อปโครงจาก `flow-report-extract.js`)

- เปิด `http://127.0.0.1:8123/maintainance-yearly/trip-plan.html#repair`
- `localStorage.clear()` แล้วรีโหลด (ให้ได้สถานะตั้งต้นเสมอ)
- ไล่กดจริง: สร้างใบเดินทาง → ใส่ใบแจ้งซ่อม 3 ใบ → กรอกฟอร์มครบ
- เก็บ **3 state**: `01` ก่อนสร้างใบ · `02` มีใบเปล่า · `03` กรอกครบพร้อมส่ง
- ⚠️ ห้าม `fullPage: true` — ขยาย viewport เท่าความสูงหน้าแทน
- `walkDom()` ต้องเก็บ **`className` เต็ม** ของทุก node (ท่อเดิมเก็บแค่ style)

**ผลจริง:** `out/dom-repair-trip-01..03.json` · **1,512 node · 57 คลาส · ยังไม่มีในแมป 0 ตัว**
สคริปต์เทียบคลาสที่เจอกับ `figma-map.json` ให้เองท้ายการรัน ⇒ รู้ทันทีว่าตกอะไรไหม

จะกลายเป็น instance ของจริง: Pill outline 17 · Text input 15 · Input dropdown 15 ·
Section header 6 · Table header cell 5 · Table cell 5 · Alert 3 · Page header · Breadcrumbs ·
Card item base · Nav button · Header navigation

### ✅ Task 2 — ตัวแปลง DOM → spec v3 (เสร็จ 25 ส.ค. 2569)

`figma-export/7-map-components.js`

1. อ่าน `figma-map.json` + `figma-components.json`
2. เดินต้นไม้ DOM · ต่อ node ดูคลาสแล้วหาว่าตรงกับคีย์ไหนในแมป
   — เทียบจาก **specific → generic** (`.btn.btn-p` ก่อน `.btn`)
3. เจอ `kind: component` → ออก node `instance` + เก็บข้อความจาก `textContent` ใส่ `text` prop
4. เจอ `kind: layout` → ออก `frame` + อ่าน `flex-direction`/`gap`/`padding` จาก computed style
5. เจอ `kind: own` → ออก `vector` (ทางเดิมของท่อ B)
6. **ไม่ตรงอะไรเลย** → เก็บลง `unmapped[]` ท้ายไฟล์ พร้อมชื่อคลาส **ไม่เงียบ**
7. ตรวจ spec กับ `figma-components.json` ก่อนเขียน — property ไม่มีจริง = ไม่เขียนไฟล์

**เสร็จเมื่อ:** `node figma-export/7-map-components.js` ได้ `out/spec-components.json`
และรายงาน `instance กี่ตัว · frame กี่ตัว · unmapped กี่ตัว`

### ✅ Task 3 — ปลั๊กอินสร้างของจริงในไฟล์ Figma (เสร็จ 25 ส.ค. 2569)

`figma-export/component-plugin/` (แยกจาก `plugin/` เดิม ไม่ทับกัน)

- ดึง spec จาก `serve.js`
- หา main component: **ลอง `importComponentByKeyAsync(key)` ก่อน** ถ้าไม่ผ่าน
  **ถอยไปหา instance ในไฟล์แล้ว `clone()`** — ทำสองทางไว้เลย ไม่ต้องรอผลทดสอบ
- `setProperties()` ตาม spec · ตั้ง auto-layout ตาม `layout`
- สร้างในหน้าใหม่ชื่อ `📄 <ชื่อหน้าจอ>` ไม่แตะหน้าอื่น
- รายงานท้ายงาน: สร้าง instance กี่ตัว · ตัวไหนหาไม่เจอ · ใช้วิธีไหน (import/clone)

**เสร็จเมื่อ:** เปิดหน้าใน Figma แล้ว**คลิกที่ Page header/Alert/Table cell แล้ว panel ขวาโชว์ property ให้สลับได้**

### ✅ Task 4 — เทสก่อนให้กดในไฟล์จริง (เสร็จ 25 ส.ค. 2569)

- `test-component-plugin.js` — mock Plugin API ทั้ง 2 ทาง (import ได้ / ถูกบล็อก)
- ตรวจว่า spec ทุก instance อ้าง component + property ที่มีจริง
- **ห้ามส่งให้เจ้าของงานกดก่อนเทสผ่าน** (เคยพลาดมาแล้ว 25 ส.ค. — ส่งไปแล้วเงียบ หาสาเหตุไม่ได้)

---

## 4. เกณฑ์ว่านำร่องสำเร็จ

| # | เกณฑ์ | วัดยังไง |
|---|---|---|
| 1 | หน้าจอขึ้นใน Figma ครบทุกบล็อก | เทียบกับ screenshot ของหน้าจริง |
| 2 | **กดสลับ property ได้** | คลิก Page header → panel ขวามี Title/Badge/Actions |
| 3 | ไม่มี component ที่หาไม่เจอ | รายงานท้ายปลั๊กอิน = 0 |
| 4 | `unmapped` เหลือน้อยและอธิบายได้ | ทุกตัวต้องบอกได้ว่าทำไมไม่แมป |
| 5 | ไม่มีสี hardcode ใน spec | `grep -c '#[0-9a-f]\{6\}' out/spec-components.json` = 0 |

---

## 5. ขยายทุกหน้าหลังนำร่องผ่าน

`figjam-capture.js` มีลิสต์ 25 หน้าอยู่แล้ว ใช้เป็นฐาน · เรียงตามความคุ้ม:

1. `maintainance-yearly/trip-plan.html` ทั้ง 2 สาย (นำร่อง + สายบำรุงรักษา)
2. `mock/Maintenance-Request-Form.html` — โฟลว์แจ้งซ่อม 8 state (ท่อ B ทำไว้แล้ว มี `flow-report-extract.js` ให้ยก)
3. `maintainance-yearly/` ที่เหลือ — `index` · `plan-new` · `confirm` · `supplies`
4. หน้าวิเคราะห์ — `outcome-dashboard` · `parts-insights` · `executive-insights`

**ทำทีละหน้า ดูผลก่อนไปหน้าถัดไป** ไม่รวดเดียว 25 หน้าแล้วค่อยรู้ว่าพัง

---

## 6. ข้อจำกัด/ข้อห้าม ที่ต้องรู้ก่อนลงมือ

- 🚫 **ห้ามรันปลั๊กอินที่เขียนของ ในไฟล์ `PEA` ตัวจริงของทีม** — ต้อง **Duplicate ทั้งไฟล์** ก่อน
  (25 ส.ค. เจ้าของงาน duplicate แค่ *หน้า* ไม่ใช่ *ไฟล์* — แคตตาล็อกจับได้ว่ายังเป็นไฟล์ `PEA`)
- 🚫 **ห้ามรันในไฟล์ไลบรารี** `EXT_PEA_VMS_v1.0.2_Component` — อ่านอย่างเดียว
- 🚫 **ห้าม commit `out/`** — มีเลขเคส/ชื่อคนจากไฟล์งานจริง
- ⚠️ **แพลน starter** — 3 page/ไฟล์ · MCP 20 call/เดือน · publish library ไม่ได้
  (ตรวจ 25 ส.ค.: ที่นั่ง Full เฉพาะทีม starter · org `ODDS` เป็น View)
- ⚠️ ปลั๊กอิน dev ใช้ได้เฉพาะ **Figma desktop app** — บนเว็บไม่มีเมนู Development
- ⚠️ `allowedDomains` ไม่รับ IP literal ⇒ ต้อง `http://localhost:8124` ใน `devAllowedDomains`

---

## 7. ยังค้าง / ต้องเคาะ

- [ ] **ผลทดสอบ import vs clone** — เจ้าของงานตอบ "3ผ่าน" แต่ยังไม่ทราบว่าวิธีไหน
      ⇒ ออกแบบให้ **ลอง import ก่อน ถอยไป clone** จะได้ไม่ต้องรอ
- [ ] `.chip` / `.chips` — ไฟล์งานนี้ไม่มี instance ของ Tag ให้ใช้ ทั้งที่ไลบรารีมี (`1:1378`)
      ⇒ ถ้าจะใช้ ต้องให้ดีไซเนอร์วาง instance ไว้ในไฟล์ก่อน 1 ตัว
- [ ] `.daterange` · `.toast` · `.empty` · `.rzone` — ไลบรารีไม่มีของเทียบ จะวาดเองหรือขอให้ออกแบบเพิ่ม
- [ ] **11 คลาสที่ยังไม่แมป** — ส่วนใหญ่เป็น sub-part ของที่แมปแล้ว ตรวจอีกรอบตอนทำ Task 2


---

## 8. บันทึกผลนำร่อง (25 ส.ค. 2569)

**ท่อเดินครบแล้ว** — `flow-repair-trip-extract.js` → `7-map-components.js` → `component-plugin/`

| ตัวเลข | ค่า |
|---|---|
| DOM ที่เก็บ | 3 state · 1,512 node · 57 คลาส · **ยังไม่มีในแมป 0 ตัว** |
| spec v3 | **instance 278** · frame 398 · text 205 · vector 29 · **ไม่มี hex หลุด** |
| component ที่อ้าง | 12 ตัว — **มีจริงครบ** · property ที่ตั้ง **ถูกทุกตัว** |
| เทส | `test-component-plugin.js` **11/11** (import ได้ / ถูกบล็อก / ไฟล์มีไม่ครบ) |

**กติกาที่ต้องมีถึงจะแปลงถูก — เจอตอนทำจริง**

1. **ตัวในสุดชนะ** — ถ้า node แมปเป็น component ได้แต่ข้างในยังมี component อื่น ให้ยกให้ตัวข้างใน
   ไม่งั้น `.card` จะกลืนทุกอย่าง (เคยเหลือ instance แค่ 33 ตัวจาก 278)
2. **ธง `absorbs`** — ยกเว้นให้ `.tbl td` เพราะ Table cell มี variant `Style=Badge/Action icons`
   รองรับเนื้อในอยู่แล้ว ไม่ควรถูกยก
3. **ข้อความหลักต้องไม่รวมบรรทัดรอง** — `.cell-sub`/`.sub` เป็น property แยก (`Supporting text`)
   ไม่งั้นได้ `"MTD-690716-031แจ้งเมื่อ 16 ก.ค. 2569"` ติดกันเป็นก้อนเดียว
4. **ช่องกรอกอ่านค่าจาก attribute** ไม่ใช่ textContent (`value` → ถ้าว่างใช้ `placeholder`)
