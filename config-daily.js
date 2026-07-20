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
  records:[],   // {id,vehicleId,plate,date(ISO),odoStart,odoEnd,driver,mission,
                //  receipts:[{no,station,fuelType,liters,amount,photoThumb,ocr}],
                //  others:[{type,amount,note}],custom:{},createdAt,updatedAt}
  fields:{
    std:{
      date:    {on:true,req:true,lock:true},
      odoStart:{on:true,req:true,lock:true},
      odoEnd:  {on:true,req:true,lock:true},
      driver:  {on:true,req:true},
      mission: {on:true,req:false},
      receipts:{on:true,req:false},
      others:  {on:true,req:false}
    },
    custom:[]   // {key:'c<ts>',label,type:'text|number|select|date|check',options:[],req,on}
  },
  fleet:null,   // null = ใช้ FLEET_DEFAULTS; override = [{vehicleId,no,holder}]
  drivers:[]    // ชื่อผู้ขับที่เคยบันทึก → autocomplete (dedup, เก็บล่าสุด 20 ชื่อ)
};

/* label/คำอธิบายของฟิลด์มาตรฐาน — ใช้ทั้งใน admin (ตั้งค่า) และ PWA (แสดง error) */
const STD_META={
  date:    {label:'วันที่ใช้งาน',desc:'วันที่ของบันทึก (ฟิลด์หลัก ปิดไม่ได้)'},
  odoStart:{label:'เลขไมล์เริ่มต้น',desc:'ใช้คำนวณระยะทาง (ฟิลด์หลัก ปิดไม่ได้)'},
  odoEnd:  {label:'เลขไมล์สิ้นสุด',desc:'ใช้คำนวณระยะทาง (ฟิลด์หลัก ปิดไม่ได้)'},
  driver:  {label:'ผู้ใช้รถ/พนักงานขับ',desc:'ชื่อผู้ใช้งานรถในวันนั้น'},
  mission: {label:'ภารกิจ/เส้นทาง',desc:'ไปไหน ทำอะไร'},
  receipts:{label:'ใบเสร็จน้ำมัน (Fleet Card)',desc:'รูปใบเสร็จ + เลขที่ + ลิตร + จำนวนเงิน (mock OCR อ่านให้)'},
  others:  {label:'ค่าใช้จ่ายอื่น',desc:'ทางด่วน ล้างรถ ฯลฯ'}
};
const FIELD_TYPES={text:'ข้อความ',number:'ตัวเลข',select:'ตัวเลือก (dropdown)',date:'วันที่',check:'ติ๊กถูก'};
const OTHER_TYPES=['ทางด่วน','ล้างรถ','อื่นๆ'];

/* ---------- Fleet Card defaults (จับคู่กับ vehicles ใน config.js) ---------- */
const FLEET_DEFAULTS=[
  {vehicleId:1,no:'7024 8801 0042 2345',holder:'กฟภ. เขต ฉ.3 นครราชสีมา'},
  {vehicleId:2,no:'7024 8801 0042 6789',holder:'กฟภ. เขต ฉ.1 ขอนแก่น'},
  {vehicleId:3,no:'7024 8801 0042 1122',holder:'สำนักงานใหญ่ (กบค.)'},
  {vehicleId:4,no:'7024 8801 0042 5566',holder:'กฟภ. เขต น.1 เชียงใหม่'}
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
    Object.keys(DEFAULT_DB.fields.std).forEach(k=>
      std[k]=Object.assign({},DEFAULT_DB.fields.std[k],(j.fields&&j.fields.std&&j.fields.std[k])||{}));
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
  return fleet().find(f=>f.vehicleId===vehicleId)||{vehicleId,no:'— ไม่มีบัตร —',holder:''};
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

/* ---------- Demo seed: บันทึกตัวอย่าง ~15 รายการในเดือนปัจจุบัน ---------- */
const SEED_DRIVERS=['สมชาย ใจดี','วิชัย มั่นคง','ประสิทธิ์ แก้วใส','อนุชา พรมมา'];
const SEED_MISSIONS=['ตรวจสายส่ง อ.ปากช่อง','ซ่อมหม้อแปลง ต.หนองไผ่','ยกเสาไฟฟ้า อ.สูงเนิน',
  'สนับสนุนงานก่อสร้างสถานีไฟฟ้า','ตัดต้นไม้ใกล้แนวสายไฟ','ส่งอุปกรณ์เข้าคลังเขต'];
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
    return{
      id:'r'+Date.now()+'_'+i,
      vehicleId:vid,plate:null,   // plate เติมโดยผู้เรียก (รู้รายการรถจาก MDC)
      date,odoStart:start,odoEnd:start+dist,
      driver:SEED_DRIVERS[Math.floor(Math.random()*SEED_DRIVERS.length)],
      mission:SEED_MISSIONS[Math.floor(Math.random()*SEED_MISSIONS.length)],
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

window.MDD={KEY,DEFAULT_DB,STD_META,FIELD_TYPES,OTHER_TYPES,FLEET_DEFAULTS,
  load,save,saveGuarded,reset,fleet,fleetFor,thDate,thMonth,isoToday,seedMonth,clone};
})();
