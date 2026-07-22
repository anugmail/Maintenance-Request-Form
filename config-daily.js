/* ============================================================
   Maintain-D — Daily Record Config (config-daily.js)
   โมดูลกลางของแอป "บันทึกการใช้งานรถ" ใช้ร่วมกัน 2 หน้า:
     - daily-record/            (PWA — อ่าน/เขียนบันทึก)
     - admin-config.html part 2 (ตั้งค่าฟิลด์/Fleet Card/ข้อมูล)
   เก็บทุกอย่างใน localStorage key เดียว: maintaind.daily.v1
   เป็นคู่แฝดของ config.js (window.MDC) — pattern เดียวกันทุกอย่าง
   ============================================================ */
(function(){
const KEY='maintaind.daily.v1';

const DEFAULT_DB={
  v:1,
  records:[],   // {id,vehicleId,plate,date(ISO),odoStart,odoEnd,equipmentHours,driver,mission,
                //  receipts:[{no,station,fuelType,price,liters,amount,photoThumb,ocr}],
                //  others:[{type,amount,note}],note,custom:{},createdAt,updatedAt}
  fields:{
    std:{   // ทุกฟิลด์เปิด/ปิดได้หมด — ปิด "วันที่" แล้วระบบใช้วันที่วันนี้ให้อัตโนมัติ
      date:    {on:true,req:true},
      odoStart:{on:true,req:true},
      odoEnd:  {on:true,req:true},
      equipmentHours:{on:true,req:false},   // บังคับจริงเฉพาะรถที่มีเครน/กระเช้า (attach) — เช็คใน app.js ไม่ใช่ toggle นี้
      driver:  {on:true,req:true},
      mission: {on:true,req:false},
      receipts:{on:true,req:false},
      others:  {on:true,req:false},
      note:    {on:true,req:false}
    },
    custom:[]   // {key:'c<ts>',label,type:'text|number|select|date|check',options:[],req,on}
  },
  fleet:null,   // null = ใช้ FLEET_DEFAULTS; override = [{vehicleId,no,bank,holder}]
  drivers:[]    // ชื่อผู้ขับที่เคยบันทึก → autocomplete (dedup, เก็บล่าสุด 20 ชื่อ)
};

/* label/คำอธิบายของฟิลด์มาตรฐาน — ใช้ทั้งใน admin (ตั้งค่า) และ PWA (แสดง error)
   อ้างอิงคอลัมน์ตามสมุดบันทึกการใช้รถกระดาษจริงของ กฟภ. (วันที่/ชื่อ-ตำแหน่ง/ไปปฏิบัติงานที่/เลขระยะทาง ไป-กลับ/
   ชั่วโมงการทำงานของเครื่องจักร/น้ำมันที่เติม+จำนวนเงิน/รายการซ่อม+จำนวนเงิน/หมายเหตุ) */
const STD_META={
  date:    {label:'วันที่ใช้งาน',desc:'วันที่ของบันทึก — ปิดแล้วระบบใช้วันที่วันนี้ให้อัตโนมัติ'},
  odoStart:{label:'เลขไมล์เริ่มต้น',desc:'ใช้คำนวณระยะทาง — ปิดแล้วสรุปเดือนไม่มีระยะทาง/กม.ต่อลิตร'},
  odoEnd:  {label:'เลขไมล์สิ้นสุด',desc:'ใช้คำนวณระยะทาง — ปิดแล้วสรุปเดือนไม่มีระยะทาง/กม.ต่อลิตร'},
  equipmentHours:{label:'ชั่วโมงเครื่องจักร (เครน/กระเช้า)',desc:'มิเตอร์ชั่วโมงทำงานของเครน/กระเช้า แยกจากเลขไมล์รถเสมอ (TOR ข้อ 2/T6) — ไม่บังคับกรอก แสดงเฉพาะรถที่มีอุปกรณ์เสริม'},
  driver:  {label:'ผู้ใช้รถ/พนักงานขับ',desc:'ชื่อผู้ใช้งานรถในวันนั้น'},
  mission: {label:'ภารกิจ/เส้นทาง',desc:'ไปไหน ทำอะไร'},
  receipts:{label:'ใบสั่งจ่ายน้ำมัน (Fleet Card)',desc:'ถ่ายรูปใบสั่งจ่ายน้ำมัน — ระบบอ่านเลขที่/สถานี/ราคาต่อลิตร/จำนวนลิตร/ยอดรวมให้ (mock OCR)'},
  others:  {label:'ค่าใช้จ่ายอื่น',desc:'ทางด่วน ล้างรถ ค่าซ่อม ฯลฯ'},
  note:    {label:'หมายเหตุ',desc:'บันทึกเพิ่มเติมอื่นๆ ที่ไม่เข้าพวกด้านบน'}
};
const FIELD_TYPES={text:'ข้อความ',number:'ตัวเลข',select:'ตัวเลือก (dropdown)',date:'วันที่',check:'ติ๊กถูก'};
const OTHER_TYPES=['ทางด่วน','ล้างรถ','ค่าซ่อม','อื่นๆ'];

/* ---------- Fleet Card defaults (จับคู่กับ vehicles ใน config.js) ---------- */
const FLEET_DEFAULTS=[
  {vehicleId:1,no:'7024 8801 0042 2345',bank:'ธนาคารกรุงไทย',holder:'กฟภ. เขต ฉ.3 นครราชสีมา'},
  {vehicleId:2,no:'7024 8801 0042 6789',bank:'ธนาคารกรุงไทย',holder:'กฟภ. เขต ฉ.1 ขอนแก่น'},
  {vehicleId:3,no:'7024 8801 0042 1122',bank:'ธนาคารกรุงไทย',holder:'สำนักงานใหญ่ (กบค.)'},
  {vehicleId:4,no:'7024 8801 0042 5566',bank:'ธนาคารกรุงไทย',holder:'กฟภ. เขต น.1 เชียงใหม่'}
];

/* ---------- load / save / reset ---------- */
function clone(o){return JSON.parse(JSON.stringify(o))}
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw)return clone(DEFAULT_DB);
    const j=JSON.parse(raw);
    if(!j||j.v!==1)return clone(DEFAULT_DB);
    const std={};
    Object.keys(DEFAULT_DB.fields.std).forEach(k=>{
      std[k]=Object.assign({},DEFAULT_DB.fields.std[k],(j.fields&&j.fields.std&&j.fields.std[k])||{});
      delete std[k].lock;   // ล้าง flag lock จากข้อมูลเวอร์ชันเก่า — ปัจจุบันทุกฟิลด์ปิดได้
    });
    return{
      v:1,
      records:Array.isArray(j.records)?j.records:[],
      fields:{std,custom:(j.fields&&Array.isArray(j.fields.custom))?j.fields.custom:[]},
      fleet:Array.isArray(j.fleet)?j.fleet:null,
      drivers:Array.isArray(j.drivers)?j.drivers:[]
    };
  }catch(e){return clone(DEFAULT_DB)}
}
function save(db){db.v=1;localStorage.setItem(KEY,JSON.stringify(db))}
/* บันทึกพร้อมกันชน localStorage เต็ม: ครั้งแรกเต็ม → ตัดรูปทั้งหมดแล้วลองใหม่
   คืนค่า 'ok' | 'nophoto' | 'fail' ให้ฝั่ง UI เลือกข้อความ toast */
