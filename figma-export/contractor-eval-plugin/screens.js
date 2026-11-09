/* ============================================================================
   Maintain-D — ประเมินผู้รับจ้าง (อู่/ศูนย์บริการ) ต่อ 1 ใบสั่งจ้าง · จอจาก component จริง
   ----------------------------------------------------------------------------
   เจ้าของงานสั่ง 22 ต.ค. 2569: "ลองออกแบบ จอ figma" — เนื้อหาจากแบบประเมินผู้รับจ้าง (Excel SharePoint isan · 6 หมวด 20 ข้อ เต็ม 100)
   หน้าตาอิงเมนู "ประเมินพนักงานขับรถ" ของ VMS+ เดิม (2 แท็บ · ดาว 1–5 · Modal ยืนยัน · toast พร้อมเลขอ้างอิง)
   เคาะ 22 ต.ค. 2569: ช่องคะแนน = component `Rating` ของไลบรารี (ดาว · ไม่ใช่ Radio text card แบบ RepairFeedback ของงานซ่อม) ·
   ปลั๊กอินแยก วางบนหน้า "ประเมินผู้รับจ้าง" ต่อใต้ของเดิม (ไม่มีก็สร้าง)
   สเปก: Diagram/07-ประเมินผู้รับจ้าง/01-ออกแบบ-…-VMS+เดิม.md · ข้อประเมิน: 02-ข้อประเมินผู้รับจ้าง-6หมวด-20ข้อ.csv · ต้นแบบ HTML: design-mock/contractor-eval.html
   กติกา: plan.md หัวข้อ 🎯 + component-rules.md (R1–R26) · ตารางทุกตัว = component Table (R25) · 1 scenario = 1 บล็อก (R19)
   ตีความเอง (รอเคาะ Q1–Q7 ของสเปก): ผู้ตรวจประเมิน = กบค. · ดาวเริ่มว่าง ปุ่มบันทึกกดได้เมื่อครบ 20 ข้อ · บันทึกแล้วแก้ไม่ได้
   ข้อความคำถามใช้ `Input label` (ป้ายของช่องกรอก) · หน้าดูผลใช้ Table ต่อหมวด (ข้อ · รายการ · คะแนน)
   22 ต.ค. 2569 — เจ้าของงานสั่ง "กับส่วนที่ต้องอัพโหลด อนุมัติ ไม่มี" ⇒ ไม่มีส่วนแนบแบบประเมินที่ลงนามแล้ว (S3 เหลือจอผลประเมินจอเดียว) · ตอบ Q4 ของสเปก
   22 ต.ค. 2569 — เจ้าของงานสั่ง "แค่มี หมายเหตุ แค่ล่างสุดอย่างเดียว แต่ละข้อไม่ต้องให้เพิ่มหมายเหตุได้" ⇒ ไม่มีปุ่ม "เพิ่มหมายเหตุ"/ช่องหมายเหตุรายข้อ · ตารางหน้าดูผลไม่มีคอลัมน์หมายเหตุ · หมายเหตุมีช่องเดียวท้ายฟอร์ม
   22 ต.ค. 2569 ดึก — style ตามหน้าจริง https://vmsplus-dev.pea.co.th/driver-evaluation (เจ้าของงานล็อกอินให้อ่าน · "เอาแค่ style มาเฉยๆ เนื้อหายังใช้ตามเอกสาร"):
     รายการไม่มีช่องค้นหา (แท็บ + ตาราง) · คอลัมน์แรก # · ท้ายแถวยังไม่ได้ประเมิน = ไอคอนดาว (หน้าจริงเป็นปุ่ม "★ ประเมิน" — Table cell ของไลบรารีไม่มีช่องปุ่ม ใช้ Action icons ดาวแทน · รอเคาะ)
     ฟอร์ม: หัวหมวด = Featured icon สีหลัก + ชื่อหมวด (หน้าจริงมีไอคอนต่อข้อ) · ข้อ = ข้อความตัวหนา แล้วดาว 5 ดวงใต้ข้อความ
     เจ้าของงานเลือก: ฟอร์มยังเป็นหน้าเต็ม (ไม่ใช่ modal 500 แบบหน้าจริง) · ดาวเริ่มว่าง ต้องกดครบ 20 ข้อ (หน้าจริงเริ่ม 5 ดวง)
   5 พ.ย. 2569 (R76) — เจ้าของงานสั่งแยก display ตามประเภทงาน + "สร้าง script การสร้างออกจากกัน":
     กล่อง "ข้อมูลผู้รับจ้าง" = `displayFor(type)` ช่องตามข้อมูลจริงของแต่ละงาน (ที่มารายช่อง ไฟล์นอกรีโป db-schema/map-09-ประเมินผู้รับจ้าง-ข้อมูลผู้รับจ้างตามประเภทงาน.md (มีชื่อตาราง DB จริง ไม่เก็บในรีโป public))
     S2 ฟอร์มประเมิน · S3 ดูผล แยกบล็อกย่อยตามประเภทงาน B1/C1 งานซ่อม · B2/C2 งานบำรุงรักษา · B3/C3 งาน Overhaul · ปุ่มสร้างแยกประเภท (build-repair · build-pm · build-oh)
     ข้อประเมิน 20 ข้อ · ดาว · หมายเหตุ · สรุปคะแนน · Modal · toast ใช้ร่วมกันทุกประเภท
   ============================================================================ */

const PLUGIN = { prefix: 'CE', page: 'ประเมินผู้รับจ้าง', menu: 'ประเมินผู้รับจ้าง', searchHint: 'ค้นหาเลขใบสั่งจ้าง, ชื่อผู้รับจ้าง' };

