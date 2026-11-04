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

/* 4 พ.ย. 2569 เจ้าของงาน "ต้องมี component เท่านั้นในการทำเว็บ" ⇒ ดัมป์ให้ครบพอทำเว็บจาก component โดยไม่เดา:
   เงา/เบลอ (effects) · ความทึบของโหนดและของสี (opacity) · ชั้นที่ซ่อน (visible) · gradient/ภาพ · ระยะตัวอักษร/จัดแนว
   · ชื่อตัวแปร (Variables) ที่ผูกกับสี/ระยะ/รัศมี — ใช้จับคู่ token ตรงตัว · SVG ของ component กราฟิก (ไอคอน โลโก้ ภาพประกอบ) */
const rgba = (c, a) => hex(c) + (a != null && a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0').toUpperCase() : '');
const paints = (arr) => (Array.isArray(arr) ? arr : []).filter((p) => p.visible !== false).map((p) =>
  p.type === 'SOLID' ? rgba(p.color, p.opacity) : p.type === 'IMAGE' ? 'image' : /GRADIENT/.test(p.type) ? { gradient: p.type, stops: (p.gradientStops || []).map((g) => [rgba(g.color, g.color.a), Math.round(g.position * 100) / 100]) } : p.type);
const VAR_NAME = new Map();
async function varName(id) {
  if (!id) return null;
  if (VAR_NAME.has(id)) return VAR_NAME.get(id);
  let nm = null;
  try { const v = await figma.variables.getVariableByIdAsync(id); nm = v ? v.name : null; } catch (e) {}
  VAR_NAME.set(id, nm); return nm;
}
async function bound(n) {   // { fills: ['color/brand/900'], strokes: [...], itemSpacing: 'spacing/md', ... }
  const out = {};
  try {
    const bv = n.boundVariables || {};
    for (const k of Object.keys(bv)) {
      const v = bv[k], list = Array.isArray(v) ? v : [v];
      const names = (await Promise.all(list.map((x) => varName(x && x.id)))).filter(Boolean);
      if (names.length) out[k] = names.length === 1 ? names[0] : names;
    }
  } catch (e) {}
  return Object.keys(out).length ? out : null;
}
const isLogo = (n) => /logo/i.test(n.name) && /COMPONENT|INSTANCE|GROUP|FRAME/.test(n.type) && n.width <= 600 && n.height <= 600;   // โลโก้วางใน auto layout ได้ (Brand logo (Light mode) · 4 พ.ย. 2569)
const isGraphic = (n) => isLogo(n) || (n.type === 'COMPONENT' || n.type === 'INSTANCE') && (!n.layoutMode || n.layoutMode === 'NONE') && n.width <= 600 && n.height <= 600
  && (/-(\d{2})-(\d{3})-(round|sharp|outlined)$|logo|illustration|icon|symbol/i.test(n.name) || (n.children || []).every((k) => /VECTOR|BOOLEAN_OPERATION|GROUP|ELLIPSE|RECTANGLE|STAR|POLYGON|LINE/.test(k.type)));
const SVG_DONE = new Set(), IMG_DONE = new Set();

async function trim(n, depth) {
  const o = { name: n.name, type: n.type };
  if (n.visible === false) o.visible = false;
  if (typeof n.opacity === 'number' && n.opacity < 1) o.opacity = Math.round(n.opacity * 100) / 100;
  try {
    const fx = (n.effects || []).filter((e) => e.visible !== false);
    if (fx.length) o.effects = fx.map((e) => /SHADOW/.test(e.type)
      ? { type: e.type, color: rgba(e.color, e.color.a), x: e.offset.x, y: e.offset.y, blur: e.radius, spread: e.spread || 0 }
      : { type: e.type, blur: e.radius });
  } catch (e) {}
  try { const fs = paints(n.fills); if (fs.some((x) => typeof x !== 'string' || x.length > 7 || x === 'image')) o.paint = fs; } catch (e) {}
  try { const b = await bound(n); if (b) o.vars = b; } catch (e) {}
  if (typeof n.strokeAlign === 'string' && n.strokeWeight) o.strokeAlign = n.strokeAlign;
  try { if (n.strokeTopWeight != null && (n.strokeTopWeight !== n.strokeBottomWeight || n.strokeLeftWeight !== n.strokeRightWeight)) o.sws = [n.strokeTopWeight, n.strokeRightWeight, n.strokeBottomWeight, n.strokeLeftWeight]; } catch (e) {}
  if (n.primaryAxisAlignItems) o.justify = n.primaryAxisAlignItems;
  if (n.layoutSizingHorizontal) o.sizing = [n.layoutSizingHorizontal, n.layoutSizingVertical];
  if (isGraphic(n)) {
    // ไอคอนส่งออกครั้งเดียวต่อ component · โลโก้/ภาพประกอบส่งออกได้แม้เป็น instance (โลโก้ PEA อยู่ในหน้าจอ UI Release#2 ไม่อยู่ในไลบรารี) ซ้ำชื่อส่งครั้งเดียว
    const key = n.type === 'COMPONENT' || n.type === 'COMPONENT_SET' ? n.id : (/logo|illustration|graphic/i.test(n.name) ? 'i:' + n.name + ':' + Math.round(n.width) : null);
    if (key && !SVG_DONE.has(key)) { SVG_DONE.add(key); try { o.svg = await n.exportAsync({ format: 'SVG_STRING' }); } catch (e) {} }
  }
  // 4 พ.ย. 2569: รูปภาพในกรอบ (IMAGE fill เช่นภาพประกอบ Empty state) ส่งออกเป็น PNG base64 · ครั้งเดียวต่อ imageHash · ขนาดไม่เกิน 800
  try {
    const img = (Array.isArray(n.fills) ? n.fills : []).find((p) => p.type === 'IMAGE' && p.visible !== false && p.imageHash);
    if (img && n.width <= 800 && n.height <= 800 && !IMG_DONE.has(img.imageHash)) {
      IMG_DONE.add(img.imageHash);
      const bytes = await n.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: 2 } });
      o.png = figma.base64Encode(bytes); o.imageHash = img.imageHash;
    } else if (img) o.imageHash = img.imageHash;
  } catch (e) {}
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
      const ls = n.letterSpacing; if (ls && ls.value) o.font.ls = ls.unit === 'PERCENT' ? ls.value + '%' : ls.value;
      if (n.textAlignHorizontal && n.textAlignHorizontal !== 'LEFT') o.font.align = n.textAlignHorizontal;
      if (n.textCase && n.textCase !== 'ORIGINAL') o.font.case = n.textCase;
      if (n.textDecoration && n.textDecoration !== 'NONE') o.font.deco = n.textDecoration;
    } catch (e) {}
  }
  if (n.type === 'COMPONENT_SET' && n.componentPropertyDefinitions) {
    try { o.props = n.componentPropertyDefinitions; } catch (e) {}
  }
  if (n.type === 'COMPONENT' && n.variantProperties) o.variant = n.variantProperties;
  // 19 ต.ค. 2569: เก็บ key ของ component ต้นฉบับด้วย — ปลั๊กอินสร้างหน้าจอ (overhaul2-plugin) ใช้นำเข้าจากไลบรารีที่ publish ไฟล์นี้
  // (เดิมได้ key เฉพาะ component ที่มี instance อยู่ในไฟล์ · ตัวที่ไม่เคยถูกวางเลยจึงไม่มี key)
  if (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') { try { if (n.key) o.key = n.key; } catch (e) {} }
  if (n.type === 'INSTANCE') {
    // ค่า variant/property ปัจจุบันของ "instance ตัวนี้" — sync, คู่ความหมายกับ o.variant ของ COMPONENT
    try {
      const cp = n.componentProperties;
      if (cp && Object.keys(cp).length) {
        const v = {};
        for (const k in cp) v[k] = (cp[k] && 'value' in cp[k]) ? cp[k].value : cp[k];
        o.variant = v;
      }
    } catch (e) {}
    // component ต้นทางของ instance นี้ — async (ตามแพตเทิร์นที่ใช้จริงใน catalog-plugin/code.js)
    // กัน throw แยกทุกจุด: instance ตัวไหนเข้าไม่ถึง main component (remote/ถูกลบ) จะแค่ไม่มี o.component
    // ไม่ทำให้ trim() reject และไม่ลาม Promise.all ของทั้งหน้า (เจอจริง 1 ก.ย. 2569 — อ่านแบบ sync ล้มทั้งหน้า 41/55 หน้า)
    try {
      const main = typeof n.getMainComponentAsync === 'function'
        ? await n.getMainComponentAsync() : n.mainComponent;
      if (main) {
        let holder = main;
        try { if (main.parent && main.parent.type === 'COMPONENT_SET') holder = main.parent; } catch (e2) {}
        const info = { name: holder.name };
        try { info.key = holder.key || null; } catch (e3) {}
        try { info.remote = !!holder.remote; } catch (e4) {}
        if (holder !== main) { try { info.variant = main.name; } catch (e5) {} }
        o.component = info;
      }
    } catch (e) { /* เข้าไม่ถึง main component — ข้ามไป */ }
  }
  if (n.children && n.children.length && depth < 12) o.kids = await Promise.all(n.children.map((k) => trim(k, depth + 1)));
  return o;
}

figma.showUI(__html__, { width: 460, height: 380 });

figma.ui.onmessage = async (msg) => {
  if (msg.type !== 'start') return;
  await figma.loadAllPagesAsync();
  const filter = (msg.pageFilter || '').trim().toLowerCase();
  const pages = filter ? figma.root.children.filter((p) => p.name.toLowerCase().includes(filter)) : figma.root.children;
  figma.ui.postMessage({ type: 'total', total: pages.length, file: figma.root.name });
  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    try {
      await p.loadAsync();
      const data = { node: p.id, page: p.name, sets: await Promise.all(p.children.map((c) => trim(c, 0))) };
      figma.ui.postMessage({ type: 'page', i, id: p.id.replace(':', '-'), name: p.name, data });
    } catch (e) {
      figma.ui.postMessage({ type: 'error', i, name: p.name, message: String(e && e.message || e) });
    }
    await new Promise((r) => setTimeout(r, 0));
  }
  figma.ui.postMessage({ type: 'done' });
};
