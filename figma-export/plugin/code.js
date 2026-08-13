/* ============================================================
   Maintain-D → Figma · ตัวสร้าง node ฝั่ง Figma (plugin sandbox)
   ------------------------------------------------------------
   sandbox นี้ "ไม่มี fetch" — การโหลดสเปกทำที่ ui.html แล้วส่งเข้ามาทาง
   postMessage เท่านั้น ที่นี่รับ spec object แล้วสร้าง node อย่างเดียว
   ============================================================ */

figma.showUI(__html__, { width: 420, height: 520, themeColors: true });

const warnings = [];
const loadedFonts = new Set();

function warn(msg) {
  if (warnings.length < 200) warnings.push(msg);
}

/* ---------- สี ---------- */
function hexToRgb(hex) {
  if (typeof hex !== 'string') return null;
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  if (h.length === 8) h = h.slice(0, 6); // ตัด alpha ออก ไปใช้ที่ opacity แทน
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255
  };
}

function solid(hex, opacity) {
  const color = hexToRgb(hex);
  if (!color) return null;
  return { type: 'SOLID', color, opacity: typeof opacity === 'number' ? opacity : 1 };
}

/* ---------- Figma Variables ----------
   สร้างจาก spec.variables (tokens.css ที่ 2-map.js แปลงมา) แล้วเก็บดัชนี
   hex → Variable ไว้ผูกทุก paint ที่วาด — แก้ brand/600 ที่เดียวทั้งไฟล์เปลี่ยน */
const BOUND = { color: {}, radius: {} };

function boundSolid(hex, opacity) {
  const paint = solid(hex, opacity);
  if (!paint) return null;
  const v = BOUND.color[String(hex).trim().toUpperCase()];
  return v ? figma.variables.setBoundVariableForPaint(paint, 'color', v) : paint;
}

async function syncVariables(vars) {
  BOUND.color = {}; BOUND.radius = {};
  if (!vars || !figma.variables) return 0;

  const existingCols = await figma.variables.getLocalVariableCollectionsAsync();
  const cols = {};
  for (const name of Object.keys(vars.collections)) {
    cols[name] = existingCols.find(c => c.name === name) || figma.variables.createVariableCollection(name);
  }

  // รันซ้ำ = อัปเดตค่าตัวเดิม ไม่สร้างซ้ำ — จับคู่ด้วยชื่อใน collection เดียวกัน
  const existingVars = await figma.variables.getLocalVariablesAsync();
  const byKey = new Map();
  for (const v of existingVars) {
    const col = existingCols.find(c => c.id === v.variableCollectionId);
    if (col) byKey.set(col.name + '§' + v.name, v);
  }

  const made = new Map();
  // รอบ 1: ให้ทุกตัวมีตัวตนก่อน — alias ในรอบ 2 จะได้ชี้เจอเสมอไม่ว่าลำดับไหน
  for (const [colName, defs] of Object.entries(vars.collections)) {
    for (const def of defs) {
      const type = def.type === 'ALIAS' ? def.resolvedType : def.type;
      let v = byKey.get(colName + '§' + def.name);
      if (v && v.resolvedType !== type) { v.remove(); v = null; }
      if (!v) v = figma.variables.createVariable(def.name, cols[colName], type);
      if (def.description) v.description = def.description;
      made.set(colName + '§' + def.name, v);
    }
  }
  // รอบ 2: ใส่ค่า
  for (const [colName, defs] of Object.entries(vars.collections)) {
    const modeId = cols[colName].modes[0].modeId;
    for (const def of defs) {
      const v = made.get(colName + '§' + def.name);
      try {
        if (def.type === 'COLOR') {
          const c = hexToRgb(def.hex);
          v.setValueForMode(modeId, { r: c.r, g: c.g, b: c.b, a: def.alpha == null ? 1 : def.alpha });
        } else if (def.type === 'FLOAT') {
          v.setValueForMode(modeId, def.value);
        } else if (def.type === 'ALIAS') {
          const target = made.get(def.targetCollection + '§' + def.target);
          if (target) v.setValueForMode(modeId, figma.variables.createVariableAlias(target));
          else warn('alias ' + def.name + ' หาปลายทาง ' + def.target + ' ไม่เจอ');
        }
      } catch (e) {
        warn('ตั้งค่า variable ' + def.name + ' ไม่ได้ — ' + e.message);
      }
    }
  }

  for (const [hex, name] of Object.entries(vars.colorIndex || {})) {
    const v = made.get('primitive§' + name);
    if (v) BOUND.color[hex.toUpperCase()] = v;
  }
  for (const [pxv, name] of Object.entries(vars.radiusIndex || {})) {
    const v = made.get('primitive§' + name);
    if (v) BOUND.radius[pxv] = v;
  }
  return made.size;
}