/* ---------- component ที่ใช้ — ขาดตัวไหนหยุด (ไลบรารี) · NESTED = ชิ้นซ้อนใน component อื่น · LOCAL_OPTIONAL = ป้ายของทีมออกแบบ ไม่มีก็วาดแถบธรรมดา ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Featured icon',
  'Table pagination', 'Text input', 'Text area', 'Input label', 'Alert', 'Tabs', 'Rating',
  'Primary button', 'Secondary button', 'Background overlay', 'Modal', 'Notification', 'Empty state/Data empty',
  'add-24-300-round', 'filter_list-24-400-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round', 'quick_reference_all-24-300-round', 'schedule-24-300-round',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header'];
const NESTED = ['Nav button', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Tertiary button',
  '_Content item base', 'Badge outline', 'Pill outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Tab item', '_Rating star base',
  'garage_home-24-300-round', 'car_repair-24-300-round', 'groups-24-300-round', 'call-24-300-round', 'search_check-24-300-round', 'star-24-300-round'];   // ไอคอนหมวด/ปุ่มดาว — นำเข้าไม่ได้ = Featured icon ใช้ไอคอนตั้งต้น (ไม่หยุด ไม่เตือน)
const LOCAL_OPTIONAL = ['Device Type', 'Component 1', 'Header'];   // ป้าย Device/Desktop/Mobile + แถบรหัส flow ชุดเดียวกับ Overhaul/บำรุงรักษา
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี (ดัมป์ 19 ต.ค. 2569) — รูปแบบบรรทัดต้องเหมือน KEYS ใน core ("ชื่อ": ["key", set]) เพราะ test harness อ่านด้วย regex */
Object.assign(KEYS, {
  "Rating": ["1d3c2e045977bc6b2b407cdd2c82eb43dc00325a", true],
  "_Rating star base": ["51d4e5f5f09b643b0816d27100d99a9bf08432f5", true],
  "schedule-24-300-round": ["a2a51c1f870eac9f78166d8ff258c826d8b5ecf1", false],
  "garage_home-24-300-round": ["d7a761b13980dd20ac94a5cc377d5e1d30677bc0", false],
  "car_repair-24-300-round": ["1e59e85c3ba457b3fbc4ea88a7eacba331ca23c7", false],
  "groups-24-300-round": ["16f9e5ce96b0b738a6cc2e87a7500a6898ac28ae", false],
  "call-24-300-round": ["117dd21b39fd7f89391fa783e220ad32b61746e2", false],
  "search_check-24-300-round": ["230bb3b003a72d41a3649ee10760711ec3846d87", false],
  "star-24-300-round": ["ecf8821fb00ba65575f6814101291f6166e00aa6", false]
});
/* ไอคอนหมวด (หน้าจริงมีไอคอนสีหลักต่อข้อ · เรามี 20 ข้อ จึงใส่ต่อหมวด) */
const GROUP_ICON = ['garage_home-24-300-round', 'car_repair-24-300-round', 'groups-24-300-round', 'call-24-300-round', 'search_check-24-300-round', 'schedule-24-300-round'];   // 22 ต.ค. ดึก: เลือกจากไอคอนที่มี instance ในไฟล์ Maintain-D จริง (apartment/build นำเข้าไม่ได้ในไฟล์จริง ขึ้นเป็น info)

/* ---------- ข้อประเมิน (ลอกจาก Excel — ตรงกับ Diagram/07-ประเมินผู้รับจ้าง/02-…csv) ---------- */
const GROUPS_Q = [
  ['สถานประกอบการ', [
    'ได้รับการรับรองระบบคุณภาพมาตรฐาน (ISO หรือ Authorized Service หรือ มาตรฐานฝีมือแรงงานแห่งชาติ โดยกรมพัฒนาฝีมือแรงงาน)',
    'มีขนาดพื้นที่ปฏิบัติงานเพียงพอรองรับงานซ่อม เป็นระเบียบ สะอาด',
    'พื้นที่ปฏิบัติงานมีความปลอดภัยในการจัดเก็บทรัพย์สินระหว่างซ่อม']],
  ['เครื่องมืออุปกรณ์', [
    'ความพร้อมของเครื่องมืออุปกรณ์',
    'เครื่องมืออุปกรณ์มีการบำรุงรักษา/การสอบเทียบ',
    'มีอุปกรณ์ความปลอดภัยครบถ้วนเหมาะสมกับลักษณะงาน ขณะให้บริการ']],
  ['ผู้ปฏิบัติงาน', [
    'ผู้ปฏิบัติงานปฏิบัติถูกต้องตามข้อกำหนด/ระเบียบของ กฟภ.',
    'ผู้ปฏิบัติงานปฏิบัติตามมาตรฐาน ข้อกำหนด คู่มือ กฎหมาย พรบ. และประกาศของทางราชการ',
    'พนักงานได้รับการฝึกอบรมทักษะการปฏิบัติงานมีความเข้าใจและรอบรู้ในงาน',
    'มีมนุษย์สัมพันธ์ดี แต่งกายสุภาพ สะอาด']],
  ['การให้บริการ', [
    'ความสะดวกรวดเร็วในการติดต่อ สามารถอธิบาย ให้คำแนะนำการให้บริการ',
    'สามารถแก้ไขปัญหาเกี่ยวกับการให้บริการได้ทันที',
    'มีความพร้อมกรณีมีความต้องการใช้บริการเร่งด่วน',
    'มีบริการหลังการส่งมอบงาน']],
  ['คุณภาพของผลงาน', [
    'อะไหล่อุปกรณ์ที่ใช้มีคุณภาพตรงตามข้อกำหนดการจ้าง มีเอกสารให้ตรวจสอบ',
    'คุณภาพงานตรงตามรายละเอียดที่กำหนดโดยไม่ต้องแก้ไข',
    'เอกสาร/รายงาน/ข้อเสนอแนะประกอบผลงาน ถูกต้องครบถ้วน',
    'มีการรับประกันผลงาน']],
  ['การส่งมอบงาน', [
    'ส่งมอบงาน ตรงตามกำหนดเวลา',
    'ความถูกต้องของเอกสารประกอบในการส่งมอบ']]];
