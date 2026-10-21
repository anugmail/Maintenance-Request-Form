# figma-export — ส่งหน้าจอจาก HTML prototype เข้า Figma / FigJam

> 📘 **จะลงมือทำ → อ่าน [`HOWTO.md`](HOWTO.md)** (ขั้นตอนทีละขั้น ตั้งแต่ติดตั้งจนกดปุ่มในไฟล์จริง + ตารางแก้ปัญหา)
> ไฟล์นี้เป็น**อ้างอิง** — ทำไมออกแบบแบบนี้ · โครงสเปก · ข้อจำกัดทั้งหมด

> **ทางหลักตอนนี้ (เจ้าของงานเคาะ 12 ส.ค. 2569): บอร์ด FigJam แบบ capture** — ดูหัวข้อ "FigJam board" ข้างล่าง
> ท่อ Figma design (frame/auto-layout/Variables/component) กลับมาใช้ 12 ส.ค. กับ **โฟลว์แจ้งซ่อมฝั่งผู้แจ้ง**
> (`spec-report.json` — 8 state ของ wizard ดูหัวข้อถัดไป) · สเปกชุด yearly เดิมยังอยู่ครบ:
> 4 หน้าจอ + ไอคอน SVG + **Variables 99 ตัวจาก `tokens.css`** + **component + instance**
> (`plan-skeleton` พักตามคำสั่ง 11 ส.ค. · `admin` ตัดออกเพราะใหญ่เกิน 3,770 node)
>
> **สองท่อนี้แยกไฟล์กันเด็ดขาด ไม่ทับกัน:** ท่อ FigJam ใช้ `board.json` + `figjam-plugin/` ·
> ท่อ design ใช้ `spec.json` / `spec-report.json` + `plugin/` — `serve.js` ตัวเดียวเสิร์ฟทั้งหมด

## ปลั๊กอินสร้างจอจาก component จริง — แยกเรื่องละปลั๊กอิน (20 ต.ค. 2569)

