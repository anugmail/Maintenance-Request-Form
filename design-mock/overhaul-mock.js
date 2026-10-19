/* ข้อมูลจำลอง + สถานะร่วมของชุดหน้าจอ Overhaul (overhaul-01-list · overhaul-02-detail · overhaul-03-po)
   12 ต.ค. 2569 — ตามผังหน้าจอที่เจ้าของงานส่งมา: จัดการ Overhaul → รายละเอียด → 5 ขั้น
   (บันทึก PO · ติดตามงาน · เบิกอะไหล่ · นัดหมายรับรถ · ปิดงาน)
   สถานะเก็บใน localStorage คีย์ oh-mock-v1 แยกรายคัน · ทะเบียน ชื่อบริษัท และตัวเลขทั้งหมดเป็นค่าสมมติ */
const OH_KEY='oh-mock-v1';
const OH_USER='นางสาวกนกวรรณ ใจมั่น';

const OH_VEHICLES=[
  {id:'v1',plate:'82-4471 กรุงเทพมหานคร',code:'กบค. - 09 - 0231',type:'รถปั้นจั่น (ไฮดรอลิคเครน)',brand:'HINO FG8J',dept:'กฟจ.พะเยา',region:'กฟน.1',getDate:'2014-03-18',mileage:284120,hours:9450,crane:'TADANO TM-ZE554',budget:1850000},
  {id:'v2',plate:'80-1234 พะเยา',code:'กฟจ.พย. - 25 - 0042',type:'กระเช้าฮอทไลน์ 22 KV',brand:'ISUZU FRR90',dept:'กฟส.ดอกคำใต้',region:'กฟน.1',getDate:'2013-08-02',mileage:312540,hours:11020,crane:'AICHI SH15B',budget:2400000},
  {id:'v3',plate:'3ขพ 6153 กรุงเทพมหานคร',code:'กจย. - 25 - 1850',type:'กระเช้าฮอทไลน์ 115 KV',brand:'HINO FM8J',dept:'กฟอ.แม่ใจ',region:'กฟน.1',getDate:'2012-11-20',mileage:356800,hours:12870,crane:'VERSALIFT VO-355-MHI',budget:3100000},
  {id:'v4',plate:'80-5521 พะเยา',code:'กฟจ.พย. - 09 - 0015',type:'รถปั้นจั่น (ไฮดรอลิคเครน)',brand:'ISUZU FVM34',dept:'กฟจ.พะเยา',region:'กฟน.1',getDate:'2015-01-12',mileage:241300,hours:8120,crane:'UNIC URV805',budget:1650000},
  {id:'v5',plate:'80-7310 พะเยา',code:'กฟส.ดคต. - 04 - 0008',type:'รถบรรทุกขนาดใหญ่',brand:'HINO FC9J',dept:'กฟส.เชียงคำ',region:'กฟน.1',getDate:'2014-09-05',mileage:298700,hours:0,crane:'',budget:980000},
];

const OH_VENDORS=['บริษัท ฮีโน่เซอร์วิสเหนือ จำกัด','บริษัท ตรีเพชรบริการ จำกัด','บริษัท ไทยเครนเทค จำกัด','บริษัท แอร์ทรัคเซอร์วิส จำกัด','หจก. ช่วงล่างการช่าง','บริษัท ไฮดรอลิคโปร จำกัด'];

const OH_PARTS=[
  {code:'1000234501',name:'ชุดยกเครื่องยนต์ (แหวน ลูกสูบ ปลอกสูบ)',unit:'ชุด'},
  {code:'1000234518',name:'ปั๊มไฮดรอลิก',unit:'ตัว'},
  {code:'1000234533',name:'ชุดซีลกระบอกไฮดรอลิกบูม',unit:'ชุด'},
  {code:'1000234540',name:'คอมเพรสเซอร์แอร์',unit:'ตัว'},
  {code:'1000234557',name:'แหนบหลัง',unit:'ชุด'},
  {code:'1000234564',name:'โช้คอัพหน้า',unit:'ตัว'},
  {code:'1000234571',name:'ชุดคลัตช์',unit:'ชุด'},
  {code:'1000234588',name:'สายไฮดรอลิกชุดบูม',unit:'เส้น'},
];

