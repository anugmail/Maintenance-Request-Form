/* ข้อมูลต้นแบบ Overhaul (11 พ.ย. 2569) — แผน/รถ/PO ชุด ORZ6900026 มาจาก overhaul-a5-uat-data.js (snapshot UAT)
   รถนอกแผน · วันสัญญา · ความคืบหน้า · อะไหล่ · ผู้ประสานงาน = ค่าสมมติตามรูปแบบข้อมูลจริง (ทะเบียน/สังกัด/เลขอะไหล่) */
const PX_TODAY='2026-11-11';
const PX_COST_TYPES=['งบทำการ หน่วยงานต้นสังกัด','งบทำการ หน่วยงานอื่น','งบลงทุน งานก่อสร้าง','งานบำรุงรักษา','อื่น ๆ (โปรดระบุในหมายเหตุ)'];
const PX_COST_CENTERS=['A301010000 กบห.ฝวบ.-บริหาร','A301020000 กบห.ฝวบ.-ยานพาหนะ','A301030000 กบห.ฝวบ.-ซ่อมบำรุง','A302010000 กยพ.ฝวบ.-บริหาร'];
const PX_STAFF=[
  {id:'s1',name:'นายสมชาย ใจดี',pos:'วิศวกรระดับ 6 · กบค.',tel:'081-234-5678'},
  {id:'s2',name:'นางสาวกนกวรรณ ใจมั่น',pos:'นักวิชาการระดับ 5 · กบค.',tel:'089-765-4321'},
  {id:'s3',name:'นายวีระพงษ์ ทองคำ',pos:'ช่างเทคนิคระดับ 6 · กบค.',tel:'086-112-3344'},
];
const PX_VENDORS=[
  {id:'v1',name:'อู่เพ็ญยนต์',types:['กระเช้าแก้ไฟ','รถบรรทุก 3 ตัน พร้อมตู้เก็บเครื่องมือ(แก้ไฟ)','กระบะบรรทุก 2 ตัน'],brands:'HINO, ISUZU',addr:'88/9 ถ.พหลโยธิน ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120',tel:'02-516-2244',email:'service@penyont.co.th'},
  {id:'v2',name:'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด',types:['ตรวจการ','กระบะบรรทุก 1 ตัน SPACE CAB','รถตรวจการ 2-5 ประตู (EV)'],brands:'ISUZU',addr:'1088 ถ.วิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพมหานคร 10900',tel:'02-966-2111',email:'fleet@tripetch-isuzu.co.th'},
  {id:'v3',name:'บริษัท ฮีโน่มอเตอร์สเซลส์ (ประเทศไทย) จำกัด',types:['กระเช้าแก้ไฟ','บรรทุกเฉพาะกิจ(มีเครื่องกำเนิด) 800 กว.'],brands:'HINO',addr:'99 หมู่ 3 ถ.บางนา-ตราด ต.บางโฉลง อ.บางพลี จ.สมุทรปราการ 10540',tel:'02-312-8000',email:'gov@hino.co.th'},
];
/* รถ — 8 คันแรกตาม UAT ORZ6900026 · ที่เหลือคือรถในระบบที่ยังไม่เข้าแผน
   acq = ราคาที่ได้รถมา (ราคาจัดซื้อ) เป็นข้อมูลตัวอย่าง ไม่ใช่ค่าใช้จ่าย Overhaul หรือราคาจาก UAT */
