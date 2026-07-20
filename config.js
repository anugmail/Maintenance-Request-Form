/* ============================================================
   Maintain-D — Admin Config (config.js)
   โมดูลกลางใช้ร่วมกัน 2 หน้า:
     - admin-config.html            (เขียนค่า)
     - mock/Maintenance-Request-Form.html (อ่านค่า + ฟัง storage event)
   เก็บทุกอย่างใน localStorage key เดียว: maintaind.admin.v1
   ⚠️ shape ของ seed jobs ต้องตรงกับโค้ดใน mock/Maintenance-Request-Form.html
      (statusInfo / renderKbkDetail / renderMyDetail) — แก้ mock แล้วมาเช็คที่นี่ด้วย
   ============================================================ */
(function(){
const KEY='maintaind.admin.v1';

const DEFAULT_CFG={
  v:1,
  theme:{preset:'pea',custom:null,fontScale:'md',radius:'md'},
  toggles:{menuStock:true,photoUpload:true,partsStep:true,inspection:true},
  variants:{vehicleCard:'list',slotPicker:'datepicker'},
  data:{vehicles:null,parts:null,garages:null},   // null = ใช้ค่า default ด้านล่าง
  demo:{jobs:null,seq:null,scenario:'default',startView:'form'}
};

/* ---------- UI Variants: สลับรูปแบบดีไซน์ของ component ใน mock ---------- */
const VARIANTS={
  vehicleCard:{name:'การ์ดเลือกรถ (ขั้นตอนที่ 1)',
    options:{list:'แถวแนวนอน (ผืนผ้า)',grid:'การ์ดจตุรัส'}},
  slotPicker:{name:'สไตล์เปิดตารางนัดรับ — กบค.',
    options:{datepicker:'Date picker (ช่วงวันที่/ทีละวัน)',chips:'ชิพวันเร็ว ๆ นี้ (แตะเลือกวัน)'}}
};

/* ---------- Theme: preset ถือ palette เต็ม 5 เฉด (hand-picked) ---------- */
const PRESETS={
  pea:   {name:'PEA ม่วงแดง',p700:'#8A0570',p600:'#A80689',p500:'#CF07AA',p50:'#FEEBFB',p25:'#FFF5FD'},
  blue:  {name:'น้ำเงิน',   p700:'#175CD3',p600:'#1570EF',p500:'#2E90FA',p50:'#EFF8FF',p25:'#F5FAFF'},
  teal:  {name:'เขียวหยก',  p700:'#107569',p600:'#0E9384',p500:'#15B79E',p50:'#F0FDF9',p25:'#F6FEF9'},
  orange:{name:'ส้ม',      p700:'#B93815',p600:'#EF6820',p500:'#F38744',p50:'#FEF6EE',p25:'#FEFAF5'}
};
const FONT_SCALES={
  sm:{name:'เล็ก','--fs-body':'14px','--fs-sm':'12px','--fs-xs':'10px','--fs-h1':'17px','--fs-h2':'15px'},
  md:{name:'มาตรฐาน'},   // = ค่าใน tokens.css ไม่ override
  lg:{name:'ใหญ่','--fs-body':'17px','--fs-sm':'15px','--fs-xs':'12px','--fs-h1':'20px','--fs-h2':'18px'}
};
const RADIUS_SETS={
  sharp:{name:'เหลี่ยม','--r-sm':'3px','--r-md':'5px','--r-lg':'6px'},
  md:{name:'มาตรฐาน'},
  round:{name:'โค้งมน','--r-sm':'12px','--r-md':'16px','--r-lg':'24px'}
};
const THEME_VARS=['--primary-700','--primary-600','--primary-500','--primary-50','--primary-25',
  '--fs-body','--fs-sm','--fs-xs','--fs-h1','--fs-h2','--r-sm','--r-md','--r-lg'];

/* ---------- สีกำหนดเอง: hex → HSL → คำนวณ 5 เฉด ---------- */
function hexToHsl(hex){
  const m=/^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if(!m)return null;
  const n=parseInt(m[1],16),r=(n>>16&255)/255,g=(n>>8&255)/255,b=(n&255)/255;
  const mx=Math.max(r,g,b),mn=Math.min(r,g,b),l=(mx+mn)/2;
  if(mx===mn)return[0,0,l*100];
  const d=mx-mn,s=l>0.5?d/(2-mx-mn):d/(mx+mn);
  let h;
  if(mx===r)h=(g-b)/d+(g<b?6:0);
  else if(mx===g)h=(b-r)/d+2;
  else h=(r-g)/d+4;
  return[h*60,s*100,l*100];
}
function hslToHex(h,s,l){
  s/=100;l/=100;
  const k=n=>(n+h/30)%12;
  const a=s*Math.min(l,1-l);
  const f=n=>{const c=l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));return Math.round(c*255).toString(16).padStart(2,'0')};
  return'#'+f(0)+f(8)+f(4);
}
function deriveShades(base){
  const hsl=hexToHsl(base);
  if(!hsl)return PRESETS.pea;
  const[h,s,l]=hsl;
  return{
    p700:hslToHex(h,s,Math.max(12,l-10)),
    p600:hslToHex(h,s,l),
    p500:hslToHex(h,s,Math.min(88,l+10)),
    p50:hslToHex(h,Math.min(s,90),95),
    p25:hslToHex(h,Math.min(s,90),98)
  };
}
function paletteFor(theme){
  if(theme.preset==='custom'&&theme.custom&&theme.custom.base)return deriveShades(theme.custom.base);
  return PRESETS[theme.preset]||PRESETS.pea;
}
/* คืน map ของ CSS var ที่ "ต่างจาก default" — ที่เหลือจะถูก removeProperty ให้กลับค่า tokens.css */
function themeVars(cfg){
  const t=cfg.theme,m={};
  if(t.preset!=='pea'){
    const p=paletteFor(t);
    m['--primary-700']=p.p700;m['--primary-600']=p.p600;m['--primary-500']=p.p500;
    m['--primary-50']=p.p50;m['--primary-25']=p.p25;
  }
  const fs=FONT_SCALES[t.fontScale],rd=RADIUS_SETS[t.radius];
  [fs,rd].forEach(set=>{if(set)Object.keys(set).forEach(k=>{if(k.startsWith('--'))m[k]=set[k]})});
  return m;
}
function applyTheme(cfg){
  const st=document.documentElement.style,m=themeVars(cfg);
  THEME_VARS.forEach(k=>{if(m[k]!==undefined)st.setProperty(k,m[k]);else st.removeProperty(k)});
}

