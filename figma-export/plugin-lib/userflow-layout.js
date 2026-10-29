/* ============================================================
   plugin-lib/userflow-layout.js — ผัง userflow แนวตั้ง สำหรับวางข้างจอในปลั๊กอิน Figma (ฝั่ง Node · รันตอน build)
   ------------------------------------------------------------
   เจ้าของงานสั่ง 22 ต.ค. 2569: "อยากให้ userflow กับ wireframe เรียงต่อกัน เช่น scen1 userflow กับ wireframe อยู่ข้างๆกัน ตอนที่ export"
   + เลือกให้วางบนหน้า Figma ของปลั๊กอิน (ผังซ้าย · คอลัมน์จอ A.1 A.2 … ขวา) + "เอาลงในเพจ Maintainance ด้วยกันเลย"

   ต้นทางเดียวกับบอร์ด FigJam: Diagram/<เรื่อง>/NN-<เรื่อง>-userflow.md (อ่านด้วย 8-flow-userflow.js — parse + rank/row ชุดเดียวกัน)
   ต่างจากบอร์ด: อ่านบน → ล่าง (rank = แถวลง · ทางแยก N = คอลัมน์ขวา) เพื่อให้ผังอยู่ซ้ายของแถวจอได้
   Figma design ไม่มี connector แบบ FigJam ⇒ คำนวณเส้นหักมุมไว้ที่นี่ (จุดต่อจุด) ปลั๊กอินแค่วาดเส้นตามจุด
   build-plugin.js เรียก build(src) แล้วฝังผลเป็น const USERFLOW ใน code.js (Figma โหลดไฟล์เดียว อ่าน .md เองไม่ได้)
   ============================================================ */
const uf = require('../8-flow-userflow.js');

const SIZE = { end: 112, action: 176, display: 176, decision: 176 };
/* กล่องหน้าจอ (Display) = ภาพย่อจอจริง + ชื่อหน้าใต้ภาพ (เจ้าของงานเลือก 22 ต.ค. 2569 "ภาพย่อจอในผัง") — ปลั๊กอินวางภาพลงช่อง thumb หลังสร้างจอเสร็จ */
const DISPLAY = { w: 336, h: 316, pad: 8, thumbH: 228 };
const GAPX = 144, GAPY = 64;   // ช่องว่างระหว่างคอลัมน์ / แถว (คอลัมน์และแถวกว้างไม่เท่ากันตามกล่องที่ใหญ่สุดในนั้น)
const CELL = 176;        // ช่องกว้างสุด — จัดกึ่งกลาง
const X0 = 40, Y0 = 140; // เว้นหัวผังด้านบน
const LANE = 36;         // ช่องวิ่งของเส้นย้อนกลับ (ขวาของผัง) ต่อ 1 เส้น
const STICKY_W = 320, STICKY_GAP = 16;
const PAD = 8;           // ระยะกันชนตอนเช็คว่าเส้นทับกล่องไหม

