// skeleton-data.js — ข้อมูลโครงตั้งต้นของหน้า plan-skeleton (11 หน้าจอทั้งโฟลว์)
//
// แยกออกจาก plan-skeleton.js เพราะงานที่ทำบ่อยที่สุดคือ "แก้โครงตามที่เจ้าของงานสั่ง"
// ซึ่งแตะแค่ไฟล์นี้ ไม่ต้องอ่าน logic การ render เลย
//
// กติกา — โครงที่นี่ = สิ่งที่ตกลงไว้ (สัญญา) · หน้าจริง = สิ่งที่ทำแล้ว (สถานะ)
//   src ว่าง       ⇒ ยังไม่มีข้อมูลในระบบ = requirement ใหม่ที่ต้องไปขอ API
//   done: false   ⇒ ตกลงกันไว้แล้วแต่หน้าจริงยังไม่ได้ทำ
//   real: null    ⇒ ทั้งหน้าจอยังไม่ได้ทำ (แถบนำทางขึ้น ⬜ แทน ✅)
//
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้ · plan-skeleton.js โหลดต่อจากนี้

// ---------- ตัวอย่างข้อมูลจริง ----------
// src ของฟิลด์ต้องเป็น key ใน SAMPLE ถ้าไม่มี = ยังไม่มีข้อมูลในระบบ
let master, plan, sampleV, sampleL, planLines;

function buildSample() {
  master = MYD.loadMaster();
  plan = MYD.loadPlans()[0] || MYD.SEED_PLAN;
  const r = MYD.planLines(plan, master);
  planLines = r.lines;
  sampleV = r.vehicles[0] || master.vehicles[0];
  sampleL = planLines[0];
}

const baht = n => Number(n).toLocaleString('th-TH') + ' บาท';
const tp = () => (plan.trips || [])[0];   // ใบแรกของแผนเดินทาง · ยังไม่มีใบ → คืน undefined ⇒ ขึ้น "รอข้อมูล"

const PHASE_TH = {
  procurement: 'เฟส 1 · เบิก/จัดหา + แผนเดินทาง',
  maintenance: 'เฟส 2 · ดำเนินการบำรุงรักษา',
  inspection:  'เฟส 3 · ตรวจรับ',
  report:      'เฟส 4 · จัดทำรายงาน',
  cost:        'เฟส 5 · คำนวณต้นทุน',
};

const SAMPLE = {
  // ----- แผน -----
  'p.workNumber':  () => plan.workNumber || '(ยังไม่ออกเลข)',
  'p.planName':    () => plan.planName,
  'p.period':      () => quarterYearText(plan),
  'p.vehCount':    () => (plan.selectedVehicleIds || []).length + ' คัน',
  'p.lineCount':   () => planLines.length + ' รายการ',
  'p.ack':         () => plan.suppliesAckAt ? 'รับทราบแล้ว' : 'รอรับทราบ',
  'p.ackAt':       () => plan.suppliesAckAt,
  'p.partsReq':    () => plan.partsRequisitioned ? 'เบิกแล้ว' : 'ยังไม่เบิก',
  'p.phase':       () => PHASE_TH[plan.phase] || plan.phase,
  // ----- แผนเดินทาง -----
  't.name':        () => tp() && tp().name,
  't.name': 'แผนเดินทาง · ชื่อแผน', 't.window': 'แผนเดินทาง · ช่วงที่เสนอ', 't.location':    () => tp() && tp().location,
  't.window':      () => tp() && `${dateTh(tp().windowFrom)} – ${dateTh(tp().windowTo)}`,
  't.dateFrom':    () => tp() && dateTh(tp().windowFrom),
  't.dateTo':      () => tp() && dateTh(tp().windowTo),
  't.perDiem':     () => tp() && baht(tp().perDiem),
  't.lodging':     () => tp() && baht(tp().lodging),
  't.travel':      () => tp() && baht(tp().travel),
  // ----- รถ -----
  'v.plate':       () => sampleV.plate,
  'v.vehicleType': () => sampleV.vehicleType,
  'v.brand':       () => sampleV.brand,
  'v.chassis':     () => sampleV.chassis,
  'v.status':      () => MYD.STATUS_LABELS[sampleV.status] || sampleV.status,
  'v.province':    () => sampleV.province,
  'v.blockReason': () => MYD.blockReason(sampleV) || '— เลือกเข้าแผนได้ —',
  'v.ownerDept':   () => sampleV.ownerDept,
  'v.region':      () => 'เขต ' + sampleV.region,
  'v.zone':        () => MYD.ZONE_LABELS[MYD.regionZone(sampleV.region)],
  'v.mileage':     () => sampleV.mileage.toLocaleString('th-TH') + ' กม.',
  'v.engineHours': () => sampleV.engineHours.toLocaleString('th-TH') + ' ชม.',
  // ----- อะไหล่ -----
  'i.name':        () => sampleL && sampleL.item.name,
  'i.trigger':     () => sampleL && MYD.triggerText(sampleL.item),
  'i.perVehicle':  () => sampleL && sampleL.perVehicle,
  'i.vehicleCount':() => sampleL && sampleL.vehicleCount,
  'i.totalQty':    () => sampleL && sampleL.totalQty,
  'i.unit':        () => sampleL && sampleL.item.unit,
  'i.category':    () => sampleL && MYD.CATEGORY_LABELS[sampleL.item.category],
};

