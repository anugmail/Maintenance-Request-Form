/* ต้นแบบ Overhaul ตามหน้าจริง UAT — router + ทุกหน้าจอ (ดูหัวไฟล์ overhaul-proto.html) */
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>{if(n==null||typeof n==='boolean'||String(n).trim()==='')return '—';const v=typeof n==='number'?n:Number(String(n).replace(/,/g,''));return Number.isFinite(v)?v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'—'};
const num=v=>{const n=Number(String(v??'').replace(/,/g,''));return String(v??'').trim()===''||!Number.isFinite(n)||n<0?'':n};
const dmy=iso=>{if(!iso)return '-';const [y,m,d]=iso.slice(0,10).split('-');return `${d}/${m}/${+y+543}`};
const dmyt=iso=>iso?`${dmy(iso)} ${iso.slice(11,16)} น.`:'-';
const ageText=m=>`${Math.floor(m/12)} ปี ${m%12} เดือน`;
const days=(a,b)=>Math.round((new Date(b)-new Date(a))/864e5);
const addDays=(iso,n)=>{const d=new Date(iso);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};

/* ---------- state ---------- */
const KEY='oh-proto-v2';
if(new URLSearchParams(location.search).get('reset')==='1'){try{localStorage.removeItem(KEY)}catch(e){}history.replaceState(null,'',location.pathname+location.hash)}
let S=(()=>{try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.plans)return s}catch(e){}return pxSeed()})();
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
// Preserve local edits; retire only the exact, unlabelled financial examples in the old seed.
if(!S.dataVersion||S.dataVersion<3){const old=[[1350000,180000],[4150000,420000],[1450000,165000],[720000,95000],[7600000,880000],[4150000,465000],[690000,210000],[3050000,340000]];const p=S.plans.find(p=>p.id==='ORZ6900026');if(p)p.cars.forEach(c=>{const v=old[Number(c.id.slice(1))-1];if(!c.priceSource&&v&&c.refPrice===v[0]&&c.ohPrice===v[1]){c.legacyPriceExample={refPrice:c.refPrice,ohPrice:c.ohPrice};c.refPrice=null;c.ohPrice=null;c.priceSource='uat-missing';}});S.dataVersion=3;save();}
if(pxApplyExamplePrices(S))save();
const veh=id=>PX_VEH.find(v=>v.id===id);
const planOf=id=>S.plans.find(p=>p.id===id);
const poOf=id=>{for(const p of S.plans){const o=p.pos.find(x=>x.id===id);if(o)return [p,o]}return []};
const vendor=id=>S.vendors.find(v=>v.id===id)||{name:'-',tel:'-',addr:'-',types:[]};
const staff=id=>PX_STAFF.find(s=>s.id===id);
const jobOf=(po,car)=>S.jobs[po+':'+car]||(S.jobs[po+':'+car]={stage:1});

/* ---------- ชิ้นส่วนร่วม ---------- */
function crumbs(items){return `<div class="crumbs !m-0 !p-0 min-h-[26px]" data-ui-component="Breadcrumbs"><span class="ms">home</span>`+items.map(([t,h],i)=>`<span class="sep"></span>${h&&i<items.length-1?`<a href="${h}">${esc(t)}</a>`:`<span class="cur">${esc(t)}</span>`}`).join('')+`</div>`}
function head(title,{back,badge,actions}={}){return `<div class="flex items-center gap-3 flex-wrap !m-0" data-page-heading data-ui-component="Page header">${back?`<a class="btn btn-t btn-icon !no-underline" href="${back}" aria-label="ย้อนกลับ"><span class="ms">chevron_left</span></a>`:''}
  <h1 class="page-title !m-0">${esc(title)}</h1>${badge||''}${actions?`<div class="ml-auto flex items-center gap-3">${actions}</div>`:''}</div>`}
// figma-export/component-rules R5/R11: Detail uses Section label; forms use Section header.
function sect(title,right,count){
  const detail=ohIsDetailView();
  if(detail)return `<div class="sect !m-0 !border-0 !pb-0 !text-md !leading-6 !min-h-10" data-ui-component="Section label">${esc(title)}${count!=null?' ('+count+')':''}${right?`<span class="ml-auto flex items-center gap-3">${right.replaceAll('btn-s','btn-tb')}</span>`:''}</div>`;
  return `<div class="sect bar !m-0" data-ui-component="Section header">${esc(title)}${count!=null?`<span class="badge sq">${count}</span>`:''}${right?`<span class="ml-auto flex items-center gap-3">${right}</span>`:''}</div>`;
}
/* กล่องแสดงข้อมูล = `Content item row` + `_Content item base` (.incident-summary/.incident-field · R12) */
const COLS={1:'!grid-cols-1',2:'',3:'lg:!grid-cols-3',4:'lg:!grid-cols-4'};
function info(pairs,cols=4){if(ohIsDetailView()&&!location.hash.startsWith('#/job/'))cols=4;return `<dl data-ui-component="Content item row" class="incident-summary ${COLS[cols]} !gap-x-6 !gap-y-6 !p-6 !rounded-lg [&_dt]:!text-md [&_dt]:!leading-6 [&_dt]:!mb-1 [&_dd]:!text-md [&_dd]:!leading-6">`+pairs.map(([k,v,span])=>`<div class="incident-field${span&&span>=cols?' wide':''}" data-ui-component="_Content item base"><dt>${esc(k)}</dt><dd>${v==null||v===''?'-':v}</dd></div>`).join('')+`</dl>`}
function fld(id,label,ctrl,{opt,cls='',icon}={}){return `<div class="f ${cls}${/\breadonly\b/.test(ctrl)?' ro':''}" data-ui-component="${ctrl.startsWith('<select')?'Input dropdown':'Text input'}" data-f="${id}"><label class="!text-md !leading-6 !font-semibold !text-gray-600 !mb-2" for="${id}">${esc(label)}${opt?' <small class="!text-md !font-normal !text-gray-400">(ถ้ามี)</small>':''}</label><div class="in${icon?'':' noic'}">${icon?`<span class="ms">${icon}</span>`:''}${ctrl}</div><div class="help hidden"></div></div>`}
const inp=(id,v,ph,t='text',x='')=>`<input class="!text-md !leading-6 placeholder:!text-gray-400" type="${t}" id="${id}" value="${esc(v??'')}" placeholder="${esc(ph||'')}" ${x}>`;
const sel=(id,v,opts,ph)=>`<select class="!text-md !leading-6" id="${id}">${ph?`<option value=""${v?'':' selected'} disabled>${esc(ph)}</option>`:''}${opts.map(o=>{const [val,t]=Array.isArray(o)?o:[o,o];return `<option value="${esc(val)}"${String(val)===String(v)?' selected':''}>${esc(t)}</option>`}).join('')}</select>`;
const ta=(id,v,ph)=>`<textarea class="!text-md !leading-6 placeholder:!text-gray-400" id="${id}" rows="3" placeholder="${esc(ph||'')}">${esc(v??'')}</textarea>`;
function setErr(id,msg){const f=document.querySelector(`[data-f="${id}"]`);if(!f)return;f.classList.toggle('err',!!msg);const h=f.querySelector('.help');h.textContent=msg||'';h.classList.toggle('hidden',!msg);const fu=f.querySelector('.fu');if(fu)fu.classList.toggle('err',!!msg);f.querySelectorAll('select').forEach(x=>x.classList.toggle('!border-error-300',!!msg))}
function req(list){let first=null;list.forEach(([id,ok,msg])=>{setErr(id,ok?'':msg);if(!ok&&!first)first=id});
  if(first){const el=document.querySelector(`[data-f="${first}"]`)||$(first);el&&el.scrollIntoView({block:'center',behavior:'smooth'})}return !first}
function upload(id,label,{opt}={}){return `<div class="f" data-ui-component="File upload" data-f="${id}" data-up="${id}"><label class="!text-md !leading-6 !font-semibold !text-gray-600 !mb-2">${esc(label)}${opt?' <small class="!text-md !font-normal !text-gray-400">(ถ้ามี)</small>':''}</label>
  <label class="fu"><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png"><span class="ficon sm gray"><span class="ms">cloud_upload</span></span>
  <span class="fu-tx"><span><b>คลิกเพื่ออัปโหลด</b> หรือลากและวาง</span><small>PDF, PNG, or JPG (สูงสุด 10 ไฟล์)<span class="fu-count hidden"></span></small></span></label>
  <div class="help hidden"></div><div class="fu-list"></div></div>`}
function bindUploads(map){document.querySelectorAll('[data-up]').forEach(el=>{const key=el.dataset.up;if(map[key])ohBindFiles(el,map[key],()=>setErr(key,''));});}
const roFiles=f=>ohReadOnlyFiles(f||[]);
function empty(icon,t,s,btn){return `<div class="filter-empty !border-0 !rounded-none !bg-white !min-h-[360px] !py-10 !gap-6" data-ui-component="Empty state/Data empty"><span class="ms">${icon}</span><b class="!text-[length:calc(var(--fs-text-xs)*2)] !text-black">${esc(t)}</b>${s?`<span class="!text-md !text-gray-600">${esc(s)}</span>`:''}${btn||''}</div>`}
function footBar(left,right){return `<div data-page-actions class="flex items-center justify-between gap-3 !m-0 !p-0">${left||'<span></span>'}<div class="flex items-center gap-3">${right||''}</div></div>`}
function pager(page,pages,total,per,attr){return `<div class="tblfoot"><div class="tf-left"><span>แสดง ${total?(page-1)*per+1:0} ถึง ${Math.min(page*per,total)} จาก ${total} รายการ</span></div><div class="pager">
  <button class="pg" type="button" ${attr}="${page-1}"${page<=1?' disabled':''} aria-label="หน้าก่อนหน้า"><span class="ms">chevron_left</span></button>`+
  Array.from({length:pages},(_,i)=>`<button class="pg${i+1===page?' on':''}" type="button" ${attr}="${i+1}">${i+1}</button>`).join('')+
  `<button class="pg" type="button" ${attr}="${page+1}"${page>=pages?' disabled':''} aria-label="หน้าถัดไป"><span class="ms">chevron_right</span></button></div></div>`}
function modal(id,size,title,sub,body,foot){$('modals').insertAdjacentHTML('beforeend',`<div class="modal-overlay hidden" id="${id}"><div class="modal ${size} [&>.modal-hd]:after:!hidden [&>.modal-ft]:before:!hidden [&>.modal-ft]:!pt-6" role="dialog" aria-modal="true" aria-labelledby="${id}-t">
  <div class="modal-hd left"><div class="modal-hd-c"><div class="flex-1 min-w-0"><h2 id="${id}-t">${esc(title)}</h2><div class="modal-sub" id="${id}-s">${esc(sub||'')}</div></div>
  <button class="modal-x" type="button" data-close="${id}" aria-label="ปิด"><span class="ms">close</span></button></div></div>
  <div class="modal-bd" id="${id}-b">${body}</div><div class="modal-ft"><div class="modal-ft-a">${foot}</div></div></div></div>`)}
function confirmBox(title,sub,okText,onOk,danger){$('modals').innerHTML='';$('modals').insertAdjacentHTML('beforeend',`<div class="modal-overlay hidden" id="m-cf"><div class="modal md [&>.modal-hd]:after:!hidden [&>.modal-ft]:before:!hidden [&>.modal-ft]:!pt-6" role="dialog" aria-modal="true">
  <div class="modal-hd center"><div class="modal-hd-c"><span class="ficon${danger?' err':''}"><span class="ms">${danger?'delete':'info'}</span></span><h2>${esc(title)}</h2><div class="modal-sub">${esc(sub)}</div></div>
  <button class="modal-x" type="button" data-close="m-cf" aria-label="ปิด"><span class="ms">close</span></button></div>
  <div class="modal-ft"><div class="modal-ft-a fill"><div class="modal-ft-r"><button class="btn btn-s" type="button" data-close="m-cf">ยกเลิก</button><button class="btn ${danger?'btn-d':'btn-p'}" type="button" id="m-cf-ok">${esc(okText)}</button></div></div></div></div></div>`);
  $('m-cf-ok').onclick=()=>{oh2Modal('m-cf',false);onOk()};oh2Modal('m-cf',true)}
const toast=(t,o)=>oh2Notify(t,o||{});
const go=h=>{location.hash=h};

/* ---------- สถานะ ---------- */
const PLAN_ST={pending_approval:['รอเลข Purchase order','b-neutral'],in_progress:['รอดำเนินการ','b-info'],done:['เสร็จสิ้น','b-ok']};
const planStatus=p=>p.pos.length?(p.pos.every(o=>o.cars.every(c=>jobOf(o.id,c).stage>=9))?'done':'in_progress'):'pending_approval';
function jobStatus(j){
  if(j.stage===1)return j.appt&&j.appt.state==='pending'?['รอหน่วยงานตอบรับเข้าอู่','b-low']:['รอนัดหมายเข้าอู่','b-neutral'];
  if(j.stage===2)return ['รอตรวจรับรถ','b-low'];if(j.stage===3)return ['กำลังซ่อม','b-info'];if(j.stage===4)return ['รอตรวจสภาพ','b-low'];
  if(j.stage===5)return j.pickup&&j.pickup.state==='rejected'?['หน่วยงานปฏิเสธนัดรับรถ','b-out']:j.pickup&&j.pickup.state==='pending'?['รอหน่วยงานตอบรับรับรถ','b-low']:['รอนัดหมายรับรถ','b-neutral'];
  if(j.stage===6)return ['รอปิดงาน','b-brand'];if(j.stage===7)return ['รอส่งอนุมัติปิดงาน','b-brand'];if(j.stage===8)return ['รอผู้บังคับบัญชาอนุมัติ','b-brand'];return ['ปิดงานแล้ว','b-ok']}
const badge=([t,c])=>`<span class="badge ${c}">${esc(t)}</span>`;
const jobPct=j=>{if(j.stage>=9)return 100;const pct=j.logs?.length?j.logs[j.logs.length-1].pct:null;return typeof pct==='number'&&Number.isFinite(pct)&&pct>=0&&pct<=100?pct:null;};