function vertical(flow, swap) {   // swap = คำนวณด้วยกล่องกว้าง↔สูงสลับกัน เพื่อให้ horizontal() กลับแกนแล้วขนาดกล่องตรงของจริง
  const { rank, row, back } = uf.rankRows(flow);
  const maxRank = Math.max(...flow.nodes.map(n => rank[n.id]));
  const maxRow = Math.max(...flow.nodes.map(n => row[n.id]));
  const dim = (n) => n.kind === 'display' ? (swap ? [DISPLAY.h, DISPLAY.w] : [DISPLAY.w, DISPLAY.h]) : [SIZE[n.kind] || CELL, SIZE[n.kind] || CELL];
  const colW = Array(maxRow + 1).fill(CELL), rankH = Array(maxRank + 1).fill(CELL);
  flow.nodes.forEach(n => { const [w, h] = dim(n); colW[row[n.id]] = Math.max(colW[row[n.id]], w); rankH[rank[n.id]] = Math.max(rankH[rank[n.id]], h); });
  const colX = [], rankY = []; colW.reduce((x, w, i) => { colX[i] = x; return x + w + GAPX; }, X0); rankH.reduce((y, h, i) => { rankY[i] = y; return y + h + GAPY; }, Y0);
  const nodes = flow.nodes.map(n => {
    const [w, h] = dim(n), c = row[n.id], r = rank[n.id];
    const cx = colX[c] + colW[c] / 2, cy = rankY[r] + rankH[r] / 2;
    const st = uf.ST[n.kind] || uf.ST.action;   // สีชุดเดียวกับบอร์ด FigJam (Template บอร์ด Planning 1-2)
    const o = { id: n.id, kind: n.kind, label: n.label, x: cx - w / 2, y: cy - h / 2, w, h, fill: st.fill, stroke: st.stroke, cx, cy, col: c, rank: r };
    if (n.kind === 'display') o.thumb = { x: DISPLAY.pad, y: DISPLAY.pad, w: w - DISPLAY.pad * 2, h: DISPLAY.thumbH };   // ช่องภาพย่อ (พิกัดในกล่อง)
    return o;
  });
  const pos = Object.fromEntries(nodes.map(n => [n.id, n]));
  const boxes = nodes.map(n => ({ id: n.id, x1: n.x - PAD, y1: n.y - PAD, x2: n.x + n.w + PAD, y2: n.y + n.h + PAD }));
  const hits = (pts, skip) => {   // จำนวนกล่อง (ยกเว้นต้นทาง/ปลายทาง) ที่เส้นหักมุมนี้ลากผ่าน
    let k = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const x1 = Math.min(ax, bx), x2 = Math.max(ax, bx), y1 = Math.min(ay, by), y2 = Math.max(ay, by);
      for (const b of boxes) if (skip.indexOf(b.id) < 0 && x1 <= b.x2 && x2 >= b.x1 && y1 <= b.y2 && y2 >= b.y1) k++;
    }
    return k;
  };
  const right0 = colX[maxRow] + colW[maxRow];   // ขอบขวาของคอลัมน์สุดท้าย
  let lanes = 0, lanesL = 0;
  const left0 = X0 - 24;   // ช่องวิ่งซ้ายของผัง (ติดลบได้ — เลื่อนทั้งผังทีหลัง)
  const edges = flow.edges.map(e => {
    const a = pos[e.from], b = pos[e.to];
    const bot = (n) => [n.cx, n.y + n.h], top = (n) => [n.cx, n.y], rgt = (n) => [n.x + n.w, n.cy], lft = (n) => [n.x, n.cy];
    const half = GAPY / 2;
    const lane = () => { const x = right0 + 24 + lanes * LANE; return [rgt(a), [x, a.cy], [x, b.cy], rgt(b)]; };
    if (back.has(e)) {   // เส้นย้อนกลับ: ออกข้างขวา → ออกข้างซ้าย → ออกใต้แล้ววิ่งขวา/ซ้าย · เลือกเส้นแรกที่ไม่ทับกล่อง
      const xr = right0 + 24 + lanes * LANE, xl = left0 - lanesL * LANE;
      const opts = [
        ['R', [rgt(a), [xr, a.cy], [xr, b.cy], rgt(b)]],
        ['L', [lft(a), [xl, a.cy], [xl, b.cy], lft(b)]],
        ['R', [bot(a), [a.cx, a.y + a.h + half], [xr, a.y + a.h + half], [xr, b.cy], rgt(b)]],
        ['L', [bot(a), [a.cx, a.y + a.h + half], [xl, a.y + a.h + half], [xl, b.cy], lft(b)]]];
      const pick = opts.find(([, p]) => !hits(p, [e.from, e.to])) || opts[0];
      if (pick[0] === 'R') lanes++; else lanesL++;
      return { from: e.from, to: e.to, label: e.label || '', back: true, pts: pick[1] };
    }
    const cand = [];
    if (a.cx === b.cx) cand.push([bot(a), top(b)]);                                                   // ตรงลง
    if (b.cy > a.cy && b.cx !== a.cx) {
      cand.push([b.cx > a.cx ? rgt(a) : lft(a), [b.cx, a.cy], top(b)]);                               // ออกข้าง แล้วลงเข้าหัว (ทางแยก N)
      const ybt = rankY[b.rank] - GAPY / 2, yat = rankY[a.rank] + rankH[a.rank] + GAPY / 2;
      cand.push([bot(a), [a.cx, ybt], [b.cx, ybt], top(b)]);       // ลงก่อน แล้วเลี้ยวเหนือปลายทาง (กลางช่องว่างเหนือแถวปลายทาง)
      cand.push([bot(a), [a.cx, yat], [b.cx, yat], top(b)]);       // เลี้ยวใต้ต้นทาง แล้วลง
    }
    if (a.cx === b.cx && b.cy > a.cy) {   // คอลัมน์เดียวกันแต่ข้ามหลายขั้น — อ้อมซ้าย/ขวาในช่องว่างระหว่างคอลัมน์
      const gx = colX[a.col] - GAPX / 2, gx2 = colX[a.col] + colW[a.col] + GAPX / 2;
      cand.push([lft(a), [gx, a.cy], [gx, b.cy], lft(b)]);
      cand.push([rgt(a), [gx2, a.cy], [gx2, b.cy], rgt(b)]);
    }
    let best = null, bestHits = Infinity;
    for (const c of cand) { const h = hits(c, [e.from, e.to]); if (h < bestHits) { best = c; bestHits = h; } if (!h) break; }
    if (!best || bestHits > 0) { const l = lane(); if (!best || hits(l, [e.from, e.to]) < bestHits) { best = l; lanes++; } }
    return { from: e.from, to: e.to, label: e.label || '', back: false, pts: best };
  });
  const laneR = right0 + 24 + lanes * LANE;
  // sticky คำถาม: คอลัมน์ขวาสุดของผัง เรียงตามแถวของกล่องที่อ้าง · ซ้อนลงถ้าชนกัน (ความสูงจริงรู้ตอนวาด ปลั๊กอินเลื่อนลงให้เอง)
  const sx = Math.max(laneR, right0) + 40;
  const stickies = flow.stickies.map(st => ({ node: st.node, text: st.text, x: sx, y: pos[st.node].y, w: STICKY_W }));
  let w = (stickies.length ? sx + STICKY_W : Math.max(laneR, right0)) + 40;
  const h = rankY[maxRank] + rankH[maxRank] + 40;
  const shift = lanesL ? lanesL * LANE + 24 : 0;   // มีช่องวิ่งซ้าย ⇒ เลื่อนทั้งผังไปขวา ให้ทุกอย่างอยู่ในกรอบ
  if (shift) {
    nodes.forEach(n => { n.x += shift; }); edges.forEach(e => { e.pts = e.pts.map(([x, y]) => [x + shift, y]); }); stickies.forEach(s => { s.x += shift; }); w += shift;
  }
  return { w, h, nodes: nodes.map(({ cx, cy, col, rank: r, ...n }) => n), edges, stickies, gap: STICKY_GAP };
}

