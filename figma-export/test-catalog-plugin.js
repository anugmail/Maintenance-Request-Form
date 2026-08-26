/* เทส catalog-plugin/code.js บน mock Plugin API — ต้องผ่านก่อนเอาไปกดในไฟล์จริง
   รัน: node figma-export/test-catalog-plugin.js                                  */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let pass = 0, fail = 0;
const ok = (c, m) => c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m));

// ---------- mock document ----------
function mkInstance(id, name, main, props, page) {
  const n = { id, name, type: 'INSTANCE', width: 320, height: 64,
              componentProperties: props || {},
              getMainComponentAsync: async () => main };
  n.parent = page;
  return n;
}

const page = { id: '0:1', name: 'Repair & Maintain', type: 'PAGE', parent: null };

// component set มาจากไลบรารี (remote) — parent เป็น null แบบ node remote จริง
const pageHeaderSet = {
  id: 'S:1', name: 'Page header', type: 'COMPONENT_SET', remote: true, key: 'abc123', parent: null,
  children: [{ name: 'Breakpoint=Desktop' }, { name: 'Breakpoint=Mobile' }],
  componentPropertyDefinitions: {
    'Breakpoint': { type: 'VARIANT', defaultValue: 'Desktop', variantOptions: ['Desktop', 'Mobile'] },
    'Title#1:0':  { type: 'TEXT', defaultValue: 'หัวข้อ' },
    'Badge#2:0':  { type: 'BOOLEAN', defaultValue: true },
  },
};
const pageHeaderVariant = { id: 'C:1', name: 'Breakpoint=Desktop', type: 'COMPONENT', parent: pageHeaderSet, remote: true };

// component ธรรมดาที่อยู่ในไฟล์เอง (local)
const localBtn = {
  id: 'C:2', name: 'Button', type: 'COMPONENT', remote: false, key: 'def456', parent: page,
  componentPropertyDefinitions: { 'Label#3:0': { type: 'TEXT', defaultValue: 'ปุ่ม' } },
};

// instance ที่อ่าน main ไม่ได้ — ต้องถูกนับเป็น skipped ไม่ใช่ทำพัง
const broken = { id: 'I:X', name: 'พัง', type: 'INSTANCE', width: 1, height: 1, parent: page,
                 getMainComponentAsync: async () => { throw new Error('remote fetch failed'); } };

const nodes = [
  mkInstance('I:1', 'Page header', pageHeaderVariant,
    { 'Breakpoint': { value: 'Desktop' }, 'Title#1:0': { value: 'หมายเลขเหตุการณ์ VMS005678' } }, page),
  mkInstance('I:2', 'Page header', pageHeaderVariant, { 'Breakpoint': { value: 'Mobile' } }, page),
  mkInstance('I:3', 'Button', localBtn, { 'Label#3:0': { value: 'บันทึก' } }, page),
  broken,
];
page.findAllWithCriteria = ({ types }) => nodes.filter(n => types.includes(n.type));
page.findAll = (fn) => nodes.filter(fn);

// ---------- mock figma ----------
const sent = [];
const figma = {
  root: { name: 'Repair & Maintain.anu', children: [page] },
  showUI() {},
  notify() {},
  loadAllPagesAsync: async () => {},
  ui: { postMessage: (m) => sent.push(m), onmessage: null },
};

const code = fs.readFileSync(path.join(__dirname, 'catalog-plugin/code.js'), 'utf8');
vm.runInNewContext(code, { figma, __html__: '', console, Object, String, Date, Math, JSON, Error });

(async () => {
  console.log('รัน scan บน mock');
  await figma.ui.onmessage({ type: 'scan' });

  const err = sent.find(m => m.type === 'error');
  ok(!err, err ? 'ไม่พัง — แต่พังที่ ' + err.where + ': ' + err.message : 'ไม่พังระหว่างรัน');

  const out = sent.find(m => m.type === 'catalog');
  ok(!!out, 'ส่ง catalog กลับ UI');
  if (!out) { console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`); process.exit(1); }

  const c = out.catalog;
  console.log('\nเนื้อในแคตตาล็อก');
  ok(c.totalInstances === 4, `นับ instance ครบ 4 (ได้ ${c.totalInstances})`);
  ok(c.skippedInstances === 1, `ตัวที่อ่าน main ไม่ได้ นับเป็น skipped 1 ไม่ทำพัง (ได้ ${c.skippedInstances})`);
  ok(c.componentCount === 2, `จัดกลุ่มได้ 2 component (ได้ ${c.componentCount})`);

  const ph = c.components.find(x => x.name === 'Page header');
  ok(!!ph, 'เจอ Page header');
  ok(ph.nodeType === 'COMPONENT_SET', 'ยกขึ้นระดับ component set (property ของ variant อยู่ที่ set)');
  ok(ph.instanceCount === 2, `นับ instance ของมันได้ 2 (ได้ ${ph.instanceCount})`);
  ok(ph.fromLibrary === true, 'ระบุว่ามาจากไลบรารี');
  ok(ph.properties.length === 3, `เก็บ property ครบ 3 (ได้ ${ph.properties.length})`);
  const bp = ph.properties.find(p => p.name === 'Breakpoint');
  ok(bp && bp.options && bp.options.length === 2, 'VARIANT เก็บตัวเลือกมาด้วย — ' + (bp ? bp.options : '?'));
  ok(ph.variants && ph.variants.length === 2, 'เก็บรายชื่อ variant ของ set');
  ok(ph.sample && ph.sample.id === 'I:1', 'มี sample.id ไว้ให้ clone — ' + (ph.sample || {}).id);
  ok(ph.sample.currentProperties && ph.sample.currentProperties['Breakpoint'] === 'Desktop',
    'เก็บค่า property ที่ instance ตัวอย่างตั้งไว้จริง');

  const btn = c.components.find(x => x.name === 'Button');
  ok(btn && btn.fromLibrary === false, 'component ที่อยู่ในไฟล์เอง ระบุ fromLibrary=false');
  ok(btn && btn.mainPage === 'Repair & Maintain', 'บอกได้ว่า main อยู่หน้าไหน — ' + (btn || {}).mainPage);

  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  process.exit(fail ? 1 : 0);
})();
