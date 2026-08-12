/* ============================================================
   Maintain-D → FigJam board · ฝั่ง sandbox
   ------------------------------------------------------------
   รับ board.json + รูป (bytes) จาก ui.html แล้วสร้าง:
     section ต่อหมวด → ในหมวดเรียงคอลัมน์ (ป้ายชื่อ + รูปซ้อนแนวตั้ง
     สำหรับหน้าที่ถูกสไลซ์) → หมวดที่เป็นโฟลว์มีลูกศรเชื่อมตามลำดับ

   รูปใน FigJam = ShapeWithText (SQUARE) เติม IMAGE fill — FigJam
   ไม่มี rectangle/frame ให้ใช้ ส่วน text ของ shape ปล่อยว่างไว้
   (ไม่แตะ = ไม่ต้องโหลดฟอนต์ให้มัน)

   รันซ้ำ = ล้างของเดิมก่อน: section ชื่อตรงกับ spec · MEDIA เร่ร่อน
   ระดับบนสุด (รูปที่เคยอัปโหลดค้างไว้) · ลูกศร/รูปที่ปลั๊กอินนี้สร้าง
   ============================================================ */

figma.showUI(__html__, { width: 420, height: 560, themeColors: true });

const ARROW = { r: 0xF8 / 255, g: 0x49 / 255, b: 0xC1 / 255 }; // ชมพู palette ของ FigJam

function post(text, cls) {
  figma.ui.postMessage({ type: 'log', text, cls });
}

async function build(spec, images) {
  const warnings = [];
  const byteMap = new Map(images.map(i => [i.src, i.bytes]));

  // ---- ล้างของเดิม ----
  const names = new Set(spec.sections.map(s => s.name));
  let cleaned = 0;
  for (const n of figma.currentPage.children.slice()) {
    if ((n.type === 'SECTION' && names.has(n.name)) ||
        n.type === 'MEDIA' ||
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

  const made = { sections: 0, shapes: 0, connectors: 0, warnings };
  let y = 0;

  for (const sec of spec.sections) {
    if (sec.kind === 'diagram') {
      y = await buildDiagram(sec, y, font, made);
      post('✓ ' + sec.name + ' (ผัง ' + sec.diagram.nodes.length + ' node)');
      continue;
    }
    const s = figma.createSection();
    s.name = sec.name;
    s.fills = [{ type: 'SOLID', color: { r: sec.color[0] / 255, g: sec.color[1] / 255, b: sec.color[2] / 255 } }];

    let x = 80;
    let maxColH = 0;
    const anchors = [];

    for (const col of sec.cols) {
      const label = figma.createText();
      label.fontName = font;
      label.fontSize = 36;
      label.characters = col.label;
      s.appendChild(label);
      label.x = x; label.y = 96;

      let yy = 176;
      let first = null;
      let colW = 0;
      for (const im of col.images) {
        const bytes = byteMap.get(im.src);
        if (!bytes) throw new Error('ไม่มี bytes ของ ' + im.src);
        const image = figma.createImage(bytes);
        const shape = figma.createShapeWithText();
        shape.shapeType = 'SQUARE';
        shape.name = 'shot / ' + im.src;
        s.appendChild(shape);
        shape.resize(im.w, im.h);
        shape.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
        shape.strokes = [];
        shape.x = x; shape.y = yy;
        yy += im.h;
        colW = Math.max(colW, im.w);
        if (!first) first = shape;
        made.shapes++;
      }
      anchors.push(first);
      maxColH = Math.max(maxColH, yy - 176);
      x += (colW || 1440) + 160;
    }

    s.resizeWithoutConstraints(x - 160 + 80, 176 + maxColH + 80);
    s.x = 0; s.y = y;
    y += s.height + 320;
    made.sections++;

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
        made.connectors++;
      }
    }
    post('✓ ' + sec.name + ' (' + sec.cols.length + ' หน้าจอ)');
  }

  figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
  return made;
}

