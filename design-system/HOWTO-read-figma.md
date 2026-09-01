# วิธีอ่านไฟล์ Figma โดยไม่ผ่าน MCP — REST API

> คู่กับ [`figma-export/HOWTO.md`](../figma-export/HOWTO.md) ซึ่งเป็นขา **เขียนเข้า** Figma
> ไฟล์นี้คือขา **อ่านออกจาก** Figma · ทะเบียนว่าอ่านอะไรมาแล้วบ้างอยู่ที่ [`SOURCES.md`](SOURCES.md)

---

## 0.1 🔴 แหล่งความจริงใหม่ 2 ไฟล์ (1 ก.ย. 2569) + สคริปต์ที่ใช้ดึง

เจ้าของงานสั่งให้ใช้ **2 ไฟล์นี้เท่านั้น** (ของเดิม `IMiHaWKCqp6j3lpWdCnYY8` เลิกใช้):

| ไฟล์ | file key | หน้า | ใช้ทำอะไร |
|---|---|---|---|
| **(Component) VMS Plus** | `VmOC07pKEsDkHZagOgcSU2` | 55 | คอมโพเนนต์/ไลบรารี — TEMPLATES · NAVIGATION · FORM · FEEDBACK · DISPLAY · MISC |
| **(UI) VMS Plus - Release#2** | `fYD1yA1uzWsJSjHlcWKMNe` | 42 | **หน้าจอจริง** — `UI Screen (Hi-fi Wireframe)` 5.1–5.17 + `Components` + `Sitemap` |

🔑 **ทางหลักคือ "ปลั๊กอิน" ไม่ใช่ REST (เคาะ 1 ก.ย. 2569)**

`GET /v1/files/<key>` ของไฟล์ใหญ่โดน **429 ยาวเป็นชั่วโมง** จนแม้แต่ `?depth=1` ก็ติด ⇒ ดึงทั้งไฟล์ผ่าน REST **ไม่คุ้ม**
ใช้ **`figma-export/dump-plugin/`** แทน — รันในแอป Figma อ่านทุกหน้าทุกโหนดรวดเดียว **ไม่กินโควตา REST เลย**

```bash
node figma-export/serve.js                      # 1) รับไฟล์ที่ปลั๊กอินส่งกลับ (พอร์ต 8124) — รันค้างไว้
# 2) ในแอป Figma: Plugins → Development → Import plugin from manifest → figma-export/dump-plugin/manifest.json
# 3) รันปลั๊กอิน ใส่ชื่อโฟลเดอร์ (component / ui-release2) แล้วกด "เริ่มดัมป์ทั้งไฟล์"
node design-system/figma-dump-import.js         # 4) แปลงผลเข้ารูป .figma-extract/<slug>/ + ทำไฟล์สรุป
FIGMA_SRC=component node design-system/verify-tokens.js   # 5) ตรวจ token เทียบไลบรารีใหม่
```

⚠️ ข้อควรระวังของปลั๊กอินโหมด `dynamic-page`: **ห้ามอ่าน `instance.mainComponent` แบบ sync** (ต้อง `getMainComponentAsync`)
เจอจริง 1 ก.ย. 2569 — หน้าที่มี instance ล้มทั้งหน้า 41/55 · แก้แล้วโดยถอดการอ่านค่านั้นออก

🚫 **token: เลิกใช้แล้ว** — ออกมาใช้ครั้งเดียว 1 ก.ย. 2569 แล้วลบ `~/.figma-token` ทิ้ง (เจ้าของงานสั่งหยุดอ่านผ่าน token)
ถ้าจะกลับมาใช้ REST อีกให้ออก token ใหม่ตามข้อ 2 และ**เริ่มที่ `pull-figma-pages.js` เท่านั้น**

**สคริปต์ในโปรเจกต์ (ใหม่ 1 ก.ย. 2569)**

| ไฟล์ | ทำอะไร |
|---|---|
| `design-system/pull-figma-pages.js` | 🔑 **ตัวหลัก** — ไล่ดึง**ทีละหน้า** ผ่าน `/nodes?ids=` · resume ได้ · เจอ 429 ถอยเป็นขั้นถึง 10 นาที · เก็บทั้งค่าดีไซน์และแคตตาล็อกคอมโพเนนต์ (`00-components.json`) |
| `design-system/figma-extract.js` | ตัวสกัด (เดิมอยู่แต่ในโค้ดบล็อกข้อ 5) — ใช้เป็นโมดูลหรือ CLI ก็ได้ |
| `design-system/pull-figma.js` | ดึง**ทั้งไฟล์รวดเดียว** — เร็วกว่าถ้าโควตาว่าง แต่ไฟล์ใหญ่มัก 429 |
| `design-system/figma-screens.js` | ไล่ดูว่ามีหน้าจอ/เฟรมอะไรบ้างในสิ่งที่ดึงมา |
| `design-system/compare-figma-sources.js` | เทียบชุดใหม่กับไฟล์เก่า — สี · radius · ฟอนต์ · หน้า · คอมโพเนนต์ |