| เรื่อง | ปลั๊กอิน | หน้าใน Figma · ชื่อเฟรม | ตารางจับคู่ | เทส |
|---|---|---|---|---|
| Overhaul v2 (14 scenario · 61 จอ ต่ออุปกรณ์ · **ฉบับหลัง PO confirm ทุกหน้า 21 ต.ค. 2569** — ไอคอนจัดการ R21 · คอลัมน์ใหม่หน้า 1–5 · ชื่อสถานะ · toast ตาม `TOASTS` · validation ไฟล์ · **จอที่เจ้าของงานส่งข้อความจาก Figma มาเป็นหลัก (R23: S7/S13 นัดหมาย · S9 ความคืบหน้า)**) — **2 ปุ่ม "สร้าง Desktop" / "สร้าง Mobile"** (เจ้าของงานสั่งแยก 21 ต.ค.) | `overhaul2-plugin/` (code.js ไฟล์เดียว · ปุ่มทั้งหมด 5: Desktop · Mobile · toast · notification · เช็ค) | `overhaul-desktop-N` / `overhaul-mobile-N` (หน้าใหม่ทุกครั้ง) · `OH2 / …` | mapping CF: `Diagram/01-บำรุงรักษาตามวาระ/17-…` (หน้า 1) + `19-overhaul-cf-หน้า2-5-toast-mapping.md` · `overhaul-v2-component-map.md` (ยังฉบับ 19 ต.ค.) | `node figma-export/test-overhaul2-plugin.js` |
| Overhaul v2 · **Dashboard งาน Overhaul** (แท็บ แผน · รถหลัง Overhaul · ซ่อมหลัง Overhaul · อะไหล่ + หน้ารายคัน · แต่ละบล็อก "เฟส 1" + "เป้าหมาย" · 12 จอ × 2) — ปุ่ม "สร้าง Dashboard" (21 ต.ค. 2569 · กติกา R22 โครง MA Overview) | `overhaul2-plugin/` (`metric()` `tabs()` `dashShell()` `dashList()` · `DASH_SCENARIOS`) | `overhaul-dash-1` · `OH2 / A.1 · DASH แผน — …` | เอกสารคอลัมน์ `Diagram/01-บำรุงรักษาตามวาระ/20-overhaul-dashboard-หลัง-overhaul.md` | `MODE=build-dash FIRST='DASH แผน' node figma-export/test-overhaul2-plugin.js` |
| Overhaul v2 · **สร้างเฉพาะ scenario ที่เลือก** (ติ๊ก A–O + เลือก Desktop/Mobile/ทั้งคู่ · รหัสตัวอักษรคงเดิม · หน้า `overhaul-sel-N` หรือต่อท้ายหน้าที่เปิดอยู่ — เจ้าของงานสั่ง 21 ต.ค. "ลอง generate หน้านัดหมายแบบใหม่ออกมา") | `overhaul2-plugin/` (`buildPick()` · ui รับรายชื่อ scenario จาก code.js ตอนเปิด) | `overhaul-sel-1` · `OH2 / H.1 · S7 — …` | — | `MODE=build-pick PICK=7,13 DEVICES=both FIRST='S7' node figma-export/test-overhaul2-plugin.js` |
| Overhaul v2 · **แก้บนหน้าเดิมที่มีของแก้มือ** — ปุ่ม "อัปเดตจอที่เลือกเป็นฉบับ CF" (แทนที่เฉพาะเฟรมที่เลือก ตำแหน่ง/ชื่อเดิม + state ใหม่ต่อท้ายแถว · state ที่ตัดติดป้าย ไม่ลบ) · ปุ่ม "แก้คำ/ไอคอนทุกจอ" (property อย่างเดียว) · checkbox "วางต่อท้ายหน้าที่เปิดอยู่" (21 ต.ค. 2569) | `overhaul2-plugin/` (`updateSelected()` `addNewStates()` `patchTexts()` `parseFrameName()` `matchState()` · `o.here` ใน `buildSet`) | หน้าที่ผู้ใช้เปิดอยู่ (รู้จักชื่อเฟรมทั้งแบบ 19 ต.ค. และแบบ R19) | — | `MODE=patch CODE=<code.js เก่า จาก git show> PATCH=update-selected SELECT=all` · `SELECT='S9 —' CHECK_ONLY='S9 —'` · `PATCH=patch-texts` · `R19=0` สำหรับหน้าแบบ 19 ต.ค. |
| Overhaul v2 · **หน้า toast แยก** (29 toast × 2 = 58 เฟรมโปร่ง · บล็อก A–E ตามหน้า 1–5 · มีแค่ instance `Notification` · ทุกเฟรมตั้ง Export settings SVG + PNG 2x) — ปุ่ม "สร้างหน้า toast (เฉพาะ toast · export ได้)" (21 ต.ค. 2569 · กติกา R20) | `overhaul2-plugin/` (`TOASTS` · `toastOnly()` · `buildToast()`) | `overhaul-toast-1` · `TOAST / A.1 · 1 — T1 …` | ถ้อยคำ `Diagram/01-บำรุงรักษาตามวาระ/16-overhaul-toast-notification.md` หัวข้อ 6 | `MODE=build-toast PREFIX=TOAST FIRST='T1 ' node figma-export/test-overhaul2-plugin.js` |
| Overhaul v2 · notification (บล็อก P · 4 จอ × 2 · กระดิ่ง + Notification card · mobile = bottom sheet) — ปุ่ม "สร้างชุด notification" (20 ต.ค. 2569 · 21 ต.ค. ตัดบล็อก toast ออกเพราะมีหน้า toast แยก) | `overhaul2-plugin/` (`NOTI_SCENARIOS` · `bell()` · `notiPanel()`) | `overhaul-noti-1` · `OH2 / P.1 · notification — …` | สเปก `Diagram/01-บำรุงรักษาตามวาระ/16-overhaul-toast-notification.md` ข้อ 2 | `MODE=build-noti FIRST='ไม่มีแจ้งเตือนใหม่' node figma-export/test-overhaul2-plugin.js` |
| บำรุงรักษาตามวาระ (รอบแรก 9 scenario · 41 จอ × 2) | `maintainance-plugin/` = `plugin-lib/core.js` + `screens.js` → `build-plugin.js` ประกอบเป็น `code.js` | `maintainance-1` · `MT / …` | `maintainance-component-map.md` | `node figma-export/build-plugin.js maintainance-plugin && node figma-export/test-maintainance-plugin.js` |

