# Field Mapping — ฟอร์ม "แจ้งซ่อม" (prototype) ↔ `maintain-d-be` (โค้ดจริง)

> ที่มา UI: `mock/Maintenance-Request-Form.html` — modal `#repair-modal` เปิดด้วย `openRepairModal()`
> (โครง HTML บรรทัด 1547–1690, logic ขั้นตอน/validate บรรทัด 3242–3269, payload ตอนส่งจริงดูที่ `submit()` บรรทัด 3270–3303)
> ที่มา Backend: `domain/repair/domain/repair_job.go`, `parts_selection.go`, `symptom_group.go`,
> `models/dto/cost_types.go`, `models/dto/cost_centers.go`, `migrations/*.sql`
> วิธีอ่าน: ✅ = มี column รองรับแล้ว ตรงความหมาย · ⚠️ = มีแต่ไม่ตรง/ไม่ครบ · ❌ = ไม่มีใน backend เลย (gap)

---

## ขั้นที่ 1 — ข้อมูลยานพาหนะและผู้แจ้ง (`section#s1`)

| UI Field | เก็บ state ที่ (prototype) | Data source จริง | Backend field | สถานะ |
|---|---|---|---|---|
| ยานพาหนะ (dropdown) | `S.vehicle` | **ภายนอก** — master รถ (`vms_mas_vehicle`, อยู่ใน `vms-plus-main-be` ไม่ใช่ repo นี้) | `vms_trn_repair_job.mas_vehicle_uid` (FK) + snapshot: `vehicle_license_plate`, `car_type`, `vehicle_brand`, `vehicle_model`, `vehicle_registration_date` (คัดลอกตอนสร้าง ดู `EnrichForCreation`, `repair_job.go:319`) | ✅ |
| สรุปข้อมูลรถ (`#vsum`) | derived จาก `S.vehicle` | เดียวกับข้างบน (read-only, ไม่ใช่ input ใหม่) | เดียวกับข้างบน | ✅ |
| สถานะรถตอนนี้ (ใช้งานได้/ไม่ได้) | `S.usable` boolean | user input | `vehicle_status varchar(50)` | ⚠️ column เป็น free-text ไม่มี CHECK constraint/enum — ต้องเขียน AC บังคับค่าที่ API layer |
| รูปแบบการซ่อม (ซ่อมเอง / ส่ง กรย.) | `S.decision` ('self'\|'kry') | user input | `is_self_repair boolean` | ⚠️ **binary ไม่ตรงกับของจริง** — backend มี `repair_method` enum 5 ค่า (`self`,`forward`,`repair_med`,`repair_ecd`,`forward_med`, ดู `IsValidRepairMethod`, `repair_job.go:26-41`) ต้องคุย BA ว่า 2 ปุ่มใน UI จะ map ไป 5 ค่านี้ยังไง |
| เอกสารแนบ (เฉพาะเลือก "ซ่อมเอง") | `S.selfDocs[]` (name/size/type เท่านั้น ยังไม่มี storage จริงใน mock) | upload ไฟล์จริง | `vms_mas_repair_job_document` โดย `doc_type = service_center_attachment` (ดู `DocTypeServiceCenterAttachment`, คอมเมนต์ตรงกับ "Step 1" เป๊ะ) | ✅ |
| ส่วนที่ต้องการแจ้งซ่อม (ตัวรถ/อุปกรณ์ต่อพ่วง, เลือกได้หลายอัน) | `S.targets[]` ('vehicle'\|'attach') | user input | `vms_trn_repair_job_target(repair_job_uid, target_type)` — `target_type IN ('VEHICLE','EQUIPMENT')` + `equipment_name`/`vehicle_name` | ✅ |
| งบที่ตัด (dropdown) | `S.costType` | **ภายนอก** — lookup `COST_TYPES` ของจริงคือ `vms_ref_cost_type` (`models/dto/cost_types.go`) | `vms_trn_repair_job.cost_type` | ✅ |
| ช่องกรอกตามงบ (ศูนย์ต้นทุน/WBS/Network/Activity/PM Order) | `S.costVals{}` | ศูนย์ต้นทุนมาจาก **ภายนอก** `vms_mas_department` (`models/dto/cost_centers.go`) ส่วน WBS/Network/Activity/PM Order เป็น free text | `cost_center`, `wbs_number`, `network_no`, `activity_no`, `pm_order_no`, `cost_type_other_reason` | ✅ |
| ผู้แจ้งเหตุ (พนักงาน กฟภ. / พนักงานขับรถ) | `S.reporterType` | mock hardcode ชื่อ (`REPORTERS` object) — ของจริงต้องดึงจาก actor/session | พนักงาน กฟภ. → `emp_id`,`full_name`,`dept_sap_short` · พนักงานขับรถ → `driver_name`,`driver_contact_number` | ⚠️ ต้อง AC ชัดว่า "พนักงาน กฟภ." ดึงจาก actor ที่ login (ไม่ใช่เลือกเอง) ตาม `WithActorAndRequesterIdentity` (`repair_job.go:266`) |
| ผู้รับรายงานอุบัติเหตุ (เลือก, optional) | `S.accReceiver` → เก็บเป็น `job.accReceiver` ใน mock | ไม่มีใน backend | **ไม่มี column รองรับเลย** | ❌ **gap** — ถ้า field นี้ยังต้องมีจริง ต้องเพิ่ม migration ใหม่ ก่อนเขียน AC ต้องถาม BA ว่าฟิลด์นี้ยังอยู่ใน scope หรือถูกตัดไปแล้ว (มีคอมเมนต์ในโค้ด prototype บรรทัด 1545-1546 ว่าหน้าจริงตัดหลาย field ออกแล้วหลายรอบ — ฟิลด์นี้อาจเป็นของเก่าที่ควรตัดด้วย) |

