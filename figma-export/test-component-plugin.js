/* เทส component-plugin/code.js บน mock Plugin API ด้วย **สเปกจริง** ที่ 7-map-components.js สร้าง
   รัน: node figma-export/test-component-plugin.js                                              */
const fs = require('fs'), path = require('path'), vm = require('vm');
let pass = 0, fail = 0;
const ok = (c, m) => c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m));

const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'out/spec-components.json'), 'utf8'));
const cat = JSON.parse(fs.readFileSync(path.join(__dirname, '../design-system/figma-components.json'), 'utf8'));
const catByName = new Map(cat.components.map((c) => [c.name, c]));

// ชื่อ component ที่สเปกอ้างทั้งหมด
const used = new Set();
(function w(n) { if (n.kind === 'instance') used.add(n.component); (n.children || []).forEach(w); })
  ({ children: spec.screens.map((s) => s.root) });

function scenario({ importWorks, haveAll = true }) {
  const page = { id: '0:1', name: 'src', type: 'PAGE' };
  const names = [...used].filter((n, i) => haveAll || i % 3 !== 0);   // จำลองกรณีไฟล์มีไม่ครบ
  const setPropsCalls = [];
  const nodes = names.map((name) => {
    const set = { id: 'S:' + name, name, type: 'COMPONENT_SET', key: 'k-' + name, parent: null,
      createInstance: () => mkInst(name) };
    const variant = { id: 'C:' + name, name: 'v', type: 'COMPONENT', parent: set, key: 'k-' + name };
    function mkInst(n) {
      return { id: 'I', name: n, type: 'INSTANCE', width: 10, height: 10, x: 0, y: 0,
        setProperties: (p) => setPropsCalls.push([n, p]), clone() { return mkInst(n); } };
    }
    const inst = mkInst(name);
    inst.getMainComponentAsync = async () => variant;
    inst.parent = page;
    return inst;
  });
  page.findAllWithCriteria = ({ types }) => nodes.filter((n) => types.includes(n.type));
  page.findAll = (fn) => nodes.filter(fn);

  const appended = [];
  const pagesMade = [];
  const logs = [];
  const figma = {
    root: { children: [page] },
    showUI() {}, notify() {},
    loadAllPagesAsync: async () => {},
    loadFontAsync: async () => {},
    createPage: () => { const p = { name: '', appendChild: (n) => appended.push(n) }; pagesMade.push(p); return p; },
    createFrame: () => ({ name: '', resize() {}, x: 0, y: 0, appendChild: (n) => appended.push(n) }),
    createText: () => ({ fontName: null, characters: '', x: 0, y: 0 }),
    importComponentByKeyAsync: async (k) => {
      if (!importWorks) throw new Error('Cannot access library');
      const n = k.replace(/^k-/, '');
      return { createInstance: () => ({ id: 'I', name: n, type: 'INSTANCE', width: 10, height: 10, x: 0, y: 0,
        setProperties: (p) => setPropsCalls.push([n, p]) }) };
    },
    ui: { postMessage: (m) => { if (m.type === 'log') logs.push(m.text); }, onmessage: null },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'component-plugin/code.js'), 'utf8'),
    { figma, __html__: '', console, Object, String, Error, Math });
  return { figma, appended, pagesMade, logs, setPropsCalls };
}

(async () => {
  console.log('สเปกจริง: ' + spec.screens.length + ' หน้าจอ · อ้าง component ' + used.size + ' ตัว\n');

  console.log('ทุก component ที่สเปกอ้าง มีอยู่จริงในแคตตาล็อกไหม');
  const notInCat = [...used].filter((n) => !catByName.has(n));
  ok(notInCat.length === 0, notInCat.length ? 'ไม่มีจริง: ' + notInCat.join(', ') : 'มีครบทุกตัว (' + used.size + ')');

  console.log('\nทุก property ที่สเปกตั้ง มีอยู่ใน component นั้นไหม');
  const badProps = [];
  (function w(n) {
    if (n.kind === 'instance') {
      const c = catByName.get(n.component);
      if (c) { const known = new Set(c.properties.map((p) => p.name));
        for (const k of Object.keys(n.properties || {})) if (!known.has(k)) badProps.push(n.component + '.' + k); }
    }
    (n.children || []).forEach(w);
  })({ children: spec.screens.map((s) => s.root) });
  ok(badProps.length === 0, badProps.length ? 'ผิด: ' + [...new Set(badProps)].slice(0, 3).join(', ') : 'ถูกทุกตัว');

  console.log('\nกรณีที่ 1 — importComponentByKeyAsync ใช้ได้');
  let s = scenario({ importWorks: true });
  await s.figma.ui.onmessage({ type: 'build', spec });
  ok(s.pagesMade.length === spec.screens.length, `สร้างหน้าใหม่ ${spec.screens.length} หน้า — ได้ ${s.pagesMade.length}`);
  ok(s.setPropsCalls.length > 200, `ตั้ง property ${s.setPropsCalls.length} จุด`);
  ok(s.logs.join('\n').includes('หา component เจอครบทุกตัว'), 'ไม่มี component ที่หาไม่เจอ');
  ok(/import \d+ · clone 0/.test(s.logs.join('\n')), 'ใช้ทาง import ล้วน — ' + (s.logs.find((l) => l.indexOf('วิธีที่ใช้ได้จริง') === 0) || ''));

  console.log('\nกรณีที่ 2 — import ถูกบล็อก (แพลนไม่พอ) ต้องถอยไป clone เอง');
  s = scenario({ importWorks: false });
  await s.figma.ui.onmessage({ type: 'build', spec });
  ok(s.setPropsCalls.length > 200, `ยังตั้ง property ได้ ${s.setPropsCalls.length} จุด`);
  ok(/import 0 · clone \d+/.test(s.logs.join('\n')), 'ถอยไป clone อัตโนมัติ — ' + (s.logs.find((l) => l.indexOf('วิธีที่ใช้ได้จริง') === 0) || ''));
  ok(s.logs.join('\n').includes('หา component เจอครบทุกตัว'), 'ยังหาเจอครบ');

  console.log('\nกรณีที่ 3 — ไฟล์ปลายทางมี component ไม่ครบ');
  s = scenario({ importWorks: false, haveAll: false });
  await s.figma.ui.onmessage({ type: 'build', spec });
  ok(s.logs.join('\n').includes('หา component ไม่เจอ'), 'รายงานตัวที่หาไม่เจอ ไม่เงียบ');
  ok(s.setPropsCalls.length > 0, 'ตัวที่เจอยังสร้างได้ ไม่ล้มทั้งงาน');

  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  process.exit(fail ? 1 : 0);
})();
