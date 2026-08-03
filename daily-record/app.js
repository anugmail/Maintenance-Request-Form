/* ============================================================
   app.js — บันทึกการใช้งานรถ (daily-record PWA)
   ใช้ window.MDC (../config.js: รถ + ธีม) และ window.MDD (../config-daily.js)
   2 แท็บ: form (การ์ดรายวัน — default) / month
   flow แบบ logbook feed: หน้าแรกเป็นการ์ดของแต่ละวัน (วันนี้ + ย้อนหลัง กรองได้)
   วันนี้: เปิดมาเป็นฟอร์มแก้ไขได้เสมอตลอดทั้งวัน (ยังไม่ใช่ประวัติ)
   ย้อนหลัง: การ์ดที่มีข้อมูลแล้ว เปิดออกมาเป็น read-only ก่อนเสมอ — กดเมนู ⋮ ที่หัวการ์ด
   เพื่อเลือกแก้ไข/ลบ (ป้องกันแก้ไขข้อมูลเก่าโดยไม่ตั้งใจ) รถ default ตามคันล่าสุดที่ใช้
   เลขไมล์เริ่มต้นดึงจากเลขไมล์สิ้นสุดของบันทึกล่าสุดให้อัตโนมัติ (แก้ไขได้)
   ผู้ใช้งานมาจาก mock login (เลือกโปรไฟล์คนขับ) ไม่ต้องพิมพ์ชื่อซ้ำในฟอร์ม
   dropdown ทุกจุด (สถานี/ชนิดน้ำมัน/ประเภทค่าใช้จ่าย/ฟิลด์กำหนดเอง) ใช้ bottom sheet เดียวกับเลือกรถ
   การตั้งค่าฟิลด์-Fleet Card-ข้อมูล อยู่ที่ ../admin-config.html part 2
   ============================================================ */
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const baht=n=>(+n||0).toLocaleString('th-TH',{maximumFractionDigits:2});
/* toast แบบเดียวกับ badge สถานะ (พื้นอ่อน+ขอบสี) เต็มความกว้างจอ — type: 'ok'|'warn'|'err' (ไม่ใส่ = สีปกติ/แจ้งเฉยๆ) */
function toast(m,type){
  const t=$('toast');
  t.textContent=m;
  t.className='toast'+(type?' t-'+type:'')+' show';
  clearTimeout(t._x);
  t._x=setTimeout(()=>t.classList.remove('show'),2600);
}
/* ฟอร์มยาว เลื่อนลงไปกรอกน้ำมันแล้ว submit error เรื่องช่องบนสุด (เช่นเลขไมล์) มักหาไม่เจอ
   ฟังก์ชันนี้เลื่อนจอไปช่องที่ผิดให้เอง โดยเอาช่องไว้กึ่งกลางจอ (block:'center') + ไฮไลต์กรอบแดงชั่วครู่ */
function focusField(id){
  const el=$(id);if(!el)return;
  el.scrollIntoView({behavior:'smooth',block:'center'});
  el.classList.add('err-flash');
  setTimeout(()=>el.classList.remove('err-flash'),1600);
  const input=(el.matches&&el.matches('input,select,textarea'))?el:el.querySelector('input,select,textarea');
  if(input&&input.focus)setTimeout(()=>input.focus({preventScroll:true}),300);
}

let DB=MDD.load();
const VEHICLES=MDC.data('vehicles');
let VIEW='form';
let F=null,editId=null;        // ฟอร์มของการ์ดที่กำลังเปิดอยู่ + id ที่กำลังแก้ไข (null = ยังไม่มีการ์ดไหนเปิด)
let expandedDate=null;         // วันที่ (ISO) ของการ์ดที่ขยายอยู่ตอนนี้ — เปิดได้ทีละใบ
let editMode=false;            // true = การ์ดที่เปิดอยู่แสดงเป็นฟอร์มแก้ไข, false = แสดงข้อมูลแบบ read-only
let actionsDate=null;          // วันที่ที่กำลังกดไอคอนดินสอค้างไว้ (โชว์ไอคอนแก้ไข/ลบ)
let vSheetOpen=false;          // bottom sheet เลือกรถ (dropdown card)
let addSheetOpen=false;        // sheet "เพิ่มบันทึกเอง" — เลือกวันที่ย้อนหลังมากรอก
let addModalFormMode=false;    // true = sheet "เพิ่มย้อนหลัง" กำลังโชว์ฟอร์มกรอกเต็ม (ขั้นถัดจากเลือกวันที่)
let monthYM=MDD.isoToday().slice(0,7);
let histFilter={vehicleId:'',days:0};   // ตัวกรองรายการย้อนหลัง — vehicleId:'' = ทุกคัน, days:0 = ทั้งหมด
let histVSheetOpen=false;      // bottom sheet เลือกรถสำหรับกรองย้อนหลัง (แทน native dropdown)
let pickerState=null;          // bottom sheet เลือกตัวเลือกทั่วไป (แทน native <select> ทุกจุด)

/* ============================================================
   Mock Login — เลือกโปรไฟล์คนขับ (3 คน) แทนการพิมพ์ชื่อทุกครั้ง
   ============================================================ */
const DRIVERS=MDD.DRIVERS;   // แหล่งความจริงเดียวกับตอน seed ข้อมูล (config-daily.js) — id ต้องตรงกันเสมอ
const LOGIN_KEY='maintaind.daily.currentDriver.v1';
let CURRENT_DRIVER=null;
function loadLogin(){
  const id=localStorage.getItem(LOGIN_KEY);
  CURRENT_DRIVER=DRIVERS.find(d=>d.id===id)||null;
}
function driverAvatarFor(name){
  return DRIVERS.find(d=>d.name===name)||CURRENT_DRIVER||DRIVERS[0];
}
function renderLoginScreen(){
  $('loginScreen').innerHTML=`
    <div class="loginwrap">
      <div class="loginhead">
        <span class="ms">directions_car</span>
        <h1>บันทึกการใช้งานรถ</h1>
        <div class="sub2" style="color:var(--gray-500);font-size:12.5px">เลือกผู้ใช้งาน (mock login) — ข้อมูลจำลอง</div>
      </div>
      <div class="profilelist">
        ${DRIVERS.map(d=>`
          <div class="profilecard" onclick="doLogin('${d.id}')">
            <div class="avatar" style="background:${d.color}">${d.initials}</div>
            <div class="pname">${esc(d.name)}</div>
          </div>`).join('')}
      </div>
    </div>`;
}
function doLogin(id){
  localStorage.setItem(LOGIN_KEY,id);
  CURRENT_DRIVER=DRIVERS.find(d=>d.id===id);
  showApp();
  go('form');
}
function doLogout(){
  if(!confirm('สลับผู้ใช้งาน? (ออกจากระบบผู้ใช้ปัจจุบัน)'))return;
  localStorage.removeItem(LOGIN_KEY);
  CURRENT_DRIVER=null;expandedDate=null;F=null;editId=null;editMode=false;actionsDate=null;
  showLogin();
}
function showLogin(){
  $('aphdr').classList.add('hidden');
  $('amainWrap').classList.add('hidden');
  $('tabbar').classList.add('hidden');
  $('stickyCta').classList.add('hidden');
  $('loginScreen').classList.remove('hidden');
  renderLoginScreen();
}
function showApp(){
  $('loginScreen').classList.add('hidden');
  $('aphdr').classList.remove('hidden');
  $('amainWrap').classList.remove('hidden');
  $('tabbar').classList.remove('hidden');
  renderHeaderAvatar();
}
function renderHeaderAvatar(){
  const el=$('hdrAvatar');if(!el||!CURRENT_DRIVER)return;
  el.style.background=CURRENT_DRIVER.color;
  el.textContent=CURRENT_DRIVER.initials;
}