/* ---------- section ชนิดผัง (flowchart จาก Diagram/ ผ่าน 4-figjam-diagram.js) ----------
   node = ShapeWithText ชนิดตามผัง mermaid · เส้น = ConnectorNode ผูกปลายจริง
   (ลาก node แล้วเส้นตามมา — แก้ผังต่อบนบอร์ดได้เลย) · เลน = shape สีอ่อนรองพื้น */
const DIAGRAM_SHAPE = {
  process: 'ROUNDED_RECTANGLE', decision: 'DIAMOND', stadium: 'ELLIPSE',
  subroutine: 'SQUARE', circle: 'ELLIPSE'
};
const LANE_TINTS = [
  { r: 0xFF / 255, g: 0xF7 / 255, b: 0xF0 / 255 },   // ส้มอ่อน (palette FigJam)
  { r: 0xF8 / 255, g: 0xF5 / 255, b: 0xFF / 255 }    // ม่วงอ่อน
];
const INK = { r: 0x75 / 255, g: 0x75 / 255, b: 0x75 / 255 };
const WHITE = { r: 1, g: 1, b: 1 };

async function buildDiagram(sec, y, font, made) {
  const d = sec.diagram;
  const PAD = 80;
  const s = figma.createSection();
  s.name = sec.name;
  s.fills = [{ type: 'SOLID', color: { r: sec.color[0] / 255, g: sec.color[1] / 255, b: sec.color[2] / 255 } }];

  // เลนก่อน — จะได้อยู่ใต้ node
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
  });

  const byId = {};
  for (const n of d.nodes) {
    const sh = figma.createShapeWithText();
    sh.shapeType = DIAGRAM_SHAPE[n.kind] || 'ROUNDED_RECTANGLE';
    sh.name = n.id + ' / ' + (n.label.split('\n')[0] || n.kind);
    s.appendChild(sh);
    sh.resize(n.w, n.h);
    sh.fills = [{ type: 'SOLID', color: WHITE }];
    sh.strokes = [{ type: 'SOLID', color: INK }];
    sh.strokeWeight = 2;
    sh.text.fontName = font;
    sh.text.characters = n.label;
    sh.text.fontSize = n.kind === 'decision' ? 26 : 24;
    sh.x = PAD + n.x; sh.y = PAD + n.y;
    byId[n.id] = sh;
    made.shapes++;
  }

  s.resizeWithoutConstraints(d.w + PAD * 2, d.h + PAD * 2);
  s.x = 0; s.y = y;
  made.sections++;

  for (const e of d.edges) {
    if (!byId[e.from] || !byId[e.to]) continue;
    const c = figma.createConnector();
    c.name = 'flow →';
    c.connectorStart = { endpointNodeId: byId[e.from].id, magnet: 'AUTO' };
    c.connectorEnd = { endpointNodeId: byId[e.to].id, magnet: 'AUTO' };
    c.connectorStartStrokeCap = 'NONE';
    c.connectorEndStrokeCap = 'ARROW_LINES';
    c.strokes = [{ type: 'SOLID', color: e.style === 'thick' ? ARROW : INK }];
    c.strokeWeight = e.style === 'thick' ? 4 : 2;
    if (e.style === 'dotted') c.dashPattern = [8, 8];
    if (e.label) {
      c.text.fontName = font;
      c.text.characters = e.label;
    }
    made.connectors++;
  }

  return y + s.height + 320;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'build') return;
  try {
    const result = await build(msg.spec, msg.images);
    figma.ui.postMessage({ type: 'done', result });
    figma.notify('บอร์ดเสร็จ: ' + result.sections + ' section · รูป ' + result.shapes +
      ' · ลูกศร ' + result.connectors);
  } catch (e) {
    figma.ui.postMessage({ type: 'error', message: String(e && e.message ? e.message : e) });
    figma.notify('สร้างบอร์ดไม่สำเร็จ — ดูรายละเอียดในหน้าต่างปลั๊กอิน', { error: true });
  }
};
