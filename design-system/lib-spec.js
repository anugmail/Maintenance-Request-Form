#!/usr/bin/env node
/* ============================================================================
   อ่าน "สเปกจริง" ของ component จากไลบรารีที่ดึงมา — ใช้ตอนจะจูน components.css
   ใช้: node design-system/lib-spec.js <คำค้นชื่อ component> [จำนวน variant ที่โชว์]
   เช่น node design-system/lib-spec.js "Primary button" 6
   ============================================================================ */
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '.figma-extract', process.env.FIGMA_SRC || 'component');
const [q, lim = '8'] = process.argv.slice(2);
if (!q) { console.error('ใช้: node design-system/lib-spec.js "<ชื่อ component>"'); process.exit(1); }
const re = new RegExp(q, 'i');
const val = n => {
  const p = ['pl', 'pt', 'pr', 'pb'].map(k => n[k] || 0);
  const f = (n.font || {});
  return [
    `${n.w}×${n.h}`,
    n.r !== undefined ? `r${Array.isArray(n.r) ? n.r.join('/') : n.r}` : '',
    n.sw ? `เส้น${n.sw}` : '',
    p.some(Boolean) ? `pad ${p.join('/')}` : '',
    n.gap ? `gap${n.gap}` : '',
    (n.fill || []).length ? `พื้น ${n.fill.join(',')}` : '',
    (n.stroke || []).length ? `ขอบ ${n.stroke.join(',')}` : '',
    f.size ? `${f.fam} ${f.size}/${f.style} lh${f.lh}` : '',
    n.text ? `“${n.text.slice(0, 24)}”` : '',
  ].filter(Boolean).join(' · ');
};
for (const file of fs.readdirSync(DIR).filter(f => /^\d+-\d+\.json$/.test(f))) {
  const d = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'));
  for (const s of d.sets) {
    if (!re.test(s.name || '')) continue;
    console.log(`\n═══ ${s.name}  [${d.page.trim()}]  ${s.type}`);
    (s.kids || []).slice(0, +lim).forEach(k => {
      console.log(`  ${(k.name || '').slice(0, 46).padEnd(48)}${val(k)}`);
      (k.kids || []).slice(0, 4).forEach(g => console.log(`      ↳ ${(g.name || '').slice(0, 40).padEnd(42)}${val(g)}`));
    });
  }
}