/* ---------- router (2 แท็บ) ---------- */
function go(v){
  VIEW=v;
  vSheetOpen=false;
  addSheetOpen=false;
  addModalFormMode=false;
  histVSheetOpen=false;
  pickerState=null;
  ['form','month'].forEach(x=>{
    $('view-'+x).classList.toggle('hidden',x!==v);
    $('tab-'+x).classList.toggle('on',x===v);
  });
  $('stickyCta').classList.toggle('hidden',v!=='form');
  render(v);
  renderVSheet();
  renderAddSheet();
  renderHistVSheet();
  renderPickerSheet();
  window.scrollTo({top:0});
}
/* เรียกซ้ำหลังแก้ไขข้อมูลระหว่างกรอกฟอร์ม (เลือกรถ/เพิ่มใบเสร็จ ฯลฯ) — รีเฟรชที่ที่ฟอร์มกำลังแสดงอยู่จริง
   (การ์ดในฟีดตามปกติ หรือ modal "เพิ่มย้อนหลัง" ถ้ากำลังกรอกผ่านทางนั้น) */
function renderEditingUI(){
  if(addModalFormMode){renderAddSheet();return}
  renderFeed();
}
function render(v){
  if(v==='form')renderFeed();
  if(v==='month')renderMonth();
}

/* ---------- helpers ---------- */
function vehicleOf(id){return VEHICLES.find(v=>v.id===id)}
function plateOf(r){const v=vehicleOf(r.vehicleId);return v?v.plate:(r.plate||'ไม่ทราบทะเบียน')}
function vehicleGone(r){return !vehicleOf(r.vehicleId)}
const monthKey=iso=>iso.slice(0,7);
const distOf=r=>Math.max(0,(+r.odoEnd||0)-(+r.odoStart||0));
const fuelCost=r=>(r.receipts||[]).reduce((s,x)=>s+(+x.amount||0),0);
const litersOf=r=>(r.receipts||[]).reduce((s,x)=>s+(+x.liters||0),0);
const otherCost=r=>(r.others||[]).reduce((s,x)=>s+(+x.amount||0),0);
const recCost=r=>fuelCost(r)+otherCost(r);
function lastOdo(vid){
  const rs=DB.records.filter(r=>r.vehicleId===vid).sort((a,b)=>a.date<b.date?1:-1);
  return rs.length?rs[0].odoEnd:'';
}
const LASTV_KEY='maintaind.daily.lastVehicle.v1';
function getLastVehicle(){
  const id=+localStorage.getItem(LASTV_KEY);
  return vehicleOf(id)?id:(VEHICLES[0]&&VEHICLES[0].id);
}
function setLastVehicle(id){localStorage.setItem(LASTV_KEY,id)}
/* บันทึกเป็นของ user ที่ login มา — กรองด้วย driverId เสมอ (คนอื่นไม่เห็นของกัน)
   รองรับบันทึกเก่าที่ยังไม่มี driverId ด้วยการเทียบชื่อกับ DRIVERS เป็น fallback */
function recordDriverId(r){return r.driverId||(DRIVERS.find(d=>d.name===r.driver)||{}).id}
function myRecords(){return CURRENT_DRIVER?DB.records.filter(r=>recordDriverId(r)===CURRENT_DRIVER.id):[]}

/* ============================================================
   Feed หน้าแรก — การ์ดรายวัน (วันนี้ + ย้อนหลัง)
   ============================================================ */
const STATIONS=['ปตท.','บางจาก','Shell','PT','อื่นๆ'];
/* ตรงกับรายการในใบสั่งจ่ายน้ำมันจริงของ กฟภ. (ยพ.๑-ป.๔๔) — เรียงตามลำดับในแบบฟอร์ม */
const FUEL_TYPES=['เบนซิน ออกเทน 95','เบนซิน ออกเทน 91','แก๊สโซฮอล์ 95','แก๊สโซฮอล์ 91','ดีเซล','ดีเซลปาล์ม','น้ำมันเครื่อง'];

/* วันที่ย้อนหลังทั้งหมด (ไม่กรอง) — ใช้เช็คว่ามีประวัติให้กรองหรือยัง */
function allPastDates(){
  const today=MDD.isoToday();
  return[...new Set(myRecords().map(r=>r.date))].filter(d=>d!==today);
}
/* วันที่ย้อนหลังหลังผ่านตัวกรอง (รถ/ช่วงเวลา) — การ์ดที่เปิด/แก้ไขค้างอยู่ต้องโผล่เสมอแม้ไม่ตรง filter */
function pastDatesFiltered(){
  const today=MDD.isoToday();
  let recs=myRecords().filter(r=>r.date!==today);
  if(histFilter.vehicleId)recs=recs.filter(r=>String(r.vehicleId)===String(histFilter.vehicleId));
  if(histFilter.days>0){
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-histFilter.days);
    const cutoffIso=`${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,'0')}-${String(cutoff.getDate()).padStart(2,'0')}`;
    recs=recs.filter(r=>r.date>=cutoffIso);
  }
  const dates=new Set(recs.map(r=>r.date));
  if(expandedDate&&expandedDate!==today)dates.add(expandedDate);
  return[...dates].sort((a,b)=>b.localeCompare(a));
}
function renderHistFilterHtml(){
  const selLabel=histFilter.vehicleId?((vehicleOf(+histFilter.vehicleId)||{}).plate||'รถ #'+histFilter.vehicleId):'ทุกคัน';
  return`<div class="hist-filter">
    <div class="filtertrigger" onclick="openHistVSheet()"><span>${esc(selLabel)}</span><span class="ms">expand_more</span></div>
    <div class="seg-mini">
      <span class="${histFilter.days===0?'sel':''}" onclick="setHistDays(0)">ทั้งหมด</span>
      <span class="${histFilter.days===7?'sel':''}" onclick="setHistDays(7)">7 วัน</span>
      <span class="${histFilter.days===30?'sel':''}" onclick="setHistDays(30)">30 วัน</span>
    </div>
  </div>`;
}
function setHistVehicle(v){
  histFilter.vehicleId=v;
  closeHistVSheet();
  toast('กรองตามรถ: '+(v?((vehicleOf(+v)||{}).plate||'รถ #'+v):'ทุกคัน'));
  renderFeed();
}
function setHistDays(d){
  histFilter.days=d;
  toast('กรองช่วงเวลา: '+(d===0?'ทั้งหมด':d+' วันล่าสุด'));
  renderFeed();
}
/* ----- panel เลือกรถสำหรับกรองย้อนหลัง (แทน native <select> dropdown) ----- */
function openHistVSheet(){histVSheetOpen=true;renderHistVSheet()}
function closeHistVSheet(){histVSheetOpen=false;renderHistVSheet()}
function renderHistVSheet(){
  const root=$('histVSheetRoot');if(!root)return;
  if(!histVSheetOpen){root.innerHTML='';return}
  const today=MDD.isoToday();
  const usedVids=[...new Set(myRecords().filter(r=>r.date!==today).map(r=>r.vehicleId))];
  const rows=[{id:'',label:'ทุกคัน'}].concat(usedVids.map(vid=>({id:String(vid),label:(vehicleOf(vid)||{}).plate||('รถ #'+vid)})));
  root.innerHTML=`
    <div class="vsheet-backdrop" onclick="closeHistVSheet()"></div>
    <div class="vsheet-panel" style="max-height:60vh">
      <div class="vsheet-handle"></div>
      <div class="vsheet-header"><h3>กรองตามรถ</h3><span class="ms" style="cursor:pointer;background:var(--gray-100);border-radius:10px;width:34px;height:34px;display:flex;align-items:center;justify-content:center" onclick="closeHistVSheet()">close</span></div>
      <div class="vsheet-list">
        ${rows.map(r=>`<div class="filterrow ${String(histFilter.vehicleId)===r.id?'sel':''}" onclick="setHistVehicle('${r.id}')">
          <span>${esc(r.label)}</span>
          ${String(histFilter.vehicleId)===r.id?'<span class="ms">check</span>':''}
        </div>`).join('')}
      </div>
    </div>`;
}