/* ---------- load / save / reset ---------- */
function clone(o){return JSON.parse(JSON.stringify(o))}
function load(){
  try{
    const raw=localStorage.getItem(KEY);
    if(!raw)return clone(DEFAULT_CFG);
    const j=JSON.parse(raw);
    if(!j||j.v!==1)return clone(DEFAULT_CFG);
    return{
      v:1,
      theme:Object.assign({},DEFAULT_CFG.theme,j.theme),
      toggles:Object.assign({},DEFAULT_CFG.toggles,j.toggles),
      variants:Object.assign({},DEFAULT_CFG.variants,j.variants),
      data:Object.assign({},DEFAULT_CFG.data,j.data),
      demo:Object.assign({},DEFAULT_CFG.demo,j.demo)
    };
  }catch(e){return clone(DEFAULT_CFG)}
}
function save(cfg){cfg.v=1;localStorage.setItem(KEY,JSON.stringify(cfg))}
function reset(){localStorage.removeItem(KEY)}

/* ============================================================
   Master data defaults — ย้ายมาจาก mock (แหล่งความจริงเดียว)
   mock ใช้ผ่าน MDC.data('vehicles'|'parts'|'garages')
   ============================================================ */
const defaults={
  vehicles:[
    {id:1,plate:'81-2345 นครราชสีมา',model:'Hino FM8J 6 ล้อ',org:'กฟภ. เขต ฉ.3 นครราชสีมา',attach:'เครน Tadano TM-ZE304'},
    {id:2,plate:'82-6789 ขอนแก่น',model:'Isuzu FTR',org:'กฟภ. เขต ฉ.1 ขอนแก่น',attach:'กระเช้า Aichi SK17A'},
    {id:3,plate:'83-1122 กรุงเทพมหานคร',model:'Mitsubishi Fuso FI',org:'สำนักงานใหญ่ (กบค.)',attach:'เครน Unic URV554'},
    {id:4,plate:'80-5566 เชียงใหม่',model:'Hino XZU กระบะยกสูง',org:'กฟภ. เขต น.1 เชียงใหม่',attach:null}
  ],
  parts:[
    {sym:'HYD-01',code:'SL-4402',name:'ชุดซีลกระบอกไฮดรอลิก',need:1,unit:'ชุด',stock:6,wh:'กบค. สนญ.',icon:'join_inner'},
    {sym:'HYD-01',code:'OL-0046',name:'น้ำมันไฮดรอลิก ISO VG46 18L',need:1,unit:'ถัง',stock:2,wh:'กบค. สนญ.',icon:'oil_barrel'},
    {sym:'HYD-02',code:'PM-2210',name:'ปั๊มไฮดรอลิกเกียร์',need:1,unit:'ตัว',stock:0,eta:'24 ก.ค.',wh:'กบค. สนญ.',icon:'compress'},
    {sym:'HYD-02',code:'FT-1108',name:'ไส้กรองไฮดรอลิก',need:2,unit:'ชิ้น',stock:12,wh:'กบค. สนญ.',icon:'filter_alt'},
    {sym:'HYD-03',code:'HS-3808',name:'สายไฮดรอลิกแรงดันสูง 3/8"',need:2,unit:'เส้น',stock:4,wh:'คลังเขต',icon:'cable'},
    {sym:'HYD-03',code:'FT-2205',name:'ข้อต่อไฮดรอลิก',need:4,unit:'ตัว',stock:3,wh:'คลังเขต',icon:'valve'},
    {sym:'BOOM-01',code:'WP-1030',name:'แผ่นสไลด์บูม (wear pad)',need:4,unit:'แผ่น',stock:8,wh:'กบค. สนญ.',icon:'layers'},
    {sym:'BOOM-01',code:'GR-0002',name:'จาระบี EP2',need:1,unit:'หลอด',stock:20,wh:'คลังเขต',icon:'colorize'},
    {sym:'BOOM-02',code:'WR-1000',name:'ลวดสลิง 10 มม.',need:25,unit:'เมตร',stock:0,wh:'กบค. สนญ.',icon:'line_weight'},
    {sym:'BOOM-03',code:'LK-0770',name:'ชุดล็อกกระเช้า',need:1,unit:'ชุด',stock:5,wh:'กบค. สนญ.',icon:'lock'},
    {sym:'ELEC-01',code:'BT-0912',name:'แบตเตอรี่รีโมท',need:2,unit:'ก้อน',stock:15,wh:'คลังเขต',icon:'battery_full'},
    {sym:'ELEC-01',code:'RC-5521',name:'ชุดรับสัญญาณรีโมท',need:1,unit:'ชุด',stock:1,wh:'กบค. สนญ.',icon:'settings_remote'},
    {sym:'ELEC-02',code:'SN-3310',name:'เซ็นเซอร์ load cell',need:1,unit:'ตัว',stock:0,eta:'31 ก.ค.',wh:'กบค. สนญ.',icon:'sensors'},
    {sym:'ENG-01',code:'BT-1212',name:'แบตเตอรี่รถ 12V 120Ah',need:2,unit:'ลูก',stock:5,wh:'คลังเขต',icon:'battery_charging_full'},
    {sym:'ENG-02',code:'FT-0330',name:'ไส้กรองอากาศ',need:1,unit:'ชิ้น',stock:9,wh:'คลังเขต',icon:'air'}
  ],
  garages:[
    {id:'g1',name:'อู่เจริญการช่าง',dist:'3.2 กม.',tags:'เครน · ไฮดรอลิก'},
    {id:'g2',name:'อู่ ส.ทวีชัย เซอร์วิส',dist:'5.8 กม.',tags:'รถบรรทุก 6 ล้อ · ช่วงล่าง'},
    {id:'g3',name:'อู่มิตรภาพทรัค',dist:'12 กม.',tags:'เครื่องยนต์ · ระบบไฟฟ้า'}
  ]
};
function data(name){
  const c=load();
  return clone(c.data[name]||defaults[name]);
}
/* สำเนา SYMPTOMS (id/name) — ใช้ทำ dropdown "อาการที่เกี่ยวข้อง" ในหน้า admin เท่านั้น */
const SYM_OPTS=[
  {id:'HYD-01',name:'กระบอกไฮดรอลิกรั่ว/ซึม'},
  {id:'HYD-02',name:'ปั๊มไฮดรอลิกเสียงดัง/แรงดันตก'},
  {id:'HYD-03',name:'สายไฮดรอลิกแตก/รั่ว'},
  {id:'BOOM-01',name:'บูมยืด-หดสะดุด'},
  {id:'BOOM-02',name:'ลวดสลิงหย่อน/เส้นใยขาด'},
  {id:'BOOM-03',name:'กระเช้าเอียง/ล็อกไม่อยู่'},
  {id:'ELEC-01',name:'รีโมทคอนโทรลไม่ทำงาน'},
  {id:'ELEC-02',name:'ไฟเตือน load sensor ขึ้น'},
  {id:'ENG-01',name:'สตาร์ทไม่ติด'},
  {id:'ENG-02',name:'ควันดำ/กำลังตก'}
];

