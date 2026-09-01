# Maintain-D prototype — กติกาบังคับ

## 🔴 งาน UI ทุกชิ้น: ต้องทำตาม design system ห้ามคิดเอง

> เจ้าของงานกำหนด **8 ส.ค. 2569:** *"การออกแบบให้อิงจาก design system ด้วย"*
> ย้ำอีกครั้ง **9 ส.ค. 2569:** *"ทำตาม design system ทั้งหมด ห้ามคิดเอง"*

> 🔴 **เจ้าของงานสั่ง 1 ก.ย. 2569 — ตั้งแต่นี้ไป ยึดการออกแบบจาก Figma 2 ไฟล์นี้เท่านั้น**
> | ไฟล์ | file key | ใช้ทำอะไร |
> |---|---|---|
> | **(Component) VMS Plus** | `VmOC07pKEsDkHZagOgcSU2` | คอมโพเนนต์/ไลบรารี (55 หน้า) |
> | **(UI) VMS Plus – Release#2** | `fYD1yA1uzWsJSjHlcWKMNe` | หน้าจอจริง (42 หน้า) |
>
> ไฟล์เก่า `EXT_PEA_VMS_v1.0.2_Component` (`IMiHaWKCqp6j3lpWdCnYY8`) **เลิกใช้** — ค่าที่อ้างจากไฟล์นั้นถือว่าใช้ไม่ได้จนกว่าจะเทียบใหม่
> วิธีดึง: ปลั๊กอิน `figma-export/dump-plugin/` (ไม่ใช่ REST — โดน rate limit) ดู `design-system/HOWTO-read-figma.md` ข้อ 0.1

### 📐 สเต็ปบังคับก่อนออกแบบ/แก้ UI ทุกครั้ง (เพิ่ม 1 ก.ย. 2569 — กันออกแบบผิด)

> ทุกค่าที่ใช้ **ต้องชี้กลับไปที่ Figma 2 ไฟล์ข้างบนได้เสมอ** ถ้าชี้ไม่ได้ = ยังไม่ใช่ของที่ใช้ได้

| # | ทำอะไร | คำสั่ง/ไฟล์ |
|---|---|---|
| 1 | **หาหน้าจอจริงก่อน** ว่าของที่จะทำอยู่หน้าไหนของไฟล์ UI | `node design-system/figma-screens.js ui-release2 "Breakdown"` |
| 2 | **เปิดดูโครงหน้าจอนั้น** ว่าเป็น modal / เต็มหน้า / bottom sheet · มีกี่ section · ปุ่มอะไร | `node design-system/figma-screens.js ui-release2 "<ชื่อหน้า>" --deep` |
| 3 | **หา component ที่ใช้ในหน้านั้นจากไฟล์ Component** แล้วอ่านค่าจริงทีละ variant | `node design-system/figma-screens.js component "<ชื่อ component>" --deep` |
| 4 | **เทียบกับ `components.css`** ว่ามีคลาสนั้นแล้วหรือยัง · ค่าตรงไหม (radius · เส้น · padding · gap · สี · ฟอนต์) | `design-system/components.css` + ตารางหัวข้อ 4 ของ README |
| 5 | ค่าไหนไม่ตรง → **แก้ที่ `components.css`/`tokens.css` ให้ตรงไลบรารี** ไม่ใช่แก้เฉพาะหน้า · ไม่มี token ให้เพิ่ม token ก่อน | — |
| 6 | ของที่**ไม่มีในไลบรารี** → หยุด แล้วถามเจ้าของงานก่อน ห้ามออกแบบเอง | — |
| 7 | แก้ `components.css`/`tokens.css` แล้ว → **บั๊ม `?v=` ทุกหน้า** + เพิ่ม Changelog + แถวตารางหัวข้อ 4 | `design-system/README.md` |
| 8 | **ตรวจก่อนบอกเสร็จ** — token · การใช้งาน · เรนเดอร์จริง | `FIGMA_SRC=component node design-system/verify-tokens.js` · `node design-system/audit-usage.js` · เรนเดอร์ Chrome |
| 9 | เขียนที่มาไว้ในคอมเมนต์ CSS ว่า **มาจาก component ไหน หน้าไหน** (เช่น *"ตาม `Radio text card` ของไฟล์ Component"*) | — |

**ห้ามทำ** — เดาค่าจากหน้าจอที่มีอยู่ · ก๊อปค่าจากไฟล์ Figma เก่า (ลบไปแล้ว) · ออกแบบ component ใหม่เองโดยไม่ถาม · ใช้ค่าที่ไม่มีใน token

