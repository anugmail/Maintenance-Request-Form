/* ============================================================================
   Maintain-D — แบบประเมินความพึงพอใจ (XCHO) · เรื่องแยก · จอจาก component จริง
   ----------------------------------------------------------------------------
   เจ้าของงาน 12 พ.ย. 2569: "เรื่องการประเมินเป็นเรื่องแยกที่จะไปผูกตาม flow ต่างๆ เลยอยากแยกใว้"
     ⇒ ย้ายแบบประเมินความพึงพอใจออกจากปลั๊กอินบำรุงรักษา (เดิม S27 บล็อก Y · R94) มาเป็นปลั๊กอินแยก · งานซ่อม บำรุงรักษาตามวาระ Overhaul ผูกเข้ามาที่เรื่องนี้
   โครงจอ = เฟรมประเมินผู้รับจ้างของเจ้าของงาน (~/PEA/Maintain-D/userflow/figma-ref/contractor-eval-ABC-2569-11-12.txt บล็อก A B C)
     ยกโค้ดแบบ copy แล้วปรับจาก contractor-eval-plugin/screens.js (listScreen · evalForm · resultScreen) และบล็อก Y เดิมของ maintainance-plugin (satList · satForm · satResult) ไม่ import ข้ามปลั๊กอิน
     ยึดของที่เจ้าของงานเคาะกับประเมินผู้รับจ้างแล้ว (22 ต.ค. 2569): รายการไม่มีช่องค้นหา · ไม่มีหมายเหตุรายข้อ หมายเหตุช่องเดียวท้ายฟอร์ม · ไม่มีส่วนแนบแบบที่ลงนาม · ดาวเริ่มว่าง กดครบทุกข้อแล้วจึงบันทึกได้
   เนื้อหา = แบบสำรวจ "VMS+" ของ กบค. ในระบบจัดการแบบฟอร์ม XCHO (ไฟล์ VMS+ _ Xcho-1…5.pdf) ลอกหัวข้อ คำถาม สเกลตรงตัว
     ข้อมูลผู้ใช้รถฯ 5 ช่อง (ระบบเติมให้) · 4 ด้าน 11 ข้อ ดาว 1–5 (`Rating`) · ด้านละ 10/20/15/10 · รวมเต็ม 55 (ไม่แปลงเป็นร้อย) · ผลระดับ "รอเคาะเกณฑ์"
     ข้อความที่ลอกจากแบบสำรวจคง "ผู้ใช้รถฯ" "ทะเบียนรถ" (allow ของ R105) · ข้อความของเราใช้ "ยานพาหนะ" (R80 ฉบับเรื่องนี้)
   ใครประเมิน (เจ้าของงาน 12 พ.ย. 2569): หน่วยงานของยานพาหนะ (ผู้ดูแลยานพาหนะ) หลังงานปิด · 1 แถว = 1 งานของยานพาหนะ 1 คัน
     ประเมิน "หน่วยงานที่ทำงาน" (หน่วยงานให้บริการ) — ระบบเติมให้ ฟอร์มเดียวกัน:
       งานซ่อม = กบค. · Overhaul = กบค. · บำรุงรักษาตามวาระ แผนที่ กบค. ดำเนินการ = กบค. · แผนของกองอื่น (กบผ. กปส. กรย. กส.1 กส.2) = กองที่ดำเนินการ
   ข้อมูลจำลองตรงกับปลั๊กอินอื่น: บำรุงรักษา MRZ7000001 ของ กบผ. 82-6789 ขอนแก่น (maintainance-plugin JOB_I · ผู้ดูแลยานพาหนะ นายสมชาย แก้วมณี)
     · MRZ6900014 82-1145 ขอนแก่น บำรุงรักษา 18/06/2569 (maintainance-plugin MA_ROWS · หน่วยงานเจ้าของแผน = กบค. ค่าสมมติของเรื่องนี้)
     · งานซ่อม MTD-691003-014 82-1145 ขอนแก่น อู่ ช.เจริญยนต์ ขอนแก่น (contractor-eval-plugin REC.repair)
     · Overhaul ORZ6800001 PO-680101 71-9902 ขอนแก่น ปิดงาน 20/12/2568 (overhaul2-plugin · ผู้ดูแลยานพาหนะคนเดียวกัน ค่าสมมติ)
   ที่มา: component Tabs · Table · Pill outline · Empty state/Data empty · Section header · Section label · Content item row · Alert · Featured icon · Input label · Rating · Text area
     · Primary/Secondary button · Modal · Notification · Mobile table ของไฟล์ (Component) VMS Plus + หน้าประเมินผู้รับจ้าง (เฟรมเจ้าของงาน 12 พ.ย. 2569)
     + หน้า "ประเมินพนักงานขับรถ" ของ VMS+ เดิม (ที่ contractor-eval อ้าง) · ไม่มี component ใหม่
   กติกา: component-rules.md §5.1 (R19) · §5.43 (R105) · plan.md หัวข้อ 🎯
   ============================================================================ */

