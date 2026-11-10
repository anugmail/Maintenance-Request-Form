/* SP09 additions only. Shared component helpers are bundled from overhaul2-plugin.
 * Sources: SP09 visible cards; VMS Plus components; UI Release#2 Admin list
 * 2381:558524 (vendors), Contract list/Create rental contract (lists/forms),
 * existing maintainance-plugin (plan detail), Notification card (notification).
 * Fixture data is illustrative, never presented as a live integration.
 */
const SP_VENDORS = [
  {id:'VND-001',name:'ศูนย์บริการตัวอย่าง สงขลา',type:'รถกระเช้า',brand:'HINO',address:'สงขลา',phone:'074-000-001',email:'service@example.com',lat:'7.0084',lng:'100.4747',ratings:[4,5],po:'PO-700201'},
  {id:'VND-002',name:'อู่ตัวอย่าง นครปฐม',type:'รถเครน',brand:'ISUZU',address:'นครปฐม',phone:'034-000-002',email:'garage@example.com',lat:'13.8199',lng:'100.0622',ratings:[],po:'—'},
];
const SP_PLAN = {id:'MA-700001',name:'บำรุงรักษารถกระเช้า ประจำปี 2570',org:'กฟฟ.สงขลา',plate:'72-6648 สงขลา',cycle:'ตามรอบบำรุงรักษาที่กำหนด',from:'16/11/2569',to:'27/11/2569'};
const spScore = values => values.length ? (values.reduce((a,b)=>a+b,0)/values.length).toFixed(1) + ' / 5 (' + values.length + ' ครั้ง)' : 'ยังไม่มีคะแนน';
// Phase one: match vehicle types only. No location, brand, score or AI ranking.
function spRecommendVendors(vehicleType,vendors) {
  const key=String(vehicleType||'').trim();
  return (vendors||SP_VENDORS).filter(v=>{
    const types=Array.isArray(v.types)?v.types:[v.type];
    return key && types.some(type=>String(type||'').trim()===key);
  });
}
async function spLogin(mode) {
  // Public entry: never display authenticated navigation/profile or collect a
  // password in Maintain-D. Actual credentials remain on the Keycloak page.
  const scr=frame('SP09 / เข้าสู่ระบบ','VERTICAL',{fill:WHITE});
  scr.counterAxisSizingMode='FIXED';scr.resize(1440,1024);scr.minHeight=1024;scr.clipsContent=false;
  const body=frame('Page','VERTICAL',{gap:32,pad:32,fill:WHITE});add(scr,body,'h');
  add(body,await pageHead({title:'Maintain-D',sub:'เข้าสู่ระบบด้วยบัญชีผู้ใช้งานของคุณ'}),'h');
  if(mode==='error')add(body,alertBox('Error','เข้าสู่ระบบไม่สำเร็จ','กรุณาลองเข้าสู่ระบบอีกครั้ง'),'h');
  add(body,btnRow([['Primary button',mode==='loading'?'กำลังเปิดหน้าเข้าสู่ระบบ…':'เข้าสู่ระบบด้วยบัญชี กฟภ.',{disabled:mode==='loading'}]]),'h');
  return scr;
}
async function spDiagnosis(mode) {
  const vehicleType=mode==='empty'?'รถเจาะหลุม':mode==='unselected'?'':'รถกระเช้า';
  const vendors=spRecommendVendors(vehicleType), self=mode==='self', filled=self||mode==='filled'||mode==='saved';
  const nodes=[
    col('Section',[await section('รถและอาการเสีย'),
      kv([['เลขที่ใบแจ้งซ่อม','REQ-690001'],['ทะเบียน','72-6648 สงขลา']]),
      dropdown('ประเภทรถ',vehicleType,{placeholder:'เลือกประเภทรถ'}),
      area('อาการเสียที่แจ้ง','เครื่องยนต์มีเสียงผิดปกติ'),
      area('ผลวิเคราะห์อาการ',filled?'ตรวจสอบระบบเครื่องยนต์และชุดกรอง': '',{placeholder:'ระบุผลวิเคราะห์อาการ',error:mode==='validation'?'กรุณาระบุผลวิเคราะห์อาการ':''}),
      dropdown('วิธีดำเนินการ',self?'ซ่อมเอง':filled?'ส่งอู่':'',{placeholder:'เลือกซ่อมเองหรือส่งอู่'})],16),
    ...(!self?[col('Section',[await section('อู่ที่รองรับประเภทรถ'),
      !vehicleType?await spEmpty('เลือกประเภทรถเพื่อดูอู่ที่รองรับ'):vendors.length?
        await tbl([['อู่/ศูนย์บริการ',0],['ประเภทที่รองรับ',190],['ที่ตั้ง',150],['เบอร์โทร',160],['เลือก',80]],
          vendors.map((v,i)=>[v.name,v.type,v.address,v.phone,{check:filled&&i===0,text:'เลือก'}])):await spEmpty('ยังไม่มีอู่ที่รองรับประเภทรถนี้')],16)]:[]),
    col('Section',[await section('คำแนะนำอะไหล่'),area('อะไหล่ที่แนะนำ',filled?'ตรวจสอบไส้กรองและอะไหล่ตามผลวิเคราะห์':'',{optional:true,placeholder:'ระบุอะไหล่ที่แนะนำ'})],16),
    ...(filled?[btnRow([['Secondary button','ขอเบิกอะไหล่'],['Primary button','นัดหมายซ่อม']])]:[]),
    btnRow([['Secondary button','ย้อนกลับ'],['Primary button','บันทึกคำแนะนำ']]),
  ];
  const scr=await spPage('วิเคราะห์อาการและแนะนำอู่',{back:true},nodes);
  if(mode==='saved')await toast(scr,{title:'บันทึกคำแนะนำสำเร็จ'});
  if(mode==='error')await toast(scr,{title:'โหลดอู่ที่รองรับไม่สำเร็จ',sub:'กรุณาลองใหม่อีกครั้ง',err:true});
  return scr;
}
async function spRepairAppointment(mode) {
  const filled=mode==='filled'||mode==='saved', err=mode==='validation';
  const scr=await spPage('นัดหมายซ่อมจากผลวิเคราะห์',{back:true},[
    col('Section',[await section('งานซ่อม'),kv([['ใบแจ้งซ่อม','REQ-690001'],['รถ','72-6648 สงขลา'],['ประเภทรถ','รถกระเช้า'],['อู่ที่เลือก',SP_VENDORS[0].name]])],16),
    col('Section',[await section('รายละเอียดนัดหมาย'),
      field('วันนัดหมาย',filled?'16/11/2569':'',{placeholder:'วว/ดด/ปปปป',error:err?'กรุณาระบุวันนัดหมาย':''}),
      dropdown('ผู้ประสานงาน',filled?COORD[0]:'',{placeholder:'เลือกผู้ประสานงาน',error:err?'กรุณาเลือกผู้ประสานงาน':''}),
      field('เบอร์โทรผู้ประสานงาน',filled?COORD[2]:'',{state:'Readonly',placeholder:'แสดงเมื่อเลือกผู้ประสานงาน'})],16),
    btnRow([['Secondary button','ย้อนกลับ'],['Primary button','ส่งนัดหมาย']]),
  ]);
  if(mode==='saved')await toast(scr,{title:'ส่งนัดหมายซ่อมแล้ว',sub:'รอหน่วยงานตอบรับ'});
  return scr;
}
async function spPage(title, opts, content) {
  const r = await shell('SP09 ' + title, Object.assign({title},opts));
  for (const n of content) if (n) add(r.page,n,'h');
  return r.scr;
}
async function spEmpty(title, search) {
  const n = inst(search ? 'Empty state/Search not found' : 'Empty state/Data empty');
  await text(n,'Text',title);
  await text(n,'Supporting text',search ? 'เปลี่ยนคำค้นหาหรือตัวกรองแล้วลองใหม่' : 'ข้อมูลจะแสดงเมื่อมีการบันทึกรายการ');
  hide(n,'Actions'); return n;
}
const SP_VENDOR_COLS = [['รหัส',110],['อู่/ศูนย์บริการ',0],['ประเภท / ยี่ห้อที่รองรับ',210],['ที่ตั้ง',140],['เบอร์โทร',145],['คะแนนเฉลี่ย',160],['',56]];
async function spVendorList(mode) {
  const rows = SP_VENDORS.map(v=>[v.id,v.name,{text:v.type,sub:v.brand},v.address,v.phone,spScore(v.ratings),{menu:1}]);
  const nodes = [await tableHeader({placeholder:'ค้นหาชื่ออู่, จังหวัด, เบอร์โทร',primary:'เพิ่มอู่/ศูนย์บริการ',query:mode==='search'?'ไม่พบอู่นี้':''})];
  nodes.push(mode==='empty'||mode==='search' ? await spEmpty(mode==='empty'?'ยังไม่มีอู่/ศูนย์บริการ':'ไม่พบอู่/ศูนย์บริการ',mode==='search') : await tbl(SP_VENDOR_COLS,rows,{pagination:rows.length}));
  const scr = await spPage('อู่/ศูนย์บริการ',{},nodes);
  if(mode==='saved') await toast(scr,{title:'บันทึกข้อมูลอู่สำเร็จ'});
  if(mode==='error') overlay(scr,alertBox('Error','โหลดรายการอู่ไม่สำเร็จ','ลองใหม่อีกครั้ง'),112,230);
  return scr;
}
async function spVendorForm(mode) {
  const filled = ['filled','edit'].includes(mode), error = mode==='validation';
  const v = filled ? SP_VENDORS[0] : {};
  const required = label=>({error:error?'กรุณาระบุ'+label:''});
  return spPage(mode==='edit'?'แก้ไขข้อมูลอู่/ศูนย์บริการ':'เพิ่มอู่/ศูนย์บริการ',{back:true},[
    col('Section',[await section('ข้อมูลอู่/ศูนย์บริการ'),
      field('ชื่ออู่/ศูนย์บริการ',v.name,required('ชื่ออู่/ศูนย์บริการ')),
      row('Row',[field('ประเภทที่รองรับ',v.type,{optional:true}),field('ยี่ห้อที่รองรับ',v.brand,{optional:true})]),
      area('ที่อยู่',v.address,{optional:true}),
      row('Row',[field('เบอร์โทร',v.phone,{optional:true}),field('อีเมล',v.email,{optional:true})])],16),
    col('Section',[await section('พิกัด'),row('Row',[field('ละติจูด',v.lat,{optional:true}),field('ลองจิจูด',v.lng,{optional:true})])],16),
    col('Section',[await section('เอกสารอ้างอิง'),await upload('เอกสารที่เกี่ยวข้อง',[],{optional:true})],16),
    btnRow([['Secondary button','ยกเลิก'],['Primary button','บันทึก']]),
  ]);
}
async function spVendorDetail(noRating) {
  const v = SP_VENDORS[noRating?1:0];
  return spPage('รายละเอียดอู่/ศูนย์บริการ',{back:true},[
    col('Section',[await sectionLabel('ข้อมูลอู่/ศูนย์บริการ',{buttons:[{kind:'Primary button',text:'แก้ไข'}]}),
      kv([['ชื่ออู่',v.name],['ประเภทที่รองรับ',v.type],['ยี่ห้อที่รองรับ',v.brand],['ที่อยู่',v.address],['เบอร์โทร',v.phone],['อีเมล',v.email]])],16),
    col('Section',[await sectionLabel('พิกัดและการนำทาง'),kv([['ละติจูด',v.lat],['ลองจิจูด',v.lng]]),btnRow([['Secondary button','นำทางด้วย Google Maps']])],16),
    col('Section',[await sectionLabel('คะแนนคุณภาพงานซ่อม'),kv([['คะแนนเฉลี่ย',spScore(v.ratings)]])],16),
    col('Section',[await sectionLabel('เอกสารและ Purchase Order ที่เกี่ยวข้อง'),
      v.po==='—'?await spEmpty('ยังไม่มีเอกสารอ้างอิง'):await tbl([['Purchase Order',180],['รายการ',0],['',56]],[[v.po,'งาน Overhaul รถ 72-6648 สงขลา',{icons:['quick_reference_all-24-300-round']}]]),
      await upload('เอกสารที่เกี่ยวข้อง',[],{readonly:true})],16),
  ]);
}
const SP_MA_COLS = [['เลขที่แผน',140],['ชื่อแผน',0],['หน่วยงาน',150],['รถ',160],['ช่วงเวลา',210],['สถานะ',135],['',56]];
async function spMaintenanceList(mode) {
  const p=SP_PLAN;
  return spPage('แผนบำรุงรักษา',{},[
    await tableHeader({placeholder:'ค้นหาเลขที่แผน, รถ, หน่วยงาน',primary:'สร้างแผน',query:mode==='search'?'ไม่พบแผนนี้':''}),
    mode==='empty'||mode==='search'?await spEmpty(mode==='empty'?'ยังไม่มีแผนบำรุงรักษา':'ไม่พบแผนบำรุงรักษา',mode==='search'):
      await tbl(SP_MA_COLS,[[p.id,p.name,p.org,p.plate,p.from+' – '+p.to,{pill:['รอดำเนินการ','Gray']},{menu:1}]],{pagination:1}),
  ]);
}
async function spMaintenanceForm(mode) {
  const p=mode==='filled'||mode==='edit'?SP_PLAN:{}, err=mode==='validation';
  const scr=await spPage(mode==='edit'?'แก้ไขแผนบำรุงรักษา':'สร้างแผนบำรุงรักษา',{back:true},[
    col('Section',[await section('ข้อมูลแผน'),field('ชื่อแผน',p.name,{error:err?'กรุณาระบุชื่อแผน':''}),
      dropdown('หน่วยงาน',p.org,{error:err?'กรุณาเลือกหน่วยงาน':''}),
      row('Row',[field('วันเริ่มต้น',p.from,{placeholder:'วว/ดด/ปปปป'}),field('วันสิ้นสุด',p.to,{placeholder:'วว/ดด/ปปปป'})])],16),
    col('Section',[await section('รถ/เครื่องจักรและรอบบำรุงรักษา'),
      await tbl([['เลือก',56],['ทะเบียน',160],['ยี่ห้อ/รุ่น',180],['ประเภท',0],['รอบบำรุงรักษา',280]],
        [PLAN_VEHICLES[7],PLAN_VEHICLES[1],PLAN_VEHICLES[2]].map((v,i)=>[{check:!!p.id&&i===0,text:''},v[1],v[2],v[3],p.cycle||'ยังไม่กำหนด'])),
      dropdown('รอบบำรุงรักษา',p.cycle,{error:err?'กรุณาเลือกรอบบำรุงรักษา':''})],16),
    btnRow([['Secondary button','ยกเลิก'],['Primary button','บันทึก']]),
  ]);
  return scr;
}
async function spMaintenanceDetail() {
  const p=SP_PLAN;
  return spPage('รายละเอียดแผน '+p.id,{back:true},[
    col('Section',[await sectionLabel('ข้อมูลแผน'),kv([['ชื่อแผน',p.name],['หน่วยงาน',p.org],['วันเริ่มต้น',p.from],['วันสิ้นสุด',p.to]])],16),
    col('Section',[await sectionLabel('รถ/เครื่องจักรในแผน'),await tbl([['ทะเบียน',180],['ประเภท',180],['รอบบำรุงรักษา',0]],[[p.plate,'รถกระเช้า',p.cycle]])],16),
    btnRow([['Secondary button','ย้อนกลับ'],['Primary button','แก้ไขแผน']]),
  ]);
}
async function spSchedule(mode) {
  const p=SP_PLAN;
  const scr=await spPage('ตารางแผนบำรุงรักษา',{},[
    await tableHeader({placeholder:'ค้นหาแผน, ทะเบียนรถ',query:mode==='filtered'?p.plate:''}),
    row('Filters',[dropdown('หน่วยงาน',mode==='filtered'?p.org:'ทั้งหมด'),dropdown('รถ',mode==='filtered'?p.plate:'ทั้งหมด'),field('ช่วงวันที่',p.from+' – '+p.to),dropdown('สถานะ','ทั้งหมด')]),
    mode==='empty'?await spEmpty('ไม่พบแผนในช่วงเวลาที่เลือก',true):await tbl([['วันเริ่มต้น',140],['วันสิ้นสุด',140],['รถ',170],['แผน',0],['หน่วยงาน',160],['สถานะ',140],['',56]],
      [[p.from,p.to,p.plate,p.name,p.org,{pill:['รอดำเนินการ','Gray']},{icons:['quick_reference_all-24-300-round']}]],{pagination:1}),
  ]);
  return scr;
}
async function spDue(mode) {
  const p=SP_PLAN;
  return spPage('งานบำรุงรักษาที่ต้องดำเนินการ',{},[
    await tableHeader({placeholder:'ค้นหาทะเบียนรถหรือแผน'}),
    mode==='empty'?await spEmpty('ไม่มีงานที่ต้องดำเนินการ'):await tbl([['รถ',180],['แผน',0],['ช่วงเวลา',210],['สถานะ',160],['',56]],
      [[p.plate,p.name,p.from+' – '+p.to,{pill:['ถึงกำหนดตามแผน','Warning']},{icons:['quick_reference_all-24-300-round']}]],{pagination:1}),
  ]);
}
const SP_NOTIFICATIONS = [
  ['Warning','แผน MA-700001 รถ 72-6648 สงขลา ถึงกำหนดบำรุงรักษา','9 พ.ย. 2569','เปิดงาน'],
  ['Success','บันทึกข้อมูลอู่/ศูนย์บริการ VND-001 แล้ว','9 พ.ย. 2569',''],
];
async function spNotifications(mode) {
  const s=await spDue(mode==='empty'?'empty':undefined);
  bell(s,mode!=='empty');
  if(mode==='open') await notiPanel(s,SP_NOTIFICATIONS,'2 รายการ');
  return s;
}
// UC-24-03: actual recorded costs are separate from replacement/Overhaul estimates.
const SP_COSTS = [
  {plate:'72-6648 สงขลา',model:'HINO FG1J',assetPrice:2480000,replacement:3300000,estimate:340000,labor:20000,parts:80000,other:10000,progress:100},
  {plate:'8234 กค กทม',model:'HINO FM2P',assetPrice:2030000,replacement:2700000,estimate:250000,labor:18000,parts:70000,other:7000,progress:40},
];
const spActual = c=>c.labor+c.parts+c.other;
function spCostSummary(rows) {
  return {count:rows.length,actual:rows.reduce((n,c)=>n+spActual(c),0),replacement:rows.reduce((n,c)=>n+c.replacement,0),
    estimate:rows.reduce((n,c)=>n+c.estimate,0),progress:rows.length?Math.round(rows.reduce((n,c)=>n+c.progress,0)/rows.length):null};
}
async function spCostDetail(overrun) {
  const c=Object.assign({},SP_COSTS[0],overrun?{other:2500000}:{}), actual=spActual(c);
  return spPage('เปรียบเทียบค่าใช้จ่าย Overhaul',{back:true},[
    col('Section',[await sectionLabel('ยานพาหนะ'),kv([['ทะเบียน',c.plate],['ยี่ห้อ/รุ่น',c.model]])],16),
    col('Section',[await sectionLabel('ค่าใช้จ่ายที่บันทึก'),await tbl([['รายการ',0],['จำนวนเงิน (บาท)',220]],
      [['ค่าแรง',currency(c.labor)],['ค่าอะไหล่',currency(c.parts)],['ค่าใช้จ่ายอื่น',currency(c.other)],['รวมค่าใช้จ่ายจริง',currency(actual)]])],16),
    col('Section',[await sectionLabel('เปรียบเทียบราคา'),kv([
      ['มูลค่ารถ',currency(c.assetPrice)+' บาท'],['ประมาณการซื้อใหม่ทดแทน',currency(c.replacement)+' บาท'],
      ['ราคาประเมิน Overhaul',currency(c.estimate)+' บาท'],['ค่าใช้จ่ายจริง',currency(actual)+' บาท'],
      ['ส่วนต่างซื้อใหม่กับค่าใช้จ่ายจริง',currency(c.replacement-actual)+' บาท'],['ค่าใช้จ่ายจริงต่อมูลค่ารถ',(actual/c.assetPrice*100).toFixed(2)+'%']])],16),
    ...(overrun?[alertBox('Warning','ค่าใช้จ่ายจริงสูงกว่ามูลค่ารถ','ตรวจสอบรายละเอียดค่าใช้จ่ายก่อนดำเนินการต่อ')]:[]),
    btnRow([['Secondary button','ย้อนกลับ']]),
  ]);
}
const SP_PART = {code:'PE08642',name:'ไส้กรองแอร์',unit:'ชิ้น',stock:12,issued:3,returned:1};
function spQuantityError(kind,value) {
  if(value==null||String(value).trim()==='')return 'กรุณาระบุจำนวน';
  const q=Number(value),max=kind==='return'?SP_PART.issued-SP_PART.returned:SP_PART.stock;
  if(!Number.isInteger(q)||q<=0)return 'กรุณาระบุจำนวนเต็มมากกว่า 0';
  return q>max?'จำนวนเกิน'+(kind==='return'?'ที่สามารถคืนได้':'คงเหลือ'):'';
}
const SP_REPAIR_CONTEXT={work:'งานซ่อม',ref:'REQ-690001',plate:'72-6648 สงขลา'};
const SP_OVERHAUL_CONTEXT={work:'งาน Overhaul',ref:'PO-700201',plate:'72-6648 สงขลา'};
async function spPartsForm(kind,mode,context) {
  context=context||SP_OVERHAUL_CONTEXT;
  const ret=kind==='return', title=ret?'คืนอะไหล่':'เบิกอะไหล่', p=SP_PART;
  const qty=mode==='filled'?(ret?'1':'2'):mode==='validation'?'99':'';
  return spPage(title+' — '+context.work,{back:true},[
    col('Section',[await section('งานอ้างอิง'),kv([['ทะเบียน',context.plate],['งานอ้างอิง',context.ref]])],16),
    col('Section',[await section('รายละเอียดอะไหล่'),
      dropdown('อะไหล่',mode?p.code+' · '+p.name:'',{placeholder:'เลือกอะไหล่'+(ret?'ที่เคยเบิกในงานนี้':'จากคลัง')}),
      kv(ret?[['เบิกแล้ว',p.issued+' '+p.unit],['คืนแล้ว',p.returned+' '+p.unit],['คืนได้อีก',(p.issued-p.returned)+' '+p.unit]]:[['คงเหลือ',p.stock+' '+p.unit]]),
      field('จำนวน ('+p.unit+')',qty,{error:mode==='validation'?spQuantityError(kind,qty):''}),area('หมายเหตุ','',{optional:true})],16),
    btnRow([['Secondary button','ยกเลิก'],['Primary button','ส่งคำขอ'+title+'ไปคลัง']]),
  ]);
}
async function spPartsHistory() {
  const p=SP_PART;
  return spPage('เบิก–คืนอะไหล่ Overhaul',{back:true},[
    col('Section',[await sectionLabel('งานอ้างอิง'),kv([['ทะเบียน','72-6648 สงขลา'],['Purchase Order','PO-700201']])],16),
    btnRow([['Secondary button','ขอคืนอะไหล่'],['Primary button','ขอเบิกอะไหล่']]),
    await tbl([['รหัสอะไหล่',140],['ชื่ออะไหล่',0],['จำนวนเบิก',150],['คืนแล้ว',150],['ใช้สุทธิ',150]],
      [[p.code,p.name,p.issued+' '+p.unit,p.returned+' '+p.unit,(p.issued-p.returned)+' '+p.unit]],{pagination:1}),
  ]);
}
const SP_STOCK_REQUESTS=[
  {id:'STK-REQ-001',kind:'เบิก',qty:2,status:'รอคลังดำเนินการ'},
  {id:'STK-REQ-002',kind:'คืน',qty:1,status:'รอคลังดำเนินการ'},
];
async function spStockRequest(kind,mode,context) {
  context=context||SP_OVERHAUL_CONTEXT;
  const ret=kind==='return', label=ret?'คืน':'เบิก', request=SP_STOCK_REQUESTS[ret?1:0];
  if(mode==='confirm'){
    const scr=await spPartsForm(kind,'filled',context);
    await confirm(scr,{title:'ยืนยันส่งคำขอ'+label+'อะไหล่',sub:SP_PART.name+' · '+request.qty+' '+SP_PART.unit+' · ส่งให้คลังดำเนินการ',ok:'ส่งคำขอไปคลัง'});
    return scr;
  }
  const scr=await spPage('คำขอ'+label+'อะไหล่ '+request.id,{back:true},[
    col('Section',[await sectionLabel('รายละเอียดคำขอ'),kv([
      ['เลขที่คำขอ',request.id],['ประเภท','ขอ'+label+'อะไหล่'],['สถานะ',request.status],['รถ',context.plate],['งานอ้างอิง',context.ref],
      ['อะไหล่',SP_PART.code+' · '+SP_PART.name],['จำนวนที่ขอ',request.qty+' '+SP_PART.unit],['จำนวนที่คลังดำเนินการแล้ว','—']])],16),
    col('Section',[await sectionLabel('ยอดเบิก–คืนที่คลังดำเนินการแล้ว'),kv([
      ['เบิกแล้ว',SP_PART.issued+' '+SP_PART.unit],['คืนแล้ว',SP_PART.returned+' '+SP_PART.unit]])],16),
    btnRow([['Secondary button','กลับรายการคำขอ']]),
  ]);
  await toast(scr,{title:'ส่งคำขอ'+label+'อะไหล่ไปคลังแล้ว',sub:'รอคลังดำเนินการ'});
  return scr;
}
async function spStockRequests() {
  return spPage('คำขอเบิก–คืนอะไหล่ Overhaul',{back:true},[
    await tableHeader({placeholder:'ค้นหาเลขคำขอหรือรหัสอะไหล่'}),
    await tbl([['เลขที่คำขอ',170],['ประเภท',100],['อะไหล่',0],['จำนวนที่ขอ',160],['สถานะ',210],['',56]],
      SP_STOCK_REQUESTS.map(r=>[r.id,r.kind,SP_PART.code+' · '+SP_PART.name,r.qty+' '+SP_PART.unit,{pill:[r.status,'Warning']},{icons:['quick_reference_all-24-300-round']}]),{pagination:2}),
  ]);
}
async function spOverhaulDashboard(mode) {
  const rows=mode==='empty'?[]:mode==='filtered'?SP_COSTS.slice(0,1):SP_COSTS, s=spCostSummary(rows);
  const metrics=[['รถในผลลัพธ์',s.count,'Brand'],['ค่าใช้จ่ายจริง (บาท)',currency(s.actual),'Info'],
    ['ประมาณการซื้อใหม่ (บาท)',currency(s.replacement),'Warning'],['ส่วนต่างกับค่าใช้จ่ายจริง (บาท)',currency(s.replacement-s.actual),'Success']];
  return spPage('รายงานและ Dashboard Overhaul',{},[
    await tableHeader({placeholder:'ค้นหาทะเบียน, ยี่ห้อ/รุ่น',query:mode==='filtered'?'HINO FG1J':''}),
    row('Filters',[dropdown('หน่วยงาน','ทั้งหมด'),field('ช่วงวันที่','16/11/2569 – 27/11/2569'),dropdown('ยี่ห้อ/รุ่น',mode==='filtered'?'HINO FG1J':'ทั้งหมด')]),
    metricRow(await Promise.all(metrics.map(m=>metric(...m)))),
    rows.length?await tbl([['รถ',170],['ประเมิน Overhaul (บาท)',190],['ค่าใช้จ่ายจริง (บาท)',190],['ซื้อใหม่ทดแทน (บาท)',200],['ความคืบหน้า',160],['',56]],
      rows.map(c=>[c.plate,currency(c.estimate),currency(spActual(c)),currency(c.replacement),{progress:c.progress},{icons:['quick_reference_all-24-300-round']}]),{pagination:rows.length}):await spEmpty('ไม่พบข้อมูลงาน Overhaul',true),
    btnRow([['Secondary button','ส่งออก Excel'],['Primary button','ส่งออก PDF']]),
  ]);
}
async function spReports(mode) {
  return spPage('รายงานและแบบฟอร์ม',{},[
    await tableHeader({placeholder:'ค้นหาชื่อรายงาน',query:mode==='empty'?'ไม่พบรายงานนี้':''}),
    row('Filters',[dropdown('ประเภทรายงาน','Overhaul'),dropdown('หน่วยงาน','ทั้งหมด'),field('ช่วงวันที่','16/11/2569 – 27/11/2569')]),
    mode==='empty'?await spEmpty('ไม่พบรายงานตามเงื่อนไข',true):await tbl([['รายงาน',0],['ช่วงเวลา',220],['รูปแบบ',160],['',56]],
      [['สรุปค่าใช้จ่าย Overhaul','16/11/2569 – 27/11/2569','Excel / PDF',{icons:['quick_reference_all-24-300-round']}]],{pagination:1}),
  ]);
}
async function spReportFiles(mode) {
  const ready=mode!=='empty'&&mode!=='error';
  return spPage('ไฟล์รายงาน',{back:true},[
    col('Section',[await sectionLabel('เงื่อนไขรายงาน'),kv([['รายงาน','สรุปค่าใช้จ่าย Overhaul'],['หน่วยงาน','ทั้งหมด'],['ช่วงวันที่','16/11/2569 – 27/11/2569']])],16),
    col('Section',[await sectionLabel('ไฟล์รายงาน'),
      mode==='error'?alertBox('Error','โหลดไฟล์รายงานไม่สำเร็จ','กรุณาลองใหม่อีกครั้ง'):
        ready?await spDownloadFiles([{name:'overhaul-cost-2569-11.pdf',size:'240 KB'},{name:'overhaul-cost-2569-11.xlsx',size:'32 KB'}]):await spEmpty('ยังไม่มีไฟล์รายงาน')],16),
    btnRow([['Secondary button','ย้อนกลับ'],['Primary button',mode==='error'?'ลองใหม่':'สร้างรายงาน']]),
  ]);
}
async function spDownloadFiles(files) {
  const n=await upload('ไฟล์รายงาน',files,{readonly:true});
  for(const item of n.findAll(c=>c.name==='_File upload item base')) {
    if(item.visible!==false)setProps(item,{'Download action':true,'Delete action':false,Actions:true});
  }
  return n;
}
const SP_RESPONSES=[
  {id:'APT-IN-001',kind:'นัดนำรถเข้าอู่',plate:'72-6648 สงขลา',ref:'PO-700201',date:'16/11/2569',org:'กฟฟ.สงขลา',place:SP_VENDORS[0].name},
  {id:'APT-OUT-001',kind:'นัดรับรถ',plate:'72-6648 สงขลา',ref:'PO-700201',date:'27/11/2569',org:'กฟฟ.สงขลา',place:SP_VENDORS[0].name},
  {id:'MA-REPLY-001',kind:'แผนบำรุงรักษา',plate:SP_PLAN.plate,ref:SP_PLAN.id,date:SP_PLAN.from+' – '+SP_PLAN.to,org:SP_PLAN.org,place:SP_PLAN.org},
];
async function spResponseList(empty) {
  return spPage('รายการรอตอบรับ',{},[
    await tableHeader({placeholder:'ค้นหาเลขที่รายการ, ทะเบียนรถ'}),
    row('Filters',[dropdown('ประเภทงาน','ทั้งหมด'),dropdown('สถานะ','รอตอบรับ')]),
    empty?await spEmpty('ไม่มีรายการรอตอบรับ'):await tbl([['เลขที่รายการ',160],['ประเภท',170],['รถ',170],['วันนัด / ช่วงเวลา',230],['งานอ้างอิง',170],['สถานะ',140],['',56]],
      SP_RESPONSES.map(r=>[r.id,r.kind,r.plate,r.date,r.ref,{pill:['รอตอบรับ','Warning']},{icons:['quick_reference_all-24-300-round']}]),{pagination:SP_RESPONSES.length}),
  ]);
}
const spResponseReasonError=reason=>String(reason||'').trim()?'':'กรุณาระบุเหตุผลการปฏิเสธ';
async function spResponseDetail(index,mode) {
  const r=SP_RESPONSES[index], rejected=mode==='rejected', accepted=mode==='accepted', done=rejected||accepted;
  const reasonMode=mode==='reject'||mode==='validation'||rejected;
  const reason=rejected?'รถติดภารกิจในวันที่นัดหมาย':'';
  const nodes=[col('Section',[await sectionLabel('รายละเอียด'+r.kind),kv([
    ['เลขที่รายการ',r.id],['รถ',r.plate],['งานอ้างอิง',r.ref],['วันนัด / ช่วงเวลา',r.date],['หน่วยงาน',r.org],['สถานที่',r.place],
    ['สถานะ',accepted?'ตอบรับแล้ว':rejected?'ปฏิเสธแล้ว':'รอตอบรับ']])],16)];
  if(reasonMode)nodes.push(col('Section',[await (done?sectionLabel('เหตุผลการปฏิเสธ'):section('เหตุผลการปฏิเสธ')),
    done?kv([['เหตุผล',reason]]):area('เหตุผลการปฏิเสธ','',{placeholder:'ระบุเหตุผล',error:mode==='validation'?spResponseReasonError(''):''})],16));
  nodes.push(done?btnRow([['Secondary button','กลับรายการ']]):reasonMode?
    btnRow([['Secondary button','ยกเลิก'],['Primary button','ยืนยันการปฏิเสธ']]):
    btnRow([['Secondary button','ปฏิเสธ'],['Primary button','ยืนยันตอบรับ']]));
  const scr=await spPage(r.kind+' — '+r.id,{back:true},nodes);
  if(mode==='confirm')await confirm(scr,{title:'ยืนยันตอบรับ'+r.kind,sub:r.plate+' · '+r.date,ok:'ยืนยันตอบรับ'});
  if(done)await toast(scr,{title:accepted?'ตอบรับเรียบร้อยแล้ว':'บันทึกการปฏิเสธแล้ว'});
  if(mode==='error')await toast(scr,{title:'ส่งคำตอบไม่สำเร็จ',sub:'กรุณาลองใหม่อีกครั้ง',err:true});
  return scr;
}
const SP_SCENARIOS = [
  ['อู่และศูนย์บริการ · UC-6/18',[
    ['รายการอู่',()=>spVendorList()],['เพิ่มอู่ — ว่าง',()=>spVendorForm()],['เพิ่มอู่ — กรอกครบ',()=>spVendorForm('filled')],
    ['Validation',()=>spVendorForm('validation')],['รายละเอียดและคะแนน',()=>spVendorDetail()],['รายละเอียด — ยังไม่มีคะแนน',()=>spVendorDetail(true)],
    ['แก้ไขข้อมูลอู่',()=>spVendorForm('edit')],['บันทึกสำเร็จ',()=>spVendorList('saved')],['ไม่มีข้อมูล',()=>spVendorList('empty')],['ค้นหาไม่พบ',()=>spVendorList('search')],['โหลดไม่สำเร็จ',()=>spVendorList('error')],
  ]],
  ['กำหนดแผนบำรุงรักษา · UC-7',[
    ['รายการแผน',()=>spMaintenanceList()],['สร้างแผน — ว่าง',()=>spMaintenanceForm()],['สร้างแผน — กรอกครบ',()=>spMaintenanceForm('filled')],
    ['Validation',()=>spMaintenanceForm('validation')],['รายละเอียดแผน',()=>spMaintenanceDetail()],['แก้ไขแผน',()=>spMaintenanceForm('edit')],
    ['ไม่มีข้อมูล',()=>spMaintenanceList('empty')],['ค้นหาไม่พบ',()=>spMaintenanceList('search')],
  ]],
  ['ตารางและตัวกรองแผน · UC-8',[
    ['ตารางแผน',()=>spSchedule()],['กรองรถและหน่วยงาน',()=>spSchedule('filtered')],['ไม่พบแผนในช่วงเวลา',()=>spSchedule('empty')],
  ]],
  ['แจ้งเตือนตามแผนและ Notification · UC-9',[
    ['รายการงานที่ต้องดำเนินการ',()=>spDue()],['ไม่มีงาน',()=>spDue('empty')],['กระดิ่งมีแจ้งเตือน',()=>spNotifications()],['เปิดแผงแจ้งเตือน',()=>spNotifications('open')],['เปิดงานจากแจ้งเตือน',()=>spMaintenanceDetail()],
  ]],
  ['ค่าใช้จ่ายและเบิก–คืน Overhaul · UC-24-03',[
    ['เปรียบเทียบค่าใช้จ่ายจริง',()=>spCostDetail()],['ค่าใช้จ่ายสูงกว่ามูลค่ารถ',()=>spCostDetail(true)],['รายการเบิก–คืน',()=>spPartsHistory()],
    ['เบิกอะไหล่ — ว่าง',()=>spPartsForm('issue')],['เบิกอะไหล่ — กรอกครบ',()=>spPartsForm('issue','filled')],['เบิกเกินคงเหลือ',()=>spPartsForm('issue','validation')],
    ['คืนอะไหล่ — ว่าง',()=>spPartsForm('return')],['คืนอะไหล่ — กรอกครบ',()=>spPartsForm('return','filled')],['คืนเกินยอดเบิก',()=>spPartsForm('return','validation')],
    ['ยืนยันส่งคำขอเบิก',()=>spStockRequest('issue','confirm')],['ส่งคำขอเบิกแล้ว — รอคลัง',()=>spStockRequest('issue')],
    ['ยืนยันส่งคำขอคืน',()=>spStockRequest('return','confirm')],['ส่งคำขอคืนแล้ว — รอคลัง',()=>spStockRequest('return')],['รายการคำขอรอคลัง',()=>spStockRequests()],
  ]],
  ['Dashboard และส่งออก Overhaul · UC-24-04',[
    ['Dashboard ค่าใช้จ่ายจริง',()=>spOverhaulDashboard()],['กรองยี่ห้อ/รุ่น',()=>spOverhaulDashboard('filtered')],['ไม่พบข้อมูล',()=>spOverhaulDashboard('empty')],
  ]],
  ['ค้นหาและเลือกรายงาน · UC-25/25-01',[
    ['รายการรายงาน',()=>spReports()],['ค้นหาไม่พบ',()=>spReports('empty')],['รายการไฟล์ PDF/Excel',()=>spReportFiles()],
    ['ยังไม่มีไฟล์',()=>spReportFiles('empty')],['โหลดไฟล์ไม่สำเร็จ',()=>spReportFiles('error')],
  ]],
  ['ทางเข้า Keycloak · 1.0.10',[
    ['ทางเข้าใช้งาน',()=>spLogin()],['กำลังเปิด Keycloak',()=>spLogin('loading')],['เข้าสู่ระบบไม่สำเร็จ',()=>spLogin('error')],
  ]],
  ['วิเคราะห์อาการและแนะนำอู่ตามประเภทรถ · UC-16/16-01',[
    ['ยังไม่เลือกประเภทรถ',()=>spDiagnosis('unselected')],['อู่ที่รองรับประเภทรถ',()=>spDiagnosis()],['กรอกคำแนะนำแล้ว',()=>spDiagnosis('filled')],
    ['ไม่พบอู่ที่รองรับ',()=>spDiagnosis('empty')],['Validation',()=>spDiagnosis('validation')],['บันทึกสำเร็จ',()=>spDiagnosis('saved')],['โหลดอู่ไม่สำเร็จ',()=>spDiagnosis('error')],
    ['เลือกซ่อมเอง',()=>spDiagnosis('self')],
    ['นัดซ่อม — ว่าง',()=>spRepairAppointment()],['นัดซ่อม — กรอกครบ',()=>spRepairAppointment('filled')],['นัดซ่อม — Validation',()=>spRepairAppointment('validation')],['ส่งนัดซ่อมแล้ว',()=>spRepairAppointment('saved')],
    ['ขอเบิกอะไหล่สำหรับงานซ่อม',()=>spPartsForm('issue','filled',SP_REPAIR_CONTEXT)],['ยืนยันคำขออะไหล่งานซ่อม',()=>spStockRequest('issue','confirm',SP_REPAIR_CONTEXT)],['ส่งคำขออะไหล่งานซ่อมแล้ว',()=>spStockRequest('issue',undefined,SP_REPAIR_CONTEXT)],
  ]],
  ['Flow ตอบรับนัดเข้าอู่ รับรถ และแผนบำรุงรักษา',[
    ['รายการรอตอบรับ',()=>spResponseList()],['ไม่มีรายการ',()=>spResponseList(true)],
    ['รายละเอียดนัดเข้าอู่',()=>spResponseDetail(0)],['รายละเอียดนัดรับรถ',()=>spResponseDetail(1)],['รายละเอียดแผนบำรุงรักษา',()=>spResponseDetail(2)],
    ['ยืนยันตอบรับ',()=>spResponseDetail(0,'confirm')],['ตอบรับนัดเข้าอู่แล้ว',()=>spResponseDetail(0,'accepted')],
    ['ตอบรับนัดรับรถแล้ว',()=>spResponseDetail(1,'accepted')],['ตอบรับแผนบำรุงรักษาแล้ว',()=>spResponseDetail(2,'accepted')],
    ['ระบุเหตุผลปฏิเสธ',()=>spResponseDetail(0,'reject')],['Validation เหตุผล',()=>spResponseDetail(0,'validation')],
    ['ปฏิเสธแล้ว',()=>spResponseDetail(0,'rejected')],['ส่งคำตอบไม่สำเร็จ',()=>spResponseDetail(0,'error')],
  ]],
];
const SP_PENDING = [
  {feature:'ปฏิทิน',reason:'เจ้าของงานยืนยันให้ใช้ตารางก่อน และพักปฏิทินไว้'},
  {feature:'การดำเนินการของคลัง',reason:'ขอบเขตที่ยืนยันจบที่ส่งคำขอไปคลัง; ไม่รวมจอตัด/คืนสต็อกของเจ้าหน้าที่คลัง'},
  {feature:'เนื้อหา PDF แบบ กฟภ.',reason:'ทำถึงเลือก/กรอง/รายการไฟล์ตามที่ยืนยัน; พักเนื้อหาเอกสารจนได้รับแบบจริง'},
];
const SP_GROUPS = SP_SCENARIOS.map(([title,screens],i)=>{const code=String.fromCharCode(65+i);return {code,title,subs:[{code,title,tag:'SP09',screens}]};});
// Resolve only shared primitives used by these screens, not ReceiptChecklist,
// appointment composites, signatures or unrelated Overhaul-only dependencies.
const SP_COMPONENTS = ['Sidebar navigation','Header navigation','Page header','Section header','Section label','Table','Content item row','Table header',
  'Table pagination','Text input','Input dropdown','Text area','File upload','Input label','Badge outline with remove icon','Alert','Pill outline',
  'Primary button','Secondary button','Notification','Notification card','Modal','Empty state/Search not found','Empty state/Data empty','Metric item',
  'add-24-300-round','filter_list-24-400-round','more_horiz-20-400-round','quick_reference_all-24-300-round','stylus-24-300-round',
  'keyboard_arrow_left-20-400-round','keyboard_arrow_right-20-400-round',...NESTED,'Header','Device Type','Component 1'];
