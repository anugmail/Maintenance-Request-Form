/* Source of truth: figma-export/component-rules.json, plugin-lib/core.js,
   overhaul2-plugin/code.js (vehPickSection/poForm) and out/figma-dump.
   Desktop fidelity, 11 Nov 2026. Node values from figma-export/out/figma-dump/component-overhaul/1387-1201443.json:
   A.1 / B.1 / B.7 / E.2 / E.10 / H.1 / I.1 / O.1. Uses actual remote library instance names.
   Page header 69471f2…, Text input ee16342…, Section header 0c9fb1c…, Content item row e8c6107….
   UI Release#2 Contract list / Filter Side panel per existing map. No global CSS changes.
   All role actions remain local to this prototype; no UAT requests. */
function ohPlanEstimate(p){
 const cars=[...new Map((p.cars||[]).map(c=>[c.id,c])).values()];
 if(!cars.length||cars.some(c=>!ohValidMoney(c.ohPrice)))return null;
 return cars.reduce((sum,c)=>sum+c.ohPrice,0);
}
/* figma-export/out/figma-dump/component-overhaul/1387-1201443.json:
   Progress bar, key 7896062a5845c131efe81e39c373d335102da12f, Label=Right, Size=md,
   Percentage=true, gap=8, Track h8/r9999/gray-300, 100%=success-600, text 14/Regular gray-600. */
function ohProgressBar(value,title='ความคืบหน้า'){
 if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>100)return '<span class="text-gray-400" aria-label="ยังไม่มีข้อมูลความคืบหน้า">—</span>';
 const pct=Math.round(value);
 return `<div class="flex items-center gap-2 min-w-[168px]" data-ui-component="Progress bar" data-component-key="7896062a5845c131efe81e39c373d335102da12f" data-label="Right" data-size="md" title="${esc(title)}"><span class="block flex-1 h-2 rounded-full bg-gray-300 overflow-hidden" role="progressbar" aria-label="${esc(title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span class="block h-2 rounded-full ${pct===100?'bg-success-600':'bg-brand-900'}" style="width:${pct}%"></span></span><span class="w-10 shrink-0 text-sm font-normal text-gray-600 tabular-nums text-right" data-progress-text>${pct}%</span></div>`;
}
function ohProgressMarkup(values){
 const known=values.filter(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=100);
 if(!known.length)return '<span class="text-gray-400" aria-label="ยังไม่มีข้อมูลความคืบหน้า">—</span>';
 const pct=Math.round(known.reduce((sum,v)=>sum+v,0)/known.length);
 return ohProgressBar(pct,`เฉลี่ยจากข้อมูลความคืบหน้าที่บันทึก ${known.length} จาก ${values.length} รายการ`);
}
function ohPlanProgress(p){return ohProgressMarkup(ohAllRecords([p]).map(r=>r.pct));}

