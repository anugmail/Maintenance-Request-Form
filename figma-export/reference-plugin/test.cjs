const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const source = readFileSync(__dirname + '/code.js', 'utf8');
const messages = [];
const storage = new Map();
const liveNodes = new Map();
let zoomed = [];
const variable = { id: 'v1', key: 'vk', name: 'spacing/sm', resolvedType: 'FLOAT', variableCollectionId: 'collection', valuesByMode: { m1: 8 } };
const figma = {
  mixed: Symbol('mixed'), root: { name: 'Reference file' }, fileKey: 'example',
  currentPage: { id: 'p1', type: 'PAGE', name: 'Components', selection: [], children: [] },
  async getNodeByIdAsync(id) { return liveNodes.get(id) || null; },
  async setCurrentPageAsync(page) { figma.currentPage = page; },
  viewport: { scrollAndZoomIntoView(nodes) { zoomed = nodes; } },
  showUI() {}, on() {}, ui: { postMessage(m) { messages.push(m); } },
  clientStorage: { async getAsync(key) { return storage.get(key); }, async setAsync(key, value) { storage.set(key, JSON.parse(JSON.stringify(value))); } },
  variables: { async getVariableByIdAsync() { return variable; }, async getVariableCollectionByIdAsync() { return { name: 'Spacing', modes: [{ modeId: 'm1', name: 'Default' }], defaultModeId: 'm1' }; } },
  async getStyleByIdAsync() { return { id: 's1', key: 'sk', name: 'Body', type: 'TEXT' }; }
};
vm.runInNewContext(source, { figma, __html__: '', setTimeout });
async function extract(nodes, mode) {
  messages.length = 0; figma.currentPage.selection = nodes;
  await figma.ui.onmessage({ type: 'extract', mode }); return messages.at(-1);
}
(async () => {
  assert.equal((await extract([])).type, 'error');
  const text = { id: 't', name: 'Label', type: 'TEXT', characters: 'งานซ่อมทั้งหมด', fontSize: figma.mixed, textStyleId: 's1', getStyledTextSegments() { return [{ characters: this.characters, fontName: { family: 'Inter', style: 'Regular' }, fontSize: 14 }]; } };
  const instance = { id: 'i', name: 'Button', type: 'INSTANCE', visible: false, paddingTop: 0, itemSpacing: 0, boundVariables: { itemSpacing: { type: 'VARIABLE_ALIAS', id: 'v1' } }, children: [text], async getMainComponentAsync() { return { id: 'c', key: 'ck', name: 'Size=Small', remote: true, parent: { id: 'set', key: 'setkey', name: 'Button', type: 'COMPONENT_SET', componentPropertyDefinitions: {} } }; } };
  const result = await extract([instance]);
  assert.equal(result.type, 'result');
  assert.equal(result.data.nodes[0].mainComponent.set.name, 'Button');
  assert.equal(result.data.nodes[0].paddingTop, 0);
  assert.equal(result.data.nodes[0].visible, false);
  assert.equal(result.data.nodes[0].children[0].characters, text.characters);
  assert.equal(result.data.variables.v1.collection.name, 'Spacing');
  assert.equal(result.data.styles.s1.name, 'Body');
  assert.equal((await extract([instance], 'review')).type, 'error');
  await extract([instance], 'baseline');
  text.characters = 'ทะเบียน / รายละเอียดรถ';
  instance.children.unshift({ id: 'column', name: 'สถานะ', type: 'FRAME' });
  const reviewed = await extract([instance], 'review');
  assert.equal(reviewed.data.schema, 'maintain-d/review-learning/v1');
  assert.ok(reviewed.data.changes.some(c => c.kind === 'changed' && c.field === 'characters' && c.after === text.characters));
  assert.ok(reviewed.data.changes.some(c => c.kind === 'added' && c.id === 'column'));
  assert.ok(reviewed.data.changes.some(c => c.kind === 'moved' && c.id === 't'));
  assert.equal(reviewed.data.baseline.nodes[0].children[0].characters, 'งานซ่อมทั้งหมด');
  assert.equal((await extract([text], 'review')).type, 'error');
  instance.children = [text];
  assert.ok((await extract([instance], 'review')).data.changes.some(c => c.field === 'characters'));
  instance.getMainComponentAsync = async () => { throw Error('Unavailable remote'); };
  assert.match((await extract([instance])).data.warnings.join(), /main component unavailable/);
  const huge = { id: 'root', name: 'Large', type: 'FRAME', children: Array.from({ length: 2600 }, (_, i) => ({ id: String(i), name: 'child', type: 'RECTANGLE' })) };
  const limited = await extract([huge]);
  assert.equal(limited.data.nodeCount, 2500);
  assert.equal(limited.data.nodes[0].childrenTruncated, true);
  assert.match(limited.data.warnings.join(), /truncated/);
  instance.parent = figma.currentPage; text.parent = instance;
  liveNodes.set(instance.id, instance); liveNodes.set(text.id, text);
  figma.currentPage.children = [instance];
  figma.currentPage.selection = [];
  await figma.ui.onmessage({ type: 'list-nodes' });
  const listed = messages.at(-1);
  assert.equal(listed.type, 'node-list');
  assert.equal(listed.nodes[1].text, text.characters);
  assert.equal(listed.nodes[1].path, 'Button / Label');
  await figma.ui.onmessage({ type: 'select-node', id: text.id });
  assert.equal(figma.currentPage.selection[0], text);
  assert.equal(zoomed[0], text);
  assert.equal(messages.at(-1).type, 'selected');
  await figma.ui.onmessage({ type: 'select-node', id: 'deleted' });
  assert.equal(messages.at(-1).type, 'picker-error');
  assert.equal(figma.currentPage.selection[0], text);
  await figma.ui.onmessage({ type: 'select-baseline' });
  assert.equal(figma.currentPage.selection[0], instance);
  const otherPage = { id: 'p2', type: 'PAGE', name: 'Other', selection: [], children: [] };
  instance.parent = otherPage;
  await figma.ui.onmessage({ type: 'select-node', id: text.id });
  assert.equal(figma.currentPage, otherPage);
  assert.equal(figma.currentPage.selection[0], text);
  const ui = readFileSync(__dirname + '/ui.html', 'utf8');
  new vm.Script(ui.match(/<script>([\s\S]*?)<\/script>/)[1]);
  JSON.parse(readFileSync(__dirname + '/manifest.json', 'utf8'));
  console.log('PASS: reference/review regression; picker lists nested text, selects and zooms, handles deleted nodes, restores baseline selection, switches pages; UI syntax; manifest JSON');
})().catch(e => { console.error(e); process.exitCode = 1; });
