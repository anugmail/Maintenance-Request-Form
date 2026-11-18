/* ⚠ ไฟล์นี้ประกอบอัตโนมัติด้วย maintainance-feature-plugin/build.js — แก้ที่ feature.js (หรือต้นทาง core.js / screens.js) แล้วรันใหม่ (2026-11-18T06:28) */
/* ======================== บอร์ดปลายทาง FigJam (ผู้ใช้สั่ง 17 พ.ย. 2569 "ให้เลือกได้ว่าจะส่ง ui ไป figjam อันไหน") ========================
   ปลั๊กอินตัวเดียวใช้ได้ทั้งไฟล์ Figma (สร้างจอ + ส่งจอ) และไฟล์ FigJam (วางลงบอร์ด) · รายการบอร์ดเก็บใน clientStorage
   (ของปลั๊กอินต่อผู้ใช้ ใช้ร่วมกันทุกไฟล์) ⇒ เลือกบอร์ดในฝั่ง Figma แล้วฝั่ง FigJam รู้ว่าปลายทางคือบอร์ดไหน
   ปลั๊กอินเขียนลงไฟล์อื่นไม่ได้ (ข้อจำกัดของ Figma) ⇒ ยังต้องเปิดบอร์ดปลายทางแล้วกดวางเอง 1 ครั้ง */
const FJ_EDITOR = figma.editorType ? figma.editorType === 'figjam' : typeof figma.createSticky === 'function';   // mock ของเทสไม่มี editorType ⇒ ดูจาก API เฉพาะ FigJam
const TGT_KEY = 'mf-figjam-targets';
const tgtMem = { v: null };
async function tgtLoad() {
  try { if (figma.clientStorage) { const v = await figma.clientStorage.getAsync(TGT_KEY); if (v && Array.isArray(v.list)) return v; } } catch (e) { /* ไม่มี clientStorage (เทส) ⇒ ใช้หน่วยความจำ */ }
  return tgtMem.v || { list: [], sel: -1 };
}
async function tgtSave(v) {
  tgtMem.v = v;
  try { if (figma.clientStorage) await figma.clientStorage.setAsync(TGT_KEY, v); } catch (e) { /* ดูข้างบน */ }
}
async function tgtPost() { const v = await tgtLoad(); figma.ui.postMessage({ type: 'fj-targets', list: v.list, sel: v.sel }); return v; }
async function tgtCurrent() { const v = await tgtLoad(); return v.list[v.sel] || null; }
function tgtFromUrl(url) {
  const m = String(url).match(/figma\.com\/board\/([A-Za-z0-9]+)(?:\/([^?#\s]+))?/);
  if (!m) return null;
  let name = m[2] ? m[2] : '';
  try { name = decodeURIComponent(name); } catch (e) { /* ชื่อเพี้ยนใช้ตามเดิม */ }
  return { name: name ? name.replace(/-/g, ' ') : 'บอร์ด ' + m[1], key: m[1], url: 'https://www.figma.com/board/' + m[1] + (m[2] ? '/' + m[2] : '') };
}
async function tgtHandle(msg) {   // คืน true เมื่อเป็นคำสั่งเรื่องบอร์ดปลายทาง
  const v = await tgtLoad();
  const upsert = (t) => { let i = v.list.findIndex(x => (t.key && x.key === t.key) || x.name === t.name); if (i < 0) { v.list.push(t); i = v.list.length - 1; } else v.list[i] = Object.assign({}, v.list[i], t, { url: t.url || v.list[i].url, key: t.key || v.list[i].key }); v.sel = i; };
  if (msg.type === 'fj-target-add') { const t = tgtFromUrl(msg.url); if (!t) { figma.ui.postMessage({ type: 'log', text: 'ลิงก์ไม่ใช่บอร์ด FigJam' }); return true; } upsert(t); }
  else if (msg.type === 'fj-target-select') { if (v.list[msg.index]) v.sel = msg.index; }
  else if (msg.type === 'fj-target-del') { v.list.splice(msg.index, 1); v.sel = v.list.length ? Math.min(v.sel, v.list.length - 1) : -1; }
  else if (msg.type === 'fj-target-here') {   // ฝั่ง FigJam: ตั้งบอร์ดที่เปิดอยู่เป็นปลายทาง (fileKey อ่านได้เฉพาะบางแบบของปลั๊กอิน ⇒ ไม่มีก็จำแค่ชื่อ)
    let key = '', name = ''; try { key = figma.fileKey || ''; } catch (e) { /* อ่านไม่ได้ */ } try { name = figma.root.name || ''; } catch (e) { /* อ่านไม่ได้ */ }
    upsert({ name: name || 'บอร์ดนี้', key, url: key ? 'https://www.figma.com/board/' + key : '' });
  }
  else if (msg.type === 'open-url') { try { figma.openExternal(msg.url); } catch (e) { figma.ui.postMessage({ type: 'log', text: 'เปิดลิงก์ไม่ได้ — ' + (e && e.message || e) + ' · คัดลอกลิงก์ไปเปิดเอง: ' + msg.url }); } return true; }
  else return false;
  await tgtSave(v); await tgtPost(); return true;
}

if (FJ_EDITOR) (function () {   // ไฟล์ FigJam: วางลงบอร์ด
figma.showUI(__html__, { width: 360, height: 600, themeColors: true });

/* ======================== figjam-plugin/code.js (ลอกตอนประกอบ) ======================== */
/* ============================================================
   Maintain-D → FigJam board · ฝั่ง sandbox
   ------------------------------------------------------------
   รับ board.json + รูป (bytes) จาก ui.html แล้วสร้าง:
     section ต่อหมวด → ในหมวดเรียงคอลัมน์ (ป้ายชื่อ + รูปซ้อนแนวตั้ง
     สำหรับหน้าที่ถูกสไลซ์) → หมวดที่เป็นโฟลว์มีลูกศรเชื่อมตามลำดับ

   รูปใน FigJam = ShapeWithText (SQUARE) เติม IMAGE fill — FigJam
   ไม่มี rectangle/frame ให้ใช้ ส่วน text ของ shape ปล่อยว่างไว้
   (ไม่แตะ = ไม่ต้องโหลดฟอนต์ให้มัน)

   section ชนิด doc (20 ต.ค. 2569 — AC รายหน้า จาก 9-ac-board.js): บล็อกเรียงลง
   heading/text = TextNode · table = TableNode ของ FigJam (figma.createTable
   เซลล์แก้ทีละช่องบนบอร์ดได้) — ใช้ลงไฟล์เดียวกับบอร์ด userflow ด้วย anchor below

   รันซ้ำ = ล้างของเดิมก่อน: section ชื่อตรงกับ spec · MEDIA เร่ร่อน
   ระดับบนสุด (รูปที่เคยอัปโหลดค้างไว้) · ลูกศร/รูปที่ปลั๊กอินนี้สร้าง
   ============================================================ */



/* ตัวบอกว่ากำลังทำขั้นไหน — ใช้ตอน error เพื่อชี้ตำแหน่งที่พังในไฟล์จริง */
const STEP = { now: '' };
const step = (t) => { STEP.now = t; };

const ARROW = { r: 0xF8 / 255, g: 0x49 / 255, b: 0xC1 / 255 }; // ชมพู palette ของ FigJam

function post(text, cls) {
  figma.ui.postMessage({ type: 'log', text, cls });
}

/* ตรวจก่อนลงมือ: ปลั๊กอินนี้ใช้ API เฉพาะของ FigJam
   ถ้าเปิดในไฟล์ Figma Design จะไม่มีฟังก์ชันพวกนี้ แล้วไปตายกลางทางเป็น "not a function"
   ซึ่งอ่านไม่ออกว่าเกิดอะไรขึ้น (เจ้าของงานเจอ 15 ก.ย. 2569 — เสียเวลาไล่หาอยู่นาน)
   ⇒ ฟ้องตั้งแต่ต้นว่าเปิดผิดชนิดไฟล์ */
function assertFigJam() {
  const need = ['createShapeWithText', 'createConnector', 'createSection'];
  const missing = need.filter((fn) => typeof figma[fn] !== 'function');
  if (!missing.length) return;
  const kind = (figma.editorType || 'ไม่ทราบชนิด');
  throw new Error(
    'ไฟล์ที่เปิดอยู่ไม่ใช่ FigJam (editorType = "' + kind + '") — ปลั๊กอินนี้ต้องรันในไฟล์ FigJam เท่านั้น · ' +
    'ฟังก์ชันที่ขาด: ' + missing.join(', ') + ' · ' +
    'วิธีแก้: เปิดไฟล์ FigJam (ไฟล์บอร์ด) แล้วรันใหม่ — ถ้าอยากได้ผังในไฟล์ Figma design ต้องใช้ปลั๊กอิน "Maintain-D → Figma" แทน'
  );
}

async function build(spec, images) {
  assertFigJam();
  const warnings = [];
  const byteMap = new Map(images.map(i => [i.src, i.bytes]));

  // ---- ล้างของเดิม ----
  const names = new Set(spec.sections.map(s => s.name));
  /* เก็บกวาด MEDIA ระดับบนสุดเฉพาะตอนที่ spec มี section รูปเท่านั้น
     — บอร์ดของคนอื่น (เช่น Planning 1-2) มีรูปที่คนวางไว้เองเป็น MEDIA ระดับบนสุด
     ถ้าล้างทุกครั้ง แค่รันผังล้วนก็ลบรูปของเขาทิ้ง (เจอ 5 ต.ค. 2569 ก่อนรันจริง) */
  const hasImages = spec.sections.some(s => Array.isArray(s.cols));
  let cleaned = 0;
  if (spec.anchor === 'below') {
    /* โหมดวางต่อใต้ของเดิม = หน้านี้มีงานคนอื่นอยู่ (19 ต.ค. 2569 — ชุด Overhaul v2 ลงหน้าที่มีข้อมูลแล้ว)
       ⇒ ลบเฉพาะของชุดนี้เอง: section ชื่อเดียวกับใน spec + ลูกศรที่ปลายข้างใดข้างหนึ่งต่อกับของใน section นั้น
       ไม่แตะ MEDIA · ลูกศร flow อื่น · shape ระดับบนสุดของคนอื่น */
    const mine = figma.currentPage.children.filter(n => n.type === 'SECTION' && names.has(n.name));
    const ids = new Set();
    mine.forEach(sec => { ids.add(sec.id); (sec.findAll ? sec.findAll(() => true) : []).forEach(k => ids.add(k.id)); });
    const touches = (c) => [c.connectorStart, c.connectorEnd].some(e => e && e.endpointNodeId && ids.has(e.endpointNodeId));
    for (const n of figma.currentPage.children.slice()) {
      if ((n.type === 'CONNECTOR' && n.name === 'flow →' && touches(n)) || mine.indexOf(n) >= 0) { n.remove(); cleaned++; }
    }
  } else for (const n of figma.currentPage.children.slice()) {
    if ((n.type === 'SECTION' && names.has(n.name)) ||
        (hasImages && n.type === 'MEDIA') ||
        (n.type === 'CONNECTOR' && n.name === 'flow →') ||
        (n.type === 'SHAPE_WITH_TEXT' && n.name.indexOf('shot /') === 0)) {
      n.remove();
      cleaned++;
    }
  }
  if (cleaned) post('ล้างของเดิม ' + cleaned + ' ชิ้น');

  // ---- ฟอนต์ป้ายชื่อ ----
  let font = spec.font;
  try { await figma.loadFontAsync(font); }
  catch (e) {
    warnings.push('ฟอนต์ ' + spec.font.family + ' ไม่มี → ใช้ ' + spec.fallbackFont.family);
    font = spec.fallbackFont;
    await figma.loadFontAsync(font);
  }
  // กติกา Figma: จะ "เปลี่ยน" fontName ของ text ที่มีอยู่ ต้องโหลดฟอนต์เดิมของมันก่อนด้วย
  // — text ใน ShapeWithText/Connector เกิดมาเป็น Inter ⇒ โหลดกันไว้ทั้งสองน้ำหนัก
  for (const f of [{ family: 'Inter', style: 'Medium' }, { family: 'Inter', style: 'Regular' }]) {
    try { await figma.loadFontAsync(f); } catch (e) { /* ไม่มีก็ปล่อย — เจอจริงค่อยฟ้องตอนตั้งค่า */ }
  }

  const made = { sections: 0, shapes: 0, connectors: 0, stickies: 0, tables: 0, texts: 0, warnings };
  let y = 0;
  /* anchor: 'below' — วางต่อใต้ของที่มีอยู่บนบอร์ดแล้ว ชิดซ้ายเท่าของเดิม
     ใช้ตอนเขียนลงบอร์ดที่มีงานคนอื่นอยู่ (ค่าเดิม = เริ่มที่ 0,0 ซึ่งจะทับของเขา) */
  let x0 = 0;
  if (spec.anchor === 'below') {
    const rest = figma.currentPage.children;
    if (rest.length) {
      y = Math.max(...rest.map(n => n.y + n.height)) + 400;
      x0 = Math.min(...rest.map(n => n.x));
    }
  }
  const built = [];

  for (const sec of spec.sections) {
    if (sec.kind === 'diagram') {
      y = await buildDiagram(sec, y, font, made, x0, built);
      post('✓ ' + sec.name + ' (ผัง ' + sec.diagram.nodes.length + ' node)');
      continue;
    }
    if (sec.kind === 'doc') {
      y = await buildDoc(sec, y, font, made, x0, built);
      post('✓ ' + sec.name + ' (' + sec.blocks.length + ' บล็อก)');
      continue;
    }
    step('สร้าง section "' + sec.name + '"');
    const s = figma.createSection();
    s.name = sec.name;
    s.fills = [{ type: 'SOLID', color: { r: sec.color[0] / 255, g: sec.color[1] / 255, b: sec.color[2] / 255 } }];

    /* แถว Desktop / Mobile (5 พ.ย. 2569 ตามผัง R19 ของไฟล์ Figma): sec.rows = [{ label, h }] · ภาพมี im.row · ป้ายแถวซ้ายสุด */
    const rows = sec.rows || null, ROW_GAP = 120, DEV_W = 160;
    const rowY = (r) => 176 + (rows ? rows.slice(0, r).reduce((a, q) => a + q.h + ROW_GAP, 0) : 0);
    let x = rows ? 80 + DEV_W + 80 : 80;
    let maxColH = rows ? rowY(rows.length - 1) + rows[rows.length - 1].h - 176 : 0;
    const anchors = [];

    for (const col of sec.cols) {
      step('ป้ายชื่อคอลัมน์ "' + col.label + '"');
      const label = figma.createText();
      label.fontName = font;
      label.fontSize = 36;
      label.characters = col.label;
      s.appendChild(label);
      label.x = x; label.y = 96;

      let yy = 176;
      let first = null;
      let colW = 0;
      const colShapes = [];
      for (const im of col.images) {
        const bytes = byteMap.get(im.src);
        if (!bytes) throw new Error('ไม่มี bytes ของ ' + im.src);
        step('ใส่รูป ' + im.src);
        const image = figma.createImage(bytes);
        const shape = figma.createShapeWithText();
        shape.shapeType = 'SQUARE';
        shape.name = 'shot / ' + im.src;
        s.appendChild(shape);
        shape.resize(im.w, im.h);
        shape.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
        // เส้นขอบจางไว้เสมอ — ถ้า copy บอร์ดข้ามไฟล์ imageHash จะ resolve ไม่ได้ (bytes อยู่ในคลังรูป
        // ของไฟล์ต้นทาง ไม่ตามไปด้วย) กล่องที่ไม่มีขอบจะกลายเป็นโปร่งใสสนิท มองไม่เห็นว่ามีอะไรอยู่
        // (เจ้าของงานเจอ 15 ก.ย. 2569) ⇒ มีขอบไว้อย่างน้อยเห็นว่ากล่องยังอยู่ แค่รูปไม่มา
        shape.strokes = [{ type: 'SOLID', color: { r: 0.816, g: 0.835, b: 0.867 } }];
        shape.strokeWeight = 1;
        shape.x = x; shape.y = rows ? rowY(im.row || 0) : yy;
        yy += im.h;
        colW = Math.max(colW, im.w);
        if (!first) first = shape;
        colShapes.push(shape);
        made.shapes++;
      }
      anchors.push(first);
      groupIn(s, [label].concat(colShapes), 'จอ / ' + col.label, made);
      if (!rows) maxColH = Math.max(maxColH, yy - 176);
      x += (colW || 1440) + 160;
    }

    if (rows) rows.forEach((q, r) => {
      step('ป้ายแถว ' + q.label);
      const d = figma.createShapeWithText();
      d.shapeType = 'ROUNDED_RECTANGLE';
      d.name = 'อุปกรณ์ / ' + q.label;
      s.appendChild(d);
      d.resize(DEV_W, q.h);
      d.fills = [{ type: 'SOLID', color: { r: 0x64 / 255, g: 0x74 / 255, b: 0x8B / 255 } }];
      d.text.fontName = font; d.text.fontSize = 32; d.text.characters = q.label;
      d.text.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
      d.x = 80; d.y = rowY(r);
    });

    step('ปรับขนาด section "' + sec.name + '"');
    s.resizeWithoutConstraints(x - 160 + 80, 176 + maxColH + 80);
    await addSectionTitle(s, sec.name, font);
    s.x = x0; s.y = y;
    built.push(s);
    y += s.height + 320;
    made.sections++;

    const secConns = [];
    if (sec.connect === 'sequence') {
      for (let i = 0; i < anchors.length - 1; i++) {
        if (!anchors[i] || !anchors[i + 1]) continue;
        const c = figma.createConnector();
        c.name = 'flow →';
        c.connectorStart = { endpointNodeId: anchors[i].id, magnet: 'AUTO' };
        c.connectorEnd = { endpointNodeId: anchors[i + 1].id, magnet: 'AUTO' };
        c.connectorStartStrokeCap = 'NONE';
        c.connectorEndStrokeCap = 'ARROW_LINES';
        c.strokes = [{ type: 'SOLID', color: ARROW }];
        c.strokeWeight = 3;
        secConns.push(c);
        made.connectors++;
      }
    }
    wrapScenario(s, secConns, sec.name, made);
    post('✓ ' + sec.name + ' (' + sec.cols.length + ' หน้าจอ)');
  }

  figma.viewport.scrollAndZoomIntoView(built.length ? built : figma.currentPage.children);
  return made;
}

/* หัวข้อภาษาไทยในแต่ละ section (5 พ.ย. 2569 เจ้าของงาน ภาพหัว section สระลอยเพี้ยน)
   ป้ายชื่อ section FigJam วาดด้วยฟอนต์ของโปรแกรม ปลั๊กอินเลือกไม่ได้ ⇒ ใส่ TextNode ฟอนต์ไทยตัวใหญ่ไว้บนสุดของ section
   ดันของเดิมลงตามความสูงหัวข้อ (connector ผูกปลายกับ node อยู่แล้ว เลื่อนตามเอง) · ชื่อ section คงเดิม (รันซ้ำแทนที่ได้) */
async function addSectionTitle(s, title, font) {
  const H = 120;
  for (const c of s.children) if (c.type !== 'CONNECTOR') c.y += H;
  s.resizeWithoutConstraints(s.width, s.height + H);
  const t = figma.createText();
  t.fontName = font;
  t.fontSize = 56;
  t.characters = title;
  t.name = 'หัวข้อ / ' + title;
  s.appendChild(t);
  t.x = 80; t.y = 40;
}

/* group ในแต่ละ section (5 พ.ย. 2569 เจ้าของงาน "อยากให้ group หน้าจอ ก่อน แล้วค่อย group scenario แล้วจากนั้น ก็ groupรวบ พื้นหลัง แยกไปทีละ scen ไป ตอนนี้ทุกชิ้นมันแยกออกจากกันไปหมด")
   ชั้นใน = จอ (ป้าย + ภาพ) · ชั้นนอก = ทุกอย่างของ scenario (หัวข้อ จอ ลูกศร) อยู่ใน section ของ scenario นั้นซึ่งเป็นพื้นหลัง ⇒ ลาก/เลือกทีละ scenario ได้ทั้งก้อน
   ลูกศรเดิมสร้างไว้บนหน้า (ไม่อยู่ใน section) ⇒ ย้ายเข้า section ก่อนรวบ · group ไม่ได้ (API รุ่นเก่า) = เตือน ไม่พัง */
function groupIn(s, nodes, name, made) {
  try { const g = figma.group(nodes, s); g.name = name; return g; }
  catch (e) { made.warnings.push('group "' + name + '" ไม่ได้ — ' + e.message); return null; }
}
function wrapScenario(s, conns, name, made) {
  for (const c of conns) { try { s.appendChild(c); } catch (e) { /* ลูกศรย้ายไม่ได้ ปล่อยไว้บนหน้า */ } }
  if (s.children.length > 1) groupIn(s, [...s.children], 'scenario / ' + name, made);
}

/* ---------- section ชนิดผัง (flowchart จาก Diagram/ ผ่าน 4-figjam-diagram.js) ----------
   node = ShapeWithText ชนิดตามผัง mermaid · เส้น = ConnectorNode ผูกปลายจริง
   (ลาก node แล้วเส้นตามมา — แก้ผังต่อบนบอร์ดได้เลย) · เลน = shape สีอ่อนรองพื้น */
const DIAGRAM_SHAPE = {
  process: 'ROUNDED_RECTANGLE', decision: 'DIAMOND', stadium: 'ELLIPSE',
  subroutine: 'SQUARE', circle: 'ELLIPSE',
  // ชุด Template ของบอร์ด Planning 1-2 (start/End · Action · Display · Decision)
  end: 'ELLIPSE', action: 'ELLIPSE', display: 'SQUARE'
};
const LANE_TINTS = [
  { r: 0xFF / 255, g: 0xF7 / 255, b: 0xF0 / 255 },   // ส้มอ่อน (palette FigJam)
  { r: 0xF8 / 255, g: 0xF5 / 255, b: 0xFF / 255 }    // ม่วงอ่อน
];
const INK = { r: 0x75 / 255, g: 0x75 / 255, b: 0x75 / 255 };
const WHITE = { r: 1, g: 1, b: 1 };

async function buildDiagram(sec, y, font, made, x0, built) {
  const d = sec.diagram;
  /* สไตล์ต่อ node/เส้น (ไม่ใส่ = หน้าตาเดิม): node.fill/stroke/strokeWeight/fontSize ·
     edge.color/weight/dash/ms/me/lineType · diagram.font · diagram.stickies
     — ใช้กับผังที่ต้องออกหน้าตาตาม Template ของบอร์ดปลายทาง */
  if (d.font) {
    try { await figma.loadFontAsync(d.font); font = d.font; }
    catch (e) { made.warnings.push('ฟอนต์ผัง ' + d.font.family + ' ' + d.font.style + ' ไม่มี → ใช้ ' + font.family); }
  }
  const PAD = 80;
  const s = figma.createSection();
  s.name = sec.name;
  s.fills = [{ type: 'SOLID', color: { r: sec.color[0] / 255, g: sec.color[1] / 255, b: sec.color[2] / 255 } }];

  /* เลนก่อน — จะได้อยู่ใต้ node
     **ล็อกพื้นหลังไว้** (เจ้าของงานสั่ง 15 ก.ย. 2569) — แถบเลนเป็นกล่องใหญ่กินพื้นที่ทั้งแถว
     ถ้าไม่ล็อก คลิกที่ว่างในเลนแล้วลากจะกลายเป็นลากเลนทั้งแถบแทนที่จะเลือก node
     ปลดล็อกได้เองใน Figma: คลิกขวา → Unlock (หรือ ⌘⇧L) */
  const lock = (n) => { try { n.locked = true; } catch (e) { /* node ชนิดที่ล็อกไม่ได้ — ข้าม */ } };

  d.clusters.forEach((cl, i) => {
    const lane = figma.createShapeWithText();
    lane.shapeType = 'SQUARE';
    lane.name = 'lane / ' + cl.label;
    s.appendChild(lane);
    lane.resize(cl.w, cl.h);
    lane.fills = [{ type: 'SOLID', color: LANE_TINTS[i % LANE_TINTS.length] }];
    lane.strokes = [];
    lane.x = PAD + cl.x; lane.y = PAD + cl.y;

    const lt = figma.createText();
    lt.fontName = font;
    lt.fontSize = 30;
    lt.characters = cl.label;
    s.appendChild(lt);
    lt.x = PAD + cl.x + 24; lt.y = PAD + cl.y + 14;

    /* รวมแถบเลน + ชื่อเลน เป็นก้อนเดียว แล้วล็อกทั้งก้อน
       (เจ้าของงานเลือกแบบนี้ 15 ก.ย. 2569) — ย้าย/ซ่อนทีเดียวได้ และไม่โดนลากโดยไม่ตั้งใจ
       group ไม่ได้ก็ปล่อยเป็นสองชิ้นแล้วล็อกแยก ไม่ให้ทั้งผังพังเพราะเรื่องนี้ */
    let g = null;
    try { g = figma.group([lane, lt], s); } catch (e) { g = null; }
    if (g) { g.name = 'lane / ' + cl.label; lock(g); }
    else { lock(lane); lock(lt); }
  });

  /* หัวคอลัมน์ช่วงงาน — สเปกจาก 5-swimlane.js ส่ง `phases` มาให้ แต่เดิมปลั๊กอินไม่ได้อ่าน
     ทำให้ผังบนบอร์ดไม่มีแกนนอนบอกว่าอยู่ช่วงไหน (เจอ 15 ก.ย. 2569) · ล็อกเหมือนพื้นหลัง */
  (d.phases || []).forEach((ph) => {
    const ht = figma.createText();
    ht.fontName = font;
    ht.fontSize = 28;
    ht.characters = ph.label;
    ht.name = 'phase / ' + ph.label;
    s.appendChild(ht);
    ht.x = PAD + ph.x; ht.y = PAD + ph.y;
    lock(ht);
  });

  const byId = {};
  for (const n of d.nodes) {
    const sh = figma.createShapeWithText();
    sh.shapeType = DIAGRAM_SHAPE[n.kind] || 'ROUNDED_RECTANGLE';
    sh.name = n.id + ' / ' + (n.label.split('\n')[0] || n.kind);
    s.appendChild(sh);
    sh.resize(n.w, n.h);
    sh.fills = [{ type: 'SOLID', color: n.fill || WHITE }];
    sh.strokes = [{ type: 'SOLID', color: n.stroke || INK }];
    sh.strokeWeight = n.strokeWeight || 2;
    sh.text.fontName = font;
    sh.text.characters = n.label;
    sh.text.fontSize = n.fontSize || (n.kind === 'decision' ? 26 : 24);
    sh.x = PAD + n.x; sh.y = PAD + n.y;
    byId[n.id] = sh;
    made.shapes++;
  }

  for (const st of (d.stickies || [])) {
    step('sticky "' + st.text.slice(0, 20) + '"');
    const k = figma.createSticky();
    s.appendChild(k);
    await figma.loadFontAsync(k.text.fontName);
    k.text.characters = st.text;
    if (st.color) k.fills = [{ type: 'SOLID', color: st.color }];
    k.x = PAD + st.x; k.y = PAD + st.y;
    made.stickies++;
  }

  s.resizeWithoutConstraints(d.w + PAD * 2, d.h + PAD * 2);
  await addSectionTitle(s, sec.name, font);
  s.x = x0 || 0; s.y = y;
  if (built) built.push(s);
  made.sections++;

  const secConns = [];
  for (const e of d.edges) {
    if (!byId[e.from] || !byId[e.to]) continue;
    const c = figma.createConnector();
    secConns.push(c);
    c.name = 'flow →';
    c.connectorStart = { endpointNodeId: byId[e.from].id, magnet: e.ms || 'AUTO' };
    c.connectorEnd = { endpointNodeId: byId[e.to].id, magnet: e.me || 'AUTO' };
    if (e.lineType) c.connectorLineType = e.lineType;
    c.connectorStartStrokeCap = 'NONE';
    c.connectorEndStrokeCap = 'ARROW_LINES';
    c.strokes = [{ type: 'SOLID', color: e.color || (e.style === 'thick' ? ARROW : INK) }];
    c.strokeWeight = e.weight || (e.style === 'thick' ? 4 : 2);
    if (e.style === 'dotted') c.dashPattern = e.dash || [8, 8];
    if (e.label) {
      c.text.fontName = font;
      c.text.characters = e.label;
    }
    made.connectors++;
  }
  wrapScenario(s, secConns, sec.name, made);

  return y + s.height + 320;
}

/* ---------- section ชนิดเอกสาร (AC รายหน้า — สเปกจาก 9-ac-board.js) ----------
   บล็อกเรียงลงใน section: heading = TextNode ใหญ่ · text = TextNode กว้างคงที่ สูงตามเนื้อหา ·
   table = TableNode ของ FigJam (เซลล์แก้ทีละช่องได้บนบอร์ด · แถวแรกพื้นเทาเป็นหัวตาราง)
   ความสูงจริงอ่านจาก node หลังใส่ข้อความ (ค่าในสเปกเป็นแค่ค่าประมาณกันตก) */
const HEAD_TINT = { r: 0xE9 / 255, g: 0xEA / 255, b: 0xEE / 255 };

async function buildDoc(sec, y, font, made, x0, built) {
  const PAD = sec.pad || 80, GAP = sec.gap || 40, W = sec.w || 2000;
  if (sec.blocks.some(b => b.kind === 'table') && typeof figma.createTable !== 'function') {
    throw new Error('FigJam ที่เปิดอยู่ไม่มี figma.createTable — สร้างตารางไม่ได้ · section "' + sec.name + '" · ' +
      'วิธีแก้: อัปเดต FigJam (Table ใน Plugin API) หรือสร้างสเปกแบบไม่มีตาราง');
  }
  step('สร้าง section "' + sec.name + '"');
  const s = figma.createSection();
  s.name = sec.name;
  s.fills = [{ type: 'SOLID', color: { r: sec.color[0] / 255, g: sec.color[1] / 255, b: sec.color[2] / 255 } }];
  let yy = PAD;
  let maxW = W;

  for (const b of sec.blocks) {
    if (b.kind === 'heading' || b.kind === 'text') {
      step((b.kind === 'heading' ? 'หัวข้อ "' : 'กล่องข้อความ "') + b.text.slice(0, 30) + '"');
      const t = figma.createText();
      t.fontName = font;
      t.fontSize = b.kind === 'heading' ? (b.size || 32) : (sec.fontText || 24);
      t.characters = b.text;
      t.name = (b.kind === 'heading' ? 'heading / ' : 'text / ') + b.text.split('\n')[0].slice(0, 40);
      s.appendChild(t);
      if (b.kind === 'text') {
        /* กว้างคงที่ สูงตามเนื้อหา — text ของ FigJam เกิดมาเป็นกว้างตามข้อความ (ย่อหน้ายาวจะเป็นบรรทัดเดียวยาวมาก) */
        try { t.textAutoResize = 'HEIGHT'; } catch (e) { /* รุ่นที่ไม่รองรับ — ใช้ขนาดประมาณจากสเปก */ }
        t.resize(W, Math.max(b.h || 40, 40));
      }
      t.x = PAD; t.y = yy;
      yy += Math.max(t.height || 0, b.kind === 'heading' ? Math.round(t.fontSize * 1.5) : (b.h || 40)) + GAP;
      made.texts++;
      continue;
    }
    if (b.kind === 'table') {
      const nR = b.rows.length, nC = b.colW.length;
      step('ตาราง ' + nR + ' แถว x ' + nC + ' คอลัมน์ "' + (b.rows[0] || []).join(' | ').slice(0, 40) + '"');
      const tb = figma.createTable(nR, nC);
      tb.name = 'table / ' + (b.rows[0] || []).join(' | ').slice(0, 60);
      s.appendChild(tb);
      b.colW.forEach((w, c) => { try { tb.resizeColumn(c, w); } catch (e) { /* รุ่นที่ไม่มี resizeColumn — ปล่อยกว้างเดิม */ } });
      for (let r = 0; r < nR; r++) {
        for (let c = 0; c < nC; c++) {
          const cell = tb.cellAt(r, c);
          if (!cell) continue;
          /* กติกาฟอนต์ของ Figma: จะเปลี่ยน fontName ต้องโหลดฟอนต์เดิมของเซลล์ก่อน (เซลล์เกิดมาเป็น Inter) */
          try { await figma.loadFontAsync(cell.text.fontName); } catch (e) { /* โหลดไว้แล้วตอนต้น */ }
          cell.text.fontName = font;
          cell.text.fontSize = sec.fontCell || 20;
          cell.text.characters = b.rows[r][c] || '';
          if (r === 0) { try { cell.fills = [{ type: 'SOLID', color: HEAD_TINT }]; } catch (e) { /* เซลล์รุ่นที่ใส่สีไม่ได้ */ } }
        }
      }
      tb.x = PAD; tb.y = yy;
      yy += Math.max(tb.height || 0, b.h || 0) + GAP;
      maxW = Math.max(maxW, tb.width || b.colW.reduce((a, w) => a + w, 0));
      made.tables++;
      continue;
    }
    made.warnings.push('บล็อกชนิดไม่รู้จัก "' + b.kind + '" ใน ' + sec.name);
  }

  s.resizeWithoutConstraints(maxW + PAD * 2, yy - GAP + PAD);
  await addSectionTitle(s, sec.name, font);
  s.x = x0 || 0; s.y = y;
  if (built) built.push(s);
  made.sections++;
  return y + s.height + 320;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'build') return;
  try {
    const result = await build(msg.spec, msg.images);
    figma.ui.postMessage({ type: 'done', result });
    figma.notify('บอร์ดเสร็จ: ' + result.sections + ' section · รูป ' + result.shapes +
      ' · ลูกศร ' + result.connectors + (result.tables ? ' · ตาราง ' + result.tables + ' · กล่องข้อความ ' + result.texts : ''));
  } catch (e) {
    // ส่ง stack กลับไปด้วย — ข้อความอย่างเดียว ("not a function") บอกไม่ได้ว่าพังบรรทัดไหน
    // และ mock ใน test-figjam-plugin.js จับไม่เจอเพราะมันนิยามเมธอดครบกว่า Figma จริง
    // (เจ้าของงานเจอ 15 ก.ย. 2569 — เทส mock ผ่านแต่ของจริงพัง)
    const detail = [
      String(e && e.message ? e.message : e),
      STEP.now ? 'ขั้นที่ทำอยู่: ' + STEP.now : '',
      e && e.stack ? String(e.stack).split('\n').slice(0, 4).join(' ⏎ ') : ''
    ].filter(Boolean).join(' · ');
    figma.ui.postMessage({ type: 'error', message: detail });
    figma.notify('สร้างบอร์ดไม่สำเร็จ — ดูรายละเอียดในหน้าต่างปลั๊กอิน', { error: true });
  }
};

/* ======================== maintainance-feature-plugin/figjam.js ======================== */
/* ======================== ฝั่งไฟล์ FigJam — วางจอที่ส่งมาลงบอร์ดนี้ (17 พ.ย. 2569) ========================
   ส่วนสร้างบอร์ด (build) ลอกจาก figjam-plugin/code.js ของพี่นุตอนประกอบ (build.js อ่านอย่างเดียว ไม่แก้ไฟล์เขา) · ไฟล์นี้ต่อท้าย:
   หน้าต่างแสดงบอร์ดที่เปิดอยู่เทียบกับบอร์ดปลายทาง · รายการชุดที่ส่งมา (out/board-maintainance-feature-*.json) · กดวางทีละชุดตามลำดับ */
const fjBuild = figma.ui.onmessage;   // ตัวรับ 'build' ของ figjam-plugin
figma.ui.onmessage = async (msg) => {
  if (msg && msg.type === 'build') return fjBuild(msg);
  if (msg) await tgtHandle(msg);
};
{
  let key = '', name = '';
  try { key = figma.fileKey || ''; } catch (e) { /* อ่านไม่ได้ */ }
  try { name = figma.root.name || ''; } catch (e) { /* อ่านไม่ได้ */ }
  figma.ui.postMessage({ type: 'fj-mode', file: name, key });
  tgtPost();
}

})(); else (function () {   // ไฟล์ Figma: สร้างจอ + ส่งจอ
/* ⚠ สำเนาอ่านอย่างเดียวของ figma-export/plugin-lib/core.js จาก origin/main ee11614 (13 พ.ย. 2569 17:45 · "ไฟล์ 34 หัวข้อ 6: เติมความคืบหน้าฝั่งเว็บตอนพักงาน 13 พ.ย. 2569") ลอกเมื่อ 18 พ.ย. 2569
   ฐานของปลั๊กอินพระผู้สร้าง (build.js อ่านจากที่นี่ ไม่อ่านไฟล์ของพี่นุ) · ห้ามแก้ในนี้ — ย้ายฐานรอบหน้าให้ลอกทับทั้งไฟล์แล้วแก้หัวนี้ */
/* ============================================================================
   plugin-lib/core.js — โค้ดส่วนกลางของปลั๊กอินสร้างจอจาก component จริง (แยกจาก overhaul2-plugin 20 ต.ค. 2569)
   ----------------------------------------------------------------------------
   ยกมาจาก overhaul2-plugin/code.js ฉบับ 19 ต.ค. 2569 (ตัดส่วนที่เป็นของ Overhaul: ข้อมูล · จอ · stepper · ปุ่มแก้เฉพาะจุด)
   ใช้ประกอบเป็น code.js ของปลั๊กอินแต่ละเรื่องด้วย  node figma-export/build-plugin.js <โฟลเดอร์ปลั๊กอิน>
   (Figma โหลด code.js ไฟล์เดียว ไม่มี require) · ปลั๊กอิน Overhaul ยังใช้สำเนาของตัวเองอยู่ จะย้ายมาใช้ไฟล์นี้หลัง commit รอบรีวิว 19 ต.ค.

   screens.js ของแต่ละปลั๊กอินต้องประกาศ: PLUGIN { prefix, page, menu, searchHint } · DIRECT · NESTED · LOCAL_OPTIONAL · NEEDED · NESTED_ONLY · SCENARIOS · build()
   ผัง userflow ข้างจอ (22 ต.ค. 2569): build-plugin.js ฝัง const USERFLOW จาก <ปลั๊กอิน>/build.json → buildGrid() วางผังซ้ายของแต่ละบล็อก scenario (userflowFrame)
   กติกาที่โค้ดนี้ทำให้ (component-rules.md): R1 Header Tablet · R2/R13 ไม่มี divider · R4 ปิด Info icon · R6–R7 ช่องกรอก · R8–R9 Table ทั้งก้อน (เกินขนาดค่อยประกอบ) ·
   R12 กล่องแสดงข้อมูล · R14 เฟรม 1440×1024 / 402×874 · ปุ่มท้ายซ้าย–ขวา · อัปโหลด 1 คอลัมน์ · mobile = การ์ด Mobile table / bottom sheet
   ============================================================================ */

figma.showUI(__html__, { width: 460, height: 520 });
const log = (text) => figma.ui.postMessage({ type: 'log', text });
const errors = [];
const warn = (where, e) => {   // แนบบรรทัดใน code.js ที่พัง — ข้อความอย่างเดียวบอกไม่ได้ว่าพังตรงไหน (20 ต.ค. 2569)
  const at = e && e.stack ? String(e.stack).split('\n').find(l => /code\.js|<anonymous>|at /.test(l) && !/warn/.test(l)) : '';
  const m = where + ' — ' + (e && e.message ? e.message : e) + (at ? '  [' + at.trim().slice(0, 90) + ']' : '');
  errors.push(m); log('⚠ ' + m);
};
/* ---------- หา component — 3 ทาง (19 ต.ค. 2569: ไฟล์ Maintain-D มี component ในตัวแค่บางส่วน) · รายชื่อที่ต้องใช้ (NEEDED · NESTED_ONLY · LOCAL_OPTIONAL) ประกาศใน screens.js ----------
   1) มีในไฟล์นี้เอง (local)  2) มี instance ของมันอยู่ในไฟล์แล้ว (ไลบรารี) → ใช้ main component ของ instance นั้น
   3) นำเข้าจากไลบรารี VMS Plus ด้วย key — ไฟล์ต้องเปิดใช้ไลบรารีนั้นอยู่ (Assets → Libraries)
   ทั้ง 3 ทางได้ instance ที่ผูกกับ component จริง ไม่มีการวาดเอง */
/* key ของ component ต้นฉบับในไฟล์ "component" ที่เราอ่านค่ามา (ดัมป์ 19 ต.ค. 2569 10:52 · เก็บ key ของ main component ตรงๆ) · [key, เป็น component set ไหม] */
const KEYS = {
  /* 10 พ.ย. 2569 เจ้าของงาน "ตอนออกแบบครั้งต่ออยากให้ใช้ design จาก component กลาง" = หน้า Design Annotations ของไฟล์ (UI) VMS Plus – Release#2
     แถบหัวบล็อก/ป้าย state (Header · Type=Header / Subheader) — key จากดัมป์ design-system/.figma-extract/ui-release2/1-56.json · นำเข้าไม่ได้ (ไฟล์นั้นไม่ได้เปิดเป็นไลบรารี) → หาในไฟล์/instance ตามเดิม */
  "Header": ["cbdb14c4c43c175124ce4c7bb138bb980fc2f4ae", true],
  "Mobile table": ["4ca09b73532ee1f8f21e3e0a6f2c7f151839ee62", true],
  "Mobile table item": ["754d62b4c29ea0f402f67950cfe7a4eae279e591", true],
  "Mobile progress steps": ["9154edd850c0be2201a44213fe6e94163a7a1516", true],
  "Step circles / 5 steps": ["998a4238f9644a495a163c6153656f3cad2442e2", true],
  "Bottom sheet header": ["8b8c40f9f3a569cf24b0c2207402d4cf6d2df6ff", false],
  "Bottom sheet footer": ["0f09ce0ff9507963e6129019503d00e0cf52c50d", false],
  "Modal header": ["8eebbafefb7a0db78e062e96c6cbb2feb9b5841a", true],
  "Sidebar navigation": ["44614a4b2e944d2921a8735bf39d89755dc08929", true],
  "Content divider": ["5df7bd211099b5c13967ca55809923011c1695b8", true],
  "Checkbox": ["431aec9aa85f5271ad209a8baf7c667d89394db1", true],
  "Modal header": ["8eebbafefb7a0db78e062e96c6cbb2feb9b5841a", true],
  "Featured icon": ["7924204fcda3126999753512ecb890a13a586498", true],
  "Card form row": ["838a872eb4065425e9335a11ad6377782e722d36", true],
  "Number input": ["ab8ab9ec5b4725d353971d3843b9e6325ec256ca", true],
  "Badge outline": ["8a652f68828860d38ce4b04953c826f6f2748d84", true],
  "Section label": ["a9baa20a14b45ef90e3e74cd5eef8ae17adac1c0", true],
  "Tabs": ["abbfc528e17b049b49dfa1dcc3c7bc26ab1cb76f", false],
  "Tab item": ["efb1391effff741a0bd41f92c8b8ebb5f7ae8fdc", true],
  "Progress steps": ["ad140301ab65437a50300845a46a423e4c7e3952", true],
  "Table": ["f1bf4ff71490cea64e92f210d8941eecb1d236e3", true],
  "Horizontal step item": ["c7f7e148cc3b16706d96e1c487f01c989bd6bd82", true],
  "Alert": ["2f2e06fa7d21aa4fff19dfce8881d3116c05b18e", true],
  "Progress bar": ["7896062a5845c131efe81e39c373d335102da12f", true],
  "_File upload item base": ["114c601616d02bb1afec21af83e4ece8bc9e10d6", true],
  "_File icon": ["d8c1ddb33805d573b0a431b159cd94e0e20e3fb4", true],
  "Modal footer": ["78e84b8dfd520b686df45c5219feaf5f64a4bcec", true],
  "Text area": ["7c785b9589252e678fd93790a7f7e14a5c4295ef", true],
  "Tertiary danger button": ["9bb3414bf62bfc8b4b678a17a539fbf0a8aa1660", true],
  "Section header": ["0c9fb1c08a612abd000d804a95c1c03b0a765462", true],
  "_File upload base": ["db2705beaf011d82fd9d2c9f3fd4b4209dbb7112", true],
  "File upload": ["82991026baf7e7e4063dc8b837e282678c3a252e", true],
  "_Content item base": ["a131ef189e777d69cebddfe4c9062fa42045b5ce", true],
  "Content item row": ["e8c610799a7f365e0cad447fa9b42d1fea9103dc", true],
  "List header item": ["3407ff1533898ceb3de86bd3fe73e6bc65d9b690", false],
  "List with checkbox item": ["3a4c16006b31a6a874d6a42f58798196d493e0c1", true],
  "List with checkbox": ["9a7807cf30ce63f749dd5041b49f444ea73816d8", false],
  "Date picker": ["aec5697b4e4cea8ef26f19f2803c0518c8d44498", true],
  "Secondary button": ["707d8f051bf2eb42aecb6b2b0af9ae1552b387b8", true],
  "Primary button": ["cf8aa9f0a6181051108f4dc3f32529ce3bf6520f", true],
  "Tertiary button": ["54f378df2a98f217edb5f4afdc06b8e4d17964b0", true],
  "Tertiary brand button": ["ae32e68f4168736350672eec7a8922acb0046b99", true],
  "Background overlay": ["7508216023c093b6775ecbdc8da566f002c42b35", false],
  "Input label": ["100b172084b1ad5149031c2be07b944e763d0614", false],
  "Checkbox with badge": ["56110090d18655cb65f9f66d5bb63de68ca14813", false],
  "Pill outline": ["9b2ab6144dd44edbe96c5f23607ecda2b649d353", true],
  "Text input": ["ee163422d91020d39770ea1da8b3b7029591f5c9", true],
  "Table header": ["4c2192715fe57cede2ebb34c09c440e480d326a8", true],
  "search-24-300-round": ["2686cdef98896d918405092d40c6c08ea6b6406a", false],
  "Input dropdown": ["8cacaddc8403f16136cdd9eef163fd7dc5efe835", true],
  "filter_list-24-400-round": ["5e274a00f056dc8b4802e262a414017f4725f40c", false],
  "Badge outline with remove icon": ["a285551749934eae24da851c1acf1247dd5e7c99", true],
  "Notification": ["fc959d9835c4148fa850540cf242c2167e05e9f0", true],
  "Side panel header": ["3ea502c415f48f8c0ecd06f1d68853d3ed4e7b6e", false],
  "Side panel footer": ["5c7bb5aaeee5919a801447690f4717e085eab59d", false],
  "more_horiz-20-400-round": ["eaff13f98af363da8bd768280924ecdf6713af2f", false],
  "Page header": ["69471f2ac8d0daf0fe58a85fddac8ac2d79fbd35", true],
  "Header navigation": ["7f45afc3a183edd34cdd943b3b6641ab1f71dd2b", true],
  "Nav button": ["fb0cf06df292e5bff53d7503855a3b943fb8225b", true],
  "quick_reference_all-24-300-round": ["9ed6481ba385035617f2491e6e7b5d6a58e9997c", false],
  "stylus-24-300-round": ["803aec7e2947f42a48164aa843ea6078b14cae1f", false],
  "check-24-300-round": ["8c1bd305deb686415a28e6999512f486d5b3d5b1", false],   // ไอคอนนำปุ่ม "รับทราบ" สีเขียว S13 (10 พ.ย. 2569 · แบบปุ่ม "ตรวจแล้ว" หน้า 5.14 - 5.15 UI Release#2)
  "delete-24-300-round": ["d0a4abe7a062d89630de6bd7cb8ce325d1fd8336", false],
  "Table cell": ["2c5b641cf63a8a66f18d2a702c0fddf3fe3b2b20", true],
  "Table header cell": ["d689fd327ddac63e712a5bb5a3b4f3e39fab435e", true],
  "Sort icon": ["928313a87632334f23fdab3838bfa254beea6487", true],
  "Table pagination": ["11f4baa0cf668c7223365b87083857c061746379", true],
  "Button groups pagination item": ["5e1bc247e077b6c16b789d24c6d7f00b12dad97c", true],
  "add-24-300-round": ["47c602564a20cd47b2a10f3c87a5e752321eeca4", false],
  "Dropdown list": ["e702e9f249a6bb7225014ce050e03b13a2b965ed", false],
  "Dropdown list item": ["74ddf5510c3e2082fb7324804c0f1500f532947b", true],
  "Primary danger button": ["b3e8e8e49e99d7d98f1b3865880a63c410e1566e", true],
  "Modal": ["34dca4d1ae5102bbe6181fb4524d5cf6b6e82fe1", true],
  "_Dropdown menu item": ["fbe755b4b02920368151d62c89564c2e38376b62", true],
  "Empty state/Search not found": ["32ec03005ee4bc44e7b30227d21bcfd04fa21ce6", false],
  "Empty state/Data empty": ["15a4fa89592939d4234a5e4f03760a76dc7f0a11", false],
  "Dropdown menu": ["640a71ed325bbbbd32290c9e81dfcd431fe2d6b2", false],
  "Secondary danger button": ["bb23b83c2d5b8b890f4a2990ffc4d4e4e6be25af", true],
  "keyboard_arrow_right-20-400-round": ["a01b27c1070404627f9a1e8127466603a83eb12c", false],
  "keyboard_arrow_left-20-400-round": ["32933c0651c04a63cb2aa78648cf8b15ebc7c266", false],
  "cloud_upload-24-300-round": ["bb12332b86d47144684d92bf7d358b9c2b7a4e50", false],
};
const SOFT_KEY = new Set(['Header']);   // นำเข้าด้วย key ไม่ได้ไม่ต้องเตือนเรื่องไลบรารี VMS Plus (อยู่คนละไฟล์) — ถอยไปหาในไฟล์ตามเดิม
const ALIAS = {};   // 19 ต.ค.: Sidebar navigation มี key ของไฟล์ component แล้ว ไม่ต้องอ้างชื่อ Sidebar ของ UI Release#2
const INDEX = new Map();     // ชื่อ → COMPONENT_SET / COMPONENT ที่ใช้ได้
const ROUTE = {};            // ชื่อ → ได้มาทางไหน
let IMPORT_ERR = '';
const holderOf = (c) => (c.parent && c.parent.type === 'COMPONENT_SET') ? c.parent : c;
/* ลดการโหลดทุกหน้า (10 พ.ย. 2569 เจ้าของงาน "ทำไมเวลาไฟล์เยอะๆ ถึงกินทรัพยากรของ figma เยอะ" · เลือกข้อ ก.)
   เดิมทุกครั้งที่กดสร้างจะ loadAllPagesAsync + ไล่ component ทั้งไฟล์ และถ้ามีตัวที่ไม่อยู่ในไฟล์ (เช่น Component 1) จะสแกน instance ทั้งไฟล์ทุกรอบ
   ⇒ 1) นำเข้าด้วย key ก่อน ไม่ต้องโหลดหน้าอื่น  2) ตัวที่ไม่มี key (component ยืมจากไฟล์ Maintain-D) เปิดตรงจาก id ที่จำไว้ในไฟล์ (pluginData ของ document)
   3) ยังไม่ได้ และรอบก่อนไม่ได้บันทึกว่าไม่มีในไฟล์ → โหลดทุกหน้าแล้วหาแบบเดิม  4) ตัวที่หาไม่เจอจำไว้ รอบหน้าข้าม (ไม่สแกน instance ทั้งไฟล์ซ้ำ)
   ปุ่ม "เช็ค component" (checkOnly) หาเต็มทุกครั้งแล้วเขียนที่จำไว้ใหม่ — วาง component ลงไฟล์ใหม่ให้กดปุ่มนี้ก่อน */
const COMP_CACHE = 'componentCache';
function readCompCache() { try { const c = JSON.parse(figma.root.getPluginData(COMP_CACHE) || '{}'); return { ids: c.ids || {}, absent: c.absent || [] }; } catch (e) { return { ids: {}, absent: [] }; } }
function writeCompCache(c) { try { figma.root.setPluginData(COMP_CACHE, JSON.stringify(c)); } catch (e) { /* เขียนไม่ได้ก็หาเต็มรอบหน้า */ } }
async function resolveAll(list, checkOnly) {
  list = list || NEEDED;
  const cache = checkOnly ? { ids: {}, absent: [] } : readCompCache();
  let local = null;
  const loadLocal = async () => {   // โหลดทุกหน้า + รายการ component ในไฟล์ — ทำเมื่อจำเป็นเท่านั้น ครั้งเดียวต่อรอบ
    if (local) return local;
    await figma.loadAllPagesAsync();
    local = new Map();
    for (const n of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
      if (n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') continue;
      if (!local.has(n.name)) local.set(n.name, n);
    }
    log('โหลดทุกหน้าเพื่อหา component ในไฟล์นี้เอง ' + local.size + ' ตัว');
    return local;
  };
  /* ยืมจาก instance ในไฟล์ = ทางสุดท้าย — สแกนเฉพาะเมื่อมีตัวที่นำเข้าไม่ได้ (เดิมสแกนทุกรอบ: ไฟล์มี instance หลายพันตัว ช้ามาก) */
  const viaInst = new Map();
  let scanned = false;
  const scanInstances = async () => {
    if (scanned) return; scanned = true;
    await loadLocal();
    log('กำลังสแกน instance ในไฟล์ (มีตัวที่นำเข้าจากไลบรารีไม่ได้)…');
    const insts = figma.root.findAllWithCriteria({ types: ['INSTANCE'] });
    for (const i of insts) {
      try {
        const mc = await i.getMainComponentAsync();
        if (!mc) continue;
        const h = holderOf(mc);
        if (!viaInst.has(h.name)) viaInst.set(h.name, h);
      } catch (e) { /* ข้าม instance ที่เข้าไม่ถึง */ }
    }
  };
  const fromCache = async (x) => {   // id ที่จำไว้ → node · ถูกลบหรือเปลี่ยนชื่อแล้ว = ไม่ใช้
    const c = cache.ids[x]; if (!c || typeof figma.getNodeByIdAsync !== 'function') return null;
    try { const n = await figma.getNodeByIdAsync(c[0]); if (n && !n.removed && (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') && n.name === c[2]) return [n, c[1]]; } catch (e) { /* หาใหม่ */ }
    return null;
  };
  const skipped = [];
  const missing = [];
  for (const name of list) {
    const names = [name].concat(ALIAS[name] || []);
    let got = null, how = '';
    /* 19 ต.ค. 2569 เจ้าของงานต้องการให้ "Go to main component" พาไปไฟล์ (Component) VMS Plus ที่เราอ่านค่ามา
       ⇒ นำเข้าด้วย key (key ทั้งหมดอ่านจากไฟล์นั้น) มาก่อน · ยืมจาก instance ในไฟล์เป็นทางสุดท้าย (อาจชี้ไลบรารีอื่นที่เปิดไม่ได้) */
    // ลำดับ (19 ต.ค. 2569): นำเข้าจากไลบรารีไฟล์ component ก่อนเสมอ — แม้ไฟล์นี้มีสำเนาชื่อเดียวกัน (เช่น Page header ของ Maintain-D)
    // เพราะสำเนาในไฟล์กด Go to main component แล้ววนอยู่ในไฟล์นี้ ไม่ไปไฟล์ที่อ่านค่ามา
    let importErr = '';
    if (!got) for (const x of names) {
      const k = KEYS[x]; if (!k) continue;
      try { got = k[1] ? await figma.importComponentSetByKeyAsync(k[0]) : await figma.importComponentByKeyAsync(k[0]); how = 'นำเข้าจากไลบรารี'; break; }
      catch (e) { importErr = (e && e.message) || String(e); }
    }
    if (!got) for (const x of names) { const c = await fromCache(x); if (c) { [got, how] = c; break; } }
    const absent = !got && names.every(x => cache.absent.indexOf(x) >= 0);
    if (absent) skipped.push(name);
    if (!got && !absent) { const L = await loadLocal(); for (const x of names) { if (L.has(x)) { got = L.get(x); how = 'สำเนาในไฟล์นี้ ⚠ ลิงก์วนในไฟล์นี้'; break; } } }
    if (!got && !absent) await scanInstances();
    if (!got && !absent) for (const x of names) { if (viaInst.has(x)) { got = viaInst.get(x); how = 'จาก instance ในไฟล์ ⚠ อาจลิงก์ไปไลบรารีที่เปิดไม่ได้'; break; } }
    if (got && how.indexOf('นำเข้าจากไลบรารี') !== 0) cache.ids[name] = [got.id, how, got.name];
    if (got) cache.absent = cache.absent.filter(x => x !== name);
    else if (!absent && cache.absent.indexOf(name) < 0) cache.absent.push(name);
    if (!got && importErr) how = 'นำเข้าไม่ได้: ' + importErr;
    if (importErr && !IMPORT_ERR && !NESTED_ONLY.has(name) && !SOFT_KEY.has(name)) IMPORT_ERR = importErr;   // ชิ้นส่วนซ้อน (เช่น _Dropdown menu item ที่ Figma ไม่ publish) ไม่ต้องเตือน
    if (got) { INDEX.set(name, got); ROUTE[name] = how + (got.name !== name ? ' (ชื่อ ' + got.name + ')' : ''); }
    else missing.push(name + (how ? ' — ' + how : ''));
  }
  writeCompCache(cache);
  if (!local) log('ไม่ต้องโหลดทุกหน้า — นำเข้าจากไลบรารีด้วย key · ตัวในไฟล์ใช้ตำแหน่งที่จำไว้');
  if (skipped.length) log('ข้าม ' + skipped.length + ' ตัวที่รอบก่อนไม่เจอในไฟล์ (' + skipped.join(', ') + ') — ถ้าเพิ่งวางลงไฟล์ กด "เช็ค component" ก่อน');
  if (IMPORT_ERR) log('⚠ นำเข้าจากไลบรารีไม่ได้ (' + IMPORT_ERR + ') — ตัวที่ได้ "จาก instance ในไฟล์" จะกด Go to main component ไปไฟล์ Component ที่อ่านมาไม่ได้ · เปิดใช้ไลบรารี (Component) VMS Plus ในไฟล์นี้ (Assets → Libraries) แล้วรันใหม่');
  const by = {};
  for (const n of Object.keys(ROUTE)) { const r = ROUTE[n].split(' (')[0]; by[r] = (by[r] || 0) + 1; }
 log('หา component ได้ ' + list.filter(n => INDEX.has(n)).length + '/' + list.length + ' · ' + Object.keys(by).map(k => k + ' ' + by[k]).join(' · '));
  if (checkOnly) {
    if (!missing.length) log('✓ มีครบ ไม่ต้องเตรียมเพิ่ม');
    else { log('ยังไม่มีในไฟล์ ' + missing.length + ' ตัว — ลากจาก Assets มาวางในไฟล์อย่างละ 1 ชิ้น (หน้าไหนก็ได้):'); missing.forEach(m => log('  ✗ ' + m.split(' — ')[0])); }
    return;
  }
  const soft = missing.filter(m => NESTED_ONLY.has(m.split(' — ')[0]));
  missing.filter(m => LOCAL_OPTIONAL.includes(m.split(' — ')[0])).forEach(m => log('  · ไม่พบ ' + m.split(' — ')[0] + ' ในไฟล์นี้ (component ของไฟล์ Maintain-D) — ใช้แบบเดิมแทน'));
  const hard = missing.filter(m => !NESTED_ONLY.has(m.split(' — ')[0]) && !LOCAL_OPTIONAL.includes(m.split(' — ')[0]));
  soft.forEach(m => log('  · ไม่พบ ' + m.split(' — ')[0] + ' — ไม่เป็นไร ใช้ตัวที่ซ้อนอยู่ใน component อื่น'));
  if (hard.length) {
    log('ไม่พบ ' + hard.length + ' ตัวที่ต้องสร้างเอง:');
    hard.forEach(m => log('  ✗ ' + m));
    throw new Error('component ไม่ครบ — ถ้าขึ้น "นำเข้าไม่ได้" ให้เปิดใช้ไลบรารี VMS Plus ในไฟล์นี้ (Assets → Libraries) แล้วรันใหม่');
  }
}
function main(name, variant) {
  const n = INDEX.get(name);
  if (!n) throw new Error('ไม่พบ component "' + name + '"');
  if (n.type === 'COMPONENT') return n;
  const want = variant || {};
  const hit = n.children.find(c => Object.keys(want).every(k => c.variantProperties && c.variantProperties[k] === want[k]));
  if (!hit) throw new Error('ไม่พบ variant ' + JSON.stringify(want) + ' ของ "' + name + '"');
  return hit;
}
const icon = (name) => main(name).id;   // ใช้กับ property ชนิด INSTANCE_SWAP

/* ---------- ตัวช่วยแก้ instance ---------- */
function setProps(node, obj) {
  const cp = node.componentProperties || {};
  const out = {};
  for (const k of Object.keys(obj)) {
    const full = Object.keys(cp).find(x => x === k || x.split('#')[0].trim() === k);
    if (!full) { warn(node.name, 'ไม่มี property "' + k + '"'); continue; }
    out[full] = obj[k];
  }
  try { if (Object.keys(out).length) node.setProperties(out); } catch (e) { warn(node.name + ' setProperties ' + JSON.stringify(obj), e); }
}
const USED = new Set();
/* ชิ้นที่สร้างระหว่างประกอบจอปัจจุบัน (เฟรม + instance) — Figma วาง node ใหม่ไว้ที่ (0,0) ของหน้าจนกว่าจะถูก appendChild เข้าจอ
   ถ้าประกอบจอพังกลางทาง ชิ้นเหล่านี้จะค้างซ้อนกันที่มุมหน้า (เจ้าของงานเจอ 20 ต.ค. 2569) ⇒ build() ล้างด้วย dropCreated() */
let CREATED = [];
let PLACE = null;   // ตำแหน่งที่จอปัจจุบันจะไปอยู่ — shell() วางเฟรมจอทันทีที่สร้าง ไม่รอจบ
const INNER_FRAMES = new Set(['Section', 'Row', 'Content', 'Content item', 'Actions', 'Dual list', 'Gallery', 'Table', 'Page', 'Container', 'WBS', 'Sheet', 'Panel', 'Radio', 'Sign', 'Signed', 'Spacer', 'Mobile table', 'Page header']);
function sweepOrphans(page, names) {   // รอบก่อนพังกลางทาง → ชิ้นส่วนค้างซ้อนกันที่ (0,0) ของหน้าปลั๊กอิน (ไม่ใช่เฟรมจอ) — ลบเฉพาะที่เข้าเกณฑ์นี้บนหน้าของปลั๊กอินเท่านั้น
  let n = 0;
  for (const node of page.children.slice()) {
    if (node.x !== 0 || node.y !== 0) continue;
    if (node.name.indexOf(PLUGIN.prefix + ' / ') === 0) continue;
    const orphan = (node.type === 'FRAME' && INNER_FRAMES.has(node.name)) || (node.type === 'INSTANCE' && names.has(node.name));
    if (orphan) { try { node.remove(); n++; } catch (e) { /* ลบไม่ได้ ข้าม */ } }
  }
  return n;
}
function dropCreated(page) {
  let n = 0;
  for (const node of CREATED) { try { if (node.parent === page) { node.remove(); n++; } } catch (e) { /* ลบไปแล้ว */ } }
  CREATED = [];
  return n;
}
function inst(name, variant, props) {
  USED.add(name);
  const n = main(name, variant).createInstance();
  CREATED.push(n);
  if (props) setProps(n, props);
  return n;
}
const find = (root, name, nth) => {
  const all = root.findAll(n => n.name === name);
  return all[nth || 0] || null;
};
const FONTS = new Set();
/* ฟอนต์สำรองเมื่อ component ใช้ฟอนต์ที่เครื่องไม่มี (เจ้าของงานเจอ 20 ต.ค. 2569: แถบ Header/State ของทีมออกแบบใช้ LINE Seed Sans → แก้ข้อความไม่ได้ ป้ายเลยไม่ตรง scenario) */
let FALLBACK_FONT, FONT_SWAPPED = 0;
async function fallbackFont() {
  if (FALLBACK_FONT) return FALLBACK_FONT;
  for (const f of [{ family: 'IBM Plex Sans Thai', style: 'Bold' }, { family: 'IBM Plex Sans Thai', style: 'Medium' }, { family: 'Inter', style: 'Bold' }, { family: 'Inter', style: 'Regular' }]) {
    try { await figma.loadFontAsync(f); return (FALLBACK_FONT = f); } catch (e) { /* ลองตัวถัดไป */ }
  }
  return null;
}
async function text(root, layer, value, nth) {
  const t = typeof layer === 'string' ? find(root, layer, nth) : layer;
  if (!t || t.type !== 'TEXT') { warn(root.name, 'ไม่พบข้อความ "' + layer + '"'); return false; }
  try {
    const fonts = t.fontName === figma.mixed ? t.getRangeAllFontNames(0, t.characters.length) : [t.fontName];
    let missing = false;
    for (const f of fonts) { const k = f.family + '|' + f.style; if (FONTS.has(k)) continue; try { await figma.loadFontAsync(f); FONTS.add(k); } catch (e) { missing = true; } }   // โหลดฟอนต์ละครั้งเดียว
    if (missing) {   // ฟอนต์ของ component ไม่มีในเครื่อง → สลับเป็นฟอนต์ที่มี แล้วค่อยใส่ข้อความ
      const fb = await fallbackFont();
      if (!fb) throw new Error('ฟอนต์ ' + fonts.map(f => f.family + ' ' + f.style).join(', ') + ' ไม่มีในเครื่อง และไม่มีฟอนต์สำรอง');
      t.fontName = fb; FONT_SWAPPED++;
    }
    t.characters = value;
    return true;
  } catch (e) { warn('ข้อความ ' + (typeof layer === 'string' ? layer : layer.name), e); return false; }
}
function hide(root, name, all) {
  const list = root.findAll(n => n.name === name);
  if (!list.length) { warn(root.name, 'ไม่พบ layer "' + name + '" ให้ซ่อน'); return; }
  (all ? list : [list[0]]).forEach(n => { n.visible = false; });
}
function frame(name, dir, o) {
  const f = figma.createFrame();
  CREATED.push(f);
  f.name = name;
  f.fills = o && o.fill ? [{ type: 'SOLID', color: o.fill }] : [];
  if (dir) {
    f.layoutMode = dir;
    f.itemSpacing = (o && o.gap) || 0;
    const p = (o && o.pad) || 0;
    f.paddingTop = f.paddingBottom = Array.isArray(p) ? p[0] : p;
    f.paddingLeft = f.paddingRight = Array.isArray(p) ? p[1] : p;
    f.primaryAxisSizingMode = 'AUTO';
    f.counterAxisSizingMode = 'AUTO';
  }
  return f;
}
function add(parent, child, fill) {
  parent.appendChild(child);
  if (fill === 'h' || fill === 'both') child.layoutSizingHorizontal = 'FILL';
  if (fill === 'v' || fill === 'both') child.layoutSizingVertical = 'FILL';
  return child;
}
const WHITE = { r: 1, g: 1, b: 1 };

/* สีป้ายสถานะ (Badge outline มีแค่ 5 สี) */
const BADGE_OF = { Gray: 'Gray', Info: 'Brand', Success: 'Success', Warning: 'Brand', Error: 'Error', Brand: 'Brand' };   // Badge outline มีแค่ 5 สี
/* ---------- mobile (เจ้าของงานเคาะ 19 ต.ค. 2569) ----------
   ใช้กับจอ < 768 (รวม tablet) · ออกแบบเฟรม 402×874 (เจ้าของงานเปลี่ยนจาก 360×850 วันเดียวกัน) · component Breakpoint=Mobile ยืดเต็มกว้าง เว้นขอบ 16
   ตาราง → การ์ด Mobile table · กล่องเด้ง → bottom sheet (Background overlay + Bottom sheet header + เนื้อหา + Bottom sheet footer)
   ทุกฟังก์ชันประกอบหน้าดูตัวแปร MOB — สร้างจอ desktop แล้วสลับ MOB สร้างจอ mobile ด้วยข้อมูลชุดเดียวกัน */
let MOB = false;
const BP = () => (MOB ? 'Mobile' : 'Desktop');
const VW = () => (MOB ? 402 : 1440), VH = () => (MOB ? 874 : 1024);

/* ---------- ตัวช่วยประกอบ ---------- */
function btn(kind, label, o) {
  o = o || {};
  const variant = { State: o.disabled ? 'Disabled' : 'Default' };
  if (kind !== 'Tertiary brand button') variant.Size = o.size || 'md';   // Tertiary brand button ไม่มี Size
  const props = { Text: label, 'Leading icon': !!o.icon, 'Trailing icon': false };
  if (o.icon) props['Leading icon swap'] = icon(o.icon);
  return inst(kind, variant, props);
}
function row(name, kids, o) {
  if (MOB && !(o && o.keep)) {   // mobile: แถวช่องกรอกเรียงลงล่าง เต็มกว้าง (ตัด Spacer ทิ้ง)
    const c = frame(name || 'Row', 'VERTICAL', { gap: 16 });
    kids.forEach(k => { if (!k) return; if (k.type === 'FRAME' && k.name === 'Spacer') { k.remove(); return; } add(c, k, 'h'); });
    return c;
  }
  const r = frame(name || 'Row', 'HORIZONTAL', { gap: (o && o.gap) != null ? o.gap : 24 });
  r.counterAxisAlignItems = (o && o.align) || 'MIN';
  kids.forEach(k => { if (k) { r.appendChild(k); if (!(o && o.hug)) k.layoutGrow = 1; } });
  return r;
}
function col(name, kids, gap) { const c = frame(name || 'Content', 'VERTICAL', { gap: gap == null ? 32 : gap }); kids.forEach(k => { if (k) add(c, k, 'h'); }); return c; }
/* ป้ายที่เห็นคือ Input label ที่ซ้อนอยู่ในช่อง (property ชั้นบนคุมป้ายชุดเก่าที่ซ่อนอยู่) ⇒ ตั้งทั้งสองชั้นให้ตรงกัน */
function syncLabel(n, label, optional) {
  const l = n && find(n, 'Input label');
  if (l) setProps(l, { 'Label text': label, Optional: !!optional, 'Info icon': false });
  return n;
}
function field(label, value, o) {   // Text input
  o = o || {};
  const st = o.state || (o.error ? 'Error' : value ? 'Filled' : 'Default');
  const n = inst('Text input', { State: st, Size: 'md' }, { 'Label text': label, Text: value || o.placeholder || '', Optional: !!o.optional,
    Helper: !!o.error, 'Helper text': o.error || '', 'Info icon': false, 'Leading icon': !!o.lead, 'Trailing icon': false,
    'Show Placeholder': !value });
  if (o.lead) setProps(n, { 'Leading icon swap': icon(typeof o.lead === 'string' ? o.lead : 'search-24-300-round') });
  return syncLabel(n, label, o.optional);
}
function dropdown(label, value, o) {   // Input dropdown
  o = o || {};
  const st = o.state || (o.error ? 'Error' : value ? 'Selected' : 'Default');
  const p = { 'Label text': label, Text: value || o.placeholder || 'เลือก', Optional: false, Helper: !!o.error, 'Helper text': o.error || '',
    'Info icon': false, 'Leading icon': !!o.lead, Supporting: false };
  if (o.lead) p['Leading icon swap'] = icon(o.lead);
  return syncLabel(inst('Input dropdown', { State: st, Size: 'md' }, p), label, false);
}
/* เลือกหลายค่า — Input dropdown with badges ค่าที่เลือกเป็นชิปในช่อง (Selected 4 ชิป · Focused 2 ชิป + ช่องพิมพ์) เกินช่องให้ชิปสุดท้ายเป็น "+n"
   ตาม Dropdown/Fleet card gas station หน้า 5.2 Vehicle Management ของ UI Release#2 (เจ้าของงาน 2 พ.ย. 2569 "ภาค เขต ประเภทรถ อยากให้มัลติซีเล็คได้") */
function multiDropdown(label, values, o) {
  o = o || {}; values = values || [];
  const st = o.state || (o.error ? 'Error' : values.length ? 'Selected' : 'Default');
  const n = inst('Input dropdown with badges', { State: st, Size: 'md' }, { 'Label text': label, Text: values.length ? '' : o.placeholder || 'เลือก', Optional: !!o.optional, Helper: !!o.error, 'Helper text': o.error || '', 'Info icon': false, 'Leading icon': false });   // o.optional = "(ถ้ามี)" ในแผงตัวกรอง (5 พ.ย. 2569)
  const chips = n.findAll(c => c.type === 'INSTANCE' && c.name === 'Badge outline with remove icon');
  chips.forEach((c, j) => {
    if (j >= values.length) { c.visible = false; return; }
    setProps(c, { Text: values.length > chips.length && j === chips.length - 1 ? '+' + (values.length - j) : values[j] });
  });
  return syncLabel(n, label, !!o.optional);
}
function area(label, value, o) {
  o = o || {};
  return syncLabel(inst('Text area', { State: o.error ? 'Error' : value ? 'Filled' : 'Default', Size: 'md' }, { 'Label text': label, Text: value || o.placeholder || '',
    Optional: !!o.optional, Helper: !!o.error, 'Helper text': o.error || '', 'Info icon': false, 'Trailing icon': false, 'Show Placeholder': !value }), label, o.optional);   // error แบบ area() ของ Overhaul (R29)
}
async function section(title, o) {   // Section header + ปุ่มขวา
  o = o || {};
  const sh = inst('Section header', { Breakpoint: BP() }, { Title: title, Badge: o.badge != null, 'Supporting text': false,
    Actions: !!(o.buttons && o.buttons.length), 'More actions': false });
  if (o.badge != null) { const b = find(sh, 'Badge outline'); if (b) setProps(b, { Text: String(o.badge) }); }
  const acts = find(sh, 'Actions');
  if (acts) acts.children.forEach(c => { c.visible = false; });
  (o.buttons || []).forEach((b, i) => {
    const slot = acts && acts.children.filter(c => c.name === b.kind)[i] || (acts && acts.children.find(c => c.name === b.kind && !c.visible));
    if (slot) {
      slot.visible = true; setProps(slot, { Text: b.text, 'Leading icon': !!b.icon, 'Trailing icon': false, State: b.disabled ? 'Disabled' : 'Default' }); if (b.icon) setProps(slot, { 'Leading icon swap': icon(b.icon) });
      // 2 พ.ย. 2569 ปุ่ม "เพิ่มอะไหล่" ในไฟล์จริงตัดคำเป็น 2 บรรทัด ⇒ ปุ่มและข้อความในปุ่มกว้างตามคำ
      try { slot.layoutSizingHorizontal = 'HUG'; } catch (e) { /* ไฟล์เก่าไม่รองรับ */ }
      const tx = slot.findOne(n => n.type === 'TEXT' && n.name === 'Text'); if (tx) try { tx.textAutoResize = 'WIDTH_AND_HEIGHT'; } catch (e) { /* ข้ามได้ */ }
    }
  });
  return sh;
}
/* Section label — หัวข้อของหน้า Detail (รีวิว 19 ต.ค. 2569: Section header ใช้เฉพาะหน้า Create/Edit)
   ไม่มี Badge ⇒ จำนวนต่อท้ายชื่อ "(n)" ตาม wireframe "รายการรถ (จำนวน xx)" · ปุ่ม: Primary action = Tertiary brand button · Secondary action = Tertiary button */
async function sectionLabel(title, o) {
  o = o || {};
  const bs = o.buttons || [];
  const pri = bs.find(b => b.kind === 'Primary button'), sec = bs.find(b => b.kind !== 'Primary button');
  const sl = inst('Section label', { Breakpoint: BP() }, { Title: o.badge != null ? title + ' (' + o.badge + ')' : title, Supporting: false, 'Info icon': false,
    'More actions': false, Actions: !!(pri || sec), 'Primary action': !!pri, 'Secondary action': !!sec });
  const put = (b, node) => { if (b && node) setProps(node, { Text: b.text, 'Leading icon': !!b.icon, 'Trailing icon': false, ...(b.icon ? { 'Leading icon swap': icon(b.icon) } : {}), ...(b.disabled ? { State: 'Disabled' } : {}) }); };   // b.disabled = State Disabled ของ Tertiary (brand) button (5 พ.ย. 2569 ปุ่มสร้างแผนเดินทางเมื่อรถครบทุกคัน)
  put(pri, find(sl, 'Tertiary brand button')); put(sec, find(sl, 'Tertiary button'));
  return sl;
}
/* กล่องแสดงข้อมูล (display) ตามตัวอย่างที่เจ้าของงานส่ง 19 ต.ค. 2569 (Maintain-D หน้า "Flow การซ่อม" — VehicleInfo > Content):
   พื้น Color/surface/secondary-subtle (gray-50) · มุม 8 · ขอบใน 24 · ระยะแถว 24 · แถวละ 4 ช่อง Content item row (Text with label ไม่มีไอคอน) */
const SURFACE_SUB = { r: 249 / 255, g: 250 / 255, b: 251 / 255 };
let SURFACE_VAR;
async function surfaceVar() {   // ผูกสีกับตัวแปรของไลบรารีถ้าหาได้ ไม่ได้ก็ใช้ค่าสีเดียวกัน
  if (SURFACE_VAR !== undefined) return SURFACE_VAR;
  SURFACE_VAR = null;
  const ok = (v) => /^Color\/surface\/secondary-sub/i.test(v.name);
  try { const l = (await figma.variables.getLocalVariablesAsync('COLOR')).find(ok); if (l) return (SURFACE_VAR = l); } catch (e) { /* ไม่มี API */ }
  try {
    for (const c of await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()) {
      const v = (await figma.teamLibrary.getVariablesInLibraryCollectionAsync(c.key)).find(ok);
      if (v) return (SURFACE_VAR = await figma.variables.importVariableByKeyAsync(v.key));
    }
  } catch (e) { /* ไม่มีสิทธิ์ teamlibrary — ใช้ค่าสี */ }
  return SURFACE_VAR;
}
async function displayBox(box) {
  box.name = 'Content';
  box.itemSpacing = 24; box.paddingTop = box.paddingBottom = box.paddingLeft = box.paddingRight = 24; box.cornerRadius = 8;
  let paint = { type: 'SOLID', color: SURFACE_SUB };
  const v = await surfaceVar();
  if (v) try { paint = figma.variables.setBoundVariableForPaint(paint, 'color', v); } catch (e) { /* ใช้ค่าสี */ }
  box.fills = [paint];
  return box;
}
function kv(pairs, perRow) {   // Content item row ละ 4 ช่อง (Type=Text with label) · mobile แถวละ 2
  perRow = MOB ? 2 : (perRow || 4);
  const box = frame('Content item', 'VERTICAL', { gap: 8 });   // displayBox() แต่งเป็นกล่องแสดงข้อมูลตอนสร้างจอเสร็จ (ต้อง await ตัวแปรสี)
  for (let i = 0; i < pairs.length; i += perRow) {
    const r = inst('Content item row', { 'Column width': 'Full' });
    const items = r.children.filter(c => c.name === '_Content item base');
    const slice = pairs.slice(i, i + perRow);
    items.forEach((it, j) => {
      if (j >= slice.length) return;
      setProps(it, { Type: 'Text with label' });
      setProps(it, { Label: slice[j][0], Text: slice[j][1], Supporting: false, 'Leading icon': false });
    });
    setProps(r, { 'Item 2': slice.length > 1, 'Item 3': slice.length > 2, 'Item 4': slice.length > 3 });
    add(box, r, 'h');
  }
  return box;
}
async function upload(label, files, o) {   // File upload Type=Default
  o = o || {};
  const u = inst('File upload', { Type: 'Default' }, { 'File queue': files.length > 0, Helper: !!o.error, 'Helper text': o.error || '',
    'File upload': !o.readonly });   // หน้ารายละเอียด: แสดงเฉพาะรายการไฟล์ ไม่มีกล่องอัปโหลด
  const lb = find(u, 'Input label');
  if (lb) { await text(lb, 'Label', label); const op = find(lb, '(ถ้ามี)'); if (op) op.visible = !!o.optional; const ic = find(lb, 'info-24-300-round'); if (ic) ic.visible = false; const tb = find(lb, 'Tertiary brand button'); if (tb) tb.visible = false; }
  const base = find(u, '_File upload base'); if (base && o.error) setProps(base, { State: 'Error' });
  if (base) { await text(base, 'Supporting text', (o.hint || 'PDF, JPG · สูงสุด 10 ไฟล์') + ' · ' + files.length + '/10 ไฟล์'); }
  const items = u.findAll(n => n.name === '_File upload item base');
  items.forEach((it, i) => {
    if (i >= files.length) { it.visible = false; return; }
    const f = files[i];
    /* 4 พ.ย. 2569 เจ้าของงาน "upload เอกสาร pdf และ ภาพ จะใช้สัญลักษณ์ไม่เหมือนกัน และ upload แล้ว จะมี progress bar ด้วย อ้างอิงจากของเดิม"
       ไอคอน = _File icon Type=Image (jpg png) / Document (อื่น) ของไลบรารี · แถบ = Progress bar ในรายการไฟล์ แบบปลั๊กอิน Overhaul (บล็อก M):
       f.progress = กำลังอัปโหลด (State In progress · ตัวเลข = %) · f.bar หรือ o.bar = อัปโหลดเสร็จแล้วแสดงแถบ 100% */
    const pct = f.progress ? (typeof f.progress === 'number' ? Math.max(0, Math.min(100, Math.round(f.progress / 20) * 20)) : 40) : 100;
    setProps(it, { State: f.err ? 'Error' : f.progress ? 'In progress' : 'Completed' });
    setProps(it, { 'File name': f.name, 'File size': f.err ? 'อัปโหลดไม่สำเร็จ — รับเฉพาะไฟล์ PDF หรือ JPG' : f.size, 'Progress bar': !f.err && !!(f.progress || f.bar || o.bar),
      Actions: true, 'Download action': !f.err && !o.readonly && !f.progress, 'Delete action': !o.readonly });
    const fi = it.findOne(n => n.type === 'INSTANCE' && n.name === '_File icon'); if (fi) setProps(fi, { Type: /\.(jpe?g|png|gif|webp|heic)$/i.test(f.name) ? 'Image' : 'Document' });
    const pb = it.findOne(n => n.type === 'INSTANCE' && n.name === 'Progress bar'); if (pb && !f.err && (f.progress || f.bar || o.bar)) setProps(pb, { Progress: pct + '%' });
  });
  return u;
}
function mobileCards(cols, rows) {   // mobile: 1 แถวตาราง = 1 การ์ด Mobile table (หัวข้อ–ค่า เรียงลง · แถวสุดท้ายเป็นปุ่ม)
  if (rows.some(r => r.some(v => v && v.check != null))) {   // checklist → List with checkbox
    const l = inst('List with checkbox');
    const hd = find(l, 'List header item'); if (hd) { const b = find(hd, 'Badge outline'); if (b) b.visible = false; const cb = find(hd, 'Checkbox'); if (cb) setProps(cb, { Type: rows.every(r => r[0].check) ? 'Selected' : 'Unselected' }); }
    l.children.filter(c => c.name === 'List with checkbox item').forEach((it, i) => {
      if (i >= rows.length) { it.visible = false; return; }
      setProps(it, { State: rows[i][0].disabled ? 'Disabled' : rows[i][0].check ? 'Selected' : 'Default' });   // disabled = ติ๊กไม่ได้ (อยู่ไตรมาส/แผนเดินทางอื่น · 5 พ.ย. 2569)
      setProps(it, { Text: rows[i][0].text, Avatar: false, Supporting: !!rows[i][0].sub, 'Supporting text': rows[i][0].sub || '', 'Supporting 2': false });
    });
    const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = false;
    l._title = cols[0][0];
    return l;
  }
  const box = frame('Mobile table', 'VERTICAL', { gap: 12 });
  rows.forEach((r, ri) => {
    const card = inst('Mobile table', { 'Alternating fills': 'False' });
    const items = card.children.filter(c => c.name === 'Mobile table item');
    const data = [], acts = [];
    cols.forEach(([head], ci) => { const v = r[ci]; if (v && (v.menu || v.icons)) acts.push(v); else if (head && v && v.pills) v.pills.forEach((pl, k) => data.push([k ? v.pillsHead || head : head, { pill: pl }])); else if (head) data.push([head, v]); });   // Mobile table item ไม่มี Multiple badges ⇒ ป้ายที่ 2 เป็นแถวของการ์ด (4 พ.ย. 2569)
    items.forEach((it, i) => {
      const last = i === items.length - 1;
      if (last) {
        if (!acts.length) { it.visible = false; return; }
        /* 4 พ.ย. 2569 เจ้าของงาน "ส่วนที่เป็น mobile อยากให้ expand view edit delete icon ออกมาแบบตัวอย่างทั้งหมด"
           ⇒ ช่องเมนู "…" ที่รู้รายการ (menu + items) บนมือถือเปิดปุ่มไอคอนของ Mobile table item Style=Action icons ตามรายการเลย
           (View = ดูรายละเอียด · Edit = แก้ไข · Delete = ลบ · Print ปิด · ไอคอนตั้งต้นของไลบรารีตรงอยู่แล้ว ไม่สลับ) · ไม่มี items = ปุ่ม … ปุ่มเดียวแบบเดิม */
        if (acts[0].menu && acts[0].items) {
          const has = (t) => acts[0].items.some(x => x[0] === t);
          setProps(it, { View: has('ดูรายละเอียด'), Edit: has('แก้ไข'), Print: false, Delete: has('ลบ') });
          return;
        }
        const ic = acts[0].menu ? ['more_horiz-20-400-round'] : acts[0].icons;
        setProps(it, { View: ic.length > 0, Edit: ic.length > 1, Print: false, Delete: false });
        it.findAll(n => n.name === 'Tertiary button').forEach((b, k) => { if (ic[k]) setProps(b, { 'Leading icon swap': icon(ic[k]) }); });
        return;
      }
      if (i >= data.length) { it.visible = false; return; }
      const [head, v] = data[i];
      if (v && v.pill) { setProps(it, { Style: 'Badge' }); setProps(it, { Header: head }); const p = find(it, 'Pill outline'); if (p) setProps(p, { Color: v.pill[1], Text: v.pill[0] }); }
      else if (v && typeof v === 'object' && v.text != null) { setProps(it, { Style: i === 0 ? 'Lead text' : 'Text' }); setProps(it, { Header: head, Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' }); }   // บรรทัดรองใช้ช่อง Supporting text ของ Mobile table item (เจ้าของงาน 4 พ.ย. 2569 "รายละเอียดก็มีนี่นา") เดิมต่อท้ายด้วย ·
      else { setProps(it, { Style: i === 0 ? 'Lead text' : 'Text' }); setProps(it, { Header: head, Text: v == null ? '' : String(v), Supporting: false }); }
    });
    add(box, card, 'h');
  });
  return box;
}
/* ตารางประกอบเองแบบเดิม — ใช้เฉพาะตารางที่เกินขนาด component Table ของไลบรารี (8 คอลัมน์ × 10 แถว) */
function tblComposed(cols, rows) {   // cols: [หัว, กว้าง, Style, เรียงได้] · ช่อง: ข้อความ | {pill:[t,สี]} | {menu:1} | {icons:[..]} | {check:bool,text}
  const t = frame('Table', 'HORIZONTAL');
  cols.forEach(([head, w, style, sort], ci) => {
    const c = frame('Column', 'VERTICAL');
    t.appendChild(c);
    if (w) { c.layoutSizingHorizontal = 'FIXED'; c.resize(w, c.height); } else c.layoutGrow = 1;
    const hc = inst('Table header cell', { Checkbox: 'False' }, { Text: head || ' ', 'Sort icon': !!sort, 'Header text': !!head });
    add(c, hc, 'h');
    if (sort) { const s = find(hc, 'Sort icon'); if (s) setProps(s, { Icon: sort }); }
    rows.forEach((r, ri) => {
      const v = r[ci], alt = ri % 2 ? 'True' : 'False';
      const st = v && v.check != null ? 'Lead checkbox' : v && v.pills ? 'Multiple badges' : v && v.pill ? 'Badge' : v && (v.menu || v.icons) ? 'Action icons' : style || 'Text';
      const cell = inst('Table cell', { Style: st, 'Alternating fills': alt });
      add(c, cell, 'h');
      if (st === 'Multiple badges') fillPills(cell, v.pills);
      else if (st === 'Badge') { const p = find(cell, 'Pill outline'); if (p) setProps(p, { Color: v.pill[1], Text: v.pill[0] }); }
      else if (st === 'Action icons') {
        const ic = v.menu ? ['more_horiz-20-400-round'] : v.icons;
        setProps(cell, { View: ic.length > 0, Edit: ic.length > 1, Print: false, Delete: false });
        const bs = cell.findAll(n => n.name === 'Tertiary button');
        ic.forEach((name, i) => { if (bs[i]) setProps(bs[i], { 'Leading icon swap': icon(name) }); });
      } else if (st === 'Lead checkbox') {
        setProps(cell, { Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' });
        const cb = find(cell, 'Checkbox'); if (cb) setProps(cb, { Type: v.check ? 'Selected' : 'Unselected', State: v.disabled ? 'Disabled' : 'Default' });
      } else setProps(cell, { Text: v == null ? '' : String(v), Supporting: false });
    });
  });
  return t;
}
/* ช่องตาราง 1 ช่อง — ใช้ทั้งกับ Table cell ที่ซ้อนใน Table (รีวิว 19 ต.ค. 2569) และ mobile */
/* ป้ายหลายอันในช่องเดียว (4 พ.ย. 2569 S12 สถานะงาน + "รอผลตรวจน้ำมัน") — Table cell Style=Multiple badges ของไลบรารีมี Pill outline 3 อัน (ป้าย · ป้าย · +n) ใช้ตามจำนวน ที่เหลือซ่อน */
function fillPills(cell, pills) {
  cell.findAll(n => n.type === 'INSTANCE' && n.name === 'Pill outline').forEach((p, k) => { if (k < pills.length) setProps(p, { Color: pills[k][1], Text: pills[k][0] }); else p.visible = false; });
}
function fillCell(cell, v, style, alt) {
  const st = v && v.check != null ? 'Lead checkbox' : v && v.pills ? 'Multiple badges' : v && v.pill ? 'Badge' : v && (v.menu || v.icons) ? 'Action icons' : style || 'Text';
  setProps(cell, { Style: st, 'Alternating fills': alt });
  if (st === 'Multiple badges') fillPills(cell, v.pills);
  else if (st === 'Badge') { const p = find(cell, 'Pill outline'); if (p) setProps(p, { Color: v.pill[1], Text: v.pill[0] }); }
  else if (st === 'Action icons') {
    const ic = v.menu ? ['more_horiz-20-400-round'] : v.icons;
    setProps(cell, { View: ic.length > 0, Edit: ic.length > 1, Print: false, Delete: false });
    const bs = cell.findAll(n => n.name === 'Tertiary button');
    ic.forEach((name, i) => { if (bs[i]) setProps(bs[i], { 'Leading icon swap': icon(name) }); });
  } else if (st === 'Lead checkbox') {
    setProps(cell, { Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' });   // { check, text, sub, disabled } — แถวที่ติ๊กไม่ได้ = Checkbox State=Disabled + บรรทัดรองบอกเหตุผล (5 พ.ย. 2569)
    const cb = find(cell, 'Checkbox'); if (cb) setProps(cb, { Type: v.check ? 'Selected' : 'Unselected', State: v.disabled ? 'Disabled' : 'Default' });
  } else if (v && typeof v === 'object' && v.text != null) {   // { text, sub } = 2 บรรทัด ตามแบบ Overhaul
    setProps(cell, { Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' });
    if (v.tone && v.sub) toneText(find(cell, 'Supporting text'), v.tone);   // บรรทัดรองสีเตือน/แดง แบบ Vehicle list ของ UI Release#2 (S24)
  }
  else setProps(cell, { Text: v == null ? '' : String(v), Supporting: false });
}
/* บรรทัดรองสีตามสถานะ — Vehicle list ของ UI Release#2 ใช้ Supporting text ผูกตัวแปร Color/text/warning (#DC6803) · Color/text/error (#D92D20) ("ใกล้ครบกำหนดบำรุงรักษา" · "ครบกำหนดบำรุงรักษา")
   ใส่ค่าสีทันที แล้ว bindTones() ผูกตัวแปรของไลบรารีหลังประกอบจอ (หาไม่ได้ก็คงค่าสี) */
const TONE_HEX = { warning: '#DC6803', error: '#D92D20' };
let TONED = [];
const TONE_VARS = {};
function toneText(t, tone) {
  if (!t || t.type !== 'TEXT' || !TONE_HEX[tone]) return;
  try { t.fills = [{ type: 'SOLID', color: rgbOf(TONE_HEX[tone]) }]; TONED.push([t, tone]); } catch (e) { warn('สีบรรทัดรอง', e); }
}
async function libVar(re) {   // ตัวแปรสีของไลบรารีตามชื่อ (แบบ surfaceVar)
  try { const l = (await figma.variables.getLocalVariablesAsync('COLOR')).find(v => re.test(v.name)); if (l) return l; } catch (e) { /* ไม่มี API */ }
  try {
    for (const c of await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()) {
      const v = (await figma.teamLibrary.getVariablesInLibraryCollectionAsync(c.key)).find(x => re.test(x.name));
      if (v) return await figma.variables.importVariableByKeyAsync(v.key);
    }
  } catch (e) { /* ไม่มีสิทธิ์ teamlibrary */ }
  return null;
}
async function bindTones() {
  const list = TONED; TONED = [];
  for (const [t, tone] of list) {
    if (!(tone in TONE_VARS)) TONE_VARS[tone] = await libVar(new RegExp('^Color/text/' + tone + '$', 'i'));
    const v = TONE_VARS[tone]; if (!v) continue;
    try { t.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: rgbOf(TONE_HEX[tone]) }, 'color', v)]; } catch (e) { /* คงค่าสี */ }
  }
}
/* กว้างคอลัมน์ใน instance: w = คงที่ · 0 = ยืดเต็ม — Figma ยอมให้ override ขนาดลูกใน instance ที่เป็น auto layout */
function sizeCol(c, w) {
  try {
    if (w) { c.layoutSizingHorizontal = 'FIXED'; c.resize(w, c.height); } else c.layoutSizingHorizontal = 'FILL';
    c.children.forEach(x => { x.layoutSizingHorizontal = 'FILL'; });
  } catch (e) { warn('ปรับกว้างคอลัมน์ ' + c.name, e); }
}
/* ตาราง = instance ของ component "Table" (รีวิว 19 ต.ค. 2569: เดิมประกอบเองจาก Table cell/Table header cell ⇒ ไม่มีกรอบตาราง)
   Table ของไลบรารีมี 8 คอลัมน์ × 10 แถว ⇒ ซ่อนส่วนที่เกิน · ปิด Scrollbar · Pagination ตาม o.pagination (จำนวนรายการ) */
const TABLE_MAX = { cols: 8, rows: 10 };   // ขนาด component Table ของไลบรารี
const OVERSIZE = [];
async function tbl(cols, rows, o) {   // cols: [หัว, กว้าง, Style, เรียงได้] · ช่อง: ข้อความ | {pill:[t,สี]} | {menu:1} | {icons:[..]} | {check:bool,text}
  o = o || {};
  if (MOB) {
    const m = mobileCards(cols, rows);
    if (!o.pagination) return m;
    const box = col('Table', [m], 20); add(box, await pagination(o.pagination), 'h'); return box;
  }
  if (cols.length > TABLE_MAX.cols || rows.length > TABLE_MAX.rows) {   // ไลบรารีขยายไม่ได้ (instance เพิ่มคอลัมน์/แถวไม่ได้) ⇒ คงแบบเดิม แล้วรายงาน
    OVERSIZE.push(cols.length + ' คอลัมน์ × ' + rows.length + ' แถว');
    const box = col('Table', [tblComposed(cols, rows)], 20); if (o.pagination) add(box, await pagination(o.pagination), 'h'); return box;
  }
  const t = inst('Table', { 'Alternating fills': 'True' }, { Scrollbar: false, Pagination: !!o.pagination });
  t.name = 'Table';
  const wrap = find(t, 'Content with scrollbar'), content = wrap && wrap.children.find(c => c.name === 'Content');
  try { if (wrap) wrap.layoutSizingHorizontal = 'FILL'; if (content) content.layoutSizingHorizontal = 'FILL'; } catch (e) { warn('ยืดตารางเต็มกว้าง', e); }
  const columns = content ? content.children.filter(c => c.name === 'Column') : [];
  if (cols.length > columns.length) warn('Table', 'มี ' + cols.length + ' คอลัมน์ เกิน ' + columns.length + ' ของไลบรารี');
  columns.forEach((c, ci) => {
    if (ci >= cols.length) { c.visible = false; return; }
    const [head, w, style, sort] = cols[ci];
    const [hc, ...cells] = c.children;
    setProps(hc, { Text: head || ' ', 'Sort icon': !!sort, 'Header text': !!head });
    if (sort) { const si = find(hc, 'Sort icon'); if (si) setProps(si, { Icon: sort }); }
    if (rows.length > cells.length) warn('Table', 'มี ' + rows.length + ' แถว เกิน ' + cells.length + ' ของไลบรารี');
    cells.forEach((cell, ri) => { if (ri >= rows.length) { cell.visible = false; return; } fillCell(cell, rows[ri][ci], style, ri % 2 ? 'True' : 'False'); });
    sizeCol(c, w);
  });
  if (o.pagination) { const pg = find(t, 'Table pagination'); if (pg) await fillPagination(pg, o.pagination); }
  return t;
}
async function listCheck(title, items, ticked) {   // List with checkbox (หัว + รายการ)
  const l = inst('List with checkbox');
  const hd = find(l, 'List header item');
  if (hd) { await text(hd, 'Text', title); const b = find(hd, 'Badge outline'); if (b) setProps(b, { Text: String(items.length) });
    const cb = find(hd, 'Checkbox'); if (cb) setProps(cb, { Type: ticked.length === 0 ? 'Unselected' : ticked.length === items.length ? 'Selected' : 'Indeterminate' }); }
  const rows = l.children.filter(c => c.name === 'List with checkbox item');
  rows.forEach((r, i) => {
    if (i >= items.length) { r.visible = false; return; }
    const on = ticked.indexOf(i) >= 0;
    setProps(r, { State: on ? 'Selected' : 'Default' });
    setProps(r, { Text: items[i][0], 'Supporting text': items[i][1] || '', 'Supporting 2': !!items[i][2], 'Supporting text 2': items[i][2] || '', Avatar: false, Supporting: !!items[i][1] });
  });
  const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = false;
  return l;
}
function alertBox(color, title, sub) {
  return inst('Alert', { Color: color }, { Text: title, 'Supporting text': sub || '', Supporting: !!sub, 'Leading icon': true, 'Close icon': false });
}
function pill(t, color) { return inst('Pill outline', { Color: color }, { Text: t }); }

/* ---------- โครงหน้า: Sidebar + Header navigation + Page (ตาม Contract list) ---------- */
async function shell(name, o) {
  if (MOB) {   // mobile: ไม่มี Sidebar · Header navigation Mobile · หน้าเว้นขอบ 16
    const scr = frame(PLUGIN.prefix + ' / ' + name, 'VERTICAL', { fill: WHITE });
    if (PLACE) { scr.x = PLACE.x; scr.y = PLACE.y; }
    scr.counterAxisSizingMode = 'FIXED'; scr.resize(VW(), VH()); scr.primaryAxisSizingMode = 'AUTO'; scr.minHeight = VH(); scr.clipsContent = true;
    add(scr, inst('Header navigation', { Breakpoint: 'Mobile' }), 'h');
    const page = frame('Page', 'VERTICAL', { gap: 24, pad: [16, 16], fill: WHITE });
    add(scr, page, 'h');
    add(page, await pageHead(o), 'h');
    return { scr, page };
  }
  const scr = frame(PLUGIN.prefix + ' / ' + name, 'HORIZONTAL', { fill: WHITE });
  if (PLACE) { scr.x = PLACE.x; scr.y = PLACE.y; }
  scr.primaryAxisSizingMode = 'FIXED'; scr.resize(1440, 1024); scr.counterAxisSizingMode = 'AUTO'; scr.minHeight = 1024; scr.clipsContent = true;
  const sb = inst('Sidebar navigation', { State: 'Collapsed' });
  scr.appendChild(sb); try { sb.layoutSizingVertical = 'FILL'; } catch (e) { /* สูงตามตัวเองก็ได้ */ }
  const navs = sb.findAll(n => n.name === 'Nav button'); if (navs[0]) setProps(navs[0], { State: 'Active' });
  const ctn = frame('Container', 'VERTICAL', { fill: WHITE });
  scr.appendChild(ctn); ctn.layoutGrow = 1;
  add(ctn, inst('Header navigation', { Breakpoint: 'Tablet' }), 'h');   // รีวิว 19 ต.ค. 2569: จอ desktop ใช้ Header navigation แบบ Tablet
  const page = frame('Page', 'VERTICAL', { gap: 32, pad: 32, fill: WHITE });
  add(ctn, page, 'h');
  add(page, await pageHead(o), 'h');
  return { scr, page };
}
/* Page header: crumbs = ลิงก์ระดับกลาง · ปุ่มขวาตาม o.primary (Actions ของ Page header) หรือ o.actions (กรอบแยก — ปุ่มลบสีแดงไม่มีใน Page header) */
async function pageHead(o) {
  const ph = inst('Page header', { Breakpoint: BP() }, { Title: o.title, 'Supporting text': false, Badge: !!o.badge,
    'Back action': !!o.back, 'Copy action': false, 'More actions': false, Actions: !!o.primary });
  const crumbs = [o.root || PLUGIN.menu].concat(o.crumbs || []);   // o.root = เมนูอื่นของระบบ (เช่น ยานพาหนะ ของ Vehicle Management · S24 4 พ.ย. 2569)
  for (const [i, n] of ['Link 1', 'Link 2', 'Link 3'].entries()) {
    const l = find(ph, n); if (!l) continue;
    if (i < crumbs.length - 1) { const lk = find(l, 'Link'); if (lk) await text(l, lk, crumbs[i]); } else l.visible = false;
  }
  const tr = find(ph, 'Truncate link'); if (tr) tr.visible = false;
  const cur = find(ph, 'Current link'); if (cur) await text(cur, 'Link', crumbs[crumbs.length - 1]);
  if (crumbs.length === 1) { /* หน้าแรกของเมนู: ลิงก์ปัจจุบันคือชื่อเมนูเอง */ }
  if (o.badge) { const b = find(ph, 'Badge outline'); if (b) setProps(b, { Color: BADGE_OF[o.badge[1]] || 'Gray', Text: o.badge[0] }); }
  const acts = find(ph, 'Actions');
  if (acts && !o.primary) acts.visible = false;   // ตรงกับ property Actions=false (5 พ.ย. 2569 ตัวตรวจ R56 ดูการมองเห็นของชั้น)
  if (acts && o.primary) for (const b of acts.children) {
    if (b.name !== 'Primary button') { b.visible = false; continue; }
    setProps(b, { Text: o.primary, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') });
  }
  if (!o.actions) return ph;
  if (MOB) {   // mobile: ปุ่มของหน้าเรียงใต้หัวหน้า แบ่งครึ่ง
    const w = frame('Page header', 'VERTICAL', { gap: 16 });
    add(w, ph, 'h');
    const ab = frame('Actions', 'HORIZONTAL', { gap: 12 });
    o.actions.forEach(a => { const b = btn(a[0], a[1], { icon: a[2] }); ab.appendChild(b); b.layoutGrow = 1; });
    add(w, ab, 'h');
    return w;
  }
  const wrap = row('Page header', [], { gap: 12, hug: true, align: 'MAX' });
  wrap.appendChild(ph); ph.layoutGrow = 1;
  const ab = row('Actions', o.actions.map(a => btn(a[0], a[1], { icon: a[2] })), { gap: 12, hug: true });
  wrap.appendChild(ab);
  return wrap;
}
/* แถวปุ่มท้ายหน้า: 2 ปุ่มขึ้นไป = ปุ่มแรก (ย้อนกลับ/ยกเลิก) ชิดซ้าย ปุ่มสุดท้ายชิดขวา — เจ้าของงานแก้ในแบบจริง 19 ต.ค. 2569 */
const btnRow = (list) => {
  if (MOB) {   // mobile: ปุ่มเต็มแถว แบ่งเท่ากัน (แบบ Bottom sheet footer ของไลบรารี)
    const r = frame('Actions', 'HORIZONTAL', { gap: 16 });
    list.forEach(b => { const n = btn(b[0], b[1], Object.assign({}, b[2] || {}, { size: 'lg' })); r.appendChild(n); n.layoutGrow = 1; });
    return r;
  }
  const r = row('Actions', list.map(b => btn(b[0], b[1], b[2] || {})), { gap: 12, hug: true, keep: true });
  r.primaryAxisAlignItems = list.length > 1 ? 'SPACE_BETWEEN' : 'MAX';   // ปุ่มเดียวก็ชิดขวา
  return r;
};

/* ---------- ชั้นบน ---------- */
function overlay(scr, node, x, y) { scr.appendChild(node); node.layoutPositioning = 'ABSOLUTE'; node.x = x; node.y = y; return node; }
function notify(scr, title, err) {
  const n = inst('Notification', { Type: err ? 'Error' : 'Success', Breakpoint: BP() }, { Text: title, Actions: false });
  const sup = find(n, 'Supporting text'); if (sup) sup.visible = false;
  /* toast ขวาบนเสมอ ไม่อยู่ตรงกลาง (เจ้าของงาน 5 พ.ย. 2569 "toast จะขึ้นที่มุมขวาบน เสมอ ไม่อยู่ตรงกลาง" · รีวิวทีมออกแบบ S2 "แสดง Toast ด้านบนขวา")
     Desktop: variant ของ Notification จัดการ์ดบนขวาในตัว (justify MIN · pt 24 · pr 24) แบบที่ Flow การซ่อมวาง "อนุมัติรายการสำเร็จ" ⇒ วาง instance ชิดขอบบนขวา
     Mobile: variant จัดการ์ดล่างกลาง (justify MAX · align CENTER · pb 16) ⇒ override การจัดวาง auto layout ของ instance เป็นบนขวา ขอบ 16 แล้ววางชิดขอบบนขวา (การ์ดเป็นของไลบรารีเหมือนเดิม) */
  if (MOB) { try { n.primaryAxisAlignItems = 'MIN'; n.counterAxisAlignItems = 'MAX'; n.paddingTop = 16; n.paddingBottom = 0; } catch (e) { warn('toast มือถือขวาบน', e); } }
  overlay(scr, n, VW() - n.width, 0);
}
/* bottom sheet ประกอบจากชิ้นไลบรารี (Bottom sheet ของไลบรารีล็อกเนื้อหาตายตัว) — แบบเดียวกับที่ UI Release#2 ประกอบแผงตัวกรอง */
/* แผงตัวกรองด้านข้าง — ตาม Filter ของ Vehicle list (UI Release#2): Background overlay + Side panel header "ตัวกรอง" + dropdown + Side panel footer
   (ประกอบจากชิ้นไลบรารีแบบ filterPanelCF ของ Overhaul · component-rules §7) · มือถือ = bottom sheet */
async function filterPanel(scr, content, o) {
  o = o || {};
  if (MOB) { await sheet(scr, { title: 'ตัวกรอง', action: 'ล้างตัวกรอง', content, ok: 'ตกลง' }); return; }
  overlay(scr, inst('Background overlay'), 0, 0).resize(1440, Math.max(1024, scr.height));
  const panel = frame('Panel', 'VERTICAL', { gap: 24, fill: WHITE });
  overlay(scr, panel, 960, 0); panel.primaryAxisSizingMode = 'FIXED'; panel.counterAxisSizingMode = 'FIXED'; panel.resize(480, 1024);
  const hd = inst('Side panel header'); add(panel, hd, 'h'); hide(hd, 'Tabs');
  await text(hd, 'Text', 'ตัวกรอง'); await text(hd, 'Supporting text', 'กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ');
  const body = frame('Content', 'VERTICAL', { gap: 24, pad: [0, 24] }); add(panel, body, 'both');
  for (const n of content) add(body, n, 'h');
  const ft = inst('Side panel footer'); add(panel, ft, 'h');
  [['Tertiary brand button', 'ล้างตัวกรอง'], ['Secondary button', 'ยกเลิก'], ['Primary button', 'ตกลง']].forEach(([k, t]) => { const b = find(ft, k); if (b) setProps(b, { Text: t, 'Leading icon': false, 'Trailing icon': false }); });
  return panel;
}
async function sheet(scr, o) {
  overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), VH());
  const sh = frame('Sheet', 'VERTICAL', { fill: WHITE });
  sh.topLeftRadius = sh.topRightRadius = 24;
  overlay(scr, sh, 0, 0); sh.counterAxisSizingMode = 'FIXED'; sh.resize(VW(), sh.height);
  const hd = inst('Bottom sheet header'); add(sh, hd, 'h');
  const ta = find(hd, 'Text and action');
  if (o.title && ta) {
    await text(ta, 'Text', o.title);
    const tb = find(ta, 'Tertiary button'); if (tb) tb.visible = false;
    const br = find(ta, 'Tertiary brand button'); if (br) { if (o.action) setProps(br, { Text: o.action, 'Leading icon': false, 'Trailing icon': false }); else br.visible = false; }
  } else { if (ta) ta.visible = false; const dv = find(hd, 'Divider'); if (dv) dv.visible = false; }
  const body = frame('Content', 'VERTICAL', { gap: 16, pad: [0, 16] });
  add(sh, body, 'h');
  for (const n of (o.content || [])) add(body, n, 'h');
  const ft = inst('Bottom sheet footer'); add(sh, ft, 'h');
  const sb = find(ft, 'Secondary button'); if (sb) setProps(sb, { Text: o.cancel || 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
  let pb = find(ft, 'Primary button');
  if (pb && o.danger) { try { pb.swapComponent(main('Primary danger button', { State: 'Default', Size: 'lg' })); } catch (e) { warn('ปุ่มลบสีแดงใน bottom sheet', e); } }
  if (pb) setProps(pb, { Text: o.ok || 'ยืนยัน', 'Leading icon': false, 'Trailing icon': false });
  sh.y = VH() - sh.height;
  return { sh, body };
}
/* หัว popup ตั้งผ่าน property ของ Modal header (Title · Supporting · Supporting text) — 3 พ.ย. 2569 เจ้าของงานเจอ popup แก้ไขเบอร์/สถานที่ขึ้นหัวตั้งต้น "แก้ไขข้อมูลผู้ใช้ยานพาหนะ"
   เดิมใช้ text(hd, 'Text') ซึ่งเจอข้อความในปุ่มย้อนกลับ (Tertiary button ที่ซ่อนอยู่) ก่อนหัวเรื่องจริง */
function modalHead(hd, title, sub, extra) {
  if (!hd) return;
  setProps(hd, Object.assign({ Title: title || '', Supporting: !!sub }, sub ? { 'Supporting text': sub } : {}, extra || {}));
}
async function confirm(scr, o) {   // Modal กลาง — danger = Destructive · อื่น = Centered image (ซ่อนรูป) · mobile = bottom sheet
  if (MOB) {
    const mh = inst('Modal header', { Alignment: 'Center' });
    modalHead(mh, o.title, o.sub, { 'Back icon': false, 'Close icon': false, Divider: false });
    const r = await sheet(scr, { content: [mh], danger: o.danger, ok: o.ok, cancel: o.cancel });
    r.body.paddingLeft = r.body.paddingRight = 0;
    return;
  }
  const m = inst('Modal', { Type: o.danger ? 'Destructive centered image with input' : 'Centered image', Size: 'md' });
  overlay(scr, m, 0, 0);
  hide(m, 'Content'); if (o.danger) hide(m, 'Form');
  modalHead(find(m, 'Modal header'), o.title, o.sub);
  const sb = find(m, 'Secondary button'); if (sb) setProps(sb, { Text: o.cancel || 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
  const pb = find(m, o.danger ? 'Primary danger button' : 'Primary button'); if (pb) setProps(pb, { Text: o.ok || 'ยืนยัน', 'Leading icon': false, 'Trailing icon': false });
}
async function formModal(scr, o) {   // Modal Type=Form · แถวที่ 2 สลับเป็น Text area ด้วย property "Input 1 swap" ของ Card form row · o.ok / o.cancel = ชื่อปุ่ม (ค่าเริ่ม บันทึก / ยกเลิก · 22 ต.ค. 2569 ใช้กับ "ส่งกลับ" "ปฏิเสธ")
  if (MOB) { await sheet(scr, { title: o.title, content: [].concat(...o.fields.map(f => f.pair || [f])).map(f => f.area ? area(f.label, f.value) : field(f.label, f.value, { optional: f.optional })), ok: o.ok || 'บันทึก', cancel: o.cancel }); return; }
  const m = inst('Modal', { Type: 'Form', Size: 'md' });
  overlay(scr, m, 0, 0);
  modalHead(find(m, 'Modal header'), o.title, o.sub, { 'Back icon': false, 'Featured icon': false });
  const rows = (find(m, 'Form') || m).children.filter(c => c.name === 'Card form row');
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (i >= o.fields.length) { r.visible = false; continue; }
    /* f.pair = [ช่องซ้าย, ช่องขวา] ใช้ Input 2 ของ Card form row (5 พ.ย. 2569 popup ระบุอะไหล่เพิ่มเติม 6 ช่อง: ชื่อ · ยี่ห้อ / รุ่น · รหัส / จำนวน · หน่วย) */
    if (o.fields[i].pair) {
      setProps(r, { 'Input 2': true });
      const ins = r.children.filter(c => c.type === 'INSTANCE');
      if (ins[1]) ins[1].visible = true;
      for (const [k, pf] of o.fields[i].pair.entries()) { const inp = ins[k]; if (!inp) continue;
        setProps(inp, { State: pf.value ? 'Filled' : 'Default' });
        setProps(inp, { 'Label text': pf.label, Text: pf.value || pf.placeholder || '', Optional: !!pf.optional, Helper: false, 'Info icon': false, 'Show Placeholder': !pf.value });
        syncLabel(inp, pf.label, pf.optional);
        const ct = find(inp, 'Container'), tv = ct && ct.findOne(n => n.type === 'TEXT' && n.visible !== false);
        if (tv && (pf.value || pf.placeholder) && tv.characters !== (pf.value || pf.placeholder)) await text(ct, tv, pf.value || pf.placeholder); }
      continue;
    }
    const f = o.fields[i];
    setProps(r, { 'Input 2': false });
    if (f.area) setProps(r, { 'Input 1 swap': main('Text area', { State: 'Filled', Size: 'md' }).id });
    const inp = r.children.find(c => c.type === 'INSTANCE' && c.visible !== false);
    if (inp) setProps(inp, { State: f.value ? 'Filled' : 'Default' });
    if (inp) setProps(inp, { 'Label text': f.label, Text: f.value || f.placeholder || '', Optional: !!f.optional, Helper: false, 'Info icon': false, 'Show Placeholder': !f.value });
    if (inp) syncLabel(inp, f.label, f.optional);   // ป้ายที่เห็นคือ Input label ที่ซ้อน (ตาม Overhaul) — เดิมไม่ตั้ง ป้ายเลยค้าง "ผู้ใช้ยานพาหนะ" ของไลบรารี
    const ct = inp && !f.area && find(inp, 'Container'), tv = ct && ct.findOne(n => n.type === 'TEXT' && n.visible !== false);
    if (tv && f.value && tv.characters !== f.value) await text(ct, tv, f.value);   // 3 พ.ย. 2569 ไฟล์จริงช่องขึ้นว่าง — ค่าที่เห็นไม่ตรง property ก็ใส่ที่ข้อความโดยตรง
  }
  /* ปุ่มของ Modal Type=Form อยู่ใน Modal footer > Actions > "Primary and secondary actions" (ไม่ใช่ลูกของ Actions ตรงๆ) — เดิมกรองแค่ parent = Actions ปุ่มหลักเลยค้างคำของไลบรารี
     (ชีตลูกค้า 5 พ.ย. 2569: popup ตีกลับขึ้น "บันทึก" แทน "ตีกลับ" · popup ระบุอะไหล่เพิ่มเติมขึ้น "บันทึก" แทน "เพิ่ม") */
  const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && (n.parent.name === 'Actions' || n.parent.name === 'Primary and secondary actions'));
  ft.forEach(b => {
    if (b.name === 'Primary button') setProps(b, { Text: o.ok || 'บันทึก', 'Leading icon': false, 'Trailing icon': false });
    else if (b.name === 'Secondary button') setProps(b, { Text: o.cancel || 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
    else b.visible = false;
  });
}
/* 4 พ.ย. 2569 เจ้าของงาน "จังหวะที่เป็น dropdown ต้องชิดกับจุดที่เลือก" — วางรายการตอนสร้างจอ แล้ว stripDividers/polish ทำให้ของเหนือช่องเตี้ยลง ช่องเลื่อนขึ้นแต่รายการค้างที่เดิม
   ⇒ จำวิธีวางไว้ (PINS) แล้ววางซ้ำอีกรอบหลังจอเสร็จ (repin ใน buildGrid) รายการจึงอยู่ใต้ช่อง 4 px / เมนูชิดปุ่ม "…" ตามตำแหน่งสุดท้ายของช่อง */
let PINS = [];
function pin(place) { place(); PINS.push(place); }
function repin() { const p = PINS; PINS = []; for (const f of p) { try { f(); } catch (e) { /* ช่องถูกลบไปแล้ว */ } } }
let MENU_SHEET = false;
/* ช่องของ Dropdown menu: 3 รายการ = 0 1 (เส้นคั่น) 4 แบบเดิม · 4 รายการ = 0 1 2 (เส้นคั่น) 4 — รายการสุดท้าย (ลบ) อยู่ใต้เส้นคั่นเสมอ (12 พ.ย. 2569 เมนูยานพาหนะของฟอร์มแผนเพิ่ม ย้ายไปไตรมาสอื่น) */
const slotsOf = (items) => items.length > 3 ? { 0: items[0], 1: items[1], 2: items[2], 3: 'divider', 4: items[3] } : { 0: items[0], 1: items[1], 3: 'divider', 4: items[2] };
function menuAt(scr, anchor, items) {   // Dropdown menu ใต้ปุ่ม "…" · mobile = ไม่เปิดเมนู เพราะการ์ดมือถือแสดงไอคอนดู แก้ไข ลบ ครบแล้ว (4 พ.ย. 2569) · ตั้ง MENU_SHEET = true ถ้าจะกลับไปใช้ bottom sheet
  if (MOB && !MENU_SHEET) return null;
  if (MOB) {
    overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), VH());
    const sh = frame('Sheet', 'VERTICAL', { fill: WHITE, pad: [0, 0] }); sh.topLeftRadius = sh.topRightRadius = 24;
    overlay(scr, sh, 0, 0); sh.counterAxisSizingMode = 'FIXED'; sh.resize(VW(), sh.height);
    const hd = inst('Bottom sheet header'); add(sh, hd, 'h'); const ta = find(hd, 'Text and action'); if (ta) ta.visible = false; const dv = find(hd, 'Divider'); if (dv) dv.visible = false;
    const m = inst('Dropdown menu'); add(sh, m, 'h'); hide(m, '_Dropdown menu header');
    const list = (find(m, 'Menu items') || m).children; const want = slotsOf(items);
    list.forEach((it, i) => { const w = want[i]; if (!w) { it.visible = false; return; } if (w !== 'divider') setProps(it, { Text: w[0], Shortcut: false, Icon: true, 'Icon swap': icon(w[1]) }); });
    m.strokes = []; sh.y = VH() - sh.height;
    return m;
  }
  const m = inst('Dropdown menu');
  hide(m, '_Dropdown menu header');
  const list = (find(m, 'Menu items') || m).children;
  const want = slotsOf(items);
  list.forEach((it, i) => {
    const w = want[i];
    if (!w) { it.visible = false; return; }
    if (w !== 'divider') setProps(it, { Text: w[0], Shortcut: false, Icon: true, 'Icon swap': icon(w[1]) });
  });
  overlay(scr, m, 0, 0);
  if (anchor) pin(() => { const sb = scr.absoluteBoundingBox, ab = anchor.absoluteBoundingBox; m.x = ab.x - sb.x + ab.width - m.width - 16; m.y = ab.y - sb.y + ab.height - 8; });
  return m;
}
const MENU = [['ดูรายละเอียด', 'quick_reference_all-24-300-round'], ['แก้ไข', 'stylus-24-300-round'], ['ลบ', 'delete-24-300-round']];
function comboAt(scr, anchor, items) {   // Dropdown list ใต้ช่องพิมพ์ค้น
  const l = inst('Dropdown list');
  const rows = l.children.filter(n => n.name === 'Dropdown list item');
  rows.forEach((it, i) => {
    if (i >= items.length) { it.visible = false; return; }
    setProps(it, { State: items[i][2] ? 'Selected' : 'Default' });
    setProps(it, { Text: items[i][0], 'Supporting text': items[i][1] || '', Avatar: false, 'Supporting 2': false, Supporting: !!items[i][1] });   // ไม่ส่งบรรทัดรอง = แถวเดียว (เลือกรถ: ทะเบียนอย่างเดียว · ยกจาก Overhaul R24)
  });
  const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = items.length > rows.length;   // รายการเกินแถวของไลบรารี (5) = คง scrollbar ไว้ (5 พ.ย. 2569 เขตของหลายภาค)
  overlay(scr, l, 0, 0);
  if (anchor) pin(() => { const sb = scr.absoluteBoundingBox, ab = anchor.absoluteBoundingBox; l.resize(ab.width, l.height); l.x = ab.x - sb.x; l.y = ab.y - sb.y + ab.height + 4; });
}

/* ---------- แถบค้นหา + แบ่งหน้า (ตาม Table header / Table pagination ของไลบรารี) ---------- */
/* o.title + o.badge = หัวตาราง "ชื่อ" + Badge outline (เช่น "ยานพาหนะ" "5 คัน" ของ Vehicle list ใน UI Release#2) · o.filterCount = Pill บนปุ่มตัวกรอง (ช่องแรกของ Actions มี Pill outline ในตัว)
   o.more = [{ text, disabled }] ปุ่ม Secondary ช่องถัดไป (เช่น "จัดลงไตรมาส" แบบปุ่ม "รายงาน" ของ Export reports - Select vehicles · ช่องนี้ใน Table header ของไฟล์ Component ไม่มี Pill ⇒ จำนวนต่อท้ายข้อความ) — 5 พ.ย. 2569 */
async function tableHeader(o) {
  const th = inst('Table header', { Breakpoint: BP() }, { 'Table title': !!o.title, Badge: o.badge != null, 'Supporting text': false, 'More actions': false, Filters: !!(o.chips && o.chips.length) });
  if (o.title) { setProps(th, { Title: o.title }); const tt = find(th, 'Front Section'); const tx = tt && tt.findOne(n => n.type === 'TEXT'); if (tx) await text(tt, tx, o.title); }
  if (o.badge != null) { const b = find(th, 'Badge outline'); if (b) setProps(b, { Text: String(o.badge) }); }
  const ti = find(th, 'Text input');
  if (ti) setProps(ti, { Label: false, Helper: false, 'Trailing icon': false, Text: o.query || o.placeholder || PLUGIN.searchHint, State: o.query ? 'Filled' : 'Default' });
  const acts = find(th, 'Actions'), more = (o.more || []).slice();
  if (acts) { let first = true; for (const b of acts.children) {
    if (b.name === 'Secondary button' && first && o.add) { first = false; setProps(b, { Text: o.add, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') }); const p = find(b, 'Pill outline'); if (p) p.visible = false; }   // o.add = ปุ่มเพิ่มแทนตัวกรอง (ฟอร์มแผนแท็บไตรมาส 12 พ.ย. 2569)
    else if (b.name === 'Secondary button' && first && o.noFilter) { first = false; b.visible = false; }
    else if (b.name === 'Secondary button' && first) { first = false; setProps(b, { Text: 'ตัวกรอง', 'Leading icon': true, 'Leading icon swap': icon('filter_list-24-400-round') }); const p = find(b, 'Pill outline'); if (p) { if (o.filterCount) setProps(p, { Text: String(o.filterCount) }); else p.visible = false; } }
    else if (b.name === 'Secondary button' && more.length) { const m = more.shift(); b.visible = true; setProps(b, { Text: m.text, 'Leading icon': !!m.icon, 'Trailing icon': false, State: m.disabled ? 'Disabled' : 'Default' }); if (m.icon) setProps(b, { 'Leading icon swap': icon(m.icon) }); }
    else if (o.primary && b.name === 'Primary button') setProps(b, { Text: o.primary, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') });
    else if (o.primary && MOB && b.name === 'Secondary button' && !acts.children.some(x => x.name === 'Primary button')) {   // Table header Mobile มีแค่ Secondary 2 ช่อง ⇒ สลับช่องที่ 2 เป็น Primary แบบ Request list ของ 5.10 Vehicle In Use (EV) · UI Release#2
      try { b.swapComponent(main('Primary button', { State: 'Default', Size: 'lg' })); b.name = 'Primary button'; setProps(b, { Text: o.primary, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') }); } catch (e) { warn('ปุ่มหลักใน Table header มือถือ', e); }
    }
    else b.visible = false; } }   // o.primary = ปุ่มหลักขวาของ "ตัวกรอง" (5 พ.ย. 2569 รีวิวทีมออกแบบ · ตาม Incident list ของ 5.5 Repair & Maintenance Job (Admin) ใน UI Release#2)
  th.findAll(n => n.name === 'Badge outline with remove icon').forEach((c, i) => { if (o.chips && i < o.chips.length) setProps(c, { Text: o.chips[i] }); else c.visible = false; });
  return th;
}
async function pagination(n) { return fillPagination(inst('Table pagination', { Breakpoint: BP() }), n); }
async function fillPagination(pg, n) {   // n = จำนวนแถว · { shown, total } = แถวมากกว่าที่ Table แสดงได้ (10 แถว) แสดงหน้าแรก (4 พ.ย. 2569)
  const shown = typeof n === 'object' ? n.shown : n, total = typeof n === 'object' ? n.total : n;
  const tx = find(pg, 'Text'); if (tx && tx.type === 'TEXT') await text(pg, tx, 'แสดง 1 ถึง ' + shown + ' จาก ' + total + ' รายการ');
  const items = pg.findAll(x => x.name === 'Button groups pagination item');
  const pages = Math.max(1, Math.ceil(total / Math.max(1, shown)));
  items.forEach((it, i) => { if (i === 0 || (i === items.length - 1 && pages === 1)) setProps(it, { State: 'Disabled' }); else if (i === items.length - 1) { /* ไปหน้าถัดไปได้ */ } else if (i >= 1 && i <= pages) setProps(it, { Number: String(i) }); else it.visible = false; });
  return pg;
}
const firstMenuCell = (scr) => scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Table cell' && n.variantProperties && n.variantProperties.Style === 'Action icons')[0];

/* ปิดเส้นคั่นทุกจุดในจอ (เจ้าของงานสั่ง 19 ต.ค. 2569 "disable divider ออกให้หมด") — property Divider → false · layer Divider/Content divider → ซ่อน */
function stripDividers(root) {
  let n = 0;
  const all = [root].concat(root.findAll(() => true));
  for (const node of all) {
    if (node.type === 'INSTANCE') {
      const cp = node.componentProperties || {};
      const key = Object.keys(cp).find(k => k.split('#')[0] === 'Divider');
      if (key && cp[key].type === 'BOOLEAN' && cp[key].value !== false) { try { node.setProperties({ [key]: false }); n++; } catch (e) { warn('ปิด Divider ' + node.name, e); } }
      if (key && cp[key].type === 'VARIANT' && cp[key].value === 'True') { node.visible = false; n++; }
    }
    if ((node.name === 'Divider' || node.name === 'Content divider') && node.visible !== false && node !== root) { node.visible = false; n++; }
  }
  return n;
}

/* แต่งจอตามรีวิว 19 ต.ค. 2569: ปิด Info icon ของ Input label · กล่องแสดงข้อมูล (display) */
async function polish(root) {
  let info = 0, disp = 0;
  for (const l of root.findAll(n => n.type === 'INSTANCE' && n.name === 'Input label')) {
    const cp = l.componentProperties || {}, k = Object.keys(cp).find(x => x.split('#')[0] === 'Info icon');
    if (k && cp[k].value !== false) { setProps(l, { 'Info icon': false }); info++; }
  }
  for (const n of root.findAll(n => n.type === 'INSTANCE' && (n.name === 'Text input' || n.name === 'Input dropdown' || n.name === 'Text area'))) {
    const cp = n.componentProperties || {}, k = Object.keys(cp).find(x => x.split('#')[0] === 'Info icon');
    if (k && cp[k].value !== false) { setProps(n, { 'Info icon': false }); info++; }
  }
  // R5: Section label / Section header ที่ยืมมาจาก component ของ flow อื่น อาจเปิด Info icon / More actions ไว้ — ปิดให้ทุกตัว (20 ต.ค. 2569)
  for (const n of root.findAll(n => n.type === 'INSTANCE' && (n.name === 'Section label' || n.name === 'Section header'))) {
    const cp = n.componentProperties || {};
    const fix = {};
    for (const k of ['Info icon', 'More actions']) { const key = Object.keys(cp).find(x => x.split('#')[0] === k); if (key && cp[key].value !== false) fix[k] = false; }
    if (Object.keys(fix).length) { setProps(n, fix); info++; }
  }
  for (const b of root.findAll(n => n.type === 'FRAME' && n.name === 'Content item' && n.children.some(c => c.name === 'Content item row'))) { await displayBox(b); disp++; }
  return { info, disp };
}

/* รายงานตารางที่เกินขนาด component Table ของไลบรารี (ต้องประกอบเอง — รอเจ้าของงานเคาะ) */
function reportOversize() {
  if (!OVERSIZE.length) return;
  const by = {}; OVERSIZE.forEach(x => { by[x] = (by[x] || 0) + 1; });
  log('· ตารางที่ใหญ่กว่า component Table ของไลบรารี (' + TABLE_MAX.cols + ' คอลัมน์ × ' + TABLE_MAX.rows + ' แถว) คงแบบประกอบเองไว้ ' + OVERSIZE.length + ' ตาราง: ' + Object.keys(by).map(k => k + ' ×' + by[k]).join(' · ') + ' — รอเจ้าของงานเคาะ');
  OVERSIZE.length = 0;
}
function findInstanceAncestor(n) { let p = n.parent; while (p) { if (p.type === 'INSTANCE') return p; p = p.parent; } return null; }

/* ---------- จัดวางจอแบบตาราง flow ของทีมออกแบบ (เจ้าของงานสั่ง 20 ต.ค. 2569: "ต่อไปสร้างให้ทำแบบนี้ จนกว่าจะมีการเปลี่ยนแปลง") ----------
   แถบตัวอักษร (Header › State=Default ดำ) → แถบย่อย (State=Sub Flow เทา) → ป้าย state รายคอลัมน์ (State=Sub Flow 2 ฟ้า)
   → แถว Desktop (1440) → แถว Mobile (402) ใต้คอลัมน์เดียวกัน · ป้ายข้างซ้าย = component "Component 1" ของทีมออกแบบ (Type=Header "Device" · Desktop · Mobile)
   ตัวอย่างต้นแบบ: หน้า Flow การซ่อม ไฟล์ Maintain-D (B นัดหมายวันซ่อม › B1 เข้าซ่อมที่… › B1.1 Default …) · ป้ายทุกตัวชื่อ "<prefix> · …" ปลั๊กอินล้างตอนรันซ้ำ
   Header/State เป็น component จากอีกไลบรารี (หาได้จาก instance ในไฟล์) — เปิดไม่ได้ → วาดแถบธรรมดาสีเดียวกัน (อยู่นอกจอ ไม่กระทบกติกา "ทุกชิ้นในจอเป็น instance") */
const GRID = { side: 300, gap: 80, colW: 1440, colGap: 200, rowGap: 160, groupGap: 400, barH: 120, stateW: 344, mobW: 402, deskH: 1024, mobH: 874 };
const BAR_FILL = { Default: '#101828', 'Sub Flow': '#667085', 'Sub Flow 2': '#9CACCC' };
let HEADER_BROKEN = false;   // แถบ Header ของทีมออกแบบใส่ข้อความไม่ได้ (ฟอนต์หาย) → ใช้แถบธรรมดาตลอดรอบ
const rgbOf = (hex) => ({ r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255 });
let LABEL_FONT;
async function labelText(chars, size, hex) {
  if (!LABEL_FONT) LABEL_FONT = (await fallbackFont()) || { family: 'Inter', style: 'Regular' };
  const t = figma.createText(); CREATED.push(t);
  t.fontName = LABEL_FONT; t.fontSize = size; t.characters = chars; t.fills = [{ type: 'SOLID', color: rgbOf(hex) }];
  return t;
}
function fixed(f, w, h) { f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; f.resize(w, h); return f; }
async function flowBar(prefix, code, title, state, width, desc) {
  let bar = null;
  if (INDEX.has('Header') && !HEADER_BROKEN) {
    bar = inst('Header', { Type: 'Subheader' });
    const st = find(bar, 'State');
    if (st) setProps(st, { State: state });
    // Flow เป็น property ข้อความที่ผูกฟอนต์ของ component (LINE Seed Sans) — ตั้งตัวอักษรตรงๆ ผ่าน text() ที่สลับฟอนต์สำรองให้เมื่อเครื่องไม่มี
    const okCode = st ? await text(st, 'Text', code) : false;
    const det = find(bar, 'Detail'); const ts = det ? det.children.filter(c => c.type === 'TEXT') : [];
    const okTitle = ts[0] ? await text(det, ts[0], title) : false;
    /* บรรทัดที่ 2 = เงื่อนไขของ state (แบบตัวอย่าง "เงื่อนไขการแสดงผล …" ใน Design Annotations · 10 พ.ย. 2569) — ไม่มีก็ซ่อน */
    if (ts[1]) { if (desc && await text(det, ts[1], desc)) { try { ts[1].layoutSizingHorizontal = 'FILL'; ts[1].textAutoResize = 'HEIGHT'; } catch (e) { /* ปล่อยกว้างตาม component */ } } else ts[1].visible = false; }
    if (!(okCode && okTitle)) {   // ใส่ข้อความไม่ได้ (ฟอนต์/โครง) → ป้ายจะไม่ตรง scenario ⇒ ถอยไปแถบธรรมดาทั้งชุด
      try { bar.remove(); } catch (e) { /* ลบไม่ได้ ปล่อย */ }
      bar = null; HEADER_BROKEN = true;
      log('⚠ แถบ Header ของทีมออกแบบใส่ข้อความไม่ได้ (ฟอนต์ของ component ไม่มีในเครื่อง) — ใช้แถบธรรมดาสีเดียวกันแทนทั้งชุด');
    } else {
      try { bar.resize(width, bar.height); } catch (e) { warn('ปรับกว้างแถบ ' + code, e); }
      /* ชื่อยาวไม่ล้นไปทับคอลัมน์ข้าง (เจ้าของงาน 10 พ.ย. 2569 ส่งภาพ V.4.1 ทับ V.4.2 "ปรับกล่องให้เหมาะสมกับคำ"):
         ข้อความกว้างเต็ม Detail แล้วขึ้นบรรทัดใหม่ · แถบสูงตามข้อความ (กว้างคงเท่าจอ) · กล่องรหัสยืดสูงตาม */
      try { ts[0].layoutSizingHorizontal = 'FILL'; ts[0].textAutoResize = 'HEIGHT'; bar.counterAxisSizingMode = 'AUTO'; if (st) st.layoutSizingVertical = 'FILL'; } catch (e) { warn('ตัดบรรทัดแถบ ' + code, e); }
    }
  }
  if (!bar) {   // แถบธรรมดา: กว้างคงที่ สูงตามข้อความ (อย่างน้อย GRID.barH) · ชื่อยาวขึ้นบรรทัดใหม่ไม่ล้นคอลัมน์ (10 พ.ย. 2569)
    bar = fixed(frame('Header', 'HORIZONTAL'), width, GRID.barH);
    bar.counterAxisSizingMode = 'AUTO'; bar.minHeight = GRID.barH;
    const st = fixed(frame('State', 'HORIZONTAL', { fill: rgbOf(BAR_FILL[state] || BAR_FILL.Default), pad: [0, 40] }), GRID.stateW, GRID.barH);
    st.primaryAxisAlignItems = 'CENTER'; st.counterAxisAlignItems = 'CENTER'; st.appendChild(await labelText(code, 64, '#FFFFFF')); bar.appendChild(st); st.layoutSizingVertical = 'FILL';
    const det = frame('Detail', 'HORIZONTAL', { fill: WHITE, pad: [24, 40] }); det.counterAxisAlignItems = 'CENTER'; bar.appendChild(det); det.layoutGrow = 1;
    const tt = await labelText(title + (desc ? ' — ' + desc : ''), 48, '#101828'); det.appendChild(tt); tt.layoutSizingHorizontal = 'FILL'; tt.textAutoResize = 'HEIGHT';
  }
  bar.name = prefix + ' · ' + code + ' ' + title + (desc ? ' — ' + desc : '');
  return bar;
}
/* สีป้าย state ตามหน้าจริงของ UI Release#2 (10 พ.ย. 2569): ปกติ Sub Flow (เทา) · ผลสำเร็จ (A - S1 …) Success (เขียว) · ผิดพลาด (A3.1 - F …) Failed (แดง)
   ของเรา: ชื่อจอมี "สำเร็จ" = Success · "Validation" หรือ "ไม่สำเร็จ" = Failed · ที่เหลือ Sub Flow */
const stateTone = (label) => /ไม่สำเร็จ|Validation/.test(label) ? 'Failed' : /สำเร็จ/.test(label) ? 'Success' : 'Sub Flow';
/* หัวหน้า (10 พ.ย. 2569 เจ้าของงาน "ใช้ design จาก component กลาง" — หน้า Design Annotations ของ UI Release#2 · ไฟล์ Backup):
   Header Type=Header = ชื่อใหญ่ + บรรทัดอธิบาย + Header / Status · หน้าจริงของไฟล์ (5.1–5.17) ใช้ "1 ตัวต่อหน้า" เป็นชื่อขอบเขตงาน สถานะ Ready for Review / Work In Progress
   บรรทัดอธิบายซ่อน · บล็อกตัวอักษรไม่ใช้ตัวนี้ (ใช้ Subheader State=Default) · ใช้กับหัวหน้าของชุดจอ และแถบ Journey
   component ไม่มี variant Type=Header (ชุดเก่าในไฟล์) หรือใส่ข้อความไม่ได้ → แถบ Subheader แบบเดิม */
async function blockHeader(prefix, code, title, width, desc, status) {
  const set = INDEX.get('Header');
  const top = !HEADER_BROKEN && set && set.type === 'COMPONENT_SET' && set.children.some(c => c.variantProperties && c.variantProperties.Type === 'Header');
  if (!top) return flowBar(prefix, code, title, 'Default', width);
  const bar = inst('Header', { Type: 'Header' });
  const ts = bar.children.filter(c => c.type === 'TEXT');
  if (!(ts[0] && await text(bar, ts[0], code === 'Page' ? title : code + ' · ' + title))) {
    try { bar.remove(); } catch (e) { /* ลบไม่ได้ ปล่อย */ }
    log('⚠ แถบหัวบล็อก (Header Type=Header) ใส่ข้อความไม่ได้ — ใช้แถบ Subheader แทน');
    return flowBar(prefix, code, title, 'Default', width);
  }
  if (ts[1]) { if (desc && await text(bar, ts[1], desc)) { try { ts[1].textAutoResize = 'HEIGHT'; } catch (e) { /* ปล่อย */ } } else ts[1].visible = false; }
  const hs = find(bar, 'Header / Status');   // ค่าที่หน้าจริงใช้: Work In Progress (ค่าตั้งต้นของ component) · Ready for Review
  if (hs && !status) hs.visible = false;   // ไม่ส่งสถานะ = ซ่อนป้าย (เจ้าของงาน 10 พ.ย. 2569 "แถบ Journey เอาป้าย Work In Progress ออกด้วย")
  else if (hs && Object.keys(hs.componentProperties || {}).some(k => k.split('#')[0] === 'Property 1')) setProps(hs, { 'Property 1': status });
  else if (hs && status !== 'Work In Progress') warn('Header / Status', 'เปลี่ยนเป็น ' + status + ' ไม่ได้ (component ไม่เปิด property)');
  try { bar.resize(width, bar.height); } catch (e) { warn('ปรับกว้างแถบหัวบล็อก ' + code, e); }
  bar.name = prefix + ' · ' + code + ' ' + title;
  return bar;
}
/* ป้ายข้างจอ (Device · Desktop · Mobile) — เจ้าของงานสั่ง 20 ต.ค. 2569: อ่านจาก component set "Device Type" ของทีมออกแบบ (property Type · กว้าง 300 · พื้น #667085)
   ชื่อ variant จับแบบไม่สนตัวพิมพ์ตาม DEVICE_ALIAS · ไม่พบ set หรือไม่มี variant นั้น → ถอยไป "Component 1" (ชุดเก่า) → กรอบธรรมดา
   (ยกจาก overhaul2-plugin 22 ต.ค. 2569 — ปลั๊กอินบำรุงรักษาใช้ป้ายชุดเดียวกับ Overhaul) */
const DEVICE_ALIAS = { Header: ['device', 'header', 'label'], Desktop: ['desktop'], Mobile: ['mobile'], Tablet: ['tablet'] };
function deviceVariant(kind) {   // → { key, value } ของ variant ใน Device Type ที่ตรง kind · null = ไม่มี
  const set = INDEX.get('Device Type'); if (!set || set.type !== 'COMPONENT_SET') return null;
  const want = DEVICE_ALIAS[kind] || [String(kind).toLowerCase()];
  for (const c of set.children) {
    if (c.type !== 'COMPONENT') continue;
    const vp = c.variantProperties || {};
    for (const k of Object.keys(vp)) if (want.indexOf(String(vp[k]).trim().toLowerCase()) >= 0) return { key: k, value: vp[k] };
  }
  return null;
}
function deviceSetInfo() {   // ข้อความรายงานในหน้าต่างปลั๊กอิน (ปุ่มเช็ค + ตอนสร้าง)
  const set = INDEX.get('Device Type');
  if (!set) return 'ป้ายข้างจอ: ไม่พบ component "Device Type" ในไฟล์ — ' + (INDEX.has('Component 1') ? 'ใช้ "Component 1" (ชุดเก่า) แทน' : 'วาดป้ายธรรมดาแทน');
  const vals = set.type === 'COMPONENT_SET' ? set.children.filter(c => c.type === 'COMPONENT').map(c => Object.keys(c.variantProperties || {}).map(k => k + '=' + c.variantProperties[k]).join(',')).join(' · ') : '(component เดี่ยว ไม่มี variant)';
  const miss = ['Header', 'Desktop', 'Mobile'].filter(k => !deviceVariant(k));
  return 'ป้ายข้างจอ: component "Device Type" [' + vals + ']' + (miss.length ? ' ⚠ ไม่มี variant สำหรับ ' + miss.join(', ') + ' — ป้ายนั้นถอยไป Component 1/กรอบธรรมดา' : ' ✓ ใช้ Device/Desktop/Mobile ครบ');
}
async function deviceLabel(prefix, type, height) {
  let n; const dv = deviceVariant(type);
  if (dv) { n = inst('Device Type', { [dv.key]: dv.value }); try { n.resize(GRID.side, height); } catch (e) { warn('ปรับสูงป้าย ' + type, e); } }
  else if (INDEX.has('Component 1')) { n = inst('Component 1', { Type: type }); try { n.resize(GRID.side, height); } catch (e) { warn('ปรับสูงป้าย ' + type, e); } }
  else { n = fixed(frame('Device', 'VERTICAL', { fill: rgbOf('#667085') }), GRID.side, height); n.primaryAxisAlignItems = 'CENTER'; n.counterAxisAlignItems = 'CENTER'; n.appendChild(await labelText(type === 'Header' ? 'Device' : type, 48, '#FFFFFF')); }
  n.name = prefix + ' · ' + (type === 'Header' ? 'Device' : type);
  return n;
}
/* ตัวเลือกอุปกรณ์จากหน้าต่างปลั๊กอิน: 'desktop' → [false] · 'mobile' → [true] · อื่น ('both') → [false, true] (แถว mobile ใต้ desktop) */
const devOf = (o) => (o && o.devices === 'mobile') ? [true] : (o && o.devices === 'desktop') ? [false] : [false, true];

/* หน้าปลายทาง = หน้าใหม่ทุกครั้ง ไม่แตะชุดเดิม (เจ้าของงานสั่ง 20 ต.ค. 2569 "สร้างใหม่เลย ไม่รบกวนของเดิม"):
   ใช้หน้า <base>-N ที่ยังว่าง (ไม่มีเฟรม/ป้ายของปลั๊กอิน) · ไม่มีก็สร้าง <base>-(N+1) · สร้างหน้าไม่ได้ (แพลนจำกัด) → หน้าปัจจุบัน วางต่อใต้ของเดิม ไม่ลบอะไร */
async function targetPage(base, prefix) {
  const lower = (p) => p.name.trim().toLowerCase();
  const re = new RegExp('^' + base + '-(\\d+)$');
  const pages = figma.root.children.filter(p => re.test(lower(p)));
  const mine = (n) => n.name.indexOf(prefix + ' / ') === 0 || n.name.indexOf(prefix + ' · ') === 0;
  const empty = pages.find(p => !p.children.some(mine));
  if (empty) return { page: empty, fresh: true };
  const next = pages.reduce((m, p) => Math.max(m, +lower(p).match(re)[1]), 0) + 1;
  try { const p = figma.createPage(); p.name = base + '-' + next; return { page: p, fresh: true }; }
  catch (e) { return { page: figma.currentPage, fresh: false }; }
}
/* หน้าปลายทางตามชื่อ (เจ้าของงานสั่ง 22 ต.ค. 2569 "จะเอาลงในเพจ Maintainance ด้วยกันเลย"): หาหน้าที่ชื่อตรง (ไม่สนตัวพิมพ์ · มีอีโมจิ/ช่องว่างนำหน้าได้ · ไม่นับ <ชื่อ>-N)
   ไม่มี → สร้างหน้าชื่อนั้น · สร้างไม่ได้ → หน้าปัจจุบัน · ทุกกรณีวางต่อใต้ของเดิม ไม่ลบ/ไม่ย้ายของที่มีอยู่ */
async function namedPage(names) {
  const want = names.map(n => n.toLowerCase());
  const norm = (p) => p.name.trim().toLowerCase().replace(/^[^a-z0-9ก-๙]+/, '').replace(/[^a-z0-9ก-๙]+$/, '');
  const hit = figma.root.children.find(p => want.indexOf(norm(p)) >= 0);
  if (hit) return { page: hit, fresh: false, found: true };
  try { const p = figma.createPage(); p.name = names[0]; return { page: p, fresh: true, found: false }; }
  catch (e) { return { page: figma.currentPage, fresh: false, found: false, fallback: true }; }
}
/* พื้นที่วางงานของ Figma มีขอบราว ±65,500 เกินแล้วเลื่อนและซูมไปไม่ถึง (2 พ.ย. 2569 จอ S1 ไปอยู่ y=231434 แล้วเจ้าของงานมองไม่เห็น)
   เจ้าของงาน "อยากเพิ่มใน page Maintainance เดิม แทน 2" ⇒ ใต้ของเดิมไม่พอ ให้วางเหนือของเดิมบนหน้าเดียวกัน · เหนือของเดิมก็เต็มแล้วจึงต่อหน้า <ชื่อ>-2 <ชื่อ>-3 …
   ของเดิมไม่ถูกแตะ · ปลั๊กอิน dynamic-page ต้อง loadAsync ก่อนอ่านหน้าที่ยังไม่เปิด */
const CANVAS_MAX = 60000;
const pageBottom = (page) => page.children.reduce((y, n) => n.absoluteBoundingBox ? Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height) : y, 0);
const pageTop = (page) => page.children.reduce((y, n) => n.absoluteBoundingBox ? Math.min(y, n.absoluteBoundingBox.y) : y, CANVAS_MAX);
function spotOn(page, need, gap, skip) {   // { y } = วางจาก y ลงล่าง · limit = ขอบบนของของที่อยู่ถัดลงไป (ห้ามล้น) · null = หน้านี้ไม่มีที่
  /* เจ้าของงาน 2 พ.ย. 2569 "อยากให้การเขียน เป็นเขียนต่อด้านล่าง" ⇒ ใต้ของเดิมไม่พอ ให้หาช่องว่างแรกจากขอบบน (-CANVAS_MAX) ลงมา
     ชุดแรกอยู่ขอบบน ชุดถัดไปต่อใต้ชุดก่อน เรียงลงมาตามลำดับ export · skip = ชิ้นที่ไม่นับ (ชิ้นที่กำลังวาง/ย้าย) */
  const kids = page.children.filter(n => n.absoluteBoundingBox && !(skip && skip.has(n)));
  if (!kids.length) return { y: 0 };
  const top = (n) => n.absoluteBoundingBox.y, bot = (n) => top(n) + n.absoluteBoundingBox.height;
  const b = kids.reduce((m, n) => Math.max(m, bot(n)), -Infinity);
  if (b + gap + need <= CANVAS_MAX) return { y: b + gap };
  let y = -CANVAS_MAX;
  for (let k = 0; k <= kids.length; k++) {
    const hit = kids.filter(n => top(n) < y + need + gap && bot(n) + gap > y);
    if (!hit.length) { const next = kids.filter(n => top(n) >= y).reduce((m, n) => Math.min(m, top(n)), CANVAS_MAX + gap); return { y, limit: next - gap }; }
    y = hit.reduce((m, n) => Math.max(m, bot(n)), -Infinity) + gap;
    if (y + need > CANVAS_MAX) return null;
  }
  return null;
}
async function roomyPage(names, need, gap) {
  gap = gap || 400;
  const tp = await namedPage(names);
  const on = async (p) => { if (p.loadAsync) await p.loadAsync(); return spotOn(p, need, gap); };
  const here = await on(tp.page);
  if (here) return Object.assign(tp, here);
  const lower = (p) => p.name.trim().toLowerCase(), re = new RegExp('^' + names[0].toLowerCase() + '-(\\d+)$');
  const pages = figma.root.children.filter(p => re.test(lower(p)));
  for (const p of pages) { const s = await on(p); if (s) return Object.assign({ page: p, fresh: false, found: true, next: true }, s); }
  const next = pages.reduce((m, p) => Math.max(m, +lower(p).match(re)[1]), 1) + 1;
  try { const p = figma.createPage(); p.name = names[0] + '-' + next; return { page: p, fresh: true, found: true, next: true, y: 0 }; }
  catch (e) { return Object.assign(tp, { full: true, y: pageBottom(tp.page) + gap }); }
}
function liftAbove(page, before, limit) {   // วางในช่องว่างด้านบน: สูงจริงเกินที่เผื่อไว้จนทับของที่อยู่ถัดลงไป ⇒ ขยับทั้งชุดขึ้นเท่าที่ล้น
  const fresh = page.children.filter(n => !before.has(n));
  const dy = Math.min(0, limit - fresh.reduce((y, n) => Math.max(y, n.y + n.height), -Infinity));
  if (dy) fresh.forEach(n => { n.y += dy; });
}
/* 4 พ.ย. 2569 เจ้าของงาน "เมื่อวาน export ไปที่ Maintainance2 … อยากให้ export ไปที่ Maintainance แทน"
   ประเมินก่อนสร้าง (BLOCK_H × จำนวนบล็อก) เกินขอบเสมอเมื่อสร้างทั้งชุด ทั้งที่ชุดจริงสูงราว 77,000 ⇒ สร้างบนหน้าเดิมก่อน วัดขนาดจริงแล้วค่อยย้ายลงช่อง
   ลำดับ: ใต้ของเดิม → ช่องว่างจากขอบบนลงมา (spotOn) → คอลัมน์ใหม่ทางขวาของของเดิม (บนเสมอของเดิม) · null = หน้านี้ไม่มีที่ทั้งแนวตั้งและแนวนอน */
function fitOn(page, nodes, gap) {
  gap = gap || 400;
  const moving = new Set(nodes);
  const top = Math.min(...nodes.map(n => n.y)), h = Math.max(...nodes.map(n => n.y + n.height)) - top;
  const left = Math.min(...nodes.map(n => n.x)), w = Math.max(...nodes.map(n => n.x + n.width)) - left;
  const s = spotOn(page, h, gap, moving);
  if (s) { const y = s.y + h > CANVAS_MAX ? Math.max(-CANVAS_MAX, CANVAS_MAX - h) : s.y; return { dx: 0, dy: y - top, y, side: false }; }   // หน้าว่าง spotOn ให้ y 0 ⇒ ชุดสูงต้องยกขึ้นให้อยู่ในขอบ
  const old = page.children.filter(n => !moving.has(n) && n.absoluteBoundingBox);
  const right = old.reduce((m, n) => Math.max(m, n.absoluteBoundingBox.x + n.absoluteBoundingBox.width), -Infinity) + gap * 5;
  const y = Math.max(-CANVAS_MAX, Math.min(pageTop({ children: old }), CANVAS_MAX - h));
  if (right + w > CANVAS_MAX || h > 2 * CANVAS_MAX) return null;
  return { dx: right - left, dy: y - top, x: right, y, side: true };
}
function shiftAll(nodes, f) { for (const n of nodes) { n.x += f.dx; n.y += f.dy; } }
/* ---------- ผัง userflow ข้างจอ (เจ้าของงานสั่ง 22 ต.ค. 2569: "userflow กับ wireframe เรียงต่อกัน … อยู่ข้างๆกัน ตอนที่ export") ----------
   ข้อมูลผังฝังตอน build (const USERFLOW · plugin-lib/userflow-layout.js อ่านไฟล์ userflow .md) — ปลั๊กอินแค่วาดตามตำแหน่ง
   1 บล็อก scenario = ผังซ้ายสุด (อ่านบน → ล่าง) + ป้าย Device + คอลัมน์จอ A.1 A.2 … · กล่องในผังที่มีจอติดป้ายรหัสจอ (A.2 · A.3)
   รูปทรง/สีชุดเดียวกับบอร์ด FigJam: วงกลมขาว start/End · วงกลมฟ้า Action · สี่เหลี่ยมเขียว Display · ข้าวหลามตัดม่วง Decision · sticky เหลือง = คำถามที่ยังค้าง
   ผังเป็นของวาดประกอบ (shape + vector) อยู่นอกเฟรมจอ เหมือนป้าย Header — ไม่กระทบกติกา "ทุกชิ้นในจอเป็น instance" · Figma design ไม่มี connector ⇒ ลากกล่องแล้วเส้นไม่ตาม */
const FLOW_GAP = 200;          // ช่องระหว่างผังกับป้าย Device
const STICKY_FILL = '#FFE299', BADGE_FILL = '#9CACCC', FLOW_LINE = '#EAECF0';
const scenNo = (tag) => { const m = String(tag || '').match(/^S(\d+)$/); return m ? +m[1] : null; };
function flowNode(kind) {
  let n;
  if (kind === 'decision') { n = figma.createPolygon(); n.pointCount = 4; }
  else if (kind === 'display') { n = figma.createRectangle(); n.cornerRadius = 8; }
  else n = figma.createEllipse();
  CREATED.push(n);
  return n;
}
async function flowText(chars, size, hex, w, h) {
  const t = await labelText(chars, size, hex);
  t.textAlignHorizontal = 'CENTER'; t.textAlignVertical = 'CENTER';
  if (w) { t.textAutoResize = 'NONE'; t.resize(w, h); }
  return t;
}
async function arrow(pts, hex, weight) {   // เส้นหักมุมตามจุด + หัวลูกศรที่ปลาย · พิกัดเทียบมุมซ้ายบนของเส้นเอง แล้วค่อยวาง x/y
  const minX = Math.min(...pts.map(p => p[0])), minY = Math.min(...pts.map(p => p[1]));
  const v = figma.createVector(); CREATED.push(v);
  const net = {
    vertices: pts.map(([x, y], i) => Object.assign({ x: x - minX, y: y - minY }, i === pts.length - 1 ? { strokeCap: 'ARROW_LINES' } : {})),
    segments: pts.slice(1).map((_, i) => ({ start: i, end: i + 1 }))
  };
  if (typeof v.setVectorNetworkAsync === 'function') await v.setVectorNetworkAsync(net); else v.vectorNetwork = net;
  v.strokes = [{ type: 'SOLID', color: rgbOf(hex) }]; v.strokeWeight = weight || 3; v.strokeJoin = 'ROUND';
  v.fills = [];
  return v;
}
/* codes: { nodeId: ['A.2', …] } · loose: ['A.5 ยืนยันการออก', …] = จอที่ยังไม่มีกล่องในผัง */
async function userflowFrame(prefix, code, n, codes, loose, o) {   // o.sc = ผังที่ใช้แทน (แนวนอนของ journey) · o.title = หัวผัง
  o = o || {};
  const sc = o.sc || (USERFLOW && USERFLOW.scenarios && USERFLOW.scenarios[n]);
  if (!sc) return null;
  const f = figma.createFrame(); CREATED.push(f);
  f.name = prefix + ' · ' + code + ' userflow S' + n;
  f.fills = [{ type: 'SOLID', color: WHITE }]; f.strokes = [{ type: 'SOLID', color: rgbOf(FLOW_LINE) }]; f.strokeWeight = 2; f.cornerRadius = 16;
  f.clipsContent = false;
  f.resize(sc.w, sc.h);
  const put = (node, x, y) => { f.appendChild(node); node.x = x; node.y = y; return node; };
  put(await labelText(o.title || ('userflow · S' + n + ' ' + sc.title), 32, '#101828'), 40, 36);
  put(await labelText(sc.horizontal ? 'อ่านซ้าย → ขวา · ทางแยก N ลงล่าง · เส้นที่วนใต้ผัง = ย้อนกลับ · ป้ายเทา = รหัสจอบนหน้านี้'
    : 'อ่านบน → ล่าง · ทางแยก N ไปขวา · เส้นที่วนข้างผัง = ย้อนกลับ · ป้ายเทา = รหัสจอทางขวา', 16, '#475467'), 40, 84);
  const pos = {}, slots = [];
  for (const e of sc.edges) {   // เส้นก่อน กล่องทับเส้น
    const from = sc.nodes.find(x => x.id === e.from);
    const hex = '#' + [from.stroke.r, from.stroke.g, from.stroke.b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
    const v = await arrow(e.pts, hex, 3);
    put(v, Math.min(...e.pts.map(p => p[0])), Math.min(...e.pts.map(p => p[1])));   // ตั้ง x/y หลังย้ายเข้ากรอบ (พิกัดในกรอบผัง)
    v.name = 'เส้น ' + e.from + ' → ' + e.to + (e.back ? ' (ย้อนกลับ)' : '');
    if (e.label) {
      const [a, b] = [e.pts[0], e.pts[1]], down = a[0] === b[0];
      const t = put(await labelText(e.label, 18, '#101828'), a[0] + (down ? 10 : 12), a[1] + (down ? 4 : -28)); t.name = 'ป้าย ' + e.label;
    }
  }
  for (const nd of sc.nodes) {
    const s = flowNode(nd.kind); f.appendChild(s);
    s.resize(nd.w, nd.h); s.x = nd.x; s.y = nd.y;
    s.fills = [{ type: 'SOLID', color: nd.fill }]; s.strokes = [{ type: 'SOLID', color: nd.stroke }]; s.strokeWeight = 4;
    s.name = nd.id + ' / ' + (nd.label.split('\n')[0] || nd.kind);
    if (nd.thumb) {   // กล่องหน้าจอ = ช่องภาพย่อจอจริงด้านบน + ชื่อหน้าใต้ภาพ (เจ้าของงานเลือก 22 ต.ค. 2569 "ภาพย่อจอในผัง")
      const th = figma.createRectangle(); CREATED.push(th); f.appendChild(th);
      th.resize(nd.thumb.w, nd.thumb.h); th.x = nd.x + nd.thumb.x; th.y = nd.y + nd.thumb.y; th.cornerRadius = 4;
      th.fills = [{ type: 'SOLID', color: WHITE }]; th.strokes = [{ type: 'SOLID', color: rgbOf('#D0D5DD') }]; th.strokeWeight = 1;
      th.name = 'ภาพย่อ ' + nd.id;
      slots.push({ id: nd.id, rect: th });
      if (!codes[nd.id]) { const ph = put(await flowText('ยังไม่มีจอในบล็อกนี้', 14, '#667085', nd.thumb.w, nd.thumb.h), th.x, th.y); ph.name = nd.id + ' ยังไม่มีจอ'; }
      const top = nd.thumb.y + nd.thumb.h + 4, ih = nd.h - top - 6, iw = nd.w - 16;
      const t = put(await flowText(nd.label.replace(/\n/g, ' '), 15, '#101828', iw, ih), nd.x + 8, nd.y + top);
      t.name = nd.id + ' ข้อความ';
    } else {
      const iw = nd.kind === 'decision' ? nd.w * 0.62 : nd.w * 0.86, ih = nd.kind === 'decision' ? nd.h * 0.62 : nd.h * 0.8;
      const t = put(await flowText(nd.label, nd.kind === 'end' ? 16 : 15, '#101828', iw, ih), nd.x + (nd.w - iw) / 2, nd.y + (nd.h - ih) / 2);
      t.name = nd.id + ' ข้อความ';
    }
    pos[nd.id] = nd;
  }
  for (const id of Object.keys(codes)) {   // ป้ายรหัสจอ มุมขวาบนของกล่อง
    const nd = pos[id]; if (!nd) { warn('ผัง S' + n, new Error('จอผูกกับกล่อง ' + id + ' ที่ไม่มีในผัง userflow')); continue; }
    const b = frame('ป้ายจอ ' + codes[id].join(' '), 'HORIZONTAL', { fill: rgbOf(BADGE_FILL), pad: [4, 10] }); b.cornerRadius = 6;
    b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'AUTO';
    b.appendChild(await labelText(codes[id].join(' · '), 16, '#101828'));
    put(b, nd.x + nd.w - 24, nd.y - 16);
  }
  let low = 0;   // sticky: ซ้อนลงถ้าชนกัน
  for (const st of sc.stickies) {
    const box = frame('คำถาม ' + st.node, 'VERTICAL', { fill: rgbOf(STICKY_FILL), pad: [16, 16] }); box.cornerRadius = 4;
    box.counterAxisSizingMode = 'FIXED'; box.primaryAxisSizingMode = 'AUTO'; box.resize(st.w, 100);
    const t = await labelText(st.text, 15, '#101828'); box.appendChild(t); t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT';
    const y = Math.max(st.y, low);
    put(box, st.x, y); low = y + box.height + sc.gap;
  }
  let h = Math.max(sc.h, low + 40);
  if (loose && loose.length) {   // จอที่ผังยังไม่มีกล่องรองรับ — แจ้งให้เติม userflow (ไม่เดาเติมเอง)
    const t = put(await labelText('จอที่ยังไม่มีกล่องในผัง userflow: ' + loose.join(' · '), 16, '#B42318'), 40, h); t.name = 'จอที่ยังไม่มีกล่องในผัง';
    t.textAutoResize = 'HEIGHT'; t.resize(sc.w - 80, t.height || 24); h += (t.height || 24) + 40;
  }
  f.resize(sc.w, h);
  return { frame: f, slots };
}
/* ภาพประกอบ Empty state ที่ UI Release#2 เปลี่ยนจากภาพตั้งต้น (5 พ.ย. 2569 เจ้าของงาน "empty s1 ของรถ ใช้ ui นี้") —
   ใส่ IMAGE fill ทับสี่เหลี่ยมใน Graphic ของ instance แบบเดียวกับ Contract vehicle list - Empty (1-54) · ภาพฝังตอน build (build.json "images") */
async function emptyGraphic(es, key) {
  const png = typeof IMAGES !== 'undefined' && IMAGES && IMAGES[key];
  const g = find(es, 'Graphic'), r = g && g.findOne && g.findOne(n => n.type === 'RECTANGLE');
  if (!png || !r) { warn('ภาพ Empty state ' + key, new Error(png ? 'ไม่เจอสี่เหลี่ยมใน Graphic' : 'ไม่มีภาพใน build.json images')); return es; }
  r.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(png)).hash, scaleMode: 'FILL' }];
  return es;
}
/* ภาพย่อจอจริง: export จอเป็น PNG แล้วใส่เป็นภาพในช่อง · จอสูงกว่าช่อง = ตัดเอาส่วนบนเต็มความกว้าง (เห็นหัวหน้า + ส่วนต้นของเนื้อหา) · ภาพเป็นภาพนิ่ง แก้จอแล้วต้องสร้างใหม่ */
async function fillThumb(rect, scr) {
  try {
    const scale = Math.max(0.05, Math.min(1, (rect.width / scr.width) * 2));
    const bytes = await scr.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
    const img = figma.createImage(bytes);
    const vis = (rect.height / rect.width) / (scr.height / scr.width);   // สัดส่วนความสูงของจอที่ช่องแสดงได้เมื่อเต็มความกว้าง
    rect.fills = [vis < 1 ? { type: 'IMAGE', imageHash: img.hash, scaleMode: 'CROP', imageTransform: [[1, 0, 0], [0, vis, 0]] } : { type: 'IMAGE', imageHash: img.hash, scaleMode: 'FIT' }];
    return true;
  } catch (e) { warn('ภาพย่อ ' + scr.name, e); return false; }
}

/* ---------- เอกสารเป็นกรอบบนหน้า Figma: user story mapping + use case (30 ต.ค. 2569 เจ้าของงาน "ทุกอย่างอยู่ใน Figma") ----------
   ข้อมูลฝังตอน build (const DOCS จาก build.json "docs") · กรอบอยู่นอกจอ ชื่อ "<prefix> · …" ปลั๊กอินล้างตอนรันซ้ำแบบป้ายอื่น · ไม่ใช่จอ UI จึงวาดด้วยกรอบ + ข้อความ */
const DOC_STATUS = { 'มีใน flow แล้ว': '#E3F4EA', 'มีบางส่วน': '#FDF0DC', 'ยังไม่มี': '#EFEDF0', 'ขัดกับที่เคาะ': '#FDE8E6' };
let DOC_FONT = null;
async function docText(chars, size, hex, w, regular) {
  const t = await labelText(chars || ' ', size, hex);   // หัว = ฟอนต์ป้าย (ตัวหนา)
  if (regular) {
    if (DOC_FONT === null) { DOC_FONT = false; for (const f of [{ family: 'IBM Plex Sans Thai', style: 'Regular' }, { family: 'Inter', style: 'Regular' }]) { try { await figma.loadFontAsync(f); DOC_FONT = f; break; } catch (e) { /* ลองตัวถัดไป */ } } }
    if (DOC_FONT) t.fontName = DOC_FONT;
  }
  if (w) { t.resize(w, t.height); t.textAutoResize = 'HEIGHT'; }
  return t;
}
function docBox(name, dir, o) {
  const f = frame(name, dir, Object.assign({ fill: WHITE }, o || {}));
  if (o && o.stroke) { f.strokes = [{ type: 'SOLID', color: rgbOf(o.stroke) }]; f.strokeWeight = 1; }
  if (o && o.radius) f.cornerRadius = o.radius;
  return f;
}
function putBelow(page, node, gap) {   // วางต่อใต้ของเดิมบนหน้า ชิดซ้ายที่ x = 0 · กรอบชื่อเดียวกันของรอบก่อนถูกแทนที่ (ไม่ซ้อนหลายชุด)
  page.children.filter(n => n !== node && n.name === node.name).forEach(n => { log('↻ แทนที่ "' + n.name + '" ของรอบก่อน'); n.remove(); });
  let y = 0; page.children.forEach(n => { if (n !== node && n.absoluteBoundingBox) y = Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + (gap || 400)); });
  const s = spotOn(page, node.height, gap || 400, new Set([node]));   // ใต้ของเดิมเกินขอบพื้นที่วางงาน ⇒ ช่องว่างแรกจากขอบบนลงมา
  page.insertChild(0, node); node.x = 0; node.y = s ? s.y : y; return node;
}
/* story map: แถวช่วงงานเรียงซ้าย → ขวา · การ์ดข้อกำหนดใต้แต่ละช่วง (☑ ทำแล้ว · สีตามสถานะ) */
async function storyMapBoard(prefix, sm) {
  CREATED = [];
  const W = 440;
  const outer = docBox(prefix + ' · user story mapping', 'VERTICAL', { pad: 64, gap: 32, stroke: '#D0D5DD', radius: 24 });
  outer.appendChild(await docText(sm.title, 56, '#101828'));
  outer.appendChild(await docText('ต้นฉบับ ' + sm.src + ' · สีการ์ด = flow ครอบแค่ไหน (เขียว มีแล้ว · ส้ม บางส่วน · เทา ยังไม่มี · แดง ขัดกับที่เคาะ) · ☑ = ทำแล้ว', 24, '#475467', null, true));
  const cols = docBox('Columns', 'HORIZONTAL', { gap: 24, fill: null }); cols.fills = []; outer.appendChild(cols);
  for (const sec of sm.sections) {
    const col = docBox('ช่วงงาน · ' + sec.h, 'VERTICAL', { gap: 12 }); col.fills = [];
    col.counterAxisSizingMode = 'FIXED'; col.resize(W, 100); col.primaryAxisSizingMode = 'AUTO';
    const head = docBox('หัว', 'VERTICAL', { pad: 20, gap: 6, fill: rgbOf('#A80689'), radius: 12 });
    head.appendChild(await docText(sec.h, 26, '#FFFFFF', W - 40));
    if (sec.note) head.appendChild(await docText(sec.note, 20, '#FFFFFF', W - 40, true));
    col.appendChild(head); head.layoutAlign = 'STRETCH';
    const hi = (k) => (sec.head || []).indexOf(k);
    for (const r of sec.rows) {
      const st = r[hi('สถานะ')] || '';
      const card = docBox('การ์ด', 'VERTICAL', { pad: 16, gap: 8, fill: rgbOf(DOC_STATUS[st] || '#FFFFFF'), radius: 10, stroke: '#D0D5DD' });
      card.appendChild(await docText((r[hi('ทำแล้ว')] || '☐') + ' ' + (r[hi('use case')] || ''), 22, '#101828', W - 32, true));
      card.appendChild(await docText(['JO ' + (r[hi('JO')] || '-'), st, r[hi('ใน flow ตอนนี้')] || ''].filter(Boolean).join(' · '), 18, '#475467', W - 32, true));
      col.appendChild(card); card.layoutAlign = 'STRETCH';
    }
    cols.appendChild(col);
  }
  CREATED = [];
  return outer;
}
/* ตาราง use case: แยกหัวข้อตามคอลัมน์ group · คอลัมน์กว้างตาม widths · แถวสลับสี · สถานะระบายสี */
async function tableBoard(prefix, name, title, src, data, group, cols) {
  CREATED = [];
  const W = cols.reduce((a, c) => a + c[1], 0);
  const outer = docBox(prefix + ' · ' + name, 'VERTICAL', { pad: 64, gap: 32, stroke: '#D0D5DD', radius: 24 });
  outer.appendChild(await docText(title, 56, '#101828'));
  outer.appendChild(await docText('ต้นฉบับ ' + src + ' · ' + data.rows.length + ' ข้อ', 24, '#475467', null, true));
  const gi = data.head.indexOf(group);
  for (const g of [...new Set(data.rows.map(r => r[gi]))]) {
    const rows = data.rows.filter(r => r[gi] === g);
    outer.appendChild(await docText(g + ' (' + rows.length + ' ข้อ)', 32, '#A80689'));
    const tbl = docBox('ตาราง · ' + g, 'VERTICAL', { stroke: '#D0D5DD', radius: 8 }); tbl.clipsContent = true;
    const line = async (vals, i, header) => {
      const rw = docBox(header ? 'หัวตาราง' : 'แถว', 'HORIZONTAL', { fill: rgbOf(header ? '#F2F4F7' : (i % 2 ? '#FCFCFD' : '#FFFFFF')) });
      for (const [k, [h, w]] of cols.entries()) {
        const v = vals[k] || '';
        const cell = docBox(h, 'VERTICAL', { pad: 12, fill: header ? null : (h === 'สถานะใน flow' && DOC_STATUS[v] ? rgbOf(DOC_STATUS[v]) : null) });
        if (header || !(h === 'สถานะใน flow' && DOC_STATUS[v])) cell.fills = [];
        cell.counterAxisSizingMode = 'FIXED'; cell.resize(w, 40); cell.primaryAxisSizingMode = 'AUTO';
        cell.appendChild(await docText(v, header ? 18 : 18, header ? '#344054' : '#101828', w - 24, !header));
        rw.appendChild(cell); cell.layoutAlign = 'STRETCH';
      }
      tbl.appendChild(rw);
    };
    await line(cols.map(c => c[0]), 0, true);
    for (const [i, r] of rows.entries()) await line(cols.map(c => r[data.head.indexOf(c[0])]), i, false);
    outer.appendChild(tbl);
  }
  CREATED = [];
  return outer;
}

/* ---------- user journey swimlane ตามผู้เกี่ยวข้อง (เจ้าของงานสั่ง 4 พ.ย. 2569 "อยากให้ทำ user journey ยาวๆ เป็น swimlane ที่มี stakeholder ด้วย") ----------
   ข้อมูลฝังตอน build (const SWIMLANE · plugin-lib/swimlane-layout.js อ่าน Diagram/…-swimlane.md) — ปลั๊กอินแค่วาดตามตำแหน่ง
   1 แถว = 1 ผู้เกี่ยวข้อง (ชื่อซ้ายสุด) · แถบช่วงงานด้านบน · "อยากได้เป็นสี่เหลี่ยม และทางแยกเป็นข้าวหลามตัด" ⇒ ขั้นงาน = สี่เหลี่ยมเขียว · ทางแยก = ข้าวหลามตัดม่วง (สีชุดผัง userflow)
   เส้นทึบ = ไปขั้นถัดไป · เส้นประเทา = ย้อนกลับไปทำซ้ำ · เป็นของวาดประกอบนอกเฟรมจอ (shape + vector) เหมือนผัง userflow */
async function swimlaneBoard(prefix, sw) {
  CREATED = [];
  const f = figma.createFrame(); CREATED.push(f);
  f.name = prefix + ' · user journey swimlane';
  f.resize(sw.w, sw.h); f.fills = [{ type: 'SOLID', color: WHITE }];
  f.strokes = [{ type: 'SOLID', color: rgbOf('#D0D5DD') }]; f.strokeWeight = 2; f.cornerRadius = 24; f.clipsContent = false;
  const put = (node, x, y) => { f.appendChild(node); node.x = x; node.y = y; return node; };
  const rect = (name, x, y, w, h, hex, stroke) => {
    const r = figma.createRectangle(); CREATED.push(r); r.name = name; r.resize(w, h);
    r.fills = hex ? [{ type: 'SOLID', color: rgbOf(hex) }] : [];
    if (stroke) { r.strokes = [{ type: 'SOLID', color: rgbOf(stroke) }]; r.strokeWeight = 1; }
    return put(r, x, y);
  };
  put(await docText(sw.title, 56, '#101828'), 64, 48);
  put(await docText('สี่เหลี่ยม = ขั้นงาน (วงเล็บ = scenario · ภาพ = จอจริงบนหน้านี้ · ป้ายเทา = รหัสจอ) · ข้าวหลามตัด = ทางแยก · เส้นประเทา = ย้อนกลับไปทำซ้ำ · ต้นฉบับ ' + sw.src, 24, '#475467', null, true), 64, 128);
  for (const l of sw.lanes) {   // แถวผู้เกี่ยวข้อง: พื้นสลับสี + ช่องชื่อซ้าย
    rect('lane · ' + l.label, 0, l.y, sw.w, l.h, l.i % 2 ? '#F9FAFB' : '#FFFFFF', '#EAECF0');
    rect('ชื่อ lane · ' + l.label, 0, l.y, sw.headW, l.h, '#F2F4F7', '#EAECF0');
    const t = put(await docText(l.label, 28, '#101828', sw.headW - 48), 24, 0); t.name = 'ชื่อ ' + l.label;
    t.y = l.y + (l.h - t.height) / 2;
  }
  for (const b of sw.bands) {   // แถบช่วงงาน (สีหัวการ์ด story map)
    const r = rect('ช่วงงาน · ' + b.name, b.x, b.y, b.w, b.h, '#A80689'); r.cornerRadius = 8;
    const t = put(await docText(b.name, 26, '#FFFFFF'), b.x + 20, 0); t.y = b.y + (b.h - t.height) / 2;
  }
  let links = 0;
  for (const e of sw.edges) {   // เส้นก่อน กล่องทับเส้น
    const v = await arrow(e.pts, e.back ? '#98A2B3' : '#475467', 3);
    if (e.back) { try { v.dashPattern = [16, 10]; } catch (err) { /* ไม่มี dash ก็เส้นทึบ */ } }
    put(v, Math.min(...e.pts.map(p => p[0])), Math.min(...e.pts.map(p => p[1])));
    v.name = 'เส้น ' + e.from + ' → ' + e.to + (e.back ? ' (ย้อนกลับ)' : '');
    if (e.lab) { const t = put(await labelText(e.label, 18, '#101828'), e.lab[0], e.lab[1]); t.name = 'ป้าย ' + e.label; }
    links++;
  }
  let steps = 0, forks = 0; const slots = [];
  for (const nd of sw.nodes) {
    const s = flowNode(nd.kind === 'decision' ? 'decision' : 'display'); f.appendChild(s);
    s.resize(nd.w, nd.h); s.x = nd.x; s.y = nd.y;
    s.fills = [{ type: 'SOLID', color: nd.fill }]; s.strokes = [{ type: 'SOLID', color: nd.stroke }]; s.strokeWeight = 4;
    s.name = (nd.kind === 'decision' ? 'ทางแยก ' : 'ขั้น ') + nd.id + ' / ' + nd.label;
    if (nd.thumb) {   // ภาพย่อจอจริง (เจ้าของงาน 4 พ.ย. 2569 "ภาพย่อจอจริง + รหัสจอ") — ช่องบน + ข้อความใต้ภาพ + ป้ายรหัสจอมุมขวาบน แบบกล่องหน้าจอของผัง userflow
      const th = rect('ภาพย่อ ' + nd.id, nd.x + nd.thumb.x, nd.y + nd.thumb.y, nd.thumb.w, nd.thumb.h, '#FFFFFF', '#D0D5DD'); th.cornerRadius = 4;
      slots.push({ id: nd.id, rect: th, codes: nd.screens });
      const top = nd.thumb.y + nd.thumb.h + 4, ih = nd.h - top - 6, iw = nd.w - 16;
      const t = put(await flowText(nd.label, 15, '#101828', iw, ih), nd.x + 8, nd.y + top); t.name = nd.id + ' ข้อความ';
      const b = frame('ป้ายจอ ' + nd.screens.join(' '), 'HORIZONTAL', { fill: rgbOf(BADGE_FILL), pad: [4, 10] }); b.cornerRadius = 6;
      b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'AUTO';
      b.appendChild(await labelText(nd.screens.join(' · '), 16, '#101828'));
      put(b, nd.x + nd.w - 24, nd.y - 16);
    } else {
      const iw = nd.kind === 'decision' ? nd.w * 0.62 : nd.w - 24, ih = nd.kind === 'decision' ? nd.h * 0.62 : nd.h - 16;
      const t = put(await flowText(nd.label, 17, '#101828', iw, ih), nd.x + (nd.w - iw) / 2, nd.y + (nd.h - ih) / 2); t.name = nd.id + ' ข้อความ';
    }
    if (nd.kind === 'decision') forks++; else steps++;
  }
  CREATED = [];
  return { frame: f, steps, forks, links, slots };
}

/* ---------- flowchart กิจกรรมราย scenario (เจ้าของงาน 6 พ.ย. 2569 "สร้าง แต่ละ scen ออกมา … ทำ script ให้ export ใน figma" + "อยากได้ flowchart") ----------
   ข้อมูลฝังตอน build (const ACTIVITY · plugin-lib/activity-layout.js อ่าน Diagram/…-flowchart-กิจกรรม.md) — ปลั๊กอินแค่วาดตามตำแหน่ง
   "เอาเป็นแค่กิจกรรม … ไม่ต้องเอาหน้าจอไปรวม" ⇒ ไม่มีภาพย่อจอ ไม่มีป้ายรหัสจอ
   "อยากให้แยก scen เลยนะ" ⇒ ประกอบในกรอบชั่วคราวเพื่อหาที่ว่างบนหน้า (putBelow) แล้วแยกออกเป็นกรอบบนหน้า 1 scenario = 1 กรอบ + กรอบคำอธิบาย 1 กรอบ
   รูปทรงแบบ swimlane ("สี่เหลี่ยม และทางแยกเป็นข้าวหลามตัด"): กิจกรรม = สี่เหลี่ยม · ทางเลือก = ข้าวหลามตัด · เริ่ม/จบ/ไปต่อ = วงกลม · เส้นประเทา = ย้อนกลับไปทำซ้ำ
   คำอธิบายบนกรอบใช้คำธรรมดา (เจ้าของงาน "ไม่ต้องใช้คำแปลกๆนะ ให้ใช้คำปกติเหมือนมนุษย์อ่าน") */
/* กรอบผัง 1 scenario — ใช้ทั้งปุ่ม "สร้าง flowchart กิจกรรม" (กรอบละ scenario) และวางซ้ายของแถวจอในบล็อก scenario แทนผัง userflow
   (เจ้าของงาน 6 พ.ย. 2569 "export รอบต่อไป … อยากให้ flowchart คู่กับ ui ไม่ใช่ user flow") · sc = 1 scenario จาก ACTIVITY.scenarios */
async function activityFrame(name, sc) {
  const g = figma.createFrame(); CREATED.push(g);
  g.name = name; g.resize(sc.w, sc.h); g.clipsContent = false;
  g.fills = [{ type: 'SOLID', color: WHITE }]; g.strokes = [{ type: 'SOLID', color: rgbOf('#D0D5DD') }]; g.strokeWeight = 2; g.cornerRadius = 16;
  const put = (node, x, y) => { g.appendChild(node); node.x = x; node.y = y; return node; };
  put(await docText('S' + sc.n + ' · ' + sc.title, 26, '#101828', sc.w - 80), 40, 32).name = 'ชื่อ scenario';
  let steps = 0, forks = 0, links = 0;
  for (const e of sc.edges) {   // เส้นก่อน กล่องทับเส้น
    const v = await arrow(e.pts, e.back ? '#98A2B3' : '#475467', 3);
    if (e.back) { try { v.dashPattern = [16, 10]; } catch (err) { /* ไม่มี dash ก็เส้นทึบ */ } }
    put(v, Math.min(...e.pts.map(p => p[0])), Math.min(...e.pts.map(p => p[1])));
    v.name = 'เส้น ' + e.from + ' → ' + e.to + (e.back ? ' (ย้อนกลับ)' : '');
    if (e.lab) put(await labelText(e.label, 18, '#101828'), e.lab[0], e.lab[1]).name = 'ป้าย ' + e.label;   // ตำแหน่งจาก activity-layout.js (กรอบขยายให้แล้ว)
    links++;
  }
  for (const nd of sc.nodes) {
    const s = flowNode(nd.kind === 'decision' ? 'decision' : nd.kind === 'end' ? 'end' : 'display'); g.appendChild(s);
    s.resize(nd.w, nd.h); s.x = nd.x; s.y = nd.y;
    s.fills = [{ type: 'SOLID', color: nd.fill }]; s.strokes = [{ type: 'SOLID', color: nd.stroke }]; s.strokeWeight = 4;
    s.name = (nd.kind === 'decision' ? 'ทางเลือก ' : nd.kind === 'end' ? 'เริ่ม/จบ ' : 'กิจกรรม ') + nd.id + ' / ' + nd.label.split('\n')[0];
    const iw = nd.kind === 'decision' ? nd.w * 0.62 : nd.w * 0.86, ih = nd.kind === 'decision' ? nd.h * 0.62 : nd.h * 0.8;
    put(await flowText(nd.label, nd.kind === 'end' ? 16 : 17, '#101828', iw, ih), nd.x + (nd.w - iw) / 2, nd.y + (nd.h - ih) / 2).name = nd.id + ' ข้อความ';
    if (nd.kind === 'decision') forks++; else if (nd.kind !== 'end') steps++;
  }
  return { frame: g, steps, forks, links };
}
async function activityBoard(prefix, ac) {
  CREATED = [];
  const f = figma.createFrame(); CREATED.push(f);
  f.name = prefix + ' · flowchart กิจกรรม';
  f.resize(ac.w, ac.h); f.fills = [{ type: 'SOLID', color: WHITE }];
  f.strokes = [{ type: 'SOLID', color: rgbOf('#D0D5DD') }]; f.strokeWeight = 2; f.cornerRadius = 24; f.clipsContent = false;
  const hd = figma.createFrame(); CREATED.push(hd);
  hd.name = prefix + ' · flowchart กิจกรรม · คำอธิบาย'; hd.resize(Math.min(ac.w, 4000), 200); hd.fills = []; hd.clipsContent = false;
  f.appendChild(hd); hd.x = 0; hd.y = 0;
  const head = await docText(ac.title + ' · ' + ac.scenarios.length + ' scenario', 56, '#101828'); hd.appendChild(head); head.x = 64; head.y = 48;
  const lg = await docText('อ่านจากบนลงล่าง กล่องสี่เหลี่ยมคือสิ่งที่ทำ รูปข้าวหลามตัดคือจุดที่ต้องเลือก คำบนเส้นบอกว่าเลือกแล้วไปทางไหน วงกลมคือจุดเริ่มและจุดจบ เส้นประสีเทาคือย้อนกลับไปทำอีกครั้ง ผังนี้ไม่มีหน้าจอ ดูหน้าจอได้ที่ userflow (ต้นฉบับ ' + ac.src + ')', 24, '#475467', null, true);
  hd.appendChild(lg); lg.x = 64; lg.y = 128;
  let steps = 0, forks = 0, links = 0;
  for (const sc of ac.scenarios) {
    const r = await activityFrame(prefix + ' · flowchart กิจกรรม · S' + sc.n + ' · ' + sc.title, sc);
    f.appendChild(r.frame); r.frame.x = sc.x; r.frame.y = sc.y;
    steps += r.steps; forks += r.forks; links += r.links;
  }
  CREATED = [];
  return { frame: f, scenarios: ac.scenarios.length, steps, forks, links };
}
/* แยกกรอบชั่วคราวของ activityBoard ออกเป็นกรอบบนหน้า (ตำแหน่งเดิมบนหน้า) แล้วลบกรอบชั่วคราว · คืนรายการกรอบที่แยกแล้ว */
function splitBoard(page, f) {
  const kids = f.children.slice();
  for (const k of kids) { const x = f.x + k.x, y = f.y + k.y; page.insertChild(0, k); k.x = x; k.y = y; }
  f.remove();
  return kids;
}

/* ---------- ส่งภาพจอบนหน้านี้ไป FigJam (เจ้าของงาน 30 ต.ค. 2569 "export … ไปที่ figjam ด้วย userflow และ design มาจาก figma ปรับใหม่ล่าสุด") ----------
   export เฟรมจอ "<prefix> / A.1 · S1 — ชื่อ" บนหน้าที่เปิดอยู่ (จอที่ทีมแก้มือแล้วก็ได้) เป็น PNG ส่งให้หน้าต่างปลั๊กอิน → POST เข้า serve.js ที่ out/figjam/<dir>/
   แล้ว 3-figjam-board.js วางภาพต่อจากผัง userflow ของ scenario เดียวกัน · desktop อย่างเดียว · ด้านยาวไม่เกิน 4000 px (FigJam รับไม่เกิน 4096) */
/* ชื่อเฟรมจอ "MT / A.3 · S1 — ชื่อ" · เรื่องย่อย "MT / A1.3 · S1 — ชื่อ" (R108) · บล็อกย่อยตามประเภทงาน "CE / B1.5 · S2 งานซ่อม — ชื่อ" (13 พ.ย. 2569 เดิมไม่ตรง ⇒ จอพวกนี้ไม่ถูกส่งไป FigJam)
   กลุ่ม: 1 prefix · 2 ตัวอักษรบล็อก · 3 เลขเรื่องย่อย (ว่างได้) · 4 ลำดับจอ · 5 scenario · 6 ชื่อบล็อกย่อย (ว่างได้) · 7 ชื่อจอ */
const SHOT_RE = /^(\S+) \/ ([A-Z])(\d*)\.([0-9.]+) · (S\d+)(?: ([^—]+?))? — (.+)$/;
async function exportShots(dir, scen, titles) {   // titles = { S1: 'ชื่อ scenario' } ใส่ใน manifest ให้ตัวสร้างบอร์ดตั้งชื่อ section (13 พ.ย. 2569 แบบประเมิน)   // scen = ['S1', 'S2'] ส่งเฉพาะ scenario ที่ติ๊ก (ว่าง = ทุกจอ · 9 พ.ย. 2569 เจ้าของงาน "อยากแยกการ export figjam ออกเป็น S เหมือนกันได้หรือไม่")
  errors.length = 0;
  const page = figma.currentPage;
  /* 5 พ.ย. 2569 เจ้าของงาน "export figjam อยากให้ออกมาเป็นแบบนี้ มี mobile มาด้วย … บอกว่าส่วนใหน desktop , mobile" ⇒ ส่งจอ mobile ด้วย (ชื่อเฟรมลงท้าย " · mobile") · device ใน manifest */
  const all = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0 && n.name.indexOf(' · ตัดแล้ว') < 0);
  const shots = [], skipped = [];
  for (const f of all) {
    const mob = / · mobile$/.test(f.name), m = f.name.replace(/ · mobile$/, '').match(SHOT_RE);
    if (m) shots.push({ f, code: m[2] + m[3] + '.' + m[4], letter: m[2], sub: m[3], no: m[4], scenario: m[5], group: m[2] + m[3], groupName: m[6] || '', name: m[7], device: mob ? 'mobile' : 'desktop' }); else skipped.push(f.name);
  }
  /* หน้าเดียวกันมีหลายชุด ⇒ จอรหัสเดียวกันเก็บตัวที่สร้างล่าสุด
     9 พ.ย. 2569 เดิมเลือกตามตำแหน่งล่างสุด แต่หน้าเต็มแล้วปลั๊กอินวางชุดใหม่ที่ช่องว่างด้านบนหรือคอลัมน์ขวา ⇒ ส่งชุดเก่าไป FigJam (เจ้าของงาน "ของฝั่ง figma มาแล้ว แต่ figjam ยังไม่มา")
     9 พ.ย. 2569 (รอบ 2 · เจ้าของงาน "ทำไมหน้า figjam ไม่เท่า figma ทำให้เท่าหน่อย"): buildGrid วางทุกชิ้นด้วย page.insertChild(0) ⇒ ชุดใหม่อยู่ลำดับต้นของ page.children (ล่างสุดของแผง Layers)
     ไม่ใช่ลำดับท้าย — รอบแรกเลือกลำดับท้ายจึงได้ชุดเก่าสุด (A.20 ฉบับก่อน 6 พ.ย.) ⇒ จอที่มีเวลาสร้าง (pluginData builtAt) เลือกตามเวลา · จอที่สร้างก่อนมีเวลา ลำดับต้นของหน้า = ล่าสุด */
  const order = new Map(page.children.map((n, i) => [n.id, i]));
  const builtAt = (f) => +((f.getPluginData && f.getPluginData('builtAt')) || 0);
  const seen = new Set();
  const total = shots.length;
  shots.sort((p, q) => (builtAt(q.f) - builtAt(p.f)) || (order.get(p.f.id) - order.get(q.f.id)));
  shots.splice(0, shots.length, ...shots.filter(x => !seen.has(x.code + x.device) && seen.add(x.code + x.device)));
  if (total > shots.length) log('หน้านี้มีจอหลายชุด — ส่งเฉพาะชุดที่สร้างล่าสุดของแต่ละจอ · ข้ามชุดเก่า ' + (total - shots.length) + ' จอ');
  if (scen && scen.length) { shots.splice(0, shots.length, ...shots.filter(x => scen.indexOf(x.scenario) >= 0)); log('ส่งเฉพาะ ' + scen.join(' ')); }
  const key = (s) => s.letter + (s.sub || '').padStart(3, '0') + '.' + s.no.split('.').map(x => x.padStart(3, '0')).join('.');
  shots.sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  if (!shots.length) { log('ไม่พบเฟรมจอ "' + PLUGIN.prefix + ' / …" บนหน้า "' + page.name + '" — เปิดหน้าที่มีจอแล้วกดใหม่'); return; }
  log('ส่งภาพจอ ' + shots.length + ' จอ จากหน้า "' + page.name + '" ไปที่ out/figjam/' + dir + '/ …');
  const manifest = { source: 'figma', page: page.name, exportedAt: new Date().toISOString(), scen: scen && scen.length ? scen : undefined, titles: titles || undefined, shots: [] };
  for (const s of shots) {
    try {
      const scale = Math.min(1, 4000 / Math.max(s.f.width, s.f.height));
      const bytes = await s.f.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      const file = s.code + '-' + s.scenario + (s.device === 'mobile' ? '-mobile' : '') + '.png';
      figma.ui.postMessage({ type: 'shot', dir, file, bytes });
      manifest.shots.push({ code: s.code, scenario: s.scenario, group: s.group, groupName: s.groupName || undefined, name: s.name, device: s.device, file, w: Math.round(s.f.width * scale), h: Math.round(s.f.height * scale) });
    } catch (e) { warn('export ' + s.f.name, e); }
  }
  figma.ui.postMessage({ type: 'shots-done', dir, manifest });
  log('export แล้ว ' + manifest.shots.length + '/' + shots.length + ' จอ' + (skipped.length ? ' · ข้าม ' + skipped.length + ' เฟรมที่ชื่อไม่ตรงรูปแบบ (เช่น ' + skipped[0] + ')' : '') + (errors.length ? ' · ⚠ เตือน ' + errors.length + ' จุด' : ''));
  if (dir === 'flow-maintainance') log('ขั้นต่อไป: node figma-export/3-figjam-board.js --maintainance-ui --only --split-scen --out=board-maintainance-ui.json (ชุดเต็ม + แยกไฟล์ราย S) แล้วเปิดปลั๊กอินบอร์ดใน FigJam ใหม่ เลือกกลุ่ม "บำรุงรักษาตามวาระ · ราย scenario"');
}

/* ---------- journey แนวขวาง (เจ้าของงานสั่ง 22 ต.ค. 2569: "ทำ scen มาต่อกันเป็นแนวขวาง สำหรับ export" + "ลงในเพจ maintainance แต่มีปุ่มแยก") ----------
   USERFLOW.journey (ฝังตอน build จาก build.json) = { title, phases: [[ชื่อช่วง, [n…]]], cols: [[n…]], row: { n: 1 }, links: [[จาก, ไป, ป้าย, 'back'?]], scenarios: ผังแนวนอน }
   วาง: แถบ Journey → แถบช่วงงาน → กรอบผัง scenario เรียงซ้าย → ขวาตาม cols (ทางแยกลงแถว 2 ตาม row) → ลูกศรระหว่าง scenario (เข้าที่ start ของปลายทาง)
   เส้นย้อนกลับ (back) วิ่งเหนือแถว 1 / ใต้แถว 2 แบบเส้นประ · info.codes(n) = { codes, loose } ป้ายรหัสจอ · info.frameFor(code) = เฟรมจอบนหน้า (ภาพย่อ) หรือ null */
const JGAP = { col: 240, row: 240, bar: 80, lane: 48 };
async function buildJourney(page, prefix, y0, info) {
  const J = USERFLOW && USERFLOW.journey;
  if (!J) throw new Error('ไม่มีข้อมูล journey ฝังมา — ใส่ "journey" ใน build.json แล้วรัน node figma-export/build-plugin.js ใหม่');
  const put = (nd, x, y) => { page.insertChild(0, nd); nd.x = x; nd.y = y; return nd; };
  const F = {}, thumbs = []; let made = 0;
  for (const col of J.cols) for (const n of col) {
    CREATED = [];
    const sc = J.scenarios[n]; if (!sc) { warn('journey', new Error('ไม่มีผัง S' + n + ' ในไฟล์ userflow')); continue; }
    const c = info.codes(n) || { codes: {}, loose: [] };
    try {
      /* J.kind 'activity' (บำรุงรักษา 6 พ.ย. 2569): ต่อผัง flowchart กิจกรรมแนวนอนแทนผัง userflow · ไม่มีภาพย่อจอ */
      const uf = J.kind === 'activity' ? Object.assign(await activityFrame(prefix + ' · journey flowchart S' + n, sc), { slots: [] })
        : await userflowFrame(prefix, 'journey', n, c.codes, [], { sc, title: 'Scenario ' + n + ' · ' + sc.title });
      F[n] = uf.frame; page.insertChild(0, uf.frame); made++;
      for (const sl of uf.slots) { const cd = (c.codes[sl.id] || [])[0]; if (cd) thumbs.push([sl.rect, cd]); }
    } catch (e) { warn('journey S' + n, e); dropCreated(page); }
    CREATED = [];
  }
  /* ตำแหน่ง: คอลัมน์กว้างเท่ากรอบที่กว้างสุดในคอลัมน์ · แถว 2 อยู่ใต้กรอบแถว 1 ที่สูงสุด */
  const rowOf = (n) => (J.row && J.row[n]) || 0;
  const backTop = J.links.filter(l => l[3] === 'back' && !rowOf(l[0]) && !rowOf(l[1])).length;
  /* แถบ Journey = Header Type=Header (สูงกว่าแถบเดิม) ⇒ สร้างก่อนเพื่อวัดความสูง แล้วค่อยยืดกว้างเท่าผังด้านล่าง (10 พ.ย. 2569) */
  CREATED = []; const jb = put(await blockHeader(prefix, 'Journey', J.title, 1000), 0, y0); const jh = Math.max(GRID.barH, jb.height);
  const top = y0 + jh + JGAP.bar + GRID.barH + JGAP.bar + backTop * JGAP.lane;
  const colX = []; let x = 0;
  J.cols.forEach((col, i) => { colX[i] = x; x += Math.max(...col.map(n => F[n] ? F[n].width : 0)) + JGAP.col; });
  const totalW = x - JGAP.col;
  const h0 = Math.max(...Object.keys(F).filter(n => !rowOf(n)).map(n => F[n].height));
  const rowY = [top, top + h0 + JGAP.row];
  const colOf = {}; J.cols.forEach((col, i) => col.forEach(n => { colOf[n] = i; }));
  for (const n of Object.keys(F)) { F[n].x = colX[colOf[n]]; F[n].y = rowY[rowOf(n)]; }
  /* แถบ Journey + ช่วงงาน (component Header ของทีมออกแบบ · ไม่มี = แถบธรรมดา) */
  CREATED = [];
  try { jb.resize(totalW, jb.height); } catch (e) { warn('ปรับกว้างแถบ Journey', e); }
  for (const [i, [title, ns]] of (J.phases || []).entries()) {
    const xs = ns.filter(n => F[n]).map(n => F[n].x), xe = ns.filter(n => F[n]).map(n => F[n].x + F[n].width);
    if (!xs.length) continue;
    put(await flowBar(prefix, 'ช่วง ' + (i + 1), title, 'Sub Flow', Math.max(...xe) - Math.min(...xs)), Math.min(...xs), y0 + jh + JGAP.bar);
  }
  /* ภาพย่อจอจริง (จอที่สร้างไว้บนหน้านี้แล้ว) */
  let tk = 0;
  for (const [rect, cd] of thumbs) { const scr = info.frameFor(cd); if (scr && await fillThumb(rect, scr)) tk++; }
  /* ลูกศรระหว่าง scenario: ออกขอบขวาของต้นทาง (ระดับ start ของต้นทาง) → เข้าซ้ายของ start ปลายทาง · back = เส้นประวิ่งเหนือแถว 1 / ใต้แถว 2 */
  const startOf = (n) => { const s = J.scenarios[n].nodes[0]; return { x: F[n].x + s.x, y: F[n].y + s.y + s.h / 2 }; };
  let lanesTop = 0, lanesBot = 0, links = 0;
  const bottom2 = Math.max(...Object.keys(F).map(n => F[n].y + F[n].height));
  for (const [a, b, label, kind] of J.links) {
    if (!F[a] || !F[b]) continue;
    CREATED = [];
    let pts, hex = '#475467';
    if (kind === 'back') {
      hex = '#98A2B3';
      if (rowOf(a) || rowOf(b)) { const yl = bottom2 + JGAP.lane * (++lanesBot); pts = [[F[a].x + F[a].width / 2, F[a].y + F[a].height], [F[a].x + F[a].width / 2, yl], [F[b].x + F[b].width / 2, yl], [F[b].x + F[b].width / 2, F[b].y + F[b].height]]; }
      else { const yl = top - JGAP.lane * (++lanesTop); pts = [[F[a].x + F[a].width / 2, F[a].y], [F[a].x + F[a].width / 2, yl], [F[b].x + F[b].width / 2, yl], [F[b].x + F[b].width / 2, F[b].y]]; }
    } else {
      const sa = startOf(a), sb = startOf(b), ax = F[a].x + F[a].width, ay = rowOf(a) === rowOf(b) ? sb.y : sa.y;
      const mx = ax + JGAP.col / 2;
      pts = ay === sb.y ? [[ax, ay], [sb.x, sb.y]] : [[ax, ay], [mx, ay], [mx, sb.y], [sb.x, sb.y]];
    }
    try {
      const v = await arrow(pts, hex, 6); put(v, Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])));
      if (kind === 'back') { try { v.dashPattern = [24, 16]; } catch (e) { /* ไม่มี dash ก็เส้นทึบ */ } }
      v.name = prefix + ' · journey S' + a + ' → S' + b + (kind === 'back' ? ' (ย้อนกลับ)' : '');
      if (label) { const p0 = pts[kind === 'back' ? 1 : 0], p1 = pts[kind === 'back' ? 2 : 1]; const t = await labelText(label, 24, '#101828'); put(t, Math.min(p0[0], p1[0]) + 16, Math.min(p0[1], p1[1]) - 36); t.name = prefix + ' · ป้าย ' + label; }
      links++;
    } catch (e) { warn('ลูกศร S' + a + ' → S' + b, e); }
    CREATED = [];
  }
  return { made, links, thumbs: tk, slots: thumbs.length, w: totalW };
}

/* GROUPS = [{ code: 'A', title: '…', subs: [{ code: 'A', title: '…', tag: 'S1', screens: [[label, fn, 'D1 D2'?], …] }] }]
   screens[i][2] = id กล่องในผัง userflow ที่จอนี้แสดง (คั่นด้วยช่องว่าง · ไม่ใส่ = ผังยังไม่มีกล่องของจอนี้)
   fn() สร้างจอตามตัวแปร MOB · จอชื่อ "<prefix> / A.2 · S1 — <label>[ · mobile]" · คืน { made, y, flows }
   opts.devices = [false] desktop · [true] mobile · ไม่ส่ง = ทั้งคู่ · opts.rowMin = ความสูงแถวขั้นต่ำ · opts.flow = false ไม่วางผัง userflow */
async function buildGrid(page, prefix, GROUPS, y0, total, opts) {
  opts = opts || {};
  const made = []; let y = y0; const x0 = GRID.side + GRID.gap; const pitch = GRID.colW + GRID.colGap; let flows = 0;
  const put = (n, x, yy) => { page.insertChild(0, n); n.x = x; n.y = yy; return n; };
  if (opts.page) {   // หัวหน้าของชุดจอ 1 ตัว (Header Type=Header) กว้างเท่าบล็อกที่กว้างสุด — แบบหน้า 5.x ของ UI Release#2
    const nMax = Math.max(...GROUPS.map(g => Math.max(...g.subs.map(s => s.screens.length))));
    CREATED = []; const ph = put(await blockHeader(prefix, 'Page', opts.page.title, nMax * GRID.colW + (nMax - 1) * GRID.colGap, '', opts.page.status), x0, y);
    y += ph.height + GRID.groupGap;
  }
  for (const g of GROUPS) {
    const nCols = Math.max(...g.subs.map(s => s.screens.length));
    const top = y;
    CREATED = []; put(await flowBar(prefix, g.code, g.title, 'Default', nCols * GRID.colW + (nCols - 1) * GRID.colGap), x0, y);   // บล็อกตัวอักษร = Subheader State=Default (หน้าจริง: "A แก้ไขตารางบำรุงรักษา…")
    y += GRID.barH + GRID.gap;
    let flowBottom = top;
    const flowDone = new Set();   // บล็อกที่แบ่งเรื่องย่อย (A1 A2 …) ใช้ scenario เดียวกัน ⇒ ผังข้างจอวางครั้งเดียวต่อบล็อก (12 พ.ย. 2569)
    for (const sub of g.subs) {
      const n = sub.screens.length, w = n * GRID.colW + (n - 1) * GRID.colGap;
      if (sub.code !== g.code) {   // แถบย่อย (B1 B2) เฉพาะเมื่อกลุ่มมีหลาย scenario · เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก ⇒ ไม่มีแถบย่อย ป้าย state = A.1 A.2 …
        put(await flowBar(prefix, sub.code, sub.title, 'Sub Flow', w), x0, y);
        y += GRID.barH + GRID.gap;
      }
      const sn = flowDone.has(sub.tag) ? null : scenNo(sub.tag); flowDone.add(sub.tag);
      let flowSlots = null; const byCode = {};   // รหัสจอ → เฟรมจอ (desktop ก่อน) สำหรับภาพย่อในผัง
      /* ปลั๊กอินที่ฝัง ACTIVITY (บำรุงรักษา) วาง flowchart กิจกรรมซ้ายของบล็อกแทนผัง userflow (เจ้าของงาน 6 พ.ย. 2569 "อยากให้ flowchart คู่กับ ui ไม่ใช่ user flow")
         ไม่มีภาพย่อจอ ไม่มีป้ายรหัสจอ (flowchart ไม่มีหน้าจอ) · ปลั๊กอินอื่นที่ไม่มี ACTIVITY ใช้ผัง userflow ตามเดิม */
      const act = (typeof ACTIVITY !== 'undefined' && ACTIVITY && sn != null) ? ACTIVITY.scenarios.find(x => x.n === sn) : null;
      if (opts.flow !== false && act) {
        CREATED = [];
        try {
          const fr = (await activityFrame(prefix + ' · ' + g.code + ' flowchart S' + sn, act)).frame;
          put(fr, -(fr.width + FLOW_GAP), top); flowBottom = Math.max(flowBottom, top + fr.height); flows++;
          log('  · flowchart กิจกรรม S' + sn + ' (' + act.nodes.length + ' กล่อง)');
        } catch (e) { warn('flowchart กิจกรรม S' + sn, e); const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้างจากผังที่พัง ' + k + ' ชิ้น'); }
        CREATED = [];
      } else if (opts.flow !== false && USERFLOW && sn != null && USERFLOW.scenarios[sn]) {   // ผัง userflow ซ้ายของบล็อก (ขอบขวาห่างป้าย Device FLOW_GAP)
        const codes = {}, loose = [];
        sub.screens.forEach(([label, , ids], i) => {
          const c = sub.code + '.' + (i + 1);
          const list = String(ids || '').split(/\s+/).filter(Boolean);
          if (!list.length) loose.push(c + ' ' + label);
          list.forEach(id => { (codes[id] = codes[id] || []).push(c); });
        });
        CREATED = [];
        try {
          const uf = await userflowFrame(prefix, g.code, sn, codes, loose);
          const fr = uf && uf.frame;
          if (uf) flowSlots = { slots: uf.slots, codes };
          if (fr) { put(fr, -(fr.width + FLOW_GAP), top); flowBottom = Math.max(flowBottom, top + fr.height); flows++;
            log('  · ผัง userflow S' + sn + ' (' + USERFLOW.scenarios[sn].nodes.length + ' กล่อง' + (loose.length ? ' · จอที่ยังไม่มีกล่องในผัง ' + loose.length : '') + ')'); }
        } catch (e) { warn('ผัง userflow S' + sn, e); const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้างจากผังที่พัง ' + k + ' ชิ้น'); }
        CREATED = [];
      }
      /* ป้าย state รายคอลัมน์ = Header Subheader สีตาม stateTone (หน้าจริงของ UI Release#2 · 10 พ.ย. 2569) · บรรทัดอธิบายซ่อนแบบหน้าจริง
         ป้าย Device สูงเท่าป้าย state ที่สูงสุด */
      let sh = GRID.barH;
      for (const [i, [label]] of sub.screens.entries()) {
        const b = put(await flowBar(prefix, sub.code + '.' + (i + 1), label, stateTone(label), GRID.colW), x0 + i * pitch, y);
        sh = Math.max(sh, b.height);
      }
      put(await deviceLabel(prefix, 'Header', sh), 0, y);
      y += sh + GRID.gap;
      for (const mob of (opts.devices || [false, true])) {   // devices: [false]=desktop อย่างเดียว · [true]=mobile อย่างเดียว · ไม่ส่ง=ทั้งคู่ (แถว mobile ใต้ desktop)
        MOB = mob; let h = 0; const rowY = y;
        for (const [i, [label, fn]] of sub.screens.entries()) {
          const x = x0 + i * pitch;
          CREATED = []; PLACE = { x, y: rowY };   // เฟรมจอไปอยู่ตำแหน่งจริงทันทีที่สร้าง · ชิ้นที่สร้างระหว่างทางถูกติดตามไว้
          try {
            PINS = []; const s = await fn(); stripDividers(s); await polish(s); repin(); await bindTones(); if (typeof AFTER_SCREEN === 'function') await AFTER_SCREEN(s);   // AFTER_SCREEN = ตัวเรียกเฉพาะปลั๊กอิน (บำรุงรักษา: ลิงก์เลขทะเบียน 6 พ.ย. 2569)
            s.name = prefix + ' / ' + sub.code + '.' + (i + 1) + ' · ' + sub.tag + ' — ' + label + (mob ? ' · mobile' : '');
            if (s.setPluginData) s.setPluginData('builtAt', String(Date.now()));   // ส่งภาพไป FigJam เลือกจอที่สร้างล่าสุดตามเวลานี้ (exportShots · 9 พ.ย. 2569)
            put(s, x, rowY); h = Math.max(h, s.height); made.push(s);
            const cd = sub.code + '.' + (i + 1); if (!byCode[cd]) byCode[cd] = s;
            log('  · ' + made.length + '/' + total + ' ' + s.name);
          } catch (e) {
            warn(sub.code + '.' + (i + 1) + ' ' + label + (mob ? ' (mobile)' : ''), e);
            const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้างจากจอที่พัง ' + k + ' ชิ้น');
          }
          CREATED = []; PLACE = null;
        }
        MOB = false;
        const rowH = Math.max(h, opts.rowMin != null ? opts.rowMin : (mob ? GRID.mobH : GRID.deskH));
        CREATED = []; put(await deviceLabel(prefix, mob ? 'Mobile' : 'Desktop', rowH), 0, rowY);
        y = rowY + rowH + GRID.rowGap;
      }
      if (flowSlots) {   // ภาพย่อจอจริงในกล่องหน้าจอของผัง (จอแรกที่ผูกกับกล่องนั้น)
        let k = 0;
        for (const sl of flowSlots.slots) { const cd = (flowSlots.codes[sl.id] || [])[0]; if (cd && byCode[cd] && await fillThumb(sl.rect, byCode[cd])) k++; }
        if (flowSlots.slots.length) log('  · ภาพย่อจอในผัง ' + k + '/' + flowSlots.slots.length + ' กล่อง');
      }
      log('✓ ' + sub.code + ' ' + sub.title + ' (' + n + ' state)');
    }
    y = Math.max(y, flowBottom + GRID.rowGap);   // ผังสูงกว่าแถวจอ ⇒ บล็อกถัดไปเริ่มใต้ผัง
    y += GRID.groupGap - GRID.rowGap;
  }
  CREATED = [];
  return { made, y, flows };
}

/* ======================== ค่าฝังที่ screens.js ใช้ (ปลั๊กอินนี้ไม่วางผังข้างจอ) ======================== */
const USERFLOW = null;
const AC = null;
const DOCS = null;
const SWIMLANE = null;
const ACTIVITY = null;
const IMAGES = {"empty-vehicle":"iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAYAAACAvzbMAAAACXBIWXMAABYlAAAWJQFJUiTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAOdEVYdFNvZnR3YXJlAEZpZ21hnrGWYwAAi5hJREFUeAHt/QecY9l934n+zw3ARaqcu7q7qjqH6e7JgcPhNDNHjLJmZMkULcoy53n9xJX11rv7dtfP7f087+5n7fVnV7uWd2TLlEmKlHpMU6QsijRFz5AcTk6dqkNVd3WqnFCIN56z539RqEJVo/IFcAGcL4npAlABuLj3/M4/ExAIagjGmAQvgzQ4DdJU+qYUM/skXZmRtVibFLBAalYTRE9JMn6vSYj7b6QhQgwnKxX+HskMESkA7mMpM0u1ALDC5x2DUWYzFgpGmKOnKNUYsxRGLbWBRoNAzZFp2tBuOMPpXtYRAfrKPLCvjINDzhAKAkGNQEAgqAK4MOC5Sl7+JyB1HAUpq4HSmADFjidVs4HIKonyW1bmkkBMSiRi5s5tvA8VhDk54WFcgIL8aypxkWHMUYPUNhJRR2kHK2KAnYBB5xIcdZ4d5N//j4ERQhgIBD5HCIjAd7hi8YegvNMNarMO6kIKAi0qKEkrqyjcaqi0KJQKagK1NOY0BEL2fCrlNFpRc7IZTIOLzOnTxAaBwGcIARFUDBSKF18EaWAeJDU0GZDNUDAcblDTejYgB3NWRK2KxWZBCyYgazQlZSlQx2xwombQBHMMwHpQuMQEFUYIiKCssJeYcv4OBFs0CCaNTNBRiKJaRAHBlmAqMCXAbDMRspmTMHUnrT/Y3G2Q54gDAkGZEAIiKBkY0H75jyHQB6ClbAhKVA/KIZBBUDIUm4f2oyF91pwzslbCfPo3+0weTxFWiqAkCAEReMbZs0xuT4PaBHEtqARCXD9UyQGp3t1QlQLdXyoP2IMSMpgE+v4A6DAItnB7CbxCXNiCHfH2C0yNdoEWSEM4q3ALQxcWhp+RJWZFAyFjITmjn4+1ZZ4TLi/BDhACItgS7Azfyx4F5RIkolpKjdiKiF9UM4QxM0ND6VMmpOEr3DoR6cOCLSAERLAhDBgZ/n0IBFohrNvZMCMkAIKagspAgWpmyI5n+8ymNHmeWCAQbIAQEEFR0NK4exSC05CKBnUlxP1SwjVVR6CrK0vM9KzZmH36N8EQlomgGEJABEugaLy892agq7E1YhtKWNFrt2hPsDkwEC9xMTHSZkZua0wffRYsISaCPGJxEAB7m6kXri5EQywQcShRQSAoQlAFZoBmBjXIvGVBUgTgBUJA6hR2lsnDJkQcORMFSwqCQLBFLEXLtCYh2f0V0EWtSX0iBKTOwErwmzchaqsQdagurA3BjsllchnpU7/ZlBBCUl8IAakDsOfU+W9AWCWZBolJGggEJQDbqzQyLWUYkOoTgfe6QAhIDfPSGaYMHICYybIR2yKKCIgLygEG3plCDZWE0/v/FqSEVVK7iAWlBhn6fRZMRlMNTUElbDoggUBQIbA31xS10o83NCyIRo+1hxCQGgHdVP/pn0+GD+yKRk1bDoNA4CPQvQWmltTozXTfl/sMAsK9VQsIAakBxr7PwlPz2eYgJapwUwn8DLq3gkEt6zRB/MAzxABBVSMWmyrm1bMs1A3QaOh6CASCKgItEtOyM6NtEwvPPHNACEmVIgSkykBX1d0XQbNsaDAMPSQsDkE1gxaJErHTEI0m9n8KTJG5VV2IxaeKQFeVaUGjntZFKq6gpkCLxGZOVpuJxA98Vbi2qgUhID4HLY6bL0MQbqabDFkWripBzSPbdmr/iWicPCQ6AvsdISA+JS8cbDzdaBiycFUJ6gpsL09sK0VDseSx54gJAl8iFiUfgrPEr3072cJsNQYCQR2jAjhSTE/0nWtKiFG8/kMIiI9A4bj6fYg4C3qzmL8hEBSgakZDBOLdn4WsqCHxD0JAfABO/HvnhfFQtKGxSXTGFQiKgxlbdlDLHj8IcyI+4g+EgFSYs2cuBR66/2izuaCL6nGBYBOgkICkJSdGYOH0GWKDoGIIAakQZ88y+bC10BCFYIPoVyUQbB3ss2WzUPzQb7kNG4VbqwIIASkz6K567V/c1Vpbe1sY0QPgMTIlUiA6eZTIpBXvO0wdsc3mu47JRABSUJNQQvVMJjzz0PPCrVVuhICUEbQ6TtrJZpWpEa+tDiWQjQS0xOckyfobfCvWzz9Yt2aEMYqN667bTuCPUunmHyksIDqiCmoOflI7WlZbGBiHpMjWKh9CQMoE9q2KOdk21SIKeIyqploDkfj/RoA9tfTgaoOeEcdh5Du20fuPLJOJnZqgJkFr5GZreO4Z0aixLAgBKTG5mg5ooUSPcgPb8+MdDtgREhr/JiFwMvcHV//9lXcYlf7csHb/V8KlJahVMMiugRbvuwWidqTECAEpEfkxshE122KXwOrIE20c/zIQ+x9tJBzLXwOlVPutbKbjZyAQ1DA0QnV1NDy3/6tgitqR0iAEpARgrON+gBZH16NQYqJNd17hotCTv8+W/pN/YIV4LCL/PJXs+G1CVOHKEtQ0aI1EHTPRe7chLqwR7xHpox4z8jWmPeBke8ohHuHQ3IG8eKBOuFqRF4mlBxYfW3qc78yYdSocMkSbFEHNgz3k0oFA49VDmS72EiuZJ6BeEQLiEZie+/YLc4066F2ldFmt+Juy3eX+u9riKGp1uG41fJ3c7CRRx7FE4aKgfrCk4PWJbPfbLzBx3nuIUGQP4CelerM53RrVQ+Vtt065Yze/BWCrgyAFX977nHBdCuoO3NhFQ3rn2y8kkg82x+bJc0SktO8QYYHsAAyUT51l0XBU7zH08s/qYFLwTlGLgy29vpXisfgc148pWVYzIBDUIdGQGjtvZrtf/Rd3xHydHSIEZJu4o2X/CJrndL1dqlArEivRdIubErdyLwjWtjpWxUYIZZezenQOBII6JUiJ2tnW1v7e1+abQLBthIBsA/Y2U6/+20x3OqA3QgVxJEZtW/4GF5GlhnIrrI7iQXUufaF/CQJBnWMByCFZax77PmtjZ5kYn7ANhIBskZGvjWjXh6ALVH+0XbfSvX/MqPR+UXfV0tes4Ev5L3Sz4x0QCAQuibgeu2VAB79+hIhsERFM3STosrrxIjSYab3Zb+NlA+p8rxJI/W88qv7w2sIBjID0Q4O2/A+OGZ0HgUCwApx+mAJt9uSXSBoEm0IIyCbAdiTXv5Fqs0GJgE9RAnZEVab+Fr8GPs1vA4RBmH+4lDKS4uIxykD5vynr/aHogyUQrI3bBqVJi/d9HhZEi/iNEQKyAS+dYUr37kyHX1xWG6EGLJVAvI8Qp1Viku1Y6oRuRyYkOSAG7wgEm8QAO33iN6IzXERE9fo6CAFZh1fP3gk16m3tYj65QFCHqNQ4dCA8Lcbnro0QkDUY+z4L60m9XUwLFAjqF8XW7H0nYEKISHGEgKwCY803vwuNelxv8luwXCAQlB8qA22KadM9nyWi+HYVYoEsADOtLr0IzbKjN5RidodAIKhOMLiuqNrc/i9CUrSGX0YskotgIdF1HVpt0H2baSUQCCpLMKbN938BFkCIiIvw70MuTfeqk+kU4iEQCNbDSOrNQ2dTbewME2snCAsELp1lAQWgnel6AAQCgWATKKCl92kwW+8dfetaRbGnFbH0biEeAoFgK6C34rIMHS/V+ZCqurVA2BAL3nhN77REjYdAINguFjXGB8JTp0+TuizUrUsBGXmJaWxM7xQ1HgKBYKfIErPu7gpN1KOI1N0C+upZFtJv6l1CPAQCgRc4lKi7J6AbXeJQZ9SNBYIFgue/DuEo6K3CbSVYDywglWSy4tpwTCZ6IgnWhWiaeXAApuqpar1uBGTom6zBlvUWUSBYX6AYBGUpyD/2EI98BhhxAkxSVJmBSiSimNQJKtRN6g9wyXDPDX5XItLKTQahy12MKciOxBybEaCyLJsWtW33eVkxCVgmUMWglGYJd21gARoI6gZFZbYhhyaPPUdMqAPqYjE993UWCah6uxCP2kMOEMmxQJFlolDmRCRKwkxVo0CdGAMS4R94CEhlPndus1AiS2lKIU2YnSKKnKKUZWSHZSSF2bbDbCEwtYeiava+A/XRP6vmF1QRMK8tJJA0R5GaFBQIRYlKlMa4b0njTwUqJRRbBYWF2ze6xMCgIKX4IwlwWEIhNG5xUQFB1RONaNZQC9R8YL2mBQQD5s1pvVM0RaxOtICkWTZp5OttMxDSyB1LTYBCUcM4XFQUIs1a1IrLjC4QqqT4+9dBUHXUgyVSswvryNeYRmW9QwTMqwN0RYFNgtxQbOZC0U4IbSIUQjzOoFSLZeE5mPnBAHewKUmRZg1mzjmmvACUmaokgvrVQNjSjOs8sF6rlkhNXphDP2BBsgAdtqXXdZWo36EOURRNamGUtvL9WhvItIEvmMLVuA480G+hu4ury4xpO1MBJiccISa+RmfMPDkSGidnam+6Yc0JCPa2CjrZTtsiQjx8BroSGSUqC8otik12U0LbibAQdwRfkUxJkqb5gR2RsjRpySKG4kciXER6v8RFpMZG5NaUgGBfmp7pbCfTieht5SNUmSgmkdsUiXRwa6OLn3VVMV++quDuLm67pSiTZrmsjBHqzIkML3+hgJ3e9xvRaS4iNfO51IyAYHvlq4egCyxdLE4+AN1Tqiq1MontYoR0VYulYRM9aDJDA9lWDKZra32fDEFTBtlRaTAbgHAWfAZaJipId0xqTCiyHBeFkP6AKFry4K/BbK2ISE0IyBkuHl8cgDYxz6OyKITIBnViakDuYUzqrmQNxlqgQFhgBnRINabIfLfOkh0OMVv5Y00OsxoZoSrfjqh8Q4+xmHXcoMQmuO8HyZJAMiQiJxUWiCsQnAswbVaDpokINM+FIJKSmVI5txJ/I5RAmkjkNnPolGWytAjAV5bcUCoShxqg6gUEE1Xe+VayNWqrMRBUBMaIGtTkLt1mfQqBRj+JBo+zSAkytisOs3uzLN5vgt5LiYWpwSEoMYQRXSaBWRkC82ESu9lIO662QM8YqZCgcLVzgEizlLHbtuFMCiGpDEzli1ZGmz38d0gSqpyqF5CRr7EmQ9abQVBW3H5RktzoULaH7257feOi4uK1AFPtc+TO0Swk+3VI72fgRLfyK3hQmt8IKMraBohtO0Ap47etzRMi3FoJsPBIVGq+GKPtt5qga6wiFgoDg7+aG9Sik0Bo1S9k1QbGpxpbtamez5IMVDFVLSBj32fhhVm9QxQKlhed0aZoQDnoENLul7RbU8poUzBydI6NfZC7qXq4Zapt9DPBYBA0TYNwOAShEN40CPH7KByE5ERkLRhD8aBgOw4YugHZbBayug6ZTJbf0mAYG7dC4n/DViAw0eB0vNrJ9r8fItE0lBlCweJvdJSvaNcdm1b1YlZt8K2Hk81q4w89X72FhlW78GKhYDagd0qiRUlZQJEmktzO9+f7uFe91Q9uKofZyqQ8fHiejT9okNRxLhpFs+94wNIVimg0Cg0NMYhwwYhGoqAGStd92+HCkkqlIZlK8X9TkE6nXXFB0SkOcUIsdr6JdL3XCr3DQVpeMcHGkISycULsG7ohJ4R7qzxU+yyRqhSQt19galNDtkvUepQeRSOy5cgdASB9NqEtfrA4MjDfOE6uP5yE6ccdsFrQL1T4PApGgItDNBqDlpYmaGps5PcD67qkSg0KB1oliUQC5uNxWFhYcO+jJbMKJjElHiEt73TRgdejrG1WIlL5FnMMujNpQpXoSMag80JISk81FxpWnYCcfZbJJz6Z6QRVEum6JcR1CxKlhzC2ny/PDeAD5qXxXVNw86E0zD7OigTBVVXlgtEM7W1t0NTUCLLs38xhy7Yhw62Smdk5mJ6eLurykoicCbDolR524CfNrOculBMuJA5hsxIlw8xxpkFQUohiJQ/+Wqzq0nurSkD4bo1c/DfpDjUoh0FQEtz26ETuIg7bTzCjygfMk/FdY+TaR3VYuB9WnbMoEigWnR0drnj4WTTWAq2QeHwBxsbHuYWSBNO8V0x44P1aBxv4YTvrGymrReK+QGlaYsY17i2eF8WJpaMa03urSkBGvsuajKTIuCoFWMMBitwBEjtAHW5x+CDGkZCm2+6SwU/pLHmCWxxL8Q10UWEAvL29Dbq7OkHjwe9a6bdomRZMTk/B+Pgkj5msjGlj0D1II5d7ybG/aKQdk1BOXNcWmwCHjPAIzywIPAfTe9OR+amHPttTNckMVXPVYYNEe1LvFhlX3iNLUojKcIgw0uuX4PiodPnhObj7UYdYbYXPKYoK3d2dsKun2xWRWsWyLBifmHCFRNdXdnOXQMo2k56/6qVHX1eYZkAZ4caSTRm9LhFyi9m0rH+7HsAW8HeuwvjpM9URVK+KxVgEzUuDWwCoynttwvaBD+ZsEEKlCTKyf5INf9YiRi8UnJ8oFr29u9z4RjBYP63ObB4rmZyagrt3R7mQrFyvVQiMt8AeFJJzUGbcKYsSuQbUHhVuLW8Jalq2bxCmqiGo7nsBwbjH1T/NdIMlguZegVYclZQuQtkRSQJftH9xmKmOSO9/fAEmPlqYVYUxDbQ49uze7QbJ6xUUkvHxCbh1+46bIpyHG4x2EBrPH6APnS17T66cW2uOUnJZYs48CDxD1uzUgedivk9e8L2AXP0Wa2O2LtqUeIRN5AZFYsclibSCT5iEG/smyNCv2MToKXwcYxwD/f2gaWLvkAezt25cvwHTM7OrhEROdcC+sz3OwQvlD7Lj/6RRojpXHJ36rrFkteLs1qaPnSYp8DG+FpBX/mg61ipFW0XcY+egu4oHyfsVmQ1wP7YvtvKmpGs36XsfTcuzT3G/+pJKRCIR6O/bC83NTW5bEcG9zM/Pw82btyGRXO5Cwq0RJ8paf9EPp/5KZeGyB2L5R5U1gVyVbfuucGvtHDyGE6BNnP4y8e1IY98uzDgYiiT0bikgKs13SoBbHZYEJ4kETeATFshUx21y/m+akNmXf4wHZqGbB8f79+4FWRFzpjYCixNHx8a5kNx0+3LlkVlgejcc/3or670N5QZtEcKmssQ8r5qKmOW+Q4jGzIOD/i0y9KWAYNxj5NvQYdq6qPfYATiTQ1Jgn6RKe/mF7Rs/0Azc3T0qXfx1G8wllxVWiu/fNwBtba1umq5g88TjcbhydQgMYznILoGS6KGH/7gTBq5DJSBSkllsWHKcMTFyd2fYmrlw/LnGOfAhvrxSr59ljZaut4Bg2yggRWwCJyXFP7EOZJwMH5qAq3+bEmcpeB+LRuHIkUNuQ0PB9kDxGB6+ATOzyyUa2Pm3je3+7h528jWoEA5jo0GHXTQZ27i7pKAoWB8yPz4z+cTv7fZdfMl3AoJNEllA7zRFk8RtgfEiGZS93JNwmEn+iHW4cAf9TXj3qTkY/QwjTM0/uGdPr3uTJeGy2ilY0X77zl24fftOYdNGGoX2l/ezh/+yUoOt+MvKALPPM4eIlijbBOtD9l0FdGX5qj7EVwLCzjL5upPtEfUe28Pixm5IDR3mAWlfFATmwWD5CHvn02lp/nHGqPvZYkouuqww00q4rLwDE6Li8wtwbWiosG6EhWjTW/3sgT+vRMt4hBDZJtS6YRpwXZJZVXaerTSUUP3IF8MTfuqX5ZsrV/S52hlElttlGe6nPop1IA6xlavk1V/PQvzB/GMY7zh+7AjEYiI7u1Rg6/jBwcuQLmiHEoTw9cPsyRfKXb1eCGFsjkjwvm3SighZtZN19Pn7v9zsm35ZvnETnf8GhIV4bB1sfsgN3H6+iX/Uj+IxDK//jULxwDjHifuOC/EoMTgk68SJlcfZgMy+K+TVL+NceKgQjJAWypQnJVXuAMGWCQa0xh/8/pBvrnNfCAh7iSlhCUSTxC0iUyIxUI5IKjvut26CKB5D5I0vpMjc4/nHwlw8jh09DJGI2CeUg7ylh92K8xiQOjIEbzyH/cagYjgBvuF5gG9+DoBgS+AAvY7mnhaGI8B8gC9exLmvJzuCoPiipUa1ICsSX4Xl+xmh/stW42I2RF77pQSb/ki+LQnuhO87drSkUwC3C8YNbNMGwzLdbCaczWHym+PY7sja1SjcV4jDqfC9aEHNjefgYo1DrPwYz8GK9UuDV9ziwzxhaDh3kD359UoF1vPwPdAtsOwrILK0toSqaXP7niMLUGEqfraLueZbhymsixDlKF+ZfSe6jmSqN9n5D8XJ2C/BooXb2NAAx/hO2C+9rLCvFHa4XVhIQCKJI2eTYFm2u9CuPXJ2bVA0UFDwFo1EuFhG3SmIGncjqYo/8kHwvV29NgTT0zNLj8Wg5Wf72RPflZhU0ToNSqVZVXXOWzr1ddsOP0FloEdS2hip8Dz1ii7aZ88y+X4z2+1QUr9d8rYAiqwiKf02YUf8MFq2GDflcx+cZbd+JX8/Eg7DyZP3VVw8sIfU/Hwc5ubm1hsn6ym5OewRaGluhrb2toqLCYrI4OWr7jFYhMZY208Psif+HCqPyXX4fcd0yjvnpIoJKE6m/9ciU5XMyqqYgKAP79oLyVYWUkU0dRNgsJxSch/3Du326/SkUXLp/gly/W/D4nmF4nHs+FEI8YW0EjDKIL4Qh4nJKZiZmd3QuiBMTksgL8igJlQSmCdEzaogZxhdeYHaxGrg/w3YxI45zGqgxG5wmMPPY7ZmMQtaKTgxsbOzE5p5TKJS89kdfgzOn7/ozmbP08p2v7gHTr5aaUuEoMYxcpkw+6bopbVJGrWZw58jSagQlROQrzHtCuhdwnW1MTgtkIc8uctK6gOfkiLzTdfh9d+xFwdA4QJ59MghaG4uf24ECgX6+ycmJmF2bn5NS0MhgTmVBu5qpPFmmDWOBkl0PgJNCwGqbbqHk0H0oA6Jxgwkmg2WasuQhQGTpAccsIvGpgiRoIG7uLq6O6GzvQOIVP7TP5vNwvvnzoNp5rwfOHt9Nzv+QhvdexMqDHOL14WIbBZ3AFUXjJ8+XZkCw4os3uwMk87vyvYEg8J1tREqI6oZIA9xnW0Dn4JpoYPkZ3/PAr0f7+Nu+/Chg9DR0Q7lBIUDrY27d+5CVr9XA7jhZgZJeDjCmq42sq6hZrZrFEpEgky3zpGxIyk2e9wi+i4KdsPq70G3Hs456exsL7uLD+M/Fy5eWmoJr0Bg4gB97F+GoSkBfsCRbhDFvuyYoo/WRjRqWuqFQZg9U4GGi2UXEHRd3f6ThaasE/RNZ1jfokgxWZLvY4z6qp/VCviqfJX84gspmP0Q3pX4jno3XxT37i2fpw1dVXPzc3Dz1h1Ip9MrLQ4GVCHB8Sbo+EUz7b0aYc1xmZQv84gyKukkGZuGW0cWpMnHbGLszlfj58GajV27dkFXZ0dZ29ePjU/A8PD1peMVZNHLx9jT/5pgsqgPkBzpjsTsQdFHa2MM0KZOfomUvTiz7AKCbdqltN4jXFfr4zC5KRCAB5gPM60KmSQ3Dt0lF/8eLJ5LnR0dcPjwQSgXiUTS7f2EripY4fEgjsYil9tgz8/aaN/1corGWqCYzMPo7hnl1mMpOvdY4eRFpLGxkVsku3ispDyZ2SgcN2/ddo9fnmbW+50B9sDPwCcQymYdyt4Wab7rs9gra7Tcbd/Luoij9XHzLHQaui7arq6DI8uNqgSPgQ/mlK8Hxj2GyWtf5f5+10KKRqNw/6kTZdlFO9SB29ziuHN3dIXFwWMMdog2vrkLjv51A2udBZ+ShtmWUeny6TSLP0QJXVFZ2burh1txvW5tSanBGpiLFwdhbi5XI4JuvgH20L9oYt3j4BcYJInC3hDTDtfHNs2F479d3rbvZRWQV8+yUIuud4FgTWQiNxNVfpgyx/dzXC+Qv/77Jsm45gbOLj/FxQPrIEqNoRtw+eo1N5OoUDxUpo30wtF/3wK9o+7KWAUkyVTHLXLxcwakjhc+jlMZMY6EacClBosn333vHA+q5zb5AYgMH4YP/t8qDVS0xqAQHgmZV2T6hmUy37wmv4FJB4dvaXfL2bG3bA5XtD7C2ayY8bEOJCA3MAkeqgbxuE3OPZ4XD2RXT3fJxQM1YT4eh3ffP+fWcuTFQyKS0Qzd3z/Cnv6DFtZ7t1rEA4mxjqnD9Kl/2wn9fyKBstQkD2M5mCmFs89LXa8SDAZh30DfUhW9CemB23DuNLrcwCcQCZptJj1qgVSZnPAqAMMCV05AIzamhTJRtj809E3W4FDdv8HgCiMH5GagPOZBwPeNotLSfPMQvPa73HXlJkJg5TU2SCxlbQMGykdu3YJxHvjFSvJFqAaxwV565PuN0FX1BWhJ1601+PEMWXh4OdBOYHdvD+zZu8dtoVIqUKQuDV6G2dlFDwgDqw/u/z9b2e5b4CP4y1xQJPqasETWZm5Gm3ji90hZ3H1l2WFgs0Sujo0gKAoGzBmTH6kG8UDusEsfy4sHLnD79g2UVDww3nFteBju3Lm7JB7oq+dWx3884nzoj2pBPJAYtM4dZh/8s0468E0J5MW2HsyN81wevAKWWbo1E62PfQP9risy9wCoE+TaL/nJCkH4y2x0HOkJ/oWv44OVpKk901SuZotlOTmGR1LNtqWLIVFFcAPmAXgUO5RCFTBNbg5kSPzh/H3cHWOvq1KBgoFBXiwKzMMX1/gAPPj7A/Thn3D3VW3VCfArfxc7+l4fPfUvVRq8m394bn4eLl4adHt4lQpstb9nz54lV5bO0gdG5UsPgt+QoEGSpSck4c4qisQk7er3IAploOQC8urZOyGbiE67RVGkmCIBLsZVIR64G50k1z/JgLqvNxTSYNeuHigVKB6XL1+FeDzXdJRgH0nQbg84D//LJtpzB2qYZtg1dkj6wB8EWPha/rFEMgnnL1x0g96lYjf/PJdmiBCQZtndTzqS7b+CXwIxR4L7A8ISKYq6AM3o+YESU1IBwWBOl93bIGo+7gUrzIlM7ucHpmpSmmel230GpA/l7/f39bkB2FKAcfCh4evuzjtPgEWv9rFT32gkHVNQBwRpNH0Envo3wQIRyWZ1uHJ1yG0OWQqwtcqe3b1LVohDrLYxuHoKfIgskzZKlKO5oWqCQizQ5dtpKHmfwZIe+NdeBM0gouZjNdjbiqF40OqJC1HCrQ8Y/lT+fgN3W7W1lSYnAluSDA/dWNF6XIPI4EH2xB83svoQjzwKCxhHyFN/GIGWX+Qfi8fj/PhcdxMLSgE2fWxtXf5s5+DOx0ym+9JdRGW6m4JyUGxS7yU1p8dKbYWUVEB6DGgilvhgC1GxJFpSjlGZdEIVMQO3BgzI7MevcXfqtiopwfAkzAYauXkTxsbHl9JXAxAePkAf/3oAtLosJJNpwDpEn/hOmDW+nX9semYGrly7tq35JRuBn2s/Zn0tJkbYYHZOSsPHwacQRg9IEuwBwQpk/v93riVL2jKqZOp07usTEd2nu5ZKgbskC5SjkkT3QhXhxj6k65+AxQ0HDktqbirNeYn9me7eXS6CDkBo5IDzxB8FSNgVD7SEdCcTNKkRYGDLfGcc5O4uyaJ6AAiVdccIMWYrPE4jWWCGGXXctCK+CIYdttxunVI7yH37nvjfCJMdhagr+hApJJDlH7frZ5KIaqr8Pn4dUiJu620ZVIs/buNEQEVSLf7zlippFhdJs1hiAPan2s8e/7Pr5FWShsSDKK5TU9OgKirs29fvuZiHI2Ho7OyA0dEx9/4cufuxLnLwvEoDvmwpwo3644rCP1EbRkCwRDSkxtjbbIE8VJrBUyUREOy2e1Xl7hmrdBkjVQmDfi4eVbdTmpCv3GcRfQDL87BZ4q7enpJYH1hZfvMmlh3kLA/sFBtPxaU36V9+mTJHc5gdRbHgT0uMUIX/SxjOZ3RTFhmK29Ys6sq2DKTY6YnwN8KPJb4SutjEkBunks4XRJ2LUEoCWZcl2VBBSymgZmVFvsWjZkf4O3VTvtFSa2yMQXu7952Pu7u63LobtHJ4LKRzgl65fzeceAN8CPfmSfyYHSGSleT7nRkQLMENVXSVl+SYlERABo9Oh2U95vtq6nISVOUOk/ALn1WXS4/v5OU5Nv4kNrXF+7FYgzthz2tQLC5fubZU54E77GQyxe9be9d4YdWOhKLHSGHZfE7RHHyAYYfVTOHDOfg+UjIkt/Ei1mzgcRq+PgIN/HMJat5ectgluKOjAyYmJtyEmFkY/XibNHAxxIP74EMYxtUV7X4JnDdM0/FHW3ofQA09eunspcSx5455bj16HgPBE40YETFlsABZkkI2SMf9OoZ2PeJkvMuUskuLOLo1SmF93LkzWlDjwCCTyaB4gOBe0CLA45MHe1hdHxnxvOUJfs7dXRiqW87IirOxPvAxaKnalInMrALQdS5ld5dkTfb8IN99ETQsZAGBi0z5iUzIg3wHX1W1MBbT1UlzpGfUGTrNGHW3thhU7eI7Uq9BS+Pu6PJsJ1033Kl5grXBme6FIoIje2dmvW/EGmuIQjS63CCBWyFPgN8hpJ0b+iehguB1r4Xih8PR6c+HGye/EIrOPuQomYp1mmCKGn3pjPcZWZ7/wgw2TCQi8SoPDZITBOvCfErGSYSnrbs9C87k7oyT7jQdvdVk2Q4KdiP2C8GRtNLiPqOnp9vzEazYpuTqtaGlyXjowspkfOkh8Rk5Kw0nGeLNzV7jVkhTY4On0w1xKFh3d/fS4CmTpA+8m/5PfyMCjTcbldbJZqV3Kihp/gusM9IbCCozpmGXveA0FJ16SlGs/5pvGo/mXgu/ySY0RDKzjCb/IJNq+RNgalmPGY+uSft7AVtGeLrL8HQ1OPd1FgmC7v0WtQpBs5E5Sp8SYEepj1xXDjOVuD3TfNcYPrZgT9zHLY1Ohzlh7om/p1MfFgnmq5Jxxsf995/0vOPurVu33aFGSC7ukVxqK74Swi0g2X0dsiy5s8UxoI//4kmM/n8tqLnfo2ma635RVGWxASFxvzc/pwSfw1kbGn9/xKPZJdhiPqsvW034XvKiiC6n/PxxtKxs/jgu/tjbyg13MB6kdujSz1B+czaZnotxkKampiW3Ynd3Fxw8sB+8xLIsePud95Y+F3zteONH1JKJnIzIjUMtSvflPdqRK5oU9Y3pSHL7kzcZdcoSVLeJKTfG5n5Dkuz/il9PYVgxGDP/H6yRlb9rGrv+v+VuCElloEd6tFHi4fx0zyyQM2eYFHQzr0DACUhyuyP7RzzQJXVbv3x4VB9+SmepfcUEYzWFA41i0ShEwt5a4HpW566rsaX7TU2N0Nba4gpAmP8tDOIGA0FXFNB9pmlB91+Vvy4UBhQEvJEqtnhRXFA47EXhQKEx+EJtWSa3xriQcIsMH0txqyzNXX0G/xqf0w0DUqm02/YdF/PIorBPTk65IoKfl1egRYOfDaYNI3he4N/kO2zVZrRlwZ55FG93jKtzUblpcH/ogZdb1Z5pqDAYVCeKfL9uGq/yM6fkZm1DdOFhLh7/w2Km4PLrKAxNua3W7S+ogbF3LbP7W1BG0AoZnk6hN8Szz8azK+/OWRZKOXqnKBzkpwcPmgcV+Qm+s6x4d90sywTH9KsHb+qXPm8zs22zP4eLMo5WzS/OB/iutqfbu1lgmHuEfa7y1eYoDJ/+pU+6VoFga6CF8MP/9BNXTJDGhhicOuVtCGB+Pu724Vq+P79kYa2G24WsQW15a5/24I/b1d6Kdw4gEpvjC/drjslK2ngz2jT6DWD0A/n7q4Sj4Gv37mjW6P4os9XSNTYrAlohmZQ29tDz3tSFeLY7TqTTjUI8cq6rgCIf9oN4jBpDe95O/OXfHc6+91tbEQ8Ed5158ZAkGRobve24m81kYXZ2uc/V/n0DQjy2CX5WhW6rJLdMcPCWl+BkxMLYynrjdrEuZ8GafeT95H/+3bcTP/pMxk5VtJ0Ro6TFoay0xbvECgBzHl36m+uIxyIdATl+GMoMWiGa7F2PLE8EhJ1lAe6LFT2vONRRdnO/xC6oIDpNhd5M/uC5i+lXfjfjJA/ANj7nwiaJ7e2tENa8/XjHxsb5YcrtYAN8YTqwfx8Its+B/QNL8Sp0i+HsFC9B8Whva1txfyMo2JFZe/Sjrye/93u3MhcOQQUhIB/mbs+STUTVwuke/lcUxhb1Iv9FXjwWa3vQXZlLt2aqJDsVKSqWQnqMvwZP1n5PfskwpMSwKATbs/OguZu6UiHGjeu7X0/+x/9i3prgpvTGcQ60MjDegH7zo0cOw2OPPgKnn36K7ziXfegtzU2eZl+hy2VyatkN29/fx334VTFLy7dgLOjwoQNL97EFft6l5RUdHe1LVikKSHiTMTGLGR1X9Xf+7rvJH/+SxcyKtIbHnAq+ZJ5iAVKSv09AMlcIB8JW3tgqS4TwkBdUALRC3viTOU+CZDsOor/0ElPsm3qElG7aZlXgdthlcB+/VWx2wrXMW/ffMgafpczZMFUKLYzeXT2wq3eXW1kuF4xLzaQzSxXh+DhWn3vJxOTk0u8PBFR39yzYOb38s8SxtBnuHsTFCodw4bRIr4jGou55gwWfKCRPfuBx9/y4cuUa3Lp9e93Gjhhwn7Hvfuy1he/13x/5yL+LqS1JKDN8zY7IoBxksjXIHG97GaR1bSoWWUC/YVP+jy393aIuLKJboNyGChGCUAN/XSn+Oe4oLrRjARkYW4hl5WDdxz64E28fo6xiM9/fTv7oc7PW6Ic3+j4MjOcD4tIaKazzCwtLJz1mXuHgKK/INQFczqrcs2c3RKJlGZ5W8wR5XAIF48KFS+59tPJ28+Mb8KguRObnSwMP0Oc7BiQSSXjowfvdUbg45OrNt95xZ7gUFjgWgl0qsix54I3UX/5/TkQ+9K86AnvKP4qY0n6HyTMSOJ7+bckJ2OCQvwDCfiP/WHHhcJ/gcRl428g0DEkV2ngHKVHH/wLwws7ADtiRCwtTd00WqPtpgzjT3LFZxbbRFzI//+CcNfbUet+DQc+jR4+4u0a0PKR16h+wMjwP7jq9BOsg8q4V3L324QhVEHhFb0/30tfoKkwlvd3oN8SW46+Fw77QMvngk0/AZz/9qQ2tHodZzRfTP/vKgj1Z/gJb7l5WFDhSCleWYYT+mP/jZp0VFY9F9xb/v0WZ8g1JDpRmKtgmydg7H3u7IwH5ygOgOZT4b9xlGUHXlaLCCb4eV+Q4oHiM6cOfx660xZ5HVwNWkH/0I6fhyOFDGwY/8cRfWFhYuo+t271kYnJq6eLCKvfW1pLFNesSbLLYWzBmuHCWvCe/v6lxKQ6Crs7VM9rbeKD9U5/4GHz8Yx+B1pa1P1seC2l7N/mT/9d8JUSEQUyi3k8ytO3WEepE/t/YFMB9YCn+sRwX4ZaHxZhyxnR2/TVUGDOrh9gLbEfr1o4OoKGDt87xKgNTdm0Z9vPrqSJJBNez793Hg+afgzXEA62Ohx960L2FQpvLosIFIR+fQCvFSwsEfeRYT5AHF7pqLgL0K/39fUtfL3A3k+3h+FtMtc5vQrDgEYsZi4Fpxb/8hc/CAHdvrYXJ9K6LqZ/9mk4TZc/g5K7/PYRRz4e6ZbOtbztm668xKv9r/lfu8s1ShqGbiMEkY9KPqa09a9i9f+p1DGY7YDD9UvPOUnq3LSA4KtHQ63tcLQG5gTDJ274Rm2TGHmsb0S/8KmO06A4C4xZPPP4Y7N7duzRZbjPgzO38goOV3wE1AF6R4e6rfJ8rrC7v6fGuMFGwTK6aP5eGjW6shQXvOpuj2zGffYWW5Ozc2q2V0K31CW6JYAuctTYKGZo8dCH1i09VInPRAeUYY5b3riwrMpXN9v7PSbPtk5YV+4xNGz7nWK2fzOp7njecrvN+EI88mgMR5lbHb49tC8jdaWF98LPgPiKVv1VJhu/YLqRe/jsOs4vuHjAl9qmnPrgt91C8wH2FLUWw75RXYGyFLs7xxpnqXvfVEuTAhbujPdeSDhd5L4sKUQhi0eXPDQPp64GC8wG+kcH4iLRGKvi8PfHk+dRPn6bMLuu1xF9NSA4GDkKJkO1wBt1altFy3XBiC+BDbEtXJr8B286h39YHhtZHPJWt66ufSkoXF4+y+28poeR8+qe/bFK9p9jz6LZ6/LFHt704p1LLAfRIxNsAerxgIWtrbV03kF8KsHgRYwKlmCO+Gly48e9NFsR8yklnx/KEQi8tECRcULOzkNjc777v+DG4/9Spos9hX7YJY+SXJqzbPVBmGEh9qiTVdRrgtILB9O1ZIdu6gq8mIKQqpGTz1P0OdYgiM1aRytrb2csHFqyZB4o9h7vDhx58wA2kbgfsAItzJvJ4mb6LJAoWm/b2LXVW2RG4gP74J/8Z/vz7/xFefe2NsggI8vLPfg7f+e734Ec//ok7r6OctLYu720y6bSn7zlU0JVgs8WKeG4+9ujDK4odC8E6keuZdz+DM++hjOCQN0eSD9bzACoeiwiNfA221UdoywfNnT+dgbqeOKgG5AFu/5b9GBhMD97WBz9eLGiOFyju8Lq6th8XdGzH9ZnnCYe8C3FhK/BCcVovQ8crsB7hNS4YL37nP8CNGzfdeoWPfuTpLcWEtgt+Hh/98Gno6+uDkZGbrpC88sqrbrv6coAuQkXJufcpt4DSKe+q0gvPCxz+lW9VvxF4TD70oaegra14uVSWx0OuZ947BuWG0F225X1AvVpAd7zZur2U3i0LyOAZUMHS67brHUNzl7CKNG66bVw+xC+yolu4Xbt6+GK1Z0dZTY5jrxAQLy2QOLcC8q4cDPBiq/ZSgYvaW2+/C9/60xfhnffeh+amJvj0M5+ET3z8o+7CWi6w9cenPvFR+MLnPwvd3Z3w/vkL8O//w/fgjbfe9jQzqhjoHmxuWn6viQLX5E5RA+pS54L8DJdN/ywX709+/GNufG01uDkdNYY+WYmAuqwqh+rZCnGS+raC6Vs+YFJ/sm6tD+w2HFDkA/wwl919RxmV7uqDny72HC706GPeaUosLrx58kOXvKJwkWlqbIJScf7CJfiTb/8ZvPHmW+6MjM98+hn45S98zhXYSoDHsauzAz776V+CZz75CVc433rrHfjmt/4ULly8BKWkoWHZlel1QWFhs82txlhwtsjjjz1S9DmDZnqvpd86BeWGQYw6cj/uxqEOwZTewRentxw43ZKAnH2WyYocq9vUXTmodDsV6rR7y7hw2KRGETObwKGDBzfd2G49CicBBj0UD6Sw4CwWK03MEjOC3nr7bVf4PvaRD8Mvf/4zsHfPbt/UmgwM9PHX9Fn48OmnQJZk171WWPXvNQ0Ny8c55XFjRexhlied2Xo3jEMHD6zpyho3Rp6ywS57kw/KPQs2OHWbXRqy27csIFvaST/7LASu6npdVp6jeetQhkWDFVmNRs0bTxR7HHe0e/fuBS+wCwYE4ThYLym0bkrVeRd/7y9//nOuQJUjzrEdsAjv6JEj0N+H/aN0d85GqSg8zpZluwOgCptm7oRAYNkCMcytz0TCz+fkiRPwk//80j3P6SzVN2Pc7eoK9o1CGZEJBGXQ9lGw3oV6hIH29gtM3cqwqS1ZIO/MJ+s2dZdSubtSFeezzlh71kkUjbv09+11i/K8oNAvr6re7RPcka0FvzscLo2A4OLY3NzkW/EoBN2OhbPMS/I3tNBS7QWKB47I9QqlQIgsc3vD7Q4e2Oc2ZyyCdMscfBwqAAPaSUh9WiGmo0u2MbclD9OmrzR2hknXG7iVY+lQb7hFg4QdrJQj5Hb60kOUOfesujgpcL1WEVulcJH3aqeK4OKVHx6FaEFv3WObAZMD7twdhanpaZD4or2rp6ckcRG3jfrkFIyNjYHFj2drczO3EPd4Gk/aLLgJwHOEUtt9XZgkwW0H8AK5YNPibDMhAM8x7M/2xptv3/Nc0p45lbbifxVRm0o+y7wQnBtCiHrAYfQdqEM6Yy24zmw6qLVpAbl7FIK2rtdl7QdzoA/bQkEFwOmCs87EY8We6+vb7enCVDjj2stdfE5Acl/jjluSy3sazczOwV/91Y9WFb2946b1Pv2hD266T9hGYAzpJy+97KYMFxYPYubXxz/64R2lWG8HXKDzFg6+nnwXAE9+d0ERqGluf7z2kSOH4dy5C6AbK91g2GXhuvHeo8flD70kSVJZKzGZTHokIg9Tx/Fl9XgpyQb04FbcWJt2YWVsqEv3lSoTRQ2o3gQZtsEtffCow6x70pYwTXPvnopMxNwyubU0twbg61bk8mVLZnnw/oc/+nHRiunrN0bgFzyQ7QVYqPfa62/C9esj91SeYwHlD374n9ack1EqcBOQb0WDr8/xsJhQLthg7OT3YseEvr7il9eMPfZYCuIVyfqkjFWkx12lwWwsaN58a5NNXcmYH6yy+hQQk7Jd3JytyElssExwwhr5YLHn0H+O7dAF64NFfPF1ekFdv35j3ec3y9x83J0GuBYoHlevDUE5WR1eYWWqwN8q9913rGifLIsanaP61cNQAbjl1iVpTl2O6g7PZ7wVkJt/DEEMsECdoWhElhR5N1SIUWNoQHfSRbdnfXv3+CY91c/Mzs6t+zzGRubmPBCQudkN24XMzMyA4F6wL1pPT/F41LR551GoANgklVqV8zxUEhKQgtxo2NR6v6lv4tJRl9YHdaRWvkRXbJs/YY7gxXPPZ4QFcpUqjKs2NtUDygMd3kx8odw9FR2Hcqsj90dxs+HXDQfGarAQtpgVorPMnjFzqCILucxjIY4ilSZl0Mdg0tDgi9Obet8bCgi6rxQzW5fFg/zSK1mr542YtG51p6x40b5ABw/ur0hWz3aR3IVrOZhrO+VzpezuXb/uE+MELc07r4zv6OjYMPW5s7MDygmKJ2XLAuJ1Zl0eL2qGMB29sUiHAsZo4LZ++QNQAfihUzUqe5fmWEXYesgbAXmZu6/sOuy8S4ncTBiUrufGBtwxrjzECL1HJbCHUHdXaQYxFS4wWHjm5e/NJ+3gomZb28/a2So4UGvthZvAsSOHt929uBAUoftPnljzeWzfcfhweRs4Y1p2Pu7hZr952D6/UEBUD4QJX9vxo0eKPpewZ08l6ExFajMshe5WA/U3tls1ldDZs2zDD3bDM6rHTEbrrT8Mvt+AKh2EClWdW0xX58zxorsudF2FQqUxCAsFxMv235IirVi8svrWK5e3C1oFOA++6x4RIXDkyCF4/InHPHPtPPjg/XDqxH33uGJwsNczn/y45+1hNsLkQp3vLoDH30sLpLBmSPHofR3glnV+kmIhDFhwJHPhIagAErdC+JXQB3WGFADpSW3jFu/rWhbYHXOwWQ/LdVY7KANtdoC2VUo1r6XffZABvUclcAHo7yudOzhQ4IIp7Iu1U1CHg4HgUjuTbLa86azYjfdX/sYX3OFO8/PzPEBK3Il9zeu4rrB317Wh63D37ijMzc+BaZhuF1rMfMMEBpz5vdqNiJ/Pk08+AadOnYDRsXHXXdfErRvsylvu4VmIUdB/DN2IXranWdG1wKNOCNgmfv++/XDx0r1NJmftscctx/y5KgfKZ74uwqjUz11pNwlhZf/blURPpTH7dN2Ldf0z6iV+TdyBsjc1qzRUDnYTRiuSdYZN5Gad0QeLPYcLYSnbkRf68L1uN64WLLblrofIg66szcQhZmZn4Yc//PGK8b4u2azbefbmzVtw7vwF+PDpDxV1J0ajUbdZYKUpbHKIYid7KGKFLs6g5l3bf2xvUkxAbGq2j1pD/X3ysWtQZvhhC0gq6+WXxAjUETqTNYyBc9ZM/1j3jLoxXX/ZV1g4yHcbFUvfmzBv9GadVNG+V9jNtZSZNIUCgsOfvBzFWjj/Y6M52pXmpZd+eq94rGJ+Pg4vv/xz8DPJxHKn36jHHZALrZuYh6OPe3q6ubvx3op99IbcNa48zV2rZXcMUAbEIvKeenPlu0WFf7y+G2tdAdHT6brLvtIZ20OgclbXmDH0GDZTWP04Bs/XypX3iuCKHlXMddt4RUNsuRYzHl+oyJzwzRKJbm5BLFVbeq+YX1iubyk8/jsFP7tCF2c05u0+8/jxo0Uf12lqHzYWhQrAL8gGh8oVS6qpFBcCC+tqwJoC4haSyHL15Ip6gE2IrBC5IvM+kHl7unnBnik6TGegv8/TIGgxMKW1sAdWVvcu+NXYuOx6w+BuJpMFv/L0U0+6Afa1C0SI20fr9NNPgV/BRR6tpDxeih1+foXtSxpi3rpV8VyPFRE8hznaiH6+Iim9iKRJFSsqrhQNtFFbb1LhmjGQuy9ib/z6in8oitTEj1TFdhl39SvHi3XdReHAdNRSg4Fe9JXn4x9Z7vPH9FMvQGHCAsj04mCj6ZkZft+fvbyw3fxHTj8Njz36CExNTcMcj4lkDQNC3ArElN+e7q6StaT3itm5+aVMOvxcvXy92YLYCralVz2eHYPnIAr4m0W69C5Y048YLPODIAmXL5VvEWLRXSZI11SgdZNWlLX1ILysoQ4UDYquaYHMzyx4FxmrEmRGu6GCzNh3i85AaG9vcxffUoNCVejGymS9vU4Khydt1GLED0T4otvftxcefPABePKJx+HBB+6H/fsGfC8eyPT0ctsUPO5exs4KrcdotDRuvP3cwitWmU7BCV9Jv12RWSGYyBYgtA3qCIz7vHNtfE1P1JoCEmtr3DAHuJbAYiEGUsX6g1xLv33SpNki7rOcu6RcbSgK3RGZTNrTWEVhBhnO5fA600uwzDQ/vnm8brqZTi9bINjUsxTga16r2/Ssdfdxi5kVKe6TVLU6WmB7iKNF14yDFBWQl84whYJeV/EP05BbsVxhKz9DGZWyLBNM0LmGpDMXo2R7qb8OMZVx88bTxZ5rbIxxC6R8ccPGpkIByXpaUIjV2vk4zsJC0vM53YIcWW45zs3PL91vavSuqSxuKFLp5eyu5qbSNKzFDdPx48eKph7bzOi8qV/YXpdeAkR3UhperxknFaZbTtenjTQg1VV2amMgtua6WNR52fchUIw6q/8IhEm3Y6+/29ZZRpu3Jtrj1lRXii10G3ay22J6uw0OP6EIVUlgpiOw5/VDoUfekomy6e31WHZkD86BXv04XkS9u3pLHjwvBKvcFUXl1oEFBvf7YyZWKOxNMl4wGHR95qkUCgeDmzdvLxbkqVUxhrZamJmZXSraxHhCxMO562g1Gou/G2Mra4yk9QTsY4ZDuLAosxBM6Z00R544EHrwAmwBbIdyNfXmx5LO7FEHaFgisq4QdSFIQlMhqWmsSWkdb1A6ppqV9vm1fgfXT4XvE7mngJa9HqVSUKqraFScPkPuWdOKXrWN0xCcgvoBaz9sh/bknUQJa64hC4lY3J7qStOFLt1J8lumh5vNLbCO289gdvSOfqVvzpo89nDjp74eBG1TebB3zSsfKPZ70b+8b395e7lpfJEPBBRXQHC3mUilPBMQFESsys4JCH/fo6PQwa0rrAzPN/tzd5yiS/2OuHJ1eW1raWkG1UNxRuvGWEzhxbnoOGe90Nrxmj3cjbVaQJC0kzg6ad7q7gzsHd/M77mpXzp4PfvOF21mL5lMmLBig9miQ7p/AWZgwhzOPUEkUyOhO5ocmYiQptGo2jgdkZrjTUrHPN8kWiCxbnCgbgQE60FiD7hxkM0JSNxOa/WSgGVRQ7piXHrSgMSnsigUNN3DuEXh8JOLAdvWQUg78/ddTr7y4VOxj/5wo+/NsEQ4ac+fLPYc7sBUpfyuXkyhzAdKcZpeZ4d3LrQW7tu+Kd1y25+jLz3J3SFYo+B26eW7WxEV2RmY5YYZWHna2ryN+SaSy0WgaE3i52Z4WC+0mta2Vrc/ll6kf9od8/IjXEC+t9HvSNrx6I3suWcLxWNdGA3oLL2PrwX74sC30vztydxaASbpQUmb1uTwmMNoxy5538u7AoemoQ5oT3ajG+ueFhL3CAiahyNMr4sMrNfSf/7FDEv+PVqC7Ktpa/RDGZr4aVhqWLfg4Vrq3ccZ0HtUAl06e/ZUJu0cfebYNwpBAcFFwqsgPrrIotHY0u8dvTsKsUOHXCtEsHPGxycgPz4YF/hGj11MCwUV+g2NpR/Yhw0od/fuhqHh4Xue467kB9NW4q8jasO6wbTbxqUT3NW8o176WIOC4eQMtZoyNIl9aj60YE/Ta+a7/7E3ePSfHVBPjkINkzLTReMg97hN3nkBFNOBbQWDqwUeb1B/lnrxv07Rhf+elih11003zL7x4fW+BzNJ5u2xol1GcddfjtTdYqBfOy8Y6LLQPeyei35zrKPIMzM7V7HeWLWGaVrc+lhOj25pafU0tmRbNiQLLJBSBdBX09dXfPqmwy2K2/bg0fV+FhNbJs2bp6E0SDYzP3tLP/eti8bPj0ANQwJysFhB4T1CEWqGmk/f5R/2kwbLPM+/LOl7nbfGH83Q1JoBhDvGlf0m04sK2L59+6BS5ILduZeNcx8KK5q9ANub5xc2zPIan5wEwc7B1OhlsccEDG/3RslUcsldFVADnvfXWgtM/25fwxU3adx8kjJ7zQ3vlfSbD1nMKOkkL+612T1l3vqn6A6HGsXti/XOvR6re95wdj5Z8+6rBXv2v4QyhGptajcOZ995rOiTPG48Zgx9EIq8DveCaa9cvRIGs1tblmsH5viu1st0XhSProIutljtret1U9xbEnC2O7aez9PR0eb2T/OSicnl1JpYLMKD6OXLnOvv7ytaWGjQbO8d49pAsZ8xqB6YNK5/HMqAA86pi+ZPPww1zPSNezfcq84ARqINmQDUcNf7BJ0KU+YchTIxY959wgmbP5dJYEV8eMoY6eJB+/3FfobyXf9rr72x4rG9e3fDwEDR66QkdPd0wZ3FBQk706IrKxLxrgIbd8eT3PLAhQ9vt27fgZMn7gPB9hgbG3fTrhF092BXWy/B5onx+LIl2s1/f6kGmxVj3/4B6HBb8d+Taq9Yaelj7H24J0hyW7902AKzbDuxhD3/CP/nr6FGuZ0zLlKFj60QEHYGyA1ZUqwaFpA5ex4DC2XbOqH5PGIMHt6vnbpY+PioOXyKAi3qQsMCu8IiO0mS4fEnHoWgVj7vIs74xvoM9KujGwt9614KCLrJcJc8OprLwkQrxDCNks47qVXw8xm5eWvpfltbq6fddxEUDzwXEBQo7M220Qx4r1nLorKbnYPjQ+k2KR2ZKXx8zLz+ofUaAXoNA1qaWdM+IRyW1dXzQVa4sHg4quYD6JVg3LjxeKGfFivP58yJRzf784cOHSj7worB7sIU0NnZWfT1gpf0dPesiIVcvTrk6zbvfuXataGltjCKInNrdY+nrW/wc58p6F2GkxzLLR7rwd+zFOln9xc+NmXe7tRpqnwmez1gSFgLsuLEWikW0xAglijj8hqdLhyatu4s7U6GM+eO22BtqkERNu67777jZeuFVQjuMvN+Zyz+yxcAegUOmerr27v03iYmJl1LRLB5MB16ZGTZ+ti1a5fbBNJLjKzB42DLtSWVSi9fj3C3/AQNW0u7rBv6uacBxGbYS3BO+jt/uLJAcMUBZu1QV/2vygVlTL2ePe+mEs7ZE21j+tAnNvuzhw4dXNHFtpxgID/v50YLYcKtMfAWTOnNzwpB6+PixUFP04ZrGbQ63n33/SXrA12Mu3Z5n5U+w92X6CZDsM1NOXuzbRYtEmhpvs/5JH4dp7ONaWf+OAg8Rw2t1IgVAsKXqZoXkBalOc3XKe9SijZJhsaPztuTzZfTr33GZPqmuv7i/O61prOVA3Rj9fYuzyGZmp4By/Y2QIbWx0B//1K/L6ykPn/+vHBlbQAen8uXry6NB8Y4WV9fn+edC/DvjI2NLd3v7u50CxT9SLhTfjywy+wbyZx/2GZ22YNpBEgCapwmeQ0BweCI42T949gsEQ1SR4YvVpegzDjMiZ5P/fSLaSd+cnM/gd1Ij1fc19zbu2tpcced7tSk9y4mnJbX3788hn5iYsr16wvW5tatO3CzIHDewa3FttYW8Brsc5VdnAuTD577Fb7hkRqOOL+RkqY+BBUgJMfegBpndUX6koAM/hNQTUrqwmcYJg1/AhWAB/X2Y6uYzXxvZ2c7v1grNl13CYxTdBT0whrjbiwva0Ly9HR3Q7Sg8n5o6DoXEu9dZrUAxqKuXLmyZKVhdtK+fd433cTg+XiB2xJdjRhA9zPBaKBtYH9f2a0PiZDRE9qHNux9V+0EVEkpzGxbEgx7YFKV6iQD64HIh38clhvOgY85deqk60KqNLjrxKyefLYUth2JF/RD8vLv4BhTbD+OoEhduDC4YniRIFcw+Oabby2l1KJ1eGD/QEna4Wf4sZ9f7LSLyRT79+8r62iB7XLixPGStpkvQrZZ6vxHGonWcAFEDokbGTyQvnSyLa1QRO6smwB6mDQGHmp45k+aA10/k4jkuxJo9GXv2lWx4Yj3gBZIoRVy69ZtYNT7GAVmnB3gi1Q+8wtnsr/++huiSn0RdCG+9dY7S9lweXFvafHedYXWBxZ30sXPuamp2Z3NUQ2gRfbEEzj1tvSZiwFJGz8effL3H2n61FtQB2CZx2xickkrlpQk7KRUu3z1dRWFEtoSImHjkdgz/2HOHH950ho5kLTn+jJOYq/FzFZGaAAb0EIFwJjHqVP+q8jet2/AdWe4M0J44HZmbnbN/kQ7AYvgUEBHRm66fwstkLfffhcefvhBt/iwXkHL4/z5CytmyffyTUZviTYaqWRq6W+5iQ4Dfb6wiDdLd3eX2/5kZGQEvIIHyW0J5ExA0aaipGWoWWm/3R3cN6JJ0azFg/b8+ZofsYkz0vfvDSwJxeIXjNhqRqnlFiaFEElpwn65uM1qUbtn8cYffh3HW8adqZYFa7Jjzpram6bxfQbL7KZuK+fycODA/pLsKHcK+r/RKsr3W7rNd6dtra0lqU/p7e1xF8w7d+6697EGAXfejzzy0JKLq57AFNpz5y647UryoDXQz4W2FMcf/x5amflYF849rxbrIw8el8cff4SL4MxSpto2fgeTQZnXpNjNmNJyu03tvtEi75rU5PA9JrFMpBYKbFPDraod215O9XMFBFuYXOTaUvMpWJBTUCLRZlYkDszdWbRF6ZrBW38IBvExFJVp607nlHXrQMKe67dYtsOkZjsDx/PtME4gPHXqBPgR3H2iD3xsDIPojutGwYmCu3u9z8rhOzm+OOaysgpF5NVXX3ePDy5o9QJaYG+++faKNurY6h9dfaWaoYJNEwuHUmEnhGqyPvKgK+vJJz8AP/rRj5fqWNZDInJGBW06KsVGGtT2mx3BvpEmuX1TragJKI1QJzvwgBJTwE0GIswVkJf5sevS+dJaB0MIJSZpXDw2/U5RVHBsJt74juznGZYKxe2Jjrg92btgz+DUsj47N+p2x/T393neQdVLMDCJ2WH5zJy7d8fckbSlcC25/v09u904CM74RnAn+c4777uWSKxMrcQrCRZUvvvueyvEAy3BgwdLt6Cj5Vdo6eBnXsnO0DsFLSfMULt2bbjY0zRAtImQ3HizUWkdaVW7b/Ng+Kwqa1tWAgK09k/IRRJmVmFnQoScWUwpHfoBCzozun+itqVEYj2SrDwIHpKwZhomrVt93P01wOMoeyxqtDuwtUKmxsZG+PznP+P7LJck943//OevujPTERQQzJ4qFRgHGb4+sqKYDY/RyZP3uTUqtQqKJrqt0gVNNXEc8OHDB0taG4RNGdE9ieTdQG1t1SsgCHYS/vM//wvQ0/pCUAqPRuWWGzG5ZawrMHAzIjd4FrewGPuJbNOaTxukJtCLDdrd554jjmuBmCOgymXNeqscRAk0APO2jqFBbUvw23n+5XkeoCfD6XdOjegXvgSb7MWDKZiPPfZoVaRI5or+9rh1Gsj0zAx0x7u4W6k00+lwEds/0A+KLLkuM8wKQnfEe++dc/tA4W68FCmslQLjDnhsr1+/sdSiBPe3WAE+0N9X0veKYjU6uizUWPPhx3jcVsG42cee/vjd6Z9KfxAJNGQ87wqa/zuUxJwic8NrDeyJNTDvrm2Ou8BpSj04r3LIzClpkZHpZLQx8/rTsIVGbtgupBQ9jEoFZmSFFxv2oYVwbWjYdX2UCvT19/Xvhf387+ZF1rVMhm+4c1MKM5OqmXh8wc04u3r12pJ44PvFKn2MeZRaKB1n5cZqYSHhHuNaoLEt0tN6Sn6sVOKBMInWyTYcoPVgTjPcRc7U6iN/V6Y8oAGkpFNwrqTf+KBBM32b/X70ZT/22MNQTeCO7r77jkE+zx7jFNdvjJS0fxVxd+Hd8OADpyAWXXY347hdDK5funS5autF0KK6cuUqvPLKL9yOxHnyx3nP7t6ydGPGeMfxY0eWXGT514Up1aXoPlBOsM1JY7/6DGnVSzezQyJ1IyCjN2bck8QVEFtN14WAUEZUvg6VrJhgwZ5snrLvfHQrP4M+7bDH7bfLARYWdncvj5rGNuylqFBfDXYHxvgHphDnQeFCl88vfvEaTBaMXa0G0Hp65ZXXXLcVLSjOxMX8gVMnobHMc2Aww+3AgZUV5xcuXFoRWK9WFEVWYgedT3EtLkkGAnNIVK6TdlARSVm2QBxLqgsBYUEIcAO2JAKCsY9zqZ/9GmN0078fs5eOHatct92dgDviEyfu4zGR3KYLF3EcCGUYJpQaXNyOHj3sunWCBXUhmPL6xhtvLbq1Zn29a8YWIe+8855rPS1w4c1bb1iF37d3j9uOo5wTKAvBAtFCSwTBgP7t27er3hKJdgRPkr2JU1AKJAhKWn2EAzSpyX2fMjbGSl+2G2kdKKcMUjP/kEuSujOYfvWJOXvsg7CF/gm4AGMrimoFffLNzY1ucSEugOjy0A0d2lvbSu5ywd+P4tXa2oLzVtweXflFGL/G1zTDA/z4fTgnww91DG43Y26pnT9/iVscQ26MIQ8KR1tbOxw5fAja2lsxfRwqCaaTRyIRt/4GRQOPLXZJxs+8mgPrOI810EB6M3PWFdBVTyvHZQIyP/1vS4TVfEGIrRrOv/rO/5SWzxw7I8cltYHadu2bXoR1EknqAI+ZMm51Xdff+1sM6KaLONBF8cEPfqAqMq/WI1e3QpYC2ZlMFmwuJC0tmxq4uGNwl4wi0tTYwMXLXBEHwTbkGFPA4kcUFY3v6CvRDgWLLm/evO26gjCeUCh2CA4MO7B/P+zZ0+vGPYhPhoKiuxBdaJhpl3+9+cmEra3VKyKKKodJ1OywxpRzjLsOwCMYXgiSPU4YyUKNI8th+n99558klXcGQIpc0CVSD0WEihplHqfwOsxWLmdf/3X+75YCaEeOHKmZthzoM8eU2ryfHFNBQ1xYenq6yzaKF+toTpxogATf1Y/wxTqZTCzFFDA99QYP8uMN401YXIYxHBTxUhRuWpbNrYs4tzZm+G3KrZ0plmCAnQewbUsHtzxKVVW+U7BwEd1Zg5evupl2+cC6qiqu9VyNFepIrC10WD+QfcK8HPkpeAg/HmHmQG2kBa6Dks26iqE0vso1s15yB6gTAy8XNL5VvJD6+dMGzWzJD4WuF2wPUSugSBw/fszdaaOQIJiVhYtMR4fnBt/ar4P/D4XkJI8foHtoki/eaBkVphjj7h+FBC0BdMfgIo71DigmaAmgwKBViDd8X2sJIC6k6Npx3Xbc6kGRwEp5/LupVNKNBRUTDR7HhcamBjd1O8b/XjVYoBhYP3zoIFzmwpFPL0ZrCt87trepVhr3yh+bnshehvmQZ5kXPBQQJqXLFPYNhkIIP78l8urZO6EWva10qW0+QlLkj3uZhTVt3e14P/mff5eCvYWh5QQeffShqg2erwem1GIAO7/IoLvovuNHXV96pUhzwRgfn+Svbc51aW2Uaoyigq6bYDDgWicoIPh1PrRlGIb7O1AgDO7wdl12SwV/a4PWJgansRVMPvGg2ojH40uWCFILHQHSU+Zb8VdD3wSvIOwuNel7UONQGejkkDZKJr4+EYlDY/m2iRWCC6ZMFekZ8AjuOpVejX/3t9POwrGt/Bzudj/xiY9VZeruZsDmh+fOnV9yH6GI3H/qRMVbsaO1gBYCjmjFhRAtkdWFc16ClgZmUaFFhPGghoao5/PKKwHGQAotkXxGXH9/H1QjjDI69a71r+y7oWvgATwIMu9Y1itQ43A3HTt8nzYq//an/5kGsl2bq1kBUoD7JoF4NvfzWubNB6atOx+DLYLdZHt6arftGPrMA4EgTC7OTkc3B9aHYB+nSrYcQUsCLQoUcDcG0t4BzS1NrrChH58tuqO2C1oYaFmgWOzin29f3x43KN7a0gJhbtHIUm0EGVcH1vGWT6CoxsA6ZmWpTXS/PkXeZ6ZkwI5hMhel61DjEAnIW0xJKWoMJKsOBr7Zpq1JHjWhm7cnW+7o1z4LWwQXsEPcl1zr4OJpWabbARUXZYyNnDt/ge9Uj6yoIq8UKCahkObeWgtSUvPxDHRPYQM+c9FVg1/nwbgO4VdPgJ9LKIgoQPh7aqkf10bUWmA9GFZbIsf1zyVfi3wddk7A5t4OhbHt70aqhPuu8KhANgGyUgczemyJBL14m27WVfrVzzhgbXkoxeHDh6o+bXez4GAsNOgvX77i3sfW5IODl93mh80+neeBnw3GayoZs6kWai2wHm0LntL3ZN60boevwA4hMgmCzWq+qWIiOC1LupOsi9J7hRJPnPA3jHNHUzR+P2wRrFfAuQT1BL7fXM+sHCgil/mutVaaH9Y76K47fuzoCusLuxGsMXvD10gykRsOSb8sNRs7jgcHCKmLsZnzve1E/odf+p8izLZr/g3LAaWd/7OjwQaz1lj7tczbWPOxZT8M+t3RhVNPoKuooaHRdXNgp1kEg9nzPIgdjUXdWhFBdYPFmdFVFeuYjYcp0ZFIFDDprVpusipFWcBSzLHAJdgBjMI4/4W1PxeEKLr8D77wD2MOlWp+mq0iy9085Lf98mgC5HzqJ1/I0NS2ghj33XdfVVfvbhcso2hra3X94rOzuSpmXGhwYBJaZfUwWbDWKRZYzze1bG0tT0cCr1DDckc6kb4D6eAMbBdCpvlJnoBah6UN+Xc//d/FHKn2BYRJsItrwLanHt3ULx0cNa5/GmDrnTzxAsPaj3qJf6wGLRHsnxSNht2dKvrJcZHBlFpsgNjAg7JKnR6bWgEtESzGLLREsKGloqhu0N0L8uJUyhuO+ZYbaa9+U32NrxfbqgiUGJlilJa+NXWFYUbUkP/e3/zvG9AWgRpHlskufnZsq4ILaz4upF76DZtZ2zIhdu3qcYcw1TuY5op1EdiJFtt9IFiPgS6PcCTs63nwfgcXv3K1jVmL1Q0YkenpGXfjhOnT1YKiSjHDNsdZPDAB24LMcwGp+UAfjSiG/Duf/acNQOya3/5RIH2SRLZV73I9e+7olHX7I7BNTpw45matCHLWGLY3QdHAqm4EYyTo0kJ/V0MsVvGFsJpwu+Ryd9G1oSHXjVTp/mrFGjDiZ41fNzc3VzTGsdkbQsL2LmNCeZs40pY765pA5yUKs1DjqLpuy7/zhTN1ISCKRPbwlWnLAkIZlS5lXnnWZmYrbANs0/3IIw/XrfuqGFgvgNMFcZJhKpVyH8MFBivEsfUILkD1VFexXbBeZeTmLbjJb6ZpuQWbbS2tFT92bmA9Gl3hzpqbm3O7L1RLzEsJyBHTNMfofGAbk7RYglCorslm20Ci1JT/y1/5bxoZq/1evHwh370dARk1hvaMmcPYAmVb22L0/R86dAgEK8GgOgbXcceKGVp5lwf2lpqZnXOfx0weYY3cC471np2ZgytXr7nuwDzoFowvJKCFu4sqLSLFLBG0MnEj5VVMpOQE7Rb9VuB1fg5uKRbCP5943QjI7/7N/39Trc8CkQOEx7UkLMLYci3IxczPP2/S7LZ7j2DsAxvoudMCxG3FLZfmG3Nbq2MsBC0SBAvTcMc6w4OwGBvBam8hJDnQYrtyZcjtOVasiSNWzWOdTXNTY8XdWcUC68vZd942xi4FkkKiRta4CaktZmQRGXdEdSAgYW6BPHumsdYFRJLxVCV7YYsCMkfH2m5lBz/LdxTbzlI7duyIa84L1gYXlM7ODte1lUwml5ocYmwEJ/jpWR1C4VCujYhPhi2VG4wXobvqxo3cQKo8iiK73XDRmpufzyX+oLDM8kW7tbXVPWaVpFhgPWeJSDwuuO2kyLKAs9OZYgfssdCWuusyh+LEsOofIr8BNjMc4Wheh9Hs8FHKnG03msw32Nuohbggl+q7Z89udyEcHr7hCgfi1hTgXA9ukbTz53bxxTJSo52Mi4HV+2NjYzA+McGFobC9EnFrLNDCxV1+bqQw4/GQm+6zKDjnL1xwK8Ur3ZolX7F+4eKlpYaVKIS4URgY6AM/o8bgiM5FBGzFBME9CAtkHQbTr/6aA9sft9XAfcDY/6q28VYc89YI7k5xfkc+Uwt3r9iUEcfTYsNDFGd3/GsNurYwxoGxoBG+yA4ND7tDqvLt8REUhOPHj0BfX9/irJIcOJ9ekmQ36wlBwZnjX/vJnYXxrnwdEL5OjNX4eT4Kj8XJBjUWYF67vdmf4W8tWQ8WCP8MbSEga5B05mI39YvYcXfbKxT69qt52E4lwSBse3ubKyg47S/v/kBwRC36+TPpjPt9gUDt1MFmeBzoLo9vXL8+4k53LLReURxwBO6RI4fWtCowQI1jm1F0EHRnJfjxQ+ut0pmA6M7CTCz87PLvCwUlzN2TkYh/rUqbWFE6Fnlts98vBKTG2I6AXM28+XjKmd/R2MC+vr2uH3rpdUjS4rhUyW0JnhuZis/k/2UgvF3L4PHCwsOurg53wUGLJC8k+C8Kydj4OExPc3cXI6Bwf7+qVp+YYOAbazmGh69zF9RtWEgkVggmVnPjfHkUjs7OTldI1oa4NUd47PIxETewzl2ATY2Vt0RQ8ItVrON7yqX4rr9fWzY4c9cPpsnjtYQ/j+8Zn89VlYNn8GC6lp1xzktWIL2Z768nARExkCJg5fm8NbHljruryRVO0dz8CL5LxsVt9ayE1fGRpZYKi1/nF5LVLReWH8//XOmm61UaPHb79w+41hyKxejomBsbyIPunuHr10G5lXOHdHDLBeeOawENiOQ/Fxfj7ijTMt0JidgzKpFMLlbmrzwXMPts165u15LNV+lv9nPevXuXe46gIMGiS+zCxUE4eeI+d35JJVndCh5jISie6Kbbt69vaRZ9zj1JCoQi91mudluuvo8uMszoKxThncC1SVPbzf0sXfupuVshFIyw+hAQnZ9UfGMqb9LOiltTLSbL7nhsIPrxcYFXVXnNka4bXQzrsVps8ELMPZabrocXpFcXkR/AY9jb28stki43zXdsbHzJVYPgYoR1EXjLzfYIQ2NDo9tGA107lRx0hJ8LWhYJ/nqxB9hqt1whuBPH94jCka/n2PqOOpeUgH/j9u077iN+D6zfunXL3SwcPLgfdgJ+9ugqw5RnrywRtQn28Sj6q5v6ZgJbrl6vRhw9RRU7Cw5/wzVdSOhIjCrALLbJcAa3PjoZYYGdxIfRVM8tWKxkPZ6Wd2k5ivm487uxYjUD1Qq6ADE+gjdsxjg5OckFZYG/z8ySoOL7xh0+3u7cvbtUc4KtUsJ88cQxsyhIuGB5HYi3+LE2eKAfq+pRKDD4n06nVmVRrQSDzO3t7e7CWlhot1PLMj8hMG+JoOV28dJld6JgpUWklJMN8WfRXYcJF17gBMxNZ8PwtYPWS7K5cGEVYcGZ2ssXoh2dAygguJZVOlMoP2UPF9Jaskby4E6zv7+fx5swcJyEmZkZNwV49Xxz1wLgu/+8xYKfCR4bXKxQ4PGGLsawG5QPQCAY4BarBCqPP8jKsjDjMcSYAv6+/OjbrJ7LFjP44qzzf/OL4UbHG18DWhl4w1qh7Vsb64OuP3y9t27lEolwUUV31v0nT0BQ82TO2rZZa7Ih0t/fBztBVQOuYHqRRh8MqdGFgB5VTS0FgiXqRkCIJNvcobOp7804qR2nTuGOEk9cP/R0woUKM11wJ+zFxYQLEC6QuMvLJwbkv64cxN3R4q2/v8/tq4UZPpjJhMH3YoKCCxbe8PlygH58TQu5rk28Nazq+VXKeqF8NuCtW+jOYq7gXbh0CY4dPeJudioJWl3Hjh5eskSQwcErrqBj8sB2z6tcsgp4tXEiTkNqrzqjbThsSmGy6UDtWPxrQbUoU9KBDAtbtT/VFiMEm83INWimE3ZIPj9flv1xbPFiRFHDYOpOwUUXA9mFQc1cBgxZFBTJXRgxMwbFBaul8yKTy0LL7ejzWTP5QKlX4O/CBIZ8EgMGqNECw6wt9IujAOJChTGi0izaaN3gTVlqLIhxDfwXrZvCBXH7f58tZRstJ1RQ102Wt37wX4yLOY7tPo6P4UwW3Egg6P47z3f7J+477sPAugPnzl1wP6udzFjH83A91+FW0GJKA2yiqQn3XdRuRksBVgao0qwzatRDo1giW7AZfzJfy7bbebcQNJ+Ryu7KV4JuGnS55Gdx7OT34C3vXy7MCtsseaHJLbbykksJH8sJz0rLBh9DIdq6pUNc8cRpkPmJkHk3FLo3DEN3XVG4I8fHsKtt3jJZf3EnbnIEptji789n2eFuHkUDj89qsciz1u/NHUfHrSjHf/F15hZ+ZzFJwlkSgtzzbPFrupQSuxH4+vDn8u1Q8DP0a2AdbzhjHV/vdgPreA55tUlw1OweGZo2rAdxiG3VTQwkxa8TtQ4EhDF0sG688Mwa4ziDc8erPgpIYeqhH8DXgrtgdO3sJDiL7wszm8bHtzlvB2Bp0UPyboutUCg6y660nNDkHpdWiA9+DLnFPJcSms/SyrcXX52QkGd1LAO/B3e1ePxy6xJbqhLPLeI5SyBfp5Jf+PMim/86lzFHl0RiOyK8XfB941tFCwSp5cC6lwIiB9mmhvoQh1k7qD+uGiw5ThWtkVGnPC7gysL9kpuZUJlhC550eMPdsh+LAvGCQndF3o2xXXAnizvu7Sz+XpCPaWwlu6xQIPJfFy5Iq59ffo4tNXjMU5g+Xfj16uf9Sj7usSwium/rRBAMrONnvlV3Vk7QvfksJFUObkbi+alj1UM9cLSziSrU9u5Mx7bpsprYJYEZs6zQrGOGJ8EnOPxD3Yyh5TDDk6vHy52P1+DigbGQ1YHlrYKBYBxZWi0UW+BrMTNtM+QSK8LuApuLi+UC65cGB+G+48dX9NiqBOjOOsTdVteGri9tUtCdha7BrbUH8i7Oxc+VqKPYqmwr6+6auI1q8i0H1DpmCqhkZWKeXEFaZPJUKHz3z1Ql/heKmv2OFpr7QTg2+k+1SKoZ/MGmumlmnawnvddzLg5/Lk75mghkdYX7Vm7o7qilPlT1CFasY7V73uWCFsng5ctly0xbj7a2NtcSyWeq5QPrIyM3YSvs5BxfcSNM5Y7GDfehhLG66Nxr68Akvi3f8SqnReJHFdX8FtfoB/lpiN3cMIe1mRD6a5K08L+rAVLxVUalzNjUN3o0cAIzcDYb2KwEGODNuTF2MhAq13FYUJ3kO+Fiqmx393LiIWasYWAdYziVJh9Yz2fuoYhgiu8Qt0w2Q87K3tp5vaaAgBMCydnQNKOE1kNQABoccKRQy8yObC2ZcreVkvrvsOAaWN7nCEtfEHCelNW7vwoVxrBYWT9U9J/nsmn86yLBADL26cKXuN0bWiGVHlok2B6FVihaIbt2Yfee3P4pH1j3g4jkA+v5Rpn5wPpmkjgwqy6Xrbb523pWCGy03yagM8fjGQc+hKnA7E5ugRgLbTta4SQt1cJNtkOrhSMv6IwyvlF1Po3xEaggTN6kBeLV33Mzbewdp8yWknxWVt7dtr0bExMXq5B8h4LlxRHcOSzd3V2wLCK5wLof3Fn5wPpytT5z3VnYKmY9MK7jmQtrE7pAQKq84pYDfkrsv8NjIGiGwA6QJUdhfB1y7+TdNUsdYhe/oBCwskZFBURhDBNpyngl5C7K/EAkv4IV6ujOYgXW41ZvGIxVlHooJqodcqJPVnyOeB9dWdg+Py8i+QaMfnFnYcV6PlsO63auXLmy5vcv1/OAJze6CXc0JU5dCIjbKfAgt0AyEX5cdmByOaDyWDxMrrA68ube4n0C8hVJDlR8Ky5LUtn62OTONbqiwZ8fWQ6o583zrd+wriIUqp8xs9UO1shgqu5aFmVXV+cqS8SAa0PDbq+vStPY1OjO2cmDWYALCwtFvxcFJld3Q725uS4uWBeJL6lQB7ia8TS3QLLzwIIBbdsrnKWHUtQh314hHO5fgLwrK0GZ8k3wAQ6zk1AmcoVheBLbnrQPKSXYlRarp3cWCwnX5HjZWgRTYTHJY62dNgpHZ2e7e8uDgfX3z5+vuCWCOS49PV1LEwyxCHNk5FbR781NdNyuxbFWDGR9qAX+vtg9ImgzHpsgVHrwK3xdVfUdbZHN1O5/TZn0fS4WZm4jmz8TybzDlH+o652D4AN4rKaMnTSXszqwsZ/f26k3NOA8bfxqe1YI7mrRlSXwN5uPe+UsEZxL4rfAusLFb3dBLQjOhVld04Tz1rFFzU5ie/feNn5tUojVRbderh/uAVdQRS58O8OD6tvfPeK8DV3v/QeKPHlWla0n+OFvlECaoFT7S8NovQk+QZLkspmXrs90qcWF7ZrabW2tvh25ivUcKACJxPbPf9wVYo+lei3OqwbQ+sAMwc26VdvbsS0cg4mJKfdfv1SsY42IMnwDbLc/mO0KBl5f+L7QWkomk5t+j5uGrR8uZlivrDN/Bz09Qmmm7o7YTWlQ3SNDdpSLiT4xy+l81drs1K4KgBYIkwgmU5Tc15I7eZdPYAxGTkxM8kBgixu49qO7B+ePY4uT7QoAZvZ4OcRH4D1b7XWF5ykO7sIMFHf2PPhjsiGeaw2NDe5sdQT7u2F/NhSSVKo0nuoN9YiBwZcXq/Zr0HnoIhnNWSDuHW6O1EM9scODIPyKwOb1Je/TkIuBrDzj0BLBGdiYsYQFXLhjzzcF9EPXXnwt2AJ9J+1J8D3hBEQ/Jw7UKxjrwjTY1eflZsAUX9wcYBt/KJhseIpbIpUaShXhFnNeQKanpxbfW+ms341Oab4z1e2NzJQaQafxZQFRLL6ykdpPw5RVbu0yN5W3TI1+ip9xhbO7c23KJTeomd/BY2EeurpyMzXKKyzRaMTNasEMlu2Ar1nhr93v6cv1BgafczGq7Qv7vn39rvU8NDTs3kdL8+LgZTe1tlRjm9cjEFwWrlzBoPdxxkLR2Kg1Ef9WHBBeFzunQKRp2YUV0GO2Fap9t4NjMioHJZztWvL+G2tlbax+CE/6XHy9+IKdH7u6PHMisDgXY3k+hpegNYT59ljlu10jorEhxi0t4cbyE4Gg4jZI3I71gWC8Iz/xETcJly9fBVwycUDXufMXK9IKXpGXN725tvtQURQqJZ36mCUFU2lYFpBUCOzKTkYuH8RiSVYGY2uzaX8bgdXseCuMK+RnV+RnXeSERVkSl/wc9vyUwK2SG4qkua6o7YDWFL4mXVghvgDPgGg0trgh2Po5iecQdl7On0v79w+4u/ErV4agkoF1qyCzEa+DUrtNNyokZJQtQB2AbUxiWVh2YZ3QwLpaJxtGW4JkOZx1xWIgHv72xX/xM7TuCVrnBy2hmOTGyap895mzXvKWzHrkrJAWuHPnLmwXTBXF1yViIZVHDQQXuw1s77NAt1WhdYHnx4ED+93Aet6dVYnAeuF5X47xCRv9fqZwAan9UegQ4N7Cw1/hi8/ziwLy8iDQrr3AeBik5ivBZJvGQS3929zubs+bv824Wwwn3a09tgCFJHfLWS64wOQEJzfLHHeSGA9BF8V2QHcJ/n7dB9XL9Q42zdzu4opigemxSOF8dYyR4YjgZLLTzS5Eyj3ZEOur8uD5VlEBwSaKFq2Lk11VNZRJ92C4AvI0t84uasxRLVLzbVUpUJ2HrDHgUOJAOvP17js3/3tl3CU3FjYnIvmJijt5DyEetM2IlN6KgnGC3HCo7X2OeE7kkypQOPKzyvOFddgGBwPYc3Nz7vejVXDl6hCcuO9YSWue8PUUNnlEl2vJr7d1BYSVrctFpUnqaUpIdFlA4Ax3a31757Ug1QIjLE4Y6YCS4m8BKUZ+cdhuBtZqQloQFG7NWHZlxt4K+ALflBvjvd1zETMG86mya9HW1uJaKrOzs+79XGD9Ahw5fKhklgimE+ff07JbtsQWCP/fWiFyHnGcgzoJoGeDy+lurmDwkCwbkpnlWHp9xNJt7quUSysgmBGy3kVbH6EB4rpPZmbnQFB+0JLEnXnpYnHLYJAdz/e8JYKTDUsVWEcrZ3Jqauk+ZoaV4z2ue81a9RFAR/ppbGmHuWRxcC+nOQX1gQN0XiFSiSvSWRlFwr9qhBld6BZze4GJeHrZkGQJopGw2ym5HAceE7SwEhyzs7AaHClFYB1Famj4utvnCsF4Xa41fTkEpPjfIDzkSBSWgjoYZIsdRzIaLLkUlgTkjj5pB9RGRqzaD6SHFXnBcrgdIkHJnLS5+EH1mrReil+P2xo8R37MLwZk6WLTOvcxt1U2d6Etfu3+iy4DJ9/cDpaqjPO/o5YyvPL1PPnU66U0bfxayqdkSzymsfi8+xz/WsIxBXJBWjdxvy9POXbmhWAnA/z7yzERbwPr14aGVrjUWlqa3PddHguk+N/AAkJdZ1m18s0kSk5A1ujwYBEBOZHtNC/LOiNQ+wKim1RnqpyVoZQC4t956JUktyMmbvfezZI/jvnMtrw4u42fnUVB4qKyLE6O+zXecl8z1wLKP1ZKcou45Aav8b3K3I2UT6uWUQQWn8fDgLvnnDDAYo0FWaq1WH5sO5TvvCt2imNgHY97fk7Hcp3Icdci3dbf4f+7cWMEpqamlx7D35XrLFym97uWgPCYqipV8W5xC9gaOKfPLA8hXA6afwVs508ZlRxSBzrK37gtzTGltBXpG+aNC33ZBmRxcc1V8+Due6ug+KCouOKClgwKTS5olROiRasHZ9q7f0PO7erRLeT+PQI5MVjc9ef6meUEwSt2mgFXadCdhQJa6M56971zcODAPmhrbd1SBwXLsrjb6sZSM0cEjzUG75FyHae1/g4FaZ7USQC9wW2ZQZYOxJKA8IuBXfpaynLLiOsA/nZn+VHogxKx2fkBgvKDYoBdMGS5Wvq/VeeJhJYIXgfxeALwPaAVeOXKNWhqbITuni7X3aWs8Rngz7nB8slpGBsfd0UkDyYHdHS0L35+lbW2uMuGEkrrJktEV2FFSuUKsXACEUN29O3ZmFUG967Pc/8ybkRLYnHlBETMxRDUN5ghhdYGWiL5uNV8PO7eMEMsFo1AhN+CgVwCKFqAelaHRDJRdLQATs5s5RZMrk5pY/HwchNX7O9xwzMtSSxdFy14OYnk5NoCwiPsdZBHkMNgzFSBJPgJ0AQlQlggAkGurU0wqHERmVucEpi7MNDCwNv0zOyGvwNjZjivBgPx6DqsxLVVvDkqi1OrPnaK2APLStxdoRErBES5MWjBwADUAwqOZLSlaZBpSQQETZtqD6KLJACBV6AA4BRBLFJNJlNuTGSjhAYUCrQ0MFiOwpHvd1Wp85IVcZfJIE3adRL/sLPMefArD7o9sPKsEJBLR486R5ysXQ8tTRCb+y7VkrnBayvNVCDwAuy5hj20ch0PsBFodjFDbvlakRfbr6CLS1nMYvMDueu5wFnFDSHLcGZ8OFy0JMgqs3EEeuFjK4TiueeIM/iNtF0vLU2CGp1lVLL5eeH5+632LJrqQBzfagUztDQt4N5WXyYrF2QfbcRWvQ7CIE4Iq5s+PbH28D3NIu9ZOGkwbEi6Xv7xYhXA1pkjB9g0PxW6wXOEBSIQbAe/XjbuPJCC/TdhZBTqiETi3hj5PQIyPT1tdsdiUDfY5A53ZHouILVUKS10UCCAFRcCJWABoeNQR0y1wz2tte913Uy36xCrnxbctoNxECVLgXqavlxrrTYEgnqn8GqWGFtgtD7mfyAqVqCfhnuyle8RkNNniD38bWbbll4vBYWWTWFKkmAveIiIgQgEtUXh9UwZneDLad1c4MTWjMIK9DxFRSKbSptqsD4q0hFJ4icDeCsgIgYiENQY+euZX9qSLY3TOknfRZgCRd1SRUXCVixDBTkMdYJk01lHlmxMOwePqHwrEyFeAkEhO70e2WKqMZNggQGtq1GbASheZF50wWyCJl139LqYkY7YjDkKcXcUu8EjRCsTgaDWyAkItZzbdVL64UJloL1bEZC+W2AODuDPQbV0m9sxDjVHiaz0gkeIGIhAUFvg5cyjyGaYSTP1Un2OhCk1yXOkaLuvogJCzhA6+I20xW21uhEQmUpz3DRNg2eIGIhAUEtg5xWJ2LNcPDxcJ/xPQrLWdNet6fM3bDMbkrW6KChE0I1FHO/yukUar0BQW+DVbBHzThDqi2a1cesCcqqzKXt1Rm+GOsLmcZCiHdO2gXBhCQS1BY4e051UIgrtUC9g/OM1WLtL+5oC8mIK7A+omp2sk3oQJCDTpMV0T4bDiIFS1Y748AQrYZQ5kiPXV2YMj388+9zaAZ81xQEbK174VspUoX7qQRyT0bSzMAaeILKwBIJagtXhpiIUDWdJkQLCPOuKQ5oa2SYI1009CMKAejJcLDcPBAQCQa1Qhxf05eBwdr3n1xWQR3e1ZK7e0VtBsGVM03BHeQoEpUPsUMoJ3xRKhqlL9VLcwHfSzjPPHFi339e6AkJOE/vCv83YqlIf80EQ26HugJudgjOgAeIgEAhqA0mSAw2BnrrZFbZoWnaj79lQGEjUSoMeaIQ6IaunIWPuPM07Go2BFvK0wa9AIKgkjBGHOnVThG7D3dRG37OhgNyemEoPNPXWjYB4Bk5cEwIiENQM1KFUtuW68BtaNrN7n+3dsF39hubYp35nv0mYZoJgS9hW3Uy6FAgENYYGIX31/PNibCgg/JcwQ1nIgGBLCAERCATVykLb5to6bSogFJptFAKyRTAQb9tCRAQCQXWB1ecPfgY21a5+UwJy4KvEUFS289SkOkPPbpjEIBAIBL7CIc6m3FfIplPSnIQtVsMtkhUCIhAIqgxJiWw6DXXTAhJujqWZKiqXtoJlmp7UlAgEAh9Aan/AHrqvpgZh09MWNy0gvc+CrgSEG2srUEohk6mr0QECQc1CGUi1XgcSCGnZ02fIptf5TQuIm401b4lg+hZJp1JuXyyBQCDwO+nI1obqbaksnzQ0bFiZKFiJw11Y2azQXYFA4G9UDZwTH4ctBW63JCBHnwVLljSRm7pFUomE684SCARVDKMmyAFPunX7kcyCY2w2+yrP1iwQ7sZSIiCskC1iWabryhIIBNULZSwjpVnNduVopZEkbJEtd5bs+3xtC4htlcZSSCYWwDQ2ndwgEAh8BnWobhlOTVog2Lq953nYct3BlgWEWyE2qHTDJlvVSjK5ZRHeFOjCmpud5f/WrAUsENQ0plW7LQGZaXLDgGw522d7ve0z4dKssj7Asq2SFbtgTcjczIyIhwgEVUhyoTaXPbQ+gj1T26o32JaAHIpBppaD6UYJXU26rsPs9JRI7RUIqoxUujYFJGQ4xoENJg+uxbYEhDxHHCUSr9lYiGWV1s1kGAbMzkyBU5vuVIGg5mDca5CoUQtE20bwPM+2xzPebGpK1WprE7QSGCvtWzP435iZmhSBdYGgCpiPx3EiIdQaUe5J6nmebLtQbdsCcvo0sYNMq8lugQb2sCqDdWBZFsxMT7sZWiIuIhD4l7m5OahFjADsyKza0YD4ueR4kjm1aYWk0+WpHkfhWOC7m+nJCcik0yW3fAQCwdbAuT6JhQWoNbBx4vw87Gih25GAPPR8d9aIsJoMpqczGXDKaBWgNTI3OwOTE+OL/bNEfEQg8AOjo2Ng1uCEUTmlpR96nuzoje1IQDBvmKWNmmw3i5ZANlN+Dx2Owp2fm4XpqSl312OZonOMQFApcCM3zd3MtUi4GXa8diuwQ+K3mlLBA3qj5OxUjPxHkruUwpEwSKT8HZxxlgjeEgtxkGUZtFAIgsEgKKoKiqwAkSQs6gSBQOAtmGJPqe02Qh0fn6jNmT4WNXp/A3acwbNjAcHe8XfOsmTa0RuhxsA020QyCU0NDVBJ8HWgWwtvKBp4k7iAoLDIrpjk7gtBEQi2DsYh3ZtDudvacb/GtF2Tb+CmZ2ahFnFi4QT2NoQdsmMBQRKDkJIHoOYEBMnwYLoWCICmaeAH0LWGNzzJczujmu0qIxBUlIVEsqxx0FIRVKygpM0/IivOowycPQRkHuC13rzzveHv7f7c/mHYAZ64nY6dIaYCdk3GQihfrOfjC3yxFkFtgaBeSHBrP6tXf41WuGHyU2ps8ieyYvw7HmH9LwiwTwOzn+N++X9OgF66++fXvjb9nZvdsE08i1sEZ+I1m9KLu5B5HtAWKbYCQe2DdWDJZPU32gjFJj4rSdb/wheuHvcBtnhbhC9nAX73N3XZ/NadH95pgW3gmYDs/r3dWaLRmm1Xie1H5hfEYCiBoJYxDBPm5uarfrMYis4+pCj2/8hlIuY+sFI4lovqc3eeJtnsd9hLbMshDU8zpyJyeL5W25sgmUwG5ubjNeEXFQgEK0GX1dz8fNVf31LA1mQl+99yEWwotDqKCMfSz/DvffpO/NqnYYt4KiC7nyNZmzk12d4kj84tEczMqMnUPoGgTknymEetbA4Vde4YYXBqtdVR9E6BwPCfeZ6dPSvDFvC8dkObicRrNRaSB8VjcnoG0lldtGUXCKoYTJHHDSFmXNVKjFMl9kMMmLu2r2d1rBQYN7vzvlHliSbYAp4LyIGvEsO2a9sKQfCAz3Nzd5bfMOgmEAiqB4xlJlNpdyNYc9cvAW1D4Vhya7EC4SQRK7igwhbwpA5kNVElsqCreohYUPOVbRhcn+EnYDgUgmgkDKq6peMvEAjKCC6WmWwWUumM23+uFmGMWG5N8WqLiq38msFKUSGEmUFH2ZJvviQC0v9lMEa+5uiGLIegDsCTEpsvZvmJGdSCrpgEAwG3OlwgEFQWvD6xjguD5CgetR6/ZCBfI4U9bjcQjoKvb83rdgK2QEkEBMMxfX0sfvWOXhcCkgeLDrM8LoI3mYuHoioQ0jRXTIRlIhCUDxQNTHjBdiSYmluL3XTXwrLD72qqMcOFom11nGMFqwLr3Kv3g2O/emxL/rwSCQiXkNNEv/EtljFtPQx1CGZzOEbu5M2DIqJyUcGeVQE14IqM279qHUefpoTmYlrDFAgEdUg8O7vXcuw1N6IMGx8y6loYtmO7Xht0K9dzvZatR+eYlP5fQTL+R35XY2sEznP32eI/bDJE2D+HLVIyAUGcGYizGISIXPuxkM2APte83zW9yTkuB9tPvPKJni/+BASCOuQP3vxH/9iwjbryZHhBOtP570ORuwcJOL/tPrBWGm/uuTGZSV/s+NXDWy6/L6mTHjOyVNkuz2g/gUAgECyRzjT9/7hx9g+4QCw39SosHnTvsjcdSfpI768efgm2QcmjvKwtulDrdSECgUDgJ2SDWReDbVNvsPP/J5PIx3g85A8JsIv8qXH+722uIy/x2+/ISsMz/b9y6Apsk5K6sJADz4B58ayWUPTamxciEAgEfgM37LFgaP6550i+hfgrizeY/eZQQ0vA1MlzRz0pfim5gGBG1rFBFh/ez8IOJSIVSSAQCEoIhg26vkSKjtdo/eKBLaXpbkRZChXIGULNQCgOAoFAICgZVAbK4hMLUCbKVul29FlIO07ttzgRCASCSkFsLXXgqwfKNqa0bAKC83ePdkZqut27QCAQVAoe8HAOfwnmoYyUtdcGeYYYpiXSegUCgcBrApIW5xv1slZQlr1Z09yN6JyqgRgwLhAINgERHotNoEU0ff8wlH0Ob9kF5PQZYgNkyxbkqXZsatdPEx+BIA92GafSsEUtHQTrEpA1OjMDC5isBGWmIu1iBwabk2DRsgV6qpl4ZuoWJdItEAjqBEaxr59zCcC6srJ1rKAYjpHKPPQ8qUhooCICgkp5Ix2eVTVNuLI2gDJqE8e6YDN6WVxMglqHgOxIxH4HbBgRHSw2xnVdfTk6CxWiYgMrnvkqMbJQfp9dNYIXkszYdX5lXRUiIqhVCAHLcej7jk0mQLApFtKQKHfgvJCKTjw6NgjxsKoJV9YmQBEhpj0kOeQdAFnM0BXUFAQgTS14Fag9BoJNYYCdPvElqGhWa0UFBF1ZRiPMClN189jMHme28xo/YGXN9xYISgJzw+WjJmOvM+Z42majlsGaj+/eiM6RCmepVXzm6oFniAGSlgTBpnEvNMbekmTpDggE1QwPhzJG35NtKurDNklQBWaDNnvGzWitLL4Y2n14BOZliYl01S3AbGrYuvU+D7JfYwRqe8izoBYxCSNvUYsNCg/E1khYdubkGs0Sy40vBARdWYoVmhFtTraBza5Sar/HmBARQXXAI75pC6w3HNsWwfItonLX1Ynd0TnwCb4QEKT/y0QH0xKurG1AbDJBFfZzm4LoeCzwLzzaQYg0Drb+imxJ4lzdBpalzZPTlXdd5fGNgCAXQrG4cGVtD6LTVIDSVyVHGuIurYql9QkExZFNBuQ96ljvAFNFFuE2UMBOH/otf5U++EpAcIKWORyaEj7R7WHz6LpNrSuEwVvcpSWCkgK/kDDt7GvMtker+drmGzM9FIlUZIOL5Q77bkRnsKs5+AhfCQhy7AwxaUSbgQqhyeGK/e0iME3VtpwXTy1niv/oK8CkURAIKgW6rCi5atr0FYXJ20rRlSTJN3ESGeSZ1mBH2QUERXd3AqYr0etqI3wnIMix5yCNRTJQAR7v+chbBCRf1FjIsnz7YPPJ12EbYJYWMe33mU3eAwIitiQoK4zCfECCX1CwhxRuGcM2icqxvwafoKmRn4bkWNnjD4EIj3s8T3zp2velgGAL5xNadNaB8rd972kYyITV6H8AqLyprUnR793f+dQUbBNHYpQx+y7/72tMZpOiDYqg5BA8x+h1mdLXdNOZ36nL6kDrqR9KhFSs11MeAiT1aN/ps1BmgpqWHRj07wbQpwLCPzAeD2nOVsaV9fljz/8zTQn9JVRQRAJK6IefPPjFF8AD0BoBi74FMjnHw+uiPbagNDBIcsF4g29YLts7sDoKeaL3Y7f3Nu3/+4RIFVtE8W93RHb9N8caHi6rZ0JRmZ0ZHJzzo+sqDwGfc/0sa7R0vQXKzII+q35v+GtfXNDn/z5ltGx/XwKSCAUavvnsob/7fzRqrZ6brbIkhagsHyKM9uK2CgSCHcJ3WQ5j3OqQYMgxWUkWu+8O/9tHxhO3/lvLMU9B+aCKpLx+uO2hf/KRvZ8bgjLTcFSb7HmI+DoZpioWkBvfYp2mrYehAowlboTfHn/5RNJO7oISo5Lw3OO7nn5rd+OBkqfq0YDcrDDpMHdWtwohEWwXStktmXHhoDQLJcaihvTzOz/qn0jdOsaAqlBCCJWsgdZD7z3W8/GKtAsKOtp8/5eJ72tlqmLheOkMU3r6s52MkAAIPIPI/POnyi4msYOSBBEQCDYDwXZssKDIcJkCnSuV1VGvyJqW2v8szFayTftmqZqdJ3ubqZev6j2S49+4TdWikYBky3t4jP0AIaCAQLAG3F2VZdQZ5gvHLVGv5T2EMfPgl0Jjfqv3WIuqWYzJQ8RiqlbxbIyaRGcmte1hboW8ToGNSaKSXXAvJgHpJnXY60I8SgM1gUoLId8VC65H1fm+L/871kqI3gCCkiHz+IhD2X6JkC4Q1DformLsrsTgmiNarpeUFk2b7niOVNWU1qoTEH4yk4vfTneotlyRoHp9IbdifESWiAi01xmEyDah9hj3wl+3KBWjp0tMqEWL7/00NkOtHusDqcpFgZ1l8rAJ3Q7VS5qJIcgF2mWQm6nM9gIlu4SQ1DymDNIdizl3wKaig0EZUKJaet8XYLqaXFd5qnYxuHT2UgD0gS4ZW9QISg6x+KZUkxtQSLim7GJMBNtrCgYGk+htYpKbFKgoNi0ThsGsE7/tBs2rMu5Y1bvJka8xTQe9y01HFZQNKSBpzJH7iUT2ADgitbpawWaHEmQtx7kZBHLLcpgYSlZGLJvZx2+HRv1cab4RVb/wXvkei7E5vVWISPlRQIrYQDuIKu/jBz8EgqpAcgPjUpxRdssGZ1wSwlF2qAz0SLM2QZ4hBlQxNbHoXj8712jpobK3OxHkQPcWaHIbI6yPh0jaRC2JbzEdRkdlJt2hjrMAgoqAKdDReW1y9++Rklfvl5qa2bVffSHRxkJqDAQVA61AyZJCEJTa+WWymxJo5GFBUfhZQQiRLUbtuESkW1mLzqsivlFRmMrdhhlt9vDfITWRoFAzAoLpvSP/Jt1hBkV6rx9AMVFlOeYA6SSM7OWBWeHiKhNLLirGJkxKR5Uy9KkSbI5gTJvv/4L/e1xtlpqKG6CIXP5mpktikgYCX0GI0wCq0gNU6ZAlGqPCMvEUtyMuZXEgdNwBaVIWRX++g0W1xJFfhrlqq/VYj5q6iDGPevJ6eLoSg6gE68OYnGAmuyJJ9iu2wX4GjnRDzG33hATI9LJD2E8J0NfAhhEhHv5DATv9Z+dhvpbEA6nJzCUsNDxvZruDlIhCQx+DwXdJlkKOSjsIkzpkmTTwuInGt9Mio24NXNGlbJYbcFMSpXOiZsP/WIaTOT4a8eVM851Ssxfq2bMscMjMdggRqQ4wZkJtSwGmxUChrRIhLbJEYvwMDdaru4uLBabXmoxw1xSVZonM5qihZwlRfTkfW3AvlFD9YjA89dxzpCa9IjW907vERYRYerdoAV+dKITIhi1FFY3EJEaaqAwtQGmU1G73AZMylpKoHHe4WIBDkxKhadH5tjrB1uzfHgmNn6lByyNPzbsKUEQA9C5ZFy1PagG0VBiRuIjQBmCkwQHSEJDlgJvlRSHg+15dBJhDwZSwiT5laaawBBfFpAJyQnS7rR20iKaPXIDp02dITRdp1oWveegHLCiloNPSdSEiNYgcIJJjmQojwYBMSZiCE5FUNUQZ/xdIhEkQKXc9yqL7Kc3dT2ni3uQ0pSwjM5Z1HMOW1YAtJvnVJkRj5sHB0CSpcfFA6iZYiX2zsgG9U7iz6hSNBCBLgkBIQFaIypit8q+DPIpPbMofd3ECZAMLRiayZXNzR8ahWzIzmcl/moCF7gpCFMvi/4LCDGIyEaeoQyKaZva2wyQ5XfvigdRVtgtaImQh22FbRLTaEAgEnuKOox2pD8sjT92lS/7g91mwr1XvEpaIQCDwDJUah/5meKJa27Jvl7pbRJ/5KjGO9GijsiRcDAKBYOc4mpM9L4cn6008kLrchaN/8r1AaApNThAIBIJtYilO5hJEpmu1zmMj6rril51hyt2j0JnWdTEUSSAQbImgo2X7fhMmq3EUrVfUfcsIFJGbe6HNkHXRLVYgEGwKW9MWjj0L8/UsHojoOQRuF1/p4r9Jt6uiFbxAIFiHoApMotrC3r8F8VprjLgdhIAUcPEsa1F0vREEAoFgFdhShtDaGQblBUJAVnH9LGs003qzmLEuEAjyUBNok6NN9zxPRLuZAkQtxCr2PUcWaEabwaH3IBAI6h5FZXZI1iaFeNyLEJAiHPv7JKXOahOqJgZTCQR1jUqNd+XQWP+XiZi7UgThplkH7OSrZLPtjBCR5isQ1BmO42QvReq3xmMzCAHZgLNnmfyAAq12So+AQCCoC0zZiN/3643xek/T3QghIJuAMUYufAuaAo7eBAKBoGYJ8NinqWtzh34LUkI8NkYIyBaYOsuiMwm9VQqI2JFAUGsQpplSO8wceIYYINgUQkC2COMurXPZbJcm4iICQc1gRO30iS9EZ+qxIeJOEAKyDVBEhgFaHF2PgkAgqGoYsxJH/nZsTlSWbx0hIDvgva+xJg30JlF0KBBUHw7/vw0Lsye/1JUGwbYQC98OuXOWhebMbGuQEhUEAkF1YFHDuROeOXaGiJEOO0AIiAegS+sdO9kctdUYCAQC34JZVnOpbPzBrzQnRJbVzhEC4iFj32fhTDrbKmauCwT+g2jMtCE0few5YXV4hUhH9ZCez5JMPBGa0MWkQ4HAVyigpc9BaEKIh7cIC6QEYOHhpRehWXb0BmKJYywQVArsZzc9kYk/+tWWJBFZVp4jFrcSMvQDFrRmoUViugYCgaBsMBVYk6ylR/8a4g/9Id/GCUqCEJASw84w6f2T8YbGTFOj6ejCZSgQlBhV0xwrCfOH/w6kRG1HaRECUiaGfp9bI80Zbo1IwhoRCEqEbNup/dHoHBEddMuCEJAygtbIjW6IsQZosC1dZGoJBB4hS8zK0MT8id/ozIj03PIhBKQCsJeY8s7dTHtEkYIiyC4Q7AwW1RKHvwDzoo9V+RGLV8Vg5Mr3ZqJKJtIk6kYEgq2DdR3J+dD8g1+BrLA6KoMQkAqDVeyjWWhKUj0memoJBBsTkDXKVIgPPAuimrzCiAXLJ+D43JCdbjYMOSSERCC4F0zNDce0hTf+HSSee1EEyf2AWKh8xtsvsDD3azWBKgVBIBAAc4AFbS3r7IL4/k+BKawO/yAExIecOcOkv30y3pDNaI2SI9rNCOoXJwuOHdJmT36JiJbrPkQIiI95+22mdr4PMSukx0whJII6QrGZTaKhxABAStR0+BchIFUAe4GpVzRoIERvAIGghsE4hyNriWMAC0I4/I8QkCoCA+1BPdVkOUpYBNoFtQTO6VBVLTncDonTp4kNgqpALEJVyNDvDwWha3+DndYjQkgE1QyOlXVSWtKUIfXQ86LpYbUhFp8qBi0SA1KNobQihERQVVBucURAS+xRISFcVdWLWHRqgJxrC7hrSxeuLYGvQeEgtpY6HIK4EI7qRyw2NQTjQnIpAVE5IgZZCfyF66qSjeR9v96I1eNCOGoEscjUIG4dyV5oSLFsTFVEny1B5QirmpGcg8TRaciQM6LZYa0hBKSGwfbx00chnLIhYhi6aJEiKAvoprIcO9uiRZO9g2AI4ahdxIJSJ+B4XXsaokFFj4qiREEpwOI/NRhKTadERlW9IASkzmCMkTf+BGJdDCJZRRfzSAQ7AvtU2UEnO2anUp/4UmdGjJCtL8TiUaegkNx9ETQdICrqSQRbBYPiEtPSSjukDjwDphCO+kQsGgI3VvLGIxBtmM1EiC0FhZgIioGxDYc4OuXWxklhbQhACIigALRK4GWQb1yDiByGcNbWhZjUOSgaTHWMdoikLrWDLtqMCAoRi4NgTbBAscsEbVqGKAM9IOIl9QHGNSg4ekdLJN3WAFkiREOwBmJBEGwKHL07k4TwVCwd0SASsHRdBkHNoGrg0JSdjSnRTOdvuDPGReqtYEOEgAi2DHd1yYMvQogYmZiImVQvKg+EM7D1NETTJ1zRACbiGoKtIC58wY7AuMn4H0Jood0VlCADSbi6fAq6pkKKZrAoZKEJ9P7TRAeBYAeIC13gGfkg/OQdCC4oyRAosSBN66qwUCoDBsCBamYsCAa/mx0efNl6+h8/7YiZ4gKvEBe2oGQwYOSdF0Dp4d4Spxm0tAMa03kwXghKSXAzpkzHiAZsYzrWaDyogyE63gpKibiQBWUFRQUugTr3HmhzAQg6DqiqrCuWDiIovwUw6G0Y1MrIjqVnDeMDJ9t08hDYIoYhKCdCQAQVBd1eL74I0jEAWU5CkCnJAA1JatCRVEvntorGT9I6jalgzIIFgKkac8wEtZnjmMRoMI8q3CX1FSwG52os3FGCCiIEROBTGLl0FlSYng6Ew+1KQk4FgqqkWFkiK4TIteYGQ7FQVM22WMaR5bCVTM5baqjZtrJgPvg82ERYFgIfIgREUEUwws4AefEokGODIDc/AEo6AUqWgBxSU4plSIpMiSQHQDL5v8TMnd+VEBumcm+dDhAMaAy/zjhZFjCBqmrIjuspqgQdOxBttOeug92YAOfSUXCeHeQ/84+FVSGoHoSACGoO7O2FIjMwD1KoGUg4DVJfBMikDlI6C+6ArYDMYy4NAHoqtRR7Mblls9HvDgUjzNGBAqTc+1o06iwk+OMN3KU0z3+fDU5WAfrgbnAGU8COtvPvfRq/XwiDoPb4fwAHPL3kFy4KTQAAAABJRU5ErkJggg=="};

/* ======================== maintainance-plugin/screens.js ======================== */
/* ⚠ สำเนาอ่านอย่างเดียวของ figma-export/maintainance-plugin/screens.js จาก origin/main ee11614 (13 พ.ย. 2569 17:45 · "ไฟล์ 34 หัวข้อ 6: เติมความคืบหน้าฝั่งเว็บตอนพักงาน 13 พ.ย. 2569") ลอกเมื่อ 18 พ.ย. 2569
   ฐานของปลั๊กอินพระผู้สร้าง (build.js อ่านจากที่นี่ ไม่อ่านไฟล์ของพี่นุ) · ห้ามแก้ในนี้ — ย้ายฐานรอบหน้าให้ลอกทับทั้งไฟล์แล้วแก้หัวนี้ */
/* ============================================================================
   Maintain-D — บำรุงรักษาตามวาระ · จอตาม userflow ครบ 18 scenario จาก component จริง (รอบแรก 20 ต.ค. เส้นของ กบค. 9 scenario · รอบสอง 22 ต.ค. อีก 9 scenario ของ ผพจ. ผู้รับจ้าง กรย. หน่วยงาน หัวหน้า · 30 ต.ค. แผนปี + จัดรถรายไตรมาส · S2 อนุมัติทั่วไป · S3 พักไว้ เหลือ 17 scenario)
   ----------------------------------------------------------------------------
   เจ้าของงานสั่ง 20 ต.ค. 2569: "ขึ้น ui figma … แยกออกจากเรื่อง overhaul" และ
   "ลองขึ้นโดยอาศัย component และการ[ออกแบบ]ของ flow อื่น มาประกอบกัน"
   ⇒ ทุกชิ้นเป็น instance: (1) component ไลบรารี (Component) VMS Plus นำเข้าด้วย key · (2) component ที่ทีมออกแบบทำไว้ใน flow งานซ่อม
      ของไฟล์ Maintain-D (local): PartRequestStepPanel (เบิกอะไหล่ Smart Inventory) · IncidentPhotoGallery (ภาพ) · VehicleAndReporterInfo (ข้อมูลรถ) ·
      SummaryRequestedParts (สรุปรายการเบิก) — ไฟล์ที่ไม่มี component เหล่านี้ ปลั๊กอินใช้แบบสำรองจากไลบรารีแล้วรายงาน
   ต้นทาง: Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md · ตารางจับคู่: figma-export/maintainance-component-map.md
   กติกา: figma-export/component-rules.md (R1–R18) · ตารางไม่เกิน 8 คอลัมน์ทุกตาราง (ใช้ component Table ทั้งก้อนได้)
   export (22 ต.ค. 2569 · ปรับให้ตรงเงื่อนไข Overhaul ใน plan.md หัวข้อ 🎯 + component-rules ข้อ 5.1 R19 · ข้อ 5.4 R26):
     ปุ่ม ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component · ป้าย Device Type · 1 scenario = 1 บล็อกตัวอักษร · A.1 A.2 = state
     + flowchart กิจกรรมของ scenario นั้นซ้ายสุดของบล็อก (6 พ.ย. 2569 "อยากให้ flowchart คู่กับ ui ไม่ใช่ user flow" · ไม่มี ACTIVITY ฝังมา = กลับไปใช้ผัง userflow ที่ FLOW_NODES ผูกจอกับกล่อง) · ทุกปุ่มวางบนหน้า "Maintainance" ต่อใต้ของเดิม
   ============================================================================ */

const PLUGIN = { prefix: 'MT', page: 'Maintainance', menu: 'บำรุงรักษาตามวาระ', searchHint: 'ค้นหาเลขที่ MR, ชื่อแผน' };   // toast ขวาบนเสมอ — notify() ใน core (5 พ.ย. 2569)

/* ---------- component ที่ใช้ — ขาดตัวไหนหยุด (ไลบรารี) · NESTED = ชิ้นซ้อนใน component อื่น · LOCAL_OPTIONAL = ของไฟล์ Maintain-D ไม่มีก็ใช้แบบสำรอง ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Table header',
  'Table pagination', 'Text input', 'Input dropdown', 'Input dropdown with badges', 'Text area', 'Number input', 'File upload', 'Input label', 'List with checkbox', 'Alert', 'Pill outline',
  'Primary button', 'Secondary button', 'Secondary danger button', 'Tertiary button', 'Dropdown list', 'Background overlay', 'Modal', 'Notification',
  'Empty state/Data empty', 'Radio text card', 'Images', 'Date picker', 'Checkbox with description',
  'add-24-300-round', 'filter_list-24-400-round', 'more_horiz-20-400-round', 'delete-24-300-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round',
  'cloud_upload-24-300-round', 'stylus-24-300-round', 'check-24-300-round', 'quick_reference_all-24-300-round', 'description-24-300-round', 'Dropdown menu',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header', 'Modal footer', 'Tabs', 'Notification card', 'Horizontal radio groups', 'Checkbox text card',
  'Side panel header', 'Side panel footer', 'Empty state/Search not found',   // 12 พ.ย. 2569 ถอด Rating · Featured icon (S27 แบบประเมินความพึงพอใจย้ายไป satisfaction-plugin R105)
  'Progress steps', 'Mobile progress steps'];   // S10 ขั้นตอนบำรุงรักษา 2 ขั้น (รีวิว 5 พ.ย. 2569 · R70) ตาม 5.2 Vehicle Management ของ UI Release#2 · S24 แผงตัวกรอง + ไม่พบข้อมูล ตาม Vehicle list ของ UI Release#2 (4 พ.ย. 2569)
const NESTED = ['_Dropdown menu item', 'Nav button', 'Tab item', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Primary danger button',
  '_Content item base', '_File upload item base', 'List with checkbox item', 'List header item', 'Checkbox', 'Badge outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Radio button', '_Notification item base', 'Status',
  'star-24-300-round'];   // 12 พ.ย. 2569 ถอด _Rating star base และไอคอนหัวด้าน call groups search_check ของ S27 (ย้ายไป satisfaction-plugin R105) · star = ไอคอนนำปุ่ม "ประเมินความพึงพอใจ" ของ S13 L.5 (12 พ.ย. 2569 รอบ 2 ตามเว็บ) นำเข้าไม่ได้ = ปุ่มไม่มีไอคอน
const LOCAL_OPTIONAL = ['RepairFeedback', 'ReturnPart', 'PartRequestStepPanel', 'PartsInventoryPanel', 'RequestedPartsPanel', 'Spare Part Card Item', 'IncidentPhotoGallery', 'VehicleAndReporterInfo', 'SummaryRequestedParts',
  'ReceiptChecklist', 'HandoverSignature', 'Modal Signature', 'InspectionChecklist',   // รับรถ / ลงนาม / ตรวจสภาพ ของงานซ่อม (S10 · 3 พ.ย. 2569) ไม่มีในไฟล์ → แบบสำรองจากไลบรารี
  'Request Repair/Budget',   // งบที่ตัด + ศูนย์ต้นทุน ของงานซ่อม (หน้า Local Component ของไฟล์ Maintain-D) — S10 Step 2 (รีวิว 5 พ.ย. 2569 · R72) ไม่มีในไฟล์ → แบบสำรองจากไลบรารี
  'Device Type', 'Component 1', 'Header'];   // Device Type = ป้าย Device/Desktop/Mobile ชุดเดียวกับ Overhaul (22 ต.ค. 2569 · Component 1 = ตัวสำรองชุดเก่า) · Header = แถบรหัส flow ของทีมออกแบบ (ไลบรารีอื่น หาจาก instance ในไฟล์)
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี (ดัมป์ 19 ต.ค. 2569) — ตัวที่ core ยังไม่มี */
/* รูปแบบบรรทัดต้องเหมือน KEYS ใน core ("ชื่อ": ["key", set]) — test harness อ่าน key ด้วย regex จากซอร์ส */
Object.assign(KEYS, {
  "Input dropdown with badges": ["705d2a75bc12121c2c1c0a9737327fbc1ea60696", true],
  "star-24-300-round": ["ecf8821fb00ba65575f6814101291f6166e00aa6", false],
  "Images": ["39fe2574c3dcfeebe3eded7a76fecbc04ee41ef7", true],
  "Radio text card": ["e4510738f989bb24dbfb70fe6acfbf5705dcd60b", true],
  "Radio button": ["b29b98831c56216e005bb1c403e3f833d5e0f1cf", true],
  "Modal footer": ["78e84b8dfd520b686df45c5219feaf5f64a4bcec", true],
  "description-24-300-round": ["e42bf9bc8971c1449df0a602f3beca96cd3e5b77", false],   // ไอคอนเมนู "ผลการทดสอบน้ำมันไฮดรอลิก" (3 พ.ย. 2569)
  "Horizontal radio groups": ["50c917f3a90caf41227efab4841d0ce003c468dc", false],   // key ของไฟล์ Component (ดัมป์ 19 ต.ค.) · 11d953b1… ที่ UI Release#2 ใช้เป็นไลบรารีอื่น นำเข้าไม่ได้
  "Notification card": ["8b00e80ca7ead162e5de06e8cc261b86d5904c32", false],
  "_Notification item base": ["5e4101e154462cac0b912c28d0499b61f84c3001", false],
  "Status": ["65871480cb419a27224a15825374bc1486ab34d6", true],
  "Checkbox with description": ["dfc323f6bb605f586c4928ecb08c77acfb241f53", false],
  "Checkbox text card": ["a29fe414b23f6ac84089cc837b8f2ff06ac561a3", true],
  "Step circles / 4 steps": ["5d90e00c1796d10ae8a19989403f503e0d54bf87", true],   // S10 มือถือ วงขั้นตอน 1/2 2/2 แบบ Check Expense Modal หน้า 5.14 - 5.15 Cost & Expense Check ของ UI Release#2 (5 พ.ย. 2569 · R70)
  "account_balance-24-300-round": ["48c0cb9ff8ec9c4c6c9a2be469bcd54a12742890", false],   // ไอคอนนำช่องศูนย์ต้นทุน แบบสำรองของ Request Repair/Budget (ตัวเดียวกับ Overhaul R18 · 5 พ.ย. 2569 · R72)
  "Metric item": ["5e82119aab7dc5401c7f5940b7a500339ace506a", true],   // S4 แดชบอร์ดอะไหล่ (6 พ.ย. 2569) — key เดียวกับแดชบอร์ด Overhaul (R22)
  "download-24-300-round": ["336f0dff014c26316e0fa56959bc75f09f71531d", false],   // S4 ปุ่มส่งออก — key เดียวกับ S18 ของ Overhaul (R32)
  "swap_driving_apps_wheel-24-300-round": ["d431c64461da6f292b3989371704fd336e1f719b", false],
  "remove-24-300-round": ["e5b3c70e001a4aed353f97300ba07aa3c9fc4bff", false],   // R111 (13 พ.ย. 2569) เมนู … "เอาออกจากไตรมาส" ของแท็บไตรมาส (ไฟล์ Component หน้า Icons)   // S25 เมนู/ปุ่ม "ย้ายไปไตรมาสอื่น" (ไฟล์ Component หน้าไอคอน · UI Release#2 ปุ่ม "โอนย้ายสังกัด" ใช้ swap_driving_apps)
  "car_repair-24-300-round": ["f87c5a858bf895fee867a3af065e82f75f620d9e", false],   // S25 เมนู "ดำเนินการบำรุงรักษา" (10 พ.ย. 2569) — ไฟล์ Component หน้า Icons
  "no_crash-24-300-round": ["3d940da7d6274fd75d090c7a9155a482de01a923", false],   // แดชบอร์ดแบบ VMS+ (12 พ.ย. 2569 · R106) การ์ดตัวเลขยานพาหนะปกติ — ไฟล์ Component หน้า Icons
  "event_busy-24-300-round": ["d7e88cfc5a57d608dafa7d93a8e7f6532cf35096", false],   // แดชบอร์ดแบบ VMS+ (R106) เรื่องที่ควรดู · เลยกำหนด — ไฟล์ Component หน้า Icons
  /* S24 แท็บข้อมูลยานพาหนะแบบ Vehicle info (12 พ.ย. 2569 · R107) — การ์ดของไลบรารี (Component หน้า Cards / Badge) + ไอคอนแถวการใช้งานล่าสุด */
  "Card item row": ["5511f46face9e65e08d274bbf7c9d73489124362", true],
  "Card item base": ["68f4c18df873c10da2f8bfac894446e5c2bbc731", true],
  "Badge outline with indicator": ["95e26f4acaeb8a30653090c1a8c5d53e915c2996", true],
  "local_gas_station-24-300-round-filled": ["6676743d43062ce200124ade93829519500d5004", false],   // ไฟล์ Component หน้า Icons (Last usage ของ UI Release#2 ใช้ไอคอนชื่อเดียวกัน)
  "schedule-24-300-round": ["be1da86a82307fa8d337f57c38fbc1b2f3e882d6", false],   // ชั่วโมงเครื่องจักรสะสม — ไฟล์ Component ไม่มี timer (เว็บใช้ timer) ⇒ ใช้ schedule ของหน้า Icons
  "local_car_wash-24-300-round": ["70479232ec906f6477857a48fed92bdf9b6bf771", false],   // ไลบรารีไอคอนที่ UI Release#2 อ้าง (Last usage) · ไฟล์ Component ไม่มี ⇒ นำเข้าไม่ได้ = แถวไม่มีไอคอน
  "local_parking-24-fill-300-round": ["31f53c49f2a25c3ca3b7ac06cbb6a9442249b2c6", false],   // ไลบรารีไอคอนที่ทั้งไฟล์ Component (หน้า Modals) และ UI Release#2 อ้าง · นำเข้าไม่ได้ = แถวไม่มีไอคอน
  "calendar_month-24-300-round": ["afb81bef65f96089512284d42edd7bb46646a465", false]   // ไอคอนนำช่องวันดำเนินการ (6 พ.ย. 2569 · R83) — ไฟล์ Component หน้า Icons · ช่องช่วงวันที่ Date range picker / Trip date ของ UI Release#2 หน้า 5.2 Vehicle Management มีไอคอนนำ
});
NEEDED.push('Featured icon', 'no_crash-24-300-round', 'event_busy-24-300-round');
NEEDED.push('remove-24-300-round');   // R111 เมนู … เอาออกจากไตรมาส   // แดชบอร์ดแบบ VMS+ S4 S24 (R106 · 12 พ.ย. 2569) Featured icon ของหัวแดชบอร์ด/การ์ดกราฟ/เรื่องที่ควรดู (ถอดจาก DIRECT ตอนย้าย S27 ออก R105 — แดชบอร์ดใช้ต่อ) + ไอคอน — ไอคอนไม่มีในไฟล์ก็ใช้ไอคอนตั้งต้นของ Featured icon
NESTED_ONLY.add('no_crash-24-300-round'); NESTED_ONLY.add('event_busy-24-300-round');
NEEDED.push('Metric item', 'download-24-300-round', 'swap_driving_apps_wheel-24-300-round', 'car_repair-24-300-round', 'Step circles / 4 steps', 'account_balance-24-300-round', 'calendar_month-24-300-round');   // S25 (5 พ.ย. 2569) ไอคอนย้ายไปไตรมาสอื่น · 6 พ.ย. 2569 ไอคอนช่องวันดำเนินการ
NEEDED.push('Card item row', 'Card item base', 'Badge outline with indicator', 'local_gas_station-24-300-round-filled', 'schedule-24-300-round', 'local_car_wash-24-300-round', 'local_parking-24-fill-300-round');   // S24 แท็บข้อมูลยานพาหนะ (12 พ.ย. 2569 · R107) — Fleet card · Last usage · การ์ดเครื่องมือกล ประกอบจาก Card item row/base · Badge outline with indicator
['Card item base', 'local_gas_station-24-300-round-filled', 'schedule-24-300-round', 'local_car_wash-24-300-round', 'local_parking-24-fill-300-round'].forEach(n => NESTED_ONLY.add(n));   // ชิ้นซ้อน/ไอคอน — นำเข้าไม่ได้ก็ใช้ตัวที่ซ้อนใน Card item row · แถวไม่มีไอคอน

/* ---------- ข้อมูลตัวอย่าง (ยกชื่อรถ/หน่วยงาน/จังหวัดจาก maintainance-yearly/mock-yearly.js — ค่าสมมติทั้งหมด) ---------- */
const PST = { review: ['รออนุมัติ', 'Warning'],   // 30 ต.ค. 2569: ส่งอนุมัติทั่วไป ไม่ผ่าน ผพจ.
  returned: ['ส่งกลับแก้ไข', 'Error'], approved: ['อนุมัติแล้ว', 'Brand'], active: ['ดำเนินการ', 'Info'],
  closed: ['ปิดงานแล้ว', 'Gray'] };   // รอหัวหน้าตรวจสอบ · ประวัติผ่านแล้ว เอาออก 10 พ.ย. 2569 (S16 S17 ตัด) · 13 พ.ย. 2569 ไฟล์ 34 ข้อ 20 (ก): แผนเป็นปิดงานแล้วเมื่อทุกคันในแผนทุกไตรมาสเสร็จสิ้นหรือบำรุงรักษาไม่ได้ และผู้ดูแลยานพาหนะรับทราบครบแล้ว (คันที่ย้ายไตรมาสต้องทำก่อน) ไม่ใช่ครบแผนเดินทางใบเดียว
/* 22 ต.ค. 2569 เจ้าของงาน: ไม่ทำเรื่องยื่นของบ/ทบทวนแผน · เริ่มที่สร้างแผน · เลือกรถตามภาค + ประเภทรถ
   30 ต.ค. 2569 เจ้าของงาน: แผนปี — เลือกปีงบประมาณได้ทุกปี แล้วจัดรถลงไตรมาส · ส่งอนุมัติทั่วไป (ไม่ผ่าน ผพจ.) · ไม่มีเลขงานในระบบ (S3 พักไว้)
   ⇒ ช่องที่ 0 = เลขที่ MR (Maintenance Request) รูปแบบจริงที่เจ้าของงานให้ 30 ต.ค. 2569 "MRZ69000XX" = MR + เขตการไฟฟ้า (Z = สำนักงานใหญ่ ที่ตั้ง กบค.) + ปีที่เลือกตอนสร้างแผน 2 หลัก + ลำดับ 5 หลักนับต่อกันในปีนั้น (ไม่ใช่เลขงาน) · ช่องที่ 3 = ไตรมาสที่กำลังทำ (ขั้น S4 เป็นต้นไปทำรายไตรมาส) · ช่องที่ 8 = ปีงบประมาณ · ช่องที่ 9 = รถรายไตรมาส */
const PLANS = [   // เลขที่ MR · ชื่อแผน · ภาค · ไตรมาสที่กำลังทำ · จำนวนรถ · สถานะ · วันที่สร้าง · ประเภทรถ · ปีงบประมาณ · รถรายไตรมาส
  ['MRZ7000001', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 และภาค 2 ปีงบประมาณ 2570', 'ภาค 1, ภาค 2', 'ไตรมาส 1', '12', 'active', '03/10/2569', 'กระเช้าแก้ไฟ', '2570', 'ไตรมาส 1: 6 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 1'],
  ['MRZ7000002', 'บำรุงรักษารถพ่วงฉีดน้ำ ภาค 2 ปีงบประมาณ 2570', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 2', '8', 'approved', '05/10/2569', 'รถพ่วงฉีดน้ำ', '2570', 'ไตรมาส 1: 0 · ไตรมาส 2: 4 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ7000003', 'บำรุงรักษากระเช้าฮอทไลน์ ภาค 3 ปีงบประมาณ 2570', 'ภาค 3 (กลาง)', 'ไตรมาส 1', '6', 'review', '17/10/2569', 'กระเช้าฮอทไลน์', '2570', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MRZ7100001', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 4 ปีงบประมาณ 2571', 'ภาค 4 (ใต้)', 'ไตรมาส 1', '9', 'returned', '12/10/2569', 'กระเช้าแก้ไฟ', '2571', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ6900011', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 ปีงบประมาณ 2569', 'ภาค 1 (เหนือ)', 'ไตรมาส 4', '10', 'closed', '02/06/2568', 'กระเช้าแก้ไฟ', '2569', 'ไตรมาส 1: 3 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 2']];
const NEW_PLAN = ['MRZ7000004', 'บำรุงรักษายานพาหนะ กบผ. ปีงบประมาณ 2570', 'ภาค 1, ภาค 2', 'ไตรมาส 1', '10', 'review', '30/10/2569', 'กระเช้าแก้ไฟ, กระเช้าฮอทไลน์, รถพ่วงฉีดน้ำ', '2570', 'ไตรมาส 1: 3 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 2'];   // 6 พ.ย. 2569 รถทุกคันของหน่วยงานต้องอยู่ในไตรมาส ⇒ 10 คัน (CAND ทั้งหมด)
/* 6 พ.ย. 2569 เจ้าของงาน "มีกรย ที่สร้างแผนบำรุงรักษาได้ หน่วยงานที่ใช้ flow นี้ มี กกฟ1 2 และ กรย" + "กกฟ กรย สร้างแผนได้ ทำเอง ไม่เกี่ยวกับ กบค เหมือนสร้างแผนแล้วก็ดำเนินการเอง กบค แค่เห็นแผนทั้งหมด"
   ⇒ ผู้สร้างแผนและผู้ดำเนินการ = หน่วยงาน (กกฟ.1 · กกฟ.2 · กรย.) · ข้อมูลตัวอย่างเป็นแผนของ กกฟ.1
   6 พ.ย. 2569 (รอบ 2) เจ้าของงาน "กฝช ส่งให้ กบค เป็นผู้ดำเนินการ" + "กบค จะทำแผนจะมีรถของ กฝช. ด้วย"
   ⇒ กบค. สร้างแผนได้อีกหน่วยงาน (รถในแผนมีรถของ กฝซ. ด้วย) · แผนของหน่วยงานอื่น กบค. ยังดูอย่างเดียว */
/* 12 พ.ย. 2569 เจ้าของงานเลือกตามไฟล์สรุปประชุม VMS Plus (Notion "meeting 11/11/68" หัวข้อ 9 X6) — แต่ละกองของสำนักงานใหญ่สร้างแผนของตัวเอง ดึงเฉพาะยานพาหนะในความรับผิดชอบ
   ⇒ ผู้สร้างแผน = 6 กอง กบผ. กปส. กรย. กบค. กส.1 กส.2 (กกฟ.1 → กบผ. · กกฟ.2 → กปส. ลำดับเดิมไม่เลื่อน · กกฟ.1 กกฟ.2 เลิกใช้) · กบค. ยังเห็นแผนทุกหน่วยงานเหมือนเดิม */
const UNITS = ['กบผ.', 'กปส.', 'กรย.', 'กบค.', 'กส.1', 'กส.2'], CREATOR = 'นายวิชัย ทองดี (กบผ.)';
/* 9 พ.ย. 2569 เจ้าของงาน "ปรับให้มีการสร้าง ของ กรย และ กกฟ ทำ persona ของทั้ง 3 กองนนี้ โดยหน้ารวม เห็นไม่เหมือนกันคือ กกฟ1,2 และ กรย สร้างได้ และเห็นแค่ของตัวเองแต่ กบคจะเห็นของคนอื่นด้วย"
   ⇒ หน้ารายการแผนของ กกฟ.1 กกฟ.2 กรย. เห็นเฉพาะแผนของหน่วยงานตัวเอง (ownPlans) มีปุ่มสร้างแผน · กบค. เห็นแผนทุกหน่วยงาน (allPlans · บรรทัดรองเป็นหน่วยงาน)
   UNIT_PLANS = แผนจำลองเพิ่มให้ทุกหน่วยงานมีแผนของตัวเองอย่างน้อย 2 แผน · เลขที่ MR นับต่อกันทั้งระบบภายในปีงบประมาณ (Z71 ต่อจาก MRZ7100001 · Z69 ต่อจาก MRZ6900011) */
const UNIT_PLANS = [
  ['MRZ6900012', 'บำรุงรักษายานพาหนะ กบผ. ปีงบประมาณ 2569', 'ภาค 1, ภาค 2', 'ไตรมาส 4', '9', 'closed', '05/06/2568', 'กระเช้าแก้ไฟ', '2569', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ7100002', 'บำรุงรักษายานพาหนะ กปส. ปีงบประมาณ 2571', 'ภาค 3, ภาค 4', 'ไตรมาส 1', '7', 'review', '15/10/2569', 'กระเช้าฮอทไลน์, รถพ่วงฉีดน้ำ', '2571', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 1']];
const allPlans = () => PLANS.concat(UNIT_PLANS);
const ownPlans = (u) => allPlans().filter(p => PLAN_UNIT[p[0]] === u);   // หน้ารายการแผนของหน่วยงาน u เห็นเฉพาะแผนของตัวเอง
const REGIONS = ['ภาค 1 (เหนือ)', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ภาค 3 (กลาง)', 'ภาค 4 (ใต้)', 'สนง. (สำนักงานใหญ่)'];
/* 11 พ.ย. 2569 เจ้าของงาน _"แก้ s1 เรื่องตัวกรอง ให้เพิ่ม ภาค อีกหนึ่งรายการคือ สนง = สำนักงานใหญ่ โดย ภายใต้สำนักงานใหญ่จะมี กกฟ1 กกฟ2"_ (R93)
   ⇒ ตัวเลือกที่ 5 ของช่อง "ภาค" = "สนง. (สำนักงานใหญ่)" (เคาะป้ายแบบตัวย่อ + ชื่อเต็มในวงเล็บ เหมือนภาค 1–4) · เขตภายใต้ = กกฟ.1 กกฟ.2 · ชิปตัวกรอง = "สนง." (shortRegion)
   12 พ.ย. 2569 เจ้าของงานเลือกตามไฟล์สรุปประชุม VMS Plus (X3) — สำนักงานใหญ่แยกเป็นกอง กบค. กรย. กบผ. กปส. กส.1 กส.2 + สำนักงานภาค 4 ภาค ⇒ เขตภายใต้ สนง. = 6 กอง แทน กกฟ.1 กกฟ.2 */
/* เขตภายใต้ภาค (R35 · เจ้าของงาน 2 พ.ย. 2569 "ภาคเหนือ มี 3 เขต เขาก็จะเลือก ภาค แล้วจึงเลือก เขต ภายใต้ภาค แล้วถึงเห็นรถ")
   ค่าย่อและ placeholder "เลือกเขต" ตาม Input dropdown ของหน้า 5.9 EV Charging Station ใน UI Release#2 */
const DISTRICTS = { [REGIONS[0]]: ['กฟน.1', 'กฟน.2', 'กฟน.3'], [REGIONS[1]]: ['กฟฉ.1', 'กฟฉ.2', 'กฟฉ.3'], [REGIONS[2]]: ['กฟก.1', 'กฟก.2', 'กฟก.3'], [REGIONS[3]]: ['กฟต.1', 'กฟต.2', 'กฟต.3'], [REGIONS[4]]: ['กบค.', 'กรย.', 'กบผ.', 'กปส.', 'กส.1', 'กส.2'] };
const dCode = (c) => c[2].split(' ')[0];   // รหัสเขตของรถ จากหน่วยงานเจ้าของรถ
/* รถที่เข้าเงื่อนไข ภาค 2 + รถกระเช้า (ค่าสมมติ) — ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานะรถ */
const CAND = [['82-6789 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok'], ['82-1145 ขอนแก่น', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 ขอนแก่น', 'ok'],
  ['82-3302 อุดรธานี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 อุดรธานี', 'ok'], ['82-4410 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok'],
  ['83-1207 อุดรธานี', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟฉ.1 อุดรธานี', 'repair'], ['84-5521 นครราชสีมา', 'Hino FG + กระเช้า Tadano AT-146', 'กฟฉ.3 นครราชสีมา', 'ok'],
  ['85-0918 อุบลราชธานี', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟฉ.2 อุบลราชธานี', 'ok'],
  /* 5 พ.ย. 2569 เจ้าของงาน "อยากออกแบบหน้าสร้างแผนให้ เห็นรถหมายทุกคัน เหมือนหน้ารวมที่มีรถทุกคันแล้ว มีค้นหา มี กรอง" ⇒ ตารางรถทุกคัน (ไม่ใช่เฉพาะภาค 2) + รถเครน ให้ตัวกรองภาคและประเภทรถมีผล · ต่อท้าย ลำดับเดิมไม่เลื่อน */
  ['80-5738 น่าน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.2 น่าน', 'repair'], ['81-2210 เชียงใหม่', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.1 เชียงใหม่', 'ok'],
  ['82-9012 ขอนแก่น', 'Hino FM + ถังฉีดน้ำ 6,000 ลิตร', 'กฟฉ.2 ขอนแก่น', 'ok']];   // 6 พ.ย. 2569 เดิมรถเครน · ประเภทตามโค้ดจริงไม่มีรถเครน
/* ภาค · ประเภทรถ ของรถ (จากรหัสเขตและยี่ห้อ/รุ่น · ค่าสมมติ) — ตัวกรองรายไตรมาสของ S1 และสรุปภาค/ประเภทรถจากรถที่อยู่ในแผนจริง (เจ้าของงาน 5 พ.ย. 2569) */
const REG_OF = { 'กฟน': 0, 'กฟฉ': 1, 'กฟก': 2, 'กฟต': 3, 'กบค.': 4, 'กรย.': 4, 'กบผ.': 4, 'กปส.': 4, 'กส': 4 };   // กองของ สนง. (12 พ.ย. 2569 X3)
const regionOf = (c) => REGIONS[REG_OF[c[2].split(' ')[0].replace(/\.\d+$/, '')]];
/* ประเภทยานพาหนะ (ข้อมูลจาก API) — 6 พ.ย. 2569 เจ้าของงานเลือกใช้ชื่อตามโค้ดจริง resolveInspectionCarType ของ maintain-d-fe (กระเช้าฮอทไลน์ · กระเช้าแก้ไฟ · รถพ่วงฉีดน้ำ)
   รีวิว S6 "ย้ายประเภท มาไว้ในคอลัมม์ เช่นกระเช้าแก้ไฟ รถฉีดน้ำ เป็นต้น" · ค่าสมมติจากยี่ห้อ/รุ่น: ถังฉีดน้ำ = รถพ่วงฉีดน้ำ · Tadano = กระเช้าฮอทไลน์ · ที่เหลือ = กระเช้าแก้ไฟ */
const VTYPES = ['กระเช้าฮอทไลน์', 'กระเช้าแก้ไฟ', 'รถพ่วงฉีดน้ำ'];
const typeOf = (c) => /ฉีดน้ำ/.test(c[1]) ? VTYPES[2] : /Tadano/.test(c[1]) ? VTYPES[0] : VTYPES[1];
const shortRegion = (r) => r.split(' (')[0];   // "ภาค 2 (ตะวันออกเฉียงเหนือ)" → "ภาค 2"
const uniq = (a) => [...new Set(a)];
const P = PLANS[0];
/* 6 พ.ย. 2569 รีวิว S6 "ภาค เปลี่ยน หน่วยงาน" + "ย้ายประเภท มาไว้ในคอลัมม์" (เจ้าของงานยืนยัน) ⇒ กล่องรายละเอียดแผนทุกหน้า ช่องภาคเป็นหน่วยงานเจ้าของแผน · ประเภทยานพาหนะไปเป็นคอลัมน์รายคันในตารางยานพาหนะ */
const PLAN_KV = [['ชื่อแผน', P[1]], ['ปีงบประมาณ', P[8]], ['หน่วยงาน', UNITS[0]], ['ไตรมาส', P[3]], ['จำนวนยานพาหนะ', P[4] + ' คัน'], ['เลขที่ MR', P[0]], ['ผู้สร้างแผน', CREATOR], ['วันที่สร้าง', P[6]], ['อนุมัติเมื่อ', '08/10/2569']];
const VST = { ok: ['ปกติ', 'Success'], repair: ['ซ่อม', 'Warning'], transfer: ['โอน', 'Error'], dispose: ['รอยุบ', 'Error'] };
const RDY = { ready: ['พร้อม', 'Success'], notready: ['ไม่พร้อม', 'Error'], pending: ['ยังไม่ตอบ', 'Gray'] };
const VEH = [   // ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานะรถ · ความพร้อม
  ['82-6789 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok', 'ready'],
  ['82-1145 ขอนแก่น', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 ขอนแก่น', 'ok', 'ready'],
  ['80-5738 น่าน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.2 น่าน', 'repair', 'notready'],
  ['81-2210 เชียงใหม่', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.1 เชียงใหม่', 'transfer', 'pending'],
  ['80-9981 ลำปาง', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟน.1 ลำปาง', 'ok', 'ready'],
  ['82-3302 อุดรธานี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 อุดรธานี', 'ok', 'pending']];
const V = VEH[0];
const NOW_Q = P[3], NOW_CARS = VEH.length;   // ไตรมาสที่กำลังทำ · รถของไตรมาส (ไม่มีขั้นนำรถออกแล้ว 2 พ.ย. 2569)
const VEH_KV = [['ทะเบียน', V[0]], ['ยี่ห้อ/รุ่น', V[1]], ['ประเภท', typeOf(V)], ['หน่วยงานเจ้าของยานพาหนะ', V[2]], ['เลขไมล์สะสม', '182,400 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,120 ชม.'], ['แผน', P[0]], ['แผนเดินทาง', 'ตรวจยานพาหนะ ขอนแก่น อุดรธานี ลำปาง · 03–07/11/2569']];
const PSTAT = { ok: ['พร้อม', 'Success'], short: ['ขาด', 'Error'], reserved: ['จองแล้ว', 'Info'] };
/* จำนวนตามแผน = ของไตรมาส 1 ในแผนตัวอย่าง (S4 ขึ้นไปทำรายไตรมาส) รถ 6 คัน · เปลี่ยนน้ำมัน 2 คัน · ไส้กรองเชื้อเพลิง 2 คัน · 2 พ.ย. 2569 ตัดการนำรถออกที่ S4 แล้ว */
const PARTS = [   // รายการ · รหัส · หมวด · จำนวนตามแผน · หน่วย · คงเหลือ · สถานะเมื่อจอง
  ['น้ำมันไฮดรอลิก ISO VG 46', 'OL-0011', 'น้ำมัน', '60', 'ลิตร', '420', 'ok'],
  ['ไส้กรองไฮดรอลิก', 'FL-0022', 'ไส้กรอง', '12', 'ชิ้น', '3', 'short'],
  ['ไส้กรองน้ำมันเครื่อง', 'FL-0031', 'ไส้กรอง', '12', 'ชิ้น', '40', 'ok'],
  ['ไส้กรองอากาศ', 'FL-0040', 'ไส้กรอง', '12', 'ชิ้น', '60', 'ok'],
  ['ไส้กรองเชื้อเพลิง', 'FL-0052', 'ไส้กรอง', '4', 'ชิ้น', '1', 'short']];
/* อะไหล่แบบงานซ่อม (22 ต.ค. 2569 "ปรับอะไหล่ให้สอดคล้องกับงานซ่อม"): คลัง 2 แบบ Smart Inventory / คลังสำรอง · ราคาต่อหน่วย (ค่าสมมติ) ·
   จำนวนตามแผนเกินคงเหลือ = ซื้อเพิ่มส่วนต่าง + เลือกผู้จัดซื้อ · ผู้จัดซื้อในบำรุงรักษา = Smart Inventory หรือ ผพจ. (S3) แทน "กบค." ของงานซ่อม — รอเคาะ */
const WH = ['Smart Inventory', 'Smart Inventory', 'Smart Inventory', 'คลังสำรอง', 'คลังสำรอง'];
const PRICE = [120, 680, 250, 420, 350];
const BUYER = ['Smart Inventory', 'ผพจ.'];
const BUYER_OF = { 1: 0, 4: 1 };   // อะไหล่ที่ขาด → ผู้จัดซื้อที่เลือกไว้ (ไส้กรองไฮดรอลิก = Smart Inventory · ไส้กรองเชื้อเพลิง = ผพจ.)
const baht = (n) => n.toLocaleString('en-US') + ' บาท';
const shortOf = (i) => Math.max(0, +PARTS[i][3] - +PARTS[i][5]);
const TST = { sent: ['ส่งแจ้งแล้ว', 'Info'], done: ['ดำเนินการแล้ว', 'Success'], review: ['รออนุมัติ', 'Warning'], approved: ['อนุมัติแล้ว', 'Success'], returned: ['ส่งกลับแก้ไข', 'Error'] };   // 3 พ.ย. 2569 แผนเดินทางต้องอนุมัติ (S7) · ชื่อตามสถานะแผน S2
/* 9 พ.ย. 2569 เจ้าของงาน "พนักงานสามารถเพิ่มได้ไม่จำกัด และ เป็น 1 คน 1 แถว เป็นชื่อ สกุล ตำแหน่ง เบอร์โทร" ⇒ แถวพนักงานที่เดินทาง: ชื่อ-สกุล (ค้นหา) · ตำแหน่ง (Readonly จากข้อมูลพนักงาน) · เบอร์โทร · ค่าสมมติ */
const STAFF_INFO = { 'นายวิชัย ทองดี': ['วศ.8', '081-472-1180'], 'นางสาวกนกวรรณ ใจมั่น': ['ชก.6', '089-221-4407'], 'นายสมชาย พูลสุข': ['ชก.5', '086-530-2291'] };
const TRIP = { place: 'จุดรวมงาน กฟฉ.1 ขอนแก่น', d1: '03/11/2569', d2: '07/11/2569', staff: ['นายวิชัย ทองดี', 'นางสาวกนกวรรณ ใจมั่น', 'นายสมชาย พูลสุข'], perDiem: '7,200', lodging: '9,600', travel: '4,850' };
/* S6 สถานที่รายคัน (เจ้าของงาน 2 พ.ย. 2569): ค่าเริ่มต้น = สำนักงานที่รถคันนั้นอยู่ (หน่วยงานเจ้าของรถ) แก้ได้ทีละคัน · TRIP.place ยังใช้กับ S9 S10 ที่ยังไม่ได้รีวิวรอบนี้
   3 พ.ย. 2569 เจ้าของงาน: ตัวอย่างรถในไตรมาส 10 คัน เฉพาะ S6 (S1 S2 S4 ยังเป็นไตรมาส 1 = 6 คันตามที่รีวิวแล้ว) · 1 ไตรมาสมีแผนเดินทางหลายใบ รถไม่ซ้ำกัน */
const TRIP_CARS = VEH.map(v => [v[0], v[1], v[2]]).concat([
  ['82-7720 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น'],
  ['80-3316 พะเยา', 'Hino FC + กระเช้า Tadano AT-100', 'กฟน.1 พะเยา'],
  ['81-6604 เชียงราย', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.1 เชียงราย'],
  ['80-4458 แพร่', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.2 แพร่']]);
const TRIP_KV = PLAN_KV.map(([k, v]) => k === 'ไตรมาส' ? [k, v + ' (' + TRIP_CARS.length + ' คัน)'] : [k, v]);
const TRIP_SEL = [0, 1, 4, 5], TRIP_LOCS = { 4: 'จุดรวมงาน กฟน.1 ลำปาง' };
const tripLoc = (i, locs) => (locs || {})[i] || 'สำนักงาน ' + TRIP_CARS[i][2];
/* วันดำเนินการรายคัน (6 พ.ย. 2569 รีวิว S6 "เพิ่ม คอลัมม์ "วันดำเนินการ" โดยเลือกได้ไม่เกิน range ของแผนที่กำหนดมาเท่านั้น" + "เลือกซ้ำวันกันได้ เลือกเป็นช่วงวัน" + "เพิ่มการเลือกวันดำเนิน จาก icon แก้ไข ได้ด้วย")
   ค่าเริ่มต้น = ช่วงวันเดินทางทั้งช่วง (แบบสถานที่บำรุงรักษา "ค่าเริ่มต้น สำนักงานที่ยานพาหนะอยู่") · แก้ใน popup ไอคอนแก้ไข · works = { ลำดับรถ: [ตั้งแต่, ถึง] } · หลายคันซ้ำวันกันได้ */
const tripWork = (i, t) => { const w = ((t && t.works) || {})[i]; return w ? w[0] + ' – ' + w[1] : t ? t.d1 + ' – ' + t.d2 : '—'; };
const tripRange = (t) => t && (t.vendor || t.hire) ? 'ช่วงวันทำงาน' : 'ช่วงวันเดินทาง';   // แผนจ้าง (S9) ใช้ช่วงวันทำงานแทนช่วงวันเดินทาง
const tripWorkCell = (i, t) => ({ text: tripWork(i, t), sub: ((t && t.works) || {})[i] ? 'แก้จาก' + tripRange(t) : 'ค่าเริ่มต้น ' + tripRange(t) });
const TRIP_WORKS = { 0: ['03/11/2569', '04/11/2569'], 1: ['03/11/2569', '04/11/2569'], 4: ['05/11/2569', '06/11/2569'] };   // 82-6789 กับ 82-1145 วันเดียวกัน (เลือกซ้ำวันได้) · ค่าสมมติ
/* อะไหล่ของแผนเดินทาง (6 พ.ย. 2569 รีวิว S6 "เพิ่ม section ของอะใหล่ ทริปนี้") — รวมจากยานพาหนะในใบ · ตาราง QPART_COLS ชุดเดียวกับทุกหน้า (R81) · รายการที่จำนวน 0 ไม่แสดง
   ค่าสมมติรายคันของไตรมาส 1 (9 พ.ย. 2569 ให้ผลรวมทุกใบเท่ากับอะไหล่ในไตรมาส 1 ของหน้าไตรมาส = PARTS): เปลี่ยนน้ำมัน 30 ลิตร คัน 0 และ 3 (ตรง TRIP_OIL) · ไส้กรอง 3 รายการ คันละ 2 ชิ้น คัน 0–5 · ไส้กรองเชื้อเพลิง 2 ชิ้น คัน 0 และ 4 */
const TRIP_OIL_CARS = [0, 3], TRIP_FILTER_CARS = [0, 1, 2, 3, 4, 5], TRIP_FUEL_CARS = [0, 4];
const tripParts = (sel) => PARTS.map((p, x) => { const n = (cars, q) => sel.filter(i => cars.indexOf(i) >= 0).length * q; return [p[0], p[1], p[2], String(x === 0 ? n(TRIP_OIL_CARS, +OIL_SPEC.litre) : x === 4 ? n(TRIP_FUEL_CARS, CAR_QTY[4]) : n(TRIP_FILTER_CARS, CAR_QTY[x])), p[4]]; }).filter(r => +r[3] > 0);
/* เบอร์ติดต่อรายคัน (3 พ.ย. 2569 · 6 พ.ย. 2569 เปลี่ยนเป็นผู้ดูแลยานพาหนะ ดูด้านล่าง) เจ้าของงาน "เพิ่มคอลัมน์เบอร์ติดต่อในหน้ารถที่เลือกแล้ว โดยเบอร์เป็นเบอร์ของเจ้าของรถ และตอนกดแก้ไข อยากเพิ่มการแก้ไขเบอร์โทร และสถานที่นัดได้")
   ค่าเริ่มต้น = เบอร์เจ้าของรถจากข้อมูลรถ · แก้ได้ทีละคันใน popup เดียวกับสถานที่ · คอลัมน์ตามหน้า MA Appointment ของ UI Release#2 ("เบอร์ติดต่อ") */
/* 6 พ.ย. 2569 เจ้าของงาน "เพิ่มชื่อผู้ดูแลยานพาหนะ ตรงเบอร์โทร ดึงจากผู้ควบคุมรถ" + "ตรงป๊อบอัพ เลยต้องมีให้แก้ชื่อโดย prefill ข้อมูลมาให้"
   ⇒ คอลัมน์ "ผู้ดูแลยานพาหนะ" = ชื่อ (บรรทัดบน) + เบอร์ (บรรทัดรอง) ค่าเริ่มต้นจากผู้ควบคุมรถของรถคันนั้น (BE controller ของ /api/vehicles · คำ "ผู้ดูแลยานพาหนะ" ตามแท็บข้อมูลรถของ UI Release#2)
   OWNER_PH = เบอร์ผู้ควบคุมรถ (ชื่อตัวแปรเดิม) · CTRL_NAME = ชื่อผู้ควบคุมรถ (ค่าสมมติ) · ค่าที่แก้ = { ลำดับรถ: [ชื่อ, เบอร์] } */
const OWNER_PH = ['081-472-3365', '081-472-3365', '054-710-224', '053-241-560', '089-635-1172', '042-221-908', '043-246-118', '054-411-737', '053-711-402', '054-511-226'];
const CTRL_NAME = ['นายสมชาย แก้วมณี', 'นายสมชาย แก้วมณี', 'นายวีระ ทองคำ', 'นายประยุทธ ศรีวงศ์', 'นายณรงค์ บุญมา', 'นายสุรชัย พลอยงาม', 'นายอำนาจ ไชยสิทธิ์', 'นายบุญเลิศ คำแสน', 'นายชาตรี อินทร์แก้ว', 'นายพิชิต ปัญญาดี'];
const TRIP_PHONES = { 4: ['นายอนุชา ศรีสุข', '086-552-1904'] }, TRIP_V_LOCS = { 6: 'ศูนย์บริการผู้รับจ้าง สาขาขอนแก่น' }, TRIP_V_PHONES = { 6: ['นายธนพล วงศ์ใหญ่', '095-118-4420'] };
const tripPhone = (i, ph) => ((ph || {})[i] || [])[1] || OWNER_PH[i];
const tripCtrl = (i, ph) => ((ph || {})[i] || [])[0] || CTRL_NAME[i];
const tripPhoneCell = (i, ph) => ({ text: tripPhone(i, ph), sub: tripCtrl(i, ph) });   // 9 พ.ย. 2569 เจ้าของงาน "E4 ตรงติดต่อ อยากให้ เพิ่มชื่อผู้ดูแลรถ ตรงด้านล่างเบอร์โทร ด้วย และอยากให้แก้จุดที่เกี่ยวข้องด้วย" ⇒ คอลัมน์ "เบอร์ติดต่อ" เบอร์บรรทัดบน ชื่อผู้ดูแลยานพาหนะบรรทัดรอง (เดิม 6 พ.ย. ชื่อบน เบอร์ล่าง หัว "ผู้ดูแลยานพาหนะ")
/* ตารางยานพาหนะของแผนเดินทาง ชุดเดียวทุกหน้า (R82 · 6 พ.ย. 2569 เจ้าของงาน "ถ้าเพิ่ม คอลัมน์ ก็ส่งผลกระทบกับ หน้าอื่นๆที่เป็นหน้าที่เหมือนกันด้วย ตอน export ก็เกี่ยวข้องด้วย" · แบบ QPART_COLS R81)
   ใช้ที่ ฟอร์มแผนเดินทาง S6 S9 (+ ไอคอนแก้ไข ลบ) · ตรวจสอบแผนเดินทาง S7 · แผนเดินทางดูอย่างเดียว S8 · รายละเอียดแผนเดินทาง S10 S12 (หน่วยงานเป็นบรรทัดรองของทะเบียน + สถานะงาน + ปุ่ม … เพราะ Table ของไลบรารี 8 คอลัมน์)
   · หน้าไตรมาส (ไม่มีสถานที่บำรุงรักษา + คอลัมน์แผนเดินทาง) · ไฟล์ PDF และ Excel ที่ส่งออก · เพิ่ม ลด หรือเปลี่ยนชื่อคอลัมน์ที่นี่ที่เดียว ช่องของแต่ละคอลัมน์อยู่ใน tripVCells (จับคู่ด้วยชื่อหัวคอลัมน์)
   ประเภทยานพาหนะต่อจากทะเบียน แบบ Vehicle list ของ UI Release#2 หน้า 5.2 Vehicle Management ("เลขทะเบียน / ยี่ห้อ / รุ่น" แล้ว "ประเภทยานพาหนะ") · component Table ของไฟล์ Component */
const UNIT_COL = 'หน่วยงานเจ้าของยานพาหนะ';
const TRIP_V_COLS = [['ทะเบียน', 150, 'Lead text'], ['ประเภทยานพาหนะ', 120], ['ยี่ห้อ/รุ่น', 0], [UNIT_COL, 140], ['เบอร์ติดต่อ', 160], ['สถานที่บำรุงรักษา', 190], ['วันดำเนินการ', 180]];
/* o.unitSub = หน่วยงานไปเป็นบรรทัดรองของทะเบียน · o.drop = [ชื่อคอลัมน์ที่ไม่แสดง] · o.fill = ทุกคอลัมน์ยืดเท่ากัน (ไฟล์ PDF A4) */
const tripVCols = (o) => { o = o || {}; return TRIP_V_COLS.filter(c => (o.drop || []).indexOf(c[0]) < 0 && !(o.unitSub && c[0] === UNIT_COL)).map(c => o.fill ? [c[0], 0, c[2]] : c); };
/* t = { d1, d2, works, locs, phones, vendor | hire } ใบแผนเดินทาง หรือค่าในฟอร์ม · ยังไม่มีช่วงวัน (ฟอร์มยังไม่เลือกวันที่) = วันดำเนินการ "—" */
const tripVCells = (i, t, o) => {
  o = o || {};
  const c = TRIP_CARS[i], locs = t.locs || {};
  const cell = { 'ทะเบียน': o.unitSub ? { text: c[0], sub: c[2] } : c[0], 'ประเภทยานพาหนะ': typeOf(c), 'ยี่ห้อ/รุ่น': c[1], [UNIT_COL]: c[2], 'เบอร์ติดต่อ': tripPhoneCell(i, t.phones),
    'สถานที่บำรุงรักษา': { text: tripLoc(i, locs), sub: locs[i] ? 'แก้จากสำนักงานเจ้าของยานพาหนะ' : 'ค่าเริ่มต้น สำนักงานที่ยานพาหนะอยู่' }, 'วันดำเนินการ': t.d1 ? tripWorkCell(i, t) : '—' };
  return tripVCols(o).map(col => cell[col[0]]);
};
const TRIP_ALL = TRIP_CARS.map((_, i) => i), TRIP_REST = TRIP_ALL.filter(i => TRIP_SEL.indexOf(i) < 0);
const TRIP_OUT = 5, TRIP_KEEP = TRIP_SEL.filter(i => i !== TRIP_OUT);   // 5 พ.ย. 2569 เอารถออกจากแผนเดินทาง (soft delete): 82-3302 อุดรธานี ออกแล้วกลับไปเลือกได้   // ใบแรกใช้ TRIP_SEL · ใบถัดไปเลือกได้เฉพาะที่เหลือ
/* ชื่อแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "ตอนสร้างแผนการเดินทางอยากให้ตั้งชื่อแผนได้ด้วย") — ผู้ใช้ตั้งเอง แสดงแทน "แผนเดินทาง k" ในหน้าแผนเดินทาง */
const TRIP_1 = { name: 'ตรวจยานพาหนะ ขอนแก่น อุดรธานี ลำปาง', sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, works: TRIP_WORKS, d1: TRIP.d1, d2: TRIP.d2, st: 'review' }, TRIP_2 = { name: 'ตรวจยานพาหนะ น่าน เชียงใหม่ เชียงราย', sel: TRIP_REST, locs: {}, phones: {}, d1: '17/11/2569', d2: '21/11/2569', st: 'review' };
const tripAs = (t, st) => Object.assign({}, t, { st });
const TAKEN_1 = Object.fromEntries(TRIP_SEL.map(i => [i, TRIP_1.name]));   // รถที่อยู่ในแผนเดินทางใบแรกแล้ว → popup ใบถัดไปแสดงแต่เลือกไม่ได้ (5 พ.ย. 2569)
/* S9 แผนเดินทางจ้างดำเนินการ (3 พ.ย. 2569 เจ้าของงาน "ตอนที่ทำ e2 อยากให้มีการเลือกว่า กบค ดำเนินการเอง หรือ จ้างดำเนินการ และพอเลือกจ้างดำเนินการ ก็มีให้เลือก vendor list")
   ฟอร์มเดียวกับ S6 · จ้าง = ผู้รับจ้าง (vendor list) + เลขที่สัญญา/ใบสั่งจ้าง + รถ + สถานที่รายคัน + ช่วงวันทำงาน · ไม่มีพนักงาน กบค. และค่าใช้จ่าย */
const VENDORS = [['บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด', 'กระเช้าแก้ไฟ · กระเช้าฮอทไลน์'], ['หจก. ช่างกลภาคอีสาน', 'กระเช้าแก้ไฟ'], ['บริษัท เครนเทค เอ็นจิเนียริ่ง จำกัด', 'รถพ่วงฉีดน้ำ'], ['หจก. ล้านนาไฮดรอลิก', 'กระเช้าแก้ไฟ · รถพ่วงฉีดน้ำ']];
const TRIP_V = { name: 'จ้างบำรุงรักษา น่าน เชียงใหม่ เชียงราย', vendor: VENDORS[0][0], contract: 'สจ.69-0142', sel: TRIP_REST, locs: TRIP_V_LOCS, phones: TRIP_V_PHONES, d1: '17/11/2569', d2: '21/11/2569', st: 'review' };
const tripBy = (t) => t.vendor || 'ดำเนินการเอง';   // 6 พ.ย. 2569 เจ้าของงาน "เปลี่ยนคำ กบค ดำเนินการเอง เป็น ดำเนินการเอง"
const TRIP_RETURN = 'ช่วงวันที่ 03 ถึง 07/11/2569 ตรงกับแผนดับไฟของ กฟฉ.1 ขอนแก่น กรุณาเลื่อนเป็นสัปดาห์ถัดไป';
const WORK = [   // รายการงาน · อะไหล่ · ตามแผน · ใช้จริง · หน่วย
  ['เปลี่ยนน้ำมันไฮดรอลิก', 'น้ำมันไฮดรอลิก ISO VG 46', '30', '30', 'ลิตร'],
  ['เปลี่ยนไส้กรองไฮดรอลิก', 'ไส้กรองไฮดรอลิก', '2', '2', 'ชิ้น'],
  ['เปลี่ยนไส้กรองน้ำมันเครื่อง', 'ไส้กรองน้ำมันเครื่อง', '2', '2', 'ชิ้น'],
  ['เปลี่ยนไส้กรองอากาศ', 'ไส้กรองอากาศ', '2', '1', 'ชิ้น']];
const BEFORE = ['รูปยานพาหนะ + ทะเบียน', 'อะไหล่ใหม่'];
const AFTER = ['รูปยานพาหนะ + ทะเบียน', 'อะไหล่เก่า', 'อะไหล่ใหม่ที่เหลือ', 'จุดที่บำรุงรักษา (อะไหล่ใหม่)'];
/* S10 สถานะงานรายคัน (3 พ.ย. 2569 เจ้าของงานเลือก "ทำทีละขั้น") ตามชื่อสถานะงานของหน้า RP & MA Job ของ UI Release#2 (นัดหมายแล้ว → อยู่ระหว่างซ่อม → เสร็จสิ้น / ยกเลิก) */
const WSTAT = { todo: ['ยังไม่เริ่ม', 'Gray'], doing: ['อยู่ระหว่างบำรุงรักษา', 'Warning'], done: ['เสร็จสิ้น', 'Success'], cannot: ['บำรุงรักษาไม่ได้', 'Error'],
  /* S23 มุมผู้รับจ้าง (เอากลับ 10 พ.ย. 2569 เจ้าของงาน _"scen s23 อยากปรับ ui ให้เหมือนกับ s10 แต่ว่า เงื่อนไขการมองเห็น เมนูต่างๆ ยังเป็นเหมือนเดิม"_ · R87)
     สถานะระหว่างทางของแผนจ้างชุดเดิมของ S23 (3 พ.ย. 2569 รอบ 2 เจ้าของงาน "เห็นสถานะ ว่ารถคันนั้น ดำเนินการบำรุงรักษาแล้ว ปุ่มจะแสดงให้ส่งตรวจงาน") · สีชุดเดิม: ยังไม่ส่ง Info · รอตรวจรับ Warning · ส่งกลับแก้ไข Error
     (4 พ.ย. 2569 เคยตัดพร้อม S11 · S11 ยังตัดอยู่ ผู้ตรวจรับงานที่ผู้รับจ้างส่งยังไม่เคาะ) · หน่วยงานปิดงานแทนผู้รับจ้างที่ S10 ยังใช้ 4 สถานะแรกตามเดิม */
  worked: ['ดำเนินการบำรุงรักษาแล้ว', 'Info'], reported: ['แจ้งบำรุงรักษาไม่ได้', 'Info'], wait: ['รอตรวจรับ', 'Warning'], returned: ['ส่งกลับแก้ไข', 'Error'] };
const ACC = { wait: ['รอรับทราบ', 'Warning'], ok: ['รับทราบแล้ว', 'Success'] };   // S13 ผู้ดูแลยานพาหนะรับทราบผลรายคัน (10 พ.ย. 2569 เดิม รอหน่วยงานยอมรับ / หน่วยงานยอมรับแล้ว)
const pdf = (name, size) => ({ name, size: size || '1.2 MB' });
const jpg = (name) => ({ name: name + '.jpg', size: '2.4 MB' });

/* ---------- ตัวช่วยเฉพาะเรื่อง ---------- */
/* หน้า Detail (หัว "หมายเลขแผน …") ใช้ Section label ตาม R5/R11 · หน้า Create/Edit ใช้ Section header ตาม R3 */
async function detail(name, o) {
  const { scr, page } = await shell(name, { title: 'หมายเลขแผน ' + P[0], back: true, crumbs: ['แผน ' + P[0]].concat(o.crumbs || []), badge: PST[o.status || 'active'], actions: o.actions });
  return { scr, page };
}
/* ทางเลือก 2 ทาง = Section header + Radio text card (ตามแบบ RadioSelection / AdditionalPartRequest ของงานซ่อม) */
async function radioPick(title, options, sel, o) {
  o = o || {};
  const r = MOB ? col('Radio', [], 12) : row('Radio', [], { gap: 16 });
  options.forEach((t, i) => {
    const sub = Array.isArray(t) ? t[1] : '';   // [ข้อความ, บรรทัดรอง] แบบการ์ดตอบรับ/ปฏิเสธของ Overhaul R29
    const c = inst('Radio text card', { State: o.disabled ? 'Disabled' : 'Default', Selected: i === sel ? 'True' : 'False' }, { Text: Array.isArray(t) ? t[0] : t, Supporting: !!sub, 'Supporting text': sub });
    if (MOB) add(r, c, 'h');
    else {   // การ์ดในแถวสูงเท่ากัน และบรรทัดรองกว้างเต็มการ์ด (เจ้าของงาน 2 พ.ย. 2569 "อยากให้ขนาดกล่องเท่ากัน")
      r.appendChild(c); c.layoutGrow = 1;
      try { c.layoutSizingVertical = 'FILL'; } catch (e) { /* ไฟล์เก่าไม่รองรับ */ }
    }
    // 3 พ.ย. 2569 ภาพจากไฟล์จริง: บรรทัดรองตัดคำกลางคำ ("ผู้รับจ / ้าง") เพราะกรอบ Content (208) และ Text and supporting text (176) กว้างตายตัวตาม component ⇒ ยืดกรอบก่อน แล้วค่อยยืดข้อความ
    c.findAll(n => n.type === 'FRAME' && (n.name === 'Content' || n.name === 'Text and supporting text')).forEach(f => { try { f.layoutSizingHorizontal = 'FILL'; } catch (e) { /* ชั้นที่ไม่อยู่ใน auto layout */ } });
    c.findAll(n => n.type === 'TEXT').forEach(t => { try { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; } catch (e) { /* ชั้นที่ไม่อยู่ใน auto layout */ } });
  });
  return col('Section', [await (o.label ? sectionLabel(title) : section(title)), r], 16);
}
/* radio เล็กพร้อมป้าย = Horizontal radio groups (ไฟล์ Component หน้า Radio button) วางในแถวฟอร์มคู่กับช่องกรอก
   ตาม UI Release#2 หน้า 5.1 Rental Contract Management ("ประเภทสัญญา" เช่า/ซื้อ คู่ Input dropdown) · สูง 72 เท่า Text input · ใช้เมื่อ 2–4 ตัวเลือกป้ายสั้น ไม่ต้องมีคำอธิบาย (UX-1)
   options ไม่เกิน 4 · sel = ลำดับที่เลือก */
function radioGroup(label, options, sel, error) {   // error = ข้อความใต้กลุ่ม (Helper) เมื่อยังไม่เลือก
  const p = { 'Label text': label, Label: true, 'Info icon': false, 'Leading icon': false, Helper: !!error, 'Helper text': error || '', 'Radio 3': options.length > 2, 'Radio 4': options.length > 3 };
  options.forEach((t, i) => { p['Radio text ' + (i + 1)] = t; });
  const g = inst('Horizontal radio groups', {}, p);
  const ct = find(g, 'Container');
  (ct ? ct.children : []).filter(c => c.visible !== false).forEach((c, i) => { const rb = c.type === 'INSTANCE' && c.name === 'Radio button' ? c : find(c, 'Radio button'); if (rb) setProps(rb, { Selected: i === sel ? 'True' : 'False' }); });
  return g;
}
/* เลือกรถหลายคัน (เจ้าของงานสั่ง 22 ต.ค. 2569 "ใช้แบบ Overhaul ช่องค้นหากับชิป") = แบบ R24 ของ Overhaul:
   Input dropdown ช่องเดียว "เลือกรถ" พิมพ์ค้นทะเบียน/จังหวัด → Dropdown list แถวละทะเบียน (คันที่เลือกแล้ว State=Selected) → รถที่เลือกเป็นชิป Badge outline with remove icon ใต้ช่อง
   ไม่ใช้ dual list แล้ว · ใช้ทั้ง desktop และ mobile (mobile ช่องเต็มแถว) · งานซ่อมเลือกรถคันเดียวด้วยช่องค้นทะเบียนแบบเดียวกัน (Dropdown/Search PEA with request) */
async function carPick(title, cands, sel, o) {
  o = o || {};
  const right = cands.filter((_, i) => sel.indexOf(i) >= 0);
  const f = dropdown('เลือกยานพาหนะ', o.query || '', { placeholder: 'ค้นหาทะเบียน, จังหวัด', lead: 'search-24-300-round', state: o.open ? 'Focused' : undefined, error: o.error || '' });
  let chips = null;
  if (right.length && o.chips !== false) {   // o.chips=false = ฟอร์มสร้างแผน รถที่เลือกแสดงในตารางด้านล่างแทน (เจ้าของงาน 2 พ.ย. 2569)
    chips = frame('Selected cars', 'HORIZONTAL', { gap: 8 });
    try { chips.layoutWrap = 'WRAP'; chips.counterAxisSpacing = 8; } catch (e) { /* ไฟล์เก่าไม่มี wrap */ }
    right.forEach(c => chips.appendChild(inst('Badge outline with remove icon', { Color: 'Brand' }, { Text: c[0] })));
  }
  const sec = col('Section', [title ? await section(title, { badge: right.length || null }) : null, MOB ? f : row('Row', [f, frame('Spacer', 'VERTICAL')]), chips], 16);
  const open = (scr) => {   // รายการที่ตรงคำค้น · คันที่เลือกแล้วติ๊ก Selected · แถวเดียวไม่มีบรรทัดรอง
    if (!o.open) return;
    const list = cands.map((c, i) => [c, i]).filter(([c]) => (!o.only || o.only(c)) && (!o.query || c[0].indexOf(o.query) >= 0));
    comboAt(scr, f.findOne(n => n.name === 'Container') || f, list.map(([c, i]) => [c[0], o.note ? o.note(i) : '', sel.indexOf(i) >= 0]));
  };
  return { sec, open };
}
/* กล่องข้อมูลรถ — ยืม VehicleAndReporterInfo (หน้า รายละเอียดงานซ่อม): Section label + Content item row แถวละ 4 · ไม่มี/mobile → Section label + กล่องแสดงข้อมูล (R12) */
async function vehicleInfo(pairs, title) {
  title = title || 'ข้อมูลยานพาหนะ';
  if (!MOB && has('VehicleAndReporterInfo')) {
    const v = inst('VehicleAndReporterInfo'); v.name = 'VehicleAndReporterInfo';
    const sl = find(v, 'Section label'); if (sl) setProps(sl, { Title: title, Supporting: false, 'Info icon': false, Actions: false, 'More actions': false });
    v.findAll(n => n.type === 'INSTANCE' && n.name === 'BudgetSource').forEach(b => { b.visible = false; });
    const rows = v.findAll(n => n.type === 'INSTANCE' && n.name === 'Content item row' && !findInstanceAncestor(n).name.startsWith('BudgetSource'));
    let k = 0;
    for (const r of rows) {
      const items = r.children.filter(c => c.name === '_Content item base');
      const slice = pairs.slice(k, k + items.length);
      if (!slice.length) { r.visible = false; continue; }
      items.forEach((it, j) => { if (j < slice.length) { setProps(it, { Type: 'Text with label' }); setProps(it, { Label: slice[j][0], Text: slice[j][1], Supporting: false, 'Leading icon': false }); } });
      setProps(r, { 'Item 2': slice.length > 1, 'Item 3': slice.length > 2, 'Item 4': slice.length > 3 });
      k += items.length;
    }
    return v;
  }
  return col('Section', [await sectionLabel(title), kv(pairs)], 16);
}
/* แถวภาพ — ยืม IncidentPhotoGallery (หน้า รายละเอียดงานซ่อม): Section label + Images sm × 4 + ปุ่มเลื่อน · ไม่มี/mobile → Section label + Images จากไลบรารี */
async function photoGallery(title, count) {
  if (!MOB && has('IncidentPhotoGallery')) {
    const g = inst('IncidentPhotoGallery'); g.name = 'IncidentPhotoGallery';
    const sl = find(g, 'Section label'); if (sl) setProps(sl, { Title: title, Supporting: false, 'Info icon': false, Actions: false, 'More actions': false });
    g.findAll(n => n.type === 'INSTANCE' && n.name === 'Images').forEach((im, i) => { if (i >= count) im.visible = false; else setProps(im, { Buttons: false, 'Indicator pagination': false }); });
    const ib = find(g, 'Icon button'); if (ib) ib.visible = count > 4;
    return g;
  }
  const r = frame('Gallery', 'HORIZONTAL', { gap: 16 });
  for (let i = 0; i < Math.min(count, MOB ? 2 : 4); i++) r.appendChild(inst('Images', { Size: 'sm', Type: 'Image' }, { Buttons: false, 'Indicator pagination': false }));
  return col('Section', [await sectionLabel(title), r], 16);
}
/* ช่องอัปโหลดภาพ 1 คอลัมน์ (กติกาอัปโหลด) — ช่องละภาพตามรายการบนบอร์ด */
async function photoUploads(list, filled, errors) {
  const nodes = [];
  for (const [i, label] of list.entries()) nodes.push(await upload(label, filled ? [jpg(label.replace(/\s|\+|\(|\)/g, '-') + '-' + (i + 1))] : [], { hint: 'JPG, PNG · 1 ภาพ', error: errors ? 'กรุณาอัปโหลด' + label : '' }));
  return nodes;
}
const partRow = (p, i, o) => [p[0], p[1], p[2], p[3], p[4], p[5], { pill: o && o.result ? PSTAT[o.result === 'short' ? p[6] : 'ok'] : [' ', 'Gray'] }];
const PART_COLS = [['รายการอะไหล่', 0, 'Lead text', 'Swap'], ['รหัส', 100], ['หมวด', 110], ['ตามแผน', 100], ['หน่วย', 90], ['คงเหลือในคลัง', 130], ['สถานะ', 140, 'Badge']];
/* ใส่ข้อความการ์ดอะไหล่ (Spare Part Card Item) — จับชั้นข้อความจากข้อความตัวอย่างของ component ไม่ใช้ลำดับ (การ์ดในแผง Filled วางชั้นต่างจากตัวแม่):
   รหัส · "1 หน่วย" · "| 680 บาท" (ราคาต่อหน่วย) · "<คลัง> : คงเหลือ n" · "| ต้องจัดซื้อ n" · ราคารวมของการ์ด (Text "3,400 บาท") */
async function fillPartCard(c, i, o) {
  o = o || {};
  const part = PARTS[i], unit = part[4];
  const own = (n) => !findInstanceAncestorIn(n, c);
  const sup = c.findAll(n => n.type === 'TEXT' && n.name === 'Supporting text' && own(n));
  const orig = sup.map(t => t.characters || '');
  await text(c, 'Name', part[0]);
  if (sup[0]) await text(c, sup[0], part[1]);
  for (const [k, t] of sup.entries()) {
    const was = orig[k];
    if (k === 0 || was === '·' || was === '|') continue;
    if (/คงเหลือ/.test(was)) await text(c, t, WH[i] + ' : คงเหลือ ' + o.stock + ' ' + unit);
    else if (/^(ต้องจัดซื้อ|ซื้อเพิ่ม)/.test(was)) { if (o.buy > 0) await text(c, t, 'ต้องจัดซื้อ ' + o.buy + ' ' + unit); }   // แถวนี้ซ่อนด้วย property จัดซื้อเพิ่ม เมื่อไม่ขาด
    else if (/หน่วย$/.test(was)) await text(c, t, '1 ' + unit);
    else if (/บาท$/.test(was)) await text(c, t, baht(PRICE[i]));
  }
  if (o.qty != null) {
    const line = c.findAll(n => n.type === 'TEXT' && n.name === 'Text' && own(n))[0];
    if (line) await text(c, line, baht(o.qty * PRICE[i]));
  }
}
/* เบิก/จองอะไหล่ — ยืม PartRequestStepPanel (ขั้นเบิกอะไหล่ของงานซ่อม = PartsInventoryPanel "คลังอะไหล่" + RequestedPartsPanel "อะไหล่ที่ต้องการใช้งาน")
   ตามแบบงานซ่อม (22 ต.ค. 2569): การ์ดคลังบอกคลังและคงเหลือ · การ์ดที่เลือกมีจำนวน + ราคารวม · ถ้าเกินคงเหลือ = "| ซื้อเพิ่ม n" + Helper "จำนวนที่เกินยอดในคลัง…" + เลือกผู้จัดซื้อ (Radio text card)
   o.inv = 'Default' | 'Not Found' | 'API error' (สถานะของ PartsInventoryPanel) · mobile / ไฟล์ที่ไม่มี component → ตาราง Table ของไลบรารี */
async function partsPanel(o) {
  o = o || {};
  const picked = o.picked || [];
  const qty = (i) => o.car ? CAR_QTY[i] : +PARTS[i][3];   // o.car = หน้าอะไหล่รายคัน S21: จำนวนต่อคัน ยังไม่เบิก จึงไม่มีซื้อเพิ่ม · ไม่มีป้าย "แนะนำ" กบค. เลือกเอง
  if (!MOB && has('PartRequestStepPanel')) {
    const p = inst('PartRequestStepPanel'); p.name = 'PartRequestStepPanel';
    const inv = find(p, 'PartsInventoryPanel'), req = find(p, 'RequestedPartsPanel');
    if (inv) {
      setProps(inv, { State: o.inv || 'Default' });
      const sh = find(inv, 'Section header');
      if (sh) { setProps(sh, { Title: 'คลังอะไหล่', 'Supporting text': true, 'More actions': false, Badge: false, Actions: false }); await text(sh, 'Supporting text', 'อะไหล่ทั้งหมดจาก Smart Inventory และ คลังสำรอง'); }
      const ti = find(inv, 'Text input'); if (ti) setProps(ti, { Text: o.query || 'ค้นหาชื่อหรือรหัสอะไหล่', Label: false, Helper: false, 'Info icon': false });
      const cards = inv.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
      for (const [i, c] of cards.entries()) {
        const part = PARTS[i];
        if (!part) { c.visible = false; continue; }
        setProps(c, { Suggestion: false, Select: picked.indexOf(i) >= 0, Add: picked.indexOf(i) < 0, 'จัดซื้อเพิ่ม': false, 'เลือกผู้จัดซื้อ': false });
        await fillPartCard(c, i, { stock: part[5] });
      }
    }
    if (req) {
      setProps(req, { State: picked.length ? 'Filled' : 'Default' });
      const sh = find(req, 'Section header');
      if (sh) { setProps(sh, { Title: o.car ? 'อะไหล่ของยานพาหนะคันนี้' : 'อะไหล่ที่ต้องใช้ใน' + NOW_Q, 'Supporting text': true, 'More actions': false, Badge: picked.length > 0, Actions: false }); await text(sh, 'Supporting text', o.car ? 'เลือกจากคลังหรือระบุเพิ่มเอง แก้จำนวนหรือเอาออกได้' : 'รวมจากยานพาหนะ ' + NOW_CARS + ' คันของไตรมาสนี้ · เบิก/จองผ่านระบบจองอะไหล่'); const b = find(sh, 'Badge outline'); if (b && picked.length) setProps(b, { Text: String(picked.length) }); }
      const cards = req.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
      // แผงมีการ์ดรายการที่เลือกแค่ 3 ช่อง (instance เพิ่มลูกไม่ได้) ⇒ เรียงรายการที่ต้องจัดซื้อขึ้นก่อนให้เห็น · ตัวเลข Badge และยอดรวมนับทุกรายการ
      const order = o.car ? picked.filter(i => i === 4).concat(picked.filter(i => i === 0), picked.filter(i => i !== 4 && i !== 0)) : picked.slice().sort((a, b) => (shortOf(b) > 0) - (shortOf(a) > 0));
      let k = 0;
      for (const c of cards) {
        const vp = (c.variantProperties || {})['อะไหล่'];
        if (vp === 'เพิ่มอะไหล่') {   // การ์ด "รายการเพิ่มเติม" ของงานซ่อม = เพิ่มอะไหล่แบบ manual (R36) ชื่ออะไหล่ · รหัสอะไหล่ (ถ้ามี) · ราคาต่อหน่วย · จำนวน
          if (!o.manual) { c.visible = false; continue; }
          const m = o.manual.filled ? MANUAL : {};
          [['ชื่ออะไหล่', m.name, 'ระบุชื่ออะไหล่', false], ['รหัสอะไหล่', m.code, 'ระบุรหัสอะไหล่', true], ['ราคาต่อหน่วย', m.price, '0', false]].forEach(([label, val, ph, opt], j) => {
            const ti = c.findAll(n => n.type === 'INSTANCE' && n.name === 'Text input')[j];
            if (ti) setProps(ti, { State: val ? 'Filled' : 'Default', 'Label text': label, Text: val || ph, Optional: opt, Helper: false, 'Info icon': false });
          });
          const num = find(c, 'Number input'); if (num) setProps(num, { Number: String(m.qty || 1), Label: false, Optional: false, 'Info icon': false, Helper: false });
          const line = c.findAll(n => n.type === 'TEXT' && n.name === 'Text')[0]; if (line) await text(c, line, baht(m.qty ? m.qty * +m.price : 0));
          continue;
        }
        const i = order[k++], part = PARTS[i];
        if (!part) { c.visible = false; continue; }
        const buy = o.car || o.result === 'ok' ? 0 : shortOf(i);   // อะไหล่พร้อมครบ = ของเข้าคลังแล้ว ไม่มีซื้อเพิ่ม
        const stock = o.result === 'ok' ? Math.max(+part[5], +part[3]) : part[5];
        setProps(c, { Suggestion: false, 'จัดซื้อเพิ่ม': buy > 0, 'เลือกผู้จัดซื้อ': buy > 0 });
        await fillPartCard(c, i, { stock, buy, qty: qty(i) });
        const num = find(c, 'Number input');
        if (num) setProps(num, { Number: String(qty(i)), Label: false, Optional: false, 'Info icon': false, Helper: buy > 0, 'Helper text': buy > 0 ? 'จำนวนที่เกินยอดในคลัง จะถูกตั้งเป็นรายการจัดซื้อให้อัตโนมัติ' : '' });
        if (buy > 0) {
          const il = find(c, 'Input label'); if (il) setProps(il, { Optional: false, 'Info icon': false, button: false });   // ป้าย "เลือกผู้จัดซื้ออะไหล่เพิ่ม" ไม่บังคับเลือก (มีค่าเริ่มต้น) · ไม่มีปุ่มข้างป้าย
          c.findAll(n => n.type === 'INSTANCE' && n.name === 'Radio text card').forEach((r, j) => setProps(r, { Text: BUYER[j] || '', Supporting: false, Selected: (BUYER_OF[i] || 0) === j ? 'True' : 'False' }));
        }
      }
      const addBtn = find(req, 'Secondary button'); if (addBtn) setProps(addBtn, { Text: 'ระบุอะไหล่เพิ่มเติม' });
      // กล่องรวมค่าอะไหล่ท้ายแผง (แบบงานซ่อม): เบิกจากคลัง · ต้องจัดซื้อ · รวมทั้งหมด — คิดจากทุกรายการที่เลือก
      const cost = find(req, 'Cost Container');
      if (cost && picked.length) {
        let take = o.manual && o.manual.filled ? MANUAL.qty * +MANUAL.price : 0, buyAmt = 0;
        picked.forEach(i => { const q = qty(i), st = o.car || o.result === 'ok' ? q : Math.min(q, +PARTS[i][5]); take += st * PRICE[i]; buyAmt += (q - st) * PRICE[i]; });
        const csh = find(cost, 'Section header'); if (csh) setProps(csh, { Title: 'รวมค่าอะไหล่', 'Supporting text': false, 'More actions': false, Badge: false, Actions: false });
        const infos = cost.findAll(n => n.type === 'FRAME' && n.name === 'Purchase Info');
        const vals = [['เบิกจากคลัง', take], ['ต้องจัดซื้อ', buyAmt]];
        for (const [j, f] of infos.entries()) { const ts = f.children.filter(x => x.type === 'TEXT'); if (vals[j] && ts[1]) { await text(f, ts[0], vals[j][0]); await text(f, ts[1], baht(vals[j][1])); } }
        const tot = find(cost, 'Total Cost'); const tt = tot ? tot.children.filter(x => x.type === 'TEXT') : [];
        if (tt[1]) await text(tot, tt[1], baht(take + buyAmt));
      }
    }
    return p;
  }
  if (o.car) {
    const extra = o.manual && o.manual.filled ? [MANUAL_ROW] : [];
    const rows = picked.map(i => [PARTS[i][0], PARTS[i][1], PARTS[i][2], String(CAR_QTY[i]), PARTS[i][4]]).concat(extra);
    const sec = col('Section', [await section('อะไหล่ของยานพาหนะคันนี้', { badge: rows.length || null, buttons: [{ kind: 'Secondary button', text: 'ระบุอะไหล่เพิ่มเติม', icon: 'add-24-300-round' }] })], 16);
    add(sec, rows.length ? await tblShort(PART_COLS.slice(0, 5), rows) : await noParts('เลือกอะไหล่จากคลัง หรือระบุอะไหล่เพิ่มเติมเอง'), 'h');
    return sec;
  }
  const head = 'รายการอะไหล่ที่ต้องใช้ใน' + NOW_Q;
  if (!picked.length) return col('Section', [await section(head), await noParts('ไตรมาสนี้ยังไม่มีอะไหล่ในแผน เลือกจากคลังเมื่อต้องการเบิก')], 16);
  return col('Section', [await section(head, { badge: PARTS.length }), await tblShort(PART_COLS, PARTS.map((p, i) => partRow(p, i, o)))], 16);
}
/* ข้อความที่อยู่ใน instance ซ้อน (เช่น Pill หรือปุ่ม) ไม่ใช่ข้อความของการ์ดเอง */
function findInstanceAncestorIn(n, stop) { let q = n.parent; while (q && q !== stop) { if (q.type === 'INSTANCE') return q; q = q.parent; } return null; }
/* สรุปรายการเบิก/จอง — ยืม SummaryRequestedParts (modal สรุปรายการอะไหล่ของงานซ่อม) · ไม่มี/mobile → Modal ยืนยัน */
async function partsSummary(scr, o) {
  if (!MOB && has('SummaryRequestedParts')) {
    const m = inst('SummaryRequestedParts'); overlay(scr, m, 0, 0); m.name = 'SummaryRequestedParts';
    const hd = find(m, 'Modal header'); if (hd) setProps(hd, { Title: 'สรุปรายการเบิก/จองอะไหล่', Supporting: false, 'Back icon': false, 'Featured icon': false });
    const labels = m.findAll(n => n.type === 'INSTANCE' && n.name === 'Section label');
    if (labels[0]) setProps(labels[0], { Title: 'เบิกจากคลัง Smart Inventory (' + o.stock + ' รายการ)', Supporting: false, Actions: false, 'More actions': false });
    if (labels[1]) setProps(labels[1], { Title: 'คงเหลือไม่พอ — รอจัดซื้อ ผพจ. (' + o.buy + ' รายการ)', Supporting: false, Actions: false, 'More actions': false });
    const info = find(m, '_Modal content');
    if (info) {
      const pairs = [['แผน', P[1]], ['เลขที่ MR', P[0]], ['ไตรมาส', NOW_Q], ['จำนวนยานพาหนะ', NOW_CARS + ' คัน']];
      const rows = info.findAll(n => n.type === 'INSTANCE' && n.name === 'Content item row');
      rows.forEach((r, i) => {
        if (i > 0) { r.visible = false; return; }
        setProps(r, { 'Item 2': true, 'Item 3': true, 'Item 4': true });
        r.children.filter(c => c.name === '_Content item base').forEach((it, j) => { if (pairs[j]) setProps(it, { Label: pairs[j][0], Text: pairs[j][1], Supporting: false, 'Leading icon': false }); });
      });
    }
    // ยอดรวมแบบงานซ่อม: เบิกจาก Smart Inventory · เบิกจากคลังสำรอง · จัดซื้อเพิ่มโดย Smart Inventory · จัดซื้อเพิ่มโดย ผพจ. · รวม
    const sum = { take: [0, 0], buy: [0, 0] };
    PARTS.forEach((pt, i) => { const q = +pt[3], st = Math.min(q, +pt[5]); sum.take[WH[i] === 'Smart Inventory' ? 0 : 1] += st * PRICE[i]; if (q > st) sum.buy[BUYER_OF[i] || 0] += (q - st) * PRICE[i]; });
    const lines = [['เบิกจาก Smart Inventory', sum.take[0]], ['เบิกจากคลังสำรอง', sum.take[1]], ['จัดซื้ออะไหล่เพิ่มโดย Smart Inventory', sum.buy[0]], ['จัดซื้ออะไหล่เพิ่มโดย ผพจ.', sum.buy[1]]];
    const rowsT = m.findAll(n => n.type === 'FRAME' && n.children && n.children.length === 2 && n.children.every(c => c.type === 'TEXT') && /^(Supporting text|Text)$/.test(n.children[0].name) && n.children[1].name === 'Text');
    let li = 0;
    for (const r of rowsT) {
      if (r.children[0].name === 'Supporting text' && lines[li]) { await text(m, r.children[0], lines[li][0]); await text(m, r.children[1], baht(lines[li][1])); li++; }
      else if (r.children[0].name === 'Text') await text(m, r.children[1], baht(lines.reduce((a, x) => a + x[1], 0)));
    }
    const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && n.parent.name === 'Actions');
    ft.forEach(b => { if (b.name === 'Primary button') setProps(b, { Text: 'ยืนยันเบิก/จอง', 'Leading icon': false, 'Trailing icon': false }); else if (b.name === 'Secondary button') setProps(b, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false }); else b.visible = false; });
    return;
  }
  await confirm(scr, { title: 'ยืนยันการเบิก/จองอะไหล่', sub: 'เบิกจากคลัง ' + o.stock + ' รายการ · คงเหลือไม่พอรอจัดซื้อ ' + o.buy + ' รายการ', ok: 'ยืนยันเบิก/จอง' });
}

/* ลิงก์เลขทะเบียน (6 พ.ย. 2569 เจ้าของงาน "อยากให้ กดที่ทะเบียน newtab ไปข้อมูลรถได้ อยากให้ปรับส่วนอื่นที่เป็นเลขทะเบียน ตอนนี้เพิ่มแค่ส่วนของบำรุงรักษาก่อน")
   ⇒ เลขทะเบียนทุกจุดในจอบำรุงรักษา (ช่องตาราง · กล่องข้อมูล · การ์ดมือถือ) กดแล้วเปิดแท็บใหม่ไปหน้าข้อมูลยานพาหนะของ Vehicle Management · ช่องกรอกและรายการตัวเลือกไม่เป็นลิงก์
   ไลบรารี Component ไม่มี Table cell แบบลิงก์ ⇒ สไตล์ตามค่าลิงก์ใน _Content item base ของ UI Release#2 หน้า Replacement Vehicle (ค่า "BRD005678"): สี #444CE7 ขีดเส้นใต้
   ผูกตัวแปร Color/text/info ของไลบรารีถ้าหาได้ (ค่าสีเดียวกับ Color/icon/info ที่ Progress bar ของ Table cell ใช้) · Overhaul และงานซ่อมยังไม่ปรับ (เจ้าของงาน "ส่วนที่ทำไปแล้วยังไม่ปรับ")
   AFTER_SCREEN = ตัวเรียกหลังประกอบจอแต่ละจอใน core (มีเฉพาะปลั๊กอินนี้) */
const PLATE_RE = /^\d{2}-\d{4} [\u0E00-\u0E7F]+$/;
const PLATE_SKIP = /^(Text input|Input dropdown|Input dropdown with badges|Dropdown list|Dropdown list item|Badge|Pill|Breadcrumb|Page header)/;
let LINK_VAR;
/* R80 คำว่า "ยานพาหนะ" แทน "รถ" (6 พ.ย. 2569 เจ้าของงาน "คำว่า รถ ที่อยู่ใน โปรแกรม อยากให้เปลี่ยนเป็นคำว่า ยานพาหนะ แทน โดยถ้าเป็นข้อมูลที่ดึงมาจาก api จะไม่ต้องแก้ไข")
   ข้อความที่ปลั๊กอินใส่เองเขียนเป็น "ยานพาหนะ" ในโค้ดแล้ว (เทสตรวจซอร์สด้วย) · ตัวนี้แก้ข้อความตั้งต้นของ component ที่ยืมมา เช่น "สถานะรถ" ของ component งานซ่อม
   WORD_ALLOW = ข้อมูลจาก API ที่คงคำว่ารถ (ชื่อประเภทยานพาหนะ) + คำที่มี "รถ" แต่ไม่ได้แปลว่ารถ · ต้องตรงกับ allow ของ R80 ใน component-rules.json (เทสเทียบให้) */
const WORD_ALLOW = ['สามารถ', 'รถพ่วงฉีดน้ำ', 'รถเสีย', 'รถกระเช้า', 'รถบรรทุกขนาดใหญ่', 'รถส่วนกลาง', 'รถยนต์บรรทุกส่วนบุคคล'];   // รถกระเช้า = ประเภทยานพาหนะ/ชื่อแผนจากข้อมูล Overhaul (12 พ.ย. 2569 ตรง ALLOW ของ check-wording.mjs ในรีโปเว็บ) · รถเสีย = ประเภทการซ่อมของระบบแจ้งซ่อม (5.3 Vehicle Breakdown) ใช้ในประวัติการซ่อมบำรุง S24 (10 พ.ย. 2569) · 12 พ.ย. 2569 ถอด ผู้ใช้รถฯ ทะเบียนรถ (ข้อความแบบสำรวจของ S27 ย้ายไป satisfaction-plugin R105) · 12 พ.ย. 2569 รถบรรทุกขนาดใหญ่ รถส่วนกลาง รถยนต์บรรทุกส่วนบุคคล = ข้อมูลจาก API ของ VMS+ (หมวดหมู่ · ลักษณะการใช้งาน · ประเภทตามกรมการขนส่งทางบก) ในแท็บข้อมูลยานพาหนะ S24 (R107 · ALLOW ของ check-wording.mjs เว็บ f6f5e0d)
const OLD_WORD = '\u0E23\u0E16';   // "รถ" เขียนแบบ escape ให้เทสตรวจซอร์สไม่นับตัวแปลงเอง
const toVehicleWord = (s) => { let t = s; WORD_ALLOW.forEach((w, i) => { t = t.split(w).join('\u0001' + i + '\u0002'); }); t = t.split(OLD_WORD).join('ยานพาหนะ'); WORD_ALLOW.forEach((w, i) => { t = t.split('\u0001' + i + '\u0002').join(w); }); return t; };
async function AFTER_SCREEN(root) {
  for (const t of root.findAll(n => n.type === 'TEXT' && (n.characters || '').indexOf(OLD_WORD) >= 0)) {
    const v = toVehicleWord(t.characters); if (v === t.characters) continue;
    try {
      const fonts = t.fontName === figma.mixed ? t.getRangeAllFontNames(0, t.characters.length) : [t.fontName];
      for (const f of fonts) await figma.loadFontAsync(f);
      t.characters = v;
    } catch (e) { warn('คำว่ายานพาหนะ', e); }
  }
  const ts = root.findAll(n => n.type === 'TEXT' && PLATE_RE.test(n.characters || ''));
  if (!ts.length) return;
  if (LINK_VAR === undefined) LINK_VAR = await libVar(/^Color\/text\/info$/i);
  for (const t of ts) {
    let p = t.parent, skip = false;
    while (p && p !== root) { if (PLATE_SKIP.test(p.name)) { skip = true; break; } p = p.parent; }
    if (skip) continue;
    try {
      await figma.loadFontAsync(t.fontName);
      t.textDecoration = 'UNDERLINE';
      let paint = { type: 'SOLID', color: rgbOf('#444CE7') };
      if (LINK_VAR) try { paint = figma.variables.setBoundVariableForPaint(paint, 'color', LINK_VAR); } catch (e) { /* คงค่าสี */ }
      t.fills = [paint];
    } catch (e) { warn('ลิงก์เลขทะเบียน', e); }
  }
}
/* ---------- S1 หน้ารายการแผน + ฟอร์มสร้างแผน ---------- */
const PLAN_COLS = [['เลขที่ MR', 150, 'Lead text', 'Down'], ['ชื่อแผน', 0, 'Text', 'Swap'], ['ภาค / ประเภทยานพาหนะ', 200], ['จำนวนยานพาหนะ', 100], ['ยานพาหนะรายไตรมาส', 210], ['สถานะ', 150, 'Badge', 'Swap'], ['', 60]];   // 6 พ.ย. 2569 ตัดคอลัมน์คลังรับทราบ (S22 ตัดออก · ระบบแจ้ง Smart Inventory ตอนอนุมัติแทน)   // 2 พ.ย. 2569 เพิ่มคลังรับทราบ (S22) · ปีงบประมาณย้ายเป็นบรรทัดรองของชื่อแผน (Table 8 คอลัมน์เต็ม)   // 30 ต.ค.: แผนปี · เลขที่ MRZ69000XX นำหน้า (ประเภทรถอยู่ในชื่อแผน) · Table 8 คอลัมน์
const qCell = (t) => { const q = t.split(' · '); return { text: q.slice(0, 2).join(' · '), sub: q.slice(2).join(' · ') }; };   // 4 ไตรมาสยาวเกินคอลัมน์ ⇒ 2 บรรทัด (เจ้าของงาน 2 พ.ย. 2569 เปลี่ยน Q1 เป็นไตรมาส)
const PLAN_MENU_OF = (st) => st === 'returned' ? MENU : st === 'approved' || st === 'active' ? MENU.slice(0, 2) : MENU.slice(0, 1);   // 13 พ.ย. 2569 ไฟล์ 34 ข้อ 6 (เจ้าของงานตอบ ก) แผนรออนุมัติดูอย่างเดียวทุกที่ = ดูรายละเอียดอย่างเดียว ไม่มีแก้ไข ลบ (ปิด Q53 · กันแผนเปลี่ยนระหว่างผู้อนุมัติตรวจ) · ส่งกลับแก้ไข = ดู แก้ไข ลบ   // 13 พ.ย. 2569 R113: ดำเนินการ = ดูรายละเอียด แก้ไข (เจ้าของงาน 11 พ.ย. 2569 "แผนที่ดำเนินการแล้ว ยังสามารถแก้ไขได้" + "เฉพาะไตรมาสที่ยังไม่เสร็จ" · เว็บ BACKLOG 64) · ปิดงานแล้ว = ดูรายละเอียด   // รายการเมนู … ตามสถานะแผน (S19 S20) · มือถือเปิดเป็นไอคอนตามนี้
/* ภาค / ประเภทรถ ในรายการ (เจ้าของงาน 5 พ.ย. 2569 "สรุปจากรถที่อยู่ในแผนจริง") — ตัวกรองอยู่รายไตรมาสแล้ว แผนไม่มีภาคของตัวเอง ⇒ 2 บรรทัดในช่องเดียว (Table 8 คอลัมน์ R8 · บรรทัดรอง = ประเภทรถ)
   PLAN_SCOPE = แผนที่มีรถหลายภาค/ประเภท (ค่าสมมติ) · ที่เหลือใช้ภาคและประเภทเดียวของแผน */
const PLAN_SCOPE = { 'MRZ7000001': ['ภาค 1, ภาค 2', 'กระเช้าแก้ไฟ'], 'MRZ7000002': ['ภาค 2, ภาค 3', 'กระเช้าแก้ไฟ, รถพ่วงฉีดน้ำ'] };   // 5 พ.ย. 2569 ชีตลูกค้า: MRZ7000001 เคยเป็น "ภาค 1" แต่รถในแผน (TRIP_CARS) อยู่ทั้ง กฟน. และ กฟฉ. ⇒ ภาค 1 และภาค 2 ให้ตรงรถ
const scopeCell = (p) => { const x = PLAN_SCOPE[p[0]]; return x ? { text: x[0], sub: x[1] } : { text: shortRegion(p[2]), sub: p[7] }; };
const PLAN_UNIT = { 'MRZ7000004': 'กบผ.', 'MRZ7000001': 'กบผ.', 'MRZ7000002': 'กปส.', 'MRZ7000003': 'กรย.', 'MRZ7100001': 'กบค.', 'MRZ6900012': 'กบผ.', 'MRZ7100002': 'กปส.', 'MRZ6900011': 'กรย.' };   // หน่วยงานเจ้าของแผน (ค่าสมมติ · 6 พ.ย. 2569 · MRZ7100001 = แผนของ กบค. ที่มีรถ กฝซ.)
/* view = หน่วยงานที่เปิดดูแผนทุกหน่วยงาน (กบค.) · หน่วยงานเป็นบรรทัดรองของเลขที่ MR (Table 8 คอลัมน์เต็ม)
   แผนของหน่วยงานตัวเอง เมนู … ตามสถานะแบบปกติ · แผนของหน่วยงานอื่น ดูรายละเอียดอย่างเดียว (6 พ.ย. 2569 รอบ 2) */
/* 9 พ.ย. 2569 เจ้าของงาน (ภาพหน้ารายการแผนมุม กบค.) "หน้านี้น่าจะต้องเพิ่มคอลัมม์ หน่วยงานเจ้าของเรื่อง ด้วย" ⇒ มุม กบค. (view) มีคอลัมน์ "หน่วยงานเจ้าของเรื่อง" ต่อจากเลขที่ MR แทนบรรทัดรองใต้เลขที่ MR · มุมหน่วยงานเห็นแต่แผนของตัวเอง ไม่มีคอลัมน์นี้ */
const PLAN_COLS_ALL = PLAN_COLS.slice(0, 1).concat([['หน่วยงานเจ้าของเรื่อง', 140]], PLAN_COLS.slice(1));
const planRow = (p, view) => (view ? [p[0], PLAN_UNIT[p[0]] || UNITS[0]] : [p[0]]).concat([{ text: p[1], sub: 'ปีงบประมาณ ' + p[8] }, scopeCell(p), p[4], qCell(p[9]), { pill: PST[p[5]] }, { menu: 1, items: view && PLAN_UNIT[p[0]] !== view ? MENU.slice(0, 1) : PLAN_MENU_OF(p[5]) }]);
/* 5 พ.ย. 2569 รีวิวทีมออกแบบ: ปุ่ม Primary "สร้างแผน" อยู่ขวาของปุ่ม "ตัวกรอง" ⇒ ย้ายจาก Page header ไป Actions ของ Table header
   ตาม Incident list ของ 5.5 Repair & Maintenance Job (Admin) ใน UI Release#2 (Page header ไม่มีปุ่ม · Table header = ค้นหา + ตัวกรอง + ปุ่มหลัก)
   o.empty = ยังไม่มีแผน ⇒ Empty state/Data empty (Graphic) + ปุ่ม "สร้างแผน" ไม่มี Table header ตาม Admin State=Empty ของ RP & MA Job และ Wall charger list - Empty ของ UI Release#2 */
async function listScreen(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'บำรุงรักษาตามวาระ' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  if (o.empty) {
    const es = inst('Empty state/Data empty'); add(sec, es, 'h');
    await text(es, 'Text', 'ไม่มีแผนบำรุงรักษา'); await text(es, 'Supporting text', 'เมื่อสร้างแผนบำรุงรักษา รายการแผนจะแสดงที่นี่');
    const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false;
    const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'สร้างแผน', 'Leading icon': true, 'Leading icon swap': icon('add-24-300-round') });
    return scr;
  }
  add(sec, await tableHeader(Object.assign({ primary: 'สร้างแผน' }, o)), 'h');   // กบค. สร้างแผนได้แล้ว (6 พ.ย. 2569 รอบ 2) ⇒ ปุ่มอยู่ทุกมุม
  add(sec, await tblShort(o.view ? PLAN_COLS_ALL : PLAN_COLS, (o.rows || PLANS).map(p => planRow(p, o.view)), { pagination: (o.rows || PLANS).length }), 'h');
  /* แผงตัวกรองหน้ารายการแผน (6 พ.ย. 2569 รีวิว "filter หน้ารายการแผน เขต · หน่วยงานหน้างาน กรย. 12 เขต, กกฟ. 1and2" + "กบค. อยากเห็นทุกแผน")
     filterPanel แบบแผงตัวกรองของฟอร์ม S1 (R77) · Input dropdown with badges Optional เลือกหลายค่า · เขต = 12 เขตของภาค 1–4 (DISTRICTS · ไม่รวมกองของ สนง. ที่อยู่ในช่องหน่วยงานหน้างานแล้ว R93 · 12 พ.ย. 2569 X3) · หน่วยงานหน้างาน = UNITS · o.filter.open = 'unit' | 'district' */
  if (o.filter) {
    const fd = o.filter, at = (n) => n.findOne(x => x.name === 'Container') || n;
    const dist = multiDropdown('เขต', fd.districts || [], { placeholder: 'เลือกเขต', optional: true, state: fd.open === 'district' ? 'Focused' : undefined });
    const unit = multiDropdown('หน่วยงานหน้างาน', fd.units || [], { placeholder: 'เลือกหน่วยงานหน้างาน', optional: true, state: fd.open === 'unit' ? 'Focused' : undefined });
    await filterPanel(scr, [dist, unit]);
    if (fd.open === 'unit') comboAt(scr, at(unit), UNITS.map(u => [u, '', (fd.units || []).indexOf(u) >= 0]));
    if (fd.open === 'district') comboAt(scr, at(dist), REGIONS.slice(0, 4).flatMap(r => DISTRICTS[r]).map(d => [d, '', (fd.districts || []).indexOf(d) >= 0]));
  }
  return scr;
}
const CARS = VEH.map(v => [v[0], v[1], v[2]]);
/* ฟอร์มสร้างแผน: ดูคำอธิบายที่ planForm() (ปรับ 5 พ.ย. 2569 แยกไตรมาสตั้งแต่แรก + ตารางรถทุกคัน ค้นหา กรอง · ค่ำ R77 ภาค เขต ประเภทรถ ย้ายเข้าแผงตัวกรอง) · ช่องค้นหา + ชิปรถแบบ R24 (2 พ.ย.) เลิกใช้ในฟอร์มนี้แล้ว */
const YEARS = ['2568', '2569', '2570', '2571', '2572'];   // เจ้าของงาน "ไม่จำกัดปี" — จำนวนปีที่แสดงยังไม่รู้ (Q31)
const CARP_COLS = [['ทะเบียน', 230, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของยานพาหนะ', 180], ['น้ำมันไฮดรอลิก', 140], ['เปลี่ยนล่าสุด', 120], ['อะไหล่', 120], ['', 104]];   // ไอคอนแก้ไข + ลบรถออกจากไตรมาส กว้าง 104 แบบบล็อก J ของ Overhaul · ตารางรถในไตรมาส (เจ้าของงาน 2 พ.ย. 2569 "section ของรถที่เลือกมาไตรมาสนั้น")
const CAR_PICK = [1, 2, 3];                 // ไส้กรองที่ กบค. เลือกให้รถ 1 คันในข้อมูลตัวอย่าง (ลำดับใน PARTS) · น้ำมันไฮดรอลิก (0) เข้ารายการเมื่อเลือกเปลี่ยนน้ำมัน
const CAR_QTY = [30, 2, 2, 2, 2];           // จำนวนต่อคัน (ค่าสมมติ)
const MANUAL = { name: 'ไส้กรองอากาศขนาดเล็ก', code: '', price: '750', qty: 2 };   // รายการที่ กบค. ระบุเอง ค่าตามจอ "รายการเพิ่มเติม" ของงานซ่อม
const MANUAL_ROW = [MANUAL.name, '-', 'เพิ่มเอง', String(MANUAL.qty), 'ชิ้น'];
/* อะไหล่ในไตรมาส = รวมจากรถของไตรมาสนั้น · เจ้าของงาน 2 พ.ย. 2569 "ไม่มี suggest มาให้เลย ให้เลือกเอง" + "หัวข้ออะไหล่ เป็นอะไหล่ในไตรมาสนั้นๆ" ⇒ picks = { ลำดับรถ: [ลำดับอะไหล่] } ว่างเมื่อยังไม่เลือก */
const quarterParts = (cars, picks) => PARTS.map((p, i) => [p[0], p[1], p[2], String(CAR_QTY[i] * cars.filter(c => (picks[c] || []).indexOf(i) >= 0).length), p[4]]).filter(r => +r[3] > 0);
/* แท็บไตรมาสที่ยังไม่มีรถ (5 พ.ย. 2569 เจ้าของงาน "ทำให้หน้า ไตรมาสยังไม่่มีรถสามารถเพิ่มรถจากจุดนี้ได้ด้วย" · R75)
   Empty state/Data empty ภาพรถกับแว่นขยาย (R61) + ปุ่มหลัก "เพิ่มรถเข้าไตรมาส n" ไอคอน add · ปุ่มรองซ่อน
   ตาม Empty state ที่มีปุ่มหลักในฟอร์มของ UI Release#2 หน้า 5.2 Vehicle Management (Create vehicle step 3 > State=Empty ปุ่ม "เพิ่ม") + ปุ่มของ Empty state หน้าไตรมาส S6 ("สร้างแผนเดินทาง") */
async function noCarsInQ(q) {
  const es = inst('Empty state/Data empty');
  await text(es, 'Text', 'ยังไม่มียานพาหนะในไตรมาสนี้'); await text(es, 'Supporting text', 'เลือกจากยานพาหนะในแผนที่ยังไม่จัดไตรมาส');   // 13 พ.ย. 2569 R111 จัดเข้าไตรมาสจากยานพาหนะในแผน
  const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false;
  const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'เพิ่มยานพาหนะเข้าไตรมาส ' + q, 'Leading icon': true, 'Leading icon swap': icon('add-24-300-round') });
  return emptyGraphic(es, 'empty-vehicle');
}
async function noParts(sub) { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มีรายการอะไหล่'); await text(es, 'Supporting text', sub); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
const OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน'];   // เจ้าของงาน 2 พ.ย. 2569: น้ำมันไฮดรอลิกไม่ได้เปลี่ยนทุกปี ให้ผู้ใช้เลือกเอง ระบบไม่ตัดสินจากเงื่อนไขอายุ
const LAST_OIL = ['12/03/2568', '12/03/2567', '05/02/2567', '20/11/2566', 'ไม่มีข้อมูล', '18/06/2568', '09/01/2566', '14/10/2568', 'ไม่มีข้อมูล', 'ไม่มีข้อมูล'];   // 5 พ.ย. 2569 82-1145 และ 81-2210 แก้ให้ตรง MA_ROWS (S24)   // เปลี่ยนน้ำมันครั้งล่าสุดตามลำดับ CAND
const QUARTERS = ['ไตรมาส 1 (ม.ค.–มี.ค.)', 'ไตรมาส 2 (เม.ย.–มิ.ย.)', 'ไตรมาส 3 (ก.ค.–ก.ย.)', 'ไตรมาส 4 (ต.ค.–ธ.ค.)'];   // 6 พ.ย. 2569 เจ้าของงาน "ไตรเป็นตามปีปฎิทิน" (เดิมไตรมาส 1 = ต.ค.–ธ.ค. ตามปีงบ) · ป้ายช่อง "ปีงบประมาณ" คงเดิม (เจ้าของงาน "ไม่ต้องมีคำว่าปีปฎิทิน")
/* ช่องติ๊กหัวคอลัมน์แรก (ติ๊กทั้งหมด) นับเฉพาะแถวที่ติ๊กได้ — ตาม Export reports - Select vehicles ของ 5.2 Vehicle Management (UI Release#2) · ใช้ทั้งตารางเลือกรถของ S1 และ popup เพิ่มรถของ S6 */
function headCheck(t, rows) {
  const hc = t && t.findOne ? t.findOne(n => n.type === 'INSTANCE' && n.name === 'Table header cell') : null; if (!hc) return;
  const ok = rows.filter(r => !r[0].disabled), n = ok.filter(r => r[0].check).length;
  setProps(hc, { Checkbox: 'True' });
  const cb = find(hc, 'Checkbox'); if (cb) setProps(cb, { Type: n === 0 ? 'Unselected' : n === ok.length ? 'Selected' : 'Indeterminate', State: ok.length ? 'Default' : 'Disabled' });
}
/* ฟอร์มสร้างแผน แบบ A (เจ้าของงานเลือก 5 พ.ย. 2569) — _"หน้าตอนที่เลือก ภาค เลือกเขต อยากให้แสดงรถทั้งหมด ของภาคหรือเขตนั้นๆเลย ที่เลือกมา แล้วค่อยเข้าสู่กระบวนการเลือกรถเข้าไตรมาส"_
   + _"อยากออกแบบหน้าสร้างแผนให้ เห็นรถหมายทุกคัน เหมือนหน้ารวมที่มีรถทุกคันแล้ว มีค้นหา มี กรอง"_ (แทนรีวิว "แยกไตรมาสตั้งแต่แรก / filter ในแต่ละไตรมาส" และแทนช่องค้นหา + ชิปแบบ R24)
   โครงลอกหน้า Vehicle Management ของ UI Release#2 (Vehicle list · Export reports - Select vehicles): Tabs + Pill นับ → Table header หัว + Badge "n คัน" · ช่องค้นหา "เลขทะเบียน, ยี่ห้อ, รุ่น" · ปุ่ม "ตัวกรอง" (Pill) · ปุ่มรอง (แบบ "รายงาน")
   · ชิปตัวกรอง Badge outline with remove icon → Table แถวแรก Lead checkbox (บรรทัดรอง ยี่ห้อ/รุ่น) + ติ๊กทั้งหมดที่หัวคอลัมน์ → Table pagination
   ⇒ section "เลือกรถเข้าแผนและจัดลงไตรมาส" (R77 · 5 พ.ย. 2569 ค่ำ เจ้าของงาน _"อยากย้ายสิ่งที่ filter ด้านบน มาไว้ที่เมนู filter ด้านล่างแทน"_ + _"อยากให้เอาสิ่งที่ต้องเลือก 3 อย่างนี้ ไปอยู่ใน filter เลย
     และปุ่ม filter and search มีขึ้นมาเลย หัวตารางมาเลย แล้วมี icon car empty มาแสดง ถ้ายังไม่ได้เลือกรถ"_ · ตามต้นแบบเว็บ PlanForm.tsx ที่เจ้าของงานยืนยันแล้ว):
     ไม่มีแถวช่องบนสุดแล้ว — Tabs ทั้งหมด · ไตรมาส 1–4 (Tabs ของไลบรารีมี 5 ช่อง ⇒ ไม่มีแท็บ "ยังไม่จัด" รอเคาะ) + Table header แสดงเสมอ ตั้งแต่ยังไม่เลือกอะไร
     ปุ่ม "ตัวกรอง" ของ Table header เปิดแผงตัวกรอง (filterPanel ใน core แบบ S24 · มือถือ bottom sheet) ช่อง ภาค · เขต · ประเภทรถ = Input dropdown with badges Optional "(ถ้ามี)" หลายค่า
     (เขต = เขตของทุกภาคที่เลือกในแผง · ยังไม่เลือกภาค = ทุกเขต · ไม่มี Disabled เลือกช่องไหนก่อนก็ได้ R69) ตาม "PEA Car Cost Filter" ของ UI Release#2 (ช่อง "ปี" หลายค่าในแผงตัวกรอง)
     กดตกลงจึงใช้ · ยกเลิก/ปิด = ไม่เปลี่ยน → ชิป Badge outline with remove icon ใต้แถวค้นหา + Pill บนปุ่มตัวกรอง = จำนวนชิป
     ยังไม่เลือกช่องใด (แท็บทั้งหมด) = Empty state/Data empty ภาพรถ (R61) "ยังไม่มีรายการรถ" / "กดตัวกรองเพื่อเลือกภาค เขต หรือประเภทรถ ตารางจะแสดงรถทั้งหมดที่ตรงกัน"
   → ตารางรถทุกคันของพื้นที่ (ทะเบียน · ประเภทรถ · เขต / หน่วยงานเจ้าของรถ · ไตรมาส = Pill "ไตรมาส n" หรือ Gray "ยังไม่จัด" แบบป้าย "ยังไม่มีแผนเดินทาง" ของ S6) → ติ๊กแล้วกด "จัดลงไตรมาส (n)" → popup เลือก ไตรมาส 1–4
   แท็บไตรมาส n = รถที่จัดลงไตรมาสนั้นทั้งหมด (ไม่ขึ้นกับภาค เขต ที่เลือกอยู่) · เอาชิป/ช่องในแผง หรือคำค้นออก เปลี่ยนแค่แถวที่เห็น รถที่จัดแล้วไม่หาย (รีวิว 5 พ.ย. 2569) · ไม่มี confirm เอารถออกแล้ว
   ปุ่ม "บันทึกและส่งอนุมัติ" Disabled จนกว่า ชื่อแผน · ปีงบประมาณ ครบ · รถทุกคันอยู่ในไตรมาส · ทุกคันกำหนดอะไหล่แล้ว (รีวิว A.11 · 6 พ.ย. 2569) · o.draw = การเบิกรายคัน · o.errors = Validation กรณีไม่ได้ระบุข้อมูล, Out of focus
   o.regions / o.districts / o.types / o.query = ตัวกรองที่ใช้แล้ว (กดตกลงแล้ว) และคำค้น · o.filter = เปิดแผงตัวกรอง { regions, districts, types = ค่าที่เลือกในแผง (ยังไม่กดตกลง) · open: 'region' | 'district' = รายการเปิด }
   o.yearOpen = รายการปีเปิด · o.alloc = { ลำดับรถใน CAND: ไตรมาส } · o.q = แท็บ (0 = ทั้งหมด · 1–4 = ไตรมาส) · o.ticked = แถวที่ติ๊ก
   o.assign = เปิด popup จัดลงไตรมาส { sel: 0–3 ไตรมาส · -1 ยังไม่เลือก } · o.picks / o.manualCars = อะไหล่ (S21) · o.edit = ฟอร์มแก้ไข S19 (ปีงบประมาณ Readonly · ปุ่ม "ยกเลิก") · o.alert = [สี, หัวข้อ, ข้อความ] */
const PICK_COLS = [['ทะเบียน', 260], ['ประเภทยานพาหนะ', 160], ['เขต / หน่วยงานเจ้าของยานพาหนะ', 0], ['ไตรมาส', 170, 'Badge'], ['อะไหล่อื่นๆ', 200], ['', 60]];   // แท็บทั้งหมดของฟอร์มแผน · ไตรมาส = Pill ไตรมาส n หรือ ยังไม่จัดไตรมาส · อะไหล่อื่นๆ ชุดเดียวกับแท็บไตรมาส · ท้ายแถว = ปุ่ม … (MENU · R111 13 พ.ย. 2569 · เดิมถังขยะ R109)
/* แท็บไตรมาส n (5 พ.ย. 2569 เจ้าของงาน "หน้านี้จะเห็นรถในไตรมาส แต่จะยังไม่เห็นอะใหล่ อยากให้จัดการสิ่งที่ต้องทำของรถแต่ละคัน …"
   + แก้ "ข้อ 2 ไม่ได้ให้เอาออกจากการสร้างแผน แต่ให้เอารายการอะใหล่ออก เป็น empty ก่อน แล้วค่อยให้เลือกจัดการอะใหล่ ทีละคัน แล้วค่อยเอามาลงในรายการอะใหล่ตอนจะส่งอนุมัติ …")
   ตารางรถของไตรมาสบอกสิ่งที่ต้องทำรายคัน: น้ำมันไฮดรอลิก (คำของ JOB_OIL_OPTS · บรรทัดรอง เบอร์น้ำมัน · จำนวนลิตร) · อะไหล่อื่นๆ ("n รายการ" · บรรทัดรอง ชื่อรายการแรก) · ไอคอนแก้ไข (Table cell Action icons) ไปหน้าจัดการอะไหล่ของรถ (S21)
   หัวข้อ "อะไหล่ในไตรมาส n" คงไว้ ตั้งต้นว่าง แล้วรวมจากรถที่จัดการแล้ว (qAgg) · ไม่มีปุ่มเพิ่มอะไหล่และไอคอนแถว (อะไหล่มาจากรถทีละคัน)
   6 คอลัมน์ ไม่ต้องรวมช่อง (คอลัมน์ไตรมาสของแท็บทั้งหมดไม่แสดง เพราะทุกคันอยู่ไตรมาสเดียวกัน) · มือถือ List with checkbox = สรุปอยู่บรรทัดรอง */
const Q_COLS = [['ทะเบียน', 240], ['ประเภทยานพาหนะ', 130], ['เขต / หน่วยงานเจ้าของยานพาหนะ', 0], ['น้ำมันไฮดรอลิก', 200], ['อะไหล่อื่นๆ', 200], ['', 60]];   // 6 พ.ย. 2569 ท้ายแถว = ปุ่ม … (Q_MENU) แทนไอคอนแก้ไข
/* เมนู … ของยานพาหนะในแท็บไตรมาส (6 พ.ย. 2569 เจ้าของงาน "เพิ่ม ... ดูรายละเอียด แก้ไข ลบ ของรถแต่ละคัน" + เลือกอยู่ที่ฟอร์มสร้าง/แก้ไขแผน S1 S19)
   ดูรายละเอียด = อะไหล่ของยานพาหนะคันนั้น ดูอย่างเดียว (carPartsView) · แก้ไข = หน้าจัดการอะไหล่ S21 · ย้ายไปไตรมาสอื่น = moveQModal
   · เอาออกจากไตรมาส = กลับเป็นยังไม่จัดไตรมาส ยังอยู่ในแผน อะไหล่ที่กำหนดไว้คงอยู่ ไม่มี confirm (R111 13 พ.ย. 2569 เจ้าของงานเลือก "เอาออกจากไตรมาส" · แบบ A 5 พ.ย. ไม่มี confirm เอารถออก)
     ลบออกจากแผนย้ายไปเมนู … ของแท็บทั้งหมด (PLAN_OUT_CONFIRM · R109 12 พ.ย. 2569 เคยเป็นลบออกจากแผนในเมนูนี้)
   ชุดเดียวกับ MENU ของรายการแผนและหน้ารายละเอียดแผนเดินทาง (S10 JOB_MENU) · เปิดด้วย planMenu */
// Q_MENU ย้ายไปไว้เหนือ planForm (12 พ.ย. 2569 เพิ่ม ย้ายไปไตรมาสอื่น · R109)
const TODO_NONE = 'ยังไม่กำหนด';
const OIL_SPEC = { grade: 'ISO VG 46', code: 'OL-0011', litre: '30' };   // ค่าสมมติตามน้ำมันไฮดรอลิก ISO VG 46 รหัส OL-0011 ใน PARTS
const oilCell = (k) => k == null ? TODO_NONE : { text: JOB_OIL_OPTS[k], sub: k ? OIL_SPEC.grade + ' · ' + OIL_SPEC.litre + ' ลิตร' : OIL_SPEC.grade };
const partList = (i, picks, manualCars) => (picks[i] || []).filter(x => x !== 0).map(x => PARTS[x][0]).concat(manualCars.indexOf(i) >= 0 ? [MANUAL.name] : []);
const partCell = (l) => l.length ? { text: l.length + ' รายการ', sub: l[0] + (l.length > 1 ? ' และอื่น ๆ' : '') } : TODO_NONE;
/* ตารางอะไหล่รวมตามรายการ (R81 · 6 พ.ย. 2569 เจ้าของงาน "ถ้าเพิ่ม คอลัมน์ ก็ส่งผลกระทบกับ หน้าอื่นๆที่เป็นหน้าที่เหมือนกันด้วย ตอน export ก็เกี่ยวข้องด้วย")
   ชุดเดียวใช้ทุกที่: อะไหล่ในไตรมาส (S1 S19) · อะไหล่ในแผน (S2) · อะไหล่ในไตรมาส n (หน้าไตรมาส) · แดชบอร์ดแท็บรวมตามรายการ (S4) · ไฟล์ PDF และ Excel ที่ส่งออก
   คอลัมน์ ชนิด · ประเภท · จำนวน ตามที่เจ้าของงานสั่ง (S2) + รหัสอะไหล่ (รีวิว S4 "ค้นหาจาก ชื่ออะไหล่ รหัสอะไหล่") · แถว = qAgg [ชื่อ, รหัส, ประเภท, จำนวน, หน่วย] · เพิ่ม/ลดคอลัมน์ที่นี่ที่เดียว */
const QPART_COLS = [['ชนิด', 0, 'Lead text'], ['รหัสอะไหล่', 150], ['ประเภท', 160], ['จำนวน', 120], ['หน่วย', 110]];
/* อะไหล่ในไตรมาส = รวมจากรถที่จัดการแล้ว: น้ำมันไฮดรอลิก (คันที่เปลี่ยน · 30 ลิตรต่อคัน) + อะไหล่อื่นๆ ที่เลือกจากคลัง + รายการที่ระบุเอง */
const qAgg = (cars, picks, oils, manualCars) => {
  const rows = PARTS.map((p, x) => { const n = x === 0 ? cars.filter(i => oils[i] === 1 || oils[i] === 2).length * +OIL_SPEC.litre : CAR_QTY[x] * cars.filter(i => (picks[i] || []).indexOf(x) >= 0).length; return [p[0], p[1], p[2], String(n), p[4]]; }).filter(r => +r[3] > 0);
  const m = cars.filter(i => manualCars.indexOf(i) >= 0).length;
  return m ? rows.concat([[MANUAL.name, MANUAL.code || '-', 'เพิ่มเอง', String(MANUAL.qty * m), 'ชิ้น']]) : rows;
};
const inArea = (c, f) => (!f.regions.length || f.regions.indexOf(regionOf(c)) >= 0) && (!f.districts.length || f.districts.indexOf(dCode(c)) >= 0) && (!f.types.length || f.types.indexOf(typeOf(c)) >= 0);
const inQuery = (c, f) => !f.query || (c[0] + ' ' + c[1]).indexOf(f.query) >= 0;
/* popup จัดลงไตรมาส — popupModal (Modal header + Radio text card เรียงลง 4 ใบ + Modal footer · ตามโครง popup ของ S6) · มือถือ = bottom sheet · ปุ่ม ยืนยัน Disabled จนกว่าจะเลือก */
const ALL_Q_PARTS_EMPTY = 'จัดการอะไหล่ทีละคันจากปุ่ม … ที่แถวยานพาหนะในแท็บไตรมาส รายการจะรวมมาที่นี่';   // แท็บทั้งหมด ยังไม่มีอะไหล่สักคัน (9 พ.ย. 2569 · ข้อความเสนอ)
/* ฟอร์มแผน S1 S19 แบบเลือกยานพาหนะผ่าน modal (เจ้าของงาน 12 พ.ย. 2569 ส่งภาพ modal "เพิ่มรถเข้า Purchase Order" ของ Overhaul + "หน้าจอเลือกรถ อยากให้เป็น modal ตามรูป แก้ใน flow ด้วย"
   เคาะ: ยานพาหนะที่เลือกเข้าไตรมาสที่เปิดอยู่ทันที) — R109 · แทนแบบ A (5 พ.ย. 2569 ตารางยานพาหนะของพื้นที่ในหน้า + แผงตัวกรอง R77 + ติ๊กแล้วจัดลงไตรมาส)
   หัวข้อ "ยานพาหนะในแผน" Badge "ในแผน n คัน" + Tabs ทั้งหมด · ไตรมาส 1–4 · แท็บไตรมาส: Table header หัว + Badge กำหนดอะไหล่แล้ว + ค้นหา + ปุ่ม "เพิ่มยานพาหนะ" (o.add แทนตัวกรอง) · เมนู … ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น ลบ
   แท็บทั้งหมด (R111 13 พ.ย. 2569 เจ้าของงาน "เลือกรถเข้ามาในแผนก่อน แล้วหลังจากนั้นเลือกรถเข้าไตรมาส จะเงื่อนไขว่า รถที่เลือกแล้วจะไม่แสดงตอนเลือกไตรมาสอื่นได้ และ รถในไตรมาส อยากให้ สามารถ ย้ายไปไตรมาสอื่นได้")
     = ขั้นที่ 1 เพิ่มยานพาหนะเข้าแผน (modal ไม่มีช่องเลือกไตรมาส) · ทุกคันในแผน + Pill "ไตรมาส n" หรือ Gray "ยังไม่จัดไตรมาส" (แบบป้าย "ยังไม่มีแผนเดินทาง" ของหน้าไตรมาส S6) + อะไหล่อื่นๆ + ปุ่ม … (MENU ลบ = ลบออกจากแผน)
   แท็บไตรมาส n = ขั้นที่ 2 จัดเข้าไตรมาส: modal แสดงเฉพาะยานพาหนะในแผนที่ยังไม่จัดไตรมาส (คันที่อยู่ไตรมาสอื่นไม่แสดง) · ฟอร์มใหม่เปิดที่แท็บทั้งหมด
   ติ๊กได้ทั้ง 2 แท็บ (desktop · Table cell Lead checkbox + ติ๊กทั้งหมดที่หัว headCheck แบบ "Export reports - Select vehicles" หน้า 5.2 Vehicle Management ของ UI Release#2)
     ติ๊กแล้ว Table header มีปุ่มรอง "กำหนดอะไหล่ (k)" → หน้าจัดการอะไหล่แบบหลายคัน (R112 · เว็บ BACKLOG 64) · มือถือ: จอที่กำลังติ๊ก = List with checkbox (แบบเว็บ) จออื่น = การ์ด Mobile table มีปุ่ม …
   alloc[i] = 0 คือยานพาหนะอยู่ในแผนแต่ยังไม่จัดไตรมาส · 1–4 = ไตรมาส
   o.pick = เปิด modal เพิ่มยานพาหนะ (planCarModal) · o.move = popup ย้ายไปไตรมาสอื่น { car, cur, sel } · o.ticked = ลำดับยานพาหนะที่ติ๊กในตาราง */
const Q_MENU = [MENU[0], MENU[1], ['ย้ายไปไตรมาสอื่น', 'swap_driving_apps_wheel-24-300-round'], ['เอาออกจากไตรมาส', 'remove-24-300-round']];   // ย้าย = ไอคอนเดียวกับ MOVE_ITEM ของ S25 · เอาออก = remove ของไฟล์ Component หน้า Icons (R111 · ไอคอนยังไม่เคาะ)
const PLAN_OUT_CONFIRM = (c, q) => ({ danger: true, title: 'ยืนยันการลบยานพาหนะออกจากแผน', sub: c[0] + (q ? ' จะออกจากไตรมาส ' + q + ' และไม่อยู่ในแผนนี้' : ' จะไม่อยู่ในแผนนี้') + ' เพิ่มกลับได้จากปุ่มเพิ่มยานพาหนะ', cancel: 'ยกเลิก', ok: 'ลบ' });   // ข้อความชุดเดียวกับเว็บ BACKLOG 86 · ยังไม่จัดไตรมาส = ไม่อ้างไตรมาส
const ADD_PLAN_FIRST = 'เพิ่มยานพาหนะเข้าแผนที่แท็บทั้งหมดก่อน แล้วจึงจัดเข้าไตรมาส';
async function noCarsInPlan() {
  const es = inst('Empty state/Data empty');
  await text(es, 'Text', 'ยังไม่มียานพาหนะในแผน'); await text(es, 'Supporting text', 'กดเพิ่มยานพาหนะเพื่อเลือกยานพาหนะเข้าแผน แล้วจึงจัดเข้าไตรมาส');
  const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false;   // 13 พ.ย. 2569 ปุ่มหลักเปิด modal เพิ่มยานพาหนะเข้าแผน (แบบ noCarsInQ)
  const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'เพิ่มยานพาหนะเข้าแผน', 'Leading icon': true, 'Leading icon swap': icon('add-24-300-round') });
  return emptyGraphic(es, 'empty-vehicle');
}
async function planForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const heading = o.edit ? 'แก้ไขแผน ' + NEW_PLAN[0] : 'สร้างแผนบำรุงรักษา';
  const { scr, page } = await shell(name, { title: heading, back: true, crumbs: [o.edit ? heading : 'สร้างแผน'] });
  const alloc = o.alloc || {}, q = o.q || 0, nIn = Object.keys(alloc).length, query = o.query || '';
  const yr = o.edit ? field('ปีงบประมาณ', v.year, { state: 'Readonly' })
    : dropdown('ปีงบประมาณ', v.year || '', { placeholder: 'เลือกปีงบประมาณ', error: E('กรุณาเลือกปีงบประมาณ'), state: o.yearOpen ? 'Focused' : undefined });
  const draw = o.draw || {};
  const carSec = col('Section', [await section('ยานพาหนะในแผน', { badge: 'ในแผน ' + nIn + ' คัน' })], 16);
  const pool = PICK_POOL();   // ยานพาหนะในแผนมาจากรายการเดียวกับ modal (ลำดับ 0–9 = CAND · ต่อด้วยยานพาหนะนอกพื้นที่ เช่น กองของ สนง. · 13 พ.ย. 2569 S1 A3)
  const inQ = (k) => pool.map((c, i) => [c, i]).filter(([, i]) => alloc[i] === k);
  const inPlan = pool.map((c, i) => [c, i]).filter(([, i]) => i in alloc);   // รวมคันที่ยังไม่จัดไตรมาส (alloc 0)
  const tk = o.ticked || [], chk = (i) => MOB && !o.ticked ? {} : { check: tk.indexOf(i) >= 0 };   // มือถือติ๊กเฉพาะจอที่กำลังเลือกหลายคัน (List with checkbox แบบเว็บ) · ปกติเป็นการ์ดมีปุ่ม …
  add(carSec, await tabs([['ทั้งหมด', nIn]].concat(QUARTERS.map((t, k) => ['ไตรมาส ' + (k + 1), inQ(k + 1).length])), q), 'h');
  const shown = (q ? inQ(q) : inPlan).filter(([c]) => inQuery(c, { query }));
  /* 6 พ.ย. 2569 เจ้าของงาน "บังคับให้กรอกอะใหล่ทุกคัน" ⇒ แท็บไตรมาสบอกกำหนดอะไหล่แล้วกี่คัน (กำหนด = เลือกไม่เบิก หรือเบิกแล้วมีรายการ) */
  const decided = (i) => draw[i] === 'none' || ((o.picks || {})[i] || []).length > 0 || (o.manualCars || []).indexOf(i) >= 0;
  const qDone = q ? inQ(q).filter(([, i]) => decided(i)).length : 0;
  const bulk = tk.length ? [{ text: 'กำหนดอะไหล่ (' + tk.length + ')' }] : [];   // R112 ปุ่มรองของ Table header แสดงเมื่อติ๊ก (เว็บ BACKLOG 64)
  add(carSec, await tableHeader(q ? { title: 'ยานพาหนะในไตรมาส ' + q, badge: 'กำหนดอะไหล่แล้ว ' + qDone + '/' + inQ(q).length + ' คัน', placeholder: 'เลขทะเบียน, ยี่ห้อ, รุ่น', query, add: 'เพิ่มยานพาหนะ', more: bulk }
    : { title: 'ยานพาหนะทั้งหมดในแผน', badge: nIn + ' คัน', placeholder: 'เลขทะเบียน, ยี่ห้อ, รุ่น', query, add: 'เพิ่มยานพาหนะ', more: bulk }), 'h');   // R111 แท็บทั้งหมด = เพิ่มเข้าแผน (ยังไม่จัดไตรมาส)
  if (shown.length) {
    const oils = o.oils || {}, picks = o.picks || {}, manualCars = o.manualCars || [];
    const rows = q
      ? shown.map(([c, i]) => { const pl = partList(i, picks, manualCars), oc = oilCell(oils[i]); const pc = draw[i] === 'none' ? 'ไม่เบิกอะไหล่' : partCell(pl); return [Object.assign({ text: c[0], sub: MOB ? 'น้ำมัน ' + (oc.text || oc) + ' · อะไหล่อื่นๆ ' + (pc.text || pc) : c[1] }, chk(i)), typeOf(c), c[2], oc, pc, { menu: 1, items: Q_MENU }]; })
      : shown.map(([c, i]) => { const qt = alloc[i] ? 'ไตรมาส ' + alloc[i] : 'ยังไม่จัดไตรมาส', pc = draw[i] === 'none' ? 'ไม่เบิกอะไหล่' : partCell(partList(i, picks, manualCars));
          return [Object.assign({ text: c[0], sub: MOB ? c[1] + ' · ' + qt : c[1] }, chk(i)), typeOf(c), c[2], { pill: [qt, alloc[i] ? 'Brand' : 'Gray'] }, pc, { menu: 1, items: MENU }]; });
    const t = await tblShort(q ? Q_COLS : PICK_COLS, rows, { pagination: rows.length });
    if (!MOB) headCheck(t, rows);
    add(carSec, t, 'h');
  } else if (query) add(carSec, await searchNotFound(), 'h');   // ไม่มีคันตรงคำค้น = Vehicle list - Search not found ของ UI Release#2
  else if (q) add(carSec, await noCarsInQ(q), 'h');
  else add(carSec, await noCarsInPlan(), 'h');
  /* อะไหล่ในไตรมาส n — 5 พ.ย. 2569 เจ้าของงาน "ให้เอารายการอะใหล่ออก เป็น empty ก่อน แล้วค่อยให้เลือกจัดการอะใหล่ ทีละคัน แล้วค่อยเอามาลงในรายการอะใหล่ตอนจะส่งอนุมัติ"
     9 พ.ย. 2569 เจ้าของงาน _"หน้าอะใหล่ทั้งไตรมาส ต้องรวมมาให้ด้วย ทั้งไตรมาส"_ ⇒ แท็บทั้งหมด = หัวข้อ "อะไหล่รวมทุกไตรมาส" รวมอะไหล่ของยานพาหนะทุกคันในแผน (qAgg บวกรายคัน) · คันที่ไม่เบิกไม่รวม */
  const inQs = Object.keys(alloc).map(Number).filter(i => !q || alloc[i] === q);
  const qRows = qAgg(inQs.filter(i => draw[i] !== 'none'), o.picks || {}, o.oils || {}, o.manualCars || []);
  const partsSec = col('Section', [await section(q ? 'อะไหล่ในไตรมาส ' + q : 'อะไหล่รวมทุกไตรมาส')], 16);   // 9 พ.ย. 2569 เจ้าของงาน "เอาเลขออกไปเลยได้ป่ะ" ⇒ ไม่มีตัวเลขจำนวนชนิด
  add(partsSec, qRows.length ? await tblShort(QPART_COLS, qRows) :
    await noParts(!q ? ALL_Q_PARTS_EMPTY : inQs.length ? 'จัดการอะไหล่ทีละคันจากปุ่ม … ที่แถวยานพาหนะ รายการจะรวมมาที่นี่' : 'เพิ่มยานพาหนะเข้าไตรมาสนี้ก่อน แล้วจึงจัดการอะไหล่ทีละคันได้'), 'h');
  /* รีวิว 5 พ.ย. 2569 "ต้องกรอกข้อมูลที่ require ครบถึงจะ enable ปุ่ม" + 6 พ.ย. 2569 "บังคับให้กรอกอะใหล่ทุกคัน"
     ⇒ ปุ่มบันทึกและส่งอนุมัติกดได้เมื่อ ชื่อแผน · ปีงบประมาณ · มียานพาหนะในแผนอย่างน้อย 1 คัน · ทุกคันกำหนดอะไหล่แล้ว (เบิกพร้อมรายการ หรือ ไม่เบิก)
     12 พ.ย. 2569 (R109) ตัดเงื่อนไข "ยานพาหนะในตารางต้องจัดครบ" (9 พ.ย. ค่ำ) — เพิ่มจาก modal เข้าไตรมาสทันที ไม่มีคันที่อยู่ในแผนแต่ยังไม่จัด
     13 พ.ย. 2569 (R111) เจ้าของงาน "ต้องจัดครบก่อน และต้องระบุอะไหล่รายคันให้ครบ" ⇒ กลับมาใช้ทุกคันต้องอยู่ในไตรมาส (alloc ไม่เป็น 0) */
  const complete = !!(v.name && v.year && nIn > 0 && Object.keys(alloc).every(i => alloc[i] > 0 && decided(+i)));
  add(page, col('Content', (o.alert ? [alertBox(...o.alert)] : []).concat([
    col('Section', [await section('ข้อมูลแผน'),
      row('Row', [field('ชื่อแผน', v.name, { placeholder: 'ระบุชื่อแผน', error: E('กรุณาระบุชื่อแผน') }), yr])], 16),
    carSec,
    partsSec,
    btnRow([['Secondary button', o.edit ? 'ยกเลิก' : 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกและส่งอนุมัติ', { size: 'lg', disabled: !complete }]])
  ]), 32), 'h');
  if (o.yearOpen) comboAt(scr, yr.findOne(n => n.name === 'Container') || yr, YEARS.map(y => [y, '', y === v.year]));
  if (o.pick) await planCarModal(scr, Object.assign({ q, alloc }, o.pick));   // q 0 = แท็บทั้งหมด เพิ่มเข้าแผน · q n = จัดเข้าไตรมาส n
  if (o.move) await moveQModal(scr, o.move);
  return scr;
}
/* modal "เพิ่มยานพาหนะเข้าไตรมาส n" (R109) — โครงตาม vehPickerModal ของปลั๊กอิน Overhaul (ภาพ "เพิ่มรถเข้า Purchase Order" ที่เจ้าของงานส่ง 12 พ.ย. 2569):
   Background overlay + กรอบ Modal 1140 (Modal Size=xl) + Modal header Alignment=Left ปุ่มปิด + Table header (ค้นหา + ปุ่มตัวกรอง Pill จำนวน + ชิป)
   + แผงตัวกรองกางในตัว modal (Input dropdown with badges ×3 ภาค เขต ประเภทยานพาหนะ placeholder "ทั้งหมด" + Tertiary ล้างตัวกรอง · Secondary ยกเลิก · Primary ตกลง — ไลบรารีไม่มีแผงตัวกรองใน Modal ทั้งก้อน แบบเดียวกับ R92 ของ Overhaul)
   + Table Lead checkbox ติ๊กทั้งหมดที่หัว (headCheck · indeterminate) + Table pagination หน้าละ 10 + Modal footer ยกเลิก / "เพิ่มเข้าไตรมาส n (k)"
   คอลัมน์ชุดเดียวกับ TripCarPicker ของเว็บ: ทะเบียน (บรรทัดรอง หน่วยงานเจ้าของยานพาหนะ) · ยี่ห้อ/รุ่น · บำรุงรักษาเครื่องจักรล่าสุด · ซ่อมเครื่องจักรล่าสุด
   ยานพาหนะ = ทุกคันที่ยังไม่อยู่ในแผนนี้ (X5 เพิ่มได้ทุกคัน) · มือถือ = bottom sheet (popupModal) · แผงตัวกรองบนมือถือ = filterPanel bottom sheet แบบเดิม
   o.filter = { regions, districts, types, open } แผงกางอยู่ · o.regions/districts/types = ตัวกรองที่กดตกลงแล้ว · o.query · o.ticked = ลำดับใน PICK_POOL() · o.full = ทุกคันอยู่ในแผนแล้ว */
const PICK_POOL = () => CAND.map(c => c.slice(0, 3)).concat(Q_EXTRA.map(c => c.slice(0, 3)));   // ฟังก์ชัน: Q_EXTRA ประกาศทีหลังในไฟล์   // ลำดับ 0–9 = CAND (ลำดับเดียวกับ alloc) · ต่อด้วยยานพาหนะนอกพื้นที่ของ E.19
const MA_HEAD = 'บำรุงรักษาเครื่องจักรล่าสุด', REPAIR_HEAD = 'ซ่อมเครื่องจักรล่าสุด', NO_HIST = 'ไม่มีข้อมูล';   // = vehicleHistory.ts ของเว็บ (BACKLOG 64)
const PICK_MODAL_COLS = [['ทะเบียน', 260], ['ยี่ห้อ/รุ่น', 0], [MA_HEAD, 220], [REPAIR_HEAD, 200]];
/* วันที่ของเครื่องจักร (ค่าสมมติ สูตรเดียวกับ vehicleHistory.ts ของเว็บ) — ค่าของ S24 ก่อน · ที่เหลือคำนวณจากลำดับ · ทุก 9 คันไม่มีประวัติบำรุงรักษา ทุก 5 คันไม่มีประวัติซ่อม */
const HIST_MA = { '82-1145': '18/06/2569', '81-2210': NO_HIST, '82-6789': NO_HIST, '80-4458': '01/10/2568', '82-7720': '02/02/2569' }, HIST_RP = { '82-1145': '02/09/2569' };
const histDate = (d, m, y) => String(d).padStart(2, '0') + '/' + String(y === 2569 && m > 10 ? m - 6 : m).padStart(2, '0') + '/' + y;
const lastMa = (c, i) => HIST_MA[c[0].split(' ')[0]] || (i % 9 === 4 ? NO_HIST : histDate(1 + ((i * 11) % 28), 1 + ((i * 7) % 12), 2567 + (i % 3)));
const lastRepair = (c, i) => HIST_RP[c[0].split(' ')[0]] || (i % 5 === 2 ? NO_HIST : histDate(1 + ((i * 13) % 28), 1 + ((i * 5) % 12), 2566 + (i % 4)));
const PICK_SEARCH = 'ค้นหาทะเบียน, ยี่ห้อ/รุ่น, หน่วยงาน';
/* ฟอร์มเลือกยานพาหนะกลาง (13 พ.ย. 2569 เจ้าของงาน "วิธีการเลือกรถเข้าไตรมาส ถูกต้องแล้ว แต่อยากให้เลือกรถเข้าแผน ใช้วิธีการเดียวกับเลือกรถเข้าไตรมาส"
   ทั้ง 3 จุด: แท็บทั้งหมดของฟอร์มแผน S1 S19 · popup เพิ่มยานพาหนะเข้าแผนเดินทาง S6 S9 · popup เพิ่มยานพาหนะที่หน้าไตรมาสของแผนที่อนุมัติแล้ว S6 · "ฟอร์มการเลือกรถอยากให้ใช้เหมือนกัน แต่ต่างกันที่ คอลัมน์")
   = modal เพิ่มยานพาหนะเข้าไตรมาสของ S1 (R109): Modal 1140 · Table header ค้นหา + ปุ่มตัวกรอง · แผงตัวกรองกาง (desktop) ภาค เขต ประเภทยานพาหนะ · ตาราง Lead checkbox แบ่งหน้า 10 · ปุ่มหลัก (k)
   o.items = [[ยานพาหนะ, ลำดับ]] ที่ให้เลือกก่อนกรอง · o.cols + o.cell(c, i) = คอลัมน์ของแต่ละจุด (ต่อจากทะเบียน) · o.taken = { ลำดับ: ชื่อแผนเดินทาง } แสดงแต่ติ๊กไม่ได้ · o.total = จำนวนเมื่อยังไม่กรอง
   o.regions districts types query = กรองแล้ว · o.filter = แผงค่าร่าง { …, open } · o.collapsed = หุบแผง · o.emptyText = [หัว, รอง] เมื่อไม่มีให้เลือก
   (ช่องเลือกไตรมาส "เพิ่มเข้าไตรมาส" ของแท็บทั้งหมด 13 พ.ย. 2569 R110 เลิกใช้ในวันเดียวกัน — R111 แท็บทั้งหมดเพิ่มเข้าแผนอย่างเดียว) */
async function pickModal(scr, o) {
  const f = { regions: o.regions || [], districts: o.districts || [], types: o.types || [], query: o.query || '' };
  const picked = f.regions.length || f.districts.length || f.types.length, ticked = o.ticked || [], taken = o.taken || {}, items = o.items || [];
  const pool = items.filter(([c]) => (!picked || inArea(c, f)) && inQuery(c, f));
  const shown = pool.slice(0, 10), total = picked || f.query || o.total == null ? pool.length : o.total;
  const rows = shown.map(([c, i]) => [{ check: !taken[i] && ticked.indexOf(i) >= 0, text: c[0], sub: taken[i] ? 'อยู่ในแผนเดินทาง ' + taken[i] : c[2], disabled: !!taken[i] }].concat(o.cell(c, i)));
  const chips = f.regions.map(shortRegion).concat(f.districts, f.types), n = ticked.filter(i => !taken[i]).length;
  /* 13 พ.ย. 2569 เจ้าของงาน "ใน modal ต้องมี filter แบบ ที่ตอนเลือก filter ของเดิม" + เลือก "ช่องเดิม S1 + กางไว้ตั้งแต่เปิด" ⇒ desktop แผงกางเสมอ ชิปซ่อนระหว่างแผงกาง (แบบเว็บ TripCarPicker) · มือถือ = bottom sheet เมื่อส่ง o.filter */
  const panel = !MOB && !o.collapsed;
  const fd = o.filter ? { regions: o.filter.regions || [], districts: o.filter.districts || [], types: o.filter.types || [], open: o.filter.open } : panel ? { regions: f.regions, districts: f.districts, types: f.types } : null;
  const body = [];
  if (items.length) body.push(await tableHeader({ placeholder: PICK_SEARCH, query: f.query, chips: panel ? [] : chips, filterCount: chips.length }));
  const fields = items.length && fd && [multiDropdown('ภาค', fd.regions, { placeholder: 'ทั้งหมด', optional: true, state: fd.open === 'region' ? 'Focused' : undefined }),
    multiDropdown('เขต', fd.districts, { placeholder: 'ทั้งหมด', optional: true, state: fd.open === 'district' ? 'Focused' : undefined }),
    multiDropdown('ประเภทยานพาหนะ', fd.types, { placeholder: 'ทั้งหมด', optional: true })];
  if (fields && !MOB) body.push(col('Filter panel', [row('Row', fields), btnRow([['Tertiary button', 'ล้างตัวกรอง'], ['Secondary button', 'ยกเลิก'], ['Primary button', 'ตกลง']])], 20));
  if (rows.length) { const t = await tblShort(o.cols, rows, { pagination: { shown: rows.length, total } }); headCheck(t, rows); body.push(t); }
  else if (!items.length) { const es = inst('Empty state/Data empty'); await text(es, 'Text', o.emptyText[0]); await text(es, 'Supporting text', o.emptyText[1]); const a = find(es, 'Actions'); if (a) a.visible = false; body.push(es); }
  else body.push(await searchNotFound());
  if (fields && MOB && o.filter) { await filterPanel(scr, fields); }   // มือถือ: แผงตัวกรอง bottom sheet ทับฟอร์ม (แบบเดิม R77)
  else await popupModal(scr, { title: o.title, sub: o.sub, w: 1140, body, ok: o.okText + (n ? ' (' + n + ')' : ''), okOff: !n });
  const at = (x) => x.findOne(y => y.name === 'Container') || x;
  if (fields) {
    if (fd.open === 'region') comboAt(scr, at(fields[0]), REGIONS.map(r => [r, '', fd.regions.indexOf(r) >= 0]));
    if (fd.open === 'district') comboAt(scr, at(fields[1]), (fd.regions.length ? fd.regions : REGIONS).flatMap(r => DISTRICTS[r]).map(d => [d, '', fd.districts.indexOf(d) >= 0]));   // เขตของทุกภาคที่เลือกรวมกัน · สนง. = 6 กอง (X3)
  }
}
/* modal ของฟอร์มแผน S1 S19 (R111 13 พ.ย. 2569 · ฟอร์มกลาง pickModal ชุดเดียวกัน ต่างกันที่รายการและข้อความ)
   แท็บทั้งหมด (o.q = 0) = "เพิ่มยานพาหนะเข้าแผน" — ยานพาหนะที่ยังไม่อยู่ในแผนนี้ เพิ่มได้ทุกคัน (X5) · ยังไม่กรอง = 370 คัน (ค่าสมมติแบบ E.19) · เพิ่มแล้วเป็นยังไม่จัดไตรมาส
   แท็บไตรมาส n = "เพิ่มยานพาหนะเข้าไตรมาส n" — เฉพาะยานพาหนะในแผนที่ยังไม่จัดไตรมาส (alloc 0) คันที่อยู่ไตรมาสอื่นไม่แสดง · ไม่มีให้เลือก = Data empty บอกให้เพิ่มเข้าแผนที่แท็บทั้งหมดก่อน */
async function planCarModal(scr, o) {
  const alloc = o.alloc || {}, all = PICK_POOL().map((c, i) => [c, i]);
  const items = o.q ? all.filter(([, i]) => alloc[i] === 0) : o.full ? [] : all.filter(([, i]) => !(i in alloc));
  await pickModal(scr, Object.assign({}, o, {
    items, cols: PICK_MODAL_COLS, cell: (c, i) => [c[1], lastMa(c, i), lastRepair(c, i)], total: o.q ? items.length : Q_EXTRA_TOTAL,
    title: o.q ? 'เพิ่มยานพาหนะเข้าไตรมาส ' + o.q : 'เพิ่มยานพาหนะเข้าแผน', sub: o.q ? 'ยานพาหนะในแผนที่ยังไม่จัดไตรมาส' : 'ยานพาหนะที่ยังไม่อยู่ในแผนนี้ เพิ่มได้ทุกคัน',
    okText: o.q ? 'เพิ่มเข้าไตรมาส ' + o.q : 'เพิ่มเข้าแผน',
    emptyText: !o.q ? ['ยานพาหนะทุกคันอยู่ในแผนแล้ว', 'ไม่มียานพาหนะที่เพิ่มเข้าแผนนี้ได้']
      : Object.keys(alloc).length ? ['ยานพาหนะในแผนจัดเข้าไตรมาสครบแล้ว', ADD_PLAN_FIRST] : ['ยังไม่มียานพาหนะในแผน', ADD_PLAN_FIRST] }));
}
/* popup ย้ายไปไตรมาสอื่น (R109 · เมนู … ของยานพาหนะในแท็บไตรมาส) — Radio text card ไตรมาส 1–4 แบบ popup จัดลงไตรมาสเดิม · ไตรมาสปัจจุบันของคันนั้น State=Disabled */
async function moveQModal(scr, o) {
  const c = CAND[o.car], sel = o.sel == null ? -1 : o.sel;
  const r = col('Radio', [], 12);
  QUARTERS.forEach((t, k) => add(r, inst('Radio text card', { State: k + 1 === o.cur ? 'Disabled' : 'Default', Selected: k === sel ? 'True' : 'False' }, { Text: t, Supporting: k + 1 === o.cur, 'Supporting text': 'ไตรมาสปัจจุบัน' }), 'h'));
  await popupModal(scr, { title: 'ย้ายไปไตรมาสอื่น · ' + c[0], sub: 'ยานพาหนะและอะไหล่ที่กำหนดไว้ของยานพาหนะคันนี้จะย้ายไปไตรมาสที่เลือก', body: [r], ok: 'ย้ายยานพาหนะ', okOff: sel < 0 });
}
const FILLED = { name: NEW_PLAN[1], year: '2570' };
const R2 = { regions: [REGIONS[1]] };   // พื้นที่ที่เลือก: ภาค 2 ทุกเขต → ตารางรถ 8 คัน (แบบ A 5 พ.ย. 2569)
const A_Q1 = { 0: 1, 1: 1, 2: 1 };                          // แท็บไตรมาส 1: เลือกไว้ 3 คัน
const A_PICKS = { 0: CAR_PICK, 1: CAR_PICK, 2: CAR_PICK, 3: CAR_PICK, 5: CAR_PICK, 6: CAR_PICK, 7: CAR_PICK, 8: CAR_PICK, 9: CAR_PICK };
const A_OILS = { 0: 2, 1: 0, 2: 2, 3: 0, 4: 0, 5: 1, 6: 0, 7: 0, 8: 1, 9: 0 };   // 5 พ.ย. 2569 82-6789 = เก็บตัวอย่างและเปลี่ยน ให้ตรงงานตัวอย่าง S10 (TRIP_OIL)   // น้ำมันไฮดรอลิกรายคัน (ลำดับใน JOB_OIL_OPTS) ที่กำหนดแล้ว · 5 พ.ย. 2569   // เลือกอะไหล่ครบทุกคันแล้ว
const Q3_ADD = [3, 5];   // R75 ติ๊กเพิ่มเข้าไตรมาส 3: 82-4410 ขอนแก่น · 84-5521 นครราชสีมา
const A_ALL = { 0: 1, 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 3, 7: 4, 8: 4, 9: 3 };   // 6 พ.ย. 2569 เจ้าของงาน "ต้องเอารถเข้า ไตรมาสทุกคัน" ⇒ รถทุกคันของหน่วยงาน (CAND 10 คัน) อยู่ในไตรมาส · เดิม 6 คัน ไตรมาส 4 ว่าง
/* การเบิกอะไหล่รายคัน (6 พ.ย. 2569 เจ้าของงาน "อยากเพิ่มการเบิก โดยอยากให้มีการเลือกว่า ว่าเบิกอะใหล่ หรือไม่เบิก ด้วย") · { ลำดับรถ: 'none' } = ไม่เบิกอะไหล่ · ไม่มีในนี้แต่มีอะไหล่ = เบิกอะไหล่ */
const A_DRAW = { 4: 'none' };       // จัดครบ: ไตรมาส 1 3 คัน · ไตรมาส 2 2 คัน · ไตรมาส 3 1 คัน · ไตรมาส 4 ว่าง · รถซ่อม (83-1207) ไม่อยู่ในแผน · มีรถจากเขตอื่น (สลับเขตแล้วเพิ่มต่อ)

/* ---------- S4 ความคืบหน้าและเบิกอะไหล่ของไตรมาส (2 พ.ย. 2569 รวม S5 เดิม · ตัดการตรวจรถ) ----------
   เจ้าของงาน: "S4 จะไม่ได้เป็นการตรวจความพร้อมของรถ แต่จะเป็นการตรวจความคืบหน้าอะไหล่แทน … เห็นว่าใน smart inventory มีจำนวนเท่าไร" + "รวบ s4 s5 เป็นหน้าเดียวกัน ยุบ S5 ออก"
   เฉพาะไตรมาสที่กำลังทำ · ตารางต้องเบิก เทียบคงเหลือ Smart Inventory · สถานะการเบิกรายรายการ · ปุ่มเบิก/จองในหน้าเดียวกัน
   o.picked = อะไหล่ของไตรมาส (ว่าง = ยังไม่มีในแผน) · o.result = 'short' | 'ok' · o.inv = 'API error' */
const Q_ALL = PARTS.map((_, i) => i);
const WD = { wait: ['รอเบิก', 'Gray'], reserved: ['จองแล้ว', 'Info'], taken: ['เบิกแล้ว', 'Success'], buy: ['รอจัดซื้อ', 'Warning'] };
const PROG_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['ต้องเบิก', 110], ['หน่วย', 90], ['คงเหลือ Smart Inventory', 200], ['ไม่พอ', 100], ['สถานะการเบิก', 150, 'Badge']];
async function partsProgress(name, o) {
  o = o || {};
  const picked = o.picked || [], down = o.inv === 'API error';
  const Q = o.q || NOW_Q, need = (i) => o.qty ? o.qty[i] : +PARTS[i][3], lack = (i) => o.qty ? Math.max(0, need(i) - +PARTS[i][5]) : shortOf(i);   // S25 (5 พ.ย. 2569): o.q = ไตรมาสอื่น · o.qty = จำนวนที่ต้องเบิกแทน PARTS · o.subs = { ลำดับอะไหล่: บรรทัดรอง } · o.cars = จำนวนรถของไตรมาส
  const st = (i) => o.result === 'ok' ? WD.taken : o.result === 'short' ? (shortOf(i) > 0 ? WD.buy : WD.reserved) : WD.wait;
  const { scr, page } = await shell(name, { title: 'ความคืบหน้าอะไหล่ · ' + Q, back: true, crumbs: [P[1], Q, 'ความคืบหน้าอะไหล่'] });   // 5 พ.ย. 2569 ต่อจากหน้า "ไตรมาส 1"
  const nodes = [alertBox('Info', 'คลังรับทราบรายการอะไหล่' + Q + ' แล้ว', 'ยานพาหนะ ' + (o.cars || NOW_CARS) + ' คันของไตรมาสนี้ · คลังรับทราบ 02/11/2569')];
  if (down) nodes.push(alertBox('Error', 'เชื่อมต่อ Smart Inventory ไม่ได้', 'ยังดูคงเหลือและเบิก/จองไม่ได้ ลองใหม่อีกครั้ง'));
  if (o.result === 'short') nodes.push(alertBox('Warning', 'จองได้ ' + picked.filter(i => !shortOf(i)).length + ' รายการ · คงเหลือไม่พอ ' + picked.filter(i => shortOf(i)).length + ' รายการ', 'ไส้กรองไฮดรอลิก ขาด ' + shortOf(1) + ' ชิ้น · ไส้กรองเชื้อเพลิง ขาด ' + shortOf(4) + ' ชิ้น — รอจัดซื้อแล้วเข้าคลัง'));
  if (o.result === 'ok') nodes.push(alertBox('Success', 'เบิกอะไหล่ครบแล้ว', 'เบิกจาก Smart Inventory ' + picked.length + ' รายการ · ไปทำแผนเดินทางของไตรมาสได้'));
  const sec = col('Section', [await sectionLabel('อะไหล่ที่ต้องเบิกใน' + Q, { badge: picked.length || null })], 16);
  if (picked.length) add(sec, await tblShort(PROG_COLS, picked.map(i => [(o.subs || {})[i] ? { text: PARTS[i][0], sub: o.subs[i] } : PARTS[i][0], PARTS[i][1], String(need(i)), PARTS[i][4], down ? '-' : PARTS[i][5], down || o.result === 'ok' || !lack(i) ? '-' : String(lack(i)), { pill: st(i) }])), 'h');
  else add(sec, await noParts('ไตรมาสนี้ยังไม่มีอะไหล่ในแผน เพิ่มอะไหล่ได้ที่แก้ไขแผน'), 'h');
  nodes.push(sec);
  // 3 พ.ย. 2569 เจ้าของงาน: ถอดการ์ดรูปแบบดำเนินการออกจาก S4 — ย้ายไปเลือกในฟอร์มแผนเดินทาง (S6 ดำเนินการเอง / S9 จ้างดำเนินการ) · ปุ่ม "ไปทำแผนเดินทาง" พาไปหน้าแผนเดินทางของไตรมาส
  nodes.push(btnRow(o.result === 'ok' ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ไปทำแผนเดินทาง', { size: 'lg' }]]
    : o.result === 'short' ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ไปทำแผนเดินทาง', { size: 'lg', disabled: true }]]
    : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'เบิก/จองอะไหล่', { size: 'lg', disabled: !picked.length || down }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- แดชบอร์ดแบบ VMS+ — ชุดวาดกราฟ/การ์ด (R106 · เจ้าของงาน 12 พ.ย. 2569) ----------
   เจ้าของงาน 12 พ.ย. 2569: "อยากให้ออกแบบเป็นสไตล์นี้ เฉยๆ วิธีการวิชชัลข้อมูล หรือวิธีการแสดงข้อมูล โดยไม่ต้องตรง component ของ pea ให้เฉพาะ dashboard ที่ทำสิ่งนี้ได้ หน้าอื่นๆ ยังคงต้องตาม component เหมือนเดิม"
   + "จากข้อมูลที่ได้มา อยากให้ปรับข้อมูลการแสดงให้สอดคล้องกับเรื่องการบำรุงรักษา" · ต้นแบบหน้าตา vmsplus.pea.co.th/dashboard (ภาพ + SPEC-maintenance-dashboards.md ใน ~/PEA/Maintain-D/userflow/figma-ref/vmsplus-dashboard-2569-11-12/)
   ข้อยกเว้นเฉพาะ S4 (บล็อก C) และ S24 (บล็อก W) — ชิ้นที่วาดเอง (สี่เหลี่ยม วงกลม/ส่วนโค้ง ข้อความ) ต้องอยู่ในกรอบชื่อขึ้นต้น DASH_BOX เท่านั้น ตัวตรวจ R106 ไม่ผ่านถ้าวาดนอกกรอบหรือนอกสองหน้านี้
   กรอบหน้า (Sidebar navigation · Header navigation · Page header) Tabs · Table header · Table · ปุ่ม · ป้าย · Featured icon · ไอคอน ยังเป็น instance ของไลบรารี
   สีทุกชิ้นผูกตัวแปรสีของไลบรารี (Color/surface|text|icon|border/…) ตอนจบจอด้วย bindDash() แบบ bindTones() — หาไม่ได้ใช้ค่าสีของตัวแปรนั้น (ค่าจากไฟล์ Component)
   การ์ดตัวเลขไล่เฉดใช้ค่าสีของตัวแปรคู่เดียวกัน (gradient stop ผูกตัวแปรไม่ได้) · ข้อความใช้ docText (IBM Plex Sans Thai ของโปรเจกต์) */
const DASH_BOX = { head: 'VMS+ head · ', alert: 'VMS+ alert · ', kpi: 'VMS+ KPI · ', chart: 'VMS+ chart · ', note: 'VMS+ note · ' };   // ชื่อกรอบที่ R106 ยอมให้มีชิ้นวาดเอง
const DASH_SCR = /^MT \/ (C\.\d+ · S4|W\.\d+ · S24) — /, DASH_IN = /^VMS\+ (head|alert|KPI|chart|note) · /;   // ตรงกับ drawnShapes ใน component-rules.json
/* [ตัวแปรสีของไลบรารี, ค่าสีของตัวแปรนั้นในไฟล์ Component] — สเกล brand / success / warning / error / info (ฟ้า) / gray เท่านั้น */
const VC = {
  brand: ['Color/surface/brand', '#A80689'], brand2: ['Color/icon/brand-secondary', '#CF07AA'], brandT: ['Color/text/brand', '#A80689'],
  success: ['Color/surface/success', '#17B26A'], successD: ['Color/icon/success', '#079455'],
  warning: ['Color/surface/warning', '#F79009'], warningT: ['Color/text/warning', '#DC6803'], warningBg: ['Color/surface/warning-secondary', '#FFFAEB'], warningLine: ['Color/border/warning', '#FEDF89'],
  error: ['Color/surface/error', '#F04438'], errorT: ['Color/text/error', '#D92D20'],
  info: ['Color/surface/info', '#6172F3'], infoT: ['Color/text/info', '#444CE7'], infoBg: ['Color/surface/info-secondary', '#EEF4FF'], infoLine: ['Color/border/info', '#C7D7FE'],
  gray: ['Color/icon/secondary', '#667085'], track: ['Color/surface/tertiary', '#EAECF0'], subtle: ['Color/surface/secondary-subtle', '#F9FAFB'], line: ['Color/border/secondary', '#EAECF0'],
  text: ['Color/text/primary', '#000000'], text2: ['Color/text/secondary', '#475467'], text3: ['Color/text/placeholder', '#98A2B3'], white: ['Color/surface/primary', '#FFFFFF'], onBrand: ['Color/text/primary-on-brand', '#FFFFFF']
};
const DASH_GRAD = { brand: ['brand', 'brand2'], success: ['successD', 'success'], warning: ['warningT', 'warning'], error: ['errorT', 'error'], info: ['infoT', 'info'], gray: ['text2', 'gray'] };   // การ์ดตัวเลข เข้ม → อ่อน
const DASH_TONES = ['brand', 'info', 'success', 'warning', 'error', 'gray'];   // สีแถวของกราฟแถบ (วนตามลำดับแบบ VMS+)
const dashAsof = () => 'ข้อมูล ณ ' + MA_TODAY.map((v, i) => i < 2 ? String(v).padStart(2, '0') : String(v)).join('/') + ' 07:00 น.';   // วันนี้ของข้อมูลสมมติ (MA_TODAY ของ S24)
const DASH_ARROW = 'keyboard_arrow_right-20-400-round';
let DASH_BIND = [];
const DASH_VAR = {};
const dSolid = (k) => ({ type: 'SOLID', color: rgbOf(VC[k][1]) });
function dPaint(n, k, prop) { n[prop || 'fills'] = [dSolid(k)]; DASH_BIND.push([n, prop || 'fills', k]); return n; }
async function bindDash() {   // ผูกตัวแปรสีของไลบรารีหลังประกอบจอ (แบบ bindTones) — หาไม่ได้คงค่าสี
  const list = DASH_BIND; DASH_BIND = [];
  for (const [n, p, k] of list) {
    if (!(k in DASH_VAR)) DASH_VAR[k] = await libVar(new RegExp('^' + VC[k][0].replace(/\//g, '\\/') + '$', 'i'));
    const v = DASH_VAR[k]; if (!v) continue;
    try { n[p] = [figma.variables.setBoundVariableForPaint(dSolid(k), 'color', v)]; } catch (e) { /* คงค่าสี */ }
  }
}
function dGrad(n, tone) {   // ไล่เฉดซ้าย → ขวา ของการ์ดตัวเลข
  const [a, b] = DASH_GRAD[tone] || DASH_GRAD.brand, c = (k) => Object.assign({ a: 1 }, rgbOf(VC[k][1]));
  n.fills = [{ type: 'GRADIENT_LINEAR', gradientTransform: [[1, 0, 0], [0, 1, 0]], gradientStops: [{ position: 0, color: c(a) }, { position: 1, color: c(b) }] }];
  return n;
}
async function dT(s, size, k, bold) { const t = await docText(String(s), size, VC[k][1], null, !bold); t.name = String(s).slice(0, 40); DASH_BIND.push([t, 'fills', k]); return t; }
function dF(name, dir, o) {
  o = o || {};
  const f = frame(name, dir, { gap: o.gap || 0, pad: o.pad || 0 });
  if (o.fill) dPaint(f, o.fill);
  if (o.stroke) { dPaint(f, o.stroke, 'strokes'); f.strokeWeight = o.sw || 1; f.strokeAlign = 'INSIDE'; }
  if (o.r) f.cornerRadius = o.r;
  if (dir === 'HORIZONTAL') f.counterAxisAlignItems = o.align || 'CENTER';
  return f;
}
function dAp(p, c, how) {   // grow = ยืดตามแกนหลัก · fill = เต็มกว้าง · stretch = สูงเท่าเพื่อนในแถว
  if (!c) return c;
  p.appendChild(c);
  try {
    if (how === 'grow') { c.layoutGrow = 1; if (c.type === 'TEXT') c.textAutoResize = 'HEIGHT'; }
    else if (how === 'fill') { c.layoutSizingHorizontal = 'FILL'; if (c.type === 'TEXT') c.textAutoResize = 'HEIGHT'; }
    else if (how === 'stretch') c.layoutAlign = 'STRETCH';
  } catch (e) { warn('จัดวางแดชบอร์ด ' + c.name, e); }
  return c;
}
function dFixW(f, w) { if (f.layoutMode === 'VERTICAL') f.counterAxisSizingMode = 'FIXED'; else f.primaryAxisSizingMode = 'FIXED'; f.resize(Math.max(1, Math.round(w)), Math.max(1, f.height || 1)); return f; }
function dRect(w, h, k, r) { const n = figma.createRectangle(); CREATED.push(n); n.name = 'แถบ'; n.resize(Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); if (r) n.cornerRadius = r; dPaint(n, k); return n; }
function dDot(k, d) { const e = figma.createEllipse(); CREATED.push(e); e.name = 'จุดสี'; e.resize(d || 8, d || 8); dPaint(e, k); return e; }
async function dTxtW(s, size, k, w, align, bold) { const t = await dT(s, size, k, bold); t.textAutoResize = 'HEIGHT'; t.resize(Math.max(1, Math.round(w)), t.height || size + 6); t.textAlignHorizontal = align || 'LEFT'; return t; }
function fIcon(color, name, size) { const fi = inst('Featured icon', { Color: color, Size: size || 'sm' }); if (name && has(name)) setProps(fi, { 'Icon swap': icon(name) }); return fi; }
function wIcon(name) {   // ไอคอนของไลบรารีสีขาวบนการ์ดไล่เฉด (override สีชั้นใน instance)
  if (!name || !has(name)) return null;
  const ic = inst(name);
  ic.findAll(n => /VECTOR|BOOLEAN_OPERATION|ELLIPSE|RECTANGLE|POLYGON|STAR/.test(n.type) && (n.fills || []).length).forEach(v => { try { dPaint(v, 'onBrand'); } catch (e) { /* คงสีเดิม */ } });
  return ic;
}
const dFmt = (n) => Number(n).toLocaleString('en-US');
const dPct = (v, t) => (t ? (v * 100 / t).toFixed(1) : '0.0') + '%';
function dashW(scr) {   // กว้างเนื้อหาของหน้า (จอ − Sidebar − ขอบ 32 สองข้าง) · มือถือ 402 − 32
  if (MOB) return VW() - 32;
  const sb = scr.findOne(n => n.type === 'INSTANCE' && n.name === 'Sidebar navigation');
  return 1440 - (sb && sb.width > 40 && sb.width < 400 ? Math.round(sb.width) : 80) - 64;
}
/* หัวแดชบอร์ด: กรอบไอคอนสี + ชื่อ + บรรทัดอธิบาย · ขวา ป้าย "ข้อมูล ณ …" จุดเขียว */
async function dashHead(o) {
  const h = dF(DASH_BOX.head + o.title, MOB ? 'VERTICAL' : 'HORIZONTAL', { gap: 16 });
  const left = dF('ชื่อ', 'HORIZONTAL', { gap: 16, align: 'MIN' });
  dAp(left, fIcon('Brand', o.icon, 'md'));
  const tx = dF('ข้อความ', 'VERTICAL', { gap: 4 });
  dAp(tx, await dT(o.title, MOB ? 20 : 24, 'text', true), 'fill'); dAp(tx, await dT(o.desc, MOB ? 12 : 14, 'text2'), 'fill');
  dAp(left, tx, 'grow'); dAp(h, left, MOB ? 'fill' : 'grow');
  const asof = dF('ข้อมูล ณ', 'HORIZONTAL', { gap: 8, pad: [6, 12], r: 999, stroke: 'line', fill: 'white' });
  dAp(asof, dDot('success', 8)); dAp(asof, await dT(dashAsof(), 12, 'text2'));
  dAp(h, asof);
  return h;
}
/* เรื่องที่ควรดู: การ์ด 2 คอลัมน์ (มือถือ 1) เหลือง = ต้องรีบดู · ฟ้า = ข้อมูลไม่ครบ · ไม่มีเรื่อง (n = 0) ไม่แสดงการ์ดนั้น · active = เรื่องที่กดแล้ว (กรองทั้งหน้า) */
async function dashAlerts(items, active) {
  items = items.filter(x => x.n > 0);
  if (!items.length) return null;
  const box = dF(DASH_BOX.alert + 'เรื่องที่ควรดู', 'VERTICAL', { gap: 16, pad: MOB ? 16 : 24, r: 16, stroke: 'line', fill: 'white' });
  const hd = dF('หัว', 'HORIZONTAL', { gap: 8 });
  dAp(hd, fIcon('Warning', 'event_busy-24-300-round', 'sm')); dAp(hd, await dT('เรื่องที่ควรดู', 16, 'text', true));
  dAp(hd, inst('Pill outline', { Color: 'Gray' }, { Text: items.length + ' เรื่อง' }));
  dAp(box, hd, 'fill');
  const per = MOB ? 1 : 2;
  for (let i = 0; i < items.length; i += per) {
    const r = dF('แถว', 'HORIZONTAL', { gap: 12, align: 'MIN' });
    for (const it of items.slice(i, i + per)) {
      const warnT = it.tone !== 'info', on = it.key === active;
      const c = dF('เรื่อง · ' + it.title, 'HORIZONTAL', { gap: 12, pad: [12, 16], r: 12, fill: warnT ? 'warningBg' : 'infoBg', stroke: on ? (warnT ? 'warning' : 'info') : (warnT ? 'warningLine' : 'infoLine'), sw: on ? 2 : 1 });
      dAp(c, fIcon(warnT ? 'Warning' : 'Info', it.icon, 'sm'));
      const t = dF('ข้อความ', 'VERTICAL', { gap: 2 });
      dAp(t, await dT(it.title, 14, warnT ? 'warningT' : 'infoT', true), 'fill'); dAp(t, await dT(it.sub, 12, 'text2'), 'fill');
      dAp(c, t, 'grow');
      if (has(DASH_ARROW)) dAp(c, inst(DASH_ARROW));
      dAp(r, c, 'grow'); dAp(r, c, 'stretch');
    }
    if (per === 2 && items.length - i === 1) dAp(r, dF('ว่าง', 'HORIZONTAL', {}), 'grow');   // เรื่องเดียวในแถว = ครึ่งความกว้างแบบ VMS+
    dAp(box, r, 'fill');
  }
  return box;
}
/* ตัวกรองที่เลือก (หลังกดกราฟ/เรื่องที่ควรดู/แผงตัวกรอง): "n ตัวกรอง" · ชิป Badge outline with remove icon · ล้างทั้งหมด (Tertiary button) */
async function dashChips(chips) {
  if (!chips || !chips.length) return null;
  const box = dF(DASH_BOX.head + 'ตัวกรองที่เลือก', 'HORIZONTAL', { gap: 8, pad: [12, 16], r: 12, fill: 'subtle', stroke: 'line', align: 'CENTER' });
  if (MOB) { box.layoutMode = 'VERTICAL'; box.counterAxisAlignItems = 'MIN'; }
  dAp(box, await dT('ตัวกรองที่เลือก:', 13, 'text2', true));
  const cs = dF('ชิป', 'HORIZONTAL', { gap: 8 });
  for (const c of chips) dAp(cs, has('Badge outline with remove icon') ? inst('Badge outline with remove icon', { Color: 'Brand' }, { Text: c }) : await dT(c, 13, 'brandT', true));
  dAp(box, cs, MOB ? 'fill' : 'grow');
  dAp(box, inst('Pill outline', { Color: 'Brand' }, { Text: chips.length + ' ตัวกรอง' }));
  dAp(box, btn('Tertiary button', 'ล้างทั้งหมด', {}));
  return box;
}
/* การ์ดตัวเลขไล่เฉด: ไอคอน + ชื่อ · ตัวเลขใหญ่ + หน่วย · บรรทัดรอง — desktop เรียงแถวเดียว · มือถือ 2 ใบต่อแถว */
async function dashKpis(items) {
  const box = dF(DASH_BOX.kpi + 'การ์ดตัวเลข', 'VERTICAL', { gap: 12 });
  const per = MOB ? 2 : items.length;
  for (let i = 0; i < items.length; i += per) {
    const r = dF('แถว', 'HORIZONTAL', { gap: MOB ? 12 : 16, align: 'MIN' });
    for (const it of items.slice(i, i + per)) {
      const c = dF('การ์ด · ' + it.label, 'VERTICAL', { gap: 6, pad: MOB ? 12 : 16, r: 12 }); dGrad(c, it.tone);
      const hd = dF('หัว', 'HORIZONTAL', { gap: 6 });
      dAp(hd, wIcon(it.icon)); dAp(hd, await dT(it.label, 13, 'onBrand', true), 'grow'); dAp(c, hd, 'fill');
      const v = dF('ตัวเลข', 'HORIZONTAL', { gap: 4, align: 'MAX' });
      dAp(v, await dT(it.value, MOB ? 24 : 28, 'onBrand', true)); if (it.unit) dAp(v, await dT(it.unit, 13, 'onBrand'));
      dAp(c, v, 'fill');
      if (it.sub) { const s = await dT(it.sub, 12, 'onBrand'); s.opacity = 0.85; dAp(c, s, 'fill'); }
      dAp(r, c, 'grow'); dAp(r, c, 'stretch');
    }
    dAp(box, r, 'fill');
  }
  return box;
}
/* ปุ่มสลับในหัวการ์ด (หน่วยงาน / เขต) */
async function dashToggle(labels, on) {
  const t = dF('สลับ', 'HORIZONTAL', { gap: 2, pad: 2, r: 8, fill: 'subtle', stroke: 'line' });
  for (const [i, l] of labels.entries()) { const s = dF(l, 'HORIZONTAL', { pad: [4, 10], r: 6, fill: i === on ? 'white' : null }); dAp(s, await dT(l, 12, i === on ? 'brandT' : 'text2', i === on)); dAp(t, s); }
  return t;
}
/* การ์ดกราฟ: หัว Featured icon + ชื่อ + บรรทัดรอง (+ ปุ่มสลับ) · เนื้อ = build(กว้างด้านใน) · ท้าย "ข้อมูลจาก … | คลิกกราฟหรือรายการเพื่อกรองทั้งหน้า" */
async function chartCard(w, o) {
  const pad = MOB ? 16 : 24, c = dF(DASH_BOX.chart + o.title, 'VERTICAL', { gap: 16, pad, r: 16, stroke: 'line', fill: 'white' });
  dFixW(c, w);
  const hd = dF('หัว', 'HORIZONTAL', { gap: 12, align: 'MIN' });
  dAp(hd, fIcon(o.color || 'Brand', o.icon, 'sm'));
  const tx = dF('ชื่อ', 'VERTICAL', { gap: 2 }); dAp(tx, await dT(o.title, 16, 'text', true), 'fill'); if (o.sub) dAp(tx, await dT(o.sub, 12, 'text3'), 'fill');
  dAp(hd, tx, 'grow');
  if (o.toggle) dAp(hd, await dashToggle(o.toggle[0], o.toggle[1]));
  dAp(c, hd, 'fill');
  for (const n of await o.build(w - pad * 2)) if (n) dAp(c, n, n.layoutMode ? 'fill' : undefined);
  if (o.more) dAp(c, await dT(o.more, 13, 'brandT', true));
  const ft = dF('ท้าย', 'VERTICAL', { gap: 0 }); dAp(ft, await dT((o.src || 'ข้อมูลจากแผนบำรุงรักษาในระบบ') + '  |  คลิกกราฟหรือรายการเพื่อกรองทั้งหน้า', 12, 'text3'), 'fill');
  dAp(c, ft, 'fill');
  return c;
}
/* วางการ์ดกราฟเป็นแถว (desktop 3 ช่องต่อแถว span 1–3 · มือถือทีละใบเต็มกว้าง) — กว้างคำนวณจากกว้างเนื้อหาของหน้า */
async function chartGrid(W, specs) {
  const box = frame('กราฟ', 'VERTICAL', { gap: MOB ? 16 : 24 }), gap = 24, unit = (W - gap * 2) / 3;
  let row = null, used = 3;
  for (const sp of specs.filter(Boolean)) {
    const span = MOB ? 3 : sp.span || 1, w = MOB ? W : unit * span + gap * (span - 1);
    if (MOB || used + span > 3) { row = frame('แถว', 'HORIZONTAL', { gap }); row.counterAxisAlignItems = 'MIN'; dAp(box, row, 'fill'); used = 0; }
    const c = await chartCard(w, sp); dAp(row, c); dAp(row, c, 'stretch'); used += span;
  }
  return box;
}
/* แถบแนวนอนต่อแถว: จุดสี · ชื่อ · จำนวน หน่วย · % · แถบ (ยาวตามค่ามากสุด) · บรรทัดรอง · dim = ไม่อยู่ในตัวกรองที่กด */
function dTrack(w, h, segs) {
  const t = frame('ราง', null); dPaint(t, 'track'); t.cornerRadius = h / 2; t.resize(Math.max(1, Math.round(w)), h); let x = 0;
  for (const [f, k] of segs) { const bw = Math.round(w * f); if (bw < 1) continue; const b = dRect(bw, h, k, h / 2); t.appendChild(b); b.x = x; b.y = 0; x += bw; }
  return t;
}
async function hBars(w, rows, o) {
  o = o || {};
  const box = dF('แถบแนวนอน', 'VERTICAL', { gap: 14 }), max = Math.max(1, ...rows.map(r => r.value)), tot = o.total || rows.reduce((a, r) => a + r.value, 0);
  for (const [i, r] of rows.entries()) {
    const k = r.tone || DASH_TONES[i % DASH_TONES.length], it = dF('แถว · ' + r.label, 'VERTICAL', { gap: 6 });
    const top = dF('ชื่อ', 'HORIZONTAL', { gap: 8 });
    dAp(top, dDot(k, 8)); dAp(top, await dT(r.label, 13, 'text'), 'grow'); dAp(top, await dT(dFmt(r.value), 13, 'text', true)); dAp(top, await dT(r.unit || o.unit || '', 12, 'text3'));
    dAp(top, await dTxtW(dPct(r.value, tot), 12, 'text3', 52, 'RIGHT'));
    dAp(it, top, 'fill');
    dAp(it, dTrack(w, 6, [[r.value / max, k]]));
    if (r.sub) dAp(it, await dT(r.sub, 12, 'text3'), 'fill');
    if (r.dim) it.opacity = 0.35;
    dAp(box, it, 'fill');
  }
  return box;
}
/* ตารางคำอธิบาย (สี · ชื่อ · จำนวน · %) ใต้โดนัท/แท่ง · total = แถวรวมท้าย */
async function dLegend(rows, heads, o) {
  o = o || {};
  const tot = rows.reduce((a, r) => a + r.value, 0), box = dF('คำอธิบาย', 'VERTICAL', { gap: 10 });
  const hd = dF('หัวตาราง', 'HORIZONTAL', { gap: 8 }); dAp(hd, await dT(heads[0], 12, 'text3'), 'grow'); dAp(hd, await dTxtW(heads[1], 12, 'text3', 96, 'RIGHT')); dAp(hd, await dTxtW('%', 12, 'text3', 52, 'RIGHT')); dAp(box, hd, 'fill');
  for (const [i, r] of rows.entries()) {
    const ln = dF('แถว · ' + r.label, 'HORIZONTAL', { gap: 8 });
    dAp(ln, dDot(r.tone || DASH_TONES[i % DASH_TONES.length], 8)); dAp(ln, await dT(r.label, 13, 'text'), 'grow');
    dAp(ln, await dTxtW(dFmt(r.value), 13, 'text', 96, 'RIGHT', true)); dAp(ln, await dTxtW(dPct(r.value, tot), 12, 'text3', 52, 'RIGHT'));
    if (r.dim) ln.opacity = 0.35;
    dAp(box, ln, 'fill');
  }
  if (o.total) { const ln = dF('รวม', 'HORIZONTAL', { gap: 8 }); dAp(ln, await dT('รวม', 13, 'text', true), 'grow'); dAp(ln, await dTxtW(dFmt(tot), 13, 'text', 96, 'RIGHT', true)); dAp(ln, await dTxtW('100%', 12, 'text3', 52, 'RIGHT')); dAp(box, ln, 'fill'); }
  return box;
}
/* โดนัท + ตัวเลขรวมตรงกลาง + ตารางคำอธิบาย (ส่วนโค้ง = ELLIPSE arcData) */
async function donut(w, segs, o) {
  const D = Math.min(o.size || 176, Math.round(w)), ring = frame('โดนัท', null); ring.resize(D, D);
  const tot = segs.reduce((a, s) => a + s.value, 0); let a = -Math.PI / 2;
  const arc = (from, to, k) => { const e = figma.createEllipse(); CREATED.push(e); e.name = 'ส่วนโค้ง'; e.resize(D, D); e.arcData = { startingAngle: from, endingAngle: to, innerRadius: 0.7 }; dPaint(e, k); ring.appendChild(e); e.x = 0; e.y = 0; return e; };
  if (!tot) arc(0, Math.PI * 2, 'track');
  for (const [i, s] of segs.entries()) { if (!s.value) continue; const sw = s.value / tot * Math.PI * 2; const e = arc(a, a + sw, s.tone || DASH_TONES[i % DASH_TONES.length]); if (s.dim) e.opacity = 0.3; a += sw; }
  const c1 = await dTxtW(dFmt(tot), 24, 'text', D, 'CENTER', true); ring.appendChild(c1); c1.x = 0; c1.y = Math.round(D / 2 - 24);
  const c2 = await dTxtW(o.unit, 12, 'text3', D, 'CENTER'); ring.appendChild(c2); c2.x = 0; c2.y = Math.round(D / 2 + 6);
  const wrap = dF('โดนัทกลาง', 'VERTICAL', { gap: 0 }); wrap.counterAxisAlignItems = 'CENTER'; dAp(wrap, ring);   // ผู้เรียกวางเต็มกว้าง ⇒ วงอยู่กลางการ์ด
  return [wrap, await dLegend(segs, o.heads || ['สถานะ', 'จำนวน (' + o.unit + ')'])];
}
/* แท่งแนวตั้ง (ซ้อนได้) + แกนตัวเลข + ป้ายใต้แท่ง · groups [{ label, vals: [ต่อ series], dim }] · series [{ label, tone }] */
const dNice = (m) => { if (m <= 5) return Math.max(1, m); const p = Math.pow(10, Math.floor(Math.log10(m))); for (const s of [1, 2, 2.5, 5, 10]) if (s * p >= m) return s * p; return 10 * p; };
async function vBars(w, groups, series, o) {
  o = o || {};
  const H = o.h || 168, top = 8, axisW = 36, lab = 34, chart = frame('กราฟแท่ง', null); chart.resize(Math.round(w), top + H + lab);
  const max = dNice(Math.max(1, ...groups.map(g => g.vals.reduce((a, v) => a + v, 0)))), steps = max <= 5 ? max : max % 4 === 0 ? 4 : 5;   // เส้นแกนตกเลขกลม (เช่น 10 → ทีละ 2 · 20 → ทีละ 5)
  for (let i = 0; i <= steps; i++) {
    const y = Math.round(top + H - H * i / steps), ln = dRect(w - axisW, 1, 'line'); chart.appendChild(ln); ln.x = axisW; ln.y = y;
    const t = await dTxtW(dFmt(Math.round(max * i / steps * 10) / 10), 11, 'text3', axisW - 8, 'RIGHT'); chart.appendChild(t); t.x = 0; t.y = y - 8;
  }
  const slot = (w - axisW) / groups.length, bw = Math.max(8, Math.min(44, Math.round(slot * 0.56)));
  for (const [gi, g] of groups.entries()) {
    const x = Math.round(axisW + slot * gi + (slot - bw) / 2); let y = top + H; const segs = [];
    for (const [si, v] of g.vals.entries()) { const bh = Math.round(H * v / max); if (!bh) continue; y -= bh; const r = dRect(bw, bh, series[si].tone, 0); chart.appendChild(r); r.x = x; r.y = y; segs.push(r); if (g.dim) r.opacity = 0.3; }
    const last = segs[segs.length - 1]; if (last) { last.topLeftRadius = 4; last.topRightRadius = 4; }
    const t = await dTxtW(g.label, 11, 'text2', Math.max(24, Math.round(slot - 4)), 'CENTER'); chart.appendChild(t); t.x = Math.round(axisW + slot * gi + 2); t.y = top + H + 8;
  }
  const out = [chart];
  if (series.length > 1) {
    const lg = dF('คำอธิบายสี', 'HORIZONTAL', { gap: 16 });
    for (const s of series) { const it = dF(s.label, 'HORIZONTAL', { gap: 6 }); dAp(it, dDot(s.tone, 8)); dAp(it, await dT(s.label, 12, 'text2')); dAp(lg, it); }
    out.push(lg);
  }
  return out;
}
/* แถบซ้อนต่อแถว (ความคืบหน้าของแผน): ชื่อ · x/y · แถบหลายสีต่อกัน */
async function stackRows(w, rows, series) {
  const box = dF('แถบซ้อน', 'VERTICAL', { gap: 16 });
  for (const r of rows) {
    const tot = r.vals.reduce((a, v) => a + v, 0), it = dF('แถว · ' + r.label, 'VERTICAL', { gap: 6 });
    const top = dF('ชื่อ', 'HORIZONTAL', { gap: 8 }); dAp(top, await dT(r.label, 13, 'text', true), 'grow'); dAp(top, await dT(r.right, 12, 'text2')); dAp(it, top, 'fill');
    dAp(it, dTrack(w, 10, r.vals.map((v, i) => [tot ? v / tot : 0, series[i].tone])));
    if (r.sub) dAp(it, await dT(r.sub, 12, 'text3'), 'fill');
    if (r.dim) it.opacity = 0.35;
    dAp(box, it, 'fill');
  }
  const lg = dF('คำอธิบายสี', 'HORIZONTAL', { gap: 16 });
  for (const s of series) { const it = dF(s.label, 'HORIZONTAL', { gap: 6 }); dAp(it, dDot(s.tone, 8)); dAp(it, await dT(s.label, 12, 'text2')); dAp(lg, it); }
  dAp(box, lg);
  return box;
}
async function dashNote(s) { const n = dF(DASH_BOX.note + 'แหล่งข้อมูล', 'VERTICAL', { gap: 0 }); n.counterAxisAlignItems = 'CENTER'; const t = await dT(s, 12, 'text3'); t.textAlignHorizontal = 'CENTER'; dAp(n, t, 'fill'); return n; }

/* ---------- S4 แดชบอร์ดอะไหล่และความคืบหน้าของแผนที่อนุมัติแล้ว (6 พ.ย. 2569 · แทนหน้าความคืบหน้าอะไหล่รายไตรมาส partsProgress) ----------
   รีวิว 6 พ.ย. 2569 (บล็อก C): "เปลี่ยนหน้านี้เป็นหน้า รวมอะใหล่ของแผนที่อนุมัติแล้ว" + "filter หน่วยงานผู้ขอเบิก เขต,แผน, ค้นหาจาก ชื่ออะใหล่ รหัสอะใหล่ ssorting ทุกคอลัมม์" + "export pdf excel"
   + "เลือกแผน, ติดตามความคืบหน้า" · เจ้าของงานเคาะ: หน้าที่จาก Smart Inventory เปลี่ยนเป็นแดชบอร์ด ไม่แสดงค่าจาก Smart Inventory · แท็บรวมตามรายการ / แยกรายคัน
   + ความคืบหน้า "ไตรมาส มีกี่แผนการเดินทาง แต่ละแผนความคืบหน้าเป็นอย่างไร" (ให้คิดแบบที่เหมาะจากของเดิม) ⇒ แท็บที่ 3 แถว = 1 ไตรมาสของ 1 แผน กดไปหน้าไตรมาส n (เห็นแผนเดินทางและสถานะรายใบ)
   โครง = MA Dashboard - Default ของหน้า MA Overview ใน UI Release#2 (Page header → Tabs → Metric item → Table header → Table → pagination) แบบเดียวกับแดชบอร์ด Overhaul (R22)
   ปุ่ม "ส่งออก" ใน Table header ข้างปุ่มตัวกรอง (ปุ่มรายงานของ Vehicle list 5.2 · MA Overview ใน UI Release#2 · ไอคอน download) · popup + เฟรมหน้าตาไฟล์แบบ S18 ของ Overhaul (R32)
   ทุกคอลัมน์เรียงได้ (Table header cell Sort icon แบบ MA Overview: คอลัมน์แรก Down ที่เหลือ Swap) · ตารางรวมตามรายการใช้ QPART_COLS ชุดเดียวกับทุกหน้า (R81) · ข้อมูลเป็นค่าสมมติ */
const DASH_PLANS = () => [planAs('approved'), PLANS[0], PLANS[1]];   // แผนที่อนุมัติแล้วของปีงบประมาณ 2570 (ค่าสมมติ)
const DASH_TABS = ['รวมตามรายการ', 'แยกรายคัน', 'ความคืบหน้าของแผน'];
const sortAll = (cols) => cols.map((c, i) => c[0] ? [c[0], c[1], c[2] || 'Text', i === 0 ? 'Down' : 'Swap'] : c);
const DASH_AGG = PARTS.map((p, i) => [p[0], p[1], p[2], String([540, 60, 60, 54, 16][i]), p[4]]).concat([[MANUAL.name, MANUAL.code || '-', 'เพิ่มเอง', '4', 'ชิ้น']]);   // ยอดรวมทุกแผน (ค่าสมมติ) · คันที่ไม่เบิกอะไหล่ไม่รวม
const DASH_CAR_COLS = [['ทะเบียน', 170, 'Lead text'], ['เลขที่ MR', 140], ['ไตรมาส', 100], ['ชนิด', 0], ['รหัสอะไหล่', 130], ['ประเภท', 110], ['จำนวน', 100], ['หน่วย', 90]];
const DASH_CAR_ROWS = () => [].concat(...[0, 1, 2].map(i => (A_OILS[i] === 1 || A_OILS[i] === 2 ? [0] : []).concat((A_PICKS[i] || []).filter(x => x !== 0))
  .map(x => [CAND[i][0], { text: NP[0], sub: PLAN_UNIT[NP[0]] }, 'ไตรมาส ' + A_ALL[i], PARTS[x][0], PARTS[x][1], PARTS[x][2], x === 0 ? OIL_SPEC.litre : String(CAR_QTY[x]), PARTS[x][4]])));
const QST = { todo: ['ยังไม่เริ่ม', 'Gray'], doing: ['กำลังดำเนินการ', 'Info'], done: ['เสร็จแล้ว', 'Success'] };
const DASH_PROG_COLS = [['เลขที่ MR', 150, 'Lead text'], ['ชื่อแผน', 0], ['ไตรมาส', 110], ['แผนเดินทาง', 120], ['ยานพาหนะบำรุงรักษาแล้ว', 200], ['สถานะ', 150, 'Badge'], ['', 60]];
/* [เลขที่ MR, ไตรมาส, แผนเดินทาง (ใบ), บำรุงรักษาแล้ว, ยานพาหนะในไตรมาส, สถานะ] — ค่าสมมติ · MRZ7000001 ไตรมาส 1 ตรงกับหน้าไตรมาส 1 (แผนเดินทาง 2 ใบ) */
const DASH_PROG = [['MRZ7000001', 1, 2, 4, 6, 'doing'], ['MRZ7000001', 2, 0, 0, 3, 'todo'], ['MRZ7000001', 3, 0, 0, 2, 'todo'], ['MRZ7000001', 4, 0, 0, 1, 'todo'],
  ['MRZ7000004', 1, 1, 0, 3, 'doing'], ['MRZ7000004', 2, 0, 0, 3, 'todo'], ['MRZ7000004', 3, 0, 0, 2, 'todo'], ['MRZ7000004', 4, 0, 0, 2, 'todo'],
  ['MRZ7000002', 2, 1, 0, 4, 'doing'], ['MRZ7000002', 3, 0, 0, 2, 'todo']];
/* ใครเห็นอะไร (เจ้าของงาน 10 พ.ย. 2569 "ผู้สร้างแผนเห็นเฉพาะแผนของหน่วยงานตัวเอง ยกเว้น กบค จะเห็นแผนของหน่วยงานอื่นด้วย แต่แก้ไขไม่ได้")
   ค่าเริ่มต้นของจอ = ผู้ใช้ กบผ. เห็นเฉพาะแผนของ กบผ. ไม่มีตัวกรองหน่วยงาน · o.kbk = ผู้ใช้ กบค. เห็นทุกหน่วยงาน มีตัวกรองหน่วยงานผู้ขอเบิก (แดชบอร์ดดูอย่างเดียวทุกบทบาท) */
const DASH_OWN = 'กบผ.';
const dashMine = (kbk) => (r) => kbk || PLAN_UNIT[r[0]] === DASH_OWN;
const dashProgRow = (r) => { const p = DASH_PLANS().find(x => x[0] === r[0]); return [{ text: r[0], sub: PLAN_UNIT[r[0]] }, p[1], 'ไตรมาส ' + r[1], r[2] + ' ใบ', r[3] + '/' + r[4] + ' คัน', { pill: QST[r[5]] }, GO]; };
const DASH_HINT = ['ค้นหาชื่ออะไหล่, รหัสอะไหล่', 'ค้นหาทะเบียน, ชื่ออะไหล่, รหัสอะไหล่', 'ค้นหาเลขที่ MR, ชื่อแผน'];
async function metric(text, number, color) {   // Metric item (Breakpoint ตามจอ) + สี Featured icon ที่ซ้อนอยู่ — ยกจาก overhaul2-plugin (R22)
  const m = inst('Metric item', { Breakpoint: BP() }, { Number: String(number), Text: text });
  const fi = find(m, 'Featured icon'); if (fi) setProps(fi, { Color: color || 'Brand' });
  return m;
}
function metricRow(items) {   // desktop: 4 ใบเต็มแถว gap 24 (MA Overview) · mobile: 2 ใบต่อแถว gap 12 — ยกจาก overhaul2-plugin
  if (MOB) {
    const box = frame('Metrics', 'VERTICAL', { gap: 12 });
    for (let i = 0; i < items.length; i += 2) { const r = frame('Row', 'HORIZONTAL', { gap: 12 }); items.slice(i, i + 2).forEach(m => { r.appendChild(m); m.layoutGrow = 1; }); add(box, r, 'h'); }
    return box;
  }
  const r = frame('Metrics', 'HORIZONTAL', { gap: 24 }); items.forEach(m => { r.appendChild(m); m.layoutGrow = 1; }); return r;
}
const DASH_TABLE = (tab, kbk) => tab === 0 ? [sortAll(QPART_COLS), DASH_AGG] : tab === 1 ? [sortAll(DASH_CAR_COLS), DASH_CAR_ROWS()] : [sortAll(DASH_PROG_COLS), DASH_PROG.filter(dashMine(kbk)).map(dashProgRow)];
/* S4 แบบ VMS+ (12 พ.ย. 2569 · R106 · ชุดวาดด้านบน) — ลำดับ: หัวแดชบอร์ด → เรื่องที่ควรดู → ตัวกรองที่เลือก → การ์ดตัวเลข 6 ใบ → กราฟ 4 ใบ → แท็บ 3 แท็บเดิม + Table header + Table → หมายเหตุแหล่งข้อมูล
   ตัวเลขทุกส่วนคิดจากข้อมูลเดิมของหน้า (DASH_PLANS · รายไตรมาสของแผน · DASH_PROG · DASH_AGG · อะไหล่รายคันของแผน MRZ7000004) ไม่เพิ่มแหล่งข้อมูล
   ที่ทำไม่ได้จากข้อมูลเดิม (ตัดออก แจ้งเจ้าของงาน): อะไหล่รายไตรมาส (DASH_AGG เป็นยอดทั้งปี) · ไตรมาสที่บำรุงรักษาช้ากว่ากำหนด (ไม่มีวันครบกำหนดรายไตรมาส) · อะไหล่ตามหน่วยงานผู้ขอเบิก (แสดงยานพาหนะตามหน่วยงานแทน) */
const planQs = (p) => p[9].split(' · ').map(s => +s.split(': ')[1] || 0);   // ยานพาหนะรายไตรมาส [ไตรมาส 1..4] ของแผน
const progOf = (id, q) => DASH_PROG.find(r => r[0] === id && r[1] === q);
const DASH_NOPARTS = CAND.map((c, i) => i).filter(i => !(A_PICKS[i] || []).length && !A_OILS[i]);   // ยานพาหนะของแผน MRZ7000004 (CAND) ที่ไม่มีอะไหล่และไม่เปลี่ยนน้ำมัน = ไม่เบิกอะไหล่
const DASH_PCS = DASH_AGG.filter(r => r[4] === 'ชิ้น').reduce((a, r) => a + +r[3], 0), DASH_LITRE = DASH_AGG.filter(r => r[4] === 'ลิตร').reduce((a, r) => a + +r[3], 0);
function dashStats(o) {   // o.kbk · o.q = ไตรมาสที่กดในกราฟ · o.plan = แผนในตัวกรอง
  const pl = DASH_PLANS().filter(dashMine(o.kbk)).filter(p => !o.plan || p[0] === o.plan);
  const per = pl.map(p => {
    const qs = planQs(p), qd = [1, 2, 3, 4].map(q => { const r = progOf(p[0], q); return { cars: qs[q - 1], done: r ? r[3] : 0, st: r ? r[5] : 'todo', trips: r ? r[2] : 0 }; });
    const pick = o.q ? [qd[o.q - 1]] : qd, cars = pick.reduce((a, x) => a + x.cars, 0), done = pick.reduce((a, x) => a + x.done, 0), doing = pick.reduce((a, x) => a + (x.st === 'doing' ? x.cars - x.done : 0), 0);
    return { p, qd, cars, done, doing, todo: cars - done - doing, nowQ: +p[3].split(' ')[1] };
  }).filter(x => x.cars > 0);
  const cars = per.reduce((a, x) => a + x.cars, 0), done = per.reduce((a, x) => a + x.done, 0);
  const byQ = [0, 1, 2, 3].map(q => per.reduce((a, x) => [a[0] + x.qd[q].done, a[1] + x.qd[q].cars - x.qd[q].done], [0, 0]));
  return { per, cars, done, byQ };
}
/* o.tab · o.query · o.chips (ตัวกรองที่ใช้แล้ว · ชิปที่เป็นเลขที่ MR = กรองแผน) · o.notFound · o.empty · o.filter = แผงตัวกรอง { open } · o.exportPdf = popup ส่งออก (true PDF / false Excel) · o.kbk = มุมมอง กบค. ทุกหน่วยงาน
   o.q = กดแท่งไตรมาส (กรองทั้งหน้า) · o.alert = กดเรื่องที่ควรดู ('noparts') · o.mobileAll = มือถือแสดงกราฟครบทุกใบ (จอมือถืออื่นแสดงเฉพาะกราฟที่กด) */
async function partsDash(name, o) {
  o = o || {};
  const tab = o.tab || 0;
  const { scr, page } = await shell(name, { title: 'อะไหล่ของแผนที่อนุมัติแล้ว' });
  if (o.empty) {
    const es = inst('Empty state/Data empty'); add(page, es, 'h');
    await text(es, 'Text', 'ยังไม่มีแผนที่อนุมัติแล้ว'); await text(es, 'Supporting text', 'เมื่อแผนบำรุงรักษาได้รับอนุมัติ อะไหล่และความคืบหน้าของแผนจะรวมมาที่นี่');
    const a = find(es, 'Actions'); if (a) a.visible = false;
    return scr;
  }
  const plan = (o.chips || []).find(c => /^MRZ\d+$/.test(c)), st = dashStats({ kbk: o.kbk, q: o.q, plan }), W = dashW(scr);
  add(page, await dashHead({ title: 'อะไหล่ของแผนที่อนุมัติแล้ว', icon: 'quick_reference_all-24-300-round',
    desc: 'อะไหล่และน้ำมันไฮดรอลิกที่ต้องใช้ตามแผนบำรุงรักษาที่อนุมัติแล้ว แยกตามไตรมาส แผน และหน่วยงาน — คลิกกราฟหรือรายการเพื่อกรองทั้งหน้า' }), 'h');
  const seeNp = st.per.some(x => x.p[0] === NP[0]), noTrip = st.per.filter(x => !o.q && x.qd[x.nowQ - 1].cars && !x.qd[x.nowQ - 1].trips);
  const al = await dashAlerts([
    { key: 'notrip', tone: 'warn', n: noTrip.length, icon: 'event_busy-24-300-round', title: 'ไตรมาสปัจจุบันที่ยังไม่มีแผนเดินทาง ' + noTrip.length + ' ไตรมาส', sub: noTrip.map(x => x.p[0] + ' ' + x.p[3]).join(' · ') + ' — ยานพาหนะในไตรมาสยังไม่ได้จัดเข้าแผนเดินทาง' },
    { key: 'noparts', tone: 'info', n: seeNp ? DASH_NOPARTS.length : 0, icon: 'description-24-300-round', title: 'ยานพาหนะในแผนที่ไม่เบิกอะไหล่ ' + DASH_NOPARTS.length + ' คัน', sub: DASH_NOPARTS.map(i => CAND[i][0]).join(' · ') + ' ในแผน ' + NP[0] + ' ไม่มีอะไหล่และไม่เปลี่ยนน้ำมันไฮดรอลิก — ตรวจว่าตั้งใจหรือยังจัดอะไหล่ไม่ครบ' }], o.alert);
  if (al) add(page, al, 'h');
  const ch = await dashChips(o.chips); if (ch) add(page, ch, 'h');
  const partSub = o.q || plan ? 'ยอดทั้งปีของทุกแผน ไม่แยกตามตัวกรอง' : 'รวมทุกแผนที่อนุมัติแล้ว';
  add(page, await dashKpis([
    { label: 'แผนที่อนุมัติแล้ว', value: st.per.length, unit: 'แผน', sub: 'ปีงบประมาณ 2570' + (o.kbk ? ' ทุกหน่วยงาน' : ' ของ ' + DASH_OWN), tone: 'brand', icon: 'description-24-300-round' },
    { label: 'ยานพาหนะในแผน', value: st.cars, unit: 'คัน', sub: o.q ? 'ไตรมาส ' + o.q : 'ทุกไตรมาส', tone: 'info', icon: 'car_repair-24-300-round' },
    { label: 'รายการอะไหล่', value: DASH_AGG.length, unit: 'รายการ', sub: partSub, tone: 'gray', icon: 'quick_reference_all-24-300-round' },
    { label: 'จำนวนอะไหล่รวม', value: dFmt(DASH_PCS), unit: 'ชิ้น', sub: 'ไม่รวมน้ำมันไฮดรอลิก', tone: 'warning', icon: 'search_check-24-300-round' },
    { label: 'น้ำมันไฮดรอลิก', value: dFmt(DASH_LITRE), unit: 'ลิตร', sub: OIL_SPEC.grade + ' · ' + partSub, tone: 'brand', icon: 'search_check-24-300-round' },
    { label: 'ความคืบหน้า', value: st.done + '/' + st.cars, unit: 'คัน', sub: dPct(st.done, st.cars) + ' บำรุงรักษาแล้ว', tone: 'success', icon: 'check-24-300-round' }]), 'h');
  /* กราฟ 4 ใบ — มือถือ: จอ C.18 แสดงครบ · จออื่นแสดงเฉพาะกราฟที่กด (ประหยัดชั้นบนหน้า Figma) */
  const byUnit = uniq(st.per.map(x => PLAN_UNIT[x.p[0]])).map(u => ({ label: u, value: st.per.filter(x => PLAN_UNIT[x.p[0]] === u).reduce((a, x) => a + x.cars, 0) }));
  const parts = DASH_AGG.filter(r => r[4] === 'ชิ้น').slice().sort((a, b) => b[3] - a[3]);
  const specs = [
    { key: 'quarter', span: 2, title: 'ยานพาหนะในแผนรายไตรมาส', sub: 'บำรุงรักษาแล้วเทียบยังไม่บำรุงรักษา แยกตามไตรมาส', icon: 'calendar_month-24-300-round', src: 'ข้อมูลจากแผนที่อนุมัติแล้ว ปีงบประมาณ 2570',
      build: async (w) => (await vBars(w, st.byQ.map((v, i) => ({ label: 'ไตรมาส ' + (i + 1), vals: v, dim: !!o.q && o.q !== i + 1 })), [{ label: 'บำรุงรักษาแล้ว', tone: 'success' }, { label: 'ยังไม่บำรุงรักษา', tone: 'info' }]))
        .concat([await dLegend(st.byQ.map((v, i) => ({ label: 'ไตรมาส ' + (i + 1), value: v[0] + v[1], tone: DASH_TONES[i], dim: !!o.q && o.q !== i + 1 })), ['ไตรมาส', 'ยานพาหนะ (คัน)'], { total: true })]) },
    { key: 'unit', span: 1, title: o.kbk ? 'ตามหน่วยงานผู้ขอเบิก' : 'ยานพาหนะตามแผน', sub: o.kbk ? 'ยานพาหนะในแผนของแต่ละหน่วยงาน' : 'ยานพาหนะในแผนของ ' + DASH_OWN + ' แยกตามแผน', icon: 'groups-24-300-round', color: 'Info', src: 'ข้อมูลจากแผนที่อนุมัติแล้ว',
      build: async (w) => donut(w, o.kbk ? byUnit : st.per.map(x => ({ label: x.p[0], value: x.cars })), { unit: 'คัน', heads: [o.kbk ? 'หน่วยงาน' : 'แผน', 'จำนวน (คัน)'] }) },
    { key: 'parts', span: 2, title: 'อะไหล่ที่ใช้มากที่สุด', sub: 'จำนวนชิ้นรวมทุกแผน · น้ำมันไฮดรอลิกนับเป็นลิตรที่การ์ดตัวเลข', icon: 'quick_reference_all-24-300-round', color: 'Warning', src: 'ข้อมูลจากอะไหล่ของยานพาหนะในแผน',
      more: parts.length > 10 ? 'แสดงทั้งหมด ' + parts.length + ' รายการ' : null,
      build: async (w) => [await hBars(w, parts.slice(0, 10).map(r => ({ label: r[0], value: +r[3], unit: r[4], sub: (r[1] && r[1] !== '-' ? 'รหัส ' + r[1] + ' · ' : '') + r[2] })), { total: DASH_PCS })] },
    { key: 'progress', span: 1, title: 'ความคืบหน้าของแผน', sub: 'ยานพาหนะแยกตามสถานะงานของแต่ละแผน', icon: 'check-24-300-round', color: 'Success', src: 'ข้อมูลจากแผนเดินทางและงานรายคัน',
      build: async (w) => [await stackRows(w, st.per.map(x => ({ label: x.p[0], right: x.done + '/' + x.cars + ' คัน', vals: [x.done, x.doing, x.todo], sub: PLAN_UNIT[x.p[0]] + ' · ' + x.p[1] })),
        [{ label: 'บำรุงรักษาแล้ว', tone: 'success' }, { label: 'กำลังดำเนินการ', tone: 'info' }, { label: 'ยังไม่เริ่ม', tone: 'track' }])] }];
  add(page, await chartGrid(W, MOB && !o.mobileAll ? specs.filter(s => s.key === (o.q ? 'quarter' : '')) : specs), 'h');
  /* ตารางท้ายหน้า: แท็บ 3 แท็บเดิม + Table header (ค้นหา · ตัวกรอง · ส่งออก) + Table เรียงได้ทุกคอลัมน์ + แบ่งหน้า */
  let [cols, rows] = DASH_TABLE(tab, o.kbk);
  if (tab === 2) rows = DASH_PROG.filter(dashMine(o.kbk)).filter(r => (!o.q || r[1] === o.q) && (!plan || r[0] === plan)).map(dashProgRow);
  if (o.alert === 'noparts') rows = DASH_NOPARTS.map(i => [CAND[i][0], { text: NP[0], sub: PLAN_UNIT[NP[0]] }, 'ไตรมาส ' + A_ALL[i], 'ไม่เบิกอะไหล่', '-', '-', '0', '-']);
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs(DASH_TABS.map((t, i) => [t, i === 0 ? DASH_AGG.length : i === 1 ? (o.alert ? rows.length : 214) : (tab === 2 ? rows.length : DASH_PROG.filter(dashMine(o.kbk)).length)]), tab), 'h');
  add(sec, await tableHeader({ placeholder: DASH_HINT[tab], query: o.query, chips: o.chips, filterCount: (o.chips || []).length || null, more: [{ text: 'ส่งออก', icon: 'download-24-300-round' }] }), 'h');
  if (o.notFound) add(sec, await searchNotFound(), 'h');
  else add(sec, await tblShort(cols, rows.slice(0, TABLE_MAX.rows), { pagination: tab === 1 && !o.alert ? { shown: TABLE_MAX.rows, total: 214 } : rows.length }), 'h');
  add(page, await dashNote('ข้อมูลจากแผนบำรุงรักษาที่อนุมัติแล้วของปีงบประมาณ 2570 ' + (o.kbk ? 'ทุกหน่วยงาน' : 'ของ ' + DASH_OWN) + ' · จำนวนอะไหล่เป็นยอดตามแผน ไม่ใช่ยอดเบิกจริง · ตัวเลขทุกส่วนคำนวณตามตัวกรองที่เลือก'), 'h');
  await bindDash();
  /* แผงตัวกรอง (รีวิว "filter หน่วยงานผู้ขอเบิก เขต, แผน") + ปีงบประมาณ (หน้ารวมของแผนที่อนุมัติแล้ว "ในปีนั้นๆ") · filterPanel แบบรายการแผน · หลายค่า = Input dropdown with badges Optional */
  if (o.filter) {
    const fd = o.filter, at = (n) => n.findOne(x => x.name === 'Container') || n;
    const yr = dropdown('ปีงบประมาณ', '2570', { optional: true });
    const unit = o.kbk ? multiDropdown('หน่วยงานผู้ขอเบิก', fd.units || [], { placeholder: 'เลือกหน่วยงานผู้ขอเบิก', optional: true, state: fd.open === 'unit' ? 'Focused' : undefined }) : null;   // ผู้ใช้หน่วยงานเห็นเฉพาะแผนของตัวเอง ⇒ ตัวกรองหน่วยงานมีเฉพาะ กบค. (10 พ.ย. 2569)
    const dist = multiDropdown('เขต', fd.districts || [], { placeholder: 'เลือกเขต', optional: true });
    const pln = multiDropdown('แผน', fd.plans || [], { placeholder: 'เลือกแผน', optional: true, state: fd.open === 'plan' ? 'Focused' : undefined });
    await filterPanel(scr, [yr, unit, dist, pln].filter(Boolean));
    if (unit && fd.open === 'unit') comboAt(scr, at(unit), UNITS.map(u => [u, '', (fd.units || []).indexOf(u) >= 0]));
    if (fd.open === 'plan') comboAt(scr, at(pln), DASH_PLANS().filter(dashMine(o.kbk)).map(p => [p[0], p[1], (fd.plans || []).indexOf(p[0]) >= 0]));
  }
  if (o.exportPdf != null) await exportModal(scr, o.exportPdf, { scope: [rows.length + ' รายการตามแท็บ ' + DASH_TABS[tab] + ((o.chips || []).length ? ' และตัวกรองที่ใช้อยู่' : ''), (tab === 1 ? 214 : rows.length) + ' รายการ ทุกแผนที่อนุมัติแล้วในปีงบประมาณ 2570'] });
  return scr;
}
/* popup ส่งออก (S4 แดชบอร์ด · S6 แผนเดินทาง) — แบบ exportModal ของ S18 Overhaul (R32): การ์ดรูปแบบไฟล์ PDF / Excel ตั้งตามที่กด เปลี่ยนได้ · ปุ่ม ยกเลิก / ส่งออก
   รีวิว "download report อะไหล่ทั้งหมดและอะไหล่ตามที่ filter มาได้" ⇒ o.scope = [บรรทัดรองของ "ตามตัวกรองที่ใช้อยู่", บรรทัดรองของ "ทั้งหมด"] เพิ่มการ์ดชุดที่ 2 (ไม่มีค่าเริ่มต้นอื่นนอกจากตามตัวกรอง) */
const EXPORT_CARDS = [['PDF', 'เอกสาร A4 สำหรับพิมพ์หรือแนบเอกสาร'], ['Excel', 'ไฟล์ .xlsx แยกชีตตามหัวข้อ']];
async function exportModal(scr, pdf, o) {
  o = o || {};
  const body = [await radioPick('รูปแบบไฟล์', EXPORT_CARDS, pdf ? 0 : 1, { label: true })];
  if (o.scope) body.push(await radioPick('ข้อมูลที่ส่งออก', [['ตามตัวกรองที่ใช้อยู่', o.scope[0]], ['ทั้งหมด', o.scope[1]]], 0, { label: true }));
  return popupModal(scr, { title: o.title || 'ส่งออกรายงาน', sub: o.sub || 'ส่งออกข้อมูลตามแท็บที่เปิดอยู่', body, ok: 'ส่งออก' });
}
/* หน้าตาไฟล์ที่ส่งออก (R32) — เฟรมเอกสารไม่มี Sidebar/Header · PDF = A4 794×1123 · Excel = ชีต 1440×1024 (Tabs = แถบชีต) · บังคับ desktop · ยกจาก docFrame ของ overhaul2-plugin
   คอลัมน์ในไฟล์ใช้ชุดเดียวกับตารางบนจอ (R81 · เจ้าของงาน "ตอน export ก็เกี่ยวข้องด้วย") */
async function docFrame(name, w, h, kids) {
  const was = MOB; MOB = false;
  try {
    const f = frame(PLUGIN.prefix + ' / ' + name, 'VERTICAL', { fill: WHITE, pad: 48, gap: 24 });
    if (PLACE) { f.x = PLACE.x; f.y = PLACE.y; }
    f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; f.resize(w, h); f.clipsContent = false;
    for (const k of await kids()) if (k) add(f, k, 'h');
    return f;
  } finally { MOB = was; }
}
const DOC_HEAD = (title, filter) => [title, kv([['หน่วยงานที่ออกเอกสาร', UNITS[0] + ' การไฟฟ้าส่วนภูมิภาค'], ['ตัวกรอง', filter], ['พิมพ์เมื่อ', '06/11/2569 10:30 น.'], ['ผู้พิมพ์', CREATOR]], 4)];
async function dashPdf(name) {
  return docFrame(name, 794, 1123, async () => {
    const [t, k] = DOC_HEAD('รายงานอะไหล่ของแผนที่อนุมัติแล้ว · ปีงบประมาณ 2570', 'ปีงบประมาณ 2570 · แผน MRZ7000001');
    return [await sectionLabel(t), k, col('Section', [await sectionLabel('รวมตามรายการ (' + DASH_AGG.length + ')'), await tbl(QPART_COLS, DASH_AGG)], 12)];
  });
}
async function dashXls(name, sheet) {
  return docFrame(name, 1440, 1024, async () => {
    const [cols, rows] = DASH_TABLE(sheet);
    return [await tabs(DASH_TABS.map(t => [t, null]), sheet), await tbl(cols.map(c => c.slice(0, 3)).filter(c => c[0]), rows.slice(0, TABLE_MAX.rows).map(r => r.filter(c => c !== GO)))];
  });
}

/* ---------- S6 แผนเดินทาง (ตรวจเอง) ---------- */
/* หน้าแผนเดินทางของไตรมาส (3 พ.ย. 2569 เจ้าของงาน "อยากให้แสดงรถทั้งหมดในแผน และมีให้เพิ่มแผนการเดินทาง" → เลือกรถของไตรมาสที่กำลังทำ · หน้าเดียว 2 ส่วน)
   ส่วนรถ: รถทุกคันของไตรมาส + ช่วงวันเดินทาง + ป้ายแผนเดินทางที่รถอยู่ (ยังไม่มี = Gray) · ส่วนแผนเดินทาง: รายการใบ + ปุ่มสร้างแผนเดินทาง
   หน้า Detail ⇒ Section label (R3) · o.trips = แผนเดินทางที่ยืนยันแล้ว [{ sel, locs, d1, d2, st }] เรียงตามลำดับที่สร้าง */
const TRIP_Q_COLS = tripVCols({ drop: ['สถานที่บำรุงรักษา'] }).concat([['แผนเดินทาง', 200]]);   // R82 ชุดเดียวกับตารางยานพาหนะของแผนเดินทาง (หน้าไตรมาสไม่มีสถานที่ เพราะสถานที่อยู่กับแผนเดินทาง)   // 6 พ.ย. 2569 + ประเภทยานพาหนะ · ช่วงวันเดินทาง เป็น วันดำเนินการรายคัน   // มีใบ = ชื่อแผนเดินทาง (Text) · ยังไม่มี = Badge Gray · เบอร์ติดต่อ 3 พ.ย. 2569 เจ้าของงาน "หน้า e1 ก็อยากให้มีเบอร์ติดต่อด้วย" (อยู่ในใบแล้ว = เบอร์ของใบนั้น)
/* ยานพาหนะที่ยังไม่อยู่ในแผนนี้ (ค่าสมมติ · 12 พ.ย. 2569 X5 เพิ่มได้ทุกคัน ไม่จำกัดขอบเขตภาค เขต ประเภทของแผน · เดิม = รถในแผนปีที่ยังไม่ได้อยู่ในไตรมาสนี้) — ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · เบอร์ · ชื่อผู้ดูแลยานพาหนะ · popup "เพิ่มรถเข้า" ไตรมาส (E.16) */
const Q_EXTRA = [['81-9035 ลำปาง', 'Isuzu FTR + กระเช้า Aichi SK12A', 'กฟน.2 ลำปาง', '054-218-330', 'นายเกรียงไกร มูลเมือง'], ['82-4417 น่าน', 'Hino FC + กระเช้า Tadano AT-121', 'กฟน.2 น่าน', '054-710-244', 'นายสุเมธ จันทร์ดี'],
  ['80-6652 ลำพูน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.1 ลำพูน', '053-511-090', 'นายวิทยา สายสุข'],
  /* 12 พ.ย. 2569 เจ้าของงาน "ป๊อบอัพ ควรมีแบ่งหน้า" (R104) ⇒ ชุดตัวอย่างครบ 1 หน้า (10 คัน) จากทุกภาคและกองของ สนง. แบบเดียวกับ 3 คันแรก · ค่าสมมติ */
  ['85-3127 พระนครศรีอยุธยา', 'Isuzu FTR + กระเช้า Aichi SK12A', 'กฟก.1 พระนครศรีอยุธยา', '035-241-560', 'นายธนพล แก้วมณี'], ['86-4402 ชลบุรี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟก.2 ชลบุรี', '038-273-415', 'นายอำนาจ บุญมา'],
  ['84-7719 นครปฐม', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟก.3 นครปฐม', '034-251-907', 'นายสมศักดิ์ เพ็ชรรัตน์'], ['83-2286 เพชรบุรี', 'Hino FG + กระเช้า Tadano AT-146', 'กฟต.1 เพชรบุรี', '032-425-338', 'นายจักรพันธ์ ทองคำ'],
  ['85-6043 นครศรีธรรมราช', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟต.2 นครศรีธรรมราช', '075-356-212', 'นายอนันต์ แสงทอง'], ['70-4415 กรุงเทพมหานคร', 'Hino FC + กระเช้า Tadano AT-100', 'กบค.', '02-590-5541', 'นายปกรณ์ วงศ์ใหญ่'],
  ['71-2208 กรุงเทพมหานคร', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กรย.', '02-590-5618', 'นายชัยวัฒน์ รุ่งเรือง']];
const Q_EXTRA_TOTAL = 370;   // จำนวนยานพาหนะที่ยังไม่อยู่ในแผน (ค่าสมมติ หลายร้อยคันตั้งแต่ 12 พ.ย. 2569 X5) · popup แสดงหน้าแรก 10 คัน (Q_EXTRA) + Table pagination "แสดง 1 ถึง 10 จาก 370 รายการ" แบบ { shown, total } ของตารางอื่น
const Q_REMOVE_CONFIRM = (c) => ({ danger: true, title: 'ยืนยันการเอายานพาหนะออกจาก' + NOW_Q, sub: c[0] + ' จะถูกเอาออกจาก' + NOW_Q + ' ของแผนนี้ และอะไหล่ของยานพาหนะคันนี้ออกจากรายการเบิกของไตรมาส', cancel: 'ยกเลิก', ok: 'เอาออก' });   // แบบ CAR_REMOVE_CONFIRM
const Q_DONE_JOBS = Object.fromEntries(TRIP_CARS.map((c, i) => [c[0], i === 2 ? 'cannot' : 'done']));   // E.26 (R93) ทุกคันของไตรมาส 1 ปิดงานแล้ว · 1 คันบำรุงรักษาไม่ได้ (นับว่าเสร็จ)
const qAddModal = (scr, ticked) => tripCarModal(scr, { cars: Q_EXTRA, pool: Q_EXTRA.map((_, i) => i), pagination: { shown: Q_EXTRA.length, total: Q_EXTRA_TOTAL }, ticked, title: 'เพิ่มยานพาหนะเข้า' + NOW_Q, sub: 'ยานพาหนะที่ยังไม่อยู่ในแผนนี้ เพิ่มได้ทุกคัน รวมยานพาหนะที่รับมอบระหว่างปี', okText: 'เพิ่มเข้า' + NOW_Q });
const Q_PARTS_EMPTY = 'ไตรมาสนี้ไม่มีอะไหล่ที่ต้องเบิก';
const PLAN_NO_PARTS = 'แผนนี้ไม่มีอะไหล่ที่ต้องเบิก';   // 13 พ.ย. 2569 ไฟล์ 34 ข้อ 5 (ก): หน้ารายละเอียดแผนแบบดูอย่างเดียว (ผู้อนุมัติ S2 · กบค. ดูแผนหน่วยงานอื่น · รออนุมัติ) แท็บรวมทุกไตรมาส ไม่บอกให้กดปุ่ม … ที่คนดูกดไม่ได้ · ข้อความชุดเดียวกับเว็บ PlanParts.tsx   // บรรทัดรองของ Empty state หัวข้ออะไหล่ในไตรมาส n (ชุดเดียวกับ S2 อะไหล่ในแผน)
const TRIP_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวัน', 220], ['ยานพาหนะ (คัน)', 100], ['ผู้ดำเนินการ', 260], ['สถานะ', 150, 'Badge'], ['', 72]];
const tripPlaces = (t) => { const n = new Set(t.sel.map(i => tripLoc(i, t.locs))).size, own = t.sel.filter(i => !t.locs[i]).length; return n + ' แห่ง' + (own ? ' (สำนักงานเจ้าของยานพาหนะ ' + own + ' คัน)' : ''); };
async function tripList(name, o) {
  o = o || {};
  const trips = o.trips || [];
  const Q = o.q || NOW_Q, J = o.jobs || {};   // S25 (5 พ.ย. 2569): o.q = หน้าไตรมาสอื่น · o.cars = [[รถ, ลำดับใน TRIP_CARS หรือ -1]] แทนรถไตรมาส 1 · o.jobs = { ทะเบียน: สถานะงาน } ขึ้นป้ายแทนชื่อแผนเดินทาง + เมนู "…" ย้ายไปไตรมาสอื่น · o.subs = { ทะเบียน: บรรทัดรอง }
  /* 5 พ.ย. 2569 รีวิว "หน้านี้คือหน้า ไตรมาส 1 ใช่หรือไม่ หากใช้ ต้องแก้ breadcrumb ให้ถูกต้องสัมพันธ์กัน" (เจ้าของงานยืนยันว่าใช่) ⇒ หัวหน้า "ไตรมาส 1" · breadcrumb บำรุงรักษาตามวาระ › <ชื่อแผน> › ไตรมาส 1 */
  const { scr, page } = await shell(name, { title: Q, back: true, crumbs: [P[1], Q], badge: PST.active });
  const tripOf = (i) => trips.findIndex(t => t.sel.indexOf(i) >= 0);
  /* เพิ่ม ลด แก้ไข รถในไตรมาส (เจ้าของงาน 4 พ.ย. 2569 "หน้า E.1 ต้องสามารถ เพิ่มลด จำนวน หรือแก้ไขได้ด้วย" · เลือก เพิ่มหรือเอารถออกจากไตรมาส + แก้เบอร์ติดต่อและสถานที่ · ไม่ต้องส่งอนุมัติแผนใหม่)
     ปุ่ม "เพิ่มรถ" ที่หัวส่วน (แบบฟอร์มแผนเดินทาง) · ไอคอนแก้ไข + ลบ ท้ายแถว (แบบตารางรถในแผนเดินทาง TRIP_CAR_COLS) · คันที่อยู่ในแผนเดินทางแล้วเหลือไอคอนแก้ไข (เอาออกจากแผนเดินทางก่อน)
     o.added = รถที่เพิ่มเข้าไตรมาส (ลำดับใน Q_EXTRA) · o.removed = ลำดับรถใน TRIP_CARS ที่เอาออก */
  const qAll = o.cars || (o.added || []).map(k => [Q_EXTRA[k], -1]).concat(TRIP_CARS.map((c, i) => [c, i]).filter(([, i]) => (o.removed || []).indexOf(i) < 0));   // คันที่เพิ่มใหม่ขึ้นก่อน
  const qCars = qAll.slice(0, TABLE_MAX.rows);   // Table ของไลบรารีได้ 10 แถว (R8) ⇒ เกินแสดงหน้าแรก + pagination
  /* 11 พ.ย. 2569 เจ้าของงาน _"ต้องสามารถเพิ่มรถรายคันได้ โดยเงื่อนไขการเพิ่มรถคือ ถ้าไตรมาสนั้นยังบำรุงไม่เสร็จทุกคันจะสามารถเพิ่มรถเข้ามาไตรมาสนั้นๆ ได้"_ (R93)
     ⇒ ปุ่ม "เพิ่มยานพาหนะ" กดได้ตราบที่ยังมียานพาหนะในไตรมาสที่ยังไม่ปิดงาน · ทุกคันปิดงานแล้ว (เสร็จสิ้น หรือ บำรุงรักษาไม่ได้ — เจ้าของงานเคาะนับว่าเสร็จ) = State Disabled
     ชุดยานพาหนะใน popup คงเดิม (ขอบเขตของแผน ภาค เขต ประเภท ที่ยังไม่อยู่ในไตรมาสใด ติ๊กทีละคัน) · คันเสร็จสิ้นไม่มีเมนู … (ไม่มีอะไรให้ทำต่อ) · คันบำรุงรักษาไม่ได้ยังมีเมนูย้ายไตรมาส (S25) */
  const closed = (c) => J[c[0]] === 'done' || J[c[0]] === 'cannot';
  const qDone = qAll.length > 0 && qAll.every(([c]) => closed(c));
  const cars = col('Section', [await sectionLabel('ยานพาหนะใน' + Q, { badge: qAll.length, buttons: [{ kind: 'Secondary button', text: 'เพิ่มยานพาหนะ', icon: 'add-24-300-round', disabled: qDone }] }),
    await tblShort(TRIP_Q_COLS.concat([['', 104]]), qCars.map(([c, i]) => { const k = i >= 0 ? tripOf(i) : -1, sub = (o.subs || {})[c[0]];
      /* R82 ช่องตามชุด TRIP_V_COLS (ไม่มีสถานที่) · ยานพาหนะที่เพิ่มเข้าไตรมาส (Q_EXTRA) และที่ย้ายมา (S25 MOVE_Q2_PAGE) ยังไม่อยู่ในแผนเดินทาง ⇒ ผู้ดูแลจากข้อมูลยานพาหนะ วันดำเนินการ "—" เรียงตามชุดเดียวกัน
         เบอร์ติดต่อ = เบอร์บรรทัดบน ชื่อผู้ดูแลบรรทัดรอง แบบ tripPhoneCell (9 พ.ย. 2569 · 10 พ.ย. 2569 แก้จุดนี้ที่ยังเป็นชื่อบน เบอร์ล่าง) */
      const base = i >= 0 ? tripVCells(i, k >= 0 ? trips[k] : {}, { drop: ['สถานที่บำรุงรักษา'] }) : [c[0], typeOf(c), c[1], c[2], { text: c[3], sub: c[4] }, '—'];
      if (sub) base[0] = { text: c[0], sub };
      return base.concat([J[c[0]] ? { pill: WSTAT[J[c[0]]] } : k >= 0 ? { text: trips[k].name, sub: 'เพิ่มเข้าแผนเดินทางแล้ว' } : { pill: ['ยังไม่มีแผนเดินทาง', 'Gray'] },   /* 6 พ.ย. 2569 เจ้าของงาน "หลังจากสร้างแผนการเดินทางแล้ว รถที่เพิ่ม จะแสดงว่าถูกเพิ่มแล้ว" */ J[c[0]] === 'done' ? '' : J[c[0]] ? { menu: 1, items: [MAINT_ITEM, MOVE_ITEM] } : { icons: k >= 0 ? ['stylus-24-300-round'] : ['stylus-24-300-round', 'delete-24-300-round'] }]); }), qAll.length > qCars.length ? { pagination: { shown: qCars.length, total: qAll.length } } : {})], 16);
  const free = qAll.filter(([, i]) => i < 0 || tripOf(i) < 0).length;   // 5 พ.ย. 2569 รีวิว "สามารถสร้างแผนได้จนกว่าจะไม่เหลือรถอยู่แล้ว" ⇒ รถทุกคันอยู่ในแผนเดินทางแล้ว ปุ่มกดไม่ได้
  const sec = col('Section', [await sectionLabel('แผนเดินทาง', { badge: trips.length, buttons: [{ kind: 'Primary button', text: 'สร้างแผนเดินทาง', icon: 'add-24-300-round', disabled: !free }] })], 16);
  if (trips.length) add(sec, await tblShort(TRIP_COLS, trips.map(t => [{ text: t.name, sub: tripPlaces(t) }, t.d1 + ' – ' + t.d2, String(t.sel.length), tripBy(t), { pill: TST[t.st] }, { icons: ['keyboard_arrow_right-20-400-round'] }])), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ยังไม่มีแผนเดินทาง'); await text(es, 'Supporting text', 'สร้างแผนเดินทางเพื่อนัดวันเข้าตรวจ แจ้งผู้ดูแลยานพาหนะและ กรย.'); const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false; const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'สร้างแผนเดินทาง', 'Leading icon swap': icon('add-24-300-round') }); }
  /* อะไหล่ในไตรมาส n (6 พ.ย. 2569 เจ้าของงาน "หน้าที่ รวมรถในไตรมาส จะเป็นรวมแยกตามรายการ ไม่ต้องมีจาก smart inventory" · แทนหน้าความคืบหน้าอะไหล่ S4 เดิม)
     Section label + Table QPART_COLS (R81) · ดูอย่างเดียว · ยอด = PARTS ของไตรมาสที่กำลังทำ · o.parts = { qty, subs } ไตรมาสอื่น (S25 รวมอะไหล่ของยานพาหนะที่ย้ายมา บรรทัดรองใต้ชนิด) */
  /* 9 พ.ย. 2569 (ตามเว็บ): รายการที่จำนวนเป็น 0 ไม่แสดง · ไม่เหลือสักรายการ (ยานพาหนะในไตรมาสไม่เบิกอะไหล่ทุกคัน หรือไม่มียานพาหนะ) = Empty state/Data empty
     ข้อความเดียวกับหัวข้ออะไหล่ในแผนของ S2 (planPartsSec): "ยังไม่มีรายการอะไหล่" / "ไตรมาสนี้ไม่มีอะไหล่ที่ต้องเบิก" · o.parts.qty = [] ⇒ จอว่าง */
  const pq = o.parts || {}, qParts = PARTS.map((p, x) => [(pq.subs || {})[x] ? { text: p[0], sub: pq.subs[x] } : p[0], p[1], p[2], String(pq.qty ? pq.qty[x] || 0 : p[3]), p[4]]).filter(r => +r[3] > 0);
  const parts = col('Section', [await sectionLabel('อะไหล่ใน' + Q), qParts.length ? await tblShort(QPART_COLS, qParts) : await noParts(Q_PARTS_EMPTY)], 16);
  add(page, col('Content', [await vehicleInfo(o.q ? PLAN_KV.map(([k, v]) => k === 'ไตรมาส' ? [k, Q + ' (' + qAll.length + ' คัน)'] : [k, v]) : TRIP_KV, 'รายละเอียดแผน'), cars, parts, sec], 32), 'h');
  if (MOB) qCars.forEach(([c], r) => { if (J[c[0]] && J[c[0]] !== 'done') moveCard(scr, r, o.moveOff); });   // S25 มือถือ: ปุ่ม "ย้ายไปไตรมาสอื่น" บนการ์ด (Mobile table item Style=Action buttons)
  return scr;
}
/* ฟอร์มสร้างแผนเดินทาง — 2 พ.ย. 2569 เจ้าของงาน: สถานที่บำรุงรักษารายคัน ค่าเริ่มต้นสำนักงานที่รถอยู่
   3 พ.ย. 2569 เจ้าของงาน: เลือกรถจากรายการรถทั้งหมดของไตรมาส ผ่านปุ่ม "เพิ่มรถ" (popup tripCarModal) · 1 ไตรมาสมีหลายแผนเดินทางได้
   รถที่อยู่ในแผนเดินทางใดแล้วไม่มีให้เลือกในแผนเดินทางถัดไป
   o.sel = รถในแผนเดินทางนี้ (ลำดับใน VEH) · o.locs = สถานที่ที่แก้ { ลำดับรถ: ข้อความ } · o.phones = ผู้ดูแลยานพาหนะที่แก้ { ลำดับรถ: [ชื่อ, เบอร์] } */
const TRIP_CAR_COLS = tripVCols().concat([['', 104]]);   // 6 พ.ย. 2569 + ประเภทยานพาหนะ + วันดำเนินการ (Table 8 คอลัมน์เต็ม) · R82 ชุด TRIP_V_COLS + ไอคอนแก้ไข ลบ
/* อะไหล่ของแผนเดินทาง (6 พ.ย. 2569 รีวิว S6 "เพิ่ม section ของอะใหล่ ทริปนี้") — ตาราง QPART_COLS ชุดเดียวกับอะไหล่ในไตรมาส (R81) ดูอย่างเดียว รวมจากยานพาหนะในใบ (tripParts)
   หน้า Create/Edit (ฟอร์ม S6 S9) = Section header + Badge (R3) · หน้า Detail (S7 S8 S10) = Section label "(n)" (R5 R11) · ไม่มียานพาหนะ = Empty state/Data empty "ยังไม่มีรายการอะไหล่" แบบ noParts ของ S1
   วางต่อจากตารางยานพาหนะในแผนเดินทาง (แบบหัวข้ออะไหล่ในไตรมาส n ของหน้าไตรมาส) */
const TRIP_PARTS_EMPTY = 'เพิ่มยานพาหนะเข้าแผนเดินทางแล้ว อะไหล่ของยานพาหนะแต่ละคันจะรวมมาที่นี่';
async function tripPartsSec(sel, detail) {
  const rows = tripParts(sel), head = detail ? await sectionLabel('อะไหล่ของแผนเดินทาง') : await section('อะไหล่ของแผนเดินทาง'); // 9 พ.ย. 2569 เจ้าของงาน "เอาเลขออกไปเลยได้ป่ะ ถ้าหมายถึงจำนวนชนิด" ⇒ หัวข้ออะไหล่รวมตามรายการไม่มีตัวเลขจำนวนชนิด
  return col('Section', [head, rows.length ? await tblShort(QPART_COLS, rows) : await noParts(TRIP_PARTS_EMPTY)], 16);
}
async function tripForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const head = o.edit ? 'แก้ไขแผนเดินทาง' : 'สร้างแผนเดินทาง';   // o.edit = แก้ใบที่ผู้อนุมัติส่งกลับ (S7) · ฟอร์มเดียวกัน ปุ่มท้าย "ส่งอนุมัติใหม่"
  const { scr, page } = await shell(name, { title: head + ' · ' + NOW_Q, back: true, crumbs: [P[1], NOW_Q, head] });   // 5 พ.ย. 2569 breadcrumb ต่อจากหน้า "ไตรมาส 1"
  const sel = o.sel || [];
  const car = { sec: col('Section', [await section('ยานพาหนะในแผนเดินทาง', { badge: sel.length || null, buttons: [{ kind: 'Secondary button', text: 'เพิ่มยานพาหนะ', icon: 'add-24-300-round' }] })], 16) };
  const hire = o.mode === 'hire';   // o.mode = 'hire' จ้างดำเนินการ (S9) · ค่าเริ่มต้น ดำเนินการเอง (S6)
  const ft = { d1: v.d1, d2: v.d2, works: o.works, locs: o.locs, phones: o.phones, hire };   // ค่าในฟอร์ม = ใบแผนเดินทาง (R82 tripVCells) · o.works = วันดำเนินการที่แก้ { ลำดับยานพาหนะ: [ตั้งแต่, ถึง] }
  if (sel.length) add(car.sec, await tblShort(TRIP_CAR_COLS, sel.map(i => tripVCells(i, ft).concat([{ icons: ['stylus-24-300-round', 'delete-24-300-round'] }]))), 'h');
  else add(car.sec, await noTripCars(), 'h');   // 5 พ.ย. 2569 เลิก Alert "กรุณาเพิ่มรถเข้าแผนเดินทางอย่างน้อย 1 คัน" — ปุ่มยืนยัน Disabled จนกว่าจะมีรถแทน
  // 3 พ.ย. 2569 เจ้าของงาน: ชื่อแผนเดินทางกับรูปแบบดำเนินการแถวเดียวกันคนละครึ่ง radio เล็ก (เดิม Radio text card เต็มแถว) · mobile เรียงลงตาม row()
  // 6 พ.ย. 2569 เจ้าของงาน "เปลี่ยนคำ กบค ดำเนินการเอง เป็น ดำเนินการเอง"
  const mode = radioGroup('รูปแบบดำเนินการ', ['ดำเนินการเอง', 'จ้างดำเนินการ'], hire ? 1 : 0);
  const vendor = hire ? dropdown('ผู้รับจ้าง', v.vendor, { placeholder: 'ค้นหาชื่อผู้รับจ้าง', lead: 'search-24-300-round', error: E('กรุณาเลือกผู้รับจ้าง'), state: o.vendorOpen ? 'Focused' : undefined }) : null;
  const d1 = field(hire ? 'วันที่เริ่มงาน' : 'วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม'), state: o.dateOpen ? 'Focused' : undefined });
  const d2 = field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') });
  /* 5 พ.ย. 2569 รีวิว (E.7 ไม่ถูกต้อง) "ระบบเราใช้ Validate แบบต้องกรอกข้อมูลที่ require ครบถึงจะ enable ปุ่ม" ⇒ ปุ่มยืนยัน Disabled จนกว่าช่องบังคับครบ · o.errors = Validation กรณีไม่ได้ระบุข้อมูล, Out of focus */
  const complete = !!(v.name && sel.length && v.d1 && v.d2 && (hire ? v.vendor : v.staff && v.staff[0] && v.staff[1]));
  /* 6 พ.ย. 2569 เจ้าของงาน "เปลี่ยนคำของพนักงาน กบค" + "จำนวนคนเดินทาง เพิ่ม ได้ไม่จำกัด" ⇒ หัวข้อ "พนักงานที่เดินทาง" (เดิม พนักงาน กบค. ซ่อม 2-3 คน) · 1 คน 1 แถว
     แบบเดียวกับแถวพนักงานในค่าใช้จ่ายตอนปิดงาน (closeCosts · เจ้าของงาน 3 พ.ย. "เพิ่ม ลด พนักงานได้"): Input dropdown ค้นชื่อ + ปุ่มลบ Tertiary button ไอคอนอย่างเดียว + ปุ่ม "เพิ่มพนักงาน" ใต้แถว
     ยังต้องมีอย่างน้อย 2 คนเหมือนเดิม (ช่องคนที่ 1 2 ขึ้น error) · ฟอร์มว่างแสดง 2 แถว
     9 พ.ย. 2569 เจ้าของงาน "พนักงานสามารถเพิ่มได้ไม่จำกัด และ เป็น 1 คน 1 แถว เป็นชื่อ สกุล ตำแหน่ง เบอร์โทร" ⇒ แถวละ ชื่อ-สกุล (Input dropdown ค้นหา) · ตำแหน่ง (Text input Readonly เติมจากข้อมูลพนักงานเมื่อเลือกชื่อ) · เบอร์โทร (Text input เติมจากข้อมูลพนักงาน แก้ได้) · ปุ่มลบ
     แบบคู่ ผู้ดูแลยานพาหนะ / เบอร์ติดต่อ ของ popup ยานพาหนะในแผนเดินทาง (R83) */
  const delBtn = () => inst('Tertiary button', { State: 'Default', Size: 'md' }, { 'Button text': false, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('delete-24-300-round') });
  const staffNames = v.staff && v.staff.length ? v.staff : ['', ''];
  const staff = staffNames.map((nm, i) => {
    const info = STAFF_INFO[nm] || ['', ''];
    const dd = dropdown('ชื่อ-สกุล', nm, { placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round', error: i < 2 ? E('กรุณาเลือกพนักงาน') : '' });
    const pos = field('ตำแหน่ง', info[0], { state: 'Readonly', placeholder: '-' });
    const tel = field('เบอร์โทร', info[1], { placeholder: '0XX-XXX-XXXX' });
    if (MOB) return col('Row', [dd, pos, tel, delBtn()], 16);
    const rw = row('Row', [dd, pos, tel], { align: 'MAX' }); rw.appendChild(delBtn());   // ปุ่มลบท้ายแถว ไม่ยืด
    return rw;
  });
  add(page, col('Content', [
    o.alert ? alertBox(...o.alert) : null,
    col('Section', [await section('ข้อมูลแผนเดินทาง'), row('Row', [field('ชื่อแผนเดินทาง', v.name, { placeholder: 'ระบุชื่อแผนเดินทาง', error: E('กรุณาระบุชื่อแผนเดินทาง') }), mode])], 16),   // ตามช่อง "ชื่อแผน" ของ S1 (ข้อมูลแผน) + radio แบบ 5.1 Rental Contract Management
    hire ? col('Section', [await section('ผู้รับจ้าง'), row('Row', [vendor, field('เลขที่สัญญา/ใบสั่งจ้าง', v.contract, { placeholder: 'ระบุเลขที่สัญญาหรือใบสั่งจ้าง', optional: true })])], 16) : null,
    // 6 พ.ย. 2569 เจ้าของงาน "ย้าย ช่วงวันเดินทางขึ้นมาก่อนเลือกรถ" + "พนักงาน ขึ้นไปก่อนการเลือกรถ" ⇒ ข้อมูลแผนเดินทาง → (ผู้รับจ้าง) → ช่วงวัน → พนักงาน → รถในแผนเดินทาง
    col('Section', [await section(hire ? 'ช่วงวันทำงาน' : 'ช่วงวันเดินทาง'), row('Row', [d1, d2, frame('Spacer', 'VERTICAL')])], 16),
    hire ? null : col('Section', [await section('พนักงานที่เดินทาง', { badge: v.staff && v.staff.length ? v.staff.length + ' คน' : null })].concat(staff, [btn('Secondary button', 'เพิ่มพนักงาน', { icon: 'add-24-300-round' })]), 16),
    car.sec,
    await tripPartsSec(sel),   // 6 พ.ย. 2569 อะไหล่ของแผนเดินทาง ใต้ตารางยานพาหนะ (R82)
    // 3 พ.ย. 2569 เจ้าของงาน: ค่าเบี้ยเลี้ยง ค่าที่พัก ค่าเดินทาง ไม่กรอกในแผนเดินทางแล้ว ย้ายไปกรอกรายคันตอนปิดงาน (S10) พร้อมเลือกงบ ตั้งต้นศูนย์ต้นทุนของหน่วยงานเจ้าของรถ
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', o.edit ? 'ส่งอนุมัติใหม่' : 'ยืนยันการสร้างแผนเดินทาง', { size: 'lg', disabled: !complete }]])
  ], 32), 'h');
  if (o.vendorOpen && vendor) comboAt(scr, vendor.findOne(n => n.name === 'Container') || vendor, VENDORS.map(x => [x[0], x[1], x[0] === v.vendor]));   // vendor list = Dropdown list ใต้ช่อง (R4 พิมพ์ค้น)
  if (o.modal) await tripCarModal(scr, o.modal);
  if (o.dateOpen && !MOB) {   // ปฏิทินช่วงวัน = Date picker Type=Dual ของไลบรารี วางใต้ช่องวันที่
    const dp = await thaiDatePicker(inst('Date picker', { Type: 'Dual' }, { 'Time picker': false }), ['พฤศจิกายน 2569', 'ธันวาคม 2569']);   // ช่วงวันเดินทาง 03–07/11/2569
    overlay(scr, dp, 0, 0);
    const sb = scr.absoluteBoundingBox, ab = d1.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4;
  }
  return scr;
}
/* ปฏิทิน Date picker ภาษาไทย (ชีตลูกค้า 5 พ.ย. 2569: ข้อความตั้งต้นของไลบรารีเป็นอังกฤษ "Dec 2024" "Today" "Cancel" "Apply") — ทุกคำเป็น property Text ของชิ้นซ้อน แก้ได้
   ตาม Date picker ในหน้า Vehicle Management ของ UI Release#2: หัวเดือน "มกราคม 2567" · ปุ่ม "ปิด" / "ตกลง" · ปุ่ม Today/Clear ไม่แสดง · ชื่อวันใส่อักษรย่อไทย (UI Release#2 ยังคง Mo–Su)
   ตัวเลขวันในตารางคงตามไลบรารี (ตำแหน่งวันของเดือนจริงจัดใน component ไม่ได้) */
const TH_WD = { Mo: 'จ.', Tu: 'อ.', We: 'พ.', Th: 'พฤ.', Fr: 'ศ.', Sa: 'ส.', Su: 'อา.' };
const ptext = (n) => { const cp = n.componentProperties || {}, k = Object.keys(cp).find(x => x.split('#')[0].trim() === 'Text'); return k ? cp[k].value : ''; };
async function thaiDatePicker(dp, months) {   // ตั้ง property แล้วทับชั้นข้อความที่เห็นด้วย (putText) กันค่าที่ component ทับไว้
  let m = 0;
  const put = async (n, v) => { setProps(n, { Text: v }); await putText(n, 'Text', v); };
  for (const n of dp.findAll(x => x.type === 'INSTANCE')) {
    const tl = n.findAll(x => x.type === 'TEXT' && x.name === 'Text' && x.visible !== false)[0];
    const t = tl ? tl.characters : ptext(n);   // อ่านค่าที่เห็นจากชั้นข้อความ (ตรงกับ property ในไฟล์จริง)
    if (n.name === 'Tertiary button' && /^[A-Z][a-z]{2} \d{4}$/.test(t)) await put(n, months[Math.min(m++, months.length - 1)]);
    else if (n.name === '_Date picker calendar item base' && TH_WD[t]) await put(n, TH_WD[t]);
    else if (n.name === 'Tertiary brand button') n.visible = false;
    else if (n.name === 'Secondary button') await put(n, 'ปิด');
    else if (n.name === 'Primary button') await put(n, 'ตกลง');
  }
  return dp;
}
const TRIP_DATES = { d1: TRIP.d1, d2: TRIP.d2 };   // ช่วงวันเดินทางของฟอร์ม (03–07/11/2569) = ช่วงที่เลือกวันดำเนินการได้ (R83)
const TRIP_FILLED = { name: 'ตรวจยานพาหนะ ขอนแก่น อุดรธานี ลำปาง', place: TRIP.place, d1: TRIP.d1, d2: TRIP.d2, staff: TRIP.staff, perDiem: TRIP.perDiem, lodging: TRIP.lodging, travel: TRIP.travel };
/* popup แก้ไขรถในแผนเดินทาง (ไอคอนแก้ไขในแถว) = formModal (Modal Type=Form) 2 ช่อง เบอร์ติดต่อ + สถานที่บำรุงรักษา · ค่าตั้งต้นในช่อง = ค่าปัจจุบันของแถว
   3 พ.ย. 2569 เพิ่มเบอร์ติดต่อ (เดิมแก้แค่สถานที่) · ตัวอย่างแสดงค่าที่กำลังแก้ */
/* 6 พ.ย. 2569 เจ้าของงาน "ตรงป๊อบอัพ เลยต้องมีให้แก้ชื่อโดย prefill ข้อมูลมาให้" ⇒ 3 ช่อง ผู้ดูแลยานพาหนะ (ค่าเริ่มต้นชื่อผู้ควบคุมรถ) · เบอร์ติดต่อ · สถานที่บำรุงรักษา */
/* 6 พ.ย. 2569 รีวิว S6 "เพิ่มการเลือกวันดำเนิน จาก icon แก้ไข ได้ด้วย" + "โดยเลือกได้ไม่เกิน range ของแผนที่กำหนดมาเท่านั้น" + "เลือกซ้ำวันกันได้ เลือกเป็นช่วงวัน" (R83)
   ⇒ o.trip = ใบแผนเดินทาง/ค่าในฟอร์ม { d1, d2, works, hire|vendor } (ยานพาหนะอยู่ในแผนเดินทาง) — popup หัว "แก้ไขยานพาหนะในแผนเดินทาง · {ทะเบียน}" 4 ช่องใน Modal Type=Form md (Card form row 3 แถว):
   แถว 1 ผู้ดูแลยานพาหนะ | เบอร์ติดต่อ (Input 1 + Input 2 ของ Card form row) · แถว 2 สถานที่บำรุงรักษา · แถว 3 วันดำเนินการ (ช่วงวันในช่องเดียว "วว/ดด/ปปปป - วว/ดด/ปปปป" ไอคอนปฏิทินนำหน้า
   แบบ Date range picker / Trip date ของ UI Release#2 หน้า 5.2 Vehicle Management = Text input + Date picker Type=Single แสดงช่วงด้วย Selected day / Day in range) · ค่าเริ่มต้นทั้งช่วงวันเดินทาง (แผนจ้าง = ช่วงวันทำงาน)
   o.pick = [วันเริ่ม, วันสิ้นสุด] เปิดปฏิทินใต้ช่อง: วันนอกช่วงวันเดินทาง = _Date picker calendar item base State=Disabled (กดไม่ได้) · มือถือไม่วางปฏิทิน (แบบช่องวันที่ของ S6)
   ไม่มี o.trip (หน้าไตรมาส ยานพาหนะยังไม่อยู่ในแผนเดินทาง) = 3 ช่องแบบเดิม หัว "แก้ไขผู้ดูแลยานพาหนะและสถานที่ · {ทะเบียน}" */
const TH_MONTH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const dayOf = (s) => +s.split('/')[0], monthOf = (s) => { const [, m, y] = s.split('/'); return TH_MONTH[+m - 1] + ' ' + y; };
const workRange = (i, t) => (t.works || {})[i] || [t.d1, t.d2];
async function tripCarEdit(scr, i, phones, locs, o) {
  o = o || {};
  const t = o.trip, plate = TRIP_CARS[i][0];
  if (!t) { await formModal(scr, { title: 'แก้ไขผู้ดูแลยานพาหนะและสถานที่ · ' + plate, fields: [{ label: 'เบอร์ติดต่อ', value: tripPhone(i, phones) }, { label: 'ผู้ดูแลยานพาหนะ', value: tripCtrl(i, phones) }, { label: 'สถานที่บำรุงรักษา', value: tripLoc(i, locs) }], ok: 'บันทึก' }); return; }
  const w = o.pick || workRange(i, t);
  await formModal(scr, { title: 'แก้ไขยานพาหนะในแผนเดินทาง · ' + plate, fields: [{ pair: [{ label: 'เบอร์ติดต่อ', value: tripPhone(i, phones) }, { label: 'ผู้ดูแลยานพาหนะ', value: tripCtrl(i, phones) }] },   // เบอร์ก่อนชื่อ ตามคอลัมน์ (9 พ.ย. 2569)
    { label: 'สถานที่บำรุงรักษา', value: tripLoc(i, locs) }, { label: 'วันดำเนินการ', value: w[0] + ' - ' + w[1] }], ok: 'บันทึก' });
  const inp = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Text input' && propVal(n, 'Label text') === 'วันดำเนินการ').pop();
  if (!inp) { warn('popup แก้ไขยานพาหนะในแผนเดินทาง', 'ไม่พบช่องวันดำเนินการ'); return; }
  setProps(inp, { 'Leading icon': true, 'Leading icon swap': icon('calendar_month-24-300-round') });
  if (!o.pick) return;
  const val = w[0] + ' - ' + w[1];
  setProps(inp, { State: 'Focused' }); setProps(inp, { Text: val, 'Show Placeholder': false, 'Leading icon': true, 'Leading icon swap': icon('calendar_month-24-300-round') });   // เปลี่ยน variant แล้วใส่ค่าซ้ำ (ชั้นข้อความกลับเป็นค่าตั้งต้นของ variant)
  { const ct = find(inp, 'Container'), tv = ct && ct.findOne(n => n.type === 'TEXT' && n.visible !== false); if (tv && tv.characters !== val) await text(ct, tv, val); }
  if (MOB) return;
  const dp = await rangeDays(await thaiDatePicker(inst('Date picker', { Type: 'Single' }, { 'Time picker': false }), [monthOf(t.d1)]), dayOf(t.d1), dayOf(t.d2), dayOf(w[0]), dayOf(w[1]));
  overlay(scr, dp, 0, 0);
  pin(() => { const sb = scr.absoluteBoundingBox, ab = inp.absoluteBoundingBox; dp.x = ab.x - sb.x; const below = ab.y - sb.y + ab.height + 4; dp.y = below + dp.height > VH() ? ab.y - sb.y - dp.height - 4 : below; });   // ใต้ช่อง · ล้นขอบล่างของจอให้ขึ้นเหนือช่อง
}
/* ช่วงวันในปฏิทิน Date picker (ตาม Date picker Type=Dual ของไฟล์ Component + Date range picker / Trip date ของ UI Release#2): วันเริ่มและวันสิ้นสุด = Type "Selected day" · ระหว่างนั้น = "Day in range"
   วันนอกช่วงที่เลือกได้ (lo..hi = ช่วงวันเดินทาง) = Type "Day" State "Disabled" · วันของเดือนถัดไปที่ไลบรารีตั้ง Disabled ไว้แล้วไม่แตะ · ตำแหน่งวันในตารางคงตามไลบรารี (แบบ thaiDatePicker) */
async function rangeDays(dp, lo, hi, a, b) {
  for (const n of dp.findAll(x => x.type === 'INSTANCE' && x.name === '_Date picker calendar item base')) {
    const tl = n.findAll(x => x.type === 'TEXT' && x.name === 'Text' && x.visible !== false)[0], d = +((tl ? tl.characters : ptext(n)) || '').trim();
    if (!d || propVal(n, 'State') === 'Disabled') continue;   // ชื่อวัน (จ. อ. …) และวันของเดือนถัดไป
    const out = d < lo || d > hi, ends = d === a || d === b, mid = d > a && d < b;
    setProps(n, { Type: out ? 'Day' : ends ? 'Selected day' : mid ? 'Day in range' : 'Day', State: out ? 'Disabled' : 'Default' });
    setProps(n, { 'Left connector': mid || (ends && d === b && a !== b), 'Right connector': mid || (ends && d === a && a !== b), Indicator: false });
  }
  return dp;
}
async function noTripCars() { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มียานพาหนะในแผนเดินทาง'); await text(es, 'Supporting text', 'กดเพิ่มยานพาหนะเพื่อเลือกยานพาหนะของ' + NOW_Q + ' ที่ยังไม่อยู่ในแผนเดินทางใด'); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
/* popup เพิ่มรถเข้าแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "รายการรถทั้งหมดที่อยู่ในแผนไตรมาสนั้น โดยมีปุ่มให้เพิ่มรถเข้าแผนการเดินทาง")
   ตามโครง Modal Type=Card list Size=xl "เลือกยานพาหนะ" ของไฟล์ Component (Modal header + Table header ค้นหา + เนื้อหา ขอบใน 24 ระยะ 24 มุม 12)
   + ตารางติ๊กเลือกรถ Table Lead checkbox ตามหน้า Vehicle Management "Export reports - Select vehicles" ของ UI Release#2 + Modal footer Horizontal right
   Modal instance เพิ่มตารางข้างในไม่ได้ ⇒ วางชิ้นไลบรารีเรียงในกรอบ Modal แบบเดียวกับ bottom sheet (§จ) · กว้าง 800 = Modal Size=lg · mobile = bottom sheet
   o.pool = รถที่เลือกได้ (ของไตรมาสที่ยังไม่อยู่ในแผนเดินทางใด และยังไม่อยู่ในใบนี้) · o.ticked = ที่ติ๊กไว้ · o.used = จำนวนรถของไตรมาสที่อยู่ในแผนเดินทางอื่นแล้ว */
/* 5 พ.ย. 2569 รีวิว "รถ 1 คันในไตรมาส สามารถอยู่ได้เพียง 1 แผนการเดินทางเท่านั้น · รถที่ถูกเลือกลงแผนอื่นไปแล้ว จะยังแสดงให้เห็นตอนที่กดเพิ่มรถเข้าแผนเดินทาง แต่ไม่สามารถเลือกลงแผนเดินทางนี้ได้"
   ⇒ o.taken = { ลำดับรถ: ชื่อแผนเดินทาง } แสดงในตาราง Checkbox State=Disabled + บรรทัดรอง "อยู่ในแผนเดินทาง {ชื่อ}" · ติ๊กทั้งหมดนับเฉพาะคันที่เลือกได้
   13 พ.ย. 2569 ใช้ฟอร์มกลาง pickModal (เจ้าของงาน "อยากให้เลือกรถเข้าแผน ใช้วิธีการเดียวกับเลือกรถเข้าไตรมาส") — แผงตัวกรองกาง · แบ่งหน้าทุก popup · คอลัมน์ชุดเดียวกับ TripCarPicker ของเว็บ (ทะเบียน · ยี่ห้อ/รุ่น · บำรุงรักษาเครื่องจักรล่าสุด · ซ่อมเครื่องจักรล่าสุด · BACKLOG 64)
   เดิม TRIP_PICK_COLS ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของยานพาหนะ กว้าง 800 ไม่มีตัวกรอง · o.pagination = { shown, total } ของ popup เพิ่มยานพาหนะเข้าไตรมาส (E.19 · R104) */
async function tripCarModal(scr, o) {   // o.cars = รายการรถแทน TRIP_CARS (เพิ่มรถเข้าไตรมาส E.19) · o.title · o.sub · o.okText · o.pool = ลำดับรถที่แสดง · o.taken · o.empty = [หัว, รอง] (R75)
  const cars = o.cars || TRIP_CARS, taken = o.taken || {}, nTaken = o.pool.filter(i => taken[i]).length;
  await pickModal(scr, Object.assign({}, o, {
    items: o.pool.map(i => [cars[i], i]), cols: PICK_MODAL_COLS, cell: (c, i) => [c[1], lastMa(c, i), lastRepair(c, i)], total: o.pagination ? o.pagination.total : null,
    title: o.title || 'เพิ่มยานพาหนะเข้าแผนเดินทาง', okText: o.okText || 'เพิ่มเข้าแผนเดินทาง',
    sub: o.sub || ('ยานพาหนะทุกคันของ' + NOW_Q + (nTaken ? ' · ' + nTaken + ' คันอยู่ในแผนเดินทางอื่นแล้ว เลือกไม่ได้' : '')),
    emptyText: o.empty || ['ยานพาหนะทุกคันของ' + NOW_Q + ' อยู่ในแผนเดินทางแล้ว', 'ไม่มียานพาหนะที่เพิ่มเข้าแผนเดินทางนี้ได้'] }));
}
/* popup ประกอบจากไลบรารี (Modal ของไลบรารีใส่ Table / File upload ไม่ได้): Background overlay + กรอบ Modal (มุม 12) + Modal header + เนื้อหา (ขอบใน 24 ระยะ 24) + Modal footer Horizontal right
   ตามโครง Modal Type=Card list xl ของไฟล์ Component + popup Open Job / Repair Completed หน้า RP & MA Job ของ UI Release#2 · mobile = bottom sheet (sheet())
   o.title · o.sub · o.w (กว้าง ค่าเริ่ม 640) · o.body (node เนื้อหา) · o.ok (ปุ่มหลัก) · o.okOff = ปุ่มหลักกดไม่ได้ · 3 พ.ย. 2569 แยกจาก tripCarModal ให้ S10 ใช้ด้วย */
async function popupModal(scr, o) {
  if (MOB) {
    const r = await sheet(scr, { title: o.title, content: o.body, ok: o.ok, cancel: 'ยกเลิก' });
    const pb = find(r.sh, 'Primary button'); if (pb && o.okOff) setProps(pb, { State: 'Disabled' });
    return r;
  }
  overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), VH());
  const m = frame('Modal', 'VERTICAL', { fill: WHITE });
  m.cornerRadius = 12;
  overlay(scr, m, 0, 0); m.counterAxisSizingMode = 'FIXED'; m.resize(o.w || 640, m.height);
  const hd = inst('Modal header', { Alignment: 'Left' }, { Title: o.title, Supporting: !!o.sub, 'Supporting text': o.sub || '', 'Featured icon': false, 'Back icon': false, 'Close icon': true, Divider: false });
  add(m, hd, 'h');
  const body = frame('Content', 'VERTICAL', { gap: 24, pad: [0, 24] }); body.paddingBottom = 24;
  add(m, body, 'h');
  o.body.forEach(n => { if (n) add(body, n, 'h'); });
  const ft = inst('Modal footer', { Alignment: 'Horizontal right' }, { 'Tertiary action': false, Divider: false });
  add(m, ft, 'h');
  // ปุ่มของ Modal footer อยู่ใน Actions > "Primary and secondary actions" (แบบ formModal ใน core · 5 พ.ย. 2569) — เดิมกรองแค่ลูกของ Actions ปุ่มหลักจึงค้างคำของไลบรารี
  ft.findAll(b => b.type === 'INSTANCE' && /button/.test(b.name) && b.parent && (b.parent.name === 'Actions' || b.parent.name === 'Primary and secondary actions')).forEach(b => {
    if (b.name === 'Primary button') setProps(b, { Text: o.ok, 'Leading icon': false, 'Trailing icon': false, State: o.okOff ? 'Disabled' : 'Default' });
    else if (b.name === 'Secondary button') setProps(b, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
    else b.visible = false;
  });
  m.x = (VW() - m.width) / 2; m.y = Math.max(40, (VH() - m.height) / 2);
  return { m, body };
}

/* ---------- S10 บำรุงรักษารายคันตามแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "จริงมันควรเข้าได้จากหน้าแผนการเดินทาง แล้วเลือกบำรุงรถทีละคัน") ----------
   เลือกแล้ว: ทางเข้า = หน้ารายละเอียดแผนเดินทาง (ไอคอน › ในตารางแผนเดินทางของ E.1 หรือแจ้งเตือน) · หน้ารายคัน = ทำทีละขั้นตามหน้า RP & MA Job ของ UI Release#2
   (Page header Badge สถานะ + ปุ่มขวา · Section label + Content item row · popup เริ่มงาน แบบ Open Job · ปิดงานเป็นหน้าฟอร์มเต็ม เพราะตารางงาน + ภาพ 4 ช่อง + ช่องกรอก เกินความสูง popup)
   ข้อมูล = แผนเดินทางใบแรก TRIP_1 ที่อนุมัติแล้ว · รถคันแรก 82-6789 ขอนแก่น */
/* ตารางสั้นไม่มีแบ่งหน้า (5 พ.ย. 2569 ชีตลูกค้า: ข้อความตัวอย่าง "แสดง 1 ถึง 10  จาก 95 รายการ" ของ Table ค้างในจอที่รายการน้อย)
   tbl() ปิด property Pagination แล้ว แต่ชั้น Table pagination ในไฟล์จริงยังเห็น ⇒ ซ่อนชั้นนั้นตรงๆ · ใช้กับทุกตารางของปลั๊กอินนี้ที่ไม่แบ่งหน้า (ตารางที่แบ่งหน้าส่ง o.pagination ตัวเลขจริงตาม fillPagination)
   5 พ.ย. 2569 รอบ 2: จาก S10 S12 ขยายเป็นทุก tbl() ของปลั๊กอินบำรุงรักษา (Overhaul / ประเมินผู้รับจ้าง ไม่แตะ) */
/* 9 พ.ย. 2569 เจ้าของงาน (ภาพหน้ารายละเอียดแผน) "รายละเอียด ควรเป็นการ จอง section แบบได้แค่ 10 รายการ และถ้าเกินจะมี pagiation มา"
   ⇒ ตารางที่ไม่ได้กำหนดการแบ่งหน้าเอง แสดงไม่เกิน 10 แถว (TABLE_MAX.rows) เกินแล้วแสดงหน้าแรก 10 แถว + Table pagination "แสดง 1 ถึง 10 จาก n รายการ" · ไม่เกินไม่มีตัวแบ่งหน้า */
async function tblShort(cols, rows, o) {
  if (!(o && o.pagination) && rows.length > TABLE_MAX.rows) { o = Object.assign({}, o, { pagination: { shown: TABLE_MAX.rows, total: rows.length } }); rows = rows.slice(0, TABLE_MAX.rows); }
  const t = await tbl(cols, rows, o); if (!(o && o.pagination)) (t.findAll ? t.findAll(n => n.name === 'Table pagination') : []).forEach(n => { n.visible = false; }); return t;
}
const JOB_T = tripAs(TRIP_1, 'approved'), JOB_I = TRIP_1.sel[0];
const JOB_START = '04/11/2569 08:42 น.', JOB_END = '04/11/2569 11:15 น.', JOB_BY = TRIP.staff[0] + ' (' + UNITS[0] + ')';
const JOB_MIX = { [TRIP_1.sel[0]]: 'done', [TRIP_1.sel[1]]: 'doing', [TRIP_1.sel[2]]: 'cannot' };   // หลังปิดงานคันแรก: คันที่ 2 กำลังทำ · คันที่ 3 บำรุงรักษาไม่ได้ · คันที่ 4 ยังไม่เริ่ม
const JOB_CANNOT = 'ยานพาหนะติดภารกิจซ่อมสายส่งฉุกเฉิน ไม่อยู่ที่จุดนัดในวันเดินทาง';
const TRIP_JOB_COLS = tripVCols({ unitSub: true }).concat([['สถานะงาน', 260, 'Badge'], ['', 72]]);   // R82 ชุด TRIP_V_COLS (หน่วยงานเป็นบรรทัดรองของทะเบียน ให้พอ 8 คอลัมน์) + สถานะงาน + ปุ่ม … · 260 = สองป้าย (สถานะ + ผลน้ำมัน · 4 พ.ย. 2569 เดิม 320)
/* ปุ่ม "…" ท้ายแถวรถ (3 พ.ย. 2569 เจ้าของงาน "คอลัมน์สุดท้ายอยากได้เป็นจุดสามจุดที่กดไปมีดูรายละเอียด แก้ไข และลบ") แบบเมนูรายการแผน S19 S20 (planMenu)
   รายการตามสถานะงาน (เสนอ): ยังไม่เริ่ม = ดูรายละเอียด แก้ไข ลบ · อยู่ระหว่างบำรุงรักษา = ดูรายละเอียด แก้ไข · เสร็จสิ้น / บำรุงรักษาไม่ได้ = ดูรายละเอียด
   แก้ไข = popup แก้เบอร์ติดต่อและสถานที่ (tripCarEdit เดียวกับ S6) · ลบ = ยืนยันแล้วเอารถออกจากแผนเดินทาง */
const JOB_MENU = { todo: MENU, doing: MENU.slice(0, 2), done: MENU.slice(0, 1), cannot: MENU.slice(0, 1) };   // done = คันที่เลือกน้ำมันแบบมีเก็บตัวอย่าง (ตัวอย่าง JOB_OIL) · ไม่ได้เก็บตัวอย่างเหลือ ดูรายละเอียด
/* S23 มุมผู้รับจ้าง: ทุกสถานะมีแค่ "ดูรายละเอียด" (เจ้าของงาน 4 พ.ย. 2569 "vendor ดูรายละเอียดรายคัน จะเห็นแค่ ปุ่มเริ่มงาน และบำรุงรักษาได้ โดยไม่เห็นปุ่ม ลบ และแก้ไข แต่ว่า กบค จะเห็น อยากให้แยก view" · คงเดิม 10 พ.ย. 2569 R87) */
const VENDOR_MENU = MENU.slice(0, 1);
/* ยืนยันการออก ชุดเดียวทุกฟอร์ม (5 พ.ย. 2569 ชีตลูกค้า: ฟอร์มสร้าง "ปิด"/"ออก" แต่ฟอร์มแก้ไข "ปิด"/"ยืนยัน") ⇒ ปุ่มตามหน้าต่างออกจากหน้าของงานซ่อม
   (ไฟล์ Maintain-D หน้า แจ้งซ่อม / Flow การซ่อม: "ยกเลิก" / "ยืนยัน") · ปุ่มเดียวกับยืนยันอื่นของปลั๊กอินนี้ (ยกเลิก + ปุ่มยืนยัน) · หัวและบรรทัดรองคงเดิม */
const EXIT_CONFIRM = (sub) => ({ title: 'ยืนยันการออก', sub, cancel: 'ยกเลิก', ok: 'ยืนยัน' });
const CAR_REMOVE_CONFIRM = (c) => ({ danger: true, title: 'ยืนยันการเอายานพาหนะออกจากแผนเดินทาง', sub: c[0] + ' จะถูกเอาออกจากแผนเดินทางนี้ และเลือกเข้าแผนเดินทางใบอื่นของไตรมาสได้อีก', cancel: 'ยกเลิก', ok: 'เอาออก' });
async function tripDetail(name, o) {   // หน้ารายละเอียดแผนเดินทาง (หลังอนุมัติ) · o.trip = ใบที่แสดง (ค่าเริ่ม JOB_T · ใบจ้าง HIRE_T ที่ หน่วยงานปิดงานแทนผู้รับจ้าง 4 พ.ย. 2569) · o.st = { ลำดับรถ: สถานะใน WSTAT } · o.menu / o.edit / o.del = เมนู … ของรถคันแรก
  o = o || {};
  const t = o.trip || JOB_T, st = (i) => (o.st || {})[i] || 'todo', cnt = (k) => t.sel.filter(i => st(i) === k).length, v = !!o.vendor;   // o.vendor = S23 มุมผู้รับจ้าง (R87)
  /* ตัวนับความคืบหน้า (รีวิว 5 พ.ย. 2569 "อยากให้มีนับ progress แบบ 0/10 ของรายการรถที่ตรวจแล้ว" · R71) = เสร็จสิ้น / (รถทั้งหมดในแผนเดินทาง − บำรุงรักษาไม่ได้)
     เจ้าของงาน 5 พ.ย. 2569 "ถ้าบำรุงรักษาไม่ได้ ไม่เอามานับ เช่น ถ้าทั้งหมด 10 แล้วมีคันที่ไม่ได้บำรุงรักษา จะเหลือ 9" · ใบจ้างนับแบบเดียวกัน
     S23 มุมผู้รับจ้าง (10 พ.ย. 2569 · เสนอ ยังไม่เคาะ): ตรวจแล้ว = ผู้รับจ้างทำเสร็จแล้ว (ดำเนินการบำรุงรักษาแล้ว · รอตรวจรับ · เสร็จสิ้น) · ไม่นับรวม = บำรุงรักษาไม่ได้ · แจ้งบำรุงรักษาไม่ได้ */
  const sum = (ks) => ks.reduce((a, k) => a + cnt(k), 0), doneK = v ? ['worked', 'wait', 'done'] : ['done'], outK = v ? ['reported', 'cannot'] : ['cannot'];
  const total = t.sel.length - sum(outK), counter = 'ตรวจแล้ว ' + sum(doneK) + '/' + total;
  const prog = (v ? 'ตรวจแล้ว ' + sum(doneK) : 'เสร็จสิ้น ' + cnt('done')) + ' จาก ' + total + ' คัน'
    + [['doing', ''], ['worked', ''], ['wait', ''], ['returned', ''], ['reported', ' (ไม่นับรวม)'], ['cannot', ' (ไม่นับรวม)']]
      .map(([k, x]) => cnt(k) ? ' · ' + WSTAT[k][0] + ' ' + cnt(k) + x : '').join('');
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: [P[1], NOW_Q, t.name], badge: TST.approved, actions: [TRIP_EXPORT_BTN] });   // 5 พ.ย. 2569 ต่อจากหน้า "ไตรมาส 1" · 6 พ.ย. 2569 ปุ่มส่งออกที่หัวหน้า (R84)
  const rows = t.sel.map(i => tripVCells(i, t, { unitSub: true }).concat([st(i) === 'done' && (o.oil || {})[i] ? { pills: [WSTAT.done, OIL_TAG[o.oil[i]]], pillsHead: 'ผลตรวจน้ำมัน' } : { pill: WSTAT[st(i)] }, { menu: 1, items: v ? VENDOR_MENU : JOB_MENU[st(i)] }]));   // o.oil = { ลำดับรถ: wait|fail } ป้ายผลน้ำมันต่อจากสถานะ (S12 · 4 พ.ย. 2569)
  add(page, col('Content', [await vehicleInfo(tripKv(t).concat([['ความคืบหน้า', prog]]), 'รายละเอียดแผนเดินทาง'),
    // ตัวนับ = Badge outline ใน Section header แบบ "รายการยานพาหนะในสัญญา" + Badge "2 รายการ" หน้า 5.1 Rental Contract Management ของ UI Release#2 (Section label ไม่มีช่อง Badge)
    col('Section', [await section('ยานพาหนะในแผนเดินทาง', { badge: counter }), await tblShort(TRIP_JOB_COLS, rows)], 16),
    await tripPartsSec(t.sel, true)], 32), 'h');   // 6 พ.ย. 2569 อะไหล่ของแผนเดินทาง (R82)
  const i0 = t.sel[0];
  if (o.menu) planMenu(scr, v ? VENDOR_MENU : JOB_MENU[st(i0)]);   // ใบจ้างที่หน่วยงานปิดงานแทน (S10) = เมนูชุดเดียวกับแผนดำเนินการเอง · มุมผู้รับจ้าง (S23) = ดูรายละเอียดอย่างเดียว (R87)
  if (o.edit) await tripCarEdit(scr, i0, t.phones, t.locs, { trip: t });   // 6 พ.ย. 2569 popup มีวันดำเนินการด้วย (R83)
  if (o.del) await confirm(scr, CAR_REMOVE_CONFIRM(TRIP_CARS[i0]));
  if (o.exportPdf != null) await tripExport(scr, o.exportPdf, t);   // R84 popup ส่งออกแผนเดินทาง
  return scr;
}
/* ---------- ส่งออกแผนเดินทาง (R84 · 6 พ.ย. 2569 เจ้าของงาน "ตอน export ก็เกี่ยวข้องด้วย" · plan.md "ปุ่มส่งออก PDF/Excel ข้อมูลทั้งหน้า (แนบเอกสารยืมยานพาหนะ)") ----------
   ปุ่ม Secondary button "ส่งออก" ไอคอน download ที่หัวหน้ารายละเอียดแผนเดินทาง (กรอบ Actions ข้าง Page header แบบปุ่มส่งออกของ S18 Overhaul R32 · ส่งออกไม่แก้ข้อมูล ฝั่งดูอย่างเดียว S8 ก็มี)
   popup = exportModal ชุดเดียวกับ S4 (Radio text card รูปแบบไฟล์ PDF / Excel) · ไม่มีการ์ดขอบเขต เพราะส่งออกใบเดียวทั้งหน้า · สำเร็จ = toast ขวาบน "ส่งออกไฟล์สำเร็จ" (คำเดียวกับ S4 และ Overhaul)
   ไฟล์ = docFrame ชุดเดียวกับ S4: PDF A4 2 หน้า (รายละเอียด + ยานพาหนะ · อะไหล่) · Excel 2 ชีต (ยานพาหนะ · อะไหล่) · คอลัมน์ = TRIP_V_COLS (R82) และ QPART_COLS (R81) ชุดเดียวกับจอ */
const TRIP_EXPORT_BTN = ['Secondary button', 'ส่งออก', 'download-24-300-round'];
const TRIP_SHEETS = ['ยานพาหนะในแผนเดินทาง', 'อะไหล่ของแผนเดินทาง'];
async function tripExport(scr, pdf, t) {
  return exportModal(scr, pdf, { title: 'ส่งออกแผนเดินทาง', sub: t.name + ' · รายละเอียดแผนเดินทาง ยานพาหนะ ' + t.sel.length + ' คัน และอะไหล่ของแผนเดินทาง' });
}
const tripDocHead = (t, page) => [sectionLabel('แผนเดินทาง · ' + t.name + ' · หน้า ' + page + '/2'), kv([['หน่วยงานที่ออกเอกสาร', CREATOR.replace(/^.*\((.*)\)$/, '$1')], ['แผน', P[0] + ' ' + P[1]], ['พิมพ์เมื่อ', '06/11/2569 10:30 น.'], ['ผู้พิมพ์', CREATOR]], 4)];
async function tripPdf(name, page, t) {
  t = t || JOB_T;
  return docFrame(name, 794, 1123, async () => {
    const [h, k] = tripDocHead(t, page), parts = tripParts(t.sel);
    if (page === 2) return [await h, k, col('Section', [await sectionLabel('อะไหล่ของแผนเดินทาง'), await tblShort(QPART_COLS, parts)], 12)];
    return [await h, k, col('Section', [await sectionLabel('รายละเอียดแผนเดินทาง'), kv(tripKv(t), 4)], 12),
      col('Section', [await sectionLabel('ยานพาหนะในแผนเดินทาง', { badge: t.sel.length }), await tblShort(tripVCols({ unitSub: true, fill: true }), t.sel.map(i => tripVCells(i, t, { unitSub: true })))], 12)];   // A4 กว้างไม่พอ 7 คอลัมน์ ⇒ หน่วยงานเป็นบรรทัดรองของทะเบียน
  });
}
async function tripXls(name, sheet, t) {
  t = t || JOB_T;
  return docFrame(name, 1440, 1024, async () => [await tabs(TRIP_SHEETS.map(s => [s, null]), sheet),
    sheet === 0 ? await tblShort(tripVCols(), t.sel.map(i => tripVCells(i, t))) : await tblShort(QPART_COLS, tripParts(t.sel))]);
}
/* S12 ผลการทดสอบน้ำมันไฮดรอลิก — 4 พ.ย. 2569 เจ้าของงาน "ไม่ได้อยากเป็น popup อยากได้เป็นส่วนหนึ่งของ flow เลย เช่น ถ้าเลือก เก็บตัวอย่างน้ำมันไฮดรอลิก ก็จะ มีให้เลือกเก็บผล แต่เป็น optional"
   + "ตอนนี้อยากให้ทางเข้าคือทางเดียวคือดูรายละเอียดแล้วเพิ่มในส่วนของรายละเอียด" ⇒ ใส่ผลได้ในหน้าปิดงาน (ไม่บังคับ) หรือภายหลังที่ section ในหน้างานรายคันที่เสร็จสิ้น · เลิก popup และเมนู "ผลการทดสอบน้ำมันไฮดรอลิก"
   รถที่เก็บตัวอย่างแต่ยังไม่มีผล = ป้าย "รอผลตรวจน้ำมัน" ต่อจากสถานะงาน (Table cell Style=Multiple badges · R49) · ผลไม่ผ่าน = "น้ำมันไม่ผ่าน" · ผ่าน = ป้ายสถานะอย่างเดียว
   (ช่องเดิม 3 พ.ย. 2569: radio ผ่าน/ไม่ผ่าน + ไฟล์ไม่บังคับ · ผลเก็บในข้อมูลรถ · ยังไม่แจ้งเจ้าของรถ) */
const OIL_FILE = pdf('oil-test-82-6789.pdf', '420 KB');
const OIL_TAG = { wait: ['รอผลตรวจน้ำมัน', 'Warning'], fail: ['น้ำมันไม่ผ่าน', 'Error'] };
const OIL_SAMPLED = (k) => k === 0 || k === 2;   // ตัวเลือกใน JOB_OIL_OPTS ที่มีการเก็บตัวอย่าง
async function oilResult(o) {   // o.sel (-1 ยังไม่เลือก · 0 ผ่าน · 1 ไม่ผ่าน) · o.files · o.errors · o.optional = หน้าปิดงาน
  return [row('Row', [radioGroup('ผลการทดสอบ' + (o.optional ? ' (ถ้ามี)' : ''), ['ผ่าน', 'ไม่ผ่าน'], o.sel == null ? -1 : o.sel, o.errors ? 'กรุณาเลือกผลการทดสอบ' : ''), frame('Spacer', 'VERTICAL')]),
    await upload('ไฟล์ผลการทดสอบ', o.files || [], { optional: true, hint: 'PDF, JPG, PNG · สูงสุด 10 ไฟล์', bar: true })];
}
/* Safety Inspection รถเครนและกระเช้า — JO 7.3.3 (4 พ.ย. 2569 เจ้าของงาน "อยากให้เพิ่มในส่วนของปิดงานคล้ายกับการเก็บผลของน้ำมันไฮดรอลิก ลอกแบบมาจากงาน overhaul ได้เลย")
   ลอกบล็อก M (S12 ตรวจสภาพ Safety) ของ Overhaul: File upload "เอกสาร Safety Inspection" ไม่บังคับ · "PDF, PNG, or JPG (สูงสุด 10 ไฟล์)" · แสดงเฉพาะรถเครนและรถกระเช้า
   ทางเข้าแบบผลน้ำมัน (S12): แนบตอนปิดงานได้ (ถ้ามี) หรือเพิ่มภายหลังที่ section ในหน้างานรายคันที่เสร็จสิ้น · การบังคับตรวจตามรอบปี/กฎหมายยังไม่ออกแบบ (ไฟล์ 14 ยังไม่เคาะ) */
const SAFETY_TYPES = ['กระเช้าฮอทไลน์', 'กระเช้าแก้ไฟ'], JOB_TYPE = typeOf(VEH[0]);   // JO 7.3.3 รถเครนและกระเช้า · ประเภทตามโค้ดจริงมีแต่กระเช้า (6 พ.ย. 2569)
const SAFETY_FILES = [{ name: 'Safety-Inspection-82-6789.pdf', size: '1.2 MB', bar: true }, { name: 'Image.jpg', size: '200 KB', progress: true }];   // กำลังอัปโหลด (แถบความคืบหน้า R48)
const SAFETY_DONE = [pdf('Safety-Inspection-82-6789.pdf'), { name: 'Image.jpg', size: '200 KB' }];
const safetyOn = () => SAFETY_TYPES.indexOf(JOB_TYPE) >= 0;
async function safetyDocs(files, view) {   // view = หน้างานรายคันแบบดู (Section label R3) · หน้าปิดงาน = Section header
  return [await (view ? sectionLabel : section)('Safety Inspection'), await upload('เอกสาร Safety Inspection', files || [], { optional: true, hint: 'PDF, PNG, or JPG (สูงสุด 10 ไฟล์)' })];
}
const JOB_COLS = [['รายการงาน', 0], ['อะไหล่ตามแผน', 320], ['จำนวนตามแผน', 140], ['หน่วย', 110], ['', 104]];   // ไอคอนแก้ไข + ลบ (3 พ.ย. 2569 เจ้าของงาน "อะไหล่ตามแผนสามารถแก้ไข ลบ เพิ่มได้") กว้าง 104 แบบตารางอะไหล่ในไตรมาสของ S1
/* น้ำมันไฮดรอลิกหน้างาน (3 พ.ย. 2569 เจ้าของงาน "หน้า I.8 I.9 อยากให้สามารถเลือกได้ว่าเก็บตัวอย่างน้ำมันไฮดรอลิก หรือเปลี่ยน เนื่องจากการเปลี่ยนน้ำมันเปลี่ยนทุก 3 ปี … หรือสามารถเลือกได้ว่าเก็บตัวอย่างและเปลี่ยน")
   Radio text card แบบ "น้ำมันไฮดรอลิก" ของหน้าอะไหล่ของรถ (S21) + ช่องเปลี่ยนน้ำมันครั้งล่าสุด · เลือกเก็บตัวอย่างอย่างเดียว = ไม่มีน้ำมันในรายการอะไหล่ · มีเก็บตัวอย่าง = เข้ารอผลตรวจ S12 */
const JOB_OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน', 'เก็บตัวอย่างและเปลี่ยน'], JOB_OIL = 2;
/* 5 พ.ย. 2569 รีวิว S10 "น้ำมันไฮดรอลิก เลือกตัวเลือก สามารถระบุวันที่เปลี่ยนน้ำมันครั้งล่าสุดได้" (R73) ⇒ ช่องเดิม Readonly เป็น Text input กรอกได้ "วันที่เปลี่ยนน้ำมันครั้งล่าสุด (ถ้ามี)"
   placeholder "วว/ดด/ปปปป" + ปฏิทิน Date picker Type=Single ใต้ช่อง (แบบช่องวันที่ของแผนเดินทาง S6 · ตอบรับนัดหมายวันเดียวของ Overhaul Q.1.1) · ค่าตั้งต้น = วันในข้อมูลรถ
   o.date = ค่าที่แสดง (null = ใช้ค่าในข้อมูลรถ · '' = ว่าง) · o.dateOpen = ช่องที่ปฏิทินเปิด */
/* วันที่เปลี่ยนน้ำมันครั้งล่าสุดของรถแต่ละคัน ค่าเดียวทุกจอ (ชีตลูกค้า 5 พ.ย. 2569: 12/03/2568 กับ 18/10/2568 ปนกัน) — ยึดข้อมูลการบำรุงรักษา S24 (MA_ROWS ช่อง "เปลี่ยนน้ำมันล่าสุด")
   ยกเว้นคันของงานตัวอย่าง S10 (82-6789) ที่ MA_ROWS เป็นค่าหลังปิดงานนี้ (04/11/2569) ⇒ ก่อนเริ่มงานใช้ 12/03/2568 · รถนอกแผนเดินทางใช้ LAST_OIL ตามลำดับ CAND */
function lastOil(plate) {
  const k = TRIP_CARS.findIndex(c => c[0] === plate);
  if (k === JOB_I) return LAST_OIL[0];
  const r = k >= 0 ? MA_ROWS.find(x => x[0] === k) : null;
  if (r) return r[4] || 'ไม่มีข้อมูล';   // r[4] = เปลี่ยนน้ำมันล่าสุด (10 พ.ย. 2569 MA_ROWS เพิ่มช่องไส้กรองอากาศ เดิมอ่าน r[5] = เก็บตัวอย่าง ผิด — agent เว็บเจอ)
  const j = CAND.findIndex(c => c[0] === plate);
  return j >= 0 ? LAST_OIL[j] : 'ไม่มีข้อมูล';
}
/* น้ำมันไฮดรอลิกตามแผนของรถแต่ละคันในไตรมาส (S21) — ค่าตั้งต้นของ Step 2 (ชีตลูกค้า 5 พ.ย. 2569: เดิมเลือก เก็บตัวอย่างและเปลี่ยน ทุกคัน) · ใช้ตารางรถในหน้ารายละเอียดแผนด้วย
   82-6789 (คันตัวอย่าง S10) = เก็บตัวอย่างและเปลี่ยน · อื่นตามตารางเดิม (ทุกคันที่ 3 เปลี่ยนน้ำมัน ที่เหลือเก็บตัวอย่าง) */
const TRIP_OIL = TRIP_CARS.map((_, i) => i === JOB_I ? JOB_OIL : i % 3 === 0 ? 1 : 0);
function oilDateField(o) {
  o = o || {};
  const v = o.date == null ? lastOil(o.car || TRIP_CARS[JOB_I][0]) : o.date;
  return field('วันที่เปลี่ยนน้ำมันครั้งล่าสุด', v, { placeholder: 'วว/ดด/ปปปป', optional: true, state: o.dateOpen ? 'Focused' : undefined });
}
async function jobOil(sel, res, o) {   // res = หน้าสรุปงาน: เลือกแบบที่มีการเก็บตัวอย่างแล้วมีช่องผลการทดสอบ (ถ้ามี) ต่อท้าย (S12 · 4 พ.ย. 2569) · o = ช่องวันที่ (oilDateField)
  const oil = await radioPick('น้ำมันไฮดรอลิก', JOB_OIL_OPTS, sel);
  const last = oilDateField(o);
  add(oil, MOB ? last : row('Row', [last, frame('Spacer', 'VERTICAL')]), 'h');
  if (res && OIL_SAMPLED(sel)) for (const n of await oilResult(Object.assign({ optional: true }, res))) add(oil, n, 'h');
  return oil;
}
const jobWork = (sel) => WORK.filter((w, k) => k > 0 || sel !== 0);   // แถวแรก = เปลี่ยนน้ำมันไฮดรอลิก
/* แผนจ้างดำเนินการ (4 พ.ย. 2569 เจ้าของงานตัด S23 S11 แล้วเลือก "กบค. ปิดงานรายคันของแผนจ้างเอง ใช้หน้างานรายคันและหน้าปิดงานเดียวกับ S10 กรอกแทนผู้รับจ้าง")
   o.hire = ใบจ้าง HIRE_T: กล่องการนัดหมายเป็นข้อมูลใบจ้าง (ผู้รับจ้าง · ช่วงวันทำงาน) · ปุ่ม ตาราง ไอคอนแก้ไข ลบ เหมือนแผนที่ กบค. ดำเนินการเอง ไม่มี view ผู้รับจ้างแล้ว */
/* 5 พ.ย. 2569 รีวิวทีมออกแบบ S10 "เมื่อกดเริ่มงาน จะพาเข้า Step การ Maintain" ⇒ หน้างานรายคันเหลือสถานะ ยังไม่เริ่ม อย่างเดียว (ปุ่ม เริ่มงาน)
   คันที่อยู่ระหว่างบำรุงรักษา เปิดแล้วไปขั้นที่ค้าง (stepPage) · หน้างานรายคันแบบ อยู่ระหว่างบำรุงรักษา + ปุ่มปิดงาน เลิกใช้ (Step 2 เดิมของรีวิว) */
async function jobBoxes(h, t, i, started, car, by) {   // กล่องข้อมูลยานพาหนะ 6 ช่อง + กล่องการนัดหมาย (หน้างานรายคันและหน้าขั้นตอน) · car = ยานพาหนะของจอตัวอย่าง (ค่าเริ่ม TRIP_CARS[i]) · by = ผู้เริ่มงาน (ค่าเริ่ม JOB_BY · S23 = ผู้รับจ้าง)
  const c = car || TRIP_CARS[i];
  const appt = (h ? [['แผนเดินทาง', t.name], ['ผู้รับจ้าง', t.vendor], ['ช่วงวันทำงาน', t.d1 + ' – ' + t.d2]] : [['แผนเดินทาง', t.name], ['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2]])
    .concat([['วันดำเนินการ', tripWork(i, t)]])   // R83 วันดำเนินการของคันนี้ (9 พ.ย. 2569 ค่ำ เจ้าของงาน _"ในแผนการเดินทางอ่ะ จะมีช่วงของการดำเนินการอยู่แล้ว แต่ในรายคันอยากให้เห็นว่าแต่ละคันจะดำเนินการเมื่อไร"_ + _"ใส่ตรงหน้ารายการรถ ก็ได้ หรือจะใส่ในตอนเริ่มงานก็ได้ … อยากให้สามารถแก้ไขได้"_)
    .concat([['สถานที่บำรุงรักษา', tripLoc(i, t.locs)], ['เบอร์ติดต่อ', tripPhone(i, t.phones)], ['ผู้ดูแลยานพาหนะ', tripCtrl(i, t.phones)]])   // เบอร์ก่อนชื่อผู้ดูแล ตามคอลัมน์เบอร์ติดต่อ (9 พ.ย. 2569)
    .concat(started ? [['เริ่มงาน', h ? HIRE_START : JOB_START], ['ผู้เริ่มงาน', by || JOB_BY]] : []);   // ใบจ้างที่หน่วยงานปิดงานแทน (S10): หน่วยงานเป็นผู้บันทึก · S23 ผู้รับจ้างเป็นผู้เริ่มงานเอง (HIRE_BY)
  return [await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภท', typeOf(c)], ['หน่วยงานเจ้าของยานพาหนะ', c[2]], ['เลขไมล์สะสม', '182,400 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,120 ชม.']]),
    await vehicleInfo(appt, 'การนัดหมาย')];
}
/* S23 มุมผู้รับจ้าง (o.vendor · เอากลับ 10 พ.ย. 2569 R87): ปุ่มหัวหน้าเหมือนกัน (บำรุงรักษาไม่ได้ · เริ่มงาน) · อะไหล่ตามแผนดูอย่างเดียว ไม่มีปุ่มเพิ่มอะไหล่และคอลัมน์ไอคอนแก้ไข ลบ
   ตามเงื่อนไขการมองเห็นเดิม (เจ้าของงาน 4 พ.ย. 2569 "vendor ดูรายละเอียดรายคัน จะเห็นแค่ ปุ่มเริ่มงาน และบำรุงรักษาได้ โดยไม่เห็นปุ่ม ลบ และแก้ไข") · กล่องการนัดหมายเป็นข้อมูลใบจ้าง (jobBoxes h) */
async function jobPage(name, o) {   // หน้างานรายคัน ยังไม่เริ่ม · o.i = ลำดับรถ · o.modal = 'cannot' · o.reason · o.errors · o.hire · o.vendor
  o = o || {};
  const v = !!o.vendor, h = !!o.hire || v, t = h ? HIRE_T : JOB_T, i = o.i == null ? (v ? HIRE_DONE : JOB_I) : o.i, c = TRIP_CARS[i];
  const acts = [['Secondary button', 'บำรุงรักษาไม่ได้'], ['Primary button', 'เริ่มงาน']];   // Page header Job detail ของ RP & MA Job
  const { scr, page } = await shell(name, { title: c[0], back: true, crumbs: [NOW_Q, t.name, c[0]], badge: WSTAT.todo, actions: acts });
  const nodes = await jobBoxes(h, t, i, false);
  const wk = jobWork(TRIP_OIL[i]);   // ตามแผนของคันนี้ (S21)
  nodes.push(col('Section', [await sectionLabel('รายการงานและอะไหล่ตามแผน', { badge: wk.length, buttons: v ? null : [{ kind: 'Secondary button', text: 'เพิ่มอะไหล่', icon: 'add-24-300-round' }] }),
    v ? await tblShort(JOB_COLS.slice(0, 4), wk.map(w => [w[0], w[1], w[2], w[4]]))   // ผู้รับจ้าง: ดูอย่างเดียว
      : await tblShort(JOB_COLS, wk.map(w => [w[0], w[1], w[2], w[4], { icons: ['stylus-24-300-round', 'delete-24-300-round'] }]))], 16));   // แก้ไข / เพิ่ม = หน้าอะไหล่ของรถ (S21) · ลบ = ยืนยันแล้วเอาออกจากรถคันนี้
  add(page, col('Content', nodes, 32), 'h');
  if (o.modal === 'cannot') await cannotModal(scr, i, { reason: o.reason, errors: o.errors });
  return scr;
}
/* บำรุงรักษาไม่ได้ = สาเหตุ + อะไหล่ส่งคืน (3 พ.ย. 2569 รอบ 2 เจ้าของงาน "กรอกแค่สาเหตุพอ" · อะไหล่ของคันที่ไม่ได้ทำ "มีให้กดส่งคืน ตอนที่กบค รับเรื่องจะเห็นว่ามีอะไหล่อะไรคืนบ้าง")
   popupModal (Modal ของไลบรารีใส่ Table ไม่ได้) = Text area + Table ของไลบรารี · ยังไม่เริ่ม ใช้ 0 คืนทั้งหมด · อยู่ระหว่างบำรุงรักษา กรอกจำนวนที่ใช้ (Table cell ไม่มีช่องกรอก แสดงเป็นข้อความ) คืน = ตามแผน − ใช้ */
const RET_COLS = [['ชื่ออะไหล่', 0, 'Lead text'], ['จำนวนตามแผน', 170], ['จำนวนที่ใช้', 170], ['จำนวนที่คืน', 170]];
const retRows = (used) => WORK.map((w, k) => { const u = used ? +used[k] : 0; return [w[1], w[2] + ' ' + w[4], u + ' ' + w[4], (+w[2] - u) + ' ' + w[4]]; });
const CANNOT_USED = ['30', '2', '0', '0'];   // เปลี่ยนน้ำมันและไส้กรองไฮดรอลิกแล้วพบปัญหา ทำต่อไม่ได้
async function retTable(used, label, edit) {   // label = หน้างานรายคันแบบดู (Section label R3) · edit = ผู้รับจ้างแก้ไข ลบ เพิ่มได้ (S23 · 4 พ.ย. 2569 เอากลับ 10 พ.ย. 2569 R87)
  const rows = retRows(used);
  return col('Section', [await (label ? sectionLabel : section)('อะไหล่ส่งคืน', { badge: rows.length, buttons: edit ? [ADD_PART] : null }),
    await tblShort(edit ? RET_COLS.concat([['', 104]]) : RET_COLS, edit ? rows.map(r => r.concat([EDIT_ICONS])) : rows)], 16);
}
async function cannotModal(scr, i, o) {   // o.reason · o.used (null = ยังไม่เริ่ม) · o.errors
  // 5 พ.ย. 2569 รีวิว S10 "เมื่อกดแล้วจะต้องระบุสาเหตุ แสดงรายการอะไหล่ที่ต้องใช้สำหรับงานนี้เพื่อยืนยันการส่งคืน เมื่อยืนยันแล้ว จะกลับไปที่หน้ารายละเอียดแผนเดินทาง" — โครงเดิมตรงแล้ว เพิ่มบรรทัดรองบอกให้ตรวจอะไหล่ก่อนยืนยัน
  await popupModal(scr, { title: 'บำรุงรักษาไม่ได้ · ' + TRIP_CARS[i][0], sub: 'ระบุสาเหตุ และตรวจรายการอะไหล่ของงานนี้เพื่อยืนยันการส่งคืน', w: 800, ok: 'ยืนยัน',
    body: [area('สาเหตุที่บำรุงรักษาไม่ได้', o.reason, { placeholder: 'ระบุสาเหตุที่บำรุงรักษาไม่ได้', error: o.errors ? 'กรุณาระบุสาเหตุที่บำรุงรักษาไม่ได้' : '' }), await retTable(o.used)] });
}

/* ---------- แผนจ้างดำเนินการ (ใบจ้าง HIRE_T) ----------
   4 พ.ย. 2569 เจ้าของงาน _"อยากตัด scen ผู้รับจ้าง หรือ vendor ตรวจรับทีละคัน ออก คือ S23 และ S11 ที่อยากเอาออก"_ แล้วเลือกให้ กบค. ปิดงานรายคันของแผนจ้างเอง
   ด้วยหน้างานรายคันและหน้าปิดงานเดียวกับ S10 (กรอกแทนผู้รับจ้าง) — ยังคงอยู่ที่ S10 (I.25 I.26)
   10 พ.ย. 2569 เจ้าของงานเอา S23 กลับ _"scen s23 อยากปรับ ui ให้เหมือนกับ s10 แต่ว่า เงื่อนไขการมองเห็น เมนูต่างๆ ยังเป็นเหมือนเดิม"_ (R87) · S11 ยังตัดอยู่
   ⇒ มุมผู้รับจ้างใช้ tripDetail · jobPage · stepPage ของ S10 (o.vendor) + หน้างานที่ปิดแล้วของผู้รับจ้าง (vendorJob แบบ workDetail) + ส่งตรวจงาน · แก้ไข เพิ่ม ลบ อะไหล่และภาพ ตามชุดเดิมของ S23 */
const HIRE_T = tripAs(TRIP_V, 'approved'), HIRE_START = '17/11/2569 09:10 น.';
const HIRE_WHY = 'กระบอกสูบไฮดรอลิกหลักรั่ว ต้องส่งซ่อมก่อนจึงบำรุงรักษาได้';
const HIRE_ST = { [TRIP_V.sel[0]]: 'doing', [TRIP_V.sel[1]]: 'done' };   // ใบจ้างระหว่างทาง: คันแรก กบค. เริ่มงานแทนผู้รับจ้างแล้ว · คันที่ 2 ปิดงานแล้ว · ที่เหลือยังไม่เริ่ม
const WORK_COLS2 = [['รายการงาน', 0], ['อะไหล่ที่ใช้', 320], ['จำนวนตามแผน', 140], ['จำนวนที่ใช้จริง', 140], ['หน่วย', 110]];
/* ข้อมูลจำลองของ S23 (ชุดเดิมก่อนตัด 4 พ.ย. 2569) · ผู้รับจ้าง = ชื่อช่างของผู้รับจ้างที่บันทึกงาน */
const HIRE_DONE = TRIP_V.sel[0], HIRE_CANNOT = TRIP_V.sel[1];
const HIRE_BY = 'นายประเสริฐ ศรีสุข (ผู้รับจ้าง)', HIRE_TECH = 'นายประเสริฐ ศรีสุข', HIRE_END = '17/11/2569 13:25 น.', HIRE_SENT = '17/11/2569 16:40 น.', HIRE_REPORTED = '18/11/2569 08:35 น.';
const HIRE_BACK = 'จำนวนไส้กรองอากาศที่คืนไม่ตรงกับภาพอะไหล่ใหม่ที่เหลือ กรุณาตรวจนับและแก้จำนวนที่คืน';
const HIRE_BACK_CANNOT = 'กรุณาระบุตำแหน่งที่รั่วและผลตรวจเบื้องต้นในสาเหตุให้ชัดเจน';
const HIRE_VENDOR = { [TRIP_V.sel[0]]: 'returned', [TRIP_V.sel[1]]: 'wait', [TRIP_V.sel[2]]: 'worked', [TRIP_V.sel[3]]: 'doing' };   // มุมผู้รับจ้างระหว่างทาง: ส่งกลับแก้ไข · รอตรวจรับ · ดำเนินการแล้ว · กำลังทำ
const vendorSign = (list) => [[list[0][0], HIRE_TECH], list[1]];   // ลงนามฝั่งผู้ดำเนินการของ S23 = ช่างผู้รับจ้าง (ใครลงนามจริงยังไม่เคาะ)
/* หน้างานรายคันของผู้รับจ้างหลังปิดงานหรือแจ้งบำรุงรักษาไม่ได้ (S23 · R87) — โครงเดียวกับหน้างานที่ปิดแล้วของ S10 (workDetail: กล่อง "ข้อมูลยานพาหนะและงาน" กล่องเดียว · ภาพ · อะไหล่ที่ใช้จริง)
   ไม่มีส่วนค่าใช้จ่ายของยานพาหนะ (เจ้าของงาน 10 พ.ย. 2569 _"จะไม่มีเรื่องทั้ง section ค่าใช้จ่ายรายคัน"_) + ของเดิม S23: ปุ่มตามสถานะ · กล่องแจ้งส่งกลับแก้ไข · อะไหล่ส่งคืน
   · ไอคอนแก้ไข ลบ + ปุ่มเพิ่มอะไหล่ · ภาพเป็นรายการไฟล์ (File upload) ลบและอัปโหลดใหม่ได้ (เจ้าของงาน 4 พ.ย. 2569 "อะใหล่ที่ใช้จริง และ อะใหล่ส่งคืน ต้องมีสัญลักณ์ให้แก้ไขได้ ลบรายการได้ รูปภาพ แก้ไขได้ ลบได้")
   ป้ายหัวหน้า = Pill outline สีตามตาราง (headPill แบบหน้าขั้นตอน · Badge outline ไม่มีสี Warning / Info)
   o.st = worked | reported | wait | returned · o.cannot = คันที่แจ้งบำรุงรักษาไม่ได้ · o.partEdit · o.partAdd ('filled') · o.partDel */
async function vendorJob(name, o) {
  o = o || {};
  const t = HIRE_T, cannot = !!o.cannot, i = cannot ? HIRE_CANNOT : HIRE_DONE, c = TRIP_CARS[i], s = o.st;
  const acts = s === 'worked' || s === 'reported' ? [['Secondary button', 'แก้ไขงาน'], ['Primary button', 'ส่งตรวจงาน']]
    : s === 'returned' ? (cannot ? [['Secondary button', 'บำรุงรักษาไม่ได้'], ['Primary button', 'เริ่มงาน']] : [['Primary button', 'แก้ไขงาน']]) : null;   // รอตรวจรับ = ไม่มีปุ่ม · ส่งกลับคันที่แจ้งไม่ได้ = ปุ่มกลับเป็นแบบก่อนแจ้ง
  const { scr, page } = await shell(name, { title: c[0], back: true, crumbs: [NOW_Q, t.name, c[0]], badge: WSTAT[s], actions: acts });
  headPill(scr, WSTAT[s]);
  const nodes = [];
  if (s === 'returned') nodes.push(alertBox('Error', 'หน่วยงานส่งกลับให้แก้ไข', cannot ? HIRE_BACK_CANNOT : HIRE_BACK));
  const veh = [['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภท', typeOf(c)], ['หน่วยงานเจ้าของยานพาหนะ', c[2]], ['เลขไมล์สะสม', '176,050 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '5,840 ชม.']];
  const job = cannot ? [['สาเหตุที่บำรุงรักษาไม่ได้', HIRE_WHY], ['ผู้แจ้ง', HIRE_BY], ['แจ้งเมื่อ', HIRE_REPORTED]]
    : [['เริ่มงาน', HIRE_START], ['ปิดงาน', HIRE_END], ['ผู้บันทึก', HIRE_BY], ['น้ำมันไฮดรอลิก', JOB_OIL_OPTS[TRIP_OIL[i]]], ['เลขไมล์หลังทำ', '176,090 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '5,846 ชม.']];
  const sent = s === 'wait' ? [['ส่งตรวจงานเมื่อ', cannot ? '18/11/2569 08:50 น.' : HIRE_SENT], ['ผู้ส่ง', HIRE_BY]] : [];
  nodes.push(await vehicleInfo(veh.concat(job, sent), 'ข้อมูลยานพาหนะและงาน'));
  if (!cannot) nodes.push(await photoFiles(),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length, buttons: [ADD_PART] }),
      await tblShort(WORK_COLS2.concat([['', 104]]), WORK.map(w => [w[0], w[1], w[2], w[3], w[4], EDIT_ICONS]))], 16));
  nodes.push(await retTable(cannot ? null : WORK.map(w => w[3]), true, true));   // ปิดงาน = จำนวนที่คืนจาก Step 2 · แจ้งไม่ได้ = จาก popup (คืนทั้งหมด)
  add(page, col('Content', nodes, 32), 'h');
  if (o.partEdit) await partEditModal(scr, WORK[PART_K]);
  if (o.partAdd) await partAddModal(scr, o.partAdd === 'filled');
  if (o.partDel) await confirm(scr, PART_DEL_CONFIRM(WORK[PART_K]));
  return scr;
}
/* ส่งตรวจงาน (เจ้าของงาน 3 พ.ย. 2569 "คนตรวจงานเป็นผู้รับจ้าง ส่งตรวจงาน") · ผู้ตรวจรับยังไม่เคาะ (S11 ยังตัดอยู่ 10 พ.ย. 2569) ⇒ ข้อความเป็น "หน่วยงาน" */
const HIRE_SEND_CONFIRM = (c) => ({ title: 'ยืนยันส่งตรวจงาน · ' + c[0], sub: 'งานของยานพาหนะคันนี้จะส่งให้หน่วยงานตรวจรับ', cancel: 'ยกเลิก', ok: 'ส่งตรวจงาน' });
/* แก้ไข ลบ อะไหล่และภาพของผู้รับจ้าง (4 พ.ย. 2569 เจ้าของงาน "ส่วนที่เป็นอะไหล่ที่ใช้จริง และ อะไหล่ส่งคืน ต้องมีสัญลักษณ์ให้แก้ไขได้ ลบรายการได้ รูปภาพ แก้ไขได้ ลบได้")
   ตาราง = คอลัมน์ไอคอนแก้ไข + ลบ กว้าง 104 แบบตารางอะไหล่ในไตรมาสของ S1 · ไอคอนแก้ไขทั้งสองตาราง = popup เดียวกัน (จำนวนที่คืนคำนวณจากจำนวนที่ใช้จริง)
   ภาพ = File upload ของไลบรารี (รายการไฟล์มีปุ่มลบ · อัปโหลดใหม่แทนภาพเดิม · ไอคอนตามชนิดไฟล์ + แถบความคืบหน้า R48) · Images ของไลบรารีไม่มีปุ่มแก้ไข ลบ */
const EDIT_ICONS = { icons: ['stylus-24-300-round', 'delete-24-300-round'] }, PART_K = 3;   // ตัวอย่างแก้ = ไส้กรองอากาศ (ใช้ 1 คืน 1)
const photoFiles = (o) => upload('ภาพก่อนเริ่มงาน', BEFORE.map((b, k) => jpg('before-' + (k + 1))).concat(o && o.uploading ? [Object.assign(jpg('before-3'), { progress: 60 })] : []), { hint: 'JPG, PNG · สูงสุด 10 ภาพ', bar: true });
async function partEditModal(scr, w) {
  await popupModal(scr, { title: 'แก้ไขอะไหล่ · ' + w[1], ok: 'บันทึก',
    body: [field('รายการงาน', w[0], { state: 'Readonly' }),
      row('Row', [field('จำนวนตามแผน', w[2] + ' ' + w[4], { state: 'Readonly' }), field('จำนวนที่ใช้จริง (' + w[4] + ')', w[3]), field('จำนวนที่คืน', (+w[2] - +w[3]) + ' ' + w[4], { state: 'Readonly' })])] });
}
/* เพิ่มรายการ (4 พ.ย. 2569 เจ้าของงาน "scen V ต้องมีเพิ่มรายการได้ด้วย") — ผู้รับจ้างไม่ได้เลือกจากคลังของหน่วยงาน ⇒ popup กรอกเองแบบ "รายการเพิ่มเติม" ของหน้าอะไหล่ของยานพาหนะ (S21)
   + จำนวนที่ใช้จริงและหน่วย · เพิ่มแล้วขึ้นในอะไหล่ที่ใช้จริง และจำนวนที่คืนเป็น 0 */
const ADD_PART = { kind: 'Secondary button', text: 'เพิ่มอะไหล่', icon: 'add-24-300-round' };
async function partAddModal(scr, filled) {
  await popupModal(scr, { title: 'เพิ่มอะไหล่ที่ใช้จริง', ok: 'เพิ่ม',
    body: [field('ชื่ออะไหล่', filled ? 'ไส้กรองเชื้อเพลิง' : '', { placeholder: 'ระบุชื่ออะไหล่' }), field('รหัสอะไหล่', filled ? 'FF-5052' : '', { placeholder: 'ระบุรหัสอะไหล่', optional: true }),
      row('Row', [field('จำนวนที่ใช้จริง', filled ? '1' : '', { placeholder: '0' }), dropdown('หน่วย', filled ? 'ชิ้น' : '', { placeholder: 'เลือกหน่วย' })])] });
}
const PART_DEL_CONFIRM = (w) => ({ danger: true, title: 'ยืนยันการเอาอะไหล่ออก', sub: w[1] + ' จะถูกเอาออกจากยานพาหนะคันนี้', cancel: 'ยกเลิก', ok: 'เอาออก' });
/* (5 พ.ย. 2569 รีวิว S10: เนื้อหาหน้าปิดงานย้ายเป็น Step 2 สรุปงานก่อนปิดงาน ของ stepPage — มีแถบขั้นตอนด้านบน เนื้อหายังไล่ยาวหน้าเดียว)
   ปิดงาน = หน้าเดียวไล่ยาว ไม่มี stepper ไม่มีส่วนภาพ (3 พ.ย. 2569 เจ้าของงานวางข้อความเฟรม "รายงานปิดงาน" ของงานซ่อม: "หน้าปิดงานอยากได้สไตล์แบบนี้ ยังไม่ต้องมีเพิ่มรูป และไม่ต้องมี stepper")
   ส่วนตามเฟรม: ข้อมูลเอกสาร · บันทึกข้อตกลงลูกค้า (Section header + Content item row) · รายการสภาพวัสดุอะไหล่ (Table ของไลบรารี 8 คอลัมน์)
   · บันทึกตรวจสอบเอกสารปิดงาน (แถว Horizontal radio groups มี/ไม่มี/ไม่ต้องใช้ + ปุ่มอัพโหลดเอกสาร — แถวแบบ MA table ในเฟรมเดียวกัน · ตารางของเฟรมมี radio ในช่อง ซึ่ง Table ของไลบรารีไม่มี)
   ผลการบำรุงรักษา (เลขไมล์ ชั่วโมงเครื่องจักร เก็บตัวอย่างน้ำมัน) คงไว้เพราะ S12 และบอร์ดต้องใช้ — ไม่อยู่ในเฟรม (จดยังไม่เคาะ) */
const CLOSE_PARTS = [   // ชื่ออะไหล่ · ราคาต่อหน่วย · จำนวนที่ใช้ · ราคารวมที่ใช้ · จำนวนที่คืน · ราคารวมที่คืน · จำนวนอะไหล่เก่า · หมายเหตุ (ลำดับคอลัมน์ตาม ReturnPart)
  ['น้ำมันไฮดรอลิก ISO VG 46', '120', '30', '3,600', '0', '0', '30', 'น้ำมันเก่าส่งกำจัดตามระเบียบ'],
  ['ไส้กรองไฮดรอลิก', '680', '2', '1,360', '0', '0', '2', ''],
  ['ไส้กรองน้ำมันเครื่อง', '250', '2', '500', '0', '0', '2', ''],
  ['ไส้กรองอากาศ', '420', '1', '420', '1', '420', '1', 'ไส้กรองเดิมอีกลูกยังใช้ได้']];
const CLOSE_PART_HEADS = ['ชื่ออะไหล่', 'ราคาต่อหน่วย', 'จำนวนที่ใช้', 'ราคารวมที่ใช้', 'จำนวนที่คืน', 'ราคารวมที่คืน', 'จำนวนอะไหล่เก่า', 'หมายเหตุ'];
const CLOSE_DOCS_REPAIR = ['บันทึกสั่งงาน/สำเนาบันทึกสั่งงาน', 'บันทึกรับงานเข้างาน', 'ใบเบิกของ', 'ใบส่งของคลัง', 'สำเนาอนุมัติหลักการจัดซื้อ', 'สำเนาบิลส่งของเรื่องจัดซื้อ', 'สำเนาอนุมัติหลักการจัดจ้าง', 'สำเนาบิลส่งของเรื่องจัดจ้าง',
  'บันทึกการตรวจสอบวัสดุอะไหล่', 'สำเนาใบส่งคืนคลังพัสดุ', 'บันทึกการตรวจสภาพบำรุงรักษา', 'บันทึกทดสอบก่อนซ่อม/หลังซ่อม', 'รายงานออกปฏิบัติงานส่วนภูมิภาค', 'เรื่องแจ้งงานเสร็จ', 'เรื่องแจ้งงดซ่อม'];   // ตามเฟรมของเจ้าของงาน
const CLOSE_DOCS = ['บันทึกใบสั่งการ'];   // 3 พ.ย. 2569 เจ้าของงาน "ส่วนนี้ตัดเหลือแค่ 1 รายการ คือบันทึกใบสั่งการ แค่นั้น และมีให้เพิ่มรายการได้" (15 รายการของงานซ่อมเก็บไว้ที่ CLOSE_DOCS_REPAIR)
const CLOSE_DOC_SEL = [0];   // กรอกครบ: 0 มี · 1 ไม่มี · 2 ไม่ต้องใช้
/* 5 พ.ย. 2569 รีวิว S10 Step 2 "ระบุจำนวนอะไหล่ที่ใช้จริงในงานนี้" (R74) ⇒ คอลัมน์ "จำนวนที่ใช้" เป็นช่องกรอก Number input ตาม ReturnPart ของงานซ่อม
   (ไฟล์ Maintain-D หน้า Design: ตาราง Table header cell + Table cell ที่ใส่ Number input ในคอลัมน์ "จำนวนที่ใช้" · Table ของไลบรารีไม่มีช่องกรอก)
   ⇒ desktop ประกอบแบบ checkTable (เฟรมชื่อ ReturnPart = แบบสำรองลอกโครง component งานซ่อม R47) · มือถือคง Table การ์ด (Mobile table ไม่มีช่องกรอก) · หัวคอลัมน์และลำดับตามเฟรมรายงานปิดงาน (3 พ.ย. 2569) */
/* แผนจ้างดำเนินการ (noPrice · เจ้าของงาน 10 พ.ย. 2569 _"ส่วนที่สภาพวัสดุอะไหล่ ส่วนที่เป็นราคาต้องไม่แสดง"_ · R87): ไม่มีคอลัมน์ราคาต่อหน่วย · ราคารวมที่ใช้ · ราคารวมที่คืน ทั้ง desktop และมือถือ
   ใช้ทั้ง Step 2 ของผู้รับจ้าง (S23) และ Step 2 ที่หน่วยงานปิดงานแทนผู้รับจ้าง (S10 I.26) · คอลัมน์ที่เหลือคงเดิม */
const CLOSE_PRICE_COLS = [1, 3, 5];
async function closeParts(rows, filled, noPrice) {
  const val = (r) => (filled ? r : r.slice(0, 6).concat(['0', ''])).map((x, i) => i === 7 && !x ? '-' : x);   // ฟอร์มว่าง: จำนวนที่ใช้ตั้งต้นตามแผน · อะไหล่เก่า 0 · หมายเหตุ "-"
  const keep = CLOSE_PART_HEADS.map((_, i) => i).filter(i => !noPrice || CLOSE_PRICE_COLS.indexOf(i) < 0);
  const head = await section('รายการสภาพวัสดุอะไหล่', { badge: rows.length });
  const more = btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round' });
  if (MOB) {
    const cols = keep.map(i => [CLOSE_PART_HEADS[i], i === 0 ? 220 : i === 7 ? 0 : 118, i ? 'Text' : 'Lead text']);
    return col('Section', [head, await tblShort(cols, rows.map(r => { const x = val(r); return keep.map(i => x[i]); })), more], 16);
  }
  const data = rows.map(val);
  const num = (ri) => {   // Number input ไม่มีป้าย ในช่องตาราง (ReturnPart)
    return inst('Number input', { State: 'Filled', Size: 'md' }, { Number: data[ri][2], Label: false, Optional: false, 'Info icon': false, Helper: false });
  };
  const cols = keep.map(ci => { const h = CLOSE_PART_HEADS[ci]; return ci === 0 ? [h, 220, null, false, ci] : ci === 2 ? [h, 140, num, true, ci] : [h, ci === 7 ? 0 : 118, (ri) => null, false, ci]; });
  const t = frame('Content with scrollbar', 'HORIZONTAL');
  cols.forEach(([h, w, make, grow, ci]) => {
    const c = frame('Column', 'VERTICAL'); t.appendChild(c);
    if (w) { c.layoutSizingHorizontal = 'FIXED'; c.resize(w, c.height); } else c.layoutGrow = 1;
    add(c, inst('Table header cell', { Checkbox: 'False' }, { Text: h, 'Sort icon': false, 'Header text': true }), 'h');
    data.forEach((r, ri) => add(c, ci === 2 ? ctrlCell(ri % 2, '', make(ri), grow) : ctrlCell(ri % 2, r[ci], null), 'h'));
  });
  return col('Section', [head, col('ReturnPart', [t], 0), more], 16);
}
async function closeDocs(filled) {   // บันทึกตรวจสอบเอกสารปิดงาน: 1 แถว = เอกสาร 1 รายการ (radio มี / ไม่มี / ไม่ต้องใช้ + ปุ่มอัพโหลดเอกสาร)
  const rows = CLOSE_DOCS.map((d, i) => {
    const g = radioGroup(d, ['มี', 'ไม่มี', 'ไม่ต้องใช้'], filled ? CLOSE_DOC_SEL[i] : -1);
    const b = btn('Secondary button', 'อัพโหลดเอกสาร', { icon: 'cloud_upload-24-300-round', disabled: filled && CLOSE_DOC_SEL[i] !== 0 });
    if (MOB) return col('Row', [g, b], 12);
    const r = row('Row', [g, b], { gap: 24, hug: true, align: 'MAX' }); g.layoutGrow = 1;
    return r;
  });
  return col('Section', [await section('บันทึกตรวจสอบเอกสารปิดงาน', { badge: CLOSE_DOCS.length })].concat(rows, [btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round' })]), 16);
}
/* ค่าใช้จ่ายของรถคันนี้ (3 พ.ย. 2569 เจ้าของงาน "ค่าที่พัก ค่าเดินทาง … จะมีให้กรอกอีกทีตอนปิดงาน โดยรายละเอียดเรื่องค่าใช้จ่ายของรถแต่ละคันจะกรอกแยกกัน และมีให้เลือกงบประมาณตอนปิดงานด้วย
   โดยเบื้องต้นจะ default เป็นศูนย์ต้นทุนของเจ้าของรถคันนั้นๆ เนื่องจากพวกค่าอะไหล่จะเป็นของ กบค. แต่ค่าเดินทาง และค่าใช้จ่ายจะเป็นของหน่วยงานเจ้าของรถ")
   รอบ 2 (3 พ.ย. 2569 "ย้ายค่าใช้จ่ายไปต่อจากรายการสภาพวัสดุอะไหล่ ค่าใช้จ่ายอยากให้กรอกละเอียดรายคน และมีการรวมค่าใช้จ่ายให้ด้วย แล้วถึงจะให้เลือกงบที่ตัด ซึ่งอยากเปลี่ยนเป็น งบประมาณ (ศูนย์ต้นทุน)")
   ⇒ 1 แถวต่อพนักงาน กบค. ซ่อม 1 คนในแผนเดินทาง: พนักงาน (Readonly) · ค่าเบี้ยเลี้ยง · ค่าที่พัก · ค่าเดินทาง (ถ้ามี) · รวม (Readonly คำนวณ)
   → สรุปรวม (Content item row) → Input dropdown "งบประมาณ (ศูนย์ต้นทุน)" ตั้งต้นศูนย์ต้นทุนของหน่วยงานเจ้าของรถ (เลิกใช้คู่ "งบที่ตัด" + "ศูนย์ต้นทุน") */
/* รอบ 3 (3 พ.ย. 2569 "ค่าเบี้ยเลี้ยงใส่เป็นรายวัน ค่าที่พักใส่เป็นรายวัน แล้วเลือกจำนวนวันค่อยมาคูณ ส่วนค่าเดินทางอยากเป็นรวมของทุกคนที่ไปแผนการเดินทางนั้น ใส่แค่ช่องเดียว
   … หลังจากการกรอกเบี้ยเลี้ยง ค่าที่พักเรียบร้อยแล้วค่อยมีให้กรอกค่าเดินทางด้านล่าง") ⇒ แถวต่อคน: พนักงาน · ค่าเบี้ยเลี้ยง (บาท/วัน) · ค่าที่พัก (บาท/วัน) · จำนวนวัน (เลือก) · รวม = (เบี้ยเลี้ยง + ที่พัก) × วัน
   → ค่าเดินทาง (รวมทุกคน) ช่องเดียวใต้แถว → สรุปรวม → งบประมาณ (ศูนย์ต้นทุน) */
const CLOSE_COST_BY = [[TRIP.staff[0], 240, 800, 2], [TRIP.staff[1], 240, 800, 2], [TRIP.staff[2], 240, 800, 1]];   // พนักงาน · เบี้ยเลี้ยง/วัน · ที่พัก/วัน · จำนวนวัน
const CLOSE_TRAVEL = 1210;   // ค่าเดินทางรวมทุกคน
/* ชั่วโมงทำงาน × อัตราค่าแรงต่อชั่วโมง (เจ้าของงานเคาะ 10 พ.ย. 2569 S18 "ค่าเบี้ยเลี้ยง และค่าชั่วโมงทำงาน จะแสดงเฉพาะส่วนที่ทำเอง" · "กรอกอัตราเองตอนปิดงาน" · ชั่วโมงทำงานเป็น optional)
   รายคัน 1 แถวใต้ค่าเดินทาง ไม่บังคับทั้งสองช่อง · ไม่กรอก = ค่าชั่วโมงทำงาน 0 (เสนอ) · แผนจ้างไม่มีส่วนนี้ (R87) */
const CLOSE_HOURS = 6, CLOSE_RATE = 150;
const nf = (n) => n.toLocaleString('en-US');
const personSum = (r) => (r[1] + r[2]) * r[3];
const costSum = (k) => CLOSE_COST_BY.reduce((a, r) => a + r[k] * r[3], 0);
const CLOSE_COST = { perDiem: nf(costSum(1)), lodging: nf(costSum(2)), travel: nf(CLOSE_TRAVEL), labour: nf(CLOSE_HOURS * CLOSE_RATE), total: nf(costSum(1) + costSum(2) + CLOSE_TRAVEL + CLOSE_HOURS * CLOSE_RATE) };
const OWNER_CC = (c) => 'E301010000 ' + c[2] + ' - บริหาร';   // ศูนย์ต้นทุนของหน่วยงานเจ้าของรถ (ข้อมูลจำลอง)
/* งบที่ตัด + ศูนย์ต้นทุน (5 พ.ย. 2569 รีวิว S10 "เลือกศูนย์ต้นทุน ต้องเป็นรูปแบบเดียวกันกับงานซ่อมและ overhaul" · R72)
   งานซ่อม (ไฟล์ Maintain-D หน้า Local Component) = component "Request Repair/Budget" variant "งบที่ตัด": Input dropdown "งบที่ตัด" ครึ่งซ้าย + ช่องตามประเภทครึ่งขวาแถวเดียวกัน
     หน่วยงานต้นสังกัด = Text input Readonly "ศูนย์ต้นทุน" (ระบบเติม) · หน่วยงานอื่น = Input dropdown "ศูนย์ต้นทุน" "ระบุศูนย์ต้นทุน" · WBS / PM Order = 3 ช่อง · อื่น ๆ = ช่องรายละเอียด
   Overhaul (R18) = "ประเภทงบประมาณ" 5 ค่า ช่องตามประเภทแถวใหม่ใต้ครึ่งขวา — ต่างกันที่ชื่อช่อง ชื่อตัวเลือก และตำแหน่ง ⇒ ใช้แบบงานซ่อม (เจ้าของงานสั่งให้ยึดงานซ่อมเมื่อต่างกัน)
   ตั้งต้น = งบทำการ หน่วยงานต้นสังกัด + ศูนย์ต้นทุนของหน่วยงานเจ้าของรถคันนั้น (เจ้าของงาน 3 พ.ย. 2569 ค่าเดินทางและค่าใช้จ่ายเป็นของหน่วยงานเจ้าของรถ)
   ไฟล์ไม่มี component นี้ → แบบสำรองลอกโครงจากไลบรารี: Input dropdown + Text input Readonly ไอคอน account_balance (ไอคอนเดียวกับ Overhaul) / Input dropdown */
const BUDGET_CUT = ['งบทำการ หน่วยงานต้นสังกัด', 'งบทำการ หน่วยงานอื่น', 'งบโครงการ (ตาม WBS)', 'งบซ่อมบำรุงตามใบสั่ง (PM Order)', 'อื่น ๆ'];   // ค่า variant "งบที่ตัด" ของ Request Repair/Budget
const OTHER_CC = 'E301020000 กฟฉ.2 อุบลราชธานี - บริหาร';   // ตัวอย่างศูนย์ต้นทุนของหน่วยงานอื่น (ข้อมูลจำลอง)
function budgetPick(c, o) {   // o.type = ลำดับใน BUDGET_CUT (ค่าเริ่ม 0) · o.cc = ศูนย์ต้นทุนที่เลือก (หน่วยงานอื่น)
  o = o || {};
  const t = o.type || 0;
  if (has('Request Repair/Budget')) {
    const b = inst('Request Repair/Budget', { 'งบที่ตัด': BUDGET_CUT[t] }); b.name = 'Request Repair/Budget';
    const ro = find(b, 'Text input'), dd = b.findAll(n => n.type === 'INSTANCE' && n.name === 'Input dropdown')[1];
    if (t === 0 && ro) setProps(ro, { Text: OWNER_CC(c) });
    if (t === 1 && dd && o.cc) setProps(dd, { Text: o.cc });
    if (t === 1 && dd) setProps(dd, { State: o.cc ? 'Selected' : 'Default' });
    return b;
  }
  const cut = dropdown('งบที่ตัด', BUDGET_CUT[t], { placeholder: 'เลือกงบที่ตัด' });
  const dep = t === 0 ? field('ศูนย์ต้นทุน', OWNER_CC(c), { state: 'Readonly', lead: 'account_balance-24-300-round' })
    : t === 1 ? dropdown('ศูนย์ต้นทุน', o.cc || '', { placeholder: 'ระบุศูนย์ต้นทุน' }) : frame('Spacer', 'VERTICAL');
  return row('Row', [cut, dep]);
}
async function closeCosts(filled, budget) {   // budget = ค่าส่งต่อ budgetPick
  const c = TRIP_CARS[JOB_I];
  const money = (label, v) => field(label, filled ? nf(v) : '', { placeholder: '0', optional: true });
  // 3 พ.ย. 2569 เจ้าของงาน "เพิ่ม ลด พนักงานได้" ⇒ พนักงาน = Input dropdown ค้นชื่อ (ตั้งต้นตามแผนเดินทาง) · ปุ่มลบท้ายแถว (Tertiary button ไอคอนอย่างเดียว) · ปุ่ม "เพิ่มพนักงาน" ใต้แถว
  const delBtn = () => inst('Tertiary button', { State: 'Default', Size: 'md' }, { 'Button text': false, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('delete-24-300-round') });
  const rows = CLOSE_COST_BY.map(r => {
    const kids = [dropdown('พนักงาน', r[0], { placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round' }), money('ค่าเบี้ยเลี้ยง (บาท/วัน)', r[1]), money('ค่าที่พัก (บาท/วัน)', r[2]),
      dropdown('จำนวนวัน', filled ? r[3] + ' วัน' : '', { placeholder: 'เลือกจำนวนวัน' }), field('รวม (บาท)', filled ? nf(personSum(r)) : '0', { state: 'Readonly' })];
    if (MOB) return col('Row', kids.concat([delBtn()]), 16);
    const rw = row('Row', kids, { align: 'MAX' }); const d = delBtn(); rw.appendChild(d);   // ปุ่มลบไม่ยืด
    return rw;
  });
  const sum = filled ? CLOSE_COST : { perDiem: '0', lodging: '0', travel: '0', labour: '0', total: '0' };
  const hours = row('Row', [field('ชั่วโมงทำงาน', filled ? String(CLOSE_HOURS) : '', { placeholder: '0', optional: true }), field('อัตราค่าแรง (บาท/ชั่วโมง)', filled ? nf(CLOSE_RATE) : '', { placeholder: '0', optional: true })]);
  return col('Section', [await section('ค่าใช้จ่ายของยานพาหนะคันนี้ (บาท)', { badge: CLOSE_COST_BY.length + ' คน' })]   // 3 พ.ย. 2569 เจ้าของงานลบกล่องแจ้งในไฟล์เองแล้ว "ลบใน script อย่างเดียว … export ต้องไม่มี"
    .concat(rows, [btn('Secondary button', 'เพิ่มพนักงาน', { icon: 'add-24-300-round' }), row('Row', [money('ค่าเดินทาง (รวมทุกคน)', CLOSE_TRAVEL), frame('Spacer', 'VERTICAL')]), hours,
      kv([['รวมค่าเบี้ยเลี้ยง', sum.perDiem + ' บาท'], ['รวมค่าที่พัก', sum.lodging + ' บาท'], ['ค่าเดินทาง', sum.travel + ' บาท'], ['ค่าชั่วโมงทำงาน', sum.labour + ' บาท'], ['รวมค่าใช้จ่ายของยานพาหนะคันนี้', sum.total + ' บาท']]),
      budgetPick(c, budget)]), 16);   // เดิม "งบประมาณ (ศูนย์ต้นทุน)" ช่องเดียว (3 พ.ย. 2569) → งบที่ตัด + ศูนย์ต้นทุน แบบงานซ่อม (5 พ.ย. 2569 R72)
}
/* ---------- รับรถก่อนเริ่มงาน + ตรวจสภาพตอนปิดงาน (3 พ.ย. 2569 เจ้าของงาน "ตอนกดเริ่มงาน อยากได้หน้าที่เป็นรายการรับรถ และมีให้ลงนาม และตอนปิดงานก็เหมือนกัน มีให้ตรวจสภาพรถปิดงาน") ----------
   แบบอย่าง = component ของ Flow การซ่อม (ไฟล์ Maintain-D หน้า Design) ที่ Overhaul S8 ใช้: ReceiptChecklist "รายการเอกสารรับรถ" + HandoverSignature "ลงนามการรับมอบรถ" + Modal Signature
   · ปิดงาน = ~~ตรวจสภาพรถปิดงาน~~ (ตัด 5 พ.ย. 2569 · R65) เหลือ HandoverSignature "ลงนามการส่งคืนรถ" ใน InspectionChecklist AfterRepair=true (ซ่อน RepairFeedback ReturnPart เพราะหน้าปิดงานมีตารางอะไหล่แล้ว)
   ไฟล์ไม่มี component เหล่านี้ / มือถือ → แบบสำรองจากไลบรารี: แถว Horizontal radio groups 2 คอลัมน์ + หมายเหตุ + ช่องผู้ลงนาม (Input dropdown) + ปุ่มเซ็นลงนาม / Pill outline ลงนามแล้ว */
const RECEIPT_ITEMS = ['แผ่นป้ายทะเบียนหน้า - หลัง', 'ป้ายทะเบียนติดกระจกและ พรบ.', 'กระจกมองข้างซ้าย - ขวา, กระจกมองหลัง', 'ยางอะไหล่', 'แบตเตอรี่', 'เครื่องมือประจำยานพาหนะ, แม่แรง, ประแจถอดล้อ', 'ฝาถังน้ำมัน',
  'อุปกรณ์บนหน้าปัด, แตร', 'ใบปัดน้ำฝน', 'วิทยุ, ลำโพง, เสาอากาศ, วิทยุรับ - ส่ง', 'ระบบไฟแสงสว่าง', 'สภาพยาง', 'สภาพตัวถังและสี'];   // ตาม ReceiptChecklist ของงานซ่อม
// INSPECT_ITEMS (24 รายการตรวจสภาพรถปิดงาน) เลิกใช้ 5 พ.ย. 2569 (R65) — เจ้าของงาน "s10 เอาตรวจสภาพปิดงาน ออกไปเลย"
const SIGN_OWNER = 'นายสุรชัย แก้วมณี', SIGN_DATE = '04/11/2569';
/* ---------- แบบสำรองเมื่อไฟล์ไม่มี component ของงานซ่อม (3 พ.ย. 2569 เจ้าของงาน "ตารางที่เป็นรับรถ ผิด" · "ให้ตรงกับของเดิมที่ทำไปแล้ว")
   ลอกโครงจาก ReceiptChecklist / InspectionChecklist / HandoverSignature ในไฟล์ Maintain-D หน้า Design (ดัมป์ maintain-d/0-1.json):
   desktop = ตาราง หัว Table header cell + ช่องแถวสลับสี ช่องสูง 56 · ช่องที่มี Radio button / Checkbox / Text input เป็น Table cell ที่ detach แล้ววางตัวควบคุมไว้ข้างใน
   (แบบเดียวกับต้นฉบับ — Table cell ของไลบรารีไม่มี Style radio/checkbox/ช่องกรอก · component Table ใส่ไม่ได้) · ปุ่ม "เพิ่มรายการ" แถวท้ายคอลัมน์แรก
   mobile = การ์ดรายการละใบ (ReceiptChecklistCard / InspectionChecklistCard): Section label ชื่อรายการ + Radio text card 2 ใบ · รายการรับรถที่เลือก "มี" เพิ่ม "สภาพ (ถ้ามี)" Checkbox text card ชำรุด/ผิดรุ่น
   ลงนาม = ผู้ส่งมอบ/ผู้รับมอบ ช่องละคอลัมน์ · ยังไม่เซ็น "เซ็นลงนาม" (กดไม่ได้จนเลือกชื่อ) · เซ็นแล้ว "แก้ไขลงนาม" + Pill "ลงนามแล้ว" */
function ctrlCell(alt, text, ctrl, grow) {   // ช่องข้อความ = Table cell ของไลบรารีตรงๆ · ช่องตัวควบคุม/ช่องว่าง = Table cell ที่ detach (สี/ระยะตามไลบรารี) แล้วใส่ตัวควบคุมแทนข้อความ
  const c = inst('Table cell', { Style: 'Text', 'Alternating fills': alt ? 'True' : 'False' }, { Text: text || ' ', Supporting: false });
  if (text && !ctrl) return c;
  const f = c.detachInstance(); f.name = 'Table cell';
  f.children.slice().forEach(k => k.remove());
  if (ctrl) { f.appendChild(ctrl); if (grow) ctrl.layoutGrow = 1; }
  return f;
}
function checkTable(items, cols, addRow) {   // cols: [หัว, กว้าง (0 = ยืด), (แถว) => ตัวควบคุม, ยืดตัวควบคุม]
  const t = frame('Content with scrollbar', 'HORIZONTAL');
  cols.forEach(([head, w, make, grow], ci) => {
    const c = frame('Column', 'VERTICAL'); t.appendChild(c);
    if (w) { c.layoutSizingHorizontal = 'FIXED'; c.resize(w, c.height); } else c.layoutGrow = 1;
    add(c, inst('Table header cell', { Checkbox: 'False' }, { Text: head, 'Sort icon': false, 'Header text': true }), 'h');
    items.forEach((it, ri) => add(c, ctrlCell(ri % 2, ci === 0 ? it : '', ci === 0 ? null : make(ri), grow), 'h'));
    if (addRow) add(c, ctrlCell(items.length % 2, '', ci === 0 ? btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round' }) : null), 'h');
  });
  return t;
}
const radioCell = (on) => inst('Radio button', { State: 'Default', Selected: on ? 'True' : 'False' });
const checkCell = (on, off) => inst('Checkbox', { State: off ? 'Disabled' : 'Default', Type: on ? 'Selected' : 'Unselected' });
function noteCell(v) { const n = field('หมายเหตุ', v, { placeholder: 'ระบุหมายเหตุ', optional: true }); setProps(n, { Label: false }); return n; }
function checkCard(title, opts, sel, more) {   // การ์ดรายการบนมือถือ — กรอบ/พื้นจาก Mobile table ของไลบรารี มุม 12 ตามการ์ดต้นฉบับ
  const card = frame('ChecklistCard', 'VERTICAL', { gap: 16, pad: 16 });
  const ref = inst('Mobile table', { 'Alternating fills': 'False' });
  card.fills = ref.fills || [{ type: 'SOLID', color: WHITE }]; card.strokes = ref.strokes || []; card.strokeWeight = 1; card.cornerRadius = 12; ref.remove();
  add(card, inst('Section label', { Breakpoint: 'Mobile' }, { Title: title, Supporting: false, 'Info icon': false, 'More actions': false, Actions: false }), 'h');
  add(card, row('Radio', opts.map((t, i) => inst('Radio text card', { State: 'Default', Selected: i === sel ? 'True' : 'False' }, { Text: t, Supporting: false })), { keep: true, gap: 16 }), 'h');
  (more || []).forEach(n => add(card, n, 'h'));
  return card;
}
const RECEIPT_NOTE = { 11: 'ยางหลังซ้ายสึก แจ้งเจ้าของยานพาหนะแล้ว' }, RECEIPT_BAD = 11;   // ข้อมูลจำลองตอนกรอกครบ: ทุกรายการ "มี" · สภาพยาง ชำรุด
async function signSection(title, who, filled, signed) {   // HandoverSignature แบบสำรอง
  const box = (label, name) => col('Container', [dropdown(label, filled ? name : '', { placeholder: 'เลือก' + label }),
    signed ? row('Signed', [btn('Secondary button', 'แก้ไขลงนาม'), pill('ลงนามแล้ว', 'Success')], { hug: true, keep: true, gap: 16, align: 'CENTER' })
      : row('Sign', [btn('Secondary button', 'เซ็นลงนาม', { disabled: !filled })], { hug: true, keep: true })], 16);
  return col('Section', [await section(title), row('Row', [box(who[0][0], who[0][1]), box(who[1][0], who[1][1])])], 16);
}
/* ผู้ลงนาม 2 ฝ่าย ชื่อป้ายเดียวกันทุกที่ (5 พ.ย. 2569 ชีตลูกค้า: ป้ายผู้ลงนามหน้าปิดงานไม่ตรงหน้ารับรถ · ชื่อตัวอย่างในตัว component นายอนุชิต / นายสมาน ค้าง)
   ป้ายในตัว HandoverSignature ของงานซ่อม: รับรถ "ผู้ส่งมอบรถ" / "ผู้รับมอบรถ (กบค.)" · ส่งคืน "ผู้ส่งมอบรถ (กบค.)" / "ผู้รับมอบรถ" ⇒ ใส่หน่วยงานในวงเล็บครบทั้งสองฝ่ายแบบแบบสำรอง signSection */
const SIGN_IN = [['ผู้ตรวจ (หน่วยงานผู้ดำเนินการ)', TRIP.staff[0]], ['ผู้รับการตรวจ (หน่วยงานเจ้าของยานพาหนะ)', SIGN_OWNER]];   // Step 1 ลงนามการตรวจสภาพ · 9 พ.ย. 2569 ผู้ตรวจ / ผู้รับการตรวจ ตามท้ายใบตรวจ (เดิมผู้ส่งมอบ / ผู้รับมอบ)
const SIGN_OUT = [['ผู้ส่งมอบยานพาหนะ (หน่วยงานผู้ดำเนินการ)', TRIP.staff[0]], ['ผู้รับมอบยานพาหนะ (หน่วยงานเจ้าของยานพาหนะ)', SIGN_OWNER]];   // Step 2 ลงนามการส่งคืนรถ
/* ค่าในช่องของ component งานซ่อม: property Text ไม่ชนะข้อความที่ component แม่ทับไว้ (ชีตลูกค้า 5 พ.ย. 2569 ยังเห็น "นาย อนุชิต ลิ้มกิมฮวย")
   ⇒ ตั้ง property แล้วใส่ที่ชั้นข้อความที่เห็นด้วย (แบบ formModal ใน core) */
async function putText(inst0, layer, value) {
  const t = inst0 && inst0.findAll(n => n.type === 'TEXT' && n.name === layer && n.visible !== false)[0];
  if (t && t.characters !== value) await text(inst0, t, value);
}
async function signFix(root, title, parties, filled) {   // HandoverSignature ทุกตัวใน root: หัว (คงหัวของตัวเองทุก State — State=Signed ของ component หัวเป็น "ลงนามการรับมอบรถ") + ป้ายและชื่อผู้ลงนาม
  const all = (root.name === 'HandoverSignature' ? [root] : []).concat(root.findAll(n => n.name === 'HandoverSignature'));
  for (const hs of all) {
    hs.findAll(x => x.type === 'INSTANCE' && x.name === 'Section header').forEach(x => setProps(x, { Title: title }));
    for (const [k, x] of hs.findAll(x => x.type === 'INSTANCE' && x.name === 'Text input').slice(0, 2).entries()) {
      const v = filled ? parties[k][1] : 'เลือก' + parties[k][0];
      setProps(x, { Text: v }); syncLabel(x, parties[k][0], false);
      const ct = find(x, 'Container'); if (ct) await putText(ct, 'Text', v);
    }
  }
}
async function signModal(scr, title, filled, party) {   // Modal Signature ของงานซ่อม · ไม่มี/มือถือ → popup ยืนยันแบบ Overhaul · party = [ป้าย, ชื่อ] ผู้ที่กำลังเซ็น
  if (MOB || !has('Modal Signature')) { await confirm(scr, { title, sub: filled ? 'เซ็นลงนามแล้ว' : 'เซ็นลงนามในช่องด้านล่าง', cancel: 'ปิด', ok: 'บันทึก' }); return; }
  const m = inst('Modal Signature', { State: filled ? 'Filled' : 'Default' }); m.name = 'Modal Signature';
  overlay(scr, m, 0, 0);
  modalHead(find(m, 'Modal header'), title, '');
  const form = find(m, 'Form');   // ชีตลูกค้า 5 พ.ย. 2569: กล่องข้อมูลรถ/งานซ่อมตัวอย่าง (1กก 1236 กทม. · BRD005678) ในตัว component ต้องไม่เห็น — ในไลบรารีซ่อนอยู่แล้ว ซ่อนซ้ำกันพลาด เหลือผู้ลงนาม + ช่องเซ็น
  if (form) form.children.forEach(c => { if (c.name !== 'Content' && c.name !== 'Text area') c.visible = false; });
  const shownBox = form && form.children.find(c => c.name === 'Content');   // ชิ้นแรกของทั้ง modal อยู่ในแถวที่ซ่อน ⇒ หาในกล่อง Content ที่เห็น
  const who = (shownBox || m).findAll(x => x.type === 'INSTANCE' && x.name === '_Content item base')[0];   // ผู้ลงนามในหน้าต่าง: ค่าตัวอย่างในตัว component (นาย อนุชิต ลิ้มกิมฮวย) → ผู้ที่กำลังเซ็น
  if (who && party) { setProps(who, { Label: party[0], Text: party[1] }); await putText(who, 'Label', party[0]); await putText(who, 'Text', party[1]); }
  const ft = find(m, 'Modal footer');
  if (ft) { const sb = find(ft, 'Secondary button'); if (sb) setProps(sb, { Text: 'ปิด', 'Leading icon': false, 'Trailing icon': false }); const pb = find(ft, 'Primary button'); if (pb) setProps(pb, { Text: 'บันทึก', 'Leading icon': false, 'Trailing icon': false }); }
}
/* ---------- แบบตรวจสภาพตามประเภทยานพาหนะ (S10 Step 1 · R86) ----------
   9 พ.ย. 2569 เจ้าของงาน (ไฟล์ "04 ใบตรวจสภาพ-ซ่อม รถกระเช้าแก้ไฟ ฮอทไลน์ รถ.xlsx") "อยากให้การตรวจรถถ้าเลือกมาเป็นกระเช้า จะใช้แบบการตรวจ แท็บ ตรวจสภาพรถกระเช้า แต่ถ้าเป็นรถพ่วงฉีดน้ำก็จะใช้แบบประเมิน แท็ป ตรวจสภาพรถพ่วงฉีดน้ำ โดยข้อมูลที่เป็น display ก็คือข้อมูล ด้านบนของการตรวจ"
   + เจ้าของงานเคาะ: ใช้แทนรายการเอกสารรับยานพาหนะใน Step 1 · ลงนาม ผู้ตรวจ / ผู้รับการตรวจ ตามท้ายใบตรวจ
   กระเช้าแก้ไฟ กระเช้าฮอทไลน์ = แท็บ "ตรวจสภาพรถกระเช้า" (30 รายการ) · รถพ่วงฉีดน้ำ = แท็บ "ตรวจสภาพรถพ่วงฉีดน้ำ" (19 รายการ) · ผลรายข้อ ปกติ / แก้ไข / หมายเหตุ
   ข้อมูลส่วนบนของใบตรวจ = กล่องแสดงข้อมูล (vehicleInfo) · ชื่อช่องที่มี "รถ" เป็น "ยานพาหนะ" (R80) · "รุ่น" ที่ซ้ำแยกเป็นรุ่นกระเช้า/รุ่นยานพาหนะ/รุ่นเครื่องยนต์
   "ส่วนอื่นๆ" ของใบตรวจ = ปุ่มเพิ่มรายการท้ายตาราง
   InspectionChecklist ของไฟล์ Maintain-D มี 25 แถวตายตัว + ส่วนสาเหตุส่งซ่อม (instance เพิ่มแถวไม่ได้) ⇒ ตารางตรวจประกอบจากชิ้นไลบรารีแบบเดียวกับแบบสำรอง (checkTable · มือถือ checkCard)
   รหัส SERIAL No. หมายเลข HC เครื่องยนต์ = ค่าสมมติ */
const BUCKET_ITEMS = ['น้ำมันไฮดรอลิก', 'กรองน้ำมันไฮดรอลิก', 'แรงดันน้ำมันไฮดรอลิก MAIN 2400-2600 PSI', 'ชุดเกียร์ PTO', 'ปั๊มน้ำมันไฮดรอลิก', 'เพลาขับปั๊มน้ำมันไฮดรอลิก',
  'ชุดกระบอกขาช้างหน้าซ้าย-ขวา', 'ชุดกระบอกขาช้างหลังซ้าย-ขวา', 'น้ำมันหล่อลื่นชุดเฟืองหมุนฐานเครน', 'ชุดมอเตอร์และเฟืองหมุนฐานเครน', 'ชุดกระบอก LOWER BOOM', 'ชุดกระบอก UPPER BOOM',
  'ชุดกระบอก EXTENSION', 'ชุดโรตารี่', 'ระบบ EMERGENCY', 'ชุด CONTROL ล่าง', 'ชุด CONTROL บน', 'สายน้ำมันไฮดรอลิก', 'สายสัญญาณต่างๆ', 'เกจวัดต่างๆ', 'ชุดวาล์วล๊อคต่างๆ',
  'ชุดปรับการหมุนและปรับดิ่งใบกระเช้า', 'BUCKET, LINER', 'ชุดการ์ดครอบป้องกันกระแสไฟ', 'รอกและเชือกวินซ์', 'ชุด LIFT รุ่น 115 KV', 'การอัดและเคลือบจารบีตามจุดต่างๆ', 'ชุดยึดฐานเครน',
  'ท่อนบูม, สลัก, จุดยึด', 'PLATE ซองบูม, SLIDE PAD ADJ.'];
const WATER_ITEMS = ['น้ำมันเครื่องยนต์', 'น้ำมันเกียร์ชุดเฟืองเกียร์ทดรอบ', 'น้ำมันดุมล้อ', 'กรองอากาศ', 'กรองน้ำมันเครื่องยนต์', 'กรองน้ำมันเชื้อเพลิง', 'กรองดักน้ำ',
  'สภาพเครื่องยนต์รอบเครื่อง 2400 RPM', 'น้ำ, หม้อน้ำ, ท่อน้ำ, ฝาปิดหม้อน้ำ', 'สภาพและความตึงของสายพานพัดลม/ไดชาร์ท', 'แบตเตอรี่, ขั้วแบตเตอรี่และน้ำกลั่น',
  'รอยรั่วน้ำมันเชื้อเพลิง, น้ำมันเครื่อง, น้ำระบายความร้อน', 'แรงดันน้ำ MAIN 800 PSI', 'แรงดันน้ำปลายปืน 1-2 กระบอก 400 PSI', 'ระบบไฟควบคุมอุปกรณ์ต่าง ๆ', 'มาตรวัดต่าง ๆ',
  'ข้อต่อ, วาล์วน้ำ', 'สายฉีดน้ำ', 'ชุดอุปกรณ์ REEL เก็บสายฉีดน้ำ'];
const WATER_CAR = CAND[9].slice(0, 3);   // รถพ่วงฉีดน้ำของจอตัวอย่าง (82-9012 ขอนแก่น)
const brandModel = (s) => { const w = s.trim().split(' '); return [w[0], w.slice(1).join(' ')]; };
function inspectForm(c) {   // แบบตรวจของยานพาหนะ c ตามประเภท: ชื่อแบบ · ข้อมูลส่วนบน · รายการตรวจ
  const [car, body] = c[1].split(' + '), [vb, vm] = brandModel(car);
  if (typeOf(c) === VTYPES[2]) return { title: 'แบบฟอร์มการตรวจสภาพรถพ่วงฉีดน้ำ', items: WATER_ITEMS, kv: [['งานเลขที่', P[0]], ['ยี่ห้อยานพาหนะ', vb], ['รุ่นยานพาหนะ', vm], ['ทะเบียน', c[0]],
    ['รหัส', 'W-2565-0218'], ['ใช้งานประจำที่', c[2]], ['SERIAL No.', 'FM8JN-71245'], ['ยี่ห้อเครื่องยนต์', 'Kubota'], ['รุ่นเครื่องยนต์', 'V2203'], ['SERIAL No. เครื่องยนต์', '2B4471'], ['ระยะเวลาการใช้งาน (Hr)', '2,840']] };
  const [cb, cm] = brandModel(body.replace(/^กระเช้า /, ''));
  return { title: 'แบบฟอร์มการตรวจสภาพกระเช้าแก้ไฟและกระเช้าฮอทไลน์', items: BUCKET_ITEMS, kv: [['งานเลขที่', P[0]], ['ยี่ห้อกระเช้า', cb], ['รุ่นกระเช้า', cm], ['ทะเบียน', c[0]],
    ['รหัส', 'B-2563-0412'], ['ใช้งานประจำที่', c[2]], ['SERIAL No.', cm + '-11873'], ['หมายเลข HC', 'HC-0412'], ['ยี่ห้อยานพาหนะ', vb], ['รุ่นยานพาหนะ', vm], ['ระยะทางการใช้งานยานพาหนะ (Km)', '182,400'], ['ระยะเวลาการใช้งานเครน (Hr)', '6,120']] };
}
const INSPECT_NOTE = { 17: 'สายน้ำมันไฮดรอลิกซึมที่ข้อต่อ เปลี่ยนแล้ว' }, INSPECT_FIX = 17;   // ข้อมูลจำลองตอนตรวจครบ: ทุกรายการ "ปกติ" ยกเว้นข้อ 18 "แก้ไข"
async function inspectStep(c, filled, signed, sign) {   // Step 1: ข้อมูลส่วนบนของใบตรวจ + รายการตรวจตามประเภท + ลงนาม ผู้ตรวจ / ผู้รับการตรวจ · sign = ผู้ลงนาม (ค่าเริ่ม SIGN_IN · S23 vendorSign)
  const fm = inspectForm(c), sel = (i) => filled ? (i === INSPECT_FIX % fm.items.length ? 1 : 0) : -1;
  const list = MOB
    ? fm.items.map((t, i) => checkCard((i + 1) + '. ' + t, ['ปกติ', 'แก้ไข'], sel(i))).concat([btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round', size: 'lg' })])
    : [checkTable(fm.items.map((t, i) => (i + 1) + '. ' + t), [['รายการ', 0], ['ปกติ', 100, i => radioCell(sel(i) === 0)], ['แก้ไข', 100, i => radioCell(sel(i) === 1)],
        ['หมายเหตุ', 448, i => noteCell(filled && sel(i) === 1 ? INSPECT_NOTE[INSPECT_FIX] : ''), true]], true)];
  return [await vehicleInfo(fm.kv, fm.title),
    col('InspectionChecklist', [await section('รายการตรวจสภาพ', { badge: fm.items.length })].concat(list), 16),
    await signSection(SIGN_INSPECT, sign || SIGN_IN, filled, signed)];
}
const SIGN_INSPECT = 'ลงนามการตรวจสภาพ';   // 5 พ.ย. 2569 รีวิว S10 Step 1 "ลงนามการตรวจสภาพ" (เดิม "ลงนามการรับมอบรถ") · บังคับ — เจ้าของงาน "เรื่องลงนาม require"
async function receiptPanel(filled, signed) {
  const o = { filled, signed };   // รายการรับรถ + ลงนามการตรวจสภาพ
  if (has('ReceiptChecklist') && has('HandoverSignature')) {   // ต้นฉบับมี Breakpoint Mobile ด้วย (การ์ดรายการละใบ) ⇒ ใช้ทั้งสองขนาด
    const rc = inst('ReceiptChecklist', { Breakpoint: BP(), State: filled ? 'Filled' : 'Default' }); rc.name = 'ReceiptChecklist';
    const hs = inst('HandoverSignature', { State: signed ? 'Signed' : filled ? 'Filled' : 'Default' }); hs.name = 'HandoverSignature';
    // หัวลงนามในตัว component = "ลงนามการรับมอบรถ" → แก้แค่ข้อความ · ReceiptChecklist ของงานซ่อมมีส่วนลงนามซ้อนอยู่ในตัวด้วย (แบบเดียวกับ Overhaul S8) แก้ทั้งสองที่ให้ตรงกัน
    // 1 ส่วนลงนามเท่านั้น (ชีตลูกค้า 5 พ.ย. 2569: เห็น "ลงนามการตรวจสภาพ" สองชุด และเซ็นแล้วเปลี่ยนแค่ชุดเดียว) — HandoverSignature ที่ซ้อนใน ReceiptChecklist มีแค่ State Default/Filled
    // (ไม่มี Signed) ⇒ ซ่อนชุดที่ซ้อน ใช้ HandoverSignature แยกที่มีครบ 3 State ทั้งยังไม่เซ็นและเซ็นแล้ว
    rc.findAll(n => n.name === 'HandoverSignature').forEach(n => { n.visible = false; });
    await signFix(hs, SIGN_INSPECT, SIGN_IN, filled);
    return [rc, hs];
  }
  const sel = (i) => o.filled ? 0 : -1;
  const list = MOB
    ? RECEIPT_ITEMS.map((t, i) => checkCard(t, ['มี', 'ไม่มี'], sel(i), sel(i) === 0 ? [col('Checklist', [syncLabel(inst('Input label', {}, { 'Label text': 'สภาพ', Optional: true }), 'สภาพ', true),
        row('Check', [['ชำรุด', i === RECEIPT_BAD], ['ผิดรุ่น', false]].map(([x, on]) => inst('Checkbox text card', { State: 'Default', Selected: on ? 'True' : 'False' }, { Text: x, Supporting: false })), { keep: true, gap: 16 })], 8)] : []))
      .concat([btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round', size: 'lg' })])
    : [checkTable(RECEIPT_ITEMS, [['รายการ', 0], ['มี', 100, i => radioCell(sel(i) === 0)], ['ไม่มี', 100, i => radioCell(sel(i) === 1)],
        ['ชำรุด', 100, i => checkCell(o.filled && i === RECEIPT_BAD, !o.filled)], ['ผิดรุ่น', 100, i => checkCell(false, !o.filled)],
        ['หมายเหตุ', 450, i => noteCell(o.filled ? RECEIPT_NOTE[i] || '' : ''), true]], true)];
  return [col('ReceiptChecklist', [await section('รายการเอกสารรับยานพาหนะ', { badge: RECEIPT_ITEMS.length })].concat(list), 16),
    await signSection(SIGN_INSPECT, SIGN_IN, o.filled, o.signed)];
}
/* ลงนามการส่งคืนรถ ตอนปิดงาน — 5 พ.ย. 2569 เจ้าของงาน "s10 เอาตรวจสภาพปิดงาน ออกไปเลย" (R65) ⇒ เอาตารางตรวจสภาพรถปิดงาน (24 รายการ ปกติ/ต้องแก้ไข/หมายเหตุ + เพิ่มรายการ) ออก คงไว้แค่ลงนามการส่งคืนรถ
   ไฟล์ที่มี InspectionChecklist ของงานซ่อม: ใช้ instance เดิม AfterRepair=true แล้วซ่อนส่วนตรวจสภาพ (Section header · Content with scrollbar · Table pagination) เหลือ AfterRepair > HandoverSignature (ซ่อน RepairFeedback ReturnPart เหมือนเดิม)
   ไม่มี component / แบบสำรอง = signSection "ลงนามการส่งคืนรถ" · รายการรับรถตอนเริ่มงาน (receiptPanel) ไม่เกี่ยว คงเดิม */
async function inspectPanel(filled, signed, sign) {   // sign = ผู้ลงนาม (ค่าเริ่ม SIGN_OUT · S23 vendorSign)
  sign = sign || SIGN_OUT;
  if (has('InspectionChecklist')) {
    const ic = inst('InspectionChecklist', { Breakpoint: BP(), State: filled ? 'Filled' : 'Default' }, { AfterRepair: true }); ic.name = 'InspectionChecklist';
    ic.children.forEach(c => { if (c.name !== 'AfterRepair') c.visible = false; });
    const ar = find(ic, 'AfterRepair');
    if (ar) { ar.visible = true; ['RepairFeedback', 'ReturnPart'].forEach(nm => { const x = find(ar, nm); if (x) x.visible = false; });
      const hs = find(ar, 'HandoverSignature'); if (hs) { setProps(hs, { State: signed ? 'Signed' : filled ? 'Filled' : 'Default' }); await signFix(hs, 'ลงนามการส่งคืนยานพาหนะ', sign, filled); } }
    return [ic];
  }
  return [await signSection('ลงนามการส่งคืนยานพาหนะ', sign, filled, signed)];
}
/* ---------- S10 ขั้นตอนบำรุงรักษา 2 ขั้น (5 พ.ย. 2569 รีวิวทีมออกแบบ · เจ้าของงาน "s10 ลองปรับให้เป็นแบบที่เขียนให้") ----------
   รีวิว: "หน้างานรายคัน - เริ่มงาน เมื่อกดเริ่มงาน จะพาเข้า Step การ Maintain · Step1 : ตรวจสภาพก่อนบำรุงรักษา ลงนามการตรวจสภาพ · Step2 : ไม่ต้องมีแล้ว · Step3 : เอาไปแทน Step2 สรุปงานก่อนปิดงาน"
   ⇒ กดเริ่มงาน = สถานะ "อยู่ระหว่างบำรุงรักษา" ทันที (เจ้าของงาน 5 พ.ย. 2569 "เข้ามา step 1 ถือว่า อยู่ระหว่างบำรุงรักษา เลย") แล้วเข้าหน้าขั้นตอน
     Step 1 ตรวจสภาพก่อนบำรุงรักษา = รายการรับรถ (ReceiptChecklist) + ลงนามการตรวจสภาพ (HandoverSignature · บังคับ "เรื่องลงนาม require" ⇒ ปุ่มยืนยันกดไม่ได้จนลงนามครบ) + ภาพก่อนเริ่มงาน
     Step 2 สรุปงานก่อนปิดงาน = หน้าปิดงานเดิม (ไล่ยาว) + จำนวนที่ใช้จริงกรอกได้ (R74) + งบที่ตัด/ศูนย์ต้นทุนแบบงานซ่อม (R72) + วันที่เปลี่ยนน้ำมันครั้งล่าสุดกรอกได้ (R73)
     หน้า "อยู่ระหว่างบำรุงรักษา" ระหว่างรับรถกับปิดงาน (Step 2 เดิมของรีวิว) เอาออก
   แถบขั้นตอน (R70) = Progress steps Type=Horizontal ของไลบรารีทั้งก้อน ซ่อนช่อง 3–7 (R10 · แบบ Create vehicle ของ 5.2 Vehicle Management ใน UI Release#2 ที่ปิดช่องเกิน)
     วางบนสุดของเนื้อหาแบบหน้างานซ่อม (Repair - กบค. ของไฟล์ Maintain-D: Section > Progress steps > เนื้อหาขั้น) · มือถือ = Mobile progress steps Collapsed=True
     + Step circles / 4 steps ตัวเลข 1/2 · 2/2 แบบ Check Expense Modal หน้า 5.14 - 5.15 Cost & Expense Check ของ UI Release#2 (ขั้นตอน 2 ขั้น)
   ปุ่มตามกติกา stepper ของเจ้าของงาน (ง.5): ขั้นปัจจุบัน ย้อนกลับ (ซ้าย) + ปุ่มยืนยันของขั้น (ขวา) · ปุ่ม "บำรุงรักษาไม่ได้" อยู่ที่หัวหน้าทุกขั้น */
const MT_STEPS = ['ตรวจสภาพก่อนบำรุงรักษา', 'สรุปงานก่อนปิดงาน'];
/* ป้ายสถานะที่หัวหน้าสีเดียวกับตาราง (ชีตลูกค้า 5 พ.ย. 2569: "อยู่ระหว่างบำรุงรักษา" หัวหน้าเป็น Brand แต่ตารางเป็น Warning) — Badge outline ของ Page header ไม่มีสี Warning
   ⇒ สลับเป็น Pill outline สีตาม WSTAT แบบ Page header ของหน้า Vehicle Breakdown / 5.5 Repair & Maintenance Job ใน UI Release#2 (Pill outline Warning "อยู่ระหว่างซ่อม" ในหัว) */
function headPill(scr, st) {
  const ph = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Page header')[0], b = ph && ph.findAll(n => n.type === 'INSTANCE' && n.name === 'Badge outline')[0];
  if (!b) return;
  try { b.swapComponent(main('Pill outline', { Color: st[1] })); setProps(b, { Text: st[0] }); } catch (e) { warn('ป้ายหัวหน้า Pill outline', e); }
}
async function mtStepper(cur) {   // cur = 1 | 2
  if (MOB) {
    const m = inst('Mobile progress steps', { Collapsed: 'True' }, { Text: MT_STEPS[cur - 1], Supporting: cur < MT_STEPS.length, 'Supporting text': MT_STEPS[cur] || '' });
    setProps(m, { 'Stepper item swap': main('Step circles / 4 steps', { Step: cur === 1 ? '2' : '4' }).id });   // วง 2/4 = ครึ่ง (1 จาก 2) · 4/4 = เต็ม (2 จาก 2)
    const c = m.findAll(n => n.type === 'INSTANCE' && /^Step circles/.test(n.name))[0];
    if (c) { await text(c, 'Current', String(cur)); await text(c, 'Total', String(MT_STEPS.length)); }
    return m;
  }
  const ps = inst('Progress steps', { Type: 'Horizontal' }, { 'Step 2': true, 'Step 3': true, 'Step 4': true });
  ps.children.filter(c => c.type === 'INSTANCE' && c.name === 'Horizontal step item').forEach((it, k) => {
    if (k >= MT_STEPS.length) { it.visible = false; return; }
    const n = k + 1;
    setProps(it, { Status: n < cur ? 'Completed' : n === cur ? 'Current' : 'Incomplete' });
    setProps(it, { Text: MT_STEPS[k], Number: String(n).padStart(2, '0'), Supporting: false, Connector: n < MT_STEPS.length });
    try { it.layoutGrow = 1; } catch (e) { /* กว้างตามไลบรารี */ }
  });
  return ps;
}
/* หน้าขั้นตอนของงานรายคัน · o.step = 1 | 2 · o.hire = ใบจ้าง (กบค. กรอกแทนผู้รับจ้าง) · o.vendor = S23 มุมผู้รับจ้าง (R87) · o.i = ลำดับรถ
   ใบจ้างทั้งสองแบบ (o.hire · o.vendor) Step 2 ไม่มีส่วนค่าใช้จ่ายของยานพาหนะ และตารางรายการสภาพวัสดุอะไหล่ไม่มีคอลัมน์ราคา (เจ้าของงาน 10 พ.ย. 2569
   _"จะไม่มีเรื่องทั้ง section ค่าใช้จ่ายรายคัน ที่ต้องกรอก ส่วนที่สภาพวัสดุอะไหล่ ส่วนที่เป็นราคาต้องไม่แสดง · s23 ยังแสดงเหมือนเดิมแต่ส่วนที่เป็นราคา ของค่าใช้จ่ายของรถรายคัน จะไม่มี ส่วนที่เหลือยังคงเดิม"_)
   ผู้รับจ้าง: วันดำเนินการใน Step 1 อ่านอย่างเดียว (ผู้รับจ้างแก้ข้อมูลยานพาหนะในแผนเดินทางไม่ได้ ตามเงื่อนไขการมองเห็นเดิม · ยังไม่เคาะ) · ผู้ลงนามฝั่งผู้ดำเนินการ = ช่างผู้รับจ้าง (vendorSign)
   Step 1: o.filled (ตรวจรายการแล้ว) · o.signed (ลงนามครบ) · o.signModal
   Step 2: o.filled · o.errors · o.safety · o.oilRes · o.oil (ตัวเลือกน้ำมัน) · o.date / o.dateOpen (วันที่เปลี่ยนน้ำมันครั้งล่าสุด) · o.budget (budgetPick)
   ทั้งสองขั้น: o.modal = 'cannot' (popup บำรุงรักษาไม่ได้) · o.reason · o.cannotErrors */
async function stepPage(name, o) {
  o = o || {};
  const v = !!o.vendor, h = !!o.hire || v, t = h ? HIRE_T : JOB_T, i = o.i == null ? (h ? TRIP_V.sel[0] : JOB_I) : o.i, c = o.car || TRIP_CARS[i], step = o.step || 1;   // o.car = จอตัวอย่างรถพ่วงฉีดน้ำ (R86)
  const { scr, page } = await shell(name, { title: c[0], back: true, crumbs: [NOW_Q, t.name, c[0]], badge: WSTAT.doing, actions: [['Secondary button', 'บำรุงรักษาไม่ได้']] });
  headPill(scr, WSTAT.doing);
  const nodes = [await mtStepper(step)].concat(await jobBoxes(h, t, i, true, o.car, v ? HIRE_BY : null));
  let dateAnchor = null, workAnchor = null;
  if (step === 1) {
    /* R83 แก้วันดำเนินการของคันนี้ตอนเริ่มงาน (9 พ.ย. 2569 ค่ำ เจ้าของงาน _"ในแผนการเดินทางอ่ะ จะมีช่วงของการดำเนินการอยู่แล้ว แต่ในรายคันอยากให้เห็นว่าแต่ละคันจะดำเนินการเมื่อไร"_ + _"ใส่ตรงหน้ารายการรถ ก็ได้ หรือจะใส่ในตอนเริ่มงานก็ได้ … อยากให้สามารถแก้ไขได้"_) ⇒ Section "วันดำเนินการ" บนสุดของ Step 1 · ช่องเดียวกับ popup แก้ไขยานพาหนะในแผนเดินทาง (Text input + ไอคอนปฏิทิน ช่วงวัน) ค่าเริ่มต้น = วันดำเนินการในตาราง · o.workPick = เปิดปฏิทิน */
    const wv = (o.workPick || workRange(i, t)).join(' - ');
    workAnchor = field('วันดำเนินการ', wv, { lead: 'calendar_month-24-300-round', state: v ? 'Readonly' : o.workPick ? 'Focused' : undefined });   // S23 อ่านอย่างเดียว
    nodes.push(col('Section', [await section('วันดำเนินการ'), MOB ? workAnchor : row('Row', [workAnchor, frame('Spacer', 'VERTICAL')])], 16));
    nodes.push(...await inspectStep(c, o.filled, o.signed, v ? vendorSign(SIGN_IN) : null),   // 9 พ.ย. 2569 แบบตรวจตามประเภทยานพาหนะ แทนรายการเอกสารรับยานพาหนะ (R86)
      col('Section', [await section('ภาพก่อนเริ่มงาน')].concat(await photoUploads(BEFORE, o.filled, false)), 16),
      btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันการตรวจสภาพ', { size: 'lg', disabled: !o.signed }]]));   // ลงนามบังคับ (เจ้าของงาน 5 พ.ย. 2569)
  } else {
    const E = (m) => o.errors ? m : '', oil = o.oil == null ? TRIP_OIL[i] : o.oil;   // ค่าตั้งต้น = น้ำมันตามแผนของคันนี้ (S21)
    nodes.push(
      col('Section', [await section('ข้อมูลเอกสาร'), kv([['เลขที่งาน', P[0]], ['หน่วยงานผู้ใช้บริการ', c[2]], ['ชื่องาน', 'บำรุงรักษา' + typeOf(c) + ' ' + c[1] + ' ทะเบียน ' + c[0] + ' ณ ' + tripLoc(i, t.locs)], ['วันที่รับงาน', JOB_START.slice(0, 10)], ['วันที่เสร็จงาน', JOB_END.slice(0, 10)]])], 16),
      col('Section', [await section('บันทึกข้อตกลงลูกค้า'), kv([['ติดต่อลูกค้าชื่อ', SIGN_OWNER], ['ตำแหน่ง', 'หัวหน้าแผนก ' + c[2]], ['เมื่อวันที่', t.d1], ['เบอร์โทรศัพท์', tripPhone(i, t.phones)], ['ความต้องการลูกค้า', 'บำรุงรักษาตามแผน ณ ' + tripLoc(i, t.locs)]])], 16),
      await closeParts(CLOSE_PARTS.filter((r, k) => k > 0 || oil !== 0), o.filled, h));   // ใบจ้าง: ไม่มีคอลัมน์ราคา (R87)
    if (!h) nodes.push(await closeCosts(o.filled, o.budget));   // ใบจ้าง: ไม่มีส่วนค่าใช้จ่ายของยานพาหนะคันนี้ (รวมงบที่ตัด ศูนย์ต้นทุน · R87)
    nodes.push(
      col('Section', [await section('ผลการบำรุงรักษา'),
        row('Row', [field('เลขไมล์ยานพาหนะ (กม.)', o.filled ? '182,640' : '', { placeholder: '0', error: E('กรุณาระบุเลขไมล์ยานพาหนะ') }),
          field('ชั่วโมงเครื่องจักร (ชม.)', o.filled ? '6,131' : '', { placeholder: '0', error: E('กรุณาระบุชั่วโมงเครื่องจักร') })])], 16));
    const oilBox = await jobOil(oil, o.oilRes || {}, { date: o.date, dateOpen: o.dateOpen, car: c[0] });
    dateAnchor = oilBox.findOne(n => n.type === 'INSTANCE' && n.name === 'Text input' && n.componentProperties && Object.keys(n.componentProperties).some(k => /^Label text/.test(k) && n.componentProperties[k].value === 'วันที่เปลี่ยนน้ำมันครั้งล่าสุด'));
    nodes.push(oilBox);
    if (safetyOn()) nodes.push(col('Section', await safetyDocs(o.safety), 16));   // Safety Inspection (ถ้ามี) ต่อจากน้ำมันไฮดรอลิก (4 พ.ย. 2569)
    nodes.push(...await inspectPanel(o.filled, o.filled, v ? vendorSign(SIGN_OUT) : null));   // ลงนามการส่งคืนรถ (5 พ.ย. 2569 ตัดตรวจสภาพรถปิดงานออก · R65)
    nodes.push(await closeDocs(o.filled));
    nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ปิดงาน', { size: 'lg', disabled: !o.filled }]]));   // 5 พ.ย. 2569 กติกาใหม่ (R59): Disabled จนกว่าครบ (เลขไมล์ ชั่วโมงเครื่องจักร ลงนามการส่งคืนรถ) · error ขึ้นเมื่อออกจากช่อง (Out of focus)
  }
  add(page, col('Content', nodes, 32), 'h');
  if (step === 1 && o.signModal) await signModal(scr, SIGN_INSPECT, o.filled, (v ? vendorSign(SIGN_IN) : SIGN_IN)[0]);
  if (o.workPick && workAnchor && !MOB) {   // ปฏิทินช่วงวัน แบบ popup แก้ไขยานพาหนะในแผนเดินทาง (rangeDays · วันนอกช่วงวันเดินทางกดไม่ได้)
    const dp = await rangeDays(await thaiDatePicker(inst('Date picker', { Type: 'Single' }, { 'Time picker': false }), [monthOf(t.d1)]), dayOf(t.d1), dayOf(t.d2), dayOf(o.workPick[0]), dayOf(o.workPick[1]));
    overlay(scr, dp, 0, 0);
    const sb = scr.absoluteBoundingBox, ab = workAnchor.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4;
  }
  if (o.dateOpen && dateAnchor && !MOB) {   // ปฏิทินวันเดียว = Date picker Type=Single วางใต้ช่อง (มือถือไม่วาง แบบช่องวันที่ของ S6)
    const dp = await thaiDatePicker(inst('Date picker', { Type: 'Single' }, { 'Time picker': false }), ['มีนาคม 2568']);   // เดือนของวันที่ในช่อง (12/03/2568)
    overlay(scr, dp, 0, 0);
    const sb = scr.absoluteBoundingBox, ab = dateAnchor.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4;
  }
  if (o.modal === 'cannot') await cannotModal(scr, i, { reason: o.reason, used: step === 2 ? CANNOT_USED : null, errors: o.cannotErrors });
  return scr;
}
async function workDetail(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: V[0], back: true, crumbs: [NOW_Q, JOB_T.name, V[0]], badge: WSTAT.done,   // 3 พ.ย. 2569 หัวเป็นทะเบียนเหมือนหน้างานรายคัน S10
 });
  const nodes = [await vehicleInfo(VEH_KV.concat([['เริ่มงาน', JOB_START], ['ปิดงาน', JOB_END], ['ผู้บันทึก', JOB_BY], ['น้ำมันไฮดรอลิก', JOB_OIL_OPTS[JOB_OIL]], ['เลขไมล์หลังทำ', '182,640 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '6,131 ชม.']]), 'ข้อมูลยานพาหนะและงาน'),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tblShort(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16),
    // ภาพตอนจบงานเอาออก 4 พ.ย. 2569 ให้ตรงกับหน้าปิดงาน ("ยังไม่ต้องมีเพิ่มรูป" 3 พ.ย.)
    // ค่าใช้จ่ายรายคันที่กรอกตอนปิดงาน (3 พ.ย. 2569) · แสดงเฉพาะรายการที่กรอก
    col('Section', [await sectionLabel('ค่าใช้จ่ายของยานพาหนะคันนี้ (บาท)'), await tblShort([['พนักงาน', 0, 'Lead text'], ['ค่าเบี้ยเลี้ยง/วัน', 150], ['ค่าที่พัก/วัน', 150], ['จำนวนวัน', 120], ['รวม', 150]],
      CLOSE_COST_BY.map(r => [r[0], nf(r[1]), nf(r[2]), String(r[3]), nf(personSum(r))])),
      kv([['รวมค่าเบี้ยเลี้ยง', CLOSE_COST.perDiem + ' บาท'], ['รวมค่าที่พัก', CLOSE_COST.lodging + ' บาท'], ['ค่าเดินทาง (รวมทุกคน)', CLOSE_COST.travel + ' บาท'], ['ค่าชั่วโมงทำงาน', CLOSE_HOURS + ' ชม. × ' + nf(CLOSE_RATE) + ' บาท = ' + CLOSE_COST.labour + ' บาท'], ['รวมค่าใช้จ่ายของยานพาหนะคันนี้', CLOSE_COST.total + ' บาท'], ['งบที่ตัด', BUDGET_CUT[0]], ['ศูนย์ต้นทุน', OWNER_CC(TRIP_CARS[JOB_I])]])], 16)];   // คู่ งบที่ตัด + ศูนย์ต้นทุน แบบ BudgetSource ของงานซ่อม (5 พ.ย. 2569 R72)
  // 3 พ.ย. 2569 เจ้าของงาน "ตรงนี้ลบแบชออก แล้วมี radio ว่าผ่าน ไม่ผ่าน และมีให้ upload ไฟล์เป็น optional" ⇒ กรอกผลในหน้านี้ได้เลย (อีกทางคือเมนู … ในหน้ารายละเอียดแผนเดินทาง S12)
  // S12 (4 พ.ย. 2569) ทางเดียวที่บันทึกผลหลังปิดงาน = section นี้ในหน้ารายละเอียดงานรายคัน · แสดงเฉพาะคันที่เก็บตัวอย่าง · o.res = { sel, files, errors, saved }
  const res = o.res || {};
  if (OIL_SAMPLED(JOB_OIL)) nodes.push(col('Section', [await sectionLabel('ผลการทดสอบน้ำมันไฮดรอลิก'), ...await oilResult(res),   // หน้างานรายคันแบบดู = Section label (R3)
    kv([['เก็บตัวอย่างเมื่อ', JOB_END.slice(0, 10) + ' โดย ' + JOB_BY]].concat(res.saved ? [['บันทึกผลเมื่อ', '11/11/2569 14:02 น. โดย ' + JOB_BY]] : [])),
    btnRow([['Primary button', 'บันทึกผลการทดสอบ', { size: 'md' }]])], 16));
  const sf = o.safety || {};   // Safety Inspection เพิ่มภายหลัง (4 พ.ย. 2569) · o.safety = { files, saved }
  if (safetyOn()) nodes.push(col('Section', [...await safetyDocs(sf.files, true)].concat(sf.saved ? [kv([['บันทึกเอกสารเมื่อ', '12/11/2569 09:30 น. โดย ' + JOB_BY]])] : [],
    [btnRow([['Primary button', 'บันทึกเอกสาร Safety Inspection', { size: 'md' }]])]), 16));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S24 ข้อมูลการบำรุงรักษารายคัน + กำหนดครั้งถัดไป (เจ้าของงาน 4 พ.ย. 2569 · เลขชั่วคราว) ----------
   "จากข้อมูลที่กรอก ในตอนปิดงาน อยากให้ข้อมูลเหล่านั่นถูกเก็บ ในตารางๆ นึง แยกเป็นข้อมูลการบำรุงรักษา โดยอนาคตจะต้องแทร็กได้ ว่า ใกล้ถึงกำหนดการบำรุงรักษาครั้งต่อไปมั้ย … หน้าลิสที่มีรถทุกคัน และ search and filter ได้"
   เคาะ: แท็บ "การบำรุงรักษา" ของ Vehicle Management · ครั้งถัดไป = รายการที่ถึงก่อนจาก 4 อย่าง (รอบเวลา · ชั่วโมงเครื่องจักร/ระยะทาง · น้ำมันไฮดรอลิก 3 ปี · Safety Inspection 1 ปี) · ใกล้ครบ = เหลือไม่เกิน 6 เดือน
   ตาม Vehicle list + Filter + Vehicle detail (แท็บ ตารางบำรุงรักษา) ของ UI Release#2 หน้า Vehicle Management · Tabs · Table header · Table · Side panel header/footer · Empty state/Search not found ของไฟล์ Component
   บรรทัดรองสถานะ = Supporting text สี Color/text/warning · Color/text/error แบบช่องเลขไมล์ของ Vehicle list (toneText ใน core) */
const MA_DUE = { near: ['ใกล้ครบกำหนดบำรุงรักษา', 'warning'], over: ['ครบกำหนดบำรุงรักษา', 'error'] };   // ข้อความตาม Vehicle list ของ UI Release#2
/* 10 พ.ย. 2569 เจ้าของงาน "ตอนนี้น่าจะมีแค่เกณฑ์เรื่องเวลา คือ เปลี่ยนทุก 1 ปี สำหรับกรองอากาศ และถ้าเป็นน้ำมันไฮดรอลิก จะเปลี่ยนทุก 3 ปี ระหว่างนั้น ต้องเก็บตัวอย่าง
   แปลว่าระบบต้องจำได้ว่า ถึงรอบการเปลี่ยน หรือการเก็บตัวอย่าง จากการที่ระบุมาในการบำรุงรักษา" + เคาะ เก็บตัวอย่างทุก 1 ปี · คง Safety Inspection ทุก 1 ปี และรอบบำรุงรักษาทั่วไป · ตัดชั่วโมงเครื่องจักร/ระยะทาง
   ระบบจำจากที่บันทึกตอนปิดงาน S10 Step 2: ไส้กรองอากาศ = มีในอะไหล่ที่ใช้จริง · น้ำมัน = ตัวเลือกเก็บตัวอย่าง / เปลี่ยน · ผลตรวจจาก S12 · Safety = เอกสารที่บันทึก (I.24) — ไม่ต้องเพิ่มช่องกรอก */
const MA_ITEMS = ['รอบบำรุงรักษา', 'ไส้กรองอากาศ', 'เปลี่ยนน้ำมันไฮดรอลิก', 'เก็บตัวอย่างน้ำมัน', 'การตรวจ ปจ.2'];   // รายการที่ 5 ชื่อบนจอ "การตรวจ ปจ.2" (เดิม Safety Inspection · เจ้าของงาน 11 พ.ย. 2569 · MA_ITEMS ของเว็บ BACKLOG ข้อ 67ง) · เอกสารแนบตอนปิดงาน S10 ยังชื่อ Safety Inspection ตามเว็บ
const MA_CYCLE = ['ทุก 12 เดือน', 'เปลี่ยนทุก 1 ปี', 'เปลี่ยนทุก 3 ปี (ปีที่ 1 และปีที่ 4)', 'เก็บตัวอย่างปีที่ 2 และ 3 หลังเปลี่ยน', 'ทุก 1 ปี'];   // เจ้าของงาน 10 พ.ย. 2569 "ปีที่ 1 เปลี่ยนน้ำมัน ปีที่2 เก็บตัวอย่าง ปีที่ 3 เก็บตัวอย่าง และปีที่ 4 เปลี่ยนน้ำมัน" (ผลตัวอย่างกรอกที่ S12 เหมือนเดิม)   // รอบบำรุงรักษาทั่วไป 12 เดือน = เสนอ ยังไม่เคาะ
const MA_TODAY = [10, 11, 2569], MA_NEAR = 6;   // วันนี้ (ค่าสมมติ) · ใกล้ครบ = เหลือไม่เกิน 6 เดือน (เคาะ 4 พ.ย. 2569)
const maD = (s) => s.split('/').map(Number);   // dd/mm/yyyy พ.ศ.
const maAdd = (s, y) => { const [d, m, yy] = maD(s); return [d, m, yy + y].map((v, k) => k < 2 ? String(v).padStart(2, '0') : String(v)).join('/'); };
const maKey = (s) => { const [d, m, y] = maD(s); return y * 400 + m * 32 + d; };
const maStatus = (due) => { const t = MA_TODAY, k = maKey(due), now = t[2] * 400 + t[1] * 32 + t[0], near = (t[2] + Math.floor((t[1] + MA_NEAR - 1) / 12)) * 400 + ((t[1] + MA_NEAR - 1) % 12 + 1) * 32 + t[0];
  return k < now ? 'over' : k <= near ? 'near' : ''; };
/* ยานพาหนะทุกคัน (ข้อมูลสมมติ) — [ลำดับใน TRIP_CARS, บำรุงรักษาล่าสุด, เลขที่ MR, เปลี่ยนไส้กรองอากาศล่าสุด, เปลี่ยนน้ำมันล่าสุด, เก็บตัวอย่างล่าสุด, ผลตรวจล่าสุด, Safety Inspection ล่าสุด] · '' = ยังไม่มีข้อมูล */
const MA_ROWS = [
  [9, '01/10/2568', 'MRZ6900011', '01/10/2568', '01/10/2566', '01/10/2568', 'ผ่าน', '01/10/2568'],
  [2, '14/10/2568', 'MRZ6900011', '14/10/2567', '14/10/2565', '14/10/2568', 'ไม่ผ่าน', '14/10/2568'],
  [7, '20/11/2568', 'MRZ6900011', '20/11/2568', '05/02/2567', '20/11/2568', 'ผ่าน', '20/11/2568'],
  [4, '10/01/2569', 'MRZ6900014', '10/01/2569', '10/01/2569', '10/01/2569', 'ผ่าน', '10/01/2569'],
  [6, '02/02/2569', 'MRZ6900014', '02/02/2569', '18/06/2567', '02/02/2569', 'ผ่าน', '02/02/2569'],
  [1, '18/06/2569', 'MRZ6900014', '18/06/2569', '12/03/2567', '18/06/2569', 'ผ่าน', '18/06/2569'],
  [8, '20/09/2569', 'MRZ7000001', '20/09/2569', '20/09/2569', '20/09/2569', 'ผ่าน', '20/09/2569'],
  [0, '04/11/2569', 'MRZ7000001', '04/11/2569', '04/11/2569', '04/11/2569', 'รอผลตรวจ', '04/11/2569'],
  [3, '', '', '', '', '', '', '']];
/* ครบกำหนดแต่ละรายการ: [วันที่, สถานะ] ตามลำดับ MA_ITEMS · น้ำมัน: ปีที่ครบเปลี่ยนแสดงเปลี่ยนแทนเก็บตัวอย่าง */
const maDues = (r) => {
  if (!r[1]) return null;
  const chg = maAdd(r[4], 3), smp = maAdd(maKey(r[5]) > maKey(r[4]) ? r[5] : r[4], 1);
  const oilChange = maKey(chg) <= maKey(smp);
  const d = [maAdd(r[1], 1), maAdd(r[3], 1), chg, oilChange ? '' : smp, maAdd(r[7], 1)];
  return d.map(x => x ? [x, maStatus(x)] : null);
};
const maNext = (r) => { const d = maDues(r); if (!d) return null; let k = -1; d.forEach((x, i) => { if (x && (k < 0 || maKey(x[0]) < maKey(d[k][0]))) k = i; }); return [k, d[k][0], d[k][1]]; };
const maOil = (r) => { const d = maDues(r); return d[3] ? ['เก็บตัวอย่าง', d[3]] : ['เปลี่ยนน้ำมัน', d[2]]; };
const toneOf = (st) => MA_DUE[st] ? { sub: MA_DUE[st][0], tone: MA_DUE[st][1] } : {};
/* หน้ารายการ (10 พ.ย. 2569 รอบ 2 เจ้าของงาน "ไส้ใน column อยากปรับใหม่ … หน้าของ list อยากแสดงรายละเอียดอื่นๆ ตัวอย่างเช่นพวกอายุการใช้งาน หรืออะไรที่เกี่ยวข้องกับการบำรุงรักษา")
   ⇒ คอลัมน์รายการ (ไส้กรองอากาศ · น้ำมัน · Safety) ย้ายไปแท็บตารางบำรุงรักษาของหน้ารายละเอียด · เจ้าของงานเลือก อายุการใช้งาน/เลขไมล์ · บำรุงรักษาล่าสุด · ครั้งถัดไป · ผลตรวจน้ำมัน · ประกัน · สถานะยานพาหนะ · ผู้ดูแลยานพาหนะ
   Table ของไลบรารี 8 คอลัมน์ ⇒ ไม่มีคอลัมน์ปุ่ม … · เปิดรายละเอียดด้วยลิงก์เลขทะเบียน (แบบลิงก์ทะเบียนทุกจุดของงานบำรุงรักษา 6 พ.ย. 2569 · AFTER_SCREEN) */
const MA_VSTAT = { ok: ['ปกติ', 'Success'], repair: ['อยู่ระหว่างซ่อม', 'Warning'], off: ['งดใช้งาน', 'Gray'] };   // สถานะยานพาหนะ (ค่าสมมติ ป้าย "ปกติ" ตามหน้ายานพาหนะของปลั๊กอิน Overhaul)
/* ต่อแถว MA_ROWS: [ปีที่จดทะเบียน, เลขไมล์สะสม, ชั่วโมงเครื่องจักรสะสม, ประกัน (MA_WAR), สถานะยานพาหนะ] (ค่าสมมติ) */
const MA_USE = [[2557, '171,220', '5,610', 'none', 'ok'], [2558, '168,900', '5,480', 'out', 'repair'], [2560, '154,300', '4,920', 'none', 'ok'], [2561, '176,050', '5,840', 'in', 'ok'],
  [2562, '149,700', '4,410', 'none', 'ok'], [2559, '176,050', '6,010', 'near', 'ok'], [2563, '163,480', '5,120', 'none', 'ok'], [2564, '182,640', '6,131', 'in', 'ok'], [2566, '41,200', '980', 'none', 'off']];
const MA_COLS = [['ทะเบียน', 200, 'Lead text'], ['อายุการใช้งาน', 170], ['บำรุงรักษาล่าสุด', 140], ['ครั้งถัดไป', 0], ['ผลตรวจน้ำมันล่าสุด', 160], ['ประกัน', 150, 'Badge'], ['สถานะยานพาหนะ', 150, 'Badge'], ['ผู้ดูแลยานพาหนะ', 190]];
const maRow = (r) => {
  const k = MA_ROWS.indexOf(r), c = TRIP_CARS[r[0]], u = MA_USE[k], n = maNext(r);
  return [{ text: c[0], sub: typeOf(c) }, { text: (MA_TODAY[2] - u[0]) + ' ปี', sub: u[1] + ' กม. · ' + u[2] + ' ชม.' }, r[1] ? { text: r[1], sub: r[2] } : '-',
    n ? Object.assign({ text: n[1] + ' · ' + MA_ITEMS[n[0]] }, toneOf(n[2])) : { text: 'ยังไม่มีข้อมูลการบำรุงรักษา' }, r[6] ? { text: r[6], sub: 'เก็บตัวอย่าง ' + r[5] } : '-',
    { pill: MA_WAR[u[3]] }, { pill: MA_VSTAT[u[4]] }, { text: CTRL_NAME[r[0]], sub: OWNER_PH[r[0]] }];
};
const maIdx = (fn) => MA_ROWS.map((r, i) => fn(r) ? i : -1).filter(i => i >= 0);
const MA_DUE_N = maIdx(r => { const n = maNext(r); return n && n[2]; }).length;
async function maTabs() { return tabs([['ยานพาหนะ', null], ['การบำรุงรักษา', MA_DUE_N]], 1); }   // แท็บของ Vehicle list · ป้าย = คันที่ใกล้หรือถึงกำหนด · ปฏิทินการจอง (ระบบจองยานพาหนะ) เอาออก 10 พ.ย. 2569 เจ้าของงาน
async function searchNotFound() {   // Empty state/Search not found ข้อความตาม Vehicle list (State=Search not found) ของ UI Release#2
  const es = inst('Empty state/Search not found');
  await text(es, 'Text', 'ไม่พบข้อมูล'); await text(es, 'Supporting text', 'เปลี่ยนคำค้นหรือเงื่อนไขแล้วลองใหม่อีกครั้ง');
  const bs = es.findAll(n => n.type === 'INSTANCE' && /button/i.test(n.name));
  bs.forEach((b, i) => { if (i === 0) setProps(b, { Text: 'ล้างตัวกรอง', 'Leading icon': false, 'Trailing icon': false }); else b.visible = false; });
  return es;
}
/* แดชบอร์ดการบำรุงรักษารายคัน (10 พ.ย. 2569 เจ้าของงาน "ตั้งใจอยากให้หน้านี้เป็นหน้า dashboard ที่สามารถกรองสิ่งต่างๆที่ต้องการ เช่น รถที่จะเข้าบำรุงครั้งต่อไป โดย filter จากเวลาในการบำรุงรักษาล่าสุด
   หรืออยาก filter รถที่ต้องเก็บผลน้ำมัน และรถแต่ละคันควรจะเข้าไปดูรายละเอียดได้") — โครงตาม MA Overview ของ UI Release#2: Tabs → Metric item → Table header → Table · R90
   o.query · o.rows = แถวที่เหลือ (ลำดับใน MA_ROWS) · o.chips · o.filter = แผงตัวกรอง { open } · o.menu */
/* S24 แบบ VMS+ (12 พ.ย. 2569 · R106 · ชุดวาดเหนือ S4) — Tabs ของ Vehicle list → หัวแดชบอร์ด → เรื่องที่ควรดู → ตัวกรองที่เลือก → การ์ดตัวเลข 6 ใบ → กราฟ 6 ใบ → Table header + Table (MA_COLS เดิม) → หมายเหตุแหล่งข้อมูล
   ตัวเลขทุกส่วนคิดจาก MA_ROWS · MA_USE · TRIP_CARS เดิม (maNext · maDues · maOil) · ตัวกรอง/กดกราฟ/กดเรื่องที่ควรดู กรองทั้งหน้า (o.rows) · ช่องค้นหากรองเฉพาะตาราง */
const maDate = (s) => { const [d, m, y] = maD(s); return new Date(y - 543, m - 1, d); };
const MA_NOW = () => new Date(MA_TODAY[2] - 543, MA_TODAY[1] - 1, MA_TODAY[0]);
const maUnit = (r) => TRIP_CARS[r[0]][2];   // หน่วยงานเจ้าของยานพาหนะ เช่น "กฟฉ.1 ขอนแก่น" · เขต = คำแรก
const maAge = (i) => MA_TODAY[2] - MA_USE[i][0];
const maState = (r) => !r[1] ? 'none' : (maNext(r)[2] || 'ok');   // ปกติ · ใกล้ครบ · เลยกำหนด · ยังไม่มีข้อมูล
const MA_STATE = { ok: ['ปกติ', 'success'], near: ['ใกล้ครบกำหนด', 'warning'], over: ['เลยกำหนด', 'error'], none: ['ยังไม่มีข้อมูล', 'gray'] };
const MA_OILRES = [['ผ่าน', 'success'], ['ไม่ผ่าน', 'error'], ['รอผลตรวจ', 'warning'], ['ยังไม่ตรวจ', 'gray']];
const MA_AGE_GROUPS = [['0–5 ปี', 0, 5], ['6–10 ปี', 6, 10], ['11–15 ปี', 11, 15], ['มากกว่า 15 ปี', 16, 999]];
const TH_MON = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const maOilDue = (r) => r[1] ? maDues(r)[2] : null;   // [วันครบเปลี่ยนน้ำมันไฮดรอลิก, สถานะ]
const maDays = (s) => Math.round((maDate(s) - MA_NOW()) / 864e5);
const MA_ALERT = {   // เรื่องที่ควรดู — นับจากยานพาหนะทุกคัน (ไม่ขึ้นกับตัวกรอง) · กดแล้วกรองทั้งหน้าตามเรื่องนั้น
  over: maIdx(r => maState(r) === 'over'),
  oil30: maIdx(r => { const d = maOilDue(r); return d && maDays(d[0]) >= 0 && maDays(d[0]) <= 30; }),
  fail: maIdx(r => r[6] === 'ไม่ผ่าน'),
  none: maIdx(r => !r[1])
};
const maPlates = (ix) => ix.map(i => TRIP_CARS[MA_ROWS[i][0]][0]).join(' · ');
function maStats(ix) {
  const R = ix.map(i => MA_ROWS[i]), n = (fn) => R.filter(fn).length;
  return { total: R.length, doneYear: n(r => r[1] && maD(r[1])[2] === MA_TODAY[2]), near: n(r => maState(r) === 'near'), over: n(r => maState(r) === 'over'),
    oilYear: n(r => r[1] && maD(maOilDue(r)[0])[2] <= MA_TODAY[2]), age: R.length ? (ix.reduce((a, i) => a + maAge(i), 0) / R.length).toFixed(1) : '-' };
}
async function maList(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'ข้อมูลยานพาหนะ', root: 'ยานพาหนะ' });
  const W = dashW(scr), all = MA_ROWS.map((r, i) => i), ix = o.chips && o.rows ? o.rows : all, R = ix.map(i => MA_ROWS[i]), st = maStats(ix);
  add(page, await maTabs(), 'h');
  add(page, await dashHead({ title: 'แดชบอร์ดการบำรุงรักษา', icon: 'car_repair-24-300-round',
    desc: 'ยานพาหนะที่ติดตั้งเครื่องมือกล แยกตามสังกัด ประเภท และกำหนดบำรุงรักษาครั้งถัดไป — คลิกกราฟหรือรายการเพื่อกรองทั้งหน้า' }), 'h');
  const al = await dashAlerts([
    { key: 'over', n: MA_ALERT.over.length, icon: 'event_busy-24-300-round', title: 'เลยกำหนดบำรุงรักษา ' + MA_ALERT.over.length + ' คัน', sub: maPlates(MA_ALERT.over) + ' — ครั้งถัดไปเลยวันครบกำหนดแล้ว ควรจัดเข้าแผนไตรมาสถัดไป' },
    { key: 'oil30', n: MA_ALERT.oil30.length, icon: 'calendar_month-24-300-round', title: 'ครบกำหนดเปลี่ยนน้ำมันไฮดรอลิกภายใน 30 วัน ' + MA_ALERT.oil30.length + ' คัน', sub: maPlates(MA_ALERT.oil30) + ' — ครบรอบ 3 ปีหลังเปลี่ยนครั้งล่าสุด' },
    { key: 'fail', n: MA_ALERT.fail.length, icon: 'search_check-24-300-round', title: 'ผลตรวจน้ำมันล่าสุดไม่ผ่าน ' + MA_ALERT.fail.length + ' คัน', sub: maPlates(MA_ALERT.fail) + ' — ผลตรวจตัวอย่างน้ำมันไฮดรอลิกครั้งล่าสุดไม่ผ่าน ควรเปลี่ยนก่อนครบรอบ' },
    { key: 'none', tone: 'info', n: MA_ALERT.none.length, icon: 'description-24-300-round', title: 'ยังไม่มีข้อมูลบำรุงรักษาล่าสุด ' + MA_ALERT.none.length + ' คัน', sub: maPlates(MA_ALERT.none) + ' — ยังไม่มีงานบำรุงรักษาที่ปิดในระบบ คำนวณครั้งถัดไปไม่ได้' }], o.alert);
  if (al) add(page, al, 'h');
  const ch = await dashChips(o.chips); if (ch) add(page, ch, 'h');
  add(page, await dashKpis([
    { label: 'ยานพาหนะทั้งหมด', value: st.total, unit: 'คัน', sub: o.chips ? 'ตามตัวกรองที่เลือก' : 'ทุกสังกัด', tone: 'brand', icon: 'car_repair-24-300-round' },
    { label: 'บำรุงรักษาแล้วในปี ' + MA_TODAY[2], value: st.doneYear, unit: 'คัน', sub: dPct(st.doneYear, st.total) + ' ของทั้งหมด', tone: 'success', icon: 'check-24-300-round' },
    { label: 'ใกล้ครบกำหนด', value: st.near, unit: 'คัน', sub: 'เหลือไม่เกิน ' + MA_NEAR + ' เดือน', tone: 'warning', icon: 'calendar_month-24-300-round' },
    { label: 'เลยกำหนด', value: st.over, unit: 'คัน', sub: 'ครั้งถัดไปเลยวันครบกำหนด', tone: 'error', icon: 'event_busy-24-300-round' },
    { label: 'ครบเปลี่ยนน้ำมันไฮดรอลิกในปีนี้', value: st.oilYear, unit: 'คัน', sub: 'ภายในปี ' + MA_TODAY[2] + ' รวมที่เลยกำหนด', tone: 'info', icon: 'search_check-24-300-round' },
    { label: 'อายุการใช้งานเฉลี่ย', value: st.age, unit: 'ปี', sub: 'นับจากปีที่จดทะเบียน', tone: 'gray', icon: 'no_crash-24-300-round' }]), 'h');
  /* กราฟ 6 ใบ (คิดจากยานพาหนะตามตัวกรอง) — มือถือ: จอมุมมองมือถือแสดงครบ · จออื่นแสดงเฉพาะกราฟที่กด */
  const count = (keyOf) => { const m = new Map(); R.forEach(r => { const k = keyOf(r); m.set(k, (m.get(k) || 0) + 1); }); return [...m].sort((a, b) => b[1] - a[1]); };
  const dueN = (keyOf, k) => R.filter(r => keyOf(r) === k && /near|over/.test(maState(r))).length;
  const t0 = MA_TODAY[2] * 12 + MA_TODAY[1] - 1, mIdx = (s) => { const [, m, y] = maD(s); return y * 12 + m - 1 - t0; };
  const months = [...Array(12)].map((_, i) => { const k = t0 + i; return { label: TH_MON[k % 12] + ' ' + String(Math.floor(k / 12)).slice(2), vals: [0, 0] }; });
  let past = 0;
  R.filter(r => r[1]).forEach(r => { const d = maDues(r); [[d[0], 0], [d[2], 1]].forEach(([x, s]) => { const k = mIdx(x[0]); if (k < 0) past++; else if (k < 12) months[k].vals[s]++; }); });
  const specs = [
    { key: 'unit', span: 2, title: 'ยานพาหนะตามสังกัด', sub: 'แยกตามหน่วยงานเจ้าของยานพาหนะ (ทั้งหมด ' + st.total + ' คัน)', icon: 'groups-24-300-round', toggle: [['หน่วยงาน', 'เขต'], 0], src: 'ข้อมูลจากทะเบียนยานพาหนะ',
      build: async (w) => [await hBars(w, count(maUnit).map(([k, v]) => ({ label: k, value: v, unit: 'คัน', sub: dueN(maUnit, k) ? 'ใกล้ครบหรือเลยกำหนด ' + dueN(maUnit, k) + ' คัน' : '' })))] },
    { key: 'status', span: 1, title: 'สถานะกำหนดบำรุงรักษา', sub: 'ตามครั้งถัดไปของแต่ละคัน', icon: 'event_busy-24-300-round', color: 'Warning', src: 'ข้อมูลจากงานบำรุงรักษาที่ปิดแล้ว',
      build: async (w) => donut(w, Object.keys(MA_STATE).map(k => ({ label: MA_STATE[k][0], tone: MA_STATE[k][1], value: R.filter(r => maState(r) === k).length })), { unit: 'คัน', heads: ['สถานะ', 'จำนวน (คัน)'] }) },
    { key: 'month', span: 2, title: 'กำหนดบำรุงรักษา 12 เดือนข้างหน้า', sub: 'จำนวนรายการที่ครบกำหนดในแต่ละเดือน' + (past ? ' · ไม่รวมที่เลยกำหนดแล้ว ' + past + ' รายการ' : ''), icon: 'calendar_month-24-300-round', src: 'ข้อมูลจากเกณฑ์ครั้งถัดไป (รอบบำรุงรักษา 12 เดือน · เปลี่ยนน้ำมันทุก 3 ปี)',
      build: async (w) => vBars(w, months, [{ label: 'บำรุงรักษาตามวาระ', tone: 'brand' }, { label: 'เปลี่ยนน้ำมันไฮดรอลิก', tone: 'info' }]) },
    { key: 'oil', span: 1, title: 'ผลตรวจน้ำมันล่าสุด', sub: 'ผลตรวจตัวอย่างน้ำมันไฮดรอลิกครั้งล่าสุด', icon: 'search_check-24-300-round', color: 'Info', src: 'ข้อมูลจากผลตรวจน้ำมัน',
      build: async (w) => donut(w, MA_OILRES.map(([l, k]) => ({ label: l, tone: k, value: R.filter(r => (r[6] || 'ยังไม่ตรวจ') === l).length })), { unit: 'คัน', heads: ['ผลตรวจ', 'จำนวน (คัน)'] }) },
    { key: 'age', span: 2, title: 'อายุการใช้งานของยานพาหนะ', sub: 'แบ่งกลุ่มตามอายุนับจากปีที่จดทะเบียน', icon: 'no_crash-24-300-round', color: 'Gray', src: 'ข้อมูลจากทะเบียนยานพาหนะ',
      build: async (w) => { const g = MA_AGE_GROUPS.map(([l, a, b]) => ({ label: l, value: ix.filter(i => maAge(i) >= a && maAge(i) <= b).length }));
        return (await vBars(w, g.map(x => ({ label: x.label, vals: [x.value] })), [{ label: 'ยานพาหนะ', tone: 'info' }], { h: 140 })).concat([await dLegend(g, ['กลุ่มอายุ', 'จำนวน (คัน)'], { total: true })]); } },
    { key: 'type', span: 1, title: 'ตามประเภทยานพาหนะ', sub: VTYPES.length + ' ประเภท', icon: 'car_repair-24-300-round', color: 'Success', src: 'ข้อมูลจากทะเบียนยานพาหนะ',
      build: async (w) => [await hBars(w, count(r => typeOf(TRIP_CARS[r[0]])).map(([k, v]) => ({ label: k, value: v, unit: 'คัน' })))] }];
  add(page, await chartGrid(W, MOB && !o.mobileAll ? specs.filter(s => s.key === o.pickChart) : specs), 'h');
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tableHeader({ placeholder: 'เลขทะเบียน, ยี่ห้อ, รุ่น', query: o.query, chips: o.chips, filterCount: (o.chips || []).length || null, more: [{ text: 'ส่งออก', icon: 'download-24-300-round' }] }), 'h');
  const rows = (o.rows || all).map(i => maRow(MA_ROWS[i]));
  add(sec, rows.length ? await tblShort(sortAll(MA_COLS), rows, { pagination: rows.length }) : await searchNotFound(), 'h');
  add(page, await dashNote('ข้อมูลจากงานบำรุงรักษาที่ปิดแล้วและผลตรวจน้ำมันล่าสุดของยานพาหนะทุกคัน ณ ' + dashAsof().slice(9) + ' · ใกล้ครบกำหนด = เหลือไม่เกิน ' + MA_NEAR + ' เดือน · ตัวเลขทุกส่วนคำนวณตามตัวกรองที่เลือก'), 'h');
  await bindDash();
  if (o.filter) {
    const f = o.filter;
    await filterPanel(scr, [multiDropdown('ประเภทยานพาหนะ', f.types || [], { placeholder: 'ทั้งหมด', optional: true }), multiDropdown('สังกัดยานพาหนะ', f.units || [], { placeholder: 'ทั้งหมด', optional: true }),
      dropdown('บำรุงรักษาล่าสุด', f.last || 'ทั้งหมด'), dropdown('ครบกำหนดภายใน', f.within || 'ทั้งหมด'),
      multiDropdown('รายการที่ครบกำหนด', f.items || [], { placeholder: 'ทั้งหมด', optional: true }), dropdown('ผลตรวจน้ำมันล่าสุด', f.oil || 'ทั้งหมด')]);
  }
  return scr;
}
const MA_LAST_OPTS = ['ทั้งหมด', 'ภายใน 6 เดือน', '6 ถึง 12 เดือนที่แล้ว', 'เกิน 12 เดือน', 'ยังไม่เคยบำรุงรักษา'];   // ตัวเลือกช่อง "บำรุงรักษาล่าสุด" (เสนอ)
const MA_WITHIN_OPTS = ['ทั้งหมด', 'เลยกำหนดแล้ว', 'ภายใน 1 เดือน', 'ภายใน 3 เดือน', 'ภายใน 6 เดือน'];
/* หน้ารายละเอียดยานพาหนะ 5 แท็บ (10 พ.ย. 2569 · R90) ปรับ 12 พ.ย. 2569 ตามต้นแบบเว็บที่เจ้าของงานรีวิวแล้ว (maintenance-utility-vehicle f6f5e0d · BACKLOG ข้อ 83 84 85 · R107 §5.45)
   เจ้าของงาน 12 พ.ย. 2569 _"tab นี้ มีเพิ่ม โดยแบ่ง ประวัติการบำรุงรักษาเครื่องจักร ประวัติการบำรุงรักษาเครื่องยนต์ ประวัติการซ่อมบำรุงจะแสดงทั้งการซ่อมและบำรุง ตัดtab การรับประกัน
   เดี๋ยวจะเอาข้อมูลไปใส่ในข้อมูลรถ และ tab overhaul ก็เอาออก ให้เป็นส่วนหนึ่งของประวัติการซ่อมบำรุง โดยมีแทกว่าเป็นการ overhaul ถ้าการซ่อมนั้นผ่านการ overhaul มา"_
   ⇒ Tabs 5 ช่อง ข้อมูลยานพาหนะ · ตารางบำรุงรักษา · ประวัติการบำรุงรักษาเครื่องจักร · ประวัติการบำรุงรักษาเครื่องยนต์ · ประวัติการซ่อมบำรุง (ไม่มีแท็บการรับประกัน · Overhaul)
   ตาม `Tabs` `Tab item` ของไฟล์ Component + เฟรม "Vehicle info" (Vehicle detail) หน้า 5.2 Vehicle Management ของ UI Release#2 · ดูอย่างเดียว ยกเว้นเครื่องมือกลของ กบค. */
const MA_CAR = 5;   // แถวใน MA_ROWS = 82-1145 (TRIP_CARS[1]) ใกล้ครบรอบเปลี่ยนน้ำมันไฮดรอลิก
const MA_VTABS = ['ข้อมูลยานพาหนะ', 'ตารางบำรุงรักษา', 'ประวัติการบำรุงรักษาเครื่องจักร', 'ประวัติการบำรุงรักษาเครื่องยนต์', 'ประวัติการซ่อมบำรุง'];   // = TAB_TITLES ของเว็บ (_lib/tabs.ts)
const MA_NEXT_COLS = [['รายการ', 0, 'Lead text'], ['ครั้งล่าสุด', 220], ['รอบ', 220], ['ครบกำหนด', 320]];
const maNextRows = (r) => { const d = maDues(r), last = [r[1], r[3], r[4], maKey(r[5]) > maKey(r[4]) ? r[5] + ' · ผล ' + r[6] : r[4], r[7]];
  return MA_ITEMS.map((t, i) => [t, last[i], MA_CYCLE[i], d[i] ? Object.assign({ text: d[i][0] }, toneOf(d[i][1])) : { text: 'ปีนี้ครบรอบเปลี่ยนน้ำมัน ไม่ต้องเก็บตัวอย่าง' }]); };
const MA_HIST_COLS = [['วันที่ปิดงาน', 130, 'Lead text'], ['เลขที่ MR', 140], ['งานที่ทำ', 0], ['ไส้กรองอากาศ', 130], ['น้ำมันไฮดรอลิก', 180], ['การตรวจ ปจ.2', 150], ['ผู้ดำเนินการ', 170], ['', 64]];   // = MA_HIST_COLS ของเว็บ (vehicles/detail/page.tsx · คอลัมน์ "การตรวจ ปจ.2" 11 พ.ย. 2569)
const MA_HIST = [['18/06/2569', 'MRZ6900014', 'เปลี่ยนไส้กรองไฮดรอลิก · ไส้กรองอากาศ', 'เปลี่ยน', { text: 'เก็บตัวอย่าง', sub: 'ผลตรวจ ผ่าน' }, 'บันทึกเอกสารแล้ว', TRIP.staff[0]],
  ['20/06/2568', 'MRZ6800007', 'เปลี่ยนไส้กรองไฮดรอลิก · ไส้กรองอากาศ', 'เปลี่ยน', { text: 'เก็บตัวอย่าง', sub: 'ผลตรวจ ผ่าน' }, 'บันทึกเอกสารแล้ว', TRIP.staff[2]],
  ['12/03/2567', 'MRZ6700004', 'เปลี่ยนน้ำมันไฮดรอลิก · ไส้กรอง', 'เปลี่ยน', { text: 'เปลี่ยนน้ำมัน' }, 'บันทึกเอกสารแล้ว', TRIP.staff[1]]].map(r => r.concat([{ menu: 1, items: MENU.slice(0, 1) }]));
const MA_WAR = { in: ['อยู่ในประกัน', 'Success'], near: ['ใกล้หมดประกัน', 'Warning'], out: ['หมดประกัน', 'Gray'], none: ['ไม่มีประกัน', 'Gray'] };
/* งานซ่อมของ 82-1145 (แบบ VEH_HISTORY ของปลั๊กอิน Overhaul) — [หมายเลขงาน, วันที่ปิดงาน, ศูนย์บริการ, ประเภท, บรรทัดรองประเภท, อาการ, รายละเอียด, ประกัน, ค่าซ่อม] · ชุดเดียวกับ MA_REPAIRS ของเว็บ
   แถวบำรุงรักษา MA-2569-0102 ซ้ำกับบันทึก 18/06/2569 ⇒ ประวัติการซ่อมบำรุงใช้บันทึก (MA_HIST) แทน แบบเว็บ (machineHistoryOf) */
const MA_REPAIRS = [['RP-2569-0611', '02/09/2569', 'อู่ ศรีเมืองการช่าง', 'รถเสีย', '', 'บูมยกช้า', 'เปลี่ยนปั๊มไฮดรอลิก', 'in', '28,400'],
  ['MA-2569-0102', '18/06/2569', 'กบผ.', 'บำรุงรักษา', 'ตามวาระ MRZ6900014', 'ตรวจตามรอบ', 'เปลี่ยนไส้กรองไฮดรอลิก · ไส้กรองอากาศ', 'none', '-'],
  ['PO-680412', '15/12/2568', 'บริษัท สยามไฮดรอลิก จำกัด', 'Overhaul', 'แผน ORZ6800003', 'ยกเครื่องตามแผน', 'ไฮดรอลิกกระเช้า · เครื่องยนต์', 'in', '-'],
  ['RP-2568-0877', '03/08/2568', 'กรย. ภาค 1', 'อุบัติเหตุ', '', 'กันชนหน้าบุบ', 'เปลี่ยนกันชนหน้า', 'out', '6,500']];
/* การรับประกัน — รวมทุกงานที่มีประกันของผู้รับจ้าง (ซ่อม · Overhaul R28 90/180/360/720 วัน · บำรุงรักษาแผนจ้าง) · 12 พ.ย. 2569 ย้ายจากแท็บการรับประกันมาเป็นส่วนท้ายแท็บข้อมูลยานพาหนะ (มีเฉพาะ 82-1145 แบบ warrantyOf ของเว็บ) */
const MA_WAR_COLS = [['ประเภทงาน', 140, 'Lead text'], ['เลขที่งาน / PO', 150], ['ผู้รับจ้าง', 0], ['รายการที่รับประกัน', 220], ['วันเริ่ม', 120], ['วันหมดอายุ', 170], ['สถานะ', 150, 'Badge']];
const MA_WARRANTY = [['ซ่อม', 'RP-2569-0611', 'อู่ ศรีเมืองการช่าง', 'ปั๊มไฮดรอลิก', '02/09/2569', { text: '01/03/2570', sub: 'เหลือ 111 วัน' }, { pill: MA_WAR.in }],
  ['Overhaul', 'PO-680412', 'บริษัท สยามไฮดรอลิก จำกัด', 'ไฮดรอลิกกระเช้า · เครื่องยนต์', '15/12/2568', { text: '10/12/2569', sub: 'เหลือ 30 วัน' }, { pill: MA_WAR.near }],
  ['ซ่อม', 'RP-2568-0877', 'กรย. ภาค 1', 'กันชนหน้า', '03/08/2568', { text: '01/11/2568' }, { pill: MA_WAR.out }]];

/* ---------- แท็บข้อมูลยานพาหนะแบบ Vehicle info ของ VMS+ (เจ้าของงาน 12 พ.ย. 2569 _"หน้าข้อมูลยานพาหนะ อยากให้อ่าน vehicle-management component แล้วเอามาแสดง"_ · R107) ----------
   ค่าทุกช่องคิดแบบเดียวกับ vehicleInfoOf() ของเว็บ (src/lib/mock/vehicleInfo.ts) จากข้อมูลเดิมของปลั๊กอิน (TRIP_CARS · MA_USE · CTRL_NAME · OWNER_PH) ⇒ ทะเบียนเดียวกันได้ค่าเท่ากับเว็บ
   ค่าที่ข้อมูลจำลองไม่มี = ค่าสมมติคำนวณจากเลขทะเบียน (เลขสัญญา ศูนย์ต้นทุน เลขตัวยานพาหนะ บัตรเติมน้ำมัน ฯลฯ) · ข้อมูลจาก API ของ VMS+ คงคำว่า "รถ" (R80 allow) */
const VI_CHASSIS = {   // สเปกแชสซีตามรุ่น (ค่าสมมติ · CHASSIS ของเว็บ) — [แรงม้า, เพลา, ล้อ, ยาง, ราคา, ขึ้นต้นเลขตัว, ขึ้นต้นเลขเครื่องยนต์]
  'Isuzu FRR': [190, 2, 6, 6, 2850000, 'MP1FRR34', '4HK1-'], 'Isuzu FTR': [240, 2, 6, 6, 3450000, 'MP1FTR34', '6HK1-'],
  'Hino FC': [175, 2, 6, 6, 3200000, 'JHHFC9JL', 'J05E-'], 'Hino FG': [230, 2, 6, 6, 3900000, 'JHHFG8JL', 'J08E-'], 'Hino FM': [260, 3, 10, 10, 4600000, 'JHHFM2PL', 'J08E-'] };
const viPad = (n, w) => String(n).padStart(w, '0');
const viId = (plate) => plate.split(' ')[0];
const viDigits = (plate) => viId(plate).replace(/\D/g, '').padStart(6, '0').slice(-6);   // ชุดเดียวกับรหัสทรัพย์สิน 500000 + 6 หลัก
const viNum = (n) => n.toLocaleString('en-US');
/* รหัสข้างยานพาหนะ (sideCodeOf ของเว็บ · vehicleTypes.ts) — 81-2210 = 04 (ในกลุ่ม ยังไม่มีเครื่องมือกล) · 80-4458 = 06 (นอกกลุ่ม) · กระเช้าอื่น = 09
   กลุ่มที่มีส่วนเครื่องมือกล 04 07 08 09 10 (เจ้าของงาน "กลุ่มรหัสข้างรถ เลข 04, 07, 08, 09, 10 จะสามารถเพิ่มเครื่องมือกลได้ ถ้ามีข้อมูลต้องสามารถแก้ไขได้" · BACKLOG ข้อ 68ก) */
const VI_SIDE = { '81-2210': '04', '80-4458': '06' }, VI_EQUIP = ['04', '07', '08', '09', '10'], VI_PREFILL = ['09', '08', '10'];
const viSide = (c) => VI_SIDE[viId(c[0])] || (/กระเช้า/.test(c[1]) ? '09' : '06');
const viMachine = (model) => { const [vehicle, rest] = model.split(' + '); const m = rest && rest.match(/^\S*[฀-๿]\S*\s+([A-Za-z][\w.-]*)\s+(.+)$/); return { vehicle, brand: m ? m[1] : '-', model: m ? m[2] : (rest || '-') }; };
const viMonths = (k) => { const t = (MA_TODAY[2] - 543) * 12 + MA_TODAY[1] - 1 + k; return viPad(MA_TODAY[0], 2) + '/' + viPad(t % 12 + 1, 2) + '/' + (Math.floor(t / 12) + 543); };   // addMonths(TODAY, k) ของเว็บ
function vInfo(row) {
  const c = TRIP_CARS[MA_ROWS[row][0]], u = MA_USE[row], d = viDigits(c[0]), n = Number(d), year = u[0];
  const spec = VI_CHASSIS[viMachine(c[1]).vehicle] || [180, 2, 6, 6, 3000000, 'MP1XXX34', 'ENG-'];
  const [brand, ...rest] = c[1].split(' '), dist = c[2].split(' ')[0], prefix = dist.indexOf('กฟ') === 0 ? dist.slice(2) : dist;
  const reg = /^[นฉกต]\./.test(prefix) ? { น: 'N', ฉ: 'E', ก: 'C', ต: 'S' }[prefix[0]] : 'A', regNo = Number(prefix.replace(/\D/g, '')) || 0;
  const type = typeOf(c), water = /ฉีดน้ำ/.test(c[1]);
  return { c, d, n, type, side: viSide(c), vstat: MA_VSTAT[u[4]],
    general: [[['หมวดหมู่ยานพาหนะหลัก', 'รถบรรทุกขนาดใหญ่'], ['หมวดหมู่ยานพาหนะย่อย', water ? 'รถพ่วงฉีดน้ำ' : 'รถกระเช้า']], [['ประเภทยานพาหนะหลัก', type], ['ประเภทยานพาหนะย่อย', type]],
      [['ลักษณะการใช้งาน', 'รถส่วนกลาง'], ['ประเภทเกียร์', 'ธรรมดา']], [['หมายเหตุ', '-']]],
    finance: [[['เลขที่สัญญา', 'สญ2-จซ-' + viPad(1 + (n % 200), 3) + '-' + (year - 1)]], [['งวดที่ส่งมอบ', 'งวดที่ ' + (1 + (n % 3))]], [['มูลค่ายานพาหนะ', viNum(spec[4]) + '.00']]].map(items => ({ items, half: true })),
    dept: [[['สังกัดยานพาหนะ', c[2]], ['รหัสข้างยานพาหนะ', prefix + '-' + viSide(c) + '-' + d.slice(-4)]], [['ผู้ดูแลยานพาหนะ', CTRL_NAME[MA_ROWS[row][0]]], ['เบอร์ติดต่อ', OWNER_PH[MA_ROWS[row][0]]]],
      [['ศูนย์ต้นทุน', 'Z' + reg + viPad(regNo, 2) + '010100 : ' + dist + '-บห.'], ['รหัสประเภทธุรกิจ (BA)', reg + viPad(regNo, 2) + '0']], [['รหัสทรัพย์สิน', '500000' + d], ['วันที่ได้รับยานพาหนะ', viPad(1 + (n % 28), 2) + '/' + viPad(1 + (n % 12), 2) + '/' + year]],
      [['ประเภททรัพย์สิน', 'Z6020 : ยานพาหนะ'], ['ประเภทย่อยทรัพย์สิน', '602004 : ' + type + ' - ซื้อ']], [['ใช้งานอยู่ในกลุ่มยานพาหนะ', 'ไม่ใช่'], ['หน่วยงานอื่นสามารถขอใช้งานได้', 'ไม่ได้']]].map(items => ({ items })),
    reg: [{ half: true, items: [['ประเภทยานพาหนะ', 'รถยนต์บรรทุกส่วนบุคคล (รย.3)']] }, { items: [['ยี่ห้อยานพาหนะ', brand], ['แบบ / รุ่น', rest.join(' ')], ['รุ่นปี ค.ศ.', String(year - 543)], ['สี', 'ขาว']] },
      { items: [['เลขตัวยานพาหนะ', spec[5] + 'H' + viPad(n % 10000000, 7)], ['ตำแหน่งเลขตัวยานพาหนะ', 'โครงคัสซีด้านหน้าขวา']] }, { items: [['เลขเครื่องยนต์', spec[6] + viPad((n * 7) % 1000000, 6)], ['ตำแหน่งเลขเครื่องยนต์', 'ข้างเสื้อสูบด้านซ้าย']] },
      { half: true, items: [['ประเภทเชื้อเพลิง', 'ดีเซล']] }, { items: [['ขนาดแรงม้า', String(spec[0])], ['จำนวนเพลา', String(spec[1])], ['จำนวนล้อ', String(spec[2])], ['จำนวนยาง', String(spec[3])]] },
      { items: [['ปีที่จดทะเบียน', String(year)], ['อายุการใช้งาน', (MA_TODAY[2] - year) + ' ปี']] }],   // ปีที่จดทะเบียน · อายุการใช้งาน = ของเรา (VMS+ ไม่มีช่องนี้)
    file: ['เล่มทะเบียน_' + viId(c[0]) + '.pdf', (160 + (n % 120)) + ' KB'],
    fleet: { number: '4030 5263 ' + d.slice(-4) + ' ' + viPad((n * 7) % 10000, 4), dates: 'ใช้ได้ตั้งแต่ 01/10/2567 | ใช้ได้ถึง 30/09/2572', bank: 'KTB', limit: 'วงเงินบัตร 60,000.00' },
    usage: [['swap_driving_apps_wheel-24-300-round', 'เลขไมล์', u[1] + ' กม.'], ['schedule-24-300-round', 'ชั่วโมงเครื่องจักรสะสม', u[2] + ' ชม.'],   // ชั่วโมงเครื่องจักรสะสม = ของเรา (VMS+ ไม่มีแถวนี้)
      ['local_gas_station-24-300-round-filled', 'ปริมาณเชื้อเพลิง', (40 + (n % 60)) + '%'], ['local_car_wash-24-300-round', 'ความสะอาด', ['ดูดฝุ่น', 'ล้างภายนอก', 'ล้างภายนอกและดูดฝุ่น'][n % 3]],
      ['local_parking-24-fill-300-round', 'สถานที่จอดยานพาหนะ', 'ลานจอด สำนักงาน ' + c[2]]] };
}
/* เครื่องมือกล (machines.ts ของเว็บ · BACKLOG ข้อ 68 72 73 84) — ค่าตั้งต้น 1 เครื่องจาก ยี่ห้อ/รุ่น ของยานพาหนะ เฉพาะรหัสข้าง 09 08 10 (04 07 เริ่มว่าง) · ชั่วโมงตาม CAND ของเว็บ (ค่าสมมติ) */
const VI_HOURS = { '80-5738': [7280, 3440], '80-3316': [3085, 2155], '80-9981': [2291, 1733], '82-7720': [2688, 1944], '82-1145': [2397, 1011], '81-6604': [3482, 2366], '82-6789': [2000, 800] };
const VI_NO_LIFT = ['ถังฉีดน้ำ', 'อื่นๆ'];
function vMachines(v) {
  if (VI_EQUIP.indexOf(v.side) < 0 || VI_PREFILL.indexOf(v.side) < 0) return [];
  const m = viMachine(v.c[1]), type = /ถังฉีดน้ำ/.test(v.c[1]) ? 'ถังฉีดน้ำ' : /เครน/.test(v.c[1]) ? 'เครน' : /กระเช้า/.test(v.c[1]) ? 'กระเช้า' : 'อื่นๆ', h = VI_HOURS[viId(v.c[0])] || [2000, 800];
  return [{ type, brand: m.brand === '-' ? '' : m.brand, model: m.model === '-' ? '' : m.model, asset: '500000' + v.d, sub: '0001',
    lift: VI_NO_LIFT.indexOf(type) >= 0 ? null : /Tadano/.test(v.c[1]) ? 300 : 200, hc: type === 'กระเช้า' || type === 'เครน' ? 'HC - ' + v.d.slice(-4) : '', engineHours: h[0], machineHours: h[1] }];
}
/* ประวัติการบำรุงรักษาเครื่องยนต์ (engineHistoryOf ของเว็บ · เช็คระยะแชสซีที่ศูนย์บริการยี่ห้อ ค่าสมมติ) — ทุก 6 เดือนย้อนจากวันนี้ · จำนวนครั้ง = อายุการใช้งาน (สูงสุด 4) */
const VI_ENGINE_WORK = ['เปลี่ยนน้ำมันเครื่อง · ไส้กรองน้ำมันเครื่อง', 'เปลี่ยนน้ำมันเครื่อง · ไส้กรองน้ำมันเครื่อง · ไส้กรองน้ำมันเชื้อเพลิง'];
function vEngine(row) {
  const v = vInfo(row), year = MA_USE[row][0], km = Number(MA_USE[row][1].replace(/,/g, '')), count = Math.max(1, Math.min(4, MA_TODAY[2] - year));
  return Array.from({ length: count }, (_, i) => { const date = viMonths(-(1 + (v.n % 4)) - 6 * i);
    return { no: 'EG-' + date.slice(6) + '-' + viPad((v.n + i * 37) % 10000, 4), date, center: 'ศูนย์บริการ ' + v.c[1].split(' ')[0] + ' ' + v.c[0].split(' ').slice(1).join(' '),
      work: VI_ENGINE_WORK[i % 2], km: viNum(Math.max(0, km - 2000 - (v.n % 3000) - i * 10000)), cost: viNum(i % 2 ? 6850 : 4200) }; });
}
const VI_ENGINE_COLS = [['วันที่ปิดงาน', 130, 'Lead text'], ['เลขที่งาน', 150], ['ศูนย์บริการ', 220], ['งานที่ทำ', 0], ['เลขไมล์ (กม.)', 130], ['ค่าใช้จ่าย (บาท)', 140]];
/* ประวัติการซ่อมบำรุง (serviceHistoryOf ของเว็บ) = งานซ่อม + Overhaul + บันทึกบำรุงรักษาเครื่องจักร (MA_HIST) + บำรุงรักษาเครื่องยนต์ เรียงวันที่ปิดงานใหม่สุดก่อน
   คอลัมน์ "ประเภท" Pill outline บำรุงรักษา (Brand) / ซ่อม (Warning) + Pill "Overhaul" (Purple) ต่อท้ายเมื่องานมาจาก Overhaul (Table cell Style=Multiple badges) */
const MA_KIND = { ma: ['บำรุงรักษา', 'Brand'], repair: ['ซ่อม', 'Warning'], overhaul: ['Overhaul', 'Purple'] };
const MA_REPAIR_COLS = [['หมายเลขงาน', 160, 'Lead text'], ['วันที่ปิดงาน', 130], ['ประเภท', 140, 'Badge'], ['ศูนย์บริการ', 170], ['อาการ / รายละเอียด', 0], ['การรับประกัน', 150, 'Badge'], ['ค่าซ่อม (บาท)', 120], ['', 64]];
function vService(row) {
  const rec = MA_REPAIRS.filter(h => h[3] !== 'บำรุงรักษา').map(h => ({ kind: h[3] === 'Overhaul' ? 'overhaul' : 'repair', no: h[0], sub: h[4] || h[3], date: h[1], center: h[2], text: h[5], detail: h[6], war: h[7], cost: h[8] }))
    .concat(MA_HIST.map(h => ({ kind: 'ma', no: h[1], date: h[0], center: UNITS[0], text: 'ตรวจตามรอบ', detail: h[2], war: 'none', cost: '-' })),
      vEngine(row).map(e => ({ kind: 'ma', no: e.no, sub: 'บำรุงรักษาเครื่องยนต์', date: e.date, center: e.center, text: 'เช็คระยะตามเลขไมล์ ' + e.km + ' กม.', detail: e.work, war: 'none', cost: e.cost })));
  rec.sort((a, b) => maKey(b.date) - maKey(a.date));
  return rec.map(h => [h.sub ? { text: h.no, sub: h.sub } : h.no, h.date, { pills: h.kind === 'overhaul' ? [MA_KIND.repair, MA_KIND.overhaul] : [MA_KIND[h.kind]] }, h.center,
    h.detail ? { text: h.text, sub: h.detail } : h.text, { pill: MA_WAR[h.war] }, h.cost, { icons: ['quick_reference_all-24-300-round'] }]);
}

/* ---------- ประกอบแท็บข้อมูลยานพาหนะจากชิ้นไลบรารี (Fleet card · Last usage · Vehicle detail เป็น component ของไฟล์ UI Release#2 (remote=false) นำเข้าด้วย key ไม่ได้ ⇒ ประกอบแบบเว็บ COMPOSED.md ศ5) ---------- */
let VI_BORDER;
async function viBorder() {   // เส้นกรอบการ์ด = Color/border/secondary (#EAECF0) ของไลบรารีแบบ Fleet card / Last usage ของ UI Release#2
  if (VI_BORDER === undefined) VI_BORDER = await libVar(/^Color\/border\/secondary$/i);
  let p = { type: 'SOLID', color: rgbOf('#EAECF0') };
  if (VI_BORDER) try { p = figma.variables.setBoundVariableForPaint(p, 'color', VI_BORDER); } catch (e) { /* ใช้ค่าสี */ }
  return p;
}
async function viSubtle(f) {   // พื้นกล่องในการ์ด = Color/surface/secondary-subtle (#F9FAFB) รัศมี 8 (Content ของ Fleet card)
  let p = { type: 'SOLID', color: SURFACE_SUB }; const v = await surfaceVar();
  if (v) try { p = figma.variables.setBoundVariableForPaint(p, 'color', v); } catch (e) { /* ใช้ค่าสี */ }
  f.fills = [p]; f.cornerRadius = 8; return f;
}
async function viCard(name, dir) {   // กรอบการ์ด white ขอบ gray-200 รัศมี 16 ขอบใน 16 ช่องไฟ 16 (Fleet card · Last usage > Card ของเฟรม Vehicle info)
  const f = frame(name, dir || 'VERTICAL', { gap: 16, pad: 16, fill: WHITE });
  f.cornerRadius = 16; f.strokes = [await viBorder()]; f.strokeWeight = 1; f.strokeAlign = 'INSIDE';
  return f;
}
const viSection = (kids) => col('Section', kids, 8);   // Section label → ห่าง 8 → เนื้อหา (ทุกส่วนของเฟรม Vehicle info)
async function viBox(title, rows) {   // กล่องแสดงข้อมูล R12 (Content item row Full / 50% first column · _Content item base Text with label) · มือถือ แถวละ 2
  const box = frame('Content item', 'VERTICAL', { gap: 8 });
  for (const r of rows) for (let i = 0; i < r.items.length; i += MOB ? 2 : 4) {
    const part = r.items.slice(i, i + (MOB ? 2 : 4)), half = part.length === 1 && (MOB || r.half);
    const ci = inst('Content item row', { 'Column width': half ? '50% first column' : 'Full' });
    const bases = ci.findAll(n => n.type === 'INSTANCE' && n.name === '_Content item base');
    bases.forEach((b, j) => { if (j >= part.length) return; setProps(b, { Type: 'Text with label' }); setProps(b, { Label: part[j][0], Text: part[j][1], Supporting: false, 'Leading icon': false }); });
    setProps(ci, { 'Item 2': part.length > 1, 'Item 3': part.length > 2, 'Item 4': part.length > 3 });
    add(box, ci, 'h');
  }
  return viSection([await sectionLabel(title), box]);
}
/* แถวของการ์ด = Card item row Type=1 Row (Item 2 ปิด) · Card item base Type=Text with label · Text ชิดขวา (แบบ Last usage ของ UI Release#2)
   iconName = ไอคอนนำ (ไม่มีในไฟล์นี้ = ไม่มีไอคอน) · value = ข้อความ หรือ { add: true } = ปุ่ม Tertiary brand button "เพิ่ม" (สลับชิ้น Badge outline ของ Type=Text with label and component) */
function viCardRow(iconName, label, value) {
  const r = inst('Card item row', { Type: '1 Row' }, { 'Item 2': false });
  const b = r.children.find(c => c.type === 'INSTANCE' && c.name === 'Card item base');
  if (!b) return r;
  try { b.layoutSizingHorizontal = 'FILL'; } catch (e) { /* ตามขนาดของ component */ }
  const ico = iconName && has(iconName);
  setProps(b, { Type: value && value.add ? 'Text with label and component' : 'Text with label' });
  setProps(b, Object.assign({ Label: label, Text: value && value.add ? '' : value, Supporting: false, 'Leading icon': !!ico }, ico ? { 'Icon swap': icon(iconName) } : {}));
  const own = b.children.find(c => c.type === 'TEXT' && c.name === 'Text'), lab = b.children.find(c => c.type === 'TEXT' && c.name === 'Label');
  if (value && value.add) {
    if (own) own.visible = false;
    if (lab) try { lab.layoutGrow = 1; } catch (e) { /* ตามขนาดของ component */ }
    const slot = b.children.find(c => c.type === 'INSTANCE' && c.name === 'Badge outline');
    if (slot) try {
      slot.swapComponent(main('Tertiary brand button', { State: 'Default' })); slot.name = 'Tertiary brand button';
      setProps(slot, { Text: 'เพิ่ม', 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') });
    } catch (e) { warn('ปุ่มเพิ่มในการ์ดเครื่องมือกล', e); }
  } else if (own) try { own.textAlignHorizontal = 'RIGHT'; } catch (e) { /* ชิดซ้ายตาม component */ }
  return r;
}
/* Section label ที่มีปุ่ม Secondary button (แบบ SectionLabel Actions ของเว็บ) — สลับช่อง Secondary action (Tertiary button) ของ Section label เป็น Secondary button แบบ Table header ของ core */
async function viLabelWithButton(title, label, size) {
  const sl = await sectionLabel(title, { buttons: [{ kind: 'Secondary', text: label, icon: 'add-24-300-round' }] });
  const tb = sl.findAll(n => n.type === 'INSTANCE' && n.name === 'Tertiary button')[0];
  if (tb) try { tb.swapComponent(main('Secondary button', { State: 'Default', Size: size || 'md' })); tb.name = 'Secondary button';
    setProps(tb, { Text: label, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') }); } catch (e) { warn('ปุ่มเพิ่มเครื่องมือกล', e); }
  return sl;
}
/* ส่วนเครื่องมือกล (เจ้าของงาน 12 พ.ย. 2569 _"ส่วน section ของการเพิ่มเครื่องจักร อยากให้เป็น คล้ายๆ การ์ด ในcomponent 1 การ์ด แล้วข้อมูลข้างใน ถ้ามีข้อมูลจาก api ก็แสดง
   ถ้าไม่มี ก็ให้เป็นข้อมูลที่สามารถเพิ่มได้ และที่ แสดง ก็สามารถแก้ไขได้"_) — MachineSection.tsx ของเว็บ
   การ์ด 1 ใบต่อเครื่อง = กรอบแบบ Last usage + Section label (ชื่อ · Supporting text รหัสทรัพย์สิน · Primary action "แก้ไข") + Card item row 11 แถว
   ช่องว่าง: กบค. = ปุ่ม "เพิ่ม" · บทบาทอื่น "-" · พิกัดยกของถังฉีดน้ำ/อื่นๆ = "-" · ยังไม่มีเครื่อง = การ์ดว่างแบบ Fleet card Status=Empty · แก้ได้เฉพาะ กบค. (kbk) */
async function viMachines(v, kbk) {
  const list = vMachines(v);
  const head = kbk && list.length ? await viLabelWithButton('เครื่องมือกล (' + list.length + ')', 'เพิ่มเครื่องมือกล') : await sectionLabel('เครื่องมือกล', { badge: list.length });
  const kids = [head];
  if (!list.length) {
    const card = await viCard('Machine card'), box = await viSubtle(frame('Content', MOB ? 'VERTICAL' : 'HORIZONTAL', { gap: 12, pad: [12, 16] }));
    const sl = await sectionLabel('ไม่มีเครื่องมือกล'); setProps(sl, { Supporting: true, 'Supporting text': 'ยานพาหนะคันนี้ยังไม่มีข้อมูลเครื่องมือกล' });
    add(box, sl, 'h'); box.counterAxisAlignItems = 'CENTER';
    if (kbk) { const b = btn('Secondary button', 'เพิ่มเครื่องมือกล', { icon: 'add-24-300-round', size: 'lg' }); box.appendChild(b); if (MOB) b.layoutSizingHorizontal = 'FILL'; }
    add(card, box, 'h'); kids.push(card);
  }
  for (const x of list) {
    const name = [x.type, x.brand, x.model].filter(Boolean).join(' ');
    const card = await viCard('Machine card');
    const sl = await sectionLabel(name || 'เครื่องมือกล', { buttons: kbk ? [{ kind: 'Primary button', text: 'แก้ไข' }] : [] });
    setProps(sl, { Supporting: true, 'Supporting text': 'รหัสทรัพย์สิน ' + x.asset + ' - ' + x.sub });
    add(card, sl, 'h');
    const fields = [['ประเภทเครื่องมือกล', x.type], ['ยี่ห้อ', x.brand], ['รุ่น', x.model], ['พิกัดยก (กก.)', x.lift != null ? viNum(x.lift) : '', x.lift == null],
      ['รหัสทรัพย์สิน', x.asset], ['รหัสทรัพย์สินย่อย', x.sub], ['ชั่วโมงเครื่องยนต์', viNum(x.engineHours)], ['ชั่วโมงเครื่องจักร', viNum(x.machineHours)],
      ['หมายเลข HC', x.hc], ['หมายเลขประจำเครื่องจักร (Serial No.)', ''], ['หมายเลขเครื่องยนต์ (ส่วนเครื่องจักร)', '']];   // Serial No. · เลขเครื่องยนต์ของเครื่องจักร แมปจากฐานข้อมูลไม่ได้ ค่าตั้งต้นว่าง
    for (const [label, val, na] of fields) add(card, viCardRow(null, label, val ? val : na || !kbk ? '-' : { add: true }), 'h');
    kids.push(card);
  }
  return viSection(kids);
}
/* popup เพิ่ม/แก้ไขเครื่องมือกล (12 พ.ย. 2569 · R107) — MachineModal ของเว็บ (src/app/vehicles/_lib/MachineSection.tsx) ช่อง ป้าย placeholder ข้อความ error ลำดับตรงตัว
   ตาม popupModal() ของปลั๊กอิน (Background overlay + Modal header Alignment=Left หัว + ทะเบียนเป็น Supporting text + Modal footer ยกเลิก / บันทึก · กว้าง 800 แบบ PopupModal width 800 ของเว็บ)
   ไม่ใช้ formModal (Modal Type=Form) เพราะ Card form row ของไลบรารีมีไม่พอ 11 ช่อง และใส่ Input dropdown / ข้อความ error ไม่ได้ · ช่อง = Text input / Input dropdown ของไฟล์ Component
   desktop 2 คอลัมน์ (row ช่องไฟ 24 · แถวห่าง 16 แบบ grid gap-x-6 gap-y-4 ของเว็บ) ลำดับ ประเภทเครื่องมือกล · พิกัดยก (กก.) / ยี่ห้อ · รุ่น / รหัสทรัพย์สิน · รหัสทรัพย์สินย่อย / ชั่วโมงเครื่องยนต์ · ชั่วโมงเครื่องจักร / หมายเลข HC · Serial No. / หมายเลขเครื่องยนต์ (ส่วนเครื่องจักร)
   มือถือ = Bottom sheet (sheet()) ช่องเรียงลง · Bottom sheet header ไม่มี Supporting text ⇒ ทะเบียนเป็นบรรทัดแรกของเนื้อหาแบบเว็บ (Section label ของไลบรารี เพราะห้ามวางข้อความเอง R106)
   o.edit = แก้ไขเครื่องแรกของคันนั้น (ค่าเดิมเป็นค่าตั้งต้น · ตัวเลขไม่มีจุลภาคแบบ toDraft ของเว็บ) · ไม่มี = เพิ่ม (รหัสทรัพย์สินตั้งต้น = ของเครื่องแรก · รหัสย่อยถัดไปที่ยังว่าง)
   o.tried = กดบันทึกแล้ว ⇒ ช่องผิดเป็น State Error + Helper text ตามเงื่อนไขของเว็บ · ผ่าน = toast "บันทึกเครื่องมือกลสำเร็จ" (MC_OK) */
const MC_OK = 'บันทึกเครื่องมือกลสำเร็จ';
async function machineModal(scr, ri, o) {   // ri = แถวใน MA_ROWS (row ชื่อซ้ำกับ row() ของ core)
  o = o || {};
  const v = vInfo(ri), list = vMachines(v), x = o.edit ? list[0] : null;
  const next = String(Math.max(0, ...list.map(m => Number(m.sub) || 0)) + 1).padStart(4, '0');
  const d = x ? { type: x.type, brand: x.brand, model: x.model, asset: x.asset, sub: x.sub, lift: x.lift != null ? String(x.lift) : '', engineHours: String(x.engineHours), machineHours: String(x.machineHours), hc: x.hc || '', serial: '', engineNo: '' }
    : { type: '', brand: '', model: '', asset: list[0] ? list[0].asset : '', sub: next, lift: '', engineHours: '', machineHours: '', hc: '', serial: '', engineNo: '' };
  const needLift = VI_NO_LIFT.indexOf(d.type) < 0, intOk = (s) => /^\d+$/.test(s.replace(/,/g, ''));
  const err = !o.tried ? {} : {
    type: !d.type ? 'กรุณาเลือกประเภทเครื่องมือกล' : '', brand: !d.brand.trim() ? 'กรุณาระบุยี่ห้อ' : '', model: !d.model.trim() ? 'กรุณาระบุรุ่น' : '',
    asset: !/^\d{12}$/.test(d.asset) ? 'กรุณาระบุรหัสทรัพย์สิน 12 หลัก' : '', sub: !/^\d{4}$/.test(d.sub) ? 'กรุณาระบุรหัสทรัพย์สินย่อย 4 หลัก' : '',
    lift: needLift && (!intOk(d.lift) || Number(d.lift.replace(/,/g, '')) <= 0) ? 'กรุณาระบุพิกัดยกเป็นตัวเลขมากกว่า 0' : !needLift && d.lift && !intOk(d.lift) ? 'กรุณาระบุพิกัดยกเป็นตัวเลข' : '',
    engineHours: !intOk(d.engineHours) ? 'กรุณาระบุชั่วโมงเครื่องยนต์เป็นจำนวนเต็มตั้งแต่ 0' : '', machineHours: !intOk(d.machineHours) ? 'กรุณาระบุชั่วโมงเครื่องจักรเป็นจำนวนเต็มตั้งแต่ 0' : '' };
  const f = (k, label, ph, optional) => field(label, d[k], { placeholder: ph, optional: !!optional, error: err[k] || '' });
  const pairs = [[dropdown('ประเภทเครื่องมือกล', d.type, { placeholder: 'เลือกประเภทเครื่องมือกล', error: err.type || '' }), f('lift', 'พิกัดยก (กก.)', 'เช่น 200', !needLift)],
    [f('brand', 'ยี่ห้อ', 'ระบุยี่ห้อ'), f('model', 'รุ่น', 'ระบุรุ่น')], [f('asset', 'รหัสทรัพย์สิน', '12 หลัก'), f('sub', 'รหัสทรัพย์สินย่อย', '4 หลัก เช่น 0001')],
    [f('engineHours', 'ชั่วโมงเครื่องยนต์', 'ชั่วโมง'), f('machineHours', 'ชั่วโมงเครื่องจักร', 'ชั่วโมง')],
    [f('hc', 'หมายเลข HC', 'เช่น HC - 9001', true), f('serial', 'หมายเลขประจำเครื่องจักร (Serial No.)', 'ระบุหมายเลขประจำเครื่องจักร', true)],
    [f('engineNo', 'หมายเลขเครื่องยนต์ (ส่วนเครื่องจักร)', 'ระบุหมายเลขเครื่องยนต์ของเครื่องจักร', true), frame('Spacer', 'VERTICAL')]];
  const grid = col('Content', pairs.map(p => row('Row', p)), 16);
  const title = x ? 'แก้ไขเครื่องมือกล' : 'เพิ่มเครื่องมือกล', plate = v.c[0];
  const r = await popupModal(scr, { title, sub: plate, w: 800, ok: 'บันทึก', body: MOB ? [await sectionLabel(plate), grid] : [grid] });
  if (MOB && r && r.sh && r.sh.height > VH() - 40) {   // 11 ช่องสูงเกินจอ ⇒ แผงสูงสุด VH − 40 เนื้อหาเลื่อนในแผง (แบบ BottomSheet ของเว็บ) ปุ่มท้ายแผงยังเห็น
    try { r.sh.primaryAxisSizingMode = 'FIXED'; r.sh.resize(VW(), VH() - 40); r.body.layoutGrow = 1; r.body.clipsContent = true; r.sh.y = 40; } catch (e) { warn('ความสูงแผงเครื่องมือกลบนมือถือ', e); }
  }
  return r;
}
async function viFleet(f) {   // Fleet card Status=Valid — Images sm 108 + กล่อง gray-50 (Section label เลขบัตร + วันใช้ได้) + Badge outline with indicator "ปกติ" · Badge outline ธนาคาร · วงเงินบัตร (ไม่มีโลโก้ธนาคาร/ปั๊ม — ภาพไม่มีในดัมป์)
  const card = await viCard('Fleet card', 'HORIZONTAL');
  const img = inst('Images', { Size: 'sm', Type: 'Empty' }); img.resize(108, 108); card.appendChild(img);
  const box = await viSubtle(frame('Content', 'VERTICAL', { gap: 8, pad: [12, 16] }));
  const sl = await sectionLabel(f.number); setProps(sl, { Supporting: true, 'Supporting text': f.dates }); add(box, sl, 'h');
  const badges = frame('Badges', 'HORIZONTAL', { gap: 8 });
  badges.appendChild(inst('Badge outline with indicator', { Color: 'Success' }, { Text: 'ปกติ' }));
  [f.bank, f.limit].forEach(t => badges.appendChild(inst('Badge outline', { Color: 'Gray' }, { Text: t })));
  add(box, badges, 'h');
  card.appendChild(box); box.layoutGrow = 1;
  return card;
}
async function viLastUsage(v) {   // Last usage Fuel=true — Card item row 1 แถวต่อรายการ ไอคอนนำ · ข้อความชิดขวา · + ชั่วโมงเครื่องจักรสะสม (ของเรา)
  const card = await viCard('Card');
  v.usage.forEach(([ic, label, val]) => add(card, viCardRow(ic, label, val), 'h'));
  return viSection([await sectionLabel('การใช้งานล่าสุด'), card]);
}
async function viWarranty(v) {   // การรับประกัน (n) ท้ายแท็บ เต็มแถว (เดิมแท็บการรับประกัน) — มีเฉพาะ 82-1145 แบบเว็บ (warrantyOf)
  const rows = viId(v.c[0]) === viId(TRIP_CARS[MA_ROWS[MA_CAR][0]][0]) ? MA_WARRANTY : [];
  let body;
  if (rows.length) body = await tblShort(MA_WAR_COLS, rows, { pagination: rows.length });
  else {
    body = inst('Empty state/Data empty');
    await text(body, 'Text', 'ยังไม่มีงานที่อยู่ในประกัน');
    await text(body, 'Supporting text', 'เมื่อปิดงานซ่อม Overhaul หรือบำรุงรักษาแผนจ้างที่มีประกันของผู้รับจ้าง รายการจะมาอยู่ที่นี่');
    const a = find(body, 'Actions'); if (a) a.visible = false;
  }
  return viSection([await sectionLabel('การรับประกัน', { badge: rows.length }), body]);
}
/* แท็บข้อมูลยานพาหนะ — desktop 2 คอลัมน์ (ซ้าย FILL · ขวา 526 ช่องไฟ 24 ตาม Section ของ Vehicle detail) · มือถือ 1 คอลัมน์ลำดับเดียวกัน (UI Release#2 ไม่มีเฟรม Vehicle info มือถือ)
   ซ้าย ข้อมูลทั่วไป → ข้อมูลการเงินและสัญญา → ข้อมูลสังกัดยานพาหนะ → ข้อมูลการจดทะเบียน → เครื่องมือกล (เฉพาะรหัสข้าง 04 07 08 09 10)
   ขวา รูปยานพาหนะ (Images md) → ใบคู่มือจดทะเบียน (_File upload item base) → บัตรเติมน้ำมัน (Fleet card) → การใช้งานล่าสุด (Last usage) · ใต้ 2 คอลัมน์ การรับประกัน
   ไม่มีปุ่ม แก้ไข ดูรายละเอียด เปลี่ยนเลขทะเบียน เปลี่ยนสังกัด ของ VMS+ (งานผู้ดูแลข้อมูลยานพาหนะ) · ดาวน์โหลดใบคู่มือคงไว้ */
async function vehicleInfoTab(row, kbk) {
  const v = vInfo(row);
  const left = [await viBox('ข้อมูลทั่วไป', v.general.map(items => ({ items }))), await viBox('ข้อมูลการเงินและสัญญา', v.finance), await viBox('ข้อมูลสังกัดยานพาหนะ', v.dept), await viBox('ข้อมูลการจดทะเบียน', v.reg)];
  if (VI_EQUIP.indexOf(v.side) >= 0) left.push(await viMachines(v, kbk));
  const img = inst('Images', { Size: 'md', Type: 'Empty' });
  const file = inst('_File upload item base', { State: 'Completed' }, { 'File name': v.file[0], 'File size': v.file[1], 'Progress bar': false, Actions: true, 'Download action': true, 'Delete action': false });
  const right = [viSection([await sectionLabel('รูปยานพาหนะ'), img]), viSection([await sectionLabel('ใบคู่มือจดทะเบียน'), file]), viSection([await sectionLabel('บัตรเติมน้ำมัน'), await viFleet(v.fleet)]), await viLastUsage(v)];
  const out = col('Vehicle info', [], 24);
  if (MOB) left.concat(right).forEach(k => add(out, k, 'h'));
  else {
    const two = frame('Row', 'HORIZONTAL', { gap: 24 });
    const l = col('Column', left, 24), r = col('Column', right, 24);
    two.appendChild(l); l.layoutGrow = 1; two.appendChild(r); r.counterAxisSizingMode = 'FIXED'; r.resize(526, r.height);
    add(out, two, 'h');
  }
  try { img.layoutSizingHorizontal = 'FILL'; img.resize(img.width, MOB ? 278 : 395); } catch (e) { /* ขนาดตาม component */ }   // สัดส่วน 4:3 แบบเว็บ (526 × 395)
  add(out, await viWarranty(v), 'h');
  return out;
}

async function maShell(name, tab, row) {
  row = row == null ? MA_CAR : row;
  const c = TRIP_CARS[MA_ROWS[row][0]], st = MA_VSTAT[MA_USE[row][4]];
  const { scr, page } = await shell(name, { title: c[0], back: true, root: 'ยานพาหนะ', crumbs: ['ข้อมูลยานพาหนะ', c[0]], badge: st });
  headPill(scr, st);   // Pill outline สถานะยานพาหนะใน Page header แบบ Page header Page=View ของเฟรม Vehicle info
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs(MA_VTABS.map(t => [t, null]), tab), 'h');
  return { scr, sec, c };
}
/* o.tab = 0 ข้อมูลยานพาหนะ · 1 ตารางบำรุงรักษา · 2 ประวัติการบำรุงรักษาเครื่องจักร · 3 ประวัติการบำรุงรักษาเครื่องยนต์ · 4 ประวัติการซ่อมบำรุง
   o.row = แถวใน MA_ROWS (ค่าเริ่ม MA_CAR) · o.menu · o.kbk = บทบาท กบค. (แก้/เพิ่มเครื่องมือกลได้) */
async function maDetail(name, o) {
  o = o || {};
  const tab = o.tab == null ? 1 : o.tab, row = o.row == null ? MA_CAR : o.row, r = MA_ROWS[row];
  const { scr, sec } = await maShell(name, tab, row);
  if (tab === 0) add(sec, await vehicleInfoTab(row, !!o.kbk), 'h');
  if (tab === 1) {
    add(sec, col('Section', [await sectionLabel('กำหนดครั้งถัดไป'), await tblShort(MA_NEXT_COLS, maNextRows(r))], 16), 'h');
    add(sec, col('Section', [await sectionLabel('ประวัติการบำรุงรักษา', { badge: MA_HIST.length }), await tblShort(MA_HIST_COLS, MA_HIST, { pagination: MA_HIST.length })], 16), 'h');
  }
  if (tab === 2) {   // บันทึกบำรุงรักษาตามวาระของ flow นี้ (มุมมอง "บำรุงรักษาเครื่องจักร" เดิม) · ค้นหาเลขที่ MR งานที่ทำ
    add(sec, await tableHeader({ placeholder: 'ค้นหาเลขที่ MR, งานที่ทำ' }), 'h');
    add(sec, await tblShort(MA_HIST_COLS, MA_HIST, { pagination: MA_HIST.length }), 'h');
  }
  if (tab === 3) {
    const e = vEngine(row);
    add(sec, await tableHeader({ placeholder: 'ค้นหาเลขที่งาน, งานที่ทำ' }), 'h');
    add(sec, await tblShort(VI_ENGINE_COLS, e.map(x => [x.date, x.no, x.center, x.work, x.km, x.cost]), { pagination: e.length }), 'h');
  }
  if (tab === 4) {   // Metric item 2 ใบ (บำรุงรักษาเครื่องจักรล่าสุด · ซ่อมเครื่องจักรล่าสุด) + ตารางรวม
    const rows = vService(row);
    add(sec, metricRow([await metric('บำรุงรักษาเครื่องจักรล่าสุด', MA_HIST[0][0], 'Brand'), await metric('ซ่อมเครื่องจักรล่าสุด', MA_REPAIRS[0][1], 'Warning')]), 'h');
    add(sec, await tableHeader({ placeholder: 'ค้นหาหมายเลขงาน, อาการ' }), 'h');
    add(sec, await tblShort(MA_REPAIR_COLS, rows, { pagination: rows.length }), 'h');
  }
  if (o.menu) planMenu(scr, MENU.slice(0, 1));
  return scr;
}

/* ---------- S12 บันทึกผลตรวจน้ำมันไฮดรอลิก ---------- */

/* ---------- ประวัติงานบำรุงรักษา (S16 ตีกลับแล้วผู้ดำเนินการส่งใหม่ · เดิม S15 ตัดออก 10 พ.ย. 2569) · S17 รายงานผล/ปิดงาน · S18 ต้นทุน ---------- */
/* historyScreen (S15/S16 ประวัติ) และ reportScreen (S17) เอาออก 10 พ.ย. 2569 — S15 S16 S17 ตัดออก */
/* ---------- S18 ต้นทุนการบำรุงรักษา (เจ้าของงานเคาะ 10 พ.ย. 2569 · ไฟล์ 14 Scenario 18 · R92) ----------
   ทางเข้า = แท็บ "ต้นทุนการบำรุงรักษา" ในหน้ารายละเอียดแผนที่อนุมัติแล้ว (Tabs ใต้หัวหน้า แบบ Vehicle detail ของ UI Release#2 ที่ S24 maShell ใช้) · ดูได้ตั้งแต่มีคันแรกปิดงาน
   โครงตามหน้า 5.13 EV charging costs for each agency ของ UI Release#2: Metric item ×4 → Table คอลัมน์ศูนย์ต้นทุน · ไม่มีกราฟ (ไลบรารีไม่มี · เจ้าของงานเลือกไม่มี)
   นับเฉพาะงานที่หน่วยงานทำเอง (แผนเดินทางจ้างดำเนินการไม่แสดง) · ค่าอะไหล่ = ราคารวมที่ใช้จริงตอนปิดงาน (ราคาต่อหน่วยระบบเติมให้ · ไม่รวมที่คืน · รวมอะไหล่นอกแผน)
   ค่าแรง = เบี้ยเลี้ยง + ชั่วโมงทำงาน × อัตรา (S10 Step 2 · ชั่วโมงไม่บังคับ) · ที่พัก เดินทาง ตาม S10 · ยานพาหนะที่บำรุงรักษาไม่ได้แยก section · สรุปตามแผนรายไตรมาส · เฉลี่ยต่อคัน
   ส่งออก = Excel อย่างเดียว ข้อมูลเหมือนจอ (ปุ่ม "ส่งออก" ไอคอน download แบบ R84 · ไม่มี popup เลือกรูปแบบเพราะมีรูปแบบเดียว · toast "ส่งออกไฟล์สำเร็จ" คำเดียวกับ S4) */
const PLAN_TABS = ['รายละเอียดแผน', 'ต้นทุนการบำรุงรักษา'];
const COST_CANNOT = TRIP_1.sel[2];   // คันที่บำรุงรักษาไม่ได้ของ T1 (JOB_MIX)
// [ลำดับใน TRIP_CARS, วันที่ปิดงาน, ค่าอะไหล่, ค่าเบี้ยเลี้ยง, ชั่วโมงทำงาน (0 = ไม่ได้กรอก), ค่าที่พัก, ค่าเดินทาง, ศูนย์ต้นทุนหน่วยงานอื่น] · แถวแรก = งานของ S10 (CLOSE_PARTS CLOSE_COST_BY)
const COST_V = [[JOB_I, '04/11/2569', 5880, costSum(1), CLOSE_HOURS, costSum(2), CLOSE_TRAVEL], [TRIP_1.sel[1], '05/11/2569', 5420, 960, 5, 3200, 980], [TRIP_1.sel[3], '06/11/2569', 7130, 1200, 0, 4000, 1210, true],
  [TRIP_2.sel[0], '18/11/2569', 4980, 720, 4, 2400, 860], [TRIP_2.sel[1], '19/11/2569', 6240, 960, 6, 3200, 980]];
const COST_X = [[COST_CANNOT, '04/11/2569', 1150, 480, 0, 1600, 450]];   // บำรุงรักษาไม่ได้ — ค่าใช้จ่ายที่เกิดแล้ว (อะไหล่ที่ใช้ไปแล้ว I.19 · ค่าเดินทาง ที่พัก)
const costLabour = (r) => r[4] * CLOSE_RATE;
const costTotal = (r) => r[2] + r[3] + costLabour(r) + r[5] + r[6];
const COST_COLS = [['ทะเบียน', 210, 'Lead text'], ['ศูนย์ต้นทุน', 0], ['ค่าอะไหล่', 110], ['ค่าเบี้ยเลี้ยง', 120], ['ค่าชั่วโมงทำงาน', 150], ['ค่าที่พัก', 110], ['ค่าเดินทาง', 110], ['รวม (บาท)', 120]];
const costRow = (r, cannot) => { const c = TRIP_CARS[r[0]], cc = r[7] ? OTHER_CC : OWNER_CC(c);
  return [{ text: c[0], sub: 'ไตรมาส 1 · ' + (cannot ? 'บำรุงรักษาไม่ได้' : 'ปิดงาน ' + r[1]) }, { text: cc.split(' ')[0], sub: cc.split(' ').slice(1).join(' ') }, nf(r[2]), nf(r[3]),
    r[4] ? { text: nf(costLabour(r)), sub: r[4] + ' ชม. × ' + nf(CLOSE_RATE) + ' บาท' } : '-', nf(r[5]), nf(r[6]), nf(costTotal(r))]; };
const QCOST_COLS = [['ไตรมาส', 0, 'Lead text'], ['ยานพาหนะ (คัน)', 160], ['ค่าอะไหล่', 110], ['ค่าเบี้ยเลี้ยง', 120], ['ค่าชั่วโมงทำงาน', 150], ['ค่าที่พัก', 110], ['ค่าเดินทาง', 110], ['รวม (บาท)', 120]];
const COST_ALL = () => COST_V.concat(COST_X);
const costSumOf = (rs) => [2, 3, null, 5, 6].map(k => rs.reduce((a, r) => a + (k == null ? costLabour(r) : r[k]), 0)).concat([rs.reduce((a, r) => a + costTotal(r), 0)]);
const QCOST_ROWS = () => { const s1 = costSumOf(COST_ALL()), z = ['0', '0', '0', '0', '0', '0'];
  return QUARTERS.map((q, k) => [q, k ? '0' : String(COST_ALL().length)].concat(k ? z : s1.map(nf))).concat([['รวมทั้งแผน', String(COST_ALL().length)].concat(s1.map(nf))]); };   // ยานพาหนะ (คัน) = คันที่มีต้นทุน (ปิดงานแล้ว + บำรุงรักษาไม่ได้)
const costMetrics = () => { const all = COST_ALL(), tot = all.reduce((a, r) => a + costTotal(r), 0);
  return [['ต้นทุนรวมของแผน', nf(tot) + ' บาท', 'Brand'], ['เฉลี่ยต่อคัน', nf(Math.round(tot / all.length)) + ' บาท', 'Brand'],   // เฉลี่ย = ต้นทุนรวม ÷ ยานพาหนะที่มีต้นทุน (รวมคันที่บำรุงรักษาไม่ได้ · เสนอ)
    ['ยานพาหนะที่ปิดงานแล้ว', COST_V.length + '/' + P_COUNTS.reduce((a, b) => a + b, 0) + ' คัน', 'Success'], ['บำรุงรักษาไม่ได้', COST_X.length + ' คัน', 'Warning']]; };
const COST_EXPORT_BTN = ['Secondary button', 'ส่งออก', 'download-24-300-round'];
async function costBody(o) {   // เนื้อแท็บต้นทุนการบำรุงรักษา · o.empty = ยังไม่มียานพาหนะปิดงาน
  if (o.empty) {
    const es = inst('Empty state/Data empty');
    await text(es, 'Text', 'ยังไม่มีต้นทุนการบำรุงรักษา'); await text(es, 'Supporting text', 'ต้นทุนจะแสดงเมื่อยานพาหนะในแผนเดินทางที่ดำเนินการเอง ปิดงานคันแรก');
    const a = find(es, 'Actions'); if (a) a.visible = false;
    return [es];
  }
  return [metricRow(await Promise.all(costMetrics().map(m => metric(m[0], m[1], m[2])))),
    col('Section', [await sectionLabel('สรุปรายไตรมาส'), await tblShort(QCOST_COLS, QCOST_ROWS())], 16),
    col('Section', [await sectionLabel('ต้นทุนรายคัน', { badge: COST_V.length }), await tblShort(COST_COLS, COST_V.map(r => costRow(r)))], 16),
    col('Section', [await sectionLabel('ยานพาหนะที่บำรุงรักษาไม่ได้', { badge: COST_X.length }), await tblShort(COST_COLS, COST_X.map(r => costRow(r, true)))], 16)];
}
async function costScreen(name, o) {   // หน้ารายละเอียดแผน แท็บต้นทุนการบำรุงรักษา (planDetailQ tab 1)
  return planDetailQ(name, Object.assign({ tab: 1 }, o));
}
const COST_SHEETS = ['สรุปรายไตรมาส', 'ต้นทุนรายคัน'];
async function costXls(name, sheet) {   // ไฟล์ Excel ที่ส่งออก — ข้อมูลเหมือนจอ (เจ้าของงาน 10 พ.ย. 2569 "excel แสดงเหมือนหน้าจอ") · ชีต = แถบ Tabs แบบ tripXls
  return docFrame(name, 1440, 1024, async () => {
    const head = [await tabs(COST_SHEETS.map(s => [s, null]), sheet), await sectionLabel('ต้นทุนการบำรุงรักษา · ' + P[0] + ' ' + P[1])];
    if (sheet === 0) return head.concat([kv(costMetrics().map(m => [m[0], m[1]]), 4), await tblShort(QCOST_COLS, QCOST_ROWS())]);
    return head.concat([await tblShort(COST_COLS, COST_V.map(r => costRow(r))), await sectionLabel('ยานพาหนะที่บำรุงรักษาไม่ได้', { badge: COST_X.length }), await tblShort(COST_COLS, COST_X.map(r => costRow(r, true)))]);
  });
}

/* ======================== รอบสอง 9 scenario (เจ้าของงานสั่ง 22 ต.ค. 2569 ดึก "บำรุงรักษา สามารถ export 18 scen ได้เลย") ========================
   S2–S3 ผพจ./หัวหน้า ผพจ. · S7 ผู้รับจ้าง · S8 กบค. ตรวจแผนผู้รับจ้าง · S9 กรย. · S11 กบค. ตรวจงานผู้รับจ้าง + รับคืนอะไหล่ (ตัดออก 4 พ.ย. 2569) · S13–S14 หน่วยงาน/เจ้าของรถ · S16 หัวหน้าหน่วยงาน
   ตีความเอง (คำถามในไฟล์ 14 ยังค้าง — แจ้งเจ้าของงานแล้ว): ผพจ. กับหัวหน้า ผพจ. คนละบทบาท (Q1) · ผู้รับจ้างมีบัญชีเข้า VMS+ เอง (Q13) · รับทราบรอบเดียวรายคันที่ S13 (Q28 เคาะ 10 พ.ย. 2569 · S14 S15 ตัดออก) ·
   ไม่มีปุ่มไม่ยอมรับ (Q23) · ไม่สร้างทางที่บอร์ดยังไม่มีปลายทาง (กรย. อะไหล่ไม่พร้อม Q16 · ผพจ. คืนอะไหล่ Q5)
   ยืมจาก flow งานซ่อม: `RepairFeedback` (คะแนน 1–5 Radio text card — เจ้าของงานเลือกให้ S14 · การประเมินเกิดตอนบำรุงรักษาครบทุกคัน) · `ReturnPart` (ตารางรับคืนอะไหล่ S11 — เลิกใช้ 3 พ.ย. 2569 · S11 ตัดออกทั้ง scenario 4 พ.ย. 2569) */
async function tabs(items, active) {   // component Tabs (5 ช่อง Tab item) · items [[ข้อความ, จำนวน]] · ซ่อนช่องที่เกิน (ยกจาก overhaul2-plugin)
  const t = inst('Tabs');
  const its = t.children.filter(c => c.type === 'INSTANCE' && c.name === 'Tab item');
  its.forEach((it, i) => {
    if (i >= items.length) { it.visible = false; return; }
    setProps(it, { Active: i === active ? 'True' : 'False', State: 'Default' });
    setProps(it, { Text: items[i][0], Badge: items[i][1] != null });
    const p = find(it, 'Pill outline'); if (p && items[i][1] != null) setProps(p, { Color: 'Brand', Text: String(items[i][1]) });
  });
  return t;
}
/* หน้ารายการของบทบาทอื่น (ผพจ. · ผู้รับจ้าง · กรย. · หน่วยงาน · หัวหน้า) — Page header + (Tabs) + Table header + Table · o.tabs = [[ข้อความ, จำนวน]] */
async function roleList(name, o) {
  const { scr, page } = await shell(name, { title: o.title });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  if (o.tabs) add(sec, await tabs(o.tabs, o.tab || 0), 'h');
  add(sec, await tableHeader({ placeholder: o.search }), 'h');
  add(sec, await tblShort(o.cols, o.rows, { pagination: o.rows.length }), 'h');
  return scr;
}
const reason = (scr, title, label, value, ok) => formModal(scr, { title, fields: [{ label, value, area: 1 }], ok });   // ส่งกลับ/ปฏิเสธ/ตีกลับ = เหตุผล Freetext บังคับ (ไฟล์ 14)
const GO = { icons: ['keyboard_arrow_right-20-400-round'] };

/* ---------- S7 ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง (3 พ.ย. 2569) ----------
   เจ้าของงาน "s7 เป็นเรื่องอนุมัติแผนการเดินทาง" + หน้าอนุมัติแบบเดียวกับ S2 (radio อนุมัติ ค่าเริ่มต้น / ส่งกลับแก้ไข + เหตุผล) · ผู้อนุมัติตามสายงานจาก API getUpperLower (Q45)
   ตาม `Radio text card` + `Section label` + `Table` ของไฟล์ Component · หน้า Detail ⇒ Section label (R3) */
const TRIP_VIEW_COLS = tripVCols();   // R82 ชุดเดียวกับฟอร์มแผนเดินทาง ดูอย่างเดียว (6 พ.ย. 2569 + ประเภทยานพาหนะ · ผู้ดูแลยานพาหนะ · วันดำเนินการ · เดิม ทะเบียน ยี่ห้อ/รุ่น หน่วยงาน สถานที่)
const tripCarIdx = (t, only) => t.sel.filter(i => !only || TRIP_CARS[i][2] === only);   // only = หน่วยงานเจ้าของยานพาหนะ (S8 ฝั่งหน่วยงานเห็นเฉพาะยานพาหนะของตน)
const tripCarRows = (t, only) => tripCarIdx(t, only).map(i => tripVCells(i, t));
const tripKv = (t, more) => [['ชื่อแผนเดินทาง', t.name], ['แผน', P[0] + ' ' + P[1]], ['ไตรมาส', NOW_Q], ['รูปแบบดำเนินการ', t.vendor ? 'จ้างดำเนินการ' : 'ดำเนินการเอง']].concat(t.vendor
  ? [['ผู้รับจ้าง', t.vendor], ['เลขที่สัญญา/ใบสั่งจ้าง', t.contract || '-'], ['ช่วงวันทำงาน', t.d1 + ' – ' + t.d2]]   // S9 แผนจ้าง: ไม่มีพนักงาน กบค. และค่าใช้จ่าย
  : [['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2], ['พนักงานที่เดินทาง', TRIP.staff.join(', ')]], [['ผู้สร้าง', CREATOR], ['วันที่ส่ง', '03/11/2569']], more || []);   // ค่าใช้จ่ายย้ายไปปิดงานรายคัน (3 พ.ย. 2569)
const TRIP_REVIEW_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวันเดินทาง', 220], ['ยานพาหนะ (คัน)', 100], ['ผู้สร้าง', 180], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 150, 'Badge'], ['', 60]];
const tripReviewRow = (t) => [{ text: t.name, sub: P[0] + ' · ' + NOW_Q }, t.d1 + ' – ' + t.d2, String(t.sel.length), 'นายวิชัย ทองดี', '03/11/2569', { pill: TST[t.st] }, GO];
const TRIP_OTHER = { name: 'ตรวจรถพ่วงฉีดน้ำ นครราชสีมา บุรีรัมย์', sel: [0, 1, 2], locs: {}, d1: '10/11/2569', d2: '12/11/2569', st: 'review' };   // อีกใบในรายการรออนุมัติ (แสดงในตารางอย่างเดียว)
/* หน้าอนุมัติมีแท็บ รออนุมัติ · อนุมัติแล้ว · ส่งกลับแก้ไข (เจ้าของงาน 10 พ.ย. 2569 "หน้าอนุมัติต้องมี tab รออนุมัติ อนุมัติแล้ว และ ส่งกลับแก้ไขด้วย")
   ตาม `Tabs` ของไฟล์ Component + แท็บ รอตรวจสอบ อนุมัติแล้ว ปฏิเสธ ของหน้ารายการตรวจสอบเดิมในไฟล์ Maintain-D (ตัวเลขเฉพาะแท็บรออนุมัติ) · tab 0 1 2 */
const REVIEW_TABS = (n) => [['รออนุมัติ', n], ['อนุมัติแล้ว', null], ['ส่งกลับแก้ไข', null]];
const TRIP_OK = Object.assign({}, TRIP_2, { st: 'approved' }), TRIP_RET = { name: 'ตรวจยานพาหนะ พิษณุโลก สุโขทัย ตาก', sel: [0, 1], locs: {}, d1: '24/11/2569', d2: '26/11/2569', st: 'returned' };
const TRIP_PENDING = [TRIP_1, TRIP_V, TRIP_OTHER];
const tripReviewList = async (name, rows, tab, pending) => roleList(name, { title: 'อนุมัติแผนเดินทาง', search: 'ค้นหาชื่อแผนเดินทาง, ผู้สร้าง', cols: TRIP_REVIEW_COLS, rows: rows.map(tripReviewRow),
  tabs: REVIEW_TABS(pending != null ? pending : TRIP_PENDING.length), tab: tab || 0 });
async function tripReview(name, o) {   // o.decision = 'return' · o.reason · o.errors · o.status = 'approved'
  o = o || {};
  const t = TRIP_1;
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนเดินทาง', back: true, crumbs: ['อนุมัติแผนเดินทาง', t.name], badge: TST[o.status || 'review'] });
  // 5 พ.ย. 2569 ทำตาม S2 (รีวิวทีมออกแบบ) ให้สอดคล้อง: ผลการพิจารณาบนสุด ไม่มีค่าเริ่มต้น · อนุมัติแล้วแสดงแค่ toast ไม่มี Alert ซ้ำ
  const d = o.status === 'approved' ? null : await decisionSection(o, 'แผนเดินทางผ่านการตรวจสอบ แจ้งผู้ดูแลยานพาหนะและ กรย.', 'แจ้งเหตุผลให้ผู้สร้างแผนเดินทางแก้ไขแล้วส่งใหม่');
  const nodes = (d ? [d.dec] : []).concat([await vehicleInfo(tripKv(t), 'รายละเอียดแผนเดินทาง'), col('Section', [await sectionLabel('ยานพาหนะในแผนเดินทาง', { badge: t.sel.length }), await tblShort(TRIP_VIEW_COLS, tripCarRows(t))], 16),
    await tripPartsSec(t.sel, true)]);   // 6 พ.ย. 2569 อะไหล่ของแผนเดินทาง ให้ผู้อนุมัติเห็นชุดเดียวกับฟอร์ม (R82)
  if (d) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg', disabled: !d.ok }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S8 แจ้งเตือนในแอปถึง กรย. และหน่วยงานเจ้าของรถ (3 พ.ย. 2569) ----------
   เจ้าของงาน "S8 เป็นเรื่อง noti ไปที่ กรย และหน่วยงานเจ้าของรถ" + "ดูอย่างเดียว" + "noti ออกแบบเป็น noti inapp ไปก่อน"
   กระดิ่ง + แผงแจ้งเตือน = `Notification card` (+ `_Notification item base` · `Status`) ตามแผงแจ้งเตือนของปลั๊กอิน Overhaul (S15 · บล็อก noti)
   กดแจ้งเตือนแล้วเปิดหน้าแผนเดินทางแบบดูอย่างเดียว · หน่วยงานเจ้าของรถเห็นเฉพาะรถของตน */
const propVal = (n, k) => { const cp = n.componentProperties || {}; const f = Object.keys(cp).find(x => x === k || x.split('#')[0].trim() === k); return f ? cp[f].value : undefined; };
function bell(scr, on) {   // กระดิ่งใน Header navigation = Nav button ที่ไลบรารีเปิด Indicator ไว้ · on = มีแจ้งเตือนใหม่ (จุดแดง)
  const hdr = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Header navigation')[0];
  if (!hdr) { warn('กระดิ่ง', 'ไม่พบ Header navigation'); return null; }
  const b = (find(hdr, 'Nav items') || hdr).findAll(n => n.type === 'INSTANCE' && n.name === 'Nav button').find(n => propVal(n, 'Indicator') === true);
  if (!b) { warn('กระดิ่ง', 'ไม่พบ Nav button ที่มี Indicator'); return null; }
  setProps(b, { Indicator: !!on });
  return b;
}
function fillNotiItem(r, it) {   // [สีจุดสถานะ, ข้อความ, เวลา]
  setProps(r, { Text: it[1], 'Supporting text': it[2], 'Show status': true, 'Show button': false });
  const st = r.findAll(x => x.type === 'INSTANCE' && x.name === 'Status')[0]; if (st) setProps(st, { State: it[0] });
}
async function notiPanel(scr, items, badge) {
  const card = inst('Notification card');
  const hd = find(card, '_Notification header'); const bg = hd && find(hd, 'Badge outline'); if (bg) setProps(bg, { Text: badge, Color: 'Gray' });
  const rows = card.findAll(n => n.type === 'INSTANCE' && n.name === '_Notification item base');
  for (const [i, r] of rows.entries()) { if (items[i]) fillNotiItem(r, items[i]); else r.visible = false; }
  if (MOB) {   // Notification card ไม่มี variant มือถือ ⇒ bottom sheet หัว "แจ้งเตือน" (แบบ Overhaul)
    if (hd) hd.visible = false; const cf = find(card, '_Notification footer'); if (cf) cf.visible = false;
    const r = await sheet(scr, { title: 'แจ้งเตือน (' + badge + ')', content: [card], ok: 'ลบข้อความแจ้งเตือนทั้งหมด' });
    try { card.resize(VW() - 32, card.height); } catch (e) { warn('การ์ดแจ้งเตือนบนมือถือ', e); }
    const ft = find(r.sh, 'Bottom sheet footer'); const sb = ft && find(ft, 'Secondary button'); if (sb) sb.visible = false;
    return r.sh;
  }
  const hdr = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Header navigation')[0];
  overlay(scr, card, VW() - card.width - 24, (hdr ? hdr.height : 64) + 8);
  return card;
}
const OWN_UNIT = TRIP_CARS[0][2];   // หน่วยงานเจ้าของรถตัวอย่าง (กฟฉ.1 ขอนแก่น · รถ 2 คันในแผนเดินทาง 1)
const ownCars = (t) => t.sel.filter(i => TRIP_CARS[i][2] === OWN_UNIT);
const NOTI_KRY = ['Brand', 'แผนเดินทาง ' + TRIP_1.name + ' อนุมัติแล้ว หน่วยงานผู้ดำเนินการจะเข้าบำรุงรักษายานพาหนะ ' + TRIP_1.sel.length + ' คัน ระหว่างวันที่ ' + TRIP_1.d1 + ' ถึง ' + TRIP_1.d2, '10 นาทีที่แล้ว'];
const NOTI_OWN = ['Brand', 'หน่วยงานผู้ดำเนินการจะเข้าบำรุงรักษายานพาหนะที่คุณดูแล ' + ownCars(TRIP_1).length + ' คัน (' + ownCars(TRIP_1).map(i => TRIP_CARS[i][0]).join(', ') + ') ระหว่างวันที่ ' + TRIP_1.d1 + ' ถึง ' + TRIP_1.d2 + ' ที่ ' + tripLoc(ownCars(TRIP_1)[0], TRIP_1.locs), '10 นาทีที่แล้ว'];
const NOTI_OLD = ['Success', 'บำรุงรักษายานพาหนะ 82-3302 อุดรธานี ตามแผนเดินทางเดือนตุลาคมเสร็จแล้ว', '2 วันที่แล้ว'];
const TRIP_SEEN_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวันเดินทาง', 220], ['ยานพาหนะ (คัน)', 100], ['สถานะ', 150, 'Badge'], ['', 60]];
const tripSeenList = (name, own) => roleList(name, { title: 'แผนเดินทางบำรุงรักษา', search: 'ค้นหาชื่อแผนเดินทาง, ทะเบียน', cols: TRIP_SEEN_COLS, rows: [[{ text: TRIP_1.name, sub: P[0] + ' · ' + NOW_Q }, TRIP_1.d1 + ' – ' + TRIP_1.d2, String(own ? ownCars(TRIP_1).length : TRIP_1.sel.length), { pill: TST.approved }, GO]] });
async function tripView(name, own) {   // ดูอย่างเดียว · own = หน่วยงานเจ้าของรถ (เฉพาะรถของตน)
  const t = tripAs(TRIP_1, 'approved');
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: ['แผนเดินทางบำรุงรักษา', t.name], badge: TST.approved, actions: [TRIP_EXPORT_BTN] });   // 6 พ.ย. 2569 ส่งออกได้ เพราะไม่แก้ข้อมูล (แบบ viewActions ของ S18 Overhaul · R84)
  const kv = [['ชื่อแผนเดินทาง', t.name], ['แผน', P[0] + ' ' + P[1]], ['ไตรมาส', NOW_Q], ['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2], ['พนักงานที่เดินทาง', TRIP.staff.join(', ')], ['ผู้สร้าง', CREATOR], ['อนุมัติเมื่อ', '04/11/2569']];
  const idx = tripCarIdx(t, own ? OWN_UNIT : null), rows = tripCarRows(t, own ? OWN_UNIT : null);
  add(page, col('Content', [await vehicleInfo(kv, 'รายละเอียดแผนเดินทาง'), col('Section', [await sectionLabel(own ? 'ยานพาหนะของหน่วยงานในแผนเดินทาง' : 'ยานพาหนะในแผนเดินทาง', { badge: rows.length }), await tblShort(TRIP_VIEW_COLS, rows)], 16),
    await tripPartsSec(idx, true)], 32), 'h');   // 6 พ.ย. 2569 อะไหล่ของแผนเดินทาง (R82) · ฝั่งหน่วยงานรวมเฉพาะยานพาหนะของตน
  return scr;
}

/* ---------- S2 ผู้อนุมัติ ตรวจสอบและอนุมัติแผน (30 ต.ค. 2569 สายอนุมัติทั่วไป ไม่ผ่าน ผพจ.) ---------- */
const NP = NEW_PLAN;
const NO_NEW = 'MRZ7000003';   // ใช้กับ S3 ที่พักไว้ (เลขงาน) — ไม่อยู่ในชุดสร้างจอ
const npKv = (job, row, alloc) => { row = row || NP; alloc = alloc || A_ALL; return [   // 5 พ.ย. 2569 ภาค สรุปจากรถในแผน · 13 พ.ย. 2569 row/alloc = แผนที่สร้างในเรื่องย่อย A1 (R108 ข้อมูลต่อเนื่อง)
  ['ชื่อแผน', row[1]], ['ปีงบประมาณ', row[8]], ['หน่วยงาน', PLAN_UNIT[row[0]]], ['เขต', [...new Set(Object.keys(alloc).map(i => dCode(CAND[i])))].sort().join(', ')], ['ยานพาหนะรายไตรมาส', row[9]], ['จำนวนยานพาหนะ', row[4] + ' คัน'], ['เลขที่ MR', job || row[0]], ['ผู้สร้างแผน', CREATOR], ['วันที่ส่ง', row[6]]]; };
const VEH7 = CAND.map(c => [c[0], c[1], c[2], c[3], 'ready']);   // รถในแผนใหม่ = รถที่ติ๊กตอนสร้างแผน (ภาค 2 รถกระเช้า)
const REVIEW_COLS = [['ชื่อแผน', 0, 'Lead text', 'Swap'], ['ปีงบประมาณ', 120], ['ผู้สร้าง', 180], ['ภาค / ประเภทยานพาหนะ', 200], ['จำนวนยานพาหนะ', 100], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 150, 'Badge'], ['', 60]];
const reviewRow = (p) => [p[1], p[8], { text: 'นายวิชัย ทองดี', sub: PLAN_UNIT[p[0]] || UNITS[0] }, scopeCell(p), p[4] + ' คัน', p[6], { pill: PST[p[5]] }, GO];
const REVIEW_ROWS = [NP, PLANS[2]];   // แท็บรออนุมัติ (10 พ.ย. 2569 แยกแท็บ — แผนที่ส่งกลับไปอยู่แท็บส่งกลับแก้ไข)
const REVIEW_DONE = [PLANS[0], PLANS[1], PLANS[4]], REVIEW_RET = [PLANS[3]];   // แท็บอนุมัติแล้ว · ส่งกลับแก้ไข · 13 พ.ย. 2569 ไฟล์ 34 ข้อ 9 (ก): แท็บอนุมัติแล้วรวมแผนที่เริ่มดำเนินการและปิดงานแล้ว ป้ายบอกสถานะจริง (ดำเนินการ · อนุมัติแล้ว · ปิดงานแล้ว) · เดิมแผนดำเนินการแสดงเป็นอนุมัติแล้ว
const planReviewList = (name, rows, tab, pending) => roleList(name, { title: 'อนุมัติแผนบำรุงรักษา', search: 'ค้นหาชื่อแผน, ผู้สร้าง', cols: REVIEW_COLS, rows: rows.map(reviewRow),
  tabs: REVIEW_TABS(pending != null ? pending : REVIEW_ROWS.length), tab: tab || 0 });
const PART_CHECK_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['ตามแผน', 110], ['หน่วย', 90], ['คงเหลือในคลัง', 140], ['ต้องซื้อเพิ่ม', 140]];
const partCheckRows = () => PARTS.map((p, i) => [p[0], p[1], p[3], p[4], p[5], shortOf(i) ? String(shortOf(i)) : '-']);
async function planBody(o) {   // เนื้อหน้ารายละเอียดแผน ใช้ทั้งฝั่งผู้อนุมัติ (S2) และผู้สร้างแผน (S1 S19 S20 · มุม กบค.) · อะไหล่ในแผนขึ้นทุกหน้า · o.pq = แท็บ (0 รวมทุกไตรมาส) · สถานะคลังรับทราบ (o.wh) ตัดพร้อม S22 6 พ.ย. 2569
  o = o || {};
  /* 13 พ.ย. 2569 o.plan = { row, alloc, picks, oils } แผนที่สร้างจริงในเรื่องย่อย A1 ของ S1 (R108 "ข้อมูลต่อเนื่องในเรื่อง … ห้ามกระโดดไปข้อมูลชุดอื่นกลางเรื่อง")
     ไม่ส่ง = แผนตัวอย่าง NP 10 คันแบบเดิม · น้ำมันของ o.plan ใช้ชุดคำเดียวกับฟอร์มแผน (JOB_OIL_OPTS) */
  const pl = o.plan || {}, A_ALL_ = pl.alloc || A_ALL, PICKS_ = pl.picks || A_PICKS, DRAW_ = pl.draw || A_DRAW;
  const inPlan = Object.keys(A_ALL_).map(Number);   // รถในแผนใหม่ = ที่จัดลงไตรมาสตอนสร้างแผน (S1)
  // เจ้าของงาน 2 พ.ย. 2569 "อยากให้ข้อมูลที่แสดงเป็นข้อมูลรถ" ⇒ รถแยกแท็บไตรมาส คอลัมน์เดียวกับ section รถในไตรมาสของ S1 ไม่มีไอคอน (ดูอย่างเดียว) · ไม่มีตารางอะไหล่ทั้งปี
  const q1 = inPlan.filter(i => A_ALL_[i] === 1), n = (i) => (PICKS_[i] || []).length;
  const oilOf = (i) => pl.oils ? JOB_OIL_OPTS[pl.oils[i]] : OIL_OPTS[(A_PICKS[i] || []).indexOf(0) >= 0 ? 1 : 0];
  const partsOf = pl.alloc ? (k) => qAgg(inPlan.filter(i => (k === 0 || A_ALL_[i] === k) && DRAW_[i] !== 'none'), PICKS_, pl.oils || {}, []).sort((a, b) => a[2].localeCompare(b[2], 'th')) : undefined;
  return [await vehicleInfo(npKv(null, pl.row, pl.alloc), 'รายละเอียดแผน'),
    // 5 พ.ย. 2569 ชีตลูกค้า: ปุ่มไปหน้าไตรมาสต้องมีทั้งแผน อนุมัติแล้ว และ ดำเนินการ (เดิมมีเฉพาะ planDetailQ ดำเนินการ) · o.qBtn
    col('Section', [await sectionLabel('ยานพาหนะในแผน', { badge: inPlan.length, buttons: o.qBtn ? [Q_BTN] : [] }), await tabs(QUARTERS.map((t, k) => [t, inPlan.filter(i => A_ALL_[i] === k + 1).length]), 0),
      await tblShort(CARP_COLS.slice(0, 6), q1.map(i => [CAND[i][0], CAND[i][1], CAND[i][2], oilOf(i), lastOil(CAND[i][0]), DRAW_[i] === 'none' ? 'ไม่เบิกอะไหล่' : n(i) ? n(i) + ' รายการ' : 'ยังไม่เลือก']))], 16)]
    .concat([await planPartsSec(o.pq || 0, partsOf, o.readonly)]);   // o.readonly = หน้าดูอย่างเดียว (ไฟล์ 34 ข้อ 5)   // อะไหล่ในแผน ทุกหน้ารายละเอียดแผน · 9 พ.ย. 2569 เจ้าของงานส่งภาพ A.20 A.21 A.22 A.32 ที่มีหัวข้ออะไหล่ "ทำให้เป็นแบบนี้" (ยกเลิกที่เคาะเช้า "หน้าผู้สร้าง … ไม่ต้องมี มีแค่ผู้อนุมัติ")
}
/* หน้ารายละเอียดแผนฝั่งผู้อนุมัติ (Detail ⇒ Section label)
   เจ้าของงาน 2 พ.ย. 2569: ผลการพิจารณาเป็น radio อนุมัติ (ค่าเริ่มต้น) / ส่งกลับแก้ไข แทนปุ่ม 2 ปุ่ม — ตามการ์ดตอบรับ/ปฏิเสธนัดหมายของ Overhaul R29 (§4.2.13)
   o.decision = 'return' เลือกส่งกลับแก้ไข ⇒ Text area เหตุผลบังคับ · o.reason = เหตุผลที่กรอก · o.errors = ยังไม่ระบุเหตุผล */
/* ผลการพิจารณา (S2 · S7) — ปรับ 5 พ.ย. 2569 (รีวิวทีมออกแบบ): "Default จะยังไม่เลือกผลการพิจารณาให้ ต้องเลือกเอง · ย้ายตำแหน่งจากด้านล่างสุดไปไว้ด้านบนสุดให้เหมือนงานซ่อม"
   ⇒ Section label + Radio text card 2 ใบ บนสุดของเนื้อหา ตาม Incident detail ของ Flow การซ่อม (ไฟล์ Maintain-D: Section label + Radio text card ×2 ก่อนส่วนข้อมูล) · ไม่มีใบที่เลือกไว้ก่อน
   ปุ่ม "ยืนยันผลการพิจารณา" Disabled จนกว่าจะเลือกผล และถ้าเลือกส่งกลับต้องระบุเหตุผลก่อน · o.decision = 'approve' | 'return' · o.reason · o.errors = ช่องเหตุผลออกจากช่องโดยยังว่าง (Out of focus) */
async function decisionSection(o, approveSub, returnSub) {
  const sel = o.decision === 'return' ? 1 : o.decision === 'approve' ? 0 : -1;
  const dec = await radioPick('ผลการพิจารณา', [['อนุมัติ', approveSub], ['ส่งกลับแก้ไข', returnSub]], sel, { label: true });
  if (sel === 1) add(dec, area('เหตุผลที่ส่งกลับ', o.reason, { placeholder: 'ระบุเหตุผลที่ส่งกลับ', error: o.errors ? 'กรุณาระบุเหตุผลที่ส่งกลับ' : '' }), 'h');
  return { dec, ok: sel === 0 || (sel === 1 && !!o.reason) };
}
/* อะไหล่ของแผน (S2 · 6 พ.ย. 2569 เจ้าของงาน "อยากเพิ่ม section อะใหล่ โดย group ชนิด ประเภท จำนวน ไม่แยกรายคัน แต่ละไตรมาส" + ยืนยัน ประเภท = หมวด · ชนิด = รายการ · จำนวนรวมทุกคันพร้อมหน่วย)
   Section label "อะไหล่ในแผน" + Tabs ไตรมาส 1–4 (ตัวเลข = จำนวนรายการ) + Table ชนิด · ประเภท · จำนวน · หน่วย เรียงตามประเภท · ยอดจาก qAgg ตัวเดียวกับหัวข้ออะไหล่ในไตรมาสของ S1 (คันที่ไม่เบิกไม่รวม)
   ตาม Section label + Tabs + Table ของหน้ารายละเอียดแผน (รถในแผน) ในบล็อกเดียวกัน · ไม่มีอะไหล่ = Empty state */
/* 9 พ.ย. 2569 เจ้าของงาน (ภาพหัวข้ออะไหล่ในแผนของ S2) "อยากให้มี tab รวมทุกไตรมาส และแยกไตรมาส ทั้งก่อนอนุมัติ และ ผู้อนุมัติ"
   ⇒ Tabs = "รวมทุกไตรมาส" (ค่าเริ่มต้น · ยอดเท่าผลรวมไตรมาส 1–4 แบบ R85) + ไตรมาส 1–4 (Tabs ของไลบรารีมี 5 ช่องพอดี) · q = 0 รวมทุกไตรมาส · 1–4 ไตรมาสนั้น
   แสดงทุกหน้ารายละเอียดแผน (planBody): หน้าตรวจสอบของผู้อนุมัติ (S2) · หน้ารายละเอียดของผู้สร้างแผนทุกสถานะ (S1 A.20–A.22 · S19 · S20) · A.32 กบค. ดูแผนของหน่วยงานอื่น (เจ้าของงาน 9 พ.ย. 2569 ส่งภาพ 4 จอ "ทำให้เป็นแบบนี้") */
const planQParts = (k) => { const cars = Object.keys(A_ALL).map(Number).filter(i => (k === 0 || A_ALL[i] === k) && A_DRAW[i] !== 'none'); return qAgg(cars, A_PICKS, A_OILS, []).sort((a, b) => a[2].localeCompare(b[2], 'th')); };
async function planPartsSec(q, rowsOf, readonly) {   // rowsOf = ยอดรายแท็บของแผนอื่น (ค่าเริ่ม planQParts = แผน NP) · E.2 ใช้ pQParts ของแผน P
  const rows = (rowsOf || planQParts)(q);
  const sec = col('Section', [await sectionLabel('อะไหล่ในแผน'), await tabs([['รวมทุกไตรมาส', null]].concat(QUARTERS.map(t => [t, null])), q)], 16); // 9 พ.ย. 2569 เจ้าของงาน "เอาเลขออกไปเลยได้ป่ะ ถ้าหมายถึงจำนวนชนิด" ⇒ หัวข้ออะไหล่รวมตามรายการไม่มีตัวเลขจำนวนชนิด
  if (rows.length) add(sec, await tblShort(QPART_COLS, rows), 'h');
  else add(sec, await noParts(q ? Q_PARTS_EMPTY : readonly ? PLAN_NO_PARTS : ALL_Q_PARTS_EMPTY), 'h');   // หน้าดูอย่างเดียวไม่มีปุ่ม … ให้กด (ไฟล์ 34 ข้อ 5)   // ข้อความชุดเดียวกับหัวข้ออะไหล่ในไตรมาส n ของหน้าไตรมาส
  return sec;
}
/* อนุมัติสำเร็จ (5 พ.ย. 2569 รีวิว): "แสดง Toast ด้านบนขวา · ไม่ต้องแสดง Alert อนุมัติแผนแล้ว ซ้ำ ให้แสดงแค่ Toast · สถานะ รออนุมัติ > อนุมัติแล้ว · Section ผลการพิจารณา หายไป" ⇒ o.status = 'approved' ไม่มี Alert ไม่มีส่วนผลการพิจารณาและแถวปุ่ม */
async function planReview(name, o) {
  o = o || {};
  const done = o.status === 'approved';
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนบำรุงรักษา', back: true, crumbs: ['อนุมัติแผนบำรุงรักษา', NP[1]], badge: PST[o.status || 'review'] });
  const d = done ? null : await decisionSection(o, 'แผนผ่านการตรวจสอบ หน่วยงานเริ่มงานรายไตรมาสได้', 'แจ้งเหตุผลให้ผู้สร้างแผนแก้ไขแล้วส่งใหม่');
  const nodes = (d ? [d.dec] : []).concat(await planBody({ pq: o.pq, plan: o.plan, readonly: true }));   // ผู้อนุมัติแก้แผนไม่ได้ = หน้าดูอย่างเดียว (ไฟล์ 34 ข้อ 5)
  if (d) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg', disabled: !d.ok }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S22 กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส (2 พ.ย. 2569) ----------
   เจ้าของงาน: ต่อจากอนุมัติ ส่งไปหา กบค. คลัง ว่าแต่ละไตรมาสเบิกอะไหล่อะไรบ้าง แยกไตรมาส · ระบบส่งทั้งปีทันทีที่อนุมัติ · คลังดูแล้วกดรับทราบ (ไม่มีส่งกลับ)
   หน้า Detail ⇒ Section label · Tabs ไตรมาสตัวเดียวกับ S1 · ยอดคิดจากอะไหล่ที่ กบค. เลือกไว้ (A_PICKS) ของรถแต่ละไตรมาส */
const WH_QS = [1, 2, 3, 4].filter(k => Object.values(A_ALL).indexOf(k) >= 0);   // ไตรมาสที่มีรถ = ไตรมาสที่ต้องรับทราบ
const wst = (n) => n === 0 ? ['รอรับทราบ', 'Warning'] : n < WH_QS.length ? ['รับทราบ ' + n + '/' + WH_QS.length + ' ไตรมาส', 'Info'] : ['รับทราบครบแล้ว', 'Success'];   // 2 พ.ย. 2569 รับทราบทีละไตรมาส
const WH_COLS = [['เลขที่ MR', 150, 'Lead text'], ['ชื่อแผน', 0], ['ปีงบประมาณ', 120], ['จำนวนยานพาหนะ', 100], ['วันที่อนุมัติ', 130], ['สถานะ', 150, 'Badge'], ['', 60]];
const whRow = (p, n, d) => [p[0], p[1], p[8], p[4] + ' คัน', d, { pill: wst(n) }, GO];
const WH_PART_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวนที่ต้องเบิก', 150], ['หน่วย', 90], ['คงเหลือในคลัง', 140], ['ไม่พอ', 110]];
const whCars = (k) => Object.keys(A_ALL).map(Number).filter(i => A_ALL[i] === k);
const whParts = (k) => quarterParts(whCars(k), A_PICKS).map(r => { const st = +PARTS.find(p => p[0] === r[0])[5], need = +r[3]; return [r[0], r[1], r[3], r[4], String(st), need > st ? String(need - st) : '-']; });
async function warehouseScreen(name, o) {   // o.q = แท็บที่เปิด · o.acked = ไตรมาสที่รับทราบแล้ว
  o = o || {};
  const q = o.q || 1, rows = whParts(q), acked = o.acked || [], done = acked.indexOf(q) >= 0;
  const { scr, page } = await shell(name, { title: 'อะไหล่ที่ต้องเบิกรายไตรมาส', back: true, crumbs: ['แผนที่ต้องเตรียมอะไหล่', NP[1]], badge: wst(acked.length) });
  const sec = col('Section', [await sectionLabel('อะไหล่ที่ต้องเบิกรายไตรมาส'), await tabs(QUARTERS.map((t, k) => [t, whParts(k + 1).length]), q - 1)], 16);
  if (done) add(sec, alertBox('Success', 'รับทราบไตรมาส ' + q + ' แล้ว 02/11/2569', 'หน่วยงานเห็นสถานะนี้ในหน้ารายการและหน้ารายละเอียดแผน'), 'h');
  if (rows.length) add(sec, await tblShort(WH_PART_COLS, rows), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ไม่มีอะไหล่ที่ต้องเบิก'); await text(es, 'Supporting text', 'ไตรมาสนี้ไม่มียานพาหนะในแผน ไม่ต้องรับทราบ'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  const nodes = [await vehicleInfo(npKv(), 'รายละเอียดแผน'), sec];
  if (rows.length && !done) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบไตรมาส ' + q, { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S19 แก้ไขแผน · S20 ลบแผน (30 ต.ค. 2569 · ยึดบล็อก C D ของ Overhaul) ----------
   แก้ไข: รออนุมัติ · ส่งกลับแก้ไข · อนุมัติแล้ว แล้วส่งอนุมัติใหม่ทุกครั้ง (เจ้าของงาน "แก้ไขแล้วมีอนุมัติ อยากให้ใส่ไปก่อน")
   ลบ: เฉพาะก่อนอนุมัติ · ไม่มียกเลิกแผน (เจ้าของงาน "ยกเลิกแผนไม่ต้องมีก็ได้") · ทำไม่ได้ในสถานะนั้น = ซ่อน ไม่ disable */
const planAs = (st) => NP.slice(0, 5).concat([st], NP.slice(6));
const RETURN_REASON = 'จำนวนไส้กรองไฮดรอลิกไม่ตรงกับรอบบำรุงรักษาของกระเช้าแก้ไฟ กรุณาตรวจสอบยานพาหนะที่เลือกเข้าแผน';
const ALERT_RETURNED = ['Error', 'ผู้อนุมัติส่งกลับให้แก้ไข', RETURN_REASON];
const ALERT_APPROVED = ['Warning', 'แผนนี้อนุมัติแล้ว', 'เมื่อบันทึก แผนจะกลับเป็นสถานะรออนุมัติ และต้องให้ผู้อนุมัติตรวจสอบอีกครั้ง'];
/* S21 จัดการอะไหล่ของรถ (หน้าแยก · section น้ำมันไฮดรอลิก + อะไหล่อื่นๆ · ปรับ 5 พ.ย. 2569 เจ้าของงาน "อยากให้จัดการสิ่งที่ต้องทำของรถแต่ละคัน เช่น รถตันนี้ ต้องเปลี่ยนน่ำมันไฮดรอลิก
   รถตันนี้ต้องเก็บตัวอย่างน้ำมันไฮดรอลิก น้ำมันเบอร์อะไร รหัสอะไร ใช้กี่ลิตร ต้องเปลี่ยนใส้กรอง ระบุ ชื่อ ยี่ห้อกรอง รุ่นกรอง รหัสกรอง เป็นต้น")
   เข้าจากไอคอนแก้ไขที่แถวรถในแท็บไตรมาส n ของฟอร์ม S1/S19 · น้ำมันไฮดรอลิก = Radio text card 3 ใบ (JOB_OIL_OPTS แบบหน้างานรายคัน S10) + Input dropdown เบอร์น้ำมัน · Text input รหัส · จำนวน (ลิตร) · เปลี่ยนล่าสุด Readonly
   อะไหล่อื่นๆ = PartsInventoryPanel (คลังอะไหล่ของงานซ่อม · เลือก/เลือกแล้ว) + ตาราง Table ของไลบรารี ชื่อ · ยี่ห้อ · รุ่น · รหัส · จำนวน · หน่วย · แก้ไข ลบ
   ⚠ RequestedPartsPanel / Spare Part Card Item ของงานซ่อมไม่มีช่องยี่ห้อ รุ่น (การ์ดที่เลือกมีแค่ ชื่อ · รหัส · หน่วย · ราคา · การ์ดเพิ่มเอง Text input 3 ช่อง รายละเอียด · รหัส · ราคา) และ instance เพิ่มช่องไม่ได้
     ⇒ รายการของรถคันนี้ใช้ Table · ระบุอะไหล่เพิ่มเติมใช้ Modal Type=Form (Card form row 3 แถว × Input 1/Input 2 = 6 ช่อง) ซึ่งเป็นแบบสำรองเดิมของหน้านี้ (มือถือ / ไฟล์ไม่มีแผงงานซ่อม) — รอเจ้าของงานเคาะ */
const Q_CARS = Object.keys(A_ALL).map(Number).filter(i => A_ALL[i] === 1), CAR_ADD = CAR_PICK.concat([4]);   // รถของไตรมาสที่เปิดจากฟอร์ม · ไส้กรองที่เลือก (น้ำมันแยกเป็นส่วนของตัวเอง)
const PART_BM = [['PTT', 'Hydraulic AW 46'], ['Donaldson', 'P550388'], ['Sakura', 'C-1809'], ['Sakura', 'A-1033'], ['Isuzu', '8-98159693-0']];   // ยี่ห้อ · รุ่น ตามลำดับ PARTS (ค่าสมมติ)
const MANUAL_BM = { brand: 'Fleetguard', model: 'AF25550', unit: 'ชิ้น' };
const OIL_GRADES = ['ISO VG 32', 'ISO VG 46', 'ISO VG 68'];
const CARP_PART_COLS = [['ชื่อ', 0, 'Lead text'], ['ยี่ห้อ', 140], ['รุ่น', 160], ['รหัส', 130], ['จำนวน', 90], ['หน่วย', 90], ['', 104]];
const MANUAL_FIELDS = (m) => [{ pair: [{ label: 'ชื่ออะไหล่', value: m.name, placeholder: 'ระบุชื่ออะไหล่' }, { label: 'ยี่ห้อ', value: m.brand, placeholder: 'ระบุยี่ห้อ' }] },
  { pair: [{ label: 'รุ่น', value: m.model, placeholder: 'ระบุรุ่น' }, { label: 'รหัสอะไหล่', value: m.code, placeholder: 'ระบุรหัสอะไหล่', optional: true }] },
  { pair: [{ label: 'จำนวน', value: m.qty ? String(m.qty) : '', placeholder: '0' }, { label: 'หน่วย', value: m.unit, placeholder: 'ระบุหน่วย' }] }];
async function carWarehouse(picked) {   // คลังอะไหล่ของงานซ่อม (PartsInventoryPanel) เฉพาะไส้กรองและอะไหล่ (ไม่รวมน้ำมันไฮดรอลิกที่มีส่วนของตัวเอง) · ไม่มี component / มือถือ = ไม่มีแผง
  if (MOB || !has('PartsInventoryPanel')) return null;
  const inv = inst('PartsInventoryPanel'); inv.name = 'PartsInventoryPanel';
  const sh = find(inv, 'Section header');
  if (sh) { setProps(sh, { Title: 'คลังอะไหล่', 'Supporting text': true, 'More actions': false, Badge: false, Actions: false }); await text(sh, 'Supporting text', 'ไส้กรองและอะไหล่จาก Smart Inventory และ คลังสำรอง'); }
  const ti = find(inv, 'Text input'); if (ti) setProps(ti, { Text: 'ค้นหาชื่อหรือรหัสอะไหล่', Label: false, Helper: false, 'Info icon': false });
  const cards = inv.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
  for (const [k, c] of cards.entries()) {
    const i = k + 1; if (!PARTS[i]) { c.visible = false; continue; }
    setProps(c, { Suggestion: false, Select: picked.indexOf(i) >= 0, Add: picked.indexOf(i) < 0, 'จัดซื้อเพิ่ม': false, 'เลือกผู้จัดซื้อ': false });
    await fillPartCard(c, i, { stock: PARTS[i][5] });
  }
  return inv;
}
/* โหมดหลายคัน (R112 · เจ้าของงาน 11 พ.ย. 2569 "อยากเพิ่มอะไหล่ครั้งเดียวในรถประเภทเดียวกัน" + "ทุกคันที่เลือกได้มั้ย คือต้องเลือกรถที่ต้องการเพิ่มอะไหล่" ทำเว็บก่อน BACKLOG 64
   + 13 พ.ย. 2569 "ต้องระบุอะใหล่รายคันให้ครบ ... วิธีการเพิ่มอะใหล่ในรถรุ่นเดียวกัน และหลายคันได้" เลือกแบบติ๊กหลายคัน ทำได้ที่แท็บทั้งหมดและแท็บไตรมาส)
   o.cars = [ลำดับยานพาหนะที่ติ๊ก] (≥ 2) · หน้าเดียวกับรายคัน แทนช่องเลือกยานพาหนะด้วย Section header "ยานพาหนะที่เลือก" + Badge + Table (ทะเบียน บรรทัดรอง ยี่ห้อ/รุ่น · ประเภท · เปลี่ยนน้ำมันครั้งล่าสุด · น้ำมันไฮดรอลิก · อะไหล่อื่นๆ ที่กำหนดไว้ตอนนี้)
   · Alert Warning เมื่อยานพาหนะที่เลือกมีหลายรุ่น (ยี่ห้อ/รุ่นต่างกัน · เว็บเดิมเตือนต่างประเภท) และเมื่อบางคันกำหนดอะไหล่ไว้แล้ว (บันทึก = แทนค่าเดิม) — Alert ของไฟล์ Component แบบ Alert ของหน้าคลังรับทราบ (qPartsAlert)
   · ช่องเปลี่ยนน้ำมันครั้งล่าสุดอยู่ในตาราง (คนละค่าต่อคัน) · ปุ่ม "บันทึกอะไหล่ของยานพาหนะ k คัน" · o.cur = { picks, oils, draw } ค่าที่กำหนดไว้ก่อนเปิดหน้า */
const CARP_SEL_COLS = [['ทะเบียน', 260], ['ประเภทยานพาหนะ', 160], ['เปลี่ยนน้ำมันครั้งล่าสุด', 190], ['น้ำมันไฮดรอลิก', 0], ['อะไหล่อื่นๆ', 200]];
async function carPartsScreen(name, o) {
  o = o || {};
  const car = CAND[0], multi = o.cars && o.cars.length > 1 ? o.cars : null;
  const { scr, page } = await shell(name, { title: multi ? 'จัดการอะไหล่ของยานพาหนะ ' + multi.length + ' คัน' : 'จัดการอะไหล่ของยานพาหนะ ' + car[0], back: true, crumbs: ['สร้างแผน', 'จัดการอะไหล่ของยานพาหนะ'] });
  const f = dropdown('ยานพาหนะ', car[0], { placeholder: o.from === 'all' ? 'เลือกยานพาหนะในแผน' : 'เลือกยานพาหนะในไตรมาสนี้', lead: 'search-24-300-round', state: o.carOpen ? 'Focused' : undefined });   // 13 พ.ย. 2569 ไฟล์ 34 ข้อ 3 (ก): เปิดจากแท็บทั้งหมด (o.from 'all') คันนั้นอาจยังไม่จัดไตรมาส ⇒ "เลือกยานพาหนะในแผน" รายการ = ทุกคันในแผน
  const top = [];
  if (multi) {
    const cur = o.cur || {}, cp = cur.picks || {}, co = cur.oils || {}, cd = cur.draw || {};
    const isSet = (i) => cd[i] === 'none' || (cp[i] || []).length > 0;
    const rows = multi.map(i => [{ text: CAND[i][0], sub: CAND[i][1] }, typeOf(CAND[i]), lastOil(CAND[i][0]), oilCell(co[i]), cd[i] === 'none' ? 'ไม่เบิกอะไหล่' : partCell(partList(i, cp, []))]);
    const models = new Set(multi.map(i => CAND[i][1])).size, done = multi.filter(isSet).length;
    top.push(col('Section', [await section('ยานพาหนะที่เลือก', { badge: multi.length + ' คัน' }), await tblShort(CARP_SEL_COLS, rows)], 16));
    if (models > 1) top.push(alertBox('Warning', 'ยานพาหนะที่เลือกมีหลายรุ่น', 'น้ำมันและอะไหล่ที่กำหนดในหน้านี้จะใช้กับทุกคันที่เลือก ตรวจสอบว่าใช้ได้กับทุกรุ่น'));
    if (done) top.push(alertBox('Warning', 'ยานพาหนะ ' + done + ' คันกำหนดอะไหล่ไว้แล้ว', 'บันทึกแล้วน้ำมันและอะไหล่ของทุกคันที่เลือกจะเป็นชุดนี้แทนของเดิม'));
  } else top.push(MOB ? f : row('Row', [f, frame('Spacer', 'VERTICAL')]));
  const k = o.oil == null ? 0 : o.oil;   // ค่าเริ่มต้นเก็บตัวอย่าง (S21 เดิม) · 0 เก็บตัวอย่าง · 1 เปลี่ยนน้ำมัน · 2 เก็บตัวอย่างและเปลี่ยน
  const oil = await radioPick('น้ำมันไฮดรอลิก', JOB_OIL_OPTS, k);
  const sp = o.oilSpec || {};
  const grade = dropdown('เบอร์น้ำมัน', sp.grade || '', { placeholder: 'เลือกเบอร์น้ำมัน', state: o.gradeOpen ? 'Focused' : undefined });
  const fields = [grade, field('รหัสน้ำมัน', sp.code, { placeholder: 'ระบุรหัสน้ำมัน' }), field('จำนวน (ลิตร)', sp.litre, { placeholder: '0' })];
  if (k === 1 || k === 2) add(oil, row('Row', fields), 'h');   // เบอร์ รหัส ลิตร เมื่อเปลี่ยนน้ำมัน
  const last = field('เปลี่ยนน้ำมันครั้งล่าสุด', lastOil(CAND[0][0]), { state: 'Readonly' });
  if (!multi) add(oil, MOB ? last : row('Row', [last, frame('Spacer', 'VERTICAL'), frame('Spacer', 'VERTICAL')]), 'h');   // หลายคัน = อยู่ในตารางยานพาหนะที่เลือก
  const picked = (o.picked || []).filter(i => i !== 0);
  /* 6 พ.ย. 2569 เจ้าของงาน "อยากเพิ่มการเบิก โดยอยากให้มีการเลือกว่า ว่าเบิกอะใหล่ หรือไม่เบิก ด้วย" + "บังคับให้กรอกอะใหล่ทุกคัน"
     ⇒ Radio text card 2 ใบ "การเบิกอะไหล่" แบบผลการพิจารณา (decisionSection) · ไม่มีค่าเริ่มต้น ต้องเลือกเอง · ไม่เบิก = ซ่อนคลังอะไหล่และรายการอะไหล่อื่นๆ คันนี้ไม่รวมในอะไหล่ในไตรมาส
     ปุ่ม "บันทึกอะไหล่ของรถ" กดได้เมื่อเลือกไม่เบิก หรือเลือกเบิกแล้วมีอะไหล่อย่างน้อย 1 รายการ · o.draw = 'take' | 'none' (เลือกอะไหล่แล้ว = เบิก) */
  const dsel = o.draw === 'none' ? 1 : (o.draw === 'take' || picked.length || (o.manual && o.manual.filled)) ? 0 : -1;
  const drawSec = await radioPick('การเบิกอะไหล่', [['เบิกอะไหล่', 'เลือกอะไหล่ที่ต้องเบิกให้' + (multi ? 'ยานพาหนะที่เลือก' : 'ยานพาหนะคันนี้')], ['ไม่เบิกอะไหล่', (multi ? 'ยานพาหนะที่เลือก' : 'ยานพาหนะคันนี้') + 'ไม่ใช้อะไหล่จากการเบิก']], dsel, { label: true });
  const canSave = dsel === 1 || (dsel === 0 && (picked.length > 0 || !!(o.manual && o.manual.filled)));
  const rows = picked.map(i => [PARTS[i][0], PART_BM[i][0], PART_BM[i][1], PARTS[i][1], String(CAR_QTY[i]), PARTS[i][4], { icons: ['stylus-24-300-round', 'delete-24-300-round'] }])
    .concat(o.manual && o.manual.filled ? [[MANUAL.name, MANUAL_BM.brand, MANUAL_BM.model, MANUAL.code || '-', String(MANUAL.qty), MANUAL_BM.unit, { icons: ['stylus-24-300-round', 'delete-24-300-round'] }]] : []);
  const list = col('Section', [await section('อะไหล่อื่นๆ', { badge: rows.length || null, buttons: [{ kind: 'Secondary button', text: 'ระบุอะไหล่เพิ่มเติม', icon: 'add-24-300-round' }] })], 16);
  add(list, rows.length ? await tblShort(CARP_PART_COLS, rows) : await noParts('เลือกไส้กรองหรืออะไหล่อื่นจากคลัง หรือกดระบุอะไหล่เพิ่มเติม'), 'h');
  add(page, col('Content', top.concat([drawSec, oil], dsel === 0 ? [await carWarehouse(picked), list] : [], [
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกอะไหล่ของยานพาหนะ' + (multi ? ' ' + multi.length + ' คัน' : ''), { size: 'lg', disabled: !canSave }]])]), 32), 'h');
  if (o.carOpen) comboAt(scr, f.findOne(n => n.name === 'Container') || f, o.from === 'all' ? Object.keys(o.alloc || A_Q1).map(Number).map(i => [CAND[i][0], (o.alloc || A_Q1)[i] ? 'ไตรมาส ' + (o.alloc || A_Q1)[i] : 'ยังไม่จัดไตรมาส', i === 0]) : Q_CARS.map(i => [CAND[i][0], '', i === 0]));   // แท็บทั้งหมด = ทุกคันในแผน บรรทัดรองบอกไตรมาส
  if (o.gradeOpen) comboAt(scr, grade.findOne(n => n.name === 'Container') || grade, OIL_GRADES.map(g => [g, '', g === sp.grade]));
  if (o.manual && !o.manual.filled) await formModal(scr, { title: 'ระบุอะไหล่เพิ่มเติม', fields: MANUAL_FIELDS(o.manual.values || {}), ok: 'เพิ่ม' });
  return scr;
}
/* เมนู … → ดูรายละเอียด (6 พ.ย. 2569) — อะไหล่ของยานพาหนะคันนั้น ดูอย่างเดียว · หน้า Detail ⇒ Section label (R3) + กล่องข้อมูล (R12) แบบหน้ารายละเอียดอื่นของบล็อก
   ข้อมูลชุดเดียวกับหน้าจัดการอะไหล่ (carPartsScreen) · ปุ่ม "แก้ไข" ที่ Page header ไปหน้าจัดการอะไหล่ (แบบ planDetail) · ตารางไม่มีไอคอนท้ายแถว */
async function carPartsView(name, i, o) {
  o = o || {};
  const car = CAND[i], picks = (o.picks || A_PICKS)[i] || [], oil = (o.oils || A_OILS)[i], none = (o.draw || A_DRAW)[i] === 'none';
  const { scr, page } = await shell(name, { title: 'อะไหล่ของยานพาหนะ ' + car[0], back: true, crumbs: ['สร้างแผน', 'อะไหล่ของยานพาหนะ'], actions: [['Secondary button', 'แก้ไข', 'stylus-24-300-round']] });
  const kv = [['ทะเบียน', car[0]], ['ประเภทยานพาหนะ', typeOf(car)], ['ยี่ห้อ/รุ่น', car[1]], ['หน่วยงานเจ้าของยานพาหนะ', car[2]], ['ไตรมาส', 'ไตรมาส ' + ((o.alloc || A_ALL)[i] || '-')],
    ['น้ำมันไฮดรอลิก', oil == null ? TODO_NONE : JOB_OIL_OPTS[oil] + (oil ? ' · ' + OIL_SPEC.grade + ' · ' + OIL_SPEC.litre + ' ลิตร' : '')], ['เปลี่ยนน้ำมันครั้งล่าสุด', lastOil(car[0])], ['การเบิกอะไหล่', none ? 'ไม่เบิกอะไหล่' : 'เบิกอะไหล่']];
  const rows = none ? [] : picks.filter(x => x !== 0).map(x => [PARTS[x][0], PART_BM[x][0], PART_BM[x][1], PARTS[x][1], String(CAR_QTY[x]), PARTS[x][4]]);
  const list = col('Section', [await sectionLabel('อะไหล่อื่นๆ (' + rows.length + ')')], 16);
  add(list, rows.length ? await tblShort(CARP_PART_COLS.slice(0, 6), rows) : await noParts(none ? 'ยานพาหนะคันนี้เลือกไม่เบิกอะไหล่' : 'ยังไม่ได้กำหนดอะไหล่ของยานพาหนะคันนี้'), 'h');
  add(page, col('Content', [await vehicleInfo(kv, 'ข้อมูลยานพาหนะ'), list], 32), 'h');
  return scr;
}
const EDIT_FORM = Object.assign({ edit: true, values: FILLED, alloc: A_ALL, picks: A_PICKS, oils: A_OILS, draw: A_DRAW, q: 1 }, R2);   // prefill แท็บไตรมาส 1 พร้อมสิ่งที่ต้องทำรายคัน (5 พ.ย. 2569)
const EDIT_CONFIRM = { title: 'ยืนยันการแก้ไข', sub: 'แผนจะกลับเป็นสถานะรออนุมัติ และส่งให้ผู้อนุมัติตรวจสอบอีกครั้ง โปรดตรวจสอบก่อนยืนยัน', cancel: 'ยกเลิก', ok: 'ยืนยัน' };
// AREA_CONFIRM (ยืนยันเอารถของเขตที่เอาออก) เลิกใช้ 5 พ.ย. 2569 — รีวิว "หากมีการลบ Filter ใดก็ตาม จะไม่ส่งผลเกี่ยวต่อรถที่ถูกเลือกเข้าในไตรมาส"
// PART_REMOVE_CONFIRM (ยืนยันเอาอะไหล่ออกจากทุกคันในไตรมาส) เลิกใช้ 5 พ.ย. 2569 — อะไหล่ในไตรมาสรวมจากรถทีละคัน ไม่มีไอคอนลบที่แถว แก้ลบอะไหล่ทีละคันที่หน้า S21
const DELETE_CONFIRM = { danger: true, title: 'ยืนยันการลบแผน', sub: 'เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่', cancel: 'ยกเลิก', ok: 'ยืนยัน' };
function planMenu(scr, items) {   // เมนู "…" ตามสถานะแผน · ไลบรารีมีเส้นคั่นก่อนรายการที่ 3 ⇒ น้อยกว่า 3 รายการต้องซ่อนเส้นคั่น
  const m = menuAt(scr, firstMenuCell(scr), items);
  if (!m) return null;   // มือถือ: ไอคอนดู แก้ไข ลบ อยู่บนการ์ดแล้ว ไม่เปิดเมนู (4 พ.ย. 2569)
  if (items.length < 3) { const d = (find(m, 'Menu items') || m).children[3]; if (d) d.visible = false; }
  return m;
}
async function planDetail(name, o) {   // หน้ารายละเอียดแผนฝั่ง กบค. · ก่อนอนุมัติมี ลบแผน + แก้ไข · อนุมัติแล้วเหลือแก้ไข · o.readonly = ไม่มีปุ่ม (S1 รออนุมัติ ดูอย่างเดียว · เจ้าของงาน 5 พ.ย. 2569) · มีอะไหล่ในแผนทุกสถานะ (planBody · 9 พ.ย. 2569)
  o = o || {};
  const st = o.status || 'review';
  let actions = [['Secondary button', 'แก้ไข', 'stylus-24-300-round']];
  if (st === 'returned') actions.unshift(['Secondary danger button', 'ลบแผน', 'delete-24-300-round']);   // 13 พ.ย. 2569 ไฟล์ 34 ข้อ 6: ลบได้เฉพาะแผนส่งกลับแก้ไข (S20)
  if (o.readonly || st === 'review') actions = null;   // แผนรออนุมัติดูอย่างเดียวทุกที่ (ไฟล์ 34 ข้อ 6 · เจ้าของงาน 5 พ.ย. 2569)
  const { scr, page } = await shell(name, { title: 'เลขที่ ' + NP[0], back: true, crumbs: [NP[1]], badge: PST[st], actions });
  const nodes = await planBody({ qBtn: st === 'approved' || st === 'active', plan: o.plan, readonly: !actions });   // ไม่มีปุ่มแก้ไข = ดูอย่างเดียว (รออนุมัติ · กบค. ดูแผนหน่วยงานอื่น · ไฟล์ 34 ข้อ 5)   // o.plan = แผนของเรื่องย่อย A1 (R108)
  if (st === 'returned') nodes.unshift(alertBox(...ALERT_RETURNED));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ทางเข้าหน้าไตรมาส (S6 · 5 พ.ย. 2569 รีวิว "เพิ่ม Flow การเข้าจากหน้า บำรุงรักษาตามวาระ มาจนถึงหน้า แผนเดินทาง") — เจ้าของงานเคาะ: เมนู → รายการแผน → รายละเอียดแผนที่อนุมัติแล้ว → กดไตรมาส 1 → หน้า "ไตรมาส 1"
   หน้ารายละเอียดแผน P (ดำเนินการ) เนื้อหาแบบ planBody: กล่องรายละเอียดแผน + Section label "รถในแผน (n)" + Tabs ไตรมาส + Table · ปุ่มเข้าหน้าไตรมาส = Primary action ของ Section label (Tertiary brand button ของไลบรารี · ชื่อปุ่มเสนอ รอเคาะ)
   รถไตรมาส 1 = 10 คันของ S6 (TRIP_CARS) · ไตรมาสอื่นตามแผน P */
const Q_BTN = { kind: 'Primary button', text: 'ไปหน้า' + NOW_Q, icon: 'keyboard_arrow_right-20-400-round' };   // ปุ่มเข้าหน้าไตรมาส (Tertiary brand button ของ Section label)
const P_Q = (P[9].match(/: (\d+)/g) || []).map(x => +x.slice(2));
const P_COUNTS = [TRIP_CARS.length].concat(P_Q.slice(1));
/* อะไหล่ในแผนของแผน P (E.2 · 9 พ.ย. 2569 เจ้าของงาน "หน้าอื่นที่ต้องมีอะใหล่รวม หรืออะใหล่แต่ละไตรมาส ก็ต้องมี section อะใหล่ด้วยนะ")
   ไตรมาส 1 = PARTS ชุดเดียวกับอะไหล่ในไตรมาส 1 ของหน้าไตรมาส · ไตรมาส 2–4 ค่าสมมติตามสัดส่วนจำนวนยานพาหนะ (แผน P มีข้อมูลรายคันแค่ไตรมาส 1) · รวมทุกไตรมาส = ผลรวม 4 แท็บ */
const pQty = (k) => PARTS.map(p => Math.round(+p[3] * P_COUNTS[k - 1] / P_COUNTS[0]));
const pQParts = (k) => {
  const qty = k ? pQty(k) : PARTS.map((_, x) => [1, 2, 3, 4].reduce((a, j) => a + pQty(j)[x], 0));
  return PARTS.map((p, x) => [p[0], p[1], p[2], String(qty[x]), p[4]]).filter(r => +r[3] > 0).sort((a, b) => a[2].localeCompare(b[2], 'th'));
};
async function planDetailQ(name, o) {   // แผนที่อนุมัติแล้ว · แท็บ รายละเอียดแผน / ต้นทุนการบำรุงรักษา (S18 · 10 พ.ย. 2569) · o.tab · o.empty
  o = o || {};
  const counts = P_COUNTS, tab = o.tab || 0;
  const { scr, page } = await shell(name, { title: 'เลขที่ ' + P[0], back: true, crumbs: [P[1]], badge: PST.active, actions: tab === 1 ? (!o.empty ? [COST_EXPORT_BTN] : undefined) : o.view ? undefined : [['Secondary button', 'แก้ไข', 'stylus-24-300-round']] });   // R113 แผนดำเนินการแล้วแก้ไขได้ (เว็บ detail/page.tsx) · o.view = กบค. ดูแผนหน่วยงานอื่น
  add(page, await tabs(PLAN_TABS.map(t => [t, null]), tab), 'h');
  if (tab === 1) { add(page, col('Content', await costBody(o), 32), 'h'); return scr; }
  add(page, col('Content', [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ยานพาหนะในแผน', { badge: counts.reduce((a, b) => a + b, 0), buttons: [Q_BTN] }),
      await tabs(QUARTERS.map((t, k) => [t, counts[k]]), 0),
      await tblShort(CARP_COLS.slice(0, 6), TRIP_CARS.map((c, i) => [c[0], c[1], c[2], JOB_OIL_OPTS[TRIP_OIL[i]], lastOil(c[0]), (i % 4) + 1 + ' รายการ']))], 16),
    await planPartsSec(0, pQParts)], 32), 'h');
  return scr;
}

/* ---------- S3 ผพจ. ออกเลขงาน · หัวหน้า ผพจ. ตรวจรายการอะไหล่ · ใบ PO ---------- */
const PO_ITEMS = [1, 4].map(i => [PARTS[i][0], PARTS[i][1], String(shortOf(i)), PARTS[i][4], baht(PRICE[i]), baht(shortOf(i) * PRICE[i])]);
const PO_TOTAL = [1, 4].reduce((a, i) => a + shortOf(i) * PRICE[i], 0);
const PO_KV = [['เลขที่ PO', 'PO-2570-0158'], ['วันที่ PO', '24/10/2569'], ['ผู้ขาย', 'บริษัท ไทยลูบริแคนท์ ซัพพลาย จำกัด'], ['วงเงิน', baht(PO_TOTAL)]];
async function planIssue(name, o) {   // แผนอนุมัติแล้ว ฝั่ง ผพจ. — ก่อน/หลังออกเลขงาน · หลังบันทึก PO
  o = o || {};
  const job = o.job ? NO_NEW : '';
  const { scr, page } = await shell(name, { title: job ? 'หมายเลขแผน ' + job : 'แผนรอออกเลขงาน', back: true, crumbs: ['แผนอนุมัติแล้ว', job || NP[1]], badge: PST.approved,
    actions: job ? undefined : [['Primary button', 'ออกเลขงาน']] });
  const nodes = [await vehicleInfo(npKv(job), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('รายการอะไหล่ที่ต้องใช้', { badge: PARTS.length }), await tblShort(PART_CHECK_COLS, partCheckRows())], 16)];
  if (o.po) nodes.push(col('Section', [await sectionLabel('ใบสั่งซื้ออะไหล่ (PO)'), kv(PO_KV), await tblShort([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 100], ['หน่วย', 90], ['ราคาต่อหน่วย', 150], ['รวม', 150]], PO_ITEMS)], 16));
  else if (job) nodes.push(alertBox(o.sent ? 'Info' : 'Brand', o.sent ? 'ส่งรายการอะไหล่ให้หัวหน้า ผพจ. ตรวจสอบแล้ว' : 'ออกเลขงาน ' + job + ' แล้ว', o.sent ? 'หัวหน้า ผพจ. อนุมัติแล้วจึงทำเรื่องซื้ออะไหล่และออกใบ PO' : 'ส่งรายการอะไหล่ให้หัวหน้า ผพจ. ตรวจสอบก่อนจัดซื้อ'));
  if (job && !o.sent && !o.po) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งให้หัวหน้า ผพจ. ตรวจสอบ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
async function headPartCheck(name) {   // หัวหน้า ผพจ. ตรวจรายการอะไหล่
  const { scr, page } = await shell(name, { title: 'ตรวจรายการอะไหล่ · ' + NO_NEW, back: true, crumbs: ['รายการอะไหล่รอตรวจ', NO_NEW], badge: ['รอหัวหน้า ผพจ. ตรวจ', 'Warning'] });
  add(page, col('Content', [await vehicleInfo(npKv(NO_NEW), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('รายการอะไหล่ที่จะใช้ในแผน', { badge: PARTS.length }), await tblShort(PART_CHECK_COLS, partCheckRows()),
      alertBox('Warning', 'ต้องซื้อเพิ่ม 2 รายการ รวม ' + baht(PO_TOTAL), 'ไส้กรองไฮดรอลิก 9 ชิ้น · ไส้กรองเชื้อเพลิง 14 ชิ้น')], 16),
    btnRow([['Secondary button', 'ส่งกลับ', { size: 'lg' }], ['Primary button', 'อนุมัติรายการอะไหล่', { size: 'lg' }]])], 32), 'h');
  return scr;
}
async function poForm(name) {   // ฟอร์มใบ PO — ช่องทั้งหมดยังไม่รู้ (ไฟล์ 14 S3) ใช้ชุดที่เสนอ
  const { scr, page } = await shell(name, { title: 'บันทึกใบสั่งซื้ออะไหล่ (PO)', back: true, crumbs: ['หมายเลขแผน ' + NO_NEW, 'ใบ PO'] });
  add(page, col('Content', [
    col('Section', [await section('ข้อมูลใบสั่งซื้อ'), row('Row', [field('เลขที่ PO', PO_KV[0][1]), field('วันที่ PO', PO_KV[1][1])]),
      row('Row', [dropdown('ผู้ขาย', PO_KV[2][1], { lead: 'search-24-300-round' }), field('วงเงิน (บาท)', PO_TOTAL.toLocaleString('en-US'))])], 16),
    col('Section', [await section('รายการอะไหล่ที่สั่งซื้อ', { badge: PO_ITEMS.length }), await tblShort([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 100], ['หน่วย', 90], ['ราคาต่อหน่วย', 150], ['รวม', 150]], PO_ITEMS)], 16),
    col('Section', [await section('เอกสารแนบ'), await upload('ใบสั่งซื้อ (PO)', [pdf('PO-2570-0158.pdf', '310 KB')], { hint: 'PDF, JPG · สูงสุด 10 ไฟล์' })], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกใบ PO', { size: 'lg' }]])], 32), 'h');
  return scr;
}

/* ---------- S7 ผู้รับจ้างทำแผนเดินทาง · S8 กบค. ตรวจแผนเดินทางของผู้รับจ้าง ---------- */
const HIRE = PLANS[1];   // แผนที่ว่าจ้าง (MRZ7000002 รถเครน ภาค 2)
const CONTRACTOR = 'บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด';
const TRIP_ST = { none: ['ยังไม่สร้าง', 'Gray'], wait: ['รอหน่วยงานตรวจสอบ', 'Warning'], ok: ['อนุมัติแล้ว', 'Success'], rej: ['ปฏิเสธ', 'Error'] };
const HTRIP = { place: 'จุดรวมงาน กฟฉ.2 อุบลราชธานี', d1: '10/11/2569', d2: '13/11/2569' };
const JOBS_COLS = [['เลขที่ MR', 140, 'Lead text'], ['แผน', 0], ['ไตรมาส', 100], ['จำนวนยานพาหนะ', 110], ['แผนเดินทาง', 180, 'Badge'], ['', 60]];
const jobsRows = (st) => [[HIRE[0], HIRE[1], HIRE[3], HIRE[4] + ' คัน', { pill: TRIP_ST[st] }, GO], ['MRZ6900014', 'บำรุงรักษารถพ่วงฉีดน้ำ ภาค 2 ปีงบประมาณ 2569', 'ไตรมาส 4', '5 คัน', { pill: TRIP_ST.ok }, GO]];
async function hireTripForm(name, o) {   // ช่องเดียวกับ S6 ยกเว้นพนักงาน กบค. และค่าใช้จ่าย (ไฟล์ 14 S7)
  o = o || {};
  const v = o.filled ? HTRIP : {}, E = (m) => o.errors ? m : '';
  const { scr, page } = await shell(name, { title: 'สร้างแผนเดินทาง', back: true, crumbs: ['งานที่ได้รับว่าจ้าง', HIRE[0], 'สร้างแผนเดินทาง'] });
  const sel = o.filled ? [0, 1, 4] : [];
  const car = await carPick('เลือกยานพาหนะที่จะบำรุงรักษา', CARS, sel, { error: sel.length ? '' : E('กรุณาเลือกยานพาหนะที่จะบำรุงรักษาอย่างน้อย 1 คัน') });
  add(page, col('Content', [await vehicleInfo([['เลขที่ MR', HIRE[0]], ['แผน', HIRE[1]], ['ไตรมาส', HIRE[3]], ['ผู้รับจ้าง', CONTRACTOR]], 'งานที่ได้รับว่าจ้าง'),
    col('Section', [await section('รายละเอียดแผนเดินทาง'), row('Row', [
      dropdown('สถานที่บำรุงรักษา (จุดรวมงาน)', v.place, { placeholder: 'ค้นหาจุดรวมงาน', lead: 'search-24-300-round', error: E('กรุณาเลือกสถานที่บำรุงรักษา') }),
      field('วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม') }), field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') })])], 16),
    car.sec,
    alertBox('Info', 'ยืนยันแล้วระบบส่งแผนให้หน่วยงานตรวจสอบ และแจ้งเจ้าของยานพาหนะ + กรย.', 'ส่งแจ้งเตือนก่อนหรือหลังหน่วยงานอนุมัติ ยังไม่เคาะ'),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันและส่งให้หน่วยงานตรวจสอบ', { size: 'lg' }]])], 32), 'h');
  return scr;
}
const HT_COLS = [['ผู้รับจ้าง', 0, 'Lead text'], ['แผน', 150], ['ยานพาหนะ (คัน)', 100], ['จุดรวมงาน', 260], ['ช่วงวัน', 220], ['วันที่ส่ง', 120], ['', 60]];
const HT_ROWS = { wait: [[CONTRACTOR, HIRE[0], '3', HTRIP.place, HTRIP.d1 + ' – ' + HTRIP.d2, '24/10/2569', GO], ['หจก. ช่างกลภาคอีสาน', 'MRZ7000005', '4', 'จุดรวมงาน กฟฉ.3 นครราชสีมา', '17/11/2569 – 20/11/2569', '25/10/2569', GO]],
  ok: [[CONTRACTOR, 'MRZ6900014', '5', 'จุดรวมงาน กฟฉ.2 อุบลราชธานี', '05/08/2569 – 08/08/2569', '20/07/2569', GO]], rej: [] };
async function hireTripReview(name, o) {   // กบค. ดูรายละเอียดแผนเดินทางของผู้รับจ้าง
  o = o || {};
  const { scr, page } = await shell(name, { title: 'แผนเดินทาง · ' + CONTRACTOR, back: true, crumbs: ['แผนเดินทางผู้รับจ้าง', HIRE[0]], badge: TRIP_ST[o.st || 'wait'] });
  const nodes = [await vehicleInfo([['ผู้รับจ้าง', CONTRACTOR], ['เลขที่ MR', HIRE[0]], ['แผน', HIRE[1]], ['วันที่ส่ง', '24/10/2569'], ['จุดรวมงาน', HTRIP.place], ['ช่วงวันเดินทาง', HTRIP.d1 + ' – ' + HTRIP.d2], ['ยานพาหนะในแผนเดินทาง', '3 คัน']], 'รายละเอียดแผนเดินทาง'),
    col('Section', [await sectionLabel('ยานพาหนะที่จะบำรุงรักษา', { badge: 3 }), await tblShort([['ทะเบียน', 170, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของยานพาหนะ', 220]], [0, 1, 4].map(i => [VEH[i][0], VEH[i][1], VEH[i][2]]))], 16),
    btnRow([['Secondary button', 'ปฏิเสธ', { size: 'lg' }], ['Primary button', 'อนุมัติแผนเดินทาง', { size: 'lg' }]])];
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S9 กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน ---------- */
const PREP = { new: ['ยังไม่รับทราบ', 'Gray'], ack: ['รับทราบแล้ว', 'Info'], ready: ['เตรียมแล้ว', 'Success'] };
const PREP_COLS = [['เลขที่ MR', 140, 'Lead text'], ['ผู้ดำเนินการ', 0], ['จุดรวมงาน', 260], ['วันเดินทาง', 140], ['สถานะ', 160, 'Badge'], ['', 60]];
const prepRows = (st) => [[P[0], UNITS[0] + ' (ตรวจเอง)', TRIP.place, TRIP.d1, { pill: PREP[st] }, GO], [HIRE[0], CONTRACTOR, HTRIP.place, HTRIP.d1, { pill: PREP.new }, GO]];
async function prepDetail(name, o) {
  o = o || {};
  const st = o.st || 'new';
  const { scr, page } = await shell(name, { title: 'เตรียมอะไหล่ · ' + P[0], back: true, crumbs: ['แผนเดินทางที่ต้องเตรียมอะไหล่', P[0]], badge: PREP[st] });
  const nodes = [await vehicleInfo([['เลขที่ MR', P[0]], ['ผู้ดำเนินการ', UNITS[0] + ' (ตรวจเอง)'], ['จุดรวมงาน', TRIP.place], ['ช่วงวันเดินทาง', TRIP.d1 + ' – ' + TRIP.d2]], 'แผนเดินทาง'),
    col('Section', [await sectionLabel('อะไหล่ที่ต้องวางที่จุดรวมงาน', { badge: PARTS.length }), await tblShort([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 110], ['หน่วย', 90], ['คลัง', 180]], PARTS.map((p, i) => [p[0], p[1], p[3], p[4], WH[i]]))], 16)];
  if (st === 'ready') nodes.push(alertBox('Success', 'เตรียมอะไหล่ไว้ที่จุดรวมงานแล้ว 02/11/2569', 'หน่วยงานเห็นสถานะนี้ที่แผนเดินทาง (S6/S10)'));
  else if (st === 'ack') nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกว่าเตรียมแล้ว', { size: 'lg' }]]));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบแผน', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S13 ผู้ดูแลยานพาหนะ รับทราบผลและประเมินความพึงพอใจรายคัน (เจ้าของงาน 10 พ.ย. 2569) ----------
   Q23 "มีแค่ปุ่มยอมรับ เหมือนปุ่มรับทราบ" · Q19 "บำรุงรักษาไม่ได้ ใช้ฟอร์มเดียวกัน" · Q28 "รอบเดียวพอ คือรอบที่ส่งรายคัน หลังจากบำรุงเสร็จ" (S14 S15 ตัดออก)
   ผู้กด = ผู้มีชื่อเป็นผู้ดูแลยานพาหนะในแผนเดินทาง แม้เจ้าของแผนกับเจ้าของยานพาหนะเป็นหน่วยงานเดียวกัน ("คนทำแผนกับคนปฏิบัติอาจจะเป็นคนละคน") · แจ้งเตือนเรื่องยานพาหนะส่งถึงผู้ดูแลยานพาหนะ
   ประเมินความพึงพอใจรายคันย้ายจาก S14 มาไว้ตอนรับทราบ · ปุ่ม "รับทราบ" สีเขียว ("อยากใช้คำกลางๆ แล้วเปลี่ยนสี เป็นสีเขียว") กดแล้วปุ่มหาย เหลือป้าย "รับทราบแล้ว" ไม่มี popup ยืนยัน
   ผลที่แสดง = ที่ผู้ดำเนินการบันทึกใน S10 (ข้อมูลงาน · ผลตรวจสภาพ Step 1 + ลงนาม · ภาพ · งานและอะไหล่ที่ใช้จริง) แทนไฟล์ PDF แบบเดิม · คันที่บำรุงรักษาไม่ได้ = ฟอร์มเดียวกัน ส่วนสาเหตุแทนผลงาน ไม่มีประเมิน (เสนอ ยังไม่เคาะ) */
const ACC_COLS = [['ทะเบียน', 0, 'Lead text'], ['วันดำเนินการ', 140], ['ผู้ดำเนินการ', 220], ['แผนเดินทาง', 260], ['สถานะ', 160, 'Badge'], ['', 60]];
const ACK_CARS = [JOB_I, TRIP_1.sel[1], TRIP_1.sel[2]];   // ยานพาหนะที่ผู้ดูแลคนนี้ดูแล (ตัวอย่าง) · sel[2] = MOVE_I คันที่บำรุงรักษาไม่ได้ (ประกาศทีหลัง)
const ACK_LIST = 'ผลการบำรุงรักษารอรับทราบ';
const accRows = (o) => {
  o = o || {};
  return ACK_CARS.map((i, k) => { const c = TRIP_CARS[i]; return [{ text: c[0], sub: typeOf(c) }, '0' + (4 + k) + '/11/2569', { text: TRIP.staff[k % TRIP.staff.length], sub: UNITS[0] },
    { text: JOB_T.name, sub: P[0] }, { pill: (o.accepted || []).indexOf(k) >= 0 ? ACC.ok : ACC.wait }, GO]; });   // คันที่บำรุงรักษาไม่ได้ก็รอรับทราบเหมือนกัน (Q19 ฟอร์มเดียวกัน)
};
const ackList = (name, o) => roleList(name, { title: ACK_LIST, search: 'ค้นหาทะเบียน, แผนเดินทาง', cols: ACC_COLS, rows: accRows(o) });
const NOTI_ACK = ['Brand', 'ปิดงานบำรุงรักษา ' + TRIP_CARS[JOB_I][0] + ' แล้ว รอผู้ดูแลยานพาหนะรับทราบผล', '5 นาทีที่แล้ว'];   // 13 พ.ย. 2569 ไฟล์ 34 ข้อ 22 (ก): ไม่มี "และประเมินความพึงพอใจ" ทุกกรณี (ประเมินเป็นเรื่องแยก) · ข้อความชุดเดียวกับเว็บ
/* S12 ผลตรวจน้ำมันไฮดรอลิกไม่ผ่าน → แจ้งผู้ดูแลยานพาหนะของคันนั้น ทางกระดิ่งในระบบ (เจ้าของงาน 13 พ.ย. 2569 "ผลตรวจน้ำมันไม่ผ่านต้องส่งเตือนหาเจ้าของรถด้วย" · R115)
   จุดสถานะ Error · กดแล้วเปิดรายละเอียดยานพาหนะคันนั้น แท็บประวัติการบำรุงรักษาเครื่องจักร (เว็บ oilFailNoti) · ผลผ่านไม่ส่ง · ข้อความผู้บันทึก (toast) คงเดิม */
const NOTI_OIL_FAIL = ['Error', 'ผลตรวจน้ำมันไฮดรอลิก ' + TRIP_CARS[JOB_I][0] + ' ไม่ผ่าน', '5 นาทีที่แล้ว'];
let ACK_VAR;
async function ackRow(off) {   // ย้อนกลับ + รับทราบ (เขียว) — Primary button ของไฟล์ Component พื้นผูกตัวแปร Color/surface/success (#17B26A) + ไอคอนนำ check-24-300-round
  // ตามปุ่ม "ตรวจแล้ว" / "ขึ้น SAP แล้ว" ของหน้า 5.14 - 5.15 Cost & Expense Check · UI Release#2 · Disabled (ยังไม่ประเมิน) = State=Disabled ของไลบรารี ไม่ทาเขียว
  const r = btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบ', { size: 'lg', icon: 'check-24-300-round', disabled: !!off }]]);
  const b = r.children.find(c => c.name === 'Primary button');
  if (b && !off) {
    if (ACK_VAR === undefined) ACK_VAR = await libVar(/^Color\/surface\/success$/i);
    let paint = { type: 'SOLID', color: rgbOf('#17B26A') };
    if (ACK_VAR) try { paint = figma.variables.setBoundVariableForPaint(paint, 'color', ACK_VAR); } catch (e) { /* ใช้ค่าสี */ }
    try { b.fills = [paint]; } catch (e) { warn('สีปุ่มรับทราบ', e); }
  }
  return r;
}
async function ackResult(name, o) {   // o.cannot · o.done = รับทราบแล้ว · o.viewOnly = บทบาทอื่นเปิดดู (ไม่มีปุ่มรับทราบ)
  o = o || {};
  const i = o.cannot ? MOVE_I : JOB_I, c = TRIP_CARS[i];
  const { scr, page } = await shell(name, { title: 'ผลการบำรุงรักษา · ' + c[0], back: true, crumbs: [ACK_LIST, c[0]], badge: o.done ? ACC.ok : ACC.wait });   // คันที่บำรุงรักษาไม่ได้ก็รอรับทราบ (สาเหตุอยู่ในเนื้อหา)
  const job = o.cannot ? [['วันดำเนินการ', TRIP_1.d1], ['ผู้แจ้ง', JOB_BY], ['แจ้งเมื่อ', '05/11/2569 09:20 น.']]
    : [['วันดำเนินการ', '04/11/2569'], ['เริ่มงาน', JOB_START], ['ปิดงาน', JOB_END], ['ผู้ดำเนินการ', JOB_BY], ['น้ำมันไฮดรอลิก', JOB_OIL_OPTS[JOB_OIL]], ['เลขไมล์หลังทำ', '182,640 กม.']];
  const nodes = [await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภทยานพาหนะ', typeOf(c)], ['หน่วยงานเจ้าของยานพาหนะ', c[2]], ['แผนเดินทาง', JOB_T.name], ['เลขที่ MR', P[0]],
    ['ผู้ดูแลยานพาหนะ', tripCtrl(i, TRIP_1.phones)]].concat(job).concat(o.done ? [['รับทราบเมื่อ', '06/11/2569 10:05 น.']] : []), 'ข้อมูลยานพาหนะและงาน')];
  if (o.cannot) nodes.push(col('Section', [await sectionLabel('สาเหตุที่บำรุงรักษาไม่ได้'), kv([['สาเหตุ', JOB_CANNOT], ['ผู้บันทึก', JOB_BY], ['วันที่บันทึก', '05/11/2569']])], 16));
  else {
    nodes.push(col('Section', [await sectionLabel('ผลการตรวจสภาพก่อนบำรุงรักษา')].concat(await inspectStep(c, true, true)), 16),
      await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
      col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tblShort(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16),
      );   // 11 พ.ย. 2569 รอบต่อมา: ไม่มีการประเมินในหน้านี้แล้ว · 12 พ.ย. 2569 แบบประเมินความพึงพอใจเป็นเรื่องแยก (satisfaction-plugin R105 · Diagram/09-ประเมินความพึงพอใจ)
  }
  if (!o.done) nodes.push(o.viewOnly ? btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }]]) : await ackRow(false));   // รับทราบอย่างเดียว กดได้ทันที (11 พ.ย. 2569) · บทบาทอื่น = ย้อนกลับอย่างเดียว (Permission S13)
  /* 12 พ.ย. 2569 รอบ 2 (ตามต้นแบบเว็บ acceptance/car/page.tsx · BACKLOG ข้อ 77): รับทราบแล้ว (ผู้ดูแลยานพาหนะ · ไม่ใช่คันที่บำรุงรักษาไม่ได้ · ยังไม่ได้ประเมิน) ปุ่ม Primary "ประเมินความพึงพอใจ" แทนที่ปุ่มรับทราบ
     → ฟอร์มประเมินของงานนี้ในเมนูแบบประเมินความพึงพอใจ (satisfaction-plugin B.1) · ประเมินแล้วปุ่มหาย · ตาม Primary button ของไฟล์ Component + แถวปุ่มท้ายหน้าแบบหน้า 5.14 - 5.15 Cost & Expense Check ของ UI Release#2 (ปุ่มรับทราบเดิม) */
  else if (!o.viewOnly && !o.cannot && !o.hire) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ประเมินความพึงพอใจ', { size: 'lg', icon: has('star-24-300-round') ? 'star-24-300-round' : null }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
/* ---------- S27 แบบประเมินความพึงพอใจ (บล็อก Y เดิม · R94 11 พ.ย. 2569) ย้ายออก 12 พ.ย. 2569 ----------
   เจ้าของงาน 12 พ.ย. 2569 "เรื่องการประเมินเป็นเรื่องแยกที่จะไปผูกตาม flow ต่างๆ เลยอยากแยกใว้" ⇒ ปลั๊กอินแยก figma-export/satisfaction-plugin/ (R105)
   เอกสาร Diagram/09-ประเมินความพึงพอใจ/ · ยานพาหนะที่ผู้ดูแลรับทราบผลแล้ว (S13) เข้ารายการยังไม่ได้ประเมินของเรื่องนั้น 1 งาน 1 แถว · ตัวอักษร Y ว่าง (BLOCK_OF) */
/* planEvidence (S14 หลักฐานทั้งแผน + ยอมรับผลทั้งแผน) เอาออก 10 พ.ย. 2569 — S14 ตัดออก ประเมินย้ายไป S13 รายคัน */

/* S16 headHistory (หัวหน้าหน่วยงาน ตรวจประวัติ) เอาออก 10 พ.ย. 2569 — S16 ตัดออก */

/* ---------- S25 กบค. ย้ายรถที่บำรุงรักษาไม่ได้ไปไตรมาสอื่น (เจ้าของงาน 5 พ.ย. 2569) ----------
   เจ้าของงาน: "จะเรื่องรถที่บำรุงไม่ได้ ต้องมีหน้าที่สามารถเอาไปใส่ในไตรมาสอื่นๆได้ด้วย ช่วยออกแบบ scen นี้ให้หน่อย คือ scen ที่รถออกนอกจากไตรมาสเดิม เลือกเข้าไตรมาสใหม่"
   ทางเข้า = หน้าไตรมาส (S6 tripList) แถวรถที่สถานะงาน "บำรุงรักษาไม่ได้" (Table cell Badge WSTAT.cannot แทนชื่อแผนเดินทาง) + ปุ่ม "…" เมนูเดียว "ย้ายไปไตรมาสอื่น"
     ตาม Dropdown menu เมนูเดียว "คืนยานพาหนะ" ของ Request list หน้า 5.10 Vehicle In Use (EV) ของ UI Release#2 · ไอคอนรถสลับ แบบปุ่ม "โอนย้ายสังกัด" หน้า 5.4 Maintenance Appointment (Admin)
   มือถือ = Mobile table item Style=Action buttons ปุ่มเดียว (การ์ด Incident list v1 หน้า Vehicle Breakdown ของ UI Release#2 "ดูรายละเอียด") — ไอคอนดู แก้ไข ลบ (R50) ไม่มีช่องให้คำนี้
   ไตรมาส 4 (ไตรมาสสุดท้ายของแผน) = รายการเมนู _Dropdown menu item State=Disabled · ปุ่มบนการ์ด Secondary button State=Disabled (ไลบรารีมี Disabled ทั้งคู่ ⇒ แสดงแต่กดไม่ได้ ไม่ซ่อน)
   popup = popupModal แบบ popup บำรุงรักษาไม่ได้ (S10): ข้อมูลรถ + สาเหตุ (Content item row) · Radio text card ไตรมาส 1–4 เรียงลงแบบ popup จัดลงไตรมาส (S1) ไตรมาสก่อนหน้าและไตรมาสปัจจุบัน State=Disabled · ตารางอะไหล่ตามแผนที่ย้ายไปด้วย
   ยืนยัน = confirm แบบ EDIT_CONFIRM · สำเร็จ = กลับหน้าไตรมาสเดิม รถคันนั้นออกจากตาราง + toast ขวาบน (R60) · ไตรมาสใหม่ รถขึ้นก่อน บรรทัดรอง "ย้ายมาจากไตรมาส 1" ยังไม่มีแผนเดินทาง · ไม่ต้องอนุมัติใหม่ (ตามเพิ่มรถเข้าไตรมาส) */
const MOVE_ICON = 'swap_driving_apps_wheel-24-300-round';
const MOVE_ITEM = ['ย้ายไปไตรมาสอื่น', MOVE_ICON];
/* 10 พ.ย. 2569 เจ้าของงาน "s25 ตัวเลือกต้องสามารถเลือก ดำเนินการบำรุงรักษา และ ย้ายไปไตรมาสอื่น" + เคาะ "กลับเป็นรอเข้าแผนเดินทางในไตรมาสเดิม"
   ⇒ เมนู "…" ของยานพาหนะที่บำรุงรักษาไม่ได้มี 2 รายการ · ดำเนินการบำรุงรักษา = ยืนยัน แล้วยานพาหนะกลับเป็น "ยังไม่มีแผนเดินทาง" ในไตรมาสเดิม ใส่แผนเดินทางใบใหม่แล้วบำรุงรักษาตามปกติ (S6 S10) */
const MAINT_ITEM = ['ดำเนินการบำรุงรักษา', 'car_repair-24-300-round'];
const MAINT_CONFIRM = () => ({ title: 'ยืนยันดำเนินการบำรุงรักษา · ' + MOVE_CAR[0], sub: MOVE_CAR[0] + ' จะกลับเป็นยานพาหนะที่ยังไม่มีแผนเดินทางใน' + NOW_Q + ' เพื่อเพิ่มเข้าแผนเดินทางแล้วบำรุงรักษาตามปกติ', cancel: 'ยกเลิก', ok: 'ยืนยัน' });   // ฟังก์ชัน: MOVE_CAR ประกาศทีหลัง
const MAINT_TOAST = () => 'นำ ' + MOVE_CAR[0] + ' กลับมาบำรุงรักษาใน' + NOW_Q + ' แล้ว';
const MOVE_I = TRIP_1.sel[2], MOVE_CAR = TRIP_CARS[MOVE_I];   // คันที่บำรุงรักษาไม่ได้ใน S10 (JOB_MIX) = 80-9981 ลำปาง
const MOVE_JOB = { [MOVE_CAR[0]]: 'cannot' };
const qName = (k) => QUARTERS[k].split(' (')[0];   // ลำดับ 0–3 → "ไตรมาส n"
const MOVE_TO = 1;   // ตัวอย่างเลือกไตรมาส 2
const MOVE_TOAST = 'ย้ายยานพาหนะ ' + MOVE_CAR[0] + ' ไป' + qName(MOVE_TO) + ' สำเร็จ';
const MOVE_CONFIRM = (k) => ({ title: 'ยืนยันการย้ายยานพาหนะไป' + qName(k), sub: MOVE_CAR[0] + ' จะออกจาก' + NOW_Q + ' ไปอยู่' + qName(k) + ' ของแผนนี้ พร้อมอะไหล่ตามแผนของยานพาหนะคันนี้', cancel: 'ยกเลิก', ok: 'ยืนยัน' });
/* อะไหล่ที่ย้ายไปด้วย (10 พ.ย. 2569) = ตาราง QPART_COLS ชุดเดียวกับอะไหล่ในไตรมาส n ที่รับยอดนี้ไป (R81 · เดิม 3 คอลัมน์ อะไหล่ตามแผน จำนวนตามแผน หน่วย) · แถวตาม WORK ของยานพาหนะคันที่ย้าย */
const movePartRows = () => WORK.map((w, k) => { const p = PARTS[MOVE_PART_OF[k]] || [w[1], '-', '-']; return [p[0], p[1], p[2], w[2], w[4]]; });
/* รถเดิมของไตรมาส 2 (P_Q[1] = 3 คัน · ค่าสมมติ) ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · เบอร์ · ชื่อผู้ดูแลยานพาหนะ */
const MOVE_Q2 = [['81-7702 ลำปาง', 'Isuzu FTR + กระเช้า Aichi SK12A', 'กฟน.1 ลำปาง', '054-217-411', 'นายไพโรจน์ ดวงใจ'], ['82-5530 เชียงราย', 'Hino FC + กระเช้า Tadano AT-100', 'กฟน.1 เชียงราย', '053-711-930', 'นายศักดิ์ชัย ทองแท้'],
  ['80-1189 น่าน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.2 น่าน', '054-710-551', 'นายมานพ ศรีเมือง']];
const MOVE_Q3_OTHER = ['81-3348 พะเยา', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.1 พะเยา', '054-411-206', 'นายเอกชัย พรหมมา'];
const moveTrip = (k, d1, d2) => ({ name: 'ตรวจยานพาหนะ ลำปาง ' + qName(k), sel: [MOVE_I], locs: {}, phones: {}, d1, d2, st: 'approved' });
const MOVE_T3 = moveTrip(2, '12/08/2570', '14/08/2570'), MOVE_T4 = moveTrip(3, '07/10/2570', '09/10/2570');   // 13 พ.ย. 2569 ไตรมาส 3 = ก.ค.–ก.ย. · ไตรมาส 4 = ต.ค.–ธ.ค. (ไตรมาสปฏิทิน เจ้าของงาน 6 พ.ย. 2569 · เดิม พ.ค. และ ก.ค.)   // กรณีรถคันเดียวกันบำรุงรักษาไม่ได้ในไตรมาส 3 / 4
/* อะไหล่ที่ต้องเบิกของไตรมาส 2 หลังย้าย = ของรถเดิม 3 คัน (ค่าสมมติ) + อะไหล่ตามแผนของรถที่ย้ายมา (WORK) · บรรทัดรองบอกส่วนที่มากับรถ */
const MOVE_Q2_BASE = [30, 6, 6, 6, 2];
const MOVE_PART_OF = WORK.map(w => PARTS.findIndex(p => p[0] === w[1]));
const MOVE_Q2_QTY = MOVE_Q2_BASE.map((n, i) => { const k = MOVE_PART_OF.indexOf(i); return n + (k >= 0 ? +WORK[k][2] : 0); });
const MOVE_Q2_SUBS = Object.fromEntries(MOVE_PART_OF.map((i, k) => [i, 'รวม ' + WORK[k][2] + ' ' + WORK[k][4] + ' ของ ' + MOVE_CAR[0] + ' ที่ย้ายมา']));
/* 9 พ.ย. 2569 (เว็บเจอตอนตาม Figma): X.8 กับ X.9 เป็นหน้าไตรมาส 2 หน้าเดียวกัน ⇒ ยานพาหนะและอะไหล่ในไตรมาสชุดเดียวกัน (MOVE_Q2_QTY · เดิม X.8 ใช้ยอดไตรมาส 1 ของ PARTS · X.9 เรียก moveQuarter(…, 2) ได้หน้าไตรมาส 3)
   ไตรมาส 3 และ 4 (กรณี X.5 X.10) = อะไหล่ตามแผนของยานพาหนะคันที่ย้าย (WORK) + ไส้กรอง 3 รายการของ 81-3348 พะเยา ในไตรมาส 3 (ค่าสมมติ) */
const MOVE_Q2_PAGE = { q: qName(MOVE_TO), cars: [[MOVE_CAR.concat([OWNER_PH[MOVE_I], CTRL_NAME[MOVE_I]]), -1]].concat(MOVE_Q2.map(c => [c, -1])), subs: { [MOVE_CAR[0]]: 'ย้ายมาจาก' + NOW_Q }, parts: { qty: MOVE_Q2_QTY, subs: MOVE_Q2_SUBS } };
const MOVE_CAR_QTY = PARTS.map((_, i) => { const k = MOVE_PART_OF.indexOf(i); return k >= 0 ? +WORK[k][2] : 0; });
const MOVE_Q3_QTY = MOVE_CAR_QTY.map((n, i) => n + (CAR_PICK.indexOf(i) >= 0 ? CAR_QTY[i] : 0));
function moveMenu(scr, row, off) {   // เมนู "…" ใต้ปุ่มของแถวที่ row (ลำดับแถวในตารางรถของไตรมาส) · off = ไตรมาสสุดท้าย รายการกดไม่ได้
  const cells = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Table cell' && n.variantProperties && n.variantProperties.Style === 'Action icons');
  const m = menuAt(scr, cells[row], [MAINT_ITEM, MOVE_ITEM]);   // 10 พ.ย. 2569 ดำเนินการบำรุงรักษา + ย้ายไปไตรมาสอื่น
  if (!m) return null;   // มือถือ: ปุ่มอยู่บนการ์ดแล้ว (moveCard)
  const list = (find(m, 'Menu items') || m).children;
  if (list[3]) list[3].visible = false;   // 2 รายการ ไม่มีเส้นคั่น (แบบ planMenu)
  if (off && list[1]) setProps(list[1], { State: 'Disabled' });   // ไตรมาส 4: ย้ายไม่ได้ แต่ดำเนินการบำรุงรักษาได้
  return m;
}
function moveCard(scr, row, off) {   // มือถือ: ช่องท้ายการ์ดของแถว row → Style=Action buttons ปุ่มเดียว "ย้ายไปไตรมาสอื่น"
  const box = scr.findOne(n => n.type === 'FRAME' && n.name === 'Mobile table');
  const card = box && box.children[row]; if (!card) return;
  const it = card.children.filter(c => c.name === 'Mobile table item').pop(); if (!it) return;
  setProps(it, { Style: 'Action buttons' });
  setProps(it, { 'Action 2': true, 'Action 3': false, 'Action 4': false });   // 10 พ.ย. 2569 2 ปุ่ม ดำเนินการบำรุงรักษา · ย้ายไปไตรมาสอื่น
  const bs = it.findAll(n => n.type === 'INSTANCE' && n.name === 'Secondary button');
  if (bs[0]) setProps(bs[0], { Text: MAINT_ITEM[0], 'Leading icon': true, 'Leading icon swap': icon(MAINT_ITEM[1]), 'Trailing icon': false, State: 'Default' });
  if (bs[1]) setProps(bs[1], { Text: MOVE_ITEM[0], 'Leading icon': true, 'Leading icon swap': icon(MOVE_ICON), 'Trailing icon': false, State: off ? 'Disabled' : 'Default' });
}
/* popup ย้ายไปไตรมาสอื่น · o.cur = ไตรมาสปัจจุบัน (0–3) · o.sel = ไตรมาสที่เลือก (-1 ยังไม่เลือก · ปุ่ม Disabled) · o.trip = แผนเดินทางที่บำรุงรักษาไม่ได้ */
async function moveModal(scr, o) {
  const cur = o.cur || 0, sel = o.sel == null ? -1 : o.sel;
  // 10 พ.ย. 2569 + ประเภทยานพาหนะต่อจากทะเบียน (R82 ทุกที่ที่แสดงยานพาหนะมีประเภท · แบบตอนตรวจตามประเภท R86)
  const info = kv([['ทะเบียน', MOVE_CAR[0]], ['ประเภทยานพาหนะ', typeOf(MOVE_CAR)], ['หน่วยงานเจ้าของยานพาหนะ', MOVE_CAR[2]], ['แผนเดินทาง', (o.trip || JOB_T).name], ['สาเหตุที่บำรุงรักษาไม่ได้', JOB_CANNOT]], 2);
  const r = col('Radio', [], 12);
  QUARTERS.forEach((t, k) => add(r, inst('Radio text card', { State: k <= cur ? 'Disabled' : 'Default', Selected: k === sel ? 'True' : 'False' },
    { Text: t, Supporting: true, 'Supporting text': k < cur ? 'ไตรมาสก่อนหน้า' : k === cur ? 'ไตรมาสปัจจุบัน' : 'ยานพาหนะในไตรมาส ' + P_Q[k] + ' คัน' }), 'h'));
  const parts = col('Section', [await section('อะไหล่ตามแผนที่ย้ายไปด้วย', { badge: WORK.length }), await tblShort(QPART_COLS, movePartRows())], 16);
  await popupModal(scr, { title: 'ย้ายไปไตรมาสอื่น · ' + MOVE_CAR[0], sub: 'ยานพาหนะและอะไหล่ตามแผนของยานพาหนะคันนี้จะย้ายไปไตรมาสที่เลือก', w: 800, ok: 'ย้ายยานพาหนะ', okOff: sel < 0,
    body: [info, col('Section', [await section('เลือกไตรมาสที่จะย้ายไป'), r], 16), parts] });
}
/* หน้าไตรมาสของ S25: q = ลำดับไตรมาส (0 = ไตรมาส 1 ข้อมูลของ S6) */
async function moveQuarter(name, q, o) {
  o = o || {};
  if (q === 1) return tripList(name, Object.assign({}, MOVE_Q2_PAGE, o));   // หน้าไตรมาส 2 หลังย้าย (X.8 X.9)
  if (q === 2) return tripList(name, Object.assign({ q: qName(2), cars: [[MOVE_CAR, MOVE_I], [MOVE_Q3_OTHER, -1]], trips: [MOVE_T3], jobs: MOVE_JOB, parts: { qty: MOVE_Q3_QTY } }, o));
  if (q === 3) return tripList(name, Object.assign({ q: qName(3), cars: [[MOVE_CAR, MOVE_I]], trips: [MOVE_T4], jobs: MOVE_JOB, moveOff: true, parts: { qty: MOVE_CAR_QTY } }, o));
  return tripList(name, Object.assign({ trips: [JOB_T], jobs: MOVE_JOB }, o));
}

/* ---------- รายการจอแยกตาม scenario (ชื่อ = scenario ใน 14-บำรุงรักษา-userflow.md) ---------- */
/* S1 เรื่องย่อย — ต้นแบบของการ export ราย scenario (R108 ฉบับ 2 · เจ้าของงาน 13 พ.ย. 2569 "ปรับเรื่อง scen ย่อย S1 ให้เรียบร้อยถูกต้อง และเข้าใจกันก่อน"
   + "เรื่องการ Export figma ที่ ทำ s1 ไปเป็นตัวอย่าง" · เคาะ: เห็นทางเข้า-ออก S21 · error เป็นเรื่องย่อยของตัวเอง · มุมบทบาทเป็นเรื่องย่อยที่มีเป้าหมาย)
   กติกา: 1 เรื่องย่อย = 1 เป้าหมายของผู้ใช้ · เริ่มจากจอที่บอกบริบท · จบที่ผลลัพธ์เสมอ (toast สำเร็จ หรือหน้าถัดไป) · ข้อมูลต่อเนื่องในเรื่อง (ยานพาหนะชุดเดียวกัน ตัวเลขเดินต่อ)
   · ไม่มีทางแยก ทางเลือกอื่นเป็นเรื่องย่อยแยกที่เดินจนจบ · error/เงื่อนไขแยกเรื่องละอัน บอกว่าเกิดที่ขั้นไหนและออกทางไหน
   ฉบับ 3 (13 พ.ย. 2569 R111 R112 แผน 2 ขั้น + กำหนดอะไหล่หลายคัน · เจ้าของงานเคาะรายการพร้อมแผนงาน)
   ลำดับกลุ่ม: เส้นหลัก (A1) → ทางเลือกตอนเพิ่มและกำหนดอะไหล่ (A2–A6) → จัดการยานพาหนะในแผน (A7–A10) → หลังส่งอนุมัติ (A11–A12) → มุมบทบาท (A13–A14) → error และเงื่อนไข (A15–A23)
   ข้อมูล: กบผ. สร้างแผน FILLED · ยานพาหนะ 82-6789 82-1145 82-3302 (ลำดับ 0 1 2) เข้าแผน → เข้าไตรมาส 1 · 82-1145 82-3302 รุ่นเดียวกัน (Hino FC) กำหนดอะไหล่ครั้งเดียว · อะไหล่ 0/3 → 2/3 → 3/3 */
const M_PANEL = { regions: [REGIONS[1]], districts: ['กฟฉ.1'], open: 'district' };   // แผงตัวกรองใน modal: ภาค 2 + กฟฉ.1 รายการเขตเปิด
const M_AREA = { regions: [REGIONS[1]], districts: ['กฟฉ.1'] };                       // กดตกลงแล้ว
const M_HQ = { regions: [REGIONS[4]], districts: ['กบค.'] };                           // ภาค สนง. + กอง กบค. (ยานพาหนะ 70-4415 ลำดับ 18 ของ PICK_POOL)
const HQ_CAR = 10 + Q_EXTRA.findIndex(c => c[2] === 'กบค.');
const A_PLAN3 = { 0: 0, 1: 0, 2: 0 };                                                      // 3 คันอยู่ในแผน ยังไม่จัดไตรมาส (R111)
const HINO = [1, 2];                                                                         // 82-1145 82-3302 รุ่นเดียวกัน Hino FC + กระเช้า Tadano AT-100
const P1 = { picks: { 0: CAR_ADD }, oils: { 0: 1 } };                                       // กำหนดอะไหล่แล้ว 1/3 (82-6789 ทีละคัน)
const P2H = { picks: { 1: CAR_ADD, 2: CAR_ADD }, oils: { 1: 1, 2: 1 } };                    // กำหนดอะไหล่ 2 คันรุ่นเดียวกันครั้งเดียว 2/3 (R112)
const P3H = { picks: { 0: CAR_PICK, 1: CAR_ADD, 2: CAR_ADD }, oils: { 0: 2, 1: 1, 2: 1 } };  // ครบ 3/3 หลังกำหนด 82-6789 ทีละคัน
const P3 = { picks: { 0: CAR_PICK, 1: CAR_PICK, 2: CAR_PICK }, oils: { 0: 2, 1: 0, 2: 2 } };   // ครบ 3/3
const IN3 = (o) => Object.assign({ values: FILLED, alloc: A_Q1 }, P3, o);
/* แผนที่ได้จากเส้นหลัก A1 (13 พ.ย. 2569 R108 ข้อมูลต่อเนื่อง): 3 คันในไตรมาส 1 อะไหล่ P3H — รายการแผนหลังส่ง (A1.18) และรายละเอียดรออนุมัติ (A1.19) ใช้ชุดนี้ ไม่กระโดดไปแผนตัวอย่าง 10 คัน */
const A1_ROW = NEW_PLAN.slice(0, 2).concat(['ภาค 2', 'ไตรมาส 1', '3'], NEW_PLAN.slice(5, 7), ['กระเช้าแก้ไฟ, กระเช้าฮอทไลน์', NEW_PLAN[8], 'ไตรมาส 1: 3 · ไตรมาส 2: 0 · ไตรมาส 3: 0 · ไตรมาส 4: 0']);
const A1_PLAN = { row: A1_ROW, alloc: A_Q1, picks: P3H.picks, oils: P3H.oils };
const NOPARTS_PLAN = { row: A1_ROW, alloc: A_Q1, picks: {}, oils: { 0: 0, 1: 0, 2: 0 }, draw: { 0: 'none', 1: 'none', 2: 'none' } };   // ไฟล์ 34 ข้อ 5: 3 คันเลือกไม่เบิกอะไหล่ทุกคัน (เก็บตัวอย่างน้ำมัน) ⇒ อะไหล่ในแผนว่าง                 // แผนที่มี 3 คันในไตรมาส 1 กำหนดอะไหล่ครบ (จุดเริ่มของเรื่องจัดการยานพาหนะ)
const Q1_OPEN = (o) => Object.assign({ values: FILLED, alloc: A_Q1, q: 1 }, o);              // 3 คันในไตรมาส 1 ยังไม่กำหนดอะไหล่ 0/3
const plus = (a, b) => Object.assign({}, a, b);
const IN4U = (o) => IN3(Object.assign({ alloc: plus(A_Q1, { 3: 0 }) }, o));                 // + 82-4410 (Isuzu FTR รุ่นเดียวกับ 82-6789) อยู่ในแผน ยังไม่จัดไตรมาส ยังไม่กำหนดอะไหล่
const U1 = (o) => IN3(Object.assign({ alloc: plus(A_Q1, { 3: 0 }), picks: plus(P3.picks, { 3: CAR_PICK }), oils: plus(P3.oils, { 3: 0 }) }, o));   // 82-4410 กำหนดอะไหล่แล้ว แต่ยังไม่จัดไตรมาส
const without = (a, i) => { const b = Object.assign({}, a); delete b[i]; return b; };
const FIRST_MENU = async (name, o) => { const s = await planForm(name, o); planMenu(s, Q_MENU); return s; };
const ALL_MENU = async (name, o) => { const s = await planForm(name, o); planMenu(s, MENU); return s; };   // เมนู … แท็บทั้งหมด (R111)
const toast = async (fn, msg) => { const s = await fn(); notify(s, msg); return s; };
const Q_MENU_LABEL = 'แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น เอาออกจากไตรมาส';
const S1_SUBS = [
  /* ---------- เส้นหลัก ---------- */
  ['สร้างแผนจนส่งอนุมัติ (เส้นหลัก)', [
    ['รายการแผน — กดสร้างแผน', () => listScreen('S1 รายการแผน', { rows: ownPlans(UNITS[0]) })],
    ['ฟอร์มสร้างแผน (ว่าง) — แท็บทั้งหมด ยังไม่มียานพาหนะในแผน', () => planForm('S1 ฟอร์มสร้างแผน', {})],
    ['เลือกปีงบประมาณ — กรอกชื่อแผนแล้ว รายการปีเปิด', () => planForm('S1 เลือกปีงบประมาณ', { values: { name: FILLED.name }, yearOpen: true })],
    ['กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน ยานพาหนะทุกคันที่ยังไม่อยู่ในแผน แผงตัวกรองกางอยู่', () => planForm('S1 modal เพิ่มยานพาหนะเข้าแผน', { values: FILLED, pick: {} })],
    ['เลือกภาค เขต ในแผงตัวกรอง — รายการเขตของภาคที่เลือก', () => planForm('S1 เลือกเขตในแผงตัวกรอง', { values: FILLED, pick: { filter: M_PANEL } })],
    ['กดตกลง — ตารางเหลือยานพาหนะของพื้นที่ที่เลือก', () => planForm('S1 modal กรองแล้ว', { values: FILLED, pick: M_AREA })],
    ['ติ๊กยานพาหนะ 3 คัน — ปุ่มเพิ่มเข้าแผน (3) กดได้', () => planForm('S1 ติ๊กยานพาหนะใน modal', { values: FILLED, pick: Object.assign({ ticked: [0, 1, 2] }, M_AREA) })],
    ['เพิ่มเข้าแผนสำเร็จ — แท็บทั้งหมด 3 คัน ยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติยังกดไม่ได้', () => toast(() => planForm('S1 เพิ่มเข้าแผนแล้ว', { values: FILLED, alloc: A_PLAN3 }), 'เพิ่มยานพาหนะ 3 คันเข้าแผนสำเร็จ')],
    ['เปิดแท็บไตรมาส 1 — ยังไม่มียานพาหนะในไตรมาสนี้ กดเพิ่มยานพาหนะเข้าไตรมาส 1', () => planForm('S1 แท็บไตรมาส 1 ว่าง', { values: FILLED, alloc: A_PLAN3, q: 1 })],
    ['กดเพิ่มยานพาหนะเข้าไตรมาส 1 — modal เฉพาะ 3 คันในแผนที่ยังไม่จัดไตรมาส', () => planForm('S1 modal เพิ่มยานพาหนะเข้าไตรมาส 1', { values: FILLED, alloc: A_PLAN3, q: 1, pick: {} })],
    ['ติ๊กยานพาหนะ 3 คัน — ปุ่มเพิ่มเข้าไตรมาส 1 (3) กดได้', () => planForm('S1 ติ๊กเข้าไตรมาส 1', { values: FILLED, alloc: A_PLAN3, q: 1, pick: { ticked: [0, 1, 2] } })],
    ['เพิ่มเข้าไตรมาส 1 สำเร็จ — แท็บไตรมาส 1 มี 3 คัน กำหนดอะไหล่แล้ว 0/3', () => toast(() => planForm('S1 เพิ่มเข้าไตรมาส 1 แล้ว', Q1_OPEN({})), 'เพิ่มยานพาหนะ 3 คันเข้าไตรมาส 1 สำเร็จ')],
    ['ค้นหา Hino FC แล้วติ๊ก 2 คันรุ่นเดียวกัน — ปุ่มกำหนดอะไหล่ (2)', () => planForm('S1 ติ๊กรุ่นเดียวกัน', Q1_OPEN({ query: 'Hino FC', ticked: HINO }))],
    ['หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง ปุ่มบันทึกกดได้', () => carPartsScreen('S1 อะไหล่ 2 คัน', { cars: HINO, draw: 'take', oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD })],
    ['บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 2/3', () => toast(() => planForm('S1 กำหนดอะไหล่ 2 คันแล้ว', Q1_OPEN(P2H)), 'บันทึกอะไหล่ของยานพาหนะ 2 คันแล้ว')],
    ['กดปุ่ม … ของ 82-6789 → แก้ไข — ไปหน้าจัดการอะไหล่ (S21)', () => FIRST_MENU('S1 เมนูแก้ไขอะไหล่', Q1_OPEN(P2H))],
    ['กลับจากหน้าจัดการอะไหล่ — กำหนดอะไหล่ครบ 3/3 ปุ่มบันทึกและส่งอนุมัติกดได้', () => toast(() => planForm('S1 ครบทุกคัน', Q1_OPEN(P3H)), 'บันทึกอะไหล่ของยานพาหนะ ' + CAND[0][0] + ' แล้ว')],
    ['บันทึกและส่งอนุมัติสำเร็จ — รายการแผน แผนใหม่รออนุมัติ', () => toast(() => listScreen('S1 บันทึกสำเร็จ', { rows: [A1_ROW].concat(ownPlans(UNITS[0])) }), 'ส่งแผนบำรุงรักษาเพื่ออนุมัติสำเร็จ')],
    ['รายละเอียดแผน — รออนุมัติ ดูอย่างเดียว', () => planDetail('S1 รายละเอียด รออนุมัติ', { status: 'review', readonly: true, plan: A1_PLAN })]]],
  /* ---------- ทางเลือกตอนเพิ่มยานพาหนะและกำหนดอะไหล่ (จบที่สำเร็จทุกเรื่อง) ---------- */
  ['เพิ่มยานพาหนะเข้าแผนด้วยการค้นหาทะเบียน', [
    ['แท็บทั้งหมด — มี 3 คันในไตรมาส 1 กดเพิ่มยานพาหนะ', () => planForm('S1 แท็บทั้งหมด สามคัน', IN3({}))],
    ['กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน แผงตัวกรองกางอยู่', () => planForm('S1 modal ค้นหา เปิด', IN3({ pick: {} }))],
    ['กดปุ่มตัวกรอง — แผงตัวกรองหุบ เหลือช่องค้นหาและตาราง', () => planForm('S1 modal หุบแผงตัวกรอง', IN3({ pick: { collapsed: true } }))],
    ['พิมพ์ค้นหา 82- — ตารางเหลือยานพาหนะที่ตรงคำค้น', () => planForm('S1 modal ค้นหา', IN3({ pick: { query: '82-', collapsed: true } }))],
    ['ติ๊กยานพาหนะ 82-4410 — ปุ่มเพิ่มเข้าแผน (1) กดได้', () => planForm('S1 modal ค้นหาแล้วติ๊ก', IN3({ pick: { query: '82-', ticked: [3], collapsed: true } }))],
    ['เพิ่มเข้าแผนสำเร็จ — แท็บทั้งหมด 4 คัน 82-4410 ยังไม่จัดไตรมาส', () => toast(() => planForm('S1 ค้นหาแล้วเพิ่ม', IN4U({})), 'เพิ่มยานพาหนะ 1 คันเข้าแผนสำเร็จ')]]],
  ['เพิ่มยานพาหนะของกองในสำนักงานใหญ่ (ภาค สนง.)', [
    ['กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน แผงตัวกรองกางอยู่', () => planForm('S1 modal สนง. เปิด', IN3({ pick: {} }))],
    ['เลือกภาค สนง. — รายการภาค มี สนง. (สำนักงานใหญ่)', () => planForm('S1 รายการภาค', IN3({ pick: { filter: { regions: [REGIONS[4]], open: 'region' } } }))],
    ['เลือกกองของ สนง. — รายการเขตเป็นกองของสำนักงานใหญ่', () => planForm('S1 เขตของ สนง.', IN3({ pick: { filter: { regions: [REGIONS[4]], districts: ['กบค.'], open: 'district' } } }))],
    ['กดตกลง — ตารางเหลือยานพาหนะของ กบค.', () => planForm('S1 modal สนง. กรองแล้ว', IN3({ pick: M_HQ }))],
    ['ติ๊กยานพาหนะ 70-4415 — ปุ่มเพิ่มเข้าแผน (1) กดได้', () => planForm('S1 modal สนง. ติ๊ก', IN3({ pick: Object.assign({ ticked: [HQ_CAR] }, M_HQ) }))],
    ['เพิ่มเข้าแผนสำเร็จ — แท็บทั้งหมดมียานพาหนะของ กบค. ยังไม่จัดไตรมาส', () => toast(() => planForm('S1 สนง. เพิ่มแล้ว', IN3({ alloc: plus(A_Q1, { [HQ_CAR]: 0 }) })), 'เพิ่มยานพาหนะ 1 คันเข้าแผนสำเร็จ')]]],
  ['จัดยานพาหนะเข้าไตรมาสที่ยังไม่มียานพาหนะ', [
    ['ไตรมาส 3 ยังไม่มียานพาหนะ — แผนมี 2 คันที่ยังไม่จัดไตรมาส', () => planForm('S1 ไตรมาส 3 ยังไม่มียานพาหนะ', IN3({ alloc: plus(A_Q1, { 3: 0, 5: 0 }), q: 3 }))],
    ['กดเพิ่มยานพาหนะเข้าไตรมาส 3 — modal แสดงเฉพาะ 2 คันที่ยังไม่จัด คันในไตรมาส 1 ไม่แสดง', () => planForm('S1 modal เพิ่มยานพาหนะเข้าไตรมาส 3', IN3({ alloc: plus(A_Q1, { 3: 0, 5: 0 }), q: 3, pick: {} }))],
    ['ติ๊กยานพาหนะ 2 คัน — ปุ่มเพิ่มเข้าไตรมาส 3 (2) กดได้', () => planForm('S1 ติ๊กยานพาหนะเข้าไตรมาส 3', IN3({ alloc: plus(A_Q1, { 3: 0, 5: 0 }), q: 3, pick: { ticked: Q3_ADD } }))],
    ['เพิ่มยานพาหนะเข้าไตรมาส 3 สำเร็จ — แท็บไตรมาส 3 มี 2 คัน', () => toast(() => planForm('S1 เพิ่มยานพาหนะเข้าไตรมาส 3 แล้ว', IN3({ alloc: plus(A_Q1, Object.fromEntries(Q3_ADD.map(i => [i, 3]))), q: 3 })), 'เพิ่มยานพาหนะ ' + Q3_ADD.length + ' คันเข้าไตรมาส 3 สำเร็จ')]]],
  ['กำหนดอะไหล่ทีละคัน', [
    ['แท็บไตรมาส 1 — 3 คัน กำหนดอะไหล่แล้ว 0/3 กดปุ่ม … ของ 82-6789 → แก้ไข', () => FIRST_MENU('S1 เมนูแก้ไขทีละคัน', Q1_OPEN({}))],
    ['หน้าจัดการอะไหล่ของยานพาหนะ 82-6789 — เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง', () => carPartsScreen('S1 อะไหล่ทีละคัน', { draw: 'take', oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD })],
    ['บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 1/3', () => toast(() => planForm('S1 กำหนดอะไหล่ 1 คัน', Q1_OPEN(P1)), 'บันทึกอะไหล่ของยานพาหนะ ' + CAND[0][0] + ' แล้ว')]]],
  ['กำหนดอะไหล่หลายคันจากแท็บทั้งหมด', [
    ['แท็บทั้งหมด — 4 คัน 82-4410 ยังไม่จัดไตรมาส ยังไม่กำหนดอะไหล่', () => planForm('S1 แท็บทั้งหมด สี่คัน', IN4U({}))],
    ['ค้นหา Isuzu FTR แล้วติ๊ก 2 คัน — คันในไตรมาส 1 กับคันที่ยังไม่จัด ปุ่มกำหนดอะไหล่ (2)', () => planForm('S1 แท็บทั้งหมด ติ๊กรุ่นเดียวกัน', IN4U({ query: 'Isuzu FTR', ticked: [0, 3] }))],
    ['หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — เตือน 1 คันกำหนดอะไหล่ไว้แล้ว บันทึกแล้วแทนของเดิม', () => carPartsScreen('S1 อะไหล่ 2 คัน แทนของเดิม', { cars: [0, 3], cur: P3, draw: 'take', oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD })],
    ['บันทึกสำเร็จ — แท็บทั้งหมด 2 คันได้อะไหล่ชุดเดียวกัน', () => toast(() => planForm('S1 แท็บทั้งหมด กำหนดอะไหล่แล้ว', IN4U({ picks: plus(P3.picks, { 0: CAR_ADD, 3: CAR_ADD }), oils: plus(P3.oils, { 0: 1, 3: 1 }) })), 'บันทึกอะไหล่ของยานพาหนะ 2 คันแล้ว')]]],
  /* ---------- จัดการยานพาหนะในแผน (เริ่มจากแท็บไตรมาส 1 ที่มี 3 คัน) ---------- */
  ['ย้ายยานพาหนะไปไตรมาสอื่น', [
    [Q_MENU_LABEL, () => FIRST_MENU('S1 เมนูของยานพาหนะ', IN3({ q: 1 }))],
    ['เมนู … → ย้ายไปไตรมาสอื่น — popup ยังไม่เลือกไตรมาส', () => planForm('S1 popup ย้ายไตรมาส', IN3({ q: 1, move: { car: 0, cur: 1 } }))],
    ['เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้', () => planForm('S1 เลือกไตรมาสที่จะย้าย', IN3({ q: 1, move: { car: 0, cur: 1, sel: 1 } }))],
    ['ย้ายสำเร็จ — แท็บไตรมาส 2 มี 82-6789 ตัวเลขบนแท็บเปลี่ยน', () => toast(() => planForm('S1 ย้ายไตรมาสแล้ว', IN3({ alloc: plus(A_Q1, { 0: 2 }), q: 2 })), 'ย้ายยานพาหนะ ' + CAND[0][0] + ' ไปไตรมาส 2 สำเร็จ')]]],   // 13 พ.ย. 2569 ไฟล์ 34 ข้อ 27 (ก): ใส่ทะเบียนแบบหน้าไตรมาส (MOVE_TOAST)
  ['เอายานพาหนะออกจากไตรมาส', [
    [Q_MENU_LABEL, () => FIRST_MENU('S1 เมนูของยานพาหนะ', IN3({ q: 1 }))],
    ['เมนู … → เอาออกจากไตรมาส — แท็บไตรมาส 1 เหลือ 2 คัน', () => toast(() => planForm('S1 เอาออกจากไตรมาสแล้ว', IN3({ alloc: plus(A_Q1, { 0: 0 }), q: 1 })), 'เอายานพาหนะออกจากไตรมาส 1 แล้ว')],
    ['แท็บทั้งหมด — 82-6789 ยังอยู่ในแผน ยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', () => planForm('S1 ยังไม่จัดหลังเอาออก', IN3({ alloc: plus(A_Q1, { 0: 0 }) }))],
    ['ติ๊กยานพาหนะ 82-6789 ใน modal เพิ่มยานพาหนะเข้าไตรมาส 2 — กลับมาให้เลือกได้ ปุ่มเพิ่มเข้าไตรมาส 2 (1) กดได้', () => planForm('S1 เลือกกลับเข้าไตรมาส 2', IN3({ alloc: plus(A_Q1, { 0: 0 }), q: 2, pick: { ticked: [0] } }))],
    ['เพิ่มเข้าไตรมาส 2 สำเร็จ — ทุกคันจัดเข้าไตรมาสแล้ว', () => toast(() => planForm('S1 เข้าไตรมาส 2 แล้ว', IN3({ alloc: plus(A_Q1, { 0: 2 }), q: 2 })), 'เพิ่มยานพาหนะ 1 คันเข้าไตรมาส 2 สำเร็จ')]]],
  ['ดูอะไหล่ของยานพาหนะในไตรมาส', [
    [Q_MENU_LABEL, () => FIRST_MENU('S1 เมนูของยานพาหนะ', IN3({ q: 1 }))],
    ['เมนู … → ดูรายละเอียด — อะไหล่ของยานพาหนะคันนี้ ดูอย่างเดียว', () => carPartsView('S1 ดูอะไหล่ของยานพาหนะ', 0)]]],
  ['ลบยานพาหนะออกจากแผน', [
    ['แท็บทั้งหมด — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ลบ', () => ALL_MENU('S1 เมนูแท็บทั้งหมด', IN3({}))],
    ['เมนู … → ลบ — ยืนยันการลบยานพาหนะออกจากแผน', async () => { const s = await planForm('S1 ยืนยันลบจากแท็บทั้งหมด', IN3({})); await confirm(s, PLAN_OUT_CONFIRM(CAND[0], 1)); return s; }],
    ['ลบสำเร็จ — แท็บทั้งหมดเหลือ 2 คัน', () => toast(() => planForm('S1 ลบจากแท็บทั้งหมดแล้ว', IN3({ alloc: without(A_Q1, 0) })), 'ลบยานพาหนะออกจากแผนสำเร็จ')]]],
  /* ---------- หลังส่งอนุมัติ ---------- */
  ['เปิดดูแผนที่อนุมัติแล้ว', [
    ['รายการแผน — กดเมนู … ดูรายละเอียดแผนที่อนุมัติแล้ว', () => listScreen('S1 รายการแผน', { rows: ownPlans(UNITS[0]) })],
    ['รายละเอียดแผน — อนุมัติแล้ว', () => planDetail('S1 รายละเอียด อนุมัติแล้ว', { status: 'approved' })]]],
  ['แผนถูกส่งกลับแก้ไข แล้วไปแก้ไขแผน (S19)', [
    ['รายการแผน — กดเมนู … ดูรายละเอียดแผนที่ส่งกลับแก้ไข', () => listScreen('S1 รายการแผน', { rows: ownPlans(UNITS[0]) })],
    ['รายละเอียดแผน — ส่งกลับแก้ไข เห็นเหตุผล กดแก้ไขไป S19', () => planDetail('S1 รายละเอียด ส่งกลับแก้ไข', { status: 'returned' })]]],
  /* ---------- มุมบทบาทอื่น ---------- */
  ['กบค. ตรวจแผนของกองอื่น', [
    ['กบค. — รายการแผนทุกหน่วยงาน สร้างแผนได้ แผนหน่วยงานอื่นดูอย่างเดียว', () => listScreen('S1 กบค. รายการแผน', { rows: [NEW_PLAN].concat(allPlans()), view: 'กบค.' })],
    ['รายการแผน — กดตัวกรอง แผงตัวกรอง เขต หน่วยงานหน้างาน (กบค.)', () => listScreen('S1 กบค. ตัวกรองรายการแผน', { rows: [NEW_PLAN].concat(allPlans()), view: 'กบค.', filter: { units: ['กบผ.'], open: 'unit' } })],
    ['กบค. — รายละเอียดแผนของหน่วยงานอื่น ดูอย่างเดียว', () => planDetail('S1 กบค. รายละเอียดแผน', { status: 'approved', readonly: true })]]],
  ['กองอื่นเห็นเฉพาะแผนของกองตัวเอง', [
    ['กปส. — รายการแผน เห็นเฉพาะแผนของ กปส. สร้างแผนได้', () => listScreen('S1 กปส. รายการแผน', { rows: ownPlans('กปส.') })],
    ['กรย. — รายการแผน เห็นเฉพาะแผนของ กรย. สร้างแผนได้', () => listScreen('S1 กรย. รายการแผน', { rows: ownPlans('กรย.') })]]],
  /* ---------- error และเงื่อนไข (เรื่องละอัน · เกิดที่ไหน ออกทางไหน) ---------- */
  ['ยังไม่มีแผน — เริ่มแผนแรก', [
    ['รายการแผน — ยังไม่มีแผน กดสร้างแผน', () => listScreen('S1 รายการว่าง', { empty: true })],
    ['ฟอร์มสร้างแผน (ว่าง) — แท็บทั้งหมด ยังไม่มียานพาหนะในแผน', () => planForm('S1 ฟอร์มสร้างแผน', {})]]],
  ['กรอกข้อมูลแผนไม่ครบ', [
    ['ฟอร์มสร้างแผน (ว่าง) — แท็บทั้งหมด ยังไม่มียานพาหนะในแผน', () => planForm('S1 ฟอร์มสร้างแผน', {})],
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus — ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', () => planForm('S1 Validation', { errors: true })]]],
  ['ยังมียานพาหนะที่ยังไม่จัดไตรมาส', [
    ['แท็บทั้งหมด — 82-4410 ยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', () => planForm('S1 ยังไม่จัดไตรมาส ส่งไม่ได้', U1({}))],
    ['ติ๊กยานพาหนะ 82-4410 ใน modal เพิ่มยานพาหนะเข้าไตรมาส 2 — ปุ่มเพิ่มเข้าไตรมาส 2 (1) กดได้', () => planForm('S1 จัด 82-4410 เข้าไตรมาส 2', U1({ q: 2, pick: { ticked: [3] } }))],
    ['เพิ่มเข้าไตรมาส 2 สำเร็จ — ทุกคันจัดเข้าไตรมาสแล้ว ปุ่มบันทึกและส่งอนุมัติกดได้', () => toast(() => planForm('S1 จัดครบ ส่งได้', U1({ alloc: plus(A_Q1, { 3: 2 }), q: 2 })), 'เพิ่มยานพาหนะ 1 คันเข้าไตรมาส 2 สำเร็จ')]]],
  ['ยานพาหนะในแผนจัดเข้าไตรมาสครบแล้ว', [
    ['ไตรมาส 4 ยังไม่มียานพาหนะ — ทุกคันในแผนอยู่ในไตรมาส 1', () => planForm('S1 ไตรมาส 4 ว่าง', IN3({ q: 4 }))],
    ['ยานพาหนะในแผนจัดเข้าไตรมาสครบแล้ว — modal ไม่มียานพาหนะให้เลือก ให้เพิ่มเข้าแผนที่แท็บทั้งหมดก่อน', () => planForm('S1 modal จัดครบแล้ว', IN3({ q: 4, pick: {} }))],
    ['กดเพิ่มยานพาหนะที่แท็บทั้งหมด — modal เพิ่มยานพาหนะเข้าแผน', () => planForm('S1 กลับไปเพิ่มเข้าแผน', IN3({ pick: {} }))]]],
  ['ค้นหาใน modal ไม่พบยานพาหนะ', [
    ['กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน แผงตัวกรองกางอยู่', () => planForm('S1 modal ไม่พบ เปิด', IN3({ pick: {} }))],
    ['ค้นหาใน modal ไม่พบยานพาหนะ — พิมพ์ 99-9999 ล้างตัวกรองเพื่อกลับไปเห็นรายการ', () => planForm('S1 modal ไม่พบยานพาหนะ', IN3({ pick: { query: '99-9999', collapsed: true } }))]]],
  ['ยานพาหนะทุกคันอยู่ในแผนแล้ว', [
    ['แท็บทั้งหมด — ยานพาหนะคันอื่นอยู่ในแผนครบแล้ว กดเพิ่มยานพาหนะ', () => planForm('S1 แท็บทั้งหมด ครบแล้ว', IN3({}))],
    ['ยานพาหนะทุกคันอยู่ในแผนแล้ว — modal ไม่มียานพาหนะให้เพิ่ม', () => planForm('S1 modal ไม่มียานพาหนะให้เพิ่ม', IN3({ pick: { full: true } }))]]],
  ['กำหนดอะไหล่หลายคันที่ต่างรุ่น', [
    ['แท็บไตรมาส 1 — ติ๊ก 82-6789 กับ 82-1145 (คนละรุ่น) ปุ่มกำหนดอะไหล่ (2)', () => planForm('S1 ติ๊กต่างรุ่น', Q1_OPEN({ ticked: [0, 1] }))],
    ['หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — เตือนยานพาหนะที่เลือกมีหลายรุ่น ตรวจแล้วบันทึกได้', () => carPartsScreen('S1 อะไหล่ต่างรุ่น', { cars: [0, 1], draw: 'take', oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD })],
    ['บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 2/3', () => toast(() => planForm('S1 ต่างรุ่นบันทึกแล้ว', Q1_OPEN({ picks: { 0: CAR_ADD, 1: CAR_ADD }, oils: { 0: 1, 1: 1 } })), 'บันทึกอะไหล่ของยานพาหนะ 2 คันแล้ว')]]],
  ['ออกจากหน้าโดยยังไม่บันทึก', [
    ['กดย้อนกลับ — ฟอร์มที่กรอกแล้ว ยานพาหนะ 3 คัน กำหนดอะไหล่แล้ว 1/3', () => planForm('S1 ก่อนออก', Q1_OPEN(P1))],
    ['ย้อนกลับ — ยืนยันการออก ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', async () => { const s = await planForm('S1 ยืนยันการออก', Q1_OPEN(P1)); await confirm(s, EXIT_CONFIRM('ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก')); return s; }],
    ['ออกแล้ว — รายการแผน ไม่มีแผนใหม่', () => listScreen('S1 ออกไม่บันทึก', { rows: ownPlans(UNITS[0]) })]]],
  ['บันทึกและส่งอนุมัติไม่สำเร็จ', [
    ['กำหนดอะไหล่ครบ 3/3 — กดบันทึกและส่งอนุมัติ', () => planForm('S1 ก่อนบันทึก', IN3({ q: 1 }))],
    ['บันทึกไม่สำเร็จ — toast ผิดพลาด ค่าที่กรอกยังอยู่ กดบันทึกใหม่ได้', async () => { const s = await planForm('S1 บันทึกไม่สำเร็จ', IN3({ q: 1 })); notify(s, 'general error', true); return s; }]]],
];
const SCENARIOS = [
  /* S1 = เรื่องย่อย S1_SUBS (R108 R109 · 12 พ.ย. 2569 · ฉบับ 3 R111 R112 13 พ.ย. 2569) — ประวัติแบบ A (5 พ.ย. 2569) R77 R75 R93 R104 อยู่ใน component-rules.md */
  ['S1 · ผู้สร้างแผน สร้างแผนบำรุงรักษาประจำปี และเพิ่มยานพาหนะเข้าไตรมาส', S1_SUBS.flatMap(x => x[1])],
  /* S2 ปรับ 5 พ.ย. 2569 (รีวิวทีมออกแบบ): ผลการพิจารณาบนสุด ไม่มีค่าเริ่มต้น · อนุมัติสำเร็จแสดงแค่ toast ขวาบน สถานะอนุมัติแล้ว ส่วนผลการพิจารณาหาย */
  ['S2 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนบำรุงรักษา', [
    ['รายการแผนรออนุมัติ', () => planReviewList('S2 แผนรออนุมัติ', REVIEW_ROWS)],
    ['รายละเอียดแผน — ผลการพิจารณา ยังไม่เลือก', () => planReview('S2 รายละเอียดแผน', {})],
    ['อนุมัติ — ยืนยันอนุมัติแผน', async () => { const s = await planReview('S2 ยืนยันอนุมัติ', { decision: 'approve' }); await confirm(s, { title: 'ยืนยันอนุมัติแผนบำรุงรักษา', sub: NP[1] + ' · ' + NP[4] + ' คัน · อนุมัติแล้ว ระบบแจ้งจำนวนอะไหล่ทั้งปีให้ Smart Inventory ทราบ (ยังไม่ตัดจากคลัง) และหน่วยงานเริ่มงานรายไตรมาสได้', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนสำเร็จ', async () => { const s = await planReview('S2 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนบำรุงรักษาสำเร็จ'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => planReview('S2 เลือกส่งกลับ', { decision: 'return' })],
    ['ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus', () => planReview('S2 ส่งกลับไม่ครบ', { decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await planReview('S2 ยืนยันส่งกลับ', { decision: 'return', reason: RETURN_REASON }); await confirm(s, { title: 'ยืนยันส่งกลับแก้ไข', sub: 'แผนจะกลับไปให้ผู้สร้างแผนแก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่', ok: 'ส่งกลับ' }); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await planReviewList('S2 ส่งกลับแล้ว', [PLANS[2]], 0, 1); notify(s, 'ส่งแผนกลับให้ผู้สร้างแผนแก้ไขแล้ว'); return s; }],   // 10 พ.ย. 2569 แผนที่ส่งกลับออกจากแท็บรออนุมัติ ไปอยู่แท็บส่งกลับแก้ไข (B.10)
    ['อะไหล่ในแผน — เปิดแท็บไตรมาส 2', () => planReview('S2 อะไหล่ไตรมาส 2', { pq: 2 })],
    // 10 พ.ย. 2569 เจ้าของงาน "หน้าอนุมัติต้องมี tab รออนุมัติ อนุมัติแล้ว และ ส่งกลับแก้ไขด้วย" — ต่อท้าย (B.10 B.11) รหัสจอเดิมไม่เลื่อน
    ['แท็บอนุมัติแล้ว — แผนที่อนุมัติไปแล้ว', () => planReviewList('S2 แท็บอนุมัติแล้ว', REVIEW_DONE, 1)],
    ['แท็บส่งกลับแก้ไข — แผนที่ส่งกลับรอผู้สร้างแก้', () => planReviewList('S2 แท็บส่งกลับแก้ไข', [planAs('returned')].concat(REVIEW_RET), 2, 1)],
    // 13 พ.ย. 2569 ไฟล์ 34 ข้อ 5 (ก) — ต่อท้าย รหัสจอเดิมไม่เลื่อน · หน้าดูอย่างเดียวของผู้อนุมัติ แผนที่ทุกคันเลือกไม่เบิกอะไหล่
    ['อะไหล่ในแผน — ทุกคันเลือกไม่เบิกอะไหล่ แผนนี้ไม่มีอะไหล่ที่ต้องเบิก', () => planReview('S2 แผนไม่มีอะไหล่', { plan: NOPARTS_PLAN })]]],
  // S3 ผพจ. ออกเลขงานและจัดซื้ออะไหล่ — พักไว้ 30 ต.ค. 2569 (เจ้าของงาน "อนุมัติเลขงาน ไม่ต้องมีในระบบแล้ว แยกออกไปก่อน") · ฟังก์ชัน planIssue/headPartCheck/poForm คงไว้ · userflow ย้ายไป 14-…-พักไว้-S3.md
  /* S4 เดิม "ติดตามความคืบหน้าและเบิกอะไหล่ของไตรมาส" (partsProgress · เทียบคงเหลือ Smart Inventory + เบิก/จอง) เปลี่ยนเป็นแดชบอร์ด 6 พ.ย. 2569 (เจ้าของงาน "หน้าที่จาก smart inventory จะเปลี่ยนเป็นหน้าแดชบอร์ด")
     รหัสจอ C.1–C.6 เดิมถูกแทนด้วยจอแดชบอร์ด (ชื่อ state ใหม่) · อะไหล่รายไตรมาสย้ายไปหัวข้อ "อะไหล่ในไตรมาส n" ของหน้าไตรมาส (S6) */
  ['S4 · ผู้ดำเนินการ ดูอะไหล่และความคืบหน้าของแผนที่อนุมัติแล้ว (แดชบอร์ด)', [
    ['แท็บรวมตามรายการ — อะไหล่ทุกแผนที่อนุมัติแล้วในปีงบประมาณ 2570', () => partsDash('S4 รวมตามรายการ', {})],
    ['ค้นหาชื่ออะไหล่ หรือรหัสอะไหล่', () => partsDash('S4 ค้นหา', { query: 'FL-00' })],
    ['กดตัวกรอง — แผงตัวกรอง ปีงบประมาณ เขต แผน (เห็นเฉพาะแผนของหน่วยงานตัวเอง)', () => partsDash('S4 แผงตัวกรอง', { filter: { open: 'plan' } })],
    ['กรองแล้ว — ชิปตัวกรองเหนือตาราง', () => partsDash('S4 กรองแล้ว', { chips: ['2570', 'MRZ7000001'] })],
    ['ไม่พบอะไหล่ที่ตรงกับคำค้นหรือตัวกรอง', () => partsDash('S4 ไม่พบ', { query: 'ไส้กรองแอร์', notFound: true })],
    ['แท็บแยกรายคัน — อะไหล่ของยานพาหนะแต่ละคัน', () => partsDash('S4 แยกรายคัน', { tab: 1 })],
    ['แท็บความคืบหน้าของแผน — แผนเดินทางและยานพาหนะที่บำรุงรักษาแล้วรายไตรมาส', () => partsDash('S4 ความคืบหน้า', { tab: 2 })],
    ['กดส่งออก — popup รูปแบบไฟล์ และข้อมูลที่ส่งออก', () => partsDash('S4 ส่งออก', { chips: ['2570', 'MRZ7000001'], exportPdf: true })],
    ['ส่งออกสำเร็จ', async () => { const s = await partsDash('S4 ส่งออกสำเร็จ', { chips: ['2570', 'MRZ7000001'] }); notify(s, 'ส่งออกไฟล์สำเร็จ'); return s; }],
    ['ไฟล์ PDF — รวมตามรายการ', () => dashPdf('S4 ไฟล์ PDF')],
    ['ไฟล์ Excel — ชีตรวมตามรายการ', () => dashXls('S4 ไฟล์ Excel รวม', 0)],
    ['ไฟล์ Excel — ชีตแยกรายคัน', () => dashXls('S4 ไฟล์ Excel รายคัน', 1)],
    ['ยังไม่มีแผนที่อนุมัติแล้ว', () => partsDash('S4 ว่าง', { empty: true })],
    // 10 พ.ย. 2569 เจ้าของงาน "ผู้สร้างแผนเห็นเฉพาะแผนของหน่วยงานตัวเอง ยกเว้น กบค จะเห็นแผนของหน่วยงานอื่นด้วย แต่แก้ไขไม่ได้" — ต่อท้าย (C.14 C.15) รหัสจอเดิมไม่เลื่อน
    ['กบค. — ความคืบหน้าของแผนทุกหน่วยงาน ดูอย่างเดียว', () => partsDash('S4 กบค. ทุกหน่วยงาน', { kbk: true, tab: 2 })],
    ['กบค. — แผงตัวกรอง มีหน่วยงานผู้ขอเบิก', () => partsDash('S4 กบค. แผงตัวกรอง', { kbk: true, filter: { units: ['กปส.'], open: 'unit' } })],
    /* 12 พ.ย. 2569 แดชบอร์ดแบบ VMS+ (R106) — ต่อท้าย C.16 C.17 C.18 รหัสจอเดิมไม่เลื่อน · กดกราฟ/กดเรื่องที่ควรดู = กรองทั้งหน้า + ชิปตัวกรองที่เลือก */
    ['กดกราฟ — แท่งไตรมาส 1 กรองทั้งหน้า ชิปตัวกรองที่เลือก แท็บความคืบหน้าเหลือไตรมาส 1', () => partsDash('S4 กดกราฟไตรมาส 1', { q: 1, chips: ['ไตรมาส 1'], tab: 2 })],
    ['กดเรื่องที่ควรดู — ยานพาหนะในแผนที่ไม่เบิกอะไหล่ กรองทั้งหน้า แท็บแยกรายคัน', () => partsDash('S4 กดเรื่องที่ควรดู', { alert: 'noparts', chips: ['ไม่เบิกอะไหล่'], tab: 1 })],
    ['มุมมองมือถือ — การ์ดตัวเลข 2 ใบต่อแถว กราฟเรียงทีละใบ ตารางเป็นการ์ด', () => partsDash('S4 มุมมองมือถือ', { mobileAll: true })]]],
  // S5 เบิกอะไหล่ผ่านระบบจองอะไหล่ — รวมเข้า S4 2 พ.ย. 2569 (เจ้าของงาน "รวบ s4 s5 เป็นหน้าเดียวกัน ยุบ S5 ออกไปก่อน") · บล็อก D เว้นว่าง
  /* S6 ปรับ 5 พ.ย. 2569 (รีวิวทีมออกแบบ): ทางเข้าจากเมนูถึงหน้าไตรมาส (E.1–E.3) · หน้า E.3 = "ไตรมาส 1" · popup รถในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้ · เอารถออกจากแผนเดินทาง (soft delete) แล้วกลับมาเลือกได้
     · Validation Out of focus · สร้างสำเร็จกลับหน้าไตรมาส + toast · สร้างได้จนรถหมด แล้วปุ่มสร้างแผนเดินทางกดไม่ได้ (ตัด popup "รถทุกคันอยู่ในแผนเดินทางแล้ว") */
  ['S6 · ผู้ดำเนินการ ทำแผนเดินทาง (ดำเนินการเอง)', [
    ['รายการแผน — เมนู "…" ดูรายละเอียดแผนที่อนุมัติแล้ว', async () => { const s = await listScreen('S6 รายการแผน', { rows: ownPlans(UNITS[0]) }); planMenu(s, MENU.slice(0, 1)); return s; }],
    ['รายละเอียดแผน — กดไปหน้าไตรมาส 1', () => planDetailQ('S6 รายละเอียดแผน')],
    ['หน้าไตรมาส 1 — ยังไม่มีแผนเดินทาง', () => tripList('S6 ไตรมาส 1 (ว่าง)', { trips: [] })],
    ['ฟอร์มสร้างแผนเดินทาง (ว่าง)', () => tripForm('S6 ฟอร์มแผนเดินทาง', {})],
    ['กดเพิ่มยานพาหนะ — popup ยานพาหนะทุกคันของไตรมาส', () => tripForm('S6 popup เพิ่มยานพาหนะ', { modal: { pool: TRIP_ALL, ticked: TRIP_SEL } })],
    ['เพิ่มยานพาหนะแล้ว — สถานที่ตั้งต้นสำนักงานที่ยานพาหนะอยู่', () => tripForm('S6 เพิ่มยานพาหนะแล้ว', { sel: TRIP_SEL })],
    ['แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันเดินทาง', async () => { const s = await tripForm('S6 แก้ไขยานพาหนะในแผนเดินทาง', { sel: TRIP_SEL, values: TRIP_DATES }); await tripCarEdit(s, 4, TRIP_PHONES, TRIP_LOCS, { trip: TRIP_DATES }); return s; }],   // 6 พ.ย. 2569 popup 4 ช่อง (R83) · เดิม "แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษาของยานพาหนะ" รหัสจอเดิม
    ['กดไอคอนลบ — เอายานพาหนะออกจากแผนเดินทางนี้ (soft delete)', () => tripForm('S6 เอายานพาหนะออกจากแผนเดินทาง', { sel: TRIP_KEEP, locs: TRIP_LOCS, phones: TRIP_PHONES })],
    ['กดเพิ่มยานพาหนะอีกครั้ง — ยานพาหนะที่เอาออกกลับมาเลือกได้', () => tripForm('S6 เพิ่มยานพาหนะอีกครั้ง', { sel: TRIP_KEEP, locs: TRIP_LOCS, phones: TRIP_PHONES, modal: { pool: TRIP_ALL.filter(i => TRIP_KEEP.indexOf(i) < 0), ticked: [TRIP_OUT] } })],
    ['เลือกช่วงวันเดินทาง', () => tripForm('S6 เลือกช่วงวัน', { sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, dateOpen: true })],
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus', () => tripForm('S6 Validation', { errors: true })],
    ['กรอกครบ', () => tripForm('S6 กรอกครบ', { values: TRIP_FILLED, sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, works: TRIP_WORKS })],   // 6 พ.ย. 2569 วันดำเนินการรายคันตาม TRIP_1 (E.13)
    ['สร้างแผนเดินทางสำเร็จ — กลับหน้าไตรมาส 1 แสดงแผนเดินทางใหม่ (รออนุมัติ)', async () => { const s = await tripList('S6 ยืนยันแล้ว', { trips: [TRIP_1] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }],
    ['สร้างแผนเดินทางใบถัดไป — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้', () => tripForm('S6 ใบถัดไป popup', { modal: { pool: TRIP_ALL, ticked: TRIP_REST, taken: TAKEN_1 } })],
    ['แผนเดินทาง 2 ใบ — ยานพาหนะครบทุกคัน ปุ่มสร้างแผนเดินทางกดไม่ได้', async () => { const s = await tripList('S6 แผนเดินทาง 2 ใบ', { trips: [tripAs(TRIP_1, 'approved'), TRIP_2] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }],
    ['แผนเดินทางถูกส่งกลับแก้ไข', () => tripList('S6 ถูกส่งกลับ', { trips: [tripAs(TRIP_1, 'returned')] })],
    ['แก้ไขแผนเดินทางที่ถูกส่งกลับ', () => tripForm('S6 แก้ไขที่ถูกส่งกลับ', { edit: true, alert: ['Error', 'ผู้อนุมัติส่งกลับให้แก้ไข', TRIP_RETURN], values: Object.assign({}, TRIP_FILLED, { d1: '10/11/2569', d2: '14/11/2569' }), sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES })],
    ['ส่งอนุมัติใหม่แล้ว', async () => { const s = await tripList('S6 ส่งอนุมัติใหม่', { trips: [Object.assign(tripAs(TRIP_1, 'review'), { d1: '10/11/2569', d2: '14/11/2569', works: {} })] });   /* เปลี่ยนช่วงวันเดินทางแล้ว วันดำเนินการกลับเป็นทั้งช่วงใหม่ (เสนอ) */ notify(s, 'ส่งแผนเดินทางให้ผู้อนุมัติใหม่แล้ว'); return s; }],
    // เพิ่ม ลด แก้ไข รถในไตรมาส (เจ้าของงาน 4 พ.ย. 2569 · ไม่ต้องส่งอนุมัติแผนใหม่) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['กดเพิ่มยานพาหนะ — popup ยานพาหนะที่ยังไม่อยู่ในแผน เพิ่มได้ทุกคัน', async () => { const s = await tripList('S6 popup เพิ่มยานพาหนะเข้าไตรมาส', { trips: [] }); await qAddModal(s, [0]); return s; }],
    ['เพิ่มยานพาหนะเข้าไตรมาสแล้ว', async () => { const s = await tripList('S6 เพิ่มยานพาหนะเข้าไตรมาสแล้ว', { trips: [], added: [0] }); notify(s, 'เพิ่มยานพาหนะเข้า' + NOW_Q + ' สำเร็จ'); return s; }],
    ['กดไอคอนแก้ไข — แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษา', async () => { const s = await tripList('S6 แก้ไขยานพาหนะในไตรมาส', { trips: [] }); await tripCarEdit(s, 1, {}, {}); return s; }],
    ['กดไอคอนลบ — ยืนยันเอายานพาหนะออกจากไตรมาส', async () => { const s = await tripList('S6 ยืนยันเอายานพาหนะออกจากไตรมาส', { trips: [] }); await confirm(s, Q_REMOVE_CONFIRM(TRIP_CARS[1])); return s; }],
    ['เอายานพาหนะออกจากไตรมาสแล้ว', async () => { const s = await tripList('S6 เอายานพาหนะออกจากไตรมาสแล้ว', { trips: [], removed: [1] }); notify(s, 'เอายานพาหนะออกจาก' + NOW_Q + ' สำเร็จ'); return s; }],
    // 6 พ.ย. 2569 รีวิว S6 วันดำเนินการรายคัน (R83) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน (E.24 E.25) · ส่งออกแผนเดินทางอยู่ท้าย S10 (I.27–I.32)
    ['เลือกวันดำเนินการ — ปฏิทินเลือกได้เฉพาะช่วงวันเดินทาง วันนอกช่วงกดไม่ได้', async () => { const s = await tripForm('S6 เลือกวันดำเนินการ', { values: TRIP_FILLED, sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES }); await tripCarEdit(s, 0, TRIP_PHONES, TRIP_LOCS, { trip: TRIP_DATES, pick: TRIP_WORKS[0] }); return s; }],
    ['บันทึกวันดำเนินการแล้ว — หลายคันวันเดียวกันได้ คันที่ไม่แก้คงทั้งช่วงวันเดินทาง', () => tripForm('S6 บันทึกวันดำเนินการแล้ว', { values: TRIP_FILLED, sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, works: TRIP_WORKS })],
    // 11 พ.ย. 2569 เจ้าของงาน เพิ่มยานพาหนะเข้าไตรมาสได้จนกว่าทุกคันในไตรมาสปิดงาน (R93) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน (E.26)
    ['ทุกคันในไตรมาสปิดงานแล้ว (รวมบำรุงรักษาไม่ได้) — ปุ่มเพิ่มยานพาหนะกดไม่ได้', () => tripList('S6 ไตรมาสปิดงานครบทุกคัน', { trips: [tripAs(TRIP_1, 'done'), tripAs(TRIP_2, 'done')], jobs: Q_DONE_JOBS })]]],
  ['S7 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง', [
    ['รายการแผนเดินทางรออนุมัติ', () => tripReviewList('S7 รออนุมัติ', [TRIP_1, TRIP_V, TRIP_OTHER])],
    ['รายละเอียดแผนเดินทาง — ผลการพิจารณา ยังไม่เลือก', () => tripReview('S7 รายละเอียด', {})],   // 5 พ.ย. 2569 ตาม S2
    ['อนุมัติ — ยืนยันอนุมัติแผนเดินทาง', async () => { const s = await tripReview('S7 ยืนยันอนุมัติ', { decision: 'approve' }); await confirm(s, { title: 'ยืนยันอนุมัติแผนเดินทาง', sub: TRIP_1.name + ' · ' + TRIP_1.sel.length + ' คัน · อนุมัติแล้วระบบแจ้งเตือน กรย. และผู้ดูแลยานพาหนะ', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนเดินทางสำเร็จ', async () => { const s = await tripReview('S7 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนเดินทางสำเร็จ'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => tripReview('S7 เลือกส่งกลับ', { decision: 'return' })],
    ['ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus', () => tripReview('S7 ส่งกลับไม่ครบ', { decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await tripReview('S7 ยืนยันส่งกลับ', { decision: 'return', reason: TRIP_RETURN }); await confirm(s, { title: 'ยืนยันส่งกลับแก้ไข', sub: 'แผนเดินทางจะกลับไปให้ผู้สร้างแผนเดินทางแก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่', ok: 'ส่งกลับ' }); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await tripReviewList('S7 ส่งกลับแล้ว', [TRIP_V, TRIP_OTHER], 0, 2); notify(s, 'ส่งแผนเดินทางกลับให้ผู้สร้างแผนเดินทางแก้ไขแล้ว'); return s; }],
    // 10 พ.ย. 2569 แท็บของหน้าอนุมัติ (ตาม S2) — ต่อท้าย รหัสจอเดิมไม่เลื่อน
    ['แท็บอนุมัติแล้ว — แผนเดินทางที่อนุมัติไปแล้ว', () => tripReviewList('S7 แท็บอนุมัติแล้ว', [TRIP_OK], 1)],
    ['แท็บส่งกลับแก้ไข — แผนเดินทางที่ส่งกลับรอผู้สร้างแก้', () => tripReviewList('S7 แท็บส่งกลับแก้ไข', [Object.assign({}, TRIP_1, { st: 'returned' }), TRIP_RET], 2, 2)]]],
  ['S8 · กรย. และผู้ดูแลยานพาหนะ ได้รับแจ้งเตือนแผนเดินทาง', [
    ['กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)', async () => { const s = await tripSeenList('S8 กรย. มีใหม่', false); bell(s, true); return s; }],
    ['กรย. — เปิดแผงแจ้งเตือน', async () => { const s = await tripSeenList('S8 กรย. แผงแจ้งเตือน', false); bell(s, true); await notiPanel(s, [NOTI_KRY, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['กรย. — แผนเดินทาง ดูอย่างเดียว (ยานพาหนะทุกคันในใบ)', () => tripView('S8 กรย. แผนเดินทาง', false)],
    ['ผู้ดูแลยานพาหนะ — เปิดแผงแจ้งเตือน', async () => { const s = await tripSeenList('S8 หน่วยงาน แผงแจ้งเตือน', true); bell(s, true); await notiPanel(s, [NOTI_OWN, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['ผู้ดูแลยานพาหนะ — แผนเดินทาง ดูอย่างเดียว (เฉพาะยานพาหนะที่ดูแล)', () => tripView('S8 หน่วยงาน แผนเดินทาง', true)]]],
  ['S9 · ผู้ดำเนินการ สร้างแผนเดินทางจ้างดำเนินการ (vendor)', [
    ['เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น', () => tripForm('S9 เลือกจ้าง', { mode: 'hire' })],
    ['เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด', () => tripForm('S9 รายชื่อผู้รับจ้าง', { mode: 'hire', vendorOpen: true, values: { name: TRIP_V.name } })],
    ['กดเพิ่มยานพาหนะ — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้', () => tripForm('S9 popup เพิ่มยานพาหนะ', { mode: 'hire', values: { name: TRIP_V.name, vendor: TRIP_V.vendor }, modal: { pool: TRIP_ALL, ticked: TRIP_REST, taken: TAKEN_1 } })],   // 5 พ.ย. 2569 popup เดียวกับ S6
    ['แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันทำงาน', async () => { const s = await tripForm('S9 แก้ไขยานพาหนะในแผนเดินทาง', { mode: 'hire', values: { name: TRIP_V.name, vendor: TRIP_V.vendor, d1: TRIP_V.d1, d2: TRIP_V.d2 }, sel: TRIP_REST, locs: TRIP_V_LOCS, phones: TRIP_V_PHONES }); await tripCarEdit(s, 6, TRIP_V_PHONES, TRIP_V_LOCS, { trip: { d1: TRIP_V.d1, d2: TRIP_V.d2, hire: true } }); return s; }],   // 6 พ.ย. 2569 (R83) เดิม "แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษาของยานพาหนะ" 
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus', () => tripForm('S9 Validation', { mode: 'hire', errors: true })],   // 5 พ.ย. 2569 ฟอร์มเดียวกับ S6 ปุ่มยืนยัน Disabled จนกว่าครบ
    ['กรอกครบ', () => tripForm('S9 กรอกครบ', { mode: 'hire', values: TRIP_V, sel: TRIP_REST, locs: TRIP_V_LOCS, phones: TRIP_V_PHONES })],
    ['ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)', async () => { const s = await tripList('S9 ยืนยันแล้ว', { trips: [tripAs(TRIP_1, 'approved'), TRIP_V] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }]]],
  // S9 เดิม กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน — ตัดออก 3 พ.ย. 2569 (เจ้าของงาน "เรื่องเตรียมอะไหล่ เป็นการติดต่อกันเอง") แทนด้วย S9 แผนจ้างดำเนินการ · prepDetail/prepRows คงไว้
  // S7 ผู้รับจ้างทำแผนเดินทาง · S8 กบค. ตรวจแผนผู้รับจ้าง (เดิม) — แทนด้วย S7 อนุมัติ S8 แจ้งเตือน 3 พ.ย. 2569 · hireTripForm/hireTripReview คงไว้ให้เส้นว่าจ้างที่รอออกแบบ (ไฟล์ 14 หัวข้อ 2.1)
  /* S10 ปรับตามรีวิว 5 พ.ย. 2569 (ทีมออกแบบ + เจ้าของงาน "s10 ลองปรับให้เป็นแบบที่เขียนให้"): ตัวนับ "ตรวจแล้ว x/y" (ไม่นับคันที่บำรุงรักษาไม่ได้) · กดเริ่มงานเข้าขั้นตอน 2 ขั้น
     Step 1 ตรวจสภาพก่อนบำรุงรักษา (ลงนามบังคับ) → Step 2 สรุปงานก่อนปิดงาน · หน้าอยู่ระหว่างบำรุงรักษาเดิมเอาออก · toast ขวาบน (R60) · ป้ายรอผลตรวจน้ำมันเฉพาะคันที่เก็บตัวอย่าง
     รหัสจอเลื่อนทั้งบล็อก (ไม่มีปุ่มอัปเดตจอที่เลือกของปลั๊กอินนี้ — export ใหม่) */
  ['S10 · ผู้ดำเนินการ บันทึกงานบำรุงรักษารายคัน', [
    ['หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน ตรวจแล้ว 0/4', () => tripDetail('S10 รายละเอียดแผนเดินทาง', {})],
    ['กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ลบ', () => tripDetail('S10 เมนูของยานพาหนะ', { menu: true })],
    ['เมนูแก้ไข — แก้ไขยานพาหนะในแผนเดินทาง ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ', () => tripDetail('S10 แก้ไขยานพาหนะในแผนเดินทาง', { edit: true })],   // 6 พ.ย. 2569 (R83) เดิม "เมนูแก้ไข — แก้ไขผู้ดูแลยานพาหนะและสถานที่" 
    ['เมนูลบ — ยืนยันเอายานพาหนะออกจากแผนเดินทาง', () => tripDetail('S10 ลบยานพาหนะออกจากแผนเดินทาง', { del: true })],
    ['หน้างานรายคัน — ยังไม่เริ่ม', () => jobPage('S10 งานรายคัน', {})],
    ['กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา สถานะอยู่ระหว่างบำรุงรักษา', async () => { const s = await stepPage('S10 Step 1 ตรวจสภาพก่อนบำรุงรักษา', { step: 1 }); notify(s, 'เริ่มงานบำรุงรักษาแล้ว'); return s; }],
    ['กดเซ็นลงนาม — ลงนามการตรวจสภาพ', () => stepPage('S10 ลงนามการตรวจสภาพ', { step: 1, filled: true, signModal: true })],
    ['ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้', () => stepPage('S10 Step 1 ลงนามครบ', { step: 1, filled: true, signed: true })],
    ['ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน', () => stepPage('S10 Step 2 สรุปงานก่อนปิดงาน', { step: 2 })],
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus', () => stepPage('S10 Validation', { step: 2, errors: true })],
    ['เลือกวันที่เปลี่ยนน้ำมันครั้งล่าสุด — ปฏิทิน', () => stepPage('S10 วันที่เปลี่ยนน้ำมันครั้งล่าสุด', { step: 2, filled: true, dateOpen: true })],
    ['เลือกงบที่ตัด หน่วยงานอื่น — ระบุศูนย์ต้นทุน', () => stepPage('S10 งบที่ตัด หน่วยงานอื่น', { step: 2, filled: true, budget: { type: 1, cc: OTHER_CC } })],
    ['กรอกผลงานครบ', () => stepPage('S10 ปิดงานกรอกครบ', { step: 2, filled: true })],
    ['ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง เสร็จสิ้น + รอผลตรวจน้ำมัน', async () => { const s = await tripDetail('S10 ปิดงานสำเร็จ', { st: JOB_MIX, oil: { [JOB_I]: 'wait' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['ปิดงานสำเร็จ — เปลี่ยนน้ำมันอย่างเดียว ไม่มีป้ายรอผลตรวจน้ำมัน', async () => { const s = await tripDetail('S10 ปิดงานสำเร็จ ไม่เก็บตัวอย่าง', { st: JOB_MIX }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน', () => jobPage('S10 บำรุงรักษาไม่ได้', { i: TRIP_1.sel[2], modal: 'cannot', reason: JOB_CANNOT })],
    ['บำรุงรักษาไม่ได้ — ยังไม่ระบุสาเหตุ', () => jobPage('S10 บำรุงรักษาไม่ได้ยังไม่ครบ', { i: TRIP_1.sel[2], modal: 'cannot', errors: true })],
    ['บำรุงรักษาไม่ได้ระหว่าง Step 1 — คืนอะไหล่ตามแผนทั้งหมด', () => stepPage('S10 บำรุงรักษาไม่ได้ Step 1', { step: 1, filled: true, modal: 'cannot', reason: HIRE_WHY })],
    ['บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว', () => stepPage('S10 บำรุงรักษาไม่ได้ Step 2', { step: 2, modal: 'cannot', reason: HIRE_WHY })],
    ['บันทึกบำรุงรักษาไม่ได้แล้ว — กลับหน้ารายละเอียดแผนเดินทาง ตรวจแล้ว 0/3', async () => { const s = await tripDetail('S10 บันทึกบำรุงรักษาไม่ได้', { st: { [TRIP_1.sel[2]]: 'cannot' } }); notify(s, 'บันทึกบำรุงรักษาไม่ได้แล้ว'); return s; }],
    ['ดูงานที่ปิดแล้ว — เสร็จสิ้น', () => workDetail('S10 งานที่ปิดแล้ว', {})],
    // Safety Inspection รถเครนและกระเช้า (4 พ.ย. 2569 · JO 7.3.3)
    ['Step 2 — แนบเอกสาร Safety Inspection (ถ้ามี)', () => stepPage('S10 Step 2 Safety Inspection', { step: 2, filled: true, safety: SAFETY_FILES })],
    ['หน้างานรายคัน — เพิ่มเอกสาร Safety Inspection ภายหลัง', () => workDetail('S10 เพิ่มเอกสาร Safety Inspection', { safety: { files: SAFETY_FILES } })],
    ['บันทึกเอกสาร Safety Inspection สำเร็จ', async () => { const s = await workDetail('S10 บันทึกเอกสาร Safety Inspection', { safety: { files: SAFETY_DONE, saved: true } }); notify(s, 'บันทึกเอกสาร Safety Inspection สำเร็จ'); return s; }],
    // แผนจ้างดำเนินการ (4 พ.ย. 2569 ตัด S23 S11) — กบค. ปิดงานรายคันแทนผู้รับจ้างด้วยหน้าและขั้นตอนเดียวกัน
    ['แผนจ้างดำเนินการ — หน้ารายละเอียดแผนเดินทาง กดปุ่ม … ของยานพาหนะ', () => tripDetail('S10 แผนจ้าง รายละเอียดแผนเดินทาง', { trip: HIRE_T, st: HIRE_ST, menu: true })],
    ['แผนจ้างดำเนินการ — Step 2 สรุปงานก่อนปิดงาน หน่วยงานปิดงานแทนผู้รับจ้าง', () => stepPage('S10 แผนจ้าง Step 2', { hire: true, step: 2, filled: true })],
    // 6 พ.ย. 2569 รีวิว S6 "ตอน export ก็เกี่ยวข้องด้วย" — ส่งออกแผนเดินทางจากหน้ารายละเอียดแผนเดินทาง (R84) · ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน (I.27–I.32)
    ['หน้ารายละเอียดแผนเดินทาง — กดส่งออก — popup รูปแบบไฟล์', () => tripDetail('S10 ส่งออกแผนเดินทาง', { exportPdf: true })],
    ['ส่งออกแผนเดินทางสำเร็จ', async () => { const s = await tripDetail('S10 ส่งออกแผนเดินทางสำเร็จ', {}); notify(s, 'ส่งออกไฟล์สำเร็จ'); return s; }],
    ['ไฟล์ PDF หน้า 1 — รายละเอียดแผนเดินทาง และยานพาหนะ', () => tripPdf('S10 ไฟล์ PDF แผนเดินทาง หน้า 1', 1)],
    ['ไฟล์ PDF หน้า 2 — อะไหล่ของแผนเดินทาง', () => tripPdf('S10 ไฟล์ PDF แผนเดินทาง หน้า 2', 2)],
    ['ไฟล์ Excel — ชีตยานพาหนะในแผนเดินทาง', () => tripXls('S10 ไฟล์ Excel ชีตยานพาหนะ', 0)],
    ['ไฟล์ Excel — ชีตอะไหล่ของแผนเดินทาง', () => tripXls('S10 ไฟล์ Excel ชีตอะไหล่', 1)],
    // 9 พ.ย. 2569 (R86) แบบตรวจตามประเภทยานพาหนะ — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['ยานพาหนะประเภทรถพ่วงฉีดน้ำ — Step 1 ใช้แบบตรวจสภาพรถพ่วงฉีดน้ำ', () => stepPage('S10 Step 1 รถพ่วงฉีดน้ำ', { step: 1, car: WATER_CAR })],
    ['ยานพาหนะประเภทรถพ่วงฉีดน้ำ — ตรวจรายการและลงนามครบ', () => stepPage('S10 Step 1 รถพ่วงฉีดน้ำ ลงนามครบ', { step: 1, car: WATER_CAR, filled: true, signed: true })],
    // R83 แก้วันดำเนินการของคันนี้ตอนเริ่มงาน (9 พ.ย. 2569 ค่ำ เจ้าของงาน _"ในแผนการเดินทางอ่ะ จะมีช่วงของการดำเนินการอยู่แล้ว แต่ในรายคันอยากให้เห็นว่าแต่ละคันจะดำเนินการเมื่อไร"_ + _"ใส่ตรงหน้ารายการรถ ก็ได้ หรือจะใส่ในตอนเริ่มงานก็ได้ … อยากให้สามารถแก้ไขได้"_) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['Step 1 — แก้วันดำเนินการของคันนี้ (ปฏิทิน เลือกได้ในช่วงวันเดินทาง)', () => stepPage('S10 Step 1 แก้วันดำเนินการ', { step: 1, workPick: ['04/11/2569', '05/11/2569'] })]]],
  // S11 กบค. ตรวจรับงานรายคันของผู้รับจ้าง — ตัดออกทั้ง scenario 4 พ.ย. 2569 (เจ้าของงาน "อยากตัด scen ผู้รับจ้าง หรือ vendor ตรวจรับทีละคัน ออก") · บล็อก J ว่าง (BLOCK_OF) · ยังตัดอยู่ 10 พ.ย. 2569
  /* S23 ผู้รับจ้าง บันทึกงานรายคันและส่งตรวจงาน — ตัด 4 พ.ย. 2569 · เอากลับ 10 พ.ย. 2569 (R87) เจ้าของงาน _"scen s23 อยากปรับ ui ให้เหมือนกับ s10 แต่ว่า เงื่อนไขการมองเห็น เมนูต่างๆ ยังเป็นเหมือนเดิม"_
     UI ของ S10 ปัจจุบัน (ตัวนับ ตรวจแล้ว x/y · ปุ่มส่งออก · หน้างานรายคัน · Step 1 แบบตรวจตามประเภท R86 + วันดำเนินการ R83 + ลงนาม · Step 2 สรุปงานก่อนปิดงาน · toast ขวาบน R60)
     + การมองเห็นของ S23 เดิม (เมนู "…" ดูรายละเอียดอย่างเดียว · อะไหล่ตามแผนดูอย่างเดียว · หลังปิดงานแก้ไข ลบ เพิ่ม อะไหล่และภาพ · ส่งตรวจงาน · ส่งกลับแก้ไข) · Step 2 ไม่มีค่าใช้จ่ายและราคา
     ฝั่งผู้ตรวจรับไม่วาด (S11 ยังตัด · ผู้ตรวจรับยังไม่เคาะ) · บล็อก V */
  ['S23 · ผู้รับจ้าง บันทึกงานรายคันและส่งตรวจงาน', [
    ['หน้ารายละเอียดแผนเดินทาง มุมผู้รับจ้าง — ยังไม่เริ่มงาน ตรวจแล้ว 0/6', () => tripDetail('S23 รายละเอียดแผนเดินทาง', { trip: HIRE_T, vendor: true })],
    ['กดปุ่ม … ของยานพาหนะ — ดูรายละเอียดอย่างเดียว ไม่มีแก้ไข ลบ', () => tripDetail('S23 เมนูของยานพาหนะ', { trip: HIRE_T, vendor: true, menu: true })],
    ['หน้างานรายคัน ยังไม่เริ่ม — อะไหล่ตามแผนดูอย่างเดียว', () => jobPage('S23 งานรายคัน', { vendor: true })],
    ['กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา วันดำเนินการอ่านอย่างเดียว', async () => { const s = await stepPage('S23 Step 1 ตรวจสภาพก่อนบำรุงรักษา', { vendor: true, step: 1 }); notify(s, 'เริ่มงานบำรุงรักษาแล้ว'); return s; }],
    ['กดเซ็นลงนาม — ลงนามการตรวจสภาพ', () => stepPage('S23 ลงนามการตรวจสภาพ', { vendor: true, step: 1, filled: true, signModal: true })],
    ['ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้', () => stepPage('S23 Step 1 ลงนามครบ', { vendor: true, step: 1, filled: true, signed: true })],
    ['ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน ไม่มีค่าใช้จ่ายและราคา', () => stepPage('S23 Step 2 สรุปงานก่อนปิดงาน', { vendor: true, step: 2 })],
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus', () => stepPage('S23 Validation', { vendor: true, step: 2, errors: true })],
    ['กรอกผลงานครบ', () => stepPage('S23 ปิดงานกรอกครบ', { vendor: true, step: 2, filled: true })],
    ['ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง ดำเนินการบำรุงรักษาแล้ว ตรวจแล้ว 1/6', async () => { const s = await tripDetail('S23 ปิดงานสำเร็จ', { trip: HIRE_T, vendor: true, st: { [HIRE_DONE]: 'worked' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['หน้างานรายคัน ดำเนินการบำรุงรักษาแล้ว — ปุ่มแก้ไขงาน ส่งตรวจงาน', () => vendorJob('S23 ดำเนินการบำรุงรักษาแล้ว', { st: 'worked' })],
    ['กดไอคอนแก้ไขอะไหล่ — แก้จำนวนที่ใช้จริง', () => vendorJob('S23 แก้ไขอะไหล่', { st: 'worked', partEdit: true })],
    ['กดเพิ่มอะไหล่ — popup เพิ่มอะไหล่ที่ใช้จริง', () => vendorJob('S23 เพิ่มอะไหล่', { st: 'worked', partAdd: 'filled' })],
    ['กดไอคอนลบอะไหล่ — ยืนยันเอาออก', () => vendorJob('S23 ลบอะไหล่', { st: 'worked', partDel: true })],
    ['กดส่งตรวจงาน — ยืนยันส่งตรวจงาน', async () => { const s = await vendorJob('S23 ยืนยันส่งตรวจงาน', { st: 'worked' }); await confirm(s, HIRE_SEND_CONFIRM(TRIP_CARS[HIRE_DONE])); return s; }],
    ['ส่งตรวจงานแล้ว — รอตรวจรับ', async () => { const s = await vendorJob('S23 รอตรวจรับ', { st: 'wait' }); notify(s, 'ส่งตรวจงานแล้ว'); return s; }],
    ['บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน', () => jobPage('S23 บำรุงรักษาไม่ได้', { vendor: true, i: HIRE_CANNOT, modal: 'cannot', reason: HIRE_WHY })],
    ['บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว', () => stepPage('S23 บำรุงรักษาไม่ได้ Step 2', { vendor: true, step: 2, modal: 'cannot', reason: HIRE_WHY })],
    ['หน้างานรายคัน แจ้งบำรุงรักษาไม่ได้ — ปุ่มแก้ไขงาน ส่งตรวจงาน', () => vendorJob('S23 แจ้งบำรุงรักษาไม่ได้', { st: 'reported', cannot: true })],
    ['ถูกส่งกลับแก้ไข — คันที่ปิดงานไว้', () => vendorJob('S23 ส่งกลับแก้ไข', { st: 'returned' })],
    ['ถูกส่งกลับแก้ไข — คันที่แจ้งบำรุงรักษาไม่ได้', () => vendorJob('S23 ส่งกลับแก้ไข แจ้งไม่ได้', { st: 'returned', cannot: true })],
    ['หน้ารายละเอียดแผนเดินทาง — สถานะงานรายคันระหว่างทาง ตรวจแล้ว 2/6', () => tripDetail('S23 รายละเอียดแผนเดินทาง ระหว่างทาง', { trip: HIRE_T, vendor: true, st: HIRE_VENDOR })]]],
  ['S12 · ผู้ดำเนินการ บันทึกผลตรวจน้ำมันไฮดรอลิก', [   // 4 พ.ย. 2569 เลิก popup: ใส่ผลตอนปิดงาน (ถ้ามี) หรือภายหลังที่หน้ารายละเอียดงานรายคัน · ป้ายรอผลที่สถานะงาน
    ['Step 2 สรุปงานก่อนปิดงาน — เลือกเก็บตัวอย่าง ใส่ผลการทดสอบได้ (ถ้ามี)', () => stepPage('S12 Step 2 ผลการทดสอบ', { step: 2, filled: true })],   // 5 พ.ย. 2569 หน้าปิดงานเป็น Step 2 ของ S10
    ['ปิดงานโดยยังไม่มีผล — ป้ายรอผลตรวจน้ำมัน', async () => { const s = await tripDetail('S12 รอผลตรวจน้ำมัน', { st: JOB_MIX, oil: { [JOB_I]: 'wait' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด', () => tripDetail('S12 เมนูของยานพาหนะ', { st: JOB_MIX, oil: { [JOB_I]: 'wait' }, menu: true })],
    ['หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง', () => workDetail('S12 งานรายคัน รอผล', { res: {} })],
    ['กดบันทึกโดยยังไม่เลือกผล', () => workDetail('S12 ผลการทดสอบยังไม่ครบ', { res: { errors: true } })],
    ['เลือกผล + แนบไฟล์ (ถ้ามี)', () => workDetail('S12 ผลการทดสอบกรอกครบ', { res: { sel: 1, files: [OIL_FILE] } })],
    ['บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง', async () => { const s = await workDetail('S12 บันทึกผลสำเร็จ', { res: { sel: 1, files: [OIL_FILE], saved: true } }); notify(s, 'บันทึกผลการทดสอบน้ำมันไฮดรอลิกสำเร็จ'); return s; }],
    ['กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน', () => tripDetail('S12 น้ำมันไม่ผ่าน', { st: JOB_MIX, oil: { [JOB_I]: 'fail' } })],
    ['ผู้ดูแลยานพาหนะ — แผงแจ้งเตือน ผลตรวจน้ำมันไฮดรอลิกไม่ผ่าน กดแล้วเปิดรายละเอียดยานพาหนะ', async () => { const s = await ackList('S12 ผู้ดูแลยานพาหนะ แผงแจ้งเตือน', {}); bell(s, true); await notiPanel(s, [NOTI_OIL_FAIL, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }]]],   // 13 พ.ย. 2569 R115 ต่อท้ายบล็อก รหัสเดิมไม่เลื่อน
  /* S13 ปรับ 10 พ.ย. 2569 (เจ้าของงาน Q19 Q23 Q28 · ผู้ดูแลยานพาหนะรับทราบ + ประเมินรายคัน) — รหัส L.1–L.5 เดิม (ยังไม่เคยรีวิว) เปลี่ยนเนื้อ · L.6 ต่อท้าย
     11 พ.ย. 2569 (R94) ประเมินเป็นแบบประเมินความพึงพอใจของ กบค. → รอบต่อมา เจ้าของงาน "ย้ายออกจาก S13 ไปอยู่ view ใหม่" ⇒ S13 รับทราบอย่างเดียว · ประเมินอยู่ S27 บล็อก Y → 12 พ.ย. 2569 ย้ายเป็นเรื่องแยก satisfaction-plugin (R105) คันที่รับทราบแล้วเข้ารายการประเมินของเรื่องนั้น
     L.2 ปุ่มรับทราบกดได้ · L.4 รายการหลังรับทราบ (เดิมประเมินแล้ว) · L.7 บทบาทอื่นดูอย่างเดียว (เดิมตอบยังไม่ครบ) — รหัสเดิมไม่เลื่อน
     S14 ตรวจหลักฐานทั้งแผน และ S15 ส่งประวัติ ตัดออก 10 พ.ย. 2569 (บล็อก M N ว่าง) — S16 S17 ตัดตามมา 10 พ.ย. 2569 · ผู้ดูแลยานพาหนะรับทราบรายคันเป็นขั้นสุดท้าย · แผนปิดงานเองเมื่อทุกคันในแผนทุกไตรมาสเสร็จสิ้นหรือบำรุงรักษาไม่ได้ และรับทราบครบ (ไฟล์ 34 ข้อ 20 เจ้าของงาน 13 พ.ย. 2569) */
  ['S13 · ผู้ดูแลยานพาหนะ รับทราบผลการบำรุงรักษารายคัน', [
    ['รายการผลการบำรุงรักษารอรับทราบ — มีแจ้งเตือนใหม่', async () => { const s = await ackList('S13 รายการ', {}); bell(s, true); return s; }],
    ['ผลการบำรุงรักษารายคัน — ปุ่มรับทราบกดได้', () => ackResult('S13 ผลรายคัน', {})],   // 11 พ.ย. 2569 รอบต่อมา: ประเมินย้ายไป S27 ⇒ รับทราบอย่างเดียว กดได้ทันที (เดิม "ยังไม่ประเมิน ปุ่มรับทราบกดไม่ได้")
    ['คันที่บำรุงรักษาไม่ได้ — ฟอร์มเดียวกัน แสดงสาเหตุ รับทราบได้เลย', () => ackResult('S13 บำรุงรักษาไม่ได้', { cannot: true })],
    ['กลับหน้ารายการ — คันที่รับทราบแล้วสถานะรับทราบแล้ว', () => ackList('S13 รายการหลังรับทราบ', { accepted: [0] })],   // L.4 เดิม "ประเมินความพึงพอใจแล้ว" ไม่มีความหมายแล้ว (ประเมินย้ายไป S27) ⇒ ใช้รหัสเดิมเป็นรายการหลังรับทราบ
    ['รับทราบแล้ว — ป้ายรับทราบแล้ว ปุ่มประเมินความพึงพอใจ', async () => { const s = await ackResult('S13 รับทราบแล้ว', { done: true }); notify(s, 'รับทราบผลการบำรุงรักษา ' + TRIP_CARS[JOB_I][0] + ' แล้ว'); return s; }],
    ['เปิดแผงแจ้งเตือน — ปิดงานแล้ว รอรับทราบ', async () => { const s = await ackList('S13 แผงแจ้งเตือน', {}); bell(s, true); await notiPanel(s, [NOTI_ACK, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['บทบาทอื่นเปิดดูผล — ไม่มีปุ่มรับทราบ', () => ackResult('S13 บทบาทอื่นเปิดดู', { viewOnly: true })]]],   // L.7 เดิม "แบบประเมินตอบยังไม่ครบ" (ประเมินย้ายไป S27) ⇒ ใช้รหัสเดิมเป็นจอดูอย่างเดียวของบทบาทอื่น (Permission S13)
  /* S16 หัวหน้าหน่วยงาน ตรวจสอบประวัติ และ S17 ออกรายงานผลและปิดงาน ตัดออก 10 พ.ย. 2569 (เจ้าของงาน "s16 ตัดทิ้งไม่ต้องรับทราบทั้งแผน ตอนเสร็จงานแล้ว รับทราบรายคันก็พอ" + "s17 ตัดทิ้ง")
     บล็อก O P ว่าง · ผู้ดูแลยานพาหนะรับทราบรายคัน (S13) เป็นขั้นสุดท้าย · แผนปิดงานเองเมื่อทุกคันในแผนทุกไตรมาสเสร็จสิ้นหรือบำรุงรักษาไม่ได้ และรับทราบครบ (ไฟล์ 34 ข้อ 20) · ดูผลที่แดชบอร์ด S4 S24 */
  ['S18 · ผู้ดำเนินการ คำนวณต้นทุนการบำรุงรักษา', [   // เคาะ 10 พ.ย. 2569 (R92) · เดิม Q.1 Q.2 ร่างหน้าต้นทุนแยก
    ['รายละเอียดแผนที่อนุมัติแล้ว — แท็บต้นทุนการบำรุงรักษา', () => planDetailQ('S18 รายละเอียดแผน')],
    ['แท็บต้นทุนการบำรุงรักษา — สรุปรายไตรมาส ต้นทุนรายคัน และยานพาหนะที่บำรุงรักษาไม่ได้', () => costScreen('S18 ต้นทุน')],
    ['กดส่งออก — ส่งออกไฟล์ Excel สำเร็จ', async () => { const s = await costScreen('S18 ส่งออกแล้ว'); notify(s, 'ส่งออกไฟล์สำเร็จ'); return s; }],
    ['ไฟล์ Excel — ชีตสรุปรายไตรมาส', () => costXls('S18 ไฟล์ Excel สรุปรายไตรมาส', 0)],
    ['ไฟล์ Excel — ชีตต้นทุนรายคัน', () => costXls('S18 ไฟล์ Excel ต้นทุนรายคัน', 1)],
    ['ยังไม่มียานพาหนะปิดงาน — ยังไม่มีต้นทุน', () => costScreen('S18 ยังไม่มีต้นทุน', { empty: true })]]],
  // S19 S20 ต่อท้าย ⇒ ตัวอักษรบล็อกของ scenario เดิมไม่ขยับ · ลำดับในเรื่องอยู่ที่ journey (build.json)
  ['S19 · ผู้สร้างแผน แก้ไขแผนบำรุงรักษา แล้วส่งอนุมัติใหม่', [
    ['เมนู "…" → แก้ไข', async () => { const s = await listScreen('S19 เมนู', { rows: [planAs('returned')].concat(ownPlans(UNITS[0])) }); planMenu(s, MENU); return s; }],
    ['รายละเอียดแผน — ส่งกลับแก้ไข', () => planDetail('S19 รายละเอียดแผน', { status: 'returned' })],
    ['ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้', () => planForm('S19 ฟอร์มแก้ไข', Object.assign({ alert: ALERT_RETURNED }, EDIT_FORM))],
    ['เพิ่มยานพาหนะเข้าแผนในฟอร์มแก้ไข — ป้ายยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', () => planForm('S19 เพิ่มเข้าแผนในฟอร์มแก้ไข', Object.assign({ alert: ALERT_RETURNED }, EDIT_FORM, { q: 0, alloc: Object.assign(without(A_ALL, 9), { 10: 0 }) }))],   // 13 พ.ย. 2569 R111 แทนจอ "เอาภาคหรือตัวกรองออก" (ตัวกรองในฟอร์มเลิก 12 พ.ย. R109 · จอเดิมไม่มีอะไรต่างจากฟอร์มแก้ไข)
    ['“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น', async () => { const s = await planForm('S19 ยืนยันการออก', EDIT_FORM); await confirm(s, EXIT_CONFIRM('ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก')); return s; }],
    ['ยืนยันการแก้ไขแผน', async () => { const s = await planForm('S19 ยืนยันการแก้ไข', EDIT_FORM); await confirm(s, EDIT_CONFIRM); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S19 บันทึกไม่สำเร็จ', EDIT_FORM); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — รออนุมัติ', async () => { const s = await listScreen('S19 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(ownPlans(UNITS[0])) }); notify(s, 'บันทึกการแก้ไขแผนและส่งอนุมัติสำเร็จ'); return s; }],
    ['แผนอนุมัติแล้ว — เมนู "…" → แก้ไข', async () => { const s = await listScreen('S19 เมนูอนุมัติแล้ว', { rows: [planAs('approved')].concat(ownPlans(UNITS[0])) }); planMenu(s, MENU.slice(0, 2)); return s; }],
    ['แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่', () => planForm('S19 ฟอร์มอนุมัติแล้ว', Object.assign({ alert: ALERT_APPROVED }, EDIT_FORM))],
    ['แผนดำเนินการแล้ว — เมนู "…" → แก้ไข ได้เฉพาะไตรมาสที่ยังไม่เสร็จ', async () => { const s = await listScreen('S19 เมนูดำเนินการ', { rows: ownPlans(UNITS[0]) }); planMenu(s, MENU.slice(0, 2)); return s; }]]],   // R113 13 พ.ย. 2569 (เดิม "ดูรายละเอียดอย่างเดียว") · ฟอร์มแก้ไขแผนที่ดำเนินการ (Alert แผนอยู่ระหว่างดำเนินการ · ไตรมาสที่เสร็จแล้วล็อก · ปุ่มบันทึก ไม่ต้องอนุมัติใหม่) มีแต่เว็บ รอเคาะว่าทำจอ Figma ตามไหม (คำถามไฟล์ 34)
  ['S20 · ผู้สร้างแผน ลบแผนบำรุงรักษาที่ยังไม่อนุมัติ', [
    ['เมนู "…" → ลบ ในหน้า List', async () => { const s = await listScreen('S20 เมนู', { rows: [planAs('returned')].concat(ownPlans(UNITS[0])) }); planMenu(s, MENU); return s; }],   // 13 พ.ย. 2569 ไฟล์ 34 ข้อ 6: ลบได้เฉพาะแผนส่งกลับแก้ไข (แผนรออนุมัติดูอย่างเดียว)
    ['ยืนยันการลบแผน ในหน้า List', async () => { const s = await listScreen('S20 ยืนยันการลบ List', { rows: [planAs('returned')].concat(ownPlans(UNITS[0])) }); await confirm(s, DELETE_CONFIRM); return s; }],
    ['ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)', async () => { const s = await listScreen('S20 ลบสำเร็จ', { rows: ownPlans(UNITS[0]) }); notify(s, 'ลบแผนบำรุงรักษาสำเร็จ'); return s; }],
    ['ปุ่ม “ลบแผน” ในหน้า Detail', () => planDetail('S20 ปุ่มลบแผน', { status: 'returned' })],   // 13 พ.ย. 2569 แผนรออนุมัติดูอย่างเดียว (S1 · เจ้าของงาน 5 พ.ย. 2569) ⇒ ปุ่มลบแผนในหน้า Detail = แผนส่งกลับแก้ไข แบบเว็บ detail/page.tsx
    ['ยืนยันการลบแผน ในหน้า Detail', async () => { const s = await planDetail('S20 ยืนยันการลบ Detail', { status: 'returned' }); await confirm(s, DELETE_CONFIRM); return s; }],
    ['แผนอนุมัติแล้ว — หน้ารายละเอียดไม่มีปุ่มลบ', () => planDetail('S20 อนุมัติแล้ว', { status: 'approved' })]]],
  /* S21 ปรับ 5 พ.ย. 2569 (เจ้าของงาน): จัดการอะไหล่ทีละคัน (หน้าแยก) · เข้าจากไอคอนแก้ไขที่แถวรถในแท็บไตรมาส n · บันทึกแล้วรวมลงหัวข้ออะไหล่ในไตรมาส (ตั้งต้นว่าง) */
  ['S21 · ผู้สร้างแผน จัดการอะไหล่ของยานพาหนะแต่ละคันในแผน', [
    ['แท็บไตรมาส 1 — ทุกคันยังไม่กำหนด อะไหล่ในไตรมาสว่าง', () => planForm('S21 แท็บไตรมาส 1', Object.assign({ values: FILLED, alloc: A_ALL, q: 1 }, R2))],
    ['เมนู … → แก้ไข — หน้าจัดการอะไหล่ของยานพาหนะ (ยังไม่กำหนด)', () => carPartsScreen('S21 สิ่งที่ต้องทำของยานพาหนะ', {})],
    ['เลือกยานพาหนะคันอื่น — รายการยานพาหนะในไตรมาสเปิด', () => carPartsScreen('S21 เลือกยานพาหนะ', { carOpen: true })],
    ['เลือกเปลี่ยนน้ำมัน — ระบุเบอร์น้ำมัน รหัส จำนวนลิตร', () => carPartsScreen('S21 เปลี่ยนน้ำมัน', { oil: 1, oilSpec: { code: OIL_SPEC.code, litre: OIL_SPEC.litre }, gradeOpen: true })],
    ['เลือกไส้กรองจากคลัง — เข้าอะไหล่อื่นๆ ของยานพาหนะคันนี้', () => carPartsScreen('S21 เลือกไส้กรอง', { oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD })],
    ['ระบุอะไหล่เพิ่มเติม — popup ชื่อ ยี่ห้อ รุ่น รหัส จำนวน หน่วย', () => carPartsScreen('S21 ระบุอะไหล่', { oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD, manual: {} })],
    ['ระบุอะไหล่เพิ่มเติมแล้ว — อยู่ในรายการ', () => carPartsScreen('S21 ระบุอะไหล่แล้ว', { oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD, manual: { filled: true } })],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await carPartsScreen('S21 ยืนยันการออก', { oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD, manual: { filled: true } }); await confirm(s, EXIT_CONFIRM('อะไหล่ที่แก้ไขไว้จะไม่ถูกบันทึก')); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await carPartsScreen('S21 บันทึกไม่สำเร็จ', { oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD, manual: { filled: true } }); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — กลับแท็บไตรมาส 1 ยานพาหนะ 1 คันกำหนดแล้ว อะไหล่ในไตรมาสมีของคันนี้', async () => { const s = await planForm('S21 บันทึกสำเร็จ', Object.assign({ values: FILLED, alloc: A_ALL, q: 1, picks: { 0: CAR_ADD }, oils: { 0: 1 }, manualCars: [0] }, R2)); notify(s, 'บันทึกอะไหล่ของยานพาหนะ ' + CAND[0][0] + ' แล้ว'); return s; }],
    // 6 พ.ย. 2569 เลือกเบิก หรือไม่เบิกอะไหล่ — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['เลือกเบิกอะไหล่ — คลังอะไหล่และรายการขึ้น ยังไม่เลือกอะไหล่ ปุ่มบันทึกกดไม่ได้', () => carPartsScreen('S21 เลือกเบิกอะไหล่', { draw: 'take' })],
    ['เลือกไม่เบิกอะไหล่ — ไม่ต้องเลือกอะไหล่ ปุ่มบันทึกกดได้', () => carPartsScreen('S21 เลือกไม่เบิก', { draw: 'none' })],
    ['บันทึกไม่เบิกอะไหล่แล้ว — แถวยานพาหนะขึ้น ไม่เบิกอะไหล่', async () => { const s = await planForm('S21 บันทึกไม่เบิก', Object.assign({ values: FILLED, alloc: A_ALL, q: 1, picks: { 0: CAR_ADD }, oils: { 0: 1, 1: 0 }, manualCars: [0], draw: { 1: 'none' } }, R2)); notify(s, 'บันทึกอะไหล่ของยานพาหนะ ' + CAND[1][0] + ' แล้ว'); return s; }],
    // 13 พ.ย. 2569 กำหนดอะไหล่หลายคัน (R112 · เว็บ BACKLOG 64) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['ติ๊กหลายคันในแท็บไตรมาส 1 — ปุ่มกำหนดอะไหล่ (2)', () => planForm('S21 ติ๊กหลายคัน', Object.assign({ values: FILLED, alloc: A_ALL, q: 1, ticked: [1, 2] }, R2))],
    ['หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — ตารางยานพาหนะที่เลือก ยังไม่กำหนด', () => carPartsScreen('S21 หลายคัน', { cars: [1, 2] })],
    ['หลายคัน เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง — ปุ่มบันทึกอะไหล่ของยานพาหนะ 2 คันกดได้', () => carPartsScreen('S21 หลายคัน กรอกแล้ว', { cars: [1, 2], draw: 'take', oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD })],
    ['หลายคันต่างรุ่นและบางคันกำหนดไว้แล้ว — Alert เตือน 2 แบบ', () => carPartsScreen('S21 หลายคัน เตือน', { cars: [0, 1, 3], cur: { picks: { 0: CAR_ADD }, oils: { 0: 1 } }, draw: 'take', oil: 1, oilSpec: OIL_SPEC, picked: CAR_ADD })],
    ['บันทึกหลายคันสำเร็จ — กลับแท็บไตรมาส 1 ทั้ง 2 คันกำหนดแล้ว', async () => { const s = await planForm('S21 บันทึกหลายคัน', Object.assign({ values: FILLED, alloc: A_ALL, q: 1, picks: { 1: CAR_ADD, 2: CAR_ADD }, oils: { 1: 1, 2: 1 } }, R2)); notify(s, 'บันทึกอะไหล่ของยานพาหนะ 2 คันแล้ว'); return s; }],
    // 13 พ.ย. 2569 ไฟล์ 34 ข้อ 3 (ก) — ต่อท้าย รหัสจอเดิมไม่เลื่อน · เปิดจากเมนู … ของแท็บทั้งหมด ช่องเลือกยานพาหนะเป็นยานพาหนะในแผน (คันที่ยังไม่จัดไตรมาสก็เลือกได้)
    ['เปิดจากแท็บทั้งหมด — เลือกยานพาหนะคันอื่น รายการยานพาหนะในแผน บอกไตรมาส', () => carPartsScreen('S21 เลือกยานพาหนะในแผน', { from: 'all', carOpen: true, alloc: plus(A_Q1, { 3: 0 }) })]]],
  /* S22 กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส — ตัดออก 6 พ.ย. 2569 (เจ้าของงาน "ตอนที่เลือกรถเข้าแผน เลือกอะใหล่ อยากให้ส่งจำนวนทั้งปีไปที่ smartinventory โดยยังไม่ส่งให้ตัด แค่ inform" + เลือกส่งตอนแผนอนุมัติแล้ว แทนการให้คลังกดรับทราบ)
     ⇒ ระบบแจ้ง Smart Inventory ตอน S2 อนุมัติ · บล็อก U เว้นว่าง · warehouseScreen/whParts คงไว้ */
  /* S24 ข้อมูลการบำรุงรักษารายคัน (เจ้าของงาน 4 พ.ย. 2569 · เลขชั่วคราว = W ต่อท้าย) — แท็บ การบำรุงรักษา ของ Vehicle Management */
  /* S24 ปรับ 10 พ.ย. 2569 เป็นแดชบอร์ดรายคัน + รายละเอียดยานพาหนะ 5 แท็บ (R90) — รหัส W.1–W.8 เดิมเปลี่ยนเนื้อ · W.9–W.17 ต่อท้าย */
  ['S24 · ผู้ดำเนินการ ติดตามข้อมูลการบำรุงรักษารายคันและกำหนดครั้งถัดไป', [
    ['แท็บการบำรุงรักษา — แดชบอร์ดยานพาหนะทุกคัน การ์ดตัวเลข เรียงกำหนดครั้งถัดไป', () => maList('S24 การบำรุงรักษา', {})],
    ['ค้นหาทะเบียน', () => maList('S24 ค้นหาทะเบียน', { query: '82-1145', rows: [MA_CAR] })],
    ['ค้นหาไม่พบ', () => maList('S24 ค้นหาไม่พบ', { query: '99-9999', rows: [] })],
    ['กดตัวกรอง — แผงตัวกรอง ประเภท สังกัด บำรุงรักษาล่าสุด ครบกำหนดภายใน รายการ ผลตรวจน้ำมัน', () => maList('S24 แผงตัวกรอง', { filter: {} })],
    ['กรองแล้ว — ใกล้ครบกำหนดบำรุงรักษา', () => maList('S24 กรองใกล้ครบกำหนด', { chips: [MA_DUE.near[0]], rows: maIdx(r => { const n = maNext(r); return n && n[2] === 'near'; }) })],
    ['กดเลขทะเบียน — เปิดหน้ารายละเอียดยานพาหนะ แท็บข้อมูลยานพาหนะ', () => maDetail('S24 กดเลขทะเบียน', { tab: 0, row: 1 })],   // 12 พ.ย. 2569 (R107) แบบ Vehicle info ของ VMS+ · 80-5738 น่าน = ภาพที่เจ้าของงานรีวิวบนเว็บ (info-80-5738)   // 10 พ.ย. 2569 รอบ 2 ไม่มีคอลัมน์ปุ่ม … แล้ว
    ['รายละเอียดยานพาหนะ — แท็บตารางบำรุงรักษา กำหนดครั้งถัดไป 5 รายการ', () => maDetail('S24 ตารางบำรุงรักษา', { tab: 1 })],
    ['ประวัติ กดปุ่ม … — ดูรายละเอียดงานที่ปิดแล้ว', () => maDetail('S24 เมนูประวัติ', { tab: 1, menu: true })],
    ['กรองแล้ว — ต้องเก็บตัวอย่างน้ำมัน', () => maList('S24 กรองเก็บตัวอย่างน้ำมัน', { chips: ['เก็บตัวอย่างน้ำมัน'], rows: maIdx(r => r[1] && maOil(r)[0] === 'เก็บตัวอย่าง' && maOil(r)[1][1]) })],
    ['กรองแล้ว — บำรุงรักษาล่าสุดเกิน 12 เดือน', () => maList('S24 กรองบำรุงรักษาล่าสุด', { chips: ['บำรุงรักษาล่าสุด เกิน 12 เดือน'], rows: maIdx(r => r[1] && maKey(r[1]) < maKey('10/11/2568')) })],
    ['กรองแล้ว — ครบกำหนดภายใน 3 เดือน', () => maList('S24 กรองภายใน 3 เดือน', { chips: ['ครบกำหนดภายใน 3 เดือน'], rows: maIdx(r => { const n = maNext(r); return n && maKey(n[1]) <= maKey('10/02/2570'); }) })],
    ['แท็บตารางบำรุงรักษา — คันที่ครบกำหนดหลายรายการ ปีที่ครบเปลี่ยนน้ำมัน', () => maDetail('S24 ตารางบำรุงรักษา ครบกำหนด', { tab: 1, row: 0 })],   // 10 พ.ย. 2569 รอบ 2 แทนแท็บข้อมูลยานพาหนะ (ย้ายไป W.6)
    /* 12 พ.ย. 2569 (R107) W.13 = แท็บประวัติการซ่อมบำรุงแบบรวมซ่อม + บำรุงรักษา ป้าย Overhaul · W.14 W.15 เดิมแท็บการรับประกัน (เอาออก) ⇒ ส่วนการรับประกันท้ายแท็บข้อมูลยานพาหนะ · ยานพาหนะนอกกลุ่มเครื่องมือกล */
    ['รายละเอียดยานพาหนะ — แท็บประวัติการซ่อมบำรุง ซ่อมและบำรุงรักษาเรียงวันที่ปิดงาน ป้าย Overhaul', () => maDetail('S24 ประวัติการซ่อมบำรุง', { tab: 4 })],
    ['แท็บข้อมูลยานพาหนะ — มีงานในประกัน ส่วนการรับประกันท้ายแท็บ', () => maDetail('S24 ข้อมูลยานพาหนะ มีประกัน', { tab: 0 })],
    ['แท็บข้อมูลยานพาหนะ — รหัสข้างนอกกลุ่ม 04 07 08 09 10 ไม่มีส่วนเครื่องมือกล ไม่มีงานในประกัน', () => maDetail('S24 ข้อมูลยานพาหนะ นอกกลุ่มเครื่องมือกล', { tab: 0, row: 0 })],
    // W.16 W.17 แท็บ Overhaul เอาออก 10 พ.ย. 2569 รอบ 2 (เจ้าของงาน "มี tab แต่ไม่มี display ออกมา")
    /* 12 พ.ย. 2569 แดชบอร์ดแบบ VMS+ (R106) — ต่อท้าย W.16 W.17 W.18 (รหัสเดิมของแท็บ Overhaul ที่เอาออกแล้ว) · กดกราฟ/กดเรื่องที่ควรดู = กรองทั้งหน้า + ชิปตัวกรองที่เลือก */
    ['กดกราฟ — ส่วนเลยกำหนดของโดนัทสถานะกำหนดบำรุงรักษา กรองทั้งหน้า', () => maList('S24 กดกราฟเลยกำหนด', { chips: ['สถานะ เลยกำหนด'], rows: MA_ALERT.over, pickChart: 'status' })],
    ['กดเรื่องที่ควรดู — ผลตรวจน้ำมันล่าสุดไม่ผ่าน กรองทั้งหน้า', () => maList('S24 กดเรื่องที่ควรดู', { chips: ['ผลตรวจน้ำมันล่าสุด ไม่ผ่าน'], rows: MA_ALERT.fail, alert: 'fail', pickChart: 'oil' })],
    ['มุมมองมือถือ — การ์ดตัวเลข 2 ใบต่อแถว กราฟเรียงทีละใบ ตารางเป็นการ์ด', () => maList('S24 มุมมองมือถือ', { mobileAll: true })],
    /* 12 พ.ย. 2569 (R107 · เว็บ f6f5e0d BACKLOG ข้อ 84 85) — การ์ดเครื่องมือกลของ กบค. · แท็บประวัติใหม่ 2 แท็บ · มุมมองมือถือของแท็บข้อมูลยานพาหนะ */
    ['กบค. — การ์ดเครื่องมือกล ช่องที่ยังไม่มีข้อมูลมีปุ่มเพิ่ม ช่องที่มีข้อมูลแก้ไขได้', () => maDetail('S24 เครื่องมือกล กบค.', { tab: 0, row: 1, kbk: true })],
    ['กบค. — ยานพาหนะในกลุ่มที่ยังไม่มีเครื่องมือกล การ์ดว่าง ปุ่มเพิ่มเครื่องมือกล', () => maDetail('S24 ไม่มีเครื่องมือกล กบค.', { tab: 0, row: 8, kbk: true })],
    ['แท็บประวัติการบำรุงรักษาเครื่องจักร — บันทึกบำรุงรักษาตามวาระ', () => maDetail('S24 ประวัติเครื่องจักร', { tab: 2 })],
    ['แท็บประวัติการบำรุงรักษาเครื่องยนต์ — เช็คระยะที่ศูนย์บริการ', () => maDetail('S24 ประวัติเครื่องยนต์', { tab: 3 })],
    ['แท็บข้อมูลยานพาหนะบนมือถือ — เรียง 1 คอลัมน์ลำดับเดียวกับ desktop กบค. แก้ไขเครื่องมือกลได้', () => maDetail('S24 ข้อมูลยานพาหนะ มุมมองมือถือ', { tab: 0, kbk: true })],
    /* 12 พ.ย. 2569 (R107 · MachineModal ของเว็บ) — popup เพิ่ม/แก้ไขเครื่องมือกลของ กบค. · ไม่ผ่านเงื่อนไข · บันทึกสำเร็จ */
    ['popup เพิ่มเครื่องมือกล — กบค. กดเพิ่มจากการ์ดว่าง ช่องว่าง รหัสทรัพย์สินย่อยตั้งต้น 0001', async () => { const s = await maDetail('S24 popup เพิ่มเครื่องมือกล', { tab: 0, row: 8, kbk: true }); await machineModal(s, 8); return s; }],
    ['popup แก้ไขเครื่องมือกล — ค่าเดิมของเครื่องเป็นค่าตั้งต้น ช่องที่ไม่มีข้อมูลว่าง', async () => { const s = await maDetail('S24 popup แก้ไขเครื่องมือกล', { tab: 0, row: 1, kbk: true }); await machineModal(s, 1, { edit: true }); return s; }],
    ['กดบันทึกโดยยังไม่กรอก — ช่องบังคับขึ้นข้อความ error', async () => { const s = await maDetail('S24 เครื่องมือกล ไม่ผ่านเงื่อนไข', { tab: 0, row: 8, kbk: true }); await machineModal(s, 8, { tried: true }); return s; }],
    ['บันทึกเครื่องมือกลสำเร็จ — ปิด popup การ์ดแสดงค่าที่บันทึก', async () => { const s = await maDetail('S24 บันทึกเครื่องมือกลสำเร็จ', { tab: 0, row: 1, kbk: true }); notify(s, MC_OK); return s; }],
    ]],
  /* S25 ย้ายรถที่บำรุงรักษาไม่ได้ไปไตรมาสอื่น (เจ้าของงาน 5 พ.ย. 2569 · บล็อก X) — ทางเข้าหน้าไตรมาส (S6) · ไปได้เฉพาะไตรมาสถัดไปของแผนเดียวกัน · รถและอะไหล่ตามแผนย้ายตาม · ไม่ต้องอนุมัติใหม่ */
  ['S25 · ผู้ดำเนินการ ย้ายยานพาหนะที่บำรุงรักษาไม่ได้ไปไตรมาสอื่น', [
    ['หน้าไตรมาส 1 — ยานพาหนะที่บำรุงรักษาไม่ได้ ป้ายบำรุงรักษาไม่ได้', () => moveQuarter('S25 ไตรมาส 1 ยานพาหนะบำรุงรักษาไม่ได้', 0)],
    ['กดปุ่ม … ของยานพาหนะ — ดำเนินการบำรุงรักษา หรือ ย้ายไปไตรมาสอื่น', async () => { const s = await moveQuarter('S25 เมนูย้ายไปไตรมาสอื่น', 0); moveMenu(s, MOVE_I); return s; }],
    ['popup ย้ายไปไตรมาสอื่น — ยังไม่เลือกไตรมาส', async () => { const s = await moveQuarter('S25 popup ย้ายไปไตรมาสอื่น', 0); await moveModal(s, { cur: 0 }); return s; }],
    ['เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้', async () => { const s = await moveQuarter('S25 เลือกไตรมาส 2', 0); await moveModal(s, { cur: 0, sel: MOVE_TO }); return s; }],
    ['กรณีไตรมาส 3 — ไตรมาสก่อนหน้าและไตรมาสปัจจุบันเลือกไม่ได้', async () => { const s = await moveQuarter('S25 popup ไตรมาส 3', 2); await moveModal(s, { cur: 2, trip: MOVE_T3 }); return s; }],
    ['ยืนยันการย้ายยานพาหนะ', async () => { const s = await moveQuarter('S25 ยืนยันการย้ายยานพาหนะ', 0); await confirm(s, MOVE_CONFIRM(MOVE_TO)); return s; }],
    ['ย้ายสำเร็จ — ไตรมาส 1 ไม่มียานพาหนะคันนี้แล้ว', async () => { const s = await tripList('S25 ย้ายสำเร็จ', { trips: [JOB_T], removed: [MOVE_I] }); notify(s, MOVE_TOAST); return s; }],
    ['หน้าไตรมาส 2 — ยานพาหนะที่ย้ายมา ยังไม่มีแผนเดินทาง', () => moveQuarter('S25 ไตรมาส 2', MOVE_TO)],   // 9 พ.ย. 2569 ชุดเดียวกับ X.9 (MOVE_Q2_PAGE)
    ['หน้าไตรมาส 2 — อะไหล่ในไตรมาสรวมอะไหล่ของยานพาหนะที่ย้ายมา', () => moveQuarter('S25 อะไหล่ไตรมาส 2', MOVE_TO)],   // 9 พ.ย. 2569 แก้ moveQuarter(…, 2) ที่ได้หน้าไตรมาส 3 · 6 พ.ย. 2569 เดิมหน้าความคืบหน้าอะไหล่ S4 (เปลี่ยนเป็นแดชบอร์ด) ⇒ หัวข้ออะไหล่ในไตรมาสของหน้าไตรมาส   // 6 พ.ย. 2569 เดิมหน้าความคืบหน้าอะไหล่ S4 (เปลี่ยนเป็นแดชบอร์ด) ⇒ หัวข้ออะไหล่ในไตรมาสของหน้าไตรมาส
    ['ไตรมาส 4 — เมนูย้ายไปไตรมาสอื่นกดไม่ได้', async () => { const s = await moveQuarter('S25 ไตรมาส 4 ย้ายไม่ได้', 3); moveMenu(s, 0, true); return s; }],
    // 10 พ.ย. 2569 เจ้าของงาน "ตัวเลือกต้องสามารถเลือก ดำเนินการบำรุงรักษา และ ย้ายไปไตรมาสอื่น" — ต่อท้าย X.11 X.12 รหัสเดิมไม่เลื่อน
    ['เลือกดำเนินการบำรุงรักษา — ยืนยันนำยานพาหนะกลับมาบำรุงรักษาในไตรมาสเดิม', async () => { const s = await moveQuarter('S25 ยืนยันดำเนินการบำรุงรักษา', 0); await confirm(s, MAINT_CONFIRM()); return s; }],
    ['ดำเนินการบำรุงรักษาแล้ว — ยานพาหนะกลับเป็นยังไม่มีแผนเดินทาง รอเพิ่มเข้าแผนเดินทาง', async () => { const s = await tripList('S25 ดำเนินการบำรุงรักษาแล้ว', { trips: [Object.assign({}, JOB_T, { sel: JOB_T.sel.filter(i => i !== MOVE_I) })] }); notify(s, MAINT_TOAST()); return s; }]]],
  /* S27 แบบประเมินความพึงพอใจ (บล็อก Y เดิม) ย้ายไปเรื่องแยก satisfaction-plugin 12 พ.ย. 2569 (R105) */
];


/* ---------- จอ ↔ กล่องในผัง userflow (เจ้าของงานสั่ง 22 ต.ค. 2569: userflow กับ wireframe อยู่ข้างกันตอน export) ----------
   ชื่อ state → id กล่องในผัง mermaid ของ Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md (คั่นด้วยช่องว่างได้หลายกล่อง)
   ไม่ใส่ = ผังยังไม่มีกล่องของจอนี้ ⇒ ปลั๊กอินเขียนบอกใต้ผัง "จอที่ยังไม่มีกล่องในผัง" (รอเติม userflow — ไม่เติมผังเอง) */
const FLOW_NODES = {
  S1: { 'รายการแผน': 'D1', 'รายการแผน — ยังไม่มีแผน': 'D0', 'ฟอร์มสร้างแผน (ว่าง)': 'D2', 'เลือกปีงบประมาณ — รายการปีเปิด': 'A2', 'กดตัวกรอง — แผงตัวกรอง ยังไม่เลือกภาค เขต ประเภทยานพาหนะ': 'A3', 'เลือกภาค เขต ในแผงตัวกรอง — รายการเขตของภาคที่เลือก': 'A7', 'กดตัวกรอง — แผงตัวกรอง รายการภาค มี สนง. (สำนักงานใหญ่)': 'A3', 'กดตัวกรอง — แผงตัวกรอง เลือกภาค สนง. รายการเขต กองของสำนักงานใหญ่': 'A7', 'ยานพาหนะทั้งหมดของพื้นที่ที่เลือก — กดตกลงแล้ว ชิปตัวกรอง ยังไม่ติ๊ก': 'D4', 'ค้นหาและกรองแล้ว': 'A8', 'ไม่พบยานพาหนะที่ตรงกับคำค้นหรือตัวกรอง': 'A8', 'ติ๊กยานพาหนะ 3 คัน — ปุ่มจัดลงไตรมาสกดได้': 'A5', 'กดจัดลงไตรมาส — popup เลือกไตรมาส': 'D6', 'จัดลงไตรมาสแล้ว — ป้ายไตรมาสในตาราง ตัวเลขบนแท็บเปลี่ยน': 'D3', 'แท็บไตรมาส 1 — ทุกคันกำหนดแล้ว อะไหล่ในไตรมาสรวมครบ': 'D12', 'ย้ายยานพาหนะไปไตรมาสอื่น — ติ๊กยานพาหนะที่จัดแล้ว': 'D6', 'เอาภาคหรือตัวกรองออก — ยานพาหนะที่จัดแล้วยังอยู่ในไตรมาส': 'D7', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'D8', 'บันทึกและส่งอนุมัติสำเร็จ — รออนุมัติ': 'A6 D5', 'รายละเอียดแผน — รออนุมัติ ดูอย่างเดียว': 'D9', 'รายละเอียดแผน — อนุมัติแล้ว': 'D10', 'รายละเอียดแผน — ส่งกลับแก้ไข เห็นเหตุผล กดแก้ไขไป S19': 'D11', 'ไตรมาสที่ยังไม่มียานพาหนะ — ปุ่มเพิ่มยานพาหนะเข้าไตรมาส 3': 'D13', 'กดเพิ่มยานพาหนะเข้าไตรมาส 3 — popup ยานพาหนะที่ยังไม่อยู่ในไตรมาสใด': 'A13 D14', 'ติ๊กยานพาหนะ 2 คัน — ปุ่มเพิ่มเข้าไตรมาส 3 กดได้': 'A14', 'เพิ่มยานพาหนะเข้าไตรมาส 3 แล้ว — แท็บไตรมาส 3 มียานพาหนะ ตัวเลขบนแท็บเปลี่ยน': 'D15', 'ทุกคันในพื้นที่จัดลงไตรมาสแล้ว — popup ไม่มียานพาหนะให้เพิ่ม': 'D16', 'แท็บทั้งหมด — อะไหล่รวมทุกไตรมาส รวมอะไหล่ของยานพาหนะทุกคันที่จัดลงไตรมาสแล้ว': 'D12' },
  S6: { 'รายการแผน — เมนู "…" ดูรายละเอียดแผนที่อนุมัติแล้ว': 'D7 A7', 'รายละเอียดแผน — กดไปหน้าไตรมาส 1': 'D8 A8', 'หน้าไตรมาส 1 — ยังไม่มีแผนเดินทาง': 'D1', 'ฟอร์มสร้างแผนเดินทาง (ว่าง)': 'D2', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะทุกคันของไตรมาส': 'D5', 'เพิ่มยานพาหนะแล้ว — สถานที่ตั้งต้นสำนักงานที่ยานพาหนะอยู่': 'D4', 'แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันเดินทาง': 'A5', 'กดไอคอนลบ — เอายานพาหนะออกจากแผนเดินทางนี้ (soft delete)': 'A9', 'กดเพิ่มยานพาหนะอีกครั้ง — ยานพาหนะที่เอาออกกลับมาเลือกได้': 'D5', 'เลือกช่วงวันเดินทาง': 'A3', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'D9', 'กรอกครบ': 'A4', 'สร้างแผนเดินทางสำเร็จ — กลับหน้าไตรมาส 1 แสดงแผนเดินทางใหม่ (รออนุมัติ)': 'D3', 'สร้างแผนเดินทางใบถัดไป — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้': 'D5', 'แผนเดินทาง 2 ใบ — ยานพาหนะครบทุกคัน ปุ่มสร้างแผนเดินทางกดไม่ได้': 'D6', 'แผนเดินทางถูกส่งกลับแก้ไข': 'D1', 'แก้ไขแผนเดินทางที่ถูกส่งกลับ': 'D2', 'ส่งอนุมัติใหม่แล้ว': 'D3', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะที่ยังไม่อยู่ในแผน เพิ่มได้ทุกคัน': 'AA', 'เพิ่มยานพาหนะเข้าไตรมาสแล้ว': 'D1', 'กดไอคอนแก้ไข — แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษา': 'AQ', 'กดไอคอนลบ — ยืนยันเอายานพาหนะออกจากไตรมาส': 'AQ', 'เอายานพาหนะออกจากไตรมาสแล้ว': 'D1', 'ทุกคันในไตรมาสปิดงานแล้ว (รวมบำรุงรักษาไม่ได้) — ปุ่มเพิ่มยานพาหนะกดไม่ได้': 'D11',
    // 6 พ.ย. 2569 E.24 E.25 วันดำเนินการรายคัน (R83) — กล่อง D10 ในผัง S6 ของไฟล์ 14
    'เลือกวันดำเนินการ — ปฏิทินเลือกได้เฉพาะช่วงวันเดินทาง วันนอกช่วงกดไม่ได้': 'D10', 'บันทึกวันดำเนินการแล้ว — หลายคันวันเดียวกันได้ คันที่ไม่แก้คงทั้งช่วงวันเดินทาง': 'D4' },
  S10: { 'หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน ตรวจแล้ว 0/4': 'D1', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ลบ': 'D1', 'เมนูแก้ไข — แก้ไขยานพาหนะในแผนเดินทาง ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ': 'A6', 'เมนูลบ — ยืนยันเอายานพาหนะออกจากแผนเดินทาง': 'A7', 'หน้างานรายคัน — ยังไม่เริ่ม': 'D2', 'กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา สถานะอยู่ระหว่างบำรุงรักษา': 'A2 D3', 'กดเซ็นลงนาม — ลงนามการตรวจสภาพ': 'D3', 'ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้': 'Q4', 'ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน': 'A4 D6', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'Q2', 'เลือกวันที่เปลี่ยนน้ำมันครั้งล่าสุด — ปฏิทิน': 'D6', 'เลือกงบที่ตัด หน่วยงานอื่น — ระบุศูนย์ต้นทุน': 'D6', 'กรอกผลงานครบ': 'A5', 'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง เสร็จสิ้น + รอผลตรวจน้ำมัน': 'D4', 'ปิดงานสำเร็จ — เปลี่ยนน้ำมันอย่างเดียว ไม่มีป้ายรอผลตรวจน้ำมัน': 'D4', 'บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน': 'A3', 'บำรุงรักษาไม่ได้ — ยังไม่ระบุสาเหตุ': 'A3', 'บำรุงรักษาไม่ได้ระหว่าง Step 1 — คืนอะไหล่ตามแผนทั้งหมด': 'A3', 'บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว': 'A3', 'บันทึกบำรุงรักษาไม่ได้แล้ว — กลับหน้ารายละเอียดแผนเดินทาง ตรวจแล้ว 0/3': 'D4', 'ดูงานที่ปิดแล้ว — เสร็จสิ้น': 'D5', 'Step 2 — แนบเอกสาร Safety Inspection (ถ้ามี)': 'D6', 'หน้างานรายคัน — เพิ่มเอกสาร Safety Inspection ภายหลัง': 'D5', 'บันทึกเอกสาร Safety Inspection สำเร็จ': 'D5', 'แผนจ้างดำเนินการ — หน้ารายละเอียดแผนเดินทาง กดปุ่ม … ของยานพาหนะ': 'D1', 'แผนจ้างดำเนินการ — Step 2 สรุปงานก่อนปิดงาน หน่วยงานปิดงานแทนผู้รับจ้าง': 'D6',
    // 6 พ.ย. 2569 I.27–I.32 ส่งออกแผนเดินทาง (R84) — กล่อง A9 D7 ในผัง S10 ของไฟล์ 14
    'หน้ารายละเอียดแผนเดินทาง — กดส่งออก — popup รูปแบบไฟล์': 'A9', 'ส่งออกแผนเดินทางสำเร็จ': 'D7', 'ไฟล์ PDF หน้า 1 — รายละเอียดแผนเดินทาง และยานพาหนะ': 'D7', 'ไฟล์ PDF หน้า 2 — อะไหล่ของแผนเดินทาง': 'D7',
    'ไฟล์ Excel — ชีตยานพาหนะในแผนเดินทาง': 'D7', 'ไฟล์ Excel — ชีตอะไหล่ของแผนเดินทาง': 'D7' },
  // 10 พ.ย. 2569 S23 เอากลับ (R87) — กล่องในผัง S23 ของไฟล์ 14
  S23: { 'หน้ารายละเอียดแผนเดินทาง มุมผู้รับจ้าง — ยังไม่เริ่มงาน ตรวจแล้ว 0/6': 'D1', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียดอย่างเดียว ไม่มีแก้ไข ลบ': 'A0', 'หน้างานรายคัน ยังไม่เริ่ม — อะไหล่ตามแผนดูอย่างเดียว': 'D2',
    'กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา วันดำเนินการอ่านอย่างเดียว': 'A2 D3', 'กดเซ็นลงนาม — ลงนามการตรวจสภาพ': 'D3', 'ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้': 'Q4',
    'ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน ไม่มีค่าใช้จ่ายและราคา': 'A4 D6', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'Q2', 'กรอกผลงานครบ': 'A5',
    'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง ดำเนินการบำรุงรักษาแล้ว ตรวจแล้ว 1/6': 'D9', 'หน้างานรายคัน ดำเนินการบำรุงรักษาแล้ว — ปุ่มแก้ไขงาน ส่งตรวจงาน': 'D4',
    'กดไอคอนแก้ไขอะไหล่ — แก้จำนวนที่ใช้จริง': 'A6', 'กดเพิ่มอะไหล่ — popup เพิ่มอะไหล่ที่ใช้จริง': 'A6', 'กดไอคอนลบอะไหล่ — ยืนยันเอาออก': 'A6', 'กดส่งตรวจงาน — ยืนยันส่งตรวจงาน': 'A8', 'ส่งตรวจงานแล้ว — รอตรวจรับ': 'D7',
    'บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน': 'A3', 'บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว': 'A3', 'หน้างานรายคัน แจ้งบำรุงรักษาไม่ได้ — ปุ่มแก้ไขงาน ส่งตรวจงาน': 'D5',
    'ถูกส่งกลับแก้ไข — คันที่ปิดงานไว้': 'D8', 'ถูกส่งกลับแก้ไข — คันที่แจ้งบำรุงรักษาไม่ได้': 'D8', 'หน้ารายละเอียดแผนเดินทาง — สถานะงานรายคันระหว่างทาง ตรวจแล้ว 2/6': 'D1' },
  S24: { 'แท็บการบำรุงรักษา — ยานพาหนะทุกคัน เรียงกำหนดครั้งถัดไป': 'D1', 'ค้นหาทะเบียน': 'A1', 'ค้นหาไม่พบ': 'D2', 'กดตัวกรอง — แผงตัวกรอง': 'D3', 'กรองแล้ว — ใกล้ครบกำหนดบำรุงรักษา': 'D4', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด': 'A4', 'รายละเอียดยานพาหนะ — แท็บตารางบำรุงรักษา': 'D5', 'ประวัติ กดปุ่ม … — ดูรายละเอียดงานที่ปิดแล้ว': 'A5',
    // 12 พ.ย. 2569 (R107) หน้ารายละเอียดยานพาหนะ = D5 · เพิ่ม/แก้ไขเครื่องมือกลของ กบค. = A7
    'กดเลขทะเบียน — เปิดหน้ารายละเอียดยานพาหนะ แท็บข้อมูลยานพาหนะ': 'A4 D5', 'รายละเอียดยานพาหนะ — แท็บตารางบำรุงรักษา กำหนดครั้งถัดไป 5 รายการ': 'D5',
    'รายละเอียดยานพาหนะ — แท็บประวัติการซ่อมบำรุง ซ่อมและบำรุงรักษาเรียงวันที่ปิดงาน ป้าย Overhaul': 'D5', 'แท็บข้อมูลยานพาหนะ — มีงานในประกัน ส่วนการรับประกันท้ายแท็บ': 'D5',
    'แท็บข้อมูลยานพาหนะ — รหัสข้างนอกกลุ่ม 04 07 08 09 10 ไม่มีส่วนเครื่องมือกล ไม่มีงานในประกัน': 'D5', 'กบค. — การ์ดเครื่องมือกล ช่องที่ยังไม่มีข้อมูลมีปุ่มเพิ่ม ช่องที่มีข้อมูลแก้ไขได้': 'Q2 A7',
    'กบค. — ยานพาหนะในกลุ่มที่ยังไม่มีเครื่องมือกล การ์ดว่าง ปุ่มเพิ่มเครื่องมือกล': 'A7', 'แท็บประวัติการบำรุงรักษาเครื่องจักร — บันทึกบำรุงรักษาตามวาระ': 'D5',
    'แท็บประวัติการบำรุงรักษาเครื่องยนต์ — เช็คระยะที่ศูนย์บริการ': 'D5', 'แท็บข้อมูลยานพาหนะบนมือถือ — เรียง 1 คอลัมน์ลำดับเดียวกับ desktop กบค. แก้ไขเครื่องมือกลได้': 'D5',
    // 12 พ.ย. 2569 popup เพิ่ม/แก้ไขเครื่องมือกล = D8 · บันทึกสำเร็จกลับหน้ารายละเอียด D5
    'popup เพิ่มเครื่องมือกล — กบค. กดเพิ่มจากการ์ดว่าง ช่องว่าง รหัสทรัพย์สินย่อยตั้งต้น 0001': 'A7 D8', 'popup แก้ไขเครื่องมือกล — ค่าเดิมของเครื่องเป็นค่าตั้งต้น ช่องที่ไม่มีข้อมูลว่าง': 'A7 D8',
    'กดบันทึกโดยยังไม่กรอก — ช่องบังคับขึ้นข้อความ error': 'D8', 'บันทึกเครื่องมือกลสำเร็จ — ปิด popup การ์ดแสดงค่าที่บันทึก': 'D5' },
  S12: { 'Step 2 สรุปงานก่อนปิดงาน — เลือกเก็บตัวอย่าง ใส่ผลการทดสอบได้ (ถ้ามี)': 'A1', 'ปิดงานโดยยังไม่มีผล — ป้ายรอผลตรวจน้ำมัน': 'D1', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด': 'A3', 'หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง': 'D2', 'กดบันทึกโดยยังไม่เลือกผล': 'Q2', 'เลือกผล + แนบไฟล์ (ถ้ามี)': 'A4', 'บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง': 'D3', 'กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน': 'D4' },
  S18: { 'ต้นทุนการบำรุงรักษา + Summary': 'D2 D3', 'ดาวน์โหลด Excel แล้ว': 'A3' },
  S19: { 'เมนู "…" → แก้ไข': 'A1', 'รายละเอียดแผน — ส่งกลับแก้ไข': 'A1', 'ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้': 'D3', 'เอาภาคหรือตัวกรองออก — ยานพาหนะที่จัดไว้แล้วยังอยู่': 'D4', '“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น': 'D5', 'ยืนยันการแก้ไขแผน': 'D6', 'บันทึกไม่สำเร็จ': 'D7', 'บันทึกสำเร็จ — รออนุมัติ': 'D8', 'แผนอนุมัติแล้ว — เมนู "…" → แก้ไข': 'A1', 'แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่': 'D3', 'แผนดำเนินการแล้ว — เมนู "…" ดูรายละเอียดอย่างเดียว': 'D2' },
  S21: { 'แท็บไตรมาส 1 — ทุกคันยังไม่กำหนด อะไหล่ในไตรมาสว่าง': 'D1', 'เมนู … → แก้ไข — หน้าจัดการอะไหล่ของยานพาหนะ (ยังไม่กำหนด)': 'A1 D2', 'เลือกยานพาหนะคันอื่น — รายการยานพาหนะในไตรมาสเปิด': 'A2', 'เลือกเปลี่ยนน้ำมัน — ระบุเบอร์น้ำมัน รหัส จำนวนลิตร': 'A6 A9', 'เลือกไส้กรองจากคลัง — เข้าอะไหล่อื่นๆ ของยานพาหนะคันนี้': 'A3', 'ระบุอะไหล่เพิ่มเติม — popup ชื่อ ยี่ห้อ รุ่น รหัส จำนวน หน่วย': 'A7 A8', 'ระบุอะไหล่เพิ่มเติมแล้ว — อยู่ในรายการ': 'A4', 'บันทึกไม่สำเร็จ': 'A5', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 ยานพาหนะ 1 คันกำหนดแล้ว อะไหล่ในไตรมาสมีของคันนี้': 'D4' },
  S20: { 'เมนู "…" → ลบ ในหน้า List': 'A1', 'ยืนยันการลบแผน ในหน้า List': 'D3', 'ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)': 'D4', 'ปุ่ม “ลบแผน” ในหน้า Detail': 'A2', 'ยืนยันการลบแผน ในหน้า Detail': 'D3', 'แผนอนุมัติแล้ว — หน้ารายละเอียดไม่มีปุ่มลบ': 'D2' },
  S2: { 'รายการแผนรออนุมัติ': 'D1', 'รายละเอียดแผน — ผลการพิจารณา ยังไม่เลือก': 'D2 A2', 'อนุมัติ — ยืนยันอนุมัติแผน': 'A5', 'อนุมัติแผนสำเร็จ': 'D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus': 'D5', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A4', 'ส่งกลับแล้ว': 'D3' },
  // S3 พักไว้ 30 ต.ค. 2569
  S7: { 'รายการแผนเดินทางรออนุมัติ': 'D1', 'รายละเอียดแผนเดินทาง — ผลการพิจารณา ยังไม่เลือก': 'D2 A2', 'อนุมัติ — ยืนยันอนุมัติแผนเดินทาง': 'A5', 'อนุมัติแผนเดินทางสำเร็จ': 'D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus': 'D5', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A4', 'ส่งกลับแล้ว': 'D3' },
  S9: { 'เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น': 'D2', 'เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด': 'A3', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้': 'D5', 'แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันทำงาน': 'A5', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'Q1', 'กรอกครบ': 'A6', 'ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)': 'D3' },
  S8: { 'กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)': 'D1', 'กรย. — เปิดแผงแจ้งเตือน': 'A1', 'กรย. — แผนเดินทาง ดูอย่างเดียว (ยานพาหนะทุกคันในใบ)': 'D2', 'หน่วยงานเจ้าของยานพาหนะ — เปิดแผงแจ้งเตือน': 'A2', 'หน่วยงานเจ้าของยานพาหนะ — แผนเดินทาง ดูอย่างเดียว (เฉพาะยานพาหนะของหน่วยงาน)': 'D3' },
  S13: { 'รายการผลการบำรุงรักษารอรับทราบ — มีแจ้งเตือนใหม่': 'D1', 'ผลการบำรุงรักษารายคัน — ปุ่มรับทราบกดได้': 'D2', 'คันที่บำรุงรักษาไม่ได้ — ฟอร์มเดียวกัน แสดงสาเหตุ รับทราบได้เลย': 'D3', 'กลับหน้ารายการ — คันที่รับทราบแล้วสถานะรับทราบแล้ว': 'D6', 'รับทราบแล้ว — ป้ายรับทราบแล้ว ปุ่มประเมินความพึงพอใจ': 'A3 D5', 'เปิดแผงแจ้งเตือน — ปิดงานแล้ว รอรับทราบ': 'A0 D0', 'บทบาทอื่นเปิดดูผล — ไม่มีปุ่มรับทราบ': 'D7' },
  S25: { 'หน้าไตรมาส 1 — ยานพาหนะที่บำรุงรักษาไม่ได้ ป้ายบำรุงรักษาไม่ได้': 'D0', 'กดปุ่ม … ของยานพาหนะ — ย้ายไปไตรมาสอื่น': 'A1', 'popup ย้ายไปไตรมาสอื่น — ยังไม่เลือกไตรมาส': 'A2 D2', 'เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้': 'A3', 'กรณีไตรมาส 3 — ไตรมาสก่อนหน้าและไตรมาสปัจจุบันเลือกไม่ได้': 'D2', 'ยืนยันการย้ายยานพาหนะ': 'D3', 'ย้ายสำเร็จ — ไตรมาส 1 ไม่มียานพาหนะคันนี้แล้ว': 'D4', 'หน้าไตรมาส 2 — ยานพาหนะที่ย้ายมา ยังไม่มีแผนเดินทาง': 'A4 D5', 'หน้าไตรมาส 2 — อะไหล่ในไตรมาสรวมอะไหล่ของยานพาหนะที่ย้ายมา': 'D6', 'ไตรมาส 4 — เมนูย้ายไปไตรมาสอื่นกดไม่ได้': 'D1' },   // 5 พ.ย. 2569 บล็อก X
};

/* ---------- กลุ่ม = scenario (แพทเทิร์นเดียวกับ Overhaul — เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก · แถว Desktop แล้ว Mobile) ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/* ตัวอักษรบล็อกผูกกับตำแหน่งใน BLOCK_OF ตายตัว (2 พ.ย. 2569) — ตัด/รวม scenario แล้วบล็อกอื่นไม่เลื่อน ชื่อเฟรมที่ export ไปแล้วยังตรง · S5 รวมเข้า S4 ⇒ D เว้นว่าง
   4 พ.ย. 2569 ตัด S11 (J) และ S23 (V) ⇒ คงช่องไว้เป็นป้ายกันที่ ('S11 ตัดออก' · 'S23 ตัดออก' ไม่ตรงกับ scenario ไหน) ถ้าเอาออกจาก array ตัวอักษร K–U และ W จะเลื่อน ชื่อเฟรม Figma ที่ export แล้วจะไม่ตรง
   10 พ.ย. 2569 เอา S23 กลับ (R87) ⇒ ช่อง V กลับเป็น 'S23' ตัวอักษรอื่นไม่เลื่อน · J ยังว่าง (S11 ยังตัด) */
const BLOCK_OF = ['S1', 'S2', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11 ตัดออก', 'S12', 'S13', 'S14 ตัดออก', 'S15 ตัดออก', 'S16 ตัดออก', 'S17 ตัดออก', 'S18', 'S19', 'S20', 'S21', 'S22 ตัดออก', 'S23', 'S24', 'S25', 'S27 ย้ายไปเรื่องแยก'];   // Y ว่าง: S27 ประเมินความพึงพอใจ (11 พ.ย. 2569) ย้ายไป satisfaction-plugin 12 พ.ย. 2569   // S24 ข้อมูลการบำรุงรักษา (4 พ.ย. 2569) = W · J ว่าง · V = S23 (เอากลับ 10 พ.ย. 2569)
/* เรื่องย่อยในบล็อก (เจ้าของงาน 12 พ.ย. 2569 "S1 อยากเรียง scenario แบบไม่มี if คือไม่เจอหน้า error เช่น ถ้าเป็นการสร้าง ก็ สร้างสำเร็จ กด a b c d
   ถ้า scen ต่อไป เป็นเรื่อง แก้ไข ก็เลือกแก้ไขแล้ว ไปเจอหน้าแก้ไข") ⇒ 1 เรื่องย่อย = 1 เส้นตรงตามลำดับการกด ไม่มีทางแยก · แถบ Sub Flow A1 A2 … ป้ายจอ A1.1 A1.2 …
   ตัวเลข = ลำดับจอในรายการ S1 ของ SCENARIOS (A.1–A.42 เดิม) · จอเดียวกันอยู่ได้หลายเรื่อง (เช่น รายการแผนเป็นจุดเริ่มหลายเรื่อง)
   หน้า error ช่องไม่ครบ ปุ่มกดไม่ได้ และรายการว่าง รวมไว้เรื่องสุดท้าย ไม่ปนกับเส้นหลัก · จอที่ไม่ได้อยู่ในเรื่องไหนจะต่อท้ายเรื่องสุดท้ายเอง (กันจอหาย) */
const SUBS_OF = { S1: S1_SUBS };   // [ชื่อเรื่องย่อย, [[ชื่อจอ, fn] …] หรือ [เลขลำดับในรายการของ scenario …]]
const GROUPS = SCENARIOS.map(([title, screens], i) => {
  const tag0 = title.split(' · ')[0], code = BLOCK_OF.indexOf(tag0) >= 0 ? LETTERS[BLOCK_OF.indexOf(tag0)] : LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  const map = FLOW_NODES[tag] || {};
  const row = ([label, fn]) => [label, fn, map[label] || ''];
  const parts = SUBS_OF[tag];
  if (!parts) return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens: screens.map(row) }] };
  const pick = (x) => Array.isArray(x) ? x : screens[x - 1];   // รายการจอ หรือเลขลำดับ
  const used = new Set(parts.flatMap(p => p[1]).filter(x => !Array.isArray(x))), left = parts.some(p => p[1].some(x => !Array.isArray(x))) ? screens.map((_, k) => k + 1).filter(k => !used.has(k)) : [];
  const subs = parts.map(([t, items], k) => ({ code: code + (k + 1), title: t, tag, screens: items.concat(k === parts.length - 1 ? left : []).map(pick).filter(Boolean).map(row) }));
  return { code, title: tag + ' ' + rest, subs };
});
/* จำนวนจอที่สร้างจริงของ scenario (เรื่องย่อยใช้จอซ้ำได้) — ใช้นับความคืบหน้าและตารางสรุป */
const SCREEN_COUNT = (title) => { const g = GROUPS.find(x => x.subs[0].tag === title.split(' · ')[0]); return g ? g.subs.reduce((a, s) => a + s.screens.length, 0) : 0; };

/* ---------- สร้าง (ปุ่มชุดเดียวกับ Overhaul 21 ต.ค. 2569: ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component) ----------
   เจ้าของงานสั่ง 22 ต.ค. 2569 "จะเอาลงในเพจ Maintainance ด้วยกันเลย" ⇒ ทุกปุ่มวางบนหน้า "Maintainance" (ไม่มีก็สร้าง) ต่อใต้ของเดิม · ใต้ของเดิมเกินขอบพื้นที่วางงานแล้ววางเหนือของเดิม (roomyPage) ไม่ลบ/ไม่ย้ายของที่มีอยู่
   แต่ละบล็อก scenario = ผัง userflow ซ้ายสุด + ป้าย Device + คอลัมน์จอ A.1 A.2 … (แถว Desktop แล้ว Mobile ตามที่เลือก) */
const PAGE_NAMES = ['Maintainance', 'Maintenance'];
const BLOCK_H = 7000;   // ความสูงที่เผื่อต่อ 1 บล็อก scenario ตอนเช็คว่าหน้าเหลือที่พอไหม
/* ย้ายบล็อกล่าสุดที่ล้นขอบ (หรือที่ค้างบนหน้า -2 จากปุ่มรุ่นก่อน) มาไว้เหนือของเดิมบนหน้า Maintainance ไม่ต้องสร้างใหม่ · ของเดิมที่เหลือไม่แตะ แค่รายงานจำนวน */
/* ลบจอของบล็อกที่ตัดออก (เจ้าของงาน 10 พ.ย. 2569 "ลบจอบล็อก M N เก่าออกให้ด้วย") — บล็อกว่างอ่านจาก BLOCK_OF ("… ตัดออก": J S11 · M S14 · N S15 · U S22)
   ทุกหน้า Maintainance / Maintenance (รวม -2 -3) · ลบเฉพาะชิ้นชั้นบนสุดที่ปลั๊กอินสร้าง: จอ "MT / M.1 · …" · ป้าย "MT · M …" "MT · M.1 …" · flowchart "MT · M flowchart S14"
   journey "MT · journey flowchart S14" · จอชุดเก่าที่ชื่อมี " · S14 — " · ชิ้นอื่นไม่แตะ · Ctrl/Cmd+Z ย้อนได้ */
const CUT_BLOCKS = () => BLOCK_OF.map((t, i) => /ตัดออก/.test(t) ? [LETTERS[i], t.split(' ')[0]] : null).filter(Boolean);
const cutHit = (n, P0) => CUT_BLOCKS().some(([L, tag]) => n.indexOf(P0 + ' / ' + L + '.') === 0 || n.indexOf(P0 + ' · ' + L + ' ') === 0 || n.indexOf(P0 + ' · ' + L + '.') === 0
  || (n.indexOf(P0 + ' / ') === 0 && n.indexOf(' · ' + tag + ' — ') > 0) || n === P0 + ' · journey flowchart ' + tag);
async function purgeCut() {
  const P0 = PLUGIN.prefix;
  await figma.loadAllPagesAsync();
  const norm = (p) => p.name.trim().toLowerCase().replace(/^[^a-z0-9ก-๙]+/, '').replace(/[^a-z0-9ก-๙]+$/, '');
  const pages = figma.root.children.filter(p => /^(maintainance|maintenance)(-\d+)?$/.test(norm(p)));
  log('ลบจอของบล็อกที่ตัดออก: ' + CUT_BLOCKS().map(([L, t]) => L + ' (' + t + ')').join(' · ') + ' · หน้า ' + (pages.map(p => p.name.trim()).join(', ') || 'ไม่พบหน้า Maintainance'));
  let total = 0;
  for (const pg of pages) {
    const dead = pg.children.filter(n => cutHit(n.name, P0));
    const by = {}; dead.forEach(n => { const k = (n.name.match(/^\S+ [\/·] ([A-Z])/) || [])[1] || (n.name.match(/ (S\d+)( —|$)/) || [])[1] || '?'; by[k] = (by[k] || 0) + 1; });
    dead.forEach(n => n.remove()); total += dead.length;
    if (dead.length) log('  · หน้า ' + pg.name.trim() + ' ลบ ' + dead.length + ' ชิ้น (' + Object.keys(by).map(k => k + ' ' + by[k]).join(' · ') + ')');
  }
  log(total ? '✓ ลบแล้ว ' + total + ' ชิ้น · ย้อนได้ด้วย Ctrl/Cmd+Z' : '✓ ไม่มีจอของบล็อกที่ตัดออกเหลืออยู่');
}
/* ย้ายจอของบล็อกที่ตัดออกไปรวมในกรอบ "ตัดออกแล้ว" (เจ้าของงาน 10 พ.ย. 2569 "ตัดออกจากตรงที่ export หรือแยกไว้อีก section ให้ด้วย ว่า scen นี้ ตัดออกแล้ว")
   ไม่ลบ · กรอบ (frame ไม่ใช่ section ตาม R19) ขวาสุดของหน้า · หัว Header Type=Header "Scenario ที่ตัดออกแล้ว" · บล็อกละแถบ Subheader State=Failed (แดง) บอก scenario วันที่ และเหตุผลจาก SCEN_CUT
   ชิ้นที่ย้ายเปลี่ยนชื่อขึ้นต้น "ตัดออก · " ⇒ ส่งภาพ/journey/ปุ่มอื่นที่หาชื่อ "MT / " ไม่หยิบไป · กดซ้ำได้ ต่อท้ายกรอบเดิม */
async function archiveCut() {
  const P0 = PLUGIN.prefix;
  await figma.loadAllPagesAsync();
  try { await resolveAll(['Header']); } catch (e) { /* ไม่มี Header ใช้แถบธรรมดา */ }
  const norm = (p) => p.name.trim().toLowerCase().replace(/^[^a-z0-9ก-๙]+/, '').replace(/[^a-z0-9ก-๙]+$/, '');
  const pages = figma.root.children.filter(p => /^(maintainance|maintenance)(-\d+)?$/.test(norm(p)));
  const why = {}; SCEN_CUT.forEach(c => { why[c[0]] = c; });
  let total = 0;
  for (const pg of pages) {
    const groups = CUT_BLOCKS().map(([L, tag]) => [L, tag, pg.children.filter(n => n.name.indexOf('ตัดออก · ') !== 0 && n.name !== 'ตัดออกแล้ว' && cutHit(n.name, P0) &&
      (n.name.indexOf(P0 + ' / ' + L + '.') === 0 || n.name.indexOf(P0 + ' · ' + L + ' ') === 0 || n.name.indexOf(P0 + ' · ' + L + '.') === 0 || n.name.indexOf(' · ' + tag + ' — ') > 0 || n.name === P0 + ' · journey flowchart ' + tag))]).filter(g => g[2].length);
    if (!groups.length) continue;
    let box = pg.children.find(n => n.type === 'FRAME' && n.name === 'ตัดออกแล้ว');
    if (!box) {
      const right = pg.children.reduce((x, n) => Math.max(x, n.x + n.width), 0), top = pg.children.reduce((y, n) => Math.min(y, n.y), 0);
      box = figma.createFrame(); box.name = 'ตัดออกแล้ว'; box.fills = []; box.clipsContent = false; pg.appendChild(box); box.x = right + 4000; box.y = top;
      CREATED = []; const hd = await blockHeader(P0, 'Page', 'Scenario ที่ตัดออกแล้ว — ไม่ใช้ export · เก็บไว้ดูประวัติ', 3000); hd.name = 'ตัดออกแล้ว · หัว'; box.appendChild(hd); hd.x = 0; hd.y = 0;
    }
    let y = box.children.reduce((m, n) => Math.max(m, n.y + n.height), 0) + 400;
    for (const [L, tag, nodes] of groups) {
      const minX = Math.min(...nodes.map(n => n.x)), minY = Math.min(...nodes.map(n => n.y)), maxX = Math.max(...nodes.map(n => n.x + n.width)), maxY = Math.max(...nodes.map(n => n.y + n.height));
      const c = why[tag] || [tag, '', 'ตัดออก'];
      CREATED = []; const bar = await flowBar(P0, 'ตัดออก ' + tag, c[1] + ' — ' + c[2], 'Failed', Math.max(1440, maxX - minX)); bar.name = 'ตัดออก · ' + tag + ' (บล็อก ' + L + ')';
      box.appendChild(bar); bar.x = 0; bar.y = y; y += bar.height + 80;
      for (const n of nodes) { const dx = n.x - minX, dy = n.y - minY; box.appendChild(n); n.x = dx; n.y = y + dy; n.name = 'ตัดออก · ' + n.name; }
      y += (maxY - minY) + 400;
      log('  · ' + tag + ' (บล็อก ' + L + ') ย้าย ' + nodes.length + ' ชิ้นเข้ากรอบ "ตัดออกแล้ว" บนหน้า ' + pg.name.trim());
      total += nodes.length;
    }
    try { const w = box.children.reduce((m, n) => Math.max(m, n.x + n.width), 0); box.resizeWithoutConstraints(Math.max(3000, w), y); } catch (e) { warn('ขนาดกรอบตัดออกแล้ว', e); }
  }
  CREATED = [];
  log(total ? '✓ ย้ายจอของ scenario ที่ตัดออกแล้ว ' + total + ' ชิ้น ไปกรอบ "ตัดออกแล้ว" ขวาสุดของหน้า · ย้อนได้ด้วย Ctrl/Cmd+Z' : '✓ ไม่มีจอของบล็อกที่ตัดออกเหลืออยู่นอกกรอบ "ตัดออกแล้ว"');
}
async function moveLatest() {
  const main = (await namedPage(PAGE_NAMES)).page, tag = PLUGIN.prefix + ' · ', scr = PLUGIN.prefix + ' / ';
  await figma.setCurrentPageAsync(main);
  const isBar = (n) => n.name.indexOf(tag) === 0 && /^[A-Z] /.test(n.name.slice(tag.length)) && n.name.indexOf(' userflow S') < 0 && n.name.indexOf(' flowchart S') < 0;
  const spare = figma.root.children.filter(p => new RegExp('^' + PAGE_NAMES[0] + '-\\d+$', 'i').test(p.name.trim()));
  let src = main, nodes = [];
  for (const p of spare) { if (p.loadAsync) await p.loadAsync(); if (p.children.some(isBar)) { src = p; nodes = p.children.slice(); break; } }
  if (!nodes.length) { const last = main.children.filter(isBar).reduce((m, n) => Math.max(m, n.y), 0); if (last > CANVAS_MAX) nodes = main.children.filter(n => n.y >= last); }
  if (!nodes.length) { log('บล็อกล่าสุดบนหน้า "' + main.name.trim() + '" อยู่ในขอบพื้นที่วางงานอยู่แล้ว ไม่ต้องย้าย'); return; }
  const spot = fitOn(main, nodes);   // แบบเดียวกับตอนสร้าง: ใต้ของเดิม → ช่องว่างจากขอบบน → คอลัมน์ใหม่ทางขวา (4 พ.ย. 2569)
  if (!spot) { log('⚠ หน้านี้ไม่มีที่ว่างในขอบพื้นที่วางงานแล้ว — ย้ายไม่สำเร็จ ไม่มีอะไรเปลี่ยน'); return; }
  if (src !== main) for (const n of nodes.slice().reverse()) main.insertChild(0, n);   // ลำดับต้นของหน้าแบบตอนสร้าง (buildGrid insertChild 0) ⇒ exportShots นับเป็นชุดล่าสุด · เดิม appendChild ไปอยู่ลำดับท้าย (9 พ.ย. 2569)
  shiftAll(nodes, spot);
  if (src !== main && !src.children.length) { log('ลบหน้าว่าง "' + src.name + '" แล้ว'); src.remove(); }
  const screens = nodes.filter(n => n.name.indexOf(scr) === 0);
  figma.currentPage.selection = screens.slice(0, 1);
  figma.viewport.scrollAndZoomIntoView(screens.slice(0, 6));
  log('✓ ย้ายบล็อกล่าสุด ' + screens.length + ' จอ (' + nodes.length + ' ชิ้น) มาไว้ในขอบพื้นที่วางงานบนหน้า "' + main.name.trim() + '" แล้ว (' + (spot.side ? 'คอลัมน์ใหม่ทางขวา x=' + Math.round(spot.x) + ', ' : '') + 'y=' + Math.round(spot.y) + ')');
  const left = main.children.filter(n => n.y > CANVAS_MAX && n.name.indexOf(scr) === 0).length;
  if (left) log('บนหน้านี้ยังมีจอชุดเก่าเกินขอบอีก ' + left + ' จอ ไม่ได้แตะ');
}
async function buildSet(SCEN, GRP, what, devices) {
  errors.length = 0;
  const t0 = Date.now();
  log('นำเข้า component จากไลบรารี + ยืมจาก flow งานซ่อมในไฟล์นี้…');
  await resolveAll();
  const borrowed = LOCAL_OPTIONAL.filter(n => has(n) && ['Device Type', 'Component 1', 'Header'].indexOf(n) < 0);
  log('component จาก flow งานซ่อมที่ใช้ได้: ' + (borrowed.length ? borrowed.join(' · ') : 'ไม่มี — ใช้แบบสำรองจากไลบรารีทุกจุด'));
  log(deviceSetInfo());
  if (ACTIVITY) log('ผังข้างจอ: flowchart กิจกรรม จาก ' + ACTIVITY.src + ' (แทนผัง userflow ตามที่เจ้าของงานสั่ง 6 พ.ย. 2569)');
  else log(USERFLOW ? 'ผัง userflow: ' + USERFLOW.src + ' (' + Object.keys(USERFLOW.scenarios).length + ' scenario ในไฟล์ · วางข้างจอเฉพาะ scenario ที่มีจอ)' : '⚠ ไม่มีผัง userflow ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่');
  log('นำเข้าเสร็จใน ' + Math.round((Date.now() - t0) / 1000) + ' วินาที · เริ่มสร้าง');
  /* 4 พ.ย. 2569 เจ้าของงาน "อยากให้ export ไปที่ Maintainance แทน" ⇒ สร้างบนหน้า Maintainance เสมอ (ใต้ของทั้งหมดก่อน) แล้ววัดขนาดจริงค่อยย้ายลงช่อง (fitOn)
     ไม่ใช้ roomyPage(BLOCK_H × จำนวนบล็อก) แบบเดิม เพราะทั้งชุดประเมินได้ 140,000 เกินขอบเสมอจึงไปหน้า -2 ทุกครั้ง · หน้า -2 เหลือไว้เฉพาะตอนหน้าเดิมไม่มีที่จริงๆ */
  const tp = await namedPage(PAGE_NAMES);
  let page = tp.page;
  if (page.loadAsync) await page.loadAsync();
  await figma.setCurrentPageAsync(page);
  const before = new Set(page.children);
  const TOTAL = SCEN.reduce((a, x) => a + SCREEN_COUNT(x[0]), 0);
  log(INDEX.has('Header') ? 'แถบหัวบล็อก/ป้าย state: component Header ของ Design Annotations (' + ROUTE.Header + ')' : 'แถบหัวบล็อก/ป้าย state: ไม่พบ component Header — วาดแถบธรรมดาสีเดียวกันแทน · เปิดไฟล์ (UI) VMS Plus – Release#2 เป็นไลบรารี หรือวาง Header จากหน้า Design Annotations ไว้ในไฟล์ 1 ชิ้น');
  /* ไม่มีหัวหน้า Type=Header บนสุด — เจ้าของงาน 10 พ.ย. 2569 "ป้ายบนสุดไม่ต้องมี ที่เป็นป้าย บำรุงรักษา ที่ status inprogress เอาออก" (buildGrid ยังรับ opts.page ไว้) */
  const { made, flows } = await buildGrid(page, PLUGIN.prefix, GRP, before.size ? pageBottom(page) + 400 : 0, TOTAL * devices.length, { devices });
  const fresh = page.children.filter(n => !before.has(n));
  const fit = fresh.length ? fitOn(page, fresh) : { dx: 0, dy: 0, y: 0 };
  const hgt = fresh.length ? Math.round(Math.max(...fresh.map(n => n.y + n.height)) - Math.min(...fresh.map(n => n.y))) : 0;
  if (fit) {
    shiftAll(fresh, fit);
    log(tp.fallback ? '⚠ หาหน้า "Maintainance" ไม่เจอและสร้างหน้าใหม่ไม่ได้ (แพลนจำกัดจำนวนหน้า) — วางในหน้า "' + page.name + '" ไม่ลบอะไร'
      : tp.fresh ? 'ไม่พบหน้า "Maintainance" — สร้างหน้าใหม่ชื่อนี้แล้ววางลงไป'
      : !before.size ? 'วางบนหน้า "' + page.name.trim() + '" (หน้าว่าง)'
      : fit.side ? 'แนวตั้งของหน้า "' + page.name.trim() + '" ไม่พอสำหรับชุดนี้ (สูง ' + hgt + ') — วางเป็นคอลัมน์ใหม่ทางขวาของของเดิม (x=' + Math.round(fit.x) + ', y=' + Math.round(fit.y) + ') ของที่มีอยู่ไม่ถูกแตะ'
      : fit.y < pageTop({ children: [...before] }) ? 'ใต้ของเดิมเกินขอบพื้นที่วางงานของ Figma — วางในช่องว่างด้านบนของหน้า "' + page.name.trim() + '" (y=' + Math.round(fit.y) + ') ของที่มีอยู่ไม่ถูกแตะ'
      : 'วางบนหน้า "' + page.name.trim() + '" ต่อใต้ของเดิม (y=' + Math.round(fit.y) + ') — ของที่มีอยู่บนหน้านี้ไม่ถูกแตะ');
  } else {   // หน้าเดิมเต็มทั้งแนวตั้งและแนวนอน ⇒ ย้ายชุดนี้ไปหน้า <ชื่อ>-2 <ชื่อ>-3 … ที่ยังมีที่
    const re = new RegExp('^' + PAGE_NAMES[0] + '-(\\d+)$', 'i'), spare = figma.root.children.filter(p => re.test(p.name.trim()));
    let dest = null;
    for (const p of spare) { if (p.loadAsync) await p.loadAsync(); if (spotOn(p, hgt, 400)) { dest = p; break; } }
    if (!dest) { try { dest = figma.createPage(); dest.name = PAGE_NAMES[0] + '-' + (spare.reduce((m, p) => Math.max(m, +p.name.trim().match(re)[1]), 1) + 1); } catch (e) { dest = null; } }
    if (dest) {
      for (const n of fresh) dest.appendChild(n);
      shiftAll(fresh, fitOn(dest, fresh) || { dx: 0, dy: 0 });
      page = dest; await figma.setCurrentPageAsync(page);
      log('หน้า "' + tp.page.name.trim() + '" ไม่มีที่ว่างในขอบพื้นที่วางงานของ Figma แล้ว — ใช้หน้า "' + page.name + '" แทน');
    } else log('⚠ หน้าเดิมเกินขอบพื้นที่วางงานของ Figma และสร้างหน้าใหม่ไม่ได้ — จอชุดนี้อาจเลื่อนไปดูไม่ถึง');
  }
  let instances = 0, loose = 0, drawn = 0;
  /* R106 (12 พ.ย. 2569): ชิ้นวาดเองยอมเฉพาะในกรอบ VMS+ … ของแดชบอร์ด S4 (C) S24 (W) — ที่อื่นยังต้องเป็น 0 และนับเป็นคำเตือน */
  const inDash = (n, s) => { if (!DASH_SCR.test(s.name)) return false; for (let p = n.parent; p && p !== s; p = p.parent) if (p.type === 'FRAME' && DASH_IN.test(p.name)) return true; return false; };
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') { if (inDash(n, s)) drawn++; else { loose++; if (loose <= 5) warn('R106 ' + s.name, 'ชิ้นวาดเอง ' + n.type + ' "' + n.name + '" นอกกรอบแดชบอร์ด VMS+ — จอนี้ต้องเป็น instance ของไลบรารีเท่านั้น'); } }
  }
  figma.currentPage.selection = made.slice(0, 1);   // ของใหม่อยู่ล่างสุดของ Layers ⇒ เลือกจอแรกให้ Layers เลื่อนไปหา
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 6));
  log('');
  if (pageBottom(page) > CANVAS_MAX) log('หมายเหตุ: ชุดนี้ยาวเกินขอบพื้นที่วางงานของ Figma จอท้ายๆ อาจเลื่อนไปไม่ถึง — ใช้สร้างทีละ scenario แทน');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ผัง userflow ' + flows + ' ผัง · ' + GRP.length + ' บล็อก ' + what + ' (' + GRP.map(g => g.code).join(' ') + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓') + ' (ผัง userflow เป็นของวาดประกอบนอกจอ ไม่นับ · ชิ้นวาดในกรอบ VMS+ ของแดชบอร์ด S4 S24 ตามข้อยกเว้น R106 ' + drawn + ' ชิ้น)');
  log('component ที่ใช้ (' + USED.size + '): ' + [...USED].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่ต้องสลับเป็นฟอนต์สำรอง (component ใช้ฟอนต์ที่เครื่องไม่มี) ' + FONT_SWAPPED + ' จุด — ฟอนต์ ' + (FALLBACK_FONT ? FALLBACK_FONT.family + ' ' + FALLBACK_FONT.style : '-'));
  reportOversize();
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
async function build(o) { await buildSet(SCENARIOS, GROUPS, 'scenario', devOf(o)); }
async function buildDesktop() { await buildSet(SCENARIOS, GROUPS, 'scenario · desktop', [false]); }   // ปุ่มนี้ระบุอุปกรณ์เอง ไม่ใช้ตัวเลือกบนหน้าต่าง
async function buildMobile() { await buildSet(SCENARIOS, GROUPS, 'scenario · mobile', [true]); }
async function buildPick(o) {   // ติ๊กเฉพาะบาง scenario · รหัสตัวอักษรคงเดิม (A–I)
  const idx = (o.pick || []).map(Number).filter(i => i >= 0 && i < SCENARIOS.length);
  if (!idx.length) { log('ยังไม่ได้ติ๊ก scenario — ติ๊กอย่างน้อย 1 รายการแล้วกดอีกครั้ง'); return; }
  await buildSet(SCENARIOS.filter((_, i) => idx.indexOf(i) >= 0), GROUPS.filter((_, i) => idx.indexOf(i) >= 0), 'scenario ที่เลือก', devOf(o));
}

/* ---------- แทนที่จอที่เลือกด้วยฉบับล่าสุด (เจ้าของงาน 13 พ.ย. 2569 "เพิ่มปุ่มแทนที่จอที่เลือกในปลั๊กอินบำรุงรักษา") ----------
   แบบปุ่ม "อัปเดตจอที่เลือกเป็นฉบับ CF" ของปลั๊กอิน Overhaul: เลือกเฟรมจอ "MT / … · Sx — ชื่อจอ" บนหน้า แล้วกด → สร้างจอนั้นจากสคริปต์ปัจจุบันวางที่ตำแหน่งและลำดับ layer เดิม
   · จับคู่ด้วย scenario + ชื่อจอ (รหัสเปลี่ยนได้เมื่อแตกเรื่องย่อยใหม่) · ชื่อซ้ำหลายเรื่องย่อย = ใช้ตัวที่รหัสตรงก่อน · ชื่อจอไม่มีในชุดปัจจุบัน = ข้าม ไม่แตะ บอกใน log
   · ชื่อเฟรมใหม่ใช้รหัสปัจจุบัน · ป้าย state เหนือจอไม่เปลี่ยน · จอที่ไม่ได้เลือกไม่แตะ · ส่วนที่แก้มือในจอที่เลือกหาย (กู้ได้ด้วย Cmd+Z หรือ Version history) */
const FRAME_RE = /^MT \/ ([A-Z]\d*\.[0-9.]+) · (S\d+)(?: [^—]+?)? — (.+?)( · mobile)?$/;
function findState(tag, label, code) {   // → { code, label, fn } หรือ null
  const g = GROUPS.find(x => x.subs[0].tag === tag); if (!g) return null;
  const hits = [];
  g.subs.forEach(sub => sub.screens.forEach(([l, fn], i) => { if (l === label) hits.push({ code: sub.code + '.' + (i + 1), label: l, fn }); }));
  return hits.find(h => h.code === code) || hits[0] || null;
}
async function replaceSelected() {
  errors.length = 0; const t0 = Date.now();
  const page = figma.currentPage;
  const sel = (page.selection || []).filter(n => n.type === 'FRAME' && n.parent === page && FRAME_RE.test(n.name));
  if (!sel.length) { log('ยังไม่ได้เลือกเฟรมจอ "MT / …" บนหน้านี้ — คลิกเลือกเฟรมจอที่อยากให้เป็นฉบับล่าสุด (กด Shift เลือกหลายจอได้) แล้วกดอีกครั้ง'); return; }
  log('นำเข้า component จากไลบรารี…'); await resolveAll(); log(deviceSetInfo());
  let done = 0, skipped = 0;
  for (const old of sel) {
    const m = FRAME_RE.exec(old.name), mob = !!m[4] || old.width <= 500, st = findState(m[2], m[3], m[1]);
    if (!st) { skipped++; log('  · ข้าม "' + old.name + '" — ไม่มีจอชื่อนี้ในชุดปัจจุบันของ ' + m[2] + ' (ชื่อจอเปลี่ยนหรือตัดออกแล้ว) ไม่แตะ · ใช้ "สร้างเฉพาะ scenario ที่เลือก" สร้างชุดใหม่แทน'); continue; }
    const at = page.children.indexOf(old), x = old.x, y = old.y;
    MOB = mob; PLACE = { x, y }; CREATED = []; PINS = [];
    try {
      const s = await st.fn(); stripDividers(s); await polish(s); repin(); await bindTones(); await AFTER_SCREEN(s);   // ขั้นเดียวกับ buildGrid
      s.name = PLUGIN.prefix + ' / ' + st.code + ' · ' + m[2] + ' — ' + st.label + (mob ? ' · mobile' : '');
      if (s.setPluginData) s.setPluginData('builtAt', String(Date.now()));
      page.insertChild(Math.min(at, page.children.length), s); s.x = x; s.y = y;
      old.remove(); done++;
      log('  · ' + done + '/' + sel.length + ' แทนที่ ' + s.name + (st.code !== m[1] ? ' (รหัสเดิม ' + m[1] + ')' : ''));
    } catch (e) { warn('แทนที่ ' + old.name, e); const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้าง ' + k + ' ชิ้น'); }
    MOB = false; PLACE = null; CREATED = [];
  }
  figma.currentPage.selection = page.children.filter(n => n.type === 'FRAME' && n.getPluginData && +n.getPluginData('builtAt') >= t0);
  log('');
  log('แทนที่แล้ว ' + done + ' จอ · ข้าม ' + skipped + ' · จอที่ไม่ได้เลือกไม่ถูกแตะ · ป้าย state เหนือจอไม่เปลี่ยน · ย้อนได้ด้วย Cmd+Z หรือ Version history');
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  log('ใช้เวลา ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}

/* ---------- journey แนวขวาง (ปุ่มแยก · เจ้าของงานสั่ง 22 ต.ค. 2569 "ลงในเพจ maintainance แต่มีปุ่มแยกการ generate userflow") ----------
   18 scenario ต่อกันซ้าย → ขวา ตาม build.json "journey" · กล่องหน้าจอในผังติดป้ายรหัสจอ (A.1 …) และใส่ภาพย่อจากจอที่สร้างไว้บนหน้านี้แล้ว (ไม่มีจอ = กล่องเปล่า)
   วางต่อใต้ของเดิมบนหน้า "Maintainance" ไม่ลบ/ไม่ย้ายของที่มีอยู่ */
function journeyCodes(n) {
  const g = GROUPS.find(x => x.subs[0].tag === 'S' + n); if (!g) return null;
  const codes = {}, loose = [];
  for (const sub of g.subs) sub.screens.forEach(([label, , ids], i) => { const c = sub.code + '.' + (i + 1); const list = String(ids || '').split(/\s+/).filter(Boolean); if (!list.length) loose.push(c + ' ' + label); list.forEach(id => { (codes[id] = codes[id] || []).push(c); }); });
  return { codes, loose };
}
async function buildJourneyAll() {
  errors.length = 0;
  const t0 = Date.now();
  if (!USERFLOW || !USERFLOW.journey) { log('✗ ไม่มีข้อมูล journey ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  log('เตรียม component (แถบ Header ของทีมออกแบบ)…');
  await resolveAll();
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H, 600); const page = tp.page, y = tp.y, before = new Set(page.children);
  await figma.setCurrentPageAsync(page);
  const screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0 && !/ · mobile$/.test(n.name));
  log('วางบนหน้า "' + page.name + '" ' + (tp.limit != null ? 'ในช่องว่างด้านบน ต่อลงมาจากชุดก่อน' : 'ต่อใต้ของเดิม') + ' (y=' + Math.round(y) + ') · จอ desktop บนหน้านี้ ' + screens.length + ' จอ (ใช้ทำภาพย่อ)');
  const frameFor = (code) => screens.find(f => f.name.indexOf(PLUGIN.prefix + ' / ' + code + ' · ') === 0) || null;   // ชุดล่าสุด = ลำดับต้นของหน้า (buildGrid วางด้วย insertChild 0 · ล่างสุดของแผง Layers)
  const r = await buildJourney(page, PLUGIN.prefix, y, { codes: journeyCodes, frameFor });
  if (tp.limit != null) liftAbove(page, before, tp.limit);
  log('');
  log((USERFLOW.journey.kind === 'activity' ? 'flowchart ทั้งเส้น: ผัง ' + r.made + ' scenario · ลูกศรเชื่อม ' + r.links + ' เส้น' : 'journey: ผัง ' + r.made + ' scenario · ลูกศรเชื่อม ' + r.links + ' เส้น · ภาพย่อจอ ' + r.thumbs + '/' + r.slots + ' กล่อง' + (r.thumbs < r.slots ? ' (กล่องที่ไม่มีภาพ = ยังไม่มีจอนั้นบนหน้า — กดสร้าง Desktop ก่อนแล้วกดปุ่มนี้ใหม่)' : '')) + ' · กว้าง ' + Math.round(r.w) + ' px');   // 6 พ.ย. 2569 ต่อผัง flowchart กิจกรรม ไม่มีภาพย่อจอ
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· สลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด');
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
  const first = page.children.find(n => n.name.indexOf(PLUGIN.prefix + ' · Journey') === 0); if (first) figma.viewport.scrollAndZoomIntoView([first]);
}

/* ---------- ลบลิงก์กดต่อจอออกจากหน้า (2 พ.ย. 2569 เจ้าของงาน "ที่กดแล้วไปหน้าต่อไป กินทรัพยากรเยอะ เอาออก") ----------
   ลบเฉพาะที่ปลั๊กอินเคยผูก: ON_CLICK ที่ไปจอ "MT / …" หรือ Back · interaction อื่นบน component (เช่น hover ของไลบรารี) และลิงก์ไปที่อื่นคงไว้ · flow starting point ของจอเหล่านี้ลบด้วย */
async function clearPrototype(page) {
  const P = PLUGIN.prefix + ' / ';
  const screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(P) === 0);
  if (!screens.length) { log('ไม่พบเฟรมจอ "' + P + '…" บนหน้า "' + page.name.trim() + '"'); return; }
  const ids = new Set(screens.map(f => f.id));
  const ours = (r) => r.trigger && r.trigger.type === 'ON_CLICK' && (r.actions || []).length > 0 && r.actions.every(a => a && (a.type === 'BACK' || (a.type === 'NODE' && ids.has(a.destinationId))));
  let links = 0, nodes = 0;
  for (const f of screens) for (const n of f.findAll(x => x.type === 'INSTANCE' && x.reactions && x.reactions.length)) {
    const keep = n.reactions.filter(r => !ours(r));
    if (keep.length === n.reactions.length) continue;
    try { const gone = n.reactions.length - keep.length; await n.setReactionsAsync(keep); links += gone; nodes++; } catch (e) { warn('ลบลิงก์ ' + f.name, e); }
  }
  const starts = page.flowStartingPoints || [], left = starts.filter(x => !ids.has(x.nodeId));
  page.flowStartingPoints = left;
  log('✓ ลบลิงก์กดต่อจอแล้ว ' + links + ' ลิงก์ บน ' + nodes + ' ชิ้น · flow starting point ' + (starts.length - left.length) + ' จุด · จาก ' + screens.length + ' จอ');
}

/* ---------- เลือกสร้างทีละส่วนหรือทั้งหมดบนหน้า Maintainance (30 ต.ค. 2569 เจ้าของงานเลือก "ทุกอย่างอยู่ใน Figma") ----------
   parts: desktop (userflow + จอ desktop) · mobile · journey · storymap · usecase — เรียงตามลำดับนี้ ต่อใต้ของเดิมทุกส่วน */
/* ตาราง scenario (เจ้าของงาน 2 พ.ย. 2569 "อยากให้ทำตาราง เขียนใน figma") — ช่วงงาน/ผู้ทำจากตารางภาพรวม (หัวข้อ 0) ของ userflow · บล็อก/จำนวนจอจาก GROUPS
   เรียงตามลำดับงานจริง · ท้ายตารางมีกลุ่ม scenario ที่ตัดออก · สถานะรีวิว = ที่ไล่กับเจ้าของงานแล้วในรอบ 2 พ.ย. */
const SCEN_SEQ = ['S1', 'S2', 'S19', 'S20', 'S21', 'S4', 'S6', 'S9', 'S7', 'S8', 'S10', 'S23', 'S25', 'S12', 'S13', 'S18', 'S24'];   // S27 (ต่อจาก S13 · 11 พ.ย. 2569) ย้ายไปเรื่องแยก 12 พ.ย. 2569 ⇒ อยู่กลุ่มตัดออกท้ายตาราง
const SCEN_REVIEW = { S1: 'ปรับตามรีวิว 5 พ.ย. · เลือกยานพาหนะแบบ A · เพิ่มยานพาหนะจากแท็บไตรมาสว่าง (เจ้าของงาน 5 พ.ย.)', S2: 'ปรับตามรีวิว 5 พ.ย.', S4: 'เปลี่ยนเป็นแดชบอร์ด 6 พ.ย. (รีวิว บล็อก C)', S21: 'ปรับตามเจ้าของงาน 5 พ.ย. · จัดการอะไหล่ทีละคัน', S19: 'ปรับตาม S1 2 พ.ย.',
  S6: 'ปรับตามรีวิว 5 พ.ย.', S7: 'ทำตาม S2 5 พ.ย. · รอรีวิวจอ', S8: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S9: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S10: 'ปรับตามรีวิว 5 พ.ย. · แผนจ้าง Step 2 ไม่มีค่าใช้จ่ายและราคา 10 พ.ย.', S23: 'เอากลับ 10 พ.ย. · UI แบบ S10 การมองเห็นแบบเดิม · รอรีวิวจอ', S12: 'ปรับตามรีวิว 4 พ.ย.', S18: 'ยังไม่ออกแบบ (เจ้าของงาน 4 พ.ย.)', S24: 'ใหม่ 4 พ.ย. · รอรีวิวจอ', S25: 'ใหม่ 5 พ.ย. · รอรีวิวจอ', S13: 'ปรับ 10 พ.ย. ผู้ดูแลยานพาหนะรับทราบรายคัน (Q19 Q23 Q28) · 11 พ.ย. ประเมินย้ายไป S27 รับทราบอย่างเดียว · 12 พ.ย. รับทราบแล้วมีปุ่มประเมินความพึงพอใจ (ตามเว็บ) · รอรีวิว', S27: 'ใหม่ 11 พ.ย. · แบบประเมินความพึงพอใจของ กบค. (XCHO) หน้าแยกแบบประเมินผู้รับจ้าง (R94) · รอรีวิวจอ'
};   // 4 พ.ย. 2569: ทำตามที่เจ้าของงานสั่งแล้ว แต่ยังไม่ได้ไล่จอด้วยกัน
const SCEN_UPDATED = '12 พ.ย. 2569';   // วันที่ข้อมูลในตาราง scenario ล่าสุด — แก้ SCEN_REVIEW แล้วเปลี่ยนวันนี้ด้วย (ขึ้นที่หัวตาราง)
const SCEN_CUT = [['S3', 'ผพจ. ออกเลขงานและจัดซื้ออะไหล่', 'ตัดออก 2 พ.ย.'], ['S5', 'หน่วยงาน เบิกอะไหล่ผ่านระบบจองอะไหล่', 'รวมเข้า S4 2 พ.ย.'],
  ['S11', 'หน่วยงาน ตรวจรับงานรายคันของผู้รับจ้างและรับคืนอะไหล่', 'ตัดออก 4 พ.ย. · หน่วยงานปิดงานแผนจ้างเองที่ S10 · S23 ส่งตรวจงานแล้ว ผู้ตรวจรับยังไม่เคาะ'],
  ['S22', 'คลัง รับทราบรายการอะไหล่รายไตรมาส', 'ตัดออก 6 พ.ย. · ระบบแจ้ง Smart Inventory ตอนอนุมัติแผน (S2)'],
  ['S14', 'หน่วยงาน/เจ้าของยานพาหนะ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)', 'ตัดออก 10 พ.ย. · รับทราบรอบเดียวรายคันที่ S13 · ประเมินความพึงพอใจแยกเป็นเรื่อง 09 (12 พ.ย.)'],
  ['S15', 'หน่วยงาน บันทึกและส่งประวัติงานบำรุงรักษา', 'ตัดออก 10 พ.ย. · รับทราบรอบเดียวรายคันที่ S13'],
  ['S16', 'หัวหน้าหน่วยงาน ตรวจสอบประวัติงานบำรุงรักษา', 'ตัดออก 10 พ.ย. · ไม่ต้องรับทราบทั้งแผน รับทราบรายคันที่ S13 ก็พอ'],
  ['S17', 'ผู้ดำเนินการ ออกรายงานผลและปิดงาน', 'ตัดออก 10 พ.ย. · แผนปิดงานเองเมื่อทุกคันในแผนทุกไตรมาสเสร็จหรือบำรุงรักษาไม่ได้ และรับทราบครบ (13 พ.ย.) · ดูผลที่แดชบอร์ด'],
  ['S27', 'ผู้ดูแลยานพาหนะ ประเมินความพึงพอใจการให้บริการของ กบค. รายคัน', 'ย้ายไปเรื่องแยก 12 พ.ย. · แบบประเมินความพึงพอใจ (XCHO) ปลั๊กอิน satisfaction-plugin']];
const SCEN_COLS = [['scenario', 110], ['บล็อก', 90], ['ชื่อ', 600], ['ผู้ทำ', 300], ['จอ', 90], ['สถานะรีวิว', 260]];
function scenData() {
  const sec = DOCS.scenarios.sections.find(s => /^0\./.test(s.h)) || { rows: [] };
  const info = {}; sec.rows.forEach(r => { info[r[0]] = r; });   // # · scenario · ช่วงงาน · บทบาท · กล่องบนบอร์ด
  const rows = SCEN_SEQ.map(tag => { const g = GROUPS.find(x => x.subs[0].tag === tag), r = info[tag] || []; return [r[2] || '-', tag, g ? g.code : '-', r[1] || (g ? g.subs[0].title : ''), r[3] || '-', g ? String(g.subs.reduce((a, x) => a + x.screens.length, 0)) : '0', SCEN_REVIEW[tag] || 'ยังไม่ได้รีวิวรอบนี้']; });
  return { head: ['ช่วงงาน', 'scenario', 'บล็อก', 'ชื่อ', 'ผู้ทำ', 'จอ', 'สถานะรีวิว'], rows: rows.concat(SCEN_CUT.map(([tag, t, st]) => ['ตัดออกแล้ว', tag, '-', t, '-', '0', st])) };
}
/* use case ตาราง เดียว (4 พ.ย. 2569 เจ้าของงาน "ปรับแก้ให้เหลืออันเดียวได้มั้ย") — กลุ่มตามช่วงงานของ JO 7.3 มีคอลัมน์ scenario + ข้อ JO ⇒ ตามได้ทั้งสองทาง · เลิกตาราง "use case ตาม scenario" */
const UC_COLS = [['รหัส', 130], ['scenario', 100], ['บทบาท', 200], ['use case', 460], ['ผ่านเมื่อ', 420], ['JO', 90], ['สถานะใน flow', 160], ['หมายเหตุ', 320]];
/* user journey swimlane (เจ้าของงานสั่ง 4 พ.ย. 2569 "อยากให้ทำ user journey ยาวๆ เป็น swimlane ที่มี stakeholder ด้วย")
   เลือกวางบนหน้า Maintainance · ระดับขั้นงาน · สี่เหลี่ยม + ข้าวหลามตัด · ต้นทาง Diagram/01-บำรุงรักษาตามวาระ/26-บำรุงรักษา-swimlane.md (ฝังตอน build)
   กดซ้ำ = แทนกรอบของรอบก่อน (putBelow) ไม่ซ้อน */
async function buildSwimlane() {
  if (!SWIMLANE) { log('✗ ไม่มีข้อมูล swimlane ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H); const page = tp.page;
  await figma.setCurrentPageAsync(page);
  try {
    const r = await swimlaneBoard(PLUGIN.prefix, SWIMLANE);
    putBelow(page, r.frame);
    // ภาพย่อจากจอ desktop บนหน้านี้ (ชุดล่าสุด = ลำดับต้นของหน้า แบบ journey) · ไม่มีจอ = ช่องว่าง ⇒ กดสร้าง Desktop ก่อนแล้วกดใหม่
    const screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0 && !/ · mobile$/.test(n.name));
    const frameFor = (code) => screens.find(f => f.name.indexOf(PLUGIN.prefix + ' / ' + code + ' · ') === 0) || null;
    let shots = 0;
    for (const sl of r.slots) { const scr = frameFor(sl.codes[0]); if (scr && await fillThumb(sl.rect, scr)) shots++; }
    log('✓ user journey swimlane ' + SWIMLANE.lanes.length + ' ผู้เกี่ยวข้อง · ขั้นงาน ' + r.steps + ' · ทางแยก ' + r.forks + ' · เส้น ' + r.links + (r.slots.length ? ' · ภาพย่อจอ ' + shots + '/' + r.slots.length + (shots < r.slots.length ? ' (กล่องที่ไม่มีภาพ = ยังไม่มีจอนั้นบนหน้า — กดสร้าง Desktop ก่อนแล้วกดใหม่)' : '') : '') + ' (จาก ' + SWIMLANE.src + ') · หน้า "' + page.name.trim() + '" y=' + Math.round(r.frame.y));
    figma.viewport.scrollAndZoomIntoView([r.frame]);
  } catch (e) { warn('swimlane', e); dropCreated(page); }
}
/* flowchart กิจกรรมราย scenario (เจ้าของงาน 6 พ.ย. 2569 "สร้าง แต่ละ scen ออกมา … ทำ script ให้ export ใน figma" + "อยากได้ flowchart" · "แค่กิจกรรม … ไม่ต้องเอาหน้าจอไปรวม")
   วางบนหน้า Maintainance ต่อใต้ของเดิม · ต้นทาง Diagram/01-บำรุงรักษาตามวาระ/27-บำรุงรักษา-flowchart-กิจกรรม.md (ฝังตอน build)
   "อยากให้แยก scen เลยนะ" ⇒ 1 scenario = 1 กรอบบนหน้า ("MT · flowchart กิจกรรม · S1 · …") + กรอบคำอธิบาย · กดซ้ำ = ลบกรอบชุดเดิมก่อนแล้ววางใหม่ ไม่ซ้อน */
async function buildActivity() {
  if (!ACTIVITY) { log('✗ ไม่มีข้อมูล flowchart กิจกรรม ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H); const page = tp.page;
  await figma.setCurrentPageAsync(page);
  try {
    const tag = PLUGIN.prefix + ' · flowchart กิจกรรม';
    const old = page.children.filter(n => n.name === tag || n.name.indexOf(tag + ' · ') === 0);
    if (old.length) { log('↻ แทนที่ flowchart กิจกรรมของรอบก่อน ' + old.length + ' กรอบ'); old.forEach(n => n.remove()); }
    const r = await activityBoard(PLUGIN.prefix, ACTIVITY);
    putBelow(page, r.frame);   // หาที่ว่างด้วยขนาดรวม แล้วค่อยแยกเป็นกรอบละ scenario
    const y = Math.round(r.frame.y), made = splitBoard(page, r.frame);
    log('✓ flowchart กิจกรรม ' + r.scenarios + ' scenario แยกกรอบละ scenario · กิจกรรม ' + r.steps + ' · ทางเลือก ' + r.forks + ' · เส้น ' + r.links + ' (จาก ' + ACTIVITY.src + ') · หน้า "' + page.name.trim() + '" y=' + y + ' · ค้นใน Layers ด้วยคำว่า "flowchart กิจกรรม · S"');
    page.selection = made;
    figma.viewport.scrollAndZoomIntoView(made);
  } catch (e) { warn('flowchart กิจกรรม', e); dropCreated(page); }
}
async function buildDocs(o) {
  const parts = (o.parts && o.parts.length) ? o.parts : ['storymap', 'usecase'];
  /* R19 (เจ้าของงาน 20 ต.ค. 2569 แยกแถว Desktop / Mobile ทุกครั้ง) + 6 พ.ย. 2569 เจ้าของงาน "เมื่อวานเซฟว่า ต้องมี flowchart และมี mobile แต่วันนี้มี flowchart แล้ว แต่ว่ายังไม่มี mobile"
     ⇒ ติ๊กจอส่วนไหนก็สร้าง flowchart + Desktop + Mobile ครบทุกครั้ง (เดิมติ๊ก Desktop อย่างเดียวได้แถว Desktop อย่างเดียว) */
  const devs = ['screens', 'desktop', 'mobile'].some(k => parts.indexOf(k) >= 0) ? [false, true] : [];
  log('สร้าง ' + parts.length + ' ส่วน: ' + parts.join(' · '));
  if (devs.length) await buildSet(SCENARIOS, GROUPS, 'scenario', devs);
  if (parts.indexOf('journey') >= 0) await buildJourneyAll();
  if (parts.indexOf('swimlane') >= 0) await buildSwimlane();   // 4 พ.ย. 2569 user journey swimlane ตามผู้เกี่ยวข้อง
  if (parts.indexOf('activity') >= 0) await buildActivity();   // 6 พ.ย. 2569 flowchart กิจกรรมราย scenario (ไม่มีหน้าจอ)
  const docParts = parts.filter(p => p === 'storymap' || p === 'usecase' || p === 'scenarios');
  if (!docParts.length) return;
  if (!DOCS) { log('✗ ไม่มีข้อมูล story map / use case ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H); const page = tp.page;
  await figma.setCurrentPageAsync(page);
  const made = [];
  for (const k of docParts) {
    try {
      const f = k === 'storymap' ? await storyMapBoard(PLUGIN.prefix, DOCS.storymap)
        : k === 'scenarios' ? await tableBoard(PLUGIN.prefix, 'scenario', 'Scenario บำรุงรักษาตามวาระ · ' + SCEN_SEQ.length + ' scenario · อัปเดต ' + SCEN_UPDATED, DOCS.scenarios.src, scenData(), 'ช่วงงาน', SCEN_COLS)
        : await tableBoard(PLUGIN.prefix, 'use case', 'Use case บำรุงรักษาตามวาระ', DOCS.usecase.src, DOCS.usecase, 'ช่วงงาน', UC_COLS);
      putBelow(page, f); made.push(f);
      log('✓ ' + (k === 'storymap' ? 'user story mapping ' + DOCS.storymap.sections.length + ' ช่วงงาน' : k === 'scenarios' ? 'ตาราง scenario ' + scenData().rows.length + ' แถว' : 'use case ' + DOCS.usecase.rows.length + ' ข้อ') + ' (จาก ' + DOCS[k].src + ')');
    } catch (e) { warn(k, e); dropCreated(page); }
  }
  if (made.length) {   // 30 ต.ค. 2569 เจ้าของงาน "ไปสร้างอยู่ที่หน้าไหนหาไม่เจอ" ⇒ บอกชื่อหน้า + ตำแหน่ง แล้วเลือกกรอบให้ด้วย
    page.selection = made;
    figma.viewport.scrollAndZoomIntoView(made);
    log('→ อยู่บนหน้า "' + page.name.trim() + '"' + (tp.fresh ? ' (สร้างหน้าใหม่ เพราะไม่มีหน้าชื่อ Maintainance)' : '') + ' ล่างสุดของหน้า ' + made.map(f => '"' + f.name + '" (x ' + Math.round(f.x) + ', y ' + Math.round(f.y) + ')').join(' · ') + ' · เลือกไว้ให้แล้ว กด Shift+2 เพื่อซูมไปที่กรอบ หรือค้นชื่อใน Layers');
  }
}

figma.ui.onmessage = async (msg) => {
  try {
    const o = { devices: msg.devices, pick: msg.pick };
    if (msg.type === 'build') await build(o);
    if (msg.type === 'build-desktop') await buildDesktop();
    if (msg.type === 'build-mobile') await buildMobile();
    if (msg.type === 'build-pick') await buildPick(o);
    if (msg.type === 'build-journey') await buildJourneyAll();
    if (msg.type === 'build-activity') await buildActivity();
    if (msg.type === 'export-shots') await exportShots('flow-maintainance', msg.scen);   // msg.scen = scenario ที่ติ๊ก (9 พ.ย. 2569 แยก export FigJam ราย S)
    if (msg.type === 'replace-selected') await replaceSelected();   // 13 พ.ย. 2569 แทนที่จอที่เลือกด้วยฉบับล่าสุด
    if (msg.type === 'move-latest') await moveLatest();
    if (msg.type === 'purge-cut') await purgeCut();
    if (msg.type === 'archive-cut') await archiveCut();   // 10 พ.ย. 2569 ย้ายไปกรอบ ตัดออกแล้ว แทนการลบ   // 10 พ.ย. 2569 ลบจอบล็อก M N (S14 S15) และบล็อกว่างอื่น
    if (msg.type === 'clear-proto') { const tp = await namedPage(PAGE_NAMES); await figma.setCurrentPageAsync(tp.page); await clearPrototype(tp.page); }
    if (msg.type === 'build-docs') await buildDocs({ parts: msg.parts });   // 30 ต.ค. 2569 ติ๊กเลือกส่วน / สร้างทั้งหมด   // 30 ต.ค. 2569 ส่งภาพจอบนหน้านี้ไป FigJam
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]), codes: GROUPS.map(g => g.code) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก"

/* ======================== maintainance-feature-plugin/features/*.js ======================== */
const MF_FEATURES = [];

/* ---------- features/plan.js ---------- */
/* ============================================================================
   features/plan.js — Feature แผนบำรุงรักษา (S1 S2 S19 S20 S21)
   ย้ายออกจาก feature.js 17 พ.ย. 2569 · 18 พ.ย. 2569 ย้ายฐานไป origin/main ee11614 (base/screens.js)
   เอกสาร: Diagram/01-บำรุงรักษาตามวาระ/32-บำรุงรักษา-feature-แผนบำรุงรักษา-สำหรับ-dev.md
   ---------------------------------------------------------------------------
   แม่แบบของ Feature อื่น (features/<id>.js) — ลงทะเบียนด้วย MF_FEATURES.push({ … }) ใน IIFE (ตัวแปรในไฟล์ไม่ชนกับ Feature อื่น)
     id        รหัสสั้น (plan · trip · job · close · track)
     title     ชื่อ Feature (Title หลักบนหน้า + ชื่อบอร์ด FigJam)
     page      ชื่อหน้า Figma ['ชื่อหลัก', 'ชื่อสำรอง…']
     doc       ไฟล์เอกสารใน Diagram/01-บำรุงรักษาตามวาระ/ (ตัวเทสเทียบรหัสจอกับหัวข้อ 3 ของไฟล์นี้)
     scenarios scenario ใน screens.js ที่ใช้จอ ⇒ รหัสจอตาม GROUPS ของ screens.js (บล็อก B.3 · เรื่องย่อย A1.7)
     screens   { รหัสจอ: () => จอ } แทนจอเดิม หรือเพิ่มจอใหม่ (รหัส 'H:…' ใช้ใน happy flow)
     toasts    { id: { text, page, when, was, err? } } toast แยกชิ้น อ้างใน journeys ด้วย ['toast:<id>']
     happy     [ journey ละ 1 รายการ: [[รหัสจอ, คำอธิบายขั้น, ชื่อหน้า, ชื่อจอใน SCENARIOS], …] ]
     journeys  [ { title, pages: [ { name, items: [[รหัสจอ, ป้าย case, ชื่อจอใน SCENARIOS] | ['toast:<id>']] } ] } ]
               ช่องสุดท้าย "ชื่อจอใน SCENARIOS" = ตัวกันรหัสชี้ผิดจอหลังย้ายฐาน (ไม่ตรง ⇒ ปลั๊กอินเตือน) — เติมด้วย scratchpad gen.py inject
     fjDir / fjBoard  (ไม่ใส่ = flow-maintainance-feature-<id> / board-maintainance-feature-<id>)
   ฐาน origin (18 พ.ย. 2569):
     · S1 แบ่งเรื่องย่อย A1–A23 แบบเส้นตรงของเจ้าของงาน (R108) ⇒ journey 1–4 ของ Feature ใช้เรื่องย่อยเป็น "หน้า" (แถบ Sub Flow) เรียงตามที่เจ้าของงานเรียง
       จอในเรื่องย่อยมี toast ในตัวแล้ว (toast() ของ S1_SUBS) ⇒ ไม่มีเฟรม toast แยกใน journey เหล่านี้
     · เลือกยานพาหนะผ่าน modal (R109 R110) · แผน 2 ขั้น เพิ่มเข้าแผนแล้วจัดเข้าไตรมาส (R111) · อะไหล่หลายคัน (R112 T.14–T.19)
     · แผนรออนุมัติดูอย่างเดียว · S20 ลบได้เฉพาะแผนส่งกลับแก้ไข (R116) · S19 แผนดำเนินการแก้ได้เฉพาะไตรมาสที่ยังไม่เสร็จ (R113 R.11)
     · UNITS = กบผ. กปส. กรย. กบค. กส.1 กส.2 (R104) · สถานะแผนไม่มี hist / passed แล้ว (S16 S17 ตัด)
   ============================================================================ */
MF_FEATURES.push((() => {
/* หน้ารายการแผนแสดงตัวอย่างเต็มหน้า 10 รายการ ตาม Table pagination 10 แถวต่อหน้า (ผู้ใช้สั่ง 16 พ.ย. 2569)
   = แผนของหน่วยงานที่มีอยู่ (ownPlans) + แผนจำลองเพิ่ม 8 แผน · ข้อมูลจำลองเฉพาะปลั๊กอินนี้ ไม่แก้ screens.js ของพี่นุ
   เลขที่ MR ไม่ชนของเดิม (Z70 เว้น 0000004 ไว้ให้แผนที่สร้างใหม่ A1.18) · เรียงวันที่สร้างใหม่ไปเก่า · สถานะตาม PST ของฐานใหม่ (ไม่มี hist passed) */
const LIST10_EXTRA = [
  ['MRZ7100005', 'บำรุงรักษากระเช้าฮอทไลน์ ภาค 1 ปีงบประมาณ 2571', 'ภาค 1 (เหนือ)', 'ไตรมาส 1', '6', 'review', '08/11/2569', 'กระเช้าฮอทไลน์', '2571', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MRZ7100004', 'บำรุงรักษารถพ่วงฉีดน้ำ ภาค 2 ปีงบประมาณ 2571', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 1', '5', 'returned', '01/11/2569', 'รถพ่วงฉีดน้ำ', '2571', 'ไตรมาส 1: 2 · ไตรมาส 2: 1 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MRZ7100003', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 ปีงบประมาณ 2571', 'ภาค 1 (เหนือ)', 'ไตรมาส 1', '8', 'approved', '20/10/2569', 'กระเช้าแก้ไฟ', '2571', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ6900014', 'บำรุงรักษากระเช้าฮอทไลน์ ภาค 2 ปีงบประมาณ 2569', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 4', '7', 'closed', '10/06/2568', 'กระเช้าฮอทไลน์', '2569', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 1'],
  ['MRZ6900013', 'บำรุงรักษารถพ่วงฉีดน้ำ ภาค 1 ปีงบประมาณ 2569', 'ภาค 1 (เหนือ)', 'ไตรมาส 4', '4', 'active', '08/06/2568', 'รถพ่วงฉีดน้ำ', '2569', 'ไตรมาส 1: 1 · ไตรมาส 2: 1 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MRZ6800003', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 ปีงบประมาณ 2568', 'ภาค 1 (เหนือ)', 'ไตรมาส 4', '9', 'closed', '04/06/2567', 'กระเช้าแก้ไฟ', '2568', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ6800002', 'บำรุงรักษายานพาหนะ กบผ. ปีงบประมาณ 2568', 'ภาค 1, ภาค 2', 'ไตรมาส 4', '10', 'closed', '02/06/2567', 'กระเช้าแก้ไฟ, รถพ่วงฉีดน้ำ', '2568', 'ไตรมาส 1: 3 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ6800001', 'บำรุงรักษากระเช้าฮอทไลน์ ภาค 2 ปีงบประมาณ 2568', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 4', '5', 'closed', '28/05/2567', 'กระเช้าฮอทไลน์', '2568', 'ไตรมาส 1: 2 · ไตรมาส 2: 1 · ไตรมาส 3: 1 · ไตรมาส 4: 1']];
const dmy = (d) => { const [a, b, c] = d.split('/'); return +(c + b + a); };
const byDate = (rows) => rows.slice().sort((p, q) => dmy(q[6]) - dmy(p[6]));
/* ทุกจอ "รายการแผน" แสดงตารางเต็มหน้า 10 แถว + pagination (ผู้ใช้สั่ง 16 พ.ย. 2569) ยกเว้นรายการว่าง (A15.1)
   หน่วยงานอื่นใช้แม่แบบเดียวกับ LIST10_EXTRA เปลี่ยนเลขที่ MR ไม่ชนกัน และชื่อแผนที่มี "กบผ." เป็นหน่วยงานนั้น
   ลงทะเบียนเจ้าของแผนใน PLAN_UNIT (ตัวแปรของ screens.js · แก้ตอนรันเท่านั้น ไม่แก้ไฟล์) ⇒ มุม กบค. คอลัมน์หน่วยงานเจ้าของเรื่องถูกต้อง */
const EXTRA_MR = { 'กปส.': ['MRZ7100006', 'MRZ7100007', 'MRZ7100008', 'MRZ6900015', 'MRZ6900016', 'MRZ6800004', 'MRZ6800005', 'MRZ6800006'],
  'กรย.': ['MRZ7100009', 'MRZ7100010', 'MRZ7100011', 'MRZ6900017', 'MRZ6900018', 'MRZ6800007', 'MRZ6800008', 'MRZ6800009'] };
const EXTRA = { [UNITS[0]]: LIST10_EXTRA };
for (const [u, mrs] of Object.entries(EXTRA_MR)) EXTRA[u] = LIST10_EXTRA.map((r, i) => [mrs[i], r[1].replace(UNITS[0], u)].concat(r.slice(2)));
for (const [u, rows] of Object.entries(EXTRA)) rows.forEach(r => { PLAN_UNIT[r[0]] = u; });
const unitPool = (u) => byDate(ownPlans(u).concat(EXTRA[u] || []));
const KBK_POOL = byDate([NEW_PLAN].concat(allPlans(), ...Object.values(EXTRA)));
/* 10 แถว · first = แผนที่ต้องอยู่แถวแรก (เมนู "…" ผูกกับแถวแรกของตาราง — planMenu/firstMenuCell) แล้วเติมแผนอื่นของหน่วยงานตามวันที่สร้าง */
const rows10 = (pool, first) => (first ? [first] : []).concat(pool.filter(r => !first || r[0] !== first[0])).slice(0, TABLE_MAX.rows);
const LIST10 = rows10(unitPool(UNITS[0]));
const PLAN_ACTIVE = unitPool(UNITS[0]).find(r => r[5] === 'active');
const OWN = () => rows10(unitPool(UNITS[0]));
/* แทนจอรายการแผนของ screens.js ด้วยชื่อ/ตัวเลือกเดียวกัน ต่างแค่ 10 แถว */
const LIST_OVERRIDE = {
  'A1.1': () => listScreen('S1 รายการแผน', { rows: LIST10 }),
  'A1.18': async () => { const s = await listScreen('S1 บันทึกสำเร็จ', { rows: rows10(unitPool(UNITS[0]), A1_ROW) }); notify(s, 'ส่งแผนบำรุงรักษาเพื่ออนุมัติสำเร็จ'); return s; },
  'A11.1': () => listScreen('S1 รายการแผน', { rows: LIST10 }),
  'A12.1': () => listScreen('S1 รายการแผน', { rows: LIST10 }),
  'A22.3': () => listScreen('S1 ออกไม่บันทึก', { rows: LIST10 }),
  'A13.1': () => listScreen('S1 กบค. รายการแผน', { rows: rows10(KBK_POOL), view: 'กบค.' }),
  'A13.2': () => listScreen('S1 กบค. ตัวกรองรายการแผน', { rows: rows10(KBK_POOL), view: 'กบค.', filter: { units: [UNITS[0]], open: 'unit' } }),
  'A14.1': () => listScreen('S1 กปส. รายการแผน', { rows: rows10(unitPool('กปส.')) }),
  'A14.2': () => listScreen('S1 กรย. รายการแผน', { rows: rows10(unitPool('กรย.')) }),
  'R.1': async () => { const s = await listScreen('S19 เมนู', { rows: rows10(unitPool(UNITS[0]), planAs('returned')) }); planMenu(s, MENU); return s; },
  'R.8': async () => { const s = await listScreen('S19 บันทึกสำเร็จ', { rows: rows10(unitPool(UNITS[0]), NEW_PLAN) }); notify(s, 'บันทึกการแก้ไขแผนและส่งอนุมัติสำเร็จ'); return s; },
  'R.9': async () => { const s = await listScreen('S19 เมนูอนุมัติแล้ว', { rows: rows10(unitPool(UNITS[0]), planAs('approved')) }); planMenu(s, MENU.slice(0, 2)); return s; },
  'R.11': async () => { const s = await listScreen('S19 เมนูดำเนินการ', { rows: rows10(unitPool(UNITS[0]), PLAN_ACTIVE) }); planMenu(s, MENU.slice(0, 2)); return s; },
  'S.1': async () => { const s = await listScreen('S20 เมนู', { rows: rows10(unitPool(UNITS[0]), planAs('returned')) }); planMenu(s, MENU); return s; },
  'S.2': async () => { const s = await listScreen('S20 ยืนยันการลบ List', { rows: rows10(unitPool(UNITS[0]), planAs('returned')) }); await confirm(s, DELETE_CONFIRM); return s; },
  'S.3': async () => { const s = await listScreen('S20 ลบสำเร็จ', { rows: OWN() }); notify(s, 'ลบแผนบำรุงรักษาสำเร็จ'); return s; }
};
/* 17 พ.ย. 2569 ผู้ใช้สั่งเช็คช่องกรอกตามเคส (ใหม่กว่า origin 13 พ.ย. ที่กรอกรหัส/ลิตรไว้แล้ว): ระหว่างเลือกเบอร์น้ำมัน รหัสน้ำมันกับจำนวนยังเป็น placeholder (กรอกครบอยู่ที่ T.5 T.7) */
LIST_OVERRIDE['T.4'] = () => carPartsScreen('S21 เปลี่ยนน้ำมัน', { oil: 1, oilSpec: {}, gradeOpen: true });

/* ---------- Happy flow (ผู้ใช้สั่ง 17 พ.ย. 2569) — เส้นทางหลักสั้นๆ ของแต่ละ journey วางก่อนชุดทุกเคส ----------
   [รหัสจอ, คำอธิบายขั้น, ชื่อหน้า] · ขั้นที่อยู่หน้าเดียวกันติดกันห่าง 200 · เปลี่ยนหน้าห่าง 500 · journey 1 ย่อจากเรื่องย่อย A1 (เส้นหลักของเจ้าของงาน)
   จอผลลัพธ์ของฐานใหม่มี toast ในจอแล้ว (A1.18 R.8 S.3 B.4) ⇒ ไม่ต้องมีจอ H: */
const HAPPY = [
  [['A1.1', 'รายการแผน กดสร้างแผน', 'หน้ารายการแผน', 'รายการแผน — กดสร้างแผน'], ['A1.2', 'ฟอร์มสร้างแผน', 'หน้าสร้างแผน', 'ฟอร์มสร้างแผน (ว่าง) — แท็บทั้งหมด ยังไม่มียานพาหนะในแผน'], ['A1.4', 'modal เพิ่มยานพาหนะเข้าแผน', 'หน้าสร้างแผน', 'กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน ยานพาหนะทุกคันที่ยังไม่อยู่ในแผน แผงตัวกรองกางอยู่'],
    ['A1.7', 'ติ๊กยานพาหนะ 3 คัน', 'หน้าสร้างแผน', 'ติ๊กยานพาหนะ 3 คัน — ปุ่มเพิ่มเข้าแผน (3) กดได้'], ['A1.8', 'เพิ่มเข้าแผนแล้ว', 'หน้าสร้างแผน', 'เพิ่มเข้าแผนสำเร็จ — แท็บทั้งหมด 3 คัน ยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติยังกดไม่ได้'], ['A1.10', 'modal เพิ่มยานพาหนะเข้าไตรมาส 1', 'หน้าสร้างแผน', 'กดเพิ่มยานพาหนะเข้าไตรมาส 1 — modal เฉพาะ 3 คันในแผนที่ยังไม่จัดไตรมาส'],
    ['A1.12', 'เพิ่มเข้าไตรมาส 1 แล้ว', 'หน้าสร้างแผน', 'เพิ่มเข้าไตรมาส 1 สำเร็จ — แท็บไตรมาส 1 มี 3 คัน กำหนดอะไหล่แล้ว 0/3'], ['A1.13', 'ติ๊ก 2 คันรุ่นเดียวกัน กำหนดอะไหล่', 'หน้าสร้างแผน', 'ค้นหา Hino FC แล้วติ๊ก 2 คันรุ่นเดียวกัน — ปุ่มกำหนดอะไหล่ (2)'],
    ['A1.14', 'จัดการอะไหล่ 2 คัน', 'หน้าจัดการอะไหล่ของยานพาหนะ', 'หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง ปุ่มบันทึกกดได้'], ['A1.15', 'บันทึกอะไหล่แล้ว 2/3', 'หน้าสร้างแผน', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 2/3'],
    ['A1.17', 'อะไหล่ครบ 3/3 กดบันทึกและส่งอนุมัติ', 'หน้าสร้างแผน', 'กลับจากหน้าจัดการอะไหล่ — กำหนดอะไหล่ครบ 3/3 ปุ่มบันทึกและส่งอนุมัติกดได้'], ['A1.18', 'ส่งอนุมัติสำเร็จ', 'หน้ารายการแผน', 'บันทึกและส่งอนุมัติสำเร็จ — รายการแผน แผนใหม่รออนุมัติ']],
  [['A4.1', 'ไตรมาส 3 ยังไม่มียานพาหนะ', 'หน้าสร้างแผน', 'ไตรมาส 3 ยังไม่มียานพาหนะ — แผนมี 2 คันที่ยังไม่จัดไตรมาส'], ['A4.2', 'modal เพิ่มยานพาหนะเข้าไตรมาส 3', 'หน้าสร้างแผน', 'กดเพิ่มยานพาหนะเข้าไตรมาส 3 — modal แสดงเฉพาะ 2 คันที่ยังไม่จัด คันในไตรมาส 1 ไม่แสดง'], ['A4.3', 'ติ๊ก 2 คัน', 'หน้าสร้างแผน', 'ติ๊กยานพาหนะ 2 คัน — ปุ่มเพิ่มเข้าไตรมาส 3 (2) กดได้'], ['A4.4', 'เพิ่มเข้าไตรมาส 3 แล้ว', 'หน้าสร้างแผน', 'เพิ่มยานพาหนะเข้าไตรมาส 3 สำเร็จ — แท็บไตรมาส 3 มี 2 คัน']],
  [['A5.1', 'เมนู … แก้ไข', 'หน้าสร้างแผน', 'แท็บไตรมาส 1 — 3 คัน กำหนดอะไหล่แล้ว 0/3 กดปุ่ม … ของ 82-6789 → แก้ไข'], ['A5.2', 'จัดการอะไหล่ของยานพาหนะ', 'หน้าจัดการอะไหล่ของยานพาหนะ', 'หน้าจัดการอะไหล่ของยานพาหนะ 82-6789 — เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง'], ['A5.3', 'บันทึกอะไหล่แล้ว 1/3', 'หน้าสร้างแผน', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 1/3']],
  [['A11.1', 'รายการแผน', 'หน้ารายการแผน', 'รายการแผน — กดเมนู … ดูรายละเอียดแผนที่อนุมัติแล้ว'], ['A11.2', 'รายละเอียดแผนอนุมัติแล้ว', 'หน้ารายละเอียดแผน', 'รายละเอียดแผน — อนุมัติแล้ว']],
  [['R.1', 'เมนู … แก้ไข', 'หน้ารายการแผน', 'เมนู "…" → แก้ไข'], ['R.3', 'ฟอร์มแก้ไขแผน', 'หน้าแก้ไขแผน', 'ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้'], ['R.6', 'ยืนยันการแก้ไข', 'หน้าแก้ไขแผน', 'ยืนยันการแก้ไขแผน'], ['R.8', 'แก้ไขสำเร็จ รออนุมัติใหม่', 'หน้ารายการแผน', 'บันทึกสำเร็จ — รออนุมัติ']],
  [['S.1', 'เมนู … ลบ', 'หน้ารายการแผน', 'เมนู "…" → ลบ ในหน้า List'], ['S.2', 'ยืนยันการลบ', 'หน้ารายการแผน', 'ยืนยันการลบแผน ในหน้า List'], ['S.3', 'ลบสำเร็จ', 'หน้ารายการแผน', 'ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)']],
  [['B.1', 'แผนรออนุมัติ', 'หน้าแผนรออนุมัติ', 'รายการแผนรออนุมัติ'], ['B.2', 'พิจารณาแผน', 'หน้าพิจารณาแผน', 'รายละเอียดแผน — ผลการพิจารณา ยังไม่เลือก'], ['B.3', 'ยืนยันอนุมัติ', 'หน้าพิจารณาแผน', 'อนุมัติ — ยืนยันอนุมัติแผน'], ['B.4', 'อนุมัติสำเร็จ', 'หน้าพิจารณาแผน', 'อนุมัติแผนสำเร็จ']]];
/* toast แยกชิ้นของ journey ที่ไม่ใช่ S1 (ข้อความลอกจาก notify() ใน base/screens.js) · page/when = ป้ายบอกว่าแสดงที่ไหน เมื่อไหร่ */
const FEATURE_TOASTS = {
  S2: { text: 'บันทึกการแก้ไขแผนและส่งอนุมัติสำเร็จ', page: 'รายการแผน', when: 'ยืนยันการแก้ไขสำเร็จ', was: 'R.8' },
  S3: { text: 'ลบแผนบำรุงรักษาสำเร็จ', page: 'รายการแผน', when: 'ลบสำเร็จ', was: 'S.3' },
  S4: { text: 'อนุมัติแผนบำรุงรักษาสำเร็จ', page: 'พิจารณาแผน', when: 'ยืนยันอนุมัติสำเร็จ', was: 'B.4' },
  S5: { text: 'ส่งแผนกลับให้ผู้สร้างแผนแก้ไขแล้ว', page: 'แผนรออนุมัติ', when: 'ยืนยันส่งกลับสำเร็จ', was: 'B.8' },
  T1: { text: 'บันทึกอะไหล่ของยานพาหนะ ' + CAND[0][0] + ' แล้ว', page: 'สร้างแผน', when: 'บันทึกอะไหล่ของยานพาหนะ 1 คันสำเร็จ', was: 'T.10' },
  E1: { text: 'general error', err: true, page: 'หน้าที่กดบันทึก', when: 'บันทึกไม่สำเร็จ อยู่หน้าเดิม ข้อมูลไม่หาย', was: 'R.7 T.9 A23.2' }
};
/* โครง feature แบบตัว Z (ผู้ใช้สั่ง 16 พ.ย. 2569) — Title หลัก → journey (1 แถวยาว) → หน้า → case
   journey 1–4 = เรื่องย่อยของ S1 (R108) จัดกลุ่มตามงาน · journey 5–7 = S19 S20 S2 จัดตามหน้า
   หน้าตาซ้ำ ไม่สร้าง: R.2 = S.4 = A12.2 (planDetail returned) · S.6 = A11.2 (planDetail approved) */
const FEATURE_TITLE = 'แผนบำรุงรักษา';
const FEATURE = [
  { title: 'สร้างแผนจนส่งอนุมัติ', pages: [
    { name: 'A1 สร้างแผนจนส่งอนุมัติ (เส้นหลัก)', items: [['A1.1', 'รายการแผน — กดสร้างแผน', 'รายการแผน — กดสร้างแผน'], ['A1.2', 'ฟอร์มสร้างแผน (ว่าง) — แท็บทั้งหมด ยังไม่มียานพาหนะในแผน', 'ฟอร์มสร้างแผน (ว่าง) — แท็บทั้งหมด ยังไม่มียานพาหนะในแผน'], ['A1.3', 'เลือกปีงบประมาณ — กรอกชื่อแผนแล้ว รายการปีเปิด', 'เลือกปีงบประมาณ — กรอกชื่อแผนแล้ว รายการปีเปิด'], ['A1.4', 'กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน ยานพาหนะทุกคันที่ยังไม่อยู่ในแผน แผงตัวกรองกางอยู่', 'กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน ยานพาหนะทุกคันที่ยังไม่อยู่ในแผน แผงตัวกรองกางอยู่'], ['A1.5', 'เลือกภาค เขต ในแผงตัวกรอง — รายการเขตของภาคที่เลือก', 'เลือกภาค เขต ในแผงตัวกรอง — รายการเขตของภาคที่เลือก'], ['A1.6', 'กดตกลง — ตารางเหลือยานพาหนะของพื้นที่ที่เลือก', 'กดตกลง — ตารางเหลือยานพาหนะของพื้นที่ที่เลือก'], ['A1.7', 'ติ๊กยานพาหนะ 3 คัน — ปุ่มเพิ่มเข้าแผน (3) กดได้', 'ติ๊กยานพาหนะ 3 คัน — ปุ่มเพิ่มเข้าแผน (3) กดได้'], ['A1.8', 'เพิ่มเข้าแผนสำเร็จ — แท็บทั้งหมด 3 คัน ยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติยังกดไม่ได้', 'เพิ่มเข้าแผนสำเร็จ — แท็บทั้งหมด 3 คัน ยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติยังกดไม่ได้'], ['A1.9', 'เปิดแท็บไตรมาส 1 — ยังไม่มียานพาหนะในไตรมาสนี้ กดเพิ่มยานพาหนะเข้าไตรมาส 1', 'เปิดแท็บไตรมาส 1 — ยังไม่มียานพาหนะในไตรมาสนี้ กดเพิ่มยานพาหนะเข้าไตรมาส 1'], ['A1.10', 'กดเพิ่มยานพาหนะเข้าไตรมาส 1 — modal เฉพาะ 3 คันในแผนที่ยังไม่จัดไตรมาส', 'กดเพิ่มยานพาหนะเข้าไตรมาส 1 — modal เฉพาะ 3 คันในแผนที่ยังไม่จัดไตรมาส'], ['A1.11', 'ติ๊กยานพาหนะ 3 คัน — ปุ่มเพิ่มเข้าไตรมาส 1 (3) กดได้', 'ติ๊กยานพาหนะ 3 คัน — ปุ่มเพิ่มเข้าไตรมาส 1 (3) กดได้'], ['A1.12', 'เพิ่มเข้าไตรมาส 1 สำเร็จ — แท็บไตรมาส 1 มี 3 คัน กำหนดอะไหล่แล้ว 0/3', 'เพิ่มเข้าไตรมาส 1 สำเร็จ — แท็บไตรมาส 1 มี 3 คัน กำหนดอะไหล่แล้ว 0/3'], ['A1.13', 'ค้นหา Hino FC แล้วติ๊ก 2 คันรุ่นเดียวกัน — ปุ่มกำหนดอะไหล่ (2)', 'ค้นหา Hino FC แล้วติ๊ก 2 คันรุ่นเดียวกัน — ปุ่มกำหนดอะไหล่ (2)'], ['A1.14', 'หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง ปุ่มบันทึกกดได้', 'หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง ปุ่มบันทึกกดได้'], ['A1.15', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 2/3', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 2/3'], ['A1.16', 'กดปุ่ม … ของ 82-6789 → แก้ไข — ไปหน้าจัดการอะไหล่ (S21)', 'กดปุ่ม … ของ 82-6789 → แก้ไข — ไปหน้าจัดการอะไหล่ (S21)'], ['A1.17', 'กลับจากหน้าจัดการอะไหล่ — กำหนดอะไหล่ครบ 3/3 ปุ่มบันทึกและส่งอนุมัติกดได้', 'กลับจากหน้าจัดการอะไหล่ — กำหนดอะไหล่ครบ 3/3 ปุ่มบันทึกและส่งอนุมัติกดได้'], ['A1.18', 'บันทึกและส่งอนุมัติสำเร็จ — รายการแผน แผนใหม่รออนุมัติ', 'บันทึกและส่งอนุมัติสำเร็จ — รายการแผน แผนใหม่รออนุมัติ'], ['A1.19', 'รายละเอียดแผน — รออนุมัติ ดูอย่างเดียว', 'รายละเอียดแผน — รออนุมัติ ดูอย่างเดียว']] },
    { name: 'A15 ยังไม่มีแผน — เริ่มแผนแรก', items: [['A15.1', 'รายการแผน — ยังไม่มีแผน กดสร้างแผน', 'รายการแผน — ยังไม่มีแผน กดสร้างแผน'], ['A15.2', 'ฟอร์มสร้างแผน (ว่าง) — แท็บทั้งหมด ยังไม่มียานพาหนะในแผน', 'ฟอร์มสร้างแผน (ว่าง) — แท็บทั้งหมด ยังไม่มียานพาหนะในแผน']] },
    { name: 'A16 กรอกข้อมูลแผนไม่ครบ', items: [['A16.1', 'ฟอร์มสร้างแผน (ว่าง) — แท็บทั้งหมด ยังไม่มียานพาหนะในแผน', 'ฟอร์มสร้างแผน (ว่าง) — แท็บทั้งหมด ยังไม่มียานพาหนะในแผน'], ['A16.2', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus — ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus — ปุ่มบันทึกและส่งอนุมัติกดไม่ได้']] },
    { name: 'A19 ค้นหาใน modal ไม่พบยานพาหนะ', items: [['A19.1', 'กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน แผงตัวกรองกางอยู่', 'กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน แผงตัวกรองกางอยู่'], ['A19.2', 'ค้นหาใน modal ไม่พบยานพาหนะ — พิมพ์ 99-9999 ล้างตัวกรองเพื่อกลับไปเห็นรายการ', 'ค้นหาใน modal ไม่พบยานพาหนะ — พิมพ์ 99-9999 ล้างตัวกรองเพื่อกลับไปเห็นรายการ']] },
    { name: 'A22 ออกจากหน้าโดยยังไม่บันทึก', items: [['A22.1', 'กดย้อนกลับ — ฟอร์มที่กรอกแล้ว ยานพาหนะ 3 คัน กำหนดอะไหล่แล้ว 1/3', 'กดย้อนกลับ — ฟอร์มที่กรอกแล้ว ยานพาหนะ 3 คัน กำหนดอะไหล่แล้ว 1/3'], ['A22.2', 'ย้อนกลับ — ยืนยันการออก ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', 'ย้อนกลับ — ยืนยันการออก ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก'], ['A22.3', 'ออกแล้ว — รายการแผน ไม่มีแผนใหม่', 'ออกแล้ว — รายการแผน ไม่มีแผนใหม่']] },
    { name: 'A23 บันทึกและส่งอนุมัติไม่สำเร็จ', items: [['A23.1', 'กำหนดอะไหล่ครบ 3/3 — กดบันทึกและส่งอนุมัติ', 'กำหนดอะไหล่ครบ 3/3 — กดบันทึกและส่งอนุมัติ'], ['A23.2', 'บันทึกไม่สำเร็จ — toast ผิดพลาด ค่าที่กรอกยังอยู่ กดบันทึกใหม่ได้', 'บันทึกไม่สำเร็จ — toast ผิดพลาด ค่าที่กรอกยังอยู่ กดบันทึกใหม่ได้']] }] },
  { title: 'เพิ่มยานพาหนะและจัดเข้าไตรมาส', pages: [
    { name: 'A2 เพิ่มยานพาหนะเข้าแผนด้วยการค้นหาทะเบียน', items: [['A2.1', 'แท็บทั้งหมด — มี 3 คันในไตรมาส 1 กดเพิ่มยานพาหนะ', 'แท็บทั้งหมด — มี 3 คันในไตรมาส 1 กดเพิ่มยานพาหนะ'], ['A2.2', 'กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน แผงตัวกรองกางอยู่', 'กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน แผงตัวกรองกางอยู่'], ['A2.3', 'กดปุ่มตัวกรอง — แผงตัวกรองหุบ เหลือช่องค้นหาและตาราง', 'กดปุ่มตัวกรอง — แผงตัวกรองหุบ เหลือช่องค้นหาและตาราง'], ['A2.4', 'พิมพ์ค้นหา 82- — ตารางเหลือยานพาหนะที่ตรงคำค้น', 'พิมพ์ค้นหา 82- — ตารางเหลือยานพาหนะที่ตรงคำค้น'], ['A2.5', 'ติ๊กยานพาหนะ 82-4410 — ปุ่มเพิ่มเข้าแผน (1) กดได้', 'ติ๊กยานพาหนะ 82-4410 — ปุ่มเพิ่มเข้าแผน (1) กดได้'], ['A2.6', 'เพิ่มเข้าแผนสำเร็จ — แท็บทั้งหมด 4 คัน 82-4410 ยังไม่จัดไตรมาส', 'เพิ่มเข้าแผนสำเร็จ — แท็บทั้งหมด 4 คัน 82-4410 ยังไม่จัดไตรมาส']] },
    { name: 'A3 เพิ่มยานพาหนะของกองในสำนักงานใหญ่ (ภาค สนง.)', items: [['A3.1', 'กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน แผงตัวกรองกางอยู่', 'กดเพิ่มยานพาหนะ — modal เพิ่มยานพาหนะเข้าแผน แผงตัวกรองกางอยู่'], ['A3.2', 'เลือกภาค สนง. — รายการภาค มี สนง. (สำนักงานใหญ่)', 'เลือกภาค สนง. — รายการภาค มี สนง. (สำนักงานใหญ่)'], ['A3.3', 'เลือกกองของ สนง. — รายการเขตเป็นกองของสำนักงานใหญ่', 'เลือกกองของ สนง. — รายการเขตเป็นกองของสำนักงานใหญ่'], ['A3.4', 'กดตกลง — ตารางเหลือยานพาหนะของ กบค.', 'กดตกลง — ตารางเหลือยานพาหนะของ กบค.'], ['A3.5', 'ติ๊กยานพาหนะ 70-4415 — ปุ่มเพิ่มเข้าแผน (1) กดได้', 'ติ๊กยานพาหนะ 70-4415 — ปุ่มเพิ่มเข้าแผน (1) กดได้'], ['A3.6', 'เพิ่มเข้าแผนสำเร็จ — แท็บทั้งหมดมียานพาหนะของ กบค. ยังไม่จัดไตรมาส', 'เพิ่มเข้าแผนสำเร็จ — แท็บทั้งหมดมียานพาหนะของ กบค. ยังไม่จัดไตรมาส']] },
    { name: 'A4 จัดยานพาหนะเข้าไตรมาสที่ยังไม่มียานพาหนะ', items: [['A4.1', 'ไตรมาส 3 ยังไม่มียานพาหนะ — แผนมี 2 คันที่ยังไม่จัดไตรมาส', 'ไตรมาส 3 ยังไม่มียานพาหนะ — แผนมี 2 คันที่ยังไม่จัดไตรมาส'], ['A4.2', 'กดเพิ่มยานพาหนะเข้าไตรมาส 3 — modal แสดงเฉพาะ 2 คันที่ยังไม่จัด คันในไตรมาส 1 ไม่แสดง', 'กดเพิ่มยานพาหนะเข้าไตรมาส 3 — modal แสดงเฉพาะ 2 คันที่ยังไม่จัด คันในไตรมาส 1 ไม่แสดง'], ['A4.3', 'ติ๊กยานพาหนะ 2 คัน — ปุ่มเพิ่มเข้าไตรมาส 3 (2) กดได้', 'ติ๊กยานพาหนะ 2 คัน — ปุ่มเพิ่มเข้าไตรมาส 3 (2) กดได้'], ['A4.4', 'เพิ่มยานพาหนะเข้าไตรมาส 3 สำเร็จ — แท็บไตรมาส 3 มี 2 คัน', 'เพิ่มยานพาหนะเข้าไตรมาส 3 สำเร็จ — แท็บไตรมาส 3 มี 2 คัน']] },
    { name: 'A17 ยังมียานพาหนะที่ยังไม่จัดไตรมาส', items: [['A17.1', 'แท็บทั้งหมด — 82-4410 ยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', 'แท็บทั้งหมด — 82-4410 ยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติกดไม่ได้'], ['A17.2', 'ติ๊กยานพาหนะ 82-4410 ใน modal เพิ่มยานพาหนะเข้าไตรมาส 2 — ปุ่มเพิ่มเข้าไตรมาส 2 (1) กดได้', 'ติ๊กยานพาหนะ 82-4410 ใน modal เพิ่มยานพาหนะเข้าไตรมาส 2 — ปุ่มเพิ่มเข้าไตรมาส 2 (1) กดได้'], ['A17.3', 'เพิ่มเข้าไตรมาส 2 สำเร็จ — ทุกคันจัดเข้าไตรมาสแล้ว ปุ่มบันทึกและส่งอนุมัติกดได้', 'เพิ่มเข้าไตรมาส 2 สำเร็จ — ทุกคันจัดเข้าไตรมาสแล้ว ปุ่มบันทึกและส่งอนุมัติกดได้']] },
    { name: 'A18 ยานพาหนะในแผนจัดเข้าไตรมาสครบแล้ว', items: [['A18.1', 'ไตรมาส 4 ยังไม่มียานพาหนะ — ทุกคันในแผนอยู่ในไตรมาส 1', 'ไตรมาส 4 ยังไม่มียานพาหนะ — ทุกคันในแผนอยู่ในไตรมาส 1'], ['A18.2', 'ยานพาหนะในแผนจัดเข้าไตรมาสครบแล้ว — modal ไม่มียานพาหนะให้เลือก ให้เพิ่มเข้าแผนที่แท็บทั้งหมดก่อน', 'ยานพาหนะในแผนจัดเข้าไตรมาสครบแล้ว — modal ไม่มียานพาหนะให้เลือก ให้เพิ่มเข้าแผนที่แท็บทั้งหมดก่อน'], ['A18.3', 'กดเพิ่มยานพาหนะที่แท็บทั้งหมด — modal เพิ่มยานพาหนะเข้าแผน', 'กดเพิ่มยานพาหนะที่แท็บทั้งหมด — modal เพิ่มยานพาหนะเข้าแผน']] },
    { name: 'A20 ยานพาหนะทุกคันอยู่ในแผนแล้ว', items: [['A20.1', 'แท็บทั้งหมด — ยานพาหนะคันอื่นอยู่ในแผนครบแล้ว กดเพิ่มยานพาหนะ', 'แท็บทั้งหมด — ยานพาหนะคันอื่นอยู่ในแผนครบแล้ว กดเพิ่มยานพาหนะ'], ['A20.2', 'ยานพาหนะทุกคันอยู่ในแผนแล้ว — modal ไม่มียานพาหนะให้เพิ่ม', 'ยานพาหนะทุกคันอยู่ในแผนแล้ว — modal ไม่มียานพาหนะให้เพิ่ม']] },
    { name: 'A7 ย้ายยานพาหนะไปไตรมาสอื่น', items: [['A7.1', 'แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น เอาออกจากไตรมาส', 'แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น เอาออกจากไตรมาส'], ['A7.2', 'เมนู … → ย้ายไปไตรมาสอื่น — popup ยังไม่เลือกไตรมาส', 'เมนู … → ย้ายไปไตรมาสอื่น — popup ยังไม่เลือกไตรมาส'], ['A7.3', 'เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้', 'เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้'], ['A7.4', 'ย้ายสำเร็จ — แท็บไตรมาส 2 มี 82-6789 ตัวเลขบนแท็บเปลี่ยน', 'ย้ายสำเร็จ — แท็บไตรมาส 2 มี 82-6789 ตัวเลขบนแท็บเปลี่ยน']] },
    { name: 'A8 เอายานพาหนะออกจากไตรมาส', items: [['A8.1', 'แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น เอาออกจากไตรมาส', 'แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น เอาออกจากไตรมาส'], ['A8.2', 'เมนู … → เอาออกจากไตรมาส — แท็บไตรมาส 1 เหลือ 2 คัน', 'เมนู … → เอาออกจากไตรมาส — แท็บไตรมาส 1 เหลือ 2 คัน'], ['A8.3', 'แท็บทั้งหมด — 82-6789 ยังอยู่ในแผน ยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', 'แท็บทั้งหมด — 82-6789 ยังอยู่ในแผน ยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติกดไม่ได้'], ['A8.4', 'ติ๊กยานพาหนะ 82-6789 ใน modal เพิ่มยานพาหนะเข้าไตรมาส 2 — กลับมาให้เลือกได้ ปุ่มเพิ่มเข้าไตรมาส 2 (1) กดได้', 'ติ๊กยานพาหนะ 82-6789 ใน modal เพิ่มยานพาหนะเข้าไตรมาส 2 — กลับมาให้เลือกได้ ปุ่มเพิ่มเข้าไตรมาส 2 (1) กดได้'], ['A8.5', 'เพิ่มเข้าไตรมาส 2 สำเร็จ — ทุกคันจัดเข้าไตรมาสแล้ว', 'เพิ่มเข้าไตรมาส 2 สำเร็จ — ทุกคันจัดเข้าไตรมาสแล้ว']] },
    { name: 'A10 ลบยานพาหนะออกจากแผน', items: [['A10.1', 'แท็บทั้งหมด — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ลบ', 'แท็บทั้งหมด — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ลบ'], ['A10.2', 'เมนู … → ลบ — ยืนยันการลบยานพาหนะออกจากแผน', 'เมนู … → ลบ — ยืนยันการลบยานพาหนะออกจากแผน'], ['A10.3', 'ลบสำเร็จ — แท็บทั้งหมดเหลือ 2 คัน', 'ลบสำเร็จ — แท็บทั้งหมดเหลือ 2 คัน']] }] },
  { title: 'กำหนดอะไหล่ของยานพาหนะ', pages: [
    { name: 'A5 กำหนดอะไหล่ทีละคัน', items: [['A5.1', 'แท็บไตรมาส 1 — 3 คัน กำหนดอะไหล่แล้ว 0/3 กดปุ่ม … ของ 82-6789 → แก้ไข', 'แท็บไตรมาส 1 — 3 คัน กำหนดอะไหล่แล้ว 0/3 กดปุ่ม … ของ 82-6789 → แก้ไข'], ['A5.2', 'หน้าจัดการอะไหล่ของยานพาหนะ 82-6789 — เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง', 'หน้าจัดการอะไหล่ของยานพาหนะ 82-6789 — เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง'], ['A5.3', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 1/3', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 1/3']] },
    { name: 'A6 กำหนดอะไหล่หลายคันจากแท็บทั้งหมด', items: [['A6.1', 'แท็บทั้งหมด — 4 คัน 82-4410 ยังไม่จัดไตรมาส ยังไม่กำหนดอะไหล่', 'แท็บทั้งหมด — 4 คัน 82-4410 ยังไม่จัดไตรมาส ยังไม่กำหนดอะไหล่'], ['A6.2', 'ค้นหา Isuzu FTR แล้วติ๊ก 2 คัน — คันในไตรมาส 1 กับคันที่ยังไม่จัด ปุ่มกำหนดอะไหล่ (2)', 'ค้นหา Isuzu FTR แล้วติ๊ก 2 คัน — คันในไตรมาส 1 กับคันที่ยังไม่จัด ปุ่มกำหนดอะไหล่ (2)'], ['A6.3', 'หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — เตือน 1 คันกำหนดอะไหล่ไว้แล้ว บันทึกแล้วแทนของเดิม', 'หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — เตือน 1 คันกำหนดอะไหล่ไว้แล้ว บันทึกแล้วแทนของเดิม'], ['A6.4', 'บันทึกสำเร็จ — แท็บทั้งหมด 2 คันได้อะไหล่ชุดเดียวกัน', 'บันทึกสำเร็จ — แท็บทั้งหมด 2 คันได้อะไหล่ชุดเดียวกัน']] },
    { name: 'A21 กำหนดอะไหล่หลายคันที่ต่างรุ่น', items: [['A21.1', 'แท็บไตรมาส 1 — ติ๊ก 82-6789 กับ 82-1145 (คนละรุ่น) ปุ่มกำหนดอะไหล่ (2)', 'แท็บไตรมาส 1 — ติ๊ก 82-6789 กับ 82-1145 (คนละรุ่น) ปุ่มกำหนดอะไหล่ (2)'], ['A21.2', 'หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — เตือนยานพาหนะที่เลือกมีหลายรุ่น ตรวจแล้วบันทึกได้', 'หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — เตือนยานพาหนะที่เลือกมีหลายรุ่น ตรวจแล้วบันทึกได้'], ['A21.3', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 2/3', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 กำหนดอะไหล่แล้ว 2/3']] },
    { name: 'A9 ดูอะไหล่ของยานพาหนะในไตรมาส', items: [['A9.1', 'แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น เอาออกจากไตรมาส', 'แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ย้ายไปไตรมาสอื่น เอาออกจากไตรมาส'], ['A9.2', 'เมนู … → ดูรายละเอียด — อะไหล่ของยานพาหนะคันนี้ ดูอย่างเดียว', 'เมนู … → ดูรายละเอียด — อะไหล่ของยานพาหนะคันนี้ ดูอย่างเดียว']] },
    { name: 'หน้าจัดการอะไหล่ของยานพาหนะ', items: [['T.1', 'แท็บไตรมาส 1 · Default ทุกคันยังไม่กำหนด', 'แท็บไตรมาส 1 — ทุกคันยังไม่กำหนด อะไหล่ในไตรมาสว่าง'], ['T.2', 'Default ยังไม่กำหนด', 'เมนู … → แก้ไข — หน้าจัดการอะไหล่ของยานพาหนะ (ยังไม่กำหนด)'], ['T.3', 'Interaction เลือกยานพาหนะคันอื่น', 'เลือกยานพาหนะคันอื่น — รายการยานพาหนะในไตรมาสเปิด'], ['T.19', 'Interaction เปิดจากแท็บทั้งหมด เลือกยานพาหนะในแผน', 'เปิดจากแท็บทั้งหมด — เลือกยานพาหนะคันอื่น รายการยานพาหนะในแผน บอกไตรมาส'],
      ['T.11', 'Disabled เบิกแต่ยังไม่เลือกอะไหล่', 'เลือกเบิกอะไหล่ — คลังอะไหล่และรายการขึ้น ยังไม่เลือกอะไหล่ ปุ่มบันทึกกดไม่ได้'], ['T.4', 'Interaction เลือกเบอร์น้ำมัน', 'เลือกเปลี่ยนน้ำมัน — ระบุเบอร์น้ำมัน รหัส จำนวนลิตร'], ['T.5', 'Filled ไส้กรองจากคลัง', 'เลือกไส้กรองจากคลัง — เข้าอะไหล่อื่นๆ ของยานพาหนะคันนี้'], ['T.6', 'Interaction popup อะไหล่เพิ่มเติม', 'ระบุอะไหล่เพิ่มเติม — popup ชื่อ ยี่ห้อ รุ่น รหัส จำนวน หน่วย'], ['T.7', 'Filled มีอะไหล่ที่ระบุเอง', 'ระบุอะไหล่เพิ่มเติมแล้ว — อยู่ในรายการ'],
      ['T.12', 'Filled ไม่เบิก', 'เลือกไม่เบิกอะไหล่ — ไม่ต้องเลือกอะไหล่ ปุ่มบันทึกกดได้'], ['T.8', 'Confirm ยืนยันการออก', 'ย้อนกลับ — ยืนยันการออก'], ['T.9', 'Error บันทึกไม่สำเร็จ', 'บันทึกไม่สำเร็จ'], ['T.10', 'แท็บไตรมาส 1 · Filled บันทึกแล้ว 1 คัน', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 ยานพาหนะ 1 คันกำหนดแล้ว อะไหล่ในไตรมาสมีของคันนี้'], ['T.13', 'แท็บไตรมาส 1 · Filled บันทึกไม่เบิกอะไหล่', 'บันทึกไม่เบิกอะไหล่แล้ว — แถวยานพาหนะขึ้น ไม่เบิกอะไหล่'], ['toast:T1']] },
    { name: 'หน้าจัดการอะไหล่หลายคัน', items: [['T.14', 'แท็บไตรมาส 1 · Interaction ติ๊กหลายคัน ปุ่มกำหนดอะไหล่ (2)', 'ติ๊กหลายคันในแท็บไตรมาส 1 — ปุ่มกำหนดอะไหล่ (2)'], ['T.15', 'Default 2 คัน ยังไม่กำหนด', 'หน้าจัดการอะไหล่ของยานพาหนะ 2 คัน — ตารางยานพาหนะที่เลือก ยังไม่กำหนด'], ['T.16', 'Filled 2 คัน เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง', 'หลายคัน เลือกเบิก เปลี่ยนน้ำมัน ไส้กรอง — ปุ่มบันทึกอะไหล่ของยานพาหนะ 2 คันกดได้'],
      ['T.17', 'Alert หลายคันต่างรุ่น และบางคันกำหนดไว้แล้ว', 'หลายคันต่างรุ่นและบางคันกำหนดไว้แล้ว — Alert เตือน 2 แบบ'], ['T.18', 'แท็บไตรมาส 1 · Filled บันทึกหลายคันแล้ว', 'บันทึกหลายคันสำเร็จ — กลับแท็บไตรมาส 1 ทั้ง 2 คันกำหนดแล้ว']] }] },
  { title: 'ดูแผน', pages: [
    { name: 'A11 เปิดดูแผนที่อนุมัติแล้ว', items: [['A11.1', 'รายการแผน — กดเมนู … ดูรายละเอียดแผนที่อนุมัติแล้ว', 'รายการแผน — กดเมนู … ดูรายละเอียดแผนที่อนุมัติแล้ว'], ['A11.2', 'รายละเอียดแผน — อนุมัติแล้ว', 'รายละเอียดแผน — อนุมัติแล้ว']] },
    { name: 'A12 แผนถูกส่งกลับแก้ไข แล้วไปแก้ไขแผน (S19)', items: [['A12.1', 'รายการแผน — กดเมนู … ดูรายละเอียดแผนที่ส่งกลับแก้ไข', 'รายการแผน — กดเมนู … ดูรายละเอียดแผนที่ส่งกลับแก้ไข'], ['A12.2', 'รายละเอียดแผน — ส่งกลับแก้ไข เห็นเหตุผล กดแก้ไขไป S19', 'รายละเอียดแผน — ส่งกลับแก้ไข เห็นเหตุผล กดแก้ไขไป S19']] },
    { name: 'A13 กบค. ตรวจแผนของกองอื่น', items: [['A13.1', 'กบค. — รายการแผนทุกหน่วยงาน สร้างแผนได้ แผนหน่วยงานอื่นดูอย่างเดียว', 'กบค. — รายการแผนทุกหน่วยงาน สร้างแผนได้ แผนหน่วยงานอื่นดูอย่างเดียว'], ['A13.2', 'รายการแผน — กดตัวกรอง แผงตัวกรอง เขต หน่วยงานหน้างาน (กบค.)', 'รายการแผน — กดตัวกรอง แผงตัวกรอง เขต หน่วยงานหน้างาน (กบค.)'], ['A13.3', 'กบค. — รายละเอียดแผนของหน่วยงานอื่น ดูอย่างเดียว', 'กบค. — รายละเอียดแผนของหน่วยงานอื่น ดูอย่างเดียว']] },
    { name: 'A14 กองอื่นเห็นเฉพาะแผนของกองตัวเอง', items: [['A14.1', 'กปส. — รายการแผน เห็นเฉพาะแผนของ กปส. สร้างแผนได้', 'กปส. — รายการแผน เห็นเฉพาะแผนของ กปส. สร้างแผนได้'], ['A14.2', 'กรย. — รายการแผน เห็นเฉพาะแผนของ กรย. สร้างแผนได้', 'กรย. — รายการแผน เห็นเฉพาะแผนของ กรย. สร้างแผนได้']] }] },
  { title: 'แก้ไขแผน', pages: [
    { name: 'หน้ารายการแผน', items: [['R.1', 'Interaction เมนู … แผนส่งกลับแก้ไข', 'เมนู "…" → แก้ไข'], ['R.9', 'Interaction เมนู … แผนอนุมัติแล้ว', 'แผนอนุมัติแล้ว — เมนู "…" → แก้ไข'], ['R.11', 'Interaction เมนู … แผนดำเนินการ แก้ได้เฉพาะไตรมาสที่ยังไม่เสร็จ', 'แผนดำเนินการแล้ว — เมนู "…" → แก้ไข ได้เฉพาะไตรมาสที่ยังไม่เสร็จ'], ['R.8', 'Status บันทึกสำเร็จ รออนุมัติ', 'บันทึกสำเร็จ — รออนุมัติ']] },
    { name: 'หน้าแก้ไขแผน', items: [['R.3', 'Filled แผนที่ถูกส่งกลับ', 'ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้'], ['R.10', 'Filled แผนที่อนุมัติแล้ว ต้องส่งอนุมัติใหม่', 'แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่'], ['R.4', 'Interaction เพิ่มยานพาหนะเข้าแผน ยังไม่จัดไตรมาส', 'เพิ่มยานพาหนะเข้าแผนในฟอร์มแก้ไข — ป้ายยังไม่จัดไตรมาส ปุ่มบันทึกและส่งอนุมัติกดไม่ได้'], ['R.6', 'Confirm ยืนยันการแก้ไข', 'ยืนยันการแก้ไขแผน'], ['R.5', 'Confirm ยืนยันการออก', '“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น'], ['R.7', 'Error บันทึกไม่สำเร็จ', 'บันทึกไม่สำเร็จ']] }] },
  { title: 'ลบแผน', pages: [
    { name: 'หน้ารายการแผน', items: [['S.1', 'Interaction เมนู … แผนส่งกลับแก้ไข มีลบ', 'เมนู "…" → ลบ ในหน้า List'], ['S.2', 'Confirm ยืนยันการลบแผน', 'ยืนยันการลบแผน ในหน้า List'], ['S.3', 'Status ลบสำเร็จ', 'ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)']] },
    { name: 'หน้ารายละเอียดแผน', items: [['S.5', 'Confirm ยืนยันการลบแผน', 'ยืนยันการลบแผน ในหน้า Detail']] }] },
  { title: 'อนุมัติแผน', pages: [
    { name: 'หน้าแผนรออนุมัติ', items: [['B.1', 'Filled แท็บรออนุมัติ', 'รายการแผนรออนุมัติ'], ['B.10', 'Filled แท็บอนุมัติแล้ว', 'แท็บอนุมัติแล้ว — แผนที่อนุมัติไปแล้ว'], ['B.11', 'Filled แท็บส่งกลับแก้ไข', 'แท็บส่งกลับแก้ไข — แผนที่ส่งกลับรอผู้สร้างแก้'], ['B.8', 'Status ส่งกลับแล้ว', 'ส่งกลับแล้ว']] },
    { name: 'หน้าพิจารณาแผน', items: [['B.2', 'Default ผลการพิจารณายังไม่เลือก', 'รายละเอียดแผน — ผลการพิจารณา ยังไม่เลือก'], ['B.5', 'Interaction เลือกส่งกลับแก้ไข', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น'], ['B.6', 'Error Validation Field ไม่ระบุเหตุผล', 'ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus'],
      ['B.3', 'Confirm ยืนยันอนุมัติ', 'อนุมัติ — ยืนยันอนุมัติแผน'], ['B.7', 'Confirm ยืนยันส่งกลับ', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ'], ['B.4', 'Status อนุมัติแล้ว', 'อนุมัติแผนสำเร็จ'], ['B.9', 'Interaction อะไหล่แท็บไตรมาส 2', 'อะไหล่ในแผน — เปิดแท็บไตรมาส 2'], ['B.12', 'Empty แผนนี้ไม่มีอะไหล่ที่ต้องเบิก', 'อะไหล่ในแผน — ทุกคันเลือกไม่เบิกอะไหล่ แผนนี้ไม่มีอะไหล่ที่ต้องเบิก']] }] }
];
return {
  id: 'plan', title: FEATURE_TITLE, page: ['แผนบำรุงรักษา'],
  doc: '32-บำรุงรักษา-feature-แผนบำรุงรักษา-สำหรับ-dev.md',
  scenarios: ['S1', 'S2', 'S19', 'S20', 'S21'],
  fjDir: 'flow-maintainance-feature', fjBoard: 'board-maintainance-feature',   // ชื่อเดิมก่อนมีหลาย Feature
  screens: LIST_OVERRIDE, toasts: FEATURE_TOASTS, happy: HAPPY, journeys: FEATURE
};
})());


/* ---------- features/trip.js ---------- */
/* ============================================================================
   features/trip.js — Feature แผนเดินทาง (S6 S7 S8 S9 S25) · 17 พ.ย. 2569
   เอกสาร: Diagram/01-บำรุงรักษาตามวาระ/33-บำรุงรักษา-feature-แผนเดินทาง-สำหรับ-dev.md
   รูปแบบเดียวกับ features/plan.js (หัวไฟล์นั้นอธิบายทุกฟิลด์) · จอทุกจอมาจากฟังก์ชันจอเดิมของ maintainance-plugin/screens.js
   รหัสบล็อกตาม BLOCK_OF: S6 = E · S7 = F · S8 = G · S9 = H · S25 = X
   18 พ.ย. 2569 ย้ายฐาน origin ee11614: E.19 popup เพิ่มได้ทุกคันที่ยังไม่อยู่ในแผน (R104) · X.2 เมนูมีดำเนินการบำรุงรักษา (R67) · G.4 G.5 ผู้ดูแลยานพาหนะ (R89)
     · เพิ่ม E.26 (ทุกคันปิดงานแล้ว) · F.9 F.10 (แท็บอนุมัติแล้ว/ส่งกลับแก้ไข) · X.11 X.12 (นำกลับมาบำรุงรักษา) · ชื่อจอใน SCENARIOS เป็นช่องสุดท้ายของ case กันรหัสชี้ผิดจอ
   จอเดิม 55 จอ ไม่สร้าง 4 จอ (หัวข้อ 1 ของไฟล์ 33):
     toast เต็มหน้า 2 จอ  E.18 (ส่งอนุมัติใหม่แล้ว · หน้าตาเท่า E.13) · F.8 (ส่งกลับแล้ว · รายการรออนุมัติเหลือใบอื่น)
     หน้าตาซ้ำ 2 จอ      E.25 = E.12 (tripForm ตัวเลือกเดียวกันทุกตัว) · X.9 = X.8 (moveQuarter ไตรมาส 2 ตัวเลือกเดียวกัน)
   ============================================================================ */
MF_FEATURES.push((() => {
/* toast ของ feature (ข้อความลอกจาก notify() ใน screens.js) · page/when = ป้ายบอกว่าแสดงที่ไหน เมื่อไหร่ */
const TOASTS = {
  S1: { text: 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว', page: 'หน้าไตรมาส', when: 'ยืนยันการสร้างแผนเดินทางสำเร็จ (ดำเนินการเอง หรือจ้างดำเนินการ)', was: 'E.13 E.15 H.7' },
  S2: { text: 'ส่งแผนเดินทางให้ผู้อนุมัติใหม่แล้ว', page: 'หน้าไตรมาส', when: 'ส่งอนุมัติใหม่สำเร็จ', was: 'E.18' },
  S3: { text: 'อนุมัติแผนเดินทางสำเร็จ', page: 'หน้าตรวจสอบแผนเดินทาง', when: 'ยืนยันอนุมัติสำเร็จ', was: 'F.4' },
  S4: { text: 'ส่งแผนเดินทางกลับให้ผู้สร้างแผนเดินทางแก้ไขแล้ว', page: 'หน้าแผนเดินทางรออนุมัติ', when: 'ยืนยันส่งกลับสำเร็จ', was: 'F.8' },
  Q1: { text: 'เพิ่มยานพาหนะเข้า' + NOW_Q + ' สำเร็จ', page: 'หน้าไตรมาส', when: 'เพิ่มยานพาหนะเข้าไตรมาสสำเร็จ', was: 'E.20' },
  Q2: { text: 'เอายานพาหนะออกจาก' + NOW_Q + ' สำเร็จ', page: 'หน้าไตรมาส', when: 'ยืนยันเอายานพาหนะออกจากไตรมาส', was: 'E.23' },
  M1: { text: MOVE_TOAST, page: 'หน้าไตรมาส', when: 'ยืนยันย้ายยานพาหนะไปไตรมาสอื่นสำเร็จ', was: 'X.7' },
  M2: { text: MAINT_TOAST(), page: 'หน้าไตรมาส', when: 'ยืนยันนำยานพาหนะกลับมาบำรุงรักษาในไตรมาสเดิมสำเร็จ', was: 'X.12' }   // 18 พ.ย. 2569 ฐาน origin (R67)
};

/* Happy flow: จอผลลัพธ์ที่จอเดิมไม่ได้สร้างในชุดทุกเคส (E.18 แปลงเป็น toast S2) ⇒ ทำเป็น H: ด้วยฟังก์ชันจอและตัวเลือกเดียวกับจอเดิม */
const SCREENS = {
  'H:resubmit': async () => { const s = await tripList('S6 ส่งอนุมัติใหม่', { trips: [Object.assign(tripAs(TRIP_1, 'review'), { d1: '10/11/2569', d2: '14/11/2569', works: {} })] }); notify(s, TOASTS.S2.text); return s; }
};

/* [รหัสจอ, คำอธิบายขั้น, ชื่อหน้า] journey ละ 1 รายการ เรียงตาม JOURNEYS */
const HAPPY = [
  [['E.1', 'เมนู … ดูรายละเอียดแผนที่อนุมัติแล้ว', 'หน้ารายการแผน', 'รายการแผน — เมนู "…" ดูรายละเอียดแผนที่อนุมัติแล้ว'], ['E.2', 'กดไปหน้าไตรมาส 1', 'หน้ารายละเอียดแผน', 'รายละเอียดแผน — กดไปหน้าไตรมาส 1'],
    ['E.3', 'ยังไม่มีแผนเดินทาง กดสร้างแผนเดินทาง', 'หน้าไตรมาส', 'หน้าไตรมาส 1 — ยังไม่มีแผนเดินทาง'], ['E.4', 'ฟอร์มสร้างแผนเดินทาง', 'หน้าสร้างแผนเดินทาง', 'ฟอร์มสร้างแผนเดินทาง (ว่าง)'],
    ['E.10', 'เลือกช่วงวันเดินทาง', 'หน้าสร้างแผนเดินทาง', 'เลือกช่วงวันเดินทาง'], ['E.5', 'เพิ่มยานพาหนะ', 'หน้าสร้างแผนเดินทาง', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะทุกคันของไตรมาส'], ['E.6', 'เพิ่มยานพาหนะแล้ว', 'หน้าสร้างแผนเดินทาง', 'เพิ่มยานพาหนะแล้ว — สถานที่ตั้งต้นสำนักงานที่ยานพาหนะอยู่'],
    ['E.12', 'กรอกครบ กดยืนยัน', 'หน้าสร้างแผนเดินทาง', 'กรอกครบ'], ['E.13', 'สร้างแผนเดินทางสำเร็จ รออนุมัติ', 'หน้าไตรมาส', 'สร้างแผนเดินทางสำเร็จ — กลับหน้าไตรมาส 1 แสดงแผนเดินทางใหม่ (รออนุมัติ)']],
  [['F.1', 'แผนเดินทางรออนุมัติ', 'หน้าแผนเดินทางรออนุมัติ', 'รายการแผนเดินทางรออนุมัติ'], ['F.2', 'ตรวจสอบแผนเดินทาง', 'หน้าตรวจสอบแผนเดินทาง', 'รายละเอียดแผนเดินทาง — ผลการพิจารณา ยังไม่เลือก'],
    ['F.3', 'ยืนยันอนุมัติ', 'หน้าตรวจสอบแผนเดินทาง', 'อนุมัติ — ยืนยันอนุมัติแผนเดินทาง'], ['F.4', 'อนุมัติสำเร็จ', 'หน้าตรวจสอบแผนเดินทาง', 'อนุมัติแผนเดินทางสำเร็จ']],
  [['E.16', 'แผนเดินทางถูกส่งกลับแก้ไข', 'หน้าไตรมาส', 'แผนเดินทางถูกส่งกลับแก้ไข'], ['E.17', 'แก้ไขแผนเดินทาง กดส่งอนุมัติใหม่', 'หน้าแก้ไขแผนเดินทาง', 'แก้ไขแผนเดินทางที่ถูกส่งกลับ'], ['H:resubmit', 'ส่งอนุมัติใหม่สำเร็จ', 'หน้าไตรมาส']],
  [['G.1', 'มีแจ้งเตือนใหม่', 'หน้าแผนเดินทางบำรุงรักษา', 'กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)'], ['G.2', 'เปิดแผงแจ้งเตือน', 'หน้าแผนเดินทางบำรุงรักษา', 'กรย. — เปิดแผงแจ้งเตือน'], ['G.3', 'ดูแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง', 'กรย. — แผนเดินทาง ดูอย่างเดียว (ยานพาหนะทุกคันในใบ)']],
  [['H.1', 'เลือกจ้างดำเนินการ', 'หน้าสร้างแผนเดินทาง', 'เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น'], ['H.2', 'เลือกผู้รับจ้าง', 'หน้าสร้างแผนเดินทาง', 'เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด'], ['H.3', 'เพิ่มยานพาหนะ', 'หน้าสร้างแผนเดินทาง', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้'],
    ['H.6', 'กรอกครบ กดยืนยัน', 'หน้าสร้างแผนเดินทาง', 'กรอกครบ'], ['H.7', 'สร้างแผนเดินทางจ้างสำเร็จ รออนุมัติ', 'หน้าไตรมาส', 'ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)']],
  [['E.19', 'popup เพิ่มยานพาหนะที่ยังไม่อยู่ในแผน', 'หน้าไตรมาส', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะที่ยังไม่อยู่ในแผน เพิ่มได้ทุกคัน'], ['E.20', 'เพิ่มเข้าไตรมาสสำเร็จ', 'หน้าไตรมาส', 'เพิ่มยานพาหนะเข้าไตรมาสแล้ว']],
  [['X.1', 'ยานพาหนะบำรุงรักษาไม่ได้', 'หน้าไตรมาส', 'หน้าไตรมาส 1 — ยานพาหนะที่บำรุงรักษาไม่ได้ ป้ายบำรุงรักษาไม่ได้'], ['X.2', 'เมนู … ดำเนินการบำรุงรักษา หรือ ย้ายไปไตรมาสอื่น', 'หน้าไตรมาส', 'กดปุ่ม … ของยานพาหนะ — ดำเนินการบำรุงรักษา หรือ ย้ายไปไตรมาสอื่น'], ['X.4', 'เลือกไตรมาส 2', 'หน้าไตรมาส', 'เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้'],
    ['X.6', 'ยืนยันการย้าย', 'หน้าไตรมาส', 'ยืนยันการย้ายยานพาหนะ'], ['X.7', 'ย้ายสำเร็จ', 'หน้าไตรมาส', 'ย้ายสำเร็จ — ไตรมาส 1 ไม่มียานพาหนะคันนี้แล้ว']]];

/* โครง Feature แบบตัว Z: journey → หน้า (เรียงตามทางเดิน 1 หน้าครั้งเดียวต่อ journey) → case · ตรงหัวข้อ 2 ของไฟล์ 33 (J1–J7)
   ฉากย่อยในหน้าสร้างแผนเดินทางใส่ชื่อฉากนำหน้าป้าย case · toast อยู่ในหน้าที่มันแสดง */
const JOURNEYS = [
  { title: 'ทำแผนเดินทาง', pages: [
    { name: 'หน้ารายการแผน', items: [['E.1', 'Interaction เมนู … แผนอนุมัติแล้ว', 'รายการแผน — เมนู "…" ดูรายละเอียดแผนที่อนุมัติแล้ว']] },
    { name: 'หน้ารายละเอียดแผน', items: [['E.2', 'Status อนุมัติแล้ว ปุ่มไปหน้าไตรมาส 1', 'รายละเอียดแผน — กดไปหน้าไตรมาส 1']] },
    { name: 'หน้าไตรมาส', items: [['E.3', 'Default ยังไม่มีแผนเดินทาง', 'หน้าไตรมาส 1 — ยังไม่มีแผนเดินทาง'], ['E.13', 'Filled แผนเดินทางรออนุมัติ 1 ใบ', 'สร้างแผนเดินทางสำเร็จ — กลับหน้าไตรมาส 1 แสดงแผนเดินทางใหม่ (รออนุมัติ)'], ['E.15', 'Disabled ยานพาหนะครบทุกคัน ปุ่มสร้างแผนเดินทางกดไม่ได้', 'แผนเดินทาง 2 ใบ — ยานพาหนะครบทุกคัน ปุ่มสร้างแผนเดินทางกดไม่ได้'], ['toast:S1']] },
    { name: 'หน้าสร้างแผนเดินทาง', items: [
      ['E.4', 'ข้อมูลแผนเดินทาง · Default ยังไม่กรอกข้อมูล', 'ฟอร์มสร้างแผนเดินทาง (ว่าง)'], ['E.10', 'ข้อมูลแผนเดินทาง · Interaction เลือกช่วงวันเดินทาง', 'เลือกช่วงวันเดินทาง'],
      ['E.5', 'ยานพาหนะ · Interaction popup เพิ่มยานพาหนะ', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะทุกคันของไตรมาส'], ['E.6', 'ยานพาหนะ · Filled เพิ่มยานพาหนะแล้ว', 'เพิ่มยานพาหนะแล้ว — สถานที่ตั้งต้นสำนักงานที่ยานพาหนะอยู่'],
      ['E.7', 'ยานพาหนะ · Interaction popup แก้ไขยานพาหนะในแผนเดินทาง', 'แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันเดินทาง'], ['E.24', 'ยานพาหนะ · Interaction เลือกวันดำเนินการ', 'เลือกวันดำเนินการ — ปฏิทินเลือกได้เฉพาะช่วงวันเดินทาง วันนอกช่วงกดไม่ได้'],
      ['E.8', 'ยานพาหนะ · Filled เอายานพาหนะออกจากแผนเดินทาง', 'กดไอคอนลบ — เอายานพาหนะออกจากแผนเดินทางนี้ (soft delete)'], ['E.9', 'ยานพาหนะ · Interaction เพิ่มยานพาหนะอีกครั้ง', 'กดเพิ่มยานพาหนะอีกครั้ง — ยานพาหนะที่เอาออกกลับมาเลือกได้'],
      ['E.14', 'ยานพาหนะ · Interaction ใบถัดไป ยานพาหนะในใบอื่นเลือกไม่ได้', 'สร้างแผนเดินทางใบถัดไป — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้'],
      ['E.11', 'ยืนยัน · Error Validation Field', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus'], ['E.12', 'ยืนยัน · Filled กรอกครบ วันดำเนินการรายคัน', 'กรอกครบ']] }] },
  { title: 'อนุมัติแผนเดินทาง', pages: [
    { name: 'หน้าแผนเดินทางรออนุมัติ', items: [['F.1', 'Filled แท็บรออนุมัติ', 'รายการแผนเดินทางรออนุมัติ'], ['F.9', 'Filled แท็บอนุมัติแล้ว', 'แท็บอนุมัติแล้ว — แผนเดินทางที่อนุมัติไปแล้ว'], ['F.10', 'Filled แท็บส่งกลับแก้ไข', 'แท็บส่งกลับแก้ไข — แผนเดินทางที่ส่งกลับรอผู้สร้างแก้'], ['toast:S4']] },
    { name: 'หน้าตรวจสอบแผนเดินทาง', items: [['F.2', 'Default ผลการพิจารณายังไม่เลือก', 'รายละเอียดแผนเดินทาง — ผลการพิจารณา ยังไม่เลือก'], ['F.5', 'Interaction เลือกส่งกลับแก้ไข', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น'], ['F.6', 'Error Validation Field ไม่ระบุเหตุผล', 'ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus'],
      ['F.3', 'Confirm ยืนยันอนุมัติ', 'อนุมัติ — ยืนยันอนุมัติแผนเดินทาง'], ['F.7', 'Confirm ยืนยันส่งกลับ', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ'], ['F.4', 'Status อนุมัติแล้ว', 'อนุมัติแผนเดินทางสำเร็จ'], ['toast:S3']] }] },
  { title: 'แก้ไขแผนเดินทางที่ถูกส่งกลับ', pages: [
    { name: 'หน้าไตรมาส', items: [['E.16', 'Status แผนเดินทางส่งกลับแก้ไข', 'แผนเดินทางถูกส่งกลับแก้ไข'], ['toast:S2']] },
    { name: 'หน้าแก้ไขแผนเดินทาง', items: [['E.17', 'Filled แผนเดินทางที่ถูกส่งกลับ', 'แก้ไขแผนเดินทางที่ถูกส่งกลับ']] }] },
  { title: 'รับแจ้งเตือนแผนเดินทาง', pages: [
    { name: 'หน้าแผนเดินทางบำรุงรักษา', items: [['G.1', 'Interaction มีแจ้งเตือนใหม่ ของ กรย.', 'กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)'], ['G.2', 'Interaction แผงแจ้งเตือน ของ กรย.', 'กรย. — เปิดแผงแจ้งเตือน'], ['G.4', 'Interaction แผงแจ้งเตือน ของผู้ดูแลยานพาหนะ', 'ผู้ดูแลยานพาหนะ — เปิดแผงแจ้งเตือน']] },
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['G.3', 'Filled ดูอย่างเดียว ยานพาหนะทุกคันในใบ ของ กรย.', 'กรย. — แผนเดินทาง ดูอย่างเดียว (ยานพาหนะทุกคันในใบ)'], ['G.5', 'Filled ดูอย่างเดียว เฉพาะยานพาหนะที่ดูแล', 'ผู้ดูแลยานพาหนะ — แผนเดินทาง ดูอย่างเดียว (เฉพาะยานพาหนะที่ดูแล)']] }] },
  { title: 'แผนเดินทางจ้างดำเนินการ', pages: [
    { name: 'หน้าสร้างแผนเดินทาง', items: [['H.1', 'Interaction เลือกจ้างดำเนินการ ช่องผู้รับจ้างขึ้น', 'เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น'], ['H.2', 'Interaction รายชื่อผู้รับจ้าง', 'เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด'],
      ['H.3', 'Interaction popup เพิ่มยานพาหนะ ใบอื่นเลือกไม่ได้', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้'], ['H.4', 'Interaction popup แก้ไขยานพาหนะ ช่วงวันทำงาน', 'แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันทำงาน'], ['H.5', 'Error Validation Field', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus'], ['H.6', 'Filled กรอกครบ', 'กรอกครบ']] },
    { name: 'หน้าไตรมาส', items: [['H.7', 'Filled แผนเดินทางจ้างรออนุมัติ', 'ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)'], ['toast:S1']] }] },
  { title: 'เพิ่ม เอาออก แก้ไขยานพาหนะในไตรมาส', pages: [
    { name: 'หน้าไตรมาส', items: [['E.19', 'Interaction popup เพิ่มยานพาหนะที่ยังไม่อยู่ในแผน หน้าละ 10', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะที่ยังไม่อยู่ในแผน เพิ่มได้ทุกคัน'], ['E.20', 'Filled เพิ่มเข้าไตรมาสแล้ว', 'เพิ่มยานพาหนะเข้าไตรมาสแล้ว'], ['toast:Q1'],
      ['E.21', 'Interaction popup แก้ไขผู้ดูแลยานพาหนะและสถานที่', 'กดไอคอนแก้ไข — แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษา'], ['E.22', 'Confirm เอายานพาหนะออกจากไตรมาส', 'กดไอคอนลบ — ยืนยันเอายานพาหนะออกจากไตรมาส'], ['E.23', 'Filled เอาออกแล้ว', 'เอายานพาหนะออกจากไตรมาสแล้ว'], ['toast:Q2'], ['E.26', 'Disabled ทุกคันปิดงานแล้ว ปุ่มเพิ่มยานพาหนะกดไม่ได้', 'ทุกคันในไตรมาสปิดงานแล้ว (รวมบำรุงรักษาไม่ได้) — ปุ่มเพิ่มยานพาหนะกดไม่ได้']] }] },
  { title: 'ย้ายยานพาหนะไปไตรมาสอื่น', pages: [
    { name: 'หน้าไตรมาส', items: [['X.1', 'Status ยานพาหนะบำรุงรักษาไม่ได้', 'หน้าไตรมาส 1 — ยานพาหนะที่บำรุงรักษาไม่ได้ ป้ายบำรุงรักษาไม่ได้'], ['X.2', 'Interaction เมนู … ดำเนินการบำรุงรักษา หรือ ย้ายไปไตรมาสอื่น', 'กดปุ่ม … ของยานพาหนะ — ดำเนินการบำรุงรักษา หรือ ย้ายไปไตรมาสอื่น'], ['X.3', 'Interaction popup ยังไม่เลือกไตรมาส', 'popup ย้ายไปไตรมาสอื่น — ยังไม่เลือกไตรมาส'],
      ['X.4', 'Interaction เลือกไตรมาส 2 ปุ่มย้ายกดได้', 'เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้'], ['X.5', 'Interaction ไตรมาส 3 ไตรมาสก่อนหน้าเลือกไม่ได้', 'กรณีไตรมาส 3 — ไตรมาสก่อนหน้าและไตรมาสปัจจุบันเลือกไม่ได้'], ['X.6', 'Confirm ยืนยันการย้าย', 'ยืนยันการย้ายยานพาหนะ'],
      ['X.7', 'Filled ย้ายแล้ว ไตรมาส 1 ไม่มียานพาหนะคันนี้', 'ย้ายสำเร็จ — ไตรมาส 1 ไม่มียานพาหนะคันนี้แล้ว'], ['toast:M1'], ['X.8', 'Filled ไตรมาส 2 ยานพาหนะและอะไหล่ที่ย้ายมา', 'หน้าไตรมาส 2 — ยานพาหนะที่ย้ายมา ยังไม่มีแผนเดินทาง'], ['X.10', 'Disabled ไตรมาส 4 เมนูย้ายกดไม่ได้', 'ไตรมาส 4 — เมนูย้ายไปไตรมาสอื่นกดไม่ได้'],
      ['X.11', 'Confirm นำยานพาหนะกลับมาบำรุงรักษาในไตรมาสเดิม', 'เลือกดำเนินการบำรุงรักษา — ยืนยันนำยานพาหนะกลับมาบำรุงรักษาในไตรมาสเดิม'], ['X.12', 'Filled ดำเนินการบำรุงรักษาแล้ว รอเพิ่มเข้าแผนเดินทาง', 'ดำเนินการบำรุงรักษาแล้ว — ยานพาหนะกลับเป็นยังไม่มีแผนเดินทาง รอเพิ่มเข้าแผนเดินทาง'], ['toast:M2']] }] }
];

return {
  id: 'trip', title: 'แผนเดินทาง', page: ['แผนเดินทาง'],
  doc: '33-บำรุงรักษา-feature-แผนเดินทาง-สำหรับ-dev.md',
  scenarios: ['S6', 'S7', 'S8', 'S9', 'S25'],
  screens: SCREENS, toasts: TOASTS, happy: HAPPY, journeys: JOURNEYS
};
})());


/* ---------- features/job.js ---------- */
/* ============================================================================
   features/job.js — Feature งานบำรุงรักษารายคัน (S10 S23 S12 S13) · 17 พ.ย. 2569 · 18 พ.ย. 2569 ย้ายฐาน origin/main ee11614
   เอกสาร: Diagram/01-บำรุงรักษาตามวาระ/34-บำรุงรักษา-feature-งานรายคัน-สำหรับ-dev.md
   รูปแบบเดียวกับ features/plan.js (หัวไฟล์นั้นอธิบายทุกฟิลด์) · ไม่วาดจอเอง ใช้จอเดิมของ maintainance-plugin/screens.js ทุกจอ
   บล็อกจอเดิม (BLOCK_OF): S10 = I · S12 = K · S13 = L · S23 = V
   ฐาน origin (18 พ.ย. 2569): S14 ถูกตัด (R89) ⇒ journey ตรวจหลักฐานและประเมินความพึงพอใจ (M.*) หายทั้ง journey · ประเมินย้ายไป satisfaction-plugin (R105)
     · S13 รับทราบอย่างเดียว ไม่มี popup ยืนยัน (L.1–L.7 ความหมายใหม่ R89 R94 R114) · K.9 แจ้งผู้ดูแลยานพาหนะเมื่อผลน้ำมันไม่ผ่าน (R115)
     · S23 เป็นเส้นตรง V.1–V.22 ของ origin (ไม่มีเส้นทางย่อยแล้ว) map: V.4.1–3→V.4–V.6 · V.5.1–3→V.7–V.9 · V.6 V.7→V.10 V.11 · V.8.1–3→V.12–V.14 · V.9 V.10→V.15 V.16 · V.11.1–3→V.17–V.19 · V.12.1–2→V.20 V.21 · V.13→V.22
   จอที่ไม่สร้าง (หัวข้อ 1 ของไฟล์ 34):
     · toast เต็มหน้า I.28 (= I.1 + toast ส่งออกไฟล์สำเร็จ) ⇒ toast X1 ชิ้นเดียว
     · หน้าตาซ้ำ K.1 = I.13 (stepPage step 2 filled ค่าเดียวกัน) · K.2 = I.14 (tripDetail JOB_MIX + รอผลตรวจน้ำมัน + toast เดียวกัน)
   ============================================================================ */
MF_FEATURES.push((() => {
/* toast ของ feature (ข้อความลอกจาก notify() ของจอเดิมใน screens.js) · page/when = ป้ายบอกว่าแสดงที่ไหน เมื่อไหร่ · was = จอเดิมที่มี toast นี้ */
const TOASTS = {
  W1: { text: 'เริ่มงานบำรุงรักษาแล้ว', page: 'บันทึกงานรายคัน', when: 'กดเริ่มงาน เข้าสู่ Step 1', was: 'I.6 V.4' },
  W2: { text: 'บันทึกงานบำรุงรักษาสำเร็จ', page: 'รายละเอียดแผนเดินทาง', when: 'ปิดงานรายคันสำเร็จ', was: 'I.14 I.15 V.10 K.2' },
  W3: { text: 'บันทึกบำรุงรักษาไม่ได้แล้ว', page: 'รายละเอียดแผนเดินทาง', when: 'ยืนยันบำรุงรักษาไม่ได้สำเร็จ', was: 'I.20' },
  W4: { text: 'บันทึกเอกสาร Safety Inspection สำเร็จ', page: 'งานรายคัน', when: 'บันทึกเอกสาร Safety Inspection ภายหลังสำเร็จ', was: 'I.24' },
  X1: { text: 'ส่งออกไฟล์สำเร็จ', page: 'รายละเอียดแผนเดินทาง', when: 'ส่งออกแผนเดินทางสำเร็จ', was: 'I.28' },
  V1: { text: 'ส่งตรวจงานแล้ว', page: 'งานรายคัน', when: 'ผู้รับจ้างยืนยันส่งตรวจงานสำเร็จ', was: 'V.16' },
  K1: { text: 'บันทึกผลการทดสอบน้ำมันไฮดรอลิกสำเร็จ', page: 'งานรายคัน', when: 'บันทึกผลการทดสอบน้ำมันไฮดรอลิกสำเร็จ', was: 'K.7' },
  L1: { text: 'รับทราบผลการบำรุงรักษา ' + TRIP_CARS[JOB_I][0] + ' แล้ว', page: 'ผลการบำรุงรักษารายคัน', when: 'กดรับทราบสำเร็จ', was: 'L.5' }
};

/* ช่อง "รวม (บาท)" ก่อนกรอก (I.9 I.10 I.19) ใช้จอเดิม State Readonly ค่า 0 — ผู้ใช้เคาะ 17 พ.ย. 2569 "อ่านอย่างเดียว แบบจอเดิม" (เดิมปลั๊กอินปรับเป็น Default ยกเลิกแล้ว) */

/* Happy flow — จอผลลัพธ์ที่จอเดิมถูกแปลงเป็น toast (I.28) ทำเป็น H: ให้เห็นผลในภาพเดียว (เรียกฟังก์ชันจอเดิมด้วยค่าเดียวกับ I.28) */
const SCREENS = {
  'H:export': async () => { const s = await tripDetail('S10 ส่งออกแผนเดินทางสำเร็จ', {}); notify(s, TOASTS.X1.text); return s; }
};
const HAPPY = [
  [['I.1', 'รายละเอียดแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน ตรวจแล้ว 0/4'], ['I.5', 'งานรายคัน กดเริ่มงาน', 'หน้างานรายคัน', 'หน้างานรายคัน — ยังไม่เริ่ม'],
    ['I.6', 'Step 1 ตรวจสภาพก่อนบำรุงรักษา', 'หน้าบันทึกงานรายคัน', 'กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา สถานะอยู่ระหว่างบำรุงรักษา'], ['I.8', 'ตรวจรายการและลงนามครบ', 'หน้าบันทึกงานรายคัน', 'ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้'],
    ['I.9', 'Step 2 สรุปงานก่อนปิดงาน', 'หน้าบันทึกงานรายคัน', 'ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน'], ['I.13', 'กรอกผลงานครบ กดปิดงาน', 'หน้าบันทึกงานรายคัน', 'กรอกผลงานครบ'],
    ['I.14', 'ปิดงานสำเร็จ', 'หน้ารายละเอียดแผนเดินทาง', 'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง เสร็จสิ้น + รอผลตรวจน้ำมัน']],
  [['I.1', 'รายละเอียดแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน ตรวจแล้ว 0/4'], ['I.27', 'กดส่งออก เลือกรูปแบบไฟล์', 'หน้ารายละเอียดแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง — กดส่งออก — popup รูปแบบไฟล์'],
    ['H:export', 'ส่งออกไฟล์สำเร็จ', 'หน้ารายละเอียดแผนเดินทาง']],   // ไฟล์ PDF ไม่ใส่ใน happy: ป้ายขั้นทำให้ชื่อเฟรมไม่ขึ้นต้น " — ไฟล์ PDF" ⇒ ไม่ได้ข้อยกเว้นขนาด A4 (R32)
  [['I.25', 'เมนู … ของยานพาหนะในแผนจ้าง', 'หน้ารายละเอียดแผนเดินทาง', 'แผนจ้างดำเนินการ — หน้ารายละเอียดแผนเดินทาง กดปุ่ม … ของยานพาหนะ'], ['I.26', 'Step 2 ปิดงานแทนผู้รับจ้าง', 'หน้าบันทึกงานรายคัน', 'แผนจ้างดำเนินการ — Step 2 สรุปงานก่อนปิดงาน หน่วยงานปิดงานแทนผู้รับจ้าง']],
  [['V.1', 'รายละเอียดแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง มุมผู้รับจ้าง — ยังไม่เริ่มงาน ตรวจแล้ว 0/6'], ['V.3', 'งานรายคัน กดเริ่มงาน', 'หน้างานรายคัน', 'หน้างานรายคัน ยังไม่เริ่ม — อะไหล่ตามแผนดูอย่างเดียว'],
    ['V.4', 'Step 1 ตรวจสภาพก่อนบำรุงรักษา', 'หน้าบันทึกงานรายคัน', 'กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา วันดำเนินการอ่านอย่างเดียว'], ['V.6', 'ตรวจรายการและลงนามครบ', 'หน้าบันทึกงานรายคัน', 'ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้'],
    ['V.7', 'Step 2 สรุปงานก่อนปิดงาน', 'หน้าบันทึกงานรายคัน', 'ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน ไม่มีค่าใช้จ่ายและราคา'], ['V.9', 'กรอกผลงานครบ กดปิดงาน', 'หน้าบันทึกงานรายคัน', 'กรอกผลงานครบ'],
    ['V.10', 'ปิดงานสำเร็จ', 'หน้ารายละเอียดแผนเดินทาง', 'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง ดำเนินการบำรุงรักษาแล้ว ตรวจแล้ว 1/6'], ['V.11', 'งานรายคัน กดส่งตรวจงาน', 'หน้างานรายคัน', 'หน้างานรายคัน ดำเนินการบำรุงรักษาแล้ว — ปุ่มแก้ไขงาน ส่งตรวจงาน'],
    ['V.15', 'ยืนยันส่งตรวจงาน', 'หน้างานรายคัน', 'กดส่งตรวจงาน — ยืนยันส่งตรวจงาน'], ['V.16', 'ส่งตรวจงานแล้ว รอตรวจรับ', 'หน้างานรายคัน', 'ส่งตรวจงานแล้ว — รอตรวจรับ']],
  [['I.14', 'ป้ายรอผลตรวจน้ำมัน', 'หน้ารายละเอียดแผนเดินทาง', 'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง เสร็จสิ้น + รอผลตรวจน้ำมัน'], ['K.3', 'เมนู … ดูรายละเอียด', 'หน้ารายละเอียดแผนเดินทาง', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด'],
    ['K.4', 'งานรายคัน ส่วนผลการทดสอบ', 'หน้างานรายคัน', 'หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง'], ['K.6', 'เลือกผลและแนบไฟล์', 'หน้างานรายคัน', 'เลือกผล + แนบไฟล์ (ถ้ามี)'], ['K.7', 'บันทึกผลสำเร็จ', 'หน้างานรายคัน', 'บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง']],
  [['L.6', 'แผงแจ้งเตือน ปิดงานแล้ว รอรับทราบ', 'หน้าผลการบำรุงรักษารอรับทราบ', 'เปิดแผงแจ้งเตือน — ปิดงานแล้ว รอรับทราบ'], ['L.1', 'รายการรอรับทราบ', 'หน้าผลการบำรุงรักษารอรับทราบ', 'รายการผลการบำรุงรักษารอรับทราบ — มีแจ้งเตือนใหม่'],
    ['L.2', 'ผลรายคัน กดรับทราบ', 'หน้าผลการบำรุงรักษารายคัน', 'ผลการบำรุงรักษารายคัน — ปุ่มรับทราบกดได้'], ['L.5', 'รับทราบแล้ว', 'หน้าผลการบำรุงรักษารายคัน', 'รับทราบแล้ว — ป้ายรับทราบแล้ว ปุ่มประเมินความพึงพอใจ'], ['L.4', 'กลับหน้ารายการ รับทราบแล้ว', 'หน้าผลการบำรุงรักษารอรับทราบ', 'กลับหน้ารายการ — คันที่รับทราบแล้วสถานะรับทราบแล้ว']]
];

/* journey → หน้า (เรียงตามทางเดิน 1 หน้าครั้งเดียวต่อ journey) → case · ตรงหัวข้อ 2 ของไฟล์ 34 (J1–J6 · J7 S14 ตัดแล้ว)
   หน้าบันทึกงานรายคัน = หน้าเดียวมี stepper 2 ขั้น ⇒ ใส่ชื่อขั้นนำหน้าป้าย case */
const JOURNEYS = [
  { title: 'บันทึกงานรายคัน ดำเนินการเอง', pages: [
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['I.1', 'Default ยังไม่เริ่มงาน ตรวจแล้ว 0/4', 'หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน ตรวจแล้ว 0/4'], ['I.2', 'Interaction เมนู … ของยานพาหนะ', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ลบ'],
      ['I.3', 'Interaction แก้ไขยานพาหนะในแผนเดินทาง', 'เมนูแก้ไข — แก้ไขยานพาหนะในแผนเดินทาง ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ'], ['I.4', 'Confirm เอายานพาหนะออกจากแผนเดินทาง', 'เมนูลบ — ยืนยันเอายานพาหนะออกจากแผนเดินทาง'],
      ['I.14', 'Status ปิดงานแล้ว รอผลตรวจน้ำมัน', 'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง เสร็จสิ้น + รอผลตรวจน้ำมัน'], ['I.15', 'Status ปิดงานแล้ว ไม่เก็บตัวอย่างน้ำมัน', 'ปิดงานสำเร็จ — เปลี่ยนน้ำมันอย่างเดียว ไม่มีป้ายรอผลตรวจน้ำมัน'], ['I.20', 'Status บำรุงรักษาไม่ได้ ตรวจแล้ว 0/3', 'บันทึกบำรุงรักษาไม่ได้แล้ว — กลับหน้ารายละเอียดแผนเดินทาง ตรวจแล้ว 0/3'],
      ['toast:W2'], ['toast:W3']] },
    { name: 'หน้างานรายคัน', items: [['I.5', 'Default ยังไม่เริ่มงาน', 'หน้างานรายคัน — ยังไม่เริ่ม'], ['I.16', 'Interaction บำรุงรักษาไม่ได้ ระบุสาเหตุแล้ว', 'บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน'], ['I.17', 'Error Validation Field บำรุงรักษาไม่ได้ ยังไม่ระบุสาเหตุ', 'บำรุงรักษาไม่ได้ — ยังไม่ระบุสาเหตุ'],
      ['I.21', 'Status เสร็จสิ้น งานที่ปิดแล้ว', 'ดูงานที่ปิดแล้ว — เสร็จสิ้น'], ['I.23', 'Interaction เพิ่มเอกสาร Safety Inspection ภายหลัง', 'หน้างานรายคัน — เพิ่มเอกสาร Safety Inspection ภายหลัง'], ['I.24', 'Filled บันทึกเอกสาร Safety Inspection แล้ว', 'บันทึกเอกสาร Safety Inspection สำเร็จ'], ['toast:W4']] },
    { name: 'หน้าบันทึกงานรายคัน', items: [
      ['I.6', 'Step 1 · Default ตรวจสภาพก่อนบำรุงรักษา', 'กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา สถานะอยู่ระหว่างบำรุงรักษา'], ['I.35', 'Step 1 · Interaction แก้วันดำเนินการของคันนี้', 'Step 1 — แก้วันดำเนินการของคันนี้ (ปฏิทิน เลือกได้ในช่วงวันเดินทาง)'], ['I.7', 'Step 1 · Interaction ลงนามการตรวจสภาพ', 'กดเซ็นลงนาม — ลงนามการตรวจสภาพ'],
      ['I.8', 'Step 1 · Filled ตรวจรายการและลงนามครบ', 'ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้'], ['I.33', 'Step 1 · Default แบบตรวจรถพ่วงฉีดน้ำ', 'ยานพาหนะประเภทรถพ่วงฉีดน้ำ — Step 1 ใช้แบบตรวจสภาพรถพ่วงฉีดน้ำ'], ['I.34', 'Step 1 · Filled รถพ่วงฉีดน้ำ ลงนามครบ', 'ยานพาหนะประเภทรถพ่วงฉีดน้ำ — ตรวจรายการและลงนามครบ'],
      ['I.18', 'Step 1 · Interaction บำรุงรักษาไม่ได้ คืนอะไหล่ตามแผนทั้งหมด', 'บำรุงรักษาไม่ได้ระหว่าง Step 1 — คืนอะไหล่ตามแผนทั้งหมด'], ['toast:W1'],
      ['I.9', 'Step 2 · Default สรุปงานก่อนปิดงาน', 'ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน'], ['I.10', 'Step 2 · Error Validation Field', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus'], ['I.11', 'Step 2 · Interaction ปฏิทินวันที่เปลี่ยนน้ำมันครั้งล่าสุด', 'เลือกวันที่เปลี่ยนน้ำมันครั้งล่าสุด — ปฏิทิน'],
      ['I.12', 'Step 2 · Interaction งบที่ตัด หน่วยงานอื่น ระบุศูนย์ต้นทุน', 'เลือกงบที่ตัด หน่วยงานอื่น — ระบุศูนย์ต้นทุน'], ['I.22', 'Step 2 · Filled แนบเอกสาร Safety Inspection', 'Step 2 — แนบเอกสาร Safety Inspection (ถ้ามี)'], ['I.13', 'Step 2 · Filled กรอกผลงานครบ', 'กรอกผลงานครบ'],
      ['I.19', 'Step 2 · Interaction บำรุงรักษาไม่ได้ อะไหล่ที่ใช้ไปแล้ว', 'บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว']] }] },
  { title: 'ส่งออกแผนเดินทาง', pages: [
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['I.27', 'Interaction popup รูปแบบไฟล์', 'หน้ารายละเอียดแผนเดินทาง — กดส่งออก — popup รูปแบบไฟล์'], ['toast:X1']] },
    { name: 'ไฟล์ PDF แผนเดินทาง', items: [['I.29', 'ไฟล์ PDF หน้า 1 · Filled รายละเอียดแผนเดินทางและยานพาหนะ', 'ไฟล์ PDF หน้า 1 — รายละเอียดแผนเดินทาง และยานพาหนะ'], ['I.30', 'ไฟล์ PDF หน้า 2 · Filled อะไหล่ของแผนเดินทาง', 'ไฟล์ PDF หน้า 2 — อะไหล่ของแผนเดินทาง']] },
    { name: 'ไฟล์ Excel แผนเดินทาง', items: [['I.31', 'ไฟล์ Excel ชีตยานพาหนะ · Filled ยานพาหนะในแผนเดินทาง', 'ไฟล์ Excel — ชีตยานพาหนะในแผนเดินทาง'], ['I.32', 'ไฟล์ Excel ชีตอะไหล่ · Filled อะไหล่ของแผนเดินทาง', 'ไฟล์ Excel — ชีตอะไหล่ของแผนเดินทาง']] }] },
  { title: 'หน่วยงานปิดงานแทนผู้รับจ้าง', pages: [
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['I.25', 'Interaction เมนู … ของยานพาหนะ แผนจ้างดำเนินการ', 'แผนจ้างดำเนินการ — หน้ารายละเอียดแผนเดินทาง กดปุ่ม … ของยานพาหนะ']] },
    { name: 'หน้าบันทึกงานรายคัน', items: [['I.26', 'Step 2 · Filled ปิดงานแทนผู้รับจ้าง', 'แผนจ้างดำเนินการ — Step 2 สรุปงานก่อนปิดงาน หน่วยงานปิดงานแทนผู้รับจ้าง'], ['toast:W2']] }] },
  { title: 'ผู้รับจ้างบันทึกงานและส่งตรวจ', pages: [
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['V.1', 'Default ยังไม่เริ่มงาน ตรวจแล้ว 0/6', 'หน้ารายละเอียดแผนเดินทาง มุมผู้รับจ้าง — ยังไม่เริ่มงาน ตรวจแล้ว 0/6'], ['V.2', 'Interaction เมนู … ดูรายละเอียดอย่างเดียว', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียดอย่างเดียว ไม่มีแก้ไข ลบ'],
      ['V.10', 'Status ดำเนินการบำรุงรักษาแล้ว ตรวจแล้ว 1/6', 'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง ดำเนินการบำรุงรักษาแล้ว ตรวจแล้ว 1/6'], ['V.22', 'Status งานรายคันระหว่างทาง ตรวจแล้ว 2/6', 'หน้ารายละเอียดแผนเดินทาง — สถานะงานรายคันระหว่างทาง ตรวจแล้ว 2/6'], ['toast:W2']] },
    { name: 'หน้างานรายคัน', items: [['V.3', 'Default ยังไม่เริ่มงาน อะไหล่ตามแผนดูอย่างเดียว', 'หน้างานรายคัน ยังไม่เริ่ม — อะไหล่ตามแผนดูอย่างเดียว'], ['V.17', 'Interaction บำรุงรักษาไม่ได้ ระบุสาเหตุ', 'บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน'],
      ['V.11', 'Status ดำเนินการบำรุงรักษาแล้ว ปุ่มแก้ไขงาน ส่งตรวจงาน', 'หน้างานรายคัน ดำเนินการบำรุงรักษาแล้ว — ปุ่มแก้ไขงาน ส่งตรวจงาน'], ['V.12', 'Interaction แก้จำนวนอะไหล่ที่ใช้จริง', 'กดไอคอนแก้ไขอะไหล่ — แก้จำนวนที่ใช้จริง'], ['V.13', 'Interaction popup เพิ่มอะไหล่ที่ใช้จริง', 'กดเพิ่มอะไหล่ — popup เพิ่มอะไหล่ที่ใช้จริง'],
      ['V.14', 'Confirm ลบอะไหล่', 'กดไอคอนลบอะไหล่ — ยืนยันเอาออก'], ['V.15', 'Confirm ยืนยันส่งตรวจงาน', 'กดส่งตรวจงาน — ยืนยันส่งตรวจงาน'], ['V.16', 'Status รอตรวจรับ', 'ส่งตรวจงานแล้ว — รอตรวจรับ'], ['V.19', 'Status แจ้งบำรุงรักษาไม่ได้', 'หน้างานรายคัน แจ้งบำรุงรักษาไม่ได้ — ปุ่มแก้ไขงาน ส่งตรวจงาน'],
      ['V.20', 'Status ถูกส่งกลับแก้ไข คันที่ปิดงานไว้', 'ถูกส่งกลับแก้ไข — คันที่ปิดงานไว้'], ['V.21', 'Status ถูกส่งกลับแก้ไข คันที่แจ้งบำรุงรักษาไม่ได้', 'ถูกส่งกลับแก้ไข — คันที่แจ้งบำรุงรักษาไม่ได้'], ['toast:V1']] },
    { name: 'หน้าบันทึกงานรายคัน', items: [['V.4', 'Step 1 · Default วันดำเนินการอ่านอย่างเดียว', 'กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา วันดำเนินการอ่านอย่างเดียว'], ['V.5', 'Step 1 · Interaction ลงนามการตรวจสภาพ', 'กดเซ็นลงนาม — ลงนามการตรวจสภาพ'], ['V.6', 'Step 1 · Filled ลงนามครบ', 'ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้'], ['toast:W1'],
      ['V.7', 'Step 2 · Default ไม่มีค่าใช้จ่ายและราคา', 'ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน ไม่มีค่าใช้จ่ายและราคา'], ['V.8', 'Step 2 · Error Validation Field', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus'], ['V.9', 'Step 2 · Filled กรอกผลงานครบ', 'กรอกผลงานครบ'],
      ['V.18', 'Step 2 · Interaction บำรุงรักษาไม่ได้ อะไหล่ที่ใช้ไปแล้ว', 'บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว']] }] },
  { title: 'บันทึกผลตรวจน้ำมันไฮโดรลิก', pages: [
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['K.3', 'Interaction เมนู … ของยานพาหนะที่รอผลตรวจน้ำมัน', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด'], ['K.8', 'Status น้ำมันไม่ผ่าน', 'กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน']] },
    { name: 'หน้างานรายคัน', items: [['K.4', 'Default ผลการทดสอบยังว่าง', 'หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง'], ['K.5', 'Error Validation Field ยังไม่เลือกผล', 'กดบันทึกโดยยังไม่เลือกผล'], ['K.6', 'Filled เลือกผลและแนบไฟล์', 'เลือกผล + แนบไฟล์ (ถ้ามี)'],
      ['K.7', 'Status บันทึกผลแล้ว แก้ได้ภายหลัง', 'บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง'], ['toast:K1']] },
    { name: 'แผงแจ้งเตือนของผู้ดูแลยานพาหนะ', items: [['K.9', 'Interaction แจ้งเตือนผลตรวจน้ำมันไฮดรอลิกไม่ผ่าน', 'ผู้ดูแลยานพาหนะ — แผงแจ้งเตือน ผลตรวจน้ำมันไฮดรอลิกไม่ผ่าน กดแล้วเปิดรายละเอียดยานพาหนะ']] }] },
  { title: 'รับทราบผลการบำรุงรักษารายคัน', pages: [
    { name: 'หน้าผลการบำรุงรักษารอรับทราบ', items: [['L.6', 'Interaction แผงแจ้งเตือน ปิดงานแล้ว รอรับทราบ', 'เปิดแผงแจ้งเตือน — ปิดงานแล้ว รอรับทราบ'], ['L.1', 'Filled รายการรอรับทราบ มีแจ้งเตือนใหม่', 'รายการผลการบำรุงรักษารอรับทราบ — มีแจ้งเตือนใหม่'], ['L.4', 'Status กลับหน้ารายการ คันที่รับทราบแล้ว', 'กลับหน้ารายการ — คันที่รับทราบแล้วสถานะรับทราบแล้ว']] },
    { name: 'หน้าผลการบำรุงรักษารายคัน', items: [['L.2', 'Default ปุ่มรับทราบกดได้', 'ผลการบำรุงรักษารายคัน — ปุ่มรับทราบกดได้'], ['L.3', 'Status บำรุงรักษาไม่ได้ แสดงสาเหตุ รับทราบได้เลย', 'คันที่บำรุงรักษาไม่ได้ — ฟอร์มเดียวกัน แสดงสาเหตุ รับทราบได้เลย'], ['L.5', 'Status รับทราบแล้ว ปุ่มประเมินความพึงพอใจ', 'รับทราบแล้ว — ป้ายรับทราบแล้ว ปุ่มประเมินความพึงพอใจ'],
      ['L.7', 'Role บทบาทอื่นเปิดดู ไม่มีปุ่มรับทราบ', 'บทบาทอื่นเปิดดูผล — ไม่มีปุ่มรับทราบ'], ['toast:L1']] }] }
];
return {
  id: 'job', title: 'งานบำรุงรักษารายคัน', page: ['งานบำรุงรักษารายคัน'],
  doc: '34-บำรุงรักษา-feature-งานรายคัน-สำหรับ-dev.md',
  scenarios: ['S10', 'S23', 'S12', 'S13'],
  screens: SCREENS, toasts: TOASTS, happy: HAPPY, journeys: JOURNEYS
};
})());


/* ---------- features/close.js ---------- */
/* ============================================================================
   features/close.js — Feature ประวัติและปิดงาน · 17 พ.ย. 2569 · 18 พ.ย. 2569 ย้ายฐาน origin/main ee11614 เหลือ S18
   เอกสาร: Diagram/01-บำรุงรักษาตามวาระ/35-บำรุงรักษา-feature-ประวัติและปิดงาน-สำหรับ-dev.md
   รูปแบบฟิลด์ตาม features/plan.js (แม่แบบ) · ใช้จอเดิมของ screens.js (base/) ทุกจอ ไม่ประกอบ UI ใหม่
   ฐาน origin (18 พ.ย. 2569):
     · S15 S16 S17 ถูกตัด (R89 · 6299e1d) ⇒ journey บันทึกและส่งประวัติ / ตรวจสอบประวัติ / ออกรายงานผลและปิดงาน หายทั้งหมด (N.* O.* P.* ไม่มีแล้ว)
       แผนปิดงานเองเมื่อทุกคันเสร็จหรือบำรุงรักษาไม่ได้ และรับทราบครบ (S13 อยู่ใน Feature งานรายคัน)
     · S18 ต้นทุน = แท็บต้นทุนในรายละเอียดแผนที่อนุมัติแล้ว (R92) Q.1–Q.6 · Q.3 (ส่งออกแล้ว) = Q.2 + toast ⇒ ชุดทุกเคสแยกเป็น toast Q1 · happy ใช้ Q.3 ตรงๆ
     · ชื่อ Feature / Page ยังเป็น "ประวัติและปิดงาน" (ผู้ใช้มี Page นี้อยู่แล้ว) — เนื้อเหลือแค่ต้นทุน เสนอเปลี่ยนชื่อ รอผู้ใช้เคาะ
   ============================================================================ */
MF_FEATURES.push((() => {
const DETAIL = 'หน้ารายละเอียดแผน แท็บต้นทุนการบำรุงรักษา', XLS = 'หน้าไฟล์ Excel ต้นทุนที่ส่งออก';
/* toast ของ feature (ข้อความลอกจาก notify() ของ Q.3 ใน base/screens.js) */
const TOASTS = {
  Q1: { text: 'ส่งออกไฟล์สำเร็จ', page: 'แท็บต้นทุนการบำรุงรักษา', when: 'กดส่งออก Excel สำเร็จ', was: 'Q.3' }
};
const HAPPY = [
  [['Q.1', 'รายละเอียดแผน แท็บต้นทุน', DETAIL], ['Q.2', 'สรุปรายไตรมาส ต้นทุนรายคัน', DETAIL], ['Q.3', 'ส่งออก Excel สำเร็จ', DETAIL]]];
/* Title หลัก → journey → หน้า → case · หน้าไฟล์ Excel ใส่ "ไฟล์ Excel · " นำหน้าป้าย ⇒ ชื่อเฟรมเข้าข้อยกเว้นขนาดจอ R32 */
const JOURNEYS = [
  { title: 'คำนวณต้นทุนการบำรุงรักษา', pages: [
    { name: DETAIL, items: [['Q.6', 'Empty ยังไม่มียานพาหนะปิดงาน', 'ยังไม่มียานพาหนะปิดงาน — ยังไม่มีต้นทุน'], ['Q.1', 'Default แท็บต้นทุนการบำรุงรักษา', 'รายละเอียดแผนที่อนุมัติแล้ว — แท็บต้นทุนการบำรุงรักษา'], ['Q.2', 'Filled สรุปรายไตรมาส ต้นทุนรายคัน และยานพาหนะที่บำรุงรักษาไม่ได้', 'แท็บต้นทุนการบำรุงรักษา — สรุปรายไตรมาส ต้นทุนรายคัน และยานพาหนะที่บำรุงรักษาไม่ได้'], ['toast:Q1']] },
    { name: XLS, items: [['Q.4', 'ไฟล์ Excel · Filled ชีตสรุปรายไตรมาส', 'ไฟล์ Excel — ชีตสรุปรายไตรมาส'], ['Q.5', 'ไฟล์ Excel · Filled ชีตต้นทุนรายคัน', 'ไฟล์ Excel — ชีตต้นทุนรายคัน']] }] }
];
return {
  id: 'close', title: 'ประวัติและปิดงาน', page: ['ประวัติและปิดงาน'],
  doc: '35-บำรุงรักษา-feature-ประวัติและปิดงาน-สำหรับ-dev.md',
  scenarios: ['S18'],
  screens: {}, toasts: TOASTS, happy: HAPPY, journeys: JOURNEYS
};
})());


/* ---------- features/track.js ---------- */
/* ============================================================================
   features/track.js — Feature ติดตามและแดชบอร์ด (S4 S24) · 17 พ.ย. 2569 · 18 พ.ย. 2569 ย้ายฐาน origin/main ee11614
   เอกสาร: Diagram/01-บำรุงรักษาตามวาระ/36-บำรุงรักษา-feature-ติดตามและแดชบอร์ด-สำหรับ-dev.md
   รูปแบบไฟล์ตามแม่แบบ features/plan.js (หัวไฟล์นั้นอธิบายทุกฟิลด์)
   จอทั้งหมดเป็นจอเดิมของ screens.js (base/ · บล็อก C = S4 · W = S24) ไม่ประกอบ UI ใหม่
     · C.9 (ส่งออกสำเร็จ) = หน้าตา C.4 + toast ⇒ ชุดทุกเคสแยกเป็น toast S1 · happy ใช้ C.9 ตรงๆ
   ฐาน origin (18 พ.ย. 2569):
     · แดชบอร์ดแบบ VMS+ (R106): C.3 แผงตัวกรองเห็นเฉพาะแผนของหน่วยงานตัวเอง · กบค. เห็นทุกหน่วยงานดูอย่างเดียว (C.14 C.15) · กดกราฟ/เรื่องที่ควรดู (C.16 C.17) · มุมมองมือถือ (C.18)
       ชิ้นวาดเองอยู่ในกรอบ DASH_BOX ⇒ ตัวนับ "ชิ้นในจอที่ไม่ใช่ instance/กรอบ" ของ feature.js ยกเว้นแบบ R106
     · S24 แดชบอร์ดรายคัน + Vehicle info (R90 R107): W.6 กดเลขทะเบียนเปิดแท็บข้อมูลยานพาหนะ · แท็บประวัติ (W.13 W.21 W.22) · เครื่องมือกลของ กบค. เป็นการ์ด (W.19 W.20 W.24–W.27)
   ============================================================================ */
MF_FEATURES.push((() => {
const DASH = 'หน้าอะไหล่ของแผนที่อนุมัติแล้ว', PDF = 'หน้าไฟล์ PDF ที่ส่งออก', XLS = 'หน้าไฟล์ Excel ที่ส่งออก';
const MA = 'หน้าข้อมูลยานพาหนะ แท็บการบำรุงรักษา', MAD = 'หน้ารายละเอียดยานพาหนะ';

/* toast ของ feature (ข้อความลอกจาก notify() ใน base/screens.js) */
const TRACK_TOASTS = {
  S1: { text: 'ส่งออกไฟล์สำเร็จ', page: 'อะไหล่ของแผนที่อนุมัติแล้ว', when: 'กดส่งออกใน popup แล้วสร้างไฟล์สำเร็จ', was: 'C.9' },
  M1: { text: MC_OK, page: 'รายละเอียดยานพาหนะ แท็บข้อมูลยานพาหนะ', when: 'กบค. บันทึกเครื่องมือกลสำเร็จ', was: 'W.27' }
};

/* Happy flow — [รหัสจอ, คำอธิบายขั้น, ชื่อหน้า] */
const TRACK_HAPPY = [
  [['C.1', 'แท็บรวมตามรายการ', DASH], ['C.3', 'กดตัวกรอง เลือกแผน', DASH], ['C.4', 'กรองแล้ว ชิปตัวกรองเหนือตาราง', DASH],
    ['C.6', 'แท็บแยกรายคัน', DASH], ['C.7', 'แท็บความคืบหน้าของแผน', DASH]],
  [['C.4', 'กรองแล้ว กดส่งออก', DASH], ['C.8', 'popup เลือกรูปแบบไฟล์', DASH], ['C.9', 'ส่งออกสำเร็จ', DASH]],
  [['W.1', 'แดชบอร์ดยานพาหนะทุกคัน', MA], ['W.4', 'กดตัวกรอง', MA], ['W.5', 'กรองใกล้ครบกำหนด', MA],
    ['W.6', 'กดเลขทะเบียน แท็บข้อมูลยานพาหนะ', MAD], ['W.7', 'แท็บตารางบำรุงรักษา กำหนดครั้งถัดไป', MAD]],
  [['W.19', 'การ์ดเครื่องมือกล', MAD], ['W.25', 'popup แก้ไขเครื่องมือกล', MAD], ['W.27', 'บันทึกเครื่องมือกลสำเร็จ', MAD]]];

/* journey → หน้า → case · หน้าไฟล์ที่ส่งออกใส่ "ไฟล์ PDF · " / "ไฟล์ Excel · " นำหน้าป้าย case ⇒ ชื่อเฟรมมี " — ไฟล์ PDF" ตามข้อยกเว้นขนาดจอ R32 */
const TRACK = [
  { title: 'ดูอะไหล่และความคืบหน้าของแผนที่อนุมัติแล้ว', pages: [
    { name: DASH, items: [['C.13', 'Default ยังไม่มีแผนที่อนุมัติแล้ว', 'ยังไม่มีแผนที่อนุมัติแล้ว'], ['C.1', 'Filled แท็บรวมตามรายการ', 'แท็บรวมตามรายการ — อะไหล่ทุกแผนที่อนุมัติแล้วในปีงบประมาณ 2570'], ['C.2', 'Filled ค้นหาชื่อหรือรหัสอะไหล่', 'ค้นหาชื่ออะไหล่ หรือรหัสอะไหล่'],
      ['C.3', 'Interaction แผงตัวกรอง เห็นเฉพาะแผนของหน่วยงานตัวเอง', 'กดตัวกรอง — แผงตัวกรอง ปีงบประมาณ เขต แผน (เห็นเฉพาะแผนของหน่วยงานตัวเอง)'], ['C.4', 'Filled กรองแล้ว ชิปตัวกรองเหนือตาราง', 'กรองแล้ว — ชิปตัวกรองเหนือตาราง'], ['C.5', 'Empty result ไม่พบอะไหล่', 'ไม่พบอะไหล่ที่ตรงกับคำค้นหรือตัวกรอง'],
      ['C.6', 'Filled แท็บแยกรายคัน', 'แท็บแยกรายคัน — อะไหล่ของยานพาหนะแต่ละคัน'], ['C.7', 'Filled แท็บความคืบหน้าของแผน', 'แท็บความคืบหน้าของแผน — แผนเดินทางและยานพาหนะที่บำรุงรักษาแล้วรายไตรมาส'], ['C.16', 'Interaction กดกราฟ แท่งไตรมาส 1 กรองทั้งหน้า', 'กดกราฟ — แท่งไตรมาส 1 กรองทั้งหน้า ชิปตัวกรองที่เลือก แท็บความคืบหน้าเหลือไตรมาส 1'],
      ['C.17', 'Interaction กดเรื่องที่ควรดู ยานพาหนะที่ไม่เบิกอะไหล่', 'กดเรื่องที่ควรดู — ยานพาหนะในแผนที่ไม่เบิกอะไหล่ กรองทั้งหน้า แท็บแยกรายคัน'], ['C.18', 'Filled มุมมองมือถือ การ์ดตัวเลข 2 ใบต่อแถว', 'มุมมองมือถือ — การ์ดตัวเลข 2 ใบต่อแถว กราฟเรียงทีละใบ ตารางเป็นการ์ด'],
      ['C.14', 'Role กบค. ความคืบหน้าของแผนทุกหน่วยงาน ดูอย่างเดียว', 'กบค. — ความคืบหน้าของแผนทุกหน่วยงาน ดูอย่างเดียว'], ['C.15', 'Role กบค. แผงตัวกรองมีหน่วยงานผู้ขอเบิก', 'กบค. — แผงตัวกรอง มีหน่วยงานผู้ขอเบิก']] }] },
  { title: 'ส่งออกรายงานอะไหล่', pages: [
    { name: DASH, items: [['C.8', 'Interaction popup ส่งออก', 'กดส่งออก — popup รูปแบบไฟล์ และข้อมูลที่ส่งออก'], ['toast:S1']] },
    { name: PDF, items: [['C.10', 'ไฟล์ PDF · Filled รวมตามรายการ', 'ไฟล์ PDF — รวมตามรายการ']] },
    { name: XLS, items: [['C.11', 'ไฟล์ Excel · Filled ชีตรวมตามรายการ', 'ไฟล์ Excel — ชีตรวมตามรายการ'], ['C.12', 'ไฟล์ Excel · Filled ชีตแยกรายคัน', 'ไฟล์ Excel — ชีตแยกรายคัน']] }] },
  { title: 'ติดตามการบำรุงรักษารายคันและกำหนดครั้งถัดไป', pages: [
    { name: MA, items: [['W.1', 'Filled แดชบอร์ดยานพาหนะทุกคัน', 'แท็บการบำรุงรักษา — แดชบอร์ดยานพาหนะทุกคัน การ์ดตัวเลข เรียงกำหนดครั้งถัดไป'], ['W.2', 'Filled ค้นหาทะเบียน', 'ค้นหาทะเบียน'], ['W.3', 'Empty result ค้นหาไม่พบ', 'ค้นหาไม่พบ'],
      ['W.4', 'Interaction แผงตัวกรอง', 'กดตัวกรอง — แผงตัวกรอง ประเภท สังกัด บำรุงรักษาล่าสุด ครบกำหนดภายใน รายการ ผลตรวจน้ำมัน'], ['W.5', 'Filled กรองแล้ว ใกล้ครบกำหนด', 'กรองแล้ว — ใกล้ครบกำหนดบำรุงรักษา'], ['W.9', 'Filled กรองแล้ว ต้องเก็บตัวอย่างน้ำมัน', 'กรองแล้ว — ต้องเก็บตัวอย่างน้ำมัน'],
      ['W.10', 'Filled กรองแล้ว บำรุงรักษาล่าสุดเกิน 12 เดือน', 'กรองแล้ว — บำรุงรักษาล่าสุดเกิน 12 เดือน'], ['W.11', 'Filled กรองแล้ว ครบกำหนดภายใน 3 เดือน', 'กรองแล้ว — ครบกำหนดภายใน 3 เดือน'],
      ['W.16', 'Interaction กดกราฟ ส่วนเลยกำหนด', 'กดกราฟ — ส่วนเลยกำหนดของโดนัทสถานะกำหนดบำรุงรักษา กรองทั้งหน้า'], ['W.17', 'Interaction กดเรื่องที่ควรดู ผลตรวจน้ำมันไม่ผ่าน', 'กดเรื่องที่ควรดู — ผลตรวจน้ำมันล่าสุดไม่ผ่าน กรองทั้งหน้า'], ['W.18', 'Filled มุมมองมือถือ', 'มุมมองมือถือ — การ์ดตัวเลข 2 ใบต่อแถว กราฟเรียงทีละใบ ตารางเป็นการ์ด']] },
    { name: MAD, items: [['W.6', 'แท็บข้อมูลยานพาหนะ · Filled กดเลขทะเบียน', 'กดเลขทะเบียน — เปิดหน้ารายละเอียดยานพาหนะ แท็บข้อมูลยานพาหนะ'], ['W.14', 'แท็บข้อมูลยานพาหนะ · Filled มีงานในประกัน', 'แท็บข้อมูลยานพาหนะ — มีงานในประกัน ส่วนการรับประกันท้ายแท็บ'],
      ['W.15', 'แท็บข้อมูลยานพาหนะ · Filled นอกกลุ่มเครื่องมือกล', 'แท็บข้อมูลยานพาหนะ — รหัสข้างนอกกลุ่ม 04 07 08 09 10 ไม่มีส่วนเครื่องมือกล ไม่มีงานในประกัน'], ['W.23', 'แท็บข้อมูลยานพาหนะ · Filled มุมมองมือถือ', 'แท็บข้อมูลยานพาหนะบนมือถือ — เรียง 1 คอลัมน์ลำดับเดียวกับ desktop กบค. แก้ไขเครื่องมือกลได้'],
      ['W.7', 'แท็บตารางบำรุงรักษา · Filled กำหนดครั้งถัดไป 5 รายการ', 'รายละเอียดยานพาหนะ — แท็บตารางบำรุงรักษา กำหนดครั้งถัดไป 5 รายการ'], ['W.12', 'แท็บตารางบำรุงรักษา · Filled ครบกำหนดหลายรายการ', 'แท็บตารางบำรุงรักษา — คันที่ครบกำหนดหลายรายการ ปีที่ครบเปลี่ยนน้ำมัน'],
      ['W.8', 'แท็บตารางบำรุงรักษา · Interaction เมนู … ของประวัติ', 'ประวัติ กดปุ่ม … — ดูรายละเอียดงานที่ปิดแล้ว'], ['W.13', 'แท็บประวัติการซ่อมบำรุง · Filled ป้าย Overhaul', 'รายละเอียดยานพาหนะ — แท็บประวัติการซ่อมบำรุง ซ่อมและบำรุงรักษาเรียงวันที่ปิดงาน ป้าย Overhaul'],
      ['W.21', 'แท็บประวัติการบำรุงรักษาเครื่องจักร · Filled', 'แท็บประวัติการบำรุงรักษาเครื่องจักร — บันทึกบำรุงรักษาตามวาระ'], ['W.22', 'แท็บประวัติการบำรุงรักษาเครื่องยนต์ · Filled', 'แท็บประวัติการบำรุงรักษาเครื่องยนต์ — เช็คระยะที่ศูนย์บริการ']] }] },
  { title: 'จัดการเครื่องมือกล (กบค.)', pages: [
    { name: MAD, items: [['W.19', 'Role กบค. การ์ดเครื่องมือกล', 'กบค. — การ์ดเครื่องมือกล ช่องที่ยังไม่มีข้อมูลมีปุ่มเพิ่ม ช่องที่มีข้อมูลแก้ไขได้'], ['W.20', 'Empty การ์ดว่าง ปุ่มเพิ่มเครื่องมือกล', 'กบค. — ยานพาหนะในกลุ่มที่ยังไม่มีเครื่องมือกล การ์ดว่าง ปุ่มเพิ่มเครื่องมือกล'], ['W.24', 'Interaction popup เพิ่มเครื่องมือกล', 'popup เพิ่มเครื่องมือกล — กบค. กดเพิ่มจากการ์ดว่าง ช่องว่าง รหัสทรัพย์สินย่อยตั้งต้น 0001'],
      ['W.25', 'Interaction popup แก้ไขเครื่องมือกล', 'popup แก้ไขเครื่องมือกล — ค่าเดิมของเครื่องเป็นค่าตั้งต้น ช่องที่ไม่มีข้อมูลว่าง'], ['W.26', 'Error Validation Field ช่องบังคับ', 'กดบันทึกโดยยังไม่กรอก — ช่องบังคับขึ้นข้อความ error'], ['W.27', 'Status บันทึกเครื่องมือกลแล้ว', 'บันทึกเครื่องมือกลสำเร็จ — ปิด popup การ์ดแสดงค่าที่บันทึก'], ['toast:M1']] }] }
];

return {
  id: 'track', title: 'ติดตามและแดชบอร์ด', page: ['ติดตามและแดชบอร์ด'],
  doc: '36-บำรุงรักษา-feature-ติดตามและแดชบอร์ด-สำหรับ-dev.md',
  scenarios: ['S4', 'S24'],
  screens: {}, toasts: TRACK_TOASTS, happy: TRACK_HAPPY, journeys: TRACK
};
})());

/* ======================== maintainance-feature-plugin/sig.js ======================== */
/* ============================================================================
   maintainance-feature-plugin/sig.js — ลายเซ็นจอ (18 พ.ย. 2569 · ผู้ใช้ขอ "อัปเดตเฉพาะจอที่เปลี่ยน ไม่ต้องสร้างใหม่ทั้งหมด")
   ----------------------------------------------------------------------------
   ใช้ 2 ที่ (ไฟล์เดียวกัน):
     · build.js  (node)  — ตัดซอร์สทุกไฟล์เป็นก้อนตามการประกาศชั้นนอกสุด (function / const / let / class ที่ขึ้นต้นคอลัมน์ 0)
                           หาว่าก้อนไหนอ้างชื่อไหน แล้วคิด hash ของ "ก้อนนั้น + ทุกก้อนที่มันพึ่งต่อกันไป" ⇒ MF_DEPHASH ฝังใน code.js
     · ปลั๊กอิน (Figma) — ลายเซ็นของจอ = hash( ซอร์สฟังก์ชันจอ + MF_DEPHASH ของทุกชื่อที่ฟังก์ชันจออ้าง + ข้อมูลเคส/ป้าย )
   ไม่นับคอมเมนต์และช่องว่าง ⇒ แก้คอมเมนต์ไม่ทำให้จอ "เปลี่ยน"
   ไม่ผูกกับโครง screens.js — อ่านแค่ซอร์ส ⇒ ย้ายฐาน core/screens แล้วยังใช้ได้ (build ใหม่ = hash ใหม่)
   ============================================================================ */
const SIG_SALT = 'mf-sig-1';   // เปลี่ยนค่านี้ = ทุกจอนับว่า "เปลี่ยน" (ใช้เมื่อแก้ขั้นตอนสร้างจอแบบที่ตัวหาการพึ่งพาจับไม่ได้)

/* hash 64 บิต (FNV-1a 2 ชุด) เป็นเลขฐาน 16 ยาว 16 ตัว — ไม่ใช่การเข้ารหัส ใช้เทียบว่าเหมือนเดิมไหม */
function sigHash(s) {
  let a = 0x811c9dc5, b = 0x01000193 ^ 0x5bd1e995;
  s = String(s);
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    a ^= c; a = Math.imul(a, 0x01000193) >>> 0;
    b ^= c; b = Math.imul(b, 0x5bd1e995) >>> 0; b ^= b >>> 15;
  }
  return ('0000000' + (a >>> 0).toString(16)).slice(-8) + ('0000000' + (b >>> 0).toString(16)).slice(-8);
}

/* ตัดคอมเมนต์ + บีบช่องว่าง · เก็บชื่อตัวแปรที่อยู่นอกข้อความ (รวมใน ${…} ของ template) — ตัวตัดคำแบบย่อ แยก regex จาก / หารด้วยตัวอักษรก่อนหน้า */
function sigScan(src) {
  src = String(src);
  const ids = new Set(); let out = '', i = 0, last = '';   // last = ตัวอักษรที่มีความหมายตัวล่าสุด (ไว้เดาว่า / คือ regex ไหม)
  const n = src.length, idStart = /[A-Za-z_$]/, idChar = /[\w$]/;
  const KW = /^(return|typeof|case|do|else|in|of|new|delete|void|throw|instanceof|await|yield)$/;
  let lastWord = '';
  const stack = [];   // ความลึกของ ${ } ใน template
  function template() {   // อยู่หลัง ` แล้ว · คืนเมื่อเจอ ` ปิด
    out += '`';
    while (i < n) {
      const c = src[i];
      if (c === '\\') { out += src.substr(i, 2); i += 2; continue; }
      if (c === '`') { out += '`'; i++; return; }
      if (c === '$' && src[i + 1] === '{') { out += '${'; i += 2; stack.push(0); code(true); out += '}'; continue; }
      out += c; i++;
    }
  }
  function code(inTpl) {
    let depth = 0;
    while (i < n) {
      const c = src[i], d = src[i + 1];
      if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
      if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; if (!/\s$/.test(out)) out += ' '; continue; }
      if (c === '"' || c === "'") { const q = c; let j = i + 1; while (j < n && src[j] !== q && src[j] !== '\n') { if (src[j] === '\\') j++; j++; } out += src.slice(i, j + 1); i = j + 1; last = q; lastWord = ''; continue; }
      if (c === '`') { i++; template(); last = '`'; lastWord = ''; continue; }
      if (c === '/') {
        const re = !last || /[(,=:[!&|?{};+\-*%<>~^]/.test(last) || KW.test(lastWord);
        if (re) { let j = i + 1, cls = false; while (j < n && src[j] !== '\n') { const x = src[j]; if (x === '\\') { j += 2; continue; } if (x === '[') cls = true; else if (x === ']') cls = false; else if (x === '/' && !cls) break; j++; } j++; while (j < n && /[a-z]/.test(src[j])) j++; out += src.slice(i, j); i = j; last = '/'; lastWord = ''; continue; }
      }
      if (idStart.test(c)) {
        let j = i + 1; while (j < n && idChar.test(src[j])) j++;
        const w = src.slice(i, j), prev = out.replace(/\s+$/, '').slice(-1);
        if (prev !== '.' || out.replace(/\s+$/, '').slice(-3) === '...') ids.add(w);   // a.b ⇒ นับแค่ a (b เป็นชื่อ property)
        out += w; i = j; last = 'a'; lastWord = w; continue;
      }
      if (/\s/.test(c)) { if (!/\s$/.test(out)) out += ' '; i++; continue; }
      if (inTpl) { if (c === '{') depth++; else if (c === '}') { if (!depth) { i++; stack.pop(); return; } depth--; } }
      out += c; i++; last = c; lastWord = '';
    }
  }
  code(false);
  return { code: out.trim(), ids };
}

/* ก้อนการประกาศชั้นนอกสุด: บรรทัดที่ขึ้นต้นคอลัมน์ 0 ด้วย function / async function / const / let / var / class
   ก้อน = ตั้งแต่บรรทัดนั้นถึงก่อนการประกาศถัดไป (คำสั่งอื่นที่คอลัมน์ 0 เช่น for … / figma.ui.onmessage = ติดไปกับก้อนก่อนหน้า) */
const SIG_DECL = /^(?:async\s+)?(?:function\s*\*?\s*([A-Za-z_$][\w$]*)|class\s+([A-Za-z_$][\w$]*)|(?:const|let|var)\s+(.+))/;
/* คำสั่งที่คอลัมน์ 0 ที่ไม่ใช่การประกาศ (รีวิวโคนัน 18 พ.ย. 2569) — เช่น Object.assign(KEYS, …) · NEEDED.push(…) · LIST_OVERRIDE['T.4'] = … · for (…) PLAN_UNIT[x] = …
   เป็นก้อนแยก (mut) ผูกกับตัวแปรที่มันแก้ ⇒ แก้คำสั่งนี้แล้วลายเซ็นของทุกจอที่ใช้ตัวแปรนั้นเปลี่ยน (เดิมติดไปกับก้อนก่อนหน้า ผูกผิดตัว) */
const SIG_STMT = /^(?:for\b|if\b|Object\.assign\b|[A-Za-z_$][\w$]*\s*(?:\.|\[|\())/;
function sigTargets(text) {
  const t = new Set(), code = sigScan(text).code;
  for (const re of [/Object\.assign\(\s*([A-Za-z_$][\w$]*)/g, /([A-Za-z_$][\w$]*)\[[^\n;]*?\]\s*=(?!=)/g, /([A-Za-z_$][\w$]*)\.[A-Za-z_$][\w$]*\s*=(?!=)/g, /([A-Za-z_$][\w$]*)\.(?:push|unshift|splice|set|add)\(/g])
    for (const m of code.matchAll(re)) t.add(m[1]);
  return [...t];
}
function sigChunks(src) {
  const lines = String(src).split('\n'), chunks = []; let cur = null;
  for (const l of lines) {
    const m = l.match(SIG_DECL);
    if (m) {
      let names = [];
      if (m[1] || m[2]) names = [m[1] || m[2]];
      else { const head = m[3].replace(/(['"`]).*?\1/g, '""'); names = [...head.matchAll(/(?:^|,)\s*([A-Za-z_$][\w$]*)\s*=/g)].map(x => x[1]); if (!names.length) { const one = head.match(/^([A-Za-z_$][\w$]*)/); if (one) names = [one[1]]; } }
      if (names.length) { cur = { names, text: l }; chunks.push(cur); continue; }
    }
    if (SIG_STMT.test(l) && !/^(return|typeof|await)\b/.test(l)) { cur = { names: [], mut: true, text: l }; chunks.push(cur); continue; }
    if (cur) cur.text += '\n' + l;
  }
  chunks.filter(c => c.mut).forEach(c => { c.targets = sigTargets(c.text); });
  return chunks;
}

/* build.js: scopes = { '*': [ซอร์สส่วนกลาง…], '<id>': ซอร์สของ features/<id>.js } ⇒ { '*': { ชื่อ: hash }, '<id>': { ชื่อ: hash } }
   ชื่อในไฟล์ Feature หาในไฟล์นั้นก่อน (ทุกไฟล์มี TOASTS / SCREENS / HAPPY ของตัวเอง) แล้วค่อยหาส่วนกลาง */
function sigDepHash(scopes) {
  const nodes = new Map();   // key → { own, deps:Set<key> }
  const table = {};          // scope → { ชื่อ → key }
  for (const [sc, srcs] of Object.entries(scopes)) {
    table[sc] = {};
    for (const src of [].concat(srcs)) for (const ch of sigChunks(src)) {
      const s = sigScan(ch.text), key = sc + ':' + (ch.names[0] || '(mut)') + ':' + nodes.size;
      nodes.set(key, { own: sigHash(s.code), ids: s.ids, scope: sc, targets: ch.targets || null });
      for (const nm of ch.names) table[sc][nm] = table[sc][nm] ? table[sc][nm].concat(key) : [key];   // ชื่อซ้ำ (ประกาศทับ) ⇒ พึ่งทุกก้อน
    }
  }
  for (const nd of nodes.values()) {
    nd.deps = new Set();
    for (const id of nd.ids) for (const k of (nd.scope !== '*' && table[nd.scope][id]) || table['*'][id] || []) nd.deps.add(k);
  }
  for (const [key, nd] of nodes) if (nd.targets) for (const t of nd.targets) for (const k of (nd.scope !== '*' && table[nd.scope][t]) || table['*'][t] || []) nodes.get(k).deps.add(key);   // ตัวแปรที่ถูกแก้ พึ่งคำสั่งที่แก้มัน
  const closure = (key) => { const seen = new Set([key]), st = [key]; while (st.length) for (const d of nodes.get(st.pop()).deps) if (!seen.has(d)) { seen.add(d); st.push(d); } return seen; };
  const out = {};
  for (const [sc, t] of Object.entries(table)) {
    out[sc] = {};
    for (const [nm, keys] of Object.entries(t)) {
      const all = new Set(); keys.forEach(k => closure(k).forEach(x => all.add(x)));
      out[sc][nm] = sigHash([...all].map(k => nodes.get(k).own).sort().join(','));
    }
  }
  return out;
}

/* ปลั๊กอิน: ลายเซ็นของฟังก์ชันจอ 1 ตัว · scope = '*' (จอของ screens.js / toast ของ feature.js) หรือรหัส Feature (จอที่ไฟล์ Feature แทนเอง — หาชื่อในไฟล์นั้นก่อน)
   แยก scope กันชื่อชน (plan.js มี HAPPY FEATURE … ชื่อเดียวกับ feature.js) · base = ชื่อขั้นตอนที่ทุกจอผ่าน (makeScreen · หาส่วนกลางเสมอ) · data = ป้าย/ข้อความเคส */
function sigOf(fn, scope, base, data) {
  const D = (typeof MF_DEPHASH !== 'undefined' && MF_DEPHASH) || { '*': {} };
  const s = sigScan(fn ? Function.prototype.toString.call(fn) : '');
  const look = (nm) => (scope !== '*' && D[scope] && D[scope][nm]) || D['*'][nm];
  const deps = [...s.ids].filter(look).sort().map(nm => nm + '=' + look(nm)).concat((base || []).map(nm => '@' + nm + '=' + D['*'][nm]));
  return sigHash([SIG_SALT, s.code, deps.join(';'), JSON.stringify(data || null)].join('\n'));
}
/* ซอร์สฟังก์ชันอ่านได้จริงไหม (บาง sandbox คืน [native code]) — อ่านไม่ได้ ⇒ ลายเซ็นไว้ใจไม่ได้ โหมดอัปเดตจอที่เปลี่ยนจะไม่ทำงาน */
function sigSourceOk() {
  try { const probe = function mfProbe() { return 'mf-probe-41'; }; return Function.prototype.toString.call(probe).indexOf('mf-probe-41') >= 0; } catch (e) { return false; }
}

if (typeof module !== 'undefined' && module.exports) module.exports = { sigHash, sigScan, sigChunks, sigTargets, sigDepHash, sigOf, sigSourceOk, SIG_SALT };

const MF_DEPHASH = {"*":{"log":"e7a21f9ccd082fbb","errors":"3a220519171e22dd","warn":"e7a21f9ccd082fbb","KEYS":"5df34a4f3783b2f4","SOFT_KEY":"1d0086ecce075282","ALIAS":"17d7a61879541404","INDEX":"7cd4c36ecdfe855a","ROUTE":"28cd88a1fcbf9233","IMPORT_ERR":"c61fb57143b7f864","holderOf":"79324dbf94193d00","COMP_CACHE":"7b5fef967d645283","readCompCache":"cdadf5cc800012f1","writeCompCache":"bd337c82f8e87654","resolveAll":"083bb5c0777f81fc","main":"5bd9d18be028b136","icon":"e7ad466fc0b677ed","setProps":"da8c52da80c1ee1c","USED":"c583d85f3aa90c88","CREATED":"285650ca1e6afefe","PLACE":"62e5454527dd2fc2","INNER_FRAMES":"e34ba422faaa8938","sweepOrphans":"756ac3ac8726b160","dropCreated":"d0d7504e49a0cbbe","inst":"0cd3d36417da4f87","find":"25b0610251b7976d","FONTS":"d926b5ba7426a836","FONT_SWAPPED":"6602ae17c330dc62","fallbackFont":"ba4582d114ba0589","text":"e7a21f9ccd082fbb","hide":"ff8c185fec764300","frame":"41335e4ac80be72b","add":"e2fc5af89e791fe0","WHITE":"0e81755097a1a348","BADGE_OF":"b71d082625b97cb4","MOB":"c0e34169d583a870","BP":"ac7dcbc2afcf2fbe","VW":"37ab5161abd7e106","VH":"37ab5161abd7e106","btn":"fd5763f9970c73e1","row":"bb6daba132af7ef8","col":"870c1bc164927de7","syncLabel":"52683ef92d96fbbe","field":"f018226bf78138e2","dropdown":"b63bcfeba5a2ca2e","multiDropdown":"4822f72ea3c13c8c","area":"1b745be2ddc80b94","section":"c69e623e84ea868b","sectionLabel":"36c4607aaede2e73","SURFACE_SUB":"a89a2fbb2bec0cdd","SURFACE_VAR":"fa9bd7cb17bdd901","surfaceVar":"a1b66acb2b7240f0","displayBox":"4b6badcf9715f1bf","kv":"df29e8decace9aa5","upload":"bef59056f2ca8a9c","mobileCards":"47173ff3456d4144","tblComposed":"c1036dffcf4cf5dc","fillPills":"812bb53099a436a8","fillCell":"efe9582825434e1e","TONE_HEX":"e69ac0a0a4507ecc","TONED":"d1377fca850400d4","TONE_VARS":"9c3ace0b6ab2c091","toneText":"19259e63fabd12ed","libVar":"c3435886ea6b88e0","bindTones":"530ccc299b4289c3","sizeCol":"395428fbd2a92a0f","TABLE_MAX":"303d6a850cef8ecc","OVERSIZE":"3ba9517fbf962996","tbl":"639c8788bd279458","listCheck":"e7f807648549aa4b","alertBox":"64bd31f6043415f5","pill":"28dcffa05e334e8b","shell":"b99c14726315c0bd","pageHead":"fe08d11c30d6fe34","btnRow":"e9dc48c6158b5c3c","overlay":"a5ca7905ea99f1bd","notify":"8b75c6b9dea00be3","filterPanel":"ef95792667e04cc0","sheet":"63ea0f65a004284d","modalHead":"d1a079870efbec9a","confirm":"2f7ab4bffd150a04","formModal":"b63652422c836e07","PINS":"4baef648cc2c2320","pin":"2726f6f4faf8ab1b","repin":"5908145501ed8135","MENU_SHEET":"0c20cbff398362ea","slotsOf":"576371beb704214c","menuAt":"a5f6adbb83cf86b4","MENU":"082cf506c43b49bf","comboAt":"c8971bd57f72b64f","tableHeader":"e92b3c5dfdad9658","pagination":"18362dc85d412b31","fillPagination":"a3fccf3a9ec2130a","firstMenuCell":"a387e62c3351b50b","stripDividers":"e9c21b1c1fb428e1","polish":"b406850140d9756e","reportOversize":"5cc9078e59b0e18a","findInstanceAncestor":"bff11141ed969cf4","GRID":"0d1b4cf1e9df2deb","BAR_FILL":"7fad210c4f8865b1","HEADER_BROKEN":"e44cba4acbd6a413","rgbOf":"a268e7df01e4464c","LABEL_FONT":"24aa77ff9ffa32c1","labelText":"36fda98de9657169","fixed":"39fb583c0e3f9e01","flowBar":"3d4b5cbc7c8805f0","stateTone":"54b52706f2f8a2ea","blockHeader":"8f2f024f9d98f9e6","DEVICE_ALIAS":"fd56a7229352f39e","deviceVariant":"212329835c348f43","deviceSetInfo":"b11cd5999b595dab","deviceLabel":"f276842b4afcc811","devOf":"297d52b07c6e8808","targetPage":"1b91f5c730efb7fb","namedPage":"ea8d0eeea0226dca","CANVAS_MAX":"5335463185613201","pageBottom":"789993bf3eb925cf","pageTop":"55b2f34d437e397f","spotOn":"d1a6ddb8528bad7e","roomyPage":"75b479614d8b1a99","liftAbove":"6d0a4ae3a96481e4","fitOn":"e4986d892e0f6cd7","shiftAll":"d33c3f3d3ffaa6f8","FLOW_GAP":"6ad471f5cb5b0718","STICKY_FILL":"4ca6db98af6a64f8","BADGE_FILL":"4ca6db98af6a64f8","FLOW_LINE":"4ca6db98af6a64f8","scenNo":"856b2f29f29bd149","flowNode":"2269643955ca3dc4","flowText":"e6b90332b8abaf95","arrow":"bc907d410c17a480","userflowFrame":"e472f48c50383bb0","emptyGraphic":"417d2c66344960a4","fillThumb":"087284252b70b16d","DOC_STATUS":"2333b95258a2b471","DOC_FONT":"ff9608800647b35b","docText":"2a938e632fa8578d","docBox":"cd3eaceac137edb7","putBelow":"6a3ed05062651654","storyMapBoard":"2f8d7391e9dae449","tableBoard":"f55a5be11268af7a","swimlaneBoard":"613a3f6dd55d5f59","activityFrame":"15ddc00ba2604335","activityBoard":"63a7db73c4cf1364","splitBoard":"413764c207c25fdf","SHOT_RE":"6d92e1bc4a88732d","exportShots":"df1af751719da33d","JGAP":"1b719f24d20499a9","buildJourney":"2a26351b74e026fc","buildGrid":"91068f32b1359d70","PLUGIN":"f1aea653f9600e35","DIRECT":"23fea0cc27d96982","NESTED":"d69a9a1a32224ffd","LOCAL_OPTIONAL":"f3a1bb3b17d01302","NEEDED":"bbf08419f94a35a0","NESTED_ONLY":"bbf08419f94a35a0","has":"0b3381f5ceb5e3ea","PST":"10c61d7766ae12dd","PLANS":"8a2b8f52f6d16d4c","NEW_PLAN":"9d869b79dda721ac","UNITS":"f746387b7ea81057","CREATOR":"f746387b7ea81057","UNIT_PLANS":"0ce601f6d027bc03","allPlans":"68347350e060a5a8","ownPlans":"41c43480d76a3838","REGIONS":"3986c11f02a4da1d","DISTRICTS":"f58556c8ea825171","dCode":"cd23304e239325f7","CAND":"f8efdbadc8a3ba17","REG_OF":"4ffa096ec20fd066","regionOf":"bf946a7d8e93467e","VTYPES":"597d6a992f1cd5a2","typeOf":"e8a50774ec4393b3","shortRegion":"abde5ca28ddac743","uniq":"473856dadc558f26","P":"4d7073af4bd2a39e","PLAN_KV":"024ff9ac1167842a","VST":"a918466d856d5428","RDY":"d32d8cd5b1e89b6d","VEH":"587bce86bdcf501a","V":"4d5769163c833df3","NOW_Q":"96faf83a234e9255","NOW_CARS":"96faf83a234e9255","VEH_KV":"f6e56bc0e2db3f0b","PSTAT":"5c86fbbd3f918ae5","PARTS":"ecf3f9b2a29f37b7","WH":"cbca78cab98ac381","PRICE":"1e41155f5c555522","BUYER":"d95af54537f6dedb","BUYER_OF":"35e972e44ad3c106","baht":"5ca137dbc332c9b7","shortOf":"913a37c8affa2f27","TST":"8506556644e6e387","STAFF_INFO":"0deb0f7db5e74f40","TRIP":"32c83ee532b09444","TRIP_CARS":"57f94d398eaeaf79","TRIP_KV":"dfe2ba28251528b2","TRIP_SEL":"7ae91139ac6cd2ae","TRIP_LOCS":"7ae91139ac6cd2ae","tripLoc":"33cd963f3703c1fa","tripWork":"220a13cd753e981d","tripRange":"e3400ec85fcf8925","tripWorkCell":"1283ccde9061336c","TRIP_WORKS":"7e960ab7e40fddd0","TRIP_OIL_CARS":"fb7f04da105b3cab","TRIP_FILTER_CARS":"fb7f04da105b3cab","TRIP_FUEL_CARS":"fb7f04da105b3cab","tripParts":"295dd86690859e86","OWNER_PH":"11b801d0877b4227","CTRL_NAME":"94758e8e13af6ade","TRIP_PHONES":"f68c29bc3c4ca1d6","TRIP_V_LOCS":"f68c29bc3c4ca1d6","TRIP_V_PHONES":"f68c29bc3c4ca1d6","tripPhone":"39fe62659fef7009","tripCtrl":"487eaaf480c43710","tripPhoneCell":"72971bec96abc23e","UNIT_COL":"205a2c02e01ff96b","TRIP_V_COLS":"6931f60874ac89b5","tripVCols":"1713aaab1b4c512c","tripVCells":"4c0d383a9c8ee184","TRIP_ALL":"c0ec3d111f477d90","TRIP_REST":"c0ec3d111f477d90","TRIP_OUT":"e9c4756ab2bdfc11","TRIP_KEEP":"e9c4756ab2bdfc11","TRIP_1":"b7b77ab09311b501","TRIP_2":"b7b77ab09311b501","tripAs":"241010843ccc9a3a","TAKEN_1":"b6d807fbe4da43a4","VENDORS":"9f348b7babdf5974","TRIP_V":"7a6f956ff44d9846","tripBy":"3efe3ca0d3888434","TRIP_RETURN":"fbdbbc78ddceaf10","WORK":"1fda0f657063ba3f","BEFORE":"a836781fb6f7d855","AFTER":"6aeb482badd294a4","WSTAT":"37a4d7c83021e1af","ACC":"1e670709d1e8c2a8","pdf":"b080b7e79e39fd9e","jpg":"d13e9f585380c202","detail":"398a5a1e11cfd50d","radioPick":"f482ed8e46843bb1","radioGroup":"29f25c97c99f072c","carPick":"22083a5b69e47a32","vehicleInfo":"75c2a96820979497","photoGallery":"b4c6b0f7dcc7c92d","photoUploads":"5c133241d7bce34b","partRow":"fceaa2bf384d1562","PART_COLS":"3f9faec1515ab2d2","fillPartCard":"0e3df784573a247c","partsPanel":"749e5c3b7a687ea3","findInstanceAncestorIn":"ed4e756519f7503a","partsSummary":"6be22a16ad8112d9","PLATE_RE":"3a31c38577f69109","PLATE_SKIP":"dfc086bad25d11f7","LINK_VAR":"330ee2785535bebf","WORD_ALLOW":"8ad2ac4849ca96b6","OLD_WORD":"48fbf9b37b748323","toVehicleWord":"58e7006ab9a2641d","AFTER_SCREEN":"cb8f9313db6834d1","PLAN_COLS":"c9e18a3126d2c40f","qCell":"f1b53eaf014b8f0a","PLAN_MENU_OF":"f1c10e3c7647c890","PLAN_SCOPE":"87af67c85a57ca66","scopeCell":"6852c3d1e05db33f","PLAN_UNIT":"bd28f2b738fea99e","PLAN_COLS_ALL":"d68484d28ef0ee12","planRow":"1f5396cab88022dc","listScreen":"1d1a7e61783f32d8","CARS":"a1cad9459a5216b2","YEARS":"23ac3e88ffce9907","CARP_COLS":"2842acda84e3545b","CAR_PICK":"e2c4bdc5b6f734ae","CAR_QTY":"664c2df6849d1561","MANUAL":"01d1f9cba1f2275c","MANUAL_ROW":"bdfb401267297b01","quarterParts":"9e2d07f6973224f5","noCarsInQ":"99ec466f4a84a142","noParts":"3820c6275fcc550d","OIL_OPTS":"3fb7fb54d5694037","LAST_OIL":"d9c6c9a51e04412f","QUARTERS":"70c209aa62dc4f56","headCheck":"c5dbc59a54ad2d20","PICK_COLS":"a1256bae81878d20","Q_COLS":"8c44ee1d74d9e084","TODO_NONE":"9cab3c287914b92b","OIL_SPEC":"008674543a16763b","oilCell":"d19481307f9bac9b","partList":"bf909c4fcc595f12","partCell":"d963acaa782a42e9","QPART_COLS":"fec92da3859217e6","qAgg":"19473fd23e284691","inArea":"7ba692020a64533a","inQuery":"5c0385058dc58f69","ALL_Q_PARTS_EMPTY":"b004a8ec2b4bb01b","Q_MENU":"5a61d18b92b7e9bd","PLAN_OUT_CONFIRM":"0cc96bfff0751ebc","ADD_PLAN_FIRST":"b4b2671805752d20","noCarsInPlan":"1c8ad85b1bff6418","planForm":"e258b862240ff063","PICK_POOL":"bc9cd30e79d0ce1e","MA_HEAD":"e1bc231044697b72","REPAIR_HEAD":"e1bc231044697b72","NO_HIST":"e1bc231044697b72","PICK_MODAL_COLS":"1f284bb8ba2e7a26","HIST_MA":"bd063eb821a54183","HIST_RP":"bd063eb821a54183","histDate":"5b011c9b16bcad15","lastMa":"e2c153046ab8db14","lastRepair":"5ca5ee0e8994061d","PICK_SEARCH":"8cbe14b92bdb2687","pickModal":"a701d4cdd719c904","planCarModal":"fff2561755664719","moveQModal":"33bebc168ea891c7","FILLED":"fcb97b028896f49b","R2":"751190d6a2a7f839","A_Q1":"7a4767ae0c5bcf09","A_PICKS":"5adb8c13b5746ed9","A_OILS":"ed546218bcae4792","Q3_ADD":"d57dc26644fa1976","A_ALL":"66ef3cffe161ca7a","A_DRAW":"9da523bb46b483e1","Q_ALL":"d41556d218e0093b","WD":"47b323680fa4a69f","PROG_COLS":"e662f8fa42d9f266","partsProgress":"e9901ed558e31095","DASH_BOX":"81b1c7a98d3e645b","DASH_SCR":"c3400bf8736c4f8a","DASH_IN":"c3400bf8736c4f8a","VC":"e8e2d08ad57fecef","DASH_GRAD":"38f1983881125514","DASH_TONES":"108361cdcf3d40c4","dashAsof":"2edaa604aa6f4061","DASH_ARROW":"e34d95218604d51d","DASH_BIND":"52e96799f0ebe2b7","DASH_VAR":"85bfe216e8505743","dSolid":"efe0850922c4a3ce","dPaint":"d2c800b0bc88b851","bindDash":"561f2a906bf42988","dGrad":"66f87de103d8f715","dT":"b7ed14ebb2da6b39","dF":"56a2d31b0f97603d","dAp":"6b84d07f88e2b65f","dFixW":"71671004b2d3e093","dRect":"056bd980411c7566","dDot":"cc32647abf48ed74","dTxtW":"34bf4821933b6cfe","fIcon":"ab0cfc79113f422f","wIcon":"79ad24f64b3f3a9f","dFmt":"827f45dc93589a63","dPct":"42725f5cd1999daf","dashW":"0c5e8221e2427421","dashHead":"4f3071474eb151e2","dashAlerts":"570739f9c768c1e9","dashChips":"885bac1dbe70369e","dashKpis":"e1e46a7058194893","dashToggle":"275fc0f10948011e","chartCard":"38f3b99aa6f41365","chartGrid":"9c0b6b416559988d","dTrack":"6090d617042c678d","hBars":"427467b943f66300","dLegend":"ed18f0fd506d2242","donut":"3b04d966f4d95011","dNice":"2f1d22a7fc35faad","vBars":"4f7cfb0e8bfb242b","stackRows":"50b238742bc1ae61","dashNote":"a6e1eae4a420c61c","DASH_PLANS":"99dfe849e41befa6","DASH_TABS":"526886dbf091be1c","sortAll":"d64387553755d41b","i":"d64387553755d41b","DASH_AGG":"d41ada261b14fe3a","DASH_CAR_COLS":"b4cf91e73b73d09f","DASH_CAR_ROWS":"f02f012cb4be93a9","QST":"7711a41a05d1f80e","DASH_PROG_COLS":"077f8f9931f84a36","DASH_PROG":"abc15d89e9da1ebd","DASH_OWN":"d4c5afce3f101196","dashMine":"21e27efe0f0c749f","dashProgRow":"d39297cfb7e58c12","DASH_HINT":"23154d186bfc4788","metric":"7a770d6d363d3f3d","metricRow":"533cacf76b9185de","DASH_TABLE":"72dd51977fc9f013","planQs":"bc1ba4d57f36e8db","progOf":"cd348d09766c785c","DASH_NOPARTS":"94c7bb66cf459dd6","DASH_PCS":"05da0dd905f91592","DASH_LITRE":"05da0dd905f91592","dashStats":"56c3e578ab34dde3","partsDash":"91068f32b1359d70","EXPORT_CARDS":"4d6740179cc7ef0f","exportModal":"a45f926e33114888","docFrame":"90d6e98b346546c1","DOC_HEAD":"857a8493ac23e23c","dashPdf":"1fbfab1fabdf795a","dashXls":"a3f1e24c29561b22","TRIP_Q_COLS":"b3e7251a83792a74","Q_EXTRA":"57026f7f8fdcadde","Q_EXTRA_TOTAL":"4b23fe7bbee98418","Q_REMOVE_CONFIRM":"30a5fba7143b07d3","Q_DONE_JOBS":"d64387553755d41b","qAddModal":"96c0146d1b1f375e","Q_PARTS_EMPTY":"923913eff9b8346e","PLAN_NO_PARTS":"e6b79ae72f693619","TRIP_COLS":"b503dfc048a8613d","tripPlaces":"6a548a2daad78c58","own":"6a548a2daad78c58","tripList":"7d4827d2f342a346","TRIP_CAR_COLS":"03f1d2e047c4a771","TRIP_PARTS_EMPTY":"92ef09717adcfa73","tripPartsSec":"43c3c1de66df4b4f","tripForm":"ca9e509c51f7d47e","TH_WD":"300bc0612996887f","ptext":"4bc8e1b6b520bf39","k":"4bc8e1b6b520bf39","thaiDatePicker":"b25828fe58e16af4","TRIP_DATES":"47a5e8e682b5b707","TRIP_FILLED":"24f41803cd78e396","TH_MONTH":"e0e383c0bb56132d","dayOf":"5c83e9440a4ef6c3","monthOf":"5c83e9440a4ef6c3","workRange":"eaf94074ee684723","tripCarEdit":"2054c266ef935e54","rangeDays":"ff772d6f67063092","noTripCars":"cdcf731c28a39ad9","tripCarModal":"c4118ea60b0341b6","popupModal":"a324fd33e78c4a23","tblShort":"a2a2c13549f2fae7","JOB_T":"2c74123783288782","JOB_I":"2c74123783288782","JOB_START":"af68645c62ece44a","JOB_END":"af68645c62ece44a","JOB_BY":"af68645c62ece44a","JOB_MIX":"909c414f162086f1","JOB_CANNOT":"6388271833ea04be","TRIP_JOB_COLS":"bdc466f2ef5f6f80","JOB_MENU":"1f63ebfd44e40128","VENDOR_MENU":"47cbea37cc816244","EXIT_CONFIRM":"fd0331fb4516dc0e","CAR_REMOVE_CONFIRM":"1e7daa038330b1b2","tripDetail":"848f622323c7a781","TRIP_EXPORT_BTN":"d7a0ef956194155d","TRIP_SHEETS":"1255426e01042877","tripExport":"15ba714efa3c67ba","tripDocHead":"6983af37c416388f","tripPdf":"07610ce1a13872b2","tripXls":"4c23830222d042ef","OIL_FILE":"a2ee2a52bd75d75b","OIL_TAG":"2ddbc1d13787e786","OIL_SAMPLED":"49c194319cfe6d99","oilResult":"009e75c0d7b66af1","SAFETY_TYPES":"d0cd4a964f2cbdb1","JOB_TYPE":"d0cd4a964f2cbdb1","SAFETY_FILES":"8a96f36adfc6770e","SAFETY_DONE":"47618945d91a8693","safetyOn":"2e69fb44d9effc38","safetyDocs":"323ea27ba1e9a517","JOB_COLS":"418772cf903ad52e","JOB_OIL_OPTS":"4fe1da46ebf9fea0","JOB_OIL":"4fe1da46ebf9fea0","lastOil":"d7e5baf5e66e0dc6","TRIP_OIL":"2e42a3cebaa0f1dc","oilDateField":"0e626814fb5d2140","jobOil":"62c6f7994afe05d4","jobWork":"e2256f4fdeeb887d","jobBoxes":"3a2a454dd0445cfc","jobPage":"f38a1d06a8ada2c8","RET_COLS":"19a368f744679758","retRows":"54fa7f81dfd055c1","CANNOT_USED":"158dbbb6ff203c4a","retTable":"9ebc97b7bf4e2c7c","cannotModal":"aac95c06f0b29d03","HIRE_T":"c404d0cd8ff4999c","HIRE_START":"c404d0cd8ff4999c","HIRE_WHY":"28399a04de967b09","HIRE_ST":"71727e70ff20c49f","WORK_COLS2":"d70f7448f782e127","HIRE_DONE":"a6f8026da4db5101","HIRE_CANNOT":"a6f8026da4db5101","HIRE_BY":"266823b7507e4cd8","HIRE_TECH":"266823b7507e4cd8","HIRE_END":"266823b7507e4cd8","HIRE_SENT":"266823b7507e4cd8","HIRE_REPORTED":"266823b7507e4cd8","HIRE_BACK":"68e2788b43f2d4be","HIRE_BACK_CANNOT":"2d755d5cce2f61b5","HIRE_VENDOR":"a3ef526452a3fcd3","vendorSign":"d7150e383cbc4715","vendorJob":"ef94cf14b672680e","HIRE_SEND_CONFIRM":"dee9e615356ce605","EDIT_ICONS":"684309b97f3030f1","PART_K":"684309b97f3030f1","photoFiles":"3794a3b83c9b95ac","partEditModal":"e5d71f6a12b17684","ADD_PART":"43bd44498a974537","partAddModal":"82a93bcdd25f4da6","PART_DEL_CONFIRM":"bcf39d03f9e0bc9c","CLOSE_PARTS":"ca01818fe4d64735","CLOSE_PART_HEADS":"f1fa5d3b977314f9","CLOSE_DOCS_REPAIR":"87aff5808706e596","CLOSE_DOCS":"ba16f9e7db3e8306","CLOSE_DOC_SEL":"8864944ab88dfcc0","CLOSE_PRICE_COLS":"f031a4c7d19229ae","closeParts":"0e74d23ed4eb5402","closeDocs":"70fbf65811de58b9","CLOSE_COST_BY":"1d03a42a1a790c53","CLOSE_TRAVEL":"59d08a4b21ded13a","CLOSE_HOURS":"a89130fe6591e207","CLOSE_RATE":"a89130fe6591e207","nf":"d83ffab816d679f3","personSum":"77c0b364ff0f597a","costSum":"a00f6e3e75eb5450","CLOSE_COST":"95fd0c0b93be4cf4","OWNER_CC":"0337a657a0ee78e8","BUDGET_CUT":"8fe3a61892dff31e","OTHER_CC":"71908a59c58f3528","budgetPick":"4c5f58f9f17df962","closeCosts":"43dc661f9f4d4def","RECEIPT_ITEMS":"bceac49221e8acae","SIGN_OWNER":"d528215516767838","SIGN_DATE":"d528215516767838","ctrlCell":"52d71d2937030c06","checkTable":"c62f46704c413cf2","radioCell":"11a6fbfe4c55dde1","checkCell":"90addcfc334bcdd9","noteCell":"4ae18ad8c0c5e06b","checkCard":"4c235d4cec7e75ae","RECEIPT_NOTE":"f3534789a3a05185","RECEIPT_BAD":"f3534789a3a05185","signSection":"2c9ffbd3e6f0c2b9","SIGN_IN":"ac570be481dfc3b0","SIGN_OUT":"1bbec0b4f3d3dbb7","putText":"b5ef4802aa532b69","signFix":"e3ca231dc240784a","signModal":"92489ea366b1474c","BUCKET_ITEMS":"67d6034aaa0123cc","WATER_ITEMS":"fae38e0d9cebfe56","WATER_CAR":"1180de321baf3736","brandModel":"3fff2614d23df4a9","inspectForm":"39795b6ff59ec475","INSPECT_NOTE":"66b5c82f9a272ef6","INSPECT_FIX":"66b5c82f9a272ef6","inspectStep":"c51af1c95fdf5fd7","SIGN_INSPECT":"b50dfcccbfc5572b","receiptPanel":"9eeee920d4946c9b","inspectPanel":"ec21c154bf53db36","MT_STEPS":"7a40341fd12a4445","headPill":"a3273db044240807","mtStepper":"0cc4dea523ca786a","stepPage":"817abb23f24ed56f","workDetail":"84b855e1f1232db7","MA_DUE":"80426555b44ab15b","MA_ITEMS":"2eac0ed3fc4652da","MA_CYCLE":"ce594c1d97011694","MA_TODAY":"11eafaf1d74ccf46","MA_NEAR":"11eafaf1d74ccf46","maD":"258cebd11f07b516","maAdd":"8a5444a39a0ee77c","maKey":"90f13efd4c2febad","maStatus":"4bc8e1b6b520bf39","now":"4bc8e1b6b520bf39","near":"4bc8e1b6b520bf39","MA_ROWS":"b37580417185d6ac","maDues":"98b1175638e61f94","maNext":"d60cc1e6f55825a8","maOil":"cdec2ff665426704","toneOf":"cfb235f7875f193a","MA_VSTAT":"ef9eb091aacbbb21","MA_USE":"5f4f31402bc227fb","MA_COLS":"636e1ecbfe3ba17b","maRow":"d7af542e17c2090c","maIdx":"3212fd047b2fa7da","MA_DUE_N":"4e5898a9f1565220","maTabs":"59f76346b69a69f4","searchNotFound":"9e7a75226232c3b9","maDate":"963ea620a5c13776","MA_NOW":"248aa0e42ad3c6f5","maUnit":"887eac554332c003","maAge":"37c555bf2c522393","maState":"8e27cbbd05264cec","MA_STATE":"3af48e2e144a3655","MA_OILRES":"de316c1c9caac482","MA_AGE_GROUPS":"0df419428107033b","TH_MON":"17d6c25dcc658d66","maOilDue":"58e38e06619c4f7b","maDays":"d0b096e35c66d903","MA_ALERT":"e1f409233bb22fce","maPlates":"ac6179f07b929b24","maStats":"a85f3fa1e7e6119b","maList":"91068f32b1359d70","MA_LAST_OPTS":"33a220cb32a4af59","MA_WITHIN_OPTS":"028adbdb347e336f","MA_CAR":"d9b6fabf87b5a52e","MA_VTABS":"73ef84afc1166712","MA_NEXT_COLS":"0620b50067eb56d0","maNextRows":"44129fcf8cac0cfb","last":"44129fcf8cac0cfb","MA_HIST_COLS":"05cfb577f4c90f47","MA_HIST":"1a043f0cbf512f23","MA_WAR":"f95c3f10ef3a56f4","MA_REPAIRS":"0e37e7e8eecf670d","MA_WAR_COLS":"d5c5e62d91d03898","MA_WARRANTY":"c53ee60b883ff37c","VI_CHASSIS":"5beed4ca0a8a07ef","viPad":"ee6dbd3744769f09","viId":"ea5116e0e3fd51a1","viDigits":"da28ee5382682b41","viNum":"c1cd9f0426f2c3aa","VI_SIDE":"655c63b9c8ffaf7b","VI_EQUIP":"655c63b9c8ffaf7b","VI_PREFILL":"655c63b9c8ffaf7b","viSide":"cbee3c012b8d44d5","viMachine":"233b12f9656eb925","viMonths":"293508e6eda273aa","vInfo":"34ddd1b18ded1877","VI_HOURS":"6bbd469d1a42ed25","VI_NO_LIFT":"85c9dd8d0da03016","vMachines":"74ed4d5fb7200e31","VI_ENGINE_WORK":"4249de90f1212460","vEngine":"652665a71e76d832","VI_ENGINE_COLS":"32184632a0aaedee","MA_KIND":"810d4cf141ed2eb2","MA_REPAIR_COLS":"4e6134b11cd9306a","vService":"a5004d1ed2e7cc38","VI_BORDER":"cf9f8299a875890d","viBorder":"f4eeef20f81067d3","viSubtle":"8b6f7a2090e8f41f","viCard":"6d120e688b758588","viSection":"b9511b5f0755dd87","viBox":"6aae7b8115f21d7e","viCardRow":"c0b652ed5eb27d94","viLabelWithButton":"229fb339c9014a2b","viMachines":"dfec09735ebca191","MC_OK":"43d85d5cdfa4fa49","machineModal":"145ce414eecdbcda","viFleet":"923afcf31d565bbb","viLastUsage":"2fe850ebfef55e4f","viWarranty":"7ddbe6f1f8d34d27","vehicleInfoTab":"8d4a716690bf177b","maShell":"67581b42afde1606","maDetail":"d99a7dd85bc633f0","PLAN_TABS":"c4f564b3aa8495c5","COST_CANNOT":"124e57c0e2d69396","COST_V":"6ff73440e66cbff2","COST_X":"8fa7e986c471e9f0","costLabour":"b635c20de9695f6c","costTotal":"f86506dfb63c4e52","COST_COLS":"b40e85b76ee60769","costRow":"618fc85382bbb9bb","cc":"618fc85382bbb9bb","QCOST_COLS":"7c5b0a6bf896f7d0","COST_ALL":"171967622010a861","costSumOf":"b26d9db12c626684","QCOST_ROWS":"34b3bfc7e41416ff","z":"34b3bfc7e41416ff","costMetrics":"703a3b38085b3fad","tot":"703a3b38085b3fad","COST_EXPORT_BTN":"58c6206e68b37e93","costBody":"a6e79acd8c073fc7","costScreen":"9c69b6d2b89af2b4","COST_SHEETS":"22dde9a6b5f0f33c","costXls":"c506ad941c4cc9f3","tabs":"3ce3b5686db056a3","roleList":"1a52a5761bc7bfba","reason":"bb7fc0e6d57087a2","GO":"3a1b61aa30731871","TRIP_VIEW_COLS":"cb0ca6c7214d52b3","tripCarIdx":"562496cb9925fbd7","tripCarRows":"9f1fa34ca9f704aa","tripKv":"8bb5b2d49fe3ae7a","TRIP_REVIEW_COLS":"4e35aceaa3e5955a","tripReviewRow":"915cae0f02a00b37","TRIP_OTHER":"886882fd4f621de7","REVIEW_TABS":"3ee4972598906e65","TRIP_OK":"dd0194aa4e1290dc","TRIP_RET":"dd0194aa4e1290dc","TRIP_PENDING":"ad1b053d99cdd807","tripReviewList":"bdde1b9d13db0588","tripReview":"ead7f64f238f440d","propVal":"fc7c5633f3a3cbec","bell":"4616ecb8712d5d81","fillNotiItem":"1f6124a96e74e126","notiPanel":"7332c3006aa083ff","OWN_UNIT":"cbc4660bd6b0f162","ownCars":"aead94c2049fa355","NOTI_KRY":"74cc0b4896bcdad3","NOTI_OWN":"872b9efa494ef780","NOTI_OLD":"3de7693b1004b60b","TRIP_SEEN_COLS":"5ca7a674ebde2df3","tripSeenList":"74c6e376b593c401","tripView":"610347f133bddbf9","NP":"3e0bbabdd36945cb","NO_NEW":"a3e775ae6f9ec7ab","npKv":"71b7e9c685eaa405","VEH7":"6031e9a12d212461","REVIEW_COLS":"d4bc744d4f11ca08","reviewRow":"fe54c75bc81fa12c","REVIEW_ROWS":"701be018b7b13fb4","REVIEW_DONE":"6389781718da85cd","REVIEW_RET":"6389781718da85cd","planReviewList":"bfda30f05dd42a89","PART_CHECK_COLS":"9e00d8a94a65953d","partCheckRows":"0d45dbba27c76ad8","planBody":"e9efabf402e5c2d1","decisionSection":"60a26d8fcb0f3354","planQParts":"517ed5c72e41947a","planPartsSec":"df7709cb5d371e04","planReview":"1b8b92d425bc44c7","WH_QS":"242876be8c718ace","wst":"b82b23c7fff8b73a","WH_COLS":"8ac6d0865c9a8174","whRow":"4ce8ad44f42c4d0d","WH_PART_COLS":"5cb3e5cd21b54d63","whCars":"a9a52187a9c04862","whParts":"ca2a4a3ba7c81335","need":"ca2a4a3ba7c81335","warehouseScreen":"f1c823fc8c8c6d45","planAs":"e5a37879b7e4c8c4","RETURN_REASON":"8d81ca4a20aca1f8","ALERT_RETURNED":"6ee288eb08dc636a","ALERT_APPROVED":"9a6f1964c779ff9e","Q_CARS":"3a8b895e1098414f","CAR_ADD":"3a8b895e1098414f","PART_BM":"36577e460c720d0a","MANUAL_BM":"381c1c09140f68eb","OIL_GRADES":"72cf3df844a893bc","CARP_PART_COLS":"f846aefb1e016f8c","MANUAL_FIELDS":"004c16e8c9262622","carWarehouse":"ce6683c8cdfb82ba","CARP_SEL_COLS":"0ebad10abb993bc3","carPartsScreen":"c539f2e2e69f27be","carPartsView":"e62754affd9f3742","EDIT_FORM":"a7ed957353d233aa","EDIT_CONFIRM":"5aa9dae78246c1d8","DELETE_CONFIRM":"2bf85251ec15cb97","planMenu":"7812268025139ff9","planDetail":"8f0e56e1ab9bc42a","Q_BTN":"cb334aecce01f8de","P_Q":"321ffc4181dc1f4c","P_COUNTS":"410d24700a4eea7f","pQty":"790220c90a6bc33b","pQParts":"e39652cd565e7a94","planDetailQ":"a38232206ce70022","PO_ITEMS":"b47de1cd10f9c273","PO_TOTAL":"332121a1d60f2250","PO_KV":"a29849ba14bde19a","planIssue":"f2b1538285f5c62d","headPartCheck":"7f4b86c9e7b7e48f","poForm":"df29bbc37c78eda2","HIRE":"725d85a84f4a29fc","CONTRACTOR":"09cb959fcdf21a12","TRIP_ST":"4e300ee38d4131c5","HTRIP":"9d96993f4ac24554","JOBS_COLS":"dad759a48da60b41","jobsRows":"c62efe62cdf3fe08","hireTripForm":"7d2f897c2178a057","HT_COLS":"3f6f2a8b225f3a68","HT_ROWS":"b23c2ca3e9c6e092","hireTripReview":"7acc47bb3d1261c1","PREP":"ab4205e6922b938e","PREP_COLS":"df16e9c083b92f47","prepRows":"8ba75220af8e78e8","prepDetail":"101b3ac61e989b10","ACC_COLS":"4df735468cb7bc4b","ACK_CARS":"004c86a882a93653","ACK_LIST":"7bf00772e5370110","accRows":"0c5dd5c3738927c7","ackList":"b8bfb3ba722fcf4f","NOTI_ACK":"e9e286c98266f9ea","NOTI_OIL_FAIL":"77542e39122a49e6","ACK_VAR":"cd5986fe0dfd5b60","ackRow":"e8791a230f8ec819","ackResult":"38191a80f3714269","MOVE_ICON":"eb9722c0fbafb3ee","MOVE_ITEM":"29581425f7adc75a","MAINT_ITEM":"a4f1c6fc0fde74df","MAINT_CONFIRM":"be7a3a67b4c20ada","MAINT_TOAST":"abacd1df3b851a18","MOVE_I":"eb1c7787c8a3a8f2","MOVE_CAR":"eb1c7787c8a3a8f2","MOVE_JOB":"86b65ff400605465","qName":"690d673041fef3d7","MOVE_TO":"d611f8f70f4fc9df","MOVE_TOAST":"fd43a9f2479b0d2b","MOVE_CONFIRM":"b4ddc7edddd212c1","movePartRows":"86a69fdf22bfbc76","MOVE_Q2":"8f47ec0f50660e3e","MOVE_Q3_OTHER":"886a6db2e406d4dd","moveTrip":"3d53e2365089cd2b","MOVE_T3":"bf998508b26a3677","MOVE_T4":"bf998508b26a3677","MOVE_Q2_BASE":"033a4ec889e354cb","MOVE_PART_OF":"be711f09f2bb2b54","MOVE_Q2_QTY":"6e1d1eaca0d35bc7","MOVE_Q2_SUBS":"0d566b7208653731","MOVE_Q2_PAGE":"892e2e483762df19","MOVE_CAR_QTY":"46f277f0fd9b5ca7","MOVE_Q3_QTY":"c4e6909229948b01","moveMenu":"10509bcdb35511ea","moveCard":"fdf875f6d38f070b","moveModal":"887825642ac3e4c8","moveQuarter":"ae245b7c34bb1bde","M_PANEL":"1c59b848292e3a58","M_AREA":"d89c419e622fcab4","M_HQ":"a466282ad6f9216f","HQ_CAR":"a246529e39e92629","A_PLAN3":"94d43b912d2b0be8","HINO":"c1edf3dd338013fa","P1":"0f03f0cd654090df","P2H":"c7fe1272804e2677","P3H":"dbec0f5c6b491a8b","P3":"5e4461b36b208e92","IN3":"db1cb9ee57245cd4","A1_ROW":"f9eb0fe5db5fe846","A1_PLAN":"befbb47e07fb17d9","NOPARTS_PLAN":"ca21f69fee65aacc","Q1_OPEN":"af43de6adfc5ed8b","plus":"df84d60c42c08c54","IN4U":"585d2952ab925b78","U1":"b21f732078e8ed4c","without":"a7db02887ae59906","FIRST_MENU":"e4883cf7d16f4bed","ALL_MENU":"af6fd9ee8f9a360d","toast":"c586d898f174b491","Q_MENU_LABEL":"1bd8ed97101e91bd","S1_SUBS":"a49872f22cecb81d","SCENARIOS":"91068f32b1359d70","FLOW_NODES":"f58fde8de4a56bdf","LETTERS":"75f20bfc4d367783","BLOCK_OF":"1c0911ffb695d5e2","SUBS_OF":"e0fe92929199bc74","GROUPS":"91068f32b1359d70","SCREEN_COUNT":"91068f32b1359d70","PAGE_NAMES":"b07610da2ac2dac2","BLOCK_H":"a18021eede6ad30b","CUT_BLOCKS":"7c5a3713859deceb","cutHit":"5814a11702ed7613","purgeCut":"85c510865ffdc2d4","archiveCut":"63af5a94c6d7af35","moveLatest":"c2220bdc20cd5e17","buildSet":"91068f32b1359d70","build":"91068f32b1359d70","buildDesktop":"09a75739c749b746","buildMobile":"913909bd3dfb7ed4","buildPick":"69b9a3c8fe64fe65","FRAME_RE":"7e37bd42096e34d1","findState":"809385b2b075495a","replaceSelected":"abdece475c6dfecc","journeyCodes":"a4f7bdfb101fe148","buildJourneyAll":"aca034157eb79a0e","clearPrototype":"0718091cb6a68601","SCEN_SEQ":"8e5e595cdb4a80b2","SCEN_REVIEW":"60ab871094e4ff2e","SCEN_UPDATED":"38315d8613d5c097","SCEN_CUT":"834c4a3ae1e140e2","SCEN_COLS":"c9f459b6390edda5","scenData":"c2e3ad2e885e62b3","UC_COLS":"928c5ae8b3239055","buildSwimlane":"859272f58d267665","buildActivity":"7f42b028ac16824f","buildDocs":"5f406cae1c00adf8","SIG_SALT":"3aa0e0f2e210a026","sigHash":"078f1d8f6efe67e2","sigScan":"8b13d0d4fe32f00f","SIG_DECL":"6ac5796ce71390a7","SIG_STMT":"7e11f55de50d88b7","sigTargets":"2ef9bfeeabce3728","sigChunks":"2503bb1e952ae476","sigDepHash":"fa25d2305157f235","sigOf":"8a69a9b1b32680b1","sigSourceOk":"e648e59d2c1af190","FEATURE_PREFIX":"b96faf62d3d77d9d","PAGE_GAP":"cdb223005607b3d7","F":"0949fcbdc6d5b49a","FEATURE":"0949fcbdc6d5b49a","HAPPY":"0949fcbdc6d5b49a","FEATURE_TOASTS":"0949fcbdc6d5b49a","FEATURE_TITLE":"0949fcbdc6d5b49a","FEATURE_PAGE":"0949fcbdc6d5b49a","SCREEN_FN":"0949fcbdc6d5b49a","FJ_DIR":"0949fcbdc6d5b49a","FJ_BOARD":"0949fcbdc6d5b49a","FJ_TITLE":"0949fcbdc6d5b49a","SCREEN_CACHE":"4a1f9555b2d7568b","screenFns":"215b31bdbfc99ecf","useFeature":"16db2a3f0b2943e6","ALT_PAGE":"7014c92ca91872b9","ownedNode":"f35bfe862aded57e","featurePage":"e04189e6c6c937b9","LABEL_WARNED":"e84d673671202584","checkLabel":"f35d6981af3c126c","happyCount":"f92eb23e9deced37","happyPages":"458898ddc07b03d1","toastScreen":"18198564b92d9b9e","ROW_X0":"8cc8079233cb4b7c","featurePages":"7388199367e18363","featureCount":"f1122448a8dda10c","rowEnd":"705e2779c062c144","featureTitle":"9ac179fb1e5d837b","PH_INPUTS":"c18a0a70f498349c","showPlaceholders":"e1893320e062754b","OVERLAY_NAMES":"addf990c3291f69a","isOverlay":"7e266fc7eb207811","hasOverlay":"b3c43341fbcc0c9d","capped":"cd76c0322ecc3105","capOverlayScreen":"0f0ddfcc483dea7d","desktopHeader":"eab4754af32503c0","MF_TAG":"c0fbfd01e39e1ddd","orphans":"60892a77eb1b10e3","sectionTitle":"a6e97aff4c588f38","MAKE_BASE":"7e90c5c257a0adfa","screenName":"80a531db6f814f7e","itemSig":"87348005af30f41b","makeScreen":"ca5f383e9e69f7da","featureGrid":"6cf1ffc4270666df","LKEY":"653d87d9c3b47898","LABEL_DEFAULT":"8592f10b5fdadd31","LABEL_PICK":"1a9e05efb15b9316","LABEL_ERR":"f99315e6630db7c7","LABEL_KNOWN":"f99315e6630db7c7","labelKeys":"8ee9e005c81677a8","rememberLabels":"4d963be64183ac2f","importLabels":"674a806fc77d43be","resolveLabelsOnly":"b26f6539dc12887b","secs":"032cdc6098220bcd","preImport":"39d301625f72df57","RESOLVED":"fa81f2064daa966f","resolveFast":"637c03fe239b81df","buildFeature":"af63d42d23ff7f66","FJ_RE":"ef45a56ddef23541","FJ_COLOR":"984cbd97fc616026","fjKey":"092d06eae3270a74","fjShots":"51a9dce8a739f472","fjSection":"21b59d971e55dfb4","fjBoards":"18b4c3af2c85b231","exportFigJam":"ab881bd521efa926","LABEL_RE":"ec91c1d4f124b099","HEAD_RE":"a3c640cb69289825","headerBlock":"a53c5622348b9ece","BAR_RE":"e7a51461981ec488","CODE_RE":"f6844f669d56d4b3","barState":"8067c189daadc148","DEV_WORD":"878323a7b5bbb898","texts":"fd8e13bd8b57a5f7","isGrey":"1dccbbd5e54c0edf","mainOf":"286d25271bc445d2","devTypeOf":"e1c12802956d775d","newKeyOf":"6c2250edd6063cf6","classify":"39a4c2f94607c016","scanLabels":"6070751d01cdf786","singleDeviceInfo":"493aafe89d02e322","singleDevice":"3f04dccddbcdab61","checkMade":"bba3b6668c39f9ca","dropMade":"81c65ee7a6df952c","patchLabels":"f79842d0d676a9a9","labelReady":"40ebb6e0b60e90f3","labelPreflight":"95db345da2b8d25e","exportAll":"17e2e42569bd3e7f","featureList":"6888667303705814","FRAME_CODE_RE":"1d9bd90992a85200","SECTION_OF_TAG":"559a3ff5bf0be517","PART_NAME":"7f2b6e61a9d9264b","tagOf":"55580f4f86c6d7d0","pdata":"ca2f3a2dd101c4a7","absOf":"1523bcb210c2bb4a","existingPages":"b7d0a6c8c84d137e","hasScreens":"ea9cb81272003974","existingPage":"ed7c585794152c0c","walkPage":"e74c54b7fb196ed2","sectionPieces":"256ea0865e4de3a4","deleteSections":"9a7e431c91093181","done":"d8df35795ac89273","featureItems":"0bfc2a79a0939d6c","pageFrames":"4ebfea456b16f353","OVERLAPS":"f9301ba2dbe7b443","replaceFrame":"316b50ed19154284","refreshBar":"7547c3ff207bc5ee","slotFor":"bf24009b485faf64","BUILT_AT":"2bf90de52ed0c5d8","updateChanged":"e9b5dafef477078b","matchItem":"8e26dd1014f745ac","rebuildSelected":"5d03f699e0643bcb","updHandle":"f696ae0384eafcd3","FJ_EDITOR":"2dd6fde352f22ff0","TGT_KEY":"f09d23fafa442d39","tgtMem":"828308a37499b4ca","tgtLoad":"16a93e64957cc6dd","tgtSave":"ffa647fb14868dcb","tgtPost":"182721f78332ddfd","tgtCurrent":"9ecc080d25ea1a25","tgtFromUrl":"ac124868b002fc8a","tgtHandle":"faf72ffaf8461f68","fjBuild":"19ff042829f59de1","IMAGES":"01fb88f20cb13823"},"plan":{"LIST10_EXTRA":"ce76629872862750","dmy":"c727a2c6b9b597d4","byDate":"b657d64b169ed800","EXTRA_MR":"fb0e8e143a4df7dd","EXTRA":"911487d283039dda","unitPool":"9b1c993aa2a09270","KBK_POOL":"0daed222233b36b3","rows10":"cfd916ffa8107a9d","LIST10":"74aef738e3514ce2","PLAN_ACTIVE":"b2df005626c4866c","OWN":"63f3375ae97c8fc4","LIST_OVERRIDE":"474ea31788ab9be2","HAPPY":"d6f3615363a87f90","FEATURE_TOASTS":"db5165f829ed9901","FEATURE_TITLE":"2ce5b9c1b619fcd2","FEATURE":"16859c788968b620"},"trip":{"TOASTS":"59b8301b013b11d9","SCREENS":"603f1f275b7469bc","HAPPY":"a0f943348c976d42","JOURNEYS":"f60aa82458d39a77"},"job":{"TOASTS":"49df94d1cea41070","SCREENS":"4634f919d4b8e002","HAPPY":"0a4ec7587738e91b","JOURNEYS":"5b387a7a108e2710"},"close":{"DETAIL":"ec65e705f3063ff9","XLS":"ec65e705f3063ff9","TOASTS":"f2a53005c5739a69","HAPPY":"dc7720f6286bbe6f","JOURNEYS":"a32137767ebfaec9"},"track":{"DASH":"b1bbbfdb9d3eb81a","PDF":"b1bbbfdb9d3eb81a","XLS":"b1bbbfdb9d3eb81a","MA":"20b03d086019cc8e","MAD":"20b03d086019cc8e","TRACK_TOASTS":"85cd8bed33f19ee1","TRACK_HAPPY":"d4603adc3ce799a3","TRACK":"c2a6e71d4866e6b2"}};
const MF_BUILT_AT = 1794983291914;

/* ======================== maintainance-feature-plugin/feature.js ======================== */
/* ============================================================================
   maintainance-feature-plugin/feature.js — จัดวางจอของ Feature แผนบำรุงรักษา ตามหน้าและ case (13 พ.ย. 2569)
   ----------------------------------------------------------------------------
   ต้นทาง: Diagram/01-บำรุงรักษาตามวาระ/32-บำรุงรักษา-feature-แผนบำรุงรักษา-สำหรับ-dev.md
   ไม่วาดจอเอง — เรียกฟังก์ชันจอของ maintainance-plugin/screens.js (งานของพี่นุ) ผ่านรหัสจอเดิม (A.3 · R.6 …) ⇒ หน้าตาเหมือนชุดเดิมทุกจุด
   ต่างจากชุดเดิมแค่การจัดวาง:
     · แบบตัว Z (ผู้ใช้สั่ง 16 พ.ย. 2569): Title หลัก → 1 journey = 1 แถวยาว เรียงหน้าตามทางเดิน (คร่อมด้วยแถบหน้า) → จบแล้วขึ้น journey ถัดไปด้านล่าง · case ในหน้าเดียวกันห่าง 200 · คนละหน้า/คนละ journey ห่าง 500
     · ไม่สร้างทับ ไม่ลบ ไม่ย้ายของเดิมบนหน้า (ผู้ใช้สั่ง 16 พ.ย. 2569) — วางชุดใหม่ต่อใต้
     · toast = เฟรมโปร่งขนาดจอ มีแค่ instance Notification มุมขวาบน ไม่สร้างทั้งหน้าซ้ำ (ผู้ใช้สั่ง 13 พ.ย. 2569)
     · case ที่หน้าตาซ้ำกัน (R.2 = A.22 · S.4 = A.20 · S.6 = A.21) ไม่สร้าง
   สร้างบนหน้า "Maintainance Feature" (ไม่แตะหน้า Maintainance ชุดเดิม)
   ประกอบด้วย  node figma-export/maintainance-feature-plugin/build.js
   ============================================================================ */
const FEATURE_PREFIX = 'MF';
const PAGE_GAP = 500;            // ระหว่างฉาก/หัวข้อ (case ในฉากเดียวกันใช้ GRID.colGap = 200) · ฉากละแถว จึงไม่ล้นขอบ ±65,500 ของ Figma


/* หลาย Feature (17 พ.ย. 2569): ค่าของแต่ละ Feature อยู่ที่ features/<id>.js ลงทะเบียนใน MF_FEATURES (build.js ประกอบก่อนไฟล์นี้)
   useFeature(id) สลับตัวแปรด้านล่างให้ชี้ Feature ที่เลือก ⇒ ส่วนจัดวาง / happy flow / toast / FigJam ทำงานเหมือนเดิม */
let F = null, FEATURE = [], HAPPY = [], FEATURE_TOASTS = {}, FEATURE_TITLE = '', FEATURE_PAGE = [], SCREEN_FN = {}, FJ_DIR = '', FJ_BOARD = '', FJ_TITLE = '';
const SCREEN_CACHE = {};
function screenFns(f) {   // รหัสจอ → { fn, label, sub }: จอของ scenario ตาม GROUPS ของ screens.js แล้วทับด้วย f.screens
  /* 18 พ.ย. 2569 ฐาน origin/main ee11614: ไม่มี flatScreens (เส้นทางย่อยของงานค้าง) แล้ว — อ่านรหัสจาก GROUPS ตรงๆ แบบที่ buildGrid ของพี่นุใช้
     scenario ที่ไม่แบ่งเรื่องย่อย: รหัส <ตัวอักษร>.<n> (B.3) · scenario ที่แบ่งเรื่องย่อย (SUBS_OF · S1 R108): รหัส <ตัวอักษร><k>.<n> (A1.7) */
  const out = {};
  for (const tag of f.scenarios) {
    const g = GROUPS.find(x => x.subs[0].tag === tag);
    if (!g) { warn('Feature ' + f.title + ': ไม่พบ ' + tag + ' ใน screens.js', 'ข้าม'); continue; }
    for (const sub of g.subs) sub.screens.forEach(([label, fn], i) => { out[sub.code + '.' + (i + 1)] = { fn, label, sub: sub.title }; });
  }
  for (const [code, fn] of Object.entries(f.screens || {})) { if (out[code]) Object.assign(out[code], { fn, own: true }); else out[code] = { fn, own: true }; }   // own = ซอร์สอยู่ในไฟล์ Feature (ลายเซ็นหาชื่อใน scope ของ Feature)
  return out;
}
function useFeature(id) {
  const f = MF_FEATURES.find(x => x.id === id) || F || MF_FEATURES[0];
  if (f === F) return f;
  F = f; FEATURE = f.journeys; HAPPY = f.happy || f.journeys.map(() => []); FEATURE_TOASTS = f.toasts || {}; FEATURE_TITLE = f.title; FEATURE_PAGE = f.page;
  SCREEN_FN = SCREEN_CACHE[f.id] || (SCREEN_CACHE[f.id] = screenFns(f));
  FJ_DIR = f.fjDir || 'flow-maintainance-feature-' + f.id; FJ_BOARD = f.fjBoard || 'board-maintainance-feature-' + f.id; FJ_TITLE = 'Feature ' + f.title;
  return f;
}

/* Page ของ Feature (ผู้ใช้สั่ง 17 พ.ย. 2569 ชื่อ Page = ชื่อ Feature อย่างเดียว) — ไม่ใช้ namedPage ของ core เพราะมันหยิบ Page ชื่อตรงมาใช้ทันที
   ใช้ Page ชื่อตรงได้เมื่อว่าง หรือมีแต่ชิ้นของปลั๊กอิน (MF / … · MF · …) · มีของคนอื่นอยู่ ⇒ ใช้/สร้าง "<ชื่อ> (พระผู้สร้าง)" ไม่วางปนของคนอื่น */
const ALT_PAGE = (n) => n + ' (พระผู้สร้าง)';
const ownedNode = (n) => n.name.indexOf(FEATURE_PREFIX + ' / ') === 0 || n.name.indexOf(FEATURE_PREFIX + ' · ') === 0;
async function featurePage(create) {
  const name = FEATURE_PAGE[0], byName = (n) => figma.root.children.find(p => p.type === 'PAGE' && p.name === n);
  const alt = byName(ALT_PAGE(name));
  if (alt) { if (alt.loadAsync) await alt.loadAsync(); return { page: alt, fresh: false }; }
  const same = byName(name);
  if (same) {
    if (same.loadAsync) await same.loadAsync();
    if (same.children.every(ownedNode)) return { page: same, fresh: false };
    if (!create) return null;
    log('· Page "' + name + '" มีของอื่นอยู่ ไม่วางปน ⇒ ใช้ Page "' + ALT_PAGE(name) + '"');
  }
  if (!create) return null;
  const p = figma.createPage(); p.name = same ? ALT_PAGE(name) : name;
  return { page: p, fresh: true };
}
/* รหัสจอชี้จอที่ตั้งใจไหม (18 พ.ย. 2569 ย้ายฐาน: รหัสเดิมชี้จอคนละจอได้โดยไม่มีคำเตือน เช่น V.6 L.4 Q.1) — case ใส่ชื่อจอใน SCENARIOS เป็นช่องที่ 3 ⇒ ไม่ตรง = เตือน
   เตือนครั้งเดียวต่อรหัสต่อ Feature (featurePages ถูกเรียกหลายรอบ) */
const LABEL_WARNED = new Set();
function checkLabel(code, want) {
  if (!want || code.indexOf('H:') === 0) return;
  const s = SCREEN_FN[code], k = F.id + ' ' + code; if (LABEL_WARNED.has(k)) return;
  if (!s || s.label === undefined) { LABEL_WARNED.add(k); warn('Feature ' + F.title + ': รหัส ' + code + ' ไม่มีใน screens.js (ต้องเป็น "' + want + '")', 'ข้าม'); return; }
  if (s.label !== want) { LABEL_WARNED.add(k); warn('Feature ' + F.title + ': รหัส ' + code + ' ชี้จอ "' + s.label + '" ไม่ใช่ "' + want + '"', 'ตรวจ features/' + F.id + '.js'); }
}
const happyCount = (list) => list.reduce((a, j) => a + (HAPPY[FEATURE.indexOf(j)] || []).length, 0);
/* แถว happy flow ในรูปเดียวกับ featurePages (กลุ่มหน้า = ขั้นที่ติดกันในหน้าเดียวกัน) · รหัส H<journey>.<ขั้น> */
function happyPages(ji) {
  let x = ROW_X0 + GRID.side + GRID.gap, n = 0; const pages = [];
  for (const [ref, label, pg, want] of HAPPY[ji] || []) {
    checkLabel(ref, want);
    let cur = pages[pages.length - 1];
    if (!cur || cur.name !== pg) { if (cur) x = cur.x + cur.w + PAGE_GAP; cur = { name: pg, x, w: 0, items: [] }; pages.push(cur); }
    n++;
    const ix = cur.x + cur.items.length * (GRID.colW + GRID.colGap), s = SCREEN_FN[ref];
    cur.items.push({ code: 'H' + (ji + 1) + '.' + n, x: ix, label: 'ขั้น ' + n + ' · ' + label + (ref.indexOf('H:') === 0 ? '' : ' (' + ref + ')'), fn: s ? s.fn : null, old: ref, scope: s && s.own ? F.id : '*' });
    cur.w = cur.items.length * GRID.colW + (cur.items.length - 1) * GRID.colGap;
  }
  return pages;
}

/* toast เฟรมเดียว: เฟรมโปร่งขนาดจอ (1440 / 402) มี instance Notification ของไลบรารีมุมขวาบน ตำแหน่งเดียวกับ notify() · ไม่มี UI อื่น */
async function toastScreen(id) {
  const t = FEATURE_TOASTS[id];
  const f = frame('toast', 'VERTICAL', { pad: MOB ? [16, 16] : [24, 24] });
  f.counterAxisAlignItems = 'MAX';
  if (PLACE) { f.x = PLACE.x; f.y = PLACE.y; }
  const box = inst('Notification', { Type: t.err ? 'Error' : 'Success', Breakpoint: BP() }, { Text: t.text, Actions: false });
  const sup = find(box, 'Supporting text'); if (sup) sup.visible = false;
  f.appendChild(box);
  if (MOB) { try { box.resize(VW() - 32, box.height); } catch (e) { warn('toast mobile กว้าง', e); } }
  f.primaryAxisSizingMode = 'AUTO'; f.counterAxisSizingMode = 'FIXED'; f.resize(VW(), f.height);
  try { f.exportSettings = [{ format: 'SVG' }, { format: 'PNG', constraint: { type: 'SCALE', value: 2 } }]; } catch (e) { warn('export settings toast ' + id, e); }
  return f;
}

/* หน้าใน journey พร้อมรหัสตามชั้น: journey 1 → หน้า 1.2 → case 1.2.9 · x ของแต่ละจอ (ในหน้า 200 · คนละหน้า 500) */
const ROW_X0 = -60000;   // ขอบพื้นที่วางงานของ Figma ±65,500 ⇒ ทุกแถวเริ่มชิดซ้ายที่นี่ แถวยาวสุด (journey 1 ราว 79,000) จึงไม่ล้น
function featurePages(j, ji) {
  let x = ROW_X0 + GRID.side + GRID.gap;
  return j.pages.map((pg, k) => {
    const items = pg.items.map((it, n) => {
      const code = (ji + 1) + '.' + (k + 1) + '.' + (n + 1), ix = x + n * (GRID.colW + GRID.colGap);
      if (String(it[0]).indexOf('toast:') === 0) {
        const id = it[0].slice(6), t = FEATURE_TOASTS[id];
        return { code, x: ix, label: 'Toast ' + t.text + ' (แสดงบน' + t.page + ' เมื่อ' + t.when + ')', fn: () => toastScreen(id), data: t };   // data = ข้อความ toast เข้าลายเซ็น (ซอร์ส fn ไม่มีข้อความ)
      }
      const s = SCREEN_FN[it[0]];
      checkLabel(it[0], it[2]);
      return { code, x: ix, label: it[1] + ' (' + it[0] + ')', fn: s ? s.fn : null, old: it[0], scope: s && s.own ? F.id : '*' };
    });
    const w = items.length * GRID.colW + (items.length - 1) * GRID.colGap, page = { code: (ji + 1) + '.' + (k + 1), name: pg.name, x, w, items };
    x += w + PAGE_GAP;
    return page;
  });
}
const featureCount = (list) => list.reduce((a, j) => a + j.pages.reduce((b, p) => b + p.items.length, 0), 0);
const rowEnd = (pages) => { const l = pages[pages.length - 1]; return l.x + l.w; };

/* กล่อง Title หลักของ feature — กรอบสีเข้ม ข้อความใหญ่ อยู่นอกจอ (แบบแถบ Header) */
async function featureTitle(prefix, width) {
  const h = await headerBlock(prefix + ' · Feature ' + FEATURE_TITLE, FEATURE_TITLE, width); if (h) return h;   // ผู้ใช้ 18 พ.ย. 2569: Title = Header Type=Header
  const f = fixed(frame('Title', 'HORIZONTAL', { fill: rgbOf('#101828'), pad: [0, 80] }), width, 320);
  f.counterAxisAlignItems = 'CENTER';
  f.appendChild(await labelText(FEATURE_TITLE, 120, '#FFFFFF'));
  f.name = prefix + ' · Feature ' + FEATURE_TITLE;
  return f;
}

/* จอที่มีชั้นทับ (Background overlay ของ modal · แผงตัวกรอง · bottom sheet หรือ Modal ทั้งก้อน) สูงไม่เกินขนาดจอ 1024 / mobile 874
   (ผู้ใช้สั่ง 16 พ.ย. 2569) — เดิมเฟรมสูงตามเนื้อหา ชั้นทับเลยคลุมแค่ส่วนบน · ตัดความสูงเฟรม (clipsContent อยู่แล้ว) แล้วยืด Background overlay เต็มเฟรม */
/* เปิด Show Placeholder ของช่องกรอกทุกช่อง (ผู้ใช้สั่ง 17 พ.ย. 2569 "component Text Input ต้องปรับ Show placeholder เป็น True")
   field() / area() ใน core.js และช่องวันที่ใน screens.js ตั้ง 'Show Placeholder': !value ⇒ ช่องที่มีค่าถูกซ่อนชั้นข้อความ เห็นแต่ป้าย
   แก้ทีหลังในปลั๊กอินนี้ (ไม่แตะไฟล์พี่นุ) · State คงตามจอเดิม: ไม่มีค่า = Default สีจาง (placeholder) · มีค่า = Filled / Readonly / Focused / Error สีปกติ */
const PH_INPUTS = new Set(['Text input', 'Text area']);
function showPlaceholders(s) {
  const key = (n) => Object.keys(n.componentProperties || {}).find(k => k.split('#')[0].trim() === 'Show Placeholder');
  for (const n of s.findAll(x => x.type === 'INSTANCE' && PH_INPUTS.has(x.name))) {
    const k = key(n); if (!k || n.componentProperties[k].value === true) continue;
    try { n.setProperties({ [k]: true }); } catch (e) { warn('Show Placeholder ' + n.name + ' ใน ' + s.name, e); }
  }
}
const OVERLAY_NAMES = new Set(['Background overlay', 'Modal']);
/* ชั้นทับ = instance ลอย (ABSOLUTE) ชื่อ Background overlay / Modal · หรือวางที่ (0,0) กว้างเต็มจอและสูงเกินครึ่งจอ (กันชื่อ instance ใน Figma จริงไม่ตรง)
   ตรวจ 16 พ.ย. 2569: Modal ของ UI Release#2 = 1440×1024 · Notification (toast) = 520 / 360 กว้างไม่เต็มจอ ⇒ จอที่มี toast ไม่โดนตัด */
const isOverlay = (c) => c.layoutPositioning === 'ABSOLUTE' && c.type === 'INSTANCE' && (OVERLAY_NAMES.has(c.name) || (Math.round(c.x) === 0 && Math.round(c.y) === 0 && c.width >= VW() && c.height >= VH() / 2));
const hasOverlay = (s) => s.children.some(isOverlay);
let capped = 0;
function capOverlayScreen(s) {
  if (!hasOverlay(s) || s.height <= VH()) return;
  try {
    if (s.layoutMode === 'VERTICAL') s.primaryAxisSizingMode = 'FIXED'; else s.counterAxisSizingMode = 'FIXED';
    s.resize(VW(), VH()); s.clipsContent = true;
    s.children.filter(c => c.layoutPositioning === 'ABSOLUTE' && c.name === 'Background overlay').forEach(c => c.resize(VW(), VH()));
    capped++;
  } catch (e) { warn('ตัดความสูงจอที่มีชั้นทับ ' + s.name, e); }
}

/* แถบบน Header navigation ของจอ desktop ใช้ Breakpoint=Desktop (ผู้ใช้สั่ง 16 พ.ย. 2569) แทน Tablet ที่ core.js ใส่ตามกติกา R1 เดิม
   ตรวจแล้ว: ไลบรารีมี variant Breakpoint=Desktop (1187×64) · จอจริงใน UI Release#2 ใช้ Desktop 1,160 ชิ้น ไม่มี Tablet
   แก้เฉพาะปลั๊กอินนี้ ไม่แตะ core.js / component-rules ของพี่นุ · คงความกว้างเต็มคอนเทนเนอร์ (FILL) หลังสลับ variant */
function desktopHeader(s) {
  if (MOB) return;
  for (const h of s.findAll(n => n.type === 'INSTANCE' && n.name === 'Header navigation')) {
    setProps(h, { Breakpoint: 'Desktop' });
    try { h.layoutSizingHorizontal = 'FILL'; } catch (e) { /* ไม่อยู่ใน auto layout */ }
  }
}

/* ติดป้าย pluginData 'mf' ทุกชิ้นที่วาง: 'title' · 'happy' / 'happy-<j>' (Happy flow) · 'full' / '<j>' (ทุกเคส) — ปุ่มลบส่วน (update.js) ใช้แยกส่วน · Title ไม่ลบ */
const MF_TAG = 'mf';
let orphans = 0; let TIMES = [];
/* กล่องหัวส่วน (Happy flow / ทุกเคส) — แบบ Title หลักแต่เล็กกว่า อยู่นอกจอ */
async function sectionTitle(prefix, text, width) {
  const h = await headerBlock(prefix + ' · ส่วน ' + text, text, width); if (h) return h;
  const f = fixed(frame('Section title', 'HORIZONTAL', { fill: rgbOf('#344054'), pad: [0, 80] }), width, 200);
  f.counterAxisAlignItems = 'CENTER';
  f.appendChild(await labelText(text, 80, '#FFFFFF'));
  f.name = prefix + ' · ส่วน ' + text;
  return f;
}
/* สร้างจอ 1 จอ (ขั้นเดียวกันทุกทาง: สร้างทั้ง Feature · อัปเดตจอที่เปลี่ยน · สร้างจอที่เลือกใหม่) — place(s) = วางลงหน้า (คนเรียกเลือกตำแหน่ง/ลำดับ layer)
   ลายเซ็น (sig.js) เก็บใน pluginData mfSig ของเฟรม ⇒ โหมดอัปเดตรู้ว่าจอไหนเปลี่ยน · คืน null เมื่อพัง (ลบชิ้นที่ค้างแล้ว) */
const MAKE_BASE = ['makeScreen'];   // ชื่อที่ทุกจอพึ่ง (ขั้นแต่งจอหลังสร้าง) — อยู่ในลายเซ็นของทุกจอ
const screenName = (prefix, it, frameTitle, pgName, mob) => prefix + ' / ' + it.code + ' · ' + frameTitle + ' › ' + pgName + ' — ' + it.label + (mob ? ' · mobile' : '');
function itemSig(it, mob, frameTitle, pgName) { return sigOf(it.fn, it.scope || '*', MAKE_BASE, { code: it.code, label: it.label, page: pgName, title: frameTitle, mob: !!mob, data: it.data || null }); }
async function makeScreen(page, it, mob, prefix, frameTitle, pgName, at, place) {
  MOB = mob; CREATED = []; PLACE = { x: at.x, y: at.y }; const ts = Date.now();
  try {
    PINS = []; const s = await it.fn(); desktopHeader(s); stripDividers(s); await polish(s); repin(); await bindTones(); if (typeof AFTER_SCREEN === 'function') await AFTER_SCREEN(s);
    capOverlayScreen(s); showPlaceholders(s);
    s.name = screenName(prefix, it, frameTitle, pgName, mob);
    if (s.setPluginData) { s.setPluginData('builtAt', String(Date.now())); s.setPluginData('mfSig', itemSig(it, mob, frameTitle, pgName)); s.setPluginData('mfFeature', F.id); }
    place(s);
    TIMES.push([Date.now() - ts, it.code + (mob ? ' mobile' : '') + ' ' + it.label.slice(0, 40)]);
    /* ชิ้นที่ฟังก์ชันจอสร้างไว้แต่ไม่ได้ใส่เข้าจอ (carPartsScreen สร้าง Section "อะไหล่อื่นๆ" + ช่องน้ำมันทุกครั้ง) ค้างบนหน้า (ผู้ใช้เจอ 13 พ.ย. 2569)
       ⇒ ลบเฉพาะชิ้นที่รอบนี้เพิ่งสร้างและไม่ได้อยู่ในจอ ของเดิมบนหน้าไม่แตะ */
    for (const c of CREATED) { try { if (c !== s && c.parent === page) { c.remove(); orphans++; } } catch (e) { /* ลบไปแล้ว */ } }
    return s;
  } catch (e) {
    warn(it.code + ' ' + it.label + (mob ? ' (mobile)' : ''), e);
    const d = dropCreated(page); if (d) log('    ลบชิ้นที่ค้างจากจอที่พัง ' + d + ' ชิ้น');
    return null;
  } finally { CREATED = []; PLACE = null; MOB = false; }
}
async function featureGrid(page, prefix, journeys, y0, total, devices, opts) {
  opts = opts || {};
  const made = []; let y = y0; const x0 = ROW_X0 + GRID.side + GRID.gap; orphans = 0; TIMES = []; capped = 0; let tag = 'title';
  const put = (n, x, yy) => { page.insertChild(0, n); n.x = x; n.y = yy; try { if (n.setPluginData) n.setPluginData(MF_TAG, tag); } catch (e) { /* ไม่มีป้ายก็ได้ */ } return n; };
  const happyRows = opts.happy === false ? [] : journeys.map(j => ({ j, ji: FEATURE.indexOf(j), pages: happyPages(FEATURE.indexOf(j)) }));
  const fullRows = opts.full === false ? [] : journeys.map(j => ({ j, ji: FEATURE.indexOf(j), pages: featurePages(j, FEATURE.indexOf(j)) }));
  const fullW = Math.max(...happyRows.concat(fullRows).map(r => rowEnd(r.pages) - x0));
  /* 1 แถว journey: แถบ journey → (แถบหน้า) → แถบ case → แถว Desktop / Mobile · ใช้ร่วมกันทั้ง happy flow และทุกเคส */
  async function renderRow(barCode, barTitle, pages, pageBars, frameTitle) {
    CREATED = []; put(await flowBar(prefix, barCode, barTitle, 'Default', rowEnd(pages) - x0), x0, y);
    y += GRID.barH + GRID.gap;
    if (pageBars) { for (const pg of pages) { CREATED = []; put(await flowBar(prefix, pg.code, pg.name, 'Sub Flow', pg.w), pg.x, y); } y += GRID.barH + GRID.gap; }
    CREATED = []; put(await deviceLabel(prefix, 'Header', GRID.barH), ROW_X0, y);
    for (const pg of pages) for (const it of pg.items) { CREATED = []; put(await flowBar(prefix, it.code, it.label, 'Sub Flow 2', GRID.colW), it.x, y); }
    y += GRID.barH + GRID.gap;
    for (const mob of devices) {
      MOB = mob; let h = 0; const rowY = y;
      for (const pg of pages) for (const it of pg.items) {
        if (!it.fn) { warn(it.code + ' ไม่พบจอเดิม ' + it.old + ' ใน screens.js', 'ข้าม'); continue; }
        const s = await makeScreen(page, it, mob, prefix, frameTitle, pg.name, { x: it.x, y: rowY }, (n) => put(n, it.x, rowY));
        if (s) { h = Math.max(h, s.height); made.push(s); log('  · ' + made.length + '/' + total + ' ' + s.name); }
        CREATED = []; PLACE = null;
      }
      MOB = false;
      const rh = Math.max(h, mob ? GRID.mobH : GRID.deskH);
      CREATED = []; put(await deviceLabel(prefix, mob ? 'Mobile' : 'Desktop', rh), ROW_X0, rowY);
      y = rowY + rh + GRID.rowGap;
    }
    y += PAGE_GAP - GRID.rowGap;   // แถวถัดไปขึ้นด้านล่าง (ตัว Z) ห่าง 500
  }
  CREATED = []; y += put(await featureTitle(prefix, fullW), x0, y).height + PAGE_GAP;   // Title หลัก
  if (happyRows.length) {
    tag = 'happy'; CREATED = []; y += put(await sectionTitle(prefix, 'Happy flow — เส้นทางหลักแบบสั้น', fullW), x0, y).height + PAGE_GAP;
    for (const { j, ji, pages } of happyRows) {
      tag = 'happy-' + ji; const tj = Date.now();
      await renderRow('H' + (ji + 1), j.title + ' · Happy flow', pages, false, j.title + ' (Happy flow)');
      log('✓ Happy flow ' + (ji + 1) + ' ' + j.title + ' (' + HAPPY[ji].length + ' ขั้น) ⏱ ' + secs(tj));
    }
  }
  if (fullRows.length) {
    if (happyRows.length) { tag = 'full'; CREATED = []; y += put(await sectionTitle(prefix, 'ทุกเคส', fullW), x0, y).height + PAGE_GAP; }
    for (const { j, ji, pages } of fullRows) {
      tag = String(ji); const tj = Date.now();
      await renderRow(String(ji + 1), j.title, pages, true, j.title);
      log('✓ ' + (ji + 1) + ' ' + j.title + ' (' + pages.length + ' หน้า · ' + pages.reduce((a, p) => a + p.items.length, 0) + ' เฟรม) ⏱ ' + secs(tj));
    }
  }
  CREATED = [];
  return { made, y };
}

/* ---------- ลดเวลา export (ผู้ใช้สั่ง 17 พ.ย. 2569) — ไม่แก้ core.js ----------
   ก. นำเข้า component จากไลบรารีพร้อมกันทีละ 10 ตัวก่อน ⇒ ตอน resolveAll() นำเข้าทีละตัวได้จากแคชทันที (ตัวที่พังปล่อยให้ resolveAll จัดการตามเดิม)
   ข. ไม่ให้ resolveAll สแกน instance ทั้งไฟล์ (ไล่ทุก instance + getMainComponentAsync ทีละตัว ช้ามากในไฟล์ที่มีจอเยอะ)
      ⇒ ตัด LOCAL_OPTIONAL ออกจากรายการของ resolveAll แล้วหาเอง: component ในไฟล์ก่อน · ไม่เจอค่อยหา instance ที่ "ชื่อตรง" ตัวแรก (เรียก getMainComponentAsync เฉพาะตัวนั้น)
      ได้ผลเหมือนเดิม (แถบ Header ของทีมออกแบบ · ป้าย Device Type · component ของไฟล์ Maintain-D) · ไม่เจอก็ใช้แบบสำรองเหมือนเดิม */
/* ---------- component ป้ายข้างจอจากไฟล์ (UI) VMS Plus - Release#2 (Backup) (ผู้ใช้ขอ 17 พ.ย. 2569 "วิธีที่ผมไม่ต้องทำอะไรเยอะ") ----------
   ผู้ใช้วาง Device Type / Header / State ไว้ในไฟล์ UI Backup ⇒ เปิดพระผู้สร้างในไฟล์นั้นครั้งเดียว ปลั๊กอินจำ key ไว้ใน clientStorage (ใช้ร่วมทุกไฟล์)
   ไฟล์ที่สร้างจอ: นำเข้าด้วย key ก่อนหา component ในไฟล์ (ต้องเป็นไลบรารีที่ publish แล้ว · นำเข้าไม่ได้ก็หาในไฟล์ / ใช้แบบสำรองเหมือนเดิม)
   Header key จากดัมป์ ui-release2 13 พ.ย. 2569 (Design Annotations · Type=Header/Subheader) ใส่ไว้เป็นค่าเริ่มต้น */
const LKEY = 'mf-label-components';
const LABEL_DEFAULT = { Header: { key: 'cbdb14c4c43c175124ce4c7bb138bb980fc2f4ae', set: true, from: 'ดัมป์ UI Release#2 13 พ.ย. 2569' } };
const LABEL_PICK = {   // ชื่อ → เลือก set ที่ใช่ (ชื่อซ้ำได้ เช่น Header มี 2 ชุด)
  'Device Type': (c) => { const v = JSON.stringify(c.variantGroupProperties || {}).toLowerCase(); return v.indexOf('desktop') >= 0 && v.indexOf('mobile') >= 0; },
  'Header': (c) => ((c.variantGroupProperties || {}).Type || { values: [] }).values.indexOf('Subheader') >= 0,
  'State': (c) => !!(c.variantGroupProperties || {}).State
};
const LABEL_ERR = {}, LABEL_KNOWN = {};   // ชื่อ → ข้อความ error ตอนนำเข้า · เคยจำ key ไว้ไหม (ใช้บอกเหตุผลใน log)
async function labelKeys() { try { return (figma.clientStorage && await figma.clientStorage.getAsync(LKEY)) || {}; } catch (e) { return {}; } }
async function rememberLabels() {   // รันในไฟล์ไหนก็ได้ · เจอ component ชื่อตรงในไฟล์นี้ (ของไฟล์นี้เอง) ⇒ จำ key
  try {
    if (!/VMS Plus/i.test(figma.root.name || '')) return;   // จำเฉพาะไฟล์ไลบรารีทีม (ชื่อมี VMS Plus) · ไฟล์ทำงานอื่นที่มีสำเนาชื่อซ้ำไม่ทับ key ที่จำไว้
    if (figma.loadAllPagesAsync) await figma.loadAllPagesAsync();
    const got = {};
    for (const c of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
      const pick = LABEL_PICK[c.name]; if (!pick || got[c.name] || c.remote || !c.key) continue;
      if (c.type === 'COMPONENT' && c.parent && c.parent.type === 'COMPONENT_SET') continue;
      if (c.type !== 'COMPONENT_SET' || !pick(c)) continue;   // ป้ายทั้ง 3 เป็น set · component เดี่ยวชื่อซ้ำ (เช่น Header อื่นในไฟล์) ไม่จำ
      got[c.name] = { key: c.key, set: c.type === 'COMPONENT_SET', from: figma.root.name };
    }
    if (!Object.keys(got).length) return;
    const all = Object.assign(await labelKeys(), got);
    if (figma.clientStorage) await figma.clientStorage.setAsync(LKEY, all);
    log('✓ จำ component จากไฟล์ "' + figma.root.name + '": ' + Object.keys(got).join(' · ') + ' — ไฟล์อื่นที่สร้างจอจะใช้ตัวนี้ (ไฟล์นี้ต้อง publish เป็นไลบรารี)');
  } catch (e) { warn('จำ component ป้าย', e); }
}
async function importLabels() {   // ก่อน resolveFast หา component ในไฟล์ · คืนชื่อที่นำเข้าได้
  const keys = Object.assign({}, LABEL_DEFAULT, await labelKeys()), ok = [];
  for (const [n, k] of Object.entries(keys)) {
    if (INDEX.has(n) && ROUTE[n] !== 'สำเนาในไฟล์นี้' && ROUTE[n] !== 'จาก instance ในไฟล์') continue;
    try { const c = k.set ? await figma.importComponentSetByKeyAsync(k.key) : await figma.importComponentByKeyAsync(k.key); if (c) { INDEX.set(n, c); ROUTE[n] = 'ไลบรารี (' + k.from + ')'; ok.push(n); } }
    catch (e) { LABEL_ERR[n] = (e && e.message) || String(e); /* ไม่ได้ publish / ไม่มีสิทธิ์ ⇒ หาในไฟล์ต่อ */ }
  }
  return ok;
}
/* ปุ่มอัปเดตป้ายใช้แค่ Header + Device Type (18 พ.ย. 2569: log จริง resolveAll 837 วินาที เพราะสแกน instance ทั้งไฟล์หา component จอที่ปุ่มนี้ไม่ใช้)
   ⇒ นำเข้าเฉพาะ 2 ตัว · ยังไม่รู้จัก Device Type ⇒ หา instance ชื่อ "Device Type" ในไฟล์นี้ (ผู้ใช้ลากจาก Assets มาวาง 1 ชิ้น) ที่ลิงก์ไลบรารี แล้วจำ key ไว้ */
async function resolveLabelsOnly() {
  const t = Date.now();
  if (figma.loadAllPagesAsync) await figma.loadAllPagesAsync();
  const lab = await importLabels();
  if (!INDEX.has('Device Type')) {
    for (const i of figma.root.findAllWithCriteria({ types: ['INSTANCE'] })) {
      if (!/Device Type/i.test(i.name || '')) continue;
      try {
        const mc = await i.getMainComponentAsync(); const h = mc && holderOf(mc);
        if (!h || h.type !== 'COMPONENT_SET' || !h.remote || !LABEL_PICK['Device Type'](h)) continue;
        INDEX.set('Device Type', h); ROUTE['Device Type'] = 'ไลบรารี (จาก instance ที่วางในไฟล์นี้)'; lab.push('Device Type');
        try { const all = Object.assign(await labelKeys(), { 'Device Type': { key: h.key, set: true, from: 'instance ในไฟล์ ' + figma.root.name } }); if (figma.clientStorage) await figma.clientStorage.setAsync(LKEY, all); } catch (e) { /* จำไม่ได้ก็ใช้รอบนี้ไป */ }
        break;
      } catch (e) { /* ข้าม */ }
    }
  }
  log('นำเข้าป้าย: ' + (lab.join(' · ') || '-') + ' ' + secs(t));
}
const secs = (t) => '(' + ((Date.now() - t) / 1000).toFixed(1) + ' วินาที)';
async function preImport(names) {
  const jobs = names.filter(n => KEYS[n]).map(n => () => (KEYS[n][1] ? figma.importComponentSetByKeyAsync(KEYS[n][0]) : figma.importComponentByKeyAsync(KEYS[n][0])).catch(() => null));
  for (let i = 0; i < jobs.length; i += 10) await Promise.all(jobs.slice(i, i + 10).map(j => j()));
  return jobs.length;
}
let RESOLVED = false;   // หาครบแล้วในรอบเปิดปลั๊กอินนี้ ⇒ Feature ถัดไป/กดซ้ำ ไม่ต้องหาใหม่ (18 พ.ย. 2569)
async function resolveFast() {
  if (RESOLVED) { log('ใช้ component ที่หาไว้แล้วตอนเปิดปลั๊กอินรอบนี้'); return; }
  const lib = NEEDED.filter(n => LOCAL_OPTIONAL.indexOf(n) < 0);
  let t = Date.now();
  const pre = await preImport(lib);
  log('⏱ นำเข้าจากไลบรารีพร้อมกัน ' + pre + ' ตัว ' + secs(t));
  t = Date.now();
  await resolveAll(lib);   // 18 พ.ย. 2569 ฐาน origin: resolveAll มีแคช pluginData (componentCache · เช็คชื่อ · โหลดทุกหน้าเฉพาะตอนจำเป็น · จำตัวที่ไม่มี) แล้ว ⇒ เลิกใช้ rcache.js ของเรา
  log('⏱ resolveAll ' + secs(t));
  t = Date.now();
  const lab = await importLabels();
  if (lab.length) log('ป้ายข้างจอจากไลบรารี: ' + lab.join(' · ') + ' ' + secs(t));
  const left = () => LOCAL_OPTIONAL.filter(n => !INDEX.has(n));
  if (left().length) await resolveAll(left());   // component ของไฟล์ Maintain-D / ป้าย ที่ยังไม่ได้ — ผ่านแคชเดียวกันของฐาน (ไม่สแกนซ้ำทุกรอบ) · ไม่มี = ใช้แบบสำรอง
  const miss = left();
  RESOLVED = true;
  log('component ของไฟล์ Maintain-D / ป้าย: ได้ ' + (LOCAL_OPTIONAL.length - miss.length) + '/' + LOCAL_OPTIONAL.length + (miss.length ? ' · ไม่พบ ' + miss.join(' · ') + ' — ใช้แบบสำรอง' : '') + ' ' + secs(t));
}

async function buildFeature(devices, pick, happyOnly) {
  errors.length = 0;
  const t0 = Date.now();
  let journeys = pick && pick.length ? FEATURE.filter((j, i) => pick.indexOf(String(i)) >= 0) : FEATURE;
  if (!journeys.length) { log('ยังไม่ได้ติ๊ก journey'); return; }
  log('Feature ' + FEATURE_TITLE + ' · ' + journeys.map(j => (FEATURE.indexOf(j) + 1) + ' ' + j.title).join(' · '));
  log('นำเข้า component จากไลบรารี…');
  await resolveFast();
  log(deviceSetInfo());
  const tp = await featurePage(true);
  const page = tp.page;
  if (page.loadAsync) await page.loadAsync();
  await figma.setCurrentPageAsync(page);
  /* ไม่สร้างทับของเดิม (ผู้ใช้สั่ง 16 พ.ย. 2569 "ไม่สร้างทับของเดิม เดี๋ยวผมลบเอง") — ไม่ลบ ไม่ย้าย ไม่เรียงชิ้นที่มีอยู่บนหน้า
     ทุกครั้งวางชุดใหม่ต่อใต้ของเดิม และมี Title หลักติดมาด้วยเสมอ (ทั้งสร้างทั้ง feature และสร้างเฉพาะหัวข้อ) */
  const mine = (n) => n.name.indexOf(FEATURE_PREFIX + ' / ') === 0 || n.name.indexOf(FEATURE_PREFIX + ' · ') === 0;
  const total = ((happyOnly ? 0 : featureCount(journeys)) + happyCount(journeys)) * devices.length;
  const before = new Set(page.children);
  const made = (await featureGrid(page, FEATURE_PREFIX, journeys, before.size ? pageBottom(page) + 1000 : 0, total, devices, { full: !happyOnly })).made;
  const fresh = page.children.filter(n => !before.has(n));
  const fit = fresh.length ? fitOn(page, fresh, 1000) : { dx: 0, dy: 0 };
  if (fit) shiftAll(fresh, fit);
  else log('⚠ หน้า "' + page.name.trim() + '" ไม่มีที่ว่างในขอบพื้นที่วางงานแล้ว — ลบชุดเก่าบนหน้านี้ก่อน แล้วกดใหม่');
  log(tp.fresh ? 'สร้างหน้าใหม่ "' + page.name + '" แล้ววางลงไป' : 'วางชุดใหม่บนหน้า "' + page.name.trim() + '" ต่อจากของเดิม · ของเดิมไม่ถูกแตะ (ลบชุดเก่าเองได้)');
  let loose = 0;
  /* ชิ้นวาดเองในกรอบแดชบอร์ด VMS+ (DASH_BOX ของ screens.js · R106 S4 S24) ได้รับยกเว้นแบบเดียวกับตัวตรวจ R106 ของพี่นุ (18 พ.ย. 2569 ฐาน origin) */
  const DASH = typeof DASH_BOX === 'object' ? Object.values(DASH_BOX) : [];
  const inDash = (n, top) => { for (let p = n.parent; p && p !== top; p = p.parent) if (DASH.some(d => String(p.name || '').indexOf(d) === 0)) return true; return false; };
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) if (n.type !== 'INSTANCE' && n.type !== 'FRAME' && !inDash(n, s)) loose++;
  figma.currentPage.selection = made.slice(0, 1);
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 6));
  log('');
  log('สร้าง ' + made.length + ' เฟรม (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ' + journeys.length + ' journey');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓'));
  log('ชิ้นที่หลุดนอกจอระหว่างสร้าง (ลบแล้ว): ' + orphans);
  log('จอที่มีชั้นทับ (modal · ตัวกรอง · bottom sheet) ตัดความสูงเหลือขนาดจอ: ' + capped + ' จอ');
  const stray = page.children.filter(n => !mine(n));
  log('ชิ้นบนหน้านี้ที่ไม่ใช่จอหรือป้ายของปลั๊กอิน: ' + stray.length + (stray.length ? ' ⚠ ' + stray.slice(0, 5).map(n => n.type + ' ' + n.name).join(' · ') : ' ✓'));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่สลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด');
  reportOversize();
  if (TIMES.length) log('⏱ จอที่ช้าที่สุด: ' + TIMES.sort((p, q) => q[0] - p[0]).slice(0, 5).map(x => x[1] + ' ' + (x[0] / 1000).toFixed(1) + 's').join(' · '));
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}

/* ---------- ส่งจอไปบอร์ด FigJam (ผู้ใช้สั่ง 17 พ.ย. 2569 "export UI ไปลง board figjam ด้วย") ----------
   ทางเดียวกับของพี่นุ (exportShots ใน core.js · serve.js · figjam-plugin) แต่ปุ่มเดียวทำทั้งภาพและสเปกบอร์ด ไม่ต้องรัน 3-figjam-board.js
   1) export เฟรม MF / … ชุดล่าสุด (pluginData builtAt) เป็น PNG ด้านยาว ≤ 4000 → UI POST เข้า serve.js ที่ out/figjam/flow-maintainance-feature/
   2) สเปกบอร์ดแบบ image section ที่ figjam-plugin อ่านได้ (รูปแบบ 3-figjam-board.js) แยกไฟล์ Happy flow + ราย journey (ภาพทั้งไฟล์โหลดรอบเดียว 208 ภาพหนักเกิน)
   3) ในไฟล์ FigJam เปิด "Maintain-D → FigJam board" ติ๊ก Feature แผนบำรุงรักษา (กลุ่ม "อื่น ๆ") */
const FJ_RE = /^MF \/ (H?\d+(?:\.\d+)+) · (.+?) › (.+?) — (.+)$/;
const FJ_COLOR = { happy: [241, 254, 253], j: [[248, 245, 255], [245, 251, 255], [255, 251, 240], [255, 240, 250], [249, 249, 249]] };
const fjKey = (code) => (code[0] === 'H' ? '0' : '1') + code.replace('H', '').split('.').map(x => x.padStart(3, '0')).join('.');
function fjShots(page, devices, pick) {
  const want = new Set(devices.map(m => m ? 'mobile' : 'desktop'));
  const js = pick && pick.length ? new Set(pick.map(i => String(+i + 1))) : null;
  const builtAt = (f) => +((f.getPluginData && f.getPluginData('builtAt')) || 0);
  const all = [], skipped = [];
  for (const f of page.children) {
    if (f.type !== 'FRAME' || f.name.indexOf(FEATURE_PREFIX + ' / ') !== 0) continue;
    const mob = / · mobile$/.test(f.name), m = f.name.replace(/ · mobile$/, '').match(FJ_RE);
    if (!m) { skipped.push(f.name); continue; }
    const code = m[1], jn = code.replace('H', '').split('.')[0];
    if (!want.has(mob ? 'mobile' : 'desktop') || (js && !js.has(jn))) continue;
    all.push({ f, code, happy: code[0] === 'H', j: +jn - 1, page: m[3], label: m[4], device: mob ? 'mobile' : 'desktop', t: builtAt(f) });
  }
  all.sort((p, q) => q.t - p.t);   // หลายชุดบนหน้า ⇒ จอรหัสเดียวกันเอาชุดที่สร้างล่าสุด
  const seen = new Set(), shots = all.filter(x => !seen.has(x.code + x.device) && seen.add(x.code + x.device));
  shots.sort((a, b) => fjKey(a.code) < fjKey(b.code) ? -1 : fjKey(a.code) > fjKey(b.code) ? 1 : (a.device === 'desktop' ? -1 : 1));
  return { shots, older: all.length - shots.length, skipped };
}
function fjSection(name, color, list) {   // 1 journey = 1 section · คอลัมน์ละจอ · แถว Desktop / Mobile · ลูกศรต่อตามลำดับ (แบบ 3-figjam-board.js)
  const codes = [...new Set(list.map(x => x.code))];
  const hasMob = list.some(x => x.device === 'mobile'), hasDesk = list.some(x => x.device === 'desktop');
  const rowH = (d) => Math.max(0, ...list.filter(x => x.device === d).map(x => x.h));
  const two = hasMob && hasDesk;
  return {
    name, color, connect: 'sequence',
    rows: two ? [{ label: 'Desktop', h: rowH('desktop') }, { label: 'Mobile', h: rowH('mobile') }] : undefined,
    cols: codes.map(code => {
      const d = list.find(x => x.code === code && x.device === 'desktop'), mo = list.find(x => x.code === code && x.device === 'mobile'), a = d || mo;
      const im = (x, row) => ({ src: 'figjam/' + FJ_DIR + '/' + x.file, w: x.w, h: x.h, row });
      return { label: code + ' · ' + a.page + ' — ' + a.label, note: '', images: [d && im(d, 0), mo && im(mo, two ? 1 : 0)].filter(Boolean) };
    })
  };
}
function fjBoards(done, target) {   // done = ภาพที่ export แล้ว (มี file w h) ⇒ ไฟล์สเปก { file, spec }
  const head = () => ({ version: 1, anchor: 'below', generatedAt: new Date().toISOString(), font: { family: 'IBM Plex Sans Thai', style: 'Medium' }, fallbackFont: { family: 'Inter', style: 'Medium' }, target: target || undefined });   // target = บอร์ดปลายทางที่เลือก (ฝั่ง FigJam ใช้เตือนเมื่อเปิดผิดบอร์ด · figjam-plugin ของพี่นุไม่อ่าน)
  const jName = (j, happy) => { const J = FEATURE[j]; return FJ_TITLE + ' · ' + (happy ? 'H' : '') + (j + 1) + ' ' + J.title + (happy ? ' · Happy flow' : ''); };
  const out = [];
  const hp = done.filter(x => x.happy);
  if (hp.length) out.push({ file: FJ_BOARD + '-happy.json', spec: Object.assign(head(), { title: FJ_TITLE + ' · Happy flow', sections: [...new Set(hp.map(x => x.j))].map(j => fjSection(jName(j, true), FJ_COLOR.happy, hp.filter(x => x.j === j))) }) });
  [...new Set(done.filter(x => !x.happy).map(x => x.j))].forEach(j => {
    out.push({ file: FJ_BOARD + '-' + (j + 1) + '.json', spec: Object.assign(head(), { title: FJ_TITLE + ' · ' + (j + 1) + ' ' + FEATURE[j].title, sections: [fjSection(jName(j, false), FJ_COLOR.j[j % FJ_COLOR.j.length], done.filter(x => !x.happy && x.j === j))] }) });
  });
  return out;
}
async function exportFigJam(devices, pick) {
  errors.length = 0; const t0 = Date.now();
  const fp = await featurePage(false), page = fp && fp.page;
  if (!page) { log('ไม่พบ Page "' + FEATURE_PAGE[0] + '" — กดสร้าง feature ก่อน'); return; }
  const { shots, older, skipped } = fjShots(page, devices, pick);
  if (!shots.length) { log('ไม่พบเฟรม "' + FEATURE_PREFIX + ' / …" ตามอุปกรณ์/journey ที่เลือก บนหน้า "' + page.name + '"'); return; }
  log('ส่งภาพจอ ' + shots.length + ' จอ ไปที่ out/figjam/' + FJ_DIR + '/' + (older ? ' · ข้ามชุดเก่าบนหน้า ' + older + ' จอ' : ''));
  const done = [];
  for (const s of shots) {
    try {
      const scale = Math.min(1, 4000 / Math.max(s.f.width, s.f.height));
      const bytes = await s.f.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      const file = s.code + (s.device === 'mobile' ? '-mobile' : '') + '.png';
      figma.ui.postMessage({ type: 'shot', dir: FJ_DIR, file, bytes, n: done.length + 1, total: shots.length });
      done.push(Object.assign({}, s, { f: undefined, file, w: Math.round(s.f.width * scale), h: Math.round(s.f.height * scale) }));
    } catch (e) { warn('export ' + s.f.name, e); }
  }
  const manifest = { source: 'figma', page: page.name, exportedAt: new Date().toISOString(), shots: done.map(x => ({ code: x.code, scenario: FEATURE_PREFIX, name: x.page + ' — ' + x.label, device: x.device, file: x.file, w: x.w, h: x.h })) };
  const target = await tgtCurrent();
  const boards = fjBoards(done, target ? { name: target.name, url: target.url } : null);
  figma.ui.postMessage({ type: 'fj-file', path: 'figjam/' + FJ_DIR + '/manifest.json', text: JSON.stringify(manifest, null, 1) });
  for (const b of boards) figma.ui.postMessage({ type: 'fj-file', path: b.file, text: JSON.stringify(b.spec), board: true });
  figma.ui.postMessage({ type: 'fj-done', shots: done.length, boards: boards.map(b => b.file) });
  log('export แล้ว ' + done.length + '/' + shots.length + ' จอ · บอร์ด ' + boards.length + ' ไฟล์: ' + boards.map(b => b.spec.title.replace(FJ_TITLE + ' · ', '')).join(' · ') + (skipped.length ? ' · ข้ามเฟรมชื่อไม่ตรงรูปแบบ ' + skipped.length : '') + (errors.length ? ' · ⚠ เตือน ' + errors.length + ' จุด' : '') + ' ' + secs(t0));
  log('ขั้นต่อไป: ' + (target ? 'กด "เปิดบอร์ดปลายทาง" (' + target.name + ')' : 'เปิดบอร์ด FigJam ที่จะใช้') + ' → รันปลั๊กอินตัวนี้ในบอร์ดนั้น → กด "วางลงบอร์ดนี้"');
}

const LABEL_RE = /^MF · (Device|Desktop|Mobile)$/;
const HEAD_RE = /^MF · (Feature|ส่วน) (.+)$/;
/* กล่อง Title Feature / หัวส่วน = Header Type=Header ของทีมออกแบบ (ผู้ใช้ 18 พ.ย. 2569 copy ตัวอย่างมาวางให้ดู) · ใส่ข้อความที่ Text ตัวแรกที่มองเห็น · ป้าย Status คงค่าเริ่มต้นของ component
   ไม่มี Header / ไม่มี variant Type=Header / ใส่ข้อความไม่ได้ ⇒ null (คนเรียกใช้กรอบเดิม) */
async function headerBlock(name, value, width) {
  const H = INDEX.get('Header');
  if (!H || HEADER_BROKEN || H.type !== 'COMPONENT_SET' || !H.children.some(c => (c.variantProperties || {}).Type === 'Header')) return null;
  let n; try { n = inst('Header', { Type: 'Header' }); } catch (e) { return null; }
  const t = n.findAll(c => c.type === 'TEXT' && c.visible !== false)[0];
  if (!t || !(await text(n, t, value))) { try { n.remove(); } catch (e) { /* */ } return null; }
  try { n.resize(width, n.height); } catch (e) { /* */ }
  n.name = name;
  return n;
}
const BAR_RE = /^MF · (H?\d+(?:\.\d+)*) (.+)$/;
const CODE_RE = /^H?\d+(?:\.\d+)*$/;
function barState(code) {   // ตรงกับ featureGrid: journey = Default · แถบหน้า = Sub Flow · แถบ case / ขั้น Happy = Sub Flow 2
  const d = code.replace('H', '').split('.').length - 1;
  return d === 0 ? 'Default' : code[0] === 'H' || d >= 2 ? 'Sub Flow 2' : 'Sub Flow';
}
/* หาจากหน้าตา ไม่ใช่แค่ชื่อ (ผู้ใช้ 17 พ.ย. 2569 "ชื่อมันอาจจะไม่เหมือนกันแต่หน้าตามันตรงกัน · เอาให้เจอให้หมดทุกจุด")
   ป้าย Device: ชื่อ MF · Device|Desktop|Mobile · instance ของ Device Type / Component 1 · กรอบเทา #667085 กว้าง ~300 มีข้อความ Device/Desktop/Mobile
   แถบ Header: ชื่อ MF · <รหัส> <ชื่อ> · instance ของ Header · กรอบที่มีลูก State (รหัส) + Detail (ชื่อ) */
const DEV_WORD = { device: 'Header', header: 'Header', desktop: 'Desktop', mobile: 'Mobile' };
const texts = (n) => { try { return (n.findAll ? n.findAll(x => x.type === 'TEXT') : []).filter(t => t.visible !== false).map(t => String(t.characters || '').trim()).filter(Boolean); } catch (e) { return []; } };
const isGrey = (n) => { const f = (n.fills && n.fills[0] && n.fills[0].color) || null; return !!f && Math.abs(f.r - 0x66 / 255) < 0.04 && Math.abs(f.g - 0x70 / 255) < 0.04 && Math.abs(f.b - 0x85 / 255) < 0.04; };
async function mainOf(n) {
  if (n.type !== 'INSTANCE') return null;
  try { const m = await n.getMainComponentAsync(); if (!m) return null; const s = m.parent && m.parent.type === 'COMPONENT_SET' ? m.parent : m; return { name: s.name, key: s.key, vp: m.variantProperties || n.variantProperties || {} }; } catch (e) { return null; }
}
/* ถูกต้องแล้ว = เป็น instance ของตัวใหม่ (key ตรง) และ variant ถูก (18 พ.ย. 2569: ผู้ใช้เจอแถบ H1 เป็น Header Type=Header "???" ⇒ key ตรงอย่างเดียวไม่พอ)
   แถบ: Type = Subheader · ป้าย: Type ตรงคำบนป้าย */
const devTypeOf = (vp) => { for (const v of Object.values(vp || {})) { const t = DEV_WORD[String(v).trim().toLowerCase()]; if (t) return t; } return null; };
const newKeyOf = (kind) => { const c = INDEX.get(kind === 'dev' ? 'Device Type' : 'Header'); return c && c.key; };
async function classify(n) {
  const nm = n.name || '', md = nm.match(LABEL_RE), mb = nm.match(BAR_RE), main = await mainOf(n), tx = texts(n);
  const devType = () => { if (md) return DEV_WORD[md[1].toLowerCase()]; if (main) { const t = devTypeOf(main.vp); if (t) return t; } for (const t of tx) if (DEV_WORD[t.toLowerCase()]) return DEV_WORD[t.toLowerCase()]; return null; };
  if (md || (main && /^(Device Type|Component 1)$/.test(main.name)) || (n.type === 'FRAME' && Math.abs(n.width - GRID.side) < 30 && isGrey(n) && tx.length === 1 && DEV_WORD[tx[0].toLowerCase()])) {
    const type = devType(); if (!type) return null;
    const D = INDEX.get('Device Type'), fresh = !!(main && main.key && main.key === newKeyOf('dev') && (!D || D.type !== 'COMPONENT_SET' || devTypeOf(main.vp) === type));
    return { kind: 'dev', type, via: md ? 'ชื่อ' : main ? 'instance ' + main.name : 'หน้าตา', fresh };
  }
  const mh = nm.match(HEAD_RE);
  if (mh && (n.type === 'FRAME' || (main && main.name === 'Header'))) {   // Title Feature / หัวส่วน
    return { kind: 'head', code: mh[1] === 'Feature' ? 'Title' : 'หัวส่วน', title: mh[2], via: main ? 'instance Header' : 'ชื่อ', fresh: !!(main && main.key === newKeyOf('head') && main.vp.Type === 'Header') };
  }
  const looksBar = n.type === 'FRAME' && n.children && n.children.some(c => c.name === 'State') && n.children.some(c => c.name === 'Detail');
  if (mb || (main && main.name === 'Header') || looksBar) {
    const code = mb ? mb[1] : tx.find(t => CODE_RE.test(t)), title = mb ? mb[2] : tx.filter(t => t !== code)[0];   // ชื่อ layer มาก่อน (ตัวที่ variant ผิดมีข้อความ "???")
    if (!code || !title || /^(Feature|ส่วน) /.test(title)) return null;
    const sub = !!(main && main.vp && main.vp.Type === 'Subheader');
    if (main && main.name === 'Header' && !sub) return null;   // Header แบบ Type=Header (หัวใหญ่) ไม่ใช่แถบรหัส · ผู้ใช้วางเป็นตัวอย่างเอง (18 พ.ย. 2569) ⇒ ไม่แตะ ไม่นับ
    const fresh = !!(main && main.key === newKeyOf('bar') && sub);
    return { kind: 'bar', code, title, via: mb ? 'ชื่อ' : main ? 'instance Header' : 'หน้าตา', fresh };
  }
  return null;
}
async function scanLabels(page) {   // ไล่ทั้ง Page แบบลึก · ไม่เข้าไปในจอ (MF / …) · เจอแล้วไม่ไล่ลูกต่อ
  const out = [];
  async function walk(node) {
    for (const c of (node.children || []).slice()) {
      if ((c.name || '').indexOf(FEATURE_PREFIX + ' / ') === 0) continue;
      const k = await classify(c);
      if (k) { out.push(Object.assign(k, { node: c })); continue; }
      if (c.children && (c.type === 'SECTION' || c.type === 'GROUP' || c.type === 'FRAME')) await walk(c);
    }
  }
  await walk(page);
  return out;
}
/* Device Type ตัวใหม่เป็น component เดี่ยว (ไม่มี variant) — กันไว้เผื่อ · ไฟล์ UI Backup ตอนนี้เป็น set มี Type = Header / Desktop / Mobile ใช้ deviceLabel ของ core */
function singleDeviceInfo() {
  const c = INDEX.get('Device Type'); if (!c || c.type !== 'COMPONENT') return '';
  const props = Object.entries(c.componentPropertyDefinitions || {}).map(([k, v]) => k + ':' + v.type);
  return 'Device Type ตัวใหม่เป็น component เดี่ยว · property [' + (props.join(', ') || '-') + '] · ตัวหนังสือข้างใน [' + texts(c).join(', ') + ']';
}
async function singleDevice(type, w, h) {
  const c = INDEX.get('Device Type'); if (!c || c.type !== 'COMPONENT') return null;
  const word = type === 'Header' ? 'Device' : type, n = c.createInstance(); CREATED.push(n);
  const fail = (m) => { throw new Error(m); };
  const tp = Object.entries(n.componentProperties || {}).find(([, v]) => v.type === 'TEXT');
  const ts = n.findAll(x => x.type === 'TEXT'), hits = ts.filter(t => DEV_WORD[String(t.characters).trim().toLowerCase()]);
  if (tp) n.setProperties({ [tp[0]]: word });
  else if (hits.length > 1) {
    const keep = hits.find(t => DEV_WORD[String(t.characters).trim().toLowerCase()] === type); if (!keep) fail('ไม่มีคำ ' + word + ' ใน Device Type ตัวใหม่');
    const branch = (t) => { let b = t; while (b.parent && b.parent !== n) b = b.parent; return b; };
    for (const t of hits) if (t !== keep) { const b = branch(t); if (b !== branch(keep)) b.visible = false; else t.visible = false; }
  } else if (ts.length === 1) {
    for (const f of ts[0].getRangeAllFontNames(0, ts[0].characters.length)) await figma.loadFontAsync(f);
    ts[0].characters = word;
  } else fail('ไม่รู้ว่าจะใส่คำตรงไหน (' + singleDeviceInfo() + ')');
  try { n.resize(w, h); } catch (e) { /* */ }
  n.name = FEATURE_PREFIX + ' · ' + word;
  return n;
}
/* ตรวจชิ้นที่เพิ่งสร้างก่อนวางแทน — ไม่ผ่าน ⇒ ลบทิ้ง เก็บของเดิม (ไม่วางของผิดลงหน้า) */
function checkMade(n, f) {
  if (!n || n.type !== 'INSTANCE') return 'ได้กรอบธรรมดา ไม่ใช่ component ตัวใหม่ (ใส่ข้อความลง component ไม่ได้)';
  const vp = n.variantProperties || {};
  if (f.kind === 'head') {
    if (vp.Type !== 'Header') return 'ได้ Header แบบ Type=' + (vp.Type || '?') + ' ไม่ใช่ Header';
    if (texts(n).indexOf(f.title) < 0) return 'ข้อความไม่ขึ้นบนหัว';
  } else if (f.kind === 'bar') {
    if (vp.Type !== 'Subheader') return 'ได้ Header แบบ Type=' + (vp.Type || '?') + ' ไม่ใช่ Subheader';
    const tx = texts(n); if (tx.indexOf(f.code) < 0) return 'รหัส ' + f.code + ' ไม่ขึ้นบนแถบ (เห็น: ' + tx.slice(0, 3).join(' / ') + ')';
    if (tx.indexOf(f.title) < 0) return 'ชื่อไม่ขึ้นบนแถบ';
  } else if (INDEX.get('Device Type') && INDEX.get('Device Type').type === 'COMPONENT_SET' && devTypeOf(vp) !== f.type) return 'ได้ป้าย Type=' + JSON.stringify(vp) + ' ไม่ตรง ' + f.type;
  return '';
}
const dropMade = () => { for (const x of CREATED) { try { if (x && !x.removed && x.parent) x.remove(); } catch (e) { /* ลบไปแล้ว */ } } CREATED = []; };
/* ---------- อัปเดตป้ายบนจอที่สร้างแล้ว (ผู้ใช้ขอ 17 พ.ย. 2569: export ครบแล้ว ไม่อยากสร้างใหม่ทั้งหมด) ----------
   แทนแถบ Header และป้าย Device / Desktop / Mobile ด้วย component ตัวใหม่ ที่เดิม (parent · ลำดับ · x/y · กว้าง/สูง) ข้อความเดิม · จอไม่ถูกแตะ
   ไม่มีตัวใหม่ ⇒ ไม่แทน · สร้างแล้วตรวจไม่ผ่าน ⇒ ลบตัวใหม่ เก็บของเดิม · Header แบบ Type=Header (หัวใหญ่) ไม่นับเป็นแถบ ไม่แตะ
   จบแล้วสแกนซ้ำด้วยเกณฑ์เดียวกัน ต้องเหลือ 0 */
async function patchLabels() {
  const fp = await featurePage(false), page = fp && fp.page;
  if (!page) { log('· ' + FEATURE_TITLE + ': ยังไม่มี Page "' + FEATURE_PAGE[0] + '" ข้าม'); return 0; }
  const ok = labelReady();
  await figma.setCurrentPageAsync(page);
  const t0 = Date.now(), found = await scanLabels(page);
  const st = { head: { all: 0, via: {}, fresh: 0, done: 0, skip: 0 }, bar: { all: 0, via: {}, fresh: 0, done: 0, skip: 0, dup: 0 }, dev: { all: 0, via: {}, fresh: 0, done: 0, skip: 0, dup: 0 } }, why = [];
  for (const f of found) {
    const s = st[f.kind]; s.all++; s.via[f.via] = (s.via[f.via] || 0) + 1;
    if (f.fresh) { s.fresh++; continue; }
    if (!(f.kind === 'head' ? ok.head : ok[f.kind])) { s.skip++; continue; }
    const old = f.node, parent = old.parent;
    CREATED = [];
    try {
      const n = f.kind === 'head' ? await headerBlock(old.name, f.title, old.width) : f.kind === 'dev' ? (INDEX.get('Device Type').type === 'COMPONENT' ? await singleDevice(f.type, old.width, old.height) : await deviceLabel(FEATURE_PREFIX, f.type, old.height)) : await flowBar(FEATURE_PREFIX, f.code, f.title, barState(f.code), old.width);
      const bad = checkMade(n, f);
      if (bad) { dropMade(); s.skip++; if (why.length < 10) why.push((f.kind === 'head' ? f.code : f.kind === 'bar' ? 'แถบ ' + f.code : 'ป้าย ' + f.type) + ': ' + bad); continue; }
      parent.insertChild(parent.children.indexOf(old), n); n.x = old.x; n.y = old.y;
      if (f.kind === 'dev') { try { n.resize(old.width, old.height); } catch (e) { /* */ } }
      try { if (old.getPluginData && n.setPluginData) n.setPluginData(MF_TAG, old.getPluginData(MF_TAG)); } catch (e) { /* */ }
      old.remove(); s.done++; CREATED = [];
    } catch (e) { dropMade(); s.skip++; if (why.length < 10) why.push(old.name + ' — ' + (e && e.message ? e.message : e)); }
  }
  CREATED = [];
  const left = (await scanLabels(page)).filter(f => !f.fresh);
  const fmt = (k, label) => { const s = st[k]; return label + ' เจอ ' + s.all + ' (' + (Object.entries(s.via).map(([v, c]) => v + ' ' + c).join(' · ') || '-') + ') · แทน ' + s.done + (s.fresh ? ' · ถูกอยู่แล้ว ' + s.fresh : '') + (s.skip ? ' · ข้าม ' + s.skip : ''); };
  log('· ' + FEATURE_TITLE + ': ' + fmt('head', 'Title/หัวส่วน') + ' | ' + fmt('bar', 'แถบ Header') + ' | ' + fmt('dev', 'ป้าย Device') + ' ' + secs(t0));
  if (!ok.bar && st.bar.all - st.bar.fresh) log('  ⓘ ข้ามแถบ Header: ' + ok.barWhy);
  if (!ok.head && st.head.all - st.head.fresh) log('  ⓘ ข้าม Title/หัวส่วน: ' + (ok.bar ? 'Header ตัวใหม่ไม่มี variant Type=Header' : ok.barWhy));
  if (!ok.dev && st.dev.all - st.dev.fresh) log('  ⓘ ข้ามป้าย Device: ' + ok.devWhy);
  why.forEach(w => log('  ⓘ ' + w));
  if (left.length) { log('⚠ ' + FEATURE_TITLE + ': เหลือของเก่า ' + left.length + ' ชิ้น — ' + left.slice(0, 10).map(f => (f.kind === 'head' ? f.code : f.kind === 'bar' ? 'แถบ ' + f.code : 'ป้าย ' + (f.type === 'Header' ? 'Device' : f.type)) + ' "' + f.node.name + '" (' + Math.round(f.node.x) + ',' + Math.round(f.node.y) + ')').join(' · ')); }
  else log('✓ ' + FEATURE_TITLE + ': ป้ายเป็นตัวใหม่ครบ เหลือของเก่า 0');
  return left.length;
}
/* พร้อมแทนไหม + เหตุผลภาษาคน (ใช้ทั้งตอนแทนและตอนตรวจก่อน) */
function labelReady() {
  const lib = (n) => INDEX.has(n) && /^ไลบรารี/.test(ROUTE[n] || '');
  const r = { bar: false, dev: false, barWhy: '', devWhy: '' };
  const H = INDEX.get('Header');
  if (!lib('Header')) r.barWhy = 'นำเข้า Header ตัวใหม่ไม่ได้' + (LABEL_ERR.Header ? ' (' + LABEL_ERR.Header + ')' : '') + ' — ไฟล์ UI Backup ต้อง publish Header';
  else if (H.type !== 'COMPONENT_SET' || !H.children.some(c => (c.variantProperties || {}).Type === 'Subheader')) r.barWhy = 'Header ที่นำเข้าไม่มี variant Type=Subheader';
  else r.bar = true;
  r.head = r.bar && H.children.some(c => (c.variantProperties || {}).Type === 'Header');
  const D = INDEX.get('Device Type');
  if (!lib('Device Type')) r.devWhy = LABEL_KNOWN['Device Type'] ? 'นำเข้า Device Type ตัวใหม่ไม่ได้' + (LABEL_ERR['Device Type'] ? ' (' + LABEL_ERR['Device Type'] + ')' : '') + ' — น่าจะยังไม่ได้ publish Device Type ในไฟล์ UI Backup' : 'ยังไม่รู้จัก Device Type ตัวใหม่ — ลาก Device Type จาก Assets มาวางในไฟล์นี้ 1 ชิ้น (ที่ไหนก็ได้) แล้วกดใหม่ · หรือเปิดพระผู้สร้างในไฟล์ UI Backup 1 ครั้ง';
  else if (D.type === 'COMPONENT_SET' && !['Header', 'Desktop', 'Mobile'].every(k => deviceVariant(k))) r.devWhy = 'Device Type ตัวใหม่มี variant ไม่ครบ — ' + deviceSetInfo();
  else r.dev = true;
  return r;
}
async function labelPreflight() {   // บอกก่อนแตะอะไร ว่ารอบนี้จะแทนอะไรได้บ้าง
  const keys = await labelKeys();
  ['Header', 'Device Type'].forEach(n => { LABEL_KNOWN[n] = !!keys[n] || !!LABEL_DEFAULT[n]; });
  const r = labelReady(), vals = (n) => { const c = INDEX.get(n); return c && c.type === 'COMPONENT_SET' ? c.children.map(x => Object.values(x.variantProperties || {}).join('/')).join(', ') : c ? 'component เดี่ยว' : '-'; };
  log('ตรวจก่อนแทน: Header ' + (r.bar ? '✓ [' + vals('Header') + '] จาก ' + ROUTE.Header : '✗ ' + r.barWhy));
  log('ตรวจก่อนแทน: Device Type ' + (r.dev ? '✓ [' + vals('Device Type') + '] จาก ' + ROUTE['Device Type'] : '✗ ' + r.devWhy));
  if (INDEX.get('Device Type') && INDEX.get('Device Type').type === 'COMPONENT') log('ⓘ ' + singleDeviceInfo());
  return r;
}

/* ส่งทุก Feature ไป FigJam ในรอบเดียว (ผู้ใช้สั่ง 17 พ.ย. 2569 "ทำ Figma ให้นิ่งก่อน แล้วเอาไป FigJam ได้ง่าย")
   ไล่ทุก Feature ที่มีหน้าและมีจอ MF / … อยู่แล้ว ⇒ export แบบเดียวกับปุ่มส่งราย Feature · Feature ที่ยังไม่สร้างข้ามไป */
async function exportAll(devices) {
  const sent = [], skip = [];
  for (const f of MF_FEATURES) {
    useFeature(f.id);
    const fp = await featurePage(false), page = fp && fp.page;
    if (!page || !page.children.some(n => n.type === 'FRAME' && n.name.indexOf(FEATURE_PREFIX + ' / ') === 0)) { skip.push(f.title); continue; }
    log('━━ Feature ' + f.title);
    await exportFigJam(devices, null);
    sent.push(f.title);
  }
  log('');
  log('ส่งแล้ว ' + sent.length + ' Feature: ' + (sent.join(' · ') || '-') + (skip.length ? ' · ยังไม่มีจอ (ข้าม): ' + skip.join(' · ') : ''));
  figma.ui.postMessage({ type: 'fj-all-done', sent, skip });
}
const featureList = () => MF_FEATURES.map(f => { useFeature(f.id); return { id: f.id, title: f.title, page: f.page[0], cases: featureCount(FEATURE), happy: happyCount(FEATURE), jcases: FEATURE.map(j => featureCount([j])), jhappy: FEATURE.map((j, i) => (HAPPY[i] || []).length), journeys: FEATURE.map((j, i) => (i + 1) + ' ' + j.title + ' (' + j.pages.length + ' หน้า · ' + featureCount([j]) + ' เฟรม)') }; });

/* แทนตัวรับคำสั่งของ screens.js (ตัวที่ประกาศทีหลังมีผล) · msg.feature = Feature ที่เลือกในหน้าต่าง (ไม่ส่งมา = ตัวที่ใช้อยู่ · เริ่มต้น plan) */
figma.ui.onmessage = async (msg) => {
  try {
    if (await tgtHandle(msg)) return;   // เลือก / เพิ่ม / ลบบอร์ดปลายทาง · เปิดลิงก์ (targets.js)
    if (await updHandle(msg)) return;   // แท็บอัปเดต / ลบ (update.js · 18 พ.ย. 2569)
    /* msg.features = หลาย Feature ที่ติ๊ก (17 พ.ย. 2569) ⇒ ทำทีละ Feature ตามลำดับ · journey ที่ติ๊ก (pick) ใช้เฉพาะตอนเลือก Feature เดียว */
    const ids = Array.isArray(msg.features) && msg.features.length ? msg.features : [msg.feature];
    const multi = ids.length > 1, picks = msg.picks || {};   // picks = { id: [journey] } เลือก journey ราย Feature · ไม่มี id = ทุก journey
    const devices = msg.type === 'build-desktop' ? [false] : msg.type === 'build-mobile' ? [true] : devOf({ devices: msg.devices });
    const run = /^(build|export-figjam$|patch-labels$)/.test(msg.type), ok = [], fail = [];
    if (msg.type === 'patch-labels') { log('นำเข้า Header / Device Type ตัวใหม่…'); await resolveLabelsOnly(); const r = await labelPreflight(); if (!r.bar && !r.dev) { log('⚠ ยังไม่แทนอะไร: เหลือของเก่าทั้งหมด — แก้ตามเหตุผลข้างบนก่อน แล้วกดใหม่'); figma.ui.postMessage({ type: 'build-all-done', ok: [], fail: [], total: 0 }); return; } }
    if (run && multi) log('จะทำ ' + ids.length + ' Feature: ' + ids.map(id => (MF_FEATURES.find(f => f.id === id) || {}).title || id).join(' · '));
    for (const id of ids) {
      useFeature(id);
      const pick = picks[id] && picks[id].length ? picks[id] : multi ? null : msg.pick;
      if (run && multi) log('━━ Feature ' + F.title);
      /* Feature ไหนพัง ไปต่อ Feature ถัดไป (17 พ.ย. 2569 ผู้ใช้เจอสร้างได้ Page เดียว) */
      try {
        if (msg.type === 'build' || msg.type === 'build-desktop' || msg.type === 'build-mobile' || msg.type === 'build-pick') await buildFeature(devices, msg.type === 'build-pick' || picks[id] ? pick : null);
        if (msg.type === 'build-happy') await buildFeature(devices, pick && pick.length ? pick : null, true);   // เฉพาะ Happy flow (17 พ.ย. 2569)
        if (msg.type === 'export-figjam') await exportFigJam(devices, pick);   // ส่งจอไปบอร์ด FigJam (17 พ.ย. 2569)
        if (msg.type === 'patch-labels') await patchLabels();   // แทนป้ายบนจอที่สร้างแล้ว (17 พ.ย. 2569)
        if (run) ok.push(F.title);
      } catch (e) { fail.push(F.title); log('✗ Feature ' + F.title + ' หยุด — ' + (e && e.message ? e.message : e) + (multi ? ' · ไปต่อ Feature ถัดไป' : '')); }
    }
    if (run) {
      if (multi) { log(''); log((fail.length ? '⚠ ' : '') + 'ทำครบ ' + ok.length + '/' + ids.length + ' Feature' + (fail.length ? ' · พัง: ' + fail.join(' · ') : '') + ' · Page: ' + ids.map(id => (MF_FEATURES.find(f => f.id === id) || { page: ['?'] }).page[0]).join(' · ')); }
      figma.ui.postMessage({ type: 'build-all-done', ok, fail, total: ids.length });
    }
    if (msg.type === 'export-figjam-all') await exportAll(devices);   // ส่งทุก Feature (17 พ.ย. 2569)
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
{ const list = featureList(); useFeature(MF_FEATURES[0].id); figma.ui.postMessage({ type: 'features', list }); figma.ui.postMessage({ type: 'journeys', items: list[0].journeys }); }
tgtPost();   // รายการบอร์ดปลายทางที่จำไว้
rememberLabels();   // เปิดในไฟล์ที่มี Device Type / Header / State ⇒ จำ key ไว้ใช้ในไฟล์อื่น (17 พ.ย. 2569)
try { figma.ui.resize(360, 620); } catch (e) { /* core.js เปิดหน้าต่าง 460×520 · หน้าต่างพระผู้สร้างแบบ Figma ใช้ 360×620 (17 พ.ย. 2569) */ }

/* ======================== maintainance-feature-plugin/update.js ======================== */
/* ============================================================================
   maintainance-feature-plugin/update.js — แท็บ "อัปเดต / ลบ" (18 พ.ย. 2569 · ผู้ใช้ขอ)
   ----------------------------------------------------------------------------
   ก. ลบส่วนที่สร้างแล้ว — Feature ที่ติ๊ก × ส่วน Happy flow / ทุกเคส ⇒ ลบหัวส่วน แถบ Header ป้าย Device และจอของส่วนนั้น (ทุกชุดบน Page)
      หาจากป้าย pluginData 'mf' ที่ featureGrid ติดไว้ ('happy' 'happy-<j>' = Happy flow · 'full' '<j>' = ทุกเคส · 'title' = Title Feature ไม่ลบเด็ดขาด)
      ชิ้นที่ไม่มีป้าย ⇒ ดูตำแหน่ง: อยู่ใต้หัวส่วนไหน (หัวที่ใกล้ที่สุดด้านบน และแนวนอนอยู่ในช่วงของหัวนั้น)
      ชิ้นที่ไม่ใช่ของปลั๊กอิน (ไม่มีป้าย และชื่อไม่ขึ้นต้น "MF / " หรือ "MF · ") ไม่แตะ · ต้องยืนยันจำนวนก่อนลบ · ลบแล้วไม่ขยับของอื่น
   ข. อัปเดตจอที่เปลี่ยน — เทียบลายเซ็น (sig.js) ที่เก็บในจอกับลายเซ็นของโค้ดตอนนี้ ⇒ สร้างใหม่เฉพาะจอที่ต่าง วางที่เดิม (parent · ลำดับ layer · x/y)
      จอที่ยังไม่มีบนหน้า วางในช่องของมันถ้าช่องว่าง · จอที่ไม่มีใน Feature แล้ว รายงานเฉยๆ ไม่ลบ
      จอที่สร้างก่อนมีระบบตรวจ (ไม่มีลายเซ็น) ⇒ ค่าตั้งต้น "สร้างใหม่" · "ถือว่าล่าสุด" ได้เฉพาะจอที่สร้างหลังเวลา build ของ code.js และชื่อเฟรมตรงเคสปัจจุบัน
      ไม่นับการเปลี่ยนในไลบรารี Figma (component อัปเดตแล้วลายเซ็นไม่เปลี่ยน)
   ค. สร้างจอที่เลือกใหม่ — เลือกเฟรมจอ MF / … ใน Figma แล้วกด (แนวเดียวกับ replaceSelected ของพี่นุ 890d54c: จับคู่ journey + หน้า แล้วชื่อเคส วางที่ตำแหน่งและลำดับ layer เดิม)
   ทุกโหมด: ไม่แตะจอที่ไม่เกี่ยว · ย้อนได้ด้วย Cmd+Z หรือ Version history
   ============================================================================ */
const FRAME_CODE_RE = /^MF \/ (H?\d+(?:\.\d+)+) · (.+?) › (.+?) — (.+?)( · mobile)?$/;
const SECTION_OF_TAG = (t) => t === 'title' ? 'title' : t === 'happy' || /^happy-\d+$/.test(t) ? 'happy' : t === 'full' || /^\d+$/.test(t) ? 'full' : '';
const PART_NAME = { happy: 'Happy flow', full: 'ทุกเคส' };
const tagOf = (n) => { try { return (n.getPluginData && n.getPluginData(MF_TAG)) || ''; } catch (e) { return ''; } };
const pdata = (n, k) => { try { return (n.getPluginData && n.getPluginData(k)) || ''; } catch (e) { return ''; } };

/* รีวิวโคนัน 18 พ.ย. 2569 (แก้ในรอบย้ายฐาน):
   1 จอเก่าไม่มีลายเซ็น ค่าตั้งต้น = สร้างใหม่ · "ถือว่าล่าสุด" ได้เฉพาะจอที่สร้างหลังเวลา build ของ code.js (MF_BUILT_AT) และชื่อเฟรมตรงเคสปัจจุบัน · ชื่อไม่ตรง = เปลี่ยน
   2 ติ๊กสร้างใหม่ทุกจอ ⇒ จอเก่าเข้า "สร้างใหม่" ด้วยเสมอ · 5 จอใหม่สูงขึ้นจนทับเฟรมอื่น ⇒ เตือนพร้อมชื่อจอ · 6 สร้างจอที่เลือกใหม่ จับคู่ journey + หน้า ก่อนชื่อเคส
   7 ลบส่วน บอกชิ้นที่ไม่รู้ว่าอยู่ส่วนไหน + ชื่อ Page · Page หลักและ "(พระผู้สร้าง)" มีชุดทั้งคู่ ⇒ บอกและทำทั้งสอง Page · 8 แถบเคสหาด้วยพิกัด absolute ทำทั้ง Desktop/Mobile */
const absOf = (n) => n.absoluteBoundingBox || { x: n.x, y: n.y, width: n.width, height: n.height };
/* Page ของ Feature ที่มีอยู่แล้ว (ไม่สร้าง) — Page หลัก และ/หรือ "<ชื่อ> (พระผู้สร้าง)" · ยอมให้มีของคนอื่นปน (ผู้ใช้วางของเพิ่มเองได้) */
async function existingPages() {
  const name = FEATURE_PAGE[0], out = [];
  for (const n of [ALT_PAGE(name), name]) { const p = figma.root.children.find(x => x.type === 'PAGE' && x.name === n); if (p) { if (p.loadAsync) await p.loadAsync(); out.push(p); } }
  return out;
}
const hasScreens = (p) => p.children.some(n => n.type === 'FRAME' && (n.name || '').indexOf(FEATURE_PREFIX + ' / ') === 0);
/* Page ที่ใช้อัปเดต: Page ที่มีจอ (ทั้งคู่มี ⇒ ใช้ "(พระผู้สร้าง)" ตามลำดับของ featurePage และบอกใน log) */
async function existingPage() {
  const ps = await existingPages(), withS = ps.filter(hasScreens);
  if (withS.length > 1) log('ⓘ ' + F.title + ': มีจอทั้ง Page "' + withS[0].name + '" และ "' + withS[1].name + '" — อัปเดตเฉพาะ Page "' + withS[0].name + '"');
  return withS[0] || ps[0] || null;
}
/* ไล่ชิ้นบน Page แบบลึก (ผู้ใช้อาจย้ายเข้า Section / Group) · ไม่เข้าไปในจอ */
function walkPage(page, fn) {
  (function w(node) { for (const c of (node.children || []).slice()) { fn(c); if (c.children && (c.type === 'SECTION' || c.type === 'GROUP')) w(c); } })(page);
}

/* ======================= ก. ลบส่วน ======================= */
function sectionPieces(page, parts) {
  const all = [], heads = [];
  walkPage(page, (n) => {
    const nm = n.name || '', t = tagOf(n), mine = !!t || ownedNode(n);
    if (!mine) return;
    const h = nm.match(HEAD_RE);
    if (h) heads.push({ n, kind: h[1] === 'Feature' ? 'title' : /^Happy flow/.test(h[2]) ? 'happy' : 'full' });
    all.push({ n, t });
  });
  const byPos = (n) => {   // หัวที่ใกล้ที่สุดด้านบน ที่แนวนอนครอบชิ้นนี้ (ป้าย Device อยู่ซ้ายหัว GRID.side + GRID.gap)
    const b = absOf(n); let best = null;
    for (const h of heads) { const hb = absOf(h.n); if (hb.y <= b.y + 1 && b.x >= hb.x - GRID.side - GRID.gap - 50 && b.x < hb.x + hb.width && (!best || hb.y > absOf(best.n).y)) best = h; }
    return best ? best.kind : '';
  };
  const out = [], cnt = { head: 0, bar: 0, dev: 0, screen: 0 }; let guessed = 0, unknown = 0;
  for (const { n, t } of all) {
    if (/^MF · Feature /.test(n.name || '') || t === 'title') continue;   // Title Feature ไม่ลบเด็ดขาด
    let kind = SECTION_OF_TAG(t);
    if (!kind) { kind = byPos(n); if (kind === 'title' || !kind) { unknown++; continue; } guessed++; }
    if (parts.indexOf(kind) < 0) continue;
    out.push(n);
    const nm = n.name || '';
    if (n.type === 'FRAME' && nm.indexOf(FEATURE_PREFIX + ' / ') === 0) cnt.screen++;
    else if (HEAD_RE.test(nm)) cnt.head++;
    else if (LABEL_RE.test(nm)) cnt.dev++;
    else cnt.bar++;
  }
  return { list: out, cnt, guessed, unknown };
}
async function deleteSections(msg, ids) {
  const parts = (msg.parts || []).filter(p => PART_NAME[p]);
  if (!parts.length) { log('✗ ยังไม่ได้ติ๊กส่วนที่จะลบ (Happy flow / ทุกเคส)'); return done([], [], 0); }
  const per = [];
  for (const id of ids) {
    useFeature(id);
    const pages = await existingPages();
    if (!pages.length) { per.push({ id, title: F.title, none: true }); continue; }
    const both = pages.filter(hasScreens).length > 1;
    for (const page of pages) per.push(Object.assign({ id, title: F.title, page, both }, sectionPieces(page, parts)));
  }
  const total = per.reduce((a, p) => a + (p.list ? p.list.length : 0), 0);
  const what = parts.map(p => PART_NAME[p]).join(' + ');
  const lines = per.map(p => p.none ? p.title + ': ยังไม่มี Page' : p.title + ' · Page "' + p.page.name + '": ' + p.list.length + ' ชิ้น (หัวส่วน ' + p.cnt.head + ' · แถบ ' + p.cnt.bar + ' · ป้าย ' + p.cnt.dev + ' · จอ ' + p.cnt.screen + ')' +
    (p.guessed ? ' · ดูจากตำแหน่ง ' + p.guessed : '') + (p.unknown ? ' · ชิ้นที่ไม่รู้ว่าอยู่ส่วนไหน (ไม่ลบ) ' + p.unknown : '') + (p.both ? ' · มีชุดทั้ง Page หลักและ "(พระผู้สร้าง)" — ลบทั้งสอง Page' : ''));
  if (!msg.confirm) {
    log('ตรวจก่อนลบส่วน ' + what + ':'); lines.forEach(l => log('  · ' + l));
    log(total ? 'รอยืนยัน: จะลบ ' + total + ' ชิ้น · Title Feature และของที่ไม่ใช่ของปลั๊กอินไม่ถูกแตะ' : 'ไม่มีชิ้นของส่วน ' + what + ' ให้ลบ');
    figma.ui.postMessage({ type: 'mf-confirm', action: 'delete', total, title: 'ลบส่วน ' + what, lines, payload: { parts, features: ids } });
    return true;
  }
  if (msg.expect !== total) { log('✗ จำนวนชิ้นเปลี่ยนจากตอนตรวจ (' + msg.expect + ' → ' + total + ') ยังไม่ลบ — กดตรวจใหม่อีกครั้ง'); return done([], [], ids.length); }
  let gone = 0;
  for (const p of per) if (p.list) { for (const n of p.list) { try { if (!n.removed) { n.remove(); gone++; } } catch (e) { warn('ลบ ' + n.name, e); } } if (p.list.length) log('✓ ' + p.title + ' · Page "' + p.page.name + '": ลบส่วน ' + what + ' แล้ว ' + p.list.length + ' ชิ้น'); }
  log(''); log('ลบแล้ว ' + gone + ' ชิ้น · ของอื่นอยู่ที่เดิม ไม่ถูกขยับ · ย้อนได้ด้วย Cmd+Z');
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน)' : 'ไม่มีคำเตือน ✓');
  return done([...new Set(per.filter(p => p.list).map(p => p.title))], [], ids.length);
}
function done(ok, fail, total) { figma.ui.postMessage({ type: 'build-all-done', ok, fail, total }); return true; }

/* ======================= ข. อัปเดตจอที่เปลี่ยน ======================= */
/* ทุกจอของ Feature ตามที่ featureGrid จัด (x ตามผังก่อนเลื่อนทั้งชุด) · row = แถวเดียวกัน (Happy/ทุกเคส × journey) */
function featureItems(pick) {
  const js = pick && pick.length ? FEATURE.filter((j, i) => pick.indexOf(String(i)) >= 0) : FEATURE, out = [];
  for (const j of js) {
    const ji = FEATURE.indexOf(j);
    for (const pg of happyPages(ji)) for (const it of pg.items) out.push({ it, row: 'h' + ji, title: j.title + ' (Happy flow)', pg: pg.name, ji });
    for (const pg of featurePages(j, ji)) for (const it of pg.items) out.push({ it, row: 'f' + ji, title: j.title, pg: pg.name, ji });
  }
  return { out, js: js.map(j => FEATURE.indexOf(j)) };
}
/* จอบนหน้า: รหัส|อุปกรณ์ → เฟรมที่สร้างล่าสุด (หลายชุดบนหน้า ⇒ ชุดล่าสุดตามแบบ fjShots) */
function pageFrames(page) {
  const map = new Map(); let older = 0;
  walkPage(page, (n) => {
    if (n.type !== 'FRAME') return; const m = (n.name || '').match(FRAME_CODE_RE); if (!m) return;
    const k = m[1] + '|' + (/ · mobile$/.test(n.name) ? 'm' : 'd'), cur = map.get(k);
    if (cur) older++;
    if (!cur || +pdata(n, 'builtAt') >= +pdata(cur, 'builtAt')) map.set(k, n);
  });
  return { map, older };
}
/* วางจอใหม่แทนที่เฟรมเดิม: parent · ลำดับ layer · x/y เดิม · ป้าย mf เดิม แล้วลบเฟรมเดิม
   จอใหม่สูงขึ้นจนทับเฟรมอื่น ⇒ เตือนพร้อมชื่อจอ (ไม่ขยับของอื่นเอง) */
let OVERLAPS = 0;
async function replaceFrame(page, old, x, mob) {
  const parent = old.parent, at = { x: old.x, y: old.y }, tag = tagOf(old), oldH = old.height;
  const s = await makeScreen(page, x.it, mob, FEATURE_PREFIX, x.title, x.pg, at, (n) => {
    parent.insertChild(Math.min(parent.children.indexOf(old), parent.children.length), n); n.x = at.x; n.y = at.y;
    try { if (tag && n.setPluginData) n.setPluginData(MF_TAG, tag); } catch (e) { /* */ }
  });
  if (!s) return null;
  try { old.remove(); } catch (e) { warn('ลบจอเดิม ' + old.name, e); }
  if (s.height > oldH + 0.5) {
    const hit = parent.children.filter(n => n !== s && n.type === 'FRAME' && n.x < s.x + s.width && n.x + n.width > s.x && n.y < s.y + s.height && n.y + n.height > s.y && n.y >= s.y + oldH - 0.5);
    if (hit.length) { OVERLAPS++; log('⚠ จอ "' + s.name + '" สูงขึ้นจาก ' + Math.round(oldH) + ' เป็น ' + Math.round(s.height) + ' จึงทับ "' + hit[0].name + '"' + (hit.length > 1 ? ' และอีก ' + (hit.length - 1) + ' ชิ้น' : '') + ' — ขยับเองใน Figma หรือกดสร้างใหม่ทั้ง journey'); }
  }
  return s;
}
/* แถบเคสเหนือจอ (ทั้ง Desktop และ Mobile): ชื่อเคสเปลี่ยน ⇒ แทนแถบที่คอลัมน์เดียวกัน (พิกัด absolute · ที่เดิม · กว้างเดิม) */
async function refreshBar(page, frame, it) {
  const want = FEATURE_PREFIX + ' · ' + it.code + ' ' + it.label, fb = absOf(frame); let bar = null;
  walkPage(page, (n) => { const m = (n.name || '').match(BAR_RE); if (!m || m[1] !== it.code) return; const b = absOf(n); if (Math.abs(b.x - fb.x) < 1 && b.y < fb.y && (!bar || b.y > absOf(bar).y)) bar = n; });
  if (!bar || bar.name === want) return false;
  CREATED = [];
  try {
    const n = await flowBar(FEATURE_PREFIX, it.code, it.label, barState(it.code), bar.width), parent = bar.parent;
    parent.insertChild(parent.children.indexOf(bar), n); n.x = bar.x; n.y = bar.y;
    try { const t = tagOf(bar); if (t) n.setPluginData(MF_TAG, t); } catch (e) { /* */ }
    bar.remove(); CREATED = []; return true;
  } catch (e) { warn('แถบ ' + it.code, e); dropMade(); return false; }
}
/* ช่องของจอที่ยังไม่มี: เทียบจอข้างเคียงในแถวเดียวกัน (ชุดเดียวกัน) ⇒ x/y · ช่องต้องว่าง (ไม่ทับเฟรมใด) */
function slotFor(page, x, mob, items, frames) {
  const sib = items.map(o => ({ o, f: frames.get(o.it.code + '|' + (mob ? 'm' : 'd')) })).find(p => p.o.row === x.row && p.f);
  if (!sib) return null;
  const dx = sib.f.x - sib.o.it.x, pos = { x: x.it.x + dx, y: sib.f.y, parent: sib.f.parent, sib: sib.f, sibItem: sib.o.it };
  const w = mob ? GRID.mobW : GRID.colW, h = mob ? GRID.mobH : GRID.deskH;
  const hit = (sib.f.parent.children || []).some(n => n.type === 'FRAME' && n.x < pos.x + w && n.x + n.width > pos.x && n.y < pos.y + h && n.y + n.height > pos.y);
  return hit ? Object.assign(pos, { busy: true }) : pos;
}
const BUILT_AT = typeof MF_BUILT_AT === 'number' ? MF_BUILT_AT : 0;
async function updateChanged(msg, ids) {
  const devices = devOf({ devices: msg.devices }), srcOk = sigSourceOk(), plans = [];
  for (const id of ids) {
    useFeature(id);
    const page = await existingPage();
    if (!page) { plans.push({ id, title: F.title, none: true }); continue; }
    const pick = (msg.picks || {})[id] || (ids.length > 1 ? null : msg.pick);
    const { out: items, js } = featureItems(pick), { map: frames, older } = pageFrames(page);
    const P = { id, title: F.title, page, items, frames, older, changed: [], unknown: [], missing: [], same: 0, nofn: 0, removed: [] };
    const keys = new Set();
    for (const x of items) for (const mob of devices) {
      const k = x.it.code + '|' + (mob ? 'm' : 'd'); keys.add(k);
      if (!x.it.fn) { P.nofn++; continue; }
      const f = frames.get(k), sig = itemSig(x.it, mob, x.title, x.pg), old = f && pdata(f, 'mfSig');
      if (!f) { P.missing.push({ x, mob, sig }); continue; }
      const sameName = f.name === screenName(FEATURE_PREFIX, x.it, x.title, x.pg, mob);
      if (msg.force || (old && old !== sig) || (!old && !sameName)) P.changed.push({ x, mob, f, sig });   // ข้อ 1 2: ติ๊กสร้างใหม่ทุกจอ / ชื่อเคสไม่ตรง ⇒ เปลี่ยนเสมอ
      else if (!old) P.unknown.push({ x, mob, f, sig, fresh: +pdata(f, 'builtAt') >= BUILT_AT });   // fresh = สร้างหลัง build นี้ ⇒ "ถือว่าล่าสุด" ได้
      else P.same++;
    }
    for (const [k, f] of frames) { const [code, d] = k.split('|'); if (!keys.has(k) && devices.indexOf(d === 'm') >= 0 && js.indexOf(+code.replace('H', '').split('.')[0] - 1) >= 0) P.removed.push(f.name); }
    plans.push(P);
  }
  const live = plans.filter(p => !p.none), sum = (k) => live.reduce((a, p) => a + (Array.isArray(p[k]) ? p[k].length : p[k]), 0);
  const fresh = live.reduce((a, p) => a + p.unknown.filter(u => u.fresh).length, 0);
  const legacy = msg.legacy === 'baseline' ? 'baseline' : 'rebuild';   // ข้อ 1: ค่าตั้งต้น = สร้างใหม่
  const baseWork = sum('changed') + sum('missing'), work = baseWork + (legacy === 'rebuild' ? sum('unknown') : 0);
  const lines = plans.map(p => p.none ? p.title + ': ยังไม่มี Page — กดสร้างในแท็บสร้างจอก่อน' : p.title + ' · Page "' + p.page.name + '": ' + (msg.force ? 'สร้างใหม่ ' : 'เปลี่ยน ') + p.changed.length + ' · ยังไม่มีบนหน้า ' + p.missing.length +
    ' · จอที่สร้างก่อนมีระบบตรวจ (บอกไม่ได้ว่าตรงกับโค้ดล่าสุดไหม) ' + p.unknown.length + ' · ไม่เปลี่ยน ' + p.same + (p.removed.length ? ' · ไม่มีใน Feature แล้ว ' + p.removed.length + ' (ไม่ลบ)' : '') + (p.older ? ' · ชุดเก่าบนหน้า ' + p.older + ' (ไม่แตะ)' : ''));
  if (!msg.confirm) {
    log('ตรวจจอที่เปลี่ยน (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ' · ไม่นับการเปลี่ยนในไลบรารี Figma):'); lines.forEach(l => log('  · ' + l));
    live.forEach(p => p.removed.slice(0, 5).forEach(n => log('    ไม่มีใน Feature แล้ว: ' + n)));
    if (!srcOk && !msg.force) log('ⓘ ปลั๊กอินตรวจไม่ได้ว่าจอไหนเปลี่ยน ให้ใช้สร้างใหม่ทุกจอ หรือเลือกจอแล้วสร้างใหม่');
    figma.ui.postMessage({ type: 'mf-confirm', action: 'update', total: baseWork, unknown: sum('unknown'), unknownFresh: fresh, title: msg.force ? 'สร้างใหม่ทุกจอของ journey ที่ติ๊ก' : 'อัปเดตจอที่เปลี่ยน', lines, blocked: !srcOk && !msg.force, payload: { features: ids, picks: msg.picks, pick: msg.pick, devices: msg.devices, force: !!msg.force } });
    return true;
  }
  if (!srcOk && !msg.force) { log('✗ ยังไม่อัปเดต — ปลั๊กอินตรวจไม่ได้ว่าจอไหนเปลี่ยน ให้ใช้สร้างใหม่ทุกจอ หรือเลือกจอแล้วสร้างใหม่'); return done([], [], ids.length); }
  if (msg.expect !== baseWork || (msg.expectUnknown != null && msg.expectUnknown !== sum('unknown'))) { log('✗ จำนวนจอเปลี่ยนจากตอนตรวจ (' + msg.expect + ' → ' + baseWork + (msg.expectUnknown != null ? ' · จอเก่า ' + msg.expectUnknown + ' → ' + sum('unknown') : '') + ') ยังไม่อัปเดต — กดตรวจใหม่อีกครั้ง'); return done([], [], ids.length); }
  errors.length = 0; const t0 = Date.now(); orphans = 0; TIMES = []; capped = 0; OVERLAPS = 0;
  if (work) { log('นำเข้า component จากไลบรารี…'); await resolveFast(); }
  let n = 0, based = 0, skipped = 0, placed = 0, bars = 0; const ok = [], notPlaced = [];
  for (const p of live) {
    useFeature(p.id); await figma.setCurrentPageAsync(p.page);
    if (legacy === 'baseline') for (const u of p.unknown) {
      if (!u.fresh) { skipped++; continue; }   // สร้างก่อน build นี้ ⇒ ไม่ถือว่าล่าสุด ไม่แตะ
      try { u.f.setPluginData('mfSig', u.sig); u.f.setPluginData('mfFeature', p.id); based++; } catch (e) { warn('เก็บลายเซ็น ' + u.f.name, e); }
    }
    const redo = p.changed.concat(legacy === 'rebuild' ? p.unknown : []);
    for (const c of redo) {
      const s = await replaceFrame(p.page, c.f, c.x, c.mob);
      if (s) { n++; p.frames.set(c.x.it.code + '|' + (c.mob ? 'm' : 'd'), s); log('  · ' + n + '/' + work + ' แทนที่ ' + s.name); if (await refreshBar(p.page, s, c.x.it)) bars++; }   // อัปเดตแผนที่จอ ⇒ จอที่วางเพิ่มทีหลังเทียบกับเฟรมใหม่ (เฟรมเดิมถูกลบแล้ว)
    }
    for (const m of p.missing) {
      const pos = slotFor(p.page, m.x, m.mob, p.items, p.frames);
      if (!pos || pos.busy) { notPlaced.push(p.title + ' ' + m.x.it.code + (m.mob ? ' mobile' : '') + (pos ? ' — วางที่เดิมไม่ได้เพราะมีจออื่นอยู่ ให้กดสร้างใหม่ทั้ง journey' : ' — ไม่มีจออื่นในแถวนี้ให้เทียบตำแหน่ง ให้กดสร้างใหม่ทั้ง journey')); continue; }
      const tag = tagOf(pos.sib), parent = pos.parent;
      const s = await makeScreen(p.page, m.x.it, m.mob, FEATURE_PREFIX, m.x.title, m.x.pg, pos, (nn) => { parent.insertChild(Math.max(0, parent.children.indexOf(pos.sib)), nn); nn.x = pos.x; nn.y = pos.y; try { if (tag) nn.setPluginData(MF_TAG, tag); } catch (e) { /* */ } });
      if (!s) continue;
      n++; placed++; p.frames.set(m.x.it.code + '|' + (m.mob ? 'm' : 'd'), s); log('  · ' + n + '/' + work + ' วางจอใหม่ ' + s.name);
      if (!m.mob) {   // แถบเคสเหนือจอ (แถวแถบเดียวกับแถบของจอข้างเคียง)
        let sb = null; const sa = absOf(pos.sib); walkPage(p.page, (x) => { const mm = (x.name || '').match(BAR_RE); if (!mm || mm[1] !== pos.sibItem.code) return; const b = absOf(x); if (Math.abs(b.x - sa.x) < 1 && b.y < sa.y && (!sb || b.y > absOf(sb).y)) sb = x; });
        if (sb) { CREATED = []; try { const b = await flowBar(FEATURE_PREFIX, m.x.it.code, m.x.it.label, barState(m.x.it.code), GRID.colW); sb.parent.insertChild(sb.parent.children.indexOf(sb), b); b.x = pos.x; b.y = sb.y; try { if (tagOf(sb)) b.setPluginData(MF_TAG, tagOf(sb)); } catch (e) { /* */ } bars++; } catch (e) { warn('แถบ ' + m.x.it.code, e); dropMade(); } CREATED = []; }
      }
    }
    ok.push(p.title);
  }
  log('');
  log('อัปเดตแล้ว ' + n + ' จอ (แทนที่ ' + (n - placed) + ' · วางจอใหม่ ' + placed + ')' + (bars ? ' · แถบเคส ' + bars : '') + (based ? ' · ถือว่าล่าสุด ' + based + ' จอ' : '') + (skipped ? ' · จอที่สร้างก่อนมีระบบตรวจ ไม่แตะ ' + skipped + ' จอ (เลือก "สร้างใหม่" ถ้าต้องการให้ตรงโค้ดล่าสุด)' : '') + ' · จอที่ไม่เปลี่ยนไม่ถูกแตะ');
  if (notPlaced.length) { log('ⓘ วางไม่ได้ ' + notPlaced.length + ' จอ:'); notPlaced.slice(0, 10).forEach(x => log('    ' + x)); }
  const rm = live.reduce((a, p) => a + p.removed.length, 0); if (rm) log('ⓘ จอที่ไม่มีใน Feature แล้ว ' + rm + ' จอ ยังอยู่บนหน้า (ไม่ลบเอง) — ลบเองได้');
  if (orphans) log('ชิ้นที่หลุดนอกจอระหว่างสร้าง (ลบแล้ว): ' + orphans);
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : OVERLAPS ? '⚠ จอสูงขึ้นจนทับเฟรมอื่น ' + OVERLAPS + ' จอ (รายการด้านบน)' : 'ไม่มีคำเตือน ✓');
  log('ใช้เวลา ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
  return done(ok, [], ids.length);
}

/* ======================= ค. สร้างจอที่เลือกใหม่ ======================= */
/* จับคู่เฟรมเดิมกับเคสใน Feature (ข้อ 6): ชื่อเฟรมตรงทุกตัวอักษร → journey + หน้า เดียวกัน แล้วชื่อเคส → journey + หน้า แล้วรหัส (ชื่อเคสเปลี่ยน) → ชื่อเคสอย่างเดียวทั้ง Feature
   ไม่แยกชื่อเฟรมด้วย regex (ชื่อหน้าเรื่องย่อยมี " — " ได้ เช่น A15) — เทียบเป็นข้อความต่อท้าย/ส่วนกลางแทน */
function matchItem(items, old, code, mob) {
  const tail = mob ? ' · mobile' : '', nm = old.name;
  const exact = items.find(o => nm === screenName(FEATURE_PREFIX, o.it, o.title, o.pg, mob)); if (exact) return { x: exact, note: '' };
  const jp = items.filter(o => nm.indexOf(' · ' + o.title + ' › ' + o.pg + ' — ') > 0);
  const byLabel = (pool) => pool.find(o => nm.endsWith(' — ' + o.it.label + tail));
  let x = byLabel(jp); if (x) return { x, note: '' };
  x = jp.find(o => o.it.code === code); if (x) return { x, note: ' (ชื่อเคสเปลี่ยน → "' + x.it.label.slice(0, 40) + '")' };
  x = byLabel(items); if (x) return { x, note: ' (ย้าย journey/หน้า)' };
  return null;
}
async function rebuildSelected() {
  errors.length = 0; const t0 = Date.now(); orphans = 0; TIMES = []; capped = 0; OVERLAPS = 0;
  const page = figma.currentPage;
  const f = MF_FEATURES.find(x => page.name === x.page[0] || page.name === ALT_PAGE(x.page[0]));
  const up = (n) => { for (let p = n; p && p.type !== 'PAGE'; p = p.parent) if (p.type === 'FRAME' && FRAME_CODE_RE.test(p.name || '')) return p; return null; };
  const sel = [...new Set((page.selection || []).map(up).filter(Boolean))];
  if (!f) { log('✗ Page นี้ ("' + page.name + '") ไม่ใช่ Page ของ Feature ใด — เปิด Page ของ Feature แล้วเลือกจอ "MF / …"'); return done([], [], 1); }
  if (!sel.length) { log('✗ ยังไม่ได้เลือกจอ "MF / …" บนหน้านี้ — คลิกเลือกเฟรมจอ (กด Shift เลือกหลายจอ) แล้วกดอีกครั้ง'); return done([], [], 1); }
  useFeature(f.id);
  const { out: items } = featureItems(null);
  log('สร้างจอที่เลือกใหม่ ' + sel.length + ' จอ · Feature ' + F.title);
  log('นำเข้า component จากไลบรารี…'); await resolveFast();
  let n = 0, skip = 0; const made = [];
  for (const old of sel) {
    const m = old.name.match(FRAME_CODE_RE), mob = / · mobile$/.test(old.name) || old.width <= 500;
    const r = matchItem(items, old, m[1], mob);
    if (!r || !r.x.it.fn) { skip++; log('  · ข้าม "' + old.name + '" — ไม่มีเคสนี้ใน Feature ตอนนี้ ไม่แตะ'); continue; }
    const s = await replaceFrame(page, old, r.x, mob);
    if (s) { n++; made.push(s); log('  · ' + n + '/' + sel.length + ' แทนที่ ' + s.name + (r.x.it.code !== m[1] ? ' (รหัสเดิม ' + m[1] + ')' : '') + r.note); await refreshBar(page, s, r.x.it); }
  }
  figma.currentPage.selection = made;
  log('');
  log('แทนที่แล้ว ' + n + ' จอ · ข้าม ' + skip + ' · จอที่ไม่ได้เลือกไม่ถูกแตะ · ส่วนที่แก้มือในจอที่เลือกหาย ย้อนได้ด้วย Cmd+Z หรือ Version history');
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : OVERLAPS ? '⚠ จอสูงขึ้นจนทับเฟรมอื่น ' + OVERLAPS + ' จอ (รายการด้านบน)' : 'ไม่มีคำเตือน ✓');
  log('ใช้เวลา ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
  return done([F.title], [], 1);
}

/* ตัวรับคำสั่งของแท็บอัปเดต/ลบ — คืน true = จัดการแล้ว */
async function updHandle(msg) {
  const ids = Array.isArray(msg.features) && msg.features.length ? msg.features : [msg.feature || MF_FEATURES[0].id];
  if (msg.type === 'delete-section') return deleteSections(msg, ids);
  if (msg.type === 'update-changed') return updateChanged(msg, ids);
  if (msg.type === 'rebuild-selected') return rebuildSelected();
  if (msg.type === 'rc-clear') {   // ล้างแคชของ resolveAll (core ฐาน origin · componentCache) + ความจำรุ่นก่อนของเรา (mf-resolve)
    try { figma.root.setPluginData(COMP_CACHE, ''); figma.root.setPluginData('mf-resolve', ''); } catch (e) { /* */ }
    RESOLVED = false;
    log('✓ ล้างความจำ component ของไฟล์นี้แล้ว — รอบหน้าหาใหม่ทั้งหมด (ครั้งแรกอาจนานขึ้น)'); return done(['ล้างความจำ'], [], 1);
  }
  return false;
}

})();
