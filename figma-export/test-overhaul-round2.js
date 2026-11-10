#!/usr/bin/env node
// Validate strict Figma variant types plus round-two screen composition.
// No layout/image fidelity claims: those require the live source components.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const context = vm.createContext({ __html__: '', figma: { showUI() {}, ui: { postMessage() {} } } });
const run = s => vm.runInContext(s, context);
run(fs.readFileSync(path.join(__dirname, 'overhaul2-plugin/code.js'), 'utf8'));
run(`
  function mockNode(name, children=[]) {
    return {name,children,props:{},width:400,height:100,
      appendChild(n){this.children.push(n);}, resize(w,h){this.width=w;this.height=h;},
      findAll(fn){const out=[];function walk(n){for(const c of n.children||[]){if(fn(c))out.push(c);walk(c);}}walk(this);return out;}};
  }
  function inst(name) {
    if(name==='Tabs') return mockNode('Tabs', Array.from({length:5},()=>{
      const n=mockNode('Tab item'); n.type='INSTANCE';
      n.componentProperties={State:{type:'VARIANT',value:'Default'},Active:{type:'VARIANT',value:'False'}};
      n.setProperties=p=>{if(typeof p.Active!=='string')throw new Error('Active requires variant string');Object.assign(n.props,p);};
      return n;
    }));
    return mockNode(name);
  }
  async function text(n,layer,value){n[layer]=value;}
`);
const walk = (node, out = []) => {
  out.push(node);
  for (const c of node.children || []) walk(c, out);
  if (node.page) walk(node.page, out);
  return out;
};
(async () => {
  const tabs = await run('tabs(OH_TABS,1)');
  assert.equal(tabs.children[0].props.Active, 'False');
  assert.equal(tabs.children[1].props.Active, 'True');
  assert.equal(tabs.children[2].visible, false);
  assert.equal(run('errors.length'), 0, 'strict variant writes must not warn');
  assert.equal(run('currency(1234567.5)'), '1,234,567.50');
  assert.equal(run('dashboardMoney(0)'), '0.00');
  assert.equal(run('currency(null)'), '—');
  assert.equal(run('dashboardVehicles()[0].age'), 12);
  assert.ok(run("executiveCarRow(dashboardVehicles()[0])[1].sub.includes('อายุการใช้งาน 12 ปี')"));
  assert.ok(run("executiveCarRow({model:'A',type:'B',age:0})[1].sub.includes('0 ปี')"));
  assert.ok(run("executiveCarRow({model:'A',type:'B'})[1].sub.includes('—')"));
  assert.equal(run('executiveCarRow(dashboardVehicles()[0])[2]'), '2,700,000.00');
  assert.equal(run('executiveCarRow(dashboardVehicles()[0]).length'), 8);
  assert.equal(run('VEH_PICK_COLS_PLAN[4][0]'), 'ราคากลาง (บาท)');
  assert.equal(run('VEH_PICK_COLS_PLAN[7][0]'), 'ราคาประเมิน Overhaul');
  assert.equal(run('vehPickRow(PLAN_VEHICLES[0],[])[4]'), '1,950,000.00');
  assert.equal(run('VEH_PICK_MENU[1][0]'), 'แก้ไข');
  assert.ok(run('PLAN_COLS_D.reduce((sum,c)=>sum+c[1],0) <= CONTENT_W()-240'), 'reserve plan-name width so action column remains inside frame');
  assert.equal(run("dashboardChartRows(dashboardSummary(dashboardVehicles(),{model:'HINO FM2P'}).rows)[0].replacement"), 2700000);
  assert.equal(run("dashboardChartRows([{model:'A',replacementEstimate:100,overhaulEstimate:20},{model:'A',replacementEstimate:200,overhaulEstimate:30}])[0].overhaul"), 50);
  assert.equal(run("dashboardChartRows([{model:'A',replacementEstimate:null,overhaulEstimate:20}]).length"), 0);
  assert.equal(run("executiveVisualData(dashboardSummary(dashboardVehicles(),{model:'HINO FM2P'}),dashboardVehicles()).types.reduce((n,t)=>n+t.value,0)"), 1);
  assert.equal(run("executiveVisualData(dashboardSummary(dashboardVehicles(),{model:'HINO FM2P'}),dashboardVehicles()).brands.reduce((n,b)=>n+b.value,0)"), 1);
  run(`
    async function shell(name,options){return {name,options,scr:{name,page:mockNode('Page')},page:null};}
    shell=async(name,options)=>{const page=mockNode('Page');return {scr:{name,page,options},page};};
    function frame(name){return mockNode(name);}
    function col(name,children){return mockNode(name,children);}
    function row(name,children){return mockNode(name,children);}
    function add(parent,node){parent.children.push(node);return node;}
    async function section(title){return {name:'Section header',title};}
    async function sectionLabel(title){return {name:'Section label',title};}
    function field(label,value){return {name:'Text input',label,value};}
    function dropdown(label,value){return {name:'Input dropdown',label,value};}
    function btn(kind,label,options){return {name:kind,label,options};}
    async function upload(label,files){return {name:'File upload',label,files};}
    async function tableHeader(options){return {name:'Table header',options};}
    async function tbl(columns,rows){return {name:'Table',columns,rows};}
    function metricRow(items){return {name:'Metrics',children:items};}
    async function metric(label,value,color){return {name:'Metric item',label,value,color};}
    async function dashboardComparisonChart(cars){return {name:'Chart tested by real runtime callbacks',cars};}
    async function executiveGraphs(data,all){return {name:'Executive visual dashboard',data,all};}
  `);
  const dashboard = await run("overhaulCarsTab('test',{filters:{model:'HINO FM2P'}})");
  const nodes = walk(dashboard);
  assert.equal(nodes.find(n => n.name === 'Tabs').children[1].props.Active, 'True');
  assert.equal(nodes.filter(n => n.name === 'Metric item').length, 0);
  assert.equal(nodes.filter(n => n.name === 'Executive visual dashboard').length, 1);
  assert.equal(nodes.find(n => n.name === 'Table').rows.length, 1);
  assert.equal(nodes.find(n => n.name === 'Table').columns.length, 8);
  assert.equal(nodes.find(n => n.name === 'Table').rows[0][5].progress, 100);

  const po = await run("poForm('test',{planCars:[{id:'c4',estPrice:2550000,estOverhaul:310000}],sel:[3]})");
  const table = walk(po).find(n => n.name === 'Table');
  assert.equal(table.rows.length, 1, 'PO must only show cars reserved by its plan');
  assert.equal(table.rows[0][0].text, '82-0457 สระบุรี');
  assert.equal(table.rows[0][0].check, true);
  assert.equal(table.rows[0][6].text, '2,550,000.00 บาท');
  assert.equal(table.rows[0][6].sub, '310,000.00 บาท');

  const actions = run('appointmentActions()');
  assert.equal(actions.primaryAxisAlignItems, 'SPACE_BETWEEN');
  assert.equal(actions.children[0].label, 'ย้อนกลับ');
  assert.equal(actions.children[1].children[0].label, 'ข้ามขั้นตอน');
  assert.equal(actions.children[1].children[0].name, 'Tertiary button');
  assert.equal(actions.children[1].children[1].label, 'ยืนยันนัดหมาย');

  const logs = await run('logs(LOGS)');
  const logTable = walk(logs[0]).find(n => n.name === 'Table');
  assert.ok(logTable.columns.some(c => c[0] === 'ความคืบหน้า'));
  assert.equal(logTable.rows[0][2].progress, 40);
  assert.equal(logTable.rows[1][2].progress, 100);
  assert.equal(run("purchaseOrderCopy('แก้ไข PO / PO-690101')"), 'แก้ไข Purchase Order / PO-690101');
  run(`
    function approvalPartsBox(parts){return {name:'Parts box',parts};}
    function vehCard(){return {name:'Existing vehicle card pending source'};}
    function kv(pairs){return {name:'Content item',pairs};}
  `);
  const approval = await run('closeApproval(PARTS,LOGS)');
  const approvalNodes = approval.flatMap(n => walk(n));
  const groups = approvalNodes.filter(n => n.name === 'Parts box');
  assert.equal(groups.length, 2);
  assert.ok(groups[0].parts.every(p => p[3] === 'vehicle'));
  assert.ok(groups[1].parts.every(p => p[3] === 'machine'));
  const approvalLog = approvalNodes.find(n => n.name === 'Table');
  assert.ok(approvalLog.columns.some(c => c[0] === 'ความคืบหน้า'));
  assert.equal(approvalLog.rows[1][2].progress, 100);
  assert.ok(!approvalNodes.some(n => n.name === 'Alert'));
  const cost = await run("joCostSection('0',false)");
  assert.equal(cost.children[0].title, 'ค่าใช้จ่ายในการดำเนินการ Overhaul');
  console.log('PASS: real tab variant type, filtered dashboard composition, plan-only PO table/prices, grouped appointment actions, progress column and cost label');
})().catch(error => { console.error(error); process.exitCode = 1; });