/* ----- picker ทั่วไปแบบ bottom sheet — แทน native <select> ทุกจุดในฟอร์ม (สถานี/ชนิดน้ำมัน/ประเภทค่าใช้จ่าย/ฟิลด์กำหนดเอง)
   ให้หน้าตาและวิธีใช้เหมือนกับ "เลือกรถ" ทั้งหมด ไม่มี native dropdown หลงเหลือ ----- */
function openPicker(title,options,selected,onPick){
  pickerState={title,options,selected,onPick};
  renderPickerSheet();
}
function closePicker(){pickerState=null;renderPickerSheet()}
function renderPickerSheet(){
  const root=$('pickerSheetRoot');if(!root)return;
  if(!pickerState){root.innerHTML='';return}
  const st=pickerState;
  root.innerHTML=`
    <div class="vsheet-backdrop" onclick="closePicker()"></div>
    <div class="vsheet-panel" style="max-height:60vh">
      <div class="vsheet-handle"></div>
      <div class="vsheet-header"><h3>${esc(st.title)}</h3><span class="ms" style="cursor:pointer;background:var(--gray-100);border-radius:10px;width:34px;height:34px;display:flex;align-items:center;justify-content:center" onclick="closePicker()">close</span></div>
      <div class="vsheet-list">
        ${st.options.map((o,idx)=>`<div class="filterrow ${o===st.selected?'sel':''}" onclick="pickerChoose(${idx})">
          <span>${esc(o)}</span>
          ${o===st.selected?'<span class="ms">check</span>':''}
        </div>`).join('')}
      </div>
    </div>`;
}
function pickerChoose(idx){
  const st=pickerState,val=st.options[idx],cb=st.onPick;
  closePicker();
  if(cb)cb(val);
}
function pickStation(i){openPicker('เลือกสถานีบริการ',STATIONS,F.receipts[i].station,v=>{F.receipts[i].station=v;renderEditingUI()})}
function pickFuelType(i){openPicker('เลือกชนิดน้ำมัน',FUEL_TYPES,F.receipts[i].fuelType,v=>{F.receipts[i].fuelType=v;renderEditingUI()})}
function pickOtherType(i){openPicker('เลือกประเภทค่าใช้จ่าย',MDD.OTHER_TYPES,F.others[i].type,v=>{F.others[i].type=v;renderEditingUI()})}
function pickCustomSelect(key){
  const c=DB.fields.custom.find(x=>x.key===key);if(!c)return;
  openPicker(c.label,c.options||[],F.custom[key],v=>{F.custom[key]=v;renderEditingUI()});
}

/* ----- เพิ่มบันทึกเอง — modal 2 ขั้น: (1) เลือกวันที่ย้อนหลัง (2) ฟอร์มกรอกเต็มในหน้าต่างเดียวกันเลย
   (ไม่ปิด sheet แล้วให้ไปหาการ์ดเองในลิสต์ — งงว่าการ์ดไปโผล่ตรงไหน) ----- */
function openAddSheet(){addSheetOpen=true;addModalFormMode=false;renderAddSheet()}
function closeAddSheet(){
  if(addModalFormMode){expandedDate=null;F=null;editId=null;editMode=false;addModalFormMode=false}
  addSheetOpen=false;
  renderAddSheet();
  renderFeed();
}
function renderAddSheet(){
  const root=$('addSheetRoot');if(!root)return;
  if(!addSheetOpen){root.innerHTML='';return}
  if(addModalFormMode){
    root.innerHTML=`
      <div class="vsheet-backdrop" onclick="closeAddSheet()"></div>
      <div class="vsheet-panel modal-tall">
        <div class="vsheet-handle"></div>
        <div class="vsheet-header"><h3>บันทึกย้อนหลัง — ${MDD.thDate(F.date,{day:'numeric',month:'short',year:'numeric'})}</h3><span class="ms" style="cursor:pointer;background:var(--gray-100);border-radius:10px;width:34px;height:34px;display:flex;align-items:center;justify-content:center" onclick="closeAddSheet()">close</span></div>
        <div class="vsheet-formwrap">${dayFormHtml()}</div>
      </div>`;
    return;
  }
  const today=MDD.isoToday();
  root.innerHTML=`
    <div class="vsheet-backdrop" onclick="closeAddSheet()"></div>
    <div class="vsheet-panel" style="max-height:none">
      <div class="vsheet-handle"></div>
      <div class="vsheet-header"><h3>เพิ่มบันทึกย้อนหลัง</h3><span class="ms" style="cursor:pointer;background:var(--gray-100);border-radius:10px;width:34px;height:34px;display:flex;align-items:center;justify-content:center" onclick="closeAddSheet()">close</span></div>
      <div style="padding:16px">
        <div class="f"><label>เลือกวันที่ต้องการบันทึก</label>
          <input type="date" id="addDateInput" max="${today}" value="${today}">
        </div>
        <button class="btn btn-p" style="width:100%" onclick="confirmAddDate()">ไปกรอกข้อมูลวันที่เลือก</button>
      </div>
    </div>`;
}
function confirmAddDate(){
  const val=$('addDateInput').value;
  if(!val){toast('กรุณาเลือกวันที่','err');return}
  actionsDate=null;
  const rec=myRecords().find(r=>r.date===val);
  buildFormFromRecord(rec,val);
  expandedDate=val;
  editMode=true;
  addModalFormMode=true;
  renderAddSheet();
  renderFeed();
}
function renderFeed(){
  const today=MDD.isoToday();
  let html=`<div class="feed-section">
    <div class="feed-label"><span class="ms">wb_sunny</span>วันนี้</div>
    ${dayCardHtml(today)}
  </div>`;
  const hasHistory=allPastDates().length>0;
  const pastDates=hasHistory?pastDatesFiltered():[];
  html+=`<div class="feed-section">
    <div class="feed-label muted"><span class="ms">history</span>ย้อนหลัง<span class="feed-addlink" onclick="openAddSheet()">+ เพิ่มย้อนหลัง</span></div>
    ${hasHistory?renderHistFilterHtml():''}
    ${!hasHistory?'<div class="hist-empty">ยังไม่มีบันทึกย้อนหลัง</div>'
      :pastDates.length?pastDates.map(dayCardHtml).join(''):'<div class="hist-empty">ไม่พบบันทึกที่ตรงกับตัวกรอง</div>'}
  </div>`;
  if(actionsDate)html+=`<div class="menu-backdrop" onclick="toggleActions('${actionsDate}')"></div>`;
  $('view-form').innerHTML=html;
  renderStickyCta();
}
/* ปุ่มเด่นท้ายจอ ปกติเปิด/เลื่อนไปการ์ดวันนี้ — แต่ถ้าวันนี้เปิดอยู่ในโหมดแก้ไขแล้ว
   ให้กลายเป็นปุ่ม "บันทึก" แทน กันสับสนว่าทำไมมีปุ่มบันทึก 2 ที่พร้อมกัน (ในฟอร์ม + ปุ่มลอย) */
function renderStickyCta(){
  const btn=$('stickyCta');if(!btn)return;
  const todayIso=MDD.isoToday();
  if(expandedDate===todayIso&&editMode){
    btn.innerHTML='<span class="ms">save</span>บันทึก';
    btn.onclick=saveForm;
  }else{
    btn.innerHTML='<span class="ms">edit_note</span>รายงานประจำวัน';
    btn.onclick=focusToday;
  }
}
/* การ์ดรายวัน — วันที่เป็นหัวเรื่องหลัก (จุดเด่นที่สุดของการ์ด เพราะฟีดนี้คือ "รายการต่อวัน")
   ส่วนชื่อคนขับ/ทะเบียนรถเป็นรายละเอียดรองอยู่บรรทัดล่าง */
