// mock-yearly.js — data model + storage helpers + pure logic for the
// "งานบำรุงรักษาตามวาระ" (yearly maintenance) prototype.
// Works in both the browser (window.MYD) and node (module.exports = MYD)
// so the logic below (deriveItems / workNumber) can be unit-tested with
// node's built-in test runner without any bundler/build step.
//
// โครงข้อมูล (plain objects):
// vehicle: { id, plate, plateProvince, vehicleType, rigBrand, rigModel, truckBrand, truckModel,
//            assetCode, serialNo, hcNo, brand(derived), chassis(derived), ownerDept, ownerLevel,
//            province, criteria, region(1-12), status, mileage, engineHours }
//   ฟิลด์ระบุตัวรถยกตาม "แบบฟอร์มตรวจสภาพบำรุงรักษารถกระเช้า" ที่เจ้าของงานส่งมา 17 ส.ค. 2569
// item:    { id, name, category, oilKind?, unit, appliesToTypes:[], qtyPerVehicle }
// plan:    { id, createdAt, phase, planName, byQuarter:{Q1..Q4,none}, selectedVehicleIds:[],
//            itemAdj:{}, year, workNumbers:{Q1..Q4}, workNumber, approvalStatus:'draft'|'issued',
//            suppliesAckAt:null|string, partsRequisitioned,
//            confirm:{...}|null, trips:[trip], travelConfirmed, statusHistory:[] }
// trip:    { id, name, location, windowFrom, windowTo, perDiem, lodging, travel,
//            vehicleIds:[], dates:{[vehicleId]:'YYYY-MM-DD'}, sentAt,
//            replies:{[ownerDept]:{status,reason,by,at,history:[]}} }
//   1 แผนบำรุงรักษามีแผนเดินทางได้หลายใบ — กบค. เลือกเองว่ารถคันไหนเข้าใบไหน
//   วันนัดอยู่ระดับรายคัน · ช่วงเวลาอยู่ระดับใบ · การตอบรับอยู่ระดับใบ × หน่วยงาน
// หมายเหตุ: กบค. เป็นผู้ออกเลขงานเอง — ฝ่ายพัสดุ "รับทราบ" เพื่อเตรียม/สั่งอะไหล่ ไม่ได้อนุมัติ
//
// approvalStatus: 'draft' (กบค. ยังแก้แผนอยู่) -> 'pending' (ส่งขออนุมัติเลขงาน
// ให้ฝ่ายพัสดุแล้ว รอผล) -> 'approved' (ฝ่ายพัสดุออกเลขงาน) | 'rejected'
// (ฝ่ายพัสดุตีกลับ พร้อม rejectReason — กบค. แก้ไขแผนหรือส่งขออนุมัติใหม่ได้)
// statusHistory: [{status, at, note}] — timeline แสดงฝั่ง กบค. และฝ่ายพัสดุ
// (at ถูกสร้างฝั่ง browser ใน app.js/supplies.js ด้วย toLocaleString('th-TH',...)
// ห้ามเรียก Date ในไฟล์นี้ — ให้ logic ในไฟล์นี้ยังคง pure/deterministic)

const MASTER_KEY = 'maintaind.yearly.master.v1';
const PLANS_KEY = 'maintaind.yearly.plans.v1';
const SETTINGS_KEY = 'maintaind.yearly.settings.v1';
const DEFAULT_SETTINGS = { confirmDueDays: 7 };   // ยังไม่ได้ค่าจริงจากเจ้าของงาน — แก้ได้จาก Admin

// schema version ของโครงข้อมูลใน localStorage — เพิ่มเลขนี้เมื่อโครงข้อมูล
// เปลี่ยนแบบ breaking (เช่น vehicle id เปลี่ยนจาก v1..v8 เป็น v-{region}-{i}
// ตอนเปลี่ยนเป็น 12 เขต) เพื่อให้ storage เก่า (ไม่มี _v หรือ _v ไม่ตรง) ถูก
// auto-reset กลับไปใช้ seed/ค่าเริ่มต้นแทนที่จะแสดงข้อมูลผิดพลาด (เช่น "0 คัน")
const SCHEMA_VERSION = 13;  // 13 = แผนเดินทางเลือกจ้างผู้รับจ้างได้รายใบ (mode/vendorId/hireCost)

// ----- กรย. 12 เขต จัดกลุ่มเป็น 4 ภาค (mockup mapping) -----
// เขต 1-3 เหนือ, 4-6 ตะวันออก, 7-9 ใต้, 10-12 ตะวันตก
const ZONE_LABELS = { north:'ภาคเหนือ', east:'ภาคตะวันออก', south:'ภาคใต้', west:'ภาคตะวันตก' };
const ZONE_ORDER = ['north', 'east', 'south', 'west'];

function regionZone(r) {
  return r <= 3 ? 'north' : r <= 6 ? 'east' : r <= 9 ? 'south' : 'west';
}

const REGIONS = Array.from({ length: 12 }, (_, i) => ({ id: i + 1, name: 'เขต ' + (i + 1), zone: regionZone(i + 1) }));

// ----- seed รถ: deterministic generator (ไม่ใช้ Math.random/Date) -----
// ~10-12 คัน/เขต (รวม ~120-144 คัน) กระจาย criteria/status/vehicleType แบบคงที่
// ยี่ห้อ/รุ่นอุปกรณ์ + ยี่ห้อรถบรรทุกที่รองรับ
// ⚠️ ไม่ได้คิดขึ้นเอง — ยกมาจากข้อมูลที่มีอยู่แล้วในโปรเจกต์:
//    config.js (ต้นแบบแจ้งซ่อม) และ repair-history.html
// แผนนี้เป็นการบำรุงรักษาเครน/กระเช้า ยี่ห้อจึงเป็นตัวจัดกลุ่มที่มีความหมาย
// ⚠️ แยก "ยี่ห้อ" กับ "รุ่น" ออกจากกัน และแยกฝั่งรถบรรทุกกับฝั่งอุปกรณ์ยก
// ตามแบบฟอร์มตรวจสภาพบำรุงรักษารถกระเช้าของจริง (เจ้าของงานส่งมา 17 ส.ค. 2569)
// ฟอร์มมีช่องแยกกันชัด: "ยี่ห้อรถยนต์ / รุ่น" กับ "ยี่ห้อกระเช้า / รุ่น"
// ของเดิมเก็บรวมเป็นสตริงเดียว ('AICHI SK17A') ทำให้แยกไม่ออกว่าท่อนไหนเป็นยี่ห้อ
// VERSALIFT SST37EIH บน ISUZU = คู่ที่ยกมาจากฟอร์มจริงที่เจ้าของงานส่งมา
const BRANDS_BY_TYPE = {
  'รถเครน':   [
    { rigBrand: 'TADANO',    rigModel: 'TM-ZE304', truckBrand: 'HINO',  truckModel: 'FM8J 6 ล้อ' },
    { rigBrand: 'TADANO',    rigModel: 'TM-ZE504', truckBrand: 'HINO',  truckModel: 'FM8J' },
    { rigBrand: 'UNIC',      rigModel: 'URV554',   truckBrand: 'HINO',  truckModel: 'XZU' },
  ],
  'รถกระเช้า': [
    { rigBrand: 'AICHI',     rigModel: 'SK17A',    truckBrand: 'ISUZU', truckModel: 'FTR' },
    { rigBrand: 'VERSALIFT', rigModel: 'SST37EIH', truckBrand: 'ISUZU', truckModel: 'FTR' },
  ],
  'รถขุด':    [
    { rigBrand: 'KOMATSU',   rigModel: 'PC130-8',  truckBrand: '',      truckModel: '' },
  ],
};

// ชื่อเรียกอุปกรณ์ยกตามชนิดรถ — ฟอร์มจริงของรถกระเช้าเขียนว่า "ยี่ห้อกระเช้า"
// คนละคำกับรถเครน/รถขุด จึงต้องเปลี่ยนป้ายตามชนิด ไม่ใช่ใช้คำกลางๆ ว่า "อุปกรณ์"
const RIG_LABEL_BY_TYPE = { 'รถกระเช้า': 'กระเช้า', 'รถเครน': 'เครน', 'รถขุด': 'ชุดขุด' };

// ตัวย่อจังหวัดบนป้ายทะเบียน — ฟอร์มจริงเขียน "80-5738 นน." (นน. = น่าน)
// ⚠️ ตัวย่อเป็นของจริง แต่การจับคู่ "เขต N → จังหวัด" ยังเป็นการจำลองเหมือนเดิม
const PROVINCE_ABBR = {
  'พะเยา': 'พย.', 'กำแพงเพชร': 'กพ.', 'ชัยนาท': 'ชน.', 'นครนายก': 'นย.',
  'จันทบุรี': 'จบ.', 'กาญจนบุรี': 'กจ.', 'ชุมพร': 'ชพ.', 'กระบี่': 'กบ.',
  'นราธิวาส': 'นธ.', 'ขอนแก่น': 'ขก.', 'กาฬสินธุ์': 'กส.', 'ชัยภูมิ': 'ชย.',
};

// อักษรนำหน้ารหัสครุภัณฑ์ตามภาค — ฟอร์มจริงเขียน "น.2-09-0504"
// ⚠️ ของเราจำลอง: ZONE ของต้นแบบ (เหนือ/ตะวันออก/ใต้/ตะวันตก) ไม่ตรงกับ น./ก./ฉ./ต. ของจริง
const ZONE_CODE_LETTER = { north: 'น.', east: 'ก.', south: 'ต.', west: 'ฉ.' };