⚠️ **บทเรียน 1 ก.ย. 2569 — `GET /v1/files/<key>` ของไฟล์ใหญ่กิน quota หนักมาก**
ยิงครั้งเดียวแล้วโดน **429 ยาว** จนแม้แต่ `?depth=1` ก็ติดไปด้วยเป็นชั่วโมง
⇒ **ให้เริ่มที่ `pull-figma-pages.js` เสมอ** (ทีละหน้า + ถอยเป็นขั้น + resume ได้) อย่าเพิ่งยิงทั้งไฟล์

---

## 0. อ่านตรงนี้ก่อน — ส่วนใหญ่ไม่ต้องใช้ token เลย

ไลบรารี PEA **ถูกสกัดเก็บไว้ในเครื่องครบแล้วตั้งแต่ 11 ส.ค. 2569** ที่ `design-system/.figma-extract/`
(35 ไฟล์ · 94 MB · ครบทั้ง 43 หน้า) ⇒ งานประจำวันอ่านจากตรงนั้นได้เลย **ไม่ต้องต่อ Figma ไม่ต้องมี token**

```bash
node -e "const d=require('./design-system/.figma-extract/1-1377.json');console.log(d.page, d.sets.length)"
```

```python
import json
d = json.load(open('design-system/.figma-extract/1-1380.json'))   # หน้า Inputs
```

เครื่องมือที่อ่านโฟลเดอร์นี้อยู่แล้ว: `verify-tokens.js` · `compare-figma.js`

**จะต้องออก token ใหม่ก็ต่อเมื่อ** ไลบรารีมีเวอร์ชันใหม่ · ต้องการ node ที่ยังไม่ได้ดึง · หรือเครื่องหาย
(⚠️ โฟลเดอร์นี้อยู่ใน `.gitignore` — **ไม่มี backup** เพราะ repo เป็น public)

---

## 1. ทำไมไม่ใช้ MCP

| | MCP (`mcp__plugin_figma_figma__*`) | REST API |
|---|---|---|
| โควตา | แพลน Starter ~**4 call ต่อรอบ** / **20 call ต่อเดือน** | ดึงทั้งไฟล์จบใน **1 call** |
| ผลลัพธ์ | ต้องไล่ทีละ node | ได้ทั้งไฟล์ทีเดียว 58,331 node |
| เหมาะกับ | ดู node เดียวเร็วๆ / เอาสกรีนช็อต | สกัดทั้งไลบรารีมาวิเคราะห์ |

33 node ที่เจ้าของงานส่งมาให้อ่าน ถ้าไล่ทาง MCP **ไม่มีทางจบ** — จึงเปลี่ยนเป็น REST

---

## 2. ออก token

1. figma.com → มุมขวาบน → **Settings → Security → Personal access tokens → Generate new token**
2. **scope ต้องมี `file_content:read`**
   - ⛔ `library_content:read` / `library_assets:read` **ใช้ไม่ได้** — ตอบ `403`
   - ⛔ `file_variables:read` มีก็ไม่ช่วย ถ้าไม่ใช่แพลน Enterprise (ดูข้อ 6)
3. คัดลอกทันที (โชว์ครั้งเดียว) แล้วเก็บนอก repo:

```bash
printf '%s' 'figd_xxxxxxxxxxxxxxxx' > ~/.figma-token
chmod 600 ~/.figma-token
```

🚫 **ห้าม commit · ห้ามพิมพ์ในแชท · ห้ามใส่ใน `.env` ที่อยู่ใน repo**
เสร็จงานแล้ว **revoke ทิ้ง** (ของเดิม revoke ไปแล้ว 11 ส.ค. 2569)

**เช็คว่า token ใช้ได้:**

```bash
curl -s -H "X-Figma-Token: $(cat ~/.figma-token)" https://api.figma.com/v1/me | head -c 200
```

ได้ JSON ที่มี `email` = ใช้ได้ · ได้ `403` = scope ไม่พอ

---

## 3. หา file key กับ node id จาก URL

```
https://www.figma.com/design/IMiHaWKCqp6j3lpWdCnYY8/EXT_PEA_VMS_v1.0.2_Component?node-id=1-1377
                             └──────── file key ────────┘                                  └ node
```

