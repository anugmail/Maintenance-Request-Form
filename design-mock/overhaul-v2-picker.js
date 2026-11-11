/* ตัวเลือกรถเข้าแผน — ใช้ร่วมกันระหว่าง overhaul-v2-02b-plan-form-picker.html (modal · แบบ 1–3) และ
   overhaul-v2-02c-vehicle-picker-page.html (หน้าเต็ม · แบบ 4) · 11 พ.ย. 2569 ข้อเสนอให้เจ้าของงานเลือก
   ต้องโหลดหลัง overhaul-v2-mock.js (ใช้ OH2_VEHICLES · oh2Esc · oh2Money · oh2Num · oh2VehBadge · oh2PlanStatus) */

/* รถจำลองเพิ่ม 14 คัน — โชว์ว่ารถเยอะแล้วยังค้น/กรอง/แบ่งหน้าได้ (ไม่ลง localStorage ของชุด v2) */
const PK_EXTRA=[['ISUZU FTR','รถเครน 5 ตัน','ลำปาง'],['HINO FC9J','รถกระเช้า','อุดรธานี'],['ISUZU FVM','รถเจาะหลุมปักเสา','สุราษฎร์ธานี'],['HINO FM2P','รถเครน 10 ตัน','ระยอง'],
  ['MITSUBISHI FN','รถกระเช้า','พิษณุโลก'],['ISUZU FXZ','รถเครน 10 ตัน','อุบลราชธานี'],['HINO FG8J','รถเจาะหลุมปักเสา','ราชบุรี'],['ISUZU FTR','รถกระเช้า','นครสวรรค์'],
  ['HINO FM1A','รถเครน 5 ตัน','ภูเก็ต'],['ISUZU FVZ','รถกระเช้า','ลพบุรี'],['MITSUBISHI FN','รถเจาะหลุมปักเสา','ตรัง'],['HINO FG1J','รถเครน 10 ตัน','เพชรบุรี'],
  ['ISUZU FVM','รถกระเช้า','กาฬสินธุ์'],['HINO FC9J','รถเครน 5 ตัน','ชุมพร']]
  .map(([brand,type,prov],i)=>{const acq=1500000+i*85000;
    return {id:'x'+(i+1),plate:`${84+i}-${String(1000+i*317).slice(-4)} ${prov}`,brand,type,mileage:140000+i*7300,hours:7000+i*450,age:8+(i*3)%10,
      dept:'กฟฟ.'+prov,acqValue:acq,refPrice:acq-70000,status:i%6===4?'อยู่ระหว่างซ่อม':'พร้อมใช้งาน'}});

/* รถที่อยู่ในแผนอื่นที่ยังไม่เสร็จ = เลือกไม่ได้ (ตีความเอง · รอเคาะ) · เรียงคันที่เลือกได้ขึ้นก่อน */
function pkSetup(S,plan){
  const lockedBy={};
  S.plans.filter(p=>p!==plan&&oh2PlanStatus(S,p)!=='P3').forEach(p=>p.cars.forEach(c=>{lockedBy[c.id]=lockedBy[c.id]||p.id}));
  const POOL=[...OH2_VEHICLES,...PK_EXTRA].sort((a,b)=>!!lockedBy[a.id]-!!lockedBy[b.id]);
  return {POOL,lockedBy,byId:id=>POOL.find(v=>v.id===id)};
}

/* ตัวกรอง 4 ช่อง — ชุดเดียวกันทุกแบบ ต่างกันแค่กรอบที่ห่อ (side panel / แถบเครื่องมือ / แผงกาง / หน้าเต็ม) */
const PK_F0={type:'',age:'0',st:'',dept:''};
const PK_LABEL={type:'ประเภทรถ',age:'อายุการใช้งาน',st:'สถานะการใช้งาน',dept:'สังกัด'};
function pkOpts(POOL){return {
  type:[['','ทั้งหมด'],...[...new Set(POOL.map(v=>v.type))].map(t=>[t,t])],
  age:[['0','ทั้งหมด'],['10','10 ปีขึ้นไป'],['15','15 ปีขึ้นไป']],
  st:[['','ทั้งหมด'],['พร้อมใช้งาน','พร้อมใช้งาน'],['อยู่ระหว่างซ่อม','อยู่ระหว่างซ่อม']],
  dept:[['','ทั้งหมด'],...[...new Set(POOL.map(v=>v.dept))].sort().map(d=>[d,d])]}}
/* inline=true → select ในแถบเครื่องมือ (ไม่มี label บน ใส่ชื่อช่องไว้ในตัวเลือกแรก) */
function pkFieldsHTML(pfx,POOL,inline){const o=pkOpts(POOL);
  return Object.keys(PK_LABEL).map(k=>{const opts=o[k].map(([v,t],i)=>`<option value="${oh2Esc(v)}">${oh2Esc(inline&&i===0?PK_LABEL[k]+': '+t:t)}</option>`).join('');
    return inline?`<select class="select-inline" id="${pfx}-${k}" aria-label="${PK_LABEL[k]}">${opts}</select>`
      :`<div class="filter-field"><label for="${pfx}-${k}">${PK_LABEL[k]}</label><select id="${pfx}-${k}">${opts}</select></div>`}).join('')}
