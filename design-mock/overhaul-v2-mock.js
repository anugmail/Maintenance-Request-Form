/* ข้อมูลจำลอง + สถานะร่วมของชุดหน้าจอ Overhaul v2 (userflow "จัดการงาน Overhaul" 14 scenario · เจ้าของงานเคาะ 16 ต.ค. 2569 ให้ใช้แทนชุด 12 ต.ค.)
   โครง: แผน → PO (1 ใบหลายคัน) → งานรายคัน 6 ขั้น · ชื่อสถานะเป็นร่างตาม Diagram/01-บำรุงรักษาตามวาระ/12-overhaul-สถานะ.md (P1–P3 · V1–V11)
   เก็บใน localStorage คีย์ oh2-mock-v1 · เลขแผน ทะเบียน ชื่อบริษัท และตัวเลขทั้งหมดเป็นค่าสมมติ */

const OH2_KEY='oh2-mock-v4';   // v3 (19 ต.ค. 2569): แผนและ PO มีเอกสารตัวอย่าง · v4 (5 พ.ย. 2569): plan.cars เปลี่ยนจาก string[] เป็น [{id,estPrice,estOverhaul}] — บังคับ re-seed

/* รถที่เลือกเข้า PO ได้ — ตาราง (เจ้าของงานสั่ง 5 พ.ย. 2569 เปลี่ยนจาก dropdown เป็น table ให้เห็น info มากขึ้น)
   เพิ่ม: dept (สังกัด) · acqValue (มูลค่าได้มา) · refPrice (ราคากลาง กบค. — เจ้าของงานขอเพิ่ม) · status (สถานะการใช้งาน ทั่วไป ไม่ใช่สถานะงาน Overhaul V1-V11) */
const OH2_VEHICLES=[
  {id:'c1',plate:'8234 กค กทม',brand:'HINO FM2P',type:'รถเครน 10 ตัน',mileage:182400,age:12,hours:9800,dept:'กฟฟ.กทม.',acqValue:2030000,refPrice:1950000,status:'พร้อมใช้งาน'},
  {id:'c2',plate:'81-5521 นครปฐม',brand:'ISUZU FVM',type:'รถกระเช้า',mileage:210050,age:14,hours:11200,dept:'กฟฟ.นครปฐม',acqValue:1880000,refPrice:1800000,status:'พร้อมใช้งาน'},
  {id:'c3',plate:'70-1123 ชลบุรี',brand:'HINO FG8J',type:'รถเครน 5 ตัน',mileage:150200,age:11,hours:8100,dept:'กฟฟ.ชลบุรี',acqValue:1650000,refPrice:1600000,status:'พร้อมใช้งาน'},
  {id:'c4',plate:'82-0457 สระบุรี',brand:'ISUZU FXZ',type:'รถเจาะหลุมปักเสา',mileage:198700,age:13,hours:10400,dept:'กฟฟ.สระบุรี',acqValue:1920000,refPrice:1850000,status:'อยู่ระหว่างซ่อม'},
  {id:'c5',plate:'71-9902 ขอนแก่น',brand:'MITSUBISHI FN',type:'รถกระเช้า',mileage:233100,age:15,hours:12900,dept:'กฟฟ.ขอนแก่น',acqValue:2130000,refPrice:2050000,status:'พร้อมใช้งาน'},
  {id:'c6',plate:'80-3316 เชียงใหม่',brand:'HINO FM1A',type:'รถเครน 10 ตัน',mileage:176900,age:10,hours:7600,dept:'กฟฟ.เชียงใหม่',acqValue:1980000,refPrice:1900000,status:'พร้อมใช้งาน'},
  {id:'c7',plate:'83-2210 นครราชสีมา',brand:'ISUZU FVZ',type:'รถเจาะหลุมปักเสา',mileage:205400,age:12,hours:10900,dept:'กฟฟ.นครราชสีมา',acqValue:2260000,refPrice:2150000,status:'พร้อมใช้งาน'},
  {id:'c8',plate:'72-6648 สงขลา',brand:'HINO FG1J',type:'รถกระเช้า',mileage:221300,age:16,hours:13300,dept:'กฟฟ.สงขลา',acqValue:2480000,refPrice:2380000,status:'พร้อมใช้งาน'},
];

/* ศูนย์บริการ/อู่ — userflow เขียนว่า vendor list "(mockup)" ⇒ ยังไม่มีแหล่งข้อมูลจริง */
const OH2_VENDORS=[
  {name:'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด',tel:'02-111-2201',addr:'เขตบางนา กรุงเทพฯ'},
  {name:'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด',tel:'02-111-2202',addr:'เขตพระนคร กรุงเทพฯ'},
  {name:'บริษัท มิตซูบิชิ ฟูโซ่ ทรัค จำกัด',tel:'02-111-2203',addr:'อ.บางพลี สมุทรปราการ'},
];

