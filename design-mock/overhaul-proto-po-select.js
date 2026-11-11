/* B.1/E.2: figma-export/overhaul2-plugin/code.js vehPickSection/vehPickerModal (R92).
   Main form shows selected vehicles only. Add opens the shared xl Modal with a checkbox Table.
   Owner override: all plans can choose from the existing 18-vehicle master, including empty plans.
   Popup changes are drafts; only confirming the popup changes form selection. Saving the form
   remains the only operation that changes the stored plan/Purchase order. */
function ohVehicleSelectionContext(){
 if(!/^#\/plan\/(?:new|[^/]+\/edit)$/.test(location.hash))return OF;
 return {kind:'plan',get cars(){return PF.cars.map(c=>c.id);},set cars(ids){const p=planOf(PF.id),locked=p?p.pos.flatMap(o=>o.cars):[];PF.cars=[...new Set([...ids,...locked])].map(id=>PF.cars.find(c=>c.id===id)||PF.priceDraft?.[id]||{id,refPrice:null,ohPrice:null,note:''});},get priceDraft(){return PF.priceDraft;},set priceDraft(v){PF.priceDraft=v;}};
}
function ohPoSelectedPrice(p,id){const ctx=ohVehicleSelectionContext();return ctx.priceDraft?.[id]||(ctx.kind==='plan'?PF.cars:p.cars).find(c=>c.id===id)||{id,refPrice:null,ohPrice:null};}
function ohVehicleLocked(id){return ohVehicleSelectionContext().kind==='plan'&&!!planOf(PF.id)?.pos.some(o=>o.cars.includes(id));}
const ohAddVehicleButton=()=>'<button class="btn btn-s" id="po-vadd" type="button"><span class="ms">add</span>เพิ่มรถ</button>';
function ohPoVehicleSelection(p){
 const ctx=ohVehicleSelectionContext(),planMode=ctx.kind==='plan',rows=ctx.cars.map(veh).filter(Boolean);
 const missing=`<div data-f="${planMode?'p-cars':'o-cars'}"><div class="help hidden"></div></div>`;
 if(!rows.length)return missing+empty('directions_car',planMode?'ยังไม่มีรถในแผน':'ยังไม่ได้เลือกรถ','เพิ่มรถที่จะเข้า Overhaul', '<button class="btn btn-p" id="po-vadd" type="button"><span class="ms">add</span>เพิ่มรถ</button>');
 return missing+`<div class="tblwrap !m-0"><table class="tbl striped" id="po-selected-vehicles" data-ui-component="Table"><thead><tr><th>ทะเบียน</th><th>ข้อมูลรถ</th><th class="num">อายุการใช้งาน</th><th class="num">ราคาจริง (บาท)</th>${planMode?'<th class="num">ราคากลาง (บาท)</th>':''}<th class="num">ประเมิน Overhaul (บาท)</th>${planMode?'<th>หมายเหตุ</th>':''}<th class="w-[56px]" aria-label="จัดการรถ"></th></tr></thead><tbody>${rows.map(v=>{const c=ohPoSelectedPrice(p,v.id);return `<tr><td class="cell-key whitespace-nowrap">${esc(v.plate)}</td><td>${esc(v.model)}<div class="cell-sub">${esc(v.type)} · ${esc(v.dept)}</div></td><td class="num whitespace-nowrap">${ageText(v.ageM)}</td><td class="num" data-po-money="acquisition">${money(v.acq)}</td>${planMode?`<td class="num" data-po-money="reference">${money(c.refPrice)}</td>`:''}<td class="num" data-po-money="estimate">${money(c.ohPrice)}</td>${planMode?`<td>${esc(c.note)||'—'}</td>`:''}<td>${planMode?oh2Menu('จัดการรถ '+v.plate,[{attr:`data-po-vview="${v.id}"`,icon:'visibility',label:'ดูรายละเอียดรถ'},{attr:`data-po-vprice="${v.id}"`,icon:'edit',label:'แก้ไขราคา'},...(!ohVehicleLocked(v.id)?[{attr:`data-po-vremove="${v.id}"`,icon:'delete',label:'นำรถออก'}]:[])]):`<button class="btn btn-t btn-icon" type="button" data-po-vremove="${v.id}" aria-label="นำรถ ${esc(v.plate)} ออก"><span class="ms">delete</span></button>`}</td></tr>`;}).join('')}</tbody></table></div>`;
}
let OH_VEH_PICKER=null;
function ohPoPickerState(){return OH_VEH_PICKER;}
function ohPoAvailableRows(){const s=OH_VEH_PICKER,q=s.query.trim().toLowerCase(),f=s.filters;return PX_VEH.filter(v=>(!q||[v.plate,v.brand,v.model,v.type,v.dept].join(' ').toLowerCase().includes(q))&&(!f.brand||v.brand===f.brand)&&(!f.type||v.type===f.type)&&(!f.dept||v.dept===f.dept)&&(!f.age||v.ageM>=Number(f.age)*12));}
function ohVehiclePickerBody(){
 const s=OH_VEH_PICKER,rows=ohPoAvailableRows(),pages=Math.max(1,Math.ceil(rows.length/s.per));s.page=Math.min(s.page,pages);
 const shown=rows.slice((s.page-1)*s.per,s.page*s.per),selected=shown.filter(v=>s.ids.includes(v.id)).length,filters=Object.entries(s.filters).filter(([,v])=>v);
 const dropdown=(key,label,values)=>fld('po-vf-'+key,label,sel('po-vf-'+key,s.filterDraft[key],[['','ทั้งหมด'],...values]));
 return `<div class="list-toolbar split !m-0" data-ui-component="Table header"><div class="lt-search !basis-[415px]"><div class="search"><span class="ms">search</span><input id="po-vq" type="search" value="${esc(s.query)}" placeholder="ค้นหาทะเบียน, ยี่ห้อ/รุ่น, ประเภท, สังกัด" aria-label="ค้นหารถ"></div></div><div class="lt-actions"><button class="btn btn-s" id="po-vfilter" type="button" aria-expanded="${s.filterOpen}"><span class="ms">filter_list</span>ตัวกรอง${filters.length?`<span class="badge b-brand">${filters.length}</span>`:''}</button></div></div>`+
 (s.filterOpen?`<div class="flex flex-col gap-4" data-picker-filter><div class="grid grid-cols-1 md:grid-cols-4 gap-4">${dropdown('type','ประเภทรถ',[...new Set(PX_VEH.map(v=>v.type))].sort())}${dropdown('brand','ยี่ห้อ',[...new Set(PX_VEH.map(v=>v.brand))].sort())}${dropdown('dept','สังกัด',[...new Set(PX_VEH.map(v=>v.dept))].sort())}${dropdown('age','อายุการใช้งาน',[['10','10 ปีขึ้นไป'],['15','15 ปีขึ้นไป']])}</div><div class="flex justify-end gap-3"><button class="btn btn-link mr-auto" id="po-vfilter-clear" type="button">ล้างตัวกรอง</button><button class="btn btn-s" id="po-vfilter-cancel" type="button">ยกเลิก</button><button class="btn btn-p" id="po-vfilter-apply" type="button">ตกลง</button></div></div>`:'')+
 (filters.length?`<div class="fchips">${filters.map(([k,v])=>`<span class="fchip">${esc(k==='age'?v+' ปีขึ้นไป':v)}<button class="fchip-x" type="button" data-po-vclear="${k}" aria-label="ล้างตัวกรอง ${esc(v)}"><span class="ms">close_small</span></button></span>`).join('')}</div>`:'')+
 (rows.length?`<div class="tblwrap !m-0"><table class="tbl striped" id="po-vehicles-table" data-ui-component="Table"><thead><tr><th><label class="flex items-center gap-3"><input type="checkbox" id="po-vall" aria-label="เลือกรถทั้งหมดในหน้านี้"${selected===shown.length?' checked':''}>ทะเบียน</label></th><th>ข้อมูลรถ</th><th class="num">อายุการใช้งาน</th><th class="num">ราคาจริง (บาท)</th></tr></thead><tbody>${shown.map(v=>`<tr><td><label class="flex items-center gap-3"><input class="po-vcheck" type="checkbox" value="${v.id}"${s.ids.includes(v.id)?' checked':''}${ohVehicleLocked(v.id)?' disabled title="รถอยู่ใน Purchase order แล้ว"':''} aria-label="เลือก ${esc(v.plate)}"><span class="cell-key whitespace-nowrap">${esc(v.plate)}</span></label></td><td>${esc(v.model)}<div class="cell-sub">${esc(v.type)} · ${esc(v.dept)}</div></td><td class="num whitespace-nowrap">${ageText(v.ageM)}</td><td class="num">${money(v.acq)}</td></tr>`).join('')}</tbody></table><div class="tblfoot"><div class="tf-left"><span>แสดง ${(s.page-1)*s.per+1} ถึง ${Math.min(s.page*s.per,rows.length)} จาก ${rows.length} รายการ</span><select class="select-inline" id="po-vper" aria-label="จำนวนรถต่อหน้า">${[10,25,50].map(n=>`<option${s.per===n?' selected':''}>${n}</option>`).join('')}</select></div><div class="pager"><button class="pg" type="button" data-po-vpage="${s.page-1}"${s.page===1?' disabled':''} aria-label="หน้าก่อนหน้า"><span class="ms">chevron_left</span></button>${Array.from({length:pages},(_,i)=>`<button class="pg${s.page===i+1?' on':''}" type="button" data-po-vpage="${i+1}">${i+1}</button>`).join('')}<button class="pg" type="button" data-po-vpage="${s.page+1}"${s.page===pages?' disabled':''} aria-label="หน้าถัดไป"><span class="ms">chevron_right</span></button></div></div></div>`:empty('search_off','ไม่พบรถ','ไม่มีรถที่ตรงกับคำค้นหรือตัวกรอง','<button class="btn btn-s" id="po-vreset" type="button">ล้างคำค้นและตัวกรอง</button>'));
}
function ohRedrawVehiclePicker(){
 const s=OH_VEH_PICKER;$('m-vehicle-picker-b').innerHTML=ohVehiclePickerBody();
 const ok=$('po-vconfirm');ok.textContent=s.ids.length?`เพิ่มรถ (${s.ids.length})`:'เพิ่มรถ';ok.disabled=!s.ids.length;
 $('m-vehicle-picker-b').querySelectorAll('.tbl td.num').forEach(el=>el.classList.add('!text-right','!font-normal','tabular-nums'));
 $('m-vehicle-picker-b').querySelectorAll('.tbl th.num').forEach(el=>el.classList.add('!text-right'));
 $('m-vehicle-picker-b').querySelectorAll('.tbl tbody td').forEach(el=>el.classList.add('h-14'));
 $('po-vq').oninput=e=>{const value=e.target.value;s.query=value;s.page=1;ohRedrawVehiclePicker();$('po-vq').focus();$('po-vq').setSelectionRange(value.length,value.length);};
 $('po-vfilter').onclick=()=>{s.filterOpen=!s.filterOpen;s.filterDraft={...s.filters};ohRedrawVehiclePicker();};
 if(s.filterOpen){
  ['brand','type','dept','age'].forEach(k=>$('po-vf-'+k).onchange=e=>s.filterDraft[k]=e.target.value);
  $('po-vfilter-clear').onclick=()=>{s.filterDraft={brand:'',type:'',dept:'',age:''};ohRedrawVehiclePicker();};
  $('po-vfilter-cancel').onclick=()=>{s.filterOpen=false;s.filterDraft={...s.filters};ohRedrawVehiclePicker();};
  $('po-vfilter-apply').onclick=()=>{s.filters={...s.filterDraft};s.page=1;s.filterOpen=false;ohRedrawVehiclePicker();};
 }
 document.querySelectorAll('[data-po-vclear]').forEach(b=>b.onclick=()=>{s.filters[b.dataset.poVclear]='';s.filterDraft={...s.filters};s.page=1;ohRedrawVehiclePicker();});
 if($('po-vreset'))$('po-vreset').onclick=()=>{s.query='';s.filters={brand:'',type:'',dept:'',age:''};s.filterDraft={...s.filters};s.page=1;ohRedrawVehiclePicker();};
 document.querySelectorAll('.po-vcheck').forEach(c=>c.onchange=()=>{s.ids=c.checked?[...new Set([...s.ids,c.value])]:s.ids.filter(id=>id!==c.value);ohRedrawVehiclePicker();});
 if($('po-vall')){const shown=ohPoAvailableRows().slice((s.page-1)*s.per,s.page*s.per);const n=shown.filter(v=>s.ids.includes(v.id)).length;$('po-vall').indeterminate=n>0&&n<shown.length;$('po-vall').onchange=e=>{const ids=new Set(shown.filter(v=>!ohVehicleLocked(v.id)).map(v=>v.id));s.ids=e.target.checked?[...new Set([...s.ids,...ids])]:s.ids.filter(id=>!ids.has(id));ohRedrawVehiclePicker();};}
 document.querySelectorAll('[data-po-vpage]').forEach(b=>b.onclick=()=>{if(b.disabled)return;s.page=+b.dataset.poVpage;ohRedrawVehiclePicker();});
 if($('po-vper'))$('po-vper').onchange=e=>{s.per=+e.target.value;s.page=1;ohRedrawVehiclePicker();};
}
function ohOpenVehiclePicker(p,readForm){
 readForm();const ctx=ohVehicleSelectionContext(),filters={brand:'',type:'',dept:'',age:''};
 OH_VEH_PICKER={ids:ctx.cars.slice(),query:'',page:1,per:10,filters,filterDraft:{...filters},filterOpen:false};
 $('modals').innerHTML='';modal('m-vehicle-picker','xl',ctx.kind==='plan'?'เพิ่มรถเข้าแผน':'เพิ่มรถเข้า Purchase Order','', '', '<div class="modal-ft-r"><button class="btn btn-s" data-close="m-vehicle-picker" type="button">ยกเลิก</button><button class="btn btn-p" id="po-vconfirm" type="button" disabled>เพิ่มรถ</button></div>');
 $('m-vehicle-picker-b').classList.add('!gap-4');
 $('po-vconfirm').onclick=()=>{if(!OH_VEH_PICKER.ids.length)return;ctx.cars=OH_VEH_PICKER.ids.slice();oh2Modal('m-vehicle-picker',false);OH_VEH_PICKER=null;render();};
 ohRedrawVehiclePicker();oh2Modal('m-vehicle-picker',true);
}
function ohBindPoVehicleSelection(p,readForm){
 $('po-vadd').onclick=()=>ohOpenVehiclePicker(p,readForm);
 document.querySelectorAll('[data-po-vremove]').forEach(b=>b.onclick=()=>{readForm();const ctx=ohVehicleSelectionContext();if(ohVehicleLocked(b.dataset.poVremove))return;ctx.cars=ctx.cars.filter(id=>id!==b.dataset.poVremove);render();});
 document.querySelectorAll('[data-po-vview]').forEach(b=>b.onclick=()=>window.open('overhaul-proto.html#/vehicle/'+b.dataset.poVview,'_blank','noopener'));
 document.querySelectorAll('[data-po-vprice]').forEach(b=>b.onclick=()=>{readForm();const id=b.dataset.poVprice,draft={...ohPoSelectedPrice(p,id)};priceModal(draft,()=>{const ctx=ohVehicleSelectionContext();ctx.priceDraft=ctx.priceDraft||{};ctx.priceDraft[id]=draft;if(ctx.kind==='plan'){const selected=PF.cars.find(c=>c.id===id);if(selected)Object.assign(selected,draft);}});});
}
