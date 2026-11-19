/* ส่วน "เลือกรถที่จะเข้า Overhaul" ของฟอร์มแผน — ฉบับข้อเสนอ 3 แบบ (11 พ.ย. 2569)
   ใช้กับ overhaul-v2-02-plan-form-r1.html (แบบ 1) · overhaul-v2-02-plan-form-r2.html (แบบ 2) (ก๊อปจาก overhaul-v2-02-plan-form.html แล้วเปลี่ยนเฉพาะส่วนนี้)
   ต้องโหลดหลัง overhaul-v2-mock.js + overhaul-v2-picker.js

   แยก 3 state (ตอบ dev concern: checkbox ยังไม่ลง DB ≠ แถวข้อมูลที่มีราคา)
    ① ตัวเลือกรถ (modal หรือหน้าเต็ม) → pending ชั่วคราว · ยกเลิก/ปิด = ทิ้ง
    ② ตารางรถในแผน → draft [{id, estPrice, estOverhaul}] · ลง DB พร้อมแผนตอนกด "บันทึก" (ฟอร์มเรียก snap())
    ③ Modal ระบุราคารายคัน → แก้ draft ทีละแถว

   mode: 'modal' (แบบ 1) = modal + แผงตัวกรองพับ/กาง (SAP Fiori Value Help Dialog) — ⚠️ ไม่มี component แผงกางในไลบรารี ต้องขอทีมออกแบบ
         'page'  (แบบ 2) = หน้าเต็ม + Side panel ตัวกรอง (Filter_Panel ของไลบรารี node 1964:13912) — มีของครบในไลบรารี
   หลักที่ใช้ทุกแบบ: checkbox ทุกแถว + หัวตารางเลือกเฉพาะหน้าที่เห็น (Material Data tables · PatternFly Bulk selection) ·
         ติ๊กค้างข้ามหน้า/ตัวกรอง (PatternFly) · นับจำนวนที่เลือก + "แสดงเฉพาะที่เลือก" (SAP Fiori) ·
         ยืนยันครั้งเดียวแล้วค่อยลงรายการ (Shopify Resource Picker · Carbon batch actions)
   รถที่เลือกได้ = OH2_VEHICLES ทั้งหมดที่ยังไม่อยู่ในแผนนี้ (ไม่ล็อกรถที่อยู่แผนอื่น — ยังไม่มีกติกานี้ ต้องถามเจ้าของงาน) */

