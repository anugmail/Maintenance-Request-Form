/* A.5 + Q.3, overhaul-v1.pdf. Existing VMS Plus Card / Table / Text input / Input dropdown /
   Secondary & Tertiary button / Modal / Pill outline / Empty state / Progress bar.
   UI Release#2: Contract list, Filter Side panel, MA Overview. Charts use locally bundled Chart.js 4.4.8.
   One agreed layout on the existing prototype route; all amounts are local mock entries or —.
   Reporting unit is (plan, vehicle), deduplicated across POs; multiple plans remain separate jobs. */
const ohValidMoney=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
const ohYears=()=>[...new Set(S.plans.map(p=>String(p.year)))].sort().reverse();
const ohProgressLabel=k=>({complete:'ซ่อมครบ 100%',tracked:'มีข้อมูลความคืบหน้า',unknown:'ยังไม่มีข้อมูลความคืบหน้า'}[k]||k);
function ohRecordedCost(j){
  if(!j||j.stage<7||!ohValidMoney(j.labor)||!j.parts||!Array.isArray(j.parts.body)||!Array.isArray(j.parts.tool))return null;
  if(j.otherCost!==''&&j.otherCost!=null&&!ohValidMoney(j.otherCost))return null;
  const parts=[...j.parts.body,...j.parts.tool];
  if(parts.some(x=>!ohValidMoney(x.price)||!Number.isFinite(x.qty)||x.qty<0))return null;
  return j.labor+(j.otherCost||0)+parts.reduce((n,x)=>n+x.qty*x.price,0);
}
function ohApprovedCost(j){return j?.stage===9?ohRecordedCost(j):null;}
function ohAllRecords(plans=S.plans){
  const out=[];
  plans.forEach(p=>{const ids=new Set(p.pos.flatMap(o=>o.cars));ids.forEach(id=>{
    const v=veh(id);if(!v)return;
    const pc=p.cars.find(c=>c.id===id)||{},pos=p.pos.filter(o=>o.cars.includes(id));
    const jobs=pos.map(o=>S.jobs[o.id+':'+id]||{stage:1});
    const pcts=jobs.map(jobPct),costs=jobs.map(ohRecordedCost),approved=jobs.map(ohApprovedCost);
    out.push({key:p.id+':'+id,v,plan:p,pos:pos.map(o=>o.id),ref:pc.refPrice,oh:pc.ohPrice,pc,
      acquisition:ohValidMoney(v.acq)?v.acq:null,
      overhaulCost:costs.length&&costs.every(ohValidMoney)?costs.reduce((n,c)=>n+c,0):null,
      approved:approved.length&&approved.every(ohValidMoney)?approved.reduce((n,c)=>n+c,0):null,
      pct:pcts.every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=100)?Math.min(...pcts):null,job:[pos[0].id,id]});
  });});return out;
}
function ohReportRows(){const F=LS.F.cars,q=LS.q.cars.trim().toLowerCase();return ohAllRecords().filter(r=>
  (!F.year||String(r.plan.year)===F.year)&&(!F.plan||r.plan.id===F.plan)&&
  (!F.brand||r.v.brand===F.brand)&&(!F.model||r.v.model===F.model)&&(!F.type||r.v.type===F.type)&&
  (!q||[r.v.plate,r.v.brand,r.v.model,r.plan.id,r.plan.name].join(' ').toLowerCase().includes(q))&&
  (!F.progress||(F.progress==='unknown'?r.pct==null:F.progress==='complete'?r.pct===100:r.pct!=null)));}