/* ---------- ฟอนต์ ----------
   น้ำหนัก CSS → ชื่อ style ของ Figma · ถ้าโหลดไม่ได้จะไล่ fallback ลงมา
   จนถึง Inter Regular ซึ่งมีติดมากับ Figma เสมอ                        */
const WEIGHT_STYLE = {
  300: 'Light', 400: 'Regular', 500: 'Medium',
  600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black'
};

async function ensureFont(family, style) {
  const key = family + '|' + style;
  if (loadedFonts.has(key)) return { family, style };
  try {
    await figma.loadFontAsync({ family, style });
    loadedFonts.add(key);
    return { family, style };
  } catch (e) {
    return null;
  }
}

async function resolveFont(family, weight) {
  const style = WEIGHT_STYLE[weight] || 'Regular';
  const attempts = [
    [family, style],
    [family, 'Regular'],
    ['Inter', style],
    ['Inter', 'Regular']
  ];
  for (const [f, s] of attempts) {
    const got = await ensureFont(f, s);
    if (got) {
      if (f !== family) warn('ฟอนต์ "' + family + ' ' + style + '" ไม่มีในเครื่อง → ใช้ ' + f + ' ' + s + ' แทน');
      return got;
    }
  }
  throw new Error('โหลดฟอนต์ไม่ได้เลยสักตัว');
}

/* ---------- สร้าง node ---------- */
async function createNode(spec) {
  switch (spec.type) {
    case 'text': {
      const node = figma.createText();
      const t = spec.text || {};
      const font = await resolveFont(t.font || 'IBM Plex Sans Thai', t.weight || 400);
      node.fontName = font;
      node.fontSize = t.size || 14;
      node.characters = String(t.chars == null ? '' : t.chars);
      if (t.lineHeight) node.lineHeight = { value: t.lineHeight, unit: 'PIXELS' };
      if (typeof t.letterSpacing === 'number') node.letterSpacing = { value: t.letterSpacing, unit: 'PIXELS' };
      node.textAlignHorizontal = t.align || 'LEFT';
      node.textAlignVertical = t.valign || 'TOP';
      const fill = boundSolid(t.color || '#181D27');
      if (fill) node.fills = [fill];
      // ranges = ย่อหน้าที่รวม inline element (<b>/<code>) เป็นข้อความเดียว
      // ทาน้ำหนัก/สีเฉพาะช่วง — ต้องทำหลังตั้ง characters เสมอ
      for (const rg of t.ranges || []) {
        const start = Math.max(0, rg.start | 0);
        const end = Math.min(node.characters.length, rg.end | 0);
        if (end <= start) continue;
        if (rg.weight) {
          const rf = await resolveFont(t.font || 'IBM Plex Sans Thai', rg.weight);
          node.setRangeFontName(start, end, rf);
        }
        if (rg.color) {
          const rp = boundSolid(rg.color);
          if (rp) node.setRangeFills(start, end, [rp]);
        }
      }
      // WIDTH_AND_HEIGHT = hug ตามตัวอักษร · HEIGHT = ล็อกความกว้างไว้ให้ตัดบรรทัดเหมือนต้นฉบับ
      node.textAutoResize = t.autoResize || 'WIDTH_AND_HEIGHT';
      return node;
    }
    case 'rect':
      return figma.createRectangle();
    case 'ellipse':
      return figma.createEllipse();
    case 'frame':
    default:
      return figma.createFrame();
  }
}

