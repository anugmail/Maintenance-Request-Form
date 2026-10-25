/* ============================================================================
   Maintain-D — Overhaul schema annotator
   ------------------------------------------------------------------------
   แปะผลจับคู่ "data schema จริง" ไว้บนหัวคอลัมน์ของตารางที่ overhaul2-plugin สร้าง
   โดยไม่ต้องใช้ MCP / ไม่ต่อเครือข่าย — mapping ทั้งหมดฝังอยู่ในไฟล์นี้

   อ้างอิง (อัปเดต 22 ต.ค. 2569 — ยึดไฟล์นี้เป็นหลักแทนของเดิม):
            Diagram/01-บำรุงรักษาตามวาระ/21-overhaul-full-audit.md
              (audit backend จริง ณ commit ปัจจุบัน cross-check กับ FigJam board "Refinement 15/10/69"
               — ตรวจพบว่าหลาย gap ของรอบก่อนปิดไปแล้วจริง เช่น เบอร์โทร/ที่อยู่อู่ และ "ศูนย์ต้นทุน" ที่จริงๆ
               ไม่ใช่ gap เพราะทีมเคาะแล้วว่าใช้ WBS อย่างเดียว ส่วน Scenario 8-14 ยังไม่มี backend รองรับเลย)
            Diagram/01-บำรุงรักษาตามวาระ/22-recap-เตรียม-refinement-22ตค2569.md
              (สรุปฟิลด์/สิทธิ์/status/toast จากบอร์ด FigJam เดียวกัน มุม BA+Dev — ใช้ชื่อ field ของจริงตามบอร์ด)
            ของเดิมที่ยังอ้างได้ (ไม่ถูกแก้โดย 2 ไฟล์ข้างบน): figma-export/overhaul-plugin-data-schema-map.md
            Diagram/01-บำรุงรักษาตามวาระ/20-overhaul-dashboard-หลัง-overhaul.md (รหัสช่อง A–H ต้นทาง, ต่อด้วย I–L ในเอกสาร 21)

   วิธีใช้: เลือกตาราง (หรือเฟรมที่ครอบหัวตาราง) ในหน้า Figma ที่ overhaul2-plugin สร้างไว้แล้ว
            รันปลั๊กอินนี้ → กด "แปะ schema ที่เลือก" → จะมีป้ายเล็กๆ ใต้หัวคอลัมน์แต่ละอัน
            บอกว่า DB / PARTIAL / GAP / EXTERNAL / NEW / RESOLVED พร้อม table.column ที่เกี่ยวข้อง

   การจับคู่ใช้ "ข้อความหัวคอลัมน์ตรงตัว" (exact match หลังตัดช่องว่างซ้ำ) เทียบกับตาราง SCHEMA
   ด้านล่าง — ถ้าทีมแก้ข้อความหัวคอลัมน์ใน overhaul2-plugin/code.js ต้องมาแก้ key ในตาราง SCHEMA ด้วย
   ============================================================================ */

const TAG_KEY = 'mtd-schema-tag';   // ใส่บนป้ายที่ปลั๊กอินสร้าง เพื่อให้ "ล้างป้าย" หาเจอ
const DATA_KEY = 'mtd-schema';      // ใส่บน node หัวคอลัมน์ต้นทาง เก็บผลจับคู่แบบ machine-readable

const COLOR = {
  DB: { r: 0.09, g: 0.55, b: 0.27 },        // เขียว — มี column จริง ความหมายตรง
  PARTIAL: { r: 0.85, g: 0.55, b: 0.05 },   // ส้ม — มี column แต่ความหมาย/format ไม่ตรงทั้งหมด
  GAP: { r: 0.80, g: 0.15, b: 0.15 },       // แดง — ไม่มี column/ตารางรองรับเลย
  EXTERNAL: { r: 0.25, g: 0.40, b: 0.85 },  // น้ำเงิน — มาจาก vms_mas_vehicle/main-be ไม่ใช่ repo นี้
  NEW: { r: 0.10, g: 0.45, b: 0.60 },       // ฟ้าอมเขียว — ไม่มี column ตรง แต่ query/derive จากตารางลูกที่มีอยู่แล้วได้
  RESOLVED: { r: 0.45, g: 0.45, b: 0.45 },  // เทา — เคยดูเหมือน gap แต่ตรวจซ้ำแล้วไม่ใช่ gap จริง (ทีมเคาะปิดแล้ว)
};

