/* ⚠ ไฟล์นี้ประกอบอัตโนมัติด้วย maintainance-feature-plugin/build.js — แก้ที่ feature.js (หรือต้นทาง core.js / screens.js) แล้วรันใหม่ (2026-11-18T04:37) */
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
const ALIAS = {};   // 19 ต.ค.: Sidebar navigation มี key ของไฟล์ component แล้ว ไม่ต้องอ้างชื่อ Sidebar ของ UI Release#2
const INDEX = new Map();     // ชื่อ → COMPONENT_SET / COMPONENT ที่ใช้ได้
const ROUTE = {};            // ชื่อ → ได้มาทางไหน
let IMPORT_ERR = '';
const holderOf = (c) => (c.parent && c.parent.type === 'COMPONENT_SET') ? c.parent : c;
async function resolveAll(list, checkOnly) {
  list = list || NEEDED;
  await figma.loadAllPagesAsync();
  const local = new Map();
  for (const n of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
    if (n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') continue;
    if (!local.has(n.name)) local.set(n.name, n);
  }
  log('component ในไฟล์นี้เอง ' + local.size + ' ตัว');
  /* ยืมจาก instance ในไฟล์ = ทางสุดท้าย — สแกนเฉพาะเมื่อมีตัวที่นำเข้าไม่ได้ (เดิมสแกนทุกรอบ: ไฟล์มี instance หลายพันตัว ช้ามาก) */
  const viaInst = new Map();
  let scanned = false;
  const scanInstances = async () => {
    if (scanned) return; scanned = true;
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
    if (!got) for (const x of names) { if (local.has(x)) { got = local.get(x); how = 'สำเนาในไฟล์นี้ ⚠ ลิงก์วนในไฟล์นี้'; break; } }
    if (!got) await scanInstances();
    if (!got) for (const x of names) { if (viaInst.has(x)) { got = viaInst.get(x); how = 'จาก instance ในไฟล์ ⚠ อาจลิงก์ไปไลบรารีที่เปิดไม่ได้'; break; } }
    if (!got && importErr) how = 'นำเข้าไม่ได้: ' + importErr;
    if (importErr && !IMPORT_ERR && !NESTED_ONLY.has(name)) IMPORT_ERR = importErr;   // ชิ้นส่วนซ้อน (เช่น _Dropdown menu item ที่ Figma ไม่ publish) ไม่ต้องเตือน
    if (got) { INDEX.set(name, got); ROUTE[name] = how + (got.name !== name ? ' (ชื่อ ' + got.name + ')' : ''); }
    else missing.push(name + (how ? ' — ' + how : ''));
  }
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
function menuAt(scr, anchor, items) {   // Dropdown menu ใต้ปุ่ม "…" · mobile = ไม่เปิดเมนู เพราะการ์ดมือถือแสดงไอคอนดู แก้ไข ลบ ครบแล้ว (4 พ.ย. 2569) · ตั้ง MENU_SHEET = true ถ้าจะกลับไปใช้ bottom sheet
  if (MOB && !MENU_SHEET) return null;
  if (MOB) {
    overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), VH());
    const sh = frame('Sheet', 'VERTICAL', { fill: WHITE, pad: [0, 0] }); sh.topLeftRadius = sh.topRightRadius = 24;
    overlay(scr, sh, 0, 0); sh.counterAxisSizingMode = 'FIXED'; sh.resize(VW(), sh.height);
    const hd = inst('Bottom sheet header'); add(sh, hd, 'h'); const ta = find(hd, 'Text and action'); if (ta) ta.visible = false; const dv = find(hd, 'Divider'); if (dv) dv.visible = false;
    const m = inst('Dropdown menu'); add(sh, m, 'h'); hide(m, '_Dropdown menu header');
    const list = (find(m, 'Menu items') || m).children; const want = { 0: items[0], 1: items[1], 3: 'divider', 4: items[2] };
    list.forEach((it, i) => { const w = want[i]; if (!w) { it.visible = false; return; } if (w !== 'divider') setProps(it, { Text: w[0], Shortcut: false, Icon: true, 'Icon swap': icon(w[1]) }); });
    m.strokes = []; sh.y = VH() - sh.height;
    return m;
  }
  const m = inst('Dropdown menu');
  hide(m, '_Dropdown menu header');
  const list = (find(m, 'Menu items') || m).children;
  const want = { 0: items[0], 1: items[1], 3: 'divider', 4: items[2] };
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
    if (b.name === 'Secondary button' && first) { first = false; setProps(b, { Text: 'ตัวกรอง', 'Leading icon': true, 'Leading icon swap': icon('filter_list-24-400-round') }); const p = find(b, 'Pill outline'); if (p) { if (o.filterCount) setProps(p, { Text: String(o.filterCount) }); else p.visible = false; } }
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
/* ระยะในกริดบล็อก — เจ้าของงาน 10 พ.ย. 2569: "ปรับ spacing ของแต่ละหน้าจอและหัวข้อให้เป็น 200 เสมอ"
   gap = แถบหัวข้อ → จอ (และระยะเริ่มคอลัมน์จากคอลัมน์ป้าย Device) · colGap = จอ → จอ · rowGap = แถว desktop → แถว mobile
   ทั้งสามเป็น 200 เท่ากันหมด · groupGap คง 400 ไว้ให้บล็อก scenario ยังแยกจากกันชัด (เดิม gap 80 · rowGap 160) */
const GRID = { side: 300, gap: 200, colW: 1440, colGap: 200, rowGap: 200, groupGap: 400, barH: 120, stateW: 344, mobW: 402, deskH: 1024, mobH: 874 };
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
async function flowBar(prefix, code, title, state, width) {
  let bar = null;
  if (INDEX.has('Header') && !HEADER_BROKEN) {
    bar = inst('Header', { Type: 'Subheader' });
    const st = find(bar, 'State');
    if (st) setProps(st, { State: state });
    // Flow เป็น property ข้อความที่ผูกฟอนต์ของ component (LINE Seed Sans) — ตั้งตัวอักษรตรงๆ ผ่าน text() ที่สลับฟอนต์สำรองให้เมื่อเครื่องไม่มี
    const okCode = st ? await text(st, 'Text', code) : false;
    const det = find(bar, 'Detail'); const ts = det ? det.children.filter(c => c.type === 'TEXT') : [];
    const okTitle = ts[0] ? await text(det, ts[0], title) : false;
    if (ts[1]) ts[1].visible = false;   // บรรทัด "เงื่อนไข" ของทีมออกแบบ — ไม่ใช้
    if (!(okCode && okTitle)) {   // ใส่ข้อความไม่ได้ (ฟอนต์/โครง) → ป้ายจะไม่ตรง scenario ⇒ ถอยไปแถบธรรมดาทั้งชุด
      try { bar.remove(); } catch (e) { /* ลบไม่ได้ ปล่อย */ }
      bar = null; HEADER_BROKEN = true;
      log('⚠ แถบ Header ของทีมออกแบบใส่ข้อความไม่ได้ (ฟอนต์ของ component ไม่มีในเครื่อง) — ใช้แถบธรรมดาสีเดียวกันแทนทั้งชุด');
    } else { try { bar.resize(width, bar.height); } catch (e) { warn('ปรับกว้างแถบ ' + code, e); } }
  }
  if (!bar) {
    bar = fixed(frame('Header', 'HORIZONTAL'), width, GRID.barH);
    const st = fixed(frame('State', 'HORIZONTAL', { fill: rgbOf(BAR_FILL[state] || BAR_FILL.Default), pad: [0, 40] }), GRID.stateW, GRID.barH);
    st.primaryAxisAlignItems = 'CENTER'; st.counterAxisAlignItems = 'CENTER'; st.appendChild(await labelText(code, 64, '#FFFFFF')); bar.appendChild(st);
    const det = frame('Detail', 'HORIZONTAL', { fill: WHITE, pad: [0, 40] }); det.counterAxisAlignItems = 'CENTER'; bar.appendChild(det); det.layoutGrow = 1; det.layoutSizingVertical = 'FILL';
    det.appendChild(await labelText(title, 48, '#101828'));
  }
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
const SHOT_RE = /^(\S+) \/ ([A-Z])\.([0-9.]+) · (S\d+) — (.+)$/;
/* ตรวจจอซ้ำบนหน้าปัจจุบัน — ไม่แก้ไม่ลบอะไรทั้งสิ้น (เจ้าของงาน 10 พ.ย. 2569 "ช่วยหาทางตรวจให้" · "ลบเองได้")
   ทุกปุ่มสร้างของปลั๊กอินวางชุดใหม่ "ต่อใต้ของเดิม" เสมอ ⇒ กดสร้างซ้ำบนหน้าเดิมจะมีหลายชุดซ้อนกัน (เช่น เคยกด "สร้างเฉพาะ Desktop" แล้วมากด "สร้างทั้งชุด" ทีหลัง = Desktop 2 แถว Mobile 1 แถว)
   จับคู่ด้วย รหัสจอ + อุปกรณ์ จากชื่อเฟรม (SHOT_RE) · ชุดล่าสุดดูจาก pluginData builtAt */
async function auditDuplicates() {
  errors.length = 0;
  const page = figma.currentPage;
  if (page.loadAsync) await page.loadAsync();
  const all = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0);
  if (!all.length) { log('ไม่พบเฟรมจอ "' + PLUGIN.prefix + ' / …" บนหน้า "' + page.name.trim() + '" — เปิดหน้าที่มีจอแล้วกดใหม่'); return; }
  const by = new Map(); let skipped = 0;
  for (const f of all) {
    const mob = / · mobile$/.test(f.name), m = f.name.replace(/ · mobile$/, '').match(SHOT_RE);
    if (!m) { skipped++; continue; }
    const key = m[2] + '.' + m[3] + ' · ' + (mob ? 'mobile' : 'desktop');
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(f);
  }
  const builtAt = (f) => +((f.getPluginData && f.getPluginData('builtAt')) || 0);
  const dup = [...by.entries()].filter(([, v]) => v.length > 1);
  log('— ตรวจจอซ้ำบนหน้า "' + page.name.trim() + '" (ไม่แก้อะไร) —');
  log('เฟรมจอทั้งหมด ' + all.length + ' · รหัสจอไม่ซ้ำ ' + by.size + (skipped ? ' · ชื่อไม่เข้ารูปแบบ ' + skipped : ''));
  if (!dup.length) { log('✓ ไม่มีจอซ้ำ — หน้านี้มีชุดเดียว'); return; }
  const copies = Math.max(...dup.map(([, v]) => v.length));
  log('⚠ มีจอซ้ำ ' + dup.length + ' รหัส · ซ้ำมากสุด ' + copies + ' ชุด ⇒ หน้านี้น่าจะมี ' + copies + ' ชุดซ้อนกัน');
  const rows = {};   // แถว y ของแต่ละชุด เพื่อบอกว่าชุดไหนอยู่ตรงไหน
  for (const [, v] of dup) v.forEach((f, i) => { const k = Math.round(f.y / 500) * 500; rows[k] = (rows[k] || 0) + 1; });
  log('แถวที่พบจอซ้ำ (y โดยประมาณ → จำนวนจอ): ' + Object.keys(rows).sort((a, b) => a - b).map(k => k + ' → ' + rows[k]).join(' · '));
  for (const [k, v] of dup.slice(0, 20)) {
    const newest = v.reduce((a, b) => builtAt(b) > builtAt(a) ? b : a);
    log('  · ' + k + ' — ' + v.length + ' ชุด · y = ' + v.map(f => Math.round(f.y)).sort((a, b) => a - b).join(', ')
      + ' · ล่าสุด y=' + Math.round(newest.y) + (builtAt(newest) ? '' : ' (ชุดเก่าไม่มีเวลาสร้าง เดาจากลำดับไม่ได้)'));
  }
  if (dup.length > 20) log('  … และอีก ' + (dup.length - 20) + ' รหัส');
  log('วิธีเก็บกวาด: เก็บชุดที่ y ของ "ล่าสุด" ไว้ แล้วลบชุดอื่นเองใน Figma (ปลั๊กอินไม่ลบให้ — ตั้งใจไม่แตะของบนหน้า)');
}

async function exportShots(dir, scen) {   // scen = ['S1', 'S2'] ส่งเฉพาะ scenario ที่ติ๊ก (ว่าง = ทุกจอ · 9 พ.ย. 2569 เจ้าของงาน "อยากแยกการ export figjam ออกเป็น S เหมือนกันได้หรือไม่")
  errors.length = 0;
  const page = figma.currentPage;
  /* 5 พ.ย. 2569 เจ้าของงาน "export figjam อยากให้ออกมาเป็นแบบนี้ มี mobile มาด้วย … บอกว่าส่วนใหน desktop , mobile" ⇒ ส่งจอ mobile ด้วย (ชื่อเฟรมลงท้าย " · mobile") · device ใน manifest */
  const all = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0 && n.name.indexOf(' · ตัดแล้ว') < 0);
  const shots = [], skipped = [];
  for (const f of all) {
    const mob = / · mobile$/.test(f.name), m = f.name.replace(/ · mobile$/, '').match(SHOT_RE);
    if (m) shots.push({ f, code: m[2] + '.' + m[3], letter: m[2], no: m[3], scenario: m[4], name: m[5], device: mob ? 'mobile' : 'desktop' }); else skipped.push(f.name);
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
  const key = (s) => s.letter + s.no.split('.').map(x => x.padStart(3, '0')).join('.');
  shots.sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  if (!shots.length) { log('ไม่พบเฟรมจอ "' + PLUGIN.prefix + ' / …" บนหน้า "' + page.name + '" — เปิดหน้าที่มีจอแล้วกดใหม่'); return; }
  log('ส่งภาพจอ ' + shots.length + ' จอ จากหน้า "' + page.name + '" ไปที่ out/figjam/' + dir + '/ …');
  const manifest = { source: 'figma', page: page.name, exportedAt: new Date().toISOString(), scen: scen && scen.length ? scen : undefined, shots: [] };
  for (const s of shots) {
    try {
      const scale = Math.min(1, 4000 / Math.max(s.f.width, s.f.height));
      const bytes = await s.f.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      const file = s.code + '-' + s.scenario + (s.device === 'mobile' ? '-mobile' : '') + '.png';
      figma.ui.postMessage({ type: 'shot', dir, file, bytes });
      manifest.shots.push({ code: s.code, scenario: s.scenario, name: s.name, device: s.device, file, w: Math.round(s.f.width * scale), h: Math.round(s.f.height * scale) });
    } catch (e) { warn('export ' + s.f.name, e); }
  }
  figma.ui.postMessage({ type: 'shots-done', dir, manifest });
  log('export แล้ว ' + manifest.shots.length + '/' + shots.length + ' จอ' + (skipped.length ? ' · ข้าม ' + skipped.length + ' เฟรมที่ชื่อไม่ตรงรูปแบบ (เช่น ' + skipped[0] + ')' : '') + (errors.length ? ' · ⚠ เตือน ' + errors.length + ' จุด' : ''));
  log('ขั้นต่อไป: node figma-export/3-figjam-board.js --maintainance-ui --only --split-scen --out=board-maintainance-ui.json (ชุดเต็ม + แยกไฟล์ราย S) แล้วเปิดปลั๊กอินบอร์ดใน FigJam ใหม่ เลือกกลุ่ม "บำรุงรักษาตามวาระ · ราย scenario"');
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
  const top = y0 + GRID.barH + JGAP.bar + GRID.barH + JGAP.bar + backTop * JGAP.lane;
  const colX = []; let x = 0;
  J.cols.forEach((col, i) => { colX[i] = x; x += Math.max(...col.map(n => F[n] ? F[n].width : 0)) + JGAP.col; });
  const totalW = x - JGAP.col;
  const h0 = Math.max(...Object.keys(F).filter(n => !rowOf(n)).map(n => F[n].height));
  const rowY = [top, top + h0 + JGAP.row];
  const colOf = {}; J.cols.forEach((col, i) => col.forEach(n => { colOf[n] = i; }));
  for (const n of Object.keys(F)) { F[n].x = colX[colOf[n]]; F[n].y = rowY[rowOf(n)]; }
  /* แถบ Journey + ช่วงงาน (component Header ของทีมออกแบบ · ไม่มี = แถบธรรมดา) */
  CREATED = [];
  put(await flowBar(prefix, 'Journey', J.title, 'Default', totalW), 0, y0);
  for (const [i, [title, ns]] of (J.phases || []).entries()) {
    const xs = ns.filter(n => F[n]).map(n => F[n].x), xe = ns.filter(n => F[n]).map(n => F[n].x + F[n].width);
    if (!xs.length) continue;
    put(await flowBar(prefix, 'ช่วง ' + (i + 1), title, 'Sub Flow', Math.max(...xe) - Math.min(...xs)), Math.min(...xs), y0 + GRID.barH + JGAP.bar);
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

/* เส้นทางย่อยในบล็อก — แพตเทิร์นที่เจ้าของงานเคาะ 10 พ.ย. 2569 จากบล็อก S20 (S.3 ลบจากหน้า Detail → S.3.1 S.3.2)
   screens[i] เป็น { path: 'ชื่อเส้นทาง', screens: [[label, fn, ids], …] } แทน [label, fn, ids] ได้
   ⇒ ตำแหน่งนั้นมีแถบชื่อเส้นทาง (Sub Flow) คร่อมคอลัมน์ของตัวเอง และจอข้างใต้ได้รหัสซ้อน <code>.<i+1>.<j+1>
   ลำดับตำแหน่งระดับบนยังนับ 1..n ตามเดิม ⇒ เส้นหลักอ่านเป็นแถวเดียวจบ ส่วนทางแยกไม่กินเลขของเส้นหลัก
   entry แบบ array เดิมทำงานเหมือนเดิมทุกอย่าง (ปลั๊กอิน login · contractor-eval ไม่ต้องแก้) */
const isPath = (e) => !!e && !Array.isArray(e) && Array.isArray(e.screens);
const countScreens = (list) => list.reduce((a, e) => a + (isPath(e) ? e.screens.length : 1), 0);
function flatScreens(list, code) {   // → [{ code, label, fn, ids, path?, pathCode?, first, span }] เรียงตามคอลัมน์จริง
  const out = [];
  list.forEach((e, i) => {
    const c = code + '.' + (i + 1);
    if (isPath(e)) e.screens.forEach(([label, fn, ids], j) =>
      out.push({ code: c + '.' + (j + 1), label: label, fn: fn, ids: ids, path: e.path, pathCode: c, first: j === 0, span: e.screens.length }));
    else out.push({ code: c, label: e[0], fn: e[1], ids: e[2], first: true, span: 1 });
  });
  return out;
}

/* GROUPS = [{ code: 'A', title: '…', subs: [{ code: 'A', title: '…', tag: 'S1', screens: [[label, fn, 'D1 D2'?] | { path, screens }, …] }] }]
   screens[i][2] = id กล่องในผัง userflow ที่จอนี้แสดง (คั่นด้วยช่องว่าง · ไม่ใส่ = ผังยังไม่มีกล่องของจอนี้)
   fn() สร้างจอตามตัวแปร MOB · จอชื่อ "<prefix> / A.2 · S1 — <label>[ · mobile]" · คืน { made, y, flows }
   opts.devices = [false] desktop · [true] mobile · ไม่ส่ง = ทั้งคู่ · opts.rowMin = ความสูงแถวขั้นต่ำ · opts.flow = false ไม่วางผัง userflow */
async function buildGrid(page, prefix, GROUPS, y0, total, opts) {
  opts = opts || {};
  const made = []; let y = y0; const x0 = GRID.side + GRID.gap; const pitch = GRID.colW + GRID.colGap; let flows = 0;
  const put = (n, x, yy) => { page.insertChild(0, n); n.x = x; n.y = yy; return n; };
  for (const g of GROUPS) {
    const nCols = Math.max(...g.subs.map(s => countScreens(s.screens)));
    const top = y;
    CREATED = []; put(await flowBar(prefix, g.code, g.title, 'Default', nCols * GRID.colW + (nCols - 1) * GRID.colGap), x0, y);
    y += GRID.barH + GRID.gap;
    let flowBottom = top;
    for (const sub of g.subs) {
      const flat = flatScreens(sub.screens, sub.code), n = flat.length, w = n * GRID.colW + (n - 1) * GRID.colGap;
      if (sub.code !== g.code) {   // แถบย่อย (B1 B2) เฉพาะเมื่อกลุ่มมีหลาย scenario · เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก ⇒ ไม่มีแถบย่อย ป้าย state = A.1 A.2 …
        put(await flowBar(prefix, sub.code, sub.title, 'Sub Flow', w), x0, y);
        y += GRID.barH + GRID.gap;
      }
      const sn = scenNo(sub.tag);
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
        flat.forEach(({ code: c, label, ids }) => {
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
      /* แถวบน: จอเดี่ยว = ป้ายจอ · เส้นทางย่อย = ป้ายชื่อเส้นทางคร่อมคอลัมน์ของตัวเอง (Sub Flow)
         แถวล่าง: ป้ายจอของเส้นทางย่อย มีเฉพาะบล็อกที่มีเส้นทางย่อย (แพตเทิร์น S20 · 10 พ.ย. 2569) */
      const hasPath = flat.some(s => s.path);
      put(await deviceLabel(prefix, 'Header', GRID.barH), 0, y);
      for (const [i, sc] of flat.entries()) {
        if (!sc.path) put(await flowBar(prefix, sc.code, sc.label, 'Sub Flow 2', GRID.colW), x0 + i * pitch, y);
        else if (sc.first) put(await flowBar(prefix, sc.pathCode, sc.path, 'Sub Flow', sc.span * GRID.colW + (sc.span - 1) * GRID.colGap), x0 + i * pitch, y);
      }
      if (hasPath) {
        y += GRID.barH + GRID.gap;
        put(await deviceLabel(prefix, 'Header', GRID.barH), 0, y);
        for (const [i, sc] of flat.entries()) if (sc.path) put(await flowBar(prefix, sc.code, sc.label, 'Sub Flow 2', GRID.colW), x0 + i * pitch, y);
      }
      y += GRID.barH + GRID.gap;
      for (const mob of (opts.devices || [false, true])) {   // devices: [false]=desktop อย่างเดียว · [true]=mobile อย่างเดียว · ไม่ส่ง=ทั้งคู่ (แถว mobile ใต้ desktop)
        MOB = mob; let h = 0; const rowY = y;
        for (const [i, { code: cd, label, fn }] of flat.entries()) {
          const x = x0 + i * pitch;
          CREATED = []; PLACE = { x, y: rowY };   // เฟรมจอไปอยู่ตำแหน่งจริงทันทีที่สร้าง · ชิ้นที่สร้างระหว่างทางถูกติดตามไว้
          try {
            PINS = []; const s = await fn(); stripDividers(s); await polish(s); repin(); await bindTones(); if (typeof AFTER_SCREEN === 'function') await AFTER_SCREEN(s);   // AFTER_SCREEN = ตัวเรียกเฉพาะปลั๊กอิน (บำรุงรักษา: ลิงก์เลขทะเบียน 6 พ.ย. 2569)
            s.name = prefix + ' / ' + cd + ' · ' + sub.tag + ' — ' + label + (mob ? ' · mobile' : '');
            if (s.setPluginData) s.setPluginData('builtAt', String(Date.now()));   // ส่งภาพไป FigJam เลือกจอที่สร้างล่าสุดตามเวลานี้ (exportShots · 9 พ.ย. 2569)
            put(s, x, rowY); h = Math.max(h, s.height); made.push(s);
            if (!byCode[cd]) byCode[cd] = s;
            log('  · ' + made.length + '/' + total + ' ' + s.name);
          } catch (e) {
            warn(cd + ' ' + label + (mob ? ' (mobile)' : ''), e);
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
const IMAGES = {"empty-vehicle":"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"};

/* ======================== maintainance-plugin/screens.js ======================== */
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
  'cloud_upload-24-300-round', 'stylus-24-300-round', 'quick_reference_all-24-300-round', 'description-24-300-round', 'Dropdown menu',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header', 'Modal footer', 'Tabs', 'Notification card', 'Horizontal radio groups', 'Checkbox text card',
  'Side panel header', 'Side panel footer', 'Empty state/Search not found',
  'Progress steps', 'Mobile progress steps'];   // S10 ขั้นตอนบำรุงรักษา 2 ขั้น (รีวิว 5 พ.ย. 2569 · R70) ตาม 5.2 Vehicle Management ของ UI Release#2 · S24 แผงตัวกรอง + ไม่พบข้อมูล ตาม Vehicle list ของ UI Release#2 (4 พ.ย. 2569)
const NESTED = ['_Dropdown menu item', 'Nav button', 'Tab item', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Primary danger button',
  '_Content item base', '_File upload item base', 'List with checkbox item', 'List header item', 'Checkbox', 'Badge outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Radio button', '_Notification item base', 'Status'];
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
  "Images": ["39fe2574c3dcfeebe3eded7a76fecbc04ee41ef7", true],
  "Radio text card": ["e4510738f989bb24dbfb70fe6acfbf5705dcd60b", true],
  "Radio button": ["b29b98831c56216e005bb1c403e3f833d5e0f1cf", true],
  "Modal footer": ["78e84b8dfd520b686df45c5219feaf5f64a4bcec", true],
  "description-24-300-round": ["e42bf9bc8971c1449df0a602f3beca96cd3e5b77", false],   // ไอคอนเมนู "ผลการทดสอบน้ำมันไฮโดรลิก" (3 พ.ย. 2569)
  "Horizontal radio groups": ["50c917f3a90caf41227efab4841d0ce003c468dc", false],   // key ของไฟล์ Component (ดัมป์ 19 ต.ค.) · 11d953b1… ที่ UI Release#2 ใช้เป็นไลบรารีอื่น นำเข้าไม่ได้
  "Notification card": ["8b00e80ca7ead162e5de06e8cc261b86d5904c32", false],
  "_Notification item base": ["5e4101e154462cac0b912c28d0499b61f84c3001", false],
  "Status": ["65871480cb419a27224a15825374bc1486ab34d6", true],
  "Checkbox with description": ["dfc323f6bb605f586c4928ecb08c77acfb241f53", false],
  "Rating": ["1d3c2e045977bc6b2b407cdd2c82eb43dc00325a", true],
  "Checkbox text card": ["a29fe414b23f6ac84089cc837b8f2ff06ac561a3", true],
  "Step circles / 4 steps": ["5d90e00c1796d10ae8a19989403f503e0d54bf87", true],   // S10 มือถือ วงขั้นตอน 1/2 2/2 แบบ Check Expense Modal หน้า 5.14 - 5.15 Cost & Expense Check ของ UI Release#2 (5 พ.ย. 2569 · R70)
  "account_balance-24-300-round": ["48c0cb9ff8ec9c4c6c9a2be469bcd54a12742890", false],   // ไอคอนนำช่องศูนย์ต้นทุน แบบสำรองของ Request Repair/Budget (ตัวเดียวกับ Overhaul R18 · 5 พ.ย. 2569 · R72)
  "Metric item": ["5e82119aab7dc5401c7f5940b7a500339ace506a", true],   // S4 แดชบอร์ดอะไหล่ (6 พ.ย. 2569) — key เดียวกับแดชบอร์ด Overhaul (R22)
  "download-24-300-round": ["336f0dff014c26316e0fa56959bc75f09f71531d", false],   // S4 ปุ่มส่งออก — key เดียวกับ S18 ของ Overhaul (R32)
  "swap_driving_apps_wheel-24-300-round": ["d431c64461da6f292b3989371704fd336e1f719b", false],   // S25 เมนู/ปุ่ม "ย้ายไปไตรมาสอื่น" (ไฟล์ Component หน้าไอคอน · UI Release#2 ปุ่ม "โอนย้ายสังกัด" ใช้ swap_driving_apps)
  "calendar_month-24-300-round": ["afb81bef65f96089512284d42edd7bb46646a465", false]   // ไอคอนนำช่องวันดำเนินการ (6 พ.ย. 2569 · R83) — ไฟล์ Component หน้า Icons · ช่องช่วงวันที่ Date range picker / Trip date ของ UI Release#2 หน้า 5.2 Vehicle Management มีไอคอนนำ
});
NEEDED.push('Metric item', 'download-24-300-round', 'swap_driving_apps_wheel-24-300-round', 'Step circles / 4 steps', 'account_balance-24-300-round', 'calendar_month-24-300-round');   // S25 (5 พ.ย. 2569) ไอคอนย้ายไปไตรมาสอื่น · 6 พ.ย. 2569 ไอคอนช่องวันดำเนินการ

/* ---------- ข้อมูลตัวอย่าง (ยกชื่อรถ/หน่วยงาน/จังหวัดจาก maintainance-yearly/mock-yearly.js — ค่าสมมติทั้งหมด) ---------- */
const PST = { review: ['รออนุมัติ', 'Warning'],   // 30 ต.ค. 2569: ส่งอนุมัติทั่วไป ไม่ผ่าน ผพจ.
  returned: ['ส่งกลับแก้ไข', 'Error'], approved: ['อนุมัติแล้ว', 'Brand'], active: ['ดำเนินการ', 'Info'],
  hist: ['รอหัวหน้าตรวจสอบ', 'Warning'], passed: ['ประวัติผ่านแล้ว', 'Success'], closed: ['ปิดงานแล้ว', 'Gray'] };
/* 22 ต.ค. 2569 เจ้าของงาน: ไม่ทำเรื่องยื่นของบ/ทบทวนแผน · เริ่มที่สร้างแผน · เลือกรถตามภาค + ประเภทรถ
   30 ต.ค. 2569 เจ้าของงาน: แผนปี — เลือกปีงบประมาณได้ทุกปี แล้วจัดรถลงไตรมาส · ส่งอนุมัติทั่วไป (ไม่ผ่าน ผพจ.) · ไม่มีเลขงานในระบบ (S3 พักไว้)
   ⇒ ช่องที่ 0 = เลขที่ MR (Maintenance Request) รูปแบบจริงที่เจ้าของงานให้ 30 ต.ค. 2569 "MRZ69000XX" = MR + เขตการไฟฟ้า (Z = สำนักงานใหญ่ ที่ตั้ง กบค.) + ปีที่เลือกตอนสร้างแผน 2 หลัก + ลำดับ 5 หลักนับต่อกันในปีนั้น (ไม่ใช่เลขงาน) · ช่องที่ 3 = ไตรมาสที่กำลังทำ (ขั้น S4 เป็นต้นไปทำรายไตรมาส) · ช่องที่ 8 = ปีงบประมาณ · ช่องที่ 9 = รถรายไตรมาส */
const PLANS = [   // เลขที่ MR · ชื่อแผน · ภาค · ไตรมาสที่กำลังทำ · จำนวนรถ · สถานะ · วันที่สร้าง · ประเภทรถ · ปีงบประมาณ · รถรายไตรมาส
  ['MRZ7000001', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 และภาค 2 ปีงบประมาณ 2570', 'ภาค 1, ภาค 2', 'ไตรมาส 1', '12', 'active', '03/10/2569', 'กระเช้าแก้ไฟ', '2570', 'ไตรมาส 1: 6 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 1'],
  ['MRZ7000002', 'บำรุงรักษารถพ่วงฉีดน้ำ ภาค 2 ปีงบประมาณ 2570', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 2', '8', 'approved', '05/10/2569', 'รถพ่วงฉีดน้ำ', '2570', 'ไตรมาส 1: 0 · ไตรมาส 2: 4 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ7000003', 'บำรุงรักษากระเช้าฮอทไลน์ ภาค 3 ปีงบประมาณ 2570', 'ภาค 3 (กลาง)', 'ไตรมาส 1', '6', 'review', '17/10/2569', 'กระเช้าฮอทไลน์', '2570', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MRZ7100001', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 4 ปีงบประมาณ 2571', 'ภาค 4 (ใต้)', 'ไตรมาส 1', '9', 'returned', '12/10/2569', 'กระเช้าแก้ไฟ', '2571', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ6900011', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 ปีงบประมาณ 2569', 'ภาค 1 (เหนือ)', 'ไตรมาส 4', '10', 'closed', '02/06/2568', 'กระเช้าแก้ไฟ', '2569', 'ไตรมาส 1: 3 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 2']];
const NEW_PLAN = ['MRZ7000004', 'บำรุงรักษายานพาหนะ กกฟ.1 ปีงบประมาณ 2570', 'ภาค 1, ภาค 2', 'ไตรมาส 1', '10', 'review', '30/10/2569', 'กระเช้าแก้ไฟ, กระเช้าฮอทไลน์, รถพ่วงฉีดน้ำ', '2570', 'ไตรมาส 1: 3 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 2'];   // 6 พ.ย. 2569 รถทุกคันของหน่วยงานต้องอยู่ในไตรมาส ⇒ 10 คัน (CAND ทั้งหมด)
/* 6 พ.ย. 2569 เจ้าของงาน "มีกรย ที่สร้างแผนบำรุงรักษาได้ หน่วยงานที่ใช้ flow นี้ มี กกฟ1 2 และ กรย" + "กกฟ กรย สร้างแผนได้ ทำเอง ไม่เกี่ยวกับ กบค เหมือนสร้างแผนแล้วก็ดำเนินการเอง กบค แค่เห็นแผนทั้งหมด"
   ⇒ ผู้สร้างแผนและผู้ดำเนินการ = หน่วยงาน (กกฟ.1 · กกฟ.2 · กรย.) · ข้อมูลตัวอย่างเป็นแผนของ กกฟ.1
   6 พ.ย. 2569 (รอบ 2) เจ้าของงาน "กฝช ส่งให้ กบค เป็นผู้ดำเนินการ" + "กบค จะทำแผนจะมีรถของ กฝช. ด้วย"
   ⇒ กบค. สร้างแผนได้อีกหน่วยงาน (รถในแผนมีรถของ กฝซ. ด้วย) · แผนของหน่วยงานอื่น กบค. ยังดูอย่างเดียว */
const UNITS = ['กกฟ.1', 'กกฟ.2', 'กรย.', 'กบค.'], CREATOR = 'นายวิชัย ทองดี (กกฟ.1)';
/* 9 พ.ย. 2569 เจ้าของงาน "ปรับให้มีการสร้าง ของ กรย และ กกฟ ทำ persona ของทั้ง 3 กองนนี้ โดยหน้ารวม เห็นไม่เหมือนกันคือ กกฟ1,2 และ กรย สร้างได้ และเห็นแค่ของตัวเองแต่ กบคจะเห็นของคนอื่นด้วย"
   ⇒ หน้ารายการแผนของ กกฟ.1 กกฟ.2 กรย. เห็นเฉพาะแผนของหน่วยงานตัวเอง (ownPlans) มีปุ่มสร้างแผน · กบค. เห็นแผนทุกหน่วยงาน (allPlans · บรรทัดรองเป็นหน่วยงาน)
   UNIT_PLANS = แผนจำลองเพิ่มให้ทุกหน่วยงานมีแผนของตัวเองอย่างน้อย 2 แผน · เลขที่ MR นับต่อกันทั้งระบบภายในปีงบประมาณ (Z71 ต่อจาก MRZ7100001 · Z69 ต่อจาก MRZ6900011) */
const UNIT_PLANS = [
  ['MRZ6900012', 'บำรุงรักษายานพาหนะ กกฟ.1 ปีงบประมาณ 2569', 'ภาค 1, ภาค 2', 'ไตรมาส 4', '9', 'closed', '05/06/2568', 'กระเช้าแก้ไฟ', '2569', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ7100002', 'บำรุงรักษายานพาหนะ กกฟ.2 ปีงบประมาณ 2571', 'ภาค 3, ภาค 4', 'ไตรมาส 1', '7', 'review', '15/10/2569', 'กระเช้าฮอทไลน์, รถพ่วงฉีดน้ำ', '2571', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 1']];
const allPlans = () => PLANS.concat(UNIT_PLANS);
const ownPlans = (u) => allPlans().filter(p => PLAN_UNIT[p[0]] === u);   // หน้ารายการแผนของหน่วยงาน u เห็นเฉพาะแผนของตัวเอง
const REGIONS = ['ภาค 1 (เหนือ)', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ภาค 3 (กลาง)', 'ภาค 4 (ใต้)'];
/* เขตภายใต้ภาค (R35 · เจ้าของงาน 2 พ.ย. 2569 "ภาคเหนือ มี 3 เขต เขาก็จะเลือก ภาค แล้วจึงเลือก เขต ภายใต้ภาค แล้วถึงเห็นรถ")
   ค่าย่อและ placeholder "เลือกเขต" ตาม Input dropdown ของหน้า 5.9 EV Charging Station ใน UI Release#2 */
const DISTRICTS = { [REGIONS[0]]: ['กฟน.1', 'กฟน.2', 'กฟน.3'], [REGIONS[1]]: ['กฟฉ.1', 'กฟฉ.2', 'กฟฉ.3'], [REGIONS[2]]: ['กฟก.1', 'กฟก.2', 'กฟก.3'], [REGIONS[3]]: ['กฟต.1', 'กฟต.2', 'กฟต.3'] };
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
const REG_OF = { 'กฟน': 0, 'กฟฉ': 1, 'กฟก': 2, 'กฟต': 3 };
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
  ['น้ำมันไฮโดรลิก ISO VG 46', 'OL-0011', 'น้ำมัน', '60', 'ลิตร', '420', 'ok'],
  ['ไส้กรองไฮโดรลิก', 'FL-0022', 'ไส้กรอง', '12', 'ชิ้น', '3', 'short'],
  ['ไส้กรองน้ำมันเครื่อง', 'FL-0031', 'ไส้กรอง', '12', 'ชิ้น', '40', 'ok'],
  ['ไส้กรองอากาศ', 'FL-0040', 'ไส้กรอง', '12', 'ชิ้น', '60', 'ok'],
  ['ไส้กรองเชื้อเพลิง', 'FL-0052', 'ไส้กรอง', '4', 'ชิ้น', '1', 'short']];
/* อะไหล่แบบงานซ่อม (22 ต.ค. 2569 "ปรับอะไหล่ให้สอดคล้องกับงานซ่อม"): คลัง 2 แบบ Smart Inventory / คลังสำรอง · ราคาต่อหน่วย (ค่าสมมติ) ·
   จำนวนตามแผนเกินคงเหลือ = ซื้อเพิ่มส่วนต่าง + เลือกผู้จัดซื้อ · ผู้จัดซื้อในบำรุงรักษา = Smart Inventory หรือ ผพจ. (S3) แทน "กบค." ของงานซ่อม — รอเคาะ */
const WH = ['Smart Inventory', 'Smart Inventory', 'Smart Inventory', 'คลังสำรอง', 'คลังสำรอง'];
const PRICE = [120, 680, 250, 420, 350];
const BUYER = ['Smart Inventory', 'ผพจ.'];
const BUYER_OF = { 1: 0, 4: 1 };   // อะไหล่ที่ขาด → ผู้จัดซื้อที่เลือกไว้ (ไส้กรองไฮโดรลิก = Smart Inventory · ไส้กรองเชื้อเพลิง = ผพจ.)
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
  ['เปลี่ยนน้ำมันไฮโดรลิก', 'น้ำมันไฮโดรลิก ISO VG 46', '30', '30', 'ลิตร'],
  ['เปลี่ยนไส้กรองไฮโดรลิก', 'ไส้กรองไฮโดรลิก', '2', '2', 'ชิ้น'],
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
const ACC = { wait: ['รอหน่วยงานยอมรับ', 'Warning'], ok: ['หน่วยงานยอมรับแล้ว', 'Success'] };
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
const WORD_ALLOW = ['สามารถ', 'รถพ่วงฉีดน้ำ'];
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
const PLAN_MENU_OF = (st) => st === 'review' || st === 'returned' ? MENU : st === 'approved' ? MENU.slice(0, 2) : MENU.slice(0, 1);   // รายการเมนู … ตามสถานะแผน (S19 S20) · มือถือเปิดเป็นไอคอนตามนี้
/* ภาค / ประเภทรถ ในรายการ (เจ้าของงาน 5 พ.ย. 2569 "สรุปจากรถที่อยู่ในแผนจริง") — ตัวกรองอยู่รายไตรมาสแล้ว แผนไม่มีภาคของตัวเอง ⇒ 2 บรรทัดในช่องเดียว (Table 8 คอลัมน์ R8 · บรรทัดรอง = ประเภทรถ)
   PLAN_SCOPE = แผนที่มีรถหลายภาค/ประเภท (ค่าสมมติ) · ที่เหลือใช้ภาคและประเภทเดียวของแผน */
const PLAN_SCOPE = { 'MRZ7000001': ['ภาค 1, ภาค 2', 'กระเช้าแก้ไฟ'], 'MRZ7000002': ['ภาค 2, ภาค 3', 'กระเช้าแก้ไฟ, รถพ่วงฉีดน้ำ'] };   // 5 พ.ย. 2569 ชีตลูกค้า: MRZ7000001 เคยเป็น "ภาค 1" แต่รถในแผน (TRIP_CARS) อยู่ทั้ง กฟน. และ กฟฉ. ⇒ ภาค 1 และภาค 2 ให้ตรงรถ
const scopeCell = (p) => { const x = PLAN_SCOPE[p[0]]; return x ? { text: x[0], sub: x[1] } : { text: shortRegion(p[2]), sub: p[7] }; };
const PLAN_UNIT = { 'MRZ7000004': 'กกฟ.1', 'MRZ7000001': 'กกฟ.1', 'MRZ7000002': 'กกฟ.2', 'MRZ7000003': 'กรย.', 'MRZ7100001': 'กบค.', 'MRZ6900012': 'กกฟ.1', 'MRZ7100002': 'กกฟ.2', 'MRZ6900011': 'กรย.' };   // หน่วยงานเจ้าของแผน (ค่าสมมติ · 6 พ.ย. 2569 · MRZ7100001 = แผนของ กบค. ที่มีรถ กฝซ.)
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
     filterPanel แบบแผงตัวกรองของฟอร์ม S1 (R77) · Input dropdown with badges Optional เลือกหลายค่า · เขต = 12 เขต (DISTRICTS) · หน่วยงานหน้างาน = UNITS · o.filter.open = 'unit' | 'district' */
  if (o.filter) {
    const fd = o.filter, at = (n) => n.findOne(x => x.name === 'Container') || n;
    const dist = multiDropdown('เขต', fd.districts || [], { placeholder: 'เลือกเขต', optional: true, state: fd.open === 'district' ? 'Focused' : undefined });
    const unit = multiDropdown('หน่วยงานหน้างาน', fd.units || [], { placeholder: 'เลือกหน่วยงานหน้างาน', optional: true, state: fd.open === 'unit' ? 'Focused' : undefined });
    await filterPanel(scr, [dist, unit]);
    if (fd.open === 'unit') comboAt(scr, at(unit), UNITS.map(u => [u, '', (fd.units || []).indexOf(u) >= 0]));
    if (fd.open === 'district') comboAt(scr, at(dist), [].concat(...Object.values(DISTRICTS)).map(d => [d, '', (fd.districts || []).indexOf(d) >= 0]));
  }
  return scr;
}
const CARS = VEH.map(v => [v[0], v[1], v[2]]);
/* ฟอร์มสร้างแผน: ดูคำอธิบายที่ planForm() (ปรับ 5 พ.ย. 2569 แยกไตรมาสตั้งแต่แรก + ตารางรถทุกคัน ค้นหา กรอง · ค่ำ R77 ภาค เขต ประเภทรถ ย้ายเข้าแผงตัวกรอง) · ช่องค้นหา + ชิปรถแบบ R24 (2 พ.ย.) เลิกใช้ในฟอร์มนี้แล้ว */
const YEARS = ['2568', '2569', '2570', '2571', '2572'];   // เจ้าของงาน "ไม่จำกัดปี" — จำนวนปีที่แสดงยังไม่รู้ (Q31)
const CARP_COLS = [['ทะเบียน', 230, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของยานพาหนะ', 180], ['น้ำมันไฮโดรลิก', 140], ['เปลี่ยนล่าสุด', 120], ['อะไหล่', 120], ['', 104]];   // ไอคอนแก้ไข + ลบรถออกจากไตรมาส กว้าง 104 แบบบล็อก J ของ Overhaul · ตารางรถในไตรมาส (เจ้าของงาน 2 พ.ย. 2569 "section ของรถที่เลือกมาไตรมาสนั้น")
const CAR_PICK = [1, 2, 3];                 // ไส้กรองที่ กบค. เลือกให้รถ 1 คันในข้อมูลตัวอย่าง (ลำดับใน PARTS) · น้ำมันไฮโดรลิก (0) เข้ารายการเมื่อเลือกเปลี่ยนน้ำมัน
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
  await text(es, 'Text', 'ยังไม่มียานพาหนะในไตรมาสนี้'); await text(es, 'Supporting text', 'เลือกยานพาหนะในพื้นที่ที่ยังไม่ได้จัดลงไตรมาสใด หรือติ๊กยานพาหนะในแท็บทั้งหมดแล้วกดจัดลงไตรมาส');
  const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false;
  const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'เพิ่มยานพาหนะเข้าไตรมาส ' + q, 'Leading icon': true, 'Leading icon swap': icon('add-24-300-round') });
  return emptyGraphic(es, 'empty-vehicle');
}
async function noParts(sub) { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มีรายการอะไหล่'); await text(es, 'Supporting text', sub); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
const OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน'];   // เจ้าของงาน 2 พ.ย. 2569: น้ำมันไฮโดรลิกไม่ได้เปลี่ยนทุกปี ให้ผู้ใช้เลือกเอง ระบบไม่ตัดสินจากเงื่อนไขอายุ
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
const PICK_COLS = [['ทะเบียน', 260], ['ประเภทยานพาหนะ', 160], ['เขต / หน่วยงานเจ้าของยานพาหนะ', 0], ['ไตรมาส', 160, 'Badge']];
/* แท็บไตรมาส n (5 พ.ย. 2569 เจ้าของงาน "หน้านี้จะเห็นรถในไตรมาส แต่จะยังไม่เห็นอะใหล่ อยากให้จัดการสิ่งที่ต้องทำของรถแต่ละคัน …"
   + แก้ "ข้อ 2 ไม่ได้ให้เอาออกจากการสร้างแผน แต่ให้เอารายการอะใหล่ออก เป็น empty ก่อน แล้วค่อยให้เลือกจัดการอะใหล่ ทีละคัน แล้วค่อยเอามาลงในรายการอะใหล่ตอนจะส่งอนุมัติ …")
   ตารางรถของไตรมาสบอกสิ่งที่ต้องทำรายคัน: น้ำมันไฮโดรลิก (คำของ JOB_OIL_OPTS · บรรทัดรอง เบอร์น้ำมัน · จำนวนลิตร) · อะไหล่อื่นๆ ("n รายการ" · บรรทัดรอง ชื่อรายการแรก) · ไอคอนแก้ไข (Table cell Action icons) ไปหน้าจัดการอะไหล่ของรถ (S21)
   หัวข้อ "อะไหล่ในไตรมาส n" คงไว้ ตั้งต้นว่าง แล้วรวมจากรถที่จัดการแล้ว (qAgg) · ไม่มีปุ่มเพิ่มอะไหล่และไอคอนแถว (อะไหล่มาจากรถทีละคัน)
   6 คอลัมน์ ไม่ต้องรวมช่อง (คอลัมน์ไตรมาสของแท็บทั้งหมดไม่แสดง เพราะทุกคันอยู่ไตรมาสเดียวกัน) · มือถือ List with checkbox = สรุปอยู่บรรทัดรอง */
const Q_COLS = [['ทะเบียน', 240], ['ประเภทยานพาหนะ', 130], ['เขต / หน่วยงานเจ้าของยานพาหนะ', 0], ['น้ำมันไฮโดรลิก', 200], ['อะไหล่อื่นๆ', 200], ['', 60]];   // 6 พ.ย. 2569 ท้ายแถว = ปุ่ม … (Q_MENU) แทนไอคอนแก้ไข
/* เมนู … ของยานพาหนะในแท็บไตรมาส (6 พ.ย. 2569 เจ้าของงาน "เพิ่ม ... ดูรายละเอียด แก้ไข ลบ ของรถแต่ละคัน" + เลือกอยู่ที่ฟอร์มสร้าง/แก้ไขแผน S1 S19)
   ดูรายละเอียด = อะไหล่ของยานพาหนะคันนั้น ดูอย่างเดียว (carPartsView) · แก้ไข = หน้าจัดการอะไหล่ S21 · ลบ = เอาออกจากไตรมาส กลับเป็นยังไม่จัด (Q_OUT_CONFIRM)
   ชุดเดียวกับ MENU ของรายการแผนและหน้ารายละเอียดแผนเดินทาง (S10 JOB_MENU) · เปิดด้วย planMenu */
const Q_MENU = MENU;
const TODO_NONE = 'ยังไม่กำหนด';
const OIL_SPEC = { grade: 'ISO VG 46', code: 'OL-0011', litre: '30' };   // ค่าสมมติตามน้ำมันไฮโดรลิก ISO VG 46 รหัส OL-0011 ใน PARTS
const oilCell = (k) => k == null ? TODO_NONE : { text: JOB_OIL_OPTS[k], sub: k ? OIL_SPEC.grade + ' · ' + OIL_SPEC.litre + ' ลิตร' : OIL_SPEC.grade };
const partList = (i, picks, manualCars) => (picks[i] || []).filter(x => x !== 0).map(x => PARTS[x][0]).concat(manualCars.indexOf(i) >= 0 ? [MANUAL.name] : []);
const partCell = (l) => l.length ? { text: l.length + ' รายการ', sub: l[0] + (l.length > 1 ? ' และอื่น ๆ' : '') } : TODO_NONE;
/* ตารางอะไหล่รวมตามรายการ (R81 · 6 พ.ย. 2569 เจ้าของงาน "ถ้าเพิ่ม คอลัมน์ ก็ส่งผลกระทบกับ หน้าอื่นๆที่เป็นหน้าที่เหมือนกันด้วย ตอน export ก็เกี่ยวข้องด้วย")
   ชุดเดียวใช้ทุกที่: อะไหล่ในไตรมาส (S1 S19) · อะไหล่ในแผน (S2) · อะไหล่ในไตรมาส n (หน้าไตรมาส) · แดชบอร์ดแท็บรวมตามรายการ (S4) · ไฟล์ PDF และ Excel ที่ส่งออก
   คอลัมน์ ชนิด · ประเภท · จำนวน ตามที่เจ้าของงานสั่ง (S2) + รหัสอะไหล่ (รีวิว S4 "ค้นหาจาก ชื่ออะไหล่ รหัสอะไหล่") · แถว = qAgg [ชื่อ, รหัส, ประเภท, จำนวน, หน่วย] · เพิ่ม/ลดคอลัมน์ที่นี่ที่เดียว */
const QPART_COLS = [['ชนิด', 0, 'Lead text'], ['รหัสอะไหล่', 150], ['ประเภท', 160], ['จำนวน', 120], ['หน่วย', 110]];
/* อะไหล่ในไตรมาส = รวมจากรถที่จัดการแล้ว: น้ำมันไฮโดรลิก (คันที่เปลี่ยน · 30 ลิตรต่อคัน) + อะไหล่อื่นๆ ที่เลือกจากคลัง + รายการที่ระบุเอง */
const qAgg = (cars, picks, oils, manualCars) => {
  const rows = PARTS.map((p, x) => { const n = x === 0 ? cars.filter(i => oils[i] === 1 || oils[i] === 2).length * +OIL_SPEC.litre : CAR_QTY[x] * cars.filter(i => (picks[i] || []).indexOf(x) >= 0).length; return [p[0], p[1], p[2], String(n), p[4]]; }).filter(r => +r[3] > 0);
  const m = cars.filter(i => manualCars.indexOf(i) >= 0).length;
  return m ? rows.concat([[MANUAL.name, MANUAL.code || '-', 'เพิ่มเอง', String(MANUAL.qty * m), 'ชิ้น']]) : rows;
};
const inArea = (c, f) => (!f.regions.length || f.regions.indexOf(regionOf(c)) >= 0) && (!f.districts.length || f.districts.indexOf(dCode(c)) >= 0) && (!f.types.length || f.types.indexOf(typeOf(c)) >= 0);
const inQuery = (c, f) => !f.query || (c[0] + ' ' + c[1]).indexOf(f.query) >= 0;
const ASSIGN_OPTS = QUARTERS;   // 5 พ.ย. 2569 เจ้าของงาน "เอาตัวเลือกนี้ออก" (เอาออกจากไตรมาส (ยังไม่จัด)) ⇒ popup เลือกได้เฉพาะไตรมาส 1–4 · วิธีเอารถออกจากแผนหลังจัดแล้วยังไม่เคาะ
/* popup จัดลงไตรมาส — popupModal (Modal header + Radio text card เรียงลง 4 ใบ + Modal footer · ตามโครง popup ของ S6) · มือถือ = bottom sheet · ปุ่ม ยืนยัน Disabled จนกว่าจะเลือก */
async function assignModal(scr, n, sel) {
  const r = col('Radio', [], 12);
  ASSIGN_OPTS.forEach((t, i) => { const c = inst('Radio text card', { State: 'Default', Selected: i === sel ? 'True' : 'False' }, { Text: t, Supporting: false }); add(r, c, 'h'); });
  await popupModal(scr, { title: 'จัดลงไตรมาส', sub: 'ยานพาหนะที่เลือก ' + n + ' คัน · ยานพาหนะที่จัดไว้แล้วจะย้ายไปไตรมาสที่เลือก', body: [r], ok: 'ยืนยัน', okOff: sel < 0 });
}
const ALL_Q_PARTS_EMPTY = 'จัดการอะไหล่ทีละคันจากปุ่ม … ที่แถวยานพาหนะในแท็บไตรมาส รายการจะรวมมาที่นี่';   // แท็บทั้งหมด ยังไม่มีอะไหล่สักคัน (9 พ.ย. 2569 · ข้อความเสนอ)
async function planForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const heading = o.edit ? 'แก้ไขแผน ' + NEW_PLAN[0] : 'สร้างแผนบำรุงรักษา';
  const { scr, page } = await shell(name, { title: heading, back: true, crumbs: [o.edit ? heading : 'สร้างแผน'] });
  const f = { regions: o.regions || [], districts: o.districts || [], types: o.types || [], query: o.query || '' };
  const alloc = o.alloc || {}, q = o.q || 0, nIn = Object.keys(alloc).length, ticked = o.ticked || [];
  const yr = o.edit ? field('ปีงบประมาณ', v.year, { state: 'Readonly' })
    : dropdown('ปีงบประมาณ', v.year || '', { placeholder: 'เลือกปีงบประมาณ', error: E('กรุณาเลือกปีงบประมาณ'), state: o.yearOpen ? 'Focused' : undefined });
  /* R77 (5 พ.ย. 2569 ค่ำ): ภาค เขต ประเภทรถ ย้ายเข้าแผงตัวกรอง — section ไม่มีแถวช่องบนสุดแล้ว · Tabs + Table header แสดงเสมอ (ตาม PlanForm.tsx ของต้นแบบเว็บ) */
  /* 6 พ.ย. 2569 เจ้าของงาน "ต้องเอารถเข้า ไตรมาสทุกคัน" ⇒ ป้ายบอกจัดแล้วกี่คันจากรถทั้งหมดของหน่วยงาน แทน "ในแผน n คัน" · 9 พ.ย. 2569 เลิกบังคับครบทุกคัน ป้าย "จัดลงไตรมาสแล้ว n คัน" ไม่มีตัวหาร (ดู complete) */
  const draw = o.draw || {};
  const carSec = col('Section', [await section('เลือกยานพาหนะเข้าแผนและจัดลงไตรมาส', { badge: 'จัดลงไตรมาสแล้ว ' + nIn + ' คัน' })], 16);
  const picked = f.regions.length || f.districts.length || f.types.length;   // เลือกช่องใดช่องหนึ่งก็แสดงรถที่ตรง (R69)
  const area = CAND.map((c, i) => [c, i]).filter(([c]) => picked && inArea(c, f));
  const inQ = (k) => CAND.map((c, i) => [c, i]).filter(([, i]) => alloc[i] === k);
  add(carSec, await tabs([['ทั้งหมด', area.length]].concat(QUARTERS.map((t, k) => ['ไตรมาส ' + (k + 1), inQ(k + 1).length])), q), 'h');
  const shown = (q ? inQ(q) : area).filter(([c]) => inQuery(c, f));
  const chips = f.regions.map(shortRegion).concat(f.districts, f.types);   // ชิปตัวกรองที่ใช้แล้ว · Pill บนปุ่มตัวกรอง = จำนวนชิป
  /* 6 พ.ย. 2569 เจ้าของงาน "บังคับให้กรอกอะใหล่ทุกคัน" ⇒ แท็บไตรมาสบอกกำหนดอะไหล่แล้วกี่คัน (กำหนด = เลือกไม่เบิก หรือเบิกแล้วมีรายการ) */
  const decided = (i) => draw[i] === 'none' || ((o.picks || {})[i] || []).length > 0 || (o.manualCars || []).indexOf(i) >= 0;
  const qDone = q ? inQ(q).filter(([, i]) => decided(i)).length : 0;
  add(carSec, await tableHeader({ title: q ? 'ยานพาหนะในไตรมาส ' + q : 'ยานพาหนะในพื้นที่ที่เลือก', badge: q ? 'กำหนดอะไหล่แล้ว ' + qDone + '/' + inQ(q).length + ' คัน' : shown.length + ' คัน', placeholder: 'เลขทะเบียน, ยี่ห้อ, รุ่น', query: f.query, chips, filterCount: chips.length || null,
    more: [{ text: 'จัดลงไตรมาส' + (ticked.length ? ' (' + ticked.length + ')' : ''), disabled: !ticked.length }] }), 'h');
  if (!q && !picked) {   // ยังไม่เลือกช่องใดในแผงตัวกรอง (แท็บทั้งหมด) — ภาพรถกับแว่นขยาย (R61) · ไม่มีปุ่ม (ปุ่มตัวกรองอยู่ที่ Table header)
    const es = inst('Empty state/Data empty'); add(carSec, es, 'h');
    await text(es, 'Text', 'ยังไม่มีรายการยานพาหนะ'); await text(es, 'Supporting text', 'กดตัวกรองเพื่อเลือกภาค เขต หรือประเภทยานพาหนะ ตารางจะแสดงยานพาหนะทั้งหมดที่ตรงกัน');
    const a = find(es, 'Actions'); if (a) a.visible = false; await emptyGraphic(es, 'empty-vehicle');
  } else if (shown.length) {
    const qPill = (i) => alloc[i] ? ['ไตรมาส ' + alloc[i], 'Brand'] : ['ยังไม่จัด', 'Gray'];
    const oils = o.oils || {}, picks = o.picks || {}, manualCars = o.manualCars || [];
    const rows = q
      ? shown.map(([c, i]) => { const pl = partList(i, picks, manualCars), oc = oilCell(oils[i]); const pc = draw[i] === 'none' ? 'ไม่เบิกอะไหล่' : partCell(pl); return [{ check: ticked.indexOf(i) >= 0, text: c[0], sub: MOB ? 'น้ำมัน ' + (oc.text || oc) + ' · อะไหล่อื่นๆ ' + (pc.text || pc) : c[1] }, typeOf(c), c[2], oc, pc, { menu: 1, items: Q_MENU }]; })
      : shown.map(([c, i]) => [{ check: ticked.indexOf(i) >= 0, text: c[0], sub: MOB ? c[1] + ' · ' + qPill(i)[0] : c[1] }, typeOf(c), c[2], { pill: qPill(i) }]);
    const t = await tblShort(q ? Q_COLS : PICK_COLS, rows, { pagination: rows.length }); headCheck(t, rows); add(carSec, t, 'h');
  } else if (q && !f.query) add(carSec, await noCarsInQ(q), 'h');
  else add(carSec, await searchNotFound(), 'h');   // ไม่มีรถตรงคำค้น/ตัวกรอง = Vehicle list - Search not found ของ UI Release#2
  /* อะไหล่ในไตรมาส n — 5 พ.ย. 2569 เจ้าของงาน "ให้เอารายการอะใหล่ออก เป็น empty ก่อน แล้วค่อยให้เลือกจัดการอะใหล่ ทีละคัน แล้วค่อยเอามาลงในรายการอะใหล่ตอนจะส่งอนุมัติ"
     ⇒ ตั้งต้น Empty state (noParts) · รวมจากรถที่จัดการแล้ว · ไม่มีปุ่มเพิ่มอะไหล่และไอคอนแก้ไข ลบ ของแถว
     9 พ.ย. 2569 เจ้าของงาน (ภาพแท็บทั้งหมดที่ขึ้น "เปิดแท็บไตรมาสเพื่อดูอะไหล่…") _"หน้าอะใหล่ทั้งไตรมาส ต้องรวมมาให้ด้วย ทั้งไตรมาส"_
     ⇒ แท็บทั้งหมด = หัวข้อ "อะไหล่รวมทุกไตรมาส" (เจ้าของงานเคาะ 9 พ.ย. 2569 "ใช้ชื่ออะไหล่รวมทุกไตรมาส") รวมอะไหล่ของยานพาหนะทุกคันที่จัดลงไตรมาสแล้ว ไม่ขึ้นกับตัวกรองภาค เขต ประเภท · ยอด = ผลรวมของแท็บไตรมาส 1–4 (qAgg บวกรายคัน) · คันไม่เบิกไม่นับ */
  const inQs = Object.keys(alloc).map(Number).filter(i => !q || alloc[i] === q);   // แท็บทั้งหมด = ทุกคันที่จัดลงไตรมาสแล้ว
  const qRows = qAgg(inQs.filter(i => draw[i] !== 'none'), o.picks || {}, o.oils || {}, o.manualCars || []);   // คันที่ไม่เบิกอะไหล่ไม่รวมในรายการ
  const partsSec = col('Section', [await section(q ? 'อะไหล่ในไตรมาส ' + q : 'อะไหล่รวมทุกไตรมาส')], 16); // 9 พ.ย. 2569 เจ้าของงาน "เอาเลขออกไปเลยได้ป่ะ ถ้าหมายถึงจำนวนชนิด" ⇒ หัวข้ออะไหล่รวมตามรายการไม่มีตัวเลขจำนวนชนิด
  add(partsSec, qRows.length ? await tblShort(QPART_COLS, qRows) :
    await noParts(!q ? ALL_Q_PARTS_EMPTY : inQs.length ? 'จัดการอะไหล่ทีละคันจากปุ่ม … ที่แถวยานพาหนะ รายการจะรวมมาที่นี่' : 'จัดยานพาหนะลงไตรมาสนี้ก่อน แล้วจึงจัดการอะไหล่ทีละคันได้'), 'h');
  /* รีวิว 5 พ.ย. 2569 "ต้องกรอกข้อมูลที่ require ครบถึงจะ enable ปุ่ม" + 6 พ.ย. 2569 เจ้าของงาน "ต้องเอารถเข้า ไตรมาสทุกคัน" "บังคับให้กรอกอะใหล่ทุกคัน ไปหน้าต่อไปไม่ได้" (เลือกแบบ ก หน้าเดียว)
     ⇒ ปุ่มบันทึกและส่งอนุมัติกดได้เมื่อ ชื่อแผน · ปีงบประมาณ · รถทุกคันของหน่วยงานอยู่ในไตรมาส · ทุกคันกำหนดอะไหล่แล้ว (เบิกพร้อมรายการ หรือ ไม่เบิก) */
  const complete = !!(v.name && v.year && nIn > 0 && area.every(([, i]) => alloc[i]) && Object.keys(alloc).every(i => decided(+i)));   // 9 พ.ย. 2569 ค่ำ เจ้าของงาน (ภาพหน้าแก้ไขแผน แท็บทั้งหมดมียานพาหนะ "ยังไม่จัด" แต่ปุ่มกดได้) _"ยังจัดอะใหล่ไม่เสร็จ ปุ่มอนุมัติต้อง disable"_ + เคาะ "ยานพาหนะในตารางต้องจัดครบ" ⇒ ยานพาหนะทุกคันในตาราง (แท็บทั้งหมด = ตรงตัวกรองภาค เขต ประเภท) ต้องจัดลงไตรมาส + ทุกคันที่จัดกำหนดอะไหล่แล้ว · ไม่ใช่ทุกคันของหน่วยงาน (243 คัน)
  // เดิม 9 พ.ย. บ่าย: เจ้าของงาน (หน้าแก้ไขแผนที่ถูกส่งกลับ "จัดลงไตรมาสแล้ว 6/243 คัน" ส่งไม่ได้) เคาะ "คันที่เลือกไว้กำหนดอะไหล่ครบ" ⇒ ปุ่มบันทึกและส่งอนุมัติกดได้เมื่อมียานพาหนะในแผนอย่างน้อย 1 คัน และทุกคันที่จัดลงไตรมาสกำหนดอะไหล่แล้ว (หรือไม่เบิก) ทั้งตอนสร้างและแก้ไข · เลิกบังคับจัดครบทุกคันของหน่วยงาน (กติกา 6 พ.ย.) · ป้ายไม่มีตัวหาร
  add(page, col('Content', (o.alert ? [alertBox(...o.alert)] : []).concat([
    col('Section', [await section('ข้อมูลแผน'),
      row('Row', [field('ชื่อแผน', v.name, { placeholder: 'ระบุชื่อแผน', error: E('กรุณาระบุชื่อแผน') }), yr])], 16),
    carSec,
    partsSec,
    btnRow([['Secondary button', o.edit ? 'ยกเลิก' : 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกและส่งอนุมัติ', { size: 'lg', disabled: !complete }]])
  ]), 32), 'h');
  if (o.yearOpen) comboAt(scr, yr.findOne(n => n.name === 'Container') || yr, YEARS.map(y => [y, '', y === v.year]));
  /* แผงตัวกรอง (R77) — filterPanel ใน core แบบ S24 (Side panel header "ตัวกรอง" + Side panel footer ล้างตัวกรอง · ยกเลิก · ตกลง · มือถือ bottom sheet ล้างตัวกรองที่หัว ยกเลิก / ตกลง ที่ท้าย)
     ช่อง Input dropdown with badges Optional ×3 ตาม "PEA Car Cost Filter" ของ UI Release#2 · ค่าในแผง = o.filter (ยังไม่กดตกลง ตารางยังเป็นตัวกรองเดิม) */
  if (o.filter) {
    const fd = { regions: o.filter.regions || [], districts: o.filter.districts || [], types: o.filter.types || [] }, op = o.filter.open;
    const reg = multiDropdown('ภาค', fd.regions, { placeholder: 'เลือกภาค', optional: true, state: op === 'region' ? 'Focused' : undefined });
    const dist = multiDropdown('เขต', fd.districts, { placeholder: 'เลือกเขต', optional: true, state: op === 'district' ? 'Focused' : undefined });   // ไม่มี Disabled เลือกช่องไหนก่อนก็ได้ (R69)
    const typ = multiDropdown('ประเภทยานพาหนะ', fd.types, { placeholder: 'เลือกประเภทยานพาหนะ', optional: true });
    await filterPanel(scr, [reg, dist, typ]);
    const at = (n) => n.findOne(x => x.name === 'Container') || n;
    if (op === 'region') comboAt(scr, at(reg), REGIONS.map(r => [r, '', fd.regions.indexOf(r) >= 0]));
    if (op === 'district') comboAt(scr, at(dist), (fd.regions.length ? fd.regions : REGIONS).flatMap(r => DISTRICTS[r]).map(d => [d, '', fd.districts.indexOf(d) >= 0]));   // เขตของทุกภาคที่เลือกในแผงรวมกัน · ยังไม่เลือกภาค = ทุกเขต
  }
  if (o.assign) await assignModal(scr, ticked.length, o.assign.sel);
  /* popup เพิ่มรถเข้าไตรมาส n จากแท็บไตรมาสที่ว่าง (R75) = แบบ popup เพิ่มรถเข้าไตรมาสของ S6 (qAddModal → tripCarModal: Modal header + Table header ค้นหา + Table Lead checkbox ติ๊กทั้งหมดที่หัว + Modal footer · มือถือ bottom sheet)
     รถ = ของพื้นที่ที่เลือก (ยังไม่เลือกพื้นที่ = รถทุกคัน) ที่ยังไม่อยู่ในไตรมาสใด · รถในไตรมาสอื่นไม่แสดง (ย้ายไตรมาสใช้ popup จัดลงไตรมาส) · ไม่มีรถให้เพิ่ม = Empty state ใน popup */
  if (o.qAdd) {
    const pool = CAND.map((c, i) => [c, i]).filter(([c, i]) => !alloc[i] && (!picked || inArea(c, f))).map(([, i]) => i);
    await tripCarModal(scr, { cars: CAND, pool, ticked: o.qAdd.ticked || [], title: 'เพิ่มยานพาหนะเข้าไตรมาส ' + q, okText: 'เพิ่มเข้าไตรมาส ' + q,
      sub: (picked ? 'ยานพาหนะในพื้นที่ที่เลือก' : 'ยานพาหนะทุกคัน') + 'ที่ยังไม่อยู่ในไตรมาสใด · ' + pool.length + ' คัน',
      empty: ['ยานพาหนะในพื้นที่ที่เลือกจัดลงไตรมาสครบแล้ว', 'ย้ายยานพาหนะระหว่างไตรมาสได้ที่ปุ่ม จัดลงไตรมาส ในแท็บทั้งหมด'] });
  }
  return scr;
}
const FILLED = { name: NEW_PLAN[1], year: '2570' };
const R2 = { regions: [REGIONS[1]] };   // พื้นที่ที่เลือก: ภาค 2 ทุกเขต → ตารางรถ 8 คัน (แบบ A 5 พ.ย. 2569)
const A_PANEL = { regions: [REGIONS[0]], districts: ['กฟน.2', 'กฟน.1'], open: 'district' };   // R77 ค่าในแผงตัวกรองของ A.6 ตามภาพต้นแบบเว็บที่เจ้าของงานยืนยัน (ภาค 1 + กฟน.2 กฟน.1) → A.7 กดตกลงแล้ว
const A_Q1 = { 0: 1, 1: 1, 2: 1 };                          // แท็บไตรมาส 1: เลือกไว้ 3 คัน
const A_PICKS = { 0: CAR_PICK, 1: CAR_PICK, 2: CAR_PICK, 3: CAR_PICK, 5: CAR_PICK, 6: CAR_PICK, 7: CAR_PICK, 8: CAR_PICK, 9: CAR_PICK };
const A_OILS = { 0: 2, 1: 0, 2: 2, 3: 0, 4: 0, 5: 1, 6: 0, 7: 0, 8: 1, 9: 0 };   // 5 พ.ย. 2569 82-6789 = เก็บตัวอย่างและเปลี่ยน ให้ตรงงานตัวอย่าง S10 (TRIP_OIL)   // น้ำมันไฮโดรลิกรายคัน (ลำดับใน JOB_OIL_OPTS) ที่กำหนดแล้ว · 5 พ.ย. 2569   // เลือกอะไหล่ครบทุกคันแล้ว
const Q3_ADD = [3, 5];   // R75 ติ๊กเพิ่มเข้าไตรมาส 3: 82-4410 ขอนแก่น · 84-5521 นครราชสีมา
const A_FULL = { 0: 1, 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 3, 9: 3 };   // R75 รถภาค 2 ทุกคันจัดลงไตรมาสแล้ว (ไตรมาส 4 ว่าง) ⇒ popup เพิ่มรถไม่มีรถให้เลือก
const A_ALL = { 0: 1, 1: 1, 2: 1, 3: 2, 4: 2, 5: 2, 6: 3, 7: 4, 8: 4, 9: 3 };   // 6 พ.ย. 2569 เจ้าของงาน "ต้องเอารถเข้า ไตรมาสทุกคัน" ⇒ รถทุกคันของหน่วยงาน (CAND 10 คัน) อยู่ในไตรมาส · เดิม 6 คัน ไตรมาส 4 ว่าง
/* การเบิกอะไหล่รายคัน (6 พ.ย. 2569 เจ้าของงาน "อยากเพิ่มการเบิก โดยอยากให้มีการเลือกว่า ว่าเบิกอะใหล่ หรือไม่เบิก ด้วย") · { ลำดับรถ: 'none' } = ไม่เบิกอะไหล่ · ไม่มีในนี้แต่มีอะไหล่ = เบิกอะไหล่ */
const A_PART = { 0: 1, 1: 1, 2: 1, 3: 2, 5: 2 };   // 9 พ.ย. 2569 ค่ำ ยานพาหนะภาค 2 จัดลงไตรมาสแล้ว 5 จาก 8 คัน (คันที่จัดกำหนดอะไหล่ครบ) ⇒ ยังส่งไม่ได้ เพราะยานพาหนะในตารางต้องจัดครบ
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
  if (o.result === 'short') nodes.push(alertBox('Warning', 'จองได้ ' + picked.filter(i => !shortOf(i)).length + ' รายการ · คงเหลือไม่พอ ' + picked.filter(i => shortOf(i)).length + ' รายการ', 'ไส้กรองไฮโดรลิก ขาด ' + shortOf(1) + ' ชิ้น · ไส้กรองเชื้อเพลิง ขาด ' + shortOf(4) + ' ชิ้น — รอจัดซื้อแล้วเข้าคลัง'));
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
const dashProgRow = (r) => { const p = DASH_PLANS().find(x => x[0] === r[0]); return [{ text: r[0], sub: PLAN_UNIT[r[0]] }, p[1], 'ไตรมาส ' + r[1], r[2] + ' ใบ', r[3] + '/' + r[4] + ' คัน', { pill: QST[r[5]] }, GO]; };
const DASH_METRICS = [['แผนที่อนุมัติแล้ว', '3', 'Brand'], ['ยานพาหนะในแผน', '30', 'Brand'], ['รายการอะไหล่', String(DASH_AGG.length), 'Brand'], ['ยานพาหนะบำรุงรักษาแล้ว', '4/30', 'Success']];
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
const DASH_TABLE = (tab) => tab === 0 ? [sortAll(QPART_COLS), DASH_AGG] : tab === 1 ? [sortAll(DASH_CAR_COLS), DASH_CAR_ROWS()] : [sortAll(DASH_PROG_COLS), DASH_PROG.map(dashProgRow)];
/* o.tab · o.query · o.chips (ตัวกรองที่ใช้แล้ว) · o.notFound · o.empty · o.filter = แผงตัวกรอง { open } · o.exportPdf = popup ส่งออก (true PDF / false Excel) */
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
  const [cols, rows] = DASH_TABLE(tab);
  add(page, await tabs(DASH_TABS.map((t, i) => [t, i === 0 ? DASH_AGG.length : i === 1 ? 214 : DASH_PROG.length]), tab), 'h');
  add(page, metricRow(await Promise.all(DASH_METRICS.map(m => metric(m[0], m[1], m[2])))), 'h');
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tableHeader({ placeholder: DASH_HINT[tab], query: o.query, chips: o.chips, filterCount: (o.chips || []).length || null, more: [{ text: 'ส่งออก', icon: 'download-24-300-round' }] }), 'h');
  if (o.notFound) add(sec, await searchNotFound(), 'h');
  else add(sec, await tblShort(cols, rows.slice(0, TABLE_MAX.rows), { pagination: tab === 1 ? { shown: TABLE_MAX.rows, total: 214 } : rows.length }), 'h');
  /* แผงตัวกรอง (รีวิว "filter หน่วยงานผู้ขอเบิก เขต, แผน") + ปีงบประมาณ (หน้ารวมของแผนที่อนุมัติแล้ว "ในปีนั้นๆ") · filterPanel แบบรายการแผน · หลายค่า = Input dropdown with badges Optional */
  if (o.filter) {
    const fd = o.filter, at = (n) => n.findOne(x => x.name === 'Container') || n;
    const yr = dropdown('ปีงบประมาณ', '2570', { optional: true });
    const unit = multiDropdown('หน่วยงานผู้ขอเบิก', fd.units || [], { placeholder: 'เลือกหน่วยงานผู้ขอเบิก', optional: true, state: fd.open === 'unit' ? 'Focused' : undefined });
    const dist = multiDropdown('เขต', fd.districts || [], { placeholder: 'เลือกเขต', optional: true });
    const plan = multiDropdown('แผน', fd.plans || [], { placeholder: 'เลือกแผน', optional: true, state: fd.open === 'plan' ? 'Focused' : undefined });
    await filterPanel(scr, [yr, unit, dist, plan]);
    if (fd.open === 'unit') comboAt(scr, at(unit), UNITS.map(u => [u, '', (fd.units || []).indexOf(u) >= 0]));
    if (fd.open === 'plan') comboAt(scr, at(plan), DASH_PLANS().map(p => [p[0], p[1], (fd.plans || []).indexOf(p[0]) >= 0]));
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
    const [t, k] = DOC_HEAD('รายงานอะไหล่ของแผนที่อนุมัติแล้ว · ปีงบประมาณ 2570', 'หน่วยงานผู้ขอเบิก กกฟ.1');
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
/* รถในแผนปีที่ยังไม่ได้อยู่ในไตรมาสนี้ (ค่าสมมติ) — ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · เบอร์ · ชื่อผู้ดูแลยานพาหนะ · popup "เพิ่มรถเข้า" ไตรมาส (E.16) */
const Q_EXTRA = [['81-9035 ลำปาง', 'Isuzu FTR + กระเช้า Aichi SK12A', 'กฟน.2 ลำปาง', '054-218-330', 'นายเกรียงไกร มูลเมือง'], ['82-4417 น่าน', 'Hino FC + กระเช้า Tadano AT-121', 'กฟน.2 น่าน', '054-710-244', 'นายสุเมธ จันทร์ดี'],
  ['80-6652 ลำพูน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.1 ลำพูน', '053-511-090', 'นายวิทยา สายสุข']];
const Q_REMOVE_CONFIRM = (c) => ({ danger: true, title: 'ยืนยันการเอายานพาหนะออกจาก' + NOW_Q, sub: c[0] + ' จะถูกเอาออกจาก' + NOW_Q + ' ของแผนนี้ และอะไหล่ของยานพาหนะคันนี้ออกจากรายการเบิกของไตรมาส', cancel: 'ยกเลิก', ok: 'เอาออก' });   // แบบ CAR_REMOVE_CONFIRM
const qAddModal = (scr, ticked) => tripCarModal(scr, { cars: Q_EXTRA, pool: [0, 1, 2], ticked, title: 'เพิ่มยานพาหนะเข้า' + NOW_Q, sub: 'ยานพาหนะในขอบเขตของแผน (ภาค เขต และประเภทยานพาหนะเดียวกัน) ที่ยังไม่อยู่ในไตรมาสใด', okText: 'เพิ่มเข้า' + NOW_Q });
const Q_PARTS_EMPTY = 'ไตรมาสนี้ไม่มีอะไหล่ที่ต้องเบิก';   // บรรทัดรองของ Empty state หัวข้ออะไหล่ในไตรมาส n (ชุดเดียวกับ S2 อะไหล่ในแผน)
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
  const cars = col('Section', [await sectionLabel('ยานพาหนะใน' + Q, { badge: qAll.length, buttons: [{ kind: 'Secondary button', text: 'เพิ่มยานพาหนะ', icon: 'add-24-300-round' }] }),
    await tblShort(TRIP_Q_COLS.concat([['', 104]]), qCars.map(([c, i]) => { const k = i >= 0 ? tripOf(i) : -1, sub = (o.subs || {})[c[0]];
      /* R82 ช่องตามชุด TRIP_V_COLS (ไม่มีสถานที่) · ยานพาหนะที่เพิ่มเข้าไตรมาส (Q_EXTRA) และที่ย้ายมา (S25 MOVE_Q2_PAGE) ยังไม่อยู่ในแผนเดินทาง ⇒ ผู้ดูแลจากข้อมูลยานพาหนะ วันดำเนินการ "—" เรียงตามชุดเดียวกัน
         เบอร์ติดต่อ = เบอร์บรรทัดบน ชื่อผู้ดูแลบรรทัดรอง แบบ tripPhoneCell (9 พ.ย. 2569 · 10 พ.ย. 2569 แก้จุดนี้ที่ยังเป็นชื่อบน เบอร์ล่าง) */
      const base = i >= 0 ? tripVCells(i, k >= 0 ? trips[k] : {}, { drop: ['สถานที่บำรุงรักษา'] }) : [c[0], typeOf(c), c[1], c[2], { text: c[3], sub: c[4] }, '—'];
      if (sub) base[0] = { text: c[0], sub };
      return base.concat([J[c[0]] ? { pill: WSTAT[J[c[0]]] } : k >= 0 ? { text: trips[k].name, sub: 'เพิ่มเข้าแผนเดินทางแล้ว' } : { pill: ['ยังไม่มีแผนเดินทาง', 'Gray'] },   /* 6 พ.ย. 2569 เจ้าของงาน "หลังจากสร้างแผนการเดินทางแล้ว รถที่เพิ่ม จะแสดงว่าถูกเพิ่มแล้ว" */ J[c[0]] ? { menu: 1, items: [MOVE_ITEM] } : { icons: k >= 0 ? ['stylus-24-300-round'] : ['stylus-24-300-round', 'delete-24-300-round'] }]); }), qAll.length > qCars.length ? { pagination: { shown: qCars.length, total: qAll.length } } : {})], 16);
  const free = qAll.filter(([, i]) => i < 0 || tripOf(i) < 0).length;   // 5 พ.ย. 2569 รีวิว "สามารถสร้างแผนได้จนกว่าจะไม่เหลือรถอยู่แล้ว" ⇒ รถทุกคันอยู่ในแผนเดินทางแล้ว ปุ่มกดไม่ได้
  const sec = col('Section', [await sectionLabel('แผนเดินทาง', { badge: trips.length, buttons: [{ kind: 'Primary button', text: 'สร้างแผนเดินทาง', icon: 'add-24-300-round', disabled: !free }] })], 16);
  if (trips.length) add(sec, await tblShort(TRIP_COLS, trips.map(t => [{ text: t.name, sub: tripPlaces(t) }, t.d1 + ' – ' + t.d2, String(t.sel.length), tripBy(t), { pill: TST[t.st] }, { icons: ['keyboard_arrow_right-20-400-round'] }])), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ยังไม่มีแผนเดินทาง'); await text(es, 'Supporting text', 'สร้างแผนเดินทางเพื่อนัดวันเข้าตรวจ แจ้งเจ้าของยานพาหนะและ กรย.'); const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false; const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'สร้างแผนเดินทาง', 'Leading icon swap': icon('add-24-300-round') }); }
  /* อะไหล่ในไตรมาส n (6 พ.ย. 2569 เจ้าของงาน "หน้าที่ รวมรถในไตรมาส จะเป็นรวมแยกตามรายการ ไม่ต้องมีจาก smart inventory" · แทนหน้าความคืบหน้าอะไหล่ S4 เดิม)
     Section label + Table QPART_COLS (R81) · ดูอย่างเดียว · ยอด = PARTS ของไตรมาสที่กำลังทำ · o.parts = { qty, subs } ไตรมาสอื่น (S25 รวมอะไหล่ของยานพาหนะที่ย้ายมา บรรทัดรองใต้ชนิด) */
  /* 9 พ.ย. 2569 (ตามเว็บ): รายการที่จำนวนเป็น 0 ไม่แสดง · ไม่เหลือสักรายการ (ยานพาหนะในไตรมาสไม่เบิกอะไหล่ทุกคัน หรือไม่มียานพาหนะ) = Empty state/Data empty
     ข้อความเดียวกับหัวข้ออะไหล่ในแผนของ S2 (planPartsSec): "ยังไม่มีรายการอะไหล่" / "ไตรมาสนี้ไม่มีอะไหล่ที่ต้องเบิก" · o.parts.qty = [] ⇒ จอว่าง */
  const pq = o.parts || {}, qParts = PARTS.map((p, x) => [(pq.subs || {})[x] ? { text: p[0], sub: pq.subs[x] } : p[0], p[1], p[2], String(pq.qty ? pq.qty[x] || 0 : p[3]), p[4]]).filter(r => +r[3] > 0);
  const parts = col('Section', [await sectionLabel('อะไหล่ใน' + Q), qParts.length ? await tblShort(QPART_COLS, qParts) : await noParts(Q_PARTS_EMPTY)], 16);
  add(page, col('Content', [await vehicleInfo(o.q ? PLAN_KV.map(([k, v]) => k === 'ไตรมาส' ? [k, Q + ' (' + qAll.length + ' คัน)'] : [k, v]) : TRIP_KV, 'รายละเอียดแผน'), cars, parts, sec], 32), 'h');
  if (MOB) qCars.forEach(([c], r) => { if (J[c[0]]) moveCard(scr, r, o.moveOff); });   // S25 มือถือ: ปุ่ม "ย้ายไปไตรมาสอื่น" บนการ์ด (Mobile table item Style=Action buttons)
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
const TRIP_PICK_COLS = [['ทะเบียน', 300], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของยานพาหนะ', 200]];
/* 5 พ.ย. 2569 รีวิว "รถ 1 คันในไตรมาส สามารถอยู่ได้เพียง 1 แผนการเดินทางเท่านั้น · รถที่ถูกเลือกลงแผนอื่นไปแล้ว จะยังแสดงให้เห็นตอนที่กดเพิ่มรถเข้าแผนเดินทาง แต่ไม่สามารถเลือกลงแผนเดินทางนี้ได้"
   ⇒ o.taken = { ลำดับรถ: ชื่อแผนเดินทาง } แสดงในตาราง Checkbox State=Disabled + บรรทัดรอง "อยู่ในแผนเดินทาง {ชื่อ}" (Table cell Lead checkbox · มือถือ List with checkbox item State=Disabled) · ติ๊กทั้งหมดนับเฉพาะคันที่เลือกได้ */
async function tripCarModal(scr, o) {   // o.cars = รายการรถแทน TRIP_CARS (เพิ่มรถเข้าไตรมาส E.19) · o.title · o.sub · o.okText · o.pool = รถที่แสดง (ไม่รวมคันที่อยู่ในใบนี้แล้ว) · o.taken
  const cars = o.cars || TRIP_CARS, pool = o.pool, ticked = o.ticked || [], n = ticked.length, taken = o.taken || {}, nTaken = pool.filter(i => taken[i]).length;
  const sub = o.sub || ('ยานพาหนะทุกคันของ' + NOW_Q + (nTaken ? ' · ' + nTaken + ' คันอยู่ในแผนเดินทางอื่นแล้ว เลือกไม่ได้' : ''));
  const ok = (o.okText || 'เพิ่มเข้าแผนเดินทาง') + (n ? ' (' + n + ')' : '');
  const rows = pool.map(i => [{ check: !taken[i] && ticked.indexOf(i) >= 0, text: cars[i][0], sub: taken[i] ? 'อยู่ในแผนเดินทาง ' + taken[i] : '', disabled: !!taken[i] }, cars[i][1], cars[i][2]]);
  const empty = async () => { const es = inst('Empty state/Data empty'); await text(es, 'Text', o.empty ? o.empty[0] : 'ยานพาหนะทุกคันของ' + NOW_Q + ' อยู่ในแผนเดินทางแล้ว'); await text(es, 'Supporting text', o.empty ? o.empty[1] : 'ไม่มียานพาหนะที่เพิ่มเข้าแผนเดินทางนี้ได้'); /* o.empty = [หัว, บรรทัดรอง] (R75) */ const a = find(es, 'Actions'); if (a) a.visible = false; return es; };
  const search = () => { const f = field('', '', { placeholder: 'ค้นหาทะเบียน, ยี่ห้อ/รุ่น, หน่วยงาน', lead: 'search-24-300-round' }); setProps(f, { Label: false, Helper: false }); return f; };
  if (MOB) { await popupModal(scr, { title: o.title || 'เพิ่มยานพาหนะเข้าแผนเดินทาง', body: pool.length ? [search(), await tblShort(TRIP_PICK_COLS, rows)] : [await empty()], ok, okOff: !n }); return; }
  const body = [];
  if (pool.length) {
    const th = await tableHeader({ placeholder: 'ค้นหาทะเบียน, ยี่ห้อ/รุ่น, หน่วยงาน' });
    const acts = find(th, 'Actions'); if (acts) acts.visible = false;
    const t = await tblShort(TRIP_PICK_COLS, rows);
    headCheck(t, rows);   // เลือกทั้งหมดที่หัวคอลัมน์แรก (ตาม Select vehicles) นับเฉพาะคันที่เลือกได้
    body.push(th, t);
  } else body.push(await empty());
  await popupModal(scr, { title: o.title || 'เพิ่มยานพาหนะเข้าแผนเดินทาง', sub, w: 800, body, ok, okOff: !n });
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
/* S12 ผลการทดสอบน้ำมันไฮโดรลิก — 4 พ.ย. 2569 เจ้าของงาน "ไม่ได้อยากเป็น popup อยากได้เป็นส่วนหนึ่งของ flow เลย เช่น ถ้าเลือก เก็บตัวอย่างน้ำมันไฮดรอลิก ก็จะ มีให้เลือกเก็บผล แต่เป็น optional"
   + "ตอนนี้อยากให้ทางเข้าคือทางเดียวคือดูรายละเอียดแล้วเพิ่มในส่วนของรายละเอียด" ⇒ ใส่ผลได้ในหน้าปิดงาน (ไม่บังคับ) หรือภายหลังที่ section ในหน้างานรายคันที่เสร็จสิ้น · เลิก popup และเมนู "ผลการทดสอบน้ำมันไฮโดรลิก"
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
/* น้ำมันไฮโดรลิกหน้างาน (3 พ.ย. 2569 เจ้าของงาน "หน้า I.8 I.9 อยากให้สามารถเลือกได้ว่าเก็บตัวอย่างน้ำมันไฮดรอลิก หรือเปลี่ยน เนื่องจากการเปลี่ยนน้ำมันเปลี่ยนทุก 3 ปี … หรือสามารถเลือกได้ว่าเก็บตัวอย่างและเปลี่ยน")
   Radio text card แบบ "น้ำมันไฮโดรลิก" ของหน้าอะไหล่ของรถ (S21) + ช่องเปลี่ยนน้ำมันครั้งล่าสุด · เลือกเก็บตัวอย่างอย่างเดียว = ไม่มีน้ำมันในรายการอะไหล่ · มีเก็บตัวอย่าง = เข้ารอผลตรวจ S12 */
const JOB_OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน', 'เก็บตัวอย่างและเปลี่ยน'], JOB_OIL = 2;
/* 5 พ.ย. 2569 รีวิว S10 "น้ำมันไฮโดรลิก เลือกตัวเลือก สามารถระบุวันที่เปลี่ยนน้ำมันครั้งล่าสุดได้" (R73) ⇒ ช่องเดิม Readonly เป็น Text input กรอกได้ "วันที่เปลี่ยนน้ำมันครั้งล่าสุด (ถ้ามี)"
   placeholder "วว/ดด/ปปปป" + ปฏิทิน Date picker Type=Single ใต้ช่อง (แบบช่องวันที่ของแผนเดินทาง S6 · ตอบรับนัดหมายวันเดียวของ Overhaul Q.1.1) · ค่าตั้งต้น = วันในข้อมูลรถ
   o.date = ค่าที่แสดง (null = ใช้ค่าในข้อมูลรถ · '' = ว่าง) · o.dateOpen = ช่องที่ปฏิทินเปิด */
/* วันที่เปลี่ยนน้ำมันครั้งล่าสุดของรถแต่ละคัน ค่าเดียวทุกจอ (ชีตลูกค้า 5 พ.ย. 2569: 12/03/2568 กับ 18/10/2568 ปนกัน) — ยึดข้อมูลการบำรุงรักษา S24 (MA_ROWS ช่อง "เปลี่ยนน้ำมันล่าสุด")
   ยกเว้นคันของงานตัวอย่าง S10 (82-6789) ที่ MA_ROWS เป็นค่าหลังปิดงานนี้ (04/11/2569) ⇒ ก่อนเริ่มงานใช้ 12/03/2568 · รถนอกแผนเดินทางใช้ LAST_OIL ตามลำดับ CAND */
function lastOil(plate) {
  const k = TRIP_CARS.findIndex(c => c[0] === plate);
  if (k === JOB_I) return LAST_OIL[0];
  const r = k >= 0 ? MA_ROWS.find(x => x[0] === k) : null;
  if (r) return r[5] || 'ไม่มีข้อมูล';
  const j = CAND.findIndex(c => c[0] === plate);
  return j >= 0 ? LAST_OIL[j] : 'ไม่มีข้อมูล';
}
/* น้ำมันไฮโดรลิกตามแผนของรถแต่ละคันในไตรมาส (S21) — ค่าตั้งต้นของ Step 2 (ชีตลูกค้า 5 พ.ย. 2569: เดิมเลือก เก็บตัวอย่างและเปลี่ยน ทุกคัน) · ใช้ตารางรถในหน้ารายละเอียดแผนด้วย
   82-6789 (คันตัวอย่าง S10) = เก็บตัวอย่างและเปลี่ยน · อื่นตามตารางเดิม (ทุกคันที่ 3 เปลี่ยนน้ำมัน ที่เหลือเก็บตัวอย่าง) */
const TRIP_OIL = TRIP_CARS.map((_, i) => i === JOB_I ? JOB_OIL : i % 3 === 0 ? 1 : 0);
function oilDateField(o) {
  o = o || {};
  const v = o.date == null ? lastOil(o.car || TRIP_CARS[JOB_I][0]) : o.date;
  return field('วันที่เปลี่ยนน้ำมันครั้งล่าสุด', v, { placeholder: 'วว/ดด/ปปปป', optional: true, state: o.dateOpen ? 'Focused' : undefined });
}
async function jobOil(sel, res, o) {   // res = หน้าสรุปงาน: เลือกแบบที่มีการเก็บตัวอย่างแล้วมีช่องผลการทดสอบ (ถ้ามี) ต่อท้าย (S12 · 4 พ.ย. 2569) · o = ช่องวันที่ (oilDateField)
  const oil = await radioPick('น้ำมันไฮโดรลิก', JOB_OIL_OPTS, sel);
  const last = oilDateField(o);
  add(oil, MOB ? last : row('Row', [last, frame('Spacer', 'VERTICAL')]), 'h');
  if (res && OIL_SAMPLED(sel)) for (const n of await oilResult(Object.assign({ optional: true }, res))) add(oil, n, 'h');
  return oil;
}
const jobWork = (sel) => WORK.filter((w, k) => k > 0 || sel !== 0);   // แถวแรก = เปลี่ยนน้ำมันไฮโดรลิก
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
const CANNOT_USED = ['30', '2', '0', '0'];   // เปลี่ยนน้ำมันและไส้กรองไฮโดรลิกแล้วพบปัญหา ทำต่อไม่ได้
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
const HIRE_WHY = 'กระบอกสูบไฮโดรลิกหลักรั่ว ต้องส่งซ่อมก่อนจึงบำรุงรักษาได้';
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
    : [['เริ่มงาน', HIRE_START], ['ปิดงาน', HIRE_END], ['ผู้บันทึก', HIRE_BY], ['น้ำมันไฮโดรลิก', JOB_OIL_OPTS[TRIP_OIL[i]]], ['เลขไมล์หลังทำ', '176,090 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '5,846 ชม.']];
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
  ['น้ำมันไฮโดรลิก ISO VG 46', '120', '30', '3,600', '0', '0', '30', 'น้ำมันเก่าส่งกำจัดตามระเบียบ'],
  ['ไส้กรองไฮโดรลิก', '680', '2', '1,360', '0', '0', '2', ''],
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
const nf = (n) => n.toLocaleString('en-US');
const personSum = (r) => (r[1] + r[2]) * r[3];
const costSum = (k) => CLOSE_COST_BY.reduce((a, r) => a + r[k] * r[3], 0);
const CLOSE_COST = { perDiem: nf(costSum(1)), lodging: nf(costSum(2)), travel: nf(CLOSE_TRAVEL), total: nf(costSum(1) + costSum(2) + CLOSE_TRAVEL) };
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
  const sum = filled ? CLOSE_COST : { perDiem: '0', lodging: '0', travel: '0', total: '0' };
  return col('Section', [await section('ค่าใช้จ่ายของยานพาหนะคันนี้ (บาท)', { badge: CLOSE_COST_BY.length + ' คน' })]   // 3 พ.ย. 2569 เจ้าของงานลบกล่องแจ้งในไฟล์เองแล้ว "ลบใน script อย่างเดียว … export ต้องไม่มี"
    .concat(rows, [btn('Secondary button', 'เพิ่มพนักงาน', { icon: 'add-24-300-round' }), row('Row', [money('ค่าเดินทาง (รวมทุกคน)', CLOSE_TRAVEL), frame('Spacer', 'VERTICAL')]),
      kv([['รวมค่าเบี้ยเลี้ยง', sum.perDiem + ' บาท'], ['รวมค่าที่พัก', sum.lodging + ' บาท'], ['ค่าเดินทาง', sum.travel + ' บาท'], ['รวมค่าใช้จ่ายของยานพาหนะคันนี้', sum.total + ' บาท']]),
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
const BUCKET_ITEMS = ['น้ำมันไฮดรอลิค', 'กรองน้ำมันไฮดรอลิค', 'แรงดันน้ำมันไฮดรอลิค MAIN 2400-2600 PSI', 'ชุดเกียร์ PTO', 'ปั๊มน้ำมันไฮดรอลิค', 'เพลาขับปั๊มน้ำมันไฮดรอลิค',
  'ชุดกระบอกขาช้างหน้าซ้าย-ขวา', 'ชุดกระบอกขาช้างหลังซ้าย-ขวา', 'น้ำมันหล่อลื่นชุดเฟืองหมุนฐานเครน', 'ชุดมอเตอร์และเฟืองหมุนฐานเครน', 'ชุดกระบอก LOWER BOOM', 'ชุดกระบอก UPPER BOOM',
  'ชุดกระบอก EXTENSION', 'ชุดโรตารี่', 'ระบบ EMERGENCY', 'ชุด CONTROL ล่าง', 'ชุด CONTROL บน', 'สายน้ำมันไฮดรอลิค', 'สายสัญญาณต่างๆ', 'เกจวัดต่างๆ', 'ชุดวาล์วล๊อคต่างๆ',
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
const INSPECT_NOTE = { 17: 'สายน้ำมันไฮดรอลิคซึมที่ข้อต่อ เปลี่ยนแล้ว' }, INSPECT_FIX = 17;   // ข้อมูลจำลองตอนตรวจครบ: ทุกรายการ "ปกติ" ยกเว้นข้อ 18 "แก้ไข"
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
    if (safetyOn()) nodes.push(col('Section', await safetyDocs(o.safety), 16));   // Safety Inspection (ถ้ามี) ต่อจากน้ำมันไฮโดรลิก (4 พ.ย. 2569)
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
  const nodes = [await vehicleInfo(VEH_KV.concat([['เริ่มงาน', JOB_START], ['ปิดงาน', JOB_END], ['ผู้บันทึก', JOB_BY], ['น้ำมันไฮโดรลิก', JOB_OIL_OPTS[JOB_OIL]], ['เลขไมล์หลังทำ', '182,640 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '6,131 ชม.']]), 'ข้อมูลยานพาหนะและงาน'),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tblShort(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16),
    // ภาพตอนจบงานเอาออก 4 พ.ย. 2569 ให้ตรงกับหน้าปิดงาน ("ยังไม่ต้องมีเพิ่มรูป" 3 พ.ย.)
    // ค่าใช้จ่ายรายคันที่กรอกตอนปิดงาน (3 พ.ย. 2569) · แสดงเฉพาะรายการที่กรอก
    col('Section', [await sectionLabel('ค่าใช้จ่ายของยานพาหนะคันนี้ (บาท)'), await tblShort([['พนักงาน', 0, 'Lead text'], ['ค่าเบี้ยเลี้ยง/วัน', 150], ['ค่าที่พัก/วัน', 150], ['จำนวนวัน', 120], ['รวม', 150]],
      CLOSE_COST_BY.map(r => [r[0], nf(r[1]), nf(r[2]), String(r[3]), nf(personSum(r))])),
      kv([['รวมค่าเบี้ยเลี้ยง', CLOSE_COST.perDiem + ' บาท'], ['รวมค่าที่พัก', CLOSE_COST.lodging + ' บาท'], ['ค่าเดินทาง (รวมทุกคน)', CLOSE_COST.travel + ' บาท'], ['รวมค่าใช้จ่ายของยานพาหนะคันนี้', CLOSE_COST.total + ' บาท'], ['งบที่ตัด', BUDGET_CUT[0]], ['ศูนย์ต้นทุน', OWNER_CC(TRIP_CARS[JOB_I])]])], 16)];   // คู่ งบที่ตัด + ศูนย์ต้นทุน แบบ BudgetSource ของงานซ่อม (5 พ.ย. 2569 R72)
  // 3 พ.ย. 2569 เจ้าของงาน "ตรงนี้ลบแบชออก แล้วมี radio ว่าผ่าน ไม่ผ่าน และมีให้ upload ไฟล์เป็น optional" ⇒ กรอกผลในหน้านี้ได้เลย (อีกทางคือเมนู … ในหน้ารายละเอียดแผนเดินทาง S12)
  // S12 (4 พ.ย. 2569) ทางเดียวที่บันทึกผลหลังปิดงาน = section นี้ในหน้ารายละเอียดงานรายคัน · แสดงเฉพาะคันที่เก็บตัวอย่าง · o.res = { sel, files, errors, saved }
  const res = o.res || {};
  if (OIL_SAMPLED(JOB_OIL)) nodes.push(col('Section', [await sectionLabel('ผลการทดสอบน้ำมันไฮโดรลิก'), ...await oilResult(res),   // หน้างานรายคันแบบดู = Section label (R3)
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
   เคาะ: แท็บ "การบำรุงรักษา" ของ Vehicle Management · ครั้งถัดไป = รายการที่ถึงก่อนจาก 4 อย่าง (รอบเวลา · ชั่วโมงเครื่องจักร/ระยะทาง · น้ำมันไฮโดรลิก 3 ปี · Safety Inspection 1 ปี) · ใกล้ครบ = เหลือไม่เกิน 6 เดือน
   ตาม Vehicle list + Filter + Vehicle detail (แท็บ ตารางบำรุงรักษา) ของ UI Release#2 หน้า Vehicle Management · Tabs · Table header · Table · Side panel header/footer · Empty state/Search not found ของไฟล์ Component
   บรรทัดรองสถานะ = Supporting text สี Color/text/warning · Color/text/error แบบช่องเลขไมล์ของ Vehicle list (toneText ใน core) */
const MA_DUE = { near: ['ใกล้ครบกำหนดบำรุงรักษา', 'warning'], over: ['ครบกำหนดบำรุงรักษา', 'error'] };   // ข้อความตาม Vehicle list ของ UI Release#2
const MA_ITEMS = ['รอบเวลา', 'ชั่วโมงเครื่องจักร/ระยะทาง', 'น้ำมันไฮโดรลิก', 'Safety Inspection'];
/* รถทุกคัน (ข้อมูลสมมติ · วันนี้ 04/11/2569 · ใกล้ครบ = ภายใน 04/05/2570) — ลำดับรถใน TRIP_CARS · ล่าสุด · แผน · ไมล์ · ชม. · เปลี่ยนน้ำมันล่าสุด · ผลตรวจน้ำมัน · Safety ล่าสุด · ครบกำหนด · รายการ · สถานะ */
const MA_ROWS = [
  [9, '01/10/2568', 'MRZ6900011', '171,220', '5,610', '01/10/2568', 'ผ่าน', '01/10/2568', '01/10/2569', 3, 'over'],
  [2, '14/10/2568', 'MRZ6900011', '168,900', '5,480', '14/10/2568', 'ไม่ผ่าน', '14/10/2568', '14/10/2569', 0, 'over'],
  [7, '20/11/2568', 'MRZ6900011', '154,300', '4,920', '05/02/2567', 'ผ่าน', '20/11/2568', '20/11/2569', 3, 'near'],
  [4, '10/01/2569', 'MRZ6900014', '176,050', '5,840', '10/01/2569', 'ผ่าน', '10/01/2569', '15/01/2570', 1, 'near'],
  [6, '02/02/2569', 'MRZ6900014', '149,700', '4,410', '18/06/2568', 'ผ่าน', '02/02/2569', '02/02/2570', 0, 'near'],
  [1, '18/06/2569', 'MRZ6900014', '176,050', '6,010', '12/03/2567', 'ผ่าน', '18/06/2569', '12/03/2570', 2, 'near'],
  [8, '20/09/2569', 'MRZ7000001', '163,480', '5,120', '20/09/2569', 'ผ่าน', '20/09/2569', '20/09/2570', 0, ''],
  [0, '04/11/2569', 'MRZ7000001', '182,640', '6,131', '04/11/2569', 'รอผลตรวจ', '04/11/2569', '04/11/2570', 0, ''],
  [3, '', '', '', '', '', '', '', '', -1, '']];
const MA_COLS = [['เลขทะเบียน', 230, 'Lead text'], ['ประเภทยานพาหนะ', 170], ['บำรุงรักษาล่าสุด', 150], ['เลขไมล์', 140], ['น้ำมันไฮโดรลิก', 170], ['Safety Inspection', 150], ['กำหนดครั้งถัดไป', 0], ['', 64]];
const maRow = (r) => {
  const c = TRIP_CARS[r[0]], none = !r[1], due = MA_DUE[r[10]];
  return [{ text: c[0], sub: c[1] }, { text: typeOf(c), sub: c[2] }, none ? '-' : { text: r[1], sub: r[2] }, none ? '-' : { text: r[3] + ' กม.', sub: r[4] + ' ชม.' },
    none ? '-' : { text: 'เปลี่ยน ' + r[5], sub: 'ผลตรวจ ' + r[6] }, none ? '-' : r[7],
    none ? { text: 'ยังไม่มีข้อมูลการบำรุงรักษา' } : { text: r[8] + ' · ' + MA_ITEMS[r[9]], sub: due ? due[0] : '', tone: due ? due[1] : '' },
    { menu: 1, items: MENU.slice(0, 1) }];
};
const MA_DUE_N = MA_ROWS.filter(r => r[10]).length;
async function maTabs() { return tabs([['ปฏิทินการจอง', null], ['ยานพาหนะ', null], ['การบำรุงรักษา', MA_DUE_N]], 2); }   // แท็บของ Vehicle list · ป้าย = คันที่ใกล้หรือถึงกำหนด
async function searchNotFound() {   // Empty state/Search not found ข้อความตาม Vehicle list (State=Search not found) ของ UI Release#2
  const es = inst('Empty state/Search not found');
  await text(es, 'Text', 'ไม่พบข้อมูล'); await text(es, 'Supporting text', 'เปลี่ยนคำค้นหรือเงื่อนไขแล้วลองใหม่อีกครั้ง');
  const bs = es.findAll(n => n.type === 'INSTANCE' && /button/i.test(n.name));
  bs.forEach((b, i) => { if (i === 0) setProps(b, { Text: 'ล้างตัวกรอง', 'Leading icon': false, 'Trailing icon': false }); else b.visible = false; });
  return es;
}
/* o.query = คำค้น · o.rows = แถวที่เหลือ (ลำดับใน MA_ROWS) · o.chips = ชิปตัวกรอง · o.filter = เปิดแผงตัวกรอง · o.menu = เปิดเมนู "…" */
async function maList(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'ข้อมูลยานพาหนะ', root: 'ยานพาหนะ' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await maTabs(), 'h');
  add(sec, await tableHeader({ placeholder: 'เลขทะเบียน, ยี่ห้อ, รุ่น', query: o.query, chips: o.chips }), 'h');
  const rows = (o.rows || MA_ROWS.map((r, i) => i)).map(i => maRow(MA_ROWS[i]));
  add(sec, rows.length ? await tblShort(MA_COLS, rows, { pagination: rows.length }) : await searchNotFound(), 'h');
  if (o.filter) await filterPanel(scr, [dropdown('ประเภทยานพาหนะ', 'ทั้งหมด', { optional: true }), dropdown('สังกัดยานพาหนะ', 'ทั้งหมด', { optional: true }),
    dropdown('สถานะกำหนดการ', MA_DUE.near[0], { optional: true }), dropdown('รายการที่ครบกำหนด', 'ทั้งหมด', { optional: true })]);
  if (o.menu) planMenu(scr, MENU.slice(0, 1));
  return scr;
}
/* หน้ารายละเอียดรถ แท็บ "ตารางบำรุงรักษา" (Vehicle detail ของ UI Release#2) — กำหนดครั้งถัดไป 4 รายการ + ประวัติการบำรุงรักษา (1 แถว = 1 ครั้งที่ปิดงาน ใหม่สุดก่อน) */
const MA_CAR = 1;   // 82-1145 ใกล้ครบรอบเปลี่ยนน้ำมันไฮโดรลิก
const MA_NEXT_COLS = [['รายการ', 0, 'Lead text'], ['ครั้งล่าสุด', 220], ['รอบ', 220], ['ครบกำหนด', 320]];
const MA_NEXT = [['รอบเวลา', '18/06/2569', 'ทุก 12 เดือน', { text: '18/06/2570' }], ['ชั่วโมงเครื่องจักร/ระยะทาง', '6,010 ชม. · 176,050 กม.', 'ทุก 1,000 ชม.', { text: '7,010 ชม. (ประมาณ 10/2570)' }],
  ['น้ำมันไฮโดรลิก', 'เปลี่ยน 12/03/2567', 'เปลี่ยนทุก 3 ปี', { text: '12/03/2570', sub: MA_DUE.near[0], tone: MA_DUE.near[1] }], ['Safety Inspection', '18/06/2569', 'ทุก 1 ปี', { text: '18/06/2570' }]];
const MA_HIST_COLS = [['วันที่ปิดงาน', 130], ['แผน', 140], ['งานที่ทำ', 0], ['เลขไมล์', 120], ['ชั่วโมงเครื่องจักร', 140], ['น้ำมันไฮโดรลิก', 170], ['ผู้บันทึก', 170], ['', 64]];
const MA_HIST = [['18/06/2569', 'MRZ6900014', 'เปลี่ยนไส้กรองไฮโดรลิก · ไส้กรองน้ำมันเครื่อง', '176,050 กม.', '6,010 ชม.', { text: 'เก็บตัวอย่าง', sub: 'ผลตรวจ ผ่าน' }, TRIP.staff[0]],
  ['20/06/2568', 'MRZ6800007', 'เปลี่ยนไส้กรองไฮโดรลิก', '168,300 กม.', '5,420 ชม.', { text: 'เก็บตัวอย่าง', sub: 'ผลตรวจ ผ่าน' }, TRIP.staff[2]],
  ['12/03/2567', 'MRZ6700004', 'เปลี่ยนน้ำมันไฮโดรลิก · ไส้กรอง', '159,800 กม.', '4,880 ชม.', { text: 'เปลี่ยนน้ำมัน' }, TRIP.staff[1]]].map(r => r.concat([{ menu: 1, items: MENU.slice(0, 1) }]));
async function maDetail(name, o) {
  o = o || {};
  const c = TRIP_CARS[MA_CAR];
  const { scr, page } = await shell(name, { title: c[0], back: true, root: 'ยานพาหนะ', crumbs: ['ข้อมูลยานพาหนะ', c[0]] });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs([['ข้อมูลยานพาหนะ', null], ['ข้อมูลการเดินทาง', null], ['การเติมเชื้อเพลิง', null], ['ตารางบำรุงรักษา', null], ['ประวัติการซ่อมบำรุง', null]], 3), 'h');
  add(sec, await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภท', typeOf(c)], ['หน่วยงานเจ้าของยานพาหนะ', c[2]], ['เลขไมล์สะสม', '176,050 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,010 ชม.']]), 'h');
  add(sec, col('Section', [await sectionLabel('กำหนดครั้งถัดไป'), await tblShort(MA_NEXT_COLS, MA_NEXT)], 16), 'h');
  add(sec, col('Section', [await sectionLabel('ประวัติการบำรุงรักษา', { badge: MA_HIST.length }), await tblShort(MA_HIST_COLS, MA_HIST, { pagination: MA_HIST.length })], 16), 'h');
  if (o.menu) planMenu(scr, MENU.slice(0, 1));
  return scr;
}

/* ---------- S12 บันทึกผลตรวจน้ำมันไฮโดรลิก ---------- */

/* ---------- S15 ประวัติงานบำรุงรักษา · S17 รายงานผล/ปิดงาน · S18 ต้นทุน ---------- */
const HIST_COLS = [['ทะเบียน', 160, 'Lead text', 'Swap'], ['วันที่ทำ', 120], ['งานที่ทำ', 0], ['อะไหล่ที่ใช้', 220], ['ผลน้ำมัน', 110, 'Badge'], ['ผู้ทำ', 150], ['การยอมรับ', 190, 'Badge']];
const HIST = VEH.slice(0, 4).map((v, i) => [v[0], '0' + (4 + i) + '/11/2569', 'เปลี่ยนน้ำมันไฮโดรลิก · ไส้กรอง', '30 ลิตร · 5 ชิ้น',
  { pill: i === 2 ? ['ไม่ผ่าน', 'Error'] : ['ผ่าน', 'Success'] }, TRIP.staff[i % 3], { pill: i < 3 ? ACC.ok : ACC.wait }]);
async function progressScreen(name, o) {
  o = o || {};
  const done = o.done || 10, total = +P[4];
  const { scr, page } = await detail(name, { crumbs: ['ประวัติงานบำรุงรักษา'], status: 'active' });
  add(page, col('Content', [
    await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ความคืบหน้ารายคัน'), kv([['บำรุงรักษาแล้ว', done + ' / ' + total + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['รอทำ', (total - done) + ' คัน'], ['หน่วยงานยอมรับแล้ว', (done - 1) + ' คัน']]),
      alertBox('Warning', 'ยังบำรุงรักษาไม่ครบทุกคันตามแผน (เหลือ ' + (total - done) + ' คัน)', 'บอร์ด: "บำรุงรักษาเสร็จทั้งหมดหรือไม่?" — ครบแล้วจึงบันทึกและส่งประวัติให้หัวหน้าหน่วยงาน ตรวจสอบได้')], 16),
    col('Section', [await sectionLabel('ประวัติงานบำรุงรักษา', { badge: HIST.length }), await tblShort(HIST_COLS, HIST)], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งประวัติให้หัวหน้าตรวจสอบ', { size: 'lg', disabled: true }]])
  ], 32), 'h');
  return scr;
}
async function historyScreen(name, o) {
  o = o || {};
  const total = +P[4];
  const { scr, page } = await detail(name, { crumbs: ['ประวัติงานบำรุงรักษา'], status: o.sent ? 'hist' : 'active' });
  const nodes = [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ความคืบหน้ารายคัน'), kv([['บำรุงรักษาแล้ว', total + ' / ' + total + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['รอทำ', '0 คัน'], ['หน่วยงานยอมรับแล้ว', total + ' คัน']])], 16),
    col('Section', [await sectionLabel('ประวัติงานบำรุงรักษาทั้งหมด', { badge: total }), await tblShort(HIST_COLS, HIST, { pagination: total })], 16)];
  if (o.sent) nodes.push(alertBox('Info', 'ส่งประวัติให้หัวหน้าหน่วยงาน ตรวจสอบแล้ว 12/11/2569', 'แก้ไขไม่ได้จนกว่าหัวหน้าจะตีกลับ (S16)'));
  nodes.push(btnRow(o.sent ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }]] : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งประวัติให้หัวหน้าตรวจสอบ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
async function reportScreen(name, o) {
  o = o || {};
  const { scr, page } = await detail(name, { crumbs: ['รายงานผลการบำรุงรักษา'], status: o.closed ? 'closed' : 'passed',
    actions: [['Secondary button', 'ดาวน์โหลดรายงาน', 'cloud_upload-24-300-round']] });
  const nodes = [await vehicleInfo(PLAN_KV.concat([['หัวหน้าหน่วยงาน ตรวจประวัติ', 'ผ่าน · 13/11/2569'], ['ผู้ตรวจ', 'นายประเสริฐ มั่นคง']]), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('สรุปรายงานผลการบำรุงรักษา'), kv([['ยานพาหนะตามแผน', P[4] + ' คัน'], ['บำรุงรักษาแล้ว', P[4] + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['ใบเดินทาง', '2 ใบ'],
      ['อะไหล่ที่ใช้', '5 รายการ · คืนคลัง 1 รายการ'], ['ผลน้ำมันไฮโดรลิก', 'ผ่าน 11 · ไม่ผ่าน 1'], ['หน่วยงานยอมรับผล', P[4] + ' / ' + P[4] + ' คัน'], ['ช่วงดำเนินการ', '03/11/2569 – 12/11/2569']])], 16)];
  if (o.closed) nodes.push(alertBox('Success', 'ปิดงานแล้ว 14/11/2569', 'ไปขั้นคำนวณต้นทุน (S18) ได้'));
  nodes.push(btnRow(o.closed ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'คำนวณต้นทุน', { size: 'lg' }]] : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ปิดงาน', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
const COST_COLS = [['ใบเดินทาง / จุดรวมงาน', 0, 'Lead text'], ['ยานพาหนะ (คัน)', 100], ['ค่าแรง (เบี้ยเลี้ยง)', 160], ['ค่าที่พัก', 140], ['ค่าเดินทาง', 140], ['รวม (บาท)', 150]];
const COSTS = [[TRIP.place, '6', '7,200', '9,600', '4,850', '21,650'], ['จุดรวมงาน กฟน.2 น่าน', '6', '7,200', '12,800', '6,320', '26,320']];
async function costScreen(name) {
  const { scr, page } = await detail(name, { crumbs: ['ต้นทุนการบำรุงรักษา'], status: 'closed', actions: [['Secondary button', 'ดาวน์โหลด Excel', 'cloud_upload-24-300-round']] });
  add(page, col('Content', [
    await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ต้นทุนการบำรุงรักษา รายใบเดินทาง', { badge: COSTS.length }), await tblShort(COST_COLS, COSTS)], 16),
    col('Section', [await sectionLabel('Summary ของต้นทุน'), kv([['ค่าแรง (เบี้ยเลี้ยง)', '14,400 บาท'], ['ค่าที่พัก', '22,400 บาท'], ['ค่าเดินทาง', '11,170 บาท'], ['รวมทั้งแผน', '47,970 บาท'], ['เฉลี่ยต่อคัน', '3,997.50 บาท'], ['จำนวนคัน', P[4] + ' คัน']])], 16),
    alertBox('Info', 'ค่าแรงใช้ยอดเบี้ยเลี้ยงที่กรอกรายคันตอนปิดงาน (S10) · ยังไม่รวมค่าอะไหล่', 'รอเคาะ Q26 — "ค่าแรง" กับ "ค่าเบี้ยเลี้ยง" รายการเดียวกันไหม · ต้นทุนรวมอะไหล่/ค่าจ้างไหม')
  ], 32), 'h');
  return scr;
}

/* ======================== รอบสอง 9 scenario (เจ้าของงานสั่ง 22 ต.ค. 2569 ดึก "บำรุงรักษา สามารถ export 18 scen ได้เลย") ========================
   S2–S3 ผพจ./หัวหน้า ผพจ. · S7 ผู้รับจ้าง · S8 กบค. ตรวจแผนผู้รับจ้าง · S9 กรย. · S11 กบค. ตรวจงานผู้รับจ้าง + รับคืนอะไหล่ (ตัดออก 4 พ.ย. 2569) · S13–S14 หน่วยงาน/เจ้าของรถ · S16 หัวหน้าหน่วยงาน
   ตีความเอง (คำถามในไฟล์ 14 ยังค้าง — แจ้งเจ้าของงานแล้ว): ผพจ. กับหัวหน้า ผพจ. คนละบทบาท (Q1) · ผู้รับจ้างมีบัญชีเข้า VMS+ เอง (Q13) · ยอมรับ 2 รอบ รายคัน S13 + ทั้งแผน S14 (Q28) ·
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
const tripReviewList = async (name, rows) => roleList(name, { title: 'แผนเดินทางรออนุมัติ', search: 'ค้นหาชื่อแผนเดินทาง, ผู้สร้าง', cols: TRIP_REVIEW_COLS, rows: rows.map(tripReviewRow) });
async function tripReview(name, o) {   // o.decision = 'return' · o.reason · o.errors · o.status = 'approved'
  o = o || {};
  const t = TRIP_1;
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนเดินทาง', back: true, crumbs: ['แผนเดินทางรออนุมัติ', t.name], badge: TST[o.status || 'review'] });
  // 5 พ.ย. 2569 ทำตาม S2 (รีวิวทีมออกแบบ) ให้สอดคล้อง: ผลการพิจารณาบนสุด ไม่มีค่าเริ่มต้น · อนุมัติแล้วแสดงแค่ toast ไม่มี Alert ซ้ำ
  const d = o.status === 'approved' ? null : await decisionSection(o, 'แผนเดินทางผ่านการตรวจสอบ แจ้งเจ้าของยานพาหนะและ กรย.', 'แจ้งเหตุผลให้ผู้สร้างแผนเดินทางแก้ไขแล้วส่งใหม่');
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
const NOTI_OWN = ['Brand', 'หน่วยงานผู้ดำเนินการจะเข้าบำรุงรักษายานพาหนะของหน่วยงาน ' + ownCars(TRIP_1).length + ' คัน (' + ownCars(TRIP_1).map(i => TRIP_CARS[i][0]).join(', ') + ') ระหว่างวันที่ ' + TRIP_1.d1 + ' ถึง ' + TRIP_1.d2 + ' ที่ ' + tripLoc(ownCars(TRIP_1)[0], TRIP_1.locs), '10 นาทีที่แล้ว'];
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
const npKv = (job) => [   // 5 พ.ย. 2569 ภาค สรุปจากรถในแผน
  ['ชื่อแผน', NP[1]], ['ปีงบประมาณ', NP[8]], ['หน่วยงาน', PLAN_UNIT[NP[0]]], ['เขต', [...new Set(Object.keys(A_ALL).map(i => dCode(CAND[i])))].sort().join(', ')], ['ยานพาหนะรายไตรมาส', NP[9]], ['จำนวนยานพาหนะ', NP[4] + ' คัน'], ['เลขที่ MR', job || NP[0]], ['ผู้สร้างแผน', CREATOR], ['วันที่ส่ง', NP[6]]];
const VEH7 = CAND.map(c => [c[0], c[1], c[2], c[3], 'ready']);   // รถในแผนใหม่ = รถที่ติ๊กตอนสร้างแผน (ภาค 2 รถกระเช้า)
const REVIEW_COLS = [['ชื่อแผน', 0, 'Lead text', 'Swap'], ['ปีงบประมาณ', 120], ['ผู้สร้าง', 180], ['ภาค / ประเภทยานพาหนะ', 200], ['จำนวนยานพาหนะ', 100], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 150, 'Badge'], ['', 60]];
const reviewRow = (p) => [p[1], p[8], { text: 'นายวิชัย ทองดี', sub: PLAN_UNIT[p[0]] || UNITS[0] }, scopeCell(p), p[4] + ' คัน', p[6], { pill: PST[p[5]] }, GO];
const REVIEW_ROWS = [NP, PLANS[2], PLANS[3]];
const PART_CHECK_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['ตามแผน', 110], ['หน่วย', 90], ['คงเหลือในคลัง', 140], ['ต้องซื้อเพิ่ม', 140]];
const partCheckRows = () => PARTS.map((p, i) => [p[0], p[1], p[3], p[4], p[5], shortOf(i) ? String(shortOf(i)) : '-']);
async function planBody(o) {   // เนื้อหน้ารายละเอียดแผน ใช้ทั้งฝั่งผู้อนุมัติ (S2) และผู้สร้างแผน (S1 S19 S20 · มุม กบค.) · อะไหล่ในแผนขึ้นทุกหน้า · o.pq = แท็บ (0 รวมทุกไตรมาส) · สถานะคลังรับทราบ (o.wh) ตัดพร้อม S22 6 พ.ย. 2569
  o = o || {};
  const inPlan = Object.keys(A_ALL).map(Number);   // รถในแผนใหม่ = ที่จัดลงไตรมาสตอนสร้างแผน (S1)
  // เจ้าของงาน 2 พ.ย. 2569 "อยากให้ข้อมูลที่แสดงเป็นข้อมูลรถ" ⇒ รถแยกแท็บไตรมาส คอลัมน์เดียวกับ section รถในไตรมาสของ S1 ไม่มีไอคอน (ดูอย่างเดียว) · ไม่มีตารางอะไหล่ทั้งปี
  const q1 = inPlan.filter(i => A_ALL[i] === 1), n = (i) => (A_PICKS[i] || []).length;
  return [await vehicleInfo(npKv(), 'รายละเอียดแผน'),
    // 5 พ.ย. 2569 ชีตลูกค้า: ปุ่มไปหน้าไตรมาสต้องมีทั้งแผน อนุมัติแล้ว และ ดำเนินการ (เดิมมีเฉพาะ planDetailQ ดำเนินการ) · o.qBtn
    col('Section', [await sectionLabel('ยานพาหนะในแผน', { badge: inPlan.length, buttons: o.qBtn ? [Q_BTN] : [] }), await tabs(QUARTERS.map((t, k) => [t, inPlan.filter(i => A_ALL[i] === k + 1).length]), 0),
      await tblShort(CARP_COLS.slice(0, 6), q1.map(i => [CAND[i][0], CAND[i][1], CAND[i][2], OIL_OPTS[(A_PICKS[i] || []).indexOf(0) >= 0 ? 1 : 0], lastOil(CAND[i][0]), n(i) ? n(i) + ' รายการ' : A_DRAW[i] ? 'ไม่เบิกอะไหล่' : 'ยังไม่เลือก']))], 16)]
    .concat([await planPartsSec(o.pq || 0)]);   // อะไหล่ในแผน ทุกหน้ารายละเอียดแผน · 9 พ.ย. 2569 เจ้าของงานส่งภาพ A.20 A.21 A.22 A.32 ที่มีหัวข้ออะไหล่ "ทำให้เป็นแบบนี้" (ยกเลิกที่เคาะเช้า "หน้าผู้สร้าง … ไม่ต้องมี มีแค่ผู้อนุมัติ")
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
async function planPartsSec(q, rowsOf) {   // rowsOf = ยอดรายแท็บของแผนอื่น (ค่าเริ่ม planQParts = แผน NP) · E.2 ใช้ pQParts ของแผน P
  const rows = (rowsOf || planQParts)(q);
  const sec = col('Section', [await sectionLabel('อะไหล่ในแผน'), await tabs([['รวมทุกไตรมาส', null]].concat(QUARTERS.map(t => [t, null])), q)], 16); // 9 พ.ย. 2569 เจ้าของงาน "เอาเลขออกไปเลยได้ป่ะ ถ้าหมายถึงจำนวนชนิด" ⇒ หัวข้ออะไหล่รวมตามรายการไม่มีตัวเลขจำนวนชนิด
  if (rows.length) add(sec, await tblShort(QPART_COLS, rows), 'h');
  else add(sec, await noParts(q ? Q_PARTS_EMPTY : ALL_Q_PARTS_EMPTY), 'h');   // ข้อความชุดเดียวกับหัวข้ออะไหล่ในไตรมาส n ของหน้าไตรมาส
  return sec;
}
/* อนุมัติสำเร็จ (5 พ.ย. 2569 รีวิว): "แสดง Toast ด้านบนขวา · ไม่ต้องแสดง Alert อนุมัติแผนแล้ว ซ้ำ ให้แสดงแค่ Toast · สถานะ รออนุมัติ > อนุมัติแล้ว · Section ผลการพิจารณา หายไป" ⇒ o.status = 'approved' ไม่มี Alert ไม่มีส่วนผลการพิจารณาและแถวปุ่ม */
async function planReview(name, o) {
  o = o || {};
  const done = o.status === 'approved';
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนบำรุงรักษา', back: true, crumbs: ['แผนรออนุมัติ', NP[1]], badge: PST[o.status || 'review'] });
  const d = done ? null : await decisionSection(o, 'แผนผ่านการตรวจสอบ หน่วยงานเริ่มงานรายไตรมาสได้', 'แจ้งเหตุผลให้ผู้สร้างแผนแก้ไขแล้วส่งใหม่');
  const nodes = (d ? [d.dec] : []).concat(await planBody({ pq: o.pq }));
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
const RETURN_REASON = 'จำนวนไส้กรองไฮโดรลิกไม่ตรงกับรอบบำรุงรักษาของกระเช้าแก้ไฟ กรุณาตรวจสอบยานพาหนะที่เลือกเข้าแผน';
const ALERT_RETURNED = ['Error', 'ผู้อนุมัติส่งกลับให้แก้ไข', RETURN_REASON];
const ALERT_APPROVED = ['Warning', 'แผนนี้อนุมัติแล้ว', 'เมื่อบันทึก แผนจะกลับเป็นสถานะรออนุมัติ และต้องให้ผู้อนุมัติตรวจสอบอีกครั้ง'];
/* S21 จัดการอะไหล่ของรถ (หน้าแยก · section น้ำมันไฮโดรลิก + อะไหล่อื่นๆ · ปรับ 5 พ.ย. 2569 เจ้าของงาน "อยากให้จัดการสิ่งที่ต้องทำของรถแต่ละคัน เช่น รถตันนี้ ต้องเปลี่ยนน่ำมันไฮดรอลิก
   รถตันนี้ต้องเก็บตัวอย่างน้ำมันไฮดรอลิก น้ำมันเบอร์อะไร รหัสอะไร ใช้กี่ลิตร ต้องเปลี่ยนใส้กรอง ระบุ ชื่อ ยี่ห้อกรอง รุ่นกรอง รหัสกรอง เป็นต้น")
   เข้าจากไอคอนแก้ไขที่แถวรถในแท็บไตรมาส n ของฟอร์ม S1/S19 · น้ำมันไฮโดรลิก = Radio text card 3 ใบ (JOB_OIL_OPTS แบบหน้างานรายคัน S10) + Input dropdown เบอร์น้ำมัน · Text input รหัส · จำนวน (ลิตร) · เปลี่ยนล่าสุด Readonly
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
async function carWarehouse(picked) {   // คลังอะไหล่ของงานซ่อม (PartsInventoryPanel) เฉพาะไส้กรองและอะไหล่ (ไม่รวมน้ำมันไฮโดรลิกที่มีส่วนของตัวเอง) · ไม่มี component / มือถือ = ไม่มีแผง
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
async function carPartsScreen(name, o) {
  o = o || {};
  const car = CAND[0];
  const { scr, page } = await shell(name, { title: 'จัดการอะไหล่ของยานพาหนะ ' + car[0], back: true, crumbs: ['สร้างแผน', 'จัดการอะไหล่ของยานพาหนะ'] });
  const f = dropdown('ยานพาหนะ', car[0], { placeholder: 'เลือกยานพาหนะในไตรมาสนี้', lead: 'search-24-300-round', state: o.carOpen ? 'Focused' : undefined });
  const k = o.oil == null ? 0 : o.oil;   // ค่าเริ่มต้นเก็บตัวอย่าง (S21 เดิม) · 0 เก็บตัวอย่าง · 1 เปลี่ยนน้ำมัน · 2 เก็บตัวอย่างและเปลี่ยน
  const oil = await radioPick('น้ำมันไฮโดรลิก', JOB_OIL_OPTS, k);
  const sp = o.oilSpec || {};
  const grade = dropdown('เบอร์น้ำมัน', sp.grade || '', { placeholder: 'เลือกเบอร์น้ำมัน', state: o.gradeOpen ? 'Focused' : undefined });
  const fields = [grade, field('รหัสน้ำมัน', sp.code, { placeholder: 'ระบุรหัสน้ำมัน' }), field('จำนวน (ลิตร)', sp.litre, { placeholder: '0' })];
  if (k === 1 || k === 2) add(oil, row('Row', fields), 'h');   // เบอร์ รหัส ลิตร เมื่อเปลี่ยนน้ำมัน
  const last = field('เปลี่ยนน้ำมันครั้งล่าสุด', lastOil(CAND[0][0]), { state: 'Readonly' });
  add(oil, MOB ? last : row('Row', [last, frame('Spacer', 'VERTICAL'), frame('Spacer', 'VERTICAL')]), 'h');
  const picked = (o.picked || []).filter(i => i !== 0);
  /* 6 พ.ย. 2569 เจ้าของงาน "อยากเพิ่มการเบิก โดยอยากให้มีการเลือกว่า ว่าเบิกอะใหล่ หรือไม่เบิก ด้วย" + "บังคับให้กรอกอะใหล่ทุกคัน"
     ⇒ Radio text card 2 ใบ "การเบิกอะไหล่" แบบผลการพิจารณา (decisionSection) · ไม่มีค่าเริ่มต้น ต้องเลือกเอง · ไม่เบิก = ซ่อนคลังอะไหล่และรายการอะไหล่อื่นๆ คันนี้ไม่รวมในอะไหล่ในไตรมาส
     ปุ่ม "บันทึกอะไหล่ของรถ" กดได้เมื่อเลือกไม่เบิก หรือเลือกเบิกแล้วมีอะไหล่อย่างน้อย 1 รายการ · o.draw = 'take' | 'none' (เลือกอะไหล่แล้ว = เบิก) */
  const dsel = o.draw === 'none' ? 1 : (o.draw === 'take' || picked.length || (o.manual && o.manual.filled)) ? 0 : -1;
  const drawSec = await radioPick('การเบิกอะไหล่', [['เบิกอะไหล่', 'เลือกอะไหล่ที่ต้องเบิกให้ยานพาหนะคันนี้'], ['ไม่เบิกอะไหล่', 'ยานพาหนะคันนี้ไม่ใช้อะไหล่จากการเบิก']], dsel, { label: true });
  const canSave = dsel === 1 || (dsel === 0 && (picked.length > 0 || !!(o.manual && o.manual.filled)));
  const rows = picked.map(i => [PARTS[i][0], PART_BM[i][0], PART_BM[i][1], PARTS[i][1], String(CAR_QTY[i]), PARTS[i][4], { icons: ['stylus-24-300-round', 'delete-24-300-round'] }])
    .concat(o.manual && o.manual.filled ? [[MANUAL.name, MANUAL_BM.brand, MANUAL_BM.model, MANUAL.code || '-', String(MANUAL.qty), MANUAL_BM.unit, { icons: ['stylus-24-300-round', 'delete-24-300-round'] }]] : []);
  const list = col('Section', [await section('อะไหล่อื่นๆ', { badge: rows.length || null, buttons: [{ kind: 'Secondary button', text: 'ระบุอะไหล่เพิ่มเติม', icon: 'add-24-300-round' }] })], 16);
  add(list, rows.length ? await tblShort(CARP_PART_COLS, rows) : await noParts('เลือกไส้กรองหรืออะไหล่อื่นจากคลัง หรือกดระบุอะไหล่เพิ่มเติม'), 'h');
  add(page, col('Content', [MOB ? f : row('Row', [f, frame('Spacer', 'VERTICAL')]), drawSec, oil].concat(dsel === 0 ? [await carWarehouse(picked), list] : [], [
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกอะไหล่ของยานพาหนะ', { size: 'lg', disabled: !canSave }]])]), 32), 'h');
  if (o.carOpen) comboAt(scr, f.findOne(n => n.name === 'Container') || f, Q_CARS.map(i => [CAND[i][0], '', i === 0]));
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
  const kv = [['ทะเบียน', car[0]], ['ยี่ห้อ/รุ่น', car[1]], ['หน่วยงานเจ้าของยานพาหนะ', car[2]], ['ไตรมาส', 'ไตรมาส ' + ((o.alloc || A_ALL)[i] || '-')],
    ['น้ำมันไฮโดรลิก', oil == null ? TODO_NONE : JOB_OIL_OPTS[oil] + (oil ? ' · ' + OIL_SPEC.grade + ' · ' + OIL_SPEC.litre + ' ลิตร' : '')], ['เปลี่ยนน้ำมันครั้งล่าสุด', lastOil(car[0])], ['การเบิกอะไหล่', none ? 'ไม่เบิกอะไหล่' : 'เบิกอะไหล่']];
  const rows = none ? [] : picks.filter(x => x !== 0).map(x => [PARTS[x][0], PART_BM[x][0], PART_BM[x][1], PARTS[x][1], String(CAR_QTY[x]), PARTS[x][4]]);
  const list = col('Section', [await sectionLabel('อะไหล่อื่นๆ (' + rows.length + ')')], 16);
  add(list, rows.length ? await tblShort(CARP_PART_COLS.slice(0, 6), rows) : await noParts(none ? 'ยานพาหนะคันนี้เลือกไม่เบิกอะไหล่' : 'ยังไม่ได้กำหนดอะไหล่ของยานพาหนะคันนี้'), 'h');
  add(page, col('Content', [await vehicleInfo(kv, 'ข้อมูลยานพาหนะ'), list], 32), 'h');
  return scr;
}
const Q_OUT_CONFIRM = (c, q) => ({ danger: true, title: 'ยืนยันการเอายานพาหนะออกจากไตรมาส ' + q, sub: c[0] + ' จะกลับเป็นยังไม่จัด ต้องจัดลงไตรมาสอีกครั้งก่อนบันทึกและส่งอนุมัติ', cancel: 'ยกเลิก', ok: 'เอาออก' });   // แบบ Q_REMOVE_CONFIRM ของหน้าไตรมาส
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
async function planDetail(name, o) {   // หน้ารายละเอียดแผนฝั่ง กบค. · ก่อนอนุมัติมี ลบแผน + แก้ไข · อนุมัติแล้วเหลือแก้ไข · o.readonly = ไม่มีปุ่ม (เหลือกรณีเดียว: กบค. ดูแผนของหน่วยงานอื่น — กฎสิทธิ์ ไม่ใช่กฎสถานะ · Q53 ปิดแล้ว 10 พ.ย. 2569 รออนุมัติมีปุ่มลบและแก้ไข ทับมติ 5 พ.ย.) · มีอะไหล่ในแผนทุกสถานะ (planBody · 9 พ.ย. 2569)
  o = o || {};
  const st = o.status || 'review';
  let actions = [['Secondary button', 'แก้ไข', 'stylus-24-300-round']];
  if (st !== 'approved') actions.unshift(['Secondary danger button', 'ลบแผน', 'delete-24-300-round']);
  if (o.readonly) actions = null;
  const { scr, page } = await shell(name, { title: 'เลขที่ ' + NP[0], back: true, crumbs: [NP[1]], badge: PST[st], actions });
  const nodes = await planBody({ qBtn: st === 'approved' || st === 'active' });
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
async function planDetailQ(name) {
  const counts = P_COUNTS;
  const { scr, page } = await shell(name, { title: 'เลขที่ ' + P[0], back: true, crumbs: [P[1]], badge: PST.active });
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
      alertBox('Warning', 'ต้องซื้อเพิ่ม 2 รายการ รวม ' + baht(PO_TOTAL), 'ไส้กรองไฮโดรลิก 9 ชิ้น · ไส้กรองเชื้อเพลิง 14 ชิ้น')], 16),
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

/* ---------- S13 หน่วยงาน/เจ้าของรถ ยอมรับผลรายคัน · S14 ทั้งแผน + ประเมินความพึงพอใจ ---------- */
const ACC_COLS = [['ทะเบียน / แผน', 0, 'Lead text'], ['วันที่บำรุง', 140], ['ผู้ทำ', 220], ['เลขที่ MR', 140], ['สถานะ', 200, 'Badge'], ['', 60]];
const ACC_PLAN = ['ทั้งแผน (' + P[4] + ' คัน)', '04–12/11/2569', 'ดำเนินการเอง', P[0]];
const accRows = (o) => {
  o = o || {};
  const cars = [0, 1, 4].map((i, k) => [VEH[i][0], '0' + (4 + k) + '/11/2569', TRIP.staff[k] + ' (' + UNITS[0] + ')', P[0], { pill: (o.accepted || []).indexOf(k) >= 0 ? ACC.ok : ACC.wait }, GO]);
  if (o.plan) cars.unshift([ACC_PLAN[0], ACC_PLAN[1], ACC_PLAN[2], ACC_PLAN[3], { pill: o.plan === 'done' ? ['ยอมรับผลทั้งแผนแล้ว', 'Success'] : ['ครบทุกคันแล้ว รอตรวจหลักฐาน', 'Warning'] }, GO]);
  return cars;
};
async function carResult(name, o) {   // รายการตรวจบำรุงรถรายคัน (ฝั่งหน่วยงาน) — ใบตรวจ 2 ใบ + ภาพ + อะไหล่ที่ใช้จริง · กรณีบำรุงรักษาไม่ได้แสดงสาเหตุ
  o = o || {};
  const car = o.cannot ? VEH[2] : V;
  const { scr, page } = await shell(name, { title: 'ผลการตรวจบำรุงยานพาหนะ · ' + car[0], back: true, crumbs: ['รอตรวจสอบ', car[0]], badge: o.cannot ? WSTAT.cannot : ACC[o.ok ? 'ok' : 'wait'] });
  const nodes = [await vehicleInfo([['ทะเบียน', car[0]], ['ยี่ห้อ/รุ่น', car[1]], ['หน่วยงานเจ้าของยานพาหนะ', car[2]], ['เลขที่ MR', P[0]], ['วันที่บำรุง', '04/11/2569'], ['ผู้ทำ', TRIP.staff[0] + ' (' + UNITS[0] + ')']], 'ข้อมูลยานพาหนะ')];
  if (o.cannot) nodes.push(col('Section', [await sectionLabel('สาเหตุที่บำรุงรักษาไม่ได้'), kv([['สาเหตุ', 'ยานพาหนะติดภารกิจซ่อมสายส่งฉุกเฉิน ไม่อยู่ที่หน่วยงานในวันนัด'], ['ผู้บันทึก', TRIP.staff[0] + ' (' + UNITS[0] + ')'], ['วันที่บันทึก', '05/11/2569']])], 16),
    alertBox('Warning', 'ใช้ฟอร์มเดียวกับคันที่บำรุงรักษาได้หรือแยก ยังไม่เคาะ (Q19)', 'จอนี้แสดงสาเหตุจาก S10 แล้วให้ยอมรับรับทราบ'));
  else nodes.push(col('Section', [await sectionLabel('เอกสารการตรวจบำรุงยานพาหนะ (2)'), await upload('ใบตรวจสภาพอะไหล่ · ใบตรวจสภาพงานบำรุงรักษา', [pdf('ใบตรวจสภาพอะไหล่-' + car[0].split(' ')[0] + '.pdf', '380 KB'), pdf('ใบตรวจสภาพงานบำรุงรักษา-' + car[0].split(' ')[0] + '.pdf', '410 KB')], { readonly: true })], 16),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tblShort(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16));   // ภาพตอนจบงานเอาออก 4 พ.ย. 2569 ให้ตรงกับหน้าปิดงาน
  if (o.ok) nodes.push(alertBox('Success', 'ยอมรับผลการตรวจบำรุงยานพาหนะแล้ว 06/11/2569', 'รอคันอื่นในแผนครบแล้วจึงตรวจหลักฐานทั้งแผน (S14)'));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยอมรับผลการตรวจบำรุงยานพาหนะ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
/* ประเมินความพึงพอใจ — ยืม RepairFeedback (คะแนนประเมินคุณภาพงานซ่อมบำรุงของงานซ่อม: Section header + Radio text card 1–5) · เจ้าของงานเลือก 22 ต.ค. 2569
   การประเมินเกิดตอนบำรุงรักษาครบทุกคันตามแผน ก่อนกดยอมรับผลทั้งแผน (S14) · ไม่มี/mobile → Section header + Radio text card ของไลบรารี */
async function feedback(score) {
  const title = 'คะแนนประเมินความพึงพอใจงานบำรุงรักษา', sub = 'ให้คะแนน 1–5 · 1 ต้องปรับปรุงมาก · 5 ดีมาก';
  if (!MOB && has('RepairFeedback')) {
    const f = inst('RepairFeedback'); f.name = 'RepairFeedback';
    const sh = find(f, 'Section header'); if (sh) { setProps(sh, { Title: title, 'Supporting text': true, Badge: false, Actions: false, 'More actions': false }); await text(sh, 'Supporting text', sub); }
    f.findAll(n => n.type === 'INSTANCE' && n.name === 'Radio text card').forEach(c => {
      const t = c.findOne(x => x.type === 'TEXT' && x.name === 'Text');
      const n = t ? +t.characters : NaN;
      setProps(c, { Selected: score && n === score ? 'True' : 'False', Supporting: false });
    });
    return f;
  }
  const r = MOB ? frame('Radio', 'HORIZONTAL', { gap: 8 }) : row('Radio', [], { gap: 16 });
  [1, 2, 3, 4, 5].forEach(n => { const c = inst('Radio text card', { State: 'Default', Selected: n === score ? 'True' : 'False' }, { Text: String(n), Supporting: false }); r.appendChild(c); c.layoutGrow = 1; });
  const sh = await section(title);
  return col('Section', [sh, r], 16);
}
async function planEvidence(name, o) {   // เอกสารหลักฐานการตรวจบำรุงรถทั้งแผน + ประเมินความพึงพอใจ + ยอมรับผลทั้งแผน
  o = o || {};
  const { scr, page } = await shell(name, { title: 'หลักฐานการตรวจบำรุงยานพาหนะ · ' + P[0], back: true, crumbs: ['รอตรวจสอบ', P[0]], badge: o.done ? ['ยอมรับผลทั้งแผนแล้ว', 'Success'] : ['ครบทุกคันแล้ว', 'Warning'] });
  const nodes = [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('สรุปรายคัน', { badge: 3 }), await tblShort([['ทะเบียน', 170, 'Lead text'], ['ใบตรวจสภาพอะไหล่', 0], ['ใบตรวจสภาพงานบำรุงรักษา', 0], ['การยอมรับรายคัน', 200, 'Badge']],
      [0, 1, 4].map(i => [VEH[i][0], 'ใบตรวจสภาพอะไหล่-' + VEH[i][0].split(' ')[0] + '.pdf', 'ใบตรวจสภาพงานบำรุงรักษา-' + VEH[i][0].split(' ')[0] + '.pdf', { pill: ACC.ok }]), { pagination: 3 })], 16),
    await feedback(o.score || 0),
    area('ข้อเสนอแนะเพิ่มเติม', o.score ? 'ทีมงานตรงเวลา ทำความสะอาดพื้นที่หลังเสร็จงาน' : '', { optional: true, placeholder: 'ระบุข้อเสนอแนะ' })];
  if (o.done) nodes.push(alertBox('Success', 'ยอมรับผลการตรวจบำรุงยานพาหนะทั้งแผนแล้ว 14/11/2569', 'แจ้งหน่วยงานแล้ว — ส่งประวัติให้หัวหน้าหน่วยงาน ได้ (S15)'));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยอมรับผลการตรวจบำรุงยานพาหนะ', { size: 'lg', disabled: !o.score }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S16 หัวหน้าหน่วยงาน ตรวจสอบประวัติงานบำรุงรักษา ---------- */
const HST = { wait: ['รอหัวหน้าตรวจสอบ', 'Warning'], ok: ['ผ่านแล้ว', 'Success'], back: ['ตีกลับ', 'Error'] };
const HQ_COLS = [['เลขที่ MR', 140, 'Lead text'], ['แผน', 0], ['ผู้ส่ง', 200], ['จำนวนยานพาหนะ', 110], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 180, 'Badge'], ['', 60]];
const hqRows = (st) => [[P[0], P[1], 'นายวิชัย ทองดี', P[4] + ' คัน', '12/11/2569', { pill: HST[st] }, GO], ['MRZ6900011', PLANS[4][1], 'นางสาวกนกวรรณ ใจมั่น', '10 คัน', '28/06/2569', { pill: HST.ok }, GO]];
async function headHistory(name, o) {   // หน้าเดียวกับ S15 (Display) + ปุ่มตีกลับ/อนุมัติ
  o = o || {};
  const { scr, page } = await shell(name, { title: 'หมายเลขแผน ' + P[0], back: true, crumbs: ['ประวัติรอตรวจสอบ', P[0]], badge: HST[o.st || 'wait'] });
  const total = +P[4];
  const nodes = [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ความคืบหน้ารายคัน'), kv([['บำรุงรักษาแล้ว', total + ' / ' + total + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['หน่วยงานยอมรับแล้ว', total + ' คัน'], ['ผู้ส่ง', CREATOR + ' · 12/11/2569']])], 16),
    col('Section', [await sectionLabel('ประวัติงานบำรุงรักษาทั้งหมด', { badge: total }), await tblShort(HIST_COLS, HIST, { pagination: total })], 16)];
  if (o.st === 'ok') nodes.push(alertBox('Success', 'อนุมัติประวัติแล้ว 13/11/2569 — บันทึกเป็นประวัติทางการ', 'หน่วยงานออกรายงานผลและปิดงานได้ (S17)'));
  else nodes.push(btnRow([['Secondary button', 'ตีกลับ', { size: 'lg' }], ['Primary button', 'อนุมัติประวัติ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

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
const MOVE_T3 = moveTrip(2, '12/05/2570', '14/05/2570'), MOVE_T4 = moveTrip(3, '07/07/2570', '09/07/2570');   // กรณีรถคันเดียวกันบำรุงรักษาไม่ได้ในไตรมาส 3 / 4
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
  const m = menuAt(scr, cells[row], [MOVE_ITEM]);
  if (!m) return null;   // มือถือ: ปุ่มอยู่บนการ์ดแล้ว (moveCard)
  const list = (find(m, 'Menu items') || m).children;
  if (list[3]) list[3].visible = false;   // เมนูเดียว ⇒ ซ่อนเส้นคั่น (แบบ planMenu)
  if (off && list[0]) setProps(list[0], { State: 'Disabled' });
  return m;
}
function moveCard(scr, row, off) {   // มือถือ: ช่องท้ายการ์ดของแถว row → Style=Action buttons ปุ่มเดียว "ย้ายไปไตรมาสอื่น"
  const box = scr.findOne(n => n.type === 'FRAME' && n.name === 'Mobile table');
  const card = box && box.children[row]; if (!card) return;
  const it = card.children.filter(c => c.name === 'Mobile table item').pop(); if (!it) return;
  setProps(it, { Style: 'Action buttons' });
  setProps(it, { 'Action 2': false, 'Action 3': false, 'Action 4': false });
  const b = it.findAll(n => n.type === 'INSTANCE' && n.name === 'Secondary button')[0];
  if (b) setProps(b, { Text: MOVE_ITEM[0], 'Leading icon': true, 'Leading icon swap': icon(MOVE_ICON), 'Trailing icon': false, State: off ? 'Disabled' : 'Default' });
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
const SCENARIOS = [
  /* S1 ปรับ 5 พ.ย. 2569 (รีวิวทีมออกแบบ + เจ้าของงานเลือกแบบ A): รายการว่าง · ปุ่มสร้างแผนขวาของตัวกรอง · เลือกภาค เขต ประเภทรถ แล้วเห็นรถทุกคันของพื้นที่ · ติ๊กแล้วจัดลงไตรมาสผ่าน popup
     · เอาพื้นที่/ตัวกรองออกรถที่จัดแล้วไม่หาย · Validation Out of focus · รายละเอียดแผนหลังส่งอนุมัติ 3 สถานะ
     · ค่ำ 5 พ.ย. 2569 (R77): ภาค เขต ประเภทรถ อยู่ในแผงตัวกรองของ Table header — A.5 แผงตัวกรองยังไม่เลือก · A.6 เลือกภาค 1 + กฟน.2 กฟน.1 ในแผง (รายการเขตเปิด) · A.7 กดตกลงแล้ว ตารางรถ + ชิป
       (รหัส A.1–A.27 ไม่เลื่อน · A.5 A.6 A.7 เปลี่ยนชื่อ) */
  ['S1 · หน่วยงาน สร้างแผนบำรุงรักษาประจำปี และจัดยานพาหนะลงไตรมาส', [
    ['รายการแผน', () => listScreen('S1 รายการแผน', { rows: ownPlans(UNITS[0]) })],
    ['รายการแผน — ยังไม่มีแผน', () => listScreen('S1 รายการว่าง', { empty: true })],
    ['ฟอร์มสร้างแผน (ว่าง)', () => planForm('S1 ฟอร์มสร้างแผน', {})],
    ['เลือกปีงบประมาณ — รายการปีเปิด', () => planForm('S1 เลือกปีงบประมาณ', { values: { name: FILLED.name }, yearOpen: true })],
    ['กดตัวกรอง — แผงตัวกรอง ยังไม่เลือกภาค เขต ประเภทยานพาหนะ', () => planForm('S1 แผงตัวกรอง', { values: FILLED, filter: {} })],
    ['เลือกภาค เขต ในแผงตัวกรอง — รายการเขตของภาคที่เลือก', () => planForm('S1 เลือกเขตในแผงตัวกรอง', { values: FILLED, filter: A_PANEL })],
    ['ยานพาหนะทั้งหมดของพื้นที่ที่เลือก — กดตกลงแล้ว ชิปตัวกรอง ยังไม่ติ๊ก', () => planForm('S1 ยานพาหนะทั้งหมด', { values: FILLED, regions: A_PANEL.regions, districts: A_PANEL.districts })],
    ['ค้นหาและกรองแล้ว', () => planForm('S1 ค้นหาและกรอง', { values: FILLED, regions: [REGIONS[1]], districts: ['กฟฉ.1'], query: '82-' })],
    ['ไม่พบยานพาหนะที่ตรงกับคำค้นหรือตัวกรอง', () => planForm('S1 ไม่พบยานพาหนะ', { values: FILLED, regions: [REGIONS[0]], types: [VTYPES[2]] })],
    ['ติ๊กยานพาหนะ 3 คัน — ปุ่มจัดลงไตรมาสกดได้', () => planForm('S1 ติ๊กยานพาหนะ', Object.assign({ values: FILLED, ticked: [0, 1, 2] }, R2))],
    ['กดจัดลงไตรมาส — popup เลือกไตรมาส', () => planForm('S1 popup จัดลงไตรมาส', Object.assign({ values: FILLED, ticked: [0, 1, 2], assign: { sel: 0 } }, R2))],
    ['จัดลงไตรมาสแล้ว — ป้ายไตรมาสในตาราง ตัวเลขบนแท็บเปลี่ยน', async () => { const s = await planForm('S1 จัดลงไตรมาสแล้ว', Object.assign({ values: FILLED, alloc: A_Q1 }, R2)); notify(s, 'จัดยานพาหนะ 3 คันลงไตรมาส 1 สำเร็จ'); return s; }],
    ['แท็บไตรมาส 1 — ทุกคันกำหนดแล้ว อะไหล่ในไตรมาสรวมครบ', () => planForm('S1 ไตรมาส 1', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, oils: A_OILS, draw: A_DRAW, q: 1 }, R2))],
    ['ย้ายยานพาหนะไปไตรมาสอื่น — ติ๊กยานพาหนะที่จัดแล้ว', () => planForm('S1 ย้ายไตรมาส', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, oils: A_OILS, draw: A_DRAW, q: 2, ticked: [5], assign: { sel: 2 } }, R2))],
    ['เอาภาคหรือตัวกรองออก — ยานพาหนะที่จัดแล้วยังอยู่ในไตรมาส', () => planForm('S1 เอาตัวกรองออก', { values: FILLED, alloc: A_ALL, picks: A_PICKS, regions: [REGIONS[0]] })],
    ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus', () => planForm('S1 Validation', { errors: true })],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await planForm('S1 ยืนยันการออก', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS }, R2)); await confirm(s, EXIT_CONFIRM('ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก')); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S1 บันทึกไม่สำเร็จ', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS }, R2)); notify(s, 'general error', true); return s; }],
    ['บันทึกและส่งอนุมัติสำเร็จ — รออนุมัติ', async () => { const s = await listScreen('S1 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(ownPlans(UNITS[0])) }); notify(s, 'ส่งแผนบำรุงรักษาเพื่ออนุมัติสำเร็จ'); return s; }],
    ['รายละเอียดแผน — รออนุมัติ มีปุ่มลบแผนและแก้ไข', () => planDetail('S1 รายละเอียด รออนุมัติ', { status: 'review' })],   // Q53 ปิดแล้ว 10 พ.ย. 2569 (เจ้าของงาน) — รออนุมัติลบและแก้ไขได้ ตรงกับจอ S19 S20 · เดิม readonly: true ตามมติ 5 พ.ย.
    ['รายละเอียดแผน — อนุมัติแล้ว', () => planDetail('S1 รายละเอียด อนุมัติแล้ว', { status: 'approved' })],
    ['รายละเอียดแผน — ส่งกลับแก้ไข เห็นเหตุผล กดแก้ไขไป S19', () => planDetail('S1 รายละเอียด ส่งกลับแก้ไข', { status: 'returned' })],
    // 5 พ.ย. 2569 เจ้าของงาน "ทำให้หน้า ไตรมาสยังไม่่มีรถสามารถเพิ่มรถจากจุดนี้ได้ด้วย" (R75) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['ไตรมาสที่ยังไม่มียานพาหนะ — ปุ่มเพิ่มยานพาหนะเข้าไตรมาส 3', () => planForm('S1 ไตรมาส 3 ยังไม่มียานพาหนะ', Object.assign({ values: FILLED, alloc: A_Q1, q: 3 }, R2))],
    ['กดเพิ่มยานพาหนะเข้าไตรมาส 3 — popup ยานพาหนะที่ยังไม่อยู่ในไตรมาสใด', () => planForm('S1 popup เพิ่มยานพาหนะเข้าไตรมาส 3', Object.assign({ values: FILLED, alloc: A_Q1, q: 3, qAdd: {} }, R2))],
    ['ติ๊กยานพาหนะ 2 คัน — ปุ่มเพิ่มเข้าไตรมาส 3 กดได้', () => planForm('S1 ติ๊กยานพาหนะเข้าไตรมาส 3', Object.assign({ values: FILLED, alloc: A_Q1, q: 3, qAdd: { ticked: Q3_ADD } }, R2))],
    ['เพิ่มยานพาหนะเข้าไตรมาส 3 แล้ว — แท็บไตรมาส 3 มียานพาหนะ ตัวเลขบนแท็บเปลี่ยน', async () => { const s = await planForm('S1 เพิ่มยานพาหนะเข้าไตรมาส 3 แล้ว', Object.assign({ values: FILLED, alloc: Object.assign({}, A_Q1, Object.fromEntries(Q3_ADD.map(i => [i, 3]))), q: 3 }, R2)); notify(s, 'จัดยานพาหนะ ' + Q3_ADD.length + ' คันลงไตรมาส 3 สำเร็จ'); return s; }],
    ['ทุกคันในพื้นที่จัดลงไตรมาสแล้ว — popup ไม่มียานพาหนะให้เพิ่ม', () => planForm('S1 popup ไม่มียานพาหนะให้เพิ่ม', Object.assign({ values: FILLED, alloc: A_FULL, q: 4, qAdd: {} }, R2))],
    /* 6 พ.ย. 2569 เจ้าของงาน "ต้องเอารถเข้า ไตรมาสทุกคัน" + "บังคับให้กรอกอะใหล่ทุกคัน ไปหน้าต่อไปไม่ได้" (แบบ ก หน้าเดียว) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน */
    ['ยานพาหนะในตารางยังจัดลงไตรมาสไม่ครบ คันที่จัดกำหนดอะไหล่ครบแล้ว — ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', () => planForm('S1 ยังจัดไม่ครบ', Object.assign({ values: FILLED, alloc: A_PART, picks: A_PICKS, oils: A_OILS, q: 0 }, R2))],   // 9 พ.ย. 2569 ค่ำ เจ้าของงาน (ภาพหน้าแก้ไขแผน แท็บทั้งหมดมียานพาหนะ "ยังไม่จัด" แต่ปุ่มกดได้) _"ยังจัดอะใหล่ไม่เสร็จ ปุ่มอนุมัติต้อง disable"_ + เคาะ "ยานพาหนะในตารางต้องจัดครบ" (เดิม 9 พ.ย. บ่าย "จัดบางคัน อะไหล่ครบ — กดได้")
    // เดิม 9 พ.ย. บ่าย: ไม่ต้องจัดครบทุกคันของหน่วยงานแล้ว (เดิม "ยังมียานพาหนะไม่ได้จัดลงไตรมาส — กดไม่ได้")
    ['ยานพาหนะที่จัดลงไตรมาสยังกำหนดอะไหล่ไม่ครบ — ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', () => planForm('S1 อะไหล่ยังไม่ครบ', Object.assign({ values: FILLED, alloc: A_ALL, picks: { 0: CAR_PICK }, oils: { 0: 1 }, q: 1 }, R2))],
    ['ยานพาหนะที่จัดลงไตรมาสกำหนดอะไหล่ครบทุกคัน — ปุ่มบันทึกและส่งอนุมัติกดได้', () => planForm('S1 ครบทุกคัน', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, oils: A_OILS, draw: A_DRAW, q: 2 }, R2))],
    /* 6 พ.ย. 2569 เจ้าของงาน "กบค แค่เห็นแผนทั้งหมด" ⇒ รายการแผนทุกหน่วยงาน ไม่มีปุ่มสร้างแผน · เมนู … เหลือดูรายละเอียด · รายละเอียดแผนไม่มีปุ่ม (แบบ R30 ของ Overhaul ซ่อนปุ่มที่ทำไม่ได้) */
    ['กบค. — รายการแผนทุกหน่วยงาน สร้างแผนได้ แผนหน่วยงานอื่นดูอย่างเดียว', () => listScreen('S1 กบค. รายการแผน', { rows: [NEW_PLAN].concat(allPlans()), view: 'กบค.' })],
    // 9 พ.ย. 2569 เจ้าของงาน "A32 ต้องมี section อะใหล่เพิ่มเข้ามาด้วย เพราะตอนที่ หน้าอนุมัติก็ต้องมี section นี้ขึ้นมาด้วย" ⇒ อะไหล่ในแผนชุดเดียวกับ S2 (มาจาก planBody เหมือนทุกหน้ารายละเอียดแผน)
    ['กบค. — รายละเอียดแผนของหน่วยงานอื่น ดูอย่างเดียว', () => planDetail('S1 กบค. รายละเอียดแผน', { status: 'approved', readonly: true })],
    // 6 พ.ย. 2569 (ต่อท้าย A.33–A.37) เมนู … ของยานพาหนะแต่ละคัน (ดูรายละเอียด แก้ไข ลบ) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน
    ['แท็บไตรมาส 1 — กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด แก้ไข ลบ', async () => { const s = await planForm('S1 เมนูของยานพาหนะ', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, oils: A_OILS, draw: A_DRAW, q: 1 }, R2)); planMenu(s, Q_MENU); return s; }],
    ['เมนู … → ดูรายละเอียด — อะไหล่ของยานพาหนะคันนี้ ดูอย่างเดียว', () => carPartsView('S1 ดูอะไหล่ของยานพาหนะ', 0)],
    ['เมนู … → ลบ — ยืนยันเอายานพาหนะออกจากไตรมาส', async () => { const s = await planForm('S1 ยืนยันเอาออกจากไตรมาส', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, oils: A_OILS, draw: A_DRAW, q: 1 }, R2)); await confirm(s, Q_OUT_CONFIRM(CAND[0], 1)); return s; }],
    ['เอาออกแล้ว — ยานพาหนะกลับเป็นยังไม่จัด ปุ่มบันทึกและส่งอนุมัติกดไม่ได้', async () => { const al = Object.assign({}, A_ALL); delete al[0]; const s = await planForm('S1 เอาออกจากไตรมาสแล้ว', Object.assign({ values: FILLED, alloc: al, picks: A_PICKS, oils: A_OILS, draw: A_DRAW, q: 1 }, R2)); notify(s, 'เอายานพาหนะออกจากไตรมาส 1 สำเร็จ'); return s; }],
    ['รายการแผน — กดตัวกรอง แผงตัวกรอง เขต หน่วยงานหน้างาน (กบค.)', () => listScreen('S1 กบค. ตัวกรองรายการแผน', { rows: [NEW_PLAN].concat(allPlans()), view: 'กบค.', filter: { units: ['กกฟ.1'], open: 'unit' } })],
    // 9 พ.ย. 2569 เจ้าของงาน "หน้าอะใหล่ทั้งไตรมาส ต้องรวมมาให้ด้วย ทั้งไตรมาส" — ต่อท้ายบล็อก (A.38) รหัสจอเดิมไม่เลื่อน
    ['แท็บทั้งหมด — อะไหล่รวมทุกไตรมาส รวมอะไหล่ของยานพาหนะทุกคันที่จัดลงไตรมาสแล้ว', () => planForm('S1 อะไหล่รวมทุกไตรมาส', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, oils: A_OILS, draw: A_DRAW }, R2))],
    // 9 พ.ย. 2569 เจ้าของงาน "ปรับให้มีการสร้าง ของ กรย และ กกฟ ทำ persona ของทั้ง 3 กองนนี้ โดยหน้ารวม เห็นไม่เหมือนกันคือ กกฟ1,2 และ กรย สร้างได้ และเห็นแค่ของตัวเองแต่ กบคจะเห็นของคนอื่นด้วย" — ต่อท้ายบล็อก (A.39 A.40) รหัสจอเดิมไม่เลื่อน · A.1 = กกฟ.1 · A.31 = กบค.
    ['กกฟ.2 — รายการแผน เห็นเฉพาะแผนของ กกฟ.2 สร้างแผนได้', () => listScreen('S1 กกฟ.2 รายการแผน', { rows: ownPlans('กกฟ.2') })],
    ['กรย. — รายการแผน เห็นเฉพาะแผนของ กรย. สร้างแผนได้', () => listScreen('S1 กรย. รายการแผน', { rows: ownPlans('กรย.') })]]],
  /* S2 ปรับ 5 พ.ย. 2569 (รีวิวทีมออกแบบ): ผลการพิจารณาบนสุด ไม่มีค่าเริ่มต้น · อนุมัติสำเร็จแสดงแค่ toast ขวาบน สถานะอนุมัติแล้ว ส่วนผลการพิจารณาหาย */
  ['S2 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนบำรุงรักษา', [
    ['รายการแผนรออนุมัติ', () => roleList('S2 แผนรออนุมัติ', { title: 'แผนรออนุมัติ', search: 'ค้นหาชื่อแผน, ผู้สร้าง', cols: REVIEW_COLS, rows: REVIEW_ROWS.map(reviewRow) })],
    ['รายละเอียดแผน — ผลการพิจารณา ยังไม่เลือก', () => planReview('S2 รายละเอียดแผน', {})],
    ['อนุมัติ — ยืนยันอนุมัติแผน', async () => { const s = await planReview('S2 ยืนยันอนุมัติ', { decision: 'approve' }); await confirm(s, { title: 'ยืนยันอนุมัติแผนบำรุงรักษา', sub: NP[1] + ' · ' + NP[4] + ' คัน · อนุมัติแล้ว ระบบแจ้งจำนวนอะไหล่ทั้งปีให้ Smart Inventory ทราบ (ยังไม่ตัดจากคลัง) และหน่วยงานเริ่มงานรายไตรมาสได้', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนสำเร็จ', async () => { const s = await planReview('S2 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนบำรุงรักษาสำเร็จ'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => planReview('S2 เลือกส่งกลับ', { decision: 'return' })],
    ['ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus', () => planReview('S2 ส่งกลับไม่ครบ', { decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await planReview('S2 ยืนยันส่งกลับ', { decision: 'return', reason: RETURN_REASON }); await confirm(s, { title: 'ยืนยันส่งกลับแก้ไข', sub: 'แผนจะกลับไปให้ผู้สร้างแผนแก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่', ok: 'ส่งกลับ' }); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await roleList('S2 ส่งกลับแล้ว', { title: 'แผนรออนุมัติ', search: 'ค้นหาชื่อแผน, ผู้สร้าง', cols: REVIEW_COLS, rows: [planAs('returned'), PLANS[2], PLANS[3]].map(reviewRow) }); notify(s, 'ส่งแผนกลับให้ผู้สร้างแผนแก้ไขแล้ว'); return s; }],
    ['อะไหล่ในแผน — เปิดแท็บไตรมาส 2', () => planReview('S2 อะไหล่ไตรมาส 2', { pq: 2 })]]],
  // S3 ผพจ. ออกเลขงานและจัดซื้ออะไหล่ — พักไว้ 30 ต.ค. 2569 (เจ้าของงาน "อนุมัติเลขงาน ไม่ต้องมีในระบบแล้ว แยกออกไปก่อน") · ฟังก์ชัน planIssue/headPartCheck/poForm คงไว้ · userflow ย้ายไป 14-…-พักไว้-S3.md
  /* S4 เดิม "ติดตามความคืบหน้าและเบิกอะไหล่ของไตรมาส" (partsProgress · เทียบคงเหลือ Smart Inventory + เบิก/จอง) เปลี่ยนเป็นแดชบอร์ด 6 พ.ย. 2569 (เจ้าของงาน "หน้าที่จาก smart inventory จะเปลี่ยนเป็นหน้าแดชบอร์ด")
     รหัสจอ C.1–C.6 เดิมถูกแทนด้วยจอแดชบอร์ด (ชื่อ state ใหม่) · อะไหล่รายไตรมาสย้ายไปหัวข้อ "อะไหล่ในไตรมาส n" ของหน้าไตรมาส (S6) */
  ['S4 · หน่วยงาน ดูอะไหล่และความคืบหน้าของแผนที่อนุมัติแล้ว (แดชบอร์ด)', [
    ['แท็บรวมตามรายการ — อะไหล่ทุกแผนที่อนุมัติแล้วในปีงบประมาณ 2570', () => partsDash('S4 รวมตามรายการ', {})],
    ['ค้นหาชื่ออะไหล่ หรือรหัสอะไหล่', () => partsDash('S4 ค้นหา', { query: 'FL-00' })],
    ['กดตัวกรอง — แผงตัวกรอง ปีงบประมาณ หน่วยงานผู้ขอเบิก เขต แผน', () => partsDash('S4 แผงตัวกรอง', { filter: { units: ['กกฟ.1'], open: 'plan' } })],
    ['กรองแล้ว — ชิปตัวกรองเหนือตาราง', () => partsDash('S4 กรองแล้ว', { chips: ['2570', 'กกฟ.1'] })],
    ['ไม่พบอะไหล่ที่ตรงกับคำค้นหรือตัวกรอง', () => partsDash('S4 ไม่พบ', { query: 'ไส้กรองแอร์', notFound: true })],
    ['แท็บแยกรายคัน — อะไหล่ของยานพาหนะแต่ละคัน', () => partsDash('S4 แยกรายคัน', { tab: 1 })],
    ['แท็บความคืบหน้าของแผน — แผนเดินทางและยานพาหนะที่บำรุงรักษาแล้วรายไตรมาส', () => partsDash('S4 ความคืบหน้า', { tab: 2 })],
    ['กดส่งออก — popup รูปแบบไฟล์ และข้อมูลที่ส่งออก', () => partsDash('S4 ส่งออก', { chips: ['2570', 'กกฟ.1'], exportPdf: true })],
    ['ส่งออกสำเร็จ', async () => { const s = await partsDash('S4 ส่งออกสำเร็จ', { chips: ['2570', 'กกฟ.1'] }); notify(s, 'ส่งออกไฟล์สำเร็จ'); return s; }],
    ['ไฟล์ PDF — รวมตามรายการ', () => dashPdf('S4 ไฟล์ PDF')],
    ['ไฟล์ Excel — ชีตรวมตามรายการ', () => dashXls('S4 ไฟล์ Excel รวม', 0)],
    ['ไฟล์ Excel — ชีตแยกรายคัน', () => dashXls('S4 ไฟล์ Excel รายคัน', 1)],
    ['ยังไม่มีแผนที่อนุมัติแล้ว', () => partsDash('S4 ว่าง', { empty: true })]]],
  // S5 เบิกอะไหล่ผ่านระบบจองอะไหล่ — รวมเข้า S4 2 พ.ย. 2569 (เจ้าของงาน "รวบ s4 s5 เป็นหน้าเดียวกัน ยุบ S5 ออกไปก่อน") · บล็อก D เว้นว่าง
  /* S6 ปรับ 5 พ.ย. 2569 (รีวิวทีมออกแบบ): ทางเข้าจากเมนูถึงหน้าไตรมาส (E.1–E.3) · หน้า E.3 = "ไตรมาส 1" · popup รถในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้ · เอารถออกจากแผนเดินทาง (soft delete) แล้วกลับมาเลือกได้
     · Validation Out of focus · สร้างสำเร็จกลับหน้าไตรมาส + toast · สร้างได้จนรถหมด แล้วปุ่มสร้างแผนเดินทางกดไม่ได้ (ตัด popup "รถทุกคันอยู่ในแผนเดินทางแล้ว") */
  ['S6 · หน่วยงาน ทำแผนเดินทาง (ดำเนินการเอง)', [
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
    ['กดเพิ่มยานพาหนะ — popup ยานพาหนะในแผนที่ยังไม่อยู่ในไตรมาส', async () => { const s = await tripList('S6 popup เพิ่มยานพาหนะเข้าไตรมาส', { trips: [] }); await qAddModal(s, [0]); return s; }],
    ['เพิ่มยานพาหนะเข้าไตรมาสแล้ว', async () => { const s = await tripList('S6 เพิ่มยานพาหนะเข้าไตรมาสแล้ว', { trips: [], added: [0] }); notify(s, 'เพิ่มยานพาหนะเข้า' + NOW_Q + ' สำเร็จ'); return s; }],
    ['กดไอคอนแก้ไข — แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษา', async () => { const s = await tripList('S6 แก้ไขยานพาหนะในไตรมาส', { trips: [] }); await tripCarEdit(s, 1, {}, {}); return s; }],
    ['กดไอคอนลบ — ยืนยันเอายานพาหนะออกจากไตรมาส', async () => { const s = await tripList('S6 ยืนยันเอายานพาหนะออกจากไตรมาส', { trips: [] }); await confirm(s, Q_REMOVE_CONFIRM(TRIP_CARS[1])); return s; }],
    ['เอายานพาหนะออกจากไตรมาสแล้ว', async () => { const s = await tripList('S6 เอายานพาหนะออกจากไตรมาสแล้ว', { trips: [], removed: [1] }); notify(s, 'เอายานพาหนะออกจาก' + NOW_Q + ' สำเร็จ'); return s; }],
    // 6 พ.ย. 2569 รีวิว S6 วันดำเนินการรายคัน (R83) — ต่อท้ายบล็อก รหัสจอเดิมไม่เลื่อน (E.24 E.25) · ส่งออกแผนเดินทางอยู่ท้าย S10 (I.27–I.32)
    ['เลือกวันดำเนินการ — ปฏิทินเลือกได้เฉพาะช่วงวันเดินทาง วันนอกช่วงกดไม่ได้', async () => { const s = await tripForm('S6 เลือกวันดำเนินการ', { values: TRIP_FILLED, sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES }); await tripCarEdit(s, 0, TRIP_PHONES, TRIP_LOCS, { trip: TRIP_DATES, pick: TRIP_WORKS[0] }); return s; }],
    ['บันทึกวันดำเนินการแล้ว — หลายคันวันเดียวกันได้ คันที่ไม่แก้คงทั้งช่วงวันเดินทาง', () => tripForm('S6 บันทึกวันดำเนินการแล้ว', { values: TRIP_FILLED, sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, works: TRIP_WORKS })]]],
  ['S7 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง', [
    ['รายการแผนเดินทางรออนุมัติ', () => tripReviewList('S7 รออนุมัติ', [TRIP_1, TRIP_V, TRIP_OTHER])],
    ['รายละเอียดแผนเดินทาง — ผลการพิจารณา ยังไม่เลือก', () => tripReview('S7 รายละเอียด', {})],   // 5 พ.ย. 2569 ตาม S2
    ['อนุมัติ — ยืนยันอนุมัติแผนเดินทาง', async () => { const s = await tripReview('S7 ยืนยันอนุมัติ', { decision: 'approve' }); await confirm(s, { title: 'ยืนยันอนุมัติแผนเดินทาง', sub: TRIP_1.name + ' · ' + TRIP_1.sel.length + ' คัน · อนุมัติแล้วระบบแจ้งเตือน กรย. และหน่วยงานเจ้าของยานพาหนะ', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนเดินทางสำเร็จ', async () => { const s = await tripReview('S7 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนเดินทางสำเร็จ'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => tripReview('S7 เลือกส่งกลับ', { decision: 'return' })],
    ['ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus', () => tripReview('S7 ส่งกลับไม่ครบ', { decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await tripReview('S7 ยืนยันส่งกลับ', { decision: 'return', reason: TRIP_RETURN }); await confirm(s, { title: 'ยืนยันส่งกลับแก้ไข', sub: 'แผนเดินทางจะกลับไปให้ผู้สร้างแผนเดินทางแก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่', ok: 'ส่งกลับ' }); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await tripReviewList('S7 ส่งกลับแล้ว', [TRIP_V, TRIP_OTHER]); notify(s, 'ส่งแผนเดินทางกลับให้ผู้สร้างแผนเดินทางแก้ไขแล้ว'); return s; }]]],
  ['S8 · กรย. และหน่วยงานเจ้าของยานพาหนะ ได้รับแจ้งเตือนแผนเดินทาง', [
    ['กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)', async () => { const s = await tripSeenList('S8 กรย. มีใหม่', false); bell(s, true); return s; }],
    ['กรย. — เปิดแผงแจ้งเตือน', async () => { const s = await tripSeenList('S8 กรย. แผงแจ้งเตือน', false); bell(s, true); await notiPanel(s, [NOTI_KRY, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['กรย. — แผนเดินทาง ดูอย่างเดียว (ยานพาหนะทุกคันในใบ)', () => tripView('S8 กรย. แผนเดินทาง', false)],
    ['หน่วยงานเจ้าของยานพาหนะ — เปิดแผงแจ้งเตือน', async () => { const s = await tripSeenList('S8 หน่วยงาน แผงแจ้งเตือน', true); bell(s, true); await notiPanel(s, [NOTI_OWN, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['หน่วยงานเจ้าของยานพาหนะ — แผนเดินทาง ดูอย่างเดียว (เฉพาะยานพาหนะของหน่วยงาน)', () => tripView('S8 หน่วยงาน แผนเดินทาง', true)]]],
  ['S9 · หน่วยงาน สร้างแผนเดินทางจ้างดำเนินการ (vendor)', [
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
  ['S10 · หน่วยงาน บันทึกงานบำรุงรักษารายคัน', [
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
    { path: 'Step 1 ตรวจสภาพก่อนบำรุงรักษา', screens: [
      ['กดเริ่มงาน — Step 1 ตรวจสภาพก่อนบำรุงรักษา วันดำเนินการอ่านอย่างเดียว', async () => { const s = await stepPage('S23 Step 1 ตรวจสภาพก่อนบำรุงรักษา', { vendor: true, step: 1 }); notify(s, 'เริ่มงานบำรุงรักษาแล้ว'); return s; }],
      ['กดเซ็นลงนาม — ลงนามการตรวจสภาพ', () => stepPage('S23 ลงนามการตรวจสภาพ', { vendor: true, step: 1, filled: true, signModal: true })],
      ['ตรวจรายการและลงนามครบ — ปุ่มยืนยันการตรวจสภาพกดได้', () => stepPage('S23 Step 1 ลงนามครบ', { vendor: true, step: 1, filled: true, signed: true })]] },
    { path: 'Step 2 สรุปงานก่อนปิดงาน', screens: [
      ['ยืนยันการตรวจสภาพ — Step 2 สรุปงานก่อนปิดงาน ไม่มีค่าใช้จ่ายและราคา', () => stepPage('S23 Step 2 สรุปงานก่อนปิดงาน', { vendor: true, step: 2 })],
      ['Validation กรณีไม่ได้ระบุข้อมูล, Out of focus', () => stepPage('S23 Validation', { vendor: true, step: 2, errors: true })],
      ['กรอกผลงานครบ', () => stepPage('S23 ปิดงานกรอกครบ', { vendor: true, step: 2, filled: true })]] },
    ['ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง ดำเนินการบำรุงรักษาแล้ว ตรวจแล้ว 1/6', async () => { const s = await tripDetail('S23 ปิดงานสำเร็จ', { trip: HIRE_T, vendor: true, st: { [HIRE_DONE]: 'worked' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['หน้างานรายคัน ดำเนินการบำรุงรักษาแล้ว — ปุ่มแก้ไขงาน ส่งตรวจงาน', () => vendorJob('S23 ดำเนินการบำรุงรักษาแล้ว', { st: 'worked' })],
    { path: 'แก้ไขอะไหล่ที่ใช้จริง', screens: [
      ['กดไอคอนแก้ไขอะไหล่ — แก้จำนวนที่ใช้จริง', () => vendorJob('S23 แก้ไขอะไหล่', { st: 'worked', partEdit: true })],
      ['กดเพิ่มอะไหล่ — popup เพิ่มอะไหล่ที่ใช้จริง', () => vendorJob('S23 เพิ่มอะไหล่', { st: 'worked', partAdd: 'filled' })],
      ['กดไอคอนลบอะไหล่ — ยืนยันเอาออก', () => vendorJob('S23 ลบอะไหล่', { st: 'worked', partDel: true })]] },
    ['กดส่งตรวจงาน — ยืนยันส่งตรวจงาน', async () => { const s = await vendorJob('S23 ยืนยันส่งตรวจงาน', { st: 'worked' }); await confirm(s, HIRE_SEND_CONFIRM(TRIP_CARS[HIRE_DONE])); return s; }],
    ['ส่งตรวจงานแล้ว — รอตรวจรับ', async () => { const s = await vendorJob('S23 รอตรวจรับ', { st: 'wait' }); notify(s, 'ส่งตรวจงานแล้ว'); return s; }],
    { path: 'บำรุงรักษาไม่ได้', screens: [
      ['บำรุงรักษาไม่ได้ — ระบุสาเหตุ ยืนยันอะไหล่ส่งคืน', () => jobPage('S23 บำรุงรักษาไม่ได้', { vendor: true, i: HIRE_CANNOT, modal: 'cannot', reason: HIRE_WHY })],
      ['บำรุงรักษาไม่ได้ระหว่าง Step 2 — อะไหล่ที่ใช้ไปแล้ว', () => stepPage('S23 บำรุงรักษาไม่ได้ Step 2', { vendor: true, step: 2, modal: 'cannot', reason: HIRE_WHY })],
      ['หน้างานรายคัน แจ้งบำรุงรักษาไม่ได้ — ปุ่มแก้ไขงาน ส่งตรวจงาน', () => vendorJob('S23 แจ้งบำรุงรักษาไม่ได้', { st: 'reported', cannot: true })]] },
    { path: 'ถูกส่งกลับแก้ไข', screens: [
      ['ถูกส่งกลับแก้ไข — คันที่ปิดงานไว้', () => vendorJob('S23 ส่งกลับแก้ไข', { st: 'returned' })],
      ['ถูกส่งกลับแก้ไข — คันที่แจ้งบำรุงรักษาไม่ได้', () => vendorJob('S23 ส่งกลับแก้ไข แจ้งไม่ได้', { st: 'returned', cannot: true })]] },
    ['หน้ารายละเอียดแผนเดินทาง — สถานะงานรายคันระหว่างทาง ตรวจแล้ว 2/6', () => tripDetail('S23 รายละเอียดแผนเดินทาง ระหว่างทาง', { trip: HIRE_T, vendor: true, st: HIRE_VENDOR })]]],
  ['S12 · หน่วยงาน บันทึกผลตรวจน้ำมันไฮโดรลิก', [   // 4 พ.ย. 2569 เลิก popup: ใส่ผลตอนปิดงาน (ถ้ามี) หรือภายหลังที่หน้ารายละเอียดงานรายคัน · ป้ายรอผลที่สถานะงาน
    ['Step 2 สรุปงานก่อนปิดงาน — เลือกเก็บตัวอย่าง ใส่ผลการทดสอบได้ (ถ้ามี)', () => stepPage('S12 Step 2 ผลการทดสอบ', { step: 2, filled: true })],   // 5 พ.ย. 2569 หน้าปิดงานเป็น Step 2 ของ S10
    ['ปิดงานโดยยังไม่มีผล — ป้ายรอผลตรวจน้ำมัน', async () => { const s = await tripDetail('S12 รอผลตรวจน้ำมัน', { st: JOB_MIX, oil: { [JOB_I]: 'wait' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด', () => tripDetail('S12 เมนูของยานพาหนะ', { st: JOB_MIX, oil: { [JOB_I]: 'wait' }, menu: true })],
    ['หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง', () => workDetail('S12 งานรายคัน รอผล', { res: {} })],
    ['กดบันทึกโดยยังไม่เลือกผล', () => workDetail('S12 ผลการทดสอบยังไม่ครบ', { res: { errors: true } })],
    ['เลือกผล + แนบไฟล์ (ถ้ามี)', () => workDetail('S12 ผลการทดสอบกรอกครบ', { res: { sel: 1, files: [OIL_FILE] } })],
    ['บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง', async () => { const s = await workDetail('S12 บันทึกผลสำเร็จ', { res: { sel: 1, files: [OIL_FILE], saved: true } }); notify(s, 'บันทึกผลการทดสอบน้ำมันไฮโดรลิกสำเร็จ'); return s; }],
    ['กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน', () => tripDetail('S12 น้ำมันไม่ผ่าน', { st: JOB_MIX, oil: { [JOB_I]: 'fail' } })]]],
  ['S13 · หน่วยงาน/เจ้าของยานพาหนะ ยอมรับผลการตรวจบำรุงยานพาหนะรายคัน', [
    ['รายการรอตรวจสอบ', () => roleList('S13 รายการ', { title: 'การตรวจบำรุงยานพาหนะรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขที่ MR', cols: ACC_COLS, rows: accRows({}) })],
    ['ผลการตรวจบำรุงยานพาหนะรายคัน', () => carResult('S13 รายคัน', {})],
    ['คันที่บำรุงรักษาไม่ได้ — สาเหตุ', () => carResult('S13 ทำไม่ได้', { cannot: true })],
    ['ยืนยันยอมรับผล', async () => { const s = await carResult('S13 ยืนยัน', {}); await confirm(s, { title: 'ยืนยันยอมรับผลการตรวจบำรุงยานพาหนะ', sub: V[0] + ' · บำรุงรักษาวันที่ 04/11/2569', ok: 'ยอมรับผล' }); return s; }],
    ['ยอมรับผลแล้ว', async () => { const s = await roleList('S13 ยอมรับแล้ว', { title: 'การตรวจบำรุงยานพาหนะรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขที่ MR', cols: ACC_COLS, rows: accRows({ accepted: [0] }) }); notify(s, 'ยอมรับผลการตรวจบำรุงยานพาหนะ ' + V[0] + ' สำเร็จ'); return s; }]]],
  ['S14 · หน่วยงาน/เจ้าของยานพาหนะ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)', [
    ['รายการ — ครบทุกคันแล้ว', () => roleList('S14 รายการ', { title: 'การตรวจบำรุงยานพาหนะรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขที่ MR', cols: ACC_COLS, rows: accRows({ plan: 'wait', accepted: [0, 1, 2] }) })],
    ['หลักฐานทั้งแผน — ยังไม่ประเมิน', () => planEvidence('S14 ยังไม่ประเมิน', {})],
    ['ประเมินความพึงพอใจแล้ว', () => planEvidence('S14 ประเมินแล้ว', { score: 5 })],
    ['ยืนยันยอมรับผลทั้งแผน', async () => { const s = await planEvidence('S14 ยืนยัน', { score: 5 }); await confirm(s, { title: 'ยืนยันยอมรับผลการตรวจบำรุงยานพาหนะทั้งแผน', sub: P[0] + ' · ' + P[4] + ' คัน · คะแนนความพึงพอใจ 5 · ระบบจะแจ้งหน่วยงานผู้ดำเนินการ', ok: 'ยอมรับผล' }); return s; }],
    ['ยอมรับผลทั้งแผนแล้ว', async () => { const s = await planEvidence('S14 ยอมรับแล้ว', { score: 5, done: true }); notify(s, 'ยอมรับผลการตรวจบำรุงยานพาหนะทั้งแผนสำเร็จ'); return s; }]]],
  ['S15 · หน่วยงาน บันทึกและส่งประวัติงานบำรุงรักษา', [
    ['ความคืบหน้ารายคัน (ยังไม่ครบ)', () => progressScreen('S15 ยังไม่ครบ', { done: 10 })],
    ['ครบทุกคัน — ประวัติงานบำรุงรักษา', () => historyScreen('S15 ครบทุกคัน', {})],
    ['ยืนยันส่งประวัติ', async () => { const s = await historyScreen('S15 ยืนยันส่ง', {}); await confirm(s, { title: 'ส่งประวัติให้หัวหน้าหน่วยงาน ตรวจสอบ', sub: 'ประวัติงานบำรุงรักษา ' + P[4] + ' คันของแผน ' + P[0] + ' จะแก้ไขไม่ได้จนกว่าหัวหน้าจะตรวจเสร็จ', ok: 'ส่งประวัติ' }); return s; }],
    ['ส่งแล้ว — รอหัวหน้าตรวจสอบ', async () => { const s = await historyScreen('S15 ส่งแล้ว', { sent: true }); notify(s, 'ส่งประวัติงานบำรุงรักษาให้หัวหน้าตรวจสอบแล้ว'); return s; }]]],
  ['S16 · หัวหน้าหน่วยงาน ตรวจสอบประวัติงานบำรุงรักษา', [
    ['รายการประวัติรอตรวจสอบ', () => roleList('S16 รายการ', { title: 'ประวัติรอตรวจสอบ', search: 'ค้นหาเลขที่ MR, ชื่อแผน', cols: HQ_COLS, rows: hqRows('wait') })],
    ['ประวัติงานบำรุงรักษาของแผน', () => headHistory('S16 ประวัติของแผน', {})],
    ['ตีกลับ — ระบุเหตุผล', async () => { const s = await headHistory('S16 ตีกลับ', {}); await reason(s, 'ตีกลับประวัติงานบำรุงรักษา', 'เหตุผลที่ตีกลับ', 'ผลน้ำมันไฮโดรลิกของ 80-5738 น่าน ไม่ผ่าน ต้องระบุการแก้ไขก่อนบันทึกประวัติ', 'ตีกลับ'); return s; }],
    ['ยืนยันอนุมัติประวัติ', async () => { const s = await headHistory('S16 ยืนยันอนุมัติ', {}); await confirm(s, { title: 'ยืนยันอนุมัติประวัติงานบำรุงรักษา', sub: P[0] + ' · ' + P[4] + ' คัน · บันทึกเป็นประวัติทางการ', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติประวัติแล้ว', async () => { const s = await headHistory('S16 อนุมัติแล้ว', { st: 'ok' }); notify(s, 'อนุมัติประวัติงานบำรุงรักษาสำเร็จ'); return s; }]]],
  ['S17 · หน่วยงาน ออกรายงานผลและปิดงาน', [
    ['รายงานผล (ประวัติผ่านแล้ว)', () => reportScreen('S17 รายงานผล', {})],
    ['ยืนยันปิดงาน', async () => { const s = await reportScreen('S17 ยืนยันปิดงาน', {}); await confirm(s, { title: 'ยืนยันปิดงาน', sub: 'แผน ' + P[0] + ' จะเปลี่ยนสถานะเป็น "ปิดงานแล้ว" และแก้ไขข้อมูลไม่ได้อีก', ok: 'ปิดงาน' }); return s; }],
    ['ปิดงานแล้ว', async () => { const s = await reportScreen('S17 ปิดงานแล้ว', { closed: true }); notify(s, 'ปิดงานสำเร็จ'); return s; }]]],
  ['S18 · หน่วยงาน คำนวณต้นทุนการบำรุงรักษา', [
    ['ต้นทุนการบำรุงรักษา + Summary', () => costScreen('S18 ต้นทุน')],
    ['ดาวน์โหลด Excel แล้ว', async () => { const s = await costScreen('S18 ดาวน์โหลดแล้ว'); notify(s, 'ดาวน์โหลดไฟล์ Excel แล้ว'); return s; }]]],
  // S19 S20 ต่อท้าย ⇒ ตัวอักษรบล็อกของ scenario เดิมไม่ขยับ · ลำดับในเรื่องอยู่ที่ journey (build.json)
  ['S19 · หน่วยงาน แก้ไขแผนบำรุงรักษา แล้วส่งอนุมัติใหม่', [
    ['เมนู "…" → แก้ไข', async () => { const s = await listScreen('S19 เมนู', { rows: [planAs('returned')].concat(ownPlans(UNITS[0])) }); planMenu(s, MENU); return s; }],
    ['รายละเอียดแผน — ส่งกลับแก้ไข', () => planDetail('S19 รายละเอียดแผน', { status: 'returned' })],
    ['ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้', () => planForm('S19 ฟอร์มแก้ไข', Object.assign({ alert: ALERT_RETURNED }, EDIT_FORM))],
    ['เอาภาคหรือตัวกรองออก — ยานพาหนะที่จัดไว้แล้วยังอยู่', () => planForm('S19 เอาตัวกรองออก', Object.assign({}, EDIT_FORM, { q: 0, regions: [REGIONS[0]] }))],   // 5 พ.ย. 2569 ตาม S1 เลิก confirm เอารถออก
    ['“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น', async () => { const s = await planForm('S19 ยืนยันการออก', EDIT_FORM); await confirm(s, EXIT_CONFIRM('ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก')); return s; }],
    ['ยืนยันการแก้ไขแผน', async () => { const s = await planForm('S19 ยืนยันการแก้ไข', EDIT_FORM); await confirm(s, EDIT_CONFIRM); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S19 บันทึกไม่สำเร็จ', EDIT_FORM); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — รออนุมัติ', async () => { const s = await listScreen('S19 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(ownPlans(UNITS[0])) }); notify(s, 'บันทึกการแก้ไขแผนและส่งอนุมัติสำเร็จ'); return s; }],
    ['แผนอนุมัติแล้ว — เมนู "…" → แก้ไข', async () => { const s = await listScreen('S19 เมนูอนุมัติแล้ว', { rows: [planAs('approved')].concat(ownPlans(UNITS[0])) }); planMenu(s, MENU.slice(0, 2)); return s; }],
    ['แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่', () => planForm('S19 ฟอร์มอนุมัติแล้ว', Object.assign({ alert: ALERT_APPROVED }, EDIT_FORM))],
    ['แผนดำเนินการแล้ว — เมนู "…" ดูรายละเอียดอย่างเดียว', async () => { const s = await listScreen('S19 เมนูดำเนินการ', { rows: ownPlans(UNITS[0]) }); planMenu(s, MENU.slice(0, 1)); return s; }]]],
  ['S20 · หน่วยงาน ลบแผนบำรุงรักษาที่ยังไม่อนุมัติ', [
    ['เมนู "…" → ลบ ในหน้า List', async () => { const s = await listScreen('S20 เมนู', { rows: [NEW_PLAN].concat(ownPlans(UNITS[0])) }); planMenu(s, MENU); return s; }],
    ['ยืนยันการลบแผน ในหน้า List', async () => { const s = await listScreen('S20 ยืนยันการลบ List', { rows: [NEW_PLAN].concat(ownPlans(UNITS[0])) }); await confirm(s, DELETE_CONFIRM); return s; }],
    ['ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)', async () => { const s = await listScreen('S20 ลบสำเร็จ', { rows: ownPlans(UNITS[0]) }); notify(s, 'ลบแผนบำรุงรักษาสำเร็จ'); return s; }],
    ['ปุ่ม “ลบแผน” ในหน้า Detail', () => planDetail('S20 ปุ่มลบแผน', {})],
    ['ยืนยันการลบแผน ในหน้า Detail', async () => { const s = await planDetail('S20 ยืนยันการลบ Detail', {}); await confirm(s, DELETE_CONFIRM); return s; }],
    ['แผนอนุมัติแล้ว — หน้ารายละเอียดไม่มีปุ่มลบ', () => planDetail('S20 อนุมัติแล้ว', { status: 'approved' })]]],
  /* S21 ปรับ 5 พ.ย. 2569 (เจ้าของงาน): จัดการอะไหล่ทีละคัน (หน้าแยก) · เข้าจากไอคอนแก้ไขที่แถวรถในแท็บไตรมาส n · บันทึกแล้วรวมลงหัวข้ออะไหล่ในไตรมาส (ตั้งต้นว่าง) */
  ['S21 · หน่วยงาน จัดการอะไหล่ของยานพาหนะแต่ละคันในแผน', [
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
    ['บันทึกไม่เบิกอะไหล่แล้ว — แถวยานพาหนะขึ้น ไม่เบิกอะไหล่', async () => { const s = await planForm('S21 บันทึกไม่เบิก', Object.assign({ values: FILLED, alloc: A_ALL, q: 1, picks: { 0: CAR_ADD }, oils: { 0: 1, 1: 0 }, manualCars: [0], draw: { 1: 'none' } }, R2)); notify(s, 'บันทึกอะไหล่ของยานพาหนะ ' + CAND[1][0] + ' แล้ว'); return s; }]]],
  /* S22 กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส — ตัดออก 6 พ.ย. 2569 (เจ้าของงาน "ตอนที่เลือกรถเข้าแผน เลือกอะใหล่ อยากให้ส่งจำนวนทั้งปีไปที่ smartinventory โดยยังไม่ส่งให้ตัด แค่ inform" + เลือกส่งตอนแผนอนุมัติแล้ว แทนการให้คลังกดรับทราบ)
     ⇒ ระบบแจ้ง Smart Inventory ตอน S2 อนุมัติ · บล็อก U เว้นว่าง · warehouseScreen/whParts คงไว้ */
  /* S24 ข้อมูลการบำรุงรักษารายคัน (เจ้าของงาน 4 พ.ย. 2569 · เลขชั่วคราว = W ต่อท้าย) — แท็บ การบำรุงรักษา ของ Vehicle Management */
  ['S24 · หน่วยงาน ติดตามข้อมูลการบำรุงรักษารายคันและกำหนดครั้งถัดไป', [
    ['แท็บการบำรุงรักษา — ยานพาหนะทุกคัน เรียงกำหนดครั้งถัดไป', () => maList('S24 การบำรุงรักษา', {})],
    ['ค้นหาทะเบียน', () => maList('S24 ค้นหาทะเบียน', { query: '82-1145', rows: [5] })],
    ['ค้นหาไม่พบ', () => maList('S24 ค้นหาไม่พบ', { query: '99-9999', rows: [] })],
    ['กดตัวกรอง — แผงตัวกรอง', () => maList('S24 แผงตัวกรอง', { filter: true })],
    ['กรองแล้ว — ใกล้ครบกำหนดบำรุงรักษา', () => maList('S24 กรองใกล้ครบกำหนด', { chips: [MA_DUE.near[0]], rows: MA_ROWS.map((r, i) => r[10] === 'near' ? i : -1).filter(i => i >= 0) })],
    ['กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด', () => maList('S24 เมนูของยานพาหนะ', { menu: true })],
    ['รายละเอียดยานพาหนะ — แท็บตารางบำรุงรักษา', () => maDetail('S24 ตารางบำรุงรักษา', {})],
    ['ประวัติ กดปุ่ม … — ดูรายละเอียดงานที่ปิดแล้ว', () => maDetail('S24 เมนูประวัติ', { menu: true })]]],
  /* S25 ย้ายรถที่บำรุงรักษาไม่ได้ไปไตรมาสอื่น (เจ้าของงาน 5 พ.ย. 2569 · บล็อก X) — ทางเข้าหน้าไตรมาส (S6) · ไปได้เฉพาะไตรมาสถัดไปของแผนเดียวกัน · รถและอะไหล่ตามแผนย้ายตาม · ไม่ต้องอนุมัติใหม่ */
  ['S25 · หน่วยงาน ย้ายยานพาหนะที่บำรุงรักษาไม่ได้ไปไตรมาสอื่น', [
    ['หน้าไตรมาส 1 — ยานพาหนะที่บำรุงรักษาไม่ได้ ป้ายบำรุงรักษาไม่ได้', () => moveQuarter('S25 ไตรมาส 1 ยานพาหนะบำรุงรักษาไม่ได้', 0)],
    ['กดปุ่ม … ของยานพาหนะ — ย้ายไปไตรมาสอื่น', async () => { const s = await moveQuarter('S25 เมนูย้ายไปไตรมาสอื่น', 0); moveMenu(s, MOVE_I); return s; }],
    ['popup ย้ายไปไตรมาสอื่น — ยังไม่เลือกไตรมาส', async () => { const s = await moveQuarter('S25 popup ย้ายไปไตรมาสอื่น', 0); await moveModal(s, { cur: 0 }); return s; }],
    ['เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้', async () => { const s = await moveQuarter('S25 เลือกไตรมาส 2', 0); await moveModal(s, { cur: 0, sel: MOVE_TO }); return s; }],
    ['กรณีไตรมาส 3 — ไตรมาสก่อนหน้าและไตรมาสปัจจุบันเลือกไม่ได้', async () => { const s = await moveQuarter('S25 popup ไตรมาส 3', 2); await moveModal(s, { cur: 2, trip: MOVE_T3 }); return s; }],
    ['ยืนยันการย้ายยานพาหนะ', async () => { const s = await moveQuarter('S25 ยืนยันการย้ายยานพาหนะ', 0); await confirm(s, MOVE_CONFIRM(MOVE_TO)); return s; }],
    ['ย้ายสำเร็จ — ไตรมาส 1 ไม่มียานพาหนะคันนี้แล้ว', async () => { const s = await tripList('S25 ย้ายสำเร็จ', { trips: [JOB_T], removed: [MOVE_I] }); notify(s, MOVE_TOAST); return s; }],
    ['หน้าไตรมาส 2 — ยานพาหนะที่ย้ายมา ยังไม่มีแผนเดินทาง', () => moveQuarter('S25 ไตรมาส 2', MOVE_TO)],   // 9 พ.ย. 2569 ชุดเดียวกับ X.9 (MOVE_Q2_PAGE)
    ['หน้าไตรมาส 2 — อะไหล่ในไตรมาสรวมอะไหล่ของยานพาหนะที่ย้ายมา', () => moveQuarter('S25 อะไหล่ไตรมาส 2', MOVE_TO)],   // 9 พ.ย. 2569 แก้ moveQuarter(…, 2) ที่ได้หน้าไตรมาส 3 · 6 พ.ย. 2569 เดิมหน้าความคืบหน้าอะไหล่ S4 (เปลี่ยนเป็นแดชบอร์ด) ⇒ หัวข้ออะไหล่ในไตรมาสของหน้าไตรมาส   // 6 พ.ย. 2569 เดิมหน้าความคืบหน้าอะไหล่ S4 (เปลี่ยนเป็นแดชบอร์ด) ⇒ หัวข้ออะไหล่ในไตรมาสของหน้าไตรมาส
    ['ไตรมาส 4 — เมนูย้ายไปไตรมาสอื่นกดไม่ได้', async () => { const s = await moveQuarter('S25 ไตรมาส 4 ย้ายไม่ได้', 3); moveMenu(s, 0, true); return s; }]]],
];


/* ---------- จอ ↔ กล่องในผัง userflow (เจ้าของงานสั่ง 22 ต.ค. 2569: userflow กับ wireframe อยู่ข้างกันตอน export) ----------
   ชื่อ state → id กล่องในผัง mermaid ของ Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md (คั่นด้วยช่องว่างได้หลายกล่อง)
   ไม่ใส่ = ผังยังไม่มีกล่องของจอนี้ ⇒ ปลั๊กอินเขียนบอกใต้ผัง "จอที่ยังไม่มีกล่องในผัง" (รอเติม userflow — ไม่เติมผังเอง) */
const FLOW_NODES = {
  S1: { 'รายการแผน': 'D1', 'รายการแผน — ยังไม่มีแผน': 'D0', 'ฟอร์มสร้างแผน (ว่าง)': 'D2', 'เลือกปีงบประมาณ — รายการปีเปิด': 'A2', 'กดตัวกรอง — แผงตัวกรอง ยังไม่เลือกภาค เขต ประเภทยานพาหนะ': 'A3', 'เลือกภาค เขต ในแผงตัวกรอง — รายการเขตของภาคที่เลือก': 'A7', 'ยานพาหนะทั้งหมดของพื้นที่ที่เลือก — กดตกลงแล้ว ชิปตัวกรอง ยังไม่ติ๊ก': 'D4', 'ค้นหาและกรองแล้ว': 'A8', 'ไม่พบยานพาหนะที่ตรงกับคำค้นหรือตัวกรอง': 'A8', 'ติ๊กยานพาหนะ 3 คัน — ปุ่มจัดลงไตรมาสกดได้': 'A5', 'กดจัดลงไตรมาส — popup เลือกไตรมาส': 'D6', 'จัดลงไตรมาสแล้ว — ป้ายไตรมาสในตาราง ตัวเลขบนแท็บเปลี่ยน': 'D3', 'แท็บไตรมาส 1 — ทุกคันกำหนดแล้ว อะไหล่ในไตรมาสรวมครบ': 'D12', 'ย้ายยานพาหนะไปไตรมาสอื่น — ติ๊กยานพาหนะที่จัดแล้ว': 'D6', 'เอาภาคหรือตัวกรองออก — ยานพาหนะที่จัดแล้วยังอยู่ในไตรมาส': 'D7', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'D8', 'บันทึกและส่งอนุมัติสำเร็จ — รออนุมัติ': 'A6 D5', 'รายละเอียดแผน — รออนุมัติ มีปุ่มลบแผนและแก้ไข': 'D9', 'รายละเอียดแผน — อนุมัติแล้ว': 'D10', 'รายละเอียดแผน — ส่งกลับแก้ไข เห็นเหตุผล กดแก้ไขไป S19': 'D11', 'ไตรมาสที่ยังไม่มียานพาหนะ — ปุ่มเพิ่มยานพาหนะเข้าไตรมาส 3': 'D13', 'กดเพิ่มยานพาหนะเข้าไตรมาส 3 — popup ยานพาหนะที่ยังไม่อยู่ในไตรมาสใด': 'A13 D14', 'ติ๊กยานพาหนะ 2 คัน — ปุ่มเพิ่มเข้าไตรมาส 3 กดได้': 'A14', 'เพิ่มยานพาหนะเข้าไตรมาส 3 แล้ว — แท็บไตรมาส 3 มียานพาหนะ ตัวเลขบนแท็บเปลี่ยน': 'D15', 'ทุกคันในพื้นที่จัดลงไตรมาสแล้ว — popup ไม่มียานพาหนะให้เพิ่ม': 'D16', 'แท็บทั้งหมด — อะไหล่รวมทุกไตรมาส รวมอะไหล่ของยานพาหนะทุกคันที่จัดลงไตรมาสแล้ว': 'D12' },
  S6: { 'รายการแผน — เมนู "…" ดูรายละเอียดแผนที่อนุมัติแล้ว': 'D7 A7', 'รายละเอียดแผน — กดไปหน้าไตรมาส 1': 'D8 A8', 'หน้าไตรมาส 1 — ยังไม่มีแผนเดินทาง': 'D1', 'ฟอร์มสร้างแผนเดินทาง (ว่าง)': 'D2', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะทุกคันของไตรมาส': 'D5', 'เพิ่มยานพาหนะแล้ว — สถานที่ตั้งต้นสำนักงานที่ยานพาหนะอยู่': 'D4', 'แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันเดินทาง': 'A5', 'กดไอคอนลบ — เอายานพาหนะออกจากแผนเดินทางนี้ (soft delete)': 'A9', 'กดเพิ่มยานพาหนะอีกครั้ง — ยานพาหนะที่เอาออกกลับมาเลือกได้': 'D5', 'เลือกช่วงวันเดินทาง': 'A3', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'D9', 'กรอกครบ': 'A4', 'สร้างแผนเดินทางสำเร็จ — กลับหน้าไตรมาส 1 แสดงแผนเดินทางใหม่ (รออนุมัติ)': 'D3', 'สร้างแผนเดินทางใบถัดไป — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้': 'D5', 'แผนเดินทาง 2 ใบ — ยานพาหนะครบทุกคัน ปุ่มสร้างแผนเดินทางกดไม่ได้': 'D6', 'แผนเดินทางถูกส่งกลับแก้ไข': 'D1', 'แก้ไขแผนเดินทางที่ถูกส่งกลับ': 'D2', 'ส่งอนุมัติใหม่แล้ว': 'D3', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะในแผนที่ยังไม่อยู่ในไตรมาส': 'AQ', 'เพิ่มยานพาหนะเข้าไตรมาสแล้ว': 'D1', 'กดไอคอนแก้ไข — แก้ไขผู้ดูแลยานพาหนะและสถานที่บำรุงรักษา': 'AQ', 'กดไอคอนลบ — ยืนยันเอายานพาหนะออกจากไตรมาส': 'AQ', 'เอายานพาหนะออกจากไตรมาสแล้ว': 'D1',
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
  S24: { 'แท็บการบำรุงรักษา — ยานพาหนะทุกคัน เรียงกำหนดครั้งถัดไป': 'D1', 'ค้นหาทะเบียน': 'A1', 'ค้นหาไม่พบ': 'D2', 'กดตัวกรอง — แผงตัวกรอง': 'D3', 'กรองแล้ว — ใกล้ครบกำหนดบำรุงรักษา': 'D4', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด': 'A4', 'รายละเอียดยานพาหนะ — แท็บตารางบำรุงรักษา': 'D5', 'ประวัติ กดปุ่ม … — ดูรายละเอียดงานที่ปิดแล้ว': 'A5' },
  S12: { 'Step 2 สรุปงานก่อนปิดงาน — เลือกเก็บตัวอย่าง ใส่ผลการทดสอบได้ (ถ้ามี)': 'A1', 'ปิดงานโดยยังไม่มีผล — ป้ายรอผลตรวจน้ำมัน': 'D1', 'กดปุ่ม … ของยานพาหนะ — ดูรายละเอียด': 'A3', 'หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง': 'D2', 'กดบันทึกโดยยังไม่เลือกผล': 'Q2', 'เลือกผล + แนบไฟล์ (ถ้ามี)': 'A4', 'บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง': 'D3', 'กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน': 'D4' },
  S15: { 'ความคืบหน้ารายคัน (ยังไม่ครบ)': 'D1', 'ครบทุกคัน — ประวัติงานบำรุงรักษา': 'D2', 'ยืนยันส่งประวัติ': 'A2', 'ส่งแล้ว — รอหัวหน้าตรวจสอบ': 'D3' },
  S17: { 'รายงานผล (ประวัติผ่านแล้ว)': 'D2', 'ยืนยันปิดงาน': 'Q1', 'ปิดงานแล้ว': 'D3' },
  S18: { 'ต้นทุนการบำรุงรักษา + Summary': 'D2 D3', 'ดาวน์โหลด Excel แล้ว': 'A3' },
  S19: { 'เมนู "…" → แก้ไข': 'A1', 'รายละเอียดแผน — ส่งกลับแก้ไข': 'A1', 'ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้': 'D3', 'เอาภาคหรือตัวกรองออก — ยานพาหนะที่จัดไว้แล้วยังอยู่': 'D4', '“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น': 'D5', 'ยืนยันการแก้ไขแผน': 'D6', 'บันทึกไม่สำเร็จ': 'D7', 'บันทึกสำเร็จ — รออนุมัติ': 'D8', 'แผนอนุมัติแล้ว — เมนู "…" → แก้ไข': 'A1', 'แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่': 'D3', 'แผนดำเนินการแล้ว — เมนู "…" ดูรายละเอียดอย่างเดียว': 'D2' },
  S21: { 'แท็บไตรมาส 1 — ทุกคันยังไม่กำหนด อะไหล่ในไตรมาสว่าง': 'D1', 'เมนู … → แก้ไข — หน้าจัดการอะไหล่ของยานพาหนะ (ยังไม่กำหนด)': 'A1 D2', 'เลือกยานพาหนะคันอื่น — รายการยานพาหนะในไตรมาสเปิด': 'A2', 'เลือกเปลี่ยนน้ำมัน — ระบุเบอร์น้ำมัน รหัส จำนวนลิตร': 'A6 A9', 'เลือกไส้กรองจากคลัง — เข้าอะไหล่อื่นๆ ของยานพาหนะคันนี้': 'A3', 'ระบุอะไหล่เพิ่มเติม — popup ชื่อ ยี่ห้อ รุ่น รหัส จำนวน หน่วย': 'A7 A8', 'ระบุอะไหล่เพิ่มเติมแล้ว — อยู่ในรายการ': 'A4', 'บันทึกไม่สำเร็จ': 'A5', 'บันทึกสำเร็จ — กลับแท็บไตรมาส 1 ยานพาหนะ 1 คันกำหนดแล้ว อะไหล่ในไตรมาสมีของคันนี้': 'D4' },
  S20: { 'เมนู "…" → ลบ ในหน้า List': 'A1', 'ยืนยันการลบแผน ในหน้า List': 'D3', 'ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)': 'D4', 'ปุ่ม “ลบแผน” ในหน้า Detail': 'A2', 'ยืนยันการลบแผน ในหน้า Detail': 'D3', 'แผนอนุมัติแล้ว — หน้ารายละเอียดไม่มีปุ่มลบ': 'D2' },
  S2: { 'รายการแผนรออนุมัติ': 'D1', 'รายละเอียดแผน — ผลการพิจารณา ยังไม่เลือก': 'D2 A2', 'อนุมัติ — ยืนยันอนุมัติแผน': 'A5', 'อนุมัติแผนสำเร็จ': 'D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus': 'D5', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A4', 'ส่งกลับแล้ว': 'D3' },
  // S3 พักไว้ 30 ต.ค. 2569
  S7: { 'รายการแผนเดินทางรออนุมัติ': 'D1', 'รายละเอียดแผนเดินทาง — ผลการพิจารณา ยังไม่เลือก': 'D2 A2', 'อนุมัติ — ยืนยันอนุมัติแผนเดินทาง': 'A5', 'อนุมัติแผนเดินทางสำเร็จ': 'D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — Validation กรณีไม่ได้ระบุเหตุผล, Out of focus': 'D5', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A4', 'ส่งกลับแล้ว': 'D3' },
  S9: { 'เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น': 'D2', 'เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด': 'A3', 'กดเพิ่มยานพาหนะ — popup ยานพาหนะในแผนเดินทางอื่นแสดงแต่เลือกไม่ได้': 'D5', 'แก้ไขยานพาหนะในแผนเดินทาง — ผู้ดูแลยานพาหนะ สถานที่ และวันดำเนินการ ค่าเริ่มต้นทั้งช่วงวันทำงาน': 'A5', 'Validation กรณีไม่ได้ระบุข้อมูล, Out of focus': 'Q1', 'กรอกครบ': 'A6', 'ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)': 'D3' },
  S8: { 'กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)': 'D1', 'กรย. — เปิดแผงแจ้งเตือน': 'A1', 'กรย. — แผนเดินทาง ดูอย่างเดียว (ยานพาหนะทุกคันในใบ)': 'D2', 'หน่วยงานเจ้าของยานพาหนะ — เปิดแผงแจ้งเตือน': 'A2', 'หน่วยงานเจ้าของยานพาหนะ — แผนเดินทาง ดูอย่างเดียว (เฉพาะยานพาหนะของหน่วยงาน)': 'D3' },
  S13: { 'รายการรอตรวจสอบ': 'D1', 'ผลการตรวจบำรุงยานพาหนะรายคัน': 'D2', 'คันที่บำรุงรักษาไม่ได้ — สาเหตุ': 'D2', 'ยืนยันยอมรับผล': 'A3', 'ยอมรับผลแล้ว': 'D3' },
  S14: { 'รายการ — ครบทุกคันแล้ว': 'D1', 'หลักฐานทั้งแผน — ยังไม่ประเมิน': 'D2', 'ประเมินความพึงพอใจแล้ว': 'A3', 'ยืนยันยอมรับผลทั้งแผน': 'A4', 'ยอมรับผลทั้งแผนแล้ว': 'D3' },
  S25: { 'หน้าไตรมาส 1 — ยานพาหนะที่บำรุงรักษาไม่ได้ ป้ายบำรุงรักษาไม่ได้': 'D0', 'กดปุ่ม … ของยานพาหนะ — ย้ายไปไตรมาสอื่น': 'A1', 'popup ย้ายไปไตรมาสอื่น — ยังไม่เลือกไตรมาส': 'A2 D2', 'เลือกไตรมาส 2 — ปุ่มย้ายยานพาหนะกดได้': 'A3', 'กรณีไตรมาส 3 — ไตรมาสก่อนหน้าและไตรมาสปัจจุบันเลือกไม่ได้': 'D2', 'ยืนยันการย้ายยานพาหนะ': 'D3', 'ย้ายสำเร็จ — ไตรมาส 1 ไม่มียานพาหนะคันนี้แล้ว': 'D4', 'หน้าไตรมาส 2 — ยานพาหนะที่ย้ายมา ยังไม่มีแผนเดินทาง': 'A4 D5', 'หน้าไตรมาส 2 — อะไหล่ในไตรมาสรวมอะไหล่ของยานพาหนะที่ย้ายมา': 'D6', 'ไตรมาส 4 — เมนูย้ายไปไตรมาสอื่นกดไม่ได้': 'D1' },   // 5 พ.ย. 2569 บล็อก X
  S16: { 'รายการประวัติรอตรวจสอบ': 'D1', 'ประวัติงานบำรุงรักษาของแผน': 'D2', 'ตีกลับ — ระบุเหตุผล': 'A3', 'ยืนยันอนุมัติประวัติ': 'A4', 'อนุมัติประวัติแล้ว': 'D4' },
};

/* ---------- กลุ่ม = scenario (แพทเทิร์นเดียวกับ Overhaul — เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก · แถว Desktop แล้ว Mobile) ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/* ตัวอักษรบล็อกผูกกับตำแหน่งใน BLOCK_OF ตายตัว (2 พ.ย. 2569) — ตัด/รวม scenario แล้วบล็อกอื่นไม่เลื่อน ชื่อเฟรมที่ export ไปแล้วยังตรง · S5 รวมเข้า S4 ⇒ D เว้นว่าง
   4 พ.ย. 2569 ตัด S11 (J) และ S23 (V) ⇒ คงช่องไว้เป็นป้ายกันที่ ('S11 ตัดออก' · 'S23 ตัดออก' ไม่ตรงกับ scenario ไหน) ถ้าเอาออกจาก array ตัวอักษร K–U และ W จะเลื่อน ชื่อเฟรม Figma ที่ export แล้วจะไม่ตรง
   10 พ.ย. 2569 เอา S23 กลับ (R87) ⇒ ช่อง V กลับเป็น 'S23' ตัวอักษรอื่นไม่เลื่อน · J ยังว่าง (S11 ยังตัด) */
const BLOCK_OF = ['S1', 'S2', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11 ตัดออก', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20', 'S21', 'S22 ตัดออก', 'S23', 'S24', 'S25'];   // S24 ข้อมูลการบำรุงรักษา (4 พ.ย. 2569) = W · J ว่าง · V = S23 (เอากลับ 10 พ.ย. 2569)
const GROUPS = SCENARIOS.map(([title, screens], i) => {
  const tag0 = title.split(' · ')[0], code = BLOCK_OF.indexOf(tag0) >= 0 ? LETTERS[BLOCK_OF.indexOf(tag0)] : LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  const map = FLOW_NODES[tag] || {};
  /* entry เป็นเส้นทางย่อย { path, screens } ได้ (แพตเทิร์น 10 พ.ย. 2569 · ดู flatScreens ใน core.js) — ผูก id กล่องผังให้จอข้างในเหมือนกัน */
  const withNode = ([label, fn]) => [label, fn, map[label] || ''];
  return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag,
    screens: screens.map(e => isPath(e) ? { path: e.path, screens: e.screens.map(withNode) } : withNode(e)) }] };
});

/* ---------- สร้าง (ปุ่มชุดเดียวกับ Overhaul 21 ต.ค. 2569: ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component) ----------
   เจ้าของงานสั่ง 22 ต.ค. 2569 "จะเอาลงในเพจ Maintainance ด้วยกันเลย" ⇒ ทุกปุ่มวางบนหน้า "Maintainance" (ไม่มีก็สร้าง) ต่อใต้ของเดิม · ใต้ของเดิมเกินขอบพื้นที่วางงานแล้ววางเหนือของเดิม (roomyPage) ไม่ลบ/ไม่ย้ายของที่มีอยู่
   แต่ละบล็อก scenario = ผัง userflow ซ้ายสุด + ป้าย Device + คอลัมน์จอ A.1 A.2 … (แถว Desktop แล้ว Mobile ตามที่เลือก) */
const PAGE_NAMES = ['Maintainance', 'Maintenance'];
const BLOCK_H = 7000;   // ความสูงที่เผื่อต่อ 1 บล็อก scenario ตอนเช็คว่าหน้าเหลือที่พอไหม
/* ย้ายบล็อกล่าสุดที่ล้นขอบ (หรือที่ค้างบนหน้า -2 จากปุ่มรุ่นก่อน) มาไว้เหนือของเดิมบนหน้า Maintainance ไม่ต้องสร้างใหม่ · ของเดิมที่เหลือไม่แตะ แค่รายงานจำนวน */
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
  const TOTAL = SCEN.reduce((a, x) => a + countScreens(x[1]), 0);   // นับจอในเส้นทางย่อยด้วย (countScreens ใน core.js)
  log(INDEX.has('Header') ? 'แถบรหัส flow: component Header ของทีมออกแบบ' : 'แถบรหัส flow: ไม่พบ component Header ในไฟล์ — วาดแถบธรรมดาสีเดียวกันแทน');
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
  let instances = 0, loose = 0;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') loose++;
  }
  figma.currentPage.selection = made.slice(0, 1);   // ของใหม่อยู่ล่างสุดของ Layers ⇒ เลือกจอแรกให้ Layers เลื่อนไปหา
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 6));
  log('');
  if (pageBottom(page) > CANVAS_MAX) log('หมายเหตุ: ชุดนี้ยาวเกินขอบพื้นที่วางงานของ Figma จอท้ายๆ อาจเลื่อนไปไม่ถึง — ใช้สร้างทีละ scenario แทน');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ผัง userflow ' + flows + ' ผัง · ' + GRP.length + ' บล็อก ' + what + ' (' + GRP.map(g => g.code).join(' ') + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓') + ' (ผัง userflow เป็นของวาดประกอบนอกจอ ไม่นับ)');
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

/* ---------- journey แนวขวาง (ปุ่มแยก · เจ้าของงานสั่ง 22 ต.ค. 2569 "ลงในเพจ maintainance แต่มีปุ่มแยกการ generate userflow") ----------
   18 scenario ต่อกันซ้าย → ขวา ตาม build.json "journey" · กล่องหน้าจอในผังติดป้ายรหัสจอ (A.1 …) และใส่ภาพย่อจากจอที่สร้างไว้บนหน้านี้แล้ว (ไม่มีจอ = กล่องเปล่า)
   วางต่อใต้ของเดิมบนหน้า "Maintainance" ไม่ลบ/ไม่ย้ายของที่มีอยู่ */
function journeyCodes(n) {
  const g = GROUPS.find(x => x.subs[0].tag === 'S' + n); if (!g) return null;
  const sub = g.subs[0], codes = {}, loose = [];
  sub.screens.forEach(([label, , ids], i) => { const c = sub.code + '.' + (i + 1); const list = String(ids || '').split(/\s+/).filter(Boolean); if (!list.length) loose.push(c + ' ' + label); list.forEach(id => { (codes[id] = codes[id] || []).push(c); }); });
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
const SCEN_SEQ = ['S1', 'S2', 'S19', 'S20', 'S21', 'S4', 'S6', 'S9', 'S7', 'S8', 'S10', 'S23', 'S25', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S24'];
const SCEN_REVIEW = { S1: 'ปรับตามรีวิว 5 พ.ย. · เลือกยานพาหนะแบบ A · เพิ่มยานพาหนะจากแท็บไตรมาสว่าง (เจ้าของงาน 5 พ.ย.)', S2: 'ปรับตามรีวิว 5 พ.ย.', S4: 'เปลี่ยนเป็นแดชบอร์ด 6 พ.ย. (รีวิว บล็อก C)', S21: 'ปรับตามเจ้าของงาน 5 พ.ย. · จัดการอะไหล่ทีละคัน', S19: 'ปรับตาม S1 2 พ.ย.',
  S6: 'ปรับตามรีวิว 5 พ.ย.', S7: 'ทำตาม S2 5 พ.ย. · รอรีวิวจอ', S8: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S9: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S10: 'ปรับตามรีวิว 5 พ.ย. · แผนจ้าง Step 2 ไม่มีค่าใช้จ่ายและราคา 10 พ.ย.', S23: 'เอากลับ 10 พ.ย. · UI แบบ S10 การมองเห็นแบบเดิม · รอรีวิวจอ', S12: 'ปรับตามรีวิว 4 พ.ย.', S18: 'ยังไม่ออกแบบ (เจ้าของงาน 4 พ.ย.)', S24: 'ใหม่ 4 พ.ย. · รอรีวิวจอ', S25: 'ใหม่ 5 พ.ย. · รอรีวิวจอ' };   // 4 พ.ย. 2569: ทำตามที่เจ้าของงานสั่งแล้ว แต่ยังไม่ได้ไล่จอด้วยกัน
const SCEN_UPDATED = '10 พ.ย. 2569';   // วันที่ข้อมูลในตาราง scenario ล่าสุด — แก้ SCEN_REVIEW แล้วเปลี่ยนวันนี้ด้วย (ขึ้นที่หัวตาราง)
const SCEN_CUT = [['S3', 'ผพจ. ออกเลขงานและจัดซื้ออะไหล่', 'ตัดออก 2 พ.ย.'], ['S5', 'หน่วยงาน เบิกอะไหล่ผ่านระบบจองอะไหล่', 'รวมเข้า S4 2 พ.ย.'],
  ['S11', 'หน่วยงาน ตรวจรับงานรายคันของผู้รับจ้างและรับคืนอะไหล่', 'ตัดออก 4 พ.ย. · หน่วยงานปิดงานแผนจ้างเองที่ S10 · S23 ส่งตรวจงานแล้ว ผู้ตรวจรับยังไม่เคาะ'],
  ['S22', 'คลัง รับทราบรายการอะไหล่รายไตรมาส', 'ตัดออก 6 พ.ย. · ระบบแจ้ง Smart Inventory ตอนอนุมัติแผน (S2)']];
const SCEN_COLS = [['scenario', 110], ['บล็อก', 90], ['ชื่อ', 600], ['ผู้ทำ', 300], ['จอ', 90], ['สถานะรีวิว', 260]];
function scenData() {
  const sec = DOCS.scenarios.sections.find(s => /^0\./.test(s.h)) || { rows: [] };
  const info = {}; sec.rows.forEach(r => { info[r[0]] = r; });   // # · scenario · ช่วงงาน · บทบาท · กล่องบนบอร์ด
  const rows = SCEN_SEQ.map(tag => { const g = GROUPS.find(x => x.subs[0].tag === tag), r = info[tag] || []; return [r[2] || '-', tag, g ? g.code : '-', r[1] || (g ? g.subs[0].title : ''), r[3] || '-', g ? String(g.subs[0].screens.length) : '0', SCEN_REVIEW[tag] || 'ยังไม่ได้รีวิวรอบนี้']; });
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
    if (msg.type === 'move-latest') await moveLatest();
    if (msg.type === 'clear-proto') { const tp = await namedPage(PAGE_NAMES); await figma.setCurrentPageAsync(tp.page); await clearPrototype(tp.page); }
    if (msg.type === 'build-docs') await buildDocs({ parts: msg.parts });   // 30 ต.ค. 2569 ติ๊กเลือกส่วน / สร้างทั้งหมด   // 30 ต.ค. 2569 ส่งภาพจอบนหน้านี้ไป FigJam
    if (msg.type === 'audit-dup') await auditDuplicates();   // ตรวจจอซ้ำบนหน้านี้ (อ่านอย่างเดียว · 10 พ.ย. 2569)
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]), codes: GROUPS.map(g => g.code) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก"

/* ======================== maintainance-feature-plugin/features/*.js ======================== */
const MF_FEATURES = [];

/* ---------- features/plan.js ---------- */
/* ============================================================================
   features/plan.js — Feature แผนบำรุงรักษา (S1 S2 S19 S20 S21)
   ย้ายออกจาก feature.js 17 พ.ย. 2569 (ปรับปลั๊กอินให้มีหลาย Feature) · ค่าทุกตัวเหมือนเดิม
   เอกสาร: Diagram/01-บำรุงรักษาตามวาระ/32-บำรุงรักษา-feature-แผนบำรุงรักษา-สำหรับ-dev.md
   ---------------------------------------------------------------------------
   แม่แบบของ Feature อื่น (features/<id>.js) — ลงทะเบียนด้วย MF_FEATURES.push({ … }) ใน IIFE (ตัวแปรในไฟล์ไม่ชนกับ Feature อื่น)
     id        รหัสสั้น (plan · trip · job · close · track)
     title     ชื่อ Feature (Title หลักบนหน้า + ชื่อบอร์ด FigJam)
     page      ชื่อหน้า Figma ['ชื่อหลัก', 'ชื่อสำรอง…'] · Feature ใหม่ใช้ 'MF <title>'
     doc       ไฟล์เอกสารใน Diagram/01-บำรุงรักษาตามวาระ/ (ตัวเทสเทียบรหัสจอกับหัวข้อ 3 ของไฟล์นี้)
     scenarios scenario ใน screens.js ที่ใช้จอ ⇒ รหัสบล็อก (A B …) ตาม BLOCK_OF ของ screens.js
     screens   { รหัสจอ: () => จอ } แทนจอเดิม หรือเพิ่มจอใหม่ (รหัส 'H:…' ใช้ใน happy flow)
     toasts    { id: { text, page, when, was, err? } } toast แยกชิ้น อ้างใน journeys ด้วย ['toast:<id>']
     happy     [ journey ละ 1 รายการ: [[รหัสจอ, คำอธิบายขั้น, ชื่อหน้า], …] ]
     journeys  [ { title, pages: [ { name, items: [[รหัสจอ, ป้าย case] | ['toast:<id>']] } ] } ]
     fjDir / fjBoard  (ไม่ใส่ = flow-maintainance-feature-<id> / board-maintainance-feature-<id>)
   ============================================================================ */
MF_FEATURES.push((() => {
/* หน้ารายการแผน case "Filled มีแผน" แสดงตัวอย่างเต็มหน้า 10 รายการ ตาม Table pagination 10 แถวต่อหน้า (ผู้ใช้สั่ง 16 พ.ย. 2569)
   = แผนของ กกฟ.1 ที่มีอยู่ (ownPlans) + แผนจำลองเพิ่ม 8 แผน · ข้อมูลจำลองเฉพาะปลั๊กอินนี้ ไม่แก้ screens.js ของพี่นุ
   เลขที่ MR ไม่ชนของเดิม (Z70 เว้น 0000004 ไว้ให้แผนที่สร้างใหม่ใน A.19) · เรียงวันที่สร้างใหม่ไปเก่า · สถานะหลากหลายตาม PST */
const LIST10_EXTRA = [
  ['MRZ7100005', 'บำรุงรักษากระเช้าฮอทไลน์ ภาค 1 ปีงบประมาณ 2571', 'ภาค 1 (เหนือ)', 'ไตรมาส 1', '6', 'review', '08/11/2569', 'กระเช้าฮอทไลน์', '2571', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MRZ7100004', 'บำรุงรักษารถพ่วงฉีดน้ำ ภาค 2 ปีงบประมาณ 2571', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 1', '5', 'returned', '01/11/2569', 'รถพ่วงฉีดน้ำ', '2571', 'ไตรมาส 1: 2 · ไตรมาส 2: 1 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MRZ7100003', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 ปีงบประมาณ 2571', 'ภาค 1 (เหนือ)', 'ไตรมาส 1', '8', 'approved', '20/10/2569', 'กระเช้าแก้ไฟ', '2571', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ6900014', 'บำรุงรักษากระเช้าฮอทไลน์ ภาค 2 ปีงบประมาณ 2569', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 4', '7', 'hist', '10/06/2568', 'กระเช้าฮอทไลน์', '2569', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 1'],
  ['MRZ6900013', 'บำรุงรักษารถพ่วงฉีดน้ำ ภาค 1 ปีงบประมาณ 2569', 'ภาค 1 (เหนือ)', 'ไตรมาส 4', '4', 'passed', '08/06/2568', 'รถพ่วงฉีดน้ำ', '2569', 'ไตรมาส 1: 1 · ไตรมาส 2: 1 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MRZ6800003', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 ปีงบประมาณ 2568', 'ภาค 1 (เหนือ)', 'ไตรมาส 4', '9', 'closed', '04/06/2567', 'กระเช้าแก้ไฟ', '2568', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ6800002', 'บำรุงรักษายานพาหนะ กกฟ.1 ปีงบประมาณ 2568', 'ภาค 1, ภาค 2', 'ไตรมาส 4', '10', 'closed', '02/06/2567', 'กระเช้าแก้ไฟ, รถพ่วงฉีดน้ำ', '2568', 'ไตรมาส 1: 3 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MRZ6800001', 'บำรุงรักษากระเช้าฮอทไลน์ ภาค 2 ปีงบประมาณ 2568', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 4', '5', 'closed', '28/05/2567', 'กระเช้าฮอทไลน์', '2568', 'ไตรมาส 1: 2 · ไตรมาส 2: 1 · ไตรมาส 3: 1 · ไตรมาส 4: 1']];
const dmy = (d) => { const [a, b, c] = d.split('/'); return +(c + b + a); };
const byDate = (rows) => rows.slice().sort((p, q) => dmy(q[6]) - dmy(p[6]));
/* ทุกจอ "รายการแผน" (ทุก journey) แสดงตารางเต็มหน้า 10 แถว + pagination แบบ A.1 (ผู้ใช้สั่ง 16 พ.ย. 2569)
   ยกเว้นเคสพิเศษ (ยังไม่มีแผน A.2 · ค้นไม่เจอ) · หน่วยงานอื่นใช้แม่แบบเดียวกับ LIST10_EXTRA เปลี่ยนเลขที่ MR ไม่ชนกัน และชื่อแผนที่มี "กกฟ.1" เป็นหน่วยงานนั้น
   ลงทะเบียนเจ้าของแผนใน PLAN_UNIT (ตัวแปรของ screens.js · แก้ตอนรันเท่านั้น ไม่แก้ไฟล์) ⇒ มุม กบค. คอลัมน์หน่วยงานเจ้าของเรื่องถูกต้อง */
const EXTRA_MR = { 'กกฟ.2': ['MRZ7100006', 'MRZ7100007', 'MRZ7100008', 'MRZ6900015', 'MRZ6900016', 'MRZ6800004', 'MRZ6800005', 'MRZ6800006'],
  'กรย.': ['MRZ7100009', 'MRZ7100010', 'MRZ7100011', 'MRZ6900017', 'MRZ6900018', 'MRZ6800007', 'MRZ6800008', 'MRZ6800009'] };
const EXTRA = { 'กกฟ.1': LIST10_EXTRA };
for (const [u, mrs] of Object.entries(EXTRA_MR)) EXTRA[u] = LIST10_EXTRA.map((r, i) => [mrs[i], r[1].replace('กกฟ.1', u)].concat(r.slice(2)));
for (const [u, rows] of Object.entries(EXTRA)) rows.forEach(r => { PLAN_UNIT[r[0]] = u; });
const unitPool = (u) => byDate(ownPlans(u).concat(EXTRA[u] || []));
const KBK_POOL = byDate([NEW_PLAN].concat(allPlans(), ...Object.values(EXTRA)));
/* 10 แถว · first = แผนที่ต้องอยู่แถวแรก (เมนู "…" ผูกกับแถวแรกของตาราง — planMenu/firstMenuCell) แล้วเติมแผนอื่นของหน่วยงานตามวันที่สร้าง */
const rows10 = (pool, first) => (first ? [first] : []).concat(pool.filter(r => !first || r[0] !== first[0])).slice(0, TABLE_MAX.rows);
const LIST10 = rows10(unitPool(UNITS[0]));
const PLAN_ACTIVE = unitPool(UNITS[0]).find(r => r[5] === 'active');
const LIST_OVERRIDE = {
  'A.1': () => listScreen('S1 รายการแผน', { rows: LIST10 }),
  'A.39': () => listScreen('S1 กกฟ.2 รายการแผน', { rows: rows10(unitPool('กกฟ.2')) }),
  'A.40': () => listScreen('S1 กรย. รายการแผน', { rows: rows10(unitPool('กรย.')) }),
  'A.31': () => listScreen('S1 กบค. รายการแผน', { rows: rows10(KBK_POOL), view: 'กบค.' }),
  'A.37': () => listScreen('S1 กบค. ตัวกรองรายการแผน', { rows: rows10(KBK_POOL), view: 'กบค.', filter: { units: ['กกฟ.1'], open: 'unit' } }),
  'R.1': async () => { const s = await listScreen('S19 เมนู', { rows: rows10(unitPool(UNITS[0]), planAs('returned')) }); planMenu(s, MENU); return s; },
  'R.9': async () => { const s = await listScreen('S19 เมนูอนุมัติแล้ว', { rows: rows10(unitPool(UNITS[0]), planAs('approved')) }); planMenu(s, MENU.slice(0, 2)); return s; },
  'R.11': async () => { const s = await listScreen('S19 เมนูดำเนินการ', { rows: rows10(unitPool(UNITS[0]), PLAN_ACTIVE) }); planMenu(s, MENU.slice(0, 1)); return s; },
  'S.1': async () => { const s = await listScreen('S20 เมนู', { rows: rows10(unitPool(UNITS[0]), NEW_PLAN) }); planMenu(s, MENU); return s; },
  'S.2': async () => { const s = await listScreen('S20 ยืนยันการลบ List', { rows: rows10(unitPool(UNITS[0]), NEW_PLAN) }); await confirm(s, DELETE_CONFIRM); return s; }
};
/* 17 พ.ย. 2569 ผู้ใช้สั่งเช็คช่องกรอกตามเคส: T.4 จอเดิมเปิดเลือกเบอร์น้ำมันอยู่ แต่รหัสน้ำมันกับจำนวนกรอกไว้แล้ว ⇒ ระหว่างเลือกเบอร์ ให้ 2 ช่องนั้นเป็น placeholder (เคสกรอกครบอยู่ที่ T.5 T.7) */
LIST_OVERRIDE['T.4'] = () => carPartsScreen('S21 เปลี่ยนน้ำมัน', { oil: 1, oilSpec: {}, gradeOpen: true });

/* ---------- Happy flow (ผู้ใช้สั่ง 17 พ.ย. 2569) — เส้นทางหลักสั้นๆ ของแต่ละ journey ไม่มีซีนย่อย วางก่อนชุดทุกเคส ----------
   [รหัสจอ, คำอธิบายขั้น, ชื่อหน้า] · ขั้นที่อยู่หน้าเดียวกันติดกันห่าง 200 · เปลี่ยนหน้าห่าง 500 · ยกจากทางเดินหัวข้อ 2 ของไฟล์ 32
   จอผลลัพธ์ (H:…) = รายการแผน 10 แถว + toast ซ้อนในจอ (notify ของ core) ให้เห็นผลในภาพเดียว · ชุดทุกเคสยังใช้ toast แยกชิ้น */
LIST_OVERRIDE['H:create'] = (async () => { const s = await listScreen('S1 บันทึกสำเร็จ', { rows: rows10(unitPool(UNITS[0]), NEW_PLAN) }); notify(s, FEATURE_TOASTS.S1.text); return s; });
LIST_OVERRIDE['H:edit'] = (async () => { const s = await listScreen('S19 บันทึกสำเร็จ', { rows: rows10(unitPool(UNITS[0]), NEW_PLAN) }); notify(s, FEATURE_TOASTS.S2.text); return s; });
LIST_OVERRIDE['H:delete'] = (async () => { const s = await listScreen('S20 ลบสำเร็จ', { rows: rows10(unitPool(UNITS[0]).filter(r => r[0] !== NEW_PLAN[0])) }); notify(s, FEATURE_TOASTS.S3.text); return s; });
const HAPPY = [
  [['A.2', 'รายการแผนว่าง กดสร้างแผน', 'หน้ารายการแผน'], ['A.3', 'ฟอร์มสร้างแผน', 'หน้าสร้างแผน'], ['A.7', 'เลือกยานพาหนะของพื้นที่', 'หน้าสร้างแผน'],
    ['A.10', 'ติ๊กยานพาหนะ', 'หน้าสร้างแผน'], ['A.11', 'เลือกไตรมาส', 'หน้าสร้างแผน'], ['A.12', 'จัดลงไตรมาสแล้ว', 'หน้าสร้างแผน'],
    ['T.2', 'เปิดหน้าจัดการอะไหล่ของยานพาหนะ', 'หน้าจัดการอะไหล่ของยานพาหนะ'], ['T.5', 'เลือกไส้กรองจากคลัง', 'หน้าจัดการอะไหล่ของยานพาหนะ'],
    ['T.10', 'บันทึกอะไหล่แล้ว กลับฟอร์ม', 'หน้าสร้างแผน'], ['A.30', 'ครบ กดบันทึกและส่งอนุมัติ', 'หน้าสร้างแผน'], ['H:create', 'ส่งอนุมัติสำเร็จ', 'หน้ารายการแผน']],
  [['A.1', 'รายการแผน', 'หน้ารายการแผน'], ['A.20', 'รายละเอียดแผน', 'หน้ารายละเอียดแผน']],
  [['R.1', 'เมนู … แก้ไข', 'หน้ารายการแผน'], ['R.3', 'ฟอร์มแก้ไขแผน', 'หน้าแก้ไขแผน'], ['R.6', 'ยืนยันการแก้ไข', 'หน้าแก้ไขแผน'], ['H:edit', 'แก้ไขสำเร็จ รออนุมัติใหม่', 'หน้ารายการแผน']],
  [['S.1', 'เมนู … ลบ', 'หน้ารายการแผน'], ['S.2', 'ยืนยันการลบ', 'หน้ารายการแผน'], ['H:delete', 'ลบสำเร็จ', 'หน้ารายการแผน']],
  [['B.1', 'แผนรออนุมัติ', 'หน้าแผนรออนุมัติ'], ['B.2', 'พิจารณาแผน', 'หน้าพิจารณาแผน'], ['B.3', 'ยืนยันอนุมัติ', 'หน้าพิจารณาแผน'], ['B.4', 'อนุมัติสำเร็จ', 'หน้าพิจารณาแผน']]];
/* toast ของ feature (ข้อความลอกจาก notify() ใน screens.js) · page/when = ป้ายบอกว่าแสดงที่ไหน เมื่อไหร่ */
const FEATURE_TOASTS = {
  S1: { text: 'ส่งแผนบำรุงรักษาเพื่ออนุมัติสำเร็จ', page: 'รายการแผน', when: 'บันทึกและส่งอนุมัติสำเร็จ', was: 'A.19' },
  S2: { text: 'บันทึกการแก้ไขแผนและส่งอนุมัติสำเร็จ', page: 'รายการแผน', when: 'ยืนยันการแก้ไขสำเร็จ', was: 'R.8' },
  S3: { text: 'ลบแผนบำรุงรักษาสำเร็จ', page: 'รายการแผน', when: 'ลบสำเร็จ', was: 'S.3' },
  S4: { text: 'อนุมัติแผนบำรุงรักษาสำเร็จ', page: 'พิจารณาแผน', when: 'ยืนยันอนุมัติสำเร็จ', was: 'B.4' },
  S5: { text: 'ส่งแผนกลับให้ผู้สร้างแผนแก้ไขแล้ว', page: 'แผนรออนุมัติ', when: 'ยืนยันส่งกลับสำเร็จ', was: 'B.8' },
  T1: { text: 'บันทึกอะไหล่ของยานพาหนะ ' + CAND[0][0] + ' แล้ว', page: 'สร้างแผน', when: 'บันทึกอะไหล่ของยานพาหนะสำเร็จ', was: 'T.10' },
  T2: { text: 'จัดยานพาหนะ 3 คันลงไตรมาส 1 สำเร็จ', page: 'สร้างแผน', when: 'จัดลงไตรมาส หรือเพิ่มเข้าไตรมาสสำเร็จ', was: 'A.12' },
  T3: { text: 'เอายานพาหนะออกจากไตรมาส 1 สำเร็จ', page: 'สร้างแผน', when: 'ยืนยันเอายานพาหนะออกจากไตรมาส', was: 'A.36' },
  E1: { text: 'general error', err: true, page: 'หน้าที่กดบันทึก', when: 'บันทึกไม่สำเร็จ อยู่หน้าเดิม ข้อมูลไม่หาย', was: 'A.18 R.7 T.9' }
};
/* โครง feature แบบตัว Z (ผู้ใช้สั่ง 16 พ.ย. 2569 "journey สร้างแผนวิ่งยาวแนวเดียวกัน … จบแต่ละ journey ก็มาเริ่มอันใหม่ที่ด้านล่าง เหมือนตัว Z")
   Title หลัก → journey (1 แถวยาว) → หน้า (เรียงตามทางเดิน 1 หน้าครั้งเดียวต่อ journey) → case · ตรงหัวข้อ 2 ของไฟล์ 32 (J1–J5)
   [รหัสจอเดิม, ป้าย case] หรือ ['toast:<รหัส>'] · ฉากย่อยในหน้าสร้างแผนใส่ชื่อฉากนำหน้าป้าย case · toast อยู่ในหน้าที่มันแสดง */
const FEATURE_TITLE = 'แผนบำรุงรักษา';
const FEATURE = [
  { title: 'สร้างแผน', pages: [
    { name: 'หน้ารายการแผน', items: [['A.2', 'Default ไม่มีแผน'], ['A.1', 'Filled มีแผน 10 รายการ'], ['toast:S1']] },
    { name: 'หน้าสร้างแผน', items: [
      ['A.3', 'ข้อมูลแผน · Default ยังไม่กรอกข้อมูล'], ['A.4', 'ข้อมูลแผน · Interaction เลือกปีงบประมาณ'], ['A.16', 'ข้อมูลแผน · Error Validation Field'],
      ['A.5', 'เลือกยานพาหนะ · Interaction แผงตัวกรอง ยังไม่เลือก'], ['A.6', 'เลือกยานพาหนะ · Interaction เลือกภาค เขต'], ['A.7', 'เลือกยานพาหนะ · Filled ยานพาหนะทั้งหมดของพื้นที่'],
      ['A.8', 'เลือกยานพาหนะ · Filled ค้นหาและกรองแล้ว'], ['A.9', 'เลือกยานพาหนะ · Empty result ไม่พบยานพาหนะ'], ['A.15', 'เลือกยานพาหนะ · Interaction เอาตัวกรองออก ยานพาหนะที่จัดแล้วยังอยู่'],
      ['A.10', 'จัดลงไตรมาส · Interaction ติ๊กยานพาหนะ'], ['A.11', 'จัดลงไตรมาส · Interaction popup จัดลงไตรมาส'], ['A.12', 'จัดลงไตรมาส · Filled จัดลงไตรมาสแล้ว'], ['A.14', 'จัดลงไตรมาส · Interaction ย้ายไปไตรมาสอื่น'],
      ['A.23', 'จัดลงไตรมาส · Interaction ไตรมาสว่าง'], ['A.24', 'จัดลงไตรมาส · Interaction popup เพิ่มเข้าไตรมาส'], ['A.25', 'จัดลงไตรมาส · Interaction ติ๊กแล้ว ปุ่มเพิ่มกดได้'], ['A.26', 'จัดลงไตรมาส · Filled เพิ่มเข้าไตรมาสแล้ว'],
      ['A.27', 'จัดลงไตรมาส · Interaction ไม่มียานพาหนะให้เพิ่ม'], ['A.33', 'จัดลงไตรมาส · Interaction เมนู … ของยานพาหนะ'], ['A.35', 'จัดลงไตรมาส · Confirm เอาออกจากไตรมาส'], ['A.36', 'จัดลงไตรมาส · Filled เอาออกแล้ว กลับเป็นยังไม่จัด'],
      ['toast:T2'], ['toast:T3'],
      ['T.1', 'อะไหล่รายคัน · Default ยังไม่กำหนด'], ['T.10', 'อะไหล่รายคัน · Filled กำหนดแล้วบางคัน'], ['T.13', 'อะไหล่รายคัน · Filled มีคันไม่เบิกอะไหล่'], ['A.13', 'อะไหล่รายคัน · Filled อะไหล่ในไตรมาสครบ'], ['A.38', 'อะไหล่รายคัน · Filled อะไหล่รวมทุกไตรมาส'], ['toast:T1'],
      ['A.28', 'บันทึกและส่งอนุมัติ · Disabled จัดลงไตรมาสไม่ครบ'], ['A.29', 'บันทึกและส่งอนุมัติ · Disabled อะไหล่ไม่ครบ'], ['A.30', 'บันทึกและส่งอนุมัติ · Filled ครบ ปุ่มบันทึกกดได้'], ['A.17', 'บันทึกและส่งอนุมัติ · Confirm ยืนยันการออก'], ['toast:E1']] },
    { name: 'หน้าจัดการอะไหล่ของยานพาหนะ', items: [['T.2', 'Default ยังไม่กำหนด'], ['T.3', 'Interaction เลือกยานพาหนะคันอื่น'], ['T.11', 'Disabled เบิกแต่ยังไม่เลือกอะไหล่'],
      ['T.4', 'Interaction เลือกเบอร์น้ำมัน'], ['T.5', 'Filled ไส้กรองจากคลัง'], ['T.6', 'Interaction popup อะไหล่เพิ่มเติม'], ['T.7', 'Filled มีอะไหล่ที่ระบุเอง'], ['T.12', 'Filled ไม่เบิก'], ['T.8', 'Confirm ยืนยันการออก'], ['toast:E1']] },
    { name: 'หน้าดูอะไหล่ของยานพาหนะ', items: [['A.34', 'Filled ดูอย่างเดียว']] }] },
  { title: 'ดูแผน', pages: [
    { name: 'หน้ารายการแผน', items: [['A.39', 'Role กกฟ.2'], ['A.40', 'Role กรย.'], ['A.31', 'Role กบค. เห็นทุกหน่วยงาน'], ['A.37', 'Interaction ตัวกรองของ กบค.']] },
    { name: 'หน้ารายละเอียดแผน', items: [['A.20', 'Status รออนุมัติ'], ['A.21', 'Status อนุมัติแล้ว'], ['A.22', 'Status ส่งกลับแก้ไข'], ['A.32', 'Role กบค. ดูแผนหน่วยงานอื่น']] }] },
  { title: 'แก้ไขแผน', pages: [
    { name: 'หน้ารายการแผน', items: [['R.1', 'Interaction เมนู … แผนส่งกลับแก้ไข'], ['R.9', 'Interaction เมนู … แผนอนุมัติแล้ว'], ['R.11', 'Interaction เมนู … แผนดำเนินการแล้ว'], ['toast:S2']] },
    { name: 'หน้าแก้ไขแผน', items: [['R.3', 'Filled แผนที่ถูกส่งกลับ'], ['R.10', 'Filled แผนที่อนุมัติแล้ว'], ['R.4', 'Interaction เอาตัวกรองออก'], ['R.6', 'Confirm ยืนยันการแก้ไข'], ['R.5', 'Confirm ยืนยันการออก'], ['toast:E1']] }] },
  { title: 'ลบแผน', pages: [
    { name: 'หน้ารายการแผน', items: [['S.1', 'Interaction เมนู … มีลบ'], ['S.2', 'Confirm ยืนยันการลบแผน'], ['toast:S3']] },
    { name: 'หน้ารายละเอียดแผน', items: [['S.5', 'Confirm ยืนยันการลบแผน']] }] },
  { title: 'อนุมัติแผน', pages: [
    { name: 'หน้าแผนรออนุมัติ', items: [['B.1', 'Filled มีแผนรออนุมัติ'], ['toast:S5']] },
    { name: 'หน้าพิจารณาแผน', items: [['B.2', 'Default ผลการพิจารณายังไม่เลือก'], ['B.5', 'Interaction เลือกส่งกลับแก้ไข'], ['B.6', 'Error Validation Field ไม่ระบุเหตุผล'],
      ['B.3', 'Confirm ยืนยันอนุมัติ'], ['B.7', 'Confirm ยืนยันส่งกลับ'], ['B.4', 'Status อนุมัติแล้ว'], ['B.9', 'Interaction อะไหล่แท็บไตรมาส 2'], ['toast:S4']] }] }
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
  M1: { text: MOVE_TOAST, page: 'หน้าไตรมาส', when: 'ยืนยันย้ายยานพาหนะไปไตรมาสอื่นสำเร็จ', was: 'X.7' }
};

/* Happy flow: จอผลลัพธ์ที่จอเดิมไม่ได้สร้างในชุดทุกเคส (E.18 แปลงเป็น toast S2) ⇒ ทำเป็น H: ด้วยฟังก์ชันจอและตัวเลือกเดียวกับจอเดิม */
const SCREENS = {
  'H:resubmit': async () => { const s = await tripList('S6 ส่งอนุมัติใหม่', { trips: [Object.assign(tripAs(TRIP_1, 'review'), { d1: '10/11/2569', d2: '14/11/2569', works: {} })] }); notify(s, TOASTS.S2.text); return s; }
};

/* [รหัสจอ, คำอธิบายขั้น, ชื่อหน้า] journey ละ 1 รายการ เรียงตาม JOURNEYS */
const HAPPY = [
  [['E.1', 'เมนู … ดูรายละเอียดแผนที่อนุมัติแล้ว', 'หน้ารายการแผน'], ['E.2', 'กดไปหน้าไตรมาส 1', 'หน้ารายละเอียดแผน'],
    ['E.3', 'ยังไม่มีแผนเดินทาง กดสร้างแผนเดินทาง', 'หน้าไตรมาส'], ['E.4', 'ฟอร์มสร้างแผนเดินทาง', 'หน้าสร้างแผนเดินทาง'],
    ['E.10', 'เลือกช่วงวันเดินทาง', 'หน้าสร้างแผนเดินทาง'], ['E.5', 'เพิ่มยานพาหนะ', 'หน้าสร้างแผนเดินทาง'], ['E.6', 'เพิ่มยานพาหนะแล้ว', 'หน้าสร้างแผนเดินทาง'],
    ['E.12', 'กรอกครบ กดยืนยัน', 'หน้าสร้างแผนเดินทาง'], ['E.13', 'สร้างแผนเดินทางสำเร็จ รออนุมัติ', 'หน้าไตรมาส']],
  [['F.1', 'แผนเดินทางรออนุมัติ', 'หน้าแผนเดินทางรออนุมัติ'], ['F.2', 'ตรวจสอบแผนเดินทาง', 'หน้าตรวจสอบแผนเดินทาง'],
    ['F.3', 'ยืนยันอนุมัติ', 'หน้าตรวจสอบแผนเดินทาง'], ['F.4', 'อนุมัติสำเร็จ', 'หน้าตรวจสอบแผนเดินทาง']],
  [['E.16', 'แผนเดินทางถูกส่งกลับแก้ไข', 'หน้าไตรมาส'], ['E.17', 'แก้ไขแผนเดินทาง กดส่งอนุมัติใหม่', 'หน้าแก้ไขแผนเดินทาง'], ['H:resubmit', 'ส่งอนุมัติใหม่สำเร็จ', 'หน้าไตรมาส']],
  [['G.1', 'มีแจ้งเตือนใหม่', 'หน้าแผนเดินทางบำรุงรักษา'], ['G.2', 'เปิดแผงแจ้งเตือน', 'หน้าแผนเดินทางบำรุงรักษา'], ['G.3', 'ดูแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง']],
  [['H.1', 'เลือกจ้างดำเนินการ', 'หน้าสร้างแผนเดินทาง'], ['H.2', 'เลือกผู้รับจ้าง', 'หน้าสร้างแผนเดินทาง'], ['H.3', 'เพิ่มยานพาหนะ', 'หน้าสร้างแผนเดินทาง'],
    ['H.6', 'กรอกครบ กดยืนยัน', 'หน้าสร้างแผนเดินทาง'], ['H.7', 'สร้างแผนเดินทางจ้างสำเร็จ รออนุมัติ', 'หน้าไตรมาส']],
  [['E.19', 'เพิ่มยานพาหนะเข้าไตรมาส', 'หน้าไตรมาส'], ['E.20', 'เพิ่มเข้าไตรมาสสำเร็จ', 'หน้าไตรมาส']],
  [['X.1', 'ยานพาหนะบำรุงรักษาไม่ได้', 'หน้าไตรมาส'], ['X.2', 'เมนู … ย้ายไปไตรมาสอื่น', 'หน้าไตรมาส'], ['X.4', 'เลือกไตรมาส 2', 'หน้าไตรมาส'],
    ['X.6', 'ยืนยันการย้าย', 'หน้าไตรมาส'], ['X.7', 'ย้ายสำเร็จ', 'หน้าไตรมาส']]];

/* โครง Feature แบบตัว Z: journey → หน้า (เรียงตามทางเดิน 1 หน้าครั้งเดียวต่อ journey) → case · ตรงหัวข้อ 2 ของไฟล์ 33 (J1–J7)
   ฉากย่อยในหน้าสร้างแผนเดินทางใส่ชื่อฉากนำหน้าป้าย case · toast อยู่ในหน้าที่มันแสดง */
const JOURNEYS = [
  { title: 'ทำแผนเดินทาง', pages: [
    { name: 'หน้ารายการแผน', items: [['E.1', 'Interaction เมนู … แผนอนุมัติแล้ว']] },
    { name: 'หน้ารายละเอียดแผน', items: [['E.2', 'Status อนุมัติแล้ว ปุ่มไปหน้าไตรมาส 1']] },
    { name: 'หน้าไตรมาส', items: [['E.3', 'Default ยังไม่มีแผนเดินทาง'], ['E.13', 'Filled แผนเดินทางรออนุมัติ 1 ใบ'], ['E.15', 'Disabled ยานพาหนะครบทุกคัน ปุ่มสร้างแผนเดินทางกดไม่ได้'], ['toast:S1']] },
    { name: 'หน้าสร้างแผนเดินทาง', items: [
      ['E.4', 'ข้อมูลแผนเดินทาง · Default ยังไม่กรอกข้อมูล'], ['E.10', 'ข้อมูลแผนเดินทาง · Interaction เลือกช่วงวันเดินทาง'],
      ['E.5', 'ยานพาหนะ · Interaction popup เพิ่มยานพาหนะ'], ['E.6', 'ยานพาหนะ · Filled เพิ่มยานพาหนะแล้ว'],
      ['E.7', 'ยานพาหนะ · Interaction popup แก้ไขยานพาหนะในแผนเดินทาง'], ['E.24', 'ยานพาหนะ · Interaction เลือกวันดำเนินการ'],
      ['E.8', 'ยานพาหนะ · Filled เอายานพาหนะออกจากแผนเดินทาง'], ['E.9', 'ยานพาหนะ · Interaction เพิ่มยานพาหนะอีกครั้ง'],
      ['E.14', 'ยานพาหนะ · Interaction ใบถัดไป ยานพาหนะในใบอื่นเลือกไม่ได้'],
      ['E.11', 'ยืนยัน · Error Validation Field'], ['E.12', 'ยืนยัน · Filled กรอกครบ วันดำเนินการรายคัน']] }] },
  { title: 'อนุมัติแผนเดินทาง', pages: [
    { name: 'หน้าแผนเดินทางรออนุมัติ', items: [['F.1', 'Filled มีแผนเดินทางรออนุมัติ'], ['toast:S4']] },
    { name: 'หน้าตรวจสอบแผนเดินทาง', items: [['F.2', 'Default ผลการพิจารณายังไม่เลือก'], ['F.5', 'Interaction เลือกส่งกลับแก้ไข'], ['F.6', 'Error Validation Field ไม่ระบุเหตุผล'],
      ['F.3', 'Confirm ยืนยันอนุมัติ'], ['F.7', 'Confirm ยืนยันส่งกลับ'], ['F.4', 'Status อนุมัติแล้ว'], ['toast:S3']] }] },
  { title: 'แก้ไขแผนเดินทางที่ถูกส่งกลับ', pages: [
    { name: 'หน้าไตรมาส', items: [['E.16', 'Status แผนเดินทางส่งกลับแก้ไข'], ['toast:S2']] },
    { name: 'หน้าแก้ไขแผนเดินทาง', items: [['E.17', 'Filled แผนเดินทางที่ถูกส่งกลับ']] }] },
  { title: 'รับแจ้งเตือนแผนเดินทาง', pages: [
    { name: 'หน้าแผนเดินทางบำรุงรักษา', items: [['G.1', 'Interaction มีแจ้งเตือนใหม่ ของ กรย.'], ['G.2', 'Interaction แผงแจ้งเตือน ของ กรย.'], ['G.4', 'Interaction แผงแจ้งเตือน ของหน่วยงานเจ้าของยานพาหนะ']] },
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['G.3', 'Filled ดูอย่างเดียว ยานพาหนะทุกคันในใบ ของ กรย.'], ['G.5', 'Filled ดูอย่างเดียว เฉพาะยานพาหนะของหน่วยงาน']] }] },
  { title: 'แผนเดินทางจ้างดำเนินการ', pages: [
    { name: 'หน้าสร้างแผนเดินทาง', items: [['H.1', 'Interaction เลือกจ้างดำเนินการ ช่องผู้รับจ้างขึ้น'], ['H.2', 'Interaction รายชื่อผู้รับจ้าง'],
      ['H.3', 'Interaction popup เพิ่มยานพาหนะ ใบอื่นเลือกไม่ได้'], ['H.4', 'Interaction popup แก้ไขยานพาหนะ ช่วงวันทำงาน'], ['H.5', 'Error Validation Field'], ['H.6', 'Filled กรอกครบ']] },
    { name: 'หน้าไตรมาส', items: [['H.7', 'Filled แผนเดินทางจ้างรออนุมัติ'], ['toast:S1']] }] },
  { title: 'เพิ่ม เอาออก แก้ไขยานพาหนะในไตรมาส', pages: [
    { name: 'หน้าไตรมาส', items: [['E.19', 'Interaction popup เพิ่มยานพาหนะเข้าไตรมาส'], ['E.20', 'Filled เพิ่มเข้าไตรมาสแล้ว'], ['toast:Q1'],
      ['E.21', 'Interaction popup แก้ไขผู้ดูแลยานพาหนะและสถานที่'], ['E.22', 'Confirm เอายานพาหนะออกจากไตรมาส'], ['E.23', 'Filled เอาออกแล้ว'], ['toast:Q2']] }] },
  { title: 'ย้ายยานพาหนะไปไตรมาสอื่น', pages: [
    { name: 'หน้าไตรมาส', items: [['X.1', 'Status ยานพาหนะบำรุงรักษาไม่ได้'], ['X.2', 'Interaction เมนู … ย้ายไปไตรมาสอื่น'], ['X.3', 'Interaction popup ยังไม่เลือกไตรมาส'],
      ['X.4', 'Interaction เลือกไตรมาส 2 ปุ่มย้ายกดได้'], ['X.5', 'Interaction ไตรมาส 3 ไตรมาสก่อนหน้าเลือกไม่ได้'], ['X.6', 'Confirm ยืนยันการย้าย'],
      ['X.7', 'Filled ย้ายแล้ว ไตรมาส 1 ไม่มียานพาหนะคันนี้'], ['toast:M1'], ['X.8', 'Filled ไตรมาส 2 ยานพาหนะและอะไหล่ที่ย้ายมา'], ['X.10', 'Disabled ไตรมาส 4 เมนูย้ายกดไม่ได้']] }] }
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
   features/job.js — Feature งานบำรุงรักษารายคัน (S10 S23 S12 S13 S14) · 17 พ.ย. 2569
   เอกสาร: Diagram/01-บำรุงรักษาตามวาระ/34-บำรุงรักษา-feature-งานรายคัน-สำหรับ-dev.md
   รูปแบบเดียวกับ features/plan.js (หัวไฟล์นั้นอธิบายทุกฟิลด์) · ไม่วาดจอเอง ใช้จอเดิมของ maintainance-plugin/screens.js ทุกจอ
   บล็อกจอเดิม (BLOCK_OF): S10 = I · S12 = K · S13 = L · S14 = M · S23 = V (มีเส้นทางย่อย ⇒ รหัสซ้อน V.4.1 …)
   จอที่ไม่สร้าง (หัวข้อ 1 ของไฟล์ 34):
     · toast เต็มหน้า I.28 (= I.1 + toast ส่งออกไฟล์สำเร็จ) ⇒ toast X1 ชิ้นเดียว
     · หน้าตาซ้ำ K.1 = I.13 (stepPage step 2 filled ค่าเดียวกัน) · K.2 = I.14 (tripDetail JOB_MIX + รอผลตรวจน้ำมัน + toast เดียวกัน)
   ============================================================================ */
MF_FEATURES.push((() => {
/* toast ของ feature (ข้อความลอกจาก notify() ของจอเดิมใน screens.js) · page/when = ป้ายบอกว่าแสดงที่ไหน เมื่อไหร่ · was = จอเดิมที่มี toast นี้ */
const TOASTS = {
  W1: { text: 'เริ่มงานบำรุงรักษาแล้ว', page: 'บันทึกงานรายคัน', when: 'กดเริ่มงาน เข้าสู่ Step 1', was: 'I.6 V.4.1' },
  W2: { text: 'บันทึกงานบำรุงรักษาสำเร็จ', page: 'รายละเอียดแผนเดินทาง', when: 'ปิดงานรายคันสำเร็จ', was: 'I.14 I.15 V.6 K.2' },
  W3: { text: 'บันทึกบำรุงรักษาไม่ได้แล้ว', page: 'รายละเอียดแผนเดินทาง', when: 'ยืนยันบำรุงรักษาไม่ได้สำเร็จ', was: 'I.20' },
  W4: { text: 'บันทึกเอกสาร Safety Inspection สำเร็จ', page: 'งานรายคัน', when: 'บันทึกเอกสาร Safety Inspection ภายหลังสำเร็จ', was: 'I.24' },
  X1: { text: 'ส่งออกไฟล์สำเร็จ', page: 'รายละเอียดแผนเดินทาง', when: 'ส่งออกแผนเดินทางสำเร็จ', was: 'I.28' },
  V1: { text: 'ส่งตรวจงานแล้ว', page: 'งานรายคัน', when: 'ผู้รับจ้างยืนยันส่งตรวจงานสำเร็จ', was: 'V.10' },
  K1: { text: 'บันทึกผลการทดสอบน้ำมันไฮโดรลิกสำเร็จ', page: 'งานรายคัน', when: 'บันทึกผลการทดสอบน้ำมันไฮโดรลิกสำเร็จ', was: 'K.7' },
  L1: { text: 'ยอมรับผลการตรวจบำรุงยานพาหนะ ' + V[0] + ' สำเร็จ', page: 'การตรวจบำรุงยานพาหนะรอตรวจสอบ', when: 'ยืนยันยอมรับผลรายคันสำเร็จ', was: 'L.5' },
  M1: { text: 'ยอมรับผลการตรวจบำรุงยานพาหนะทั้งแผนสำเร็จ', page: 'หลักฐานทั้งแผน', when: 'ยืนยันยอมรับผลทั้งแผนสำเร็จ', was: 'M.5' }
};

/* ช่อง "รวม (บาท)" ก่อนกรอก (I.9 I.10 I.19) ใช้จอเดิม State Readonly ค่า 0 — ผู้ใช้เคาะ 17 พ.ย. 2569 "อ่านอย่างเดียว แบบจอเดิม" (เดิมปลั๊กอินปรับเป็น Default ยกเลิกแล้ว) */

/* Happy flow — จอผลลัพธ์ที่จอเดิมถูกแปลงเป็น toast (I.28) ทำเป็น H: ให้เห็นผลในภาพเดียว (เรียกฟังก์ชันจอเดิมด้วยค่าเดียวกับ I.28) */
const SCREENS = {
  'H:export': async () => { const s = await tripDetail('S10 ส่งออกแผนเดินทางสำเร็จ', {}); notify(s, TOASTS.X1.text); return s; }
};
const HAPPY = [
  [['I.1', 'รายละเอียดแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง'], ['I.5', 'งานรายคัน กดเริ่มงาน', 'หน้างานรายคัน'],
    ['I.6', 'Step 1 ตรวจสภาพก่อนบำรุงรักษา', 'หน้าบันทึกงานรายคัน'], ['I.8', 'ตรวจรายการและลงนามครบ', 'หน้าบันทึกงานรายคัน'],
    ['I.9', 'Step 2 สรุปงานก่อนปิดงาน', 'หน้าบันทึกงานรายคัน'], ['I.13', 'กรอกผลงานครบ กดปิดงาน', 'หน้าบันทึกงานรายคัน'],
    ['I.14', 'ปิดงานสำเร็จ', 'หน้ารายละเอียดแผนเดินทาง']],
  [['I.1', 'รายละเอียดแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง'], ['I.27', 'กดส่งออก เลือกรูปแบบไฟล์', 'หน้ารายละเอียดแผนเดินทาง'],
    ['H:export', 'ส่งออกไฟล์สำเร็จ', 'หน้ารายละเอียดแผนเดินทาง']],   // ไฟล์ PDF ไม่ใส่ใน happy: ป้ายขั้นทำให้ชื่อเฟรมไม่ขึ้นต้น " — ไฟล์ PDF" ⇒ ไม่ได้ข้อยกเว้นขนาด A4 (R32)
  [['I.25', 'เมนู … ของยานพาหนะในแผนจ้าง', 'หน้ารายละเอียดแผนเดินทาง'], ['I.26', 'Step 2 ปิดงานแทนผู้รับจ้าง', 'หน้าบันทึกงานรายคัน']],
  [['V.1', 'รายละเอียดแผนเดินทาง', 'หน้ารายละเอียดแผนเดินทาง'], ['V.3', 'งานรายคัน กดเริ่มงาน', 'หน้างานรายคัน'],
    ['V.4.1', 'Step 1 ตรวจสภาพก่อนบำรุงรักษา', 'หน้าบันทึกงานรายคัน'], ['V.4.3', 'ตรวจรายการและลงนามครบ', 'หน้าบันทึกงานรายคัน'],
    ['V.5.1', 'Step 2 สรุปงานก่อนปิดงาน', 'หน้าบันทึกงานรายคัน'], ['V.5.3', 'กรอกผลงานครบ กดปิดงาน', 'หน้าบันทึกงานรายคัน'],
    ['V.6', 'ปิดงานสำเร็จ', 'หน้ารายละเอียดแผนเดินทาง'], ['V.7', 'งานรายคัน กดส่งตรวจงาน', 'หน้างานรายคัน'],
    ['V.9', 'ยืนยันส่งตรวจงาน', 'หน้างานรายคัน'], ['V.10', 'ส่งตรวจงานแล้ว รอตรวจรับ', 'หน้างานรายคัน']],
  [['I.14', 'ป้ายรอผลตรวจน้ำมัน', 'หน้ารายละเอียดแผนเดินทาง'], ['K.3', 'เมนู … ดูรายละเอียด', 'หน้ารายละเอียดแผนเดินทาง'],
    ['K.4', 'งานรายคัน ส่วนผลการทดสอบ', 'หน้างานรายคัน'], ['K.6', 'เลือกผลและแนบไฟล์', 'หน้างานรายคัน'], ['K.7', 'บันทึกผลสำเร็จ', 'หน้างานรายคัน']],
  [['L.1', 'รายการรอตรวจสอบ', 'หน้าการตรวจบำรุงยานพาหนะรอตรวจสอบ'], ['L.2', 'ผลการตรวจรายคัน', 'หน้าผลการตรวจบำรุงยานพาหนะรายคัน'],
    ['L.4', 'ยืนยันยอมรับผล', 'หน้าผลการตรวจบำรุงยานพาหนะรายคัน'], ['L.5', 'ยอมรับผลสำเร็จ', 'หน้าการตรวจบำรุงยานพาหนะรอตรวจสอบ']],
  [['M.1', 'รายการ ครบทุกคันแล้ว', 'หน้าการตรวจบำรุงยานพาหนะรอตรวจสอบ'], ['M.2', 'หลักฐานทั้งแผน', 'หน้าหลักฐานทั้งแผน'],
    ['M.3', 'ประเมินความพึงพอใจ', 'หน้าหลักฐานทั้งแผน'], ['M.4', 'ยืนยันยอมรับผลทั้งแผน', 'หน้าหลักฐานทั้งแผน'], ['M.5', 'ยอมรับผลทั้งแผนสำเร็จ', 'หน้าหลักฐานทั้งแผน']]
];

/* journey → หน้า (เรียงตามทางเดิน 1 หน้าครั้งเดียวต่อ journey) → case · ตรงหัวข้อ 2 ของไฟล์ 34 (J1–J7)
   หน้าบันทึกงานรายคัน = หน้าเดียวมี stepper 2 ขั้น ⇒ ใส่ชื่อขั้นนำหน้าป้าย case */
const JOURNEYS = [
  { title: 'บันทึกงานรายคัน ดำเนินการเอง', pages: [
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['I.1', 'Default ยังไม่เริ่มงาน ตรวจแล้ว 0/4'], ['I.2', 'Interaction เมนู … ของยานพาหนะ'],
      ['I.3', 'Interaction แก้ไขยานพาหนะในแผนเดินทาง'], ['I.4', 'Confirm เอายานพาหนะออกจากแผนเดินทาง'],
      ['I.14', 'Status ปิดงานแล้ว รอผลตรวจน้ำมัน'], ['I.15', 'Status ปิดงานแล้ว ไม่เก็บตัวอย่างน้ำมัน'], ['I.20', 'Status บำรุงรักษาไม่ได้ ตรวจแล้ว 0/3'],
      ['toast:W2'], ['toast:W3']] },
    { name: 'หน้างานรายคัน', items: [['I.5', 'Default ยังไม่เริ่มงาน'], ['I.16', 'Interaction บำรุงรักษาไม่ได้ ระบุสาเหตุแล้ว'], ['I.17', 'Error Validation Field บำรุงรักษาไม่ได้ ยังไม่ระบุสาเหตุ'],
      ['I.21', 'Status เสร็จสิ้น งานที่ปิดแล้ว'], ['I.23', 'Interaction เพิ่มเอกสาร Safety Inspection ภายหลัง'], ['I.24', 'Filled บันทึกเอกสาร Safety Inspection แล้ว'], ['toast:W4']] },
    { name: 'หน้าบันทึกงานรายคัน', items: [
      ['I.6', 'Step 1 · Default ตรวจสภาพก่อนบำรุงรักษา'], ['I.35', 'Step 1 · Interaction แก้วันดำเนินการของคันนี้'], ['I.7', 'Step 1 · Interaction ลงนามการตรวจสภาพ'],
      ['I.8', 'Step 1 · Filled ตรวจรายการและลงนามครบ'], ['I.33', 'Step 1 · Default แบบตรวจรถพ่วงฉีดน้ำ'], ['I.34', 'Step 1 · Filled รถพ่วงฉีดน้ำ ลงนามครบ'],
      ['I.18', 'Step 1 · Interaction บำรุงรักษาไม่ได้ คืนอะไหล่ตามแผนทั้งหมด'], ['toast:W1'],
      ['I.9', 'Step 2 · Default สรุปงานก่อนปิดงาน'], ['I.10', 'Step 2 · Error Validation Field'], ['I.11', 'Step 2 · Interaction ปฏิทินวันที่เปลี่ยนน้ำมันครั้งล่าสุด'],
      ['I.12', 'Step 2 · Interaction งบที่ตัด หน่วยงานอื่น ระบุศูนย์ต้นทุน'], ['I.22', 'Step 2 · Filled แนบเอกสาร Safety Inspection'], ['I.13', 'Step 2 · Filled กรอกผลงานครบ'],
      ['I.19', 'Step 2 · Interaction บำรุงรักษาไม่ได้ อะไหล่ที่ใช้ไปแล้ว']] }] },
  { title: 'ส่งออกแผนเดินทาง', pages: [
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['I.27', 'Interaction popup รูปแบบไฟล์'], ['toast:X1']] },
    { name: 'ไฟล์ PDF แผนเดินทาง', items: [['I.29', 'ไฟล์ PDF หน้า 1 · Filled รายละเอียดแผนเดินทางและยานพาหนะ'], ['I.30', 'ไฟล์ PDF หน้า 2 · Filled อะไหล่ของแผนเดินทาง']] },
    { name: 'ไฟล์ Excel แผนเดินทาง', items: [['I.31', 'ไฟล์ Excel ชีตยานพาหนะ · Filled ยานพาหนะในแผนเดินทาง'], ['I.32', 'ไฟล์ Excel ชีตอะไหล่ · Filled อะไหล่ของแผนเดินทาง']] }] },
  { title: 'หน่วยงานปิดงานแทนผู้รับจ้าง', pages: [
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['I.25', 'Interaction เมนู … ของยานพาหนะ แผนจ้างดำเนินการ']] },
    { name: 'หน้าบันทึกงานรายคัน', items: [['I.26', 'Step 2 · Filled ปิดงานแทนผู้รับจ้าง'], ['toast:W2']] }] },
  { title: 'ผู้รับจ้างบันทึกงานและส่งตรวจ', pages: [
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['V.1', 'Default ยังไม่เริ่มงาน ตรวจแล้ว 0/6'], ['V.2', 'Interaction เมนู … ดูรายละเอียดอย่างเดียว'],
      ['V.6', 'Status ดำเนินการบำรุงรักษาแล้ว ตรวจแล้ว 1/6'], ['V.13', 'Status งานรายคันระหว่างทาง ตรวจแล้ว 2/6'], ['toast:W2']] },
    { name: 'หน้างานรายคัน', items: [['V.3', 'Default ยังไม่เริ่มงาน อะไหล่ตามแผนดูอย่างเดียว'], ['V.11.1', 'Interaction บำรุงรักษาไม่ได้ ระบุสาเหตุ'],
      ['V.7', 'Status ดำเนินการบำรุงรักษาแล้ว ปุ่มแก้ไขงาน ส่งตรวจงาน'], ['V.8.1', 'Interaction แก้จำนวนอะไหล่ที่ใช้จริง'], ['V.8.2', 'Interaction popup เพิ่มอะไหล่ที่ใช้จริง'],
      ['V.8.3', 'Confirm ลบอะไหล่'], ['V.9', 'Confirm ยืนยันส่งตรวจงาน'], ['V.10', 'Status รอตรวจรับ'], ['V.11.3', 'Status แจ้งบำรุงรักษาไม่ได้'],
      ['V.12.1', 'Status ถูกส่งกลับแก้ไข คันที่ปิดงานไว้'], ['V.12.2', 'Status ถูกส่งกลับแก้ไข คันที่แจ้งบำรุงรักษาไม่ได้'], ['toast:V1']] },
    { name: 'หน้าบันทึกงานรายคัน', items: [['V.4.1', 'Step 1 · Default วันดำเนินการอ่านอย่างเดียว'], ['V.4.2', 'Step 1 · Interaction ลงนามการตรวจสภาพ'], ['V.4.3', 'Step 1 · Filled ลงนามครบ'], ['toast:W1'],
      ['V.5.1', 'Step 2 · Default ไม่มีค่าใช้จ่ายและราคา'], ['V.5.2', 'Step 2 · Error Validation Field'], ['V.5.3', 'Step 2 · Filled กรอกผลงานครบ'],
      ['V.11.2', 'Step 2 · Interaction บำรุงรักษาไม่ได้ อะไหล่ที่ใช้ไปแล้ว']] }] },
  { title: 'บันทึกผลตรวจน้ำมันไฮโดรลิก', pages: [
    { name: 'หน้ารายละเอียดแผนเดินทาง', items: [['K.3', 'Interaction เมนู … ของยานพาหนะที่รอผลตรวจน้ำมัน'], ['K.8', 'Status น้ำมันไม่ผ่าน']] },
    { name: 'หน้างานรายคัน', items: [['K.4', 'Default ผลการทดสอบยังว่าง'], ['K.5', 'Error Validation Field ยังไม่เลือกผล'], ['K.6', 'Filled เลือกผลและแนบไฟล์'],
      ['K.7', 'Status บันทึกผลแล้ว แก้ได้ภายหลัง'], ['toast:K1']] }] },
  { title: 'ยอมรับผลการตรวจรายคัน', pages: [
    { name: 'หน้าการตรวจบำรุงยานพาหนะรอตรวจสอบ', items: [['L.1', 'Filled รายการรอตรวจสอบ'], ['L.5', 'Status ยอมรับผลแล้ว'], ['toast:L1']] },
    { name: 'หน้าผลการตรวจบำรุงยานพาหนะรายคัน', items: [['L.2', 'Filled ผลการตรวจรายคัน'], ['L.3', 'Status บำรุงรักษาไม่ได้ แสดงสาเหตุ'], ['L.4', 'Confirm ยืนยันยอมรับผล']] }] },
  { title: 'ตรวจหลักฐานและประเมินความพึงพอใจ', pages: [
    { name: 'หน้าการตรวจบำรุงยานพาหนะรอตรวจสอบ', items: [['M.1', 'Filled ครบทุกคันแล้ว']] },
    { name: 'หน้าหลักฐานทั้งแผน', items: [['M.2', 'Default ยังไม่ประเมิน'], ['M.3', 'Filled ประเมินความพึงพอใจแล้ว'], ['M.4', 'Confirm ยืนยันยอมรับผลทั้งแผน'],
      ['M.5', 'Status ยอมรับผลทั้งแผนแล้ว'], ['toast:M1']] }] }
];
return {
  id: 'job', title: 'งานบำรุงรักษารายคัน', page: ['งานบำรุงรักษารายคัน'],
  doc: '34-บำรุงรักษา-feature-งานรายคัน-สำหรับ-dev.md',
  scenarios: ['S10', 'S23', 'S12', 'S13', 'S14'],
  screens: SCREENS, toasts: TOASTS, happy: HAPPY, journeys: JOURNEYS
};
})());


/* ---------- features/close.js ---------- */
/* ============================================================================
   features/close.js — Feature ประวัติและปิดงาน (S15 S16 S17 S18) · 17 พ.ย. 2569
   เอกสาร: Diagram/01-บำรุงรักษาตามวาระ/35-บำรุงรักษา-feature-ประวัติและปิดงาน-สำหรับ-dev.md
   รูปแบบฟิลด์ตาม features/plan.js (แม่แบบ) · ใช้จอเดิมของ maintainance-plugin/screens.js ทุกจอ ไม่ประกอบ UI ใหม่
   รหัสบล็อกตาม BLOCK_OF: S15 = N · S16 = O · S17 = P · S18 = Q
   เดิม 14 จอ ลดเหลือ 13 จอ: Q.2 (ดาวน์โหลด Excel แล้ว) = Q.1 + toast ⇒ แปลงเป็น toast Q1 ชิ้นเดียว
   N.4 O.5 P.3 หน้าเปลี่ยนจริง (สถานะ · กล่องแจ้ง · ปุ่ม) ⇒ คงเป็น case Status · toast ที่ขึ้นพร้อมกันแยกเป็นชิ้น (แบบ B.4 ของ plan.js)
   ============================================================================ */
MF_FEATURES.push((() => {
/* toast ของ feature (ข้อความลอกจาก notify() ใน screens.js) · page/when = ป้ายบอกว่าแสดงที่ไหน เมื่อไหร่ */
const TOASTS = {
  H1: { text: 'ส่งประวัติงานบำรุงรักษาให้หัวหน้าตรวจสอบแล้ว', page: 'ประวัติงานบำรุงรักษา', when: 'ยืนยันส่งประวัติสำเร็จ', was: 'N.4' },
  H2: { text: 'อนุมัติประวัติงานบำรุงรักษาสำเร็จ', page: 'ตรวจสอบประวัติ', when: 'ยืนยันอนุมัติประวัติสำเร็จ', was: 'O.5' },
  C1: { text: 'ปิดงานสำเร็จ', page: 'รายงานผลการบำรุงรักษา', when: 'ยืนยันปิดงานสำเร็จ', was: 'P.3' },
  Q1: { text: 'ดาวน์โหลดไฟล์ Excel แล้ว', page: 'ต้นทุนการบำรุงรักษา', when: 'กดดาวน์โหลด Excel สำเร็จ', was: 'Q.2' }
};
/* Happy flow — จอผลลัพธ์ N.4 O.5 P.3 มี toast ซ้อนในจออยู่แล้ว (จอเดิม) · ต้นทุน: จอ Q.1 + toast Q1 (หน้าตาเดียวกับ Q.2 เดิม) */
const SCREENS = {
  'H:download': async () => { const s = await costScreen('S18 ดาวน์โหลดแล้ว'); notify(s, TOASTS.Q1.text); return s; }
};
const HAPPY = [
  [['N.2', 'บำรุงรักษาครบทุกคัน', 'หน้าประวัติงานบำรุงรักษา'], ['N.3', 'ยืนยันส่งประวัติ', 'หน้าประวัติงานบำรุงรักษา'], ['N.4', 'ส่งแล้ว รอหัวหน้าตรวจสอบ', 'หน้าประวัติงานบำรุงรักษา']],
  [['O.1', 'ประวัติรอตรวจสอบ', 'หน้าประวัติรอตรวจสอบ'], ['O.2', 'ตรวจประวัติของแผน', 'หน้าตรวจสอบประวัติ'], ['O.4', 'ยืนยันอนุมัติประวัติ', 'หน้าตรวจสอบประวัติ'], ['O.5', 'อนุมัติประวัติสำเร็จ', 'หน้าตรวจสอบประวัติ']],
  [['P.1', 'รายงานผลการบำรุงรักษา', 'หน้ารายงานผลการบำรุงรักษา'], ['P.2', 'ยืนยันปิดงาน', 'หน้ารายงานผลการบำรุงรักษา'], ['P.3', 'ปิดงานสำเร็จ', 'หน้ารายงานผลการบำรุงรักษา']],
  [['Q.1', 'ต้นทุนการบำรุงรักษา', 'หน้าต้นทุนการบำรุงรักษา'], ['H:download', 'ดาวน์โหลด Excel สำเร็จ', 'หน้าต้นทุนการบำรุงรักษา']]];
/* Title หลัก → journey → หน้า → case · ตรงหัวข้อ 2 ของไฟล์ 35 (J1–J4) */
const JOURNEYS = [
  { title: 'บันทึกและส่งประวัติ', pages: [
    { name: 'หน้าประวัติงานบำรุงรักษา', items: [['N.1', 'Disabled ยังบำรุงรักษาไม่ครบทุกคัน'], ['N.2', 'Filled ครบทุกคัน'], ['N.3', 'Confirm ยืนยันส่งประวัติ'],
      ['N.4', 'Status ส่งแล้ว รอหัวหน้าตรวจสอบ'], ['toast:H1']] }] },
  { title: 'ตรวจสอบประวัติ', pages: [
    { name: 'หน้าประวัติรอตรวจสอบ', items: [['O.1', 'Filled มีประวัติรอตรวจสอบ']] },
    { name: 'หน้าตรวจสอบประวัติ', items: [['O.2', 'Default รอตรวจสอบ'], ['O.3', 'Interaction ตีกลับ ระบุเหตุผล'], ['O.4', 'Confirm ยืนยันอนุมัติประวัติ'],
      ['O.5', 'Status อนุมัติแล้ว'], ['toast:H2']] }] },
  { title: 'ออกรายงานผลและปิดงาน', pages: [
    { name: 'หน้ารายงานผลการบำรุงรักษา', items: [['P.1', 'Status ประวัติผ่านแล้ว รอปิดงาน'], ['P.2', 'Confirm ยืนยันปิดงาน'], ['P.3', 'Status ปิดงานแล้ว'], ['toast:C1']] }] },
  { title: 'คำนวณต้นทุน', pages: [
    { name: 'หน้าต้นทุนการบำรุงรักษา', items: [['Q.1', 'Filled ต้นทุนและ Summary'], ['toast:Q1']] }] }
];
return {
  id: 'close', title: 'ประวัติและปิดงาน', page: ['ประวัติและปิดงาน'],
  doc: '35-บำรุงรักษา-feature-ประวัติและปิดงาน-สำหรับ-dev.md',
  scenarios: ['S15', 'S16', 'S17', 'S18'],
  screens: SCREENS, toasts: TOASTS, happy: HAPPY, journeys: JOURNEYS
};
})());


/* ---------- features/track.js ---------- */
/* ============================================================================
   features/track.js — Feature ติดตามและแดชบอร์ด (S4 S24) · 17 พ.ย. 2569
   เอกสาร: Diagram/01-บำรุงรักษาตามวาระ/36-บำรุงรักษา-feature-ติดตามและแดชบอร์ด-สำหรับ-dev.md
   รูปแบบไฟล์ตามแม่แบบ features/plan.js (หัวไฟล์นั้นอธิบายทุกฟิลด์)
   จอทั้งหมดเป็นจอเดิมของ maintainance-plugin/screens.js (บล็อก C = S4 · W = S24) ไม่ประกอบ UI ใหม่
     · C.9 (ส่งออกสำเร็จ) = หน้าตา C.4 + toast ⇒ แปลงเป็น toast ชิ้นเดียว S1 ไม่สร้างทั้งหน้าซ้ำ
     · จอผลลัพธ์ใน happy flow (H:export) เรียก partsDash ตัวเดียวกับ C.9 + notify ข้อความของ toast S1
   ============================================================================ */
MF_FEATURES.push((() => {
const DASH = 'หน้าอะไหล่ของแผนที่อนุมัติแล้ว', PDF = 'หน้าไฟล์ PDF ที่ส่งออก', XLS = 'หน้าไฟล์ Excel ที่ส่งออก';
const MA = 'หน้าข้อมูลยานพาหนะ แท็บการบำรุงรักษา', MAD = 'หน้ารายละเอียดยานพาหนะ แท็บตารางบำรุงรักษา';

/* toast ของ feature (ข้อความลอกจาก notify() ของ C.9 ใน screens.js) */
const TRACK_TOASTS = {
  S1: { text: 'ส่งออกไฟล์สำเร็จ', page: 'อะไหล่ของแผนที่อนุมัติแล้ว', when: 'กดส่งออกใน popup แล้วสร้างไฟล์สำเร็จ', was: 'C.9' }
};

/* จอผลลัพธ์ของ happy flow = แดชบอร์ดที่กรองแล้ว + toast ซ้อนในจอ (ฟังก์ชันและค่าเดียวกับ C.9 ของ screens.js) */
const TRACK_SCREENS = {
  'H:export': async () => { const s = await partsDash('S4 ส่งออกสำเร็จ', { chips: ['2570', 'กกฟ.1'] }); notify(s, TRACK_TOASTS.S1.text); return s; }
};

/* Happy flow — [รหัสจอ, คำอธิบายขั้น, ชื่อหน้า] · ยกจากทางเดินหัวข้อ 2 ของไฟล์ 36 */
const TRACK_HAPPY = [
  [['C.1', 'แท็บรวมตามรายการ', DASH], ['C.3', 'กดตัวกรอง เลือกหน่วยงาน แผน', DASH], ['C.4', 'กรองแล้ว ชิปตัวกรองเหนือตาราง', DASH],
    ['C.6', 'แท็บแยกรายคัน', DASH], ['C.7', 'แท็บความคืบหน้าของแผน', DASH]],
  [['C.4', 'กรองแล้ว กดส่งออก', DASH], ['C.8', 'popup เลือกรูปแบบไฟล์', DASH], ['H:export', 'ส่งออกสำเร็จ', DASH]],
  [['W.1', 'ยานพาหนะทุกคัน เรียงกำหนดครั้งถัดไป', MA], ['W.4', 'กดตัวกรอง', MA], ['W.5', 'กรองใกล้ครบกำหนด', MA],
    ['W.6', 'เมนู … ดูรายละเอียด', MA], ['W.7', 'กำหนดครั้งถัดไปและประวัติ', MAD]]];

/* journey → หน้า → case ตรงหัวข้อ 2 และ 3 ของไฟล์ 36
   หน้าไฟล์ที่ส่งออกใส่ "ไฟล์ PDF · " / "ไฟล์ Excel · " นำหน้าป้าย case ⇒ ชื่อเฟรมมี " — ไฟล์ PDF" ตามข้อยกเว้นขนาดจอ R32 (A4 794×1123 · ชีต 1440×1024)
   happy flow จึงจบที่ส่งออกสำเร็จ ไม่ใส่จอไฟล์ (ชื่อเฟรม happy เป็น " — ขั้น n · " ไม่เข้าข้อยกเว้น R32) */
const TRACK = [
  { title: 'ดูอะไหล่และความคืบหน้าของแผนที่อนุมัติแล้ว', pages: [
    { name: DASH, items: [['C.13', 'Default ยังไม่มีแผนที่อนุมัติแล้ว'], ['C.1', 'Filled แท็บรวมตามรายการ'], ['C.2', 'Filled ค้นหาชื่อหรือรหัสอะไหล่'],
      ['C.3', 'Interaction แผงตัวกรอง'], ['C.4', 'Filled กรองแล้ว ชิปตัวกรองเหนือตาราง'], ['C.5', 'Empty result ไม่พบอะไหล่'],
      ['C.6', 'Filled แท็บแยกรายคัน'], ['C.7', 'Filled แท็บความคืบหน้าของแผน']] }] },
  { title: 'ส่งออกรายงานอะไหล่', pages: [
    { name: DASH, items: [['C.8', 'Interaction popup ส่งออก'], ['toast:S1']] },
    { name: PDF, items: [['C.10', 'ไฟล์ PDF · Filled รวมตามรายการ']] },
    { name: XLS, items: [['C.11', 'ไฟล์ Excel · Filled ชีตรวมตามรายการ'], ['C.12', 'ไฟล์ Excel · Filled ชีตแยกรายคัน']] }] },
  { title: 'ติดตามการบำรุงรักษารายคันและกำหนดครั้งถัดไป', pages: [
    { name: MA, items: [['W.1', 'Filled ยานพาหนะทุกคัน'], ['W.2', 'Filled ค้นหาทะเบียน'], ['W.3', 'Empty result ไม่พบข้อมูล'],
      ['W.4', 'Interaction แผงตัวกรอง'], ['W.5', 'Filled กรองแล้ว ใกล้ครบกำหนด'], ['W.6', 'Interaction เมนู … ของยานพาหนะ']] },
    { name: MAD, items: [['W.7', 'Filled กำหนดครั้งถัดไปและประวัติ'], ['W.8', 'Interaction เมนู … ของประวัติ']] }] }
];

return {
  id: 'track', title: 'ติดตามและแดชบอร์ด', page: ['ติดตามและแดชบอร์ด'],
  doc: '36-บำรุงรักษา-feature-ติดตามและแดชบอร์ด-สำหรับ-dev.md',
  scenarios: ['S4', 'S24'],
  screens: TRACK_SCREENS, toasts: TRACK_TOASTS, happy: TRACK_HAPPY, journeys: TRACK
};
})());

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
function screenFns(f) {   // รหัสจอ → ฟังก์ชันจอ: จอเดิมของ scenario (รหัสบล็อกตาม BLOCK_OF ของ screens.js) แล้วทับด้วย f.screens
  const out = {};
  for (const tag of f.scenarios) {
    const i = BLOCK_OF.indexOf(tag), sc = SCENARIOS.find(x => x[0].split(' · ')[0] === tag);
    if (i < 0 || !sc) { warn('Feature ' + f.title + ': ไม่พบ ' + tag + ' ใน screens.js', 'ข้าม'); continue; }
    flatScreens(sc[1], LETTERS[i]).forEach(s => { out[s.code] = { fn: s.fn, label: s.label }; });
  }
  for (const [code, fn] of Object.entries(f.screens || {})) { if (out[code]) out[code].fn = fn; else out[code] = { fn }; }
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
const happyCount = (list) => list.reduce((a, j) => a + (HAPPY[FEATURE.indexOf(j)] || []).length, 0);
/* แถว happy flow ในรูปเดียวกับ featurePages (กลุ่มหน้า = ขั้นที่ติดกันในหน้าเดียวกัน) · รหัส H<journey>.<ขั้น> */
function happyPages(ji) {
  let x = ROW_X0 + GRID.side + GRID.gap, n = 0; const pages = [];
  for (const [ref, label, pg] of HAPPY[ji] || []) {
    let cur = pages[pages.length - 1];
    if (!cur || cur.name !== pg) { if (cur) x = cur.x + cur.w + PAGE_GAP; cur = { name: pg, x, w: 0, items: [] }; pages.push(cur); }
    n++;
    const ix = cur.x + cur.items.length * (GRID.colW + GRID.colGap), s = SCREEN_FN[ref];
    cur.items.push({ code: 'H' + (ji + 1) + '.' + n, x: ix, label: 'ขั้น ' + n + ' · ' + label + (ref.indexOf('H:') === 0 ? '' : ' (' + ref + ')'), fn: s ? s.fn : null, old: ref });
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
        return { code, x: ix, label: 'Toast ' + t.text + ' (แสดงบน' + t.page + ' เมื่อ' + t.when + ')', fn: () => toastScreen(id) };
      }
      const s = SCREEN_FN[it[0]];
      return { code, x: ix, label: it[1] + ' (' + it[0] + ')', fn: s ? s.fn : null, old: it[0] };
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

/* ติดป้าย pluginData 'mf' = 'title' หรือเลข journey (ไว้ใช้ภายหลัง · ไม่ได้ใช้ลบอะไร) */
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
        CREATED = []; PLACE = { x: it.x, y: rowY }; const ts = Date.now();
        try {
          PINS = []; const s = await it.fn(); desktopHeader(s); stripDividers(s); await polish(s); repin(); await bindTones(); if (typeof AFTER_SCREEN === 'function') await AFTER_SCREEN(s);
          capOverlayScreen(s); showPlaceholders(s);
          s.name = prefix + ' / ' + it.code + ' · ' + frameTitle + ' › ' + pg.name + ' — ' + it.label + (mob ? ' · mobile' : '');
          if (s.setPluginData) s.setPluginData('builtAt', String(Date.now()));
          put(s, it.x, rowY); h = Math.max(h, s.height); made.push(s);
          TIMES.push([Date.now() - ts, it.code + (mob ? ' mobile' : '') + ' ' + it.label.slice(0, 40)]);
          /* ชิ้นที่ฟังก์ชันจอสร้างไว้แต่ไม่ได้ใส่เข้าจอ (carPartsScreen สร้าง Section "อะไหล่อื่นๆ" + ช่องน้ำมันทุกครั้ง) ค้างบนหน้า (ผู้ใช้เจอ 13 พ.ย. 2569)
             ⇒ ลบเฉพาะชิ้นที่รอบนี้เพิ่งสร้างและไม่ได้อยู่ในจอ ของเดิมบนหน้าไม่แตะ */
          for (const c of CREATED) { try { if (c !== s && c.parent === page) { c.remove(); orphans++; } } catch (e) { /* ลบไปแล้ว */ } }
          log('  · ' + made.length + '/' + total + ' ' + s.name);
        } catch (e) {
          warn(it.code + ' ' + it.label + (mob ? ' (mobile)' : ''), e);
          const d = dropCreated(page); if (d) log('    ลบชิ้นที่ค้างจากจอที่พัง ' + d + ' ชิ้น');
        }
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
async function resolveFast() {
  const lib = NEEDED.filter(n => LOCAL_OPTIONAL.indexOf(n) < 0);
  let t = Date.now();
  const pre = await preImport(lib);
  log('⏱ นำเข้าจากไลบรารีพร้อมกัน ' + pre + ' ตัว ' + secs(t));
  t = Date.now();
  await resolveAll(lib);   // ตัวที่นำเข้าไม่ได้จริงๆ resolveAll ยังสแกนเป็นทางสุดท้ายตามเดิม
  log('⏱ resolveAll ' + secs(t));
  t = Date.now();
  const lab = await importLabels();
  if (lab.length) log('ป้ายข้างจอจากไลบรารี: ' + lab.join(' · ') + ' ' + secs(t));
  const want = new Map();   // ชื่อที่จะหา → ชื่อใน LOCAL_OPTIONAL
  for (const n of LOCAL_OPTIONAL) if (!INDEX.has(n)) [n].concat(ALIAS[n] || []).forEach(x => want.set(x, n));
  for (const c of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
    if (c.type === 'COMPONENT' && c.parent && c.parent.type === 'COMPONENT_SET') continue;
    const n = want.get(c.name); if (n && !INDEX.has(n)) { INDEX.set(n, c); ROUTE[n] = 'สำเนาในไฟล์นี้'; }
  }
  const left = () => [...new Set(want.values())].filter(n => !INDEX.has(n));
  if (left().length) for (const i of figma.root.findAllWithCriteria({ types: ['INSTANCE'] })) {
    const n = want.get(i.name); if (!n || INDEX.has(n)) continue;
    try { const mc = await i.getMainComponentAsync(); if (mc) { INDEX.set(n, holderOf(mc)); ROUTE[n] = 'จาก instance ในไฟล์'; } } catch (e) { /* ข้าม */ }
    if (!left().length) break;
  }
  const miss = left();
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
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) if (n.type !== 'INSTANCE' && n.type !== 'FRAME') loose++;
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

})();
