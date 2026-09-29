#!/usr/bin/env node
/* ============================================================
   รัน figjam-plugin/code.js บน mock ของ FigJam Plugin API
   ตรวจ: จำนวน section/รูป/ป้าย/ลูกศรตรง board.json จริง ·
   ลูกศรเฉพาะ section ที่ connect=sequence · รันซ้ำไม่ซ้อน (ล้างของเดิม)
   · MEDIA เร่ร่อน (รูปอัปโหลดค้าง) ถูกเก็บกวาด

   รัน:  node figma-export/test-figjam-plugin.js   (ต้องมี out/board.json)
   ============================================================ */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let idSeq = 1;

/* จำลองกติกาฟอนต์ของ Figma: จะเขียนอะไรลง text sublayer (รวมถึงเปลี่ยน fontName)
   ต้องโหลด "ฟอนต์ปัจจุบัน" ของมันก่อน — text ใน shape/connector เกิดมาเป็น Inter Medium
   (บั๊กที่เจอจริงตอนรันในไฟล์: in set_fontName: Cannot write to node with unloaded font) */
const loadedFonts = new Set();
function textSublayer() {
  const state = { characters: '', fontName: { family: 'Inter', style: 'Medium' }, fontSize: 12, fills: [] };
  return new Proxy(state, {
    set(t, k, v) {
      const cur = t.fontName.family + ' ' + t.fontName.style;
      if ((k === 'fontName' || k === 'characters') && !loadedFonts.has(cur)) {
        throw new Error('in set_' + String(k) + ': Cannot write to node with unloaded font "' + cur + '"');
      }
      t[k] = v;
      return true;
    }
  });
}

class MNode {
  constructor(type) {
    this.id = 'n' + (idSeq++);
    this.type = type;
    this.name = type;
    this.children = [];
    this.parent = null;
    this.fills = [];
    this.strokes = [];
    this.width = 100; this.height = 100;
    this.x = 0; this.y = 0;
    this.strokeWeight = 1;
    if (type === 'TEXT') { this.characters = ''; this.fontName = null; this.fontSize = 12; }
    if (type === 'SHAPE_WITH_TEXT') {
      this.shapeType = 'SQUARE';
      this.text = textSublayer();          // default Inter Medium — จำลองกติกา unloaded font
    }
    if (type === 'CONNECTOR') {
      this.connectorStart = null; this.connectorEnd = null;
      this.connectorStartStrokeCap = 'NONE'; this.connectorEndStrokeCap = 'ARROW_LINES';
      this.text = textSublayer();
    }
  }
  appendChild(n) {
    if (n.parent) n.parent.children = n.parent.children.filter(c => c !== n);
    n.parent = this;
    this.children.push(n);
  }
  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this);
    (this.children.slice()).forEach(c => c.remove());
    this.removed = true;
  }
  resize(w, h) { this.width = w; this.height = h; }
  resizeWithoutConstraints(w, h) { this.width = w; this.height = h; }
}

const page = new MNode('PAGE');
// จำลองรูปที่เคยอัปโหลดค้างไว้ 3 ใบ — ปลั๊กอินต้องเก็บกวาด
for (let i = 0; i < 3; i++) page.appendChild(new MNode('MEDIA'));

const notifications = [];
const figma = {
  currentPage: page,
  showUI() {},
  notify(m) { notifications.push(m); },
  ui: { postMessage(m) { figma._last = m; }, onmessage: null },
  viewport: { scrollAndZoomIntoView() {} },
  loadFontAsync: async (f) => {
    if (f.family === 'ไม่มีจริง') throw new Error('no font');
    loadedFonts.add(f.family + ' ' + f.style);
  },
  createSection() { const n = new MNode('SECTION'); page.appendChild(n); return n; },
  group(nodes, parent) {
    const g = new MNode('GROUP');
    parent.appendChild(g);
    nodes.forEach(n => g.appendChild(n));
    return g;
  },
  createText() { const n = new MNode('TEXT'); page.appendChild(n); return n; },
  createConnector() { const n = new MNode('CONNECTOR'); page.appendChild(n); return n; },
  createShapeWithText() { const n = new MNode('SHAPE_WITH_TEXT'); page.appendChild(n); return n; },
  createImage(bytes) {
    if (!(bytes instanceof Uint8Array) || !bytes.length) throw new Error('bytes เพี้ยน');
    return { hash: 'h' + (idSeq++) };
  }
};

const code = fs.readFileSync(path.join(__dirname, 'figjam-plugin', 'code.js'), 'utf8');
vm.runInNewContext(code, { figma, __html__: '', console });

const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', 'board.json'), 'utf8'));
const srcs = [...new Set(spec.sections.flatMap(s => (s.cols || []).flatMap(c => c.images.map(i => i.src))))];
const images = srcs.map(src => ({ src, bytes: new Uint8Array([1, 2, 3]) }));

const fail = (m) => { console.error('✗ ' + m); process.exitCode = 1; };
const ok = (m) => console.log('✓ ' + m);

