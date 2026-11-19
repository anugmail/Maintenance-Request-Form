#!/usr/bin/env node
// Shared behavior from the repair UAT review; this does not prove Figma layout.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({__html__:'',figma:{showUI(){},ui:{postMessage(){}}}});
const run = code => vm.runInContext(code, context);
run(fs.readFileSync(path.join(__dirname,'overhaul2-plugin/code.js'),'utf8'));
run(`
 function node(name,children=[]){return {name,type:'INSTANCE',children,props:{},visible:true,
  findAll(fn){const out=[];const walk=n=>{for(const c of n.children){if(fn(c))out.push(c);walk(c);}};walk(this);return out;}};}
 function inst(name,variant,props){
  const n=node(name);Object.assign(n.props,variant,props);
  if(name==='File upload')n.children=[node('_File upload base'),...Array.from({length:3},()=>node('_File upload item base'))];
  if(name==='RepairAppointmentStep')n.children=[node('Appointment section',[
   node('Container',[node('Date picker'),node('Input dropdown'),node('Text input')]),node('Text area')])];
  return n;
 }
 function setProps(n,p){Object.assign(n.props,p);}
 async function text(n,layer,value){n[layer]=value;}
`);
(async()=>{
 assert.equal(run("currency('1,234.5')"),'1,234.50');
 assert.equal(run("currency('0')"),'0.00');
 assert.equal(run('currency(0)'),'0.00');
 assert.equal(run("currency('')"),'—');
 assert.equal(run("field('จำนวนเงิน (บาท)',0).props.Text"),'0.00');
 assert.equal(run("field('วงเงินอนุมัติ (บาท)','1,234.5').props.Text"),'1,234.50');
 assert.equal(run("field('จำนวนเงิน (บาท)','',{placeholder:'ระบุจำนวนเงิน'}).props.Text"),'ระบุจำนวนเงิน');
 assert.equal(run("planRowD(['id','name','dept','budget','code','2569','1000',1,0,0,'P1','today'])[4]"),'1,000.00');
 assert.equal(run("planRowD8(['id','name','dept','budget','code','2569','0',1,0,0,'P1','today'])[3].text"),'0.00');
 const amountMetric=await run("metric('ค่าใช้จ่ายจริง (บาท)',0)");
 assert.equal(amountMetric.props.Number,'0.00');
 run(`function col(name,children){return {name,children};} async function section(title){return {title};} function kv(pairs){return {pairs};}`);
 const closedZero=await run('joCostSection(0,true)');
 assert.equal(closedZero.children[1].pairs[0][1],'0.00');
 const openZero=await run('joCostSection(0,false)');
 assert.equal(openZero.children[1].props.Text,'0.00');
 assert.equal(run('FILTER_BUDGET_LABELS[1]'),'มากกว่า 1,000,000.00 - 5,000,000.00');
 assert.equal(run("field('เลขไมล์',1234).props.Text"),'1234','non-money values keep their units');

 const readonly = await run("upload('เอกสาร',[{name:'file.pdf',size:'10 KB'}],{readonly:true})");
 const first = readonly.children[1];
 assert.equal(readonly.props['File upload'],false);
 assert.equal(first.props['Download action'],true,'read-only attachments must remain downloadable');
 assert.equal(first.props['Delete action'],false);
 const editing=await run("upload('เอกสาร',[{name:'file.pdf',size:'10 KB'},{name:'pending.pdf',progress:true},{name:'failed.pdf',err:true}],{})");
 assert.equal(editing.props['File upload'],true);
 assert.equal(editing.children[1].props['Download action'],true);
 assert.equal(editing.children[1].props['Delete action'],true);
 assert.equal(editing.children[2].props['Download action'],false,'unfinished files cannot be downloaded');
 assert.equal(editing.children[2].props['Delete action'],true);
 assert.equal(editing.children[3].props['Download action'],false);
 const failed=await run("upload('เอกสาร',[{name:'failed.pdf',err:true}],{readonly:true})");
 assert.equal(failed.children[1].props.Actions,false,'hide empty action slots');
 assert.equal(run("field('จำนวนเงิน',0).props.Text"),'0.00');
 assert.equal(run("field('จำนวนเงิน',0).props['Show Placeholder']"),false);
 const blank=run("repairAppt(false,'form',{})");
 const blankPhone=blank.node.findAll(n=>n.name==='Text input')[0];
 assert.equal(blankPhone.props.State,'Readonly');
 assert.equal(blankPhone.props.Text,'แสดงเมื่อเลือกผู้ประสานงาน');
 const filled=run("repairAppt(false,'form',{coord:true})");
 assert.equal(filled.node.findAll(n=>n.name==='Text input')[0].props.State,'Readonly');
 assert.equal(filled.node.findAll(n=>n.name==='Text input')[0].props.Text,run('COORD[2]'));
 assert.equal(run('EXIT_CONFIRM.cancel'),'ยกเลิก');
 assert.equal(run('EXIT_CONFIRM.ok'),'ยืนยัน');
 assert.equal(run('EXIT_CONFIRM.title'),'คุณต้องการออกจากหน้านี้หรือไม่ ?');
 assert.equal(run('DOC_HINT'),run('PO_FILE_HINT'));
 assert.ok(run("DOC_HINT.includes('10 MB')"));
 console.log('PASS: read-only downloads, upload states, zero values, computed phone, shared file guidance');
})().catch(error=>{console.error(error);process.exitCode=1});