function dayCardHtml(dateIso){
  const rec=myRecords().find(r=>r.date===dateIso);
  const today=dateIso===MDD.isoToday();
  const isOpen=expandedDate===dateIso&&!addModalFormMode;   // ถ้ากำลังกรอกวันนี้ผ่าน modal "เพิ่มย้อนหลัง" การ์ดในลิสต์ยังคงปิดอยู่
  const isEdit=isOpen&&editMode;
  const showingActions=actionsDate===dateIso;
  const driverName=rec?rec.driver:(CURRENT_DRIVER?CURRENT_DRIVER.name:'');
  const dav=driverAvatarFor(driverName);
  const plate=rec?plateOf(rec):(vehicleOf(getLastVehicle())||{}).plate;
  const rightIcons=rec
    ?`<span class="ms rowic" onclick="event.stopPropagation();toggleActions('${dateIso}')" title="ตัวเลือก">more_vert</span>
      ${showingActions?`<div class="actionmenu" onclick="event.stopPropagation()">
        <div class="actionitem" onclick="openDayEdit('${dateIso}')"><span class="ms">edit</span>แก้ไข</div>
        <div class="actionitem actionitem-del" onclick="openDayDelete('${dateIso}')"><span class="ms">delete</span>ลบ</div>
      </div>`:''}`
    :`<span class="ms dc-chev">${isOpen?'expand_less':'expand_more'}</span>`;
  return`<div class="daycard ${today?'today':''} ${rec?'filled':'unfilled'}">
    <div class="dc-head" onclick="openDay('${dateIso}')">
      <div class="dc-main">
        <div class="avatar avatar-sm" style="background:${dav.color}">${dav.initials}</div>
        <div class="dc-identity">
          <div class="dc-name">${MDD.thDate(dateIso,{day:'numeric',month:'short',year:'numeric'})}${today?' <span class="badge b-brand">วันนี้</span>':''}</div>
          <div class="dc-sub">${esc(driverName||'—')}${plate?' · '+esc(plate):''}${rec&&rec.equipmentHours?' · เครน '+esc(String(rec.equipmentHours))+' ชม.':''}${rec&&vehicleGone(rec)?' · <span class="badge b-out">รถถูกลบ</span>':''}</div>
        </div>
        <div class="dc-actions">${rightIcons}</div>
      </div>
      ${rec&&DB.display&&DB.display.cardOdo?`<div class="dc-odo">เลขไมล์ ${baht(rec.odoStart)} → ${baht(rec.odoEnd)} กม.</div>`:''}
      <div class="dc-summary">
        ${rec?`<span class="dc-fuel">฿${baht(recCost(rec))}</span><span class="badge b-ok">บันทึกแล้ว</span>`:`<span class="badge b-low">ยังไม่บันทึก</span>`}
      </div>
    </div>
    ${isOpen?`<div class="dc-body">${isEdit?dayFormHtml():dayReadonlyHtml(rec)}</div>`:''}
  </div>`;
}
/* เตรียมข้อมูลฟอร์ม F จากบันทึกที่มีอยู่ (แก้ไข) หรือค่าเริ่มต้น (สร้างใหม่) */
function buildFormFromRecord(rec,dateIso){
  if(rec){
    editId=rec.id;
    F={vehicleId:rec.vehicleId,odoStart:rec.odoStart,odoEnd:rec.odoEnd,equipmentHours:rec.equipmentHours||'',
       mission:rec.mission,driver:rec.driver,note:rec.note||'',
       receipts:MDD.clone(rec.receipts),others:MDD.clone(rec.others),custom:MDD.clone(rec.custom||{}),
       paymentMethod:rec.paymentMethod||'fleetcard',
       cardOverride:!!rec.cardOverride,cardOverrideNo:rec.cardOverrideNo||'',cardOverrideNote:rec.cardOverrideNote||''};
  }else{
    editId=null;
    const vid=getLastVehicle();
    F={vehicleId:vid,odoStart:vid?lastOdo(vid):'',odoEnd:'',equipmentHours:'',mission:'',note:'',
       driver:CURRENT_DRIVER?CURRENT_DRIVER.name:'',
       receipts:[],others:[],custom:{},paymentMethod:'fleetcard',cardOverride:false,cardOverrideNo:'',cardOverrideNote:''};
  }
  F.date=dateIso;
}
/* แตะการ์ด: ถ้ายังไม่มีบันทึก เปิดฟอร์มกรอกใหม่ทันที ถ้ามีแล้วและเป็นวันย้อนหลัง เปิดเป็น read-only ก่อนเสมอ
   ส่วน "วันนี้" เปิดเป็นฟอร์มแก้ไขได้เสมอ (ยังไม่ใช่ประวัติ แก้ไขได้ตลอดทั้งวัน) */
function openDay(dateIso){
  if(expandedDate===dateIso){expandedDate=null;F=null;editId=null;editMode=false;actionsDate=null;renderFeed();return}
  actionsDate=null;
  const rec=myRecords().find(r=>r.date===dateIso);
  buildFormFromRecord(rec,dateIso);
  expandedDate=dateIso;
  editMode=!rec||dateIso===MDD.isoToday();
  renderFeed();
}
/* กดไอคอนดินสอ (หลังจากกดครั้งแรกเพื่อเผยไอคอนแก้ไข/ลบ) — เปิดการ์ดตรงเข้าโหมดแก้ไขทันที */
function openDayEdit(dateIso){
  actionsDate=null;
  const rec=myRecords().find(r=>r.date===dateIso);
  buildFormFromRecord(rec,dateIso);
  expandedDate=dateIso;
  editMode=true;
  renderFeed();
}
function openDayDelete(dateIso){
  actionsDate=null;
  const rec=myRecords().find(r=>r.date===dateIso);
  if(!rec)return;
  if(!confirm('ลบบันทึกนี้?'))return;
  DB.records=DB.records.filter(r=>r.id!==rec.id);
  MDD.saveGuarded(DB);
  if(expandedDate===dateIso){expandedDate=null;F=null;editId=null;editMode=false}
  toast('ลบบันทึกแล้ว','ok');
  renderFeed();
}
function toggleActions(dateIso){
  actionsDate=actionsDate===dateIso?null:dateIso;
  renderFeed();
}
/* ปุ่มเด่น "ลงบันทึกประจำวัน" ท้ายจอ — เปิด/เลื่อนไปที่การ์ดวันนี้เสมอ (ไม่สลับปิดถ้าเปิดอยู่แล้ว) */
function focusToday(){
  const todayIso=MDD.isoToday();
  if(expandedDate!==todayIso){
    actionsDate=null;
    const rec=myRecords().find(r=>r.date===todayIso);
    buildFormFromRecord(rec,todayIso);
    expandedDate=todayIso;
    editMode=true;
    renderFeed();
  }
  requestAnimationFrame(()=>{
    const card=document.querySelector('.daycard.today');
    if(card)card.scrollIntoView({behavior:'smooth',block:'start'});
  });
}
function pickV(vid){
  F.vehicleId=vid;
  if(F.odoStart===''||F.odoStart===null)F.odoStart=lastOdo(vid);
  setLastVehicle(vid);
  const v=vehicleOf(vid);
  toast('เลือกรถ '+(v?v.plate:'#'+vid)+' แล้ว');
  renderEditingUI();
}

