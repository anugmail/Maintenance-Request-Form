#!/usr/bin/env node
/* ============================================================
   ท่อนที่ 2 — dom-*.json → spec.json
   ------------------------------------------------------------
   หลักการที่ใช้ตัดสิน: **geometry เป็นคนบอกโครง · CSS เป็นคนบอกหน้าตา**

   ทำไมไม่เชื่อ `display` ตรงๆ: หน้าจอนี้มี block 272 · table-cell 215 ·
   flex 173 · inline-flex 68 · inline 41 · inline-block 28 · grid 2
   ถ้าเขียน rule แยกทุกค่าจะพลาดเคสผสมเรื่อยๆ แต่ "ลูกเรียงลงล่าง"
   กับ "ลูกเรียงไปขวา" วัดจากพิกัดจริงได้แม่นกว่า และครอบคลุมทุก display

   รัน:  node figma-export/2-map.js             → out/spec.json (4 หน้า yearly)
         node figma-export/2-map.js --report    → out/spec-report.json
                                                  (โฟลว์แจ้งซ่อมฝั่งผู้แจ้ง 8 state จาก flow-report-extract.js)

   สองท่อไม่แตะกัน: spec*.json ของท่อ Figma design · board.json ของบอร์ด FigJam
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { nameFor, isKnown, ICON_CLASS, GAP_TOLERANCE } = require('./mapping');
const { parseTokens } = require('./tokens-vars');
const { collectComponents } = require('./components-map');

const OUT = path.join(__dirname, 'out');
const REPORT = process.argv.includes('--report');
// plan-skeleton พักไว้ก่อนตามที่เจ้าของงานสั่ง 11 ส.ค. 2569 · admin ตัดออกเพราะใหญ่เกิน (3,770 node)
const SLUGS = REPORT
  ? Array.from({ length: 8 }, (_, i) => 'report-0' + (i + 1))
  : ['index', 'plan-new', 'supplies', 'confirm'];
const PAGE_NAME = REPORT ? 'Screens — แจ้งซ่อม (ฝั่งผู้แจ้ง)' : 'Screens — บำรุงรักษาประจำปี';
const OUT_FILE = REPORT ? 'spec-report.json' : 'spec.json';

const ICONS = (() => {
  const f = path.join(OUT, 'icons.json');
  if (!fs.existsSync(f)) { console.error('ไม่พบ out/icons.json — รัน 0-icons.js ก่อน'); process.exit(1); }
  return JSON.parse(fs.readFileSync(f, 'utf8'));
})();

const GAP_SPREAD_OK = 20;   // ระยะห่างต่างกันเกินนี้ → เลิกใช้ auto-layout วางตามพิกัดแทน
const EDGE = 2;             // ความคลาดเคลื่อนที่ยอมรับตอนตัดสินว่าเรียงต่อกันไหม
const PUSH_GAP = 24;        // ช่องว่างที่โตกว่าเพื่อนเกินนี้ = เกิดจาก margin:auto ไม่ใช่ระยะที่ตั้งใจ

const stats = { nodes: 0, texts: 0, unknown: {}, absolute: [], gapApprox: 0, pseudo: 0, spaceBetween: 0, icons: 0, iconMissing: {} };

/* ---------- ตัวช่วยอ่านค่า CSS ---------- */
const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

function parseColor(v) {
  if (!v) return null;
  const m = String(v).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map(s => parseFloat(s.trim()));
  const a = p.length > 3 ? p[3] : 1;
  if (!(a > 0)) return null;                       // โปร่งใสสนิท = ไม่ต้องมี fill
  const hex = '#' + p.slice(0, 3).map(n => Math.round(n).toString(16).padStart(2, '0')).join('').toUpperCase();
  return { hex, alpha: a };
}

/* computed boxShadow ของ Chromium: "rgba(...) Xpx Ypx Bpx Spx, …" */
function parseShadows(v) {
  if (!v || v === 'none') return null;
  const out = [];
  for (const part of String(v).split(/,(?![^(]*\))/)) {
    const cm = part.match(/rgba?\(([^)]+)\)/);
    if (!cm) continue;
    const c = parseColor(cm[0]);
    if (!c) continue;
    const nums = (part.replace(cm[0], '').match(/-?\d*\.?\d+px/g) || []).map(px);
    if (nums.length < 2) continue;
    if (part.includes('inset')) continue;          // Figma ทำ inner shadow ได้ แต่ระบบนี้ไม่มีใช้
    out.push({ color: c.hex, a: c.alpha, x: nums[0], y: nums[1], blur: nums[2] || 0, spread: nums[3] || 0 });
  }
  return out.length ? out : null;
}

