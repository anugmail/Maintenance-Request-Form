# แหล่งที่มาจริงของ Design System — Figma `EXT_PEA_VMS_v1.0.2_Component`

> **ไฟล์นี้คือทะเบียนว่าอะไรอ่านมาจริงแล้ว อะไรยังไม่ได้อ่าน**
> `tokens.css` กำกับที่มารายค่าด้วย `✔` / `⚠` — ไฟล์นี้ตอบระดับ "หน้า/คอมโพเนนต์"
>
> **file key** `IMiHaWKCqp6j3lpWdCnYY8` · เวอร์ชันในไฟล์ `EXT-PEA-T0REUY1W-2026-V102`
> library name `(Component) VMS Plus`
> `libraryKey` `lk-a1ccfdc4fdf188eafdc83f178ae0c2f43346...` (ใช้กับ `search_design_system`)
>
> 🚫 **ห้ามแก้ไฟล์ Figma นี้เด็ดขาด** — เจ้าของงานสั่งไว้ · ใช้ได้เฉพาะเครื่องมืออ่าน
> (`get_metadata` / `get_design_context` / `get_screenshot` / `search_design_system` / REST `GET`)
> **ห้ามเรียก `use_figma`** เพราะรันสคริปต์แก้ไฟล์ได้

## วิธีที่ใช้อ่าน — REST API ไม่ใช่ MCP

> 📘 **ขั้นตอนเต็ม + สคริปต์สกัดที่เทสแล้ว อยู่ที่ [`HOWTO-read-figma.md`](HOWTO-read-figma.md)**
> (ออก token · หา file key/node id · endpoint ที่ใช้ได้/ใช้ไม่ได้ · สคริปต์ generate `.figma-extract/` ใหม่)

MCP ติด rate limit ของแพลน Starter (~4 call ต่อรอบ) ⇒ 33 node ที่เจ้าของงานส่งมาอ่านไม่มีทางจบ
**11 ส.ค. 2569 เปลี่ยนไปใช้ Figma REST API แทน แล้วดึงทั้งไฟล์รวดเดียว**

```bash
curl -H "X-Figma-Token: $(cat ~/.figma-token)" \
  "https://api.figma.com/v1/files/IMiHaWKCqp6j3lpWdCnYY8" -o figma-full.json
```

- token ต้องเป็น personal access token **scope `file_content:read`** (`library_*` ใช้ไม่ได้ — 403)
- ได้มา **89 MB · 43 หน้า · 58,331 node · component 3,304 (component set 176) · style 118**

> 🔑 **token ถูก revoke แล้ว 11 ส.ค. 2569 และ `~/.figma-token` ถูกลบแล้ว — ไม่ต้องใช้อีก**
> เพราะสกัดของที่ต้องใช้ออกมาเก็บไว้ในเครื่องครบแล้ว (ดูหัวข้อถัดไป)
> ถ้าจะขุดเพิ่มในอนาคตต้องออก token ใหม่ที่ figma.com/settings → Security

## ของที่สกัดเก็บไว้แล้ว — `design-system/.figma-extract/` (อยู่ใน `.gitignore`)

| ไฟล์ | เนื้อหา |
|---|---|
| `<node-id>.json` × 33 | **สเปกคอมโพเนนต์รายหน้า** — ขนาด · padding · gap · radius · fill · stroke · เงา · ฟอนต์ ครบทุก variant (รวม 5.1 MB) |
| `00-summary-colors-radii-fonts.json` | สรุปนับ 142 สี · 43 radius · 49 ชุดฟอนต์ |
| `99-figma-full-raw.json` | ไฟล์ดิบ 89 MB เผื่อต้องขุดอย่างอื่น |

🚫 **ไม่ push ขึ้น repo** — `Maintenance-Request-Form` เป็น repo **public** และ deploy เป็น GitHub Pages
เอาโครงไลบรารีของ PEA ขึ้นไปแล้วเอาคืนยาก ⇒ เก็บในเครื่องอย่างเดียว
⚠️ **ผลข้างเคียง: ไม่มี backup** — ถ้าเครื่องหาย ต้องออก token ใหม่แล้วโหลดใหม่