- **file key** = ช่วงถัดจาก `/design/` (ไฟล์เก่าเป็น `/file/`)
- **node id ใน URL ใช้ `-`** (`1-1377`) แต่ **REST API ต้องใช้ `:`** (`1:1377`) — จุดนี้พลาดกันบ่อย

ไฟล์ที่ใช้อยู่: file key `IMiHaWKCqp6j3lpWdCnYY8` · เวอร์ชัน `EXT-PEA-T0REUY1W-2026-V102` · library name `(Component) VMS Plus`

---

## 4. คำสั่งที่ใช้จริง

### 4.1 ดูรายชื่อหน้าก่อน (เบา — อย่าเพิ่งโหลด 89 MB)

```bash
curl -s -H "X-Figma-Token: $(cat ~/.figma-token)" \
  "https://api.figma.com/v1/files/IMiHaWKCqp6j3lpWdCnYY8?depth=1" \
| node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
    const f=JSON.parse(s); console.log(f.name, '|', f.version);
    f.document.children.forEach(p=>console.log(p.id.padEnd(12), p.name));
  })"
```

`depth=1` = เอาแค่ชั้น page ไม่ลงลูก ⇒ ตอบเร็ว ได้ id ของทุกหน้ามาใช้ต่อ

### 4.2 ดึงทั้งไฟล์ (ที่ทำจริง 11 ส.ค. 2569)

```bash
curl -H "X-Figma-Token: $(cat ~/.figma-token)" \
  "https://api.figma.com/v1/files/IMiHaWKCqp6j3lpWdCnYY8" -o figma-full.json
```

ได้ **89 MB · 43 หน้า · 58,331 node · component 3,304 (component set 176) · style 118**

🚫 **ห้ามเปิดไฟล์นี้เข้า context ของ AI** — เก็บไว้ใน scratchpad แล้ววิเคราะห์ด้วยสคริปต์เท่านั้น

### 4.3 ดึงเฉพาะ node ที่ต้องการ (เร็วกว่ามากถ้ารู้ว่าจะเอาอะไร)

```bash
curl -s -H "X-Figma-Token: $(cat ~/.figma-token)" \
  "https://api.figma.com/v1/files/IMiHaWKCqp6j3lpWdCnYY8/nodes?ids=1:1377,3:20,3:21" \
  -o nodes.json
```

> `ids` คั่นด้วย `,` และต้องเป็นรูปแบบ `1:1377` (ไม่ใช่ `1-1377`)

### 4.4 เอาภาพของ node (ถ้าอยากเห็นหน้าตา ไม่ใช่ค่า)

```bash
curl -s -H "X-Figma-Token: $(cat ~/.figma-token)" \
  "https://api.figma.com/v1/images/IMiHaWKCqp6j3lpWdCnYY8?ids=1:1377&format=svg"
```

ตอบกลับเป็น **URL ชั่วคราวบน S3** ต้อง `curl` ตัวนั้นต่ออีกทีถึงได้ไฟล์จริง
(`format` = `svg` · `png` · `jpg` · `pdf` · ใส่ `scale=2` ได้กับ png/jpg)

---

## 5. สคริปต์สกัดให้เป็นรูปแบบที่โปรเจกต์นี้ใช้

ผลลัพธ์ที่ `verify-tokens.js` / `compare-figma.js` ต้องการมี 2 แบบ

| ไฟล์ | โครง |
|---|---|
| `<node-id>.json` | `{ node, page, sets: [ { name, type, w, h, pl/pr/pt/pb, r, sw, dir, align, fill[], stroke[], kids[] } ] }` |
| `00-summary-colors-radii-fonts.json` | `{ colors: {"#A80689": 2313, …}, radii: {"8": 1234, …}, fonts: {"Google Sans\|14\|600\|20": 99, …} }` |

บันทึกโค้ดข้างล่างเป็น `~/pw/figma-extract.js` แล้วรัน `node ~/pw/figma-extract.js figma-full.json <ปลายทาง>`

