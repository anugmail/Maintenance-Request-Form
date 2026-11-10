/* ============================================================
   plugin-lib/activity-layout.js — flowchart กิจกรรมราย scenario (ฝั่ง Node · รันตอน build)
   ------------------------------------------------------------
   เจ้าของงานขอ 6 พ.ย. 2569: "สร้าง แต่ละ scen ออกมา … ทำ script ให้ export ใน figma" + "อยากได้ flowchart"
   · "เอาเป็นแค่กิจกรรม … ไม่ต้องเอาหน้าจอไปรวม" · "อยาก export figma นะ บนเว็บยังไม่ต้องทำ"

   ต้นทาง: Diagram/<เรื่อง>/NN-<เรื่อง>-flowchart-กิจกรรม.md (หัวข้อ "### Scenario N · ชื่อ" + mermaid flowchart แบบเดียวกับไฟล์ userflow)
   ใช้ parse ของ 8-flow-userflow.js + จัดวางแนวตั้งของ userflow-layout.js ชุดเดียวกับผังข้างจอ
   ต่างจากผัง userflow: ["…"] = กิจกรรม (สี่เหลี่ยม · ไม่มีช่องภาพย่อจอ) ไม่ใช่กล่องหน้าจอ ⇒ เปลี่ยน kind display → step ก่อนจัดวาง
   ลำดับ scenario = ลำดับหัวข้อในไฟล์ (ลำดับงาน) · กรอบ scenario เรียงซ้าย → ขวา ขึ้นแถวใหม่เมื่อเกินความกว้าง
   build-plugin.js เรียก build(src) แล้วฝังผลเป็น const ACTIVITY ใน code.js
   ============================================================ */
const uf = require('../8-flow-userflow.js');
const { vertical, horizontal } = require('./userflow-layout.js');

const GRID = { maxW: 9000, gap: 160, top: 260, pad: 64 };
const MIN_W = 720;   // กรอบแคบสุด — ให้ชื่อ scenario ไม่เกิน 2 บรรทัด · ผังที่แคบกว่าจัดกึ่งกลาง
const HEAD = 96;   // หัวกรอบ scenario (ชื่อ) — userflow-layout เว้นด้านบนไว้แล้ว (Y0 140) ใช้ช่องนั้นวางชื่อ

const labelW = (t) => [...t].reduce((w, ch) => { const c = ch.codePointAt(0); return w + (c === 0x0E31 || (c >= 0x0E34 && c <= 0x0E3A) || (c >= 0x0E47 && c <= 0x0E4E) ? 0 : c < 128 ? 11 : 12); }, 0);   // ฟอนต์ 18 · สระบน/ล่างไม่กินที่

/* horizontalMode = ผังแนวนอนสำหรับ flowchart ยาวทั้งเส้น (journey · เจ้าของงาน 6 พ.ย. 2569 "อยากให้ทำ flow chart ยาวๆ … เล่าเรื่องทั้งเส้น … ไม่เอาเป็น userflow แล้ว") */
function build(src, horizontalMode) {
  const scenarios = uf.readScenarios(src).map(sc => {
    const flow = uf.parseFlow(sc.code);
    /* ["…"] = กิจกรรม (ไม่ใช่กล่องหน้าจอ) · (["…"]) เริ่ม/จบ ข้อความยาวกว่าผัง userflow ("ไป S2 ผู้อนุมัติตรวจแผน") ⇒ ขยายเป็นช่องเต็ม 176 แทนวงกลม 112 */
    flow.nodes.forEach(n => { if (n.kind === 'display') n.kind = 'step'; else if (n.kind === 'end') n.kind = 'term'; });
    if (!flow.nodes.some(n => n.kind === 'step')) throw new Error('Scenario ' + sc.n + ' ไม่มีกิจกรรม ["…"] เลย');
    const v = horizontalMode ? horizontal(flow) : vertical(flow);
    v.nodes.forEach(n => { if (n.kind === 'term') Object.assign(n, { kind: 'end', fill: uf.ST.end.fill, stroke: uf.ST.end.stroke }); });
    if (!horizontalMode && v.w < MIN_W) {
      const dx = (MIN_W - v.w) / 2;
      v.nodes.forEach(n => { n.x += dx; }); v.edges.forEach(e => { e.pts = e.pts.map(([x, y]) => [x + dx, y]); }); v.stickies.forEach(t => { t.x += dx; });
      v.w = MIN_W;
    }
    /* ป้ายบนเส้น (ทางที่เลือก) วางตรงจุดเริ่มเส้นแบบผัง userflow · คำนวณที่นี่แล้วขยายกรอบให้ป้ายที่ชิดขอบขวา (เส้นย้อนกลับ) ไม่ล้น */
    for (const e of v.edges) {
      if (!e.label) continue;
      const [a, b] = e.pts, down = a[0] === b[0];
      e.lab = [a[0] + (down ? 10 : 12), a[1] + (down ? 4 : -28)];
      v.w = Math.max(v.w, e.lab[0] + Math.max(labelW(e.label), 100) + 24);   // เผื่ออย่างน้อย 100 (ตัวจำลองในเทสให้ข้อความกว้าง 100 เสมอ)
      v.h = Math.max(v.h, e.lab[1] + 60);   // แนวนอน: เส้นย้อนกลับวิ่งใต้ผัง ป้ายอยู่ใกล้ขอบล่าง
    }
    return Object.assign({ n: sc.n, title: sc.title }, v);
  });
  let x = GRID.pad, y = GRID.top, rowH = 0, W = 0;
  for (const s of scenarios) {
    if (x > GRID.pad && x + s.w > GRID.maxW) { x = GRID.pad; y += rowH + GRID.gap; rowH = 0; }
    s.x = x; s.y = y; x += s.w + GRID.gap; rowH = Math.max(rowH, s.h); W = Math.max(W, s.x + s.w);
  }
  const problems = [];
  for (const s of scenarios) {
    for (const a of s.nodes) for (const b of s.nodes) if (a.id < b.id && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) problems.push('S' + s.n + ': กล่อง ' + a.id + ' ทับ ' + b.id);
    for (const n of s.nodes) if (n.y < HEAD) problems.push('S' + s.n + ': กล่อง ' + n.id + ' ทับหัวกรอบ');
  }
  return { title: 'บำรุงรักษาตามวาระ — flowchart กิจกรรมราย scenario', w: W + GRID.pad, h: y + rowH + GRID.pad, scenarios, problems };
}

module.exports = { build };

if (require.main === module) {   // ตรวจเร็ว: node figma-export/plugin-lib/activity-layout.js <ไฟล์ .md>
  const r = build(process.argv[2]);
  r.scenarios.forEach(s => console.log('S' + s.n + ' · กิจกรรม ' + s.nodes.filter(n => n.kind === 'step').length + ' · ทางเลือก ' + s.nodes.filter(n => n.kind === 'decision').length + ' · เส้น ' + s.edges.length + ' (ย้อนกลับ ' + s.edges.filter(e => e.back).length + ') · ' + Math.round(s.w) + '×' + Math.round(s.h)));
  console.log('รวม ' + r.scenarios.length + ' scenario · กรอบใหญ่ ' + Math.round(r.w) + '×' + Math.round(r.h));
  console.log(r.problems.length ? r.problems.join('\n') : 'ไม่มีกล่องทับกัน ✓');
}