ตัวอย่างการใช้ (ไม่ต้องต่อ Figma):

```python
import json
d = json.load(open('design-system/.figma-extract/1-1380.json'))   # หน้า Inputs
# Input field md/Default/Placeholder → h 44 · padding 14/10 · radius 8 · เส้น 1px #D5D7DA
```

⚠️ `GET /v1/files/{key}/variables/local` **ใช้ไม่ได้ — เป็นฟีเจอร์ Enterprise**
⇒ อ่าน **Figma Variables ตัวจริงไม่ได้** ได้แค่ fill/stroke/text style ที่ปรากฏบน node
ค่าที่กำกับ `✔` จึงหมายถึง "มีใช้จริงในไลบรารี" ไม่ใช่ "เป็นชื่อ variable ตามไลบรารี"

## หน้าทั้ง 43 หน้าในไฟล์ (ดึงมาครบแล้วทุกหน้า)

| หมวด | หน้า |
|---|---|
| ปก/ประกาศ | `0:1` Cover · `269:291760` Terms of Use |
| ❖ BASE COMPONENTS `1:1374` | `1:1375` Buttons · `1:1376` Button groups · `1:1377` Badges · `1:1378` Tags · `1:1379` Dropdowns · `1:1380` Inputs · `1:1382` Toggles · `1:1383` Checkboxes · `589:205480` Checkbox cards · `589:206913` Radio buttons · `1:1384` Radio cards · `1:1385` Avatars · `1:1386` Tooltips · `1:1387` Progress indicators |
| ❖ APPLICATION COMPONENTS `3:2` | `3:4` Page headers · `3:5` Card headers · `3:6` Section headers · `3:8` Application navigation · `3:9` Modals · `3:11` Charts · `3:12` Metrics · `3:13` Slideout menus · `3:15` Pagination · `3:16` Progress steps · `3:19` Tabs · `3:20` Tables · `3:21` Breadcrumbs · `3:22` Alerts & notifications · `3:23` Date pickers · `3:25` File upload · `3:26` Content dividers · `3:27` Loading indicators · `3:29` Empty states |
| ❖ SHARED ASSETS `585:205477` | `1:1393` 404 pages · `1:1396` Background elements |

> ครบทุก node ที่เจ้าของงานส่งมา **บวก** `1:1376` Button groups กับ `3:20` Tables ที่ไม่ได้อยู่ในลิสต์
> (เจ้าของงานข้ามไป — แต่ดึงมาแล้วเพราะโหลดทั้งไฟล์)

## สกัดมาได้อะไรบ้าง

| ชนิด | จำนวนที่นับได้ทั้งไฟล์ | เอามาลง `tokens.css` แล้วหรือยัง |
|---|---|---|
| สี (hex ที่ใช้จริง) | **142** | ✅ เทียบครบ → `tokens.css` v0.3 · เพิ่มรอบ 12 ส.ค.: `--success-200` แก้เป็น `#ABEFC6` · `--error-300` `#FDA29B` ใหม่ |
| radius | **43** | ✅ เทียบแล้ว 12 ส.ค. — ตัวใช้หนักของไลบรารี 9999/6/8/4/12 ⇒ เพิ่ม `--rounded-sm:6px` · เลิกใช้ 10px ที่ไม่มีในสเกล (input r10→8) |
| ชุด typography (family/size/weight/line-height) | **49** | ✅ เทียบแล้ว 12 ส.ค. — แกนจริงคือ 14/20 · 16/24 · 12/18 ⇒ `--fs-body/sm/xs` จูนเป็น 16/14/12 + กวาดขนาดเศษ (13.5 ฯลฯ) ทิ้งทั้งโปรเจ็ค |

### สิ่งที่การเทียบสีรอบ 11 ส.ค. จับผิดได้ (`tokens.css` v0.2 → v0.3)

