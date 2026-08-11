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
| สี (hex ที่ใช้จริง) | **142** | ✅ เทียบครบ → `tokens.css` v0.3 |
| radius | **43** | ⬜ **ยังไม่เทียบ** |
| ชุด typography (family/size/weight/line-height) | **49** | ⬜ **ยังไม่เทียบ** |

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

## คอมโพเนนต์ — ยังไม่เทียบ

ดึง JSON มาครบแล้ว แต่**ยังไม่ได้เอาโครง/ระยะ/สถานะของแต่ละคอมโพเนนต์มาเทียบกับ `components.css`**

| ส่วน | สถานะ |
|---|---|
| ปุ่ม (`.btn` ทุก variant) | ✅ ตรงกับไลบรารี — ดึงครบ 636 variants (7 ส.ค.) |
| สี | ✅ เทียบครบทั้งไฟล์ (11 ส.ค.) |
| radius · typography | ⚠️ **มีข้อมูลแล้วแต่ยังไม่เทียบ** — อยู่ใน `.figma-extract/00-summary-colors-radii-fonts.json` |
| ช่องกรอก · dropdown · textarea · modal · badge · tag · table · date picker · progress steps | ❌ **ประกอบเอง ยังไม่เคยเทียบกับไลบรารี** ทั้งที่มีหน้าอยู่ในไฟล์แล้ว |

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

1. **เทียบ radius 43 ค่า + typography 49 ชุด** กับ `tokens.css` — ข้อมูลมีแล้วใน `.figma-extract/00-summary-colors-radii-fonts.json` เหลือแค่เทียบ
2. **เทียบช่องกรอก/dropdown/table/modal** กับหน้า `1:1380` · `1:1379` · `3:20` · `3:9` — ส่วนที่ประกอบเองล้วน เสี่ยงผิดที่สุด
3. **Date pickers `3:23`** — `.daterange`/`.cal` เราออกแบบเองทั้งหมด ยังไม่รู้ว่าไลบรารีทำไว้ยังไง
4. **Progress steps `3:16`** — เทียบกับ `.wsteps`/`.wstep`

## ข้อจำกัดที่ต้องรู้

- **REST API แก้ปัญหา rate limit ได้แล้ว** — ไม่ต้องพึ่ง MCP สำหรับงานอ่านค่าอีก · แต่ตอนนี้ **token revoke แล้ว** ⇒ ใช้ของที่สกัดไว้ใน `.figma-extract/` แทน ไม่ต้องต่อ Figma
- **`/variables/local` เป็น Enterprise-only** ⇒ อ่านชื่อ Figma Variable ไม่ได้ ได้แต่ค่าดิบบน node
- `get_metadata` ที่ไม่ใส่ `nodeId` คืนแค่หน้า `Cover` — MCP มองไม่เห็นรายชื่อหน้า (REST เห็นครบ)
- `get_variable_defs` ใช้ไม่ได้ถ้าไม่ได้เลือก layer ในแอป Figma desktop
- ไฟล์นี้เป็น **ไลบรารีคอมโพเนนต์ ไม่มีแบบหน้าจอ (screen)** — เทียบ layout ทั้งหน้าไม่ได้ ต้องขอลิงก์ไฟล์อื่น
