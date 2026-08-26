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

// instance จริงมี componentProperties เสมอ — mock ต้องมีด้วย ไม่งั้นเทสไม่ได้ทดสอบ applyProps
// shiftIds = จำลองปัญหาจริง: component ชื่อซ้ำกันในไฟล์ ทำให้ id ของ property ไม่ตรงกับที่สเปกอ้าง
function propsOf(name, shiftIds) {
  const c = catByName.get(name);
  const out = {};
  (c ? c.properties : []).forEach((p) => {
    const key = shiftIds ? p.name.replace(/#[\d:]+$/, '#9999:9') : p.name;
    out[key] = { value: p.defaultValue };
  });
  return out;
}

function scenario({ importWorks, haveAll = true, shiftIds = false, decoy = false }) {
  const page = { id: '0:1', name: 'src', type: 'PAGE' };
  const names = [...used].filter((n, i) => haveAll || i % 3 !== 0);   // จำลองกรณีไฟล์มีไม่ครบ
  const setPropsCalls = [];
  const nodes = names.map((name) => {
    const set = { id: 'S:' + name, name, type: 'COMPONENT_SET', key: 'k-' + name, parent: null,
      createInstance: () => mkInst(name) };
    const variant = { id: 'C:' + name, name: 'v', type: 'COMPONENT', parent: set, key: 'k-' + name };
    function mkInst(n) {
      const cp = propsOf(n, shiftIds);
      return { id: 'I', name: n, type: 'INSTANCE', width: 10, height: 10, x: 0, y: 0,
        componentProperties: cp, resize() {},
        setProperties: (p) => {
          // Figma โยนทันทีถ้าชื่อ property ไม่มีจริง — mock ต้องทำแบบเดียวกัน
          for (const k of Object.keys(p)) if (cp[k] === undefined) throw new Error("Could not find a component property with name: '" + k + "'");
          setPropsCalls.push([n, p]);
        },
        clone() { return mkInst(n); } };
    }
    const inst = mkInst(name);
    inst.getMainComponentAsync = async () => variant;
    inst.parent = page;
    return inst;
  });

  // decoy = จำลองปัญหาจริง: มี component **ชื่อเดียวกัน** อีกตัว แต่ property คนละชุด
  // (ในไฟล์ PEA "Page header" มี 4 ตัว — บางตัวมีแค่ Page/Status บางตัวมี Title#/Badge#)
  // ปลั๊กอินต้องเลือกตัวที่ property ตรงกับที่สเปกอยากตั้ง ไม่ใช่หยิบตัวแรก
  if (decoy) {
    names.forEach((name) => {
      const dset = { id: 'D:' + name, name, type: 'COMPONENT_SET', key: 'kd-' + name, parent: null };
      const dvar = { id: 'DC:' + name, name: 'v', type: 'COMPONENT', parent: dset, key: 'kd-' + name };
      const dcp = { 'Page': { value: 'x' }, 'Status': { value: 'y' } };   // คนละชุดกับที่สเปกต้องการ
      const d = { id: 'DI', name: name, type: 'INSTANCE', width: 10, height: 10, x: 0, y: 0,
        componentProperties: dcp, resize() {},
        setProperties: (p) => { for (const k of Object.keys(p)) if (dcp[k] === undefined) throw new Error('missing ' + k); },
        clone() { return this; } };
      d.getMainComponentAsync = async () => dvar;
      d.parent = page;
      nodes.unshift(d);   // วางไว้หน้าสุด — ถ้าปลั๊กอินหยิบตัวแรกมั่วๆ จะเจอตัวนี้ก่อน
    });
  }
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
      return { createInstance: () => {
        const cp = propsOf(n, shiftIds);
        return { id: 'I', name: n, type: 'INSTANCE', width: 10, height: 10, x: 0, y: 0,
          componentProperties: cp, resize() {},
          setProperties: (p) => {
            for (const k of Object.keys(p)) if (cp[k] === undefined) throw new Error('missing ' + k);
            setPropsCalls.push([n, p]);
          } };
      } };
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

  console.log('\nกรณีที่ 4 — id ของ property ไม่ตรง (component ชื่อซ้ำกันในไฟล์) ← บั๊กที่เจอจริง 25 ส.ค.');
  s = scenario({ importWorks: false, shiftIds: true });
  await s.figma.ui.onmessage({ type: 'build', spec });
  ok(s.setPropsCalls.length > 200, `จับคู่ด้วยชื่อฐาน (ตัด #id) แล้วยังตั้งได้ ${s.setPropsCalls.length} จุด`);
  ok(s.logs.join('\n').includes('ตั้ง property ได้ครบทุกตัว'), 'ไม่มี property ตกหล่น');

  console.log('\nกรณีที่ 5 — มี component ชื่อเดียวกันแต่ property คนละชุด ← บั๊กที่เจอจริง (Page header 4 ตัว)');
  s = scenario({ importWorks: false, decoy: true });
  await s.figma.ui.onmessage({ type: 'build', spec });
  ok(s.setPropsCalls.length > 200, `เลือก instance ที่ property ตรง แล้วตั้งได้ ${s.setPropsCalls.length} จุด`);
  ok(s.logs.join('\n').includes('ตั้ง property ได้ครบทุกตัว'),
    'ไม่หยิบตัวหลอกที่วางไว้หน้าสุด — ' + (s.logs.find((l) => l.indexOf('property ที่ตั้งไม่ได้') === 0) || 'ครบ'));

  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  process.exit(fail ? 1 : 0);
})();