const LEVEL = ['', 'ต้องปรับปรุงมาก', 'ต้องปรับปรุง', 'พอใช้', 'ดี', 'ดีมาก'];   // ชื่อระดับ — รอเคาะ Q6 (แบบกระดาษเขียนแค่ "1 - 5")
const QN = GROUPS_Q.reduce((n, g) => n + g[1].length, 0);   // 20

/* ---------- ข้อมูลตัวอย่าง (ค่าสมมติทั้งหมด) ----------
   22 ต.ค. 2569 ดึก เจ้าของงาน: "คอลัมน์ตารางพวกคนขับรถ ให้เอาบริบทของงานบำรุงรักษา งานซ่อมมาทำ — ตัวอย่างที่ให้ไปดูเป็นการจองรถ บริบทจะไม่เหมือนกัน"
   ⇒ ผู้รับจ้างถูกประเมินต่อ 1 งานจ้าง ได้ทั้ง งานซ่อม (ส่งอู่ · อ้างใบแจ้งซ่อม) · บำรุงรักษาตามวาระ (แผนเดินทางจ้างดำเนินการ S9 · อ้างเลขที่ MR) · Overhaul (PO · อ้างแผน)
   5 พ.ย. 2569 เจ้าของงาน: "ส่วนที่เป็น display เป็นส่วนที่มีความแตกต่างกันของงาน … ต้องแยกการแสดงที่แตกต่างกัน อยากให้ไปอ่าน code ของการเก็บข้อมูล repo be fe … แล้ว สร้าง script การสร้างออกจากกัน"
   ⇒ กล่อง "ข้อมูลผู้รับจ้าง" แยกตามประเภทงาน (`DISPLAY` · `displayFor()` · R76) · ค่าตัวอย่างตรงกับปลั๊กอิน Overhaul / บำรุงรักษา และงานซ่อมของ Maintain-D
   ที่มารายช่อง (ตาราง/คอลัมน์ใน code-maintainD หรือแบบของเรา): ไฟล์นอกรีโป db-schema/map-09-ประเมินผู้รับจ้าง-ข้อมูลผู้รับจ้างตามประเภทงาน.md (มีชื่อตาราง DB จริง ไม่เก็บในรีโป public) */
const EVALUATOR = 'นางสาวกนกวรรณ ใจมั่น (กบค.)';
const TODAY = '24/11/2569';   // วันที่ประเมินในตัวอย่าง — หลังวันส่งมอบงานของทั้ง 3 ประเภท (แผนเดินทางจ้างบำรุงรักษา 17–21/11/2569 ตามปลั๊กอินบำรุงรักษา TRIP_V)
const JOB = { repair: ['งานซ่อม', 'Info'], pm: ['บำรุงรักษา', 'Success'], oh: ['Overhaul', 'Brand'] };
const TYPES = ['repair', 'pm', 'oh'];   // ลำดับคงที่ — รหัสบล็อกย่อย B1 B2 B3 / C1 C2 C3 ตามลำดับนี้ (สร้างแยกประเภทแล้วรหัสไม่เลื่อน)
const TYPE_TITLE = { repair: 'งานซ่อม', pm: 'งานบำรุงรักษา', oh: 'งาน Overhaul' };
/* หัวหน้าดูผล ต้องขึ้นต้น "หมายเลข" (R11 หน้า Detail) — เลขหลักของงานจ้างแต่ละประเภท */
const KEY_TITLE = { repair: 'หมายเลขใบแจ้งซ่อม', pm: 'หมายเลขสัญญา/ใบสั่งจ้าง', oh: 'หมายเลขใบสั่งจ้าง' };