/* auto-layout + padding + gap — ต้องตั้งก่อน append ลูก */
function applyLayout(node, spec) {
  if (node.type !== 'FRAME' && node.type !== 'COMPONENT') return;
  const L = spec.layout;
  if (!L || !L.mode || L.mode === 'NONE') {
    node.layoutMode = 'NONE';
    return;
  }
  node.layoutMode = L.mode === 'HORIZONTAL' ? 'HORIZONTAL' : 'VERTICAL';
  node.itemSpacing = L.gap || 0;
  const p = L.padding || [0, 0, 0, 0];
  node.paddingTop = p[0] || 0;
  node.paddingRight = p[1] || 0;
  node.paddingBottom = p[2] || 0;
  node.paddingLeft = p[3] || 0;
  if (L.align) node.primaryAxisAlignItems = L.align;
  if (L.cross) node.counterAxisAlignItems = L.cross;
  if (L.wrap && node.layoutMode === 'HORIZONTAL') node.layoutWrap = 'WRAP';
  node.clipsContent = spec.clip !== false;
}

/* พื้น เส้น มุม เงา — ทำได้ทุกจังหวะ */
function applyPaint(node, spec) {
  if ('fills' in node && spec.type !== 'text') {
    const fill = spec.fill ? boundSolid(spec.fill, spec.fillOpacity) : null;
    node.fills = fill ? [fill] : [];
  }
  if (spec.stroke && 'strokes' in node) {
    const s = boundSolid(spec.stroke.color);
    if (s) {
      node.strokes = [s];
      node.strokeWeight = spec.stroke.weight || 1;
      node.strokeAlign = 'INSIDE';
      if (spec.stroke.sides) {
        // เส้นด้านเดียว เช่น border-bottom ของหัวตาราง
        node.strokeTopWeight = spec.stroke.sides[0] || 0;
        node.strokeRightWeight = spec.stroke.sides[1] || 0;
        node.strokeBottomWeight = spec.stroke.sides[2] || 0;
        node.strokeLeftWeight = spec.stroke.sides[3] || 0;
      }
    }
  }
  if (typeof spec.radius === 'number' && 'cornerRadius' in node) {
    node.cornerRadius = spec.radius;
    const rv = BOUND.radius[spec.radius];
    if (rv && node.setBoundVariable) {
      for (const f of ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius']) {
        try { node.setBoundVariable(f, rv); } catch (e) { break; }   // API เก่าไม่มี field นี้ก็ข้ามทั้งชุด
      }
    }
  } else if (Array.isArray(spec.radius) && 'topLeftRadius' in node) {
    node.topLeftRadius = spec.radius[0] || 0;
    node.topRightRadius = spec.radius[1] || 0;
    node.bottomRightRadius = spec.radius[2] || 0;
    node.bottomLeftRadius = spec.radius[3] || 0;
  }
  if (Array.isArray(spec.shadows) && 'effects' in node) {
    node.effects = spec.shadows.map(sh => ({
      type: 'DROP_SHADOW',
      color: Object.assign({ a: sh.a == null ? 0.1 : sh.a }, hexToRgb(sh.color) || { r: 0, g: 0, b: 0 }),
      offset: { x: sh.x || 0, y: sh.y || 0 },
      radius: sh.blur || 0,
      spread: sh.spread || 0,
      visible: true,
      blendMode: 'NORMAL'
    }));
  }
  if (typeof spec.opacity === 'number') node.opacity = spec.opacity;
}

/* ขนาด — ต้องทำ "หลัง" append เข้า parent และหลังมีลูกครบแล้ว
   เพราะ HUG ต้องรู้ลูก และ FILL ต้องรู้ว่า parent เป็น auto-layout */
