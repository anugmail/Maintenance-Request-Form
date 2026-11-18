# บันทึกรวมงาน: ปลั๊กอิน "พระผู้สร้าง" (maintainance-feature-plugin) กับงานพี่นุ
อัปเดต 18 พ.ย. 2569 · ลองประกอบกับ origin/main `6755756` (12 พ.ย. 2569) · HEAD ในเครื่อง `c326a81`

## 1. ปลั๊กอินพึ่งอะไรจากไฟล์พี่นุ
build.js ประกอบ code.js จากไฟล์ของพี่นุ 4 ไฟล์ (เราอ่านอย่างเดียว ไม่แก้):

| ไฟล์ | เราใช้อะไร | ถ้าเปลี่ยนจะพังแบบไหน |
|---|---|---|
| `plugin-lib/core.js` | เครื่องมือสร้างจอและป้าย: `frame` `inst` `find` `setProps` `flowBar` `deviceLabel` `polish` `stripDividers` `repin` `bindTones` `fitOn` `pageBottom` `GRID` `MOB` `PLACE` `TABLE_MAX` ฯลฯ และ **`flatScreens`** (ตัวแตกเส้นทางย่อยเป็นรหัสซ้อน V.4.1) | ชื่อฟังก์ชันหาย = ปลั๊กอินเปิดไม่ขึ้นทั้งตัว (ReferenceError ตอนโหลด) |
| `maintainance-plugin/screens.js` | `SCENARIOS` + `BLOCK_OF` + `LETTERS` (รหัสจอ A.1 · V.4.1 · Q.1 …) · ฟังก์ชันจอ `listScreen` `planDetail` `planMenu` `tripList` `tripDetail` `costScreen` `partsDash` ฯลฯ · ข้อมูลจำลอง `UNITS` `PLAN_UNIT` `ownPlans` `allPlans` `NEW_PLAN` · `AFTER_SCREEN` | scenario ถูกตัด = จอหาย (มีคำเตือน) · ลำดับจอในบล็อกเปลี่ยน = **รหัสเดิมชี้จอคนละจอ ไม่มีคำเตือน** · ชื่อหน่วยงานเปลี่ยน = จอที่เราทับเองพัง |
| `maintainance-plugin/build.json` | ภาพ Empty state (`images`) | ภาพหาย = build ไม่ผ่าน (readFileSync) |
| `figjam-plugin/code.js` | ส่วนวางบอร์ด FigJam ทั้งก้อน · build ตัดบรรทัด `figma.showUI(__html__, { width: 420, height: 560, themeColors: true });` ออก | บรรทัดนี้เปลี่ยน = build หยุดพร้อมข้อความ "figjam-plugin/code.js เปลี่ยนไป" |

นอกจากนี้ตัวเทสใช้ของกลาง: `test-overhaul2-plugin.js` · `check-component-rules.js` · `component-rules.json` · `test-figjam-plugin.js` · ดัมป์ `figma-export/out/figma-dump/`

## 2. ผลลองประกอบวันนี้ (18 พ.ย. 2569)

### ฐาน: code.js ปัจจุบัน (= build ใหม่จาก working tree ได้ไฟล์เดียวกัน)
| Feature | จอ (Desktop+Mobile) | journey | คำเตือน | ส่ง FigJam (Desktop) |
|---|---|---|---|---|
| plan แผนบำรุงรักษา | 208 | 5 | 0 | 104 |
| trip แผนเดินทาง | 180 | 7 | 0 | 90 |
| job งานรายคัน | 240 | 7 | 0 | 120 |
| close ประวัติและปิดงาน | 58 | 4 | 0 | 29 |
| track ติดตามและแดชบอร์ด | 68 | 3 | 0 | 34 |
| รวม | 754 | 26 | 0 | 377 ภาพ · 31 บอร์ด |
- FEATURES=ทั้ง 5 ผ่าน · export-figjam-all ผ่าน (377 ภาพ 31 บอร์ด) · เทสบอร์ด FigJam 31/31 ผ่าน · เทสบอร์ดปลายทางผ่าน
- MODE=patch-labels ไม่ผ่านตั้งแต่ฐาน (mock นำเข้า Header ตัวใหม่ไม่ได้) — ไม่ใช่ปัญหาจากการรวม