/* ประวัติซ่อมเดิมของรถ (แท็บประวัติการซ่อม) — แหล่งจริงคือใบงานซ่อมของ VMS Plus */
const OH_REPAIRS={
  v1:[{date:'2026-06-11',no:'BRK-2569-0412',desc:'เปลี่ยนสายไฮดรอลิกชุดบูม',by:'กฟจ.พะเยา (ซ่อมเอง)',cost:4850},{date:'2025-12-03',no:'BRK-2568-1190',desc:'ซ่อมระบบเบรก เปลี่ยนผ้าเบรกหลัง',by:'บริษัท ฮีโน่เซอร์วิสเหนือ จำกัด',cost:18400}],
  v2:[{date:'2026-07-22',no:'BRK-2569-0633',desc:'กระเช้ายกไม่สุด ตรวจปั๊มไฮดรอลิก',by:'กบค.',cost:32500}],
  v3:[{date:'2026-05-02',no:'BRK-2569-0301',desc:'เครื่องยนต์ความร้อนขึ้น เปลี่ยนหม้อน้ำ',by:'กบค.',cost:27900},{date:'2026-02-14',no:'BRK-2569-0098',desc:'แอร์ไม่เย็น เติมน้ำยาและเปลี่ยนไดเออร์',by:'บริษัท แอร์ทรัคเซอร์วิส จำกัด',cost:6200},{date:'2025-09-30',no:'BRK-2568-0871',desc:'เปลี่ยนชุดคลัตช์',by:'กบค.',cost:41000}],
  v4:[],
  v5:[{date:'2026-03-19',no:'BRK-2569-0177',desc:'แหนบหลังหัก',by:'หจก. ช่วงล่างการช่าง',cost:15300}],
};

/* Overhaul รอบก่อนหน้า (แท็บประวัติการ Overhaul) — งานที่ปิดในต้นแบบนี้จะมาต่อท้ายเอง */
const OH_PAST={
  v3:[{year:'2562',vendor:'บริษัท ฮีโน่เซอร์วิสเหนือ จำกัด',start:'2019-02-04',end:'2019-05-20',budget:1420000,warrantyEnd:'2019-11-16'}],
};

function ohBlank(){return {pos:[],notes:[],parts:[],appt:{status:'none'},docs:[],used:[],warranty:{start:'',end:''},closed:null}}

/* สถานะตั้งต้น — ให้ทั้ง 5 คันอยู่คนละขั้น เปิดมาเห็นครบทุกสถานะ */
function ohSeed(){
  const po=(no,vendor,days,start,end,budget)=>({no,vendor,days,start,end,budget});
  const s={};
  OH_VEHICLES.forEach(v=>s[v.id]=ohBlank());
  s.v2.pos=[po('PO-4500218831',OH_VENDORS[2],90,'2026-09-01','2026-11-29',2400000)];
  s.v2.notes=[
    {id:1,date:'2026-09-15',by:OH_USER,text:'ผู้รับจ้างรับรถเข้าอู่แล้ว ถอดชุดกระเช้าออกตรวจ พบซีลกระบอกบูมรั่ว 2 จุด'},
    {id:2,date:'2026-10-02',by:OH_USER,text:'ยกเครื่องยนต์เสร็จ รออะไหล่ปั๊มไฮดรอลิกเข้า คาดว่าได้ของ 14 ต.ค.'},
  ];
  s.v2.parts=[{id:1,code:'1000234533',name:'ชุดซีลกระบอกไฮดรอลิกบูม',unit:'ชุด',qty:2,date:'2026-09-16'}];
  s.v3.pos=[po('PO-4500217402',OH_VENDORS[0],120,'2026-06-01','2026-09-28',2650000),po('PO-4500217455',OH_VENDORS[3],30,'2026-08-01','2026-08-30',450000)];
  s.v3.notes=[{id:1,date:'2026-09-20',by:OH_USER,text:'ซ่อมครบทุกรายการ ทดสอบยกกระเช้าผ่าน รอนัดหน่วยงานมารับรถ'}];
  s.v3.parts=[{id:1,code:'1000234501',name:'ชุดยกเครื่องยนต์ (แหวน ลูกสูบ ปลอกสูบ)',unit:'ชุด',qty:1,date:'2026-06-20'},{id:2,code:'1000234540',name:'คอมเพรสเซอร์แอร์',unit:'ตัว',qty:1,date:'2026-08-05'}];
  s.v3.appt={status:'waiting',place:'โรงซ่อม กบค. สำนักงานใหญ่ อาคาร 4',date:'2026-10-20',time:'09:30',contact:'นายวิชัย ทองดี',tel:'02-590-9123',sentAt:'2026-10-10'};
  s.v4.pos=[po('PO-4500216120',OH_VENDORS[1],75,'2026-06-15','2026-08-28',1650000)];
  s.v4.notes=[{id:1,date:'2026-08-25',by:OH_USER,text:'งานเสร็จตามสัญญา ตรวจรับแล้ว'}];
  s.v4.parts=[{id:1,code:'1000234518',name:'ปั๊มไฮดรอลิก',unit:'ตัว',qty:1,date:'2026-07-02'},{id:2,code:'1000234571',name:'ชุดคลัตช์',unit:'ชุด',qty:1,date:'2026-07-02'}];
  s.v4.appt={status:'received',place:'โรงซ่อม กบค. สำนักงานใหญ่ อาคาร 4',date:'2026-09-08',time:'10:00',contact:'นายวิชัย ทองดี',tel:'02-590-9123',sentAt:'2026-09-01',receivedAt:'2026-09-08'};
  s.v5.pos=[po('PO-4500214977',OH_VENDORS[4],45,'2026-04-01','2026-05-15',980000)];
  s.v5.notes=[{id:1,date:'2026-05-12',by:OH_USER,text:'เปลี่ยนแหนบและโช้คครบ ทดสอบวิ่งบรรทุกผ่าน'}];
  s.v5.parts=[{id:1,code:'1000234557',name:'แหนบหลัง',unit:'ชุด',qty:2,date:'2026-04-10'}];
  s.v5.appt={status:'received',place:'โรงซ่อม กบค. สำนักงานใหญ่ อาคาร 4',date:'2026-05-20',time:'13:30',contact:'นายวิชัย ทองดี',tel:'02-590-9123',sentAt:'2026-05-14',receivedAt:'2026-05-20'};
  s.v5.docs=['ใบตรวจรับงาน-80-7310.pdf','ใบส่งมอบรถ-80-7310.pdf'];
  s.v5.used=[{id:1,code:'1000234557',name:'แหนบหลัง',unit:'ชุด',qty:2},{id:2,code:'1000234564',name:'โช้คอัพหน้า',unit:'ตัว',qty:2}];
  s.v5.warranty={start:'2026-05-20',end:'2026-11-16'};
  s.v5.closed='2026-05-22';
  return s;
}