/* ================= A รายการแผน + รถที่ Overhaul (UAT overhaul-utility-vehicle + A.5) ================= */
const LS={basis:'estimate',tab:'plans',q:{plans:'',cars:''},page:1,per:10,sort:null,dir:1,F:{plans:{year:'',budget:[],status:[]},cars:{year:'',plan:'',brand:'',model:'',type:'',progress:''}}};
// Labels from figma-export/overhaul2-plugin/reference-A2-filter.md and FILTER_BUDGET_LABELS.
// Keep the existing currency-range comparisons; these captions use the original UAT wording.
const BUDGET_R=[[0,999999.99,'น้อยกว่า 1,000,000.00'],[1000000,5000000,'มากกว่า 1,000,000.00 - 5,000,000.00'],[5000000.01,10000000,'มากกว่า 5,000,000.00 - 10,000,000.00'],
  [10000000.01,15000000,'มากกว่า 10,000,000.00 - 15,000,000.00'],[15000000.01,20000000,'มากกว่า 15,000,000.00 - 20,000,000.00'],[20000000.01,Infinity,'มากกว่า 20,000,000.00']];
const STATUS_F=[['pending_approval','รอเลข Purchase order'],['in_progress','รอดำเนินการ'],['done','เสร็จสิ้น']];
const subOf=p=>p.costCenter||p.wbs||p.pmOrder||p.remark||'';
function planRows(){const q=LS.q.plans.toLowerCase(),F=LS.F.plans;
  let r=S.plans.filter(p=>(!q||[p.id,p.name,p.costType,subOf(p)].join(' ').toLowerCase().includes(q))&&(!F.year||String(p.year)===F.year)
    &&(!F.status.length||F.status.includes(planStatus(p)))&&(!F.budget.length||F.budget.some(i=>p.budget>=BUDGET_R[i][0]&&p.budget<=BUDGET_R[i][1])));
  if(LS.sort)r=r.slice().sort((a,b)=>LS.dir*(LS.sort==='budget'?a.budget-b.budget:String(a[LS.sort]).localeCompare(String(b[LS.sort]),'th')));return r}
/* รถที่ Overhaul = รถทุกคันที่อยู่ใน PO ของทุกแผน (ไม่ซ้ำ) · ความคืบหน้า = รายการติดตามล่าสุด */
function carRows(){return ohReportRows();}
const PAL=['var(--brand-900)','var(--info-600)','var(--success-600)','var(--brand-600)','var(--gray-400)'];
function dashboard(R){return ohDashboard(R);}
const carRowsAll=()=>{const s=new Set();S.plans.forEach(p=>p.pos.forEach(o=>o.cars.forEach(c=>s.add(c))));return [...s].map(veh)};
function pageList(){const T=LS.tab,F=LS.F[T];
  const chips=T==='plans'?[...(F.year?[['year',F.year,'ปีงบประมาณ '+F.year]]:[]),...F.budget.map(i=>['budget',i,BUDGET_R[i][2]]),...F.status.map(s=>['status',s,STATUS_F.find(x=>x[0]===s)[1]])]
    :Object.keys(F).filter(k=>k!=='year'&&F[k]).map(k=>[k,F[k],k==='year'?'ปีงบประมาณ '+F[k]:k==='plan'?F[k]:(k==='progress'?ohProgressLabel(F[k]):F[k])]);
  const top=crumbs([['จัดการงาน Overhaul']])+head('จัดการงาน Overhaul')+
    `<div class="tabs" role="tablist"><button class="tab-btn${T==='plans'?' on':''}" role="tab" aria-selected="${T==='plans'}" data-tab="plans" type="button">แผน Overhaul</button><button class="tab-btn${T==='cars'?' on':''}" role="tab" aria-selected="${T==='cars'}" data-tab="cars" type="button">รถที่ Overhaul</button></div>`;
  const toolbar=`<div class="list-toolbar split !mb-0"><div class="lt-search !basis-[360px]"><div class="search"><span class="ms">search</span><input id="l-q" type="search" value="${esc(LS.q[T])}" placeholder="${T==='plans'?'ค้นหาหมายเลขแผน, ชื่อแผน, ประเภทงบประมาณ':'ค้นหาทะเบียน, ยี่ห้อ/รุ่น'}"></div></div>
     <div class="lt-actions">${T==='cars'?`<div class="flex items-center gap-2"><label for="oh-year" class="text-sm text-gray-600 whitespace-nowrap">ปีงบประมาณ</label><select id="oh-year" class="select-inline" aria-label="ปีงบประมาณ"><option value="">ทุกปีงบประมาณ</option>${ohYears().map(y=>`<option value="${y}"${F.year===y?' selected':''}>${y}</option>`).join('')}</select></div>`:''}<button class="btn btn-s" type="button" id="l-fb"><span class="ms">filter_list</span>ตัวกรอง${chips.length?`<span class="badge b-brand">${chips.length}</span>`:''}</button>${T==='plans'?'<a class="btn btn-p !no-underline" href="#/plan/new"><span class="ms">add</span>สร้างแผน Overhaul</a>':''}</div></div>`+
    (chips.length?`<div class="fchips mb-4">${chips.map(([k,v,t])=>`<span class="fchip">${esc(t)}<button class="fchip-x" type="button" data-lrm="${k}" data-v="${esc(v)}" aria-label="เอาตัวกรองออก"><span class="ms">close_small</span></button></span>`).join('')}</div>`:'');
  const clear=`<button class="btn btn-s btn-sm mt-2" type="button" id="l-clr">ล้างคำค้นและตัวกรอง</button>`;
  if(T==='cars'){const R=carRows();
    return top+toolbar+dashboard(R)+`<div class="flex items-center gap-3"><h2 class="text-md font-semibold" id="oh-car-table" data-ui-component="Section label">รถที่ Overhaul (${R.length})</h2><span class="ml-auto text-xs text-gray-500">หน่วยเงิน: บาท</span></div>`+
    (R.length?`<div class="tblwrap"><table class="tbl striped" id="oh-cars-table"><thead><tr><th>ทะเบียน</th><th>ข้อมูลรถ</th><th class="num">ราคากลาง</th><th class="num">ประเมิน Overhaul (บาท)</th><th class="num">ราคาจริง (บาท)</th><th class="num">อายุการใช้งาน</th><th>ความคืบหน้า</th><th class="w-[56px]"></th></tr></thead><tbody>`+
      R.map(r=>`<tr><td data-ui-style="Lead text"><div class="cell-key whitespace-nowrap">${esc(r.v.plate)}</div></td><td data-ui-style="Text"><div>${esc(r.v.model)}</div><div class="cell-sub whitespace-nowrap">${esc(r.v.type)} · ${esc(r.v.dept)}</div></td><td class="num" data-oh-money="reference">${money(r.ref)}</td><td class="num" data-oh-money="estimate">${money(r.oh)}</td><td class="num" data-oh-money="actual" title="${r.acquisition==null?'ยังไม่มีข้อมูลราคาที่ได้รถมา':'ราคาที่ได้รถมา · ข้อมูลตัวอย่างจากทะเบียนรถ'}">${money(r.acquisition)}</td><td class="num whitespace-nowrap">${ageText(r.v.ageM)}</td><td data-ui-style="Lead Progress Bar">${ohProgressBar(r.pct)}</td>
      <td data-ui-style="Action icons"><div class="dt-action"><a class="btn btn-t btn-icon !no-underline" href="#/vehicle/${r.v.id}" aria-label="ดูรายละเอียด ${esc(r.v.plate)}"><span class="ms">chevron_right</span></a></div></td></tr>`).join('')+`</tbody></table>${pager(1,1,R.length,R.length||1,'data-lp')}</div>`
      :empty('search_off','ไม่พบรถตามตัวกรอง','เปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูข้อมูลรถ',clear))+drawer()}
  const rows=planRows(),pages=Math.max(1,Math.ceil(rows.length/LS.per));LS.page=Math.min(LS.page,pages);
  const prog=p=>ohPlanProgress(p);
  const th=(k,t,cls='')=>`<th class="sortable${LS.sort===k?' on':''} ${cls}"><button type="button" data-sort="${k}">${t}<span class="ms">${LS.sort!==k?'swap_vert':LS.dir>0?'arrow_upward':'arrow_downward'}</span></button></th>`;
  return top+toolbar+(rows.length?`<div class="tblwrap"><table class="tbl striped" id="oh-plans-table"><thead><tr>${th('id','หมายเลขแผน')}${th('name','ชื่อแผน')}${th('costType','ประเภทงบประมาณ')}<th>ปีงบประมาณ</th>${th('budget','งบประมาณ (บาท)','num')}<th class="num">ราคาประเมิน Overhaul (บาท)</th><th>ความคืบหน้า</th><th>สถานะ</th><th>วันที่สร้าง</th><th class="w-[56px]"></th></tr></thead><tbody>`+
    rows.slice((LS.page-1)*LS.per,LS.page*LS.per).map(p=>`<tr><td>${esc(p.id)}</td><td><div class="max-w-[220px] truncate" title="${esc(p.name)}">${esc(p.name)}</div></td><td><div class="max-w-[200px] truncate" title="${esc(p.costType)}">${esc(p.costType)}</div>${subOf(p)?`<div class="cell-sub max-w-[200px] truncate" title="${esc(subOf(p))}">${esc(subOf(p))}</div>`:''}</td>
      <td>${p.year}</td><td class="num">${money(p.budget)}</td><td class="num" data-plan-estimate="${p.id}">${money(ohPlanEstimate(p))}</td><td data-plan-progress="${p.id}">${prog(p)}</td><td>${badge(PLAN_ST[planStatus(p)])}</td><td>${dmy(p.created)}</td>
      <td>${oh2Menu('จัดการแผน '+p.id,[{href:`#/plan/${p.id}`,icon:'visibility',label:'ดูรายละเอียด'},{href:`#/plan/${p.id}/edit`,icon:'edit',label:'แก้ไข'},{attr:`data-ldel="${p.id}"`,icon:'delete',label:'ลบ'}])}</td></tr>`).join('')+
    `</tbody></table><div class="tblfoot"><div class="tf-left"><span>แสดง ${(LS.page-1)*LS.per+1} ถึง ${Math.min(LS.page*LS.per,rows.length)} จาก ${rows.length} รายการ</span><select class="select-inline" id="l-per" aria-label="จำนวนแถวต่อหน้า">${[10,25,50].map(n=>`<option${n===LS.per?' selected':''}>${n}</option>`).join('')}</select></div>`+
    `<div class="pager"><button class="pg" type="button" data-lp="${LS.page-1}"${LS.page<=1?' disabled':''} aria-label="หน้าก่อนหน้า"><span class="ms">chevron_left</span></button>${Array.from({length:pages},(_,i)=>`<button class="pg${i+1===LS.page?' on':''}" type="button" data-lp="${i+1}">${i+1}</button>`).join('')}<button class="pg" type="button" data-lp="${LS.page+1}"${LS.page>=pages?' disabled':''} aria-label="หน้าถัดไป"><span class="ms">chevron_right</span></button></div></div></div>`
    :S.plans.length?empty('search_off','ไม่พบแผน Overhaul','ไม่มีแผนที่ตรงกับคำค้นหรือตัวกรอง',clear):empty('inventory_2','ยังไม่มีแผน Overhaul','สร้างแผนเพื่อเริ่มเพิ่ม Purchase Order และติดตามงานรายคัน','<a class="btn btn-p btn-sm mt-2 !no-underline" href="#/plan/new"><span class="ms">add</span>สร้างแผน Overhaul</a>'))+drawer()}
/* ตัวกรอง = Side panel (Filter_Panel ไลบรารี 1964:13912) · draft จนกดตกลง */
function drawer(){const T=LS.tab,F=LS.F[T];
  const body=T==='plans'?`<div class="filter-field"><label for="d-year">ปีงบประมาณ</label><select id="d-year"><option value="">ทั้งหมด</option>${[...new Set(S.plans.map(p=>String(p.year)))].sort().map(y=>`<option${F.year===y?' selected':''}>${y}</option>`).join('')}</select></div>
    <div class="filter-field"><label>งบประมาณ (บาท)</label><div class="filter-checks">${BUDGET_R.map((b,i)=>`<label><input type="checkbox" name="d-bg" value="${i}"${F.budget.includes(i)?' checked':''}>${b[2]}</label>`).join('')}</div></div>
    <div class="filter-field"><label>สถานะ</label><div class="filter-checks">${STATUS_F.map(([k,t])=>`<label><input type="checkbox" name="d-st" value="${k}"${F.status.includes(k)?' checked':''}>${badge([t,PLAN_ST[k][1]])}</label>`).join('')}</div></div>`
    :`<div class="filter-field"><label for="d-car-plan">แผน Overhaul</label>${sel('d-car-plan',F.plan,[['','ทุกแผน'],...S.plans.map(p=>[p.id,p.id+' · '+p.name])])}</div>`+['brand','model','type'].map(k=>`<div class="filter-field"><label for="d-${k}">${{brand:'ยี่ห้อ',model:'รุ่น',type:'ประเภทรถ'}[k]}</label><select id="d-${k}"><option value="">ทั้งหมด</option>${[...new Set(carRowsAll().map(v=>v[k]))].sort().map(x=>`<option${F[k]===x?' selected':''}>${esc(x)}</option>`).join('')}</select></div>`).join('');
  return `<div class="filter-panel filter-drawer" id="l-dr"><div class="filter-drawer-sheet" role="dialog" aria-modal="true" aria-labelledby="l-dr-t"><div class="filter-drawer-head"><span class="filter-drawer-icon"><span class="ms">filter_list</span></span>
    <div class="filter-drawer-title"><h2 id="l-dr-t">ตัวกรอง</h2><p>กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ</p></div><button type="button" class="filter-drawer-close" data-drx aria-label="ปิดตัวกรอง"><span class="ms">close</span></button></div>
    <div class="filter-drawer-body">${body}</div><div class="filter-drawer-foot"><button class="btn btn-link" type="button" id="d-clr">ล้างตัวกรอง</button><button class="btn btn-s" type="button" data-drx>ยกเลิก</button><button class="btn btn-p" type="button" id="d-ok">ตกลง</button></div></div></div>`}
function bindList(){const T=LS.tab;
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{LS.tab=b.dataset.tab;LS.page=1;const hash=LS.tab==='cars'?'#/cars':'#/';if(location.hash!==hash)go(hash);else render()});
  $('l-q').addEventListener('input',e=>{LS.q[T]=e.target.value;LS.page=1;render();const i=$('l-q');i.focus();i.setSelectionRange(i.value.length,i.value.length)});
  document.querySelectorAll('[data-lp]').forEach(b=>b.onclick=()=>{if(!b.disabled){LS.page=+b.dataset.lp;render()}});
  if($('l-per'))$('l-per').onchange=()=>{LS.per=+$('l-per').value;LS.page=1;render()};
  document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{const k=b.dataset.sort;LS.dir=LS.sort===k?-LS.dir:1;LS.sort=k;render()});
  const dr=o=>{$('l-dr').classList.toggle('open',o);document.body.classList.toggle('modal-open',o)};
  $('l-fb').onclick=()=>dr(true);document.querySelectorAll('[data-drx]').forEach(b=>b.onclick=()=>{dr(false);render()});$('l-dr').onclick=e=>{if(e.target===$('l-dr')){dr(false);render()}};
  $('d-clr').onclick=()=>{document.querySelectorAll('#l-dr select').forEach(s=>s.value='');document.querySelectorAll('#l-dr input').forEach(c=>c.checked=false);};
  $('d-ok').onclick=()=>{LS.F[T]=T==='plans'?{year:$('d-year').value,budget:[...document.querySelectorAll('[name=d-bg]:checked')].map(c=>+c.value),status:[...document.querySelectorAll('[name=d-st]:checked')].map(c=>c.value)}
    :{...LS.F.cars,brand:$('d-brand').value,model:$('d-model').value,type:$('d-type').value,plan:$('d-car-plan').value};LS.page=1;document.body.classList.remove('modal-open');render()};
  document.querySelectorAll('[data-lrm]').forEach(b=>b.onclick=()=>{const k=b.dataset.lrm,F=LS.F[T];if(Array.isArray(F[k]))F[k]=F[k].filter(x=>String(x)!==b.dataset.v);else F[k]='';LS.page=1;render()});
  if($('l-clr'))$('l-clr').onclick=()=>{LS.q[T]='';LS.F[T]=T==='plans'?{year:'',budget:[],status:[]}:{year:'',plan:'',brand:'',model:'',type:'',progress:''};render()};
  if(T==='cars')bindOhDashboard();
  document.querySelectorAll('[data-ldel]').forEach(b=>b.onclick=()=>delPlan(b.dataset.ldel,'#/'));
}
/* ยืนยันการลบแผน — ข้อความตาม UAT */
function delPlan(id,after){confirmBox('ยืนยันการลบแผน','เมื่อลบแผนแล้ว Purchase order และรถทั้งหมดในแผนนี้จะถูกลบไปด้วย และไม่สามารถกู้คืนได้ ต้องการยืนยันลบแผนนี้ต่อใช่หรือไม่','ยืนยัน',()=>{
  const p=planOf(id);p.pos.forEach(o=>o.cars.forEach(c=>delete S.jobs[o.id+':'+c]));S.plans=S.plans.filter(x=>x.id!==id);save();if(location.hash===after)render();else go(after);toast('ลบแผน Overhaul สำเร็จ')},true)}