### ก. origin/main ล้วน (เอา core.js · screens.js · build.json · figjam-plugin จาก origin)
- build ผ่าน (7,314 บรรทัด · core 1,741 · screens 3,900)
- **เปิดปลั๊กอินไม่ขึ้น:** `ReferenceError: flatScreens is not defined` ตอนโหลด ⇒ ได้ 0 จอ · เทสไม่ผ่านทั้ง 15 รอบ
- สาเหตุ: `flatScreens` `isPath` `countScreens` (แพตเทิร์นเส้นทางย่อย R88) และ S23 แบบเส้นทางย่อย อยู่ใน **งานที่ค้างใน working tree เท่านั้น** ไม่อยู่ในคอมมิตใดเลย (ทั้ง HEAD และ origin/main)

### ข. origin/main + งานค้างใน working tree (จำลองว่าพี่นุคอมมิตงานค้างแล้วรวม)
- merge 3 ทาง: core.js conflict 1 จุด · screens.js 2 จุด · build.json ไม่มี (รายละเอียดหัวข้อ 3 ข้อ 5)
- build ผ่าน (7,385 บรรทัด)

| Feature | จอ ฐาน → ใหม่ | คำเตือน | สาเหตุ |
|---|---|---|---|
| plan | 208 → 206 | 9 | A.39 A.40 (desktop) พัง `Cannot read properties of undefined (reading '1')` ใน fillCell · plan.js ยังใช้ชื่อหน่วยงาน กกฟ.1 กกฟ.2 แต่ origin เปลี่ยนเป็น กบผ. กปส. (R104 · `UNITS`) |
| trip | 180 → 180 | 4 | จอครบ แต่ 4 รหัสความหมายเปลี่ยน (ตาราง 3 ข้อ 3) |
| job | 240 → 220 | 25 | M.1–M.5 หาย (S14 ถูกตัด · R89) · L.1–L.5 กลายเป็นหน้ารับทราบผลแบบใหม่ |
| close | 58 → 14 | 49 | N.x O.x P.x หายทั้งหมด (S15 S16 S17 ถูกตัด) · Q.1 กลายเป็นหน้ารายละเอียดแผนแท็บต้นทุน (R92) |
| track | 68 → 68 | 5 | "ชิ้นในจอที่ไม่ใช่ instance/กรอบ: 5,078" จากแดชบอร์ดวาดเอง S4 S24 (R106) · 5 รหัสความหมายเปลี่ยน |
| รวม | 754 → 688 | | ส่ง FigJam ทุก Feature 377 → 343 ภาพ · บอร์ด 31 เท่าเดิม · เทสบอร์ด FigJam 31/31 ผ่าน |
- คำเตือน 4 ข้อที่ขึ้นทุก Feature: "ไม่พบ S14 / S15 / S16 / S17 ใน screens.js" (screenFns ไล่ทุก Feature ตอนเปิด)

## 3. จุดที่จะชนตอนรวม (เรียงจากรุนแรงสุด)