const PLUGIN = { prefix: 'SAT', page: 'ประเมินความพึงพอใจ', menu: 'ประเมินความพึงพอใจ', searchHint: 'ค้นหาเลขที่งาน, ทะเบียน' };

/* ---------- component ที่ใช้ — ชุดเดียวกับ contractor-eval-plugin (ขาดตัวไหนหยุด) · NESTED = ชิ้นซ้อน · LOCAL_OPTIONAL = ป้ายของทีมออกแบบ ไม่มีก็วาดแถบธรรมดา ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Featured icon',
  'Table pagination', 'Text input', 'Text area', 'Input label', 'Alert', 'Tabs', 'Rating',
  'Primary button', 'Secondary button', 'Background overlay', 'Modal', 'Notification', 'Empty state/Data empty',
  'add-24-300-round', 'filter_list-24-400-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round', 'quick_reference_all-24-300-round',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header'];
const NESTED = ['Nav button', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Tertiary button',
  '_Content item base', 'Badge outline', 'Pill outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Tab item', '_Rating star base',
  'call-24-300-round', 'groups-24-300-round', 'car_repair-24-300-round', 'search_check-24-300-round', 'star-24-300-round'];   // ไอคอนหัวด้าน/ปุ่มดาว — นำเข้าไม่ได้ = Featured icon ใช้ไอคอนตั้งต้น / ปุ่มลูกศร (ทางถอยเดียวกับ contractor-eval)
const LOCAL_OPTIONAL = ['Device Type', 'Component 1', 'Header'];   // ป้าย Device/Desktop/Mobile + แถบรหัส flow (Design Annotations ของ UI Release#2)
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี — ชุดเดียวกับ contractor-eval-plugin (ดัมป์ 19 ต.ค. 2569) · รูปแบบบรรทัดต้องเหมือน KEYS ใน core เพราะ test harness อ่านด้วย regex */
Object.assign(KEYS, {
  "Rating": ["1d3c2e045977bc6b2b407cdd2c82eb43dc00325a", true],
  "_Rating star base": ["51d4e5f5f09b643b0816d27100d99a9bf08432f5", true],
  "car_repair-24-300-round": ["1e59e85c3ba457b3fbc4ea88a7eacba331ca23c7", false],
  "groups-24-300-round": ["16f9e5ce96b0b738a6cc2e87a7500a6898ac28ae", false],
  "call-24-300-round": ["117dd21b39fd7f89391fa783e220ad32b61746e2", false],
  "search_check-24-300-round": ["230bb3b003a72d41a3649ee10760711ec3846d87", false],
  "star-24-300-round": ["ecf8821fb00ba65575f6814101291f6166e00aa6", false]
});