function applySizing(node, spec) {
  const s = spec.size || {};
  const boxy = (t) => t === 'FRAME' || t === 'COMPONENT' || t === 'INSTANCE';
  const canHug = node.type === 'TEXT' || (boxy(node.type) && node.layoutMode !== 'NONE');
  const parentIsAuto = node.parent && boxy(node.parent.type) && node.parent.layoutMode !== 'NONE';

  if (typeof s.w === 'number' && typeof s.h === 'number' && 'resize' in node) {
    try { node.resize(Math.max(0.01, s.w), Math.max(0.01, s.h)); } catch (e) { /* auto-layout คุมอยู่ */ }
  }
  if ('layoutSizingHorizontal' in node) {
    let mode = s.wMode || 'FIXED';
    if (mode === 'HUG' && !canHug) mode = 'FIXED';
    if (mode === 'FILL' && !parentIsAuto) mode = 'FIXED';
    try { node.layoutSizingHorizontal = mode; } catch (e) { warn('ตั้งความกว้าง ' + mode + ' ไม่ได้ที่ "' + node.name + '"'); }
  }
  if ('layoutSizingVertical' in node) {
    let mode = s.hMode || 'FIXED';
    if (mode === 'HUG' && !canHug) mode = 'FIXED';
    if (mode === 'FILL' && !parentIsAuto) mode = 'FIXED';
    try { node.layoutSizingVertical = mode; } catch (e) { warn('ตั้งความสูง ' + mode + ' ไม่ได้ที่ "' + node.name + '"'); }
  }

  // pseudo ที่ CSS สั่ง position:absolute — ต้องหลุดจาก flow ของ auto-layout
  // ไม่งั้นมันจะถูกจัดเรียงเป็นลูกในแถวแทนที่จะทับอยู่ตามพิกัด
  if (spec.absolute && parentIsAuto && 'layoutPositioning' in node) {
    try { node.layoutPositioning = 'ABSOLUTE'; }
    catch (e) { warn('ตั้ง ABSOLUTE ไม่ได้ที่ "' + node.name + '"'); }
  }

  // พ่อไม่มี auto-layout ⇒ ลูกต้องบอกตำแหน่งเอง · หรือลูกเป็น absolute ก็ต้องบอกเอง
  // ต้องทำหลัง resize ไม่งั้นค่าที่ตั้งไว้โดนเขียนทับ
  const positioned = spec.absolute || !parentIsAuto;
  if (spec.pos && positioned && 'x' in node) {
    let x = spec.pos.x, y = spec.pos.y;
    // Figma หมุนรอบมุมซ้ายบนของ node แต่ CSS หมุนรอบ transform-origin
    // ⇒ เลื่อนชดเชยให้จุดหมุนอยู่ที่เดิม: P = P0 + o − R·o
    if (typeof spec.rotation === 'number' && spec.rotation !== 0 && spec.rotateOrigin) {
      const rad = spec.rotation * Math.PI / 180;
      const cos = Math.cos(rad), sin = Math.sin(rad);
      const ox = spec.rotateOrigin[0], oy = spec.rotateOrigin[1];
      x += ox - (ox * cos + oy * sin);
      y += oy - (-ox * sin + oy * cos);
    }
    node.x = x;
    node.y = y;
  }

  if (typeof spec.rotation === 'number' && spec.rotation !== 0 && 'rotation' in node) {
    try { node.rotation = spec.rotation; }
    catch (e) { warn('ตั้งมุมหมุนไม่ได้ที่ "' + node.name + '"'); }
  }
}

/* ไอคอน — SVG ที่ 0-icons.js โหลดมาจาก Google Fonts
   ต้องใช้ rescale() ไม่ใช่ resize() เพราะ resize ขยายแต่กรอบ ตัวเส้นไม่ขยายตาม */
function buildSvg(spec, parent) {
  let node;
  try {
    node = figma.createNodeFromSvg(spec.svg);
  } catch (e) {
    warn('สร้างไอคอนไม่ได้: ' + spec.name + ' — ' + e.message);
    return null;
  }
  node.name = spec.name || 'icon';
  parent.appendChild(node);

  const want = (spec.size && spec.size.w) || 20;
  if (node.width > 0 && Math.abs(node.width - want) > 0.5) {
    try { node.rescale(want / node.width); } catch (e) { /* ขนาดเดิมก็พอใช้ได้ */ }
  }

  recolorVectors(node, spec.color);
  node.fills = [];        // กรอบนอกของ SVG ต้องใส เห็นแต่ตัวไอคอน
  return node;
}