```js
#!/usr/bin/env node
/* สกัด figma-full.json → <node-id>.json รายหน้า + 00-summary-colors-radii-fonts.json
   ใช้เมื่อออก token ใหม่แล้วดึงไฟล์มาใหม่ (ดู HOWTO-read-figma.md ข้อ 4.2) */
const fs = require('fs'), path = require('path');
const [src, outDir] = process.argv.slice(2);
if (!src || !outDir) { console.error('ใช้: node figma-extract.js figma-full.json design-system/.figma-extract'); process.exit(1); }
fs.mkdirSync(outDir, { recursive: true });
const file = JSON.parse(fs.readFileSync(src, 'utf8'));

const hex = c => c && '#' + ['r','g','b'].map(k => Math.round(c[k] * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
// คีย์ตัวเลขต้องเขียนแบบ float ของ python (999 → "999.0") ให้ตรงไฟล์ที่สกัดไว้รอบแรก
const fkey = v => Number.isInteger(v) ? v.toFixed(1) : String(v);
const colors = {}, radii = {}, fonts = {};
const bump = (o, k) => { if (k !== undefined && k !== null && k !== '') o[k] = (o[k] || 0) + 1; };

// เก็บเฉพาะคีย์ที่ใช้เทียบจริง — เก็บทั้ง node จะได้ไฟล์ใหญ่เท่าต้นฉบับ
function trim(n) {
  const o = { name: n.name, type: n.type };
  const b = n.absoluteBoundingBox;
  if (b) { o.w = Math.round(b.width); o.h = Math.round(b.height); }
  for (const [k, p] of [['pl','paddingLeft'],['pr','paddingRight'],['pt','paddingTop'],['pb','paddingBottom']])
    if (n[p]) o[k] = n[p];
  if (n.itemSpacing) o.gap = n.itemSpacing;
  if (n.cornerRadius !== undefined) { o.r = n.cornerRadius; bump(radii, fkey(n.cornerRadius)); }
  if (n.rectangleCornerRadii) o.r = n.rectangleCornerRadii;
  if (n.strokeWeight) o.sw = n.strokeWeight;
  if (n.layoutMode && n.layoutMode !== 'NONE') o.dir = n.layoutMode;
  if (n.counterAxisAlignItems) o.align = n.counterAxisAlignItems;

  const pick = arr => (arr || []).filter(p => p.visible !== false && p.type === 'SOLID').map(p => hex(p.color));
  const f = pick(n.fills), s = pick(n.strokes);
  if (f.length) { o.fill = f; f.forEach(h => bump(colors, h)); }
  if (s.length) { o.stroke = s; s.forEach(h => bump(colors, h)); }

  if (n.style) {
    const st = n.style;
    o.font = { fam: st.fontFamily, size: st.fontSize, weight: st.fontWeight, lh: Math.round(st.lineHeightPx || 0) };
    bump(fonts, [st.fontFamily, fkey(st.fontSize), st.fontWeight, Math.round(st.lineHeightPx || 0)].join('|'));
  }
  if (n.characters) o.text = n.characters.slice(0, 80);
  if (n.children && n.children.length) o.kids = n.children.map(trim);
  return o;
}

let n = 0;
for (const page of file.document.children) {
  const out = { node: page.id, page: page.name, sets: (page.children || []).map(trim) };
  fs.writeFileSync(path.join(outDir, page.id.replace(':', '-') + '.json'), JSON.stringify(out));
  n++;
}
fs.writeFileSync(path.join(outDir, '00-summary-colors-radii-fonts.json'),
  JSON.stringify({ colors, radii, fonts }, null, 0));
console.log(`เขียน ${n} หน้า · สี ${Object.keys(colors).length} · radius ${Object.keys(radii).length} · ชุดฟอนต์ ${Object.keys(fonts).length}`);
```

**ตรวจว่าใช้ได้จริง:**

```bash
node design-system/verify-tokens.js
node design-system/compare-figma.js
```

### ✅ สคริปต์นี้เทสแล้ว 14 ส.ค. 2569

รันกับไฟล์ดิบจริง `99-figma-full-raw.json` (93 MB) แล้วเทียบกับผลที่สกัดไว้รอบแรก:

```
เขียน 43 หน้า · สี 142 · radius 43 · ชุดฟอนต์ 49
colors  คีย์ 142 → 142  ✅ ตรงทุกคีย์
radii   คีย์  43 →  43  ✅ ตรงทุกคีย์
fonts   คีย์  49 →  49  ✅ ตรงทุกคีย์
```

แล้วสลับ summary ที่ generate ใหม่เข้าไปแทนของเดิม → `verify-tokens.js` และ `compare-figma.js` **ผ่านทั้งคู่**

**ต่างจากของเดิม 2 จุด (รู้แล้ว ไม่ใช่บั๊ก):**

