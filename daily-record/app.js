/* ============================================================
   app.js — บันทึกการใช้งานรถ (daily-record PWA)
   ใช้ window.MDC (../config.js: รถ + ธีม) และ window.MDD (../config-daily.js)
   4 แท็บ: home (Fleet Card) / form / history / month
   การตั้งค่าฟิลด์-Fleet Card-ข้อมูล อยู่ที่ ../admin-config.html part 2
   ============================================================ */
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
const baht=n=>(+n||0).toLocaleString('th-TH',{maximumFractionDigits:2});
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(t._x);t._x=setTimeout(()=>t.classList.remove('show'),2600)}

let DB=MDD.load();
const VEHICLES=MDC.data('vehicles');
let VIEW='home';
let F=null,editId=null;        // ฟอร์มที่กำลังกรอก + id ที่กำลังแก้ไข
let histFilter=0,histDetail=null;
let monthYM=MDD.isoToday().slice(0,7);

/* ---------- router ---------- */
function go(v){
  VIEW=v;
  ['home','form','history','month'].forEach(x=>{
    $('view-'+x).classList.toggle('hidden',x!==v);
    $('tab-'+x).classList.toggle('on',x===v);
  });
  render(v);
  window.scrollTo({top:0});
}
function render(v){
  if(v==='home')renderHome();
  if(v==='form')renderForm();
  if(v==='history')renderHistory();
  if(v==='month')renderMonth();
}
function goNewForm(){if(!F)newForm();go('form')}   // คง draft ที่กรอกค้างไว้เมื่อสลับแท็บ

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

/* ============================================================
   TAB 1 — รถของฉัน (Fleet Cards)
   ============================================================ */
function renderHome(){
  const ym=MDD.isoToday().slice(0,7),today=MDD.isoToday();
  $('view-home').innerHTML=VEHICLES.map(v=>{
    const fc=MDD.fleetFor(v.id);
    const recs=DB.records.filter(r=>r.vehicleId===v.id);
    const spend=recs.filter(r=>monthKey(r.date)===ym).reduce((s,r)=>s+recCost(r),0);
    const hasToday=recs.some(r=>r.date===today);
    return`<div class="vwrap">
      <div class="fcard">
        <div class="frow"><span class="fbrand">PEA FLEET CARD</span><span class="ms" style="font-size:28px;opacity:.9">sim_card</span></div>
        <div class="fno">${esc(fc.no)}</div>
        <div class="fholder">${esc(fc.holder||v.org)}</div>
        <div class="frow fbot">
          <span><b>${esc(v.plate)}</b><br><small>${esc(v.model)}${v.attach?' · '+esc(v.attach):''}</small></span>
          <span class="fspend">ค่าใช้จ่ายเดือนนี้<br><b>฿${baht(spend)}</b></span>
        </div>
      </div>
      <div class="vquick">
        ${hasToday?'<span class="badge b-ok">วันนี้บันทึกแล้ว</span>':'<span class="badge b-low">วันนี้ยังไม่บันทึก</span>'}
        <span class="badge b-brand">${recs.length} รายการ</span>
        <button class="btn btn-p" onclick="startRecord(${v.id})"><span class="ms" style="font-size:18px">edit_note</span> บันทึกวันนี้</button>
      </div>
    </div>`;
  }).join('')||'<div class="empty">ไม่มีรถในระบบ — เพิ่มได้จาก Admin Control Panel</div>';
}
function startRecord(vid){
  newForm();
  F.vehicleId=vid;
  F.odoStart=lastOdo(vid);
  go('form');
}

/* ============================================================
   TAB 2 — ฟอร์มบันทึก (config-driven จาก DB.fields)
   ============================================================ */
const STATIONS=['ปตท.','บางจาก','Shell','PT','อื่นๆ'];
const FUEL_TYPES=['ดีเซล','ดีเซล B7','แก๊สโซฮอล์ 95','แก๊สโซฮอล์ 91','E20'];