function delPo(id){const [p,o]=poOf(id);confirmBox('ยืนยันการลบ Purchase Order',`เมื่อลบ ${o.id} แล้ว ข้อมูลงานของรถใน Purchase Order นี้จะถูกลบไปด้วย และไม่สามารถกู้คืนได้ ต้องการยืนยันลบใช่หรือไม่`,'ยืนยัน',()=>{
  o.cars.forEach(c=>delete S.jobs[o.id+':'+c]);p.pos=p.pos.filter(x=>x.id!==id);save();go(`#/plan/${p.id}`);render();toast('ลบ Purchase Order สำเร็จ')},true)}

/* ================= สรุปรายคัน + ประวัติ (S19) ================= */
const REPAIRS={c4:[['RRZ6900031','2026-06-12','เบรกหน้าดังขณะเบรก','ผ้าเบรกหน้า # 5-87611-047-0','กบค. (ซ่อมเอง)',null,179880],['RRZ6900012','2026-02-03','แอร์ไม่เย็น','น้ำยาแอร์ R134a','อู่เพ็ญยนต์',null,171230]],
  c7:[['RRZ6900022','2026-04-18','สตาร์ทไม่ติดตอนเช้า','แบตเตอรี่ 12V 100Ah # 1-81200-345-0','กบค. (ซ่อมเอง)',null,409540]],
  c8:[['RRZ6900027','2026-05-09','บูมยกช้า มีน้ำมันซึม','ชุดซีลกระบอกไฮดรอลิกบูม # HY-SEAL-63','กบค. (ซ่อมเอง)',2140,141210],['RRZ6900008','2025-12-15','ไฟวับวาบหลังคาไม่ติด','ชุดไฟวับวาบ LED','อู่เพ็ญยนต์',1980,137560]]};
function pageVehicle(id){const v=veh(id);if(!v)return empty('search_off','ไม่พบยานพาหนะ','');
  const hist=[];S.plans.forEach(p=>p.pos.forEach(o=>{if(o.cars.includes(id)){const j=jobOf(o.id,id);hist.push({p,o,j})}}));
  const pc=(hist[0]&&hist[0].p.cars.find(c=>c.id===id))||{};const R=REPAIRS[id]||[];
  return crumbs([['จัดการงาน Overhaul','#/'],['รถที่ Overhaul','#/cars'],[v.plate]])+head(v.plate,{back:'#/'})+
  sect('ข้อมูลยานพาหนะ')+info([['ทะเบียน',esc(v.plate)],['ยี่ห้อ',esc(v.brand)],['รุ่น',esc(v.model)],['ประเภทรถ',esc(v.type)],['สังกัด',esc(v.dept)],['อายุการใช้งาน',ageText(v.ageM)],['ราคากลาง (บาท)',money(pc.refPrice)],['ราคาประเมิน Overhaul (บาท)',money(pc.ohPrice)],['ราคาจริง (บาท)',money(v.acq)]],3)+
  ohVehicleFinance(id)+sect('งาน Overhaul',null,hist.length)+(hist.length?`<div class="tblwrap mb-10"><table class="tbl striped"><thead><tr><th>หมายเลขแผน</th><th>Purchase Order</th><th>ศูนย์บริการ/อู่</th><th>ระยะสัญญา</th><th>ความคืบหน้า</th><th>สถานะ</th><th class="w-[56px]"></th></tr></thead><tbody>`+
    hist.map(({p,o,j})=>`<tr><td>${esc(p.id)}</td><td>${esc(o.id)}<div class="cell-sub">${esc(o.name)}</div></td><td>${esc(vendor(o.vendor).name)}</td><td>${dmy(o.from)} - ${dmy(o.to)}</td><td>${ohProgressBar(jobPct(j))}</td><td>${badge(jobStatus(j))}</td>
      <td><a class="btn btn-t btn-icon !no-underline" href="#/job/${o.id}/${id}" aria-label="ดูงาน"><span class="ms">chevron_right</span></a></td></tr>`).join('')+`</tbody></table></div>`:`<div class="mb-10">${empty('construction','ยังไม่มีงาน Overhaul','')}</div>`)+
  sect('ประวัติการซ่อม',null,R.length)+(R.length?`<div class="tblwrap"><table class="tbl striped"><thead><tr><th>หมายเลขเหตุการณ์</th><th>วันที่แจ้ง</th><th>อาการเสีย</th><th>อะไหล่ที่ใช้</th><th>ผู้ซ่อม</th><th class="num">ชั่วโมงใช้งาน</th><th class="num">เลขไมล์ (กม.)</th></tr></thead><tbody>`+
    R.map(r=>`<tr><td>${r[0]}</td><td>${dmy(r[1])}</td><td>${esc(r[2])}</td><td>${esc(r[3])}</td><td>${esc(r[4])}</td><td class="num">${r[5]==null?'-':r[5].toLocaleString('en-US')}</td><td class="num">${r[6].toLocaleString('en-US')}</td></tr>`).join('')+`</tbody></table></div>`
    :empty('history','ยังไม่มีประวัติการซ่อม','เมื่อมีการแจ้งซ่อมรถคันนี้ ประวัติจะแสดงที่นี่'));
}

/* ================= B.1 สร้าง/แก้ไขแผน ================= */
let PF=null;
/* B.1 ตามบล็อก B ที่เจ้าของงานเคาะ (component-rules §4.2.1 · 22 ต.ค. 2569) + ประเภทงบประมาณ (R18 · 29 ต.ค. 2569):
   แถว 1 ชื่อแผน | ประจำปีงบประมาณ · แถว 2 วงเงินอนุมัติ (บาท) | ประเภทงบประมาณ · แถว 3 (ครึ่งขวา) ช่องตามประเภท ไม่บังคับ
   บังคับ: ชื่อแผน · ปีงบ · วงเงิน · ประเภทงบ · เอกสารไม่บังคับ · ปุ่ม ย้อนกลับ/บันทึก (แก้ไข = ยกเลิก/บันทึก) */
const OWN_CC='A301010000 กบห.ฝวบ.-บริหาร';
function typeFields(f){const t=f.costType;
  if(t==='งบทำการ หน่วยงานต้นสังกัด')return [fld('p-cc','ศูนย์ต้นทุน',inp('p-cc',OWN_CC,'','text','readonly'),{icon:'account_balance'})];
  if(t==='งบทำการ หน่วยงานอื่น')return [fld('p-cc','ศูนย์ต้นทุน',sel('p-cc',f.costCenter,PX_COST_CENTERS.filter(x=>x!==OWN_CC),'เลือกศูนย์ต้นทุน'),{opt:true,icon:'account_balance'})];
  if(t==='งบลงทุน งานก่อสร้าง')return [fld('p-wbs','เลข WBS',inp('p-wbs',f.wbs,'ระบุเลข WBS'),{opt:true}),fld('p-net','เลขโครงข่าย',inp('p-net',f.net,'ระบุเลขโครงข่าย'),{opt:true}),fld('p-act','เลขกิจกรรม',inp('p-act',f.act,'ระบุเลขกิจกรรม'),{opt:true})];
  if(t==='งานบำรุงรักษา')return [fld('p-pm','เลขที่ใบสั่ง',inp('p-pm',f.pmOrder,'ระบุเลขที่ใบสั่ง'),{opt:true})];
  if(t.startsWith('อื่น'))return [fld('p-rm','หมายเหตุ',inp('p-rm',f.remark,'ระบุหมายเหตุ'),{opt:true})];
  return []}
const COLN={1:'grid-cols-1',2:'grid-cols-1 md:grid-cols-2',3:'grid-cols-1 md:grid-cols-3'};
function pagePlanForm(id){
  const p=id?planOf(id):null;
  if(!PF||PF.id!==(id||'new')){PF={id:id||'new',f:p?{name:p.name,year:String(p.year),costType:p.costType,costCenter:p.costCenter,wbs:p.wbs,net:p.net||'',act:p.act||'',pmOrder:p.pmOrder,remark:p.remark,budget:p.budget}
    :{name:'',year:'',costType:'',costCenter:'',wbs:'',net:'',act:'',pmOrder:'',remark:'',budget:''},cars:p?JSON.parse(JSON.stringify(p.cars)):[],docs:p&&p.docs?JSON.parse(JSON.stringify(p.docs)):{approve:[],budget:[],other:[]},err:false};PF.start=JSON.stringify([PF.f,PF.cars,PF.docs])}
  const f=PF.f,t=p?`แก้ไขแผน ${p.id}`:'สร้างแผน Overhaul';
  const dep=typeFields(f);
  const miss=c=>c.refPrice===''||c.refPrice==null||c.ohPrice===''||c.ohPrice==null;
  const pc=(c,k)=>c[k]===''||c[k]==null?(PF.err?'<span class="badge b-low">ยังไม่ระบุ</span>':'-'):money(c[k]);
  const nMiss=PF.err?PF.cars.filter(miss).length:0;
  return crumbs([['จัดการงาน Overhaul','#/'],[t]])+`<div class="flex items-center gap-3 !m-0" data-page-heading data-ui-component="Page header"><button class="btn btn-t btn-icon" type="button" id="pf-back" aria-label="ย้อนกลับ"><span class="ms">chevron_left</span></button><h1 class="page-title !m-0">${esc(t)}</h1></div>`+
  `<div class="flex flex-col gap-8">`+
  `<section>${sect('ข้อมูลแผน')}<div class="flex flex-col gap-6">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">${fld('p-name','ชื่อแผน',inp('p-name',f.name,'ระบุชื่อแผน'))}${fld('p-year','ประจำปีงบประมาณ',sel('p-year',f.year,['2569','2570','2571','2572','2573'],'เลือกปีงบประมาณ'))}</div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">${fld('p-bg','วงเงินอนุมัติ (บาท)',inp('p-bg',f.budget===''?'':money(f.budget),'ระบุวงเงินอนุมัติ','text','inputmode="decimal"'))}${fld('p-ct','ประเภทงบประมาณ',sel('p-ct',f.costType,PX_COST_TYPES,'เลือกประเภทงบประมาณ'),{icon:'paid'})}</div>
    ${dep.length?`<div class="grid grid-cols-1 md:grid-cols-2 gap-6"><div class="max-md:hidden"></div><div class="grid ${COLN[dep.length]} gap-6">${dep.join('')}</div></div>`:''}</div></section>`+
  `<section>${sect('เลือกรถที่จะเข้า Overhaul',PF.cars.length?ohAddVehicleButton():'',PF.cars.length)}`+
  (nMiss?`<div class="note note-warn"><span class="ms">warning</span><span>กรุณาระบุราคากลางและราคาประเมิน Overhaul ให้ครบทุกคัน (ยังไม่ระบุ ${nMiss} คัน)</span></div>`:'')+ohPoVehicleSelection({cars:PF.cars})+`</section>`+
  `<section>${sect('เอกสาร')}<div class="flex flex-col gap-6">${upload('approve','หนังสืออนุมัติหลักการ')}${upload('budget','เอกสารอนุมัติงบ')}${upload('other','เอกสารอื่น ๆ',{opt:true})}</div></section>`+
  `<div data-page-actions class="flex items-center justify-between gap-3"><button class="btn btn-s btn-lg" type="button" id="pf-cancel">${p?'ยกเลิก':'ย้อนกลับ'}</button><button class="btn btn-p btn-lg" type="button" id="pf-save">บันทึก</button></div></div>`;
}
function readPF(){const f=PF.f,g=i=>$(i)?$(i).value:undefined;
  f.name=g('p-name');f.year=g('p-year')||'';f.costType=g('p-ct')||'';f.budget=num(g('p-bg'));
  if($('p-cc'))f.costCenter=$('p-cc').readOnly?OWN_CC:(g('p-cc')||'');['wbs','net','act'].forEach(k=>{if($('p-'+k))f[k]=g('p-'+k)});if($('p-pm'))f.pmOrder=g('p-pm');if($('p-rm'))f.remark=g('p-rm')}
