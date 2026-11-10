#!/usr/bin/env node
// Reproduce a stale/unavailable newly added checkbox key at the real resolver.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname, 'overhaul2-plugin/code.js'), 'utf8');
const logs = [];
const imports = [];
const context = vm.createContext({
  __html__: '', console, setTimeout, clearTimeout,
  figma: {
    showUI() {}, ui: { postMessage(message) { logs.push(message.text); } },
    async loadAllPagesAsync() {}, root: { findAllWithCriteria() { return []; } },
    async importComponentByKeyAsync(key) {
      imports.push(key);
      if (key === '977a92f38614b4e85dc43cfa15609c8856217b53') throw new Error('Component not found or not accessible');
      return { type: 'COMPONENT', name: 'Available component', id: key };
    },
    async importComponentSetByKeyAsync(key) {
      imports.push(key); return { type: 'COMPONENT_SET', name: 'Available set', children: [], id: key };
    },
  },
});
vm.runInContext(code, context);
(async () => {
  // Exercise exactly the dependency list used to build screens, omitting only
  // Table's separate structural probe (covered by the library harness).
  try {
    await vm.runInContext("resolveAll(DIRECT.filter(name => name !== 'Table'))", context);
  } catch (error) {
    console.error(logs.filter(line => line && /✗|ไม่พบ/.test(line)).join('\n'));
    throw error;
  }
  assert.ok(!imports.includes('977a92f38614b4e85dc43cfa15609c8856217b53'));
  assert.ok(imports.includes('dfc323f6bb605f586c4928ecb08c77acfb241f53'), 'use the checkbox key verified in the current dump');
  assert.ok(vm.runInContext("INDEX.has('List with checkbox')", context));
  // Real missing dependencies must still stop with their exact name.
  await assert.rejects(vm.runInContext("resolveAll(['Deliberately missing component'])", context), /Deliberately missing component/);
  console.log('PASS: verified checkbox key used, stale key excluded; actual missing component is named');
})().catch(error => { console.error(error); process.exitCode = 1; });