/* ทาสีทุกเส้น/พื้นข้างในไอคอน — ใช้ทั้งตอนวาด svg สดและตอน override ใน instance */
function recolorVectors(root, hex) {
  const fill = boundSolid(hex);
  if (!fill) return;
  (function paint(n) {
    if ('fills' in n && Array.isArray(n.fills) && n.fills.length) n.fills = [fill];
    if ('strokes' in n && Array.isArray(n.strokes) && n.strokes.length) n.strokes = [fill];
    if ('children' in n) n.children.forEach(paint);
  })(root);
}

/* ---------- component registry ----------
   เติมโดย buildComponents ก่อนสร้างหน้าจอ — หน้าจออ้างผ่านชื่อชุด+key */
const REG = { icons: {}, sets: {} };

async function buildNode(spec, parent) {
  if (spec.type === 'svg') {
    // มี icon component แล้ว → วาง instance แทนการวาด svg ซ้ำ (สลับไอคอนได้ทีหลัง)
    const iconComp = spec.glyph && REG.icons[spec.glyph];
    if (iconComp) {
      const inst = iconComp.createInstance();
      parent.appendChild(inst);
      inst.name = spec.name || 'icon / ' + spec.glyph;
      const want = (spec.size && spec.size.w) || 20;
      if (inst.width > 0 && Math.abs(inst.width - want) > 0.5) {
        try { inst.rescale(want / inst.width); } catch (e) { /* ขนาดเดิมก็พอใช้ได้ */ }
      }
      if (spec.color) recolorVectors(inst, spec.color);
      applySizing(inst, Object.assign({}, spec, { size: {} }));
      return inst;
    }
    const node = buildSvg(spec, parent);
    if (node) applySizing(node, Object.assign({}, spec, { size: {} }));   // ข้าม resize ปล่อยขนาดที่ rescale ไว้
    return node;
  }
  if (spec.type === 'instance') {
    const comp = REG.sets[spec.set + '§' + spec.key];
    if (comp) return await buildInstance(spec, parent, comp);
    warn('ไม่พบ component ' + spec.set + ' § ' + spec.key + ' → วาดเป็น frame แทน');
    spec = Object.assign({}, spec, { type: 'frame' });
  }
  const node = await createNode(spec);
  node.name = spec.name || spec.type || 'node';
  applyLayout(node, spec);
  parent.appendChild(node);
  applyPaint(node, spec);

  if (Array.isArray(spec.children)) {
    for (const child of spec.children) await buildNode(child, node);
  }
  applySizing(node, spec);
  return node;
}

/* ---------- instance + override ----------
   index ของ override นับจากตัวนิยามแบบ pre-order (2-map.js นับมาให้)
   ตรงกับลำดับ findAll ของ Figma พอดี — node ที่ถูกซ่อนก็ยังอยู่ในลำดับ */