(async () => {
  await figma.ui.onmessage({ type: 'build', spec, images });
  const res = figma._last;
  if (!res || res.type !== 'done') return fail('build ไม่จบ: ' + JSON.stringify(res));
  const r = res.result;

  const diagSecs = spec.sections.filter(s => s.kind === 'diagram');
  const wantShapes = spec.sections.reduce((a, s) => a + (s.cols || []).reduce((b, c) => b + c.images.length, 0), 0)
    + diagSecs.reduce((a, s) => a + s.diagram.nodes.length, 0);
  const wantConn = spec.sections.filter(s => s.connect === 'sequence')
    .reduce((a, s) => a + s.cols.length - 1, 0)
    + diagSecs.reduce((a, s) => a + s.diagram.edges.length, 0);

  r.sections === spec.sections.length ? ok('section ' + r.sections) : fail('section ได้ ' + r.sections);
  r.shapes === wantShapes ? ok('รูป ' + r.shapes) : fail('รูปได้ ' + r.shapes + ' คาด ' + wantShapes);
  r.connectors === wantConn ? ok('ลูกศร ' + r.connectors) : fail('ลูกศรได้ ' + r.connectors + ' คาด ' + wantConn);

  page.children.filter(n => n.type === 'MEDIA').length === 0
    ? ok('MEDIA เร่ร่อนถูกเก็บกวาด') : fail('MEDIA ค้าง');

  // ป้ายชื่อครบทุกคอลัมน์ และอยู่ใน section
  // ชื่อเลนถูกรวมเข้า group แล้ว (15 ก.ย. 2569) ⇒ ต้องไล่ลูกลึกลงไป ไม่ใช่แค่ชั้นเดียว
  const deep = (n, out = []) => { (n.children || []).forEach(c => { out.push(c); deep(c, out); }); return out; };
  const labels = [];
  page.children.filter(n => n.type === 'SECTION').forEach(s =>
    labels.push(...deep(s).filter(c => c.type === 'TEXT')));
  // ป้าย = ป้ายคอลัมน์ของ section รูป + ชื่อเลน + หัวคอลัมน์ช่วงงาน (phases — เพิ่ม 15 ก.ย. 2569)
  const wantLabels = spec.sections.reduce((a, s) => a + (s.cols || []).length, 0)
    + diagSecs.reduce((a, s) => a + s.diagram.clusters.length + (s.diagram.phases || []).length, 0);
  labels.length === wantLabels ? ok('ป้ายชื่อ ' + labels.length) : fail('ป้ายได้ ' + labels.length + ' คาด ' + wantLabels);

  // node ผังทุกตัวต้องมีข้อความ + ชนิดถูกตั้ง (ไม่ค้าง SQUARE หมด)
  if (diagSecs.length) {
    const diagShapes = [];
    page.children.filter(n => n.type === 'SECTION' && diagSecs.some(s => s.name === n.name))
      .forEach(s => diagShapes.push(...deep(s).filter(c => c.type === 'SHAPE_WITH_TEXT' && !c.name.startsWith('lane /'))));
    const noText = diagShapes.filter(sh => !sh.text.characters);
    noText.length === 0 ? ok('node ผังมีข้อความครบ ' + diagShapes.length) : fail('node ผังไม่มีข้อความ ' + noText.length);
    /* ชนิดรูปต้องตรงกับที่สเปกสั่ง — ไม่ใช่ "ต้องมีหลายชนิด"
       (เกณฑ์เดิม >= 3 ชนิด ตั้งไว้ตอนมีแต่ผัง mermaid ที่มี decision diamond
        พอมี swimlane ที่ใช้แค่ process + circle/stadium เทสก็ตกทั้งที่ถูกต้อง — เจอ 15 ก.ย. 2569) */
    const SHAPE_OF = { process: 'ROUNDED_RECTANGLE', decision: 'DIAMOND', stadium: 'ELLIPSE',
                       subroutine: 'SQUARE', circle: 'ELLIPSE' };
    const wantKinds = new Set(diagSecs.flatMap(s => s.diagram.nodes.map(n => SHAPE_OF[n.kind] || 'ROUNDED_RECTANGLE')));
    const gotKinds = new Set(diagShapes.map(sh => sh.shapeType));
    const missing = [...wantKinds].filter(k => !gotKinds.has(k));
    const extra = [...gotKinds].filter(k => !wantKinds.has(k));
    (!missing.length && !extra.length)
      ? ok('ชนิดรูปผังตรงสเปก (' + [...gotKinds].join(',') + ')')
      : fail('ชนิดรูปผังไม่ตรงสเปก — ขาด: ' + (missing.join(',') || '-') + ' · เกิน: ' + (extra.join(',') || '-'));
  }

  // section ต้องครอบลูกทุกตัว (spot check ทุก section)
  let overflow = 0;
  page.children.filter(n => n.type === 'SECTION').forEach(s => {
    s.children.forEach(c => {
      if (c.x + c.width > s.width + 0.1 || c.y + c.height > s.height + 0.1) overflow++;
    });
  });
  overflow === 0 ? ok('section ครอบลูกครบ') : fail('ลูกล้น section ' + overflow + ' ชิ้น');

  // ลูกศรผูกกับรูปแรกของคอลัมน์ที่ติดกันจริง
  const conns = page.children.filter(n => n.type === 'CONNECTOR' && n.name === 'flow →');
  const bad = conns.filter(c => !c.connectorStart || !c.connectorEnd ||
    c.connectorEndStrokeCap !== 'ARROW_LINES');
  bad.length === 0 ? ok('ลูกศรผูกปลายครบ') : fail('ลูกศรผูกไม่ครบ ' + bad.length);

  // รันซ้ำ — จำนวนบน canvas ต้องเท่าเดิม (ล้างของเก่าก่อนสร้างใหม่)
  const count1 = page.children.length;
  await figma.ui.onmessage({ type: 'build', spec, images });
  const res2 = figma._last;
  res2.type === 'done' ? ok('รันซ้ำผ่าน') : fail('รันซ้ำพัง');
  page.children.length === count1
    ? ok('รันซ้ำไม่ซ้อน (top-level ' + count1 + ' ชิ้น)')
    : fail('รันซ้ำงอกจาก ' + count1 + ' เป็น ' + page.children.length);

  console.log(process.exitCode ? '\nมีข้อผิดพลาด' : '\nผ่านทุกข้อ');
})();
