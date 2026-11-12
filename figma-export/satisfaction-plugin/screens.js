/* ============================================================================
   Maintain-D — แบบประเมินความพึงพอใจ (XCHO) · เรื่องแยก · จอจาก component จริง
   ----------------------------------------------------------------------------
   เจ้าของงาน 12 พ.ย. 2569: "เรื่องการประเมินเป็นเรื่องแยกที่จะไปผูกตาม flow ต่างๆ เลยอยากแยกใว้"
     ⇒ ย้ายแบบประเมินความพึงพอใจออกจากปลั๊กอินบำรุงรักษา (เดิม S27 บล็อก Y · R94) มาเป็นปลั๊กอินแยก · งานซ่อม บำรุงรักษาตามวาระ Overhaul ผูกเข้ามาที่เรื่องนี้
   โครงจอ = เฟรมประเมินผู้รับจ้างของเจ้าของงาน (~/PEA/Maintain-D/userflow/figma-ref/contractor-eval-ABC-2569-11-12.txt บล็อก A B C)
     ยกโค้ดแบบ copy แล้วปรับจาก contractor-eval-plugin/screens.js (listScreen · evalForm · resultScreen) และบล็อก Y เดิมของ maintainance-plugin (satList · satForm · satResult) ไม่ import ข้ามปลั๊กอิน
   12 พ.ย. 2569 รอบ 2 — ข้อมูลและข้อความตรงกับต้นแบบเว็บ (รีโป maintenance-utility-vehicle commit db7bf4a · src/lib/mock/survey.ts · src/app/satisfaction/**)
     เว็บเป็นหลักของข้อมูลเรื่องนี้ · ข้อความบนจอสองฝั่งต้องเหมือนกันตรงตัว:
     รายการ = Table header ค้นหา "ค้นหาเลขที่งาน, ทะเบียน" + ตัวกรอง (ประเภทงาน · หน่วยงานที่ให้บริการ) · ฟอร์ม = หมายเหตุรายข้อ "หมายเหตุข้อ n" (ถ้ามี) + หมายเหตุท้ายฟอร์ม
     · ผล = ตารางรายด้าน ข้อ · รายการประเมิน · คะแนน "5 · ดีมาก" · หมายเหตุ · ชื่อเมนู/หัวหน้า "แบบประเมินความพึงพอใจ"
   เนื้อหา = แบบสำรวจ "VMS+" ของ กบค. ในระบบจัดการแบบฟอร์ม XCHO (ไฟล์ VMS+ _ Xcho-1…5.pdf) ลอกหัวข้อ คำถามตรงตัว
     ข้อมูลผู้ใช้รถฯ 5 ช่อง (ระบบเติมให้) · 4 ด้าน 11 ข้อ ดาว 1–5 (`Rating`) · ด้านละ 10/20/15/10 · รวมเต็ม 55 (ไม่แปลงเป็นร้อย) · ผลระดับ "รอเคาะเกณฑ์"
     ข้อความที่ลอกจากแบบสำรวจคง "ผู้ใช้รถฯ" "ทะเบียนรถ" · "รถกระเช้า" = ประเภทยานพาหนะจากข้อมูล Overhaul (allow ของ R105) · ข้อความของเราใช้ "ยานพาหนะ" (R80 ฉบับเรื่องนี้)
   ใครประเมิน (เจ้าของงาน 12 พ.ย. 2569): หน่วยงานของยานพาหนะ (ผู้ดูแลยานพาหนะ) หลังงานปิด · 1 แถว = 1 งานของยานพาหนะ 1 คัน
     ประเมิน "หน่วยงานที่ให้บริการ" — ระบบเติมให้ ฟอร์มเดียวกัน:
       งานซ่อม = กบค. · Overhaul = กบค. · บำรุงรักษาตามวาระ แผนที่ กบค. ดำเนินการ = กบค. · แผนของกองอื่น (กบผ. กปส. กรย. กส.1 กส.2) = กองที่ดำเนินการ
   ข้อมูลจำลอง = ชุดเดียวกับเว็บ (survey.ts seeds + ?sample=S27):
     ยังไม่ได้ประเมิน MRZ7100004 73-5019 เพชรบุรี (กบค.) · MRZ7000001 82-6789 ขอนแก่น (กบผ.) · งานซ่อม MTD-691003-014 82-1145 ขอนแก่น (กบค.) · Overhaul ORZ6900002 PO-690201 72-6648 สงขลา (กบค.)
     ประเมินแล้ว MRZ7000001 82-1145 ขอนแก่น (กบผ. · 47/55) · งานซ่อม MTD-690716-031 82-6789 ขอนแก่น (กบค. · 45/55) · MRZ6900011 80-4458 แพร่ (กรย. · 48/55)
   ที่มา: component Tabs · Table header · Table · Pill outline · Empty state/Data empty · Section header · Section label · Content item row · Alert · Featured icon · Input label · Rating
     · Text input · Text area · Input dropdown with badges · Side panel header/footer · Primary/Secondary button · Modal · Notification · Mobile table ของไฟล์ (Component) VMS Plus
     + หน้าประเมินผู้รับจ้าง (เฟรมเจ้าของงาน 12 พ.ย. 2569) + แผงตัวกรองของ Vehicle list หน้า 5.2 Vehicle Management ของ UI Release#2 (ชุดเดียวกับ S24 ของบำรุงรักษา) · ไม่มี component ใหม่
   กติกา: component-rules.md §5.1 (R19) · §5.43 (R105) · plan.md หัวข้อ 🎯
   ============================================================================ */

