/* ============================================================
   plugin-lib/swimlane-layout.js — user journey แบบ swimlane ตามผู้เกี่ยวข้อง (ฝั่ง Node · รันตอน build)
   ------------------------------------------------------------
   เจ้าของงานสั่ง 4 พ.ย. 2569: "อยากให้ทำ user journey ยาวๆ เป็น swimlane ที่มี stakeholder ด้วย" · วางบนหน้า Maintainance
   · ละเอียดระดับขั้นงาน · "อยากได้เป็นสี่เหลี่ยม และทางแยกเป็นข้าวหลามตัด"

   ต้นทาง: Diagram/<เรื่อง>/NN-<เรื่อง>-swimlane.md (mermaid flowchart · subgraph = lane · [ ] = ขั้นงาน · { } = ทางแยก
   · -.-> = ย้อนกลับ · บรรทัด "%% phase: ชื่อช่วง: id id …" = แถบช่วงงานด้านบน
   · "%% screen: id: A.1 A.2 …" = จอของกล่อง (ตัวแรก = ภาพย่อ ปลั๊กอินหยิบจากจอ desktop บนหน้า)
   · "%% row: N: id id …" = ให้กล่องลงแถวย่อยที่ N ของเลน (0 = แถวบน) เมื่อสองเส้นทางขนานกันในเลนเดียว เช่น ดำเนินการเอง/จ้าง)
   คอลัมน์ = ลำดับขั้นยาวสุด (เส้นย้อนกลับไม่นับ) · แถว = lane (ขั้นที่ชนช่องเดียวกันในเลนเดียวกันซ้อนเป็นแถวย่อย)
   เส้นเดินเฉพาะในช่องว่างระหว่างคอลัมน์/แถว ⇒ ไม่ทับกล่อง · Figma design ไม่มี connector ⇒ ส่งจุดหักมุมให้ปลั๊กอินวาด
   build-plugin.js เรียก build(src) แล้วฝังผลเป็น const SWIMLANE ใน code.js
   ============================================================ */
const fs = require('fs');
const { ST } = require('../8-flow-userflow.js');   // สีชุดเดียวกับผัง userflow (Template บอร์ด Planning): สี่เหลี่ยมเขียว · ข้าวหลามตัดม่วง

const HEAD_W = 280;                    // ช่องชื่อ lane ซ้ายสุด
const BOX = { w: 256, h: 136 }, DEC = { w: 224, h: 160 };
/* กล่องที่มีจอ (%% screen) = ภาพย่อจอจริง 320×228 ด้านบน + ข้อความใต้ภาพ ขนาดเดียวกับกล่องหน้าจอของผัง userflow (R26) — เจ้าของงาน 4 พ.ย. 2569 "ภาพย่อจอจริง + รหัสจอ" */
const SHOT = { w: 336, h: 316, thumb: { x: 8, y: 8, w: 320, h: 228 } };
const CELL_W = 336, CELL_H = 316;
const COL_GAP = 176, ROW_GAP = 64, LANE_PAD = 64;   // ช่องเดินเส้น (ครึ่งหนึ่ง = แนวเส้น)
const TOP = 220, BAND_H = 72, BAND_GAP = 16, PAD_R = 120, PAD_B = 80;