const SRC_LABELS = {
  '': '— ยังไม่มีข้อมูลในระบบ —',
  'p.workNumber': 'แผน · เลขงาน', 'p.planName': 'แผน · ชื่อแผน', 'p.period': 'แผน · ไตรมาส/ปี',
  'p.vehCount': 'แผน · จำนวนรถ', 'p.lineCount': 'แผน · จำนวนรายการอะไหล่', 'p.ack': 'แผน · สถานะพัสดุ',
  'p.ackAt': 'แผน · พัสดุรับทราบเมื่อ', 'p.partsReq': 'แผน · สถานะเบิกอะไหล่', 'p.phase': 'แผน · เฟสปัจจุบัน',
  't.name': 'แผนเดินทาง · ชื่อแผน', 't.window': 'แผนเดินทาง · ช่วงที่เสนอ',
  't.location': 'แผนเดินทาง · สถานที่บำรุงรักษา', 't.dateFrom': 'แผนเดินทาง · วันเริ่ม',
  't.dateTo': 'แผนเดินทาง · วันสิ้นสุด', 't.perDiem': 'แผนเดินทาง · เบี้ยเลี้ยง',
  't.lodging': 'แผนเดินทาง · ที่พัก', 't.travel': 'แผนเดินทาง · ค่าเดินทาง',
  'v.plate': 'รถ · ทะเบียน', 'v.vehicleType': 'รถ · ชนิดรถ', 'v.brand': 'รถ · ยี่ห้อ/รุ่นอุปกรณ์',
  'v.chassis': 'รถ · ยี่ห้อรถบรรทุก', 'v.status': 'รถ · สถานะ', 'v.region': 'รถ · เขต', 'v.zone': 'รถ · ภาค', 'v.ownerDept': 'รถ · หน่วยงานเจ้าของรถ',
  'v.province': 'รถ · จังหวัด', 'v.blockReason': 'รถ · เหตุผลที่เลือกเข้าแผนไม่ได้',
  'v.mileage': 'รถ · เลขไมล์', 'v.engineHours': 'รถ · ชม.เครื่อง',
  'i.name': 'อะไหล่ · ชื่อ', 'i.trigger': 'อะไหล่ · เงื่อนไขรอบ', 'i.perVehicle': 'อะไหล่ · ต่อคัน',
  'i.vehicleCount': 'อะไหล่ · จำนวนรถ', 'i.totalQty': 'อะไหล่ · รวม', 'i.unit': 'อะไหล่ · หน่วย',
  'i.category': 'อะไหล่ · หมวด',
};

