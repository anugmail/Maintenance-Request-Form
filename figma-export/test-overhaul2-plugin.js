#!/usr/bin/env node
/* ============================================================
   ทดสอบ overhaul2-plugin/code.js โดยไม่ต้องเปิด Figma
   ------------------------------------------------------------
   จำลอง Plugin API แบบบางๆ จากข้อมูลดัมป์ของไฟล์ (out/figma-dump/<slug>/) — component · variant · property ·
   ชื่อ layer ตรงกับไฟล์จริง ⇒ จับได้ว่าปลั๊กอินอ้าง component/variant/property/layer ที่ไม่มีอยู่จริงหรือเปล่า
   (ไม่ได้จำลอง auto-layout จริง — ตำแหน่ง/ขนาดยังต้องดูในไฟล์จริง)

   รัน:  node figma-export/test-overhaul2-plugin.js [slug=component]          (MODE=build ทั้งสองอุปกรณ์บนหน้าเดียว)
         MODE=build-desktop / MODE=build-mobile   ปุ่มแยกอุปกรณ์ (21 ต.ค. 2569) · MODE=build-toast PREFIX=TOAST FIRST='T1 ' · MODE=build-noti FIRST='ไม่มีแจ้งเตือนใหม่'
         EMPTY=1 node figma-export/test-overhaul2-plugin.js   จำลองไฟล์ที่ไม่มี component ในตัว → ต้องไปทาง "นำเข้าจากไลบรารี" ด้วย key
   ============================================================ */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SLUG = process.argv[2] || 'component';
const DUMP = path.join(__dirname, 'out', 'figma-dump', SLUG);
const MIXED = Symbol('mixed');
/* ไฟล์ดัมป์ที่โหลด: ทั้งโฟลเดอร์ <slug> + component ในตัวไฟล์ Maintain-D ที่ปลั๊กอินใช้ (RepairAppointmentStep — หน้า Design) */
const LOCAL_FROM_MAINTAIN_D = (process.env.LOCAL || 'RepairAppointmentStep,ReceiptChecklist,HandoverSignature,Modal Signature,Device Type,Component 1').split(',').map(s => s.trim()).filter(Boolean);   // LOCAL=ชื่อ,ชื่อ สำหรับปลั๊กอินอื่น (20 ต.ค. 2569) · Device Type = ป้ายข้างจอชุดใหม่ (ดัมป์ Maintain-D ต้องดึงใหม่ถึงจะมี — ไม่มีก็ถอยไป Component 1)
const DUMPS = fs.readdirSync(DUMP).filter(f => f.endsWith('.json')).map(f => Object.assign({ file: f }, JSON.parse(fs.readFileSync(path.join(DUMP, f), 'utf8'))));
(() => {   // สแกนทุกหน้าของไฟล์ Maintain-D — component ที่ยืมจาก flow อื่นกระจายอยู่หลายหน้า (Design · Local Component · รายละเอียดงานซ่อม)
  const dir = path.join(__dirname, 'out', 'figma-dump', 'maintain-d');
  if (!fs.existsSync(dir)) return;
  const got = new Set();
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.json')).sort()) {
    const j = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    const sets = [];
    const walk = (n) => { if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && LOCAL_FROM_MAINTAIN_D.includes(n.name) && !got.has(n.name)) { got.add(n.name); sets.push(n); } else (n.kids || []).forEach(walk); };
    (j.sets || []).forEach(walk);
    if (sets.length) DUMPS.push({ file: 'maintain-d/' + f, page: (j.page || f) + ' (Maintain-D)', sets });
  }
  const miss = LOCAL_FROM_MAINTAIN_D.filter(n => !got.has(n));
  if (miss.length) console.log('(ดัมป์ Maintain-D ไม่มี local component: ' + miss.join(', ') + ' — ปลั๊กอินต้องใช้แบบสำรองแทน)');
})();
/* component กลางของหน้า Design Annotations ไฟล์ (UI) VMS Plus – Release#2 (เจ้าของงาน 10 พ.ย. 2569 "ใช้ design จาก component กลาง")
   Header (Type=Header / Subheader) + State ที่ซ้อนอยู่ข้างใน — ตัวแรกที่ชื่อ Header ในดัมป์คือชุดใหญ่ (ตัวที่สองคือหัว Section/Case) · ANNOT=0 = ไม่มี (ทดสอบทางถอย) */
if (process.env.ANNOT !== '0') (() => {
  const f = path.join(__dirname, '..', 'design-system', '.figma-extract', 'ui-release2', '1-56.json');
  if (!fs.existsSync(f)) return;
  const j = JSON.parse(fs.readFileSync(f, 'utf8')), got = new Set();
  const sets = (j.sets || []).filter(s => ['Header', 'State'].includes(s.name) && s.type === 'COMPONENT_SET' && !got.has(s.name) && got.add(s.name));
  if (sets.length) DUMPS.push({ file: 'ui-release2/1-56.json', page: 'Design Annotations (UI Release#2)', sets });
})();
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
    if (src.dir) this._lm = src.dir;
    if (src.type === 'INSTANCE' && src.variant && typeof src.variant === 'object') this._pv = src.variant;   // ค่า property ของ instance ซ้อน (ดัมป์)   // auto layout ของดัมป์ — ให้ตั้ง layoutSizing ลูกได้เหมือนจริง
    for (const k of src.kids || []) this.children.push(new Node(k, this));
  }
  findOne(fn) { return this.findAll(fn)[0] || null; }
  async getMainComponentAsync() { return this._main || null; }   // 4 พ.ย. 2569: instance ที่มาจากดัมป์ (ไม่ผ่าน makeInstance) ก็ต้องมีเมธอดนี้ เหมือน Figma จริง — ดัมป์ maintain-d รุ่นใหม่มี Progress steps เป็น instance
  findAll(fn) { const out = []; const w = (n) => { for (const c of n.children) { if (!fn || fn(c)) out.push(c); w(c); } }; w(this); return out; }
  findAllWithCriteria(c) { return this.findAll(n => c.types.includes(n.type)); }
  insertChild(i, c) { if (c.parent) c.parent.children = c.parent.children.filter(x => x !== c); c.parent = this; this.children.splice(i, 0, c); }
  appendChild(c) { if (c.parent) c.parent.children = c.parent.children.filter(x => x !== c); c.parent = this; this.children.push(c); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); }
  async setReactionsAsync(r) { if (this.removed) throw new Error('node ถูกลบแล้ว'); this.reactions = JSON.parse(JSON.stringify(r)); }   // prototype กดต่อจอ (30 ต.ค. 2569)
  async exportAsync(o) { if (!o || o.format !== 'PNG') throw new Error('exportAsync: รองรับแค่ PNG ในเทส'); return new Uint8Array(16); }
  resize(w, h) { this.width = w; this.height = h; }
  resizeWithoutConstraints(w, h) { this.resize(w, h); }
  get absoluteBoundingBox() { let x = this.x, y = this.y, p = this.parent; while (p && p.type !== 'PAGE') { x += p.x || 0; y += p.y || 0; p = p.parent; } return { x, y, width: this.width, height: this.height }; }
  getRangeAllFontNames() { return [this.fontName]; }
  set layoutSizingHorizontal(v) { if (!this.parent || !this.parent.layoutMode) throw new Error('layoutSizingHorizontal ต้องอยู่ใน auto-layout: ' + this.name); this._lsh = v; }
  get layoutSizingHorizontal() { return this._lsh; }
  set layoutSizingVertical(v) { if (!this.parent || !this.parent.layoutMode) throw new Error('layoutSizingVertical ต้องอยู่ใน auto-layout: ' + this.name); this._lsv = v; }
  get layoutSizingVertical() { return this._lsv; }
  set layoutGrow(v) { if (v !== 0 && v !== 1) throw new Error('layoutGrow รับแค่ 0 หรือ 1 (ได้ ' + v + '): ' + this.name); this._lg = v; }   // ตาม Figma จริง
  get layoutGrow() { return this._lg; }
}

/* ---------- โหลดดัมป์ → ต้นไม้ component ---------- */
const root = new Node({ type: 'DOCUMENT', name: 'doc' });
const SETS = new Map();     // ชื่อ → node ของ COMPONENT_SET / COMPONENT
for (const d of DUMPS) {
  const f = d.file;
  const page = new Node({ type: 'PAGE', name: (d.page || f).trim() }, root);
  root.children.push(page);
  for (const s of d.sets) {
    const n = new Node(s, page); page.children.push(n);
    if (s.key) n._key = s.key;   // key ที่ไฟล์ Component เผยแพร่ — ใช้ตรวจ key ใน KEYS (3 พ.ย. 2569)
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
  for (const d of DUMPS) {
    const page = root.children[pi++];
    d.sets.forEach((s, i) => walk(s, page.children[i]));
  }
})();
for (const n of root.findAll(n => n.type === 'COMPONENT_SET' || n.type === 'COMPONENT')) {
  if (n.type === 'COMPONENT' && n.parent.type === 'COMPONENT_SET') continue;
  if (!SETS.has(n.name)) SETS.set(n.name, n);
}
/* component เดี่ยวที่ดัมป์ไม่มี props (เช่น Horizontal radio groups · 3 พ.ย. 2569) — เดาจาก instance ของมันที่มีอยู่ในดัมป์ ค่า property ที่มี "#" = property ของ component */
(() => {
  const need = new Set([...SETS.values()].filter(c => c.type === 'COMPONENT' && !c._props).map(c => c.name));
  if (!need.size) return;
  for (const i of root.findAll(n => n.type === 'INSTANCE' && n._pv && need.has(n._mainName))) {
    const keys = Object.entries(i._pv).filter(([k]) => k.indexOf('#') > 0);
    if (!keys.length) continue;
    SETS.get(i._mainName)._props = Object.fromEntries(keys.map(([k, v]) => [k, { type: typeof v === 'boolean' ? 'BOOLEAN' : /^\d+:\d+$/.test(v) ? 'INSTANCE_SWAP' : 'TEXT', defaultValue: v }]));
    need.delete(i._mainName);
  }
})();
const propsOf = (comp) => (comp.parent && comp.parent.type === 'COMPONENT_SET' ? comp.parent._props : comp._props) || {};