function newForm(){
  editId=null;
  F={vehicleId:null,date:MDD.isoToday(),odoStart:'',odoEnd:'',driver:'',mission:'',receipts:[],others:[],custom:{}};
}
function pickV(vid){
  F.vehicleId=vid;
  if(F.odoStart===''||F.odoStart===null)F.odoStart=lastOdo(vid);
  renderForm();
}
function renderForm(){
  if(!F)newForm();
  const std=DB.fields.std,parts=[];
  parts.push(`<div class="sect" style="margin-bottom:14px">${editId?'แก้ไขบันทึก':'บันทึกการใช้งานรถประจำวัน'}</div>`);

  parts.push(`<div class="f"><label>รถ <em>*</em></label>
    <div class="chips">${VEHICLES.map(v=>`<div class="chip ${F.vehicleId===v.id?'sel':''}" onclick="pickV(${v.id})">${esc(v.plate)}</div>`).join('')}</div>
    ${F.vehicleId?`<div class="hint" style="margin-top:6px">บัตร Fleet Card: ${esc(MDD.fleetFor(F.vehicleId).no)}</div>`:''}</div>`);

  if(std.date.on)parts.push(`<div class="f"><label>วันที่ใช้งาน <em>*</em></label>
    <div class="in noic"><input type="date" value="${F.date}" max="${MDD.isoToday()}" onchange="F.date=this.value"></div></div>`);

  if(std.odoStart.on||std.odoEnd.on)parts.push(`<div class="odorow">
    <div class="f"><label>เลขไมล์เริ่มต้น <em>*</em></label><div class="in noic"><input type="number" id="odoS" inputmode="numeric" placeholder="เช่น 84120" value="${F.odoStart}" oninput="F.odoStart=this.value;updDist()"></div></div>
    <div class="f"><label>เลขไมล์สิ้นสุด <em>*</em></label><div class="in noic"><input type="number" id="odoE" inputmode="numeric" placeholder="เช่น 84205" value="${F.odoEnd}" oninput="F.odoEnd=this.value;updDist()"></div></div>
    </div><div class="distline" id="distline"></div>`);

  if(std.driver.on)parts.push(`<div class="f"><label>${esc(MDD.STD_META.driver.label)}${std.driver.req?' <em>*</em>':''}</label>
    <div class="in noic"><input list="dl-drivers" value="${esc(F.driver)}" oninput="F.driver=this.value" placeholder="ชื่อ-สกุล"></div>
    <datalist id="dl-drivers">${DB.drivers.map(d=>`<option value="${esc(d)}">`).join('')}</datalist></div>`);

  if(std.mission.on)parts.push(`<div class="f"><label>${esc(MDD.STD_META.mission.label)}${std.mission.req?' <em>*</em>':''}</label>
    <textarea rows="2" oninput="F.mission=this.value" placeholder="เช่น ตรวจสายส่ง อ.ปากช่อง">${esc(F.mission)}</textarea></div>`);

  if(std.receipts.on)parts.push(renderReceipts(std.receipts));
  if(std.others.on)parts.push(renderOthers());
  DB.fields.custom.filter(c=>c.on).forEach(c=>parts.push(renderCustom(c)));

  parts.push(`<div class="formbtns">
    <button class="btn btn-g" onclick="cancelForm()">ยกเลิก</button>
    <button class="btn btn-p" onclick="saveForm()">${editId?'บันทึกการแก้ไข':'บันทึก'}</button></div>`);

  $('view-form').innerHTML=`<div class="card">${parts.join('')}</div>`;
  updDist();
}
function updDist(){
  const el=$('distline');if(!el)return;
  const s=+F.odoStart,e=+F.odoEnd;
  if(F.odoStart===''||F.odoEnd===''){el.textContent='';el.classList.remove('err');return}
  if(e<s){el.textContent='⚠ เลขไมล์สิ้นสุดต้องไม่น้อยกว่าเลขไมล์เริ่มต้น';el.classList.add('err');return}
  el.classList.remove('err');
  el.textContent=`ระยะทางวันนี้ ${baht(e-s)} กม.`;
}