/* ---------- แบบสำรวจ XCHO (ลอกตรงตัวจาก VMS+ _ Xcho-1…5.pdf) ---------- */
const SURVEY_INFO = ['ทะเบียนรถ', 'ชื่อผู้ตอบแบบสอบถาม', 'นามสกุลผู้ตอบแบบสอบถาม', 'ตำแหน่ง ผู้ตอบแบบสอบถาม', 'สังกัด'];
const SURVEY_SCALE = 'โดย 1 คือคะแนนแย่สุด และ 5 คือคะแนนดีสุด';
const SURVEY = [   // [ชื่อด้าน, ข้อ, ไอคอนหัวด้าน]
  ['ด้านระบบการให้บริการ', ['ความรวดเร็วในการรับบริการ', 'ความสะดวกในการติดต่อเพื่อขอรับบริการ'], 'call-24-300-round'],
  ['ด้านเจ้าหน้าที่และ/หรือผู้ให้บริการ', ['อัธยาศัยของผู้ให้บริการ', 'ความรู้ของผู้ให้บริการ', 'การให้ความรู้และคำแนะนำแก่ผู้รับบริการ', 'ความตั้งใจในการดำเนินการให้ผู้รับบริการ'], 'groups-24-300-round'],
  ['ด้านคุณภาพของสินค้าและ/หรือบริการ', ['คุณภาพของอะไหล่และการบริการ', 'ระยะเวลาในการได้รับอะไหล่และการบริการ', 'อุปกรณ์ เครื่องมือและเทคโนโลยีในการให้บริการ'], 'car_repair-24-300-round'],
  ['ด้านสภาพแวดล้อมต่างๆ', ['การทำความสะอาดพื้นที่หลังการให้บริการ', 'การทำความสะอาดเครื่องจักรกลหลังการให้บริการ'], 'search_check-24-300-round']];
const SURVEY_N = SURVEY.reduce((n, g) => n + g[1].length, 0);   // 11
const SURVEY_MAX = SURVEY_N * 5;   // 55
const TITLE = 'ประเมินความพึงพอใจ';
const ssum = (a) => a.reduce((t, x) => t + (x || 0), 0);
const savg = (a) => { const n = a.filter(Boolean).length; return n ? (ssum(a) / n).toFixed(2) : '-'; };

/* ---------- ข้อมูลจำลอง ----------
   ผู้ประเมิน = ผู้ดูแลยานพาหนะ นายสมชาย แก้วมณี (ดูแล 82-6789 และ 82-1145 ตามปลั๊กอินบำรุงรักษา CTRL_NAME · 71-9902 ค่าสมมติ) · ตำแหน่ง ชก.7 (ค่าสมมติ ตรงเว็บ)
   1 แถว = 1 งานของยานพาหนะ 1 คัน · type = ประเภทงาน · unit = หน่วยงานให้บริการ (ระบบเติมจากผู้ดำเนินการงาน) · job = กล่องข้อมูลงานตามประเภท (R105 displayLabels) */