const PLUGIN = { prefix: 'SAT', page: 'ประเมินความพึงพอใจ', menu: 'แบบประเมินความพึงพอใจ', searchHint: 'ค้นหาเลขที่งาน, ทะเบียน' };   // menu = ชื่อเมนูชั้นบนใน Sidebar ของเว็บ (SAT_LABEL) · page = หน้า Figma เดิม

/* ---------- component ที่ใช้ — ชุดเดียวกับ contractor-eval-plugin + Table header/แผงตัวกรอง (ขาดตัวไหนหยุด) · NESTED = ชิ้นซ้อน · LOCAL_OPTIONAL = ป้ายของทีมออกแบบ ไม่มีก็วาดแถบธรรมดา ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Featured icon',
  'Table header', 'Table pagination', 'Text input', 'Text area', 'Input label', 'Input dropdown with badges', 'Alert', 'Tabs', 'Rating',
  'Primary button', 'Secondary button', 'Background overlay', 'Modal', 'Notification', 'Empty state/Data empty', 'Empty state/Search not found', 'Side panel header', 'Side panel footer',
  'add-24-300-round', 'filter_list-24-400-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round', 'quick_reference_all-24-300-round',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header'];
const NESTED = ['Nav button', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Tertiary button',
  '_Content item base', 'Badge outline', 'Pill outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Tab item', '_Rating star base',
  'call-24-300-round', 'groups-24-300-round', 'car_repair-24-300-round', 'search_check-24-300-round', 'star-24-300-round'];   // ไอคอนหัวด้าน/ปุ่มดาว — นำเข้าไม่ได้ = Featured icon ใช้ไอคอนตั้งต้น / ปุ่มลูกศร (ทางถอยเดียวกับ contractor-eval)
const LOCAL_OPTIONAL = ['Device Type', 'Component 1', 'Header'];   // ป้าย Device/Desktop/Mobile + แถบรหัส flow (Design Annotations ของ UI Release#2)
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี — ชุดเดียวกับ contractor-eval-plugin (ดัมป์ 19 ต.ค. 2569) + Input dropdown with badges ของ maintainance-plugin · รูปแบบบรรทัดต้องเหมือน KEYS ใน core เพราะ test harness อ่านด้วย regex */
Object.assign(KEYS, {
  "Input dropdown with badges": ["705d2a75bc12121c2c1c0a9737327fbc1ea60696", true],
  "Rating": ["1d3c2e045977bc6b2b407cdd2c82eb43dc00325a", true],
  "_Rating star base": ["51d4e5f5f09b643b0816d27100d99a9bf08432f5", true],
  "car_repair-24-300-round": ["1e59e85c3ba457b3fbc4ea88a7eacba331ca23c7", false],
  "groups-24-300-round": ["16f9e5ce96b0b738a6cc2e87a7500a6898ac28ae", false],
  "call-24-300-round": ["117dd21b39fd7f89391fa783e220ad32b61746e2", false],
  "search_check-24-300-round": ["230bb3b003a72d41a3649ee10760711ec3846d87", false],
  "star-24-300-round": ["ecf8821fb00ba65575f6814101291f6166e00aa6", false]
});

/* ---------- แบบสำรวจ XCHO (ลอกตรงตัวจาก VMS+ _ Xcho-1…5.pdf · ตรงกับ SURVEY_GROUPS ของเว็บ) ---------- */
const SURVEY_INFO = ['ทะเบียนรถ', 'ชื่อผู้ตอบแบบสอบถาม', 'นามสกุลผู้ตอบแบบสอบถาม', 'ตำแหน่ง ผู้ตอบแบบสอบถาม', 'สังกัด'];
const SURVEY = [   // [ชื่อด้าน, ข้อ, ไอคอนหัวด้าน]
  ['ด้านระบบการให้บริการ', ['ความรวดเร็วในการรับบริการ', 'ความสะดวกในการติดต่อเพื่อขอรับบริการ'], 'call-24-300-round'],
  ['ด้านเจ้าหน้าที่และ/หรือผู้ให้บริการ', ['อัธยาศัยของผู้ให้บริการ', 'ความรู้ของผู้ให้บริการ', 'การให้ความรู้และคำแนะนำแก่ผู้รับบริการ', 'ความตั้งใจในการดำเนินการให้ผู้รับบริการ'], 'groups-24-300-round'],
  ['ด้านคุณภาพของสินค้าและ/หรือบริการ', ['คุณภาพของอะไหล่และการบริการ', 'ระยะเวลาในการได้รับอะไหล่และการบริการ', 'อุปกรณ์ เครื่องมือและเทคโนโลยีในการให้บริการ'], 'car_repair-24-300-round'],
  ['ด้านสภาพแวดล้อมต่างๆ', ['การทำความสะอาดพื้นที่หลังการให้บริการ', 'การทำความสะอาดเครื่องจักรกลหลังการให้บริการ'], 'search_check-24-300-round']];