/* ----- เลือกรถ: dropdown card + bottom sheet ----- */
function openVSheet(){vSheetOpen=true;renderVSheet()}
function closeVSheet(){vSheetOpen=false;renderVSheet()}
function renderVSheet(){
  const root=$('vsheetRoot');if(!root)return;
  if(!vSheetOpen||!F){root.innerHTML='';return}
  root.innerHTML=`
    <div class="vsheet-backdrop" onclick="closeVSheet()"></div>
    <div class="vsheet-panel">
      <div class="vsheet-handle"></div>
      <div class="vsheet-header"><h3>เลือกรถที่ใช้งาน</h3><span class="ms" style="cursor:pointer;background:var(--gray-100);border-radius:10px;width:34px;height:34px;display:flex;align-items:center;justify-content:center" onclick="closeVSheet()">close</span></div>
      <div class="vsheet-list" id="vsheetList"></div>
    </div>`;
  UIC.vehicleCard.render($('vsheetList'),{variant:'list',vehicles:VEHICLES,selectedId:F.vehicleId,
    onPick:id=>{pickV(id);closeVSheet()}});
}

/* ============================================================
   มุมมอง read-only — ข้อมูลที่บันทึกไว้แล้ว แสดงเป็นข้อความล้วน แก้ไขไม่ได้
   ============================================================ */
function roRow(label,val){
  return`<div class="ro-row"><div class="ro-label">${esc(label)}</div><div class="ro-val">${val}</div></div>`;
}
function dayReadonlyHtml(rec){
  const veh=vehicleOf(rec.vehicleId);
  const rows=[];
  rows.push(roRow('รถ',veh?`${esc(veh.plate)} · ${esc(veh.model)}`:esc(rec.plate||'ไม่ทราบทะเบียน')));
  if(DB.fields.std.odoStart.on)rows.push(roRow('เลขไมล์',`${baht(rec.odoStart)} → ${baht(rec.odoEnd)} กม. <span class="ro-mut">(รวม ${baht(distOf(rec))} กม.)</span>`));
  if(rec.equipmentHours)rows.push(roRow('ชั่วโมงเครื่องจักร',`${baht(rec.equipmentHours)} ชม.`));
  if(DB.fields.std.mission.on&&rec.mission)rows.push(roRow('ภารกิจ/เส้นทาง',esc(rec.mission)));
  if(rec.receipts&&rec.receipts.length){
    const pay=rec.paymentMethod==='cash'?'เงินสด':(rec.cardOverride?'ใช้บัตรอื่น'+(rec.cardOverrideNo?' ('+esc(rec.cardOverrideNo)+')':''):'Fleet Card ประจำรถ');
    rows.push(roRow('วิธีจ่ายค่าน้ำมัน',esc(pay)));
    rows.push(roRow('น้ำมัน',rec.receipts.map(r=>`${esc(r.station)} · ${esc(r.fuelType)} · ${baht(r.liters)} ล. · ฿${baht(r.amount)}`).join('<br>')));
  }
  if(rec.others&&rec.others.length)rows.push(roRow('ค่าใช้จ่ายอื่น',rec.others.map(o=>`${esc(o.type)} ฿${baht(o.amount)}${o.note?' — '+esc(o.note):''}`).join('<br>')));
  if(rec.note)rows.push(roRow('หมายเหตุ',esc(rec.note)));
  DB.fields.custom.filter(c=>c.on).forEach(c=>{
    const v=rec.custom&&rec.custom[c.key];
    if(v===undefined||v==='')return;
    rows.push(roRow(c.label,c.type==='check'?(v?'✓ ใช่':'ไม่ใช่'):esc(String(v))));
  });
  return`<div class="ro-panel">${rows.join('')}</div>`;
}

/* ============================================================
   ฟอร์มกรอกข้อมูลรายวัน (เปิดในการ์ดที่ expand อยู่ ตอน editMode)
   ============================================================ */
function dayFormHtml(){
  const std=DB.fields.std,parts=[],vSel=F.vehicleId?vehicleOf(F.vehicleId):null;

  parts.push(`<div class="f"><label>รถ <em>*</em></label>
    <div class="vtrigger" id="vTrigger" onclick="openVSheet()">
      <span class="ms">local_shipping</span>
      <div class="sp">${vSel?`<b>${esc(vSel.plate)}</b><div class="sub" style="margin:0">${esc(vSel.model)}${vSel.attach?' · '+esc(vSel.attach):''}</div>`:'<b style="color:var(--gray-400);font-weight:500">แตะเพื่อเลือกรถ</b>'}</div>
      <span class="ms" style="color:var(--gray-400)">expand_more</span>
    </div></div>`);

  if(std.odoStart.on||std.odoEnd.on)parts.push(`<div class="odorow">
    <div class="f"><label>เลขไมล์เริ่มต้น <em>*</em></label><div class="in noic"><input type="number" id="odoS" inputmode="numeric" placeholder="เช่น 84120" value="${F.odoStart}" oninput="F.odoStart=this.value;updDist()"></div></div>
    <div class="f"><label>เลขไมล์สิ้นสุด <em>*</em></label><div class="in noic"><input type="number" id="odoE" inputmode="numeric" placeholder="เช่น 84205" value="${F.odoEnd}" oninput="F.odoEnd=this.value;updDist()"></div></div>
    </div><div class="distline" id="distline"></div>`);

  const needsEquip=!!(vSel&&vSel.attach);
  if(std.equipmentHours.on&&needsEquip)parts.push(`<div class="f"><label>${esc(MDD.STD_META.equipmentHours.label)} <small>(ถ้ามี)</small></label>
    <div class="in noic"><input type="number" inputmode="decimal" step="0.1" value="${esc(F.equipmentHours)}" oninput="F.equipmentHours=this.value" placeholder="อ่านจากมิเตอร์เครื่องจักร เช่น 2365"></div></div>`);

  if(std.mission.on)parts.push(`<div class="f"><label>${esc(MDD.STD_META.mission.label)}${std.mission.req?' <em>*</em>':''}</label>
    <div class="in noic"><input list="dl-missions" id="missionInput" value="${esc(F.mission)}" oninput="F.mission=this.value" placeholder="เลือกจากจุดทำงาน PEA หรือพิมพ์เอง"></div>
    <datalist id="dl-missions">${MDD.MISSION_PRESETS.map(m=>`<option value="${esc(m)}">`).join('')}</datalist></div>`);

  if(std.receipts.on)parts.push(renderFuelSection(std.receipts));
  if(std.others.on)parts.push(renderOthers());
  if(std.note.on)parts.push(`<div class="sect" style="margin:20px 0 10px">หมายเหตุ</div>
    <div class="f"><div class="in noic"><input value="${esc(F.note)}" oninput="F.note=this.value" placeholder="บันทึกเพิ่มเติม (ถ้ามี)"></div></div>`);

  DB.fields.custom.filter(c=>c.on).forEach(c=>parts.push(renderCustom(c)));

  parts.push(`<div class="formbtns">
    <button class="btn btn-g" onclick="cancelForm()">ยกเลิก</button>
    <button class="btn btn-p" onclick="saveForm()"><span class="ms" style="font-size:18px">save</span> ${editId?'บันทึกการแก้ไข':'บันทึก'}</button>
  </div>`);

  return parts.join('');
}
function updDist(){
  const el=$('distline');if(!el)return;
  const s=+F.odoStart,e=+F.odoEnd;
  if(F.odoStart===''||F.odoEnd===''){el.textContent='';el.classList.remove('err');return}
  if(e<s){el.textContent='⚠ เลขไมล์สิ้นสุดต้องไม่น้อยกว่าเลขไมล์เริ่มต้น';el.classList.add('err');return}
  el.classList.remove('err');
  el.textContent=`ระยะทางวันนี้ ${baht(e-s)} กม.`;
}