/* สถานะงานรายคัน (V1–V12) และของแผน (P1–P3) — ป้ายใช้ .badge (Pill outline)
   6 พ.ย. 2569 (T.1) — เจ้าของงานสั่งขั้นปิดงานต้องส่งผู้บังคับบัญชาอนุมัติก่อน ⇒ เพิ่มขั้นที่ 7 "ยืนยันการส่งอนุมัติ"
   V11 เดิม = "ปิดงานแล้ว" ย้ายไป V12 · V11 ใหม่ = "รอ ผบช. อนุมัติปิดงาน" (หน้าสรุปก่อนส่งอนุมัติ) */
const OH2_JOB={
  V1:['รอนัดหมายเข้าอู่','b-neutral'],V2:['รอหน่วยงานตอบรับนัดเข้าอู่','b-low'],V3:['หน่วยงานปฏิเสธนัดเข้าอู่','b-out'],
  V4:['รอตรวจรับรถ','b-low'],V5:['กำลังซ่อม','b-info'],V6:['รอตรวจสภาพ Safety','b-low'],
  V7:['รอนัดหมายรับรถ','b-neutral'],V8:['รอหน่วยงานตอบรับนัดรับรถ','b-low'],V9:['หน่วยงานปฏิเสธนัดรับรถ','b-out'],
  V10:['รอปิดงาน','b-brand'],V11:['รอ ผบช. อนุมัติปิดงาน','b-brand'],V12:['ปิดงานแล้ว','b-ok'],
};
const OH2_PLAN={P1:['ยังไม่มี PO','b-neutral'],P2:['ดำเนินการ','b-info'],P3:['เสร็จสิ้น','b-ok']};
/* สถานะการใช้งานรถ (ทั่วไป) — คนละชุดกับสถานะงาน Overhaul V1-V11 (OH2_JOB) ใช้ในตารางเลือกรถ (เจ้าของงานสั่ง 5 พ.ย. 2569) */
const OH2_VEH_STATUS={'พร้อมใช้งาน':'b-ok','อยู่ระหว่างซ่อม':'b-low','ไม่พร้อมใช้งาน':'b-out'};
function oh2VehBadge(status){const c=OH2_VEH_STATUS[status]||'b-neutral';return `<span class="badge ${c}">${oh2Esc(status)}</span>`}
/* แถวตารางเลือกรถ — ใช้ร่วมกันทั้งหน้าสร้างแผน (เลือกจาก OH2_VEHICLES ทั้งหมด) และฟอร์ม PO (เลือกจากรถในแผนเท่านั้น) กันโค้ดซ้ำ/ค่าเพี้ยนกัน (5 พ.ย. 2569)
   est = {estPrice, estOverhaul} ส่งมาเฉพาะหน้าสร้างแผน (5 พ.ย. 2569 รอบ 2) — เพิ่ม 2 คอลัมน์กรอกราคาประมาณการ/ราคา Overhaul แบบประเมินรายคัน (ผูกกับแผนนี้เท่านั้น)
   ไม่ส่ง est (undefined) = ไม่แสดง 2 คอลัมน์นี้ (ฟอร์ม PO คงหน้าตาเดิม) */
function oh2VehRow(v,checked,est){return `<tr>
    <td><input type="checkbox" class="veh-ck" value="${v.id}"${checked?' checked':''} aria-label="เลือก ${oh2Esc(v.plate)}"></td>
    <td><div class="cell-key">${oh2Esc(v.plate)}</div></td>
    <td>${oh2Esc(v.brand)}<div class="cell-sub">${oh2Esc(v.type)}</div></td>
    <td class="num">${oh2Num(v.mileage)} กม.<div class="cell-sub">${oh2Num(v.hours)} ชม.</div></td>
    <td class="num">${v.age} ปี</td>
    <td class="num">${oh2Money(v.acqValue)} บาท<div class="cell-sub">ราคากลาง ${oh2Money(v.refPrice)} บาท</div></td>
    <td>${oh2VehBadge(v.status)}<div class="cell-sub">${oh2Esc(v.dept)}</div></td>
    ${est?`<td><input type="number" min="0" step="1000" class="in veh-est-price" data-id="${v.id}" value="${est.estPrice||''}"${checked?'':' disabled'} aria-label="ราคาประมาณการ (ซื้อใหม่ทดแทน) ${oh2Esc(v.plate)}" placeholder="บาท"></td>
    <td><input type="number" min="0" step="1000" class="in veh-est-overhaul" data-id="${v.id}" value="${est.estOverhaul||''}"${checked?'':' disabled'} aria-label="ราคา Overhaul แบบประเมิน ${oh2Esc(v.plate)}" placeholder="บาท"></td>`:''}
    <td class="text-center"><button class="btn btn-t btn-icon" type="button" data-todo="ดูรายละเอียดรถ ${oh2Esc(v.plate)}" aria-label="ดูรายละเอียด ${oh2Esc(v.plate)}"><span class="ms">open_in_new</span></button></td>
  </tr>`}