function ohLoad(){
  try{const raw=localStorage.getItem(OH_KEY);if(raw)return JSON.parse(raw)}catch(e){}
  const s=ohSeed();ohSave(s);return s;
}
function ohSave(s){try{localStorage.setItem(OH_KEY,JSON.stringify(s))}catch(e){}}
function ohReset(){try{localStorage.removeItem(OH_KEY)}catch(e){}}
function ohVehicle(id){return OH_VEHICLES.find(v=>v.id===id)||OH_VEHICLES[0]}
function ohParamId(){return ohVehicle(new URLSearchParams(location.search).get('id')).id}

/* ขั้นปัจจุบันของงาน — ใช้ทั้งป้ายสถานะในรายการและแถบขั้นในหน้ารายละเอียด */
function ohStage(j){
  if(j.closed)return 'closed';
  if(!j.pos.length)return 'po';
  if(j.appt.status==='received')return 'close';
  if(j.appt.status!=='none')return 'appt-'+j.appt.status;
  return 'work';
}
const OH_STAGE={
  'po':['รอบันทึก PO','b-neutral'],
  'work':['กำลังดำเนินการ','b-info'],
  'appt-waiting':['รอหน่วยงานตอบรับนัด','b-low'],
  'appt-rejected':['หน่วยงานปฏิเสธนัด','b-out'],
  'appt-confirmed':['รอหน่วยงานรับรถ','b-brand'],
  'close':['รอปิดงาน','b-low'],
  'closed':['ปิดงานแล้ว','b-ok'],
};
function ohBadge(j){const [t,c]=OH_STAGE[ohStage(j)];return `<span class="badge ${c}">${t}</span>`}

const OH_MONTHS=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
function ohDate(iso){if(!iso)return '—';const [y,m,d]=iso.split('-').map(Number);return `${d} ${OH_MONTHS[m-1]} ${y+543}`}
function ohToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function ohAge(iso){const g=new Date(iso),n=new Date();let a=n.getFullYear()-g.getFullYear();if(n<new Date(n.getFullYear(),g.getMonth(),g.getDate()))a--;return a}
function ohNum(n){return Number(n).toLocaleString('th-TH')}
function ohMoney(n){return Number(n).toLocaleString('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2})}
function ohEsc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function ohToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500)}
function ohErr(f,on){if(!f)return;f.classList.toggle('err',on);const h=f.querySelector(':scope > .help');if(h)h.classList.toggle('hidden',!on)}
