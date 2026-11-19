#!/usr/bin/env node
// Exercise the new screen/state composition independently of unavailable library
// component definitions. This validates content and dispatch, not Figma layout.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const plugin = path.join(__dirname, 'overhaul2-plugin');
const code = fs.readFileSync(path.join(plugin, 'code.js'), 'utf8');
const context = vm.createContext({
  __html__: '', console,
  figma: {showUI() {}, ui: {postMessage() {}}},
});
vm.runInContext(code, context);
vm.runInContext(`
  function shell(name, options) { const page = {children: []}; return {scr: {name, options, page}, page}; }
  function col(name, children) { return {name, children}; }
  function add(parent, node) { parent.children.push(node); return node; }
  function sectionLabel(title, options) { return {kind: 'section-label', title, options}; }
  function kv(pairs) { return {kind: 'read-only-fields', pairs}; }
  function tabs(items, active) { return {kind: 'tabs', items, active}; }
  function tbl(columns, rows) { return {kind: 'library-table', columns, rows}; }
  function inst(name) { return {kind: name, children: [], findAll() {return this.children;}}; }
  function text(node, property, value) { node[property] = value; }
  function alertBox(color, title, description) { return {kind: 'alert', color, title, description}; }
  function btn(kind, label) { return {kind, label}; }
  function buildSet(base, scenarios, groups, what, options) {
    globalThis.dispatched = {base, scenarios, groups, what, options};
  }
`, context);
const screen = state => vm.runInContext(`vehicleSummaryScreen('test', '${state}')`, context);
const walk = (node, matches = []) => {
  matches.push(node);
  for (const child of node.children || []) walk(child, matches);
  if (node.page) walk(node.page, matches);
  return matches;
};
(async () => {
  const summary = await screen('summary');
  const summaryNodes = walk(summary);
  assert.strictEqual(summaryNodes.find(n => n.kind === 'tabs').active, 0);
  assert.ok(JSON.stringify(summary).includes('82-6789 ขอนแก่น'));
  assert.ok(JSON.stringify(summary).includes('ข้อมูลทะเบียนรถ'));
  assert.ok(JSON.stringify(summary).includes('MTD-690610-007'));
  assert.ok(!summaryNodes.some(n => n.kind === 'library-table'));
  const history = await screen('history');
  const historyNodes = walk(history);
  const table = historyNodes.find(n => n.kind === 'library-table');
  assert.strictEqual(historyNodes.find(n => n.kind === 'tabs').active, 1);
  assert.strictEqual(table.columns.length, 6);
  assert.strictEqual(table.rows.length, 2);
  assert.ok(table.rows.every(row => row.length === table.columns.length));
  assert.strictEqual(table.rows[0][0].text, 'MTD-690610-007');
  assert.strictEqual(table.rows[1][0].text, 'MTD-690412-045');
  // Both samples must come from the same vehicle, not the old dashboard car.
  const historySource = fs.readFileSync(path.join(__dirname, '../app/src/lib/overhaulExec.ts'), 'utf8');
  for (const row of table.rows) assert.ok(historySource.includes('no: "' + row[0].text + '", plate: "82-6789 ขอนแก่น"'));
  for (const state of ['empty', 'error']) {
    const nodes = walk(await screen(state));
    assert.ok(!nodes.some(n => n.kind === 'library-table'), state + ' must not show stale rows');
    assert.strictEqual(nodes.find(n => n.kind === 'tabs').active, 1);
    if (state === 'empty') {
      assert.ok(nodes.some(n => n.kind === 'Empty state/Data empty'));
      assert.ok(!nodes.some(n => n.kind === 'alert'));
    } else {
      assert.ok(nodes.some(n => n.kind === 'alert' && n.color === 'Error'));
      assert.ok(nodes.some(n => n.label === 'ลองใหม่'));
      assert.ok(!nodes.some(n => n.kind === 'Empty state/Data empty'));
    }
  }
  await context.figma.ui.onmessage({type: 'build-vehicle-summary', devices: 'desktop', here: false});
  assert.strictEqual(context.dispatched.base, 'overhaul-vehicle-summary');
  assert.strictEqual(context.dispatched.scenarios[0][1].length, 4);
  assert.strictEqual(context.dispatched.options.here, true, 'summary must stay on the active page even when global here is unchecked');
  assert.strictEqual(context.dispatched.options.selectMade, true);
  assert.deepStrictEqual(Array.from(context.dispatched.options.devices), [false]);
  const ui = fs.readFileSync(path.join(plugin, 'ui.html'), 'utf8');
  assert.ok(ui.includes('id="vehicle-summary"'));
  assert.ok(ui.includes("send('build-vehicle-summary')"));
  console.log('PASS: summary, history, empty/error isolation, source fixtures and plugin dispatch');
})().catch(error => {console.error(error); process.exitCode = 1;});