function ohApplyDesignSystem(){
 const app=$('app'),list=!location.hash||location.hash==='#/'||location.hash==='#/cars';
 app.classList.add('flex','flex-col',list?'gap-6':'gap-8');app.classList.remove(list?'gap-8':'gap-6');
 const crumbs=app.querySelector(':scope > .crumbs'),heading=app.querySelector(':scope > [data-page-heading]');
 if(crumbs&&heading){const header=document.createElement('div');header.className='flex flex-col gap-6';header.dataset.uiComponent='Page header';app.insertBefore(header,crumbs);header.append(crumbs,heading);}
 // Figma section = 30px Section header, 16px to content; sections are 32px apart.
 const parents=[...new Set([...app.querySelectorAll('.sect')].map(n=>n.parentElement))];
 for(const parent of parents){
  const headers=[...parent.children].filter(n=>n.classList.contains('sect'));
  if(parent.tagName==='SECTION'&&headers.length===1){parent.classList.add('flex','flex-col','gap-4');for(const n of parent.children)n.classList.add('!m-0');continue;}
  parent.classList.add('flex','flex-col','gap-8');
  for(const header of headers){
   const group=document.createElement('section');group.className='flex flex-col gap-4 min-w-0';group.dataset.layoutSection='';
   parent.insertBefore(group,header);let node=header;
   while(node){const next=node.nextElementSibling;group.appendChild(node);node.classList.add('!m-0');
    if(!next||next.classList.contains('sect')||next.hasAttribute('data-page-actions')||next.hasAttribute('data-page-heading'))break;
    node=next;
   }
  }
 }
 app.querySelectorAll('[data-page-actions] .btn').forEach(n=>n.classList.add('min-w-[100px]'));
 app.querySelectorAll('.tbl').forEach(t=>{t.dataset.uiComponent='Table';t.querySelectorAll('tbody td').forEach(td=>{td.classList.add('h-14');if(td.querySelector('[data-ui-component="Progress bar"]')){td.dataset.uiComponent='Table cell';td.dataset.uiStyle='Lead Progress Bar';}});t.querySelectorAll('td.num').forEach(td=>td.classList.add('!text-right','!font-normal','tabular-nums'));t.querySelectorAll('th.num').forEach(th=>th.classList.add('!text-right'));});
 app.querySelectorAll('.wsteps').forEach(n=>{n.dataset.uiComponent='Progress steps';n.classList.add('!m-0');n.querySelectorAll('.wstep').forEach(step=>step.classList.add('!gap-2'));});
 app.querySelectorAll('[data-up] > label:not(.fu)').forEach(n=>n.classList.add('!text-md','!leading-6','!font-semibold','!text-gray-600','!mb-2'));
 app.querySelectorAll('.f input:not([type=radio]):not([type=checkbox]):not([type=file]), .f select, .f textarea').forEach(n=>n.classList.add('!text-md','!leading-6'));
 app.querySelectorAll('.f > label:not(.fu)').forEach(n=>n.classList.add('!text-md','!leading-6','!font-semibold','!text-gray-600','!mb-2'));
 // Modal File upload / text controls still use shared class definitions when opened dynamically.
}
function ohIsDetailView(){const h=(location.hash||'#/').slice(1).split('/').filter(Boolean);return (['plan','po'].includes(h[0])&&h[1]&&h[1]!=='new'&&h[2]!=='edit')||h[0]==='vehicle'||(h[0]==='job'&&JV?.view===7);}
const OH_ROLES={kbk:'กบค.',unit:'หน่วยงานเจ้าของรถ',approver:'ผู้บังคับบัญชา'};
function ohBindRoleMenu(){
 const trigger=$('oh-profile');if(!trigger)return;
 $('oh-role-label').textContent=OH_ROLES[S.viewerRole]||OH_ROLES.kbk;
 trigger.onclick=()=>{$('modals').innerHTML='';modal('m-role','md','บทบาทผู้ใช้งาน','เลือกบทบาทที่ต้องการใช้งาน',fld('oh-role','บทบาท',sel('oh-role',S.viewerRole||'kbk',Object.entries(OH_ROLES))),`<div class="modal-ft-r"><button class="btn btn-s" type="button" data-close="m-role">ยกเลิก</button><button class="btn btn-p" type="button" id="oh-role-ok">ยืนยัน</button></div>`);
  $('oh-role-ok').onclick=()=>{S.viewerRole=$('oh-role').value;save();oh2Modal('m-role',false);render();};oh2Modal('m-role',true);
 };
}
function ohReadOnlyFiles(files){
 if(!files.length)return '<span class="text-sm text-gray-500">—</span>';
 return `<div class="fu-list" data-ui-component="_File upload item base">${files.map(f=>`<div class="fu-item"><span class="ficon sm gray"><span class="ms">${/\.pdf$/i.test(f.name)?'picture_as_pdf':'image'}</span></span><span class="fu-item-tx"><b>${esc(f.name)}</b><small>${oh2Size(f.size)}</small></span><span class="fu-item-act"><button class="btn btn-t btn-icon" type="button" data-oh-open-file="${esc(f.token||f.name)}" aria-label="เปิดไฟล์ ${esc(f.name)}"><span class="ms">visibility</span></button><button class="btn btn-t btn-icon" type="button" data-oh-download-file="${esc(f.token||f.name)}" aria-label="ดาวน์โหลด ${esc(f.name)}"><span class="ms">download</span></button></span></div>`).join('')}</div>`;
}
function ohBindReadOnlyFiles(){
 document.querySelectorAll('[data-oh-open-file],[data-oh-download-file]').forEach(b=>b.onclick=()=>{
  const download=b.dataset.ohDownloadFile,token=download||b.dataset.ohOpenFile,file=ohRuntimeFiles.get(token);
  if(!file){toast('ไม่พบไฟล์แนบ',{err:true,sub:'กรุณาแนบไฟล์อีกครั้งเพื่อเปิดดูหรือดาวน์โหลด'});return;}
  const url=URL.createObjectURL(file);if(download){const a=document.createElement('a');a.href=url;a.download=file.name;a.click();}else window.open(url,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(url),60000);
 });
}

function ohOperatingValue(v,key,unit){const actual=window.OH_A5_UAT?.vehicles.find(c=>c.plate===v.plate),value=v[key]??actual?.[key];return typeof value==='number'&&Number.isFinite(value)?value.toLocaleString('en-US')+' '+unit:'—';}
