/* ============================================================================
   ดัมป์ "ทั้งไฟล์" จากในแอป Figma → ส่งกลับเครื่องผ่าน serve.js (พอร์ต 8124)
   ----------------------------------------------------------------------------
   ทำไมต้องใช้ปลั๊กอินแทน REST API:
     REST `/v1/files/<key>` กับไฟล์ใหญ่โดน 429 Rate limit ยาวเป็นชั่วโมง (เจอจริง 1 ก.ย. 2569)
     ปลั๊กอินอ่านจากในแอป **ไม่กินโควตา REST เลย** และได้ทุกหน้าทุกโหนดในรอบเดียว
   ผลลัพธ์: figma-export/out/figma-dump/<slug>/<page-id>.json  (โครงเดียวกับ .figma-extract/)
   ============================================================================ */
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const solids = (arr) => (Array.isArray(arr) ? arr : []).filter((p) => p.visible !== false && p.type === 'SOLID').map((p) => hex(p.color));

function trim(n, depth) {
  const o = { name: n.name, type: n.type };
  if (typeof n.width === 'number') { o.w = Math.round(n.width); o.h = Math.round(n.height); }
  if (n.paddingLeft) o.pl = n.paddingLeft;
  if (n.paddingRight) o.pr = n.paddingRight;
  if (n.paddingTop) o.pt = n.paddingTop;
  if (n.paddingBottom) o.pb = n.paddingBottom;
  if (n.itemSpacing) o.gap = n.itemSpacing;
  if (typeof n.cornerRadius === 'number') o.r = n.cornerRadius;
  else if (n.cornerRadius === figma.mixed && typeof n.topLeftRadius === 'number')
    o.r = [n.topLeftRadius, n.topRightRadius, n.bottomRightRadius, n.bottomLeftRadius];
  if (typeof n.strokeWeight === 'number' && n.strokeWeight) o.sw = n.strokeWeight;
  if (n.layoutMode && n.layoutMode !== 'NONE') o.dir = n.layoutMode;
  if (n.counterAxisAlignItems) o.align = n.counterAxisAlignItems;
  try { const f = solids(n.fills); if (f.length) o.fill = f; } catch (e) {}
  try { const s = solids(n.strokes); if (s.length) o.stroke = s; } catch (e) {}
  if (n.type === 'TEXT') {
    try {
      const fn = n.fontName, lh = n.lineHeight;
      o.font = {
        fam: fn && fn.family ? fn.family : null,
        style: fn && fn.style ? fn.style : null,
        size: typeof n.fontSize === 'number' ? n.fontSize : null,
        lh: lh && lh.unit === 'PIXELS' ? Math.round(lh.value) : null,
      };
      o.text = (n.characters || '').slice(0, 80);
    } catch (e) {}
  }
  if (n.type === 'COMPONENT_SET' && n.componentPropertyDefinitions) {
    try { o.props = n.componentPropertyDefinitions; } catch (e) {}
  }
  if (n.type === 'COMPONENT' && n.variantProperties) o.variant = n.variantProperties;
  // ⚠️ ห้ามอ่าน n.mainComponent แบบ sync ภายใต้ documentAccess: dynamic-page (Figma โยน error)
  //    ถ้าอยากได้ชื่อ component ต้นทางของ instance ต้องใช้ getMainComponentAsync ซึ่ง trim() เป็น sync จึงข้ามไป
  if (n.children && n.children.length && depth < 12) o.kids = n.children.map((k) => trim(k, depth + 1));
  return o;
}

figma.showUI(__html__, { width: 460, height: 380 });

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'start') return;
  await figma.loadAllPagesAsync();
  const pages = figma.root.children;
  figma.ui.postMessage({ type: 'total', total: pages.length, file: figma.root.name });
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    try {
      await p.loadAsync();
      const data = { node: p.id, page: p.name, sets: p.children.map((c) => trim(c, 0)) };
      figma.ui.postMessage({ type: 'page', i, id: p.id.replace(':', '-'), name: p.name, data });
    } catch (e) {
      figma.ui.postMessage({ type: 'error', i, name: p.name, message: String(e && e.message || e) });
    }
    await new Promise((r) => setTimeout(r, 0));
  }
  figma.ui.postMessage({ type: 'done' });
};
