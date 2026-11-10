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
  run("globalThis.cell=node('Table cell',[node('Tertiary button')]); fillIcons(cell,['more_horiz-20-400-round'])");
  const cell = run('cell');
  assert.equal(cell.props.View, true);
  assert.equal(cell.children[0].visible, true);
  assert.equal(cell.children[0].props['Leading icon'], true);
  assert.equal(cell.children[0].props['Button text'], false);
  console.log('PASS: search chips survive missing header slots; row menu icon explicitly visible');
})().catch(error => { console.error(error); process.exitCode = 1; });