const SURVEY_N = SURVEY.reduce((n, g) => n + g[1].length, 0);   // 11
const SURVEY_MAX = SURVEY_N * 5;   // 55
/* ข้อความหน้าจอ — ตรงตัวกับค่าคงที่ของเว็บ (survey.ts SAT_*) */
const TITLE = 'แบบประเมินความพึงพอใจ';                                              // SAT_TITLE · ชื่อเมนู + หัวหน้ารายการ · หัวฟอร์ม/ผล = TITLE + ' ' + เลขที่งาน
const TABS = ['ยังไม่ได้ประเมิน', 'ประเมินแล้ว'];                                      // SAT_TABS
const EMPTY = ['ไม่มีรายการที่ต้องประเมิน', 'งานจะเข้ามาที่นี่เมื่อปิดงานแล้ว'];          // SAT_EMPTY
const EMPTY_BTN = 'ดูรายการที่ประเมินแล้ว';                                            // SAT_EMPTY_BTN
const LEVEL = ['', 'ต้องปรับปรุงมาก', 'ต้องปรับปรุง', 'พอใช้', 'ดี', 'ดีมาก'];               // ชื่อระดับ 1–5 (ช่องคะแนนในหน้าผล "5 · ดีมาก")
const ALERT = ['ให้คะแนนทุกข้อ 1 ถึง 5 ดาว',
  LEVEL.slice(1).map((l, i) => i + 1 + ' ' + l).join(' · ') + ' · คะแนนรวมเต็ม ' + SURVEY_MAX + ' (' + SURVEY_N + ' ข้อ × 5) · หมายเหตุไม่บังคับ'];   // SAT_ALERT
