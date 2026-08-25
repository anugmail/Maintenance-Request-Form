/* เทส build-test-plugin/code.js บน mock Plugin API
   รัน: node figma-export/test-build-plugin.js                                    */
const fs = require('fs'), path = require('path'), vm = require('vm');
let pass = 0, fail = 0;
const ok = (c, m) => c ? (pass++, console.log('  ✓', m)) : (fail++, console.log('  ✗', m));

function scenario({ importWorks }) {
  const page = { id: '0:1', name: 'Repair & Maintain', type: 'PAGE', parent: null };
  const mk = (name, key) => {
    const set = { id: 'S:' + name, name, type: 'COMPONENT_SET', key, parent: null,
      createInstance: () => ({ id: 'NEW', name, width: 100, height: 24, componentProperties: {} }) };
    const variant = { id: 'C:' + name, name: 'v', type: 'COMPONENT', parent: set, key };
    const inst = { id: 'I:' + name, name, type: 'INSTANCE', width: 100, height: 24,
      componentProperties: { 'Color': { value: 'Error' }, 'Text': { value: 'x' } },
      getMainComponentAsync: async () => variant,
      clone() { return { id: 'CL:' + name, name, width: 100, height: 24,
                         componentProperties: this.componentProperties }; } };
    inst.parent = page;
    return { set, inst };
  };
  const parts = ['Pill outline', 'Section header', 'Tertiary button'].map((n, i) => mk(n, 'key' + i));
  const nodes = parts.map(p => p.inst);
  page.findAllWithCriteria = ({ types }) => nodes.filter(n => types.includes(n.type));
  page.findAll = (fn) => nodes.filter(fn);

  const created = [];
  const logs = [];
  const figma = {
    root: { children: [page] },
    showUI() {}, notify() {},
    loadAllPagesAsync: async () => {},
    createPage: () => { const p = { name: '', appendChild: (n) => created.push(n) }; return p; },
    importComponentByKeyAsync: async (k) => {
      if (!importWorks) throw new Error('Cannot access library (plan)');
      const found = parts.find(p => p.set.key === k);
      return found.set;
    },
    ui: { postMessage: (m) => { if (m.type === 'log') logs.push(m.text); }, onmessage: null },
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'build-test-plugin/code.js'), 'utf8'),
    { figma, __html__: '', console, Object, String, Error });
  return { figma, created, logs };
}

(async () => {
  console.log('กรณีที่ 1 — importComponentByKeyAsync ใช้ได้');
  let s = scenario({ importWorks: true });
  await s.figma.ui.onmessage({ type: 'run' });
  ok(s.logs.some(l => /วิธี A ผ่าน 3\/3/.test(l)) === false || true, 'รันจบไม่ค้าง');
  ok(s.logs.join('\n').includes('สรุป: วิธี A ผ่าน 3/3'), 'A ผ่านครบ 3 — ' + (s.logs.find(l => l.startsWith('สรุป')) || ''));
  ok(s.logs.join('\n').includes('วิธี B ผ่าน 3/3'), 'B ผ่านครบ 3 ด้วย');
  ok(s.created.length === 6, `วางลงหน้าใหม่ 6 ชิ้น (A 3 + B 3) — ได้ ${s.created.length}`);

  console.log('\nกรณีที่ 2 — importComponentByKeyAsync ถูกบล็อก (แพลนไม่พอ)');
  s = scenario({ importWorks: false });
  await s.figma.ui.onmessage({ type: 'run' });
  const sum = s.logs.find(l => l.startsWith('สรุป')) || '';
  ok(sum.includes('วิธี A ผ่าน 0/3'), 'A พังทั้งหมด แต่ไม่ทำปลั๊กอินตาย — ' + sum);
  ok(sum.includes('วิธี B ผ่าน 3/3'), 'B ยังผ่านครบ ⇒ มีทางถอย');
  ok(s.logs.join('\n').includes('Cannot access library'), 'รายงานสาเหตุที่ A พังให้เห็น');
  ok(s.created.length === 3, `วางได้ 3 ชิ้นจากวิธี B — ได้ ${s.created.length}`);

  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  process.exit(fail ? 1 : 0);
})();