function pcInit({mode,plan,root,onChange}){
  const $=id=>document.getElementById(id);
  const POOL=OH2_VEHICLES,byId=id=>POOL.find(v=>v.id===id);
  const inPO=new Set(plan?oh2PlanCars(plan):[]);   // มี PO แล้ว → ลบออกจากแผนไม่ได้
  let draft=(plan?plan.cars:[]).map(c=>({id:c.id,estPrice:c.estPrice??'',estOverhaul:c.estOverhaul??''}));
  const changed=()=>{draw();onChange&&onChange()};
  const empty=n=>n===''||n==null;
  const money=v=>{const n=Number(String(v).replace(/,/g,''));return String(v).trim()===''||isNaN(n)?'':n};
  const cell=n=>empty(n)?'<span class="text-gray-400">—</span>':oh2Money(n)+'.00';

  /* ===== ② ส่วนในฟอร์ม ===== */
  root.innerHTML=`
    <div class="sect bar">เลือกรถที่จะเข้า Overhaul <span class="badge sq" id="pc-n">0</span>
      <button class="btn btn-s ml-auto hidden" type="button" id="pc-add"><span class="ms">add</span>เพิ่มรถ</button></div>
    <div class="note note-warn mt-4 mb-0 hidden" id="pc-warn"><span class="ms">warning</span><span id="pc-warn-t"></span></div>
    <div class="tblwrap mt-4 hidden" id="pc-wrap"><table class="tbl striped"><thead><tr>
      <th>ทะเบียน</th><th>ยี่ห้อ/รุ่น · ประเภท</th><th class="num">เลขไมล์ / ชม.ทำงาน</th><th class="num">อายุ</th>
      <th class="num">มูลค่าได้มา</th><th class="num">ราคากลาง (บาท)</th><th class="num">ราคาประเมิน Overhaul (บาท)</th>
      <th class="w-[104px]" aria-label="จัดการ"></th></tr></thead><tbody id="pc-body"></tbody></table></div>
    <div class="filter-empty mt-4" id="pc-empty"><span class="ms">local_shipping</span><b>ยังไม่มีรถในแผน</b>
      <span>เพิ่มรถที่จะเข้า Overhaul แล้วระบุราคากลางและราคาประเมินรายคัน</span>
      <button class="btn btn-p btn-sm mt-2" type="button" id="pc-add2"><span class="ms">add</span>เพิ่มรถ</button></div>`;
  function draw(){
    $('pc-n').textContent=draft.length;
    $('pc-wrap').classList.toggle('hidden',!draft.length);$('pc-empty').classList.toggle('hidden',!!draft.length);$('pc-add').classList.toggle('hidden',!draft.length);
    $('pc-body').innerHTML=draft.map(d=>{const v=byId(d.id),lock=inPO.has(d.id),miss=showErr&&(empty(d.estPrice)||empty(d.estOverhaul));
      const c=n=>miss&&empty(n)?'<span class="badge b-low">ยังไม่ระบุ</span>':cell(n);return `<tr>
      <td><div class="cell-key">${oh2Esc(v.plate)}</div></td>
      <td>${oh2Esc(v.brand)}<div class="cell-sub">${oh2Esc(v.type)}</div></td>
      <td class="num">${oh2Num(v.mileage)} กม.<div class="cell-sub">${oh2Num(v.hours)} ชม.</div></td>
      <td class="num">${v.age} ปี</td><td class="num">${oh2Money(v.acqValue)}.00</td>
      <td class="num">${c(d.estPrice)}</td><td class="num">${c(d.estOverhaul)}</td>
      <td><div class="flex justify-end gap-1">
        <button class="btn btn-t btn-icon" type="button" data-pc-edit="${d.id}" title="ระบุราคา" aria-label="ระบุราคา ${oh2Esc(v.plate)}"><span class="ms">stylus</span></button>
        <button class="btn btn-t btn-icon" type="button" data-pc-del="${d.id}"${lock?' disabled title="รถคันนี้มี Purchase Order แล้ว ลบออกจากแผนไม่ได้"':' title="นำออกจากแผน"'} aria-label="นำ ${oh2Esc(v.plate)} ออกจากแผน"><span class="ms">delete</span></button>
      </div></td></tr>`}).join('');
    const m=showErr?missing():[];
    $('pc-warn').classList.toggle('hidden',!m.length);
    $('pc-warn-t').textContent=`กรุณาระบุราคากลางและราคาประเมิน Overhaul ให้ครบทุกคัน · ยังไม่ระบุ ${m.length} จาก ${draft.length} คัน`;
  }
  let showErr=false;   // ตรวจตอนกดบันทึก (F9) แบบเดียวกับช่องอื่นของฟอร์มเดิม
  const missing=()=>draft.filter(d=>empty(d.estPrice)||empty(d.estOverhaul));
  root.addEventListener('click',e=>{
    const ed=e.target.closest('[data-pc-edit]');if(ed)openPrice(ed.dataset.pcEdit);
    const dl=e.target.closest('[data-pc-del]');if(dl&&!dl.disabled){const v=byId(dl.dataset.pcDel);draft=draft.filter(d=>d.id!==v.id);changed();oh2Notify(`นำ ${v.plate} ออกจากแผนแล้ว`)}
  });
  function addIds(ids){ids.forEach(id=>{if(byId(id)&&!draft.some(d=>d.id===id))draft.push({id,estPrice:'',estOverhaul:''})});changed();
    if(ids.length)oh2Notify(`เพิ่มรถเข้าแผน ${ids.length} คัน`,{sub:'ระบุราคากลางและราคาประเมินรายคันได้ที่ไอคอนแก้ไข'})}

  /* ===== ③ Modal ระบุราคารายคัน (B.13) ===== */
  document.body.insertAdjacentHTML('beforeend',`
  <div class="modal-overlay hidden" id="pc-mprice"><div class="modal md" role="dialog" aria-modal="true" aria-labelledby="pc-mprice-t">
    <div class="modal-hd"><div class="modal-hd-c"><div class="flex-1 min-w-0 pt-5"><h2 id="pc-mprice-t">ระบุราคารายคัน</h2><div class="modal-sub" id="pc-mprice-s"></div></div>
      <button class="modal-x" type="button" data-close="pc-mprice" aria-label="ปิด"><span class="ms">close</span></button></div></div>
    <div class="modal-bd"><div class="flex flex-col gap-4">
      <div class="f" data-name="ราคากลาง"><label for="pc-ref">ราคากลาง (บาท)</label><div class="in noic"><input type="text" id="pc-ref" inputmode="decimal" placeholder="ระบุราคากลาง"></div><div class="help hidden"></div></div>
      <div class="f" data-name="ราคาประเมิน Overhaul"><label for="pc-oh">ราคาประเมิน Overhaul (บาท)</label><div class="in noic"><input type="text" id="pc-oh" inputmode="decimal" placeholder="ระบุราคาประเมิน Overhaul"></div><div class="help hidden"></div></div>
      <div class="text-sm text-gray-500" id="pc-hint"></div></div></div>
    <div class="modal-ft"><div class="modal-ft-a fill"><div class="modal-ft-r">
      <button class="btn btn-s" type="button" data-close="pc-mprice">ยกเลิก</button><button class="btn btn-p" type="button" id="pc-pok">บันทึก</button></div></div></div>
  </div></div>`);
  let editing=null;
  const prErr=(i,msg)=>{const f=$(i).closest('.f');f.classList.toggle('err',!!msg);const h=f.querySelector('.help');h.textContent=msg;h.classList.toggle('hidden',!msg)};
  function openPrice(id){editing=id;const v=byId(id),d=draft.find(x=>x.id===id);
    $('pc-mprice-s').textContent=`${v.plate} · ${v.brand} ${v.type}`;
    $('pc-ref').value=empty(d.estPrice)?'':oh2Money(d.estPrice);$('pc-oh').value=empty(d.estOverhaul)?'':oh2Money(d.estOverhaul);
    $('pc-hint').textContent=`อ้างอิง: มูลค่าได้มา ${oh2Money(v.acqValue)}.00 บาท · ราคากลางในระบบ ${oh2Money(v.refPrice)}.00 บาท`;
    ['pc-ref','pc-oh'].forEach(i=>prErr(i,''));oh2Modal('pc-mprice',true);setTimeout(()=>$('pc-ref').focus(),0)}
  ['pc-ref','pc-oh'].forEach(i=>{$(i).addEventListener('input',()=>prErr(i,''));
    $(i).addEventListener('blur',()=>{const n=money($(i).value);$(i).value=n===''?'':oh2Money(n)})});
  $('pc-pok').addEventListener('click',()=>{   // ตรวจตอนกดบันทึก ช่องว่าง = State=Error "กรุณาระบุ…"
    let bad=false;['pc-ref','pc-oh'].forEach(i=>{if(money($(i).value)===''){prErr(i,'กรุณาระบุ'+$(i).closest('.f').dataset.name);bad=true}});if(bad)return;
    const d=draft.find(x=>x.id===editing);d.estPrice=money($('pc-ref').value);d.estOverhaul=money($('pc-oh').value);
    oh2Modal('pc-mprice',false);changed();const left=showErr?missing().length:0;
    oh2Notify(`บันทึกราคา ${byId(editing).plate} แล้ว`,{sub:left?`เหลืออีก ${left} คันที่ยังไม่ระบุราคา`:''})});

  /* ===== ① ตัวเลือกรถ ===== */
  let openPicker;
  if(mode==='page'){   // แบบ 2: ฟอร์มฝากร่าง แล้วพาไปหน้าเลือกรถเต็มจอ (overhaul-v2-02c-vehicle-picker-page.html?pool=base)
    openPicker=()=>pcOnLeave&&pcOnLeave(draft);
  }else{
    const PER=6;let pending=new Set(),page=1,onlySel=false,F={...PK_F0};
    document.body.insertAdjacentHTML('beforeend',`
    <div class="modal-overlay hidden" id="pc-mpick"><div class="modal xl" role="dialog" aria-modal="true" aria-labelledby="pc-mpick-t">
      <div class="modal-hd"><div class="modal-hd-c"><div class="flex-1 min-w-0 pt-5"><h2 id="pc-mpick-t">เพิ่มรถเข้าแผน</h2><div class="modal-sub">รถทั้งหมดในระบบที่ยังไม่อยู่ในแผนนี้</div></div>
        <button class="modal-x" type="button" data-close="pc-mpick" aria-label="ปิด"><span class="ms">close</span></button></div></div>
      <div class="modal-bd">
        <div class="list-toolbar split mb-0">
          <div class="lt-search"><div class="search"><span class="ms">search</span><input type="search" id="pc-q" placeholder="ค้นหาทะเบียน, ยี่ห้อ/รุ่น, สังกัด" aria-label="ค้นหารถ"></div></div>
          <div class="lt-actions"><button class="btn btn-s" type="button" id="pc-fbtn" aria-expanded="false" aria-controls="pc-fpanel"><span class="ms">filter_list</span>ตัวกรอง<span class="badge b-brand hidden" id="pc-fn"></span></button></div>
        </div>
        <div class="filter-panel mb-0" id="pc-fpanel"><div class="flex flex-wrap gap-4 items-end flex-1">${pkFieldsHTML('pcf',POOL)}</div>
          <div class="flex items-center gap-3 ml-auto"><button class="btn btn-link" type="button" id="pc-fclear">ล้างตัวกรอง</button><button class="btn btn-p" type="button" id="pc-fapply">ตกลง</button></div></div>
        <div class="flex items-center gap-3 flex-wrap"><div class="fchips" id="pc-chips" aria-label="ตัวกรองที่ใช้อยู่"></div>
          <span class="chips"><button class="chip" type="button" id="pc-only" aria-pressed="false">แสดงเฉพาะที่เลือก (<span id="pc-only-n">0</span>)</button></span></div>
        <div class="tblwrap" id="pc-pwrap"><table class="tbl striped"><thead><tr>${PK_HEAD}</tr></thead><tbody id="pc-pbody"></tbody></table>
          <div class="tblfoot"><div class="tf-left"><span id="pc-pfoot"></span></div><div class="pager" id="pc-pager"></div></div></div>
        <div class="filter-empty hidden" id="pc-none"><span class="ms">search_off</span><b>ไม่พบรถ</b><span>ไม่มีรถที่ตรงกับคำค้นหรือตัวกรอง</span>
          <button class="btn btn-s btn-sm mt-2" type="button" id="pc-clear">ล้างคำค้นและตัวกรอง</button></div>
      </div>
      <div class="modal-ft"><div class="modal-ft-a"><span class="text-sm text-gray-600" id="pc-count">ยังไม่ได้เลือกรถ</span>
        <div class="modal-ft-r"><button class="btn btn-s" type="button" data-close="pc-mpick">ยกเลิก</button><button class="btn btn-p" type="button" id="pc-ok" disabled>เพิ่มรถ</button></div></div></div>
    </div></div>`);
    const inDraft=id=>draft.some(d=>d.id===id);
    const list=()=>POOL.filter(v=>!inDraft(v.id)&&pkMatch(v,$('pc-q').value,F)&&(!onlySel||pending.has(v.id)));
    const pageRows=()=>list().slice((page-1)*PER,page*PER);
    function drawPick(){
      const L=list(),pages=Math.max(1,Math.ceil(L.length/PER));page=Math.min(page,pages);
      $('pc-pbody').innerHTML=pageRows().map(v=>pkRow(v,{checked:pending.has(v.id)})).join('');
      $('pc-pwrap').classList.toggle('hidden',!L.length);$('pc-none').classList.toggle('hidden',!!L.length);
      $('pc-pfoot').textContent=L.length?`แสดง ${(page-1)*PER+1} ถึง ${Math.min(page*PER,L.length)} จาก ${L.length} รายการ`:'';
      $('pc-pager').innerHTML=pkPager(page,pages);
      const pr=pageRows(),n=pr.filter(v=>pending.has(v.id)).length;   // หัวตาราง = เฉพาะหน้านี้ (PatternFly)
      $('p-all').checked=!!pr.length&&n===pr.length;$('p-all').indeterminate=n>0&&n<pr.length;$('p-all').disabled=!pr.length;
      $('pc-count').textContent=pending.size?`เลือกแล้ว ${pending.size} คัน`:'ยังไม่ได้เลือกรถ';
      $('pc-ok').disabled=!pending.size;$('pc-ok').textContent=pending.size?`เพิ่มรถ (${pending.size})`:'เพิ่มรถ';
      $('pc-only-n').textContent=pending.size;$('pc-chips').innerHTML=pkChipsHTML(F,POOL);
      const fn=pkCount(F);$('pc-fn').textContent=fn;$('pc-fn').classList.toggle('hidden',!fn);
    }
    const setPanel=o=>{$('pc-fpanel').classList.toggle('open',o);$('pc-fbtn').setAttribute('aria-expanded',o);if(o)pkWrite('pcf',F)};
    const setOnly=o=>{onlySel=o;$('pc-only').classList.toggle('sel',o);$('pc-only').setAttribute('aria-pressed',o)};
    openPicker=()=>{pending=new Set();page=1;setOnly(false);F={...PK_F0};$('pc-q').value='';setPanel(false);
      drawPick();oh2Modal('pc-mpick',true);setTimeout(()=>$('pc-q').focus(),0)};
    $('pc-fbtn').addEventListener('click',()=>setPanel(!$('pc-fpanel').classList.contains('open')));
    $('pc-fapply').addEventListener('click',()=>{F=pkRead('pcf');page=1;setPanel(false);drawPick()});
    $('pc-fclear').addEventListener('click',()=>pkWrite('pcf',PK_F0));
    $('pc-chips').addEventListener('click',e=>{const b=e.target.closest('[data-rm]');if(!b)return;F[b.dataset.rm]=PK_F0[b.dataset.rm];page=1;drawPick()});
    $('pc-pbody').addEventListener('change',e=>{const c=e.target;if(!c.classList.contains('p-ck'))return;c.checked?pending.add(c.value):pending.delete(c.value);drawPick()});
    $('p-all').addEventListener('change',()=>{pageRows().forEach(v=>$('p-all').checked?pending.add(v.id):pending.delete(v.id));drawPick()});
    $('pc-q').addEventListener('input',()=>{page=1;drawPick()});
    $('pc-pager').addEventListener('click',e=>{const b=e.target.closest('[data-pg]');if(b&&!b.disabled){page=+b.dataset.pg;drawPick()}});
    $('pc-only').addEventListener('click',()=>{setOnly(!onlySel);page=1;drawPick()});
    $('pc-clear').addEventListener('click',()=>{$('pc-q').value='';F={...PK_F0};setOnly(false);drawPick()});
    $('pc-ok').addEventListener('click',()=>{const ids=POOL.filter(v=>pending.has(v.id)).map(v=>v.id);pending=new Set();oh2Modal('pc-mpick',false);addIds(ids)});
  }
  $('pc-add').addEventListener('click',()=>openPicker());$('pc-add2').addEventListener('click',()=>openPicker());
  draw();

  return {
    snap:()=>draft.map(d=>({id:d.id,estPrice:empty(d.estPrice)?0:d.estPrice,estOverhaul:empty(d.estOverhaul)?0:d.estOverhaul})).sort((a,b)=>a.id<b.id?-1:1),
    /* ตรวจตอนกดบันทึกแผน — ไม่ครบ = Alert Warning + Badge "ยังไม่ระบุ" ในช่องที่ขาด · คืน element ให้ฟอร์มเลื่อนไปหา */
    validate:()=>{showErr=true;draw();return missing().length?root:null},
    getDraft:()=>draft,setDraft:d=>{draft=d;draw()},addIds,
  };
}
let pcOnLeave=null;   // แบบ 2: ฟอร์มตั้ง callback ฝากร่างก่อนไปหน้าเลือกรถ
