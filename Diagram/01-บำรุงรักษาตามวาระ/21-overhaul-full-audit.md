# Overhaul — Full Audit (FigJam Refinement Board ↔ `maintain-d-be` จริง) · 22 ต.ค. 2569

> ที่มา: FigJam board **"Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026"**
> (dump ด้วย `figma-export/figjam-dump-plugin/` → `out/figjam-dump/overhaul-flow/7733-73340.json`, 8,047 node · 137 sticky · 48 section)
> cross-check กับ dump ไฟล์ design `out/figma-dump/component-overhaul/1387-1201443.json`
> และโค้ดจริง `maintain-d-be` ณ commit ปัจจุบัน (migrations ล่าสุด `20261021110000_add_vendor_phones_to_purchase_order.sql`,
> domain/overhaul/{domain,usecase,adapter,port} ทั้งหมด)
> สืบต่อรหัสช่องจาก `20-overhaul-dashboard-หลัง-overhaul.md` หัวข้อ 7 (A–H) — เริ่มของใหม่ที่ **I**
> ป้าย: DB = มี column ตรง · PARTIAL = มีแต่ไม่ตรงทั้งหมด · NEW = derive จากตารางลูกได้ · GAP = ไม่มีเลย · EXTERNAL = main-be

**ข้อค้นพบสำคัญสุดก่อนเข้ารายละเอียด**: Scenario 1-7 (จัดการแผน, PO, นัดหมายรับรถเข้า) **ถูก implement ไปเกือบครบแล้วจริง** ทั้ง API route และ DB — มากกว่าที่ประเมินไว้รอบก่อนจากโค้ด generator เพียงอย่างเดียว ส่วน Scenario 8-14 (ตรวจรับรถ, ติดตามงานซ่อม, ตรวจ Safety, นัดรับรถ, ปิดงาน) **ยังไม่มี backend รองรับเลยสักเส้น** ไม่ใช่แค่ไม่มี column — ไม่มี route, ไม่มี table ใดๆทั้งสิ้น

---

## 1. Scenario 1 — Overhaul Management (list) + Create/Edit/Delete Plan

ตรงกับ `vms_trn_overhaul_job` **เกือบ 100%** — ดีกว่าที่คาดจากโค้ด generator มาก เพราะ FigJam board มีช่อง WBS/Network/Activity/อัปโหลดเอกสารครบ (รุ่น `app/src/components/PlanForm.tsx` ที่เคยไล่ไว้คือของเก่า ตกไปแล้ว)

