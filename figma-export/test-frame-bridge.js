#!/usr/bin/env node
const assert = require('assert');
const Bridge = require('./plugin-lib/frame-bridge');
const Inspector = require('./plugin-lib/frame-inspector');
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));
function storage() {
  const values = new Map();
  return {values, async getAsync(key) {return clone(values.get(key));}, async setAsync(key, value) {values.set(key, clone(value));}};
}
const node = (id, name) => ({id, name, type: 'FRAME', children: [{id: id + '-text', type: 'TEXT', name: 'Label', characters: 'ข้อมูลล่าสุด'}]});
function api(clientStorage, fileKey) {
  const data = {};
  return {clientStorage, fileKey, editorType: 'figma', root: {name: 'Design', getPluginData: key => data[key] || '', setPluginData: (key, value) => {data[key] = value;}},
    currentPage: {id: 'page', name: 'Design page', selection: [node('1:1', 'OH2 / A.1 · S1')]}};
}
(async () => {
  const local = storage();
  const first = api(local, 'file-one');
  assert.strictEqual((await Bridge.list(first)).length, 0);
  let saved = await Bridge.save(first, Inspector);
  const key = saved[0].key;
  assert.strictEqual((await Bridge.list(first)).length, 1);
  first.currentPage.selection[0].name = 'OH2 / A.1 · S1 — renamed';
  first.currentPage.selection[0].children[0].characters = 'แก้ข้อความแล้ว';
  await Bridge.save(first, Inspector);
  assert.strictEqual((await Bridge.list(first)).length, 1, 'same frame updates its record after rename');
  assert.strictEqual((await Bridge.get(first, key)).frame.texts[0].text, 'แก้ข้อความแล้ว');
  first.currentPage.selection = [node('2:1', 'OH2 / B.1 · S1')];
  await Bridge.save(first, Inspector);
  assert.strictEqual((await Bridge.list(first)).length, 2, 'saving a selection preserves other frames');
  const other = api(local, 'file-two');
  await Bridge.save(other, Inspector);
  assert.strictEqual((await Bridge.list(first)).length, 3, 'same node id in another file remains separate');
  const figjam = {...first, editorType: 'figjam'};
  assert.strictEqual((await Bridge.get(figjam, key)).frame.texts[0].text, 'แก้ข้อความแล้ว', 'other editor can load data with same storage');
  await assert.rejects(() => Bridge.save(figjam, Inspector), /Figma Design/);
  const fallback = api(local, '');
  const fallback1 = await Bridge.save(fallback, Inspector);
  const fallback2 = await Bridge.save(fallback, Inspector);
  assert.strictEqual(fallback1[0].key, fallback2[0].key, 'source identity persists when fileKey is unavailable');
  const before = JSON.stringify(await Bridge.list(first));
  const broken = {readSelection: async () => ({frames: [{id: '1:1', name: 'huge', warnings: ['อ่านไม่ครบ: เกินขอบเขต']}]})};
  await assert.rejects(() => Bridge.save(first, broken), /ขอบเขต/);
  assert.strictEqual(JSON.stringify(await Bridge.list(first)), before, 'incomplete reads never replace saved records');
  const getOnly = {...first, clientStorage: {getAsync: local.getAsync, setAsync: async () => {throw Error('quota failed');}}};
  await assert.rejects(() => Bridge.save(getOnly, Inspector), /quota failed/);
  assert.strictEqual(JSON.stringify(await Bridge.list(first)), before, 'failed write leaves previous data intact');
  await Bridge.remove(first, key);
  await assert.rejects(() => Bridge.get(first, key), /ไม่พบข้อมูล/);
  assert.strictEqual(Bridge.code('OH2 / H.4.3 · S7'), 'H.4.3');
  assert.strictEqual(Bridge.code('OH2 / S19.1 · S19'), 'S19.1');
  first.currentPage.selection = [];
  await assert.rejects(() => Bridge.save(first, Inspector), /เลือก frame/);
  first.currentPage.selection = [{id: 'text', type: 'TEXT'}];
  await assert.rejects(() => Bridge.save(first, Inspector), /ไม่เลือกเฉพาะ text/);
  console.log('PASS: cross-editor local save/load, stable frame identity, multiple files, partial/quota failures and deletion');
})().catch(error => {console.error(error); process.exitCode = 1;});
