/* ============================================================================
   Maintain-D — บำรุงรักษาตามวาระ · จอตาม userflow ครบ 18 scenario จาก component จริง (รอบแรก 20 ต.ค. เส้นของ กบค. 9 scenario · รอบสอง 22 ต.ค. อีก 9 scenario ของ ผพจ. ผู้รับจ้าง กรย. หน่วยงาน หัวหน้า · 30 ต.ค. แผนปี + จัดรถรายไตรมาส · S2 อนุมัติทั่วไป · S3 พักไว้ เหลือ 17 scenario)
   ----------------------------------------------------------------------------
   เจ้าของงานสั่ง 20 ต.ค. 2569: "ขึ้น ui figma … แยกออกจากเรื่อง overhaul" และ
   "ลองขึ้นโดยอาศัย component และการ[ออกแบบ]ของ flow อื่น มาประกอบกัน"
   ⇒ ทุกชิ้นเป็น instance: (1) component ไลบรารี (Component) VMS Plus นำเข้าด้วย key · (2) component ที่ทีมออกแบบทำไว้ใน flow งานซ่อม
      ของไฟล์ Maintain-D (local): PartRequestStepPanel (เบิกอะไหล่ Smart Inventory) · IncidentPhotoGallery (ภาพ) · VehicleAndReporterInfo (ข้อมูลรถ) ·
      SummaryRequestedParts (สรุปรายการเบิก) — ไฟล์ที่ไม่มี component เหล่านี้ ปลั๊กอินใช้แบบสำรองจากไลบรารีแล้วรายงาน
   ต้นทาง: Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md · ตารางจับคู่: figma-export/maintainance-component-map.md
   กติกา: figma-export/component-rules.md (R1–R18) · ตารางไม่เกิน 8 คอลัมน์ทุกตาราง (ใช้ component Table ทั้งก้อนได้)
   export (22 ต.ค. 2569 · ปรับให้ตรงเงื่อนไข Overhaul ใน plan.md หัวข้อ 🎯 + component-rules ข้อ 5.1 R19 · ข้อ 5.4 R26):
     ปุ่ม ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component · ป้าย Device Type · 1 scenario = 1 บล็อกตัวอักษร · A.1 A.2 = state
     + ผัง userflow ของ scenario นั้นซ้ายสุดของบล็อก (FLOW_NODES ผูกจอกับกล่องในผัง) · ทุกปุ่มวางบนหน้า "Maintainance" ต่อใต้ของเดิม
   ============================================================================ */

const PLUGIN = { prefix: 'MT', page: 'Maintainance', menu: 'บำรุงรักษาตามวาระ', searchHint: 'ค้นหาเลขที่ MR, ชื่อแผน' };

/* ---------- component ที่ใช้ — ขาดตัวไหนหยุด (ไลบรารี) · NESTED = ชิ้นซ้อนใน component อื่น · LOCAL_OPTIONAL = ของไฟล์ Maintain-D ไม่มีก็ใช้แบบสำรอง ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Table header',
  'Table pagination', 'Text input', 'Input dropdown', 'Input dropdown with badges', 'Text area', 'Number input', 'File upload', 'Input label', 'List with checkbox', 'Alert', 'Pill outline',
  'Primary button', 'Secondary button', 'Secondary danger button', 'Tertiary button', 'Dropdown list', 'Background overlay', 'Modal', 'Notification',
  'Empty state/Data empty', 'Radio text card', 'Images', 'Date picker', 'Checkbox with description',
  'add-24-300-round', 'filter_list-24-400-round', 'more_horiz-20-400-round', 'delete-24-300-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round',
  'cloud_upload-24-300-round', 'stylus-24-300-round', 'quick_reference_all-24-300-round', 'description-24-300-round', 'Dropdown menu',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header', 'Modal footer', 'Tabs', 'Notification card', 'Horizontal radio groups', 'Checkbox text card'];
const NESTED = ['_Dropdown menu item', 'Nav button', 'Tab item', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Primary danger button',
  '_Content item base', '_File upload item base', 'List with checkbox item', 'List header item', 'Checkbox', 'Badge outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Radio button', '_Notification item base', 'Status'];
const LOCAL_OPTIONAL = ['RepairFeedback', 'ReturnPart', 'PartRequestStepPanel', 'PartsInventoryPanel', 'RequestedPartsPanel', 'Spare Part Card Item', 'IncidentPhotoGallery', 'VehicleAndReporterInfo', 'SummaryRequestedParts',
  'ReceiptChecklist', 'HandoverSignature', 'Modal Signature', 'InspectionChecklist',   // รับรถ / ลงนาม / ตรวจสภาพ ของงานซ่อม (S10 · 3 พ.ย. 2569) ไม่มีในไฟล์ → แบบสำรองจากไลบรารี
  'Device Type', 'Component 1', 'Header'];   // Device Type = ป้าย Device/Desktop/Mobile ชุดเดียวกับ Overhaul (22 ต.ค. 2569 · Component 1 = ตัวสำรองชุดเก่า) · Header = แถบรหัส flow ของทีมออกแบบ (ไลบรารีอื่น หาจาก instance ในไฟล์)
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี (ดัมป์ 19 ต.ค. 2569) — ตัวที่ core ยังไม่มี */
/* รูปแบบบรรทัดต้องเหมือน KEYS ใน core ("ชื่อ": ["key", set]) — test harness อ่าน key ด้วย regex จากซอร์ส */
Object.assign(KEYS, {
  "Input dropdown with badges": ["705d2a75bc12121c2c1c0a9737327fbc1ea60696", true],
  "Images": ["39fe2574c3dcfeebe3eded7a76fecbc04ee41ef7", true],
  "Radio text card": ["e4510738f989bb24dbfb70fe6acfbf5705dcd60b", true],
  "Radio button": ["b29b98831c56216e005bb1c403e3f833d5e0f1cf", true],
  "Modal footer": ["78e84b8dfd520b686df45c5219feaf5f64a4bcec", true],
  "description-24-300-round": ["e42bf9bc8971c1449df0a602f3beca96cd3e5b77", false],   // ไอคอนเมนู "ผลการทดสอบน้ำมันไฮโดรลิก" (3 พ.ย. 2569)
  "Horizontal radio groups": ["50c917f3a90caf41227efab4841d0ce003c468dc", false],   // key ของไฟล์ Component (ดัมป์ 19 ต.ค.) · 11d953b1… ที่ UI Release#2 ใช้เป็นไลบรารีอื่น นำเข้าไม่ได้
  "Notification card": ["8b00e80ca7ead162e5de06e8cc261b86d5904c32", false],
  "_Notification item base": ["5e4101e154462cac0b912c28d0499b61f84c3001", false],
  "Status": ["65871480cb419a27224a15825374bc1486ab34d6", true],
  "Checkbox with description": ["dfc323f6bb605f586c4928ecb08c77acfb241f53", false],
  "Rating": ["1d3c2e045977bc6b2b407cdd2c82eb43dc00325a", true],
  "Checkbox text card": ["a29fe414b23f6ac84089cc837b8f2ff06ac561a3", true]
});

/* ---------- ข้อมูลตัวอย่าง (ยกชื่อรถ/หน่วยงาน/จังหวัดจาก maintainance-yearly/mock-yearly.js — ค่าสมมติทั้งหมด) ---------- */
const PST = { review: ['รออนุมัติ', 'Warning'],   // 30 ต.ค. 2569: ส่งอนุมัติทั่วไป ไม่ผ่าน ผพจ.
  returned: ['ส่งกลับแก้ไข', 'Error'], approved: ['อนุมัติแล้ว', 'Brand'], active: ['ดำเนินการ', 'Info'],
  hist: ['รอหัวหน้าตรวจสอบ', 'Warning'], passed: ['ประวัติผ่านแล้ว', 'Success'], closed: ['ปิดงานแล้ว', 'Gray'] };
/* 22 ต.ค. 2569 เจ้าของงาน: ไม่ทำเรื่องยื่นของบ/ทบทวนแผน · เริ่มที่สร้างแผน · เลือกรถตามภาค + ประเภทรถ
   30 ต.ค. 2569 เจ้าของงาน: แผนปี — เลือกปีงบประมาณได้ทุกปี แล้วจัดรถลงไตรมาส · ส่งอนุมัติทั่วไป (ไม่ผ่าน ผพจ.) · ไม่มีเลขงานในระบบ (S3 พักไว้)
   ⇒ ช่องที่ 0 = เลขที่ MR (Maintenance Request) รูปแบบจริงที่เจ้าของงานให้ 30 ต.ค. 2569 "MR Z69000XX" = MR + เขตการไฟฟ้า (Z = สำนักงานใหญ่ ที่ตั้ง กบค.) + ปีที่เลือกตอนสร้างแผน 2 หลัก + ลำดับ 5 หลักนับต่อกันในปีนั้น (ไม่ใช่เลขงาน) · ช่องที่ 3 = ไตรมาสที่กำลังทำ (ขั้น S4 เป็นต้นไปทำรายไตรมาส) · ช่องที่ 8 = ปีงบประมาณ · ช่องที่ 9 = รถรายไตรมาส */