**ก่อนแตะ HTML/CSS ใดๆ ต้องอ่าน 4 ไฟล์นี้ก่อนเสมอ — ห้ามเดาจากแพตเทิร์นของหน้าที่มีอยู่**

1. [`design-system/README.md`](design-system/README.md) — กฎบังคับอยู่ที่ **หัวข้อ 0** (มี "ขั้นตอนบังคับก่อนแตะงานออกแบบ" 7 ขั้น) · รายการคอมโพเนนต์อยู่ **หัวข้อ 4**
2. [`design-system/components.css`](design-system/components.css) — คลาสจริงที่มีให้ใช้
3. 🔴 **ค่าจริงจากไลบรารี** — อ่านจาก `design-system/.figma-extract/<slug>/` ที่ดึงมาจาก Figma 2 ไฟล์ข้างบน
   ```bash
   node design-system/figma-screens.js component Checkbox --deep   # ดูสเปกของ component นั้นทีละ variant
   FIGMA_SRC=component node design-system/verify-tokens.js          # ตรวจ token ของเราเทียบไลบรารี
   ```
   > **เจ้าของงานสั่ง 25 ส.ค. 2569:** *"ทุกครั้งของการสร้าง prototype ให้มาอ่านจากของที่เพิ่งโหลดมา"*
   > ⇒ จะทำหน้าจอใหม่ **ต้องเปิดค่าจริงดูก่อน** แล้วเลือกใช้ component ที่ VMS Plus มีจริง
   > ถ้าของที่จะทำ**ไม่มีในไลบรารี** ให้บอกเจ้าของงานก่อน อย่าออกแบบเอง
   > ⚠️ `FIGMA-COMPONENTS.md` · `figma-components.json` · `figma-map.json` **ลบแล้ว 1 ก.ย. 2569** (มาจากไฟล์เก่าคนละไฟล์) — รอสร้างใหม่จาก 2 ไฟล์ปัจจุบัน
4. [`design-system/SOURCES.md`](design-system/SOURCES.md) — **ตารางความครอบคลุม ก–ง**: ของไหนเทียบไลบรารี PEA แล้ว · ของไหนอิง screenshot · ของไหนไลบรารีมีแต่เรายังไม่ทำ (ถ้าจะทำ ให้ยกจาก node ที่ระบุไว้ ห้ามออกแบบเอง)

> 🔴 **เจ้าของงานสั่ง 12 ส.ค. 2569:** *"ทุกครั้งที่จะ design ให้มาอ่านจากไฟล์ design system ก่อน ก่อนจะไปกำหนดแบบนั้น"*
> ⇒ ลำดับคือ **อ่าน → เช็คว่าไลบรารีมีของนี้ไหม → ยกค่าจากไลบรารี → ค่อยเขียนโค้ด** ไม่ใช่เขียนก่อนแล้วมาปรับทีหลัง

**ตรวจ 3 ตัวก่อนบอกว่าเสร็จ** (นอกเหนือจาก grep hex/emoji ด้านล่าง)

```bash
node design-system/verify-tokens.js       # token ทุกค่าตรงไลบรารี + ป้าย ✔/⚠ ตรงความจริง
node design-system/compare-figma.js       # ค่าคอมโพเนนต์เทียบไลบรารีทีละตัว (input/badge/tag/table/…)
node design-system/audit-usage.js [เฟส]   # วิธีใช้: ห้ามนิยาม component ซ้ำในหน้า · ปุ่มต้อง .btn · ไอคอนต้อง .ms
```

**สรุปกฎที่พลาดกันบ่อย**

| ต้อง | ห้าม |
|---|---|
| ใช้คลาสที่มีอยู่แล้วใน `components.css` ก่อนเสมอ | เขียน CSS คอมโพเนนต์ใน `<style>` ของหน้า |
| ของใหม่ → เพิ่มใน `components.css` แล้วค่อยเรียกใช้ | ทำ component เฉพาะหน้าแล้วปล่อยไว้ |
| สีใช้ `var(--…)` · ไม่มี token ให้เพิ่มใน `tokens.css` ก่อน | hardcode hex ในหน้าจอ |
| ไอคอนใช้ `<span class="ms">ชื่อ</span>` (Material Symbols) | emoji แทนไอคอน UI · inline `<svg>` |
| ปุ่มใช้ `.btn` + `.btn-p/.btn-s/.btn-t/...` | เขียนสไตล์ปุ่มเอง |
| light เท่านั้น | `prefers-color-scheme:dark` รายหน้า |