// ---------- โครงตั้งต้น ----------
const f  = (key, label, src) => ({ key, label, src, show: true, note: '', done: true });   // ทำในหน้าจริงแล้ว
const nf = (key, label, src) => ({ key, label, src, show: true, note: '', done: false });  // ตกลงไว้ ยังไม่ได้ทำ
const q  = (id, text) => ({ id, q: text, ans: '', status: 'open' });

const GROUP_LABELS = {
  issue: 'ออกเลขงาน',
  phase: '5 เฟสปฏิบัติการ',
  unit:  'หน้าหน่วยงานอื่น',
};

const DEFAULT_SKEL = {
  version: 2,
  screens: [

    // ================= กลุ่ม 1 · ออกเลขงาน =================
    { id: 's1', group: 'issue', no: '1', title: 'ไตรมาส + ชื่อแผน + เลือกรถ', real: 'plan-new.html', asks: [], sections: [
      { id: 's1-head', title: 'หัวแผน', kind: 'form', fields: [
        f('quarter',  'ไตรมาสของแผน', 'p.period'),
        f('planName', 'ชื่อแผน', 'p.planName'),
      ]},
      { id: 's1-veh', title: 'ตารางรถในเขต (ภาค → เขต → กางออก)', kind: 'table', fields: [
        f('chk',      'ช่องเลือก (ปิดเมื่อสถานะไม่พร้อม)', ''),
        f('plate',    'ทะเบียน', 'v.plate'),
        f('type',     'ประเภท', 'v.vehicleType'),
        f('brand',    'ยี่ห้อ/รุ่นอุปกรณ์', 'v.brand'),
        f('province', 'จังหวัด', 'v.province'),
        f('owner',    'หน่วยงานเจ้าของรถ', 'v.ownerDept'),
        f('status',   'สถานะรถ (6 แบบ)', 'v.status'),
        f('reason',   'เหตุผลที่เลือกไม่ได้', 'v.blockReason'),
      ]},
    ]},

    { id: 's3', group: 'issue', no: '2', title: 'สรุปแผน + ออกเลขงาน', real: 'plan-new.html', asks: [], sections: [
      { id: 's3-sum', title: 'กล่องสรุปหัวหน้า', kind: 'form', fields: [
        f('planName', 'ชื่อแผน', 'p.planName'),
        f('period',   'ช่วงเวลา', 'p.period'),
        f('nveh',     'รถเข้าแผนบำรุงรักษา', 'p.vehCount'),
        f('nline',    'รายการอะไหล่ที่ต้องใช้', 'p.lineCount'),
      ]},
      { id: 's3-zone', title: 'ตารางรถแยกตามภาค', kind: 'table', fields: [
        f('zone',  'ภาค', 'v.zone'),
        f('regs',  'เขตที่มีรถเข้าแผน', 'v.region'),
        f('n',     'จำนวนรถ', 'p.vehCount'),
      ]},
      { id: 's3-brand', title: 'ตารางรถแยกตามยี่ห้อ/รุ่นอุปกรณ์', kind: 'table', fields: [
        f('brand',   'ยี่ห้อ/รุ่นอุปกรณ์', 'v.brand'),
        f('chassis', 'ยี่ห้อรถบรรทุก', 'v.chassis'),
        f('type',    'ชนิดรถ', 'v.vehicleType'),
        f('n',       'จำนวนรถ', 'p.vehCount'),
      ]},
      { id: 's3-items', title: 'ตารางอะไหล่ที่ต้องใช้ทั้งปี', kind: 'table', fields: [
        f('name',  'ชื่อ', 'i.name'),
        f('per',   'ต่อคัน', 'i.perVehicle'),
        f('nveh',  'จำนวนรถ', 'i.vehicleCount'),
        f('total', 'รวม', 'i.totalQty'),
        f('unit',  'หน่วย', 'i.unit'),
      ]},
    ]},

    // ================= กลุ่ม 2 · 5 เฟสปฏิบัติการ =================
    // เฟส 1 แตกเป็น 2 หน้าจอ (ยืนยันรถ / แผนเดินทาง) — stepper ของหน้าจริงยังเป็น 5 เฟสเหมือนเดิม
    { id: 'ph1a', group: 'phase', no: '1a', title: 'ยืนยันรถเข้าร่วมแผน', real: 'index.html', sections: [
      { id: 'ph1a-sum', title: 'สรุปการยืนยัน', kind: 'form', fields: [
        nf('wn',      'เลขงาน', 'p.workNumber'),
        nf('nveh',    'รถในแผน', 'p.vehCount'),
        nf('nok',     'ยืนยันแล้ว', ''),
        nf('nwait',   'รอตอบ', ''),
        nf('nno',     'ไม่พร้อม', ''),
        nf('due',     'กำหนดตอบภายใน', ''),
      ]},
      { id: 'ph1a-tbl', title: 'ตารางรถรายคัน', kind: 'table', fields: [
        nf('plate',   'ทะเบียน', 'v.plate'),
        nf('brand',   'ยี่ห้อ/รุ่นอุปกรณ์', 'v.brand'),
        nf('region',  'เขต', 'v.region'),
        nf('owner',   'หน่วยงานเจ้าของรถ', ''),
        nf('ansOwn',  'คำตอบเจ้าของรถ', ''),
        nf('ansKry',  'คำตอบ กรย.', ''),
        nf('reason',  'เหตุผลที่ไม่พร้อม', ''),
        nf('at',      'ตอบเมื่อ', ''),
        nf('verdict', 'คำตัดสิน กบค.', ''),
      ]},
      { id: 'ph1a-dec', title: 'การตัดสินของ กบค.', kind: 'form', fields: [
        nf('list',    'คันที่ไม่พร้อม', ''),
        nf('drop',    'ตัดออกจากแผน', ''),
        nf('defer',   'เลื่อนไปรอบหน้า', ''),
        nf('keep',    'ยืนยันเข้าตามเดิม', ''),
        nf('why',     'เหตุผลการตัดสิน', ''),
      ]},
    ], asks: [
      q('1a.1', 'ใครในหน่วยงานเจ้าของรถมีสิทธิ์กดตอบ (ตอนนี้พิมพ์ชื่อผู้ตอบเอง ยังไม่ผูก role)'),
      q('1a.2', 'กำหนดตอบกี่วันของจริง (ตั้ง 7 วันไว้ก่อน แก้ได้ที่ Admin)'),
      q('1a.3', 'คันที่ กบค. สั่ง "เลื่อนรอบหน้า" ต้องไปโผล่ในแผนปีถัดไปอัตโนมัติไหม'),
      q('1a.4', '"หน่วยงานเจ้าของรถ" ของจริงดึงจากไหน — ตอนนี้ยกจาก hierarchy-data.json ต้อง join กับ mas_department'),
    ]},

    { id: 'ph1b', group: 'phase', no: '1b', title: 'เบิก/จัดหาอะไหล่ + แผนเดินทาง (หลายใบ)', real: 'index.html', sections: [
      { id: 'ph1b-req', title: 'เบิก/จัดหาอะไหล่ (ขั้นที่ 2)', kind: 'form', fields: [
        f('status', 'สถานะการเบิก', 'p.partsReq'),
        f('nline',  'จำนวนรายการที่เบิก', 'p.lineCount'),
        f('base',   'คิดจากรถที่ยืนยันแล้วกี่คัน', ''),
        f('drop',   'ตัด/เลื่อนจากขั้นยืนยันรถกี่คัน', ''),
      ]},
      { id: 'ph1b-trips', title: 'แผนเดินทาง — สร้างได้หลายใบ (ขั้นที่ 3)', kind: 'table', fields: [
        f('name',    'ชื่อแผน', 't.name'),
        f('loc',     'สถานที่บำรุงรักษา', 't.location'),
        f('window',  'ช่วงที่เสนอ (จาก–ถึง)', 't.window'),
        f('nveh',    'รถในใบนี้', ''),
        f('ndept',   'หน่วยงานที่ต้องตอบรับ', ''),
        f('cost',    'ค่าใช้จ่ายของใบ', ''),
        f('status',  'สถานะใบ (ยังไม่ส่ง/รอตอบรับ/ถูกปฏิเสธ/ตอบรับแล้ว)', ''),
      ]},
      { id: 'ph1b-veh', title: 'รถในแต่ละใบ + วันนัดรายคัน', kind: 'table', fields: [
        f('plate',   'ทะเบียน', 'v.plate'),
        f('owner',   'หน่วยงานเจ้าของรถ', 'v.ownerDept'),
        f('prov',    'จังหวัด', ''),
        f('day',     'วันนัดรายคัน (ต้องอยู่ในช่วงของใบ)', ''),
      ]},
      { id: 'ph1b-reply', title: 'การตอบรับรายหน่วยงาน', kind: 'table', fields: [
        f('dept',   'หน่วยงาน', 'v.ownerDept'),
        f('status', 'สถานะ (รอตอบ/ตอบรับ/ปฏิเสธ)', ''),
        f('reason', 'เหตุผลที่ปฏิเสธ', ''),
        f('at',     'ตอบเมื่อ', ''),
      ]},
      { id: 'ph1b-hire', title: 'สายว่าจ้าง', kind: 'form', fields: [
        nf('vendor', 'ผู้รับจ้าง', ''),
        nf('rate',   'อัตราค่าจ้าง', ''),
        nf('po',     'เลขที่ PO', ''),
      ]},
    ], asks: [
      q('1b.1', 'ต้นแบบทำเฉพาะสายตรวจเอง — ทำสายว่าจ้างด้วยไหม'),
      q('1b.2', 'เลือก "ว่าจ้าง/ตรวจเอง" ตรงไหน — ที่นี่ หรือย้ายไปเลือกตอนออกเลขงาน'),
      q('1b.3', 'เอกสารพัสดุออกตอนออกเลขงาน (ก่อนยืนยันรถ) ยอดจึงเป็นของแผนเต็ม แต่เบิกจริงน้อยกว่า — ให้เป็นประมาณการ หรือมีใบปรับยอดตามทีหลัง'),
    ]},

    { id: 'ph2', group: 'phase', no: '2', title: 'ดำเนินการบำรุงรักษา', real: null, sections: [
      { id: 'ph2-head', title: 'หัวงานรายคัน', kind: 'form', fields: [
        nf('wn',     'เลขงาน', 'p.workNumber'),
        nf('plate',  'ทะเบียน', 'v.plate'),
        nf('brand',  'ยี่ห้อ/รุ่นอุปกรณ์', 'v.brand'),
        nf('region', 'เขต', 'v.region'),
        nf('worker', 'ผู้ปฏิบัติงาน', ''),
        nf('day',    'วันที่เข้าทำงาน', ''),
      ]},
      { id: 'ph2-before', title: 'ก่อนทำ', kind: 'form', fields: [
        nf('photoVeh',  'รูปก่อน – รถ + ทะเบียน', ''),
        nf('photoPart', 'รูปก่อน – อะไหล่ใหม่', ''),
        nf('mileage',   'เลขไมล์ก่อน', 'v.mileage'),
        nf('hours',     'ชม.เครื่องก่อน', 'v.engineHours'),
        nf('found',     'สภาพที่พบ', ''),
      ]},
      { id: 'ph2-done', title: 'รายการที่ทำจริง', kind: 'table', fields: [
        nf('name',  'ชื่ออะไหล่', 'i.name'),
        nf('cat',   'หมวด', 'i.category'),
        nf('plan',  'จำนวนตามแผน', 'i.perVehicle'),
        nf('used',  'จำนวนใช้จริง', ''),
        nf('unit',  'หน่วย', 'i.unit'),
        nf('note',  'หมายเหตุ', ''),
      ]},
      { id: 'ph2-oil', title: 'ตัวอย่างน้ำมันไฮดรอลิก', kind: 'form', fields: [
        nf('taken', 'เก็บตัวอย่างไหม', ''),
        nf('code',  'รหัสตัวอย่าง', ''),
        nf('sent',  'ส่งแล็บวันที่', ''),
      ]},
      { id: 'ph2-after', title: 'หลังทำ', kind: 'form', fields: [
        nf('photoVeh',  'รูปหลัง – รถ + ทะเบียน', ''),
        nf('photoOld',  'รูปหลัง – อะไหล่เก่า', ''),
        nf('photoSpot', 'รูปจุดซ่อม', ''),
        nf('mileage',   'เลขไมล์หลัง', ''),
        nf('hours',     'ชม.เครื่องหลัง', ''),
      ]},
      { id: 'ph2-fail', title: 'กรณีบำรุงรักษาไม่ได้', kind: 'form', fields: [
        nf('reason', 'เหตุผล', ''),
        nf('photo',  'รูปประกอบ', ''),
        nf('next',   'จะทำยังไงต่อ', ''),
      ]},
      { id: 'ph2-doc', title: 'เอกสารส่งพัสดุ', kind: 'table', fields: [
        nf('name',   'ชื่อเอกสาร', ''),
        nf('status', 'สถานะ', ''),
        nf('file',   'ไฟล์แนบ', ''),
      ]},
    ], asks: [
      q('2.1', 'บันทึกรายคัน หรือรายแผน — แผนหนึ่งมีหลายคันหลายเขต เฟสจบเมื่อครบทุกคันใช่ไหม'),
      q('2.2', '"บำรุงรักษาไม่ได้" — ข้ามเฉพาะคันนั้นแล้วไปต่อ หรือค้างทั้งแผน · ต้องยกไปแผนปีหน้าอัตโนมัติไหม'),
      q('2.3', 'รูปถ่ายก่อน/หลัง — บังคับกี่รูป ข้ามได้ไหม ถ้าข้ามต้องให้เหตุผลไหม'),
      q('2.4', 'เก็บตัวอย่างน้ำมันไฮดรอลิก — ทุกคัน หรือเฉพาะบางประเภทรถ'),
      q('2.5', 'ใบ 3 ใบที่พัสดุรับทราบ — ออกจากระบบเอง หรืออัปโหลดไฟล์'),
    ]},

    { id: 'ph3', group: 'phase', no: '3', title: 'ตรวจรับ', real: null, sections: [
      { id: 'ph3-result', title: 'ผลตรวจรับรายคัน', kind: 'table', fields: [
        nf('plate',  'ทะเบียน', 'v.plate'),
        nf('result', 'ผลตรวจ', ''),
        nf('why',    'สาเหตุที่ไม่ผ่าน', ''),
        nf('fixable','แก้ไขได้ไหม', ''),
        nf('by',     'ผู้ตรวจ', ''),
        nf('at',     'วันที่ตรวจ', ''),
      ]},
      { id: 'ph3-reduce', title: 'ขออนุมัติปรับลดงาน', kind: 'form', fields: [
        nf('list',    'คันที่ขอปรับลด', ''),
        nf('reason',  'เหตุผล', ''),
        nf('approver','ผู้อนุมัติ', ''),
        nf('result',  'ผลอนุมัติ', ''),
      ]},
      { id: 'ph3-return', title: 'คืนอะไหล่/น้ำมันที่ไม่ได้ใช้', kind: 'table', fields: [
        nf('name',   'ชื่ออะไหล่', 'i.name'),
        nf('taken',  'จำนวนเบิก', 'i.totalQty'),
        nf('used',   'จำนวนใช้จริง', ''),
        nf('back',   'จำนวนคืน', ''),
        nf('unit',   'หน่วย', 'i.unit'),
        nf('store',  'คลังที่คืน', ''),
      ]},
    ], asks: [
      q('3.1', '"ขออนุมัติปรับลดงาน" ใครอนุมัติ — ฝ่ายพัสดุเป็นแค่ผู้รับทราบแล้ว ⇒ น่าจะเป็นผู้บังคับบัญชา กบค. ใช่ไหม'),
      q('3.2', 'ตรวจรับรายคัน หรือทั้งแผนรวดเดียว'),
      q('3.3', 'คืนอะไหล่ — ตัดยอดคลังกลับอัตโนมัติไหม (ต้นแบบแจ้งซ่อมยังไม่ตัดสต็อกจริง — จุดนี้เหมือนกันไหม)'),
    ]},

    { id: 'ph4', group: 'phase', no: '4', title: 'จัดทำรายงาน', real: null, sections: [
      { id: 'ph4-check', title: 'ผลตรวจสภาพ', kind: 'table', fields: [
        nf('plate',  'ทะเบียน', 'v.plate'),
        nf('elec',   'ระบบไฟฟ้า', ''),
        nf('oil',    'ระบบน้ำมัน', ''),
        nf('hyd',    'ระบบไฮดรอลิก', ''),
        nf('sum',    'สรุป', ''),
      ]},
      { id: 'ph4-lab', title: 'ผลแล็บน้ำมันไฮดรอลิก', kind: 'form', fields: [
        nf('code',   'รหัสตัวอย่าง', ''),
        nf('at',     'วันที่รับผล', ''),
        nf('result', 'ผลตรวจ', ''),
        nf('noti',   'แจ้งเจ้าของรถแล้ว', ''),
      ]},
      { id: 'ph4-sum', title: 'สรุปแผน', kind: 'form', fields: [
        nf('wn',     'เลขงาน', 'p.workNumber'),
        nf('nveh',   'รถตามแผน', 'p.vehCount'),
        nf('ok',     'ทำสำเร็จ', ''),
        nf('reduce', 'ปรับลด', ''),
        nf('left',   'คงค้าง', ''),
      ]},
      { id: 'ph4-close', title: 'อนุมัติปิดงาน', kind: 'form', fields: [
        nf('boss',   'ผู้บังคับบัญชา กบค.', ''),
        nf('result', 'ผลพิจารณา', ''),
        nf('why',    'เหตุผลที่ตีกลับ', ''),
        nf('at',     'วันที่ปิดงาน', ''),
      ]},
    ], asks: [
      q('4.1', 'ผู้บังคับบัญชา กบค. คือระดับไหน — ผอ.กอง / ผช.ผอ. / อื่น'),
      q('4.2', 'ผลตรวจน้ำมันไฮดรอลิก — รอผลแล็บกี่วัน เฟสค้างรอผลไหม หรือปิดไปก่อนแล้วเติมทีหลัง'),
      q('4.3', 'ตีกลับจากเฟสนี้ → กลับไปเฟสไหน (แก้ในเฟสนี้เอง หรือเด้งกลับเฟส 2)'),
    ]},

    { id: 'ph5', group: 'phase', no: '5', title: 'คำนวณต้นทุน', real: null, sections: [
      { id: 'ph5-total', title: 'ต้นทุนรวมของแผน', kind: 'form', fields: [
        nf('wn',      'เลขงาน', 'p.workNumber'),
        nf('parts',   'ค่าอะไหล่', ''),
        nf('labor',   'ค่าแรง', ''),
        nf('perdiem', 'เบี้ยเลี้ยง', 't.perDiem'),
        nf('lodge',   'ที่พัก', 't.lodging'),
        nf('travel',  'ค่าเดินทาง', 't.travel'),
        nf('fuel',    'ค่าน้ำมัน', ''),
        nf('sum',     'SUM ต้นทุน', ''),
      ]},
      { id: 'ph5-per', title: 'ต้นทุนรายคัน', kind: 'table', fields: [
        nf('plate',  'ทะเบียน', 'v.plate'),
        nf('parts',  'ค่าอะไหล่', ''),
        nf('labor',  'ค่าแรง', ''),
        nf('trip',   'เฉลี่ยค่าเดินทาง', ''),
        nf('sum',    'รวมต่อคัน', ''),
      ]},
      { id: 'ph5-out', title: 'ไฟล์ออก', kind: 'form', fields: [
        nf('report', 'รายงานบน VMS+', ''),
        nf('excel',  'Export Excel', ''),
      ]},
    ], asks: [
      q('5.1', 'สูตร SUM ต้นทุน — รวมอะไรบ้าง คิดต่อคันหรือต่อแผน (ค้างมาจากรอบก่อน)'),
      q('5.2', 'ราคาอะไหล่ใช้ราคาไหน — ราคาเบิกจากคลัง หรือราคามาตรฐาน'),
      q('5.3', 'ต้นทุนนี้ต่อยอดไปหน้าประเมินความคุ้มค่าของฝั่งแจ้งซ่อมไหม'),
    ]},

    // ================= กลุ่ม 3 · หน้าหน่วยงานอื่น =================
    { id: 'sup', group: 'unit', no: '', icon: 'inventory_2', title: 'ฝ่ายพัสดุ · เอกสารแจ้งเตรียมอะไหล่', real: 'supplies.html', asks: [], sections: [
      { id: 'sup-head', title: 'หัวเอกสาร', kind: 'form', fields: [
        f('wn',     'เลขงาน', 'p.workNumber'),
        f('ack',    'สถานะรับทราบ', 'p.ack'),
        f('name',   'ชื่อแผน', 'p.planName'),
        f('period', 'ไตรมาสของแผน', 'p.period'),
        f('nveh',   'รถเข้าแผน', 'p.vehCount'),
        f('nline',  'รายการอะไหล่ที่ต้องเตรียม', 'p.lineCount'),
      ]},
      { id: 'sup-items', title: 'ตารางอะไหล่ที่ต้องเตรียม/สั่ง', kind: 'table', fields: [
        f('name',  'ชื่อ', 'i.name'),
        f('per',   'ต่อคัน', 'i.perVehicle'),
        f('nveh',  'จำนวนรถ', 'i.vehicleCount'),
        f('total', 'รวมที่ต้องเตรียม', 'i.totalQty'),
        f('unit',  'หน่วย', 'i.unit'),
      ]},
    ]},

    { id: 'src1', group: 'unit', no: '', icon: 'directions_car', title: 'หน่วยงานเจ้าของรถ · ยืนยันรถ + ตอบรับแผนนัด', real: 'confirm.html', sections: [
      { id: 'src1-head', title: 'หัวคำขอ', kind: 'form', fields: [
        nf('wn',    'เลขงาน', 'p.workNumber'),
        nf('name',  'ชื่อแผน', 'p.planName'),
        nf('span',  'ช่วงที่จะเข้าตรวจ', ''),
        nf('from',  'หน่วยงานผู้ขอ', ''),
        nf('due',   'กำหนดตอบภายใน', ''),
      ]},
      { id: 'src1-veh', title: 'รถของหน่วยงานนี้', kind: 'table', fields: [
        nf('plate',  'ทะเบียน', 'v.plate'),
        nf('brand',  'ยี่ห้อ/รุ่นอุปกรณ์', 'v.brand'),
        nf('status', 'สถานะรถ', 'v.status'),
        nf('answer', 'คำตอบ', ''),
        nf('reason', 'เหตุผลถ้าไม่พร้อม', ''),
        nf('meet',   'จุดนัดรับที่สะดวก', ''),
      ]},
      { id: 'src1-sign', title: 'ช่องยืนยัน', kind: 'form', fields: [
        nf('by',   'ผู้ตอบ', ''),
        nf('role', 'บทบาท (เจ้าของรถ / กรย.)', ''),
        nf('at',   'ตอบเมื่อ', ''),
      ]},
    ], asks: []},

  ],
};

if (typeof module !== 'undefined') module.exports = { DEFAULT_SKEL, SAMPLE, SRC_LABELS, GROUP_LABELS };