/* ---------- ฐานข้อมูล mapping: key = ข้อความหัวคอลัมน์จริงใน overhaul2-plugin/code.js ---------- */
const SCHEMA = {
  // หน้า 1 — รายการแผน (PLAN_COLS_D / PLAN_COLS_M, แถวจาก PLANS_CF) — อัปเดตจาก 21-overhaul-full-audit.md § 1
  'แผน': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'plan_no + plan_name', note: 'รวม 2 ฟิลด์ไว้บรรทัดเดียว — plan_no format จริงคือ ORZ690000X (FormatPlanNo) บอร์ด FigJam ใช้ placeholder "Z69000X"/"123456" เท่านั้น ไม่ใช่ format จริง' },
  'เลขแผน': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'plan_no', rule: 'แสดงตาม format จริงของระบบ (`ORZ690000X` จาก `FormatPlanNo`) ไม่ใช่ placeholder ที่เห็นในดีไซน์', note: 'format จริง ORZ690000X (FormatPlanNo) — ยืนยันซ้ำใน 21-overhaul-full-audit.md 22 ต.ค. 2569' },
  'เลขที่แผน': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'plan_no', rule: 'แสดงตาม format จริง `ORZ690000X` (`FormatPlanNo`) ไม่ใช่ placeholder ที่เห็นในดีไซน์' },
  'ชื่อแผน': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'plan_name' },
  'หน่วยงาน': { label: 'RESOLVED', table: null, column: null, note: 'ไม่ใช่ gap จริง — Overhaul ทำโดย กบค. หน่วยงานเดียวเสมอ (ค่าคงที่ ไม่ใช่ตัวแปร) ไม่จำเป็นต้องมี column รองรับ (เคาะใน 21-overhaul-full-audit.md 22 ต.ค. 2569 — รอบก่อนเข้าใจผิดว่ายังเป็น gap)' },
  'ประเภทงบ': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — ค่า "งบลงทุน/งบทำการ" ที่โชว์ยังไม่รู้ว่ามาจาก enum ใหม่หรือเป็นค่าคงที่ตายตัว ไม่มี column รองรับเลย', note: 'เดิมกังวล 2 เรื่องรวมกัน — เรื่อง "ศูนย์ต้นทุน" ปิดแล้วจริง (ทีมเคาะว่าใช้ WBS อย่างเดียว ไม่มีศูนย์ต้นทุนแยก, 21-overhaul-full-audit.md 22 ต.ค. 2569) แต่เรื่อง "งบลงทุน/งบทำการ" (ค่าที่โชว์ในคอลัมน์นี้จริงๆของจอ A.1 เช่น "งบลงทุน") ยังเป็น GAP อยู่ — ไม่มี enum/column รองรับ และ 21-overhaul-full-audit.md ไม่ได้ตรวจส่วนนี้เลย ค่าที่เห็นในทุกแถวของ mock เป็น "งบลงทุน" เหมือนกันหมด (เสี่ยงเป็นค่า placeholder ตายตัว ไม่ใช่ query จริง) ต้องเคาะว่ามาจากไหน' },
  'เลขที่งบประมาณ': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'wbs_number', note: 'ยืนยันแล้วว่าเป็นเลข WBS เท่านั้น ไม่มีแบบศูนย์ต้นทุนแยก (21-overhaul-full-audit.md) — ⚠️ บอร์ด FigJam เขียนชื่อตารางกำกับไว้ผิดเป็น "(vms_trn_repair_job)" ของจริงอยู่ vms_trn_overhaul_job (เป็นบั๊กเอกสาร ไม่ใช่ gap จริง) — key นี้เป็นชื่อที่เดาไว้ ของจริงในจอ dump คือ "เลข WBS" และ "เลข WBS (ศูนย์ต้นทุน)" ด้านล่าง เก็บ key นี้ไว้เป็น alias เผื่อจอหน้าอื่นใช้คำนี้' },
  'หมายเลขแผน': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'plan_no', rule: 'แสดงตาม format จริงของระบบ (`ORZ690000X` จาก `FormatPlanNo`) ไม่ใช่ placeholder ที่เห็นในดีไซน์', note: 'ข้อความจริงจากจอ dump (หน้ารายการแผน A.1 และหน้ารายละเอียดแผน B.7) — ไม่ใช่ "เลขแผน"/"เลขที่แผน" ที่เดาไว้แต่เดิม format จริง ORZ690000X (FormatPlanNo)' },
  'เลข WBS': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'wbs_number', note: 'ข้อความจริงจากฟอร์มสร้างแผน (B.1) — ไม่มีคำว่า "(ศูนย์ต้นทุน)" ต่อท้ายแบบหน้ารายละเอียด' },
  'เลข WBS (ศูนย์ต้นทุน)': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'wbs_number', note: 'ข้อความจริงจากหน้ารายละเอียดแผน (B.7) — ป้ายรวมคำว่า "ศูนย์ต้นทุน" ไว้ด้วย ยืนยันแล้วว่าหมายถึง WBS ตัวเดียวกัน ไม่ใช่ช่องแยก (ปิดคำถามเดิมของ AC-S1 ที่ถามว่าเป็นค่าเดียวกันไหม — 21-overhaul-full-audit.md)' },
  'หนังสืออนุมัติหลักการ': { label: 'DB', table: 'vms_mas_overhaul_document', column: 'doc_type = principle_approval', note: 'ตรง 1:1 กับ DocTypePrincipleApproval ใน overhaul_plan.go — ข้อความจริงจากฟอร์มสร้างแผน (B.1) และหน้ารายละเอียด (B.7)' },
  'เอกสารอนุมัติงบ': { label: 'DB', table: 'vms_mas_overhaul_document', column: 'doc_type = budget_approval', note: 'ตรง 1:1 กับ DocTypeBudgetApproval' },
  'เอกสารอื่น ๆ': { label: 'DB', table: 'vms_mas_overhaul_document', column: 'doc_type = other', note: 'ข้อความจริงจากฟอร์มสร้างแผน (B.1) มีเว้นวรรคก่อน "ๆ" — ต่างจาก "อื่นๆ" ไม่เว้นวรรคที่ใช้ในฟอร์ม PO' },
  'อะไหล่ที่ใช้': { label: 'GAP', table: null, column: null, note: 'ส่วนในหน้ารายละเอียดแผน (B.7) — ตาม AC-S1 เป็นแค่การ "จองไว้เฉยๆ" ตาม userflow ไม่ได้ลงรายละเอียด backend เชื่อมกับ Smart Inventory ที่ยังไม่มี API คนละเรื่องกับรายการอะไหล่ปิดงานต่อคัน (รหัส L ของ Scenario 14)' },
  'งบประมาณ (บาท)': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'approved_budget' },
  'วงเงินอนุมัติ (บาท)': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'approved_budget' },
  'งบ': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'approved_budget' },
  'จำนวนรถ': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'overhauled_car_count', note: 'ตรง — ยืนยันซ้ำใน 21-overhaul-full-audit.md 22 ต.ค. 2569' },
  'จำนวนรถที่ Overhaul': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'overhauled_car_count' },
  'ความคืบหน้า (ปิดงานแล้ว)': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — ไม่มีตารางติดตามสถานะรถรายคัน คำนวณอัตราส่วน/จำนวนจริงไม่ได้ในตอนนี้', note: 'ไม่มีตารางติดตามสถานะรถรายคัน — ยังไม่ถูกตรวจซ้ำใน audit 22 ต.ค. 2569 (อิงข้อมูลเดิม)' },
  'ปิดงานแล้ว': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — ไม่มีตารางติดตามสถานะรถรายคัน' },
  'รถรอติดตาม': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — ไม่มีตารางติดตามสถานะรถรายคัน' },
  'สถานะ': { label: 'PARTIAL', table: 'vms_trn_overhaul_job', column: 'plan_status', rule: 'column มีจริงแต่ยังไม่ seed ค่าที่ UI ใช้ (เช่น "รอ PO") — ต้องเพิ่ม enum ค่าก่อน query ได้จริง', note: 'column มีจริงแต่ยังไม่มี seed ค่าที่ UI ใช้จริง — ยืนยันซ้ำใน 21-overhaul-full-audit.md 22 ต.ค. 2569' },
  'วันที่สร้าง': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'created_at' },
  'แก้ไขล่าสุด': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'updated_by + updated_at' },
  'ปีงบประมาณ': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'fiscal_year', rule: 'เลือกได้ตั้งแต่ปีปัจจุบันถึง +10 ปีเท่านั้น (dropdown ไม่ใช่กรอกเอง)', note: 'sticky บอร์ด "ปีปจบ+10ปี" = dropdown เลือกได้ตั้งแต่ปีปัจจุบันถึง +10 ปี (business rule ฝั่ง FE, 21-overhaul-full-audit.md)' },
  'ประจำปีงบประมาณ': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'fiscal_year', rule: 'เลือกได้ตั้งแต่ปีปัจจุบันถึง +10 ปีเท่านั้น (dropdown ไม่ใช่กรอกเอง)', note: 'เดียวกับปีงบประมาณด้านบน' },
  'เลขโครงข่าย': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'network_no', note: 'อยู่บน vms_trn_overhaul_job จริง — ⚠️ บอร์ด FigJam เขียนชื่อตารางกำกับไว้ผิดเป็น "(vms_trn_repair_job)" (21-overhaul-full-audit.md คำถาม Q4) ห้ามเชื่อชื่อตารางที่เขียนบนบอร์ดตรงๆ' },
  'เลขกิจกรรม': { label: 'DB', table: 'vms_trn_overhaul_job', column: 'activity_no', note: 'บอร์ดเขียนชื่อตารางผิดเหมือนกัน ดูหมายเหตุของเลขโครงข่าย' },

  // หน้า 2 — PO (PO_COLS) — อัปเดตจาก 21-overhaul-full-audit.md § 2
  'หมายเลข PO': { label: 'DB', table: 'vms_trn_purchase_order', column: 'po_number', rule: 'แสดงตาม format จริง `{overhaul_code}-{seq}` (`FormatPONumber`) เช่น `ORZ6900001-01` ไม่ใช่ placeholder ที่เห็นในดีไซน์', note: 'format จริง {overhaul_code}-{seq} (FormatPONumber) เช่น ORZ6900001-01 — ตรงกับ sticky #127 บนบอร์ด FigJam เป๊ะ เรื่องนี้เคาะแล้ว ไม่ใช่ gap (21-overhaul-full-audit.md)' },
  'เลขที่ PO': { label: 'DB', table: 'vms_trn_purchase_order', column: 'po_number', rule: 'แสดงตาม format จริง `{overhaul_code}-{seq}` (`FormatPONumber`) ไม่ใช่ placeholder ที่เห็นในดีไซน์' },
  'ชื่อ PO': { label: 'DB', table: 'vms_trn_purchase_order', column: 'po_name' },
  'ชื่อ Purchase Order': { label: 'DB', table: 'vms_trn_purchase_order', column: 'po_name' },
  'ศูนย์บริการ/อู่': { label: 'DB', table: 'vms_trn_purchase_order', column: 'vendor_name (+ vendor_id)' },
  'ความคืบหน้า': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — ไม่มี column/ตารางรองรับทั้งที่หน้ารายการแผน (อัตราส่วนปิดงานแล้ว) และหน้า PO (สถานะ PO)', note: 'เจอได้ 2 บริบท ข้อความเหมือนกันเป๊ะทั้งคู่ (ยืนยันจากจอ dump จริง): (1) หน้ารายการแผน A.1 = อัตราส่วนรถที่ปิดงานแล้ว (เช่น "5/10") ไม่มีตารางติดตามสถานะรถรายคันรองรับ (2) หน้า PO = ไม่มี status column บน vms_trn_purchase_order เลย รหัส C (เอกสาร 20) — ทั้งสองบริบทเป็น GAP เหมือนกัน label จึงไม่ขัดกัน' },
  'ระยะสัญญา': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — ไม่มี column วันเริ่ม/สิ้นสุดสัญญาเลยบน PO', note: 'ไม่มี column วันเริ่ม/สิ้นสุดสัญญาเลย — รหัส C (เอกสาร 20) ยืนยันซ้ำใน 21-overhaul-full-audit.md ("ไม่มีทั้งใน FigJam และ DTO")' },
  'มูลค่า PO (บาท)': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — ไม่มีช่องกรอกนี้เลยทั้งใน FigJam และ DTO จริง', note: 'รหัส E (เอกสาร 20) — ไม่มีช่องกรอกใน FigJam และ CreatePurchaseOrderRequest (DTO จริง) ก็ไม่มี field นี้เลย ยืนยันซ้ำใน 21-overhaul-full-audit.md' },
  'เบอร์โทรอู่': { label: 'DB', table: 'vms_trn_purchase_order', column: 'vendor_telephone / vendor_mobile_phone', note: 'ปิด gap แล้วจริง — migration 20261021100000/20261021110000 เพิ่มคอลัมน์นี้แล้วตามที่ sticky บอร์ดขอไว้ ("ตอนยิง vendor list เก็บที่อยู่ เบอร์โทรมาด้วย") ไม่ต้องทำอะไรเพิ่ม (21-overhaul-full-audit.md 22 ต.ค. 2569) — ข้อความจริงที่ใช้ในหน้ารายละเอียด PO (E.10)' },
  'เบอร์โทร ศูนย์บริการ/อู่': { label: 'DB', table: 'vms_trn_purchase_order', column: 'vendor_telephone / vendor_mobile_phone', note: 'เดียวกับเบอร์โทรอู่ด้านบน แต่เป็นข้อความจริงที่ใช้ในฟอร์มนัดหมาย (H.1, prefill จาก PO) สะกดคนละแบบ มีเว้นวรรค ต้องเก็บทั้ง 2 key' },
  'ที่อยู่': { label: 'DB', table: 'vms_trn_purchase_order', column: 'vendor_address', note: 'ปิด gap แล้วจริงเหมือนเบอร์โทรอู่ด้านบน (migration เดียวกัน)' },
  'ใบสั่งจ้าง': { label: 'DB', table: 'vms_mas_po_document', column: 'doc_type = work_order', note: 'ข้อความจริงจากฟอร์ม PO (E.2) และหน้ารายละเอียด PO (E.10)' },
  'เลือกรถ': { label: 'DB', table: 'vms_trn_po_vehicle', column: 'M:N po↔vehicle', note: 'ข้อความจริงเป็นหัวข้อ section ในฟอร์ม PO (E.2) sticky "ยิงรถทั้งหมดมาก่อนแล้วค่อยค้นหา" = ค้นหาฝั่ง client ไม่ query ทุกครั้ง' },

  // หน้า 3 — รถใน PO (CAR_COLS)
  'ทะเบียน': { label: 'EXTERNAL', table: 'vms_mas_vehicle', column: 'license_plate (ชื่อคอลัมน์ต้องยืนยันกับทีม main-be)' },
  'ยี่ห้อ/รุ่น · ประเภท': { label: 'EXTERNAL', table: 'vms_mas_vehicle', column: 'brand_model / vehicle_type' },
  'ยี่ห้อ/รุ่น': { label: 'EXTERNAL', table: 'vms_mas_vehicle', column: 'brand_model' },
  'หน่วยงานเจ้าของรถ': { label: 'EXTERNAL', table: 'vms_mas_vehicle', column: 'org_unit' },
  'เลขไมล์ (กม.)': { label: 'EXTERNAL', table: 'vms_mas_vehicle', column: 'odometer', note: 'ไม่มี column ไมล์บน PO/po_vehicle เลยจริงๆ (บอร์ด FigJam เขียนชื่อตารางสะกดผิดเป็น "vms_trn_repaire") ต้องใช้ค่าสด (live) จาก vms_mas_vehicle.odometer เท่านั้น ยังไม่เคาะว่าจะเก็บ snapshot ตอนสร้าง PO ไหม (21-overhaul-full-audit.md คำถาม Q6) — รหัส D เดิม' },
  'อายุการใช้งาน': { label: 'EXTERNAL', table: 'vms_mas_vehicle', column: 'computed จาก registration_date' },
  'สถานะงาน': { label: 'PARTIAL', table: 'vms_trn_overhaul_po_vehicle_appointment', column: 'status_id / is_approved / has_responded', note: 'ครอบคลุมเฉพาะสถานะตอบรับ-ปฏิเสธนัด (V2/V3/V8/V9) ส่วน V1/V4-V7/V10/V11 เป็น GAP ไม่มีตารางรองรับ' },
  'รายละเอียดตามสถานะ': { label: 'PARTIAL', table: 'vms_trn_overhaul_po_vehicle_appointment', column: 'coordinator_* / garage_* (ต้องเคาะว่าช่องไหนตรงกับอะไร)' },

  // Scenario 7/13 — นัดหมายนำรถเข้า/รับรถคืน — ใหม่จาก 21-overhaul-full-audit.md § 3 (implement ครบแล้วจริง)
  'ผู้ประสานงาน (กบค.)': { label: 'DB', table: 'vms_trn_overhaul_po_vehicle_appointment (appointment.go)', column: 'CoordinatorName / CoordinatorEmpID / CoordinatorDeptSAP', rule: 'ต้องเลือกจาก search-select ที่ดึงรายชื่อจาก userhub จริง ห้ามพิมพ์เองเป็น free text', note: 'ยืนยันแล้วว่าเป็นฝั่ง กบค. (พนักงาน กฟภ.) ไม่ใช่ฝั่งอู่ ดึงจาก GET /overhaul/coordinators (userhub) — Scenario 7 (นัดนำรถเข้า) implement ครบ API+DB แล้วจริง ไม่มี gap เหลือ (21-overhaul-full-audit.md)' },
  'เบอร์โทรผู้ประสานงาน': { label: 'DB', table: 'vms_trn_overhaul_po_vehicle_appointment (appointment.go)', column: 'CoordinatorPhone', rule: 'ต้อง prefill อัตโนมัติทันทีหลังเลือกชื่อผู้ประสานงาน ห้ามให้กรอกเองซ้ำ', note: 'prefill อัตโนมัติหลังเลือกชื่อผู้ประสานงาน ไม่ให้กรอกเองซ้ำ — key นี้เป็นชื่อย่อที่เดาไว้ ข้อความจริงในจอ dump (H.1) มีคำว่า "(กบค.)" ต่อท้ายด้วย ดู key ด้านล่าง' },
  'เบอร์โทรผู้ประสานงาน (กบค.)': { label: 'DB', table: 'vms_trn_overhaul_po_vehicle_appointment (appointment.go)', column: 'CoordinatorPhone', rule: 'ต้อง prefill อัตโนมัติทันทีหลังเลือกชื่อผู้ประสานงาน ห้ามให้กรอกเองซ้ำ', note: 'ข้อความจริงเต็มจากฟอร์มนัด (H.1) — prefill อัตโนมัติหลังเลือกชื่อผู้ประสานงาน แก้ไม่ได้' },
  'ช่วงวันนำรถเข้า': { label: 'DB', table: 'vms_trn_overhaul_po_vehicle_appointment (appointment.go)', column: 'IntakeAppointment.StartDate / EndDate', rule: 'เลือกวันที่น้อยกว่าวันปัจจุบันไม่ได้', note: 'Scenario 13 (นัดรับรถคืน) ใช้ตารางเดียวกันผ่าน appointment_type=\'return\' แต่ handler.go ปัจจุบันยังไม่มี route แยกสำหรับ return (PARTIAL ที่ชั้น API ไม่ใช่ DB — 21-overhaul-full-audit.md คำถาม Q5, รหัส M)' },
  'ประเภท': { label: 'EXTERNAL', table: 'vms_mas_vehicle', column: 'vehicle_type', note: 'ข้อความจริงจากฟอร์มนัด (H.1) แยกเป็นช่องของตัวเอง (ต่างจาก "ยี่ห้อ/รุ่น · ประเภท" ที่รวมกันในหน้า PO detail) — คำสั้นมาก เสี่ยงชนกับคำว่า "ประเภท" ของฟอร์มอื่นถ้ามี ต้องเช็คตอนใช้จริง' },
  'เลขไมล์สะสม': { label: 'EXTERNAL', table: 'vms_mas_vehicle', column: 'odometer', note: 'ข้อความจริงจากฟอร์มนัด (H.1) ส่วนบนของหน้างานรายคัน ยังไม่ถูกตรวจใน 21-overhaul-full-audit.md โดยตรง น่าจะอ้างคอลัมน์เดียวกับ "เลขไมล์ (กม.)" ของหน้า PO detail' },
  'ชั่วโมงสะสม': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — ยังไม่ยืนยันว่ามี column รองรับบน vms_mas_vehicle หรือไม่', note: 'ชั่วโมงเครื่องยนต์/บูมสะสม (ตามศัพท์โครงการ T6) — ไม่ถูกตรวจใน 21-overhaul-full-audit.md เลย ยังไม่ยืนยันว่ามี column รองรับบน vms_mas_vehicle หรือไม่ ต้องเช็คก่อนพัฒนาจริง' },
  'รูปแบบการซ่อม': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — มี 4 ตัวเลือกบนฟอร์ม ยังไม่ยืนยันว่ามี column รองรับ', note: 'ช่องเลือก 4 ตัวเลือก (เข้าซ่อมที่หน่วยงาน/นัดเข้าสำนักงาน/จัดซ่อมที่หน้างาน/หน่วยงานเดินทางไปซ่อม) บนฟอร์มนัด (H.1) — ไม่ถูกตรวจใน 21-overhaul-full-audit.md เลย ยังไม่ยืนยันว่ามี column รองรับ' },

  // Scenario 8 — ตรวจรับรถ — ใหม่จาก 21-overhaul-full-audit.md § 4 (0% backend, ตั้งใจ reuse โดเมนซ่อม)
  'รายการตรวจสอบ': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — ตั้งใจ reuse checklist จากโดเมนซ่อม แต่ยังไม่มี FK เชื่อม Overhaul เลย (รหัส I)', note: 'ตั้งใจ reuse จากโดเมนซ่อม (vms_mas_repair_job_vehicle_handover_items + vms_trn_repair_job_vehicle_handover_form_items) แต่ยังไม่มี FK เชื่อม Overhaul เลย ต้องตัดสินใจรหัส I (เอกสาร 21): สร้างแถว vms_trn_repair_job ปลอมคู่กัน (เสี่ยงปนข้าม domain) หรือสร้างตารางใหม่เฉพาะ Overhaul ที่หน้าตาเดียวกัน (แนะนำแบบหลัง)' },
  'ลงนามรับรถ': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — เดียวกับรายการตรวจสอบ ยังไม่มี FK ผูกจริง (รหัส I)', note: 'เดียวกับรายการตรวจสอบ — อ้าง vms_trn_repair_job.transferee_signature/recipient_signature ของโดเมนซ่อม ยังไม่มี FK ผูกจริง (รหัส I, 21-overhaul-full-audit.md)' },

  // Scenario 9-11 — ติดตามงานซ่อม — ใหม่จาก 21-overhaul-full-audit.md § 5 (0% backend, gap สมบูรณ์ที่สุด)
  'รายละเอียดการติดตาม': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — 0% backend ไม่มีแม้แต่ draft migration (รหัส J)', note: '0% backend ไม่มีแม้แต่ draft migration — เสนอตาราง follow-up log: po_vehicle_uid, detail text(500) (จำกัด 500 ตัวอักษรตาม sticky #88), logged_at timestamptz, note text — รหัส J (21-overhaul-full-audit.md)' },

  // Scenario 12 — ตรวจ Safety — ใหม่จาก 21-overhaul-full-audit.md § 6 (ทีมเสนอชื่อตารางไว้แล้ว ยังไม่ migrate)
  'เอกสาร Safety Inspection': { label: 'GAP', table: null, column: null, rule: 'ต้องเคาะก่อน — ทีมเสนอชื่อตาราง `vms_trn_po_vehicle_document` ไว้แล้วแต่ยังไม่ migrate จริง (รหัส K)', note: 'ทีมเสนอชื่อตารางไว้แล้วบนบอร์ด: vms_trn_po_vehicle_document (po_vehicle_uid, file_name/ext/size/path, uploaded_at) ยังไม่ migrate จริง — รหัส K (21-overhaul-full-audit.md)' },

  // Scenario 14 — ปิดงาน ⚠️ Figma (design file เก่า, ใช้ทำ AC กลุ่ม O ของ ac-annotator-plugin) กับ FigJam
  // รีไฟน์เมนต์ล่าสุด (ใหม่กว่า+มีเลขตั๋ว ยึดเป็นหลัก) นิยาม "ปิดงาน" ไม่ตรงกัน — ดู 21-overhaul-full-audit.md § 9
  'ชื่ออะไหล่': { label: 'GAP', table: null, column: null, note: '⚠️ จอ Figma เก่าที่ ac-annotator-plugin ใช้ทำ AC กลุ่ม O ใช้คำว่าอะไหล่ แต่บอร์ด FigJam ล่าสุด (15 ต.ค. 2569, authoritative กว่า) นิยามขั้นปิดงานเป็นแค่บันทึกรายการจัดซื้อ/ค่าใช้จ่าย ไม่มีอะไหล่เลย — ต้องเคาะกับเจ้าของงานก่อนว่าจะยึดแบบไหน (21-overhaul-full-audit.md § 9)' },
  'ค่าใช้จ่าย': { label: 'GAP', table: null, column: null, note: 'ตามบอร์ด FigJam ล่าสุด (ไม่ใช่ Figma เก่า) — เสนอตาราง closing purchase items: item_name, cost numeric, payment_voucher_no, created_at ผูกกับ po_vehicle_uid หรือ overhaul_job_uid — รหัส L (21-overhaul-full-audit.md) ทีมยังไม่เสนอชื่อตาราง ต้องตั้งเอง' },
  'ใบสำคัญจ่ายเลขที่': { label: 'GAP', table: null, column: null, note: 'เดียวกับค่าใช้จ่ายด้านบน — field payment_voucher_no รหัส L' },
};

