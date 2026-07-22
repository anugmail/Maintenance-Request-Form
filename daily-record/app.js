/* ============================================================
   app.js — บันทึกการใช้งานรถ (daily-record PWA)
   ใช้ window.MDC (../config.js: รถ + ธีม) และ window.MDD (../config-daily.js)
   2 แท็บ: form (การ์ดรายวัน — default) / month
   flow แบบ logbook feed: หน้าแรกเป็นการ์ดของแต่ละวัน (วันนี้ + ย้อนหลัง) แตะเพื่อ
   expand กรอกข้อมูล — ทีละใบ (accordion) รถ default ตามคันล่าสุดที่ใช้ เลขไมล์เริ่มต้น
   ดึงจากเลขไมล์สิ้นสุดของบันทึกล่าสุดให้อัตโนมัติ (แก้ไขได้)
   ผู้ใช้งานมาจาก mock login (เลือกโปรไฟล์คนขับ) ไม่ต้องพิมพ์ชื่อซ้ำในฟอร์ม
   การตั้งค่าฟิลด์-Fleet Card-ข้อมูล อยู่ที่ ../admin-config.html part 2
   ============================================================ */
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const baht=n=>(+n||0).toLocaleString('th-TH',{maximumFractionDigits:2});
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2600)}

let DB=MDD.load();
const VEHICLES=MDC.data('vehicles');
let VIEW='form';
let F=null,editId=null;        // ฟอร์มของการ์ดที่กำลังเปิดอยู่ + id ที่กำลังแก้ไข (null = ยังไม่มีการ์ดไหนเปิด)
let expandedDate=null;         // วันที่ (ISO) ของการ์ดที่ขยายอยู่ตอนนี้ — เปิดได้ทีละใบ
let vSheetOpen=false;          // bottom sheet เลือกรถ (dropdown card)
let addSheetOpen=false;        // sheet "เพิ่มบันทึกเอง" — เลือกวันที่ย้อนหลังมากรอก
let monthYM=MDD.isoToday().slice(0,7);

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
  CURRENT_DRIVER=null;expandedDate=null;F=null;editId=null;
  showLogin();
}
function showLogin(){
  $('aphdr').classList.add('hidden');
  $('amainWrap').classList.add('hidden');
  $('tabbar').classList.add('hidden');
  $('fabAdd').classList.add('hidden');
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
  $('hdrSub').textContent=`บันทึกรายวันแบบ logbook · ${CURRENT_DRIVER.name} (แตะรูปเพื่อสลับผู้ใช้)`;
}