function oh2Seed(){
  const po=(id,name,vendor,cars)=>({id,name,vendor,cars,docs:{order:[{name:`ใบสั่งจ้าง-${id}.pdf`,size:512000}],other:[]}});
  /* เอกสารตัวอย่างของแผน — ชื่อไฟล์/ขนาดสมมติ (ให้หน้าแก้ไขมีไฟล์เดิมให้เห็น) */
  const docs=(id)=>({approve:[{name:`หนังสืออนุมัติหลักการ-${id}.pdf`,size:842000}],budget:[{name:`เอกสารอนุมัติงบ-${id}.pdf`,size:615000}],other:[]});
  /* cars = รถที่ "จอง" ไว้กับแผนตั้งแต่ขั้นสร้างแผน (เจ้าของงานสั่ง 5 พ.ย. 2569 "เลือกรถในแผนก่อน แล้วแต่ละ PO ค่อยเลือกรถจากในแผนอีกที")
     ⇒ plan.cars = เพดานรถที่ PO ของแผนนั้นเลือกได้ · ไม่ใช่รถที่มี PO แล้วเท่านั้น (ดู 123458/123459 ที่ยังไม่มี PO แต่จองรถไว้แล้ว ตามที่ "พี่วิทย์" ขอให้ผู้บริหารเห็นแผนล่วงหน้าได้)
     ของเดิมที่มี PO อยู่แล้ว ต้องมีรถครบในชุดนี้ด้วย (ไม่งั้นแก้ไข PO เดิมจะไม่เห็นรถที่เลือกไว้แล้ว)
     5 พ.ย. 2569 (รอบ 2) — แต่ละรถในแผนแก้ไข/เพิ่ม "ราคาประมาณการ (ซื้อใหม่ทดแทน)" + "ราคา Overhaul แบบประเมิน" ได้ — ผูกกับแผนนี้เท่านั้น (ไม่ใช่ข้อมูลถาวรของรถ)
     ใช้เทียบ "คุ้มไหมที่จะ Overhaul" ตอนวางแผน และเป็นข้อมูลตั้งต้นให้ dashboard ผู้บริหาร "เทียบราคาซื้อใหม่" ⇒ cars เก็บเป็น [{id, estPrice, estOverhaul}] แทนสตริง id เฉยๆ */
  const cw=(id,estPrice,estOverhaul)=>({id,estPrice,estOverhaul});
  const plan=(id,name,year,wbs,net,act,budget,created,pos,remark,cars)=>({id,name,year,wbs,net,act,budget,created,pos,remark:remark||'',cars:cars||[],docs:docs(id)});
  const s={plans:[
    plan('123456','Overhaul ประจำปีงบ 2569 — รถเครน',2569,'C-69-OH-0101','60001234','0010',10000000,'2026-08-12',[po('PO-690101','ซ่อมระบบเครื่องยนต์',0,['c1','c3']),po('PO-690102','ซ่อมระบบไฮดรอลิกเครน',0,['c6']),po('PO-690103','ซ่อมระบบแอร์',1,['c1'])],'งานข้ามปีงบ 2569→2570 รออะไหล่นำเข้าจากต่างประเทศ (เครื่องยนต์)',[cw('c1',2700000,250000),cw('c3',2200000,190000),cw('c6',2650000,215000)]),
    plan('123457','Overhaul ประจำปีงบ 2569 — รถกระเช้า',2569,'C-69-OH-0102','60001235','0010',8500000,'2026-08-20',[po('PO-690201','ซ่อมระบบกระเช้าและช่วงล่าง',1,['c2','c5','c8'])],'',[cw('c2',2500000,230000),cw('c5',2850000,265000),cw('c8',3300000,340000)]),
    plan('123458','Overhaul ประจำปีงบ 2569 — รถเจาะหลุม',2569,'C-69-OH-0103','60001236','0020',6200000,'2026-09-02',[],'',[cw('c4',2550000,310000)]),
    plan('123459','Overhaul ประจำปีงบ 2570 — รถเครน กฟน.1',2570,'C-70-OH-0001','60002101','0010',12400000,'2026-10-01',[],'',[cw('c6',2650000,215000),cw('c7',3000000,280000)]),
    plan('123401','Overhaul ประจำปีงบ 2568 — รถเครน',2568,'C-68-OH-0101','60000981','0010',9800000,'2025-07-15',[po('PO-680101','ซ่อมระบบเครื่องยนต์และเกียร์',0,['c4','c7'])],'',[cw('c4',2550000,310000),cw('c7',3000000,280000)]),
    plan('123402','Overhaul ประจำปีงบ 2568 — รถกระเช้า',2568,'C-68-OH-0102','60000982','0020',4300000,'2025-08-01',[po('PO-680201','ซ่อมระบบกระเช้า',2,['c5'])],'',[cw('c5',2850000,265000)]),
    plan('123460','Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้',2570,'C-70-OH-0002','60002102','0030',21500000,'2026-10-10',[po('PO-700201','ซ่อมช่วงล่างและระบบเบรก',2,['c8'])],'ดำเนินการต่อเนื่องจากปีงบ 2569 — รอผลประเมินโครงสร้างตัวถังเพิ่มเติม',[cw('c8',3300000,340000),cw('c1',2700000,250000)]),
  ],jobs:{}};
  /* ให้แต่ละคันอยู่คนละขั้น — เปิดมาเห็นสถานะหลายแบบ */
  const st={'123456':{c1:'V5',c3:'V2',c6:'V1'},'123457':{c2:'V8',c5:'V3',c8:'V10'},'123401':{c4:'V12',c7:'V12'},'123402':{c5:'V12'},'123460':{c8:'V1'}};
  for(const [pid,m] of Object.entries(st))for(const [cid,v] of Object.entries(m))s.jobs[pid+':'+cid]={stage:v};
  return s;
}
function oh2Load(){try{const s=JSON.parse(localStorage.getItem(OH2_KEY));if(s&&s.plans)return s}catch(e){}const s=oh2Seed();oh2Save(s);return s}
function oh2Save(s){try{localStorage.setItem(OH2_KEY,JSON.stringify(s))}catch(e){}}
function oh2Reset(){try{localStorage.removeItem(OH2_KEY)}catch(e){}return oh2Load()}