function bindPlanForm(id){
  const p=id?planOf(id):null;bindUploads(PF.docs);const back=p?`#/plan/${p.id}`:'#/';
  $('p-ct').onchange=()=>{readPF();render()};
  $('p-bg').onblur=()=>{const n=num($('p-bg').value);$('p-bg').value=n===''?'':money(n)};
  ['p-name','p-year','p-bg','p-ct'].forEach(i=>$(i).addEventListener('input',()=>setErr(i,'')));
  const leave=()=>{readPF();if(JSON.stringify([PF.f,PF.cars,PF.docs])===PF.start){PF=null;go(back);return}
    confirmBox('ยืนยันการออก','ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก ต้องการออกจากหน้านี้ใช่หรือไม่','ยืนยัน',()=>{PF=null;go(back)})};
  $('pf-back').onclick=leave;$('pf-cancel').onclick=leave;
  ohBindPoVehicleSelection({cars:PF.cars},readPF);
  $('pf-save').onclick=()=>{readPF();const f=PF.f;PF.err=true;
    const okCars=!PF.cars.some(c=>c.refPrice===''||c.refPrice==null||c.ohPrice===''||c.ohPrice==null);
    render();
    const ok=req([['p-name',f.name.trim(),'กรุณาระบุชื่อแผน'],['p-year',f.year,'กรุณาเลือกปีงบประมาณ'],['p-bg',f.budget!==''&&f.budget>0,'กรุณาระบุวงเงินอนุมัติ'],['p-ct',f.costType,'กรุณาเลือกประเภทงบประมาณ']]);
    if(!ok)return;if(!okCars){document.querySelector('.note-warn').scrollIntoView({block:'center',behavior:'smooth'});return}
    const T=f.costType;
    const data={name:f.name.trim(),year:+f.year,costType:T,costCenter:T.startsWith('งบทำการ')?f.costCenter:'',wbs:T==='งบลงทุน งานก่อสร้าง'?f.wbs:'',net:T==='งบลงทุน งานก่อสร้าง'?f.net:'',act:T==='งบลงทุน งานก่อสร้าง'?f.act:'',
      pmOrder:T==='งานบำรุงรักษา'?f.pmOrder:'',remark:T.startsWith('อื่น')?f.remark:'',budget:f.budget,cars:PF.cars,docs:PF.docs};
    if(p){confirmBox('ยืนยันการแก้ไขแผน',`บันทึกการเปลี่ยนแปลงของ ${p.id}`,'ยืนยัน',()=>{Object.assign(p,data);save();PF=null;go(`#/plan/${p.id}`);toast('บันทึกการแก้ไขแผนสำเร็จ')});return}
    const prefix='ORZ'+String(f.year).slice(-2);const nid=prefix+String(Math.max(0,...S.plans.filter(x=>x.id.startsWith(prefix)).map(x=>+x.id.slice(5)))+1).padStart(5,'0');
    S.plans.unshift(Object.assign({id:nid,localCreated:true,status:'pending_approval',created:PX_TODAY,pos:[]},data));save();PF=null;go('#/');toast('สร้างแผน Overhaul สำเร็จ');
  };
}
function priceModal(c,onSaved){const v=veh(c.id);$('modals').innerHTML='';
  modal('m-pr','md','แก้ไขข้อมูลรถในแผน',`${v.plate} · ${v.model}`,`<div class="flex flex-col gap-4">${fld('pr-ref','ราคากลาง (บาท)',inp('pr-ref',c.refPrice===''||c.refPrice==null?'':money(c.refPrice),'ระบุราคากลาง','text','inputmode="decimal"'))}${fld('pr-oh','ราคาประเมิน Overhaul (บาท)',inp('pr-oh',c.ohPrice===''||c.ohPrice==null?'':money(c.ohPrice),'ระบุราคาประเมิน Overhaul','text','inputmode="decimal"'))}${fld('pr-nt','หมายเหตุ',ta('pr-nt',c.note,'ระบุหมายเหตุ'),{opt:true})}</div>`,
    `<div class="modal-ft-r"><button class="btn btn-s" type="button" data-close="m-pr">ยกเลิก</button><button class="btn btn-p" type="button" id="pr-ok">บันทึก</button></div>`);
  ['pr-ref','pr-oh'].forEach(i=>$(i).onblur=()=>{const n=num($(i).value);$(i).value=n===''?'':money(n)});
  $('pr-ok').onclick=()=>{const a=num($('pr-ref').value),b=num($('pr-oh').value);
    if(!req([['pr-ref',a!=='','กรุณาระบุราคากลาง'],['pr-oh',b!=='','กรุณาระบุราคาประเมิน Overhaul']]))return;
    c.refPrice=a;c.ohPrice=b;c.priceSource='local-entry';c.priceSources={reference:'local-entry',estimate:'local-entry'};c.note=$('pr-nt').value.trim();oh2Modal('m-pr',false);if(onSaved)onSaved();render();toast(`บันทึกข้อมูล ${v.plate} สำเร็จ`)};
  oh2Modal('m-pr',true)}

/* ================= รายละเอียดแผน ================= */
function pagePlan(id){const p=planOf(id);if(!p)return crumbs([['จัดการงาน Overhaul','#/'],['ไม่พบแผน']])+empty('search_off','ไม่พบแผน Overhaul','');
  const sub=p.costCenter||p.wbs||p.pmOrder||p.remark;
  return crumbs([['จัดการงาน Overhaul','#/'],[p.id]])+head('หมายเลขแผน '+p.id,{back:'#/',badge:badge(PLAN_ST[planStatus(p)]),actions:`<button class="btn btn-ds" type="button" id="pd-del"><span class="ms">delete</span>ลบแผน</button><a class="btn btn-s !no-underline" href="#/plan/${p.id}/edit"><span class="ms">edit</span>แก้ไข</a>`})+
  sect('รายละเอียดแผน')+info([['ชื่อแผน',esc(p.name),2],['ประจำปีงบประมาณ',p.year],['วงเงินอนุมัติ (บาท)',money(p.budget)],['ประเภทงบประมาณ',esc(p.costType)],['วันที่สร้าง',dmy(p.created)],
    ...(p.costType.startsWith('งบทำการ')?[['ศูนย์ต้นทุน',esc(p.costCenter)]]:p.costType==='งบลงทุน งานก่อสร้าง'?[['เลข WBS',esc(p.wbs)],['เลขโครงข่าย',esc(p.net)],['เลขกิจกรรม',esc(p.act)]]:p.costType==='งานบำรุงรักษา'?[['เลขที่ใบสั่ง',esc(p.pmOrder)]]:[['หมายเหตุ',esc(p.remark)]])],3)+
  sect('เอกสาร')+`<div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"><div><div class="text-sm font-semibold mb-2">หนังสืออนุมัติหลักการ</div>${roFiles(p.docs&&p.docs.approve)}</div><div><div class="text-sm font-semibold mb-2">เอกสารอนุมัติงบ</div>${roFiles(p.docs&&p.docs.budget)}</div><div><div class="text-sm font-semibold mb-2">เอกสารอื่น ๆ</div>${roFiles(p.docs&&p.docs.other)}</div></div>`+
  sect('Purchase Order',p.pos.length?`<a class="btn btn-s !no-underline" href="#/po/new/${p.id}"><span class="ms">add</span>เพิ่ม Purchase Order</a>`:'',p.pos.length)+
  (p.pos.length?`<div class="tblwrap mb-10"><table class="tbl striped"><thead><tr><th>เลขที่ Purchase Order</th><th>ชื่อ Purchase Order</th><th>ศูนย์บริการ/อู่</th><th>ระยะสัญญา</th><th class="num">จำนวนรถ</th><th>ความคืบหน้า</th><th class="w-[56px]"></th></tr></thead><tbody>`+
    p.pos.map(o=>`<tr><td><a class="!no-underline text-gray-900" href="#/po/${o.id}">${esc(o.id)}</a></td><td>${esc(o.name)}</td><td>${esc(vendor(o.vendor).name)}</td><td>${dmy(o.from)} - ${dmy(o.to)}</td><td class="num">${o.cars.length}</td>
      <td>${ohProgressMarkup(o.cars.map(c=>jobPct(jobOf(o.id,c))))}</td><td>${oh2Menu('จัดการ '+o.id,[{href:`#/po/${o.id}`,icon:'visibility',label:'ดูรายละเอียด'},{href:`#/po/${o.id}/edit`,icon:'edit',label:'แก้ไข'},{attr:`data-podel="${o.id}"`,icon:'delete',label:'ลบ'}])}</td></tr>`).join('')+`</tbody></table></div>`
    :`<div class="mb-10">${empty('receipt_long','ยังไม่มี Purchase Order','เพิ่ม Purchase Order เพื่อส่งรถในแผนเข้าอู่',`<a class="btn btn-p btn-sm mt-2 !no-underline" href="#/po/new/${p.id}"><span class="ms">add</span>เพิ่ม Purchase Order</a>`)}</div>`)+
  ohPlanPartsSection(p);
}
/* Plan detail follows figma-export planDetail: used parts replace the vehicle table.
   One row per part/job; priced usage takes precedence over its warehouse withdrawal. */
function ohPlanPartsRows(p){
 const rows=[],jobs=new Set();
 p.pos.forEach(o=>o.cars.forEach(id=>{
  const key=o.id+':'+id;if(jobs.has(key))return;jobs.add(key);
  const j=S.jobs[key];if(!j)return;
  const priced=[...(j.parts?.body||[]).map(x=>({...x,kind:'อะไหล่ตัวรถ'})),...(j.parts?.tool||[]).map(x=>({...x,kind:'อะไหล่เครื่องมือกล'}))];
  const recorded=new Set(priced.filter(x=>String(x.code||'').trim()&&Number.isFinite(x.qty)&&x.qty>0).map(x=>x.code+'|'+x.unit));
  const used=[...priced,...(j.withdrawn||[]).filter(x=>!recorded.has(x.code+'|'+x.unit)).map(x=>({...x,qty:x.used,kind:'อะไหล่จากคลัง'}))];
  used.filter(x=>Number.isFinite(x.qty)&&x.qty>0).forEach(x=>rows.push({...x,po:o.id,vehicle:id,plate:veh(id)?.plate||id,price:ohValidMoney(x.price)?x.price:null}));
 }));return rows;
}
function ohPlanPartsSection(p){const rows=ohPlanPartsRows(p);
 return sect('อะไหล่ที่ใช้',null,rows.length)+(rows.length?`<p class="text-sm text-gray-500">รายการจากงาน Overhaul ในแผน · อะไหล่จากคลังแสดงจำนวนที่ใช้จริง · ยังไม่มีราคาแสดง —</p><div class="tblwrap"><table class="tbl striped" id="oh-plan-parts"><thead><tr><th>รหัสอะไหล่</th><th>ชื่ออะไหล่</th><th class="num">จำนวนที่ใช้</th><th>หน่วย</th><th class="num">ราคาต่อหน่วย (บาท)</th><th class="num">ราคารวม (บาท)</th><th>Purchase order</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.code)||'—'}</td><td>${esc(x.name)}<div class="cell-sub">${esc(x.kind)}</div></td><td class="num">${x.qty.toLocaleString('en-US')}</td><td>${esc(x.unit)}</td><td class="num">${money(x.price)}</td><td class="num">${money(x.price==null?null:x.qty*x.price)}</td><td><a class="cell-key !no-underline text-gray-900" href="#/job/${x.po}/${x.vehicle}">${esc(x.po)}</a><div class="cell-sub">${esc(x.plate)}</div></td></tr>`).join('')}</tbody></table></div>`:empty('inventory_2','ยังไม่มีรายการอะไหล่ที่ใช้','เมื่อบันทึกอะไหล่ที่ใช้ในงาน Overhaul รายการจะแสดงที่นี่'));
}
function bindPlan(id){if($('pd-del'))$('pd-del').onclick=()=>delPlan(id,'#/');document.querySelectorAll('[data-podel]').forEach(b=>b.onclick=()=>delPo(b.dataset.podel))}

/* ================= E.2 เพิ่ม / F แก้ไข Purchase Order ================= */
let OF=null;
// A car selected from the system joins its parent plan only when the PO is saved.
// Keep existing plan prices and other plans intact; cancelling the form makes no changes.
function commitPoPlanVehicles(p,ids){
  const existing=new Set(p.cars.map(c=>c.id));
  for(const id of new Set(ids)){
    if(!veh(id))continue;
    if(!existing.has(id)){p.cars.push({id,refPrice:null,ohPrice:null,priceSource:'not-provided'});existing.add(id);}
    if(OF.priceDraft?.[id])Object.assign(p.cars.find(c=>c.id===id),OF.priceDraft[id]);
  }
}
function pagePoForm(planId,poId){const p=planOf(planId);if(!p)return empty('search_off','ไม่พบแผน Overhaul','');const o=poId?p.pos.find(x=>x.id===poId):null;
  if(!OF||OF.plan!==planId||OF.po!==(poId||null))OF={plan:planId,po:poId||null,priceDraft:{},f:o?{name:o.name,vendor:o.vendor,from:o.from,to:o.to}:{name:'',vendor:'',from:'',to:''},cars:o?o.cars.slice():[],docs:o?JSON.parse(JSON.stringify(o.docs)):{order:[],other:[]}};
  const f=OF.f,t=o?`แก้ไข ${o.id}`:'เพิ่ม Purchase Order',back=o?`#/po/${o.id}`:`#/plan/${p.id}`;
  return crumbs([['จัดการงาน Overhaul','#/'],[p.id,`#/plan/${p.id}`],...(o?[[o.id,back]]:[]),[t]])+head(t,{back})+
  sect('รายละเอียด Purchase Order')+`<div class="grid grid-cols-1 md:grid-cols-6 gap-x-4 gap-y-4">
    ${fld('o-name','ชื่อ Purchase Order',inp('o-name',f.name,'เช่น ซ่อมช่วงล่าง'),{cls:'md:col-span-3'})}${fld('o-vd','ศูนย์บริการ/อู่',sel('o-vd',f.vendor,S.vendors.map(v=>[v.id,v.name]),'เลือกศูนย์บริการ/อู่'),{cls:'md:col-span-3'})}
    ${fld('o-from','วันเริ่มสัญญา',inp('o-from',f.from,'','date'),{cls:'md:col-span-2'})}${fld('o-to','วันสิ้นสุดสัญญา',inp('o-to',f.to,'','date'),{cls:'md:col-span-2'})}</div>`+
  sect('รถที่จะเข้า Overhaul',OF.cars.length?ohAddVehicleButton():'',OF.cars.length)+ohPoVehicleSelection(p)+
  sect('เอกสาร')+`<div class="flex flex-col gap-6">${upload('order','ใบสั่งจ้าง')}${upload('other','เอกสารอื่นๆ',{opt:true})}</div>`+
  footBar(`<a class="btn btn-s btn-lg !no-underline" href="${back}">ยกเลิก</a>`,`<button class="btn btn-p btn-lg" type="button" id="of-save">บันทึก</button>`);
}
function bindPoForm(planId){const p=planOf(planId);bindUploads(OF.docs);
  const rd=()=>{const f=OF.f;f.name=$('o-name').value;f.vendor=$('o-vd').value||'';f.from=$('o-from').value;f.to=$('o-to').value};
  ohBindPoVehicleSelection(p,rd);
  $('of-save').onclick=()=>{rd();const f=OF.f;
    const ok=req([['o-name',f.name.trim(),'กรุณาระบุชื่อ Purchase Order'],['o-vd',f.vendor,'กรุณาเลือกศูนย์บริการ/อู่'],['o-from',f.from,'กรุณาเลือกวันเริ่มสัญญา'],
      ['o-to',f.to&&(!f.from||f.to>=f.from),f.to?'วันสิ้นสุดสัญญาต้องไม่ก่อนวันเริ่มสัญญา':'กรุณาเลือกวันสิ้นสุดสัญญา'],['o-cars',OF.cars.length,'กรุณาเลือกรถอย่างน้อย 1 คัน'],['order',OF.docs.order.length,'กรุณาอัปโหลดใบสั่งจ้าง']]);
    if(!ok)return;
    if(OF.po){const o=p.pos.find(x=>x.id===OF.po);const doIt=()=>{commitPoPlanVehicles(p,OF.cars);o.cars.filter(c=>!OF.cars.includes(c)).forEach(c=>delete S.jobs[o.id+':'+c]);Object.assign(o,{name:f.name.trim(),vendor:f.vendor,from:f.from,to:f.to,cars:OF.cars.slice(),docs:OF.docs});
        OF.cars.forEach(c=>jobOf(o.id,c));save();OF=null;go(`#/po/${o.id}`);toast('บันทึกการแก้ไข Purchase Order สำเร็จ')};
      confirmBox('ยืนยันการแก้ไข Purchase Order',`บันทึกการเปลี่ยนแปลงของ ${o.id} "${f.name.trim()}"`,'ยืนยัน',doIt);return}
    const id=`${p.id}-${String(Math.max(0,...p.pos.map(x=>+x.id.slice(-2)))+1).padStart(2,'0')}`;commitPoPlanVehicles(p,OF.cars);p.pos.push({id,name:f.name.trim(),vendor:f.vendor,from:f.from,to:f.to,cars:OF.cars.slice(),docs:OF.docs});
    OF.cars.forEach(c=>jobOf(id,c));save();OF=null;go(`#/plan/${p.id}`);toast('เพิ่ม Purchase Order สำเร็จ')};
}