function radiusOf(s) {
  const r = [s.borderTopLeftRadius, s.borderTopRightRadius, s.borderBottomRightRadius, s.borderBottomLeftRadius].map(px);
  if (r.every(v => v === r[0])) return r[0] || undefined;
  return r;
}

function strokeOf(s) {
  const w = [s.borderTopWidth, s.borderRightWidth, s.borderBottomWidth, s.borderLeftWidth].map(px);
  const c = [s.borderTopColor, s.borderRightColor, s.borderBottomColor, s.borderLeftColor].map(parseColor);
  const styles = [s.borderTopStyle, s.borderRightStyle, s.borderBottomStyle, s.borderLeftStyle];
  const live = w.map((v, i) => (v > 0 && c[i] && styles[i] !== 'none') ? v : 0);
  if (!live.some(v => v > 0)) return undefined;
  const color = (c[live.findIndex(v => v > 0)] || {}).hex;
  if (live.every(v => v === live[0])) return { color, weight: live[0] };
  return { color, weight: Math.max(...live), sides: live };
}

const FIGMA_ALIGN = { 'flex-start': 'MIN', 'start': 'MIN', 'center': 'CENTER', 'flex-end': 'MAX', 'end': 'MAX', 'space-between': 'SPACE_BETWEEN' };
const FIGMA_CROSS = { 'flex-start': 'MIN', 'start': 'MIN', 'center': 'CENTER', 'flex-end': 'MAX', 'end': 'MAX', 'baseline': 'BASELINE', 'stretch': 'MIN', 'normal': 'MIN' };

/* ---------- geometry: ลูกเรียงแบบไหน ---------- */
function rectOf(n) { return n.rect || { x: 0, y: 0, w: 0, h: 0 }; }

function classify(children) {
  if (children.length === 0) return { mode: null };
  if (children.length === 1) return { mode: 'VERTICAL', order: children, gaps: [] };

  const byY = children.slice().sort((a, b) => rectOf(a).y - rectOf(b).y);
  const byX = children.slice().sort((a, b) => rectOf(a).x - rectOf(b).x);

  const fits = (arr, axis) => {
    const gaps = [];
    for (let i = 0; i < arr.length - 1; i++) {
      const a = rectOf(arr[i]), b = rectOf(arr[i + 1]);
      const end = axis === 'y' ? a.y + a.h : a.x + a.w;
      const start = axis === 'y' ? b.y : b.x;
      if (start < end - EDGE) return null;          // ซ้อนทับ = ไม่ใช่การเรียงต่อกัน
      gaps.push(start - end);
    }
    return gaps;
  };

  const vGaps = fits(byY, 'y');
  const hGaps = fits(byX, 'x');
  if (vGaps && !hGaps) return { mode: 'VERTICAL', order: byY, gaps: vGaps };
  if (hGaps && !vGaps) return { mode: 'HORIZONTAL', order: byX, gaps: hGaps };
  if (vGaps && hGaps) {
    // เรียงได้ทั้งสองแกน (เช่นลูกตัวเดียวต่อแถว) — เลือกแกนที่กระจายตัวมากกว่า
    const spanY = Math.max(...children.map(c => rectOf(c).y)) - Math.min(...children.map(c => rectOf(c).y));
    const spanX = Math.max(...children.map(c => rectOf(c).x)) - Math.min(...children.map(c => rectOf(c).x));
    return spanY >= spanX ? { mode: 'VERTICAL', order: byY, gaps: vGaps } : { mode: 'HORIZONTAL', order: byX, gaps: hGaps };
  }
  return { mode: null };
}

/* ---------- ย่อหน้าที่มี inline element ปน → text node เดียว ----------
   ปัญหาที่แก้: `<div>ข้อความ <code>x</code> ต่อ <b>y</b></div>` เดิมถูกแตกเป็น
   กล่องข้อความหลายกล่องวางตามพิกัด พอฟอนต์ใน Figma กว้างไม่เท่าเบราว์เซอร์
   กล่องก็เลื่อนทับกันมั่ว (เจ้าของงานเจอจริงที่ขั้น "ข้อมูลติดต่อ/งบ" 12 ส.ค. 2569)
   ทางแก้: รวมเป็น text เดียวแล้วส่ง `ranges` ให้ปลั๊กอินทาน้ำหนัก/สีทีหลัง       */