async function buildInstance(spec, parent, comp) {
  const inst = comp.createInstance();
  parent.appendChild(inst);
  inst.name = spec.name || comp.name;
  const ov = spec.overrides || {};

  for (const path of ov.hidden || []) {
    try {
      let n = inst;
      for (const idx of path) n = n.children[idx];
      n.visible = false;
    } catch (e) { warn('ซ่อนชิ้นส่วนใน "' + inst.name + '" ไม่ได้'); }
  }

  const textNodes = inst.findAll(n => n.type === 'TEXT');
  for (const o of ov.texts || []) {
    const tn = textNodes[o.i];
    if (!tn) { warn('หา text ตัวที่ ' + o.i + ' ใน "' + inst.name + '" ไม่เจอ'); continue; }
    const family = tn.fontName.family;
    const font = await resolveFont(family, o.weight || WEIGHT_OF(tn));
    tn.fontName = font;
    tn.characters = String(o.chars == null ? '' : o.chars);
    if (o.size) tn.fontSize = o.size;
    if (o.color) { const p = boundSolid(o.color); if (p) tn.fills = [p]; }
  }

  const iconNodes = inst.findAll(n => n.type === 'INSTANCE' && n.name.indexOf('icon / ') === 0);
  for (const o of ov.icons || []) {
    const icn = iconNodes[o.i];
    if (!icn) { warn('หาไอคอนตัวที่ ' + o.i + ' ใน "' + inst.name + '" ไม่เจอ'); continue; }
    const target = o.glyph && REG.icons[o.glyph];
    if (target && icn.name !== 'icon / ' + o.glyph) {
      try { icn.swapComponent(target); icn.name = 'icon / ' + o.glyph; }
      catch (e) { warn('สลับไอคอนเป็น ' + o.glyph + ' ใน "' + inst.name + '" ไม่ได้'); }
    }
    if (o.color) recolorVectors(icn, o.color);
  }

  applySizing(inst, spec);
  return inst;
}

/* น้ำหนักปัจจุบันของ text node — ไว้คงน้ำหนักเดิมตอน override แค่ข้อความ */
function WEIGHT_OF(tn) {
  const style = tn.fontName && tn.fontName.style;
  for (const [w, s] of Object.entries(WEIGHT_STYLE)) if (s === style) return parseInt(w, 10);
  return 400;
}

/* ---------- หน้า Foundations & Components ----------
   ไอคอน → ชุด variant → specimen (ลำดับนี้เพราะชุดหลังใช้ของชุดแรกได้) */
async function buildComponents(comp) {
  REG.icons = {}; REG.sets = {};
  if (!comp) return { sets: 0, icons: 0 };

  const pageName = comp.pageName || 'Foundations & Components';
  let page = figma.root.children.find(p => p.name === pageName);
  if (page) {
    for (const child of page.children.slice()) child.remove();   // รันซ้ำ = ล้างแล้วสร้างใหม่
  } else {
    page = figma.createPage();
    page.name = pageName;
  }

  let y = 0;

  if (Array.isArray(comp.icons) && comp.icons.length) {
    const grid = figma.createFrame();
    grid.name = 'icons';
    page.appendChild(grid);
    grid.layoutMode = 'HORIZONTAL';
    grid.layoutWrap = 'WRAP';
    grid.itemSpacing = 24;
    grid.counterAxisSpacing = 24;
    grid.paddingTop = grid.paddingRight = grid.paddingBottom = grid.paddingLeft = 24;
    grid.resize(640, 100);
    grid.layoutSizingVertical = 'HUG';
    grid.fills = [];
    for (const ic of comp.icons) {
      let svgNode;
      try { svgNode = figma.createNodeFromSvg(ic.svg); }
      catch (e) { warn('สร้าง icon component ไม่ได้: ' + ic.glyph); continue; }
      const c = figma.createComponent();
      c.name = 'icon / ' + ic.glyph;
      c.resizeWithoutConstraints(svgNode.width || 20, svgNode.height || 20);
      c.appendChild(svgNode);
      svgNode.x = 0; svgNode.y = 0;
      svgNode.fills = [];
      c.fills = [];
      grid.appendChild(c);
      REG.icons[ic.glyph] = c;
    }
    grid.x = 0; grid.y = y;
    y += grid.height + 120;
  }

  for (const setDef of comp.sets || []) {
    const variantNodes = [];
    for (const v of setDef.variants || []) {
      const c = figma.createComponent();
      c.name = v.key;                       // 'Hierarchy=primary, Size=md' — รูปแบบที่ combineAsVariants ต้องการ
      page.appendChild(c);
      applyLayout(c, v.root);
      applyPaint(c, v.root);
      for (const child of v.root.children || []) await buildNode(child, c);
      applySizing(c, v.root);
      variantNodes.push(c);
      REG.sets[setDef.set + '§' + v.key] = c;
    }
    if (!variantNodes.length) continue;
    let shown;
    if (variantNodes.length === 1 && variantNodes[0].name === 'default') {
      shown = variantNodes[0];
      shown.name = setDef.set;              // ตัวเดียวไม่มี prop — เป็น component เดี่ยวชื่อชุดตรงๆ
    } else {
      shown = figma.combineAsVariants(variantNodes, page);
      shown.name = setDef.set;
    }
    shown.x = 0; shown.y = y;
    y += shown.height + 120;
  }

  for (const sp of comp.specimens || []) {
    const c = figma.createComponent();
    c.name = sp.name;
    page.appendChild(c);
    applyLayout(c, sp.root);
    applyPaint(c, sp.root);
    for (const child of sp.root.children || []) await buildNode(child, c);
    applySizing(c, sp.root);
    c.x = 0; c.y = y;
    y += c.height + 120;
  }

  return { sets: Object.keys(REG.sets).length, icons: Object.keys(REG.icons).length };
}