function normalize(s) {
  // .normalize('NFC') ไว้เป็นเซฟตี้เน็ตเฉยๆ (อักษรไทยไม่มี NFD/NFC ต่างกันจริงอยู่แล้ว ตรวจสอบแล้ว 22 ต.ค. 2569
  // ไม่ใช่สาเหตุของปัญหาจับคู่ไม่ครบ) เผื่อ text node มีอักษรละตินปนที่มี normalization form ต่างกัน
  // ถ้ายังจับคู่ไม่ครบหลัง reload ปลั๊กอินแล้ว ให้ใช้ปุ่ม "ดูข้อความจริงที่เลือก (debug)" เทียบ charCode ตรงๆ
  const str = (s || '').replace(/\s+/g, ' ').trim();
  return typeof str.normalize === 'function' ? str.normalize('NFC') : str;
}

/** เดินทุก node ใต้ root หา TEXT ที่ข้อความตรงกับ key ใน SCHEMA แบบเป๊ะ */
function findHeaderTexts(root) {
  const out = [];
  const walk = (n) => {
    if (n.type === 'TEXT') {
      const key = normalize(n.characters);
      if (SCHEMA[key]) out.push({ node: n, key, info: SCHEMA[key] });
    }
    const kids = n.children || [];
    for (const c of kids) walk(c);
  };
  walk(root);
  return out;
}

/* ---------- debug: เดินทุก node ใต้ selection เก็บข้อความสั้นทั้งหมด (ไม่ซ้ำ) มาเทียบกับ SCHEMA
   ทีละตัวพร้อมรหัสอักขระตัวแรก (charCode) ไว้ไดฟ์กรณีข้อความดูเหมือนกันแต่ไม่ match กัน
   (เช่น ช่องว่างปกติ U+0020 vs non-breaking space U+00A0, วงเล็บเต็ม vs วงเล็บครึ่ง) ---------- */
const NOISE = new Set(['Button', 'Supporting text', 'Badge', 'Description', 'Label', 'Helper', 'Filter',
  'Export', 'Action', 'Header', 'Text', 'List item', 'Table title', '(ถ้ามี)', 'Link', 'คัดลอก', 'Item']);

function charCodesHex(s) {
  return Array.from(s).slice(0, 3).map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');
}

