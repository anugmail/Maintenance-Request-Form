#!/usr/bin/env node
// Exercise real tableHeader/fillIcons against absent chip slots and hidden icons.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({ __html__: '', figma: { showUI() {}, ui: { postMessage() {} } } });
const run = s => vm.runInContext(s, context);
run(fs.readFileSync(path.join(__dirname, 'overhaul2-plugin/code.js'), 'utf8'));
run(`
 function node(name,children=[]) {return {name,type:'INSTANCE',visible:false,children,props:{},
 findAll(fn){const out=[];const walk=n=>{for(const c of n.children){if(fn(c))out.push(c);walk(c);}};walk(this);return out;}};}
 function inst(name,variant,props) {
   const n=node(name);n.visible=true;Object.assign(n.props,variant,props);
   if(name==='Table header') n.children=[node('Text input'),node('Actions',[node('Secondary button'),node('Primary button')])];
   return n;
 }
 function setProps(n,p){Object.assign(n.props,p);}
 for (const name of ['filter_list-24-400-round','add-24-300-round','more_horiz-20-400-round']) INDEX.set(name,{type:'COMPONENT',id:name});
 function row(name,children){const n=node(name,children);n.visible=true;return n;}
 function col(name,children){return row(name,children);}
`);
(async () => {
  const header = await run("tableHeader({query:'HINO',chips:['HINO'],primary:'สร้างแผน Overhaul'})");
  assert.equal(header.name, 'Search and filters');
  assert.equal(header.children[1].children.length, 1, 'deduplicate query chip');
  assert.equal(header.children[1].children[0].props.Text, 'HINO');
  assert.equal(header.children[1].children[0].name, 'Badge outline with remove icon');
  assert.equal(header.children[0].props.Actions, true);
  // R100 (11 พ.ย. 2569): ปีงบประมาณ = สลับช่อง Secondary button ช่องแรกใน Actions ของ Table header (ไม่ห่อ Table header ใหม่)
  run(`globalThis.warn=()=>{}; INDEX.set('Input dropdown',{type:'COMPONENT',name:'Input dropdown'});
    globalThis.yearTh=null; const _inst=inst; inst=function(name,v,p){const n=_inst(name,v,p);
      if(name==='Table header'){n.children=[node('Text input'),node('Actions',[node('Secondary button'),node('Secondary button'),node('Primary button')])];
        for(const b of n.findAll(x=>x.name==='Secondary button')) b.swapComponent=function(c){this.swapped=c.name;this.children=[node('Input label')];};}
      return n;}`);
  const yh = await run("tableHeader({placeholder:'x',year:'',primary:'สร้างแผน Overhaul'})");
  assert.equal(yh.name, 'Table header', 'Table header must not be wrapped');
  const acts = yh.children[1].children;
  assert.equal(acts[0].swapped, 'Input dropdown');
  assert.equal(acts[0].props.Text, 'ปีงบประมาณ: ทั้งหมด');
  assert.equal(acts[0].children[0].visible, false, 'label hidden');
  assert.equal(acts[1].props.Text, 'ตัวกรอง');
  assert.equal(acts[2].props.Text, 'สร้างแผน Overhaul');
  const plain = await run("tableHeader({placeholder:'x'})");
  assert.equal(plain.children[1].children[0].swapped, undefined, 'no year option = no swap');
  run("globalThis.cell=node('Table cell',[node('Tertiary button')]); fillIcons(cell,['more_horiz-20-400-round'])");
  const cell = run('cell');
  assert.equal(cell.props.View, true);
  assert.equal(cell.children[0].visible, true);
  assert.equal(cell.children[0].props['Leading icon'], true);
  assert.equal(cell.children[0].props['Button text'], false);
  console.log('PASS: search chips survive missing header slots; fiscal-year dropdown swapped into Table header slot left of filter; row menu icon explicitly visible');
})().catch(error => { console.error(error); process.exitCode = 1; });
