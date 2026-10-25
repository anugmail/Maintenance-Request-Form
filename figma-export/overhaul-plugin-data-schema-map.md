# Data source map — `overhaul2-plugin/code.js` ↔ `maintain-d-be` schema

> ใช้ร่วมกับ: `Diagram/01-บำรุงรักษาตามวาระ/20-overhaul-dashboard-หลัง-overhaul.md` หัวข้อ 7 (รหัสช่อง A–H) และป้าย `DB / NEW / OTHER / NONE` ที่เอกสารนั้นวางไว้แล้ว — ไฟล์นี้ไม่สร้างศัพท์ใหม่ แค่ผูกคอลัมน์ในอาร์เรย์ที่ปลั๊กอินใช้จริง (`PLANS`, `POS`, `CARS`, `STATUS`, `JOB` ใน `overhaul2-plugin/code.js` บรรทัด 317–347) เข้ากับ table.column จริงใน `maintain-d-be`
> วิธีให้ plugin ใช้: ตอน `createInstance()` ใส่ค่าแต่ละคอลัมน์ ให้แนบ `node.setPluginData('schema', '<backend_table>.<backend_column>')` หรือ `'GAP:<รหัส>'` ตามตารางนี้ — join key คือ **ชื่ออาร์เรย์ + ลำดับ index** เพราะโค้ดนี้ใช้ positional array ไม่ใช่ named object

---

## `PLANS` (หน้า 1 — รายการแผน) — `code.js:322-330`

ตัวอย่างแถว: `['123460', 'Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้', 'C-70-OH-0002', '21,500,000', '1', '1', 'P2', '10/10/2569']`

| idx | คอลัมน์ | backend | label | หมายเหตุ |
|---|---|---|---|---|
| 0 | planNo | `vms_trn_overhaul_job.plan_no` | DB (partial) | format ไม่ตรง — mock ใช้เลข 6 หลัก `123460` แต่ของจริง gen เป็น `ORZ690000X` (`FormatPlanNo`, `overhaul_plan.go:292`) |
| 1 | name | `vms_trn_overhaul_job.plan_name` | DB | ตรง |
| 2 | costCenter | — | **NONE (ยังไม่อยู่ในรหัส A–H)** | ไม่มี column ศูนย์ต้นทุนบน `vms_trn_overhaul_job` เลย — เป็น gap ใหม่ที่เอกสาร 20 ยังไม่ครอบคลุม (เอกสาร 20 พูดถึง dashboard หลัง Overhaul เท่านั้น ไม่ใช่ตอนสร้าง/แสดงรายการแผน) ควรเพิ่มเป็นรหัสใหม่ (เช่น I) ถ้าจะ carry ต่อ |
| 3 | budget | `vms_trn_overhaul_job.approved_budget` | DB | ตรง (backend เก็บเป็น int ไม่มีทศนิยม) |
| 4 | poCount | — | NEW (computed) | ไม่มี column นับ PO แต่ query `COUNT(*) FROM vms_trn_purchase_order WHERE overhaul_id=? AND is_deleted=0` ได้ |
| 5 | carCount | `vms_trn_overhaul_job.overhauled_car_count` | DB | มี column ตรงอยู่แล้ว — หรือจะ derive จาก `COUNT(DISTINCT mas_vehicle_id) vms_trn_po_vehicle` ก็ได้ ต้องเคาะว่าใช้อันไหนเป็น source of truth |
| 6 | statusKey (P1/P2/P3) | `vms_trn_overhaul_job.plan_status` | DB (partial) | column มีอยู่ แต่ไม่มี seed ค่า `pending_po` / `in_progress` / `done` ที่ตรงกับ P1="รอเลข PO" / P2="รอดำเนินการ" / P3="เสร็จสิ้น" เลย — วันนี้ค่าในคอลัมน์มีแค่ constant เดียว (`pending_approval`) ในโค้ด ต้องนิยามค่าที่เหลือ หรือคำนวณจาก PO/appointment state แทนการเก็บเป็น column ตรง ๆ |
| 7 | createdDate | `vms_trn_overhaul_job.created_at` | DB | ตรง |