function debugListTexts(root) {
  const seen = new Map();
  const walk = (n) => {
    if (n.type === 'TEXT' && n.characters) {
      const key = normalize(n.characters);
      if (key && key.length <= 40 && !NOISE.has(key) && !/^[\d,.\-:/ ]+$/.test(key)) {
        seen.set(key, (seen.get(key) || 0) + 1);
      }
    }
    const kids = n.children || [];
    for (const c of kids) walk(c);
  };
  walk(root);
  const lines = [...seen.keys()].sort().map((k) => (SCHEMA[k] ? '✓ ' : '✗ ') + k + '  [' + charCodesHex(k) + ']');
  return lines;
}

/** สร้างป้ายข้อความเล็กๆ ใต้ node ที่จับคู่ได้ + setPluginData ทั้งป้ายและ node ต้นทาง
 *  วางป้ายไว้ที่ระดับ page เสมอ (ไม่ appendChild เข้า parent ของ node ตรงๆ) เพราะ header cell
 *  ของ overhaul2-plugin เป็น component instance — Plugin API ห้าม appendChild เข้าโครงสร้างภายใน
 *  instance ที่ล็อกไว้ ใช้ absoluteTransform คำนวณพิกัดหน้าแทน จะวางป้ายได้แน่นอนไม่ว่า node จะอยู่ลึกแค่ไหน */
async function tagMatch(match) {
  const { node, key, info } = match;
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  const tag = figma.createText();
  tag.fontName = { family: 'Inter', style: 'Regular' };
  tag.fontSize = 10;
  const parts = [info.label];
  if (info.table) parts.push(info.table + (info.column ? '.' + info.column : ''));
  tag.characters = parts.join(' · ');
  tag.fills = [{ type: 'SOLID', color: COLOR[info.label] || COLOR.GAP }];
  figma.currentPage.appendChild(tag);
  const abs = node.absoluteTransform ? { x: node.absoluteTransform[0][2], y: node.absoluteTransform[1][2] } : { x: node.x, y: node.y };
  tag.x = abs.x;
  tag.y = abs.y + node.height + 2;
  tag.setPluginData(TAG_KEY, '1');
  if (node.setPluginData) {
    node.setPluginData(
      DATA_KEY,
      JSON.stringify({ header: key, label: info.label, table: info.table, column: info.column, note: info.note || '' }),
    );
  }
  return tag;
}

/* ---------- สร้าง AC draft (Rule list + Flow) จากตารางที่เลือก แล้วเขียนลงบน canvas ตรงๆ ----------
   22 ต.ค. 2569 — เปลี่ยนจาก "copy ไปวางที่อื่น" เป็น "เขียน node ขึ้นบนหน้า Figma ข้างเฟรมที่เลือกเลย"
   ตามที่คุยกัน ⇒ เลิกใช้ markdown pipe-table (ไม่มี grid ให้ตรงบรรทัดจริงบน text node ธรรมดา)
   เปลี่ยนเป็น list แบบเลขลำดับ + บรรทัดย่อย Rule/อ้างอิง อ่านง่ายกว่าตอนเป็น text node จริงบน canvas
   - Rule list: 1 แถวต่อ field ที่มี info.rule สั้นๆจริง (ไม่ fallback ไปก๊อป note ยาวๆมาทั้งก้อน)
   - Flow: เก็บไว้เฉพาะ scenario ที่มีจริง (คัดลอกจาก 22-recap-...md) เพราะต้องมีคนไล่ business logic
     ก่อน ไม่มีทางให้ plugin เดา branching เองจาก field อย่างเดียวได้ */