/* ================= รายละเอียด PO ================= */
function pagePo(id){const [p,o]=poOf(id);if(!o)return empty('search_off','ไม่พบ Purchase Order','');const v=vendor(o.vendor);
  return crumbs([['จัดการงาน Overhaul','#/'],[p.id,`#/plan/${p.id}`],[o.id]])+head('หมายเลข Purchase Order '+o.id,{back:`#/plan/${p.id}`,actions:`<button class="btn btn-ds" type="button" id="po-del"><span class="ms">delete</span>ลบ</button><a class="btn btn-s !no-underline" href="#/po/${o.id}/edit"><span class="ms">edit</span>แก้ไข</a>`})+
  sect('รายละเอียด Purchase Order')+info([['ชื่อ Purchase Order',esc(o.name)],['ศูนย์บริการ/อู่',esc(v.name)],['เบอร์โทรศัพท์',esc(v.tel)],['วันเริ่มสัญญา',dmy(o.from)],['วันสิ้นสุดสัญญา',dmy(o.to)],['ระยะเวลาสัญญา',`${days(o.from,o.to)+1} วัน`]],3)+
  sect('เอกสาร')+`<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10"><div><div class="text-sm font-semibold mb-2">ใบสั่งจ้าง</div>${roFiles(o.docs&&o.docs.order)}</div><div><div class="text-sm font-semibold mb-2">เอกสารอื่นๆ</div>${roFiles(o.docs&&o.docs.other)}</div></div>`+
  sect('รถใน Purchase Order',null,o.cars.length)+`<div class="tblwrap"><table class="tbl striped"><thead><tr><th>ทะเบียน</th><th>ข้อมูลรถ</th><th class="num">เปรียบเทียบค่า Overhaul ในแผน</th><th>ความคืบหน้า</th><th>สถานะ</th><th class="w-[56px]"></th></tr></thead><tbody>`+
  o.cars.map(c=>{const x=veh(c),j=jobOf(o.id,c),pct=jobPct(j),price=p.cars.find(v=>v.id===c)||{},net=ohValidMoney(price.refPrice)&&ohValidMoney(price.ohPrice)?price.refPrice-price.ohPrice:null;return `<tr><td><a class="cell-key !no-underline text-gray-900" href="#/job/${o.id}/${c}">${esc(x.plate)}</a></td><td>${esc(x.model)}<div class="cell-sub">${esc(x.type)} · ${esc(x.dept)}</div></td><td class="num">${money(price.ohPrice)} บาท<div class="cell-sub">${ohValidMoney(price.refPrice)&&price.refPrice>0&&ohValidMoney(price.ohPrice)?ohPercent(price.ohPrice/price.refPrice*100):'—'} ของราคากลาง</div>${net!=null&&net<0?badge(['สูงกว่าราคากลาง','b-out']):''}</td>
    <td>${ohProgressBar(pct)}</td>
    <td>${badge(jobStatus(j))}</td><td><a class="btn btn-t btn-icon !no-underline" href="#/job/${o.id}/${c}" aria-label="ดูงาน"><span class="ms">chevron_right</span></a></td></tr>`}).join('')+`</tbody></table></div>`;
}

/* ================= งานรายคัน 7 ขั้น ================= */
const STEPS=['นัดหมายนำรถเข้าอู่','ตรวจรับรถ','ติดตามงานซ่อม','ตรวจสภาพ','นัดหมายรับรถ','ปิดงาน','ยืนยันการส่งอนุมัติ'];
const CHECKS=['สภาพตัวถังและสี','กระจกและกระจกมองข้าง','ระบบไฟส่องสว่างและไฟสัญญาณ','ยางและล้ออะไหล่','เครื่องมือประจำรถ','เอกสารประจำรถ','ระดับน้ำมันเชื้อเพลิง'];
let JV=null;
function pageJob(poId,carId){const [p,o]=poOf(poId);if(!o||!o.cars.includes(carId))return empty('search_off','ไม่พบงาน','');
  const v=veh(carId),j=jobOf(poId,carId),cur=Math.min(j.stage,7);if(!JV||JV.k!==poId+carId)JV={k:poId+carId,view:cur};const view=Math.min(JV.view,cur);
  const vd=vendor(o.vendor);JR.po=poId;
  const steps=`<div class="wsteps" role="tablist">`+STEPS.map((l,i)=>{const n=i+1,passed=n<cur||j.stage>7,locked=n>cur,optional=n===1||n===5,skipped=optional&&passed&&!(n===1?j.appt:j.pickup);return `<div class="wstep${n===view?' active':''}${passed?' passed':''}${locked?' locked':''}" data-step="${n}" data-optional="${optional}" role="tab" tabindex="${locked?-1:0}" aria-selected="${n===view}"><span class="num">${passed?'<span class="ms">check</span>':n}</span><span class="lbl">${l}${optional?`<span class="block text-xs font-normal text-gray-500" data-step-optional>Optional${skipped?' · ข้ามแล้ว':''}</span>`:''}</span></div>`}).join('')+`</div>`;
  const body=[s1,s2,s3,s4,s5,s6,s7][view-1](j,v,o,vd,p,view<cur||j.stage>7);
  return crumbs([['จัดการงาน Overhaul','#/'],[p.id,`#/plan/${p.id}`],[o.id,`#/po/${o.id}`],[v.plate]])+head(v.plate,{back:`#/po/${o.id}`,badge:badge(jobStatus(j))})+
    info([['ทะเบียน',esc(v.plate)],['ยี่ห้อ/รุ่น',esc(v.model)],['ประเภท',esc(v.type)],['อายุการใช้งาน',ageText(v.ageM)],['เลขไมล์สะสม',ohOperatingValue(v,'mileage','กม.')],['ชั่วโมงสะสม',ohOperatingValue(v,'hours','ชม.')]],3)+ohMockActions(j)+steps+`<div id="stepbody">${[1,5].includes(view)&&view===cur&&j.stage<=7?'<p class="text-sm text-gray-500 mb-4">ขั้นตอนนี้ไม่บังคับ สามารถข้ามไปขั้นถัดไปได้โดยไม่ต้องกรอกนัดหมาย</p>':''}${body}</div>`;
}
const vendorBox=vd=>info([['ศูนย์บริการ/อู่',esc(vd.name)],['เบอร์โทรศัพท์',esc(vd.tel)],['ที่อยู่',esc(vd.addr)]],3);
const staffOpts=PX_STAFF.map(s=>[s.id,s.name]);
function apptForm(kind,a,vd,j){const ret=kind==='pickup';
  if(a&&!a.edit&&a.state==='rejected')return sect(ret?'นัดหมายรับรถ':'นัดหมายนำรถเข้าอู่',badge(['หน่วยงานปฏิเสธนัดหมาย','b-out']))+
    `<div class="note note-warn mb-6"><span class="ms">error</span><span><b>เหตุผลที่ปฏิเสธ:</b> ${esc(a.reason)}</span></div>`+vendorBox(vd)+
    info([[ret?'ช่วงวันที่นัดรับรถ':'วันที่นัดนำรถเข้าอู่',ret?`${dmy(a.from)} - ${dmy(a.to)}`:dmy(a.date)],['ผู้ประสานงาน',esc(staff(a.staff).name)],['เบอร์โทรศัพท์',esc(staff(a.staff).tel)]],3)+
    footBar(`<a class="btn btn-s btn-lg !no-underline" href="#/po/${JR.po}">ย้อนกลับ</a>`,`<button class="btn btn-t btn-lg" type="button" data-act="skip">ข้ามขั้นตอน</button><button class="btn btn-p btn-lg" type="button" data-act="appt-edit">แก้ไขนัดหมาย</button>`);
  if(a&&!a.edit&&(a.state==='pending'||a.state==='accepted')){const st=a.state==='accepted'?['หน่วยงานตอบรับแล้ว','b-ok']:['รอหน่วยงานตอบรับ','b-low'];
    return sect(ret?'นัดหมายรับรถ':'นัดหมายนำรถเข้าอู่',badge(st))+vendorBox(vd)+info([[ret?'ช่วงวันที่นัดรับรถ':'วันที่นัดนำรถเข้าอู่',ret?`${dmy(a.from)} - ${dmy(a.to)}`:dmy(a.date)],['ผู้ประสานงาน',esc(staff(a.staff).name)],['เบอร์โทรศัพท์',esc(staff(a.staff).tel)],['หมายเหตุ',esc(a.remark),3]],3)+
    footBar(`<button class="btn btn-s btn-lg" type="button" data-act="appt-edit">แก้ไขนัดหมาย</button>`,`<button class="btn btn-t btn-lg" type="button" data-act="skip">ข้ามขั้นตอน</button><button class="btn btn-p btn-lg" type="button" data-act="${ret?'to-close':'to-intake'}">${ret?'ส่งมอบรถ':'รับรถเข้าอู่'}</button>`)}
  const x=a||{};
  return sect(ret?'นัดหมายรับรถ':'นัดหมายนำรถเข้าอู่')+vendorBox(vd)+`<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6">`+
    (ret?fld('a-from','นัดรับรถตั้งแต่วันที่',inp('a-from',x.from,'','date',`min="${PX_TODAY}"`))+fld('a-to','ถึงวันที่',inp('a-to',x.to,'','date',`min="${PX_TODAY}"`)):fld('a-date','วันที่นัดนำรถเข้าอู่',inp('a-date',x.date,'','date',`min="${PX_TODAY}"`))+'<div class="max-md:hidden"></div>')+
    `<div class="max-md:hidden"></div>${fld('a-st','ผู้ประสานงาน',sel('a-st',x.staff,staffOpts,'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน'))}${fld('a-tel','เบอร์โทรศัพท์',inp('a-tel',x.staff?staff(x.staff).tel:'','','text','readonly'))}<div class="max-md:hidden"></div>
    ${fld('a-rm','หมายเหตุ',ta('a-rm',x.remark,'ระบุหมายเหตุ'),{opt:true,cls:'md:col-span-3'})}</div>`+
    footBar(`<a class="btn btn-s btn-lg !no-underline" href="#/po/${JR.po}">ย้อนกลับ</a>`,`<button class="btn btn-t btn-lg" type="button" data-act="skip">ข้ามขั้นตอน</button><button class="btn btn-p btn-lg" type="button" data-act="appt-save">ยืนยันนัดหมาย</button>`)}