| field (จาก board) | label | backend | note |
|---|---|---|---|
| `plan_number` (เลขแผน) | DB | `vms_trn_overhaul_job.plan_no` | format จริง `FormatPlanNo` = `ORZ690000X` — board โชว์ `Z69000X`/`123456` เป็น placeholder เท่านั้น |
| `plan_name` (ชื่อแผน) | DB | `.plan_name` | ตรง |
| เลขที่ WBS — board เขียนไว้ว่า `wbs_number \| (vms_trn_repair_job)` | DB **แต่ชื่อตารางที่เขียนไว้ผิด** | `.wbs_number` **ของ `vms_trn_overhaul_job`** | **บั๊กเอกสาร**: ทุกจุดที่ FigJam เขียน `wbs_number`/`network_no`/`activity_no`/`service_center` ใส่ `(vms_trn_repair_job)` ไว้ข้างหลังหมด (เห็นอย่างน้อย 5 จุด) — เดาว่า copy template ของหน้าแจ้งซ่อมมาแล้วไม่ได้แก้ชื่อตาราง ถ้า dev เชื่อป้ายนี้ตรงๆจะหาคอลัมน์ผิดฝั่ง ต้องแก้ที่บอร์ดก่อน handoff |
| `network_no`, `activity_no` | DB (ชื่อตารางผิดเหมือนกัน) | `.network_no`, `.activity_no` | เดียวกับข้างบน |
| `fiscal_year` (ประจำปีงบประมาณ) | DB | `.fiscal_year` | sticky "ปีปจบ+10ปี" = dropdown ปีปัจจุบันถึง +10 ปี (business rule ฝั่ง FE) |
| `approved_budget` (วงเงินอนุมัติ) | DB | `.approved_budget` | ตรง |
| หนังสืออนุมัติหลักการ/เอกสารอนุมัติงบ/อื่นๆ → `doc_type = principle_approval/budget_approval/other` | DB | `vms_mas_overhaul_document.doc_type` | ตรง 1:1 กับ `DocTypePrincipleApproval/DocTypeBudgetApproval/DocTypeOther` ใน `overhaul_plan.go` |
| `plan_status` | PARTIAL | `.plan_status` | column มีจริง แต่ยังไม่มี seed ค่าที่ UI ใช้จริง (เหมือนที่เคยพบใน audit ก่อนหน้า) |
| `created_at` | DB | `.created_at` | ตรง |
| `overhauled_car_count` (จำนวนรถที่ Overhaul) | DB | `.overhauled_car_count` | ตรง |
| ~~"ศูนย์ต้นทุน"/"ประเภทงบ"~~ | **แก้ไขจาก audit รอบก่อน** | — | sticky ยืนยันตรงๆ: **"ศูนย์ต้นทุนเป็น WBS เท่านั้น"** — ทีมเคาะแล้วว่าไม่มีงบแบบศูนย์ต้นทุนแยก ใช้ WBS อย่างเดียว ⇒ **gap นี้ปิดแล้ว ไม่ใช่ gap จริง** (รอบก่อนเข้าใจผิดว่ายังเปิดอยู่เพราะอ้างจาก mock เก่า) |
| "หน่วยงาน" (กบค. คงที่) | — | — | ไม่มี column รองรับ แต่ก็ไม่จำเป็นต้องมี เพราะ Overhaul ทำโดย กบค. หน่วยงานเดียวเสมอ (ค่าคงที่ ไม่ใช่ตัวแปร) — ไม่ใช่ gap ให้ตัดออกจากสคีมา |
| Require validation: "require field ทุกฟิลด์ ยกเว้น 'อื่นๆ (ถ้ามี)'" | DB (validation ตรง) | `validatePlanFields` / `CreateOverhaulPlanCommand.Validate` | ตรงกับ backend ที่บังคับ principle+budget doc อย่างน้อย 1 ไฟล์ |

**API ที่มีแล้ว**: `GET/POST /overhauls`, `GET/PATCH/DELETE /overhauls/:id` (ครบ Create/Detail/Edit/Delete — Scenario 1-6 เกือบเต็ม)

---

## 2. Scenario 4-6 — Create/Edit/Delete PO