const PX_VEH=[
  ['c1','1ขญ-221 กรุงเทพมหานคร','ISUZU','ISUZU MU-X','ตรวจการ','ฝปบ.(ฉ1)',59,1350000],
  ['c2','54-6221 กรุงเทพมหานคร','HINO','HINO XZU720R-HKFTLT3','กระเช้าแก้ไฟ','กฟส.พน.',35,3980000],
  ['c3','ขล 8320 ขอนแก่น','ISUZU','ISUZU MU-X','รถตรวจการ 2-5 ประตู (EV)','กฟส.พน.',65,1420000],
  ['c4','ผห 5513 ขอนแก่น','ISUZU','ISUZU D-MAX','กระบะบรรทุก 1 ตัน SPACE CAB','กฟส.ปคด.',76,689000],
  ['c5','83-7887 เชียงใหม่','ISUZU','ISUZU FXZ77QXDTS','บรรทุกเฉพาะกิจ(มีเครื่องกำเนิด) 800 กว.','ผรผ.',109,7250000],
  ['c6','84-6932 อุดรธานี','HINO','HINO XZU720R-HKFTLT3','กระเช้าแก้ไฟ','กฟส.อด.2',68,3980000],
  ['c7','ผข 6364 เชียงราย','ISUZU','ISUZU NKR55EX1','กระบะบรรทุก 2 ตัน','กฟส.ขต.',353,615000],
  ['c8','84-6933 อุดรธานี','HINO','HINO XZU600R-HKMQLT3','รถบรรทุก 3 ตัน พร้อมตู้เก็บเครื่องมือ(แก้ไฟ)','กฟส.นวซ.',64,2850000],
  ['c9','83-4410 นครราชสีมา','HINO','HINO XZU720R-HKFTLT3','กระเช้าแก้ไฟ','กฟส.ปท.',102,3980000],
  ['c10','82-1975 ลำปาง','ISUZU','ISUZU FXZ77QXDTS','บรรทุกเฉพาะกิจ(มีเครื่องกำเนิด) 800 กว.','กฟจ.ลป.',131,7250000],
  ['c11','บพ 4421 นครราชสีมา','ISUZU','ISUZU D-MAX','กระบะบรรทุก 1 ตัน SPACE CAB','กฟส.ขส.',88,689000],
  ['c12','81-6620 สุราษฎร์ธานี','HINO','HINO XZU600R-HKMQLT3','รถบรรทุก 3 ตัน พร้อมตู้เก็บเครื่องมือ(แก้ไฟ)','กฟส.พนพ.',97,2850000],
  ['c13','ฒร 7708 ชลบุรี','ISUZU','ISUZU MU-X','ตรวจการ','กฟจ.ชบ.',71,1350000],
  ['c14','85-0214 พิษณุโลก','ISUZU','ISUZU NKR55EX1','กระบะบรรทุก 2 ตัน','กฟส.วท.',214,615000],
  ['c15','84-3359 นครศรีธรรมราช','HINO','HINO XZU720R-HKFTLT3','กระเช้าแก้ไฟ','กฟส.ทส.',83,3980000],
  ['c16','กข 1290 อุบลราชธานี','ISUZU','ISUZU D-MAX','กระบะบรรทุก 1 ตัน SPACE CAB','กฟส.วรช.',93,689000],
  ['c17','83-9051 ระยอง','HINO','HINO XZU600R-HKMQLT3','รถบรรทุก 3 ตัน พร้อมตู้เก็บเครื่องมือ(แก้ไฟ)','กฟส.บค.',116,2850000],
  ['c18','82-7764 เพชรบุรี','ISUZU','ISUZU FXZ77QXDTS','บรรทุกเฉพาะกิจ(มีเครื่องกำเนิด) 800 กว.','กฟจ.พบ.',140,7250000],
].map(([id,plate,brand,model,type,dept,ageM,acq])=>({id,plate,brand,model,type,dept,ageM,acq}));
const PX_TYPES=[...new Set(PX_VEH.map(v=>v.type))];

/* แผน — 27 แผนตาม UAT (ชื่อ/เลข/งบ/ปี/สถานะ/วันที่สร้าง) */
const PX_PLANS_UAT=(window.OH_A5_UAT?OH_A5_UAT.plans:[]).map(p=>({id:p.plan_no,name:p.plan_name,budget:p.approved_budget,costType:p.ref_cost_type_name,
  costCenter:p.cost_center,wbs:p.wbs_number,pmOrder:p.pm_order_no,remark:p.cost_type_other_reason,year:+p.fiscal_year,status:p.plan_status,created:p.created_at.slice(0,10),cars:[],pos:[]}));