/* ----- น้ำมัน: repeater + mock OCR + Fleet Card / เงินสด ----- */
/* หน้าบัตรจำลองแบบบัตรเครดิตจริง — สีไล่ตามธนาคาร (MDD.BANK_THEME) ให้แยกบัตรแต่ละธนาคารออกจากกันง่ายๆ ด้วยตา */
function creditCardHtml(fc,opts){
  opts=opts||{};
  const theme=(MDD.BANK_THEME&&MDD.BANK_THEME[fc.bank])||MDD.BANK_THEME_DEFAULT;
  const groups=String(fc.no||'').replace(/\s+/g,'').match(/.{1,4}/g);
  const numHtml=groups&&groups.length?groups.join(' '):'•••• •••• •••• ••••';
  return`<div class="cc ${opts.dim?'cc-dim':''}" style="background:${theme.grad}">
    <div class="cc-row">
      <span class="cc-bank">${esc(fc.bank||'ไม่ระบุธนาคาร')}</span>
      <span class="ms cc-wave">wifi</span>
    </div>
    <div class="cc-chip" style="background:${theme.chip}"><span class="cc-chip-line"></span></div>
    <div class="cc-number">${numHtml}</div>
    <div class="cc-row cc-bottom">
      <div class="cc-holder">
        <div class="cc-label">ผู้ถือบัตร</div>
        <div class="cc-name">${esc(fc.holder||'—')}</div>
      </div>
      <div class="cc-brand">FLEET<br>CARD</div>
    </div>
    ${opts.dim?'<div class="cc-ribbon">ไม่ได้ใช้บัตรนี้</div>':''}
  </div>`;
}
function cardBandHtml(){
  const veh=F.vehicleId?vehicleOf(F.vehicleId):null;
  if(!veh)return'';
  const fc=MDD.fleetFor(veh.id);
  if(F.cardOverride)return`
    ${creditCardHtml(fc,{dim:true})}
    <div class="f" style="margin-top:10px"><label>เลขบัตรที่ใช้จริง</label><div class="in noic"><input value="${esc(F.cardOverrideNo)}" oninput="F.cardOverrideNo=this.value" placeholder="เลขบัตร Fleet Card ที่ใช้จริง"></div></div>
    <div class="f" style="margin:8px 0 0"><label>เหตุผลที่ใช้บัตรอื่น <em>*</em></label><div class="in noic"><input id="cardOverrideNoteInput" value="${esc(F.cardOverrideNote)}" oninput="F.cardOverrideNote=this.value" placeholder="เช่น บัตรประจำรถชำรุด/ยืมรถคันอื่น"></div></div>
    <div style="text-align:right;margin-top:8px"><span class="fclink" onclick="toggleCardOverride()">ยกเลิก ใช้บัตรเดิม</span></div>`;
  return creditCardHtml(fc);
}
function toggleCardOverride(){
  F.cardOverride=!F.cardOverride;
  if(!F.cardOverride){F.cardOverrideNo='';F.cardOverrideNote='';toast('กลับไปใช้ Fleet Card ประจำรถแล้ว','ok')}
  else toast('เปลี่ยนไปใช้บัตรอื่นแล้ว — ระบุเหตุผลด้วย','warn');
  renderEditingUI();
}
function cashBandHtml(){
  return`<div class="fcband" style="background:var(--warning-50);border-color:var(--warning-100)">
    <span class="ms" style="color:var(--warning-700)">payments</span>
    <div class="sp"><b>สำรองจ่ายเงินสด</b><div class="sub" style="margin:0">เบิกคืนภายหลังตามขั้นตอนการเงิน — ไม่ผูกกับ Fleet Card</div></div>
  </div>`;
}
function setPayMethod(m){
  F.paymentMethod=m;
  if(m==='cash'){F.cardOverride=false;F.cardOverrideNo='';F.cardOverrideNote=''}
  toast(m==='cash'?'เปลี่ยนเป็นจ่ายเงินสดแล้ว':'กลับไปใช้ Fleet Card แล้ว');
  renderEditingUI();
}
function renderFuelSection(cfg){
  if(!cfg.on)return'';
  const hasReceipts=F.receipts.length>0;
  const isCash=F.paymentMethod==='cash';
  return`<div class="sect" id="fuelSection">${esc(MDD.STD_META.receipts.label)}${cfg.req?' <em>*</em>':''}</div>
  <div class="f">
  ${isCash?cashBandHtml():cardBandHtml()}
  ${!F.cardOverride?`<div class="pay-actions">
    ${!isCash?`<span class="fclink" onclick="toggleCardOverride()"><span class="ms">sync_alt</span>ใช้บัตรอื่น</span>`:''}
    <span class="fclink-muted" onclick="setPayMethod('${isCash?'fleetcard':'cash'}')"><span class="ms">${isCash?'credit_card':'payments'}</span>${isCash?'กลับไปใช้ Fleet Card':'จ่ายเป็นเงินสดแทน'}</span>
  </div>`:''}
  ${!hasReceipts?`
  <div class="camera-cta" onclick="$('rcfile').click()">
    <span class="ms">photo_camera</span>
    <b>ถ่ายรูปสลิป</b>
    <span class="cta-sub">แตะเพื่อถ่ายรูป ระบบจะอ่านข้อมูลให้อัตโนมัติ</span>
  </div>
  <div style="text-align:center;margin-bottom:10px"><span class="fclink-muted" onclick="addReceiptManual()">กรอกเองไม่มีรูป</span></div>`:''}
  ${F.receipts.map((rc,i)=>`
    <div class="rccard ${rc.justRead?'flash':''}" id="rc${i}">
      <div class="rcrow">
        <div class="scanwrap">
          ${rc.photoThumb?`<img class="rthumb" src="${rc.photoThumb}" alt="ใบเสร็จ">`:`<div class="rthumb rthumb-ph"><span class="ms" style="font-size:34px">receipt_long</span></div>`}
          ${rc.scanning?'<div class="scanline"></div>':''}
        </div>
        <div style="flex:1;min-width:0">
          ${rc.scanning
            ?`<div class="scantxt"><span class="ms spin">progress_activity</span> กำลังอ่านใบเสร็จ…</div>`
            :`${rc.ocr?'<span class="badge b-brand" style="margin-bottom:6px">อ่านจากใบเสร็จ — แก้ไขได้</span>':''}
          <div class="rcgrid">
            <div><label>สถานีบริการ</label><div class="dropfield" onclick="pickStation(${i})"><span>${esc(rc.station)}</span><span class="ms">expand_more</span></div></div>
            <div><label>ชนิดน้ำมัน</label><div class="dropfield" onclick="pickFuelType(${i})"><span>${esc(rc.fuelType)}</span><span class="ms">expand_more</span></div></div>
            <div class="sp2"><label>เลขที่ใบสั่งจ่ายน้ำมัน</label><input value="${esc(rc.no)}" oninput="F.receipts[${i}].no=this.value" placeholder="เช่น 940835"></div>
            <div><label>ราคา/ลิตร (บาท)</label><input type="number" step="0.01" inputmode="decimal" value="${rc.price||''}" oninput="F.receipts[${i}].price=this.value;updReceiptAmt(${i})" placeholder="เช่น 31.99"></div>
            <div><label>จำนวนลิตร</label><input type="number" step="0.01" inputmode="decimal" value="${rc.liters}" oninput="F.receipts[${i}].liters=this.value;updReceiptAmt(${i})"></div>
            <div class="sp2"><label>จำนวนเงินรวม (บาท)</label><input type="number" step="0.01" inputmode="decimal" id="rcAmt${i}" value="${rc.amount}" oninput="F.receipts[${i}].amount=this.value"></div>
          </div>`}
        </div>
        <span class="ms rcdel" title="ลบใบเสร็จ" onclick="delReceipt(${i})">delete</span>
      </div>
    </div>`).join('')}
  ${hasReceipts?`<div class="rcbtns">
    <button class="btn btn-o" onclick="$('rcfile').click()"><span class="ms" style="font-size:18px">photo_camera</span> ถ่ายรูปสลิปอีกใบ</button>
    <button class="btn btn-g" onclick="addReceiptManual()">กรอกเองไม่มีรูป</button>
  </div>`:''}
  </div>`;
}
function addReceiptManual(){
  F.receipts.push({no:'',station:'ปตท.',fuelType:'ดีเซล',price:'',liters:'',amount:'',photoThumb:null,ocr:false});
  toast('เพิ่มใบเสร็จแล้ว — กรอกรายละเอียดได้เลย');
  renderEditingUI();
}
function delReceipt(i){F.receipts.splice(i,1);toast('ลบใบเสร็จแล้ว','ok');renderEditingUI()}
/* คำนวณจำนวนเงินรวมจากราคา/ลิตร × ลิตรอัตโนมัติ — อัปเดต DOM ตรงๆ (ไม่ render) กันโฟกัสหลุดตอนพิมพ์ */
function updReceiptAmt(i){
  const rc=F.receipts[i];if(!rc)return;
  const p=+rc.price||0,l=+rc.liters||0;
  if(!p||!l)return;
  const amt=(p*l).toFixed(2);
  rc.amount=amt;
  const el=$('rcAmt'+i);
  if(el)el.value=amt;
}
$('rcfile').addEventListener('change',async e=>{
  const file=e.target.files[0];e.target.value='';
  if(!file)return;
  const rc={no:'',station:'ปตท.',fuelType:'ดีเซล',price:'',liters:'',amount:'',photoThumb:null,ocr:false,scanning:true};
  F.receipts.push(rc);
  renderEditingUI();
  try{
    const [thumb,data]=await Promise.all([makeThumb(file),DailyOCR.readReceipt(file)]);
    Object.assign(rc,{photoThumb:thumb,no:data.no,station:STATIONS.includes(data.station)?data.station:'อื่นๆ',
      fuelType:FUEL_TYPES.includes(data.fuelType)?data.fuelType:'ดีเซล',
      price:data.price,liters:data.liters,amount:data.amount,ocr:true,scanning:false,justRead:true});
    toast('อ่านใบเสร็จสำเร็จ — ตรวจสอบข้อมูลก่อนบันทึก','ok');
    renderEditingUI();
    setTimeout(()=>{rc.justRead=false},1500);
  }catch(err){
    rc.scanning=false;rc.photoThumb=await makeThumb(file).catch(()=>null);
    renderEditingUI();
    toast('อ่านใบเสร็จไม่สำเร็จ — กรอกข้อมูลเองได้เลย','warn');
  }
});
function makeThumb(file){
  return new Promise(res=>{
    const img=new Image();
    img.onload=()=>{
      const mx=200,sc=Math.min(1,mx/Math.max(img.width,img.height));
      const c=document.createElement('canvas');
      c.width=Math.max(1,Math.round(img.width*sc));c.height=Math.max(1,Math.round(img.height*sc));
      c.getContext('2d').drawImage(img,0,0,c.width,c.height);
      URL.revokeObjectURL(img.src);
      res(c.toDataURL('image/jpeg',0.6));
    };
    img.onerror=()=>res(null);
    img.src=URL.createObjectURL(file);
  });
}