// ----- หน่วยงานเจ้าของรถ (ผู้ตอบคำขอยืนยันรถเข้าร่วมแผน) -----
// ⚠️ ไม่ได้คิดชื่อขึ้นเอง — ยกจาก hierarchy-data.json (โครงสร้างหน้างาน 74 จังหวัด
// ที่ต้นแบบแจ้งซ่อมใช้อยู่) แล้วแก้สระ า/ำ ที่เพี้ยนจาก font subset ของ PDF ทีละชื่อ
// การจับคู่ "เขต N → ภาคจริง" เป็นการจำลอง (โมเดล 12 เขต/4 ภาคของต้นแบบเองก็จำลอง
// — ZONE_LABELS เหนือ/ตะวันออก/ใต้/ตะวันตก ไม่ตรงกับ น./ก./ฉ./ต. ของจริง)
// แต่ "ชื่อหน่วยงาน" เป็นของจริง — พอได้ dump mas_department ค่อย join ทับ
const OWNER_DEPTS_BY_REGION = {
  1:  ['กฟจ. พะเยา',      'กฟส. เชียงคำ',      'กฟส. จุน'],              // กฟน.1
  2:  ['กฟจ. กำแพงเพชร',  'กฟส. โกสัมพีนคร',   'กฟส. ปางศิลาทอง'],       // กฟน.2
  3:  ['กฟจ. ชัยนาท',     'กฟส. มโนรมย์',      'กฟส. เนินขาม'],          // กฟน.3
  4:  ['กฟจ. นครนายก',    'กฟส. บ้านนา',       'กฟส. ปากพลี'],           // กฟก.1
  5:  ['กฟจ. จันทบุรี',    'กฟส. สอยดาว',       'กฟส. ท่าใหม่'],          // กฟก.2
  6:  ['กฟจ. กาญจนบุรี',   'กฟส. ท่ามะกา',      'กฟส. ด่านมะขามเตี้ย'],    // กฟก.3
  7:  ['กฟจ. ชุมพร',      'กฟส. ท่าแซะ',       'กฟส. พะโต๊ะ'],           // กฟต.1
  8:  ['กฟจ. กระบี่',      'กฟส. เกาะลันตา',    'กฟส. เหนือคลอง'],        // กฟต.2
  9:  ['กฟจ. นราธิวาส',   'กฟส. สุไหงโก-ลก',   'กฟส. สุไหงปาดี'],        // กฟต.3
  10: ['กฟจ. ขอนแก่น',    'กฟส. บ้านไผ่',      'กฟส. น้ำพอง'],           // กฟฉ.1
  11: ['กฟจ. กาฬสินธุ์',   'กฟส. สมเด็จ',       'กฟส. หนองกุงศรี'],       // กฟฉ.2
  12: ['กฟจ. ชัยภูมิ',     'กฟส. แก้งคร้อ',     'กฟส. จัตุรัส'],          // กฟฉ.3
};

// วนสถานะรถให้ครบทั้ง 6 แบบในข้อมูลจำลอง โดยยังเหลือรถ "พร้อมเข้าแผน" เป็นส่วนใหญ่
// (10/16 ≈ 62%) ไม่งั้นเดโมทำแผนไม่ได้เพราะรถถูกบล็อกเกือบหมด
const VEHICLE_STATUS_CYCLE = [
  'available', 'available', 'available', 'repairing',
  'available', 'available', 'pending_approval', 'available',
  'available', 'decommissioned', 'available', 'available',
  'transferred', 'available', 'available', 'disposal',
];

function genSeedVehicles() {
  const types = ['รถกระเช้า', 'รถเครน', 'รถขุด'];
  const out = [];
  for (let r = 1; r <= 12; r++) {
    const count = 10 + (r % 3);
    for (let i = 1; i <= count; i++) {
      const t = types[(r + i) % 3];
      const bs = BRANDS_BY_TYPE[t];
      const b = bs[(r * 2 + i) % bs.length];  // ไม่ใช้ (r+i) เพราะชนกับสูตรเลือกชนิดรถ ทำให้ได้ยี่ห้อเดียว
      const prov = OWNER_DEPTS_BY_REGION[r][0].replace('กฟจ. ', '');
      out.push({
        id: `v-${r}-${i}`,
        plate: `${String(r).padStart(2, '0')}-${1000 + r * 100 + i}`,
        plateProvince: PROVINCE_ABBR[prov] || '',      // ทะเบียนของจริงมีตัวย่อจังหวัดต่อท้าย
        vehicleType: t,
        // ---- ฝั่งอุปกรณ์ยก (กระเช้า/เครน/ชุดขุด) ----
        rigBrand: b.rigBrand,
        rigModel: b.rigModel,
        // ---- ฝั่งรถบรรทุกที่ติดตั้ง ----
        truckBrand: b.truckBrand,
        truckModel: b.truckModel,
        // ---- เลขอ้างอิงตามแบบฟอร์มตรวจสภาพ ----
        assetCode: `${ZONE_CODE_LETTER[regionZone(r)]}${r}-${String(9 + (i % 4)).padStart(2, '0')}-${String(500 + r * 7 + i).padStart(4, '0')}`,
        serialNo: `${b.rigBrand.slice(0, 3).toUpperCase()}${String(r).padStart(2, '0')}${String(1000 + i * 37)}`,
        hcNo: `HC-${1500 + r * 11 + i}`,
        // brand/chassis = ค่าที่ประกอบจากฟิลด์แยกด้านบน (derived) — คงไว้เพื่อให้หน้าที่
        // จัดกลุ่ม "ตามยี่ห้อ/รุ่นอุปกรณ์" (พัสดุ · สรุปแผน) ใช้ต่อได้โดยไม่ต้องแก้
        brand: `${b.rigBrand} ${b.rigModel}`,
        chassis: b.truckBrand ? `${b.truckBrand} ${b.truckModel}` : '—',
        // ⚠️ ข้อมูลจำลอง: ทุก 6 คันให้ 1 คันเป็น "รถของเขต" (กรย. เขต N) ที่เหลือเป็นรถของ
        // หน่วยงานระดับจังหวัด/สาขา — ของจริงต้องดูจาก mas_department ว่าหน่วยเจ้าของ
        // อยู่ระดับไหน · เพิ่มเพราะเจ้าของงานกำหนดกติกา default สถานที่ต่างกันสองแบบ
        // (17 ส.ค. 2569: "Default เป็นจังหวัดที่สังกัด แต่ถ้าเป็นรถเขต ให้เป็นเขตที่อยู่")
        ownerLevel: i % 6 === 0 ? 'region' : 'province',
        ownerDept: i % 6 === 0
          ? `กรย. เขต ${r}`
          : OWNER_DEPTS_BY_REGION[r][i % OWNER_DEPTS_BY_REGION[r].length],
        // จังหวัด = ชื่อหลัง "กฟจ." ของเขตนั้น (กฟส. ที่เหลือเป็นอำเภอในจังหวัดเดียวกัน)
        // ไม่ได้ตั้งชื่อจังหวัดขึ้นใหม่ — ยกจาก OWNER_DEPTS_BY_REGION ที่มีอยู่แล้ว
        province: prov,
        criteria: (r + i) % 2 === 0 ? 'truck' : 'net',
        region: r,
        // ไม่ใช้ (r+i) เพราะชนกับสูตรเลือกชนิดรถ ทำให้สถานะผูกติดกับชนิดรถ
        status: VEHICLE_STATUS_CYCLE[(r * 5 + i * 3) % VEHICLE_STATUS_CYCLE.length],
        mileage: 40000 + ((r * 1000 + i * 137) % 120000),
        engineHours: 1500 + ((r * 97 + i * 53) % 5000),
      });
    }
  }
  return out;
}

const SEED_VEHICLES = genSeedVehicles();

// ----- ผู้รับจ้าง (vendor) -----
// เจ้าของงานสั่ง 17 ส.ค. 2569: "ตอนสร้างแผนการเดินทาง สามารถเลือกจ้าง vendor
// รายแผนการเดินทางเลย ก็ assign แผนการซ่อม/แผนการเดินทางเข้ากับ vendor ได้เลย"
// ⇒ ปิดคำถามค้าง 1b.1 (ทำสายว่าจ้างไหม = ทำ) และ 1b.2 (เลือกตรงไหน = รายใบเดินทาง)
// ⚠️ ชื่อผู้รับจ้างทั้งหมดเป็นข้อมูลจำลอง — ยังไม่มีทะเบียนผู้รับจ้างจริงจาก VMS Plus
const SEED_VENDORS = [
  { id:'vd1', name:'หจก. เชียงรายยานยนต์บริการ',  taxId:'0573xxxxxxxx1', contact:'คุณสมชาย',  phone:'081-234-5671', zones:['north'] },
  { id:'vd2', name:'บจ. ตะวันออกเครนเซอร์วิส',    taxId:'0245xxxxxxxx2', contact:'คุณวิไล',    phone:'081-234-5672', zones:['east'] },
  { id:'vd3', name:'หจก. ใต้กลการ',              taxId:'0803xxxxxxxx3', contact:'คุณอนุชา',   phone:'081-234-5673', zones:['south'] },
  { id:'vd4', name:'บจ. อีสานไฮดรอลิก',          taxId:'0405xxxxxxxx4', contact:'คุณพรทิพย์', phone:'081-234-5674', zones:['west'] },
  { id:'vd5', name:'บจ. ทั่วไทยเซอร์วิส',         taxId:'0105xxxxxxxx5', contact:'คุณธนกร',   phone:'081-234-5675', zones:['north','east','south','west'] },
];

const SEED_ITEMS = [
  { id:'p1', name:'ผ้าเบรก',              category:'part',   unit:'ชุด', appliesToTypes:['รถกระเช้า','รถเครน','รถขุด'], qtyPerVehicle:1,  triggerType:'mileage', interval:20000 },
  { id:'p2', name:'สายไฮดรอลิก',          category:'part',   unit:'เส้น', appliesToTypes:['รถกระเช้า','รถเครน'],        qtyPerVehicle:2,  triggerType:'calendar', interval:0 },
  { id:'o1', name:'น้ำมันเครื่อง 15W-40',  category:'oil', oilKind:'engine',    unit:'ลิตร', appliesToTypes:['รถกระเช้า','รถเครน','รถขุด'], qtyPerVehicle:12, triggerType:'hours', interval:250 },
  { id:'o2', name:'น้ำมันเฟือง 90',        category:'oil', oilKind:'gear',      unit:'ลิตร', appliesToTypes:['รถเครน','รถขุด'],             qtyPerVehicle:6,  triggerType:'hours', interval:1000 },
  { id:'o3', name:'น้ำมันไฮดรอลิก 68',     category:'oil', oilKind:'hydraulic', unit:'ลิตร', appliesToTypes:['รถกระเช้า','รถเครน','รถขุด'], qtyPerVehicle:20, triggerType:'hours', interval:1000 },
  { id:'f1', name:'ไส้กรองน้ำมันเครื่อง',   category:'filter', unit:'ชิ้น', appliesToTypes:['รถกระเช้า','รถเครน','รถขุด'], qtyPerVehicle:1, triggerType:'hours', interval:250 },
  { id:'f2', name:'ไส้กรองไฮดรอลิก',       category:'filter', unit:'ชิ้น', appliesToTypes:['รถกระเช้า','รถเครน','รถขุด'], qtyPerVehicle:1, triggerType:'hours', interval:1000 },
  { id:'f3', name:'ไส้กรองอากาศ',          category:'filter', unit:'ชิ้น', appliesToTypes:['รถขุด'],                     qtyPerVehicle:1, triggerType:'mileage', interval:15000 },
];

