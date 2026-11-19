#!/usr/bin/env node
// Test rendered Figma text, including a cell whose component property is stale.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const loaded=new Set(),logs=[];
let next=0;
function node(name,type='FRAME',children=[]){
 const n={id:'node-'+ ++next,name,type,visible:true,children,
  findAll(fn){const result=[];function walk(root){for(const c of root.children){if(fn(c))result.push(c);walk(c);}}walk(this);return result;}};
 for(const c of children)c.parent=n;
 return n;
}
function text(value){
 const n=node('Text','TEXT');n.fontName={family:'Test font',style:'Regular'};
 let current=value;
 Object.defineProperty(n,'characters',{get(){return current;},set(v){assert.ok(loaded.has('Test font|Regular'),'load font before changing rendered text');current=v;}});
 return n;
}
function column(header,values){return node('Column','FRAME',[node('Table header cell','INSTANCE',[text(header)]),...values.map(v=>node('Table cell','INSTANCE',[text(v)]))]);}
const price=column('ราคากลาง',['1,950,000','1,234.50','—']);
price.children[1].componentProperties={'Text#1':{type:'TEXT',value:'1,950,000'}};
const overhaul=column('ประเมิน Overhaul (บาท)',['0']);
const count=column('จำนวนรถ',['12']);
const age=column('อายุการใช้งาน',['12 ปี']);
const hidden=column('ราคากลาง',['999']);hidden.visible=false;
const chart=text('1,950,000 บาท');
const root=node('OH2 / A.5 · รถที่ Overhaul','FRAME',[price,overhaul,count,age,hidden,chart]);
const outside=column('ราคากลาง',['500']);
const context=vm.createContext({__html__:'',figma:{showUI(){},mixed:Symbol('mixed'),currentPage:{selection:[root]},ui:{postMessage:m=>logs.push(m)},async loadFontAsync(f){loaded.add(f.family+'|'+f.style);}}});
const run=code=>vm.runInContext(code,context);
const ui=fs.readFileSync(path.join(__dirname,'overhaul2-plugin/ui.html'),'utf8');
const elements=new Map([...ui.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,{textContent:'',innerHTML:'',checked:false}]));
const posted=[];
const uiContext=vm.createContext({document:{getElementById:id=>elements.get(id)||null,querySelector:()=>({value:'desktop'})},parent:{postMessage:m=>posted.push(m.pluginMessage)}});
vm.runInContext(ui.match(/<script>([\s\S]*?)<\/script>/)[1],uiContext);
vm.runInContext("document.getElementById('format-baht').onclick()",uiContext);
assert.equal(posted[0].type,'format-selected-baht');

run(fs.readFileSync(path.join(__dirname,'overhaul2-plugin/code.js'),'utf8'));
context.selectedScreen=root;
(async()=>{
 await context.figma.ui.onmessage(posted[0]);
 assert.equal(price.children[1].children[0].characters,'1,950,000.00','repair actual reference-price text, not only the formatted data array');
 assert.equal(overhaul.children[1].children[0].characters,'0.00');
 assert.equal(price.children[2].children[0].characters,'1,234.50');
 assert.equal(price.children[3].children[0].characters,'—');
 assert.equal(count.children[1].children[0].characters,'12');
 assert.equal(age.children[1].children[0].characters,'12 ปี');
 assert.equal(hidden.children[1].children[0].characters,'999');
 assert.equal(chart.characters,'1,950,000.00 บาท');
 assert.equal(outside.children[1].children[0].characters,'500','do not touch other screens');
 const second=await run('formatRenderedBaht(selectedScreen)');
 assert.equal(second.changed,0,'formatting is idempotent');
 const fresh=column('ราคากลาง',['1234']);context.fresh=node('A.5 new','FRAME',[fresh]);
 run('function stripDividers(){} async function polish(){} function fitOverlays(){}');
 await run('makeAt(async()=>fresh,false,0,0)');
 assert.equal(fresh.children[1].children[0].characters,'1,234.00','new frames must normalize rendered cells after polish');
 // 11 พ.ย. 2569: export ทั้งชุด (buildGrid) ต้องจัดเงินบาทเหมือนอัปเดตจอที่เลือก (เดิมจัดเฉพาะ makeAt ⇒ "figma export ผิดตลอด")
{ const src = require('node:fs').readFileSync(require('node:path').join(__dirname, 'overhaul2-plugin/code.js'), 'utf8');
  const grid = src.slice(src.indexOf('async function buildGrid'), src.indexOf('async function buildGrid') + 6000);
  require('node:assert/strict').ok(/await polish\(s\); await formatRenderedBaht\(s\)/.test(grid), 'buildGrid must format baht on every exported screen'); }
console.log('PASS: repair selected reference-price text, zero, font loading, hidden/unrelated safety, repeat and new-frame path');
})().catch(e=>{console.error(e);process.exitCode=1});