const INLINE_TAGS = new Set(['b', 'strong', 'em', 'i', 'small', 'code', 'span', 'u', 'mark', 'a']);

function collectRuns(c, out) {
  if (c.tag === '#text') { out.push({ chars: c.chars, style: c.style, ws: c, rect: rectOf(c) }); return out; }
  if (!INLINE_TAGS.has(c.tag) || (c.classes || []).includes(ICON_CLASS)) return null;   // ไอคอน/บล็อก = รวมไม่ได้
  for (const k of c.children || []) if (!collectRuns(k, out)) return null;
  return out;
}

const isInlineTextish = (c) => collectRuns(c, []) !== null;

/* จับ "ช่วงที่ติดกัน" ของข้อความ+inline element มารวมเป็น node เดียว
   ไอคอน (.ms) หรือ element แบบบล็อกจะตัดช่วง — ของพวกนั้นยังเป็นลูกของตัวเองเหมือนเดิม */
function mergeInlineChildren(node) {
  const kids = node.children || [];
  if (kids.length < 2) return kids;
  const out = [];
  let buf = [];
  const flush = () => {
    if (buf.length > 1 && buf.some(c => c.tag !== '#text')) {
      const runs = [];
      let ok = true;
      for (const b of buf) if (!collectRuns(b, runs)) { ok = false; break; }
      if (ok && runs.length > 1) {
        const rs = runs.map(r => r.rect);
        const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y));
        out.push({
          tag: '#merged', runs, style: node.style,
          rect: { x, y, w: Math.max(...rs.map(r => r.x + r.w)) - x, h: Math.max(...rs.map(r => r.y + r.h)) - y }
        });
        buf = [];
        return;
      }
    }
    out.push(...buf);
    buf = [];
  };
  for (const c of kids) {
    if (isInlineTextish(c)) buf.push(c);
    else { flush(); out.push(c); }
  }
  flush();
  return out;
}

function convertMerged(node) {
  const runs = node.runs;
  const r = rectOf(node);
  const s = node.style || {};
  let chars = '';
  const ranges = [];
  runs.forEach((run, i) => {
    if (i && (run.ws.wsBefore || runs[i - 1].ws.wsAfter)) chars += ' ';
    const start = chars.length;
    chars += run.chars;
    const w = parseInt(run.style.fontWeight, 10) || 400;
    const col = parseColor(run.style.color);
    const base = parseInt(s.fontWeight, 10) || 400;
    const baseCol = parseColor(s.color);
    const diffW = w !== base;
    const diffC = col && baseCol && col.hex !== baseCol.hex;
    if (diffW || diffC) ranges.push(Object.assign({ start, end: chars.length }, diffW ? { weight: w } : {}, diffC ? { color: col.hex } : {}));
  });

  const lh = s.lineHeight === 'normal' ? Math.round(px(s.fontSize) * 1.4) : px(s.lineHeight);
  stats.texts++;
  stats.flattened = (stats.flattened || 0) + 1;
  const spec = {
    type: 'text',
    name: chars.slice(0, 24),
    size: { w: Math.round(r.w), h: Math.round(r.h), wMode: 'FIXED', hMode: 'FIXED' },
    text: {
      chars, size: px(s.fontSize), weight: parseInt(s.fontWeight, 10) || 400,
      lineHeight: lh || undefined,
      color: (parseColor(s.color) || {}).hex || '#181D27',
      font: 'IBM Plex Sans Thai',
      align: (s.textAlign === 'center' || s.textAlign === 'right') ? s.textAlign.toUpperCase() : 'LEFT',
      autoResize: 'HEIGHT'
    }
  };
  if (ranges.length) spec.text.ranges = ranges;
  spec._rect = r;
  return spec;
}