function makeInstance(comp) {
  const n = new Node({ type: 'INSTANCE', name: comp.parent && comp.parent.type === 'COMPONENT_SET' ? comp.parent.name : comp.name });
  n._main = comp;
  n.width = comp.width; n.height = comp.height; n._lm = comp._lm;
  n.variantProperties = comp.variantProperties;
  // ลูกในต้นไม้ = สำเนาของ component (เฉพาะชื่อ/ชนิด)
  const clone = (src, parent) => { const c = new Node({ type: src.type, name: src.name, w: src.width, h: src.height, text: src.characters, dir: src._lm }, parent);
    c._mainName = src._mainName; c._variant = src._variant; c._pv = src._pv; c.children = src.children.map(k => clone(k, c));
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
  let props = comp ? propsOf(comp) : {};
  if (!Object.keys(props).length && n._pv) props = Object.fromEntries(Object.entries(n._pv).filter(([k]) => k.indexOf('#') > 0)   // component เดี่ยวที่ดัมป์ไม่มี props — เดาจากค่าใน instance
    .map(([k, v]) => [k, { type: typeof v === 'boolean' ? 'BOOLEAN' : /^\d+:\d+$/.test(v) ? 'INSTANCE_SWAP' : 'TEXT', defaultValue: v }]));
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
        if (hit !== comp) {   // เปลี่ยน variant = ลูกเปลี่ยนตาม variant ใหม่ (เหมือน Figma) · ค่า property อื่นคงเดิม
          const keep = n.componentProperties, fresh = makeInstance(hit);
          n.children = fresh.children; n.children.forEach(c => { c.parent = n; });
          n._main = hit; hydrate(n);
          for (const x of Object.keys(keep)) if (keep[x].type !== 'VARIANT' && n.componentProperties[x]) n.componentProperties[x].value = keep[x].value;
          return n.setProperties(Object.fromEntries(Object.entries(obj).filter(([x]) => x !== k)));
        }
      }
      if (p.type === 'INSTANCE_SWAP' && !ALL.has(v) && v !== p.value) throw new Error('setProperties: instance swap id ' + v + ' ไม่ใช่ component');
      if (p.type === 'BOOLEAN' && typeof v !== 'boolean') throw new Error('setProperties: ' + k + ' ต้องเป็น boolean');
      if (p.type === 'TEXT' && typeof v !== 'string') throw new Error('setProperties: ' + k + ' ต้องเป็น string');
      p.value = v;
    }
  };
  n.getMainComponentAsync = async () => n._main;
  n.detachInstance = () => { if (n.type !== 'INSTANCE') throw new Error('detachInstance ใช้กับ INSTANCE เท่านั้น'); for (let p = n.parent; p; p = p.parent) if (p.type === 'INSTANCE') throw new Error('detachInstance: ลูกของ instance detach ไม่ได้'); n.type = 'FRAME'; n._main = null; n._mainName = null; n.componentProperties = {}; return n; };   // Figma จริง: instance ชั้นบน → FrameNode ลูกเดิมอยู่ครบ (3 พ.ย. 2569 ช่องตารางรายการรับรถแบบงานซ่อม)
  n.swapComponent = (comp) => { if (!comp || comp.type !== 'COMPONENT') throw new Error('swapComponent ต้องได้ COMPONENT'); n._main = null; n._mainName = (comp.parent && comp.parent.type === 'COMPONENT_SET') ? comp.parent.name : comp.name; n._variant = comp.variantProperties; n.name = n._mainName; hydrate(n); ; { const fresh = makeInstance(comp); n.children = fresh.children; n.children.forEach(c => { c.parent = n; }); n.width = fresh.width; n.height = fresh.height; }   /* 30 ต.ค. 2569: Figma จริงแทนลูกด้วยของ component ใหม่ — เดิม mock เก็บลูกเก่าไว้ */ };
}
const ALL = new Set(root.findAll(n => n.type === 'COMPONENT').map(n => n.id));
for (const n of root.findAll(n => n.type === 'COMPONENT')) n.createInstance = () => makeInstance(n);

/* ---------- figma global ---------- */
const logs = [];
const LOAD_ALL = { n: 0 };
/* pluginData ของ document — COMP_CACHE_FILE=ไฟล์ json = เก็บข้ามรอบ (จำลองไฟล์ Figma เดิมที่กดซ้ำ) */
const PD = (() => { try { return process.env.COMP_CACHE_FILE ? JSON.parse(fs.readFileSync(process.env.COMP_CACHE_FILE, 'utf8')) : {}; } catch (e) { return {}; } })();
root.getPluginData = (k) => PD[k] || '';
root.setPluginData = (k, v) => { PD[k] = v; if (process.env.COMP_CACHE_FILE) fs.writeFileSync(process.env.COMP_CACHE_FILE, JSON.stringify(PD)); };
let uiHandler = null;
const pages = [];
const figma = {
  mixed: MIXED,
  root: Object.assign(root, { children: root.children }),
  currentPage: Object.assign(root.children[0], { selection: [] }),
  showUI() {},
  ui: { postMessage: (m) => { if (m.type === 'log') logs.push(m.text); if (m.type === 'shots-done') { const sh = m.manifest.shots, n = (d) => sh.filter(x => x.device === d).length; console.log('ส่งภาพจอ: desktop ' + n('desktop') + ' · mobile ' + n('mobile') + ' · ไฟล์ mobile ลงท้าย -mobile ' + sh.filter(x => x.device === 'mobile').every(x => /-mobile\.png$/.test(x.file))); } }, set onmessage(f) { uiHandler = f; } },   // shots-done (5 พ.ย. 2569) = ตรวจว่าส่ง mobile ด้วย   // ข้อความชนิดอื่น (รายการ scenario ให้หน้าต่างติ๊ก) ไม่ใช่ log
  async loadAllPagesAsync() { LOAD_ALL.n++; },   // นับครั้งที่โหลดทุกหน้า (10 พ.ย. 2569 ข้อ ก. — นำเข้าด้วย key ก่อน ไม่ต้องโหลดทุกหน้า)
  async getNodeByIdAsync(id) { return root.findOne ? root.findOne(n => n.id === id) : root.findAll(n => n.id === id)[0] || null; },
  async loadFontAsync() {},
  async setCurrentPageAsync(p) { figma.currentPage = p; },
  createFrame() { const f = new Node({ type: 'FRAME', name: 'Frame' }); return f; },
  createText() { const t = new Node({ type: 'TEXT', name: 'Text' }); t.fontName = { family: 'Inter', style: 'Regular' }; return t; },   // ป้ายรหัส flow แบบสำรอง (20 ต.ค. 2569)
  insertChildStub: null,
  createSection() { return new Node({ type: 'SECTION', name: 'Section' }); },
  // ผัง userflow ข้างจอ (22 ต.ค. 2569 · ปลั๊กอินบำรุงรักษา): รูปทรง + เส้นหักมุม
  createEllipse() { return new Node({ type: 'ELLIPSE', name: 'Ellipse' }); },
  createRectangle() { return new Node({ type: 'RECTANGLE', name: 'Rectangle' }); },
  createImage(bytes) { if (!(bytes instanceof Uint8Array)) throw new Error('createImage ต้องได้ Uint8Array'); return { hash: 'img' + (++uid) }; },   // ภาพย่อจอในผัง userflow
  base64Decode(s) { if (typeof s !== 'string' || !s) throw new Error('base64Decode ต้องได้ string'); return Uint8Array.from(Buffer.from(s, 'base64')); },   // ภาพ Empty state ฝังตอน build (5 พ.ย. 2569)
  createPolygon() { return new Node({ type: 'POLYGON', name: 'Polygon' }); },
  createVector() { const v = new Node({ type: 'VECTOR', name: 'Vector' });
    v.setVectorNetworkAsync = async (net) => { if (!net || !Array.isArray(net.vertices) || !Array.isArray(net.segments)) throw new Error('vectorNetwork ผิดรูป');
      net.segments.forEach(g => { if (!net.vertices[g.start] || !net.vertices[g.end]) throw new Error('segment ชี้ vertex ที่ไม่มี'); }); v.vectorNetwork = net; }; return v; },
  createPage() { const p = new Node({ type: 'PAGE', name: 'Page' }, root); root.children.push(p); pages.push(p); return p; },
  viewport: { scrollAndZoomIntoView() {} },
};
// frame ที่สร้างใหม่ต้องรับ layoutMode ได้
Object.defineProperty(Node.prototype, 'layoutMode', { get() { return this._lm; }, set(v) { this._lm = v; }, configurable: true });

const EMPTY = !!process.env.EMPTY;
const code0 = fs.readFileSync(process.env.CODE || path.join(__dirname, 'overhaul2-plugin', 'code.js'), 'utf8');
const BYKEY = {};
for (const m of (code0 + fs.readFileSync(path.join(__dirname, 'overhaul2-plugin', 'code.js'), 'utf8')).matchAll(/"([^"]+)": \["([0-9a-f]{40})", (true|false)\]/g)) BYKEY[m[2]] = m[1] === 'Sidebar' ? 'Sidebar navigation' : m[1];
const imp = (set) => async (key) => {
  const name = BYKEY[key]; const n = name && SETS.get(name);
  if (!n) throw new Error('key ' + key + ' ไม่อยู่ในไลบรารีที่เปิดใช้');
  if (set !== (n.type === 'COMPONENT_SET')) throw new Error('key ' + key + ' ชนิดไม่ตรง (set=' + set + ')');
  // 3 พ.ย. 2569: เดิมหาจากชื่ออย่างเดียว key ผิดก็ผ่าน (Horizontal radio groups ใส่ key ของ instance ใน UI Release#2 ที่ชี้ไลบรารีอื่น → Figma จริงนำเข้าไม่ได้)
  if (n._key && n._key !== key) throw new Error('key ' + key + ' ของ ' + name + ' ไม่ตรงกับไฟล์ Component (' + n._key + ')');
  return n;
};
figma.importComponentSetByKeyAsync = imp(true);
figma.importComponentByKeyAsync = imp(false);
if (EMPTY) { const orig = root.findAllWithCriteria.bind(root); root.findAllWithCriteria = (c) => orig(c).filter(n => n.type === 'PAGE'); }
const code = fs.readFileSync(process.env.CODE || path.join(__dirname, 'overhaul2-plugin', 'code.js'), 'utf8');
vm.runInNewContext(code, { figma, __html__: '', console, Set, Map, Promise, Object, Array, JSON, Math, Symbol, Error });