| field | label | backend | note |
|---|---|---|---|
| `purchase_order_name`/`po_name` | DB | `vms_trn_purchase_order.po_name` | ตรง |
| ศูนย์บริการ/อู่ → vendor search | DB | `.vendor_id`, `.vendor_name`, `.vendor_address`, `.vendor_telephone`, `.vendor_mobile_phone` | ครบแล้ว! migration `20261021100000`/`20261021110000` เพิ่ม address/phone ตามที่ sticky ขอไว้ ("ตอนยิง vendor list เก็บที่อยู่ เบอร์โทรมาด้วย") — **gap นี้ปิดไปแล้วจริง ไม่ต้องทำอะไรเพิ่ม** |
| เลือกรถ (รายการรถทั้งหมด/เลือกแล้ว) | DB | `vms_trn_po_vehicle` (M:N po↔vehicle) | ตรง, sticky "ยิงรถทั้งหมดมาก่อนแล้วค่อยค้นหา" = ค้นหาฝั่ง client ไม่ query ทุกครั้ง |
| ใบสั่งจ้าง/อื่นๆ (อัปโหลด) → `doc_type = work_order/other` | DB | `vms_mas_po_document.doc_type` | ตรง |
| `vehicle_license_plate`/`vehicle_registration_date` (บน card เลือกรถ) | EXTERNAL | `vms_mas_vehicle` | ระบุชื่อตารางถูกในจุดนี้ (ต่างจากจุด WBS ที่เขียนผิด) |
| `mileage` — board เขียน `(vms_trn_repaire)` | **PARTIAL/สับสน** | ไม่มี column ไมล์บน PO/po_vehicle เลย | ชื่อตารางสะกดผิด (`repaire`) และไม่มี FK ไปจริง — เลขไมล์ที่โชว์ตอนนี้ต้องเป็นค่าสด (live) จาก `vms_mas_vehicle` ไม่ใช่ snapshot — ต้องเคาะว่าจะ snapshot หรือใช้ live |
| `po_code`/`purchase_order_number` | DB (partial format) | `.po_number` | format จริง `FormatPONumber` = `{overhaul_code}-{seq}` เช่น `ORZ6900001-01` ตรงกับ sticky #127 ที่เขียนไว้เป๊ะ (`ORZ69000X-01, -02, ...`) — เรื่องนี้ "เคาะแล้ว" ไม่ใช่ gap |
| **มูลค่า PO (บาท)** | **GAP = รหัส E (ของเดิม)** | — | ยืนยันซ้ำ: ไม่มีช่องกรอกใน FigJam เลย และ `CreatePurchaseOrderRequest` (DTO จริง) ก็ไม่มี field นี้เลย — gap ยืนต่อ |
| **วันเริ่ม/สิ้นสุดสัญญา + ประกันบริษัท** | **GAP = รหัส C (ของเดิม)** | — | ยืนยันซ้ำเหมือนกัน ไม่มีทั้งใน FigJam และ DTO |
| ปุ่มบันทึก disable เมื่อ required ไม่ครบ | DB (validation ตรง) | — | ตรงกับ backend ที่ require VendorID/VendorName/VehicleIDs |

**API ที่มีแล้ว**: `POST/GET /overhauls/:id/purchase-orders`, `GET/PUT/DELETE purchaseOrderByIDPath`, `POST /vendors/search` (ตรงกับ curl ที่ sticky แปะไว้เป๊ะ — `pea_vendor_client.go` implement จริงแล้ว ไม่ใช่แค่ sticky ขอไว้)

---

## 3. Scenario 7 — Appointment [IN] (นัดหมายนำรถเข้า overhaul) [PEA-1.23.7][SP07]

**ยืนยันว่า implement ไปแล้วจริงแทบทั้งหมด** — เดาผิดไว้ในรอบ audit ก่อน (ตอนนั้นไม่รู้จัก handler.go) ว่า "ผู้ประสานงาน" กำกวมว่าเป็นฝั่งอู่หรือ กบค. — board เขียนชัดว่า **"ผู้ประสานงาน (กบค.)"** ⇒ ตรงกับ `CoordinatorName/EmpID/Phone/DeptSAP` ใน `appointment.go` เป๊ะ (เป็นพนักงาน กฟภ. ไม่ใช่ฝั่งอู่) — **ความกำกวมเดิมปิดแล้ว**

| field | label | backend |
|---|---|---|
| ช่วงวันนำเข้า | DB | `IntakeAppointment.StartDate/EndDate` |
| ที่อยู่/ชื่ออู่/เบอร์อู่ | DB | `GarageAddress/GarageName/GaragePhone` (prefill จาก vendor search ตาม sticky) |
| ผู้ประสานงาน (กบค.)/เบอร์โทร | DB | `CoordinatorName/CoordinatorEmpID/CoordinatorPhone/CoordinatorDeptSAP` — ดึงจาก `GET /overhaul/coordinators` (userhub) |
| ตอบรับ/ปฏิเสธนัดหมาย | DB | `PATCH .../accept`, `PATCH .../reject` (`IntakeAppointment.Accept()/Reject()`) |
| แก้ไขนัดหมาย (เมื่อยังไม่ตอบรับ) | DB | `PATCH .../response` |
| สถานะ 6 ขั้น (นัดเอารถเข้าอู่→ตรวจรับรถ→ติดตามงานซ่อม→ตรวจสภาพ→นัดรับรถ→ปิดงาน) badge | **PARTIAL** | มีแค่ขั้น "นัดเอารถเข้าอู่" ที่มี backend (intake appointment) — อีก 5 ขั้นเป็น GAP ทั้งหมด (ดูหัวข้อ 4-9) |