/* ---------- แปลง node ---------- */
function convert(node, parentRect, ctx) {
  if (node.tag === '#text') return convertText(node, parentRect);
  if (node.tag === '#merged') return convertMerged(node);

  const s = node.style || {};
  const r = rectOf(node);
  const c = node.classes || [];

  if (!isKnown(node)) {
    const key = c.length ? '.' + c.join('.') : '<' + node.tag + '>';
    stats.unknown[key] = (stats.unknown[key] || 0) + 1;
  }

  const childCtx = {
    inActions: ctx.inActions || c.includes('actions'),
    inFooter: ctx.inFooter || c.includes('footer'),
    depth: ctx.depth + 1
  };

  // ไอคอน Material Symbols — ลูกเป็นชื่อไอคอน ไม่ใช่ข้อความที่คนอ่าน
  if (c.includes(ICON_CLASS)) return convertIcon(node, parentRect);

  const kids = [];
  // ย่อหน้าที่มีตัวหนา/<code> ปนกับข้อความ → รวมช่วงที่ติดกันเป็น text เดียว (กันกล่องซ้อนกัน)
  for (const ch of mergeInlineChildren(node)) {
    const spec = convert(ch, r, childCtx);
    if (spec) kids.push({ spec, src: ch });
  }
  // ::before / ::after ที่มีภาพจริง — DOM ไม่มี node ให้เดิน สร้างเพิ่มเอง
  for (const p of node.pseudo || []) {
    const spec = convertPseudo(node, p);
    if (spec) { kids.push({ spec, src: { rect: spec._rect } }); stats.pseudo++; }
  }

  const cls = classify(kids.map(k => k.src));
  let layout = { mode: 'NONE' };
  let ordered = kids;

  if (cls.mode) {
    const idx = new Map(cls.order.map((o, i) => [o, i]));
    ordered = kids.slice().sort((a, b) => idx.get(a.src) - idx.get(b.src));
    const gaps = cls.gaps.map(g => Math.max(0, g));
    const spread = gaps.length ? Math.max(...gaps) - Math.min(...gaps) : 0;
    const push = detectPush(r, ordered, cls.mode, gaps, s);

    if (push) {
      // `margin-left:auto` / `margin-top:auto` — ของถูกดันไปชิดอีกฝั่ง
      // Figma ทำแบบเดียวกันด้วย SPACE_BETWEEN แต่มันกระจายลูก "ทุกตัว"
      // จึงต้องจับกลุ่มสองฝั่งก่อน แล้วให้พ่อมีลูกแค่ 2 กล่อง
      ordered = [groupOf(ordered.slice(0, push.at + 1), cls.mode, push.gapInGroup),
                 groupOf(ordered.slice(push.at + 1), cls.mode, push.gapInGroup)];
      layout = {
        mode: cls.mode,
        gap: 0,
        padding: measuredPadding(r, ordered.map(k => rectOf(k.src))),
        align: 'SPACE_BETWEEN',
        cross: FIGMA_CROSS[s.alignItems] || 'MIN'
      };
      stats.spaceBetween++;
    } else if (gaps.length === 0 || spread <= GAP_SPREAD_OK) {
      if (spread > GAP_TOLERANCE) stats.gapApprox++;
      const gap = gaps.length ? Math.round(gaps.slice().sort((a, b) => a - b)[Math.floor(gaps.length / 2)]) : 0;
      layout = {
        mode: cls.mode,
        gap,
        padding: measuredPadding(r, ordered.map(k => rectOf(k.src))),
        align: FIGMA_ALIGN[s.justifyContent] || 'MIN',
        cross: FIGMA_CROSS[s.alignItems] || 'MIN'
      };
      if (s.flexWrap === 'wrap' && cls.mode === 'HORIZONTAL') layout.wrap = true;
    } else {
      stats.absolute.push(nameFor(node, ctx) + ' (ระยะห่างต่างกัน ' + Math.round(spread) + 'px)');
    }
  } else if (kids.length) {
    stats.absolute.push(nameFor(node, ctx) + ' (ลูกซ้อนทับกัน)');
  }

  // โหมดวางตามพิกัด — ลูกต้องรู้ตำแหน่งของตัวเองเทียบพ่อ
  if (layout.mode === 'NONE') {
    for (const k of ordered) {
      const kr = rectOf(k.src);
      k.spec.pos = { x: Math.round(kr.x - r.x), y: Math.round(kr.y - r.y) };
    }
  }

  stats.nodes++;
  const fill = parseColor(s.backgroundColor);
  const spec = {
    type: 'frame',
    name: nameFor(node, ctx),
    size: { w: Math.round(r.w), h: Math.round(r.h), wMode: 'FIXED', hMode: 'FIXED' },
    layout,
    children: ordered.map(k => k.spec)
  };
  if (fill) { spec.fill = fill.hex; if (fill.alpha < 1) spec.fillOpacity = fill.alpha; }
  const stroke = strokeOf(s);
  if (stroke) spec.stroke = stroke;
  const radius = radiusOf(s);
  if (radius !== undefined && radius !== 0) spec.radius = radius;
  const shadows = parseShadows(s.boxShadow);
  if (shadows) spec.shadows = shadows;
  // ตัดขอบเฉพาะกล่องที่เลื่อนได้จริง — ของเดิมตัดทุกกล่องที่ overflow:hidden
  // ทำให้ป้ายที่ browser ย่อด้วย ellipsis กลายเป็นข้อความโดนหั่นกลางคำใน Figma
  // (เจ้าของงานเจอที่ stepper 12 ส.ค. 2569) · Figma ไม่มี text-overflow อยู่แล้ว
  if (!/auto|scroll/.test(s.overflow || '')) spec.clip = false;
  spec._rect = r;
  return spec;
}