/* ----- ใบเสร็จ (repeater + mock OCR) ----- */
function renderReceipts(cfg){
  return`<div class="f"><label>${esc(MDD.STD_META.receipts.label)}${cfg.req?' <em>*</em>':''}</label>
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
            <div class="sp2"><label>เลขที่ใบเสร็จ</label><input value="${esc(rc.no)}" oninput="F.receipts[${i}].no=this.value" placeholder="เช่น INV-690720-1234"></div>
            <div><label>จำนวนลิตร</label><input type="number" step="0.01" inputmode="decimal" value="${rc.liters}" oninput="F.receipts[${i}].liters=this.value"></div>
            <div><label>จำนวนเงิน (บาท)</label><input type="number" step="0.01" inputmode="decimal" value="${rc.amount}" oninput="F.receipts[${i}].amount=this.value"></div>
          </div>`}
        </div>
        <span class="ms rcdel" title="ลบใบเสร็จ" onclick="delReceipt(${i})">delete</span>
      </div>
    </div>`).join('')}
  <div class="rcbtns">
    <button class="btn btn-o" onclick="$('rcfile').click()"><span class="ms" style="font-size:18px">photo_camera</span> ถ่าย/แนบรูปใบเสร็จ</button>
    <button class="btn btn-g" onclick="addReceiptManual()">กรอกเองไม่มีรูป</button>
  </div></div>`;
}
function addReceiptManual(){
  F.receipts.push({no:'',station:'ปตท.',fuelType:'ดีเซล',liters:'',amount:'',photoThumb:null,ocr:false});
  renderForm();
}
function delReceipt(i){F.receipts.splice(i,1);renderForm()}
$('rcfile').addEventListener('change',async e=>{
  const file=e.target.files[0];e.target.value='';
  if(!file)return;
  const rc={no:'',station:'ปตท.',fuelType:'ดีเซล',liters:'',amount:'',photoThumb:null,ocr:false,scanning:true};
  F.receipts.push(rc);
  renderForm();
  try{
    const [thumb,data]=await Promise.all([makeThumb(file),DailyOCR.readReceipt(file)]);
    Object.assign(rc,{photoThumb:thumb,no:data.no,station:STATIONS.includes(data.station)?data.station:'อื่นๆ',
      fuelType:FUEL_TYPES.includes(data.fuelType)?data.fuelType:'ดีเซล',
      liters:data.liters,amount:data.amount,ocr:true,scanning:false,justRead:true});
    renderForm();
    setTimeout(()=>{rc.justRead=false},1500);
  }catch(err){
    rc.scanning=false;rc.photoThumb=await makeThumb(file).catch(()=>null);
    renderForm();
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
  return`<div class="f"><label>${esc(MDD.STD_META.others.label)}</label>
  ${F.others.map((o,i)=>`<div class="otrow">
    <select onchange="F.others[${i}].type=this.value">${MDD.OTHER_TYPES.map(t=>`<option ${o.type===t?'selected':''}>${t}</option>`).join('')}</select>
    <input class="amt" type="number" inputmode="decimal" placeholder="บาท" value="${o.amount}" oninput="F.others[${i}].amount=this.value">
    <input placeholder="โน้ต (ถ้ามี)" value="${esc(o.note)}" oninput="F.others[${i}].note=this.value">
    <span class="ms rcdel" onclick="F.others.splice(${i},1);renderForm()">delete</span>
  </div>`).join('')}
  <button class="btn btn-g" style="padding:8px 14px;font-size:13.5px" onclick="F.others.push({type:'ทางด่วน',amount:'',note:''});renderForm()"><span class="ms" style="font-size:17px">add</span> เพิ่มค่าใช้จ่าย</button></div>`;
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

/* ----- save / cancel ----- */
function saveForm(){
  const std=DB.fields.std;
  if(!F.vehicleId){toast('กรุณาเลือกรถ');return}
  if(std.date.on&&!F.date){toast('กรุณาระบุวันที่');return}
  if(std.odoStart.on){
    if(F.odoStart===''||F.odoEnd===''){toast('กรุณากรอกเลขไมล์เริ่มต้นและสิ้นสุด');return}
    if(+F.odoEnd<+F.odoStart){toast('เลขไมล์สิ้นสุดต้องไม่น้อยกว่าเลขไมล์เริ่มต้น');return}
  }
  if(std.driver.on&&std.driver.req&&!F.driver.trim()){toast('กรุณากรอกชื่อผู้ใช้รถ');return}
  if(std.mission.on&&std.mission.req&&!F.mission.trim()){toast('กรุณากรอกภารกิจ/เส้นทาง');return}
  if(std.receipts.on&&std.receipts.req&&!F.receipts.length){toast('กรุณาเพิ่มใบเสร็จอย่างน้อย 1 ใบ');return}
  if(F.receipts.some(r=>r.scanning)){toast('รอระบบอ่านใบเสร็จให้เสร็จก่อน');return}
  for(const c of DB.fields.custom.filter(x=>x.on&&x.req)){
    const v=F.custom[c.key];
    if(c.type==='check'?!v:!(v&&String(v).trim())){toast('กรุณากรอก "'+c.label+'"');return}
  }
  // กันซ้ำ คัน+วัน
  const dup=DB.records.find(r=>r.vehicleId===F.vehicleId&&r.date===F.date&&r.id!==editId);
  if(dup){
    if(confirm('มีบันทึกของรถคันนี้ในวันเดียวกันอยู่แล้ว\nตกลง = เปิดรายการเดิมขึ้นมาแก้ไข')){editRec(dup.id)}
    return;
  }
  const veh=vehicleOf(F.vehicleId);
  const rec={
    id:editId||('r'+Date.now()),
    vehicleId:F.vehicleId,plate:veh?veh.plate:null,
    date:F.date,odoStart:+F.odoStart||0,odoEnd:+F.odoEnd||0,
    driver:F.driver.trim(),mission:F.mission.trim(),
    receipts:F.receipts.map(r=>({no:String(r.no).trim(),station:r.station,fuelType:r.fuelType,
      liters:+r.liters||0,amount:+r.amount||0,photoThumb:r.photoThumb||null,ocr:!!r.ocr})),
    others:F.others.filter(o=>+o.amount>0).map(o=>({type:o.type,amount:+o.amount,note:String(o.note||'').trim()})),
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
  newForm();
  histDetail=rec.id;
  go('history');
}
function cancelForm(){newForm();go('home')}

/* ============================================================
   TAB 3 — ประวัติ
   ============================================================ */
function renderHistory(){
  if(histDetail){renderHistDetail(histDetail);return}
  const list=DB.records.filter(r=>!histFilter||r.vehicleId===histFilter)
    .sort((a,b)=>a.date<b.date?1:(a.date>b.date?-1:b.createdAt-a.createdAt));
  const chips=`<div class="chips" style="margin-bottom:6px">
    <div class="chip ${!histFilter?'sel':''}" onclick="histFilter=0;renderHistory()">ทั้งหมด</div>
    ${VEHICLES.map(v=>`<div class="chip ${histFilter===v.id?'sel':''}" onclick="histFilter=${v.id};renderHistory()">${esc(v.plate)}</div>`).join('')}</div>`;
  if(!list.length){$('view-history').innerHTML=chips+'<div class="empty">ยังไม่มีบันทึก — เริ่มจากแท็บ "บันทึก" หรือเติมข้อมูลตัวอย่างจาก Admin</div>';return}
  const groups={};
  list.forEach(r=>{(groups[r.date]=groups[r.date]||[]).push(r)});
  $('view-history').innerHTML=chips+Object.keys(groups).sort().reverse().map(d=>
    `<div class="dayhead">${MDD.thDate(d)}</div>`+
    groups[d].map(r=>`<div class="job" onclick="histDetail='${r.id}';renderHistory()">
      <span class="ms" style="color:var(--primary-600)">local_gas_station</span>
      <div class="sp">
        <div class="no">${esc(plateOf(r))} ${vehicleGone(r)?'<span class="badge b-out">รถถูกลบจากระบบ</span>':''}</div>
        <div class="hmeta"><span>${esc(r.driver||'—')}</span><span><b>${baht(distOf(r))}</b> กม.</span>
          <span>น้ำมัน <b>฿${baht(fuelCost(r))}</b></span>
          ${r.receipts.length?`<span><span class="ms" style="font-size:14px">receipt_long</span> ${r.receipts.length}</span>`:''}</div>
      </div>
      <span class="ms" style="color:var(--gray-300)">chevron_right</span>
    </div>`).join('')).join('');
}
function renderHistDetail(id){
  const r=DB.records.find(x=>x.id===id);
  if(!r){histDetail=null;renderHistory();return}
  const customRows=Object.entries(r.custom||{}).filter(([,v])=>v!==''&&v!==null&&v!==undefined).map(([k,v])=>{
    const def=DB.fields.custom.find(c=>c.key===k);
    const label=def?def.label:'ฟิลด์ที่ถูกลบ';
    return`<div class="sumrow"><span>${esc(label)}</span><span>${v===true?'✓':esc(v)}</span></div>`;
  }).join('');
  $('view-history').innerHTML=`
    <div class="job" style="cursor:default">
      <span class="ms" style="color:var(--primary-600)">description</span>
      <div class="sp"><div class="no">${esc(plateOf(r))}</div><div class="hmeta">${MDD.thDate(r.date)}</div></div>
      ${vehicleGone(r)?'<span class="badge b-out">รถถูกลบจากระบบ</span>':''}
    </div>
    <div class="card" style="padding:6px 16px">
      <div class="sumrow"><span>ผู้ใช้รถ</span><span>${esc(r.driver||'—')}</span></div>
      <div class="sumrow"><span>ภารกิจ/เส้นทาง</span><span>${esc(r.mission||'—')}</span></div>
      <div class="sumrow"><span>เลขไมล์</span><span>${baht(r.odoStart)} → ${baht(r.odoEnd)} (${baht(distOf(r))} กม.)</span></div>
      <div class="sumrow"><span>ค่าน้ำมัน</span><span>฿${baht(fuelCost(r))} (${baht(litersOf(r))} ลิตร)</span></div>
      <div class="sumrow"><span>ค่าใช้จ่ายอื่น</span><span>${r.others.length?r.others.map(o=>`${esc(o.type)} ฿${baht(o.amount)}${o.note?' ('+esc(o.note)+')':''}`).join('<br>'):'—'}</span></div>
      ${customRows}
    </div>
    ${r.receipts.length?`<div class="sect" style="margin:16px 0 8px">ใบเสร็จ (${r.receipts.length})</div>`+r.receipts.map(rc=>`
      <div class="rccard"><div class="rcrow">
        ${rc.photoThumb?`<img class="rthumb" src="${rc.photoThumb}">`:`<div class="rthumb rthumb-ph"><span class="ms" style="font-size:30px">receipt_long</span></div>`}
        <div style="flex:1;font-size:13.5px;color:var(--gray-700)">
          <b style="color:var(--gray-900)">${esc(rc.station)} · ${esc(rc.fuelType)}</b> ${rc.ocr?'<span class="badge b-brand">OCR</span>':''}<br>
          เลขที่ ${esc(rc.no||'—')}<br>${baht(rc.liters)} ลิตร · <b>฿${baht(rc.amount)}</b>
        </div>
      </div></div>`).join(''):''}
    <div class="formbtns">
      <button class="btn btn-g" onclick="histDetail=null;renderHistory()">← กลับรายการ</button>
      <button class="btn btn-o" onclick="editRec('${r.id}')">แก้ไข</button>
      <button class="btn btn-g" style="color:var(--error-600)" onclick="delRec('${r.id}')">ลบ</button>
    </div>`;
}
function editRec(id){
  const r=DB.records.find(x=>x.id===id);
  if(!r)return;
  editId=id;
  F={vehicleId:r.vehicleId,date:r.date,odoStart:r.odoStart,odoEnd:r.odoEnd,driver:r.driver,mission:r.mission,
     receipts:MDD.clone(r.receipts),others:MDD.clone(r.others),custom:MDD.clone(r.custom||{})};
  go('form');
}
function delRec(id){
  if(!confirm('ลบบันทึกนี้?'))return;
  DB.records=DB.records.filter(r=>r.id!==id);
  MDD.saveGuarded(DB);
  histDetail=null;
  toast('ลบบันทึกแล้ว');
  renderHistory();
}

/* ============================================================
   TAB 4 — สรุปรายเดือน
   ============================================================ */
function shiftMonth(d){
  const[y,m]=monthYM.split('-').map(Number);
  const dt=new Date(y,m-1+d,1);
  monthYM=`${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`;
  renderMonth();
}
function renderMonth(){
  const recs=DB.records.filter(r=>monthKey(r.date)===monthYM);
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
      kmpl:liters>0?(dist/liters):null};
  }).filter(Boolean);
  const maxFuel=Math.max(...perV.map(x=>x.fuel),1);
  $('view-month').innerHTML=nav+perV.map(x=>`
    <div class="card">
      <h2 class="ttl">${esc(x.v.plate)}</h2>
      <div class="sub">${esc(x.v.model)} · บัตร ${esc(MDD.fleetFor(x.v.id).no)}</div>
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
    render(VIEW);return;
  }
  if(e.key===MDD.KEY){DB=MDD.load();render(VIEW)}          // ฟิลด์/Fleet Card/ข้อมูล จาก admin part 2
});
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
newForm();
go('home');