const INITIAL_PLAN = {
  id: null,               // ตั้งตอน newPlan()
  createdAt: null,
  phase: 'procurement',   // เฟสปฏิบัติการที่แผนนี้อยู่ (เริ่มที่เฟสแรกหลังออกเลขงาน)
  planName: '',
  // 1 แผน = ทั้งปี · รถถูกจัดเข้า "ไตรมาสที่จะเข้าบำรุงรักษา" (เจ้าของงานสั่ง 17 ส.ค. 2569:
  // ต้องเลือกรถให้ครบทุกไตรมาสก่อน จึงจะไปขั้นถัดไปได้)
  // ถัง none = อยู่ในแผนแล้วแต่ยังไม่ระบุไตรมาส — ใช้ตอนแผนเดินทางถอดรถออกจากไตรมาส
  // แล้วยังไม่รู้ว่าจะไปไตรมาสไหน (เจ้าของงานสั่งเพิ่ม 17 ส.ค. 2569)
  byQuarter: { Q1: [], Q2: [], Q3: [], Q4: [], none: [] },
  // ⚠️ อย่าเขียนตรงๆ — เป็น "ผลรวมทุกไตรมาส" ที่ MYD.setQuarterVehicles() เขียนให้เอง
  // มีไว้ให้หน้าปลายน้ำ (พัสดุ · ยืนยันรถ · แผนเดินทาง · เฟส) ที่สนใจแค่ "รถทั้งหมดในแผน"
  // ใช้ต่อได้โดยไม่ต้องรู้เรื่องไตรมาส
  selectedVehicleIds: [],
  year: 2569,             // ปีงบที่แผนมีผล = ปีงบที่ทำแผน + PLAN_LEAD_YEARS (ตั้งใน newPlan)
  createdFY: 2569,        // ปีงบที่ทำแผน — ใช้คำนวณว่ามีรอบทบทวนกี่รอบ
  revisions: [],          // [{no, fy, at, added, removed, moved, byQuarter}] — รอบทบทวนที่ปิดแล้ว
  itemAdj: {},            // การแก้มือรายการอะไหล่ { [itemId]: {qty, off, added} }
  workNumbers: {},        // { Q1:'MT-2569-Q1-001', … } ออกครบ 4 ใบพร้อมกันตอนกดออกเลขงาน
  workNumber: null,       // = เลขของไตรมาสแรกที่มีรถ — ใช้เป็นหัวข้อแผนในลิสต์/ไทม์ไลน์
  approvalStatus: 'draft',// draft -> issued
  suppliesAckAt: null,    // ฝ่ายพัสดุกดรับทราบเมื่อไหร่
  statusHistory: [],
  partsRequisitioned: false,
  confirm: null,          // ตั้งค่าเมื่อ กบค. กด "ส่งคำขอยืนยัน" (ห้ามสร้างตั้งแต่เปิดหน้า)
  trips: [],              // แผนเดินทางหลายใบ — กบค. สร้างเองอิสระ เลือกรถเข้าแต่ละใบ
  travelConfirmed: false,
};

// order used to sort deriveItems() output: part(0) -> oil(1) -> filter(2)
const CATEGORY_ORDER = { part: 0, oil: 1, filter: 2 };

function deepCopy(v) {
  return JSON.parse(JSON.stringify(v));
}


// ---------- แผนตัวอย่าง 1 ใบ: "สร้างเสร็จแล้ว พร้อมไปเฟสต่อไป" ----------
// ออกเลขงานแล้ว · ฝ่ายพัสดุรับทราบแล้ว · เบิกอะไหล่แล้ว · แผนเดินทางยืนยันแล้ว
// ⇒ เฟส 1 เสร็จ เฟส 2 ปลดล็อก — ใช้เป็นตัวตั้งต้นตอนทำเฟสถัดไป
// ค่าคงที่ทั้งหมด (id / เลขงาน / รายการรถ / วันที่) เพื่อให้ลิงก์ #<planId> ใช้ได้ตลอด
const SEED_PLAN = {
  id: 'plan-seed-2569-001',
  createdAt: '1 ต.ค. 2568 09:00',
  phase: 'procurement',        // เฟส 1 เสร็จแล้ว → กด "ไปเฟสถัดไป" เข้าเฟส 2 ได้
  planName: 'บำรุงรักษาเครน/กระเช้า เขต 3-4',
  // รถ 12 คันของเขต 3-4 กระจายครบ 4 ไตรมาส (3 คัน/ไตรมาส) — แผนตัวอย่างต้องผ่าน
  // เงื่อนไข "ทุกไตรมาสต้องมีรถ" ไม่งั้นเปิดมาแล้วแก้ไม่ได้
  byQuarter: {
    Q1: ['v-3-1', 'v-3-2', 'v-3-3'],
    Q2: ['v-3-4', 'v-3-5', 'v-3-6'],
    Q3: ['v-4-1', 'v-4-2', 'v-4-3'],
    Q4: ['v-4-4', 'v-4-5', 'v-4-6'],
    none: [],
  },
  selectedVehicleIds: [3, 4].flatMap(r => [1, 2, 3, 4, 5, 6].map(i => `v-${r}-${i}`)),
  itemAdj: {},
  year: 2569,
  createdFY: 2567,
  revisions: [],
  workNumbers: {
    Q1: 'MT-2569-Q1-001', Q2: 'MT-2569-Q2-001',
    Q3: 'MT-2569-Q3-001', Q4: 'MT-2569-Q4-001',
  },
  workNumber: 'MT-2569-Q1-001',
  approvalStatus: 'issued',
  suppliesAckAt: '3 ต.ค. 2568 14:20',
  statusHistory: [
    { status: 'issued',       at: '1 ต.ค. 2568 10:05', note: 'กบค. ออกเลขงาน MT-2569-Q1-001' },
    { status: 'notified',     at: '1 ต.ค. 2568 10:05', note: 'ส่งเอกสารแจ้งฝ่ายพัสดุ — แจ้งรายการอะไหล่ที่ต้องเตรียม/สั่ง' },
    { status: 'acknowledged', at: '3 ต.ค. 2568 14:20', note: 'ฝ่ายพัสดุรับทราบ — เตรียม/สั่งอะไหล่ตามรายการ' },
  ],
  partsRequisitioned: true,
  confirm: {
    requestedAt: '2568-10-06', dueAt: '2568-10-13', remindedAt: null,
    byVehicle: [3, 4].reduce((acc, r) => {
      [1, 2, 3, 4, 5, 6].forEach(i => {
        acc[`v-${r}-${i}`] = { answer: 'ready', reason: '', meetPoint: 'จุดรวมงาน กฟฉ. เขต 3',
                               by: 'หน่วยงานเจ้าของรถ', at: '2568-10-08 10:00',
                               history: [], verdict: null, verdictWhy: '', verdictAt: '' };
      });
      return acc;
    }, {}),
  },
  // แผนเดินทาง 2 ใบ — จังหวัดละใบ · ตอบรับครบแล้วทั้งคู่ (เฟส 1 จึงจบ)
  trips: [
    {
      id: 'trip-seed-1', name: 'ชัยนาท',
      location: 'จุดรวมงาน กฟจ. ชัยนาท → หน้างาน อ.มโนรมย์',
      windowFrom: '2568-11-04', windowTo: '2568-11-08',
      staff: ['ช่างสมชาย ใจดี', 'ช่างวิรัตน์ ศรีสุข'],
      staffPerDiem: [700, 700],     // อัตราเบี้ยเลี้ยง/วัน ต่อคน — perDiem ของใบ = ผลรวมนี้ × จำนวนวัน
      perDiem: 7000, lodging: 5000, travel: 3500,
      vehicleIds: [1, 2, 3, 4, 5, 6].map(i => `v-3-${i}`),
      dates: [1, 2, 3, 4, 5, 6].reduce((a, i) => (a[`v-3-${i}`] = i <= 3 ? '2568-11-04' : '2568-11-05', a), {}),
      sentAt: '8 ต.ค. 2568 09:00',
      replies: {
        'กฟจ. ชัยนาท': { status: 'accepted', reason: '', by: 'หน่วยงานเจ้าของรถ', at: '9 ต.ค. 2568 10:20', history: [] },
        'กฟส. มโนรมย์': { status: 'accepted', reason: '', by: 'หน่วยงานเจ้าของรถ', at: '9 ต.ค. 2568 11:05', history: [] },
        'กฟส. เนินขาม': { status: 'accepted', reason: '', by: 'หน่วยงานเจ้าของรถ', at: '9 ต.ค. 2568 13:40', history: [] },
      },
    },
    {
      id: 'trip-seed-2', name: 'นครนายก',
      location: 'จุดรวมงาน กฟจ. นครนายก → หน้างาน อ.บ้านนา',
      windowFrom: '2568-11-06', windowTo: '2568-11-08',
      staff: ['ช่างประยุทธ์ แก้วมณี', 'ช่างอนุชิต ศรีสุข'],
      staffPerDiem: [700, 700],
      perDiem: 5000, lodging: 4000, travel: 3000,
      vehicleIds: [1, 2, 3, 4, 5, 6].map(i => `v-4-${i}`),
      dates: [1, 2, 3, 4, 5, 6].reduce((a, i) => (a[`v-4-${i}`] = i <= 3 ? '2568-11-06' : '2568-11-07', a), {}),
      sentAt: '8 ต.ค. 2568 09:00',
      replies: {
        'กฟจ. นครนายก': { status: 'accepted', reason: '', by: 'หน่วยงานเจ้าของรถ', at: '9 ต.ค. 2568 09:15', history: [] },
        'กฟส. บ้านนา': { status: 'accepted', reason: '', by: 'หน่วยงานเจ้าของรถ', at: '9 ต.ค. 2568 09:50', history: [] },
        'กฟส. ปากพลี': { status: 'accepted', reason: '', by: 'หน่วยงานเจ้าของรถ', at: '9 ต.ค. 2568 14:10', history: [] },
      },
    },
  ],
  travelConfirmed: true,
};

// ---------- แผนตัวอย่างใบที่ 2: ค้างอยู่ที่ขั้น "ยืนยันรถเข้าร่วมแผน" ----------
// เบิกอะไหล่แล้ว · ส่งคำขอยืนยันแล้ว · ตอบกลับมาบางส่วน · ยังไม่ทำแผนเดินทาง
// ⇒ ใช้เดโม/พัฒนา CF ได้ทันที (SEED_PLAN ใบเดิม travelConfirmed:true จึงถูกล็อก)
// ค่าคงที่ทั้งหมดเพื่อให้ลิงก์ #plan-seed-2569-002 ใช้ได้ตลอด
// dueAt เป็นวันในอดีต ⇒ 2 คันที่ยังไม่ตอบจะขึ้น "เลยกำหนด" — ตั้งใจ เพื่อให้เห็นทั้ง
// เส้น "ไม่พร้อม" และเส้น "เลยกำหนด" ซึ่งเป็น 2 ทางที่ต้องให้ กบค. ตัดสิน
const CF_VEHICLE_IDS = [5, 6].flatMap(r => [1, 2, 3, 4, 5, 6].map(i => `v-${r}-${i}`));