/* หาช่องว่างที่โตผิดพวกเพียงช่องเดียว และของต้องเต็มความยาวกล่องพอดี
   ถ้าไม่เต็ม แปลว่าเป็นแค่ระยะที่ตั้งใจให้ห่าง ไม่ใช่การดันชิดขอบ
   (เช่น sidebar สูง 900px แต่เมนูจบที่ 300px — SPACE_BETWEEN จะดันเมนูตกไปก้นจอ) */
function detectPush(parent, kids, mode, gaps, s) {
  if (gaps.length < 1) return null;
  const sorted = gaps.slice().sort((a, b) => b - a);
  const max = sorted[0];
  const base = sorted.length > 1 ? sorted[1] : 0;
  if (max < base + PUSH_GAP) return null;          // ต้องมีช่องเดียวที่โตผิดพวกจริงๆ

  const rects = kids.map(k => rectOf(k.src));
  const last = rects[rects.length - 1];
  const endChild = mode === 'VERTICAL' ? last.y + last.h : last.x + last.w;
  // ต้องหักด้วย padding + เส้นขอบ เพราะลูกจบที่ขอบ content-box ไม่ใช่ border-box
  const inset = mode === 'VERTICAL'
    ? px(s.paddingBottom) + px(s.borderBottomWidth)
    : px(s.paddingRight) + px(s.borderRightWidth);
  const endParent = (mode === 'VERTICAL' ? parent.y + parent.h : parent.x + parent.w) - inset;
  if (endParent - endChild > 6) return null;       // ยังเหลือที่ว่างท้ายกล่อง = ไม่ใช่การดันชิด

  return { at: gaps.indexOf(max), gapInGroup: base };
}

/* ห่อลูกฝั่งเดียวกันเป็นกล่องเดียว — ถ้ามีตัวเดียวไม่ต้องห่อ จะได้ไม่มี layer ส่วนเกิน */
function groupOf(kids, mode, gap) {
  if (kids.length === 1) return kids[0];
  const rects = kids.map(k => rectOf(k.src));
  const x = Math.min(...rects.map(r => r.x)), y = Math.min(...rects.map(r => r.y));
  const w = Math.max(...rects.map(r => r.x + r.w)) - x;
  const h = Math.max(...rects.map(r => r.y + r.h)) - y;
  const rect = { x, y, w, h };
  return {
    src: { rect },
    spec: {
      type: 'frame',
      name: 'group',
      size: { w: Math.round(w), h: Math.round(h), wMode: 'FIXED', hMode: 'FIXED' },
      layout: { mode, gap: Math.round(gap), padding: [0, 0, 0, 0], align: 'MIN', cross: 'CENTER' },
      children: kids.map(k => k.spec),
      _rect: rect
    }
  };
}

/* padding วัดจากพิกัดจริง ไม่ใช่ค่า computed —
   เพราะ margin ของลูกจะถูกดูดเข้ามาเป็น padding ให้เอง ตรงกับที่ตาเห็น */
function measuredPadding(parent, childRects) {
  if (!childRects.length) return [0, 0, 0, 0];
  const minX = Math.min(...childRects.map(c => c.x));
  const maxX = Math.max(...childRects.map(c => c.x + c.w));
  const minY = Math.min(...childRects.map(c => c.y));
  const maxY = Math.max(...childRects.map(c => c.y + c.h));
  const clamp = (v) => Math.max(0, Math.round(v));
  return [clamp(minY - parent.y), clamp(parent.x + parent.w - maxX), clamp(parent.y + parent.h - maxY), clamp(minX - parent.x)];
}