const AC_FLOWS = {
  // 22 ต.ค. 2569: เพิ่มทุก scenario ที่มีอยู่ในเอกสาร 22 (มุม BA/Dev) และตาราง Status×Action×Toast
  // (จาก Google Sheet "MaintainD-Overhaul" แท็บ Overhaul (PEA) 1 draft) ไม่ใช่แค่ scenario7 ตัวเดียว
  // permissions ของทุกตัวเช็คตรงจากคอลัมน์สิทธิ์ของชีตนั้น (แก้ไขใบแจ้งซ่อม/เห็นรถที่แจ้งซ่อม × 3 role)
  // ไม่ใช่เดา — ไล่ครบทุกแถวแล้วพบรูปแบบซ้ำแค่ 4 แบบ: (A) กบค.ทำ คนอื่น view-only (ส่วนใหญ่)
  // (B) หน่วยงานทำ (ตอบรับ/ปฏิเสธนัดหมาย) คนอื่น view-only (C) กบค.ทำ คนอื่นไม่เห็นด้วยซ้ำ (แผนล้วนๆ)
  // (D) ทุกคน view-only ไม่มีใครแก้ไข (สถานะปิดจบแล้ว) — กรย. เขต ไม่มีสิทธิ์แก้ไขเลยสักแถวในทั้งระบบ
  plan13: {
    title: 'Scenario 1-3 — จัดการแผน Overhaul (Create/Edit/Delete Plan)',
    // ba/devFaq: ยกมาจาก 22-recap-...md (มุม BA) และ 21-overhaul-full-audit.md (คำถามที่ dev จะถาม)
    // ตรงๆ — เคยหายไปหมดตอนย้ายมาเป็นปลั๊กอิน (มีแต่ field rule/permission/flow) ผู้ใช้ทักว่า
    // "ไม่ค่อยเป็น AC ของ BA" ต้องมีทั้ง 2 มุม + ช่องโหว่ที่ dev จะถามเสมอ ไม่ใช่แค่มุม dev
    ba: {
      feature: 'วางแผนงาน Overhaul ล่วงหน้าเป็นรายปีงบประมาณ ผูกกับงบ (WBS) ที่อนุมัติไว้แล้ว',
      value: 'ป้องกันการเริ่มงาน Overhaul โดยไม่มีงบรองรับ หรือลืมติดตามว่าใช้งบไปแล้วเท่าไหร่ต่อแผน — เป็นจุดตั้งต้นของทั้งวงจรงาน (ไม่มีแผนก็เปิด PO/นัดหมาย/ตรวจรับรถต่อไม่ได้)',
      roles: 'กบค. (สร้าง/แก้ไข/ลบ) — หน่วยงานเจ้าของรถไม่เกี่ยวกับขั้นนี้',
      ac: [
        'ต้องกรอกครบทุกฟิลด์บังคับก่อนบันทึกได้ ยกเว้น "อื่นๆ (ถ้ามี)"',
        'เลือกปีงบประมาณได้ตั้งแต่ปีปัจจุบันถึง +10 ปี',
        'ต้องแนบ "หนังสืออนุมัติหลักการ" และ "เอกสารอนุมัติงบ" ก่อนบันทึกแผนได้เสมอ (เอกสารอื่นไม่บังคับ)',
        'แก้ไข/ลบแผนต้องมีหน้ายืนยันแยกก่อนทุกครั้ง กันกดพลาด',
        'ปุ่ม "บันทึก" ต้อง disable จนกว่าจะกรอกครบตามเงื่อนไขข้างต้น',
      ],
    },
    devFaq: [
      {
        q: 'เลขที่แผนที่โชว์ในดีไซน์ (เช่น "123456") ต้อง implement ให้ได้เลขแบบนั้นไหม?',
        a: 'ไม่ต้อง — เป็น placeholder ทั้งหมด format จริงของระบบคือ `ORZ690000X` (`FormatPlanNo`) ที่ implement ไว้แล้ว',
      },
      {
        q: 'เลข WBS ที่เขียนกำกับว่าอยู่ตาราง (vms_trn_repair_job) ต้องไปดูตารางนั้นจริงไหม?',
        a: 'ไม่ — เป็นความผิดพลาดในการเขียนบอร์ด (ใช้ template จากหน้าแจ้งซ่อมแล้วลืมแก้ชื่อตาราง) field นี้อยู่ `vms_trn_overhaul_job.wbs_number` จริง',
      },
    ],
    fields: [
      'หมายเลขแผน', 'เลขแผน', 'เลขที่แผน', 'ชื่อแผน', 'หน่วยงาน', 'ประเภทงบ', 'เลขที่งบประมาณ',
      'เลข WBS', 'เลข WBS (ศูนย์ต้นทุน)', 'หนังสืออนุมัติหลักการ', 'เอกสารอนุมัติงบ', 'เอกสารอื่น ๆ',
      'อะไหล่ที่ใช้', 'งบประมาณ (บาท)', 'วงเงินอนุมัติ (บาท)', 'จำนวนรถ', 'จำนวนรถที่ Overhaul',
      'ความคืบหน้า (ปิดงานแล้ว)', 'สถานะ', 'วันที่สร้าง', 'แก้ไขล่าสุด', 'ปีงบประมาณ',
      'ประจำปีงบประมาณ', 'เลขโครงข่าย', 'เลขกิจกรรม',
    ],
    permissions: [
      { role: 'กบค.', can: 'สร้าง/แก้ไข/ลบแผนได้ทุกกรณี — เป็นเจ้าของขั้นนี้คนเดียว' },
      { role: 'หน่วยงานเจ้าของรถ', can: 'ไม่เห็นขั้นนี้เลย (ไม่มีสิทธิ์ view ด้วยซ้ำ) จนกว่าแผนจะมี PO แรก' },
      { role: 'กรย. เขตนั้นๆ', can: 'ไม่เห็นขั้นนี้เลยเหมือนกัน จนกว่าแผนจะมี PO แรก' },
    ],
    steps: [
      {
        when: 'กบค. กด "สร้างแผน Overhaul" กรอกครบแล้วบันทึก',
        then: [
          'status → "รอ PO" (final: รอเลข PO)',
          'toast "สร้างแผน Overhaul {เลขแผน} สำเร็จ"',
          '⚠️ ยังไม่เคาะว่าโชว์เลขแผนตรงๆหรือเปลี่ยนเป็น {ข้อมูลสำคัญ}',
        ],
      },
      { when: 'กบค. กด "แก้ไขแผน" แล้วบันทึก', then: ['status ไม่เปลี่ยน (ยัง "รอ PO")', 'toast "บันทึกการแก้ไขแผนสำเร็จ"'] },
      {
        when: 'กบค. กด "ลบแผน" แล้วยืนยันใน modal',
        then: ['แผนหายจากรายการทันที (soft delete)', 'toast "ลบแผน Overhaul {เลขแผน} สำเร็จ"'],
      },
      { when: 'เปิดลิงก์แก้ไขแผนที่ถูกลบไปแล้ว', then: ['toast error "ไม่พบแผน {เลขแผน}"'] },
    ],
  },
  po46: {
    title: 'Scenario 4-6 — Create/Edit/Delete Purchase Order (PO)',
    ba: {
      feature: 'ผูกรถเข้ากับผู้รับจ้าง (อู่/บริษัท) ภายใต้แผนหนึ่งแผน ผ่าน Purchase Order',
      value: 'ควบคุมว่ารถคันไหนมอบให้อู่ไหนรับผิดชอบซ่อม ภายใต้งบของแผนไหน — ใบ PO เป็นหลักฐานผูกพันกับผู้รับจ้างภายนอก ใช้อ้างอิงตอนตรวจรับงาน/จ่ายเงินได้',
      roles: 'กบค.',
      ac: [
        '1 PO เลือกรถเข้าได้หลายคัน ต้องเห็นจำนวนที่เลือกไว้แล้วชัดเจนตลอดเวลา',
        'ปุ่มบันทึกต้อง disable จนกรอกฟิลด์บังคับครบ',
        'แก้ไข PO แล้วจะย้อนกลับโดยไม่บันทึก ต้องมี confirm เตือนก่อนเสมอ กันข้อมูลที่แก้ไว้หาย',
        'ลบ PO ต้องมีหน้ายืนยันแยกก่อนทุกครั้ง',
      ],
    },
    devFaq: [
      {
        q: 'เลขที่ PO ในดีไซน์ (เช่น "PO-690101") ต้อง implement ตาม format นั้นไหม?',
        a: 'ไม่ต้อง — placeholder เช่นกัน format จริงคือ `{overhaul_code}-{seq}` (`FormatPONumber`) เช่น `ORZ6900001-01`',
      },
      {
        q: 'เลขไมล์ที่โชว์ตอนเลือกรถเข้า PO เป็นค่า snapshot ตอนสร้าง PO หรือค่าสดจากทะเบียนรถ?',
        a: 'ยังไม่เคาะ — ไม่มี column ไมล์บน PO/po_vehicle เลยจริงๆ (ชื่อตารางที่บอร์ดเขียนกำกับไว้ก็พิมพ์ผิดด้วย) ของตอนนี้ต้องเป็นค่าสดจาก `vms_mas_vehicle` เท่านั้น',
      },
    ],
    fields: [
      'หมายเลข PO', 'เลขที่ PO', 'ชื่อ PO', 'ชื่อ Purchase Order', 'ศูนย์บริการ/อู่', 'ความคืบหน้า',
      'ระยะสัญญา', 'มูลค่า PO (บาท)', 'เบอร์โทรอู่', 'เบอร์โทร ศูนย์บริการ/อู่', 'ที่อยู่',
      'ใบสั่งจ้าง', 'เลือกรถ',
    ],
    permissions: [
      { role: 'กบค.', can: 'เพิ่ม/แก้ไข/ลบ PO ได้ทุกกรณี' },
      { role: 'หน่วยงานเจ้าของรถ', can: 'เห็นได้อย่างเดียว — เริ่มเห็นตั้งแต่แผนมี PO แรก' },
      { role: 'กรย. เขตนั้นๆ', can: 'เห็นได้อย่างเดียวเหมือนกัน ตั้งแต่แผนมี PO แรก' },
    ],
    steps: [
      {
        when: 'กบค. เพิ่ม PO สำเร็จ (PO แรกของแผน)',
        then: ['status แผน → "กำลังดำเนินการ" (final: กำลังดำเนินการ PO) — เปลี่ยนจาก "รอ PO"', 'toast "การสร้าง purchase order สำเร็จ"'],
      },
      { when: 'กบค. แก้ไข PO แล้วบันทึก', then: ['status แผนไม่เปลี่ยน', 'toast "บันทึกการแก้ไข PO สำเร็จ"'] },
      { when: 'กบค. ลบ PO (ยังมี PO อื่นเหลือในแผน)', then: ['status แผนยังเป็น "กำลังดำเนินการ"', 'toast "ลบ purchase order สำเร็จ"'] },
      {
        when: 'กบค. ลบ PO ตัวสุดท้าย (เหลือ PO = 0)',
        then: [
          'status แผนย้อนกลับไป "รอ PO" (final: รอเลข PO)',
          'หน่วยงาน/กรย. จะไม่เห็นแผนนี้อีกจนกว่าจะมี PO ใหม่ (กลับไปสิทธิ์แบบ plan13)',
          'toast เดียวกัน "ลบ purchase order สำเร็จ"',
        ],
      },
    ],
  },
  scenario7: {
    title: 'Scenario 7 — นัดหมายนำรถเข้า overhaul',
    // 22 ต.ค. 2569: เพิ่มกลับมา — เคยมีใน AC ที่เขียนมือ (AC-07) ก่อนทำปลั๊กอิน แต่ตกหายตอนย้ายมาเป็น
    // AC_FLOWS เพราะตอนนั้นคิดว่า field-level rule พออยู่แล้ว ที่จริง "ใครทำอะไรได้" เป็นคนละมิติ
    // กับ field validation ต้องเก็บแยกไว้เสมอ ไม่งั้นหายอีกรอบเวลามีคนแก้ steps/rule ต่อ
    ba: {
      feature: 'นัดหมายวัน-ช่วงเวลาที่จะนำรถไปที่อู่ พร้อมแจ้งหน่วยงานเจ้าของรถล่วงหน้าให้ตอบรับ/ปฏิเสธ',
      value: 'ลดเคสนำรถไปอู่ไม่ตรงนัด ข้อมูลผู้ประสานงาน/เบอร์โทรผิดพลาด หรือหน่วยงานไม่รู้ตัวล่วงหน้าว่ารถจะถูกนำไปซ่อม',
      roles: 'กบค. (สร้างนัดหมาย) · หน่วยงานเจ้าของรถ (ตอบรับ/ปฏิเสธ)',
      ac: [
        'ผู้ประสานงาน (ฝั่ง กบค.) ต้องเลือกจากรายชื่อพนักงานจริงในระบบ (ดึงจาก userhub) ไม่ใช่กรอกเองเป็น free text',
        'เบอร์โทรผู้ประสานงานต้อง prefill อัตโนมัติทันทีที่เลือกชื่อ ไม่ให้ผู้ใช้กรอกเองซ้ำ',
        'เลือกวันนำรถเข้าน้อยกว่าวันปัจจุบันไม่ได้',
        'ปุ่ม "ยืนยันนัดหมาย" ต้อง disable จนกรอกครบทุกฟิลด์บังคับ',
        'เมื่อหน่วยงานตอบรับนัดหมายแล้ว ห้ามแก้ไขนัดหมายได้อีก (เห็นได้แค่ preview)',
        'ถ้าหน่วยงานปฏิเสธนัดหมาย ต้องกรอกเหตุผลเสมอ ไม่ปล่อยว่าง',
      ],
    },
    devFaq: [
      {
        q: 'Scenario 8 (ตรวจรับรถ) จะผูกกับ `vms_trn_repair_job` จริงไหม ต้องสร้างแถว repair job ปลอมขึ้นมาคู่กันหรือเปล่า?',
        a: 'ยังไม่เคาะ — บอร์ดบอกแค่ "ใช้ของเดิม" แต่ไม่มี FK คอลัมน์ใดๆเชื่อม Overhaul ↔ repair job เลย ต้องเลือก 1 ใน 2: (ก) สร้างแถว repair job ให้ Overhaul ยืมใช้ (เสี่ยงปนข้าม domain) หรือ (ข) สร้างตารางแยกสำหรับ Overhaul ที่หน้าตาเหมือนกัน — แนะนำ (ข)',
      },
      {
        q: '"ผู้ประสานงาน" คือฝั่งอู่หรือฝั่ง กบค.?',
        a: 'กบค. (พนักงาน กฟภ.) — field ชื่อ "ผู้ประสานงาน (กบค.)" ตรงกับ `CoordinatorName/CoordinatorEmpID` ที่ดึงจาก userhub ไม่ใช่ข้อมูลอู่',
      },
    ],
    fields: ['ผู้ประสานงาน (กบค.)', 'เบอร์โทรผู้ประสานงาน', 'เบอร์โทรผู้ประสานงาน (กบค.)', 'ช่วงวันนำรถเข้า', 'ประเภท', 'เลขไมล์สะสม', 'ชั่วโมงสะสม', 'รูปแบบการซ่อม', 'ทะเบียน'],
    permissions: [
      { role: 'กบค.', can: 'สร้าง/แก้ไขนัดหมายได้ — เฉพาะก่อนหน่วยงานเจ้าของรถตอบรับเท่านั้น' },
      { role: 'หน่วยงานเจ้าของรถ', can: 'ตอบรับ/ปฏิเสธนัดหมายได้เท่านั้น — แก้ไขฟิลด์อื่นในฟอร์มไม่ได้' },
      { role: 'กรย. เขตนั้นๆ', can: 'เห็นได้อย่างเดียวทุกกรณี — กดทำอะไรไม่ได้เลย' },
    ],
    steps: [
      {
        when: 'กบค. กรอกครบตามกฎในตารางด้านบนแล้วกด "ยืนยันนัดหมาย"',
        then: [
          'status → "รอหน่วยงานตอบรับนัดเข้าอู่" (final: รอหน่วยงานตอบรับเข้าอู่)',
          'toast "นัดหมาย {ข้อมูลสำคัญ} สำเร็จ" + notification',
          '⚠️ {ข้อมูลสำคัญ} ยังไม่เคาะว่าโชว์เลขแผนหรือเลข PO',
        ],
      },
      {
        when: 'หน่วยงานกด "ตอบรับ"',
        then: [
          'status → "รอตรวจรับรถ" (final: หน่วยงานตอบรับเข้าอู่แล้ว)',
          'toast "หน่วยงาน {สังกัด} ... ยืนยันนัดหมายแล้ว" + notification',
          'เข้าสู่สถานะล็อก — แก้ไขฟิลด์ใดๆไม่ได้อีก เห็นได้แค่ preview',
        ],
      },
      {
        when: 'หน่วยงานกด "ปฏิเสธ" (ต้องกรอกเหตุผลก่อนเสมอ — ห้ามว่าง)',
        then: [
          'status → "หน่วยงานปฏิเสธนัดเข้าอู่"',
          'toast "หน่วยงาน {สังกัด} ... ปฏิเสธนัดหมาย"',
          'กบค. แก้ไขนัดหมายใหม่ได้ (กลับไปสถานะ "รอหน่วยงานตอบรับนัดเข้าอู่")',
        ],
      },
    ],
  },
  scenario8: {
    title: 'Scenario 8 — Check Pick-up (ตรวจรับรถก่อน Overhaul)',
    ba: {
      feature: 'บันทึกการตรวจสภาพรถตอนรับเข้าอู่ พร้อมลงนามรับรองจากทั้งสองฝ่าย',
      value: 'เป็นหลักฐานยืนยันสภาพรถ ณ วันรับเข้า ป้องกันข้อพิพาทเรื่องสภาพรถเสียหายเพิ่มระหว่างอยู่ที่อู่ (เทียบได้กับ "ใบรับรถ" ของฟีเจอร์แจ้งซ่อมเดิม)',
      roles: 'กบค. + หน่วยงานเจ้าของรถ (ลงนามร่วมกัน)',
      ac: [
        '⚠️ ยังไม่ชัดเจนจากบอร์ด: ต้องติ๊กครบทุกช่อง checklist ก่อนยืนยันได้ไหม',
        '⚠️ ยังไม่ชัดเจนจากบอร์ด: ต้องลงนามครบทั้ง 2 ฝ่ายก่อนยืนยันได้ไหม',
      ],
    },
    devFaq: [
      {
        q: 'Scenario 8 ไม่มี sticky FE/BE ติดอยู่เลย ต่างจาก scenario อื่น แปลว่าไม่ต้องทำหรือเปล่า?',
        a: 'ไม่ใช่ — แปลว่ายังไม่ถูกคุยในระดับ task breakdown เท่านั้น ยังต้องทำ ควรเน้นคุยจุดนี้ในที่ประชุมก่อน เพราะไม่มีใครวาง FE/BE ไว้ให้',
      },
    ],
    fields: ['รายการตรวจสอบ', 'ลงนามรับรถ'],
    permissions: [
      { role: 'กบค.', can: 'กรอก checklist + กดยืนยันรับรถในระบบ' },
      {
        role: 'หน่วยงานเจ้าของรถ',
        can: '⚠️ ร่วมลงนามรับรถจริงหน้างาน แต่ชีตให้สิทธิ์ "แก้ไข" ในระบบกับ กบค. คนเดียว — ต้องเคาะว่าหน่วยงานควรกดยืนยันในระบบได้ด้วยไหม',
      },
      { role: 'กรย. เขตนั้นๆ', can: 'เห็นได้อย่างเดียว' },
    ],
    steps: [
      {
        when: 'กบค. กรอก checklist ครบ + ได้ลายเซ็น 2 ฝั่งแล้วกด "ยืนยันรับรถ"',
        then: ['status → "กำลังซ่อม" (final เดียวกัน)', 'toast "ยืนยันรับรถสำเร็จ" + notification'],
      },
    ],
  },
  scenario911: {
    title: 'Scenario 9-11 — ติดตามงานซ่อม (Follow up) + แก้ไข + ลบ',
    ba: {
      feature: 'บันทึกความคืบหน้างานซ่อมที่อู่เป็นระยะๆ ระหว่างรออู่ซ่อมเสร็จ',
      value: 'กบค. ติดตามสถานะงานได้โดยไม่ต้องโทรถามอู่ซ้ำๆ และมีประวัติย้อนดูได้ว่าอู่รายงานความคืบหน้าอะไรไว้บ้าง เมื่อไหร่',
      roles: 'กบค.',
      ac: [
        'บันทึกความคืบหน้าได้หลายรายการ เรียงใหม่ไปเก่า (รายการล่าสุดอยู่บนสุดเสมอ)',
        'ลบรายการได้เมื่อมีอย่างน้อย 1 รายการอยู่แล้ว',
        'หมายเหตุพิมพ์ได้ไม่เกิน 500 ตัวอักษร',
        'เมื่อกด "ซ่อมสำเร็จ" ถือว่าปิดขั้นติดตามแล้วไปขั้นถัดไป — ย้อนมาดูได้แต่แก้ไขไม่ได้อีก',
      ],
    },
    devFaq: [
      {
        q: 'ลบความคืบหน้าจนเหลือ 0 รายการได้ไหม หรือต้องเหลืออย่างน้อย 1 เสมอ?',
        a: 'ยังไม่เคาะ — บอร์ดเขียนแค่ "มีตั้งแต่ 1 รายการจะสามารถลบได้" ไม่ได้บอกขอบเขตล่าง ต้องถามทีมก่อน implement validation',
      },
    ],
    fields: ['รายละเอียดการติดตาม'],
    permissions: [
      { role: 'กบค.', can: 'เพิ่ม/แก้ไข/ลบความคืบหน้า + กด "ซ่อมสำเร็จ" ได้ทั้งหมด' },
      { role: 'หน่วยงานเจ้าของรถ', can: 'เห็นได้อย่างเดียว' },
      { role: 'กรย. เขตนั้นๆ', can: 'เห็นได้อย่างเดียว' },
    ],
    steps: [
      { when: 'กบค. กด "+ ความคืบหน้า" กรอกแล้วบันทึก', then: ['status ไม่เปลี่ยน (ยัง "กำลังซ่อม")', 'toast "เพิ่มความคืบหน้าสำเร็จ"'] },
      { when: 'กบค. แก้ไขความคืบหน้าเดิม', then: ['toast "แก้ไขความคืบหน้าสำเร็จ"'] },
      {
        when: 'กบค. ลบความคืบหน้า',
        then: ['toast "ลบความคืบหน้าสำเร็จ"', '⚠️ ยังไม่เคาะว่าลบจนเหลือ 0 รายการได้ไหม หรือต้องเหลืออย่างน้อย 1 เสมอ'],
      },
      {
        when: 'กบค. กด "ซ่อมสำเร็จ" (ต้องมี progress ≥1 รายการ)',
        then: ['status → "รอตรวจสภาพ Safety" (final: อยู่ระหว่างตรวจ)', 'toast "บันทึกซ่อมสำเร็จ"'],
      },
    ],
  },
  scenario12: {
    title: 'Scenario 12 — Check Safety (upload เอกสารความปลอดภัย)',
    ba: {
      feature: 'อัปโหลดเอกสารผลตรวจความปลอดภัยของรถก่อนส่งคืนหน่วยงาน',
      value: 'ยืนยันว่ารถผ่านมาตรฐานความปลอดภัยก่อนกลับไปใช้งานจริง ลดความเสี่ยงอุบัติเหตุหลังรับรถคืน และเป็นหลักฐานตรวจสอบย้อนหลังได้',
      roles: 'กบค.',
      ac: [
        'ต้องอัปโหลดเอกสารก่อนยืนยันการตรวจสอบได้ (ไฟล์ pdf/jpeg/png เท่านั้น ไม่เกิน 10 ไฟล์)',
        'ใช้เงื่อนไขการอัปโหลดเดียวกับฟีเจอร์แจ้งซ่อม (ความสม่ำเสมอของระบบ ไม่ต้องตั้งเงื่อนไขใหม่)',
      ],
    },
    devFaq: [
      {
        q: 'มีเงื่อนไขอื่นอีกไหม (เช่น ต้องผ่านทุกข้อในเอกสารก่อนยืนยันได้)?',
        a: 'ไม่มี sticky breakdown FE/BE เหมือน Scenario 8 — ควรคุยในที่ประชุมว่ามีเงื่อนไขอื่นอีกไหมก่อน implement',
      },
    ],
    fields: ['เอกสาร Safety Inspection'],
    permissions: [
      { role: 'กบค.', can: 'อัปโหลดเอกสาร + กดยืนยันการตรวจสอบ' },
      { role: 'หน่วยงานเจ้าของรถ', can: 'เห็นได้อย่างเดียว' },
      { role: 'กรย. เขตนั้นๆ', can: 'เห็นได้อย่างเดียว' },
    ],
    steps: [
      {
        when: 'กบค. อัปโหลดเอกสาร Safety Inspection แล้วกด "ยืนยันการตรวจสอบ"',
        then: ['status → "รอนัดหมายรับรถ" (final: รอนัดหมาย)', 'toast "ยืนยันการตรวจสอบสำเร็จ"'],
      },
    ],
  },
  scenario13: {
    title: 'Scenario 13 — นัดหมายรับรถคืน (reuse flow เดียวกับ Scenario 7)',
    // field เดียวกับ scenario7 เป๊ะ (ฟอร์มเดียวกันจริงตามบอร์ด) — แยกจาก scenario7 ไม่ได้ด้วย field
    // อย่างเดียว ถ้าจะ auto-detect จากหน้าจริงต้องดูบริบทอื่น (เช่น breadcrumb) ไม่ใช่แค่ field เซ็ตนี้
    ba: {
      feature: 'นัดหมายวันรับรถคืนจากอู่ กลับไปใช้งาน — เหมือน Scenario 7 แต่กลับทาง',
      value: 'หน่วยงานเจ้าของรถรู้ล่วงหน้าว่าจะได้รถคืนวันไหน วางแผนใช้งานรถต่อได้',
      roles: 'กบค. (สร้างนัดหมาย) · หน่วยงานเจ้าของรถ (ตอบรับ/ปฏิเสธ)',
      ac: ['เดียวกับ Scenario 7 ทุกข้อ (reuse flow เดิมทั้งหมด — ดู AC ของ scenario7 ประกอบ)'],
    },
    devFaq: [
      {
        q: 'Scenario 13 ใช้ endpoint เดิมของ Scenario 7 ได้ไหม?',
        a: 'โครง DB รองรับ (`appointment_type` เป็น enum 2 ค่าอยู่แล้ว) แต่ `handler.go` ปัจจุบันตั้งชื่อ route ว่า `intake-appointments` ตรงๆ ยังไม่เห็น parameter ให้เลือกชนิด — ต้องถามทีม backend ว่าจะเพิ่ม query param หรือทำ route คู่ขนาน `return-appointments`',
      },
    ],
    fields: ['ผู้ประสานงาน (กบค.)', 'เบอร์โทรผู้ประสานงาน (กบค.)', 'ช่วงวันนำรถเข้า'],
    permissions: [
      { role: 'กบค.', can: 'สร้าง/แก้ไขนัดหมายรับรถคืนได้ — เฉพาะก่อนหน่วยงานเจ้าของรถตอบรับเท่านั้น' },
      { role: 'หน่วยงานเจ้าของรถ', can: 'ตอบรับ/ปฏิเสธนัดหมายได้เท่านั้น — แก้ไขฟิลด์อื่นไม่ได้' },
      { role: 'กรย. เขตนั้นๆ', can: 'เห็นได้อย่างเดียวทุกกรณี' },
    ],
    steps: [
      {
        when: 'กบค. กรอกครบแล้วกด "ยืนยันนัดหมาย" (นัดรับรถคืน)',
        then: ['status → "รอหน่วยงานตอบรับนัดรับรถ" (final: รอหน่วยงานตอบรับรถ)', 'toast "นัดหมาย {ข้อมูลสำคัญ} สำเร็จ" + notification'],
      },
      {
        when: 'หน่วยงานกด "ตอบรับ"',
        then: ['status → "รอปิดงาน" (final: หน่วยงานตอบรับรถแล้ว)', 'toast "หน่วยงาน {สังกัด} ... ยืนยันนัดหมายแล้ว" + notification'],
      },
      {
        when: 'หน่วยงานกด "ปฏิเสธ" (ต้องกรอกเหตุผลก่อนเสมอ)',
        then: ['status → "หน่วยงานปฏิเสธนัดรับรถ"', 'toast "หน่วยงาน {สังกัด} ... ปฏิเสธนัดหมาย"', 'กบค. แก้ไขนัดหมายใหม่ได้'],
      },
    ],
  },
  scenario14: {
    title: 'Scenario 14 — บันทึกอะไหล่และปิดงาน (Closing work)',
    ba: {
      feature: 'บันทึกรายการค่าใช้จ่ายจริงที่เกิดขึ้นระหว่าง Overhaul แล้วปิดงาน',
      value: 'เทียบค่าใช้จ่ายจริงกับงบที่อนุมัติไว้ตอนสร้างแผน (Scenario 1) ปิดวงจรงานอย่างเป็นทางการ มีหลักฐานใบสำคัญจ่ายอ้างอิงได้',
      roles: 'กบค.',
      ac: [
        '(จากชีต) ต้องมีอะไหล่/รายการอย่างน้อย 1 รายการก่อนกดปิดงานได้ — ยืนยันแล้ว ไม่ใช่การเดา',
        '⚠️ ยังไม่ชัดเจน: เลขใบสำคัญจ่ายต้องตรวจสอบกับระบบบัญชีไหม หรือพิมพ์เองได้เลย',
      ],
    },
    devFaq: [
      {
        q: '"ปิดงาน" รวมเรื่องประกัน/Safety ด้วยไหม เหมือน prototype เก่า?',
        a: 'ไม่ — บอร์ด FigJam ล่าสุด (ใหม่กว่า prototype เก่า) แยก Safety ไปเป็น Scenario 12 แล้ว เหลือ Scenario 14 ไว้แค่เรื่องค่าใช้จ่ายอย่างเดียว ไม่มีประกัน/checklist ซ้ำ',
      },
    ],
    fields: ['ชื่ออะไหล่', 'ค่าใช้จ่าย', 'ใบสำคัญจ่ายเลขที่'],
    permissions: [
      { role: 'กบค.', can: 'ระบุอะไหล่ที่ใช้ + กด "ปิดงาน" ได้' },
      { role: 'หน่วยงานเจ้าของรถ', can: 'เห็นได้อย่างเดียว ตลอด (รวมหลังปิดงานแล้ว)' },
      { role: 'กรย. เขตนั้นๆ', can: 'เห็นได้อย่างเดียว ตลอด (รวมหลังปิดงานแล้ว)' },
    ],
    steps: [
      {
        when: 'กบค. ระบุอะไหล่ที่ใช้ (เพิ่มทีละรายการ/นำเข้าไฟล์)',
        then: [
          'status → "รอปิดงาน" (final: อยู่ระหว่างปิดงาน)',
          'toast "นำเข้าไฟล์ {ชื่อไฟล์} สำเร็จ" (ถ้านำเข้าไฟล์ผิดรูปแบบ → ขึ้น validation ไม่ใช่ toast)',
        ],
      },
      {
        when: 'กบค. กด "ปิดงาน" (ต้องมีอะไหล่/รายการ ≥1 รายการ)',
        then: [
          'status → "ปิดงานแล้ว" (final: เสร็จสิ้น)',
          'toast "ปิดงาน {ข้อมูลสำคัญ} เรียบร้อยแล้ว" + notification',
          'ทุกฝ่ายเหลือแค่ "ดูอย่างเดียว" — แก้ไขอะไรไม่ได้อีก',
        ],
      },
    ],
  },
};