**ยังเหลือ gap จริงจาก scenario นี้**: ไม่มี — ปิดครบ ✅

---

## 4. Scenario 8 — Check Pick-up (ตรวจรับรถ) [PEA-1.24.1][SP07]

ไม่มี API/table รองรับเลย — board เขียนไว้ตรงๆว่า **"รายการตรวจสอบ คือเอกสารรับรถใน งานซ่อม ใช้ของเดิมตอนที่นำรถเข้าซ่อมที่ กบค"** และมี text literal `trn_repair_job_uid ของ vms_trn_repair_job` บนบอร์ด — ทีมตั้งใจ**ยืมโครงสร้างจากโดเมนซ่อม (repair) มาใช้** ไม่สร้างของใหม่

| field | label | backend | note |
|---|---|---|---|
| รายการตรวจสอบ (checklist) | **GAP แต่ตั้งใจ reuse** | `vms_mas_repair_job_vehicle_handover_items` + `vms_trn_repair_job_vehicle_handover_form_items` (ของ domain repair) | ไม่มี FK จาก Overhaul ไปตารางนี้เลย — ต้องตัดสินว่าจะสร้างแถว `vms_trn_repair_job` คู่กันไปด้วย (hack) หรือสร้างตารางใหม่เฉพาะ Overhaul ที่มีรูปแบบเดียวกัน → **รหัส I** |
| ลงนามรับรถ (กบค./หน่วยงาน) | GAP (ตั้งใจ reuse) | `vms_trn_repair_job.transferee_signature/recipient_signature` | เดียวกับข้างบน ขึ้นกับการตัดสินใจรหัส I |
| ข้อมูลยานพาหนะ (ทะเบียน/เลขไมล์สะสม/อายุการใช้งาน) | EXTERNAL | `vms_mas_vehicle` | ตรง |

**API**: ไม่มีเลย — ไม่มี route สำหรับ pickup-check ใน `handler.go`

---

## 5. Scenario 9-11 — Follow up (ติดตามงานซ่อม) + Edit + Delete [PEA-1.24.2/3/4][SP07]

ไม่มี table/API รองรับเลยแม้แต่น้อย — เป็น gap ที่สมบูรณ์ที่สุด (0% backend)