const s1=(j,v,o,vd,p,ro)=>ro?sect('นัดหมายนำรถเข้าอู่')+(j.appt?info([['วันที่นัดนำรถเข้าอู่',dmy(j.appt.date)],['ผู้ประสานงาน',esc(staff(j.appt.staff).name)],['เบอร์โทรศัพท์',esc(staff(j.appt.staff).tel)]],3):info([['นัดหมาย','ไม่ได้นัดหมาย (ข้ามขั้นตอน)']],3)):apptForm('appt',j.appt,vd,j);
function s2(j,v,o,vd,p,ro){return ohIntake(j,ro);}
function s3(j,v,o,vd,p,ro){const L=j.logs||[],last=L.length?L[L.length-1].pct:0;
  return sect('บันทึกการติดตามงานซ่อม',ro?'':`<button class="btn btn-s" type="button" data-act="log-add"><span class="ms">add</span>เพิ่มความคืบหน้า</button>`)+
    (L.length?`<div class="tblwrap"><table class="tbl striped"><thead><tr><th class="w-[190px]">วันที่</th><th>รายละเอียด</th><th class="w-[150px]">ความคืบหน้า</th><th>หมายเหตุ</th>${ro?'':'<th class="w-[104px]"></th>'}</tr></thead><tbody>`+
      L.map((l,i)=>`<tr><td>${dmyt(l.at)}</td><td>${esc(l.detail)}</td><td>${ohProgressBar(l.pct)}</td><td>${esc(l.remark)||'-'}</td>${ro?'':`<td><div class="flex justify-end gap-1"><button class="btn btn-t btn-icon" type="button" data-log-e="${i}" aria-label="แก้ไข"><span class="ms">edit</span></button><button class="btn btn-t btn-icon" type="button" data-log-d="${i}" aria-label="ลบ"${L.length<=1?' disabled title="ต้องคงความคืบหน้าไว้อย่างน้อย 1 รายการ"':''}><span class="ms">delete</span></button></div></td>`}</tr>`).join('')+`</tbody></table></div>`
      :empty('pending_actions','ยังไม่มีการติดตามงานซ่อม','เพิ่มความคืบหน้าเมื่อมีการอัปเดตจากอู่',ro?'':`<button class="btn btn-p btn-sm mt-2" type="button" data-act="log-add"><span class="ms">add</span>เพิ่มความคืบหน้า</button>`))+
    (ro?'':footBar(`<button class="btn btn-s btn-lg" type="button" data-step-go="2">ย้อนกลับ</button>`,`<button class="btn btn-p btn-lg" type="button" data-act="repaired"${last===100?'':' disabled'}>ซ่อมเสร็จ</button>`))}
function s4(j,v,o,vd,p,ro){if(ro)return sect('เอกสาร Safety Inspection')+`<div class="mb-8">${roFiles(j.safety)}</div>`+sect('เอกสารอื่นๆ')+roFiles(j.safetyOther)+sect('รูปสภาพรถหลัง Overhaul')+roFiles(j.afterPhotos);
  JR.docs={safety:j.safety||(j.safety=[]),safetyOther:j.safetyOther||(j.safetyOther=[]),afterPhotos:j.afterPhotos||(j.afterPhotos=[])};
  return sect('เอกสารตรวจสภาพ')+`<div class="flex flex-col gap-6">${upload('safety','เอกสาร Safety Inspection')}${upload('safetyOther','เอกสารอื่นๆ',{opt:true})}${ohPhotoUpload('afterPhotos','รูปสภาพรถหลัง Overhaul')}</div>`+
    footBar(`<button class="btn btn-s btn-lg" type="button" data-step-go="3">ย้อนกลับ</button>`,`<button class="btn btn-p btn-lg" type="button" data-act="safety">บันทึก</button>`)}
const s5=(j,v,o,vd,p,ro)=>ro?sect('นัดหมายรับรถ')+(j.pickup?info([['ช่วงวันที่นัดรับรถ',`${dmy(j.pickup.from)} - ${dmy(j.pickup.to)}`],['ผู้ประสานงาน',esc(staff(j.pickup.staff).name)],['เบอร์โทรศัพท์',esc(staff(j.pickup.staff).tel)]],3):info([['นัดหมาย','ไม่ได้นัดหมาย (ข้ามขั้นตอน)']],3)):apptForm('pickup',j.pickup,vd,j);
const partSum=a=>(a||[]).reduce((s,x)=>s+x.qty*x.price,0);
function partsTable(kind,arr,ro){const cat=kind==='body'?'อะไหล่ตัวรถ':'อะไหล่เครื่องมือกล';
  return sect(`รายการ${cat}`,ro?'':`<button class="btn btn-s" type="button" data-imp="${kind}"><span class="ms">upload_file</span>นำเข้าไฟล์</button><button class="btn btn-s" type="button" data-padd="${kind}"><span class="ms">add</span>เพิ่มรายการ</button>`,arr.length)+
  (arr.length?`<div class="tblwrap mb-10"><table class="tbl striped"><thead><tr><th>รหัสอะไหล่</th><th>ชื่ออะไหล่</th><th class="num">จำนวน</th><th>หน่วย</th><th class="num">ราคาต่อหน่วย</th><th class="num">ราคารวม</th>${ro?'':'<th class="w-[56px]"></th>'}</tr></thead><tbody>`+
    arr.map((x,i)=>`<tr><td>${esc(x.code)||'—'}</td><td>${esc(x.name)}</td><td class="num">${x.qty}</td><td>${esc(x.unit)}</td><td class="num">${money(x.price)}</td><td class="num">${money(x.qty*x.price)}</td>${ro?'':`<td><button class="btn btn-t btn-icon" type="button" data-pdel="${kind}:${i}" aria-label="ลบ"><span class="ms">delete</span></button></td>`}</tr>`).join('')+
    `<tr><td colspan="5" class="font-semibold text-right">รวม${cat}</td><td class="num font-semibold">${money(partSum(arr))}</td>${ro?'':'<td></td>'}</tr></tbody></table></div>`
    :`<div class="mb-10">${empty('inventory_2',`ยังไม่มีรายการ${cat}`,'นำเข้าไฟล์หรือเพิ่มรายการที่ใช้ในงาน Overhaul')}</div>`)}
function returnsTable(j,ro){const W=j.withdrawn||[];const actions=ro?'':`<button class="btn btn-s" id="withdraw-parts" type="button"><span class="ms">inventory_2</span>เบิกอะไหล่</button><button class="btn btn-s" id="return-parts" type="button"${W.length?'':' disabled'}><span class="ms">assignment_return</span>บันทึกคืนอะไหล่</button>`;if(!W.length)return sect('อะไหล่ที่เบิกจากคลัง',actions,0)+`<div class="mb-8">${empty('inventory_2','ยังไม่มีรายการเบิกอะไหล่','เพิ่มรายการเบิกอะไหล่เพื่อบันทึกจำนวนที่ใช้และคืน')}</div>`;
  return sect('คืนอะไหล่ที่เบิกจากคลัง',actions,W.length)+`<p class="text-sm text-gray-500 mb-4">รายการนี้ติดตามจำนวนที่เบิก ใช้ และคืน ส่วนค่าใช้จ่ายให้ระบุอะไหล่ที่ใช้จริงพร้อมราคาในรายการค่าใช้จ่ายด้านบน</p>`+`<div class="tblwrap mb-10"><table class="tbl striped"><thead><tr><th>ชื่ออะไหล่</th><th>หน่วย</th><th class="num">จำนวนที่เบิก</th><th class="num">จำนวนที่ใช้</th><th class="${ro?'num':'w-[170px]'}">จำนวนที่คืน</th><th>หมายเหตุ</th></tr></thead><tbody>`+
  W.map((x,i)=>{const r=x.ret??(x.qty-x.used);return `<tr><td>${i+1}. ${esc(x.name)} # ${esc(x.code)}</td><td>${esc(x.unit)}</td><td class="num">${x.qty}</td><td class="num">${ro?x.used:`<div class="in noic"><input class="!w-20 !text-right" type="number" min="0" max="${x.qty}" value="${x.used}" data-used="${i}" aria-label="จำนวนที่ใช้ ${esc(x.name)}"></div>`}</td>`+
    (ro?`<td class="num">${r}</td><td>${esc(x.note)||'-'}</td>`:`<td><div class="qty lg"><button type="button" data-rq="${i}:-1"${r<=0?' disabled':''} aria-label="ลดจำนวนที่คืน"><span class="ms">remove</span></button><span data-rv="${i}">${r}</span><button type="button" data-rq="${i}:1"${r>=x.qty-x.used?' disabled':''} aria-label="เพิ่มจำนวนที่คืน"><span class="ms">add</span></button></div></td>
      <td><div class="in noic"><input type="text" data-rn="${i}" value="${esc(x.note||'')}" placeholder="ระบุหมายเหตุ"></div></td>`)+`</tr>`}).join('')+`</tbody></table></div>`}
function costBox(j){const b=partSum(j.parts&&j.parts.body),t=partSum(j.parts&&j.parts.tool),l=num(j.labor)||0,o=num(j.otherCost)||0;
  return `<div class="tblwrap mb-10"><table class="tbl striped"><thead><tr><th>รายการค่าใช้จ่าย</th><th class="num">จำนวนเงิน (บาท)</th></tr></thead><tbody>${[['ค่าอะไหล่ตัวรถ',b],['ค่าอะไหล่เครื่องมือกล',t],['ค่าแรง',l],['ค่าใช้จ่ายอื่นๆ',o]].map(([k,v])=>`<tr><td>${k}</td><td class="num">${money(v)}</td></tr>`).join('')}
    <tr><td class="font-semibold">รวมค่าใช้จ่ายทั้งสิ้น</td><td class="num font-semibold">${money(b+t+l+o)}</td></tr></tbody></table></div>`}
function s6(j,v,o,vd,p,ro){j.parts=j.parts||{body:[],tool:[]};const h=j.handover||{date:j.pickup?j.pickup.from:'',receiver:''};
  const hand=ro?info([['วันที่ส่งมอบรถคืน',dmy(h.date)],['ผู้รับรถ',esc(h.receiver)]],3):`<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 mb-10">${fld('h-date','วันที่ส่งมอบรถคืน',inp('h-date',h.date,'','date',`max="${PX_TODAY}" ${j.intake?.date?`min="${j.intake.date}"`:''}`))}${fld('h-rc','ผู้รับรถ',inp('h-rc',h.receiver,'ระบุชื่อ-นามสกุลผู้รับรถ'))}</div>`;
  return sect('ข้อมูลการส่งมอบรถ')+hand+partsTable('body',j.parts.body,ro)+partsTable('tool',j.parts.tool,ro)+returnsTable(j,ro)+
    sect('ค่าใช้จ่ายในการดำเนินการ Overhaul')+(ro?'':`<div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 mb-6">${fld('c-lab','ค่าแรง (บาท)',inp('c-lab',j.labor===''||j.labor==null?'':money(j.labor),'ระบุค่าแรง','text','inputmode="decimal"'))}${fld('c-oth','ค่าใช้จ่ายอื่นๆ (บาท)',inp('c-oth',j.otherCost===''||j.otherCost==null?'':money(j.otherCost),'ระบุค่าใช้จ่ายอื่นๆ','text','inputmode="decimal"'),{opt:true})}</div>`)+costBox(j)+
    (ro?'':footBar(`<button class="btn btn-s btn-lg" type="button" data-step-go="5">ย้อนกลับ</button>`,`<button class="btn btn-p btn-lg" type="button" data-act="close">ปิดงาน</button>`))}
function s7(j,v,o,vd,p,ro){const h=j.handover||{},i=j.intake||{},cd=days(o.from,o.to)+1,used=i.date&&h.date?days(i.date,h.date)+1:null,late=h.date&&h.date>o.to?days(o.to,h.date):0;
  const W=j.withdrawn||[];
  return `<div class="grid grid-cols-1 lg:grid-cols-[59fr_41fr] gap-8"><div>`+
    sect('ข้อมูลผู้ซ่อม')+info([['ศูนย์บริการ/อู่',esc(vd.name)],['เบอร์โทรศัพท์',esc(vd.tel)],['Purchase Order',`${esc(o.id)} · ${esc(o.name)}`],['ที่อยู่',esc(vd.addr),3]],2)+
    sect('ระยะสัญญา',badge(late?[`เกินระยะสัญญา ${late} วัน`,'b-out']:['อยู่ในระยะสัญญา','b-ok']))+info([['วันเริ่มสัญญา',dmy(o.from)],['วันสิ้นสุดสัญญา',dmy(o.to)],['ระยะเวลาสัญญา',`${cd} วัน`],['วันที่รับรถเข้าอู่',dmy(i.date)],['วันที่ส่งมอบรถคืน',dmy(h.date)],['ระยะเวลาดำเนินการ',used?`${used} วัน`:'-']],2)+
    (j.approvalReason?`<div class="note note-warn mb-6"><span class="ms">info</span><span>ส่งกลับแก้ไข: ${esc(j.approvalReason)}</span></div>`:'')+sect('การรับประกันงานซ่อม')+info([['วันเริ่มรับประกัน',dmy(h.date)],['ระยะเวลารับประกัน','180 วัน'],['วันสิ้นสุดรับประกัน',h.date?dmy(addDays(h.date,179)):'-']],2)+
    sect('บันทึกการติดตามงานซ่อม')+`<div class="tblwrap mb-10"><table class="tbl striped"><thead><tr><th class="w-[190px]">วันที่</th><th>รายละเอียด</th><th>ความคืบหน้า</th><th>หมายเหตุ</th></tr></thead><tbody>${(j.logs||[]).map(l=>`<tr><td>${dmyt(l.at)}</td><td>${esc(l.detail)}</td><td>${ohProgressBar(l.pct)}</td><td>${esc(l.remark)||'-'}</td></tr>`).join('')}</tbody></table></div>`+
    partsTable('body',(j.parts||{}).body||[],true)+partsTable('tool',(j.parts||{}).tool||[],true)+returnsTable(j,true)+
    sect('ค่าใช้จ่ายในการดำเนินการ Overhaul')+costBox(j)+`</div><div>`+
    sect('ยานพาหนะ')+info([['ทะเบียน',esc(v.plate)],['ยี่ห้อ/รุ่น',esc(v.model)],['ประเภทรถ',esc(v.type)],['สังกัด',esc(v.dept)],['อายุการใช้งาน',ageText(v.ageM)],['ผู้รับรถ',esc(h.receiver)]],1)+
    sect('เอกสาร Safety Inspection')+roFiles(j.safety)+`</div></div>`+
    (j.stage===7?footBar(`<button class="btn btn-s btn-lg" type="button" data-step-go="6">ย้อนกลับ</button>`,`<button class="btn btn-p btn-lg" type="button" data-act="submit">ส่งอนุมัติ</button>`):'')}