/* รถทั้งหมดในแผน (ไม่ซ้ำ) · สถานะแผนคิดจาก PO + งานรายคัน */
function oh2PlanCars(p){return [...new Set(p.pos.flatMap(x=>x.cars))]}
function oh2PlanStatus(s,p){
  if(!p.pos.length)return 'P1';
  const cars=oh2PlanCars(p);
  return cars.length&&cars.every(c=>(s.jobs[p.id+':'+c]||{}).stage==='V12')?'P3':'P2';
}
function oh2Badge(map,code){const [t,c]=map[code];return `<span class="badge ${c}">${oh2Esc(t)}</span>`}

/* รูปแบบตัวเลข/วันที่ — วันที่ตามหน้าจริง (UI Release#2 Contract list: 09/08/2565) */
function oh2Esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function oh2Money(n){return Number(n||0).toLocaleString('th-TH')}
function oh2Num(n){return Number(n||0).toLocaleString('th-TH')}
function oh2Date(iso){if(!iso)return '—';const [y,m,d]=iso.split('-');return `${d}/${m}/${+y+543}`}

/* Notification (.notif) — ตามไลบรารี `Notification` · หายเองใน 4 วินาที หรือกด ✕ */
function oh2Notify(title,{err=false,sub=''}={}){
  let n=document.getElementById('notif');
  if(!n){n=document.createElement('div');n.id='notif';n.className='notif';n.setAttribute('role','status');
    n.innerHTML='<span class="ms notif-ic"></span><div class="notif-tx"><b></b><span></span></div><button class="notif-x" type="button" aria-label="ปิด"><span class="ms">close</span></button>';
    n.querySelector('.notif-x').addEventListener('click',()=>n.classList.remove('show'));document.body.appendChild(n)}
  n.classList.toggle('err',err);n.querySelector('.notif-ic').textContent=err?'cancel':'check_circle';
  n.querySelector('b').textContent=title;n.querySelector('.notif-tx span').textContent=sub;
  n.classList.add('show');clearTimeout(n._t);n._t=setTimeout(()=>n.classList.remove('show'),4000);
}

/* Modal เปิด/ปิด — โครง .modal-overlay > .modal (ปิดด้วย ✕ · คลิกฉากหลัง · Esc) */
function oh2Modal(id,open){const m=document.getElementById(id);m.classList.toggle('hidden',!open);document.body.classList.toggle('modal-open',open)}
document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m=>oh2Modal(m.id,false));
  document.querySelectorAll('details.dd[open]').forEach(d=>d.open=false)});
document.addEventListener('click',e=>{
  if(e.target.classList&&e.target.classList.contains('modal-overlay'))oh2Modal(e.target.id,false);
  const x=e.target.closest&&e.target.closest('[data-close]');if(x)oh2Modal(x.dataset.close,false);
  /* เมนู "…" — เปิดได้ทีละอัน · คลิกนอกเมนูแล้วปิด */
  document.querySelectorAll('details.dd[open]').forEach(d=>{if(!d.contains(e.target))d.open=false});
});

/* Search-select (.combo) — พิมพ์กรองรายการ · เลือกแล้วติ๊กถูก · onPick(value) */
function oh2Combo(root,items,onPick){
  const inp=root.querySelector('input'),list=root.querySelector('.combo-list'),arrow=root.querySelector('.combo-arrow');
  let picked='';
  const draw=()=>{const q=inp.value.trim().toLowerCase();const rows=items.filter(i=>!q||i.label.toLowerCase().includes(q)||(i.sub||'').toLowerCase().includes(q));
    list.innerHTML=rows.length?rows.map(i=>`<button type="button" class="combo-opt${i.value===picked?' sel':''}" data-v="${oh2Esc(i.value)}"><span class="combo-opt-tx"><b>${oh2Esc(i.label)}</b>${i.sub?`<small>${oh2Esc(i.sub)}</small>`:''}</span><span class="ms">check</span></button>`).join(''):'<div class="combo-empty">ไม่พบรายการ</div>'};
  const open=o=>{list.hidden=!o;if(arrow)arrow.textContent=o?'keyboard_arrow_up':'keyboard_arrow_down';if(o)draw()};
  inp.addEventListener('focus',()=>open(true));inp.addEventListener('input',()=>{open(true)});
  list.addEventListener('mousedown',e=>{const b=e.target.closest('.combo-opt');if(!b)return;e.preventDefault();picked=b.dataset.v;
    inp.value=(items.find(i=>i.value===picked)||{}).label||'';open(false);onPick&&onPick(picked)});
  inp.addEventListener('blur',()=>open(false));
  return {clear(){picked='';inp.value='';onPick&&onPick('')},get value(){return picked}};
}

