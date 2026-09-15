#!/usr/bin/env node
/* ============================================================
   รัน plugin/code.js บน mock ของ Figma Plugin API — จับบั๊กตรรกะ
   (ลำดับ override, path ที่ซ่อน, ทะเบียน component, การผูก variable)
   ก่อนต้องไปเปิด Figma desktop จริง

   สิ่งที่ mock ทำไม่ได้และต้องดูในไฟล์จริงเท่านั้น: การเรนเดอร์ฟอนต์,
   หน้าตา auto-layout, ขนาด svg จริง — เกณฑ์ตาดูอยู่ใน design doc ข้อ 6

   รัน:  node figma-export/test-plugin.js
   ============================================================ */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

/* ---------- mock node ---------- */
let idSeq = 1;
class MNode {
  constructor(type) {
    this.id = 'n' + (idSeq++);
    this.type = type;
    this.name = type;
    this.children = [];
    this.parent = null;
    this.visible = true;
    this.fills = [];
    this.strokes = [];
    this.effects = [];
    this.opacity = 1;
    this.width = 100; this.height = 100;
    this.x = 0; this.y = 0;
    this.layoutMode = 'NONE';
    this.itemSpacing = 0;
    this.counterAxisSpacing = 0;
    this.paddingTop = this.paddingRight = this.paddingBottom = this.paddingLeft = 0;
    this.primaryAxisAlignItems = 'MIN';
    this.counterAxisAlignItems = 'MIN';
    this.layoutWrap = 'NO_WRAP';
    this.layoutSizingHorizontal = 'FIXED';
    this.layoutSizingVertical = 'FIXED';
    this.rotation = 0;
    this.layoutPositioning = 'AUTO';
    this.clipsContent = true;
    this.cornerRadius = 0;
    this.topLeftRadius = this.topRightRadius = this.bottomRightRadius = this.bottomLeftRadius = 0;
    this.strokeWeight = 1;
    this.strokeAlign = 'INSIDE';
    this.strokeTopWeight = this.strokeRightWeight = this.strokeBottomWeight = this.strokeLeftWeight = 0;
    this.boundVariables = {};
    if (type === 'TEXT') {
      this.characters = '';
      this.fontName = { family: 'IBM Plex Sans Thai', style: 'Regular' };
      this.fontSize = 14;
      this.textAlignHorizontal = 'LEFT';
      this.textAlignVertical = 'TOP';
      this.textAutoResize = 'WIDTH_AND_HEIGHT';
      this.lineHeight = { value: 20, unit: 'PIXELS' };
      this.letterSpacing = { value: 0, unit: 'PIXELS' };
    }
  }
  appendChild(n) {
    if (n.parent) n.parent.children = n.parent.children.filter(c => c !== n);
    n.parent = this;
    this.children.push(n);
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this);
    this.removed = true;
  }
  resize(w, h) { this.width = w; this.height = h; }
  resizeWithoutConstraints(w, h) { this.width = w; this.height = h; }
  rescale(f) { this.width *= f; this.height *= f; }
  setBoundVariable(field, v) { this.boundVariables[field] = v ? { type: 'VARIABLE_ALIAS', id: v.id } : undefined; }
  setPluginData(k, v) { (this._plugin = this._plugin || {})[k] = v; }
  getPluginData(k) { return (this._plugin || {})[k] || ''; }
  findAllWithCriteria({ types }) { return this.findAll((n) => !types || types.includes(n.type)); }
  // mock ของ instance.setProperties — สะท้อน Color ลงชื่อ ไว้ให้เทสตรวจว่าตั้ง variant ถูกจริง
  setProperties(props) {
    this._props = Object.assign(this._props || {}, props);
    if (props.Color) this.name = /Color=\w+/.test(this.name) ? this.name.replace(/Color=\w+/, 'Color=' + props.Color) : this.name + ' Color=' + props.Color;
  }
  // ranges ของข้อความที่รวม inline element — mock เก็บไว้ให้เทสตรวจว่าอยู่ในช่วงจริง
  setRangeFontName(s, e, f) { (this.ranges = this.ranges || []).push({ s, e, f }); }
  setRangeFills(s, e, p) { (this.ranges = this.ranges || []).push({ s, e, p }); }
  findAll(fn) {
    const out = [];
    (function walk(n) {
      for (const c of n.children) { if (fn(c)) out.push(c); walk(c); }
    })(this);
    return out;
  }
  clone() {
    const c = new MNode(this.type);
    for (const k of Object.keys(this)) {
      if (k === 'children' || k === 'parent' || k === 'id') continue;
      const v = this[k];
      c[k] = (v instanceof MNode || typeof v !== 'object' || v === null) ? v : JSON.parse(JSON.stringify(v));
    }
    for (const ch of this.children) c.appendChild(ch.clone());
    return c;
  }
  createInstance() {                       // เฉพาะ COMPONENT
    const inst = this.clone();
    inst.type = 'INSTANCE';
    inst.mainComponent = this;
    return inst;
  }
  swapComponent(target) {
    this.children = [];
    for (const ch of target.children) this.appendChild(ch.clone());
    this.mainComponent = target;
  }
}