function saveGuarded(db){
  try{save(db);return'ok'}
  catch(e){
    try{
      db.records.forEach(r=>(r.receipts||[]).forEach(rc=>rc.photoThumb=null));
      save(db);return'nophoto';
    }catch(e2){return'fail'}
  }
}
function reset(){localStorage.removeItem(KEY)}

/* ---------- Fleet Card accessor ---------- */
function fleet(){const db=load();return clone(db.fleet||FLEET_DEFAULTS)}
function fleetFor(vehicleId){
  return fleet().find(f=>f.vehicleId===vehicleId)||{vehicleId,no:'— ไม่มีบัตร —',bank:'',holder:''};
}

/* ---------- Thai date helpers (เก็บ ISO เสมอ แสดงผลผ่านนี่เท่านั้น) ---------- */
function thDate(iso,opts){
  return new Intl.DateTimeFormat('th-TH',opts||{weekday:'short',day:'numeric',month:'short',year:'numeric'})
    .format(new Date(iso+'T00:00:00'));
}
function thMonth(ym){   // 'YYYY-MM' → 'กรกฎาคม 2569'
  return new Intl.DateTimeFormat('th-TH',{month:'long',year:'numeric'}).format(new Date(ym+'-01T00:00:00'));
}
function isoToday(){
  const d=new Date();
  return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ---------- คนขับ (mock login — MDD.DRIVERS) ---------- */
/* แหล่งความจริงเดียว: ใช้ทั้งหน้า login ของแอป (app.js) และตอน seed ข้อมูลตัวอย่างที่นี่
   บันทึกทุกรายการผูกกับ driverId เพื่อให้ mock data เป็นของ user ที่ login มาจริงๆ — คนอื่นไม่เห็นของกัน */
const DRIVERS=[
  {id:'d1',name:'สมชาย ใจดี',color:'#A80689',initials:'สช'},
  {id:'d2',name:'วิชัย มั่นคง',color:'#1570EF',initials:'วช'},
  {id:'d3',name:'ประสิทธิ์ แก้วใส',color:'#0E9384',initials:'ปส'},
];
/* จุดทำงาน PEA มาตรฐาน ตามเขต/จังหวัด — ใช้เป็น datalist ของฟิลด์ภารกิจ/เส้นทางในฟอร์มบันทึกด้วย (MDD.MISSION_PRESETS) */
const MISSION_PRESETS=['ตรวจสายส่ง อ.ปากช่อง จ.นครราชสีมา','ซ่อมหม้อแปลง ต.หนองไผ่ จ.นครราชสีมา','ยกเสาไฟฟ้า อ.สูงเนิน จ.นครราชสีมา',
  'ตรวจสายส่ง อ.เมือง จ.ขอนแก่น','ซ่อมหม้อแปลง อ.บ้านไผ่ จ.ขอนแก่น',
  'สนับสนุนงานก่อสร้างสถานีไฟฟ้า กรุงเทพมหานคร','ตัดต้นไม้ใกล้แนวสายไฟ จ.เชียงใหม่','ส่งอุปกรณ์เข้าคลังเขต'];
const SEED_STATIONS=['ปตท.','ปตท.','บางจาก','Shell','PT'];   // ถ่วงน้ำหนัก ปตท.
function seedMonth(){
  const now=new Date(),y=now.getFullYear(),m=now.getMonth();
  const maxDay=Math.max(1,Math.min(now.getDate(),28));
  const odo={1:84120,2:52300,3:120450,4:45210};
  const rnd=(a,b)=>a+Math.random()*(b-a);
  // สุ่มคู่ (คัน,วัน) ไม่ซ้ำก่อน แล้ว "เรียงตามวัน" ค่อยแจกเลขไมล์ — ไมล์จึงเดินหน้าตามเวลาเสมอ
  const used=new Set(),combos=[];
  let tries=0;
  while(combos.length<15&&tries<200){
    tries++;
    const vid=1+Math.floor(Math.random()*4),day=1+Math.floor(Math.random()*maxDay);
    const key=vid+'-'+day;
    if(used.has(key))continue;
    used.add(key);combos.push({vid,day});
  }
  combos.sort((a,b)=>a.day-b.day);
  const bud=(y+543)%100;
  const records=combos.map(({vid,day},i)=>{
    const date=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dist=Math.round(rnd(40,220));
    const start=odo[vid];odo[vid]+=dist;
    const liters=+rnd(20,60).toFixed(2),price=+rnd(32,35).toFixed(2);
    const drv=DRIVERS[Math.floor(Math.random()*DRIVERS.length)];
    return{
      id:'r'+Date.now()+'_'+i,
      vehicleId:vid,plate:null,   // plate เติมโดยผู้เรียก (รู้รายการรถจาก MDC)
      date,odoStart:start,odoEnd:start+dist,
      driverId:drv.id,driver:drv.name,
      mission:MISSION_PRESETS[Math.floor(Math.random()*MISSION_PRESETS.length)],
      receipts:Math.random()<0.85?[{
        no:`INV-${bud}${String(m+1).padStart(2,'0')}${String(day).padStart(2,'0')}-${String(1000+Math.floor(Math.random()*9000))}`,
        station:SEED_STATIONS[Math.floor(Math.random()*SEED_STATIONS.length)],
        fuelType:'ดีเซล',liters,amount:+(liters*price).toFixed(2),photoThumb:null,ocr:true
      }]:[],
      others:Math.random()<0.3?[{type:'ทางด่วน',amount:Math.round(rnd(60,300)),note:''}]:[],
      custom:{},createdAt:Date.now(),updatedAt:Date.now()
    };
  });
  records.sort((a,b)=>a.date<b.date?1:-1);
  return records;
}

window.MDD={KEY,DEFAULT_DB,STD_META,FIELD_TYPES,OTHER_TYPES,FLEET_DEFAULTS,MISSION_PRESETS,DRIVERS,
  load,save,saveGuarded,reset,fleet,fleetFor,thDate,thMonth,isoToday,seedMonth,clone};
})();