/* ---------- สร้างทั้งสเปก ---------- */
async function buildSpec(spec) {
  warnings.length = 0;
  await figma.loadAllPagesAsync();

  // ลำดับสำคัญ: variables → components → หน้าจอ (instance ชี้หา component ที่เพิ่งสร้าง)
  const varCount = await syncVariables(spec.variables);
  const compInfo = await buildComponents(spec.components);

  const pageName = spec.pageName || 'Maintain-D';
  let page = figma.root.children.find(p => p.name === pageName);
  if (page) {
    // รันซ้ำ = ล้างของเดิมแล้วสร้างใหม่ ไม่ให้หน้าซ้อนกันรก
    for (const child of page.children.slice()) child.remove();
  } else {
    page = figma.createPage();
    page.name = pageName;
  }
  await figma.setCurrentPageAsync(page);

  const made = [];
  let x = 0;
  for (const screen of spec.screens || []) {
    const frame = await buildNode(screen.root, page);
    frame.name = screen.name || frame.name;
    frame.x = x;
    frame.y = 0;
    x += frame.width + 160;
    made.push(frame);
  }

  if (made.length) figma.viewport.scrollAndZoomIntoView(made);
  return {
    screens: made.length,
    variables: varCount,
    components: compInfo.sets,
    icons: compInfo.icons,
    warnings: warnings.slice()
  };
}

/* ---------- สเปกตัวอย่าง ----------
   ไว้ทดสอบว่า import ปลั๊กอินสำเร็จโดยไม่ต้องรัน serve.js
   วางไว้ที่นี่ไม่ใช่ ui.html เพราะกฎโปรเจกต์ห้าม hex ในไฟล์ .html
   โครง = หน้า "ออกเลขงาน" ฉบับย่อ: sidebar + topbar + การ์ด 1 ใบ    */
const T = (chars, o) => ({ type: 'text', name: chars.slice(0, 20), text: Object.assign({ chars }, o || {}) });

