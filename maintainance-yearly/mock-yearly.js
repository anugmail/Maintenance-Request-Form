// mock-yearly.js — data model + storage helpers + pure logic for the
// "งานบำรุงรักษาตามวาระ" (yearly maintenance) prototype.
// Works in both the browser (window.MYD) and node (module.exports = MYD)
// so the logic below (deriveItems / workNumber) can be unit-tested with
// node's built-in test runner without any bundler/build step.
//
// โครงข้อมูล (plain objects):
// vehicle: { id, plate, vehicleType, brand, chassis, ownerDept, criteria, region(1-12), status, mileage, engineHours }
// item:    { id, name, category, oilKind?, unit, appliesToTypes:[], qtyPerVehicle }
// plan:    { id, createdAt, phase, planName, selectedVehicleIds:[], itemAdj:{}, quarter, year,
//            workNumber, approvalStatus:'draft'|'issued',
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
const SCHEMA_VERSION = 8;   // 8 = แผนเดินทางเป็น "หลายใบ" (plan.trips[]) แทน travelPlan ใบเดียว

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
const BRANDS_BY_TYPE = {
  'รถเครน':   [
    { brand: 'TADANO TM-ZE304', chassis: 'HINO FM8J 6 ล้อ' },
    { brand: 'TADANO TM-ZE504', chassis: 'HINO FM8J' },
    { brand: 'UNIC URV554',     chassis: 'HINO XZU' },
  ],
  'รถกระเช้า': [
    { brand: 'AICHI SK17A',     chassis: 'ISUZU FTR' },
  ],
  'รถขุด':    [
    { brand: 'KOMATSU PC130-8', chassis: '—' },
  ],
};

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

function genSeedVehicles() {
  const types = ['รถกระเช้า', 'รถเครน', 'รถขุด'];
  const out = [];
  for (let r = 1; r <= 12; r++) {
    const count = 10 + (r % 3);
    for (let i = 1; i <= count; i++) {
      const t = types[(r + i) % 3];
      const bs = BRANDS_BY_TYPE[t];
      const b = bs[(r * 2 + i) % bs.length];  // ไม่ใช้ (r+i) เพราะชนกับสูตรเลือกชนิดรถ ทำให้ได้ยี่ห้อเดียว
      out.push({
        id: `v-${r}-${i}`,
        plate: `${String(r).padStart(2, '0')}-${1000 + r * 100 + i}`,
        vehicleType: t,
        brand: b.brand,
        chassis: b.chassis,
        ownerDept: OWNER_DEPTS_BY_REGION[r][i % OWNER_DEPTS_BY_REGION[r].length],
        criteria: (r + i) % 2 === 0 ? 'truck' : 'net',
        region: r,
        status: i % 7 === 0 ? 'transferred' : i % 5 === 0 ? 'pending_approval' : 'available',
        mileage: 40000 + ((r * 1000 + i * 137) % 120000),
        engineHours: 1500 + ((r * 97 + i * 53) % 5000),
      });
    }
  }
  return out;
}

const SEED_VEHICLES = genSeedVehicles();

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
  selectedVehicleIds: [],
  quarter: null,          // ผู้ทำแผนเลือกในขั้นที่ 1 (ปีงบประมาณ ต.ค.–ก.ย.) — 1 แผน = 1 ไทรมาส
  year: 2569,
  itemAdj: {},            // การแก้มือรายการอะไหล่ { [itemId]: {qty, off, added} }
  workNumber: null,
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
  selectedVehicleIds: [3, 4].flatMap(r => [1, 2, 3, 4, 5, 6].map(i => `v-${r}-${i}`)),
  itemAdj: {},
  quarter: 'Q1',
  year: 2569,
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
  selectedVehicleIds: CF_VEHICLE_IDS,
  itemAdj: {},
  quarter: 'Q1',
  year: 2569,
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
  STATUS_LABELS:   { available:'พร้อมเข้าแผน', pending_approval:'รออนุมัติ', transferred:'โอน' },
  CATEGORY_LABELS: { part:'อะไหล่', oil:'น้ำมัน', filter:'ไส้กรอง' },
  OILKIND_LABELS:  { engine:'น้ำมันเครื่อง', gear:'น้ำมันเฟือง', hydraulic:'น้ำมันไฮดรอลิก' },
  TRIGGER_LABELS:  { calendar:'ตามรอบ (ไทรมาส)', hours:'ชั่วโมงเครื่อง', mileage:'ระยะทาง' },

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
  //          vehicleIds:[], dates:{[vehicleId]:'YYYY-MM-DD'}, sentAt,
  //          replies:{ [ownerDept]: {status,reason,by,at,history:[]} } }
  // วันนัดอยู่ระดับ "รายคัน" · ช่วงเวลาอยู่ระดับ "ใบ" · การตอบรับอยู่ระดับ "ใบ × หน่วยงาน"
  // (ใบหนึ่งอาจมีรถของหลายหน่วยงาน แต่ละหน่วยงานตอบเฉพาะรถของตัวเอง)

  emptyTrip(id, name) {
    return { id, name: name || '', location: '', windowFrom: '', windowTo: '',
             perDiem: 0, lodging: 0, travel: 0,
             vehicleIds: [], dates: {}, sentAt: null, replies: {} };
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
  unassignedVehicleIds(plan) {
    const inTrips = new Set(this.ensureTrips(plan).flatMap(t => t.vehicleIds || []));
    return (plan.selectedVehicleIds || [])
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

  // ใบพร้อมส่ง = มีสถานที่ · มีช่วงวัน · มีรถ · และทุกคันมีวันนัดที่อยู่ในช่วง
  tripReadyToSend(trip) {
    if (!trip.location || !trip.location.trim()) return false;
    if (!trip.windowFrom || !trip.windowTo || trip.windowFrom > trip.windowTo) return false;
    if (!(trip.vehicleIds || []).length) return false;
    return (trip.vehicleIds || []).every(id => this.dateInWindow(trip, (trip.dates || {})[id]));
  },

  // ขั้นแผนเดินทางจบเมื่อ: จัดรถเข้าใบครบทุกคัน + ทุกใบได้รับการตอบรับ
  travelPlanReady(plan, master) {
    const trips = this.ensureTrips(plan);
    if (!trips.length) return false;
    if (this.unassignedVehicleIds(plan).length) return false;
    return trips.every(t => this.tripStatus(t, master) === 'accepted');
  },

  // ไทรมาสตามปีงบประมาณ (ต.ค.–ก.ย.): ต.ค.=เดือน 10 → Q1
  // ผู้ทำแผนเลือกไทรมาสเองในขั้นที่ 1 — ตัวนี้เหลือไว้ 2 งาน: ทำป้าย "· ตอนนี้"
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

  // ----- เงื่อนไข trigger ของ item (display only — ไม่คำนวณ due) -----
  triggerText(item) {
    if (item.triggerType === 'hours') return `ทุก ${item.interval} ชม.`;
    if (item.triggerType === 'mileage') return `ทุก ${item.interval} กม.`;
    return 'ตามรอบ (ไทรมาส)';
  },
};

if (typeof window !== 'undefined') window.MYD = MYD;
if (typeof module !== 'undefined') module.exports = MYD;