/* ผังแนวนอน (journey แนวขวาง · เจ้าของงานสั่ง 22 ต.ค. 2569 "ทำ scen มาต่อกันเป็นแนวขวาง สำหรับ export"):
   คำนวณด้วย vertical() แบบสลับขนาดกล่อง แล้วกลับแกน x↔y ⇒ อ่านซ้าย → ขวา · ทางแยก N ลงแถวล่าง · เส้นย้อนกลับวิ่งใต้ผัง · sticky คำถามใต้ผัง
   หัวผังเดิมอยู่บน (Y0) ⇒ หลังกลับแกนเลื่อนทั้งผังลง/ซ้ายเท่าระยะหัว ให้หัวผังยังอยู่ด้านบน */
function horizontal(flow) {
  const v = vertical(flow, true), head = Y0 - X0;
  const T = ([x, y]) => [y - head, x + head];
  const nodes = v.nodes.map(n => {
    const o = Object.assign({}, n, { x: n.y - head, y: n.x + head, w: n.h, h: n.w });
    if (n.kind === 'display') o.thumb = { x: DISPLAY.pad, y: DISPLAY.pad, w: o.w - DISPLAY.pad * 2, h: DISPLAY.thumbH };
    return o;
  });
  const edges = v.edges.map(e => Object.assign({}, e, { pts: e.pts.map(T) }));
  const bottom = Math.max(...nodes.map(n => n.y + n.h), ...edges.map(e => Math.max(...e.pts.map(p => p[1])))) + 40;
  const pos = Object.fromEntries(nodes.map(n => [n.id, n]));
  const stickies = v.stickies.map(st => ({ node: st.node, text: st.text, x: pos[st.node].x, y: bottom, w: STICKY_W }));
  const w = Math.max(...nodes.map(n => n.x + n.w), ...edges.map(e => Math.max(...e.pts.map(p => p[0]))), ...stickies.map(st => st.x + st.w)) + 40;
  const h = bottom + (stickies.length ? 160 : 0);
  return { w, h, nodes, edges, stickies, gap: STICKY_GAP, horizontal: true };
}

/* อ่านไฟล์ userflow ทั้งไฟล์ → { "1": { n, title, w, h, nodes, edges, stickies }, … } · horizontal = ผังแนวนอนสำหรับ journey */
function build(src, horizontalMode) {
  const out = {};
  for (const sc of uf.readScenarios(src)) out[sc.n] = Object.assign({ n: sc.n, title: sc.title }, (horizontalMode ? horizontal : vertical)(uf.parseFlow(sc.code)));
  return out;
}

module.exports = { build, vertical, horizontal, SIZE };
if (require.main === module) {   // ดูผลเร็ว: node figma-export/plugin-lib/userflow-layout.js <ไฟล์ userflow.md>
  const path = require('path');
  const src = path.resolve(process.argv[2] || path.join(__dirname, '..', '..', 'Diagram', '01-บำรุงรักษาตามวาระ', '14-บำรุงรักษา-userflow.md'));
  const r = build(src);
  for (const k of Object.keys(r)) {
    const f = r[k];
    console.log('S' + String(k).padStart(2) + '  node ' + String(f.nodes.length).padStart(2) + ' · เส้น ' + String(f.edges.length).padStart(2) + ' (ย้อนกลับ ' + f.edges.filter(e => e.back).length + ') · ' + Math.round(f.w) + '×' + Math.round(f.h) + '  ' + f.title);
  }
}
