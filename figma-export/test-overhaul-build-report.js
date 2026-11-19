#!/usr/bin/env node
// Real buildGrid must account for each requested screen, including exceptions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const messages = [];
const context = vm.createContext({ __html__: '', figma: { showUI() {}, ui: { postMessage(m) { messages.push(m.text); } } } });
const run = code => vm.runInContext(code, context);
run(fs.readFileSync(path.join(__dirname, 'overhaul2-plugin/code.js'), 'utf8'));
run(`
  function node(name){return {name,type:'FRAME',height:1024,children:[]};}
  async function flowBar(){return node('bar');}
  async function deviceLabel(){return node('device');}
  function stripDividers(){}
  async function polish(){}
  function fitOverlays(){}
  globalThis.page={children:[],insertChild(i,n){this.children.splice(i,0,n);n.parent=this;}};
  globalThis.groups=[{code:'A',title:'test',subs:[{code:'A',title:'test',tag:'S1',screens:[
    ['good',async()=>node('good')],
    ['throws',async()=>{throw new Error('Missing component X');}],
    ['incomplete',async()=>{warn('table','missing header');return node('partial');}]
  ]}]}];
`);
(async () => {
  const result = await run("buildGrid(page,'OH2',groups,0,3,{devices:[false]})");
  assert.equal(result.made.length, 2);
  assert.equal(result.failed.length, 1);
  assert.equal(result.failed[0].code, 'A.2');
  assert.equal(result.failed[0].error, 'Missing component X');
  assert.equal(result.incomplete.length, 1);
  assert.equal(result.incomplete[0].code, 'A.3');
  assert.equal(result.expected, 3);
  assert.ok(!messages.some(s => /^✓ A /.test(s)), 'a partial block must never report complete');
  assert.ok(messages.some(s => s && s.includes('A.2') && s.includes('Missing component X')));
  const ui = fs.readFileSync(path.join(__dirname, 'overhaul2-plugin/ui.html'), 'utf8');
  // Model browser lookup: missing markup must return null, never invent elements.
  const elements = new Map([...ui.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => [id, {textContent:'',innerHTML:''}]));
  const uiContext = vm.createContext({ document: { getElementById(id) { return elements.get(id) || null; } } });
  vm.runInContext(ui.match(/<script>([\s\S]*?)<\/script>/)[1], uiContext);
  uiContext.event = {data:{pluginMessage:{type:'scenarios',items:['one','two'],counts:[1,2],totalScreens:3}}};
  vm.runInContext('onmessage(event)', uiContext);
  assert.ok(elements.get('inventory').textContent.includes('3 จอต่ออุปกรณ์'));
  assert.equal((elements.get('pick').innerHTML.match(/type="checkbox"/g) || []).length, 2, 'scenario message must render every option');
  assert.ok(elements.get('pick').innerHTML.includes('value="0"'));
  assert.ok(elements.get('pick').innerHTML.includes('value="1"'));
  uiContext.event = {data:{pluginMessage:{type:'build-report',report:{page:'test',created:2,expected:3,failed:result.failed,incomplete:result.incomplete}}}};
  vm.runInContext('onmessage(event)', uiContext);
  assert.ok(elements.get('build-report').textContent.includes('สร้าง 2/3'));
  assert.ok(elements.get('build-report').textContent.includes('A.2'));
  assert.ok(elements.get('build-report').textContent.includes('missing header'));
  console.log('PASS: failed and incomplete frames accounted for; partial block cannot show success');
})().catch(error => { console.error(error); process.exitCode = 1; });