let JR={};
function bindJob(poId,carId){const [p,o]=poOf(poId);if(!o)return;const j=jobOf(poId,carId);JR.po=poId;
  const rr=()=>{save();render()};
  const adv=(n,msg)=>{j.stage=n;JV.view=Math.min(n,7);save();render();if(msg)toast(msg);window.scrollTo({top:0,behavior:'smooth'})};
  document.querySelectorAll('.wstep').forEach(s=>s.onclick=()=>{if(s.classList.contains('locked'))return;JV.view=+s.dataset.step;render()});
  document.querySelectorAll('[data-step-go]').forEach(b=>b.onclick=()=>{JV.view=+b.dataset.stepGo;render()});
  if($('a-st'))$('a-st').onchange=()=>{$('a-tel').value=staff($('a-st').value).tel};
  if(JV.view===4&&JR.docs&&document.querySelector('[data-up]'))bindUploads(JR.docs);
  ohBindMockActions(j);
  const view=JV.view;
  const act=(a,fn)=>document.querySelectorAll(`[data-act="${a}"]`).forEach(b=>b.onclick=fn);
  act('skip',()=>view===1?(j.appt=null,adv(2,'ข้ามขั้นตอนนัดหมายนำรถเข้าอู่')):(j.pickup=null,adv(6,'ข้ามขั้นตอนนัดหมายรับรถ')));
  act('appt-edit',()=>{const a=view===1?j.appt:j.pickup;a.edit=true;rr()});
  act('to-intake',()=>adv(2));act('to-close',()=>adv(6));
  act('appt-save',()=>{if(view===1){const d=$('a-date').value,s=$('a-st').value;
      if(!req([['a-date',d,'กรุณาเลือกวันที่นัดนำรถเข้าอู่'],['a-st',s,'กรุณาเลือกผู้ประสานงาน']]))return;
      j.appt={date:d,staff:s,remark:$('a-rm').value,state:'pending'};rr();toast('ส่งนัดหมายนำรถเข้าอู่สำเร็จ',{sub:'รอหน่วยงานตอบรับ'})}
    else{const f=$('a-from').value,t=$('a-to').value,s=$('a-st').value;
      if(!req([['a-from',f,'กรุณาเลือกวันที่เริ่มนัดรับรถ'],['a-to',t&&t>=f,t?'วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม':'กรุณาเลือกวันที่สิ้นสุด'],['a-st',s,'กรุณาเลือกผู้ประสานงาน']]))return;
      j.pickup={from:f,to:t,staff:s,remark:$('a-rm').value,state:'pending'};rr();toast('ส่งนัดหมายรับรถสำเร็จ',{sub:'รอหน่วยงานตอบรับ'})}});
  if(view===2&&document.querySelector('[data-act="intake"]'))ohBindIntake(j);
  act('log-add',()=>logModal(j,null));
  document.querySelectorAll('[data-log-e]').forEach(b=>b.onclick=()=>logModal(j,+b.dataset.logE));
  document.querySelectorAll('[data-log-d]').forEach(b=>b.onclick=()=>confirmBox('ยืนยันการลบ','เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่','ยืนยัน',()=>{if(j.logs.length<=1)return;j.logs.splice(+b.dataset.logD,1);rr();toast('ลบรายละเอียดการติดตามสำเร็จ')},true));
  act('repaired',()=>adv(4,'บันทึกซ่อมเสร็จสำเร็จ'));
  act('safety',()=>{if(!req([['safety',j.safety.length,'กรุณาอัปโหลดเอกสาร Safety Inspection']]))return;adv(5,'บันทึกเอกสารตรวจสภาพสำเร็จ')});
  /* ขั้น 6 */
  const keep6=()=>{if($('h-date'))j.handover={date:$('h-date').value,receiver:$('h-rc').value};if($('c-lab')){j.labor=num($('c-lab').value);j.otherCost=num($('c-oth').value)}};
  ['c-lab','c-oth'].forEach(i=>{if($(i))$(i).onblur=()=>{keep6();rr()}});
  document.querySelectorAll('[data-padd]').forEach(b=>b.onclick=()=>{keep6();partModal(j,b.dataset.padd)});
  document.querySelectorAll('[data-pdel]').forEach(b=>b.onclick=()=>{keep6();const [k,i]=b.dataset.pdel.split(':');j.parts[k].splice(+i,1);rr()});
  document.querySelectorAll('[data-imp]').forEach(b=>b.onclick=()=>{keep6();ohImportParts(j,b.dataset.imp);});
  if($('withdraw-parts'))$('withdraw-parts').onclick=()=>{keep6();ohWithdrawParts(j);};
  if($('return-parts'))$('return-parts').onclick=()=>{keep6();j.returnsSavedAt=PX_TODAY;save();toast('บันทึกคืนอะไหล่สำเร็จ');};
  document.querySelectorAll('[data-used]').forEach(n=>n.onchange=()=>{keep6();const x=j.withdrawn[+n.dataset.used],value=num(n.value);if(value===''||!Number.isInteger(value)||value>x.qty){n.value=x.used;toast('จำนวนที่ใช้ไม่ถูกต้อง',{err:true,sub:'ระบุจำนวนเต็มตั้งแต่ 0 ถึงจำนวนที่เบิก'});return;}x.used=value;x.ret=Math.min(x.ret||0,x.qty-value);rr();});
  document.querySelectorAll('[data-rq]').forEach(b=>b.onclick=()=>{keep6();const [i,d]=b.dataset.rq.split(':').map(Number),x=j.withdrawn[i];const r=(x.ret??(x.qty-x.used))+d;x.ret=Math.max(0,Math.min(x.qty-x.used,r));rr()});
  document.querySelectorAll('[data-rn]').forEach(n=>n.oninput=()=>{j.withdrawn[+n.dataset.rn].note=n.value;save()});
  act('close',()=>{keep6();const h=j.handover||{};
    if(!req([['h-date',h.date&&h.date<=PX_TODAY&&(!j.intake?.date||h.date>=j.intake.date),'ระบุวันส่งมอบจริงตั้งแต่วันรับรถเข้าอู่และไม่เกินวันนี้'],['h-rc',(h.receiver||'').trim(),'กรุณาระบุผู้รับรถ'],['c-lab',j.labor!=='',"กรุณาระบุค่าแรง"]]))return;
    adv(7)});
  act('submit',()=>approveModal(j));
}
// Store the actual save time in Bangkok, independent of the browser's timezone.
function ohProgressTimestamp(date=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(date);
 const fields=Object.fromEntries(parts.map(p=>[p.type,p.value]));
 return `${fields.year}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}:${fields.second}+07:00`;
}
const ohProgressTime=at=>Date.parse(/[zZ]$|[+-]\d{2}:?\d{2}$/.test(at)?at:at+'+07:00')||0;
function logModal(j,idx){const l=idx==null?{detail:'',pct:'',remark:''}:j.logs[idx];$('modals').innerHTML='';
  modal('m-log','md',idx==null?'เพิ่มความคืบหน้า':'แก้ไขความคืบหน้า','',`<div class="flex flex-col gap-4">${fld('l-dt','รายละเอียด',ta('l-dt',l.detail,'ระบุรายละเอียดการดำเนินงาน'))}${fld('l-pct','ความคืบหน้า (%)',inp('l-pct',l.pct,'0-100','number','min="0" max="100"'))}${fld('l-rm','หมายเหตุ',ta('l-rm',l.remark,'ระบุหมายเหตุ'),{opt:true})}</div>`,
    `<div class="modal-ft-r"><button class="btn btn-s" type="button" data-close="m-log">ยกเลิก</button><button class="btn btn-p" type="button" id="l-ok">บันทึก</button></div>`);
  $('l-ok').onclick=()=>{const dt=$('l-dt').value.trim(),pc=num($('l-pct').value);
    if(!req([['l-dt',dt,'กรุณาระบุรายละเอียด'],['l-pct',pc!==''&&pc<=100,'กรุณาระบุความคืบหน้า 0-100']]))return;
    const stamp=ohProgressTimestamp(),v={...l,at:idx==null?stamp:(l.at||stamp),detail:dt,pct:pc,remark:$('l-rm').value.trim(),...(idx==null?{}:{updatedAt:stamp})};j.logs=j.logs||[];if(idx==null)j.logs.push(v);else j.logs[idx]=v;j.logs.sort((a,b)=>ohProgressTime(a.at)-ohProgressTime(b.at));
    oh2Modal('m-log',false);save();render();toast(idx==null?'เพิ่มความคืบหน้าสำเร็จ':'แก้ไขความคืบหน้าสำเร็จ')};
  oh2Modal('m-log',true)}
function partModal(j,kind){$('modals').innerHTML='';
  modal('m-pt','md',kind==='body'?'เพิ่มรายการอะไหล่ตัวรถ':'เพิ่มรายการอะไหล่เครื่องมือกล','',`<div class="grid grid-cols-2 gap-4">${fld('t-code','รหัสอะไหล่',inp('t-code','','ระบุรหัสอะไหล่'),{opt:true})}${fld('t-unit','หน่วย',inp('t-unit','','เช่น ชุด, ตัว'))}${fld('t-name','ชื่ออะไหล่',inp('t-name','','ระบุชื่ออะไหล่'),{cls:'col-span-2'})}${fld('t-qty','จำนวน',inp('t-qty','','0','number','min="1"'))}${fld('t-pr','ราคาต่อหน่วย (บาท)',inp('t-pr','','0.00','text','inputmode="decimal"'))}</div>`,
    `<div class="modal-ft-r"><button class="btn btn-s" type="button" data-close="m-pt">ยกเลิก</button><button class="btn btn-p" type="button" id="t-ok">บันทึก</button></div>`);
  $('t-ok').onclick=()=>{const v={code:$('t-code').value.trim(),name:$('t-name').value.trim(),unit:$('t-unit').value.trim(),qty:num($('t-qty').value),price:num($('t-pr').value)};
    if(!req([['t-unit',v.unit,'กรุณาระบุหน่วย'],['t-name',v.name,'กรุณาระบุชื่ออะไหล่'],['t-qty',v.qty>0,'กรุณาระบุจำนวน'],['t-pr',v.price!=='','กรุณาระบุราคาต่อหน่วย']]))return;
    j.parts[kind].push(v);oh2Modal('m-pt',false);save();render();toast('เพิ่มรายการอะไหล่สำเร็จ')};
  oh2Modal('m-pt',true)}
function approveModal(j){$('modals').innerHTML='';
  const AP=[['a1','นายวิชัย ศรีวงศ์ · ผู้อำนวยการกองบำรุงรักษาและควบคุมยานพาหนะ'],['a2','นางสาวรัตนา พึ่งบุญ · ผู้ช่วยผู้อำนวยการกอง กบค.']];
  modal('m-ap','md','ส่งอนุมัติปิดงาน','',fld('ap-p','ผู้อนุมัติ',sel('ap-p','',AP,'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน')),
    `<div class="modal-ft-r"><button class="btn btn-s" type="button" data-close="m-ap">ปิด</button><button class="btn btn-p" type="button" id="ap-ok" disabled>ส่งอนุมัติ</button></div>`);
  $('ap-p').onchange=()=>{$('ap-ok').disabled=!$('ap-p').value};
  $('ap-ok').onclick=()=>{j.stage=8;j.approver=$('ap-p').value;oh2Modal('m-ap',false);save();render();toast('ส่งอนุมัติปิดงานสำเร็จ',{sub:'รอผู้บังคับบัญชาอนุมัติ'})};
  oh2Modal('m-ap',true)}

/* ================= A อู่/ศูนย์บริการ — ตามจอ SP09 (figma-export/sp09-plugin: spVendorList/Form/Detail · J1-UC-18-01..03) =================
   รายการ: Table header ค้นหา "ค้นหาชื่ออู่, จังหวัด, เบอร์โทร" + Primary "เพิ่มอู่/ศูนย์บริการ" · คอลัมน์ รหัส / อู่/ศูนย์บริการ / ประเภท/ยี่ห้อที่รองรับ / ที่ตั้ง / เบอร์โทร / คะแนนเฉลี่ย / เมนู
   ฟอร์ม: ข้อมูลอู่ (ชื่อบังคับ · ประเภท+ยี่ห้อ · ที่อยู่ · เบอร์โทร+อีเมล) → พิกัด (ละติจูด · ลองจิจูด) → เอกสารอ้างอิง · ยกเลิก/บันทึก
   ประเภทที่รองรับ = เลือกหลายค่าจากประเภทรถในระบบ (เจ้าของงาน 11 พ.ย. 2569) · รายละเอียด: พิกัด + นำทางด้วย Google Maps · คะแนน · PO ที่เกี่ยวข้อง */