/* ---------- router (2 แท็บ) ---------- */
function go(v){
  VIEW=v;
  vSheetOpen=false;
  addSheetOpen=false;
  ['form','month'].forEach(x=>{
    $('view-'+x).classList.toggle('hidden',x!==v);
    $('tab-'+x).classList.toggle('on',x===v);
  });
  $('fabAdd').classList.toggle('hidden',v!=='form');
  render(v);
  renderVSheet();
  renderAddSheet();
  window.scrollTo({top:0});
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
   Feed หน้าแรก — การ์ดรายวัน (วันนี้ + ย้อนหลัง) แตะเพื่อ expand ทีละใบ
   ============================================================ */
const STATIONS=['ปตท.','บางจาก','Shell','PT','อื่นๆ'];
/* ตรงกับรายการในใบสั่งจ่ายน้ำมันจริงของ กฟภ. (ยพ.๑-ป.๔๔) — เรียงตามลำดับในแบบฟอร์ม */
const FUEL_TYPES=['เบนซิน ออกเทน 95','เบนซิน ออกเทน 91','แก๊สโซฮอล์ 95','แก๊สโซฮอล์ 91','ดีเซล','ดีเซลปาล์ม','น้ำมันเครื่อง'];

function feedDates(){
  const today=MDD.isoToday();
  const set=new Set(myRecords().map(r=>r.date));
  set.add(today);
  if(expandedDate)set.add(expandedDate);   // เผื่อเพิ่งเปิดวันย้อนหลังที่ยังไม่มีบันทึกจากปุ่ม "เพิ่มบันทึกเอง"
  return[...set].sort((a,b)=>b.localeCompare(a));   // ล่าสุดก่อน (วันนี้อยู่บนสุด)
}

/* ----- เพิ่มบันทึกเอง — เลือกวันที่ย้อนหลังไปกรอก (เผื่อลืมบันทึกวันไหน ไม่ใช่ทำได้แค่วันนี้) ----- */
function openAddSheet(){addSheetOpen=true;renderAddSheet()}
function closeAddSheet(){addSheetOpen=false;renderAddSheet()}
function renderAddSheet(){
  const root=$('addSheetRoot');if(!root)return;
  if(!addSheetOpen){root.innerHTML='';return}
  const today=MDD.isoToday();
  root.innerHTML=`
    <div class="vsheet-backdrop" onclick="closeAddSheet()"></div>
    <div class="vsheet-panel" style="max-height:none">
      <div class="vsheet-handle"></div>
      <div class="vsheet-header"><h3>เพิ่มบันทึกเอง</h3><span class="ms" style="cursor:pointer;background:var(--gray-100);border-radius:10px;width:34px;height:34px;display:flex;align-items:center;justify-content:center" onclick="closeAddSheet()">close</span></div>
      <div style="padding:16px">
        <div class="f"><label>เลือกวันที่ต้องการบันทึก</label>
          <input type="date" id="addDateInput" max="${today}" value="${today}">
          <div class="hint" style="margin-top:6px">เลือกวันที่ผ่านมาได้ เผื่อลืมบันทึกวันนั้น</div>
        </div>
        <button class="btn btn-p" style="width:100%" onclick="confirmAddDate()">ไปกรอกข้อมูลวันที่เลือก</button>
      </div>
    </div>`;
}
function confirmAddDate(){
  const val=$('addDateInput').value;
  if(!val){toast('กรุณาเลือกวันที่');return}
  closeAddSheet();
  openDay(val);
}
function renderFeed(){
  const dates=feedDates();
  const today=MDD.isoToday();
  const pastDates=dates.filter(d=>d!==today);
  let html=`<div class="feed-section">
    <div class="feed-label"><span class="ms">wb_sunny</span>วันนี้</div>
    ${dayCardHtml(today)}
  </div>`;
  if(pastDates.length){
    html+=`<div class="feed-section">
      <div class="feed-label muted"><span class="ms">history</span>ย้อนหลัง</div>
      ${pastDates.map(dayCardHtml).join('')}
    </div>`;
  }
  $('view-form').innerHTML=html;
  updDist();
}
function dayCardHtml(dateIso){
  const rec=myRecords().find(r=>r.date===dateIso);
  const today=dateIso===MDD.isoToday();
  const expanded=expandedDate===dateIso;
  const driverName=rec?rec.driver:(CURRENT_DRIVER?CURRENT_DRIVER.name:'');
  const dav=driverAvatarFor(driverName);
  const plate=rec?plateOf(rec):(vehicleOf(getLastVehicle())||{}).plate;
  return`<div class="daycard ${today?'today':''} ${rec?'filled':'unfilled'}">
    <div class="dc-head" onclick="openDay('${dateIso}')">
      <div class="avatar avatar-sm" style="background:${dav.color}">${dav.initials}</div>
      <div class="dc-info">
        <div class="dc-date">${MDD.thDate(dateIso,{day:'numeric',month:'short',year:'numeric'})} ${today?'<span class="badge b-brand">วันนี้</span>':''}</div>
        <div class="dc-sub">${esc(driverName||'—')}${plate?' · '+esc(plate):''}${rec&&rec.equipmentHours?' · เครน '+esc(String(rec.equipmentHours))+' ชม.':''}${rec&&vehicleGone(rec)?' · <span class="badge b-out">รถถูกลบ</span>':''}</div>
      </div>
      <div class="dc-right">
        ${rec?`<div class="dc-fuel">฿${baht(fuelCost(rec))}</div><span class="badge b-ok">บันทึกแล้ว</span>`:`<span class="badge b-low">ยังไม่บันทึก</span>`}
      </div>
      <span class="ms dc-chev">${expanded?'expand_less':'expand_more'}</span>
    </div>
    ${expanded?`<div class="dc-body">${dayFormHtml()}</div>`:''}
  </div>`;
}
function openDay(dateIso){
  if(expandedDate===dateIso){expandedDate=null;F=null;editId=null;renderFeed();return}
  const rec=myRecords().find(r=>r.date===dateIso);
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
  expandedDate=dateIso;
  renderFeed();
}
function pickV(vid){
  F.vehicleId=vid;
  if(F.odoStart===''||F.odoStart===null)F.odoStart=lastOdo(vid);
  setLastVehicle(vid);
  renderFeed();
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

/* ----- เนื้อหาฟอร์มภายในการ์ดที่ขยายอยู่ ----- */
function dayFormHtml(){
  const std=DB.fields.std,parts=[],vSel=F.vehicleId?vehicleOf(F.vehicleId):null;

  parts.push(`<div class="f" style="margin-top:14px"><label>รถ <em>*</em></label>
    <div class="vtrigger" onclick="openVSheet()">
      <span class="ms">local_shipping</span>
      <div class="sp">${vSel?`<b>${esc(vSel.plate)}</b><div class="sub" style="margin:0">${esc(vSel.model)}${vSel.attach?' · '+esc(vSel.attach):''}</div>`:'<b style="color:var(--gray-400);font-weight:500">แตะเพื่อเลือกรถ</b>'}</div>
      <span class="ms" style="color:var(--gray-400)">expand_more</span>
    </div></div>`);

  if(std.odoStart.on||std.odoEnd.on)parts.push(`<div class="odorow">
    <div class="f"><label>เลขไมล์เริ่มต้น <em>*</em></label><div class="in noic"><input type="number" id="odoS" inputmode="numeric" placeholder="เช่น 84120" value="${F.odoStart}" oninput="F.odoStart=this.value;updDist()"></div></div>
    <div class="f"><label>เลขไมล์สิ้นสุด <em>*</em></label><div class="in noic"><input type="number" id="odoE" inputmode="numeric" placeholder="เช่น 84205" value="${F.odoEnd}" oninput="F.odoEnd=this.value;updDist()"></div></div>
    </div><div class="distline" id="distline"></div>
    <div class="hint" style="margin:-6px 0 12px">เลขไมล์เริ่มต้นดึงจากเลขไมล์สิ้นสุดของบันทึกล่าสุดของรถคันนี้ให้อัตโนมัติ (แบบ logbook) — แก้ไขได้ถ้าไม่ตรง</div>`);

  const needsEquip=!!(vSel&&vSel.attach);
  if(std.equipmentHours.on&&needsEquip)parts.push(`<div class="f"><label>${esc(MDD.STD_META.equipmentHours.label)} <small>(ถ้ามี)</small></label>
    <div class="in noic"><input type="number" inputmode="decimal" step="0.1" value="${esc(F.equipmentHours)}" oninput="F.equipmentHours=this.value" placeholder="อ่านจากมิเตอร์เครื่องจักร เช่น 2365"></div>
    <div class="hint" style="margin-top:4px">รถคันนี้มีอุปกรณ์เสริม (${esc(vSel.attach)}) — บันทึกแยกจากเลขไมล์รถเสมอ (TOR ข้อ 2/T6) ไม่บังคับกรอก</div></div>`);

  if(std.mission.on)parts.push(`<div class="f"><label>${esc(MDD.STD_META.mission.label)}${std.mission.req?' <em>*</em>':''}</label>
    <div class="in noic"><input list="dl-missions" value="${esc(F.mission)}" oninput="F.mission=this.value" placeholder="เลือกจากจุดทำงาน PEA หรือพิมพ์เอง"></div>
    <datalist id="dl-missions">${MDD.MISSION_PRESETS.map(m=>`<option value="${esc(m)}">`).join('')}</datalist></div>`);

  if(std.receipts.on)parts.push(renderFuelSection(std.receipts));
  if(std.others.on)parts.push(renderOthers());
  if(std.note.on)parts.push(`<div class="sect" style="margin:20px 0 10px">หมายเหตุ</div>
    <div class="f"><div class="in noic"><input value="${esc(F.note)}" oninput="F.note=this.value" placeholder="บันทึกเพิ่มเติม (ถ้ามี)"></div></div>`);
  DB.fields.custom.filter(c=>c.on).forEach(c=>parts.push(renderCustom(c)));

  parts.push(`<div class="formbtns">
    <button class="btn btn-g" onclick="cancelForm()">ยกเลิก</button>
    ${editId?`<button class="btn btn-g" style="color:var(--error-600)" onclick="deleteDay()">ลบ</button>`:''}
    <button class="btn btn-p" onclick="saveForm()">${editId?'บันทึกการแก้ไข':'บันทึก'}</button></div>`);

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

/* ----- ใบเสร็จ (repeater + mock OCR) + Fleet Card / เงินสด ----- */
function cardBandHtml(){
  const veh=F.vehicleId?vehicleOf(F.vehicleId):null;
  if(!veh)return'';
  const fc=MDD.fleetFor(veh.id);
  if(F.cardOverride)return`
    <div class="fcband" style="align-items:flex-start">
      <span class="ms">credit_card_off</span>
      <div class="sp">
        <b>ใช้บัตรอื่น (ไม่ใช่บัตรประจำรถ ${esc(fc.bank||'')} ${esc(fc.no)})</b>
        <div class="f" style="margin-top:8px"><label>เลขบัตรที่ใช้จริง</label><div class="in noic"><input value="${esc(F.cardOverrideNo)}" oninput="F.cardOverrideNo=this.value" placeholder="เลขบัตร Fleet Card ที่ใช้จริง"></div></div>
        <div class="f" style="margin:8px 0 0"><label>เหตุผลที่ใช้บัตรอื่น <em>*</em></label><div class="in noic"><input value="${esc(F.cardOverrideNote)}" oninput="F.cardOverrideNote=this.value" placeholder="เช่น บัตรประจำรถชำรุด/ยืมรถคันอื่น"></div></div>
      </div>
      <span class="fclink" onclick="toggleCardOverride()">ยกเลิก</span>
    </div>`;
  return`
    <div class="fcband">
      <span class="ms">credit_card</span>
      <div class="sp"><b>Fleet Card ประจำรถคันนี้ · ${esc(fc.bank||'—')}</b><div class="sub" style="margin:0">${esc(fc.no)} · ${esc(fc.holder||veh.org)}</div></div>
      <span class="fclink" onclick="toggleCardOverride()">ใช้บัตรอื่น</span>
    </div>`;
}
function toggleCardOverride(){
  F.cardOverride=!F.cardOverride;
  if(!F.cardOverride){F.cardOverrideNo='';F.cardOverrideNote=''}
  renderFeed();
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
  renderFeed();
}
function renderFuelSection(cfg){
  const hasReceipts=F.receipts.length>0;
  const isCash=F.paymentMethod==='cash';
  return`<div class="sect" style="margin:20px 0 10px">น้ำมัน</div>
  <div class="f"><label>${esc(MDD.STD_META.receipts.label)}${cfg.req?' <em>*</em>':''}</label>
  ${isCash?cashBandHtml():cardBandHtml()}
  <div style="margin:-4px 0 12px">
    <span class="fclink-muted" onclick="setPayMethod('${isCash?'fleetcard':'cash'}')">${isCash?'← กลับไปใช้ Fleet Card':'จ่ายเป็นเงินสดแทน (กรณีไม่มีบัตร)'}</span>
  </div>
  ${!hasReceipts?`
  <div class="camera-cta" onclick="$('rcfile').click()">
    <span class="ms">photo_camera</span>
    <b>ถ่ายรูปสลิป</b>
    <span class="cta-sub">แตะเพื่อถ่ายรูป ระบบจะอ่านข้อมูลให้อัตโนมัติ</span>
  </div>
  <div style="text-align:center;margin-bottom:10px"><span class="fclink" onclick="addReceiptManual()">กรอกเองไม่มีรูป</span></div>`:''}
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
            <div><label>สถานีบริการ</label><select onchange="F.receipts[${i}].station=this.value">${STATIONS.map(s=>`<option ${rc.station===s?'selected':''}>${s}</option>`).join('')}</select></div>
            <div><label>ชนิดน้ำมัน</label><select onchange="F.receipts[${i}].fuelType=this.value">${FUEL_TYPES.map(s=>`<option ${rc.fuelType===s?'selected':''}>${s}</option>`).join('')}</select></div>
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
  renderFeed();
}
function delReceipt(i){F.receipts.splice(i,1);renderFeed()}
/* คำนวณจำนวนเงินรวมจากราคา/ลิตร × ลิตรอัตโนมัติ — อัปเดต DOM ตรงๆ (ไม่ renderFeed) กันโฟกัสหลุดตอนพิมพ์ */
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
  renderFeed();
  try{
    const [thumb,data]=await Promise.all([makeThumb(file),DailyOCR.readReceipt(file)]);
    Object.assign(rc,{photoThumb:thumb,no:data.no,station:STATIONS.includes(data.station)?data.station:'อื่นๆ',
      fuelType:FUEL_TYPES.includes(data.fuelType)?data.fuelType:'ดีเซล',
      price:data.price,liters:data.liters,amount:data.amount,ocr:true,scanning:false,justRead:true});
    renderFeed();
    setTimeout(()=>{rc.justRead=false},1500);
  }catch(err){
    rc.scanning=false;rc.photoThumb=await makeThumb(file).catch(()=>null);
    renderFeed();
    toast('อ่านใบเสร็จไม่สำเร็จ — กรอกข้อมูลเองได้เลย');
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

/* ----- ค่าใช้จ่ายอื่น (repeater) ----- */
function renderOthers(){
  return`<div class="sect" style="margin:20px 0 10px">ค่าใช้จ่ายอื่น</div>
  <div class="f">
  ${F.others.map((o,i)=>`<div class="otrow">
    <select onchange="F.others[${i}].type=this.value">${MDD.OTHER_TYPES.map(t=>`<option ${o.type===t?'selected':''}>${t}</option>`).join('')}</select>
    <input class="amt" type="number" inputmode="decimal" placeholder="บาท" value="${o.amount}" oninput="F.others[${i}].amount=this.value">
    <input placeholder="โน้ต (ถ้ามี)" value="${esc(o.note)}" oninput="F.others[${i}].note=this.value">
    <span class="ms rcdel" onclick="F.others.splice(${i},1);renderFeed()">delete</span>
  </div>`).join('')}
  <button class="btn btn-g" style="padding:8px 14px;font-size:13.5px" onclick="F.others.push({type:'ทางด่วน',amount:'',note:''});renderFeed()"><span class="ms" style="font-size:17px">add</span> เพิ่มค่าใช้จ่าย</button></div>`;
}

/* ----- custom fields (จาก admin part 2) ----- */
function renderCustom(c){
  const v=F.custom[c.key],req=c.req?' <em>*</em>':'';
  if(c.type==='check')return`<div class="f"><label class="chkrow"><input type="checkbox" ${v?'checked':''} onchange="F.custom['${c.key}']=this.checked">${esc(c.label)}</label></div>`;
  if(c.type==='select')return`<div class="f"><label>${esc(c.label)}${req}</label><div class="in noic"><select onchange="F.custom['${c.key}']=this.value">
    <option value="">— เลือก —</option>${(c.options||[]).map(o=>`<option ${v===o?'selected':''}>${esc(o)}</option>`).join('')}</select></div></div>`;
  const t=c.type==='number'?'number':c.type==='date'?'date':'text';
  return`<div class="f"><label>${esc(c.label)}${req}</label><div class="in noic"><input type="${t}" value="${esc(v??'')}" oninput="F.custom['${c.key}']=this.value"></div></div>`;
}

/* ----- save / cancel / delete ----- */
function saveForm(){
  const std=DB.fields.std;
  if(!F.vehicleId){toast('กรุณาเลือกรถ');return}
  if(std.odoStart.on){
    if(F.odoStart===''||F.odoEnd===''){toast('กรุณากรอกเลขไมล์เริ่มต้นและสิ้นสุด');return}
    if(+F.odoEnd<+F.odoStart){toast('เลขไมล์สิ้นสุดต้องไม่น้อยกว่าเลขไมล์เริ่มต้น');return}
  }
  const vehForSave=vehicleOf(F.vehicleId);   // ชั่วโมงเครื่องจักรไม่บังคับกรอก (optional) แม้รถจะมีเครน/กระเช้า
  if(std.mission.on&&std.mission.req&&!F.mission.trim()){toast('กรุณากรอกภารกิจ/เส้นทาง');return}
  if(std.receipts.on&&std.receipts.req&&!F.receipts.length){toast('กรุณาเพิ่มใบเสร็จอย่างน้อย 1 ใบ');return}
  if(F.receipts.some(r=>r.scanning)){toast('รอระบบอ่านใบเสร็จให้เสร็จก่อน');return}
  if(F.paymentMethod==='fleetcard'&&F.cardOverride&&!String(F.cardOverrideNote||'').trim()){toast('กรุณาระบุเหตุผลที่ใช้บัตรอื่น');return}
  for(const c of DB.fields.custom.filter(x=>x.on&&x.req)){
    const v=F.custom[c.key];
    if(c.type==='check'?!v:!(v&&String(v).trim())){toast('กรุณากรอก "'+c.label+'"');return}
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
  if(st==='fail'){toast('บันทึกไม่สำเร็จ — พื้นที่จัดเก็บเต็ม');return}
  if(st==='nophoto')toast('พื้นที่เก็บรูปเต็ม — บันทึกข้อมูลโดยไม่เก็บรูป');
  else toast(editId?'บันทึกการแก้ไขแล้ว':'บันทึกเรียบร้อย');
  expandedDate=null;F=null;editId=null;
  renderFeed();
}
function cancelForm(){expandedDate=null;F=null;editId=null;renderFeed()}
function deleteDay(){
  if(!editId)return;
  if(!confirm('ลบบันทึกของวันนี้?'))return;
  DB.records=DB.records.filter(r=>r.id!==editId);
  MDD.saveGuarded(DB);
  expandedDate=null;F=null;editId=null;
  toast('ลบบันทึกแล้ว');
  renderFeed();
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