/* ============================================================
   Demo seeds — ชุดข้อมูลงานซ่อมสำเร็จรูป
   ทุก seed ตั้ง seq:60 → เลขเอกสารใหม่จาก mock = MTD-690717-061 ไม่ชนกัน
   ============================================================ */
const T='19 ก.ค. 2569';
const INSP_IN={fuel:'½',odo:'84,120',defects:[{zone:'ด้านขวา (ประตู/แก้มข้าง)',note:'รอยขีดข่วนเดิม'}],extra:'',t:T+' 09:30'};
const INSP_OUT={fuel:'½',odo:'84,150',defects:[{zone:'ด้านขวา (ประตู/แก้มข้าง)',note:'รอยขีดข่วนเดิม'}],extra:'ทดสอบยกโหลด 80% ปกติ',t:T+' 15:30'};
const SLOTS=[
  {label:'อ. 21 ก.ค.',date:'21/7/2569',times:['เช้า 09:00–12:00','บ่าย 13:30–16:30']},
  {label:'พ. 22 ก.ค.',date:'22/7/2569',times:['เช้า 09:00–12:00']}
];

const SEED_QUEUE3=[
  {no:'MTD-690719-051',plate:'81-2345 นครราชสีมา',model:'Hino FM8J 6 ล้อ + เครน Tadano TM-ZE304',org:'กฟภ. เขต ฉ.3 นครราชสีมา',target:'เครน Tadano TM-ZE304',
   syms:['กระบอกไฮดรอลิกรั่ว/ซึม'],sev:'สูง',photos:2,desc:'น้ำมันซึมใต้กระบอกที่ 2 เวลายกของหนัก',
   booked:[{name:'ชุดซีลกระบอกไฮดรอลิก',qty:1,unit:'ชุด'}],ordered:[],reason:'ต้องถอดกระบอกด้วยเครื่องมือเฉพาะ',
   phase:'pending',wi:0,history:[{t:T+' 08:40',label:'ส่งเรื่องถึง กบค. — รอรับเรื่อง'}]},
  {no:'MTD-690719-052',plate:'82-6789 ขอนแก่น',model:'Isuzu FTR + กระเช้า Aichi SK17A',org:'กฟภ. เขต ฉ.1 ขอนแก่น',target:'กระเช้า Aichi SK17A',
   syms:['รีโมทคอนโทรลไม่ทำงาน'],sev:'ปานกลาง',photos:1,desc:'กดรีโมทแล้วกระเช้าไม่ตอบสนองเป็นบางครั้ง',
   booked:[{name:'แบตเตอรี่รีโมท',qty:2,unit:'ก้อน'}],ordered:[],reason:'ลองเปลี่ยนแบตแล้วยังไม่หาย สงสัยชุดรับสัญญาณ',
   phase:'pending',wi:0,history:[{t:T+' 10:15',label:'ส่งเรื่องถึง กบค. — รอรับเรื่อง'}]},
  {no:'MTD-690719-053',plate:'83-1122 กรุงเทพมหานคร',model:'Mitsubishi Fuso FI + เครน Unic URV554',org:'สำนักงานใหญ่ (กบค.)',target:'เครน Unic URV554',
   syms:['ไฟเตือน load sensor ขึ้น'],sev:'หยุดใช้งาน',photos:3,desc:'ไฟเตือนขึ้นค้าง ยกงานไม่ได้',
   booked:[],ordered:[{name:'เซ็นเซอร์ load cell',qty:1,unit:'ตัว',eta:'31 ก.ค.'}],reason:'อะไหล่หมดคลัง รอของเข้า',
   phase:'pending',wi:0,history:[{t:T+' 13:05',label:'ส่งเรื่องถึง กบค. — รอรับเรื่อง'}]}
];

