/* ============================================================================
   Maintain-D — FigJam frame dump
   ------------------------------------------------------------------------
   อ่าน section/frame ที่ระบุใน FigJam board แล้วส่งกลับเครื่องผ่าน serve.js (พอร์ต 8124)
   คู่กับ figma-export/dump-plugin/ (ฝั่งไฟล์ design) — ไฟล์นี้ใช้กับไฟล์ FigJam เท่านั้น
   (editorType: figjam — import เข้าไฟล์ design ไม่ได้ และปลั๊กอินฝั่ง design ก็ import เข้า FigJam ไม่ได้)

   ทำไมต้องแยกปลั๊กอิน ไม่ใช้ dump-plugin ตัวเดิม:
     FigJam มีชนิด node ที่ไฟล์ design ไม่มี (SECTION, STICKY, SHAPE_WITH_TEXT, CONNECTOR)
     ข้อความของ STICKY/SHAPE_WITH_TEXT/CONNECTOR อยู่ที่ n.text.characters ไม่ใช่ n.characters ตรงๆแบบ TEXT

   ข้อจำกัดสำคัญ: ถ้า section ที่เลือกมีแต่รูปสกรีนช็อต (ท่อ A ปกติแปะเป็น PNG) จะได้แค่ { hasImage: true }
   ไม่ได้ข้อความในรูป — ให้อ่าน field จริงจาก mock/*.html หรือ dump ฝั่งไฟล์ design (dump-plugin) แทน
   ส่วนที่ได้ข้อความจริงจากที่นี่คือ sticky note, shape-with-text, และผัง mermaid ที่แปลงเป็น node แล้ว (4-figjam-diagram.js)

   ผลลัพธ์: figma-export/out/figjam-dump/<slug>/<section-id>.json
   ============================================================================ */

async function trim(n, depth) {
  const o = { name: n.name, type: n.type };
  if (typeof n.width === 'number') { o.w = Math.round(n.width); o.h = Math.round(n.height); }

  // ข้อความ: TEXT ใช้ n.characters ตรง · STICKY/SHAPE_WITH_TEXT/CONNECTOR label ซ้อนอยู่ใน n.text.characters
  try {
    if (n.type === 'TEXT' && typeof n.characters === 'string') {
      o.text = n.characters.slice(0, 200);
    } else if (n.text && typeof n.text.characters === 'string') {
      o.text = n.text.characters.slice(0, 200);
    }
  } catch (e) {}

  if (n.type === 'CONNECTOR') {
    try {
      o.from = (n.connectorStart && n.connectorStart.endpointNodeId) || null;
      o.to = (n.connectorEnd && n.connectorEnd.endpointNodeId) || null;
    } catch (e) {}
  }

  // บอกแค่ว่ามีรูปแปะอยู่ — อ่านข้อความในรูปไม่ได้จาก Plugin API (ดูหมายเหตุหัวไฟล์)
  try {
    const fills = Array.isArray(n.fills) ? n.fills : [];
    if (fills.some((f) => f.type === 'IMAGE')) o.hasImage = true;
  } catch (e) {}

  if (n.children && n.children.length && depth < 12) {
    o.kids = await Promise.all(n.children.map((k) => trim(k, depth + 1)));
  }
  return o;
}

figma.showUI(__html__, { width: 460, height: 520 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'list-pages') {
    await figma.loadAllPagesAsync();
    figma.ui.postMessage({
      type: 'pages',
      file: figma.root.name,
      pages: figma.root.children.map((p) => ({ id: p.id, name: p.name })),
    });
    return;
  }

  if (msg.type === 'list-sections') {
    await figma.loadAllPagesAsync();
    const page = figma.root.children.find((p) => p.id === msg.pageId);
    if (!page) {
      figma.ui.postMessage({ type: 'sections', pageId: msg.pageId, sections: [] });
      return;
    }
    await page.loadAsync();
    // ขอบเขต "frame" ของ FigJam ปกติคือ SECTION — ถ้าหน้านี้ไม่มี SECTION เลย (ไม่ได้แบ่งไว้)
    // ถอยไปเสนอ node ระดับบนสุดอื่นแทน (ยกเว้น CONNECTOR ที่ไม่ใช่ขอบเขต)
    let items = page.children.filter((n) => n.type === 'SECTION');
    if (!items.length) items = page.children.filter((n) => n.type !== 'CONNECTOR');
    figma.ui.postMessage({
      type: 'sections',
      pageId: msg.pageId,
      sections: items.map((n) => ({ id: n.id, name: n.name, type: n.type })),
    });
    return;
  }

  if (msg.type !== 'start') return;
  await figma.loadAllPagesAsync();
  const page = figma.root.children.find((p) => p.id === msg.pageId);
  if (!page) {
    figma.ui.postMessage({ type: 'error', i: -1, name: '-', message: 'ไม่พบหน้าที่เลือก' });
    figma.ui.postMessage({ type: 'done' });
    return;
  }
  await page.loadAsync();
  const ids = Array.isArray(msg.sectionIds) ? msg.sectionIds : [];
  const nodes = ids.length ? page.children.filter((n) => ids.includes(n.id)) : [];
  if (!nodes.length) {
    figma.ui.postMessage({ type: 'error', i: -1, name: '-', message: 'ยังไม่ได้เลือก frame/section เลย — ติ๊กอย่างน้อย 1 ก่อนกดเริ่มดัมป์' });
    figma.ui.postMessage({ type: 'done' });
    return;
  }

  figma.ui.postMessage({ type: 'total', total: nodes.length, file: figma.root.name });
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    try {
      const data = { node: n.id, page: page.name, section: n.name, root: await trim(n, 0) };
      figma.ui.postMessage({ type: 'section', i, id: n.id.replace(':', '-'), name: n.name, data });
    } catch (e) {
      figma.ui.postMessage({ type: 'error', i, name: n.name, message: String((e && e.message) || e) });
    }
    await new Promise((r) => setTimeout(r, 0));
  }
  figma.ui.postMessage({ type: 'done' });
};