/** 1 แถว Rule Table ต่อ field ที่ "มีอะไรให้ยืนยัน" จริง — ไม่ใช่ทุก field ที่จับคู่ได้
 *  หลักการ (แก้ 22 ต.ค. 2569 — รอบแรก copy ทั้ง SCHEMA.note ซึ่งเป็น audit-trail ยาวๆ เข้าไปตรงๆ
 *  อ่านไม่ต่างจาก prose เดิม + field ธรรมดาที่ "แค่โชว์ค่า" ก็ขึ้นมาเกะกะโดยไม่มี rule จริงให้พูด):
 *  - ใช้ info.rule (ประโยคสั้น เขียนไว้เป็น AC rule ตรงๆ) เท่านั้น — ไม่ fallback ไปใช้ note ทั้งก้อน
 *  - field ที่เป็น DB/EXTERNAL/NEW/RESOLVED และไม่มี info.rule = "แสดงค่าตรงไปตรงมา ไม่มี rule พิเศษ" → ข้ามแถว ไม่ใส่ตาราง
 *  - field ที่เป็น GAP/PARTIAL แต่ลืมเขียน info.rule ไว้ (ยังไม่ curate) → ขึ้นเตือนสั้นๆให้ไปเพิ่ม ไม่ dump note ทั้งก้อนมาแทน */
