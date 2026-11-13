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
     + flowchart กิจกรรมของ scenario นั้นซ้ายสุดของบล็อก (6 พ.ย. 2569 "อยากให้ flowchart คู่กับ ui ไม่ใช่ user flow" · ไม่มี ACTIVITY ฝังมา = กลับไปใช้ผัง userflow ที่ FLOW_NODES ผูกจอกับกล่อง) · ทุกปุ่มวางบนหน้า "Maintainance" ต่อใต้ของเดิม
   ============================================================================ */

const PLUGIN = { prefix: 'MT', page: 'Maintainance', menu: 'บำรุงรักษาตามวาระ', searchHint: 'ค้นหาเลขที่ MR, ชื่อแผน' };   // toast ขวาบนเสมอ — notify() ใน core (5 พ.ย. 2569)

/* ---------- component ที่ใช้ — ขาดตัวไหนหยุด (ไลบรารี) · NESTED = ชิ้นซ้อนใน component อื่น · LOCAL_OPTIONAL = ของไฟล์ Maintain-D ไม่มีก็ใช้แบบสำรอง ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Table header',
  'Table pagination', 'Text input', 'Input dropdown', 'Input dropdown with badges', 'Text area', 'Number input', 'File upload', 'Input label', 'List with checkbox', 'Alert', 'Pill outline',
  'Primary button', 'Secondary button', 'Secondary danger button', 'Tertiary button', 'Dropdown list', 'Background overlay', 'Modal', 'Notification',
  'Empty state/Data empty', 'Radio text card', 'Images', 'Date picker', 'Checkbox with description',
  'add-24-300-round', 'filter_list-24-400-round', 'more_horiz-20-400-round', 'delete-24-300-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round',
  'cloud_upload-24-300-round', 'stylus-24-300-round', 'check-24-300-round', 'quick_reference_all-24-300-round', 'description-24-300-round', 'Dropdown menu',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header', 'Modal footer', 'Tabs', 'Notification card', 'Horizontal radio groups', 'Checkbox text card',
  'Side panel header', 'Side panel footer', 'Empty state/Search not found',   // 12 พ.ย. 2569 ถอด Rating · Featured icon (S27 แบบประเมินความพึงพอใจย้ายไป satisfaction-plugin R105)
  'Progress steps', 'Mobile progress steps'];   // S10 ขั้นตอนบำรุงรักษา 2 ขั้น (รีวิว 5 พ.ย. 2569 · R70) ตาม 5.2 Vehicle Management ของ UI Release#2 · S24 แผงตัวกรอง + ไม่พบข้อมูล ตาม Vehicle list ของ UI Release#2 (4 พ.ย. 2569)
const NESTED = ['_Dropdown menu item', 'Nav button', 'Tab item', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Primary danger button',
  '_Content item base', '_File upload item base', 'List with checkbox item', 'List header item', 'Checkbox', 'Badge outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Radio button', '_Notification item base', 'Status',
  'star-24-300-round'];   // 12 พ.ย. 2569 ถอด _Rating star base และไอคอนหัวด้าน call groups search_check ของ S27 (ย้ายไป satisfaction-plugin R105) · star = ไอคอนนำปุ่ม "ประเมินความพึงพอใจ" ของ S13 L.5 (12 พ.ย. 2569 รอบ 2 ตามเว็บ) นำเข้าไม่ได้ = ปุ่มไม่มีไอคอน
const LOCAL_OPTIONAL = ['RepairFeedback', 'ReturnPart', 'PartRequestStepPanel', 'PartsInventoryPanel', 'RequestedPartsPanel', 'Spare Part Card Item', 'IncidentPhotoGallery', 'VehicleAndReporterInfo', 'SummaryRequestedParts',
  'ReceiptChecklist', 'HandoverSignature', 'Modal Signature', 'InspectionChecklist',   // รับรถ / ลงนาม / ตรวจสภาพ ของงานซ่อม (S10 · 3 พ.ย. 2569) ไม่มีในไฟล์ → แบบสำรองจากไลบรารี
  'Request Repair/Budget',   // งบที่ตัด + ศูนย์ต้นทุน ของงานซ่อม (หน้า Local Component ของไฟล์ Maintain-D) — S10 Step 2 (รีวิว 5 พ.ย. 2569 · R72) ไม่มีในไฟล์ → แบบสำรองจากไลบรารี
  'Device Type', 'Component 1', 'Header'];   // Device Type = ป้าย Device/Desktop/Mobile ชุดเดียวกับ Overhaul (22 ต.ค. 2569 · Component 1 = ตัวสำรองชุดเก่า) · Header = แถบรหัส flow ของทีมออกแบบ (ไลบรารีอื่น หาจาก instance ในไฟล์)
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี (ดัมป์ 19 ต.ค. 2569) — ตัวที่ core ยังไม่มี */
/* รูปแบบบรรทัดต้องเหมือน KEYS ใน core ("ชื่อ": ["key", set]) — test harness อ่าน key ด้วย regex จากซอร์ส */
Object.assign(KEYS, {
  "Input dropdown with badges": ["705d2a75bc12121c2c1c0a9737327fbc1ea60696", true],
  "star-24-300-round": ["ecf8821fb00ba65575f6814101291f6166e00aa6", false],
  "Images": ["39fe2574c3dcfeebe3eded7a76fecbc04ee41ef7", true],
  "Radio text card": ["e4510738f989bb24dbfb70fe6acfbf5705dcd60b", true],
  "Radio button": ["b29b98831c56216e005bb1c403e3f833d5e0f1cf", true],
  "Modal footer": ["78e84b8dfd520b686df45c5219feaf5f64a4bcec", true],
  "description-24-300-round": ["e42bf9bc8971c1449df0a602f3beca96cd3e5b77", false],   // ไอคอนเมนู "ผลการทดสอบน้ำมันไฮดรอลิก" (3 พ.ย. 2569)
  "Horizontal radio groups": ["50c917f3a90caf41227efab4841d0ce003c468dc", false],   // key ของไฟล์ Component (ดัมป์ 19 ต.ค.) · 11d953b1… ที่ UI Release#2 ใช้เป็นไลบรารีอื่น นำเข้าไม่ได้
  "Notification card": ["8b00e80ca7ead162e5de06e8cc261b86d5904c32", false],
  "_Notification item base": ["5e4101e154462cac0b912c28d0499b61f84c3001", false],
  "Status": ["65871480cb419a27224a15825374bc1486ab34d6", true],
  "Checkbox with description": ["dfc323f6bb605f586c4928ecb08c77acfb241f53", false],
  "Checkbox text card": ["a29fe414b23f6ac84089cc837b8f2ff06ac561a3", true],
  "Step circles / 4 steps": ["5d90e00c1796d10ae8a19989403f503e0d54bf87", true],   // S10 มือถือ วงขั้นตอน 1/2 2/2 แบบ Check Expense Modal หน้า 5.14 - 5.15 Cost & Expense Check ของ UI Release#2 (5 พ.ย. 2569 · R70)
  "account_balance-24-300-round": ["48c0cb9ff8ec9c4c6c9a2be469bcd54a12742890", false],   // ไอคอนนำช่องศูนย์ต้นทุน แบบสำรองของ Request Repair/Budget (ตัวเดียวกับ Overhaul R18 · 5 พ.ย. 2569 · R72)
  "Metric item": ["5e82119aab7dc5401c7f5940b7a500339ace506a", true],   // S4 แดชบอร์ดอะไหล่ (6 พ.ย. 2569) — key เดียวกับแดชบอร์ด Overhaul (R22)
  "download-24-300-round": ["336f0dff014c26316e0fa56959bc75f09f71531d", false],   // S4 ปุ่มส่งออก — key เดียวกับ S18 ของ Overhaul (R32)
  "swap_driving_apps_wheel-24-300-round": ["d431c64461da6f292b3989371704fd336e1f719b", false],   // S25 เมนู/ปุ่ม "ย้ายไปไตรมาสอื่น" (ไฟล์ Component หน้าไอคอน · UI Release#2 ปุ่ม "โอนย้ายสังกัด" ใช้ swap_driving_apps)
  "car_repair-24-300-round": ["f87c5a858bf895fee867a3af065e82f75f620d9e", false],   // S25 เมนู "ดำเนินการบำรุงรักษา" (10 พ.ย. 2569) — ไฟล์ Component หน้า Icons
  "no_crash-24-300-round": ["3d940da7d6274fd75d090c7a9155a482de01a923", false],   // แดชบอร์ดแบบ VMS+ (12 พ.ย. 2569 · R106) การ์ดตัวเลขยานพาหนะปกติ — ไฟล์ Component หน้า Icons
  "event_busy-24-300-round": ["d7e88cfc5a57d608dafa7d93a8e7f6532cf35096", false],   // แดชบอร์ดแบบ VMS+ (R106) เรื่องที่ควรดู · เลยกำหนด — ไฟล์ Component หน้า Icons
  /* S24 แท็บข้อมูลยานพาหนะแบบ Vehicle info (12 พ.ย. 2569 · R107) — การ์ดของไลบรารี (Component หน้า Cards / Badge) + ไอคอนแถวการใช้งานล่าสุด */
  "Card item row": ["5511f46face9e65e08d274bbf7c9d73489124362", true],
  "Card item base": ["68f4c18df873c10da2f8bfac894446e5c2bbc731", true],
  "Badge outline with indicator": ["95e26f4acaeb8a30653090c1a8c5d53e915c2996", true],
  "local_gas_station-24-300-round-filled": ["6676743d43062ce200124ade93829519500d5004", false],   // ไฟล์ Component หน้า Icons (Last usage ของ UI Release#2 ใช้ไอคอนชื่อเดียวกัน)
  "schedule-24-300-round": ["be1da86a82307fa8d337f57c38fbc1b2f3e882d6", false],   // ชั่วโมงเครื่องจักรสะสม — ไฟล์ Component ไม่มี timer (เว็บใช้ timer) ⇒ ใช้ schedule ของหน้า Icons
  "local_car_wash-24-300-round": ["70479232ec906f6477857a48fed92bdf9b6bf771", false],   // ไลบรารีไอคอนที่ UI Release#2 อ้าง (Last usage) · ไฟล์ Component ไม่มี ⇒ นำเข้าไม่ได้ = แถวไม่มีไอคอน
  "local_parking-24-fill-300-round": ["31f53c49f2a25c3ca3b7ac06cbb6a9442249b2c6", false],   // ไลบรารีไอคอนที่ทั้งไฟล์ Component (หน้า Modals) และ UI Release#2 อ้าง · นำเข้าไม่ได้ = แถวไม่มีไอคอน
  "calendar_month-24-300-round": ["afb81bef65f96089512284d42edd7bb46646a465", false]   // ไอคอนนำช่องวันดำเนินการ (6 พ.ย. 2569 · R83) — ไฟล์ Component หน้า Icons · ช่องช่วงวันที่ Date range picker / Trip date ของ UI Release#2 หน้า 5.2 Vehicle Management มีไอคอนนำ
});
NEEDED.push('Featured icon', 'no_crash-24-300-round', 'event_busy-24-300-round');   // แดชบอร์ดแบบ VMS+ S4 S24 (R106 · 12 พ.ย. 2569) Featured icon ของหัวแดชบอร์ด/การ์ดกราฟ/เรื่องที่ควรดู (ถอดจาก DIRECT ตอนย้าย S27 ออก R105 — แดชบอร์ดใช้ต่อ) + ไอคอน — ไอคอนไม่มีในไฟล์ก็ใช้ไอคอนตั้งต้นของ Featured icon
NESTED_ONLY.add('no_crash-24-300-round'); NESTED_ONLY.add('event_busy-24-300-round');
NEEDED.push('Metric item', 'download-24-300-round', 'swap_driving_apps_wheel-24-300-round', 'car_repair-24-300-round', 'Step circles / 4 steps', 'account_balance-24-300-round', 'calendar_month-24-300-round');   // S25 (5 พ.ย. 2569) ไอคอนย้ายไปไตรมาสอื่น · 6 พ.ย. 2569 ไอคอนช่องวันดำเนินการ
NEEDED.push('Card item row', 'Card item base', 'Badge outline with indicator', 'local_gas_station-24-300-round-filled', 'schedule-24-300-round', 'local_car_wash-24-300-round', 'local_parking-24-fill-300-round');   // S24 แท็บข้อมูลยานพาหนะ (12 พ.ย. 2569 · R107) — Fleet card · Last usage · การ์ดเครื่องมือกล ประกอบจาก Card item row/base · Badge outline with indicator
['Card item base', 'local_gas_station-24-300-round-filled', 'schedule-24-300-round', 'local_car_wash-24-300-round', 'local_parking-24-fill-300-round'].forEach(n => NESTED_ONLY.add(n));   // ชิ้นซ้อน/ไอคอน — นำเข้าไม่ได้ก็ใช้ตัวที่ซ้อนใน Card item row · แถวไม่มีไอคอน

/* ---------- ข้อมูลตัวอย่าง (ยกชื่อรถ/หน่วยงาน/จังหวัดจาก maintainance-yearly/mock-yearly.js — ค่าสมมติทั้งหมด) ---------- */
const PST = { review: ['รออนุมัติ', 'Warning'],   // 30 ต.ค. 2569: ส่งอนุมัติทั่วไป ไม่ผ่าน ผพจ.
  returned: ['ส่งกลับแก้ไข', 'Error'], approved: ['อนุมัติแล้ว', 'Brand'], active: ['ดำเนินการ', 'Info'],
  closed: ['ปิดงานแล้ว', 'Gray'] };   // รอหัวหน้าตรวจสอบ · ประวัติผ่านแล้ว เอาออก 10 พ.ย. 2569 (S16 S17 ตัด · รับทราบครบทุกคันแล้วแผนปิดงานเอง เสนอ)
/* 22 ต.ค. 2569 เจ้าของงาน: ไม่ทำเรื่องยื่นของบ/ทบทวนแผน · เริ่มที่สร้างแผน · เลือกรถตามภาค + ประเภทรถ
   30 ต.ค. 2569 เจ้าของงาน: แผนปี — เลือกปีงบประมาณได้ทุกปี แล้วจัดรถลงไตรมาส · ส่งอนุมัติทั่วไป (ไม่ผ่าน ผพจ.) · ไม่มีเลขงานในระบบ (S3 พักไว้)
   ⇒ ช่องที่ 0 = เลขที่ MR (Maintenance Request) รูปแบบจริงที่เจ้าของงานให้ 30 ต.ค. 2569 "MRZ69000XX" = MR + เขตการไฟฟ้า (Z = สำนักงานใหญ่ ที่ตั้ง กบค.) + ปีที่เลือกตอนสร้างแผน 2 หลัก + ลำดับ 5 หลักนับต่อกันในปีนั้น (ไม่ใช่เลขงาน) · ช่องที่ 3 = ไตรมาสที่กำลังทำ (ขั้น S4 เป็นต้นไปทำรายไตรมาส) · ช่องที่ 8 = ปีงบประมาณ · ช่องที่ 9 = รถรายไตรมาส */
const PLANS = [   // เลขที่ MR · ชื่อแผน · ภาค · ไตรมาสที่กำลังทำ · จำนวนรถ · สถานะ · วันที่สร้าง · ประเภทรถ · ปีงบประมาณ · รถรายไตรมาส
  ['MRZ7000001', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 และภาค 2 ปีงบประมาณ 2570', 'ภาค 1, ภาค 2', 'ไตรมาส 1', '12', 'active', '03/10/2569', 'กระเช้าแก้ไฟ', '2570', 'ไตรมาส 1: 6 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 1'],
  ['MRZ7000002', 'บำรุงรักษารถพ่วงฉีดน้ำ ภาค 2 ปีงบประมาณ 2570', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 2', '8', 'approved', '05/10/2569', 'รถพ่วงฉีดน้ำ', '2570', 'ไตรมาส 1: 0 · ไตรมาส 2: 4 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ7000003', 'บำรุงรักษากระเช้าฮอทไลน์ ภาค 3 ปีงบประมาณ 2570', 'ภาค 3 (กลาง)', 'ไตรมาส 1', '6', 'review', '17/10/2569', 'กระเช้าฮอทไลน์', '2570', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MRZ7100001', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 4 ปีงบประมาณ 2571', 'ภาค 4 (ใต้)', 'ไตรมาส 1', '9', 'returned', '12/10/2569', 'กระเช้าแก้ไฟ', '2571', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ6900011', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 ปีงบประมาณ 2569', 'ภาค 1 (เหนือ)', 'ไตรมาส 4', '10', 'closed', '02/06/2568', 'กระเช้าแก้ไฟ', '2569', 'ไตรมาส 1: 3 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 2']];
const NEW_PLAN = ['MRZ7000004', 'บำรุงรักษายานพาหนะ กบผ. ปีงบประมาณ 2570', 'ภาค 1, ภาค 2', 'ไตรมาส 1', '10', 'review', '30/10/2569', 'กระเช้าแก้ไฟ, กระเช้าฮอทไลน์, รถพ่วงฉีดน้ำ', '2570', 'ไตรมาส 1: 3 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 2'];   // 6 พ.ย. 2569 รถทุกคันของหน่วยงานต้องอยู่ในไตรมาส ⇒ 10 คัน (CAND ทั้งหมด)
/* 6 พ.ย. 2569 เจ้าของงาน "มีกรย ที่สร้างแผนบำรุงรักษาได้ หน่วยงานที่ใช้ flow นี้ มี กกฟ1 2 และ กรย" + "กกฟ กรย สร้างแผนได้ ทำเอง ไม่เกี่ยวกับ กบค เหมือนสร้างแผนแล้วก็ดำเนินการเอง กบค แค่เห็นแผนทั้งหมด"
   ⇒ ผู้สร้างแผนและผู้ดำเนินการ = หน่วยงาน (กกฟ.1 · กกฟ.2 · กรย.) · ข้อมูลตัวอย่างเป็นแผนของ กกฟ.1
   6 พ.ย. 2569 (รอบ 2) เจ้าของงาน "กฝช ส่งให้ กบค เป็นผู้ดำเนินการ" + "กบค จะทำแผนจะมีรถของ กฝช. ด้วย"
   ⇒ กบค. สร้างแผนได้อีกหน่วยงาน (รถในแผนมีรถของ กฝซ. ด้วย) · แผนของหน่วยงานอื่น กบค. ยังดูอย่างเดียว */
/* 12 พ.ย. 2569 เจ้าของงานเลือกตามไฟล์สรุปประชุม VMS Plus (Notion "meeting 11/11/68" หัวข้อ 9 X6) — แต่ละกองของสำนักงานใหญ่สร้างแผนของตัวเอง ดึงเฉพาะยานพาหนะในความรับผิดชอบ
   ⇒ ผู้สร้างแผน = 6 กอง กบผ. กปส. กรย. กบค. กส.1 กส.2 (กกฟ.1 → กบผ. · กกฟ.2 → กปส. ลำดับเดิมไม่เลื่อน · กกฟ.1 กกฟ.2 เลิกใช้) · กบค. ยังเห็นแผนทุกหน่วยงานเหมือนเดิม */
const UNITS = ['กบผ.', 'กปส.', 'กรย.', 'กบค.', 'กส.1', 'กส.2'], CREATOR = 'นายวิชัย ทองดี (กบผ.)';
/* 9 พ.ย. 2569 เจ้าของงาน "ปรับให้มีการสร้าง ของ กรย และ กกฟ ทำ persona ของทั้ง 3 กองนนี้ โดยหน้ารวม เห็นไม่เหมือนกันคือ กกฟ1,2 และ กรย สร้างได้ และเห็นแค่ของตัวเองแต่ กบคจะเห็นของคนอื่นด้วย"
   ⇒ หน้ารายการแผนของ กกฟ.1 กกฟ.2 กรย. เห็นเฉพาะแผนของหน่วยงานตัวเอง (ownPlans) มีปุ่มสร้างแผน · กบค. เห็นแผนทุกหน่วยงาน (allPlans · บรรทัดรองเป็นหน่วยงาน)
   UNIT_PLANS = แผนจำลองเพิ่มให้ทุกหน่วยงานมีแผนของตัวเองอย่างน้อย 2 แผน · เลขที่ MR นับต่อกันทั้งระบบภายในปีงบประมาณ (Z71 ต่อจาก MRZ7100001 · Z69 ต่อจาก MRZ6900011) */
const UNIT_PLANS = [
  ['MRZ6900012', 'บำรุงรักษายานพาหนะ กบผ. ปีงบประมาณ 2569', 'ภาค 1, ภาค 2', 'ไตรมาส 4', '9', 'closed', '05/06/2568', 'กระเช้าแก้ไฟ', '2569', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ7100002', 'บำรุงรักษายานพาหนะ กปส. ปีงบประมาณ 2571', 'ภาค 3, ภาค 4', 'ไตรมาส 1', '7', 'review', '15/10/2569', 'กระเช้าฮอทไลน์, รถพ่วงฉีดน้ำ', '2571', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 1']];
const allPlans = () => PLANS.concat(UNIT_PLANS);
const ownPlans = (u) => allPlans().filter(p => PLAN_UNIT[p[0]] === u);   // หน้ารายการแผนของหน่วยงาน u เห็นเฉพาะแผนของตัวเอง
const REGIONS = ['ภาค 1 (เหนือ)', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ภาค 3 (กลาง)', 'ภาค 4 (ใต้)', 'สนง. (สำนักงานใหญ่)'];
/* 11 พ.ย. 2569 เจ้าของงาน _"แก้ s1 เรื่องตัวกรอง ให้เพิ่ม ภาค อีกหนึ่งรายการคือ สนง = สำนักงานใหญ่ โดย ภายใต้สำนักงานใหญ่จะมี กกฟ1 กกฟ2"_ (R93)
   ⇒ ตัวเลือกที่ 5 ของช่อง "ภาค" = "สนง. (สำนักงานใหญ่)" (เคาะป้ายแบบตัวย่อ + ชื่อเต็มในวงเล็บ เหมือนภาค 1–4) · เขตภายใต้ = กกฟ.1 กกฟ.2 · ชิปตัวกรอง = "สนง." (shortRegion)
   12 พ.ย. 2569 เจ้าของงานเลือกตามไฟล์สรุปประชุม VMS Plus (X3) — สำนักงานใหญ่แยกเป็นกอง กบค. กรย. กบผ. กปส. กส.1 กส.2 + สำนักงานภาค 4 ภาค ⇒ เขตภายใต้ สนง. = 6 กอง แทน กกฟ.1 กกฟ.2 */
/* เขตภายใต้ภาค (R35 · เจ้าของงาน 2 พ.ย. 2569 "ภาคเหนือ มี 3 เขต เขาก็จะเลือก ภาค แล้วจึงเลือก เขต ภายใต้ภาค แล้วถึงเห็นรถ")
   ค่าย่อและ placeholder "เลือกเขต" ตาม Input dropdown ของหน้า 5.9 EV Charging Station ใน UI Release#2 */
const DISTRICTS = { [REGIONS[0]]: ['กฟน.1', 'กฟน.2', 'กฟน.3'], [REGIONS[1]]: ['กฟฉ.1', 'กฟฉ.2', 'กฟฉ.3'], [REGIONS[2]]: ['กฟก.1', 'กฟก.2', 'กฟก.3'], [REGIONS[3]]: ['กฟต.1', 'กฟต.2', 'กฟต.3'], [REGIONS[4]]: ['กบค.', 'กรย.', 'กบผ.', 'กปส.', 'กส.1', 'กส.2'] };
const dCode = (c) => c[2].split(' ')[0];   // รหัสเขตของรถ จากหน่วยงานเจ้าของรถ
/* รถที่เข้าเงื่อนไข ภาค 2 + รถกระเช้า (ค่าสมมติ) — ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานะรถ */
const CAND = [['82-6789 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok'], ['82-1145 ขอนแก่น', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 ขอนแก่น', 'ok'],
  ['82-3302 อุดรธานี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 อุดรธานี', 'ok'], ['82-4410 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok'],
  ['83-1207 อุดรธานี', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟฉ.1 อุดรธานี', 'repair'], ['84-5521 นครราชสีมา', 'Hino FG + กระเช้า Tadano AT-146', 'กฟฉ.3 นครราชสีมา', 'ok'],
  ['85-0918 อุบลราชธานี', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟฉ.2 อุบลราชธานี', 'ok'],
  /* 5 พ.ย. 2569 เจ้าของงาน "อยากออกแบบหน้าสร้างแผนให้ เห็นรถหมายทุกคัน เหมือนหน้ารวมที่มีรถทุกคันแล้ว มีค้นหา มี กรอง" ⇒ ตารางรถทุกคัน (ไม่ใช่เฉพาะภาค 2) + รถเครน ให้ตัวกรองภาคและประเภทรถมีผล · ต่อท้าย ลำดับเดิมไม่เลื่อน */
  ['80-5738 น่าน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.2 น่าน', 'repair'], ['81-2210 เชียงใหม่', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.1 เชียงใหม่', 'ok'],
  ['82-9012 ขอนแก่น', 'Hino FM + ถังฉีดน้ำ 6,000 ลิตร', 'กฟฉ.2 ขอนแก่น', 'ok']];   // 6 พ.ย. 2569 เดิมรถเครน · ประเภทตามโค้ดจริงไม่มีรถเครน
/* ภาค · ประเภทรถ ของรถ (จากรหัสเขตและยี่ห้อ/รุ่น · ค่าสมมติ) — ตัวกรองรายไตรมาสของ S1 และสรุปภาค/ประเภทรถจากรถที่อยู่ในแผนจริง (เจ้าของงาน 5 พ.ย. 2569) */
const REG_OF = { 'กฟน': 0, 'กฟฉ': 1, 'กฟก': 2, 'กฟต': 3, 'กบค.': 4, 'กรย.': 4, 'กบผ.': 4, 'กปส.': 4, 'กส': 4 };   // กองของ สนง. (12 พ.ย. 2569 X3)
const regionOf = (c) => REGIONS[REG_OF[c[2].split(' ')[0].replace(/\.\d+$/, '')]];
/* ประเภทยานพาหนะ (ข้อมูลจาก API) — 6 พ.ย. 2569 เจ้าของงานเลือกใช้ชื่อตามโค้ดจริง resolveInspectionCarType ของ maintain-d-fe (กระเช้าฮอทไลน์ · กระเช้าแก้ไฟ · รถพ่วงฉีดน้ำ)
   รีวิว S6 "ย้ายประเภท มาไว้ในคอลัมม์ เช่นกระเช้าแก้ไฟ รถฉีดน้ำ เป็นต้น" · ค่าสมมติจากยี่ห้อ/รุ่น: ถังฉีดน้ำ = รถพ่วงฉีดน้ำ · Tadano = กระเช้าฮอทไลน์ · ที่เหลือ = กระเช้าแก้ไฟ */
const VTYPES = ['กระเช้าฮอทไลน์', 'กระเช้าแก้ไฟ', 'รถพ่วงฉีดน้ำ'];
const typeOf = (c) => /ฉีดน้ำ/.test(c[1]) ? VTYPES[2] : /Tadano/.test(c[1]) ? VTYPES[0] : VTYPES[1];
const shortRegion = (r) => r.split(' (')[0];   // "ภาค 2 (ตะวันออกเฉียงเหนือ)" → "ภาค 2"
const uniq = (a) => [...new Set(a)];
const P = PLANS[0];
/* 6 พ.ย. 2569 รีวิว S6 "ภาค เปลี่ยน หน่วยงาน" + "ย้ายประเภท มาไว้ในคอลัมม์" (เจ้าของงานยืนยัน) ⇒ กล่องรายละเอียดแผนทุกหน้า ช่องภาคเป็นหน่วยงานเจ้าของแผน · ประเภทยานพาหนะไปเป็นคอลัมน์รายคันในตารางยานพาหนะ */
const PLAN_KV = [['ชื่อแผน', P[1]], ['ปีงบประมาณ', P[8]], ['หน่วยงาน', UNITS[0]], ['ไตรมาส', P[3]], ['จำนวนยานพาหนะ', P[4] + ' คัน'], ['เลขที่ MR', P[0]], ['ผู้สร้างแผน', CREATOR], ['วันที่สร้าง', P[6]], ['อนุมัติเมื่อ', '08/10/2569']];
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
const VEH_KV = [['ทะเบียน', V[0]], ['ยี่ห้อ/รุ่น', V[1]], ['ประเภท', typeOf(V)], ['หน่วยงานเจ้าของยานพาหนะ', V[2]], ['เลขไมล์สะสม', '182,400 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,120 ชม.'], ['แผน', P[0]], ['แผนเดินทาง', 'ตรวจยานพาหนะ ขอนแก่น อุดรธานี ลำปาง · 03–07/11/2569']];
const PSTAT = { ok: ['พร้อม', 'Success'], short: ['ขาด', 'Error'], reserved: ['จองแล้ว', 'Info'] };
/* จำนวนตามแผน = ของไตรมาส 1 ในแผนตัวอย่าง (S4 ขึ้นไปทำรายไตรมาส) รถ 6 คัน · เปลี่ยนน้ำมัน 2 คัน · ไส้กรองเชื้อเพลิง 2 คัน · 2 พ.ย. 2569 ตัดการนำรถออกที่ S4 แล้ว */
const PARTS = [   // รายการ · รหัส · หมวด · จำนวนตามแผน · หน่วย · คงเหลือ · สถานะเมื่อจอง
  ['น้ำมันไฮดรอลิก ISO VG 46', 'OL-0011', 'น้ำมัน', '60', 'ลิตร', '420', 'ok'],
  ['ไส้กรองไฮดรอลิก', 'FL-0022', 'ไส้กรอง', '12', 'ชิ้น', '3', 'short'],
  ['ไส้กรองน้ำมันเครื่อง', 'FL-0031', 'ไส้กรอง', '12', 'ชิ้น', '40', 'ok'],
  ['ไส้กรองอากาศ', 'FL-0040', 'ไส้กรอง', '12', 'ชิ้น', '60', 'ok'],
  ['ไส้กรองเชื้อเพลิง', 'FL-0052', 'ไส้กรอง', '4', 'ชิ้น', '1', 'short']];
/* อะไหล่แบบงานซ่อม (22 ต.ค. 2569 "ปรับอะไหล่ให้สอดคล้องกับงานซ่อม"): คลัง 2 แบบ Smart Inventory / คลังสำรอง · ราคาต่อหน่วย (ค่าสมมติ) ·
   จำนวนตามแผนเกินคงเหลือ = ซื้อเพิ่มส่วนต่าง + เลือกผู้จัดซื้อ · ผู้จัดซื้อในบำรุงรักษา = Smart Inventory หรือ ผพจ. (S3) แทน "กบค." ของงานซ่อม — รอเคาะ */
const WH = ['Smart Inventory', 'Smart Inventory', 'Smart Inventory', 'คลังสำรอง', 'คลังสำรอง'];
const PRICE = [120, 680, 250, 420, 350];
const BUYER = ['Smart Inventory', 'ผพจ.'];
const BUYER_OF = { 1: 0, 4: 1 };   // อะไหล่ที่ขาด → ผู้จัดซื้อที่เลือกไว้ (ไส้กรองไฮดรอลิก = Smart Inventory · ไส้กรองเชื้อเพลิง = ผพจ.)
const baht = (n) => n.toLocaleString('en-US') + ' บาท';
const shortOf = (i) => Math.max(0, +PARTS[i][3] - +PARTS[i][5]);
const TST = { sent: ['ส่งแจ้งแล้ว', 'Info'], done: ['ดำเนินการแล้ว', 'Success'], review: ['รออนุมัติ', 'Warning'], approved: ['อนุมัติแล้ว', 'Success'], returned: ['ส่งกลับแก้ไข', 'Error'] };   // 3 พ.ย. 2569 แผนเดินทางต้องอนุมัติ (S7) · ชื่อตามสถานะแผน S2
/* 9 พ.ย. 2569 เจ้าของงาน "พนักงานสามารถเพิ่มได้ไม่จำกัด และ เป็น 1 คน 1 แถว เป็นชื่อ สกุล ตำแหน่ง เบอร์โทร" ⇒ แถวพนักงานที่เดินทาง: ชื่อ-สกุล (ค้นหา) · ตำแหน่ง (Readonly จากข้อมูลพนักงาน) · เบอร์โทร · ค่าสมมติ */
const STAFF_INFO = { 'นายวิชัย ทองดี': ['วศ.8', '081-472-1180'], 'นางสาวกนกวรรณ ใจมั่น': ['ชก.6', '089-221-4407'], 'นายสมชาย พูลสุข': ['ชก.5', '086-530-2291'] };
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
/* วันดำเนินการรายคัน (6 พ.ย. 2569 รีวิว S6 "เพิ่ม คอลัมม์ "วันดำเนินการ" โดยเลือกได้ไม่เกิน range ของแผนที่กำหนดมาเท่านั้น" + "เลือกซ้ำวันกันได้ เลือกเป็นช่วงวัน" + "เพิ่มการเลือกวันดำเนิน จาก icon แก้ไข ได้ด้วย")
   ค่าเริ่มต้น = ช่วงวันเดินทางทั้งช่วง (แบบสถานที่บำรุงรักษา "ค่าเริ่มต้น สำนักงานที่ยานพาหนะอยู่") · แก้ใน popup ไอคอนแก้ไข · works = { ลำดับรถ: [ตั้งแต่, ถึง] } · หลายคันซ้ำวันกันได้ */
const tripWork = (i, t) => { const w = ((t && t.works) || {})[i]; return w ? w[0] + ' – ' + w[1] : t ? t.d1 + ' – ' + t.d2 : '—'; };
const tripRange = (t) => t && (t.vendor || t.hire) ? 'ช่วงวันทำงาน' : 'ช่วงวันเดินทาง';   // แผนจ้าง (S9) ใช้ช่วงวันทำงานแทนช่วงวันเดินทาง
const tripWorkCell = (i, t) => ({ text: tripWork(i, t), sub: ((t && t.works) || {})[i] ? 'แก้จาก' + tripRange(t) : 'ค่าเริ่มต้น ' + tripRange(t) });
const TRIP_WORKS = { 0: ['03/11/2569', '04/11/2569'], 1: ['03/11/2569', '04/11/2569'], 4: ['05/11/2569', '06/11/2569'] };   // 82-6789 กับ 82-1145 วันเดียวกัน (เลือกซ้ำวันได้) · ค่าสมมติ
/* อะไหล่ของแผนเดินทาง (6 พ.ย. 2569 รีวิว S6 "เพิ่ม section ของอะใหล่ ทริปนี้") — รวมจากยานพาหนะในใบ · ตาราง QPART_COLS ชุดเดียวกับทุกหน้า (R81) · รายการที่จำนวน 0 ไม่แสดง
   ค่าสมมติรายคันของไตรมาส 1 (9 พ.ย. 2569 ให้ผลรวมทุกใบเท่ากับอะไหล่ในไตรมาส 1 ของหน้าไตรมาส = PARTS): เปลี่ยนน้ำมัน 30 ลิตร คัน 0 และ 3 (ตรง TRIP_OIL) · ไส้กรอง 3 รายการ คันละ 2 ชิ้น คัน 0–5 · ไส้กรองเชื้อเพลิง 2 ชิ้น คัน 0 และ 4 */
const TRIP_OIL_CARS = [0, 3], TRIP_FILTER_CARS = [0, 1, 2, 3, 4, 5], TRIP_FUEL_CARS = [0, 4];
const tripParts = (sel) => PARTS.map((p, x) => { const n = (cars, q) => sel.filter(i => cars.indexOf(i) >= 0).length * q; return [p[0], p[1], p[2], String(x === 0 ? n(TRIP_OIL_CARS, +OIL_SPEC.litre) : x === 4 ? n(TRIP_FUEL_CARS, CAR_QTY[4]) : n(TRIP_FILTER_CARS, CAR_QTY[x])), p[4]]; }).filter(r => +r[3] > 0);
/* เบอร์ติดต่อรายคัน (3 พ.ย. 2569 · 6 พ.ย. 2569 เปลี่ยนเป็นผู้ดูแลยานพาหนะ ดูด้านล่าง) เจ้าของงาน "เพิ่มคอลัมน์เบอร์ติดต่อในหน้ารถที่เลือกแล้ว โดยเบอร์เป็นเบอร์ของเจ้าของรถ และตอนกดแก้ไข อยากเพิ่มการแก้ไขเบอร์โทร และสถานที่นัดได้")
   ค่าเริ่มต้น = เบอร์เจ้าของรถจากข้อมูลรถ · แก้ได้ทีละคันใน popup เดียวกับสถานที่ · คอลัมน์ตามหน้า MA Appointment ของ UI Release#2 ("เบอร์ติดต่อ") */
/* 6 พ.ย. 2569 เจ้าของงาน "เพิ่มชื่อผู้ดูแลยานพาหนะ ตรงเบอร์โทร ดึงจากผู้ควบคุมรถ" + "ตรงป๊อบอัพ เลยต้องมีให้แก้ชื่อโดย prefill ข้อมูลมาให้"
   ⇒ คอลัมน์ "ผู้ดูแลยานพาหนะ" = ชื่อ (บรรทัดบน) + เบอร์ (บรรทัดรอง) ค่าเริ่มต้นจากผู้ควบคุมรถของรถคันนั้น (BE controller ของ /api/vehicles · คำ "ผู้ดูแลยานพาหนะ" ตามแท็บข้อมูลรถของ UI Release#2)
   OWNER_PH = เบอร์ผู้ควบคุมรถ (ชื่อตัวแปรเดิม) · CTRL_NAME = ชื่อผู้ควบคุมรถ (ค่าสมมติ) · ค่าที่แก้ = { ลำดับรถ: [ชื่อ, เบอร์] } */
const OWNER_PH = ['081-472-3365', '081-472-3365', '054-710-224', '053-241-560', '089-635-1172', '042-221-908', '043-246-118', '054-411-737', '053-711-402', '054-511-226'];
const CTRL_NAME = ['นายสมชาย แก้วมณี', 'นายสมชาย แก้วมณี', 'นายวีระ ทองคำ', 'นายประยุทธ ศรีวงศ์', 'นายณรงค์ บุญมา', 'นายสุรชัย พลอยงาม', 'นายอำนาจ ไชยสิทธิ์', 'นายบุญเลิศ คำแสน', 'นายชาตรี อินทร์แก้ว', 'นายพิชิต ปัญญาดี'];
const TRIP_PHONES = { 4: ['นายอนุชา ศรีสุข', '086-552-1904'] }, TRIP_V_LOCS = { 6: 'ศูนย์บริการผู้รับจ้าง สาขาขอนแก่น' }, TRIP_V_PHONES = { 6: ['นายธนพล วงศ์ใหญ่', '095-118-4420'] };
const tripPhone = (i, ph) => ((ph || {})[i] || [])[1] || OWNER_PH[i];
const tripCtrl = (i, ph) => ((ph || {})[i] || [])[0] || CTRL_NAME[i];
const tripPhoneCell = (i, ph) => ({ text: tripPhone(i, ph), sub: tripCtrl(i, ph) });   // 9 พ.ย. 2569 เจ้าของงาน "E4 ตรงติดต่อ อยากให้ เพิ่มชื่อผู้ดูแลรถ ตรงด้านล่างเบอร์โทร ด้วย และอยากให้แก้จุดที่เกี่ยวข้องด้วย" ⇒ คอลัมน์ "เบอร์ติดต่อ" เบอร์บรรทัดบน ชื่อผู้ดูแลยานพาหนะบรรทัดรอง (เดิม 6 พ.ย. ชื่อบน เบอร์ล่าง หัว "ผู้ดูแลยานพาหนะ")
/* ตารางยานพาหนะของแผนเดินทาง ชุดเดียวทุกหน้า (R82 · 6 พ.ย. 2569 เจ้าของงาน "ถ้าเพิ่ม คอลัมน์ ก็ส่งผลกระทบกับ หน้าอื่นๆที่เป็นหน้าที่เหมือนกันด้วย ตอน export ก็เกี่ยวข้องด้วย" · แบบ QPART_COLS R81)
   ใช้ที่ ฟอร์มแผนเดินทาง S6 S9 (+ ไอคอนแก้ไข ลบ) · ตรวจสอบแผนเดินทาง S7 · แผนเดินทางดูอย่างเดียว S8 · รายละเอียดแผนเดินทาง S10 S12 (หน่วยงานเป็นบรรทัดรองของทะเบียน + สถานะงาน + ปุ่ม … เพราะ Table ของไลบรารี 8 คอลัมน์)
   · หน้าไตรมาส (ไม่มีสถานที่บำรุงรักษา + คอลัมน์แผนเดินทาง) · ไฟล์ PDF และ Excel ที่ส่งออก · เพิ่ม ลด หรือเปลี่ยนชื่อคอลัมน์ที่นี่ที่เดียว ช่องของแต่ละคอลัมน์อยู่ใน tripVCells (จับคู่ด้วยชื่อหัวคอลัมน์)
   ประเภทยานพาหนะต่อจากทะเบียน แบบ Vehicle list ของ UI Release#2 หน้า 5.2 Vehicle Management ("เลขทะเบียน / ยี่ห้อ / รุ่น" แล้ว "ประเภทยานพาหนะ") · component Table ของไฟล์ Component */
const UNIT_COL = 'หน่วยงานเจ้าของยานพาหนะ';
const TRIP_V_COLS = [['ทะเบียน', 150, 'Lead text'], ['ประเภทยานพาหนะ', 120], ['ยี่ห้อ/รุ่น', 0], [UNIT_COL, 140], ['เบอร์ติดต่อ', 160], ['สถานที่บำรุงรักษา', 190], ['วันดำเนินการ', 180]];
/* o.unitSub = หน่วยงานไปเป็นบรรทัดรองของทะเบียน · o.drop = [ชื่อคอลัมน์ที่ไม่แสดง] · o.fill = ทุกคอลัมน์ยืดเท่ากัน (ไฟล์ PDF A4) */
const tripVCols = (o) => { o = o || {}; return TRIP_V_COLS.filter(c => (o.drop || []).indexOf(c[0]) < 0 && !(o.unitSub && c[0] === UNIT_COL)).map(c => o.fill ? [c[0], 0, c[2]] : c); };
/* t = { d1, d2, works, locs, phones, vendor | hire } ใบแผนเดินทาง หรือค่าในฟอร์ม · ยังไม่มีช่วงวัน (ฟอร์มยังไม่เลือกวันที่) = วันดำเนินการ "—" */
const tripVCells = (i, t, o) => {
  o = o || {};
  const c = TRIP_CARS[i], locs = t.locs || {};
  const cell = { 'ทะเบียน': o.unitSub ? { text: c[0], sub: c[2] } : c[0], 'ประเภทยานพาหนะ': typeOf(c), 'ยี่ห้อ/รุ่น': c[1], [UNIT_COL]: c[2], 'เบอร์ติดต่อ': tripPhoneCell(i, t.phones),
    'สถานที่บำรุงรักษา': { text: tripLoc(i, locs), sub: locs[i] ? 'แก้จากสำนักงานเจ้าของยานพาหนะ' : 'ค่าเริ่มต้น สำนักงานที่ยานพาหนะอยู่' }, 'วันดำเนินการ': t.d1 ? tripWorkCell(i, t) : '—' };
  return tripVCols(o).map(col => cell[col[0]]);
};
const TRIP_ALL = TRIP_CARS.map((_, i) => i), TRIP_REST = TRIP_ALL.filter(i => TRIP_SEL.indexOf(i) < 0);
const TRIP_OUT = 5, TRIP_KEEP = TRIP_SEL.filter(i => i !== TRIP_OUT);   // 5 พ.ย. 2569 เอารถออกจากแผนเดินทาง (soft delete): 82-3302 อุดรธานี ออกแล้วกลับไปเลือกได้   // ใบแรกใช้ TRIP_SEL · ใบถัดไปเลือกได้เฉพาะที่เหลือ
/* ชื่อแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "ตอนสร้างแผนการเดินทางอยากให้ตั้งชื่อแผนได้ด้วย") — ผู้ใช้ตั้งเอง แสดงแทน "แผนเดินทาง k" ในหน้าแผนเดินทาง */
const TRIP_1 = { name: 'ตรวจยานพาหนะ ขอนแก่น อุดรธานี ลำปาง', sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, works: TRIP_WORKS, d1: TRIP.d1, d2: TRIP.d2, st: 'review' }, TRIP_2 = { name: 'ตรวจยานพาหนะ น่าน เชียงใหม่ เชียงราย', sel: TRIP_REST, locs: {}, phones: {}, d1: '17/11/2569', d2: '21/11/2569', st: 'review' };
const tripAs = (t, st) => Object.assign({}, t, { st });
const TAKEN_1 = Object.fromEntries(TRIP_SEL.map(i => [i, TRIP_1.name]));   // รถที่อยู่ในแผนเดินทางใบแรกแล้ว → popup ใบถัดไปแสดงแต่เลือกไม่ได้ (5 พ.ย. 2569)
/* S9 แผนเดินทางจ้างดำเนินการ (3 พ.ย. 2569 เจ้าของงาน "ตอนที่ทำ e2 อยากให้มีการเลือกว่า กบค ดำเนินการเอง หรือ จ้างดำเนินการ และพอเลือกจ้างดำเนินการ ก็มีให้เลือก vendor list")
   ฟอร์มเดียวกับ S6 · จ้าง = ผู้รับจ้าง (vendor list) + เลขที่สัญญา/ใบสั่งจ้าง + รถ + สถานที่รายคัน + ช่วงวันทำงาน · ไม่มีพนักงาน กบค. และค่าใช้จ่าย */
const VENDORS = [['บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด', 'กระเช้าแก้ไฟ · กระเช้าฮอทไลน์'], ['หจก. ช่างกลภาคอีสาน', 'กระเช้าแก้ไฟ'], ['บริษัท เครนเทค เอ็นจิเนียริ่ง จำกัด', 'รถพ่วงฉีดน้ำ'], ['หจก. ล้านนาไฮดรอลิก', 'กระเช้าแก้ไฟ · รถพ่วงฉีดน้ำ']];
const TRIP_V = { name: 'จ้างบำรุงรักษา น่าน เชียงใหม่ เชียงราย', vendor: VENDORS[0][0], contract: 'สจ.69-0142', sel: TRIP_REST, locs: TRIP_V_LOCS, phones: TRIP_V_PHONES, d1: '17/11/2569', d2: '21/11/2569', st: 'review' };
const tripBy = (t) => t.vendor || 'ดำเนินการเอง';   // 6 พ.ย. 2569 เจ้าของงาน "เปลี่ยนคำ กบค ดำเนินการเอง เป็น ดำเนินการเอง"
const TRIP_RETURN = 'ช่วงวันที่ 03 ถึง 07/11/2569 ตรงกับแผนดับไฟของ กฟฉ.1 ขอนแก่น กรุณาเลื่อนเป็นสัปดาห์ถัดไป';
const WORK = [   // รายการงาน · อะไหล่ · ตามแผน · ใช้จริง · หน่วย
  ['เปลี่ยนน้ำมันไฮดรอลิก', 'น้ำมันไฮดรอลิก ISO VG 46', '30', '30', 'ลิตร'],
  ['เปลี่ยนไส้กรองไฮดรอลิก', 'ไส้กรองไฮดรอลิก', '2', '2', 'ชิ้น'],
  ['เปลี่ยนไส้กรองน้ำมันเครื่อง', 'ไส้กรองน้ำมันเครื่อง', '2', '2', 'ชิ้น'],
  ['เปลี่ยนไส้กรองอากาศ', 'ไส้กรองอากาศ', '2', '1', 'ชิ้น']];
const BEFORE = ['รูปยานพาหนะ + ทะเบียน', 'อะไหล่ใหม่'];
const AFTER = ['รูปยานพาหนะ + ทะเบียน', 'อะไหล่เก่า', 'อะไหล่ใหม่ที่เหลือ', 'จุดที่บำรุงรักษา (อะไหล่ใหม่)'];
/* S10 สถานะงานรายคัน (3 พ.ย. 2569 เจ้าของงานเลือก "ทำทีละขั้น") ตามชื่อสถานะงานของหน้า RP & MA Job ของ UI Release#2 (นัดหมายแล้ว → อยู่ระหว่างซ่อม → เสร็จสิ้น / ยกเลิก) */
const WSTAT = { todo: ['ยังไม่เริ่ม', 'Gray'], doing: ['อยู่ระหว่างบำรุงรักษา', 'Warning'], done: ['เสร็จสิ้น', 'Success'], cannot: ['บำรุงรักษาไม่ได้', 'Error'],
  /* S23 มุมผู้รับจ้าง (เอากลับ 10 พ.ย. 2569 เจ้าของงาน _"scen s23 อยากปรับ ui ให้เหมือนกับ s10 แต่ว่า เงื่อนไขการมองเห็น เมนูต่างๆ ยังเป็นเหมือนเดิม"_ · R87)
     สถานะระหว่างทางของแผนจ้างชุดเดิมของ S23 (3 พ.ย. 2569 รอบ 2 เจ้าของงาน "เห็นสถานะ ว่ารถคันนั้น ดำเนินการบำรุงรักษาแล้ว ปุ่มจะแสดงให้ส่งตรวจงาน") · สีชุดเดิม: ยังไม่ส่ง Info · รอตรวจรับ Warning · ส่งกลับแก้ไข Error
     (4 พ.ย. 2569 เคยตัดพร้อม S11 · S11 ยังตัดอยู่ ผู้ตรวจรับงานที่ผู้รับจ้างส่งยังไม่เคาะ) · หน่วยงานปิดงานแทนผู้รับจ้างที่ S10 ยังใช้ 4 สถานะแรกตามเดิม */
  worked: ['ดำเนินการบำรุงรักษาแล้ว', 'Info'], reported: ['แจ้งบำรุงรักษาไม่ได้', 'Info'], wait: ['รอตรวจรับ', 'Warning'], returned: ['ส่งกลับแก้ไข', 'Error'] };
const ACC = { wait: ['รอรับทราบ', 'Warning'], ok: ['รับทราบแล้ว', 'Success'] };   // S13 ผู้ดูแลยานพาหนะรับทราบผลรายคัน (10 พ.ย. 2569 เดิม รอหน่วยงานยอมรับ / หน่วยงานยอมรับแล้ว)
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
  const f = dropdown('เลือกยานพาหนะ', o.query || '', { placeholder: 'ค้นหาทะเบียน, จังหวัด', lead: 'search-24-300-round', state: o.open ? 'Focused' : undefined, error: o.error || '' });
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
      if (sh) { setProps(sh, { Title: o.car ? 'อะไหล่ของยานพาหนะคันนี้' : 'อะไหล่ที่ต้องใช้ใน' + NOW_Q, 'Supporting text': true, 'More actions': false, Badge: picked.length > 0, Actions: false }); await text(sh, 'Supporting text', o.car ? 'เลือกจากคลังหรือระบุเพิ่มเอง แก้จำนวนหรือเอาออกได้' : 'รวมจากยานพาหนะ ' + NOW_CARS + ' คันของไตรมาสนี้ · เบิก/จองผ่านระบบจองอะไหล่'); const b = find(sh, 'Badge outline'); if (b && picked.length) setProps(b, { Text: String(picked.length) }); }
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
    const sec = col('Section', [await section('อะไหล่ของยานพาหนะคันนี้', { badge: rows.length || null, buttons: [{ kind: 'Secondary button', text: 'ระบุอะไหล่เพิ่มเติม', icon: 'add-24-300-round' }] })], 16);
    add(sec, rows.length ? await tblShort(PART_COLS.slice(0, 5), rows) : await noParts('เลือกอะไหล่จากคลัง หรือระบุอะไหล่เพิ่มเติมเอง'), 'h');
    return sec;
  }
  const head = 'รายการอะไหล่ที่ต้องใช้ใน' + NOW_Q;
  if (!picked.length) return col('Section', [await section(head), await noParts('ไตรมาสนี้ยังไม่มีอะไหล่ในแผน เลือกจากคลังเมื่อต้องการเบิก')], 16);
  return col('Section', [await section(head, { badge: PARTS.length }), await tblShort(PART_COLS, PARTS.map((p, i) => partRow(p, i, o)))], 16);
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
      const pairs = [['แผน', P[1]], ['เลขที่ MR', P[0]], ['ไตรมาส', NOW_Q], ['จำนวนยานพาหนะ', NOW_CARS + ' คัน']];
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

/* ลิงก์เลขทะเบียน (6 พ.ย. 2569 เจ้าของงาน "อยากให้ กดที่ทะเบียน newtab ไปข้อมูลรถได้ อยากให้ปรับส่วนอื่นที่เป็นเลขทะเบียน ตอนนี้เพิ่มแค่ส่วนของบำรุงรักษาก่อน")
   ⇒ เลขทะเบียนทุกจุดในจอบำรุงรักษา (ช่องตาราง · กล่องข้อมูล · การ์ดมือถือ) กดแล้วเปิดแท็บใหม่ไปหน้าข้อมูลยานพาหนะของ Vehicle Management · ช่องกรอกและรายการตัวเลือกไม่เป็นลิงก์
   ไลบรารี Component ไม่มี Table cell แบบลิงก์ ⇒ สไตล์ตามค่าลิงก์ใน _Content item base ของ UI Release#2 หน้า Replacement Vehicle (ค่า "BRD005678"): สี #444CE7 ขีดเส้นใต้
   ผูกตัวแปร Color/text/info ของไลบรารีถ้าหาได้ (ค่าสีเดียวกับ Color/icon/info ที่ Progress bar ของ Table cell ใช้) · Overhaul และงานซ่อมยังไม่ปรับ (เจ้าของงาน "ส่วนที่ทำไปแล้วยังไม่ปรับ")
   AFTER_SCREEN = ตัวเรียกหลังประกอบจอแต่ละจอใน core (มีเฉพาะปลั๊กอินนี้) */
const PLATE_RE = /^\d{2}-\d{4} [\u0E00-\u0E7F]+$/;
const PLATE_SKIP = /^(Text input|Input dropdown|Input dropdown with badges|Dropdown list|Dropdown list item|Badge|Pill|Breadcrumb|Page header)/;
let LINK_VAR;
/* R80 คำว่า "ยานพาหนะ" แทน "รถ" (6 พ.ย. 2569 เจ้าของงาน "คำว่า รถ ที่อยู่ใน โปรแกรม อยากให้เปลี่ยนเป็นคำว่า ยานพาหนะ แทน โดยถ้าเป็นข้อมูลที่ดึงมาจาก api จะไม่ต้องแก้ไข")
   ข้อความที่ปลั๊กอินใส่เองเขียนเป็น "ยานพาหนะ" ในโค้ดแล้ว (เทสตรวจซอร์สด้วย) · ตัวนี้แก้ข้อความตั้งต้นของ component ที่ยืมมา เช่น "สถานะรถ" ของ component งานซ่อม
   WORD_ALLOW = ข้อมูลจาก API ที่คงคำว่ารถ (ชื่อประเภทยานพาหนะ) + คำที่มี "รถ" แต่ไม่ได้แปลว่ารถ · ต้องตรงกับ allow ของ R80 ใน component-rules.json (เทสเทียบให้) */
const WORD_ALLOW = ['สามารถ', 'รถพ่วงฉีดน้ำ', 'รถเสีย', 'รถกระเช้า', 'รถบรรทุกขนาดใหญ่', 'รถส่วนกลาง', 'รถยนต์บรรทุกส่วนบุคคล'];   // รถกระเช้า = ประเภทยานพาหนะ/ชื่อแผนจากข้อมูล Overhaul (12 พ.ย. 2569 ตรง ALLOW ของ check-wording.mjs ในรีโปเว็บ) · รถเสีย = ประเภทการซ่อมของระบบแจ้งซ่อม (5.3 Vehicle Breakdown) ใช้ในประวัติการซ่อมบำรุง S24 (10 พ.ย. 2569) · 12 พ.ย. 2569 ถอด ผู้ใช้รถฯ ทะเบียนรถ (ข้อความแบบสำรวจของ S27 ย้ายไป satisfaction-plugin R105) · 12 พ.ย. 2569 รถบรรทุกขนาดใหญ่ รถส่วนกลาง รถยนต์บรรทุกส่วนบุคคล = ข้อมูลจาก API ของ VMS+ (หมวดหมู่ · ลักษณะการใช้งาน · ประเภทตามกรมการขนส่งทางบก) ในแท็บข้อมูลยานพาหนะ S24 (R107 · ALLOW ของ check-wording.mjs เว็บ f6f5e0d)
const OLD_WORD = '\u0E23\u0E16';   // "รถ" เขียนแบบ escape ให้เทสตรวจซอร์สไม่นับตัวแปลงเอง
const toVehicleWord = (s) => { let t = s; WORD_ALLOW.forEach((w, i) => { t = t.split(w).join('\u0001' + i + '\u0002'); }); t = t.split(OLD_WORD).join('ยานพาหนะ'); WORD_ALLOW.forEach((w, i) => { t = t.split('\u0001' + i + '\u0002').join(w); }); return t; };
async function AFTER_SCREEN(root) {
  for (const t of root.findAll(n => n.type === 'TEXT' && (n.characters || '').indexOf(OLD_WORD) >= 0)) {
    const v = toVehicleWord(t.characters); if (v === t.characters) continue;
    try {
      const fonts = t.fontName === figma.mixed ? t.getRangeAllFontNames(0, t.characters.length) : [t.fontName];
      for (const f of fonts) await figma.loadFontAsync(f);
      t.characters = v;
    } catch (e) { warn('คำว่ายานพาหนะ', e); }
  }
  const ts = root.findAll(n => n.type === 'TEXT' && PLATE_RE.test(n.characters || ''));
  if (!ts.length) return;
  if (LINK_VAR === undefined) LINK_VAR = await libVar(/^Color\/text\/info$/i);
  for (const t of ts) {
    let p = t.parent, skip = false;
    while (p && p !== root) { if (PLATE_SKIP.test(p.name)) { skip = true; break; } p = p.parent; }
    if (skip) continue;
    try {
      await figma.loadFontAsync(t.fontName);
      t.textDecoration = 'UNDERLINE';
      let paint = { type: 'SOLID', color: rgbOf('#444CE7') };
      if (LINK_VAR) try { paint = figma.variables.setBoundVariableForPaint(paint, 'color', LINK_VAR); } catch (e) { /* คงค่าสี */ }
      t.fills = [paint];
    } catch (e) { warn('ลิงก์เลขทะเบียน', e); }
  }
}
/* ---------- S1 หน้ารายการแผน + ฟอร์มสร้างแผน ---------- */
const PLAN_COLS = [['เลขที่ MR', 150, 'Lead text', 'Down'], ['ชื่อแผน', 0, 'Text', 'Swap'], ['ภาค / ประเภทยานพาหนะ', 200], ['จำนวนยานพาหนะ', 100], ['ยานพาหนะรายไตรมาส', 210], ['สถานะ', 150, 'Badge', 'Swap'], ['', 60]];   // 6 พ.ย. 2569 ตัดคอลัมน์คลังรับทราบ (S22 ตัดออก · ระบบแจ้ง Smart Inventory ตอนอนุมัติแทน)   // 2 พ.ย. 2569 เพิ่มคลังรับทราบ (S22) · ปีงบประมาณย้ายเป็นบรรทัดรองของชื่อแผน (Table 8 คอลัมน์เต็ม)   // 30 ต.ค.: แผนปี · เลขที่ MRZ69000XX นำหน้า (ประเภทรถอยู่ในชื่อแผน) · Table 8 คอลัมน์
const qCell = (t) => { const q = t.split(' · '); return { text: q.slice(0, 2).join(' · '), sub: q.slice(2).join(' · ') }; };   // 4 ไตรมาสยาวเกินคอลัมน์ ⇒ 2 บรรทัด (เจ้าของงาน 2 พ.ย. 2569 เปลี่ยน Q1 เป็นไตรมาส)
const PLAN_MENU_OF = (st) => st === 'review' || st === 'returned' ? MENU : st === 'approved' ? MENU.slice(0, 2) : MENU.slice(0, 1);   // รายการเมนู … ตามสถานะแผน (S19 S20) · มือถือเปิดเป็นไอคอนตามนี้
/* ภาค / ประเภทรถ ในรายการ (เจ้าของงาน 5 พ.ย. 2569 "สรุปจากรถที่อยู่ในแผนจริง") — ตัวกรองอยู่รายไตรมาสแล้ว แผนไม่มีภาคของตัวเอง ⇒ 2 บรรทัดในช่องเดียว (Table 8 คอลัมน์ R8 · บรรทัดรอง = ประเภทรถ)
   PLAN_SCOPE = แผนที่มีรถหลายภาค/ประเภท (ค่าสมมติ) · ที่เหลือใช้ภาคและประเภทเดียวของแผน */
const PLAN_SCOPE = { 'MRZ7000001': ['ภาค 1, ภาค 2', 'กระเช้าแก้ไฟ'], 'MRZ7000002': ['ภาค 2, ภาค 3', 'กระเช้าแก้ไฟ, รถพ่วงฉีดน้ำ'] };   // 5 พ.ย. 2569 ชีตลูกค้า: MRZ7000001 เคยเป็น "ภาค 1" แต่รถในแผน (TRIP_CARS) อยู่ทั้ง กฟน. และ กฟฉ. ⇒ ภาค 1 และภาค 2 ให้ตรงรถ
const scopeCell = (p) => { const x = PLAN_SCOPE[p[0]]; return x ? { text: x[0], sub: x[1] } : { text: shortRegion(p[2]), sub: p[7] }; };
const PLAN_UNIT = { 'MRZ7000004': 'กบผ.', 'MRZ7000001': 'กบผ.', 'MRZ7000002': 'กปส.', 'MRZ7000003': 'กรย.', 'MRZ7100001': 'กบค.', 'MRZ6900012': 'กบผ.', 'MRZ7100002': 'กปส.', 'MRZ6900011': 'กรย.' };   // หน่วยงานเจ้าของแผน (ค่าสมมติ · 6 พ.ย. 2569 · MRZ7100001 = แผนของ กบค. ที่มีรถ กฝซ.)
/* view = หน่วยงานที่เปิดดูแผนทุกหน่วยงาน (กบค.) · หน่วยงานเป็นบรรทัดรองของเลขที่ MR (Table 8 คอลัมน์เต็ม)
   แผนของหน่วยงานตัวเอง เมนู … ตามสถานะแบบปกติ · แผนของหน่วยงานอื่น ดูรายละเอียดอย่างเดียว (6 พ.ย. 2569 รอบ 2) */
/* 9 พ.ย. 2569 เจ้าของงาน (ภาพหน้ารายการแผนมุม กบค.) "หน้านี้น่าจะต้องเพิ่มคอลัมม์ หน่วยงานเจ้าของเรื่อง ด้วย" ⇒ มุม กบค. (view) มีคอลัมน์ "หน่วยงานเจ้าของเรื่อง" ต่อจากเลขที่ MR แทนบรรทัดรองใต้เลขที่ MR · มุมหน่วยงานเห็นแต่แผนของตัวเอง ไม่มีคอลัมน์นี้ */
const PLAN_COLS_ALL = PLAN_COLS.slice(0, 1).concat([['หน่วยงานเจ้าของเรื่อง', 140]], PLAN_COLS.slice(1));
const planRow = (p, view) => (view ? [p[0], PLAN_UNIT[p[0]] || UNITS[0]] : [p[0]]).concat([{ text: p[1], sub: 'ปีงบประมาณ ' + p[8] }, scopeCell(p), p[4], qCell(p[9]), { pill: PST[p[5]] }, { menu: 1, items: view && PLAN_UNIT[p[0]] !== view ? MENU.slice(0, 1) : PLAN_MENU_OF(p[5]) }]);
/* 5 พ.ย. 2569 รีวิวทีมออกแบบ: ปุ่ม Primary "สร้างแผน" อยู่ขวาของปุ่ม "ตัวกรอง" ⇒ ย้ายจาก Page header ไป Actions ของ Table header
   ตาม Incident list ของ 5.5 Repair & Maintenance Job (Admin) ใน UI Release#2 (Page header ไม่มีปุ่ม · Table header = ค้นหา + ตัวกรอง + ปุ่มหลัก)
   o.empty = ยังไม่มีแผน ⇒ Empty state/Data empty (Graphic) + ปุ่ม "สร้างแผน" ไม่มี Table header ตาม Admin State=Empty ของ RP & MA Job และ Wall charger list - Empty ของ UI Release#2 */
async function listScreen(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'บำรุงรักษาตามวาระ' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  if (o.empty) {
    const es = inst('Empty state/Data empty'); add(sec, es, 'h');
    await text(es, 'Text', 'ไม่มีแผนบำรุงรักษา'); await text(es, 'Supporting text', 'เมื่อสร้างแผนบำรุงรักษา รายการแผนจะแสดงที่นี่');
    const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false;
    const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'สร้างแผน', 'Leading icon': true, 'Leading icon swap': icon('add-24-300-round') });
    return scr;
  }
  add(sec, await tableHeader(Object.assign({ primary: 'สร้างแผน' }, o)), 'h');   // กบค. สร้างแผนได้แล้ว (6 พ.ย. 2569 รอบ 2) ⇒ ปุ่มอยู่ทุกมุม
  add(sec, await tblShort(o.view ? PLAN_COLS_ALL : PLAN_COLS, (o.rows || PLANS).map(p => planRow(p, o.view)), { pagination: (o.rows || PLANS).length }), 'h');
  /* แผงตัวกรองหน้ารายการแผน (6 พ.ย. 2569 รีวิว "filter หน้ารายการแผน เขต · หน่วยงานหน้างาน กรย. 12 เขต, กกฟ. 1and2" + "กบค. อยากเห็นทุกแผน")
     filterPanel แบบแผงตัวกรองของฟอร์ม S1 (R77) · Input dropdown with badges Optional เลือกหลายค่า · เขต = 12 เขตของภาค 1–4 (DISTRICTS · ไม่รวมกองของ สนง. ที่อยู่ในช่องหน่วยงานหน้างานแล้ว R93 · 12 พ.ย. 2569 X3) · หน่วยงานหน้างาน = UNITS · o.filter.open = 'unit' | 'district' */
  if (o.filter) {
    const fd = o.filter, at = (n) => n.findOne(x => x.name === 'Container') || n;
    const dist = multiDropdown('เขต', fd.districts || [], { placeholder: 'เลือกเขต', optional: true, state: fd.open === 'district' ? 'Focused' : undefined });
    const unit = multiDropdown('หน่วยงานหน้างาน', fd.units || [], { placeholder: 'เลือกหน่วยงานหน้างาน', optional: true, state: fd.open === 'unit' ? 'Focused' : undefined });
    await filterPanel(scr, [dist, unit]);
    if (fd.open === 'unit') comboAt(scr, at(unit), UNITS.map(u => [u, '', (fd.units || []).indexOf(u) >= 0]));
    if (fd.open === 'district') comboAt(scr, at(dist), REGIONS.slice(0, 4).flatMap(r => DISTRICTS[r]).map(d => [d, '', (fd.districts || []).indexOf(d) >= 0]));
  }
  return scr;
}
const CARS = VEH.map(v => [v[0], v[1], v[2]]);
/* ฟอร์มสร้างแผน: ดูคำอธิบายที่ planForm() (ปรับ 5 พ.ย. 2569 แยกไตรมาสตั้งแต่แรก + ตารางรถทุกคัน ค้นหา กรอง · ค่ำ R77 ภาค เขต ประเภทรถ ย้ายเข้าแผงตัวกรอง) · ช่องค้นหา + ชิปรถแบบ R24 (2 พ.ย.) เลิกใช้ในฟอร์มนี้แล้ว */
const YEARS = ['2568', '2569', '2570', '2571', '2572'];   // เจ้าของงาน "ไม่จำกัดปี" — จำนวนปีที่แสดงยังไม่รู้ (Q31)
const CARP_COLS = [['ทะเบียน', 230, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของยานพาหนะ', 180], ['น้ำมันไฮดรอลิก', 140], ['เปลี่ยนล่าสุด', 120], ['อะไหล่', 120], ['', 104]];   // ไอคอนแก้ไข + ลบรถออกจากไตรมาส กว้าง 104 แบบบล็อก J ของ Overhaul · ตารางรถในไตรมาส (เจ้าของงาน 2 พ.ย. 2569 "section ของรถที่เลือกมาไตรมาสนั้น")
const CAR_PICK = [1, 2, 3];                 // ไส้กรองที่ กบค. เลือกให้รถ 1 คันในข้อมูลตัวอย่าง (ลำดับใน PARTS) · น้ำมันไฮดรอลิก (0) เข้ารายการเมื่อเลือกเปลี่ยนน้ำมัน
const CAR_QTY = [30, 2, 2, 2, 2];           // จำนวนต่อคัน (ค่าสมมติ)
const MANUAL = { name: 'ไส้กรองอากาศขนาดเล็ก', code: '', price: '750', qty: 2 };   // รายการที่ กบค. ระบุเอง ค่าตามจอ "รายการเพิ่มเติม" ของงานซ่อม
const MANUAL_ROW = [MANUAL.name, '-', 'เพิ่มเอง', String(MANUAL.qty), 'ชิ้น'];
/* อะไหล่ในไตรมาส = รวมจากรถของไตรมาสนั้น · เจ้าของงาน 2 พ.ย. 2569 "ไม่มี suggest มาให้เลย ให้เลือกเอง" + "หัวข้ออะไหล่ เป็นอะไหล่ในไตรมาสนั้นๆ" ⇒ picks = { ลำดับรถ: [ลำดับอะไหล่] } ว่างเมื่อยังไม่เลือก */
const quarterParts = (cars, picks) => PARTS.map((p, i) => [p[0], p[1], p[2], String(CAR_QTY[i] * cars.filter(c => (picks[c] || []).indexOf(i) >= 0).length), p[4]]).filter(r => +r[3] > 0);
/* แท็บไตรมาสที่ยังไม่มีรถ (5 พ.ย. 2569 เจ้าของงาน "ทำให้หน้า ไตรมาสยังไม่่มีรถสามารถเพิ่มรถจากจุดนี้ได้ด้วย" · R75)
   Empty state/Data empty ภาพรถกับแว่นขยาย (R61) + ปุ่มหลัก "เพิ่มรถเข้าไตรมาส n" ไอคอน add · ปุ่มรองซ่อน
   ตาม Empty state ที่มีปุ่มหลักในฟอร์มของ UI Release#2 หน้า 5.2 Vehicle Management (Create vehicle step 3 > State=Empty ปุ่ม "เพิ่ม") + ปุ่มของ Empty state หน้าไตรมาส S6 ("สร้างแผนเดินทาง") */
async function noCarsInQ(q) {
  const es = inst('Empty state/Data empty');
  await text(es, 'Text', 'ยังไม่มียานพาหนะในไตรมาสนี้'); await text(es, 'Supporting text', 'เพิ่มยานพาหนะที่ยังไม่อยู่ในแผนเข้าไตรมาสนี้ เพิ่มได้ทุกคัน');
  const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false;
  const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'เพิ่มยานพาหนะเข้าไตรมาส ' + q, 'Leading icon': true, 'Leading icon swap': icon('add-24-300-round') });
  return emptyGraphic(es, 'empty-vehicle');
}
async function noParts(sub) { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มีรายการอะไหล่'); await text(es, 'Supporting text', sub); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
const OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน'];   // เจ้าของงาน 2 พ.ย. 2569: น้ำมันไฮดรอลิกไม่ได้เปลี่ยนทุกปี ให้ผู้ใช้เลือกเอง ระบบไม่ตัดสินจากเงื่อนไขอายุ
const LAST_OIL = ['12/03/2568', '12/03/2567', '05/02/2567', '20/11/2566', 'ไม่มีข้อมูล', '18/06/2568', '09/01/2566', '14/10/2568', 'ไม่มีข้อมูล', 'ไม่มีข้อมูล'];   // 5 พ.ย. 2569 82-1145 และ 81-2210 แก้ให้ตรง MA_ROWS (S24)   // เปลี่ยนน้ำมันครั้งล่าสุดตามลำดับ CAND
const QUARTERS = ['ไตรมาส 1 (ม.ค.–มี.ค.)', 'ไตรมาส 2 (เม.ย.–มิ.ย.)', 'ไตรมาส 3 (ก.ค.–ก.ย.)', 'ไตรมาส 4 (ต.ค.–ธ.ค.)'];   // 6 พ.ย. 2569 เจ้าของงาน "ไตรเป็นตามปีปฎิทิน" (เดิมไตรมาส 1 = ต.ค.–ธ.ค. ตามปีงบ) · ป้ายช่อง "ปีงบประมาณ" คงเดิม (เจ้าของงาน "ไม่ต้องมีคำว่าปีปฎิทิน")
/* ช่องติ๊กหัวคอลัมน์แรก (ติ๊กทั้งหมด) นับเฉพาะแถวที่ติ๊กได้ — ตาม Export reports - Select vehicles ของ 5.2 Vehicle Management (UI Release#2) · ใช้ทั้งตารางเลือกรถของ S1 และ popup เพิ่มรถของ S6 */
function headCheck(t, rows) {
  const hc = t && t.findOne ? t.findOne(n => n.type === 'INSTANCE' && n.name === 'Table header cell') : null; if (!hc) return;
  const ok = rows.filter(r => !r[0].disabled), n = ok.filter(r => r[0].check).length;
  setProps(hc, { Checkbox: 'True' });
  const cb = find(hc, 'Checkbox'); if (cb) setProps(cb, { Type: n === 0 ? 'Unselected' : n === ok.length ? 'Selected' : 'Indeterminate', State: ok.length ? 'Default' : 'Disabled' });
}
/* ฟอร์มสร้างแผน แบบ A (เจ้าของงานเลือก 5 พ.ย. 2569) — _"หน้าตอนที่เลือก ภาค เลือกเขต อยากให้แสดงรถทั้งหมด ของภาคหรือเขตนั้นๆเลย ที่เลือกมา แล้วค่อยเข้าสู่กระบวนการเลือกรถเข้าไตรมาส"_
   + _"อยากออกแบบหน้าสร้างแผนให้ เห็นรถหมายทุกคัน เหมือนหน้ารวมที่มีรถทุกคันแล้ว มีค้นหา มี กรอง"_ (แทนรีวิว "แยกไตรมาสตั้งแต่แรก / filter ในแต่ละไตรมาส" และแทนช่องค้นหา + ชิปแบบ R24)
   โครงลอกหน้า Vehicle Management ของ UI Release#2 (Vehicle list · Export reports - Select vehicles): Tabs + Pill นับ → Table header หัว + Badge "n คัน" · ช่องค้นหา "เลขทะเบียน, ยี่ห้อ, รุ่น" · ปุ่ม "ตัวกรอง" (Pill) · ปุ่มรอง (แบบ "รายงาน")
   · ชิปตัวกรอง Badge outline with remove icon → Table แถวแรก Lead checkbox (บรรทัดรอง ยี่ห้อ/รุ่น) + ติ๊กทั้งหมดที่หัวคอลัมน์ → Table pagination
   ⇒ section "เลือกรถเข้าแผนและจัดลงไตรมาส" (R77 · 5 พ.ย. 2569 ค่ำ เจ้าของงาน _"อยากย้ายสิ่งที่ filter ด้านบน มาไว้ที่เมนู filter ด้านล่างแทน"_ + _"อยากให้เอาสิ่งที่ต้องเลือก 3 อย่างนี้ ไปอยู่ใน filter เลย
     และปุ่ม filter and search มีขึ้นมาเลย หัวตารางมาเลย แล้วมี icon car empty มาแสดง ถ้ายังไม่ได้เลือกรถ"_ · ตามต้นแบบเว็บ PlanForm.tsx ที่เจ้าของงานยืนยันแล้ว):
     ไม่มีแถวช่องบนสุดแล้ว — Tabs ทั้งหมด · ไตรมาส 1–4 (Tabs ของไลบรารีมี 5 ช่อง ⇒ ไม่มีแท็บ "ยังไม่จัด" รอเคาะ) + Table header แสดงเสมอ ตั้งแต่ยังไม่เลือกอะไร
     ปุ่ม "ตัวกรอง" ของ Table header เปิดแผงตัวกรอง (filterPanel ใน core แบบ S24 · มือถือ bottom sheet) ช่อง ภาค · เขต · ประเภทรถ = Input dropdown with badges Optional "(ถ้ามี)" หลายค่า
     (เขต = เขตของทุกภาคที่เลือกในแผง · ยังไม่เลือกภาค = ทุกเขต · ไม่มี Disabled เลือกช่องไหนก่อนก็ได้ R69) ตาม "PEA Car Cost Filter" ของ UI Release#2 (ช่อง "ปี" หลายค่าในแผงตัวกรอง)
     กดตกลงจึงใช้ · ยกเลิก/ปิด = ไม่เปลี่ยน → ชิป Badge outline with remove icon ใต้แถวค้นหา + Pill บนปุ่มตัวกรอง = จำนวนชิป
     ยังไม่เลือกช่องใด (แท็บทั้งหมด) = Empty state/Data empty ภาพรถ (R61) "ยังไม่มีรายการรถ" / "กดตัวกรองเพื่อเลือกภาค เขต หรือประเภทรถ ตารางจะแสดงรถทั้งหมดที่ตรงกัน"
   → ตารางรถทุกคันของพื้นที่ (ทะเบียน · ประเภทรถ · เขต / หน่วยงานเจ้าของรถ · ไตรมาส = Pill "ไตรมาส n" หรือ Gray "ยังไม่จัด" แบบป้าย "ยังไม่มีแผนเดินทาง" ของ S6) → ติ๊กแล้วกด "จัดลงไตรมาส (n)" → popup เลือก ไตรมาส 1–4
   แท็บไตรมาส n = รถที่จัดลงไตรมาสนั้นทั้งหมด (ไม่ขึ้นกับภาค เขต ที่เลือกอยู่) · เอาชิป/ช่องในแผง หรือคำค้นออก เปลี่ยนแค่แถวที่เห็น รถที่จัดแล้วไม่หาย (รีวิว 5 พ.ย. 2569) · ไม่มี confirm เอารถออกแล้ว
   ปุ่ม "บันทึกและส่งอนุมัติ" Disabled จนกว่า ชื่อแผน · ปีงบประมาณ ครบ · รถทุกคันอยู่ในไตรมาส · ทุกคันกำหนดอะไหล่แล้ว (รีวิว A.11 · 6 พ.ย. 2569) · o.draw = การเบิกรายคัน · o.errors = Validation กรณีไม่ได้ระบุข้อมูล, Out of focus
   o.regions / o.districts / o.types / o.query = ตัวกรองที่ใช้แล้ว (กดตกลงแล้ว) และคำค้น · o.filter = เปิดแผงตัวกรอง { regions, districts, types = ค่าที่เลือกในแผง (ยังไม่กดตกลง) · open: 'region' | 'district' = รายการเปิด }
   o.yearOpen = รายการปีเปิด · o.alloc = { ลำดับรถใน CAND: ไตรมาส } · o.q = แท็บ (0 = ทั้งหมด · 1–4 = ไตรมาส) · o.ticked = แถวที่ติ๊ก
   o.assign = เปิด popup จัดลงไตรมาส { sel: 0–3 ไตรมาส · -1 ยังไม่เลือก } · o.picks / o.manualCars = อะไหล่ (S21) · o.edit = ฟอร์มแก้ไข S19 (ปีงบประมาณ Readonly · ปุ่ม "ยกเลิก") · o.alert = [สี, หัวข้อ, ข้อความ] */
const PICK_COLS = [['ทะเบียน', 260], ['ประเภทยานพาหนะ', 160], ['เขต / หน่วยงานเจ้าของยานพาหนะ', 0], ['ไตรมาส', 160, 'Badge'], ['', 60]];   // แท็บทั้งหมดของฟอร์มแผน · ท้ายแถว = ถังขยะ ลบออกจากแผน (R109 · BACKLOG 86 ของเว็บ)
/* แท็บไตรมาส n (5 พ.ย. 2569 เจ้าของงาน "หน้านี้จะเห็นรถในไตรมาส แต่จะยังไม่เห็นอะใหล่ อยากให้จัดการสิ่งที่ต้องทำของรถแต่ละคัน …"
   + แก้ "ข้อ 2 ไม่ได้ให้เอาออกจากการสร้างแผน แต่ให้เอารายการอะใหล่ออก เป็น empty ก่อน แล้วค่อยให้เลือกจัดการอะใหล่ ทีละคัน แล้วค่อยเอามาลงในรายการอะใหล่ตอนจะส่งอนุมัติ …")
   ตารางรถของไตรมาสบอกสิ่งที่ต้องทำรายคัน: น้ำมันไฮดรอลิก (คำของ JOB_OIL_OPTS · บรรทัดรอง เบอร์น้ำมัน · จำนวนลิตร) · อะไหล่อื่นๆ ("n รายการ" · บรรทัดรอง ชื่อรายการแรก) · ไอคอนแก้ไข (Table cell Action icons) ไปหน้าจัดการอะไหล่ของรถ (S21)
   หัวข้อ "อะไหล่ในไตรมาส n" คงไว้ ตั้งต้นว่าง แล้วรวมจากรถที่จัดการแล้ว (qAgg) · ไม่มีปุ่มเพิ่มอะไหล่และไอคอนแถว (อะไหล่มาจากรถทีละคัน)
   6 คอลัมน์ ไม่ต้องรวมช่อง (คอลัมน์ไตรมาสของแท็บทั้งหมดไม่แสดง เพราะทุกคันอยู่ไตรมาสเดียวกัน) · มือถือ List with checkbox = สรุปอยู่บรรทัดรอง */
const Q_COLS = [['ทะเบียน', 240], ['ประเภทยานพาหนะ', 130], ['เขต / หน่วยงานเจ้าของยานพาหนะ', 0], ['น้ำมันไฮดรอลิก', 200], ['อะไหล่อื่นๆ', 200], ['', 60]];   // 6 พ.ย. 2569 ท้ายแถว = ปุ่ม … (Q_MENU) แทนไอคอนแก้ไข
/* เมนู … ของยานพาหนะในแท็บไตรมาส (6 พ.ย. 2569 เจ้าของงาน "เพิ่ม ... ดูรายละเอียด แก้ไข ลบ ของรถแต่ละคัน" + เลือกอยู่ที่ฟอร์มสร้าง/แก้ไขแผน S1 S19)
   ดูรายละเอียด = อะไหล่ของยานพาหนะคันนั้น ดูอย่างเดียว (carPartsView) · แก้ไข = หน้าจัดการอะไหล่ S21 · ย้ายไปไตรมาสอื่น = moveQModal · ลบ = ลบออกจากแผน (PLAN_OUT_CONFIRM · R109 12 พ.ย. 2569 · เดิมเอาออกจากไตรมาส กลับเป็นยังไม่จัด)
   ชุดเดียวกับ MENU ของรายการแผนและหน้ารายละเอียดแผนเดินทาง (S10 JOB_MENU) · เปิดด้วย planMenu */
// Q_MENU ย้ายไปไว้เหนือ planForm (12 พ.ย. 2569 เพิ่ม ย้ายไปไตรมาสอื่น · R109)
const TODO_NONE = 'ยังไม่กำหนด';
const OIL_SPEC = { grade: 'ISO VG 46', code: 'OL-0011', litre: '30' };   // ค่าสมมติตามน้ำมันไฮดรอลิก ISO VG 46 รหัส OL-0011 ใน PARTS
const oilCell = (k) => k == null ? TODO_NONE : { text: JOB_OIL_OPTS[k], sub: k ? OIL_SPEC.grade + ' · ' + OIL_SPEC.litre + ' ลิตร' : OIL_SPEC.grade };
const partList = (i, picks, manualCars) => (picks[i] || []).filter(x => x !== 0).map(x => PARTS[x][0]).concat(manualCars.indexOf(i) >= 0 ? [MANUAL.name] : []);
const partCell = (l) => l.length ? { text: l.length + ' รายการ', sub: l[0] + (l.length > 1 ? ' และอื่น ๆ' : '') } : TODO_NONE;
/* ตารางอะไหล่รวมตามรายการ (R81 · 6 พ.ย. 2569 เจ้าของงาน "ถ้าเพิ่ม คอลัมน์ ก็ส่งผลกระทบกับ หน้าอื่นๆที่เป็นหน้าที่เหมือนกันด้วย ตอน export ก็เกี่ยวข้องด้วย")
   ชุดเดียวใช้ทุกที่: อะไหล่ในไตรมาส (S1 S19) · อะไหล่ในแผน (S2) · อะไหล่ในไตรมาส n (หน้าไตรมาส) · แดชบอร์ดแท็บรวมตามรายการ (S4) · ไฟล์ PDF และ Excel ที่ส่งออก
   คอลัมน์ ชนิด · ประเภท · จำนวน ตามที่เจ้าของงานสั่ง (S2) + รหัสอะไหล่ (รีวิว S4 "ค้นหาจาก ชื่ออะไหล่ รหัสอะไหล่") · แถว = qAgg [ชื่อ, รหัส, ประเภท, จำนวน, หน่วย] · เพิ่ม/ลดคอลัมน์ที่นี่ที่เดียว */
const QPART_COLS = [['ชนิด', 0, 'Lead text'], ['รหัสอะไหล่', 150], ['ประเภท', 160], ['จำนวน', 120], ['หน่วย', 110]];
/* อะไหล่ในไตรมาส = รวมจากรถที่จัดการแล้ว: น้ำมันไฮดรอลิก (คันที่เปลี่ยน · 30 ลิตรต่อคัน) + อะไหล่อื่นๆ ที่เลือกจากคลัง + รายการที่ระบุเอง */
const qAgg = (cars, picks, oils, manualCars) => {
  const rows = PARTS.map((p, x) => { const n = x === 0 ? cars.filter(i => oils[i] === 1 || oils[i] === 2).length * +OIL_SPEC.litre : CAR_QTY[x] * cars.filter(i => (picks[i] || []).indexOf(x) >= 0).length; return [p[0], p[1], p[2], String(n), p[4]]; }).filter(r => +r[3] > 0);
  const m = cars.filter(i => manualCars.indexOf(i) >= 0).length;
  return m ? rows.concat([[MANUAL.name, MANUAL.code || '-', 'เพิ่มเอง', String(MANUAL.qty * m), 'ชิ้น']]) : rows;
};
const inArea = (c, f) => (!f.regions.length || f.regions.indexOf(regionOf(c)) >= 0) && (!f.districts.length || f.districts.indexOf(dCode(c)) >= 0) && (!f.types.length || f.types.indexOf(typeOf(c)) >= 0);
const inQuery = (c, f) => !f.query || (c[0] + ' ' + c[1]).indexOf(f.query) >= 0;
/* popup จัดลงไตรมาส — popupModal (Modal header + Radio text card เรียงลง 4 ใบ + Modal footer · ตามโครง popup ของ S6) · มือถือ = bottom sheet · ปุ่ม ยืนยัน Disabled จนกว่าจะเลือก */
const ALL_Q_PARTS_EMPTY = 'จัดการอะไหล่ทีละคันจากปุ่ม … ที่แถวยานพาหนะในแท็บไตรมาส รายการจะรวมมาที่นี่';   // แท็บทั้งหมด ยังไม่มีอะไหล่สักคัน (9 พ.ย. 2569 · ข้อความเสนอ)
/* ฟอร์มแผน S1 S19 แบบเลือกยานพาหนะผ่าน modal (เจ้าของงาน 12 พ.ย. 2569 ส่งภาพ modal "เพิ่มรถเข้า Purchase Order" ของ Overhaul + "หน้าจอเลือกรถ อยากให้เป็น modal ตามรูป แก้ใน flow ด้วย"
   เคาะ: ยานพาหนะที่เลือกเข้าไตรมาสที่เปิดอยู่ทันที) — R109 · แทนแบบ A (5 พ.ย. 2569 ตารางยานพาหนะของพื้นที่ในหน้า + แผงตัวกรอง R77 + ติ๊กแล้วจัดลงไตรมาส)
   หัวข้อ "ยานพาหนะในแผน" Badge "ในแผน n คัน" + Tabs ทั้งหมด · ไตรมาส 1–4 · แท็บไตรมาส: Table header หัว + Badge กำหนดอะไหล่แล้ว + ค้นหา + ปุ่ม "เพิ่มยานพาหนะ" (o.add แทนตัวกรอง) · เมนู … ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น ลบ
   แท็บทั้งหมด: ทุกคันในแผน + ป้ายไตรมาส + ถังขยะท้ายแถว (ลบออกจากแผน · BACKLOG 86 ของเว็บ) ไม่มีปุ่มตัวกรอง/เพิ่ม · ไม่มีสถานะ "ยังไม่จัด" แล้ว (ทุกคันในแผนอยู่ในไตรมาส)
   o.pick = เปิด modal เพิ่มยานพาหนะ (planCarModal) · o.move = popup ย้ายไปไตรมาสอื่น { car, cur, sel } */
const Q_MENU = [MENU[0], MENU[1], ['ย้ายไปไตรมาสอื่น', 'swap_driving_apps_wheel-24-300-round'], MENU[2]];   // ไอคอนเดียวกับ MOVE_ITEM ของ S25
const PLAN_OUT_CONFIRM = (c, q) => ({ danger: true, title: 'ยืนยันการลบยานพาหนะออกจากแผน', sub: c[0] + ' จะออกจากไตรมาส ' + q + ' และไม่อยู่ในแผนนี้ เพิ่มกลับได้จากปุ่มเพิ่มยานพาหนะ', cancel: 'ยกเลิก', ok: 'ลบ' });   // ข้อความชุดเดียวกับเว็บ BACKLOG 86
async function noCarsInPlan() {
  const es = inst('Empty state/Data empty');
  await text(es, 'Text', 'ยังไม่มียานพาหนะในแผน'); await text(es, 'Supporting text', 'เปิดแท็บไตรมาสแล้วกดเพิ่มยานพาหนะ');
  const a = find(es, 'Actions'); if (a) a.visible = false;
  return emptyGraphic(es, 'empty-vehicle');
}
async function planForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const heading = o.edit ? 'แก้ไขแผน ' + NEW_PLAN[0] : 'สร้างแผนบำรุงรักษา';
  const { scr, page } = await shell(name, { title: heading, back: true, crumbs: [o.edit ? heading : 'สร้างแผน'] });
  const alloc = o.alloc || {}, q = o.q || 0, nIn = Object.keys(alloc).length, query = o.query || '';
  const yr = o.edit ? field('ปีงบประมาณ', v.year, { state: 'Readonly' })
    : dropdown('ปีงบประมาณ', v.year || '', { placeholder: 'เลือกปีงบประมาณ', error: E('กรุณาเลือกปีงบประมาณ'), state: o.yearOpen ? 'Focused' : undefined });
  const draw = o.draw || {};
  const carSec = col('Section', [await section('ยานพาหนะในแผน', { badge: 'ในแผน ' + nIn + ' คัน' })], 16);
  const pool = PICK_POOL();   // ยานพาหนะในแผนมาจากรายการเดียวกับ modal (ลำดับ 0–9 = CAND · ต่อด้วยยานพาหนะนอกพื้นที่ เช่น กองของ สนง. · 13 พ.ย. 2569 S1 A3)
  const inQ = (k) => pool.map((c, i) => [c, i]).filter(([, i]) => alloc[i] === k);
  const inPlan = pool.map((c, i) => [c, i]).filter(([, i]) => alloc[i]);
  add(carSec, await tabs([['ทั้งหมด', nIn]].concat(QUARTERS.map((t, k) => ['ไตรมาส ' + (k + 1), inQ(k + 1).length])), q), 'h');
  const shown = (q ? inQ(q) : inPlan).filter(([c]) => inQuery(c, { query }));
  /* 6 พ.ย. 2569 เจ้าของงาน "บังคับให้กรอกอะใหล่ทุกคัน" ⇒ แท็บไตรมาสบอกกำหนดอะไหล่แล้วกี่คัน (กำหนด = เลือกไม่เบิก หรือเบิกแล้วมีรายการ) */
  const decided = (i) => draw[i] === 'none' || ((o.picks || {})[i] || []).length > 0 || (o.manualCars || []).indexOf(i) >= 0;
  const qDone = q ? inQ(q).filter(([, i]) => decided(i)).length : 0;
  add(carSec, await tableHeader(q ? { title: 'ยานพาหนะในไตรมาส ' + q, badge: 'กำหนดอะไหล่แล้ว ' + qDone + '/' + inQ(q).length + ' คัน', placeholder: 'เลขทะเบียน, ยี่ห้อ, รุ่น', query, add: 'เพิ่มยานพาหนะ' }
    : { title: 'ยานพาหนะทั้งหมดในแผน', badge: nIn + ' คัน', placeholder: 'เลขทะเบียน, ยี่ห้อ, รุ่น', query, noFilter: true }), 'h');
  if (shown.length) {
    const oils = o.oils || {}, picks = o.picks || {}, manualCars = o.manualCars || [];
    const rows = q
      ? shown.map(([c, i]) => { const pl = partList(i, picks, manualCars), oc = oilCell(oils[i]); const pc = draw[i] === 'none' ? 'ไม่เบิกอะไหล่' : partCell(pl); return [{ text: c[0], sub: MOB ? 'น้ำมัน ' + (oc.text || oc) + ' · อะไหล่อื่นๆ ' + (pc.text || pc) : c[1] }, typeOf(c), c[2], oc, pc, { menu: 1, items: Q_MENU }]; })
      : shown.map(([c, i]) => [{ text: c[0], sub: MOB ? c[1] + ' · ไตรมาส ' + alloc[i] : c[1] }, typeOf(c), c[2], { pill: ['ไตรมาส ' + alloc[i], 'Brand'] }, { icons: ['delete-24-300-round'] }]);
    add(carSec, await tblShort(q ? Q_COLS : PICK_COLS, rows, { pagination: rows.length }), 'h');
  } else if (query) add(carSec, await searchNotFound(), 'h');   // ไม่มีคันตรงคำค้น = Vehicle list - Search not found ของ UI Release#2
  else if (q) add(carSec, await noCarsInQ(q), 'h');
  else add(carSec, await noCarsInPlan(), 'h');
  /* อะไหล่ในไตรมาส n — 5 พ.ย. 2569 เจ้าของงาน "ให้เอารายการอะใหล่ออก เป็น empty ก่อน แล้วค่อยให้เลือกจัดการอะใหล่ ทีละคัน แล้วค่อยเอามาลงในรายการอะใหล่ตอนจะส่งอนุมัติ"
     9 พ.ย. 2569 เจ้าของงาน _"หน้าอะใหล่ทั้งไตรมาส ต้องรวมมาให้ด้วย ทั้งไตรมาส"_ ⇒ แท็บทั้งหมด = หัวข้อ "อะไหล่รวมทุกไตรมาส" รวมอะไหล่ของยานพาหนะทุกคันในแผน (qAgg บวกรายคัน) · คันที่ไม่เบิกไม่รวม */
  const inQs = Object.keys(alloc).map(Number).filter(i => !q || alloc[i] === q);
  const qRows = qAgg(inQs.filter(i => draw[i] !== 'none'), o.picks || {}, o.oils || {}, o.manualCars || []);
  const partsSec = col('Section', [await section(q ? 'อะไหล่ในไตรมาส ' + q : 'อะไหล่รวมทุกไตรมาส')], 16);   // 9 พ.ย. 2569 เจ้าของงาน "เอาเลขออกไปเลยได้ป่ะ" ⇒ ไม่มีตัวเลขจำนวนชนิด
  add(partsSec, qRows.length ? await tblShort(QPART_COLS, qRows) :
    await noParts(!q ? ALL_Q_PARTS_EMPTY : inQs.length ? 'จัดการอะไหล่ทีละคันจากปุ่ม … ที่แถวยานพาหนะ รายการจะรวมมาที่นี่' : 'เพิ่มยานพาหนะเข้าไตรมาสนี้ก่อน แล้วจึงจัดการอะไหล่ทีละคันได้'), 'h');
  /* รีวิว 5 พ.ย. 2569 "ต้องกรอกข้อมูลที่ require ครบถึงจะ enable ปุ่ม" + 6 พ.ย. 2569 "บังคับให้กรอกอะใหล่ทุกคัน"
     ⇒ ปุ่มบันทึกและส่งอนุมัติกดได้เมื่อ ชื่อแผน · ปีงบประมาณ · มียานพาหนะในแผนอย่างน้อย 1 คัน · ทุกคันกำหนดอะไหล่แล้ว (เบิกพร้อมรายการ หรือ ไม่เบิก)
     12 พ.ย. 2569 (R109) ตัดเงื่อนไข "ยานพาหนะในตารางต้องจัดครบ" (9 พ.ย. ค่ำ) — เพิ่มจาก modal เข้าไตรมาสทันที ไม่มีคันที่อยู่ในแผนแต่ยังไม่จัด */
  const complete = !!(v.name && v.year && nIn > 0 && Object.keys(alloc).every(i => decided(+i)));
  add(page, col('Content', (o.alert ? [alertBox(...o.alert)] : []).concat([
    col('Section', [await section('ข้อมูลแผน'),
      row('Row', [field('ชื่อแผน', v.name, { placeholder: 'ระบุชื่อแผน', error: E('กรุณาระบุชื่อแผน') }), yr])], 16),
    carSec,
    partsSec,
    btnRow([['Secondary button', o.edit ? 'ยกเลิก' : 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกและส่งอนุมัติ', { size: 'lg', disabled: !complete }]])
  ]), 32), 'h');
  if (o.yearOpen) comboAt(scr, yr.findOne(n => n.name === 'Container') || yr, YEARS.map(y => [y, '', y === v.year]));
  if (o.pick) await planCarModal(scr, Object.assign({ q: q || 1, alloc }, o.pick));
  if (o.move) await moveQModal(scr, o.move);
  return scr;
}
/* modal "เพิ่มยานพาหนะเข้าไตรมาส n" (R109) — โครงตาม vehPickerModal ของปลั๊กอิน Overhaul (ภาพ "เพิ่มรถเข้า Purchase Order" ที่เจ้าของงานส่ง 12 พ.ย. 2569):
   Background overlay + กรอบ Modal 1140 (Modal Size=xl) + Modal header Alignment=Left ปุ่มปิด + Table header (ค้นหา + ปุ่มตัวกรอง Pill จำนวน + ชิป)
   + แผงตัวกรองกางในตัว modal (Input dropdown with badges ×3 ภาค เขต ประเภทยานพาหนะ placeholder "ทั้งหมด" + Tertiary ล้างตัวกรอง · Secondary ยกเลิก · Primary ตกลง — ไลบรารีไม่มีแผงตัวกรองใน Modal ทั้งก้อน แบบเดียวกับ R92 ของ Overhaul)
   + Table Lead checkbox ติ๊กทั้งหมดที่หัว (headCheck · indeterminate) + Table pagination หน้าละ 10 + Modal footer ยกเลิก / "เพิ่มเข้าไตรมาส n (k)"
   คอลัมน์ชุดเดียวกับ TripCarPicker ของเว็บ: ทะเบียน (บรรทัดรอง หน่วยงานเจ้าของยานพาหนะ) · ยี่ห้อ/รุ่น · บำรุงรักษาเครื่องจักรล่าสุด · ซ่อมเครื่องจักรล่าสุด
   ยานพาหนะ = ทุกคันที่ยังไม่อยู่ในแผนนี้ (X5 เพิ่มได้ทุกคัน) · มือถือ = bottom sheet (popupModal) · แผงตัวกรองบนมือถือ = filterPanel bottom sheet แบบเดิม
   o.filter = { regions, districts, types, open } แผงกางอยู่ · o.regions/districts/types = ตัวกรองที่กดตกลงแล้ว · o.query · o.ticked = ลำดับใน PICK_POOL() · o.full = ทุกคันอยู่ในแผนแล้ว */
const PICK_POOL = () => CAND.map(c => c.slice(0, 3)).concat(Q_EXTRA.map(c => c.slice(0, 3)));   // ฟังก์ชัน: Q_EXTRA ประกาศทีหลังในไฟล์   // ลำดับ 0–9 = CAND (ลำดับเดียวกับ alloc) · ต่อด้วยยานพาหนะนอกพื้นที่ของ E.19
const MA_HEAD = 'บำรุงรักษาเครื่องจักรล่าสุด', REPAIR_HEAD = 'ซ่อมเครื่องจักรล่าสุด', NO_HIST = 'ไม่มีข้อมูล';   // = vehicleHistory.ts ของเว็บ (BACKLOG 64)
const PICK_MODAL_COLS = [['ทะเบียน', 260], ['ยี่ห้อ/รุ่น', 0], [MA_HEAD, 220], [REPAIR_HEAD, 200]];
/* วันที่ของเครื่องจักร (ค่าสมมติ สูตรเดียวกับ vehicleHistory.ts ของเว็บ) — ค่าของ S24 ก่อน · ที่เหลือคำนวณจากลำดับ · ทุก 9 คันไม่มีประวัติบำรุงรักษา ทุก 5 คันไม่มีประวัติซ่อม */
const HIST_MA = { '82-1145': '18/06/2569', '81-2210': NO_HIST, '82-6789': NO_HIST, '80-4458': '01/10/2568', '82-7720': '02/02/2569' }, HIST_RP = { '82-1145': '02/09/2569' };
const histDate = (d, m, y) => String(d).padStart(2, '0') + '/' + String(y === 2569 && m > 10 ? m - 6 : m).padStart(2, '0') + '/' + y;
const lastMa = (c, i) => HIST_MA[c[0].split(' ')[0]] || (i % 9 === 4 ? NO_HIST : histDate(1 + ((i * 11) % 28), 1 + ((i * 7) % 12), 2567 + (i % 3)));
const lastRepair = (c, i) => HIST_RP[c[0].split(' ')[0]] || (i % 5 === 2 ? NO_HIST : histDate(1 + ((i * 13) % 28), 1 + ((i * 5) % 12), 2566 + (i % 4)));
const PICK_SEARCH = 'ค้นหาทะเบียน, ยี่ห้อ/รุ่น, หน่วยงาน';
async function planCarModal(scr, o) {
  const f = { regions: o.regions || [], districts: o.districts || [], types: o.types || [], query: o.query || '' };
  const picked = f.regions.length || f.districts.length || f.types.length, alloc = o.alloc || {}, ticked = o.ticked || [];
  const pool = o.full ? [] : PICK_POOL().map((c, i) => [c, i]).filter(([c, i]) => !alloc[i] && (!picked || inArea(c, f)) && inQuery(c, f));
  const shown = pool.slice(0, 10), total = picked || f.query ? pool.length : Q_EXTRA_TOTAL;   // ยังไม่กรอง = ทุกคันที่ยังไม่อยู่ในแผน (ค่าสมมติ 370 แบบ E.19)
  const rows = shown.map(([c, i]) => [{ check: ticked.indexOf(i) >= 0, text: c[0], sub: c[2] }, c[1], lastMa(c, i), lastRepair(c, i)]);
  const chips = f.regions.map(shortRegion).concat(f.districts, f.types), n = ticked.length;
  /* 13 พ.ย. 2569 เจ้าของงาน "ใน modal ต้องมี filter แบบ ที่ตอนเลือก filter ของเดิม" + เลือก "ช่องเดิม S1 + กางไว้ตั้งแต่เปิด" ⇒ desktop แผงกางเสมอ (ค่าในช่อง = ที่ใช้อยู่ หรือ o.filter ค่าร่าง) ชิปซ่อนระหว่างแผงกาง (แบบเว็บ TripCarPicker) · o.collapsed = กดปุ่มตัวกรองหุบแล้ว · มือถือ = bottom sheet เมื่อส่ง o.filter */
  const panel = !MOB && !o.collapsed;
  const fd = o.filter ? { regions: o.filter.regions || [], districts: o.filter.districts || [], types: o.filter.types || [], open: o.filter.open } : panel ? { regions: f.regions, districts: f.districts, types: f.types } : null;
  const body = [await tableHeader({ placeholder: PICK_SEARCH, query: f.query, chips: panel ? [] : chips, filterCount: chips.length })];
  const fields = fd && [multiDropdown('ภาค', fd.regions, { placeholder: 'ทั้งหมด', optional: true, state: fd.open === 'region' ? 'Focused' : undefined }),
    multiDropdown('เขต', fd.districts, { placeholder: 'ทั้งหมด', optional: true, state: fd.open === 'district' ? 'Focused' : undefined }),
    multiDropdown('ประเภทยานพาหนะ', fd.types, { placeholder: 'ทั้งหมด', optional: true })];
  if (fd && !MOB) body.push(col('Filter panel', [row('Row', fields), btnRow([['Tertiary button', 'ล้างตัวกรอง'], ['Secondary button', 'ยกเลิก'], ['Primary button', 'ตกลง']])], 20));
  if (rows.length) { const t = await tblShort(PICK_MODAL_COLS, rows, { pagination: { shown: rows.length, total } }); headCheck(t, rows); body.push(t); }
  else if (o.full) { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยานพาหนะทุกคันอยู่ในแผนแล้ว'); await text(es, 'Supporting text', 'ไม่มียานพาหนะที่เพิ่มเข้าแผนนี้ได้'); const a = find(es, 'Actions'); if (a) a.visible = false; body.push(es); }
  else body.push(await searchNotFound());
  if (fd && MOB) { await filterPanel(scr, fields); }   // มือถือ: แผงตัวกรอง bottom sheet ทับฟอร์ม (แบบเดิม R77)
  else await popupModal(scr, { title: 'เพิ่มยานพาหนะเข้าไตรมาส ' + o.q, sub: 'ยานพาหนะที่ยังไม่อยู่ในแผนนี้ เพิ่มได้ทุกคัน', w: 1140, body, ok: 'เพิ่มเข้าไตรมาส ' + o.q + (n ? ' (' + n + ')' : ''), okOff: !n });
  if (fd) {
    const at = (x) => x.findOne(y => y.name === 'Container') || x;
    if (fd.open === 'region') comboAt(scr, at(fields[0]), REGIONS.map(r => [r, '', fd.regions.indexOf(r) >= 0]));
    if (fd.open === 'district') comboAt(scr, at(fields[1]), (fd.regions.length ? fd.regions : REGIONS).flatMap(r => DISTRICTS[r]).map(d => [d, '', fd.districts.indexOf(d) >= 0]));   // เขตของทุกภาคที่เลือกรวมกัน · สนง. = 6 กอง (X3)
  }
}
/* popup ย้ายไปไตรมาสอื่น (R109 · เมนู … ของยานพาหนะในแท็บไตรมาส) — Radio text card ไตรมาส 1–4 แบบ popup จัดลงไตรมาสเดิม · ไตรมาสปัจจุบันของคันนั้น State=Disabled */
async function moveQModal(scr, o) {
  const c = CAND[o.car], sel = o.sel == null ? -1 : o.sel;
  const r = col('Radio', [], 12);
  QUARTERS.forEach((t, k) => add(r, inst('Radio text card', { State: k + 1 === o.cur ? 'Disabled' : 'Default', Selected: k === sel ? 'True' : 'False' }, { Text: t, Supporting: k + 1 === o.cur, 'Supporting text': 'ไตรมาสปัจจุบัน' }), 'h'));
  await popupModal(scr, { title: 'ย้ายไปไตรมาสอื่น · ' + c[0], sub: 'ยานพาหนะและอะไหล่ที่กำหนดไว้ของยานพาหนะคันนี้จะย้ายไปไตรมาสที่เลือก', body: [r], ok: 'ย้ายยานพาหนะ', okOff: sel < 0 });
}
const FILLED = { name: NEW_PLAN[1], year: '2570' };
const R2 = { regions: [REGIONS[1]] };   // พื้นที่ที่เลือก: ภาค 2 ทุกเขต → ตารางรถ 8 คัน (แบบ A 5 พ.ย. 2569)
const A_Q1 = { 0: 1, 1: 1, 2: 1 };                          // แท็บไตรมาส 1: เลือกไว้ 3 คัน
const A_PICKS = { 0: CAR_PICK, 1: CAR_PICK, 2: CAR_PICK, 3: CAR_PICK, 5: CAR_PICK, 6: CAR_PICK, 7: CAR_PICK, 8: CAR_PICK, 9: CAR_PICK };
const A_OILS = { 0: 2, 1: 0, 2: 2, 3: 0, 4: 0, 5: 1, 6: 0, 7: 0, 8: 1, 9: 0 };   // 5 พ.ย. 2569 82-6789 = เก็บตัวอย่างและเปลี่ยน ให้ตรงงานตัวอย่าง S10 (TRIP_OIL)   // น้ำมันไฮดรอลิกรายคัน (ลำดับใน JOB_OIL_OPTS) ที่กำหนดแล้ว · 5 พ.ย. 2569   // เลือกอะไหล่ครบทุกคันแล้ว
const Q3_ADD = [3, 5];   // R75 ติ๊กเพิ่มเข้าไตรมาส 3: 82-4410 ขอนแก่น · 84-5521 นครราชสีมา
const A_ALL = { 0: 1, 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 3, 7: 4, 8: 4, 9: 3 };   // 6 พ.ย. 2569 เจ้าของงาน "ต้องเอารถเข้า ไตรมาสทุกคัน" ⇒ รถทุกคันของหน่วยงาน (CAND 10 คัน) อยู่ในไตรมาส · เดิม 6 คัน ไตรมาส 4 ว่าง
/* การเบิกอะไหล่รายคัน (6 พ.ย. 2569 เจ้าของงาน "อยากเพิ่มการเบิก โดยอยากให้มีการเลือกว่า ว่าเบิกอะใหล่ หรือไม่เบิก ด้วย") · { ลำดับรถ: 'none' } = ไม่เบิกอะไหล่ · ไม่มีในนี้แต่มีอะไหล่ = เบิกอะไหล่ */
const A_DRAW = { 4: 'none' };       // จัดครบ: ไตรมาส 1 3 คัน · ไตรมาส 2 2 คัน · ไตรมาส 3 1 คัน · ไตรมาส 4 ว่าง · รถซ่อม (83-1207) ไม่อยู่ในแผน · มีรถจากเขตอื่น (สลับเขตแล้วเพิ่มต่อ)

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
  const Q = o.q || NOW_Q, need = (i) => o.qty ? o.qty[i] : +PARTS[i][3], lack = (i) => o.qty ? Math.max(0, need(i) - +PARTS[i][5]) : shortOf(i);   // S25 (5 พ.ย. 2569): o.q = ไตรมาสอื่น · o.qty = จำนวนที่ต้องเบิกแทน PARTS · o.subs = { ลำดับอะไหล่: บรรทัดรอง } · o.cars = จำนวนรถของไตรมาส
  const st = (i) => o.result === 'ok' ? WD.taken : o.result === 'short' ? (shortOf(i) > 0 ? WD.buy : WD.reserved) : WD.wait;
  const { scr, page } = await shell(name, { title: 'ความคืบหน้าอะไหล่ · ' + Q, back: true, crumbs: [P[1], Q, 'ความคืบหน้าอะไหล่'] });   // 5 พ.ย. 2569 ต่อจากหน้า "ไตรมาส 1"
  const nodes = [alertBox('Info', 'คลังรับทราบรายการอะไหล่' + Q + ' แล้ว', 'ยานพาหนะ ' + (o.cars || NOW_CARS) + ' คันของไตรมาสนี้ · คลังรับทราบ 02/11/2569')];
  if (down) nodes.push(alertBox('Error', 'เชื่อมต่อ Smart Inventory ไม่ได้', 'ยังดูคงเหลือและเบิก/จองไม่ได้ ลองใหม่อีกครั้ง'));
  if (o.result === 'short') nodes.push(alertBox('Warning', 'จองได้ ' + picked.filter(i => !shortOf(i)).length + ' รายการ · คงเหลือไม่พอ ' + picked.filter(i => shortOf(i)).length + ' รายการ', 'ไส้กรองไฮดรอลิก ขาด ' + shortOf(1) + ' ชิ้น · ไส้กรองเชื้อเพลิง ขาด ' + shortOf(4) + ' ชิ้น — รอจัดซื้อแล้วเข้าคลัง'));
  if (o.result === 'ok') nodes.push(alertBox('Success', 'เบิกอะไหล่ครบแล้ว', 'เบิกจาก Smart Inventory ' + picked.length + ' รายการ · ไปทำแผนเดินทางของไตรมาสได้'));
  const sec = col('Section', [await sectionLabel('อะไหล่ที่ต้องเบิกใน' + Q, { badge: picked.length || null })], 16);
  if (picked.length) add(sec, await tblShort(PROG_COLS, picked.map(i => [(o.subs || {})[i] ? { text: PARTS[i][0], sub: o.subs[i] } : PARTS[i][0], PARTS[i][1], String(need(i)), PARTS[i][4], down ? '-' : PARTS[i][5], down || o.result === 'ok' || !lack(i) ? '-' : String(lack(i)), { pill: st(i) }])), 'h');
  else add(sec, await noParts('ไตรมาสนี้ยังไม่มีอะไหล่ในแผน เพิ่มอะไหล่ได้ที่แก้ไขแผน'), 'h');
  nodes.push(sec);
  // 3 พ.ย. 2569 เจ้าของงาน: ถอดการ์ดรูปแบบดำเนินการออกจาก S4 — ย้ายไปเลือกในฟอร์มแผนเดินทาง (S6 ดำเนินการเอง / S9 จ้างดำเนินการ) · ปุ่ม "ไปทำแผนเดินทาง" พาไปหน้าแผนเดินทางของไตรมาส
  nodes.push(btnRow(o.result === 'ok' ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ไปทำแผนเดินทาง', { size: 'lg' }]]
    : o.result === 'short' ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ไปทำแผนเดินทาง', { size: 'lg', disabled: true }]]
    : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'เบิก/จองอะไหล่', { size: 'lg', disabled: !picked.length || down }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- แดชบอร์ดแบบ VMS+ — ชุดวาดกราฟ/การ์ด (R106 · เจ้าของงาน 12 พ.ย. 2569) ----------
   เจ้าของงาน 12 พ.ย. 2569: "อยากให้ออกแบบเป็นสไตล์นี้ เฉยๆ วิธีการวิชชัลข้อมูล หรือวิธีการแสดงข้อมูล โดยไม่ต้องตรง component ของ pea ให้เฉพาะ dashboard ที่ทำสิ่งนี้ได้ หน้าอื่นๆ ยังคงต้องตาม component เหมือนเดิม"
   + "จากข้อมูลที่ได้มา อยากให้ปรับข้อมูลการแสดงให้สอดคล้องกับเรื่องการบำรุงรักษา" · ต้นแบบหน้าตา vmsplus.pea.co.th/dashboard (ภาพ + SPEC-maintenance-dashboards.md ใน ~/PEA/Maintain-D/userflow/figma-ref/vmsplus-dashboard-2569-11-12/)
   ข้อยกเว้นเฉพาะ S4 (บล็อก C) และ S24 (บล็อก W) — ชิ้นที่วาดเอง (สี่เหลี่ยม วงกลม/ส่วนโค้ง ข้อความ) ต้องอยู่ในกรอบชื่อขึ้นต้น DASH_BOX เท่านั้น ตัวตรวจ R106 ไม่ผ่านถ้าวาดนอกกรอบหรือนอกสองหน้านี้
   กรอบหน้า (Sidebar navigation · Header navigation · Page header) Tabs · Table header · Table · ปุ่ม · ป้าย · Featured icon · ไอคอน ยังเป็น instance ของไลบรารี
   สีทุกชิ้นผูกตัวแปรสีของไลบรารี (Color/surface|text|icon|border/…) ตอนจบจอด้วย bindDash() แบบ bindTones() — หาไม่ได้ใช้ค่าสีของตัวแปรนั้น (ค่าจากไฟล์ Component)
   การ์ดตัวเลขไล่เฉดใช้ค่าสีของตัวแปรคู่เดียวกัน (gradient stop ผูกตัวแปรไม่ได้) · ข้อความใช้ docText (IBM Plex Sans Thai ของโปรเจกต์) */
const DASH_BOX = { head: 'VMS+ head · ', alert: 'VMS+ alert · ', kpi: 'VMS+ KPI · ', chart: 'VMS+ chart · ', note: 'VMS+ note · ' };   // ชื่อกรอบที่ R106 ยอมให้มีชิ้นวาดเอง
const DASH_SCR = /^MT \/ (C\.\d+ · S4|W\.\d+ · S24) — /, DASH_IN = /^VMS\+ (head|alert|KPI|chart|note) · /;   // ตรงกับ drawnShapes ใน component-rules.json
/* [ตัวแปรสีของไลบรารี, ค่าสีของตัวแปรนั้นในไฟล์ Component] — สเกล brand / success / warning / error / info (ฟ้า) / gray เท่านั้น */
const VC = {
  brand: ['Color/surface/brand', '#A80689'], brand2: ['Color/icon/brand-secondary', '#CF07AA'], brandT: ['Color/text/brand', '#A80689'],
  success: ['Color/surface/success', '#17B26A'], successD: ['Color/icon/success', '#079455'],
  warning: ['Color/surface/warning', '#F79009'], warningT: ['Color/text/warning', '#DC6803'], warningBg: ['Color/surface/warning-secondary', '#FFFAEB'], warningLine: ['Color/border/warning', '#FEDF89'],
  error: ['Color/surface/error', '#F04438'], errorT: ['Color/text/error', '#D92D20'],
  info: ['Color/surface/info', '#6172F3'], infoT: ['Color/text/info', '#444CE7'], infoBg: ['Color/surface/info-secondary', '#EEF4FF'], infoLine: ['Color/border/info', '#C7D7FE'],
  gray: ['Color/icon/secondary', '#667085'], track: ['Color/surface/tertiary', '#EAECF0'], subtle: ['Color/surface/secondary-subtle', '#F9FAFB'], line: ['Color/border/secondary', '#EAECF0'],
  text: ['Color/text/primary', '#000000'], text2: ['Color/text/secondary', '#475467'], text3: ['Color/text/placeholder', '#98A2B3'], white: ['Color/surface/primary', '#FFFFFF'], onBrand: ['Color/text/primary-on-brand', '#FFFFFF']
};
const DASH_GRAD = { brand: ['brand', 'brand2'], success: ['successD', 'success'], warning: ['warningT', 'warning'], error: ['errorT', 'error'], info: ['infoT', 'info'], gray: ['text2', 'gray'] };   // การ์ดตัวเลข เข้ม → อ่อน
const DASH_TONES = ['brand', 'info', 'success', 'warning', 'error', 'gray'];   // สีแถวของกราฟแถบ (วนตามลำดับแบบ VMS+)
const dashAsof = () => 'ข้อมูล ณ ' + MA_TODAY.map((v, i) => i < 2 ? String(v).padStart(2, '0') : String(v)).join('/') + ' 07:00 น.';   // วันนี้ของข้อมูลสมมติ (MA_TODAY ของ S24)
const DASH_ARROW = 'keyboard_arrow_right-20-400-round';
let DASH_BIND = [];
const DASH_VAR = {};
const dSolid = (k) => ({ type: 'SOLID', color: rgbOf(VC[k][1]) });
function dPaint(n, k, prop) { n[prop || 'fills'] = [dSolid(k)]; DASH_BIND.push([n, prop || 'fills', k]); return n; }
async function bindDash() {   // ผูกตัวแปรสีของไลบรารีหลังประกอบจอ (แบบ bindTones) — หาไม่ได้คงค่าสี
  const list = DASH_BIND; DASH_BIND = [];
  for (const [n, p, k] of list) {
    if (!(k in DASH_VAR)) DASH_VAR[k] = await libVar(new RegExp('^' + VC[k][0].replace(/\//g, '\\/') + '$', 'i'));
    const v = DASH_VAR[k]; if (!v) continue;
    try { n[p] = [figma.variables.setBoundVariableForPaint(dSolid(k), 'color', v)]; } catch (e) { /* คงค่าสี */ }
  }
}
function dGrad(n, tone) {   // ไล่เฉดซ้าย → ขวา ของการ์ดตัวเลข
  const [a, b] = DASH_GRAD[tone] || DASH_GRAD.brand, c = (k) => Object.assign({ a: 1 }, rgbOf(VC[k][1]));
  n.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: c(a) }, { position: 1, color: c(b) }] }];
  return n;
}
async function dT(s, size, k, bold) { const t = await docText(String(s), size, VC[k][1], null, !bold); t.name = String(s).slice(0, 40); DASH_BIND.push([t, 'fills', k]); return t; }
function dF(name, dir, o) {
  o = o || {};
  const f = frame(name, dir, { gap: o.gap || 0, pad: o.pad || 0 });
  if (o.fill) dPaint(f, o.fill);
  if (o.stroke) { dPaint(f, o.stroke, 'strokes'); f.strokeWeight = o.sw || 1; f.strokeAlign = 'INSIDE'; }
  if (o.r) f.cornerRadius = o.r;
  if (dir === 'HORIZONTAL') f.counterAxisAlignItems = o.align || 'CENTER';
  return f;
}
function dAp(p, c, how) {   // grow = ยืดตามแกนหลัก · fill = เต็มกว้าง · stretch = สูงเท่าเพื่อนในแถว
  if (!c) return c;
  p.appendChild(c);
  try {
    if (how === 'grow') { c.layoutGrow = 1; if (c.type === 'TEXT') c.textAutoResize = 'HEIGHT'; }
    else if (how === 'fill') { c.layoutSizingHorizontal = 'FILL'; if (c.type === 'TEXT') c.textAutoResize = 'HEIGHT'; }
    else if (how === 'stretch') c.layoutAlign = 'STRETCH';
  } catch (e) { warn('จัดวางแดชบอร์ด ' + c.name, e); }
  return c;
}
function dFixW(f, w) { if (f.layoutMode === 'VERTICAL') f.counterAxisSizingMode = 'FIXED'; else f.primaryAxisSizingMode = 'FIXED'; f.resize(Math.max(1, Math.round(w)), Math.max(1, f.height || 1)); return f; }
function dRect(w, h, k, r) { const n = figma.createRectangle(); CREATED.push(n); n.name = 'แถบ'; n.resize(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); if (r) n.cornerRadius = r; dPaint(n, k); return n; }
function dDot(k, d) { const e = figma.createEllipse(); CREATED.push(e); e.name = 'จุดสี'; e.resize(d || 8, d || 8); dPaint(e, k); return e; }
async function dTxtW(s, size, k, w, align, bold) { const t = await dT(s, size, k, bold); t.textAutoResize = 'HEIGHT'; t.resize(Math.max(1, Math.round(w)), t.height || size + 6); t.textAlignHorizontal = align || 'LEFT'; return t; }
function fIcon(color, name, size) { const fi = inst('Featured icon', { Color: color, Size: size || 'sm' }); if (name && has(name)) setProps(fi, { 'Icon swap': icon(name) }); return fi; }
function wIcon(name) {   // ไอคอนของไลบรารีสีขาวบนการ์ดไล่เฉด (override สีชั้นใน instance)
  if (!name || !has(name)) return null;
  const ic = inst(name);
  ic.findAll(n => /VECTOR|BOOLEAN_OPERATION|ELLIPSE|RECTANGLE|POLYGON|STAR/.test(n.type) && (n.fills || []).length).forEach(v => { try { dPaint(v, 'onBrand'); } catch (e) { /* คงสีเดิม */ } });
  return ic;
}
const dFmt = (n) => Number(n).toLocaleString('en-US');
const dPct = (v, t) => (t ? (v * 100 / t).toFixed(1) : '0.0') + '%';
function dashW(scr) {   // กว้างเนื้อหาของหน้า (จอ − Sidebar − ขอบ 32 สองข้าง) · มือถือ 402 − 32
  if (MOB) return VW() - 32;
  const sb = scr.findOne(n => n.type === 'INSTANCE' && n.name === 'Sidebar navigation');
  return 1440 - (sb && sb.width > 40 && sb.width < 400 ? Math.round(sb.width) : 80) - 64;
}
/* หัวแดชบอร์ด: กรอบไอคอนสี + ชื่อ + บรรทัดอธิบาย · ขวา ป้าย "ข้อมูล ณ …" จุดเขียว */
async function dashHead(o) {
  const h = dF(DASH_BOX.head + o.title, MOB ? 'VERTICAL' : 'HORIZONTAL', { gap: 16 });
  const left = dF('ชื่อ', 'HORIZONTAL', { gap: 16, align: 'MIN' });
  dAp(left, fIcon('Brand', o.icon, 'md'));
  const tx = dF('ข้อความ', 'VERTICAL', { gap: 4 });
  dAp(tx, await dT(o.title, MOB ? 20 : 24, 'text', true), 'fill'); dAp(tx, await dT(o.desc, MOB ? 12 : 14, 'text2'), 'fill');
  dAp(left, tx, 'grow'); dAp(h, left, MOB ? 'fill' : 'grow');
  const asof = dF('ข้อมูล ณ', 'HORIZONTAL', { gap: 8, pad: [6, 12], r: 999, stroke: 'line', fill: 'white' });
  dAp(asof, dDot('success', 8)); dAp(asof, await dT(dashAsof(), 12, 'text2'));
  dAp(h, asof);
  return h;
}
/* เรื่องที่ควรดู: การ์ด 2 คอลัมน์ (มือถือ 1) เหลือง = ต้องรีบดู · ฟ้า = ข้อมูลไม่ครบ · ไม่มีเรื่อง (n = 0) ไม่แสดงการ์ดนั้น · active = เรื่องที่กดแล้ว (กรองทั้งหน้า) */
async function dashAlerts(items, active) {
  items = items.filter(x => x.n > 0);
  if (!items.length) return null;
  const box = dF(DASH_BOX.alert + 'เรื่องที่ควรดู', 'VERTICAL', { gap: 16, pad: MOB ? 16 : 24, r: 16, stroke: 'line', fill: 'white' });
  const hd = dF('หัว', 'HORIZONTAL', { gap: 8 });
  dAp(hd, fIcon('Warning', 'event_busy-24-300-round', 'sm')); dAp(hd, await dT('เรื่องที่ควรดู', 16, 'text', true));
  dAp(hd, inst('Pill outline', { Color: 'Gray' }, { Text: items.length + ' เรื่อง' }));
  dAp(box, hd, 'fill');
  const per = MOB ? 1 : 2;
  for (let i = 0; i < items.length; i += per) {
    const r = dF('แถว', 'HORIZONTAL', { gap: 12, align: 'MIN' });
    for (const it of items.slice(i, i + per)) {
      const warnT = it.tone !== 'info', on = it.key === active;
      const c = dF('เรื่อง · ' + it.title, 'HORIZONTAL', { gap: 12, pad: [12, 16], r: 12, fill: warnT ? 'warningBg' : 'infoBg', stroke: on ? (warnT ? 'warning' : 'info') : (warnT ? 'warningLine' : 'infoLine'), sw: on ? 2 : 1 });
      dAp(c, fIcon(warnT ? 'Warning' : 'Info', it.icon, 'sm'));
      const t = dF('ข้อความ', 'VERTICAL', { gap: 2 });
      dAp(t, await dT(it.title, 14, warnT ? 'warningT' : 'infoT', true), 'fill'); dAp(t, await dT(it.sub, 12, 'text2'), 'fill');
      dAp(c, t, 'grow');
      if (has(DASH_ARROW)) dAp(c, inst(DASH_ARROW));
      dAp(r, c, 'grow'); dAp(r, c, 'stretch');
    }
    if (per === 2 && items.length - i === 1) dAp(r, dF('ว่าง', 'HORIZONTAL', {}), 'grow');   // เรื่องเดียวในแถว = ครึ่งความกว้างแบบ VMS+
    dAp(box, r, 'fill');
  }
  return box;
}
/* ตัวกรองที่เลือก (หลังกดกราฟ/เรื่องที่ควรดู/แผงตัวกรอง): "n ตัวกรอง" · ชิป Badge outline with remove icon · ล้างทั้งหมด (Tertiary button) */
async function dashChips(chips) {
  if (!chips || !chips.length) return null;
  const box = dF(DASH_BOX.head + 'ตัวกรองที่เลือก', 'HORIZONTAL', { gap: 8, pad: [12, 16], r: 12, fill: 'subtle', stroke: 'line', align: 'CENTER' });
  if (MOB) { box.layoutMode = 'VERTICAL'; box.counterAxisAlignItems = 'MIN'; }
  dAp(box, await dT('ตัวกรองที่เลือก:', 13, 'text2', true));
  const cs = dF('ชิป', 'HORIZONTAL', { gap: 8 });
  for (const c of chips) dAp(cs, has('Badge outline with remove icon') ? inst('Badge outline with remove icon', { Color: 'Brand' }, { Text: c }) : await dT(c, 13, 'brandT', true));
  dAp(box, cs, MOB ? 'fill' : 'grow');
  dAp(box, inst('Pill outline', { Color: 'Brand' }, { Text: chips.length + ' ตัวกรอง' }));
  dAp(box, btn('Tertiary button', 'ล้างทั้งหมด', {}));
  return box;
}
/* การ์ดตัวเลขไล่เฉด: ไอคอน + ชื่อ · ตัวเลขใหญ่ + หน่วย · บรรทัดรอง — desktop เรียงแถวเดียว · มือถือ 2 ใบต่อแถว */
async function dashKpis(items) {
  const box = dF(DASH_BOX.kpi + 'การ์ดตัวเลข', 'VERTICAL', { gap: 12 });
  const per = MOB ? 2 : items.length;
  for (let i = 0; i < items.length; i += per) {
    const r = dF('แถว', 'HORIZONTAL', { gap: MOB ? 12 : 16, align: 'MIN' });
    for (const it of items.slice(i, i + per)) {
      const c = dF('การ์ด · ' + it.label, 'VERTICAL', { gap: 6, pad: MOB ? 12 : 16, r: 12 }); dGrad(c, it.tone);
      const hd = dF('หัว', 'HORIZONTAL', { gap: 6 });
      dAp(hd, wIcon(it.icon)); dAp(hd, await dT(it.label, 13, 'onBrand', true), 'grow'); dAp(c, hd, 'fill');
      const v = dF('ตัวเลข', 'HORIZONTAL', { gap: 4, align: 'MAX' });
      dAp(v, await dT(it.value, MOB ? 24 : 28, 'onBrand', true)); if (it.unit) dAp(v, await dT(it.unit, 13, 'onBrand'));
      dAp(c, v, 'fill');
      if (it.sub) { const s = await dT(it.sub, 12, 'onBrand'); s.opacity = 0.85; dAp(c, s, 'fill'); }
      dAp(r, c, 'grow'); dAp(r, c, 'stretch');
    }
    dAp(box, r, 'fill');
  }
  return box;
}
/* ปุ่มสลับในหัวการ์ด (หน่วยงาน / เขต) */
async function dashToggle(labels, on) {
  const t = dF('สลับ', 'HORIZONTAL', { gap: 2, pad: 2, r: 8, fill: 'subtle', stroke: 'line' });
  for (const [i, l] of labels.entries()) { const s = dF(l, 'HORIZONTAL', { pad: [4, 10], r: 6, fill: i === on ? 'white' : null }); dAp(s, await dT(l, 12, i === on ? 'brandT' : 'text2', i === on)); dAp(t, s); }
  return t;
}
/* การ์ดกราฟ: หัว Featured icon + ชื่อ + บรรทัดรอง (+ ปุ่มสลับ) · เนื้อ = build(กว้างด้านใน) · ท้าย "ข้อมูลจาก … | คลิกกราฟหรือรายการเพื่อกรองทั้งหน้า" */
async function chartCard(w, o) {
  const pad = MOB ? 16 : 24, c = dF(DASH_BOX.chart + o.title, 'VERTICAL', { gap: 16, pad, r: 16, stroke: 'line', fill: 'white' });
  dFixW(c, w);
  const hd = dF('หัว', 'HORIZONTAL', { gap: 12, align: 'MIN' });
  dAp(hd, fIcon(o.color || 'Brand', o.icon, 'sm'));
  const tx = dF('ชื่อ', 'VERTICAL', { gap: 2 }); dAp(tx, await dT(o.title, 16, 'text', true), 'fill'); if (o.sub) dAp(tx, await dT(o.sub, 12, 'text3'), 'fill');
  dAp(hd, tx, 'grow');
  if (o.toggle) dAp(hd, await dashToggle(o.toggle[0], o.toggle[1]));
  dAp(c, hd, 'fill');
  for (const n of await o.build(w - pad * 2)) if (n) dAp(c, n, n.layoutMode ? 'fill' : undefined);
  if (o.more) dAp(c, await dT(o.more, 13, 'brandT', true));
  const ft = dF('ท้าย', 'VERTICAL', { gap: 0 }); dAp(ft, await dT((o.src || 'ข้อมูลจากแผนบำรุงรักษาในระบบ') + '  |  คลิกกราฟหรือรายการเพื่อกรองทั้งหน้า', 12, 'text3'), 'fill');
  dAp(c, ft, 'fill');
  return c;
}
/* วางการ์ดกราฟเป็นแถว (desktop 3 ช่องต่อแถว span 1–3 · มือถือทีละใบเต็มกว้าง) — กว้างคำนวณจากกว้างเนื้อหาของหน้า */
async function chartGrid(W, specs) {
  const box = frame('กราฟ', 'VERTICAL', { gap: MOB ? 16 : 24 }), gap = 24, unit = (W - gap * 2) / 3;
  let row = null, used = 3;
  for (const sp of specs.filter(Boolean)) {
    const span = MOB ? 3 : sp.span || 1, w = MOB ? W : unit * span + gap * (span - 1);
    if (MOB || used + span > 3) { row = frame('แถว', 'HORIZONTAL', { gap }); row.counterAxisAlignItems = 'MIN'; dAp(box, row, 'fill'); used = 0; }
    const c = await chartCard(w, sp); dAp(row, c); dAp(row, c, 'stretch'); used += span;
  }
  return box;
}
/* แถบแนวนอนต่อแถว: จุดสี · ชื่อ · จำนวน หน่วย · % · แถบ (ยาวตามค่ามากสุด) · บรรทัดรอง · dim = ไม่อยู่ในตัวกรองที่กด */
function dTrack(w, h, segs) {
  const t = frame('ราง', null); dPaint(t, 'track'); t.cornerRadius = h / 2; t.resize(Math.max(1, Math.round(w)), h); let x = 0;
  for (const [f, k] of segs) { const bw = Math.round(w * f); if (bw < 1) continue; const b = dRect(bw, h, k, h / 2); t.appendChild(b); b.x = x; b.y = 0; x += bw; }
  return t;
}
async function hBars(w, rows, o) {
  o = o || {};
  const box = dF('แถบแนวนอน', 'VERTICAL', { gap: 14 }), max = Math.max(1, ...rows.map(r => r.value)), tot = o.total || rows.reduce((a, r) => a + r.value, 0);
  for (const [i, r] of rows.entries()) {
    const k = r.tone || DASH_TONES[i % DASH_TONES.length], it = dF('แถว · ' + r.label, 'VERTICAL', { gap: 6 });
    const top = dF('ชื่อ', 'HORIZONTAL', { gap: 8 });
    dAp(top, dDot(k, 8)); dAp(top, await dT(r.label, 13, 'text'), 'grow'); dAp(top, await dT(dFmt(r.value), 13, 'text', true)); dAp(top, await dT(r.unit || o.unit || '', 12, 'text3'));
    dAp(top, await dTxtW(dPct(r.value, tot), 12, 'text3', 52, 'RIGHT'));
    dAp(it, top, 'fill');
    dAp(it, dTrack(w, 6, [[r.value / max, k]]));
    if (r.sub) dAp(it, await dT(r.sub, 12, 'text3'), 'fill');
    if (r.dim) it.opacity = 0.35;
    dAp(box, it, 'fill');
  }
  return box;
}
/* ตารางคำอธิบาย (สี · ชื่อ · จำนวน · %) ใต้โดนัท/แท่ง · total = แถวรวมท้าย */
async function dLegend(rows, heads, o) {
  o = o || {};
  const tot = rows.reduce((a, r) => a + r.value, 0), box = dF('คำอธิบาย', 'VERTICAL', { gap: 10 });
  const hd = dF('หัวตาราง', 'HORIZONTAL', { gap: 8 }); dAp(hd, await dT(heads[0], 12, 'text3'), 'grow'); dAp(hd, await dTxtW(heads[1], 12, 'text3', 96, 'RIGHT')); dAp(hd, await dTxtW('%', 12, 'text3', 52, 'RIGHT')); dAp(box, hd, 'fill');
  for (const [i, r] of rows.entries()) {
    const ln = dF('แถว · ' + r.label, 'HORIZONTAL', { gap: 8 });
    dAp(ln, dDot(r.tone || DASH_TONES[i % DASH_TONES.length], 8)); dAp(ln, await dT(r.label, 13, 'text'), 'grow');
    dAp(ln, await dTxtW(dFmt(r.value), 13, 'text', 96, 'RIGHT', true)); dAp(ln, await dTxtW(dPct(r.value, tot), 12, 'text3', 52, 'RIGHT'));
    if (r.dim) ln.opacity = 0.35;
    dAp(box, ln, 'fill');
  }
  if (o.total) { const ln = dF('รวม', 'HORIZONTAL', { gap: 8 }); dAp(ln, await dT('รวม', 13, 'text', true), 'grow'); dAp(ln, await dTxtW(dFmt(tot), 13, 'text', 96, 'RIGHT', true)); dAp(ln, await dTxtW('100%', 12, 'text3', 52, 'RIGHT')); dAp(box, ln, 'fill'); }
  return box;
}
/* โดนัท + ตัวเลขรวมตรงกลาง + ตารางคำอธิบาย (ส่วนโค้ง = ELLIPSE arcData) */
async function donut(w, segs, o) {
  const D = Math.min(o.size || 176, Math.round(w)), ring = frame('โดนัท', null); ring.resize(D, D);
  const tot = segs.reduce((a, s) => a + s.value, 0); let a = -Math.PI / 2;
  const arc = (from, to, k) => { const e = figma.createEllipse(); CREATED.push(e); e.name = 'ส่วนโค้ง'; e.resize(D, D); e.arcData = { startingAngle: from, endingAngle: to, innerRadius: 0.7 }; dPaint(e, k); ring.appendChild(e); e.x = 0; e.y = 0; return e; };
  if (!tot) arc(0, Math.PI * 2, 'track');
  for (const [i, s] of segs.entries()) { if (!s.value) continue; const sw = s.value / tot * Math.PI * 2; const e = arc(a, a + sw, s.tone || DASH_TONES[i % DASH_TONES.length]); if (s.dim) e.opacity = 0.3; a += sw; }
  const c1 = await dTxtW(dFmt(tot), 24, 'text', D, 'CENTER', true); ring.appendChild(c1); c1.x = 0; c1.y = Math.round(D / 2 - 24);
  const c2 = await dTxtW(o.unit, 12, 'text3', D, 'CENTER'); ring.appendChild(c2); c2.x = 0; c2.y = Math.round(D / 2 + 6);
  const wrap = dF('โดนัทกลาง', 'VERTICAL', { gap: 0 }); wrap.counterAxisAlignItems = 'CENTER'; dAp(wrap, ring);   // ผู้เรียกวางเต็มกว้าง ⇒ วงอยู่กลางการ์ด
  return [wrap, await dLegend(segs, o.heads || ['สถานะ', 'จำนวน (' + o.unit + ')'])];
}
/* แท่งแนวตั้ง (ซ้อนได้) + แกนตัวเลข + ป้ายใต้แท่ง · groups [{ label, vals: [ต่อ series], dim }] · series [{ label, tone }] */
const dNice = (m) => { if (m <= 5) return Math.max(1, m); const p = Math.pow(10, Math.floor(Math.log10(m))); for (const s of [1, 2, 2.5, 5, 10]) if (s * p >= m) return s * p; return 10 * p; };
async function vBars(w, groups, series, o) {
  o = o || {};
  const H = o.h || 168, top = 8, axisW = 36, lab = 34, chart = frame('กราฟแท่ง', null); chart.resize(Math.round(w), top + H + lab);
  const max = dNice(Math.max(1, ...groups.map(g => g.vals.reduce((a, v) => a + v, 0)))), steps = max <= 5 ? max : max % 4 === 0 ? 4 : 5;   // เส้นแกนตกเลขกลม (เช่น 10 → ทีละ 2 · 20 → ทีละ 5)
  for (let i = 0; i <= steps; i++) {
    const y = Math.round(top + H - H * i / steps), ln = dRect(w - axisW, 1, 'line'); chart.appendChild(ln); ln.x = axisW; ln.y = y;
    const t = await dTxtW(dFmt(Math.round(max * i / steps * 10) / 10), 11, 'text3', axisW - 8, 'RIGHT'); chart.appendChild(t); t.x = 0; t.y = y - 8;
  }
  const slot = (w - axisW) / groups.length, bw = Math.max(8, Math.min(44, Math.round(slot * 0.56)));
  for (const [gi, g] of groups.entries()) {
    const x = Math.round(axisW + slot * gi + (slot - bw) / 2); let y = top + H; const segs = [];
    for (const [si, v] of g.vals.entries()) { const bh = Math.round(H * v / max); if (!bh) continue; y -= bh; const r = dRect(bw, bh, series[si].tone, 0); chart.appendChild(r); r.x = x; r.y = y; segs.push(r); if (g.dim) r.opacity = 0.3; }
    const last = segs[segs.length - 1]; if (last) { last.topLeftRadius = 4; last.topRightRadius = 4; }
    const t = await dTxtW(g.label, 11, 'text2', Math.max(24, Math.round(slot - 4)), 'CENTER'); chart.appendChild(t); t.x = Math.round(axisW + slot * gi + 2); t.y = top + H + 8;
  }
  const out = [chart];
  if (series.length > 1) {
    const lg = dF('คำอธิบายสี', 'HORIZONTAL', { gap: 16 });
    for (const s of series) { const it = dF(s.label, 'HORIZONTAL', { gap: 6 }); dAp(it, dDot(s.tone, 8)); dAp(it, await dT(s.label, 12, 'text2')); dAp(lg, it); }
    out.push(lg);
  }
  return out;
}
/* แถบซ้อนต่อแถว (ความคืบหน้าของแผน): ชื่อ · x/y · แถบหลายสีต่อกัน */
async function stackRows(w, rows, series) {
  const box = dF('แถบซ้อน', 'VERTICAL', { gap: 16 });
  for (const r of rows) {
    const tot = r.vals.reduce((a, v) => a + v, 0), it = dF('แถว · ' + r.label, 'VERTICAL', { gap: 6 });
    const top = dF('ชื่อ', 'HORIZONTAL', { gap: 8 }); dAp(top, await dT(r.label, 13, 'text', true), 'grow'); dAp(top, await dT(r.right, 12, 'text2')); dAp(it, top, 'fill');
    dAp(it, dTrack(w, 10, r.vals.map((v, i) => [tot ? v / tot : 0, series[i].tone])));
    if (r.sub) dAp(it, await dT(r.sub, 12, 'text3'), 'fill');
    if (r.dim) it.opacity = 0.35;
    dAp(box, it, 'fill');
  }
  const lg = dF('คำอธิบายสี', 'HORIZONTAL', { gap: 16 });
  for (const s of series) { const it = dF(s.label, 'HORIZONTAL', { gap: 6 }); dAp(it, dDot(s.tone, 8)); dAp(it, await dT(s.label, 12, 'text2')); dAp(lg, it); }
  dAp(box, lg);
  return box;
}
async function dashNote(s) { const n = dF(DASH_BOX.note + 'แหล่งข้อมูล', 'VERTICAL', { gap: 0 }); n.counterAxisAlignItems = 'CENTER'; const t = await dT(s, 12, 'text3'); t.textAlignHorizontal = 'CENTER'; dAp(n, t, 'fill'); return n; }

/* ---------- S4 แดชบอร์ดอะไหล่และความคืบหน้าของแผนที่อนุมัติแล้ว (6 พ.ย. 2569 · แทนหน้าความคืบหน้าอะไหล่รายไตรมาส partsProgress) ----------
   รีวิว 6 พ.ย. 2569 (บล็อก C): "เปลี่ยนหน้านี้เป็นหน้า รวมอะใหล่ของแผนที่อนุมัติแล้ว" + "filter หน่วยงานผู้ขอเบิก เขต,แผน, ค้นหาจาก ชื่ออะใหล่ รหัสอะใหล่ ssorting ทุกคอลัมม์" + "export pdf excel"
   + "เลือกแผน, ติดตามความคืบหน้า" · เจ้าของงานเคาะ: หน้าที่จาก Smart Inventory เปลี่ยนเป็นแดชบอร์ด ไม่แสดงค่าจาก Smart Inventory · แท็บรวมตามรายการ / แยกรายคัน
   + ความคืบหน้า "ไตรมาส มีกี่แผนการเดินทาง แต่ละแผนความคืบหน้าเป็นอย่างไร" (ให้คิดแบบที่เหมาะจากของเดิม) ⇒ แท็บที่ 3 แถว = 1 ไตรมาสของ 1 แผน กดไปหน้าไตรมาส n (เห็นแผนเดินทางและสถานะรายใบ)
   โครง = MA Dashboard - Default ของหน้า MA Overview ใน UI Release#2 (Page header → Tabs → Metric item → Table header → Table → pagination) แบบเดียวกับแดชบอร์ด Overhaul (R22)
   ปุ่ม "ส่งออก" ใน Table header ข้างปุ่มตัวกรอง (ปุ่มรายงานของ Vehicle list 5.2 · MA Overview ใน UI Release#2 · ไอคอน download) · popup + เฟรมหน้าตาไฟล์แบบ S18 ของ Overhaul (R32)
   ทุกคอลัมน์เรียงได้ (Table header cell Sort icon แบบ MA Overview: คอลัมน์แรก Down ที่เหลือ Swap) · ตารางรวมตามรายการใช้ QPART_COLS ชุดเดียวกับทุกหน้า (R81) · ข้อมูลเป็นค่าสมมติ */
const DASH_PLANS = () => [planAs('approved'), PLANS[0], PLANS[1]];   // แผนที่อนุมัติแล้วของปีงบประมาณ 2570 (ค่าสมมติ)
const DASH_TABS = ['รวมตามรายการ', 'แยกรายคัน', 'ความคืบหน้าของแผน'];
const sortAll = (cols) => cols.map((c, i) => c[0] ? [c[0], c[1], c[2] || 'Text', i === 0 ? 'Down' : 'Swap'] : c);
const DASH_AGG = PARTS.map((p, i) => [p[0], p[1], p[2], String([540, 60, 60, 54, 16][i]), p[4]]).concat([[MANUAL.name, MANUAL.code || '-', 'เพิ่มเอง', '4', 'ชิ้น']]);   // ยอดรวมทุกแผน (ค่าสมมติ) · คันที่ไม่เบิกอะไหล่ไม่รวม
const DASH_CAR_COLS = [['ทะเบียน', 170, 'Lead text'], ['เลขที่ MR', 140], ['ไตรมาส', 100], ['ชนิด', 0], ['รหัสอะไหล่', 130], ['ประเภท', 110], ['จำนวน', 100], ['หน่วย', 90]];
const DASH_CAR_ROWS = () => [].concat(...[0, 1, 2].map(i => (A_OILS[i] === 1 || A_OILS[i] === 2 ? [0] : []).concat((A_PICKS[i] || []).filter(x => x !== 0))
  .map(x => [CAND[i][0], { text: NP[0], sub: PLAN_UNIT[NP[0]] }, 'ไตรมาส ' + A_ALL[i], PARTS[x][0], PARTS[x][1], PARTS[x][2], x === 0 ? OIL_SPEC.litre : String(CAR_QTY[x]), PARTS[x][4]])));
const QST = { todo: ['ยังไม่เริ่ม', 'Gray'], doing: ['กำลังดำเนินการ', 'Info'], done: ['เสร็จแล้ว', 'Success'] };
const DASH_PROG_COLS = [['เลขที่ MR', 150, 'Lead text'], ['ชื่อแผน', 0], ['ไตรมาส', 110], ['แผนเดินทาง', 120], ['ยานพาหนะบำรุงรักษาแล้ว', 200], ['สถานะ', 150, 'Badge'], ['', 60]];
/* [เลขที่ MR, ไตรมาส, แผนเดินทาง (ใบ), บำรุงรักษาแล้ว, ยานพาหนะในไตรมาส, สถานะ] — ค่าสมมติ · MRZ7000001 ไตรมาส 1 ตรงกับหน้าไตรมาส 1 (แผนเดินทาง 2 ใบ) */
const DASH_PROG = [['MRZ7000001', 1, 2, 4, 6, 'doing'], ['MRZ7000001', 2, 0, 0, 3, 'todo'], ['MRZ7000001', 3, 0, 0, 2, 'todo'], ['MRZ7000001', 4, 0, 0, 1, 'todo'],
  ['MRZ7000004', 1, 1, 0, 3, 'doing'], ['MRZ7000004', 2, 0, 0, 3, 'todo'], ['MRZ7000004', 3, 0, 0, 2, 'todo'], ['MRZ7000004', 4, 0, 0, 2, 'todo'],
  ['MRZ7000002', 2, 1, 0, 4, 'doing'], ['MRZ7000002', 3, 0, 0, 2, 'todo']];
/* ใครเห็นอะไร (เจ้าของงาน 10 พ.ย. 2569 "ผู้สร้างแผนเห็นเฉพาะแผนของหน่วยงานตัวเอง ยกเว้น กบค จะเห็นแผนของหน่วยงานอื่นด้วย แต่แก้ไขไม่ได้")
   ค่าเริ่มต้นของจอ = ผู้ใช้ กบผ. เห็นเฉพาะแผนของ กบผ. ไม่มีตัวกรองหน่วยงาน · o.kbk = ผู้ใช้ กบค. เห็นทุกหน่วยงาน มีตัวกรองหน่วยงานผู้ขอเบิก (แดชบอร์ดดูอย่างเดียวทุกบทบาท) */
const DASH_OWN = 'กบผ.';
const dashMine = (kbk) => (r) => kbk || PLAN_UNIT[r[0]] === DASH_OWN;
const dashProgRow = (r) => { const p = DASH_PLANS().find(x => x[0] === r[0]); return [{ text: r[0], sub: PLAN_UNIT[r[0]] }, p[1], 'ไตรมาส ' + r[1], r[2] + ' ใบ', r[3] + '/' + r[4] + ' คัน', { pill: QST[r[5]] }, GO]; };
const DASH_HINT = ['ค้นหาชื่ออะไหล่, รหัสอะไหล่', 'ค้นหาทะเบียน, ชื่ออะไหล่, รหัสอะไหล่', 'ค้นหาเลขที่ MR, ชื่อแผน'];
async function metric(text, number, color) {   // Metric item (Breakpoint ตามจอ) + สี Featured icon ที่ซ้อนอยู่ — ยกจาก overhaul2-plugin (R22)
  const m = inst('Metric item', { Breakpoint: BP() }, { Number: String(number), Text: text });
  const fi = find(m, 'Featured icon'); if (fi) setProps(fi, { Color: color || 'Brand' });
  return m;
}
function metricRow(items) {   // desktop: 4 ใบเต็มแถว gap 24 (MA Overview) · mobile: 2 ใบต่อแถว gap 12 — ยกจาก overhaul2-plugin
  if (MOB) {
    const box = frame('Metrics', 'VERTICAL', { gap: 12 });
    for (let i = 0; i < items.length; i += 2) { const r = frame('Row', 'HORIZONTAL', { gap: 12 }); items.slice(i, i + 2).forEach(m => { r.appendChild(m); m.layoutGrow = 1; }); add(box, r, 'h'); }
    return box;
  }
  const r = frame('Metrics', 'HORIZONTAL', { gap: 24 }); items.forEach(m => { r.appendChild(m); m.layoutGrow = 1; }); return r;
}
const DASH_TABLE = (tab, kbk) => tab === 0 ? [sortAll(QPART_COLS), DASH_AGG] : tab === 1 ? [sortAll(DASH_CAR_COLS), DASH_CAR_ROWS()] : [sortAll(DASH_PROG_COLS), DASH_PROG.filter(dashMine(kbk)).map(dashProgRow)];
/* S4 แบบ VMS+ (12 พ.ย. 2569 · R106 · ชุดวาดด้านบน) — ลำดับ: หัวแดชบอร์ด → เรื่องที่ควรดู → ตัวกรองที่เลือก → การ์ดตัวเลข 6 ใบ → กราฟ 4 ใบ → แท็บ 3 แท็บเดิม + Table header + Table → หมายเหตุแหล่งข้อมูล
   ตัวเลขทุกส่วนคิดจากข้อมูลเดิมของหน้า (DASH_PLANS · รายไตรมาสของแผน · DASH_PROG · DASH_AGG · อะไหล่รายคันของแผน MRZ7000004) ไม่เพิ่มแหล่งข้อมูล
   ที่ทำไม่ได้จากข้อมูลเดิม (ตัดออก แจ้งเจ้าของงาน): อะไหล่รายไตรมาส (DASH_AGG เป็นยอดทั้งปี) · ไตรมาสที่บำรุงรักษาช้ากว่ากำหนด (ไม่มีวันครบกำหนดรายไตรมาส) · อะไหล่ตามหน่วยงานผู้ขอเบิก (แสดงยานพาหนะตามหน่วยงานแทน) */
const planQs = (p) => p[9].split(' · ').map(s => +s.split(': ')[1] || 0);   // ยานพาหนะรายไตรมาส [ไตรมาส 1..4] ของแผน
const progOf = (id, q) => DASH_PROG.find(r => r[0] === id && r[1] === q);
const DASH_NOPARTS = CAND.map((c, i) => i).filter(i => !(A_PICKS[i] || []).length && !A_OILS[i]);   // ยานพาหนะของแผน MRZ7000004 (CAND) ที่ไม่มีอะไหล่และไม่เปลี่ยนน้ำมัน = ไม่เบิกอะไหล่
const DASH_PCS = DASH_AGG.filter(r => r[4] === 'ชิ้น').reduce((a, r) => a + +r[3], 0), DASH_LITRE = DASH_AGG.filter(r => r[4] === 'ลิตร').reduce((a, r) => a + +r[3], 0);
function dashStats(o) {   // o.kbk · o.q = ไตรมาสที่กดในกราฟ · o.plan = แผนในตัวกรอง
  const pl = DASH_PLANS().filter(dashMine(o.kbk)).filter(p => !o.plan || p[0] === o.plan);
  const per = pl.map(p => {
    const qs = planQs(p), qd = [1, 2, 3, 4].map(q => { const r = progOf(p[0], q); return { cars: qs[q - 1], done: r ? r[3] : 0, st: r ? r[5] : 'todo', trips: r ? r[2] : 0 }; });
    const pick = o.q ? [qd[o.q - 1]] : qd, cars = pick.reduce((a, x) => a + x.cars, 0), done = pick.reduce((a, x) => a + x.done, 0), doing = pick.reduce((a, x) => a + (x.st === 'doing' ? x.cars - x.done : 0), 0);
    return { p, qd, cars, done, doing, todo: cars - done - doing, nowQ: +p[3].split(' ')[1] };
  }).filter(x => x.cars > 0);
  const cars = per.reduce((a, x) => a + x.cars, 0), done = per.reduce((a, x) => a + x.done, 0);
  const byQ = [0, 1, 2, 3].map(q => per.reduce((a, x) => [a[0] + x.qd[q].done, a[1] + x.qd[q].cars - x.qd[q].done], [0, 0]));
  return { per, cars, done, byQ };
}
/* o.tab · o.query · o.chips (ตัวกรองที่ใช้แล้ว · ชิปที่เป็นเลขที่ MR = กรองแผน) · o.notFound · o.empty · o.filter = แผงตัวกรอง { open } · o.exportPdf = popup ส่งออก (true PDF / false Excel) · o.kbk = มุมมอง กบค. ทุกหน่วยงาน
   o.q = กดแท่งไตรมาส (กรองทั้งหน้า) · o.alert = กดเรื่องที่ควรดู ('noparts') · o.mobileAll = มือถือแสดงกราฟครบทุกใบ (จอมือถืออื่นแสดงเฉพาะกราฟที่กด) */
async function partsDash(name, o) {
  o = o || {};
  const tab = o.tab || 0;
  const { scr, page } = await shell(name, { title: 'อะไหล่ของแผนที่อนุมัติแล้ว' });
  if (o.empty) {
    const es = inst('Empty state/Data empty'); add(page, es, 'h');
    await text(es, 'Text', 'ยังไม่มีแผนที่อนุมัติแล้ว'); await text(es, 'Supporting text', 'เมื่อแผนบำรุงรักษาได้รับอนุมัติ อะไหล่และความคืบหน้าของแผนจะรวมมาที่นี่');
    const a = find(es, 'Actions'); if (a) a.visible = false;
    return scr;
  }
  const plan = (o.chips || []).find(c => /^MRZ\d+$/.test(c)), st = dashStats({ kbk: o.kbk, q: o.q, plan }), W = dashW(scr);
  add(page, await dashHead({ title: 'อะไหล่ของแผนที่อนุมัติแล้ว', icon: 'quick_reference_all-24-300-round',
    desc: 'อะไหล่และน้ำมันไฮดรอลิกที่ต้องใช้ตามแผนบำรุงรักษาที่อนุมัติแล้ว แยกตามไตรมาส แผน และหน่วยงาน — คลิกกราฟหรือรายการเพื่อกรองทั้งหน้า' }), 'h');
  const seeNp = st.per.some(x => x.p[0] === NP[0]), noTrip = st.per.filter(x => !o.q && x.qd[x.nowQ - 1].cars && !x.qd[x.nowQ - 1].trips);
  const al = await dashAlerts([
    { key: 'notrip', tone: 'warn', n: noTrip.length, icon: 'event_busy-24-300-round', title: 'ไตรมาสปัจจุบันที่ยังไม่มีแผนเดินทาง ' + noTrip.length + ' ไตรมาส', sub: noTrip.map(x => x.p[0] + ' ' + x.p[3]).join(' · ') + ' — ยานพาหนะในไตรมาสยังไม่ได้จัดเข้าแผนเดินทาง' },
    { key: 'noparts', tone: 'info', n: seeNp ? DASH_NOPARTS.length : 0, icon: 'description-24-300-round', title: 'ยานพาหนะในแผนที่ไม่เบิกอะไหล่ ' + DASH_NOPARTS.length + ' คัน', sub: DASH_NOPARTS.map(i => CAND[i][0]).join(' · ') + ' ในแผน ' + NP[0] + ' ไม่มีอะไหล่และไม่เปลี่ยนน้ำมันไฮดรอลิก — ตรวจว่าตั้งใจหรือยังจัดอะไหล่ไม่ครบ' }], o.alert);
  if (al) add(page, al, 'h');
  const ch = await dashChips(o.chips); if (ch) add(page, ch, 'h');
  const partSub = o.q || plan ? 'ยอดทั้งปีของทุกแผน ไม่แยกตามตัวกรอง' : 'รวมทุกแผนที่อนุมัติแล้ว';
  add(page, await dashKpis([
    { label: 'แผนที่อนุมัติแล้ว', value: st.per.length, unit: 'แผน', sub: 'ปีงบประมาณ 2570' + (o.kbk ? ' ทุกหน่วยงาน' : ' ของ ' + DASH_OWN), tone: 'brand', icon: 'description-24-300-round' },
    { label: 'ยานพาหนะในแผน', value: st.cars, unit: 'คัน', sub: o.q ? 'ไตรมาส ' + o.q : 'ทุกไตรมาส', tone: 'info', icon: 'car_repair-24-300-round' },
    { label: 'รายการอะไหล่', value: DASH_AGG.length, unit: 'รายการ', sub: partSub, tone: 'gray', icon: 'quick_reference_all-24-300-round' },
    { label: 'จำนวนอะไหล่รวม', value: dFmt(DASH_PCS), unit: 'ชิ้น', sub: 'ไม่รวมน้ำมันไฮดรอลิก', tone: 'warning', icon: 'search_check-24-300-round' },
    { label: 'น้ำมันไฮดรอลิก', value: dFmt(DASH_LITRE), unit: 'ลิตร', sub: OIL_SPEC.grade + ' · ' + partSub, tone: 'brand', icon: 'search_check-24-300-round' },
    { label: 'ความคืบหน้า', value: st.done + '/' + st.cars, unit: 'คัน', sub: dPct(st.done, st.cars) + ' บำรุงรักษาแล้ว', tone: 'success', icon: 'check-24-300-round' }]), 'h');
  /* กราฟ 4 ใบ — มือถือ: จอ C.18 แสดงครบ · จออื่นแสดงเฉพาะกราฟที่กด (ประหยัดชั้นบนหน้า Figma) */
  const byUnit = uniq(st.per.map(x => PLAN_UNIT[x.p[0]])).map(u => ({ label: u, value: st.per.filter(x => PLAN_UNIT[x.p[0]] === u).reduce((a, x) => a + x.cars, 0) }));
  const parts = DASH_AGG.filter(r => r[4] === 'ชิ้น').slice().sort((a, b) => b[3] - a[3]);
  const specs = [
    { key: 'quarter', span: 2, title: 'ยานพาหนะในแผนรายไตรมาส', sub: 'บำรุงรักษาแล้วเทียบยังไม่บำรุงรักษา แยกตามไตรมาส', icon: 'calendar_month-24-300-round', src: 'ข้อมูลจากแผนที่อนุมัติแล้ว ปีงบประมาณ 2570',
      build: async (w) => (await vBars(w, st.byQ.map((v, i) => ({ label: 'ไตรมาส ' + (i + 1), vals: v, dim: !!o.q && o.q !== i + 1 })), [{ label: 'บำรุงรักษาแล้ว', tone: 'success' }, { label: 'ยังไม่บำรุงรักษา', tone: 'info' }]))
        .concat([await dLegend(st.byQ.map((v, i) => ({ label: 'ไตรมาส ' + (i + 1), value: v[0] + v[1], tone: DASH_TONES[i], dim: !!o.q && o.q !== i + 1 })), ['ไตรมาส', 'ยานพาหนะ (คัน)'], { total: true })]) },
    { key: 'unit', span: 1, title: o.kbk ? 'ตามหน่วยงานผู้ขอเบิก' : 'ยานพาหนะตามแผน', sub: o.kbk ? 'ยานพาหนะในแผนของแต่ละหน่วยงาน' : 'ยานพาหนะในแผนของ ' + DASH_OWN + ' แยกตามแผน', icon: 'groups-24-300-round', color: 'Info', src: 'ข้อมูลจากแผนที่อนุมัติแล้ว',
      build: async (w) => donut(w, o.kbk ? byUnit : st.per.map(x => ({ label: x.p[0], value: x.cars })), { unit: 'คัน', heads: [o.kbk ? 'หน่วยงาน' : 'แผน', 'จำนวน (คัน)'] }) },
    { key: 'parts', span: 2, title: 'อะไหล่ที่ใช้มากที่สุด', sub: 'จำนวนชิ้นรวมทุกแผน · น้ำมันไฮดรอลิกนับเป็นลิตรที่การ์ดตัวเลข', icon: 'quick_reference_all-24-300-round', color: 'Warning', src: 'ข้อมูลจากอะไหล่ของยานพาหนะในแผน',
      more: parts.length > 10 ? 'แสดงทั้งหมด ' + parts.length + ' รายการ' : null,
      build: async (w) => [await hBars(w, parts.slice(0, 10).map(r => ({ label: r[0], value: +r[3], unit: r[4], sub: (r[1] && r[1] !== '-' ? 'รหัส ' + r[1] + ' · ' : '') + r[2] })), { total: DASH_PCS })] },
    { key: 'progress', span: 1, title: 'ความคืบหน้าของแผน', sub: 'ยานพาหนะแยกตามสถานะงานของแต่ละแผน', icon: 'check-24-300-round', color: 'Success', src: 'ข้อมูลจากแผนเดินทางและงานรายคัน',
      build: async (w) => [await stackRows(w, st.per.map(x => ({ label: x.p[0], right: x.done + '/' + x.cars + ' คัน', vals: [x.done, x.doing, x.todo], sub: PLAN_UNIT[x.p[0]] + ' · ' + x.p[1] })),
        [{ label: 'บำรุงรักษาแล้ว', tone: 'success' }, { label: 'กำลังดำเนินการ', tone: 'info' }, { label: 'ยังไม่เริ่ม', tone: 'track' }])] }];
  add(page, await chartGrid(W, MOB && !o.mobileAll ? specs.filter(s => s.key === (o.q ? 'quarter' : '')) : specs), 'h');
  /* ตารางท้ายหน้า: แท็บ 3 แท็บเดิม + Table header (ค้นหา · ตัวกรอง · ส่งออก) + Table เรียงได้ทุกคอลัมน์ + แบ่งหน้า */
  let [cols, rows] = DASH_TABLE(tab, o.kbk);
  if (tab === 2) rows = DASH_PROG.filter(dashMine(o.kbk)).filter(r => (!o.q || r[1] === o.q) && (!plan || r[0] === plan)).map(dashProgRow);
  if (o.alert === 'noparts') rows = DASH_NOPARTS.map(i => [CAND[i][0], { text: NP[0], sub: PLAN_UNIT[NP[0]] }, 'ไตรมาส ' + A_ALL[i], 'ไม่เบิกอะไหล่', '-', '-', '0', '-']);
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs(DASH_TABS.map((t, i) => [t, i === 0 ? DASH_AGG.length : i === 1 ? (o.alert ? rows.length : 214) : (tab === 2 ? rows.length : DASH_PROG.filter(dashMine(o.kbk)).length)]), tab), 'h');
  add(sec, await tableHeader({ placeholder: DASH_HINT[tab], query: o.query, chips: o.chips, filterCount: (o.chips || []).length || null, more: [{ text: 'ส่งออก', icon: 'download-24-300-round' }] }), 'h');
  if (o.notFound) add(sec, await searchNotFound(), 'h');
  else add(sec, await tblShort(cols, rows.slice(0, TABLE_MAX.rows), { pagination: tab === 1 && !o.alert ? { shown: TABLE_MAX.rows, total: 214 } : rows.length }), 'h');
  add(page, await dashNote('ข้อมูลจากแผนบำรุงรักษาที่อนุมัติแล้วของปีงบประมาณ 2570 ' + (o.kbk ? 'ทุกหน่วยงาน' : 'ของ ' + DASH_OWN) + ' · จำนวนอะไหล่เป็นยอดตามแผน ไม่ใช่ยอดเบิกจริง · ตัวเลขทุกส่วนคำนวณตามตัวกรองที่เลือก'), 'h');
  await bindDash();
  /* แผงตัวกรอง (รีวิว "filter หน่วยงานผู้ขอเบิก เขต, แผน") + ปีงบประมาณ (หน้ารวมของแผนที่อนุมัติแล้ว "ในปีนั้นๆ") · filterPanel แบบรายการแผน · หลายค่า = Input dropdown with badges Optional */
  if (o.filter) {
    const fd = o.filter, at = (n) => n.findOne(x => x.name === 'Container') || n;
    const yr = dropdown('ปีงบประมาณ', '2570', { optional: true });
    const unit = o.kbk ? multiDropdown('หน่วยงานผู้ขอเบิก', fd.units || [], { placeholder: 'เลือกหน่วยงานผู้ขอเบิก', optional: true, state: fd.open === 'unit' ? 'Focused' : undefined }) : null;   // ผู้ใช้หน่วยงานเห็นเฉพาะแผนของตัวเอง ⇒ ตัวกรองหน่วยงานมีเฉพาะ กบค. (10 พ.ย. 2569)
    const dist = multiDropdown('เขต', fd.districts || [], { placeholder: 'เลือกเขต', optional: true });
    const pln = multiDropdown('แผน', fd.plans || [], { placeholder: 'เลือกแผน', optional: true, state: fd.open === 'plan' ? 'Focused' : undefined });
    await filterPanel(scr, [yr, unit, dist, pln].filter(Boolean));
    if (unit && fd.open === 'unit') comboAt(scr, at(unit), UNITS.map(u => [u, '', (fd.units || []).indexOf(u) >= 0]));
    if (fd.open === 'plan') comboAt(scr, at(pln), DASH_PLANS().filter(dashMine(o.kbk)).map(p => [p[0], p[1], (fd.plans || []).indexOf(p[0]) >= 0]));
  }
  if (o.exportPdf != null) await exportModal(scr, o.exportPdf, { scope: [rows.length + ' รายการตามแท็บ ' + DASH_TABS[tab] + ((o.chips || []).length ? ' และตัวกรองที่ใช้อยู่' : ''), (tab === 1 ? 214 : rows.length) + ' รายการ ทุกแผนที่อนุมัติแล้วในปีงบประมาณ 2570'] });
  return scr;
}
/* popup ส่งออก (S4 แดชบอร์ด · S6 แผนเดินทาง) — แบบ exportModal ของ S18 Overhaul (R32): การ์ดรูปแบบไฟล์ PDF / Excel ตั้งตามที่กด เปลี่ยนได้ · ปุ่ม ยกเลิก / ส่งออก
   รีวิว "download report อะไหล่ทั้งหมดและอะไหล่ตามที่ filter มาได้" ⇒ o.scope = [บรรทัดรองของ "ตามตัวกรองที่ใช้อยู่", บรรทัดรองของ "ทั้งหมด"] เพิ่มการ์ดชุดที่ 2 (ไม่มีค่าเริ่มต้นอื่นนอกจากตามตัวกรอง) */
const EXPORT_CARDS = [['PDF', 'เอกสาร A4 สำหรับพิมพ์หรือแนบเอกสาร'], ['Excel', 'ไฟล์ .xlsx แยกชีตตามหัวข้อ']];
async function exportModal(scr, pdf, o) {
  o = o || {};
  const body = [await radioPick('รูปแบบไฟล์', EXPORT_CARDS, pdf ? 0 : 1, { label: true })];
  if (o.scope) body.push(await radioPick('ข้อมูลที่ส่งออก', [['ตามตัวกรองที่ใช้อยู่', o.scope[0]], ['ทั้งหมด', o.scope[1]]], 0, { label: true }));
  return popupModal(scr, { title: o.title || 'ส่งออกรายงาน', sub: o.sub || 'ส่งออกข้อมูลตามแท็บที่เปิดอยู่', body, ok: 'ส่งออก' });
}
/* หน้าตาไฟล์ที่ส่งออก (R32) — เฟรมเอกสารไม่มี Sidebar/Header · PDF = A4 794×1123 · Excel = ชีต 1440×1024 (Tabs = แถบชีต) · บังคับ desktop · ยกจาก docFrame ของ overhaul2-plugin
   คอลัมน์ในไฟล์ใช้ชุดเดียวกับตารางบนจอ (R81 · เจ้าของงาน "ตอน export ก็เกี่ยวข้องด้วย") */
async function docFrame(name, w, h, kids) {
  const was = MOB; MOB = false;
  try {
    const f = frame(PLUGIN.prefix + ' / ' + name, 'VERTICAL', { fill: WHITE, pad: 48, gap: 24 });
    if (PLACE) { f.x = PLACE.x; f.y = PLACE.y; }
    f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; f.resize(w, h); f.clipsContent = false;
    for (const k of await kids()) if (k) add(f, k, 'h');
    return f;
  } finally { MOB = was; }
}
const DOC_HEAD = (title, filter) => [title, kv([['หน่วยงานที่ออกเอกสาร', UNITS[0] + ' การไฟฟ้าส่วนภูมิภาค'], ['ตัวกรอง', filter], ['พิมพ์เมื่อ', '06/11/2569 10:30 น.'], ['ผู้พิมพ์', CREATOR]], 4)];
async function dashPdf(name) {
  return docFrame(name, 794, 1123, async () => {
    const [t, k] = DOC_HEAD('รายงานอะไหล่ของแผนที่อนุมัติแล้ว · ปีงบประมาณ 2570', 'ปีงบประมาณ 2570 · แผน MRZ7000001');
    return [await sectionLabel(t), k, col('Section', [await sectionLabel('รวมตามรายการ (' + DASH_AGG.length + ')'), await tbl(QPART_COLS, DASH_AGG)], 12)];
  });
}
async function dashXls(name, sheet) {
  return docFrame(name, 1440, 1024, async () => {
    const [cols, rows] = DASH_TABLE(sheet);
    return [await tabs(DASH_TABS.map(t => [t, null]), sheet), await tbl(cols.map(c => c.slice(0, 3)).filter(c => c[0]), rows.slice(0, TABLE_MAX.rows).map(r => r.filter(c => c !== GO)))];
  });
}

/* ---------- S6 แผนเดินทาง (ตรวจเอง) ---------- */
/* หน้าแผนเดินทางของไตรมาส (3 พ.ย. 2569 เจ้าของงาน "อยากให้แสดงรถทั้งหมดในแผน และมีให้เพิ่มแผนการเดินทาง" → เลือกรถของไตรมาสที่กำลังทำ · หน้าเดียว 2 ส่วน)
   ส่วนรถ: รถทุกคันของไตรมาส + ช่วงวันเดินทาง + ป้ายแผนเดินทางที่รถอยู่ (ยังไม่มี = Gray) · ส่วนแผนเดินทาง: รายการใบ + ปุ่มสร้างแผนเดินทาง
   หน้า Detail ⇒ Section label (R3) · o.trips = แผนเดินทางที่ยืนยันแล้ว [{ sel, locs, d1, d2, st }] เรียงตามลำดับที่สร้าง */
const TRIP_Q_COLS = tripVCols({ drop: ['สถานที่บำรุงรักษา'] }).concat([['แผนเดินทาง', 200]]);   // R82 ชุดเดียวกับตารางยานพาหนะของแผนเดินทาง (หน้าไตรมาสไม่มีสถานที่ เพราะสถานที่อยู่กับแผนเดินทาง)   // 6 พ.ย. 2569 + ประเภทยานพาหนะ · ช่วงวันเดินทาง เป็น วันดำเนินการรายคัน   // มีใบ = ชื่อแผนเดินทาง (Text) · ยังไม่มี = Badge Gray · เบอร์ติดต่อ 3 พ.ย. 2569 เจ้าของงาน "หน้า e1 ก็อยากให้มีเบอร์ติดต่อด้วย" (อยู่ในใบแล้ว = เบอร์ของใบนั้น)
/* ยานพาหนะที่ยังไม่อยู่ในแผนนี้ (ค่าสมมติ · 12 พ.ย. 2569 X5 เพิ่มได้ทุกคัน ไม่จำกัดขอบเขตภาค เขต ประเภทของแผน · เดิม = รถในแผนปีที่ยังไม่ได้อยู่ในไตรมาสนี้) — ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · เบอร์ · ชื่อผู้ดูแลยานพาหนะ · popup "เพิ่มรถเข้า" ไตรมาส (E.16) */
const Q_EXTRA = [['81-9035 ลำปาง', 'Isuzu FTR + กระเช้า Aichi SK12A', 'กฟน.2 ลำปาง', '054-218-330', 'นายเกรียงไกร มูลเมือง'], ['82-4417 น่าน', 'Hino FC + กระเช้า Tadano AT-121', 'กฟน.2 น่าน', '054-710-244', 'นายสุเมธ จันทร์ดี'],
  ['80-6652 ลำพูน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.1 ลำพูน', '053-511-090', 'นายวิทยา สายสุข'],
  /* 12 พ.ย. 2569 เจ้าของงาน "ป๊อบอัพ ควรมีแบ่งหน้า" (R104) ⇒ ชุดตัวอย่างครบ 1 หน้า (10 คัน) จากทุกภาคและกองของ สนง. แบบเดียวกับ 3 คันแรก · ค่าสมมติ */
  ['85-3127 พระนครศรีอยุธยา', 'Isuzu FTR + กระเช้า Aichi SK12A', 'กฟก.1 พระนครศรีอยุธยา', '035-241-560', 'นายธนพล แก้วมณี'], ['86-4402 ชลบุรี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟก.2 ชลบุรี', '038-273-415', 'นายอำนาจ บุญมา'],
  ['84-7719 นครปฐม', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟก.3 นครปฐม', '034-251-907', 'นายสมศักดิ์ เพ็ชรรัตน์'], ['83-2286 เพชรบุรี', 'Hino FG + กระเช้า Tadano AT-146', 'กฟต.1 เพชรบุรี', '032-425-338', 'นายจักรพันธ์ ทองคำ'],
  ['85-6043 นครศรีธรรมราช', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟต.2 นครศรีธรรมราช', '075-356-212', 'นายอนันต์ แสงทอง'], ['70-4415 กรุงเทพมหานคร', 'Hino FC + กระเช้า Tadano AT-100', 'กบค.', '02-590-5541', 'นายปกรณ์ วงศ์ใหญ่'],
  ['71-2208 กรุงเทพมหานคร', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กรย.', '02-590-5618', 'นายชัยวัฒน์ รุ่งเรือง']];
const Q_EXTRA_TOTAL = 370;   // จำนวนยานพาหนะที่ยังไม่อยู่ในแผน (ค่าสมมติ หลายร้อยคันตั้งแต่ 12 พ.ย. 2569 X5) · popup แสดงหน้าแรก 10 คัน (Q_EXTRA) + Table pagination "แสดง 1 ถึง 10 จาก 370 รายการ" แบบ { shown, total } ของตารางอื่น
const Q_REMOVE_CONFIRM = (c) => ({ danger: true, title: 'ยืนยันการเอายานพาหนะออกจาก' + NOW_Q, sub: c[0] + ' จะถูกเอาออกจาก' + NOW_Q + ' ของแผนนี้ และอะไหล่ของยานพาหนะคันนี้ออกจากรายการเบิกของไตรมาส', cancel: 'ยกเลิก', ok: 'เอาออก' });   // แบบ CAR_REMOVE_CONFIRM
const Q_DONE_JOBS = Object.fromEntries(TRIP_CARS.map((c, i) => [c[0], i === 2 ? 'cannot' : 'done']));   // E.26 (R93) ทุกคันของไตรมาส 1 ปิดงานแล้ว · 1 คันบำรุงรักษาไม่ได้ (นับว่าเสร็จ)
const qAddModal = (scr, ticked) => tripCarModal(scr, { cars: Q_EXTRA, pool: Q_EXTRA.map((_, i) => i), pagination: { shown: Q_EXTRA.length, total: Q_EXTRA_TOTAL }, ticked, title: 'เพิ่มยานพาหนะเข้า' + NOW_Q, sub: 'ยานพาหนะที่ยังไม่อยู่ในแผนนี้ เพิ่มได้ทุกคัน รวมยานพาหนะที่รับมอบระหว่างปี', okText: 'เพิ่มเข้า' + NOW_Q });
const Q_PARTS_EMPTY = 'ไตรมาสนี้ไม่มีอะไหล่ที่ต้องเบิก';   // บรรทัดรองของ Empty state หัวข้ออะไหล่ในไตรมาส n (ชุดเดียวกับ S2 อะไหล่ในแผน)
const TRIP_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวัน', 220], ['ยานพาหนะ (คัน)', 100], ['ผู้ดำเนินการ', 260], ['สถานะ', 150, 'Badge'], ['', 72]];
const tripPlaces = (t) => { const n = new Set(t.sel.map(i => tripLoc(i, t.locs))).size, own = t.sel.filter(i => !t.locs[i]).length; return n + ' แห่ง' + (own ? ' (สำนักงานเจ้าของยานพาหนะ ' + own + ' คัน)' : ''); };
async function tripList(name, o) {
  o = o || {};
  const trips = o.trips || [];
  const Q = o.q || NOW_Q, J = o.jobs || {};   // S25 (5 พ.ย. 2569): o.q = หน้าไตรมาสอื่น · o.cars = [[รถ, ลำดับใน TRIP_CARS หรือ -1]] แทนรถไตรมาส 1 · o.jobs = { ทะเบียน: สถานะงาน } ขึ้นป้ายแทนชื่อแผนเดินทาง + เมนู "…" ย้ายไปไตรมาสอื่น · o.subs = { ทะเบียน: บรรทัดรอง }
  /* 5 พ.ย. 2569 รีวิว "หน้านี้คือหน้า ไตรมาส 1 ใช่หรือไม่ หากใช้ ต้องแก้ breadcrumb ให้ถูกต้องสัมพันธ์กัน" (เจ้าของงานยืนยันว่าใช่) ⇒ หัวหน้า "ไตรมาส 1" · breadcrumb บำรุงรักษาตามวาระ › <ชื่อแผน> › ไตรมาส 1 */
  const { scr, page } = await shell(name, { title: Q, back: true, crumbs: [P[1], Q], badge: PST.active });
  const tripOf = (i) => trips.findIndex(t => t.sel.indexOf(i) >= 0);
  /* เพิ่ม ลด แก้ไข รถในไตรมาส (เจ้าของงาน 4 พ.ย. 2569 "หน้า E.1 ต้องสามารถ เพิ่มลด จำนวน หรือแก้ไขได้ด้วย" · เลือก เพิ่มหรือเอารถออกจากไตรมาส + แก้เบอร์ติดต่อและสถานที่ · ไม่ต้องส่งอนุมัติแผนใหม่)
     ปุ่ม "เพิ่มรถ" ที่หัวส่วน (แบบฟอร์มแผนเดินทาง) · ไอคอนแก้ไข + ลบ ท้ายแถว (แบบตารางรถในแผนเดินทาง TRIP_CAR_COLS) · คันที่อยู่ในแผนเดินทางแล้วเหลือไอคอนแก้ไข (เอาออกจากแผนเดินทางก่อน)
     o.added = รถที่เพิ่มเข้าไตรมาส (ลำดับใน Q_EXTRA) · o.removed = ลำดับรถใน TRIP_CARS ที่เอาออก */
  const qAll = o.cars || (o.added || []).map(k => [Q_EXTRA[k], -1]).concat(TRIP_CARS.map((c, i) => [c, i]).filter(([, i]) => (o.removed || []).indexOf(i) < 0));   // คันที่เพิ่มใหม่ขึ้นก่อน
  const qCars = qAll.slice(0, TABLE_MAX.rows);   // Table ของไลบรารีได้ 10 แถว (R8) ⇒ เกินแสดงหน้าแรก + pagination
  /* 11 พ.ย. 2569 เจ้าของงาน _"ต้องสามารถเพิ่มรถรายคันได้ โดยเงื่อนไขการเพิ่มรถคือ ถ้าไตรมาสนั้นยังบำรุงไม่เสร็จทุกคันจะสามารถเพิ่มรถเข้ามาไตรมาสนั้นๆ ได้"_ (R93)
     ⇒ ปุ่ม "เพิ่มยานพาหนะ" กดได้ตราบที่ยังมียานพาหนะในไตรมาสที่ยังไม่ปิดงาน · ทุกคันปิดงานแล้ว (เสร็จสิ้น หรือ บำรุงรักษาไม่ได้ — เจ้าของงานเคาะนับว่าเสร็จ) = State Disabled
     ชุดยานพาหนะใน popup คงเดิม (ขอบเขตของแผน ภาค เขต ประเภท ที่ยังไม่อยู่ในไตรมาสใด ติ๊กทีละคัน) · คันเสร็จสิ้นไม่มีเมนู … (ไม่มีอะไรให้ทำต่อ) · คันบำรุงรักษาไม่ได้ยังมีเมนูย้ายไตรมาส (S25) */
  const closed = (c) => J[c[0]] === 'done' || J[c[0]] === 'cannot';
  const qDone = qAll.length > 0 && qAll.every(([c]) => closed(c));
  const cars = col('Section', [await sectionLabel('ยานพาหนะใน' + Q, { badge: qAll.length, buttons: [{ kind: 'Secondary button', text: 'เพิ่มยานพาหนะ', icon: 'add-24-300-round', disabled: qDone }] }),
    await tblShort(TRIP_Q_COLS.concat([['', 104]]), qCars.map(([c, i]) => { const k = i >= 0 ? tripOf(i) : -1, sub = (o.subs || {})[c[0]];
      /* R82 ช่องตามชุด TRIP_V_COLS (ไม่มีสถานที่) · ยานพาหนะที่เพิ่มเข้าไตรมาส (Q_EXTRA) และที่ย้ายมา (S25 MOVE_Q2_PAGE) ยังไม่อยู่ในแผนเดินทาง ⇒ ผู้ดูแลจากข้อมูลยานพาหนะ วันดำเนินการ "—" เรียงตามชุดเดียวกัน
         เบอร์ติดต่อ = เบอร์บรรทัดบน ชื่อผู้ดูแลบรรทัดรอง แบบ tripPhoneCell (9 พ.ย. 2569 · 10 พ.ย. 2569 แก้จุดนี้ที่ยังเป็นชื่อบน เบอร์ล่าง) */
      const base = i >= 0 ? tripVCells(i, k >= 0 ? trips[k] : {}, { drop: ['สถานที่บำรุงรักษา'] }) : [c[0], typeOf(c), c[1], c[2], { text: c[3], sub: c[4] }, '—'];
      if (sub) base[0] = { text: c[0], sub };
      return base.concat([J[c[0]] ? { pill: WSTAT[J[c[0]]] } : k >= 0 ? { text: trips[k].name, sub: 'เพิ่มเข้าแผนเดินทางแล้ว' } : { pill: ['ยังไม่มีแผนเดินทาง', 'Gray'] },   /* 6 พ.ย. 2569 เจ้าของงาน "หลังจากสร้างแผนการเดินทางแล้ว รถที่เพิ่ม จะแสดงว่าถูกเพิ่มแล้ว" */ J[c[0]] === 'done' ? '' : J[c[0]] ? { menu: 1, items: [MAINT_ITEM, MOVE_ITEM] } : { icons: k >= 0 ? ['stylus-24-300-round'] : ['stylus-24-300-round', 'delete-24-300-round'] }]); }), qAll.length > qCars.length ? { pagination: { shown: qCars.length, total: qAll.length } } : {})], 16);
  const free = qAll.filter(([, i]) => i < 0 || tripOf(i) < 0).length;   // 5 พ.ย. 2569 รีวิว "สามารถสร้างแผนได้จนกว่าจะไม่เหลือรถอยู่แล้ว" ⇒ รถทุกคันอยู่ในแผนเดินทางแล้ว ปุ่มกดไม่ได้
  const sec = col('Section', [await sectionLabel('แผนเดินทาง', { badge: trips.length, buttons: [{ kind: 'Primary button', text: 'สร้างแผนเดินทาง', icon: 'add-24-300-round', disabled: !free }] })], 16);
  if (trips.length) add(sec, await tblShort(TRIP_COLS, trips.map(t => [{ text: t.name, sub: tripPlaces(t) }, t.d1 + ' – ' + t.d2, String(t.sel.length), tripBy(t), { pill: TST[t.st] }, { icons: ['keyboard_arrow_right-20-400-round'] }])), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ยังไม่มีแผนเดินทาง'); await text(es, 'Supporting text', 'สร้างแผนเดินทางเพื่อนัดวันเข้าตรวจ แจ้งผู้ดูแลยานพาหนะและ กรย.'); const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false; const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'สร้างแผนเดินทาง', 'Leading icon swap': icon('add-24-300-round') }); }
  /* อะไหล่ในไตรมาส n (6 พ.ย. 2569 เจ้าของงาน "หน้าที่ รวมรถในไตรมาส จะเป็นรวมแยกตามรายการ ไม่ต้องมีจาก smart inventory" · แทนหน้าความคืบหน้าอะไหล่ S4 เดิม)
     Section label + Table QPART_COLS (R81) · ดูอย่างเดียว · ยอด = PARTS ของไตรมาสที่กำลังทำ · o.parts = { qty, subs } ไตรมาสอื่น (S25 รวมอะไหล่ของยานพาหนะที่ย้ายมา บรรทัดรองใต้ชนิด) */
  /* 9 พ.ย. 2569 (ตามเว็บ): รายการที่จำนวนเป็น 0 ไม่แสดง · ไม่เหลือสักรายการ (ยานพาหนะในไตรมาสไม่เบิกอะไหล่ทุกคัน หรือไม่มียานพาหนะ) = Empty state/Data empty
     ข้อความเดียวกับหัวข้ออะไหล่ในแผนของ S2 (planPartsSec): "ยังไม่มีรายการอะไหล่" / "ไตรมาสนี้ไม่มีอะไหล่ที่ต้องเบิก" · o.parts.qty = [] ⇒ จอว่าง */
  const pq = o.parts || {}, qParts = PARTS.map((p, x) => [(pq.subs || {})[x] ? { text: p[0], sub: pq.subs[x] } : p[0], p[1], p[2], String(pq.qty ? pq.qty[x] || 0 : p[3]), p[4]]).filter(r => +r[3] > 0);
  const parts = col('Section', [await sectionLabel('อะไหล่ใน' + Q), qParts.length ? await tblShort(QPART_COLS, qParts) : await noParts(Q_PARTS_EMPTY)], 16);
  add(page, col('Content', [await vehicleInfo(o.q ? PLAN_KV.map(([k, v]) => k === 'ไตรมาส' ? [k, Q + ' (' + qAll.length + ' คัน)'] : [k, v]) : TRIP_KV, 'รายละเอียดแผน'), cars, parts, sec], 32), 'h');
  if (MOB) qCars.forEach(([c], r) => { if (J[c[0]] && J[c[0]] !== 'done') moveCard(scr, r, o.moveOff); });   // S25 มือถือ: ปุ่ม "ย้ายไปไตรมาสอื่น" บนการ์ด (Mobile table item Style=Action buttons)
  return scr;
}
/* ฟอร์มสร้างแผนเดินทาง — 2 พ.ย. 2569 เจ้าของงาน: สถานที่บำรุงรักษารายคัน ค่าเริ่มต้นสำนักงานที่รถอยู่
   3 พ.ย. 2569 เจ้าของงาน: เลือกรถจากรายการรถทั้งหมดของไตรมาส ผ่านปุ่ม "เพิ่มรถ" (popup tripCarModal) · 1 ไตรมาสมีหลายแผนเดินทางได้
   รถที่อยู่ในแผนเดินทางใดแล้วไม่มีให้เลือกในแผนเดินทางถัดไป
   o.sel = รถในแผนเดินทางนี้ (ลำดับใน VEH) · o.locs = สถานที่ที่แก้ { ลำดับรถ: ข้อความ } · o.phones = ผู้ดูแลยานพาหนะที่แก้ { ลำดับรถ: [ชื่อ, เบอร์] } */
const TRIP_CAR_COLS = tripVCols().concat([['', 104]]);   // 6 พ.ย. 2569 + ประเภทยานพาหนะ + วันดำเนินการ (Table 8 คอลัมน์เต็ม) · R82 ชุด TRIP_V_COLS + ไอคอนแก้ไข ลบ
/* อะไหล่ของแผนเดินทาง (6 พ.ย. 2569 รีวิว S6 "เพิ่ม section ของอะใหล่ ทริปนี้") — ตาราง QPART_COLS ชุดเดียวกับอะไหล่ในไตรมาส (R81) ดูอย่างเดียว รวมจากยานพาหนะในใบ (tripParts)
   หน้า Create/Edit (ฟอร์ม S6 S9) = Section header + Badge (R3) · หน้า Detail (S7 S8 S10) = Section label "(n)" (R5 R11) · ไม่มียานพาหนะ = Empty state/Data empty "ยังไม่มีรายการอะไหล่" แบบ noParts ของ S1
   วางต่อจากตารางยานพาหนะในแผนเดินทาง (แบบหัวข้ออะไหล่ในไตรมาส n ของหน้าไตรมาส) */
const TRIP_PARTS_EMPTY = 'เพิ่มยานพาหนะเข้าแผนเดินทางแล้ว อะไหล่ของยานพาหนะแต่ละคันจะรวมมาที่นี่';
async function tripPartsSec(sel, detail) {
  const rows = tripParts(sel), head = detail ? await sectionLabel('อะไหล่ของแผนเดินทาง') : await section('อะไหล่ของแผนเดินทาง'); // 9 พ.ย. 2569 เจ้าของงาน "เอาเลขออกไปเลยได้ป่ะ ถ้าหมายถึงจำนวนชนิด" ⇒ หัวข้ออะไหล่รวมตามรายการไม่มีตัวเลขจำนวนชนิด
  return col('Section', [head, rows.length ? await tblShort(QPART_COLS, rows) : await noParts(TRIP_PARTS_EMPTY)], 16);
}
async function tripForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const head = o.edit ? 'แก้ไขแผนเดินทาง' : 'สร้างแผนเดินทาง';   // o.edit = แก้ใบที่ผู้อนุมัติส่งกลับ (S7) · ฟอร์มเดียวกัน ปุ่มท้าย "ส่งอนุมัติใหม่"
  const { scr, page } = await shell(name, { title: head + ' · ' + NOW_Q, back: true, crumbs: [P[1], NOW_Q, head] });   // 5 พ.ย. 2569 breadcrumb ต่อจากหน้า "ไตรมาส 1"
  const sel = o.sel || [];
  const car = { sec: col('Section', [await section('ยานพาหนะในแผนเดินทาง', { badge: sel.length || null, buttons: [{ kind: 'Secondary button', text: 'เพิ่มยานพาหนะ', icon: 'add-24-300-round' }] })], 16) };
  const hire = o.mode === 'hire';   // o.mode = 'hire' จ้างดำเนินการ (S9) · ค่าเริ่มต้น ดำเนินการเอง (S6)
  const ft = { d1: v.d1, d2: v.d2, works: o.works, locs: o.locs, phones: o.phones, hire };   // ค่าในฟอร์ม = ใบแผนเดินทาง (R82 tripVCells) · o.works = วันดำเนินการที่แก้ { ลำดับยานพาหนะ: [ตั้งแต่, ถึง] }
  if (sel.length) add(car.sec, await tblShort(TRIP_CAR_COLS, sel.map(i => tripVCells(i, ft).concat([{ icons: ['stylus-24-300-round', 'delete-24-300-round'] }]))), 'h');
  else add(car.sec, await noTripCars(), 'h');   // 5 พ.ย. 2569 เลิก Alert "กรุณาเพิ่มรถเข้าแผนเดินทางอย่างน้อย 1 คัน" — ปุ่มยืนยัน Disabled จนกว่าจะมีรถแทน
  // 3 พ.ย. 2569 เจ้าของงาน: ชื่อแผนเดินทางกับรูปแบบดำเนินการแถวเดียวกันคนละครึ่ง radio เล็ก (เดิม Radio text card เต็มแถว) · mobile เรียงลงตาม row()
  // 6 พ.ย. 2569 เจ้าของงาน "เปลี่ยนคำ กบค ดำเนินการเอง เป็น ดำเนินการเอง"
  const mode = radioGroup('รูปแบบดำเนินการ', ['ดำเนินการเอง', 'จ้างดำเนินการ'], hire ? 1 : 0);
  const vendor = hire ? dropdown('ผู้รับจ้าง', v.vendor, { placeholder: 'ค้นหาชื่อผู้รับจ้าง', lead: 'search-24-300-round', error: E('กรุณาเลือกผู้รับจ้าง'), state: o.vendorOpen ? 'Focused' : undefined }) : null;
  const d1 = field(hire ? 'วันที่เริ่มงาน' : 'วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม'), state: o.dateOpen ? 'Focused' : undefined });
  const d2 = field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') });
  /* 5 พ.ย. 2569 รีวิว (E.7 ไม่ถูกต้อง) "ระบบเราใช้ Validate แบบต้องกรอกข้อมูลที่ require ครบถึงจะ enable ปุ่ม" ⇒ ปุ่มยืนยัน Disabled จนกว่าช่องบังคับครบ · o.errors = Validation กรณีไม่ได้ระบุข้อมูล, Out of focus */
  const complete = !!(v.name && sel.length && v.d1 && v.d2 && (hire ? v.vendor : v.staff && v.staff[0] && v.staff[1]));
  /* 6 พ.ย. 2569 เจ้าของงาน "เปลี่ยนคำของพนักงาน กบค" + "จำนวนคนเดินทาง เพิ่ม ได้ไม่จำกัด" ⇒ หัวข้อ "พนักงานที่เดินทาง" (เดิม พนักงาน กบค. ซ่อม 2-3 คน) · 1 คน 1 แถว
     แบบเดียวกับแถวพนักงานในค่าใช้จ่ายตอนปิดงาน (closeCosts · เจ้าของงาน 3 พ.ย. "เพิ่ม ลด พนักงานได้"): Input dropdown ค้นชื่อ + ปุ่มลบ Tertiary button ไอคอนอย่างเดียว + ปุ่ม "เพิ่มพนักงาน" ใต้แถว
     ยังต้องมีอย่างน้อย 2 คนเหมือนเดิม (ช่องคนที่ 1 2 ขึ้น error) · ฟอร์มว่างแสดง 2 แถว
     9 พ.ย. 2569 เจ้าของงาน "พนักงานสามารถเพิ่มได้ไม่จำกัด และ เป็น 1 คน 1 แถว เป็นชื่อ สกุล ตำแหน่ง เบอร์โทร" ⇒ แถวละ ชื่อ-สกุล (Input dropdown ค้นหา) · ตำแหน่ง (Text input Readonly เติมจากข้อมูลพนักงานเมื่อเลือกชื่อ) · เบอร์โทร (Text input เติมจากข้อมูลพนักงาน แก้ได้) · ปุ่มลบ
     แบบคู่ ผู้ดูแลยานพาหนะ / เบอร์ติดต่อ ของ popup ยานพาหนะในแผนเดินทาง (R83) */
  const delBtn = () => inst('Tertiary button', { State: 'Default', Size: 'md' }, { 'Button text': false, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('delete-24-300-round') });
  const staffNames = v.staff && v.staff.length ? v.staff : ['', ''];
  const staff = staffNames.map((nm, i) => {
    const info = STAFF_INFO[nm] || ['', ''];
    const dd = dropdown('ชื่อ-สกุล', nm, { placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round', error: i < 2 ? E('กรุณาเลือกพนักงาน') : '' });
    const pos = field('ตำแหน่ง', info[0], { state: 'Readonly', placeholder: '-' });
    const tel = field('เบอร์โทร', info[1], { placeholder: '0XX-XXX-XXXX' });
    if (MOB) return col('Row', [dd, pos, tel, delBtn()], 16);
    const rw = row('Row', [dd, pos, tel], { align: 'MAX' }); rw.appendChild(delBtn());   // ปุ่มลบท้ายแถว ไม่ยืด
    return rw;
  });
  add(page, col('Content', [
    o.alert ? alertBox(...o.alert) : null,
    col('Section', [await section('ข้อมูลแผนเดินทาง'), row('Row', [field('ชื่อแผนเดินทาง', v.name, { placeholder: 'ระบุชื่อแผนเดินทาง', error: E('กรุณาระบุชื่อแผนเดินทาง') }), mode])], 16),   // ตามช่อง "ชื่อแผน" ของ S1 (ข้อมูลแผน) + radio แบบ 5.1 Rental Contract Management
    hire ? col('Section', [await section('ผู้รับจ้าง'), row('Row', [vendor, field('เลขที่สัญญา/ใบสั่งจ้าง', v.contract, { placeholder: 'ระบุเลขที่สัญญาหรือใบสั่งจ้าง', optional: true })])], 16) : null,
    // 6 พ.ย. 2569 เจ้าของงาน "ย้าย ช่วงวันเดินทางขึ้นมาก่อนเลือกรถ" + "พนักงาน ขึ้นไปก่อนการเลือกรถ" ⇒ ข้อมูลแผนเดินทาง → (ผู้รับจ้าง) → ช่วงวัน → พนักงาน → รถในแผนเดินทาง
    col('Section', [await section(hire ? 'ช่วงวันทำงาน' : 'ช่วงวันเดินทาง'), row('Row', [d1, d2, frame('Spacer', 'VERTICAL')])], 16),
    hire ? null : col('Section', [await section('พนักงานที่เดินทาง', { badge: v.staff && v.staff.length ? v.staff.length + ' คน' : null })].concat(staff, [btn('Secondary button', 'เพิ่มพนักงาน', { icon: 'add-24-300-round' })]), 16),
    car.sec,
    await tripPartsSec(sel),   // 6 พ.ย. 2569 อะไหล่ของแผนเดินทาง ใต้ตารางยานพาหนะ (R82)
    // 3 พ.ย. 2569 เจ้าของงาน: ค่าเบี้ยเลี้ยง ค่าที่พัก ค่าเดินทาง ไม่กรอกในแผนเดินทางแล้ว ย้ายไปกรอกรายคันตอนปิดงาน (S10) พร้อมเลือกงบ ตั้งต้นศูนย์ต้นทุนของหน่วยงานเจ้าของรถ
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', o.edit ? 'ส่งอนุมัติใหม่' : 'ยืนยันการสร้างแผนเดินทาง', { size: 'lg', disabled: !complete }]])
  ], 32), 'h');
  if (o.vendorOpen && vendor) comboAt(scr, vendor.findOne(n => n.name === 'Container') || vendor, VENDORS.map(x => [x[0], x[1], x[0] === v.vendor]));   // vendor list = Dropdown list ใต้ช่อง (R4 พิมพ์ค้น)
  if (o.modal) await tripCarModal(scr, o.modal);
  if (o.dateOpen && !MOB) {   // ปฏิทินช่วงวัน = Date picker Type=Dual ของไลบรารี วางใต้ช่องวันที่
    const dp = await thaiDatePicker(inst('Date picker', { Type: 'Dual' }, { 'Time picker': false }), ['พฤศจิกายน 2569', 'ธันวาคม 2569']);   // ช่วงวันเดินทาง 03–07/11/2569
    overlay(scr, dp, 0, 0);
    const sb = scr.absoluteBoundingBox, ab = d1.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4;
  }
  return scr;
}
/* ปฏิทิน Date picker ภาษาไทย (ชีตลูกค้า 5 พ.ย. 2569: ข้อความตั้งต้นของไลบรารีเป็นอังกฤษ "Dec 2024" "Today" "Cancel" "Apply") — ทุกคำเป็น property Text ของชิ้นซ้อน แก้ได้
   ตาม Date picker ในหน้า Vehicle Management ของ UI Release#2: หัวเดือน "มกราคม 2567" · ปุ่ม "ปิด" / "ตกลง" · ปุ่ม Today/Clear ไม่แสดง · ชื่อวันใส่อักษรย่อไทย (UI Release#2 ยังคง Mo–Su)
   ตัวเลขวันในตารางคงตามไลบรารี (ตำแหน่งวันของเดือนจริงจัดใน component ไม่ได้) */
const TH_WD = { Mo: 'จ.', Tu: 'อ.', We: 'พ.', Th: 'พฤ.', Fr: 'ศ.', Sa: 'ส.', Su: 'อา.' };
const ptext = (n) => { const cp = n.componentProperties || {}, k = Object.keys(cp).find(x => x.split('#')[0].trim() === 'Text'); return k ? cp[k].value : ''; };
async function thaiDatePicker(dp, months) {   // ตั้ง property แล้วทับชั้นข้อความที่เห็นด้วย (putText) กันค่าที่ component ทับไว้
  let m = 0;
  const put = async (n, v) => { setProps(n, { Text: v }); await putText(n, 'Text', v); };
  for (const n of dp.findAll(x => x.type === 'INSTANCE')) {
    const tl = n.findAll(x => x.type === 'TEXT' && x.name === 'Text' && x.visible !== false)[0];
    const t = tl ? tl.characters : ptext(n);   // อ่านค่าที่เห็นจากชั้นข้อความ (ตรงกับ property ในไฟล์จริง)
    if (n.name === 'Tertiary button' && /^[A-Z][a-z]{2} \d{4}$/.test(t)) await put(n, months[Math.min(m++, months.length - 1)]);
    else if (n.name === '_Date picker calendar item base' && TH_WD[t]) await put(n, TH_WD[t]);
    else if (n.name === 'Tertiary brand button') n.visible = false;
    else if (n.name === 'Secondary button') await put(n, 'ปิด');
    else if (n.name === 'Primary button') await put(n, 'ตกลง');
  }
  return dp;
}
const TRIP_DATES = { d1: TRIP.d1, d2: TRIP.d2 };   // ช่วงวันเดินทางของฟอร์ม (03–07/11/2569) = ช่วงที่เลือกวันดำเนินการได้ (R83)
const TRIP_FILLED = { name: 'ตรวจยานพาหนะ ขอนแก่น อุดรธานี ลำปาง', place: TRIP.place, d1: TRIP.d1, d2: TRIP.d2, staff: TRIP.staff, perDiem: TRIP.perDiem, lodging: TRIP.lodging, travel: TRIP.travel };
/* popup แก้ไขรถในแผนเดินทาง (ไอคอนแก้ไขในแถว) = formModal (Modal Type=Form) 2 ช่อง เบอร์ติดต่อ + สถานที่บำรุงรักษา · ค่าตั้งต้นในช่อง = ค่าปัจจุบันของแถว
   3 พ.ย. 2569 เพิ่มเบอร์ติดต่อ (เดิมแก้แค่สถานที่) · ตัวอย่างแสดงค่าที่กำลังแก้ */
/* 6 พ.ย. 2569 เจ้าของงาน "ตรงป๊อบอัพ เลยต้องมีให้แก้ชื่อโดย prefill ข้อมูลมาให้" ⇒ 3 ช่อง ผู้ดูแลยานพาหนะ (ค่าเริ่มต้นชื่อผู้ควบคุมรถ) · เบอร์ติดต่อ · สถานที่บำรุงรักษา */
/* 6 พ.ย. 2569 รีวิว S6 "เพิ่มการเลือกวันดำเนิน จาก icon แก้ไข ได้ด้วย" + "โดยเลือกได้ไม่เกิน range ของแผนที่กำหนดมาเท่านั้น" + "เลือกซ้ำวันกันได้ เลือกเป็นช่วงวัน" (R83)
   ⇒ o.trip = ใบแผนเดินทาง/ค่าในฟอร์ม { d1, d2, works, hire|vendor } (ยานพาหนะอยู่ในแผนเดินทาง) — popup หัว "แก้ไขยานพาหนะในแผนเดินทาง · {ทะเบียน}" 4 ช่องใน Modal Type=Form md (Card form row 3 แถว):
   แถว 1 ผู้ดูแลยานพาหนะ | เบอร์ติดต่อ (Input 1 + Input 2 ของ Card form row) · แถว 2 สถานที่บำรุงรักษา · แถว 3 วันดำเนินการ (ช่วงวันในช่องเดียว "วว/ดด/ปปปป - วว/ดด/ปปปป" ไอคอนปฏิทินนำหน้า
   แบบ Date range picker / Trip date ของ UI Release#2 หน้า 5.2 Vehicle Management = Text input + Date picker Type=Single แสดงช่วงด้วย Selected day / Day in range) · ค่าเริ่มต้นทั้งช่วงวันเดินทาง (แผนจ้าง = ช่วงวันทำงาน)
   o.pick = [วันเริ่ม, วันสิ้นสุด] เปิดปฏิทินใต้ช่อง: วันนอกช่วงวันเดินทาง = _Date picker calendar item base State=Disabled (กดไม่ได้) · มือถือไม่วางปฏิทิน (แบบช่องวันที่ของ S6)
   ไม่มี o.trip (หน้าไตรมาส ยานพาหนะยังไม่อยู่ในแผนเดินทาง) = 3 ช่องแบบเดิม หัว "แก้ไขผู้ดูแลยานพาหนะและสถานที่ · {ทะเบียน}" */
const TH_MONTH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const dayOf = (s) => +s.split('/')[0], monthOf = (s) => { const [, m, y] = s.split('/'); return TH_MONTH[+m - 1] + ' ' + y; };
const workRange = (i, t) => (t.works || {})[i] || [t.d1, t.d2];
async function tripCarEdit(scr, i, phones, locs, o) {
  o = o || {};
  const t = o.trip, plate = TRIP_CARS[i][0];
  if (!t) { await formModal(scr, { title: 'แก้ไขผู้ดูแลยานพาหนะและสถานที่ · ' + plate, fields: [{ label: 'เบอร์ติดต่อ', value: tripPhone(i, phones) }, { label: 'ผู้ดูแลยานพาหนะ', value: tripCtrl(i, phones) }, { label: 'สถานที่บำรุงรักษา', value: tripLoc(i, locs) }], ok: 'บันทึก' }); return; }
  const w = o.pick || workRange(i, t);
  await formModal(scr, { title: 'แก้ไขยานพาหนะในแผนเดินทาง · ' + plate, fields: [{ pair: [{ label: 'เบอร์ติดต่อ', value: tripPhone(i, phones) }, { label: 'ผู้ดูแลยานพาหนะ', value: tripCtrl(i, phones) }] },   // เบอร์ก่อนชื่อ ตามคอลัมน์ (9 พ.ย. 2569)
    { label: 'สถานที่บำรุงรักษา', value: tripLoc(i, locs) }, { label: 'วันดำเนินการ', value: w[0] + ' - ' + w[1] }], ok: 'บันทึก' });
  const inp = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Text input' && propVal(n, 'Label text') === 'วันดำเนินการ').pop();
  if (!inp) { warn('popup แก้ไขยานพาหนะในแผนเดินทาง', 'ไม่พบช่องวันดำเนินการ'); return; }
  setProps(inp, { 'Leading icon': true, 'Leading icon swap': icon('calendar_month-24-300-round') });
  if (!o.pick) return;
  const val = w[0] + ' - ' + w[1];
  setProps(inp, { State: 'Focused' }); setProps(inp, { Text: val, 'Show Placeholder': false, 'Leading icon': true, 'Leading icon swap': icon('calendar_month-24-300-round') });   // เปลี่ยน variant แล้วใส่ค่าซ้ำ (ชั้นข้อความกลับเป็นค่าตั้งต้นของ variant)
  { const ct = find(inp, 'Container'), tv = ct && ct.findOne(n => n.type === 'TEXT' && n.visible !== false); if (tv && tv.characters !== val) await text(ct, tv, val); }
  if (MOB) return;
  const dp = await rangeDays(await thaiDatePicker(inst('Date picker', { Type: 'Single' }, { 'Time picker': false }), [monthOf(t.d1)]), dayOf(t.d1), dayOf(t.d2), dayOf(w[0]), dayOf(w[1]));
  overlay(scr, dp, 0, 0);
  pin(() => { const sb = scr.absoluteBoundingBox, ab = inp.absoluteBoundingBox; dp.x = ab.x - sb.x; const below = ab.y - sb.y + ab.height + 4; dp.y = below + dp.height > VH() ? ab.y - sb.y - dp.height - 4 : below; });   // ใต้ช่อง · ล้นขอบล่างของจอให้ขึ้นเหนือช่อง
}
/* ช่วงวันในปฏิทิน Date picker (ตาม Date picker Type=Dual ของไฟล์ Component + Date range picker / Trip date ของ UI Release#2): วันเริ่มและวันสิ้นสุด = Type "Selected day" · ระหว่างนั้น = "Day in range"
   วันนอกช่วงที่เลือกได้ (lo..hi = ช่วงวันเดินทาง) = Type "Day" State "Disabled" · วันของเดือนถัดไปที่ไลบรารีตั้ง Disabled ไว้แล้วไม่แตะ · ตำแหน่งวันในตารางคงตามไลบรารี (แบบ thaiDatePicker) */
async function rangeDays(dp, lo, hi, a, b) {
  for (const n of dp.findAll(x => x.type === 'INSTANCE' && x.name === '_Date picker calendar item base')) {
    const tl = n.findAll(x => x.type === 'TEXT' && x.name === 'Text' && x.visible !== false)[0], d = +((tl ? tl.characters : ptext(n)) || '').trim();
    if (!d || propVal(n, 'State') === 'Disabled') continue;   // ชื่อวัน (จ. อ. …) และวันของเดือนถัดไป
    const out = d < lo || d > hi, ends = d === a || d === b, mid = d > a && d < b;
    setProps(n, { Type: out ? 'Day' : ends ? 'Selected day' : mid ? 'Day in range' : 'Day', State: out ? 'Disabled' : 'Default' });
    setProps(n, { 'Left connector': mid || (ends && d === b && a !== b), 'Right connector': mid || (ends && d === a && a !== b), Indicator: false });
  }
  return dp;
}
async function noTripCars() { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มียานพาหนะในแผนเดินทาง'); await text(es, 'Supporting text', 'กดเพิ่มยานพาหนะเพื่อเลือกยานพาหนะของ' + NOW_Q + ' ที่ยังไม่อยู่ในแผนเดินทางใด'); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
/* popup เพิ่มรถเข้าแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "รายการรถทั้งหมดที่อยู่ในแผนไตรมาสนั้น โดยมีปุ่มให้เพิ่มรถเข้าแผนการเดินทาง")
   ตามโครง Modal Type=Card list Size=xl "เลือกยานพาหนะ" ของไฟล์ Component (Modal header + Table header ค้นหา + เนื้อหา ขอบใน 24 ระยะ 24 มุม 12)
   + ตารางติ๊กเลือกรถ Table Lead checkbox ตามหน้า Vehicle Management "Export reports - Select vehicles" ของ UI Release#2 + Modal footer Horizontal right
   Modal instance เพิ่มตารางข้างในไม่ได้ ⇒ วางชิ้นไลบรารีเรียงในกรอบ Modal แบบเดียวกับ bottom sheet (§จ) · กว้าง 800 = Modal Size=lg · mobile = bottom sheet
   o.pool = รถที่เลือกได้ (ของไตรมาสที่ยังไม่อยู่ในแผนเดินทางใด และยังไม่อยู่ในใบนี้) · o.ticked = ที่ติ๊กไว้ · o.used = จำนวนรถของไตรมาสที่อยู่ในแผนเดินทางอื่นแล้ว */
const TRIP_PICK_COLS = [['ทะเบียน', 300], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของยานพาหนะ', 200]];
/* 5 พ.ย. 2569 รีวิว "รถ 1 คันในไตรมาส สามารถอยู่ได้เพียง 1 แผนการเดินทางเท่านั้น · รถที่ถูกเลือกลงแผนอื่นไปแล้ว จะยังแสดงให้เห็นตอนที่กดเพิ่มรถเข้าแผนเดินทาง แต่ไม่สามารถเลือกลงแผนเดินทางนี้ได้"
   ⇒ o.taken = { ลำดับรถ: ชื่อแผนเดินทาง } แสดงในตาราง Checkbox State=Disabled + บรรทัดรอง "อยู่ในแผนเดินทาง {ชื่อ}" (Table cell Lead checkbox · มือถือ List with checkbox item State=Disabled) · ติ๊กทั้งหมดนับเฉพาะคันที่เลือกได้ */
async function tripCarModal(scr, o) {   // o.cars = รายการรถแทน TRIP_CARS (เพิ่มรถเข้าไตรมาส E.19) · o.title · o.sub · o.okText · o.pool = รถที่แสดง (ไม่รวมคันที่อยู่ในใบนี้แล้ว) · o.taken
  /* o.pagination = { shown, total } ส่งต่อให้ tblShort ⇒ Table pagination ใต้ตาราง (desktop ในตัว Table · มือถือ Breakpoint=Mobile ใต้การ์ด) · 12 พ.ย. 2569 เจ้าของงาน "ป๊อบอัพ ควรมีแบ่งหน้า" ใช้เฉพาะ popup เพิ่มยานพาหนะเข้าไตรมาส (E.19 · R104) · popup เพิ่มเข้าแผนเดินทางไม่ส่ง = ไม่มีตัวแบ่งหน้าเหมือนเดิม */
  const pg = o.pagination ? { pagination: o.pagination } : undefined;
  const cars = o.cars || TRIP_CARS, pool = o.pool, ticked = o.ticked || [], n = ticked.length, taken = o.taken || {}, nTaken = pool.filter(i => taken[i]).length;
  const sub = o.sub || ('ยานพาหนะทุกคันของ' + NOW_Q + (nTaken ? ' · ' + nTaken + ' คันอยู่ในแผนเดินทางอื่นแล้ว เลือกไม่ได้' : ''));
  const ok = (o.okText || 'เพิ่มเข้าแผนเดินทาง') + (n ? ' (' + n + ')' : '');
  const rows = pool.map(i => [{ check: !taken[i] && ticked.indexOf(i) >= 0, text: cars[i][0], sub: taken[i] ? 'อยู่ในแผนเดินทาง ' + taken[i] : '', disabled: !!taken[i] }, cars[i][1], cars[i][2]]);
  const empty = async () => { const es = inst('Empty state/Data empty'); await text(es, 'Text', o.empty ? o.empty[0] : 'ยานพาหนะทุกคันของ' + NOW_Q + ' อยู่ในแผนเดินทางแล้ว'); await text(es, 'Supporting text', o.empty ? o.empty[1] : 'ไม่มียานพาหนะที่เพิ่มเข้าแผนเดินทางนี้ได้'); /* o.empty = [หัว, บรรทัดรอง] (R75) */ const a = find(es, 'Actions'); if (a) a.visible = false; return es; };
  const search = () => { const f = field('', '', { placeholder: 'ค้นหาทะเบียน, ยี่ห้อ/รุ่น, หน่วยงาน', lead: 'search-24-300-round' }); setProps(f, { Label: false, Helper: false }); return f; };
  if (MOB) { await popupModal(scr, { title: o.title || 'เพิ่มยานพาหนะเข้าแผนเดินทาง', body: pool.length ? [search(), await tblShort(TRIP_PICK_COLS, rows, pg)] : [await empty()], ok, okOff: !n }); return; }
  const body = [];
  if (pool.length) {
    const th = await tableHeader({ placeholder: 'ค้นหาทะเบียน, ยี่ห้อ/รุ่น, หน่วยงาน' });
    const acts = find(th, 'Actions'); if (acts) acts.visible = false;
    const t = await tblShort(TRIP_PICK_COLS, rows, pg);
    headCheck(t, rows);   // เลือกทั้งหมดที่หัวคอลัมน์แรก (ตาม Select vehicles) นับเฉพาะคันที่เลือกได้
    body.push(th, t);
  } else body.push(await empty());
  await popupModal(scr, { title: o.title || 'เพิ่มยานพาหนะเข้าแผนเดินทาง', sub, w: 800, body, ok, okOff: !n });
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
  // ปุ่มของ Modal footer อยู่ใน Actions > "Primary and secondary actions" (แบบ formModal ใน core · 5 พ.ย. 2569) — เดิมกรองแค่ลูกของ Actions ปุ่มหลักจึงค้างคำของไลบรารี
  ft.findAll(b => b.type === 'INSTANCE' && /button/.test(b.name) && b.parent && (b.parent.name === 'Actions' || b.parent.name === 'Primary and secondary actions')).forEach(b => {
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
/* ตารางสั้นไม่มีแบ่งหน้า (5 พ.ย. 2569 ชีตลูกค้า: ข้อความตัวอย่าง "แสดง 1 ถึง 10  จาก 95 รายการ" ของ Table ค้างในจอที่รายการน้อย)
   tbl() ปิด property Pagination แล้ว แต่ชั้น Table pagination ในไฟล์จริงยังเห็น ⇒ ซ่อนชั้นนั้นตรงๆ · ใช้กับทุกตารางของปลั๊กอินนี้ที่ไม่แบ่งหน้า (ตารางที่แบ่งหน้าส่ง o.pagination ตัวเลขจริงตาม fillPagination)
   5 พ.ย. 2569 รอบ 2: จาก S10 S12 ขยายเป็นทุก tbl() ของปลั๊กอินบำรุงรักษา (Overhaul / ประเมินผู้รับจ้าง ไม่แตะ) */
/* 9 พ.ย. 2569 เจ้าของงาน (ภาพหน้ารายละเอียดแผน) "รายละเอียด ควรเป็นการ จอง section แบบได้แค่ 10 รายการ และถ้าเกินจะมี pagiation มา"
   ⇒ ตารางที่ไม่ได้กำหนดการแบ่งหน้าเอง แสดงไม่เกิน 10 แถว (TABLE_MAX.rows) เกินแล้วแสดงหน้าแรก 10 แถว + Table pagination "แสดง 1 ถึง 10 จาก n รายการ" · ไม่เกินไม่มีตัวแบ่งหน้า */
async function tblShort(cols, rows, o) {
  if (!(o && o.pagination) && rows.length > TABLE_MAX.rows) { o = Object.assign({}, o, { pagination: { shown: TABLE_MAX.rows, total: rows.length } }); rows = rows.slice(0, TABLE_MAX.rows); }
  const t = await tbl(cols, rows, o); if (!(o && o.pagination)) (t.findAll ? t.findAll(n => n.name === 'Table pagination') : []).forEach(n => { n.visible = false; }); return t;
}
const JOB_T = tripAs(TRIP_1, 'approved'), JOB_I = TRIP_1.sel[0];
const JOB_START = '04/11/2569 08:42 น.', JOB_END = '04/11/2569 11:15 น.', JOB_BY = TRIP.staff[0] + ' (' + UNITS[0] + ')';
const JOB_MIX = { [TRIP_1.sel[0]]: 'done', [TRIP_1.sel[1]]: 'doing', [TRIP_1.sel[2]]: 'cannot' };   // หลังปิดงานคันแรก: คันที่ 2 กำลังทำ · คันที่ 3 บำรุงรักษาไม่ได้ · คันที่ 4 ยังไม่เริ่ม
const JOB_CANNOT = 'ยานพาหนะติดภารกิจซ่อมสายส่งฉุกเฉิน ไม่อยู่ที่จุดนัดในวันเดินทาง';
const TRIP_JOB_COLS = tripVCols({ unitSub: true }).concat([['สถานะงาน', 260, 'Badge'], ['', 72]]);   // R82 ชุด TRIP_V_COLS (หน่วยงานเป็นบรรทัดรองของทะเบียน ให้พอ 8 คอลัมน์) + สถานะงาน + ปุ่ม … · 260 = สองป้าย (สถานะ + ผลน้ำมัน · 4 พ.ย. 2569 เดิม 320)
/* ปุ่ม "…" ท้ายแถวรถ (3 พ.ย. 2569 เจ้าของงาน "คอลัมน์สุดท้ายอยากได้เป็นจุดสามจุดที่กดไปมีดูรายละเอียด แก้ไข และลบ") แบบเมนูรายการแผน S19 S20 (planMenu)
   รายการตามสถานะงาน (เสนอ): ยังไม่เริ่ม = ดูรายละเอียด แก้ไข ลบ · อยู่ระหว่างบำรุงรักษา = ดูรายละเอียด แก้ไข · เสร็จสิ้น / บำรุงรักษาไม่ได้ = ดูรายละเอียด
   แก้ไข = popup แก้เบอร์ติดต่อและสถานที่ (tripCarEdit เดียวกับ S6) · ลบ = ยืนยันแล้วเอารถออกจากแผนเดินทาง */
const JOB_MENU = { todo: MENU, doing: MENU.slice(0, 2), done: MENU.slice(0, 1), cannot: MENU.slice(0, 1) };   // done = คันที่เลือกน้ำมันแบบมีเก็บตัวอย่าง (ตัวอย่าง JOB_OIL) · ไม่ได้เก็บตัวอย่างเหลือ ดูรายละเอียด
/* S23 มุมผู้รับจ้าง: ทุกสถานะมีแค่ "ดูรายละเอียด" (เจ้าของงาน 4 พ.ย. 2569 "vendor ดูรายละเอียดรายคัน จะเห็นแค่ ปุ่มเริ่มงาน และบำรุงรักษาได้ โดยไม่เห็นปุ่ม ลบ และแก้ไข แต่ว่า กบค จะเห็น อยากให้แยก view" · คงเดิม 10 พ.ย. 2569 R87) */
const VENDOR_MENU = MENU.slice(0, 1);
/* ยืนยันการออก ชุดเดียวทุกฟอร์ม (5 พ.ย. 2569 ชีตลูกค้า: ฟอร์มสร้าง "ปิด"/"ออก" แต่ฟอร์มแก้ไข "ปิด"/"ยืนยัน") ⇒ ปุ่มตามหน้าต่างออกจากหน้าของงานซ่อม
   (ไฟล์ Maintain-D หน้า แจ้งซ่อม / Flow การซ่อม: "ยกเลิก" / "ยืนยัน") · ปุ่มเดียวกับยืนยันอื่นของปลั๊กอินนี้ (ยกเลิก + ปุ่มยืนยัน) · หัวและบรรทัดรองคงเดิม */
const EXIT_CONFIRM = (sub) => ({ title: 'ยืนยันการออก', sub, cancel: 'ยกเลิก', ok: 'ยืนยัน' });
const CAR_REMOVE_CONFIRM = (c) => ({ danger: true, title: 'ยืนยันการเอายานพาหนะออกจากแผนเดินทาง', sub: c[0] + ' จะถูกเอาออกจากแผนเดินทางนี้ และเลือกเข้าแผนเดินทางใบอื่นของไตรมาสได้อีก', cancel: 'ยกเลิก', ok: 'เอาออก' });
async function tripDetail(name, o) {   // หน้ารายละเอียดแผนเดินทาง (หลังอนุมัติ) · o.trip = ใบที่แสดง (ค่าเริ่ม JOB_T · ใบจ้าง HIRE_T ที่ หน่วยงานปิดงานแทนผู้รับจ้าง 4 พ.ย. 2569) · o.st = { ลำดับรถ: สถานะใน WSTAT } · o.menu / o.edit / o.del = เมนู … ของรถคันแรก
  o = o || {};
  const t = o.trip || JOB_T, st = (i) => (o.st || {})[i] || 'todo', cnt = (k) => t.sel.filter(i => st(i) === k).length, v = !!o.vendor;   // o.vendor = S23 มุมผู้รับจ้าง (R87)
  /* ตัวนับความคืบหน้า (รีวิว 5 พ.ย. 2569 "อยากให้มีนับ progress แบบ 0/10 ของรายการรถที่ตรวจแล้ว" · R71) = เสร็จสิ้น / (รถทั้งหมดในแผนเดินทาง − บำรุงรักษาไม่ได้)
     เจ้าของงาน 5 พ.ย. 2569 "ถ้าบำรุงรักษาไม่ได้ ไม่เอามานับ เช่น ถ้าทั้งหมด 10 แล้วมีคันที่ไม่ได้บำรุงรักษา จะเหลือ 9" · ใบจ้างนับแบบเดียวกัน
     S23 มุมผู้รับจ้าง (10 พ.ย. 2569 · เสนอ ยังไม่เคาะ): ตรวจแล้ว = ผู้รับจ้างทำเสร็จแล้ว (ดำเนินการบำรุงรักษาแล้ว · รอตรวจรับ · เสร็จสิ้น) · ไม่นับรวม = บำรุงรักษาไม่ได้ · แจ้งบำรุงรักษาไม่ได้ */
  const sum = (ks) => ks.reduce((a, k) => a + cnt(k), 0), doneK = v ? ['worked', 'wait', 'done'] : ['done'], outK = v ? ['reported', 'cannot'] : ['cannot'];
  const total = t.sel.length - sum(outK), counter = 'ตรวจแล้ว ' + sum(doneK) + '/' + total;
  const prog = (v ? 'ตรวจแล้ว ' + sum(doneK) : 'เสร็จสิ้น ' + cnt('done')) + ' จาก ' + total + ' คัน'
    + [['doing', ''], ['worked', ''], ['wait', ''], ['returned', ''], ['reported', ' (ไม่นับรวม)'], ['cannot', ' (ไม่นับรวม)']]
      .map(([k, x]) => cnt(k) ? ' · ' + WSTAT[k][0] + ' ' + cnt(k) + x : '').join('');
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: [P[1], NOW_Q, t.name], badge: TST.approved, actions: [TRIP_EXPORT_BTN] });   // 5 พ.ย. 2569 ต่อจากหน้า "ไตรมาส 1" · 6 พ.ย. 2569 ปุ่มส่งออกที่หัวหน้า (R84)
  const rows = t.sel.map(i => tripVCells(i, t, { unitSub: true }).concat([st(i) === 'done' && (o.oil || {})[i] ? { pills: [WSTAT.done, OIL_TAG[o.oil[i]]], pillsHead: 'ผลตรวจน้ำมัน' } : { pill: WSTAT[st(i)] }, { menu: 1, items: v ? VENDOR_MENU : JOB_MENU[st(i)] }]));   // o.oil = { ลำดับรถ: wait|fail } ป้ายผลน้ำมันต่อจากสถานะ (S12 · 4 พ.ย. 2569)
  add(page, col('Content', [await vehicleInfo(tripKv(t).concat([['ความคืบหน้า', prog]]), 'รายละเอียดแผนเดินทาง'),
    // ตัวนับ = Badge outline ใน Section header แบบ "รายการยานพาหนะในสัญญา" + Badge "2 รายการ" หน้า 5.1 Rental Contract Management ของ UI Release#2 (Section label ไม่มีช่อง Badge)
    col('Section', [await section('ยานพาหนะในแผนเดินทาง', { badge: counter }), await tblShort(TRIP_JOB_COLS, rows)], 16),
    await tripPartsSec(t.sel, true)], 32), 'h');   // 6 พ.ย. 2569 อะไหล่ของแผนเดินทาง (R82)
  const i0 = t.sel[0];
  if (o.menu) planMenu(scr, v ? VENDOR_MENU : JOB_MENU[st(i0)]);   // ใบจ้างที่หน่วยงานปิดงานแทน (S10) = เมนูชุดเดียวกับแผนดำเนินการเอง · มุมผู้รับจ้าง (S23) = ดูรายละเอียดอย่างเดียว (R87)
  if (o.edit) await tripCarEdit(scr, i0, t.phones, t.locs, { trip: t });   // 6 พ.ย. 2569 popup มีวันดำเนินการด้วย (R83)
  if (o.del) await confirm(scr, CAR_REMOVE_CONFIRM(TRIP_CARS[i0]));
  if (o.exportPdf != null) await tripExport(scr, o.exportPdf, t);   // R84 popup ส่งออกแผนเดินทาง
  return scr;
}
/* ---------- ส่งออกแผนเดินทาง (R84 · 6 พ.ย. 2569 เจ้าของงาน "ตอน export ก็เกี่ยวข้องด้วย" · plan.md "ปุ่มส่งออก PDF/Excel ข้อมูลทั้งหน้า (แนบเอกสารยืมยานพาหนะ)") ----------
   ปุ่ม Secondary button "ส่งออก" ไอคอน download ที่หัวหน้ารายละเอียดแผนเดินทาง (กรอบ Actions ข้าง Page header แบบปุ่มส่งออกของ S18 Overhaul R32 · ส่งออกไม่แก้ข้อมูล ฝั่งดูอย่างเดียว S8 ก็มี)
   popup = exportModal ชุดเดียวกับ S4 (Radio text card รูปแบบไฟล์ PDF / Excel) · ไม่มีการ์ดขอบเขต เพราะส่งออกใบเดียวทั้งหน้า · สำเร็จ = toast ขวาบน "ส่งออกไฟล์สำเร็จ" (คำเดียวกับ S4 และ Overhaul)
   ไฟล์ = docFrame ชุดเดียวกับ S4: PDF A4 2 หน้า (รายละเอียด + ยานพาหนะ · อะไหล่) · Excel 2 ชีต (ยานพาหนะ · อะไหล่) · คอลัมน์ = TRIP_V_COLS (R82) และ QPART_COLS (R81) ชุดเดียวกับจอ */
const TRIP_EXPORT_BTN = ['Secondary button', 'ส่งออก', 'download-24-300-round'];
const TRIP_SHEETS = ['ยานพาหนะในแผนเดินทาง', 'อะไหล่ของแผนเดินทาง'];
async function tripExport(scr, pdf, t) {
  return exportModal(scr, pdf, { title: 'ส่งออกแผนเดินทาง', sub: t.name + ' · รายละเอียดแผนเดินทาง ยานพาหนะ ' + t.sel.length + ' คัน และอะไหล่ของแผนเดินทาง' });
}
const tripDocHead = (t, page) => [sectionLabel('แผนเดินทาง · ' + t.name + ' · หน้า ' + page + '/2'), kv([['หน่วยงานที่ออกเอกสาร', CREATOR.replace(/^.*\((.*)\)$/, '$1')], ['แผน', P[0] + ' ' + P[1]], ['พิมพ์เมื่อ', '06/11/2569 10:30 น.'], ['ผู้พิมพ์', CREATOR]], 4)];
async function tripPdf(name, page, t) {
  t = t || JOB_T;
  return docFrame(name, 794, 1123, async () => {
    const [h, k] = tripDocHead(t, page), parts = tripParts(t.sel);
    if (page === 2) return [await h, k, col('Section', [await sectionLabel('อะไหล่ของแผนเดินทาง'), await tblShort(QPART_COLS, parts)], 12)];
    return [await h, k, col('Section', [await sectionLabel('รายละเอียดแผนเดินทาง'), kv(tripKv(t), 4)], 12),
      col('Section', [await sectionLabel('ยานพาหนะในแผนเดินทาง', { badge: t.sel.length }), await tblShort(tripVCols({ unitSub: true, fill: true }), t.sel.map(i => tripVCells(i, t, { unitSub: true })))], 12)];   // A4 กว้างไม่พอ 7 คอลัมน์ ⇒ หน่วยงานเป็นบรรทัดรองของทะเบียน
  });
}
async function tripXls(name, sheet, t) {
  t = t || JOB_T;
  return docFrame(name, 1440, 1024, async () => [await tabs(TRIP_SHEETS.map(s => [s, null]), sheet),
    sheet === 0 ? await tblShort(tripVCols(), t.sel.map(i => tripVCells(i, t))) : await tblShort(QPART_COLS, tripParts(t.sel))]);
}
/* S12 ผลการทดสอบน้ำมันไฮดรอลิก — 4 พ.ย. 2569 เจ้าของงาน "ไม่ได้อยากเป็น popup อยากได้เป็นส่วนหนึ่งของ flow เลย เช่น ถ้าเลือก เก็บตัวอย่างน้ำมันไฮดรอลิก ก็จะ มีให้เลือกเก็บผล แต่เป็น optional"
   + "ตอนนี้อยากให้ทางเข้าคือทางเดียวคือดูรายละเอียดแล้วเพิ่มในส่วนของรายละเอียด" ⇒ ใส่ผลได้ในหน้าปิดงาน (ไม่บังคับ) หรือภายหลังที่ section ในหน้างานรายคันที่เสร็จสิ้น · เลิก popup และเมนู "ผลการทดสอบน้ำมันไฮดรอลิก"
   รถที่เก็บตัวอย่างแต่ยังไม่มีผล = ป้าย "รอผลตรวจน้ำมัน" ต่อจากสถานะงาน (Table cell Style=Multiple badges · R49) · ผลไม่ผ่าน = "น้ำมันไม่ผ่าน" · ผ่าน = ป้ายสถานะอย่างเดียว
   (ช่องเดิม 3 พ.ย. 2569: radio ผ่าน/ไม่ผ่าน + ไฟล์ไม่บังคับ · ผลเก็บในข้อมูลรถ · ยังไม่แจ้งเจ้าของรถ) */
const OIL_FILE = pdf('oil-test-82-6789.pdf', '420 KB');
const OIL_TAG = { wait: ['รอผลตรวจน้ำมัน', 'Warning'], fail: ['น้ำมันไม่ผ่าน', 'Error'] };
const OIL_SAMPLED = (k) => k === 0 || k === 2;   // ตัวเลือกใน JOB_OIL_OPTS ที่มีการเก็บตัวอย่าง
async function oilResult(o) {   // o.sel (-1 ยังไม่เลือก · 0 ผ่าน · 1 ไม่ผ่าน) · o.files · o.errors · o.optional = หน้าปิดงาน
  return [row('Row', [radioGroup('ผลการทดสอบ' + (o.optional ? ' (ถ้ามี)' : ''), ['ผ่าน', 'ไม่ผ่าน'], o.sel == null ? -1 : o.sel, o.errors ? 'กรุณาเลือกผลการทดสอบ' : ''), frame('Spacer', 'VERTICAL')]),
    await upload('ไฟล์ผลการทดสอบ', o.files || [], { optional: true, hint: 'PDF, JPG, PNG · สูงสุด 10 ไฟล์', bar: true })];
}
/* Safety Inspection รถเครนและกระเช้า — JO 7.3.3 (4 พ.ย. 2569 เจ้าของงาน "อยากให้เพิ่มในส่วนของปิดงานคล้ายกับการเก็บผลของน้ำมันไฮดรอลิก ลอกแบบมาจากงาน overhaul ได้เลย")
   ลอกบล็อก M (S12 ตรวจสภาพ Safety) ของ Overhaul: File upload "เอกสาร Safety Inspection" ไม่บังคับ · "PDF, PNG, or JPG (สูงสุด 10 ไฟล์)" · แสดงเฉพาะรถเครนและรถกระเช้า
   ทางเข้าแบบผลน้ำมัน (S12): แนบตอนปิดงานได้ (ถ้ามี) หรือเพิ่มภายหลังที่ section ในหน้างานรายคันที่เสร็จสิ้น · การบังคับตรวจตามรอบปี/กฎหมายยังไม่ออกแบบ (ไฟล์ 14 ยังไม่เคาะ) */
const SAFETY_TYPES = ['กระเช้าฮอทไลน์', 'กระเช้าแก้ไฟ'], JOB_TYPE = typeOf(VEH[0]);   // JO 7.3.3 รถเครนและกระเช้า · ประเภทตามโค้ดจริงมีแต่กระเช้า (6 พ.ย. 2569)
const SAFETY_FILES = [{ name: 'Safety-Inspection-82-6789.pdf', size: '1.2 MB', bar: true }, { name: 'Image.jpg', size: '200 KB', progress: true }];   // กำลังอัปโหลด (แถบความคืบหน้า R48)
const SAFETY_DONE = [pdf('Safety-Inspection-82-6789.pdf'), { name: 'Image.jpg', size: '200 KB' }];
const safetyOn = () => SAFETY_TYPES.indexOf(JOB_TYPE) >= 0;
async function safetyDocs(files, view) {   // view = หน้างานรายคันแบบดู (Section label R3) · หน้าปิดงาน = Section header
  return [await (view ? sectionLabel : section)('Safety Inspection'), await upload('เอกสาร Safety Inspection', files || [], { optional: true, hint: 'PDF, PNG, or JPG (สูงสุด 10 ไฟล์)' })];
}
const JOB_COLS = [['รายการงาน', 0], ['อะไหล่ตามแผน', 320], ['จำนวนตามแผน', 140], ['หน่วย', 110], ['', 104]];   // ไอคอนแก้ไข + ลบ (3 พ.ย. 2569 เจ้าของงาน "อะไหล่ตามแผนสามารถแก้ไข ลบ เพิ่มได้") กว้าง 104 แบบตารางอะไหล่ในไตรมาสของ S1
/* น้ำมันไฮดรอลิกหน้างาน (3 พ.ย. 2569 เจ้าของงาน "หน้า I.8 I.9 อยากให้สามารถเลือกได้ว่าเก็บตัวอย่างน้ำมันไฮดรอลิก หรือเปลี่ยน เนื่องจากการเปลี่ยนน้ำมันเปลี่ยนทุก 3 ปี … หรือสามารถเลือกได้ว่าเก็บตัวอย่างและเปลี่ยน")
   Radio text card แบบ "น้ำมันไฮดรอลิก" ของหน้าอะไหล่ของรถ (S21) + ช่องเปลี่ยนน้ำมันครั้งล่าสุด · เลือกเก็บตัวอย่างอย่างเดียว = ไม่มีน้ำมันในรายการอะไหล่ · มีเก็บตัวอย่าง = เข้ารอผลตรวจ S12 */
const JOB_OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน', 'เก็บตัวอย่างและเปลี่ยน'], JOB_OIL = 2;
/* 5 พ.ย. 2569 รีวิว S10 "น้ำมันไฮดรอลิก เลือกตัวเลือก สามารถระบุวันที่เปลี่ยนน้ำมันครั้งล่าสุดได้" (R73) ⇒ ช่องเดิม Readonly เป็น Text input กรอกได้ "วันที่เปลี่ยนน้ำมันครั้งล่าสุด (ถ้ามี)"
   placeholder "วว/ดด/ปปปป" + ปฏิทิน Date picker Type=Single ใต้ช่อง (แบบช่องวันที่ของแผนเดินทาง S6 · ตอบรับนัดหมายวันเดียวของ Overhaul Q.1.1) · ค่าตั้งต้น = วันในข้อมูลรถ
   o.date = ค่าที่แสดง (null = ใช้ค่าในข้อมูลรถ · '' = ว่าง) · o.dateOpen = ช่องที่ปฏิทินเปิด */
/* วันที่เปลี่ยนน้ำมันครั้งล่าสุดของรถแต่ละคัน ค่าเดียวทุกจอ (ชีตลูกค้า 5 พ.ย. 2569: 12/03/2568 กับ 18/10/2568 ปนกัน) — ยึดข้อมูลการบำรุงรักษา S24 (MA_ROWS ช่อง "เปลี่ยนน้ำมันล่าสุด")
   ยกเว้นคันของงานตัวอย่าง S10 (82-6789) ที่ MA_ROWS เป็นค่าหลังปิดงานนี้ (04/11/2569) ⇒ ก่อนเริ่มงานใช้ 12/03/2568 · รถนอกแผนเดินทางใช้ LAST_OIL ตามลำดับ CAND */
function lastOil(plate) {
  const k = TRIP_CARS.findIndex(c => c[0] === plate);
  if (k === JOB_I) return LAST_OIL[0];
  const r = k >= 0 ? MA_ROWS.find(x => x[0] === k) : null;
  if (r) return r[4] || 'ไม่มีข้อมูล';   // r[4] = เปลี่ยนน้ำมันล่าสุด (10 พ.ย. 2569 MA_ROWS เพิ่มช่องไส้กรองอากาศ เดิมอ่าน r[5] = เก็บตัวอย่าง ผิด — agent เว็บเจอ)
  const j = CAND.findIndex(c => c[0] === plate);
  return j >= 0 ? LAST_OIL[j] : 'ไม่มีข้อมูล';
}
/* น้ำมันไฮดรอลิกตามแผนของรถแต่ละคันในไตรมาส (S21) — ค่าตั้งต้นของ Step 2 (ชีตลูกค้า 5 พ.ย. 2569: เดิมเลือก เก็บตัวอย่างและเปลี่ยน ทุกคัน) · ใช้ตารางรถในหน้ารายละเอียดแผนด้วย
   82-6789 (คันตัวอย่าง S10) = เก็บตัวอย่างและเปลี่ยน · อื่นตามตารางเดิม (ทุกคันที่ 3 เปลี่ยนน้ำมัน ที่เหลือเก็บตัวอย่าง) */
const TRIP_OIL = TRIP_CARS.map((_, i) => i === JOB_I ? JOB_OIL : i % 3 === 0 ? 1 : 0);
function oilDateField(o) {
  o = o || {};
  const v = o.date == null ? lastOil(o.car || TRIP_CARS[JOB_I][0]) : o.date;
  return field('วันที่เปลี่ยนน้ำมันครั้งล่าสุด', v, { placeholder: 'วว/ดด/ปปปป', optional: true, state: o.dateOpen ? 'Focused' : undefined });
}
async function jobOil(sel, res, o) {   // res = หน้าสรุปงาน: เลือกแบบที่มีการเก็บตัวอย่างแล้วมีช่องผลการทดสอบ (ถ้ามี) ต่อท้าย (S12 · 4 พ.ย. 2569) · o = ช่องวันที่ (oilDateField)
  const oil = await radioPick('น้ำมันไฮดรอลิก', JOB_OIL_OPTS, sel);
  const last = oilDateField(o);
  add(oil, MOB ? last : row('Row', [last, frame('Spacer', 'VERTICAL')]), 'h');
  if (res && OIL_SAMPLED(sel)) for (const n of await oilResult(Object.assign({ optional: true }, res))) add(oil, n, 'h');
  return oil;
}
const jobWork = (sel) => WORK.filter((w, k) => k > 0 || sel !== 0);   // แถวแรก = เปลี่ยนน้ำมันไฮดรอลิก
/* แผนจ้างดำเนินการ (4 พ.ย. 2569 เจ้าของงานตัด S23 S11 แล้วเลือก "กบค. ปิดงานรายคันของแผนจ้างเอง ใช้หน้างานรายคันและหน้าปิดงานเดียวกับ S10 กรอกแทนผู้รับจ้าง")
   o.hire = ใบจ้าง HIRE_T: กล่องการนัดหมายเป็นข้อมูลใบจ้าง (ผู้รับจ้าง · ช่วงวันทำงาน) · ปุ่ม ตาราง ไอคอนแก้ไข ลบ เหมือนแผนที่ กบค. ดำเนินการเอง ไม่มี view ผู้รับจ้างแล้ว */
/* 5 พ.ย. 2569 รีวิวทีมออกแบบ S10 "เมื่อกดเริ่มงาน จะพาเข้า Step การ Maintain" ⇒ หน้างานรายคันเหลือสถานะ ยังไม่เริ่ม อย่างเดียว (ปุ่ม เริ่มงาน)
   คันที่อยู่ระหว่างบำรุงรักษา เปิดแล้วไปขั้นที่ค้าง (stepPage) · หน้างานรายคันแบบ อยู่ระหว่างบำรุงรักษา + ปุ่มปิดงาน เลิกใช้ (Step 2 เดิมของรีวิว) */
async function jobBoxes(h, t, i, started, car, by) {   // กล่องข้อมูลยานพาหนะ 6 ช่อง + กล่องการนัดหมาย (หน้างานรายคันและหน้าขั้นตอน) · car = ยานพาหนะของจอตัวอย่าง (ค่าเริ่ม TRIP_CARS[i]) · by = ผู้เริ่มงาน (ค่าเริ่ม JOB_BY · S23 = ผู้รับจ้าง)
  const c = car || TRIP_CARS[i];
  const appt = (h ? [['แผนเดินทาง', t.name], ['ผู้รับจ้าง', t.vendor], ['ช่วงวันทำงาน', t.d1 + ' – ' + t.d2]] : [['แผนเดินทาง', t.name], ['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2]])
    .concat([['วันดำเนินการ', tripWork(i, t)]])   // R83 วันดำเนินการของคันนี้ (9 พ.ย. 2569 ค่ำ เจ้าของงาน _"ในแผนการเดินทางอ่ะ จะมีช่วงของการดำเนินการอยู่แล้ว แต่ในรายคันอยากให้เห็นว่าแต่ละคันจะดำเนินการเมื่อไร"_ + _"ใส่ตรงหน้ารายการรถ ก็ได้ หรือจะใส่ในตอนเริ่มงานก็ได้ … อยากให้สามารถแก้ไขได้"_)
    .concat([['สถานที่บำรุงรักษา', tripLoc(i, t.locs)], ['เบอร์ติดต่อ', tripPhone(i, t.phones)], ['ผู้ดูแลยานพาหนะ', tripCtrl(i, t.phones)]])   // เบอร์ก่อนชื่อผู้ดูแล ตามคอลัมน์เบอร์ติดต่อ (9 พ.ย. 2569)
    .concat(started ? [['เริ่มงาน', h ? HIRE_START : JOB_START], ['ผู้เริ่มงาน', by || JOB_BY]] : []);   // ใบจ้างที่หน่วยงานปิดงานแทน (S10): หน่วยงานเป็นผู้บันทึก · S23 ผู้รับจ้างเป็นผู้เริ่มงานเอง (HIRE_BY)
  return [await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภท', typeOf(c)], ['หน่วยงานเจ้าของยานพาหนะ', c[2]], ['เลขไมล์สะสม', '182,400 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,120 ชม.']]),
    await vehicleInfo(appt, 'การนัดหมาย')];
}
/* S23 มุมผู้รับจ้าง (o.vendor · เอากลับ 10 พ.ย. 2569 R87): ปุ่มหัวหน้าเหมือนกัน (บำรุงรักษาไม่ได้ · เริ่มงาน) · อะไหล่ตามแผนดูอย่างเดียว ไม่มีปุ่มเพิ่มอะไหล่และคอลัมน์ไอคอนแก้ไข ลบ
   ตามเงื่อนไขการมองเห็นเดิม (เจ้าของงาน 4 พ.ย. 2569 "vendor ดูรายละเอียดรายคัน จะเห็นแค่ ปุ่มเริ่มงาน และบำรุงรักษาได้ โดยไม่เห็นปุ่ม ลบ และแก้ไข") · กล่องการนัดหมายเป็นข้อมูลใบจ้าง (jobBoxes h) */
async function jobPage(name, o) {   // หน้างานรายคัน ยังไม่เริ่ม · o.i = ลำดับรถ · o.modal = 'cannot' · o.reason · o.errors · o.hire · o.vendor
  o = o || {};
  const v = !!o.vendor, h = !!o.hire || v, t = h ? HIRE_T : JOB_T, i = o.i == null ? (v ? HIRE_DONE : JOB_I) : o.i, c = TRIP_CARS[i];
  const acts = [['Secondary button', 'บำรุงรักษาไม่ได้'], ['Primary button', 'เริ่มงาน']];   // Page header Job detail ของ RP & MA Job
  const { scr, page } = await shell(name, { title: c[0], back: true, crumbs: [NOW_Q, t.name, c[0]], badge: WSTAT.todo, actions: acts });
  const nodes = await jobBoxes(h, t, i, false);
  const wk = jobWork(TRIP_OIL[i]);   // ตามแผนของคันนี้ (S21)
  nodes.push(col('Section', [await sectionLabel('รายการงานและอะไหล่ตามแผน', { badge: wk.length, buttons: v ? null : [{ kind: 'Secondary button', text: 'เพิ่มอะไหล่', icon: 'add-24-300-round' }] }),
    v ? await tblShort(JOB_COLS.slice(0, 4), wk.map(w => [w[0], w[1], w[2], w[4]]))   // ผู้รับจ้าง: ดูอย่างเดียว
      : await tblShort(JOB_COLS, wk.map(w => [w[0], w[1], w[2], w[4], { icons: ['stylus-24-300-round', 'delete-24-300-round'] }]))], 16));   // แก้ไข / เพิ่ม = หน้าอะไหล่ของรถ (S21) · ลบ = ยืนยันแล้วเอาออกจากรถคันนี้
  add(page, col('Content', nodes, 32), 'h');
  if (o.modal === 'cannot') await cannotModal(scr, i, { reason: o.reason, errors: o.errors });
  return scr;
}
/* บำรุงรักษาไม่ได้ = สาเหตุ + อะไหล่ส่งคืน (3 พ.ย. 2569 รอบ 2 เจ้าของงาน "กรอกแค่สาเหตุพอ" · อะไหล่ของคันที่ไม่ได้ทำ "มีให้กดส่งคืน ตอนที่กบค รับเรื่องจะเห็นว่ามีอะไหล่อะไรคืนบ้าง")
   popupModal (Modal ของไลบรารีใส่ Table ไม่ได้) = Text area + Table ของไลบรารี · ยังไม่เริ่ม ใช้ 0 คืนทั้งหมด · อยู่ระหว่างบำรุงรักษา กรอกจำนวนที่ใช้ (Table cell ไม่มีช่องกรอก แสดงเป็นข้อความ) คืน = ตามแผน − ใช้ */
const RET_COLS = [['ชื่ออะไหล่', 0, 'Lead text'], ['จำนวนตามแผน', 170], ['จำนวนที่ใช้', 170], ['จำนวนที่คืน', 170]];
const retRows = (used) => WORK.map((w, k) => { const u = used ? +used[k] : 0; return [w[1], w[2] + ' ' + w[4], u + ' ' + w[4], (+w[2] - u) + ' ' + w[4]]; });
const CANNOT_USED = ['30', '2', '0', '0'];   // เปลี่ยนน้ำมันและไส้กรองไฮดรอลิกแล้วพบปัญหา ทำต่อไม่ได้
async function retTable(used, label, edit) {   // label = หน้างานรายคันแบบดู (Section label R3) · edit = ผู้รับจ้างแก้ไข ลบ เพิ่มได้ (S23 · 4 พ.ย. 2569 เอากลับ 10 พ.ย. 2569 R87)
  const rows = retRows(used);
  return col('Section', [await (label ? sectionLabel : section)('อะไหล่ส่งคืน', { badge: rows.length, buttons: edit ? [ADD_PART] : null }),
    await tblShort(edit ? RET_COLS.concat([['', 104]]) : RET_COLS, edit ? rows.map(r => r.concat([EDIT_ICONS])) : rows)], 16);
}
async function cannotModal(scr, i, o) {   // o.reason · o.used (null = ยังไม่เริ่ม) · o.errors
  // 5 พ.ย. 2569 รีวิว S10 "เมื่อกดแล้วจะต้องระบุสาเหตุ แสดงรายการอะไหล่ที่ต้องใช้สำหรับงานนี้เพื่อยืนยันการส่งคืน เมื่อยืนยันแล้ว จะกลับไปที่หน้ารายละเอียดแผนเดินทาง" — โครงเดิมตรงแล้ว เพิ่มบรรทัดรองบอกให้ตรวจอะไหล่ก่อนยืนยัน
  await popupModal(scr, { title: 'บำรุงรักษาไม่ได้ · ' + TRIP_CARS[i][0], sub: 'ระบุสาเหตุ และตรวจรายการอะไหล่ของงานนี้เพื่อยืนยันการส่งคืน', w: 800, ok: 'ยืนยัน',
    body: [area('สาเหตุที่บำรุงรักษาไม่ได้', o.reason, { placeholder: 'ระบุสาเหตุที่บำรุงรักษาไม่ได้', error: o.errors ? 'กรุณาระบุสาเหตุที่บำรุงรักษาไม่ได้' : '' }), await retTable(o.used)] });
}

/* ---------- แผนจ้างดำเนินการ (ใบจ้าง HIRE_T) ----------
   4 พ.ย. 2569 เจ้าของงาน _"อยากตัด scen ผู้รับจ้าง หรือ vendor ตรวจรับทีละคัน ออก คือ S23 และ S11 ที่อยากเอาออก"_ แล้วเลือกให้ กบค. ปิดงานรายคันของแผนจ้างเอง
   ด้วยหน้างานรายคันและหน้าปิดงานเดียวกับ S10 (กรอกแทนผู้รับจ้าง) — ยังคงอยู่ที่ S10 (I.25 I.26)
   10 พ.ย. 2569 เจ้าของงานเอา S23 กลับ _"scen s23 อยากปรับ ui ให้เหมือนกับ s10 แต่ว่า เงื่อนไขการมองเห็น เมนูต่างๆ ยังเป็นเหมือนเดิม"_ (R87) · S11 ยังตัดอยู่
   ⇒ มุมผู้รับจ้างใช้ tripDetail · jobPage · stepPage ของ S10 (o.vendor) + หน้างานที่ปิดแล้วของผู้รับจ้าง (vendorJob แบบ workDetail) + ส่งตรวจงาน · แก้ไข เพิ่ม ลบ อะไหล่และภาพ ตามชุดเดิมของ S23 */
const HIRE_T = tripAs(TRIP_V, 'approved'), HIRE_START = '17/11/2569 09:10 น.';
const HIRE_WHY = 'กระบอกสูบไฮดรอลิกหลักรั่ว ต้องส่งซ่อมก่อนจึงบำรุงรักษาได้';
const HIRE_ST = { [TRIP_V.sel[0]]: 'doing', [TRIP_V.sel[1]]: 'done' };   // ใบจ้างระหว่างทาง: คันแรก กบค. เริ่มงานแทนผู้รับจ้างแล้ว · คันที่ 2 ปิดงานแล้ว · ที่เหลือยังไม่เริ่ม
const WORK_COLS2 = [['รายการงาน', 0], ['อะไหล่ที่ใช้', 320], ['จำนวนตามแผน', 140], ['จำนวนที่ใช้จริง', 140], ['หน่วย', 110]];
/* ข้อมูลจำลองของ S23 (ชุดเดิมก่อนตัด 4 พ.ย. 2569) · ผู้รับจ้าง = ชื่อช่างของผู้รับจ้างที่บันทึกงาน */
const HIRE_DONE = TRIP_V.sel[0], HIRE_CANNOT = TRIP_V.sel[1];
const HIRE_BY = 'นายประเสริฐ ศรีสุข (ผู้รับจ้าง)', HIRE_TECH = 'นายประเสริฐ ศรีสุข', HIRE_END = '17/11/2569 13:25 น.', HIRE_SENT = '17/11/2569 16:40 น.', HIRE_REPORTED = '18/11/2569 08:35 น.';
const HIRE_BACK = 'จำนวนไส้กรองอากาศที่คืนไม่ตรงกับภาพอะไหล่ใหม่ที่เหลือ กรุณาตรวจนับและแก้จำนวนที่คืน';
const HIRE_BACK_CANNOT = 'กรุณาระบุตำแหน่งที่รั่วและผลตรวจเบื้องต้นในสาเหตุให้ชัดเจน';
const HIRE_VENDOR = { [TRIP_V.sel[0]]: 'returned', [TRIP_V.sel[1]]: 'wait', [TRIP_V.sel[2]]: 'worked', [TRIP_V.sel[3]]: 'doing' };   // มุมผู้รับจ้างระหว่างทาง: ส่งกลับแก้ไข · รอตรวจรับ · ดำเนินการแล้ว · กำลังทำ
const vendorSign = (list) => [[list[0][0], HIRE_TECH], list[1]];   // ลงนามฝั่งผู้ดำเนินการของ S23 = ช่างผู้รับจ้าง (ใครลงนามจริงยังไม่เคาะ)
/* หน้างานรายคันของผู้รับจ้างหลังปิดงานหรือแจ้งบำรุงรักษาไม่ได้ (S23 · R87) — โครงเดียวกับหน้างานที่ปิดแล้วของ S10 (workDetail: กล่อง "ข้อมูลยานพาหนะและงาน" กล่องเดียว · ภาพ · อะไหล่ที่ใช้จริง)
   ไม่มีส่วนค่าใช้จ่ายของยานพาหนะ (เจ้าของงาน 10 พ.ย. 2569 _"จะไม่มีเรื่องทั้ง section ค่าใช้จ่ายรายคัน"_) + ของเดิม S23: ปุ่มตามสถานะ · กล่องแจ้งส่งกลับแก้ไข · อะไหล่ส่งคืน
   · ไอคอนแก้ไข ลบ + ปุ่มเพิ่มอะไหล่ · ภาพเป็นรายการไฟล์ (File upload) ลบและอัปโหลดใหม่ได้ (เจ้าของงาน 4 พ.ย. 2569 "อะใหล่ที่ใช้จริง และ อะใหล่ส่งคืน ต้องมีสัญลักณ์ให้แก้ไขได้ ลบรายการได้ รูปภาพ แก้ไขได้ ลบได้")
   ป้ายหัวหน้า = Pill outline สีตามตาราง (headPill แบบหน้าขั้นตอน · Badge outline ไม่มีสี Warning / Info)
   o.st = worked | reported | wait | returned · o.cannot = คันที่แจ้งบำรุงรักษาไม่ได้ · o.partEdit · o.partAdd ('filled') · o.partDel */
async function vendorJob(name, o) {
  o = o || {};
  const t = HIRE_T, cannot = !!o.cannot, i = cannot ? HIRE_CANNOT : HIRE_DONE, c = TRIP_CARS[i], s = o.st;
  const acts = s === 'worked' || s === 'reported' ? [['Secondary button', 'แก้ไขงาน'], ['Primary button', 'ส่งตรวจงาน']]
    : s === 'returned' ? (cannot ? [['Secondary button', 'บำรุงรักษาไม่ได้'], ['Primary button', 'เริ่มงาน']] : [['Primary button', 'แก้ไขงาน']]) : null;   // รอตรวจรับ = ไม่มีปุ่ม · ส่งกลับคันที่แจ้งไม่ได้ = ปุ่มกลับเป็นแบบก่อนแจ้ง
  const { scr, page } = await shell(name, { title: c[0], back: true, crumbs: [NOW_Q, t.name, c[0]], badge: WSTAT[s], actions: acts });
  headPill(scr, WSTAT[s]);
  const nodes = [];
  if (s === 'returned') nodes.push(alertBox('Error', 'หน่วยงานส่งกลับให้แก้ไข', cannot ? HIRE_BACK_CANNOT : HIRE_BACK));
  const veh = [['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภท', typeOf(c)], ['หน่วยงานเจ้าของยานพาหนะ', c[2]], ['เลขไมล์สะสม', '176,050 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '5,840 ชม.']];
  const job = cannot ? [['สาเหตุที่บำรุงรักษาไม่ได้', HIRE_WHY], ['ผู้แจ้ง', HIRE_BY], ['แจ้งเมื่อ', HIRE_REPORTED]]
    : [['เริ่มงาน', HIRE_START], ['ปิดงาน', HIRE_END], ['ผู้บันทึก', HIRE_BY], ['น้ำมันไฮดรอลิก', JOB_OIL_OPTS[TRIP_OIL[i]]], ['เลขไมล์หลังทำ', '176,090 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '5,846 ชม.']];
  const sent = s === 'wait' ? [['ส่งตรวจงานเมื่อ', cannot ? '18/11/2569 08:50 น.' : HIRE_SENT], ['ผู้ส่ง', HIRE_BY]] : [];
  nodes.push(await vehicleInfo(veh.concat(job, sent), 'ข้อมูลยานพาหนะและงาน'));
  if (!cannot) nodes.push(await photoFiles(),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length, buttons: [ADD_PART] }),
      await tblShort(WORK_COLS2.concat([['', 104]]), WORK.map(w => [w[0], w[1], w[2], w[3], w[4], EDIT_ICONS]))], 16));
  nodes.push(await retTable(cannot ? null : WORK.map(w => w[3]), true, true));   // ปิดงาน = จำนวนที่คืนจาก Step 2 · แจ้งไม่ได้ = จาก popup (คืนทั้งหมด)
  add(page, col('Content', nodes, 32), 'h');
  if (o.partEdit) await partEditModal(scr, WORK[PART_K]);
  if (o.partAdd) await partAddModal(scr, o.partAdd === 'filled');
  if (o.partDel) await confirm(scr, PART_DEL_CONFIRM(WORK[PART_K]));
  return scr;
}
/* ส่งตรวจงาน (เจ้าของงาน 3 พ.ย. 2569 "คนตรวจงานเป็นผู้รับจ้าง ส่งตรวจงาน") · ผู้ตรวจรับยังไม่เคาะ (S11 ยังตัดอยู่ 10 พ.ย. 2569) ⇒ ข้อความเป็น "หน่วยงาน" */
const HIRE_SEND_CONFIRM = (c) => ({ title: 'ยืนยันส่งตรวจงาน · ' + c[0], sub: 'งานของยานพาหนะคันนี้จะส่งให้หน่วยงานตรวจรับ', cancel: 'ยกเลิก', ok: 'ส่งตรวจงาน' });
/* แก้ไข ลบ อะไหล่และภาพของผู้รับจ้าง (4 พ.ย. 2569 เจ้าของงาน "ส่วนที่เป็นอะไหล่ที่ใช้จริง และ อะไหล่ส่งคืน ต้องมีสัญลักษณ์ให้แก้ไขได้ ลบรายการได้ รูปภาพ แก้ไขได้ ลบได้")
   ตาราง = คอลัมน์ไอคอนแก้ไข + ลบ กว้าง 104 แบบตารางอะไหล่ในไตรมาสของ S1 · ไอคอนแก้ไขทั้งสองตาราง = popup เดียวกัน (จำนวนที่คืนคำนวณจากจำนวนที่ใช้จริง)
   ภาพ = File upload ของไลบรารี (รายการไฟล์มีปุ่มลบ · อัปโหลดใหม่แทนภาพเดิม · ไอคอนตามชนิดไฟล์ + แถบความคืบหน้า R48) · Images ของไลบรารีไม่มีปุ่มแก้ไข ลบ */
const EDIT_ICONS = { icons: ['stylus-24-300-round', 'delete-24-300-round'] }, PART_K = 3;   // ตัวอย่างแก้ = ไส้กรองอากาศ (ใช้ 1 คืน 1)
const photoFiles = (o) => upload('ภาพก่อนเริ่มงาน', BEFORE.map((b, k) => jpg('before-' + (k + 1))).concat(o && o.uploading ? [Object.assign(jpg('before-3'), { progress: 60 })] : []), { hint: 'JPG, PNG · สูงสุด 10 ภาพ', bar: true });
async function partEditModal(scr, w) {
  await popupModal(scr, { title: 'แก้ไขอะไหล่ · ' + w[1], ok: 'บันทึก',
    body: [field('รายการงาน', w[0], { state: 'Readonly' }),
      row('Row', [field('จำนวนตามแผน', w[2] + ' ' + w[4], { state: 'Readonly' }), field('จำนวนที่ใช้จริง (' + w[4] + ')', w[3]), field('จำนวนที่คืน', (+w[2] - +w[3]) + ' ' + w[4], { state: 'Readonly' })])] });
}
/* เพิ่มรายการ (4 พ.ย. 2569 เจ้าของงาน "scen V ต้องมีเพิ่มรายการได้ด้วย") — ผู้รับจ้างไม่ได้เลือกจากคลังของหน่วยงาน ⇒ popup กรอกเองแบบ "รายการเพิ่มเติม" ของหน้าอะไหล่ของยานพาหนะ (S21)
   + จำนวนที่ใช้จริงและหน่วย · เพิ่มแล้วขึ้นในอะไหล่ที่ใช้จริง และจำนวนที่คืนเป็น 0 */
const ADD_PART = { kind: 'Secondary button', text: 'เพิ่มอะไหล่', icon: 'add-24-300-round' };
async function partAddModal(scr, filled) {
  await popupModal(scr, { title: 'เพิ่มอะไหล่ที่ใช้จริง', ok: 'เพิ่ม',
    body: [field('ชื่ออะไหล่', filled ? 'ไส้กรองเชื้อเพลิง' : '', { placeholder: 'ระบุชื่ออะไหล่' }), field('รหัสอะไหล่', filled ? 'FF-5052' : '', { placeholder: 'ระบุรหัสอะไหล่', optional: true }),
      row('Row', [field('จำนวนที่ใช้จริง', filled ? '1' : '', { placeholder: '0' }), dropdown('หน่วย', filled ? 'ชิ้น' : '', { placeholder: 'เลือกหน่วย' })])] });
}
const PART_DEL_CONFIRM = (w) => ({ danger: true, title: 'ยืนยันการเอาอะไหล่ออก', sub: w[1] + ' จะถูกเอาออกจากยานพาหนะคันนี้', cancel: 'ยกเลิก', ok: 'เอาออก' });
/* (5 พ.ย. 2569 รีวิว S10: เนื้อหาหน้าปิดงานย้ายเป็น Step 2 สรุปงานก่อนปิดงาน ของ stepPage — มีแถบขั้นตอนด้านบน เนื้อหายังไล่ยาวหน้าเดียว)
   ปิดงาน = หน้าเดียวไล่ยาว ไม่มี stepper ไม่มีส่วนภาพ (3 พ.ย. 2569 เจ้าของงานวางข้อความเฟรม "รายงานปิดงาน" ของงานซ่อม: "หน้าปิดงานอยากได้สไตล์แบบนี้ ยังไม่ต้องมีเพิ่มรูป และไม่ต้องมี stepper")
   ส่วนตามเฟรม: ข้อมูลเอกสาร · บันทึกข้อตกลงลูกค้า (Section header + Content item row) · รายการสภาพวัสดุอะไหล่ (Table ของไลบรารี 8 คอลัมน์)
   · บันทึกตรวจสอบเอกสารปิดงาน (แถว Horizontal radio groups มี/ไม่มี/ไม่ต้องใช้ + ปุ่มอัพโหลดเอกสาร — แถวแบบ MA table ในเฟรมเดียวกัน · ตารางของเฟรมมี radio ในช่อง ซึ่ง Table ของไลบรารีไม่มี)
   ผลการบำรุงรักษา (เลขไมล์ ชั่วโมงเครื่องจักร เก็บตัวอย่างน้ำมัน) คงไว้เพราะ S12 และบอร์ดต้องใช้ — ไม่อยู่ในเฟรม (จดยังไม่เคาะ) */
const CLOSE_PARTS = [   // ชื่ออะไหล่ · ราคาต่อหน่วย · จำนวนที่ใช้ · ราคารวมที่ใช้ · จำนวนที่คืน · ราคารวมที่คืน · จำนวนอะไหล่เก่า · หมายเหตุ (ลำดับคอลัมน์ตาม ReturnPart)
  ['น้ำมันไฮดรอลิก ISO VG 46', '120', '30', '3,600', '0', '0', '30', 'น้ำมันเก่าส่งกำจัดตามระเบียบ'],
  ['ไส้กรองไฮดรอลิก', '680', '2', '1,360', '0', '0', '2', ''],
  ['ไส้กรองน้ำมันเครื่อง', '250', '2', '500', '0', '0', '2', ''],
  ['ไส้กรองอากาศ', '420', '1', '420', '1', '420', '1', 'ไส้กรองเดิมอีกลูกยังใช้ได้']];
const CLOSE_PART_HEADS = ['ชื่ออะไหล่', 'ราคาต่อหน่วย', 'จำนวนที่ใช้', 'ราคารวมที่ใช้', 'จำนวนที่คืน', 'ราคารวมที่คืน', 'จำนวนอะไหล่เก่า', 'หมายเหตุ'];
const CLOSE_DOCS_REPAIR = ['บันทึกสั่งงาน/สำเนาบันทึกสั่งงาน', 'บันทึกรับงานเข้างาน', 'ใบเบิกของ', 'ใบส่งของคลัง', 'สำเนาอนุมัติหลักการจัดซื้อ', 'สำเนาบิลส่งของเรื่องจัดซื้อ', 'สำเนาอนุมัติหลักการจัดจ้าง', 'สำเนาบิลส่งของเรื่องจัดจ้าง',
  'บันทึกการตรวจสอบวัสดุอะไหล่', 'สำเนาใบส่งคืนคลังพัสดุ', 'บันทึกการตรวจสภาพบำรุงรักษา', 'บันทึกทดสอบก่อนซ่อม/หลังซ่อม', 'รายงานออกปฏิบัติงานส่วนภูมิภาค', 'เรื่องแจ้งงานเสร็จ', 'เรื่องแจ้งงดซ่อม'];   // ตามเฟรมของเจ้าของงาน
const CLOSE_DOCS = ['บันทึกใบสั่งการ'];   // 3 พ.ย. 2569 เจ้าของงาน "ส่วนนี้ตัดเหลือแค่ 1 รายการ คือบันทึกใบสั่งการ แค่นั้น และมีให้เพิ่มรายการได้" (15 รายการของงานซ่อมเก็บไว้ที่ CLOSE_DOCS_REPAIR)
const CLOSE_DOC_SEL = [0];   // กรอกครบ: 0 มี · 1 ไม่มี · 2 ไม่ต้องใช้
/* 5 พ.ย. 2569 รีวิว S10 Step 2 "ระบุจำนวนอะไหล่ที่ใช้จริงในงานนี้" (R74) ⇒ คอลัมน์ "จำนวนที่ใช้" เป็นช่องกรอก Number input ตาม ReturnPart ของงานซ่อม
   (ไฟล์ Maintain-D หน้า Design: ตาราง Table header cell + Table cell ที่ใส่ Number input ในคอลัมน์ "จำนวนที่ใช้" · Table ของไลบรารีไม่มีช่องกรอก)
   ⇒ desktop ประกอบแบบ checkTable (เฟรมชื่อ ReturnPart = แบบสำรองลอกโครง component งานซ่อม R47) · มือถือคง Table การ์ด (Mobile table ไม่มีช่องกรอก) · หัวคอลัมน์และลำดับตามเฟรมรายงานปิดงาน (3 พ.ย. 2569) */
/* แผนจ้างดำเนินการ (noPrice · เจ้าของงาน 10 พ.ย. 2569 _"ส่วนที่สภาพวัสดุอะไหล่ ส่วนที่เป็นราคาต้องไม่แสดง"_ · R87): ไม่มีคอลัมน์ราคาต่อหน่วย · ราคารวมที่ใช้ · ราคารวมที่คืน ทั้ง desktop และมือถือ
   ใช้ทั้ง Step 2 ของผู้รับจ้าง (S23) และ Step 2 ที่หน่วยงานปิดงานแทนผู้รับจ้าง (S10 I.26) · คอลัมน์ที่เหลือคงเดิม */
const CLOSE_PRICE_COLS = [1, 3, 5];
async function closeParts(rows, filled, noPrice) {
  const val = (r) => (filled ? r : r.slice(0, 6).concat(['0', ''])).map((x, i) => i === 7 && !x ? '-' : x);   // ฟอร์มว่าง: จำนวนที่ใช้ตั้งต้นตามแผน · อะไหล่เก่า 0 · หมายเหตุ "-"
  const keep = CLOSE_PART_HEADS.map((_, i) => i).filter(i => !noPrice || CLOSE_PRICE_COLS.indexOf(i) < 0);
  const head = await section('รายการสภาพวัสดุอะไหล่', { badge: rows.length });
  const more = btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round' });
  if (MOB) {
    const cols = keep.map(i => [CLOSE_PART_HEADS[i], i === 0 ? 220 : i === 7 ? 0 : 118, i ? 'Text' : 'Lead text']);
    return col('Section', [head, await tblShort(cols, rows.map(r => { const x = val(r); return keep.map(i => x[i]); })), more], 16);
  }
  const data = rows.map(val);
  const num = (ri) => {   // Number input ไม่มีป้าย ในช่องตาราง (ReturnPart)
    return inst('Number input', { State: 'Filled', Size: 'md' }, { Number: data[ri][2], Label: false, Optional: false, 'Info icon': false, Helper: false });
  };
  const cols = keep.map(ci => { const h = CLOSE_PART_HEADS[ci]; return ci === 0 ? [h, 220, null, false, ci] : ci === 2 ? [h, 140, num, true, ci] : [h, ci === 7 ? 0 : 118, (ri) => null, false, ci]; });
  const t = frame('Content with scrollbar', 'HORIZONTAL');
  cols.forEach(([h, w, make, grow, ci]) => {
    const c = frame('Column', 'VERTICAL'); t.appendChild(c);
    if (w) { c.layoutSizingHorizontal = 'FIXED'; c.resize(w, c.height); } else c.layoutGrow = 1;
    add(c, inst('Table header cell', { Checkbox: 'False' }, { Text: h, 'Sort icon': false, 'Header text': true }), 'h');
    data.forEach((r, ri) => add(c, ci === 2 ? ctrlCell(ri % 2, '', make(ri), grow) : ctrlCell(ri % 2, r[ci], null), 'h'));
  });
  return col('Section', [head, col('ReturnPart', [t], 0), more], 16);
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
/* ชั่วโมงทำงาน × อัตราค่าแรงต่อชั่วโมง (เจ้าของงานเคาะ 10 พ.ย. 2569 S18 "ค่าเบี้ยเลี้ยง และค่าชั่วโมงทำงาน จะแสดงเฉพาะส่วนที่ทำเอง" · "กรอกอัตราเองตอนปิดงาน" · ชั่วโมงทำงานเป็น optional)
   รายคัน 1 แถวใต้ค่าเดินทาง ไม่บังคับทั้งสองช่อง · ไม่กรอก = ค่าชั่วโมงทำงาน 0 (เสนอ) · แผนจ้างไม่มีส่วนนี้ (R87) */
const CLOSE_HOURS = 6, CLOSE_RATE = 150;
const nf = (n) => n.toLocaleString('en-US');
const personSum = (r) => (r[1] + r[2]) * r[3];
const costSum = (k) => CLOSE_COST_BY.reduce((a, r) => a + r[k] * r[3], 0);
const CLOSE_COST = { perDiem: nf(costSum(1)), lodging: nf(costSum(2)), travel: nf(CLOSE_TRAVEL), labour: nf(CLOSE_HOURS * CLOSE_RATE), total: nf(costSum(1) + costSum(2) + CLOSE_TRAVEL + CLOSE_HOURS * CLOSE_RATE) };
const OWNER_CC = (c) => 'E301010000 ' + c[2] + ' - บริหาร';   // ศูนย์ต้นทุนของหน่วยงานเจ้าของรถ (ข้อมูลจำลอง)
/* งบที่ตัด + ศูนย์ต้นทุน (5 พ.ย. 2569 รีวิว S10 "เลือกศูนย์ต้นทุน ต้องเป็นรูปแบบเดียวกันกับงานซ่อมและ overhaul" · R72)
   งานซ่อม (ไฟล์ Maintain-D หน้า Local Component) = component "Request Repair/Budget" variant "งบที่ตัด": Input dropdown "งบที่ตัด" ครึ่งซ้าย + ช่องตามประเภทครึ่งขวาแถวเดียวกัน
     หน่วยงานต้นสังกัด = Text input Readonly "ศูนย์ต้นทุน" (ระบบเติม) · หน่วยงานอื่น = Input dropdown "ศูนย์ต้นทุน" "ระบุศูนย์ต้นทุน" · WBS / PM Order = 3 ช่อง · อื่น ๆ = ช่องรายละเอียด
   Overhaul (R18) = "ประเภทงบประมาณ" 5 ค่า ช่องตามประเภทแถวใหม่ใต้ครึ่งขวา — ต่างกันที่ชื่อช่อง ชื่อตัวเลือก และตำแหน่ง ⇒ ใช้แบบงานซ่อม (เจ้าของงานสั่งให้ยึดงานซ่อมเมื่อต่างกัน)
   ตั้งต้น = งบทำการ หน่วยงานต้นสังกัด + ศูนย์ต้นทุนของหน่วยงานเจ้าของรถคันนั้น (เจ้าของงาน 3 พ.ย. 2569 ค่าเดินทางและค่าใช้จ่ายเป็นของหน่วยงานเจ้าของรถ)
   ไฟล์ไม่มี component นี้ → แบบสำรองลอกโครงจากไลบรารี: Input dropdown + Text input Readonly ไอคอน account_balance (ไอคอนเดียวกับ Overhaul) / Input dropdown */
const BUDGET_CUT = ['งบทำการ หน่วยงานต้นสังกัด', 'งบทำการ หน่วยงานอื่น', 'งบโครงการ (ตาม WBS)', 'งบซ่อมบำรุงตามใบสั่ง (PM Order)', 'อื่น ๆ'];   // ค่า variant "งบที่ตัด" ของ Request Repair/Budget
const OTHER_CC = 'E301020000 กฟฉ.2 อุบลราชธานี - บริหาร';   // ตัวอย่างศูนย์ต้นทุนของหน่วยงานอื่น (ข้อมูลจำลอง)
function budgetPick(c, o) {   // o.type = ลำดับใน BUDGET_CUT (ค่าเริ่ม 0) · o.cc = ศูนย์ต้นทุนที่เลือก (หน่วยงานอื่น)
  o = o || {};
  const t = o.type || 0;
  if (has('Request Repair/Budget')) {
    const b = inst('Request Repair/Budget', { 'งบที่ตัด': BUDGET_CUT[t] }); b.name = 'Request Repair/Budget';
    const ro = find(b, 'Text input'), dd = b.findAll(n => n.type === 'INSTANCE' && n.name === 'Input dropdown')[1];
    if (t === 0 && ro) setProps(ro, { Text: OWNER_CC(c) });
    if (t === 1 && dd && o.cc) setProps(dd, { Text: o.cc });
    if (t === 1 && dd) setProps(dd, { State: o.cc ? 'Selected' : 'Default' });
    return b;
  }
  const cut = dropdown('งบที่ตัด', BUDGET_CUT[t], { placeholder: 'เลือกงบที่ตัด' });
  const dep = t === 0 ? field('ศูนย์ต้นทุน', OWNER_CC(c), { state: 'Readonly', lead: 'account_balance-24-300-round' })
    : t === 1 ? dropdown('ศูนย์ต้นทุน', o.cc || '', { placeholder: 'ระบุศูนย์ต้นทุน' }) : frame('Spacer', 'VERTICAL');
  return row('Row', [cut, dep]);
}
async function closeCosts(filled, budget) {   // budget = ค่าส่งต่อ budgetPick
  const c = TRIP_CARS[JOB_I];
  const money = (label, v) => field(label, filled ? nf(v) : '', { placeholder: '0', optional: true });
  // 3 พ.ย. 2569 เจ้าของงาน "เพิ่ม ลด พนักงานได้" ⇒ พนักงาน = Input dropdown ค้นชื่อ (ตั้งต้นตามแผนเดินทาง) · ปุ่มลบท้ายแถว (Tertiary button ไอคอนอย่างเดียว) · ปุ่ม "เพิ่มพนักงาน" ใต้แถว
  const delBtn = () => inst('Tertiary button', { State: 'Default', Size: 'md' }, { 'Button text': false, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('delete-24-300-round') });
  const rows = CLOSE_COST_BY.map(r => {
    const kids = [dropdown('พนักงาน', r[0], { placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round' }), money('ค่าเบี้ยเลี้ยง (บาท/วัน)', r[1]), money('ค่าที่พัก (บาท/วัน)', r[2]),
      dropdown('จำนวนวัน', filled ? r[3] + ' วัน' : '', { placeholder: 'เลือกจำนวนวัน' }), field('รวม (บาท)', filled ? nf(personSum(r)) : '0', { state: 'Readonly' })];
    if (MOB) return col('Row', kids.concat([delBtn()]), 16);
    const rw = row('Row', kids, { align: 'MAX' }); const d = delBtn(); rw.appendChild(d);   // ปุ่มลบไม่ยืด
    return rw;
  });
  const sum = filled ? CLOSE_COST : { perDiem: '0', lodging: '0', travel: '0', labour: '0', total: '0' };
  const hours = row('Row', [field('ชั่วโมงทำงาน', filled ? String(CLOSE_HOURS) : '', { placeholder: '0', optional: true }), field('อัตราค่าแรง (บาท/ชั่วโมง)', filled ? nf(CLOSE_RATE) : '', { placeholder: '0', optional: true })]);
  return col('Section', [await section('ค่าใช้จ่ายของยานพาหนะคันนี้ (บาท)', { badge: CLOSE_COST_BY.length + ' คน' })]   // 3 พ.ย. 2569 เจ้าของงานลบกล่องแจ้งในไฟล์เองแล้ว "ลบใน script อย่างเดียว … export ต้องไม่มี"
    .concat(rows, [btn('Secondary button', 'เพิ่มพนักงาน', { icon: 'add-24-300-round' }), row('Row', [money('ค่าเดินทาง (รวมทุกคน)', CLOSE_TRAVEL), frame('Spacer', 'VERTICAL')]), hours,
      kv([['รวมค่าเบี้ยเลี้ยง', sum.perDiem + ' บาท'], ['รวมค่าที่พัก', sum.lodging + ' บาท'], ['ค่าเดินทาง', sum.travel + ' บาท'], ['ค่าชั่วโมงทำงาน', sum.labour + ' บาท'], ['รวมค่าใช้จ่ายของยานพาหนะคันนี้', sum.total + ' บาท']]),
      budgetPick(c, budget)]), 16);   // เดิม "งบประมาณ (ศูนย์ต้นทุน)" ช่องเดียว (3 พ.ย. 2569) → งบที่ตัด + ศูนย์ต้นทุน แบบงานซ่อม (5 พ.ย. 2569 R72)
}
/* ---------- รับรถก่อนเริ่มงาน + ตรวจสภาพตอนปิดงาน (3 พ.ย. 2569 เจ้าของงาน "ตอนกดเริ่มงาน อยากได้หน้าที่เป็นรายการรับรถ และมีให้ลงนาม และตอนปิดงานก็เหมือนกัน มีให้ตรวจสภาพรถปิดงาน") ----------
   แบบอย่าง = component ของ Flow การซ่อม (ไฟล์ Maintain-D หน้า Design) ที่ Overhaul S8 ใช้: ReceiptChecklist "รายการเอกสารรับรถ" + HandoverSignature "ลงนามการรับมอบรถ" + Modal Signature
   · ปิดงาน = ~~ตรวจสภาพรถปิดงาน~~ (ตัด 5 พ.ย. 2569 · R65) เหลือ HandoverSignature "ลงนามการส่งคืนรถ" ใน InspectionChecklist AfterRepair=true (ซ่อน RepairFeedback ReturnPart เพราะหน้าปิดงานมีตารางอะไหล่แล้ว)
   ไฟล์ไม่มี component เหล่านี้ / มือถือ → แบบสำรองจากไลบรารี: แถว Horizontal radio groups 2 คอลัมน์ + หมายเหตุ + ช่องผู้ลงนาม (Input dropdown) + ปุ่มเซ็นลงนาม / Pill outline ลงนามแล้ว */
const RECEIPT_ITEMS = ['แผ่นป้ายทะเบียนหน้า - หลัง', 'ป้ายทะเบียนติดกระจกและ พรบ.', 'กระจกมองข้างซ้าย - ขวา, กระจกมองหลัง', 'ยางอะไหล่', 'แบตเตอรี่', 'เครื่องมือประจำยานพาหนะ, แม่แรง, ประแจถอดล้อ', 'ฝาถังน้ำมัน',
  'อุปกรณ์บนหน้าปัด, แตร', 'ใบปัดน้ำฝน', 'วิทยุ, ลำโพง, เสาอากาศ, วิทยุรับ - ส่ง', 'ระบบไฟแสงสว่าง', 'สภาพยาง', 'สภาพตัวถังและสี'];   // ตาม ReceiptChecklist ของงานซ่อม
// INSPECT_ITEMS (24 รายการตรวจสภาพรถปิดงาน) เลิกใช้ 5 พ.ย. 2569 (R65) — เจ้าของงาน "s10 เอาตรวจสภาพปิดงาน ออกไปเลย"
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
const RECEIPT_NOTE = { 11: 'ยางหลังซ้ายสึก แจ้งเจ้าของยานพาหนะแล้ว' }, RECEIPT_BAD = 11;   // ข้อมูลจำลองตอนกรอกครบ: ทุกรายการ "มี" · สภาพยาง ชำรุด
async function signSection(title, who, filled, signed) {   // HandoverSignature แบบสำรอง
  const box = (label, name) => col('Container', [dropdown(label, filled ? name : '', { placeholder: 'เลือก' + label }),
    signed ? row('Signed', [btn('Secondary button', 'แก้ไขลงนาม'), pill('ลงนามแล้ว', 'Success')], { hug: true, keep: true, gap: 16, align: 'CENTER' })
      : row('Sign', [btn('Secondary button', 'เซ็นลงนาม', { disabled: !filled })], { hug: true, keep: true })], 16);
  return col('Section', [await section(title), row('Row', [box(who[0][0], who[0][1]), box(who[1][0], who[1][1])])], 16);
}
/* ผู้ลงนาม 2 ฝ่าย ชื่อป้ายเดียวกันทุกที่ (5 พ.ย. 2569 ชีตลูกค้า: ป้ายผู้ลงนามหน้าปิดงานไม่ตรงหน้ารับรถ · ชื่อตัวอย่างในตัว component นายอนุชิต / นายสมาน ค้าง)
   ป้ายในตัว HandoverSignature ของงานซ่อม: รับรถ "ผู้ส่งมอบรถ" / "ผู้รับมอบรถ (กบค.)" · ส่งคืน "ผู้ส่งมอบรถ (กบค.)" / "ผู้รับมอบรถ" ⇒ ใส่หน่วยงานในวงเล็บครบทั้งสองฝ่ายแบบแบบสำรอง signSection */
const SIGN_IN = [['ผู้ตรวจ (หน่วยงานผู้ดำเนินการ)', TRIP.staff[0]], ['ผู้รับการตรวจ (หน่วยงานเจ้าของยานพาหนะ)', SIGN_OWNER]];   // Step 1 ลงนามการตรวจสภาพ · 9 พ.ย. 2569 ผู้ตรวจ / ผู้รับการตรวจ ตามท้ายใบตรวจ (เดิมผู้ส่งมอบ / ผู้รับมอบ)
const SIGN_OUT = [['ผู้ส่งมอบยานพาหนะ (หน่วยงานผู้ดำเนินการ)', TRIP.staff[0]], ['ผู้รับมอบยานพาหนะ (หน่วยงานเจ้าของยานพาหนะ)', SIGN_OWNER]];   // Step 2 ลงนามการส่งคืนรถ
/* ค่าในช่องของ component งานซ่อม: property Text ไม่ชนะข้อความที่ component แม่ทับไว้ (ชีตลูกค้า 5 พ.ย. 2569 ยังเห็น "นาย อนุชิต ลิ้มกิมฮวย")
   ⇒ ตั้ง property แล้วใส่ที่ชั้นข้อความที่เห็นด้วย (แบบ formModal ใน core) */
async function putText(inst0, layer, value) {
  const t = inst0 && inst0.findAll(n => n.type === 'TEXT' && n.name === layer && n.visible !== false)[0];
  if (t && t.characters !== value) await text(inst0, t, value);
}
async function signFix(root, title, parties, filled) {   // HandoverSignature ทุกตัวใน root: หัว (คงหัวของตัวเองทุก State — State=Signed ของ component หัวเป็น "ลงนามการรับมอบรถ") + ป้ายและชื่อผู้ลงนาม
  const all = (root.name === 'HandoverSignature' ? [root] : []).concat(root.findAll(n => n.name === 'HandoverSignature'));
  for (const hs of all) {
    hs.findAll(x => x.type === 'INSTANCE' && x.name === 'Section header').forEach(x => setProps(x, { Title: title }));
    for (const [k, x] of hs.findAll(x => x.type === 'INSTANCE' && x.name === 'Text input').slice(0, 2).entries()) {
      const v = filled ? parties[k][1] : 'เลือก' + parties[k][0];
      setProps(x, { Text: v }); syncLabel(x, parties[k][0], false);
      const ct = find(x, 'Container'); if (ct) await putText(ct, 'Text', v);
    }
  }
}
async function signModal(scr, title, filled, party) {   // Modal Signature ของงานซ่อม · ไม่มี/มือถือ → popup ยืนยันแบบ Overhaul · party = [ป้าย, ชื่อ] ผู้ที่กำลังเซ็น
  if (MOB || !has('Modal Signature')) { await confirm(scr, { title, sub: filled ? 'เซ็นลงนามแล้ว' : 'เซ็นลงนามในช่องด้านล่าง', cancel: 'ปิด', ok: 'บันทึก' }); return; }
  const m = inst('Modal Signature', { State: filled ? 'Filled' : 'Default' }); m.name = 'Modal Signature';
  overlay(scr, m, 0, 0);
  modalHead(find(m, 'Modal header'), title, '');
  const form = find(m, 'Form');   // ชีตลูกค้า 5 พ.ย. 2569: กล่องข้อมูลรถ/งานซ่อมตัวอย่าง (1กก 1236 กทม. · BRD005678) ในตัว component ต้องไม่เห็น — ในไลบรารีซ่อนอยู่แล้ว ซ่อนซ้ำกันพลาด เหลือผู้ลงนาม + ช่องเซ็น
  if (form) form.children.forEach(c => { if (c.name !== 'Content' && c.name !== 'Text area') c.visible = false; });
  const shownBox = form && form.children.find(c => c.name === 'Content');   // ชิ้นแรกของทั้ง modal อยู่ในแถวที่ซ่อน ⇒ หาในกล่อง Content ที่เห็น
  const who = (shownBox || m).findAll(x => x.type === 'INSTANCE' && x.name === '_Content item base')[0];   // ผู้ลงนามในหน้าต่าง: ค่าตัวอย่างในตัว component (นาย อนุชิต ลิ้มกิมฮวย) → ผู้ที่กำลังเซ็น
  if (who && party) { setProps(who, { Label: party[0], Text: party[1] }); await putText(who, 'Label', party[0]); await putText(who, 'Text', party[1]); }
  const ft = find(m, 'Modal footer');
  if (ft) { const sb = find(ft, 'Secondary button'); if (sb) setProps(sb, { Text: 'ปิด', 'Leading icon': false, 'Trailing icon': false }); const pb = find(ft, 'Primary button'); if (pb) setProps(pb, { Text: 'บันทึก', 'Leading icon': false, 'Trailing icon': false }); }
}
/* ---------- แบบตรวจสภาพตามประเภทยานพาหนะ (S10 Step 1 · R86) ----------
   9 พ.ย. 2569 เจ้าของงาน (ไฟล์ "04 ใบตรวจสภาพ-ซ่อม รถกระเช้าแก้ไฟ ฮอทไลน์ รถ.xlsx") "อยากให้การตรวจรถถ้าเลือกมาเป็นกระเช้า จะใช้แบบการตรวจ แท็บ ตรวจสภาพรถกระเช้า แต่ถ้าเป็นรถพ่วงฉีดน้ำก็จะใช้แบบประเมิน แท็ป ตรวจสภาพรถพ่วงฉีดน้ำ โดยข้อมูลที่เป็น display ก็คือข้อมูล ด้านบนของการตรวจ"
   + เจ้าของงานเคาะ: ใช้แทนรายการเอกสารรับยานพาหนะใน Step 1 · ลงนาม ผู้ตรวจ / ผู้รับการตรวจ ตามท้ายใบตรวจ
   กระเช้าแก้ไฟ กระเช้าฮอทไลน์ = แท็บ "ตรวจสภาพรถกระเช้า" (30 รายการ) · รถพ่วงฉีดน้ำ = แท็บ "ตรวจสภาพรถพ่วงฉีดน้ำ" (19 รายการ) · ผลรายข้อ ปกติ / แก้ไข / หมายเหตุ
   ข้อมูลส่วนบนของใบตรวจ = กล่องแสดงข้อมูล (vehicleInfo) · ชื่อช่องที่มี "รถ" เป็น "ยานพาหนะ" (R80) · "รุ่น" ที่ซ้ำแยกเป็นรุ่นกระเช้า/รุ่นยานพาหนะ/รุ่นเครื่องยนต์
   "ส่วนอื่นๆ" ของใบตรวจ = ปุ่มเพิ่มรายการท้ายตาราง
   InspectionChecklist ของไฟล์ Maintain-D มี 25 แถวตายตัว + ส่วนสาเหตุส่งซ่อม (instance เพิ่มแถวไม่ได้) ⇒ ตารางตรวจประกอบจากชิ้นไลบรารีแบบเดียวกับแบบสำรอง (checkTable · มือถือ checkCard)
   รหัส SERIAL No. หมายเลข HC เครื่องยนต์ = ค่าสมมติ */
const BUCKET_ITEMS = ['น้ำมันไฮดรอลิก', 'กรองน้ำมันไฮดรอลิก', 'แรงดันน้ำมันไฮดรอลิก MAIN 2400-2600 PSI', 'ชุดเกียร์ PTO', 'ปั๊มน้ำมันไฮดรอลิก', 'เพลาขับปั๊มน้ำมันไฮดรอลิก',
  'ชุดกระบอกขาช้างหน้าซ้าย-ขวา', 'ชุดกระบอกขาช้างหลังซ้าย-ขวา', 'น้ำมันหล่อลื่นชุดเฟืองหมุนฐานเครน', 'ชุดมอเตอร์และเฟืองหมุนฐานเครน', 'ชุดกระบอก LOWER BOOM', 'ชุดกระบอก UPPER BOOM',
  'ชุดกระบอก EXTENSION', 'ชุดโรตารี่', 'ระบบ EMERGENCY', 'ชุด CONTROL ล่าง', 'ชุด CONTROL บน', 'สายน้ำมันไฮดรอลิก', 'สายสัญญาณต่างๆ', 'เกจวัดต่างๆ', 'ชุดวาล์วล๊อคต่างๆ',
  'ชุดปรับการหมุนและปรับดิ่งใบกระเช้า', 'BUCKET, LINER', 'ชุดการ์ดครอบป้องกันกระแสไฟ', 'รอกและเชือกวินซ์', 'ชุด LIFT รุ่น 115 KV', 'การอัดและเคลือบจารบีตามจุดต่างๆ', 'ชุดยึดฐานเครน',
  'ท่อนบูม, สลัก, จุดยึด', 'PLATE ซองบูม, SLIDE PAD ADJ.'];
const WATER_ITEMS = ['น้ำมันเครื่องยนต์', 'น้ำมันเกียร์ชุดเฟืองเกียร์ทดรอบ', 'น้ำมันดุมล้อ', 'กรองอากาศ', 'กรองน้ำมันเครื่องยนต์', 'กรองน้ำมันเชื้อเพลิง', 'กรองดักน้ำ',
  'สภาพเครื่องยนต์รอบเครื่อง 2400 RPM', 'น้ำ, หม้อน้ำ, ท่อน้ำ, ฝาปิดหม้อน้ำ', 'สภาพและความตึงของสายพานพัดลม/ไดชาร์ท', 'แบตเตอรี่, ขั้วแบตเตอรี่และน้ำกลั่น',
  'รอยรั่วน้ำมันเชื้อเพลิง, น้ำมันเครื่อง, น้ำระบายความร้อน', 'แรงดันน้ำ MAIN 800 PSI', 'แรงดันน้ำปลายปืน 1-2 กระบอก 400 PSI', 'ระบบไฟควบคุมอุปกรณ์ต่าง ๆ', 'มาตรวัดต่าง ๆ',
  'ข้อต่อ, วาล์วน้ำ', 'สายฉีดน้ำ', 'ชุดอุปกรณ์ REEL เก็บสายฉีดน้ำ'];
const WATER_CAR = CAND[9].slice(0, 3);   // รถพ่วงฉีดน้ำของจอตัวอย่าง (82-9012 ขอนแก่น)
const brandModel = (s) => { const w = s.trim().split(' '); return [w[0], w.slice(1).join(' ')]; };
function inspectForm(c) {   // แบบตรวจของยานพาหนะ c ตามประเภท: ชื่อแบบ · ข้อมูลส่วนบน · รายการตรวจ
  const [car, body] = c[1].split(' + '), [vb, vm] = brandModel(car);
  if (typeOf(c) === VTYPES[2]) return { title: 'แบบฟอร์มการตรวจสภาพรถพ่วงฉีดน้ำ', items: WATER_ITEMS, kv: [['งานเลขที่', P[0]], ['ยี่ห้อยานพาหนะ', vb], ['รุ่นยานพาหนะ', vm], ['ทะเบียน', c[0]],
    ['รหัส', 'W-2565-0218'], ['ใช้งานประจำที่', c[2]], ['SERIAL No.', 'FM8JN-71245'], ['ยี่ห้อเครื่องยนต์', 'Kubota'], ['รุ่นเครื่องยนต์', 'V2203'], ['SERIAL No. เครื่องยนต์', '2B4471'], ['ระยะเวลาการใช้งาน (Hr)', '2,840']] };
  const [cb, cm] = brandModel(body.replace(/^กระเช้า /, ''));
  return { title: 'แบบฟอร์มการตรวจสภาพกระเช้าแก้ไฟและกระเช้าฮอทไลน์', items: BUCKET_ITEMS, kv: [['งานเลขที่', P[0]], ['ยี่ห้อกระเช้า', cb], ['รุ่นกระเช้า', cm], ['ทะเบียน', c[0]],
    ['รหัส', 'B-2563-0412'], ['ใช้งานประจำที่', c[2]], ['SERIAL No.', cm + '-11873'], ['หมายเลข HC', 'HC-0412'], ['ยี่ห้อยานพาหนะ', vb], ['รุ่นยานพาหนะ', vm], ['ระยะทางการใช้งานยานพาหนะ (Km)', '182,400'], ['ระยะเวลาการใช้งานเครน (Hr)', '6,120']] };
}
const INSPECT_NOTE = { 17: 'สายน้ำมันไฮดรอลิกซึมที่ข้อต่อ เปลี่ยนแล้ว' }, INSPECT_FIX = 17;   // ข้อมูลจำลองตอนตรวจครบ: ทุกรายการ "ปกติ" ยกเว้นข้อ 18 "แก้ไข"
async function inspectStep(c, filled, signed, sign) {   // Step 1: ข้อมูลส่วนบนของใบตรวจ + รายการตรวจตามประเภท + ลงนาม ผู้ตรวจ / ผู้รับการตรวจ · sign = ผู้ลงนาม (ค่าเริ่ม SIGN_IN · S23 vendorSign)
  const fm = inspectForm(c), sel = (i) => filled ? (i === INSPECT_FIX % fm.items.length ? 1 : 0) : -1;
  const list = MOB
    ? fm.items.map((t, i) => checkCard((i + 1) + '. ' + t, ['ปกติ', 'แก้ไข'], sel(i))).concat([btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round', size: 'lg' })])
    : [checkTable(fm.items.map((t, i) => (i + 1) + '. ' + t), [['รายการ', 0], ['ปกติ', 100, i => radioCell(sel(i) === 0)], ['แก้ไข', 100, i => radioCell(sel(i) === 1)],
        ['หมายเหตุ', 448, i => noteCell(filled && sel(i) === 1 ? INSPECT_NOTE[INSPECT_FIX] : ''), true]], true)];
  return [await vehicleInfo(fm.kv, fm.title),
    col('InspectionChecklist', [await section('รายการตรวจสภาพ', { badge: fm.items.length })].concat(list), 16),
    await signSection(SIGN_INSPECT, sign || SIGN_IN, filled, signed)];
}
const SIGN_INSPECT = 'ลงนามการตรวจสภาพ';   // 5 พ.ย. 2569 รีวิว S10 Step 1 "ลงนามการตรวจสภาพ" (เดิม "ลงนามการรับมอบรถ") · บังคับ — เจ้าของงาน "เรื่องลงนาม require"
async function receiptPanel(filled, signed) {
  const o = { filled, signed };   // รายการรับรถ + ลงนามการตรวจสภาพ
  if (has('ReceiptChecklist') && has('HandoverSignature')) {   // ต้นฉบับมี Breakpoint Mobile ด้วย (การ์ดรายการละใบ) ⇒ ใช้ทั้งสองขนาด
    const rc = inst('ReceiptChecklist', { Breakpoint: BP(), State: filled ? 'Filled' : 'Default' }); rc.name = 'ReceiptChecklist';
    const hs = inst('HandoverSignature', { State: signed ? 'Signed' : filled ? 'Filled' : 'Default' }); hs.name = 'HandoverSignature';
    // หัวลงนามในตัว component = "ลงนามการรับมอบรถ" → แก้แค่ข้อความ · ReceiptChecklist ของงานซ่อมมีส่วนลงนามซ้อนอยู่ในตัวด้วย (แบบเดียวกับ Overhaul S8) แก้ทั้งสองที่ให้ตรงกัน
    // 1 ส่วนลงนามเท่านั้น (ชีตลูกค้า 5 พ.ย. 2569: เห็น "ลงนามการตรวจสภาพ" สองชุด และเซ็นแล้วเปลี่ยนแค่ชุดเดียว) — HandoverSignature ที่ซ้อนใน ReceiptChecklist มีแค่ State Default/Filled
    // (ไม่มี Signed) ⇒ ซ่อนชุดที่ซ้อน ใช้ HandoverSignature แยกที่มีครบ 3 State ทั้งยังไม่เซ็นและเซ็นแล้ว
    rc.findAll(n => n.name === 'HandoverSignature').forEach(n => { n.visible = false; });
    await signFix(hs, SIGN_INSPECT, SIGN_IN, filled);
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
  return [col('ReceiptChecklist', [await section('รายการเอกสารรับยานพาหนะ', { badge: RECEIPT_ITEMS.length })].concat(list), 16),
    await signSection(SIGN_INSPECT, SIGN_IN, o.filled, o.signed)];
}
/* ลงนามการส่งคืนรถ ตอนปิดงาน — 5 พ.ย. 2569 เจ้าของงาน "s10 เอาตรวจสภาพปิดงาน ออกไปเลย" (R65) ⇒ เอาตารางตรวจสภาพรถปิดงาน (24 รายการ ปกติ/ต้องแก้ไข/หมายเหตุ + เพิ่มรายการ) ออก คงไว้แค่ลงนามการส่งคืนรถ
   ไฟล์ที่มี InspectionChecklist ของงานซ่อม: ใช้ instance เดิม AfterRepair=true แล้วซ่อนส่วนตรวจสภาพ (Section header · Content with scrollbar · Table pagination) เหลือ AfterRepair > HandoverSignature (ซ่อน RepairFeedback ReturnPart เหมือนเดิม)
   ไม่มี component / แบบสำรอง = signSection "ลงนามการส่งคืนรถ" · รายการรับรถตอนเริ่มงาน (receiptPanel) ไม่เกี่ยว คงเดิม */
async function inspectPanel(filled, signed, sign) {   // sign = ผู้ลงนาม (ค่าเริ่ม SIGN_OUT · S23 vendorSign)
  sign = sign || SIGN_OUT;
  if (has('InspectionChecklist')) {
    const ic = inst('InspectionChecklist', { Breakpoint: BP(), State: filled ? 'Filled' : 'Default' }, { AfterRepair: true }); ic.name = 'InspectionChecklist';
    ic.children.forEach(c => { if (c.name !== 'AfterRepair') c.visible = false; });
    const ar = find(ic, 'AfterRepair');
    if (ar) { ar.visible = true; ['RepairFeedback', 'ReturnPart'].forEach(nm => { const x = find(ar, nm); if (x) x.visible = false; });
      const hs = find(ar, 'HandoverSignature'); if (hs) { setProps(hs, { State: signed ? 'Signed' : filled ? 'Filled' : 'Default' }); await signFix(hs, 'ลงนามการส่งคืนยานพาหนะ', sign, filled); } }
    return [ic];
  }
  return [await signSection('ลงนามการส่งคืนยานพาหนะ', sign, filled, signed)];
}
/* ---------- S10 ขั้นตอนบำรุงรักษา 2 ขั้น (5 พ.ย. 2569 รีวิวทีมออกแบบ · เจ้าของงาน "s10 ลองปรับให้เป็นแบบที่เขียนให้") ----------
   รีวิว: "หน้างานรายคัน - เริ่มงาน เมื่อกดเริ่มงาน จะพาเข้า Step การ Maintain · Step1 : ตรวจสภาพก่อนบำรุงรักษา ลงนามการตรวจสภาพ · Step2 : ไม่ต้องมีแล้ว · Step3 : เอาไปแทน Step2 สรุปงานก่อนปิดงาน"
   ⇒ กดเริ่มงาน = สถานะ "อยู่ระหว่างบำรุงรักษา" ทันที (เจ้าของงาน 5 พ.ย. 2569 "เข้ามา step 1 ถือว่า อยู่ระหว่างบำรุงรักษา เลย") แล้วเข้าหน้าขั้นตอน
     Step 1 ตรวจสภาพก่อนบำรุงรักษา = รายการรับรถ (ReceiptChecklist) + ลงนามการตรวจสภาพ (HandoverSignature · บังคับ "เรื่องลงนาม require" ⇒ ปุ่มยืนยันกดไม่ได้จนลงนามครบ) + ภาพก่อนเริ่มงาน
     Step 2 สรุปงานก่อนปิดงาน = หน้าปิดงานเดิม (ไล่ยาว) + จำนวนที่ใช้จริงกรอกได้ (R74) + งบที่ตัด/ศูนย์ต้นทุนแบบงานซ่อม (R72) + วันที่เปลี่ยนน้ำมันครั้งล่าสุดกรอกได้ (R73)
     หน้า "อยู่ระหว่างบำรุงรักษา" ระหว่างรับรถกับปิดงาน (Step 2 เดิมของรีวิว) เอาออก
   แถบขั้นตอน (R70) = Progress steps Type=Horizontal ของไลบรารีทั้งก้อน ซ่อนช่อง 3–7 (R10 · แบบ Create vehicle ของ 5.2 Vehicle Management ใน UI Release#2 ที่ปิดช่องเกิน)
     วางบนสุดของเนื้อหาแบบหน้างานซ่อม (Repair - กบค. ของไฟล์ Maintain-D: Section > Progress steps > เนื้อหาขั้น) · มือถือ = Mobile progress steps Collapsed=True
     + Step circles / 4 steps ตัวเลข 1/2 · 2/2 แบบ Check Expense Modal หน้า 5.14 - 5.15 Cost & Expense Check ของ UI Release#2 (ขั้นตอน 2 ขั้น)
   ปุ่มตามกติกา stepper ของเจ้าของงาน (ง.5): ขั้นปัจจุบัน ย้อนกลับ (ซ้าย) + ปุ่มยืนยันของขั้น (ขวา) · ปุ่ม "บำรุงรักษาไม่ได้" อยู่ที่หัวหน้าทุกขั้น */
const MT_STEPS = ['ตรวจสภาพก่อนบำรุงรักษา', 'สรุปงานก่อนปิดงาน'];
/* ป้ายสถานะที่หัวหน้าสีเดียวกับตาราง (ชีตลูกค้า 5 พ.ย. 2569: "อยู่ระหว่างบำรุงรักษา" หัวหน้าเป็น Brand แต่ตารางเป็น Warning) — Badge outline ของ Page header ไม่มีสี Warning
   ⇒ สลับเป็น Pill outline สีตาม WSTAT แบบ Page header ของหน้า Vehicle Breakdown / 5.5 Repair & Maintenance Job ใน UI Release#2 (Pill outline Warning "อยู่ระหว่างซ่อม" ในหัว) */
function headPill(scr, st) {
  const ph = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Page header')[0], b = ph && ph.findAll(n => n.type === 'INSTANCE' && n.name === 'Badge outline')[0];
  if (!b) return;
  try { b.swapComponent(main('Pill outline', { Color: st[1] })); setProps(b, { Text: st[0] }); } catch (e) { warn('ป้ายหัวหน้า Pill outline', e); }
}
async function mtStepper(cur) {   // cur = 1 | 2
  if (MOB) {
    const m = inst('Mobile progress steps', { Collapsed: 'True' }, { Text: MT_STEPS[cur - 1], Supporting: cur < MT_STEPS.length, 'Supporting text': MT_STEPS[cur] || '' });
    setProps(m, { 'Stepper item swap': main('Step circles / 4 steps', { Step: cur === 1 ? '2' : '4' }).id });   // วง 2/4 = ครึ่ง (1 จาก 2) · 4/4 = เต็ม (2 จาก 2)
    const c = m.findAll(n => n.type === 'INSTANCE' && /^Step circles/.test(n.name))[0];
    if (c) { await text(c, 'Current', String(cur)); await text(c, 'Total', String(MT_STEPS.length)); }
    return m;
  }
  const ps = inst('Progress steps', { Type: 'Horizontal' }, { 'Step 2': true, 'Step 3': true, 'Step 4': true });
  ps.children.filter(c => c.type === 'INSTANCE' && c.name === 'Horizontal step item').forEach((it, k) => {
    if (k >= MT_STEPS.length) { it.visible = false; return; }
    const n = k + 1;
    setProps(it, { Status: n < cur ? 'Completed' : n === cur ? 'Current' : 'Incomplete' });
    setProps(it, { Text: MT_STEPS[k], Number: String(n).padStart(2, '0'), Supporting: false, Connector: n < MT_STEPS.length });
    try { it.layoutGrow = 1; } catch (e) { /* กว้างตามไลบรารี */ }
  });
  return ps;
}
/* หน้าขั้นตอนของงานรายคัน · o.step = 1 | 2 · o.hire = ใบจ้าง (กบค. กรอกแทนผู้รับจ้าง) · o.vendor = S23 มุมผู้รับจ้าง (R87) · o.i = ลำดับรถ
   ใบจ้างทั้งสองแบบ (o.hire · o.vendor) Step 2 ไม่มีส่วนค่าใช้จ่ายของยานพาหนะ และตารางรายการสภาพวัสดุอะไหล่ไม่มีคอลัมน์ราคา (เจ้าของงาน 10 พ.ย. 2569
   _"จะไม่มีเรื่องทั้ง section ค่าใช้จ่ายรายคัน ที่ต้องกรอก ส่วนที่สภาพวัสดุอะไหล่ ส่วนที่เป็นราคาต้องไม่แสดง · s23 ยังแสดงเหมือนเดิมแต่ส่วนที่เป็นราคา ของค่าใช้จ่ายของรถรายคัน จะไม่มี ส่วนที่เหลือยังคงเดิม"_)
   ผู้รับจ้าง: วันดำเนินการใน Step 1 อ่านอย่างเดียว (ผู้รับจ้างแก้ข้อมูลยานพาหนะในแผนเดินทางไม่ได้ ตามเงื่อนไขการมองเห็นเดิม · ยังไม่เคาะ) · ผู้ลงนามฝั่งผู้ดำเนินการ = ช่างผู้รับจ้าง (vendorSign)
   Step 1: o.filled (ตรวจรายการแล้ว) · o.signed (ลงนามครบ) · o.signModal
   Step 2: o.filled · o.errors · o.safety · o.oilRes · o.oil (ตัวเลือกน้ำมัน) · o.date / o.dateOpen (วันที่เปลี่ยนน้ำมันครั้งล่าสุด) · o.budget (budgetPick)
   ทั้งสองขั้น: o.modal = 'cannot' (popup บำรุงรักษาไม่ได้) · o.reason · o.cannotErrors */
async function stepPage(name, o) {
  o = o || {};
  const v = !!o.vendor, h = !!o.hire || v, t = h ? HIRE_T : JOB_T, i = o.i == null ? (h ? TRIP_V.sel[0] : JOB_I) : o.i, c = o.car || TRIP_CARS[i], step = o.step || 1;   // o.car = จอตัวอย่างรถพ่วงฉีดน้ำ (R86)
  const { scr, page } = await shell(name, { title: c[0], back: true, crumbs: [NOW_Q, t.name, c[0]], badge: WSTAT.doing, actions: [['Secondary button', 'บำรุงรักษาไม่ได้']] });
  headPill(scr, WSTAT.doing);
  const nodes = [await mtStepper(step)].concat(await jobBoxes(h, t, i, true, o.car, v ? HIRE_BY : null));
  let dateAnchor = null, workAnchor = null;
  if (step === 1) {
    /* R83 แก้วันดำเนินการของคันนี้ตอนเริ่มงาน (9 พ.ย. 2569 ค่ำ เจ้าของงาน _"ในแผนการเดินทางอ่ะ จะมีช่วงของการดำเนินการอยู่แล้ว แต่ในรายคันอยากให้เห็นว่าแต่ละคันจะดำเนินการเมื่อไร"_ + _"ใส่ตรงหน้ารายการรถ ก็ได้ หรือจะใส่ในตอนเริ่มงานก็ได้ … อยากให้สามารถแก้ไขได้"_) ⇒ Section "วันดำเนินการ" บนสุดของ Step 1 · ช่องเดียวกับ popup แก้ไขยานพาหนะในแผนเดินทาง (Text input + ไอคอนปฏิทิน ช่วงวัน) ค่าเริ่มต้น = วันดำเนินการในตาราง · o.workPick = เปิดปฏิทิน */
    const wv = (o.workPick || workRange(i, t)).join(' - ');
    workAnchor = field('วันดำเนินการ', wv, { lead: 'calendar_month-24-300-round', state: v ? 'Readonly' : o.workPick ? 'Focused' : undefined });   // S23 อ่านอย่างเดียว
    nodes.push(col('Section', [await section('วันดำเนินการ'), MOB ? workAnchor : row('Row', [workAnchor, frame('Spacer', 'VERTICAL')])], 16));
    nodes.push(...await inspectStep(c, o.filled, o.signed, v ? vendorSign(SIGN_IN) : null),   // 9 พ.ย. 2569 แบบตรวจตามประเภทยานพาหนะ แทนรายการเอกสารรับยานพาหนะ (R86)
      col('Section', [await section('ภาพก่อนเริ่มงาน')].concat(await photoUploads(BEFORE, o.filled, false)), 16),
      btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันการตรวจสภาพ', { size: 'lg', disabled: !o.signed }]]));   // ลงนามบังคับ (เจ้าของงาน 5 พ.ย. 2569)
  } else {
    const E = (m) => o.errors ? m : '', oil = o.oil == null ? TRIP_OIL[i] : o.oil;   // ค่าตั้งต้น = น้ำมันตามแผนของคันนี้ (S21)
    nodes.push(
      col('Section', [await section('ข้อมูลเอกสาร'), kv([['เลขที่งาน', P[0]], ['หน่วยงานผู้ใช้บริการ', c[2]], ['ชื่องาน', 'บำรุงรักษา' + typeOf(c) + ' ' + c[1] + ' ทะเบียน ' + c[0] + ' ณ ' + tripLoc(i, t.locs)], ['วันที่รับงาน', JOB_START.slice(0, 10)], ['วันที่เสร็จงาน', JOB_END.slice(0, 10)]])], 16),
      col('Section', [await section('บันทึกข้อตกลงลูกค้า'), kv([['ติดต่อลูกค้าชื่อ', SIGN_OWNER], ['ตำแหน่ง', 'หัวหน้าแผนก ' + c[2]], ['เมื่อวันที่', t.d1], ['เบอร์โทรศัพท์', tripPhone(i, t.phones)], ['ความต้องการลูกค้า', 'บำรุงรักษาตามแผน ณ ' + tripLoc(i, t.locs)]])], 16),
      await closeParts(CLOSE_PARTS.filter((r, k) => k > 0 || oil !== 0), o.filled, h));   // ใบจ้าง: ไม่มีคอลัมน์ราคา (R87)
    if (!h) nodes.push(await closeCosts(o.filled, o.budget));   // ใบจ้าง: ไม่มีส่วนค่าใช้จ่ายของยานพาหนะคันนี้ (รวมงบที่ตัด ศูนย์ต้นทุน · R87)
    nodes.push(
      col('Section', [await section('ผลการบำรุงรักษา'),
        row('Row', [field('เลขไมล์ยานพาหนะ (กม.)', o.filled ? '182,640' : '', { placeholder: '0', error: E('กรุณาระบุเลขไมล์ยานพาหนะ') }),
          field('ชั่วโมงเครื่องจักร (ชม.)', o.filled ? '6,131' : '', { placeholder: '0', error: E('กรุณาระบุชั่วโมงเครื่องจักร') })])], 16));
    const oilBox = await jobOil(oil, o.oilRes || {}, { date: o.date, dateOpen: o.dateOpen, car: c[0] });
    dateAnchor = oilBox.findOne(n => n.type === 'INSTANCE' && n.name === 'Text input' && n.componentProperties && Object.keys(n.componentProperties).some(k => /^Label text/.test(k) && n.componentProperties[k].value === 'วันที่เปลี่ยนน้ำมันครั้งล่าสุด'));
    nodes.push(oilBox);
    if (safetyOn()) nodes.push(col('Section', await safetyDocs(o.safety), 16));   // Safety Inspection (ถ้ามี) ต่อจากน้ำมันไฮดรอลิก (4 พ.ย. 2569)
    nodes.push(...await inspectPanel(o.filled, o.filled, v ? vendorSign(SIGN_OUT) : null));   // ลงนามการส่งคืนรถ (5 พ.ย. 2569 ตัดตรวจสภาพรถปิดงานออก · R65)
    nodes.push(await closeDocs(o.filled));
    nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ปิดงาน', { size: 'lg', disabled: !o.filled }]]));   // 5 พ.ย. 2569 กติกาใหม่ (R59): Disabled จนกว่าครบ (เลขไมล์ ชั่วโมงเครื่องจักร ลงนามการส่งคืนรถ) · error ขึ้นเมื่อออกจากช่อง (Out of focus)
  }
  add(page, col('Content', nodes, 32), 'h');
  if (step === 1 && o.signModal) await signModal(scr, SIGN_INSPECT, o.filled, (v ? vendorSign(SIGN_IN) : SIGN_IN)[0]);
  if (o.workPick && workAnchor && !MOB) {   // ปฏิทินช่วงวัน แบบ popup แก้ไขยานพาหนะในแผนเดินทาง (rangeDays · วันนอกช่วงวันเดินทางกดไม่ได้)
    const dp = await rangeDays(await thaiDatePicker(inst('Date picker', { Type: 'Single' }, { 'Time picker': false }), [monthOf(t.d1)]), dayOf(t.d1), dayOf(t.d2), dayOf(o.workPick[0]), dayOf(o.workPick[1]));
    overlay(scr, dp, 0, 0);
    const sb = scr.absoluteBoundingBox, ab = workAnchor.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4;
  }
  if (o.dateOpen && dateAnchor && !MOB) {   // ปฏิทินวันเดียว = Date picker Type=Single วางใต้ช่อง (มือถือไม่วาง แบบช่องวันที่ของ S6)
    const dp = await thaiDatePicker(inst('Date picker', { Type: 'Single' }, { 'Time picker': false }), ['มีนาคม 2568']);   // เดือนของวันที่ในช่อง (12/03/2568)
    overlay(scr, dp, 0, 0);
    const sb = scr.absoluteBoundingBox, ab = dateAnchor.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4;
  }
  if (o.modal === 'cannot') await cannotModal(scr, i, { reason: o.reason, used: step === 2 ? CANNOT_USED : null, errors: o.cannotErrors });
  return scr;
}
async function workDetail(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: V[0], back: true, crumbs: [NOW_Q, JOB_T.name, V[0]], badge: WSTAT.done,   // 3 พ.ย. 2569 หัวเป็นทะเบียนเหมือนหน้างานรายคัน S10
 });
  const nodes = [await vehicleInfo(VEH_KV.concat([['เริ่มงาน', JOB_START], ['ปิดงาน', JOB_END], ['ผู้บันทึก', JOB_BY], ['น้ำมันไฮดรอลิก', JOB_OIL_OPTS[JOB_OIL]], ['เลขไมล์หลังทำ', '182,640 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '6,131 ชม.']]), 'ข้อมูลยานพาหนะและงาน'),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tblShort(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16),
    // ภาพตอนจบงานเอาออก 4 พ.ย. 2569 ให้ตรงกับหน้าปิดงาน ("ยังไม่ต้องมีเพิ่มรูป" 3 พ.ย.)
    // ค่าใช้จ่ายรายคันที่กรอกตอนปิดงาน (3 พ.ย. 2569) · แสดงเฉพาะรายการที่กรอก
    col('Section', [await sectionLabel('ค่าใช้จ่ายของยานพาหนะคันนี้ (บาท)'), await tblShort([['พนักงาน', 0, 'Lead text'], ['ค่าเบี้ยเลี้ยง/วัน', 150], ['ค่าที่พัก/วัน', 150], ['จำนวนวัน', 120], ['รวม', 150]],
      CLOSE_COST_BY.map(r => [r[0], nf(r[1]), nf(r[2]), String(r[3]), nf(personSum(r))])),
      kv([['รวมค่าเบี้ยเลี้ยง', CLOSE_COST.perDiem + ' บาท'], ['รวมค่าที่พัก', CLOSE_COST.lodging + ' บาท'], ['ค่าเดินทาง (รวมทุกคน)', CLOSE_COST.travel + ' บาท'], ['ค่าชั่วโมงทำงาน', CLOSE_HOURS + ' ชม. × ' + nf(CLOSE_RATE) + ' บาท = ' + CLOSE_COST.labour + ' บาท'], ['รวมค่าใช้จ่ายของยานพาหนะคันนี้', CLOSE_COST.total + ' บาท'], ['งบที่ตัด', BUDGET_CUT[0]], ['ศูนย์ต้นทุน', OWNER_CC(TRIP_CARS[JOB_I])]])], 16)];   // คู่ งบที่ตัด + ศูนย์ต้นทุน แบบ BudgetSource ของงานซ่อม (5 พ.ย. 2569 R72)
  // 3 พ.ย. 2569 เจ้าของงาน "ตรงนี้ลบแบชออก แล้วมี radio ว่าผ่าน ไม่ผ่าน และมีให้ upload ไฟล์เป็น optional" ⇒ กรอกผลในหน้านี้ได้เลย (อีกทางคือเมนู … ในหน้ารายละเอียดแผนเดินทาง S12)
  // S12 (4 พ.ย. 2569) ทางเดียวที่บันทึกผลหลังปิดงาน = section นี้ในหน้ารายละเอียดงานรายคัน · แสดงเฉพาะคันที่เก็บตัวอย่าง · o.res = { sel, files, errors, saved }
  const res = o.res || {};
  if (OIL_SAMPLED(JOB_OIL)) nodes.push(col('Section', [await sectionLabel('ผลการทดสอบน้ำมันไฮดรอลิก'), ...await oilResult(res),   // หน้างานรายคันแบบดู = Section label (R3)
    kv([['เก็บตัวอย่างเมื่อ', JOB_END.slice(0, 10) + ' โดย ' + JOB_BY]].concat(res.saved ? [['บันทึกผลเมื่อ', '11/11/2569 14:02 น. โดย ' + JOB_BY]] : [])),
    btnRow([['Primary button', 'บันทึกผลการทดสอบ', { size: 'md' }]])], 16));
  const sf = o.safety || {};   // Safety Inspection เพิ่มภายหลัง (4 พ.ย. 2569) · o.safety = { files, saved }
  if (safetyOn()) nodes.push(col('Section', [...await safetyDocs(sf.files, true)].concat(sf.saved ? [kv([['บันทึกเอกสารเมื่อ', '12/11/2569 09:30 น. โดย ' + JOB_BY]])] : [],
    [btnRow([['Primary button', 'บันทึกเอกสาร Safety Inspection', { size: 'md' }]])]), 16));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S24 ข้อมูลการบำรุงรักษารายคัน + กำหนดครั้งถัดไป (เจ้าของงาน 4 พ.ย. 2569 · เลขชั่วคราว) ----------
   "จากข้อมูลที่กรอก ในตอนปิดงาน อยากให้ข้อมูลเหล่านั่นถูกเก็บ ในตารางๆ นึง แยกเป็นข้อมูลการบำรุงรักษา โดยอนาคตจะต้องแทร็กได้ ว่า ใกล้ถึงกำหนดการบำรุงรักษาครั้งต่อไปมั้ย … หน้าลิสที่มีรถทุกคัน และ search and filter ได้"
   เคาะ: แท็บ "การบำรุงรักษา" ของ Vehicle Management · ครั้งถัดไป = รายการที่ถึงก่อนจาก 4 อย่าง (รอบเวลา · ชั่วโมงเครื่องจักร/ระยะทาง · น้ำมันไฮดรอลิก 3 ปี · Safety Inspection 1 ปี) · ใกล้ครบ = เหลือไม่เกิน 6 เดือน
   ตาม Vehicle list + Filter + Vehicle detail (แท็บ ตารางบำรุงรักษา) ของ UI Release#2 หน้า Vehicle Management · Tabs · Table header · Table · Side panel header/footer · Empty state/Search not found ของไฟล์ Component
   บรรทัดรองสถานะ = Supporting text สี Color/text/warning · Color/text/error แบบช่องเลขไมล์ของ Vehicle list (toneText ใน core) */
const MA_DUE = { near: ['ใกล้ครบกำหนดบำรุงรักษา', 'warning'], over: ['ครบกำหนดบำรุงรักษา', 'error'] };   // ข้อความตาม Vehicle list ของ UI Release#2
/* 10 พ.ย. 2569 เจ้าของงาน "ตอนนี้น่าจะมีแค่เกณฑ์เรื่องเวลา คือ เปลี่ยนทุก 1 ปี สำหรับกรองอากาศ และถ้าเป็นน้ำมันไฮดรอลิก จะเปลี่ยนทุก 3 ปี ระหว่างนั้น ต้องเก็บตัวอย่าง
   แปลว่าระบบต้องจำได้ว่า ถึงรอบการเปลี่ยน หรือการเก็บตัวอย่าง จากการที่ระบุมาในการบำรุงรักษา" + เคาะ เก็บตัวอย่างทุก 1 ปี · คง Safety Inspection ทุก 1 ปี และรอบบำรุงรักษาทั่วไป · ตัดชั่วโมงเครื่องจักร/ระยะทาง
   ระบบจำจากที่บันทึกตอนปิดงาน S10 Step 2: ไส้กรองอากาศ = มีในอะไหล่ที่ใช้จริง · น้ำมัน = ตัวเลือกเก็บตัวอย่าง / เปลี่ยน · ผลตรวจจาก S12 · Safety = เอกสารที่บันทึก (I.24) — ไม่ต้องเพิ่มช่องกรอก */
const MA_ITEMS = ['รอบบำรุงรักษา', 'ไส้กรองอากาศ', 'เปลี่ยนน้ำมันไฮดรอลิก', 'เก็บตัวอย่างน้ำมัน', 'การตรวจ ปจ.2'];   // รายการที่ 5 ชื่อบนจอ "การตรวจ ปจ.2" (เดิม Safety Inspection · เจ้าของงาน 11 พ.ย. 2569 · MA_ITEMS ของเว็บ BACKLOG ข้อ 67ง) · เอกสารแนบตอนปิดงาน S10 ยังชื่อ Safety Inspection ตามเว็บ
const MA_CYCLE = ['ทุก 12 เดือน', 'เปลี่ยนทุก 1 ปี', 'เปลี่ยนทุก 3 ปี (ปีที่ 1 และปีที่ 4)', 'เก็บตัวอย่างปีที่ 2 และ 3 หลังเปลี่ยน', 'ทุก 1 ปี'];   // เจ้าของงาน 10 พ.ย. 2569 "ปีที่ 1 เปลี่ยนน้ำมัน ปีที่2 เก็บตัวอย่าง ปีที่ 3 เก็บตัวอย่าง และปีที่ 4 เปลี่ยนน้ำมัน" (ผลตัวอย่างกรอกที่ S12 เหมือนเดิม)   // รอบบำรุงรักษาทั่วไป 12 เดือน = เสนอ ยังไม่เคาะ
const MA_TODAY = [10, 11, 2569], MA_NEAR = 6;   // วันนี้ (ค่าสมมติ) · ใกล้ครบ = เหลือไม่เกิน 6 เดือน (เคาะ 4 พ.ย. 2569)
const maD = (s) => s.split('/').map(Number);   // dd/mm/yyyy พ.ศ.
const maAdd = (s, y) => { const [d, m, yy] = maD(s); return [d, m, yy + y].map((v, k) => k < 2 ? String(v).padStart(2, '0') : String(v)).join('/'); };
const maKey = (s) => { const [d, m, y] = maD(s); return y * 400 + m * 32 + d; };
const maStatus = (due) => { const t = MA_TODAY, k = maKey(due), now = t[2] * 400 + t[1] * 32 + t[0], near = (t[2] + Math.floor((t[1] + MA_NEAR - 1) / 12)) * 400 + ((t[1] + MA_NEAR - 1) % 12 + 1) * 32 + t[0];
  return k < now ? 'over' : k <= near ? 'near' : ''; };
/* ยานพาหนะทุกคัน (ข้อมูลสมมติ) — [ลำดับใน TRIP_CARS, บำรุงรักษาล่าสุด, เลขที่ MR, เปลี่ยนไส้กรองอากาศล่าสุด, เปลี่ยนน้ำมันล่าสุด, เก็บตัวอย่างล่าสุด, ผลตรวจล่าสุด, Safety Inspection ล่าสุด] · '' = ยังไม่มีข้อมูล */
const MA_ROWS = [
  [9, '01/10/2568', 'MRZ6900011', '01/10/2568', '01/10/2566', '01/10/2568', 'ผ่าน', '01/10/2568'],
  [2, '14/10/2568', 'MRZ6900011', '14/10/2567', '14/10/2565', '14/10/2568', 'ไม่ผ่าน', '14/10/2568'],
  [7, '20/11/2568', 'MRZ6900011', '20/11/2568', '05/02/2567', '20/11/2568', 'ผ่าน', '20/11/2568'],
  [4, '10/01/2569', 'MRZ6900014', '10/01/2569', '10/01/2569', '10/01/2569', 'ผ่าน', '10/01/2569'],
  [6, '02/02/2569', 'MRZ6900014', '02/02/2569', '18/06/2567', '02/02/2569', 'ผ่าน', '02/02/2569'],
  [1, '18/06/2569', 'MRZ6900014', '18/06/2569', '12/03/2567', '18/06/2569', 'ผ่าน', '18/06/2569'],
  [8, '20/09/2569', 'MRZ7000001', '20/09/2569', '20/09/2569', '20/09/2569', 'ผ่าน', '20/09/2569'],
  [0, '04/11/2569', 'MRZ7000001', '04/11/2569', '04/11/2569', '04/11/2569', 'รอผลตรวจ', '04/11/2569'],
  [3, '', '', '', '', '', '', '']];
/* ครบกำหนดแต่ละรายการ: [วันที่, สถานะ] ตามลำดับ MA_ITEMS · น้ำมัน: ปีที่ครบเปลี่ยนแสดงเปลี่ยนแทนเก็บตัวอย่าง */
const maDues = (r) => {
  if (!r[1]) return null;
  const chg = maAdd(r[4], 3), smp = maAdd(maKey(r[5]) > maKey(r[4]) ? r[5] : r[4], 1);
  const oilChange = maKey(chg) <= maKey(smp);
  const d = [maAdd(r[1], 1), maAdd(r[3], 1), chg, oilChange ? '' : smp, maAdd(r[7], 1)];
  return d.map(x => x ? [x, maStatus(x)] : null);
};
const maNext = (r) => { const d = maDues(r); if (!d) return null; let k = -1; d.forEach((x, i) => { if (x && (k < 0 || maKey(x[0]) < maKey(d[k][0]))) k = i; }); return [k, d[k][0], d[k][1]]; };
const maOil = (r) => { const d = maDues(r); return d[3] ? ['เก็บตัวอย่าง', d[3]] : ['เปลี่ยนน้ำมัน', d[2]]; };
const toneOf = (st) => MA_DUE[st] ? { sub: MA_DUE[st][0], tone: MA_DUE[st][1] } : {};
/* หน้ารายการ (10 พ.ย. 2569 รอบ 2 เจ้าของงาน "ไส้ใน column อยากปรับใหม่ … หน้าของ list อยากแสดงรายละเอียดอื่นๆ ตัวอย่างเช่นพวกอายุการใช้งาน หรืออะไรที่เกี่ยวข้องกับการบำรุงรักษา")
   ⇒ คอลัมน์รายการ (ไส้กรองอากาศ · น้ำมัน · Safety) ย้ายไปแท็บตารางบำรุงรักษาของหน้ารายละเอียด · เจ้าของงานเลือก อายุการใช้งาน/เลขไมล์ · บำรุงรักษาล่าสุด · ครั้งถัดไป · ผลตรวจน้ำมัน · ประกัน · สถานะยานพาหนะ · ผู้ดูแลยานพาหนะ
   Table ของไลบรารี 8 คอลัมน์ ⇒ ไม่มีคอลัมน์ปุ่ม … · เปิดรายละเอียดด้วยลิงก์เลขทะเบียน (แบบลิงก์ทะเบียนทุกจุดของงานบำรุงรักษา 6 พ.ย. 2569 · AFTER_SCREEN) */
const MA_VSTAT = { ok: ['ปกติ', 'Success'], repair: ['อยู่ระหว่างซ่อม', 'Warning'], off: ['งดใช้งาน', 'Gray'] };   // สถานะยานพาหนะ (ค่าสมมติ ป้าย "ปกติ" ตามหน้ายานพาหนะของปลั๊กอิน Overhaul)
/* ต่อแถว MA_ROWS: [ปีที่จดทะเบียน, เลขไมล์สะสม, ชั่วโมงเครื่องจักรสะสม, ประกัน (MA_WAR), สถานะยานพาหนะ] (ค่าสมมติ) */
const MA_USE = [[2557, '171,220', '5,610', 'none', 'ok'], [2558, '168,900', '5,480', 'out', 'repair'], [2560, '154,300', '4,920', 'none', 'ok'], [2561, '176,050', '5,840', 'in', 'ok'],
  [2562, '149,700', '4,410', 'none', 'ok'], [2559, '176,050', '6,010', 'near', 'ok'], [2563, '163,480', '5,120', 'none', 'ok'], [2564, '182,640', '6,131', 'in', 'ok'], [2566, '41,200', '980', 'none', 'off']];
const MA_COLS = [['ทะเบียน', 200, 'Lead text'], ['อายุการใช้งาน', 170], ['บำรุงรักษาล่าสุด', 140], ['ครั้งถัดไป', 0], ['ผลตรวจน้ำมันล่าสุด', 160], ['ประกัน', 150, 'Badge'], ['สถานะยานพาหนะ', 150, 'Badge'], ['ผู้ดูแลยานพาหนะ', 190]];
const maRow = (r) => {
  const k = MA_ROWS.indexOf(r), c = TRIP_CARS[r[0]], u = MA_USE[k], n = maNext(r);
  return [{ text: c[0], sub: typeOf(c) }, { text: (MA_TODAY[2] - u[0]) + ' ปี', sub: u[1] + ' กม. · ' + u[2] + ' ชม.' }, r[1] ? { text: r[1], sub: r[2] } : '-',
    n ? Object.assign({ text: n[1] + ' · ' + MA_ITEMS[n[0]] }, toneOf(n[2])) : { text: 'ยังไม่มีข้อมูลการบำรุงรักษา' }, r[6] ? { text: r[6], sub: 'เก็บตัวอย่าง ' + r[5] } : '-',
    { pill: MA_WAR[u[3]] }, { pill: MA_VSTAT[u[4]] }, { text: CTRL_NAME[r[0]], sub: OWNER_PH[r[0]] }];
};
const maIdx = (fn) => MA_ROWS.map((r, i) => fn(r) ? i : -1).filter(i => i >= 0);
const MA_DUE_N = maIdx(r => { const n = maNext(r); return n && n[2]; }).length;
async function maTabs() { return tabs([['ยานพาหนะ', null], ['การบำรุงรักษา', MA_DUE_N]], 1); }   // แท็บของ Vehicle list · ป้าย = คันที่ใกล้หรือถึงกำหนด · ปฏิทินการจอง (ระบบจองยานพาหนะ) เอาออก 10 พ.ย. 2569 เจ้าของงาน
async function searchNotFound() {   // Empty state/Search not found ข้อความตาม Vehicle list (State=Search not found) ของ UI Release#2
  const es = inst('Empty state/Search not found');
  await text(es, 'Text', 'ไม่พบข้อมูล'); await text(es, 'Supporting text', 'เปลี่ยนคำค้นหรือเงื่อนไขแล้วลองใหม่อีกครั้ง');
  const bs = es.findAll(n => n.type === 'INSTANCE' && /button/i.test(n.name));
  bs.forEach((b, i) => { if (i === 0) setProps(b, { Text: 'ล้างตัวกรอง', 'Leading icon': false, 'Trailing icon': false }); else b.visible = false; });
  return es;
}
/* แดชบอร์ดการบำรุงรักษารายคัน (10 พ.ย. 2569 เจ้าของงาน "ตั้งใจอยากให้หน้านี้เป็นหน้า dashboard ที่สามารถกรองสิ่งต่างๆที่ต้องการ เช่น รถที่จะเข้าบำรุงครั้งต่อไป โดย filter จากเวลาในการบำรุงรักษาล่าสุด
   หรืออยาก filter รถที่ต้องเก็บผลน้ำมัน และรถแต่ละคันควรจะเข้าไปดูรายละเอียดได้") — โครงตาม MA Overview ของ UI Release#2: Tabs → Metric item → Table header → Table · R90
   o.query · o.rows = แถวที่เหลือ (ลำดับใน MA_ROWS) · o.chips · o.filter = แผงตัวกรอง { open } · o.menu */
/* S24 แบบ VMS+ (12 พ.ย. 2569 · R106 · ชุดวาดเหนือ S4) — Tabs ของ Vehicle list → หัวแดชบอร์ด → เรื่องที่ควรดู → ตัวกรองที่เลือก → การ์ดตัวเลข 6 ใบ → กราฟ 6 ใบ → Table header + Table (MA_COLS เดิม) → หมายเหตุแหล่งข้อมูล
   ตัวเลขทุกส่วนคิดจาก MA_ROWS · MA_USE · TRIP_CARS เดิม (maNext · maDues · maOil) · ตัวกรอง/กดกราฟ/กดเรื่องที่ควรดู กรองทั้งหน้า (o.rows) · ช่องค้นหากรองเฉพาะตาราง */
const maDate = (s) => { const [d, m, y] = maD(s); return new Date(y - 543, m - 1, d); };
const MA_NOW = () => new Date(MA_TODAY[2] - 543, MA_TODAY[1] - 1, MA_TODAY[0]);
const maUnit = (r) => TRIP_CARS[r[0]][2];   // หน่วยงานเจ้าของยานพาหนะ เช่น "กฟฉ.1 ขอนแก่น" · เขต = คำแรก
const maAge = (i) => MA_TODAY[2] - MA_USE[i][0];
const maState = (r) => !r[1] ? 'none' : (maNext(r)[2] || 'ok');   // ปกติ · ใกล้ครบ · เลยกำหนด · ยังไม่มีข้อมูล
const MA_STATE = { ok: ['ปกติ', 'success'], near: ['ใกล้ครบกำหนด', 'warning'], over: ['เลยกำหนด', 'error'], none: ['ยังไม่มีข้อมูล', 'gray'] };
const MA_OILRES = [['ผ่าน', 'success'], ['ไม่ผ่าน', 'error'], ['รอผลตรวจ', 'warning'], ['ยังไม่ตรวจ', 'gray']];
const MA_AGE_GROUPS = [['0–5 ปี', 0, 5], ['6–10 ปี', 6, 10], ['11–15 ปี', 11, 15], ['มากกว่า 15 ปี', 16, 999]];
const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const maOilDue = (r) => r[1] ? maDues(r)[2] : null;   // [วันครบเปลี่ยนน้ำมันไฮดรอลิก, สถานะ]
const maDays = (s) => Math.round((maDate(s) - MA_NOW()) / 864e5);
const MA_ALERT = {   // เรื่องที่ควรดู — นับจากยานพาหนะทุกคัน (ไม่ขึ้นกับตัวกรอง) · กดแล้วกรองทั้งหน้าตามเรื่องนั้น
  over: maIdx(r => maState(r) === 'over'),
  oil30: maIdx(r => { const d = maOilDue(r); return d && maDays(d[0]) >= 0 && maDays(d[0]) <= 30; }),
  fail: maIdx(r => r[6] === 'ไม่ผ่าน'),
  none: maIdx(r => !r[1])
};
const maPlates = (ix) => ix.map(i => TRIP_CARS[MA_ROWS[i][0]][0]).join(' · ');
function maStats(ix) {
  const R = ix.map(i => MA_ROWS[i]), n = (fn) => R.filter(fn).length;
  return { total: R.length, doneYear: n(r => r[1] && maD(r[1])[2] === MA_TODAY[2]), near: n(r => maState(r) === 'near'), over: n(r => maState(r) === 'over'),
    oilYear: n(r => r[1] && maD(maOilDue(r)[0])[2] <= MA_TODAY[2]), age: R.length ? (ix.reduce((a, i) => a + maAge(i), 0) / R.length).toFixed(1) : '-' };
}
async function maList(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'ข้อมูลยานพาหนะ', root: 'ยานพาหนะ' });
  const W = dashW(scr), all = MA_ROWS.map((r, i) => i), ix = o.chips && o.rows ? o.rows : all, R = ix.map(i => MA_ROWS[i]), st = maStats(ix);
  add(page, await maTabs(), 'h');
  add(page, await dashHead({ title: 'แดชบอร์ดการบำรุงรักษา', icon: 'car_repair-24-300-round',
    desc: 'ยานพาหนะที่ติดตั้งเครื่องมือกล แยกตามสังกัด ประเภท และกำหนดบำรุงรักษาครั้งถัดไป — คลิกกราฟหรือรายการเพื่อกรองทั้งหน้า' }), 'h');
  const al = await dashAlerts([
    { key: 'over', n: MA_ALERT.over.length, icon: 'event_busy-24-300-round', title: 'เลยกำหนดบำรุงรักษา ' + MA_ALERT.over.length + ' คัน', sub: maPlates(MA_ALERT.over) + ' — ครั้งถัดไปเลยวันครบกำหนดแล้ว ควรจัดเข้าแผนไตรมาสถัดไป' },
    { key: 'oil30', n: MA_ALERT.oil30.length, icon: 'calendar_month-24-300-round', title: 'ครบกำหนดเปลี่ยนน้ำมันไฮดรอลิกภายใน 30 วัน ' + MA_ALERT.oil30.length + ' คัน', sub: maPlates(MA_ALERT.oil30) + ' — ครบรอบ 3 ปีหลังเปลี่ยนครั้งล่าสุด' },
    { key: 'fail', n: MA_ALERT.fail.length, icon: 'search_check-24-300-round', title: 'ผลตรวจน้ำมันล่าสุดไม่ผ่าน ' + MA_ALERT.fail.length + ' คัน', sub: maPlates(MA_ALERT.fail) + ' — ผลตรวจตัวอย่างน้ำมันไฮดรอลิกครั้งล่าสุดไม่ผ่าน ควรเปลี่ยนก่อนครบรอบ' },
    { key: 'none', tone: 'info', n: MA_ALERT.none.length, icon: 'description-24-300-round', title: 'ยังไม่มีข้อมูลบำรุงรักษาล่าสุด ' + MA_ALERT.none.length + ' คัน', sub: maPlates(MA_ALERT.none) + ' — ยังไม่มีงานบำรุงรักษาที่ปิดในระบบ คำนวณครั้งถัดไปไม่ได้' }], o.alert);
  if (al) add(page, al, 'h');
  const ch = await dashChips(o.chips); if (ch) add(page, ch, 'h');
  add(page, await dashKpis([
    { label: 'ยานพาหนะทั้งหมด', value: st.total, unit: 'คัน', sub: o.chips ? 'ตามตัวกรองที่เลือก' : 'ทุกสังกัด', tone: 'brand', icon: 'car_repair-24-300-round' },
    { label: 'บำรุงรักษาแล้วในปี ' + MA_TODAY[2], value: st.doneYear, unit: 'คัน', sub: dPct(st.doneYear, st.total) + ' ของทั้งหมด', tone: 'success', icon: 'check-24-300-round' },
    { label: 'ใกล้ครบกำหนด', value: st.near, unit: 'คัน', sub: 'เหลือไม่เกิน ' + MA_NEAR + ' เดือน', tone: 'warning', icon: 'calendar_month-24-300-round' },
    { label: 'เลยกำหนด', value: st.over, unit: 'คัน', sub: 'ครั้งถัดไปเลยวันครบกำหนด', tone: 'error', icon: 'event_busy-24-300-round' },
    { label: 'ครบเปลี่ยนน้ำมันไฮดรอลิกในปีนี้', value: st.oilYear, unit: 'คัน', sub: 'ภายในปี ' + MA_TODAY[2] + ' รวมที่เลยกำหนด', tone: 'info', icon: 'search_check-24-300-round' },
    { label: 'อายุการใช้งานเฉลี่ย', value: st.age, unit: 'ปี', sub: 'นับจากปีที่จดทะเบียน', tone: 'gray', icon: 'no_crash-24-300-round' }]), 'h');
  /* กราฟ 6 ใบ (คิดจากยานพาหนะตามตัวกรอง) — มือถือ: จอมุมมองมือถือแสดงครบ · จออื่นแสดงเฉพาะกราฟที่กด */
  const count = (keyOf) => { const m = new Map(); R.forEach(r => { const k = keyOf(r); m.set(k, (m.get(k) || 0) + 1); }); return [...m].sort((a, b) => b[1] - a[1]); };
  const dueN = (keyOf, k) => R.filter(r => keyOf(r) === k && /near|over/.test(maState(r))).length;
  const t0 = MA_TODAY[2] * 12 + MA_TODAY[1] - 1, mIdx = (s) => { const [, m, y] = maD(s); return y * 12 + m - 1 - t0; };
  const months = [...Array(12)].map((_, i) => { const k = t0 + i; return { label: TH_MON[k % 12] + ' ' + String(Math.floor(k / 12)).slice(2), vals: [0, 0] }; });
  let past = 0;
  R.filter(r => r[1]).forEach(r => { const d = maDues(r); [[d[0], 0], [d[2], 1]].forEach(([x, s]) => { const k = mIdx(x[0]); if (k < 0) past++; else if (k < 12) months[k].vals[s]++; }); });
  const specs = [
    { key: 'unit', span: 2, title: 'ยานพาหนะตามสังกัด', sub: 'แยกตามหน่วยงานเจ้าของยานพาหนะ (ทั้งหมด ' + st.total + ' คัน)', icon: 'groups-24-300-round', toggle: [['หน่วยงาน', 'เขต'], 0], src: 'ข้อมูลจากทะเบียนยานพาหนะ',
      build: async (w) => [await hBars(w, count(maUnit).map(([k, v]) => ({ label: k, value: v, unit: 'คัน', sub: dueN(maUnit, k) ? 'ใกล้ครบหรือเลยกำหนด ' + dueN(maUnit, k) + ' คัน' : '' })))] },
    { key: 'status', span: 1, title: 'สถานะกำหนดบำรุงรักษา', sub: 'ตามครั้งถัดไปของแต่ละคัน', icon: 'event_busy-24-300-round', color: 'Warning', src: 'ข้อมูลจากงานบำรุงรักษาที่ปิดแล้ว',
      build: async (w) => donut(w, Object.keys(MA_STATE).map(k => ({ label: MA_STATE[k][0], tone: MA_STATE[k][1], value: R.filter(r => maState(r) === k).length })), { unit: 'คัน', heads: ['สถานะ', 'จำนวน (คัน)'] }) },
    { key: 'month', span: 2, title: 'กำหนดบำรุงรักษา 12 เดือนข้างหน้า', sub: 'จำนวนรายการที่ครบกำหนดในแต่ละเดือน' + (past ? ' · ไม่รวมที่เลยกำหนดแล้ว ' + past + ' รายการ' : ''), icon: 'calendar_month-24-300-round', src: 'ข้อมูลจากเกณฑ์ครั้งถัดไป (รอบบำรุงรักษา 12 เดือน · เปลี่ยนน้ำมันทุก 3 ปี)',
      build: async (w) => vBars(w, months, [{ label: 'บำรุงรักษาตามวาระ', tone: 'brand' }, { label: 'เปลี่ยนน้ำมันไฮดรอลิก', tone: 'info' }]) },
    { key: 'oil', span: 1, title: 'ผลตรวจน้ำมันล่าสุด', sub: 'ผลตรวจตัวอย่างน้ำมันไฮดรอลิกครั้งล่าสุด', icon: 'search_check-24-300-round', color: 'Info', src: 'ข้อมูลจากผลตรวจน้ำมัน',
      build: async (w) => donut(w, MA_OILRES.map(([l, k]) => ({ label: l, tone: k, value: R.filter(r => (r[6] || 'ยังไม่ตรวจ') === l).length })), { unit: 'คัน', heads: ['ผลตรวจ', 'จำนวน (คัน)'] }) },
    { key: 'age', span: 2, title: 'อายุการใช้งานของยานพาหนะ', sub: 'แบ่งกลุ่มตามอายุนับจากปีที่จดทะเบียน', icon: 'no_crash-24-300-round', color: 'Gray', src: 'ข้อมูลจากทะเบียนยานพาหนะ',
      build: async (w) => { const g = MA_AGE_GROUPS.map(([l, a, b]) => ({ label: l, value: ix.filter(i => maAge(i) >= a && maAge(i) <= b).length }));
        return (await vBars(w, g.map(x => ({ label: x.label, vals: [x.value] })), [{ label: 'ยานพาหนะ', tone: 'info' }], { h: 140 })).concat([await dLegend(g, ['กลุ่มอายุ', 'จำนวน (คัน)'], { total: true })]); } },
    { key: 'type', span: 1, title: 'ตามประเภทยานพาหนะ', sub: VTYPES.length + ' ประเภท', icon: 'car_repair-24-300-round', color: 'Success', src: 'ข้อมูลจากทะเบียนยานพาหนะ',
      build: async (w) => [await hBars(w, count(r => typeOf(TRIP_CARS[r[0]])).map(([k, v]) => ({ label: k, value: v, unit: 'คัน' })))] }];
  add(page, await chartGrid(W, MOB && !o.mobileAll ? specs.filter(s => s.key === o.pickChart) : specs), 'h');
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tableHeader({ placeholder: 'เลขทะเบียน, ยี่ห้อ, รุ่น', query: o.query, chips: o.chips, filterCount: (o.chips || []).length || null, more: [{ text: 'ส่งออก', icon: 'download-24-300-round' }] }), 'h');
  const rows = (o.rows || all).map(i => maRow(MA_ROWS[i]));
  add(sec, rows.length ? await tblShort(sortAll(MA_COLS), rows, { pagination: rows.length }) : await searchNotFound(), 'h');
  add(page, await dashNote('ข้อมูลจากงานบำรุงรักษาที่ปิดแล้วและผลตรวจน้ำมันล่าสุดของยานพาหนะทุกคัน ณ ' + dashAsof().slice(9) + ' · ใกล้ครบกำหนด = เหลือไม่เกิน ' + MA_NEAR + ' เดือน · ตัวเลขทุกส่วนคำนวณตามตัวกรองที่เลือก'), 'h');
  await bindDash();
  if (o.filter) {
    const f = o.filter;
    await filterPanel(scr, [multiDropdown('ประเภทยานพาหนะ', f.types || [], { placeholder: 'ทั้งหมด', optional: true }), multiDropdown('สังกัดยานพาหนะ', f.units || [], { placeholder: 'ทั้งหมด', optional: true }),
      dropdown('บำรุงรักษาล่าสุด', f.last || 'ทั้งหมด'), dropdown('ครบกำหนดภายใน', f.within || 'ทั้งหมด'),
      multiDropdown('รายการที่ครบกำหนด', f.items || [], { placeholder: 'ทั้งหมด', optional: true }), dropdown('ผลตรวจน้ำมันล่าสุด', f.oil || 'ทั้งหมด')]);
  }
  return scr;
}
const MA_LAST_OPTS = ['ทั้งหมด', 'ภายใน 6 เดือน', '6 ถึง 12 เดือนที่แล้ว', 'เกิน 12 เดือน', 'ยังไม่เคยบำรุงรักษา'];   // ตัวเลือกช่อง "บำรุงรักษาล่าสุด" (เสนอ)
const MA_WITHIN_OPTS = ['ทั้งหมด', 'เลยกำหนดแล้ว', 'ภายใน 1 เดือน', 'ภายใน 3 เดือน', 'ภายใน 6 เดือน'];
/* หน้ารายละเอียดยานพาหนะ 5 แท็บ (10 พ.ย. 2569 · R90) ปรับ 12 พ.ย. 2569 ตามต้นแบบเว็บที่เจ้าของงานรีวิวแล้ว (maintenance-utility-vehicle f6f5e0d · BACKLOG ข้อ 83 84 85 · R107 §5.45)
   เจ้าของงาน 12 พ.ย. 2569 _"tab นี้ มีเพิ่ม โดยแบ่ง ประวัติการบำรุงรักษาเครื่องจักร ประวัติการบำรุงรักษาเครื่องยนต์ ประวัติการซ่อมบำรุงจะแสดงทั้งการซ่อมและบำรุง ตัดtab การรับประกัน
   เดี๋ยวจะเอาข้อมูลไปใส่ในข้อมูลรถ และ tab overhaul ก็เอาออก ให้เป็นส่วนหนึ่งของประวัติการซ่อมบำรุง โดยมีแทกว่าเป็นการ overhaul ถ้าการซ่อมนั้นผ่านการ overhaul มา"_
   ⇒ Tabs 5 ช่อง ข้อมูลยานพาหนะ · ตารางบำรุงรักษา · ประวัติการบำรุงรักษาเครื่องจักร · ประวัติการบำรุงรักษาเครื่องยนต์ · ประวัติการซ่อมบำรุง (ไม่มีแท็บการรับประกัน · Overhaul)
   ตาม `Tabs` `Tab item` ของไฟล์ Component + เฟรม "Vehicle info" (Vehicle detail) หน้า 5.2 Vehicle Management ของ UI Release#2 · ดูอย่างเดียว ยกเว้นเครื่องมือกลของ กบค. */
const MA_CAR = 5;   // แถวใน MA_ROWS = 82-1145 (TRIP_CARS[1]) ใกล้ครบรอบเปลี่ยนน้ำมันไฮดรอลิก
const MA_VTABS = ['ข้อมูลยานพาหนะ', 'ตารางบำรุงรักษา', 'ประวัติการบำรุงรักษาเครื่องจักร', 'ประวัติการบำรุงรักษาเครื่องยนต์', 'ประวัติการซ่อมบำรุง'];   // = TAB_TITLES ของเว็บ (_lib/tabs.ts)
const MA_NEXT_COLS = [['รายการ', 0, 'Lead text'], ['ครั้งล่าสุด', 220], ['รอบ', 220], ['ครบกำหนด', 320]];
const maNextRows = (r) => { const d = maDues(r), last = [r[1], r[3], r[4], maKey(r[5]) > maKey(r[4]) ? r[5] + ' · ผล ' + r[6] : r[4], r[7]];
  return MA_ITEMS.map((t, i) => [t, last[i], MA_CYCLE[i], d[i] ? Object.assign({ text: d[i][0] }, toneOf(d[i][1])) : { text: 'ปีนี้ครบรอบเปลี่ยนน้ำมัน ไม่ต้องเก็บตัวอย่าง' }]); };
const MA_HIST_COLS = [['วันที่ปิดงาน', 130, 'Lead text'], ['เลขที่ MR', 140], ['งานที่ทำ', 0], ['ไส้กรองอากาศ', 130], ['น้ำมันไฮดรอลิก', 180], ['การตรวจ ปจ.2', 150], ['ผู้ดำเนินการ', 170], ['', 64]];   // = MA_HIST_COLS ของเว็บ (vehicles/detail/page.tsx · คอลัมน์ "การตรวจ ปจ.2" 11 พ.ย. 2569)
const MA_HIST = [['18/06/2569', 'MRZ6900014', 'เปลี่ยนไส้กรองไฮดรอลิก · ไส้กรองอากาศ', 'เปลี่ยน', { text: 'เก็บตัวอย่าง', sub: 'ผลตรวจ ผ่าน' }, 'บันทึกเอกสารแล้ว', TRIP.staff[0]],
  ['20/06/2568', 'MRZ6800007', 'เปลี่ยนไส้กรองไฮดรอลิก · ไส้กรองอากาศ', 'เปลี่ยน', { text: 'เก็บตัวอย่าง', sub: 'ผลตรวจ ผ่าน' }, 'บันทึกเอกสารแล้ว', TRIP.staff[2]],
  ['12/03/2567', 'MRZ6700004', 'เปลี่ยนน้ำมันไฮดรอลิก · ไส้กรอง', 'เปลี่ยน', { text: 'เปลี่ยนน้ำมัน' }, 'บันทึกเอกสารแล้ว', TRIP.staff[1]]].map(r => r.concat([{ menu: 1, items: MENU.slice(0, 1) }]));
const MA_WAR = { in: ['อยู่ในประกัน', 'Success'], near: ['ใกล้หมดประกัน', 'Warning'], out: ['หมดประกัน', 'Gray'], none: ['ไม่มีประกัน', 'Gray'] };
/* งานซ่อมของ 82-1145 (แบบ VEH_HISTORY ของปลั๊กอิน Overhaul) — [หมายเลขงาน, วันที่ปิดงาน, ศูนย์บริการ, ประเภท, บรรทัดรองประเภท, อาการ, รายละเอียด, ประกัน, ค่าซ่อม] · ชุดเดียวกับ MA_REPAIRS ของเว็บ
   แถวบำรุงรักษา MA-2569-0102 ซ้ำกับบันทึก 18/06/2569 ⇒ ประวัติการซ่อมบำรุงใช้บันทึก (MA_HIST) แทน แบบเว็บ (machineHistoryOf) */
const MA_REPAIRS = [['RP-2569-0611', '02/09/2569', 'อู่ ศรีเมืองการช่าง', 'รถเสีย', '', 'บูมยกช้า', 'เปลี่ยนปั๊มไฮดรอลิก', 'in', '28,400'],
  ['MA-2569-0102', '18/06/2569', 'กบผ.', 'บำรุงรักษา', 'ตามวาระ MRZ6900014', 'ตรวจตามรอบ', 'เปลี่ยนไส้กรองไฮดรอลิก · ไส้กรองอากาศ', 'none', '-'],
  ['PO-680412', '15/12/2568', 'บริษัท สยามไฮดรอลิก จำกัด', 'Overhaul', 'แผน ORZ6800003', 'ยกเครื่องตามแผน', 'ไฮดรอลิกกระเช้า · เครื่องยนต์', 'in', '-'],
  ['RP-2568-0877', '03/08/2568', 'กรย. ภาค 1', 'อุบัติเหตุ', '', 'กันชนหน้าบุบ', 'เปลี่ยนกันชนหน้า', 'out', '6,500']];
/* การรับประกัน — รวมทุกงานที่มีประกันของผู้รับจ้าง (ซ่อม · Overhaul R28 90/180/360/720 วัน · บำรุงรักษาแผนจ้าง) · 12 พ.ย. 2569 ย้ายจากแท็บการรับประกันมาเป็นส่วนท้ายแท็บข้อมูลยานพาหนะ (มีเฉพาะ 82-1145 แบบ warrantyOf ของเว็บ) */
const MA_WAR_COLS = [['ประเภทงาน', 140, 'Lead text'], ['เลขที่งาน / PO', 150], ['ผู้รับจ้าง', 0], ['รายการที่รับประกัน', 220], ['วันเริ่ม', 120], ['วันหมดอายุ', 170], ['สถานะ', 150, 'Badge']];
const MA_WARRANTY = [['ซ่อม', 'RP-2569-0611', 'อู่ ศรีเมืองการช่าง', 'ปั๊มไฮดรอลิก', '02/09/2569', { text: '01/03/2570', sub: 'เหลือ 111 วัน' }, { pill: MA_WAR.in }],
  ['Overhaul', 'PO-680412', 'บริษัท สยามไฮดรอลิก จำกัด', 'ไฮดรอลิกกระเช้า · เครื่องยนต์', '15/12/2568', { text: '10/12/2569', sub: 'เหลือ 30 วัน' }, { pill: MA_WAR.near }],
  ['ซ่อม', 'RP-2568-0877', 'กรย. ภาค 1', 'กันชนหน้า', '03/08/2568', { text: '01/11/2568' }, { pill: MA_WAR.out }]];

/* ---------- แท็บข้อมูลยานพาหนะแบบ Vehicle info ของ VMS+ (เจ้าของงาน 12 พ.ย. 2569 _"หน้าข้อมูลยานพาหนะ อยากให้อ่าน vehicle-management component แล้วเอามาแสดง"_ · R107) ----------
   ค่าทุกช่องคิดแบบเดียวกับ vehicleInfoOf() ของเว็บ (src/lib/mock/vehicleInfo.ts) จากข้อมูลเดิมของปลั๊กอิน (TRIP_CARS · MA_USE · CTRL_NAME · OWNER_PH) ⇒ ทะเบียนเดียวกันได้ค่าเท่ากับเว็บ
   ค่าที่ข้อมูลจำลองไม่มี = ค่าสมมติคำนวณจากเลขทะเบียน (เลขสัญญา ศูนย์ต้นทุน เลขตัวยานพาหนะ บัตรเติมน้ำมัน ฯลฯ) · ข้อมูลจาก API ของ VMS+ คงคำว่า "รถ" (R80 allow) */
const VI_CHASSIS = {   // สเปกแชสซีตามรุ่น (ค่าสมมติ · CHASSIS ของเว็บ) — [แรงม้า, เพลา, ล้อ, ยาง, ราคา, ขึ้นต้นเลขตัว, ขึ้นต้นเลขเครื่องยนต์]
  'Isuzu FRR': [190, 2, 6, 6, 2850000, 'MP1FRR34', '4HK1-'], 'Isuzu FTR': [240, 2, 6, 6, 3450000, 'MP1FTR34', '6HK1-'],
  'Hino FC': [175, 2, 6, 6, 3200000, 'JHHFC9JL', 'J05E-'], 'Hino FG': [230, 2, 6, 6, 3900000, 'JHHFG8JL', 'J08E-'], 'Hino FM': [260, 3, 10, 10, 4600000, 'JHHFM2PL', 'J08E-'] };
const viPad = (n, w) => String(n).padStart(w, '0');
const viId = (plate) => plate.split(' ')[0];
const viDigits = (plate) => viId(plate).replace(/\D/g, '').padStart(6, '0').slice(-6);   // ชุดเดียวกับรหัสทรัพย์สิน 500000 + 6 หลัก
const viNum = (n) => n.toLocaleString('en-US');
/* รหัสข้างยานพาหนะ (sideCodeOf ของเว็บ · vehicleTypes.ts) — 81-2210 = 04 (ในกลุ่ม ยังไม่มีเครื่องมือกล) · 80-4458 = 06 (นอกกลุ่ม) · กระเช้าอื่น = 09
   กลุ่มที่มีส่วนเครื่องมือกล 04 07 08 09 10 (เจ้าของงาน "กลุ่มรหัสข้างรถ เลข 04, 07, 08, 09, 10 จะสามารถเพิ่มเครื่องมือกลได้ ถ้ามีข้อมูลต้องสามารถแก้ไขได้" · BACKLOG ข้อ 68ก) */
const VI_SIDE = { '81-2210': '04', '80-4458': '06' }, VI_EQUIP = ['04', '07', '08', '09', '10'], VI_PREFILL = ['09', '08', '10'];
const viSide = (c) => VI_SIDE[viId(c[0])] || (/กระเช้า/.test(c[1]) ? '09' : '06');
const viMachine = (model) => { const [vehicle, rest] = model.split(' + '); const m = rest && rest.match(/^\S*[฀-๿]\S*\s+([A-Za-z][\w.-]*)\s+(.+)$/); return { vehicle, brand: m ? m[1] : '-', model: m ? m[2] : (rest || '-') }; };
const viMonths = (k) => { const t = (MA_TODAY[2] - 543) * 12 + MA_TODAY[1] - 1 + k; return viPad(MA_TODAY[0], 2) + '/' + viPad(t % 12 + 1, 2) + '/' + (Math.floor(t / 12) + 543); };   // addMonths(TODAY, k) ของเว็บ
function vInfo(row) {
  const c = TRIP_CARS[MA_ROWS[row][0]], u = MA_USE[row], d = viDigits(c[0]), n = Number(d), year = u[0];
  const spec = VI_CHASSIS[viMachine(c[1]).vehicle] || [180, 2, 6, 6, 3000000, 'MP1XXX34', 'ENG-'];
  const [brand, ...rest] = c[1].split(' '), dist = c[2].split(' ')[0], prefix = dist.indexOf('กฟ') === 0 ? dist.slice(2) : dist;
  const reg = /^[นฉกต]\./.test(prefix) ? { น: 'N', ฉ: 'E', ก: 'C', ต: 'S' }[prefix[0]] : 'A', regNo = Number(prefix.replace(/\D/g, '')) || 0;
  const type = typeOf(c), water = /ฉีดน้ำ/.test(c[1]);
  return { c, d, n, type, side: viSide(c), vstat: MA_VSTAT[u[4]],
    general: [[['หมวดหมู่ยานพาหนะหลัก', 'รถบรรทุกขนาดใหญ่'], ['หมวดหมู่ยานพาหนะย่อย', water ? 'รถพ่วงฉีดน้ำ' : 'รถกระเช้า']], [['ประเภทยานพาหนะหลัก', type], ['ประเภทยานพาหนะย่อย', type]],
      [['ลักษณะการใช้งาน', 'รถส่วนกลาง'], ['ประเภทเกียร์', 'ธรรมดา']], [['หมายเหตุ', '-']]],
    finance: [[['เลขที่สัญญา', 'สญ2-จซ-' + viPad(1 + (n % 200), 3) + '-' + (year - 1)]], [['งวดที่ส่งมอบ', 'งวดที่ ' + (1 + (n % 3))]], [['มูลค่ายานพาหนะ', viNum(spec[4]) + '.00']]].map(items => ({ items, half: true })),
    dept: [[['สังกัดยานพาหนะ', c[2]], ['รหัสข้างยานพาหนะ', prefix + '-' + viSide(c) + '-' + d.slice(-4)]], [['ผู้ดูแลยานพาหนะ', CTRL_NAME[MA_ROWS[row][0]]], ['เบอร์ติดต่อ', OWNER_PH[MA_ROWS[row][0]]]],
      [['ศูนย์ต้นทุน', 'Z' + reg + viPad(regNo, 2) + '010100 : ' + dist + '-บห.'], ['รหัสประเภทธุรกิจ (BA)', reg + viPad(regNo, 2) + '0']], [['รหัสทรัพย์สิน', '500000' + d], ['วันที่ได้รับยานพาหนะ', viPad(1 + (n % 28), 2) + '/' + viPad(1 + (n % 12), 2) + '/' + year]],
      [['ประเภททรัพย์สิน', 'Z6020 : ยานพาหนะ'], ['ประเภทย่อยทรัพย์สิน', '602004 : ' + type + ' - ซื้อ']], [['ใช้งานอยู่ในกลุ่มยานพาหนะ', 'ไม่ใช่'], ['หน่วยงานอื่นสามารถขอใช้งานได้', 'ไม่ได้']]].map(items => ({ items })),
    reg: [{ half: true, items: [['ประเภทยานพาหนะ', 'รถยนต์บรรทุกส่วนบุคคล (รย.3)']] }, { items: [['ยี่ห้อยานพาหนะ', brand], ['แบบ / รุ่น', rest.join(' ')], ['รุ่นปี ค.ศ.', String(year - 543)], ['สี', 'ขาว']] },
      { items: [['เลขตัวยานพาหนะ', spec[5] + 'H' + viPad(n % 10000000, 7)], ['ตำแหน่งเลขตัวยานพาหนะ', 'โครงคัสซีด้านหน้าขวา']] }, { items: [['เลขเครื่องยนต์', spec[6] + viPad((n * 7) % 1000000, 6)], ['ตำแหน่งเลขเครื่องยนต์', 'ข้างเสื้อสูบด้านซ้าย']] },
      { half: true, items: [['ประเภทเชื้อเพลิง', 'ดีเซล']] }, { items: [['ขนาดแรงม้า', String(spec[0])], ['จำนวนเพลา', String(spec[1])], ['จำนวนล้อ', String(spec[2])], ['จำนวนยาง', String(spec[3])]] },
      { items: [['ปีที่จดทะเบียน', String(year)], ['อายุการใช้งาน', (MA_TODAY[2] - year) + ' ปี']] }],   // ปีที่จดทะเบียน · อายุการใช้งาน = ของเรา (VMS+ ไม่มีช่องนี้)
    file: ['เล่มทะเบียน_' + viId(c[0]) + '.pdf', (160 + (n % 120)) + ' KB'],
    fleet: { number: '4030 5263 ' + d.slice(-4) + ' ' + viPad((n * 7) % 10000, 4), dates: 'ใช้ได้ตั้งแต่ 01/10/2567 | ใช้ได้ถึง 30/09/2572', bank: 'KTB', limit: 'วงเงินบัตร 60,000.00' },
    usage: [['swap_driving_apps_wheel-24-300-round', 'เลขไมล์', u[1] + ' กม.'], ['schedule-24-300-round', 'ชั่วโมงเครื่องจักรสะสม', u[2] + ' ชม.'],   // ชั่วโมงเครื่องจักรสะสม = ของเรา (VMS+ ไม่มีแถวนี้)
      ['local_gas_station-24-300-round-filled', 'ปริมาณเชื้อเพลิง', (40 + (n % 60)) + '%'], ['local_car_wash-24-300-round', 'ความสะอาด', ['ดูดฝุ่น', 'ล้างภายนอก', 'ล้างภายนอกและดูดฝุ่น'][n % 3]],
      ['local_parking-24-fill-300-round', 'สถานที่จอดยานพาหนะ', 'ลานจอด สำนักงาน ' + c[2]]] };
}
/* เครื่องมือกล (machines.ts ของเว็บ · BACKLOG ข้อ 68 72 73 84) — ค่าตั้งต้น 1 เครื่องจาก ยี่ห้อ/รุ่น ของยานพาหนะ เฉพาะรหัสข้าง 09 08 10 (04 07 เริ่มว่าง) · ชั่วโมงตาม CAND ของเว็บ (ค่าสมมติ) */
const VI_HOURS = { '80-5738': [7280, 3440], '80-3316': [3085, 2155], '80-9981': [2291, 1733], '82-7720': [2688, 1944], '82-1145': [2397, 1011], '81-6604': [3482, 2366], '82-6789': [2000, 800] };
const VI_NO_LIFT = ['ถังฉีดน้ำ', 'อื่นๆ'];
function vMachines(v) {
  if (VI_EQUIP.indexOf(v.side) < 0 || VI_PREFILL.indexOf(v.side) < 0) return [];
  const m = viMachine(v.c[1]), type = /ถังฉีดน้ำ/.test(v.c[1]) ? 'ถังฉีดน้ำ' : /เครน/.test(v.c[1]) ? 'เครน' : /กระเช้า/.test(v.c[1]) ? 'กระเช้า' : 'อื่นๆ', h = VI_HOURS[viId(v.c[0])] || [2000, 800];
  return [{ type, brand: m.brand === '-' ? '' : m.brand, model: m.model === '-' ? '' : m.model, asset: '500000' + v.d, sub: '0001',
    lift: VI_NO_LIFT.indexOf(type) >= 0 ? null : /Tadano/.test(v.c[1]) ? 300 : 200, hc: type === 'กระเช้า' || type === 'เครน' ? 'HC - ' + v.d.slice(-4) : '', engineHours: h[0], machineHours: h[1] }];
}
/* ประวัติการบำรุงรักษาเครื่องยนต์ (engineHistoryOf ของเว็บ · เช็คระยะแชสซีที่ศูนย์บริการยี่ห้อ ค่าสมมติ) — ทุก 6 เดือนย้อนจากวันนี้ · จำนวนครั้ง = อายุการใช้งาน (สูงสุด 4) */
const VI_ENGINE_WORK = ['เปลี่ยนน้ำมันเครื่อง · ไส้กรองน้ำมันเครื่อง', 'เปลี่ยนน้ำมันเครื่อง · ไส้กรองน้ำมันเครื่อง · ไส้กรองน้ำมันเชื้อเพลิง'];
function vEngine(row) {
  const v = vInfo(row), year = MA_USE[row][0], km = Number(MA_USE[row][1].replace(/,/g, '')), count = Math.max(1, Math.min(4, MA_TODAY[2] - year));
  return Array.from({ length: count }, (_, i) => { const date = viMonths(-(1 + (v.n % 4)) - 6 * i);
    return { no: 'EG-' + date.slice(6) + '-' + viPad((v.n + i * 37) % 10000, 4), date, center: 'ศูนย์บริการ ' + v.c[1].split(' ')[0] + ' ' + v.c[0].split(' ').slice(1).join(' '),
      work: VI_ENGINE_WORK[i % 2], km: viNum(Math.max(0, km - 2000 - (v.n % 3000) - i * 10000)), cost: viNum(i % 2 ? 6850 : 4200) }; });
}
const VI_ENGINE_COLS = [['วันที่ปิดงาน', 130, 'Lead text'], ['เลขที่งาน', 150], ['ศูนย์บริการ', 220], ['งานที่ทำ', 0], ['เลขไมล์ (กม.)', 130], ['ค่าใช้จ่าย (บาท)', 140]];
/* ประวัติการซ่อมบำรุง (serviceHistoryOf ของเว็บ) = งานซ่อม + Overhaul + บันทึกบำรุงรักษาเครื่องจักร (MA_HIST) + บำรุงรักษาเครื่องยนต์ เรียงวันที่ปิดงานใหม่สุดก่อน
   คอลัมน์ "ประเภท" Pill outline บำรุงรักษา (Brand) / ซ่อม (Warning) + Pill "Overhaul" (Purple) ต่อท้ายเมื่องานมาจาก Overhaul (Table cell Style=Multiple badges) */
const MA_KIND = { ma: ['บำรุงรักษา', 'Brand'], repair: ['ซ่อม', 'Warning'], overhaul: ['Overhaul', 'Purple'] };
const MA_REPAIR_COLS = [['หมายเลขงาน', 160, 'Lead text'], ['วันที่ปิดงาน', 130], ['ประเภท', 140, 'Badge'], ['ศูนย์บริการ', 170], ['อาการ / รายละเอียด', 0], ['การรับประกัน', 150, 'Badge'], ['ค่าซ่อม (บาท)', 120], ['', 64]];
function vService(row) {
  const rec = MA_REPAIRS.filter(h => h[3] !== 'บำรุงรักษา').map(h => ({ kind: h[3] === 'Overhaul' ? 'overhaul' : 'repair', no: h[0], sub: h[4] || h[3], date: h[1], center: h[2], text: h[5], detail: h[6], war: h[7], cost: h[8] }))
    .concat(MA_HIST.map(h => ({ kind: 'ma', no: h[1], date: h[0], center: UNITS[0], text: 'ตรวจตามรอบ', detail: h[2], war: 'none', cost: '-' })),
      vEngine(row).map(e => ({ kind: 'ma', no: e.no, sub: 'บำรุงรักษาเครื่องยนต์', date: e.date, center: e.center, text: 'เช็คระยะตามเลขไมล์ ' + e.km + ' กม.', detail: e.work, war: 'none', cost: e.cost })));
  rec.sort((a, b) => maKey(b.date) - maKey(a.date));
  return rec.map(h => [h.sub ? { text: h.no, sub: h.sub } : h.no, h.date, { pills: h.kind === 'overhaul' ? [MA_KIND.repair, MA_KIND.overhaul] : [MA_KIND[h.kind]] }, h.center,
    h.detail ? { text: h.text, sub: h.detail } : h.text, { pill: MA_WAR[h.war] }, h.cost, { icons: ['quick_reference_all-24-300-round'] }]);
}

/* ---------- ประกอบแท็บข้อมูลยานพาหนะจากชิ้นไลบรารี (Fleet card · Last usage · Vehicle detail เป็น component ของไฟล์ UI Release#2 (remote=false) นำเข้าด้วย key ไม่ได้ ⇒ ประกอบแบบเว็บ COMPOSED.md ศ5) ---------- */
let VI_BORDER;
async function viBorder() {   // เส้นกรอบการ์ด = Color/border/secondary (#EAECF0) ของไลบรารีแบบ Fleet card / Last usage ของ UI Release#2
  if (VI_BORDER === undefined) VI_BORDER = await libVar(/^Color\/border\/secondary$/i);
  let p = { type: 'SOLID', color: rgbOf('#EAECF0') };
  if (VI_BORDER) try { p = figma.variables.setBoundVariableForPaint(p, 'color', VI_BORDER); } catch (e) { /* ใช้ค่าสี */ }
  return p;
}
async function viSubtle(f) {   // พื้นกล่องในการ์ด = Color/surface/secondary-subtle (#F9FAFB) รัศมี 8 (Content ของ Fleet card)
  let p = { type: 'SOLID', color: SURFACE_SUB }; const v = await surfaceVar();
  if (v) try { p = figma.variables.setBoundVariableForPaint(p, 'color', v); } catch (e) { /* ใช้ค่าสี */ }
  f.fills = [p]; f.cornerRadius = 8; return f;
}
async function viCard(name, dir) {   // กรอบการ์ด white ขอบ gray-200 รัศมี 16 ขอบใน 16 ช่องไฟ 16 (Fleet card · Last usage > Card ของเฟรม Vehicle info)
  const f = frame(name, dir || 'VERTICAL', { gap: 16, pad: 16, fill: WHITE });
  f.cornerRadius = 16; f.strokes = [await viBorder()]; f.strokeWeight = 1; f.strokeAlign = 'INSIDE';
  return f;
}
const viSection = (kids) => col('Section', kids, 8);   // Section label → ห่าง 8 → เนื้อหา (ทุกส่วนของเฟรม Vehicle info)
async function viBox(title, rows) {   // กล่องแสดงข้อมูล R12 (Content item row Full / 50% first column · _Content item base Text with label) · มือถือ แถวละ 2
  const box = frame('Content item', 'VERTICAL', { gap: 8 });
  for (const r of rows) for (let i = 0; i < r.items.length; i += MOB ? 2 : 4) {
    const part = r.items.slice(i, i + (MOB ? 2 : 4)), half = part.length === 1 && (MOB || r.half);
    const ci = inst('Content item row', { 'Column width': half ? '50% first column' : 'Full' });
    const bases = ci.findAll(n => n.type === 'INSTANCE' && n.name === '_Content item base');
    bases.forEach((b, j) => { if (j >= part.length) return; setProps(b, { Type: 'Text with label' }); setProps(b, { Label: part[j][0], Text: part[j][1], Supporting: false, 'Leading icon': false }); });
    setProps(ci, { 'Item 2': part.length > 1, 'Item 3': part.length > 2, 'Item 4': part.length > 3 });
    add(box, ci, 'h');
  }
  return viSection([await sectionLabel(title), box]);
}
/* แถวของการ์ด = Card item row Type=1 Row (Item 2 ปิด) · Card item base Type=Text with label · Text ชิดขวา (แบบ Last usage ของ UI Release#2)
   iconName = ไอคอนนำ (ไม่มีในไฟล์นี้ = ไม่มีไอคอน) · value = ข้อความ หรือ { add: true } = ปุ่ม Tertiary brand button "เพิ่ม" (สลับชิ้น Badge outline ของ Type=Text with label and component) */
function viCardRow(iconName, label, value) {
  const r = inst('Card item row', { Type: '1 Row' }, { 'Item 2': false });
  const b = r.children.find(c => c.type === 'INSTANCE' && c.name === 'Card item base');
  if (!b) return r;
  try { b.layoutSizingHorizontal = 'FILL'; } catch (e) { /* ตามขนาดของ component */ }
  const ico = iconName && has(iconName);
  setProps(b, { Type: value && value.add ? 'Text with label and component' : 'Text with label' });
  setProps(b, Object.assign({ Label: label, Text: value && value.add ? '' : value, Supporting: false, 'Leading icon': !!ico }, ico ? { 'Icon swap': icon(iconName) } : {}));
  const own = b.children.find(c => c.type === 'TEXT' && c.name === 'Text'), lab = b.children.find(c => c.type === 'TEXT' && c.name === 'Label');
  if (value && value.add) {
    if (own) own.visible = false;
    if (lab) try { lab.layoutGrow = 1; } catch (e) { /* ตามขนาดของ component */ }
    const slot = b.children.find(c => c.type === 'INSTANCE' && c.name === 'Badge outline');
    if (slot) try {
      slot.swapComponent(main('Tertiary brand button', { State: 'Default' })); slot.name = 'Tertiary brand button';
      setProps(slot, { Text: 'เพิ่ม', 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') });
    } catch (e) { warn('ปุ่มเพิ่มในการ์ดเครื่องมือกล', e); }
  } else if (own) try { own.textAlignHorizontal = 'RIGHT'; } catch (e) { /* ชิดซ้ายตาม component */ }
  return r;
}
/* Section label ที่มีปุ่ม Secondary button (แบบ SectionLabel Actions ของเว็บ) — สลับช่อง Secondary action (Tertiary button) ของ Section label เป็น Secondary button แบบ Table header ของ core */
async function viLabelWithButton(title, label, size) {
  const sl = await sectionLabel(title, { buttons: [{ kind: 'Secondary', text: label, icon: 'add-24-300-round' }] });
  const tb = sl.findAll(n => n.type === 'INSTANCE' && n.name === 'Tertiary button')[0];
  if (tb) try { tb.swapComponent(main('Secondary button', { State: 'Default', Size: size || 'md' })); tb.name = 'Secondary button';
    setProps(tb, { Text: label, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') }); } catch (e) { warn('ปุ่มเพิ่มเครื่องมือกล', e); }
  return sl;
}
/* ส่วนเครื่องมือกล (เจ้าของงาน 12 พ.ย. 2569 _"ส่วน section ของการเพิ่มเครื่องจักร อยากให้เป็น คล้ายๆ การ์ด ในcomponent 1 การ์ด แล้วข้อมูลข้างใน ถ้ามีข้อมูลจาก api ก็แสดง
   ถ้าไม่มี ก็ให้เป็นข้อมูลที่สามารถเพิ่มได้ และที่ แสดง ก็สามารถแก้ไขได้"_) — MachineSection.tsx ของเว็บ
   การ์ด 1 ใบต่อเครื่อง = กรอบแบบ Last usage + Section label (ชื่อ · Supporting text รหัสทรัพย์สิน · Primary action "แก้ไข") + Card item row 11 แถว
   ช่องว่าง: กบค. = ปุ่ม "เพิ่ม" · บทบาทอื่น "-" · พิกัดยกของถังฉีดน้ำ/อื่นๆ = "-" · ยังไม่มีเครื่อง = การ์ดว่างแบบ Fleet card Status=Empty · แก้ได้เฉพาะ กบค. (kbk) */
async function viMachines(v, kbk) {
  const list = vMachines(v);
  const head = kbk && list.length ? await viLabelWithButton('เครื่องมือกล (' + list.length + ')', 'เพิ่มเครื่องมือกล') : await sectionLabel('เครื่องมือกล', { badge: list.length });
  const kids = [head];
  if (!list.length) {
    const card = await viCard('Machine card'), box = await viSubtle(frame('Content', MOB ? 'VERTICAL' : 'HORIZONTAL', { gap: 12, pad: [12, 16] }));
    const sl = await sectionLabel('ไม่มีเครื่องมือกล'); setProps(sl, { Supporting: true, 'Supporting text': 'ยานพาหนะคันนี้ยังไม่มีข้อมูลเครื่องมือกล' });
    add(box, sl, 'h'); box.counterAxisAlignItems = 'CENTER';
    if (kbk) { const b = btn('Secondary button', 'เพิ่มเครื่องมือกล', { icon: 'add-24-300-round', size: 'lg' }); box.appendChild(b); if (MOB) b.layoutSizingHorizontal = 'FILL'; }
    add(card, box, 'h'); kids.push(card);
  }
  for (const x of list) {
    const name = [x.type, x.brand, x.model].filter(Boolean).join(' ');
    const card = await viCard('Machine card');
    const sl = await sectionLabel(name || 'เครื่องมือกล', { buttons: kbk ? [{ kind: 'Primary button', text: 'แก้ไข' }] : [] });
    setProps(sl, { Supporting: true, 'Supporting text': 'รหัสทรัพย์สิน ' + x.asset + ' - ' + x.sub });
    add(card, sl, 'h');
    const fields = [['ประเภทเครื่องมือกล', x.type], ['ยี่ห้อ', x.brand], ['รุ่น', x.model], ['พิกัดยก (กก.)', x.lift != null ? viNum(x.lift) : '', x.lift == null],
      ['รหัสทรัพย์สิน', x.asset], ['รหัสทรัพย์สินย่อย', x.sub], ['ชั่วโมงเครื่องยนต์', viNum(x.engineHours)], ['ชั่วโมงเครื่องจักร', viNum(x.machineHours)],
      ['หมายเลข HC', x.hc], ['หมายเลขประจำเครื่องจักร (Serial No.)', ''], ['หมายเลขเครื่องยนต์ (ส่วนเครื่องจักร)', '']];   // Serial No. · เลขเครื่องยนต์ของเครื่องจักร แมปจากฐานข้อมูลไม่ได้ ค่าตั้งต้นว่าง
    for (const [label, val, na] of fields) add(card, viCardRow(null, label, val ? val : na || !kbk ? '-' : { add: true }), 'h');
    kids.push(card);
  }
  return viSection(kids);
}
/* popup เพิ่ม/แก้ไขเครื่องมือกล (12 พ.ย. 2569 · R107) — MachineModal ของเว็บ (src/app/vehicles/_lib/MachineSection.tsx) ช่อง ป้าย placeholder ข้อความ error ลำดับตรงตัว
   ตาม popupModal() ของปลั๊กอิน (Background overlay + Modal header Alignment=Left หัว + ทะเบียนเป็น Supporting text + Modal footer ยกเลิก / บันทึก · กว้าง 800 แบบ PopupModal width 800 ของเว็บ)
   ไม่ใช้ formModal (Modal Type=Form) เพราะ Card form row ของไลบรารีมีไม่พอ 11 ช่อง และใส่ Input dropdown / ข้อความ error ไม่ได้ · ช่อง = Text input / Input dropdown ของไฟล์ Component
   desktop 2 คอลัมน์ (row ช่องไฟ 24 · แถวห่าง 16 แบบ grid gap-x-6 gap-y-4 ของเว็บ) ลำดับ ประเภทเครื่องมือกล · พิกัดยก (กก.) / ยี่ห้อ · รุ่น / รหัสทรัพย์สิน · รหัสทรัพย์สินย่อย / ชั่วโมงเครื่องยนต์ · ชั่วโมงเครื่องจักร / หมายเลข HC · Serial No. / หมายเลขเครื่องยนต์ (ส่วนเครื่องจักร)
   มือถือ = Bottom sheet (sheet()) ช่องเรียงลง · Bottom sheet header ไม่มี Supporting text ⇒ ทะเบียนเป็นบรรทัดแรกของเนื้อหาแบบเว็บ (Section label ของไลบรารี เพราะห้ามวางข้อความเอง R106)
   o.edit = แก้ไขเครื่องแรกของคันนั้น (ค่าเดิมเป็นค่าตั้งต้น · ตัวเลขไม่มีจุลภาคแบบ toDraft ของเว็บ) · ไม่มี = เพิ่ม (รหัสทรัพย์สินตั้งต้น = ของเครื่องแรก · รหัสย่อยถัดไปที่ยังว่าง)
   o.tried = กดบันทึกแล้ว ⇒ ช่องผิดเป็น State Error + Helper text ตามเงื่อนไขของเว็บ · ผ่าน = toast "บันทึกเครื่องมือกลสำเร็จ" (MC_OK) */
const MC_OK = 'บันทึกเครื่องมือกลสำเร็จ';
async function machineModal(scr, ri, o) {   // ri = แถวใน MA_ROWS (row ชื่อซ้ำกับ row() ของ core)
  o = o || {};
  const v = vInfo(ri), list = vMachines(v), x = o.edit ? list[0] : null;
  const next = String(Math.max(0, ...list.map(m => Number(m.sub) || 0)) + 1).padStart(4, '0');
  const d = x ? { type: x.type, brand: x.brand, model: x.model, asset: x.asset, sub: x.sub, lift: x.lift != null ? String(x.lift) : '', engineHours: String(x.engineHours), machineHours: String(x.machineHours), hc: x.hc || '', serial: '', engineNo: '' }
    : { type: '', brand: '', model: '', asset: list[0] ? list[0].asset : '', sub: next, lift: '', engineHours: '', machineHours: '', hc: '', serial: '', engineNo: '' };
  const needLift = VI_NO_LIFT.indexOf(d.type) < 0, intOk = (s) => /^\d+$/.test(s.replace(/,/g, ''));
  const err = !o.tried ? {} : {
    type: !d.type ? 'กรุณาเลือกประเภทเครื่องมือกล' : '', brand: !d.brand.trim() ? 'กรุณาระบุยี่ห้อ' : '', model: !d.model.trim() ? 'กรุณาระบุรุ่น' : '',
    asset: !/^\d{12}$/.test(d.asset) ? 'กรุณาระบุรหัสทรัพย์สิน 12 หลัก' : '', sub: !/^\d{4}$/.test(d.sub) ? 'กรุณาระบุรหัสทรัพย์สินย่อย 4 หลัก' : '',
    lift: needLift && (!intOk(d.lift) || Number(d.lift.replace(/,/g, '')) <= 0) ? 'กรุณาระบุพิกัดยกเป็นตัวเลขมากกว่า 0' : !needLift && d.lift && !intOk(d.lift) ? 'กรุณาระบุพิกัดยกเป็นตัวเลข' : '',
    engineHours: !intOk(d.engineHours) ? 'กรุณาระบุชั่วโมงเครื่องยนต์เป็นจำนวนเต็มตั้งแต่ 0' : '', machineHours: !intOk(d.machineHours) ? 'กรุณาระบุชั่วโมงเครื่องจักรเป็นจำนวนเต็มตั้งแต่ 0' : '' };
  const f = (k, label, ph, optional) => field(label, d[k], { placeholder: ph, optional: !!optional, error: err[k] || '' });
  const pairs = [[dropdown('ประเภทเครื่องมือกล', d.type, { placeholder: 'เลือกประเภทเครื่องมือกล', error: err.type || '' }), f('lift', 'พิกัดยก (กก.)', 'เช่น 200', !needLift)],
    [f('brand', 'ยี่ห้อ', 'ระบุยี่ห้อ'), f('model', 'รุ่น', 'ระบุรุ่น')], [f('asset', 'รหัสทรัพย์สิน', '12 หลัก'), f('sub', 'รหัสทรัพย์สินย่อย', '4 หลัก เช่น 0001')],
    [f('engineHours', 'ชั่วโมงเครื่องยนต์', 'ชั่วโมง'), f('machineHours', 'ชั่วโมงเครื่องจักร', 'ชั่วโมง')],
    [f('hc', 'หมายเลข HC', 'เช่น HC - 9001', true), f('serial', 'หมายเลขประจำเครื่องจักร (Serial No.)', 'ระบุหมายเลขประจำเครื่องจักร', true)],
    [f('engineNo', 'หมายเลขเครื่องยนต์ (ส่วนเครื่องจักร)', 'ระบุหมายเลขเครื่องยนต์ของเครื่องจักร', true), frame('Spacer', 'VERTICAL')]];
  const grid = col('Content', pairs.map(p => row('Row', p)), 16);
  const title = x ? 'แก้ไขเครื่องมือกล' : 'เพิ่มเครื่องมือกล', plate = v.c[0];
  const r = await popupModal(scr, { title, sub: plate, w: 800, ok: 'บันทึก', body: MOB ? [await sectionLabel(plate), grid] : [grid] });
  if (MOB && r && r.sh && r.sh.height > VH() - 40) {   // 11 ช่องสูงเกินจอ ⇒ แผงสูงสุด VH − 40 เนื้อหาเลื่อนในแผง (แบบ BottomSheet ของเว็บ) ปุ่มท้ายแผงยังเห็น
    try { r.sh.primaryAxisSizingMode = 'FIXED'; r.sh.resize(VW(), VH() - 40); r.body.layoutGrow = 1; r.body.clipsContent = true; r.sh.y = 40; } catch (e) { warn('ความสูงแผงเครื่องมือกลบนมือถือ', e); }
  }
  return r;
}
async function viFleet(f) {   // Fleet card Status=Valid — Images sm 108 + กล่อง gray-50 (Section label เลขบัตร + วันใช้ได้) + Badge outline with indicator "ปกติ" · Badge outline ธนาคาร · วงเงินบัตร (ไม่มีโลโก้ธนาคาร/ปั๊ม — ภาพไม่มีในดัมป์)
  const card = await viCard('Fleet card', 'HORIZONTAL');
  const img = inst('Images', { Size: 'sm', Type: 'Empty' }); img.resize(108, 108); card.appendChild(img);
  const box = await viSubtle(frame('Content', 'VERTICAL', { gap: 8, pad: [12, 16] }));
  const sl = await sectionLabel(f.number); setProps(sl, { Supporting: true, 'Supporting text': f.dates }); add(box, sl, 'h');
  const badges = frame('Badges', 'HORIZONTAL', { gap: 8 });
  badges.appendChild(inst('Badge outline with indicator', { Color: 'Success' }, { Text: 'ปกติ' }));
  [f.bank, f.limit].forEach(t => badges.appendChild(inst('Badge outline', { Color: 'Gray' }, { Text: t })));
  add(box, badges, 'h');
  card.appendChild(box); box.layoutGrow = 1;
  return card;
}
async function viLastUsage(v) {   // Last usage Fuel=true — Card item row 1 แถวต่อรายการ ไอคอนนำ · ข้อความชิดขวา · + ชั่วโมงเครื่องจักรสะสม (ของเรา)
  const card = await viCard('Card');
  v.usage.forEach(([ic, label, val]) => add(card, viCardRow(ic, label, val), 'h'));
  return viSection([await sectionLabel('การใช้งานล่าสุด'), card]);
}
async function viWarranty(v) {   // การรับประกัน (n) ท้ายแท็บ เต็มแถว (เดิมแท็บการรับประกัน) — มีเฉพาะ 82-1145 แบบเว็บ (warrantyOf)
  const rows = viId(v.c[0]) === viId(TRIP_CARS[MA_ROWS[MA_CAR][0]][0]) ? MA_WARRANTY : [];
  let body;
  if (rows.length) body = await tblShort(MA_WAR_COLS, rows, { pagination: rows.length });
  else {
    body = inst('Empty state/Data empty');
    await text(body, 'Text', 'ยังไม่มีงานที่อยู่ในประกัน');
    await text(body, 'Supporting text', 'เมื่อปิดงานซ่อม Overhaul หรือบำรุงรักษาแผนจ้างที่มีประกันของผู้รับจ้าง รายการจะมาอยู่ที่นี่');
    const a = find(body, 'Actions'); if (a) a.visible = false;
  }
  return viSection([await sectionLabel('การรับประกัน', { badge: rows.length }), body]);
}
/* แท็บข้อมูลยานพาหนะ — desktop 2 คอลัมน์ (ซ้าย FILL · ขวา 526 ช่องไฟ 24 ตาม Section ของ Vehicle detail) · มือถือ 1 คอลัมน์ลำดับเดียวกัน (UI Release#2 ไม่มีเฟรม Vehicle info มือถือ)
   ซ้าย ข้อมูลทั่วไป → ข้อมูลการเงินและสัญญา → ข้อมูลสังกัดยานพาหนะ → ข้อมูลการจดทะเบียน → เครื่องมือกล (เฉพาะรหัสข้าง 04 07 08 09 10)
   ขวา รูปยานพาหนะ (Images md) → ใบคู่มือจดทะเบียน (_File upload item base) → บัตรเติมน้ำมัน (Fleet card) → การใช้งานล่าสุด (Last usage) · ใต้ 2 คอลัมน์ การรับประกัน
   ไม่มีปุ่ม แก้ไข ดูรายละเอียด เปลี่ยนเลขทะเบียน เปลี่ยนสังกัด ของ VMS+ (งานผู้ดูแลข้อมูลยานพาหนะ) · ดาวน์โหลดใบคู่มือคงไว้ */
async function vehicleInfoTab(row, kbk) {
  const v = vInfo(row);
  const left = [await viBox('ข้อมูลทั่วไป', v.general.map(items => ({ items }))), await viBox('ข้อมูลการเงินและสัญญา', v.finance), await viBox('ข้อมูลสังกัดยานพาหนะ', v.dept), await viBox('ข้อมูลการจดทะเบียน', v.reg)];
  if (VI_EQUIP.indexOf(v.side) >= 0) left.push(await viMachines(v, kbk));
  const img = inst('Images', { Size: 'md', Type: 'Empty' });
  const file = inst('_File upload item base', { State: 'Completed' }, { 'File name': v.file[0], 'File size': v.file[1], 'Progress bar': false, Actions: true, 'Download action': true, 'Delete action': false });
  const right = [viSection([await sectionLabel('รูปยานพาหนะ'), img]), viSection([await sectionLabel('ใบคู่มือจดทะเบียน'), file]), viSection([await sectionLabel('บัตรเติมน้ำมัน'), await viFleet(v.fleet)]), await viLastUsage(v)];
  const out = col('Vehicle info', [], 24);
  if (MOB) left.concat(right).forEach(k => add(out, k, 'h'));
  else {
    const two = frame('Row', 'HORIZONTAL', { gap: 24 });
    const l = col('Column', left, 24), r = col('Column', right, 24);
    two.appendChild(l); l.layoutGrow = 1; two.appendChild(r); r.counterAxisSizingMode = 'FIXED'; r.resize(526, r.height);
    add(out, two, 'h');
  }
  try { img.layoutSizingHorizontal = 'FILL'; img.resize(img.width, MOB ? 278 : 395); } catch (e) { /* ขนาดตาม component */ }   // สัดส่วน 4:3 แบบเว็บ (526 × 395)
  add(out, await viWarranty(v), 'h');
  return out;
}

async function maShell(name, tab, row) {
  row = row == null ? MA_CAR : row;
  const c = TRIP_CARS[MA_ROWS[row][0]], st = MA_VSTAT[MA_USE[row][4]];
  const { scr, page } = await shell(name, { title: c[0], back: true, root: 'ยานพาหนะ', crumbs: ['ข้อมูลยานพาหนะ', c[0]], badge: st });
  headPill(scr, st);   // Pill outline สถานะยานพาหนะใน Page header แบบ Page header Page=View ของเฟรม Vehicle info
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs(MA_VTABS.map(t => [t, null]), tab), 'h');
  return { scr, sec, c };
}
/* o.tab = 0 ข้อมูลยานพาหนะ · 1 ตารางบำรุงรักษา · 2 ประวัติการบำรุงรักษาเครื่องจักร · 3 ประวัติการบำรุงรักษาเครื่องยนต์ · 4 ประวัติการซ่อมบำรุง
   o.row = แถวใน MA_ROWS (ค่าเริ่ม MA_CAR) · o.menu · o.kbk = บทบาท กบค. (แก้/เพิ่มเครื่องมือกลได้) */
async function maDetail(name, o) {
  o = o || {};
  const tab = o.tab == null ? 1 : o.tab, row = o.row == null ? MA_CAR : o.row, r = MA_ROWS[row];
  const { scr, sec } = await maShell(name, tab, row);
  if (tab === 0) add(sec, await vehicleInfoTab(row, !!o.kbk), 'h');
  if (tab === 1) {
    add(sec, col('Section', [await sectionLabel('กำหนดครั้งถัดไป'), await tblShort(MA_NEXT_COLS, maNextRows(r))], 16), 'h');
    add(sec, col('Section', [await sectionLabel('ประวัติการบำรุงรักษา', { badge: MA_HIST.length }), await tblShort(MA_HIST_COLS, MA_HIST, { pagination: MA_HIST.length })], 16), 'h');
  }
  if (tab === 2) {   // บันทึกบำรุงรักษาตามวาระของ flow นี้ (มุมมอง "บำรุงรักษาเครื่องจักร" เดิม) · ค้นหาเลขที่ MR งานที่ทำ
    add(sec, await tableHeader({ placeholder: 'ค้นหาเลขที่ MR, งานที่ทำ' }), 'h');
    add(sec, await tblShort(MA_HIST_COLS, MA_HIST, { pagination: MA_HIST.length }), 'h');
  }
  if (tab === 3) {
    const e = vEngine(row);
    add(sec, await tableHeader({ placeholder: 'ค้นหาเลขที่งาน, งานที่ทำ' }), 'h');
    add(sec, await tblShort(VI_ENGINE_COLS, e.map(x => [x.date, x.no, x.center, x.work, x.km, x.cost]), { pagination: e.length }), 'h');
  }
  if (tab === 4) {   // Metric item 2 ใบ (บำรุงรักษาเครื่องจักรล่าสุด · ซ่อมเครื่องจักรล่าสุด) + ตารางรวม
    const rows = vService(row);
    add(sec, metricRow([await metric('บำรุงรักษาเครื่องจักรล่าสุด', MA_HIST[0][0], 'Brand'), await metric('ซ่อมเครื่องจักรล่าสุด', MA_REPAIRS[0][1], 'Warning')]), 'h');
    add(sec, await tableHeader({ placeholder: 'ค้นหาหมายเลขงาน, อาการ' }), 'h');
    add(sec, await tblShort(MA_REPAIR_COLS, rows, { pagination: rows.length }), 'h');
  }
  if (o.menu) planMenu(scr, MENU.slice(0, 1));
  return scr;
}

/* ---------- S12 บันทึกผลตรวจน้ำมันไฮดรอลิก ---------- */

/* ---------- ประวัติงานบำรุงรักษา (S16 ตีกลับแล้วผู้ดำเนินการส่งใหม่ · เดิม S15 ตัดออก 10 พ.ย. 2569) · S17 รายงานผล/ปิดงาน · S18 ต้นทุน ---------- */
/* historyScreen (S15/S16 ประวัติ) และ reportScreen (S17) เอาออก 10 พ.ย. 2569 — S15 S16 S17 ตัดออก */
/* ---------- S18 ต้นทุนการบำรุงรักษา (เจ้าของงานเคาะ 10 พ.ย. 2569 · ไฟล์ 14 Scenario 18 · R92) ----------
   ทางเข้า = แท็บ "ต้นทุนการบำรุงรักษา" ในหน้ารายละเอียดแผนที่อนุมัติแล้ว (Tabs ใต้หัวหน้า แบบ Vehicle detail ของ UI Release#2 ที่ S24 maShell ใช้) · ดูได้ตั้งแต่มีคันแรกปิดงาน
   โครงตามหน้า 5.13 EV charging costs for each agency ของ UI Release#2: Metric item ×4 → Table คอลัมน์ศูนย์ต้นทุน · ไม่มีกราฟ (ไลบรารีไม่มี · เจ้าของงานเลือกไม่มี)
   นับเฉพาะงานที่หน่วยงานทำเอง (แผนเดินทางจ้างดำเนินการไม่แสดง) · ค่าอะไหล่ = ราคารวมที่ใช้จริงตอนปิดงาน (ราคาต่อหน่วยระบบเติมให้ · ไม่รวมที่คืน · รวมอะไหล่นอกแผน)
   ค่าแรง = เบี้ยเลี้ยง + ชั่วโมงทำงาน × อัตรา (S10 Step 2 · ชั่วโมงไม่บังคับ) · ที่พัก เดินทาง ตาม S10 · ยานพาหนะที่บำรุงรักษาไม่ได้แยก section · สรุปตามแผนรายไตรมาส · เฉลี่ยต่อคัน
   ส่งออก = Excel อย่างเดียว ข้อมูลเหมือนจอ (ปุ่ม "ส่งออก" ไอคอน download แบบ R84 · ไม่มี popup เลือกรูปแบบเพราะมีรูปแบบเดียว · toast "ส่งออกไฟล์สำเร็จ" คำเดียวกับ S4) */
const PLAN_TABS = ['รายละเอียดแผน', 'ต้นทุนการบำรุงรักษา'];
const COST_CANNOT = TRIP_1.sel[2];   // คันที่บำรุงรักษาไม่ได้ของ T1 (JOB_MIX)
// [ลำดับใน TRIP_CARS, วันที่ปิดงาน, ค่าอะไหล่, ค่าเบี้ยเลี้ยง, ชั่วโมงทำงาน (0 = ไม่ได้กรอก), ค่าที่พัก, ค่าเดินทาง, ศูนย์ต้นทุนหน่วยงานอื่น] · แถวแรก = งานของ S10 (CLOSE_PARTS CLOSE_COST_BY)
const COST_V = [[JOB_I, '04/11/2569', 5880, costSum(1), CLOSE_HOURS, costSum(2), CLOSE_TRAVEL], [TRIP_1.sel[1], '05/11/2569', 5420, 960, 5, 3200, 980], [TRIP_1.sel[3], '06/11/2569', 7130, 1200, 0, 4000, 1210, true],
  [TRIP_2.sel[0], '18/11/2569', 4980, 720, 4, 2400, 860], [TRIP_2.sel[1], '19/11/2569', 6240, 960, 6, 3200, 980]];
const COST_X = [[COST_CANNOT, '04/11/2569', 1150, 480, 0, 1600, 450]];   // บำรุงรักษาไม่ได้ — ค่าใช้จ่ายที่เกิดแล้ว (อะไหล่ที่ใช้ไปแล้ว I.19 · ค่าเดินทาง ที่พัก)
const costLabour = (r) => r[4] * CLOSE_RATE;
const costTotal = (r) => r[2] + r[3] + costLabour(r) + r[5] + r[6];
const COST_COLS = [['ทะเบียน', 210, 'Lead text'], ['ศูนย์ต้นทุน', 0], ['ค่าอะไหล่', 110], ['ค่าเบี้ยเลี้ยง', 120], ['ค่าชั่วโมงทำงาน', 150], ['ค่าที่พัก', 110], ['ค่าเดินทาง', 110], ['รวม (บาท)', 120]];
const costRow = (r, cannot) => { const c = TRIP_CARS[r[0]], cc = r[7] ? OTHER_CC : OWNER_CC(c);
  return [{ text: c[0], sub: 'ไตรมาส 1 · ' + (cannot ? 'บำรุงรักษาไม่ได้' : 'ปิดงาน ' + r[1]) }, { text: cc.split(' ')[0], sub: cc.split(' ').slice(1).join(' ') }, nf(r[2]), nf(r[3]),
    r[4] ? { text: nf(costLabour(r)), sub: r[4] + ' ชม. × ' + nf(CLOSE_RATE) + ' บาท' } : '-', nf(r[5]), nf(r[6]), nf(costTotal(r))]; };
const QCOST_COLS = [['ไตรมาส', 0, 'Lead text'], ['ยานพาหนะ (คัน)', 160], ['ค่าอะไหล่', 110], ['ค่าเบี้ยเลี้ยง', 120], ['ค่าชั่วโมงทำงาน', 150], ['ค่าที่พัก', 110], ['ค่าเดินทาง', 110], ['รวม (บาท)', 120]];
const COST_ALL = () => COST_V.concat(COST_X);
const costSumOf = (rs) => [2, 3, null, 5, 6].map(k => rs.reduce((a, r) => a + (k == null ? costLabour(r) : r[k]), 0)).concat([rs.reduce((a, r) => a + costTotal(r), 0)]);
const QCOST_ROWS = () => { const s1 = costSumOf(COST_ALL()), z = ['0', '0', '0', '0', '0', '0'];
  return QUARTERS.map((q, k) => [q, k ? '0' : String(COST_ALL().length)].concat(k ? z : s1.map(nf))).concat([['รวมทั้งแผน', String(COST_ALL().length)].concat(s1.map(nf))]); };   // ยานพาหนะ (คัน) = คันที่มีต้นทุน (ปิดงานแล้ว + บำรุงรักษาไม่ได้)
const costMetrics = () => { const all = COST_ALL(), tot = all.reduce((a, r) => a + costTotal(r), 0);
  return [['ต้นทุนรวมของแผน', nf(tot) + ' บาท', 'Brand'], ['เฉลี่ยต่อคัน', nf(Math.round(tot / all.length)) + ' บาท', 'Brand'],   // เฉลี่ย = ต้นทุนรวม ÷ ยานพาหนะที่มีต้นทุน (รวมคันที่บำรุงรักษาไม่ได้ · เสนอ)
    ['ยานพาหนะที่ปิดงานแล้ว', COST_V.length + '/' + P_COUNTS.reduce((a, b) => a + b, 0) + ' คัน', 'Success'], ['บำรุงรักษาไม่ได้', COST_X.length + ' คัน', 'Warning']]; };
const COST_EXPORT_BTN = ['Secondary button', 'ส่งออก', 'download-24-300-round'];
async function costBody(o) {   // เนื้อแท็บต้นทุนการบำรุงรักษา · o.empty = ยังไม่มียานพาหนะปิดงาน
  if (o.empty) {
    const es = inst('Empty state/Data empty');
    await text(es, 'Text', 'ยังไม่มีต้นทุนการบำรุงรักษา'); await text(es, 'Supporting text', 'ต้นทุนจะแสดงเมื่อยานพาหนะในแผนเดินทางที่ดำเนินการเอง ปิดงานคันแรก');
    const a = find(es, 'Actions'); if (a) a.visible = false;
    return [es];
  }
  return [metricRow(await Promise.all(costMetrics().map(m => metric(m[0], m[1], m[2])))),
    col('Section', [await sectionLabel('สรุปรายไตรมาส'), await tblShort(QCOST_COLS, QCOST_ROWS())], 16),
    col('Section', [await sectionLabel('ต้นทุนรายคัน', { badge: COST_V.length }), await tblShort(COST_COLS, COST_V.map(r => costRow(r)))], 16),
    col('Section', [await sectionLabel('ยานพาหนะที่บำรุงรักษาไม่ได้', { badge: COST_X.length }), await tblShort(COST_COLS, COST_X.map(r => costRow(r, true)))], 16)];
}
async function costScreen(name, o) {   // หน้ารายละเอียดแผน แท็บต้นทุนการบำรุงรักษา (planDetailQ tab 1)
  return planDetailQ(name, Object.assign({ tab: 1 }, o));
}
const COST_SHEETS = ['สรุปรายไตรมาส', 'ต้นทุนรายคัน'];
async function costXls(name, sheet) {   // ไฟล์ Excel ที่ส่งออก — ข้อมูลเหมือนจอ (เจ้าของงาน 10 พ.ย. 2569 "excel แสดงเหมือนหน้าจอ") · ชีต = แถบ Tabs แบบ tripXls
  return docFrame(name, 1440, 1024, async () => {
    const head = [await tabs(COST_SHEETS.map(s => [s, null]), sheet), await sectionLabel('ต้นทุนการบำรุงรักษา · ' + P[0] + ' ' + P[1])];
    if (sheet === 0) return head.concat([kv(costMetrics().map(m => [m[0], m[1]]), 4), await tblShort(QCOST_COLS, QCOST_ROWS())]);
    return head.concat([await tblShort(COST_COLS, COST_V.map(r => costRow(r))), await sectionLabel('ยานพาหนะที่บำรุงรักษาไม่ได้', { badge: COST_X.length }), await tblShort(COST_COLS, COST_X.map(r => costRow(r, true)))]);
  });
}

/* ======================== รอบสอง 9 scenario (เจ้าของงานสั่ง 22 ต.ค. 2569 ดึก "บำรุงรักษา สามารถ export 18 scen ได้เลย") ========================
   S2–S3 ผพจ./หัวหน้า ผพจ. · S7 ผู้รับจ้าง · S8 กบค. ตรวจแผนผู้รับจ้าง · S9 กรย. · S11 กบค. ตรวจงานผู้รับจ้าง + รับคืนอะไหล่ (ตัดออก 4 พ.ย. 2569) · S13–S14 หน่วยงาน/เจ้าของรถ · S16 หัวหน้าหน่วยงาน
   ตีความเอง (คำถามในไฟล์ 14 ยังค้าง — แจ้งเจ้าของงานแล้ว): ผพจ. กับหัวหน้า ผพจ. คนละบทบาท (Q1) · ผู้รับจ้างมีบัญชีเข้า VMS+ เอง (Q13) · รับทราบรอบเดียวรายคันที่ S13 (Q28 เคาะ 10 พ.ย. 2569 · S14 S15 ตัดออก) ·
   ไม่มีปุ่มไม่ยอมรับ (Q23) · ไม่สร้างทางที่บอร์ดยังไม่มีปลายทาง (กรย. อะไหล่ไม่พร้อม Q16 · ผพจ. คืนอะไหล่ Q5)
   ยืมจาก flow งานซ่อม: `RepairFeedback` (คะแนน 1–5 Radio text card — เจ้าของงานเลือกให้ S14 · การประเมินเกิดตอนบำรุงรักษาครบทุกคัน) · `ReturnPart` (ตารางรับคืนอะไหล่ S11 — เลิกใช้ 3 พ.ย. 2569 · S11 ตัดออกทั้ง scenario 4 พ.ย. 2569) */
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
  add(sec, await tblShort(o.cols, o.rows, { pagination: o.rows.length }), 'h');
  return scr;
}
const reason = (scr, title, label, value, ok) => formModal(scr, { title, fields: [{ label, value, area: 1 }], ok });   // ส่งกลับ/ปฏิเสธ/ตีกลับ = เหตุผล Freetext บังคับ (ไฟล์ 14)
const GO = { icons: ['keyboard_arrow_right-20-400-round'] };

/* ---------- S7 ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง (3 พ.ย. 2569) ----------
   เจ้าของงาน "s7 เป็นเรื่องอนุมัติแผนการเดินทาง" + หน้าอนุมัติแบบเดียวกับ S2 (radio อนุมัติ ค่าเริ่มต้น / ส่งกลับแก้ไข + เหตุผล) · ผู้อนุมัติตามสายงานจาก API getUpperLower (Q45)
   ตาม `Radio text card` + `Section label` + `Table` ของไฟล์ Component · หน้า Detail ⇒ Section label (R3) */
const TRIP_VIEW_COLS = tripVCols();   // R82 ชุดเดียวกับฟอร์มแผนเดินทาง ดูอย่างเดียว (6 พ.ย. 2569 + ประเภทยานพาหนะ · ผู้ดูแลยานพาหนะ · วันดำเนินการ · เดิม ทะเบียน ยี่ห้อ/รุ่น หน่วยงาน สถานที่)
const tripCarIdx = (t, only) => t.sel.filter(i => !only || TRIP_CARS[i][2] === only);   // only = หน่วยงานเจ้าของยานพาหนะ (S8 ฝั่งหน่วยงานเห็นเฉพาะยานพาหนะของตน)
const tripCarRows = (t, only) => tripCarIdx(t, only).map(i => tripVCells(i, t));
const tripKv = (t, more) => [['ชื่อแผนเดินทาง', t.name], ['แผน', P[0] + ' ' + P[1]], ['ไตรมาส', NOW_Q], ['รูปแบบดำเนินการ', t.vendor ? 'จ้างดำเนินการ' : 'ดำเนินการเอง']].concat(t.vendor
  ? [['ผู้รับจ้าง', t.vendor], ['เลขที่สัญญา/ใบสั่งจ้าง', t.contract || '-'], ['ช่วงวันทำงาน', t.d1 + ' – ' + t.d2]]   // S9 แผนจ้าง: ไม่มีพนักงาน กบค. และค่าใช้จ่าย
  : [['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2], ['พนักงานที่เดินทาง', TRIP.staff.join(', ')]], [['ผู้สร้าง', CREATOR], ['วันที่ส่ง', '03/11/2569']], more || []);   // ค่าใช้จ่ายย้ายไปปิดงานรายคัน (3 พ.ย. 2569)
const TRIP_REVIEW_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวันเดินทาง', 220], ['ยานพาหนะ (คัน)', 100], ['ผู้สร้าง', 180], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 150, 'Badge'], ['', 60]];
const tripReviewRow = (t) => [{ text: t.name, sub: P[0] + ' · ' + NOW_Q }, t.d1 + ' – ' + t.d2, String(t.sel.length), 'นายวิชัย ทองดี', '03/11/2569', { pill: TST[t.st] }, GO];
const TRIP_OTHER = { name: 'ตรวจรถพ่วงฉีดน้ำ นครราชสีมา บุรีรัมย์', sel: [0, 1, 2], locs: {}, d1: '10/11/2569', d2: '12/11/2569', st: 'review' };   // อีกใบในรายการรออนุมัติ (แสดงในตารางอย่างเดียว)
/* หน้าอนุมัติมีแท็บ รออนุมัติ · อนุมัติแล้ว · ส่งกลับแก้ไข (เจ้าของงาน 10 พ.ย. 2569 "หน้าอนุมัติต้องมี tab รออนุมัติ อนุมัติแล้ว และ ส่งกลับแก้ไขด้วย")
   ตาม `Tabs` ของไฟล์ Component + แท็บ รอตรวจสอบ อนุมัติแล้ว ปฏิเสธ ของหน้ารายการตรวจสอบเดิมในไฟล์ Maintain-D (ตัวเลขเฉพาะแท็บรออนุมัติ) · tab 0 1 2 */
const REVIEW_TABS = (n) => [['รออนุมัติ', n], ['อนุมัติแล้ว', null], ['ส่งกลับแก้ไข', null]];
const TRIP_OK = Object.assign({}, TRIP_2, { st: 'approved' }), TRIP_RET = { name: 'ตรวจยานพาหนะ พิษณุโลก สุโขทัย ตาก', sel: [0, 1], locs: {}, d1: '24/11/2569', d2: '26/11/2569', st: 'returned' };
const TRIP_PENDING = [TRIP_1, TRIP_V, TRIP_OTHER];
const tripReviewList = async (name, rows, tab, pending) => roleList(name, { title: 'อนุมัติแผนเดินทาง', search: 'ค้นหาชื่อแผนเดินทาง, ผู้สร้าง', cols: TRIP_REVIEW_COLS, rows: rows.map(tripReviewRow),
  tabs: REVIEW_TABS(pending != null ? pending : TRIP_PENDING.length), tab: tab || 0 });
async function tripReview(name, o) {   // o.decision = 'return' · o.reason · o.errors · o.status = 'approved'
  o = o || {};
  const t = TRIP_1;
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนเดินทาง', back: true, crumbs: ['อนุมัติแผนเดินทาง', t.name], badge: TST[o.status || 'review'] });
  // 5 พ.ย. 2569 ทำตาม S2 (รีวิวทีมออกแบบ) ให้สอดคล้อง: ผลการพิจารณาบนสุด ไม่มีค่าเริ่มต้น · อนุมัติแล้วแสดงแค่ toast ไม่มี Alert ซ้ำ
  const d = o.status === 'approved' ? null : await decisionSection(o, 'แผนเดินทางผ่านการตรวจสอบ แจ้งผู้ดูแลยานพาหนะและ กรย.', 'แจ้งเหตุผลให้ผู้สร้างแผนเดินทางแก้ไขแล้วส่งใหม่');
  const nodes = (d ? [d.dec] : []).concat([await vehicleInfo(tripKv(t), 'รายละเอียดแผนเดินทาง'), col('Section', [await sectionLabel('ยานพาหนะในแผนเดินทาง', { badge: t.sel.length }), await tblShort(TRIP_VIEW_COLS, tripCarRows(t))], 16),
    await tripPartsSec(t.sel, true)]);   // 6 พ.ย. 2569 อะไหล่ของแผนเดินทาง ให้ผู้อนุมัติเห็นชุดเดียวกับฟอร์ม (R82)
  if (d) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg', disabled: !d.ok }]]));
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
const NOTI_KRY = ['Brand', 'แผนเดินทาง ' + TRIP_1.name + ' อนุมัติแล้ว หน่วยงานผู้ดำเนินการจะเข้าบำรุงรักษายานพาหนะ ' + TRIP_1.sel.length + ' คัน ระหว่างวันที่ ' + TRIP_1.d1 + ' ถึง ' + TRIP_1.d2, '10 นาทีที่แล้ว'];
const NOTI_OWN = ['Brand', 'หน่วยงานผู้ดำเนินการจะเข้าบำรุงรักษายานพาหนะที่คุณดูแล ' + ownCars(TRIP_1).length + ' คัน (' + ownCars(TRIP_1).map(i => TRIP_CARS[i][0]).join(', ') + ') ระหว่างวันที่ ' + TRIP_1.d1 + ' ถึง ' + TRIP_1.d2 + ' ที่ ' + tripLoc(ownCars(TRIP_1)[0], TRIP_1.locs), '10 นาทีที่แล้ว'];
const NOTI_OLD = ['Success', 'บำรุงรักษายานพาหนะ 82-3302 อุดรธานี ตามแผนเดินทางเดือนตุลาคมเสร็จแล้ว', '2 วันที่แล้ว'];
const TRIP_SEEN_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวันเดินทาง', 220], ['ยานพาหนะ (คัน)', 100], ['สถานะ', 150, 'Badge'], ['', 60]];
const tripSeenList = (name, own) => roleList(name, { title: 'แผนเดินทางบำรุงรักษา', search: 'ค้นหาชื่อแผนเดินทาง, ทะเบียน', cols: TRIP_SEEN_COLS, rows: [[{ text: TRIP_1.name, sub: P[0] + ' · ' + NOW_Q }, TRIP_1.d1 + ' – ' + TRIP_1.d2, String(own ? ownCars(TRIP_1).length : TRIP_1.sel.length), { pill: TST.approved }, GO]] });
async function tripView(name, own) {   // ดูอย่างเดียว · own = หน่วยงานเจ้าของรถ (เฉพาะรถของตน)
  const t = tripAs(TRIP_1, 'approved');
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: ['แผนเดินทางบำรุงรักษา', t.name], badge: TST.approved, actions: [TRIP_EXPORT_BTN] });   // 6 พ.ย. 2569 ส่งออกได้ เพราะไม่แก้ข้อมูล (แบบ viewActions ของ S18 Overhaul · R84)
  const kv = [['ชื่อแผนเดินทาง', t.name], ['แผน', P[0] + ' ' + P[1]], ['ไตรมาส', NOW_Q], ['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2], ['พนักงานที่เดินทาง', TRIP.staff.join(', ')], ['ผู้สร้าง', CREATOR], ['อนุมัติเมื่อ', '04/11/2569']];
  const idx = tripCarIdx(t, own ? OWN_UNIT : null), rows = tripCarRows(t, own ? OWN_UNIT : null);
  add(page, col('Content', [await vehicleInfo(kv, 'รายละเอียดแผนเดินทาง'), col('Section', [await sectionLabel(own ? 'ยานพาหนะของหน่วยงานในแผนเดินทาง' : 'ยานพาหนะในแผนเดินทาง', { badge: rows.length }), await tblShort(TRIP_VIEW_COLS, rows)], 16),
    await tripPartsSec(idx, true)], 32), 'h');   // 6 พ.ย. 2569 อะไหล่ของแผนเดินทาง (R82) · ฝั่งหน่วยงานรวมเฉพาะยานพาหนะของตน
  return scr;
}

/* ---------- S2 ผู้อนุมัติ ตรวจสอบและอนุมัติแผน (30 ต.ค. 2569 สายอนุมัติทั่วไป ไม่ผ่าน ผพจ.) ---------- */
const NP = NEW_PLAN;
const NO_NEW = 'MRZ7000003';   // ใช้กับ S3 ที่พักไว้ (เลขงาน) — ไม่อยู่ในชุดสร้างจอ
const npKv = (job) => [   // 5 พ.ย. 2569 ภาค สรุปจากรถในแผน
  ['ชื่อแผน', NP[1]], ['ปีงบประมาณ', NP[8]], ['หน่วยงาน', PLAN_UNIT[NP[0]]], ['เขต', [...new Set(Object.keys(A_ALL).map(i => dCode(CAND[i])))].sort().join(', ')], ['ยานพาหนะรายไตรมาส', NP[9]], ['จำนวนยานพาหนะ', NP[4] + ' คัน'], ['เลขที่ MR', job || NP[0]], ['ผู้สร้างแผน', CREATOR], ['วันที่ส่ง', NP[6]]];
const VEH7 = CAND.map(c => [c[0], c[1], c[2], c[3], 'ready']);   // รถในแผนใหม่ = รถที่ติ๊กตอนสร้างแผน (ภาค 2 รถกระเช้า)
const REVIEW_COLS = [['ชื่อแผน', 0, 'Lead text', 'Swap'], ['ปีงบประมาณ', 120], ['ผู้สร้าง', 180], ['ภาค / ประเภทยานพาหนะ', 200], ['จำนวนยานพาหนะ', 100], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 150, 'Badge'], ['', 60]];
const reviewRow = (p) => [p[1], p[8], { text: 'นายวิชัย ทองดี', sub: PLAN_UNIT[p[0]] || UNITS[0] }, scopeCell(p), p[4] + ' คัน', p[6], { pill: PST[p[5]] }, GO];
const REVIEW_ROWS = [NP, PLANS[2]];   // แท็บรออนุมัติ (10 พ.ย. 2569 แยกแท็บ — แผนที่ส่งกลับไปอยู่แท็บส่งกลับแก้ไข)
const REVIEW_DONE = [PLANS[1], PLANS[0].slice(0, 5).concat(['approved'], PLANS[0].slice(6))], REVIEW_RET = [PLANS[3]];   // แท็บอนุมัติแล้ว · ส่งกลับแก้ไข
const planReviewList = (name, rows, tab, pending) => roleList(name, { title: 'อนุมัติแผนบำรุงรักษา', search: 'ค้นหาชื่อแผน, ผู้สร้าง', cols: REVIEW_COLS, rows: rows.map(reviewRow),
  tabs: REVIEW_TABS(pending != null ? pending : REVIEW_ROWS.length), tab: tab || 0 });
const PART_CHECK_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['ตามแผน', 110], ['หน่วย', 90], ['คงเหลือในคลัง', 140], ['ต้องซื้อเพิ่ม', 140]];
const partCheckRows = () => PARTS.map((p, i) => [p[0], p[1], p[3], p[4], p[5], shortOf(i) ? String(shortOf(i)) : '-']);
async function planBody(o) {   // เนื้อหน้ารายละเอียดแผน ใช้ทั้งฝั่งผู้อนุมัติ (S2) และผู้สร้างแผน (S1 S19 S20 · มุม กบค.) · อะไหล่ในแผนขึ้นทุกหน้า · o.pq = แท็บ (0 รวมทุกไตรมาส) · สถานะคลังรับทราบ (o.wh) ตัดพร้อม S22 6 พ.ย. 2569
  o = o || {};
  const inPlan = Object.keys(A_ALL).map(Number);   // รถในแผนใหม่ = ที่จัดลงไตรมาสตอนสร้างแผน (S1)
  // เจ้าของงาน 2 พ.ย. 2569 "อยากให้ข้อมูลที่แสดงเป็นข้อมูลรถ" ⇒ รถแยกแท็บไตรมาส คอลัมน์เดียวกับ section รถในไตรมาสของ S1 ไม่มีไอคอน (ดูอย่างเดียว) · ไม่มีตารางอะไหล่ทั้งปี
  const q1 = inPlan.filter(i => A_ALL[i] === 1), n = (i) => (A_PICKS[i] || []).length;
  return [await vehicleInfo(npKv(), 'รายละเอียดแผน'),
    // 5 พ.ย. 2569 ชีตลูกค้า: ปุ่มไปหน้าไตรมาสต้องมีทั้งแผน อนุมัติแล้ว และ ดำเนินการ (เดิมมีเฉพาะ planDetailQ ดำเนินการ) · o.qBtn
    col('Section', [await sectionLabel('ยานพาหนะในแผน', { badge: inPlan.length, buttons: o.qBtn ? [Q_BTN] : [] }), await tabs(QUARTERS.map((t, k) => [t, inPlan.filter(i => A_ALL[i] === k + 1).length]), 0),
      await tblShort(CARP_COLS.slice(0, 6), q1.map(i => [CAND[i][0], CAND[i][1], CAND[i][2], OIL_OPTS[(A_PICKS[i] || []).indexOf(0) >= 0 ? 1 : 0], lastOil(CAND[i][0]), n(i) ? n(i) + ' รายการ' : A_DRAW[i] ? 'ไม่เบิกอะไหล่' : 'ยังไม่เลือก']))], 16)]
    .concat([await planPartsSec(o.pq || 0)]);   // อะไหล่ในแผน ทุกหน้ารายละเอียดแผน · 9 พ.ย. 2569 เจ้าของงานส่งภาพ A.20 A.21 A.22 A.32 ที่มีหัวข้ออะไหล่ "ทำให้เป็นแบบนี้" (ยกเลิกที่เคาะเช้า "หน้าผู้สร้าง … ไม่ต้องมี มีแค่ผู้อนุมัติ")
}
/* หน้ารายละเอียดแผนฝั่งผู้อนุมัติ (Detail ⇒ Section label)
   เจ้าของงาน 2 พ.ย. 2569: ผลการพิจารณาเป็น radio อนุมัติ (ค่าเริ่มต้น) / ส่งกลับแก้ไข แทนปุ่ม 2 ปุ่ม — ตามการ์ดตอบรับ/ปฏิเสธนัดหมายของ Overhaul R29 (§4.2.13)
   o.decision = 'return' เลือกส่งกลับแก้ไข ⇒ Text area เหตุผลบังคับ · o.reason = เหตุผลที่กรอก · o.errors = ยังไม่ระบุเหตุผล */
/* ผลการพิจารณา (S2 · S7) — ปรับ 5 พ.ย. 2569 (รีวิวทีมออกแบบ): "Default จะยังไม่เลือกผลการพิจารณาให้ ต้องเลือกเอง · ย้ายตำแหน่งจากด้านล่างสุดไปไว้ด้านบนสุดให้เหมือนงานซ่อม"
   ⇒ Section label + Radio text card 2 ใบ บนสุดของเนื้อหา ตาม Incident detail ของ Flow การซ่อม (ไฟล์ Maintain-D: Section label + Radio text card ×2 ก่อนส่วนข้อมูล) · ไม่มีใบที่เลือกไว้ก่อน
   ปุ่ม "ยืนยันผลการพิจารณา" Disabled จนกว่าจะเลือกผล และถ้าเลือกส่งกลับต้องระบุเหตุผลก่อน · o.decision = 'approve' | 'return' · o.reason · o.errors = ช่องเหตุผลออกจากช่องโดยยังว่าง (Out of focus) */
async function decisionSection(o, approveSub, returnSub) {
  const sel = o.decision === 'return' ? 1 : o.decision === 'approve' ? 0 : -1;
  const dec = await radioPick('ผลการพิจารณา', [['อนุมัติ', approveSub], ['ส่งกลับแก้ไข', returnSub]], sel, { label: true });
  if (sel === 1) add(dec, area('เหตุผลที่ส่งกลับ', o.reason, { placeholder: 'ระบุเหตุผลที่ส่งกลับ', error: o.errors ? 'กรุณาระบุเหตุผลที่ส่งกลับ' : '' }), 'h');
  return { dec, ok: sel === 0 || (sel === 1 && !!o.reason) };
}
/* อะไหล่ของแผน (S2 · 6 พ.ย. 2569 เจ้าของงาน "อยากเพิ่ม section อะใหล่ โดย group ชนิด ประเภท จำนวน ไม่แยกรายคัน แต่ละไตรมาส" + ยืนยัน ประเภท = หมวด · ชนิด = รายการ · จำนวนรวมทุกคันพร้อมหน่วย)
   Section label "อะไหล่ในแผน" + Tabs ไตรมาส 1–4 (ตัวเลข = จำนวนรายการ) + Table ชนิด · ประเภท · จำนวน · หน่วย เรียงตามประเภท · ยอดจาก qAgg ตัวเดียวกับหัวข้ออะไหล่ในไตรมาสของ S1 (คันที่ไม่เบิกไม่รวม)
   ตาม Section label + Tabs + Table ของหน้ารายละเอียดแผน (รถในแผน) ในบล็อกเดียวกัน · ไม่มีอะไหล่ = Empty state */
/* 9 พ.ย. 2569 เจ้าของงาน (ภาพหัวข้ออะไหล่ในแผนของ S2) "อยากให้มี tab รวมทุกไตรมาส และแยกไตรมาส ทั้งก่อนอนุมัติ และ ผู้อนุมัติ"
   ⇒ Tabs = "รวมทุกไตรมาส" (ค่าเริ่มต้น · ยอดเท่าผลรวมไตรมาส 1–4 แบบ R85) + ไตรมาส 1–4 (Tabs ของไลบรารีมี 5 ช่องพอดี) · q = 0 รวมทุกไตรมาส · 1–4 ไตรมาสนั้น
   แสดงทุกหน้ารายละเอียดแผน (planBody): หน้าตรวจสอบของผู้อนุมัติ (S2) · หน้ารายละเอียดของผู้สร้างแผนทุกสถานะ (S1 A.20–A.22 · S19 · S20) · A.32 กบค. ดูแผนของหน่วยงานอื่น (เจ้าของงาน 9 พ.ย. 2569 ส่งภาพ 4 จอ "ทำให้เป็นแบบนี้") */
const planQParts = (k) => { const cars = Object.keys(A_ALL).map(Number).filter(i => (k === 0 || A_ALL[i] === k) && A_DRAW[i] !== 'none'); return qAgg(cars, A_PICKS, A_OILS, []).sort((a, b) => a[2].localeCompare(b[2], 'th')); };
async function planPartsSec(q, rowsOf) {   // rowsOf = ยอดรายแท็บของแผนอื่น (ค่าเริ่ม planQParts = แผน NP) · E.2 ใช้ pQParts ของแผน P
  const rows = (rowsOf || planQParts)(q);
  const sec = col('Section', [await sectionLabel('อะไหล่ในแผน'), await tabs([['รวมทุกไตรมาส', null]].concat(QUARTERS.map(t => [t, null])), q)], 16); // 9 พ.ย. 2569 เจ้าของงาน "เอาเลขออกไปเลยได้ป่ะ ถ้าหมายถึงจำนวนชนิด" ⇒ หัวข้ออะไหล่รวมตามรายการไม่มีตัวเลขจำนวนชนิด
  if (rows.length) add(sec, await tblShort(QPART_COLS, rows), 'h');
  else add(sec, await noParts(q ? Q_PARTS_EMPTY : ALL_Q_PARTS_EMPTY), 'h');   // ข้อความชุดเดียวกับหัวข้ออะไหล่ในไตรมาส n ของหน้าไตรมาส
  return sec;
}
/* อนุมัติสำเร็จ (5 พ.ย. 2569 รีวิว): "แสดง Toast ด้านบนขวา · ไม่ต้องแสดง Alert อนุมัติแผนแล้ว ซ้ำ ให้แสดงแค่ Toast · สถานะ รออนุมัติ > อนุมัติแล้ว · Section ผลการพิจารณา หายไป" ⇒ o.status = 'approved' ไม่มี Alert ไม่มีส่วนผลการพิจารณาและแถวปุ่ม */
async function planReview(name, o) {
  o = o || {};
  const done = o.status === 'approved';
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนบำรุงรักษา', back: true, crumbs: ['อนุมัติแผนบำรุงรักษา', NP[1]], badge: PST[o.status || 'review'] });
  const d = done ? null : await decisionSection(o, 'แผนผ่านการตรวจสอบ หน่วยงานเริ่มงานรายไตรมาสได้', 'แจ้งเหตุผลให้ผู้สร้างแผนแก้ไขแล้วส่งใหม่');
  const nodes = (d ? [d.dec] : []).concat(await planBody({ pq: o.pq }));
  if (d) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg', disabled: !d.ok }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S22 กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส (2 พ.ย. 2569) ----------
   เจ้าของงาน: ต่อจากอนุมัติ ส่งไปหา กบค. คลัง ว่าแต่ละไตรมาสเบิกอะไหล่อะไรบ้าง แยกไตรมาส · ระบบส่งทั้งปีทันทีที่อนุมัติ · คลังดูแล้วกดรับทราบ (ไม่มีส่งกลับ)
   หน้า Detail ⇒ Section label · Tabs ไตรมาสตัวเดียวกับ S1 · ยอดคิดจากอะไหล่ที่ กบค. เลือกไว้ (A_PICKS) ของรถแต่ละไตรมาส */
const WH_QS = [1, 2, 3, 4].filter(k => Object.values(A_ALL).indexOf(k) >= 0);   // ไตรมาสที่มีรถ = ไตรมาสที่ต้องรับทราบ
const wst = (n) => n === 0 ? ['รอรับทราบ', 'Warning'] : n < WH_QS.length ? ['รับทราบ ' + n + '/' + WH_QS.length + ' ไตรมาส', 'Info'] : ['รับทราบครบแล้ว', 'Success'];   // 2 พ.ย. 2569 รับทราบทีละไตรมาส
const WH_COLS = [['เลขที่ MR', 150, 'Lead text'], ['ชื่อแผน', 0], ['ปีงบประมาณ', 120], ['จำนวนยานพาหนะ', 100], ['วันที่อนุมัติ', 130], ['สถานะ', 150, 'Badge'], ['', 60]];
const whRow = (p, n, d) => [p[0], p[1], p[8], p[4] + ' คัน', d, { pill: wst(n) }, GO];
const WH_PART_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวนที่ต้องเบิก', 150], ['หน่วย', 90], ['คงเหลือในคลัง', 140], ['ไม่พอ', 110]];
const whCars = (k) => Object.keys(A_ALL).map(Number).filter(i => A_ALL[i] === k);
const whParts = (k) => quarterParts(whCars(k), A_PICKS).map(r => { const st = +PARTS.find(p => p[0] === r[0])[5], need = +r[3]; return [r[0], r[1], r[3], r[4], String(st), need > st ? String(need - st) : '-']; });
async function warehouseScreen(name, o) {   // o.q = แท็บที่เปิด · o.acked = ไตรมาสที่รับทราบแล้ว
  o = o || {};
  const q = o.q || 1, rows = whParts(q), acked = o.acked || [], done = acked.indexOf(q) >= 0;
  const { scr, page } = await shell(name, { title: 'อะไหล่ที่ต้องเบิกรายไตรมาส', back: true, crumbs: ['แผนที่ต้องเตรียมอะไหล่', NP[1]], badge: wst(acked.length) });
  const sec = col('Section', [await sectionLabel('อะไหล่ที่ต้องเบิกรายไตรมาส'), await tabs(QUARTERS.map((t, k) => [t, whParts(k + 1).length]), q - 1)], 16);
  if (done) add(sec, alertBox('Success', 'รับทราบไตรมาส ' + q + ' แล้ว 02/11/2569', 'หน่วยงานเห็นสถานะนี้ในหน้ารายการและหน้ารายละเอียดแผน'), 'h');
  if (rows.length) add(sec, await tblShort(WH_PART_COLS, rows), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ไม่มีอะไหล่ที่ต้องเบิก'); await text(es, 'Supporting text', 'ไตรมาสนี้ไม่มียานพาหนะในแผน ไม่ต้องรับทราบ'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  const nodes = [await vehicleInfo(npKv(), 'รายละเอียดแผน'), sec];
  if (rows.length && !done) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบไตรมาส ' + q, { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S19 แก้ไขแผน · S20 ลบแผน (30 ต.ค. 2569 · ยึดบล็อก C D ของ Overhaul) ----------
   แก้ไข: รออนุมัติ · ส่งกลับแก้ไข · อนุมัติแล้ว แล้วส่งอนุมัติใหม่ทุกครั้ง (เจ้าของงาน "แก้ไขแล้วมีอนุมัติ อยากให้ใส่ไปก่อน")
   ลบ: เฉพาะก่อนอนุมัติ · ไม่มียกเลิกแผน (เจ้าของงาน "ยกเลิกแผนไม่ต้องมีก็ได้") · ทำไม่ได้ในสถานะนั้น = ซ่อน ไม่ disable */
const planAs = (st) => NP.slice(0, 5).concat([st], NP.slice(6));
const RETURN_REASON = 'จำนวนไส้กรองไฮดรอลิกไม่ตรงกับรอบบำรุงรักษาของกระเช้าแก้ไฟ กรุณาตรวจสอบยานพาหนะที่เลือกเข้าแผน';
const ALERT_RETURNED = ['Error', 'ผู้อนุมัติส่งกลับให้แก้ไข', RETURN_REASON];
const ALERT_APPROVED = ['Warning', 'แผนนี้อนุมัติแล้ว', 'เมื่อบันทึก แผนจะกลับเป็นสถานะรออนุมัติ และต้องให้ผู้อนุมัติตรวจสอบอีกครั้ง'];
/* S21 จัดการอะไหล่ของรถ (หน้าแยก · section น้ำมันไฮดรอลิก + อะไหล่อื่นๆ · ปรับ 5 พ.ย. 2569 เจ้าของงาน "อยากให้จัดการสิ่งที่ต้องทำของรถแต่ละคัน เช่น รถตันนี้ ต้องเปลี่ยนน่ำมันไฮดรอลิก
   รถตันนี้ต้องเก็บตัวอย่างน้ำมันไฮดรอลิก น้ำมันเบอร์อะไร รหัสอะไร ใช้กี่ลิตร ต้องเปลี่ยนใส้กรอง ระบุ ชื่อ ยี่ห้อกรอง รุ่นกรอง รหัสกรอง เป็นต้น")
   เข้าจากไอคอนแก้ไขที่แถวรถในแท็บไตรมาส n ของฟอร์ม S1/S19 · น้ำมันไฮดรอลิก = Radio text card 3 ใบ (JOB_OIL_OPTS แบบหน้างานรายคัน S10) + Input dropdown เบอร์น้ำมัน · Text input รหัส · จำนวน (ลิตร) · เปลี่ยนล่าสุด Readonly
   อะไหล่อื่นๆ = PartsInventoryPanel (คลังอะไหล่ของงานซ่อม · เลือก/เลือกแล้ว) + ตาราง Table ของไลบรารี ชื่อ · ยี่ห้อ · รุ่น · รหัส · จำนวน · หน่วย · แก้ไข ลบ
   ⚠ RequestedPartsPanel / Spare Part Card Item ของงานซ่อมไม่มีช่องยี่ห้อ รุ่น (การ์ดที่เลือกมีแค่ ชื่อ · รหัส · หน่วย · ราคา · การ์ดเพิ่มเอง Text input 3 ช่อง รายละเอียด · รหัส · ราคา) และ instance เพิ่มช่องไม่ได้
     ⇒ รายการของรถคันนี้ใช้ Table · ระบุอะไหล่เพิ่มเติมใช้ Modal Type=Form (Card form row 3 แถว × Input 1/Input 2 = 6 ช่อง) ซึ่งเป็นแบบสำรองเดิมของหน้านี้ (มือถือ / ไฟล์ไม่มีแผงงานซ่อม) — รอเจ้าของงานเคาะ */
const Q_CARS = Object.keys(A_ALL).map(Number).filter(i => A_ALL[i] === 1), CAR_ADD = CAR_PICK.concat([4]);   // รถของไตรมาสที่เปิดจากฟอร์ม · ไส้กรองที่เลือก (น้ำมันแยกเป็นส่วนของตัวเอง)
const PART_BM = [['PTT', 'Hydraulic AW 46'], ['Donaldson', 'P550388'], ['Sakura', 'C-1809'], ['Sakura', 'A-1033'], ['Isuzu', '8-98159693-0']];   // ยี่ห้อ · รุ่น ตามลำดับ PARTS (ค่าสมมติ)
const MANUAL_BM = { brand: 'Fleetguard', model: 'AF25550', unit: 'ชิ้น' };
const OIL_GRADES = ['ISO VG 32', 'ISO VG 46', 'ISO VG 68'];
const CARP_PART_COLS = [['ชื่อ', 0, 'Lead text'], ['ยี่ห้อ', 140], ['รุ่น', 160], ['รหัส', 130], ['จำนวน', 90], ['หน่วย', 90], ['', 104]];
const MANUAL_FIELDS = (m) => [{ pair: [{ label: 'ชื่ออะไหล่', value: m.name, placeholder: 'ระบุชื่ออะไหล่' }, { label: 'ยี่ห้อ', value: m.brand, placeholder: 'ระบุยี่ห้อ' }] },
  { pair: [{ label: 'รุ่น', value: m.model, placeholder: 'ระบุรุ่น' }, { label: 'รหัสอะไหล่', value: m.code, placeholder: 'ระบุรหัสอะไหล่', optional: true }] },
  { pair: [{ label: 'จำนวน', value: m.qty ? String(m.qty) : '', placeholder: '0' }, { label: 'หน่วย', value: m.unit, placeholder: 'ระบุหน่วย' }] }];
async function carWarehouse(picked) {   // คลังอะไหล่ของงานซ่อม (PartsInventoryPanel) เฉพาะไส้กรองและอะไหล่ (ไม่รวมน้ำมันไฮดรอลิกที่มีส่วนของตัวเอง) · ไม่มี component / มือถือ = ไม่มีแผง
  if (MOB || !has('PartsInventoryPanel')) return null;
  const inv = inst('PartsInventoryPanel'); inv.name = 'PartsInventoryPanel';
  const sh = find(inv, 'Section header');
  if (sh) { setProps(sh, { Title: 'คลังอะไหล่', 'Supporting text': true, 'More actions': false, Badge: false, Actions: false }); await text(sh, 'Supporting text', 'ไส้กรองและอะไหล่จาก Smart Inventory และ คลังสำรอง'); }
  const ti = find(inv, 'Text input'); if (ti) setProps(ti, { Text: 'ค้นหาชื่อหรือรหัสอะไหล่', Label: false, Helper: false, 'Info icon': false });
  const cards = inv.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
  for (const [k, c] of cards.entries()) {
    const i = k + 1; if (!PARTS[i]) { c.visible = false; continue; }
    setProps(c, { Suggestion: false, Select: picked.indexOf(i) >= 0, Add: picked.indexOf(i) < 0, 'จัดซื้อเพิ่ม': false, 'เลือกผู้จัดซื้อ': false });
    await fillPartCard(c, i, { stock: PARTS[i][5] });
  }
  return inv;
}
async function carPartsScreen(name, o) {
  o = o || {};
  const car = CAND[0];
  const { scr, page } = await shell(name, { title: 'จัดการอะไหล่ของยานพาหนะ ' + car[0], back: true, crumbs: ['สร้างแผน', 'จัดการอะไหล่ของยานพาหนะ'] });
  const f = dropdown('ยานพาหนะ', car[0], { placeholder: 'เลือกยานพาหนะในไตรมาสนี้', lead: 'search-24-300-round', state: o.carOpen ? 'Focused' : undefined });
  const k = o.oil == null ? 0 : o.oil;   // ค่าเริ่มต้นเก็บตัวอย่าง (S21 เดิม) · 0 เก็บตัวอย่าง · 1 เปลี่ยนน้ำมัน · 2 เก็บตัวอย่างและเปลี่ยน
  const oil = await radioPick('น้ำมันไฮดรอลิก', JOB_OIL_OPTS, k);
  const sp = o.oilSpec || {};
  const grade = dropdown('เบอร์น้ำมัน', sp.grade || '', { placeholder: 'เลือกเบอร์น้ำมัน', state: o.gradeOpen ? 'Focused' : undefined });
  const fields = [grade, field('รหัสน้ำมัน', sp.code, { placeholder: 'ระบุรหัสน้ำมัน' }), field('จำนวน (ลิตร)', sp.litre, { placeholder: '0' })];
  if (k === 1 || k === 2) add(oil, row('Row', fields), 'h');   // เบอร์ รหัส ลิตร เมื่อเปลี่ยนน้ำมัน
  const last = field('เปลี่ยนน้ำมันครั้งล่าสุด', lastOil(CAND[0][0]), { state: 'Readonly' });
  add(oil, MOB ? last : row('Row', [last, frame('Spacer', 'VERTICAL'), frame('Spacer', 'VERTICAL')]), 'h');
  const picked = (o.picked || []).filter(i => i !== 0);
  /* 6 พ.ย. 2569 เจ้าของงาน "อยากเพิ่มการเบิก โดยอยากให้มีการเลือกว่า ว่าเบิกอะใหล่ หรือไม่เบิก ด้วย" + "บังคับให้กรอกอะใหล่ทุกคัน"
     ⇒ Radio text card 2 ใบ "การเบิกอะไหล่" แบบผลการพิจารณา (decisionSection) · ไม่มีค่าเริ่มต้น ต้องเลือกเอง · ไม่เบิก = ซ่อนคลังอะไหล่และรายการอะไหล่อื่นๆ คันนี้ไม่รวมในอะไหล่ในไตรมาส
     ปุ่ม "บันทึกอะไหล่ของรถ" กดได้เมื่อเลือกไม่เบิก หรือเลือกเบิกแล้วมีอะไหล่อย่างน้อย 1 รายการ · o.draw = 'take' | 'none' (เลือกอะไหล่แล้ว = เบิก) */
  const dsel = o.draw === 'none' ? 1 : (o.draw === 'take' || picked.length || (o.manual && o.manual.filled)) ? 0 : -1;
  const drawSec = await radioPick('การเบิกอะไหล่', [['เบิกอะไหล่', 'เลือกอะไหล่ที่ต้องเบิกให้ยานพาหนะคันนี้'], ['ไม่เบิกอะไหล่', 'ยานพาหนะคันนี้ไม่ใช้อะไหล่จากการเบิก']], dsel, { label: true });
  const canSave = dsel === 1 || (dsel === 0 && (picked.length > 0 || !!(o.manual && o.manual.filled)));
  const rows = picked.map(i => [PARTS[i][0], PART_BM[i][0], PART_BM[i][1], PARTS[i][1], String(CAR_QTY[i]), PARTS[i][4], { icons: ['stylus-24-300-round', 'delete-24-300-round'] }])
    .concat(o.manual && o.manual.filled ? [[MANUAL.name, MANUAL_BM.brand, MANUAL_BM.model, MANUAL.code || '-', String(MANUAL.qty), MANUAL_BM.unit, { icons: ['stylus-24-300-round', 'delete-24-300-round'] }]] : []);
  const list = col('Section', [await section('อะไหล่อื่นๆ', { badge: rows.length || null, buttons: [{ kind: 'Secondary button', text: 'ระบุอะไหล่เพิ่มเติม', icon: 'add-24-300-round' }] })], 16);
  add(list, rows.length ? await tblShort(CARP_PART_COLS, rows) : await noParts('เลือกไส้กรองหรืออะไหล่อื่นจากคลัง หรือกดระบุอะไหล่เพิ่มเติม'), 'h');
  add(page, col('Content', [MOB ? f : row('Row', [f, frame('Spacer', 'VERTICAL')]), drawSec, oil].concat(dsel === 0 ? [await carWarehouse(picked), list] : [], [
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกอะไหล่ของยานพาหนะ', { size: 'lg', disabled: !canSave }]])]), 32), 'h');
  if (o.carOpen) comboAt(scr, f.findOne(n => n.name === 'Container') || f, Q_CARS.map(i => [CAND[i][0], '', i === 0]));
  if (o.gradeOpen) comboAt(scr, grade.findOne(n => n.name === 'Container') || grade, OIL_GRADES.map(g => [g, '', g === sp.grade]));
  if (o.manual && !o.manual.filled) await formModal(scr, { title: 'ระบุอะไหล่เพิ่มเติม', fields: MANUAL_FIELDS(o.manual.values || {}), ok: 'เพิ่ม' });
  return scr;
}
/* เมนู … → ดูรายละเอียด (6 พ.ย. 2569) — อะไหล่ของยานพาหนะคันนั้น ดูอย่างเดียว · หน้า Detail ⇒ Section label (R3) + กล่องข้อมูล (R12) แบบหน้ารายละเอียดอื่นของบล็อก
   ข้อมูลชุดเดียวกับหน้าจัดการอะไหล่ (carPartsScreen) · ปุ่ม "แก้ไข" ที่ Page header ไปหน้าจัดการอะไหล่ (แบบ planDetail) · ตารางไม่มีไอคอนท้ายแถว */
async function carPartsView(name, i, o) {
  o = o || {};
  const car = CAND[i], picks = (o.picks || A_PICKS)[i] || [], oil = (o.oils || A_OILS)[i], none = (o.draw || A_DRAW)[i] === 'none';
  const { scr, page } = await shell(name, { title: 'อะไหล่ของยานพาหนะ ' + car[0], back: true, crumbs: ['สร้างแผน', 'อะไหล่ของยานพาหนะ'], actions: [['Secondary button', 'แก้ไข', 'stylus-24-300-round']] });
  const kv = [['ทะเบียน', car[0]], ['ประเภทยานพาหนะ', typeOf(car)], ['ยี่ห้อ/รุ่น', car[1]], ['หน่วยงานเจ้าของยานพาหนะ', car[2]], ['ไตรมาส', 'ไตรมาส ' + ((o.alloc || A_ALL)[i] || '-')],
    ['น้ำมันไฮดรอลิก', oil == null ? TODO_NONE : JOB_OIL_OPTS[oil] + (oil ? ' · ' + OIL_SPEC.grade + ' · ' + OIL_SPEC.litre + ' ลิตร' : '')], ['เปลี่ยนน้ำมันครั้งล่าสุด', lastOil(car[0])], ['การเบิกอะไหล่', none ? 'ไม่เบิกอะไหล่' : 'เบิกอะไหล่']];
  const rows = none ? [] : picks.filter(x => x !== 0).map(x => [PARTS[x][0], PART_BM[x][0], PART_BM[x][1], PARTS[x][1], String(CAR_QTY[x]), PARTS[x][4]]);
  const list = col('Section', [await sectionLabel('อะไหล่อื่นๆ (' + rows.length + ')')], 16);
  add(list, rows.length ? await tblShort(CARP_PART_COLS.slice(0, 6), rows) : await noParts(none ? 'ยานพาหนะคันนี้เลือกไม่เบิกอะไหล่' : 'ยังไม่ได้กำหนดอะไหล่ของยานพาหนะคันนี้'), 'h');
  add(page, col('Content', [await vehicleInfo(kv, 'ข้อมูลยานพาหนะ'), list], 32), 'h');
  return scr;
}
const EDIT_FORM = Object.assign({ edit: true, values: FILLED, alloc: A_ALL, picks: A_PICKS, oils: A_OILS, draw: A_DRAW, q: 1 }, R2);   // prefill แท็บไตรมาส 1 พร้อมสิ่งที่ต้องทำรายคัน (5 พ.ย. 2569)
const EDIT_CONFIRM = { title: 'ยืนยันการแก้ไข', sub: 'แผนจะกลับเป็นสถานะรออนุมัติ และส่งให้ผู้อนุมัติตรวจสอบอีกครั้ง โปรดตรวจสอบก่อนยืนยัน', cancel: 'ยกเลิก', ok: 'ยืนยัน' };
// AREA_CONFIRM (ยืนยันเอารถของเขตที่เอาออก) เลิกใช้ 5 พ.ย. 2569 — รีวิว "หากมีการลบ Filter ใดก็ตาม จะไม่ส่งผลเกี่ยวต่อรถที่ถูกเลือกเข้าในไตรมาส"
// PART_REMOVE_CONFIRM (ยืนยันเอาอะไหล่ออกจากทุกคันในไตรมาส) เลิกใช้ 5 พ.ย. 2569 — อะไหล่ในไตรมาสรวมจากรถทีละคัน ไม่มีไอคอนลบที่แถว แก้ลบอะไหล่ทีละคันที่หน้า S21
const DELETE_CONFIRM = { danger: true, title: 'ยืนยันการลบแผน', sub: 'เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่', cancel: 'ยกเลิก', ok: 'ยืนยัน' };
function planMenu(scr, items) {   // เมนู "…" ตามสถานะแผน · ไลบรารีมีเส้นคั่นก่อนรายการที่ 3 ⇒ น้อยกว่า 3 รายการต้องซ่อนเส้นคั่น
  const m = menuAt(scr, firstMenuCell(scr), items);
  if (!m) return null;   // มือถือ: ไอคอนดู แก้ไข ลบ อยู่บนการ์ดแล้ว ไม่เปิดเมนู (4 พ.ย. 2569)
  if (items.length < 3) { const d = (find(m, 'Menu items') || m).children[3]; if (d) d.visible = false; }
  return m;
}
async function planDetail(name, o) {   // หน้ารายละเอียดแผนฝั่ง กบค. · ก่อนอนุมัติมี ลบแผน + แก้ไข · อนุมัติแล้วเหลือแก้ไข · o.readonly = ไม่มีปุ่ม (S1 รออนุมัติ ดูอย่างเดียว · เจ้าของงาน 5 พ.ย. 2569) · มีอะไหล่ในแผนทุกสถานะ (planBody · 9 พ.ย. 2569)
  o = o || {};
  const st = o.status || 'review';
  let actions = [['Secondary button', 'แก้ไข', 'stylus-24-300-round']];
  if (st !== 'approved') actions.unshift(['Secondary danger button', 'ลบแผน', 'delete-24-300-round']);
  if (o.readonly) actions = null;
  const { scr, page } = await shell(name, { title: 'เลขที่ ' + NP[0], back: true, crumbs: [NP[1]], badge: PST[st], actions });
  const nodes = await planBody({ qBtn: st === 'approved' || st === 'active' });
  if (st === 'returned') nodes.unshift(alertBox(...ALERT_RETURNED));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ทางเข้าหน้าไตรมาส (S6 · 5 พ.ย. 2569 รีวิว "เพิ่ม Flow การเข้าจากหน้า บำรุงรักษาตามวาระ มาจนถึงหน้า แผนเดินทาง") — เจ้าของงานเคาะ: เมนู → รายการแผน → รายละเอียดแผนที่อนุมัติแล้ว → กดไตรมาส 1 → หน้า "ไตรมาส 1"
   หน้ารายละเอียดแผน P (ดำเนินการ) เนื้อหาแบบ planBody: กล่องรายละเอียดแผน + Section label "รถในแผน (n)" + Tabs ไตรมาส + Table · ปุ่มเข้าหน้าไตรมาส = Primary action ของ Section label (Tertiary brand button ของไลบรารี · ชื่อปุ่มเสนอ รอเคาะ)
   รถไตรมาส 1 = 10 คันของ S6 (TRIP_CARS) · ไตรมาสอื่นตามแผน P */
const Q_BTN = { kind: 'Primary button', text: 'ไปหน้า' + NOW_Q, icon: 'keyboard_arrow_right-20-400-round' };   // ปุ่มเข้าหน้าไตรมาส (Tertiary brand button ของ Section label)
const P_Q = (P[9].match(/: (\d+)/g) || []).map(x => +x.slice(2));
const P_COUNTS = [TRIP_CARS.length].concat(P_Q.slice(1));
/* อะไหล่ในแผนของแผน P (E.2 · 9 พ.ย. 2569 เจ้าของงาน "หน้าอื่นที่ต้องมีอะใหล่รวม หรืออะใหล่แต่ละไตรมาส ก็ต้องมี section อะใหล่ด้วยนะ")
   ไตรมาส 1 = PARTS ชุดเดียวกับอะไหล่ในไตรมาส 1 ของหน้าไตรมาส · ไตรมาส 2–4 ค่าสมมติตามสัดส่วนจำนวนยานพาหนะ (แผน P มีข้อมูลรายคันแค่ไตรมาส 1) · รวมทุกไตรมาส = ผลรวม 4 แท็บ */
const pQty = (k) => PARTS.map(p => Math.round(+p[3] * P_COUNTS[k - 1] / P_COUNTS[0]));
const pQParts = (k) => {
  const qty = k ? pQty(k) : PARTS.map((_, x) => [1, 2, 3, 4].reduce((a, j) => a + pQty(j)[x], 0));
  return PARTS.map((p, x) => [p[0], p[1], p[2], String(qty[x]), p[4]]).filter(r => +r[3] > 0).sort((a, b) => a[2].localeCompare(b[2], 'th'));
};
async function planDetailQ(name, o) {   // แผนที่อนุมัติแล้ว · แท็บ รายละเอียดแผน / ต้นทุนการบำรุงรักษา (S18 · 10 พ.ย. 2569) · o.tab · o.empty
  o = o || {};
  const counts = P_COUNTS, tab = o.tab || 0;
  const { scr, page } = await shell(name, { title: 'เลขที่ ' + P[0], back: true, crumbs: [P[1]], badge: PST.active, actions: tab === 1 && !o.empty ? [COST_EXPORT_BTN] : undefined });
  add(page, await tabs(PLAN_TABS.map(t => [t, null]), tab), 'h');
  if (tab === 1) { add(page, col('Content', await costBody(o), 32), 'h'); return scr; }
  add(page, col('Content', [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ยานพาหนะในแผน', { badge: counts.reduce((a, b) => a + b, 0), buttons: [Q_BTN] }),
      await tabs(QUARTERS.map((t, k) => [t, counts[k]]), 0),
      await tblShort(CARP_COLS.slice(0, 6), TRIP_CARS.map((c, i) => [c[0], c[1], c[2], JOB_OIL_OPTS[TRIP_OIL[i]], lastOil(c[0]), (i % 4) + 1 + ' รายการ']))], 16),
    await planPartsSec(0, pQParts)], 32), 'h');
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
    col('Section', [await sectionLabel('รายการอะไหล่ที่ต้องใช้', { badge: PARTS.length }), await tblShort(PART_CHECK_COLS, partCheckRows())], 16)];
  if (o.po) nodes.push(col('Section', [await sectionLabel('ใบสั่งซื้ออะไหล่ (PO)'), kv(PO_KV), await tblShort([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 100], ['หน่วย', 90], ['ราคาต่อหน่วย', 150], ['รวม', 150]], PO_ITEMS)], 16));
  else if (job) nodes.push(alertBox(o.sent ? 'Info' : 'Brand', o.sent ? 'ส่งรายการอะไหล่ให้หัวหน้า ผพจ. ตรวจสอบแล้ว' : 'ออกเลขงาน ' + job + ' แล้ว', o.sent ? 'หัวหน้า ผพจ. อนุมัติแล้วจึงทำเรื่องซื้ออะไหล่และออกใบ PO' : 'ส่งรายการอะไหล่ให้หัวหน้า ผพจ. ตรวจสอบก่อนจัดซื้อ'));
  if (job && !o.sent && !o.po) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งให้หัวหน้า ผพจ. ตรวจสอบ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
async function headPartCheck(name) {   // หัวหน้า ผพจ. ตรวจรายการอะไหล่
  const { scr, page } = await shell(name, { title: 'ตรวจรายการอะไหล่ · ' + NO_NEW, back: true, crumbs: ['รายการอะไหล่รอตรวจ', NO_NEW], badge: ['รอหัวหน้า ผพจ. ตรวจ', 'Warning'] });
  add(page, col('Content', [await vehicleInfo(npKv(NO_NEW), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('รายการอะไหล่ที่จะใช้ในแผน', { badge: PARTS.length }), await tblShort(PART_CHECK_COLS, partCheckRows()),
      alertBox('Warning', 'ต้องซื้อเพิ่ม 2 รายการ รวม ' + baht(PO_TOTAL), 'ไส้กรองไฮดรอลิก 9 ชิ้น · ไส้กรองเชื้อเพลิง 14 ชิ้น')], 16),
    btnRow([['Secondary button', 'ส่งกลับ', { size: 'lg' }], ['Primary button', 'อนุมัติรายการอะไหล่', { size: 'lg' }]])], 32), 'h');
  return scr;
}
async function poForm(name) {   // ฟอร์มใบ PO — ช่องทั้งหมดยังไม่รู้ (ไฟล์ 14 S3) ใช้ชุดที่เสนอ
  const { scr, page } = await shell(name, { title: 'บันทึกใบสั่งซื้ออะไหล่ (PO)', back: true, crumbs: ['หมายเลขแผน ' + NO_NEW, 'ใบ PO'] });
  add(page, col('Content', [
    col('Section', [await section('ข้อมูลใบสั่งซื้อ'), row('Row', [field('เลขที่ PO', PO_KV[0][1]), field('วันที่ PO', PO_KV[1][1])]),
      row('Row', [dropdown('ผู้ขาย', PO_KV[2][1], { lead: 'search-24-300-round' }), field('วงเงิน (บาท)', PO_TOTAL.toLocaleString('en-US'))])], 16),
    col('Section', [await section('รายการอะไหล่ที่สั่งซื้อ', { badge: PO_ITEMS.length }), await tblShort([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 100], ['หน่วย', 90], ['ราคาต่อหน่วย', 150], ['รวม', 150]], PO_ITEMS)], 16),
    col('Section', [await section('เอกสารแนบ'), await upload('ใบสั่งซื้อ (PO)', [pdf('PO-2570-0158.pdf', '310 KB')], { hint: 'PDF, JPG · สูงสุด 10 ไฟล์' })], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกใบ PO', { size: 'lg' }]])], 32), 'h');
  return scr;
}

/* ---------- S7 ผู้รับจ้างทำแผนเดินทาง · S8 กบค. ตรวจแผนเดินทางของผู้รับจ้าง ---------- */
const HIRE = PLANS[1];   // แผนที่ว่าจ้าง (MRZ7000002 รถเครน ภาค 2)
const CONTRACTOR = 'บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด';
const TRIP_ST = { none: ['ยังไม่สร้าง', 'Gray'], wait: ['รอหน่วยงานตรวจสอบ', 'Warning'], ok: ['อนุมัติแล้ว', 'Success'], rej: ['ปฏิเสธ', 'Error'] };
const HTRIP = { place: 'จุดรวมงาน กฟฉ.2 อุบลราชธานี', d1: '10/11/2569', d2: '13/11/2569' };
const JOBS_COLS = [['เลขที่ MR', 140, 'Lead text'], ['แผน', 0], ['ไตรมาส', 100], ['จำนวนยานพาหนะ', 110], ['แผนเดินทาง', 180, 'Badge'], ['', 60]];
const jobsRows = (st) => [[HIRE[0], HIRE[1], HIRE[3], HIRE[4] + ' คัน', { pill: TRIP_ST[st] }, GO], ['MRZ6900014', 'บำรุงรักษารถพ่วงฉีดน้ำ ภาค 2 ปีงบประมาณ 2569', 'ไตรมาส 4', '5 คัน', { pill: TRIP_ST.ok }, GO]];
async function hireTripForm(name, o) {   // ช่องเดียวกับ S6 ยกเว้นพนักงาน กบค. และค่าใช้จ่าย (ไฟล์ 14 S7)
  o = o || {};
  const v = o.filled ? HTRIP : {}, E = (m) => o.errors ? m : '';
  const { scr, page } = await shell(name, { title: 'สร้างแผนเดินทาง', back: true, crumbs: ['งานที่ได้รับว่าจ้าง', HIRE[0], 'สร้างแผนเดินทาง'] });
  const sel = o.filled ? [0, 1, 4] : [];
  const car = await carPick('เลือกยานพาหนะที่จะบำรุงรักษา', CARS, sel, { error: sel.length ? '' : E('กรุณาเลือกยานพาหนะที่จะบำรุงรักษาอย่างน้อย 1 คัน') });
  add(page, col('Content', [await vehicleInfo([['เลขที่ MR', HIRE[0]], ['แผน', HIRE[1]], ['ไตรมาส', HIRE[3]], ['ผู้รับจ้าง', CONTRACTOR]], 'งานที่ได้รับว่าจ้าง'),
    col('Section', [await section('รายละเอียดแผนเดินทาง'), row('Row', [
      dropdown('สถานที่บำรุงรักษา (จุดรวมงาน)', v.place, { placeholder: 'ค้นหาจุดรวมงาน', lead: 'search-24-300-round', error: E('กรุณาเลือกสถานที่บำรุงรักษา') }),
      field('วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม') }), field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') })])], 16),
    car.sec,
    alertBox('Info', 'ยืนยันแล้วระบบส่งแผนให้หน่วยงานตรวจสอบ และแจ้งเจ้าของยานพาหนะ + กรย.', 'ส่งแจ้งเตือนก่อนหรือหลังหน่วยงานอนุมัติ ยังไม่เคาะ'),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันและส่งให้หน่วยงานตรวจสอบ', { size: 'lg' }]])], 32), 'h');
  return scr;
}
const HT_COLS = [['ผู้รับจ้าง', 0, 'Lead text'], ['แผน', 150], ['ยานพาหนะ (คัน)', 100], ['จุดรวมงาน', 260], ['ช่วงวัน', 220], ['วันที่ส่ง', 120], ['', 60]];
const HT_ROWS = { wait: [[CONTRACTOR, HIRE[0], '3', HTRIP.place, HTRIP.d1 + ' – ' + HTRIP.d2, '24/10/2569', GO], ['หจก. ช่างกลภาคอีสาน', 'MRZ7000005', '4', 'จุดรวมงาน กฟฉ.3 นครราชสีมา', '17/11/2569 – 20/11/2569', '25/10/2569', GO]],
  ok: [[CONTRACTOR, 'MRZ6900014', '5', 'จุดรวมงาน กฟฉ.2 อุบลราชธานี', '05/08/2569 – 08/08/2569', '20/07/2569', GO]], rej: [] };
async function hireTripReview(name, o) {   // กบค. ดูรายละเอียดแผนเดินทางของผู้รับจ้าง
  o = o || {};
  const { scr, page } = await shell(name, { title: 'แผนเดินทาง · ' + CONTRACTOR, back: true, crumbs: ['แผนเดินทางผู้รับจ้าง', HIRE[0]], badge: TRIP_ST[o.st || 'wait'] });
  const nodes = [await vehicleInfo([['ผู้รับจ้าง', CONTRACTOR], ['เลขที่ MR', HIRE[0]], ['แผน', HIRE[1]], ['วันที่ส่ง', '24/10/2569'], ['จุดรวมงาน', HTRIP.place], ['ช่วงวันเดินทาง', HTRIP.d1 + ' – ' + HTRIP.d2], ['ยานพาหนะในแผนเดินทาง', '3 คัน']], 'รายละเอียดแผนเดินทาง'),
    col('Section', [await sectionLabel('ยานพาหนะที่จะบำรุงรักษา', { badge: 3 }), await tblShort([['ทะเบียน', 170, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของยานพาหนะ', 220]], [0, 1, 4].map(i => [VEH[i][0], VEH[i][1], VEH[i][2]]))], 16),
    btnRow([['Secondary button', 'ปฏิเสธ', { size: 'lg' }], ['Primary button', 'อนุมัติแผนเดินทาง', { size: 'lg' }]])];
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S9 กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน ---------- */
const PREP = { new: ['ยังไม่รับทราบ', 'Gray'], ack: ['รับทราบแล้ว', 'Info'], ready: ['เตรียมแล้ว', 'Success'] };
const PREP_COLS = [['เลขที่ MR', 140, 'Lead text'], ['ผู้ดำเนินการ', 0], ['จุดรวมงาน', 260], ['วันเดินทาง', 140], ['สถานะ', 160, 'Badge'], ['', 60]];
const prepRows = (st) => [[P[0], UNITS[0] + ' (ตรวจเอง)', TRIP.place, TRIP.d1, { pill: PREP[st] }, GO], [HIRE[0], CONTRACTOR, HTRIP.place, HTRIP.d1, { pill: PREP.new }, GO]];
async function prepDetail(name, o) {
  o = o || {};
  const st = o.st || 'new';
  const { scr, page } = await shell(name, { title: 'เตรียมอะไหล่ · ' + P[0], back: true, crumbs: ['แผนเดินทางที่ต้องเตรียมอะไหล่', P[0]], badge: PREP[st] });
  const nodes = [await vehicleInfo([['เลขที่ MR', P[0]], ['ผู้ดำเนินการ', UNITS[0] + ' (ตรวจเอง)'], ['จุดรวมงาน', TRIP.place], ['ช่วงวันเดินทาง', TRIP.d1 + ' – ' + TRIP.d2]], 'แผนเดินทาง'),
    col('Section', [await sectionLabel('อะไหล่ที่ต้องวางที่จุดรวมงาน', { badge: PARTS.length }), await tblShort([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 110], ['หน่วย', 90], ['คลัง', 180]], PARTS.map((p, i) => [p[0], p[1], p[3], p[4], WH[i]]))], 16)];
  if (st === 'ready') nodes.push(alertBox('Success', 'เตรียมอะไหล่ไว้ที่จุดรวมงานแล้ว 02/11/2569', 'หน่วยงานเห็นสถานะนี้ที่แผนเดินทาง (S6/S10)'));
  else if (st === 'ack') nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกว่าเตรียมแล้ว', { size: 'lg' }]]));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบแผน', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S13 ผู้ดูแลยานพาหนะ รับทราบผลและประเมินความพึงพอใจรายคัน (เจ้าของงาน 10 พ.ย. 2569) ----------
   Q23 "มีแค่ปุ่มยอมรับ เหมือนปุ่มรับทราบ" · Q19 "บำรุงรักษาไม่ได้ ใช้ฟอร์มเดียวกัน" · Q28 "รอบเดียวพอ คือรอบที่ส่งรายคัน หลังจากบำรุงเสร็จ" (S14 S15 ตัดออก)
   ผู้กด = ผู้มีชื่อเป็นผู้ดูแลยานพาหนะในแผนเดินทาง แม้เจ้าของแผนกับเจ้าของยานพาหนะเป็นหน่วยงานเดียวกัน ("คนทำแผนกับคนปฏิบัติอาจจะเป็นคนละคน") · แจ้งเตือนเรื่องยานพาหนะส่งถึงผู้ดูแลยานพาหนะ
   ประเมินความพึงพอใจรายคันย้ายจาก S14 มาไว้ตอนรับทราบ · ปุ่ม "รับทราบ" สีเขียว ("อยากใช้คำกลางๆ แล้วเปลี่ยนสี เป็นสีเขียว") กดแล้วปุ่มหาย เหลือป้าย "รับทราบแล้ว" ไม่มี popup ยืนยัน
   ผลที่แสดง = ที่ผู้ดำเนินการบันทึกใน S10 (ข้อมูลงาน · ผลตรวจสภาพ Step 1 + ลงนาม · ภาพ · งานและอะไหล่ที่ใช้จริง) แทนไฟล์ PDF แบบเดิม · คันที่บำรุงรักษาไม่ได้ = ฟอร์มเดียวกัน ส่วนสาเหตุแทนผลงาน ไม่มีประเมิน (เสนอ ยังไม่เคาะ) */
const ACC_COLS = [['ทะเบียน', 0, 'Lead text'], ['วันดำเนินการ', 140], ['ผู้ดำเนินการ', 220], ['แผนเดินทาง', 260], ['สถานะ', 160, 'Badge'], ['', 60]];
const ACK_CARS = [JOB_I, TRIP_1.sel[1], TRIP_1.sel[2]];   // ยานพาหนะที่ผู้ดูแลคนนี้ดูแล (ตัวอย่าง) · sel[2] = MOVE_I คันที่บำรุงรักษาไม่ได้ (ประกาศทีหลัง)
const ACK_LIST = 'ผลการบำรุงรักษารอรับทราบ';
const accRows = (o) => {
  o = o || {};
  return ACK_CARS.map((i, k) => { const c = TRIP_CARS[i]; return [{ text: c[0], sub: typeOf(c) }, '0' + (4 + k) + '/11/2569', { text: TRIP.staff[k % TRIP.staff.length], sub: UNITS[0] },
    { text: JOB_T.name, sub: P[0] }, { pill: (o.accepted || []).indexOf(k) >= 0 ? ACC.ok : ACC.wait }, GO]; });   // คันที่บำรุงรักษาไม่ได้ก็รอรับทราบเหมือนกัน (Q19 ฟอร์มเดียวกัน)
};
const ackList = (name, o) => roleList(name, { title: ACK_LIST, search: 'ค้นหาทะเบียน, แผนเดินทาง', cols: ACC_COLS, rows: accRows(o) });
const NOTI_ACK = ['Brand', 'ปิดงานบำรุงรักษา ' + TRIP_CARS[JOB_I][0] + ' แล้ว รอผู้ดูแลยานพาหนะรับทราบผลและประเมินความพึงพอใจ', '5 นาทีที่แล้ว'];
let ACK_VAR;
async function ackRow(off) {   // ย้อนกลับ + รับทราบ (เขียว) — Primary button ของไฟล์ Component พื้นผูกตัวแปร Color/surface/success (#17B26A) + ไอคอนนำ check-24-300-round
  // ตามปุ่ม "ตรวจแล้ว" / "ขึ้น SAP แล้ว" ของหน้า 5.14 - 5.15 Cost & Expense Check · UI Release#2 · Disabled (ยังไม่ประเมิน) = State=Disabled ของไลบรารี ไม่ทาเขียว
  const r = btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบ', { size: 'lg', icon: 'check-24-300-round', disabled: !!off }]]);
  const b = r.children.find(c => c.name === 'Primary button');
  if (b && !off) {
    if (ACK_VAR === undefined) ACK_VAR = await libVar(/^Color\/surface\/success$/i);
    let paint = { type: 'SOLID', color: rgbOf('#17B26A') };
    if (ACK_VAR) try { paint = figma.variables.setBoundVariableForPaint(paint, 'color', ACK_VAR); } catch (e) { /* ใช้ค่าสี */ }
    try { b.fills = [paint]; } catch (e) { warn('สีปุ่มรับทราบ', e); }
  }
  return r;
}
async function ackResult(name, o) {   // o.cannot · o.done = รับทราบแล้ว · o.viewOnly = บทบาทอื่นเปิดดู (ไม่มีปุ่มรับทราบ)
  o = o || {};
  const i = o.cannot ? MOVE_I : JOB_I, c = TRIP_CARS[i];
  const { scr, page } = await shell(name, { title: 'ผลการบำรุงรักษา · ' + c[0], back: true, crumbs: [ACK_LIST, c[0]], badge: o.done ? ACC.ok : ACC.wait });   // คันที่บำรุงรักษาไม่ได้ก็รอรับทราบ (สาเหตุอยู่ในเนื้อหา)
  const job = o.cannot ? [['วันดำเนินการ', TRIP_1.d1], ['ผู้แจ้ง', JOB_BY], ['แจ้งเมื่อ', '05/11/2569 09:20 น.']]
    : [['วันดำเนินการ', '04/11/2569'], ['เริ่มงาน', JOB_START], ['ปิดงาน', JOB_END], ['ผู้ดำเนินการ', JOB_BY], ['น้ำมันไฮดรอลิก', JOB_OIL_OPTS[JOB_OIL]], ['เลขไมล์หลังทำ', '182,640 กม.']];
  const nodes = [await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภทยานพาหนะ', typeOf(c)], ['หน่วยงานเจ้าของยานพาหนะ', c[2]], ['แผนเดินทาง', JOB_T.name], ['เลขที่ MR', P[0]],
    ['ผู้ดูแลยานพาหนะ', tripCtrl(i, TRIP_1.phones)]].concat(job).concat(o.done ? [['รับทราบเมื่อ', '06/11/2569 10:05 น.']] : []), 'ข้อมูลยานพาหนะและงาน')];
  if (o.cannot) nodes.push(col('Section', [await sectionLabel('สาเหตุที่บำรุงรักษาไม่ได้'), kv([['สาเหตุ', JOB_CANNOT], ['ผู้บันทึก', JOB_BY], ['วันที่บันทึก', '05/11/2569']])], 16));
  else {
    nodes.push(col('Section', [await sectionLabel('ผลการตรวจสภาพก่อนบำรุงรักษา')].concat(await inspectStep(c, true, true)), 16),
      await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
      col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tblShort(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16),
      );   // 11 พ.ย. 2569 รอบต่อมา: ไม่มีการประเมินในหน้านี้แล้ว · 12 พ.ย. 2569 แบบประเมินความพึงพอใจเป็นเรื่องแยก (satisfaction-plugin R105 · Diagram/09-ประเมินความพึงพอใจ)
  }
  if (!o.done) nodes.push(o.viewOnly ? btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }]]) : await ackRow(false));   // รับทราบอย่างเดียว กดได้ทันที (11 พ.ย. 2569) · บทบาทอื่น = ย้อนกลับอย่างเดียว (Permission S13)
  /* 12 พ.ย. 2569 รอบ 2 (ตามต้นแบบเว็บ acceptance/car/page.tsx · BACKLOG ข้อ 77): รับทราบแล้ว (ผู้ดูแลยานพาหนะ · ไม่ใช่คันที่บำรุงรักษาไม่ได้ · ยังไม่ได้ประเมิน) ปุ่ม Primary "ประเมินความพึงพอใจ" แทนที่ปุ่มรับทราบ
     → ฟอร์มประเมินของงานนี้ในเมนูแบบประเมินความพึงพอใจ (satisfaction-plugin B.1) · ประเมินแล้วปุ่มหาย · ตาม Primary button ของไฟล์ Component + แถวปุ่มท้ายหน้าแบบหน้า 5.14 - 5.15 Cost & Expense Check ของ UI Release#2 (ปุ่มรับทราบเดิม) */
  else if (!o.viewOnly && !o.cannot) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ประเมินความพึงพอใจ', { size: 'lg', icon: has('star-24-300-round') ? 'star-24-300-round' : null }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
/* ---------- S27 แบบประเมินความพึงพอใจ (บล็อก Y เดิม · R94 11 พ.ย. 2569) ย้ายออก 12 พ.ย. 2569 ----------
   เจ้าของงาน 12 พ.ย. 2569 "เรื่องการประเมินเป็นเรื่องแยกที่จะไปผูกตาม flow ต่างๆ เลยอยากแยกใว้" ⇒ ปลั๊กอินแยก figma-export/satisfaction-plugin/ (R105)
   เอกสาร Diagram/09-ประเมินความพึงพอใจ/ · ยานพาหนะที่ผู้ดูแลรับทราบผลแล้ว (S13) เข้ารายการยังไม่ได้ประเมินของเรื่องนั้น 1 งาน 1 แถว · ตัวอักษร Y ว่าง (BLOCK_OF) */
/* planEvidence (S14 หลักฐานทั้งแผน + ยอมรับผลทั้งแผน) เอาออก 10 พ.ย. 2569 — S14 ตัดออก ประเมินย้ายไป S13 รายคัน */

/* S16 headHistory (หัวหน้าหน่วยงาน ตรวจประวัติ) เอาออก 10 พ.ย. 2569 — S16 ตัดออก */

/* ---------- S25 กบค. ย้ายรถที่บำรุงรักษาไม่ได้ไปไตรมาสอื่น (เจ้าของงาน 5 พ.ย. 2569) ----------
   เจ้าของงาน: "จะเรื่องรถที่บำรุงไม่ได้ ต้องมีหน้าที่สามารถเอาไปใส่ในไตรมาสอื่นๆได้ด้วย ช่วยออกแบบ scen นี้ให้หน่อย คือ scen ที่รถออกนอกจากไตรมาสเดิม เลือกเข้าไตรมาสใหม่"
   ทางเข้า = หน้าไตรมาส (S6 tripList) แถวรถที่สถานะงาน "บำรุงรักษาไม่ได้" (Table cell Badge WSTAT.cannot แทนชื่อแผนเดินทาง) + ปุ่ม "…" เมนูเดียว "ย้ายไปไตรมาสอื่น"
     ตาม Dropdown menu เมนูเดียว "คืนยานพาหนะ" ของ Request list หน้า 5.10 Vehicle In Use (EV) ของ UI Release#2 · ไอคอนรถสลับ แบบปุ่ม "โอนย้ายสังกัด" หน้า 5.4 Maintenance Appointment (Admin)
   มือถือ = Mobile table item Style=Action buttons ปุ่มเดียว (การ์ด Incident list v1 หน้า Vehicle Breakdown ของ UI Release#2 "ดูรายละเอียด") — ไอคอนดู แก้ไข ลบ (R50) ไม่มีช่องให้คำนี้
   ไตรมาส 4 (ไตรมาสสุดท้ายของแผน) = รายการเมนู _Dropdown menu item State=Disabled · ปุ่มบนการ์ด Secondary button State=Disabled (ไลบรารีมี Disabled ทั้งคู่ ⇒ แสดงแต่กดไม่ได้ ไม่ซ่อน)
   popup = popupModal แบบ popup บำรุงรักษาไม่ได้ (S10): ข้อมูลรถ + สาเหตุ (Content item row) · Radio text card ไตรมาส 1–4 เรียงลงแบบ popup จัดลงไตรมาส (S1) ไตรมาสก่อนหน้าและไตรมาสปัจจุบัน State=Disabled · ตารางอะไหล่ตามแผนที่ย้ายไปด้วย
   ยืนยัน = confirm แบบ EDIT_CONFIRM · สำเร็จ = กลับหน้าไตรมาสเดิม รถคันนั้นออกจากตาราง + toast ขวาบน (R60) · ไตรมาสใหม่ รถขึ้นก่อน บรรทัดรอง "ย้ายมาจากไตรมาส 1" ยังไม่มีแผนเดินทาง · ไม่ต้องอนุมัติใหม่ (ตามเพิ่มรถเข้าไตรมาส) */
const MOVE_ICON = 'swap_driving_apps_wheel-24-300-round';
const MOVE_ITEM = ['ย้ายไปไตรมาสอื่น', MOVE_ICON];
/* 10 พ.ย. 2569 เจ้าของงาน "s25 ตัวเลือกต้องสามารถเลือก ดำเนินการบำรุงรักษา และ ย้ายไปไตรมาสอื่น" + เคาะ "กลับเป็นรอเข้าแผนเดินทางในไตรมาสเดิม"
   ⇒ เมนู "…" ของยานพาหนะที่บำรุงรักษาไม่ได้มี 2 รายการ · ดำเนินการบำรุงรักษา = ยืนยัน แล้วยานพาหนะกลับเป็น "ยังไม่มีแผนเดินทาง" ในไตรมาสเดิม ใส่แผนเดินทางใบใหม่แล้วบำรุงรักษาตามปกติ (S6 S10) */
const MAINT_ITEM = ['ดำเนินการบำรุงรักษา', 'car_repair-24-300-round'];
const MAINT_CONFIRM = () => ({ title: 'ยืนยันดำเนินการบำรุงรักษา · ' + MOVE_CAR[0], sub: MOVE_CAR[0] + ' จะกลับเป็นยานพาหนะที่ยังไม่มีแผนเดินทางใน' + NOW_Q + ' เพื่อเพิ่มเข้าแผนเดินทางแล้วบำรุงรักษาตามปกติ', cancel: 'ยกเลิก', ok: 'ยืนยัน' });   // ฟังก์ชัน: MOVE_CAR ประกาศทีหลัง
const MAINT_TOAST = () => 'นำ ' + MOVE_CAR[0] + ' กลับมาบำรุงรักษาใน' + NOW_Q + ' แล้ว';
const MOVE_I = TRIP_1.sel[2], MOVE_CAR = TRIP_CARS[MOVE_I];   // คันที่บำรุงรักษาไม่ได้ใน S10 (JOB_MIX) = 80-9981 ลำปาง
const MOVE_JOB = { [MOVE_CAR[0]]: 'cannot' };
const qName = (k) => QUARTERS[k].split(' (')[0];   // ลำดับ 0–3 → "ไตรมาส n"
const MOVE_TO = 1;   // ตัวอย่างเลือกไตรมาส 2
const MOVE_TOAST = 'ย้ายยานพาหนะ ' + MOVE_CAR[0] + ' ไป' + qName(MOVE_TO) + ' สำเร็จ';
const MOVE_CONFIRM = (k) => ({ title: 'ยืนยันการย้ายยานพาหนะไป' + qName(k), sub: MOVE_CAR[0] + ' จะออกจาก' + NOW_Q + ' ไปอยู่' + qName(k) + ' ของแผนนี้ พร้อมอะไหล่ตามแผนของยานพาหนะคันนี้', cancel: 'ยกเลิก', ok: 'ยืนยัน' });
/* อะไหล่ที่ย้ายไปด้วย (10 พ.ย. 2569) = ตาราง QPART_COLS ชุดเดียวกับอะไหล่ในไตรมาส n ที่รับยอดนี้ไป (R81 · เดิม 3 คอลัมน์ อะไหล่ตามแผน จำนวนตามแผน หน่วย) · แถวตาม WORK ของยานพาหนะคันที่ย้าย */
const movePartRows = () => WORK.map((w, k) => { const p = PARTS[MOVE_PART_OF[k]] || [w[1], '-', '-']; return [p[0], p[1], p[2], w[2], w[4]]; });
/* รถเดิมของไตรมาส 2 (P_Q[1] = 3 คัน · ค่าสมมติ) ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · เบอร์ · ชื่อผู้ดูแลยานพาหนะ */
const MOVE_Q2 = [['81-7702 ลำปาง', 'Isuzu FTR + กระเช้า Aichi SK12A', 'กฟน.1 ลำปาง', '054-217-411', 'นายไพโรจน์ ดวงใจ'], ['82-5530 เชียงราย', 'Hino FC + กระเช้า Tadano AT-100', 'กฟน.1 เชียงราย', '053-711-930', 'นายศักดิ์ชัย ทองแท้'],
  ['80-1189 น่าน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.2 น่าน', '054-710-551', 'นายมานพ ศรีเมือง']];
const MOVE_Q3_OTHER = ['81-3348 พะเยา', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.1 พะเยา', '054-411-206', 'นายเอกชัย พรหมมา'];
const moveTrip = (k, d1, d2) => ({ name: 'ตรวจยานพาหนะ ลำปาง ' + qName(k), sel: [MOVE_I], locs: {}, phones: {}, d1, d2, st: 'approved' });
const MOVE_T3 = moveTrip(2, '12/05/2570', '14/05/2570'), MOVE_T4 = moveTrip(3, '07/07/2570', '09/07/2570');   // กรณีรถคันเดียวกันบำรุงรักษาไม่ได้ในไตรมาส 3 / 4
/* อะไหล่ที่ต้องเบิกของไตรมาส 2 หลังย้าย = ของรถเดิม 3 คัน (ค่าสมมติ) + อะไหล่ตามแผนของรถที่ย้ายมา (WORK) · บรรทัดรองบอกส่วนที่มากับรถ */
const MOVE_Q2_BASE = [30, 6, 6, 6, 2];
const MOVE_PART_OF = WORK.map(w => PARTS.findIndex(p => p[0] === w[1]));
const MOVE_Q2_QTY = MOVE_Q2_BASE.map((n, i) => { const k = MOVE_PART_OF.indexOf(i); return n + (k >= 0 ? +WORK[k][2] : 0); });
const MOVE_Q2_SUBS = Object.fromEntries(MOVE_PART_OF.map((i, k) => [i, 'รวม ' + WORK[k][2] + ' ' + WORK[k][4] + ' ของ ' + MOVE_CAR[0] + ' ที่ย้ายมา']));
/* 9 พ.ย. 2569 (เว็บเจอตอนตาม Figma): X.8 กับ X.9 เป็นหน้าไตรมาส 2 หน้าเดียวกัน ⇒ ยานพาหนะและอะไหล่ในไตรมาสชุดเดียวกัน (MOVE_Q2_QTY · เดิม X.8 ใช้ยอดไตรมาส 1 ของ PARTS · X.9 เรียก moveQuarter(…, 2) ได้หน้าไตรมาส 3)
   ไตรมาส 3 และ 4 (กรณี X.5 X.10) = อะไหล่ตามแผนของยานพาหนะคันที่ย้าย (WORK) + ไส้กรอง 3 รายการของ 81-3348 พะเยา ในไตรมาส 3 (ค่าสมมติ) */
const MOVE_Q2_PAGE = { q: qName(MOVE_TO), cars: [[MOVE_CAR.concat([OWNER_PH[MOVE_I], CTRL_NAME[MOVE_I]]), -1]].concat(MOVE_Q2.map(c => [c, -1])), subs: { [MOVE_CAR[0]]: 'ย้ายมาจาก' + NOW_Q }, parts: { qty: MOVE_Q2_QTY, subs: MOVE_Q2_SUBS } };
const MOVE_CAR_QTY = PARTS.map((_, i) => { const k = MOVE_PART_OF.indexOf(i); return k >= 0 ? +WORK[k][2] : 0; });
const MOVE_Q3_QTY = MOVE_CAR_QTY.map((n, i) => n + (CAR_PICK.indexOf(i) >= 0 ? CAR_QTY[i] : 0));
function moveMenu(scr, row, off) {   // เมนู "…" ใต้ปุ่มของแถวที่ row (ลำดับแถวในตารางรถของไตรมาส) · off = ไตรมาสสุดท้าย รายการกดไม่ได้
  const cells = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Table cell' && n.variantProperties && n.variantProperties.Style === 'Action icons');
  const m = menuAt(scr, cells[row], [MAINT_ITEM, MOVE_ITEM]);   // 10 พ.ย. 2569 ดำเนินการบำรุงรักษา + ย้ายไปไตรมาสอื่น
  if (!m) return null;   // มือถือ: ปุ่มอยู่บนการ์ดแล้ว (moveCard)
  const list = (find(m, 'Menu items') || m).children;
  if (list[3]) list[3].visible = false;   // 2 รายการ ไม่มีเส้นคั่น (แบบ planMenu)
  if (off && list[1]) setProps(list[1], { State: 'Disabled' });   // ไตรมาส 4: ย้ายไม่ได้ แต่ดำเนินการบำรุงรักษาได้
  return m;
}
function moveCard(scr, row, off) {   // มือถือ: ช่องท้ายการ์ดของแถว row → Style=Action buttons ปุ่มเดียว "ย้ายไปไตรมาสอื่น"
  const box = scr.findOne(n => n.type === 'FRAME' && n.name === 'Mobile table');
  const card = box && box.children[row]; if (!card) return;
  const it = card.children.filter(c => c.name === 'Mobile table item').pop(); if (!it) return;
  setProps(it, { Style: 'Action buttons' });
  setProps(it, { 'Action 2': true, 'Action 3': false, 'Action 4': false });   // 10 พ.ย. 2569 2 ปุ่ม ดำเนินการบำรุงรักษา · ย้ายไปไตรมาสอื่น
  const bs = it.findAll(n => n.type === 'INSTANCE' && n.name === 'Secondary button');
  if (bs[0]) setProps(bs[0], { Text: MAINT_ITEM[0], 'Leading icon': true, 'Leading icon swap': icon(MAINT_ITEM[1]), 'Trailing icon': false, State: 'Default' });
  if (bs[1]) setProps(bs[1], { Text: MOVE_ITEM[0], 'Leading icon': true, 'Leading icon swap': icon(MOVE_ICON), 'Trailing icon': false, State: off ? 'Disabled' : 'Default' });
}
/* popup ย้ายไปไตรมาสอื่น · o.cur = ไตรมาสปัจจุบัน (0–3) · o.sel = ไตรมาสที่เลือก (-1 ยังไม่เลือก · ปุ่ม Disabled) · o.trip = แผนเดินทางที่บำรุงรักษาไม่ได้ */
async function moveModal(scr, o) {
  const cur = o.cur || 0, sel = o.sel == null ? -1 : o.sel;
  // 10 พ.ย. 2569 + ประเภทยานพาหนะต่อจากทะเบียน (R82 ทุกที่ที่แสดงยานพาหนะมีประเภท · แบบตอนตรวจตามประเภท R86)
  const info = kv([['ทะเบียน', MOVE_CAR[0]], ['ประเภทยานพาหนะ', typeOf(MOVE_CAR)], ['หน่วยงานเจ้าของยานพาหนะ', MOVE_CAR[2]], ['แผนเดินทาง', (o.trip || JOB_T).name], ['สาเหตุที่บำรุงรักษาไม่ได้', JOB_CANNOT]], 2);
  const r = col('Radio', [], 12);
  QUARTERS.forEach((t, k) => add(r, inst('Radio text card', { State: k <= cur ? 'Disabled' : 'Default', Selected: k === sel ? 'True' : 'False' },
    { Text: t, Supporting: true, 'Supporting text': k < cur ? 'ไตรมาสก่อนหน้า' : k === cur ? 'ไตรมาสปัจจุบัน' : 'ยานพาหนะในไตรมาส ' + P_Q[k] + ' คัน' }), 'h'));
  const parts = col('Section', [await section('อะไหล่ตามแผนที่ย้ายไปด้วย', { badge: WORK.length }), await tblShort(QPART_COLS, movePartRows())], 16);
  await popupModal(scr, { title: 'ย้ายไปไตรมาสอื่น · ' + MOVE_CAR[0], sub: 'ยานพาหนะและอะไหล่ตามแผนของยานพาหนะคันนี้จะย้ายไปไตรมาสที่เลือก', w: 800, ok: 'ย้ายยานพาหนะ', okOff: sel < 0,
    body: [info, col('Section', [await section('เลือกไตรมาสที่จะย้ายไป'), r], 16), parts] });
}
/* หน้าไตรมาสของ S25: q = ลำดับไตรมาส (0 = ไตรมาส 1 ข้อมูลของ S6) */
async function moveQuarter(name, q, o) {
  o = o || {};
  if (q === 1) return tripList(name, Object.assign({}, MOVE_Q2_PAGE, o));   // หน้าไตรมาส 2 หลังย้าย (X.8 X.9)
  if (q === 2) return tripList(name, Object.assign({ q: qName(2), cars: [[MOVE_CAR, MOVE_I], [MOVE_Q3_OTHER, -1]], trips: [MOVE_T3], jobs: MOVE_JOB, parts: { qty: MOVE_Q3_QTY } }, o));
  if (q === 3) return tripList(name, Object.assign({ q: qName(3), cars: [[MOVE_CAR, MOVE_I]], trips: [MOVE_T4], jobs: MOVE_JOB, moveOff: true, parts: { qty: MOVE_CAR_QTY } }, o));
  return tripList(name, Object.assign({ trips: [JOB_T], jobs: MOVE_JOB }, o));
}

/* ---------- รายการจอแยกตาม scenario (ชื่อ = scenario ใน 14-บำรุงรักษา-userflow.md) ---------- */
/* S1 เรื่องย่อย — ต้นแบบของการ export ราย scenario (R108 ฉบับ 2 · เจ้าของงาน 13 พ.ย. 2569 "ปรับเรื่อง scen ย่อย S1 ให้เรียบร้อยถูกต้อง และเข้าใจกันก่อน"
   + "เรื่องการ Export figma ที่ ทำ s1 ไปเป็นตัวอย่าง" · เคาะ: เห็นทางเข้า-ออก S21 · error เป็นเรื่องย่อยของตัวเอง · มุมบทบาทเป็นเรื่องย่อยที่มีเป้าหมาย)
   กติกา: 1 เรื่องย่อย = 1 เป้าหมายของผู้ใช้ · เริ่มจากจอที่บอกบริบท · จบที่ผลลัพธ์เสมอ (toast สำเร็จ หรือหน้าถัดไป) · ข้อมูลต่อเนื่องในเรื่อง (ยานพาหนะชุดเดียวกัน ตัวเลขเดินต่อ)
   · ไม่มีทางแยก ทางเลือกอื่นเป็นเรื่องย่อยแยกที่เดินจนจบ · error/เงื่อนไขแยกเรื่องละอัน บอกว่าเกิดที่ขั้นไหนและออกทางไหน
   ลำดับกลุ่ม: เส้นหลัก (A1) → ทางเลือกตอนเพิ่มยานพาหนะ (A2–A4) → จัดการยานพาหนะในแผน (A5–A8) → หลังส่งอนุมัติ (A9–A10) → มุมบทบาท (A11–A12) → error และเงื่อนไข (A13–A18)
   ข้อมูล: กบผ. สร้างแผน FILLED · ยานพาหนะ 82-6789 82-1145 82-3302 (ลำดับ 0 1 2) เข้าไตรมาส 1 · อะไหล่ 0/3 → 1/3 → 3/3 */
const M_PANEL = { regions: [REGIONS[1]], districts: ['กฟฉ.1'], open: 'district' };   // แผงตัวกรองใน modal: ภาค 2 + กฟฉ.1 รายการเขตเปิด
const M_AREA = { regions: [REGIONS[1]], districts: ['กฟฉ.1'] };                       // กดตกลงแล้ว
const M_HQ = { regions: [REGIONS[4]], districts: ['กบค.'] };                           // ภาค สนง. + กอง กบค. (ยานพาหนะ 70-4415 ลำดับ 18 ของ PICK_POOL)
const HQ_CAR = 10 + Q_EXTRA.findIndex(c => c[2] === 'กบค.');
const P1 = { picks: { 0: CAR_PICK }, oils: { 0: 2 } };                                      // กำหนดอะไหล่แล้ว 1/3 (82-6789)
const P3 = { picks: { 0: CAR_PICK, 1: CAR_PICK, 2: CAR_PICK }, oils: { 0: 2, 1: 0, 2: 2 } };   // ครบ 3/3
const IN3 = (o) => Object.assign({ values: FILLED, alloc: A_Q1 }, P3, o);                 // แผนที่มี 3 คันในไตรมาส 1 กำหนดอะไหล่ครบ (จุดเริ่มของเรื่องจัดการยานพาหนะ)
const without = (a, i) => { const b = Object.assign({}, a); delete b[i]; return b; };
const FIRST_MENU = async (name, o) => { const s = await planForm(name, o); planMenu(s, Q_MENU); return s; };
const S1_SUBS = [
  /* ---------- เส้นหลัก ---------- */
  ['สร้างแผนจนส่งอนุมัติ (เส้นหลัก)', [
    ['รายการแผน — กดสร้างแผน', () => listScreen('S1 รายการแผน', { rows: ownPlans(UNITS[0]) })],
    ['ฟอร์มสร้างแผน (ว่าง) — แท็บไตรมาส 1 ยังไม่มียานพาหนะ', () => planForm('S1 ฟอร์มสร้างแผน', { q: 1 })],
    ['เลือกปีงบประมาณ — กรอกชื่อแผนแล้ว รายการปีเปิด', () => planForm('S1 เลือกปีงบประมาณ', { values: { name: FILLED.name }, q: 1, yearOpen: true })],
    ['กดเพิ่มยานพาหนะ — modal ยานพาหนะทุกคันที่ยังไม่อยู่ในแผน แผงตัวกรองกางอยู่', () => planForm('S1 modal เพิ่มยานพาหนะ', { values: FILLED, q: 1, pick: {} })],
    ['เลือกภาค เขต ในแผงตัวกรอง — รายการเขตของภาคที่เลือก', () => planForm('S1 เลือกเขตในแผงตัวกรอง', { values: FILLED, q: 1, pick: { filter: M_PANEL } })],
    ['กดตกลง — ตารางเหลือยานพาหนะของพื้นที่ที่เลือก', () => planForm('S1 modal กรองแล้ว', { values: FILLED, q: 1, pick: M_AREA })],
    ['ติ๊กยานพาหนะ 3 คัน — ปุ่มเพิ่มเข้าไตรมาส 1 (3) กดได้', () => planForm('S1 ติ๊กยานพาหนะใน modal', { values: FILLED, q: 1, pick: Object.assign({ ticked: [0, 1, 2] }, M_AREA) })],
    ['เพิ่มเข้าไตรมาส 1 สำเร็จ — แท็บไตรมาส 1 มี 3 คัน กำหนดอะไหล่แล้ว 0/3', async () => { const s = await planForm('S1 เพิ่มเข้าไตรมาส 1 แล้ว', { values: FILLED, alloc: A_Q1, q: 1 }); notify(s, 'เพิ่มยานพาหนะ 3 คันเข้าไตรมาส 1 สำเร็จ'); return s; }],
    ['กดปุ่ม … ของ 82-6789 → แก้ไข — ไปหน้าจัดการอะไหล่ (S21)', () => FIRST_MENU('S1 เมนูแก้ไขอะไหล่', { values: FILLED, alloc: A_Q1, q: 1 })],
    ['กลับจากหน้าจัดการอะไหล่ — กำหนดแล้ว 1/3 ปุ่มบันทึกและส่งอนุมัติยังกดไม่ได้', async () => { const s = await planForm('S1 กำหนดอะไหล่ 1 คัน', Object.assign({ values: FILLED, alloc: A_Q1, q: 1 }, P1)); notify(s, 'บันทึกอะไหล่ของยานพาหนะ ' + CAND[0][0] + ' แล้ว'); return s; }],
    ['กำหนดอะไหล่ครบ 3/3 — อะไหล่ในไตรมาส 1 รวมครบ ปุ่มบันทึกและส่งอนุมัติกดได้', () => planForm('S1 ครบทุกคัน', IN3({ q: 1 }))],
    ['บันทึกและส่งอนุมัติสำเร็จ — รายการแผน แผนใหม่รออนุมัติ', async () => { const s = await listScreen('S1 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(ownPlans(UNITS[0])) }); notify(s, 'ส่งแผนบำรุงรักษาเพื่ออนุมัติสำเร็จ'); return s; }],
    ['รายละเอียดแผน — รออนุมัติ ดูอย่างเดียว', () => planDetail('S1 รายละเอียด รออนุมัติ', { status: 'review', readonly: true })]]],
  /* ---------- ทางเลือกตอนเพิ่มยานพาหนะ (จบที่เพิ่มสำเร็จทุกเรื่อง) ---------- */
  ['เพิ่มยานพาหนะด้วยการค้นหาทะเบียน', [
    ['แท็บไตรมาส 1 — มี 3 คัน กดเพิ่มยานพาหนะ', () => planForm('S1 ไตรมาส 1 สามคัน', IN3({ q: 1 }))],
    ['กดเพิ่มยานพาหนะ — modal แผงตัวกรองกางอยู่', () => planForm('S1 modal ค้นหา เปิด', IN3({ q: 1, pick: {} }))],
    ['กดปุ่มตัวกรอง — แผงตัวกรองหุบ เหลือช่องค้นหาและตาราง', () => planForm('S1 modal หุบแผงตัวกรอง', IN3({ q: 1, pick: { collapsed: true } }))],
    ['พิมพ์ค้นหา 82- — ตารางเหลือยานพาหนะที่ตรงคำค้น', () => planForm('S1 modal ค้นหา', IN3({ q: 1, pick: { query: '82-', collapsed: true } }))],
    ['ติ๊กยานพาหนะ 82-4410 — ปุ่มเพิ่มเข้าไตรมาส 1 (1) กดได้', () => planForm('S1 modal ค้นหาแล้วติ๊ก', IN3({ q: 1, pick: { query: '82-', ticked: [3], collapsed: true } }))],
    ['เพิ่มเข้าไตรมาส 1 สำเร็จ — แท็บไตรมาส 1 มี 4 คัน', async () => { const s = await planForm('S1 ค้นหาแล้วเพิ่ม', IN3({ alloc: Object.assign({}, A_Q1, { 3: 1 }), q: 1 })); notify(s, 'เพิ่มยานพาหนะ 1 คันเข้าไตรมาส 1 สำเร็จ'); return s; }]]],
  ['เพิ่มยานพาหนะของกองในสำนักงานใหญ่ (ภาค สนง.)', [
    ['กดเพิ่มยานพาหนะ — modal แผงตัวกรองกางอยู่', () => planForm('S1 modal สนง. เปิด', IN3({ q: 1, pick: {} }))],
    ['เลือกภาค สนง. — รายการภาค มี สนง. (สำนักงานใหญ่)', () => planForm('S1 รายการภาค', IN3({ q: 1, pick: { filter: { regions: [REGIONS[4]], open: 'region' } } }))],
    ['เลือกกองของ สนง. — รายการเขตเป็นกองของสำนักงานใหญ่', () => planForm('S1 เขตของ สนง.', IN3({ q: 1, pick: { filter: { regions: [REGIONS[4]], districts: ['กบค.'], open: 'district' } } }))],
    ['กดตกลง — ตารางเหลือยานพาหนะของ กบค.', () => planForm('S1 modal สนง. กรองแล้ว', IN3({ q: 1, pick: M_HQ }))],
    ['ติ๊กยานพาหนะ 70-4415 — ปุ่มเพิ่มเข้าไตรมาส 1 (1) กดได้', () => planForm('S1 modal สนง. ติ๊ก', IN3({ q: 1, pick: Object.assign({ ticked: [HQ_CAR] }, M_HQ) }))],
    ['เพิ่มเข้าไตรมาส 1 สำเร็จ — แท็บไตรมาส 1 มียานพาหนะของ กบค.', async () => { const s = await planForm('S1 สนง. เพิ่มแล้ว', IN3({ alloc: Object.assign({}, A_Q1, { [HQ_CAR]: 1 }), q: 1 })); notify(s, 'เพิ่มยานพาหนะ 1 คันเข้าไตรมาส 1 สำเร็จ'); return s; }]]],
  ['เพิ่มยานพาหนะเข้าไตรมาสที่ยังไม่มียานพาหนะ', [
    ['ไตรมาส 3 ยังไม่มียานพาหนะ — ปุ่มเพิ่มยานพาหนะเข้าไตรมาส 3', () => planForm('S1 ไตรมาส 3 ยังไม่มียานพาหนะ', IN3({ q: 3 }))],
    ['กดเพิ่มยานพาหนะเข้าไตรมาส 3 — modal ยานพาหนะที่ยังไม่อยู่ในแผน', () => planForm('S1 modal เพิ่มยานพาหนะเข้าไตรมาส 3', IN3({ q: 3, pick: {} }))],
    ['ติ๊กยานพาหนะ 2 คัน — ปุ่มเพิ่มเข้าไตรมาส 3 (2) กดได้', () => planForm('S1 ติ๊กยานพาหนะเข้าไตรมาส 3', IN3({ q: 3, pick: { ticked: Q3_ADD } }))],
    ['เพิ่มยานพาหนะเข้าไตรมาส 3 สำเร็จ — แท็บไตรมาส 3 มี 2 คัน', async () => { const s = await planForm('S1 เพิ่มยานพาหนะเข้าไตรมาส 3 แล้ว', IN3({ alloc: Object.assign({}, A_Q1, Object.fromEntries(Q3_ADD.map(i => [i, 3]))), q: 3 })); notify(s, 'เพิ่มยานพาหนะ ' + Q3_ADD.length + ' คันเข้าไตรมาส 3 สำเร็จ'); return s; }]]],
  /* ---------- จัดการยานพาหนะในแผน (เริ่มจากแท็บไตรมาส 1 ที่มี 3 คัน) ---------- */
  ['ย้ายยานพาหนะไปไตรมาสอื่น', [
    ['แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น ลบ', () => FIRST_MENU('S1 เมนูของยานพาหนะ', IN3({ q: 1 }))],
    ['เมนู … → ย้ายไปไตรมาสอื่น — popup ยังไม่เลือกไตรมาส', () => planForm('S1 popup ย้ายไตรมาส', IN3({ q: 1, move: { car: 0, cur: 1 } }))],
    ['เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้', () => planForm('S1 เลือกไตรมาสที่จะย้าย', IN3({ q: 1, move: { car: 0, cur: 1, sel: 1 } }))],
    ['ย้ายสำเร็จ — แท็บไตรมาส 2 มี 82-6789 ตัวเลขบนแท็บเปลี่ยน', async () => { const s = await planForm('S1 ย้ายไตรมาสแล้ว', IN3({ alloc: Object.assign({}, A_Q1, { 0: 2 }), q: 2 })); notify(s, 'ย้ายยานพาหนะไปไตรมาส 2 สำเร็จ'); return s; }]]],
  ['ดูอะไหล่ของยานพาหนะในไตรมาส', [
    ['แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น ลบ', () => FIRST_MENU('S1 เมนูของยานพาหนะ', IN3({ q: 1 }))],
    ['เมนู … → ดูรายละเอียด — อะไหล่ของยานพาหนะคันนี้ ดูอย่างเดียว', () => carPartsView('S1 ดูอะไหล่ของยานพาหนะ', 0)]]],
  ['ลบยานพาหนะออกจากแผนจากเมนู …', [
    ['แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น ลบ', () => FIRST_MENU('S1 เมนูของยานพาหนะ', IN3({ q: 1 }))],
    ['เมนู … → ลบ — ยืนยันการลบยานพาหนะออกจากแผน', async () => { const s = await planForm('S1 ยืนยันลบออกจากแผน', IN3({ q: 1 })); await confirm(s, PLAN_OUT_CONFIRM(CAND[0], 1)); return s; }],
    ['ลบสำเร็จ — แท็บไตรมาส 1 เหลือ 2 คัน ตัวเลขบนแท็บเปลี่ยน', async () => { const s = await planForm('S1 ลบออกจากแผนแล้ว', IN3({ alloc: without(A_Q1, 0), q: 1 })); notify(s, 'ลบยานพาหนะออกจากแผนสำเร็จ'); return s; }]]],
  ['ลบยานพาหนะออกจากแผนจากแท็บทั้งหมด', [
    ['แท็บทั้งหมด — ยานพาหนะทุกคันในแผน ถังขยะท้ายแถว อะไหล่รวมทุกไตรมาส', () => planForm('S1 อะไหล่รวมทุกไตรมาส', IN3({}))],
    ['กดถังขยะ — ยืนยันการลบยานพาหนะออกจากแผน', async () => { const s = await planForm('S1 ยืนยันลบจากแท็บทั้งหมด', IN3({})); await confirm(s, PLAN_OUT_CONFIRM(CAND[0], 1)); return s; }],
    ['ลบสำเร็จ — แท็บทั้งหมดเหลือ 2 คัน', async () => { const s = await planForm('S1 ลบจากแท็บทั้งหมดแล้ว', IN3({ alloc: without(A_Q1, 0) })); notify(s, 'ลบยานพาหนะออกจากแผนสำเร็จ'); return s; }]]],
  /* ---------- หลังส่งอนุมัติ ---------- */
  ['เปิดดูแผนที่อนุมัติแล้ว', [
    ['รายการแผน — กดเมนู … ดูรายละเอียดแผนที่อนุมัติแล้ว', () => listScreen('S1 รายการแผน', { rows: ownPlans(UNITS[0]) })],
    ['รายละเอียดแผน — อนุมัติแล้ว', () => planDetail('S1 รายละเอียด อนุมัติแล้ว', { status: 'approved' })]]],
  ['แผนถูกส่งกลับแก้ไข แล้วไปแก้ไขแผน (S19)', [
    ['รายการแผน — กดเมนู … ดูรายละเอียดแผนที่ส่งกลับแก้ไข', () => listScreen('S1 รายการแผน', { rows: ownPlans(UNITS[0]) })],
    ['รายละเอียดแผน — ส่งกลับแก้ไข เห็นเหตุผล กดแก้ไขไป S19', () => planDetail('S1 รายละเอียด ส่งกลับแก้ไข', { status: 'returned' })]]],
  /* ---------- มุมบทบาทอื่น ---------- */
  ['กบค. ตรวจแผนของกองอื่น', [
    ['กบค. — รายการแผนทุกหน่วยงาน สร้างแผนได้ แผนหน่วยงานอื่นดูอย่างเดียว', () => listScreen('S1 กบค. รายการแผน', { rows: [NEW_PLAN].concat(allPlans()), view: 'กบค.' })],
    ['รายการแผน — กดตัวกรอง แผงตัวกรอง เขต หน่วยงานหน้างาน (กบค.)', () => listScreen('S1 กบค. ตัวกรองรายการแผน', { rows: [NEW_PLAN].concat(allPlans()), view: 'กบค.', filter: { units: ['กบผ.'], open: 'unit' } })],
    ['กบค. — รายละเอียดแผนของหน่วยงานอื่น ดูอย่างเดียว', () => planDetail('S1 กบค. รายละเอียดแผน', { status: 'approved', readonly: true })]]],
  ['กองอื่นเห็นเฉพาะแผนของกองตัวเอง', [
    ['กปส. — รายการแผน เห็นเฉพาะแผนของ กปส. สร้างแผนได้', () => listScreen('S1 กปส. รายการแผน', { rows: ownPlans('กปส.') })],
    ['กรย. — รายการแผน เห็นเฉพาะแผนของ กรย. สร้างแผนได้', () => listScreen('S1 กรย. รายการแผน', { rows: ownPlans('กรย.') })]]],
  /* ---------- error และเงื่อนไข (เรื่องละอัน · เกิดที่ไหน ออกทางไหน) ---------- */
  ['ยังไม่มีแผน — เริ่มแผนแรก', [
    ['รายการแผน — ยังไม่มีแผน กดสร้างแผน', () => listScreen('S1 รายการว่าง', { empty: true })],
    ['ฟอร์มสร้างแผน (ว่าง) — แท็บไตรมาส 1 ยังไม่มียานพาหนะ', () => planForm('S1 ฟอร์มสร้างแผน', { q: 1 })]]],
  ['กรอกข้อมูลแผนไม่ครบ', [
    ['ฟอร์มสร้างแผน (ว่าง) — แท็บไตรมาส 1 ยังไม่มียานพาหนะ', () => planForm('S1 ฟอร์มสร้างแผน', { q: 1 })],
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus — ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', () => planForm('S1 Validation', { errors: true, q: 1 })]]],
  ['ค้นหาใน modal ไม่พบยานพาหนะ', [
    ['กดเพิ่มยานพาหนะ — modal แผงตัวกรองกางอยู่', () => planForm('S1 modal ไม่พบ เปิด', IN3({ q: 1, pick: {} }))],
    ['ค้นหาใน modal ไม่พบยานพาหนะ — พิมพ์ 99-9999 ล้างตัวกรองเพื่อกลับไปเห็นรายการ', () => planForm('S1 modal ไม่พบยานพาหนะ', IN3({ q: 1, pick: { query: '99-9999', collapsed: true } }))]]],
  ['ยานพาหนะทุกคันอยู่ในแผนแล้ว', [
    ['ไตรมาส 4 ยังไม่มียานพาหนะ — ยานพาหนะคันอื่นอยู่ในแผนครบแล้ว', () => planForm('S1 ไตรมาส 4 ว่าง', IN3({ q: 4 }))],
    ['ยานพาหนะทุกคันอยู่ในแผนแล้ว — modal ไม่มียานพาหนะให้เพิ่ม', () => planForm('S1 modal ไม่มียานพาหนะให้เพิ่ม', IN3({ q: 4, pick: { full: true } }))]]],
  ['ออกจากหน้าโดยยังไม่บันทึก', [
    ['กดย้อนกลับ — ฟอร์มที่กรอกแล้ว ยานพาหนะ 3 คัน กำหนดอะไหล่แล้ว 1/3', () => planForm('S1 ก่อนออก', Object.assign({ values: FILLED, alloc: A_Q1, q: 1 }, P1))],
    ['ย้อนกลับ — ยืนยันการออก ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', async () => { const s = await planForm('S1 ยืนยันการออก', Object.assign({ values: FILLED, alloc: A_Q1, q: 1 }, P1)); await confirm(s, EXIT_CONFIRM('ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก')); return s; }],
    ['ออกแล้ว — รายการแผน ไม่มีแผนใหม่', () => listScreen('S1 ออกไม่บันทึก', { rows: ownPlans(UNITS[0]) })]]],
  ['บันทึกและส่งอนุมัติไม่สำเร็จ', [
    ['กำหนดอะไหล่ครบ 3/3 — กดบันทึกและส่งอนุมัติ', () => planForm('S1 ก่อนบันทึก', IN3({ q: 1 }))],
    ['บันทึกไม่สำเร็จ — toast ผิดพลาด ค่าที่กรอกยังอยู่ กดบันทึกใหม่ได้', async () => { const s = await planForm('S1 บันทึกไม่สำเร็จ', IN3({ q: 1 })); notify(s, 'general error', true); return s; }]]],
];
const SCENARIOS = [
  /* S1 = เรื่องย่อย S1_SUBS (R108 R109 · 12 พ.ย. 2569) — ประวัติแบบ A (5 พ.ย. 2569) R77 R75 R93 R104 อยู่ใน component-rules.md */
  ['S1 · ผู้สร้างแผน สร้างแผนบำรุงรักษาประจำปี และเพิ่มยานพาหนะเข้าไตรมาส', S1_SUBS.flatMap(x => x[1])],
  /* S2 ปรับ 5 พ.ย. 2569 (รีวิวทีมออกแบบ): ผลการพิจารณาบนสุด ไม่มีค่าเริ่มต้น · อนุมัติสำเร็จแสดงแค่ toast ขวาบน สถานะอนุมัติแล้ว ส่วนผลการพิจารณาหาย */
  ['S2 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนบำรุงรักษา', [
    ['รายการแผนรออนุมัติ', () => planReviewList('S2 แผนรออนุมัติ', REVIEW_ROWS)],
    ['รายละเอียดแผน — ผลการพิจารณา ยังไม่เลือก', () => planReview('S2 รายละเอียดแผน', {})],
    ['อนุมัติ — ยืนยันอนุมัติแผน', async () => { const s = await planReview('S2 ยืนยันอนุมัติ', { decision: 'approve' }); await confirm(s, { title: 'ยืนยันอนุมัติแผนบำรุงรักษา', sub: NP[1] + ' · ' + NP[4] + ' คัน · อนุมัติแล้ว ระบบแจ้งจำนวนอะไหล่ทั้งปีให้ Smart Inventory ทราบ (ยังไม่ตัดจากคลัง) และหน่วยงานเริ่มงานรายไตรมาสได้', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนสำเร็จ', async () => { const s = await planReview('S2 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนบำรุงรักษาสำเร็จ'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => planReview('S2 เลือกส่งกลับ', { decision: 'return' })],
    ['ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus', () => planReview('S2 ส่งกลับไม่ครบ', { decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await planReview('S2 ยืนยันส่งกลับ', { decision: 'return', reason: RETURN_REASON }); await confirm(s, { title: 'ยืนยันส่งกลับแก้ไข', sub: 'แผนจะกลับไปให้ผู้สร้างแผนแก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่', ok: 'ส่งกลับ' }); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await planReviewList('S2 ส่งกลับแล้ว', [PLANS[2]], 0, 1); notify(s, 'ส่งแผนกลับให้ผู้สร้างแผนแก้ไขแล้ว'); return s; }],   // 10 พ.ย. 2569 แผนที่ส่งกลับออกจากแท็บรออนุมัติ ไปอยู่แท็บส่งกลับแก้ไข (B.10)
    ['อะไหล่ในแผน — เปิดแท็บไตรมาส 2', () => planReview('S2 อะไหล่ไตรมาส 2', { pq: 2 })],
    // 10 พ.ย. 2569 เจ้าของงาน "หน้าอนุมัติต้องมี tab รออนุมัติ อนุมัติแล้ว และ ส่งกลับแก้ไขด้วย" — ต่อท้าย (B.10 B.11) รหัสจอเดิมไม่เลื่อน
    ['แท็บอนุมัติแล้ว — แผนที่อนุมัติไปแล้ว', () => planReviewList('S2 แท็บอนุมัติแล้ว', REVIEW_DONE, 1)],
    ['แท็บส่งกลับแก้ไข — แผนที่ส่งกลับรอผู้สร้างแก้', () => planReviewList('S2 แท็บส่งกลับแก้ไข', [planAs('returned')].concat(REVIEW_RET), 2, 1)]]],
  // S3 ผพจ. ออกเลขงานและจัดซื้ออะไหล่ — พักไว้ 30 ต.ค. 2569 (เจ้าของงาน "อนุมัติเลขงาน ไม่ต้องมีในระบบแล้ว แยกออกไปก่อน") · ฟังก์ชัน planIssue/headPartCheck/poForm คงไว้ · userflow ย้ายไป 14-…-พักไว้-S3.md
  /* S4 เดิม "ติดตามความคืบหน้าและเบิกอะไหล่ของไตรมาส" (partsProgress · เทียบคงเหลือ Smart Inventory + เบิก/จอง) เปลี่ยนเป็นแดชบอร์ด 6 พ.ย. 2569 (เจ้าของงาน "หน้าที่จาก smart inventory จะเปลี่ยนเป็นหน้าแดชบอร์ด")
     รหัสจอ C.1–C.6 เดิมถูกแทนด้วยจอแดชบอร์ด (ชื่อ state ใหม่) · อะไหล่รายไตรมาสย้ายไปหัวข้อ "อะไหล่ในไตรมาส n" ของหน้าไตรมาส (S6) */
  ['S4 · ผู้ดำเนินการ ดูอะไหล่และความคืบหน้าของแผนที่อนุมัติแล้ว (แดชบอร์ด)', [
    ['แท็บรวมตามรายการ — อะไหล่ทุกแผนที่อนุมัติแล้วในปีงบประมาณ 2570', () => partsDash('S4 รวมตามรายการ', {})],
    ['ค้นหาชื่ออะไหล่ หรือรหัสอะไหล่', () => partsDash('S4 ค้นหา', { query: 'FL-00' })],
    ['กดตัวกรอง — แผงตัวกรอง ปีงบประมาณ เขต แผน (เห็นเฉพาะแผนของหน่วยงานตัวเอง)', () => partsDash('S4 แผงตัวกรอง', { filter: { open: 'plan' } })],
    ['กรองแล้ว — ชิปตัวกรองเหนือตาราง', () => partsDash('S4 กรองแล้ว', { chips: ['2570', 'MRZ7000001'] })],
    ['ไม่พบอะไหล่ที่ตรงกับคำค้นหรือตัวกรอง', () => partsDash('S4 ไม่พบ', { query: 'ไส้กรองแอร์', notFound: true })],
    ['แท็บแยกรายคัน — อะไหล่ของยานพาหนะแต่ละคัน', () => partsDash('S4 แยกรายคัน', { tab: 1 })],
    ['แท็บความคืบหน้าของแผน — แผนเดินทางและยานพาหนะที่บำรุงรักษาแล้วรายไตรมาส', () => partsDash('S4 ความคืบหน้า', { tab: 2 })],
    ['กดส่งออก — popup รูปแบบไฟล์ และข้อมูลที่ส่งออก', () => partsDash('S4 ส่งออก', { chips: ['2570', 'MRZ7000001'], exportPdf: true })],
    ['ส่งออกสำเร็จ', async () => { const s = await partsDash('S4 ส่งออกสำเร็จ', { chips: ['2570', 'MRZ7000001'] }); notify(s, 'ส่งออกไฟล์สำเร็จ'); return s; }],
    ['ไฟล์ PDF — รวมตามรายการ', () => dashPdf('S4 ไฟล์ PDF')],
    ['ไฟล์ Excel — ชีตรวมตามรายการ', () => dashXls('S4 ไฟล์ Excel รวม', 0)],
    ['ไฟล์ Excel — ชีตแยกรายคัน', () => dashXls('S4 ไฟล์ Excel รายคัน', 1)],
    ['ยังไม่มีแผนที่อนุมัติแล้ว', () => partsDash('S4 ว่าง', { empty: true })],
    // 10 พ.ย. 2569 เจ้าของงาน "ผู้สร้างแผนเห็นเฉพาะแผนของหน่วยงานตัวเอง ยกเว้น กบค จะเห็นแผนของหน่วยงานอื่นด้วย แต่แก้ไขไม่ได้" — ต่อท้าย (C.14 C.15) รหัสจอเดิมไม่เลื่อน
    ['กบค. — ความคืบหน้าของแผนทุกหน่วยงาน ดูอย่างเดียว', () => partsDash('S4 กบค. ทุกหน่วยงาน', { kbk: true, tab: 2 })],
    ['กบค. — แผงตัวกรอง มีหน่วยงานผู้ขอเบิก', () => partsDash('S4 กบค. แผงตัวกรอง', { kbk: true, filter: { units: ['กปส.'], open: 'unit' } })],
    /* 12 พ.ย. 2569 แดชบอร์ดแบบ VMS+ (R106) — ต่อท้าย C.16 C.17 C.18 รหัสจอเดิมไม่เลื่อน · กดกราฟ/กดเรื่องที่ควรดู = กรองทั้งหน้า + ชิปตัวกรองที่เลือก */
    ['กดกราฟ — แท่งไตรมาส 1 กรองทั้งหน้า ชิปตัวกรองที่เลือก แท็บความคืบหน้าเหลือไตรมาส 1', () => partsDash('S4 กดกราฟไตรมาส 1', { q: 1, chips: ['ไตรมาส 1'], tab: 2 })],
    ['กดเรื่องที่ควรดู — ยานพาหนะในแผนที่ไม่เบิกอะไหล่ กรองทั้งหน้า แท็บแยกรายคัน', () => partsDash('S4 กดเรื่องที่ควรดู', { alert: 'noparts', chips: ['ไม่เบิกอะไหล่'], tab: 1 })],
    ['มุมมองมือถือ — การ์ดตัวเลข 2 ใบต่อแถว กราฟเรียงทีละใบ ตารางเป็นการ์ด', () => partsDash('S4 มุมมองมือถือ', { mobileAll: true })]]],
  // S5 เบิกอะไหล่ผ่านระบบจองอะไหล่ — รวมเข้า S4 2 พ.ย. 2569 (เจ้าของงาน "รวบ s4 s5 เป็นหน้าเดียวกัน ยุบ S5 ออกไปก่อน") · บล็อก D เว้นว่าง
  /* S6 ปรับ 5 พ.ย. 2569 (รีวิวทีมออกแบบ): ทางเข้าจากเมนูถึงหน้าไตรมาส (E.1–E.3) · หน้า E.3 = "ไตรมาส 1" · popup รถในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้ · เอารถออกจากแผนเดินทาง (soft delete) แล้วกลับมาเลือกได้
     · Validation Out of focus · สร้างสำเร็จกลับหน้าไตรมาส + toast · สร้างได้จนรถหมด แล้วปุ่มสร้างแผนเดินทางกดไม่ได้ (ตัด popup "รถทุกคันอยู่ในแผนเดินทางแล้ว") */
  ['S6 · ผู้ดำเนินการ ทำแผนเดินทาง (ดำเนินการเอง)', [
    ['รายการแผน — เมนู "…" ดูรายละเอียดแผนที่อนุมัติแล้ว', async () => { const s = await listScreen('S6 รายการแผน', { rows: ownPlans(UNITS[0]) }); planMenu(s, MENU.slice(0, 1)); return s; }],
    ['รายละเอียดแผน — กดไปหน้าไตรมาส 1', () => planDetailQ('S6 รายละเอียดแผน')],
    ['หน้าไตรมาส 1 — ยังไม่มีแผนเดินทาง', () => tripList('S6 ไตรมาส 1 (ว่าง)', { trips: [] })],
    ['ฟอร์มสร้างแผนเดินทาง (ว่าง)', () => tripForm('S6 ฟอร์มแผนเดินทาง', {})],
    ['กดเพิ่มยานพาหนะ — popup ยานพาหนะทุกคันของไตรมาส', () => tripForm('S6 popup เพิ่มยานพาหนะ', { modal: { pool: TRIP_ALL, ticked: TRIP_SEL } })],
    ['เพิ่มยานพาหนะแล้ว — สถานที่ตั้งต้นสำนักงานที่ยานพาหนะอยู่', () => tripForm('S6 เพิ่มยานพาหนะแล้ว', { sel: TRIP_SEL })],
    ['แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันเดินทาง', async () => { const s = await tripForm('S6 แก้ไขยานพาหนะในแผนเดินทาง', { sel: TRIP_SEL, values: TRIP_DATES }); await tripCarEdit(s, 4, TRIP_PHONES, TRIP_LOCS, { trip: TRIP_DATES }); return s; }],   // 6 พ.ย. 2569 popup 4 ช่อง (R83) · เดิม "แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษาของยานพาหนะ" รหัสจอเดิม
    ['กดไอคอนลบ — เอายานพาหนะออกจากแผนเดินทางนี้ (soft delete)', () => tripForm('S6 เอายานพาหนะออกจากแผนเดินทาง', { sel: TRIP_KEEP, locs: TRIP_LOCS, phones: TRIP_PHONES })],
    ['กดเพิ่มยานพาหนะอีกครั้ง — ยานพาหนะที่เอาออกกลับมาเลือกได้', () => tripForm('S6 เพิ่มยานพาหนะอีกครั้ง', { sel: TRIP_KEEP, locs: TRIP_LOCS, phones: TRIP_PHONES, modal: { pool: TRIP_ALL.filter(i => TRIP_KEEP.indexOf(i) < 0), ticked: [TRIP_OUT] } })],
    ['เลือกช่วงวันเดินทาง', () => tripForm('S6 เลือกช่วงวัน', { sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, dateOpen: true })],
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus', () => tripForm('S6 Validation', { errors: true })],
    ['กรอกครบ', () => tripForm('S6 กรอกครบ', { values: TRIP_FILLED, sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, works: TRIP_WORKS })],   // 6 พ.ย. 2569 วันดำเนินการรายคันตาม TRIP_1 (E.13)
    ['สร้างแผนเดินทางสำเร็จ — กลับหน้าไตรมาส 1 แสดงแผนเดินทางใหม่ (รออนุมัติ)', async () => { const s = await tripList('S6 ยืนยันแล้ว', { trips: [TRIP_1] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }],
    ['สร้างแผนเดินทางใบถัดไป — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้', () => tripForm('S6 ใบถัดไป popup', { modal: { pool: TRIP_ALL, ticked: TRIP_REST, taken: TAKEN_1 } })],
    ['แผนเดินทาง 2 ใบ — ยานพาหนะครบทุกคัน ปุ่มสร้างแผนเดินทางกดไม่ได้', async () => { const s = await tripList('S6 แผนเดินทาง 2 ใบ', { trips: [tripAs(TRIP_1, 'approved'), TRIP_2] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }],
    ['แผนเดินทางถูกส่งกลับแก้ไข', () => tripList('S6 ถูกส่งกลับ', { trips: [tripAs(TRIP_1, 'returned')] })],
    ['แก้ไขแผนเดินทางที่ถูกส่งกลับ', () => tripForm('S6 แก้ไขที่ถูกส่งกลับ', { edit: true, alert: ['Error', 'ผู้อนุมัติส่งกลับให้แก้ไข', TRIP_RETURN], values: Object.assign({}, TRIP_FILLED, { d1: '10/11/2569', d2: '14/11/2569' }), sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES })],
    ['ส่งอนุมัติใหม่แล้ว', async () => { const s = await tripList('S6 ส่งอนุมัติใหม่', { trips: [Object.assign(tripAs(TRIP_1, 'review'), { d1: '10/11/2569', d2: '14/11/2569', works: {} })] });   /* เปลี่ยนช่วงวันเดินทางแล้ว วันดำเนินการกลับเป็นทั้งช่วงใหม่ (เสนอ) */ notify(s, 'ส่งแผนเดินทางให้ผู้อนุมัติใหม่แล้ว'); return s; }],
    // เพิ่ม ลด แก้ไข รถในไตรมาส (เจ้าของงาน 4 พ.ย. 2569 · ไม่ต้องส่งอนุมัติแผนใหม่) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['กดเพิ่มยานพาหนะ — popup ยานพาหนะที่ยังไม่อยู่ในแผน เพิ่มได้ทุกคัน', async () => { const s = await tripList('S6 popup เพิ่มยานพาหนะเข้าไตรมาส', { trips: [] }); await qAddModal(s, [0]); return s; }],
    ['เพิ่มยานพาหนะเข้าไตรมาสแล้ว', async () => { const s = await tripList('S6 เพิ่มยานพาหนะเข้าไตรมาสแล้ว', { trips: [], added: [0] }); notify(s, 'เพิ่มยานพาหนะเข้า' + NOW_Q + ' สำเร็จ'); return s; }],
    ['กดไอคอนแก้ไข — แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษา', async () => { const s = await tripList('S6 แก้ไขยานพาหนะในไตรมาส', { trips: [] }); await tripCarEdit(s, 1, {}, {}); return s; }],
    ['กดไอคอนลบ — ยืนยันเอายานพาหนะออกจากไตรมาส', async () => { const s = await tripList('S6 ยืนยันเอายานพาหนะออกจากไตรมาส', { trips: [] }); await confirm(s, Q_REMOVE_CONFIRM(TRIP_CARS[1])); return s; }],
    ['เอายานพาหนะออกจากไตรมาสแล้ว', async () => { const s = await tripList('S6 เอายานพาหนะออกจากไตรมาสแล้ว', { trips: [], removed: [1] }); notify(s, 'เอายานพาหนะออกจาก' + NOW_Q + ' สำเร็จ'); return s; }],
    // 6 พ.ย. 2569 รีวิว S6 วันดำเนินการรายคัน (R83) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน (E.24 E.25) · ส่งออกแผนเดินทางอยู่ท้าย S10 (I.27–I.32)
    ['เลือกวันดำเนินการ — ปฏิทินเลือกได้เฉพาะช่วงวันเดินทาง วันนอกช่วงกดไม่ได้', async () => { const s = await tripForm('S6 เลือกวันดำเนินการ', { values: TRIP_FILLED, sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES }); await tripCarEdit(s, 0, TRIP_PHONES, TRIP_LOCS, { trip: TRIP_DATES, pick: TRIP_WORKS[0] }); return s; }],
    ['บันทึกวันดำเนินการแล้ว — หลายคันวันเดียวกันได้ คันที่ไม่แก้คงทั้งช่วงวันเดินทาง', () => tripForm('S6 บันทึกวันดำเนินการแล้ว', { values: TRIP_FILLED, sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, works: TRIP_WORKS })],
    // 11 พ.ย. 2569 เจ้าของงาน เพิ่มยานพาหนะเข้าไตรมาสได้จนกว่าทุกคันในไตรมาสปิดงาน (R93) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน (E.26)
    ['ทุกคันในไตรมาสปิดงานแล้ว (รวมบำรุงรักษาไม่ได้) — ปุ่มเพิ่มยานพาหนะกดไม่ได้', () => tripList('S6 ไตรมาสปิดงานครบทุกคัน', { trips: [tripAs(TRIP_1, 'done'), tripAs(TRIP_2, 'done')], jobs: Q_DONE_JOBS })]]],
  ['S7 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง', [
    ['รายการแผนเดินทางรออนุมัติ', () => tripReviewList('S7 รออนุมัติ', [TRIP_1, TRIP_V, TRIP_OTHER])],
    ['รายละเอียดแผนเดินทาง — ผลการพิจารณา ยังไม่เลือก', () => tripReview('S7 รายละเอียด', {})],   // 5 พ.ย. 2569 ตาม S2
    ['อนุมัติ — ยืนยันอนุมัติแผนเดินทาง', async () => { const s = await tripReview('S7 ยืนยันอนุมัติ', { decision: 'approve' }); await confirm(s, { title: 'ยืนยันอนุมัติแผนเดินทาง', sub: TRIP_1.name + ' · ' + TRIP_1.sel.length + ' คัน · อนุมัติแล้วระบบแจ้งเตือน กรย. และผู้ดูแลยานพาหนะ', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนเดินทางสำเร็จ', async () => { const s = await tripReview('S7 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนเดินทางสำเร็จ'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => tripReview('S7 เลือกส่งกลับ', { decision: 'return' })],
    ['ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus', () => tripReview('S7 ส่งกลับไม่ครบ', { decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await tripReview('S7 ยืนยันส่งกลับ', { decision: 'return', reason: TRIP_RETURN }); await confirm(s, { title: 'ยืนยันส่งกลับแก้ไข', sub: 'แผนเดินทางจะกลับไปให้ผู้สร้างแผนเดินทางแก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่', ok: 'ส่งกลับ' }); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await tripReviewList('S7 ส่งกลับแล้ว', [TRIP_V, TRIP_OTHER], 0, 2); notify(s, 'ส่งแผนเดินทางกลับให้ผู้สร้างแผนเดินทางแก้ไขแล้ว'); return s; }],
    // 10 พ.ย. 2569 แท็บของหน้าอนุมัติ (ตาม S2) — ต่อท้าย รหัสจอเดิมไม่เลื่อน
    ['แท็บอนุมัติแล้ว — แผนเดินทางที่อนุมัติไปแล้ว', () => tripReviewList('S7 แท็บอนุมัติแล้ว', [TRIP_OK], 1)],
    ['แท็บส่งกลับแก้ไข — แผนเดินทางที่ส่งกลับรอผู้สร้างแก้', () => tripReviewList('S7 แท็บส่งกลับแก้ไข', [Object.assign({}, TRIP_1, { st: 'returned' }), TRIP_RET], 2, 2)]]],
  ['S8 · กรย. และผู้ดูแลยานพาหนะ ได้รับแจ้งเตือนแผนเดินทาง', [
    ['กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)', async () => { const s = await tripSeenList('S8 กรย. มีใหม่', false); bell(s, true); return s; }],
    ['กรย. — เปิดแผงแจ้งเตือน', async () => { const s = await tripSeenList('S8 กรย. แผงแจ้งเตือน', false); bell(s, true); await notiPanel(s, [NOTI_KRY, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['กรย. — แผนเดินทาง ดูอย่างเดียว (ยานพาหนะทุกคันในใบ)', () => tripView('S8 กรย. แผนเดินทาง', false)],
    ['ผู้ดูแลยานพาหนะ — เปิดแผงแจ้งเตือน', async () => { const s = await tripSeenList('S8 หน่วยงาน แผงแจ้งเตือน', true); bell(s, true); await notiPanel(s, [NOTI_OWN, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['ผู้ดูแลยานพาหนะ — แผนเดินทาง ดูอย่างเดียว (เฉพาะยานพาหนะที่ดูแล)', () => tripView('S8 หน่วยงาน แผนเดินทาง', true)]]],
  ['S9 · ผู้ดำเนินการ สร้างแผนเดินทางจ้างดำเนินการ (vendor)', [
    ['เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น', () => tripForm('S9 เลือกจ้าง', { mode: 'hire' })],
    ['เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด', () => tripForm('S9 รายชื่อผู้รับจ้าง', { mode: 'hire', vendorOpen: true, values: { name: TRIP_V.name } })],
    ['กดเพิ่มยานพาหนะ — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้', () => tripForm('S9 popup เพิ่มยานพาหนะ', { mode: 'hire', values: { name: TRIP_V.name, vendor: TRIP_V.vendor }, modal: { pool: TRIP_ALL, ticked: TRIP_REST, taken: TAKEN_1 } })],   // 5 พ.ย. 2569 popup เดียวกับ S6
    ['แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันทำงาน', async () => { const s = await tripForm('S9 แก้ไขยานพาหนะในแผนเดินทาง', { mode: 'hire', values: { name: TRIP_V.name, vendor: TRIP_V.vendor, d1: TRIP_V.d1, d2: TRIP_V.d2 }, sel: TRIP_REST, locs: TRIP_V_LOCS, phones: TRIP_V_PHONES }); await tripCarEdit(s, 6, TRIP_V_PHONES, TRIP_V_LOCS, { trip: { d1: TRIP_V.d1, d2: TRIP_V.d2, hire: true } }); return s; }],   // 6 พ.ย. 2569 (R83) เดิม "แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษาของยานพาหนะ" 
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus', () => tripForm('S9 Validation', { mode: 'hire', errors: true })],   // 5 พ.ย. 2569 ฟอร์มเดียวกับ S6 ปุ่มยืนยัน Disabled จนกว่าครบ
    ['กรอกครบ', () => tripForm('S9 กรอกครบ', { mode: 'hire', values: TRIP_V, sel: TRIP_REST, locs: TRIP_V_LOCS, phones: TRIP_V_PHONES })],
    ['ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)', async () => { const s = await tripList('S9 ยืนยันแล้ว', { trips: [tripAs(TRIP_1, 'approved'), TRIP_V] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }]]],
  // S9 เดิม กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน — ตัดออก 3 พ.ย. 2569 (เจ้าของงาน "เรื่องเตรียมอะไหล่ เป็นการติดต่อกันเอง") แทนด้วย S9 แผนจ้างดำเนินการ · prepDetail/prepRows คงไว้
  // S7 ผู้รับจ้างทำแผนเดินทาง · S8 กบค. ตรวจแผนผู้รับจ้าง (เดิม) — แทนด้วย S7 อนุมัติ S8 แจ้งเตือน 3 พ.ย. 2569 · hireTripForm/hireTripReview คงไว้ให้เส้นว่าจ้างที่รอออกแบบ (ไฟล์ 14 หัวข้อ 2.1)
  /* S10 ปรับตามรีวิว 5 พ.ย. 2569 (ทีมออกแบบ + เจ้าของงาน "s10 ลองปรับให้เป็นแบบที่เขียนให้"): ตัวนับ "ตรวจแล้ว x/y" (ไม่นับคันที่บำรุงรักษาไม่ได้) · กดเริ่มงานเข้าขั้นตอน 2 ขั้น
     Step 1 ตรวจสภาพก่อนบำรุงรักษา (ลงนามบังคับ) → Step 2 สรุปงานก่อนปิดงาน · หน้าอยู่ระหว่างบำรุงรักษาเดิมเอาออก · toast ขวาบน (R60) · ป้ายรอผลตรวจน้ำมันเฉพาะคันที่เก็บตัวอย่าง
     รหัสจอเลื่อนทั้งบล็อก (ไม่มีปุ่มอัปเดตจอที่เลือกของปลั๊กอินนี้ — export ใหม่) */
  ['S10 · ผู้ดำเนินการ บันทึกงานบำรุงรักษารายคัน', [
    ['หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน ตรวจแล้ว 0/4', () => tripDetail('S10 รายละเอียดแผนเดินทาง', {})],
    ['กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ลบ', () => tripDetail('S10 เมนูของยานพาหนะ', { menu: true })],
    ['เมนูแก้ไข — แก้ไขยานพาหนะในแผนเดินทาง ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ', () => tripDetail('S10 แก้ไขยานพาหนะในแผนเดินทาง', { edit: true })],   // 6 พ.ย. 2569 (R83) เดิม "เมนูแก้ไข — แก้ไขผู้ดูแลยานพาหนะและสถานที่" 
    ['เมนูลบ — ยืนยันเอายานพาหนะออกจากแผนเดินทาง', () => tripDetail('S10 ลบยานพาหนะออกจากแผนเดินทาง', { del: true })],
    ['หน้างานรายคัน — ยังไม่เริ่ม', () => jobPage('S10 งานรายคัน', {})],
    ['กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา สถานะอยู่ระหว่างบำรุงรักษา', async () => { const s = await stepPage('S10 Step 1 ตรวจสภาพก่อนบำรุงรักษา', { step: 1 }); notify(s, 'เริ่มงานบำรุงรักษาแล้ว'); return s; }],
    ['กดเซ็นลงนาม — ลงนามการตรวจสภาพ', () => stepPage('S10 ลงนามการตรวจสภาพ', { step: 1, filled: true, signModal: true })],
    ['ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้', () => stepPage('S10 Step 1 ลงนามครบ', { step: 1, filled: true, signed: true })],
    ['ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน', () => stepPage('S10 Step 2 สรุปงานก่อนปิดงาน', { step: 2 })],
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus', () => stepPage('S10 Validation', { step: 2, errors: true })],
    ['เลือกวันที่เปลี่ยนน้ำมันครั้งล่าสุด — ปฏิทิน', () => stepPage('S10 วันที่เปลี่ยนน้ำมันครั้งล่าสุด', { step: 2, filled: true, dateOpen: true })],
    ['เลือกงบที่ตัด หน่วยงานอื่น — ระบุศูนย์ต้นทุน', () => stepPage('S10 งบที่ตัด หน่วยงานอื่น', { step: 2, filled: true, budget: { type: 1, cc: OTHER_CC } })],
    ['กรอกผลงานครบ', () => stepPage('S10 ปิดงานกรอกครบ', { step: 2, filled: true })],
    ['ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง เสร็จสิ้น + รอผลตรวจน้ำมัน', async () => { const s = await tripDetail('S10 ปิดงานสำเร็จ', { st: JOB_MIX, oil: { [JOB_I]: 'wait' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['ปิดงานสำเร็จ — เปลี่ยนน้ำมันอย่างเดียว ไม่มีป้ายรอผลตรวจน้ำมัน', async () => { const s = await tripDetail('S10 ปิดงานสำเร็จ ไม่เก็บตัวอย่าง', { st: JOB_MIX }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน', () => jobPage('S10 บำรุงรักษาไม่ได้', { i: TRIP_1.sel[2], modal: 'cannot', reason: JOB_CANNOT })],
    ['บำรุงรักษาไม่ได้ — ยังไม่ระบุสาเหตุ', () => jobPage('S10 บำรุงรักษาไม่ได้ยังไม่ครบ', { i: TRIP_1.sel[2], modal: 'cannot', errors: true })],
    ['บำรุงรักษาไม่ได้ระหว่าง Step 1 — คืนอะไหล่ตามแผนทั้งหมด', () => stepPage('S10 บำรุงรักษาไม่ได้ Step 1', { step: 1, filled: true, modal: 'cannot', reason: HIRE_WHY })],
    ['บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว', () => stepPage('S10 บำรุงรักษาไม่ได้ Step 2', { step: 2, modal: 'cannot', reason: HIRE_WHY })],
    ['บันทึกบำรุงรักษาไม่ได้แล้ว — กลับหน้ารายละเอียดแผนเดินทาง ตรวจแล้ว 0/3', async () => { const s = await tripDetail('S10 บันทึกบำรุงรักษาไม่ได้', { st: { [TRIP_1.sel[2]]: 'cannot' } }); notify(s, 'บันทึกบำรุงรักษาไม่ได้แล้ว'); return s; }],
    ['ดูงานที่ปิดแล้ว — เสร็จสิ้น', () => workDetail('S10 งานที่ปิดแล้ว', {})],
    // Safety Inspection รถเครนและกระเช้า (4 พ.ย. 2569 · JO 7.3.3)
    ['Step 2 — แนบเอกสาร Safety Inspection (ถ้ามี)', () => stepPage('S10 Step 2 Safety Inspection', { step: 2, filled: true, safety: SAFETY_FILES })],
    ['หน้างานรายคัน — เพิ่มเอกสาร Safety Inspection ภายหลัง', () => workDetail('S10 เพิ่มเอกสาร Safety Inspection', { safety: { files: SAFETY_FILES } })],
    ['บันทึกเอกสาร Safety Inspection สำเร็จ', async () => { const s = await workDetail('S10 บันทึกเอกสาร Safety Inspection', { safety: { files: SAFETY_DONE, saved: true } }); notify(s, 'บันทึกเอกสาร Safety Inspection สำเร็จ'); return s; }],
    // แผนจ้างดำเนินการ (4 พ.ย. 2569 ตัด S23 S11) — กบค. ปิดงานรายคันแทนผู้รับจ้างด้วยหน้าและขั้นตอนเดียวกัน
    ['แผนจ้างดำเนินการ — หน้ารายละเอียดแผนเดินทาง กดปุ่ม … ของยานพาหนะ', () => tripDetail('S10 แผนจ้าง รายละเอียดแผนเดินทาง', { trip: HIRE_T, st: HIRE_ST, menu: true })],
    ['แผนจ้างดำเนินการ — Step 2 สรุปงานก่อนปิดงาน หน่วยงานปิดงานแทนผู้รับจ้าง', () => stepPage('S10 แผนจ้าง Step 2', { hire: true, step: 2, filled: true })],
    // 6 พ.ย. 2569 รีวิว S6 "ตอน export ก็เกี่ยวข้องด้วย" — ส่งออกแผนเดินทางจากหน้ารายละเอียดแผนเดินทาง (R84) · ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน (I.27–I.32)
    ['หน้ารายละเอียดแผนเดินทาง — กดส่งออก — popup รูปแบบไฟล์', () => tripDetail('S10 ส่งออกแผนเดินทาง', { exportPdf: true })],
    ['ส่งออกแผนเดินทางสำเร็จ', async () => { const s = await tripDetail('S10 ส่งออกแผนเดินทางสำเร็จ', {}); notify(s, 'ส่งออกไฟล์สำเร็จ'); return s; }],
    ['ไฟล์ PDF หน้า 1 — รายละเอียดแผนเดินทาง และยานพาหนะ', () => tripPdf('S10 ไฟล์ PDF แผนเดินทาง หน้า 1', 1)],
    ['ไฟล์ PDF หน้า 2 — อะไหล่ของแผนเดินทาง', () => tripPdf('S10 ไฟล์ PDF แผนเดินทาง หน้า 2', 2)],
    ['ไฟล์ Excel — ชีตยานพาหนะในแผนเดินทาง', () => tripXls('S10 ไฟล์ Excel ชีตยานพาหนะ', 0)],
    ['ไฟล์ Excel — ชีตอะไหล่ของแผนเดินทาง', () => tripXls('S10 ไฟล์ Excel ชีตอะไหล่', 1)],
    // 9 พ.ย. 2569 (R86) แบบตรวจตามประเภทยานพาหนะ — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['ยานพาหนะประเภทรถพ่วงฉีดน้ำ — Step 1 ใช้แบบตรวจสภาพรถพ่วงฉีดน้ำ', () => stepPage('S10 Step 1 รถพ่วงฉีดน้ำ', { step: 1, car: WATER_CAR })],
    ['ยานพาหนะประเภทรถพ่วงฉีดน้ำ — ตรวจรายการและลงนามครบ', () => stepPage('S10 Step 1 รถพ่วงฉีดน้ำ ลงนามครบ', { step: 1, car: WATER_CAR, filled: true, signed: true })],
    // R83 แก้วันดำเนินการของคันนี้ตอนเริ่มงาน (9 พ.ย. 2569 ค่ำ เจ้าของงาน _"ในแผนการเดินทางอ่ะ จะมีช่วงของการดำเนินการอยู่แล้ว แต่ในรายคันอยากให้เห็นว่าแต่ละคันจะดำเนินการเมื่อไร"_ + _"ใส่ตรงหน้ารายการรถ ก็ได้ หรือจะใส่ในตอนเริ่มงานก็ได้ … อยากให้สามารถแก้ไขได้"_) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['Step 1 — แก้วันดำเนินการของคันนี้ (ปฏิทิน เลือกได้ในช่วงวันเดินทาง)', () => stepPage('S10 Step 1 แก้วันดำเนินการ', { step: 1, workPick: ['04/11/2569', '05/11/2569'] })]]],
  // S11 กบค. ตรวจรับงานรายคันของผู้รับจ้าง — ตัดออกทั้ง scenario 4 พ.ย. 2569 (เจ้าของงาน "อยากตัด scen ผู้รับจ้าง หรือ vendor ตรวจรับทีละคัน ออก") · บล็อก J ว่าง (BLOCK_OF) · ยังตัดอยู่ 10 พ.ย. 2569
  /* S23 ผู้รับจ้าง บันทึกงานรายคันและส่งตรวจงาน — ตัด 4 พ.ย. 2569 · เอากลับ 10 พ.ย. 2569 (R87) เจ้าของงาน _"scen s23 อยากปรับ ui ให้เหมือนกับ s10 แต่ว่า เงื่อนไขการมองเห็น เมนูต่างๆ ยังเป็นเหมือนเดิม"_
     UI ของ S10 ปัจจุบัน (ตัวนับ ตรวจแล้ว x/y · ปุ่มส่งออก · หน้างานรายคัน · Step 1 แบบตรวจตามประเภท R86 + วันดำเนินการ R83 + ลงนาม · Step 2 สรุปงานก่อนปิดงาน · toast ขวาบน R60)
     + การมองเห็นของ S23 เดิม (เมนู "…" ดูรายละเอียดอย่างเดียว · อะไหล่ตามแผนดูอย่างเดียว · หลังปิดงานแก้ไข ลบ เพิ่ม อะไหล่และภาพ · ส่งตรวจงาน · ส่งกลับแก้ไข) · Step 2 ไม่มีค่าใช้จ่ายและราคา
     ฝั่งผู้ตรวจรับไม่วาด (S11 ยังตัด · ผู้ตรวจรับยังไม่เคาะ) · บล็อก V */
  ['S23 · ผู้รับจ้าง บันทึกงานรายคันและส่งตรวจงาน', [
    ['หน้ารายละเอียดแผนเดินทาง มุมผู้รับจ้าง — ยังไม่เริ่มงาน ตรวจแล้ว 0/6', () => tripDetail('S23 รายละเอียดแผนเดินทาง', { trip: HIRE_T, vendor: true })],
    ['กดปุ่ม … ของยานพาหนะ — ดูรายละเอียดอย่างเดียว ไม่มีแก้ไข ลบ', () => tripDetail('S23 เมนูของยานพาหนะ', { trip: HIRE_T, vendor: true, menu: true })],
    ['หน้างานรายคัน ยังไม่เริ่ม — อะไหล่ตามแผนดูอย่างเดียว', () => jobPage('S23 งานรายคัน', { vendor: true })],
    ['กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา วันดำเนินการอ่านอย่างเดียว', async () => { const s = await stepPage('S23 Step 1 ตรวจสภาพก่อนบำรุงรักษา', { vendor: true, step: 1 }); notify(s, 'เริ่มงานบำรุงรักษาแล้ว'); return s; }],
    ['กดเซ็นลงนาม — ลงนามการตรวจสภาพ', () => stepPage('S23 ลงนามการตรวจสภาพ', { vendor: true, step: 1, filled: true, signModal: true })],
    ['ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้', () => stepPage('S23 Step 1 ลงนามครบ', { vendor: true, step: 1, filled: true, signed: true })],
    ['ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน ไม่มีค่าใช้จ่ายและราคา', () => stepPage('S23 Step 2 สรุปงานก่อนปิดงาน', { vendor: true, step: 2 })],
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus', () => stepPage('S23 Validation', { vendor: true, step: 2, errors: true })],
    ['กรอกผลงานครบ', () => stepPage('S23 ปิดงานกรอกครบ', { vendor: true, step: 2, filled: true })],
    ['ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง ดำเนินการบำรุงรักษาแล้ว ตรวจแล้ว 1/6', async () => { const s = await tripDetail('S23 ปิดงานสำเร็จ', { trip: HIRE_T, vendor: true, st: { [HIRE_DONE]: 'worked' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['หน้างานรายคัน ดำเนินการบำรุงรักษาแล้ว — ปุ่มแก้ไขงาน ส่งตรวจงาน', () => vendorJob('S23 ดำเนินการบำรุงรักษาแล้ว', { st: 'worked' })],
    ['กดไอคอนแก้ไขอะไหล่ — แก้จำนวนที่ใช้จริง', () => vendorJob('S23 แก้ไขอะไหล่', { st: 'worked', partEdit: true })],
    ['กดเพิ่มอะไหล่ — popup เพิ่มอะไหล่ที่ใช้จริง', () => vendorJob('S23 เพิ่มอะไหล่', { st: 'worked', partAdd: 'filled' })],
    ['กดไอคอนลบอะไหล่ — ยืนยันเอาออก', () => vendorJob('S23 ลบอะไหล่', { st: 'worked', partDel: true })],
    ['กดส่งตรวจงาน — ยืนยันส่งตรวจงาน', async () => { const s = await vendorJob('S23 ยืนยันส่งตรวจงาน', { st: 'worked' }); await confirm(s, HIRE_SEND_CONFIRM(TRIP_CARS[HIRE_DONE])); return s; }],
    ['ส่งตรวจงานแล้ว — รอตรวจรับ', async () => { const s = await vendorJob('S23 รอตรวจรับ', { st: 'wait' }); notify(s, 'ส่งตรวจงานแล้ว'); return s; }],
    ['บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน', () => jobPage('S23 บำรุงรักษาไม่ได้', { vendor: true, i: HIRE_CANNOT, modal: 'cannot', reason: HIRE_WHY })],
    ['บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว', () => stepPage('S23 บำรุงรักษาไม่ได้ Step 2', { vendor: true, step: 2, modal: 'cannot', reason: HIRE_WHY })],
    ['หน้างานรายคัน แจ้งบำรุงรักษาไม่ได้ — ปุ่มแก้ไขงาน ส่งตรวจงาน', () => vendorJob('S23 แจ้งบำรุงรักษาไม่ได้', { st: 'reported', cannot: true })],
    ['ถูกส่งกลับแก้ไข — คันที่ปิดงานไว้', () => vendorJob('S23 ส่งกลับแก้ไข', { st: 'returned' })],
    ['ถูกส่งกลับแก้ไข — คันที่แจ้งบำรุงรักษาไม่ได้', () => vendorJob('S23 ส่งกลับแก้ไข แจ้งไม่ได้', { st: 'returned', cannot: true })],
    ['หน้ารายละเอียดแผนเดินทาง — สถานะงานรายคันระหว่างทาง ตรวจแล้ว 2/6', () => tripDetail('S23 รายละเอียดแผนเดินทาง ระหว่างทาง', { trip: HIRE_T, vendor: true, st: HIRE_VENDOR })]]],
  ['S12 · ผู้ดำเนินการ บันทึกผลตรวจน้ำมันไฮดรอลิก', [   // 4 พ.ย. 2569 เลิก popup: ใส่ผลตอนปิดงาน (ถ้ามี) หรือภายหลังที่หน้ารายละเอียดงานรายคัน · ป้ายรอผลที่สถานะงาน
    ['Step 2 สรุปงานก่อนปิดงาน — เลือกเก็บตัวอย่าง ใส่ผลการทดสอบได้ (ถ้ามี)', () => stepPage('S12 Step 2 ผลการทดสอบ', { step: 2, filled: true })],   // 5 พ.ย. 2569 หน้าปิดงานเป็น Step 2 ของ S10
    ['ปิดงานโดยยังไม่มีผล — ป้ายรอผลตรวจน้ำมัน', async () => { const s = await tripDetail('S12 รอผลตรวจน้ำมัน', { st: JOB_MIX, oil: { [JOB_I]: 'wait' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด', () => tripDetail('S12 เมนูของยานพาหนะ', { st: JOB_MIX, oil: { [JOB_I]: 'wait' }, menu: true })],
    ['หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง', () => workDetail('S12 งานรายคัน รอผล', { res: {} })],
    ['กดบันทึกโดยยังไม่เลือกผล', () => workDetail('S12 ผลการทดสอบยังไม่ครบ', { res: { errors: true } })],
    ['เลือกผล + แนบไฟล์ (ถ้ามี)', () => workDetail('S12 ผลการทดสอบกรอกครบ', { res: { sel: 1, files: [OIL_FILE] } })],
    ['บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง', async () => { const s = await workDetail('S12 บันทึกผลสำเร็จ', { res: { sel: 1, files: [OIL_FILE], saved: true } }); notify(s, 'บันทึกผลการทดสอบน้ำมันไฮดรอลิกสำเร็จ'); return s; }],
    ['กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน', () => tripDetail('S12 น้ำมันไม่ผ่าน', { st: JOB_MIX, oil: { [JOB_I]: 'fail' } })]]],
  /* S13 ปรับ 10 พ.ย. 2569 (เจ้าของงาน Q19 Q23 Q28 · ผู้ดูแลยานพาหนะรับทราบ + ประเมินรายคัน) — รหัส L.1–L.5 เดิม (ยังไม่เคยรีวิว) เปลี่ยนเนื้อ · L.6 ต่อท้าย
     11 พ.ย. 2569 (R94) ประเมินเป็นแบบประเมินความพึงพอใจของ กบค. → รอบต่อมา เจ้าของงาน "ย้ายออกจาก S13 ไปอยู่ view ใหม่" ⇒ S13 รับทราบอย่างเดียว · ประเมินอยู่ S27 บล็อก Y → 12 พ.ย. 2569 ย้ายเป็นเรื่องแยก satisfaction-plugin (R105) คันที่รับทราบแล้วเข้ารายการประเมินของเรื่องนั้น
     L.2 ปุ่มรับทราบกดได้ · L.4 รายการหลังรับทราบ (เดิมประเมินแล้ว) · L.7 บทบาทอื่นดูอย่างเดียว (เดิมตอบยังไม่ครบ) — รหัสเดิมไม่เลื่อน
     S14 ตรวจหลักฐานทั้งแผน และ S15 ส่งประวัติ ตัดออก 10 พ.ย. 2569 (บล็อก M N ว่าง) — S16 S17 ตัดตามมา 10 พ.ย. 2569 · ผู้ดูแลยานพาหนะรับทราบรายคันเป็นขั้นสุดท้าย รับทราบครบทุกคันแล้วแผนปิดงานเอง (เสนอ) */
  ['S13 · ผู้ดูแลยานพาหนะ รับทราบผลการบำรุงรักษารายคัน', [
    ['รายการผลการบำรุงรักษารอรับทราบ — มีแจ้งเตือนใหม่', async () => { const s = await ackList('S13 รายการ', {}); bell(s, true); return s; }],
    ['ผลการบำรุงรักษารายคัน — ปุ่มรับทราบกดได้', () => ackResult('S13 ผลรายคัน', {})],   // 11 พ.ย. 2569 รอบต่อมา: ประเมินย้ายไป S27 ⇒ รับทราบอย่างเดียว กดได้ทันที (เดิม "ยังไม่ประเมิน ปุ่มรับทราบกดไม่ได้")
    ['คันที่บำรุงรักษาไม่ได้ — ฟอร์มเดียวกัน แสดงสาเหตุ รับทราบได้เลย', () => ackResult('S13 บำรุงรักษาไม่ได้', { cannot: true })],
    ['กลับหน้ารายการ — คันที่รับทราบแล้วสถานะรับทราบแล้ว', () => ackList('S13 รายการหลังรับทราบ', { accepted: [0] })],   // L.4 เดิม "ประเมินความพึงพอใจแล้ว" ไม่มีความหมายแล้ว (ประเมินย้ายไป S27) ⇒ ใช้รหัสเดิมเป็นรายการหลังรับทราบ
    ['รับทราบแล้ว — ป้ายรับทราบแล้ว ปุ่มประเมินความพึงพอใจ', async () => { const s = await ackResult('S13 รับทราบแล้ว', { done: true }); notify(s, 'รับทราบผลการบำรุงรักษา ' + TRIP_CARS[JOB_I][0] + ' แล้ว'); return s; }],
    ['เปิดแผงแจ้งเตือน — ปิดงานแล้ว รอรับทราบ', async () => { const s = await ackList('S13 แผงแจ้งเตือน', {}); bell(s, true); await notiPanel(s, [NOTI_ACK, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['บทบาทอื่นเปิดดูผล — ไม่มีปุ่มรับทราบ', () => ackResult('S13 บทบาทอื่นเปิดดู', { viewOnly: true })]]],   // L.7 เดิม "แบบประเมินตอบยังไม่ครบ" (ประเมินย้ายไป S27) ⇒ ใช้รหัสเดิมเป็นจอดูอย่างเดียวของบทบาทอื่น (Permission S13)
  /* S16 หัวหน้าหน่วยงาน ตรวจสอบประวัติ และ S17 ออกรายงานผลและปิดงาน ตัดออก 10 พ.ย. 2569 (เจ้าของงาน "s16 ตัดทิ้งไม่ต้องรับทราบทั้งแผน ตอนเสร็จงานแล้ว รับทราบรายคันก็พอ" + "s17 ตัดทิ้ง")
     บล็อก O P ว่าง · ผู้ดูแลยานพาหนะรับทราบรายคัน (S13) เป็นขั้นสุดท้าย · รับทราบครบทุกคันแล้วแผนปิดงานเอง (เสนอ) · ดูผลที่แดชบอร์ด S4 S24 */
  ['S18 · ผู้ดำเนินการ คำนวณต้นทุนการบำรุงรักษา', [   // เคาะ 10 พ.ย. 2569 (R92) · เดิม Q.1 Q.2 ร่างหน้าต้นทุนแยก
    ['รายละเอียดแผนที่อนุมัติแล้ว — แท็บต้นทุนการบำรุงรักษา', () => planDetailQ('S18 รายละเอียดแผน')],
    ['แท็บต้นทุนการบำรุงรักษา — สรุปรายไตรมาส ต้นทุนรายคัน และยานพาหนะที่บำรุงรักษาไม่ได้', () => costScreen('S18 ต้นทุน')],
    ['กดส่งออก — ส่งออกไฟล์ Excel สำเร็จ', async () => { const s = await costScreen('S18 ส่งออกแล้ว'); notify(s, 'ส่งออกไฟล์สำเร็จ'); return s; }],
    ['ไฟล์ Excel — ชีตสรุปรายไตรมาส', () => costXls('S18 ไฟล์ Excel สรุปรายไตรมาส', 0)],
    ['ไฟล์ Excel — ชีตต้นทุนรายคัน', () => costXls('S18 ไฟล์ Excel ต้นทุนรายคัน', 1)],
    ['ยังไม่มียานพาหนะปิดงาน — ยังไม่มีต้นทุน', () => costScreen('S18 ยังไม่มีต้นทุน', { empty: true })]]],
  // S19 S20 ต่อท้าย ⇒ ตัวอักษรบล็อกของ scenario เดิมไม่ขยับ · ลำดับในเรื่องอยู่ที่ journey (build.json)
  ['S19 · ผู้สร้างแผน แก้ไขแผนบำรุงรักษา แล้วส่งอนุมัติใหม่', [
    ['เมนู "…" → แก้ไข', async () => { const s = await listScreen('S19 เมนู', { rows: [planAs('returned')].concat(ownPlans(UNITS[0])) }); planMenu(s, MENU); return s; }],
    ['รายละเอียดแผน — ส่งกลับแก้ไข', () => planDetail('S19 รายละเอียดแผน', { status: 'returned' })],
    ['ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้', () => planForm('S19 ฟอร์มแก้ไข', Object.assign({ alert: ALERT_RETURNED }, EDIT_FORM))],
    ['เอาภาคหรือตัวกรองออก — ยานพาหนะที่จัดไว้แล้วยังอยู่', () => planForm('S19 เอาตัวกรองออก', Object.assign({}, EDIT_FORM, { q: 0, regions: [REGIONS[0]] }))],   // 5 พ.ย. 2569 ตาม S1 เลิก confirm เอารถออก
    ['“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น', async () => { const s = await planForm('S19 ยืนยันการออก', EDIT_FORM); await confirm(s, EXIT_CONFIRM('ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก')); return s; }],
    ['ยืนยันการแก้ไขแผน', async () => { const s = await planForm('S19 ยืนยันการแก้ไข', EDIT_FORM); await confirm(s, EDIT_CONFIRM); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S19 บันทึกไม่สำเร็จ', EDIT_FORM); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — รออนุมัติ', async () => { const s = await listScreen('S19 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(ownPlans(UNITS[0])) }); notify(s, 'บันทึกการแก้ไขแผนและส่งอนุมัติสำเร็จ'); return s; }],
    ['แผนอนุมัติแล้ว — เมนู "…" → แก้ไข', async () => { const s = await listScreen('S19 เมนูอนุมัติแล้ว', { rows: [planAs('approved')].concat(ownPlans(UNITS[0])) }); planMenu(s, MENU.slice(0, 2)); return s; }],
    ['แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่', () => planForm('S19 ฟอร์มอนุมัติแล้ว', Object.assign({ alert: ALERT_APPROVED }, EDIT_FORM))],
    ['แผนดำเนินการแล้ว — เมนู "…" ดูรายละเอียดอย่างเดียว', async () => { const s = await listScreen('S19 เมนูดำเนินการ', { rows: ownPlans(UNITS[0]) }); planMenu(s, MENU.slice(0, 1)); return s; }]]],
  ['S20 · ผู้สร้างแผน ลบแผนบำรุงรักษาที่ยังไม่อนุมัติ', [
    ['เมนู "…" → ลบ ในหน้า List', async () => { const s = await listScreen('S20 เมนู', { rows: [NEW_PLAN].concat(ownPlans(UNITS[0])) }); planMenu(s, MENU); return s; }],
    ['ยืนยันการลบแผน ในหน้า List', async () => { const s = await listScreen('S20 ยืนยันการลบ List', { rows: [NEW_PLAN].concat(ownPlans(UNITS[0])) }); await confirm(s, DELETE_CONFIRM); return s; }],
    ['ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)', async () => { const s = await listScreen('S20 ลบสำเร็จ', { rows: ownPlans(UNITS[0]) }); notify(s, 'ลบแผนบำรุงรักษาสำเร็จ'); return s; }],
    ['ปุ่ม “ลบแผน” ในหน้า Detail', () => planDetail('S20 ปุ่มลบแผน', {})],
    ['ยืนยันการลบแผน ในหน้า Detail', async () => { const s = await planDetail('S20 ยืนยันการลบ Detail', {}); await confirm(s, DELETE_CONFIRM); return s; }],
    ['แผนอนุมัติแล้ว — หน้ารายละเอียดไม่มีปุ่มลบ', () => planDetail('S20 อนุมัติแล้ว', { status: 'approved' })]]],
  /* S21 ปรับ 5 พ.ย. 2569 (เจ้าของงาน): จัดการอะไหล่ทีละคัน (หน้าแยก) · เข้าจากไอคอนแก้ไขที่แถวรถในแท็บไตรมาส n · บันทึกแล้วรวมลงหัวข้ออะไหล่ในไตรมาส (ตั้งต้นว่าง) */
  ['S21 · ผู้สร้างแผน จัดการอะไหล่ของยานพาหนะแต่ละคันในแผน', [
    ['แท็บไตรมาส 1 — ทุกคันยังไม่กำหนด อะไหล่ในไตรมาสว่าง', () => planForm('S21 แท็บไตรมาส 1', Object.assign({ values: FILLED, alloc: A_ALL, q: 1 }, R2))],
    ['เมนู … → แก้ไข — หน้าจัดการอะไหล่ของยานพาหนะ (ยังไม่กำหนด)', () => carPartsScreen('S21 สิ่งที่ต้องทำของยานพาหนะ', {})],
    ['เลือกยานพาหนะคันอื่น — รายการยานพาหนะในไตรมาสเปิด', () => carPartsScreen('S21 เลือกยานพาหนะ', { carOpen: true })],
    ['เลือกเปลี่ยนน้ำมัน — ระบุเบอร์น้ำมัน รหัส จำนวนลิตร', () => carPartsScreen('S21 เปลี่ยนน้ำมัน', { oil: 1, oilSpec: { code: OIL_SPEC.code, litre: OIL_SPEC.litre }, gradeOpen: true })],
    ['เลือกไส้กรองจากคลัง — เข้าอะไหล่อื่นๆ ของยานพาหนะคันนี้', () => carPartsScreen('S21 เลือกไส้กรอง', { oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD })],
    ['ระบุอะไหล่เพิ่มเติม — popup ชื่อ ยี่ห้อ รุ่น รหัส จำนวน หน่วย', () => carPartsScreen('S21 ระบุอะไหล่', { oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD, manual: {} })],
    ['ระบุอะไหล่เพิ่มเติมแล้ว — อยู่ในรายการ', () => carPartsScreen('S21 ระบุอะไหล่แล้ว', { oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD, manual: { filled: true } })],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await carPartsScreen('S21 ยืนยันการออก', { oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD, manual: { filled: true } }); await confirm(s, EXIT_CONFIRM('อะไหล่ที่แก้ไขไว้จะไม่ถูกบันทึก')); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await carPartsScreen('S21 บันทึกไม่สำเร็จ', { oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD, manual: { filled: true } }); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — กลับแท็บไตรมาส 1 ยานพาหนะ 1 คันกำหนดแล้ว อะไหล่ในไตรมาสมีของคันนี้', async () => { const s = await planForm('S21 บันทึกสำเร็จ', Object.assign({ values: FILLED, alloc: A_ALL, q: 1, picks: { 0: CAR_ADD }, oils: { 0: 1 }, manualCars: [0] }, R2)); notify(s, 'บันทึกอะไหล่ของยานพาหนะ ' + CAND[0][0] + ' แล้ว'); return s; }],
    // 6 พ.ย. 2569 เลือกเบิก หรือไม่เบิกอะไหล่ — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['เลือกเบิกอะไหล่ — คลังอะไหล่และรายการขึ้น ยังไม่เลือกอะไหล่ ปุ่มบันทึกกดไม่ได้', () => carPartsScreen('S21 เลือกเบิกอะไหล่', { draw: 'take' })],
    ['เลือกไม่เบิกอะไหล่ — ไม่ต้องเลือกอะไหล่ ปุ่มบันทึกกดได้', () => carPartsScreen('S21 เลือกไม่เบิก', { draw: 'none' })],
    ['บันทึกไม่เบิกอะไหล่แล้ว — แถวยานพาหนะขึ้น ไม่เบิกอะไหล่', async () => { const s = await planForm('S21 บันทึกไม่เบิก', Object.assign({ values: FILLED, alloc: A_ALL, q: 1, picks: { 0: CAR_ADD }, oils: { 0: 1, 1: 0 }, manualCars: [0], draw: { 1: 'none' } }, R2)); notify(s, 'บันทึกอะไหล่ของยานพาหนะ ' + CAND[1][0] + ' แล้ว'); return s; }]]],
  /* S22 กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส — ตัดออก 6 พ.ย. 2569 (เจ้าของงาน "ตอนที่เลือกรถเข้าแผน เลือกอะใหล่ อยากให้ส่งจำนวนทั้งปีไปที่ smartinventory โดยยังไม่ส่งให้ตัด แค่ inform" + เลือกส่งตอนแผนอนุมัติแล้ว แทนการให้คลังกดรับทราบ)
     ⇒ ระบบแจ้ง Smart Inventory ตอน S2 อนุมัติ · บล็อก U เว้นว่าง · warehouseScreen/whParts คงไว้ */
  /* S24 ข้อมูลการบำรุงรักษารายคัน (เจ้าของงาน 4 พ.ย. 2569 · เลขชั่วคราว = W ต่อท้าย) — แท็บ การบำรุงรักษา ของ Vehicle Management */
  /* S24 ปรับ 10 พ.ย. 2569 เป็นแดชบอร์ดรายคัน + รายละเอียดยานพาหนะ 5 แท็บ (R90) — รหัส W.1–W.8 เดิมเปลี่ยนเนื้อ · W.9–W.17 ต่อท้าย */
  ['S24 · ผู้ดำเนินการ ติดตามข้อมูลการบำรุงรักษารายคันและกำหนดครั้งถัดไป', [
    ['แท็บการบำรุงรักษา — แดชบอร์ดยานพาหนะทุกคัน การ์ดตัวเลข เรียงกำหนดครั้งถัดไป', () => maList('S24 การบำรุงรักษา', {})],
    ['ค้นหาทะเบียน', () => maList('S24 ค้นหาทะเบียน', { query: '82-1145', rows: [MA_CAR] })],
    ['ค้นหาไม่พบ', () => maList('S24 ค้นหาไม่พบ', { query: '99-9999', rows: [] })],
    ['กดตัวกรอง — แผงตัวกรอง ประเภท สังกัด บำรุงรักษาล่าสุด ครบกำหนดภายใน รายการ ผลตรวจน้ำมัน', () => maList('S24 แผงตัวกรอง', { filter: {} })],
    ['กรองแล้ว — ใกล้ครบกำหนดบำรุงรักษา', () => maList('S24 กรองใกล้ครบกำหนด', { chips: [MA_DUE.near[0]], rows: maIdx(r => { const n = maNext(r); return n && n[2] === 'near'; }) })],
    ['กดเลขทะเบียน — เปิดหน้ารายละเอียดยานพาหนะ แท็บข้อมูลยานพาหนะ', () => maDetail('S24 กดเลขทะเบียน', { tab: 0, row: 1 })],   // 12 พ.ย. 2569 (R107) แบบ Vehicle info ของ VMS+ · 80-5738 น่าน = ภาพที่เจ้าของงานรีวิวบนเว็บ (info-80-5738)   // 10 พ.ย. 2569 รอบ 2 ไม่มีคอลัมน์ปุ่ม … แล้ว
    ['รายละเอียดยานพาหนะ — แท็บตารางบำรุงรักษา กำหนดครั้งถัดไป 5 รายการ', () => maDetail('S24 ตารางบำรุงรักษา', { tab: 1 })],
    ['ประวัติ กดปุ่ม … — ดูรายละเอียดงานที่ปิดแล้ว', () => maDetail('S24 เมนูประวัติ', { tab: 1, menu: true })],
    ['กรองแล้ว — ต้องเก็บตัวอย่างน้ำมัน', () => maList('S24 กรองเก็บตัวอย่างน้ำมัน', { chips: ['เก็บตัวอย่างน้ำมัน'], rows: maIdx(r => r[1] && maOil(r)[0] === 'เก็บตัวอย่าง' && maOil(r)[1][1]) })],
    ['กรองแล้ว — บำรุงรักษาล่าสุดเกิน 12 เดือน', () => maList('S24 กรองบำรุงรักษาล่าสุด', { chips: ['บำรุงรักษาล่าสุด เกิน 12 เดือน'], rows: maIdx(r => r[1] && maKey(r[1]) < maKey('10/11/2568')) })],
    ['กรองแล้ว — ครบกำหนดภายใน 3 เดือน', () => maList('S24 กรองภายใน 3 เดือน', { chips: ['ครบกำหนดภายใน 3 เดือน'], rows: maIdx(r => { const n = maNext(r); return n && maKey(n[1]) <= maKey('10/02/2570'); }) })],
    ['แท็บตารางบำรุงรักษา — คันที่ครบกำหนดหลายรายการ ปีที่ครบเปลี่ยนน้ำมัน', () => maDetail('S24 ตารางบำรุงรักษา ครบกำหนด', { tab: 1, row: 0 })],   // 10 พ.ย. 2569 รอบ 2 แทนแท็บข้อมูลยานพาหนะ (ย้ายไป W.6)
    /* 12 พ.ย. 2569 (R107) W.13 = แท็บประวัติการซ่อมบำรุงแบบรวมซ่อม + บำรุงรักษา ป้าย Overhaul · W.14 W.15 เดิมแท็บการรับประกัน (เอาออก) ⇒ ส่วนการรับประกันท้ายแท็บข้อมูลยานพาหนะ · ยานพาหนะนอกกลุ่มเครื่องมือกล */
    ['รายละเอียดยานพาหนะ — แท็บประวัติการซ่อมบำรุง ซ่อมและบำรุงรักษาเรียงวันที่ปิดงาน ป้าย Overhaul', () => maDetail('S24 ประวัติการซ่อมบำรุง', { tab: 4 })],
    ['แท็บข้อมูลยานพาหนะ — มีงานในประกัน ส่วนการรับประกันท้ายแท็บ', () => maDetail('S24 ข้อมูลยานพาหนะ มีประกัน', { tab: 0 })],
    ['แท็บข้อมูลยานพาหนะ — รหัสข้างนอกกลุ่ม 04 07 08 09 10 ไม่มีส่วนเครื่องมือกล ไม่มีงานในประกัน', () => maDetail('S24 ข้อมูลยานพาหนะ นอกกลุ่มเครื่องมือกล', { tab: 0, row: 0 })],
    // W.16 W.17 แท็บ Overhaul เอาออก 10 พ.ย. 2569 รอบ 2 (เจ้าของงาน "มี tab แต่ไม่มี display ออกมา")
    /* 12 พ.ย. 2569 แดชบอร์ดแบบ VMS+ (R106) — ต่อท้าย W.16 W.17 W.18 (รหัสเดิมของแท็บ Overhaul ที่เอาออกแล้ว) · กดกราฟ/กดเรื่องที่ควรดู = กรองทั้งหน้า + ชิปตัวกรองที่เลือก */
    ['กดกราฟ — ส่วนเลยกำหนดของโดนัทสถานะกำหนดบำรุงรักษา กรองทั้งหน้า', () => maList('S24 กดกราฟเลยกำหนด', { chips: ['สถานะ เลยกำหนด'], rows: MA_ALERT.over, pickChart: 'status' })],
    ['กดเรื่องที่ควรดู — ผลตรวจน้ำมันล่าสุดไม่ผ่าน กรองทั้งหน้า', () => maList('S24 กดเรื่องที่ควรดู', { chips: ['ผลตรวจน้ำมันล่าสุด ไม่ผ่าน'], rows: MA_ALERT.fail, alert: 'fail', pickChart: 'oil' })],
    ['มุมมองมือถือ — การ์ดตัวเลข 2 ใบต่อแถว กราฟเรียงทีละใบ ตารางเป็นการ์ด', () => maList('S24 มุมมองมือถือ', { mobileAll: true })],
    /* 12 พ.ย. 2569 (R107 · เว็บ f6f5e0d BACKLOG ข้อ 84 85) — การ์ดเครื่องมือกลของ กบค. · แท็บประวัติใหม่ 2 แท็บ · มุมมองมือถือของแท็บข้อมูลยานพาหนะ */
    ['กบค. — การ์ดเครื่องมือกล ช่องที่ยังไม่มีข้อมูลมีปุ่มเพิ่ม ช่องที่มีข้อมูลแก้ไขได้', () => maDetail('S24 เครื่องมือกล กบค.', { tab: 0, row: 1, kbk: true })],
    ['กบค. — ยานพาหนะในกลุ่มที่ยังไม่มีเครื่องมือกล การ์ดว่าง ปุ่มเพิ่มเครื่องมือกล', () => maDetail('S24 ไม่มีเครื่องมือกล กบค.', { tab: 0, row: 8, kbk: true })],
    ['แท็บประวัติการบำรุงรักษาเครื่องจักร — บันทึกบำรุงรักษาตามวาระ', () => maDetail('S24 ประวัติเครื่องจักร', { tab: 2 })],
    ['แท็บประวัติการบำรุงรักษาเครื่องยนต์ — เช็คระยะที่ศูนย์บริการ', () => maDetail('S24 ประวัติเครื่องยนต์', { tab: 3 })],
    ['แท็บข้อมูลยานพาหนะบนมือถือ — เรียง 1 คอลัมน์ลำดับเดียวกับ desktop กบค. แก้ไขเครื่องมือกลได้', () => maDetail('S24 ข้อมูลยานพาหนะ มุมมองมือถือ', { tab: 0, kbk: true })],
    /* 12 พ.ย. 2569 (R107 · MachineModal ของเว็บ) — popup เพิ่ม/แก้ไขเครื่องมือกลของ กบค. · ไม่ผ่านเงื่อนไข · บันทึกสำเร็จ */
    ['popup เพิ่มเครื่องมือกล — กบค. กดเพิ่มจากการ์ดว่าง ช่องว่าง รหัสทรัพย์สินย่อยตั้งต้น 0001', async () => { const s = await maDetail('S24 popup เพิ่มเครื่องมือกล', { tab: 0, row: 8, kbk: true }); await machineModal(s, 8); return s; }],
    ['popup แก้ไขเครื่องมือกล — ค่าเดิมของเครื่องเป็นค่าตั้งต้น ช่องที่ไม่มีข้อมูลว่าง', async () => { const s = await maDetail('S24 popup แก้ไขเครื่องมือกล', { tab: 0, row: 1, kbk: true }); await machineModal(s, 1, { edit: true }); return s; }],
    ['กดบันทึกโดยยังไม่กรอก — ช่องบังคับขึ้นข้อความ error', async () => { const s = await maDetail('S24 เครื่องมือกล ไม่ผ่านเงื่อนไข', { tab: 0, row: 8, kbk: true }); await machineModal(s, 8, { tried: true }); return s; }],
    ['บันทึกเครื่องมือกลสำเร็จ — ปิด popup การ์ดแสดงค่าที่บันทึก', async () => { const s = await maDetail('S24 บันทึกเครื่องมือกลสำเร็จ', { tab: 0, row: 1, kbk: true }); notify(s, MC_OK); return s; }],
    ]],
  /* S25 ย้ายรถที่บำรุงรักษาไม่ได้ไปไตรมาสอื่น (เจ้าของงาน 5 พ.ย. 2569 · บล็อก X) — ทางเข้าหน้าไตรมาส (S6) · ไปได้เฉพาะไตรมาสถัดไปของแผนเดียวกัน · รถและอะไหล่ตามแผนย้ายตาม · ไม่ต้องอนุมัติใหม่ */
  ['S25 · ผู้ดำเนินการ ย้ายยานพาหนะที่บำรุงรักษาไม่ได้ไปไตรมาสอื่น', [
    ['หน้าไตรมาส 1 — ยานพาหนะที่บำรุงรักษาไม่ได้ ป้ายบำรุงรักษาไม่ได้', () => moveQuarter('S25 ไตรมาส 1 ยานพาหนะบำรุงรักษาไม่ได้', 0)],
    ['กดปุ่ม … ของยานพาหนะ — ดำเนินการบำรุงรักษา หรือ ย้ายไปไตรมาสอื่น', async () => { const s = await moveQuarter('S25 เมนูย้ายไปไตรมาสอื่น', 0); moveMenu(s, MOVE_I); return s; }],
    ['popup ย้ายไปไตรมาสอื่น — ยังไม่เลือกไตรมาส', async () => { const s = await moveQuarter('S25 popup ย้ายไปไตรมาสอื่น', 0); await moveModal(s, { cur: 0 }); return s; }],
    ['เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้', async () => { const s = await moveQuarter('S25 เลือกไตรมาส 2', 0); await moveModal(s, { cur: 0, sel: MOVE_TO }); return s; }],
    ['กรณีไตรมาส 3 — ไตรมาสก่อนหน้าและไตรมาสปัจจุบันเลือกไม่ได้', async () => { const s = await moveQuarter('S25 popup ไตรมาส 3', 2); await moveModal(s, { cur: 2, trip: MOVE_T3 }); return s; }],
    ['ยืนยันการย้ายยานพาหนะ', async () => { const s = await moveQuarter('S25 ยืนยันการย้ายยานพาหนะ', 0); await confirm(s, MOVE_CONFIRM(MOVE_TO)); return s; }],
    ['ย้ายสำเร็จ — ไตรมาส 1 ไม่มียานพาหนะคันนี้แล้ว', async () => { const s = await tripList('S25 ย้ายสำเร็จ', { trips: [JOB_T], removed: [MOVE_I] }); notify(s, MOVE_TOAST); return s; }],
    ['หน้าไตรมาส 2 — ยานพาหนะที่ย้ายมา ยังไม่มีแผนเดินทาง', () => moveQuarter('S25 ไตรมาส 2', MOVE_TO)],   // 9 พ.ย. 2569 ชุดเดียวกับ X.9 (MOVE_Q2_PAGE)
    ['หน้าไตรมาส 2 — อะไหล่ในไตรมาสรวมอะไหล่ของยานพาหนะที่ย้ายมา', () => moveQuarter('S25 อะไหล่ไตรมาส 2', MOVE_TO)],   // 9 พ.ย. 2569 แก้ moveQuarter(…, 2) ที่ได้หน้าไตรมาส 3 · 6 พ.ย. 2569 เดิมหน้าความคืบหน้าอะไหล่ S4 (เปลี่ยนเป็นแดชบอร์ด) ⇒ หัวข้ออะไหล่ในไตรมาสของหน้าไตรมาส   // 6 พ.ย. 2569 เดิมหน้าความคืบหน้าอะไหล่ S4 (เปลี่ยนเป็นแดชบอร์ด) ⇒ หัวข้ออะไหล่ในไตรมาสของหน้าไตรมาส
    ['ไตรมาส 4 — เมนูย้ายไปไตรมาสอื่นกดไม่ได้', async () => { const s = await moveQuarter('S25 ไตรมาส 4 ย้ายไม่ได้', 3); moveMenu(s, 0, true); return s; }],
    // 10 พ.ย. 2569 เจ้าของงาน "ตัวเลือกต้องสามารถเลือก ดำเนินการบำรุงรักษา และ ย้ายไปไตรมาสอื่น" — ต่อท้าย X.11 X.12 รหัสเดิมไม่เลื่อน
    ['เลือกดำเนินการบำรุงรักษา — ยืนยันนำยานพาหนะกลับมาบำรุงรักษาในไตรมาสเดิม', async () => { const s = await moveQuarter('S25 ยืนยันดำเนินการบำรุงรักษา', 0); await confirm(s, MAINT_CONFIRM()); return s; }],
    ['ดำเนินการบำรุงรักษาแล้ว — ยานพาหนะกลับเป็นยังไม่มีแผนเดินทาง รอเพิ่มเข้าแผนเดินทาง', async () => { const s = await tripList('S25 ดำเนินการบำรุงรักษาแล้ว', { trips: [Object.assign({}, JOB_T, { sel: JOB_T.sel.filter(i => i !== MOVE_I) })] }); notify(s, MAINT_TOAST()); return s; }]]],
  /* S27 แบบประเมินความพึงพอใจ (บล็อก Y เดิม) ย้ายไปเรื่องแยก satisfaction-plugin 12 พ.ย. 2569 (R105) */
];


/* ---------- จอ ↔ กล่องในผัง userflow (เจ้าของงานสั่ง 22 ต.ค. 2569: userflow กับ wireframe อยู่ข้างกันตอน export) ----------
   ชื่อ state → id กล่องในผัง mermaid ของ Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md (คั่นด้วยช่องว่างได้หลายกล่อง)
   ไม่ใส่ = ผังยังไม่มีกล่องของจอนี้ ⇒ ปลั๊กอินเขียนบอกใต้ผัง "จอที่ยังไม่มีกล่องในผัง" (รอเติม userflow — ไม่เติมผังเอง) */
const FLOW_NODES = {
  S1: { 'รายการแผน': 'D1', 'รายการแผน — ยังไม่มีแผน': 'D0', 'ฟอร์มสร้างแผน (ว่าง)': 'D2', 'เลือกปีงบประมาณ — รายการปีเปิด': 'A2', 'กดตัวกรอง — แผงตัวกรอง ยังไม่เลือกภาค เขต ประเภทยานพาหนะ': 'A3', 'เลือกภาค เขต ในแผงตัวกรอง — รายการเขตของภาคที่เลือก': 'A7', 'กดตัวกรอง — แผงตัวกรอง รายการภาค มี สนง. (สำนักงานใหญ่)': 'A3', 'กดตัวกรอง — แผงตัวกรอง เลือกภาค สนง. รายการเขต กองของสำนักงานใหญ่': 'A7', 'ยานพาหนะทั้งหมดของพื้นที่ที่เลือก — กดตกลงแล้ว ชิปตัวกรอง ยังไม่ติ๊ก': 'D4', 'ค้นหาและกรองแล้ว': 'A8', 'ไม่พบยานพาหนะที่ตรงกับคำค้นหรือตัวกรอง': 'A8', 'ติ๊กยานพาหนะ 3 คัน — ปุ่มจัดลงไตรมาสกดได้': 'A5', 'กดจัดลงไตรมาส — popup เลือกไตรมาส': 'D6', 'จัดลงไตรมาสแล้ว — ป้ายไตรมาสในตาราง ตัวเลขบนแท็บเปลี่ยน': 'D3', 'แท็บไตรมาส 1 — ทุกคันกำหนดแล้ว อะไหล่ในไตรมาสรวมครบ': 'D12', 'ย้ายยานพาหนะไปไตรมาสอื่น — ติ๊กยานพาหนะที่จัดแล้ว': 'D6', 'เอาภาคหรือตัวกรองออก — ยานพาหนะที่จัดแล้วยังอยู่ในไตรมาส': 'D7', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'D8', 'บันทึกและส่งอนุมัติสำเร็จ — รออนุมัติ': 'A6 D5', 'รายละเอียดแผน — รออนุมัติ ดูอย่างเดียว': 'D9', 'รายละเอียดแผน — อนุมัติแล้ว': 'D10', 'รายละเอียดแผน — ส่งกลับแก้ไข เห็นเหตุผล กดแก้ไขไป S19': 'D11', 'ไตรมาสที่ยังไม่มียานพาหนะ — ปุ่มเพิ่มยานพาหนะเข้าไตรมาส 3': 'D13', 'กดเพิ่มยานพาหนะเข้าไตรมาส 3 — popup ยานพาหนะที่ยังไม่อยู่ในไตรมาสใด': 'A13 D14', 'ติ๊กยานพาหนะ 2 คัน — ปุ่มเพิ่มเข้าไตรมาส 3 กดได้': 'A14', 'เพิ่มยานพาหนะเข้าไตรมาส 3 แล้ว — แท็บไตรมาส 3 มียานพาหนะ ตัวเลขบนแท็บเปลี่ยน': 'D15', 'ทุกคันในพื้นที่จัดลงไตรมาสแล้ว — popup ไม่มียานพาหนะให้เพิ่ม': 'D16', 'แท็บทั้งหมด — อะไหล่รวมทุกไตรมาส รวมอะไหล่ของยานพาหนะทุกคันที่จัดลงไตรมาสแล้ว': 'D12' },
  S6: { 'รายการแผน — เมนู "…" ดูรายละเอียดแผนที่อนุมัติแล้ว': 'D7 A7', 'รายละเอียดแผน — กดไปหน้าไตรมาส 1': 'D8 A8', 'หน้าไตรมาส 1 — ยังไม่มีแผนเดินทาง': 'D1', 'ฟอร์มสร้างแผนเดินทาง (ว่าง)': 'D2', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะทุกคันของไตรมาส': 'D5', 'เพิ่มยานพาหนะแล้ว — สถานที่ตั้งต้นสำนักงานที่ยานพาหนะอยู่': 'D4', 'แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันเดินทาง': 'A5', 'กดไอคอนลบ — เอายานพาหนะออกจากแผนเดินทางนี้ (soft delete)': 'A9', 'กดเพิ่มยานพาหนะอีกครั้ง — ยานพาหนะที่เอาออกกลับมาเลือกได้': 'D5', 'เลือกช่วงวันเดินทาง': 'A3', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'D9', 'กรอกครบ': 'A4', 'สร้างแผนเดินทางสำเร็จ — กลับหน้าไตรมาส 1 แสดงแผนเดินทางใหม่ (รออนุมัติ)': 'D3', 'สร้างแผนเดินทางใบถัดไป — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้': 'D5', 'แผนเดินทาง 2 ใบ — ยานพาหนะครบทุกคัน ปุ่มสร้างแผนเดินทางกดไม่ได้': 'D6', 'แผนเดินทางถูกส่งกลับแก้ไข': 'D1', 'แก้ไขแผนเดินทางที่ถูกส่งกลับ': 'D2', 'ส่งอนุมัติใหม่แล้ว': 'D3', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะที่ยังไม่อยู่ในแผน เพิ่มได้ทุกคัน': 'AA', 'เพิ่มยานพาหนะเข้าไตรมาสแล้ว': 'D1', 'กดไอคอนแก้ไข — แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษา': 'AQ', 'กดไอคอนลบ — ยืนยันเอายานพาหนะออกจากไตรมาส': 'AQ', 'เอายานพาหนะออกจากไตรมาสแล้ว': 'D1', 'ทุกคันในไตรมาสปิดงานแล้ว (รวมบำรุงรักษาไม่ได้) — ปุ่มเพิ่มยานพาหนะกดไม่ได้': 'D11',
    // 6 พ.ย. 2569 E.24 E.25 วันดำเนินการรายคัน (R83) — กล่อง D10 ในผัง S6 ของไฟล์ 14
    'เลือกวันดำเนินการ — ปฏิทินเลือกได้เฉพาะช่วงวันเดินทาง วันนอกช่วงกดไม่ได้': 'D10', 'บันทึกวันดำเนินการแล้ว — หลายคันวันเดียวกันได้ คันที่ไม่แก้คงทั้งช่วงวันเดินทาง': 'D4' },
  S10: { 'หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน ตรวจแล้ว 0/4': 'D1', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ลบ': 'D1', 'เมนูแก้ไข — แก้ไขยานพาหนะในแผนเดินทาง ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ': 'A6', 'เมนูลบ — ยืนยันเอายานพาหนะออกจากแผนเดินทาง': 'A7', 'หน้างานรายคัน — ยังไม่เริ่ม': 'D2', 'กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา สถานะอยู่ระหว่างบำรุงรักษา': 'A2 D3', 'กดเซ็นลงนาม — ลงนามการตรวจสภาพ': 'D3', 'ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้': 'Q4', 'ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน': 'A4 D6', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'Q2', 'เลือกวันที่เปลี่ยนน้ำมันครั้งล่าสุด — ปฏิทิน': 'D6', 'เลือกงบที่ตัด หน่วยงานอื่น — ระบุศูนย์ต้นทุน': 'D6', 'กรอกผลงานครบ': 'A5', 'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง เสร็จสิ้น + รอผลตรวจน้ำมัน': 'D4', 'ปิดงานสำเร็จ — เปลี่ยนน้ำมันอย่างเดียว ไม่มีป้ายรอผลตรวจน้ำมัน': 'D4', 'บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน': 'A3', 'บำรุงรักษาไม่ได้ — ยังไม่ระบุสาเหตุ': 'A3', 'บำรุงรักษาไม่ได้ระหว่าง Step 1 — คืนอะไหล่ตามแผนทั้งหมด': 'A3', 'บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว': 'A3', 'บันทึกบำรุงรักษาไม่ได้แล้ว — กลับหน้ารายละเอียดแผนเดินทาง ตรวจแล้ว 0/3': 'D4', 'ดูงานที่ปิดแล้ว — เสร็จสิ้น': 'D5', 'Step 2 — แนบเอกสาร Safety Inspection (ถ้ามี)': 'D6', 'หน้างานรายคัน — เพิ่มเอกสาร Safety Inspection ภายหลัง': 'D5', 'บันทึกเอกสาร Safety Inspection สำเร็จ': 'D5', 'แผนจ้างดำเนินการ — หน้ารายละเอียดแผนเดินทาง กดปุ่ม … ของยานพาหนะ': 'D1', 'แผนจ้างดำเนินการ — Step 2 สรุปงานก่อนปิดงาน หน่วยงานปิดงานแทนผู้รับจ้าง': 'D6',
    // 6 พ.ย. 2569 I.27–I.32 ส่งออกแผนเดินทาง (R84) — กล่อง A9 D7 ในผัง S10 ของไฟล์ 14
    'หน้ารายละเอียดแผนเดินทาง — กดส่งออก — popup รูปแบบไฟล์': 'A9', 'ส่งออกแผนเดินทางสำเร็จ': 'D7', 'ไฟล์ PDF หน้า 1 — รายละเอียดแผนเดินทาง และยานพาหนะ': 'D7', 'ไฟล์ PDF หน้า 2 — อะไหล่ของแผนเดินทาง': 'D7',
    'ไฟล์ Excel — ชีตยานพาหนะในแผนเดินทาง': 'D7', 'ไฟล์ Excel — ชีตอะไหล่ของแผนเดินทาง': 'D7' },
  // 10 พ.ย. 2569 S23 เอากลับ (R87) — กล่องในผัง S23 ของไฟล์ 14
  S23: { 'หน้ารายละเอียดแผนเดินทาง มุมผู้รับจ้าง — ยังไม่เริ่มงาน ตรวจแล้ว 0/6': 'D1', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียดอย่างเดียว ไม่มีแก้ไข ลบ': 'A0', 'หน้างานรายคัน ยังไม่เริ่ม — อะไหล่ตามแผนดูอย่างเดียว': 'D2',
    'กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา วันดำเนินการอ่านอย่างเดียว': 'A2 D3', 'กดเซ็นลงนาม — ลงนามการตรวจสภาพ': 'D3', 'ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้': 'Q4',
    'ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน ไม่มีค่าใช้จ่ายและราคา': 'A4 D6', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'Q2', 'กรอกผลงานครบ': 'A5',
    'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง ดำเนินการบำรุงรักษาแล้ว ตรวจแล้ว 1/6': 'D9', 'หน้างานรายคัน ดำเนินการบำรุงรักษาแล้ว — ปุ่มแก้ไขงาน ส่งตรวจงาน': 'D4',
    'กดไอคอนแก้ไขอะไหล่ — แก้จำนวนที่ใช้จริง': 'A6', 'กดเพิ่มอะไหล่ — popup เพิ่มอะไหล่ที่ใช้จริง': 'A6', 'กดไอคอนลบอะไหล่ — ยืนยันเอาออก': 'A6', 'กดส่งตรวจงาน — ยืนยันส่งตรวจงาน': 'A8', 'ส่งตรวจงานแล้ว — รอตรวจรับ': 'D7',
    'บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน': 'A3', 'บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว': 'A3', 'หน้างานรายคัน แจ้งบำรุงรักษาไม่ได้ — ปุ่มแก้ไขงาน ส่งตรวจงาน': 'D5',
    'ถูกส่งกลับแก้ไข — คันที่ปิดงานไว้': 'D8', 'ถูกส่งกลับแก้ไข — คันที่แจ้งบำรุงรักษาไม่ได้': 'D8', 'หน้ารายละเอียดแผนเดินทาง — สถานะงานรายคันระหว่างทาง ตรวจแล้ว 2/6': 'D1' },
  S24: { 'แท็บการบำรุงรักษา — ยานพาหนะทุกคัน เรียงกำหนดครั้งถัดไป': 'D1', 'ค้นหาทะเบียน': 'A1', 'ค้นหาไม่พบ': 'D2', 'กดตัวกรอง — แผงตัวกรอง': 'D3', 'กรองแล้ว — ใกล้ครบกำหนดบำรุงรักษา': 'D4', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด': 'A4', 'รายละเอียดยานพาหนะ — แท็บตารางบำรุงรักษา': 'D5', 'ประวัติ กดปุ่ม … — ดูรายละเอียดงานที่ปิดแล้ว': 'A5',
    // 12 พ.ย. 2569 (R107) หน้ารายละเอียดยานพาหนะ = D5 · เพิ่ม/แก้ไขเครื่องมือกลของ กบค. = A7
    'กดเลขทะเบียน — เปิดหน้ารายละเอียดยานพาหนะ แท็บข้อมูลยานพาหนะ': 'A4 D5', 'รายละเอียดยานพาหนะ — แท็บตารางบำรุงรักษา กำหนดครั้งถัดไป 5 รายการ': 'D5',
    'รายละเอียดยานพาหนะ — แท็บประวัติการซ่อมบำรุง ซ่อมและบำรุงรักษาเรียงวันที่ปิดงาน ป้าย Overhaul': 'D5', 'แท็บข้อมูลยานพาหนะ — มีงานในประกัน ส่วนการรับประกันท้ายแท็บ': 'D5',
    'แท็บข้อมูลยานพาหนะ — รหัสข้างนอกกลุ่ม 04 07 08 09 10 ไม่มีส่วนเครื่องมือกล ไม่มีงานในประกัน': 'D5', 'กบค. — การ์ดเครื่องมือกล ช่องที่ยังไม่มีข้อมูลมีปุ่มเพิ่ม ช่องที่มีข้อมูลแก้ไขได้': 'Q2 A7',
    'กบค. — ยานพาหนะในกลุ่มที่ยังไม่มีเครื่องมือกล การ์ดว่าง ปุ่มเพิ่มเครื่องมือกล': 'A7', 'แท็บประวัติการบำรุงรักษาเครื่องจักร — บันทึกบำรุงรักษาตามวาระ': 'D5',
    'แท็บประวัติการบำรุงรักษาเครื่องยนต์ — เช็คระยะที่ศูนย์บริการ': 'D5', 'แท็บข้อมูลยานพาหนะบนมือถือ — เรียง 1 คอลัมน์ลำดับเดียวกับ desktop กบค. แก้ไขเครื่องมือกลได้': 'D5',
    // 12 พ.ย. 2569 popup เพิ่ม/แก้ไขเครื่องมือกล = D8 · บันทึกสำเร็จกลับหน้ารายละเอียด D5
    'popup เพิ่มเครื่องมือกล — กบค. กดเพิ่มจากการ์ดว่าง ช่องว่าง รหัสทรัพย์สินย่อยตั้งต้น 0001': 'A7 D8', 'popup แก้ไขเครื่องมือกล — ค่าเดิมของเครื่องเป็นค่าตั้งต้น ช่องที่ไม่มีข้อมูลว่าง': 'A7 D8',
    'กดบันทึกโดยยังไม่กรอก — ช่องบังคับขึ้นข้อความ error': 'D8', 'บันทึกเครื่องมือกลสำเร็จ — ปิด popup การ์ดแสดงค่าที่บันทึก': 'D5' },
  S12: { 'Step 2 สรุปงานก่อนปิดงาน — เลือกเก็บตัวอย่าง ใส่ผลการทดสอบได้ (ถ้ามี)': 'A1', 'ปิดงานโดยยังไม่มีผล — ป้ายรอผลตรวจน้ำมัน': 'D1', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด': 'A3', 'หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง': 'D2', 'กดบันทึกโดยยังไม่เลือกผล': 'Q2', 'เลือกผล + แนบไฟล์ (ถ้ามี)': 'A4', 'บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง': 'D3', 'กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน': 'D4' },
  S18: { 'ต้นทุนการบำรุงรักษา + Summary': 'D2 D3', 'ดาวน์โหลด Excel แล้ว': 'A3' },
  S19: { 'เมนู "…" → แก้ไข': 'A1', 'รายละเอียดแผน — ส่งกลับแก้ไข': 'A1', 'ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้': 'D3', 'เอาภาคหรือตัวกรองออก — ยานพาหนะที่จัดไว้แล้วยังอยู่': 'D4', '“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น': 'D5', 'ยืนยันการแก้ไขแผน': 'D6', 'บันทึกไม่สำเร็จ': 'D7', 'บันทึกสำเร็จ — รออนุมัติ': 'D8', 'แผนอนุมัติแล้ว — เมนู "…" → แก้ไข': 'A1', 'แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่': 'D3', 'แผนดำเนินการแล้ว — เมนู "…" ดูรายละเอียดอย่างเดียว': 'D2' },
  S21: { 'แท็บไตรมาส 1 — ทุกคันยังไม่กำหนด อะไหล่ในไตรมาสว่าง': 'D1', 'เมนู … → แก้ไข — หน้าจัดการอะไหล่ของยานพาหนะ (ยังไม่กำหนด)': 'A1 D2', 'เลือกยานพาหนะคันอื่น — รายการยานพาหนะในไตรมาสเปิด': 'A2', 'เลือกเปลี่ยนน้ำมัน — ระบุเบอร์น้ำมัน รหัส จำนวนลิตร': 'A6 A9', 'เลือกไส้กรองจากคลัง — เข้าอะไหล่อื่นๆ ของยานพาหนะคันนี้': 'A3', 'ระบุอะไหล่เพิ่มเติม — popup ชื่อ ยี่ห้อ รุ่น รหัส จำนวน หน่วย': 'A7 A8', 'ระบุอะไหล่เพิ่มเติมแล้ว — อยู่ในรายการ': 'A4', 'บันทึกไม่สำเร็จ': 'A5', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 ยานพาหนะ 1 คันกำหนดแล้ว อะไหล่ในไตรมาสมีของคันนี้': 'D4' },
  S20: { 'เมนู "…" → ลบ ในหน้า List': 'A1', 'ยืนยันการลบแผน ในหน้า List': 'D3', 'ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)': 'D4', 'ปุ่ม “ลบแผน” ในหน้า Detail': 'A2', 'ยืนยันการลบแผน ในหน้า Detail': 'D3', 'แผนอนุมัติแล้ว — หน้ารายละเอียดไม่มีปุ่มลบ': 'D2' },
  S2: { 'รายการแผนรออนุมัติ': 'D1', 'รายละเอียดแผน — ผลการพิจารณา ยังไม่เลือก': 'D2 A2', 'อนุมัติ — ยืนยันอนุมัติแผน': 'A5', 'อนุมัติแผนสำเร็จ': 'D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus': 'D5', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A4', 'ส่งกลับแล้ว': 'D3' },
  // S3 พักไว้ 30 ต.ค. 2569
  S7: { 'รายการแผนเดินทางรออนุมัติ': 'D1', 'รายละเอียดแผนเดินทาง — ผลการพิจารณา ยังไม่เลือก': 'D2 A2', 'อนุมัติ — ยืนยันอนุมัติแผนเดินทาง': 'A5', 'อนุมัติแผนเดินทางสำเร็จ': 'D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus': 'D5', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A4', 'ส่งกลับแล้ว': 'D3' },
  S9: { 'เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น': 'D2', 'เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด': 'A3', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้': 'D5', 'แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันทำงาน': 'A5', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'Q1', 'กรอกครบ': 'A6', 'ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)': 'D3' },
  S8: { 'กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)': 'D1', 'กรย. — เปิดแผงแจ้งเตือน': 'A1', 'กรย. — แผนเดินทาง ดูอย่างเดียว (ยานพาหนะทุกคันในใบ)': 'D2', 'หน่วยงานเจ้าของยานพาหนะ — เปิดแผงแจ้งเตือน': 'A2', 'หน่วยงานเจ้าของยานพาหนะ — แผนเดินทาง ดูอย่างเดียว (เฉพาะยานพาหนะของหน่วยงาน)': 'D3' },
  S13: { 'รายการผลการบำรุงรักษารอรับทราบ — มีแจ้งเตือนใหม่': 'D1', 'ผลการบำรุงรักษารายคัน — ปุ่มรับทราบกดได้': 'D2', 'คันที่บำรุงรักษาไม่ได้ — ฟอร์มเดียวกัน แสดงสาเหตุ รับทราบได้เลย': 'D3', 'กลับหน้ารายการ — คันที่รับทราบแล้วสถานะรับทราบแล้ว': 'D6', 'รับทราบแล้ว — ป้ายรับทราบแล้ว ปุ่มประเมินความพึงพอใจ': 'A3 D5', 'เปิดแผงแจ้งเตือน — ปิดงานแล้ว รอรับทราบ': 'A0 D0', 'บทบาทอื่นเปิดดูผล — ไม่มีปุ่มรับทราบ': 'D7' },
  S25: { 'หน้าไตรมาส 1 — ยานพาหนะที่บำรุงรักษาไม่ได้ ป้ายบำรุงรักษาไม่ได้': 'D0', 'กดปุ่ม … ของยานพาหนะ — ย้ายไปไตรมาสอื่น': 'A1', 'popup ย้ายไปไตรมาสอื่น — ยังไม่เลือกไตรมาส': 'A2 D2', 'เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้': 'A3', 'กรณีไตรมาส 3 — ไตรมาสก่อนหน้าและไตรมาสปัจจุบันเลือกไม่ได้': 'D2', 'ยืนยันการย้ายยานพาหนะ': 'D3', 'ย้ายสำเร็จ — ไตรมาส 1 ไม่มียานพาหนะคันนี้แล้ว': 'D4', 'หน้าไตรมาส 2 — ยานพาหนะที่ย้ายมา ยังไม่มีแผนเดินทาง': 'A4 D5', 'หน้าไตรมาส 2 — อะไหล่ในไตรมาสรวมอะไหล่ของยานพาหนะที่ย้ายมา': 'D6', 'ไตรมาส 4 — เมนูย้ายไปไตรมาสอื่นกดไม่ได้': 'D1' },   // 5 พ.ย. 2569 บล็อก X
};

/* ---------- กลุ่ม = scenario (แพทเทิร์นเดียวกับ Overhaul — เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก · แถว Desktop แล้ว Mobile) ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/* ตัวอักษรบล็อกผูกกับตำแหน่งใน BLOCK_OF ตายตัว (2 พ.ย. 2569) — ตัด/รวม scenario แล้วบล็อกอื่นไม่เลื่อน ชื่อเฟรมที่ export ไปแล้วยังตรง · S5 รวมเข้า S4 ⇒ D เว้นว่าง
   4 พ.ย. 2569 ตัด S11 (J) และ S23 (V) ⇒ คงช่องไว้เป็นป้ายกันที่ ('S11 ตัดออก' · 'S23 ตัดออก' ไม่ตรงกับ scenario ไหน) ถ้าเอาออกจาก array ตัวอักษร K–U และ W จะเลื่อน ชื่อเฟรม Figma ที่ export แล้วจะไม่ตรง
   10 พ.ย. 2569 เอา S23 กลับ (R87) ⇒ ช่อง V กลับเป็น 'S23' ตัวอักษรอื่นไม่เลื่อน · J ยังว่าง (S11 ยังตัด) */
const BLOCK_OF = ['S1', 'S2', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11 ตัดออก', 'S12', 'S13', 'S14 ตัดออก', 'S15 ตัดออก', 'S16 ตัดออก', 'S17 ตัดออก', 'S18', 'S19', 'S20', 'S21', 'S22 ตัดออก', 'S23', 'S24', 'S25', 'S27 ย้ายไปเรื่องแยก'];   // Y ว่าง: S27 ประเมินความพึงพอใจ (11 พ.ย. 2569) ย้ายไป satisfaction-plugin 12 พ.ย. 2569   // S24 ข้อมูลการบำรุงรักษา (4 พ.ย. 2569) = W · J ว่าง · V = S23 (เอากลับ 10 พ.ย. 2569)
/* เรื่องย่อยในบล็อก (เจ้าของงาน 12 พ.ย. 2569 "S1 อยากเรียง scenario แบบไม่มี if คือไม่เจอหน้า error เช่น ถ้าเป็นการสร้าง ก็ สร้างสำเร็จ กด a b c d
   ถ้า scen ต่อไป เป็นเรื่อง แก้ไข ก็เลือกแก้ไขแล้ว ไปเจอหน้าแก้ไข") ⇒ 1 เรื่องย่อย = 1 เส้นตรงตามลำดับการกด ไม่มีทางแยก · แถบ Sub Flow A1 A2 … ป้ายจอ A1.1 A1.2 …
   ตัวเลข = ลำดับจอในรายการ S1 ของ SCENARIOS (A.1–A.42 เดิม) · จอเดียวกันอยู่ได้หลายเรื่อง (เช่น รายการแผนเป็นจุดเริ่มหลายเรื่อง)
   หน้า error ช่องไม่ครบ ปุ่มกดไม่ได้ และรายการว่าง รวมไว้เรื่องสุดท้าย ไม่ปนกับเส้นหลัก · จอที่ไม่ได้อยู่ในเรื่องไหนจะต่อท้ายเรื่องสุดท้ายเอง (กันจอหาย) */
const SUBS_OF = { S1: S1_SUBS };   // [ชื่อเรื่องย่อย, [[ชื่อจอ, fn] …] หรือ [เลขลำดับในรายการของ scenario …]]
const GROUPS = SCENARIOS.map(([title, screens], i) => {
  const tag0 = title.split(' · ')[0], code = BLOCK_OF.indexOf(tag0) >= 0 ? LETTERS[BLOCK_OF.indexOf(tag0)] : LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  const map = FLOW_NODES[tag] || {};
  const row = ([label, fn]) => [label, fn, map[label] || ''];
  const parts = SUBS_OF[tag];
  if (!parts) return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens: screens.map(row) }] };
  const pick = (x) => Array.isArray(x) ? x : screens[x - 1];   // รายการจอ หรือเลขลำดับ
  const used = new Set(parts.flatMap(p => p[1]).filter(x => !Array.isArray(x))), left = parts.some(p => p[1].some(x => !Array.isArray(x))) ? screens.map((_, k) => k + 1).filter(k => !used.has(k)) : [];
  const subs = parts.map(([t, items], k) => ({ code: code + (k + 1), title: t, tag, screens: items.concat(k === parts.length - 1 ? left : []).map(pick).filter(Boolean).map(row) }));
  return { code, title: tag + ' ' + rest, subs };
});
/* จำนวนจอที่สร้างจริงของ scenario (เรื่องย่อยใช้จอซ้ำได้) — ใช้นับความคืบหน้าและตารางสรุป */
const SCREEN_COUNT = (title) => { const g = GROUPS.find(x => x.subs[0].tag === title.split(' · ')[0]); return g ? g.subs.reduce((a, s) => a + s.screens.length, 0) : 0; };

/* ---------- สร้าง (ปุ่มชุดเดียวกับ Overhaul 21 ต.ค. 2569: ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component) ----------
   เจ้าของงานสั่ง 22 ต.ค. 2569 "จะเอาลงในเพจ Maintainance ด้วยกันเลย" ⇒ ทุกปุ่มวางบนหน้า "Maintainance" (ไม่มีก็สร้าง) ต่อใต้ของเดิม · ใต้ของเดิมเกินขอบพื้นที่วางงานแล้ววางเหนือของเดิม (roomyPage) ไม่ลบ/ไม่ย้ายของที่มีอยู่
   แต่ละบล็อก scenario = ผัง userflow ซ้ายสุด + ป้าย Device + คอลัมน์จอ A.1 A.2 … (แถว Desktop แล้ว Mobile ตามที่เลือก) */
const PAGE_NAMES = ['Maintainance', 'Maintenance'];
const BLOCK_H = 7000;   // ความสูงที่เผื่อต่อ 1 บล็อก scenario ตอนเช็คว่าหน้าเหลือที่พอไหม
/* ย้ายบล็อกล่าสุดที่ล้นขอบ (หรือที่ค้างบนหน้า -2 จากปุ่มรุ่นก่อน) มาไว้เหนือของเดิมบนหน้า Maintainance ไม่ต้องสร้างใหม่ · ของเดิมที่เหลือไม่แตะ แค่รายงานจำนวน */
/* ลบจอของบล็อกที่ตัดออก (เจ้าของงาน 10 พ.ย. 2569 "ลบจอบล็อก M N เก่าออกให้ด้วย") — บล็อกว่างอ่านจาก BLOCK_OF ("… ตัดออก": J S11 · M S14 · N S15 · U S22)
   ทุกหน้า Maintainance / Maintenance (รวม -2 -3) · ลบเฉพาะชิ้นชั้นบนสุดที่ปลั๊กอินสร้าง: จอ "MT / M.1 · …" · ป้าย "MT · M …" "MT · M.1 …" · flowchart "MT · M flowchart S14"
   journey "MT · journey flowchart S14" · จอชุดเก่าที่ชื่อมี " · S14 — " · ชิ้นอื่นไม่แตะ · Ctrl/Cmd+Z ย้อนได้ */
const CUT_BLOCKS = () => BLOCK_OF.map((t, i) => /ตัดออก/.test(t) ? [LETTERS[i], t.split(' ')[0]] : null).filter(Boolean);
const cutHit = (n, P0) => CUT_BLOCKS().some(([L, tag]) => n.indexOf(P0 + ' / ' + L + '.') === 0 || n.indexOf(P0 + ' · ' + L + ' ') === 0 || n.indexOf(P0 + ' · ' + L + '.') === 0
  || (n.indexOf(P0 + ' / ') === 0 && n.indexOf(' · ' + tag + ' — ') > 0) || n === P0 + ' · journey flowchart ' + tag);
async function purgeCut() {
  const P0 = PLUGIN.prefix;
  await figma.loadAllPagesAsync();
  const norm = (p) => p.name.trim().toLowerCase().replace(/^[^a-z0-9ก-๙]+/, '').replace(/[^a-z0-9ก-๙]+$/, '');
  const pages = figma.root.children.filter(p => /^(maintainance|maintenance)(-\d+)?$/.test(norm(p)));
  log('ลบจอของบล็อกที่ตัดออก: ' + CUT_BLOCKS().map(([L, t]) => L + ' (' + t + ')').join(' · ') + ' · หน้า ' + (pages.map(p => p.name.trim()).join(', ') || 'ไม่พบหน้า Maintainance'));
  let total = 0;
  for (const pg of pages) {
    const dead = pg.children.filter(n => cutHit(n.name, P0));
    const by = {}; dead.forEach(n => { const k = (n.name.match(/^\S+ [\/·] ([A-Z])/) || [])[1] || (n.name.match(/ (S\d+)( —|$)/) || [])[1] || '?'; by[k] = (by[k] || 0) + 1; });
    dead.forEach(n => n.remove()); total += dead.length;
    if (dead.length) log('  · หน้า ' + pg.name.trim() + ' ลบ ' + dead.length + ' ชิ้น (' + Object.keys(by).map(k => k + ' ' + by[k]).join(' · ') + ')');
  }
  log(total ? '✓ ลบแล้ว ' + total + ' ชิ้น · ย้อนได้ด้วย Ctrl/Cmd+Z' : '✓ ไม่มีจอของบล็อกที่ตัดออกเหลืออยู่');
}
/* ย้ายจอของบล็อกที่ตัดออกไปรวมในกรอบ "ตัดออกแล้ว" (เจ้าของงาน 10 พ.ย. 2569 "ตัดออกจากตรงที่ export หรือแยกไว้อีก section ให้ด้วย ว่า scen นี้ ตัดออกแล้ว")
   ไม่ลบ · กรอบ (frame ไม่ใช่ section ตาม R19) ขวาสุดของหน้า · หัว Header Type=Header "Scenario ที่ตัดออกแล้ว" · บล็อกละแถบ Subheader State=Failed (แดง) บอก scenario วันที่ และเหตุผลจาก SCEN_CUT
   ชิ้นที่ย้ายเปลี่ยนชื่อขึ้นต้น "ตัดออก · " ⇒ ส่งภาพ/journey/ปุ่มอื่นที่หาชื่อ "MT / " ไม่หยิบไป · กดซ้ำได้ ต่อท้ายกรอบเดิม */
async function archiveCut() {
  const P0 = PLUGIN.prefix;
  await figma.loadAllPagesAsync();
  try { await resolveAll(['Header']); } catch (e) { /* ไม่มี Header ใช้แถบธรรมดา */ }
  const norm = (p) => p.name.trim().toLowerCase().replace(/^[^a-z0-9ก-๙]+/, '').replace(/[^a-z0-9ก-๙]+$/, '');
  const pages = figma.root.children.filter(p => /^(maintainance|maintenance)(-\d+)?$/.test(norm(p)));
  const why = {}; SCEN_CUT.forEach(c => { why[c[0]] = c; });
  let total = 0;
  for (const pg of pages) {
    const groups = CUT_BLOCKS().map(([L, tag]) => [L, tag, pg.children.filter(n => n.name.indexOf('ตัดออก · ') !== 0 && n.name !== 'ตัดออกแล้ว' && cutHit(n.name, P0) &&
      (n.name.indexOf(P0 + ' / ' + L + '.') === 0 || n.name.indexOf(P0 + ' · ' + L + ' ') === 0 || n.name.indexOf(P0 + ' · ' + L + '.') === 0 || n.name.indexOf(' · ' + tag + ' — ') > 0 || n.name === P0 + ' · journey flowchart ' + tag))]).filter(g => g[2].length);
    if (!groups.length) continue;
    let box = pg.children.find(n => n.type === 'FRAME' && n.name === 'ตัดออกแล้ว');
    if (!box) {
      const right = pg.children.reduce((x, n) => Math.max(x, n.x + n.width), 0), top = pg.children.reduce((y, n) => Math.min(y, n.y), 0);
      box = figma.createFrame(); box.name = 'ตัดออกแล้ว'; box.fills = []; box.clipsContent = false; pg.appendChild(box); box.x = right + 4000; box.y = top;
      CREATED = []; const hd = await blockHeader(P0, 'Page', 'Scenario ที่ตัดออกแล้ว — ไม่ใช้ export · เก็บไว้ดูประวัติ', 3000); hd.name = 'ตัดออกแล้ว · หัว'; box.appendChild(hd); hd.x = 0; hd.y = 0;
    }
    let y = box.children.reduce((m, n) => Math.max(m, n.y + n.height), 0) + 400;
    for (const [L, tag, nodes] of groups) {
      const minX = Math.min(...nodes.map(n => n.x)), minY = Math.min(...nodes.map(n => n.y)), maxX = Math.max(...nodes.map(n => n.x + n.width)), maxY = Math.max(...nodes.map(n => n.y + n.height));
      const c = why[tag] || [tag, '', 'ตัดออก'];
      CREATED = []; const bar = await flowBar(P0, 'ตัดออก ' + tag, c[1] + ' — ' + c[2], 'Failed', Math.max(1440, maxX - minX)); bar.name = 'ตัดออก · ' + tag + ' (บล็อก ' + L + ')';
      box.appendChild(bar); bar.x = 0; bar.y = y; y += bar.height + 80;
      for (const n of nodes) { const dx = n.x - minX, dy = n.y - minY; box.appendChild(n); n.x = dx; n.y = y + dy; n.name = 'ตัดออก · ' + n.name; }
      y += (maxY - minY) + 400;
      log('  · ' + tag + ' (บล็อก ' + L + ') ย้าย ' + nodes.length + ' ชิ้นเข้ากรอบ "ตัดออกแล้ว" บนหน้า ' + pg.name.trim());
      total += nodes.length;
    }
    try { const w = box.children.reduce((m, n) => Math.max(m, n.x + n.width), 0); box.resizeWithoutConstraints(Math.max(3000, w), y); } catch (e) { warn('ขนาดกรอบตัดออกแล้ว', e); }
  }
  CREATED = [];
  log(total ? '✓ ย้ายจอของ scenario ที่ตัดออกแล้ว ' + total + ' ชิ้น ไปกรอบ "ตัดออกแล้ว" ขวาสุดของหน้า · ย้อนได้ด้วย Ctrl/Cmd+Z' : '✓ ไม่มีจอของบล็อกที่ตัดออกเหลืออยู่นอกกรอบ "ตัดออกแล้ว"');
}
async function moveLatest() {
  const main = (await namedPage(PAGE_NAMES)).page, tag = PLUGIN.prefix + ' · ', scr = PLUGIN.prefix + ' / ';
  await figma.setCurrentPageAsync(main);
  const isBar = (n) => n.name.indexOf(tag) === 0 && /^[A-Z] /.test(n.name.slice(tag.length)) && n.name.indexOf(' userflow S') < 0 && n.name.indexOf(' flowchart S') < 0;
  const spare = figma.root.children.filter(p => new RegExp('^' + PAGE_NAMES[0] + '-\\d+$', 'i').test(p.name.trim()));
  let src = main, nodes = [];
  for (const p of spare) { if (p.loadAsync) await p.loadAsync(); if (p.children.some(isBar)) { src = p; nodes = p.children.slice(); break; } }
  if (!nodes.length) { const last = main.children.filter(isBar).reduce((m, n) => Math.max(m, n.y), 0); if (last > CANVAS_MAX) nodes = main.children.filter(n => n.y >= last); }
  if (!nodes.length) { log('บล็อกล่าสุดบนหน้า "' + main.name.trim() + '" อยู่ในขอบพื้นที่วางงานอยู่แล้ว ไม่ต้องย้าย'); return; }
  const spot = fitOn(main, nodes);   // แบบเดียวกับตอนสร้าง: ใต้ของเดิม → ช่องว่างจากขอบบน → คอลัมน์ใหม่ทางขวา (4 พ.ย. 2569)
  if (!spot) { log('⚠ หน้านี้ไม่มีที่ว่างในขอบพื้นที่วางงานแล้ว — ย้ายไม่สำเร็จ ไม่มีอะไรเปลี่ยน'); return; }
  if (src !== main) for (const n of nodes.slice().reverse()) main.insertChild(0, n);   // ลำดับต้นของหน้าแบบตอนสร้าง (buildGrid insertChild 0) ⇒ exportShots นับเป็นชุดล่าสุด · เดิม appendChild ไปอยู่ลำดับท้าย (9 พ.ย. 2569)
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
  if (ACTIVITY) log('ผังข้างจอ: flowchart กิจกรรม จาก ' + ACTIVITY.src + ' (แทนผัง userflow ตามที่เจ้าของงานสั่ง 6 พ.ย. 2569)');
  else log(USERFLOW ? 'ผัง userflow: ' + USERFLOW.src + ' (' + Object.keys(USERFLOW.scenarios).length + ' scenario ในไฟล์ · วางข้างจอเฉพาะ scenario ที่มีจอ)' : '⚠ ไม่มีผัง userflow ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่');
  log('นำเข้าเสร็จใน ' + Math.round((Date.now() - t0) / 1000) + ' วินาที · เริ่มสร้าง');
  /* 4 พ.ย. 2569 เจ้าของงาน "อยากให้ export ไปที่ Maintainance แทน" ⇒ สร้างบนหน้า Maintainance เสมอ (ใต้ของทั้งหมดก่อน) แล้ววัดขนาดจริงค่อยย้ายลงช่อง (fitOn)
     ไม่ใช้ roomyPage(BLOCK_H × จำนวนบล็อก) แบบเดิม เพราะทั้งชุดประเมินได้ 140,000 เกินขอบเสมอจึงไปหน้า -2 ทุกครั้ง · หน้า -2 เหลือไว้เฉพาะตอนหน้าเดิมไม่มีที่จริงๆ */
  const tp = await namedPage(PAGE_NAMES);
  let page = tp.page;
  if (page.loadAsync) await page.loadAsync();
  await figma.setCurrentPageAsync(page);
  const before = new Set(page.children);
  const TOTAL = SCEN.reduce((a, x) => a + SCREEN_COUNT(x[0]), 0);
  log(INDEX.has('Header') ? 'แถบหัวบล็อก/ป้าย state: component Header ของ Design Annotations (' + ROUTE.Header + ')' : 'แถบหัวบล็อก/ป้าย state: ไม่พบ component Header — วาดแถบธรรมดาสีเดียวกันแทน · เปิดไฟล์ (UI) VMS Plus – Release#2 เป็นไลบรารี หรือวาง Header จากหน้า Design Annotations ไว้ในไฟล์ 1 ชิ้น');
  /* ไม่มีหัวหน้า Type=Header บนสุด — เจ้าของงาน 10 พ.ย. 2569 "ป้ายบนสุดไม่ต้องมี ที่เป็นป้าย บำรุงรักษา ที่ status inprogress เอาออก" (buildGrid ยังรับ opts.page ไว้) */
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
  let instances = 0, loose = 0, drawn = 0;
  /* R106 (12 พ.ย. 2569): ชิ้นวาดเองยอมเฉพาะในกรอบ VMS+ … ของแดชบอร์ด S4 (C) S24 (W) — ที่อื่นยังต้องเป็น 0 และนับเป็นคำเตือน */
  const inDash = (n, s) => { if (!DASH_SCR.test(s.name)) return false; for (let p = n.parent; p && p !== s; p = p.parent) if (p.type === 'FRAME' && DASH_IN.test(p.name)) return true; return false; };
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') { if (inDash(n, s)) drawn++; else { loose++; if (loose <= 5) warn('R106 ' + s.name, 'ชิ้นวาดเอง ' + n.type + ' "' + n.name + '" นอกกรอบแดชบอร์ด VMS+ — จอนี้ต้องเป็น instance ของไลบรารีเท่านั้น'); } }
  }
  figma.currentPage.selection = made.slice(0, 1);   // ของใหม่อยู่ล่างสุดของ Layers ⇒ เลือกจอแรกให้ Layers เลื่อนไปหา
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 6));
  log('');
  if (pageBottom(page) > CANVAS_MAX) log('หมายเหตุ: ชุดนี้ยาวเกินขอบพื้นที่วางงานของ Figma จอท้ายๆ อาจเลื่อนไปไม่ถึง — ใช้สร้างทีละ scenario แทน');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ผัง userflow ' + flows + ' ผัง · ' + GRP.length + ' บล็อก ' + what + ' (' + GRP.map(g => g.code).join(' ') + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓') + ' (ผัง userflow เป็นของวาดประกอบนอกจอ ไม่นับ · ชิ้นวาดในกรอบ VMS+ ของแดชบอร์ด S4 S24 ตามข้อยกเว้น R106 ' + drawn + ' ชิ้น)');
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
  const codes = {}, loose = [];
  for (const sub of g.subs) sub.screens.forEach(([label, , ids], i) => { const c = sub.code + '.' + (i + 1); const list = String(ids || '').split(/\s+/).filter(Boolean); if (!list.length) loose.push(c + ' ' + label); list.forEach(id => { (codes[id] = codes[id] || []).push(c); }); });
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
  const frameFor = (code) => screens.find(f => f.name.indexOf(PLUGIN.prefix + ' / ' + code + ' · ') === 0) || null;   // ชุดล่าสุด = ลำดับต้นของหน้า (buildGrid วางด้วย insertChild 0 · ล่างสุดของแผง Layers)
  const r = await buildJourney(page, PLUGIN.prefix, y, { codes: journeyCodes, frameFor });
  if (tp.limit != null) liftAbove(page, before, tp.limit);
  log('');
  log((USERFLOW.journey.kind === 'activity' ? 'flowchart ทั้งเส้น: ผัง ' + r.made + ' scenario · ลูกศรเชื่อม ' + r.links + ' เส้น' : 'journey: ผัง ' + r.made + ' scenario · ลูกศรเชื่อม ' + r.links + ' เส้น · ภาพย่อจอ ' + r.thumbs + '/' + r.slots + ' กล่อง' + (r.thumbs < r.slots ? ' (กล่องที่ไม่มีภาพ = ยังไม่มีจอนั้นบนหน้า — กดสร้าง Desktop ก่อนแล้วกดปุ่มนี้ใหม่)' : '')) + ' · กว้าง ' + Math.round(r.w) + ' px');   // 6 พ.ย. 2569 ต่อผัง flowchart กิจกรรม ไม่มีภาพย่อจอ
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
const SCEN_SEQ = ['S1', 'S2', 'S19', 'S20', 'S21', 'S4', 'S6', 'S9', 'S7', 'S8', 'S10', 'S23', 'S25', 'S12', 'S13', 'S18', 'S24'];   // S27 (ต่อจาก S13 · 11 พ.ย. 2569) ย้ายไปเรื่องแยก 12 พ.ย. 2569 ⇒ อยู่กลุ่มตัดออกท้ายตาราง
const SCEN_REVIEW = { S1: 'ปรับตามรีวิว 5 พ.ย. · เลือกยานพาหนะแบบ A · เพิ่มยานพาหนะจากแท็บไตรมาสว่าง (เจ้าของงาน 5 พ.ย.)', S2: 'ปรับตามรีวิว 5 พ.ย.', S4: 'เปลี่ยนเป็นแดชบอร์ด 6 พ.ย. (รีวิว บล็อก C)', S21: 'ปรับตามเจ้าของงาน 5 พ.ย. · จัดการอะไหล่ทีละคัน', S19: 'ปรับตาม S1 2 พ.ย.',
  S6: 'ปรับตามรีวิว 5 พ.ย.', S7: 'ทำตาม S2 5 พ.ย. · รอรีวิวจอ', S8: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S9: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S10: 'ปรับตามรีวิว 5 พ.ย. · แผนจ้าง Step 2 ไม่มีค่าใช้จ่ายและราคา 10 พ.ย.', S23: 'เอากลับ 10 พ.ย. · UI แบบ S10 การมองเห็นแบบเดิม · รอรีวิวจอ', S12: 'ปรับตามรีวิว 4 พ.ย.', S18: 'ยังไม่ออกแบบ (เจ้าของงาน 4 พ.ย.)', S24: 'ใหม่ 4 พ.ย. · รอรีวิวจอ', S25: 'ใหม่ 5 พ.ย. · รอรีวิวจอ', S13: 'ปรับ 10 พ.ย. ผู้ดูแลยานพาหนะรับทราบรายคัน (Q19 Q23 Q28) · 11 พ.ย. ประเมินย้ายไป S27 รับทราบอย่างเดียว · 12 พ.ย. รับทราบแล้วมีปุ่มประเมินความพึงพอใจ (ตามเว็บ) · รอรีวิว', S27: 'ใหม่ 11 พ.ย. · แบบประเมินความพึงพอใจของ กบค. (XCHO) หน้าแยกแบบประเมินผู้รับจ้าง (R94) · รอรีวิวจอ'
};   // 4 พ.ย. 2569: ทำตามที่เจ้าของงานสั่งแล้ว แต่ยังไม่ได้ไล่จอด้วยกัน
const SCEN_UPDATED = '12 พ.ย. 2569';   // วันที่ข้อมูลในตาราง scenario ล่าสุด — แก้ SCEN_REVIEW แล้วเปลี่ยนวันนี้ด้วย (ขึ้นที่หัวตาราง)
const SCEN_CUT = [['S3', 'ผพจ. ออกเลขงานและจัดซื้ออะไหล่', 'ตัดออก 2 พ.ย.'], ['S5', 'หน่วยงาน เบิกอะไหล่ผ่านระบบจองอะไหล่', 'รวมเข้า S4 2 พ.ย.'],
  ['S11', 'หน่วยงาน ตรวจรับงานรายคันของผู้รับจ้างและรับคืนอะไหล่', 'ตัดออก 4 พ.ย. · หน่วยงานปิดงานแผนจ้างเองที่ S10 · S23 ส่งตรวจงานแล้ว ผู้ตรวจรับยังไม่เคาะ'],
  ['S22', 'คลัง รับทราบรายการอะไหล่รายไตรมาส', 'ตัดออก 6 พ.ย. · ระบบแจ้ง Smart Inventory ตอนอนุมัติแผน (S2)'],
  ['S14', 'หน่วยงาน/เจ้าของยานพาหนะ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)', 'ตัดออก 10 พ.ย. · รับทราบรอบเดียวรายคัน ประเมินย้ายไป S13 (Q28)'],
  ['S15', 'หน่วยงาน บันทึกและส่งประวัติงานบำรุงรักษา', 'ตัดออก 10 พ.ย. · รับทราบรอบเดียวรายคันที่ S13'],
  ['S16', 'หัวหน้าหน่วยงาน ตรวจสอบประวัติงานบำรุงรักษา', 'ตัดออก 10 พ.ย. · ไม่ต้องรับทราบทั้งแผน รับทราบรายคันที่ S13 ก็พอ'],
  ['S17', 'ผู้ดำเนินการ ออกรายงานผลและปิดงาน', 'ตัดออก 10 พ.ย. · รับทราบครบทุกคันแล้วแผนปิดงานเอง (เสนอ) · ดูผลที่แดชบอร์ด'],
  ['S27', 'ผู้ดูแลยานพาหนะ ประเมินความพึงพอใจการให้บริการของ กบค. รายคัน', 'ย้ายไปเรื่องแยก 12 พ.ย. · แบบประเมินความพึงพอใจ (XCHO) ปลั๊กอิน satisfaction-plugin']];
const SCEN_COLS = [['scenario', 110], ['บล็อก', 90], ['ชื่อ', 600], ['ผู้ทำ', 300], ['จอ', 90], ['สถานะรีวิว', 260]];
function scenData() {
  const sec = DOCS.scenarios.sections.find(s => /^0\./.test(s.h)) || { rows: [] };
  const info = {}; sec.rows.forEach(r => { info[r[0]] = r; });   // # · scenario · ช่วงงาน · บทบาท · กล่องบนบอร์ด
  const rows = SCEN_SEQ.map(tag => { const g = GROUPS.find(x => x.subs[0].tag === tag), r = info[tag] || []; return [r[2] || '-', tag, g ? g.code : '-', r[1] || (g ? g.subs[0].title : ''), r[3] || '-', g ? String(g.subs.reduce((a, x) => a + x.screens.length, 0)) : '0', SCEN_REVIEW[tag] || 'ยังไม่ได้รีวิวรอบนี้']; });
  return { head: ['ช่วงงาน', 'scenario', 'บล็อก', 'ชื่อ', 'ผู้ทำ', 'จอ', 'สถานะรีวิว'], rows: rows.concat(SCEN_CUT.map(([tag, t, st]) => ['ตัดออกแล้ว', tag, '-', t, '-', '0', st])) };
}
/* use case ตาราง เดียว (4 พ.ย. 2569 เจ้าของงาน "ปรับแก้ให้เหลืออันเดียวได้มั้ย") — กลุ่มตามช่วงงานของ JO 7.3 มีคอลัมน์ scenario + ข้อ JO ⇒ ตามได้ทั้งสองทาง · เลิกตาราง "use case ตาม scenario" */
const UC_COLS = [['รหัส', 130], ['scenario', 100], ['บทบาท', 200], ['use case', 460], ['ผ่านเมื่อ', 420], ['JO', 90], ['สถานะใน flow', 160], ['หมายเหตุ', 320]];
/* user journey swimlane (เจ้าของงานสั่ง 4 พ.ย. 2569 "อยากให้ทำ user journey ยาวๆ เป็น swimlane ที่มี stakeholder ด้วย")
   เลือกวางบนหน้า Maintainance · ระดับขั้นงาน · สี่เหลี่ยม + ข้าวหลามตัด · ต้นทาง Diagram/01-บำรุงรักษาตามวาระ/26-บำรุงรักษา-swimlane.md (ฝังตอน build)
   กดซ้ำ = แทนกรอบของรอบก่อน (putBelow) ไม่ซ้อน */
async function buildSwimlane() {
  if (!SWIMLANE) { log('✗ ไม่มีข้อมูล swimlane ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H); const page = tp.page;
  await figma.setCurrentPageAsync(page);
  try {
    const r = await swimlaneBoard(PLUGIN.prefix, SWIMLANE);
    putBelow(page, r.frame);
    // ภาพย่อจากจอ desktop บนหน้านี้ (ชุดล่าสุด = ลำดับต้นของหน้า แบบ journey) · ไม่มีจอ = ช่องว่าง ⇒ กดสร้าง Desktop ก่อนแล้วกดใหม่
    const screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0 && !/ · mobile$/.test(n.name));
    const frameFor = (code) => screens.find(f => f.name.indexOf(PLUGIN.prefix + ' / ' + code + ' · ') === 0) || null;
    let shots = 0;
    for (const sl of r.slots) { const scr = frameFor(sl.codes[0]); if (scr && await fillThumb(sl.rect, scr)) shots++; }
    log('✓ user journey swimlane ' + SWIMLANE.lanes.length + ' ผู้เกี่ยวข้อง · ขั้นงาน ' + r.steps + ' · ทางแยก ' + r.forks + ' · เส้น ' + r.links + (r.slots.length ? ' · ภาพย่อจอ ' + shots + '/' + r.slots.length + (shots < r.slots.length ? ' (กล่องที่ไม่มีภาพ = ยังไม่มีจอนั้นบนหน้า — กดสร้าง Desktop ก่อนแล้วกดใหม่)' : '') : '') + ' (จาก ' + SWIMLANE.src + ') · หน้า "' + page.name.trim() + '" y=' + Math.round(r.frame.y));
    figma.viewport.scrollAndZoomIntoView([r.frame]);
  } catch (e) { warn('swimlane', e); dropCreated(page); }
}
/* flowchart กิจกรรมราย scenario (เจ้าของงาน 6 พ.ย. 2569 "สร้าง แต่ละ scen ออกมา … ทำ script ให้ export ใน figma" + "อยากได้ flowchart" · "แค่กิจกรรม … ไม่ต้องเอาหน้าจอไปรวม")
   วางบนหน้า Maintainance ต่อใต้ของเดิม · ต้นทาง Diagram/01-บำรุงรักษาตามวาระ/27-บำรุงรักษา-flowchart-กิจกรรม.md (ฝังตอน build)
   "อยากให้แยก scen เลยนะ" ⇒ 1 scenario = 1 กรอบบนหน้า ("MT · flowchart กิจกรรม · S1 · …") + กรอบคำอธิบาย · กดซ้ำ = ลบกรอบชุดเดิมก่อนแล้ววางใหม่ ไม่ซ้อน */
async function buildActivity() {
  if (!ACTIVITY) { log('✗ ไม่มีข้อมูล flowchart กิจกรรม ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H); const page = tp.page;
  await figma.setCurrentPageAsync(page);
  try {
    const tag = PLUGIN.prefix + ' · flowchart กิจกรรม';
    const old = page.children.filter(n => n.name === tag || n.name.indexOf(tag + ' · ') === 0);
    if (old.length) { log('↻ แทนที่ flowchart กิจกรรมของรอบก่อน ' + old.length + ' กรอบ'); old.forEach(n => n.remove()); }
    const r = await activityBoard(PLUGIN.prefix, ACTIVITY);
    putBelow(page, r.frame);   // หาที่ว่างด้วยขนาดรวม แล้วค่อยแยกเป็นกรอบละ scenario
    const y = Math.round(r.frame.y), made = splitBoard(page, r.frame);
    log('✓ flowchart กิจกรรม ' + r.scenarios + ' scenario แยกกรอบละ scenario · กิจกรรม ' + r.steps + ' · ทางเลือก ' + r.forks + ' · เส้น ' + r.links + ' (จาก ' + ACTIVITY.src + ') · หน้า "' + page.name.trim() + '" y=' + y + ' · ค้นใน Layers ด้วยคำว่า "flowchart กิจกรรม · S"');
    page.selection = made;
    figma.viewport.scrollAndZoomIntoView(made);
  } catch (e) { warn('flowchart กิจกรรม', e); dropCreated(page); }
}
async function buildDocs(o) {
  const parts = (o.parts && o.parts.length) ? o.parts : ['storymap', 'usecase'];
  /* R19 (เจ้าของงาน 20 ต.ค. 2569 แยกแถว Desktop / Mobile ทุกครั้ง) + 6 พ.ย. 2569 เจ้าของงาน "เมื่อวานเซฟว่า ต้องมี flowchart และมี mobile แต่วันนี้มี flowchart แล้ว แต่ว่ายังไม่มี mobile"
     ⇒ ติ๊กจอส่วนไหนก็สร้าง flowchart + Desktop + Mobile ครบทุกครั้ง (เดิมติ๊ก Desktop อย่างเดียวได้แถว Desktop อย่างเดียว) */
  const devs = ['screens', 'desktop', 'mobile'].some(k => parts.indexOf(k) >= 0) ? [false, true] : [];
  log('สร้าง ' + parts.length + ' ส่วน: ' + parts.join(' · '));
  if (devs.length) await buildSet(SCENARIOS, GROUPS, 'scenario', devs);
  if (parts.indexOf('journey') >= 0) await buildJourneyAll();
  if (parts.indexOf('swimlane') >= 0) await buildSwimlane();   // 4 พ.ย. 2569 user journey swimlane ตามผู้เกี่ยวข้อง
  if (parts.indexOf('activity') >= 0) await buildActivity();   // 6 พ.ย. 2569 flowchart กิจกรรมราย scenario (ไม่มีหน้าจอ)
  const docParts = parts.filter(p => p === 'storymap' || p === 'usecase' || p === 'scenarios');
  if (!docParts.length) return;
  if (!DOCS) { log('✗ ไม่มีข้อมูล story map / use case ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H); const page = tp.page;
  await figma.setCurrentPageAsync(page);
  const made = [];
  for (const k of docParts) {
    try {
      const f = k === 'storymap' ? await storyMapBoard(PLUGIN.prefix, DOCS.storymap)
        : k === 'scenarios' ? await tableBoard(PLUGIN.prefix, 'scenario', 'Scenario บำรุงรักษาตามวาระ · ' + SCEN_SEQ.length + ' scenario · อัปเดต ' + SCEN_UPDATED, DOCS.scenarios.src, scenData(), 'ช่วงงาน', SCEN_COLS)
        : await tableBoard(PLUGIN.prefix, 'use case', 'Use case บำรุงรักษาตามวาระ', DOCS.usecase.src, DOCS.usecase, 'ช่วงงาน', UC_COLS);
      putBelow(page, f); made.push(f);
      log('✓ ' + (k === 'storymap' ? 'user story mapping ' + DOCS.storymap.sections.length + ' ช่วงงาน' : k === 'scenarios' ? 'ตาราง scenario ' + scenData().rows.length + ' แถว' : 'use case ' + DOCS.usecase.rows.length + ' ข้อ') + ' (จาก ' + DOCS[k].src + ')');
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
    if (msg.type === 'build-activity') await buildActivity();
    if (msg.type === 'export-shots') await exportShots('flow-maintainance', msg.scen);   // msg.scen = scenario ที่ติ๊ก (9 พ.ย. 2569 แยก export FigJam ราย S)
    if (msg.type === 'move-latest') await moveLatest();
    if (msg.type === 'purge-cut') await purgeCut();
    if (msg.type === 'archive-cut') await archiveCut();   // 10 พ.ย. 2569 ย้ายไปกรอบ ตัดออกแล้ว แทนการลบ   // 10 พ.ย. 2569 ลบจอบล็อก M N (S14 S15) และบล็อกว่างอื่น
    if (msg.type === 'clear-proto') { const tp = await namedPage(PAGE_NAMES); await figma.setCurrentPageAsync(tp.page); await clearPrototype(tp.page); }
    if (msg.type === 'build-docs') await buildDocs({ parts: msg.parts });   // 30 ต.ค. 2569 ติ๊กเลือกส่วน / สร้างทั้งหมด   // 30 ต.ค. 2569 ส่งภาพจอบนหน้านี้ไป FigJam
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]), codes: GROUPS.map(g => g.code) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก"