| token | เคยเป็น | ของจริง |
|---|---|---|
| `--secondary-600` | `#1B4DB1` | **`#172B85`** — ผิดคนละสีเลย |
| `--brand-50` | `#FEEBFB` | **`#FDEEFC`** |
| `--brand-25` | `#FFF5FD` | **`#FDF2FA`** |
| `--brand-200` | (ค่าเดิมไม่ตรง) | **`#F8BFF4`** |
| `--brand-100` | ไม่มี | **`#FBD9F9`** เพิ่มใหม่ |
| `--success-700` / `--success-500` / `--success-100` | ไม่มี | **`#067647` / `#079455` / `#DCFAE6`** เพิ่มใหม่ |
| `--chart-1..6` | ไม่มี | เพิ่มชุดสีกราฟจากหน้า `3:11` Charts |

> `#E134C1` ที่เกือบเข้าใจผิดว่าเป็นสี brand — ตรวจแล้วพบว่าใช้เฉพาะหน้า Charts ⇒ เป็น**สีข้อมูล ไม่ใช่สีแบรนด์**
> `#067647` ที่ค้างเป็น hex ดิบใน `buttons.html` — ตรวจแล้วพบว่ามีใช้จริง 107 จุดในไลบรารี ⇒ ตั้งเป็น `--success-700` แล้วเปลี่ยนมาเรียก token

**สถานะ provenance ปัจจุบันใน `tokens.css`: `✔` 40 · `⚠` 6**
6 ตัวที่ยัง `⚠` = **ไม่มีในไลบรารี** (เราเพิ่มเอง): `--brand-700` · `--brand-accent` · `--success-200` · `--info-25` · `--secondary-700` · `--secondary-50`

## 🗺️ ตารางความครอบคลุม — ของเราตรงกับไลบรารีแค่ไหน (12 ส.ค. 2569)

> ตอบคำถามเจ้าของงาน *"ในไฟล์ component และ token เป็นของที่ตรงกับดีไซน์ที่ไปดึงมาหรือยัง"*
> **token: ตรวจครบ 66 ค่าแล้วด้วยเครื่อง** (`node design-system/verify-tokens.js` — สี 52 · radius 6 · ฟอนต์ 8)
> ผลคือทุกค่าที่กำกับ `✔` มีใช้จริงในไลบรารี และทุกค่าที่ไม่มีในไลบรารีถูกกำกับ `⚠` ครบ ไม่มีตัวไหนอ้างลอยๆ

### ก. เทียบไลบรารีแล้ว ตรงทุกค่า ✅

| ของเรา | ไลบรารี (node) |
|---|---|
| `.btn` + hierarchy/size ทั้งชุด | Buttons `1:1375` |
| `.badge` `.b-ok/.b-low/.b-out/.b-brand` | Badge `1:1377` (Pill color) |
| `.chip` · `.chips.pick` | Tag + Tag checkbox `1:1378` |
| `.f .in input/select` · `.f textarea` · `.numfld` | Input field · Select · Textarea `1:1380` `1:1379` |
| `.tbl` `.tblwrap` | Table / Table header cell / Table cell `3:20` |
| `.chk` + `input[type=checkbox]` | Checkbox `1:1383` |
| `.rads` + `input[type=radio]` | Radio button `589:206913` |
| `.crumbs` | Breadcrumbs `3:21` |
| `.cal-day` | `_Calendar cell` `3:23` |
| `.seg` `.sg` | Button group `1:1376` |

### ข. ไลบรารีมีของชื่อคล้าย แต่เป็นคนละแพตเทิร์น → **ยึด screenshot หน้าจริง VMS Plus**

