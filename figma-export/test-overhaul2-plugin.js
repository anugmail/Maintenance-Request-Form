#!/usr/bin/env node
/* ============================================================
   ทดสอบ overhaul2-plugin/code.js โดยไม่ต้องเปิด Figma
   ------------------------------------------------------------
   จำลอง Plugin API แบบบางๆ จากข้อมูลดัมป์ของไฟล์ (out/figma-dump/<slug>/) — component · variant · property ·
   ชื่อ layer ตรงกับไฟล์จริง ⇒ จับได้ว่าปลั๊กอินอ้าง component/variant/property/layer ที่ไม่มีอยู่จริงหรือเปล่า
   (ไม่ได้จำลอง auto-layout จริง — ตำแหน่ง/ขนาดยังต้องดูในไฟล์จริง)

   รัน:  node figma-export/test-overhaul2-plugin.js [slug=component]
         EMPTY=1 node figma-export/test-overhaul2-plugin.js   จำลองไฟล์ที่ไม่มี component ในตัว → ต้องไปทาง "นำเข้าจากไลบรารี" ด้วย key
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SLUG = process.argv[2] || 'component';
const DUMP = path.join(__dirname, 'out', 'figma-dump', SLUG);
const MIXED = Symbol('mixed');
let uid = 0;

class Node {
  constructor(src, parent) {
    this.id = 'n' + (++uid);
    this.type = src.type || 'FRAME';
    this.name = src.name || '';
    this.parent = parent || null;
    this.visible = true;
    this.x = 0; this.y = 0;
    this.width = src.w || 100; this.height = src.h || 100;
    this.children = [];
    if (this.type === 'TEXT') { this.characters = src.text || ''; this.fontName = { family: 'IBM Plex Sans Thai', style: 'Regular' }; }
    if (src.component) this._mainName = src.component.name, this._variant = src.component.variant;
    for (const k of src.kids || []) this.children.push(new Node(k, this));
  }
  findOne(fn) { return this.findAll(fn)[0] || null; }
  findAll(fn) { const out = []; const w = (n) => { for (const c of n.children) { if (!fn || fn(c)) out.push(c); w(c); } }; w(this); return out; }
  findAllWithCriteria(c) { return this.findAll(n => c.types.includes(n.type)); }
  insertChild(i, c) { if (c.parent) c.parent.children = c.parent.children.filter(x => x !== c); c.parent = this; this.children.splice(i, 0, c); }
  appendChild(c) { if (c.parent) c.parent.children = c.parent.children.filter(x => x !== c); c.parent = this; this.children.push(c); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
  resize(w, h) { this.width = w; this.height = h; }
  resizeWithoutConstraints(w, h) { this.resize(w, h); }
  get absoluteBoundingBox() { let x = this.x, y = this.y, p = this.parent; while (p && p.type !== 'PAGE') { x += p.x || 0; y += p.y || 0; p = p.parent; } return { x, y, width: this.width, height: this.height }; }
  getRangeAllFontNames() { return [this.fontName]; }
  set layoutSizingHorizontal(v) { if (!this.parent || !this.parent.layoutMode) throw new Error('layoutSizingHorizontal ต้องอยู่ใน auto-layout: ' + this.name); this._lsh = v; }
  get layoutSizingHorizontal() { return this._lsh; }
  set layoutSizingVertical(v) { if (!this.parent || !this.parent.layoutMode) throw new Error('layoutSizingVertical ต้องอยู่ใน auto-layout: ' + this.name); this._lsv = v; }
  get layoutSizingVertical() { return this._lsv; }
}

/* ---------- โหลดดัมป์ → ต้นไม้ component ---------- */
const root = new Node({ type: 'DOCUMENT', name: 'doc' });
const SETS = new Map();     // ชื่อ → node ของ COMPONENT_SET / COMPONENT
for (const f of fs.readdirSync(DUMP).filter(f => f.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(DUMP, f), 'utf8'));
  const page = new Node({ type: 'PAGE', name: (d.page || f).trim() }, root);
  root.children.push(page);
  for (const s of d.sets) {
    const n = new Node(s, page); page.children.push(n);
  }
}
// เก็บ props ของ set ไว้กับ node (ดัมป์มี props ที่ระดับ set)
(function attach() {
  const walk = (src, node) => {
    if (src.props) node._props = src.props;
    if (src.variant && node.parent && node.parent.type === 'COMPONENT_SET') node.variantProperties = typeof src.variant === 'string'
      ? Object.fromEntries(src.variant.split(', ').map(x => x.split('='))) : src.variant;
    if (node.type === 'COMPONENT' && node.parent && node.parent.type === 'COMPONENT_SET' && !node.variantProperties)
      node.variantProperties = Object.fromEntries(node.name.split(', ').map(x => x.split('=')));
    (src.kids || []).forEach((k, i) => walk(k, node.children[i]));
  };
  let pi = 0;
  for (const f of fs.readdirSync(DUMP).filter(f => f.endsWith('.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(DUMP, f), 'utf8'));
    const page = root.children[pi++];
    d.sets.forEach((s, i) => walk(s, page.children[i]));
  }
})();
for (const n of root.findAll(n => n.type === 'COMPONENT_SET' || n.type === 'COMPONENT')) {
  if (n.type === 'COMPONENT' && n.parent.type === 'COMPONENT_SET') continue;
  if (!SETS.has(n.name)) SETS.set(n.name, n);
}
const propsOf = (comp) => (comp.parent && comp.parent.type === 'COMPONENT_SET' ? comp.parent._props : comp._props) || {};

function makeInstance(comp) {
  const n = new Node({ type: 'INSTANCE', name: comp.parent && comp.parent.type === 'COMPONENT_SET' ? comp.parent.name : comp.name });
  n._main = comp;
  n.width = comp.width; n.height = comp.height;
  n.variantProperties = comp.variantProperties;
  // ลูกในต้นไม้ = สำเนาของ component (เฉพาะชื่อ/ชนิด)
  const clone = (src, parent) => { const c = new Node({ type: src.type, name: src.name, w: src.width, h: src.height, text: src.characters }, parent);
    c._mainName = src._mainName; c._variant = src._variant; c.children = src.children.map(k => clone(k, c));
    if (c.type === 'INSTANCE') hydrate(c); return c; };
  n.children = comp.children.map(k => clone(k, n));
  hydrate(n);
  return n;
}
/* instance ซ้อนในดัมป์บอกแค่ชื่อ main component — ผูกกลับให้มี componentProperties/setProperties */
function hydrate(n) {
  const comp = n._main || (() => {
    const s = SETS.get(n._mainName); if (!s) return null;
    if (s.type === 'COMPONENT') return s;
    const v = typeof n._variant === 'string' ? Object.fromEntries(n._variant.split(', ').map(x => x.split('='))) : (n._variant || {});
    return s.children.find(c => Object.keys(v).every(k => c.variantProperties && c.variantProperties[k] === v[k])) || s.children[0];
  })();
  n._main = comp;
  if (comp) n.variantProperties = comp.variantProperties;
  const props = comp ? propsOf(comp) : {};
  n.componentProperties = {};
  for (const [k, v] of Object.entries(props)) n.componentProperties[k] = { type: v.type, value: v.type === 'VARIANT' ? (comp.variantProperties || {})[k] : v.defaultValue };
  n.setProperties = (obj) => {
    for (const [k, v] of Object.entries(obj)) {
      const p = n.componentProperties[k];
      if (!p) throw new Error('setProperties: ไม่มี "' + k + '" ใน ' + n.name);
      if (p.type === 'VARIANT') {
        const set = comp.parent;
        const want = Object.assign({}, comp.variantProperties, { [k]: v });
        const hit = set.children.find(c => Object.keys(want).every(x => c.variantProperties[x] === want[x]));
        if (!hit) throw new Error('setProperties: variant ' + JSON.stringify(want) + ' ไม่มีใน ' + set.name);
      }
      if (p.type === 'INSTANCE_SWAP' && !ALL.has(v)) throw new Error('setProperties: instance swap id ' + v + ' ไม่ใช่ component');
      if (p.type === 'BOOLEAN' && typeof v !== 'boolean') throw new Error('setProperties: ' + k + ' ต้องเป็น boolean');
      if (p.type === 'TEXT' && typeof v !== 'string') throw new Error('setProperties: ' + k + ' ต้องเป็น string');
      p.value = v;
    }
  };
  n.getMainComponentAsync = async () => n._main;
}
const ALL = new Set(root.findAll(n => n.type === 'COMPONENT').map(n => n.id));
for (const n of root.findAll(n => n.type === 'COMPONENT')) n.createInstance = () => makeInstance(n);

/* ---------- figma global ---------- */
const logs = [];
let uiHandler = null;
const pages = [];
const figma = {
  mixed: MIXED,
  root: Object.assign(root, { children: root.children }),
  currentPage: root.children[0],
  showUI() {},
  ui: { postMessage: (m) => logs.push(m.text), set onmessage(f) { uiHandler = f; } },
  async loadAllPagesAsync() {},
  async loadFontAsync() {},
  async setCurrentPageAsync(p) { figma.currentPage = p; },
  createFrame() { const f = new Node({ type: 'FRAME', name: 'Frame' }); return f; },
  insertChildStub: null,
  createSection() { return new Node({ type: 'SECTION', name: 'Section' }); },
  createPage() { const p = new Node({ type: 'PAGE', name: 'Page' }, root); root.children.push(p); pages.push(p); return p; },
  viewport: { scrollAndZoomIntoView() {} },
};
// frame ที่สร้างใหม่ต้องรับ layoutMode ได้
Object.defineProperty(Node.prototype, 'layoutMode', { get() { return this._lm; }, set(v) { this._lm = v; }, configurable: true });

const EMPTY = !!process.env.EMPTY;
const code0 = fs.readFileSync(process.env.CODE || path.join(__dirname, 'overhaul2-plugin', 'code.js'), 'utf8');
const BYKEY = {};
for (const m of code0.matchAll(/"([^"]+)": \["([0-9a-f]{40})", (true|false)\]/g)) BYKEY[m[2]] = m[1] === 'Sidebar' ? 'Sidebar navigation' : m[1];
const imp = (set) => async (key) => {
  const name = BYKEY[key]; const n = name && SETS.get(name);
  if (!n) throw new Error('key ' + key + ' ไม่อยู่ในไลบรารีที่เปิดใช้');
  if (set !== (n.type === 'COMPONENT_SET')) throw new Error('key ' + key + ' ชนิดไม่ตรง (set=' + set + ')');
  return n;
};
figma.importComponentSetByKeyAsync = imp(true);
figma.importComponentByKeyAsync = imp(false);
if (EMPTY) { const orig = root.findAllWithCriteria.bind(root); root.findAllWithCriteria = (c) => orig(c).filter(n => n.type === 'PAGE'); }
const code = fs.readFileSync(process.env.CODE || path.join(__dirname, 'overhaul2-plugin', 'code.js'), 'utf8');
vm.runInNewContext(code, { figma, __html__: '', console, Set, Map, Promise, Object, Array, JSON, Math, Symbol, Error });

const MODE_CHECK = process.env.MODE === 'check';
(async () => {
  await uiHandler({ type: process.env.MODE || 'build' });
  logs.forEach(l => console.log(l));
  const page = pages[0] || figma.currentPage;
  const screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('OH2 / ') === 0);
  const sections = [...new Set(screens.map(n => n.y))];   // แถว = scenario
  if (page.children.some(n => n.type === 'SECTION')) logs.push('⚠ ยังมี section บนหน้า');
  // แผง Layers ของ Figma แสดงลูกตัวสุดท้ายไว้บนสุด ⇒ จอแรกของ userflow ต้องเป็นตัวสุดท้าย
  const top = screens[screens.length - 1];
  if (top && top.name.indexOf('หน้ารายการแผน') < 0) logs.push('⚠ แผง Layers ไม่ได้เรียงจอแรกไว้บนสุด: ' + top.name);
  const bad = logs.filter(l => /^⚠|^✗/.test(l));
  const want = (code0.match(/^  \[\'(?:หน้ารายการแผน|S\d+)/gm) || []).length;   // จำนวน section ที่ประกาศ
  console.log('\n— ผลทดสอบ — แถว ' + sections.length + ' · หน้าจอ ' + screens.length + ' · คำเตือน ' + bad.length);
  process.exitCode = MODE_CHECK || (screens.length > 0 && !bad.length) ? 0 : 1;
})().catch(e => { console.error(e); process.exit(1); });