const CARETAKER = ['นายสมชาย', 'แก้วมณี'], CARETAKER_POS = 'ชก.7';
const JOB_TYPE = { pm: ['บำรุงรักษาตามวาระ', 'Success'], repair: ['งานซ่อม', 'Info'], oh: ['Overhaul', 'Brand'] };   // สีป้ายชุดเดียวกับประเมินผู้รับจ้าง
const JOBS = {
  pm: { type: 'pm', no: 'MRZ7000001', plate: '82-6789 ขอนแก่น', model: 'Isuzu FTR + กระเช้า Aichi SK17A', owner: 'กฟฉ.1 ขอนแก่น', unit: 'กบผ.', closed: '04/11/2569',
    job: [['ประเภทงาน', 'บำรุงรักษาตามวาระ'], ['เลขที่ MR', 'MRZ7000001'], ['ชื่อแผน', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 และภาค 2 ปีงบประมาณ 2570'], ['แผนเดินทาง', 'ตรวจยานพาหนะ ขอนแก่น อุดรธานี ลำปาง'],
      ['ทะเบียน', '82-6789 ขอนแก่น'], ['ยี่ห้อ/รุ่น', 'Isuzu FTR + กระเช้า Aichi SK17A'], ['หน่วยงานให้บริการ', 'กบผ.'], ['ผู้ดำเนินการ', 'นายวิชัย ทองดี (กบผ.)'],
      ['วันดำเนินการ', '04/11/2569'], ['รับทราบเมื่อ', '06/11/2569 10:05 น.']] },
  repair: { type: 'repair', no: 'MTD-691003-014', plate: '82-1145 ขอนแก่น', model: 'Hino FC + กระเช้า Tadano AT-100', owner: 'กฟฉ.1 ขอนแก่น', unit: 'กบค.', closed: '15/10/2569',
    job: [['ประเภทงาน', 'งานซ่อม'], ['เลขที่ใบแจ้งซ่อม', 'MTD-691003-014'], ['หมายเลขงานซ่อม', 'RAM000245'], ['ทะเบียน', '82-1145 ขอนแก่น'], ['ยี่ห้อ/รุ่น', 'Hino FC + กระเช้า Tadano AT-100'],
      ['หน่วยงานให้บริการ', 'กบค.'], ['ผู้รับจ้าง', 'อู่ ช.เจริญยนต์ ขอนแก่น'], ['วันที่ / เวลาที่ซ่อมเสร็จ', '15/10/2569  16:30']] },
  pmKbk: { type: 'pm', no: 'MRZ6900014', plate: '82-1145 ขอนแก่น', model: 'Hino FC + กระเช้า Tadano AT-100', owner: 'กฟฉ.1 ขอนแก่น', unit: 'กบค.', closed: '18/06/2569',
    job: [['ประเภทงาน', 'บำรุงรักษาตามวาระ'], ['เลขที่ MR', 'MRZ6900014'], ['ชื่อแผน', 'บำรุงรักษายานพาหนะ กบค. ปีงบประมาณ 2569'], ['แผนเดินทาง', 'ตรวจยานพาหนะ ขอนแก่น อุดรธานี'],
      ['ทะเบียน', '82-1145 ขอนแก่น'], ['ยี่ห้อ/รุ่น', 'Hino FC + กระเช้า Tadano AT-100'], ['หน่วยงานให้บริการ', 'กบค.'], ['ผู้ดำเนินการ', 'นางสาวกนกวรรณ ใจมั่น (กบค.)'],
      ['วันดำเนินการ', '18/06/2569'], ['รับทราบเมื่อ', '19/06/2569 14:20 น.']] },
  oh: { type: 'oh', no: 'ORZ6800001', plate: '71-9902 ขอนแก่น', model: 'MITSUBISHI FN', owner: 'กฟฉ.1 ขอนแก่น', unit: 'กบค.', closed: '20/12/2568',
    job: [['ประเภทงาน', 'Overhaul'], ['หมายเลขแผน', 'ORZ6800001'], ['ใบสั่งจ้างเลขที่', 'PO-680101'], ['ทะเบียน', '71-9902 ขอนแก่น'], ['ยี่ห้อ/รุ่น', 'MITSUBISHI FN'],
      ['หน่วยงานให้บริการ', 'กบค.'], ['ผู้รับจ้าง', 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด'], ['วันที่ปิดงาน', '20/12/2568']] }};
const SAMPLE = [5, 4, 4, 5, 4, 4, 4, 3, 4, 5, 4];   // ครบ 11 ข้อ = 46 (ตรงบล็อก Y เดิม + เว็บ lib/mock/survey.ts)
const PART = SAMPLE.slice(0, 6);                    // 2 ด้านแรก 6 ข้อ = 26
const SCORES = { pmKbk: [4, 4, 5, 4, 4, 5, 4, 4, 4, 4, 5], oh: [5, 5, 4, 5, 4, 5, 4, 4, 5, 4, 5] };   // ประเมินไปก่อนแล้ว = 47 · 50
const REMARK = ['ช่างมาตรงเวลา', 'ช่างมาตรงเวลา อธิบายงานที่ทำก่อนส่งคืนยานพาหนะ'];
const DONE_INFO = { pm: ['07/11/2569', '07/11/2569 09:30 น.', REMARK[1]], pmKbk: ['20/06/2569', '20/06/2569 08:45 น.', 'ส่งคืนยานพาหนะตรงวันที่นัด'], oh: ['08/01/2569', '08/01/2569 13:10 น.', '-'] };
const PENDING = ['pm', 'repair'];   // ยังไม่ได้ประเมิน: บำรุงรักษาของ กบผ. + งานซ่อม (กบค.)
const DONE = ['pmKbk', 'oh'];        // ประเมินแล้ว: บำรุงรักษาของ กบค. + Overhaul (กบค.)
const scoreOf = (k) => SCORES[k] || SAMPLE;
const surveyInfo = (j) => [j.plate, CARETAKER[0], CARETAKER[1], CARETAKER_POS, j.owner];
const jobKey = (j) => j.no + ' · ' + j.plate;

/* ---------- A รายการ — Tabs ยังไม่ได้ประเมิน (จำนวน) / ประเมินแล้ว · ไม่มีช่องค้นหา (ประเมินผู้รับจ้าง 22 ต.ค. 2569) · คอลัมน์แรก # ---------- */
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
const PEND_COLS = [['#', 64], ['ประเภทงาน', 180, 'Badge'], ['เลขที่งาน', 180, 'Lead text'], ['ทะเบียน', 0], ['หน่วยงานให้บริการ', 180], ['วันที่ปิดงาน', 150], ['ดำเนินการ', 104]];
const pendRow = (k, i) => { const j = JOBS[k]; return [String(i + 1), { pill: JOB_TYPE[j.type] }, j.no, { text: j.plate, sub: j.model }, j.unit, j.closed,
  { icons: [has('star-24-300-round') ? 'star-24-300-round' : 'keyboard_arrow_right-20-400-round'] }]; };
const DONE_COLS = [['#', 64], ['ประเภทงาน', 180, 'Badge'], ['เลขที่งาน', 160, 'Lead text'], ['ทะเบียน', 0], ['หน่วยงานให้บริการ', 160], ['วันที่ประเมิน', 140], ['คะแนน (เต็ม ' + SURVEY_MAX + ')', 200], ['', 60]];
const doneRow = (k, i) => { const j = JOBS[k], a = scoreOf(k); return [String(i + 1), { pill: JOB_TYPE[j.type] }, j.no, { text: j.plate, sub: j.model }, j.unit, DONE_INFO[k][0],
  ssum(a) + ' / ' + SURVEY_MAX + ' · เฉลี่ย ' + savg(a), { icons: ['quick_reference_all-24-300-round'] }]; };
async function listScreen(name, o) {
  o = o || {};
  const pend = o.pending || PENDING, done = o.done || DONE;
  const { scr, page } = await shell(name, { title: TITLE });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs([['ยังไม่ได้ประเมิน', pend.length], ['ประเมินแล้ว', null]], o.tab || 0), 'h');
  const rows = o.tab ? done : pend;
  if (!rows.length) {   // ไม่มีรายการ — Empty state + ปุ่มไปแท็บประเมินแล้ว (แบบประเมินผู้รับจ้าง A.3)
    const es = inst('Empty state/Data empty'); add(sec, es, 'h');
    await text(es, 'Text', 'ไม่มีรายการที่ต้องประเมิน');
    await text(es, 'Supporting text', 'งานซ่อม บำรุงรักษาตามวาระ และ Overhaul ของยานพาหนะที่ท่านดูแลจะเข้ามาที่นี่เมื่อปิดงานแล้ว');
    const pb = find(es, 'Primary button'); if (pb) pb.visible = false;
    const sb = find(es, 'Secondary button'); if (sb) setProps(sb, { Text: 'ดูรายการที่ประเมินแล้ว', 'Leading icon': false, 'Trailing icon': false });
    return scr;
  }
  add(sec, await tbl(o.tab ? DONE_COLS : PEND_COLS, rows.map((k, i) => (o.tab ? doneRow : pendRow)(k, i)), { pagination: rows.length }), 'h');
  return scr;
}

/* ---------- B ฟอร์ม — หน้า Create ⇒ Section header (R3) · ข้อมูลงาน (ตามประเภทงาน) · ข้อมูลผู้ใช้รถฯ · Alert สเกล · 4 ด้าน · หมายเหตุ · สรุปคะแนน · ปุ่ม ---------- */
function question(no, q, score) {   // Input label (ข้อความตัวหนา ไม่มี "(ถ้ามี)" = บังคับ ตามเครื่องหมาย * ของแบบสำรวจ) → ห่าง 12 → Rating ดาว 5 ดวง (เริ่มว่าง Point=0)
  const lb = inst('Input label', {}, { 'Label text': no + '. ' + q, Optional: false, 'Info icon': false });
  const rt = inst('Rating', { Point: String(score || 0) }); rt.name = 'Rating';
  return col('Item', [lb, rt], 12);
}
async function groupHead(title, ic, badge) {   // Featured icon สีหลัก + Section header (ชื่อด้าน + Badge คะแนนด้าน) — หัวหมวดของประเมินผู้รับจ้าง
  const fi = inst('Featured icon', { Color: 'Brand', Size: 'md' });
  if (has(ic)) setProps(fi, { 'Icon swap': icon(ic) });
  const sh = await section(title, { badge });
  const r = row('Group', [fi, sh], { hug: true, gap: 16, align: 'CENTER', keep: true });
  sh.layoutGrow = 1;
  return r;
}
async function evalForm(name, k, o) {
  o = o || {};
  const sc = o.scores || [], j = JOBS[k];
  const { scr, page } = await shell(name, { title: TITLE + ' ' + jobKey(j), back: true, crumbs: [j.plate] });
  const parts = [col('Section', [await section('ข้อมูลงาน'), kv(j.job)], 16),
    col('Section', [await section('ข้อมูลผู้ใช้รถฯ'), kv(SURVEY_INFO.map((l, x) => [l, surveyInfo(j)[x]]))], 16),
    alertBox('Info', 'ให้คะแนนการให้บริการของ ' + j.unit + ' ทุกข้อ 1 ถึง 5 ดาว', SURVEY_SCALE + ' · คะแนนรวมเต็ม ' + SURVEY_MAX + ' (' + SURVEY_N + ' ข้อ × 5) · หมายเหตุไม่บังคับ')];
  let n0 = 0;
  for (const [title, qs, ic] of SURVEY) {
    const items = [], gs = [];
    qs.forEach((q, i) => { gs.push(sc[n0] || 0); items.push(question(i + 1, q, sc[n0])); n0++; });
    const qcol = col('Questions', items, 24); if (!MOB) qcol.paddingLeft = 64;   // ข้อเยื้องตรงชื่อด้าน (ไอคอน 48 + ช่อง 16)
    parts.push(col('Section', [await groupHead(title, ic, ssum(gs) + '/' + qs.length * 5), qcol], 16));
  }
  parts.push(col('Section', [await section('หมายเหตุ/ข้อเสนอแนะเพิ่มเติม'), area('หมายเหตุ/ข้อเสนอแนะเพิ่มเติม', o.remark || '', { optional: true, placeholder: 'ระบุหมายเหตุหรือข้อเสนอแนะ' })], 16));
  const n = sc.filter(Boolean).length;
  parts.push(col('Section', [await section('สรุปคะแนน'), kv([['ให้คะแนนแล้ว', n + ' / ' + SURVEY_N + ' ข้อ'], ['คะแนนรวม', ssum(sc) + ' / ' + SURVEY_MAX], ['ค่าเฉลี่ย', n ? savg(sc) + ' จาก 5' : '-'], ['ผลระดับ', 'รอเคาะเกณฑ์']])], 16));
  parts.push(btnRow([['Secondary button', 'ยกเลิก', { size: 'lg' }], ['Primary button', 'บันทึกการประเมิน', { size: 'lg', disabled: n < SURVEY_N }]]));
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ---------- C ดูผล — หน้า Detail ⇒ Section label (R5/R11) · ป้ายประเมินแล้ว · สรุปผล + ตารางต่อด้าน (ข้อ · รายการประเมิน · คะแนน) · ไม่มีปุ่มพิมพ์ ไม่มีส่วนแนบ ---------- */
const DETAIL_COLS = [['ข้อ', 80], ['รายการประเมิน', 0], ['คะแนน', 160]];
async function resultScreen(name, k) {
  const j = JOBS[k], a = scoreOf(k), d = DONE_INFO[k];
  const { scr, page } = await shell(name, { title: 'ผล' + TITLE + ' ' + jobKey(j), back: true, crumbs: [j.plate], badge: ['ประเมินแล้ว', 'Success'] });
  const gsum = []; let n0 = 0;
  for (const [title, qs] of SURVEY) { gsum.push([title, ssum(a.slice(n0, n0 + qs.length)) + ' / ' + qs.length * 5]); n0 += qs.length; }
  const parts = [col('Section', [await sectionLabel('ข้อมูลงาน'), kv(j.job)], 16),
    col('Section', [await sectionLabel('ข้อมูลผู้ใช้รถฯ'), kv(SURVEY_INFO.map((l, x) => [l, surveyInfo(j)[x]]))], 16),
    col('Section', [await sectionLabel('สรุปผลการประเมิน'), kv([['คะแนนรวม', ssum(a) + ' / ' + SURVEY_MAX], ['ค่าเฉลี่ย', savg(a) + ' จาก 5'], ['ผู้ประเมิน', CARETAKER.join(' ')], ['วันที่ประเมิน', d[1]]]
      .concat(gsum, [['หมายเหตุ/ข้อเสนอแนะเพิ่มเติม', d[2]]]))], 16)];
  n0 = 0;
  for (const [gi, [title, qs]] of SURVEY.entries()) {
    const rows = qs.map((q, i) => { n0++; return [String(i + 1), q, String(a[n0 - 1])]; });
    parts.push(col('Section', [await sectionLabel(title + ' ' + gsum[gi][1]), await tbl(DETAIL_COLS, rows)], 16));
  }
  parts.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }]]));
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ---------- state ราย scenario (R19: 1 scenario = 1 บล็อก · A.1 A.2 = state) ---------- */
const CONFIRM = (k) => { const j = JOBS[k]; return { title: 'ยืนยันการประเมิน', sub: 'คุณต้องการบันทึกการประเมินความพึงพอใจการให้บริการของ ' + j.unit + ' (' + jobKey(j) + ') ใช่หรือไม่? คะแนนรวม ' + ssum(SAMPLE) + ' / ' + SURVEY_MAX + ' · บันทึกแล้วแก้ไขไม่ได้', ok: 'ยืนยัน' }; };
const LIST_STATES = [
  ['แท็บยังไม่ได้ประเมิน — งานที่ปิดแล้ว', () => listScreen('S1 ยังไม่ได้ประเมิน', { tab: 0 })],
  ['แท็บประเมินแล้ว', () => listScreen('S1 ประเมินแล้ว', { tab: 1 })],
  ['ไม่มีรายการที่ต้องประเมิน', () => listScreen('S1 ไม่มีรายการ', { tab: 0, pending: [] })]];
const FORM_STATES = [
  ['ฟอร์มประเมิน (ยังไม่ให้คะแนน) — บำรุงรักษาตามวาระ หน่วยงานให้บริการ กบผ.', () => evalForm('S2 ฟอร์มว่าง', 'pm', {})],
  ['ให้คะแนนบางข้อ + กรอกหมายเหตุท้ายฟอร์ม', () => evalForm('S2 กรอกบางข้อ', 'pm', { scores: PART, remark: REMARK[0] })],
  ['ให้คะแนนครบ 11 ข้อ', () => evalForm('S2 กรอกครบ', 'pm', { scores: SAMPLE, remark: REMARK[1] })],
  ['ยืนยันการประเมิน', async () => { const s = await evalForm('S2 ยืนยัน', 'pm', { scores: SAMPLE, remark: REMARK[1] }); await confirm(s, CONFIRM('pm')); return s; }],
  ['บันทึกไม่สำเร็จ', async () => { const s = await evalForm('S2 บันทึกไม่สำเร็จ', 'pm', { scores: SAMPLE, remark: REMARK[1] }); notify(s, 'บันทึกการประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', true); return s; }],
  ['บันทึกสำเร็จ — ย้ายไปแท็บประเมินแล้ว', async () => { const s = await listScreen('S2 บันทึกสำเร็จ', { tab: 1, pending: ['repair'], done: ['pm'].concat(DONE) }); notify(s, 'ประเมินความพึงพอใจสำเร็จ (' + jobKey(JOBS.pm) + ')'); return s; }],
  ['ยกเลิกระหว่างกรอก — ยืนยันการออก', async () => { const s = await evalForm('S2 ยืนยันการออก', 'pm', { scores: PART, remark: REMARK[0] }); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' }); return s; }],
  ['ฟอร์มประเมินงานซ่อม — หน่วยงานให้บริการ กบค.', () => evalForm('S2 ฟอร์มงานซ่อม', 'repair', {})]];
const RESULT_STATES = [
  ['ผลประเมิน — บำรุงรักษาตามวาระ หน่วยงานให้บริการ กบผ.', () => resultScreen('S3 ผลบำรุงรักษา กบผ.', 'pm')],
  ['ผลประเมิน — บำรุงรักษาตามวาระ หน่วยงานให้บริการ กบค.', () => resultScreen('S3 ผลบำรุงรักษา กบค.', 'pmKbk')],
  ['ผลประเมิน — Overhaul หน่วยงานให้บริการ กบค.', () => resultScreen('S3 ผล Overhaul', 'oh')]];
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