---

## `POS` (หน้า 2 — PO ในแผน) — `code.js:333-335`

ตัวอย่างแถว: `['PO-690101', 'ซ่อมระบบเครื่องยนต์', 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด', '2', 1, '1 ก.ย. 2569', '30 พ.ย. 2569', false]`

| idx | คอลัมน์ | backend | label | หมายเหตุ |
|---|---|---|---|---|
| 0 | poNo | `vms_trn_purchase_order.po_number` | DB (partial) | format ไม่ตรง — mock `PO-690101` vs จริง `FormatPONumber` = `{overhaul_code}-{seq}` เช่น `ORZ6900001-01` |
| 1 | name/scope | `vms_trn_purchase_order.po_name` | DB | ตรง — คอลัมน์นี้มีจริงและรับ string เดียวได้พอดี (ไม่ต้องห่วงเรื่อง list หลายรายการแบบ prototype อีกชุดใน `app/src`) |
| 2 | vendor (อู่) | `vms_trn_purchase_order.vendor_name` (+ `vendor_id`) | DB | ตรง |
| 3 | carCount | — | NEW (computed) | `COUNT(*) FROM vms_trn_po_vehicle WHERE po_id=?` |
| 4 | closedFlag (0/1) | — | **GAP C-adjacent** | ไม่มี status column บน `vms_trn_purchase_order` เลย ปุ่ม "ส่งมอบงานแล้ว" ในหน้าจอไม่มีที่เขียนกลับ |
| 5 | startDate | — | **GAP = รหัส C** | ตรงกับ "วันเริ่ม...สัญญา" ใน เอกสาร 20 หัวข้อ 7 รหัส C |
| 6 | endDate | — | **GAP = รหัส C** | เดียวกับข้างบน — รหัส C ครอบคลุมทั้งคู่ ("ประกันผลงานตามสัญญา + วันเริ่มถึงสิ้นสุดสัญญา") |
| 7 | nearExpiryFlag | — | GAP (derived from C) | คำนวณไม่ได้จนกว่าจะมี endDate จริง |
| — | (ไม่มีคอลัมน์มูลค่า PO เลยในอาร์เรย์นี้) | — | **GAP = รหัส E** | เอกสาร 20 ระบุไว้ตรง ๆ ว่า "มูลค่า PO (บาท) บังคับ" ยังไม่มีช่องกรอก — ปลั๊กอินนี้เลยไม่ได้ลองวาดคอลัมน์นี้ด้วย สอดคล้องกัน |

---

## `CARS` (หน้า 3 — รถใน PO, badge สถานะ V1–V11) — `code.js:339-340`

ตัวอย่างแถว: `['8234 กค กทม', 'HINO FM2P · รถเครน 10 ตัน', 'กฟฟ.กทม.', '182,400', '12', 'V5', 'อยู่อู่ 12 วัน', 'รับรถ 9 ต.ค. 2569']`

| idx | คอลัมน์ | backend | label |
|---|---|---|---|
| 0 | plate | `vms_mas_vehicle` (external) | external |
| 1 | model+type | `vms_mas_vehicle` (external) | external |
| 2 | orgUnit | `vms_mas_vehicle` (external) | external |
| 3 | odometer | `vms_mas_vehicle` (external, ค่าล่าสุดไม่มีวันที่) | external (partial) — ใช้แทนค่า ณ รับรถเข้า/คืนไม่ได้ตรงตามเอกสาร 20 ข้อห้ามข้อ 2 ("ห้ามใช้เลขไมล์จากทะเบียนรถเป็นการใช้งานหลัง Overhaul โดยตรง") → ต้องการรหัส D |
| 4 | age | computed จาก `registration_date` (external) | external/computed |
| 5 | statusKey (V1–V11) | ดูตารางย่อยด้านล่าง | mixed |
| 6/7 | statusDetail / statusSubDetail | ตามสถานะ | mixed |