function ohFinance(rows,basis=LS.basis){
  const costKey=basis==='approved'?'approved':'oh',eligible=rows.filter(r=>ohValidMoney(r.ref)&&ohValidMoney(r[costKey]));
  const reference=eligible.reduce((n,r)=>n+r.ref,0),cost=eligible.reduce((n,r)=>n+r[costKey],0);
  return {eligible,known:eligible.length,total:rows.length,reference:eligible.length?reference:null,cost:eligible.length?cost:null,
    net:eligible.length?reference-cost:null,average:eligible.length?(reference-cost)/eligible.length:null,
    percent:eligible.length&&reference>0?(reference-cost)/reference*100:null};
}
const ohPercent=n=>n==null?'—':n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
const ohCostLabel=()=>LS.basis==='approved'?'ค่าใช้จ่ายที่อนุมัติแล้ว':'ประเมิน Overhaul';
const ohNetLabel=()=>LS.basis==='approved'?'ส่วนต่างเทียบราคากลางหลังอนุมัติ':'ส่วนต่างประมาณการเทียบราคากลาง';
/* Layout from figma-export executiveGraphs; all values use the same filtered table rows. */
const OH_CHARTS=[];
function ohDestroyCharts(){while(OH_CHARTS.length)OH_CHARTS.pop().destroy();}
function ohGroups(rows,key){const g=new Map();rows.forEach(r=>{const name=r.v[key];if(!g.has(name))g.set(name,new Set());g.get(name).add(r.v.id);});return [...g].map(([label,ids])=>[label,ids.size]).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'th'));}
function ohDashboard(R){
 const f=ohFinance(R),tracked=R.filter(r=>r.pct!=null),avg=tracked.length?Math.round(tracked.reduce((n,r)=>n+r.pct,0)/tracked.length*10)/10:null;
 const unique=new Set(R.map(r=>r.v.id)).size,types=ohGroups(R,'type'),brands=ohGroups(R,'brand');
 const card=(title,caption,span,body)=>`<section class="card !p-6 !m-0 !rounded-2xl min-h-[360px] flex flex-col min-w-0 ${span}" data-oh-chart><h2 class="!text-[18px] !mb-0">${title}</h2><p class="text-xs text-gray-500 mt-1">${caption}</p>${body}</section>`;
 const canvas=(id,label)=>`<canvas id="${id}" role="img" aria-label="${esc(label)}">${esc(label)}</canvas>`;
 const acquisitionCars=[...new Map(R.map(r=>[r.v.id,r])).values()].filter(r=>r.acquisition!=null);
 const acquisitionTotal=acquisitionCars.reduce((n,r)=>n+r.acquisition,0);
 window.ohDashboardState={basis:'estimate',year:LS.F.cars.year,plan:LS.F.cars.plan,rows:R.map(r=>r.key),uniqueVehicles:unique,known:f.known,total:f.total,reference:f.reference,cost:f.cost,net:f.net,average:f.average,percent:f.percent,progress:avg,tracked:tracked.length,types,brands,acquisitionTotal,acquisitionKnown:acquisitionCars.length};
 return `<div class="grid grid-cols-1 lg:grid-cols-12 gap-6" data-oh-dashboard>`+
 card('ความคุ้มค่าของการ Overhaul','เปรียบเทียบราคากลางกับราคาประเมินของรถในตาราง','lg:col-span-7',`<div class="mt-5"><p class="text-[30px] leading-tight font-semibold text-brand-900 tabular-nums">${money(f.reference)} บาท</p><p class="text-sm text-gray-500 mt-1">ราคากลางรวมของรายการที่มีราคาครบทั้งสองค่า</p></div><div class="relative h-[156px] mt-5">${canvas('oh-chart-finance',`ราคากลาง ${money(f.reference)} บาท · ประเมิน Overhaul ${money(f.cost)} บาท`)}</div><div class="mt-auto pt-4 flex flex-wrap items-center justify-between gap-2"><p class="text-xs text-gray-500">ราคา: ข้อมูลตัวอย่าง · รวมจากรถในตาราง</p><button id="oh-method" type="button" class="btn btn-link btn-sm">ที่มาและวิธีคำนวณ</button></div>`)+
 card('ความคืบหน้างาน',`ค่าเฉลี่ยรายการที่มีข้อมูล · ${tracked.length}/${R.length} รายการ`,'lg:col-span-5',`<div class="flex items-center gap-8 flex-1 mt-5"><div class="relative w-[220px] h-[220px] max-w-[58%] shrink-0">${canvas('oh-chart-progress',`ความคืบหน้าเฉลี่ย ${avg==null?'ไม่มีข้อมูล':avg+'%'}`)}</div><div class="flex flex-col gap-8">${[['complete',tracked.filter(r=>r.pct===100).length,'รายการที่ถึง 100%','text-success-600'],['unknown',R.length-tracked.length,'รายการยังไม่มีข้อมูล','text-gray-500']].map(([key,n,label,color])=>`<button class="btn btn-t !h-auto !min-h-0 !p-0 !block !text-left !font-normal" type="button" data-oh-progress="${key}"><strong class="block text-[30px] leading-tight ${color}">${n}</strong><span class="block text-sm text-gray-500 mt-1">${label}</span></button>`).join('')}</div></div><p class="text-xs text-gray-500 mt-5">เฉลี่ยจาก % ในตาราง · ข้อมูลที่ขาดไม่ถูกนับเป็น 0%</p>`)+
 card('ประเภทรถที่ Overhaul','Polar Area · จำนวนรถไม่ซ้ำตามตัวกรอง','lg:col-span-6',`<div class="flex flex-wrap sm:flex-nowrap items-center gap-6 mt-5 flex-1"><div class="relative w-[220px] h-[220px] max-w-[45%] shrink-0">${canvas('oh-chart-types',types.map(([label,n])=>label+' '+n+' คัน').join(' · ')||'ไม่มีข้อมูลประเภทรถ')}</div><div class="flex flex-col gap-3 flex-1 min-w-0">${types.map(([label,n],i)=>`<button class="btn btn-t !h-auto !min-h-0 !p-0 !justify-start !font-normal !text-sm !text-gray-600 !w-full" type="button" data-oh-group="type" data-value="${esc(label)}" aria-pressed="${LS.F.cars.type===label}"><span class="w-2.5 h-2.5 rounded shrink-0" style="background:${PAL[i%PAL.length]}"></span><span class="text-left flex-1">${esc(label)}</span><strong class="text-gray-900 whitespace-nowrap">${n} คัน</strong></button>`).join('')||'<p class="text-sm text-gray-500">ไม่มีข้อมูลตามตัวกรอง</p>'}</div></div><p class="text-xs text-gray-500 mt-5">วงนอก = ${Math.max(0,...types.map(t=>t[1]))} คัน · ${types.length} ประเภทรถ · กดกราฟหรือชื่อเพื่อกรอง</p>`)+
 card('ยี่ห้อที่ Overhaul บ่อยที่สุด','จำนวนรถไม่ซ้ำตามตัวกรองเดียวกับตาราง','lg:col-span-6',`<div class="relative h-[230px] mt-5">${canvas('oh-chart-brands',brands.slice(0,4).map(([label,n])=>label+' '+n+' คัน').join(' · ')||'ไม่มีข้อมูลยี่ห้อรถ')}</div><div class="sr-only focus-within:not-sr-only">${brands.slice(0,4).map(([label,n])=>`<button type="button" class="btn btn-t" data-oh-group="brand" data-value="${esc(label)}">กรอง ${esc(label)} ${n} คัน</button>`).join('')}</div><p class="text-xs text-gray-500 mt-auto pt-5">แสดงสูงสุด 4 อันดับ · กดแท่งกราฟเพื่อกรองตาราง</p>`)+`</div>`;
}
function ohMountCharts(){
 const R=carRows(),state=window.ohDashboardState,f=ohFinance(R),types=state.types,brands=state.brands.slice(0,4);
 const token=name=>getComputedStyle(document.documentElement).getPropertyValue('--'+name).trim();
 const colors=['brand-900','info-600','success-600','brand-600','gray-400'].map(token),gray=token('gray-200'),muted=token('gray-500'),ink=token('gray-900');
 const font="'IBM Plex Sans Thai', sans-serif";
 const common={responsive:true,maintainAspectRatio:false,animation:false,font:{family:font},plugins:{legend:{display:false},tooltip:{titleFont:{family:font},bodyFont:{family:font}}}};
 const make=(id,type,data,options={},plugins=[])=>{const el=$(id);if(!el)return;const c=new Chart(el,{type,data,options:{...common,...options,plugins:{...common.plugins,...options.plugins}},plugins});OH_CHARTS.push(c);return c;};
 const noData={id:'ohNoData',afterDraw(chart){if(!chart.data.datasets[0]?.data.length){const {ctx,chartArea:a}=chart;ctx.save();ctx.fillStyle=muted;ctx.font='14px '+font;ctx.textAlign='center';ctx.fillText('ไม่มีข้อมูลตามตัวกรอง',(a.left+a.right)/2,(a.top+a.bottom)/2);ctx.restore();}}};
 const barLabels=(labels,values,finance=false)=>({id:finance?'ohFinanceLabels':'ohBrandLabels',beforeDatasetsDraw(chart){const {ctx,chartArea:a}=chart;ctx.save();chart.getDatasetMeta(0).data.forEach(bar=>{ctx.fillStyle=token('gray-100');ctx.beginPath();ctx.roundRect(a.left,bar.y-(finance?9:4),a.right-a.left,finance?18:8,9);ctx.fill();});ctx.restore();},afterDatasetsDraw(chart){const {ctx,chartArea:a}=chart;ctx.save();chart.getDatasetMeta(0).data.forEach((bar,i)=>{ctx.textBaseline='bottom';ctx.fillStyle=finance?muted:ink;ctx.font=(finance?'':'600 ')+'14px '+font;ctx.textAlign='left';ctx.fillText(labels[i],a.left,bar.y-17);ctx.textAlign='right';ctx.fillStyle=ink;ctx.font='600 14px '+font;ctx.fillText(finance?money(values[i])+' บาท':values[i]+' คัน',a.right,bar.y-17);if(!finance){ctx.textAlign='left';ctx.fillStyle=muted;ctx.font='14px '+font;ctx.fillText(String(i+1).padStart(2,'0'),a.left-40,bar.y-17);}});ctx.restore();}});
 const financeValues=[f.reference,f.cost];
 make('oh-chart-finance','bar',{labels:['ราคากลาง','ประเมิน Overhaul'],datasets:[{data:financeValues,backgroundColor:[colors[1],colors[0]],barThickness:18,borderRadius:20,borderSkipped:false}]},{indexAxis:'y',layout:{padding:{top:18,bottom:0}},scales:{x:{display:false,min:0,max:Math.max(1,...financeValues.filter(ohValidMoney))},y:{display:false}},plugins:{tooltip:{callbacks:{label:c=>c.label+': '+money(c.raw)+' บาท'}}}},[barLabels(['ราคากลาง','ประเมิน Overhaul'],financeValues,true)]);
 const avg=state.progress;
 const center={id:'ohProgressCenter',afterDraw(chart){const {ctx,chartArea:a}=chart,x=(a.left+a.right)/2,y=(a.top+a.bottom)/2;ctx.save();ctx.fillStyle=ink;ctx.textAlign='center';ctx.font='600 38px '+font;ctx.fillText(avg==null?'—':avg+'%',x,y+5);ctx.fillStyle=muted;ctx.font='14px '+font;ctx.fillText('เฉลี่ย',x,y+32);ctx.restore();}};
 make('oh-chart-progress','doughnut',{labels:['ความคืบหน้าเฉลี่ย','ส่วนที่เหลือ'],datasets:[{data:[avg||0,100-(avg||0)],backgroundColor:[colors[0],gray],borderWidth:0,hoverOffset:0}]},{cutout:'80%',plugins:{tooltip:{enabled:avg!=null,callbacks:{label:c=>c.label+': '+c.raw+'%'}}}},[center]);
 const groupClick=(key,items)=>(event,elements)=>{if(!elements.length)return;const label=items[elements[0].index]?.[0];if(label){LS.F.cars[key]=LS.F.cars[key]===label?'':label;requestAnimationFrame(()=>render());}};
 make('oh-chart-types','polarArea',{labels:types.map(x=>x[0]),datasets:[{data:types.map(x=>x[1]),backgroundColor:types.map((_,i)=>colors[i%colors.length]+'D1'),borderWidth:1,borderColor:token('gray-25')}]},{scales:{r:{min:0,max:Math.max(1,...types.map(x=>x[1])),ticks:{display:false,stepSize:1},grid:{color:gray},angleLines:{display:false},pointLabels:{display:false}}},onClick:groupClick('type',types),plugins:{tooltip:{callbacks:{label:c=>c.label+': '+c.raw+' คัน'}}}},[noData]);
 const brandValues=brands.map(x=>x[1]);
 make('oh-chart-brands','bar',{labels:brands.map(x=>x[0]),datasets:[{data:brandValues,backgroundColor:brands.map((_,i)=>colors[i%colors.length]),barThickness:8,borderRadius:20,borderSkipped:false}]},{indexAxis:'y',layout:{padding:{left:40,top:24,bottom:0}},scales:{x:{display:false,min:0,max:Math.max(1,...brandValues)},y:{display:false}},onClick:groupClick('brand',brands),plugins:{tooltip:{callbacks:{label:c=>c.label+': '+c.raw+' คัน'}}}},[barLabels(brands.map(x=>x[0]),brandValues),noData]);
 document.fonts.ready.then(()=>OH_CHARTS.forEach(c=>c.update('none')));
}
function ohMethod(){
 const rows=carRows(),f=ohFinance(rows),tracked=rows.filter(r=>r.pct!=null),state=window.ohDashboardState;
 const source=(c,k)=>c.priceSources?.[k]==='example-20261111'?'ราคาตัวอย่างที่เติมเพื่อสาธิต':c.priceSource==='local-entry'||c.priceSources?.[k]==='local-entry'?'ผู้ใช้บันทึกในแผน':'ข้อมูลที่บันทึกในแผน';
 $('modals').innerHTML='';modal('m-fin-method','xl','ที่มาและวิธีคำนวณ','ใช้ข้อมูลชุดเดียวกับตารางและตัวกรองปัจจุบัน',
 `<div class="flex flex-col gap-6 text-sm text-gray-700"><dl class="flex flex-col gap-4"><div><dt class="font-semibold">แผนและทะเบียนรถ</dt><dd>อ้างอิง snapshot UAT ใน overhaul-a5-uat-data.js; สถานะงานและรายการค่าใช้จ่ายเป็นข้อมูลตัวอย่างของ prototype</dd></div><div><dt class="font-semibold">ราคากลาง / ประเมิน Overhaul</dt><dd>ราคากลางเป็นตัวอย่างราคารถทดแทนประเภทเดียวกัน; ราคาประเมินเป็นตัวอย่างค่าซ่อมตามขอบเขตงาน รวมทุก Purchase Order ของรถคันนั้นในแผน ยังไม่ใช่ราคาประกาศจัดซื้อหรือใบเสนอราคาจาก UAT. ราคาที่ผู้ใช้แก้ไขในแผนใช้ค่าที่ผู้ใช้บันทึก</dd></div><div><dt class="font-semibold">ยอดเงินในกราฟเปรียบเทียบ</dt><dd>รวมราคากลาง ${money(f.reference)} บาท และราคาประเมิน ${money(f.cost)} บาท จาก ${f.known} รายการที่มีราคาครบ. ไม่รวมซ้ำเมื่อรถอยู่หลาย Purchase Order ในแผนเดียว. เป็นการเทียบมูลค่ารถทดแทนกับค่าซ่อมตามขอบเขตงาน; ไม่ใช่เงินงบประมาณคงเหลือ</dd></div><div><dt class="font-semibold">ราคาจริง (บาท)</dt><dd>ราคาที่ได้รถมา จากข้อมูลราคาจัดซื้อ/ได้มาของทะเบียนรถแต่ละคัน เป็นราคาประจำตัวรถ ไม่ขึ้นกับแผนหรือสถานะงาน Overhaul. ใน prototype ใช้ราคาตัวอย่างที่มีอยู่ในข้อมูลทะเบียนรถ (PX_VEH.acq); ยังไม่ใช่ราคาจัดซื้อที่ยืนยันจาก UAT. หากไม่มีข้อมูลแสดง — และค่า 0 แสดง 0.00</dd></div><div><dt class="font-semibold">ความคืบหน้างาน</dt><dd>Σเปอร์เซ็นต์ในตาราง ÷ จำนวนรายการที่มีข้อมูล = ${tracked.length?tracked.map(r=>r.pct+'%').join(' + ')+' หาร '+tracked.length+' = '+state.progress+'%':'—'}. ไม่แทนค่าที่ขาดด้วย 0%. รถหลาย Purchase Order ใช้ค่าต่ำสุดของทุกงาน; ถ้ามีงานใดยังไม่มีข้อมูลให้เป็น —. ถึง100%หมายถึงซ่อมครบ ไม่ใช่อนุมัติปิดงานแล้ว</dd></div><div><dt class="font-semibold">ประเภทและยี่ห้อ</dt><dd>นับทะเบียนรถไม่ซ้ำ ${state.uniqueVehicles} คัน ตามประเภทและยี่ห้อในตาราง; กราฟยี่ห้อแสดงสูงสุด4อันดับ. รถคันเดิมข้ามแผนนับหนึ่งคันในกราฟประเภท/ยี่ห้อ แต่ราคาและความคืบหน้าแยกตามงานในแต่ละแผน</dd></div></dl>
 <div class="tblwrap"><table class="tbl striped"><thead><tr><th>ทะเบียน / แผน</th><th class="num">ราคากลาง (บาท)</th><th class="num">ประเมิน Overhaul (บาท)</th><th class="num">ราคาจริง (บาท)</th><th>ที่มาราคา</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.v.plate)}<div class="cell-sub">${esc(r.plan.id)}</div></td><td class="num">${money(r.ref)}</td><td class="num">${money(r.oh)}</td><td class="num">${money(r.acquisition)}</td><td><div>ราคากลาง: ${source(r.pc,'reference')}</div><div>ประเมิน: ${source(r.pc,'estimate')}</div><div>ราคาจริง: ราคาที่ได้รถมา (ข้อมูลตัวอย่างทะเบียนรถ)</div><a class="text-brand-900 underline" href="#/vehicle/${r.v.id}">ดูข้อมูลรถ</a></td></tr>`).join('')}</tbody></table></div></div>`,
 `<div class="modal-ft-r"><button type="button" class="btn btn-s" data-close="m-fin-method">ปิด</button></div>`);oh2Modal('m-fin-method',true);
}
function ohBreakdown(rows){const f=ohFinance(rows);$('modals').innerHTML='';modal('m-fin','xl',ohNetLabel(),`คำนวณได้ ${f.known}/${f.total} รายการ · รวม ${money(f.net)} บาท`,
 rows.length?`<div class="tblwrap"><table class="tbl striped"><thead><tr><th>ทะเบียน / แผน</th><th class="num">ราคากลาง (บาท)</th><th class="num">${ohCostLabel()} (บาท)</th><th class="num">ส่วนต่าง (บาท)</th><th class="num">ส่วนต่าง (%)</th><th>ข้อมูล</th><th></th></tr></thead><tbody>${rows.map(r=>{const a=ohFinance([r]),cost=LS.basis==='approved'?r.approved:r.oh;return `<tr><td><a class="cell-key text-gray-900 !no-underline" href="#/vehicle/${r.v.id}">${esc(r.v.plate)}</a><div class="cell-sub">${esc(r.plan.id)} · ปี ${r.plan.year}</div></td><td class="num">${money(r.ref)}</td><td class="num">${money(cost)}</td><td class="num ${a.net!=null&&a.net<0?'text-error-700':''}">${money(a.net)}</td><td class="num">${ohPercent(a.percent)}</td><td>${a.known?(a.net<0?badge(['สูงกว่าราคากลาง','b-out']):badge(['คำนวณได้','b-ok'])):badge(['ข้อมูลยังไม่ครบ','b-neutral'])}</td><td><button class="btn btn-link" type="button" data-finance-edit="${esc(r.key)}">${a.known?'แก้ไขราคา':'ระบุราคา'}</button></td></tr>`;}).join('')}</tbody></table></div>`:empty('search_off','ไม่มีรถตามตัวกรอง',''),
 `<div class="modal-ft-r"><button type="button" class="btn btn-s" data-close="m-fin">ปิด</button></div>`);oh2Modal('m-fin',true);document.querySelectorAll('[data-finance-edit]').forEach(b=>b.onclick=()=>{const r=rows.find(r=>r.key===b.dataset.financeEdit);oh2Modal('m-fin',false);priceModal(r.pc,save);});
}
function bindOhDashboard(){
 ohMountCharts();$('oh-method').onclick=ohMethod;
 $('oh-year').onchange=()=>{LS.F.cars.year=$('oh-year').value;LS.F.cars.plan='';render();};
 document.querySelectorAll('[data-oh-group]').forEach(b=>b.onclick=()=>{const k=b.dataset.ohGroup;LS.F.cars[k]=LS.F.cars[k]===b.dataset.value?'':b.dataset.value;render();});
 document.querySelectorAll('[data-oh-progress]').forEach(b=>b.onclick=()=>{LS.F.cars.progress=LS.F.cars.progress===b.dataset.ohProgress?'':b.dataset.ohProgress;render();});
 document.querySelectorAll('[data-oh-plan]').forEach(b=>b.onclick=()=>{LS.F.cars.plan=b.dataset.ohPlan;render();$('oh-car-table').scrollIntoView({block:'start',behavior:'smooth'});});
 document.querySelectorAll('[data-finance-car]').forEach(b=>b.onclick=()=>ohBreakdown(carRows().filter(r=>r.key===b.dataset.financeCar)));
}
function ohVehicleFinance(id){const rows=ohAllRecords().filter(r=>r.v.id===id);return sect('เปรียบเทียบค่า Overhaul รายคัน')+(rows.length?`<p class="text-sm text-gray-500 mb-4">ราคากลาง − ค่า Overhaul · ดูยอดแยกแต่ละแผน ไม่มีข้อมูลราคาแสดง —</p><div class="tblwrap mb-10"><table class="tbl striped"><thead><tr><th>แผน / ปีงบประมาณ</th><th class="num">ราคากลาง (บาท)</th><th class="num">ประเมิน Overhaul (บาท)</th><th class="num">ส่วนต่างประมาณการ (บาท)</th><th class="num">ค่าใช้จ่ายที่อนุมัติ (บาท)</th><th class="num">ส่วนต่างหลังอนุมัติ (บาท)</th></tr></thead><tbody>${rows.map(r=>{const a=ohFinance([r],'estimate'),b=ohFinance([r],'approved');return `<tr><td><a href="#/plan/${r.plan.id}" class="cell-key text-gray-900 !no-underline">${esc(r.plan.id)}</a><div class="cell-sub">ปี ${r.plan.year}</div></td><td class="num">${money(r.ref)}</td><td class="num">${money(r.oh)}</td><td class="num">${money(a.net)}</td><td class="num">${money(r.approved)}</td><td class="num">${money(b.net)}</td></tr>`;}).join('')}</tbody></table></div>`:empty('info','ยังไม่มีงาน Overhaul',''));}
function bindOhVehicleFinance(){}
