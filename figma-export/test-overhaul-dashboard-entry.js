#!/usr/bin/env node
// Exercise the real UI click -> plugin dispatch -> A.5–A.8 build selection.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const folder=path.join(__dirname,'overhaul2-plugin');
const ui=fs.readFileSync(path.join(folder,'ui.html'),'utf8');
const elements=new Map([...ui.matchAll(/\bid="([^"]+)"/g)].map(([,id])=>[id,{textContent:'',innerHTML:'',checked:false}]));
assert.ok(elements.has('dashboard'),'Dashboard must have a visible direct-entry button');
const posted=[];
const u=vm.createContext({document:{getElementById:id=>elements.get(id)||null,querySelector:()=>({value:'desktop'})},parent:{postMessage:m=>posted.push(m.pluginMessage)}});
vm.runInContext(ui.match(/<script>([\s\S]*?)<\/script>/)[1],u);
vm.runInContext("document.getElementById('dashboard').onclick()",u);
assert.equal(posted[0].type,'build-overhaul-dashboard');
const messages=[];
const c=vm.createContext({__html__:'',figma:{showUI(){},ui:{postMessage:m=>messages.push(m)}}});
const run=code=>vm.runInContext(code,c);
run(fs.readFileSync(path.join(folder,'code.js'),'utf8'));
run('async function buildSet(base,scenarios,groups,what,options){globalThis.dispatched={base,scenarios,groups,options};}');
(async()=>{
 for(const devices of ['desktop','mobile','both']){
  await c.figma.ui.onmessage({...posted[0],devices,here:false});
  const d=c.dispatched;
  assert.ok(d,'Dashboard command must reach the shared builder');
  assert.equal(d.base,'overhaul-dashboard');
  assert.equal(d.scenarios[0][1].length,4);
  assert.equal(d.groups[0].code,'A');
  assert.deepEqual(Array.from(d.groups[0].subs[0].screens,s=>s[2]),['5','6','7','8']);
  assert.ok(run('dispatched.scenarios[0][1].every((s,i)=>s[1]===SCENARIOS[0][1][i+4][1])'),'reuse the current A.5 callbacks');
  assert.equal(d.options.here,true);
  assert.equal(d.options.selectMade,true);
  assert.deepEqual(Array.from(d.options.devices),devices==='both'?[false,true]:[devices==='mobile']);
 }
 const inventory=messages.find(m=>m.type==='scenarios');
 u.event={data:{pluginMessage:inventory}};
 vm.runInContext('onmessage(event)',u);
 assert.ok(elements.get('pick').innerHTML.includes('Dashboard รถที่ Overhaul'),'scenario A must advertise the Dashboard');
 assert.equal(run('SCENARIOS[0][1].length'),8,'do not mutate the full scenario inventory');
 console.log('PASS: visible Dashboard entry, actual UI dispatch, A.5–A.8 codes and callbacks, devices and selection');
})().catch(e=>{console.error(e);process.exitCode=1});