/* เมนู "…" อยู่ในตาราง (.tblwrap ตัดส่วนเกินทิ้ง) ⇒ ตอนเปิดยกเมนูเป็น position:fixed วางชิดขวาใต้ปุ่ม · ล้นจอล่างให้เปิดขึ้นบน
   เลื่อนหน้าแล้วเมนูเลื่อนตามปุ่ม (เดิมปิดทิ้งตอนเลื่อน — การเลื่อนเข้าหาปุ่มตอนกดทำให้เมนูปิดเองทันที) */
function oh2PlaceMenu(d){
  const m=d.querySelector('.dd-menu'),r=d.querySelector('summary').getBoundingClientRect();
  m.style.position='fixed';m.style.right='auto';m.style.left=Math.max(8,r.right-m.offsetWidth)+'px';
  const below=r.bottom+4,h=m.offsetHeight;m.style.top=(below+h>innerHeight-8?Math.max(8,r.top-4-h):below)+'px';
}
document.addEventListener('toggle',e=>{
  const d=e.target;if(!(d.matches&&d.matches('details.dd'))||!d.open)return;
  document.querySelectorAll('details.dd[open]').forEach(o=>{if(o!==d)o.open=false});
  oh2PlaceMenu(d);
},true);
window.addEventListener('scroll',()=>document.querySelectorAll('details.dd[open]').forEach(oh2PlaceMenu),true);


/* ปีงบประมาณ — ค่าตั้งต้นปีปัจจุบัน (พ.ศ.) นับไปข้างหน้า ไม่มีปีย้อนหลัง (userflow Create Plan) */
function oh2Years(n){const y=new Date().getFullYear()+543;return Array.from({length:n||5},(_,i)=>y+i)}
function oh2Size(b){return b>=1048576?(b/1048576).toFixed(1)+' MB':Math.max(1,Math.round(b/1024))+' KB'}
function oh2NextPlanId(s){return String(Math.max(0,...s.plans.map(p=>+p.id))+1)}

/* กล่องอัปโหลดเอกสาร (.fu + .fu-list) — ตาม `File upload` Type=Default ของไลบรารี
   userflow: สูงสุด 10 ไฟล์ · PDF, JPEG · ดาวน์โหลดได้ · ดูตัวอย่างได้ (กดชื่อไฟล์) · ไฟล์ชนิดอื่นขึ้นสถานะผิดพลาดของรายการ
   root = element ที่มี label.fu + .fu-list · files = array {name,size} (แก้ในที่) · onChange() เรียกเมื่อรายการเปลี่ยน */
const OH2_MAX_FILES=10;
function oh2Upload(root,files,onChange){
  const box=root.querySelector('.fu'),input=box.querySelector('input'),list=root.querySelector('.fu-list');
  const bad=[];   // ไฟล์ที่ชนิดไม่รองรับ — แสดงเป็นรายการผิดพลาด ไม่นับรวมเอกสาร
  const ok=n=>/\.(pdf|jpe?g)$/i.test(n);
  const draw=()=>{
    const full=files.length>=OH2_MAX_FILES;
    box.setAttribute('aria-disabled',full?'true':'false');input.disabled=full;
    root.querySelector('.fu-count').textContent=full?`ครบ ${OH2_MAX_FILES} ไฟล์แล้ว`:`${files.length}/${OH2_MAX_FILES} ไฟล์`;
    list.innerHTML=files.map((f,i)=>`<div class="fu-item"><span class="ficon sm gray"><span class="ms">draft</span></span>
        <span class="fu-item-tx"><b><a href="#" data-prev="${i}" title="ดูตัวอย่าง">${oh2Esc(f.name)}</a></b><small>${oh2Size(f.size)}</small></span>
        <span class="fu-item-act"><button class="btn btn-t btn-icon" type="button" data-dl="${i}" aria-label="ดาวน์โหลด ${oh2Esc(f.name)}"><span class="ms">download</span></button>
        <button class="btn btn-t btn-icon" type="button" data-rm="${i}" aria-label="ลบ ${oh2Esc(f.name)}"><span class="ms">delete</span></button></span></div>`).join('')
      +bad.map((f,i)=>`<div class="fu-item err"><span class="ficon sm gray"><span class="ms">draft</span></span>
        <span class="fu-item-tx"><b>${oh2Esc(f.name)}</b><small>อัปโหลดไม่สำเร็จ — รับเฉพาะไฟล์ PDF หรือ JPG</small></span>
        <span class="fu-item-act"><button class="btn btn-t btn-icon" type="button" data-rmbad="${i}" aria-label="เอาออก ${oh2Esc(f.name)}"><span class="ms">delete</span></button></span></div>`).join('');
  };
  input.addEventListener('change',()=>{
    for(const f of input.files){
      if(!ok(f.name)){bad.push({name:f.name});continue}
      if(files.length>=OH2_MAX_FILES)break;
      files.push({name:f.name,size:f.size});
    }
    input.value='';draw();onChange&&onChange();
  });
  list.addEventListener('click',e=>{
    const t=e.target.closest('[data-rm],[data-rmbad],[data-dl],[data-prev]');if(!t)return;e.preventDefault();
    if(t.dataset.rm!==undefined){files.splice(+t.dataset.rm,1);draw();onChange&&onChange()}
    else if(t.dataset.rmbad!==undefined){bad.splice(+t.dataset.rmbad,1);draw()}
    else if(t.dataset.dl!==undefined)oh2Notify('ดาวน์โหลด '+files[+t.dataset.dl].name,{sub:'ต้นแบบ — ยังไม่มีไฟล์จริง'});
    else oh2Notify('ดูตัวอย่าง '+files[+t.dataset.prev].name,{sub:'ต้นแบบ — ยังไม่มีไฟล์จริง'});
  });
  draw();
  return {redraw:draw};
}