`<style>` ในหน้าเก็บได้เฉพาะสิ่งที่**เป็นของหน้านั้นจริงๆ ใช้ที่อื่นไม่ได้** และต้องมีคอมเมนต์บอกเหตุผล

**แก้ `components.css` หรือ `tokens.css` เมื่อไหร่ → บั๊ม `?v=` ทุกหน้าที่ลิงก์ไฟล์นั้น** แล้วอัปเดตตารางหัวข้อ 4 + Changelog หัวข้อ 8 ของ `design-system/README.md`

**อ่าน `components.css` อย่างเดียวไม่พอ** — มันบอกได้แค่ว่าคลาส*หน้าตายังไง* ตัวที่บอกว่า*ใช้ตอนไหน*
คือตารางหัวข้อ 4 ของ `design-system/README.md` (คอลัมน์ "ใช้เมื่อ") · เคยพลาดเพราะเช็คแค่ว่า
"คลาสนี้มีอยู่ไหม" แล้วหยิบ `.search` (ช่องกรอกในฟอร์ม) ไปใช้เป็นหัวลิสต์ ⇒ ระยะหายไป 0px

**วางคอมโพเนนต์ต่อกันแนวตั้ง → ห่อด้วย `.stack` เสมอ** อย่าพึ่ง margin ของแต่ละตัว (ไม่สม่ำเสมอทั้งระบบ)

**ตรวจก่อนบอกว่าเสร็จ** (ทั้งสองคำสั่งต้องได้ผลว่าง)

```bash
grep -rniE '#[0-9a-f]{3,8}\b' --include='*.html' . \
  | grep -viE '#fff|#000|design-system/|config.*\.js|admin-config|theme-color|/test/|backup'

grep -rnP '[\x{1F300}-\x{1FAFF}]' --include='*.html' --include='*.js' \
  maintainance-yearly/ mock/ daily-record/ *.html | grep -v '/test/' | grep -v backup | grep -vE ':\s*(//|\*|/\*)'
```

## 🔴 แก้ flow ในต้นแบบ → อัปเดตผังในคอมมิตเดียวกัน

`Diagram/01-บำรุงรักษาตามวาระ/` คือ**เจ้าของความจริงของ flow** — หน้าจอห้ามเขียนคำอธิบาย flow ซ้ำ
เปลี่ยนลำดับขั้น/ผู้รับผิดชอบ/เงื่อนไขเมื่อไหร่ ต้องแก้ผัง mermaid + `Diagram/README.md` ในคอมมิตเดียวกัน

ผังต้อง parse ผ่านจริง ไม่ใช่แค่ตาดู:

```bash
# ดู scratchpad ของเซสชัน — โหลด mermaid 11 บน headless Chromium แล้วเรียก parse() + render()
```

## 🔴 push เสร็จ → ไล่อัปเดต `plan.md` ให้ตรงทันที

`plan.md` (รากโปรเจกต์) = บันทึกงานสะสม · `maintainance-yearly/plan.md` = ของโฟลว์บำรุงรักษา
ทั้งคู่มีหัวข้อ **"ค้างอยู่"** ที่ต้องติ๊กปิด/เพิ่มให้ตรงกับของจริงเสมอ

## เทสก่อนบอกว่าเสร็จ

```bash
python3 -m http.server 8123 --bind 127.0.0.1        # ห้ามใช้ file://
node maintainance-yearly/test/skeleton-data.test.js  # โครงข้อมูล skeleton

# ระยะห่างคอมโพเนนต์ — grep จับไม่ได้ ต้องเรนเดอร์แล้ววัด
NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules node design-system/check-spacing.js
```

ขับเบราว์เซอร์ตาม `.claude/skills/verify/SKILL.md` (playwright-core + Chromium ที่ติดเครื่องอยู่แล้ว)
เกณฑ์ขั้นต่ำ: **ไม่มี `pageerror`** · แก้แล้วรีโหลดค่าต้องอยู่ · ลิงก์ทุกอันไม่ 404

## บริบทที่ควรรู้

- static HTML ล้วน ไม่มี build step · state อยู่ใน `localStorage` (คนละ key ต่อโหมด)
- deploy ด้วย GitHub Actions → Pages (`.github/workflows/pages.yml`) ทุก push บน `main`
- โฟลว์บำรุงรักษา = **ออกเลขงาน (หน้าแยก) + stepper 5 เฟส** ไม่ใช่ "6 ช่วง" แบบเอกสารเก่า