const REMARK_LABEL = 'หมายเหตุ/ข้อเสนอแนะเพิ่มเติม';                                    // SAT_REMARK
const NOTE_LABEL = (n) => 'หมายเหตุข้อ ' + n;                                          // SAT_NOTE
const PROVIDER = 'หน่วยงานที่ให้บริการ';                                                // PROVIDER_LABEL
const CONFIRM = (j, sum) => ({ title: 'ยืนยันการประเมิน', sub: 'คุณต้องการบันทึกคะแนนการประเมินสำหรับ ' + j.provider + ' (' + j.no + ') ใช่หรือไม่? คะแนนรวม ' + sum + ' / ' + SURVEY_MAX + ' · บันทึกแล้วแก้ไขไม่ได้', ok: 'ยืนยัน' });   // SAT_CONFIRM
const LEAVE = { title: 'ยืนยันการออก', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' };   // SAT_LEAVE
const FAIL = 'บันทึกการประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';                              // SAT_FAIL
const OK = (no) => 'ประเมินความพึงพอใจสำเร็จ (' + no + ')';                                // SAT_OK
const EVAL_AT = '07/11/2569 09:30 น.';                                                  // วันที่ประเมินของต้นแบบ (หลังรับทราบ S13)
const ssum = (a) => a.reduce((t, x) => t + (x || 0), 0);
const savg = (a) => { const n = a.filter(Boolean).length; return n ? (ssum(a) / n).toFixed(2) : '-'; };

/* ---------- ข้อมูลจำลอง (ตรงกับ seeds + ?sample=S27 ของ survey.ts) ----------
   1 แถว = 1 งานของยานพาหนะ 1 คัน · kind = ประเภทงาน · provider = หน่วยงานที่ให้บริการ (ระบบเติมจากผู้ดำเนินการงาน) · pairs = ช่องเฉพาะประเภทงานของกล่องข้อมูลงาน
   กล่องข้อมูลงาน (jobPairs ของเว็บ) = ประเภทงาน · เลขที่งาน (ป้ายตามประเภท) · ทะเบียน · ประเภทยานพาหนะ · pairs · วันที่ปิดงาน · หน่วยงานที่ให้บริการ (+ ฟอร์ม: วันที่ประเมิน · ผู้ประเมิน)
   ตำแหน่งผู้ดูแลยานพาหนะ ชก.7 = ค่าสมมติของเว็บ (CARETAKER_POS) */
const KIND = { ma: ['บำรุงรักษาตามวาระ', 'Success'], repair: ['งานซ่อม', 'Info'], oh: ['Overhaul', 'Brand'] };   // สีป้ายชุดเดียวกับประเมินผู้รับจ้าง
const NO_LABEL = { ma: 'เลขที่ MR', repair: 'เลขที่ใบแจ้งซ่อม', oh: 'หมายเลขแผน' };
const CARETAKER_POS = 'ชก.7';
const TRIP_T1 = 'ตรวจยานพาหนะ ขอนแก่น อุดรธานี ลำปาง', PLAN_T1 = 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 และภาค 2 ปีงบประมาณ 2570';
const JOBS = {
  kbk: { kind: 'ma', no: 'MRZ7100004', plate: '73-5019 เพชรบุรี', vtype: 'กระเช้าแก้ไฟ', work: 'ตรวจยานพาหนะ เพชรบุรี', provider: 'กบค.', closed: '05/11/2569',
    caretaker: 'นายธนกร ศรีสมุทร', owner: 'กฟต.1 เพชรบุรี', pairs: [['ชื่อแผน', 'บำรุงรักษากระเช้าแก้ไฟ กบค. ปีงบประมาณ 2571'], ['ไตรมาส', 'ไตรมาส 1'], ['ผู้ดำเนินการ', 'นายวิชัย ทองดี (กบค.)']] },
  ma6789: { kind: 'ma', no: 'MRZ7000001', plate: '82-6789 ขอนแก่น', vtype: 'กระเช้าแก้ไฟ', work: TRIP_T1, provider: 'กบผ.', closed: '04/11/2569',
    caretaker: 'นายสมชาย แก้วมณี', owner: 'กฟฉ.1 ขอนแก่น', pairs: [['ชื่อแผน', PLAN_T1], ['แผนเดินทาง', TRIP_T1], ['ผู้ดำเนินการ', 'นายวิชัย ทองดี (กบผ.)'], ['รับทราบผลเมื่อ', '06/11/2569 10:05 น.']] },
  rp014: { kind: 'repair', no: 'MTD-691003-014', plate: '82-1145 ขอนแก่น', vtype: 'กระเช้าฮอทไลน์', work: 'ระบบไฮดรอลิกกระเช้ารั่วซึม', provider: 'กบค.', closed: '15/10/2569',
    caretaker: 'นายสมชาย แก้วมณี', owner: 'กฟฉ.1 ขอนแก่น', pairs: [['หมายเลขงานซ่อม', 'RAM000245'], ['อาการที่แจ้ง', 'ระบบไฮดรอลิกกระเช้ารั่วซึม'], ['วันที่ / เวลาที่ซ่อมเสร็จ', '15/10/2569 16:30 น.']] },
  oh: { kind: 'oh', no: 'ORZ6900002', plate: '72-6648 สงขลา', vtype: 'รถกระเช้า', work: 'ซ่อมระบบไฮดรอลิกกระเช้า', provider: 'กบค.', closed: '05/10/2569',
    caretaker: 'นายอดิศักดิ์ ทองสุข', owner: 'กฟต.3 สงขลา', pairs: [['ชื่อแผน', 'Overhaul ประจำปีงบ 2569 — รถกระเช้า'], ['ใบสั่งจ้างเลขที่', 'PO-690201'], ['ชื่อ Purchase Order', 'ซ่อมระบบไฮดรอลิกกระเช้า'], ['ยี่ห้อ/รุ่น', 'HINO FG1J']] },
  ma1145: { kind: 'ma', no: 'MRZ7000001', plate: '82-1145 ขอนแก่น', vtype: 'กระเช้าฮอทไลน์', work: TRIP_T1, provider: 'กบผ.', closed: '05/11/2569',
    caretaker: 'นายสมชาย แก้วมณี', owner: 'กฟฉ.1 ขอนแก่น', pairs: [['ชื่อแผน', PLAN_T1], ['แผนเดินทาง', TRIP_T1], ['ผู้ดำเนินการ', 'นางสาวกนกวรรณ ใจมั่น (กบผ.)'], ['รับทราบผลเมื่อ', '06/11/2569 10:05 น.']],
    done: { answers: [4, 4, 5, 4, 4, 5, 4, 4, 4, 4, 5], at: '06/11/2569 14:20 น.', remark: 'ช่างอธิบายงานที่ทำให้ฟังก่อนส่งคืน ควรแจ้งเวลาถึงล่วงหน้า' } },   // 47 · SAMPLE_DONE + SAMPLE_REMARK ของเว็บ
  rp031: { kind: 'repair', no: 'MTD-690716-031', plate: '82-6789 ขอนแก่น', vtype: 'กระเช้าแก้ไฟ', work: 'กระเช้าเอียง/ล็อกไม่อยู่', provider: 'กบค.', closed: '24/09/2569',
    caretaker: 'นายสมชาย แก้วมณี', owner: 'กฟฉ.1 ขอนแก่น', pairs: [['หมายเลขงานซ่อม', 'RAM000198'], ['อาการที่แจ้ง', 'กระเช้าเอียง/ล็อกไม่อยู่'], ['วันที่ / เวลาที่ซ่อมเสร็จ', '24/09/2569 15:10 น.']],
    done: { answers: [5, 4, 4, 4, 4, 5, 4, 3, 4, 4, 4], at: '27/09/2569 10:15 น.', remark: 'ซ่อมเสร็จตามนัด ควรแจ้งความคืบหน้าระหว่างรออะไหล่' } },   // 45
  ma4458: { kind: 'ma', no: 'MRZ6900011', plate: '80-4458 แพร่', vtype: 'กระเช้าฮอทไลน์', work: 'ตรวจยานพาหนะ แพร่', provider: 'กรย.', closed: '01/10/2568',
    caretaker: 'นายพิชิต ปัญญาดี', owner: 'กฟน.2 แพร่', pairs: [['ชื่อแผน', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 ปีงบประมาณ 2569'], ['ไตรมาส', 'ไตรมาส 1'], ['ผู้ดำเนินการ', 'นางสาวพิมพ์ชนก ศรีสุข (กรย.)']],
    done: { answers: [4, 5, 4, 4, 5, 4, 4, 4, 4, 5, 5], at: '03/10/2568 14:00 น.' } }};   // 48
const SAMPLE = [5, 4, 4, 5, 4, 4, 4, 3, 4, 5, 4];   // ปุ่มต้นแบบ "กรอกข้อมูลตัวอย่าง" ของเว็บ (SAMPLE_ANSWERS) ครบ 11 ข้อ = 46
const PART = SAMPLE.slice(0, 6);                    // 2 ด้านแรก 6 ข้อ = 26
const SAMPLE_NOTES = SAMPLE.map((_, i) => (i === 7 ? 'รออะไหล่ไส้กรองไฮดรอลิก 2 วัน' : ''));   // หมายเหตุข้อ 8 (sampleNotes ของเว็บ)
const SAMPLE_REMARK = 'ช่างมาตรงเวลา อธิบายงานที่ทำก่อนส่งคืนยานพาหนะ';   // SAMPLE_FORM_REMARK ของเว็บ
const PART_REMARK = 'ช่างมาตรงเวลา';
const SAVED = { answers: SAMPLE, notes: SAMPLE_NOTES, at: EVAL_AT, remark: SAMPLE_REMARK };   // MRZ7000001 82-6789 หลังกดบันทึก (B.6 · C.4)
const PENDING = ['kbk', 'ma6789', 'rp014', 'oh'];   // เรียงวันที่ปิดงานใหม่สุดก่อน (evalRows ของเว็บ)
const DONE = ['ma1145', 'rp031', 'ma4458'];
const doneOf = (k, saved) => (saved && saved[k]) || JOBS[k].done;
const surveyInfo = (j) => { const s = j.caretaker.indexOf(' '); return [j.plate, j.caretaker.slice(0, s), j.caretaker.slice(s + 1), CARETAKER_POS, j.owner]; };
const jobPairs = (j) => [['ประเภทงาน', KIND[j.kind][0]], [NO_LABEL[j.kind], j.no], ['ทะเบียน', j.plate], ['ประเภทยานพาหนะ', j.vtype]].concat(j.pairs, [['วันที่ปิดงาน', j.closed], [PROVIDER, j.provider]]);

/* ---------- A รายการ — Tabs ยังไม่ได้ประเมิน (จำนวน) / ประเมินแล้ว · Table header ค้นหา + ตัวกรอง · ตารางหน้าละ 10 (เว็บ /satisfaction/) ---------- */
async function tabs(items, active) {   // component Tabs (5 ช่อง Tab item) · items [[ข้อความ, จำนวน]] · ซ่อนช่องที่เกิน (ยกจาก contractor-eval-plugin)
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
const PEND_COLS = [['เลขที่งาน', 170, 'Lead text'], ['ประเภทงาน', 170, 'Badge'], ['ทะเบียน', 200], ['งาน', 0], [PROVIDER, 170], ['วันที่ปิดงาน', 130], ['ดำเนินการ', 104]];
const pendRow = (ro) => (k) => { const j = JOBS[k]; return [j.no, { pill: KIND[j.kind] }, { text: j.plate, sub: j.vtype }, j.work, j.provider, j.closed,
  { icons: ro ? [] : [has('star-24-300-round') ? 'star-24-300-round' : 'keyboard_arrow_right-20-400-round'] }]; };   // ro = ดูอย่างเดียว (กบค.) ช่องดำเนินการว่าง แบบ actions [] ของเว็บ (canEvaluate = ผู้ดูแลยานพาหนะเท่านั้น)
const DONE_COLS = [['เลขที่งาน', 170, 'Lead text'], ['ประเภทงาน', 170, 'Badge'], ['ทะเบียน', 0], [PROVIDER, 170], ['วันที่ประเมิน', 130], ['ผู้ประเมิน', 190], ['คะแนน (เต็ม ' + SURVEY_MAX + ')', 190], ['', 60]];
const doneRow = (saved) => (k) => { const j = JOBS[k], d = doneOf(k, saved); return [j.no, { pill: KIND[j.kind] }, { text: j.plate, sub: j.vtype }, j.provider, d.at.slice(0, 10), j.caretaker,
  ssum(d.answers) + ' / ' + SURVEY_MAX + ' · เฉลี่ย ' + savg(d.answers), { icons: ['quick_reference_all-24-300-round'] }]; };
/* ค้นหา/กรองไม่พบ — Empty state/Search not found ค่าของเว็บ (EmptyStateSearchNotFound ค่าเริ่ม "ไม่พบข้อมูล" / "เปลี่ยนคำค้นหรือเงื่อนไขแล้วลองใหม่อีกครั้ง") + Secondary button "ล้างตัวกรอง" (Primary button ซ่อน)
   ยกแบบ copy จาก searchNotFound() ของ maintainance-plugin (S24 ค้นหาไม่พบ · Vehicle list State=Search not found ของ UI Release#2) ไม่ import ข้ามปลั๊กอิน */
const NOT_FOUND = ['ไม่พบข้อมูล', 'เปลี่ยนคำค้นหรือเงื่อนไขแล้วลองใหม่อีกครั้ง'], CLEAR_BTN = 'ล้างตัวกรอง';
async function searchNotFound() {
  const es = inst('Empty state/Search not found');
  await text(es, 'Text', NOT_FOUND[0]); await text(es, 'Supporting text', NOT_FOUND[1]);
  es.findAll(n => n.type === 'INSTANCE' && /button/i.test(n.name)).forEach((b, i) => { if (i === 0) setProps(b, { Text: CLEAR_BTN, 'Leading icon': false, 'Trailing icon': false }); else b.visible = false; });
  return es;
}
/* o.tab · o.pending / o.done (คีย์ JOBS) · o.saved = ผลที่เพิ่งบันทึก { คีย์: ผล }
   o.readOnly = มุม กบค. (rowsFor ของเว็บ: เห็นเฉพาะงานที่หน่วยงานที่ให้บริการเป็น กบค. ดูอย่างเดียว ไม่มีไอคอนดาว · ดูผลได้) · o.query = คำค้นในช่องค้นหา · o.notFound = ค้นหาไม่พบ */
async function listScreen(name, o) {
  o = o || {};
  const pend = o.pending || PENDING, done = o.done || DONE;
  const { scr, page } = await shell(name, { title: TITLE });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs([[TABS[0], pend.length], [TABS[1], null]], o.tab || 0), 'h');
  const rows = o.tab ? done : pend;
  if (!rows.length) {   // ไม่มีรายการ — Empty state + ปุ่มไปแท็บประเมินแล้ว (ไม่มี Table header ตามเว็บ)
    const es = inst('Empty state/Data empty'); add(sec, es, 'h');
    await text(es, 'Text', EMPTY[0]);
    await text(es, 'Supporting text', EMPTY[1]);
    const pb = find(es, 'Primary button'); if (pb) pb.visible = false;
    const sb = find(es, 'Secondary button'); if (sb) setProps(sb, { Text: EMPTY_BTN, 'Leading icon': false, 'Trailing icon': false });
    return scr;
  }
  add(sec, await tableHeader({ query: o.query }), 'h');   // ค้นหา "ค้นหาเลขที่งาน, ทะเบียน" (PLUGIN.searchHint) + ปุ่มตัวกรอง
  if (o.notFound) { add(sec, await searchNotFound(), 'h'); return scr; }   // ค้นหา/กรองไม่เจอ = Empty state/Search not found แทนตาราง (Tabs + Table header คงอยู่ ตามเว็บ)
  add(sec, await tbl(o.tab ? DONE_COLS : PEND_COLS, rows.map(o.tab ? doneRow(o.saved) : pendRow(o.readOnly)), { pagination: rows.length }), 'h');
  return scr;
}
const FILTER_FIELDS = () => [multiDropdown('ประเภทงาน', [], { optional: true, placeholder: 'ทั้งหมด' }), multiDropdown(PROVIDER, [], { optional: true, placeholder: 'ทั้งหมด' })];   // FilterShell ของเว็บ (ชุดเดียวกับ S24) · ค่าเริ่ม "ทั้งหมด"

/* ---------- B ฟอร์ม — หน้า Create ⇒ Section header (R3) · ข้อมูลงาน · ข้อมูลผู้ใช้รถฯ · Alert สเกล · 4 ด้าน (ข้อละ Rating + หมายเหตุข้อ n) · หมายเหตุท้ายฟอร์ม · สรุปคะแนน · ปุ่ม ---------- */
function question(no, n, q, score, note) {   // Input label "n. ข้อ" (ไม่มี "(ถ้ามี)" = บังคับ) → 12 → Rating ดาว 5 ดวง (เริ่มว่าง Point=0) → 12 → Text input "หมายเหตุข้อ n" (ถ้ามี) กว้างตั้งต้นของไลบรารี · มือถือเต็มแถว
  const lb = inst('Input label', {}, { 'Label text': no + '. ' + q, Optional: false, 'Info icon': false });
  const rt = inst('Rating', { Point: String(score || 0) }); rt.name = 'Rating';
  const c = col('Item', [lb, rt], 12);
  const nt = field(NOTE_LABEL(n), note || '', { optional: true, placeholder: 'ระบุหมายเหตุ' });
  if (MOB) add(c, nt, 'h'); else c.appendChild(nt);
  return c;
}
async function groupHead(title, ic, badge) {   // Featured icon สีหลัก + Section header (ชื่อด้าน + Badge คะแนนด้าน) — หัวหมวดของประเมินผู้รับจ้าง
  const fi = inst('Featured icon', { Color: 'Brand', Size: 'md' });
  if (has(ic)) setProps(fi, { 'Icon swap': icon(ic) });
  const sh = await section(title, { badge });
  const r = row('Group', [fi, sh], { hug: true, gap: 16, align: 'CENTER', keep: true });
  sh.layoutGrow = 1;
  return r;
}
async function evalForm(name, k, o) {   // o.scores · o.notes · o.remark
  o = o || {};
  const sc = o.scores || [], nts = o.notes || [], j = JOBS[k];
  const { scr, page } = await shell(name, { title: TITLE + ' ' + j.no, back: true, crumbs: [j.no] });
  const parts = [col('Section', [await section('ข้อมูลงาน'), kv(jobPairs(j).concat([['วันที่ประเมิน', EVAL_AT.slice(0, 10)], ['ผู้ประเมิน', j.caretaker]]))], 16),
    col('Section', [await section('ข้อมูลผู้ใช้รถฯ'), kv(SURVEY_INFO.map((l, x) => [l, surveyInfo(j)[x]]))], 16),
    alertBox('Info', ALERT[0], ALERT[1])];
  let n0 = 0;
  for (const [title, qs, ic] of SURVEY) {
    const items = [], gs = [];
    qs.forEach((q, i) => { gs.push(sc[n0] || 0); items.push(question(i + 1, n0 + 1, q, sc[n0], nts[n0])); n0++; });
    const qcol = col('Questions', items, 24); if (!MOB) qcol.paddingLeft = 64;   // ข้อเยื้องตรงชื่อด้าน (ไอคอน 48 + ช่อง 16)
    parts.push(col('Section', [await groupHead(title, ic, ssum(gs) + '/' + qs.length * 5), qcol], 16));
  }
  parts.push(col('Section', [await section(REMARK_LABEL), area(REMARK_LABEL, o.remark || '', { optional: true, placeholder: 'ระบุหมายเหตุหรือข้อเสนอแนะ' })], 16));
  const n = sc.filter(Boolean).length;
  parts.push(col('Section', [await section('สรุปคะแนน'), kv([['ให้คะแนนแล้ว', n + ' / ' + SURVEY_N + ' ข้อ'], ['คะแนนรวม', ssum(sc) + ' / ' + SURVEY_MAX], ['ค่าเฉลี่ย', n ? savg(sc) + ' จาก 5' : '-'], ['ผลระดับ', 'รอเคาะเกณฑ์']])], 16));
  parts.push(btnRow([['Secondary button', 'ยกเลิก', { size: 'lg' }], ['Primary button', 'บันทึกการประเมิน', { size: 'lg', disabled: n < SURVEY_N }]]));
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ---------- C ดูผล — หน้า Detail ⇒ Section label (R5/R11) · ป้ายประเมินแล้ว · สรุปผล + ตารางต่อด้าน (ข้อ · รายการประเมิน · คะแนน "5 · ดีมาก" · หมายเหตุ) · ไม่มีปุ่มพิมพ์ ไม่มีส่วนแนบ ---------- */
const DETAIL_COLS = [['ข้อ', 80], ['รายการประเมิน', 0], ['คะแนน', 160], ['หมายเหตุ', 280]];
async function resultScreen(name, k, saved) {
  const j = JOBS[k], d = doneOf(k, saved), a = d.answers;
  const { scr, page } = await shell(name, { title: TITLE + ' ' + j.no, back: true, crumbs: [j.no], badge: ['ประเมินแล้ว', 'Success'] });
  const gsum = []; let n0 = 0;
  for (const [title, qs] of SURVEY) { gsum.push([title, ssum(a.slice(n0, n0 + qs.length)) + ' / ' + qs.length * 5]); n0 += qs.length; }
  const parts = [col('Section', [await sectionLabel('ข้อมูลงาน'), kv(jobPairs(j))], 16),
    col('Section', [await sectionLabel('ข้อมูลผู้ใช้รถฯ'), kv(SURVEY_INFO.map((l, x) => [l, surveyInfo(j)[x]]))], 16),
    col('Section', [await sectionLabel('สรุปผลการประเมิน'), kv([['คะแนนรวม', ssum(a) + ' / ' + SURVEY_MAX], ['ค่าเฉลี่ย', savg(a) + ' จาก 5'], ['ผู้ประเมิน', j.caretaker], ['วันที่ประเมิน', d.at]]
      .concat(gsum, [[REMARK_LABEL, d.remark || '-']]))], 16)];
  n0 = 0;
  for (const [gi, [title, qs]] of SURVEY.entries()) {
    const rows = qs.map((q, i) => { const x = n0++; return [String(i + 1), q, a[x] + ' · ' + LEVEL[a[x]], (d.notes && d.notes[x]) || '-']; });
    parts.push(col('Section', [await sectionLabel(title + ' ' + gsum[gi][1]), await tbl(DETAIL_COLS, rows)], 16));
  }
  parts.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }]]));
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ---------- state ราย scenario (R19: 1 scenario = 1 บล็อก · A.1 A.2 = state · state ใหม่ต่อท้าย รหัสเดิมไม่เลื่อน) ---------- */
const KBK = (k) => JOBS[k].provider === 'กบค.';   // rowsFor ของเว็บ: บทบาท กบค. เห็นเฉพาะงานที่ประเมิน กบค.
const KBK_VIEW = { readOnly: true, pending: PENDING.filter(KBK), done: DONE.filter(KBK) };   // ยังไม่ได้ประเมิน MRZ7100004 MTD-691003-014 ORZ6900002 · ประเมินแล้ว MTD-690716-031
const NOT_FOUND_Q = '99-9999';   // คำค้นที่ไม่ตรงงานไหน (เลขที่งาน ทะเบียน งาน หน่วยงานที่ให้บริการ) — ค่าเดียวกับ S24 ค้นหาไม่พบของบำรุงรักษา
const AFTER_SAVE = { tab: 1, pending: ['kbk', 'rp014', 'oh'], done: ['ma1145', 'ma6789', 'rp031', 'ma4458'], saved: { ma6789: SAVED } };   // เรียงวันที่ปิดงาน (82-1145 05/11 ก่อน 82-6789 04/11)
const LIST_STATES = [
  ['แท็บยังไม่ได้ประเมิน — งานที่ปิดแล้ว', () => listScreen('S1 ยังไม่ได้ประเมิน', { tab: 0 })],
  ['แท็บประเมินแล้ว', () => listScreen('S1 ประเมินแล้ว', { tab: 1 })],
  ['ไม่มีรายการที่ต้องประเมิน', () => listScreen('S1 ไม่มีรายการ', { tab: 0, pending: [] })],
  ['กดตัวกรอง — แผงตัวกรอง ประเภทงาน หน่วยงานที่ให้บริการ', async () => { const s = await listScreen('S1 ตัวกรอง', { tab: 0 }); await filterPanel(s, FILTER_FIELDS()); return s; }],   // A.4 ต่อท้าย 12 พ.ย. 2569 รอบ 2 (ตัวกรองของเว็บ)
  /* A.5–A.7 ต่อท้าย 12 พ.ย. 2569 รอบ 3 (ต้นแบบเว็บ ?sample=S27_kbk · EmptyStateSearchNotFound ของ /satisfaction/) */
  ['กบค. — แท็บยังไม่ได้ประเมิน เฉพาะงานที่ประเมิน กบค. ดูอย่างเดียว ไม่มีไอคอนดาว', () => listScreen('S1 กบค. ยังไม่ได้ประเมิน', Object.assign({ tab: 0 }, KBK_VIEW))],
  ['กบค. — แท็บประเมินแล้ว เฉพาะการประเมินที่ประเมิน กบค. ดูผลได้', () => listScreen('S1 กบค. ประเมินแล้ว', Object.assign({ tab: 1 }, KBK_VIEW))],
  ['ค้นหาไม่พบ — ไม่พบข้อมูล ปุ่มล้างตัวกรอง', () => listScreen('S1 ค้นหาไม่พบ', { tab: 0, query: NOT_FOUND_Q, notFound: true })]];