const SEED_PLAN_CF = {
  id: 'plan-seed-2569-002',
  createdAt: '2 ต.ค. 2568 09:30',
  phase: 'procurement',
  planName: 'บำรุงรักษาเครน/กระเช้า ภาคตะวันออก รอบ 2',
  byQuarter: {
    Q1: CF_VEHICLE_IDS.slice(0, 2),
    Q2: CF_VEHICLE_IDS.slice(2, 4),
    Q3: CF_VEHICLE_IDS.slice(4, 6),
    Q4: CF_VEHICLE_IDS.slice(6),
    none: [],
  },
  selectedVehicleIds: CF_VEHICLE_IDS,
  itemAdj: {},
  year: 2569,
  createdFY: 2567,
  revisions: [],
  workNumbers: {
    Q1: 'MT-2569-Q1-002', Q2: 'MT-2569-Q2-002',
    Q3: 'MT-2569-Q3-002', Q4: 'MT-2569-Q4-002',
  },
  workNumber: 'MT-2569-Q1-002',
  approvalStatus: 'issued',
  suppliesAckAt: '4 ต.ค. 2568 11:10',
  statusHistory: [
    { status: 'issued',       at: '2 ต.ค. 2568 10:15', note: 'กบค. ออกเลขงาน MT-2569-Q1-002' },
    { status: 'notified',     at: '2 ต.ค. 2568 10:15', note: 'ส่งเอกสารแจ้งฝ่ายพัสดุ' },
    { status: 'acknowledged', at: '4 ต.ค. 2568 11:10', note: 'ฝ่ายพัสดุรับทราบ' },
  ],
  partsRequisitioned: true,
  confirm: {
    requestedAt: '2568-10-05', dueAt: '2568-10-12', remindedAt: null,
    byVehicle: CF_VEHICLE_IDS.reduce((acc, id, idx) => {
      const base = { reason: '', meetPoint: '', by: '', at: '',
                     history: [], verdict: null, verdictWhy: '', verdictAt: '' };
      if (idx < 8) {
        acc[id] = { ...base, answer: 'ready', meetPoint: 'จุดรวมงาน กฟฉ. เขต 5',
                    by: 'หน่วยงานเจ้าของรถ', at: '2568-10-07 09:40' };
      } else if (idx < 10) {
        acc[id] = { ...base, answer: 'notready',
                    reason: idx === 8 ? 'ติดงานก่อสร้างสายส่งถึงสิ้นเดือน' : 'รถเข้าซ่อมเกียร์อยู่ที่อู่',
                    by: 'หน่วยงานเจ้าของรถ', at: '2568-10-07 14:05' };
      } else {
        acc[id] = { ...base, answer: 'pending' };   // ยังไม่ตอบ → เลยกำหนดแล้ว
      }
      return acc;
    }, {}),
  },
  trips: [],
  travelConfirmed: false,
};