| ของเรา | ไลบรารีที่ชื่อคล้าย | ทำไมไม่ใช้ |
|---|---|---|
| `.shell` `.side` `.nv` `.topbar` | Application navigation `3:8` | ของไลบรารีเป็น slide-out มือถือ 375px มี overlay · หน้าจริงเป็นแถบไอคอน 96px |
| `.wsteps` `.wstep` | Progress steps `3:16` | ไลบรารีเป็นวงกลม+เส้นต่อ · หน้าจริง VMS Plus เป็นกล่อง chevron |
| `.page-title(-row)` | Page header `3:4` · `.sect` → Section header `3:6` | โครงคนละแบบ (ของเราเป็นหัวหน้าเดี่ยว) |
| `.card` | Card header `3:5` | ของไลบรารีคือ "หัวการ์ด" มี divider + actions ไม่ใช่กล่องการ์ดทั้งใบ |
| `.empty` | Empty state `3:29` | ของไลบรารีเป็นบล็อกภาพประกอบ 512px · ของเราเป็นบรรทัดเดียวในลิสต์ |
| `.toast` | Notification `3:22` | ของไลบรารีเป็นการ์ด 400px มุมจอ · ของเราเป็นแถบกลางจอชั่วคราว |

### ค. ของเราเอง ไลบรารีไม่มีให้เทียบ

`.job` `.my-accordion` · `.rzone*` · `.stack` · `.gallery/.gcard/.gframe` · `.daterange` + แผง `.cal` ทั้งแผง ·
`.tile` `.decision-tiles-*` · `.veh` `.vlist` · `.qty` · `.tl` · `.filter-field/.filter-empty` · `.search` · `.draft` ·
`.app` `.steps` `.footer` (ชุด mobile legacy)

### ง. ไลบรารีมี แต่เรายังไม่ได้ทำ — **ถ้าจะทำเมื่อไหร่ ให้ยกจาก node นี้ ห้ามออกแบบเอง**

Modal `3:9` · Toggle `1:1382` · Avatar `1:1385` · Tooltip `1:1386` · Tabs `3:19` · Pagination `3:15` ·
File upload `3:25` · Content divider `3:26` · Loading indicator `3:27` · Progress bar/circle `1:1387` ·
Slide out menu `3:13` · Metric item `3:12` · Checkbox card `589:205480` · Radio card `1:1384` ·
Dropdown menu `1:1379` · Alert `3:22` · Card header `3:5`

## คอมโพเนนต์ — เทียบแล้ว 12 ส.ค. 2569 (`compare-figma.js`)

รันซ้ำได้เอง: `node design-system/compare-figma.js` (อ่าน `.figma-extract/` ล้วน ไม่ต่อ Figma)

| ส่วน | สถานะ |
|---|---|
| ปุ่ม (`.btn` ทุก variant) | ✅ ตรงกับไลบรารี — ดึงครบ 636 variants (7 ส.ค.) |
| สี · radius · typography | ✅ เทียบครบ (11–12 ส.ค.) |
| ช่องกรอก · select · textarea · badge · tag/chip · table · checkbox · radio · breadcrumb · วันในปฏิทิน | ✅ **เทียบ+จูนตรงไลบรารีแล้ว 12 ส.ค.** — diff ที่เจอและแก้: input 46→44/r10→8/+shadow-xs · label 600→500 · error border 500→300 · badge ไม่มีขอบ→มีขอบโทน 200 + ตัวโทน 700 · chip pill→Tag r6 · ตาราง หัว gray-50→ขาว 12/600 · checkbox 17→20 ฯลฯ (รายละเอียดใน README §8 v0.12) |
| modal | ⚠️ 13 ส.ค. 2569 เพิ่ม `.modal-overlay`/`.modal` แล้ว (ปุ่ม "รับซ่อม" หน้า กบค.) · 13 ส.ค. 2569 เพิ่ม `.modal-foot` (แถวปุ่ม action ในโมดัล "ส่งกลับ/ปฏิเสธ") แต่เครื่องที่เขียนไม่มี `.figma-extract/` ให้ดึงมาเทียบ — ค่ายังไม่ผ่าน `compare-figma.js` เทียบกับ `3:9` ต้องรันซ้ำเมื่อมีเครื่องที่ดึงข้อมูลได้ |
| progress steps (`.wsteps` ลูกศร chevron) · `.sect` · `.page-title` · `.shell` | ⚠️ อิง **screenshot หน้าจริง VMS Plus** — ไลบรารี `3:16` เป็นสไตล์ Untitled UI คนละแบบกับหน้าจริง จึงคงตาม screenshot |

