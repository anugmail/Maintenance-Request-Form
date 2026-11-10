#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
class Node {
  constructor(type='FRAME',name=''){Object.assign(this,{type,name,children:[],width:1440,height:1024,x:0,y:0,visible:true,componentProperties:{}});}
  appendChild(n){if(this.type==='INSTANCE')throw Error('Cannot append into instance');if(n.parent)n.parent.children=n.parent.children.filter(c=>c!==n);this.children.push(n);n.parent=this;}
  insertChild(i,n){this.appendChild(n);this.children.splice(this.children.indexOf(n),1);this.children.splice(i,0,n);}
  findAll(fn){const out=[];const walk=n=>{for(const c of n.children){if(fn(c))out.push(c);walk(c);}};walk(this);return out;}
  findOne(fn){return this.findAll(fn)[0]||null;}
  resize(w,h){assert.ok(w>0&&h>0);this.width=w;this.height=h;}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);}
  setProperties(p){for(const [k,v]of Object.entries(p))this.componentProperties[k].value=v;}
  get absoluteBoundingBox(){return{x:this.x,y:this.y,width:this.width,height:this.height};}
}
const page=new Node('PAGE','SP09 test'),messages=[];
const context=vm.createContext({__html__:'',console,figma:{
  currentPage:page,showUI(){},ui:{postMessage(m){messages.push(m);}},
  createFrame(){const n=new Node();page.appendChild(n);return n;},
  createText(){const n=new Node('TEXT');n.characters='';page.appendChild(n);return n;},
  async loadFontAsync(){},variables:{async getLocalVariableCollectionsAsync(){return[];}},
}});
const run=s=>vm.runInContext(s,context);
run(fs.readFileSync(path.join(__dirname,'sp09-plugin/code.js'),'utf8'));
context.component=name=>({type:'COMPONENT',name,id:name,createInstance(){const n=new Node('INSTANCE',name);page.appendChild(n);return n;}});
run('for(const name of SP_COMPONENTS) INDEX.set(name,component(name))');
(async()=>{
  const inventory=run('SP_SCENARIOS.map((g,i)=>g[1].map((s,j)=>({i,j,label:s[0]}))).flat()');
  assert.equal(inventory.length,80);
  const failed=[];
  for(const item of inventory){
    try{const scr=await run(`SP_SCENARIOS[${item.i}][1][${item.j}][1]()`);assert.equal(scr.type,'FRAME');context.screen=scr;run('stripDividers(screen); fitOverlays(screen)');}
    catch(e){failed.push({...item,error:e.message});}
    for(const n of page.children.slice())n.remove();
  }
  assert.deepEqual(failed,[]);
  const undeclared=run('[...USED].filter(name=>!SP_COMPONENTS.includes(name))');
  assert.equal(undeclared.length,0,'undeclared import dependencies: '+undeclared.join(', '));
  assert.equal(run('spScore([])'),'ยังไม่มีคะแนน');
  assert.equal(run('spScore([4,5])'),'4.5 / 5 (2 ครั้ง)');
  assert.equal(run('spActual(SP_COSTS[0])'),110000);
  assert.equal(run('spCostSummary(SP_COSTS.slice(0,1)).actual'),110000);
  assert.equal(run('spCostSummary(SP_COSTS.slice(0,1)).progress'),100);
  assert.equal(run('spCostSummary([]).progress'),null);
  assert.equal(run("spQuantityError('return',2)"),'');
  assert.equal(run("spQuantityError('return',3)"),'จำนวนเกินที่สามารถคืนได้');
  assert.equal(run("spQuantityError('issue',12)"),'');
  assert.equal(run("spQuantityError('issue',13)"),'จำนวนเกินคงเหลือ');
  assert.equal(run("spQuantityError('issue','')"),'กรุณาระบุจำนวน');
  assert.equal(run("spQuantityError('issue',0)"),'กรุณาระบุจำนวนเต็มมากกว่า 0');
  assert.equal(run('SP_COMPONENTS.includes("ReceiptChecklist")'),false);
  assert.equal(run("spRecommendVendors('รถกระเช้า').length"),1);
  assert.equal(run("spRecommendVendors('รถกระเช้า')[0].id"),'VND-001');
  assert.equal(run("spRecommendVendors('รถเจาะหลุม').length"),0);
  assert.equal(run("spRecommendVendors('').length"),0);
  assert.equal(run("spRecommendVendors('รถกระเช้า',[{type:'รถกระเช้า',brand:'OTHER',address:'ไกล'}]).length"),1,'must not filter by brand or distance');
  assert.equal(run("spRecommendVendors('รถกระเช้า',[{types:['รถเครน','รถกระเช้า']}]).length"),1);
  assert.equal(run("spResponseReasonError('   ')"),'กรุณาระบุเหตุผลการปฏิเสธ');
  assert.equal(run("spResponseReasonError('รถติดภารกิจ')"),'');
  assert.equal(run('SP_STOCK_REQUESTS.every(r=>r.status==="รอคลังดำเนินการ")'),true);
  assert.equal(run('SP_PART.stock'),12,'submitting request screens must not deduct stock');
  assert.equal(run('SP_PART.returned'),1,'return request screens must not change completed returns');
  const login=await run('spLogin()');
  assert.equal(login.findAll(n=>n.name==='Sidebar navigation'||n.name==='Header navigation').length,0,'public entry must not show signed-in navigation');
  assert.equal(login.findAll(n=>n.name==='Text input').length,0,'credentials must be entered in Keycloak, not Maintain-D');
  assert.ok(run('SP_PENDING.every(item=>!/รอยืนยันเจ้าหน้าที่|รอยืนยันขอบเขตหน้า/.test(item.reason))'));
  assert.ok(messages.some(m=>m.type==='sp-inventory'));
  assert.ok(!messages.some(m=>m.type==='scenarios'),'must not expose old Overhaul inventory');
  console.log(`PASS: ${inventory.length} SP09 callbacks, declared dependencies, no insertion into instances, score fixtures, isolated dispatch (not real import/layout validation)`);
})().catch(e=>{console.error(e);process.exitCode=1;});