const SEED_MIXED6=[
  {no:'MTD-690719-054',plate:'80-5566 เชียงใหม่',model:'Hino XZU กระบะยกสูง',org:'กฟภ. เขต น.1 เชียงใหม่',target:'ตัวรถ',
   syms:['สตาร์ทไม่ติด'],sev:'ปานกลาง',photos:1,desc:'สตาร์ทติดยากตอนเช้า',
   booked:[{name:'แบตเตอรี่รถ 12V 120Ah',qty:2,unit:'ลูก'}],ordered:[],reason:'เปลี่ยนแบตเตอรี่เองที่หน่วยงานได้',
   phase:'self',wi:0,history:[{t:T+' 08:30',label:'บันทึกเรื่อง — ดำเนินการซ่อมเอง'}]},
  SEED_QUEUE3[0],
  {no:'MTD-690718-055',plate:'82-6789 ขอนแก่น',model:'Isuzu FTR + กระเช้า Aichi SK17A',org:'กฟภ. เขต ฉ.1 ขอนแก่น',target:'กระเช้า Aichi SK17A',
   syms:['ปั๊มไฮดรอลิกเสียงดัง/แรงดันตก'],sev:'ปานกลาง',photos:1,desc:'แรงดันตกตอนยกโหลดเกินครึ่ง',
   booked:[{name:'ไส้กรองไฮดรอลิก',qty:2,unit:'ชิ้น'}],ordered:[{name:'ปั๊มไฮดรอลิกเกียร์',qty:1,unit:'ตัว',eta:'24 ก.ค.'}],reason:'ปั๊มต้องเปลี่ยนทั้งลูก รอของเข้า',
   inspIn:INSP_IN,phase:'work',wi:1,
   history:[{t:'18 ก.ค. 2569 10:05',label:'ส่งเรื่องถึง กบค. — รอรับเรื่อง'},{t:'18 ก.ค. 2569 15:40',label:'กบค. รับเรื่องซ่อม'},{t:T+' 09:30',label:'ตรวจสภาพรับรถเข้าซ่อม (ขาเข้า) — น้ำมัน ½ · ตำหนิรอบตัวรถ 1 จุด'},{t:T+' 10:00',label:'สถานะ: รอสั่งอะไหล่ (ปั๊มไฮดรอลิกเกียร์ ETA 24 ก.ค.)'}]},
  {no:'MTD-690718-056',plate:'81-2345 นครราชสีมา',model:'Hino FM8J 6 ล้อ + เครน Tadano TM-ZE304',org:'กฟภ. เขต ฉ.3 นครราชสีมา',target:'เครน Tadano TM-ZE304',
   syms:['บูมยืด-หดสะดุด'],sev:'ปานกลาง',photos:2,desc:'บูมสะดุดช่วงยืดสุด',
   booked:[{name:'แผ่นสไลด์บูม (wear pad)',qty:4,unit:'แผ่น'}],ordered:[],reason:'ต้องยกบูมลงตรวจราง ใช้เครนช่วย',
   inspIn:INSP_IN,phase:'slots',wi:4,slots:SLOTS,slotNote:'จุดรับรถ ลานจอด กบค. อาคาร 3',
   history:[{t:'17 ก.ค. 2569 11:00',label:'ส่งเรื่องถึง กบค. — รอรับเรื่อง'},{t:'17 ก.ค. 2569 14:00',label:'กบค. รับเรื่องซ่อม'},{t:'18 ก.ค. 2569 09:00',label:'ตรวจสภาพรับรถเข้าซ่อม (ขาเข้า) — น้ำมัน ½ · ตำหนิรอบตัวรถ 1 จุด'},{t:T+' 11:30',label:'สถานะ: ซ่อมเสร็จ'},{t:T+' 11:45',label:'กบค. เปิดตารางว่างนัดรับ 2 วัน — รอผู้แจ้งเลือกยืนยัน'}]},
  {no:'MTD-690718-057',plate:'83-1122 กรุงเทพมหานคร',model:'Mitsubishi Fuso FI + เครน Unic URV554',org:'สำนักงานใหญ่ (กบค.)',target:'เครน Unic URV554',
   syms:['สายไฮดรอลิกแตก/รั่ว'],sev:'สูง',photos:2,desc:'สายแรงดันสูงรั่วบริเวณข้อต่อ',
   booked:[{name:'สายไฮดรอลิกแรงดันสูง 3/8"',qty:2,unit:'เส้น'}],ordered:[],reason:'ต้องอัดสายใหม่ด้วยเครื่องอัดของ กบค.',
   inspIn:INSP_IN,phase:'appt',wi:4,slots:SLOTS,appt:{date:'21/7/2569',time:'09:00–12:00',note:'จุดรับรถ ลานจอด กบค. อาคาร 3'},
   history:[{t:'17 ก.ค. 2569 09:20',label:'ส่งเรื่องถึง กบค. — รอรับเรื่อง'},{t:'17 ก.ค. 2569 13:00',label:'กบค. รับเรื่องซ่อม'},{t:'18 ก.ค. 2569 10:00',label:'ตรวจสภาพรับรถเข้าซ่อม (ขาเข้า) — น้ำมัน ½ · ตำหนิรอบตัวรถ 1 จุด'},{t:T+' 10:30',label:'สถานะ: ซ่อมเสร็จ'},{t:T+' 14:00',label:'ผู้แจ้งยืนยันนัดรับรถ อ. 21 ก.ค. เช้า 09:00–12:00 (พร้อมตรวจสภาพหลังซ่อม)'}]},
  {no:'MTD-690717-058',plate:'82-6789 ขอนแก่น',model:'Isuzu FTR + กระเช้า Aichi SK17A',org:'กฟภ. เขต ฉ.1 ขอนแก่น',target:'กระเช้า Aichi SK17A',
   syms:['กระเช้าเอียง/ล็อกไม่อยู่'],sev:'สูง',photos:2,desc:'ล็อกกระเช้าหลวม เอียงตอนยกสุด',
   booked:[{name:'ชุดล็อกกระเช้า',qty:1,unit:'ชุด'}],ordered:[],reason:'ต้องปรับตั้งระบบล็อกด้วยเครื่องมือเฉพาะ',
   inspIn:INSP_IN,inspOut:INSP_OUT,phase:'closed',wi:4,appt:{date:'19/7/2569',time:'13:30–16:30',note:''},
   history:[{t:'16 ก.ค. 2569 14:20',label:'ส่งเรื่องถึง กบค. — รอรับเรื่อง'},{t:'17 ก.ค. 2569 09:00',label:'กบค. รับเรื่องซ่อม'},{t:'17 ก.ค. 2569 09:40',label:'ตรวจสภาพรับรถเข้าซ่อม (ขาเข้า) — น้ำมัน ½ · ตำหนิรอบตัวรถ 1 จุด'},{t:'18 ก.ค. 2569 16:00',label:'สถานะ: ซ่อมเสร็จ'},{t:T+' 13:30',label:'ผู้แจ้งยืนยันนัดรับรถ ส. 19 ก.ค. บ่าย 13:30–16:30 (พร้อมตรวจสภาพหลังซ่อม)'},{t:T+' 15:30',label:'ตรวจสภาพขาออกผ่าน (น้ำมัน ½ · ตำหนิ 1 จุด) — ส่งมอบรถ ปิดงาน'}]}
];