const MYD = {
  // ----- label maps (ภาษาไทย) -----
  CRITERIA_LABELS: { truck:'ทรัค', net:'เนต' },
  STATUS_LABELS:   {
    available:       'พร้อมเข้าแผน',
    pending_approval:'รออนุมัติ',
    repairing:       'ซ่อมอยู่',
    transferred:     'โอนย้ายหน่วยงาน',
    decommissioned:  'หมดสภาพการใช้งาน',
    disposal:        'รอจำหน่าย',
  },
  // ข้อควรรู้ของแต่ละสถานะ — "เตือน" ไม่ใช่ "ห้าม"
  // เจ้าของงานสั่ง 17 ส.ค. 2569 (แก้จากตอนเช้าที่ให้ปิดช่องติ๊ก):
  //   "ตอนเลือก ทุกสถานะสามารถเลือกได้ แล้วคนสร้างแผนค่อยมาเลือกออก"
  // ⇒ ติ๊กได้ทุกคัน · ข้อความนี้แสดงใต้ป้ายสถานะให้คนทำแผนตัดสินเอง
  STATUS_NOTE: {
    repairing:      'อยู่ระหว่างซ่อม — ตรวจสอบก่อนว่าจะซ่อมเสร็จทันรอบไหม',
    transferred:    'โอนย้ายไปหน่วยงานอื่นแล้ว — ยืนยันกับหน่วยงานปลายทางก่อน',
    decommissioned: 'หมดสภาพการใช้งาน — ปกติไม่ต้องบำรุงรักษา',
    disposal:       'รอจำหน่าย — ปกติไม่ต้องบำรุงรักษา',
  },
  CATEGORY_LABELS: { part:'อะไหล่', oil:'น้ำมัน', filter:'ไส้กรอง' },
  OILKIND_LABELS:  { engine:'น้ำมันเครื่อง', gear:'น้ำมันเฟือง', hydraulic:'น้ำมันไฮดรอลิก' },
  TRIGGER_LABELS:  { calendar:'ตามรอบ (ไตรมาส)', hours:'ชั่วโมงเครื่อง', mileage:'ระยะทาง' },

  // ----- กรย. 12 เขต / 4 ภาค -----
  ZONE_LABELS,
  ZONE_ORDER,
  REGIONS,
  regionZone,

  BRANDS_BY_TYPE,
  OWNER_DEPTS_BY_REGION,

  // จังหวัดของเขต — อ่านจากชื่อ กฟจ. ที่เป็นรายการแรกของเขตนั้นใน OWNER_DEPTS_BY_REGION
  // (ข้อมูลจำลองชุดนี้ 1 เขต = 1 จังหวัด · ถ้าของจริงมีหลายจังหวัดต่อเขต ต้องเก็บ
  //  จังหวัดที่ตัวรถแทน ไม่ใช่อนุมานจากเขต)
  provinceOfRegion(r) {
    const first = (OWNER_DEPTS_BY_REGION[r] || [])[0] || '';
    return first.replace(/^กฟจ\.\s*/, '') || `เขต ${r}`;
  },
  SEED_PLAN,
  SEED_PLAN_CF,
  SEED_VEHICLES,
  SEED_ITEMS,
  INITIAL_PLAN,
  SCHEMA_VERSION,

  // ----- storage (fallback seed เมื่อว่าง/พัง/schema เก่า) -----
  // หมายเหตุ: fallback ที่นี่ไม่ auto-write กลับ localStorage — แค่ return
  // ค่า fresh ให้ใช้งาน ณ ตอนนั้น (เขียนจริงเมื่อเรียก saveMaster/savePlan
  // หรือ resetMaster/resetPlans เท่านั้น)
  loadMaster() {
    const fresh = () => ({ vehicles: deepCopy(SEED_VEHICLES), items: deepCopy(SEED_ITEMS) });
    if (typeof localStorage === 'undefined') return fresh();
    try {
      const raw = localStorage.getItem(MASTER_KEY);
      if (!raw) throw new Error('empty');
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.vehicles) || !Array.isArray(parsed.items)) {
        throw new Error('invalid shape');
      }
      if (parsed._v !== SCHEMA_VERSION) throw new Error('stale schema');
      return { vehicles: parsed.vehicles, items: parsed.items };
    } catch {
      return fresh();
    }
  },

  saveMaster(master) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(MASTER_KEY, JSON.stringify({ _v: SCHEMA_VERSION, vehicles: master.vehicles, items: master.items }));
  },

  loadSettings() {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_SETTINGS };
    try {
      const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
      if (!parsed || typeof parsed.confirmDueDays !== 'number') throw new Error('invalid');
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },

  saveSettings(s) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...DEFAULT_SETTINGS, ...s }));
  },

  // ---------- แผน: เก็บเป็น "หลายแผน" ----------
  // { _v, plans: [ ...plan ] }  — เรียงใหม่สุดขึ้นก่อนตอนแสดงผล
  // แผนหนึ่ง = แผนบำรุงรักษาประจำปีหนึ่งใบของ กบค. · เลขงานคือหัวข้อของแผน
  loadPlans() {
    const fresh = () => [deepCopy(SEED_PLAN), deepCopy(SEED_PLAN_CF)];
    if (typeof localStorage === 'undefined') return fresh();
    try {
      const raw = localStorage.getItem(PLANS_KEY);
      if (!raw) throw new Error('empty');
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.plans)) throw new Error('invalid shape');
      if (parsed._v !== SCHEMA_VERSION) throw new Error('stale schema');
      return parsed.plans;
    } catch {
      // ยังไม่เคยมีข้อมูล → คืนแผนตั้งต้น (ไม่เขียนกลับ เขียนจริงตอน savePlan/savePlans)
      return fresh();
    }
  },

  savePlans(plans) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PLANS_KEY, JSON.stringify({ _v: SCHEMA_VERSION, plans }));
  },

  getPlan(id) {
    return this.loadPlans().find(p => p.id === id) || null;
  },

  // upsert ตาม id — ใช้แทน savePlan() เดิมทุกที่
  savePlan(plan) {
    const plans = this.loadPlans();
    const i = plans.findIndex(p => p.id === plan.id);
    if (i >= 0) plans[i] = plan; else plans.push(plan);
    this.savePlans(plans);
    return plan;
  },

  newPlan(nowStr) {
    const p = deepCopy(INITIAL_PLAN);
    p.id = 'plan-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    p.createdAt = nowStr || '';
    this.ensurePlanQuarters(p);
    return p;
  },

  deletePlan(id) {
    this.savePlans(this.loadPlans().filter(p => p.id !== id));
  },

  // เขียน [] ลงไปจริง (ไม่ใช่ลบ key) ไม่งั้นแผนตั้งต้นจะกลับมาตอนโหลดใหม่
  resetPlans() {
    this.savePlans([]);
    return [];
  },

  // กลับไปเป็นค่าเริ่มต้น = มีแผนตัวอย่างที่ทำเสร็จแล้ว 1 ใบ
  reseedPlans() {
    const fresh = [deepCopy(SEED_PLAN), deepCopy(SEED_PLAN_CF)];
    this.savePlans(fresh);
    return fresh;
  },

  resetMaster() {
    const fresh = { vehicles: deepCopy(SEED_VEHICLES), items: deepCopy(SEED_ITEMS) };
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MASTER_KEY, JSON.stringify({ _v: SCHEMA_VERSION, vehicles: fresh.vehicles, items: fresh.items }));
    }
    return fresh;
  },

  resetAll() {
    MYD.resetMaster();
    MYD.resetPlans();
  },

  // ----- logic ล้วน (unit-tested) -----
  deriveItems(vehicles, items) {
    const lines = [];
    for (const item of items) {
      const vehicleCount = vehicles.filter(v => item.appliesToTypes.includes(v.vehicleType)).length;
      if (vehicleCount === 0) continue;
      lines.push({ item, vehicleCount, totalQty: item.qtyPerVehicle * vehicleCount });
    }
    lines.sort((a, b) => {
      const orderDiff = CATEGORY_ORDER[a.item.category] - CATEGORY_ORDER[b.item.category];
      if (orderDiff !== 0) return orderDiff;
      return a.item.name.localeCompare(b.item.name, 'th');
    });
    return lines;
  },

  // รายการอะไหล่ของรถชุดหนึ่ง + ทับด้วยการแก้มือ (plan.itemAdj)
  // แยกจาก deriveItems() เพื่อให้หน้า กบค. และหน้าฝ่ายพัสดุเห็นตัวเลขชุดเดียวกัน
  linesFor(vehicles, master, adj) {
    adj = adj || {};
    const lines = this.deriveItems(vehicles, master.items);
    const autoIds = new Set(lines.map(l => l.item.id));

    Object.keys(adj).forEach(id => {
      if (!adj[id] || !adj[id].added || autoIds.has(id)) return;
      const item = master.items.find(i => i.id === id);
      if (item) lines.push({ item, vehicleCount: vehicles.length, totalQty: 0 });
    });

    return lines
      .filter(l => !(adj[l.item.id] || {}).off)
      .map(l => {
        const a = adj[l.item.id] || {};
        const per = a.qty != null ? a.qty : l.item.qtyPerVehicle;
        return { ...l, perVehicle: per, totalQty: per * l.vehicleCount,
                 edited: a.qty != null, manual: !!a.added };
      });
  },

  // ----- ยอดคงเหลือจาก Smart Inventory -----
  // เจ้าของงานสั่ง 17 ส.ค. 2569: "อยากให้ระบบแสดงอะไหล่คงเหลือจาก smart inventory ให้ด้วย"
  // ⚠️ ยังไม่ได้ต่อ API จริง — ยอดคงเหลือเป็นข้อมูลจำลอง คงที่ต่อ item (ไม่ใช้ random
  // เพื่อให้เดโมซ้ำได้ผลเดิม) · จงใจให้บางรายการไม่พอ จะได้เห็นสถานะครบทุกแบบ
  // ของจริงต้องดึงยอดตามคลัง/หน่วยงาน ณ เวลาที่เปิดดู และคงมี lead time สั่งซื้อด้วย
  STOCK_ON_HAND: {
    p1: 24,    // ผ้าเบรก (ชุด)
    p2: 8,     // สายไฮดรอลิก (เส้น) — มักไม่พอ
    o1: 400,   // น้ำมันเครื่อง (ลิตร)
    o2: 30,    // น้ำมันเฟือง (ลิตร) — มักไม่พอ
    o3: 260,   // น้ำมันไฮดรอลิก (ลิตร)
    f1: 40,    // ไส้กรองน้ำมันเครื่อง (ชิ้น)
    f2: 12,    // ไส้กรองไฮดรอลิก (ชิ้น) — มักไม่พอ
    f3: 18,    // ไส้กรองอากาศ (ชิ้น)
  },

  stockOnHand(itemId) {
    const v = this.STOCK_ON_HAND[itemId];
    return v == null ? null : v;   // null = Smart Inventory ไม่มีข้อมูลของรายการนี้
  },

  // เทียบยอดที่ต้องใช้กับยอดคงเหลือ → บอกว่าพอไหม ขาดเท่าไหร่
  // คืน level ไว้ให้หน้าจอ map เป็นสีป้าย ไม่ให้แต่ละหน้าไปตัดสินเกณฑ์เอง
  stockStatus(itemId, needQty) {
    const have = this.stockOnHand(itemId);
    if (have == null) return { level: 'unknown', have: null, short: 0, text: 'ไม่มีข้อมูลคลัง' };
    const short = Math.max(0, needQty - have);
    if (short > 0) return { level: 'short', have, short, text: `ขาด ${short.toLocaleString('th-TH')}` };
    // เหลือหลังเบิกไม่ถึง 20% ของที่ต้องใช้ = เฉียดฉิว ควรเตือนให้สั่งเพิ่ม
    if (have - needQty < needQty * 0.2) return { level: 'tight', have, short: 0, text: 'พอ แต่เหลือน้อย' };
    return { level: 'ok', have, short: 0, text: 'พอ' };
  },

  // สรุปทั้งแผน — ใช้ขึ้นกล่องเตือนหัวตาราง
  stockSummary(lines) {
    const short = lines.filter(l => this.stockStatus(l.item.id, l.totalQty).level === 'short');
    const tight = lines.filter(l => this.stockStatus(l.item.id, l.totalQty).level === 'tight');
    return { short, tight };
  },

  // รายการอะไหล่ของทั้งแผน
  planLines(plan, master) {
    const vehicles = master.vehicles.filter(v => (plan.selectedVehicleIds || []).includes(v.id));
    return { vehicles, lines: this.linesFor(vehicles, master, plan.itemAdj) };
  },

  // ----- ยืนยันรถเข้าร่วมแผน (CF) -----
  // สถานะ/การเข้าทริป คำนวณจาก plan.confirm อย่างเดียว — pure ทั้งหมด
  // todayIso = 'YYYY-MM-DD' (ปี พ.ศ. ให้ตรงกับ <input type="date"> ที่ต้นแบบใช้)
  // เทียบวันด้วย string compare ได้เพราะรูปแบบ zero-padded เรียงตามลำดับเวลาอยู่แล้ว

  emptyConfirmEntry() {
    return { answer: 'pending', reason: '', meetPoint: '', by: '', at: '',
             history: [], verdict: null, verdictWhy: '', verdictAt: '' };
  },

  // สร้างโครงในหน่วยความจำเฉยๆ — ไม่เขียน storage (เขียนตอนกดส่งคำขอเท่านั้น)
  ensureConfirm(plan) {
    if (!plan.confirm) {
      plan.confirm = { requestedAt: null, dueAt: null, remindedAt: null, byVehicle: {} };
    }
    if (!plan.confirm.byVehicle) plan.confirm.byVehicle = {};
    return plan.confirm;
  },

  vehicleConfirm(plan, vehicleId) {
    const c = plan.confirm;
    return (c && c.byVehicle && c.byVehicle[vehicleId]) || this.emptyConfirmEntry();
  },

  confirmStatus(plan, vehicleId, todayIso) {
    const e = this.vehicleConfirm(plan, vehicleId);
    if (e.answer === 'ready' || e.answer === 'notready') return e.answer;
    const due = plan.confirm && plan.confirm.dueAt;
    // ยังไม่ส่งคำขอ (ไม่มี dueAt) → ยังไม่เริ่มนับ ไม่ใช่เลยกำหนด
    if (due && todayIso && todayIso > due) return 'overdue';
    return 'pending';
  },

  // verdict ของ กบค. ชนะคำตอบของหน่วยงานเสมอ
  isVehicleIn(plan, vehicleId) {
    const e = this.vehicleConfirm(plan, vehicleId);
    if (e.verdict === 'drop' || e.verdict === 'defer') return false;
    if (e.verdict === 'keep') return true;
    return e.answer === 'ready';
  },

  // มีข้อสรุปแล้ว = ตอบว่าพร้อม หรือ กบค. ตัดสินแล้ว
  confirmResolved(plan, vehicleIds) {
    return (vehicleIds || []).every(id => {
      const e = this.vehicleConfirm(plan, id);
      return e.answer === 'ready' || e.verdict !== null;
    });
  },

  confirmSummary(plan, vehicleIds, todayIso) {
    const out = { total: 0, ready: 0, waiting: 0, notready: 0, overdue: 0, joining: 0 };
    (vehicleIds || []).forEach(id => {
      out.total++;
      const st = this.confirmStatus(plan, id, todayIso);
      if (st === 'ready') out.ready++;
      else if (st === 'notready') out.notready++;
      else if (st === 'overdue') out.overdue++;
      else out.waiting++;
      if (this.isVehicleIn(plan, id)) out.joining++;
    });
    return out;
  },

  // ยืนยันแผนเดินทางแล้ว = ล็อกการแก้คำตอบ (เคาะกับเจ้าของงาน 10 ส.ค. 2569)
  confirmLocked(plan) {
    return plan.travelConfirmed === true;
  },

  // ----- แผนเดินทาง: หลายใบต่อหนึ่งแผนบำรุงรักษา (เคาะ 10 ส.ค. 2569) -----
  // "การสร้างจะอิสระ หมายถึงเลือกรถได้ เลือกแผน" — ใบไม่ผูกกับจังหวัด กบค. จัดเอง
  // trip = { id, name, location, windowFrom, windowTo, perDiem, lodging, travel,
  //          mode:'self'|'vendor', vendorId, hireCost, staff:[ชื่อพนักงาน กบค.],
  //          vehicleIds:[], dates:{[vehicleId]:'YYYY-MM-DD'},
  //          jobs:{[vehicleId]:{change,inspect}}, places:{[vehicleId]:'สถานที่'},
  //          sentAt, replies:{ [ownerDept]: {status,reason,by,at,history:[]} } }
  // วันนัดอยู่ระดับ "รายคัน" · ช่วงเวลาอยู่ระดับ "ใบ" · การตอบรับอยู่ระดับ "ใบ × หน่วยงาน"
  // (ใบหนึ่งอาจมีรถของหลายหน่วยงาน แต่ละหน่วยงานตอบเฉพาะรถของตัวเอง)

  emptyTrip(id, name) {
    return { id, name: name || '', location: '', windowFrom: '', windowTo: '',
             perDiem: 0, lodging: 0, travel: 0,
             mode: 'self',           // 'self' = กบค. ตรวจเอง · 'vendor' = จ้างผู้รับจ้าง
             vendorId: null,         // ผู้รับจ้างที่ถูก assign ให้ใบนี้ (เมื่อ mode='vendor')
             hireCost: 0,            // ค่าจ้างเหมาของใบนี้ (แทนเบี้ยเลี้ยง/ที่พัก/เดินทาง)
             staff: ['', ''],        // พนักงาน กบค. ที่ออกไปซ่อม — ปกติ 2-3 คน (เมื่อ mode='self')
             staffPerDiem: [0, 0],   // ค่าเบี้ยเลี้ยงรายคน (index ตรงกับ staff) — perDiem ของใบ = ผลรวมของอาร์เรย์นี้
             vehicleIds: [], dates: {},
             jobs: {},               // { [vehicleId]: { change:bool, inspect:bool } }
             places: {},             // { [vehicleId]: 'สถานที่บำรุงรักษา' } — ว่าง = ใช้ default
             sentAt: null, replies: {} };
  },

  // งานที่ทำได้ต่อรถ 1 คัน — เลือกอย่างเดียวหรือทั้งสองก็ได้ (เจ้าของงาน 17 ส.ค. 2569)
  TRIP_JOBS: [
    { id: 'change',  label: 'เปลี่ยนถ่ายน้ำมันไฮดรอลิก' },
    { id: 'inspect', label: 'ตรวจน้ำมันไฮดรอลิก' },
  ],

  // ตั้งต้นติ๊กทั้งสองงาน — ส่วนใหญ่ไปทำทั้งคู่ คนทำแผนค่อยติ๊กออกเฉพาะคันที่ทำอย่างเดียว
  tripJobsOf(trip, vehicleId) {
    const j = (trip.jobs || {})[vehicleId];
    return j || { change: true, inspect: true };
  },

  tripJobsText(trip, vehicleId) {
    const j = this.tripJobsOf(trip, vehicleId);
    const on = this.TRIP_JOBS.filter(x => j[x.id]).map(x => x.label);
    return on.length ? on.join(' + ') : 'ยังไม่เลือกงาน';
  },

  // สถานที่บำรุงรักษาตั้งต้นของรถคันหนึ่ง (เจ้าของงาน 17 ส.ค. 2569)
  //   รถของหน่วยงานระดับจังหวัด/สาขา → จังหวัดที่สังกัด
  //   รถของเขต (ownerLevel='region') → เขตที่อยู่
  defaultPlaceOf(vehicle) {
    if (!vehicle) return '';
    return vehicle.ownerLevel === 'region' ? `กรย. เขต ${vehicle.region}` : vehicle.province;
  },

  tripPlaceOf(trip, vehicle) {
    const set = (trip.places || {})[vehicle.id];
    return set != null && set !== '' ? set : this.defaultPlaceOf(vehicle);
  },

  // ใบนี้พร้อมส่งไหม (นอกจากวันนัด/ช่วงเวลาเดิม) — ต้องมีพนักงานอย่างน้อย 1 คน
  // และทุกคันต้องเลือกงานอย่างน้อย 1 อย่าง ไม่งั้นส่งไปหน่วยงานก็ไม่รู้ว่าจะทำอะไร
  // ================= เฟส 3 · ตรวจสภาพก่อนบำรุงรักษา =================
  // รายการตรวจ 23 ข้อตามแบบฟอร์มกระดาษของ กบค. (เจ้าของงานส่งภาพแบบฟอร์มมา 20 ส.ค. 2569)
  // เป็นค่าตั้งต้นของรถทุกคัน — เพิ่มรายการเองได้รายคัน
  INSPECT_ITEMS: [
    'ชุดเกียร์ PTO',
    'ปั๊มน้ำมันไฮดรอลิค',
    'น้ำมันและกรองไฮดรอลิค',
    'ชุดกระบอกขาช้างหน้า ซ้าย ขวา',
    'ชุดกระบอกขาช้างหลัง ซ้าย ขวา',
    'ชุด CONTROL ด้านล่าง, ด้านบน',
    'สายไฮดรอลิค, สายสัญญาณต่างๆ',
    'ชุดโรตารี่',
    'น้ำมันหล่อลื่นชุดหมุนฐานเครน',
    'ชุดมอเตอร์หมุนฐานเครน',
    'ชุดเฟืองหมุนฐานเครน',
    'ชุดกระบอก UPPER BOOM',
    'ชุดกระบอก LOWER BOOM',
    'ชุดกระบอก EXTENSION',
    'ชุดปรับดิ่งกระเช้า',
    'ชุดปรับการหมุนของใบกระเช้า',
    'ชุดวาล์วล็อคต่างๆ',
    'BUCKET, LINER',
    'รอกและเชือกวินซ์',
    'ชุด LIFT รุ่น 115 kV',
    'การอัดและเคลือบจารบีตามจุดต่างๆ',
    'ชุดยึดฐานเครน',
    'เกจวัดต่างๆ',
  ],

  // ใบตรวจของรถ 1 คัน — สร้างตอนเปิดครั้งแรก แล้วเก็บใน plan.inspections[vehicleId]
  ensureInspection(plan, vehicleId) {
    plan.inspections = plan.inspections || {};
    let f = plan.inspections[vehicleId];
    if (!f) {
      f = plan.inspections[vehicleId] = {
        deliverBy: '', receiveBy: '',           // ผู้ส่งมอบรถ · ผู้รับมอบ (กบค.)
        signedDeliverAt: '', signedReceiveAt: '',
        items: this.INSPECT_ITEMS.map(name => ({ name, result: null, note: '' })),
      };
    }
    if (!Array.isArray(f.items)) f.items = this.INSPECT_ITEMS.map(name => ({ name, result: null, note: '' }));
    return f;
  },

  // ตรวจครบ = ทุกรายการเลือก มี/ไม่มี แล้ว และลงนามครบทั้งสองฝั่ง
  inspectionDone(plan, vehicleId) {
    const f = (plan.inspections || {})[vehicleId];
    if (!f) return false;
    if (!f.signedDeliverAt || !f.signedReceiveAt) return false;
    return (f.items || []).length > 0 && (f.items || []).every(x => x.result === 'yes' || x.result === 'no');
  },

  // ผู้ส่งมอบรถฝั่งหน่วยงานเจ้าของรถ — ⚠️ ข้อมูลจำลอง ของจริงต้อง join กับทะเบียนพนักงาน
  // วนจากชื่อชุดเดียวโดยอิง id ของรถ เพื่อให้แต่ละคันได้ชุดชื่อคงที่ (ไม่สุ่มใหม่ทุกครั้งที่เรนเดอร์)
  DELIVERER_NAMES: [
    'นายอนุชิต ลิ้มกิมฮวย', 'นายสมพงษ์ ไชยวงศ์', 'นายวิรัตน์ ทองสุข',
    'นายประยุทธ์ แก้วมณี', 'นายธนากร ศรีสมบัติ', 'นายเอกชัย พูลทรัพย์',
  ],

  deliverersOf(vehicle) {
    const n = this.DELIVERER_NAMES.length;
    const seed = String(vehicle.id || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return [0, 1, 2].map(k => this.DELIVERER_NAMES[(seed + k) % n]);
  },

  // ใบเดินทางที่รถคันนี้อยู่ — ใช้ดึงรายชื่อพนักงาน กบค. มาเป็นตัวเลือก "ผู้รับมอบ"
  tripOfVehicle(plan, vehicleId) {
    return this.ensureTrips(plan).find(t => (t.vehicleIds || []).includes(vehicleId)) || null;
  },

  tripStaffList(trip) {
    return (trip.staff || []).map(x => (x || '').trim()).filter(Boolean);
  },

  // จำนวนวันของใบ — นับรวมวันแรกและวันสุดท้าย (4–8 พ.ย. = 5 วัน)
  // วันที่เก็บเป็น พ.ศ. ทั้งคู่ ผลต่างจึงถูกต้องแม้ปีไม่ใช่ ค.ศ. · ยังไม่ครบช่วง = 0 วัน
  tripDays(trip) {
    if (!trip.windowFrom || !trip.windowTo) return 0;
    const a = new Date(trip.windowFrom + 'T00:00:00');
    const b = new Date(trip.windowTo + 'T00:00:00');
    if (isNaN(a) || isNaN(b)) return 0;
    const n = Math.round((b - a) / 86400000) + 1;
    return n > 0 ? n : 0;
  },

  // อัตราเบี้ยเลี้ยง "ต่อวัน" รวมทุกคนในใบ
  tripPerDiemPerDay(trip) {
    return (trip.staffPerDiem || []).reduce((n, v) => n + (Number(v) || 0), 0);
  },

  // ค่าเบี้ยเลี้ยงของใบ = (ผลรวมอัตรารายวันของทุกคน) × จำนวนวันของใบ
  tripPerDiemSum(trip) {
    return this.tripPerDiemPerDay(trip) * this.tripDays(trip);
  },

  // ใบเก่าที่มีแต่ยอดรวม `perDiem` ยังไม่มี `staffPerDiem` — เกลี่ยยอดเดิมลงรายคนให้ผลรวมเท่าเดิม
  // (คนแรกรับเศษ) เรียกก่อนเรนเดอร์ทุกครั้ง ปลอดภัยกับใบที่มีข้อมูลอยู่แล้ว
  ensureTripPerDiem(trip) {
    const n = (trip.staff || ['']).length;
    if (!Array.isArray(trip.staffPerDiem)) trip.staffPerDiem = [];
    if (trip.staffPerDiem.length !== n) {
      const had = trip.staffPerDiem.length;
      if (!had && (trip.perDiem || 0) > 0 && n > 0) {
        // ของเดิม perDiem เป็น "ยอดรวมทั้งใบ" → แปลงกลับเป็นอัตรารายวันต่อคน
        const days = this.tripDays(trip) || 1;
        const each = Math.round(trip.perDiem / (n * days));
        trip.staffPerDiem = Array.from({ length: n }, () => each);
      } else {
        trip.staffPerDiem = Array.from({ length: n }, (_, i) => Number(trip.staffPerDiem[i]) || 0);
      }
    }
    trip.perDiem = this.tripPerDiemSum(trip);
    return trip;
  },

  tripJobsIncomplete(trip) {
    return (trip.vehicleIds || []).filter(id => {
      const j = this.tripJobsOf(trip, id);
      return !j.change && !j.inspect;
    });
  },

  // สร้างโครงในหน่วยความจำเฉยๆ — ไม่เขียน storage
  ensureTrips(plan) {
    if (!Array.isArray(plan.trips)) plan.trips = [];
    return plan.trips;
  },

  getTrip(plan, tripId) {
    return this.ensureTrips(plan).find(t => t.id === tripId) || null;
  },

  // รถที่ผ่านขั้นยืนยันแล้ว แต่ยังไม่ถูกจัดเข้าใบไหนเลย — ต้องเป็น 0 ถึงจะทำแผนครบ
  // **นับเฉพาะรถที่อยู่ในไตรมาสจริง Q1–Q4** ไม่รวมถัง 'none' (พักไว้ยังไม่ระบุไตรมาส)
  // เพราะ "พักไว้" = ยังไม่เข้าแผนเดินทางรอบนี้ (เจ้าของงานเคาะ 20 ส.ค. 2569)
  // เดิมอ่านจาก selectedVehicleIds ซึ่งรวมถัง none ด้วย ⇒ รถที่พักไว้ทำให้ขั้น 3 จบไม่ได้ถาวร
  // (แท็บในขั้น 3 มีแค่ Q1–Q4 จึงไม่มีทางจัดรถถังนั้นเข้าใบได้เลย)
  unassignedVehicleIds(plan) {
    this.ensurePlanQuarters(plan);
    const inTrips = new Set(this.ensureTrips(plan).flatMap(t => t.vehicleIds || []));
    const inQuarters = this.QUARTER_KEYS.flatMap(k => plan.byQuarter[k] || []);
    return [...new Set(inQuarters)]
      .filter(id => this.isVehicleIn(plan, id) && !inTrips.has(id));
  },

  // หน่วยงานเจ้าของรถที่มีรถอยู่ในใบนี้ — คือชุดคนที่ต้องตอบรับ
  tripDepts(trip, master) {
    const byId = new Map(master.vehicles.map(v => [v.id, v]));
    return [...new Set((trip.vehicleIds || [])
      .map(id => (byId.get(id) || {}).ownerDept)
      .filter(Boolean))].sort((a, b) => a.localeCompare(b, 'th'));
  },

  tripReply(trip, dept) {
    return (trip.replies || {})[dept] || { status: 'pending', reason: '', by: '', at: '', history: [] };
  },

  // 'draft'    = ยังไม่ส่ง
  // 'waiting'  = ส่งแล้ว ยังตอบไม่ครบ
  // 'rejected' = มีอย่างน้อย 1 หน่วยงานปฏิเสธ (กบค. ต้องแก้แล้วส่งใหม่)
  // 'accepted' = ทุกหน่วยงานตอบรับครบ
  tripStatus(trip, master) {
    if (!trip.sentAt) return 'draft';
    const depts = this.tripDepts(trip, master);
    if (!depts.length) return 'draft';
    const st = depts.map(d => this.tripReply(trip, d).status);
    if (st.includes('rejected')) return 'rejected';
    return st.every(s => s === 'accepted') ? 'accepted' : 'waiting';
  },

  // วันนัดต้องอยู่ในช่วงที่ กบค. เสนอเท่านั้น (เทียบ string ได้เพราะรูปแบบ zero-padded)
  dateInWindow(trip, d) {
    if (!d) return false;
    if (trip.windowFrom && d < trip.windowFrom) return false;
    if (trip.windowTo && d > trip.windowTo) return false;
    return true;
  },

  // ใบพร้อมส่ง = มีสถานที่ · มีช่วงวัน · มีรถ
  // **ไม่บังคับวันนัดรายคัน** — กบค. เสนอแค่ "ช่วงเวลา" ส่วนวันจริงของแต่ละคัน
  // หน่วยงานเจ้าของรถเป็นคนเลือกเองตอนตอบรับ (confirm.js) ภายในช่วงนี้
  tripReadyToSend(trip) {
    if (!trip.location || !trip.location.trim()) return false;
    if (!trip.windowFrom || !trip.windowTo || trip.windowFrom > trip.windowTo) return false;
    if (!(trip.vehicleIds || []).length) return false;
    return true;
  },

  // ขั้นแผนเดินทางจบเมื่อ: จัดรถเข้าใบครบทุกคัน + ทุกใบได้รับการตอบรับ
  travelPlanReady(plan, master) {
    const trips = this.ensureTrips(plan);
    if (!trips.length) return false;
    if (this.unassignedVehicleIds(plan).length) return false;
    return trips.every(t => this.tripStatus(t, master) === 'accepted');
  },

  // ================= ปฏิทินปีงบ + รอบทบทวนแผน =================
  // ทั้งหมดเป็น pure — รับปี/เดือนเข้ามา ไม่เรียก Date เอง (กติกาหัวไฟล์)
  // นาฬิกา (ของจริงหรือที่จำลองไว้) อยู่ฝั่ง browser: common.js simNow()/fiscalNow()
  //
  // ปีงบประมาณ ต.ค.–ก.ย. · แผนทำล่วงหน้า 2 ปี (เจ้าของงาน 17 ส.ค. 2569):
  //   ทำแผนในปีงบ 2569 → ได้แผนของปีงบ 2571
  //   ระหว่างนั้นมี "รอบทบทวน" ทุกปลายปีงบ (ไตรมาส 4 = ก.ค.–ก.ย.)
  //   คือปลายปีงบ 2569 และปลายปีงบ 2570 รวม 2 รอบ ก่อนแผนมีผลจริง
  //   รอบทบทวน = สรุปแผนก่อนออกปฏิบัติงาน (ไม่ใช่แค่ดูเฉยๆ — แก้รถ/ไตรมาสได้)
  PLAN_LEAD_YEARS: 2,
  REVISE_MONTHS: [7, 8, 9],   // ไตรมาส 4 ของปีงบ = ปลายปี

  // เดือน 1-12 (ปฏิทินปกติ) + พ.ศ. ปฏิทิน → พ.ศ. ปีงบ
  fiscalYearOf(buddhistYear, month) {
    return month >= 10 ? buddhistYear + 1 : buddhistYear;
  },

  planningYearFrom(fyNow) {
    return fyNow + this.PLAN_LEAD_YEARS;
  },

  // รอบทบทวนของแผนใบหนึ่ง — ปลายปีงบ ตั้งแต่ปีถัดจากปีที่ทำแผน ถึงปีก่อนแผนมีผล
  // เริ่มที่ createdFY + 1 ไม่ใช่ createdFY เพราะถ้าทำแผนช่วง ก.ค.–ก.ย. (= ปลายปีงบพอดี)
  // แผนที่เพิ่งสร้างเสร็จจะเด้งเข้ารอบ "ทบทวน" ของตัวเองทันที ซึ่งไม่มีอะไรให้ทบทวน
  // ⇒ แผนทำปีงบ 2569 ใช้ปี 2571 จะมีรอบทบทวนรอบเดียว: ปลายปีงบ 2570
  reviseRoundsFor(plan) {
    const from = (plan.createdFY || (plan.year - this.PLAN_LEAD_YEARS)) + 1;
    const out = [];
    for (let fy = from; fy <= plan.year - 1; fy++) {
      out.push({ no: out.length + 1, fy, label: `ปลายปีงบ ${fy} (ก.ค.–ก.ย. ${fy})` });
    }
    return out;
  },

  // อยู่ในช่วงทบทวนไหม — คืน round ที่ตรง หรือ null
  reviseRoundNow(plan, fyNow, month) {
    if (!this.REVISE_MONTHS.includes(month)) return null;
    return this.reviseRoundsFor(plan).find(r => r.fy === fyNow) || null;
  },

  reviseDoneFor(plan, fy) {
    return (plan.revisions || []).some(r => r.fy === fy);
  },

  // สถานะของแผนเทียบกับเวลา — ใช้ตัดสินว่าหน้าไหนโชว์ปุ่มอะไร
  planStage(plan, fyNow, month) {
    if (!plan.workNumber) return 'drafting';           // ยังไม่ออกเลขงาน
    if (fyNow > plan.year) return 'past';              // ปีงบผ่านไปแล้ว
    if (fyNow === plan.year) return 'active';          // ถึงปีที่แผนมีผล → ออกปฏิบัติงาน
    const round = this.reviseRoundNow(plan, fyNow, month);
    if (round && !this.reviseDoneFor(plan, round.fy)) return 'revising';  // ถึงรอบทบทวน ยังไม่สรุป
    if (round) return 'revised';                       // ทบทวนรอบนี้เสร็จแล้ว
    return 'scheduled';                                // ยังไม่ถึงรอบทบทวน
  },

  // เทียบแผนก่อน/หลังทบทวน — ใช้บันทึกว่ารอบนั้นเปลี่ยนอะไรบ้าง
  diffPlan(before, after) {
    const bAll = new Set(before.selectedVehicleIds || []);
    const aAll = new Set(after.selectedVehicleIds || []);
    const added = [...aAll].filter(id => !bAll.has(id));
    const removed = [...bAll].filter(id => !aAll.has(id));
    const moved = [];
    this.BUCKET_KEYS.forEach(k => {
      (after.byQuarter[k] || []).forEach(id => {
        if (!bAll.has(id)) return;
        const wasIn = this.BUCKET_KEYS.find(kk => (before.byQuarter[kk] || []).includes(id));
        if (wasIn && wasIn !== k) moved.push({ id, from: wasIn, to: k });
      });
    });
    return { added, removed, moved };
  },

  // ปิดรอบทบทวน: บันทึกเวอร์ชัน + สิ่งที่เปลี่ยน (เลขงานคงเดิม)
  commitRevision(plan, before, round, at) {
    const diff = this.diffPlan(before, plan);
    plan.revisions = [...(plan.revisions || []), {
      no: (plan.revisions || []).length + 1,
      fy: round.fy,
      at,
      added: diff.added.length,
      removed: diff.removed.length,
      moved: diff.moved.length,
      byQuarter: deepCopy(plan.byQuarter),
    }];
    return plan.revisions[plan.revisions.length - 1];
  },

  // ================= รถรายไตรมาสในแผน =================
  // แผน 1 ใบครอบทั้งปี · รถแต่ละคันอยู่ได้ถังเดียว: Q1–Q4 หรือ none (ยังไม่ระบุไตรมาส)
  // ทุกการเขียนต้องผ่าน setQuarterVehicles/assignVehicle เพื่อให้ selectedVehicleIds
  // (ผลรวมที่หน้าปลายน้ำใช้) ตรงกับถังเสมอ
  QUARTER_KEYS: ['Q1', 'Q2', 'Q3', 'Q4'],

  // ป้ายไตรมาสที่แสดงบนหน้าจอ — เจ้าของงานสั่ง 17 ส.ค. 2569 ให้ใช้ "ไตรมาส 1"
  // ไม่ใช่ "Q1" · คีย์ในข้อมูลและ "เลขงาน" (MT-2569-Q1-001) ยังเป็น Q1 เหมือนเดิม
  // เพราะเป็นรหัส ไม่ใช่ข้อความให้คนอ่าน ⇒ แปลงที่จุดแสดงผลเท่านั้น
  quarterLabel(q) {
    if (q === 'none') return 'ยังไม่ระบุไตรมาส';
    return this.QUARTER_KEYS.includes(q) ? `ไตรมาส ${q.replace('Q', '')}` : q;
  },
  BUCKET_KEYS:  ['Q1', 'Q2', 'Q3', 'Q4', 'none'],

  // เรียกก่อนอ่าน/เขียนถังเสมอ — เติมถังที่ขาด + ย้ายแผนเก่าเข้าโครงใหม่
  ensurePlanQuarters(plan) {
    if (!plan.byQuarter || typeof plan.byQuarter !== 'object') plan.byQuarter = {};
    this.BUCKET_KEYS.forEach(k => {
      if (!Array.isArray(plan.byQuarter[k])) plan.byQuarter[k] = [];
    });
    // แผนเก่า (ก่อน 17 ส.ค. 2569) เก็บรถเป็นก้อนเดียว + ไตรมาสของทั้งแผน
    // ⇒ ยกเข้าไตรมาสนั้น ถ้าไม่เคยเลือกไตรมาสก็ไปกองที่ none ให้คนมาจัดต่อ
    const already = this.BUCKET_KEYS.some(k => plan.byQuarter[k].length);
    if (!already && Array.isArray(plan.selectedVehicleIds) && plan.selectedVehicleIds.length) {
      const target = this.QUARTER_KEYS.includes(plan.quarter) ? plan.quarter : 'none';
      plan.byQuarter[target] = [...plan.selectedVehicleIds];
    }
    this.syncPlanVehicles(plan);
    return plan;
  },

  // selectedVehicleIds = ผลรวมทุกถัง (derived) — หน้าปลายน้ำอ่านตัวนี้ตัวเดียวพอ
  syncPlanVehicles(plan) {
    const seen = new Set();
    this.BUCKET_KEYS.forEach(k => (plan.byQuarter[k] || []).forEach(id => seen.add(id)));
    plan.selectedVehicleIds = [...seen];
    return plan.selectedVehicleIds;
  },

  planVehicleIds(plan, bucket) {
    this.ensurePlanQuarters(plan);
    if (bucket == null) return [...plan.selectedVehicleIds];
    return [...(plan.byQuarter[bucket] || [])];
  },

  // รถคันนี้อยู่ถังไหนของแผน — null = ยังไม่อยู่ในแผนเลย
  bucketOf(plan, vehicleId) {
    this.ensurePlanQuarters(plan);
    return this.BUCKET_KEYS.find(k => plan.byQuarter[k].includes(vehicleId)) || null;
  },

  // ตั้งรายชื่อรถของถังหนึ่งทั้งชุด — คันที่ใส่เข้ามาจะถูกถอดออกจากถังอื่นให้เอง
  // (รถคันเดียวอยู่สองไตรมาสพร้อมกันไม่ได้ ไม่งั้นยอดอะไหล่จะนับซ้ำ)
  setQuarterVehicles(plan, bucket, ids) {
    this.ensurePlanQuarters(plan);
    const incoming = new Set(ids);
    this.BUCKET_KEYS.forEach(k => {
      if (k === bucket) return;
      plan.byQuarter[k] = plan.byQuarter[k].filter(id => !incoming.has(id));
    });
    plan.byQuarter[bucket] = [...incoming];
    this.syncPlanVehicles(plan);
    return plan;
  },

  // ย้ายรถคันเดียว — bucket = null คือเอาออกจากแผนไปเลย
  assignVehicle(plan, vehicleId, bucket) {
    this.ensurePlanQuarters(plan);
    this.BUCKET_KEYS.forEach(k => {
      plan.byQuarter[k] = plan.byQuarter[k].filter(id => id !== vehicleId);
    });
    if (bucket) plan.byQuarter[bucket].push(vehicleId);
    this.syncPlanVehicles(plan);
    return plan;
  },

  // เงื่อนไขไปขั้นถัดไป: ทุกไตรมาสต้องมีรถอย่างน้อย 1 คัน (ถัง none ไม่นับ)
  quartersComplete(plan) {
    this.ensurePlanQuarters(plan);
    return this.QUARTER_KEYS.every(q => plan.byQuarter[q].length > 0);
  },

  quartersMissing(plan) {
    this.ensurePlanQuarters(plan);
    return this.QUARTER_KEYS.filter(q => plan.byQuarter[q].length === 0);
  },

  // ---- ผู้รับจ้าง: เลือกได้รายใบเดินทาง (เจ้าของงานเคาะ 17 ส.ค. 2569) ----
  VENDORS: SEED_VENDORS,

  vendorById(id) {
    return SEED_VENDORS.find(v => v.id === id) || null;
  },

  // ผู้รับจ้างที่รับงานในภาคของรถในใบนี้ — ใบที่มีรถข้ามภาคจะเหลือเฉพาะรายที่ครอบทุกภาค
  vendorsForTrip(trip, master) {
    const byId = new Map(master.vehicles.map(v => [v.id, v]));
    const zones = [...new Set((trip.vehicleIds || [])
      .map(id => byId.get(id)).filter(Boolean).map(v => regionZone(v.region)))];
    if (!zones.length) return SEED_VENDORS;
    return SEED_VENDORS.filter(vd => zones.every(z => vd.zones.includes(z)));
  },

  tripVendor(trip) {
    return trip.mode === 'vendor' ? this.vendorById(trip.vendorId) : null;
  },

  // ค่าใช้จ่ายของใบ — คนละชุดกันตามโหมด (ตรวจเอง = เบี้ยเลี้ยง+ที่พัก+เดินทาง · จ้าง = ค่าจ้างเหมา)
  tripCost(trip) {
    return trip.mode === 'vendor'
      ? (trip.hireCost || 0)
      : (trip.perDiem || 0) + (trip.lodging || 0) + (trip.travel || 0);
  },

  // ใบพร้อมส่งไหมในแง่ "ใครไปทำ" — ตรวจเองต้องมีชื่อพนักงาน · จ้างต้องเลือกผู้รับจ้าง
  tripDoerReady(trip) {
    return trip.mode === 'vendor' ? !!trip.vendorId : this.tripStaffList(trip).length > 0;
  },

  // ---- ข้อมูลระบุตัวรถตามแบบฟอร์มตรวจสภาพ (เจ้าของงานส่งฟอร์มจริงมา 17 ส.ค. 2569) ----
  RIG_LABEL_BY_TYPE,

  rigLabelOf(vehicle) {
    return RIG_LABEL_BY_TYPE[vehicle.vehicleType] || 'อุปกรณ์';
  },

  plateFull(vehicle) {
    return vehicle.plateProvince ? `${vehicle.plate} ${vehicle.plateProvince}` : vehicle.plate;
  },

  // รายการฟิลด์หัวฟอร์ม เรียงตามแบบฟอร์มจริง — ใช้เรนเดอร์กล่องรายละเอียดรถ
  // คืน [{label, value}] เพื่อให้หน้าจอไม่ต้องรู้ว่าฟิลด์ไหนมาจากไหน
  vehicleIdentityRows(vehicle) {
    const rig = this.rigLabelOf(vehicle);
    return [
      { label: 'ยี่ห้อรถยนต์',        value: vehicle.truckBrand || '—' },
      { label: 'รุ่นรถยนต์',          value: vehicle.truckModel || '—' },
      { label: 'รหัส',               value: vehicle.assetCode || '—' },
      { label: 'ทะเบียน',            value: this.plateFull(vehicle) },
      { label: `ยี่ห้อ${rig}`,        value: vehicle.rigBrand || '—' },
      { label: `รุ่น${rig}`,          value: vehicle.rigModel || '—' },
      { label: 'หมายเลข (S/N)',      value: vehicle.serialNo || '—' },
      { label: 'ชั่วโมงการทำงาน',     value: `${(vehicle.engineHours || 0).toLocaleString('th-TH')} ชม.` },
      { label: 'หมายเลข HC',         value: vehicle.hcNo || '—' },
      { label: 'ใช้งานประจำที่',      value: vehicle.ownerDept || '—' },
    ];
  },

  // ข้อความเตือนของรถคันนี้ (ถ้ามี) — ไม่ได้ห้ามเลือก แค่บอกให้คนทำแผนรู้
  statusNote(vehicle) {
    return this.STATUS_NOTE[vehicle.status] || '';
  },

  // ไตรมาสตามปีงบประมาณ (ต.ค.–ก.ย.): ต.ค.=เดือน 10 → Q1
  // ผู้ทำแผนเลือกไตรมาสเองในขั้นที่ 1 — ตัวนี้เหลือไว้ 2 งาน: ทำป้าย "· ตอนนี้"
  // ในตัวเลือก และเติมค่าให้แผนร่างเก่าที่สร้างไว้ก่อนมีตัวเลือก
  // รับเลขเดือน 1-12 (ไม่รับ Date เพื่อให้ pure/เทสได้)
  quarterOfMonth(month) {
    if (month >= 10) return 'Q1';
    if (month <= 3) return 'Q2';
    if (month <= 6) return 'Q3';
    return 'Q4';
  },

  workNumber(quarter, year, seq) {
    return `MT-${year}-${quarter}-${String(seq).padStart(3, '0')}`;
  },

  // ออกเลขงานครบ 4 ใบพร้อมกัน — 1 ใบต่อไตรมาส (เจ้าของงานเคาะ 17 ส.ค. 2569)
  // ไตรมาสที่ไม่มีรถจะไม่ได้เลข แต่ตามกติกา "ต้องเลือกให้ครบ" จึงไม่ควรเกิด
  // seq ต่อไตรมาส = นับจากแผนที่ออกเลขไปแล้วในปีเดียวกัน (mock: ไม่มี counter กลาง)
  issueWorkNumbers(plan, seq) {
    this.ensurePlanQuarters(plan);
    const numbers = {};
    this.QUARTER_KEYS.forEach(q => {
      if (plan.byQuarter[q].length) numbers[q] = this.workNumber(q, plan.year, seq);
    });
    plan.workNumbers = numbers;
    plan.workNumber = numbers[this.QUARTER_KEYS.find(q => numbers[q])] || null;
    return numbers;
  },

  // เลขงานทุกใบของแผน เรียงตามไตรมาส — ใช้แสดงในลิสต์/เอกสาร
  workNumberList(plan) {
    return this.QUARTER_KEYS
      .filter(q => plan.workNumbers && plan.workNumbers[q])
      .map(q => ({ q, no: plan.workNumbers[q] }));
  },

  // ----- เงื่อนไข trigger ของ item (display only — ไม่คำนวณ due) -----
  triggerText(item) {
    if (item.triggerType === 'hours') return `ทุก ${item.interval} ชม.`;
    if (item.triggerType === 'mileage') return `ทุก ${item.interval} กม.`;
    return 'ตามรอบ (ไตรมาส)';
  },
};

if (typeof window !== 'undefined') window.MYD = MYD;
if (typeof module !== 'undefined') module.exports = MYD;
