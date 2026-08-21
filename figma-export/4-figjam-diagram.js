#!/usr/bin/env node
/* ============================================================
   ผัง mermaid → สเปกผังสำหรับบอร์ด FigJam (out/diagram-plan.json)
   ------------------------------------------------------------
   ยืม pattern จาก Diagram/check-mermaid.js: เปิด Chromium + mermaid@11
   จาก CDN แล้ว "ให้ mermaid เป็นคนจัด layout" — เราสกัด geometry จาก
   SVG ที่เรนเดอร์เสร็จ (ตำแหน่ง/ขนาด node, เลน, เส้นเชื่อม, ป้าย)
   ไม่เขียน layout เอง จะได้ตรงกับผังต้นทางเสมอ

   ต้นทาง: ผังใน Diagram/ (block mermaid แรกของไฟล์) — แหล่งความจริงของ flow
   ตาม CLAUDE.md · แก้ผังแล้วรันไฟล์นี้ซ้ำ · default = 01-ออกเลขงาน.md

   รัน:  python3 -m http.server 8123 --bind 127.0.0.1 &
         NODE_PATH=<ที่ npm i playwright-core>/node_modules node figma-export/4-figjam-diagram.js
         # ผังอื่น:
         … node figma-export/4-figjam-diagram.js \
             --src=Diagram/01-บำรุงรักษาตามวาระ/03-เฟส2-ดำเนินการบำรุงรักษา.md \
             --out=diagram-maint.json
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';

// รับผังไหนก็ได้ใน Diagram/ — ไม่ใส่ = ค่าเดิม (ออกเลขงาน → diagram-plan.json)
//   --src=Diagram/01-บำรุงรักษาตามวาระ/03-เฟส2-ดำเนินการบำรุงรักษา.md --out=diagram-maint.json
const arg = (k, d) => {
  const hit = process.argv.slice(2).find(a => a.startsWith('--' + k + '='));
  return hit ? hit.slice(k.length + 3) : d;
};
const SRC = path.resolve(__dirname, '..', arg('src', path.join('Diagram', '01-บำรุงรักษาตามวาระ', '01-ออกเลขงาน.md')));
const OUT = path.join(__dirname, 'out', arg('out', 'diagram-plan.json'));
const SCALE = 2;          // ผัง mermaid ตัวเล็ก — ขยายให้อ่านบน FigJam สบาย

async function main() {
  const md = fs.readFileSync(SRC, 'utf8');
  const m = md.match(/```mermaid\n([\s\S]*?)```/);
  if (!m) { console.error('ไม่พบบล็อก mermaid ใน ' + SRC); process.exit(1); }
  const code = m[1];

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:8123/');
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js' });

  const data = await page.evaluate(async ([code, scale]) => {
    mermaid.initialize({ startOnLoad: false });
    await mermaid.parse(code);
    const { svg } = await mermaid.render('gdiag', code);
    const host = document.createElement('div');
    host.innerHTML = svg;
    document.body.appendChild(host);
    const svgEl = host.querySelector('svg');
    svgEl.style.maxWidth = 'none';                       // กัน responsive ย่อ ทำให้พิกัดเพี้ยน
    const root = svgEl.getBoundingClientRect();

    const S = (v) => Math.round(v * scale);
    const box = (el) => {
      const r = el.getBoundingClientRect();
      return { x: S(r.x - root.x), y: S(r.y - root.y), w: S(r.width), h: S(r.height) };
    };
    // innerText มีเฉพาะ HTML element (foreignObject ข้างใน) — SVG element ต้อง textContent
    const readText = (el) => ((el.innerText !== undefined ? el.innerText : el.textContent) || '').trim();
    const textOf = (el) => {
      const label = el.querySelector('foreignObject div, foreignObject span, .label');
      return readText(label || el);
    };

    // ---- เลน (subgraph) ----
    const clusters = [...svgEl.querySelectorAll('g.cluster')].map(el => {
      const lbl = el.querySelector('.cluster-label');
      return { label: lbl ? textOf(lbl) : '', ...box(el) };
    });

    // ---- node: เอาเฉพาะ geometry + ข้อความจาก DOM ----
    // (ชนิดกับเส้นเชื่อม parse จากซอร์สข้างนอก — DOM ของ mermaid v11
    //  แยกชนิดยาก และลำดับ edgeLabels ไม่ตรงกับ edgePaths เมื่อบางเส้นไม่มีป้าย)
    const nodes = [...svgEl.querySelectorAll('g.node')].map(el => {
      const idm = el.id.match(/flowchart-(.+)-\d+$/);    // id มี prefix ของ render id นำหน้า
      return { id: idm ? idm[1] : el.id, label: textOf(el), ...box(el) };
    });

    return { w: S(root.width), h: S(root.height), clusters, nodes };
  }, [code, SCALE]);

  await browser.close();

  // ---- ชนิด node จากวงเล็บที่ประกาศในซอร์ส (ที่แรกที่เจอ id นั้น) ----
  const kindOf = (id) => {
    const m2 = code.match(new RegExp('(?:^|[\\s|])' + id + '(\\(\\[|\\[\\[|\\{|\\(\\()'));
    if (!m2) return 'process';
    return { '([': 'stadium', '[[': 'subroutine', '{': 'decision', '((': 'circle' }[m2[1]] || 'process';
  };
  data.nodes.forEach(n => { n.kind = kindOf(n.id); });

  // ---- เส้นเชื่อมจากซอร์สทีละบรรทัด — ลำดับ/ป้าย/สไตล์ตรงร้อยเปอร์เซ็นต์ ----
  const edges = [];
  for (const line of code.split('\n')) {
    let em;
    if ((em = line.match(/(\w+)\s*-\.\s*(.*?)\s*\.->\s*(\w+)/))) {
      edges.push({ from: em[1], to: em[3], label: em[2], style: 'dotted' });
    } else if ((em = line.match(/(\w+)\s*(-->|==>)\s*(?:\|([^|]*)\|\s*)?(\w+)/))) {
      edges.push({ from: em[1], to: em[4], label: em[3] || '', style: em[2] === '==>' ? 'thick' : 'solid' });
    }
  }
  data.edges = edges;

  const ids = new Set(data.nodes.map(n => n.id));
  const bad = edges.filter(e => !ids.has(e.from) || !ids.has(e.to));
  if (bad.length) {
    console.error('เส้นเชื่อมชี้ node ที่ไม่มี: ' + bad.map(e => e.from + '→' + e.to).join(', '));
    process.exit(1);
  }

  fs.writeFileSync(OUT, JSON.stringify(data));
  console.log('ผัง: node ' + data.nodes.length + ' · เลน ' + data.clusters.length + ' · เส้น ' + edges.length);
  console.log('ชนิด: ' + data.nodes.map(n => n.id + '=' + n.kind).join(' '));
  console.log('ป้ายเส้น: ' + edges.filter(e => e.label).map(e => e.from + '→' + e.to + '「' + e.label + '」').join(' '));
  console.log('เขียน ' + path.relative(process.cwd(), OUT));
}

main().catch(e => { console.error(e); process.exit(1); });