1. **งานค้างใน working tree ยังไม่ขึ้น origin (ตัวบล็อก)** — core.js (`flatScreens` `isPath` `countScreens` `auditDuplicates` · GRID gap/rowGap 200) และ screens.js (S23 เส้นทางย่อย · A.20 รออนุมัติมีปุ่มลบแผนและแก้ไข Q53 · ปุ่ม audit-dup) ถ้าดึง origin ทับโดยงานนี้ไม่ไปด้วย ปลั๊กอินเปิดไม่ขึ้นทันที และรหัส V.4.1–V.12.2 ของ job ไม่มีอยู่จริง (V.6–V.13 ของ origin เป็นจอคนละจอ) ⇒ ต้องตกลงกับพี่นุก่อนว่างานนี้จะคอมมิตไหม
2. **เจ้าของงานตัด S14 S15 S16 S17 แล้ว (origin 10 พ.ย. 2569 · R89 และคอมมิต 6299e1d)** — Feature close เหลือ 14/58 จอ · job หาย 20 จอ (M.x) · เอกสาร 34 35 และ features/job.js close.js ยังอิง scenario ที่ไม่มีแล้ว ⇒ เป็นเรื่องขอบเขตงาน ไม่ใช่แค่โค้ด ต้องถามผู้ใช้ว่าจะตัดออกจาก Feature หรือทับจอเอง
3. **รหัสเดิมชี้จอคนละจอ โดยไม่มีคำเตือน (อันตรายเพราะเทสผ่าน)**
   | Feature | รหัส | ความหมายเดิม → ใหม่ |
   |---|---|---|
   | close | Q.1 | ต้นทุนการบำรุงรักษา + Summary → รายละเอียดแผนที่อนุมัติแล้ว แท็บต้นทุน (R92 · S18 มี 6 จอ) |
   | job | L.1–L.5 | ตรวจสอบ/ยอมรับผล → รายการรอรับทราบ · ปุ่มรับทราบ · รับทราบแล้ว ปุ่มประเมินความพึงพอใจ (R89) |
   | track | C.3 W.1 W.4 W.6 W.7 | แผงตัวกรอง/แดชบอร์ดแบบเดิม → แดชบอร์ดแบบ VMS+ (R106 R107) |
   | trip | E.19 X.2 G.4 G.5 | popup เพิ่มยานพาหนะทุกคัน (R104) · เมนู "…" มีดำเนินการบำรุงรักษา · หน่วยงานเจ้าของยานพาหนะ → ผู้ดูแลยานพาหนะ |
   ⇒ หลังรวมต้องไล่ป้าย case ใน features/*.js และเอกสาร 32–36 ให้ตรงจอจริง
4. **ชื่อหน่วยงานเปลี่ยน (R104):** `UNITS` = กบผ. กปส. กรย. กบค. กส.1 กส.2 (เดิม กกฟ.1 กกฟ.2 กรย. กบค.) · plan.js ใช้ `'กกฟ.1'` `'กกฟ.2'` ใน `EXTRA` `EXTRA_MR` `LIST10_EXTRA` และป้าย A.39 ⇒ A.39 A.40 พัง และ A.1 อาจไม่เต็ม 10 แถว (ข้อมูลจำลองผูกกับ กกฟ.1 แต่ `UNITS[0]` เป็น กบผ.)
5. **merge conflict 3 จุด** (ลองแก้ในสำเนาแล้วผ่าน)
   - core.js `buildGrid` แถวป้ายจอ: ของเรา/งานค้าง = เส้นทางย่อย · origin = ป้าย state สีตาม `stateTone` + สูงตามป้ายที่สูงสุด ⇒ ต้องรวมทั้งสองอย่าง
   - screens.js ตารางผูกกล่อง userflow (S1 S6): ใช้ของ origin เป็นหลัก แล้วเติมป้าย A.20 ใหม่ถ้างานค้างไปด้วย
   - screens.js `TOTAL`: ใช้ `countScreens` (งานค้าง) + ข้อความ log ของ origin
   - ข้อสังเกต: `nMax` ใน buildGrid ของ origin ยังนับ `s.screens.length` (ไม่นับเส้นทางย่อย) ไม่ชนแต่ควรเปลี่ยนเป็น `countScreens`
6. **ตัวตรวจชิ้นวาดเอง (R106):** feature.js นับ "ชิ้นในจอที่ไม่ใช่ instance/กรอบ" ต้องเป็น 0 แต่แดชบอร์ด S4 S24 แบบใหม่วาดเองในกรอบชื่อ `DASH_BOX` (`VMS+ head · ` `VMS+ alert · ` `VMS+ KPI · ` `VMS+ chart · ` `VMS+ note · `) ⇒ ตัวนับใน feature.js ต้องยกเว้นชิ้นในกรอบเหล่านี้แบบเดียวกับ R106
7. **ระยะกริด:** GRID.gap 200 / rowGap 200 มาจากงานค้าง (origin ยัง 80/160) ถ้างานค้างไม่ไปด้วย ระยะแถบหัว→จอของปลั๊กอินเราจะเปลี่ยน
8. **ไม่ชน:** `figjam-plugin/code.js` ไม่เปลี่ยน (บรรทัด showUI ยังตรง) · ภาพใน build.json ยังอยู่ · `flowBar` ของ origin รับพารามิเตอร์ `desc` เพิ่ม (เข้ากันได้) · `costScreen` รับ `o` เพิ่ม (เข้ากันได้)

## 4. ขั้นตอนรวมงานวันหน้า (ทีละขั้น)
1. ก่อนดึง: ถามพี่นุว่างานค้างใน working tree (core.js screens.js component-rules.md CLAUDE.md ฯลฯ) จะคอมมิตหรือไม่ · ถ้าใช่ ให้คอมมิตก่อนแล้วค่อย pull/merge ⇒ ได้ conflict 3 จุดตามข้อ 3.5
2. เก็บฐานไว้เทียบ: รัน `node figma-export/test-maintainance-feature-plugin.js` ด้วย `FEATURE=plan|trip|job|close|track` บันทึกจำนวนจอ/คำเตือน (ตัวเลขฐานอยู่หัวข้อ 2)
3. ดึงงานพี่นุ แก้ conflict ตามข้อ 3.5 แล้ว `node --check figma-export/plugin-lib/core.js figma-export/maintainance-plugin/screens.js`
4. build: `node figma-export/maintainance-feature-plugin/build.js` (อยากลองก่อนไม่ทับของจริงใช้ `MF_OUT=<path>`)
5. เทสทีละ Feature: `FEATURE=<id> node figma-export/test-maintainance-feature-plugin.js` ดู 3 บรรทัด: "สร้าง N เฟรม" · "— ผลทดสอบ — … คำเตือน N" · "ชิ้นในจอที่ไม่ใช่ instance/กรอบ"
6. หาจอที่หาย: grep `ไม่พบจอเดิม` และ `ไม่พบ S` ใน log ⇒ ตัดสินใจกับผู้ใช้ว่าจะตัดออกจาก Feature หรือทับจอเอง (ข้อ 3.2)
7. หาจอที่ความหมายเปลี่ยน (เทสจับไม่ได้): เทียบป้ายจอใน `SCENARIOS` ของ screens.js ใหม่กับป้าย case ใน features/*.js ทีละรหัส (ข้อ 3.3) แล้วแก้ features/*.js + เอกสาร 32–36 หัวข้อ 3 ให้ตรง
8. แก้ plan.js ตามชื่อหน่วยงานใหม่ (ข้อ 3.4) และตัวนับชิ้นวาดเองใน feature.js (ข้อ 3.6)
9. เทสรวม: `FEATURES=plan,trip,job,close,track` · `PRE_MODE=build MODE=export-figjam FEATURE=<id>` ทุก Feature · `PRE_MODE=build MODE=export-figjam-all PRE_FEATURES=plan,trip,job,close,track`
10. เทส FigJam: `node figma-export/test-maintainance-feature-figjam.js` แล้ว `SPEC=test-mf/<board>.json node figma-export/test-maintainance-feature-figjam.js` ทุกบอร์ดใน `figma-export/out/test-mf/` (ฐาน 31/31 ผ่าน)
11. เทสของพี่นุต้องผ่านด้วย: `node figma-export/test-maintainance-plugin.js` (ไม่ให้งานเรากระทบปลั๊กอินเดิม)
12. ลองใน Figma จริง 1 Feature ก่อนประกาศว่าพร้อม (mock ตรวจหน้าตาจอจริงไม่ได้ · patch-labels ใน mock ไม่ผ่านตั้งแต่ฐาน)

## 5. การตัดสินใจของผู้ใช้ (18 พ.ย. 2569)
- "requirement อันไหนใหม่สุดให้ใช้อันนั้น ไม่ว่าจะมาจากที่ไหน ถ้าตรวจสอบแล้วว่าใช่ก็ลุยเลย"
- ⇒ ย้ายฐานของปลั๊กอินไปเป็นสำเนา core.js / screens.js จาก origin/main ไว้ในโฟลเดอร์ของเราเอง (`base/`) ไม่แก้ไฟล์พี่นุ ไม่ pull · ของที่ origin ยังไม่มี (`flatScreens` ฯลฯ) ทำ shim ในฝั่งเรา
- คำถามค้างไฟล์ 37: เปิดอยู่ 75 ข้อ (หนัก 10 · กลาง 34 · เบา 31) · ราว 20 ข้อ origin ตอบแล้วหรือหายไปเอง (ตัด S14–S17 · R89 · R92)