---

## ขั้นที่ 2 — อาการเสียและรายละเอียดเหตุการณ์ (`section#s2` + `#sinfo`)

| UI Field | เก็บ state ที่ | Data source จริง | Backend field | สถานะ |
|---|---|---|---|---|
| อาการเสีย (checkbox จัดกลุ่มตามหมวด) | `S.symptoms[]` / `S.symsBy{vehicle,attach}` | **ภายนอก/master** `vms_mas_repair_job_symptom_items` จัดกลุ่มด้วย `vms_ref_repair_job_symptom_category` | บันทึกผลลง `vms_trn_repair_job_symptom_items` (M:N) | ✅ |
| ระบุอาการเอง ("อื่นๆ") | `othtext` (แสดงเมื่อเลือก `OTH`) | user input | `additional_symptom_note` | ✅ |
| เลขไมล์ปัจจุบัน | `#i-odo` | user input | `mileage int` | ✅ |
| ชั่วโมงใช้งานเครื่องจักร/เครน/กระเช้า (label เปลี่ยนตามอุปกรณ์) | `#i-crane` | user input | `crane_usage_hours int` | ✅ |
| รูปภาพเหตุการณ์ | `S.photos` (mock เก็บแค่ count, ไม่มีไฟล์จริง) | upload ไฟล์จริง | `vms_mas_repair_job_document` โดย `doc_type = incident_image` (`DocTypeIncidentImage`, คอมเมนต์ "Step 2" ตรงเป๊ะ) | ✅ |
| หมายเหตุ | `#desc` | user input | `breakdown_description text` | ✅ |

---

## ขั้นที่ 3 — อะไหล่ที่แนะนำ (`section#s3`)

| UI Field | เก็บ state ที่ | Data source จริง | Backend field | สถานะ |
|---|---|---|---|---|
| ค้นหาอะไหล่ | `partsQ` (client filter) | UI only | — | ไม่ต้อง map |
| รายการอะไหล่แนะนำ (ติ๊กเลือก + จำนวน) | `S.bookings{}` (เบิกคลัง) / `S.orders{}` (ต้องจัดซื้อ) / `S.customParts[]` (พิมพ์เอง) | **ภายใน** จับคู่จาก `vms_mas_repair_job_symptom_part` (symptom → part) และ `vms_mas_vehicle_equipment_part` | บันทึกลง `vms_trn_part_requisition` + `vms_trn_part_requisition_item` (รองรับทั้ง `mas_part_uid` และ `external_catalog_item_id` สำหรับของที่ไม่มีรหัส) | ✅ โครงตรงกัน |
| การแบ่ง "เบิกจากคลัง" vs "ต้องจัดซื้อ" อัตโนมัติตามสต็อก (`stock`/`stockAlt` 2 คลัง) | mock เทียบ `need` กับ `stock`/`stockAlt` เอง | ของจริงยังเป็น **mock/stub** — `domain/parts/domain/part.go` มี `StockStatus` (`AVAILABLE/OUT_OF_STOCK/UNKNOWN`) และ flag **`IsMock bool`** ตรงๆในโค้ด | ไม่มี column เก็บจำนวนคงคลังจริงในตารางใดเลย (`vms_mas_part` ไม่มี qty column) | ❌ **gap ใหญ่** — ธุรกิจต้องตัดสินว่า stock check จะมาจาก Smart Inventory API จริงเมื่อไหร่ ตอนนี้ AC ต้องเขียนแบบ "ชี้ชัดว่าใช้ mock stock" ไม่ใช่ real-time |
| ราคาต่อหน่วย + ยอดรวม (เบิกคลัง/จัดซื้อ/รวม, หน่วยบาท) | `PARTS[].price` (mock only) | **ไม่มี field ราคาในตารางใดของ backend เลย** (`vms_mas_part`, `vms_trn_part_requisition_item` ไม่มี `unit_cost`/`price`) | — | ❌ **gap** — ถ้า AC ต้องโชว์ยอดเงินในฟอร์ม ต้องเพิ่ม column ราคาก่อน (ย้อนไปคุยกับ draft spec เดิมที่เสนอ `unit_cost` ไว้ใน `work_part_lines` แต่ยังไม่ถูก implement จริง) |