/* งานที่รอประเมิน 1 ใบต่อประเภท — po = ช่อง "ใบสั่งจ้าง" ของหน้ารายการ (งานซ่อมไม่มีในข้อมูลจริง = "-" · ยังไม่เคาะ) · key = เลขหลักที่ใช้ในหัวหน้า/toast */
const REC = {
  repair: {   // งานซ่อมส่งอู่ — ข้อมูลใบแจ้งซ่อม (ใบแจ้งซ่อม Maintain-D) + ข้อมูลงานซ่อมที่ศูนย์บริการ (งานซ่อมที่ศูนย์บริการ) · ไม่มีใบสั่งจ้าง/สัญญา/ที่อยู่อู่
    po: '-', key: 'MTD-691003-014', vendor: 'อู่ ช.เจริญยนต์ ขอนแก่น', ref: 'ใบแจ้งซ่อม MTD-691003-014', plate: '82-1145 ขอนแก่น', delivered: '15/10/2569',
    job: 'MTD-691003-014', repairNo: 'RAM000245', invoice: 'R202510147', due: '14/10/2569  17:00', done: '15/10/2569  16:30', warranty: '90 วัน' },
  pm: {       // แผนเดินทางจ้างดำเนินการ (S9) ของปลั๊กอินบำรุงรักษา TRIP_V — แผน MRZ7000001 ไตรมาส 1 รถ 6 คัน
    po: 'สจ.69-0142', key: 'สจ.69-0142', vendor: 'บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด', ref: 'MRZ7000001', plate: '80-5738 น่าน +5 คัน', delivered: '21/11/2569',
    addr: 'อ.บางพลี สมุทรปราการ', mr: 'MRZ7000001', trip: 'จ้างบำรุงรักษา น่าน เชียงใหม่ เชียงราย', period: '17/11/2569 – 21/11/2569', cars: '6 คัน' },
  oh: {       // Purchase Order ของปลั๊กอิน Overhaul — PO-690201 แผน ORZ6900002 รถ 72-6648 สงขลา ปิดงาน 5 ต.ค. 2569 ประกัน 360 วัน ถึง 30 ก.ย. 2570
    po: 'PO-690201', key: 'PO-690201', vendor: 'บริษัท มิตซูบิชิ ฟูโซ่ ทรัค จำกัด', ref: 'แผน ORZ6900002', plate: '72-6648 สงขลา', delivered: '05/10/2569',
    addr: 'อ.บางพลี สมุทรปราการ', poName: 'ซ่อมระบบไฮดรอลิกกระเช้า', plan: 'ORZ6900002', cars: '1 คัน', contract: '01/09/2569 – 31/10/2569', closed: '05/10/2569', warranty: '360 วัน · ถึง 30/09/2570' },
};
const PENDING = TYPES.map(t => Object.assign({ type: t }, REC[t]));
/* ประเมินแล้วก่อนหน้า (แท็บประเมินแล้ว) — po · ผู้รับจ้าง · ประเภทงาน · ทะเบียนรถ · วันที่ประเมิน · คะแนน */
const DONE = [
  { po: '-', vendor: 'อู่ ช.เจริญยนต์ ขอนแก่น', type: 'repair', plate: '82-6789 ขอนแก่น', date: '27/09/2569', score: 88 },
  { po: 'PO-680101', vendor: 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด', type: 'oh', plate: '71-9902 ขอนแก่น +1 คัน', date: '08/01/2569', score: 92 }];   // PO-680101 แผน ORZ6800001 ปิดงาน 20 ธ.ค. 2568 (ปลั๊กอิน Overhaul)
const FULL = [5, 4, 4, 5, 4, 5, 4, 5, 4, 4, 5, 4, 4, 3, 5, 4, 5, 4, 4, 5];   // ฟอร์มกรอกครบ = 87
const PART = FULL.slice(0, 12);                                             // กรอกไป 12 ข้อ = 53
const REMARK = {   // [หมายเหตุตอนกรอกบางข้อ, หมายเหตุตอนกรอกครบ] — ถ้อยคำตามบริบทงาน
  repair: ['พื้นที่จอดรถรอซ่อมได้ 2 คัน รถคันที่ 2 ต้องจอดนอกอาคาร', 'งานเรียบร้อย ควรเพิ่มพื้นที่จอดรถรอซ่อม'],
  pm: ['วันแรกผู้รับจ้างมาถึงจุดรวมงานช้ากว่านัด 1 ชั่วโมง', 'ทำงานครบ 6 คันตามช่วงวันทำงาน ควรแจ้งรายชื่อช่างล่วงหน้า'],
  oh: ['อู่แจ้งความคืบหน้าทุกสัปดาห์ตามที่นัดไว้', 'งานเรียบร้อย ควรส่งรายการอะไหล่ที่เปลี่ยนพร้อมรถ']};
const justDone = (t) => ({ po: REC[t].po, vendor: REC[t].vendor, type: t, plate: REC[t].plate, date: TODAY, score: sum(FULL) });
const sum = (a) => a.reduce((t, x) => t + (x || 0), 0);
const avg = (a) => a.length ? (sum(a) / a.length).toFixed(2) : '-';

/* ---------- กล่อง "ข้อมูลผู้รับจ้าง" แยกตามประเภทงาน (R76 · 5 พ.ย. 2569) ----------
   component เดิม (Section header/label + กล่อง Content > Content item row · R12) — ต่างกันแค่ช่อง
   ใส่เฉพาะช่องที่ข้อมูลจริง (code-maintainD · DB) หรือแบบบำรุงรักษา/Overhaul ของเรามี · ช่องที่ไม่มีที่มาไม่แสดง ไปอยู่ "ยังไม่เคาะ" ของ ไฟล์นอกรีโป db-schema/map-09-ประเมินผู้รับจ้าง-ข้อมูลผู้รับจ้างตามประเภทงาน.md (มีชื่อตาราง DB จริง ไม่เก็บในรีโป public)
   ป้ายตามระบบเดิม: งานซ่อม = ป้ายของ Repair section / RP & MA Job ใน UI Release#2 (หมายเลขงานซ่อม · วันที่ / เวลาที่… · เลขที่ใบแจ้งหนี้ · ระยะเวลารับประกัน)
   บำรุงรักษา = ป้ายของ tripKv() ปลั๊กอินบำรุงรักษา · Overhaul = ป้ายของ poDetail()/PO_COLS ปลั๊กอิน Overhaul + "ใบสั่งจ้างเลขที่" ของแบบประเมินกระดาษ */
const DISPLAY = {
  repair: (r) => [['ผู้รับจ้าง', r.vendor], ['ประเภทงาน', JOB.repair[0]], ['เลขที่ใบแจ้งซ่อม', r.job], ['หมายเลขงานซ่อม', r.repairNo], ['ทะเบียนรถ', r.plate],
    ['เลขที่ใบแจ้งหนี้', r.invoice], ['วันที่ / เวลาที่คาดว่าจะซ่อมเสร็จ', r.due], ['วันที่ / เวลาที่ซ่อมเสร็จ', r.done], ['ระยะเวลารับประกัน', r.warranty]],
  pm: (r) => [['ผู้รับจ้าง', r.vendor], ['ที่อยู่', r.addr], ['ประเภทงาน', JOB.pm[0]], ['เลขที่สัญญา/ใบสั่งจ้าง', r.po], ['เลขที่ MR', r.mr], ['ชื่อแผนเดินทาง', r.trip],
    ['ช่วงวันทำงาน', r.period], ['รถในแผนเดินทาง', r.cars]],
  oh: (r) => [['ผู้รับจ้าง', r.vendor], ['ที่อยู่', r.addr], ['ประเภทงาน', JOB.oh[0]], ['ใบสั่งจ้างเลขที่', r.po], ['ชื่อ Purchase Order', r.poName], ['หมายเลขแผน', r.plan],
    ['จำนวนรถ', r.cars], ['ระยะสัญญา', r.contract], ['วันที่ปิดงาน', r.closed], ['ระยะเวลารับประกัน', r.warranty]],
};
/* o.form = ฟอร์มประเมิน ต่อท้ายด้วยช่องของแบบประเมินกระดาษ (วันที่ประเมิน · ผู้ตรวจประเมิน) · หน้าดูผลสองช่องนี้อยู่ในสรุปผล */
const displayFor = (type, rec, o) => DISPLAY[type](rec).concat(o && o.form ? [['วันที่ประเมิน', TODAY], ['ผู้ตรวจประเมิน', EVALUATOR]] : []);

/* ---------- หน้ารายการ (S1) — Tabs ยังไม่ได้ประเมิน / ประเมินแล้ว ตามเมนูประเมินพนักงานขับรถของ VMS+ เดิม ---------- */
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
const PEND_COLS = [['#', 64], ['ใบสั่งจ้าง', 150, 'Lead text'], ['ประเภทงาน', 140, 'Badge'], ['ผู้รับจ้าง', 0], ['เลขที่อ้างอิง', 0], ['ทะเบียนรถ', 190], ['วันที่ส่งมอบงาน', 160], ['ดำเนินการ', 104]];   // ตามหน้าจริง: # นำ · ไม่มีปุ่มเรียง · บริบทงานซ่อม/บำรุงรักษา
const pendRow = (r, i) => [String(i + 1), r.po, { pill: JOB[r.type] }, r.vendor, r.ref, r.plate, r.delivered, { icons: [has('star-24-300-round') ? 'star-24-300-round' : 'keyboard_arrow_right-20-400-round'] }];
const DONE_COLS = [['#', 64], ['ใบสั่งจ้าง', 150, 'Lead text'], ['ประเภทงาน', 140, 'Badge'], ['ผู้รับจ้าง', 0], ['ทะเบียนรถ', 190], ['วันที่ประเมิน', 140], ['คะแนน (เต็ม 100)', 200], ['', 60]];   // หน้าจริงมี "คะแนนเฉลี่ย" ดาว + ตัวเลข — ช่องตารางใส่ดาวไม่ได้ ⇒ ข้อความ · ผู้ตรวจประเมิน อยู่หน้าดูผล (ตารางไลบรารี 8 คอลัมน์)
const doneRow = (r, i) => [String(i + 1), r.po, { pill: JOB[r.type] }, r.vendor, r.plate, r.date, r.score + ' / 100 · เฉลี่ย ' + (r.score / 20).toFixed(2), { icons: ['quick_reference_all-24-300-round'] }];
async function listScreen(name, o) {
  o = o || {};
  const pend = o.pending || PENDING, done = o.done || DONE;
  const { scr, page } = await shell(name, { title: 'ประเมินผู้รับจ้าง' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs([['ยังไม่ได้ประเมิน', pend.length], ['ประเมินแล้ว', null]], o.tab || 0), 'h');
  const rows = o.tab ? done : pend;
  if (!rows.length) {   // ไม่มีรายการ — Empty state + ปุ่มไปแท็บประเมินแล้ว (แบบ ZeroRecord ของเว็บเดิม)
    const es = inst('Empty state/Data empty'); add(sec, es, 'h');
    await text(es, 'Text', 'ไม่มีรายการที่ต้องประเมิน');
    await text(es, 'Supporting text', 'ใบสั่งจ้างงานซ่อม บำรุงรักษา และ Overhaul จะเข้ามาที่นี่เมื่อผู้รับจ้างส่งมอบงานครบแล้ว');
    const pb = find(es, 'Primary button'); if (pb) pb.visible = false;
    const sb = find(es, 'Secondary button'); if (sb) setProps(sb, { Text: 'ดูรายการที่ประเมินแล้ว', 'Leading icon': false, 'Trailing icon': false });
    return scr;
  }
  add(sec, await tbl(o.tab ? DONE_COLS : PEND_COLS, rows.map((r, i) => (o.tab ? doneRow : pendRow)(r, i)), { pagination: rows.length }), 'h');
  return scr;
}

/* ---------- ฟอร์มประเมิน (S2) — หน้า Create ⇒ Section header (R3) · กล่องข้อมูลผู้รับจ้างตามประเภทงาน (R76) · ข้อประเมิน/ดาว/หมายเหตุ/สรุป ใช้ร่วมกันทุกประเภท ---------- */
/* 1 ข้อ (style หน้าจริง) = Input label ข้อความตัวหนา · แถวถัดไป Rating ดาว 5 ดวง (ไม่มีหมายเหตุรายข้อ) */
async function question(no, q, score) {
  const lb = inst('Input label'); lb.name = 'Input label';
  await text(lb, 'Label', no + '. ' + q);
  const op = find(lb, '(ถ้ามี)'); if (op) op.visible = false;
  const ic = find(lb, 'info-24-300-round'); if (ic) ic.visible = false;
  const tb = find(lb, 'Tertiary brand button'); if (tb) tb.visible = false;
  try {   // ข้อความยาวต้องตัดบรรทัด — ยืดป้ายเต็มช่องแล้วให้ข้อความสูงตามเนื้อหา (override ขนาดลูกใน instance)
    const left = find(lb, 'Left'), lt = find(lb, 'Label');
    if (left) left.layoutSizingHorizontal = 'FILL';
    if (lt) { lt.layoutSizingHorizontal = 'FILL'; lt.textAutoResize = 'HEIGHT'; }
    // 22 ต.ค. ดึก เจ้าของงานเจอบนมือถือ: Input label สูงตายตัว 24 ⇒ ข้อความหลายบรรทัดล้นขึ้นบนทับข้อก่อนหน้า — ให้ป้ายและกรอบ Left สูงตามข้อความ
    if (left) { left.counterAxisSizingMode = 'AUTO'; left.counterAxisAlignItems = 'MIN'; }   // กรอบแนวนอน ⇒ แกนรอง = ความสูง · AUTO = สูงตามข้อความ (ตั้งได้โดยไม่ต้องรอใส่ในกรอบแม่)
    lb.counterAxisSizingMode = 'AUTO'; lb.counterAxisAlignItems = 'MIN';
  } catch (e) { warn('ตัดบรรทัดข้อ ' + no, e); }
  const rt = inst('Rating', { Point: String(score || 0) }); rt.name = 'Rating';
  return col('Item', [lb, rt], 12);
}
/* หัวหมวด = Featured icon สีหลัก (ไอคอนหมวด) + Section header (ชื่อหมวด + คะแนนหมวด) */
async function groupHead(gi, title, badge) {
  const fi = inst('Featured icon', { Color: 'Brand', Size: 'md' });
  if (has(GROUP_ICON[gi])) setProps(fi, { 'Icon swap': icon(GROUP_ICON[gi]) });
  const sh = await section(title, { badge });
  const r = row('Group', [fi, sh], { hug: true, gap: 16, align: 'CENTER', keep: true });
  sh.layoutGrow = 1;
  return r;
}
async function evalForm(name, type, o) {
  o = o || {};
  const sc = o.scores || [], r = REC[type];
  const { scr, page } = await shell(name, { title: 'ประเมินผู้รับจ้าง ' + r.key, back: true, crumbs: [r.key] });
  const parts = [col('Section', [await section('ข้อมูลผู้รับจ้าง'), kv(displayFor(type, r, { form: true }))], 16),
    alertBox('Info', 'ให้คะแนนทุกข้อ 1 ถึง 5 ดาว', LEVEL.slice(1).map((l, i) => (i + 1) + ' ' + l).join(' · ') + ' · คะแนนรวมเต็ม 100 (20 ข้อ × 5) · หมายเหตุไม่บังคับ')];
  let k = 0;
  for (const [gi, [title, qs]] of GROUPS_Q.entries()) {
    const items = [];
    const gs = [];
    for (const [i, q] of qs.entries()) { k++; gs.push(sc[k - 1] || 0); items.push(await question(i + 1, q, sc[k - 1])); }
    const qcol = col('Questions', items, 24); if (!MOB) qcol.paddingLeft = 64;   // ข้อเยื้องตรงชื่อหมวด (ไอคอน 48 + ช่อง 16)
    parts.push(col('Section', [await groupHead(gi, title, sum(gs) + '/' + qs.length * 5), qcol], 16));
  }
  parts.push(col('Section', [await section('หมายเหตุ/ข้อเสนอแนะเพิ่มเติม'), area('หมายเหตุ/ข้อเสนอแนะเพิ่มเติม', o.remark || '', { optional: true, placeholder: 'ระบุหมายเหตุหรือข้อเสนอแนะ' })], 16));
  const n = sc.filter(Boolean).length;
  parts.push(col('Section', [await section('สรุปคะแนน'), kv([['ให้คะแนนแล้ว', n + ' / ' + QN + ' ข้อ'], ['คะแนนรวม', sum(sc) + ' / 100'], ['ค่าเฉลี่ย', n ? avg(sc.filter(Boolean)) + ' จาก 5' : '-'], ['ผลระดับ', 'รอเคาะเกณฑ์']])], 16));
  parts.push(btnRow([['Secondary button', 'ยกเลิก', { size: 'lg' }], ['Primary button', 'บันทึกการประเมิน', { size: 'lg', disabled: n < QN }]]));
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ---------- ดูผลประเมิน (S3) — หน้า Detail ⇒ Section label (R5/R11) · กล่องข้อมูลผู้รับจ้างตามประเภทงาน (R76) · ตารางต่อหมวด (ข้อ · รายการ · คะแนน) · หมายเหตุอยู่ในสรุปผล
   ผลของงานที่เพิ่งประเมินในบล็อก B ของประเภทเดียวกัน (คะแนน FULL = 87 · วันที่ TODAY) — ไม่สร้างใบสมมติเพิ่มต่อประเภท ---------- */
const DETAIL_COLS = [['ข้อ', 80], ['รายการประเมิน', 0], ['คะแนน', 160]];
async function resultScreen(name, type) {
  const r = REC[type], seen = FULL;
  const { scr, page } = await shell(name, { title: KEY_TITLE[type] + ' ' + r.key, back: true, crumbs: [r.key], badge: ['ประเมินแล้ว', 'Success'],
    actions: [['Secondary button', 'พิมพ์แบบประเมิน (PDF)']] });
  const parts = [col('Section', [await sectionLabel('ข้อมูลผู้รับจ้าง'), kv(displayFor(type, r))], 16)];
  const gsum = []; let k = 0;
  for (const [title, qs] of GROUPS_Q) { const a = seen.slice(k, k + qs.length); gsum.push([title, sum(a) + ' / ' + qs.length * 5]); k += qs.length; }
  parts.push(col('Section', [await sectionLabel('สรุปผลการประเมิน'), kv([['คะแนนรวม', sum(seen) + ' / 100'], ['ค่าเฉลี่ย', avg(seen) + ' จาก 5'], ['ผู้ตรวจประเมิน', EVALUATOR], ['วันที่ประเมิน', TODAY]]
    .concat(gsum, [['หมายเหตุ/ข้อเสนอแนะเพิ่มเติม', REMARK[type][1]]]))], 16));
  k = 0;
  for (const [gi, [title, qs]] of GROUPS_Q.entries()) {
    const rows = qs.map((q, i) => { k++; return [String(i + 1), q, seen[k - 1] + ' · ' + LEVEL[seen[k - 1]]]; });
    parts.push(col('Section', [await sectionLabel(title + ' ' + gsum[gi][1]), await tbl(DETAIL_COLS, rows)], 16));
  }
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ---------- รายการจอแยกตาม scenario · S2 S3 สร้างแยกตามประเภทงาน (R76 · เจ้าของงาน 5 พ.ย. 2569 "สร้าง script การสร้างออกจากกัน") ----------
   [ชื่อ scenario, จอ (ใช้ร่วม) | null, ตัวสร้างจอตามประเภท (type) => จอ | null] */
const formStates = (t) => {
  const r = REC[t], T = TYPE_TITLE[t], rm = REMARK[t];
  return [
    ['ฟอร์มประเมิน (ยังไม่ให้คะแนน)', () => evalForm('S2 ' + T + ' ฟอร์มว่าง', t, {})],
    ['ให้คะแนนบางข้อ + กรอกหมายเหตุท้ายฟอร์ม', () => evalForm('S2 ' + T + ' กรอกบางข้อ', t, { scores: PART, remark: rm[0] })],
    ['ให้คะแนนครบ 20 ข้อ', () => evalForm('S2 ' + T + ' กรอกครบ', t, { scores: FULL, remark: rm[1] })],
    ['ยืนยันการประเมิน', async () => { const s = await evalForm('S2 ' + T + ' ยืนยัน', t, { scores: FULL, remark: rm[1] }); await confirm(s, { title: 'ยืนยันการประเมิน', sub: 'คุณต้องการบันทึกคะแนนการประเมินสำหรับ ' + r.vendor + ' (' + r.key + ') ใช่หรือไม่? คะแนนรวม ' + sum(FULL) + ' / 100 · บันทึกแล้วแก้ไขไม่ได้', ok: 'ยืนยัน' }); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await evalForm('S2 ' + T + ' บันทึกไม่สำเร็จ', t, { scores: FULL, remark: rm[1] }); notify(s, 'บันทึกการประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', true); return s; }],
    ['บันทึกสำเร็จ — ย้ายไปแท็บประเมินแล้ว', async () => { const s = await listScreen('S2 ' + T + ' บันทึกสำเร็จ', { tab: 1, pending: PENDING.filter(p => p.type !== t), done: [justDone(t)].concat(DONE) }); notify(s, 'ประเมินผู้รับจ้างสำเร็จ (' + r.key + ')'); return s; }],
    ['ยกเลิกระหว่างกรอก — ยืนยันการออก', async () => { const s = await evalForm('S2 ' + T + ' ยืนยันการออก', t, { scores: PART, remark: rm[0] }); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' }); return s; }]];
};
const resultStates = (t) => [['ผลประเมิน', () => resultScreen('S3 ' + TYPE_TITLE[t] + ' ผลประเมิน', t)]];
const SCENARIOS = [
  ['S1 · กบค. ดูรายการประเมินผู้รับจ้าง', [
    ['แท็บยังไม่ได้ประเมิน', () => listScreen('S1 ยังไม่ได้ประเมิน', { tab: 0 })],
    ['แท็บประเมินแล้ว', () => listScreen('S1 ประเมินแล้ว', { tab: 1 })],
    ['ไม่มีรายการที่ต้องประเมิน', () => listScreen('S1 ไม่มีรายการ', { tab: 0, pending: [] })]], null],
  ['S2 · กบค. ประเมินผู้รับจ้าง 1 งานจ้าง', null, formStates],
  ['S3 · กบค. ดูผลประเมิน', null, resultStates],
];

/* ---------- กลุ่ม = scenario (R19: 1 scenario = 1 บล็อก · A.1 A.2 = state) · ยังไม่มีผัง userflow (ไม่มี build.json)
   S2 S3 มีบล็อกย่อยตามประเภทงาน (แถบ Sub Flow): B1 งานซ่อม · B2 งานบำรุงรักษา · B3 งาน Overhaul (C1–C3 เช่นกัน) · ป้าย state B1.1 B1.2 …
   ตัวเลขบล็อกย่อยผูกกับ TYPES (ไม่ใช่ลำดับที่เลือก) ⇒ สร้างประเภทเดียวรหัสก็ยังเป็น B2 C2 ฯลฯ ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function groupsFor(idx, types) {
  types = TYPES.filter(t => (types || TYPES).indexOf(t) >= 0);
  return idx.map(i => {
    const [title, screens, perType] = SCENARIOS[i];
    const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
    const subs = perType
      ? types.map(t => ({ code: code + (TYPES.indexOf(t) + 1), title: rest + ' · ' + TYPE_TITLE[t], tag: tag + ' ' + TYPE_TITLE[t], screens: perType(t).map(([label, fn]) => [label, fn, '']) }))
      : [{ code, title: rest, tag, screens: screens.map(([label, fn]) => [label, fn, '']) }];
    return { code, title: tag + ' ' + rest, subs };
  }).filter(g => g.subs.length);
}
const ALL_IDX = SCENARIOS.map((_, i) => i);

/* ---------- สร้าง: Desktop · Mobile · เฉพาะ scenario ที่เลือก · เฉพาะประเภทงาน · เช็ค component — วางบนหน้า "ประเมินผู้รับจ้าง" ต่อใต้ของเดิม (ไม่มีก็สร้าง) ---------- */
async function buildSet(GRP, what, devices) {
  errors.length = 0;
  const t0 = Date.now();
  log('นำเข้า component จากไลบรารี…');
  await resolveAll();
  log(deviceSetInfo());
  const tp = await namedPage([PLUGIN.page]);
  const page = tp.page;
  log(tp.found ? 'วางบนหน้า "' + page.name + '" ต่อใต้ของเดิม — ของที่มีอยู่บนหน้านี้ไม่ถูกแตะ'
    : tp.fallback ? '⚠ สร้างหน้า "' + PLUGIN.page + '" ไม่ได้ (แพลนจำกัดจำนวนหน้า) — วางต่อใต้ของเดิมในหน้า "' + page.name + '" ไม่ลบอะไร'
    : 'ไม่พบหน้า "' + PLUGIN.page + '" — สร้างหน้าใหม่ชื่อนี้แล้ววางลงไป');
  await figma.setCurrentPageAsync(page);
  let y = 0;
  page.children.forEach(n => { if (n.absoluteBoundingBox) y = Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + 400); });
  const TOTAL = GRP.reduce((a, g) => a + g.subs.reduce((b, s) => b + s.screens.length, 0), 0);
  const { made } = await buildGrid(page, PLUGIN.prefix, GRP, y, TOTAL * devices.length, { devices, flow: false });
  let instances = 0, loose = 0;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') loose++;
  }
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 4));
  const codes = GRP.map(g => g.subs.map(s => s.code).join(' ')).join(' ');
  log('');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ' + GRP.length + ' บล็อก ' + what + ' (' + codes + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓'));
  log('component ที่ใช้ (' + USED.size + '): ' + [...USED].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่ต้องสลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด — ฟอนต์ ' + (FALLBACK_FONT ? FALLBACK_FONT.family + ' ' + FALLBACK_FONT.style : '-'));
  reportOversize();
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
const typesOf = (o) => { const t = (o && o.types || []).filter(x => TYPES.indexOf(x) >= 0); return t.length ? t : TYPES; };   // ไม่ส่ง/ไม่ติ๊ก = ทุกประเภท
async function build(o) { await buildSet(groupsFor(ALL_IDX, typesOf(o)), 'scenario', devOf(o)); }
async function buildDesktop(o) { await buildSet(groupsFor(ALL_IDX, typesOf(o)), 'scenario · desktop', [false]); }
async function buildMobile(o) { await buildSet(groupsFor(ALL_IDX, typesOf(o)), 'scenario · mobile', [true]); }
async function buildPick(o) {   // ติ๊กเฉพาะบาง scenario · รหัสตัวอักษรคงเดิม (A–C) · S2 S3 ตามประเภทงานที่ติ๊ก
  const idx = (o.pick || []).map(Number).filter(i => i >= 0 && i < SCENARIOS.length);
  if (!idx.length) { log('ยังไม่ได้ติ๊ก scenario — ติ๊กอย่างน้อย 1 รายการแล้วกดอีกครั้ง'); return; }
  await buildSet(groupsFor(idx, typesOf(o)), 'scenario ที่เลือก', devOf(o));
}
/* ปุ่มสร้างแยกประเภทงาน (R76) — S2 ฟอร์มประเมิน + S3 ดูผล ของประเภทนั้นอย่างเดียว · หน้ารายการ S1 ใช้ร่วม สร้างจากปุ่ม "เฉพาะ scenario ที่เลือก" A */
async function buildType(t, o) {
  await buildSet(groupsFor([1, 2], [t]), TYPE_TITLE[t], devOf(o));
}

figma.ui.onmessage = async (msg) => {
  try {
    const o = { devices: msg.devices, pick: msg.pick, types: msg.types };
    if (msg.type === 'build') await build(o);
    if (msg.type === 'build-desktop') await buildDesktop(o);
    if (msg.type === 'build-mobile') await buildMobile(o);
    if (msg.type === 'build-pick') await buildPick(o);
    if (msg.type === 'build-repair') await buildType('repair', o);
    if (msg.type === 'build-pm') await buildType('pm', o);
    if (msg.type === 'build-oh') await buildType('oh', o);
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]), types: TYPES.map((t, i) => [t, TYPE_TITLE[t], i + 1]) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก" + ประเภทงาน