const seeds={
  default:{label:'ข้อมูลตั้งต้น (2 งาน)',desc:'งานตัวอย่างที่มากับ mock เดิม',make:()=>null},
  empty:{label:'ล้างงานทั้งหมด (0 งาน)',desc:'เริ่มจากคิวว่าง — เดโมตั้งแต่แจ้งซ่อมเรื่องแรก',make:()=>[]},
  queue3:{label:'คิวรอรับเรื่อง 3 งาน',desc:'ซ้อมจังหวะ กบค. รับเรื่อง/ส่งกลับ ได้หลายรอบ',make:()=>clone(SEED_QUEUE3)},
  mixed6:{label:'หลากสถานะ 6 งาน',desc:'เห็นครบทุกสถานะ: ซ่อมเอง · รอรับเรื่อง · รออะไหล่ · รอเลือกนัด · นัดแล้ว · ปิดงาน',make:()=>clone(SEED_MIXED6)}
};

window.MDC={KEY,DEFAULT_CFG,PRESETS,FONT_SCALES,RADIUS_SETS,VARIANTS,THEME_VARS,
  deriveShades,paletteFor,themeVars,applyTheme,load,save,reset,data,defaults,SYM_OPTS,seeds,clone};

/* apply ธีมทันทีที่โหลดไฟล์ — ก่อน body render จึงไม่มี flash สีเดิม */
applyTheme(load());
})();
