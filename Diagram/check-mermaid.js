// check-mermaid.js — ตรวจว่าผัง mermaid ทุกไฟล์ parse + render ได้จริง ไม่ใช่แค่ตาดู
//
// CLAUDE.md กำหนดว่า "แก้ flow → อัปเดตผังในคอมมิตเดียวกัน · ผังต้อง parse ผ่านจริง"
// แต่ก่อนหน้านี้เครื่องมือตรวจอยู่แค่ใน scratchpad ของแต่ละเซสชัน หายไปทุกครั้ง
//
// รัน: python3 -m http.server 8123 --bind 127.0.0.1 &
//      NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules \
//        node Diagram/check-mermaid.js "Diagram/01-บำรุงรักษาตามวาระ"
const { chromium } = require('playwright-core');
const fs = require('fs'), path = require('path');
const DIR = process.argv[2];
(async () => {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.md'));
  const b = await chromium.launch({ executablePath:'/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome', headless:true });
  const p = await b.newPage();
  await p.goto('http://127.0.0.1:8123/');
  await p.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js' });
  await p.evaluate(() => mermaid.initialize({ startOnLoad:false }));
  let pass=0, fail=0;
  for (const f of files) {
    const md = fs.readFileSync(path.join(DIR,f),'utf8');
    const blocks = [...md.matchAll(/```mermaid\n([\s\S]*?)```/g)].map(m=>m[1]);
    if (!blocks.length) { console.log(`  – ${f} (ไม่มีผัง)`); continue; }
    let okAll = true, err = '';
    for (const [i, code] of blocks.entries()) {
      const r = await p.evaluate(async ([c,id]) => {
        try { await mermaid.parse(c); await mermaid.render('g'+id, c); return 'ok'; }
        catch(e){ return String(e.message||e).split('\n')[0]; }
      }, [code, f.replace(/\W/g,'')+i]);
      if (r !== 'ok') { okAll = false; err = r; break; }
    }
    okAll ? (pass++, console.log(`  ✓ ${f} (${blocks.length} ผัง)`)) : (fail++, console.log(`  ✗ ${f} — ${err}`));
  }
  console.log(`\nผล: ${pass} ผ่าน · ${fail} ไม่ผ่าน`);
  await b.close(); process.exit(fail?1:0);
})();