async function spBuild(pick) {
  const indexes = Array.isArray(pick)?pick:SP_GROUPS.map((_,i)=>i);
  const groups=SP_GROUPS.filter((_,i)=>indexes.includes(i));
  if(!groups.length) throw new Error('กรุณาเลือกกลุ่มฟีเจอร์ก่อน');
  errors.length=0; await resolveAll(Array.from(new Set(SP_COMPONENTS)));
  const target=await targetPage('sp09-desktop','SP09');
  await figma.setCurrentPageAsync(target.page);
  const y=target.page.children.reduce((m,n)=>Math.max(m,n.y+n.height+400),0);
  const count=groups.reduce((n,g)=>n+g.subs[0].screens.length,0);
  const result=await buildGrid(target.page,'SP09',groups,y,count,{devices:[false]});
  const report={page:target.page.name,created:result.made.length,expected:result.expected,failed:result.failed,incomplete:result.incomplete};
  figma.ui.postMessage({type:'build-report',report});
  if(result.made.length){target.page.selection=result.made;figma.viewport.scrollAndZoomIntoView(result.made.slice(0,3));}
  log('สร้าง '+report.created+'/'+report.expected+' จอ · ล้มเหลว '+report.failed.length+' · มีคำเตือน '+report.incomplete.length);
}
figma.ui.onmessage=async msg=>{
  try {
    if(msg.type==='build') await spBuild(msg.pick);
    if(msg.type==='check') await resolveAll(Array.from(new Set(SP_COMPONENTS)),true);
    if(msg.type==='read-selection') await readSelection();
  } catch(e) {log('✗ '+e.message);figma.ui.postMessage({type:'stopped',error:e.message});}
};
figma.ui.postMessage({type:'sp-inventory',items:SP_GROUPS.map(g=>({code:g.code,title:g.title,count:g.subs[0].screens.length})),pending:SP_PENDING});