function buildRuleTable(matches) {
  const rows = [];
  const skipped = [];
  for (const m of matches) {
    const { key, info } = m;
    let rule = info.rule || null;
    if (!rule) {
      if (info.label === 'GAP' || info.label === 'PARTIAL') {
        rule = `${info.label} — ยังไม่ได้เขียน rule สั้นไว้ใน SCHEMA.rule (ไปเพิ่มก่อนใช้จริง อย่าเดาจาก note)`;
      } else {
        skipped.push(key);
        continue;
      }
    } else if (info.label === 'GAP' || info.label === 'PARTIAL') {
      rule = '⚠️ ' + rule;
    }
    const ref = info.table ? info.table + (info.column ? '.' + info.column : '') : 'ไม่มี column รองรับ';
    rows.push(`${rows.length + 1}. ${key}  [${info.label}]\n   Rule: ${rule}\n   อ้างอิง: ${ref}`);
  }
  const lines = [];
  if (rows.length) lines.push(rows.join('\n\n'));
  if (skipped.length) {
    lines.push(`(ข้าม ${skipped.length} field ที่แสดงค่าตรงไปตรงมา ไม่มี rule พิเศษ: ${skipped.join(', ')})`);
  }
  return lines.length ? lines.join('\n\n') : null;
}

/** ส่วน Flow — คืนค่าว่างถ้าไม่มี flow นั้นเก็บไว้ (ไม่เดา ไม่สร้างให้) */
function buildFlowSection(flowKey) {
  const flow = AC_FLOWS[flowKey];
  if (!flow) return '';
  const lines = ['', `FLOW — ${flow.title}`, ''];
  flow.steps.forEach((s) => {
    lines.push(`When: ${s.when}`);
    s.then.forEach((t) => lines.push(`  Then: ${t}`));
    lines.push('');
  });
  return lines.join('\n');
}

/** ส่วนสิทธิ์ (ใครดูได้/ทำอะไรได้) — คนละมิติจาก field rule จึงเก็บแยกต่างหากเสมอ
 *  คืนค่าว่างถ้า flow นั้นไม่มี permissions เก็บไว้ (ไม่เดา ไม่สร้างให้) */
function buildPermissionSection(flowKey) {
  const flow = AC_FLOWS[flowKey];
  if (!flow || !flow.permissions || !flow.permissions.length) return '';
  const lines = ['', `สิทธิ์การเข้าถึง — ${flow.title}`, ''];
  flow.permissions.forEach((p) => lines.push(`- ${p.role}: ${p.can}`));
  return lines.join('\n');
}

/** มุม BA (ฟีเจอร์/คุณค่า/ใครใช้/AC ภาษาธุรกิจ) — คนละมิติจาก field rule ของ dev สิ้นเชิง
 *  22 ต.ค. 2569: เพิ่มกลับมา — เคยมีครบในเอกสาร 22 (มุม BA ต่อ scenario) แต่ไม่ได้ย้ายเข้าปลั๊กอิน
 *  ตอนทำ AC_FLOWS รอบแรก มีแต่ field rule/permission/flow ฝั่ง dev ทำให้ผู้ใช้ทักว่า "ไม่ค่อยเป็น AC ของ BA"
 *  คืนค่าว่างถ้า flow นั้นไม่มี ba เก็บไว้ (ไม่เดา ไม่สร้างให้) */
function buildBaSection(flowKey) {
  const flow = AC_FLOWS[flowKey];
  if (!flow || !flow.ba) return '';
  const b = flow.ba;
  const lines = ['', `มุม BA — ${flow.title}`, '', `ฟีเจอร์: ${b.feature}`, `คุณค่าทางธุรกิจ: ${b.value}`, `ใครใช้: ${b.roles}`, '', 'Acceptance criteria (ภาษาธุรกิจ):'];
  b.ac.forEach((a) => lines.push(`- ${a}`));
  return lines.join('\n');
}

/** คำถามที่ dev จะถามตอน implement — ตอบไว้ล่วงหน้าเป็นคู่ๆ (ยกมาจาก 21-overhaul-full-audit.md)
 *  คืนค่าว่างถ้า flow นั้นไม่มี devFaq เก็บไว้ (ไม่เดา ไม่สร้างให้) */
function buildDevFaqSection(flowKey) {
  const flow = AC_FLOWS[flowKey];
  if (!flow || !flow.devFaq || !flow.devFaq.length) return '';
  const lines = ['', `คำถามที่ dev จะถาม — ${flow.title}`, ''];
  flow.devFaq.forEach((f, i) => {
    lines.push(`Q${i + 1}: ${f.q}`);
    lines.push(`A: ${f.a}`);
    lines.push('');
  });
  return lines.join('\n');
}

/** ประกอบ BA + (มุม Dev: Rule list + สิทธิ์ + Flow) + Dev FAQ เป็นข้อความก้อนเดียว
 *  พร้อมเขียนลง text node บน canvas ตรงๆ — ลำดับนี้ตั้งใจ: BA มาก่อนเสมอเพื่อให้คนที่ไม่ใช่ dev
 *  อ่านเจอก่อน ไม่ต้องไล่หา */
function buildAcDraft(matches, flowKey) {
  const dedup = [];
  const seen = new Set();
  for (const m of matches) {
    if (!seen.has(m.key)) {
      seen.add(m.key);
      dedup.push(m);
    }
  }
  if (!dedup.length) return null;
  const ba = buildBaSection(flowKey);
  const table = buildRuleTable(dedup);
  const perms = buildPermissionSection(flowKey);
  const flow = buildFlowSection(flowKey);
  const faq = buildDevFaqSection(flowKey);
  if (!ba && !table && !perms && !flow && !faq) {
    return `AC draft — ${dedup.length} field\n\nไม่มี field ไหนมี rule พิเศษ และไม่ได้เลือก Flow — ไม่มีอะไรให้เขียน AC จากสิ่งที่เลือกนี้`;
  }
  const devHeader = `\nมุม Dev — ${dedup.length} field ที่มี rule พิเศษ\n`;
  return `AC draft — ${dedup.length} field\n${ba}\n${devHeader}${table || 'ไม่มี field ที่มี rule พิเศษในสิ่งที่เลือก'}\n${perms}\n${flow}${faq}`;
}

/** ประกอบ AC draft เต็มของ 1 scenario จาก field ที่ประกาศไว้ตรงใน AC_FLOWS[flowKey].fields
 *  โดยตรง — ไม่ต้องมี selection/หน้า Figma จริงมาจับคู่เลย ใช้โดย "สร้าง AC ทุกหน้า" (generate-ac-all)
 *  ที่ไล่ทุก scenario รวดเดียวโดยไม่ให้ผู้ใช้ต้องเลือกเฟรมทีละอัน */