/* กบค. ผู้ประสานงาน (ใช้ในนัดหมาย) — ชื่อ/เบอร์สมมติ · ของจริงต้องดึงจากระบบบุคลากร (userflow "เบอร์โทรผู้ประสานงาน ดึงข้อมูล display") */
const OH2_STAFF=[
  {id:'s1',name:'นายวิชัย ทองดี',pos:'วิศวกร กบค.',tel:'02-590-9123'},
  {id:'s2',name:'นางสาวกนกวรรณ ใจมั่น',pos:'พนักงานช่าง กบค.',tel:'02-590-9124'},
  {id:'s3',name:'นายสมศักดิ์ เรืองชัย',pos:'หัวหน้าแผนก กบค.',tel:'02-590-9125'},
];
const oh2Plan=(s,id)=>s.plans.find(p=>p.id===id);
const oh2Car=(id)=>OH2_VEHICLES.find(v=>v.id===id);
/* ดึงรายการ "…" ของตาราง: [{label,icon,href|data}] → HTML ของ Dropdown menu */
function oh2Menu(label,items){
  return `<details class="dd"><summary class="btn btn-t btn-icon" aria-label="${oh2Esc(label)}"><span class="ms">more_horiz</span></summary><div class="dd-menu">`+
    items.map(i=>i==='-'?'<div class="dd-sep"></div>':(i.href?`<a class="dd-item !no-underline" href="${i.href}">`:`<button class="dd-item" type="button" ${i.attr||''}>`)+
      `<span><span class="ms">${i.icon}</span>${oh2Esc(i.label)}</span>`+(i.href?'</a>':'</button>')).join('')+'</div></details>';
}
/* รายการไฟล์แบบอ่านอย่างเดียว (หน้ารายละเอียด) — _File upload item base ปิดปุ่มลบ */
function oh2FilesRO(files){
  if(!files.length)return '<div class="text-sm text-gray-500">—</div>';
  return '<div class="fu-list">'+files.map(f=>`<div class="fu-item"><span class="ficon sm gray"><span class="ms">draft</span></span>
    <span class="fu-item-tx"><b><a href="#" data-prevname="${oh2Esc(f.name)}" title="ดูตัวอย่าง">${oh2Esc(f.name)}</a></b><small>${oh2Size(f.size)}</small></span>
    <span class="fu-item-act"><button class="btn btn-t btn-icon" type="button" data-dlname="${oh2Esc(f.name)}" aria-label="ดาวน์โหลด ${oh2Esc(f.name)}"><span class="ms">download</span></button></span></div>`).join('')+'</div>';
}
document.addEventListener('click',e=>{
  const t=e.target.closest&&e.target.closest('[data-prevname],[data-dlname]');if(!t)return;e.preventDefault();
  oh2Notify((t.dataset.prevname?'ดูตัวอย่าง ':'ดาวน์โหลด ')+(t.dataset.prevname||t.dataset.dlname),{sub:'ต้นแบบ — ยังไม่มีไฟล์จริง'});
});

/* แกลเลอรีรูปสภาพรถ (ถ่าย/แนบรูป) — v2 ตามสกรีนช็อตแอปจริง "แจ้งซ่อม" ขั้นรายละเอียดเหตุการณ์ ที่เจ้าของงานส่งมา 6 พ.ย. 2569
   (แก้จาก 5 พ.ย. 2569 ที่ยกจาก mock/Maintenance-Request-Form.html ผิดหน้าตา — กล่องเล็ก 72×72 ของเก่าใช้ไม่ได้)
   กล่องอัปโหลด = component `.fu` เดิม (ตรงไลบรารีอยู่แล้ว) · grid thumbnail ใหญ่ + ปุ่มลบลอย — ไม่มี component ตรงในไฟล์ Component
   (เช็ค "Images" แล้ว เป็น carousel รูปเดียว+ลูกศร/pagination ไม่ใช่ grid หลายรูป) ⇒ ยกจากสกรีนช็อตแอปจริงแทน (ดู design-system/README.md §4.2)
   gallery = ชื่อกลุ่ม (ใช้แยก data-gallery ว่าแก้ไขอาร์เรย์ไหน) · photos = [{url}] url=null แสดงกล่องตัวอย่าง (gradient) · ไม่จำกัดจำนวน
   ปุ่ม "เพิ่มรูปตัวอย่าง" ไม่มีในสกรีนช็อตจริง — เสริมไว้เฉพาะต้นแบบ ให้ทดสอบหลายรูปได้โดยไม่ต้องมีไฟล์จริง */