function convertText(node, parentRect) {
  const s = node.style || {};
  const r = rectOf(node);
  const color = parseColor(s.color);
  const lh = s.lineHeight === 'normal' ? Math.round(px(s.fontSize) * 1.4) : px(s.lineHeight);
  stats.texts++;
  const spec = {
    type: 'text',
    name: node.chars.slice(0, 24),
    size: { w: Math.round(r.w), h: Math.round(r.h), wMode: 'FIXED', hMode: 'FIXED' },
    text: {
      chars: node.chars,
      size: px(s.fontSize),
      weight: parseInt(s.fontWeight, 10) || 400,
      lineHeight: lh || undefined,
      color: color ? color.hex : '#181D27',
      font: 'IBM Plex Sans Thai',
      align: (s.textAlign === 'center' || s.textAlign === 'right') ? s.textAlign.toUpperCase() : 'LEFT'
    }
  };
  // ข้อความบรรทัดเดียว → ให้ Figma hug ตามตัวอักษร · หลายบรรทัด → ล็อกความกว้างไว้ให้ตัดบรรทัดเหมือนเดิม
  if (lh && r.h > lh * 1.4) { spec.text.autoResize = 'HEIGHT'; spec.size.wMode = 'FIXED'; }
  else { spec.text.autoResize = 'WIDTH_AND_HEIGHT'; spec.size.wMode = 'HUG'; spec.size.hMode = 'HUG'; }
  spec._rect = r;
  return spec;
}

/* ไอคอนต้องเป็น vector ไม่ใช่ text — Figma ไม่มีฟอนต์ Material Symbols
   ถ้าปล่อยเป็น text จะได้ "ชื่อไอคอน" ตัดบรรทัดทีละตัวเป็นเสาตัวอักษร (เจอจริงรอบแรก) */
function convertIcon(node, parentRect) {
  const s = node.style || {};
  const r = rectOf(node);
  const glyph = (node.children || []).filter(k => k.tag === '#text').map(k => k.chars).join('').trim();
  const color = parseColor(s.color);
  // ไอคอนบางตัวกล่องใหญ่กว่าตัวรูป (line-height) — ใช้ font-size เป็นขนาดจริงของ glyph
  const side = Math.round(px(s.fontSize) || Math.min(r.w, r.h) || 20);
  stats.nodes++;
  stats.icons++;

  const svg = ICONS[glyph];
  if (!svg) {
    stats.iconMissing[glyph] = (stats.iconMissing[glyph] || 0) + 1;
    const spec = {
      type: 'frame', name: 'icon / ' + (glyph || '?') + ' (ไม่มี svg)',
      size: { w: side, h: side, wMode: 'FIXED', hMode: 'FIXED' },
      layout: { mode: 'NONE' }, children: []
    };
    spec._rect = r;
    return spec;
  }

  const spec = {
    type: 'svg',
    name: 'icon / ' + glyph,
    glyph,                       // ปลั๊กอินใช้หา icon component — มีแล้วจะสร้างเป็น instance ไม่วาด svg ซ้ำ
    svg,
    color: color ? color.hex : '#535862',
    size: { w: side, h: side, wMode: 'FIXED', hMode: 'FIXED' }
  };
  spec._rect = r;
  return spec;
}

/* ::before / ::after — ในระบบนี้เป็นแถบ/เส้น/จุดล้วน ไม่มีข้อความ
   เช่นแถบม่วง 4×20 ของ .sect · เส้นเฉียงของ .wstep · จุดกลมของ .tl */
function convertPseudo(host, p) {
  const s = p.style || {};
  const w = p.width, h = p.height;
  if (!(w > 0 && h > 0)) return null;
  const fill = parseColor(s.backgroundColor);
  if (!fill) return null;
  const hr = rectOf(host);
  const spec = {
    type: 'frame',
    name: (host.classes || []).join('.') + ' ' + p.which,
    size: { w: Math.round(w), h: Math.round(h), wMode: 'FIXED', hMode: 'FIXED' },
    layout: { mode: 'NONE' },
    fill: fill.hex,
    children: []
  };
  const radius = radiusOf(s);
  if (radius !== undefined && radius !== 0) spec.radius = radius;
  // pseudo ไม่มี rect จริงให้วัด — วางไว้ที่มุมซ้ายบนของ host แล้วให้ auto-layout จัดต่อ
  spec._rect = { x: hr.x, y: hr.y, w, h };
  return spec;
}

