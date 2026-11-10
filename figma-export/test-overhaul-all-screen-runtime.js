#!/usr/bin/env node
// Execute every real screen callback with only the declared components loaded.
// This catches JS/dependency crashes, not real library variants or Figma layout.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
let next = 0;
class Node {
  constructor(type = 'FRAME', name = '') {
    Object.assign(this, { id: 'test-' + ++next, type, name, children: [], width: 1440, height: 1024, x: 0, y: 0, visible: true, componentProperties: {} });
  }
  appendChild(n) { if (this.type === 'INSTANCE') throw new Error('Cannot add a child to an instance'); if (n.parent) n.parent.children = n.parent.children.filter(c => c !== n); this.children.push(n); n.parent = this; }
  insertChild(i, n) { this.appendChild(n); this.children.splice(this.children.indexOf(n), 1); this.children.splice(i, 0, n); }
  findAll(fn) { const out = []; const walk = n => { for (const c of n.children) { if (fn(c)) out.push(c); walk(c); } }; walk(this); return out; }
  findOne(fn) { return this.findAll(fn)[0] || null; }
  resize(w, h) { if (!(w > 0 && h > 0)) throw new Error('Invalid dimensions'); this.width = w; this.height = h; }
  resizeWithoutConstraints(w, h) { this.resize(w, h); }
  set layoutPositioning(value) {
    if (value === 'ABSOLUTE' && (!this.parent || !this.parent.layoutMode || this.parent.layoutMode === 'NONE')) {
      throw new Error('in set_layoutPositioning: Can only set layoutPositioning = ABSOLUTE if the parent node has layoutMode !== NONE');
    }
    this._layoutPositioning = value;
  }
  get layoutPositioning() { return this._layoutPositioning; }
  set constraints(value) {
    for (let p = this.parent; p; p = p.parent) {
      if (p.type === 'INSTANCE') throw new Error('in set_constraints: This property cannot be overridden in an instance: vertical-constraint');
    }
    this._constraints = value;
  }
  get constraints() { return this._constraints; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); }
  get absoluteBoundingBox() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
  setProperties(props) { for (const [k, value] of Object.entries(props)) this.componentProperties[k].value = value; }
}
const page = new Node('PAGE', 'runtime-test');
const figma = {
  showUI() {}, ui: { postMessage() {} }, currentPage: page,
  createFrame() { const n = new Node(); page.appendChild(n); return n; },
  createText() { const n = new Node('TEXT'); n.characters = ''; page.appendChild(n); return n; },
  createEllipse() { const n = new Node('ELLIPSE'); page.appendChild(n); return n; },
  async loadFontAsync() {}, async listAvailableFontsAsync() { return []; },
  variables: { async getLocalVariableCollectionsAsync() { return []; } },
};
const context = vm.createContext({ figma, __html__: '', console });
const run = s => vm.runInContext(s, context);
context.makeComponent = name => ({ type: 'COMPONENT', name, id: name, createInstance() {
  const n = new Node('INSTANCE', name);
  if (['Modal', 'Modal Signature'].includes(name)) {
    const shade = new Node('INSTANCE', 'Background overlay');
    shade.parent = n; n.children.push(shade);
  }
  page.appendChild(n); return n;
} });
run(fs.readFileSync(path.join(__dirname, 'overhaul2-plugin/code.js'), 'utf8'));
run(`for (const name of NEEDED) INDEX.set(name, makeComponent(name));`);
// Reported Figma failure: Tertiary button has Default/md, not Default/lg.
// Keep the real main()/btn() resolver so invalid variants abort the callback.
context.tertiaryDefault = context.makeComponent('Tertiary button');
run(`INDEX.set('Tertiary button', {type:'COMPONENT_SET',name:'Tertiary button',children:[
  Object.assign(tertiaryDefault,{variantProperties:{State:'Default',Size:'md'}})
]});`);
// A real five-slot budget list, including supported nested row properties.
const list = context.makeComponent('List with checkbox');
list.createInstance = () => {
  const n = new Node('INSTANCE', 'List with checkbox');
  const header = new Node('INSTANCE', 'List header item'); header.parent = n; n.children.push(header);
  const scrollbar = new Node('INSTANCE', 'Vertical scrollbar'); scrollbar.parent = n; n.children.push(scrollbar);
  for (let i = 0; i < 5; i++) {
    const r = new Node('INSTANCE', 'List with checkbox item'); r.parent = n;
    for (const k of ['State', 'Text', 'Avatar', 'Supporting', 'Supporting 2']) r.componentProperties[k] = { type: 'TEXT', value: '' };
    n.children.push(r);
  }
  page.appendChild(n); return n;
};
context.listComponent = list;
run(`INDEX.set('List with checkbox', listComponent);`);
(async () => {
  const failed = [];
  const expectedMissing = [];
  const inventory = run(`SCENARIOS.map((s,si)=>s[1].map((state,i)=>({si,i,code:stateCode(GROUPS[si].subs[0],i),label:state[0]}))).flat()`);
  // Both supported resolver outcomes: local Maintain-D composites present or absent.
  for (const localAvailable of [true, false]) {
    if (!localAvailable) run('for (const name of LOCAL_OPTIONAL) INDEX.delete(name)');
    for (const info of inventory) {
      try {
        const screen = await run(`SCENARIOS[${info.si}][1][${info.i}][1]()`);
        assert.equal(screen.type, 'FRAME');
        context.builtScreen = screen;
        run('fitOverlays(builtScreen)');
        if (info.code === 'A.5') {
          assert.equal(screen.findAll(n => n.name.startsWith('Executive chart · ')).length, 4);
          assert.ok(screen.findAll(n => n.type === 'ELLIPSE').length > 4);
          assert.equal(screen.findAll(n => n.name === 'Metric item').length, 0);
        }
        for (const modal of screen.children.filter(n => ['Modal', 'Modal Signature'].includes(n.name))) {
          for (const shade of modal.findAll(n => n.name === 'Background overlay')) {
            assert.equal(shade.width, screen.width);
            assert.equal(shade.height, Math.max(screen.height, 1024));
          }
        }
      } catch (error) {
        if (!localAvailable && /^I\.[1-5]$/.test(info.code) && /ต้องใช้ ReceiptChecklist และ HandoverSignature/.test(error.message)) {
          expectedMissing.push(info.code);
        } else failed.push({ code: info.code, label: info.label, localAvailable, error: error.message });
      }
      for (const n of page.children.slice()) n.remove();
    }
  }
  // A local Header with an incompatible variant must not abort later blocks.
  run("HEADER_BROKEN=false; INDEX.set('Header',{type:'COMPONENT_SET',name:'Header',children:[]})");
  try {
    const bar = await run("flowBar('OH2','A','test','Default',1440)");
    assert.equal(bar.type, 'FRAME');
  } catch (error) { failed.push({code:'flow header',label:'incompatible Header variant',error:error.message}); }
  for (const f of failed) console.error(`${f.code}: ${f.label} -> ${f.error}`);
  assert.equal(failed.length, 0, `${failed.length}/${inventory.length} real screen callbacks crashed`);
  assert.equal(expectedMissing.length, 5, 'missing receipt components must explicitly block the five I screens');
  console.log(`PASS: ${inventory.length}/${inventory.length} desktop callbacks with components present; absent receipt components explicitly block I.1–I.5 (not library/layout validation)`);
})().catch(error => { console.error(error); process.exitCode = 1; });