function oh2PhotoPicker(gallery,photos){
  return `<label class="fu"><input type="file" class="photo-file" data-gallery="${gallery}" accept="image/*" multiple><span class="ficon sm gray"><span class="ms">cloud_upload</span></span>
    <span class="fu-tx"><span><b>คลิกเพื่อเลือกไฟล์</b> หรือลากไฟล์มาวางบริเวณนี้</span><small>PNG, JPG, GIF หรือ WebP (สูงสุด 20 ไฟล์)</small></span></label>
    <div class="photo-grid mt-4" data-gallery="${gallery}">${photos.map((p,i)=>`<div class="photo-card">${p.url?`<img src="${oh2Esc(p.url)}">`:''}<button class="photo-card-rm" type="button" data-act="photo-rm" data-gallery="${gallery}" data-i="${i}" aria-label="ลบรูปที่ ${i+1}"><span class="ms">delete</span></button></div>`).join('')}</div>
    <button class="btn btn-t btn-sm mt-3" type="button" data-act="photo-demo" data-gallery="${gallery}"><span class="ms">add_photo_alternate</span>เพิ่มรูปตัวอย่าง (ต้นแบบ)</button>`;
}
function oh2PhotoGalleryRO(photos){
  if(!photos||!photos.length)return '<div class="text-sm text-[var(--gray-400)] mt-3">ไม่มีรูปแนบ</div>';
  return `<div class="photo-grid mt-3">${photos.map(p=>`<div class="photo-card">${p.url?`<img src="${oh2Esc(p.url)}">`:''}</div>`).join('')}</div>`;
}

/* เลข PO ใหม่ — ต่อจากเลขมากสุดในทุกแผน (รูปแบบ PO-<เลข 6 หลัก>) */
function oh2NextPoId(s){const n=Math.max(0,...s.plans.flatMap(p=>p.pos.map(o=>+String(o.id).replace(/\D/g,''))));return 'PO-'+String(n+1).padStart(6,'0')}
/* งานรายคันเริ่มที่ขั้น 1 (V1) เมื่อรถถูกเลือกเข้า PO */
function oh2EnsureJobs(s,planId,cars){cars.forEach(c=>{const k=planId+':'+c;if(!s.jobs[k])s.jobs[k]={stage:'V1'}})}

/* ---------- งานรายคัน 7 ขั้น (S7–S15) ---------- 6 พ.ย. 2569 (T.1) เพิ่มขั้นที่ 7 "ยืนยันการส่งอนุมัติ"
   ขั้น ↔ สถานะ: 1 นัดเข้าอู่ V1–V3 · 2 ตรวจรับรถ V4 · 3 ติดตามงานซ่อม V5 · 4 ตรวจสภาพ V6 · 5 นัดรับรถ V7–V9 · 6 ปิดงาน V10 · 7 ส่งอนุมัติ V11–V12 */
const OH2_STEPS=['นัดเอารถเข้าอู่','ตรวจรับรถ','ติดตามงานซ่อม','ตรวจสภาพ','นัดรับรถ','ปิดงาน','ยืนยันการส่งอนุมัติ'];
const OH2_STEP_OF={V1:1,V2:1,V3:1,V4:2,V5:3,V6:4,V7:5,V8:5,V9:5,V10:6,V11:7,V12:7};
/* 6 พ.ย. 2569 (I.1) — เปลี่ยนเป็น "รายการเอกสารรับรถ" (ReceiptChecklist) 13 ข้อ ตามสกรีนช็อตแอปจริงที่เจ้าของงานส่ง — คอลัมน์ มี/ไม่มี (เลือกอย่างใดอย่างหนึ่ง) + ชำรุด/ผิดรุ่น (ติ๊กได้อิสระ) + หมายเหตุ
   แทนที่ checklist 7 ข้อแบบ ok/remark เดิม (ไม่ตรงกับภาพจริง) */
const OH2_RECEIPT_CHECKLIST=['แผ่นป้ายทะเบียนหน้า-หลัง','ป้ายทะเบียนติดกระจก และ พรบ.','กระจกมองข้างซ้าย-ขวา, กระจกมองหลัง','ยางอะไหล่',
  'แบตเตอรี่ (ระบุยี่ห้อ/จำนวนลูก)','เครื่องมือประจำรถ, แม่แรง, ประแจถอดล้อ','ผ้าถังน้ำมัน','อุปกรณ์บนหน้าปัด, แตร','ใบปัดน้ำฝน',
  'วิทยุ, ลำโพง, เสาอากาศ, วิทยุรับ-ส่ง','ระบบไฟส่องสว่าง','สภาพยาง','สภาพตัวถังและสี'];