function pxSeed(){
  const plans=JSON.parse(JSON.stringify(PX_PLANS_UAT));
  const p=plans.find(x=>x.id==='ORZ6900026')||plans[0];
  p.cars=Array.from({length:8},(_,i)=>({id:'c'+(i+1),refPrice:null,ohPrice:null,priceSource:'uat-missing'}));
  p.pos=[
    {id:'ORZ6900026-01',name:'ซ่อมช่วงล่าง',vendor:'v1',from:'2026-09-15',to:'2026-12-14',cars:['c1','c2','c3','c4'],docs:{order:[{name:'ใบสั่งจ้าง ORZ6900026-01.pdf',size:482133}],other:[]}},
    {id:'ORZ6900026-02',name:'ซ่อมระบบไฟฟ้า',vendor:'v1',from:'2026-09-15',to:'2026-12-14',cars:['c5','c6','c7'],docs:{order:[{name:'ใบสั่งจ้าง ORZ6900026-02.pdf',size:455120}],other:[]}},
    {id:'ORZ6900026-03',name:'ซ่อมระบบไฮดรอลิกส์',vendor:'v1',from:'2026-09-22',to:'2026-12-21',cars:['c6','c8'],docs:{order:[{name:'ใบสั่งจ้าง ORZ6900026-03.pdf',size:501877}],other:[]}},
  ];
  p.docs={approve:[{name:'หนังสืออนุมัติหลักการ ORZ6900026.pdf',size:612204}],budget:[{name:'อนุมัติงบประมาณ ปี 2569.pdf',size:389910}],other:[]};
  const L=(d,t,pct,r)=>({at:d,detail:t,pct,remark:r||''});
  const parts={body:[{code:'8-97367-201-0',name:'ชุดลูกหมากปีกนกล่าง',qty:2,unit:'ชุด',price:4850},{code:'8-98139-415-0',name:'โช้คอัพหน้า',qty:2,unit:'ตัว',price:3620},{code:'5-87611-047-0',name:'ผ้าเบรกหน้า',qty:1,unit:'ชุด',price:2150}],
    tool:[{code:'HY-SEAL-63',name:'ชุดซีลกระบอกไฮดรอลิกบูม',qty:1,unit:'ชุด',price:12800}]};
  const J={
    'ORZ6900026-01:c1':{stage:1,appt:{date:'2026-11-18',staff:'s1',remark:'นำรถเข้าอู่ช่วงเช้า',state:'pending'}},
    'ORZ6900026-01:c2':{stage:1},
    'ORZ6900026-01:c3':{stage:2,appt:{date:'2026-11-14',staff:'s2',remark:'',state:'accepted'}},
    'ORZ6900026-01:c4':{stage:3,intake:{date:'2026-09-24',mileage:186420,remark:'',checks:[1,1,1,1,1,0,1]},logs:[L('2026-09-30T10:30','ถอดชุดช่วงล่างหน้า ตรวจสภาพลูกหมากและบูช',20),L('2026-10-14T14:00','สั่งอะไหล่ลูกหมากปีกนกและโช้คอัพหน้า',45,'รออะไหล่ 7 วัน'),L('2026-10-28T09:15','ประกอบช่วงล่างหน้า ตั้งศูนย์ล้อ',80)]},
    'ORZ6900026-02:c5':{stage:4,intake:{date:'2026-09-19',mileage:98250,remark:'',checks:[1,1,1,1,1,1,1]},logs:[L('2026-09-26T11:00','ตรวจระบบไฟฟ้าเครื่องกำเนิด พบสายไฟชุดควบคุมเสื่อม',25),L('2026-10-20T15:30','เปลี่ยนชุดสายไฟและตู้ควบคุม',70),L('2026-11-06T10:00','ทดสอบเดินเครื่องกำเนิด 800 กว. ต่อเนื่อง 4 ชั่วโมง ผ่าน',100)]},
    'ORZ6900026-02:c6':{stage:5,pickup:{from:'2026-11-12',to:'2026-11-13',staff:'s2',remark:'',state:'rejected',reason:'วันที่ 12-13 พ.ย. รถต้องออกปฏิบัติงานซ่อมไฟฟ้าพื้นที่ อ.หนองหาน ขอเลื่อนเป็นสัปดาห์ถัดไป'},intake:{date:'2026-09-18',mileage:121730,remark:'',checks:[1,1,1,1,1,1,1]},logs:[L('2026-10-02T09:00','ตรวจระบบไฟส่องสว่างและไฟฉุกเฉิน',40),L('2026-10-30T16:00','เปลี่ยนชุดสายไฟหลักและไฟวับวาบ',100)],safety:[{name:'Safety Inspection 84-6932.pdf',size:733418}]},
    'ORZ6900026-02:c7':{stage:6,intake:{date:'2026-09-17',mileage:412870,remark:'กระจกบานหน้าซ้ายมีรอยร้าว',checks:[1,1,1,0,1,1,1]},logs:[L('2026-09-29T10:00','ถอดชุดสายไฟเดิม ตรวจไดชาร์จและสตาร์ท',35),L('2026-10-24T13:30','เปลี่ยนไดชาร์จ สายไฟหลัก และแบตเตอรี่',100)],
      safety:[{name:'Safety Inspection ผข 6364.pdf',size:690122}],withdrawn:[{code:'1-81200-345-0',name:'แบตเตอรี่ 12V 100Ah',unit:'ลูก',qty:2,used:2},{code:'8-97253-921-0',name:'ไดชาร์จ 24V 50A',unit:'ตัว',qty:1,used:1},{code:'WR-6SQ-RED',name:'สายไฟ 6 sq.mm สีแดง',unit:'เมตร',qty:30,used:22}]},
    'ORZ6900026-03:c8':{stage:7,intake:{date:'2026-09-25',mileage:143560,remark:'',checks:[1,1,1,1,1,1,1]},logs:[L('2026-10-05T09:30','ถอดกระบอกไฮดรอลิกบูม พบซีลรั่ว',30),L('2026-10-22T14:00','เปลี่ยนชุดซีลและน้ำมันไฮดรอลิก',75),L('2026-11-04T11:00','ทดสอบยกบูมรับน้ำหนัก 1.5 เท่าพิกัด ผ่าน',100)],
      safety:[{name:'Safety Inspection 84-6933.pdf',size:702553}],pickup:{from:'2026-11-07',to:'2026-11-08',staff:'s3',state:'accepted'},handover:{date:'2026-11-08',receiver:'นายประเสริฐ มีสุข'},
      parts,labor:28500,otherCost:3200,returns:[]},
  };
  return {dataVersion:3,plans,jobs:J,vendors:JSON.parse(JSON.stringify(PX_VENDORS))};
}