const PLANS = [   // เลขที่ MR · ชื่อแผน · ภาค · ไตรมาสที่กำลังทำ · จำนวนรถ · สถานะ · วันที่สร้าง · ประเภทรถ · ปีงบประมาณ · รถรายไตรมาส
  ['MR Z7000001', 'บำรุงรักษารถกระเช้า ภาค 1 ปีงบประมาณ 2570', 'ภาค 1 (เหนือ)', 'ไตรมาส 1', '12', 'active', '03/10/2569', 'รถกระเช้า', '2570', 'ไตรมาส 1: 6 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 1'],
  ['MR Z7000002', 'บำรุงรักษารถเครน ภาค 2 ปีงบประมาณ 2570', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 2', '8', 'approved', '05/10/2569', 'รถเครน', '2570', 'ไตรมาส 1: 0 · ไตรมาส 2: 4 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MR Z7000003', 'บำรุงรักษารถขุด ภาค 3 ปีงบประมาณ 2570', 'ภาค 3 (กลาง)', 'ไตรมาส 1', '6', 'review', '17/10/2569', 'รถขุด', '2570', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MR Z7100001', 'บำรุงรักษารถกระเช้า ภาค 4 ปีงบประมาณ 2571', 'ภาค 4 (ใต้)', 'ไตรมาส 1', '9', 'returned', '12/10/2569', 'รถกระเช้า', '2571', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MR Z6900011', 'บำรุงรักษารถกระเช้า ภาค 1 ปีงบประมาณ 2569', 'ภาค 1 (เหนือ)', 'ไตรมาส 4', '10', 'closed', '02/06/2568', 'รถกระเช้า', '2569', 'ไตรมาส 1: 3 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 2']];
const NEW_PLAN = ['MR Z7000004', 'บำรุงรักษารถกระเช้า ภาค 2 ปีงบประมาณ 2570', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 1', '6', 'review', '30/10/2569', 'รถกระเช้า', '2570', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 1 · ไตรมาส 4: 0'];
const REGIONS = ['ภาค 1 (เหนือ)', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ภาค 3 (กลาง)', 'ภาค 4 (ใต้)'];
/* เขตภายใต้ภาค (R35 · เจ้าของงาน 2 พ.ย. 2569 "ภาคเหนือ มี 3 เขต เขาก็จะเลือก ภาค แล้วจึงเลือก เขต ภายใต้ภาค แล้วถึงเห็นรถ")
   ค่าย่อและ placeholder "เลือกเขต" ตาม Input dropdown ของหน้า 5.9 EV Charging Station ใน UI Release#2 */
const DISTRICTS = { [REGIONS[0]]: ['กฟน.1', 'กฟน.2', 'กฟน.3'], [REGIONS[1]]: ['กฟฉ.1', 'กฟฉ.2', 'กฟฉ.3'], [REGIONS[2]]: ['กฟก.1', 'กฟก.2', 'กฟก.3'], [REGIONS[3]]: ['กฟต.1', 'กฟต.2', 'กฟต.3'] };
const dCode = (c) => c[2].split(' ')[0];   // รหัสเขตของรถ จากหน่วยงานเจ้าของรถ
/* รถที่เข้าเงื่อนไข ภาค 2 + รถกระเช้า (ค่าสมมติ) — ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานะรถ */
const CAND = [['82-6789 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok'], ['82-1145 ขอนแก่น', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 ขอนแก่น', 'ok'],
  ['82-3302 อุดรธานี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 อุดรธานี', 'ok'], ['82-4410 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok'],
  ['83-1207 อุดรธานี', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟฉ.1 อุดรธานี', 'repair'], ['84-5521 นครราชสีมา', 'Hino FG + กระเช้า Tadano AT-146', 'กฟฉ.3 นครราชสีมา', 'ok'],
  ['85-0918 อุบลราชธานี', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟฉ.2 อุบลราชธานี', 'ok']];
const P = PLANS[0];
const PLAN_KV = [['ชื่อแผน', P[1]], ['ปีงบประมาณ', P[8]], ['ภาค', P[2]], ['ประเภทรถ', P[7]], ['ไตรมาส', P[3]], ['จำนวนรถ', P[4] + ' คัน'], ['เลขที่ MR', P[0]], ['ผู้สร้างแผน', 'นายวิชัย ทองดี (กบค.)'], ['วันที่สร้าง', P[6]], ['อนุมัติเมื่อ', '08/10/2569']];
const VST = { ok: ['ปกติ', 'Success'], repair: ['ซ่อม', 'Warning'], transfer: ['โอน', 'Error'], dispose: ['รอยุบ', 'Error'] };
const RDY = { ready: ['พร้อม', 'Success'], notready: ['ไม่พร้อม', 'Error'], pending: ['ยังไม่ตอบ', 'Gray'] };
const VEH = [   // ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานะรถ · ความพร้อม
  ['82-6789 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok', 'ready'],
  ['82-1145 ขอนแก่น', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 ขอนแก่น', 'ok', 'ready'],
  ['80-5738 น่าน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.2 น่าน', 'repair', 'notready'],
  ['81-2210 เชียงใหม่', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.1 เชียงใหม่', 'transfer', 'pending'],
  ['80-9981 ลำปาง', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟน.1 ลำปาง', 'ok', 'ready'],
  ['82-3302 อุดรธานี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 อุดรธานี', 'ok', 'pending']];
const V = VEH[0];
const NOW_Q = P[3], NOW_CARS = VEH.length;   // ไตรมาสที่กำลังทำ · รถของไตรมาส (ไม่มีขั้นนำรถออกแล้ว 2 พ.ย. 2569)
const VEH_KV = [['ทะเบียน', V[0]], ['ยี่ห้อ/รุ่น', V[1]], ['ประเภท', 'รถกระเช้า'], ['หน่วยงานเจ้าของรถ', V[2]], ['เลขไมล์สะสม', '182,400 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,120 ชม.'], ['แผน', P[0]], ['แผนเดินทาง', 'ตรวจรถ ขอนแก่น อุดรธานี ลำปาง · 03–07/11/2569']];
const PSTAT = { ok: ['พร้อม', 'Success'], short: ['ขาด', 'Error'], reserved: ['จองแล้ว', 'Info'] };
/* จำนวนตามแผน = ของไตรมาส 1 ในแผนตัวอย่าง (S4 ขึ้นไปทำรายไตรมาส) รถ 6 คัน · เปลี่ยนน้ำมัน 2 คัน · ไส้กรองเชื้อเพลิง 2 คัน · 2 พ.ย. 2569 ตัดการนำรถออกที่ S4 แล้ว */
const PARTS = [   // รายการ · รหัส · หมวด · จำนวนตามแผน · หน่วย · คงเหลือ · สถานะเมื่อจอง
  ['น้ำมันไฮโดรลิก ISO VG 46', 'OL-0011', 'น้ำมัน', '60', 'ลิตร', '420', 'ok'],
  ['ไส้กรองไฮโดรลิก', 'FL-0022', 'ไส้กรอง', '12', 'ชิ้น', '3', 'short'],
  ['ไส้กรองน้ำมันเครื่อง', 'FL-0031', 'ไส้กรอง', '12', 'ชิ้น', '40', 'ok'],
  ['ไส้กรองอากาศ', 'FL-0040', 'ไส้กรอง', '12', 'ชิ้น', '60', 'ok'],
  ['ไส้กรองเชื้อเพลิง', 'FL-0052', 'ไส้กรอง', '4', 'ชิ้น', '1', 'short']];
/* อะไหล่แบบงานซ่อม (22 ต.ค. 2569 "ปรับอะไหล่ให้สอดคล้องกับงานซ่อม"): คลัง 2 แบบ Smart Inventory / คลังสำรอง · ราคาต่อหน่วย (ค่าสมมติ) ·
   จำนวนตามแผนเกินคงเหลือ = ซื้อเพิ่มส่วนต่าง + เลือกผู้จัดซื้อ · ผู้จัดซื้อในบำรุงรักษา = Smart Inventory หรือ ผพจ. (S3) แทน "กบค." ของงานซ่อม — รอเคาะ */
const WH = ['Smart Inventory', 'Smart Inventory', 'Smart Inventory', 'คลังสำรอง', 'คลังสำรอง'];
const PRICE = [120, 680, 250, 420, 350];
const BUYER = ['Smart Inventory', 'ผพจ.'];
const BUYER_OF = { 1: 0, 4: 1 };   // อะไหล่ที่ขาด → ผู้จัดซื้อที่เลือกไว้ (ไส้กรองไฮโดรลิก = Smart Inventory · ไส้กรองเชื้อเพลิง = ผพจ.)
const baht = (n) => n.toLocaleString('en-US') + ' บาท';
const shortOf = (i) => Math.max(0, +PARTS[i][3] - +PARTS[i][5]);
const TST = { sent: ['ส่งแจ้งแล้ว', 'Info'], done: ['ดำเนินการแล้ว', 'Success'], review: ['รออนุมัติ', 'Warning'], approved: ['อนุมัติแล้ว', 'Success'], returned: ['ส่งกลับแก้ไข', 'Error'] };   // 3 พ.ย. 2569 แผนเดินทางต้องอนุมัติ (S7) · ชื่อตามสถานะแผน S2
const TRIP = { place: 'จุดรวมงาน กฟฉ.1 ขอนแก่น', d1: '03/11/2569', d2: '07/11/2569', staff: ['นายวิชัย ทองดี', 'นางสาวกนกวรรณ ใจมั่น', 'นายสมชาย พูลสุข'], perDiem: '7,200', lodging: '9,600', travel: '4,850' };
/* S6 สถานที่รายคัน (เจ้าของงาน 2 พ.ย. 2569): ค่าเริ่มต้น = สำนักงานที่รถคันนั้นอยู่ (หน่วยงานเจ้าของรถ) แก้ได้ทีละคัน · TRIP.place ยังใช้กับ S9 S10 ที่ยังไม่ได้รีวิวรอบนี้
   3 พ.ย. 2569 เจ้าของงาน: ตัวอย่างรถในไตรมาส 10 คัน เฉพาะ S6 (S1 S2 S4 ยังเป็นไตรมาส 1 = 6 คันตามที่รีวิวแล้ว) · 1 ไตรมาสมีแผนเดินทางหลายใบ รถไม่ซ้ำกัน */
const TRIP_CARS = VEH.map(v => [v[0], v[1], v[2]]).concat([
  ['82-7720 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น'],
  ['80-3316 พะเยา', 'Hino FC + กระเช้า Tadano AT-100', 'กฟน.1 พะเยา'],
  ['81-6604 เชียงราย', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.1 เชียงราย'],
  ['80-4458 แพร่', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.2 แพร่']]);
const TRIP_KV = PLAN_KV.map(([k, v]) => k === 'ไตรมาส' ? [k, v + ' (' + TRIP_CARS.length + ' คัน)'] : [k, v]);
const TRIP_SEL = [0, 1, 4, 5], TRIP_LOCS = { 4: 'จุดรวมงาน กฟน.1 ลำปาง' };
const tripLoc = (i, locs) => (locs || {})[i] || 'สำนักงาน ' + TRIP_CARS[i][2];
/* เบอร์ติดต่อรายคัน (3 พ.ย. 2569 เจ้าของงาน "เพิ่มคอลัมน์เบอร์ติดต่อในหน้ารถที่เลือกแล้ว โดยเบอร์เป็นเบอร์ของเจ้าของรถ และตอนกดแก้ไข อยากเพิ่มการแก้ไขเบอร์โทร และสถานที่นัดได้")
   ค่าเริ่มต้น = เบอร์เจ้าของรถจากข้อมูลรถ · แก้ได้ทีละคันใน popup เดียวกับสถานที่ · คอลัมน์ตามหน้า MA Appointment ของ UI Release#2 ("เบอร์ติดต่อ") */
const OWNER_PH = ['081-472-3365', '081-472-3365', '054-710-224', '053-241-560', '089-635-1172', '042-221-908', '043-246-118', '054-411-737', '053-711-402', '054-511-226'];
const TRIP_PHONES = { 4: '086-552-1904' }, TRIP_V_LOCS = { 6: 'ศูนย์บริการผู้รับจ้าง สาขาขอนแก่น' }, TRIP_V_PHONES = { 6: '095-118-4420' };
const tripPhone = (i, ph) => (ph || {})[i] || OWNER_PH[i];
const tripPhoneCell = (i, ph) => (ph || {})[i] ? { text: tripPhone(i, ph), sub: 'แก้จากเบอร์เจ้าของรถ' } : tripPhone(i, ph);
const TRIP_ALL = TRIP_CARS.map((_, i) => i), TRIP_REST = TRIP_ALL.filter(i => TRIP_SEL.indexOf(i) < 0);   // ใบแรกใช้ TRIP_SEL · ใบถัดไปเลือกได้เฉพาะที่เหลือ
/* ชื่อแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "ตอนสร้างแผนการเดินทางอยากให้ตั้งชื่อแผนได้ด้วย") — ผู้ใช้ตั้งเอง แสดงแทน "แผนเดินทาง k" ในหน้าแผนเดินทาง */
const TRIP_1 = { name: 'ตรวจรถ ขอนแก่น อุดรธานี ลำปาง', sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, d1: TRIP.d1, d2: TRIP.d2, st: 'review' }, TRIP_2 = { name: 'ตรวจรถ น่าน เชียงใหม่ เชียงราย', sel: TRIP_REST, locs: {}, phones: {}, d1: '17/11/2569', d2: '21/11/2569', st: 'review' };
const tripAs = (t, st) => Object.assign({}, t, { st });
/* S9 แผนเดินทางจ้างดำเนินการ (3 พ.ย. 2569 เจ้าของงาน "ตอนที่ทำ e2 อยากให้มีการเลือกว่า กบค ดำเนินการเอง หรือ จ้างดำเนินการ และพอเลือกจ้างดำเนินการ ก็มีให้เลือก vendor list")
   ฟอร์มเดียวกับ S6 · จ้าง = ผู้รับจ้าง (vendor list) + เลขที่สัญญา/ใบสั่งจ้าง + รถ + สถานที่รายคัน + ช่วงวันทำงาน · ไม่มีพนักงาน กบค. และค่าใช้จ่าย */
const VENDORS = [['บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด', 'รถกระเช้า · รถเครน'], ['หจก. ช่างกลภาคอีสาน', 'รถกระเช้า'], ['บริษัท เครนเทค เอ็นจิเนียริ่ง จำกัด', 'รถเครน'], ['หจก. ล้านนาไฮดรอลิก', 'รถกระเช้า · รถขุด']];
const TRIP_V = { name: 'จ้างบำรุงรักษา น่าน เชียงใหม่ เชียงราย', vendor: VENDORS[0][0], contract: 'สจ.69-0142', sel: TRIP_REST, locs: TRIP_V_LOCS, phones: TRIP_V_PHONES, d1: '17/11/2569', d2: '21/11/2569', st: 'review' };
const tripBy = (t) => t.vendor || 'กบค. (ดำเนินการเอง)';
const TRIP_RETURN = 'ช่วงวันที่ 03 ถึง 07/11/2569 ตรงกับแผนดับไฟของ กฟฉ.1 ขอนแก่น กรุณาเลื่อนเป็นสัปดาห์ถัดไป';
const WORK = [   // รายการงาน · อะไหล่ · ตามแผน · ใช้จริง · หน่วย
  ['เปลี่ยนน้ำมันไฮโดรลิก', 'น้ำมันไฮโดรลิก ISO VG 46', '30', '30', 'ลิตร'],
  ['เปลี่ยนไส้กรองไฮโดรลิก', 'ไส้กรองไฮโดรลิก', '2', '2', 'ชิ้น'],
  ['เปลี่ยนไส้กรองน้ำมันเครื่อง', 'ไส้กรองน้ำมันเครื่อง', '2', '2', 'ชิ้น'],
  ['เปลี่ยนไส้กรองอากาศ', 'ไส้กรองอากาศ', '2', '1', 'ชิ้น']];
const BEFORE = ['รูปรถ + ทะเบียน', 'อะไหล่ใหม่'];
const AFTER = ['รูปรถ + ทะเบียน', 'อะไหล่เก่า', 'อะไหล่ใหม่ที่เหลือ', 'จุดที่บำรุงรักษา (อะไหล่ใหม่)'];
/* S10 สถานะงานรายคัน (3 พ.ย. 2569 เจ้าของงานเลือก "ทำทีละขั้น") ตามชื่อสถานะงานของหน้า RP & MA Job ของ UI Release#2 (นัดหมายแล้ว → อยู่ระหว่างซ่อม → เสร็จสิ้น / ยกเลิก) */
const WSTAT = { todo: ['ยังไม่เริ่ม', 'Gray'], doing: ['อยู่ระหว่างบำรุงรักษา', 'Warning'], done: ['เสร็จสิ้น', 'Success'], cannot: ['บำรุงรักษาไม่ได้', 'Error'],
  // แผนจ้างดำเนินการ (3 พ.ย. 2569 รอบ 2 เจ้าของงาน "เห็นสถานะ ว่ารถคันนั้น ดำเนินการบำรุงรักษาแล้ว ปุ่มจะแสดงให้ส่งตรวจงาน") · สีป้ายเสนอ: ยังไม่ส่ง Info · รอตรวจรับ Warning แบบ "รออนุมัติ" ของแผน
  worked: ['ดำเนินการบำรุงรักษาแล้ว', 'Info'], reported: ['แจ้งบำรุงรักษาไม่ได้', 'Info'], wait: ['รอตรวจรับ', 'Warning'], returned: ['ส่งกลับแก้ไข', 'Error'] };
const ACC = { wait: ['รอหน่วยงานยอมรับ', 'Warning'], ok: ['หน่วยงานยอมรับแล้ว', 'Success'] };
const pdf = (name, size) => ({ name, size: size || '1.2 MB' });
const jpg = (name) => ({ name: name + '.jpg', size: '2.4 MB' });

/* ---------- ตัวช่วยเฉพาะเรื่อง ---------- */
/* หน้า Detail (หัว "หมายเลขแผน …") ใช้ Section label ตาม R5/R11 · หน้า Create/Edit ใช้ Section header ตาม R3 */
async function detail(name, o) {
  const { scr, page } = await shell(name, { title: 'หมายเลขแผน ' + P[0], back: true, crumbs: ['แผน ' + P[0]].concat(o.crumbs || []), badge: PST[o.status || 'active'], actions: o.actions });
  return { scr, page };
}
/* ทางเลือก 2 ทาง = Section header + Radio text card (ตามแบบ RadioSelection / AdditionalPartRequest ของงานซ่อม) */
async function radioPick(title, options, sel, o) {
  o = o || {};
  const r = MOB ? col('Radio', [], 12) : row('Radio', [], { gap: 16 });
  options.forEach((t, i) => {
    const sub = Array.isArray(t) ? t[1] : '';   // [ข้อความ, บรรทัดรอง] แบบการ์ดตอบรับ/ปฏิเสธของ Overhaul R29
    const c = inst('Radio text card', { State: o.disabled ? 'Disabled' : 'Default', Selected: i === sel ? 'True' : 'False' }, { Text: Array.isArray(t) ? t[0] : t, Supporting: !!sub, 'Supporting text': sub });
    if (MOB) add(r, c, 'h');
    else {   // การ์ดในแถวสูงเท่ากัน และบรรทัดรองกว้างเต็มการ์ด (เจ้าของงาน 2 พ.ย. 2569 "อยากให้ขนาดกล่องเท่ากัน")
      r.appendChild(c); c.layoutGrow = 1;
      try { c.layoutSizingVertical = 'FILL'; } catch (e) { /* ไฟล์เก่าไม่รองรับ */ }
    }
    // 3 พ.ย. 2569 ภาพจากไฟล์จริง: บรรทัดรองตัดคำกลางคำ ("ผู้รับจ / ้าง") เพราะกรอบ Content (208) และ Text and supporting text (176) กว้างตายตัวตาม component ⇒ ยืดกรอบก่อน แล้วค่อยยืดข้อความ
    c.findAll(n => n.type === 'FRAME' && (n.name === 'Content' || n.name === 'Text and supporting text')).forEach(f => { try { f.layoutSizingHorizontal = 'FILL'; } catch (e) { /* ชั้นที่ไม่อยู่ใน auto layout */ } });
    c.findAll(n => n.type === 'TEXT').forEach(t => { try { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; } catch (e) { /* ชั้นที่ไม่อยู่ใน auto layout */ } });
  });
  return col('Section', [await (o.label ? sectionLabel(title) : section(title)), r], 16);
}
/* radio เล็กพร้อมป้าย = Horizontal radio groups (ไฟล์ Component หน้า Radio button) วางในแถวฟอร์มคู่กับช่องกรอก
   ตาม UI Release#2 หน้า 5.1 Rental Contract Management ("ประเภทสัญญา" เช่า/ซื้อ คู่ Input dropdown) · สูง 72 เท่า Text input · ใช้เมื่อ 2–4 ตัวเลือกป้ายสั้น ไม่ต้องมีคำอธิบาย (UX-1)
   options ไม่เกิน 4 · sel = ลำดับที่เลือก */
function radioGroup(label, options, sel, error) {   // error = ข้อความใต้กลุ่ม (Helper) เมื่อยังไม่เลือก
  const p = { 'Label text': label, Label: true, 'Info icon': false, 'Leading icon': false, Helper: !!error, 'Helper text': error || '', 'Radio 3': options.length > 2, 'Radio 4': options.length > 3 };
  options.forEach((t, i) => { p['Radio text ' + (i + 1)] = t; });
  const g = inst('Horizontal radio groups', {}, p);
  const ct = find(g, 'Container');
  (ct ? ct.children : []).filter(c => c.visible !== false).forEach((c, i) => { const rb = c.type === 'INSTANCE' && c.name === 'Radio button' ? c : find(c, 'Radio button'); if (rb) setProps(rb, { Selected: i === sel ? 'True' : 'False' }); });
  return g;
}
/* เลือกรถหลายคัน (เจ้าของงานสั่ง 22 ต.ค. 2569 "ใช้แบบ Overhaul ช่องค้นหากับชิป") = แบบ R24 ของ Overhaul:
   Input dropdown ช่องเดียว "เลือกรถ" พิมพ์ค้นทะเบียน/จังหวัด → Dropdown list แถวละทะเบียน (คันที่เลือกแล้ว State=Selected) → รถที่เลือกเป็นชิป Badge outline with remove icon ใต้ช่อง
   ไม่ใช้ dual list แล้ว · ใช้ทั้ง desktop และ mobile (mobile ช่องเต็มแถว) · งานซ่อมเลือกรถคันเดียวด้วยช่องค้นทะเบียนแบบเดียวกัน (Dropdown/Search PEA with request) */
async function carPick(title, cands, sel, o) {
  o = o || {};
  const right = cands.filter((_, i) => sel.indexOf(i) >= 0);
  const f = dropdown('เลือกรถ', o.query || '', { placeholder: 'ค้นหาทะเบียน, จังหวัด', lead: 'search-24-300-round', state: o.open ? 'Focused' : undefined, error: o.error || '' });
  let chips = null;
  if (right.length && o.chips !== false) {   // o.chips=false = ฟอร์มสร้างแผน รถที่เลือกแสดงในตารางด้านล่างแทน (เจ้าของงาน 2 พ.ย. 2569)
    chips = frame('Selected cars', 'HORIZONTAL', { gap: 8 });
    try { chips.layoutWrap = 'WRAP'; chips.counterAxisSpacing = 8; } catch (e) { /* ไฟล์เก่าไม่มี wrap */ }
    right.forEach(c => chips.appendChild(inst('Badge outline with remove icon', { Color: 'Brand' }, { Text: c[0] })));
  }
  const sec = col('Section', [title ? await section(title, { badge: right.length || null }) : null, MOB ? f : row('Row', [f, frame('Spacer', 'VERTICAL')]), chips], 16);
  const open = (scr) => {   // รายการที่ตรงคำค้น · คันที่เลือกแล้วติ๊ก Selected · แถวเดียวไม่มีบรรทัดรอง
    if (!o.open) return;
    const list = cands.map((c, i) => [c, i]).filter(([c]) => (!o.only || o.only(c)) && (!o.query || c[0].indexOf(o.query) >= 0));
    comboAt(scr, f.findOne(n => n.name === 'Container') || f, list.map(([c, i]) => [c[0], o.note ? o.note(i) : '', sel.indexOf(i) >= 0]));
  };
  return { sec, open };
}
/* กล่องข้อมูลรถ — ยืม VehicleAndReporterInfo (หน้า รายละเอียดงานซ่อม): Section label + Content item row แถวละ 4 · ไม่มี/mobile → Section label + กล่องแสดงข้อมูล (R12) */
async function vehicleInfo(pairs, title) {
  title = title || 'ข้อมูลยานพาหนะ';
  if (!MOB && has('VehicleAndReporterInfo')) {
    const v = inst('VehicleAndReporterInfo'); v.name = 'VehicleAndReporterInfo';
    const sl = find(v, 'Section label'); if (sl) setProps(sl, { Title: title, Supporting: false, 'Info icon': false, Actions: false, 'More actions': false });
    v.findAll(n => n.type === 'INSTANCE' && n.name === 'BudgetSource').forEach(b => { b.visible = false; });
    const rows = v.findAll(n => n.type === 'INSTANCE' && n.name === 'Content item row' && !findInstanceAncestor(n).name.startsWith('BudgetSource'));
    let k = 0;
    for (const r of rows) {
      const items = r.children.filter(c => c.name === '_Content item base');
      const slice = pairs.slice(k, k + items.length);
      if (!slice.length) { r.visible = false; continue; }
      items.forEach((it, j) => { if (j < slice.length) { setProps(it, { Type: 'Text with label' }); setProps(it, { Label: slice[j][0], Text: slice[j][1], Supporting: false, 'Leading icon': false }); } });
      setProps(r, { 'Item 2': slice.length > 1, 'Item 3': slice.length > 2, 'Item 4': slice.length > 3 });
      k += items.length;
    }
    return v;
  }
  return col('Section', [await sectionLabel(title), kv(pairs)], 16);
}
/* แถวภาพ — ยืม IncidentPhotoGallery (หน้า รายละเอียดงานซ่อม): Section label + Images sm × 4 + ปุ่มเลื่อน · ไม่มี/mobile → Section label + Images จากไลบรารี */
async function photoGallery(title, count) {
  if (!MOB && has('IncidentPhotoGallery')) {
    const g = inst('IncidentPhotoGallery'); g.name = 'IncidentPhotoGallery';
    const sl = find(g, 'Section label'); if (sl) setProps(sl, { Title: title, Supporting: false, 'Info icon': false, Actions: false, 'More actions': false });
    g.findAll(n => n.type === 'INSTANCE' && n.name === 'Images').forEach((im, i) => { if (i >= count) im.visible = false; else setProps(im, { Buttons: false, 'Indicator pagination': false }); });
    const ib = find(g, 'Icon button'); if (ib) ib.visible = count > 4;
    return g;
  }
  const r = frame('Gallery', 'HORIZONTAL', { gap: 16 });
  for (let i = 0; i < Math.min(count, MOB ? 2 : 4); i++) r.appendChild(inst('Images', { Size: 'sm', Type: 'Image' }, { Buttons: false, 'Indicator pagination': false }));
  return col('Section', [await sectionLabel(title), r], 16);
}
/* ช่องอัปโหลดภาพ 1 คอลัมน์ (กติกาอัปโหลด) — ช่องละภาพตามรายการบนบอร์ด */
async function photoUploads(list, filled, errors) {
  const nodes = [];
  for (const [i, label] of list.entries()) nodes.push(await upload(label, filled ? [jpg(label.replace(/\s|\+|\(|\)/g, '-') + '-' + (i + 1))] : [], { hint: 'JPG, PNG · 1 ภาพ', error: errors ? 'กรุณาอัปโหลด' + label : '' }));
  return nodes;
}
const partRow = (p, i, o) => [p[0], p[1], p[2], p[3], p[4], p[5], { pill: o && o.result ? PSTAT[o.result === 'short' ? p[6] : 'ok'] : [' ', 'Gray'] }];
const PART_COLS = [['รายการอะไหล่', 0, 'Lead text', 'Swap'], ['รหัส', 100], ['หมวด', 110], ['ตามแผน', 100], ['หน่วย', 90], ['คงเหลือในคลัง', 130], ['สถานะ', 140, 'Badge']];
/* ใส่ข้อความการ์ดอะไหล่ (Spare Part Card Item) — จับชั้นข้อความจากข้อความตัวอย่างของ component ไม่ใช้ลำดับ (การ์ดในแผง Filled วางชั้นต่างจากตัวแม่):
   รหัส · "1 หน่วย" · "| 680 บาท" (ราคาต่อหน่วย) · "<คลัง> : คงเหลือ n" · "| ต้องจัดซื้อ n" · ราคารวมของการ์ด (Text "3,400 บาท") */
async function fillPartCard(c, i, o) {
  o = o || {};
  const part = PARTS[i], unit = part[4];
  const own = (n) => !findInstanceAncestorIn(n, c);
  const sup = c.findAll(n => n.type === 'TEXT' && n.name === 'Supporting text' && own(n));
  const orig = sup.map(t => t.characters || '');
  await text(c, 'Name', part[0]);
  if (sup[0]) await text(c, sup[0], part[1]);
  for (const [k, t] of sup.entries()) {
    const was = orig[k];
    if (k === 0 || was === '·' || was === '|') continue;
    if (/คงเหลือ/.test(was)) await text(c, t, WH[i] + ' : คงเหลือ ' + o.stock + ' ' + unit);
    else if (/^(ต้องจัดซื้อ|ซื้อเพิ่ม)/.test(was)) { if (o.buy > 0) await text(c, t, 'ต้องจัดซื้อ ' + o.buy + ' ' + unit); }   // แถวนี้ซ่อนด้วย property จัดซื้อเพิ่ม เมื่อไม่ขาด
    else if (/หน่วย$/.test(was)) await text(c, t, '1 ' + unit);
    else if (/บาท$/.test(was)) await text(c, t, baht(PRICE[i]));
  }
  if (o.qty != null) {
    const line = c.findAll(n => n.type === 'TEXT' && n.name === 'Text' && own(n))[0];
    if (line) await text(c, line, baht(o.qty * PRICE[i]));
  }
}
/* เบิก/จองอะไหล่ — ยืม PartRequestStepPanel (ขั้นเบิกอะไหล่ของงานซ่อม = PartsInventoryPanel "คลังอะไหล่" + RequestedPartsPanel "อะไหล่ที่ต้องการใช้งาน")
   ตามแบบงานซ่อม (22 ต.ค. 2569): การ์ดคลังบอกคลังและคงเหลือ · การ์ดที่เลือกมีจำนวน + ราคารวม · ถ้าเกินคงเหลือ = "| ซื้อเพิ่ม n" + Helper "จำนวนที่เกินยอดในคลัง…" + เลือกผู้จัดซื้อ (Radio text card)
   o.inv = 'Default' | 'Not Found' | 'API error' (สถานะของ PartsInventoryPanel) · mobile / ไฟล์ที่ไม่มี component → ตาราง Table ของไลบรารี */
async function partsPanel(o) {
  o = o || {};
  const picked = o.picked || [];
  const qty = (i) => o.car ? CAR_QTY[i] : +PARTS[i][3];   // o.car = หน้าอะไหล่รายคัน S21: จำนวนต่อคัน ยังไม่เบิก จึงไม่มีซื้อเพิ่ม · ไม่มีป้าย "แนะนำ" กบค. เลือกเอง
  if (!MOB && has('PartRequestStepPanel')) {
    const p = inst('PartRequestStepPanel'); p.name = 'PartRequestStepPanel';
    const inv = find(p, 'PartsInventoryPanel'), req = find(p, 'RequestedPartsPanel');
    if (inv) {
      setProps(inv, { State: o.inv || 'Default' });
      const sh = find(inv, 'Section header');
      if (sh) { setProps(sh, { Title: 'คลังอะไหล่', 'Supporting text': true, 'More actions': false, Badge: false, Actions: false }); await text(sh, 'Supporting text', 'อะไหล่ทั้งหมดจาก Smart Inventory และ คลังสำรอง'); }
      const ti = find(inv, 'Text input'); if (ti) setProps(ti, { Text: o.query || 'ค้นหาชื่อหรือรหัสอะไหล่', Label: false, Helper: false, 'Info icon': false });
      const cards = inv.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
      for (const [i, c] of cards.entries()) {
        const part = PARTS[i];
        if (!part) { c.visible = false; continue; }
        setProps(c, { Suggestion: false, Select: picked.indexOf(i) >= 0, Add: picked.indexOf(i) < 0, 'จัดซื้อเพิ่ม': false, 'เลือกผู้จัดซื้อ': false });
        await fillPartCard(c, i, { stock: part[5] });
      }
    }
    if (req) {
      setProps(req, { State: picked.length ? 'Filled' : 'Default' });
      const sh = find(req, 'Section header');
      if (sh) { setProps(sh, { Title: o.car ? 'อะไหล่ของรถคันนี้' : 'อะไหล่ที่ต้องใช้ใน' + NOW_Q, 'Supporting text': true, 'More actions': false, Badge: picked.length > 0, Actions: false }); await text(sh, 'Supporting text', o.car ? 'เลือกจากคลังหรือระบุเพิ่มเอง แก้จำนวนหรือเอาออกได้' : 'รวมจากรถ ' + NOW_CARS + ' คันของไตรมาสนี้ · เบิก/จองผ่านระบบจองอะไหล่'); const b = find(sh, 'Badge outline'); if (b && picked.length) setProps(b, { Text: String(picked.length) }); }
      const cards = req.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
      // แผงมีการ์ดรายการที่เลือกแค่ 3 ช่อง (instance เพิ่มลูกไม่ได้) ⇒ เรียงรายการที่ต้องจัดซื้อขึ้นก่อนให้เห็น · ตัวเลข Badge และยอดรวมนับทุกรายการ
      const order = o.car ? picked.filter(i => i === 4).concat(picked.filter(i => i === 0), picked.filter(i => i !== 4 && i !== 0)) : picked.slice().sort((a, b) => (shortOf(b) > 0) - (shortOf(a) > 0));
      let k = 0;
      for (const c of cards) {
        const vp = (c.variantProperties || {})['อะไหล่'];
        if (vp === 'เพิ่มอะไหล่') {   // การ์ด "รายการเพิ่มเติม" ของงานซ่อม = เพิ่มอะไหล่แบบ manual (R36) ชื่ออะไหล่ · รหัสอะไหล่ (ถ้ามี) · ราคาต่อหน่วย · จำนวน
          if (!o.manual) { c.visible = false; continue; }
          const m = o.manual.filled ? MANUAL : {};
          [['ชื่ออะไหล่', m.name, 'ระบุชื่ออะไหล่', false], ['รหัสอะไหล่', m.code, 'ระบุรหัสอะไหล่', true], ['ราคาต่อหน่วย', m.price, '0', false]].forEach(([label, val, ph, opt], j) => {
            const ti = c.findAll(n => n.type === 'INSTANCE' && n.name === 'Text input')[j];
            if (ti) setProps(ti, { State: val ? 'Filled' : 'Default', 'Label text': label, Text: val || ph, Optional: opt, Helper: false, 'Info icon': false });
          });
          const num = find(c, 'Number input'); if (num) setProps(num, { Number: String(m.qty || 1), Label: false, Optional: false, 'Info icon': false, Helper: false });
          const line = c.findAll(n => n.type === 'TEXT' && n.name === 'Text')[0]; if (line) await text(c, line, baht(m.qty ? m.qty * +m.price : 0));
          continue;
        }
        const i = order[k++], part = PARTS[i];
        if (!part) { c.visible = false; continue; }
        const buy = o.car || o.result === 'ok' ? 0 : shortOf(i);   // อะไหล่พร้อมครบ = ของเข้าคลังแล้ว ไม่มีซื้อเพิ่ม
        const stock = o.result === 'ok' ? Math.max(+part[5], +part[3]) : part[5];
        setProps(c, { Suggestion: false, 'จัดซื้อเพิ่ม': buy > 0, 'เลือกผู้จัดซื้อ': buy > 0 });
        await fillPartCard(c, i, { stock, buy, qty: qty(i) });
        const num = find(c, 'Number input');
        if (num) setProps(num, { Number: String(qty(i)), Label: false, Optional: false, 'Info icon': false, Helper: buy > 0, 'Helper text': buy > 0 ? 'จำนวนที่เกินยอดในคลัง จะถูกตั้งเป็นรายการจัดซื้อให้อัตโนมัติ' : '' });
        if (buy > 0) {
          const il = find(c, 'Input label'); if (il) setProps(il, { Optional: false, 'Info icon': false, button: false });   // ป้าย "เลือกผู้จัดซื้ออะไหล่เพิ่ม" ไม่บังคับเลือก (มีค่าเริ่มต้น) · ไม่มีปุ่มข้างป้าย
          c.findAll(n => n.type === 'INSTANCE' && n.name === 'Radio text card').forEach((r, j) => setProps(r, { Text: BUYER[j] || '', Supporting: false, Selected: (BUYER_OF[i] || 0) === j ? 'True' : 'False' }));
        }
      }
      const addBtn = find(req, 'Secondary button'); if (addBtn) setProps(addBtn, { Text: 'ระบุอะไหล่เพิ่มเติม' });
      // กล่องรวมค่าอะไหล่ท้ายแผง (แบบงานซ่อม): เบิกจากคลัง · ต้องจัดซื้อ · รวมทั้งหมด — คิดจากทุกรายการที่เลือก
      const cost = find(req, 'Cost Container');
      if (cost && picked.length) {
        let take = o.manual && o.manual.filled ? MANUAL.qty * +MANUAL.price : 0, buyAmt = 0;
        picked.forEach(i => { const q = qty(i), st = o.car || o.result === 'ok' ? q : Math.min(q, +PARTS[i][5]); take += st * PRICE[i]; buyAmt += (q - st) * PRICE[i]; });
        const csh = find(cost, 'Section header'); if (csh) setProps(csh, { Title: 'รวมค่าอะไหล่', 'Supporting text': false, 'More actions': false, Badge: false, Actions: false });
        const infos = cost.findAll(n => n.type === 'FRAME' && n.name === 'Purchase Info');
        const vals = [['เบิกจากคลัง', take], ['ต้องจัดซื้อ', buyAmt]];
        for (const [j, f] of infos.entries()) { const ts = f.children.filter(x => x.type === 'TEXT'); if (vals[j] && ts[1]) { await text(f, ts[0], vals[j][0]); await text(f, ts[1], baht(vals[j][1])); } }
        const tot = find(cost, 'Total Cost'); const tt = tot ? tot.children.filter(x => x.type === 'TEXT') : [];
        if (tt[1]) await text(tot, tt[1], baht(take + buyAmt));
      }
    }
    return p;
  }
  if (o.car) {
    const extra = o.manual && o.manual.filled ? [MANUAL_ROW] : [];
    const rows = picked.map(i => [PARTS[i][0], PARTS[i][1], PARTS[i][2], String(CAR_QTY[i]), PARTS[i][4]]).concat(extra);
    const sec = col('Section', [await section('อะไหล่ของรถคันนี้', { badge: rows.length || null, buttons: [{ kind: 'Secondary button', text: 'ระบุอะไหล่เพิ่มเติม', icon: 'add-24-300-round' }] })], 16);
    add(sec, rows.length ? await tbl(PART_COLS.slice(0, 5), rows) : await noParts('เลือกอะไหล่จากคลัง หรือระบุอะไหล่เพิ่มเติมเอง'), 'h');
    return sec;
  }
  const head = 'รายการอะไหล่ที่ต้องใช้ใน' + NOW_Q;
  if (!picked.length) return col('Section', [await section(head), await noParts('ไตรมาสนี้ยังไม่มีอะไหล่ในแผน เลือกจากคลังเมื่อต้องการเบิก')], 16);
  return col('Section', [await section(head, { badge: PARTS.length }), await tbl(PART_COLS, PARTS.map((p, i) => partRow(p, i, o)))], 16);
}
/* ข้อความที่อยู่ใน instance ซ้อน (เช่น Pill หรือปุ่ม) ไม่ใช่ข้อความของการ์ดเอง */
function findInstanceAncestorIn(n, stop) { let q = n.parent; while (q && q !== stop) { if (q.type === 'INSTANCE') return q; q = q.parent; } return null; }
/* สรุปรายการเบิก/จอง — ยืม SummaryRequestedParts (modal สรุปรายการอะไหล่ของงานซ่อม) · ไม่มี/mobile → Modal ยืนยัน */
async function partsSummary(scr, o) {
  if (!MOB && has('SummaryRequestedParts')) {
    const m = inst('SummaryRequestedParts'); overlay(scr, m, 0, 0); m.name = 'SummaryRequestedParts';
    const hd = find(m, 'Modal header'); if (hd) setProps(hd, { Title: 'สรุปรายการเบิก/จองอะไหล่', Supporting: false, 'Back icon': false, 'Featured icon': false });
    const labels = m.findAll(n => n.type === 'INSTANCE' && n.name === 'Section label');
    if (labels[0]) setProps(labels[0], { Title: 'เบิกจากคลัง Smart Inventory (' + o.stock + ' รายการ)', Supporting: false, Actions: false, 'More actions': false });
    if (labels[1]) setProps(labels[1], { Title: 'คงเหลือไม่พอ — รอจัดซื้อ ผพจ. (' + o.buy + ' รายการ)', Supporting: false, Actions: false, 'More actions': false });
    const info = find(m, '_Modal content');
    if (info) {
      const pairs = [['แผน', P[1]], ['เลขที่ MR', P[0]], ['ไตรมาส', NOW_Q], ['จำนวนรถ', NOW_CARS + ' คัน']];
      const rows = info.findAll(n => n.type === 'INSTANCE' && n.name === 'Content item row');
      rows.forEach((r, i) => {
        if (i > 0) { r.visible = false; return; }
        setProps(r, { 'Item 2': true, 'Item 3': true, 'Item 4': true });
        r.children.filter(c => c.name === '_Content item base').forEach((it, j) => { if (pairs[j]) setProps(it, { Label: pairs[j][0], Text: pairs[j][1], Supporting: false, 'Leading icon': false }); });
      });
    }
    // ยอดรวมแบบงานซ่อม: เบิกจาก Smart Inventory · เบิกจากคลังสำรอง · จัดซื้อเพิ่มโดย Smart Inventory · จัดซื้อเพิ่มโดย ผพจ. · รวม
    const sum = { take: [0, 0], buy: [0, 0] };
    PARTS.forEach((pt, i) => { const q = +pt[3], st = Math.min(q, +pt[5]); sum.take[WH[i] === 'Smart Inventory' ? 0 : 1] += st * PRICE[i]; if (q > st) sum.buy[BUYER_OF[i] || 0] += (q - st) * PRICE[i]; });
    const lines = [['เบิกจาก Smart Inventory', sum.take[0]], ['เบิกจากคลังสำรอง', sum.take[1]], ['จัดซื้ออะไหล่เพิ่มโดย Smart Inventory', sum.buy[0]], ['จัดซื้ออะไหล่เพิ่มโดย ผพจ.', sum.buy[1]]];
    const rowsT = m.findAll(n => n.type === 'FRAME' && n.children && n.children.length === 2 && n.children.every(c => c.type === 'TEXT') && /^(Supporting text|Text)$/.test(n.children[0].name) && n.children[1].name === 'Text');
    let li = 0;
    for (const r of rowsT) {
      if (r.children[0].name === 'Supporting text' && lines[li]) { await text(m, r.children[0], lines[li][0]); await text(m, r.children[1], baht(lines[li][1])); li++; }
      else if (r.children[0].name === 'Text') await text(m, r.children[1], baht(lines.reduce((a, x) => a + x[1], 0)));
    }
    const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && n.parent.name === 'Actions');
    ft.forEach(b => { if (b.name === 'Primary button') setProps(b, { Text: 'ยืนยันเบิก/จอง', 'Leading icon': false, 'Trailing icon': false }); else if (b.name === 'Secondary button') setProps(b, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false }); else b.visible = false; });
    return;
  }
  await confirm(scr, { title: 'ยืนยันการเบิก/จองอะไหล่', sub: 'เบิกจากคลัง ' + o.stock + ' รายการ · คงเหลือไม่พอรอจัดซื้อ ' + o.buy + ' รายการ', ok: 'ยืนยันเบิก/จอง' });
}

/* ---------- S1 หน้ารายการแผน + ฟอร์มสร้างแผน ---------- */
const PLAN_COLS = [['เลขที่ MR', 150, 'Lead text', 'Down'], ['ชื่อแผน', 0, 'Text', 'Swap'], ['ภาค', 200], ['จำนวนรถ', 100], ['รถรายไตรมาส', 210], ['คลังรับทราบ', 130], ['สถานะ', 150, 'Badge', 'Swap'], ['', 60]];   // 2 พ.ย. 2569 เพิ่มคลังรับทราบ (S22) · ปีงบประมาณย้ายเป็นบรรทัดรองของชื่อแผน (Table 8 คอลัมน์เต็ม)   // 30 ต.ค.: แผนปี · เลขที่ MR Z69000XX นำหน้า (ประเภทรถอยู่ในชื่อแผน) · Table 8 คอลัมน์
const qCell = (t) => { const q = t.split(' · '); return { text: q.slice(0, 2).join(' · '), sub: q.slice(2).join(' · ') }; };   // 4 ไตรมาสยาวเกินคอลัมน์ ⇒ 2 บรรทัด (เจ้าของงาน 2 พ.ย. 2569 เปลี่ยน Q1 เป็นไตรมาส)
/* คลังรับทราบรายไตรมาส (S22): ก่อนอนุมัติ = "-" · หลังอนุมัติ = รับทราบแล้ว / ไตรมาสที่มีรถ · WH_ACK = จำนวนไตรมาสที่คลังรับทราบแล้วต่อเลขที่ MR (ค่าสมมติ) */
const WH_ACK = { 'MR Z7000004': 1, 'MR Z7000001': 2 };
const qWithCars = (p) => (p[9].match(/: (\d+)/g) || []).filter(x => +x.slice(2) > 0).length;
const whCell = (p) => p[5] === 'review' || p[5] === 'returned' ? '-' : (p[5] === 'closed' ? qWithCars(p) : WH_ACK[p[0]] || 0) + '/' + qWithCars(p) + ' ไตรมาส';
const planRow = (p) => [p[0], { text: p[1], sub: 'ปีงบประมาณ ' + p[8] }, p[2], p[4], qCell(p[9]), whCell(p), { pill: PST[p[5]] }, { menu: 1 }];
async function listScreen(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'บำรุงรักษาตามวาระ', primary: 'สร้างแผน' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tableHeader(o), 'h');
  add(sec, await tbl(PLAN_COLS, (o.rows || PLANS).map(planRow), { pagination: (o.rows || PLANS).length }), 'h');
  return scr;
}
const CARS = VEH.map(v => [v[0], v[1], v[2]]);
/* ฟอร์มสร้างแผน — 30 ต.ค. 2569 แผนปี: ปีงบประมาณ (เลือกได้ทุกปี) + แท็บไตรมาส 1–4 จัดรถลงไตรมาส · ปุ่ม "บันทึกและส่งอนุมัติ" (อนุมัติทั่วไป ไม่ผ่าน ผพจ.)
   2 พ.ย. 2569 (R35): เลือกภาค → เขตภายใต้ภาค → ประเภทรถ แล้วจึงเห็นรถ · เลือกรถแบบ R24 ของ Overhaul (ช่องค้นหา + ชิป) แทนตารางติ๊ก
   ชิป = รถของไตรมาสที่แท็บเปิดอยู่ · 1 คันอยู่ได้ไตรมาสเดียว ทุกคันที่จัดแล้วมี "ไตรมาส n" ต่อท้ายทะเบียนในรายการ (เจ้าของงาน 2 พ.ย. 2569) · สลับเขตเพื่อเพิ่มรถได้ ชิปเขตเดิมไม่หาย
   o.noCars = เขตและประเภทรถนี้ไม่มีรถ · o.picks = อะไหล่ที่เลือกรายคัน · o.manualCars = คันที่ระบุอะไหล่เอง · o.alloc = { ลำดับรถใน CAND: ไตรมาส } · o.q = แท็บที่เปิด · o.yearOpen / o.regionOpen / o.districtOpen / o.carOpen = รายการเปิด · o.carQuery = คำค้นรถ
   o.edit = ฟอร์มแก้ไข S19: ปีงบประมาณ Readonly (เลขที่ MR ผูกกับปี) · ปุ่มซ้าย "ยกเลิก" แบบบล็อก C ของ Overhaul · o.alert = [สี, หัวข้อ, ข้อความ] เหนือฟอร์ม */
const YEARS = ['2568', '2569', '2570', '2571', '2572'];   // เจ้าของงาน "ไม่จำกัดปี" — จำนวนปีที่แสดงยังไม่รู้ (Q31)
const CARP_COLS = [['ทะเบียน', 230, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 180], ['น้ำมันไฮโดรลิก', 140], ['เปลี่ยนล่าสุด', 120], ['อะไหล่', 120], ['', 104]];   // ไอคอนแก้ไข + ลบรถออกจากไตรมาส กว้าง 104 แบบบล็อก J ของ Overhaul · ตารางรถในไตรมาส (เจ้าของงาน 2 พ.ย. 2569 "section ของรถที่เลือกมาไตรมาสนั้น")
const CAR_PICK = [1, 2, 3];                 // ไส้กรองที่ กบค. เลือกให้รถ 1 คันในข้อมูลตัวอย่าง (ลำดับใน PARTS) · น้ำมันไฮโดรลิก (0) เข้ารายการเมื่อเลือกเปลี่ยนน้ำมัน
const CAR_QTY = [30, 2, 2, 2, 2];           // จำนวนต่อคัน (ค่าสมมติ)
const MANUAL = { name: 'ไส้กรองอากาศขนาดเล็ก', code: '', price: '750', qty: 2 };   // รายการที่ กบค. ระบุเอง ค่าตามจอ "รายการเพิ่มเติม" ของงานซ่อม
const MANUAL_ROW = [MANUAL.name, '-', 'เพิ่มเอง', String(MANUAL.qty), 'ชิ้น'];
/* อะไหล่ในไตรมาส = รวมจากรถของไตรมาสนั้น · เจ้าของงาน 2 พ.ย. 2569 "ไม่มี suggest มาให้เลย ให้เลือกเอง" + "หัวข้ออะไหล่ เป็นอะไหล่ในไตรมาสนั้นๆ" ⇒ picks = { ลำดับรถ: [ลำดับอะไหล่] } ว่างเมื่อยังไม่เลือก */
const quarterParts = (cars, picks) => PARTS.map((p, i) => [p[0], p[1], p[2], String(CAR_QTY[i] * cars.filter(c => (picks[c] || []).indexOf(i) >= 0).length), p[4]]).filter(r => +r[3] > 0);
async function noCarsInQ() { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มีรถในไตรมาสนี้'); await text(es, 'Supporting text', 'ค้นทะเบียนในช่องเลือกรถเพื่อเพิ่มรถเข้าไตรมาสนี้'); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
async function noParts(sub) { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มีรายการอะไหล่'); await text(es, 'Supporting text', sub); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
const OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน'];   // เจ้าของงาน 2 พ.ย. 2569: น้ำมันไฮโดรลิกไม่ได้เปลี่ยนทุกปี ให้ผู้ใช้เลือกเอง ระบบไม่ตัดสินจากเงื่อนไขอายุ
const LAST_OIL = ['12/03/2568', '12/03/2568', '05/02/2567', '20/11/2566', 'ไม่มีข้อมูล', '18/06/2568', '09/01/2566'];   // เปลี่ยนน้ำมันครั้งล่าสุดตามลำดับ CAND
const QUARTERS = ['ไตรมาส 1 (ต.ค.–ธ.ค.)', 'ไตรมาส 2 (ม.ค.–มี.ค.)', 'ไตรมาส 3 (เม.ย.–มิ.ย.)', 'ไตรมาส 4 (ก.ค.–ก.ย.)'];
async function planForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const heading = o.edit ? 'แก้ไขแผน ' + NEW_PLAN[0] : 'สร้างแผนบำรุงรักษา';
  const { scr, page } = await shell(name, { title: heading, back: true, crumbs: [o.edit ? heading : 'สร้างแผน'] });
  const regions = o.regions || [], districts = o.districts || [], types = o.types || [];   // ภาค เขต ประเภทรถ เลือกได้หลายค่า (R35 · 2 พ.ย. 2569)
  const ready = regions.length && districts.length && types.length, alloc = o.alloc || {}, q = o.q || 1;
  const nIn = Object.keys(alloc).length;
  const yr = o.edit ? field('ปีงบประมาณ', v.year, { state: 'Readonly' })
    : dropdown('ปีงบประมาณ', v.year || '', { placeholder: 'เลือกปีงบประมาณ', error: E('กรุณาเลือกปีงบประมาณ'), state: o.yearOpen ? 'Focused' : undefined });
  const reg = multiDropdown('ภาค', regions, { placeholder: 'เลือกภาค', error: E('กรุณาเลือกภาค'), state: o.regionOpen ? 'Focused' : undefined });
  const dist = multiDropdown('เขต', districts, { placeholder: 'เลือกเขต', error: regions.length ? E('กรุณาเลือกเขต') : '', state: o.districtOpen ? 'Focused' : regions.length ? undefined : 'Disabled' });
  const typ = multiDropdown('ประเภทรถ', types, { placeholder: 'เลือกประเภทรถ', error: districts.length ? E('กรุณาเลือกประเภทรถ') : '', state: districts.length ? undefined : 'Disabled' });
  const carSec = col('Section', [await section('เลือกรถเข้าแผนและจัดลงไตรมาส', { badge: nIn ? 'ในแผน ' + nIn + ' คัน' : null }), row('Row', [reg, dist, typ])], 16);
  let pick = null;
  if (ready && !o.noCars) {
    add(carSec, await tabs(QUARTERS.map((t, i) => [t, Object.values(alloc).filter(x => x === i + 1).length]), q - 1), 'h');
    pick = await carPick(null, CAND, CAND.map((_, i) => i).filter(i => alloc[i] === q), { chips: false, query: o.carQuery, open: o.carOpen, only: c => districts.indexOf(dCode(c)) >= 0, note: i => alloc[i] ? 'ไตรมาส ' + alloc[i] : '' });
    add(carSec, pick.sec, 'h');
  } else { const es = inst('Empty state/Data empty'); add(carSec, es, 'h'); await text(es, 'Text', 'ยังไม่มีรายการรถ'); await text(es, 'Supporting text', o.noCars ? 'ไม่มีรถที่ตรงกับเขตและประเภทรถที่เลือก' : o.errors ? 'กรุณาเลือกรถเข้าแผนอย่างน้อย 1 คัน — เลือกภาค เขต และประเภทรถก่อน' : 'เลือกภาค เขต และประเภทรถเพื่อแสดงรายการรถในเขต'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  /* อะไหล่รายไตรมาส (R36): ตารางรายคันและหัวข้ออะไหล่แสดงเฉพาะรถของแท็บที่เปิด · ปุ่มเพิ่มอะไหล่อยู่ที่หัวข้ออะไหล่ ปิดไว้จนกว่าไตรมาสนี้จะมีรถ · ไอคอนแก้ไขที่แถวรถเข้าหน้า S21 ของคันนั้น · เอารถออกด้วยการกดคันที่ติ๊กไว้ในรายการเลือกรถอีกครั้ง (ไม่มีชิปและไอคอนลบ ตามภาพเจ้าของงาน 2 พ.ย. 2569) */
  const picks = o.picks || {}, manualCars = o.manualCars || [], inQ = Object.keys(alloc).map(Number).filter(i => alloc[i] === q);
  const count = (i) => (picks[i] || []).length + (manualCars.indexOf(i) >= 0 ? 1 : 0);
  const carParts = ready && !o.noCars ? col('Section', [await section('รถในไตรมาส ' + q, { badge: inQ.length ? inQ.length + ' คัน' : null }),
    inQ.length ? await tbl(CARP_COLS, inQ.map(i => [CAND[i][0], CAND[i][1], CAND[i][2], OIL_OPTS[(picks[i] || []).indexOf(0) >= 0 ? 1 : 0], LAST_OIL[i], count(i) ? count(i) + ' รายการ' : 'ยังไม่เลือก', { icons: ['stylus-24-300-round', 'delete-24-300-round'] }])) : await noCarsInQ()], 16) : null;
  const qRows = quarterParts(inQ, picks).concat(manualCars.some(i => inQ.indexOf(i) >= 0) ? [MANUAL_ROW] : []);
  const partsSec = col('Section', [await section('อะไหล่ในไตรมาส' + (ready && !o.noCars ? ' ' + q : ''), { badge: qRows.length || null, buttons: [{ kind: 'Secondary button', text: 'เพิ่มอะไหล่', icon: 'add-24-300-round', disabled: !inQ.length }] })], 16);
  add(partsSec, qRows.length ? await tbl(PART_COLS.slice(0, 5).concat([['', 104]]), qRows.map(r => r.concat([{ icons: ['stylus-24-300-round', 'delete-24-300-round'] }]))) :   // แก้ไข = หน้า S21 · ลบ = ยืนยันแล้วเอาออกจากทุกคันในไตรมาส (เจ้าของงาน 2 พ.ย. 2569) · กว้าง 104 แบบบล็อก J ของ Overhaul
    await noParts(inQ.length ? 'กดเพิ่มอะไหล่เพื่อเลือกอะไหล่ของรถในไตรมาสนี้' : 'เลือกรถเข้าไตรมาสนี้ก่อน แล้วจึงเพิ่มอะไหล่ได้'), 'h');
  add(page, col('Content', (o.alert ? [alertBox(...o.alert)] : []).concat([
    col('Section', [await section('ข้อมูลแผน'),
      row('Row', [field('ชื่อแผน', v.name, { placeholder: 'ระบุชื่อแผน', error: E('กรุณาระบุชื่อแผน') }), yr])], 16),
    carSec,
    carParts,
    partsSec,
    btnRow([['Secondary button', o.edit ? 'ยกเลิก' : 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกและส่งอนุมัติ', { size: 'lg' }]])
  ]), 32), 'h');
  if (o.yearOpen) comboAt(scr, yr.findOne(n => n.name === 'Container') || yr, YEARS.map(y => [y, '', y === v.year]));
  if (o.regionOpen) comboAt(scr, reg.findOne(n => n.name === 'Container') || reg, REGIONS.map(r => [r, '', regions.indexOf(r) >= 0]));
  if (o.districtOpen) comboAt(scr, dist.findOne(n => n.name === 'Container') || dist, regions.flatMap(r => DISTRICTS[r]).map(d => [d, '', districts.indexOf(d) >= 0]));
  if (pick) pick.open(scr);
  return scr;
}
const FILLED = { name: NEW_PLAN[1], year: '2570' };
const R2 = { regions: [REGIONS[1]], districts: ['กฟฉ.1', 'กฟฉ.2', 'กฟฉ.3'], types: ['รถกระเช้า'] };   // ภาค 2 · 3 เขต · รถกระเช้า → รายการรถ 7 คัน
const A_Q1 = { 0: 1, 1: 1, 2: 1 };                          // แท็บไตรมาส 1: เลือกไว้ 3 คัน
const A_PICKS = { 0: CAR_PICK, 1: CAR_PICK, 2: CAR_PICK, 3: CAR_PICK, 5: CAR_PICK, 6: CAR_PICK };   // เลือกอะไหล่ครบทุกคันแล้ว
const A_ALL = { 0: 1, 1: 1, 2: 1, 3: 2, 5: 2, 6: 3 };       // จัดครบ: ไตรมาส 1 3 คัน · ไตรมาส 2 2 คัน · ไตรมาส 3 1 คัน · ไตรมาส 4 ว่าง · รถซ่อม (83-1207) ไม่อยู่ในแผน · มีรถจากเขตอื่น (สลับเขตแล้วเพิ่มต่อ)

/* ---------- S4 ความคืบหน้าและเบิกอะไหล่ของไตรมาส (2 พ.ย. 2569 รวม S5 เดิม · ตัดการตรวจรถ) ----------
   เจ้าของงาน: "S4 จะไม่ได้เป็นการตรวจความพร้อมของรถ แต่จะเป็นการตรวจความคืบหน้าอะไหล่แทน … เห็นว่าใน smart inventory มีจำนวนเท่าไร" + "รวบ s4 s5 เป็นหน้าเดียวกัน ยุบ S5 ออก"
   เฉพาะไตรมาสที่กำลังทำ · ตารางต้องเบิก เทียบคงเหลือ Smart Inventory · สถานะการเบิกรายรายการ · ปุ่มเบิก/จองในหน้าเดียวกัน
   o.picked = อะไหล่ของไตรมาส (ว่าง = ยังไม่มีในแผน) · o.result = 'short' | 'ok' · o.inv = 'API error' */
const Q_ALL = PARTS.map((_, i) => i);
const WD = { wait: ['รอเบิก', 'Gray'], reserved: ['จองแล้ว', 'Info'], taken: ['เบิกแล้ว', 'Success'], buy: ['รอจัดซื้อ', 'Warning'] };
const PROG_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['ต้องเบิก', 110], ['หน่วย', 90], ['คงเหลือ Smart Inventory', 200], ['ไม่พอ', 100], ['สถานะการเบิก', 150, 'Badge']];
async function partsProgress(name, o) {
  o = o || {};
  const picked = o.picked || [], down = o.inv === 'API error';
  const st = (i) => o.result === 'ok' ? WD.taken : o.result === 'short' ? (shortOf(i) > 0 ? WD.buy : WD.reserved) : WD.wait;
  const { scr, page } = await shell(name, { title: 'ความคืบหน้าอะไหล่ · ' + NOW_Q, back: true, crumbs: ['แผน ' + P[0], NOW_Q, 'ความคืบหน้าอะไหล่'] });
  const nodes = [alertBox('Info', 'คลังรับทราบรายการอะไหล่' + NOW_Q + 'แล้ว', 'รถ ' + NOW_CARS + ' คันของไตรมาสนี้ · คลังรับทราบ 02/11/2569')];
  if (down) nodes.push(alertBox('Error', 'เชื่อมต่อ Smart Inventory ไม่ได้', 'ยังดูคงเหลือและเบิก/จองไม่ได้ ลองใหม่อีกครั้ง'));
  if (o.result === 'short') nodes.push(alertBox('Warning', 'จองได้ ' + picked.filter(i => !shortOf(i)).length + ' รายการ · คงเหลือไม่พอ ' + picked.filter(i => shortOf(i)).length + ' รายการ', 'ไส้กรองไฮโดรลิก ขาด ' + shortOf(1) + ' ชิ้น · ไส้กรองเชื้อเพลิง ขาด ' + shortOf(4) + ' ชิ้น — รอจัดซื้อแล้วเข้าคลัง'));
  if (o.result === 'ok') nodes.push(alertBox('Success', 'เบิกอะไหล่ครบแล้ว', 'เบิกจาก Smart Inventory ' + picked.length + ' รายการ · ไปทำแผนเดินทางของไตรมาสได้'));
  const sec = col('Section', [await sectionLabel('อะไหล่ที่ต้องเบิกใน' + NOW_Q, { badge: picked.length || null })], 16);
  if (picked.length) add(sec, await tbl(PROG_COLS, picked.map(i => [PARTS[i][0], PARTS[i][1], PARTS[i][3], PARTS[i][4], down ? '-' : PARTS[i][5], down || o.result === 'ok' || !shortOf(i) ? '-' : String(shortOf(i)), { pill: st(i) }])), 'h');
  else add(sec, await noParts('ไตรมาสนี้ยังไม่มีอะไหล่ในแผน เพิ่มอะไหล่ได้ที่แก้ไขแผน'), 'h');
  nodes.push(sec);
  // 3 พ.ย. 2569 เจ้าของงาน: ถอดการ์ดรูปแบบดำเนินการออกจาก S4 — ย้ายไปเลือกในฟอร์มแผนเดินทาง (S6 ดำเนินการเอง / S9 จ้างดำเนินการ) · ปุ่ม "ไปทำแผนเดินทาง" พาไปหน้าแผนเดินทางของไตรมาส
  nodes.push(btnRow(o.result === 'ok' ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ไปทำแผนเดินทาง', { size: 'lg' }]]
    : o.result === 'short' ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ไปทำแผนเดินทาง', { size: 'lg', disabled: true }]]
    : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'เบิก/จองอะไหล่', { size: 'lg', disabled: !picked.length || down }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S6 แผนเดินทาง (ตรวจเอง) ---------- */
/* หน้าแผนเดินทางของไตรมาส (3 พ.ย. 2569 เจ้าของงาน "อยากให้แสดงรถทั้งหมดในแผน และมีให้เพิ่มแผนการเดินทาง" → เลือกรถของไตรมาสที่กำลังทำ · หน้าเดียว 2 ส่วน)
   ส่วนรถ: รถทุกคันของไตรมาส + ช่วงวันเดินทาง + ป้ายแผนเดินทางที่รถอยู่ (ยังไม่มี = Gray) · ส่วนแผนเดินทาง: รายการใบ + ปุ่มสร้างแผนเดินทาง
   หน้า Detail ⇒ Section label (R3) · o.trips = แผนเดินทางที่ยืนยันแล้ว [{ sel, locs, d1, d2, st }] เรียงตามลำดับที่สร้าง */
const TRIP_Q_COLS = [['ทะเบียน', 170, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 160], ['เบอร์ติดต่อ', 150], ['ช่วงวันเดินทาง', 210], ['แผนเดินทาง', 240]];   // มีใบ = ชื่อแผนเดินทาง (Text) · ยังไม่มี = Badge Gray · เบอร์ติดต่อ 3 พ.ย. 2569 เจ้าของงาน "หน้า e1 ก็อยากให้มีเบอร์ติดต่อด้วย" (อยู่ในใบแล้ว = เบอร์ของใบนั้น)
const TRIP_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวัน', 220], ['รถ (คัน)', 100], ['ผู้ดำเนินการ', 260], ['สถานะ', 150, 'Badge'], ['', 72]];
const tripPlaces = (t) => { const n = new Set(t.sel.map(i => tripLoc(i, t.locs))).size, own = t.sel.filter(i => !t.locs[i]).length; return n + ' แห่ง' + (own ? ' (สำนักงานเจ้าของรถ ' + own + ' คัน)' : ''); };
async function tripList(name, o) {
  o = o || {};
  const trips = o.trips || [];
  const { scr, page } = await detail(name, { crumbs: [NOW_Q, 'แผนเดินทาง'], status: 'active' });
  const tripOf = (i) => trips.findIndex(t => t.sel.indexOf(i) >= 0);
  const cars = col('Section', [await sectionLabel('รถใน' + NOW_Q, { badge: TRIP_CARS.length }),
    await tbl(TRIP_Q_COLS, TRIP_CARS.map((c, i) => { const k = tripOf(i); return [c[0], c[1], c[2], tripPhoneCell(i, k >= 0 ? trips[k].phones : null), k >= 0 ? trips[k].d1 + ' – ' + trips[k].d2 : '—', k >= 0 ? trips[k].name : { pill: ['ยังไม่มีแผนเดินทาง', 'Gray'] }]; }))], 16);
  const sec = col('Section', [await sectionLabel('แผนเดินทาง', { badge: trips.length, buttons: [{ kind: 'Primary button', text: 'สร้างแผนเดินทาง', icon: 'add-24-300-round' }] })], 16);
  if (trips.length) add(sec, await tbl(TRIP_COLS, trips.map(t => [{ text: t.name, sub: tripPlaces(t) }, t.d1 + ' – ' + t.d2, String(t.sel.length), tripBy(t), { pill: TST[t.st] }, { icons: ['keyboard_arrow_right-20-400-round'] }])), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ยังไม่มีแผนเดินทาง'); await text(es, 'Supporting text', 'สร้างแผนเดินทางเพื่อนัดวันเข้าตรวจ แจ้งเจ้าของรถและ กรย.'); const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false; const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'สร้างแผนเดินทาง', 'Leading icon swap': icon('add-24-300-round') }); }
  add(page, col('Content', [await vehicleInfo(TRIP_KV, 'รายละเอียดแผน'), cars, sec], 32), 'h');
  return scr;
}
/* ฟอร์มสร้างแผนเดินทาง — 2 พ.ย. 2569 เจ้าของงาน: สถานที่บำรุงรักษารายคัน ค่าเริ่มต้นสำนักงานที่รถอยู่
   3 พ.ย. 2569 เจ้าของงาน: เลือกรถจากรายการรถทั้งหมดของไตรมาส ผ่านปุ่ม "เพิ่มรถ" (popup tripCarModal) · 1 ไตรมาสมีหลายแผนเดินทางได้
   รถที่อยู่ในแผนเดินทางใดแล้วไม่มีให้เลือกในแผนเดินทางถัดไป
   o.sel = รถในแผนเดินทางนี้ (ลำดับใน VEH) · o.locs = สถานที่ที่แก้ { ลำดับรถ: ข้อความ } · o.phones = เบอร์ติดต่อที่แก้ { ลำดับรถ: เบอร์ } */
const TRIP_CAR_COLS = [['ทะเบียน', 180, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 160], ['เบอร์ติดต่อ', 150], ['สถานที่บำรุงรักษา', 290], ['', 104]];
async function tripForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const head = o.edit ? 'แก้ไขแผนเดินทาง' : 'สร้างแผนเดินทาง';   // o.edit = แก้ใบที่ผู้อนุมัติส่งกลับ (S7) · ฟอร์มเดียวกัน ปุ่มท้าย "ส่งอนุมัติใหม่"
  const { scr, page } = await shell(name, { title: head + ' · ' + NOW_Q, back: true, crumbs: ['แผน ' + P[0], NOW_Q, head] });
  const sel = o.sel || [];
  const car = { sec: col('Section', [await section('รถในแผนเดินทาง', { badge: sel.length || null, buttons: [{ kind: 'Secondary button', text: 'เพิ่มรถ', icon: 'add-24-300-round' }] })], 16) };
  if (sel.length) add(car.sec, await tbl(TRIP_CAR_COLS, sel.map(i => [TRIP_CARS[i][0], TRIP_CARS[i][1], TRIP_CARS[i][2], tripPhoneCell(i, o.phones), { text: tripLoc(i, o.locs), sub: (o.locs || {})[i] ? 'แก้จากสำนักงานเจ้าของรถ' : 'ค่าเริ่มต้น สำนักงานที่รถอยู่' }, { icons: ['stylus-24-300-round', 'delete-24-300-round'] }])), 'h');
  else {
    if (E('x')) add(car.sec, alertBox('Error', 'กรุณาเพิ่มรถเข้าแผนเดินทางอย่างน้อย 1 คัน'), 'h');
    add(car.sec, await noTripCars(), 'h');
  }
  const hire = o.mode === 'hire';   // o.mode = 'hire' จ้างดำเนินการ (S9) · ค่าเริ่มต้น กบค. ดำเนินการเอง (S6)
  // 3 พ.ย. 2569 เจ้าของงาน: ชื่อแผนเดินทางกับรูปแบบดำเนินการแถวเดียวกันคนละครึ่ง radio เล็ก (เดิม Radio text card เต็มแถว) · mobile เรียงลงตาม row()
  const mode = radioGroup('รูปแบบดำเนินการ', ['กบค. ดำเนินการเอง', 'จ้างดำเนินการ'], hire ? 1 : 0);
  const vendor = hire ? dropdown('ผู้รับจ้าง', v.vendor, { placeholder: 'ค้นหาชื่อผู้รับจ้าง', lead: 'search-24-300-round', error: E('กรุณาเลือกผู้รับจ้าง'), state: o.vendorOpen ? 'Focused' : undefined }) : null;
  const d1 = field(hire ? 'วันที่เริ่มงาน' : 'วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม'), state: o.dateOpen ? 'Focused' : undefined });
  const d2 = field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') });
  const staff = [0, 1, 2].map(i => dropdown('พนักงาน กบค. ซ่อม คนที่ ' + (i + 1) + (i === 2 ? ' (ถ้ามี)' : ''), v.staff ? v.staff[i] : '', { placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round', error: i < 2 ? E('กรุณาเลือกพนักงาน') : '' }));
  add(page, col('Content', [
    o.alert ? alertBox(...o.alert) : null,
    col('Section', [await section('ข้อมูลแผนเดินทาง'), row('Row', [field('ชื่อแผนเดินทาง', v.name, { placeholder: 'ระบุชื่อแผนเดินทาง', error: E('กรุณาระบุชื่อแผนเดินทาง') }), mode])], 16),   // ตามช่อง "ชื่อแผน" ของ S1 (ข้อมูลแผน) + radio แบบ 5.1 Rental Contract Management
    hire ? col('Section', [await section('ผู้รับจ้าง'), row('Row', [vendor, field('เลขที่สัญญา/ใบสั่งจ้าง', v.contract, { placeholder: 'ระบุเลขที่สัญญาหรือใบสั่งจ้าง', optional: true })])], 16) : null,
    car.sec,
    col('Section', [await section(hire ? 'ช่วงวันทำงาน' : 'ช่วงวันเดินทาง'), row('Row', [d1, d2, frame('Spacer', 'VERTICAL')])], 16),
    hire ? null : col('Section', [await section('พนักงาน กบค. ซ่อม (2-3 คน)'), row('Row', staff)], 16),
    // 3 พ.ย. 2569 เจ้าของงาน: ค่าเบี้ยเลี้ยง ค่าที่พัก ค่าเดินทาง ไม่กรอกในแผนเดินทางแล้ว ย้ายไปกรอกรายคันตอนปิดงาน (S10) พร้อมเลือกงบ ตั้งต้นศูนย์ต้นทุนของหน่วยงานเจ้าของรถ
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', o.edit ? 'ส่งอนุมัติใหม่' : 'ยืนยันการสร้างแผนเดินทาง', { size: 'lg' }]])
  ], 32), 'h');
  if (o.vendorOpen && vendor) comboAt(scr, vendor.findOne(n => n.name === 'Container') || vendor, VENDORS.map(x => [x[0], x[1], x[0] === v.vendor]));   // vendor list = Dropdown list ใต้ช่อง (R4 พิมพ์ค้น)
  if (o.modal) await tripCarModal(scr, o.modal);
  if (o.dateOpen && !MOB) {   // ปฏิทินช่วงวัน = Date picker Type=Dual ของไลบรารี วางใต้ช่องวันที่
    const dp = inst('Date picker', { Type: 'Dual' }, { 'Time picker': false });
    overlay(scr, dp, 0, 0);
    const sb = scr.absoluteBoundingBox, ab = d1.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4;
  }
  return scr;
}
const TRIP_FILLED = { name: 'ตรวจรถ ขอนแก่น อุดรธานี ลำปาง', place: TRIP.place, d1: TRIP.d1, d2: TRIP.d2, staff: TRIP.staff, perDiem: TRIP.perDiem, lodging: TRIP.lodging, travel: TRIP.travel };
/* popup แก้ไขรถในแผนเดินทาง (ไอคอนแก้ไขในแถว) = formModal (Modal Type=Form) 2 ช่อง เบอร์ติดต่อ + สถานที่บำรุงรักษา · ค่าตั้งต้นในช่อง = ค่าปัจจุบันของแถว
   3 พ.ย. 2569 เพิ่มเบอร์ติดต่อ (เดิมแก้แค่สถานที่) · ตัวอย่างแสดงค่าที่กำลังแก้ */
async function tripCarEdit(scr, i, phones, locs) { await formModal(scr, { title: 'แก้ไขเบอร์ติดต่อและสถานที่ · ' + TRIP_CARS[i][0], fields: [{ label: 'เบอร์ติดต่อ', value: tripPhone(i, phones) }, { label: 'สถานที่บำรุงรักษา', value: tripLoc(i, locs) }], ok: 'บันทึก' }); }
async function noTripCars() { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มีรถในแผนเดินทาง'); await text(es, 'Supporting text', 'กดเพิ่มรถเพื่อเลือกรถของ' + NOW_Q + 'ที่ยังไม่อยู่ในแผนเดินทางใด'); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
/* popup เพิ่มรถเข้าแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "รายการรถทั้งหมดที่อยู่ในแผนไตรมาสนั้น โดยมีปุ่มให้เพิ่มรถเข้าแผนการเดินทาง")
   ตามโครง Modal Type=Card list Size=xl "เลือกยานพาหนะ" ของไฟล์ Component (Modal header + Table header ค้นหา + เนื้อหา ขอบใน 24 ระยะ 24 มุม 12)
   + ตารางติ๊กเลือกรถ Table Lead checkbox ตามหน้า Vehicle Management "Export reports - Select vehicles" ของ UI Release#2 + Modal footer Horizontal right
   Modal instance เพิ่มตารางข้างในไม่ได้ ⇒ วางชิ้นไลบรารีเรียงในกรอบ Modal แบบเดียวกับ bottom sheet (§จ) · กว้าง 800 = Modal Size=lg · mobile = bottom sheet
   o.pool = รถที่เลือกได้ (ของไตรมาสที่ยังไม่อยู่ในแผนเดินทางใด และยังไม่อยู่ในใบนี้) · o.ticked = ที่ติ๊กไว้ · o.used = จำนวนรถของไตรมาสที่อยู่ในแผนเดินทางอื่นแล้ว */
const TRIP_PICK_COLS = [['ทะเบียน', 240], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 200]];
async function tripCarModal(scr, o) {
  const pool = o.pool, ticked = o.ticked || [], n = ticked.length;
  const sub = 'รถของ' + NOW_Q + 'ที่ยังไม่อยู่ในแผนเดินทางใด' + (o.used ? ' · อีก ' + o.used + ' คันอยู่ในแผนเดินทางอื่นแล้ว' : '');
  const ok = 'เพิ่มเข้าแผนเดินทาง' + (n ? ' (' + n + ')' : '');
  const rows = pool.map(i => [{ check: ticked.indexOf(i) >= 0, text: TRIP_CARS[i][0] }, TRIP_CARS[i][1], TRIP_CARS[i][2]]);
  const empty = async () => { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'รถทุกคันของ' + NOW_Q + 'อยู่ในแผนเดินทางแล้ว'); await text(es, 'Supporting text', 'ไม่มีรถที่เพิ่มเข้าแผนเดินทางนี้ได้'); const a = find(es, 'Actions'); if (a) a.visible = false; return es; };
  const search = () => { const f = field('', '', { placeholder: 'ค้นหาทะเบียน, ยี่ห้อ/รุ่น, หน่วยงาน', lead: 'search-24-300-round' }); setProps(f, { Label: false, Helper: false }); return f; };
  if (MOB) { await popupModal(scr, { title: 'เพิ่มรถเข้าแผนเดินทาง', body: pool.length ? [search(), await tbl(TRIP_PICK_COLS, rows)] : [await empty()], ok, okOff: !n }); return; }
  const body = [];
  if (pool.length) {
    const th = await tableHeader({ placeholder: 'ค้นหาทะเบียน, ยี่ห้อ/รุ่น, หน่วยงาน' });
    const acts = find(th, 'Actions'); if (acts) acts.visible = false;
    const t = await tbl(TRIP_PICK_COLS, rows);
    const hc = t.findOne(n2 => n2.type === 'INSTANCE' && n2.name === 'Table header cell');   // เลือกทั้งหมดที่หัวคอลัมน์แรก (ตาม Select vehicles)
    if (hc) { setProps(hc, { Checkbox: 'True' }); const cb = find(hc, 'Checkbox'); if (cb) setProps(cb, { Type: n === 0 ? 'Unselected' : n === pool.length ? 'Selected' : 'Indeterminate' }); }
    body.push(th, t);
  } else body.push(await empty());
  await popupModal(scr, { title: 'เพิ่มรถเข้าแผนเดินทาง', sub, w: 800, body, ok, okOff: !n });
}
/* popup ประกอบจากไลบรารี (Modal ของไลบรารีใส่ Table / File upload ไม่ได้): Background overlay + กรอบ Modal (มุม 12) + Modal header + เนื้อหา (ขอบใน 24 ระยะ 24) + Modal footer Horizontal right
   ตามโครง Modal Type=Card list xl ของไฟล์ Component + popup Open Job / Repair Completed หน้า RP & MA Job ของ UI Release#2 · mobile = bottom sheet (sheet())
   o.title · o.sub · o.w (กว้าง ค่าเริ่ม 640) · o.body (node เนื้อหา) · o.ok (ปุ่มหลัก) · o.okOff = ปุ่มหลักกดไม่ได้ · 3 พ.ย. 2569 แยกจาก tripCarModal ให้ S10 ใช้ด้วย */
async function popupModal(scr, o) {
  if (MOB) {
    const r = await sheet(scr, { title: o.title, content: o.body, ok: o.ok, cancel: 'ยกเลิก' });
    const pb = find(r.sh, 'Primary button'); if (pb && o.okOff) setProps(pb, { State: 'Disabled' });
    return r;
  }
  overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), VH());
  const m = frame('Modal', 'VERTICAL', { fill: WHITE });
  m.cornerRadius = 12;
  overlay(scr, m, 0, 0); m.counterAxisSizingMode = 'FIXED'; m.resize(o.w || 640, m.height);
  const hd = inst('Modal header', { Alignment: 'Left' }, { Title: o.title, Supporting: !!o.sub, 'Supporting text': o.sub || '', 'Featured icon': false, 'Back icon': false, 'Close icon': true, Divider: false });
  add(m, hd, 'h');
  const body = frame('Content', 'VERTICAL', { gap: 24, pad: [0, 24] }); body.paddingBottom = 24;
  add(m, body, 'h');
  o.body.forEach(n => { if (n) add(body, n, 'h'); });
  const ft = inst('Modal footer', { Alignment: 'Horizontal right' }, { 'Tertiary action': false, Divider: false });
  add(m, ft, 'h');
  ft.findAll(b => b.type === 'INSTANCE' && /button/.test(b.name) && b.parent && b.parent.name === 'Actions').forEach(b => {
    if (b.name === 'Primary button') setProps(b, { Text: o.ok, 'Leading icon': false, 'Trailing icon': false, State: o.okOff ? 'Disabled' : 'Default' });
    else if (b.name === 'Secondary button') setProps(b, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
    else b.visible = false;
  });
  m.x = (VW() - m.width) / 2; m.y = Math.max(40, (VH() - m.height) / 2);
  return { m, body };
}

/* ---------- S10 บำรุงรักษารายคันตามแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "จริงมันควรเข้าได้จากหน้าแผนการเดินทาง แล้วเลือกบำรุงรถทีละคัน") ----------
   เลือกแล้ว: ทางเข้า = หน้ารายละเอียดแผนเดินทาง (ไอคอน › ในตารางแผนเดินทางของ E.1 หรือแจ้งเตือน) · หน้ารายคัน = ทำทีละขั้นตามหน้า RP & MA Job ของ UI Release#2
   (Page header Badge สถานะ + ปุ่มขวา · Section label + Content item row · popup เริ่มงาน แบบ Open Job · ปิดงานเป็นหน้าฟอร์มเต็ม เพราะตารางงาน + ภาพ 4 ช่อง + ช่องกรอก เกินความสูง popup)
   ข้อมูล = แผนเดินทางใบแรก TRIP_1 ที่อนุมัติแล้ว · รถคันแรก 82-6789 ขอนแก่น */
const JOB_T = tripAs(TRIP_1, 'approved'), JOB_I = TRIP_1.sel[0];
const JOB_START = '04/11/2569 08:42 น.', JOB_END = '04/11/2569 11:15 น.', JOB_BY = TRIP.staff[0] + ' (กบค.)';
const JOB_MIX = { [TRIP_1.sel[0]]: 'done', [TRIP_1.sel[1]]: 'doing', [TRIP_1.sel[2]]: 'cannot' };   // หลังปิดงานคันแรก: คันที่ 2 กำลังทำ · คันที่ 3 บำรุงรักษาไม่ได้ · คันที่ 4 ยังไม่เริ่ม
const JOB_CANNOT = 'รถติดภารกิจซ่อมสายส่งฉุกเฉิน ไม่อยู่ที่จุดนัดในวันเดินทาง';
const TRIP_JOB_COLS = [['ทะเบียน', 190, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['เบอร์ติดต่อ', 150], ['สถานที่บำรุงรักษา', 260], ['สถานะงาน', 320, 'Badge'], ['', 72]];   // 320 = สองป้าย (สถานะ + ผลน้ำมัน · 4 พ.ย. 2569)
/* ปุ่ม "…" ท้ายแถวรถ (3 พ.ย. 2569 เจ้าของงาน "คอลัมน์สุดท้ายอยากได้เป็นจุดสามจุดที่กดไปมีดูรายละเอียด แก้ไข และลบ") แบบเมนูรายการแผน S19 S20 (planMenu)
   รายการตามสถานะงาน (เสนอ): ยังไม่เริ่ม = ดูรายละเอียด แก้ไข ลบ · อยู่ระหว่างบำรุงรักษา = ดูรายละเอียด แก้ไข · เสร็จสิ้น / บำรุงรักษาไม่ได้ = ดูรายละเอียด
   แก้ไข = popup แก้เบอร์ติดต่อและสถานที่ (tripCarEdit เดียวกับ S6) · ลบ = ยืนยันแล้วเอารถออกจากแผนเดินทาง */
const JOB_MENU = { todo: MENU, doing: MENU.slice(0, 2), done: MENU.slice(0, 1), cannot: MENU.slice(0, 1), worked: MENU.slice(0, 1), reported: MENU.slice(0, 1), wait: MENU.slice(0, 1), returned: MENU.slice(0, 1) };   // done = คันที่เลือกน้ำมันแบบมีเก็บตัวอย่าง (ตัวอย่าง JOB_OIL) · ไม่ได้เก็บตัวอย่างเหลือ ดูรายละเอียด
const CAR_REMOVE_CONFIRM = (c) => ({ danger: true, title: 'ยืนยันการเอารถออกจากแผนเดินทาง', sub: c[0] + ' จะถูกเอาออกจากแผนเดินทางนี้ และเลือกเข้าแผนเดินทางใบอื่นของไตรมาสได้อีก', cancel: 'ยกเลิก', ok: 'เอาออก' });
async function tripDetail(name, o) {   // หน้ารายละเอียดแผนเดินทาง (หลังอนุมัติ) · o.trip = ใบที่แสดง (ค่าเริ่ม JOB_T · ใบจ้าง HIRE_T) · o.st = { ลำดับรถ: สถานะใน WSTAT } · o.menu / o.edit / o.del = เมนู … ของรถคันแรก
  o = o || {};
  const t = o.trip || JOB_T, st = (i) => (o.st || {})[i] || 'todo', cnt = (k) => t.sel.filter(i => st(i) === k).length;
  const prog = 'เสร็จสิ้น ' + cnt('done') + ' จาก ' + t.sel.length + ' คัน' + [['doing', 'อยู่ระหว่างบำรุงรักษา'], ['cannot', 'บำรุงรักษาไม่ได้'], ['wait', 'รอตรวจรับ'], ['returned', 'ส่งกลับแก้ไข']]
    .map(([k, l]) => cnt(k) ? ' · ' + l + ' ' + cnt(k) : '').join('');   // ใบจ้าง: รอตรวจรับ · ส่งกลับแก้ไข ต่อท้าย (S10 ตารางความคืบหน้า)
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: ['แผน ' + P[0], 'แผนเดินทาง ' + NOW_Q, t.name], badge: TST.approved });
  const rows = t.sel.map(i => [{ text: TRIP_CARS[i][0], sub: TRIP_CARS[i][2] }, TRIP_CARS[i][1], tripPhoneCell(i, t.phones), tripLoc(i, t.locs), st(i) === 'done' && (o.oil || {})[i] ? { pills: [WSTAT.done, OIL_TAG[o.oil[i]]], pillsHead: 'ผลตรวจน้ำมัน' } : { pill: WSTAT[st(i)] }, { menu: 1 }]);   // o.oil = { ลำดับรถ: wait|fail } ป้ายผลน้ำมันต่อจากสถานะ (S12 · 4 พ.ย. 2569)
  add(page, col('Content', [await vehicleInfo(tripKv(t).concat([['ความคืบหน้า', prog]]), 'รายละเอียดแผนเดินทาง'),
    col('Section', [await sectionLabel('รถในแผนเดินทาง', { badge: t.sel.length }), await tbl(TRIP_JOB_COLS, rows)], 16)], 32), 'h');
  const i0 = t.sel[0];
  if (o.menu) planMenu(scr, o.vendor ? MENU.slice(0, 1) : JOB_MENU[st(i0)]);   // ผู้รับจ้าง: ดูรายละเอียดอย่างเดียว ไม่มีแก้ไข ลบ (เจ้าของงาน 4 พ.ย. 2569)
  if (o.edit) await tripCarEdit(scr, i0, t.phones, t.locs);
  if (o.del) await confirm(scr, CAR_REMOVE_CONFIRM(TRIP_CARS[i0]));
  return scr;
}
/* S12 ผลการทดสอบน้ำมันไฮโดรลิก — 4 พ.ย. 2569 เจ้าของงาน "ไม่ได้อยากเป็น popup อยากได้เป็นส่วนหนึ่งของ flow เลย เช่น ถ้าเลือก เก็บตัวอย่างน้ำมันไฮดรอลิก ก็จะ มีให้เลือกเก็บผล แต่เป็น optional"
   + "ตอนนี้อยากให้ทางเข้าคือทางเดียวคือดูรายละเอียดแล้วเพิ่มในส่วนของรายละเอียด" ⇒ ใส่ผลได้ในหน้าปิดงาน (ไม่บังคับ) หรือภายหลังที่ section ในหน้างานรายคันที่เสร็จสิ้น · เลิก popup และเมนู "ผลการทดสอบน้ำมันไฮโดรลิก"
   รถที่เก็บตัวอย่างแต่ยังไม่มีผล = ป้าย "รอผลตรวจน้ำมัน" ต่อจากสถานะงาน (Table cell Style=Multiple badges · R49) · ผลไม่ผ่าน = "น้ำมันไม่ผ่าน" · ผ่าน = ป้ายสถานะอย่างเดียว
   (ช่องเดิม 3 พ.ย. 2569: radio ผ่าน/ไม่ผ่าน + ไฟล์ไม่บังคับ · ผลเก็บในข้อมูลรถ · ยังไม่แจ้งเจ้าของรถ) */
const OIL_FILE = pdf('oil-test-82-6789.pdf', '420 KB');
const OIL_TAG = { wait: ['รอผลตรวจน้ำมัน', 'Warning'], fail: ['น้ำมันไม่ผ่าน', 'Error'] };
const OIL_SAMPLED = (k) => k === 0 || k === 2;   // ตัวเลือกใน JOB_OIL_OPTS ที่มีการเก็บตัวอย่าง
async function oilResult(o) {   // o.sel (-1 ยังไม่เลือก · 0 ผ่าน · 1 ไม่ผ่าน) · o.files · o.errors · o.optional = หน้าปิดงาน
  return [row('Row', [radioGroup('ผลการทดสอบ' + (o.optional ? ' (ถ้ามี)' : ''), ['ผ่าน', 'ไม่ผ่าน'], o.sel == null ? -1 : o.sel, o.errors ? 'กรุณาเลือกผลการทดสอบ' : ''), frame('Spacer', 'VERTICAL')]),
    await upload('ไฟล์ผลการทดสอบ', o.files || [], { optional: true, hint: 'PDF, JPG, PNG · สูงสุด 10 ไฟล์', bar: true })];
}
const JOB_COLS = [['รายการงาน', 0], ['อะไหล่ตามแผน', 320], ['จำนวนตามแผน', 140], ['หน่วย', 110], ['', 104]];   // ไอคอนแก้ไข + ลบ (3 พ.ย. 2569 เจ้าของงาน "อะไหล่ตามแผนสามารถแก้ไข ลบ เพิ่มได้") กว้าง 104 แบบตารางอะไหล่ในไตรมาสของ S1
/* น้ำมันไฮโดรลิกหน้างาน (3 พ.ย. 2569 เจ้าของงาน "หน้า I.8 I.9 อยากให้สามารถเลือกได้ว่าเก็บตัวอย่างน้ำมันไฮดรอลิก หรือเปลี่ยน เนื่องจากการเปลี่ยนน้ำมันเปลี่ยนทุก 3 ปี … หรือสามารถเลือกได้ว่าเก็บตัวอย่างและเปลี่ยน")
   Radio text card แบบ "น้ำมันไฮโดรลิก" ของหน้าอะไหล่ของรถ (S21) + ช่องเปลี่ยนน้ำมันครั้งล่าสุด · เลือกเก็บตัวอย่างอย่างเดียว = ไม่มีน้ำมันในรายการอะไหล่ · มีเก็บตัวอย่าง = เข้ารอผลตรวจ S12 */
const JOB_OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน', 'เก็บตัวอย่างและเปลี่ยน'], JOB_OIL = 2;
async function jobOil(sel, res) {   // res = หน้าปิดงาน: เลือกแบบที่มีการเก็บตัวอย่างแล้วมีช่องผลการทดสอบ (ถ้ามี) ต่อท้าย (S12 · 4 พ.ย. 2569)
  const oil = await radioPick('น้ำมันไฮโดรลิก', JOB_OIL_OPTS, sel);
  const last = field('เปลี่ยนน้ำมันครั้งล่าสุด', LAST_OIL[0], { state: 'Readonly' });
  add(oil, MOB ? last : row('Row', [last, frame('Spacer', 'VERTICAL')]), 'h');
  if (res && OIL_SAMPLED(sel)) for (const n of await oilResult(Object.assign({ optional: true }, res))) add(oil, n, 'h');
  return oil;
}
const jobWork = (sel) => WORK.filter((w, k) => k > 0 || sel !== 0);   // แถวแรก = เปลี่ยนน้ำมันไฮโดรลิก
/* แยก view กบค. / ผู้รับจ้าง (4 พ.ย. 2569 เจ้าของงาน "vendor ดูรายละเอียดรายคัน จะเห็นแค่ ปุ่มเริ่มงาน และบำรุงรักษาได้ โดยไม่เห็นปุ่ม ลบ และแก้ไข แต่ว่า กบค จะเห็น อยากให้แยก view")
   o.vendor = มุมผู้รับจ้างของแผนจ้างดำเนินการ: ปุ่มหัวหน้าเหมือนกัน (บำรุงรักษาไม่ได้ · เริ่มงาน/ปิดงาน) · อะไหล่ตามแผนดูอย่างเดียว ไม่มีปุ่มเพิ่มอะไหล่และไอคอนแก้ไข ลบ · การนัดหมายเป็นข้อมูลใบจ้าง */
async function jobPage(name, o) {   // หน้างานรายคัน · o.st = todo|doing · o.i = ลำดับรถ · o.modal = 'start' | 'cannot' · o.errors · o.vendor
  o = o || {};
  const v = !!o.vendor, t = v ? HIRE_T : JOB_T, i = o.i == null ? JOB_I : o.i, c = TRIP_CARS[i], s = o.st || 'todo';
  const acts = [['Secondary button', 'บำรุงรักษาไม่ได้'], ['Primary button', s === 'doing' ? 'ปิดงาน' : 'เริ่มงาน']];   // ปุ่มตามสถานะ (Page header Job detail ของ RP & MA Job)
  const { scr, page } = await shell(name, { title: c[0], back: true, crumbs: ['แผนเดินทาง ' + NOW_Q, t.name, c[0]], badge: WSTAT[s], actions: acts });
  const appt = (v ? [['แผนเดินทาง', t.name], ['ผู้รับจ้าง', t.vendor], ['ช่วงวันทำงาน', t.d1 + ' – ' + t.d2]] : [['แผนเดินทาง', t.name], ['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2]])
    .concat([['สถานที่บำรุงรักษา', tripLoc(i, t.locs)], ['เบอร์ติดต่อ', tripPhone(i, t.phones)]])
    .concat(s === 'doing' ? [['เริ่มงาน', v ? HIRE_START : JOB_START], ['ผู้เริ่มงาน', v ? HIRE_BY : JOB_BY]] : []);
  const nodes = [await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภท', 'รถกระเช้า'], ['หน่วยงานเจ้าของรถ', c[2]], ['เลขไมล์สะสม', '182,400 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,120 ชม.']]),
    await vehicleInfo(appt, 'การนัดหมาย')];
  if (s === 'doing') nodes.push(v ? await photoFiles({ uploading: o.uploading }) : await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length), await jobOil(JOB_OIL));
  const wk = jobWork(s === 'doing' ? JOB_OIL : 1);   // ยังไม่เริ่ม: ตามแผน (เปลี่ยนน้ำมัน)
  nodes.push(col('Section', [await sectionLabel('รายการงานและอะไหล่ตามแผน', { badge: wk.length, buttons: v && s !== 'doing' ? null : [v ? ADD_PART : { kind: 'Secondary button', text: 'เพิ่มอะไหล่', icon: 'add-24-300-round' }] }),   // ผู้รับจ้างเริ่มงานแล้วเพิ่มได้ (4 พ.ย. 2569)
    v && s !== 'doing' ? await tbl(JOB_COLS.slice(0, 4), wk.map(w => [w[0], w[1], w[2], w[4]]))   // ผู้รับจ้าง ยังไม่เริ่ม: ดูอย่างเดียว · เริ่มแล้ว: แก้ไข ลบ ได้ (4 พ.ย. 2569) แต่ไม่มีปุ่มเพิ่มอะไหล่
      : await tbl(JOB_COLS, wk.map(w => [w[0], w[1], w[2], w[4], { icons: ['stylus-24-300-round', 'delete-24-300-round'] }]))], 16));   // แก้ไข / เพิ่ม = หน้าอะไหล่ของรถ (S21) · ลบ = ยืนยันแล้วเอาออกจากรถคันนี้
  add(page, col('Content', nodes, 32), 'h');
  if (o.modal === 'cannot') await cannotModal(scr, i, { reason: o.reason, used: s === 'doing' ? CANNOT_USED : null, errors: o.errors });
  return scr;
}
/* บำรุงรักษาไม่ได้ = สาเหตุ + อะไหล่ส่งคืน (3 พ.ย. 2569 รอบ 2 เจ้าของงาน "กรอกแค่สาเหตุพอ" · อะไหล่ของคันที่ไม่ได้ทำ "มีให้กดส่งคืน ตอนที่กบค รับเรื่องจะเห็นว่ามีอะไหล่อะไรคืนบ้าง")
   popupModal (Modal ของไลบรารีใส่ Table ไม่ได้) = Text area + Table ของไลบรารี · ยังไม่เริ่ม ใช้ 0 คืนทั้งหมด · อยู่ระหว่างบำรุงรักษา กรอกจำนวนที่ใช้ (Table cell ไม่มีช่องกรอก แสดงเป็นข้อความ) คืน = ตามแผน − ใช้ */
const RET_COLS = [['ชื่ออะไหล่', 0, 'Lead text'], ['จำนวนตามแผน', 170], ['จำนวนที่ใช้', 170], ['จำนวนที่คืน', 170]];
const retRows = (used) => WORK.map((w, k) => { const u = used ? +used[k] : 0; return [w[1], w[2] + ' ' + w[4], u + ' ' + w[4], (+w[2] - u) + ' ' + w[4]]; });
const CANNOT_USED = ['30', '2', '0', '0'];   // เปลี่ยนน้ำมันและไส้กรองไฮโดรลิกแล้วพบปัญหา ทำต่อไม่ได้
async function retTable(used, label, edit) { const rows = retRows(used); return col('Section', [await (label ? sectionLabel : section)('อะไหล่ส่งคืน', { badge: rows.length, buttons: edit ? [ADD_PART] : null }),
  await tbl(edit ? RET_COLS.concat([['', 104]]) : RET_COLS, edit ? rows.map(r => r.concat([EDIT_ICONS])) : rows)], 16); }   // edit = ผู้รับจ้างแก้ไข ลบ ได้ (4 พ.ย. 2569)
async function cannotModal(scr, i, o) {   // o.reason · o.used (null = ยังไม่เริ่ม) · o.errors
  await popupModal(scr, { title: 'บำรุงรักษาไม่ได้ · ' + TRIP_CARS[i][0], w: 800, ok: 'ยืนยัน',
    body: [area('สาเหตุที่บำรุงรักษาไม่ได้', o.reason, { placeholder: 'ระบุสาเหตุที่บำรุงรักษาไม่ได้', error: o.errors ? 'กรุณาระบุสาเหตุที่บำรุงรักษาไม่ได้' : '' }), await retTable(o.used)] });
}

/* ---------- แผนจ้างดำเนินการ: ผู้รับจ้างส่งตรวจงาน (S10) + กบค. ตรวจรับรายคัน (S11) — 3 พ.ย. 2569 รอบ 2 ----------
   เจ้าของงาน "กบค จะเห็นหน้าคนละหน้า เห็นสถานะ ว่ารถคันนั้น ดำเนินการบำรุงรักษาแล้ว ปุ่มจะแสดงให้ส่งตรวจงาน" · "คนตรวจงานเป็นผู้รับจ้าง ส่งตรวจงาน แต่กบค จะเห็นว่าต้องตรวจรับงาน
   … อนุมัติ และ ส่งกลับแก้ไข พร้อมเหตุผล" → "ใช้แบบการ์ดเหมือน S2"
   หน้าเดียวกับหน้างานรายคัน S10 (Page header Badge + ปุ่มขวา ตามหน้า RP & MA Job ของ UI Release#2) · ผลการพิจารณา = radioPick แบบ S2 S7 (Radio text card ของไฟล์ Component) · ตาราง = Table */
const HIRE_T = tripAs(TRIP_V, 'approved'), HIRE_DONE = TRIP_V.sel[0], HIRE_CANNOT = TRIP_V.sel[1];
const HIRE_BY = 'นายประเสริฐ ศรีสุข (ผู้รับจ้าง)', HIRE_START = '17/11/2569 09:10 น.', HIRE_END = '17/11/2569 13:25 น.', HIRE_SENT = '17/11/2569 16:40 น.', HIRE_REPORTED = '18/11/2569 08:35 น.';
const HIRE_WHY = 'กระบอกสูบไฮโดรลิกหลักรั่ว ต้องส่งซ่อมก่อนจึงบำรุงรักษาได้';
const HIRE_BACK = 'จำนวนไส้กรองอากาศที่คืนไม่ตรงกับภาพอะไหล่ใหม่ที่เหลือ กรุณาตรวจนับและแก้จำนวนที่คืน';
const HIRE_BACK_CANNOT = 'กรุณาระบุตำแหน่งที่รั่วและผลตรวจเบื้องต้นในสาเหตุให้ชัดเจน';
const HIRE_MIX = { [TRIP_V.sel[0]]: 'wait', [TRIP_V.sel[1]]: 'wait', [TRIP_V.sel[2]]: 'doing' };   // มุม กบค. ก่อนตรวจรับ: 2 คันรอตรวจรับ · คันที่ 3 กำลังทำ · ที่เหลือยังไม่เริ่ม
const HIRE_VENDOR = { [TRIP_V.sel[0]]: 'returned', [TRIP_V.sel[1]]: 'wait', [TRIP_V.sel[2]]: 'worked', [TRIP_V.sel[3]]: 'doing' };   // มุมผู้รับจ้างหลัง กบค. ตรวจไปบางคัน
async function hireJob(name, o) {   // o.st = worked|reported|wait|returned · o.cannot = คันที่แจ้งบำรุงรักษาไม่ได้ · o.kbk = มุม กบค. (S11) · o.decision = 'return' · o.reason · o.errors
  o = o || {};
  const t = HIRE_T, cannot = !!o.cannot, i = cannot ? HIRE_CANNOT : HIRE_DONE, c = TRIP_CARS[i], s = o.st;
  const ed = !o.kbk && ['worked', 'reported', 'wait', 'returned'].indexOf(s) >= 0;   // ผู้รับจ้างแก้ไข ลบ อะไหล่และภาพได้ (เจ้าของงาน 4 พ.ย. 2569 "หน้า i22-i26") · มุม กบค. (S11) ดูอย่างเดียว
  const acts = o.kbk ? null
    : s === 'worked' || s === 'reported' ? [['Secondary button', 'แก้ไขงาน'], ['Primary button', 'ส่งตรวจงาน']]
    : s === 'returned' ? (cannot ? [['Secondary button', 'บำรุงรักษาไม่ได้'], ['Primary button', 'เริ่มงาน']] : [['Primary button', 'แก้ไขงาน']]) : null;   // ส่งกลับคันที่แจ้งไม่ได้ = ปุ่มกลับเป็นแบบก่อนแจ้ง (ยังไม่เริ่ม)
  const { scr, page } = await shell(name, { title: c[0], back: true, crumbs: ['แผนเดินทาง ' + NOW_Q, t.name, c[0]], badge: WSTAT[s], actions: acts });
  const nodes = [];
  if (s === 'returned') nodes.push(alertBox('Error', 'กบค. ส่งกลับให้แก้ไข', cannot ? HIRE_BACK_CANNOT : HIRE_BACK));
  nodes.push(await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภท', 'รถกระเช้า'], ['หน่วยงานเจ้าของรถ', c[2]], ['เลขไมล์สะสม', '176,050 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '5,840 ชม.']]),
    await vehicleInfo([['แผนเดินทาง', t.name], ['ผู้รับจ้าง', t.vendor], ['ช่วงวันทำงาน', t.d1 + ' – ' + t.d2], ['สถานที่บำรุงรักษา', tripLoc(i, t.locs)], ['เบอร์ติดต่อ', tripPhone(i, t.phones)]]
      .concat(s === 'wait' ? [['ส่งตรวจงานเมื่อ', cannot ? '18/11/2569 08:50 น.' : HIRE_SENT], ['ผู้ส่ง', HIRE_BY]] : []), 'การนัดหมาย'));
  if (cannot) nodes.push(await vehicleInfo([['สาเหตุที่บำรุงรักษาไม่ได้', HIRE_WHY], ['ผู้แจ้ง', HIRE_BY], ['แจ้งเมื่อ', HIRE_REPORTED]], 'บำรุงรักษาไม่ได้'));
  else nodes.push(await vehicleInfo([['เริ่มงาน', HIRE_START], ['ปิดงาน', HIRE_END], ['ผู้บันทึก', HIRE_BY], ['เลขไมล์หลังทำ', '176,090 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '5,846 ชม.'], ['น้ำมันไฮโดรลิก', JOB_OIL_OPTS[JOB_OIL]]], 'ผลการบำรุงรักษา'),
    ed ? await photoFiles() : await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length, buttons: ed ? [ADD_PART] : null }),
      await tbl(ed ? WORK_COLS2.concat([['', 104]]) : WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]].concat(ed ? [EDIT_ICONS] : [])))], 16));
  nodes.push(await retTable(cannot ? null : WORK.map(w => w[3]), true, ed));
  if (o.partEdit) await partEditModal(scr, WORK[PART_K]);
  if (o.partAdd) await partAddModal(scr, o.partAdd === 'filled');
  if (o.partDel) await confirm(scr, PART_DEL_CONFIRM(WORK[PART_K]));   // ปิดงาน = จำนวนที่คืนจากหน้าปิดงาน · แจ้งไม่ได้ = จาก popup
  if (o.kbk && s === 'wait') {   // S11 ผลการพิจารณาแบบ S2 (เจ้าของงาน 3 พ.ย. 2569 "ใช้แบบการ์ดเหมือน S2")
    const ret = o.decision === 'return';
    const dec = await radioPick('ผลการพิจารณา', [['อนุมัติ', 'งานของรถคันนี้ผ่านการตรวจรับ และรับคืนอะไหล่ตามรายการ'], ['ส่งกลับแก้ไข', 'แจ้งเหตุผลให้ผู้รับจ้างแก้ไขแล้วส่งตรวจงานใหม่']], ret ? 1 : 0, { label: true });
    if (ret) add(dec, area('เหตุผลที่ส่งกลับ', o.reason, { placeholder: 'ระบุเหตุผลที่ส่งกลับ', error: o.errors ? 'กรุณาระบุเหตุผลที่ส่งกลับ' : '' }), 'h');
    nodes.push(dec, btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg' }]]));
  }
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
const HIRE_SEND_CONFIRM = (c) => ({ title: 'ยืนยันส่งตรวจงาน · ' + c[0], sub: 'งานของรถคันนี้จะส่งให้ กบค. ตรวจรับ', ok: 'ส่งตรวจงาน' });   // 4 พ.ย. 2569 รอตรวจรับยังแก้ไขได้ (เจ้าของงานให้ I.25 มีแก้ไข ลบ) ⇒ ตัด "ระหว่างรอตรวจรับจะแก้ไขไม่ได้"
/* แก้ไข ลบ อะไหล่และภาพของผู้รับจ้าง (4 พ.ย. 2569 เจ้าของงาน "ส่วนที่เป็นอะไหล่ที่ใช้จริง และ อะไหล่ส่งคืน ต้องมีสัญลักษณ์ให้แก้ไขได้ ลบรายการได้ รูปภาพ แก้ไขได้ ลบได้ และกดแล้ว จะสามารถแก้ไข")
   ตาราง = คอลัมน์ไอคอนแก้ไข + ลบ กว้าง 104 แบบตารางอะไหล่ในไตรมาสของ S1 · ไอคอนแก้ไขทั้งสองตาราง = popup เดียวกัน (จำนวนที่คืนคำนวณจากจำนวนที่ใช้จริง)
   ภาพ = File upload ของไลบรารี (รายการไฟล์มีปุ่มลบ · อัปโหลดใหม่แทนภาพเดิม) แบบภาพก่อนเริ่มงานในหน้ารับรถ · Images ของไลบรารีไม่มีปุ่มแก้ไข ลบ */
const EDIT_ICONS = { icons: ['stylus-24-300-round', 'delete-24-300-round'] }, PART_K = 3;   // ตัวอย่างแก้ = ไส้กรองอากาศ (ใช้ 1 คืน 1)
const photoFiles = (o) => upload('ภาพก่อนเริ่มงาน', BEFORE.map((b, k) => jpg('before-' + (k + 1))).concat(o && o.uploading ? [Object.assign(jpg('before-3'), { progress: 60 })] : []), { hint: 'JPG, PNG · สูงสุด 10 ภาพ', bar: true });   // อัปโหลดแล้วมีแถบ 100% · กำลังอัปโหลดแถบตาม % (4 พ.ย. 2569)
async function partEditModal(scr, w) {
  await popupModal(scr, { title: 'แก้ไขอะไหล่ · ' + w[1], ok: 'บันทึก',
    body: [field('รายการงาน', w[0], { state: 'Readonly' }),
      row('Row', [field('จำนวนตามแผน', w[2] + ' ' + w[4], { state: 'Readonly' }), field('จำนวนที่ใช้จริง (' + w[4] + ')', w[3]), field('จำนวนที่คืน', (+w[2] - +w[3]) + ' ' + w[4], { state: 'Readonly' })])] });
}
/* เพิ่มรายการ (4 พ.ย. 2569 เจ้าของงาน "scen V ต้องมีเพิ่มรายการได้ด้วย") — ปุ่ม "เพิ่มอะไหล่" ที่หัวตารางแบบหน้างานรายคันของ กบค. (S10) · ผู้รับจ้างไม่ได้เลือกจากคลัง กบค.
   ⇒ popup กรอกเองแบบ "รายการเพิ่มเติม" ของหน้าอะไหล่ของรถ (S21) + จำนวนที่ใช้จริงและหน่วย · เพิ่มแล้วขึ้นในอะไหล่ที่ใช้จริง และจำนวนที่คืนเป็น 0 */
const ADD_PART = { kind: 'Secondary button', text: 'เพิ่มอะไหล่', icon: 'add-24-300-round' };
async function partAddModal(scr, filled) {
  await popupModal(scr, { title: 'เพิ่มอะไหล่ที่ใช้จริง', ok: 'เพิ่ม',
    body: [field('ชื่ออะไหล่', filled ? 'ไส้กรองเชื้อเพลิง' : '', { placeholder: 'ระบุชื่ออะไหล่' }), field('รหัสอะไหล่', filled ? 'FF-5052' : '', { placeholder: 'ระบุรหัสอะไหล่', optional: true }),
      row('Row', [field('จำนวนที่ใช้จริง', filled ? '1' : '', { placeholder: '0' }), dropdown('หน่วย', filled ? 'ชิ้น' : '', { placeholder: 'เลือกหน่วย' })])] });
}
const PART_DEL_CONFIRM = (w) => ({ danger: true, title: 'ยืนยันการเอาอะไหล่ออก', sub: w[1] + ' จะถูกเอาออกจากรถคันนี้', cancel: 'ยกเลิก', ok: 'เอาออก' });
const HIRE_OK_CONFIRM = (c, cannot) => ({ title: 'ยืนยันอนุมัติงานบำรุงรักษา · ' + c[0], sub: 'รถคันนี้จะเป็น "' + (cannot ? 'บำรุงรักษาไม่ได้' : 'เสร็จสิ้น') + '" และรับคืนอะไหล่ตามรายการ', ok: 'อนุมัติ' });
const HIRE_BACK_CONFIRM = { title: 'ยืนยันส่งกลับแก้ไข', sub: 'งานของรถคันนี้จะกลับไปให้ผู้รับจ้างแก้ไขตามเหตุผลที่ระบุ แล้วส่งตรวจงานใหม่', ok: 'ส่งกลับ' };
const WORK_COLS2 = [['รายการงาน', 0], ['อะไหล่ที่ใช้', 320], ['จำนวนตามแผน', 140], ['จำนวนที่ใช้จริง', 140], ['หน่วย', 110]];
/* ปิดงาน = หน้าเดียวไล่ยาว ไม่มี stepper ไม่มีส่วนภาพ (3 พ.ย. 2569 เจ้าของงานวางข้อความเฟรม "รายงานปิดงาน" ของงานซ่อม: "หน้าปิดงานอยากได้สไตล์แบบนี้ ยังไม่ต้องมีเพิ่มรูป และไม่ต้องมี stepper")
   ส่วนตามเฟรม: ข้อมูลเอกสาร · บันทึกข้อตกลงลูกค้า (Section header + Content item row) · รายการสภาพวัสดุอะไหล่ (Table ของไลบรารี 8 คอลัมน์)
   · บันทึกตรวจสอบเอกสารปิดงาน (แถว Horizontal radio groups มี/ไม่มี/ไม่ต้องใช้ + ปุ่มอัพโหลดเอกสาร — แถวแบบ MA table ในเฟรมเดียวกัน · ตารางของเฟรมมี radio ในช่อง ซึ่ง Table ของไลบรารีไม่มี)
   ผลการบำรุงรักษา (เลขไมล์ ชั่วโมงเครื่องจักร เก็บตัวอย่างน้ำมัน) คงไว้เพราะ S12 และบอร์ดต้องใช้ — ไม่อยู่ในเฟรม (จดยังไม่เคาะ) */
const CLOSE_PARTS = [   // ชื่ออะไหล่ · ราคาต่อหน่วย · จำนวนที่ใช้ · ราคารวมที่ใช้ · จำนวนที่คืน · ราคารวมที่คืน · จำนวนอะไหล่เก่า · หมายเหตุ (ลำดับคอลัมน์ตาม ReturnPart)
  ['น้ำมันไฮโดรลิก ISO VG 46', '120', '30', '3,600', '0', '0', '30', 'น้ำมันเก่าส่งกำจัดตามระเบียบ'],
  ['ไส้กรองไฮโดรลิก', '680', '2', '1,360', '0', '0', '2', ''],
  ['ไส้กรองน้ำมันเครื่อง', '250', '2', '500', '0', '0', '2', ''],
  ['ไส้กรองอากาศ', '420', '1', '420', '1', '420', '1', 'ไส้กรองเดิมอีกลูกยังใช้ได้']];
const CLOSE_PART_HEADS = ['ชื่ออะไหล่', 'ราคาต่อหน่วย', 'จำนวนที่ใช้', 'ราคารวมที่ใช้', 'จำนวนที่คืน', 'ราคารวมที่คืน', 'จำนวนอะไหล่เก่า', 'หมายเหตุ'];
const CLOSE_DOCS_REPAIR = ['บันทึกสั่งงาน/สำเนาบันทึกสั่งงาน', 'บันทึกรับงานเข้างาน', 'ใบเบิกของ', 'ใบส่งของคลัง', 'สำเนาอนุมัติหลักการจัดซื้อ', 'สำเนาบิลส่งของเรื่องจัดซื้อ', 'สำเนาอนุมัติหลักการจัดจ้าง', 'สำเนาบิลส่งของเรื่องจัดจ้าง',
  'บันทึกการตรวจสอบวัสดุอะไหล่', 'สำเนาใบส่งคืนคลังพัสดุ', 'บันทึกการตรวจสภาพบำรุงรักษา', 'บันทึกทดสอบก่อนซ่อม/หลังซ่อม', 'รายงานออกปฏิบัติงานส่วนภูมิภาค', 'เรื่องแจ้งงานเสร็จ', 'เรื่องแจ้งงดซ่อม'];   // ตามเฟรมของเจ้าของงาน
const CLOSE_DOCS = ['บันทึกใบสั่งการ'];   // 3 พ.ย. 2569 เจ้าของงาน "ส่วนนี้ตัดเหลือแค่ 1 รายการ คือบันทึกใบสั่งการ แค่นั้น และมีให้เพิ่มรายการได้" (15 รายการของงานซ่อมเก็บไว้ที่ CLOSE_DOCS_REPAIR)
const CLOSE_DOC_SEL = [0];   // กรอกครบ: 0 มี · 1 ไม่มี · 2 ไม่ต้องใช้
async function closeParts(rows, filled) {   // รายการสภาพวัสดุอะไหล่ = Table ของไลบรารี 8 คอลัมน์ตามเฟรม · ReturnPart ไม่ใช้ (ดัมป์เป็นรุ่นเก่าคอลัมน์ไม่ตรงเฟรม และไฟล์ Maintain-D1 ไม่มี) · ช่องตารางพิมพ์ค่าไม่ได้ (Table cell ไม่มีแบบช่องกรอก) แสดงเป็นข้อความ
  const val = (r) => (filled ? r : r.slice(0, 6).concat(['0', ''])).map((x, i) => i === 7 && !x ? '-' : x);   // ฟอร์มว่าง: จำนวนที่ใช้ตั้งต้นตามแผน · อะไหล่เก่า 0 · หมายเหตุ "-"
  const cols = CLOSE_PART_HEADS.map((h, i) => [h, i === 0 ? 220 : i === 7 ? 0 : 118, i ? 'Text' : 'Lead text']);
  return col('Section', [await section('รายการสภาพวัสดุอะไหล่', { badge: rows.length }), await tbl(cols, rows.map(val)), btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round' })], 16);
}
async function closeDocs(filled) {   // บันทึกตรวจสอบเอกสารปิดงาน: 1 แถว = เอกสาร 1 รายการ (radio มี / ไม่มี / ไม่ต้องใช้ + ปุ่มอัพโหลดเอกสาร)
  const rows = CLOSE_DOCS.map((d, i) => {
    const g = radioGroup(d, ['มี', 'ไม่มี', 'ไม่ต้องใช้'], filled ? CLOSE_DOC_SEL[i] : -1);
    const b = btn('Secondary button', 'อัพโหลดเอกสาร', { icon: 'cloud_upload-24-300-round', disabled: filled && CLOSE_DOC_SEL[i] !== 0 });
    if (MOB) return col('Row', [g, b], 12);
    const r = row('Row', [g, b], { gap: 24, hug: true, align: 'MAX' }); g.layoutGrow = 1;
    return r;
  });
  return col('Section', [await section('บันทึกตรวจสอบเอกสารปิดงาน', { badge: CLOSE_DOCS.length })].concat(rows, [btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round' })]), 16);
}
/* ค่าใช้จ่ายของรถคันนี้ (3 พ.ย. 2569 เจ้าของงาน "ค่าที่พัก ค่าเดินทาง … จะมีให้กรอกอีกทีตอนปิดงาน โดยรายละเอียดเรื่องค่าใช้จ่ายของรถแต่ละคันจะกรอกแยกกัน และมีให้เลือกงบประมาณตอนปิดงานด้วย
   โดยเบื้องต้นจะ default เป็นศูนย์ต้นทุนของเจ้าของรถคันนั้นๆ เนื่องจากพวกค่าอะไหล่จะเป็นของ กบค. แต่ค่าเดินทาง และค่าใช้จ่ายจะเป็นของหน่วยงานเจ้าของรถ")
   รอบ 2 (3 พ.ย. 2569 "ย้ายค่าใช้จ่ายไปต่อจากรายการสภาพวัสดุอะไหล่ ค่าใช้จ่ายอยากให้กรอกละเอียดรายคน และมีการรวมค่าใช้จ่ายให้ด้วย แล้วถึงจะให้เลือกงบที่ตัด ซึ่งอยากเปลี่ยนเป็น งบประมาณ (ศูนย์ต้นทุน)")
   ⇒ 1 แถวต่อพนักงาน กบค. ซ่อม 1 คนในแผนเดินทาง: พนักงาน (Readonly) · ค่าเบี้ยเลี้ยง · ค่าที่พัก · ค่าเดินทาง (ถ้ามี) · รวม (Readonly คำนวณ)
   → สรุปรวม (Content item row) → Input dropdown "งบประมาณ (ศูนย์ต้นทุน)" ตั้งต้นศูนย์ต้นทุนของหน่วยงานเจ้าของรถ (เลิกใช้คู่ "งบที่ตัด" + "ศูนย์ต้นทุน") */
/* รอบ 3 (3 พ.ย. 2569 "ค่าเบี้ยเลี้ยงใส่เป็นรายวัน ค่าที่พักใส่เป็นรายวัน แล้วเลือกจำนวนวันค่อยมาคูณ ส่วนค่าเดินทางอยากเป็นรวมของทุกคนที่ไปแผนการเดินทางนั้น ใส่แค่ช่องเดียว
   … หลังจากการกรอกเบี้ยเลี้ยง ค่าที่พักเรียบร้อยแล้วค่อยมีให้กรอกค่าเดินทางด้านล่าง") ⇒ แถวต่อคน: พนักงาน · ค่าเบี้ยเลี้ยง (บาท/วัน) · ค่าที่พัก (บาท/วัน) · จำนวนวัน (เลือก) · รวม = (เบี้ยเลี้ยง + ที่พัก) × วัน
   → ค่าเดินทาง (รวมทุกคน) ช่องเดียวใต้แถว → สรุปรวม → งบประมาณ (ศูนย์ต้นทุน) */
const CLOSE_COST_BY = [[TRIP.staff[0], 240, 800, 2], [TRIP.staff[1], 240, 800, 2], [TRIP.staff[2], 240, 800, 1]];   // พนักงาน · เบี้ยเลี้ยง/วัน · ที่พัก/วัน · จำนวนวัน
const CLOSE_TRAVEL = 1210;   // ค่าเดินทางรวมทุกคน
const nf = (n) => n.toLocaleString('en-US');
const personSum = (r) => (r[1] + r[2]) * r[3];
const costSum = (k) => CLOSE_COST_BY.reduce((a, r) => a + r[k] * r[3], 0);
const CLOSE_COST = { perDiem: nf(costSum(1)), lodging: nf(costSum(2)), travel: nf(CLOSE_TRAVEL), total: nf(costSum(1) + costSum(2) + CLOSE_TRAVEL) };
const OWNER_CC = (c) => 'E301010000 ' + c[2] + ' - บริหาร';   // ศูนย์ต้นทุนของหน่วยงานเจ้าของรถ (ข้อมูลจำลอง)
async function closeCosts(filled) {
  const c = TRIP_CARS[JOB_I];
  const money = (label, v) => field(label, filled ? nf(v) : '', { placeholder: '0', optional: true });
  // 3 พ.ย. 2569 เจ้าของงาน "เพิ่ม ลด พนักงานได้" ⇒ พนักงาน = Input dropdown ค้นชื่อ (ตั้งต้นตามแผนเดินทาง) · ปุ่มลบท้ายแถว (Tertiary button ไอคอนอย่างเดียว) · ปุ่ม "เพิ่มพนักงาน" ใต้แถว
  const delBtn = () => inst('Tertiary button', { State: 'Default', Size: 'md' }, { 'Button text': false, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('delete-24-300-round') });
  const rows = CLOSE_COST_BY.map(r => {
    const kids = [dropdown('พนักงาน กบค. ซ่อม', r[0], { placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round' }), money('ค่าเบี้ยเลี้ยง (บาท/วัน)', r[1]), money('ค่าที่พัก (บาท/วัน)', r[2]),
      dropdown('จำนวนวัน', filled ? r[3] + ' วัน' : '', { placeholder: 'เลือกจำนวนวัน' }), field('รวม (บาท)', filled ? nf(personSum(r)) : '0', { state: 'Readonly' })];
    if (MOB) return col('Row', kids.concat([delBtn()]), 16);
    const rw = row('Row', kids, { align: 'MAX' }); const d = delBtn(); rw.appendChild(d);   // ปุ่มลบไม่ยืด
    return rw;
  });
  const sum = filled ? CLOSE_COST : { perDiem: '0', lodging: '0', travel: '0', total: '0' };
  return col('Section', [await section('ค่าใช้จ่ายของรถคันนี้ (บาท)', { badge: CLOSE_COST_BY.length + ' คน' })]   // 3 พ.ย. 2569 เจ้าของงานลบกล่องแจ้งในไฟล์เองแล้ว "ลบใน script อย่างเดียว … export ต้องไม่มี"
    .concat(rows, [btn('Secondary button', 'เพิ่มพนักงาน', { icon: 'add-24-300-round' }), row('Row', [money('ค่าเดินทาง (รวมทุกคน)', CLOSE_TRAVEL), frame('Spacer', 'VERTICAL')]),
      kv([['รวมค่าเบี้ยเลี้ยง', sum.perDiem + ' บาท'], ['รวมค่าที่พัก', sum.lodging + ' บาท'], ['ค่าเดินทาง', sum.travel + ' บาท'], ['รวมค่าใช้จ่ายของรถคันนี้', sum.total + ' บาท']]),
      row('Row', [dropdown('งบประมาณ (ศูนย์ต้นทุน)', OWNER_CC(c), { placeholder: 'เลือกศูนย์ต้นทุน' }), frame('Spacer', 'VERTICAL')])]), 16);
}
/* ---------- รับรถก่อนเริ่มงาน + ตรวจสภาพตอนปิดงาน (3 พ.ย. 2569 เจ้าของงาน "ตอนกดเริ่มงาน อยากได้หน้าที่เป็นรายการรับรถ และมีให้ลงนาม และตอนปิดงานก็เหมือนกัน มีให้ตรวจสภาพรถปิดงาน") ----------
   แบบอย่าง = component ของ Flow การซ่อม (ไฟล์ Maintain-D หน้า Design) ที่ Overhaul S8 ใช้: ReceiptChecklist "รายการเอกสารรับรถ" + HandoverSignature "ลงนามการรับมอบรถ" + Modal Signature
   · ปิดงาน = InspectionChecklist (รายการตรวจสภาพรถกระเช้า ปกติ/ต้องแก้ไข) AfterRepair=true เหลือ HandoverSignature "ลงนามการส่งคืนรถ" (ซ่อน RepairFeedback ReturnPart เพราะหน้าปิดงานมีตารางอะไหล่แล้ว)
   ไฟล์ไม่มี component เหล่านี้ / มือถือ → แบบสำรองจากไลบรารี: แถว Horizontal radio groups 2 คอลัมน์ + หมายเหตุ + ช่องผู้ลงนาม (Input dropdown) + ปุ่มเซ็นลงนาม / Pill outline ลงนามแล้ว */
const RECEIPT_ITEMS = ['แผ่นป้ายทะเบียนหน้า - หลัง', 'ป้ายทะเบียนติดกระจกและ พรบ.', 'กระจกมองข้างซ้าย - ขวา, กระจกมองหลัง', 'ยางอะไหล่', 'แบตเตอรี่', 'เครื่องมือประจำรถ, แม่แรง, ประแจถอดล้อ', 'ฝาถังน้ำมัน',
  'อุปกรณ์บนหน้าปัด, แตร', 'ใบปัดน้ำฝน', 'วิทยุ, ลำโพง, เสาอากาศ, วิทยุรับ - ส่ง', 'ระบบไฟแสงสว่าง', 'สภาพยาง', 'สภาพตัวถังและสี'];   // ตาม ReceiptChecklist ของงานซ่อม
const INSPECT_ITEMS = ['ชุดเกียร์ PTO', 'ชุดกระบอกขาช้างหน้า ซ้าย ขวา', 'ชุดกระบอกขาช้างหลัง ซ้าย ขวา', 'ชุดวาร์ลคอนโทรลขาช้าง', 'เพลาขับปั๊มน้ำมันไฮดรอลิค', 'ปั๊มน้ำมันไฮดรอลิค', 'ชุดยึดฐานเครน', 'ชุดโรตารี่',
  'ชุดมอเตอร์และเฟื่องหมุนฐานเครน', 'ชุด CONTROL ล่าง', 'ชุดกระบอก LOWER BOOM', 'ชุดกระบอก UPPER BOOM', 'ชุดกระบอก เทน้ำ-ปรับดิ่ง', 'จุดเชื่อมต่อโครงสร้าง BOOM', 'ชุดวาล์วล๊อคต่างๆ', 'สายน้ำมันไฮดรอลิค',
  'ชุด CONTROL บน', 'กระบอกปรับบิด', 'BUCKET, LINER, ชุดการ์ดครอบ', 'ระบบ EMERGENCY', 'ระบบเร่งเครื่องยนต์', 'สายสัญญาณต่างๆ', 'รอกและเชือกวินซ์', 'ชุด LIFT รุ่น 115 kV'];   // ตาม InspectionChecklist ของงานซ่อม
const SIGN_OWNER = 'นายสุรชัย แก้วมณี', SIGN_DATE = '04/11/2569';
/* ---------- แบบสำรองเมื่อไฟล์ไม่มี component ของงานซ่อม (3 พ.ย. 2569 เจ้าของงาน "ตารางที่เป็นรับรถ ผิด" · "ให้ตรงกับของเดิมที่ทำไปแล้ว")
   ลอกโครงจาก ReceiptChecklist / InspectionChecklist / HandoverSignature ในไฟล์ Maintain-D หน้า Design (ดัมป์ maintain-d/0-1.json):
   desktop = ตาราง หัว Table header cell + ช่องแถวสลับสี ช่องสูง 56 · ช่องที่มี Radio button / Checkbox / Text input เป็น Table cell ที่ detach แล้ววางตัวควบคุมไว้ข้างใน
   (แบบเดียวกับต้นฉบับ — Table cell ของไลบรารีไม่มี Style radio/checkbox/ช่องกรอก · component Table ใส่ไม่ได้) · ปุ่ม "เพิ่มรายการ" แถวท้ายคอลัมน์แรก
   mobile = การ์ดรายการละใบ (ReceiptChecklistCard / InspectionChecklistCard): Section label ชื่อรายการ + Radio text card 2 ใบ · รายการรับรถที่เลือก "มี" เพิ่ม "สภาพ (ถ้ามี)" Checkbox text card ชำรุด/ผิดรุ่น
   ลงนาม = ผู้ส่งมอบ/ผู้รับมอบ ช่องละคอลัมน์ · ยังไม่เซ็น "เซ็นลงนาม" (กดไม่ได้จนเลือกชื่อ) · เซ็นแล้ว "แก้ไขลงนาม" + Pill "ลงนามแล้ว" */
function ctrlCell(alt, text, ctrl, grow) {   // ช่องข้อความ = Table cell ของไลบรารีตรงๆ · ช่องตัวควบคุม/ช่องว่าง = Table cell ที่ detach (สี/ระยะตามไลบรารี) แล้วใส่ตัวควบคุมแทนข้อความ
  const c = inst('Table cell', { Style: 'Text', 'Alternating fills': alt ? 'True' : 'False' }, { Text: text || ' ', Supporting: false });
  if (text && !ctrl) return c;
  const f = c.detachInstance(); f.name = 'Table cell';
  f.children.slice().forEach(k => k.remove());
  if (ctrl) { f.appendChild(ctrl); if (grow) ctrl.layoutGrow = 1; }
  return f;
}
function checkTable(items, cols, addRow) {   // cols: [หัว, กว้าง (0 = ยืด), (แถว) => ตัวควบคุม, ยืดตัวควบคุม]
  const t = frame('Content with scrollbar', 'HORIZONTAL');
  cols.forEach(([head, w, make, grow], ci) => {
    const c = frame('Column', 'VERTICAL'); t.appendChild(c);
    if (w) { c.layoutSizingHorizontal = 'FIXED'; c.resize(w, c.height); } else c.layoutGrow = 1;
    add(c, inst('Table header cell', { Checkbox: 'False' }, { Text: head, 'Sort icon': false, 'Header text': true }), 'h');
    items.forEach((it, ri) => add(c, ctrlCell(ri % 2, ci === 0 ? it : '', ci === 0 ? null : make(ri), grow), 'h'));
    if (addRow) add(c, ctrlCell(items.length % 2, '', ci === 0 ? btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round' }) : null), 'h');
  });
  return t;
}
const radioCell = (on) => inst('Radio button', { State: 'Default', Selected: on ? 'True' : 'False' });
const checkCell = (on, off) => inst('Checkbox', { State: off ? 'Disabled' : 'Default', Type: on ? 'Selected' : 'Unselected' });
function noteCell(v) { const n = field('หมายเหตุ', v, { placeholder: 'ระบุหมายเหตุ', optional: true }); setProps(n, { Label: false }); return n; }
function checkCard(title, opts, sel, more) {   // การ์ดรายการบนมือถือ — กรอบ/พื้นจาก Mobile table ของไลบรารี มุม 12 ตามการ์ดต้นฉบับ
  const card = frame('ChecklistCard', 'VERTICAL', { gap: 16, pad: 16 });
  const ref = inst('Mobile table', { 'Alternating fills': 'False' });
  card.fills = ref.fills || [{ type: 'SOLID', color: WHITE }]; card.strokes = ref.strokes || []; card.strokeWeight = 1; card.cornerRadius = 12; ref.remove();
  add(card, inst('Section label', { Breakpoint: 'Mobile' }, { Title: title, Supporting: false, 'Info icon': false, 'More actions': false, Actions: false }), 'h');
  add(card, row('Radio', opts.map((t, i) => inst('Radio text card', { State: 'Default', Selected: i === sel ? 'True' : 'False' }, { Text: t, Supporting: false })), { keep: true, gap: 16 }), 'h');
  (more || []).forEach(n => add(card, n, 'h'));
  return card;
}
const RECEIPT_NOTE = { 11: 'ยางหลังซ้ายสึก แจ้งเจ้าของรถแล้ว' }, RECEIPT_BAD = 11;   // ข้อมูลจำลองตอนกรอกครบ: ทุกรายการ "มี" · สภาพยาง ชำรุด
const INSPECT_NOTE = { 15: 'มีรอยซึม นัดเปลี่ยนรอบถัดไป' }, INSPECT_FIX = 15;   // ตรวจสภาพปิดงาน: สายน้ำมันไฮดรอลิค ต้องแก้ไข
async function signSection(title, who, filled, signed) {   // HandoverSignature แบบสำรอง
  const box = (label, name) => col('Container', [dropdown(label, filled ? name : '', { placeholder: 'เลือก' + label }),
    signed ? row('Signed', [btn('Secondary button', 'แก้ไขลงนาม'), pill('ลงนามแล้ว', 'Success')], { hug: true, keep: true, gap: 16, align: 'CENTER' })
      : row('Sign', [btn('Secondary button', 'เซ็นลงนาม', { disabled: !filled })], { hug: true, keep: true })], 16);
  return col('Section', [await section(title), row('Row', [box(who[0][0], who[0][1]), box(who[1][0], who[1][1])])], 16);
}
async function signModal(scr, title, filled) {   // Modal Signature ของงานซ่อม · ไม่มี/มือถือ → popup ยืนยันแบบ Overhaul
  if (MOB || !has('Modal Signature')) { await confirm(scr, { title, sub: filled ? 'เซ็นลงนามแล้ว' : 'เซ็นลงนามในช่องด้านล่าง', cancel: 'ปิด', ok: 'บันทึก' }); return; }
  const m = inst('Modal Signature', { State: filled ? 'Filled' : 'Default' }); m.name = 'Modal Signature';
  overlay(scr, m, 0, 0);
  modalHead(find(m, 'Modal header'), title, '');
  const ft = find(m, 'Modal footer');
  if (ft) { const sb = find(ft, 'Secondary button'); if (sb) setProps(sb, { Text: 'ปิด', 'Leading icon': false, 'Trailing icon': false }); const pb = find(ft, 'Primary button'); if (pb) setProps(pb, { Text: 'บันทึก', 'Leading icon': false, 'Trailing icon': false }); }
}
async function receiptPanel(filled, signed) {
  const o = { filled, signed };   // รายการรับรถ + ลงนามการรับมอบรถ
  if (has('ReceiptChecklist') && has('HandoverSignature')) {   // ต้นฉบับมี Breakpoint Mobile ด้วย (การ์ดรายการละใบ) ⇒ ใช้ทั้งสองขนาด
    const rc = inst('ReceiptChecklist', { Breakpoint: BP(), State: filled ? 'Filled' : 'Default' }); rc.name = 'ReceiptChecklist';
    const hs = inst('HandoverSignature', { State: signed ? 'Signed' : filled ? 'Filled' : 'Default' }); hs.name = 'HandoverSignature';
    return [rc, hs];
  }
  const sel = (i) => o.filled ? 0 : -1;
  const list = MOB
    ? RECEIPT_ITEMS.map((t, i) => checkCard(t, ['มี', 'ไม่มี'], sel(i), sel(i) === 0 ? [col('Checklist', [syncLabel(inst('Input label', {}, { 'Label text': 'สภาพ', Optional: true }), 'สภาพ', true),
        row('Check', [['ชำรุด', i === RECEIPT_BAD], ['ผิดรุ่น', false]].map(([x, on]) => inst('Checkbox text card', { State: 'Default', Selected: on ? 'True' : 'False' }, { Text: x, Supporting: false })), { keep: true, gap: 16 })], 8)] : []))
      .concat([btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round', size: 'lg' })])
    : [checkTable(RECEIPT_ITEMS, [['รายการ', 0], ['มี', 100, i => radioCell(sel(i) === 0)], ['ไม่มี', 100, i => radioCell(sel(i) === 1)],
        ['ชำรุด', 100, i => checkCell(o.filled && i === RECEIPT_BAD, !o.filled)], ['ผิดรุ่น', 100, i => checkCell(false, !o.filled)],
        ['หมายเหตุ', 450, i => noteCell(o.filled ? RECEIPT_NOTE[i] || '' : ''), true]], true)];
  return [col('ReceiptChecklist', [await section('รายการเอกสารรับรถ', { badge: RECEIPT_ITEMS.length })].concat(list), 16),
    await signSection('ลงนามการรับมอบรถ', [['ผู้ส่งมอบรถ (หน่วยงานเจ้าของรถ)', SIGN_OWNER], ['ผู้รับมอบรถ (กบค.)', JOB_BY.replace(' (กบค.)', '')]], o.filled, o.signed)];
}
async function inspectPanel(filled, signed) {
  const o = { filled, signed };   // ตรวจสภาพรถปิดงาน + ลงนามการส่งคืนรถ
  if (has('InspectionChecklist')) {
    const ic = inst('InspectionChecklist', { Breakpoint: BP(), State: filled ? 'Filled' : 'Default' }, { AfterRepair: true }); ic.name = 'InspectionChecklist';
    const sh = ic.children.find(c => c.name === 'Section header'); if (sh) setProps(sh, { Title: 'ตรวจสภาพรถปิดงาน' });
    const ar = find(ic, 'AfterRepair');
    if (ar) { ['RepairFeedback', 'ReturnPart'].forEach(nm => { const x = find(ar, nm); if (x) x.visible = false; });
      const hs = find(ar, 'HandoverSignature'); if (hs) setProps(hs, { State: signed ? 'Signed' : filled ? 'Filled' : 'Default' }); }
    return [ic];
  }
  const sel = (i) => o.filled ? (i === INSPECT_FIX ? 1 : 0) : -1;
  const list = MOB
    ? INSPECT_ITEMS.map((t, i) => checkCard(t, ['ปกติ', 'ต้องแก้ไข'], sel(i))).concat([btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round', size: 'lg' })])
    : [checkTable(INSPECT_ITEMS, [['รายการ', 0], ['ปกติ', 100, i => radioCell(sel(i) === 0)], ['ต้องแก้ไข', 100, i => radioCell(sel(i) === 1)],
        ['หมายเหตุ', 448, i => noteCell(o.filled ? INSPECT_NOTE[i] || '' : ''), true]], true)];
  return [col('InspectionChecklist', [await section('ตรวจสภาพรถปิดงาน', { badge: INSPECT_ITEMS.length })].concat(list), 16),
    await signSection('ลงนามการส่งคืนรถ', [['ผู้ส่งมอบรถ (กบค.)', JOB_BY.replace(' (กบค.)', '')], ['ผู้รับมอบรถ (หน่วยงานเจ้าของรถ)', SIGN_OWNER]], o.filled, o.signed)];
}
async function receivePage(name, o) {   // หน้ารับรถเข้าบำรุงรักษา (กดเริ่มงาน) · o.filled · o.signed · o.modal = เปิดลงนาม
  o = o || {};
  const t = JOB_T, i = JOB_I, c = TRIP_CARS[i];
  const { scr, page } = await shell(name, { title: 'รับรถเข้าบำรุงรักษา · ' + c[0], back: true, crumbs: ['แผนเดินทาง ' + NOW_Q, t.name, c[0], 'รับรถ'] });
  const nodes = [await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['หน่วยงานเจ้าของรถ', c[2]], ['สถานที่บำรุงรักษา', tripLoc(i, t.locs)], ['เบอร์ติดต่อ', tripPhone(i, t.phones)], ['วันที่รับรถ', SIGN_DATE]])]
    .concat(await receiptPanel(o.filled, o.signed),
      [col('Section', [await section('ภาพก่อนเริ่มงาน')].concat(await photoUploads(BEFORE, o.filled, false)), 16),
        btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันรับรถและเริ่มงาน', { size: 'lg', disabled: !o.signed }]])]);
  add(page, col('Content', nodes, 32), 'h');
  if (o.modal) await signModal(scr, 'ลงนามการรับมอบรถ', o.filled);
  return scr;
}
async function workForm(name, o) {   // ปิดงาน · o.filled · o.errors
  o = o || {};
  const E = (m) => o.errors ? m : '', t = JOB_T, i = JOB_I, c = TRIP_CARS[i];
  const { scr, page } = await shell(name, { title: 'ปิดงานบำรุงรักษา · ' + c[0], back: true, crumbs: ['แผนเดินทาง ' + NOW_Q, t.name, c[0], 'ปิดงาน'] });
  const nodes = [
    col('Section', [await section('ข้อมูลเอกสาร'), kv([['เลขที่งาน', NEW_PLAN[0]], ['หน่วยงานผู้ใช้บริการ', c[2]], ['ชื่องาน', 'บำรุงรักษารถกระเช้า ' + c[1] + ' ทะเบียน ' + c[0] + ' ณ ' + tripLoc(i, t.locs)], ['วันที่รับงาน', JOB_START.slice(0, 10)], ['วันที่เสร็จงาน', JOB_END.slice(0, 10)]])], 16),
    col('Section', [await section('บันทึกข้อตกลงลูกค้า'), kv([['ติดต่อลูกค้าชื่อ', 'นายสุรชัย แก้วมณี'], ['ตำแหน่ง', 'หัวหน้าแผนก ' + c[2]], ['เมื่อวันที่', t.d1], ['เบอร์โทรศัพท์', tripPhone(i, t.phones)], ['ความต้องการลูกค้า', 'บำรุงรักษาตามแผน ณ ' + tripLoc(i, t.locs)]])], 16),
    await closeParts(CLOSE_PARTS.filter((r, k) => k > 0 || JOB_OIL !== 0), o.filled),
    await closeCosts(o.filled)];   // ต่อจากรายการสภาพวัสดุอะไหล่ (3 พ.ย. 2569)
  nodes.push(col('Section', [await section('ผลการบำรุงรักษา'),
    row('Row', [field('เลขไมล์รถ (กม.)', o.filled ? '182,640' : '', { placeholder: '0', error: E('กรุณาระบุเลขไมล์รถ') }),
      field('ชั่วโมงเครื่องจักร (ชม.)', o.filled ? '6,131' : '', { placeholder: '0', error: E('กรุณาระบุชั่วโมงเครื่องจักร') })])], 16),
    await jobOil(JOB_OIL, o.oilRes || {}));   // ค่าตั้งต้นตามที่เลือกไว้ตอนอยู่ระหว่างบำรุงรักษา แก้ได้ (แทนติ๊ก "เก็บตัวอย่างน้ำมันไฮโดรลิกไปทดสอบแล้ว")
  nodes.push(...await inspectPanel(o.filled, o.filled));   // ตรวจสภาพรถปิดงาน + ลงนามการส่งคืนรถ (3 พ.ย. 2569)
  nodes.push(await closeDocs(o.filled));
  nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ปิดงาน', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
async function workDetail(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: V[0], back: true, crumbs: ['แผนเดินทาง ' + NOW_Q, JOB_T.name, V[0]], badge: WSTAT.done,   // 3 พ.ย. 2569 หัวเป็นทะเบียนเหมือนหน้างานรายคัน S10
 });
  const nodes = [await vehicleInfo(VEH_KV.concat([['เริ่มงาน', JOB_START], ['ปิดงาน', JOB_END], ['ผู้บันทึก', JOB_BY], ['น้ำมันไฮโดรลิก', JOB_OIL_OPTS[JOB_OIL]], ['เลขไมล์หลังทำ', '182,640 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '6,131 ชม.']]), 'ข้อมูลยานพาหนะและงาน'),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tbl(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16),
    // ภาพตอนจบงานเอาออก 4 พ.ย. 2569 ให้ตรงกับหน้าปิดงาน ("ยังไม่ต้องมีเพิ่มรูป" 3 พ.ย.)
    // ค่าใช้จ่ายรายคันที่กรอกตอนปิดงาน (3 พ.ย. 2569) · แสดงเฉพาะรายการที่กรอก
    col('Section', [await sectionLabel('ค่าใช้จ่ายของรถคันนี้ (บาท)'), await tbl([['พนักงาน กบค. ซ่อม', 0, 'Lead text'], ['ค่าเบี้ยเลี้ยง/วัน', 150], ['ค่าที่พัก/วัน', 150], ['จำนวนวัน', 120], ['รวม', 150]],
      CLOSE_COST_BY.map(r => [r[0], nf(r[1]), nf(r[2]), String(r[3]), nf(personSum(r))])),
      kv([['รวมค่าเบี้ยเลี้ยง', CLOSE_COST.perDiem + ' บาท'], ['รวมค่าที่พัก', CLOSE_COST.lodging + ' บาท'], ['ค่าเดินทาง (รวมทุกคน)', CLOSE_COST.travel + ' บาท'], ['รวมค่าใช้จ่ายของรถคันนี้', CLOSE_COST.total + ' บาท'], ['งบประมาณ (ศูนย์ต้นทุน)', OWNER_CC(TRIP_CARS[JOB_I])]])], 16)];
  // 3 พ.ย. 2569 เจ้าของงาน "ตรงนี้ลบแบชออก แล้วมี radio ว่าผ่าน ไม่ผ่าน และมีให้ upload ไฟล์เป็น optional" ⇒ กรอกผลในหน้านี้ได้เลย (อีกทางคือเมนู … ในหน้ารายละเอียดแผนเดินทาง S12)
  // S12 (4 พ.ย. 2569) ทางเดียวที่บันทึกผลหลังปิดงาน = section นี้ในหน้ารายละเอียดงานรายคัน · แสดงเฉพาะคันที่เก็บตัวอย่าง · o.res = { sel, files, errors, saved }
  const res = o.res || {};
  if (OIL_SAMPLED(JOB_OIL)) nodes.push(col('Section', [await sectionLabel('ผลการทดสอบน้ำมันไฮโดรลิก'), ...await oilResult(res),   // หน้างานรายคันแบบดู = Section label (R3)
    kv([['เก็บตัวอย่างเมื่อ', JOB_END.slice(0, 10) + ' โดย ' + JOB_BY]].concat(res.saved ? [['บันทึกผลเมื่อ', '11/11/2569 14:02 น. โดย ' + JOB_BY]] : [])),
    btnRow([['Primary button', 'บันทึกผลการทดสอบ', { size: 'md' }]])], 16));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S12 บันทึกผลตรวจน้ำมันไฮโดรลิก ---------- */

/* ---------- S15 ประวัติงานบำรุงรักษา · S17 รายงานผล/ปิดงาน · S18 ต้นทุน ---------- */
const HIST_COLS = [['ทะเบียน', 160, 'Lead text', 'Swap'], ['วันที่ทำ', 120], ['งานที่ทำ', 0], ['อะไหล่ที่ใช้', 220], ['ผลน้ำมัน', 110, 'Badge'], ['ผู้ทำ', 150], ['การยอมรับ', 190, 'Badge']];
const HIST = VEH.slice(0, 4).map((v, i) => [v[0], '0' + (4 + i) + '/11/2569', 'เปลี่ยนน้ำมันไฮโดรลิก · ไส้กรอง', '30 ลิตร · 5 ชิ้น',
  { pill: i === 2 ? ['ไม่ผ่าน', 'Error'] : ['ผ่าน', 'Success'] }, TRIP.staff[i % 3], { pill: i < 3 ? ACC.ok : ACC.wait }]);
async function progressScreen(name, o) {
  o = o || {};
  const done = o.done || 10, total = +P[4];
  const { scr, page } = await detail(name, { crumbs: ['ประวัติงานบำรุงรักษา'], status: 'active' });
  add(page, col('Content', [
    await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ความคืบหน้ารายคัน'), kv([['บำรุงรักษาแล้ว', done + ' / ' + total + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['รอทำ', (total - done) + ' คัน'], ['หน่วยงานยอมรับแล้ว', (done - 1) + ' คัน']]),
      alertBox('Warning', 'ยังบำรุงรักษาไม่ครบทุกคันตามแผน (เหลือ ' + (total - done) + ' คัน)', 'บอร์ด: "บำรุงรักษาเสร็จทั้งหมดหรือไม่?" — ครบแล้วจึงบันทึกและส่งประวัติให้หัวหน้า กบค. ตรวจสอบได้')], 16),
    col('Section', [await sectionLabel('ประวัติงานบำรุงรักษา', { badge: HIST.length }), await tbl(HIST_COLS, HIST)], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งประวัติให้หัวหน้าตรวจสอบ', { size: 'lg', disabled: true }]])
  ], 32), 'h');
  return scr;
}
async function historyScreen(name, o) {
  o = o || {};
  const total = +P[4];
  const { scr, page } = await detail(name, { crumbs: ['ประวัติงานบำรุงรักษา'], status: o.sent ? 'hist' : 'active' });
  const nodes = [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ความคืบหน้ารายคัน'), kv([['บำรุงรักษาแล้ว', total + ' / ' + total + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['รอทำ', '0 คัน'], ['หน่วยงานยอมรับแล้ว', total + ' คัน']])], 16),
    col('Section', [await sectionLabel('ประวัติงานบำรุงรักษาทั้งหมด', { badge: total }), await tbl(HIST_COLS, HIST, { pagination: total })], 16)];
  if (o.sent) nodes.push(alertBox('Info', 'ส่งประวัติให้หัวหน้า กบค. ตรวจสอบแล้ว 12/11/2569', 'แก้ไขไม่ได้จนกว่าหัวหน้าจะตีกลับ (S16)'));
  nodes.push(btnRow(o.sent ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }]] : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งประวัติให้หัวหน้าตรวจสอบ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
async function reportScreen(name, o) {
  o = o || {};
  const { scr, page } = await detail(name, { crumbs: ['รายงานผลการบำรุงรักษา'], status: o.closed ? 'closed' : 'passed',
    actions: [['Secondary button', 'ดาวน์โหลดรายงาน', 'cloud_upload-24-300-round']] });
  const nodes = [await vehicleInfo(PLAN_KV.concat([['หัวหน้า กบค. ตรวจประวัติ', 'ผ่าน · 13/11/2569'], ['ผู้ตรวจ', 'นายประเสริฐ มั่นคง']]), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('สรุปรายงานผลการบำรุงรักษา'), kv([['รถตามแผน', P[4] + ' คัน'], ['บำรุงรักษาแล้ว', P[4] + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['ใบเดินทาง', '2 ใบ'],
      ['อะไหล่ที่ใช้', '5 รายการ · คืนคลัง 1 รายการ'], ['ผลน้ำมันไฮโดรลิก', 'ผ่าน 11 · ไม่ผ่าน 1'], ['หน่วยงานยอมรับผล', P[4] + ' / ' + P[4] + ' คัน'], ['ช่วงดำเนินการ', '03/11/2569 – 12/11/2569']])], 16)];
  if (o.closed) nodes.push(alertBox('Success', 'ปิดงานแล้ว 14/11/2569', 'ไปขั้นคำนวณต้นทุน (S18) ได้'));
  nodes.push(btnRow(o.closed ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'คำนวณต้นทุน', { size: 'lg' }]] : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ปิดงาน', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
const COST_COLS = [['ใบเดินทาง / จุดรวมงาน', 0, 'Lead text'], ['รถ (คัน)', 100], ['ค่าแรง (เบี้ยเลี้ยง)', 160], ['ค่าที่พัก', 140], ['ค่าเดินทาง', 140], ['รวม (บาท)', 150]];
const COSTS = [[TRIP.place, '6', '7,200', '9,600', '4,850', '21,650'], ['จุดรวมงาน กฟน.2 น่าน', '6', '7,200', '12,800', '6,320', '26,320']];
async function costScreen(name) {
  const { scr, page } = await detail(name, { crumbs: ['ต้นทุนการบำรุงรักษา'], status: 'closed', actions: [['Secondary button', 'ดาวน์โหลด Excel', 'cloud_upload-24-300-round']] });
  add(page, col('Content', [
    await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ต้นทุนการบำรุงรักษา รายใบเดินทาง', { badge: COSTS.length }), await tbl(COST_COLS, COSTS)], 16),
    col('Section', [await sectionLabel('Summary ของต้นทุน'), kv([['ค่าแรง (เบี้ยเลี้ยง)', '14,400 บาท'], ['ค่าที่พัก', '22,400 บาท'], ['ค่าเดินทาง', '11,170 บาท'], ['รวมทั้งแผน', '47,970 บาท'], ['เฉลี่ยต่อคัน', '3,997.50 บาท'], ['จำนวนคัน', P[4] + ' คัน']])], 16),
    alertBox('Info', 'ค่าแรงใช้ยอดเบี้ยเลี้ยงที่กรอกรายคันตอนปิดงาน (S10) · ยังไม่รวมค่าอะไหล่', 'รอเคาะ Q26 — "ค่าแรง" กับ "ค่าเบี้ยเลี้ยง" รายการเดียวกันไหม · ต้นทุนรวมอะไหล่/ค่าจ้างไหม')
  ], 32), 'h');
  return scr;
}

/* ======================== รอบสอง 9 scenario (เจ้าของงานสั่ง 22 ต.ค. 2569 ดึก "บำรุงรักษา สามารถ export 18 scen ได้เลย") ========================
   S2–S3 ผพจ./หัวหน้า ผพจ. · S7 ผู้รับจ้าง · S8 กบค. ตรวจแผนผู้รับจ้าง · S9 กรย. · S11 กบค. ตรวจงานผู้รับจ้าง + รับคืนอะไหล่ · S13–S14 หน่วยงาน/เจ้าของรถ · S16 หัวหน้า กบค.
   ตีความเอง (คำถามในไฟล์ 14 ยังค้าง — แจ้งเจ้าของงานแล้ว): ผพจ. กับหัวหน้า ผพจ. คนละบทบาท (Q1) · ผู้รับจ้างมีบัญชีเข้า VMS+ เอง (Q13) · ยอมรับ 2 รอบ รายคัน S13 + ทั้งแผน S14 (Q28) ·
   ไม่มีปุ่มไม่ยอมรับ (Q23) · ไม่สร้างทางที่บอร์ดยังไม่มีปลายทาง (กรย. อะไหล่ไม่พร้อม Q16 · ผพจ. คืนอะไหล่ Q5)
   ยืมจาก flow งานซ่อม: `RepairFeedback` (คะแนน 1–5 Radio text card — เจ้าของงานเลือกให้ S14 · การประเมินเกิดตอนบำรุงรักษาครบทุกคัน) · `ReturnPart` (ตารางรับคืนอะไหล่ S11 — เลิกใช้ 3 พ.ย. 2569 · S11 ใหม่ใช้ hireJob + Table) */
async function tabs(items, active) {   // component Tabs (5 ช่อง Tab item) · items [[ข้อความ, จำนวน]] · ซ่อนช่องที่เกิน (ยกจาก overhaul2-plugin)
  const t = inst('Tabs');
  const its = t.children.filter(c => c.type === 'INSTANCE' && c.name === 'Tab item');
  its.forEach((it, i) => {
    if (i >= items.length) { it.visible = false; return; }
    setProps(it, { Active: i === active ? 'True' : 'False', State: 'Default' });
    setProps(it, { Text: items[i][0], Badge: items[i][1] != null });
    const p = find(it, 'Pill outline'); if (p && items[i][1] != null) setProps(p, { Color: 'Brand', Text: String(items[i][1]) });
  });
  return t;
}
/* หน้ารายการของบทบาทอื่น (ผพจ. · ผู้รับจ้าง · กรย. · หน่วยงาน · หัวหน้า) — Page header + (Tabs) + Table header + Table · o.tabs = [[ข้อความ, จำนวน]] */
async function roleList(name, o) {
  const { scr, page } = await shell(name, { title: o.title });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  if (o.tabs) add(sec, await tabs(o.tabs, o.tab || 0), 'h');
  add(sec, await tableHeader({ placeholder: o.search }), 'h');
  add(sec, await tbl(o.cols, o.rows, { pagination: o.rows.length }), 'h');
  return scr;
}
const reason = (scr, title, label, value, ok) => formModal(scr, { title, fields: [{ label, value, area: 1 }], ok });   // ส่งกลับ/ปฏิเสธ/ตีกลับ = เหตุผล Freetext บังคับ (ไฟล์ 14)
const GO = { icons: ['keyboard_arrow_right-20-400-round'] };

/* ---------- S7 ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง (3 พ.ย. 2569) ----------
   เจ้าของงาน "s7 เป็นเรื่องอนุมัติแผนการเดินทาง" + หน้าอนุมัติแบบเดียวกับ S2 (radio อนุมัติ ค่าเริ่มต้น / ส่งกลับแก้ไข + เหตุผล) · ผู้อนุมัติตามสายงานจาก API getUpperLower (Q45)
   ตาม `Radio text card` + `Section label` + `Table` ของไฟล์ Component · หน้า Detail ⇒ Section label (R3) */
const TRIP_VIEW_COLS = [['ทะเบียน', 200, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 200], ['สถานที่บำรุงรักษา', 330]];
const tripCarRows = (t, only) => t.sel.filter(i => !only || TRIP_CARS[i][2] === only).map(i => [TRIP_CARS[i][0], TRIP_CARS[i][1], TRIP_CARS[i][2], { text: tripLoc(i, t.locs), sub: t.locs[i] ? 'แก้จากสำนักงานเจ้าของรถ' : 'ค่าเริ่มต้น สำนักงานที่รถอยู่' }]);
const tripKv = (t, more) => [['ชื่อแผนเดินทาง', t.name], ['แผน', P[0] + ' ' + P[1]], ['ไตรมาส', NOW_Q], ['รูปแบบดำเนินการ', t.vendor ? 'จ้างดำเนินการ' : 'กบค. ดำเนินการเอง']].concat(t.vendor
  ? [['ผู้รับจ้าง', t.vendor], ['เลขที่สัญญา/ใบสั่งจ้าง', t.contract || '-'], ['ช่วงวันทำงาน', t.d1 + ' – ' + t.d2]]   // S9 แผนจ้าง: ไม่มีพนักงาน กบค. และค่าใช้จ่าย
  : [['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2], ['พนักงาน กบค. ซ่อม', TRIP.staff.join(', ')]], [['ผู้สร้าง', 'นายวิชัย ทองดี (กบค.)'], ['วันที่ส่ง', '03/11/2569']], more || []);   // ค่าใช้จ่ายย้ายไปปิดงานรายคัน (3 พ.ย. 2569)
const TRIP_REVIEW_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวันเดินทาง', 220], ['รถ (คัน)', 100], ['ผู้สร้าง (กบค.)', 180], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 150, 'Badge'], ['', 60]];
const tripReviewRow = (t) => [{ text: t.name, sub: P[0] + ' · ' + NOW_Q }, t.d1 + ' – ' + t.d2, String(t.sel.length), 'นายวิชัย ทองดี', '03/11/2569', { pill: TST[t.st] }, GO];
const TRIP_OTHER = { name: 'ตรวจรถเครน นครราชสีมา บุรีรัมย์', sel: [0, 1, 2], locs: {}, d1: '10/11/2569', d2: '12/11/2569', st: 'review' };   // อีกใบในรายการรออนุมัติ (แสดงในตารางอย่างเดียว)
const tripReviewList = async (name, rows) => roleList(name, { title: 'แผนเดินทางรออนุมัติ', search: 'ค้นหาชื่อแผนเดินทาง, ผู้สร้าง', cols: TRIP_REVIEW_COLS, rows: rows.map(tripReviewRow) });
async function tripReview(name, o) {   // o.decision = 'return' · o.reason · o.errors · o.status = 'approved'
  o = o || {};
  const t = TRIP_1;
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนเดินทาง', back: true, crumbs: ['แผนเดินทางรออนุมัติ', t.name], badge: TST[o.status || 'review'] });
  const nodes = [await vehicleInfo(tripKv(t), 'รายละเอียดแผนเดินทาง'), col('Section', [await sectionLabel('รถในแผนเดินทาง', { badge: t.sel.length }), await tbl(TRIP_VIEW_COLS, tripCarRows(t))], 16)];
  if (o.status === 'approved') nodes.push(alertBox('Success', 'อนุมัติแผนเดินทางแล้ว 04/11/2569', 'แจ้งเตือนในแอปถึง กรย. และหน่วยงานเจ้าของรถแล้ว'));
  else {
    const ret = o.decision === 'return';
    const dec = await radioPick('ผลการพิจารณา', [['อนุมัติ', 'แผนเดินทางผ่านการตรวจสอบ แจ้งเจ้าของรถและ กรย.'], ['ส่งกลับแก้ไข', 'แจ้งเหตุผลให้ กบค. แก้ไขแผนเดินทางแล้วส่งใหม่']], ret ? 1 : 0, { label: true });
    if (ret) add(dec, area('เหตุผลที่ส่งกลับ', o.reason, { placeholder: 'ระบุเหตุผลที่ส่งกลับ', error: o.errors ? 'กรุณาระบุเหตุผลที่ส่งกลับ' : '' }), 'h');
    nodes.push(dec, btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg' }]]));
  }
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S8 แจ้งเตือนในแอปถึง กรย. และหน่วยงานเจ้าของรถ (3 พ.ย. 2569) ----------
   เจ้าของงาน "S8 เป็นเรื่อง noti ไปที่ กรย และหน่วยงานเจ้าของรถ" + "ดูอย่างเดียว" + "noti ออกแบบเป็น noti inapp ไปก่อน"
   กระดิ่ง + แผงแจ้งเตือน = `Notification card` (+ `_Notification item base` · `Status`) ตามแผงแจ้งเตือนของปลั๊กอิน Overhaul (S15 · บล็อก noti)
   กดแจ้งเตือนแล้วเปิดหน้าแผนเดินทางแบบดูอย่างเดียว · หน่วยงานเจ้าของรถเห็นเฉพาะรถของตน */
const propVal = (n, k) => { const cp = n.componentProperties || {}; const f = Object.keys(cp).find(x => x === k || x.split('#')[0].trim() === k); return f ? cp[f].value : undefined; };
function bell(scr, on) {   // กระดิ่งใน Header navigation = Nav button ที่ไลบรารีเปิด Indicator ไว้ · on = มีแจ้งเตือนใหม่ (จุดแดง)
  const hdr = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Header navigation')[0];
  if (!hdr) { warn('กระดิ่ง', 'ไม่พบ Header navigation'); return null; }
  const b = (find(hdr, 'Nav items') || hdr).findAll(n => n.type === 'INSTANCE' && n.name === 'Nav button').find(n => propVal(n, 'Indicator') === true);
  if (!b) { warn('กระดิ่ง', 'ไม่พบ Nav button ที่มี Indicator'); return null; }
  setProps(b, { Indicator: !!on });
  return b;
}
function fillNotiItem(r, it) {   // [สีจุดสถานะ, ข้อความ, เวลา]
  setProps(r, { Text: it[1], 'Supporting text': it[2], 'Show status': true, 'Show button': false });
  const st = r.findAll(x => x.type === 'INSTANCE' && x.name === 'Status')[0]; if (st) setProps(st, { State: it[0] });
}
async function notiPanel(scr, items, badge) {
  const card = inst('Notification card');
  const hd = find(card, '_Notification header'); const bg = hd && find(hd, 'Badge outline'); if (bg) setProps(bg, { Text: badge, Color: 'Gray' });
  const rows = card.findAll(n => n.type === 'INSTANCE' && n.name === '_Notification item base');
  for (const [i, r] of rows.entries()) { if (items[i]) fillNotiItem(r, items[i]); else r.visible = false; }
  if (MOB) {   // Notification card ไม่มี variant มือถือ ⇒ bottom sheet หัว "แจ้งเตือน" (แบบ Overhaul)
    if (hd) hd.visible = false; const cf = find(card, '_Notification footer'); if (cf) cf.visible = false;
    const r = await sheet(scr, { title: 'แจ้งเตือน (' + badge + ')', content: [card], ok: 'ลบข้อความแจ้งเตือนทั้งหมด' });
    try { card.resize(VW() - 32, card.height); } catch (e) { warn('การ์ดแจ้งเตือนบนมือถือ', e); }
    const ft = find(r.sh, 'Bottom sheet footer'); const sb = ft && find(ft, 'Secondary button'); if (sb) sb.visible = false;
    return r.sh;
  }
  const hdr = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Header navigation')[0];
  overlay(scr, card, VW() - card.width - 24, (hdr ? hdr.height : 64) + 8);
  return card;
}
const OWN_UNIT = TRIP_CARS[0][2];   // หน่วยงานเจ้าของรถตัวอย่าง (กฟฉ.1 ขอนแก่น · รถ 2 คันในแผนเดินทาง 1)
const ownCars = (t) => t.sel.filter(i => TRIP_CARS[i][2] === OWN_UNIT);
const NOTI_KRY = ['Brand', 'แผนเดินทาง ' + TRIP_1.name + ' อนุมัติแล้ว กบค. จะเข้าบำรุงรักษารถ ' + TRIP_1.sel.length + ' คัน ระหว่างวันที่ ' + TRIP_1.d1 + ' ถึง ' + TRIP_1.d2, '10 นาทีที่แล้ว'];
const NOTI_OWN = ['Brand', 'กบค. จะเข้าบำรุงรักษารถของหน่วยงาน ' + ownCars(TRIP_1).length + ' คัน (' + ownCars(TRIP_1).map(i => TRIP_CARS[i][0]).join(', ') + ') ระหว่างวันที่ ' + TRIP_1.d1 + ' ถึง ' + TRIP_1.d2 + ' ที่ ' + tripLoc(ownCars(TRIP_1)[0], TRIP_1.locs), '10 นาทีที่แล้ว'];
const NOTI_OLD = ['Success', 'กบค. บำรุงรักษารถ 82-3302 อุดรธานี ตามแผนเดินทางเดือนตุลาคมเสร็จแล้ว', '2 วันที่แล้ว'];
const TRIP_SEEN_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวันเดินทาง', 220], ['รถ (คัน)', 100], ['สถานะ', 150, 'Badge'], ['', 60]];
const tripSeenList = (name, own) => roleList(name, { title: 'แผนเดินทางบำรุงรักษา', search: 'ค้นหาชื่อแผนเดินทาง, ทะเบียน', cols: TRIP_SEEN_COLS, rows: [[{ text: TRIP_1.name, sub: P[0] + ' · ' + NOW_Q }, TRIP_1.d1 + ' – ' + TRIP_1.d2, String(own ? ownCars(TRIP_1).length : TRIP_1.sel.length), { pill: TST.approved }, GO]] });
async function tripView(name, own) {   // ดูอย่างเดียว · own = หน่วยงานเจ้าของรถ (เฉพาะรถของตน)
  const t = tripAs(TRIP_1, 'approved');
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: ['แผนเดินทางบำรุงรักษา', t.name], badge: TST.approved });
  const kv = [['ชื่อแผนเดินทาง', t.name], ['แผน', P[0] + ' ' + P[1]], ['ไตรมาส', NOW_Q], ['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2], ['พนักงาน กบค. ซ่อม', TRIP.staff.join(', ')], ['ผู้สร้าง', 'นายวิชัย ทองดี (กบค.)'], ['อนุมัติเมื่อ', '04/11/2569']];
  const rows = tripCarRows(t, own ? OWN_UNIT : null);
  add(page, col('Content', [await vehicleInfo(kv, 'รายละเอียดแผนเดินทาง'), col('Section', [await sectionLabel(own ? 'รถของหน่วยงานในแผนเดินทาง' : 'รถในแผนเดินทาง', { badge: rows.length }), await tbl(TRIP_VIEW_COLS, rows)], 16)], 32), 'h');
  return scr;
}

/* ---------- S2 ผู้อนุมัติ ตรวจสอบและอนุมัติแผน (30 ต.ค. 2569 สายอนุมัติทั่วไป ไม่ผ่าน ผพจ.) ---------- */
const NP = NEW_PLAN;
const NO_NEW = 'MR Z7000003';   // ใช้กับ S3 ที่พักไว้ (เลขงาน) — ไม่อยู่ในชุดสร้างจอ
const npKv = (job) => [['ชื่อแผน', NP[1]], ['ปีงบประมาณ', NP[8]], ['ภาค', NP[2]], ['เขต', [...new Set(Object.keys(A_ALL).map(i => dCode(CAND[i])))].sort().join(', ')], ['ประเภทรถ', NP[7]], ['รถรายไตรมาส', NP[9]], ['จำนวนรถ', NP[4] + ' คัน'], ['เลขที่ MR', job || NP[0]], ['ผู้สร้างแผน', 'นายวิชัย ทองดี (กบค.)'], ['วันที่ส่ง', NP[6]]];
const VEH7 = CAND.map(c => [c[0], c[1], c[2], c[3], 'ready']);   // รถในแผนใหม่ = รถที่ติ๊กตอนสร้างแผน (ภาค 2 รถกระเช้า)
const REVIEW_COLS = [['ชื่อแผน', 0, 'Lead text', 'Swap'], ['ปีงบประมาณ', 120], ['ผู้สร้าง (กบค.)', 180], ['ภาค', 200], ['จำนวนรถ', 100], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 150, 'Badge'], ['', 60]];
const reviewRow = (p) => [p[1], p[8], 'นายวิชัย ทองดี', p[2], p[4] + ' คัน', p[6], { pill: PST[p[5]] }, GO];
const REVIEW_ROWS = [NP, PLANS[2], PLANS[3]];
const PART_CHECK_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['ตามแผน', 110], ['หน่วย', 90], ['คงเหลือในคลัง', 140], ['ต้องซื้อเพิ่ม', 140]];
const partCheckRows = () => PARTS.map((p, i) => [p[0], p[1], p[3], p[4], p[5], shortOf(i) ? String(shortOf(i)) : '-']);
async function planBody(o) {   // เนื้อหน้ารายละเอียดแผน ใช้ทั้งฝั่งผู้อนุมัติ (S2) และ กบค. (S19 S20) · o.wh = ไตรมาสที่คลังรับทราบแล้ว (แผนอนุมัติแล้ว · S22)
  o = o || {};
  const inPlan = Object.keys(A_ALL).map(Number);   // รถในแผนใหม่ = ที่จัดลงไตรมาสตอนสร้างแผน (S1)
  // เจ้าของงาน 2 พ.ย. 2569 "อยากให้ข้อมูลที่แสดงเป็นข้อมูลรถ" ⇒ รถแยกแท็บไตรมาส คอลัมน์เดียวกับ section รถในไตรมาสของ S1 ไม่มีไอคอน (ดูอย่างเดียว) · ไม่มีตารางอะไหล่ทั้งปี
  const q1 = inPlan.filter(i => A_ALL[i] === 1), n = (i) => (A_PICKS[i] || []).length;
  return [await vehicleInfo(npKv(), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('รถในแผน', { badge: inPlan.length }), await tabs(QUARTERS.map((t, k) => [t, inPlan.filter(i => A_ALL[i] === k + 1).length]), 0),
      o.wh ? (o.wh.indexOf(1) >= 0 ? alertBox('Success', 'คลังรับทราบรายการอะไหล่ไตรมาส 1 แล้ว', 'รับทราบ ' + o.wh.length + ' จาก ' + WH_QS.length + ' ไตรมาส · 02/11/2569') : alertBox('Warning', 'รอคลังรับทราบรายการอะไหล่ไตรมาส 1', 'รับทราบ ' + o.wh.length + ' จาก ' + WH_QS.length + ' ไตรมาส')) : null,
      await tbl(CARP_COLS.slice(0, 6), q1.map(i => [CAND[i][0], CAND[i][1], CAND[i][2], OIL_OPTS[(A_PICKS[i] || []).indexOf(0) >= 0 ? 1 : 0], LAST_OIL[i], n(i) ? n(i) + ' รายการ' : 'ยังไม่เลือก']))], 16)];
}
/* หน้ารายละเอียดแผนฝั่งผู้อนุมัติ (Detail ⇒ Section label)
   เจ้าของงาน 2 พ.ย. 2569: ผลการพิจารณาเป็น radio อนุมัติ (ค่าเริ่มต้น) / ส่งกลับแก้ไข แทนปุ่ม 2 ปุ่ม — ตามการ์ดตอบรับ/ปฏิเสธนัดหมายของ Overhaul R29 (§4.2.13)
   o.decision = 'return' เลือกส่งกลับแก้ไข ⇒ Text area เหตุผลบังคับ · o.reason = เหตุผลที่กรอก · o.errors = ยังไม่ระบุเหตุผล */
async function planReview(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนบำรุงรักษา', back: true, crumbs: ['แผนรออนุมัติ', NP[1]], badge: PST[o.status || 'review'] });
  const nodes = await planBody();
  if (o.status === 'approved') nodes.push(alertBox('Success', 'อนุมัติแผนแล้ว 31/10/2569', 'ส่งรายการอะไหล่รายไตรมาสให้ กบค. คลังแล้ว · กบค. เริ่มทำงานรายไตรมาสได้'));
  else {
    const ret = o.decision === 'return';
    const dec = await radioPick('ผลการพิจารณา', [['อนุมัติ', 'แผนผ่านการตรวจสอบ กบค. เริ่มงานรายไตรมาสได้'], ['ส่งกลับแก้ไข', 'แจ้งเหตุผลให้ กบค. แก้ไขแผนแล้วส่งใหม่']], ret ? 1 : 0, { label: true });
    if (ret) add(dec, area('เหตุผลที่ส่งกลับ', o.reason, { placeholder: 'ระบุเหตุผลที่ส่งกลับ', error: o.errors ? 'กรุณาระบุเหตุผลที่ส่งกลับ' : '' }), 'h');
    nodes.push(dec, btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg' }]]));
  }
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S22 กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส (2 พ.ย. 2569) ----------
   เจ้าของงาน: ต่อจากอนุมัติ ส่งไปหา กบค. คลัง ว่าแต่ละไตรมาสเบิกอะไหล่อะไรบ้าง แยกไตรมาส · ระบบส่งทั้งปีทันทีที่อนุมัติ · คลังดูแล้วกดรับทราบ (ไม่มีส่งกลับ)
   หน้า Detail ⇒ Section label · Tabs ไตรมาสตัวเดียวกับ S1 · ยอดคิดจากอะไหล่ที่ กบค. เลือกไว้ (A_PICKS) ของรถแต่ละไตรมาส */
const WH_QS = [1, 2, 3, 4].filter(k => Object.values(A_ALL).indexOf(k) >= 0);   // ไตรมาสที่มีรถ = ไตรมาสที่ต้องรับทราบ
const wst = (n) => n === 0 ? ['รอรับทราบ', 'Warning'] : n < WH_QS.length ? ['รับทราบ ' + n + '/' + WH_QS.length + ' ไตรมาส', 'Info'] : ['รับทราบครบแล้ว', 'Success'];   // 2 พ.ย. 2569 รับทราบทีละไตรมาส
const WH_COLS = [['เลขที่ MR', 150, 'Lead text'], ['ชื่อแผน', 0], ['ปีงบประมาณ', 120], ['จำนวนรถ', 100], ['วันที่อนุมัติ', 130], ['สถานะ', 150, 'Badge'], ['', 60]];
const whRow = (p, n, d) => [p[0], p[1], p[8], p[4] + ' คัน', d, { pill: wst(n) }, GO];
const WH_PART_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวนที่ต้องเบิก', 150], ['หน่วย', 90], ['คงเหลือในคลัง', 140], ['ไม่พอ', 110]];
const whCars = (k) => Object.keys(A_ALL).map(Number).filter(i => A_ALL[i] === k);
const whParts = (k) => quarterParts(whCars(k), A_PICKS).map(r => { const st = +PARTS.find(p => p[0] === r[0])[5], need = +r[3]; return [r[0], r[1], r[3], r[4], String(st), need > st ? String(need - st) : '-']; });
async function warehouseScreen(name, o) {   // o.q = แท็บที่เปิด · o.acked = ไตรมาสที่รับทราบแล้ว
  o = o || {};
  const q = o.q || 1, rows = whParts(q), acked = o.acked || [], done = acked.indexOf(q) >= 0;
  const { scr, page } = await shell(name, { title: 'อะไหล่ที่ต้องเบิกรายไตรมาส', back: true, crumbs: ['แผนที่ต้องเตรียมอะไหล่', NP[1]], badge: wst(acked.length) });
  const sec = col('Section', [await sectionLabel('อะไหล่ที่ต้องเบิกรายไตรมาส'), await tabs(QUARTERS.map((t, k) => [t, whParts(k + 1).length]), q - 1)], 16);
  if (done) add(sec, alertBox('Success', 'รับทราบไตรมาส ' + q + ' แล้ว 02/11/2569', 'กบค. เห็นสถานะนี้ในหน้ารายการและหน้ารายละเอียดแผน'), 'h');
  if (rows.length) add(sec, await tbl(WH_PART_COLS, rows), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ไม่มีอะไหล่ที่ต้องเบิก'); await text(es, 'Supporting text', 'ไตรมาสนี้ไม่มีรถในแผน ไม่ต้องรับทราบ'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  const nodes = [await vehicleInfo(npKv(), 'รายละเอียดแผน'), sec];
  if (rows.length && !done) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบไตรมาส ' + q, { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S19 แก้ไขแผน · S20 ลบแผน (30 ต.ค. 2569 · ยึดบล็อก C D ของ Overhaul) ----------
   แก้ไข: รออนุมัติ · ส่งกลับแก้ไข · อนุมัติแล้ว แล้วส่งอนุมัติใหม่ทุกครั้ง (เจ้าของงาน "แก้ไขแล้วมีอนุมัติ อยากให้ใส่ไปก่อน")
   ลบ: เฉพาะก่อนอนุมัติ · ไม่มียกเลิกแผน (เจ้าของงาน "ยกเลิกแผนไม่ต้องมีก็ได้") · ทำไม่ได้ในสถานะนั้น = ซ่อน ไม่ disable */
const planAs = (st) => NP.slice(0, 5).concat([st], NP.slice(6));
const RETURN_REASON = 'จำนวนไส้กรองไฮโดรลิกไม่ตรงกับรอบบำรุงรักษาของรถกระเช้า กรุณาตรวจสอบรถที่เลือกเข้าแผน';
const ALERT_RETURNED = ['Error', 'ผู้อนุมัติส่งกลับให้แก้ไข', RETURN_REASON];
const ALERT_APPROVED = ['Warning', 'แผนนี้อนุมัติแล้ว', 'เมื่อบันทึก แผนจะกลับเป็นสถานะรออนุมัติ และต้องให้ผู้อนุมัติตรวจสอบอีกครั้ง'];
/* S21 อะไหล่ของรถแต่ละคัน: เลือกรถในแผน → แผงคลังอะไหล่ชุดเดียวกับ S5 (PartRequestStepPanel) → บันทึกแล้วกลับฟอร์มสร้างแผน */
const Q_CARS = Object.keys(A_ALL).map(Number).filter(i => A_ALL[i] === 1), CAR_ADD = [0].concat(CAR_PICK, [4]);   // รถของไตรมาสที่เปิดจากฟอร์ม
async function carPartsScreen(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'อะไหล่ของรถ', back: true, crumbs: ['สร้างแผน', 'อะไหล่ของรถ'] });
  const f = dropdown('รถ', CAND[0][0], { placeholder: 'เลือกรถในไตรมาสนี้', lead: 'search-24-300-round', state: o.carOpen ? 'Focused' : undefined });
  const oil = await radioPick('น้ำมันไฮโดรลิก', OIL_OPTS, o.oil === 'change' ? 1 : 0);   // เลือกรายคัน · วันที่เปลี่ยนล่าสุดช่วยตัดสินใจ · เปลี่ยนน้ำมัน = น้ำมันเข้ารายการอะไหล่
  const last = field('เปลี่ยนน้ำมันครั้งล่าสุด', LAST_OIL[0], { state: 'Readonly' });
  add(oil, MOB ? last : row('Row', [last, frame('Spacer', 'VERTICAL')]), 'h');
  add(page, col('Content', [MOB ? f : row('Row', [f, frame('Spacer', 'VERTICAL')]), oil, await partsPanel({ car: true, picked: o.picked || [], manual: o.manual }),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกอะไหล่ของรถ', { size: 'lg' }]])], 32), 'h');
  if (o.carOpen) comboAt(scr, f.findOne(n => n.name === 'Container') || f, Q_CARS.map(i => [CAND[i][0], '', i === 0]));
  if (o.manual && !o.manual.filled && (MOB || !has('PartRequestStepPanel'))) await formModal(scr, { title: 'รายการเพิ่มเติม', fields: [{ label: 'ชื่ออะไหล่' }, { label: 'รหัสอะไหล่ (ถ้ามี)' }, { label: 'ราคาต่อหน่วย' }], ok: 'เพิ่ม' });   // ไม่มีแผงงานซ่อม ⇒ กรอกใน popup
  return scr;
}
const EDIT_FORM = Object.assign({ edit: true, values: FILLED, alloc: A_ALL, picks: A_PICKS, q: 1 }, R2);
const EDIT_CONFIRM = { title: 'ยืนยันการแก้ไข', sub: 'แผนจะกลับเป็นสถานะรออนุมัติ และส่งให้ผู้อนุมัติตรวจสอบอีกครั้ง โปรดตรวจสอบก่อนยืนยัน', cancel: 'ยกเลิก', ok: 'ยืนยัน' };
const AREA_CONFIRM = { title: 'ยืนยันการเอาเขตออก', sub: 'รถของ กฟฉ.3 ที่จัดไว้ 1 คัน จะถูกเอาออกจากทุกไตรมาส', cancel: 'ปิด', ok: 'ยืนยัน' };   // เลือกหลายค่า ⇒ เอาค่าใดออก รถที่ตรงค่านั้นออกจากแผน รถอื่นอยู่เหมือนเดิม
const PART_REMOVE_CONFIRM = { danger: true, title: 'ยืนยันการเอาอะไหล่ออก', sub: 'ไส้กรองไฮโดรลิก จะถูกเอาออกจากรถทุกคันในไตรมาส 2', cancel: 'ยกเลิก', ok: 'เอาออก' };
const DELETE_CONFIRM = { danger: true, title: 'ยืนยันการลบแผน', sub: 'เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่', cancel: 'ยกเลิก', ok: 'ยืนยัน' };
function planMenu(scr, items) {   // เมนู "…" ตามสถานะแผน · ไลบรารีมีเส้นคั่นก่อนรายการที่ 3 ⇒ น้อยกว่า 3 รายการต้องซ่อนเส้นคั่น
  const m = menuAt(scr, firstMenuCell(scr), items);
  if (items.length < 3) { const d = (find(m, 'Menu items') || m).children[3]; if (d) d.visible = false; }
  return m;
}
async function planDetail(name, o) {   // หน้ารายละเอียดแผนฝั่ง กบค. · ก่อนอนุมัติมี ลบแผน + แก้ไข · อนุมัติแล้วเหลือแก้ไข
  o = o || {};
  const st = o.status || 'review';
  const actions = [['Secondary button', 'แก้ไข', 'stylus-24-300-round']];
  if (st !== 'approved') actions.unshift(['Secondary danger button', 'ลบแผน', 'delete-24-300-round']);
  const { scr, page } = await shell(name, { title: 'เลขที่ ' + NP[0], back: true, crumbs: [NP[1]], badge: PST[st], actions });
  const nodes = await planBody({ wh: st === 'approved' || st === 'active' ? (o.wh || [1]) : null });
  if (st === 'returned') nodes.unshift(alertBox(...ALERT_RETURNED));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S3 ผพจ. ออกเลขงาน · หัวหน้า ผพจ. ตรวจรายการอะไหล่ · ใบ PO ---------- */
const PO_ITEMS = [1, 4].map(i => [PARTS[i][0], PARTS[i][1], String(shortOf(i)), PARTS[i][4], baht(PRICE[i]), baht(shortOf(i) * PRICE[i])]);
const PO_TOTAL = [1, 4].reduce((a, i) => a + shortOf(i) * PRICE[i], 0);
const PO_KV = [['เลขที่ PO', 'PO-2570-0158'], ['วันที่ PO', '24/10/2569'], ['ผู้ขาย', 'บริษัท ไทยลูบริแคนท์ ซัพพลาย จำกัด'], ['วงเงิน', baht(PO_TOTAL)]];
async function planIssue(name, o) {   // แผนอนุมัติแล้ว ฝั่ง ผพจ. — ก่อน/หลังออกเลขงาน · หลังบันทึก PO
  o = o || {};
  const job = o.job ? NO_NEW : '';
  const { scr, page } = await shell(name, { title: job ? 'หมายเลขแผน ' + job : 'แผนรอออกเลขงาน', back: true, crumbs: ['แผนอนุมัติแล้ว', job || NP[1]], badge: PST.approved,
    actions: job ? undefined : [['Primary button', 'ออกเลขงาน']] });
  const nodes = [await vehicleInfo(npKv(job), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('รายการอะไหล่ที่ต้องใช้', { badge: PARTS.length }), await tbl(PART_CHECK_COLS, partCheckRows())], 16)];
  if (o.po) nodes.push(col('Section', [await sectionLabel('ใบสั่งซื้ออะไหล่ (PO)'), kv(PO_KV), await tbl([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 100], ['หน่วย', 90], ['ราคาต่อหน่วย', 150], ['รวม', 150]], PO_ITEMS)], 16));
  else if (job) nodes.push(alertBox(o.sent ? 'Info' : 'Brand', o.sent ? 'ส่งรายการอะไหล่ให้หัวหน้า ผพจ. ตรวจสอบแล้ว' : 'ออกเลขงาน ' + job + ' แล้ว', o.sent ? 'หัวหน้า ผพจ. อนุมัติแล้วจึงทำเรื่องซื้ออะไหล่และออกใบ PO' : 'ส่งรายการอะไหล่ให้หัวหน้า ผพจ. ตรวจสอบก่อนจัดซื้อ'));
  if (job && !o.sent && !o.po) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งให้หัวหน้า ผพจ. ตรวจสอบ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
async function headPartCheck(name) {   // หัวหน้า ผพจ. ตรวจรายการอะไหล่
  const { scr, page } = await shell(name, { title: 'ตรวจรายการอะไหล่ · ' + NO_NEW, back: true, crumbs: ['รายการอะไหล่รอตรวจ', NO_NEW], badge: ['รอหัวหน้า ผพจ. ตรวจ', 'Warning'] });
  add(page, col('Content', [await vehicleInfo(npKv(NO_NEW), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('รายการอะไหล่ที่จะใช้ในแผน', { badge: PARTS.length }), await tbl(PART_CHECK_COLS, partCheckRows()),
      alertBox('Warning', 'ต้องซื้อเพิ่ม 2 รายการ รวม ' + baht(PO_TOTAL), 'ไส้กรองไฮโดรลิก 9 ชิ้น · ไส้กรองเชื้อเพลิง 14 ชิ้น')], 16),
    btnRow([['Secondary button', 'ส่งกลับ', { size: 'lg' }], ['Primary button', 'อนุมัติรายการอะไหล่', { size: 'lg' }]])], 32), 'h');
  return scr;
}
async function poForm(name) {   // ฟอร์มใบ PO — ช่องทั้งหมดยังไม่รู้ (ไฟล์ 14 S3) ใช้ชุดที่เสนอ
  const { scr, page } = await shell(name, { title: 'บันทึกใบสั่งซื้ออะไหล่ (PO)', back: true, crumbs: ['หมายเลขแผน ' + NO_NEW, 'ใบ PO'] });
  add(page, col('Content', [
    col('Section', [await section('ข้อมูลใบสั่งซื้อ'), row('Row', [field('เลขที่ PO', PO_KV[0][1]), field('วันที่ PO', PO_KV[1][1])]),
      row('Row', [dropdown('ผู้ขาย', PO_KV[2][1], { lead: 'search-24-300-round' }), field('วงเงิน (บาท)', PO_TOTAL.toLocaleString('en-US'))])], 16),
    col('Section', [await section('รายการอะไหล่ที่สั่งซื้อ', { badge: PO_ITEMS.length }), await tbl([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 100], ['หน่วย', 90], ['ราคาต่อหน่วย', 150], ['รวม', 150]], PO_ITEMS)], 16),
    col('Section', [await section('เอกสารแนบ'), await upload('ใบสั่งซื้อ (PO)', [pdf('PO-2570-0158.pdf', '310 KB')], { hint: 'PDF, JPG · สูงสุด 10 ไฟล์' })], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกใบ PO', { size: 'lg' }]])], 32), 'h');
  return scr;
}

/* ---------- S7 ผู้รับจ้างทำแผนเดินทาง · S8 กบค. ตรวจแผนเดินทางของผู้รับจ้าง ---------- */
const HIRE = PLANS[1];   // แผนที่ว่าจ้าง (MR Z7000002 รถเครน ภาค 2)
const CONTRACTOR = 'บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด';
const TRIP_ST = { none: ['ยังไม่สร้าง', 'Gray'], wait: ['รอ กบค. ตรวจสอบ', 'Warning'], ok: ['อนุมัติแล้ว', 'Success'], rej: ['ปฏิเสธ', 'Error'] };
const HTRIP = { place: 'จุดรวมงาน กฟฉ.2 อุบลราชธานี', d1: '10/11/2569', d2: '13/11/2569' };
const JOBS_COLS = [['เลขที่ MR', 140, 'Lead text'], ['แผน', 0], ['ไตรมาส', 100], ['จำนวนรถ', 110], ['แผนเดินทาง', 180, 'Badge'], ['', 60]];
const jobsRows = (st) => [[HIRE[0], HIRE[1], HIRE[3], HIRE[4] + ' คัน', { pill: TRIP_ST[st] }, GO], ['MR Z6900014', 'บำรุงรักษารถเครน ภาค 2 ปีงบประมาณ 2569', 'ไตรมาส 4', '5 คัน', { pill: TRIP_ST.ok }, GO]];
async function hireTripForm(name, o) {   // ช่องเดียวกับ S6 ยกเว้นพนักงาน กบค. และค่าใช้จ่าย (ไฟล์ 14 S7)
  o = o || {};
  const v = o.filled ? HTRIP : {}, E = (m) => o.errors ? m : '';
  const { scr, page } = await shell(name, { title: 'สร้างแผนเดินทาง', back: true, crumbs: ['งานที่ได้รับว่าจ้าง', HIRE[0], 'สร้างแผนเดินทาง'] });
  const sel = o.filled ? [0, 1, 4] : [];
  const car = await carPick('เลือกรถที่จะบำรุงรักษา', CARS, sel, { error: sel.length ? '' : E('กรุณาเลือกรถที่จะบำรุงรักษาอย่างน้อย 1 คัน') });
  add(page, col('Content', [await vehicleInfo([['เลขที่ MR', HIRE[0]], ['แผน', HIRE[1]], ['ไตรมาส', HIRE[3]], ['ผู้รับจ้าง', CONTRACTOR]], 'งานที่ได้รับว่าจ้าง'),
    col('Section', [await section('รายละเอียดแผนเดินทาง'), row('Row', [
      dropdown('สถานที่บำรุงรักษา (จุดรวมงาน)', v.place, { placeholder: 'ค้นหาจุดรวมงาน', lead: 'search-24-300-round', error: E('กรุณาเลือกสถานที่บำรุงรักษา') }),
      field('วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม') }), field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') })])], 16),
    car.sec,
    alertBox('Info', 'ยืนยันแล้วระบบส่งแผนให้ กบค. ตรวจสอบ และแจ้งเจ้าของรถ + กรย.', 'ส่งแจ้งเตือนก่อนหรือหลัง กบค. อนุมัติ ยังไม่เคาะ'),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันและส่งให้ กบค. ตรวจสอบ', { size: 'lg' }]])], 32), 'h');
  return scr;
}
const HT_COLS = [['ผู้รับจ้าง', 0, 'Lead text'], ['แผน', 150], ['รถ (คัน)', 100], ['จุดรวมงาน', 260], ['ช่วงวัน', 220], ['วันที่ส่ง', 120], ['', 60]];
const HT_ROWS = { wait: [[CONTRACTOR, HIRE[0], '3', HTRIP.place, HTRIP.d1 + ' – ' + HTRIP.d2, '24/10/2569', GO], ['หจก. ช่างกลภาคอีสาน', 'MR Z7000005', '4', 'จุดรวมงาน กฟฉ.3 นครราชสีมา', '17/11/2569 – 20/11/2569', '25/10/2569', GO]],
  ok: [[CONTRACTOR, 'MR Z6900014', '5', 'จุดรวมงาน กฟฉ.2 อุบลราชธานี', '05/08/2569 – 08/08/2569', '20/07/2569', GO]], rej: [] };
async function hireTripReview(name, o) {   // กบค. ดูรายละเอียดแผนเดินทางของผู้รับจ้าง
  o = o || {};
  const { scr, page } = await shell(name, { title: 'แผนเดินทาง · ' + CONTRACTOR, back: true, crumbs: ['แผนเดินทางผู้รับจ้าง', HIRE[0]], badge: TRIP_ST[o.st || 'wait'] });
  const nodes = [await vehicleInfo([['ผู้รับจ้าง', CONTRACTOR], ['เลขที่ MR', HIRE[0]], ['แผน', HIRE[1]], ['วันที่ส่ง', '24/10/2569'], ['จุดรวมงาน', HTRIP.place], ['ช่วงวันเดินทาง', HTRIP.d1 + ' – ' + HTRIP.d2], ['รถในแผนเดินทาง', '3 คัน']], 'รายละเอียดแผนเดินทาง'),
    col('Section', [await sectionLabel('รถที่จะบำรุงรักษา', { badge: 3 }), await tbl([['ทะเบียน', 170, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 220]], [0, 1, 4].map(i => [VEH[i][0], VEH[i][1], VEH[i][2]]))], 16),
    btnRow([['Secondary button', 'ปฏิเสธ', { size: 'lg' }], ['Primary button', 'อนุมัติแผนเดินทาง', { size: 'lg' }]])];
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S9 กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน ---------- */
const PREP = { new: ['ยังไม่รับทราบ', 'Gray'], ack: ['รับทราบแล้ว', 'Info'], ready: ['เตรียมแล้ว', 'Success'] };
const PREP_COLS = [['เลขที่ MR', 140, 'Lead text'], ['ผู้ดำเนินการ', 0], ['จุดรวมงาน', 260], ['วันเดินทาง', 140], ['สถานะ', 160, 'Badge'], ['', 60]];
const prepRows = (st) => [[P[0], 'กบค. (ตรวจเอง)', TRIP.place, TRIP.d1, { pill: PREP[st] }, GO], [HIRE[0], CONTRACTOR, HTRIP.place, HTRIP.d1, { pill: PREP.new }, GO]];
async function prepDetail(name, o) {
  o = o || {};
  const st = o.st || 'new';
  const { scr, page } = await shell(name, { title: 'เตรียมอะไหล่ · ' + P[0], back: true, crumbs: ['แผนเดินทางที่ต้องเตรียมอะไหล่', P[0]], badge: PREP[st] });
  const nodes = [await vehicleInfo([['เลขที่ MR', P[0]], ['ผู้ดำเนินการ', 'กบค. (ตรวจเอง)'], ['จุดรวมงาน', TRIP.place], ['ช่วงวันเดินทาง', TRIP.d1 + ' – ' + TRIP.d2]], 'แผนเดินทาง'),
    col('Section', [await sectionLabel('อะไหล่ที่ต้องวางที่จุดรวมงาน', { badge: PARTS.length }), await tbl([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 110], ['หน่วย', 90], ['คลัง', 180]], PARTS.map((p, i) => [p[0], p[1], p[3], p[4], WH[i]]))], 16)];
  if (st === 'ready') nodes.push(alertBox('Success', 'เตรียมอะไหล่ไว้ที่จุดรวมงานแล้ว 02/11/2569', 'กบค. เห็นสถานะนี้ที่แผนเดินทาง (S6/S10)'));
  else if (st === 'ack') nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกว่าเตรียมแล้ว', { size: 'lg' }]]));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบแผน', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S11 กบค. ตรวจรับงานรายคันของผู้รับจ้าง — ใช้ hireJob (หน้างานรายคัน) + tripDetail ใบจ้าง · หน้ารายการ "งานที่ผู้รับจ้างส่งมา" และ ReturnPart เดิมเลิกใช้ 3 พ.ย. 2569 ---------- */

/* ---------- S13 หน่วยงาน/เจ้าของรถ ยอมรับผลรายคัน · S14 ทั้งแผน + ประเมินความพึงพอใจ ---------- */
const ACC_COLS = [['ทะเบียน / แผน', 0, 'Lead text'], ['วันที่บำรุง', 140], ['ผู้ทำ', 220], ['เลขที่ MR', 140], ['สถานะ', 200, 'Badge'], ['', 60]];
const ACC_PLAN = ['ทั้งแผน (' + P[4] + ' คัน)', '04–12/11/2569', 'กบค. (ตรวจเอง)', P[0]];
const accRows = (o) => {
  o = o || {};
  const cars = [0, 1, 4].map((i, k) => [VEH[i][0], '0' + (4 + k) + '/11/2569', TRIP.staff[k] + ' (กบค.)', P[0], { pill: (o.accepted || []).indexOf(k) >= 0 ? ACC.ok : ACC.wait }, GO]);
  if (o.plan) cars.unshift([ACC_PLAN[0], ACC_PLAN[1], ACC_PLAN[2], ACC_PLAN[3], { pill: o.plan === 'done' ? ['ยอมรับผลทั้งแผนแล้ว', 'Success'] : ['ครบทุกคันแล้ว รอตรวจหลักฐาน', 'Warning'] }, GO]);
  return cars;
};
async function carResult(name, o) {   // รายการตรวจบำรุงรถรายคัน (ฝั่งหน่วยงาน) — ใบตรวจ 2 ใบ + ภาพ + อะไหล่ที่ใช้จริง · กรณีบำรุงรักษาไม่ได้แสดงสาเหตุ
  o = o || {};
  const car = o.cannot ? VEH[2] : V;
  const { scr, page } = await shell(name, { title: 'ผลการตรวจบำรุงรถ · ' + car[0], back: true, crumbs: ['รอตรวจสอบ', car[0]], badge: o.cannot ? WSTAT.cannot : ACC[o.ok ? 'ok' : 'wait'] });
  const nodes = [await vehicleInfo([['ทะเบียน', car[0]], ['ยี่ห้อ/รุ่น', car[1]], ['หน่วยงานเจ้าของรถ', car[2]], ['เลขที่ MR', P[0]], ['วันที่บำรุง', '04/11/2569'], ['ผู้ทำ', TRIP.staff[0] + ' (กบค.)']], 'ข้อมูลยานพาหนะ')];
  if (o.cannot) nodes.push(col('Section', [await sectionLabel('สาเหตุที่บำรุงรักษาไม่ได้'), kv([['สาเหตุ', 'รถติดภารกิจซ่อมสายส่งฉุกเฉิน ไม่อยู่ที่หน่วยงานในวันนัด'], ['ผู้บันทึก', TRIP.staff[0] + ' (กบค.)'], ['วันที่บันทึก', '05/11/2569']])], 16),
    alertBox('Warning', 'ใช้ฟอร์มเดียวกับคันที่บำรุงรักษาได้หรือแยก ยังไม่เคาะ (Q19)', 'จอนี้แสดงสาเหตุจาก S10 แล้วให้ยอมรับรับทราบ'));
  else nodes.push(col('Section', [await sectionLabel('เอกสารการตรวจบำรุงรถ (2)'), await upload('ใบตรวจสภาพอะไหล่ · ใบตรวจสภาพงานบำรุงรักษา', [pdf('ใบตรวจสภาพอะไหล่-' + car[0].split(' ')[0] + '.pdf', '380 KB'), pdf('ใบตรวจสภาพงานบำรุงรักษา-' + car[0].split(' ')[0] + '.pdf', '410 KB')], { readonly: true })], 16),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tbl(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16));   // ภาพตอนจบงานเอาออก 4 พ.ย. 2569 ให้ตรงกับหน้าปิดงาน
  if (o.ok) nodes.push(alertBox('Success', 'ยอมรับผลการตรวจบำรุงรถแล้ว 06/11/2569', 'รอคันอื่นในแผนครบแล้วจึงตรวจหลักฐานทั้งแผน (S14)'));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยอมรับผลการตรวจบำรุงรถ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
/* ประเมินความพึงพอใจ — ยืม RepairFeedback (คะแนนประเมินคุณภาพงานซ่อมบำรุงของงานซ่อม: Section header + Radio text card 1–5) · เจ้าของงานเลือก 22 ต.ค. 2569
   การประเมินเกิดตอนบำรุงรักษาครบทุกคันตามแผน ก่อนกดยอมรับผลทั้งแผน (S14) · ไม่มี/mobile → Section header + Radio text card ของไลบรารี */
async function feedback(score) {
  const title = 'คะแนนประเมินความพึงพอใจงานบำรุงรักษา', sub = 'ให้คะแนน 1–5 · 1 ต้องปรับปรุงมาก · 5 ดีมาก';
  if (!MOB && has('RepairFeedback')) {
    const f = inst('RepairFeedback'); f.name = 'RepairFeedback';
    const sh = find(f, 'Section header'); if (sh) { setProps(sh, { Title: title, 'Supporting text': true, Badge: false, Actions: false, 'More actions': false }); await text(sh, 'Supporting text', sub); }
    f.findAll(n => n.type === 'INSTANCE' && n.name === 'Radio text card').forEach(c => {
      const t = c.findOne(x => x.type === 'TEXT' && x.name === 'Text');
      const n = t ? +t.characters : NaN;
      setProps(c, { Selected: score && n === score ? 'True' : 'False', Supporting: false });
    });
    return f;
  }
  const r = MOB ? frame('Radio', 'HORIZONTAL', { gap: 8 }) : row('Radio', [], { gap: 16 });
  [1, 2, 3, 4, 5].forEach(n => { const c = inst('Radio text card', { State: 'Default', Selected: n === score ? 'True' : 'False' }, { Text: String(n), Supporting: false }); r.appendChild(c); c.layoutGrow = 1; });
  const sh = await section(title);
  return col('Section', [sh, r], 16);
}
async function planEvidence(name, o) {   // เอกสารหลักฐานการตรวจบำรุงรถทั้งแผน + ประเมินความพึงพอใจ + ยอมรับผลทั้งแผน
  o = o || {};
  const { scr, page } = await shell(name, { title: 'หลักฐานการตรวจบำรุงรถ · ' + P[0], back: true, crumbs: ['รอตรวจสอบ', P[0]], badge: o.done ? ['ยอมรับผลทั้งแผนแล้ว', 'Success'] : ['ครบทุกคันแล้ว', 'Warning'] });
  const nodes = [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('สรุปรายคัน', { badge: 3 }), await tbl([['ทะเบียน', 170, 'Lead text'], ['ใบตรวจสภาพอะไหล่', 0], ['ใบตรวจสภาพงานบำรุงรักษา', 0], ['การยอมรับรายคัน', 200, 'Badge']],
      [0, 1, 4].map(i => [VEH[i][0], 'ใบตรวจสภาพอะไหล่-' + VEH[i][0].split(' ')[0] + '.pdf', 'ใบตรวจสภาพงานบำรุงรักษา-' + VEH[i][0].split(' ')[0] + '.pdf', { pill: ACC.ok }]), { pagination: 3 })], 16),
    await feedback(o.score || 0),
    area('ข้อเสนอแนะเพิ่มเติม', o.score ? 'ทีมงานตรงเวลา ทำความสะอาดพื้นที่หลังเสร็จงาน' : '', { optional: true, placeholder: 'ระบุข้อเสนอแนะ' })];
  if (o.done) nodes.push(alertBox('Success', 'ยอมรับผลการตรวจบำรุงรถทั้งแผนแล้ว 14/11/2569', 'แจ้ง กบค. แล้ว — ส่งประวัติให้หัวหน้า กบค. ได้ (S15)'));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยอมรับผลการตรวจบำรุงรถ', { size: 'lg', disabled: !o.score }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S16 หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา ---------- */
const HST = { wait: ['รอหัวหน้าตรวจสอบ', 'Warning'], ok: ['ผ่านแล้ว', 'Success'], back: ['ตีกลับ', 'Error'] };
const HQ_COLS = [['เลขที่ MR', 140, 'Lead text'], ['แผน', 0], ['กบค. ผู้ส่ง', 200], ['จำนวนรถ', 110], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 180, 'Badge'], ['', 60]];
const hqRows = (st) => [[P[0], P[1], 'นายวิชัย ทองดี', P[4] + ' คัน', '12/11/2569', { pill: HST[st] }, GO], ['MR Z6900011', PLANS[4][1], 'นางสาวกนกวรรณ ใจมั่น', '10 คัน', '28/06/2569', { pill: HST.ok }, GO]];
async function headHistory(name, o) {   // หน้าเดียวกับ S15 (Display) + ปุ่มตีกลับ/อนุมัติ
  o = o || {};
  const { scr, page } = await shell(name, { title: 'หมายเลขแผน ' + P[0], back: true, crumbs: ['ประวัติรอตรวจสอบ', P[0]], badge: HST[o.st || 'wait'] });
  const total = +P[4];
  const nodes = [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ความคืบหน้ารายคัน'), kv([['บำรุงรักษาแล้ว', total + ' / ' + total + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['หน่วยงานยอมรับแล้ว', total + ' คัน'], ['ผู้ส่ง', 'นายวิชัย ทองดี (กบค.) · 12/11/2569']])], 16),
    col('Section', [await sectionLabel('ประวัติงานบำรุงรักษาทั้งหมด', { badge: total }), await tbl(HIST_COLS, HIST, { pagination: total })], 16)];
  if (o.st === 'ok') nodes.push(alertBox('Success', 'อนุมัติประวัติแล้ว 13/11/2569 — บันทึกเป็นประวัติทางการ', 'กบค. ออกรายงานผลและปิดงานได้ (S17)'));
  else nodes.push(btnRow([['Secondary button', 'ตีกลับ', { size: 'lg' }], ['Primary button', 'อนุมัติประวัติ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- รายการจอแยกตาม scenario (ชื่อ = scenario ใน 14-บำรุงรักษา-userflow.md) ---------- */
const SCENARIOS = [
  ['S1 · กบค. สร้างแผนบำรุงรักษาประจำปี และจัดรถลงไตรมาส', [
    ['รายการแผน', () => listScreen('S1 รายการแผน', { rows: PLANS })],
    ['ฟอร์มสร้างแผน (ว่าง)', () => planForm('S1 ฟอร์มสร้างแผน', {})],
    ['เลือกปีงบประมาณ — รายการปีเปิด', () => planForm('S1 เลือกปีงบประมาณ', { values: { name: FILLED.name }, yearOpen: true })],
    ['เลือกภาค — รายการภาคเปิด', () => planForm('S1 เลือกภาค', { values: FILLED, regionOpen: true, regions: [REGIONS[1]] })],
    ['เลือกเขต — เลือกได้หลายเขตของภาคที่เลือก', () => planForm('S1 เลือกเขต', { values: FILLED, regions: [REGIONS[1]], districts: ['กฟฉ.1', 'กฟฉ.3'], districtOpen: true })],
    ['ไม่มีรถในเขตและประเภทรถที่เลือก', () => planForm('S1 ไม่มีรถ', { values: FILLED, regions: [REGIONS[1]], districts: ['กฟฉ.3'], types: ['รถขุด'], noCars: true })],
    ['แท็บไตรมาส 1 — พิมพ์ค้นแล้วเลือกรถลงไตรมาส', () => planForm('S1 ไตรมาส 1', Object.assign({ values: FILLED, alloc: A_Q1, q: 1, carOpen: true, carQuery: '82' }, R2))],
    ['แท็บไตรมาส 2 — รายการรถบอกไตรมาสที่จัดไว้', () => planForm('S1 ไตรมาส 2', Object.assign({ values: FILLED, alloc: A_ALL, q: 2, carOpen: true }, R2))],
    ['เอาภาค เขต หรือประเภทรถออก — ยืนยันเอารถที่จัดไว้ออก', async () => { const s = await planForm('S1 เอาเขตออก', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, q: 2 }, R2)); await confirm(s, AREA_CONFIRM); return s; }],
    ['อะไหล่ในไตรมาส — ยืนยันเอาอะไหล่ออกจากทุกคัน', async () => { const s = await planForm('S1 เอาอะไหล่ออก', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, q: 2 }, R2)); await confirm(s, PART_REMOVE_CONFIRM); return s; }],
    ['กดบันทึกโดยยังไม่ครบ', () => planForm('S1 ยังไม่ครบ', { errors: true })],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await planForm('S1 ยืนยันการออก', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, q: 2 }, R2)); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' }); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S1 บันทึกไม่สำเร็จ', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, q: 2 }, R2)); notify(s, 'general error', true); return s; }],
    ['บันทึกและส่งอนุมัติสำเร็จ — รออนุมัติ', async () => { const s = await listScreen('S1 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(PLANS) }); notify(s, 'ส่งแผนบำรุงรักษาเพื่ออนุมัติสำเร็จ'); return s; }]]],
  ['S2 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนบำรุงรักษา', [
    ['รายการแผนรออนุมัติ', () => roleList('S2 แผนรออนุมัติ', { title: 'แผนรออนุมัติ', search: 'ค้นหาชื่อแผน, ผู้สร้าง', cols: REVIEW_COLS, rows: REVIEW_ROWS.map(reviewRow) })],
    ['รายละเอียดแผน — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)', () => planReview('S2 รายละเอียดแผน', {})],
    ['อนุมัติ — ยืนยันอนุมัติแผน', async () => { const s = await planReview('S2 ยืนยันอนุมัติ', {}); await confirm(s, { title: 'ยืนยันอนุมัติแผนบำรุงรักษา', sub: NP[1] + ' · ' + NP[4] + ' คัน · อนุมัติแล้ว กบค. เริ่มงานรายไตรมาสได้', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนสำเร็จ', async () => { const s = await planReview('S2 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนบำรุงรักษาสำเร็จ'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => planReview('S2 เลือกส่งกลับ', { decision: 'return' })],
    ['ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล', () => planReview('S2 ส่งกลับไม่ครบ', { decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await planReview('S2 ยืนยันส่งกลับ', { decision: 'return', reason: RETURN_REASON }); await confirm(s, { title: 'ยืนยันส่งกลับแก้ไข', sub: 'แผนจะกลับไปให้ กบค. แก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่', ok: 'ส่งกลับ' }); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await roleList('S2 ส่งกลับแล้ว', { title: 'แผนรออนุมัติ', search: 'ค้นหาชื่อแผน, ผู้สร้าง', cols: REVIEW_COLS, rows: [planAs('returned'), PLANS[2], PLANS[3]].map(reviewRow) }); notify(s, 'ส่งแผนกลับให้ กบค. แก้ไขแล้ว'); return s; }]]],
  // S3 ผพจ. ออกเลขงานและจัดซื้ออะไหล่ — พักไว้ 30 ต.ค. 2569 (เจ้าของงาน "อนุมัติเลขงาน ไม่ต้องมีในระบบแล้ว แยกออกไปก่อน") · ฟังก์ชัน planIssue/headPartCheck/poForm คงไว้ · userflow ย้ายไป 14-…-พักไว้-S3.md
  ['S4 · กบค. ติดตามความคืบหน้าและเบิกอะไหล่ของไตรมาส', [
    ['อะไหล่ไตรมาส 1 — รอเบิก เทียบคงเหลือ Smart Inventory', () => partsProgress('S4 รอเบิก', { picked: Q_ALL })],
    ['ยืนยันเบิก/จอง — สรุปรายการ', async () => { const s = await partsProgress('S4 สรุปรายการ', { picked: Q_ALL }); await partsSummary(s, { stock: 3, buy: 2 }); return s; }],
    ['ผลเบิก/จอง — คงเหลือไม่พอ 2 รายการ', () => partsProgress('S4 ไม่พอ', { picked: Q_ALL, result: 'short' })],
    ['เบิกครบแล้ว — ไปทำแผนเดินทางได้', () => partsProgress('S4 เบิกครบ', { picked: Q_ALL, result: 'ok' })],
    ['Smart Inventory ขัดข้อง', () => partsProgress('S4 คลังขัดข้อง', { picked: Q_ALL, inv: 'API error' })],
    ['ไตรมาสนี้ยังไม่มีอะไหล่ในแผน', () => partsProgress('S4 ไม่มีอะไหล่', { picked: [] })]]],
  // S5 เบิกอะไหล่ผ่านระบบจองอะไหล่ — รวมเข้า S4 2 พ.ย. 2569 (เจ้าของงาน "รวบ s4 s5 เป็นหน้าเดียวกัน ยุบ S5 ออกไปก่อน") · บล็อก D เว้นว่าง
  ['S6 · กบค. ทำแผนเดินทาง (ตรวจเอง)', [
    ['รถในไตรมาสและแผนเดินทาง (ยังไม่มีแผนเดินทาง)', () => tripList('S6 แผนเดินทาง (ว่าง)', { trips: [] })],
    ['ฟอร์มสร้างแผนเดินทาง (ว่าง)', () => tripForm('S6 ฟอร์มแผนเดินทาง', {})],
    ['กดเพิ่มรถ — popup รถของไตรมาสที่ยังไม่อยู่ในแผนเดินทาง', () => tripForm('S6 popup เพิ่มรถ', { modal: { pool: TRIP_ALL, ticked: TRIP_SEL } })],
    ['เพิ่มรถแล้ว — สถานที่ตั้งต้นสำนักงานที่รถอยู่', () => tripForm('S6 เพิ่มรถแล้ว', { sel: TRIP_SEL })],
    ['แก้ไขเบอร์ติดต่อและสถานที่บำรุงรักษาของรถ', async () => { const s = await tripForm('S6 แก้เบอร์และสถานที่', { sel: TRIP_SEL }); await tripCarEdit(s, 4, TRIP_PHONES, TRIP_LOCS); return s; }],
    ['เลือกช่วงวันเดินทาง', () => tripForm('S6 เลือกช่วงวัน', { sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, dateOpen: true })],
    ['กดยืนยันโดยยังไม่ครบ', () => tripForm('S6 ยังไม่ครบ', { errors: true })],
    ['กรอกครบ', () => tripForm('S6 กรอกครบ', { values: TRIP_FILLED, sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES })],
    ['ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)', async () => { const s = await tripList('S6 ยืนยันแล้ว', { trips: [TRIP_1] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }],
    ['สร้างแผนเดินทางใบถัดไป — popup ไม่แสดงรถที่อยู่ในแผนเดินทางแล้ว', () => tripForm('S6 ใบถัดไป popup', { modal: { pool: TRIP_REST, ticked: TRIP_REST, used: TRIP_SEL.length } })],
    ['แผนเดินทาง 2 ใบ — รถครบทุกคันของไตรมาส', async () => { const s = await tripList('S6 แผนเดินทาง 2 ใบ', { trips: [tripAs(TRIP_1, 'approved'), TRIP_2] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }],
    ['รถทุกคันของไตรมาสอยู่ในแผนเดินทางแล้ว', () => tripForm('S6 รถครบแล้ว', { modal: { pool: [], used: TRIP_ALL.length } })],
    ['แผนเดินทางถูกส่งกลับแก้ไข', () => tripList('S6 ถูกส่งกลับ', { trips: [tripAs(TRIP_1, 'returned')] })],
    ['แก้ไขแผนเดินทางที่ถูกส่งกลับ', () => tripForm('S6 แก้ไขที่ถูกส่งกลับ', { edit: true, alert: ['Error', 'ผู้อนุมัติส่งกลับให้แก้ไข', TRIP_RETURN], values: Object.assign({}, TRIP_FILLED, { d1: '10/11/2569', d2: '14/11/2569' }), sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES })],
    ['ส่งอนุมัติใหม่แล้ว', async () => { const s = await tripList('S6 ส่งอนุมัติใหม่', { trips: [Object.assign(tripAs(TRIP_1, 'review'), { d1: '10/11/2569', d2: '14/11/2569' })] }); notify(s, 'ส่งแผนเดินทางให้ผู้อนุมัติใหม่แล้ว'); return s; }]]],
  ['S7 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง', [
    ['รายการแผนเดินทางรออนุมัติ', () => tripReviewList('S7 รออนุมัติ', [TRIP_1, TRIP_V, TRIP_OTHER])],
    ['รายละเอียดแผนเดินทาง — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)', () => tripReview('S7 รายละเอียด', {})],
    ['อนุมัติ — ยืนยันอนุมัติแผนเดินทาง', async () => { const s = await tripReview('S7 ยืนยันอนุมัติ', {}); await confirm(s, { title: 'ยืนยันอนุมัติแผนเดินทาง', sub: TRIP_1.name + ' · ' + TRIP_1.sel.length + ' คัน · อนุมัติแล้วระบบแจ้งเตือน กรย. และหน่วยงานเจ้าของรถ', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนเดินทางสำเร็จ', async () => { const s = await tripReview('S7 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนเดินทางสำเร็จ'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => tripReview('S7 เลือกส่งกลับ', { decision: 'return' })],
    ['ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล', () => tripReview('S7 ส่งกลับไม่ครบ', { decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await tripReview('S7 ยืนยันส่งกลับ', { decision: 'return', reason: TRIP_RETURN }); await confirm(s, { title: 'ยืนยันส่งกลับแก้ไข', sub: 'แผนเดินทางจะกลับไปให้ กบค. แก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่', ok: 'ส่งกลับ' }); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await tripReviewList('S7 ส่งกลับแล้ว', [TRIP_V, TRIP_OTHER]); notify(s, 'ส่งแผนเดินทางกลับให้ กบค. แก้ไขแล้ว'); return s; }]]],
  ['S8 · กรย. และหน่วยงานเจ้าของรถ ได้รับแจ้งเตือนแผนเดินทาง', [
    ['กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)', async () => { const s = await tripSeenList('S8 กรย. มีใหม่', false); bell(s, true); return s; }],
    ['กรย. — เปิดแผงแจ้งเตือน', async () => { const s = await tripSeenList('S8 กรย. แผงแจ้งเตือน', false); bell(s, true); await notiPanel(s, [NOTI_KRY, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['กรย. — แผนเดินทาง ดูอย่างเดียว (รถทุกคันในใบ)', () => tripView('S8 กรย. แผนเดินทาง', false)],
    ['หน่วยงานเจ้าของรถ — เปิดแผงแจ้งเตือน', async () => { const s = await tripSeenList('S8 หน่วยงาน แผงแจ้งเตือน', true); bell(s, true); await notiPanel(s, [NOTI_OWN, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['หน่วยงานเจ้าของรถ — แผนเดินทาง ดูอย่างเดียว (เฉพาะรถของหน่วยงาน)', () => tripView('S8 หน่วยงาน แผนเดินทาง', true)]]],
  ['S9 · กบค. สร้างแผนเดินทางจ้างดำเนินการ (vendor)', [
    ['เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น', () => tripForm('S9 เลือกจ้าง', { mode: 'hire' })],
    ['เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด', () => tripForm('S9 รายชื่อผู้รับจ้าง', { mode: 'hire', vendorOpen: true, values: { name: TRIP_V.name } })],
    ['กดเพิ่มรถ — popup รถที่ยังไม่อยู่ในแผนเดินทาง', () => tripForm('S9 popup เพิ่มรถ', { mode: 'hire', values: { name: TRIP_V.name, vendor: TRIP_V.vendor }, modal: { pool: TRIP_REST, ticked: TRIP_REST, used: TRIP_SEL.length } })],
    ['แก้ไขเบอร์ติดต่อและสถานที่บำรุงรักษาของรถ', async () => { const s = await tripForm('S9 แก้เบอร์และสถานที่', { mode: 'hire', values: { name: TRIP_V.name, vendor: TRIP_V.vendor }, sel: TRIP_REST }); await tripCarEdit(s, 6, TRIP_V_PHONES, TRIP_V_LOCS); return s; }],
    ['กดยืนยันโดยยังไม่ครบ', () => tripForm('S9 ยังไม่ครบ', { mode: 'hire', errors: true })],
    ['กรอกครบ', () => tripForm('S9 กรอกครบ', { mode: 'hire', values: TRIP_V, sel: TRIP_REST, locs: TRIP_V_LOCS, phones: TRIP_V_PHONES })],
    ['ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)', async () => { const s = await tripList('S9 ยืนยันแล้ว', { trips: [tripAs(TRIP_1, 'approved'), TRIP_V] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }]]],
  // S9 เดิม กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน — ตัดออก 3 พ.ย. 2569 (เจ้าของงาน "เรื่องเตรียมอะไหล่ เป็นการติดต่อกันเอง") แทนด้วย S9 แผนจ้างดำเนินการ · prepDetail/prepRows คงไว้
  // S7 ผู้รับจ้างทำแผนเดินทาง · S8 กบค. ตรวจแผนผู้รับจ้าง (เดิม) — แทนด้วย S7 อนุมัติ S8 แจ้งเตือน 3 พ.ย. 2569 · hireTripForm/hireTripReview คงไว้ให้เส้นว่าจ้างที่รอออกแบบ (ไฟล์ 14 หัวข้อ 2.1)
  ['S10 · กบค. บันทึกงานบำรุงรักษารายคัน', [
    // แผนที่ กบค. ดำเนินการเอง (มุมผู้รับจ้างแยกเป็น S23 4 พ.ย. 2569) — 3 พ.ย. 2569 เจ้าของงาน: เข้าจากหน้ารายละเอียดแผนเดินทาง เลือกรถทีละคัน · ทำทีละขั้น (เริ่มงาน → ปิดงาน / บำรุงรักษาไม่ได้) ตาม RP & MA Job ของ UI Release#2
    ['หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน', () => tripDetail('S10 รายละเอียดแผนเดินทาง', {})],
    ['กดปุ่ม … ของรถ — ดูรายละเอียด แก้ไข ลบ', () => tripDetail('S10 เมนูของรถ', { menu: true })],
    ['เมนูแก้ไข — แก้ไขเบอร์ติดต่อและสถานที่', () => tripDetail('S10 แก้ไขรถในแผนเดินทาง', { edit: true })],
    ['เมนูลบ — ยืนยันเอารถออกจากแผนเดินทาง', () => tripDetail('S10 ลบรถออกจากแผนเดินทาง', { del: true })],
    ['หน้างานรายคัน — ยังไม่เริ่ม', () => jobPage('S10 งานรายคัน', {})],
    ['กดเริ่มงาน — หน้ารับรถ (รายการรับรถ + ลงนาม)', () => receivePage('S10 รับรถ', {})],
    ['กดเซ็นลงนาม — ลงนามการรับมอบรถ', () => receivePage('S10 ลงนามรับมอบรถ', { filled: true, modal: true })],
    ['ตรวจรายการและลงนามครบ — ยืนยันรับรถและเริ่มงาน', () => receivePage('S10 รับรถครบ', { filled: true, signed: true })],
    ['เริ่มงานแล้ว — อยู่ระหว่างบำรุงรักษา', async () => { const s = await jobPage('S10 อยู่ระหว่างบำรุงรักษา', { st: 'doing' }); notify(s, 'เริ่มงานบำรุงรักษาแล้ว'); return s; }],
    ['ปิดงาน — ฟอร์มผลงาน', () => workForm('S10 ปิดงาน', {})],
    ['กดปิดงานโดยยังไม่ครบ', () => workForm('S10 ปิดงานยังไม่ครบ', { errors: true })],
    ['กรอกผลงานครบ', () => workForm('S10 ปิดงานกรอกครบ', { filled: true })],
    ['ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง', async () => { const s = await tripDetail('S10 ปิดงานสำเร็จ', { st: JOB_MIX, oil: { [JOB_I]: 'wait' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['บำรุงรักษาไม่ได้ — ระบุสาเหตุ', () => jobPage('S10 บำรุงรักษาไม่ได้', { i: TRIP_1.sel[2], modal: 'cannot', reason: JOB_CANNOT })],
    ['บำรุงรักษาไม่ได้ — ยังไม่ระบุสาเหตุ', () => jobPage('S10 บำรุงรักษาไม่ได้ยังไม่ครบ', { i: TRIP_1.sel[2], modal: 'cannot', errors: true })],
    ['บำรุงรักษาไม่ได้ระหว่างบำรุงรักษา — อะไหล่ที่ใช้ไปแล้ว', () => jobPage('S10 บำรุงรักษาไม่ได้ระหว่างทำ', { st: 'doing', modal: 'cannot', reason: HIRE_WHY })],
    ['บันทึกบำรุงรักษาไม่ได้แล้ว — จบได้เลย ไม่ต้องส่งตรวจ', async () => { const s = await tripDetail('S10 บันทึกบำรุงรักษาไม่ได้', { st: { [TRIP_1.sel[2]]: 'cannot' } }); notify(s, 'บันทึกบำรุงรักษาไม่ได้แล้ว'); return s; }],
    ['ดูงานที่ปิดแล้ว — เสร็จสิ้น', () => workDetail('S10 งานที่ปิดแล้ว', {})]]],
  /* S23 ผู้รับจ้าง (เลขชั่วคราว · 4 พ.ย. 2569 เจ้าของงาน "แยกเป็นอีก scen นึงได้ป่ะ" + "เดี๋ยวสุดท้ายจะจัดเรียงใหม่ทั้งหมด") — วางต่อจาก S10 ตามลำดับงาน ไม่เลื่อนเลข S11–S22
     หน้ารับรถ หน้าปิดงาน และ popup บำรุงรักษาไม่ได้ใช้หน้าเดียวกับ S10 · ไม่มีแก้ไข ลบ รถในแผนและอะไหล่ตามแผนก่อนเริ่ม · เริ่มแล้วแก้ไข ลบ อะไหล่และภาพได้ */
  ['S23 · ผู้รับจ้าง บันทึกงานรายคันและส่งตรวจงาน', [
    ['รายละเอียดแผนเดินทาง สถานะงานรายคัน', () => tripDetail('S23 ผู้รับจ้าง แผนเดินทาง', { trip: HIRE_T, st: HIRE_VENDOR })],
    ['กดปุ่ม … ของรถ — ดูรายละเอียดอย่างเดียว', () => tripDetail('S23 ผู้รับจ้าง เมนูของรถ', { trip: HIRE_T, st: HIRE_VENDOR, menu: true, vendor: true })],
    ['หน้างานรายคัน ยังไม่เริ่ม — ไม่มีแก้ไข ลบ', () => jobPage('S23 ผู้รับจ้าง งานรายคัน', { vendor: true, i: TRIP_V.sel[4] })],
    ['เริ่มงานแล้ว — อยู่ระหว่างบำรุงรักษา', () => jobPage('S23 ผู้รับจ้าง อยู่ระหว่างบำรุงรักษา', { vendor: true, st: 'doing', i: TRIP_V.sel[3] })],
    ['อัปโหลดภาพเพิ่ม — กำลังอัปโหลด (แถบความคืบหน้า)', () => jobPage('S23 ผู้รับจ้าง อัปโหลดภาพ', { vendor: true, st: 'doing', i: TRIP_V.sel[3], uploading: true })],
    ['ปิดงานแล้ว ดำเนินการบำรุงรักษาแล้ว', () => hireJob('S23 ผู้รับจ้าง ดำเนินการแล้ว', { st: 'worked' })],
    ['กดไอคอนแก้ไขอะไหล่ — แก้จำนวนที่ใช้จริง', () => hireJob('S23 ผู้รับจ้าง แก้ไขอะไหล่', { st: 'worked', partEdit: true })],
    ['กดเพิ่มอะไหล่ — popup เพิ่มอะไหล่ที่ใช้จริง', () => hireJob('S23 ผู้รับจ้าง เพิ่มอะไหล่', { st: 'worked', partAdd: 'filled' })],
    ['กดไอคอนลบอะไหล่ — ยืนยันเอาออก', () => hireJob('S23 ผู้รับจ้าง ลบอะไหล่', { st: 'worked', partDel: true })],
    ['กดส่งตรวจงาน', async () => { const s = await hireJob('S23 ผู้รับจ้าง ยืนยันส่งตรวจงาน', { st: 'worked' }); await confirm(s, HIRE_SEND_CONFIRM(TRIP_CARS[HIRE_DONE])); return s; }],
    ['ส่งตรวจงานแล้ว รอตรวจรับ', async () => { const s = await hireJob('S23 ผู้รับจ้าง รอตรวจรับ', { st: 'wait' }); notify(s, 'ส่งตรวจงานแล้ว'); return s; }],
    ['แจ้งบำรุงรักษาไม่ได้ (ยังไม่ส่ง)', () => hireJob('S23 ผู้รับจ้าง แจ้งบำรุงรักษาไม่ได้', { st: 'reported', cannot: true })],
    ['ถูกส่งกลับแก้ไข (คันที่ปิดงานไว้)', () => hireJob('S23 ผู้รับจ้าง ส่งกลับแก้ไข', { st: 'returned' })],
    ['ถูกส่งกลับแก้ไข (คันที่แจ้งบำรุงรักษาไม่ได้)', () => hireJob('S23 ผู้รับจ้าง ส่งกลับแก้ไข แจ้งไม่ได้', { st: 'returned', cannot: true })]]],
  ['S11 · กบค. ตรวจรับงานรายคันของผู้รับจ้างและรับคืนอะไหล่', [
    ['หน้ารายละเอียดแผนเดินทาง — คันที่รอตรวจรับ', () => tripDetail('S11 แผนเดินทางจ้าง', { trip: HIRE_T, st: HIRE_MIX })],
    ['หน้างานรายคัน รอตรวจรับ — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)', () => hireJob('S11 ตรวจรับ', { st: 'wait', kbk: true })],
    ['คันที่แจ้งบำรุงรักษาไม่ได้ — สาเหตุและอะไหล่ส่งคืน', () => hireJob('S11 ตรวจรับ แจ้งไม่ได้', { st: 'wait', kbk: true, cannot: true })],
    ['อนุมัติ — ยืนยันอนุมัติงาน', async () => { const s = await hireJob('S11 ยืนยันอนุมัติ', { st: 'wait', kbk: true }); await confirm(s, HIRE_OK_CONFIRM(TRIP_CARS[HIRE_DONE])); return s; }],
    ['อนุมัติสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง', async () => { const s = await tripDetail('S11 อนุมัติแล้ว', { trip: HIRE_T, st: Object.assign({}, HIRE_MIX, { [HIRE_DONE]: 'done' }) }); notify(s, 'อนุมัติงานบำรุงรักษาแล้ว'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => hireJob('S11 เลือกส่งกลับ', { st: 'wait', kbk: true, decision: 'return' })],
    ['ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล', () => hireJob('S11 ส่งกลับไม่ครบ', { st: 'wait', kbk: true, decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await hireJob('S11 ยืนยันส่งกลับ', { st: 'wait', kbk: true, decision: 'return', reason: HIRE_BACK }); await confirm(s, HIRE_BACK_CONFIRM); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await tripDetail('S11 ส่งกลับแล้ว', { trip: HIRE_T, st: Object.assign({}, HIRE_MIX, { [HIRE_DONE]: 'returned' }) }); notify(s, 'ส่งกลับให้ผู้รับจ้างแก้ไขแล้ว'); return s; }]]],
  ['S12 · กบค. บันทึกผลตรวจน้ำมันไฮโดรลิก', [   // 4 พ.ย. 2569 เลิก popup: ใส่ผลตอนปิดงาน (ถ้ามี) หรือภายหลังที่หน้ารายละเอียดงานรายคัน · ป้ายรอผลที่สถานะงาน
    ['หน้าปิดงาน — เลือกเก็บตัวอย่าง ใส่ผลการทดสอบได้ (ถ้ามี)', () => workForm('S12 ปิดงาน ผลการทดสอบ', { filled: true })],
    ['ปิดงานโดยยังไม่มีผล — ป้ายรอผลตรวจน้ำมัน', async () => { const s = await tripDetail('S12 รอผลตรวจน้ำมัน', { st: JOB_MIX, oil: { [JOB_I]: 'wait' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['กดปุ่ม … ของรถ — ดูรายละเอียด', () => tripDetail('S12 เมนูของรถ', { st: JOB_MIX, oil: { [JOB_I]: 'wait' }, menu: true })],
    ['หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง', () => workDetail('S12 งานรายคัน รอผล', { res: {} })],
    ['กดบันทึกโดยยังไม่เลือกผล', () => workDetail('S12 ผลการทดสอบยังไม่ครบ', { res: { errors: true } })],
    ['เลือกผล + แนบไฟล์ (ถ้ามี)', () => workDetail('S12 ผลการทดสอบกรอกครบ', { res: { sel: 1, files: [OIL_FILE] } })],
    ['บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง', async () => { const s = await workDetail('S12 บันทึกผลสำเร็จ', { res: { sel: 1, files: [OIL_FILE], saved: true } }); notify(s, 'บันทึกผลการทดสอบน้ำมันไฮโดรลิกสำเร็จ'); return s; }],
    ['กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน', () => tripDetail('S12 น้ำมันไม่ผ่าน', { st: JOB_MIX, oil: { [JOB_I]: 'fail' } })]]],
  ['S13 · หน่วยงาน/เจ้าของรถ ยอมรับผลการตรวจบำรุงรถรายคัน', [
    ['รายการรอตรวจสอบ', () => roleList('S13 รายการ', { title: 'การตรวจบำรุงรถรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขที่ MR', cols: ACC_COLS, rows: accRows({}) })],
    ['ผลการตรวจบำรุงรถรายคัน', () => carResult('S13 รายคัน', {})],
    ['คันที่บำรุงรักษาไม่ได้ — สาเหตุ', () => carResult('S13 ทำไม่ได้', { cannot: true })],
    ['ยืนยันยอมรับผล', async () => { const s = await carResult('S13 ยืนยัน', {}); await confirm(s, { title: 'ยืนยันยอมรับผลการตรวจบำรุงรถ', sub: V[0] + ' · บำรุงรักษาวันที่ 04/11/2569', ok: 'ยอมรับผล' }); return s; }],
    ['ยอมรับผลแล้ว', async () => { const s = await roleList('S13 ยอมรับแล้ว', { title: 'การตรวจบำรุงรถรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขที่ MR', cols: ACC_COLS, rows: accRows({ accepted: [0] }) }); notify(s, 'ยอมรับผลการตรวจบำรุงรถ ' + V[0] + ' สำเร็จ'); return s; }]]],
  ['S14 · หน่วยงาน/เจ้าของรถ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)', [
    ['รายการ — ครบทุกคันแล้ว', () => roleList('S14 รายการ', { title: 'การตรวจบำรุงรถรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขที่ MR', cols: ACC_COLS, rows: accRows({ plan: 'wait', accepted: [0, 1, 2] }) })],
    ['หลักฐานทั้งแผน — ยังไม่ประเมิน', () => planEvidence('S14 ยังไม่ประเมิน', {})],
    ['ประเมินความพึงพอใจแล้ว', () => planEvidence('S14 ประเมินแล้ว', { score: 5 })],
    ['ยืนยันยอมรับผลทั้งแผน', async () => { const s = await planEvidence('S14 ยืนยัน', { score: 5 }); await confirm(s, { title: 'ยืนยันยอมรับผลการตรวจบำรุงรถทั้งแผน', sub: P[0] + ' · ' + P[4] + ' คัน · คะแนนความพึงพอใจ 5 · ระบบจะแจ้ง กบค.', ok: 'ยอมรับผล' }); return s; }],
    ['ยอมรับผลทั้งแผนแล้ว', async () => { const s = await planEvidence('S14 ยอมรับแล้ว', { score: 5, done: true }); notify(s, 'ยอมรับผลการตรวจบำรุงรถทั้งแผนสำเร็จ'); return s; }]]],
  ['S15 · กบค. บันทึกและส่งประวัติงานบำรุงรักษา', [
    ['ความคืบหน้ารายคัน (ยังไม่ครบ)', () => progressScreen('S15 ยังไม่ครบ', { done: 10 })],
    ['ครบทุกคัน — ประวัติงานบำรุงรักษา', () => historyScreen('S15 ครบทุกคัน', {})],
    ['ยืนยันส่งประวัติ', async () => { const s = await historyScreen('S15 ยืนยันส่ง', {}); await confirm(s, { title: 'ส่งประวัติให้หัวหน้า กบค. ตรวจสอบ', sub: 'ประวัติงานบำรุงรักษา ' + P[4] + ' คันของแผน ' + P[0] + ' จะแก้ไขไม่ได้จนกว่าหัวหน้าจะตรวจเสร็จ', ok: 'ส่งประวัติ' }); return s; }],
    ['ส่งแล้ว — รอหัวหน้าตรวจสอบ', async () => { const s = await historyScreen('S15 ส่งแล้ว', { sent: true }); notify(s, 'ส่งประวัติงานบำรุงรักษาให้หัวหน้าตรวจสอบแล้ว'); return s; }]]],
  ['S16 · หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา', [
    ['รายการประวัติรอตรวจสอบ', () => roleList('S16 รายการ', { title: 'ประวัติรอตรวจสอบ', search: 'ค้นหาเลขที่ MR, ชื่อแผน', cols: HQ_COLS, rows: hqRows('wait') })],
    ['ประวัติงานบำรุงรักษาของแผน', () => headHistory('S16 ประวัติของแผน', {})],
    ['ตีกลับ — ระบุเหตุผล', async () => { const s = await headHistory('S16 ตีกลับ', {}); await reason(s, 'ตีกลับประวัติงานบำรุงรักษา', 'เหตุผลที่ตีกลับ', 'ผลน้ำมันไฮโดรลิกของ 80-5738 น่าน ไม่ผ่าน ต้องระบุการแก้ไขก่อนบันทึกประวัติ', 'ตีกลับ'); return s; }],
    ['ยืนยันอนุมัติประวัติ', async () => { const s = await headHistory('S16 ยืนยันอนุมัติ', {}); await confirm(s, { title: 'ยืนยันอนุมัติประวัติงานบำรุงรักษา', sub: P[0] + ' · ' + P[4] + ' คัน · บันทึกเป็นประวัติทางการ', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติประวัติแล้ว', async () => { const s = await headHistory('S16 อนุมัติแล้ว', { st: 'ok' }); notify(s, 'อนุมัติประวัติงานบำรุงรักษาสำเร็จ'); return s; }]]],
  ['S17 · กบค. ออกรายงานผลและปิดงาน', [
    ['รายงานผล (ประวัติผ่านแล้ว)', () => reportScreen('S17 รายงานผล', {})],
    ['ยืนยันปิดงาน', async () => { const s = await reportScreen('S17 ยืนยันปิดงาน', {}); await confirm(s, { title: 'ยืนยันปิดงาน', sub: 'แผน ' + P[0] + ' จะเปลี่ยนสถานะเป็น "ปิดงานแล้ว" และแก้ไขข้อมูลไม่ได้อีก', ok: 'ปิดงาน' }); return s; }],
    ['ปิดงานแล้ว', async () => { const s = await reportScreen('S17 ปิดงานแล้ว', { closed: true }); notify(s, 'ปิดงานสำเร็จ'); return s; }]]],
  ['S18 · กบค. คำนวณต้นทุนการบำรุงรักษา', [
    ['ต้นทุนการบำรุงรักษา + Summary', () => costScreen('S18 ต้นทุน')],
    ['ดาวน์โหลด Excel แล้ว', async () => { const s = await costScreen('S18 ดาวน์โหลดแล้ว'); notify(s, 'ดาวน์โหลดไฟล์ Excel แล้ว'); return s; }]]],
  // S19 S20 ต่อท้าย ⇒ ตัวอักษรบล็อกของ scenario เดิมไม่ขยับ · ลำดับในเรื่องอยู่ที่ journey (build.json)
  ['S19 · กบค. แก้ไขแผนบำรุงรักษา แล้วส่งอนุมัติใหม่', [
    ['เมนู "…" → แก้ไข', async () => { const s = await listScreen('S19 เมนู', { rows: [planAs('returned')].concat(PLANS) }); planMenu(s, MENU); return s; }],
    ['รายละเอียดแผน — ส่งกลับแก้ไข', () => planDetail('S19 รายละเอียดแผน', { status: 'returned' })],
    ['ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้', () => planForm('S19 ฟอร์มแก้ไข', Object.assign({ alert: ALERT_RETURNED }, EDIT_FORM))],
    ['เอาภาค เขต หรือประเภทรถออก — ยืนยันเอารถที่จัดไว้ออก', async () => { const s = await planForm('S19 เอาเขตออก', EDIT_FORM); await confirm(s, AREA_CONFIRM); return s; }],
    ['“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น', async () => { const s = await planForm('S19 ยืนยันการออก', EDIT_FORM); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ยืนยัน' }); return s; }],
    ['ยืนยันการแก้ไขแผน', async () => { const s = await planForm('S19 ยืนยันการแก้ไข', EDIT_FORM); await confirm(s, EDIT_CONFIRM); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S19 บันทึกไม่สำเร็จ', EDIT_FORM); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — รออนุมัติ', async () => { const s = await listScreen('S19 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(PLANS) }); notify(s, 'บันทึกการแก้ไขแผนและส่งอนุมัติสำเร็จ'); return s; }],
    ['แผนอนุมัติแล้ว — เมนู "…" → แก้ไข', async () => { const s = await listScreen('S19 เมนูอนุมัติแล้ว', { rows: [planAs('approved')].concat(PLANS) }); planMenu(s, MENU.slice(0, 2)); return s; }],
    ['แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่', () => planForm('S19 ฟอร์มอนุมัติแล้ว', Object.assign({ alert: ALERT_APPROVED }, EDIT_FORM))],
    ['แผนดำเนินการแล้ว — เมนู "…" ดูรายละเอียดอย่างเดียว', async () => { const s = await listScreen('S19 เมนูดำเนินการ', { rows: PLANS }); planMenu(s, MENU.slice(0, 1)); return s; }]]],
  ['S20 · กบค. ลบแผนบำรุงรักษาที่ยังไม่อนุมัติ', [
    ['เมนู "…" → ลบ ในหน้า List', async () => { const s = await listScreen('S20 เมนู', { rows: [NEW_PLAN].concat(PLANS) }); planMenu(s, MENU); return s; }],
    ['ยืนยันการลบแผน ในหน้า List', async () => { const s = await listScreen('S20 ยืนยันการลบ List', { rows: [NEW_PLAN].concat(PLANS) }); await confirm(s, DELETE_CONFIRM); return s; }],
    ['ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)', async () => { const s = await listScreen('S20 ลบสำเร็จ', { rows: PLANS }); notify(s, 'ลบแผนบำรุงรักษาสำเร็จ'); return s; }],
    ['ปุ่ม “ลบแผน” ในหน้า Detail', () => planDetail('S20 ปุ่มลบแผน', {})],
    ['ยืนยันการลบแผน ในหน้า Detail', async () => { const s = await planDetail('S20 ยืนยันการลบ Detail', {}); await confirm(s, DELETE_CONFIRM); return s; }],
    ['แผนอนุมัติแล้ว — หน้ารายละเอียดไม่มีปุ่มลบ', () => planDetail('S20 อนุมัติแล้ว', { status: 'approved' })]]],
  ['S21 · กบค. กำหนดอะไหล่ของรถแต่ละคันในแผน', [
    ['อะไหล่ในไตรมาสบนฟอร์มสร้างแผน — ยังไม่มีรายการ', () => planForm('S21 ฟอร์มสร้างแผน', Object.assign({ values: FILLED, alloc: A_ALL, q: 1 }, R2))],
    ['หน้าอะไหล่ของรถ — ยังไม่เลือกอะไหล่', () => carPartsScreen('S21 อะไหล่ของรถ', {})],
    ['เลือกรถคันอื่น — รายการรถในไตรมาสเปิด', () => carPartsScreen('S21 เลือกรถ', { carOpen: true })],
    ['เลือกเปลี่ยนน้ำมัน — น้ำมันเข้ารายการอะไหล่', () => carPartsScreen('S21 เปลี่ยนน้ำมัน', { oil: 'change', picked: [0] })],
    ['เลือกอะไหล่จากคลัง — อะไหล่เข้ารายการของรถคันนี้', () => carPartsScreen('S21 เพิ่มอะไหล่', { oil: 'change', picked: CAR_ADD })],
    ['ระบุอะไหล่เพิ่มเติม — การ์ดรายการเพิ่มเติม (ว่าง)', () => carPartsScreen('S21 ระบุอะไหล่', { oil: 'change', picked: CAR_ADD, manual: {} })],
    ['ระบุอะไหล่เพิ่มเติม — กรอกครบ', () => carPartsScreen('S21 ระบุอะไหล่กรอกครบ', { oil: 'change', picked: CAR_ADD, manual: { filled: true } })],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await carPartsScreen('S21 ยืนยันการออก', { oil: 'change', picked: CAR_ADD, manual: { filled: true } }); await confirm(s, { title: 'ยืนยันการออก', sub: 'อะไหล่ที่แก้ไขไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' }); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await carPartsScreen('S21 บันทึกไม่สำเร็จ', { oil: 'change', picked: CAR_ADD, manual: { filled: true } }); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — กลับฟอร์มสร้างแผน', async () => { const s = await planForm('S21 บันทึกสำเร็จ', Object.assign({ values: FILLED, alloc: A_ALL, q: 1, picks: { 0: CAR_ADD }, manualCars: [0] }, R2)); notify(s, 'บันทึกอะไหล่ของรถ ' + CAND[0][0] + ' แล้ว'); return s; }]]],
  ['S22 · กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส', [
    ['รายการแผนที่ต้องเตรียมอะไหล่', () => roleList('S22 แผนที่ต้องเตรียมอะไหล่', { title: 'แผนที่ต้องเตรียมอะไหล่', search: 'ค้นหาเลขที่ MR, ชื่อแผน', cols: WH_COLS, rows: [whRow(NP, 0, '31/10/2569'), whRow(PLANS[1], 1, '08/10/2569'), whRow(PLANS[0], 4, '06/10/2569')] })],
    ['อะไหล่ไตรมาส 1 — รอรับทราบ', () => warehouseScreen('S22 ไตรมาส 1', { q: 1 })],
    ['ยืนยันรับทราบไตรมาส 1', async () => { const s = await warehouseScreen('S22 ยืนยันรับทราบ', { q: 1 }); await confirm(s, { title: 'ยืนยันรับทราบรายการอะไหล่ไตรมาส 1', sub: NP[1] + ' · ' + whParts(1).length + ' รายการ · กบค. จะเห็นว่าคลังรับทราบไตรมาสนี้แล้ว', ok: 'รับทราบ' }); return s; }],
    ['รับทราบไตรมาส 1 แล้ว', async () => { const s = await warehouseScreen('S22 รับทราบแล้ว', { q: 1, acked: [1] }); notify(s, 'รับทราบรายการอะไหล่ไตรมาส 1 แล้ว'); return s; }],
    ['แท็บไตรมาส 2 — รอรับทราบ', () => warehouseScreen('S22 ไตรมาส 2', { q: 2, acked: [1] })],
    ['แท็บไตรมาส 4 — ไม่มีรถในไตรมาส', () => warehouseScreen('S22 ไตรมาส 4', { q: 4, acked: [1] })],
    ['ฝั่ง กบค. — รายการแผน คอลัมน์คลังรับทราบ', () => listScreen('S22 กบค. รายการแผน', { rows: [planAs('approved')].concat(PLANS) })],
    ['ฝั่ง กบค. — รายละเอียดแผน สถานะคลังรายไตรมาส', () => planDetail('S22 กบค. รายละเอียดแผน', { status: 'approved', wh: [1] })]]],
];


/* ---------- จอ ↔ กล่องในผัง userflow (เจ้าของงานสั่ง 22 ต.ค. 2569: userflow กับ wireframe อยู่ข้างกันตอน export) ----------
   ชื่อ state → id กล่องในผัง mermaid ของ Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md (คั่นด้วยช่องว่างได้หลายกล่อง)
   ไม่ใส่ = ผังยังไม่มีกล่องของจอนี้ ⇒ ปลั๊กอินเขียนบอกใต้ผัง "จอที่ยังไม่มีกล่องในผัง" (รอเติม userflow — ไม่เติมผังเอง) */
const FLOW_NODES = {
  S1: { 'รายการแผน': 'D1', 'ฟอร์มสร้างแผน (ว่าง)': 'D2', 'เลือกปีงบประมาณ — รายการปีเปิด': 'A2', 'เลือกภาค — รายการภาคเปิด': 'A3', 'เลือกเขต — เลือกได้หลายเขตของภาคที่เลือก': 'A7', 'ไม่มีรถในเขตและประเภทรถที่เลือก': 'D4', 'แท็บไตรมาส 1 — พิมพ์ค้นแล้วเลือกรถลงไตรมาส': 'D4 A5', 'แท็บไตรมาส 2 — รายการรถบอกไตรมาสที่จัดไว้': 'A4 D3', 'อะไหล่ในไตรมาส — ยืนยันเอาอะไหล่ออกจากทุกคัน': 'D3 A10', 'เอาภาค เขต หรือประเภทรถออก — ยืนยันเอารถที่จัดไว้ออก': 'A3', 'กดบันทึกโดยยังไม่ครบ': 'Q1', 'บันทึกและส่งอนุมัติสำเร็จ — รออนุมัติ': 'A6 D5' },
  S4: { 'อะไหล่ไตรมาส 1 — รอเบิก เทียบคงเหลือ Smart Inventory': 'D1', 'ยืนยันเบิก/จอง — สรุปรายการ': 'A2 D2', 'ผลเบิก/จอง — คงเหลือไม่พอ 2 รายการ': 'D3', 'เบิกครบแล้ว — ไปทำแผนเดินทางได้': 'D4 A3', 'Smart Inventory ขัดข้อง': 'D1', 'ไตรมาสนี้ยังไม่มีอะไหล่ในแผน': 'D1' },
  S6: { 'รถในไตรมาสและแผนเดินทาง (ยังไม่มีแผนเดินทาง)': 'D1', 'แผนเดินทาง 2 ใบ — รถครบทุกคันของไตรมาส': 'D1', 'ฟอร์มสร้างแผนเดินทาง (ว่าง)': 'D2', 'กดเพิ่มรถ — popup รถของไตรมาสที่ยังไม่อยู่ในแผนเดินทาง': 'D5', 'เพิ่มรถแล้ว — สถานที่ตั้งต้นสำนักงานที่รถอยู่': 'D4', 'แก้ไขเบอร์ติดต่อและสถานที่บำรุงรักษาของรถ': 'A5', 'เลือกช่วงวันเดินทาง': 'A3', 'กดยืนยันโดยยังไม่ครบ': 'Q1', 'กรอกครบ': 'A4', 'ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)': 'D3', 'สร้างแผนเดินทางใบถัดไป — popup ไม่แสดงรถที่อยู่ในแผนเดินทางแล้ว': 'D5', 'รถทุกคันของไตรมาสอยู่ในแผนเดินทางแล้ว': 'D6', 'แผนเดินทางถูกส่งกลับแก้ไข': 'D1', 'แก้ไขแผนเดินทางที่ถูกส่งกลับ': 'D2', 'ส่งอนุมัติใหม่แล้ว': 'D3' },
  S10: { 'หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน': 'D1', 'กดปุ่ม … ของรถ — ดูรายละเอียด แก้ไข ลบ': 'D1', 'เมนูแก้ไข — แก้ไขเบอร์ติดต่อและสถานที่': 'A6', 'เมนูลบ — ยืนยันเอารถออกจากแผนเดินทาง': 'A7', 'หน้างานรายคัน — ยังไม่เริ่ม': 'D2', 'กดเริ่มงาน — หน้ารับรถ (รายการรับรถ + ลงนาม)': 'A2', 'กดเซ็นลงนาม — ลงนามการรับมอบรถ': 'A2', 'ตรวจรายการและลงนามครบ — ยืนยันรับรถและเริ่มงาน': 'A2', 'เริ่มงานแล้ว — อยู่ระหว่างบำรุงรักษา': 'D3', 'ปิดงาน — ฟอร์มผลงาน': 'A5', 'กดปิดงานโดยยังไม่ครบ': 'Q2', 'กรอกผลงานครบ': 'A5', 'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง': 'D4', 'บำรุงรักษาไม่ได้ — ระบุสาเหตุ': 'A3', 'บำรุงรักษาไม่ได้ — ยังไม่ระบุสาเหตุ': 'A3', 'บำรุงรักษาไม่ได้ระหว่างบำรุงรักษา — อะไหล่ที่ใช้ไปแล้ว': 'A3', 'บันทึกบำรุงรักษาไม่ได้แล้ว — จบได้เลย ไม่ต้องส่งตรวจ': 'D4', 'ดูงานที่ปิดแล้ว — เสร็จสิ้น': 'D5' },
  S23: { 'รายละเอียดแผนเดินทาง สถานะงานรายคัน': 'D1', 'กดปุ่ม … ของรถ — ดูรายละเอียดอย่างเดียว': 'D1', 'หน้างานรายคัน ยังไม่เริ่ม — ไม่มีแก้ไข ลบ': 'D2', 'เริ่มงานแล้ว — อยู่ระหว่างบำรุงรักษา': 'D3', 'ปิดงานแล้ว ดำเนินการบำรุงรักษาแล้ว': 'D4', 'กดไอคอนแก้ไขอะไหล่ — แก้จำนวนที่ใช้จริง': 'A6', 'กดไอคอนลบอะไหล่ — ยืนยันเอาออก': 'A6', 'กดเพิ่มอะไหล่ — popup เพิ่มอะไหล่ที่ใช้จริง': 'A6', 'อัปโหลดภาพเพิ่ม — กำลังอัปโหลด (แถบความคืบหน้า)': 'D3', 'กดส่งตรวจงาน': 'A8', 'ส่งตรวจงานแล้ว รอตรวจรับ': 'D6', 'แจ้งบำรุงรักษาไม่ได้ (ยังไม่ส่ง)': 'D5', 'ถูกส่งกลับแก้ไข (คันที่ปิดงานไว้)': 'D8', 'ถูกส่งกลับแก้ไข (คันที่แจ้งบำรุงรักษาไม่ได้)': 'D8' },
  S12: { 'หน้าปิดงาน — เลือกเก็บตัวอย่าง ใส่ผลการทดสอบได้ (ถ้ามี)': 'A1', 'ปิดงานโดยยังไม่มีผล — ป้ายรอผลตรวจน้ำมัน': 'D1', 'กดปุ่ม … ของรถ — ดูรายละเอียด': 'A3', 'หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง': 'D2', 'กดบันทึกโดยยังไม่เลือกผล': 'Q2', 'เลือกผล + แนบไฟล์ (ถ้ามี)': 'A4', 'บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง': 'D3', 'กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน': 'D4' },
  S15: { 'ความคืบหน้ารายคัน (ยังไม่ครบ)': 'D1', 'ครบทุกคัน — ประวัติงานบำรุงรักษา': 'D2', 'ยืนยันส่งประวัติ': 'A2', 'ส่งแล้ว — รอหัวหน้าตรวจสอบ': 'D3' },
  S17: { 'รายงานผล (ประวัติผ่านแล้ว)': 'D2', 'ยืนยันปิดงาน': 'Q1', 'ปิดงานแล้ว': 'D3' },
  S18: { 'ต้นทุนการบำรุงรักษา + Summary': 'D2 D3', 'ดาวน์โหลด Excel แล้ว': 'A3' },
  S19: { 'เมนู "…" → แก้ไข': 'A1', 'รายละเอียดแผน — ส่งกลับแก้ไข': 'A1', 'ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้': 'D3', 'เอาภาค เขต หรือประเภทรถออก — ยืนยันเอารถที่จัดไว้ออก': 'D4', '“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น': 'D5', 'ยืนยันการแก้ไขแผน': 'D6', 'บันทึกไม่สำเร็จ': 'D7', 'บันทึกสำเร็จ — รออนุมัติ': 'D8', 'แผนอนุมัติแล้ว — เมนู "…" → แก้ไข': 'A1', 'แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่': 'D3', 'แผนดำเนินการแล้ว — เมนู "…" ดูรายละเอียดอย่างเดียว': 'D2' },
  S22: { 'รายการแผนที่ต้องเตรียมอะไหล่': 'D1', 'อะไหล่ไตรมาส 1 — รอรับทราบ': 'D2', 'ยืนยันรับทราบไตรมาส 1': 'A3', 'รับทราบไตรมาส 1 แล้ว': 'D3', 'แท็บไตรมาส 2 — รอรับทราบ': 'A2', 'แท็บไตรมาส 4 — ไม่มีรถในไตรมาส': 'A2', 'ฝั่ง กบค. — รายการแผน คอลัมน์คลังรับทราบ': 'D5', 'ฝั่ง กบค. — รายละเอียดแผน สถานะคลังรายไตรมาส': 'D5' },
  S21: { 'อะไหล่ในไตรมาสบนฟอร์มสร้างแผน — ยังไม่มีรายการ': 'D1', 'หน้าอะไหล่ของรถ — ยังไม่เลือกอะไหล่': 'D2 D3', 'เลือกรถคันอื่น — รายการรถในไตรมาสเปิด': 'A2', 'เลือกเปลี่ยนน้ำมัน — น้ำมันเข้ารายการอะไหล่': 'A6', 'เลือกอะไหล่จากคลัง — อะไหล่เข้ารายการของรถคันนี้': 'A3 A4', 'ระบุอะไหล่เพิ่มเติม — การ์ดรายการเพิ่มเติม (ว่าง)': 'A7', 'ระบุอะไหล่เพิ่มเติม — กรอกครบ': 'A8', 'บันทึกไม่สำเร็จ': 'A5', 'บันทึกสำเร็จ — กลับฟอร์มสร้างแผน': 'D4' },
  S20: { 'เมนู "…" → ลบ ในหน้า List': 'A1', 'ยืนยันการลบแผน ในหน้า List': 'D3', 'ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)': 'D4', 'ปุ่ม “ลบแผน” ในหน้า Detail': 'A2', 'ยืนยันการลบแผน ในหน้า Detail': 'D3', 'แผนอนุมัติแล้ว — หน้ารายละเอียดไม่มีปุ่มลบ': 'D2' },
  S2: { 'รายการแผนรออนุมัติ': 'D1', 'รายละเอียดแผน — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)': 'D2 A2', 'อนุมัติ — ยืนยันอนุมัติแผน': 'A5', 'อนุมัติแผนสำเร็จ': 'D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล': 'A3', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A4', 'ส่งกลับแล้ว': 'D3' },
  // S3 พักไว้ 30 ต.ค. 2569
  S7: { 'รายการแผนเดินทางรออนุมัติ': 'D1', 'รายละเอียดแผนเดินทาง — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)': 'D2 A2', 'อนุมัติ — ยืนยันอนุมัติแผนเดินทาง': 'A5', 'อนุมัติแผนเดินทางสำเร็จ': 'D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล': 'A3', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A4', 'ส่งกลับแล้ว': 'D3' },
  S9: { 'เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น': 'D2', 'เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด': 'A3', 'กดเพิ่มรถ — popup รถที่ยังไม่อยู่ในแผนเดินทาง': 'D5', 'แก้ไขเบอร์ติดต่อและสถานที่บำรุงรักษาของรถ': 'A5', 'กดยืนยันโดยยังไม่ครบ': 'Q1', 'กรอกครบ': 'A6', 'ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)': 'D3' },
  S8: { 'กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)': 'D1', 'กรย. — เปิดแผงแจ้งเตือน': 'A1', 'กรย. — แผนเดินทาง ดูอย่างเดียว (รถทุกคันในใบ)': 'D2', 'หน่วยงานเจ้าของรถ — เปิดแผงแจ้งเตือน': 'A2', 'หน่วยงานเจ้าของรถ — แผนเดินทาง ดูอย่างเดียว (เฉพาะรถของหน่วยงาน)': 'D3' },
  S11: { 'หน้ารายละเอียดแผนเดินทาง — คันที่รอตรวจรับ': 'D1', 'หน้างานรายคัน รอตรวจรับ — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)': 'D2 A2', 'คันที่แจ้งบำรุงรักษาไม่ได้ — สาเหตุและอะไหล่ส่งคืน': 'D2', 'อนุมัติ — ยืนยันอนุมัติงาน': 'A4', 'อนุมัติสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง': 'A6 D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล': 'A3', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A3', 'ส่งกลับแล้ว': 'D3' },
  S13: { 'รายการรอตรวจสอบ': 'D1', 'ผลการตรวจบำรุงรถรายคัน': 'D2', 'คันที่บำรุงรักษาไม่ได้ — สาเหตุ': 'D2', 'ยืนยันยอมรับผล': 'A3', 'ยอมรับผลแล้ว': 'D3' },
  S14: { 'รายการ — ครบทุกคันแล้ว': 'D1', 'หลักฐานทั้งแผน — ยังไม่ประเมิน': 'D2', 'ประเมินความพึงพอใจแล้ว': 'A3', 'ยืนยันยอมรับผลทั้งแผน': 'A4', 'ยอมรับผลทั้งแผนแล้ว': 'D3' },
  S16: { 'รายการประวัติรอตรวจสอบ': 'D1', 'ประวัติงานบำรุงรักษาของแผน': 'D2', 'ตีกลับ — ระบุเหตุผล': 'A3', 'ยืนยันอนุมัติประวัติ': 'A4', 'อนุมัติประวัติแล้ว': 'D4' },
};

/* ---------- กลุ่ม = scenario (แพทเทิร์นเดียวกับ Overhaul — เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก · แถว Desktop แล้ว Mobile) ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/* ตัวอักษรบล็อกผูกกับเลข scenario ตายตัว (2 พ.ย. 2569) — ตัด/รวม scenario แล้วบล็อกอื่นไม่เลื่อน ชื่อเฟรมที่ export ไปแล้วยังตรง · S5 รวมเข้า S4 ⇒ D เว้นว่าง */
const BLOCK_OF = ['S1', 'S2', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20', 'S21', 'S22', 'S23'];   // S23 ผู้รับจ้าง (4 พ.ย. 2569) = V ต่อท้าย ตัวอักษรเดิมไม่เลื่อน
const GROUPS = SCENARIOS.map(([title, screens], i) => {
  const tag0 = title.split(' · ')[0], code = BLOCK_OF.indexOf(tag0) >= 0 ? LETTERS[BLOCK_OF.indexOf(tag0)] : LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  const map = FLOW_NODES[tag] || {};
  return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens: screens.map(([label, fn]) => [label, fn, map[label] || '']) }] };
});

/* ---------- สร้าง (ปุ่มชุดเดียวกับ Overhaul 21 ต.ค. 2569: ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component) ----------
   เจ้าของงานสั่ง 22 ต.ค. 2569 "จะเอาลงในเพจ Maintainance ด้วยกันเลย" ⇒ ทุกปุ่มวางบนหน้า "Maintainance" (ไม่มีก็สร้าง) ต่อใต้ของเดิม · ใต้ของเดิมเกินขอบพื้นที่วางงานแล้ววางเหนือของเดิม (roomyPage) ไม่ลบ/ไม่ย้ายของที่มีอยู่
   แต่ละบล็อก scenario = ผัง userflow ซ้ายสุด + ป้าย Device + คอลัมน์จอ A.1 A.2 … (แถว Desktop แล้ว Mobile ตามที่เลือก) */
const PAGE_NAMES = ['Maintainance', 'Maintenance'];
const BLOCK_H = 7000;   // ความสูงที่เผื่อต่อ 1 บล็อก scenario ตอนเช็คว่าหน้าเหลือที่พอไหม
/* ย้ายบล็อกล่าสุดที่ล้นขอบ (หรือที่ค้างบนหน้า -2 จากปุ่มรุ่นก่อน) มาไว้เหนือของเดิมบนหน้า Maintainance ไม่ต้องสร้างใหม่ · ของเดิมที่เหลือไม่แตะ แค่รายงานจำนวน */
async function moveLatest() {
  const main = (await namedPage(PAGE_NAMES)).page, tag = PLUGIN.prefix + ' · ', scr = PLUGIN.prefix + ' / ';
  await figma.setCurrentPageAsync(main);
  const isBar = (n) => n.name.indexOf(tag) === 0 && /^[A-Z] /.test(n.name.slice(tag.length)) && n.name.indexOf(' userflow S') < 0;
  const spare = figma.root.children.filter(p => new RegExp('^' + PAGE_NAMES[0] + '-\\d+$', 'i').test(p.name.trim()));
  let src = main, nodes = [];
  for (const p of spare) { if (p.loadAsync) await p.loadAsync(); if (p.children.some(isBar)) { src = p; nodes = p.children.slice(); break; } }
  if (!nodes.length) { const last = main.children.filter(isBar).reduce((m, n) => Math.max(m, n.y), 0); if (last > CANVAS_MAX) nodes = main.children.filter(n => n.y >= last); }
  if (!nodes.length) { log('บล็อกล่าสุดบนหน้า "' + main.name.trim() + '" อยู่ในขอบพื้นที่วางงานอยู่แล้ว ไม่ต้องย้าย'); return; }
  const spot = fitOn(main, nodes);   // แบบเดียวกับตอนสร้าง: ใต้ของเดิม → ช่องว่างจากขอบบน → คอลัมน์ใหม่ทางขวา (4 พ.ย. 2569)
  if (!spot) { log('⚠ หน้านี้ไม่มีที่ว่างในขอบพื้นที่วางงานแล้ว — ย้ายไม่สำเร็จ ไม่มีอะไรเปลี่ยน'); return; }
  for (const n of nodes) { if (src !== main) main.appendChild(n); }
  shiftAll(nodes, spot);
  if (src !== main && !src.children.length) { log('ลบหน้าว่าง "' + src.name + '" แล้ว'); src.remove(); }
  const screens = nodes.filter(n => n.name.indexOf(scr) === 0);
  figma.currentPage.selection = screens.slice(0, 1);
  figma.viewport.scrollAndZoomIntoView(screens.slice(0, 6));
  log('✓ ย้ายบล็อกล่าสุด ' + screens.length + ' จอ (' + nodes.length + ' ชิ้น) มาไว้ในขอบพื้นที่วางงานบนหน้า "' + main.name.trim() + '" แล้ว (' + (spot.side ? 'คอลัมน์ใหม่ทางขวา x=' + Math.round(spot.x) + ', ' : '') + 'y=' + Math.round(spot.y) + ')');
  const left = main.children.filter(n => n.y > CANVAS_MAX && n.name.indexOf(scr) === 0).length;
  if (left) log('บนหน้านี้ยังมีจอชุดเก่าเกินขอบอีก ' + left + ' จอ ไม่ได้แตะ');
}
async function buildSet(SCEN, GRP, what, devices) {
  errors.length = 0;
  const t0 = Date.now();
  log('นำเข้า component จากไลบรารี + ยืมจาก flow งานซ่อมในไฟล์นี้…');
  await resolveAll();
  const borrowed = LOCAL_OPTIONAL.filter(n => has(n) && ['Device Type', 'Component 1', 'Header'].indexOf(n) < 0);
  log('component จาก flow งานซ่อมที่ใช้ได้: ' + (borrowed.length ? borrowed.join(' · ') : 'ไม่มี — ใช้แบบสำรองจากไลบรารีทุกจุด'));
  log(deviceSetInfo());
  log(USERFLOW ? 'ผัง userflow: ' + USERFLOW.src + ' (' + Object.keys(USERFLOW.scenarios).length + ' scenario ในไฟล์ · วางข้างจอเฉพาะ scenario ที่มีจอ)' : '⚠ ไม่มีผัง userflow ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่');
  log('นำเข้าเสร็จใน ' + Math.round((Date.now() - t0) / 1000) + ' วินาที · เริ่มสร้าง');
  /* 4 พ.ย. 2569 เจ้าของงาน "อยากให้ export ไปที่ Maintainance แทน" ⇒ สร้างบนหน้า Maintainance เสมอ (ใต้ของทั้งหมดก่อน) แล้ววัดขนาดจริงค่อยย้ายลงช่อง (fitOn)
     ไม่ใช้ roomyPage(BLOCK_H × จำนวนบล็อก) แบบเดิม เพราะทั้งชุดประเมินได้ 140,000 เกินขอบเสมอจึงไปหน้า -2 ทุกครั้ง · หน้า -2 เหลือไว้เฉพาะตอนหน้าเดิมไม่มีที่จริงๆ */
  const tp = await namedPage(PAGE_NAMES);
  let page = tp.page;
  if (page.loadAsync) await page.loadAsync();
  await figma.setCurrentPageAsync(page);
  const before = new Set(page.children);
  const TOTAL = SCEN.reduce((a, x) => a + x[1].length, 0);
  log(INDEX.has('Header') ? 'แถบรหัส flow: component Header ของทีมออกแบบ' : 'แถบรหัส flow: ไม่พบ component Header ในไฟล์ — วาดแถบธรรมดาสีเดียวกันแทน');
  const { made, flows } = await buildGrid(page, PLUGIN.prefix, GRP, before.size ? pageBottom(page) + 400 : 0, TOTAL * devices.length, { devices });
  const fresh = page.children.filter(n => !before.has(n));
  const fit = fresh.length ? fitOn(page, fresh) : { dx: 0, dy: 0, y: 0 };
  const hgt = fresh.length ? Math.round(Math.max(...fresh.map(n => n.y + n.height)) - Math.min(...fresh.map(n => n.y))) : 0;
  if (fit) {
    shiftAll(fresh, fit);
    log(tp.fallback ? '⚠ หาหน้า "Maintainance" ไม่เจอและสร้างหน้าใหม่ไม่ได้ (แพลนจำกัดจำนวนหน้า) — วางในหน้า "' + page.name + '" ไม่ลบอะไร'
      : tp.fresh ? 'ไม่พบหน้า "Maintainance" — สร้างหน้าใหม่ชื่อนี้แล้ววางลงไป'
      : !before.size ? 'วางบนหน้า "' + page.name.trim() + '" (หน้าว่าง)'
      : fit.side ? 'แนวตั้งของหน้า "' + page.name.trim() + '" ไม่พอสำหรับชุดนี้ (สูง ' + hgt + ') — วางเป็นคอลัมน์ใหม่ทางขวาของของเดิม (x=' + Math.round(fit.x) + ', y=' + Math.round(fit.y) + ') ของที่มีอยู่ไม่ถูกแตะ'
      : fit.y < pageTop({ children: [...before] }) ? 'ใต้ของเดิมเกินขอบพื้นที่วางงานของ Figma — วางในช่องว่างด้านบนของหน้า "' + page.name.trim() + '" (y=' + Math.round(fit.y) + ') ของที่มีอยู่ไม่ถูกแตะ'
      : 'วางบนหน้า "' + page.name.trim() + '" ต่อใต้ของเดิม (y=' + Math.round(fit.y) + ') — ของที่มีอยู่บนหน้านี้ไม่ถูกแตะ');
  } else {   // หน้าเดิมเต็มทั้งแนวตั้งและแนวนอน ⇒ ย้ายชุดนี้ไปหน้า <ชื่อ>-2 <ชื่อ>-3 … ที่ยังมีที่
    const re = new RegExp('^' + PAGE_NAMES[0] + '-(\\d+)$', 'i'), spare = figma.root.children.filter(p => re.test(p.name.trim()));
    let dest = null;
    for (const p of spare) { if (p.loadAsync) await p.loadAsync(); if (spotOn(p, hgt, 400)) { dest = p; break; } }
    if (!dest) { try { dest = figma.createPage(); dest.name = PAGE_NAMES[0] + '-' + (spare.reduce((m, p) => Math.max(m, +p.name.trim().match(re)[1]), 1) + 1); } catch (e) { dest = null; } }
    if (dest) {
      for (const n of fresh) dest.appendChild(n);
      shiftAll(fresh, fitOn(dest, fresh) || { dx: 0, dy: 0 });
      page = dest; await figma.setCurrentPageAsync(page);
      log('หน้า "' + tp.page.name.trim() + '" ไม่มีที่ว่างในขอบพื้นที่วางงานของ Figma แล้ว — ใช้หน้า "' + page.name + '" แทน');
    } else log('⚠ หน้าเดิมเกินขอบพื้นที่วางงานของ Figma และสร้างหน้าใหม่ไม่ได้ — จอชุดนี้อาจเลื่อนไปดูไม่ถึง');
  }
  let instances = 0, loose = 0;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') loose++;
  }
  figma.currentPage.selection = made.slice(0, 1);   // ของใหม่อยู่ล่างสุดของ Layers ⇒ เลือกจอแรกให้ Layers เลื่อนไปหา
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 6));
  log('');
  if (pageBottom(page) > CANVAS_MAX) log('หมายเหตุ: ชุดนี้ยาวเกินขอบพื้นที่วางงานของ Figma จอท้ายๆ อาจเลื่อนไปไม่ถึง — ใช้สร้างทีละ scenario แทน');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ผัง userflow ' + flows + ' ผัง · ' + GRP.length + ' บล็อก ' + what + ' (' + GRP.map(g => g.code).join(' ') + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓') + ' (ผัง userflow เป็นของวาดประกอบนอกจอ ไม่นับ)');
  log('component ที่ใช้ (' + USED.size + '): ' + [...USED].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่ต้องสลับเป็นฟอนต์สำรอง (component ใช้ฟอนต์ที่เครื่องไม่มี) ' + FONT_SWAPPED + ' จุด — ฟอนต์ ' + (FALLBACK_FONT ? FALLBACK_FONT.family + ' ' + FALLBACK_FONT.style : '-'));
  reportOversize();
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
async function build(o) { await buildSet(SCENARIOS, GROUPS, 'scenario', devOf(o)); }
async function buildDesktop() { await buildSet(SCENARIOS, GROUPS, 'scenario · desktop', [false]); }   // ปุ่มนี้ระบุอุปกรณ์เอง ไม่ใช้ตัวเลือกบนหน้าต่าง
async function buildMobile() { await buildSet(SCENARIOS, GROUPS, 'scenario · mobile', [true]); }
async function buildPick(o) {   // ติ๊กเฉพาะบาง scenario · รหัสตัวอักษรคงเดิม (A–I)
  const idx = (o.pick || []).map(Number).filter(i => i >= 0 && i < SCENARIOS.length);
  if (!idx.length) { log('ยังไม่ได้ติ๊ก scenario — ติ๊กอย่างน้อย 1 รายการแล้วกดอีกครั้ง'); return; }
  await buildSet(SCENARIOS.filter((_, i) => idx.indexOf(i) >= 0), GROUPS.filter((_, i) => idx.indexOf(i) >= 0), 'scenario ที่เลือก', devOf(o));
}

/* ---------- journey แนวขวาง (ปุ่มแยก · เจ้าของงานสั่ง 22 ต.ค. 2569 "ลงในเพจ maintainance แต่มีปุ่มแยกการ generate userflow") ----------
   18 scenario ต่อกันซ้าย → ขวา ตาม build.json "journey" · กล่องหน้าจอในผังติดป้ายรหัสจอ (A.1 …) และใส่ภาพย่อจากจอที่สร้างไว้บนหน้านี้แล้ว (ไม่มีจอ = กล่องเปล่า)
   วางต่อใต้ของเดิมบนหน้า "Maintainance" ไม่ลบ/ไม่ย้ายของที่มีอยู่ */
function journeyCodes(n) {
  const g = GROUPS.find(x => x.subs[0].tag === 'S' + n); if (!g) return null;
  const sub = g.subs[0], codes = {}, loose = [];
  sub.screens.forEach(([label, , ids], i) => { const c = sub.code + '.' + (i + 1); const list = String(ids || '').split(/\s+/).filter(Boolean); if (!list.length) loose.push(c + ' ' + label); list.forEach(id => { (codes[id] = codes[id] || []).push(c); }); });
  return { codes, loose };
}
async function buildJourneyAll() {
  errors.length = 0;
  const t0 = Date.now();
  if (!USERFLOW || !USERFLOW.journey) { log('✗ ไม่มีข้อมูล journey ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  log('เตรียม component (แถบ Header ของทีมออกแบบ)…');
  await resolveAll();
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H, 600); const page = tp.page, y = tp.y, before = new Set(page.children);
  await figma.setCurrentPageAsync(page);
  const screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0 && !/ · mobile$/.test(n.name));
  log('วางบนหน้า "' + page.name + '" ' + (tp.limit != null ? 'ในช่องว่างด้านบน ต่อลงมาจากชุดก่อน' : 'ต่อใต้ของเดิม') + ' (y=' + Math.round(y) + ') · จอ desktop บนหน้านี้ ' + screens.length + ' จอ (ใช้ทำภาพย่อ)');
  const frameFor = (code) => screens.find(f => f.name.indexOf(PLUGIN.prefix + ' / ' + code + ' · ') === 0) || null;   // ชุดล่าสุดอยู่บนสุดของแผง Layers
  const r = await buildJourney(page, PLUGIN.prefix, y, { codes: journeyCodes, frameFor });
  if (tp.limit != null) liftAbove(page, before, tp.limit);
  log('');
  log('journey: ผัง ' + r.made + ' scenario · ลูกศรเชื่อม ' + r.links + ' เส้น · ภาพย่อจอ ' + r.thumbs + '/' + r.slots + ' กล่อง' + (r.thumbs < r.slots ? ' (กล่องที่ไม่มีภาพ = ยังไม่มีจอนั้นบนหน้า — กดสร้าง Desktop ก่อนแล้วกดปุ่มนี้ใหม่)' : '') + ' · กว้าง ' + Math.round(r.w) + ' px');
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· สลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด');
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
  const first = page.children.find(n => n.name.indexOf(PLUGIN.prefix + ' · Journey') === 0); if (first) figma.viewport.scrollAndZoomIntoView([first]);
}

/* ---------- ลบลิงก์กดต่อจอออกจากหน้า (2 พ.ย. 2569 เจ้าของงาน "ที่กดแล้วไปหน้าต่อไป กินทรัพยากรเยอะ เอาออก") ----------
   ลบเฉพาะที่ปลั๊กอินเคยผูก: ON_CLICK ที่ไปจอ "MT / …" หรือ Back · interaction อื่นบน component (เช่น hover ของไลบรารี) และลิงก์ไปที่อื่นคงไว้ · flow starting point ของจอเหล่านี้ลบด้วย */
async function clearPrototype(page) {
  const P = PLUGIN.prefix + ' / ';
  const screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(P) === 0);
  if (!screens.length) { log('ไม่พบเฟรมจอ "' + P + '…" บนหน้า "' + page.name.trim() + '"'); return; }
  const ids = new Set(screens.map(f => f.id));
  const ours = (r) => r.trigger && r.trigger.type === 'ON_CLICK' && (r.actions || []).length > 0 && r.actions.every(a => a && (a.type === 'BACK' || (a.type === 'NODE' && ids.has(a.destinationId))));
  let links = 0, nodes = 0;
  for (const f of screens) for (const n of f.findAll(x => x.type === 'INSTANCE' && x.reactions && x.reactions.length)) {
    const keep = n.reactions.filter(r => !ours(r));
    if (keep.length === n.reactions.length) continue;
    try { const gone = n.reactions.length - keep.length; await n.setReactionsAsync(keep); links += gone; nodes++; } catch (e) { warn('ลบลิงก์ ' + f.name, e); }
  }
  const starts = page.flowStartingPoints || [], left = starts.filter(x => !ids.has(x.nodeId));
  page.flowStartingPoints = left;
  log('✓ ลบลิงก์กดต่อจอแล้ว ' + links + ' ลิงก์ บน ' + nodes + ' ชิ้น · flow starting point ' + (starts.length - left.length) + ' จุด · จาก ' + screens.length + ' จอ');
}

/* ---------- เลือกสร้างทีละส่วนหรือทั้งหมดบนหน้า Maintainance (30 ต.ค. 2569 เจ้าของงานเลือก "ทุกอย่างอยู่ใน Figma") ----------
   parts: desktop (userflow + จอ desktop) · mobile · journey · storymap · usecase — เรียงตามลำดับนี้ ต่อใต้ของเดิมทุกส่วน */
/* ตาราง scenario (เจ้าของงาน 2 พ.ย. 2569 "อยากให้ทำตาราง เขียนใน figma") — ช่วงงาน/ผู้ทำจากตารางภาพรวม (หัวข้อ 0) ของ userflow · บล็อก/จำนวนจอจาก GROUPS
   เรียงตามลำดับงานจริง · ท้ายตารางมีกลุ่ม scenario ที่ตัดออก · สถานะรีวิว = ที่ไล่กับเจ้าของงานแล้วในรอบ 2 พ.ย. */
const SCEN_SEQ = ['S1', 'S2', 'S19', 'S20', 'S21', 'S22', 'S4', 'S6', 'S9', 'S7', 'S8', 'S10', 'S23', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18'];
const SCEN_REVIEW = { S1: 'ยึดเป็นแบบหลัก 2 พ.ย.', S2: 'รีวิวแล้ว 2 พ.ย.', S22: 'ใหม่ · รีวิวแล้ว 2 พ.ย.', S4: 'ใหม่ · รีวิวแล้ว 2 พ.ย.', S21: 'ปรับตาม S1 2 พ.ย.', S19: 'ปรับตาม S1 2 พ.ย.',
  S6: 'ปรับตามเจ้าของงาน 3 พ.ย. · รอรีวิวจอ', S7: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S8: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S9: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S10: 'แยกมุมผู้รับจ้างไป S23 4 พ.ย. · รอรีวิวจอ', S23: 'ใหม่ 4 พ.ย. · ปรับตามรีวิว (เพิ่ม แก้ไข ลบ อะไหล่ · ไฟล์)', S11: 'เขียนใหม่ 3 พ.ย. · รอรีวิวจอ', S12: 'ปรับตามรีวิว 4 พ.ย.', S18: 'ยังไม่ออกแบบ (เจ้าของงาน 4 พ.ย.)' };   // 4 พ.ย. 2569: ทำตามที่เจ้าของงานสั่งแล้ว แต่ยังไม่ได้ไล่จอด้วยกัน
const SCEN_UPDATED = '4 พ.ย. 2569';   // วันที่ข้อมูลในตาราง scenario ล่าสุด — แก้ SCEN_REVIEW แล้วเปลี่ยนวันนี้ด้วย (ขึ้นที่หัวตาราง)
const SCEN_CUT = [['S3', 'ผพจ. ออกเลขงานและจัดซื้ออะไหล่', 'ตัดออก 2 พ.ย.'], ['S5', 'กบค. เบิกอะไหล่ผ่านระบบจองอะไหล่', 'รวมเข้า S4 2 พ.ย.']];
const SCEN_COLS = [['scenario', 110], ['บล็อก', 90], ['ชื่อ', 600], ['ผู้ทำ', 300], ['จอ', 90], ['สถานะรีวิว', 260]];
function scenData() {
  const sec = DOCS.scenarios.sections.find(s => /^0\./.test(s.h)) || { rows: [] };
  const info = {}; sec.rows.forEach(r => { info[r[0]] = r; });   // # · scenario · ช่วงงาน · บทบาท · กล่องบนบอร์ด
  const rows = SCEN_SEQ.map(tag => { const g = GROUPS.find(x => x.subs[0].tag === tag), r = info[tag] || []; return [r[2] || '-', tag, g ? g.code : '-', r[1] || (g ? g.subs[0].title : ''), r[3] || '-', g ? String(g.subs[0].screens.length) : '0', SCEN_REVIEW[tag] || 'ยังไม่ได้รีวิวรอบนี้']; });
  return { head: ['ช่วงงาน', 'scenario', 'บล็อก', 'ชื่อ', 'ผู้ทำ', 'จอ', 'สถานะรีวิว'], rows: rows.concat(SCEN_CUT.map(([tag, t, st]) => ['ตัดออกแล้ว', tag, '-', t, '-', '0', st])) };
}
/* use case ตาม scenario (4 พ.ย. 2569 เจ้าของงาน "ทำเป็นตาราง usecase ให้ด้วยก็ดีว่า scen นี้มี usecase อะไรบ้าง") — กลุ่มละ scenario เรียงตาม SCEN_SEQ แบบตาราง scenario
   use case ที่ใช้ร่วมหลาย scenario (เช่น "S10 · S23") ขึ้นทุกกลุ่ม · ไม่อยู่ใน scenario ไหน รวมกลุ่มท้าย · scenario ที่ยังไม่มี use case แสดงแถว "ยังไม่มี use case" */
const UCS_COLS = [['รหัส', 130], ['บทบาท', 220], ['use case', 620], ['ผ่านเมื่อ', 480], ['สถานะใน flow', 160], ['หมายเหตุ', 340]];
function ucByScen() {
  const h = DOCS.usecase.head, U = (r, k) => r[h.indexOf(k)] || '', tags = (r) => U(r, 'scenario').split(/\s*·\s*/).filter(t => /^S\d+$/.test(t));
  const sec = DOCS.scenarios.sections.find(x => /^0\./.test(x.h)) || { rows: [] }, info = {}; sec.rows.forEach(r => { info[r[0]] = r; });
  const name = (t) => t + ' ' + ((info[t] || [])[1] || ((GROUPS.find(g => g.subs[0].tag === t) || { subs: [{ title: '' }] }).subs[0].title));
  const out = [], pick = (g, r) => [g, U(r, 'รหัส'), U(r, 'บทบาท'), U(r, 'use case'), U(r, 'ผ่านเมื่อ'), U(r, 'สถานะใน flow'), U(r, 'หมายเหตุ')];
  for (const t of SCEN_SEQ) { const mine = DOCS.usecase.rows.filter(r => tags(r).indexOf(t) >= 0); if (mine.length) mine.forEach(r => out.push(pick(name(t), r))); else out.push([name(t), '-', '-', 'ยังไม่มี use case', '', '', '']); }
  DOCS.usecase.rows.filter(r => !tags(r).length).forEach(r => out.push(pick('ยังไม่อยู่ใน scenario ไหน', r)));
  return { head: ['scenario', 'รหัส', 'บทบาท', 'use case', 'ผ่านเมื่อ', 'สถานะใน flow', 'หมายเหตุ'], rows: out };
}
const UC_COLS = [['รหัส', 130], ['scenario', 100], ['บทบาท', 200], ['use case', 460], ['ผ่านเมื่อ', 420], ['JO', 90], ['สถานะใน flow', 160], ['หมายเหตุ', 320]];
async function buildDocs(o) {
  const parts = (o.parts && o.parts.length) ? o.parts : ['storymap', 'usecase'];
  const devs = [parts.indexOf('desktop') >= 0 ? false : null, parts.indexOf('mobile') >= 0 ? true : null].filter(x => x !== null);
  log('สร้าง ' + parts.length + ' ส่วน: ' + parts.join(' · '));
  if (devs.length) await buildSet(SCENARIOS, GROUPS, 'scenario', devs);
  if (parts.indexOf('journey') >= 0) await buildJourneyAll();
  const docParts = parts.filter(p => p === 'storymap' || p === 'usecase' || p === 'scenarios' || p === 'ucscen');
  if (!docParts.length) return;
  if (!DOCS) { log('✗ ไม่มีข้อมูล story map / use case ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H); const page = tp.page;
  await figma.setCurrentPageAsync(page);
  const made = [];
  for (const k of docParts) {
    try {
      const f = k === 'storymap' ? await storyMapBoard(PLUGIN.prefix, DOCS.storymap)
        : k === 'ucscen' ? await tableBoard(PLUGIN.prefix, 'use case ตาม scenario', 'Use case ตาม scenario บำรุงรักษาตามวาระ · อัปเดต ' + SCEN_UPDATED, DOCS.usecase.src, ucByScen(), 'scenario', UCS_COLS)
        : k === 'scenarios' ? await tableBoard(PLUGIN.prefix, 'scenario', 'Scenario บำรุงรักษาตามวาระ · ' + SCEN_SEQ.length + ' scenario · อัปเดต ' + SCEN_UPDATED, DOCS.scenarios.src, scenData(), 'ช่วงงาน', SCEN_COLS)
        : await tableBoard(PLUGIN.prefix, 'use case', 'Use case บำรุงรักษาตามวาระ', DOCS.usecase.src, DOCS.usecase, 'ช่วงงาน', UC_COLS);
      putBelow(page, f); made.push(f);
      log('✓ ' + (k === 'storymap' ? 'user story mapping ' + DOCS.storymap.sections.length + ' ช่วงงาน' : k === 'scenarios' ? 'ตาราง scenario ' + scenData().rows.length + ' แถว' : k === 'ucscen' ? 'use case ตาม scenario ' + SCEN_SEQ.length + ' scenario' : 'use case ' + DOCS.usecase.rows.length + ' ข้อ') + ' (จาก ' + DOCS[k === 'ucscen' ? 'usecase' : k].src + ')');
    } catch (e) { warn(k, e); dropCreated(page); }
  }
  if (made.length) {   // 30 ต.ค. 2569 เจ้าของงาน "ไปสร้างอยู่ที่หน้าไหนหาไม่เจอ" ⇒ บอกชื่อหน้า + ตำแหน่ง แล้วเลือกกรอบให้ด้วย
    page.selection = made;
    figma.viewport.scrollAndZoomIntoView(made);
    log('→ อยู่บนหน้า "' + page.name.trim() + '"' + (tp.fresh ? ' (สร้างหน้าใหม่ เพราะไม่มีหน้าชื่อ Maintainance)' : '') + ' ล่างสุดของหน้า ' + made.map(f => '"' + f.name + '" (x ' + Math.round(f.x) + ', y ' + Math.round(f.y) + ')').join(' · ') + ' · เลือกไว้ให้แล้ว กด Shift+2 เพื่อซูมไปที่กรอบ หรือค้นชื่อใน Layers');
  }
}

figma.ui.onmessage = async (msg) => {
  try {
    const o = { devices: msg.devices, pick: msg.pick };
    if (msg.type === 'build') await build(o);
    if (msg.type === 'build-desktop') await buildDesktop();
    if (msg.type === 'build-mobile') await buildMobile();
    if (msg.type === 'build-pick') await buildPick(o);
    if (msg.type === 'build-journey') await buildJourneyAll();
    if (msg.type === 'export-shots') await exportShots('flow-maintainance');
    if (msg.type === 'move-latest') await moveLatest();
    if (msg.type === 'clear-proto') { const tp = await namedPage(PAGE_NAMES); await figma.setCurrentPageAsync(tp.page); await clearPrototype(tp.page); }
    if (msg.type === 'build-docs') await buildDocs({ parts: msg.parts });   // 30 ต.ค. 2569 ติ๊กเลือกส่วน / สร้างทั้งหมด   // 30 ต.ค. 2569 ส่งภาพจอบนหน้านี้ไป FigJam
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]), codes: GROUPS.map(g => g.code) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก"
