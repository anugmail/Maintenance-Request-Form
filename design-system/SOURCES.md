# แหล่งที่มาจริงของ Design System — Figma 2 ไฟล์เท่านั้น

> 🔴 **เจ้าของงานสั่ง 1 ก.ย. 2569: ยึดการออกแบบจาก 2 ไฟล์นี้เท่านั้น**
> ของเก่าทั้งหมด (ไฟล์ `EXT_PEA_VMS_v1.0.2_Component` · แคตตาล็อกจากไฟล์ `PEA` · แผนที่คลาสที่ทำจากของพวกนั้น)
> **ลบออกจากเครื่องและจากรีโปแล้ว** เพื่อไม่ให้สับสน

| # | ไฟล์ | file key | มีอะไร | สถานะ |
|---|---|---|---|---|
| 1 | **(Component) VMS Plus** | `VmOC07pKEsDkHZagOgcSU2` | ไลบรารีคอมโพเนนต์ 55 หน้า | ✅ ดึงครบ 55/55 (16 MB · 139 component set) |
| 2 | **(UI) VMS Plus – Release#2** | `fYD1yA1uzWsJSjHlcWKMNe` | **หน้าจอจริง** 42 หน้า (5.1–5.17) | ⏳ ยังไม่ได้ดึง |

โครงหน้าไฟล์ 1: `TEMPLATES` (Page/Section/Table headers · Dashboard · Side panel · Modals · Cards · Bottom sheets) ·
`NAVIGATION` (Breadcrumbs · Header navigation · Pagination · Sidebar navigation · Progress steps · Tabs) ·
`FORM` (Button · Checkbox · Dropdowns · Inputs · Radio button · File upload · Toggle · Date picker · Rating) ·
`FEEDBACK` (Alerts · Badge · Metrics · Notifications · Toast · Tooltips) ·
`DISPLAY` (Avatar · List · Table) · `MISCELLANEOUS` (Background overlay · Content divider · Featured icon · Images · Progress bar · Scrollbar) · `Icons` · `Grid layouts`

โครงหน้าไฟล์ 2: `UI Screen (Hi-fi Wireframe)` → 5.1 Rental Contract · 5.2 Vehicle Management · **5.3 Vehicle Breakdown (Admin)** ·
5.4 Maintenance Appointment · **5.5 Repair & Maintenance Job** · 5.6 Replacement Vehicle · 5.7 Accident · 5.8–5.11 EV ·
5.13–5.15 ค่าใช้จ่าย · **5.4–5.6 Maintenance (Driver)** · **5.3/5.5/5.6 Vehicle Breakdown (User, Driver)** · 5.16 Reports · 5.17 Department Admin · `Components` · `Sitemap`

---

## วิธีดึง — ใช้ปลั๊กอิน ไม่ใช่ REST

REST `GET /v1/files/<key>` ของไฟล์ใหญ่โดน **429 ยาวเป็นชั่วโมง** (เจอจริง 1 ก.ย. 2569) ⇒ อ่านจากในแอปด้วยปลั๊กอินแทน ไม่กินโควตาเลย

```bash
node figma-export/serve.js                       # 1) ตัวรับไฟล์ พอร์ต 8124 — รันค้างไว้
# 2) Figma → Plugins → Development → Import plugin from manifest → figma-export/dump-plugin/manifest.json
# 3) รันปลั๊กอิน ใส่ slug (component / ui-release2) → กด "เริ่มดัมป์ทั้งไฟล์"
node design-system/figma-dump-import.js          # 4) แปลงเข้ารูป .figma-extract/<slug>/ + ไฟล์สรุป
FIGMA_SRC=component node design-system/verify-tokens.js         # 5) ตรวจ token เทียบไลบรารี
node design-system/figma-screens.js component Checkbox --deep   # ไล่ดูรายหน้า
```

⚠️ กับดักที่เจอมาแล้ว
- ไฟล์ **view-only จะไม่มีเมนู Plugins** — ต้องขอสิทธิ์ edit หรือ duplicate ไฟล์
- ปลั๊กอินโหมด `dynamic-page` **ห้ามอ่าน `instance.mainComponent` แบบ sync** (ต้อง `getMainComponentAsync`) ไม่งั้นหน้าที่มี instance ล้มทั้งหน้า

