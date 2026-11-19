#!/usr/bin/env node
// Behavior checks independent of the unavailable published-library dump.
// These do not simulate Figma auto-layout or prove visual fidelity.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const context = vm.createContext({ console, __html__: '', figma: { showUI() {}, ui: { postMessage() {} } } });
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, 'overhaul2-plugin/code.js'), 'utf8'), context);
const run = code => vm.runInContext(code, context);
const plain = value => JSON.parse(JSON.stringify(value));

(async () => {
  const dashboard = plain(run('dashboardSummary(dashboardVehicles())'));
  const model = plain(run("dashboardSummary(dashboardVehicles(), {model:'HINO FM2P'})"));
  assert.equal(dashboard.count, 8);
  assert.equal(model.count, 1);
  assert.equal(model.reference, 1950000);
  assert.equal(model.overhaul, 250000);
  assert.ok(!('saving' in model));
  assert.equal(model.progress, 100);
  assert.deepEqual(model.topBrand, {name:'HINO', count:1}, 'brand ranking must reflect table filters');
  const empty = plain(run("dashboardSummary(dashboardVehicles(), {model:'missing'})"));
  assert.equal(empty.count, 0);
  assert.equal(empty.reference, null);
  assert.equal(empty.progress, null);
  assert.equal(empty.topBrand, null);

  assert.equal(run("dashboardSummary([{brand:'A',referencePrice:100,overhaulEstimate:150,progress:0}]).progress"), 0);
  const partial = plain(run("dashboardSummary([{brand:'A',referencePrice:100,overhaulEstimate:30}, {brand:'B',referencePrice:999,overhaulEstimate:null}])"));
  assert.equal(partial.pricedCount, 1);
  assert.equal(partial.reference, 100, 'compare the same priced cohort, not mismatched sums');
  assert.equal(partial.overhaul, 30);
  assert.equal(run("logProgressCell(['','','','23']).progress"), 23);
  assert.equal(run("logProgressCell(['','','',''])"), '—');
  // Unequal PO sizes must be weighted by individual cars, not PO averages.
  assert.equal(run("planAvgPct({pos:[{cars:[{progress:100}]},{cars:[{progress:0},{progress:0},{progress:0}]}]})"), 25);
  assert.equal(run("planAvgPct({pos:[{cars:[{progress:23},{progress:23}]}]})"), 23);
  assert.equal(run('averageCarProgress([{progress:0}])'), 0);
  for (const input of ['[]', '[{}]', '[{progress:101}]', '[{progress:-1}]', '[{progress:NaN}]']) {
    assert.equal(run(`averageCarProgress(${input})`), null);
  }
  assert.equal(run("planAvgPct({pos:[{}]})"), null);
  assert.equal(run("planProgressBar({0:'unknown',7:3,8:2})"), '-');
  assert.equal(run("planRowD(Object.assign(['plan','name','unit','budget','code','2569','100.00',3,2,0,'P2','10/11/2569'], {pos:[{cars:[{progress:23},{progress:23}]}]}))[5].progress"), 23);
  assert.equal(run("planRowD8(Object.assign(['plan','name','unit','budget','code','2569','100.00',3,2,0,'P2','10/11/2569'], {pos:[{cars:[{progress:23},{progress:23}]}]}))[4].progress"), 23);
  assert.equal(run("poRow(Object.assign(['PO-X','name','vendor',3,2,'01/01/2570','31/12/2570'],{cars:[{progress:23},{progress:23},{progress:23}]}))[4].progress"), 23);
  assert.deepEqual(plain(run('PO_COLS.slice(5,7).map(c=>c[0])')), ['วันเริ่มสัญญา', 'วันสิ้นสุดสัญญา']);
  assert.equal(run('SCENARIOS[0][1].length'), 8);
  assert.equal(run('SCENARIOS[1][1].length'), 24);   // R92 +B.14–B.19
  assert.equal(run('FILLED.cars[0].estPrice'), 2700000);

  run(`
    function setProps(node, props) { Object.assign(node.props || (node.props = {}), props); }
    function syncLabel(node, label, optional) { node.label = label; node.optional = optional; return node; }
    function main(name) { return {id:name}; }
    function text(node, layer, value) { node[layer] = value; }
    function inst(name) {
      if (name === 'Modal') {
        const form = {name:'Form', children:Array.from({length:3}, () => ({name:'Card form row',children:[{type:'INSTANCE'},{type:'INSTANCE'}]}))};
        const modal = {name, width:1440, height:1024, children:[form], findAll(fn){return this.children.filter(fn);}, resize(w,h){this.width=w;this.height=h;}};
        globalThis.lastModal = modal; return modal;
      }
      return {name, width:400, height:80, children:[], findAll(fn){return this.children.filter(fn);}, resize(w,h){this.width=w;this.height=h;}};
    }
    function mockScreen(height=1800) { return {width:1440,height,children:[],appendChild(n){this.children.push(n);}}; }
  `);
  await run(`formModal(mockScreen(), {title:'ติดตามผล',fields:LOG_FIELDS(null)})`);
  const fields = run('lastModal.children[0].children.flatMap(r=>r.children.filter(c=>c.visible).map(c=>c.label))');
  assert.deepEqual(plain(fields).sort(), ['รายละเอียด', 'หมายเหตุ', 'ความคืบหน้า (%)'].sort());   // R101: ไม่มีช่องวันที่ — ระบบลงให้
  assert.equal(run('lastModal.height'), 1800);

  await run(`globalThis.scr = mockScreen(2300); toast(scr,{title:'สำเร็จ'})`);
  assert.equal(run('scr.children[0].y'), 0);
  assert.equal(run('scr.children[0].x'), 1040);
  run(`globalThis.shade=inst('Background overlay'); overlay(scr,shade,0,0); scr.height=3100; fitOverlays(scr)`);
  assert.equal(run('shade.height'), 3100);
  assert.equal(run('shade.width'), 1440);

  // The number remains exact even though the library bar variant is quantized.
  run(`globalThis.pb={}; fillTextCell({findAll(){return [pb];}}, {progress:23})`);
  assert.equal(run("CELL_TEXT[CELL_TEXT.length-1][2]"), '23%');
  assert.equal(run('pb.props.Progress'), '20%');

  run(`
    function col(name,children){return {name,children};}
    function section(title){return {title};}
    function tbl(cols,rows){return {cols,rows};}
    function add(parent,node){parent.children.push(node);return node;}
    function row(name,buttons){return {buttons};}
    function btn(kind,label,options){return {kind,label,options};}
  `);
  for (const [logs, enabled] of [
    [[], false],
    [[['date','work','note','99']], false],
    [[['date','work','note','100']], true],
    [[['old','work','note','100'],['new','work','note','40']], false],
  ]) {
    context.sampleLogs = logs;
    const result = await run('logs(sampleLogs)');
    assert.equal(result[1].buttons[1].options.disabled, !enabled);
  }
  run(`
    function frame(name) {
      return {name,children:[],width:480,height:100,
        appendChild(n){this.children.push(n);},
        resize(w,h){this.width=w;this.height=h;},
        findAll(fn){const result=[];function walk(n){for(const c of n.children || []){if(fn(c))result.push(c);walk(c);}}walk(this);return result;}};
    }
    function col(name,children){const f=frame(name);children.forEach(c=>f.appendChild(c));return f;}
    function inst(name,variant,props) {
      const n=frame(name);n.type='INSTANCE';n.props=Object.assign({},variant,props);
      if(name==='List with checkbox'){for(let i=0;i<5;i++){const r=frame('List with checkbox item');r.appendChild(frame('Checkbox'));n.appendChild(r);}}
      if(name.startsWith('Checkbox with')){n.appendChild(frame('Checkbox'));if(name==='Checkbox with badge')n.appendChild(frame('Pill outline'));}
      return n;
    }
    function dropdown(label,value){const n=frame('Input dropdown');n.label=label;n.value=value;return n;}
    function comboAt(){throw new Error('budget dropdown must not be opened');}
    globalThis.filterScreen=mockScreen(2500);
  `);
  await run('filterPanelCF(filterScreen)');
  assert.equal(run("filterScreen.children.find(n=>n.name==='Panel').height"), 2500);
  const filter = run("filterScreen.children.find(n=>n.name==='Panel').children.find(n=>n.name==='Content')");
  assert.equal(filter.children.length, 3);
  assert.equal(filter.children[0].label, 'ปีงบประมาณ');
  assert.equal(filter.children[0].value, 'ทั้งหมด');
  assert.ok(!filter.children[1].children.some(n => n.name === 'List with checkbox'));
  const budgetChecks = filter.children[1].children.filter(n => n.name === 'Checkbox with description');
  assert.equal(budgetChecks.length, 6);
  assert.equal(budgetChecks[1].props.Text, 'มากกว่า 1,000,000.00 - 5,000,000.00');
  assert.ok(budgetChecks.every(n => n.props.Supporting === false));
  assert.ok(budgetChecks.every(n => n.children.find(c => c.name === 'Checkbox').props.Type === 'Unselected'));
  const statusChecks = filter.children[2].children.filter(n => n.name === 'Checkbox with badge');
  assert.deepEqual(plain(statusChecks.map(n=>n.children.find(c=>c.name==='Pill outline').props.Text)), ['รอเลข Purchase Order','กำลังดำเนินการ Purchase Order','เสร็จสิ้น']);
  assert.ok(statusChecks.every(n=>n.children.find(c=>c.name==='Checkbox').props.Type==='Unselected'));
  console.log('PASS: weighted progress, exact percentages, PO dates, scenario states, three-field progress modal (no manual date), full-height overlays, top-right toast, completion gate');
})().catch(error => { console.error(error); process.exitCode = 1; });