/* ----- ค่าใช้จ่ายอื่น + ฟิลด์กำหนดเอง ----- */
function renderOthers(){
  return`<div class="sect" style="margin:20px 0 10px">ค่าใช้จ่ายอื่น</div>
  <div class="f">
  ${F.others.map((o,i)=>`<div class="otcard">
    <span class="ms rcdel" onclick="F.others.splice(${i},1);toast('ลบค่าใช้จ่ายแล้ว','ok');renderEditingUI()">delete</span>
    <label>ประเภท</label>
    <div class="dropfield" onclick="pickOtherType(${i})"><span>${esc(o.type)}</span><span class="ms">expand_more</span></div>
    <label>จำนวนเงิน (บาท)</label>
    <input type="number" inputmode="decimal" placeholder="บาท" value="${o.amount}" oninput="F.others[${i}].amount=this.value">
    <label>โน้ต (ถ้ามี)</label>
    <input placeholder="เช่น ทางด่วนไปหน้างาน" value="${esc(o.note)}" oninput="F.others[${i}].note=this.value">
  </div>`).join('')}
  <button class="btn btn-g" style="padding:8px 14px;font-size:13.5px" onclick="F.others.push({type:'ทางด่วน',amount:'',note:''});toast('เพิ่มค่าใช้จ่ายแล้ว');renderEditingUI()"><span class="ms" style="font-size:17px">add</span> เพิ่มค่าใช้จ่าย</button></div>`;
}
function renderCustom(c){
  const v=F.custom[c.key],req=c.req?' <em>*</em>':'',fid='custom_'+c.key;
  if(c.type==='check')return`<div class="f" id="${fid}"><label class="chkrow"><input type="checkbox" ${v?'checked':''} onchange="F.custom['${c.key}']=this.checked">${esc(c.label)}</label></div>`;
  if(c.type==='select')return`<div class="f"><label>${esc(c.label)}${req}</label><div class="dropfield" id="${fid}" onclick="pickCustomSelect('${c.key}')"><span${v?'':' style="color:var(--gray-400)"'}>${v?esc(v):'— เลือก —'}</span><span class="ms">expand_more</span></div></div>`;
  const t=c.type==='number'?'number':c.type==='date'?'date':'text';
  return`<div class="f"><label>${esc(c.label)}${req}</label><div class="in noic"><input id="${fid}" type="${t}" value="${esc(v??'')}" oninput="F.custom['${c.key}']=this.value"></div></div>`;
}