const SAMPLE_SPEC = {
  version: 1,
  pageName: 'Maintain-D — ตัวอย่าง',
  screens: [{
    name: 'ออกเลขงาน (ตัวอย่าง)',
    root: {
      type: 'frame', name: 'shell', fill: '#FAFAFA',
      size: { w: 1280, h: 720, wMode: 'FIXED', hMode: 'FIXED' },
      layout: { mode: 'HORIZONTAL', gap: 0, padding: [0, 0, 0, 0] },
      children: [
        { type: 'frame', name: 'side', fill: '#181D27',
          size: { w: 64, wMode: 'FIXED', hMode: 'FILL' },
          layout: { mode: 'VERTICAL', gap: 8, padding: [16, 12, 16, 12], cross: 'CENTER' },
          children: [T('VMS+', { color: '#FFFFFF', size: 14, weight: 700 })] },

        { type: 'frame', name: 'work',
          size: { wMode: 'FILL', hMode: 'FILL' },
          layout: { mode: 'VERTICAL', gap: 0, padding: [0, 0, 0, 0] },
          children: [
            { type: 'frame', name: 'topbar', fill: '#FFFFFF',
              stroke: { color: '#E9EAEB', weight: 1, sides: [0, 0, 1, 0] },
              size: { wMode: 'FILL', h: 56, hMode: 'FIXED' },
              layout: { mode: 'HORIZONTAL', gap: 8, padding: [16, 24, 16, 24], cross: 'CENTER' },
              children: [T('กบค. — ผู้ทำแผน', { color: '#414651', size: 14 })] },

            { type: 'frame', name: 'content',
              size: { wMode: 'FILL', hMode: 'FILL' },
              layout: { mode: 'VERTICAL', gap: 16, padding: [24, 24, 24, 24] },
              children: [
                T('ออกเลขงาน — แผนบำรุงรักษาประจำปี', { color: '#181D27', size: 18, weight: 600, lineHeight: 28 }),
                { type: 'frame', name: 'card', fill: '#FFFFFF', radius: 16,
                  stroke: { color: '#E9EAEB', weight: 1 },
                  shadows: [{ color: '#101828', a: 0.06, x: 0, y: 1, blur: 2 }],
                  size: { wMode: 'FILL', hMode: 'HUG' },
                  layout: { mode: 'VERTICAL', gap: 12, padding: [20, 20, 20, 20] },
                  children: [
                    T('รายการรถในแผน', { color: '#181D27', size: 16, weight: 600, lineHeight: 24 }),
                    T('เลือกรถที่ต้องการบรรจุเข้าแผนบำรุงรักษาประจำปี 2569', { color: '#535862', size: 14, lineHeight: 20 }),
                    { type: 'frame', name: 'actions',
                      size: { wMode: 'HUG', hMode: 'HUG' },
                      layout: { mode: 'HORIZONTAL', gap: 8, padding: [0, 0, 0, 0], cross: 'CENTER' },
                      children: [
                        { type: 'frame', name: 'btn / primary / md', fill: '#A80689', radius: 8,
                          size: { wMode: 'HUG', hMode: 'HUG' },
                          layout: { mode: 'HORIZONTAL', gap: 6, padding: [10, 14, 10, 14], cross: 'CENTER' },
                          children: [T('ออกเลขงาน', { color: '#FFFFFF', size: 14, weight: 600, lineHeight: 20 })] },
                        { type: 'frame', name: 'btn / secondary / md', fill: '#FFFFFF', radius: 8,
                          stroke: { color: '#D5D7DA', weight: 1 },
                          size: { wMode: 'HUG', hMode: 'HUG' },
                          layout: { mode: 'HORIZONTAL', gap: 6, padding: [10, 14, 10, 14], cross: 'CENTER' },
                          children: [T('ยกเลิก', { color: '#414651', size: 14, weight: 600, lineHeight: 20 })] },
                        { type: 'frame', name: 'badge / success', fill: '#ECFDF3', radius: 99,
                          stroke: { color: '#ABEFC6', weight: 1 },
                          size: { wMode: 'HUG', hMode: 'HUG' },
                          layout: { mode: 'HORIZONTAL', gap: 4, padding: [2, 8, 2, 8], cross: 'CENTER' },
                          children: [T('พร้อมเบิก', { color: '#067647', size: 12, weight: 500, lineHeight: 18 })] }
                      ] }
                  ] }
              ] }
          ] }
      ]
    }
  }]
};

/* ---------- รับคำสั่งจาก UI ---------- */
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'build' || msg.type === 'sample') {
    try {
      const result = await buildSpec(msg.type === 'sample' ? SAMPLE_SPEC : msg.spec);
      figma.ui.postMessage({ type: 'done', result });
      figma.notify('สร้างแล้ว ' + result.screens + ' หน้าจอ · variable ' + (result.variables || 0) +
        ' · component ' + (result.components || 0) + ' · ไอคอน ' + (result.icons || 0) +
        (result.warnings.length ? ' · เตือน ' + result.warnings.length + ' รายการ' : ''));
    } catch (e) {
      figma.ui.postMessage({ type: 'error', message: String(e && e.message ? e.message : e) });
      figma.notify('สร้างไม่สำเร็จ — ดูรายละเอียดในหน้าต่างปลั๊กอิน', { error: true });
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};