/* ---------- mock figma ---------- */
const notifications = [];
const collections = [];
const variables = [];
const NO_PAGE = process.argv.includes('--nopage');
const page1 = new MNode('PAGE'); page1.name = 'Page 1';
const root = new MNode('DOCUMENT'); root.appendChild(page1);

const figma = {
  root,
  currentPage: page1,
  showUI() {},
  notify(msg) { notifications.push(msg); },
  closePlugin() {},
  ui: { postMessage(m) { figma._last = m; }, onmessage: null },
  viewport: { scrollAndZoomIntoView() {} },
  loadAllPagesAsync: async () => {},
  setCurrentPageAsync: async (p) => { figma.currentPage = p; },
  loadFontAsync: async () => {},
  // --nopage = จำลองไฟล์ที่ชนเพดาน 3 page ของแพลนฟรี (ไฟล์ไลบรารีที่ duplicate มามี 55 หน้า)
  createPage() {
    if (NO_PAGE) throw new Error('Cannot create page: free plan limit reached');
    const p = new MNode('PAGE'); root.appendChild(p); return p;
  },
  createSection() { const s = new MNode('SECTION'); figma.currentPage.appendChild(s); return s; },
  createFrame() { const f = new MNode('FRAME'); figma.currentPage.appendChild(f); return f; },
  createText() { const t = new MNode('TEXT'); figma.currentPage.appendChild(t); return t; },
  createRectangle() { return new MNode('RECTANGLE'); },
  createEllipse() { return new MNode('ELLIPSE'); },
  createComponent() { const c = new MNode('COMPONENT'); figma.currentPage.appendChild(c); return c; },
  createNodeFromSvg(svg) {
    const f = new MNode('FRAME'); f.name = 'svg';
    const m = String(svg).match(/viewBox="0 0 (\d+) (\d+)"/);
    f.width = m ? +m[1] : 24; f.height = m ? +m[2] : 24;
    const v = new MNode('VECTOR');
    v.fills = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 1 }];
    f.appendChild(v);
    figma.currentPage.appendChild(f);
    return f;
  },
  combineAsVariants(nodes, parent) {
    const set = new MNode('COMPONENT_SET');
    parent.appendChild(set);
    nodes.forEach(n => set.appendChild(n));
    set.width = Math.max(...nodes.map(n => n.width));
    set.height = nodes.reduce((a, n) => a + n.height, 0);
    return set;
  },
  variables: {
    getLocalVariableCollectionsAsync: async () => collections.slice(),
    getLocalVariablesAsync: async () => variables.slice(),
    createVariableCollection(name) {
      const c = { id: 'c' + (idSeq++), name, modes: [{ modeId: 'm1', name: 'Mode 1' }] };
      collections.push(c);
      return c;
    },
    createVariable(name, col, resolvedType) {
      const v = {
        id: 'v' + (idSeq++), name, variableCollectionId: col.id, resolvedType,
        description: '', valuesByMode: {},
        setValueForMode(m, val) { this.valuesByMode[m] = val; },
        remove() { variables.splice(variables.indexOf(this), 1); }
      };
      variables.push(v);
      return v;
    },
    createVariableAlias(v) { return { type: 'VARIABLE_ALIAS', id: v.id }; },
    setBoundVariableForPaint(paint, field, v) {
      return Object.assign({}, paint, { boundVariables: { [field]: { type: 'VARIABLE_ALIAS', id: v.id } } });
    }
  }
};

