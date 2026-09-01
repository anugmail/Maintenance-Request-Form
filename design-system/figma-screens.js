#!/usr/bin/env node
/* ============================================================================
   ไล่ดูว่าไฟล์ Figma ที่ดึงมามีหน้าจอ/เฟรมอะไรบ้าง (อ่านจาก .figma-extract/<slug>/)
   ใช้:
     node design-system/figma-screens.js                    # ทุกหน้าของ ui-release2
     node design-system/figma-screens.js ui-release2 Breakdown   # เฉพาะหน้าที่ชื่อตรง regex
     node design-system/figma-screens.js component Checkbox --deep
   `--deep` = ไล่ลูกอีกชั้น (ดูว่าในเฟรมมีอะไร)
   ============================================================================ */
const fs = require('fs'), path = require('path');
const DIR = path.join(__dirname, '.figma-extract');
const [slug = 'ui-release2', filter = '', ...flags] = process.argv.slice(2);
const deep = flags.includes('--deep');
const dir = path.join(DIR, slug);
if (!fs.existsSync(dir)) { console.error(`ไม่พบ ${path.relative(process.cwd(), dir)} — รัน pull-figma-pages.js ก่อน`); process.exit(1); }

const re = filter ? new RegExp(filter, 'i') : null;
const files = fs.readdirSync(dir).filter(f => /^\d+-\d+\.json$/.test(f));
let pages = 0, frames = 0;
for (const f of files.sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
  if (re && !re.test(d.page)) continue;
  pages++;
  console.log(`\n═══ ${d.page}  (${d.node}) · ${d.sets.length} โหนดบนสุด`);
  for (const s of d.sets) {
    const sz = s.w ? `${s.w}×${s.h}` : '';
    console.log(`  · ${(s.name || '').slice(0, 60).padEnd(62)} ${String(s.type).padEnd(14)} ${sz}`);
    frames++;
    if (deep) for (const k of (s.kids || []).slice(0, 25))
      console.log(`      ↳ ${(k.name || '').slice(0, 54).padEnd(56)} ${String(k.type).padEnd(12)} ${k.w ? k.w + '×' + k.h : ''}`);
  }
}
console.log(`\nรวม ${pages} หน้า · ${frames} โหนดบนสุด`);
