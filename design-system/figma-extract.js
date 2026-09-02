#!/usr/bin/env node
/* ============================================================================
   สกัดดัมป์ดิบของไฟล์ Figma (REST /v1/files/<key>) → <page-id>.json รายหน้า
   + 00-summary-colors-radii-fonts.json
   ----------------------------------------------------------------------------
   เดิมโค้ดนี้อยู่ในโค้ดบล็อกของ HOWTO-read-figma.md ข้อ 5 (ให้ก๊อปไปวางเอง)
   1 ก.ย. 2569 ยกมาเป็นไฟล์จริงในโปรเจกต์ เพราะต้องรันซ้ำทุกครั้งที่ไลบรารีออกเวอร์ชันใหม่
   ใช้: node design-system/figma-extract.js <figma-full.json> <ปลายทาง>
   ============================================================================ */
const fs = require('fs'), path = require('path');
const [src, outDir] = process.argv.slice(2);
if (require.main === module && (!src || !outDir)) { console.error('ใช้: node design-system/figma-extract.js figma-full.json design-system/.figma-extract/<slug>'); process.exit(1); }
const CLI = require.main === module;
if (CLI) fs.mkdirSync(outDir, { recursive: true });
const file = CLI ? JSON.parse(fs.readFileSync(src, 'utf8')) : null;

const hex = c => c && '#' + ['r','g','b'].map(k => Math.round(c[k] * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const fkey = v => Number.isInteger(v) ? v.toFixed(1) : String(v);
const colors = {}, radii = {}, fonts = {};
const bump = (o, k) => { if (k !== undefined && k !== null && k !== '') o[k] = (o[k] || 0) + 1; };

function trim(n) {
  const o = { name: n.name, type: n.type };
  const b = n.absoluteBoundingBox;
  if (b) { o.w = Math.round(b.width); o.h = Math.round(b.height); }
  for (const [k, p] of [['pl','paddingLeft'],['pr','paddingRight'],['pt','paddingTop'],['pb','paddingBottom']])
    if (n[p]) o[k] = n[p];
  if (n.itemSpacing) o.gap = n.itemSpacing;
  if (n.cornerRadius !== undefined) { o.r = n.cornerRadius; bump(radii, fkey(n.cornerRadius)); }
  if (n.rectangleCornerRadii) o.r = n.rectangleCornerRadii;
  if (n.strokeWeight) o.sw = n.strokeWeight;
  if (n.layoutMode && n.layoutMode !== 'NONE') o.dir = n.layoutMode;
  if (n.counterAxisAlignItems) o.align = n.counterAxisAlignItems;

  const pick = arr => (arr || []).filter(p => p.visible !== false && p.type === 'SOLID').map(p => hex(p.color));
  const f = pick(n.fills), s = pick(n.strokes);
  if (f.length) { o.fill = f; f.forEach(h => bump(colors, h)); }
  if (s.length) { o.stroke = s; s.forEach(h => bump(colors, h)); }

  if (n.style) {
    const st = n.style;
    o.font = { fam: st.fontFamily, size: st.fontSize, weight: st.fontWeight, lh: Math.round(st.lineHeightPx || 0) };
    bump(fonts, [st.fontFamily, fkey(st.fontSize), st.fontWeight, Math.round(st.lineHeightPx || 0)].join('|'));
  }
  if (n.characters) o.text = n.characters.slice(0, 80);
  if (n.children && n.children.length) o.kids = n.children.map(trim);
  return o;
}

if (CLI) {
  let n = 0;
  for (const page of file.document.children) {
    const out = { node: page.id, page: page.name, sets: (page.children || []).map(trim) };
    fs.writeFileSync(path.join(outDir, page.id.replace(':', '-') + '.json'), JSON.stringify(out));
    n++;
  }
  fs.writeFileSync(path.join(outDir, '00-summary-colors-radii-fonts.json'), JSON.stringify({ colors, radii, fonts }, null, 0));
  console.log(`  เขียน ${n} หน้า · สี ${Object.keys(colors).length} · radius ${Object.keys(radii).length} · ชุดฟอนต์ ${Object.keys(fonts).length}`);
}
module.exports = { trim, colors, radii, fonts };