/* ---------- จำลอง "instance จริงอยู่ในไฟล์แล้ว" — ท่อ C โคลนจากตัวนี้แทนการ import ข้ามไฟล์
   (import ต้อง Professional+ ใช้ไม่ได้บนแพลนฟรี ยืนยันแล้ว 14 ก.ย. 2569 — ดู HOWTO.md §3.5) ---------- */
const pillVariant = new MNode('COMPONENT'); pillVariant.name = 'Color=Brand';
const pillText = new MNode('TEXT'); pillText.characters = 'Badge'; pillVariant.appendChild(pillText);
page1.appendChild(pillVariant);
const pillSet = figma.combineAsVariants([pillVariant], page1);
pillSet.name = 'Pill outline';
const pillPlanted = pillVariant.createInstance();
pillPlanted.name = 'Pill outline (Color=Brand)';
page1.appendChild(pillPlanted);

/* --tpl-on-page = จำลองเคสที่ผู้ใช้ก๊อปต้นแบบมาวางบน "หน้าเดียวกับที่ปลั๊กอินสร้างของ"
   ซึ่งรันซ้ำแล้วเคยโดนล้างหายไป (เจ้าของงานเจอจริง 14 ก.ย. 2569) — ต้องรอดทั้งสองรอบ */
let userNote = null;
if (process.argv.includes('--tpl-on-page')) {
  const fPage = new MNode('PAGE'); fPage.name = 'Foundations & Components';
  root.appendChild(fPage);
  fPage.appendChild(pillSet);
  fPage.appendChild(pillPlanted);
  // ของที่ผู้ใช้ก๊อปมาวางเอง (สเปก/โน้ตจากไลบรารี) ที่ไม่เกี่ยวกับ REAL_COMPONENTS เลย
  // ปลั๊กอิน "ต้องไม่ลบ" ตามคำสั่งเจ้าของงาน 14 ก.ย. 2569 — อ่านอย่างเดียว
  userNote = new MNode('FRAME'); userNote.name = 'Badges — spec ที่ก๊อปมาจากไลบรารี';
  fPage.appendChild(userNote);
}

/* ---------- โหลด code.js แล้วยิง build ---------- */
const code = fs.readFileSync(path.join(__dirname, 'plugin', 'code.js'), 'utf8');
vm.runInNewContext(code, { figma, __html__: '', console });

// --report = เทสสเปกโฟลว์แจ้งซ่อม (spec-report.json) · --overhaul = สเปกทดสอบ 1 หน้า (spec-overhaul.json)
const OVERHAUL_TEST = process.argv.includes('--overhaul');
const specFile = process.argv.includes('--report') ? 'spec-report.json' : OVERHAUL_TEST ? 'spec-overhaul.json' : 'spec.json';
const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', specFile), 'utf8'));

/* ค่าคาดหวังจาก spec — ข้อความที่ต้องเห็นบนหน้าจอ (multiset) */
const expectTexts = [];
(function collect(n) {
  if (n.type === 'text') expectTexts.push(n.text.chars);
  else if (n.type === 'instance') { (n.overrides.texts || []).forEach(o => expectTexts.push(o.chars)); return; }
  (n.children || []).forEach(collect);
})({ children: spec.screens.map(s => s.root) });

const fail = (msg) => { console.error('✗ ' + msg); process.exitCode = 1; };
const ok = (msg) => console.log('✓ ' + msg);