/* ----- save / cancel ----- */
function saveForm(){
  const std=DB.fields.std;
  if(!F.vehicleId){toast('กรุณาเลือกรถ','err');focusField('vTrigger');return}
  if(std.odoStart.on){
    if(F.odoStart===''){toast('กรุณากรอกเลขไมล์เริ่มต้น','err');focusField('odoS');return}
    if(F.odoEnd===''){toast('กรุณากรอกเลขไมล์สิ้นสุด','err');focusField('odoE');return}
    if(+F.odoEnd<+F.odoStart){toast('เลขไมล์สิ้นสุดต้องไม่น้อยกว่าเลขไมล์เริ่มต้น','err');focusField('odoE');return}
  }
  const vehForSave=vehicleOf(F.vehicleId);   // ชั่วโมงเครื่องจักรไม่บังคับกรอก (optional) แม้รถจะมีเครน/กระเช้า
  if(std.mission.on&&std.mission.req&&!F.mission.trim()){toast('กรุณากรอกภารกิจ/เส้นทาง','err');focusField('missionInput');return}
  if(std.receipts.on&&std.receipts.req&&!F.receipts.length){toast('กรุณาเพิ่มใบเสร็จอย่างน้อย 1 ใบ','err');focusField('fuelSection');return}
  if(F.receipts.some(r=>r.scanning)){toast('รอระบบอ่านใบเสร็จให้เสร็จก่อน','warn');focusField('fuelSection');return}
  if(F.paymentMethod==='fleetcard'&&F.cardOverride&&!String(F.cardOverrideNote||'').trim()){toast('กรุณาระบุเหตุผลที่ใช้บัตรอื่น','err');focusField('cardOverrideNoteInput');return}
  for(const c of DB.fields.custom.filter(x=>x.on&&x.req)){
    const v=F.custom[c.key];
    if(c.type==='check'?!v:!(v&&String(v).trim())){toast('กรุณากรอก "'+c.label+'"','err');focusField('custom_'+c.key);return}
  }
  const veh=vehicleOf(F.vehicleId);
  const rec={
    id:editId||('r'+Date.now()),
    vehicleId:F.vehicleId,plate:veh?veh.plate:null,
    date:F.date,odoStart:+F.odoStart||0,odoEnd:+F.odoEnd||0,
    equipmentHours:(vehForSave&&vehForSave.attach)?(+F.equipmentHours||0):0,
    driverId:CURRENT_DRIVER?CURRENT_DRIVER.id:null,
    driver:F.driver||(CURRENT_DRIVER?CURRENT_DRIVER.name:''),mission:F.mission.trim(),
    receipts:F.receipts.map(r=>({no:String(r.no).trim(),station:r.station,fuelType:r.fuelType,
      price:+r.price||0,liters:+r.liters||0,amount:+r.amount||0,photoThumb:r.photoThumb||null,ocr:!!r.ocr})),
    others:F.others.filter(o=>+o.amount>0).map(o=>({type:o.type,amount:+o.amount,note:String(o.note||'').trim()})),
    note:String(F.note||'').trim(),
    paymentMethod:F.paymentMethod||'fleetcard',
    cardOverride:F.paymentMethod==='fleetcard'&&!!F.cardOverride,
    cardOverrideNo:(F.paymentMethod==='fleetcard'&&F.cardOverride)?String(F.cardOverrideNo||'').trim():'',
    cardOverrideNote:(F.paymentMethod==='fleetcard'&&F.cardOverride)?String(F.cardOverrideNote||'').trim():'',
    custom:MDD.clone(F.custom),
    createdAt:editId?(DB.records.find(r=>r.id===editId)?.createdAt||Date.now()):Date.now(),
    updatedAt:Date.now()
  };
  if(editId)DB.records=DB.records.map(r=>r.id===editId?rec:r);
  else DB.records.unshift(rec);
  if(rec.driver){DB.drivers=[rec.driver,...DB.drivers.filter(d=>d!==rec.driver)].slice(0,20)}
  const st=MDD.saveGuarded(DB);
  if(st==='fail'){toast('บันทึกไม่สำเร็จ — พื้นที่จัดเก็บเต็ม','err');return}
  if(st==='nophoto')toast('พื้นที่เก็บรูปเต็ม — บันทึกข้อมูลโดยไม่เก็บรูป','warn');
  else toast(editId?'บันทึกการแก้ไขแล้ว':'บันทึกเรียบร้อย','ok');
  const wasModal=addModalFormMode;
  expandedDate=null;F=null;editId=null;editMode=false;actionsDate=null;
  if(wasModal){addModalFormMode=false;addSheetOpen=false;renderAddSheet()}
  renderFeed();
}
/* ยกเลิกตอนกำลังแก้ไขบันทึกย้อนหลังที่มีอยู่แล้ว (ผ่านการ์ดในลิสต์ ไม่ใช่ modal) -> กลับไปดู read-only เดิม (ไม่เสียของ ไม่ปิดการ์ด)
   ยกเลิกตอนกำลังสร้างบันทึกใหม่, แก้ไข "วันนี้", หรือกำลังกรอกผ่าน modal "เพิ่มย้อนหลัง" -> ปิดกลับไปที่ feed/ปิด modal */
function cancelForm(){
  const isToday=F&&F.date===MDD.isoToday();
  const wasModal=addModalFormMode;
  if(wasModal){
    expandedDate=null;F=null;editId=null;editMode=false;addModalFormMode=false;addSheetOpen=false;
    renderAddSheet();renderFeed();return;
  }
  if(editId&&!isToday){editMode=false;F=null;renderFeed();return}
  expandedDate=null;F=null;editId=null;editMode=false;renderFeed();
}

/* ============================================================
   TAB 2 — สรุปรายเดือน
   ============================================================ */
function shiftMonth(d){
  const[y,m]=monthYM.split('-').map(Number);
  const dt=new Date(y,m-1+d,1);
  monthYM=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
  renderMonth();
}
function renderMonth(){
  const recs=myRecords().filter(r=>monthKey(r.date)===monthYM);
  const nav=`<div class="mnav">
    <span class="ms" onclick="shiftMonth(-1)">chevron_left</span>
    <b>${MDD.thMonth(monthYM)}</b>
    <span class="ms" onclick="shiftMonth(1)">chevron_right</span></div>`;
  if(!recs.length){$('view-month').innerHTML=nav+'<div class="empty">ไม่มีบันทึกในเดือนนี้</div>';return}
  const perV=VEHICLES.map(v=>{
    const rs=recs.filter(r=>r.vehicleId===v.id);
    if(!rs.length)return null;
    const dist=rs.reduce((s,r)=>s+distOf(r),0);
    const liters=rs.reduce((s,r)=>s+litersOf(r),0);
    const fuel=rs.reduce((s,r)=>s+fuelCost(r),0);
    const other=rs.reduce((s,r)=>s+otherCost(r),0);
    return{v,days:new Set(rs.map(r=>r.date)).size,dist,liters,fuel,other,
      kmpl:(liters>0&&dist>0)?(dist/liters):null};
  }).filter(Boolean);
  const maxFuel=Math.max(...perV.map(x=>x.fuel),1);
  $('view-month').innerHTML=nav+perV.map(x=>`
    <div class="card">
      <h2 class="ttl">${esc(x.v.plate)}</h2>
      <div class="sub">${esc(x.v.model)} · ${esc(MDD.fleetFor(x.v.id).bank||'')} ${esc(MDD.fleetFor(x.v.id).no)}</div>
      <div class="statgrid">
        <div class="stt"><b>${x.days}</b><span>วันใช้งาน</span></div>
        <div class="stt"><b>${baht(x.dist)}</b><span>กม.</span></div>
        <div class="stt"><b>${baht(x.liters)}</b><span>ลิตร</span></div>
        <div class="stt"><b>฿${baht(x.fuel)}</b><span>ค่าน้ำมัน</span></div>
        <div class="stt"><b>฿${baht(x.other)}</b><span>ค่าอื่น</span></div>
        <div class="stt"><b>${x.kmpl!==null?x.kmpl.toFixed(1):'—'}</b><span>กม./ลิตร</span></div>
      </div>
    </div>`).join('')+`
    <div class="card">
      <h2 class="ttl">เทียบค่าน้ำมันรายคัน</h2>
      <div class="sub">เดือน${MDD.thMonth(monthYM)} · รวมทั้งหมด ฿${baht(perV.reduce((s,x)=>s+x.fuel+x.other,0))}</div>
      ${perV.sort((a,b)=>b.fuel-a.fuel).map(x=>`<div class="barrow">
        <span class="lbl">${esc(x.v.plate.split(' ')[0])}</span>
        <div class="barwrap"><div class="bar" style="width:${Math.round(x.fuel/maxFuel*100)}%"></div></div>
        <span class="val">฿${baht(x.fuel)}</span></div>`).join('')}
    </div>`;
}

/* ============================================================
   sync + INIT
   ============================================================ */
window.addEventListener('storage',e=>{
  if(e.key===MDC.KEY){   // ธีม + รายการรถ จาก admin — เปลี่ยนสดโดยไม่รีโหลด (ไม่เสีย draft)
    MDC.applyTheme(MDC.load());
    VEHICLES.length=0;VEHICLES.push(...MDC.data('vehicles'));
    if(CURRENT_DRIVER)render(VIEW);
    return;
  }
  if(e.key===MDD.KEY){DB=MDD.load();if(CURRENT_DRIVER)render(VIEW)}   // ฟิลด์/Fleet Card/ข้อมูล จาก admin part 2
});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
loadLogin();
if(CURRENT_DRIVER){showApp();go('form');}
else{showLogin();}