- `plugin-lib/core.js` = โค้ดส่วนกลาง (หา component 3 ทาง · instance helpers · ฟอร์ม/ตาราง/กล่องข้อมูล/modal/เปลือกหน้า · กติกา R1–R14) — ปลั๊กอินใหม่เขียนแค่ `screens.js` (PLUGIN · DIRECT/NESTED/LOCAL_OPTIONAL · ข้อมูล · จอ · SCENARIOS · build) แล้วรัน build-plugin.js · **ห้ามแก้ code.js ที่ประกอบแล้วตรงๆ**
- `LOCAL_OPTIONAL` = component ที่ยืมจาก flow อื่นในไฟล์ Maintain-D (เช่น PartRequestStepPanel · IncidentPhotoGallery · VehicleAndReporterInfo ของงานซ่อม) — ไฟล์ที่ไม่มี ปลั๊กอินใช้แบบสำรองจากไลบรารี · harness รับ `LOCAL=ชื่อ,ชื่อ` และสแกนดัมป์ `out/figma-dump/maintain-d/*.json` ทุกหน้า
- ปุ่มที่ถอดออก 21 ต.ค. 2569 (โค้ดอยู่ใน git ก่อนวันนั้น): เทียบก่อน/หลัง CF หน้า 1 · จัดวางใหม่เป็นตาราง flow · เปลี่ยนป้าย Device Type · ปิด Clip content — ทั้งหมดเป็นงานครั้งเดียวกับชุดเก่าบน overhaul-1 · ชุดใหม่ทุกชุดได้ผลนั้นตั้งแต่สร้าง (maintainance-plugin ยังมี patchLayout ใน core.js)
- harness env เพิ่ม 21 ต.ค. 2569: `SELECT=all|regex` (จำลองเลือกเฟรมก่อน patch) · `ADDNEW=0` · `CHECK_ONLY=regex` (ตรวจกติกาเฉพาะจอที่อัปเดต) · `R19=0` (หน้าเก่าไม่มีป้าย/mobile วางคู่) · `HERE=1` (วางต่อท้ายหน้าที่เปิดอยู่)
- harness `test-overhaul2-plugin.js` ใช้กับปลั๊กอินอื่นได้ด้วย env `CODE=` (ไฟล์ code.js) · `PREFIX=` (คำนำหน้าเฟรม) · `FIRST=` (ชื่อจอแรกที่ต้องอยู่บนสุดของ Layers) · `EMPTY=1` (ไฟล์ไม่มี component ในตัว)

## ท่อ design กับโฟลว์แจ้งซ่อม (ฝั่งผู้แจ้ง 6 state · web + mobile)

`flow-report-extract.js` เป็นคู่แฝดของ `flow-report-capture.js` — ไล่กด wizard เส้นเดียวกันเป๊ะ
แต่แทนที่จะถ่ายภาพ มันรัน `walkDom` (แชร์จาก `dom-walk.js`) เก็บ DOM + computed style ทีละ state
→ `out/dom-report-01..06.json` แล้ว `2-map.js --report` แปลงเป็น `out/spec-report.json`

> ✏️ **ซ่อม + ต่อ mobile 16 ก.ย. 2569**
> - **จังหวะกดค้างของเก่า** — ยังกด `#vlist .radcard` · `#symcats .chip` · `#i-costtypes .radcard`
>   ที่ถอดไปตั้งแต่ 7 ก.ย. ⇒ เดินไม่จบมาตลอด (คอมเมนต์เดิมยอมรับเองว่าให้ใช้ `UNTIL=report-01`)
>   ตอนนี้ยึดจังหวะจาก `mock/test/flow-regression.js` · วิซาร์ดเหลือ **3 ขั้น** ⇒ **6 state** (ไม่ใช่ 8)
> - **ไม่มี `browser.close()`** ⇒ node ไม่ยอมจบ (รอดมาเพราะ `UNTIL=` เรียก `process.exit`)
> - **เมนูข้าง `.nv` ซ่อนตอนจอแคบ** ⇒ state สุดท้ายเรียก `switchView('boss')` แทนการคลิก
> - **รองรับหลายความกว้าง** — `WIDTH` (viewport) กับ `VARIANT` (คำต่อท้ายชื่อไฟล์/ชื่อ page) แยกกัน
>   ไม่ใส่ = ชุด web 1440 เดิมทุกอย่าง · `2-map.js --report` เลิก fix จำนวน state แล้ว
>   มันไล่อ่าน `dom-report<variant>-NN.json` ที่มีจริงในโฟลเดอร์