const VND_EXTRA={v1:{code:'VND-001',prov:'ปทุมธานี',lat:'14.0786',lng:'100.6251',ratings:[5,4,4]},v2:{code:'VND-002',prov:'กรุงเทพมหานคร',lat:'13.8277',lng:'100.5531',ratings:[4]},v3:{code:'VND-003',prov:'สมุทรปราการ',lat:'13.6173',lng:'100.7506',ratings:[]}};
function vx(v){if(!v.code){const x=VND_EXTRA[v.id]||{};Object.assign(v,{code:x.code||'VND-'+String(S.vendors.indexOf(v)+1).padStart(3,'0'),prov:x.prov||'',lat:x.lat||'',lng:x.lng||'',ratings:x.ratings||[],docs:[]})}return v}
const score=r=>r&&r.length?`${(r.reduce((a,b)=>a+b,0)/r.length).toFixed(1)} / 5 (${r.length} ครั้ง)`:'ยังไม่มีคะแนน';
let VQ='';
function pageVendors(){S.vendors.forEach(vx);const q=VQ.toLowerCase();
  const R=S.vendors.filter(v=>!q||[v.name,v.prov,v.addr,v.tel].join(' ').toLowerCase().includes(q));
  return crumbs([['อู่/ศูนย์บริการ']])+head('อู่/ศูนย์บริการ')+
  `<div class="list-toolbar split !mb-4"><div class="lt-search !basis-[320px]"><div class="search"><span class="ms">search</span><input id="vq" type="search" value="${esc(VQ)}" placeholder="ค้นหาชื่ออู่, จังหวัด, เบอร์โทร"></div></div>
   <div class="lt-actions"><a class="btn btn-p !no-underline" href="#/vendor/new"><span class="ms">add</span>เพิ่มอู่/ศูนย์บริการ</a></div></div>`+
  (R.length?`<div class="tblwrap"><table class="tbl striped"><thead><tr><th class="w-[110px]">รหัส</th><th>อู่/ศูนย์บริการ</th><th class="w-[230px]">ประเภท / ยี่ห้อที่รองรับ</th><th>ที่ตั้ง</th><th>เบอร์โทร</th><th>คะแนนเฉลี่ย</th><th class="w-[56px]"></th></tr></thead><tbody>`+
    R.map(v=>`<tr><td>${esc(v.code)}</td><td><a class="cell-key !no-underline text-gray-900" href="#/vendor/${v.id}/view">${esc(v.name)}</a></td>
      <td>${v.types.length?esc(v.types[0])+(v.types.length>1?` <span class="badge b-neutral">+${v.types.length-1}</span>`:''):'-'}<div class="cell-sub">${esc(v.brands)||'-'}</div></td>
      <td>${esc(v.prov)||'-'}</td><td>${esc(v.tel)||'-'}</td><td>${score(v.ratings)}</td>
      <td>${oh2Menu('จัดการ '+v.name,[{href:`#/vendor/${v.id}/view`,icon:'visibility',label:'ดูรายละเอียด'},{href:`#/vendor/${v.id}`,icon:'edit',label:'แก้ไข'}])}</td></tr>`).join('')+
    `</tbody></table>${pager(1,1,R.length,R.length||1,'data-vp')}</div>`
    :empty('search_off','ไม่พบอู่/ศูนย์บริการ','ไม่มีอู่/ศูนย์บริการที่ตรงกับคำค้น'))}
function bindVendors(){$('vq').addEventListener('input',e=>{VQ=e.target.value;render();const i=$('vq');i.focus();i.setSelectionRange(i.value.length,i.value.length)})}
function pageVendorView(id){const v=S.vendors.find(x=>x.id===id);if(!v)return empty('search_off','ไม่พบอู่/ศูนย์บริการ','');vx(v);
  const pos=[];S.plans.forEach(p=>p.pos.forEach(o=>{if(o.vendor===id)pos.push([p,o])}));
  const map=v.lat&&v.lng?`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(v.lat+','+v.lng)}`:'';
  return crumbs([['อู่/ศูนย์บริการ','#/vendor'],[v.name]])+head('รายละเอียดอู่/ศูนย์บริการ',{back:'#/vendor',actions:`<a class="btn btn-p !no-underline" href="#/vendor/${v.id}"><span class="ms">edit</span>แก้ไข</a>`})+
  sect('ข้อมูลอู่/ศูนย์บริการ')+info([['ชื่ออู่',esc(v.name)],['ประเภทที่รองรับ',v.types.map(esc).join(', ')],['ยี่ห้อที่รองรับ',esc(v.brands)],['ที่อยู่',esc(v.addr)],['เบอร์โทร',esc(v.tel)],['อีเมล',esc(v.email)]],3)+
  sect('พิกัดและการนำทาง')+info([['ละติจูด',esc(v.lat)],['ลองจิจูด',esc(v.lng)]],3)+
  `<div class="mb-8">${map?`<a class="btn btn-s !no-underline" href="${map}" target="_blank" rel="noopener"><span class="ms">directions</span>นำทางด้วย Google Maps</a>`:'<button class="btn btn-s" type="button" disabled><span class="ms">directions</span>นำทางด้วย Google Maps</button>'}</div>`+
  sect('คะแนนคุณภาพงานซ่อม')+info([['คะแนนเฉลี่ย',score(v.ratings)]],3)+
  sect('เอกสารและ Purchase Order ที่เกี่ยวข้อง')+(pos.length?`<div class="tblwrap mb-6"><table class="tbl striped"><thead><tr><th class="w-[200px]">Purchase Order</th><th>รายการ</th><th class="w-[56px]"></th></tr></thead><tbody>`+
    pos.map(([p,o])=>`<tr><td>${esc(o.id)}</td><td>${esc(o.name)} · รถ ${o.cars.length} คัน<div class="cell-sub">${esc(p.id)} · ${esc(p.name)}</div></td><td><a class="btn btn-t btn-icon !no-underline" href="#/po/${o.id}" aria-label="ดู ${esc(o.id)}"><span class="ms">quick_reference_all</span></a></td></tr>`).join('')+`</tbody></table></div>`
    :`<div class="mb-6">${empty('description','ยังไม่มีเอกสารอ้างอิง','')}</div>`)+
  `<div><div class="text-sm font-semibold mb-2">เอกสารที่เกี่ยวข้อง</div>${roFiles(v.docs)}</div>`}
let VF=null;
function pageVendorForm(id){const v=id&&id!=='new'?S.vendors.find(x=>x.id===id):null;if(v)vx(v);
  if(!VF||VF.id!==(id||'new'))VF={id:id||'new',types:v?v.types.slice():[],open:false,q:'',docs:v?JSON.parse(JSON.stringify(v.docs||[])):[]};
  const t=v?'แก้ไขข้อมูลอู่/ศูนย์บริการ':'เพิ่มอู่/ศูนย์บริการ';
  const opts=PX_TYPES.filter(x=>!VF.q||x.includes(VF.q));
  const multi=`<div class="f relative" data-f="v-types"><label>ประเภทที่รองรับ <small>(ถ้ามี)</small></label>
    <div class="min-h-[40px] w-full border border-solid border-gray-300 rounded-md bg-white px-3 py-2 flex flex-wrap items-center gap-2 cursor-pointer shadow-xs" id="v-mt" role="combobox" aria-expanded="${VF.open}" tabindex="0">
      ${VF.types.map(x=>`<span class="fchip">${esc(x)}<button class="fchip-x" type="button" data-vt="${esc(x)}" aria-label="เอา ${esc(x)} ออก"><span class="ms">close_small</span></button></span>`).join('')||'<span class="text-gray-500 text-md">เลือกประเภทที่รองรับ</span>'}
      <span class="ms ml-auto text-gray-500">keyboard_arrow_down</span></div>
    ${VF.open?`<div class="combo-list !top-[76px]" role="listbox" aria-multiselectable="true"><div class="search"><span class="ms">search</span><input id="v-mq" type="search" value="${esc(VF.q)}" placeholder="ค้นหาประเภทรถ"></div>
      <div class="max-h-[240px] overflow-y-auto flex flex-col">${opts.map(x=>`<label class="combo-opt${VF.types.includes(x)?' sel':''} cursor-pointer"><input type="checkbox" class="!w-4 !h-4 !min-h-0 flex-none" data-vo="${esc(x)}"${VF.types.includes(x)?' checked':''}><span class="combo-opt-tx"><b>${esc(x)}</b></span></label>`).join('')||'<div class="combo-empty">ไม่พบประเภทรถ</div>'}</div></div>`:''}
    <div class="help hidden"></div></div>`;
  return crumbs([['อู่/ศูนย์บริการ','#/vendor'],[t]])+head(t,{back:v?`#/vendor/${v.id}/view`:'#/vendor'})+
  sect('ข้อมูลอู่/ศูนย์บริการ')+`<div class="flex flex-col gap-6 mb-10">${fld('v-name','ชื่ออู่/ศูนย์บริการ',inp('v-name',v&&v.name,'ระบุชื่ออู่/ศูนย์บริการ'))}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">${multi}${fld('v-brand','ยี่ห้อที่รองรับ',inp('v-brand',v&&v.brands,'ระบุยี่ห้อที่รองรับ'),{opt:true})}</div>
    ${fld('v-addr','ที่อยู่',ta('v-addr',v&&v.addr,'ระบุที่อยู่'),{opt:true})}
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">${fld('v-tel','เบอร์โทร',inp('v-tel',v&&v.tel,'ระบุเบอร์โทร','tel'),{opt:true})}${fld('v-mail','อีเมล',inp('v-mail',v&&v.email,'ระบุอีเมล','email'),{opt:true})}</div></div>`+
  sect('พิกัด')+`<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">${fld('v-lat','ละติจูด',inp('v-lat',v&&v.lat,'เช่น 13.8277','text','inputmode="decimal"'),{opt:true})}${fld('v-lng','ลองจิจูด',inp('v-lng',v&&v.lng,'เช่น 100.5531','text','inputmode="decimal"'),{opt:true})}</div>`+
  sect('เอกสารอ้างอิง')+upload('vdocs','เอกสารที่เกี่ยวข้อง',{opt:true})+
  footBar(`<a class="btn btn-s btn-lg !no-underline" href="${v?`#/vendor/${v.id}/view`:'#/vendor'}">ยกเลิก</a>`,`<button class="btn btn-p btn-lg" type="button" id="v-save">บันทึก</button>`)}
function bindVendorForm(id){const keep={};const ids=['v-name','v-brand','v-addr','v-tel','v-mail','v-lat','v-lng'];bindUploads({vdocs:VF.docs});
  const snap=()=>ids.forEach(i=>keep[i]=$(i).value),restore=()=>ids.forEach(i=>{if(keep[i]!=null)$(i).value=keep[i]});
  const rer=()=>{snap();render();restore()};
  $('v-mt').onclick=e=>{if(e.target.closest('[data-vt]'))return;VF.open=!VF.open;rer();if(VF.open)$('v-mq').focus()};
  document.querySelectorAll('[data-vt]').forEach(b=>b.onclick=()=>{VF.types=VF.types.filter(x=>x!==b.dataset.vt);rer()});
  document.querySelectorAll('[data-vo]').forEach(c=>c.onchange=()=>{const x=c.dataset.vo;VF.types=c.checked?[...VF.types,x]:VF.types.filter(y=>y!==x);rer();$('v-mq')&&$('v-mq').focus()});
  if($('v-mq'))$('v-mq').oninput=()=>{VF.q=$('v-mq').value;rer();const q=$('v-mq');q.focus();q.setSelectionRange(q.value.length,q.value.length)};
  document.onclick=e=>{if(VF&&VF.open&&!e.target.closest('[data-f="v-types"]')){VF.open=false;rer()}};
  $('v-save').onclick=()=>{const g=i=>$(i).value.trim(),lat=g('v-lat'),lng=g('v-lng'),okN=(x,a)=>!x||(!isNaN(+x)&&Math.abs(+x)<=a);
    if(!req([['v-name',g('v-name'),'กรุณาระบุชื่ออู่/ศูนย์บริการ'],['v-lat',okN(lat,90),'ละติจูดต้องเป็นตัวเลขระหว่าง -90 ถึง 90'],['v-lng',okN(lng,180),'ลองจิจูดต้องเป็นตัวเลขระหว่าง -180 ถึง 180']]))return;
    const d={name:g('v-name'),types:VF.types.slice(),brands:g('v-brand'),addr:g('v-addr'),tel:g('v-tel'),email:g('v-mail'),lat,lng,docs:VF.docs};
    let v=id&&id!=='new'?S.vendors.find(x=>x.id===id):null;
    if(v)Object.assign(v,d);else{const n=S.vendors.length+1;v=Object.assign({id:'v'+Date.now(),code:'VND-'+String(n).padStart(3,'0'),prov:'',ratings:[]},d);S.vendors.push(v)}
    save();VF=null;document.onclick=null;go(`#/vendor/${v.id}/view`);toast('บันทึกข้อมูลอู่สำเร็จ')};
}

/* ================= router ================= */
function render(){ohDestroyCharts();const h=(location.hash||'#/').slice(1).split('/').filter(Boolean);let html,bind=()=>{},title='จัดการงาน Overhaul';
  if(!h.length||h[0]==='cars'){if(h[0]==='cars')LS.tab='cars';html=pageList();bind=bindList}
  else if(h[0]==='plan'&&h[1]==='new'){html=pagePlanForm(null);bind=()=>bindPlanForm(null);title='สร้างแผน Overhaul'}
  else if(h[0]==='plan'&&h[2]==='edit'){html=pagePlanForm(h[1]);bind=()=>bindPlanForm(h[1]);title='แก้ไขแผน '+h[1]}
  else if(h[0]==='plan'){html=pagePlan(h[1]);bind=()=>bindPlan(h[1]);title=h[1]}
  else if(h[0]==='po'&&h[1]==='new'){html=pagePoForm(h[2]);bind=()=>bindPoForm(h[2]);title='เพิ่ม Purchase Order'}
  else if(h[0]==='po'&&h[2]==='edit'){const [pp]=poOf(h[1]);html=pp?pagePoForm(pp.id,h[1]):empty('search_off','ไม่พบ Purchase Order','');bind=()=>pp&&bindPoForm(pp.id);title='แก้ไข '+h[1]}
  else if(h[0]==='po'){html=pagePo(h[1]);bind=()=>{if($('po-del'))$('po-del').onclick=()=>delPo(h[1])};title=h[1]}
  else if(h[0]==='vehicle'){html=pageVehicle(h[1]);bind=bindOhVehicleFinance;title=(veh(h[1])||{}).plate||'ยานพาหนะ'}
  else if(h[0]==='job'){html=pageJob(h[1],h[2]);bind=()=>bindJob(h[1],h[2]);title=(veh(h[2])||{}).plate||'งาน'}
  else if(h[0]==='vendor'&&h[2]==='view'){html=pageVendorView(h[1]);title='รายละเอียดอู่/ศูนย์บริการ'}
  else if(h[0]==='vendor'&&h[1]){html=pageVendorForm(h[1]);bind=()=>bindVendorForm(h[1]);title=h[1]==='new'?'เพิ่มอู่/ศูนย์บริการ':'แก้ไขข้อมูลอู่/ศูนย์บริการ'}
  else if(h[0]==='vendor'){html=pageVendors();bind=bindVendors;title='อู่/ศูนย์บริการ'}
  else html=empty('search_off','ไม่พบหน้า','');
  if(h[0]!=='vendor')document.onclick=null;
  const isV=h[0]==='vendor';document.querySelector('.side a[href="#/"]').classList.toggle('on',!isV);$('nv-vendor').classList.toggle('on',isV);
  $('app').innerHTML=html;ohApplyDesignSystem();ohBindReadOnlyFiles();ohBindRoleMenu();document.title=`${title} | Maintain-D`;bind();
}
let lastHash=location.hash;
window.addEventListener('hashchange',()=>{const nh=location.hash;if(!nh.startsWith('#/plan/new')&&!nh.endsWith('/edit'))PF=null;if(!nh.startsWith('#/po/new')&&!(nh.startsWith('#/po/')&&nh.endsWith('/edit')))OF=null;if(!nh.startsWith('#/vendor/')||nh.endsWith('/view'))VF=null;JV=null;lastHash=nh;document.body.classList.remove('modal-open');$('modals').innerHTML='';render();window.scrollTo(0,0)});
render();