const FORM_STATES = [
  ['ฟอร์มประเมิน (ยังไม่ให้คะแนน) — บำรุงรักษาตามวาระ หน่วยงานที่ให้บริการ กบผ.', () => evalForm('S2 ฟอร์มว่าง', 'ma6789', {})],
  ['ให้คะแนนบางข้อ + กรอกหมายเหตุท้ายฟอร์ม', () => evalForm('S2 กรอกบางข้อ', 'ma6789', { scores: PART, remark: PART_REMARK })],
  ['ให้คะแนนครบ 11 ข้อ + หมายเหตุข้อ 8', () => evalForm('S2 กรอกครบ', 'ma6789', { scores: SAMPLE, notes: SAMPLE_NOTES, remark: SAMPLE_REMARK })],
  ['ยืนยันการประเมิน', async () => { const s = await evalForm('S2 ยืนยัน', 'ma6789', { scores: SAMPLE, notes: SAMPLE_NOTES, remark: SAMPLE_REMARK }); await confirm(s, CONFIRM(JOBS.ma6789, ssum(SAMPLE))); return s; }],
  ['บันทึกไม่สำเร็จ', async () => { const s = await evalForm('S2 บันทึกไม่สำเร็จ', 'ma6789', { scores: SAMPLE, notes: SAMPLE_NOTES, remark: SAMPLE_REMARK }); notify(s, FAIL, true); return s; }],
  ['บันทึกสำเร็จ — ย้ายไปแท็บประเมินแล้ว', async () => { const s = await listScreen('S2 บันทึกสำเร็จ', AFTER_SAVE); notify(s, OK(JOBS.ma6789.no)); return s; }],
  ['ยกเลิกระหว่างกรอก — ยืนยันการออก', async () => { const s = await evalForm('S2 ยืนยันการออก', 'ma6789', { scores: PART, remark: PART_REMARK }); await confirm(s, LEAVE); return s; }],
  ['ฟอร์มประเมินงานซ่อม — หน่วยงานที่ให้บริการ กบค.', () => evalForm('S2 ฟอร์มงานซ่อม', 'rp014', {})],
  ['ฟอร์มประเมิน Overhaul — หน่วยงานที่ให้บริการ กบค.', () => evalForm('S2 ฟอร์ม Overhaul', 'oh', {})]];   // B.9 ต่อท้าย 12 พ.ย. 2569 รอบ 2 (แถว Overhaul ของเว็บ)
