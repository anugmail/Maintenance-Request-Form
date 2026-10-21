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
const LOCAL_FROM_MAINTAIN_D = (process.env.LOCAL || 'RepairAppointmentStep,Device Type,Component 1').split(',').map(s => s.trim()).filter(Boolean);   // LOCAL=ชื่อ,ชื่อ สำหรับปลั๊กอินอื่น (20 ต.ค. 2569) · Device Type = ป้ายข้างจอชุดใหม่ (ดัมป์ Maintain-D ต้องดึงใหม่ถึงจะมี — ไม่มีก็ถอยไป Component 1)
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
  n.swapComponent = (comp) => { if (!comp || comp.type !== 'COMPONENT') throw new Error('swapComponent ต้องได้ COMPONENT'); n._main = null; n._mainName = (comp.parent && comp.parent.type === 'COMPONENT_SET') ? comp.parent.name : comp.name; n._variant = comp.variantProperties; n.name = n._mainName; hydrate(n); };
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
  currentPage: Object.assign(root.children[0], { selection: [] }),
  showUI() {},
  ui: { postMessage: (m) => logs.push(m.text), set onmessage(f) { uiHandler = f; } },
  async loadAllPagesAsync() {},
  async loadFontAsync() {},
  async setCurrentPageAsync(p) { figma.currentPage = p; },
  createFrame() { const f = new Node({ type: 'FRAME', name: 'Frame' }); return f; },
  createText() { const t = new Node({ type: 'TEXT', name: 'Text' }); t.fontName = { family: 'Inter', style: 'Regular' }; return t; },   // ป้ายรหัส flow แบบสำรอง (20 ต.ค. 2569)
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
for (const m of (code0 + fs.readFileSync(path.join(__dirname, 'overhaul2-plugin', 'code.js'), 'utf8')).matchAll(/"([^"]+)": \["([0-9a-f]{40})", (true|false)\]/g)) BYKEY[m[2]] = m[1] === 'Sidebar' ? 'Sidebar navigation' : m[1];
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
// REF_STEPPER=1: จำลองหน้างานซ่อมที่มีเฟรม "Progress steps" 7 ขั้น (มีกรอบ มุม 12 เส้นสีแดง) ⇒ ปลั๊กอินต้องลอกกรอบนี้
if (process.env.REF_STEPPER) {
  const pg = new Node({ type: 'PAGE', name: 'Flow การซ่อม' }, root); root.children.push(pg);
  const fr = new Node({ type: 'FRAME', name: 'Progress steps', dir: 'HORIZONTAL' }, pg); pg.children.push(fr);
  fr.cornerRadius = 12; fr.strokes = [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }]; fr.strokeWeight = 2;
  const hs = SETS.get('Horizontal step item');
  for (let i = 0; i < 7; i++) { const it = makeInstance(hs.children[0]); it.parent = fr; fr.children.push(it); }
}
const MODE_CHECK = process.env.MODE === 'check';
(async () => {
  await uiHandler({ type: process.env.MODE === 'patch' ? 'build' : (process.env.MODE || 'build'), here: process.env.HERE === '1', pick: (process.env.PICK || '').split(',').filter(Boolean), devices: process.env.DEVICES || 'both' });   // PICK=7,13 DEVICES=desktop สำหรับ MODE=build-pick   // HERE=1 = ติ๊ก "วางต่อท้ายหน้าที่เปิดอยู่"
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
  const page = pages[0] || figma.currentPage;
  const PREFIX = (process.env.PREFIX || 'OH2') + ' / ';   // ปลั๊กอินอื่นตั้ง PREFIX= (เช่น MT) · FIRST= ชื่อจอแรกของ userflow (20 ต.ค. 2569)
  let screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PREFIX) === 0 && n.name.indexOf(' · ตัดแล้ว') < 0);   // จอที่ CF ตัดแล้ว (ติดป้ายไว้ ไม่ลบ) ไม่ตรวจ
  if (process.env.CHECK_ONLY) screens = screens.filter(n => new RegExp(process.env.CHECK_ONLY).test(n.name));   // ตรวจเฉพาะจอที่อัปเดต (จอเก่าที่ไม่ได้เลือกอาจยังเป็นแบบก่อน CF)
  if (global.__before && process.env.SELECT) {   // อัปเดตจอที่เลือก: จอที่ไม่ได้เลือกต้องเป็น node เดิม ตำแหน่งเดิม · จอที่เลือกต้องถูกแทนที่ที่ตำแหน่งเดิม
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
  // วงเงินอนุมัติ + WBS 3 ช่อง ต้องอยู่แถวเดียวกัน · ไม่เหลือหัวข้อ "งบโครงการตาม WBS" ที่ว่าง (19 ต.ค. 2569)
  const lbl = (n) => { const cp = n.componentProperties || {}; const k = Object.keys(cp).find(x => x.split('#')[0] === 'Label text'); return k ? cp[k].value : ''; };
  let wbs = 0;
  screens.forEach(sc => {
    const f = sc.findAll(n => n.type === 'INSTANCE' && n.name === 'Text input');
    const g = (t) => f.find(n => lbl(n) === t);
    const b = g('วงเงินอนุมัติ (บาท)'), w = ['เลข WBS', 'เลขโครงข่าย', 'เลขกิจกรรม'].map(g);
    if (!b) return; wbs++;
    const desk = sc.width > 500;   // desktop: Row > [วงเงิน, WBS > 3 ช่อง] ครึ่งต่อครึ่ง · mobile: ช่องต่อกันใน Row เดียว
    const box = desk ? w[0] && w[0].parent : b.parent;
    if (w.some(x => !x || x.parent !== box) || (desk ? (box.name !== 'WBS' || box.parent !== b.parent) : false)) { logs.push('⚠ ช่อง WBS ไม่อยู่แถวเดียวกับวงเงินอนุมัติ: ' + sc.name); return; }
    const r = desk ? b.parent.children : box.children, o = desk ? r.indexOf(box) - r.indexOf(b) - 1 : 0;
    if (desk ? (o !== 0 || box.children.map(x => x).join() !== w.join()) : (r.indexOf(w[0]) !== r.indexOf(b) + 1 || r.indexOf(w[2]) !== r.indexOf(b) + 3)) logs.push('⚠ ลำดับช่อง WBS ผิด: ' + sc.name);
    if (desk && (b.layoutGrow !== 1 || box.layoutGrow !== 1 || w.some(x => x.layoutGrow !== 1))) logs.push('⚠ วงเงิน/WBS ไม่ได้แบ่งครึ่ง: ' + sc.name);
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
    if (sc.findAll(n => n.type === 'FRAME' && n.name === 'Content item').length) logs.push('⚠ กล่องแสดงข้อมูลยังไม่ได้แต่ง: ' + sc.name);
  });
  if (process.env.SHOW) screens.filter(sc => sc.name.indexOf(process.env.SHOW) >= 0).forEach(sc => sc.findAll(n => n.type === 'INSTANCE' && n.name === 'Table').forEach(t => {
    const v = (n, k) => { const x = Object.keys(n.componentProperties || {}).find(y => y.split('#')[0] === k); return x ? n.componentProperties[x].value : ''; };
    t.findAll(n => n.name === 'Column' && n.visible !== false).forEach(c => console.log('  | ' + c.children.filter(x => x.visible !== false).map(x => (v(x, 'Style') || 'H') + ':' + (v(x, 'Text') || '')).join(' | ')));
  }));
  // กติกา component-rules.json (19 ต.ค. 2569) — ผิดกติกา = ไม่ผ่าน · ข้อยกเว้นที่รอเคาะแสดงแยก
  const rc = require('./check-component-rules').check(screens);
  rc.fails.slice(0, 40).forEach(f => { logs.push('⚠ กติกา ' + f); console.log('⚠ กติกา ' + f); }); if (rc.fails.length > 40) logs.push('⚠ กติกา … อีก ' + (rc.fails.length - 40) + ' จุด');
  console.log(rc.fails.length ? 'ผิดกติกา component ' + rc.fails.length + ' จุด' : 'ตรงกติกา component-rules.json ✓');
  rc.pending.forEach(p => console.log('  รอเคาะ: ' + p));
  console.log('ตาราง Table ' + nT + ' · Section label ในหน้า Detail ' + nL);
  if (wbs) console.log('ตรวจแถววงเงิน + WBS ' + wbs + ' จอ' + (logs.some(l => /^⚠.*WBS/.test(l)) ? '' : ' ✓'));
  // แผง Layers ของ Figma แสดงลูกตัวสุดท้ายไว้บนสุด ⇒ จอแรกของ userflow ต้องเป็นตัวสุดท้าย
  const top = screens[screens.length - 1];
  if (top && !process.env.CHECK_ONLY && top.name.indexOf(process.env.FIRST || 'หน้ารายการแผน') < 0) logs.push('⚠ แผง Layers ไม่ได้เรียงจอแรกไว้บนสุด: ' + top.name);
  // R19 แพทเทิร์นจัดวาง (เจ้าของงานสั่ง 20 ต.ค. 2569): ป้ายรหัส flow "<prefix> · …" ต้องมี · จอ mobile อยู่ใต้จอ desktop คอลัมน์เดียวกัน (x เท่ากัน · y มากกว่า)
  const labels = page.children.filter(n => n.name.indexOf((process.env.PREFIX || 'OH2') + ' · ') === 0);
  if (!labels.length && process.env.R19 !== '0') logs.push('⚠ R19 ไม่มีป้ายรหัส flow (แถบตัวอักษร/ย่อย/state · Device/Desktop/Mobile)');   // R19=0 = หน้าเก่าก่อนมีป้าย (19 ต.ค.)
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
    if (!/^TOAST \/ /.test(screens[0].name) && screens.some(n => Math.round(n.width) !== (mobs.length ? 402 : 1440))) logs.push('⚠ R19 ชุด ' + kind + ' มีจอกว้างผิดอุปกรณ์');   // เฟรม toast (R20) ไม่ใช่ขนาดจอ
  }
  console.log('R19 จัดวางแบบตาราง flow: ป้าย ' + labels.length + (split ? ' · ชุดอุปกรณ์เดียว (' + (mobs.length ? 'mobile ' + mobs.length : 'desktop ' + desks.length) + ' จอ)' : ' · คู่ desktop/mobile ' + pairs) + (logs.some(l => /R19/.test(l)) ? '' : ' ✓'));
  if (process.env.DUMP_TEXT) {   // DUMP_TEXT=regex ชื่อจอ → พิมพ์ข้อความทุกชั้น (รวมที่ซ่อน) ตามลำดับ layer — ใช้เทียบกับข้อความที่ก๊อปจาก Figma (21 ต.ค. 2569)
    const re = new RegExp(process.env.DUMP_TEXT);
    for (const sc of page.children.filter(n => n.type === 'FRAME' && re.test(n.name))) {
      const lines = [];
      const walk = (n, hid) => { const h = hid || n.visible === false; if (n.type === 'TEXT') lines.push((h ? '~' : '') + n.characters); (n.children || []).forEach(c => walk(c, h)); };
      walk(sc, false);
      fs.writeFileSync(process.env.DUMP_TEXT_OUT || '/tmp/dump-text.txt', '## ' + sc.name + '\n' + lines.join('\n') + '\n');
      console.log('DUMP_TEXT: ' + sc.name + ' → ' + lines.length + ' ข้อความ (ขึ้นต้น ~ = ซ่อน)');
    }
  }
  if (process.env.DUMP_LAYOUT) fs.writeFileSync(process.env.DUMP_LAYOUT, JSON.stringify(page.children.map(n => ({ name: n.name, type: n.type, x: n.x, y: n.y, w: n.width, h: n.height }))));
  logs.slice(printed).filter(l => /^⚠/.test(l)).forEach(l => console.log(l));
  const bad = logs.filter(l => /^⚠|^✗/.test(l));
  const want = (code0.match(/^  \[\'(?:หน้ารายการแผน|S\d+)/gm) || []).length;   // จำนวน section ที่ประกาศ
  console.log('\n— ผลทดสอบ — แถว ' + sections.length + ' · หน้าจอ ' + screens.length + ' · คำเตือน ' + bad.length);
  process.exitCode = MODE_CHECK || (screens.length > 0 && !bad.length) ? 0 : 1;
})().catch(e => { console.error(e); process.exit(1); });