(async () => {
  await figma.ui.onmessage({ type: 'build', spec });
  const res = figma._last;
  if (!res || res.type !== 'done') return fail('build ไม่จบ: ' + JSON.stringify(res));
  const r = res.result;

  r.screens === spec.screens.length
    ? ok('หน้าจอ ' + r.screens)
    : fail('หน้าจอได้ ' + r.screens + ' คาด ' + spec.screens.length);

  const wantVars = Object.values(spec.variables.collections).reduce((a, v) => a + v.length, 0);
  r.variables === wantVars ? ok('variable ' + r.variables) : fail('variable ได้ ' + r.variables + ' คาด ' + wantVars);

  const wantComps = spec.components.sets.reduce((a, s) => a + s.variants.length, 0);
  r.components === wantComps ? ok('component ' + r.components) : fail('component ได้ ' + r.components + ' คาด ' + wantComps);
  r.icons === spec.components.icons.length ? ok('ไอคอน ' + r.icons) : fail('ไอคอนได้ ' + r.icons);

  /* alias ทุกตัวต้องมีค่าเป็น VARIABLE_ALIAS จริง */
  const aliasDefs = Object.values(spec.variables.collections).flat().filter(d => d.type === 'ALIAS');
  const unset = aliasDefs.filter(d => {
    const v = variables.find(x => x.name === d.name);
    return !v || !v.valuesByMode.m1 || v.valuesByMode.m1.type !== 'VARIABLE_ALIAS';
  });
  unset.length === 0 ? ok('alias ครบ ' + aliasDefs.length) : fail('alias ไม่มีค่า: ' + unset.map(d => d.name).join(','));

  /* หา "ที่อยู่ของผลลัพธ์" ตามชื่อ — ปกติเป็น page แต่ถ้าไฟล์ชนเพดาน 3 page ของแพลนฟรี
     ปลั๊กอินจะลงใน section ชื่อเดียวกันบนหน้าปัจจุบันแทน (ดู resolvePage ใน plugin/code.js) */
  const hostOf = (name) => root.children.find(p => p.name === name)
    || (figma.currentPage.children || []).find(n => n.name === name)
    || { children: [] };

  /* ข้อความบนหน้าจอครบตัวต่อตัว (เฉพาะที่ visible) */
  const screensPage = hostOf(spec.pageName);
  const gotTexts = [];
  (function collect(n, hidden) {
    for (const c of n.children) {
      const h = hidden || !c.visible;
      if (c.type === 'TEXT' && !h) gotTexts.push(c.characters);
      collect(c, h);
    }
  })(screensPage, false);
  const sortJoin = (a) => a.slice().sort().join(' ');
  if (sortJoin(gotTexts) === sortJoin(expectTexts)) ok('ข้อความครบ ' + gotTexts.length + ' ชิ้น');
  else {
    const miss = expectTexts.filter(t => !gotTexts.includes(t)).slice(0, 5);
    const extra = gotTexts.filter(t => !expectTexts.includes(t)).slice(0, 5);
    fail('ข้อความไม่ตรง (ได้ ' + gotTexts.length + ' คาด ' + expectTexts.length + ') หาย:' + JSON.stringify(miss) + ' เกิน:' + JSON.stringify(extra));
  }

  /* fill ที่เป็นสีใน tokens ต้องถูกผูก variable */
  let bound = 0, unboundBrand = 0;
  (function scan(n) {
    for (const f of n.fills || []) {
      if (f.boundVariables && f.boundVariables.color) bound++;
      else if (f.type === 'SOLID' && Math.abs(f.color.r - 168 / 255) < 0.002 && Math.abs(f.color.b - 137 / 255) < 0.002 && f.color.g < 0.1) unboundBrand++;
    }
    n.children.forEach(scan);
  })(root);
  bound > 0 ? ok('paint ที่ผูก variable แล้ว ' + bound + ' จุด') : fail('ไม่มี paint ไหนถูกผูก variable เลย');
  unboundBrand === 0 ? ok('ไม่มีสีแบรนด์หลุดผูก') : fail('สีแบรนด์ ' + unboundBrand + ' จุดไม่ได้ผูก variable');

  /* radius ที่ตรง token ต้องถูกผูก */
  let rbound = 0;
  (function scan2(n) { if (n.boundVariables.topLeftRadius) rbound++; n.children.forEach(scan2); })(root);
  rbound > 0 ? ok('radius ผูก variable ' + rbound + ' จุด') : fail('radius ไม่ถูกผูกเลย');

  /* หน้า Foundations ครบ: icons grid + ชุด (โคลนของจริงนับเป็น instance แยกทีละ variant ไม่ใช่ 1 component-set) + specimen */
  const REAL_SETS = ['badge'];   // ต้องตรงกับ key ใน REAL_COMPONENTS ของ plugin/code.js
  const fPage = hostOf(spec.components.pageName);
  const setTopCount = spec.components.sets.reduce((sum, s) =>
    sum + ((pillPlanted && REAL_SETS.includes(s.set)) ? s.variants.length : 1), 0);
  const wantTop = 1 + setTopCount + spec.components.specimens.length;
  // โหมด --tpl-on-page วางต้นแบบไว้บนหน้านี้เอง ซึ่งปลั๊กอิน "ต้องไม่ลบ" ⇒ นับแยกออกจากของที่สร้าง
  const madeTop = fPage ? fPage.children.filter(c => c !== pillSet && c !== pillPlanted && c !== userNote).length : 0;
  madeTop === wantTop
    ? ok('หน้า Foundations มี ' + wantTop + ' ก้อน')
    : fail('หน้า Foundations มี ' + madeTop + ' คาด ' + wantTop);

  if (r.warnings.length) {
    console.log('\nคำเตือนจากปลั๊กอิน ' + r.warnings.length + ' รายการ:');
    r.warnings.slice(0, 10).forEach(w => console.log('   ' + w));
  }

  /* badge ต้องเป็น instance ที่โคลนมาจาก "Pill outline" จริงที่ปลูกไว้ในไฟล์ (ไม่ใช่ component ที่สร้างเอง) */
  if (pillPlanted) {
    const badgeInstances = [];
    (function scanBadges(n) {
      if (n.type === 'INSTANCE' && n.mainComponent === pillVariant) badgeInstances.push(n);
      n.children.forEach(scanBadges);
    })(root);
    badgeInstances.length
      ? ok('badge ใช้ Pill outline จริง (โคลนจาก instance ที่มีอยู่แล้ว) ' + badgeInstances.length + ' จุด (variant: ' + [...new Set(badgeInstances.map(b => b.name))].join(', ') + ')')
      : fail('ไม่มี badge ไหนใช้ Pill outline จริงเลย (fallback ไปสร้างเองหมด?)');
    const foundationsBadgeSet = hostOf(spec.components.pageName)
      .children.find(c => c.name === 'badge');
    foundationsBadgeSet
      ? fail('badge ยังถูกสร้างเองในหน้า Foundations ด้วย — ควรข้ามไปเมื่อใช้ของจริงได้แล้ว')
      : ok('ไม่มี badge สร้างเองซ้ำในหน้า Foundations');
  }

  /* chevron ของ stepper — ต้องหมุนและอยู่ขอบขวา ไม่ใช่แท่งตรงหน้าเลขขั้น
     (เฉพาะสเปกที่มี wizard stepper — spec-overhaul.json เป็นหน้าตาราง ไม่มี .wstep เลย ข้ามส่วนนี้) */
  const fPage2 = hostOf(spec.components.pageName);
  let chev = [];
  (function findChev(n) {
    if (/::(before|after)$/.test(n.name || '') && /wstep/.test(n.name || '')) chev.push(n);
    n.children.forEach(findChev);
  })(fPage2);

  /* สเปกไหนไม่มี .wstep เลย = ไม่ใช่วิซาร์ดเต็มหน้า (หน้าตาราง หรือโฟลว์ที่ย้ายไปเป็น modal
     ตั้งแต่ 1 ก.ย. 2569) — ข้ามได้ ตัดสินจากตัวสเปกเอง ไม่ใช่จากแฟล็กที่ส่งมา */
  const specHasWstep = JSON.stringify(spec.screens || []).includes('wstep');
  if (!chev.length && !specHasWstep) ok('ข้าม chevron check (สเปกนี้ไม่มี .wstep — ไม่ใช่วิซาร์ดเต็มหน้า)');
  else if (!chev.length) fail('ไม่เจอ node chevron ของ .wstep เลย');
  else {
    const rotated = chev.filter(c => Math.abs(c.rotation) > 1);
    rotated.length === chev.length
      ? ok('chevron หมุนครบ ' + chev.length + ' เส้น (' + chev.map(c => Math.round(c.rotation)).join(',') + '°)')
      : fail('chevron ไม่หมุน ' + (chev.length - rotated.length) + ' เส้นจาก ' + chev.length);

    const abs = chev.filter(c => c.layoutPositioning === 'ABSOLUTE');
    abs.length === chev.length
      ? ok('chevron วางแบบ ABSOLUTE ครบ ' + chev.length + ' เส้น')
      : fail('chevron ยังอยู่ใน flow ของ auto-layout ' + (chev.length - abs.length) + ' เส้น');

    // ต้องอยู่ครึ่งขวาของขั้น ไม่ใช่มุมซ้ายบน
    const left = chev.filter(c => c.x < (c.parent ? c.parent.width : 256) / 2);
    left.length === 0
      ? ok('chevron อยู่ครึ่งขวาทุกเส้น')
      : fail('chevron ยังอยู่ครึ่งซ้าย ' + left.length + ' เส้น (x=' + left.map(c => Math.round(c.x)).join(',') + ')');
  }

  /* รันซ้ำ — variable ต้องไม่งอกเพิ่ม และผลต้องเท่าเดิม */
  const varCount1 = variables.length;
  await figma.ui.onmessage({ type: 'build', spec });
  const res2 = figma._last;
  res2.type === 'done' ? ok('รันซ้ำผ่าน') : fail('รันซ้ำพัง: ' + JSON.stringify(res2));
  variables.length === varCount1 ? ok('รันซ้ำ variable ไม่งอก (' + variables.length + ')') : fail('รันซ้ำ variable งอกเป็น ' + variables.length);

  /* ต้นแบบที่ผู้ใช้ก๊อปมาวางต้องไม่ถูกล้างทิ้งตอนรันซ้ำ — ไม่งั้นรอบถัดไปหาไม่เจอ ตกไปสร้างเอง */
  const alive = (n) => { while (n) { if (n.type === 'DOCUMENT') return true; n = n.parent; } return false; };
  (!pillSet.removed && alive(pillSet))
    ? ok('ต้นแบบ "Pill outline" ยังอยู่หลังรันซ้ำ')
    : fail('ต้นแบบ "Pill outline" โดนล้างทิ้งตอนรันซ้ำ — รอบหน้าจะหาไม่เจอแล้วตกไปสร้างเอง');

  /* ของที่ผู้ใช้วางเองบนหน้าเดียวกัน (ไม่เกี่ยวกับ component ที่ปลั๊กอินใช้) ก็ต้องไม่โดนลบ
     — "ต้องไม่ไปยุ่งกับ Foundations & Components ไปอ่านเฉยๆ" (เจ้าของงาน 14 ก.ย. 2569) */
  if (userNote) {
    (!userNote.removed && alive(userNote))
      ? ok('ของที่ผู้ใช้วางเองไม่โดนลบ')
      : fail('ปลั๊กอินลบของที่ผู้ใช้วางเองใน Foundations & Components');
  }

  console.log(process.exitCode ? '\nมีข้อผิดพลาด' : '\nผ่านทุกข้อ');
})();