| field | label | backend |
|---|---|---|
| รายละเอียดการติดตาม (free text, จำกัด 500 ตัวอักษรตาม sticky #88) | GAP | — |
| วันที่/เวลา | GAP | — |
| หมายเหตุ | GAP | — |
| ลบ (เงื่อนไข: เหลือ 1 รายการ → ลบ column กลับ default stage ตาม sticky #92) | GAP | — |

→ **รหัส J**: ต้องมีตาราง follow-up log ผูกกับ `po_vehicle_uid` เก็บ `detail text(500)`, `logged_at timestamptz`, `note text` — ยังไม่มีแม้แต่ draft migration

**API**: ไม่มีเลย

---

## 6. Scenario 12 — Check Safety [PEA-1.24.5][SP07]

| field | label | backend |
|---|---|---|
| เอกสาร Safety Inspection (upload) | GAP | sticky เขียนไว้ตรงๆว่า "[BE] migration table **trn_po_vehicle_document**" — ทีมรู้ตัวอยู่แล้วว่ายังไม่มี ยังไม่ได้ทำจริง |

→ **รหัส K**: สร้าง `vms_trn_po_vehicle_document` (po_vehicle_uid, file_name/ext/size/path, uploaded_at) — ชื่อตารางทีมเสนอไว้แล้วในบอร์ด ใช้ชื่อนี้ต่อได้เลยเพื่อไม่ต้องเถียงชื่อใหม่

**API**: ไม่มีเลย

---

## 7. Scenario 13 — Appointment (นัดรับรถ / return)

โครงหน้าเหมือน Scenario 7 เป๊ะ (ช่วงวันนำเข้า, ที่อยู่, ชื่ออู่, เบอร์อู่, ผู้ประสานงาน, เบอร์โทร) — สมเหตุสมผลเพราะ backend มี `appointment_type IN ('intake','return')` รองรับทั้งคู่อยู่แล้วใน `vms_trn_overhaul_po_vehicle_appointment`

| field | label | backend | note |
|---|---|---|---|
| ทุก field | **PARTIAL** | ตารางเดียวกับ Scenario 7 แต่ `appointment_type='return'` | โครง DB รองรับแล้ว แต่ **ไม่มี route แยกสำหรับ return** ใน `handler.go` — endpoint ที่มีทั้งหมด (`CreateIntakeAppointment` ฯลฯ) ดูจากชื่อแล้วผูกกับ "intake" โดยเฉพาะ ต้องเช็คกับ dev ว่า endpoint เดิมรับพารามิเตอร์ `appointment_type` เพื่อสร้าง "return" ได้ไหม หรือต้องเพิ่ม endpoint คู่ขนาน |

→ ไม่ตั้งรหัสใหม่ (เป็น PARTIAL ของโครงเดิม ไม่ใช่ gap ศูนย์เปอร์เซ็นต์) แต่ต้องถามให้ชัดก่อน sprint — ดูคำถามข้อ 5 ด้านล่าง

---

## 8. Scenario 14 — Closing work (ปิดงาน)

**⚠️ ไม่ตรงกับทุกเวอร์ชันก่อนหน้าที่เคยไล่มา** — ดูหัวข้อ 9 ด้านล่าง (Figma vs FigJam ไม่ตรงกัน) ก่อนเขียน AC

| field | label | backend |
|---|---|---|
| รายการ (purchase line item) | GAP | — |
| ค่าใช้จ่าย | GAP | — |
| ใบสำคัญจ่ายเลขที่ | GAP | — |
| ปุ่มปิดงาน Enable เมื่อมีรายการจัดซื้ออย่างน้อย 1 รายการ (sticky #26) | GAP (validation ผูกกับ gap ข้างบน) | — |

→ **รหัส L**: ตาราง closing purchase items (po_vehicle_uid หรือ overhaul_job_uid, item_name, cost numeric, payment_voucher_no, created_at) — ยังไม่มีการเสนอชื่อตารางจากทีมเลย ต้องตั้งเอง

**API**: ไม่มีเลย

---

## 9. ⚠️ Figma (design file / app prototype) vs FigJam (refinement board) ไม่ตรงกัน

1. **"ปิดงาน" ความหมายต่างกันคนละเรื่อง** — prototype เก่าที่เคยไล่ไว้ (`app/src/components/overhaul-v2/StepClose.tsx`) ทำ **Safety Inspection Checklist 12 ข้อ + ตั้งวันรับประกัน 180 วัน** แต่ FigJam (ใหม่กว่า, ลงวันที่ 15/14 ต.ค. 2569) แยก Safety ไปเป็น **Scenario 12 ต่างหาก** แล้วให้ "ปิดงาน" (Scenario 14) เป็นแค่ **บันทึกรายการจัดซื้อ/ค่าใช้จ่าย** เท่านั้น ไม่มีประกัน ไม่มี checklist ซ้ำ — **ถ้ายังอ้าง prototype เก่าเขียน AC จะผิดทั้งโครงสเตปและทั้งฟิลด์** ต้องยึด FigJam เป็นหลักเพราะใหม่กว่าและมีเลขที่ตั๋ว (SP07) รองรับ
2. **เลขที่แผน/PO format** — ทั้ง 2 เวอร์ชันเก่า (`overhaulV2.ts` ใช้ `OVH-2569-xxxx`, FigJam mock ใช้ `123456`/`Z69000X`) ไม่ตรงกับของจริง `ORZ690000X` — มีแค่ sticky #127 บนบอร์ดที่เขียน format ถูกไว้แล้ว (`ORZ69000X-01` ฯลฯ) ยึดอันนั้น
3. **เอกสาร 20 (dashboard) สมมติว่า Scenario 14 มี warranty/safety** — ตอนเขียนเอกสาร 20 ยังไม่เห็นบอร์ดนี้ จึงมีช่อง B ("ประกัน กบค. (วัน) ที่ขั้นปิดงาน") ที่อาจจะต้องย้ายไปผูกกับ Scenario 12 (Safety) แทน Scenario 14 (Closing) — ต้องเคาะร่วมกับเจ้าของงานว่าวันเริ่มประกันนับจากขั้นไหนกันแน่
4. design-file dump (`component-overhaul`) **ไม่มี frame สำหรับ Scenario 8-14 เลย** — มีแค่ plan list/form + PO form/list ที่ตรงกับ Scenario 1-6 เท่านั้น ยืนยันว่า Scenario 7 (ซึ่งมี backend เต็มแล้ว) ก็ยังไม่ถูกขึ้นจอจริงในไฟล์ design สักเฟรม — หน้าจอ UI จริงล้าหลังทั้ง backend และ FigJam refinement

---

## 10. ตารางรหัสช่องที่ต้องเพิ่ม (ต่อจาก A-H เดิม)

| รหัส | ขั้นในโฟลว์ | ช่องที่ต้องมี | สถานะ |
|---|---|---|---|
| I | Scenario 8 ตรวจรับรถ | ตัดสินใจ: ยืมตาราง checklist/signature จาก `vms_trn_repair_job` หรือสร้างใหม่เฉพาะ Overhaul | ทีมรู้ตัวว่าต้อง "ใช้ของเดิม" แต่ยังไม่มี FK ผูกจริง |
| J | Scenario 9-11 ติดตามงานซ่อม | ตาราง follow-up log (detail/วันที่/หมายเหตุ ต่อ po_vehicle) | ไม่มีแม้แต่ draft — gap สมบูรณ์ |
| K | Scenario 12 ตรวจ Safety | `vms_trn_po_vehicle_document` (ชื่อจากสติกกี้ทีมเอง) | ทีมเสนอชื่อตารางไว้แล้วในบอร์ด แค่ยังไม่ migrate |
| L | Scenario 14 ปิดงาน | ตาราง closing purchase items (รายการ/ค่าใช้จ่าย/เลขใบสำคัญจ่าย) | ยังไม่มีชื่อตารางเสนอ ต้องตั้งเอง |
| M | Scenario 13 นัดรับรถ | route แยกหรือพารามิเตอร์ `appointment_type=return` บน endpoint เดิม | DB รองรับแล้ว ขาดแค่ชั้น API/route |

---

## 11. คำถามที่ dev จะถามตอน implement — ตอบไว้ล่วงหน้า

**Q1: Scenario 8 (ตรวจรับรถ) จะผูกกับ `vms_trn_repair_job` จริงไหม ต้องสร้างแถว repair job ปลอมขึ้นมาคู่กันหรือเปล่า?**
A: ยังไม่เคาะ — บอร์ดบอกแค่ "ใช้ของเดิม" แต่ไม่มี FK คอลัมน์ใดๆเชื่อม Overhaul ↔ repair job เลย ต้องเลือก 1 ใน 2: (ก) สร้างแถว `vms_trn_repair_job` ให้ Overhaul ยืมใช้ (เสี่ยงข้อมูลปนกันข้าม domain) หรือ (ข) สร้างตาราง checklist/signature แยกสำหรับ Overhaul ที่หน้าตาเหมือนกัน — แนะนำ (ข) เพื่อไม่ผูก domain ข้ามกัน

**Q2: เลขที่ PO/แผนที่โชว์ในทุกหน้าของบอร์ด (`123456`, `PO-690101` ฯลฯ) ต้องตาม format นั้นไหม?**
A: ไม่ต้อง — เป็น placeholder ทั้งหมด format จริงคือ `ORZ690000X` (แผน) และ `{overhaul_code}-{seq}` (PO) ตาม `FormatPlanNo`/`FormatPONumber` ที่ implement แล้ว ยึด sticky #127 ที่เขียน format ถูกไว้เป็นหลัก

**Q3: "ผู้ประสานงาน" ใน Scenario 7/13 คือฝั่งอู่หรือฝั่ง กบค.?**
A: กบค. (พนักงาน กฟภ.) — board เขียนชื่อ field ไว้ชัดว่า "ผู้ประสานงาน (กบค.)" ตรงกับ `CoordinatorName/EmpID` ใน backend ที่ดึงจาก userhub ไม่ใช่ข้อมูลอู่

**Q4: `wbs_number`/`network_no`/`activity_no`/`service_center` ที่บอร์ดเขียนว่าอยู่ใน `(vms_trn_repair_job)` ต้องไปดูตารางนั้นจริงไหม?**
A: ไม่ — เป็นความผิดพลาดในการเขียนบอร์ด (ใช้ template เดิมจากหน้าแจ้งซ่อมแล้วลืมแก้ชื่อตาราง) field พวกนี้ทั้งหมดอยู่ใน `vms_trn_overhaul_job` จริง ควรแจ้งทีมแก้บอร์ดก่อนส่งต่อให้ dev คนอื่นอ่าน

**Q5: Scenario 13 (นัดรับรถ) ใช้ endpoint เดิมของ Scenario 7 ได้ไหม?**
A: โครง DB รองรับ (`appointment_type` เป็น enum 2 ค่าอยู่แล้ว) แต่ `handler.go` ปัจจุบันตั้งชื่อ route ว่า `intake-appointments` ตรงๆ ยังไม่เห็น parameter ให้เลือกชนิด — ต้องถามทีม backend ว่าจะเพิ่ม query param หรือทำ route คู่ขนาน `return-appointments`

**Q6: เลขไมล์ที่โชว์ตอนเลือกรถเข้า PO (`mileage (vms_trn_repaire)`) เป็นค่า snapshot หรือค่าสดจากทะเบียนรถ?**
A: ยังไม่เคาะ — ชื่อตารางที่บอร์ดเขียนพิมพ์ผิดด้วย (`repaire`) ไม่มีคอลัมน์ไมล์บน PO/po_vehicle เลยจริงๆ ของตอนนี้ต้องเป็นค่าสดจาก `vms_mas_vehicle` เท่านั้น ถ้าต้องการ snapshot ณ วันสร้าง PO ต้องเพิ่ม column ใหม่

---

## 12. ยังไม่เคาะ

- Scenario 8: วิธีผูก Overhaul เข้ากับ checklist/signature ของ repair job (ดู Q1 + รหัส I)
- Scenario 13: endpoint แยกหรือ parameter เดิม (ดู Q5 + รหัส M)
- Scenario 14: ชื่อตาราง closing purchase items + ว่าประกัน (รหัส B จากเอกสาร 20) ควรย้ายไปผูกกับ Scenario 12 หรือยังอยู่ Scenario 14
- รวมของเดิมจากเอกสาร 20 ที่ยังไม่เคาะและยังไม่ถูกแก้โดยบอร์ดนี้: วันรับรถคืนจริงกรอกตอนไหน (A), ประกันผลงานบริษัทแยกรายส่วนไหม (C), ค่า Overhaul ต่อคันหารเฉลี่ยหรือกรอกเอง (E), อายุรถนับใหม่หลัง Overhaul ไหม (ผูกกับ A)
