/* Overhaul v2 — ข้อมูลจำลอง + store ร่วมของ overhaul-v2-list.html และ overhaul-v2-job.html
   ผู้ใช้ระบบ = กบค. · Overhaul จ้างบริษัทภายนอกผ่าน PO (1 คันมีได้หลาย PO / หลายบริษัท)
   ตามบอร์ด "flow overhaul" 7 ต.ค. 2569: รับประกันนับจากวันที่เจ้าของรถรับรถ · จำนวนวันกรอกเอง ·
   แจ้งเตือนก่อนหมดประกัน 1 เดือน + 15 วัน · รถพร้อมใช้งานเมื่อ PO เสร็จครบ + ผ่าน safety inspection ·
   ค่า PO บันทึกอย่างเดียว ไม่ส่ง SAP · อายุรถจาก vehicle_registration_date
   state เก็บ localStorage key OVH2_KEY — ปุ่ม "เริ่มเดโมใหม่" ล้างกลับค่าเริ่มต้น */
(function () {
  const OVH2_KEY = 'vms-overhaul-v2';
  const AGE_LIMIT = 10;         // อายุครบเกณฑ์ Overhaul (ปี) — เจ้าของงานกำหนด 12 ต.ค. 2569
  const WARN_DAYS = 45;         // แจ้งเตือนก่อนหมดประกัน 1 เดือน + 15 วัน

  const VENDORS = [
    'บจก. ไฮดรอลิก เซอร์วิส (ประเทศไทย)',
    'บจก. สยามเครน เอ็นจิเนียริ่ง',
    'หจก. ช.การช่าง กลการ',
    'บจก. อายจิ เซลส์ แอนด์ เซอร์วิส',
  ];

  // อะไหล่ประจำรุ่น (รู้ล่วงหน้า — เคาะ 30 ก.ย. 2569) · stock = Smart Inventory (กรอกมือก่อน รอ API)
  const PART_KIT = [
    { code: 'SL-4402', name: 'ชุดซีลกระบอกไฮดรอลิก',       unit: 'ชุด',  qty: 4, stock: 2,  price: 1850 },
    { code: 'OL-0046', name: 'น้ำมันไฮดรอลิก ISO VG46 18L', unit: 'ถัง',  qty: 6, stock: 10, price: 2400 },
    { code: 'FT-1108', name: 'ไส้กรองไฮดรอลิก',             unit: 'ชิ้น', qty: 2, stock: 2,  price: 650 },
    { code: 'HS-3808', name: 'สายไฮดรอลิกแรงดันสูง 3/8"',   unit: 'เส้น', qty: 8, stock: 14, price: 1200 },
    { code: 'WR-3350', name: 'สลิงเครนไฮดรอลิก 10 ตัน',      unit: 'เส้น', qty: 1, stock: 3,  price: 4500 },
  ];

  // รายการ safety inspection ตอนปิดงาน — ⚠️ ค่าจำลอง รอ กบค. ส่งแบบฟอร์มจริง (2/2 Q6 ใน Diagram 08)
  const SAFETY_ITEMS = [
    'ระบบเบรกและเบรกมือ',
    'ไฟส่องสว่าง ไฟเตือน และสัญญาณเสียงถอย',
    'ระบบไฮดรอลิก — ไม่มีรอยรั่วซึม',
    'ขาช้างค้ำยันและระบบล็อก',
    'ทดสอบยกน้ำหนัก (Load test) ตามพิกัด',
    'ระบบหยุดฉุกเฉิน (Emergency stop)',
    'ลิมิตสวิตช์ / ระบบป้องกันการพลิกคว่ำ',
    'สลิง ตะขอ และสลักนิรภัย',
    'ทดสอบความเป็นฉนวน (Dielectric test) — กระเช้าฮอทไลน์',
    'จุดยึดเข็มขัดนิรภัยในกระเช้า',
    'ถังดับเพลิงและอุปกรณ์ฉุกเฉินประจำรถ',
    'ป้ายเตือนและสติกเกอร์พิกัดน้ำหนัก',
  ];

  // ประวัติการซ่อมย้อนหลังรายคัน — คอลัมน์ตาม vehHistoryTable() ใน mock/Maintenance-Request-Form.html
  // (แท็บ "ประวัติการซ่อม" ตอน กบค. รับงานซ่อม) · ⚠️ ข้อมูลจำลอง
  const R = (no, date, syms, detail, parts, by, hours, odo) => ({ no, date, syms, detail, parts, by, hours, odo });
  const REPAIRS = {
    V01: [
      R('RQ-2569-00412', '2026-05-14', ['บูมยกไม่ขึ้น', 'น้ำมันไฮดรอลิกรั่ว'], 'ซีลกระบอกบูมแตก', [['ชุดซีลกระบอกไฮดรอลิก', 2, 'ชุด'], ['น้ำมันไฮดรอลิก ISO VG46 18L', 2, 'ถัง']], 'กบค.', 9120, 184300),
      R('RQ-2568-01144', '2025-11-02', ['กระเช้าหมุนสะดุด'], 'เฟืองหมุนฐานสึก', [['กระบอกไฮดรอลิกยกกระเช้า', 1, 'ตัว']], 'อู่ บจก. อายจิ', 8840, 176950),
      R('RQ-2568-00902', '2025-06-20', ['เบรกไม่อยู่'], 'เปลี่ยนผ้าเบรกหน้า', [['ผ้าเบรกหน้า ชุดใหญ่', 1, 'ชุด']], 'กรย.', 8510, 169200),
      R('RQ-2567-00631', '2024-09-11', ['แบตเตอรี่เสื่อม'], '', [], 'กรย.', 8020, 158400),
    ],
    V02: [
      R('RQ-2569-00277', '2026-03-03', ['สลิงเป็นขุย'], 'เปลี่ยนสลิงเครน', [['สลิงเครนไฮดรอลิก 10 ตัน', 1, 'เส้น']], 'กบค.', 11240, 201300),
      R('RQ-2568-00755', '2025-04-18', ['ปั๊มไฮดรอลิกเสียงดัง'], 'เปลี่ยนปั๊มไฮดรอลิกเกียร์', [['ปั๊มไฮดรอลิกเกียร์', 1, 'ตัว']], 'อู่ หจก. ช.การช่าง', 10610, 192800),
    ],
    V03: [
      R('RQ-2569-00801', '2026-08-09', ['ขาช้างหลังทรุด'], 'ซีลกระบอกขาช้างรั่ว', [['ชุดซีลกระบอกไฮดรอลิก', 1, 'ชุด']], 'กบค.', 7650, 151200),
      R('RQ-2568-01310', '2025-12-15', ['ไฟเตือนไม่ติด'], '', [], 'กรย.', 7310, 145900),
    ],
    V07: [R('RQ-2569-00155', '2026-02-10', ['บูมกระตุก'], 'ปรับวาล์วล็อก', [], 'กบค.', 6200, 120400)],
    V08: [R('RQ-2568-01022', '2025-08-30', ['น้ำมันไฮดรอลิกรั่ว'], '', [['สายไฮดรอลิกแรงดันสูง 3/8"', 2, 'เส้น']], 'กบค.', 9900, 175000)],
    V09: [R('RQ-2569-00690', '2026-07-01', ['ยางสึก'], 'เปลี่ยนยางหลัง 2 เส้น', [], 'อู่ บจก. สยามเครน', 4100, 88200)],
    V10: [],
  };

  const blankJob = () => ({
    step: 0,                  // 0 = ยังไม่เริ่ม · 1 เบิกอะไหล่ · 2 บันทึก PO · 3 ติดตามงาน · 4 นัดรับรถ · 5 ปิดงาน · 6 ปิดแล้ว
    jobNo: '',
    parts: null, partsSkipped: false,
    pos: [], logs: [],
    appt: null,               // { date, time, poId, contact, tel, note, sentAt, pickedUpAt }
    safety: null,             // { rows:[{label,res,note}], file, inspector, warrantyDays }
    warrantyStart: '', warrantyEnd: '', closedAt: '',
    history: [],
  });

  // PO = สัญญาจ้าง 1 ใบ: รายการงานที่รับทำ · วันเริ่มสัญญา + ระยะเวลาว่าจ้าง (วัน) → วันสิ้นสุดสัญญา · งบประมาณ (แก้ไขได้)
  const po = (id, vendor, poNo, poDate, scope, amount, due, status, doneAt) =>
    normPo({ id, vendor, poNo, poDate, scope, amount, due, file: poNo + '.pdf', status, doneAt: doneAt || '' });
  // แปลงรูปแบบเก่า (scope/due) → items/start/days/end — กันข้อมูลที่ค้างใน localStorage จากเวอร์ชันก่อน
  function normPo(p) {
    if (!p.items) p.items = String(p.scope || '').split(/\s*\+\s*/).filter(Boolean);
    if (!p.start) p.start = p.poDate || '';
    if (!p.end) p.end = p.due || '';
    if (p.days == null || p.days === '') p.days = p.start && p.end ? daysBetween(p.start, p.end) : '';
    delete p.scope; delete p.due;
    return p;
  }

  // ── รถในความดูแลของ กบค. (รถติดตั้งเครื่องมือกล) ─────────────────
  function seed() {
    const V = [
      { id: 'V01', plate: '3ขพ 6153 กรุงเทพมหานคร', code: 'กจย. - 25 - 1850', type: 'กระเช้าฮอทไลน์ 115 KV', model: 'Aichi SH15A', org: 'กจย. ฝจบ. ผชก.(ล)', reg: '2012-03-14', owner: 'นายสมพงษ์ ใจดี', ownerTel: '081-234-5678' },
      { id: 'V02', plate: '82-4471 กรุงเทพมหานคร',  code: 'กจย. - 09 - 0231', type: 'รถปั้นจั่น (ไฮดรอลิคเครน)', model: 'Tadano TR-250M', org: 'กฟจ.ลำปาง กฟน.1', reg: '2013-07-01', owner: 'นายวีระ ทองคำ', ownerTel: '089-111-2233' },
      { id: 'V03', plate: '3ขข 1140 กรุงเทพมหานคร', code: 'กจย. - 04 - 0912', type: 'รถบรรทุกขนาดใหญ่ (HOTLINE)', model: 'Hino FM8J + กระเช้า', org: 'กจย. ฝจบ. ผชก.(ล)', reg: '2015-01-20', owner: 'นายประยุทธ แสงทอง', ownerTel: '086-555-0101' },
      { id: 'V04', plate: '70-1234 เชียงใหม่',        code: 'กฟน.1 - 25 - 0447', type: 'กระเช้าฮอทไลน์ 22 KV', model: 'Aichi SH12A', org: 'กฟจ.เชียงใหม่ กฟน.1', reg: '2011-05-10', owner: 'นายเกรียงไกร ดอยคำ', ownerTel: '053-222-111' },
      { id: 'V05', plate: '70-5678 ลำพูน',           code: 'กฟน.1 - 09 - 0118', type: 'รถปั้นจั่น (ไฮดรอลิคเครน)', model: 'Kato KR-25H', org: 'กฟจ.ลำพูน กฟน.1', reg: '2010-02-03', owner: 'นายอนุชา มีสุข', ownerTel: '053-511-200' },
      { id: 'V06', plate: '81-9900 นครราชสีมา',      code: 'กฟฉ.2 - 31 - 0052', type: 'รถขุดตักไฮดรอลิก', model: 'Komatsu PC130', org: 'กฟจ.นครราชสีมา กฟฉ.2', reg: '2009-08-22', owner: 'นายสุริยา โคราช', ownerTel: '044-255-300' },
      { id: 'V07', plate: '3ขค 2210 กรุงเทพมหานคร', code: 'กจย. - 25 - 1902', type: 'กระเช้าฮอทไลน์ 115 KV', model: 'Aichi SH15A', org: 'กจย. ฝจบ. ผชก.(ล)', reg: '2016-09-30', owner: 'นายธนา รุ่งเรือง', ownerTel: '082-777-8899' },
      { id: 'V08', plate: '4กข 7781 ขอนแก่น',         code: 'กฟฉ.1 - 25 - 0311', type: 'กระเช้าฮอทไลน์ 22 KV', model: 'Tadano AT-146', org: 'กฟจ.ขอนแก่น กฟฉ.1', reg: '2014-04-18', owner: 'นายชัยวัฒน์ ศรีขอน', ownerTel: '043-221-450' },
      { id: 'V09', plate: '83-1029 ชลบุรี',           code: 'กฟก.1 - 09 - 0577', type: 'รถปั้นจั่น (ไฮดรอลิคเครน)', model: 'Tadano TR-160M', org: 'กฟจ.ชลบุรี กฟก.1', reg: '2017-11-01', owner: 'นางสาวกมลา ทะเลงาม', ownerTel: '038-271-990' },
      { id: 'V10', plate: '1ฒก 552 กรุงเทพมหานคร',   code: 'กจย. - 25 - 2104', type: 'กระเช้าฮอทไลน์ 22 KV', model: 'Aichi SH12A', org: 'กจย. ฝจบ. ผชก.(ล)', reg: '2019-06-12', owner: 'นายภาณุ ใจเย็น', ownerTel: '081-909-1212' },
      { id: 'V11', plate: '3ขฉ 8812 กรุงเทพมหานคร', code: 'กจย. - 04 - 1388', type: 'รถบรรทุกขนาดใหญ่ (HOTLINE)', model: 'Isuzu FVM + กระเช้า', org: 'กจย. ฝจบ. ผชก.(ล)', reg: '2021-02-25', owner: 'นายจักรพันธ์ มั่นคง', ownerTel: '084-414-1414' },
    ];
    const jobs = {};
    V.forEach(v => { jobs[v.id] = blankJob(); });

    const kit = () => PART_KIT.map(p => ({ ...p }));
    const passAll = () => SAFETY_ITEMS.map(label => ({ label, res: 'pass', note: '' }));

    // V01 — บริษัทดำเนินการ มี 2 PO + บันทึกตรวจงาน 2 ครั้ง
    Object.assign(jobs.V01, {
      step: 3, jobNo: 'OVH-2569-0004', parts: kit(),
      pos: [
        po('P1', VENDORS[0], 'PO-2569-01182', '2026-08-20', 'Overhaul ระบบไฮดรอลิกทั้งชุด + เปลี่ยนซีลกระบอกบูม', 385000, '2026-11-15', 'open'),
        po('P2', VENDORS[3], 'PO-2569-01190', '2026-08-25', 'ตรวจซ่อมชุดกระเช้า + ทดสอบฉนวน 115 KV', 142000, '2026-10-30', 'open'),
      ],
      logs: [
        { id: 'L1', date: '2026-09-10', poId: 'P1', progress: 25, inspector: 'นายวิชัย ช่างกล', note: 'ถอดชุดปั๊มและกระบอกบูมแล้ว พบซีลแตก 3 จุด ตรงตามขอบเขตงาน', files: ['ตรวจงาน-10ก.ย.jpg'] },
        { id: 'L2', date: '2026-10-02', poId: 'P2', progress: 50, inspector: 'นายวิชัย ช่างกล', note: 'ถอดใบกระเช้าส่งทดสอบฉนวน รอผลจากห้องแล็บ', files: [] },
      ],
      history: [
        { at: '2026-08-12 09:10', text: 'เริ่มงาน Overhaul — ออกเลขงาน OVH-2569-0004' },
        { at: '2026-08-14 14:20', text: 'เบิกอะไหล่ 5 รายการ' },
        { at: '2026-08-25 10:05', text: 'บันทึก PO 2 ใบ — ส่งรถให้บริษัทดำเนินการ' },
        { at: '2026-09-10 16:40', text: 'บันทึกตรวจงานครั้งที่ 1' },
        { at: '2026-10-02 11:15', text: 'บันทึกตรวจงานครั้งที่ 2' },
      ],
    });

    // V02 — เบิกอะไหล่ข้ามไปแล้ว รอบันทึก PO
    Object.assign(jobs.V02, {
      step: 2, jobNo: 'OVH-2569-0005', partsSkipped: true,
      history: [
        { at: '2026-10-05 08:45', text: 'เริ่มงาน Overhaul — ออกเลขงาน OVH-2569-0005' },
        { at: '2026-10-05 08:47', text: 'ข้ามขั้นเบิกอะไหล่ — บริษัทจัดหาอะไหล่เอง' },
      ],
    });

    // V07 — งานเสร็จครบทุก PO · ส่งนัดรับรถแล้ว รอเจ้าของรถมารับ
    Object.assign(jobs.V07, {
      step: 4, jobNo: 'OVH-2569-0002', parts: kit(),
      pos: [po('P1', VENDORS[1], 'PO-2569-00911', '2026-06-02', 'Overhaul ชุดเครนและบูมทั้งชุด', 412500, '2026-09-30', 'done', '2026-09-26')],
      logs: [
        { id: 'L1', date: '2026-07-01', poId: 'P1', progress: 30, inspector: 'นายวิชัย ช่างกล', note: 'ถอดบูมเรียบร้อย', files: [] },
        { id: 'L2', date: '2026-08-15', poId: 'P1', progress: 70, inspector: 'นายสุรชัย เครื่องกล', note: 'ประกอบกระบอกใหม่ รอทดสอบ', files: ['ตรวจงาน-15ส.ค.jpg'] },
        { id: 'L3', date: '2026-09-26', poId: 'P1', progress: 100, inspector: 'นายวิชัย ช่างกล', note: 'ทดสอบยกน้ำหนักผ่าน บริษัทส่งมอบงาน', files: ['ผลทดสอบ-load-test.pdf'] },
      ],
      appt: { date: '2026-10-16', time: '10:00', poId: 'P1', contact: 'คุณอรุณ (บจก. สยามเครน)', tel: '02-345-6789', note: 'นำใบนำตัวมาด้วย', sentAt: '2026-10-08 13:30', pickedUpAt: '' },
      history: [
        { at: '2026-05-28 09:00', text: 'เริ่มงาน Overhaul — ออกเลขงาน OVH-2569-0002' },
        { at: '2026-06-02 15:30', text: 'บันทึก PO 1 ใบ — ส่งรถให้บริษัทดำเนินการ' },
        { at: '2026-09-26 17:00', text: 'บริษัทส่งมอบงานครบทุก PO' },
        { at: '2026-10-08 13:30', text: 'ส่งนัดหมายรับรถให้เจ้าของรถ — 16 ต.ค. 2569 10:00' },
      ],
    });

    // V08 — เจ้าของรถรับรถแล้ว รอปิดงาน (safety inspection)
    Object.assign(jobs.V08, {
      step: 5, jobNo: 'OVH-2569-0001', partsSkipped: true,
      pos: [
        po('P1', VENDORS[0], 'PO-2569-00702', '2026-04-10', 'Overhaul ระบบไฮดรอลิก', 268000, '2026-08-31', 'done', '2026-08-28'),
        po('P2', VENDORS[2], 'PO-2569-00715', '2026-04-18', 'ซ่อมโครงฐานเครน + พ่นกันสนิม', 96000, '2026-07-31', 'done', '2026-07-30'),
      ],
      logs: [
        { id: 'L1', date: '2026-08-28', poId: 'P1', progress: 100, inspector: 'นายวิชัย ช่างกล', note: 'งานไฮดรอลิกเสร็จ', files: [] },
      ],
      appt: { date: '2026-10-09', time: '09:30', poId: 'P1', contact: 'คุณมานพ (บจก. ไฮดรอลิก เซอร์วิส)', tel: '02-111-2222', note: '', sentAt: '2026-10-01 10:00', pickedUpAt: '2026-10-09' },
      history: [
        { at: '2026-04-05 09:00', text: 'เริ่มงาน Overhaul — ออกเลขงาน OVH-2569-0001' },
        { at: '2026-10-09 09:45', text: 'เจ้าของรถรับรถแล้ว ที่ บจก. ไฮดรอลิก เซอร์วิส (ประเทศไทย)' },
      ],
    });

    // V04 / V05 / V06 — ปิดงานแล้ว (อยู่ในประกัน · ใกล้หมด · หมดแล้ว)
    const closed = (j, no, start, days, closedAt) => Object.assign(j, {
      step: 6, jobNo: no, partsSkipped: true,
      pos: [po('P1', VENDORS[1], 'PO-' + no.slice(4), start, 'Overhaul ชุดเครน/กระเช้าทั้งชุด', 350000, start, 'done', start)],
      safety: { rows: passAll(), file: 'safety-checklist-' + no + '.pdf', inspector: 'นายวิชัย ช่างกล', warrantyDays: days },
      warrantyStart: start, warrantyEnd: addDays(start, days), closedAt,
      history: [{ at: closedAt + ' 16:00', text: 'ปิดงาน — ผ่าน safety inspection · รถพร้อมใช้งาน' }],
    });
    closed(jobs.V04, 'OVH-2568-0007', '2026-06-18', 180, '2026-06-20');
    closed(jobs.V05, 'OVH-2568-0006', '2026-04-23', 180, '2026-04-24');
    closed(jobs.V06, 'OVH-2567-0003', '2024-09-04', 180, '2024-09-05');

    return { vehicles: V, jobs };
  }

  // ── วันที่ ─────────────────────────────────────────────────────────
  const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  function parse(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(s, n) { const d = parse(s); d.setDate(d.getDate() + Number(n)); return iso(d); }
  function today() { return iso(new Date()); }
  function nowStamp() { const d = new Date(); return today() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function thDate(s) { if (!s) return '—'; const d = parse(s.slice(0, 10)); return d.getDate() + ' ' + TH_MON[d.getMonth()] + ' ' + (d.getFullYear() + 543) + (s.length > 10 ? ' ' + s.slice(11) : ''); }
  function daysBetween(a, b) { return Math.round((parse(b) - parse(a)) / 86400000); }
  function ageYears(reg) {
    const r = parse(reg), t = new Date();
    let y = t.getFullYear() - r.getFullYear();
    if (t.getMonth() < r.getMonth() || (t.getMonth() === r.getMonth() && t.getDate() < r.getDate())) y--;
    return y;
  }

  // ── store ──────────────────────────────────────────────────────────
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(OVH2_KEY));
      if (s && s.vehicles && s.jobs) { Object.values(s.jobs).forEach(j => j.pos.forEach(normPo)); return s; }
    } catch (e) { /* ใช้ค่าเริ่มต้น */ }
    return seed();
  }
  function save(s) { try { localStorage.setItem(OVH2_KEY, JSON.stringify(s)); } catch (e) { /* โหมดส่วนตัว — เดโมยังใช้ได้แค่ไม่จำ */ } }
  function reset() { try { localStorage.removeItem(OVH2_KEY); } catch (e) { /* ไม่มีอะไรต้องล้าง */ } }

  // ── สถานะที่แสดง ───────────────────────────────────────────────────
  const STEP_LABEL = ['', 'เบิกอะไหล่', 'บันทึก PO', 'บริษัทดำเนินการ', 'นัดหมายรับรถ', 'รอปิดงาน', 'พร้อมใช้งาน'];
  function status(v, j) {
    if (j.step === 0) return ageYears(v.reg) >= AGE_LIMIT
      ? { text: 'รอ Overhaul', badge: 'b-brand', sub: 'อายุครบเกณฑ์ ' + AGE_LIMIT + ' ปี' }
      : { text: 'ใช้งานปกติ', badge: 'b-neutral', sub: 'ยังไม่ถึงเกณฑ์' };
    if (j.step === 6) return { text: 'พร้อมใช้งาน', badge: 'b-ok', sub: 'ปิดงาน ' + thDate(j.closedAt) };
    if (j.step === 4) return j.appt && j.appt.sentAt
      ? { text: 'รอเจ้าของรถรับรถ', badge: 'b-low', sub: 'นัด ' + thDate(j.appt.date) + ' ' + j.appt.time }
      : { text: 'นัดหมายรับรถ', badge: 'b-info', sub: 'งานเสร็จครบทุก PO' };
    if (j.step === 3) { const d = j.pos.filter(p => p.status === 'done').length; return { text: 'บริษัทดำเนินการ', badge: 'b-info', sub: 'PO เสร็จ ' + d + '/' + j.pos.length + ' · ตรวจงาน ' + j.logs.length + ' ครั้ง' }; }
    if (j.step === 5) return { text: 'รอปิดงาน', badge: 'b-low', sub: 'รอ safety inspection' };
    return { text: STEP_LABEL[j.step], badge: 'b-info', sub: 'ขั้น ' + j.step + '/5' };
  }
  function warranty(j) {
    if (!j.warrantyStart) return null;
    const left = daysBetween(today(), j.warrantyEnd);
    if (left < 0) return { badge: 'b-neutral', text: 'หมดประกัน', left };
    if (left <= WARN_DAYS) return { badge: 'b-low', text: 'ใกล้หมดประกัน', left };
    return { badge: 'b-ok', text: 'อยู่ในประกัน', left };
  }

  window.OVH2 = {
    AGE_LIMIT, WARN_DAYS, VENDORS, PART_KIT, SAFETY_ITEMS, STEP_LABEL, REPAIRS,
    load, save, reset, status, warranty,
    thDate, addDays, today, nowStamp, daysBetween, ageYears,
  };
})();