function buildAcDraftForFlow(flowKey) {
  const flow = AC_FLOWS[flowKey];
  if (!flow) return null;
  const matches = (flow.fields || []).filter((k) => SCHEMA[k]).map((k) => ({ key: k, info: SCHEMA[k] }));
  const draft = buildAcDraft(matches, flowKey);
  if (draft) return draft;
  // กันไว้เฉยๆ — ไม่ควรเกิดเพราะทุก scenario มี fields กำกับไว้แล้วอย่างน้อย 1 คีย์ที่มีจริงใน SCHEMA
  const ba = buildBaSection(flowKey);
  const perms = buildPermissionSection(flowKey);
  const flowText = buildFlowSection(flowKey);
  const faq = buildDevFaqSection(flowKey);
  return `AC draft — ${flow.title}\n${ba}\n(ไม่มี field ที่มี rule พิเศษในรายการของ scenario นี้)\n${perms}\n${flowText}${faq}`;
}

/** สร้าง frame "AC draft" เปล่าๆ (ยังไม่วางตำแหน่ง) — แยกจาก writeAcNode/writeAllAcDrafts
 *  เพื่อให้ทั้งสองทางเลือกตำแหน่งเองได้คนละแบบ (อิง anchor vs เรียงซ้อนคอลัมน์เดียว) */
async function createAcFrame(draftText) {
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  const text = figma.createText();
  text.fontName = { family: 'Inter', style: 'Regular' };
  text.fontSize = 12;
  text.characters = draftText;

  const container = figma.createFrame();
  container.name = 'AC draft';
  container.layoutMode = 'VERTICAL';
  container.paddingTop = 16;
  container.paddingBottom = 16;
  container.paddingLeft = 16;
  container.paddingRight = 16;
  container.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  container.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
  container.strokeWeight = 1;
  container.cornerRadius = 8;
  container.appendChild(text);
  if (text.layoutSizingHorizontal !== undefined) text.layoutSizingHorizontal = 'HUG';
  if (text.layoutSizingVertical !== undefined) text.layoutSizingVertical = 'HUG';
  if (container.layoutSizingHorizontal !== undefined) container.layoutSizingHorizontal = 'HUG';
  if (container.layoutSizingVertical !== undefined) container.layoutSizingVertical = 'HUG';
  container.setPluginData(TAG_KEY, '1');
  return container;
}

/** เขียน AC draft เป็น node จริงบน canvas ข้างๆ สิ่งที่เลือก (ไม่ใช่ copy ไปวางที่อื่น)
 *  ห่อด้วย frame สีขาวมีเส้นขอบให้อ่านง่ายบน canvas ไม่ทะลุพื้นหลัง · tag ด้วย TAG_KEY เดียวกับ
 *  ป้าย schema อื่นๆ เพื่อให้ปุ่ม "ล้างป้ายที่แปะไว้" ลบออกได้ด้วยเหมือนกัน */
async function writeAcNode(draftText, anchorNode) {
  const container = await createAcFrame(draftText);
  figma.currentPage.appendChild(container);
  const abs = anchorNode.absoluteTransform
    ? { x: anchorNode.absoluteTransform[0][2], y: anchorNode.absoluteTransform[1][2] }
    : { x: anchorNode.x, y: anchorNode.y };
  container.x = abs.x + (anchorNode.width || 400) + 40;
  container.y = abs.y;
  return container;
}

/** สร้าง AC draft ของทุก scenario ใน AC_FLOWS รวดเดียว เรียงซ้อนลงมาในคอลัมน์เดียวที่มุมซ้ายบนของหน้า
 *  ปัจจุบัน — ไม่ต้องเลือกอะไรเลย (ต่างจาก generate-ac ที่ต้องเลือกเฟรมทีละอัน) ใช้ตอนอยาก "gen ทุกหน้า
 *  รวดเดียว" ตามที่คุยกัน ตำแหน่งแนวตั้งประมาณจากจำนวนบรรทัดของ draft (บรรทัดละ ~18px) เพราะ mock/Figma
 *  ยังไม่ให้วัดขนาดจริงหลัง auto-layout HUG จนกว่าจะ render — ถ้าทับกันจริงในไฟล์จริง ปรับเลข 18/80 ได้ตรงนี้ */
async function writeAllAcDrafts() {
  let y = 0;
  const created = [];
  for (const key of Object.keys(AC_FLOWS)) {
    const draft = buildAcDraftForFlow(key);
    if (!draft) continue;
    const container = await createAcFrame(draft);
    figma.currentPage.appendChild(container);
    container.x = 0;
    container.y = y;
    created.push({ key, container });
    y += draft.split('\n').length * 18 + 80;
  }
  return created;
}

/** ลบป้ายที่ปลั๊กอินนี้แปะไว้ก่อนหน้า (หา node ที่มี TAG_KEY=1 แล้วลบ) */
function clearTags(root) {
  let n = 0;
  const walk = (node) => {
    const kids = (node.children || []).slice();
    for (const c of kids) {
      if (c.getPluginData && c.getPluginData(TAG_KEY) === '1') {
        c.remove();
        n++;
        continue;
      }
      walk(c);
    }
  };
  walk(root);
  return n;
}

/* ---------- ทางเข้าจริงของปลั๊กอิน (ข้ามส่วนนี้เวลารันเทสใน Node) ---------- */
if (typeof figma !== 'undefined' && figma.showUI) {
  figma.showUI(__html__, { width: 420, height: 560 });

  figma.ui.onmessage = async (msg) => {
    if (msg.type === 'annotate') {
      const sel = figma.currentPage.selection;
      if (!sel.length) {
        figma.ui.postMessage({ type: 'result', ok: false, text: 'ยังไม่ได้เลือกตารางหรือเฟรมในหน้า — เลือกก่อนแล้วกดใหม่' });
        return;
      }
      let created = 0;
      const matchedKeys = [];
      const failed = [];
      for (const root of sel) {
        const matches = findHeaderTexts(root);
        // แปะทีละจุดแบบกันพัง — ถ้าจุดใดจุดหนึ่ง throw (เช่น node พิเศษที่ตั้งค่าไม่ได้) ไม่ให้ทั้ง loop
        // หยุดเงียบๆ จนจุดที่เหลือไม่ถูกแปะเลย (เจอจริง 22 ต.ค. 2569 — debug เจอหลาย ✓ แต่แปะได้จุดเดียว)
        for (const m of matches) {
          try {
            await tagMatch(m);
            created++;
            matchedKeys.push(m.key);
          } catch (e) {
            failed.push(m.key + ' (' + (e && e.message || e) + ')');
          }
        }
      }
      const lines = [];
      if (created) lines.push(`แปะ schema แล้ว ${created} จุด: ${matchedKeys.join(', ')}`);
      if (failed.length) lines.push(`แปะไม่ได้ ${failed.length} จุด: ${failed.join(' | ')}`);
      if (!created && !failed.length) {
        lines.push('ไม่พบหัวคอลัมน์ที่ตรงกับ mapping ในสิ่งที่เลือก — ลองเลือกให้ครอบตารางทั้งก้อน หรือดูรายการที่รองรับด้วยปุ่ม "หัวคอลัมน์ที่รู้จัก"');
      }
      figma.ui.postMessage({ type: 'result', ok: created > 0, text: lines.join('\n') });
    }
    if (msg.type === 'clear') {
      // ป้ายทั้งหมดอยู่ที่ระดับหน้า (ดู tagMatch) — ล้างทั้งหน้าเสมอ ไม่ขึ้นกับ selection
      const total = clearTags(figma.currentPage);
      figma.ui.postMessage({ type: 'result', ok: true, text: `ลบป้าย schema ที่แปะไว้แล้ว ${total} ป้าย` });
    }
    if (msg.type === 'list-known') {
      figma.ui.postMessage({ type: 'known', keys: Object.keys(SCHEMA) });
    }
    if (msg.type === 'generate-ac-all') {
      // ไล่ทุก scenario ใน AC_FLOWS รวดเดียว ไม่ต้องเลือกเฟรมทีละอัน (ตามที่คุยว่าอยาก "gen ทุกหน้า")
      const created = await writeAllAcDrafts();
      figma.ui.postMessage({
        type: 'ac-result',
        ok: created.length > 0,
        text: created.length
          ? `เขียน AC ลงหน้าแล้ว ${created.length} scenario เรียงจากบนลงล่าง: ${created.map((c) => c.key).join(', ')}`
          : 'ไม่มี scenario ไหนสร้าง AC ได้เลย (AC_FLOWS ว่าง)',
      });
    }
    if (msg.type === 'generate-ac') {
      // 22 ต.ค. 2569: เขียน node ขึ้นบน canvas ข้างสิ่งที่เลือกเลย ไม่ใช่ copy ไปวางที่อื่นแบบเดิม
      const sel = figma.currentPage.selection;
      if (!sel.length) {
        figma.ui.postMessage({ type: 'ac-result', ok: false, text: 'ยังไม่ได้เลือกตารางหรือเฟรม — เลือกก่อนแล้วกดใหม่' });
        return;
      }
      const matches = [];
      for (const root of sel) matches.push(...findHeaderTexts(root));
      const draft = buildAcDraft(matches, msg.flow);
      if (!draft) {
        figma.ui.postMessage({
          type: 'ac-result',
          ok: false,
          text: 'ไม่พบหัวคอลัมน์ที่ตรงกับ mapping ในสิ่งที่เลือก — ลองเลือกให้ครอบตารางทั้งก้อน หรือดูรายการที่รองรับด้วยปุ่ม "หัวคอลัมน์ที่รู้จัก"',
        });
        return;
      }
      await writeAcNode(draft, sel[0]);
      figma.ui.postMessage({ type: 'ac-result', ok: true, text: `เขียน AC ลงหน้าแล้ว — ดูเฟรม "AC draft" ข้างสิ่งที่เลือก (${matches.length} field ที่จับคู่ได้)` });
    }
    if (msg.type === 'debug-texts') {
      const sel = figma.currentPage.selection;
      if (!sel.length) {
        figma.ui.postMessage({ type: 'result', ok: false, text: 'ยังไม่ได้เลือกอะไร — เลือกก่อนแล้วกดใหม่' });
        return;
      }
      const lines = [];
      for (const root of sel) lines.push(...debugListTexts(root));
      const uniq = [...new Set(lines)].sort();
      figma.ui.postMessage({
        type: 'result',
        ok: true,
        text: uniq.length
          ? 'ข้อความที่เจอในสิ่งที่เลือก (✓ = ตรง SCHEMA, ✗ = ไม่ตรง — เอา ✗ มาให้ดูได้ถ้าคิดว่าควรตรง):\n' + uniq.join('\n')
          : 'ไม่เจอข้อความที่ดูเหมือนหัวคอลัมน์เลยในสิ่งที่เลือก',
      });
    }
  };
}

/* ---------- export สำหรับเทสบน Node (ไม่กระทบตอนรันจริงใน Figma) ---------- */
if (typeof module !== 'undefined') {
  module.exports = {
    SCHEMA, COLOR, normalize, findHeaderTexts, tagMatch, clearTags, debugListTexts, charCodesHex,
    AC_FLOWS, buildRuleTable, buildFlowSection, buildPermissionSection, buildBaSection, buildDevFaqSection,
    buildAcDraft, buildAcDraftForFlow, createAcFrame, writeAcNode, writeAllAcDrafts,
  };
}