// PS_SLOTS=7: จำลองไลบรารีหลังเจ้าของงานเพิ่มช่อง Progress steps เป็น 7 + publish (19 ต.ค. 2569)
function extendPS(n) {
  const h = SETS.get('Progress steps').children.find(c => c.variantProperties && c.variantProperties.Type === 'Horizontal');
  const items = h.children.filter(c => c.name === 'Horizontal step item');
  while (h.children.filter(c => c.name === 'Horizontal step item').length < n) {
    const src = items[items.length - 1], c = new Node({ type: 'INSTANCE', name: src.name }, h);
    c._mainName = src._mainName; c._variant = src._variant; c._pv = src._pv; h.children.push(c);
  }
}
if (process.env.PS_SLOTS) extendPS(+process.env.PS_SLOTS);
// TABLE_COLS=13: จำลองไลบรารีหลังเจ้าของงาน publish Table ที่มีคอลัมน์มากกว่า 8 (21 ต.ค. 2569 ค่ำ) — ต่อ Column ท้ายทุก variant ของชุด Table (ปลั๊กอิน probeTable() ต้องเห็นแล้วเลือกชุดคอลัมน์เอง)
function extendTable(n) {
  const deep = (src, parent) => { const c = new Node({ type: src.type, name: src.name, w: src.width, h: src.height, text: src.characters, dir: src._lm }, parent);
    c._mainName = src._mainName; c._variant = src._variant; c._pv = src._pv; c.children = (src.children || []).map(k => deep(k, c)); if (c.type === 'INSTANCE') hydrate(c); return c; };
  for (const v of SETS.get('Table').children) {
    const content = v.findAll(x => x.name === 'Content' && (x.children || []).some(k => k.name === 'Column'))[0];
    const cols = content.children.filter(k => k.name === 'Column');
    while (content.children.filter(k => k.name === 'Column').length < n) content.children.push(deep(cols[cols.length - 1], content));
  }
}
const TABLE_COLS = process.env.TABLE_COLS === undefined ? 12 : +process.env.TABLE_COLS;   // ไม่ตั้ง = จำลองไลบรารีที่เจ้าของงาน publish แล้ว (> 8 คอลัมน์ · 21 ต.ค. ค่ำ) · TABLE_COLS=8 = ไลบรารีเก่าตาม dump
if (TABLE_COLS > 8) extendTable(TABLE_COLS);
console.log('จำลอง component Table ' + TABLE_COLS + ' คอลัมน์' + (process.env.TABLE_COLS === undefined ? ' (ค่าเริ่มต้น — ไลบรารี publish ใหม่ 21 ต.ค. · TABLE_COLS=8 = ตาม dump เก่า)' : ''));
// REF_STEPPER=1: จำลองหน้างานซ่อมที่มีเฟรม "Progress steps" 7 ขั้น (มีกรอบ มุม 12 เส้นสีแดง) ⇒ ปลั๊กอินต้องลอกกรอบนี้
if (process.env.REF_STEPPER) {
  const pg = new Node({ type: 'PAGE', name: 'Flow การซ่อม' }, root); root.children.push(pg);
  const fr = new Node({ type: 'FRAME', name: 'Progress steps', dir: 'HORIZONTAL' }, pg); pg.children.push(fr);
  fr.cornerRadius = 12; fr.strokes = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]; fr.strokeWeight = 2;
  const hs = SETS.get('Horizontal step item');
  for (let i = 0; i < 7; i++) { const it = makeInstance(hs.children[0]); it.parent = fr; fr.children.push(it); }
}
/* EXISTING=1 (22 ต.ค. 2569): ไฟล์มีหน้า "🔧 Maintainance" ที่เจ้าของงานวางของไว้แล้ว ⇒ ปลั๊กอินต้องวางบนหน้านั้น ต่อใต้ของเดิม ไม่แตะของเดิม */
if (process.env.EXISTING) {
  const pg = new Node({ type: 'PAGE', name: process.env.EXISTING_PAGE || '🔧 Maintainance ' }, root); root.children.push(pg);   // EXISTING_PAGE= ชื่อหน้าของปลั๊กอินอื่น (ประเมินผู้รับจ้าง 22 ต.ค. 2569)
  const old = new Node({ type: 'FRAME', name: 'ของเดิมที่แก้มือ', w: +process.env.EXISTING_W || 1440, h: +process.env.EXISTING_H || 900 }, pg); old.y = +process.env.EXISTING_Y || 120; pg.children.push(old);   // EXISTING_Y= ของเดิมเกินขอบพื้นที่วางงาน (2 พ.ย. 2569) · EXISTING_W= ของเดิมกว้างเต็มขอบ ⇒ ไม่มีคอลัมน์ทางขวา ต้องไปหน้า -2 (4 พ.ย. 2569)
  global.__existing = { page: pg, node: old, x: old.x, y: old.y };
  if (process.env.EXISTING_CURRENT) figma.currentPage = Object.assign(pg, { selection: [] });
  /* FAKE_CUT=1 (10 พ.ย. 2569): ใส่จอเก่าของบล็อกที่ตัดออก (M = S14 · O = S16) + จอที่ยังใช้ (L = S13) บนหน้าเดิม ⇒ ทดสอบปุ่มแยกจอที่ตัดออก (MODE=archive-cut) ว่าย้ายเฉพาะบล็อกที่ตัด */
  if (process.env.FAKE_CUT) [['MT / M.1 · S14 — รายการ', 0], ['MT · M S14 หน่วยงาน ตรวจหลักฐาน', -200], ['MT / O.2 · S16 — ประวัติของแผน', 2000], ['MT / L.1 · S13 — ยังใช้อยู่', 4000]].forEach(([nm, y]) => {
    const f = new Node({ type: 'FRAME', name: nm, w: 1440, h: 900 }, pg); f.x = 400; f.y = 2000 + y; pg.children.push(f); });   // ปลั๊กอิน login (30 ต.ค. 2569): วางบนหน้าที่เปิดอยู่ ⇒ หน้าเดิมต้องเป็นหน้าปัจจุบัน
}
const MODE_CHECK = process.env.MODE === 'check';
(async () => {
  if (process.env.SHOTS_DIR) {   // ปลั๊กอิน login (30 ต.ค. 2569): หน้าต่างส่งภาพหน้าจริงเป็นข้อความ 'shots' ก่อนสั่งสร้าง
    const files = {};
    for (const f of fs.readdirSync(process.env.SHOTS_DIR).filter(x => x.endsWith('.png'))) files[f.replace(/\.png$/, '')] = new Uint8Array(fs.readFileSync(path.join(process.env.SHOTS_DIR, f)));
    await uiHandler({ type: 'shots', files });
  }
  if (process.env.PRE_MODE) for (const t of process.env.PRE_MODE.split(',')) await uiHandler({ type: t, devices: process.env.PRE_DEVICES || 'desktop', pick: (process.env.PRE_PICK || '').split(',').filter(Boolean) });   // คั่นจุลภาค = กดหลายปุ่มตามลำดับ (30 ต.ค. 2569 ทดสอบส่งภาพเมื่อหน้ามีจอ 2 ชุด)   // PRE_MODE=build-desktop MODE=build-journey = สร้างจอก่อนแล้วกด journey (ทดสอบภาพย่อ · 22 ต.ค. 2569)
  let protoSeed = null, moveSeed = null;
  if (process.env.MODE === 'move-latest') {   // ปุ่มย้ายบล็อกที่ล้นขอบ (2 พ.ย. 2569): สร้าง S1 แล้วเลื่อนทั้งชุดไปไกลเท่าเหตุการณ์จริง
    await uiHandler({ type: 'build-pick', pick: ['0'], devices: 'desktop' });
    const pg = figma.currentPage;
    pg.children.forEach(n => { n.y += 231434; });
    moveSeed = { pg, n: pg.children.length };
    if (process.env.MOVE_FROM2) { const p2 = figma.createPage(); p2.name = 'Maintainance-2'; pg.children.slice().forEach(n => p2.appendChild(n)); moveSeed.p2 = p2; }   // กดปุ่มรุ่นก่อนไปแล้ว ของอยู่หน้า -2
  }
  if (process.env.MODE === 'clear-proto') {   // ปุ่มลบลิงก์กดต่อจอ (2 พ.ย. 2569): จำลองไฟล์ที่เคยผูกลิงก์ไว้ ต้องเหลือเฉพาะ interaction ที่ปลั๊กอินไม่ได้ผูก
    const pg = figma.currentPage, scr = pg.children.filter(n => n.type === 'FRAME' && n.name.indexOf((process.env.PREFIX || 'OH2') + ' / ') === 0);
    const btn = scr.flatMap(f => f.findAll(n => n.type === 'INSTANCE' && /button$/i.test(n.name))).slice(0, 6);
    const nav = { type: 'NODE', destinationId: scr[1].id, navigation: 'NAVIGATE' };
    await btn[0].setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [nav] }]);
    await btn[1].setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'BACK' }] }]);
    await btn[2].setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [nav] }, { trigger: { type: 'ON_HOVER' }, actions: [{ type: 'BACK' }] }]);
    await btn[3].setReactionsAsync([{ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'URL', url: 'https://example.com' }] }]);
    pg.flowStartingPoints = [{ nodeId: scr[0].id, name: 'ของปลั๊กอิน' }, { nodeId: 'อื่น', name: 'ของคนอื่น' }];
    protoSeed = { pg, scr, btn };
  }
  await uiHandler({ type: process.env.MODE === 'patch' ? 'build' : (process.env.MODE || 'build'), here: process.env.HERE === '1', pick: (process.env.PICK || '').split(',').filter(Boolean), devices: process.env.DEVICES || 'both', parts: (process.env.PARTS || '').split(',').filter(Boolean) });   // PARTS=storymap,usecase สำหรับ MODE=build-docs (30 ต.ค. 2569)   // PICK=7,13 DEVICES=desktop สำหรับ MODE=build-pick   // HERE=1 = ติ๊ก "วางต่อท้ายหน้าที่เปิดอยู่"
  if (moveSeed) {
    const to = figma.currentPage, top = Math.min(...to.children.map(n => n.y)), low = Math.max(...to.children.map(n => n.y + n.height));
    if (to !== moveSeed.pg || to.children.length !== moveSeed.n || top < -60000 || low > 60000 || (moveSeed.p2 && root.children.indexOf(moveSeed.p2) >= 0)) logs.push('⚠ ย้ายบล็อกล้นขอบไม่ครบ ' + to.name + ' ' + to.children.length + '/' + moveSeed.n + ' y ' + top + ' ถึง ' + low);
    else console.log('ย้ายบล็อกล้นขอบ: อยู่หน้าเดิม ' + to.children.length + ' ชิ้น y ' + Math.round(top) + ' ถึง ' + Math.round(low) + ' ✓');
  }
  if (protoSeed) {
    const { pg, btn } = protoSeed, n = (b) => (b.reactions || []).length;
    if (n(btn[0]) || n(btn[1])) logs.push('⚠ ลิงก์กดต่อจอยังไม่ถูกลบ');
    if (n(btn[2]) !== 1 || btn[2].reactions[0].trigger.type !== 'ON_HOVER') logs.push('⚠ interaction อื่นบนชิ้นเดียวกันถูกลบไปด้วย');
    if (n(btn[3]) !== 1) logs.push('⚠ ลิงก์ที่ปลั๊กอินไม่ได้ผูกถูกลบไปด้วย');
    if (pg.flowStartingPoints.length !== 1 || pg.flowStartingPoints[0].nodeId !== 'อื่น') logs.push('⚠ flow starting point ลบไม่ตรง');
    console.log('ลบลิงก์กดต่อจอ: ตรวจ 4 ชิ้น + flow starting point ครบ');
  }
  if (process.env.MODE === 'archive-cut' && process.env.FAKE_CUT) {   // ปุ่มแยกจอที่ตัดออก (10 พ.ย. 2569): ย้ายเฉพาะบล็อกที่ตัดเข้ากรอบ "ตัดออกแล้ว" · จอที่ยังใช้อยู่คงที่เดิม · ไม่ลบ · ชื่อขึ้นต้น "ตัดออก · "
    const pg = global.__existing.page, box = pg.children.find(n => n.name === 'ตัดออกแล้ว'), errs = [];
    if (!box) errs.push('ไม่มีกรอบ ตัดออกแล้ว');
    if (box && box.type === 'SECTION') errs.push('กรอบเป็น section (R19 ห้าม)');
    if (pg.children.some(n => /^MT \/ [MO]\.|^MT · M /.test(n.name))) errs.push('ยังมีจอของบล็อกที่ตัดอยู่นอกกรอบ');
    if (!pg.children.some(n => n.name === 'MT / L.1 · S13 — ยังใช้อยู่')) errs.push('จอที่ยังใช้ (S13) ถูกย้ายหรือหาย');
    const moved = box ? box.children.filter(n => n.name.indexOf('ตัดออก · MT') === 0).length : 0;
    if (moved !== 3) errs.push('ย้ายเข้ากรอบ ' + moved + ' ชิ้น ต้องเป็น 3');
    if (box && box.children.filter(n => /^ตัดออก · S1[46] \(บล็อก/.test(n.name)).length !== 2) errs.push('ไม่มีแถบบอกบล็อกที่ตัดครบ 2 แถบ');
    errs.forEach(e => console.log('⚠ ' + e));
    console.log('แยกจอที่ตัดออก: ย้าย ' + moved + ' ชิ้น · แถบ 2 · S13 อยู่ที่เดิม' + (errs.length ? '' : ' ✓'));
    console.log('\n— ผลทดสอบ — แยกจอที่ตัดออก · คำเตือน ' + errs.length);
    process.exit(errs.length ? 1 : 0);
  }
  if (process.env.MODE === 'patch') {   // สร้างแบบเก่า (CODE=ไฟล์เก่า) แล้วแก้เฉพาะส่วนด้วยโค้ดปัจจุบัน · PATCH=ชื่อข้อความ (ค่าเริ่ม patch-dividers)
    figma.currentPage.selection = [];
    if (process.env.PS_SLOTS_AFTER) extendPS(+process.env.PS_SLOTS_AFTER);   // ไลบรารีอัปเดตหลังสร้างจอแล้ว
    const ctx = () => ({ figma, __html__: '', console, Set, Map, Promise, Object, Array, JSON, Math, Symbol, Error });
    if (process.env.BROKEN) {   // จำลองรอบที่พังกลางทาง (เช่น layoutGrow=3 ของ 19 ต.ค.) ให้รอบถัดไปต้องกู้ต่อได้
      vm.runInNewContext(fs.readFileSync(process.env.BROKEN, 'utf8'), ctx());
      for (const t of (process.env.PATCH || 'patch-dividers').split(',')) await uiHandler({ type: t }).catch(e => console.log('(รอบพัง) ' + e.message));
    }
    if (process.env.CODE) vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'overhaul2-plugin', 'code.js'), 'utf8'), ctx());
    if (process.env.SELECT) {   // SELECT=all | regex — จำลองผู้ใช้คลิกเลือกเฟรมบนหน้าก่อนกด "อัปเดตจอที่เลือก" (21 ต.ค. 2569)
      const re = process.env.SELECT === 'all' ? null : new RegExp(process.env.SELECT);
      figma.currentPage.selection = figma.currentPage.children.filter(n => n.type === 'FRAME' && n.name.indexOf('OH2 / ') === 0 && (!re || re.test(n.name)));
      console.log('(เลือกเฟรม ' + figma.currentPage.selection.length + ' เฟรม)');
      global.__before = figma.currentPage.children.map(n => [n.id, n.name, n.x, n.y]);
    }
    for (const t of (process.env.PATCH || 'patch-dividers').split(',')) await uiHandler({ type: t, addNew: process.env.ADDNEW !== '0' });
  }
  logs.forEach(l => console.log(l));
  const printed = logs.length;   // คำเตือนที่ตัวตรวจเพิ่มหลังจากนี้ พิมพ์ท้ายผล
  const page = process.env.EXISTING || process.env.MODE === 'move-latest' || process.env.PRE_PICK ? figma.currentPage : (pages[0] || figma.currentPage);   // EXISTING=1: ปลั๊กอินต้องหาหน้าที่มีอยู่แล้วเอง (ไม่สร้างหน้าใหม่)
  const PREFIX = (process.env.PREFIX || 'OH2') + ' / ';   // ปลั๊กอินอื่นตั้ง PREFIX= (เช่น MT) · FIRST= ชื่อจอแรกของ userflow (20 ต.ค. 2569)
  let screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PREFIX) === 0 && n.name.indexOf(' · ตัดแล้ว') < 0);   // จอที่ CF ตัดแล้ว (ติดป้ายไว้ ไม่ลบ) ไม่ตรวจ
  if (process.env.CHECK_ONLY) screens = screens.filter(n => new RegExp(process.env.CHECK_ONLY).test(n.name));   // ตรวจเฉพาะจอที่อัปเดต (จอเก่าที่ไม่ได้เลือกอาจยังเป็นแบบก่อน CF)
  if (global.__before && process.env.SELECT && process.env.PATCH !== 'read-selection') {   // อัปเดตจอที่เลือก (read-selection แค่อ่าน ไม่แทนที่): จอที่ไม่ได้เลือกต้องเป็น node เดิม ตำแหน่งเดิม · จอที่เลือกต้องถูกแทนที่ที่ตำแหน่งเดิม
    const byId = new Map(page.children.map(n => [n.id, n]));
    const re = process.env.SELECT === 'all' ? null : new RegExp(process.env.SELECT);
    let kept = 0, replaced = 0;
    for (const [id, name, x, y] of global.__before) {
      const sel = name.indexOf('OH2 / ') === 0 && (!re || re.test(name));
      const n = byId.get(id);
      if (!sel) { if (!n || n.x !== x || n.y !== y) logs.push('⚠ จอที่ไม่ได้เลือกถูกแตะ: ' + name); else kept++; continue; }
      if (n && n.name.indexOf(' · ตัดแล้ว') < 0) logs.push('⚠ จอที่เลือกไม่ถูกแทนที่: ' + name);
      else if (!n) { const m = page.children.find(c => c.x === x && c.y === y && c.type === 'FRAME'); if (!m) logs.push('⚠ ตำแหน่งเดิมว่างหลังแทนที่: ' + name); else replaced++; }
    }
    console.log('อัปเดตจอที่เลือก: แทนที่ตำแหน่งเดิม ' + replaced + ' · ไม่แตะ ' + kept + (logs.some(l => /ถูกแตะ|ไม่ถูกแทนที่|ว่างหลัง/.test(l)) ? '' : ' ✓'));
  }
  const sections = [...new Set(screens.map(n => n.y))];   // แถว = scenario
  // ไม่เหลือเส้นคั่นที่มองเห็น (เจ้าของงานสั่งปิด divider ทั้งหมด 19 ต.ค. 2569)
  const shown = (n) => { for (let p = n; p; p = p.parent) if (p.visible === false) return false; return true; };
  let divs = 0;
  screens.forEach(sc => sc.findAll(n => shown(n) && ((n.name === 'Divider' || n.name === 'Content divider') ||
    (n.type === 'INSTANCE' && n.componentProperties && Object.keys(n.componentProperties).some(k => k.split('#')[0] === 'Divider' && (n.componentProperties[k].value === true || n.componentProperties[k].value === 'True'))))).forEach(() => divs++));
  if (divs) logs.push('⚠ ยังเห็นเส้นคั่น ' + divs + ' จุด'); else console.log('ไม่เหลือเส้นคั่นที่มองเห็น ✓');
  if (page.children.some(n => n.type === 'SECTION')) logs.push('⚠ ยังมี section บนหน้า');
  // วงเงินอนุมัติ + ประเภทงบประมาณ แถวเดียวกันครึ่งต่อครึ่ง · ช่องตามประเภท (WBS 3 ช่อง ฯลฯ) แถวถัดไปครึ่งขวา (29 ต.ค. 2569 · เดิม 19 ต.ค. WBS อยู่แถววงเงิน)
  //   ไม่เหลือหัวข้อ "งบโครงการตาม WBS" · ช่องตามประเภทไม่บังคับทุกช่อง (Optional) ไม่มี error
  const lbl = (n) => { const cp = n.componentProperties || {}; const k = Object.keys(cp).find(x => x.split('#')[0] === 'Label text'); return k ? cp[k].value : ''; };
  const prop = (n, name) => { const cp = n.componentProperties || {}; const k = Object.keys(cp).find(x => x.split('#')[0] === name); return k ? cp[k].value : undefined; };
  const DEP = ['เลข WBS', 'เลขโครงข่าย', 'เลขกิจกรรม', 'เลขที่ใบสั่ง', 'หมายเหตุ', 'ศูนย์ต้นทุน'];
  let wbs = 0;
  screens.forEach(sc => {
    const f = sc.findAll(n => n.type === 'INSTANCE' && (n.name === 'Text input' || n.name === 'Input dropdown'));
    const g = (t) => f.find(n => lbl(n) === t);
    const b = g('วงเงินอนุมัติ (บาท)'); if (!b) return; wbs++;
    const t = g('ประเภทงบประมาณ'), desk = sc.width > 500;
    if (!t || t.parent !== b.parent || b.parent.children.indexOf(t) !== b.parent.children.indexOf(b) + 1) { logs.push('⚠ ประเภทงบประมาณไม่อยู่ถัดวงเงินอนุมัติในแถวเดียวกัน: ' + sc.name); return; }
    if (desk && (b.layoutGrow !== 1 || t.layoutGrow !== 1)) logs.push('⚠ วงเงิน/ประเภทงบ ไม่ได้แบ่งครึ่ง: ' + sc.name);
    const dep = DEP.map(g).filter(Boolean);
    if (!dep.length) return;
    if (dep.some(x => x.parent !== dep[0].parent)) { logs.push('⚠ ช่องตามประเภทงบไม่อยู่แถวเดียวกัน: ' + sc.name); return; }
    if (dep.some(x => lbl(x) !== 'ศูนย์ต้นทุน' && prop(x, 'Optional') !== true) || dep.some(x => prop(x, 'Helper') === true)) logs.push('⚠ ช่องตามประเภทงบต้องไม่บังคับและไม่มี error: ' + sc.name);
    if (desk) {
      const box = dep[0].parent, r = box.parent, rows = r && r.parent ? r.parent.children : [];
      if (box.name !== 'WBS' || rows.indexOf(r) !== rows.indexOf(b.parent) + 1 || r.children[0].name !== 'Spacer' || r.children[1] !== box || box.layoutGrow !== 1 || dep.some(x => x.layoutGrow !== 1))
        logs.push('⚠ ช่องตามประเภทงบไม่อยู่ครึ่งขวาของแถวใต้วงเงิน: ' + sc.name);
    }
    const w = ['เลข WBS', 'เลขโครงข่าย', 'เลขกิจกรรม'].map(g);
    if (w.some(Boolean) && w.some(x => !x)) logs.push('⚠ ช่อง WBS ไม่ครบ 3 ช่อง: ' + sc.name);
    else if (w[0] && w.map(x => x.parent.children.indexOf(x)).join() !== [0, 1, 2].map(i => w[0].parent.children.indexOf(w[0]) + i).join()) logs.push('⚠ ลำดับช่อง WBS ผิด: ' + sc.name);
    if (sc.findAll(n => n.type === 'TEXT' && n.characters === 'งบโครงการตาม WBS').length) logs.push('⚠ ยังเหลือหัวข้อ งบโครงการตาม WBS: ' + sc.name);
  });
  // รีวิว 19 ต.ค. 2569: ตารางต้องเป็น component Table · หน้า Detail ใช้ Section label · Info icon ปิด · กล่องแสดงข้อมูล
  let nT = 0, nL = 0;
  screens.forEach(sc => {
    sc.findAll(n => n.type === 'FRAME' && n.name === 'Table' && n.children.some(x => x.name === 'Column')).forEach(t => {   // ยอมเฉพาะตารางที่เกินขนาด Table ของไลบรารี
      const cs = t.children.filter(x => x.name === 'Column');
      if (cs.length <= 8 && cs[0].children.length - 1 <= 10) logs.push('⚠ ยังมีตารางประกอบเอง: ' + sc.name);
    });
    nT += sc.findAll(n => n.type === 'INSTANCE' && n._main && n._main.parent && n._main.parent.name === 'Table').length;
    const ph = sc.findAll(n => n.type === 'INSTANCE' && n.name === 'Page header')[0];
    const tk = ph && Object.keys(ph.componentProperties).find(x => x.split('#')[0] === 'Title');
    if (tk && /^หมายเลข/.test(ph.componentProperties[tk].value)) {
      if (sc.findAll(n => n.type === 'INSTANCE' && n.name === 'Section header').length) logs.push('⚠ หน้า Detail ยังใช้ Section header: ' + sc.name);
      nL += sc.findAll(n => n.type === 'INSTANCE' && n.name === 'Section label').length;
    }
    sc.findAll(n => n.type === 'INSTANCE' && n.name === 'Input label').forEach(l => { const k = Object.keys(l.componentProperties).find(x => x.split('#')[0] === 'Info icon'); if (k && l.componentProperties[k].value !== false && shown(l)) logs.push('⚠ Info icon ยังเปิด: ' + sc.name); });
    const inInst = (n) => { for (let p = n.parent; p && p !== sc; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };   // กรอบใน component ของทีมออกแบบ (Modal Signature) ไม่นับ
    if (sc.findAll(n => n.type === 'FRAME' && n.name === 'Content item' && !inInst(n)).length) logs.push('⚠ กล่องแสดงข้อมูลยังไม่ได้แต่ง: ' + sc.name);
  });
  if (process.env.SHOW) screens.filter(sc => sc.name.indexOf(process.env.SHOW) >= 0).forEach(sc => sc.findAll(n => n.type === 'INSTANCE' && n.name === 'Table').forEach(t => {
    const v = (n, k) => { const x = Object.keys(n.componentProperties || {}).find(y => y.split('#')[0] === k); return x ? n.componentProperties[x].value : ''; };
    t.findAll(n => n.name === 'Column' && n.visible !== false).forEach(c => console.log('  | ' + c.children.filter(x => x.visible !== false).map(x => (v(x, 'Style') || 'H') + ':' + (v(x, 'Text') || '')).join(' | ')));
  }));
  // กติกา component-rules.json (19 ต.ค. 2569) — ผิดกติกา = ไม่ผ่าน · ข้อยกเว้นที่รอเคาะแสดงแยก
  const rc = require('./check-component-rules').check(screens, { inFile: (n) => !EMPTY && SETS.has(n) });
  rc.fails.slice(0, 40).forEach(f => { logs.push('⚠ กติกา ' + f); console.log('⚠ กติกา ' + f); }); if (rc.fails.length > 40) logs.push('⚠ กติกา … อีก ' + (rc.fails.length - 40) + ' จุด');
  console.log(rc.fails.length ? 'ผิดกติกา component ' + rc.fails.length + ' จุด' : 'ตรงกติกา component-rules.json ✓');
  rc.pending.forEach(p => console.log('  รอเคาะ: ' + p));
  if (!process.env.MODE && !process.env.CHECK_ONLY && process.env.PREFIX === 'MT') rc.unmatched.forEach(u => { logs.push('⚠ กติกาไม่ตรงจอไหนเลย (ชื่อจอเปลี่ยน? scenario ตัดแล้วให้ใส่ retired): ' + u); console.log('⚠ กติกาไม่ตรงจอไหนเลย: ' + u); });   // เฉพาะโหมดสร้างครบทุกจอของปลั๊กอินบำรุงรักษา (10 พ.ย. 2569 · Overhaul มี R17 ไม่ตรงจอ รอเจ้าของชุดนั้นดู)
  console.log('ตาราง Table ' + nT + ' · Section label ในหน้า Detail ' + nL);
  if (wbs) console.log('ตรวจแถววงเงิน + WBS ' + wbs + ' จอ' + (logs.some(l => /^⚠.*WBS/.test(l)) ? '' : ' ✓'));
  // แผง Layers ของ Figma แสดงลูกตัวสุดท้ายไว้บนสุด ⇒ จอแรกของ userflow ต้องเป็นตัวสุดท้าย
  const top = screens[screens.length - 1];
  if (top && !process.env.CHECK_ONLY && top.name.indexOf(process.env.FIRST || 'หน้ารายการแผน') < 0) logs.push('⚠ แผง Layers ไม่ได้เรียงจอแรกไว้บนสุด: ' + top.name);
  // R19 แพทเทิร์นจัดวาง (เจ้าของงานสั่ง 20 ต.ค. 2569): ป้ายรหัส flow "<prefix> · …" ต้องมี · จอ mobile อยู่ใต้จอ desktop คอลัมน์เดียวกัน (x เท่ากัน · y มากกว่า)
  const labels = page.children.filter(n => n.name.indexOf((process.env.PREFIX || 'OH2') + ' · ') === 0);
  if (!labels.length && process.env.R19 !== '0') logs.push('⚠ R19 ไม่มีป้ายรหัส flow (แถบตัวอักษร/ย่อย/state · Device/Desktop/Mobile)');   // R19=0 = หน้าเก่าก่อนมีป้าย (19 ต.ค.)
  /* R19 ฉบับ 10 พ.ย. 2569 (component กลางของหน้า Design Annotations · UI Release#2): ปลั๊กอินที่มี blockHeader + ไฟล์มี Header ⇒ แถบหัวบล็อก = Header Type=Header · ป้าย state = Header Type=Subheader (State=Default)
     ห้ามถอยไปแถบวาดเองเงียบๆ เมื่อ component มีอยู่ */
  if (code.includes('async function blockHeader') && SETS.has('Header') && process.env.R19 !== '0') {
    const P0 = process.env.PREFIX || 'OH2', pv = (n) => n.variantProperties || {};
    for (const b of labels.filter(n => !/ · (Device|Desktop|Mobile)$/.test(n.name) && !/(flowchart|userflow)/.test(n.name) && n.name.indexOf(P0 + ' · journey') !== 0 && n.name.indexOf(P0 + ' · ป้าย ') !== 0 && !/ · (use case|user story mapping|scenario|use case ตาม scenario|user journey swimlane)$/.test(n.name))) {
      const code1 = b.name.slice(P0.length + 3).split(' ')[0], isState = /\.\d+$/.test(code1), isPhase = code1 === 'ช่วง';
      if (b.type !== 'INSTANCE') { logs.push('⚠ R19 แถบ ' + b.name.slice(0, 50) + ' วาดเอง ทั้งที่ไฟล์มี component Header (Design Annotations)'); continue; }
      const want = (code1 === 'Journey' || code1 === 'Page') ? 'Header' : 'Subheader';   // หน้าจริงของ UI Release#2: Type=Header 1 ตัวต่อหน้า · บล็อกตัวอักษร/state/ช่วงงาน = Subheader
      if (pv(b).Type !== want) { logs.push('⚠ R19 แถบ ' + code1 + ' ต้องเป็น Header Type=' + want + ' (ได้ ' + pv(b).Type + ')'); continue; }
      if (want === 'Subheader') {   // ชื่อยาวต้องขึ้นบรรทัดใหม่ในกว้างของแถบ ไม่ล้นทับคอลัมน์ข้าง (10 พ.ย. 2569 V.4.1 ทับ V.4.2)
        const det = b.children.find(c => c.name === 'Detail'), t0 = det && det.children.find(c => c.type === 'TEXT');
        if (!t0 || t0._lsh !== 'FILL' || t0.textAutoResize !== 'HEIGHT') logs.push('⚠ R19 แถบ ' + code1 + ' ชื่อไม่ตัดบรรทัดในกว้างของแถบ (ต้อง FILL + HEIGHT) — ชื่อยาวจะล้นทับคอลัมน์ข้าง');
      }
      if (want === 'Subheader' && !isPhase) {   // สี State: บล็อก = Default · state = Sub Flow / Success / Failed ตามชื่อจอ
        const st = b.children.find(c => c.name === 'State'), tone = st && (st.variantProperties || {}).State;
        const label = b.name.slice(P0.length + 3 + code1.length + 1);
        const exp = !isState ? 'Default' : /ไม่สำเร็จ|Validation/.test(label) ? 'Failed' : /สำเร็จ/.test(label) ? 'Success' : 'Sub Flow';
        if (tone !== exp) logs.push('⚠ R19 แถบ ' + code1 + ' State ต้องเป็น ' + exp + ' (ได้ ' + tone + ')');
      }
    }
  }
  let pairs = 0;
  const mobs = screens.filter(n => / · mobile$/.test(n.name)), desks = screens.filter(n => !/ · mobile$/.test(n.name));
  const split = !mobs.length || !desks.length;   // ปุ่มแยก desktop/mobile (21 ต.ค. 2569): หน้าหนึ่งมีอุปกรณ์เดียว ⇒ ไม่มีคู่ให้ตรวจ แต่ป้าย Device ต้องตรงอุปกรณ์
  if (!split && process.env.R19 !== '0') for (const m of mobs) {   // R19=0 = หน้าเก่า 19 ต.ค. (mobile วางคู่ desktop) ไม่ตรวจคู่
    const d = screens.find(n => n.name === m.name.replace(/ · mobile$/, ''));
    if (!d) { logs.push('⚠ R19 จอ mobile ไม่มีคู่ desktop: ' + m.name); continue; }
    if (d.x !== m.x || !(d.y < m.y)) logs.push('⚠ R19 จอ mobile ไม่ได้อยู่ใต้ desktop คอลัมน์เดียวกัน: ' + m.name);
    pairs++;
  }
  if (split && screens.length) {
    const kind = mobs.length ? 'Mobile' : 'Desktop', other = mobs.length ? 'Desktop' : 'Mobile';
    if (labels.some(n => n.name.endsWith(' · ' + other))) logs.push('⚠ R19 ชุด ' + kind + ' อย่างเดียว แต่มีป้าย ' + other);
    if (!labels.some(n => n.name.endsWith(' · ' + kind))) logs.push('⚠ R19 ชุด ' + kind + ' ไม่มีป้าย ' + kind);
    if (!/^TOAST \/ /.test(screens[0].name) && screens.some(n => !/ — ไฟล์ (PDF|Excel)/.test(n.name) && Math.round(n.width) !== (mobs.length ? 402 : 1440))) logs.push('⚠ R19 ชุด ' + kind + ' มีจอกว้างผิดอุปกรณ์');   // R32 เฟรมไฟล์ส่งออกไม่ใช่จอ   // เฟรม toast (R20) ไม่ใช่ขนาดจอ
  }
  console.log('R19 จัดวางแบบตาราง flow: ป้าย ' + labels.length + (split ? ' · ชุดอุปกรณ์เดียว (' + (mobs.length ? 'mobile ' + mobs.length : 'desktop ' + desks.length) + ' จอ)' : ' · คู่ desktop/mobile ' + pairs) + (logs.some(l => /R19/.test(l)) ? '' : ' ✓'));
  if (global.__existing && process.env.EXISTING_Y) {   // หน้าเดิมเกินขอบพื้นที่วางงาน ⇒ ต้องไปหน้า -2 เริ่มจากบนสุด ของเดิมอยู่ที่เดิม
    const ex = global.__existing, full = !!process.env.EXISTING_FULL, fresh = page.children.filter(n => n !== ex.node), top = Math.min(...fresh.map(n => n.y)), low = Math.max(...fresh.map(n => n.y + n.height));
    if (full ? (page === ex.page || !/-2$/.test(page.name)) : page !== ex.page) logs.push('⚠ ปลายทางผิด (วางบน ' + page.name + ')');
    if (ex.node.parent !== ex.page || ex.node.y !== ex.y) logs.push('⚠ ของเดิมบนหน้าถูกแตะ');
    if (top < -60000 || low > 60000) logs.push('⚠ ชุดใหม่อยู่นอกขอบ y ' + top + ' ถึง ' + low);
    if (!full && fresh.some(n => n.y < ex.y + ex.node.height && n.y + n.height > ex.y && n.x < ex.x + ex.node.width && n.x + n.width > ex.x)) logs.push('⚠ ชุดใหม่ทับของเดิม');
    console.log('หน้าเดิมเกินขอบ: วางบน "' + page.name.trim() + '" y ' + Math.round(top) + ' ถึง ' + Math.round(low) + ' ของเดิมไม่ถูกแตะ ✓');
  } else if (global.__existing) {   // หน้าเดิมต้องเป็นหน้าปลายทาง · ของเดิมอยู่ที่เดิม · ของใหม่อยู่ใต้ของเดิมทั้งหมด
    const ex = global.__existing;
    if (page !== ex.page) logs.push('⚠ ไม่ได้วางบนหน้าที่มีอยู่แล้ว (' + ex.page.name.trim() + ') — วางบน ' + page.name);
    if (ex.node.parent !== ex.page || ex.node.x !== ex.x || ex.node.y !== ex.y) logs.push('⚠ ของเดิมบนหน้าถูกแตะ');
    const bottom = ex.y + ex.node.height, right = ex.x + ex.node.width;   // 4 พ.ย. 2569: ชุดที่สูงเกินช่องใต้ของเดิม วางเป็นคอลัมน์ใหม่ทางขวาได้ (fitOn) ⇒ ทับ = ซ้อนทั้งแนวตั้งและแนวนอน
    const above = page.children.filter(n => n !== ex.node && n.y < bottom && n.y + n.height > ex.y && n.x < right && n.x + n.width > ex.x);
    const fr = page.children.filter(n => n !== ex.node), lo = Math.min(...fr.map(n => n.y)), hi = Math.max(...fr.map(n => n.y + n.height));
    if (lo < -60000 || hi > 60000) logs.push('⚠ ชุดใหม่อยู่นอกขอบ y ' + Math.round(lo) + ' ถึง ' + Math.round(hi));
    if (above.length) logs.push('⚠ ของใหม่ทับของเดิม ' + above.length + ' ชิ้น: ' + above[0].name);
    if (pages.length) logs.push('⚠ สร้างหน้าใหม่ทั้งที่มีหน้า ' + global.__existing.page.name.trim() + ' อยู่แล้ว');
    console.log('วางต่อใต้ของเดิมบนหน้า "' + ex.page.name.trim() + '"' + (logs.slice(printed).some(l => /ของเดิม|หน้าที่มีอยู่|หน้าใหม่ทั้งที่/.test(l)) ? '' : ' ✓'));
  }
  if (process.env.MODE === 'build-docs') {   // ติ๊กเลือกส่วน (30 ต.ค. 2569): กรอบ story map / use case อยู่บนหน้าเดียวกับจอ · ไม่ทับกัน · การ์ด/แถวครบตามไฟล์ · กดซ้ำไม่ซ้อน
    const P = process.env.PREFIX || 'OH2';
    const parts = (process.env.PARTS || 'storymap,usecase').split(',');
    const docs = page.children.filter(n => n.name === P + ' · user story mapping' || n.name === P + ' · use case' || n.name === P + ' · scenario' || n.name === P + ' · use case ตาม scenario' || n.name === P + ' · user journey swimlane' || n.name.indexOf(P + ' · flowchart กิจกรรม') === 0);   // ตาราง scenario (4 พ.ย. 2569 เจ้าของงาน "ทำตัว export ให้หน่อย")
    const sm = docs.find(n => /story mapping$/.test(n.name)), uc = docs.find(n => /use case$/.test(n.name));
    if (parts.includes('storymap') && !sm) logs.push('⚠ ไม่มีกรอบ user story mapping');
    if (parts.includes('usecase') && !uc) logs.push('⚠ ไม่มีกรอบ use case');
    const cards = sm ? sm.findAll(n => n.name === 'การ์ด').length : 0, cols = sm ? sm.findAll(n => n.name.indexOf('ช่วงงาน · ') === 0).length : 0;
    const rows = uc ? uc.findAll(n => n.name === 'แถว').length : 0, tbls = uc ? uc.findAll(n => n.name.indexOf('ตาราง · ') === 0).length : 0;
    if (sm && (cards !== +(process.env.STORY_N || 30) || cols !== +(process.env.STORY_COLS || 7))) logs.push('⚠ story map มีการ์ด ' + cards + ' ช่วงงาน ' + cols + ' แต่ต้องมี 30 / 7');
    if (uc && rows !== +(process.env.UC_N || 62)) logs.push('⚠ use case มี ' + rows + ' แถว แต่ต้องมี ' + (process.env.UC_N || 62));
    const box = (n) => n.absoluteBoundingBox || { x: n.x, y: n.y, width: n.width, height: n.height };
    const all = page.children.filter(n => n.type !== 'PAGE');
    for (const d of docs) for (const o of all) { if (o === d) continue; const a = box(d), b = box(o); if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) logs.push('⚠ กรอบ ' + d.name + ' ทับ ' + o.name); }
    if (['use case', 'user story mapping', 'scenario', 'use case ตาม scenario', 'user journey swimlane'].some(k => page.children.filter(n => n.name === P + ' · ' + k).length > 1)) logs.push('⚠ กรอบเอกสารซ้อนกันหลังกดซ้ำ');
    const sw = docs.find(n => n.name === P + ' · user journey swimlane');   // 4 พ.ย. 2569 user journey swimlane: กล่อง/เส้น/lane ครบตามไฟล์ · กล่องอยู่ในเลนของตัวเอง ไม่ล้นกรอบ
    if (parts.includes('swimlane') && !sw) logs.push('⚠ ไม่มีกรอบ user journey swimlane');
    let swBox = 0, swLine = 0, swLane = 0;
    if (sw) {
      const kids = sw.children, boxes = kids.filter(n => /^(ขั้น|ทางแยก) /.test(n.name)), lanes = kids.filter(n => n.name.indexOf('lane · ') === 0), lines = kids.filter(n => n.name.indexOf('เส้น ') === 0);
      swBox = boxes.length; swLine = lines.length; swLane = lanes.length;
      if (process.env.SWIM_N && swBox !== +process.env.SWIM_N) logs.push('⚠ swimlane มีกล่อง ' + swBox + ' แต่ต้องมี ' + process.env.SWIM_N);
      if (process.env.SWIM_EDGES && swLine !== +process.env.SWIM_EDGES) logs.push('⚠ swimlane มีเส้น ' + swLine + ' แต่ต้องมี ' + process.env.SWIM_EDGES);
      if (process.env.SWIM_LANES && swLane !== +process.env.SWIM_LANES) logs.push('⚠ swimlane มี lane ' + swLane + ' แต่ต้องมี ' + process.env.SWIM_LANES);
      if (!boxes.some(n => n.type === 'POLYGON')) logs.push('⚠ swimlane ไม่มีทางแยกข้าวหลามตัด');
      if (process.env.FLOW_KIND === 'flowchart' && kids.some(n => /^ภาพย่อ|^ป้ายจอ/.test(n.name))) logs.push('⚠ swimlane มีหน้าจอปน (6 พ.ย. 2569 เจ้าของงานเลือกแบบไม่มีจอ)');
      if (boxes.some(n => /^ขั้น /.test(n.name) && n.type !== 'RECTANGLE')) logs.push('⚠ swimlane ขั้นงานต้องเป็นสี่เหลี่ยม');
      for (const b of boxes) {
        if (b.x < 0 || b.y < 0 || b.x + b.width > sw.width || b.y + b.height > sw.height) logs.push('⚠ swimlane กล่อง ' + b.name + ' ล้นกรอบ');
        if (!lanes.some(l => b.y >= l.y && b.y + b.height <= l.y + l.height)) logs.push('⚠ swimlane กล่อง ' + b.name + ' คร่อมเลน');
      }
      if (lines.some(v => !v.vectorNetwork || v.vectorNetwork.vertices[v.vectorNetwork.vertices.length - 1].strokeCap !== 'ARROW_LINES')) logs.push('⚠ swimlane มีเส้นไม่มีหัวลูกศร');
    }
    const scen = docs.filter(n => n.type === 'FRAME' && n.name.indexOf(P + ' · flowchart กิจกรรม · S') === 0);   // 6 พ.ย. 2569 flowchart กิจกรรม "อยากให้แยก scen เลยนะ": กรอบบนหน้า 1 scenario = 1 กรอบ · ไม่ซ้อนหลังกดซ้ำ · กิจกรรม = สี่เหลี่ยม · ทางเลือก = ข้าวหลามตัด · เส้นมีหัวลูกศร · ไม่ล้นกรอบ · ไม่มีหน้าจอปน
    if (parts.includes('activity') && !scen.length) logs.push('⚠ ไม่มีกรอบ flowchart กิจกรรม');
    if (parts.includes('activity') && !docs.some(n => n.name === P + ' · flowchart กิจกรรม · คำอธิบาย')) logs.push('⚠ ไม่มีกรอบคำอธิบาย flowchart กิจกรรม');
    if (docs.some(n => n.name === P + ' · flowchart กิจกรรม')) logs.push('⚠ flowchart กิจกรรม ยังรวมอยู่ในกรอบใหญ่ (ต้องแยกกรอบละ scenario)');
    if (new Set(scen.map(n => n.name)).size !== scen.length) logs.push('⚠ flowchart กิจกรรม มีกรอบซ้อนกันหลังกดซ้ำ');
    let afScen = scen.length, afBox = 0, afLine = 0;
    if (scen.length) {
      if (process.env.ACT_N && afScen !== +process.env.ACT_N) logs.push('⚠ flowchart กิจกรรม มี ' + afScen + ' scenario แต่ต้องมี ' + process.env.ACT_N);
      for (const a of scen) for (const b of scen) if (a !== b && a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) logs.push('⚠ flowchart กรอบ ' + a.name + ' ทับ ' + b.name);
      for (const g of scen) {
        const boxes = g.children.filter(n => /^(กิจกรรม|ทางเลือก|เริ่ม\/จบ) /.test(n.name)), lines = g.children.filter(n => n.name.indexOf('เส้น ') === 0 && n.type === 'VECTOR');
        afBox += boxes.length; afLine += lines.length;
        if (boxes.some(n => /^กิจกรรม /.test(n.name) && n.type !== 'RECTANGLE')) logs.push('⚠ flowchart ' + g.name + ' กิจกรรมต้องเป็นสี่เหลี่ยม');
        if (boxes.some(n => /^ทางเลือก /.test(n.name) && n.type !== 'POLYGON')) logs.push('⚠ flowchart ' + g.name + ' ทางเลือกต้องเป็นข้าวหลามตัด');
        if (lines.some(v => !v.vectorNetwork || v.vectorNetwork.vertices[v.vectorNetwork.vertices.length - 1].strokeCap !== 'ARROW_LINES')) logs.push('⚠ flowchart ' + g.name + ' มีเส้นไม่มีหัวลูกศร');
        for (const k of g.children) if (k.x < 0 || k.y < 0 || k.x + k.width > g.width + 1 || k.y + k.height > g.height + 1) logs.push('⚠ flowchart ' + g.name + ' ชิ้น ' + k.name + ' ล้นกรอบ');
        if (g.children.some(n => /^ภาพย่อ|^ป้ายจอ/.test(n.name))) logs.push('⚠ flowchart ' + g.name + ' มีหน้าจอปน (เจ้าของงานสั่งแยก)');
      }
      if (process.env.ACT_BOX && afBox !== +process.env.ACT_BOX) logs.push('⚠ flowchart กิจกรรม มีกล่อง ' + afBox + ' แต่ต้องมี ' + process.env.ACT_BOX);
      if (process.env.ACT_LINES && afLine !== +process.env.ACT_LINES) logs.push('⚠ flowchart กิจกรรม มีเส้น ' + afLine + ' แต่ต้องมี ' + process.env.ACT_LINES);
    }
    const sc = docs.find(n => n.name === P + ' · scenario'), scRows = sc ? sc.findAll(n => n.name === 'แถว').length : 0;
    if (parts.includes('scenarios') && !sc) logs.push('⚠ ไม่มีกรอบตาราง scenario');
    const us = docs.find(n => n.name === P + ' · use case ตาม scenario'), usGroups = us ? us.findAll(n => n.name.indexOf('ตาราง · ') === 0).length : 0;   // 4 พ.ย. 2569: กลุ่มละ scenario + กลุ่มที่ยังไม่อยู่ใน scenario
    if (parts.includes('ucscen') && !us) logs.push('⚠ ไม่มีกรอบ use case ตาม scenario');
    if (us && process.env.SCEN_N && usGroups !== +process.env.SCEN_N - 1) logs.push('⚠ use case ตาม scenario มี ' + usGroups + ' กลุ่ม แต่ต้องมี ' + (+process.env.SCEN_N - 1));
    if (sc && scRows !== +(process.env.SCEN_N || 22)) logs.push('⚠ ตาราง scenario มี ' + scRows + ' แถว แต่ต้องมี ' + (process.env.SCEN_N || 22));   // 20 scenario + ตัดออก 2
    console.log('เอกสารบนหน้า: story map การ์ด ' + cards + ' (' + cols + ' ช่วงงาน) · use case ' + rows + ' แถว (' + tbls + ' ตาราง) · scenario ' + scRows + ' แถว · use case ตาม scenario ' + usGroups + ' กลุ่ม · swimlane กล่อง ' + swBox + ' เส้น ' + swLine + ' lane ' + swLane + ' · flowchart กิจกรรม ' + afScen + ' scenario ' + afBox + ' กล่อง ' + afLine + ' เส้น · จอ ' + screens.length);
  }
  if (process.env.MODE === 'build-journey') {   // journey แนวขวาง (22 ต.ค. 2569): ผังครบทุก scenario · เรียงซ้าย → ขวาไม่ทับกัน · ลูกศรมีหัว · ภาพย่อเมื่อมีจอ
    const P = process.env.PREFIX || 'OH2';
    const JK = process.env.FLOW_KIND || 'userflow';   // 6 พ.ย. 2569 บำรุงรักษา: journey ต่อผัง flowchart กิจกรรมแทน userflow
    const js = page.children.filter(n => new RegExp('^' + P + ' · journey ' + JK + ' S\\d+$').test(n.name));
    if (JK === 'flowchart') for (const f of js) { if (f.children.some(n => /^ภาพย่อ|^ป้ายจอ/.test(n.name))) logs.push('⚠ journey ' + f.name + ' มีหน้าจอปน'); if (!f.children.some(n => /^กิจกรรม /.test(n.name) && n.type === 'RECTANGLE')) logs.push('⚠ journey ' + f.name + ' ไม่มีกล่องกิจกรรม'); }
    const arrows = page.children.filter(n => n.type === 'VECTOR' && n.name.indexOf(P + ' · journey S') === 0);
    const want = +(process.env.JOURNEY_N || 18), wantL = +(process.env.JOURNEY_LINKS || 23);
    if (js.length !== want) logs.push('⚠ journey มีผัง ' + js.length + ' แต่ต้องมี ' + want);
    if (arrows.length !== wantL) logs.push('⚠ journey มีลูกศรเชื่อม ' + arrows.length + ' แต่ต้องมี ' + wantL);
    for (let i = 0; i < js.length; i++) for (let k = i + 1; k < js.length; k++) { const a = js[i], b = js[k]; if (a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height) logs.push('⚠ ผัง ' + a.name + ' ทับ ' + b.name); }
    if (arrows.some(v => !v.vectorNetwork || v.vectorNetwork.vertices[v.vectorNetwork.vertices.length - 1].strokeCap !== 'ARROW_LINES')) logs.push('⚠ ลูกศร journey ไม่มีหัวลูกศร');
    const bar = page.children.find(n => n.name.indexOf(P + ' · Journey') === 0); if (!bar) logs.push('⚠ ไม่มีแถบ Journey');
    const filled = js.reduce((t, f) => t + f.children.filter(n => n.name.indexOf('ภาพย่อ ') === 0 && (n.fills || []).some(x => x.type === 'IMAGE')).length, 0);
    if (process.env.PRE_MODE && !filled && JK !== 'flowchart') logs.push('⚠ สร้างจอก่อนแล้วแต่ไม่มีภาพย่อใน journey');   // flowchart ไม่มีภาพย่อจอโดยตั้งใจ
    const order = js.slice().sort((a, b) => a.x - b.x).map(f => +f.name.split(' S').pop());
    console.log('journey: ผัง ' + js.length + ' · ลูกศร ' + arrows.length + ' · ภาพย่อ ' + filled + ' · ลำดับซ้าย→ขวา ' + order.join(' '));
  }
  else if (process.env.FLOW) {   // ผัง userflow ข้างจอ (22 ต.ค. 2569): ทุกบล็อก scenario มีผังซ้ายสุด · ป้ายรหัสจอชี้จอที่มีจริง · บล็อกไม่ทับกัน
    const P = process.env.PREFIX || 'OH2', K = process.env.FLOW_KIND || 'userflow';   // FLOW_KIND=flowchart: บำรุงรักษาวาง flowchart กิจกรรมข้างจอแทน userflow (6 พ.ย. 2569) — ไม่มีภาพย่อ/ป้ายจอ
    const bars = page.children.filter(n => new RegExp('^' + P + ' · [A-Z] S\\d+ ').test(n.name)).sort((a, b) => a.y - b.y);
    const flowsOn = page.children.filter(n => new RegExp('^' + P + ' · [A-Z] ' + K + ' S\\d+$').test(n.name));
    const names = new Set(screens.map(n => n.name.split(' · ')[0].replace(P + ' / ', '')));
    let badges = 0, shapes = 0, vecs = 0;
    for (const bar of bars) {
      const code = bar.name.split(' · ')[1].split(' ')[0];
      const f = flowsOn.find(n => n.name.indexOf(P + ' · ' + code + ' ' + K + ' S') === 0);
      if (!f) { logs.push('⚠ ผัง userflow ไม่มีในบล็อก ' + bar.name); continue; }
      if (f.y !== bar.y) logs.push('⚠ ผัง userflow ไม่ได้เริ่มที่หัวบล็อก ' + code);
      if (f.x + f.width > bar.x) logs.push('⚠ ผัง userflow ทับป้าย Device/จอ ' + code);   // เทียบกับหัวบล็อก ไม่ใช่ x 0 — ชุดที่วางเป็นคอลัมน์ทางขวา (fitOn 4 พ.ย. 2569) เริ่มที่ x อื่น
      const ss = f.children.filter(n => ['ELLIPSE', 'RECTANGLE', 'POLYGON'].includes(n.type)), vs = f.children.filter(n => n.type === 'VECTOR');
      shapes += ss.length; vecs += vs.length;
      if (!ss.length || !vs.length) logs.push('⚠ ผัง userflow ' + code + ' ไม่มีกล่องหรือเส้น');
      if (vs.some(v => !v.vectorNetwork || !v.vectorNetwork.vertices.length || v.vectorNetwork.vertices[v.vectorNetwork.vertices.length - 1].strokeCap !== 'ARROW_LINES')) logs.push('⚠ เส้นในผัง ' + code + ' ไม่มีหัวลูกศร');
      if (ss.some(n => n.x < 0 || n.y < 0 || n.x + n.width > f.width || n.y + n.height > f.height)) logs.push('⚠ กล่องในผัง ' + code + ' ล้นกรอบ');
      if (K === 'flowchart' && f.children.some(n => /^ภาพย่อ|^ป้ายจอ/.test(n.name))) logs.push('⚠ flowchart ข้างจอ ' + code + ' มีหน้าจอปน (เจ้าของงานสั่งแยก)');
      const thumbs = f.children.filter(n => n.name.indexOf('ภาพย่อ ') === 0), filled = thumbs.filter(n => (n.fills || []).some(x => x.type === 'IMAGE' && x.imageHash));
      const coded = f.children.filter(n => n.name.indexOf('ป้ายจอ ') === 0).length;
      global.__thumbs = (global.__thumbs || 0) + filled.length;
      if (filled.length < Math.min(coded, thumbs.length) - 3) logs.push('⚠ ภาพย่อจอในผัง ' + code + ' ใส่ได้แค่ ' + filled.length + '/' + thumbs.length);
      for (const b of f.children.filter(n => n.name.indexOf('ป้ายจอ ') === 0)) for (const c of b.name.slice(7).split(' ')) {
        badges++;
        if (c.split('.')[0] !== code) logs.push('⚠ ป้ายจอ ' + c + ' อยู่ผิดบล็อก ' + code);
        else if (!names.has(c)) logs.push('⚠ ป้ายจอ ' + c + ' ไม่มีจอจริง');
      }
    }
    for (let i = 1; i < bars.length; i++) {   // บล็อกถัดไปต้องเริ่มใต้ผังและแถวจอของบล็อกก่อน
      const prevCode = bars[i - 1].name.split(' · ')[1].split(' ')[0], f = flowsOn.find(n => n.name.indexOf(P + ' · ' + prevCode + ' ' + K + ' S') === 0);
      if (f && bars[i].y < f.y + f.height) logs.push('⚠ บล็อก ' + bars[i].name.split(' · ')[1].split(' ')[0] + ' ทับผังของบล็อก ' + prevCode);
    }
    if (flowsOn.length !== bars.length) logs.push('⚠ ผัง userflow ' + flowsOn.length + ' ผัง แต่มี ' + bars.length + ' บล็อก');
    console.log('ผัง ' + K + ' ข้างจอ: ' + flowsOn.length + '/' + bars.length + ' บล็อก · กล่อง ' + shapes + ' · เส้น ' + vecs + ' · ภาพย่อ ' + (global.__thumbs || 0) + ' · ป้ายรหัสจอ ' + badges + (logs.slice(printed).some(l => /ผัง|ป้ายจอ|บล็อก/.test(l)) ? '' : ' ✓'));
  }
  if (process.env.DUMP_TEXT) {   // DUMP_TEXT=regex ชื่อจอ → พิมพ์ข้อความทุกชั้น (รวมที่ซ่อน) ตามลำดับ layer — ใช้เทียบกับข้อความที่ก๊อปจาก Figma (21 ต.ค. 2569)
    const re = new RegExp(process.env.DUMP_TEXT);
    for (const sc of page.children.filter(n => (n.type === 'FRAME' || n.type === 'INSTANCE') && re.test(n.name))) {   // INSTANCE = แถบ Header ของ Design Annotations (10 พ.ย. 2569)
      const lines = [];
      const walk = (n, hid) => { const h = hid || n.visible === false; if (n.type === 'TEXT') lines.push((h ? '~' : '') + n.characters);
        if (process.env.DUMP_PROPS && n.type === 'INSTANCE') for (const [k, p] of Object.entries(n.componentProperties || {})) if (p.type === 'TEXT') lines.push((h ? '~' : '') + '@' + k.split('#')[0] + '=' + p.value);   // DUMP_PROPS=1 = ข้อความที่ตั้งผ่าน property ของ instance (เช่น Label/Text ของ _Content item base) (5 พ.ย. 2569)
        (n.children || []).forEach(c => walk(c, h)); };
      walk(sc, false);
      fs[process.env.DUMP_TEXT_APPEND ? 'appendFileSync' : 'writeFileSync'](process.env.DUMP_TEXT_OUT || '/tmp/dump-text.txt', '## ' + sc.name + '\n' + lines.join('\n') + '\n');   // DUMP_TEXT_APPEND=1 = ต่อท้ายทุกจอที่ตรง (5 พ.ย. 2569)
      console.log('DUMP_TEXT: ' + sc.name + ' → ' + lines.length + ' ข้อความ (ขึ้นต้น ~ = ซ่อน)');
    }
  }
  if (process.env.DUMP_BTN) {   // DUMP_BTN=regex ข้อความปุ่ม → พิมพ์ว่าจอไหนมีปุ่มนั้นที่มองเห็นจริง (ไม่นับปุ่มที่ซ่อน)
    const re = new RegExp(process.env.DUMP_BTN), shown = (n, stop) => { for (let q = n; q && q !== stop; q = q.parent) if (q.visible === false) return false; return true; };
    const val = (n) => { const cp = n.componentProperties || {}, x = Object.keys(cp).find(y => y.split('#')[0].trim() === 'Text'); return x ? cp[x].value : ''; };
    for (const sc of screens) { const hit = sc.findAll(n => n.type === 'INSTANCE' && /button$/i.test(n.name) && re.test(String(val(n))) && shown(n, sc)); console.log('DUMP_BTN: ' + sc.name.slice(0, 62) + ' → ' + hit.length); }
  }
  if (process.env.DUMP_TABLE) {   // DUMP_TABLE=regex ชื่อจอ → พิมพ์ตารางทุกตัวในจอ: component/ประกอบเอง · หัวคอลัมน์ · ช่องแถวแรก (Style · Text · Supporting text) · กว้าง — ตรวจ R25 (21 ต.ค. 2569 ค่ำ)
    const re = new RegExp(process.env.DUMP_TABLE), pv = (n, k) => { const cp = n.componentProperties || {}; const x = Object.keys(cp).find(y => y.split('#')[0].trim() === k); return x ? cp[x].value : undefined; };
    for (const sc of page.children.filter(n => (n.type === 'FRAME' || n.type === 'INSTANCE') && re.test(n.name))) {   // INSTANCE = แถบ Header ของ Design Annotations (10 พ.ย. 2569)
      for (const t of sc.findAll(n => n.name === 'Table' && (n.type === 'INSTANCE' || (n.children || []).some(c => c.name === 'Column')))) {
        const cols = t.findAll(n => n.name === 'Column' && n.visible !== false);
        console.log('DUMP_TABLE: ' + sc.name + ' → ' + (t.type === 'INSTANCE' ? 'component Table' : 'ประกอบเอง') + ' · ' + cols.length + ' คอลัมน์' + (t.type === 'INSTANCE' ? ' · Scrollbar=' + pv(t, 'Scrollbar') + (t.clipsContent ? ' · clip' : '') : ''));
        cols.forEach(c => { const [h, c1] = c.children; const st = (c1 && c1.variantProperties || {}).Style;
          console.log('   ' + Math.round(c.width) + 'px  หัว "' + (pv(h, 'Text') || '') + '"' + (pv(h, 'Sort icon') ? ' ↕' : '') + '  แถว1 ' + st + ' "' + (pv(c1, 'Text') || '') + '"' + (pv(c1, 'Supporting') ? ' / "' + (pv(c1, 'Supporting text') || '') + '"' : '')); });
      }
    }
  }
  if (process.env.DUMP_LAYOUT) fs.writeFileSync(process.env.DUMP_LAYOUT, JSON.stringify(page.children.map(n => ({ name: n.name, type: n.type, x: n.x, y: n.y, w: n.width, h: n.height }))));
  logs.slice(printed).filter(l => /^⚠/.test(l)).forEach(l => console.log(l));
  const bad = logs.filter(l => /^⚠|^✗/.test(l));
  const want = (code0.match(/^  \[\'(?:หน้ารายการแผน|S\d+)/gm) || []).length;   // จำนวน section ที่ประกาศ
  console.log('โหลดทุกหน้า (loadAllPagesAsync) ' + LOAD_ALL.n + ' ครั้ง');
  console.log('\n— ผลทดสอบ — แถว ' + sections.length + ' · หน้าจอ ' + screens.length + ' · คำเตือน ' + bad.length);
  process.exitCode = MODE_CHECK || (screens.length > 0 && !bad.length) ? 0 : 1;
})().catch(e => { console.error(e); process.exit(1); });