/* ---------- ล้าง field ภายในก่อนเขียนไฟล์ ---------- */
function strip(n) {
  delete n._rect;
  (n.children || []).forEach(strip);
  if (n.children && n.children.length === 0) delete n.children;
  return n;
}

/* ------------------------------------------------------------ */
function main() {
  const screens = [];
  for (const slug of SLUGS) {
    const file = path.join(OUT, 'dom-' + slug + '.json');
    if (!fs.existsSync(file)) {
      console.error('ไม่พบ ' + file + ' — รัน ' + (REPORT ? 'flow-report-extract.js' : '1-extract.js') + ' ก่อน');
      process.exit(1);
    }
    const d = JSON.parse(fs.readFileSync(file, 'utf8'));
    const before = stats.nodes + stats.texts;
    const root = convert(d.root, null, { inActions: false, inFooter: false, depth: 0 });
    root.name = d.name;
    screens.push({ name: d.name, source: d.source, root: strip(root) });
    console.log('✓ ' + slug.padEnd(14) + (stats.nodes + stats.texts - before) + ' node');
  }

  // ยกของซ้ำเป็น component + instance (mutate screens) — ต้องทำก่อนประกอบ spec
  const components = collectComponents(screens, ICONS, stats);

  // tokens.css → Figma Variables 3 collection + ดัชนีให้ปลั๊กอินผูก fill/radius
  const tokens = parseTokens();
  const variables = { collections: tokens.collections, colorIndex: tokens.colorIndex, radiusIndex: tokens.radiusIndex };
  stats.variables = Object.fromEntries(Object.entries(tokens.collections).map(([k, v]) => [k, v.length]));
  stats.tokensSkipped = tokens.skipped;

  const spec = { version: 2, pageName: PAGE_NAME, generatedAt: new Date().toISOString(), variables, components, screens };
  const outFile = path.join(OUT, OUT_FILE);
  fs.writeFileSync(outFile, JSON.stringify(spec));

  const unknown = Object.entries(stats.unknown).sort((a, b) => b[1] - a[1]);
  console.log('\nรวม ' + stats.nodes + ' frame · ' + stats.texts + ' text · pseudo ' + stats.pseudo + ' จุด');
  console.log('gap ที่ปัดค่า: ' + stats.gapApprox + ' กล่อง · วางตามพิกัด (ไม่ใช้ auto-layout): ' + stats.absolute.length + ' กล่อง');
  console.log('variables: primitive ' + stats.variables.primitive + ' · semantic ' + stats.variables.semantic +
    ' · component ' + stats.variables.component + (tokens.skipped.length ? ' · ข้าม ' + tokens.skipped.length : ''));
  const setSummary = components.sets.map(s => s.set + ' ' + s.variants.length).join(' · ');
  console.log('components: ' + setSummary + ' · specimen ' + components.specimens.length +
    ' · icon ' + components.icons.length + ' → instance ' + stats.instances + ' จุด');
  const fb = Object.entries(stats.componentFallback).sort((a, b) => b[1] - a[1]);
  if (fb.length) {
    console.log('\n⚠ เข้า pattern component แต่โครงไม่ตรงตัวนิยาม (คงเป็น frame):');
    fb.slice(0, 10).forEach(([k, v]) => console.log('   x' + String(v).padStart(3) + '  ' + k));
  }
  if (unknown.length) {
    console.log('\n⚠ คลาสที่ตารางแปลงยังไม่รู้จัก ' + unknown.length + ' แบบ:');
    unknown.slice(0, 15).forEach(([k, v]) => console.log('   x' + String(v).padStart(3) + '  ' + k));
  }
  if (stats.absolute.length) {
    console.log('\nกล่องที่วางตามพิกัด (ดีไซเนอร์ลากแล้วไม่ไหลตาม):');
    stats.absolute.slice(0, 12).forEach(a => console.log('   ' + a));
    if (stats.absolute.length > 12) console.log('   … อีก ' + (stats.absolute.length - 12));
  }
  fs.writeFileSync(path.join(OUT, 'map-report.json'), JSON.stringify(stats, null, 2));
  console.log('\nเขียน ' + path.relative(process.cwd(), outFile) + ' (' + Math.round(fs.statSync(outFile).size / 1024) + 'KB)');
}

main();