```bash
NODE_PATH=… node figma-export/flow-report-extract.js   # ต้องมี :8123 รันอยู่ → web 1440
node figma-export/0-icons.js                           # เก็บไอคอนของ mock เพิ่ม (58 ตัว)
node figma-export/2-map.js --report                    # → out/spec-report.json (ไม่แตะ spec.json)

WIDTH=390 VARIANT=m390 node figma-export/flow-report-extract.js   # → dom-report-m390-*.json
VARIANT=m390 node figma-export/2-map.js --report                  # → spec-report-m390.json
```

**ความกว้าง mobile** — ต้นแบบยึด **390** (ชุดเทส `มือถือ (390px)`) ส่วน**ไลบรารี Figma ยึด 360**
(`Section header`/`Section label` มี variant `Breakpoint=Mobile` · เฟรม `Mirror` หน้า *Section headers*
เป็น 360×800 · content 328 = 360 − gutter 16×2) ⇒ ท่อรับทั้งคู่ `WIDTH=360 VARIANT=m360` ก็ได้

⚠ **แพลนฟรีจำกัด 3 page/ไฟล์** — web + mobile = 2 page ถ้ามี page ชุดอื่นค้างต้องลบก่อน

ในไฟล์ **Figma design** (ไม่ใช่ FigJam): import `figma-export/plugin/manifest.json` → กด **"โหลด + สร้าง"**
(ค่าเริ่มต้นของช่องที่อยู่สเปกชี้ `spec-report.json` อยู่แล้ว — จะเอาชุด yearly ให้พิมพ์เปลี่ยนเป็น `spec.json`)
⚠ แพลนฟรีจำกัด 3 page/ไฟล์ — ถ้าในไฟล์มีหน้า Screens ชุดอื่นอยู่แล้ว ให้ลบทิ้งก่อนกด ไม่งั้นสร้าง page ใหม่ไม่ได้

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
4-figjam-diagram.js          ผัง mermaid ใน Diagram/ → out/*.json · ไม่ใส่พารามิเตอร์ = ค่าเดิม
                             (01-ออกเลขงาน.md → diagram-plan.json)
                             ผังอื่น: --src=<path.md> --out=<ชื่อ.json>
                               เช่น --src=Diagram/01-…/03-เฟส2-ดำเนินการบำรุงรักษา.md
                                    --out=diagram-maint.json
                             (geometry จาก SVG ที่ mermaid จัด layout · เส้น/ชนิด node parse จากซอร์สตรงๆ)
8-flow-userflow.js           userflow .md (Diagram/<เรื่อง>/NN-<เรื่อง>-userflow.md · สัญลักษณ์ 4 แบบของบอร์ดเจ้าของงาน)
                             → out/diagram-userflow-<เรื่อง>.json · section ละ scenario · รูปทรง Template (วงกลม/สี่เหลี่ยม/ข้าวหลามตัด)
                             จัดวางเอง ไม่พึ่ง mermaid · %% Q: ในผัง = sticky คำถาม · ค่าเริ่มต้น = บำรุงรักษาตามวาระ 18 scenario (19 ต.ค. 2569)
9-ac-board.js                AC ระดับหน้า .md (Diagram/<เรื่อง>/NN-…-AC-หน้าN-….md) → out/board-ac-<เรื่อง>.json ตรง (ไม่ผ่าน 3-figjam-board.js)
                             section ชนิด doc ละ 1 หัวข้อ `##` · ตาราง md → TableNode ของ FigJam (แก้ทีละเซลล์ได้) · ย่อหน้า/รายการขีด → กล่องข้อความ
                             ค่าเริ่มต้น = 18-overhaul-AC-หน้า1-รายการแผน.md → board-ac-overhaul-page1.json (20 ต.ค. 2569 · anchor below ลงไฟล์บอร์ด userflow Overhaul)
                             หน้าอื่น: --src=… --out=board-ac-<เรื่อง>.json --prefix="AC หน้า 2 รายละเอียดแผน"
   ▼ out/figjam/**/*.png + manifest.json + out/diagram-*.json