| จุด | ของเดิม (สกัดด้วย python 11 ส.ค.) | สคริปต์นี้ |
|---|---|---|
| จำนวนไฟล์รายหน้า | 33 ไฟล์ — เฉพาะ node ที่เจ้าของงานระบุ | **43 ไฟล์ — ทุก page ในไฟล์** (รวมปก/หัวหมวด) |
| จำนวนครั้งของ `#FFFFFF` / `#000000` | 5,312 / 143 | 5,366 / **1,029** — ตัวนี้นับ fill สีดำ default ของ text node ด้วย |

สีอื่นทั้ง 140 ตัว **นับตรงกันเป๊ะ** (เช่นแบรนด์ `#A80689` = 2,313 ทั้งสองฝั่ง) ⇒ ไม่กระทบการเทียบ token
ถ้าอยากได้เลขเท่าเดิมจริงๆ ให้ข้าม `fills` ของ node ที่ `type === 'TEXT'` ในฟังก์ชัน `trim`

---

## 6. สิ่งที่ REST API **ทำไม่ได้**

| อยากได้ | สถานะ |
|---|---|
| **ชื่อ Figma Variable จริง** (`GET /v1/files/{key}/variables/local`) | ⛔ **Enterprise เท่านั้น** — แพลนอื่นได้ `403` |
| เขียน/แก้ node ในไฟล์ | ⛔ REST เขียน node ไม่ได้เลย — เขียนได้แค่ comment / dev resource / webhook · ต้องใช้ **Plugin API** (ดู `figma-export/HOWTO.md`) |
| ค่าที่ผูกกับ variable | ได้แค่ **ค่าดิบบน node** (fill/stroke/text style ที่ปรากฏจริง) |

⇒ เพราะข้อนี้ ค่าที่กำกับ `✔` ใน `tokens.css` จึงแปลว่า **"มีใช้จริงในไลบรารี"** ไม่ใช่ *"เป็นชื่อ variable ตามไลบรารี"*

---

## 7. ลำดับความน่าเชื่อถือของแหล่ง (สำคัญ — เปลี่ยน 14 ส.ค. 2569)

```
1. runtime จริง   design-system/.vms-runtime/   ← ระบบที่รันอยู่จริงบน vmsplus-dev
2. Figma library  design-system/.figma-extract/ ← ไฟล์ออกแบบ
3. ถามเจ้าของงาน                                ← ห้ามเดา
```

เจ้าของงานเคาะ 14 ส.ค. 2569 ว่า **ระบบจริงมาก่อน Figma** เพราะเจอว่าสองแหล่งขัดกัน
(ชุดสีเทา: Figma = Untitled UI v2 · ระบบจริง = v1) รายละเอียดอยู่ที่
`docs/superpowers/specs/2026-08-14-vmsplus-runtime-alignment.md`

---

## 8. ข้อห้าม

- 🚫 **ห้ามแก้ไฟล์ Figma ไลบรารี** `EXT_PEA_VMS_v1.0.2_Component` — เจ้าของงานสั่งไว้ ใช้ได้เฉพาะเครื่องมืออ่าน
  (`get_metadata` / `get_design_context` / `get_screenshot` / `search_design_system` / REST `GET`)
- 🚫 **ห้ามเรียก `use_figma`** กับไฟล์นั้น — มันรันสคริปต์แก้ไฟล์ได้
- 🚫 **ห้าม push `.figma-extract/`** ขึ้น repo (public + เป็น GitHub Pages) — เอาโครงไลบรารี PEA ขึ้นไปแล้วเอาคืนยาก
- 🚫 **ห้ามโหลด `figma-full.json` (89 MB) เข้า context** — วิเคราะห์ด้วยสคริปต์เท่านั้น

---

## 9. บทเรียนที่จ่ายค่าเรียนไปแล้ว

- **ค่าที่ "เดาจาก ramp" ผิดจริง** — `--secondary-600` เป็น `#172B85` ไม่ใช่ `#1B4DB1` (คนละสีเลย)
- **สีที่หน้าตาเหมือนแบรนด์อาจไม่ใช่แบรนด์** — `#E134C1` ใช้เฉพาะหน้า Charts ⇒ เป็น **สีข้อมูล** ไม่ใช่สีแบรนด์
  ⇒ ต้องดูว่า**สีนั้นใช้ที่หน้าไหน** ไม่ใช่เดาจากเฉดสี (นี่คือเหตุผลที่ summary เก็บ**จำนวนครั้งที่ใช้**ไว้ด้วย)
- **เอกสารเพี้ยนได้ง่ายกว่าที่คิด** — เคยจับได้ 2 รอบว่าตารางสีใน README ค้างค่าเก่า
  ⇒ เขียนสคริปต์เทียบ hex ในเอกสารกับ `tokens.css` แทนการไล่ดูด้วยตา