## ของที่มีในเครื่องตอนนี้ — `design-system/.figma-extract/` (อยู่ใน `.gitignore`)

| ไฟล์ | เนื้อหา |
|---|---|
| `component/<page-id>.json` × 55 | ค่าดีไซน์รายหน้า — ขนาด · padding · gap · radius · เส้น · สี · ฟอนต์ · variant · property |
| `component/00-pages.json` | รายชื่อหน้าทั้งหมด |
| `component/00-summary-colors-radii-fonts.json` | นับ **สี 160 · radius 13 · ชุดฟอนต์ 44** ทั้งไฟล์ |
| `component/00-components.json` | แคตตาล็อก component set + variant + property (ถอดค่าข้อความจริงทิ้งแล้ว) |

🚫 ไม่ push ขึ้น repo (repo public + เป็นโครงไลบรารีของ กฟภ.) · ⚠️ ไม่มี backup — เครื่องหายต้องรันปลั๊กอินใหม่

## ไฟล์ใหม่ต่างจากของเก่ายังไง (เทียบไว้ก่อนลบของเก่า 1 ก.ย. 2569)

| เรื่อง | ของเก่า (เลิกใช้/ลบแล้ว) | **ไฟล์ใหม่** |
|---|---|---|
| ฟอนต์ | Google Sans | **Inter (ละติน) + IBM Plex Sans Thai (ไทย)** — ตรงกับที่เราใช้อยู่ |
| หน้าที่ไม่มีแล้ว | Tags · Checkboxes · Checkbox cards · Radio cards · Button groups · Charts · Card headers · Application navigation · Progress indicators · Slideout menus · Alerts & notifications · Loading indicators · Empty states | — |
| สี | 142 ค่า | **160 ค่า** · ร่วมกันแค่ 37 · magenta `#A80689` ยังเป็นสีหลัก (4,241 ครั้ง) · มีสีใหม่ เช่น `#851F41` (4,753) · `#0D69D4` · `#C54600` |

## ค่าที่อ่านมาแล้วจากไลบรารีใหม่ (อ้างอิงได้เลย)

| component | สเปกจริง |
|---|---|
| **Checkbox** | 20×20 · **r4** · เส้น **2px** `#D0D5DD` · ติ๊ก = พื้น `#A80689` + ไอคอน check เต็ม 20 · disabled พื้น `#EAECF0` · มี state Indeterminate |
| **Radio button** | 20×20 กลม · เส้น **2px** `#D0D5DD` · เลือก = พื้น `#A80689` + จุดใน **8×8** ขาว · disabled พื้น `#EAECF0` |
| **Radio text card** | **r8** · เส้น 1px `#D0D5DD` · **เลือก = เส้น 2px `#A80689` พื้นยังขาว** · hover เส้น `#CF07AA` · padding 16 · gap 16 (radio↔ข้อความ 12) |
| **Radio card** (มีรูป) | r16 · เส้น 1px `#EAECF0` · เลือก = 2px `#A80689` · padding 16 · gap 16 |
| **Table cell** | สูง **56** · padding **ซ้าย-ขวา 16 / บน-ล่าง 8** · gap 12 · เส้นล่าง `#EAECF0` · แถวสลับสี `#F9FAFB` · variant Text/Lead text/Avatar/Badge/Action icons |
| **Sort icon** | 20×20 · Swap / Up / Down |
| **Mobile table item** | การ์ด r8 · เส้น `#D0D5DD` |

## งานค้าง

- [ ] ดึงไฟล์ **(UI) VMS Plus – Release#2** ด้วยปลั๊กอิน (slug `ui-release2`)
- [ ] สร้าง `figma-components.json` + แผนที่คลาส↔component **ใหม่จาก 2 ไฟล์นี้** (ของเดิมลบทิ้งแล้วเพราะมาจากไฟล์อื่น)
- [ ] ไล่แก้ `tokens.css` / `components.css` ให้ตรงไลบรารีใหม่ (สี 14 token ที่หายไป · radius · เส้น 2px ของ checkbox/radio)
- [ ] สคริปต์ที่ยังผูกกับแคตตาล็อกเก่า **ใช้ไม่ได้จนกว่าจะสร้างใหม่**: `figma-export/5-catalog-summary.js` · `6-validate-map.js` · `7-map-components.js`