3-figjam-board.js            → out/board.json · ค่าเริ่มต้น = ผังโฟลว์สร้างแผน + capture สร้างแผน 8 จอ
                             + วางแผนการเดินทาง 8 จอ + แจ้งซ่อมฝั่งผู้แจ้ง 8 จอ (เจ้าของงานสั่งทีละโฟลว์)
                             เพิ่มชุดอื่นด้วย --after / --maint / --pages / --all
                             --maintainance --only --out=board-maintainance.json = บอร์ด userflow บำรุงรักษา (แยกไฟล์จากชุดซ่อม/Overhaul)
                             --maint = ผังเฟส 2 (+ capture out/figjam/flow-maint/ ถ้ามี · ไม่มีก็ลงผังอย่างเดียว)
serve.js                     เสิร์ฟ board.json + รูป (รองรับ path ย่อยแล้ว)
   ▼
figjam-plugin/               ปลั๊กอิน FigJam: section ผัง (ShapeWithText ตามชนิด node + connector ผูกปลายจริง
                             ลาก node แล้วเส้นตาม) + section รูป (IMAGE fill) + ป้าย + ลูกศร flow
                             รันซ้ำล้างของเดิม + เก็บกวาดรูปอัปโหลดค้าง
                             + section เอกสาร (kind doc: หัวข้อ/กล่องข้อความ = TextNode กว้างคงที่สูงตามเนื้อหา · ตาราง = figma.createTable
                             แถวแรกพื้นเทา) สำหรับ AC รายหน้าจาก 9-ac-board.js
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

**AC รายหน้าลงบอร์ดเดียวกับ userflow Overhaul** (20 ต.ค. 2569): `node figma-export/9-ac-board.js` (out/ ไม่อยู่ใน git ต้องสร้างทุกครั้ง) → `node figma-export/serve.js`
→ เปิดไฟล์ FigJam ของบอร์ด Overhaul → ปลั๊กอินเดิม ช่องที่อยู่ใส่ `http://localhost:8124/board-ac-overhaul-page1.json` → โหลด + สร้างบอร์ด
วางต่อใต้ของเดิม (anchor below) 11 section "AC หน้า 1 รายการแผน · …" · กดซ้ำ = ล้างเฉพาะ 11 section นี้แล้วสร้างใหม่ ไม่แตะบอร์ด userflow
· เทส `SPEC=board-ac-overhaul-page1.json node figma-export/test-figjam-plugin.js`

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
⇒ แก้ `brand/900` ที่เดียวทั้งไฟล์เปลี่ยน เทียบเท่า `var(--brand-900)` ในโค้ด
ชื่อ variable = ชื่อ CSS ตรงๆ เปลี่ยน `-` เป็น `/` (`--brand-900` → `brand/900`) — map กลับหาโค้ดได้เสมอ
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
| `rotation` | องศา **ทวนเข็มเป็นบวก** (แบบ Figma — ตรงข้ามกับ CSS) ใช้คู่กับ `rotateOrigin` |
| `rotateOrigin` | `[ox, oy]` จุดหมุนภายในกล่อง (px) — ปลั๊กอินเลื่อนชดเชยให้จุดนี้อยู่กับที่ เพราะ Figma หมุนรอบมุมซ้ายบน |
| `absolute` | `true` = หลุดจาก flow ของ auto-layout (`layoutPositioning:'ABSOLUTE'`) ใช้กับ pseudo ที่ CSS สั่ง `position:absolute` · ต้องมี `pos` มาด้วย |
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