---

## ส่วนที่ UI "ตัดไปแล้ว" แต่โค้ด backend ยังมี field รองรับอยู่ (เผื่อฟื้นหรือไว้ cross-check)

จากคอมเมนต์ในตัว prototype เอง (บรรทัด 1545-1547, 3147-3148, 3227) เจ้าของงานตัดหลายฟิลด์ออกจากฟอร์มหลายรอบ (7–8 ก.ย. 2569) แต่ backend ยังมี column เหล่านี้พร้อมอยู่ — ถ้า AC จะ "ครบ" ต้องรู้ว่ามีของเหล่านี้ค้างอยู่:

| Backend field | ความหมาย | หมายเหตุ |
|---|---|---|
| `controller_name`, `controller_contact_number` | ชื่อ/เบอร์ช่างคุมรถ | prototype ใส่ hardcode ใน `infoVals()` (`tech.name`) ไม่ได้เป็น input จริง |
| `pea_department_contact_number`, `province_name`, `amphur_name`, `tumbon_name` | ที่อยู่/เบอร์หน่วยงานที่แจ้ง | ถูกตัดออกจากฟอร์มตาม comment บรรทัด 3147 "ฟิลด์ติดต่อ/พื้นที่ถูกตัดจากฟอร์ม" — ของจริงต้องดึงจากทะเบียนรถ/HR แทนให้ user กรอก |
| `appointment_at`, `service_center`, `appointment_start_date/end_date` | นัดหมายซ่อม | ไม่อยู่ในฟอร์มแจ้งซ่อมนี้ — เป็นของขั้นตอนถัดไป (ฝั่ง กบค./กรย. นัดคิว) คนละหน้าจอ |

---

## สรุป gap ที่ต้องเคลียร์ก่อนเขียน AC ฉบับ dev-ready

1. **ผู้รับรายงานอุบัติเหตุ** — ไม่มี column; ต้องถาม BA ว่ายังต้องมีไหม
2. **รูปแบบการซ่อม 2 ปุ่ม vs enum 5 ค่าจริง** — ต้องนิยาม mapping ก่อนเขียน AC เรื่อง routing
3. **ราคา/ยอดเงินอะไหล่** — ไม่มี column เก็บราคาเลยในทุกตารางที่เกี่ยวข้อง
4. **Stock แบบ real-time 2 คลัง (เบิกคลัง/จัดซื้ออัตโนมัติ)** — ของจริงยังเป็น mock (`IsMock: true` ในโค้ด) ไม่ใช่ query สต็อกจริง
5. **สถานะรถ (`vehicle_status`)** — เก็บเป็น free-text ไม่มี enum บังคับ ต้องผนวกไว้ใน AC เรื่อง validation

ต้องการให้ไล่ทำแบบเดียวกันนี้ต่อกับหน้าจอฝั่ง กบค./กรย. (คัดแยกงาน, คิวงาน, นัดหมาย, ปิดงาน) ไหม — ไฟล์เดียวกันมีให้ครบในฟังก์ชัน `inspFormHTML`, `apptFormHTML`, `postInspectFormHTML`, `retnFormHTML` ที่ยังไม่ได้ไล่ (บรรทัด 4309+, 5236+, 5450+, 5597+)