function pkRead(pfx){const f={};Object.keys(PK_F0).forEach(k=>f[k]=document.getElementById(pfx+'-'+k).value);return f}
function pkWrite(pfx,f){Object.keys(PK_F0).forEach(k=>document.getElementById(pfx+'-'+k).value=f[k])}
function pkCount(f){return Object.keys(PK_F0).filter(k=>f[k]!==PK_F0[k]).length}
function pkMatch(v,q,f){q=q.trim().toLowerCase();
  return (!q||[v.plate,v.brand,v.type,v.dept].some(x=>x.toLowerCase().includes(q)))
    &&(!f.type||v.type===f.type)&&v.age>=+f.age&&(!f.st||v.status===f.st)&&(!f.dept||v.dept===f.dept)}
/* ป้ายตัวกรองที่ใช้อยู่ — Badge outline with remove icon (.fchip) แบบหน้ารายการแผน */
function pkChipsHTML(f,POOL){const o=pkOpts(POOL);
  return Object.keys(PK_F0).filter(k=>f[k]!==PK_F0[k]).map(k=>{const t=(o[k].find(x=>x[0]===f[k])||[,f[k]])[1];
    return `<span class="fchip">${oh2Esc(t)}<button class="fchip-x" type="button" data-rm="${k}" aria-label="เอาตัวกรอง ${oh2Esc(t)} ออก"><span class="ms">close_small</span></button></span>`}).join('')}

/* แถวตาราง · state: checked · disabled · sub (เหตุผลที่เลือกไม่ได้ แทนบรรทัดยี่ห้อ) */
/* add (วิธีเลือก B): 'can' | 'done' → ไม่มี checkbox · ท้ายแถวเป็นปุ่ม "เพิ่ม" / "เพิ่มแล้ว" (Table cell Action · Secondary button sm) */
function pkRow(v,{checked,disabled,sub,add}){return `<tr>
  ${add?'':`<td><input type="checkbox" class="p-ck" value="${v.id}"${checked?' checked':''}${disabled?' disabled':''} aria-label="เลือก ${oh2Esc(v.plate)}"></td>`}
  <td><div class="cell-key${disabled?' text-gray-400':''}">${oh2Esc(v.plate)}</div><div class="cell-sub">${sub?oh2Esc(sub):oh2Esc(v.brand)}</div></td>
  <td>${oh2Esc(v.type)}<div class="cell-sub">${oh2Esc(v.dept)}</div></td>
  <td class="num">${oh2Num(v.mileage)} กม.<div class="cell-sub">${oh2Num(v.hours)} ชม.</div></td>
  <td class="num">${v.age} ปี</td>
  <td class="num">${oh2Money(v.acqValue)}.00<div class="cell-sub">ราคากลาง ${oh2Money(v.refPrice)}.00</div></td>
  <td>${oh2VehBadge(v.status)}</td>
  ${!add?'':add==='done'?`<td class="text-right"><button class="btn btn-s btn-sm" type="button" disabled><span class="ms">check</span>เพิ่มแล้ว</button></td>`
    :`<td class="text-right"><button class="btn btn-s btn-sm" type="button" data-add="${v.id}"${disabled?' disabled':''} aria-label="เพิ่ม ${oh2Esc(v.plate)} เข้าแผน"><span class="ms">add</span>เพิ่ม</button></td>`}</tr>`}
const PK_COLS=`<th>ทะเบียน</th><th>ประเภทรถ</th><th class="num">เลขไมล์ / ชม.ทำงาน</th><th class="num">อายุ</th>
  <th class="num">มูลค่าได้มา / ราคากลาง</th><th>สถานะการใช้งาน</th>`;
const PK_HEAD=`<th class="w-[44px]"><input type="checkbox" id="p-all" aria-label="เลือกทั้งหมดในหน้านี้"></th>${PK_COLS}`;
const PK_HEAD_ADD=`${PK_COLS}<th class="w-[120px]" aria-label="เพิ่มเข้าแผน"></th>`;

/* วิธีเลือก E: วางเลขทะเบียน — เทียบโดยตัดช่องว่าง/ขีดออก · "84-1000" ตรงกับ "84-1000 ลำปาง" (ขึ้นต้นตรงกัน) · เจอหลายคัน = กำกวม */
const pkNorm=s=>String(s).replace(/[\s\-]/g,'').toLowerCase();
function pkMatchPlates(text,POOL){
  const lines=[...new Set(text.split(/[\n,]+/).map(s=>s.trim()).filter(Boolean))];
  return lines.map(raw=>{const n=pkNorm(raw);const hit=POOL.filter(v=>pkNorm(v.plate).startsWith(n));return {raw,hit}});
}
function pkPager(page,pages){
  return `<button class="pg" type="button" data-pg="${page-1}"${page<=1?' disabled':''} aria-label="หน้าก่อน"><span class="ms">chevron_left</span></button>`+
    Array.from({length:pages},(_,i)=>`<button class="pg${i+1===page?' on':''}" type="button" data-pg="${i+1}">${i+1}</button>`).join('')+
    `<button class="pg" type="button" data-pg="${page+1}"${page>=pages?' disabled':''} aria-label="หน้าถัดไป"><span class="ms">chevron_right</span></button>`}

/* ส่งค่าข้ามหน้า (แบบ 4) — ฟอร์มฝากร่างไว้ก่อนไปหน้าเลือกรถ · หน้าเลือกรถฝากผลกลับ · sessionStorage = อยู่แค่แท็บนี้ */
const PK_FORM_KEY='oh2-pk-form',PK_RESULT_KEY='oh2-pk-result';
function pkGet(k){try{return JSON.parse(sessionStorage.getItem(k))}catch(e){return null}}
function pkSet(k,v){try{v==null?sessionStorage.removeItem(k):sessionStorage.setItem(k,JSON.stringify(v))}catch(e){}}