`componentKey` ที่ได้จาก `search_design_system` (คำว่า "input" 11 ส.ค.) — ใช้ import ได้ถ้าต้องการเทียบละเอียด

| คอมโพเนนต์ | `componentKey` | ของเราตอนนี้ |
|---|---|---|
| Text input | `227eddb9d08b3e8307addc76e56ddb4e2087a671` | `.f .in` |
| Number input | `9e533c842111aa06905876fadf2ea287e6ed603a` | `.numfld` / `.qty` |
| Input label | `01dfbf5c3f94ae7771b1c77278823c7308ee2f02` | `.f label` |
| Input dropdown | `a51d3b07ab3c996ac459710124a5ee2ff1cf31e7` | `<select>` ใน `.in` |
| Input dropdown with badges | `8c56d38a5c678080d722ced688f29262ee122a96` | ยังไม่มีของเทียบ |
| Text area | `9237413644d6ed5849f10756c7bed857b2a09c12` | `.f textarea` |
| Modal | `f30e79daef79f0b2fa1dd3bd5a6d81fe08d85dde` | **ไม่มีในระบบเรา** |
| Modal_Body | `2499a59d53ff2de3c60cfcd9c8318896c4fb4226` | ไม่มี |

มี **`Specs - …`** ของแต่ละตัวด้วย (`Specs - Text input`, `Specs - Input label`, `Specs - Number input`, `Specs - Input dropdown`) — หน้าสเปกที่บอกขนาด/ระยะ/สถานะ **เป็นของที่มีค่าที่สุดสำหรับงานเทียบ**

## งานที่ค้างอยู่ (เรียงตามความคุ้ม)

1. ~~เทียบ radius + typography~~ — ✅ เสร็จ 12 ส.ค. (ดูตารางบน)
2. ~~เทียบช่องกรอก/dropdown/table~~ — ✅ เสร็จ 12 ส.ค. · **modal ยังไม่มีในระบบเรา** ถ้าเพิ่มให้อิง `3:9`
3. **Date pickers `3:23`** — จูน `_Calendar cell` แล้ว (วัน 40px กลม) · โครงแผง `.cal` ทั้งแผงยังเป็นของเรา ถ้าจะเทียบละเอียดใช้ `Date picker modal`
4. ~~Progress steps `3:16`~~ — ตัดสินใจคงตาม screenshot หน้าจริง (สไตล์ chevron ของ VMS Plus ไม่ใช่แบบไลบรารี)

## ข้อจำกัดที่ต้องรู้

- **REST API แก้ปัญหา rate limit ได้แล้ว** — ไม่ต้องพึ่ง MCP สำหรับงานอ่านค่าอีก · แต่ตอนนี้ **token revoke แล้ว** ⇒ ใช้ของที่สกัดไว้ใน `.figma-extract/` แทน ไม่ต้องต่อ Figma
- **`/variables/local` เป็น Enterprise-only** ⇒ อ่านชื่อ Figma Variable ไม่ได้ ได้แต่ค่าดิบบน node
- `get_metadata` ที่ไม่ใส่ `nodeId` คืนแค่หน้า `Cover` — MCP มองไม่เห็นรายชื่อหน้า (REST เห็นครบ)
- `get_variable_defs` ใช้ไม่ได้ถ้าไม่ได้เลือก layer ในแอป Figma desktop
- ไฟล์นี้เป็น **ไลบรารีคอมโพเนนต์ ไม่มีแบบหน้าจอ (screen)** — เทียบ layout ทั้งหน้าไม่ได้ ต้องขอลิงก์ไฟล์อื่น
