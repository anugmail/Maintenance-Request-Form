#!/usr/bin/env node
/* ============================================================================
   รับผลจากปลั๊กอิน (figma-export/out/figma-dump/<slug>/) → เข้ารูปแบบมาตรฐานของโปรเจกต์
   ----------------------------------------------------------------------------
   ทำไมต้องมี: ปลั๊กอินเขียนไฟล์รายหน้าไว้ใน out/ (gitignore) แต่เครื่องมือของเรา
   (verify-tokens.js · compare-figma.js · figma-screens.js) อ่านจาก design-system/.figma-extract/
   สคริปต์นี้จึงคัดลอก + สร้างไฟล์สรุปให้ครบชุด
     <page-id>.json                       ค่าดีไซน์รายหน้า (เหมือนเดิม)
     00-pages.json                        รายชื่อหน้า
     00-summary-colors-radii-fonts.json   นับสี · radius · ชุดฟอนต์ทั้งไฟล์
     00-components.json                   แคตตาล็อก component (ถอดค่าข้อความจริงทิ้ง)
   ใช้: node design-system/figma-dump-import.js [slug]
   ============================================================================ */
const fs = require('fs'), path = require('path');
const SRC = path.join(__dirname, '..', 'figma-export', 'out', 'figma-dump');
const DST = path.join(__dirname, '.figma-extract');
if (!fs.existsSync(SRC)) { console.error('ยังไม่มี ' + SRC + ' — รันปลั๊กอิน dump-plugin ก่อน'); process.exit(1); }

const only = process.argv[2];
for (const slug of fs.readdirSync(SRC).filter(d => fs.statSync(path.join(SRC, d)).isDirectory())) {
  if (only && slug !== only) continue;
  const from = path.join(SRC, slug), to = path.join(DST, slug);
  fs.mkdirSync(to, { recursive: true });
  const colors = {}, radii = {}, fonts = {}, comps = [];
  const pages = [];
  const bump = (o, k) => { if (k !== undefined && k !== null && k !== '') o[k] = (o[k] || 0) + 1; };

  const files = fs.readdirSync(from).filter(f => /\.json$/.test(f) && !f.startsWith('00-'));
  for (const f of files) {
    const raw = fs.readFileSync(path.join(from, f), 'utf8');
    fs.writeFileSync(path.join(to, f), raw);
    const d = JSON.parse(raw);
    pages.push({ id: d.node, name: d.page, file: f });
    (function walk(n, page) {
      (n.fill || []).forEach(h => bump(colors, h));
      (n.stroke || []).forEach(h => bump(colors, h));
      if (typeof n.r === 'number') bump(radii, n.r.toFixed(1));
      if (n.font && n.font.size) {
        // ปลั๊กอินให้ style เป็นชื่อ ("SemiBold") แต่ชุดเดิม/เครื่องมือของเราใช้เลขน้ำหนัก ⇒ แปลงให้ตรงกัน
        const W = { Thin: 100, ExtraLight: 200, UltraLight: 200, Light: 300, Regular: 400, Normal: 400, Book: 400,
                    Medium: 500, SemiBold: 600, Semibold: 600, DemiBold: 600, Bold: 700, ExtraBold: 800, Black: 900 };
        const st = String(n.font.style || '').replace(/\s*Italic$/i, '').replace(/\s+/g, '').trim();
        bump(fonts, [n.font.fam, Number(n.font.size).toFixed(1), W[st] || st || 400, n.font.lh || ''].join('|'));
      }
      if (n.type === 'COMPONENT_SET') {
        comps.push({
          name: n.name, page,
          variants: (n.kids || []).filter(k => k.type === 'COMPONENT').map(k => k.name),
          // ถอด defaultValue ของ property ชนิด TEXT ทิ้ง — เป็นข้อความจากไฟล์งาน ห้าม commit
          properties: Object.entries(n.props || {}).map(([k, v]) => ({
            name: k, type: v.type,
            defaultValue: v.type === 'TEXT' ? null : v.defaultValue,
            options: v.variantOptions || null,
          })),
        });
      }
      (n.kids || []).forEach(k => walk(k, page));
    })({ kids: d.sets }, d.page);
  }
  fs.writeFileSync(path.join(to, '00-pages.json'), JSON.stringify({ slug, pages: pages.sort((a, b) => a.name.localeCompare(b.name)) }, null, 1));
  fs.writeFileSync(path.join(to, '00-summary-colors-radii-fonts.json'), JSON.stringify({ colors, radii, fonts }, null, 0));
  fs.writeFileSync(path.join(to, '00-components.json'), JSON.stringify(
    { slug, componentSetCount: comps.length, components: comps.sort((a, b) => b.variants.length - a.variants.length) }, null, 1));
  console.log(`${slug}: ${files.length} หน้า · สี ${Object.keys(colors).length} · radius ${Object.keys(radii).length} · ฟอนต์ ${Object.keys(fonts).length} · component set ${comps.length}`);
}