const OH2_CHECKLIST=OH2_RECEIPT_CHECKLIST;   // ชื่อเดิมคงไว้กันโค้ดเก่าอ้างพัง — เนื้อหาเปลี่ยนเป็นชุด 13 ข้อแล้ว
const oh2Iso=(d)=>d.toISOString().slice(0,10);
const oh2Add=(days)=>{const d=new Date();d.setDate(d.getDate()+days);return oh2Iso(d)};
/* เติมรายละเอียดตัวอย่างให้งานที่ seed ไว้แค่สถานะ — เปิดหน้างานขั้นไหนก็เห็นข้อมูลที่ควรมีถึงขั้นนั้น */
function oh2Job(s,planId,carId){
  const k=planId+':'+carId;const j=s.jobs[k]||(s.jobs[k]={stage:'V1'});
  const n=+j.stage.slice(1);
  const appt=(days,ok)=>({from:oh2Add(days),to:oh2Add(days+2),coord:'s1',remark:'',sentAt:oh2Add(days-7),reply:ok===undefined?null:{ok,remark:ok?'':'วันดังกล่าวรถติดภารกิจซ่อมบำรุงสายส่ง ขอเลื่อนเป็นสัปดาห์ถัดไป',at:oh2Add(days-5)}});
  if(n>=2&&!j.appt)j.appt=appt(n===2?7:-60,n===2?undefined:n===3?false:true);
  // 6 พ.ย. 2569 (I.1) — รายการเอกสารรับรถ 13 ข้อ: state 'has'|'none' (มี/ไม่มี เลือกอย่างใดอย่างหนึ่ง) + damaged/wrongModel (ชำรุด/ผิดรุ่น ติ๊กอิสระ) + remark
  if(n>=5&&!j.checkin)j.checkin={items:OH2_RECEIPT_CHECKLIST.map(l=>({label:l,state:'has',damaged:false,wrongModel:false,remark:''})),sign:{kbk:{who:'s1',at:oh2Add(-58)},unit:{who:'หน่วยงาน',at:oh2Add(-58)}},at:oh2Add(-58),photos:[{url:null},{url:null}]};   // 5 พ.ย. 2569 — รูปสภาพรถก่อน Overhaul (ตัวอย่าง)
  // 6 พ.ย. 2569 (J.2/J.3) — เพิ่ม pct (ความคืบหน้า %) ต่อรายการ — รายการล่าสุด 100% = ปุ่ม "ซ่อมสำเร็จ" enable
  if(n>=5&&!j.logs)j.logs=[{at:oh2Add(-50)+'T09:30',note:'รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน',pct:40},{at:oh2Add(-35)+'T14:00',note:'เปลี่ยนชุดลูกสูบและแหวน ประกอบกลับ',pct:n>=6?100:70}].slice(0,n===5?1:2);
  if(n>=7&&!j.safety)j.safety=[{name:'Safety-Inspection.pdf',size:420000}];
  if(n>=7&&!j.safetyPhotos)j.safetyPhotos=[{url:null},{url:null},{url:null}];   // 5 พ.ย. 2569 — รูปสภาพรถหลัง Overhaul (ตัวอย่าง ไม่จำกัดจำนวน)
  if(n>=7&&!j.otherDocs)j.otherDocs=[];   // 6 พ.ย. 2569 (M.1) — เอกสารอื่นๆ ต่อจาก Safety Inspection (กล่องอัปโหลดทั่วไป ยังไม่เคาะประเภทไฟล์)
  if(n>=8&&!j.ret)j.ret=appt(n===8?5:-3,n===8?undefined:n===9?false:true);
  // 6 พ.ย. 2569 (T.1) — V11 เดิม (ปิดงานแล้ว) ย้ายเป็น V12 ⇒ เงื่อนไขเดิม n>=11 เลื่อนเป็น n>=10 (parts กรอกไว้ตั้งแต่ขั้น 6) และ n>=12 (closedAt เฉพาะปิดงานจริง)
  if(n>=10&&!j.parts)j.parts=[{cat:'vehicle',name:'ชุดลูกสูบพร้อมแหวน',qty:6,unit:'ชุด'},{cat:'vehicle',name:'ปะเก็นฝาสูบ',qty:1,unit:'ชิ้น'},{cat:'machine',name:'สายเคเบิลกว้าน',qty:1,unit:'เส้น'}];   // 5 พ.ย. 2569 — แยก 2 หมวด ตัวรถ/เครื่องมือกล
  if(n>=10&&j.joCost==null)j.joCost='18500';   // 6 พ.ย. 2569 (O.1) — ค่าแรง/ค่าใช้จ่ายตาม JO (amount field อิสระ)
  if(n>=11&&!j.warranty)j.warranty={from:oh2Add(-30),to:oh2Add(335),days:365};   // 6 พ.ย. 2569 (T.1) — การรับประกันงานซ่อม (แสดงในหน้าสรุปก่อนส่งอนุมัติ)
  if(n>=12&&!j.closedAt)j.closedAt=oh2Add(-1);
  j.logs=j.logs||[];j.safety=j.safety||[];j.safetyPhotos=j.safetyPhotos||[];j.otherDocs=j.otherDocs||[];j.parts=j.parts||[];j.partFiles=j.partFiles||[];
  if(j.joCost==null)j.joCost='';
  if(j.checkin)j.checkin.photos=j.checkin.photos||[];
  return j;
}
