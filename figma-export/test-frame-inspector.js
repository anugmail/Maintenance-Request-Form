#!/usr/bin/env node
const assert = require('assert');
const Inspector = require('./plugin-lib/frame-inspector');
const text = (id, value) => ({id, type: 'TEXT', name: 'Text', characters: value});
const component = (id, label, options = {}) => ({
  id, type: 'INSTANCE', name: 'Button', visible: true,
  variantProperties: {State: 'Default'},
  componentProperties: {'Text#1:0': {type: 'TEXT', value: label}, 'Disabled#1:1': {type: 'BOOLEAN', value: false}},
  getMainComponentAsync: async () => ({id: 'main', name: 'State=Default', key: 'library-key', parent: {type: 'COMPONENT_SET', name: 'Primary button'}}),
  children: [text(id + '-text', label)], ...options,
});
(async () => {
  const first = component('first', 'ค้นหา');
  const second = component('second', 'ส่งออก');
  const root = {id: 'frame', type: 'FRAME', name: '<frame>', children: [first, second,
    {type: 'FRAME', name: 'Hidden wrapper', visible: false, children: [component('hidden', 'ไม่แสดง')]},
  ]};
  let report = await Inspector.readSelection([root]);
  assert.strictEqual(report.frames[0].components.length, 2);
  // Siblings with the same layer name must never borrow one another's text.
  assert.deepStrictEqual(report.frames[0].components[0].texts, ['ค้นหา']);
  assert.deepStrictEqual(report.frames[0].components[1].texts, ['ส่งออก']);
  assert.strictEqual(report.frames[0].components[0].properties[1].value, false);
  assert.strictEqual(report.frames[0].components[0].component.set, 'Primary button');
  assert.ok(!Inspector.format(report).includes('ไม่แสดง'));
  root.children.push(component('new', 'ปุ่มที่เพิ่มใหม่'));
  report = await Inspector.readSelection([root]);
  assert.strictEqual(report.frames[0].components.length, 3);
  assert.ok(Inspector.format(report).includes('ปุ่มที่เพิ่มใหม่'));
  first.componentProperties['Text#1:0'].value = 'ค้นหาใหม่';
  const updated = await Inspector.read(root);
  assert.strictEqual(updated.components[0].properties[0].value, 'ค้นหาใหม่');
  const broken = await Inspector.read({type: 'FRAME', name: 'broken', children: [component('broken', 'label', {getMainComponentAsync: async () => {throw Error('missing library');}})]});
  assert.ok(broken.warnings.some(value => value.includes('missing library')));
  assert.strictEqual(broken.components[0].properties[0].value, 'label');
  const image = await Inspector.read({type: 'FRAME', name: 'FigJam screenshot', children: [{type: 'RECTANGLE', fills: [{type: 'IMAGE'}]}]});
  assert.ok(image.warnings.some(value => value.includes('ภายในภาพไม่ได้')));
  assert.strictEqual((await Inspector.readSelection([])).frames.length, 0);
  const handlers = {}, pageHandlers = {}, messages = [];
  const page = {selection: [root], on(type, fn) {pageHandlers[type] = fn;}, off(type) {delete pageHandlers[type];}};
  const api = {currentPage: page, on(type, fn) {handlers[type] = fn;}, ui: {postMessage(message) {messages.push(message);}}};
  const refresh = Inspector.watch(api);
  await refresh();
  assert.strictEqual(typeof pageHandlers.nodechange, 'function');
  assert.ok(!handlers.documentchange, 'dynamic-page reader must not require loading all pages');
  // A slow result from an old selection must not replace the new selection.
  let release;
  const delayed = component('slow', 'old', {getMainComponentAsync: () => new Promise(resolve => {release = resolve;})});
  page.selection = [{id: 'old', name: 'old selection', children: [delayed]}];
  const stale = refresh();
  page.selection = [{id: 'new', name: 'new selection', children: [second]}];
  await refresh();
  release(null);
  await stale;
  assert.strictEqual(messages[messages.length - 1].report.frames[0].id, 'new');
  const previousCount = messages.length;
  pageHandlers.nodechange();
  await new Promise(resolve => setTimeout(resolve, 220));
  assert.ok(messages.length > previousCount, 'edits on the current page refresh the report');
  const nextPageHandlers = {};
  api.currentPage = {selection: [], on(type, fn) {nextPageHandlers[type] = fn;}, off(type) {delete nextPageHandlers[type];}};
  handlers.currentpagechange();
  assert.ok(!pageHandlers.nodechange);
  assert.strictEqual(typeof nextPageHandlers.nodechange, 'function');
  handlers.close();
  assert.ok(!nextPageHandlers.nodechange);
  console.log('PASS: visible components, variants/properties, live edits, images, missing library and selection races');
})().catch(error => {console.error(error); process.exitCode = 1;});