const RESULT_STATES = [
  ['ผลประเมิน — บำรุงรักษาตามวาระ หน่วยงานที่ให้บริการ กบผ.', () => resultScreen('S3 ผลบำรุงรักษา กบผ.', 'ma1145')],
  ['ผลประเมิน — บำรุงรักษาตามวาระ หน่วยงานที่ให้บริการ กรย.', () => resultScreen('S3 ผลบำรุงรักษา กรย.', 'ma4458')],
  ['ผลประเมิน — งานซ่อม หน่วยงานที่ให้บริการ กบค.', () => resultScreen('S3 ผลงานซ่อม', 'rp031')],
  ['ผลประเมินที่เพิ่งบันทึก — มีหมายเหตุรายข้อ', () => resultScreen('S3 ผลที่เพิ่งบันทึก', 'ma6789', { ma6789: SAVED })]];   // C.4 ต่อท้าย 12 พ.ย. 2569 รอบ 2
const SCENARIOS = [
  ['S1 · ผู้ดูแลยานพาหนะ ดูรายการประเมินความพึงพอใจ', LIST_STATES],
  ['S2 · ผู้ดูแลยานพาหนะ ประเมินความพึงพอใจการให้บริการ 1 งาน', FORM_STATES],
  ['S3 · ผู้ดูแลยานพาหนะ ดูผลประเมินความพึงพอใจ', RESULT_STATES]];