function parse(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/```mermaid\n([\s\S]*?)```/);
  if (!m) throw new Error('ไม่พบผัง mermaid ใน ' + file);
  const title = (src.match(/^# (.+)$/m) || [, ''])[1].trim();
  const lanes = [], nodes = [], edges = [], phases = [], rows = {}, screens = {};
  let lane = null;
  for (const raw of m[1].split('\n')) {
    const line = raw.trim();
    let r;
    if ((r = line.match(/^%% phase: (.+?): (.+)$/))) { phases.push({ name: r[1].trim(), ids: r[2].trim().split(/\s+/) }); continue; }
    if ((r = line.match(/^%% screen: (\w+): (.+)$/))) { screens[r[1]] = r[2].trim().split(/\s+/); continue; }
    if ((r = line.match(/^%% row: (\d+): (.+)$/))) { r[2].trim().split(/\s+/).forEach(id => { rows[id] = +r[1]; }); continue; }
    if (!line || line.startsWith('%%') || /^flowchart\b/.test(line)) continue;
    if ((r = line.match(/^subgraph (\w+)\["(.+)"\]$/))) { lane = { id: r[1], label: r[2] }; lanes.push(lane); continue; }
    if (line === 'end') { lane = null; continue; }
    if ((r = line.match(/^(\w+)(\["(.+)"\]|\{"(.+)"\})$/))) {
      if (!lane) throw new Error('กล่อง ' + r[1] + ' ไม่อยู่ใน lane ไหน');
      nodes.push({ id: r[1], kind: r[4] ? 'decision' : 'step', label: r[3] || r[4], lane: lane.id });
      continue;
    }
    // เส้น: a --> b --> c · a -->|ป้าย| b · a -.->|ป้าย| b (ย้อนกลับ)
    let rest = line, a = (rest.match(/^(\w+)/) || [])[1];
    if (!a) continue;
    rest = rest.slice(a.length);
    while ((r = rest.match(/^\s*(-\.->|-->)\s*(?:\|([^|]*)\|)?\s*(\w+)/))) {
      edges.push({ from: a, to: r[3], label: (r[2] || '').trim(), back: r[1] === '-.->' });
      a = r[3]; rest = rest.slice(r[0].length);
    }
  }
  const ids = new Set(nodes.map(n => n.id));
  for (const e of edges) for (const k of [e.from, e.to]) if (!ids.has(k)) throw new Error('เส้นอ้างกล่อง ' + k + ' ที่ไม่มี');
  for (const p of phases) for (const k of p.ids) if (!ids.has(k)) throw new Error('ช่วงงาน ' + p.name + ' อ้างกล่อง ' + k + ' ที่ไม่มี');
  for (const k of Object.keys(rows)) if (!ids.has(k)) throw new Error('%% row อ้างกล่อง ' + k + ' ที่ไม่มี');
  for (const k of Object.keys(screens)) { if (!ids.has(k)) throw new Error('%% screen อ้างกล่อง ' + k + ' ที่ไม่มี'); if (nodes.find(n => n.id === k).kind === 'decision') throw new Error('%% screen ใส่ให้ทางแยก ' + k + ' ไม่ได้ (ข้าวหลามตัดไม่มีภาพ)'); }
  return { title, lanes, nodes, edges, phases, rows, screens };
}

function build(file) {
  const g = parse(file);
  const byId = {}; g.nodes.forEach(n => { byId[n.id] = n; });
  // คอลัมน์ = ทางยาวสุดจากจุดเริ่ม (เส้นย้อนกลับไม่นับ)
  const fwd = g.edges.filter(e => !e.back), rank = {};
  g.nodes.forEach(n => { rank[n.id] = 0; });
  for (let i = 0; i <= g.nodes.length; i++) {
    let moved = false;
    for (const e of fwd) if (rank[e.to] < rank[e.from] + 1) { rank[e.to] = rank[e.from] + 1; moved = true; }
    if (!moved) break;
    if (i === g.nodes.length) throw new Error('เส้นเดินหน้าวนเป็นวง — เส้นที่ย้อนกลับต้องเขียนเป็น -.->');
  }
  // แถวย่อยในเลน: ขั้นที่ลงช่องเดียวกัน เรียงตามลำดับที่เขียนในไฟล์
  const sub = {}, subN = {};
  const taken = {};   // แถวที่กำหนดเอง (%% row) จองก่อน ที่เหลือลงแถวว่างแรกของช่องนั้น
  for (const n of g.nodes) if (g.rows[n.id] != null) { const k = n.lane + ':' + rank[n.id]; sub[n.id] = g.rows[n.id]; (taken[k] = taken[k] || new Set()).add(g.rows[n.id]); }
  for (const n of g.nodes) if (g.rows[n.id] == null) { const k = n.lane + ':' + rank[n.id], t = taken[k] = taken[k] || new Set(); let r = 0; while (t.has(r)) r++; sub[n.id] = r; t.add(r); }
  void subN;
  const laneRows = {}; g.lanes.forEach(l => { laneRows[l.id] = Math.max(1, ...g.nodes.filter(n => n.lane === l.id).map(n => sub[n.id] + 1)); });
  // แถบช่วงงาน: ช่วงที่คอลัมน์ทับกันขึ้นแถบแถวถัดไป
  const colX = (c) => HEAD_W + COL_GAP / 2 + c * (CELL_W + COL_GAP);
  const bands = [];
  for (const p of g.phases) {
    const cs = p.ids.map(id => rank[id]), c0 = Math.min(...cs), c1 = Math.max(...cs);
    let row = 0; while (bands.some(b => b.row === row && !(c1 < b.c0 || c0 > b.c1))) row++;
    bands.push({ name: p.name, c0, c1, row, x: colX(c0) - COL_GAP / 2 + 6, w: colX(c1) + CELL_W + COL_GAP / 2 - 6 - (colX(c0) - COL_GAP / 2 + 6) });
  }
  const bandRows = bands.length ? Math.max(...bands.map(b => b.row)) + 1 : 0;
  const lanesTop = TOP + bandRows * (BAND_H + BAND_GAP) + 24;
  let y = lanesTop;
  const lanes = g.lanes.map((l, i) => { const h = LANE_PAD * 2 + laneRows[l.id] * CELL_H + (laneRows[l.id] - 1) * ROW_GAP; const o = { id: l.id, label: l.label, y, h, i }; y += h; return o; });
  const laneOf = {}; lanes.forEach(l => { laneOf[l.id] = l; });
  const maxCol = Math.max(...g.nodes.map(n => rank[n.id]));
  const W = colX(maxCol) + CELL_W + COL_GAP / 2 + PAD_R, H = y + PAD_B;
  bands.forEach(b => { b.y = TOP + b.row * (BAND_H + BAND_GAP); b.h = BAND_H; });
  const nodes = g.nodes.map(n => {
    const L = laneOf[n.lane], c = rank[n.id], s = sub[n.id], scr = g.screens[n.id], d = n.kind === 'decision' ? DEC : scr ? SHOT : BOX, st = n.kind === 'decision' ? ST.decision : ST.display;
    const cellX = colX(c), cellY = L.y + LANE_PAD + s * (CELL_H + ROW_GAP);
    return { id: n.id, kind: n.kind, label: n.label, lane: n.lane, col: c, sub: s, cellX, cellY,
      x: cellX + (CELL_W - d.w) / 2, y: cellY + (CELL_H - d.h) / 2, w: d.w, h: d.h, cx: cellX + CELL_W / 2, cy: cellY + CELL_H / 2, fill: st.fill, stroke: st.stroke,
      screens: scr || null, thumb: scr ? SHOT.thumb : null };
  });
  const N = {}; nodes.forEach(n => { N[n.id] = n; });
  const gutL = (c) => colX(c) - COL_GAP / 2, gutR = (c) => colX(c) + CELL_W + COL_GAP / 2;
  const below = (n) => n.cellY + CELL_H + ROW_GAP / 2, above = (n) => n.cellY - ROW_GAP / 2;   // แนวช่องว่างใต้/เหนือช่องของกล่อง (ROW_GAP = LANE_PAD ⇒ ตกช่องว่างเสมอ)
  const clear = (s, t) => s.lane === t.lane && s.sub === t.sub && !nodes.some(n => n.lane === s.lane && n.sub === s.sub && n.col > s.col && n.col < t.col);
  // ทางออกของทางแยก: เส้นแรกออกขวา ที่เหลือออกล่าง/บน ตามทิศปลายทาง (ป้ายไม่ซ้อนกัน)
  const exitOf = {};
  for (const n of nodes) {
    const outs = g.edges.filter(e => e.from === n.id && !e.back);
    if (n.kind !== 'decision') { outs.forEach(e => { exitOf[e.from + '>' + e.to] = 'right'; }); continue; }
    const sorted = outs.slice().sort((a, b) => Math.abs(N[a.to].cy - n.cy) - Math.abs(N[b.to].cy - n.cy) || N[a.to].col - N[b.to].col);
    const used = new Set();
    sorted.forEach((e, i) => {
      let side = i === 0 ? 'right' : (N[e.to].cy >= n.cy ? 'bottom' : 'top');
      if (used.has(side)) side = side === 'bottom' ? 'top' : side === 'top' ? 'bottom' : 'right';
      if (used.has(side)) side = 'right';
      used.add(side); exitOf[e.from + '>' + e.to] = side;
    });
  }
  const edges = g.edges.map(e => {
    const s = N[e.from], t = N[e.to];
    let pts, lab;
    if (!e.back) {
      const side = exitOf[e.from + '>' + e.to], tx = t.x, ty = t.cy;
      if (side === 'right') {
        const sx = s.x + s.w, sy = s.cy;
        if (sy === ty && clear(s, t)) pts = [[sx, sy], [tx, ty]];
        else if (t.col === s.col + 1) { const gx = gutL(t.col); pts = [[sx, sy], [gx, sy], [gx, ty], [tx, ty]]; }
        else { const hy = t.cy >= s.cy ? below(s) : above(s), g1 = gutR(s.col), g2 = gutL(t.col); pts = [[sx, sy], [g1, sy], [g1, hy], [g2, hy], [g2, ty], [tx, ty]]; }
        lab = [sx + 10, sy - 30];
      } else {
        const down = side === 'bottom', sy = down ? s.y + s.h : s.y, hy = down ? below(s) : above(s), g2 = gutL(t.col);
        pts = [[s.cx, sy], [s.cx, hy], [g2, hy], [g2, ty], [tx, ty]];
        lab = [s.cx + 10, down ? hy - 30 : hy + 6];
      }
    } else {   // ย้อนกลับ: ออกล่าง/บนของต้นทาง → ช่องว่างแถว → ช่องว่างคอลัมน์ขวาของปลายทาง → ช่องว่างแถวข้างปลายทาง → เข้าปลายทางทางล่าง/บน
      const tDown = t.cy > s.cy, sameRow = t.cy === s.cy;
      const BK = 16;   // เส้นย้อนกลับเยื้องจากกลางช่องว่าง ไม่ทับเส้นเดินหน้าที่วิ่งแนวเดียวกัน
      const sy = (tDown || sameRow) ? s.y + s.h : s.y, hy = (tDown || sameRow) ? below(s) + BK : above(s) - BK;
      const ty = sameRow ? t.y + t.h : (tDown ? t.y : t.y + t.h), hyT = sameRow ? hy : (tDown ? above(t) - BK : below(t) + BK), gx = gutR(t.col) - 32;
      pts = sameRow ? [[s.cx, sy], [s.cx, hy], [t.cx, hy], [t.cx, ty]] : [[s.cx, sy], [s.cx, hy], [gx, hy], [gx, hyT], [t.cx, hyT], [t.cx, ty]];
      lab = [Math.min(s.cx, t.cx) + 16, (tDown || sameRow) ? hy + 6 : hy - 30];
    }
    pts = pts.filter((p, i) => i === 0 || p[0] !== pts[i - 1][0] || p[1] !== pts[i - 1][1]);
    return { from: e.from, to: e.to, label: e.label, back: e.back, pts, lab: e.label ? lab : null };
  });
  // แยกราง: เส้นที่วิ่งในช่องว่างแนวเดียวกันและช่วงซ้อนกัน เยื้องคนละราง (ไม่งั้นเส้นทับกันจนอ่านไม่ออกว่าไปไหน)
  //   เฉพาะช่วงกลางของเส้น (จุดต้น/ปลายติดกล่อง ไม่ขยับ) · ช่องแถว 64 = ราง ±12 ±24 · ช่องคอลัมน์ 176 = ราง ±16 ±32 …
  const lanesOf = {};
  edges.forEach((e, ei) => {
    for (let i = 1; i < e.pts.length - 2; i++) {
      const [p, q] = [e.pts[i], e.pts[i + 1]], hor = p[1] === q[1];
      const key = (hor ? 'h' : 'v') + (hor ? p[1] : p[0]);
      (lanesOf[key] = lanesOf[key] || []).push({ ei, i, hor, a: Math.min(hor ? p[0] : p[1], hor ? q[0] : q[1]), b: Math.max(hor ? p[0] : p[1], hor ? q[0] : q[1]) });
    }
  });
  for (const segs of Object.values(lanesOf)) {
    if (segs.length < 2) continue;
    segs.sort((x, y) => x.a - y.a);
    const ends = [];   // ปลายขวาสุดของแต่ละราง
    for (const s of segs) {
      let k = ends.findIndex(b => b < s.a - 8); if (k < 0) { k = ends.length; ends.push(0); }
      ends[k] = s.b;
      if (!k) continue;
      const step = s.hor ? 12 : 16, cap = s.hor ? 2 : 3, lvl = Math.min(Math.ceil(k / 2), cap), off = (k % 2 ? 1 : -1) * lvl * step;
      const pts = edges[s.ei].pts, ax = s.hor ? 1 : 0;
      pts[s.i] = pts[s.i].slice(); pts[s.i + 1] = pts[s.i + 1].slice();
      pts[s.i][ax] += off; pts[s.i + 1][ax] += off;
    }
  }
  edges.forEach(e => { if (e.lab && e.pts.length > 2 && e.pts[0][1] === e.pts[1][1]) e.lab[1] = e.pts[0][1] - 30; });
  // ตรวจเอง: กล่องไม่ทับกัน · เส้นไม่ผ่ากล่องอื่น (นอกจากต้นทาง/ปลายทาง)
  const problems = [];
  for (const a of nodes) for (const b of nodes) if (a.id < b.id && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h) problems.push('กล่อง ' + a.id + ' ทับ ' + b.id);
  for (const e of edges) for (let i = 1; i < e.pts.length; i++) {
    const [p, q] = [e.pts[i - 1], e.pts[i]], x0 = Math.min(p[0], q[0]), x1 = Math.max(p[0], q[0]), y0 = Math.min(p[1], q[1]), y1 = Math.max(p[1], q[1]);
    for (const n of nodes) { if (n.id === e.from || n.id === e.to) continue; if (x0 < n.x + n.w - 1 && x1 > n.x + 1 && y0 < n.y + n.h - 1 && y1 > n.y + 1) problems.push('เส้น ' + e.from + ' → ' + e.to + ' ผ่ากล่อง ' + n.id); }
  }
  return { title: g.title, lanes, bands, nodes, edges, w: W, h: H, headW: HEAD_W, lanesTop, problems };
}

module.exports = { parse, build };
if (require.main === module) {   // node figma-export/plugin-lib/swimlane-layout.js <ไฟล์ .md> — ดูขนาด + ปัญหาการจัดวาง
  const r = build(process.argv[2]);
  console.log('lane ' + r.lanes.length + ' · กล่อง ' + r.nodes.length + ' · เส้น ' + r.edges.length + ' · ช่วงงาน ' + r.bands.length + ' · ' + Math.round(r.w) + '×' + Math.round(r.h));
  console.log(r.problems.length ? r.problems.join('\n') : 'ไม่มีกล่องทับ/เส้นผ่ากล่อง ✓');
}