/* Owner-requested illustrative prices, 11 Nov 2026. Not prices obtained from UAT.
   Reference = replacement vehicle of the same class; estimate = total repair scope per plan/vehicle.
   Keep the original UAT budget and all user-entered prices; examples may exceed that test budget. */
const PX_PRICE_EXAMPLES={
 c1:{reference:1350000,estimate:180000},c2:{reference:4150000,estimate:420000},
 c3:{reference:1450000,estimate:165000},c4:{reference:720000,estimate:95000.50},
 c5:{reference:7600000,estimate:880000},c6:{reference:4150000,estimate:465000},
 c7:{reference:690000,estimate:210000},c8:{reference:3050000,estimate:68000}
};
function pxApplyExamplePrices(state){
 if(state.priceExamplesVersion>=1)return false;
 const plan=state.plans.find(p=>p.id==='ORZ6900026');
 if(plan)plan.cars.forEach(c=>{const example=PX_PRICE_EXAMPLES[c.id];if(!example)return;
  c.priceSources=c.priceSources||{};
  for(const [field,source,key] of [['refPrice','reference','reference'],['ohPrice','estimate','estimate']]){
   if(c[field]==null||c[field]===''){c[field]=example[key];c.priceSources[source]='example-20261111';}
  }
 });
 state.priceExamplesVersion=1;return true;
}