### `JOB` map (`V1`–`V11`) → backend จริง

| code | ความหมาย | backend | label |
|---|---|---|---|
| V1 | รอนัดหมายเข้าอู่ | ไม่มีแถวใน `vms_trn_overhaul_po_vehicle_appointment` (`appointment_type='intake'`) | NEW (computed จากการไม่มีแถว) |
| V2 | รอหน่วยงานตอบรับนัดเข้าอู่ | `appointment_type='intake'`, `status_key='pending_response'` | **DB** — ตรงกับ seed ที่มีจริง |
| V3 | หน่วยงานปฏิเสธนัดเข้าอู่ | `is_approved=false`, `reject_note` (ผ่าน `IntakeAppointment.Reject()`) | **DB** |
| V4 | รอตรวจรับรถ | intake accepted แล้วแต่ยังไม่มีบันทึกตรวจ | NEW (ครึ่งหนึ่ง) — ส่วน "ตรวจรับรถ" เองยังไม่มีตาราง (เทียบรหัส D ของเอกสาร 20) |
| V5 | กำลังซ่อม | — | **GAP** — ไม่มีตารางติดตามงาน (ตรงกับ StepTrack ที่เคยเจอใน `app/src`) |
| V6 | รอตรวจสภาพ Safety | — | **GAP** — ไม่มีตาราง safety inspection |
| V7 | รอนัดหมายรับรถ | ไม่มีแถว `appointment_type='return'` | NEW (computed) |
| V8 | รอหน่วยงานตอบรับนัดรับรถ | `appointment_type='return'`, `status_key='pending_response'` | **DB** |
| V9 | หน่วยงานปฏิเสธนัดรับรถ | `appointment_type='return'`, `is_approved=false` | **DB** |
| V10 | รอปิดงาน | — | **GAP** |
| V11 | ปิดงานแล้ว | — | **GAP = รหัส A/B** (ไม่มี closed_at, ไม่มี pickup date ที่เริ่มนับประกัน) |

---

## สรุปสิ่งที่ต้องทำก่อนให้ปลั๊กอินแปะ schema ได้แม่น

1. **เพิ่มรหัสใหม่ในเอกสาร 20** สำหรับ "ศูนย์ต้นทุนของแผน" (คอลัมน์ `PLANS[2]`) — ตอนนี้ไม่มีรหัสครอบคลุม เพราะเอกสาร 20 โฟกัสที่ dashboard หลัง Overhaul เท่านั้น ไม่ใช่หน้ารายการแผน
2. **ยืนยัน plan_status / PO status เป็น enum ที่ query ได้จริง** — ตอนนี้ P1/P2/P3 และ V1–V11 ส่วนใหญ่ต้อง derive จากหลายตาราง ไม่ได้อ่านจาก column เดียว ปลั๊กอินที่จะ "แปะ schema" ต้องรู้ว่าอันไหนเป็น stored column (DB) อันไหนต้อง compute (NEW) เพราะวิธี query ต่างกันมาก
3. **format เลขที่ (planNo, poNo) ของ mock ไม่ตรงกับ `FormatPlanNo`/`FormatPONumber` จริง** — ถ้า Figma โชว์เลขปลอมแบบ `123460`/`PO-690101` ให้เขียน AC ระบุชัดว่าเป็น placeholder ไม่ใช่ format จริง จะได้ไม่มีใคร build ตาม format ผิด
4. รายการ gap A–H ที่มีอยู่แล้วในเอกสาร 20 ยังใช้ได้ตรง — ไฟล์นี้แค่ชี้ว่า "gap นั้นไปโผล่ที่คอลัมน์ไหนในอาร์เรย์ของปลั๊กอินจริง" เพื่อให้ map งานกับ data-binding ได้ตรงจุด