/* ---------- กลุ่ม = scenario · ตัวอักษรตามลำดับ (A B C) · flowchart กิจกรรมซ้ายของบล็อกจาก Diagram/09-ประเมินความพึงพอใจ/02-…-flowchart-กิจกรรม.md (build.json activity) ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const groupsFor = (idx) => idx.map(i => {
  const [title, screens] = SCENARIOS[i];
  const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens: screens.map(([label, fn]) => [label, fn, '']) }] };
});
const ALL_IDX = SCENARIOS.map((_, i) => i);

/* ---------- สร้าง: ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component — วางบนหน้า "ประเมินความพึงพอใจ" ต่อใต้ของเดิม (ไม่มีก็สร้าง) ---------- */
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
  const { made, flows } = await buildGrid(page, PLUGIN.prefix, GRP, y, TOTAL * devices.length, { devices });
  let instances = 0, loose = 0;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') loose++;
  }
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 4));
  log('');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · flowchart ' + flows + ' ผัง · ' + GRP.length + ' บล็อก ' + what + ' (' + GRP.map(g => g.code).join(' ') + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓') + ' (flowchart เป็นของวาดประกอบนอกจอ ไม่นับ)');
  log('component ที่ใช้ (' + USED.size + '): ' + [...USED].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่ต้องสลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด — ฟอนต์ ' + (FALLBACK_FONT ? FALLBACK_FONT.family + ' ' + FALLBACK_FONT.style : '-'));
  reportOversize();
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
async function buildPick(o) {   // ติ๊กเฉพาะบาง scenario · รหัสตัวอักษรคงเดิม (A–C)
  const idx = (o.pick || []).map(Number).filter(i => i >= 0 && i < SCENARIOS.length);
  if (!idx.length) { log('ยังไม่ได้ติ๊ก scenario — ติ๊กอย่างน้อย 1 รายการแล้วกดอีกครั้ง'); return; }
  await buildSet(groupsFor(idx), 'scenario ที่เลือก', devOf(o));
}

figma.ui.onmessage = async (msg) => {
  try {
    const o = { devices: msg.devices, pick: msg.pick };
    if (msg.type === 'build') await buildSet(groupsFor(ALL_IDX), 'scenario', devOf(o));
    if (msg.type === 'build-desktop') await buildSet(groupsFor(ALL_IDX), 'scenario · desktop', [false]);
    if (msg.type === 'build-mobile') await buildSet(groupsFor(ALL_IDX), 'scenario · mobile', [true]);
    if (msg.type === 'build-pick') await buildPick(o);
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก"
