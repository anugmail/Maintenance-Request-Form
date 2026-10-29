#!/usr/bin/env node
/* ============================================================
   userflow (.md ใน Diagram/) → สเปกผังสำหรับบอร์ด FigJam — section ละ scenario
   ------------------------------------------------------------
   ต้นทาง = ไฟล์ userflow ที่เขียนด้วยสัญลักษณ์ 4 แบบของบอร์ดเจ้าของงาน
   (ค่าเริ่มต้น Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md · 19 ต.ค. 2569)
   อ่านทุกหัวข้อ `### Scenario N · <ชื่อ>` + บล็อก mermaid ใต้หัวข้อนั้น แล้วแปลงเป็น node/เส้น
   หน้าตาตาม Template บอร์ด Planning 1-2 (ค่าเดียวกับ 6-flow-disposal.js):
     start/End = ELLIPSE 112 ขาว · Action = ELLIPSE 176 ฟ้า · Display = SQUARE 176 เขียวน้ำทะเล · Decision = DIAMOND 176 ม่วง
     เส้น ELBOWED 4px สีตามกล่องต้นทาง · ป้าย Y/N บนเส้น · คำถาม (%% Q:) = sticky เหลืองใต้คอลัมน์ของ node นั้น

   รูปทรงในซอร์ส mermaid → ชนิด:  id([..]) = end · id(..) / id((..)) = action · id[..] = display · id{..} = decision
   จัดวางเอง (ไม่พึ่ง mermaid): คอลัมน์ = ระยะไกลสุดจาก start · แถว 0 = เส้นหลัก (ป้าย Y/ไม่มีป้ายไปก่อน) ·
   ทางแยก N ลงแถวถัดไป · เส้นย้อนกลับ (loop) วิ่งใต้แถวด้วย magnet BOTTOM→BOTTOM

   รัน:  node figma-export/8-flow-userflow.js
         node figma-export/8-flow-userflow.js --src=Diagram/<เรื่อง>/NN-<เรื่อง>-userflow.md --out=diagram-userflow-<เรื่อง>.json
         node figma-export/3-figjam-board.js --maintainance --only --out=board-maintainance.json
   ผลลัพธ์: out/diagram-userflow-maintainance.json = { sections: [{ name, diagram }] } (3-figjam-board.js ห่อเป็น section ชนิดผัง)

   --journey (22 ต.ค. 2569 · เจ้าของงาน "ที่ส่งไปไม่ได้ต่อกัน แต่สิ่งที่อยากได้คือต่อกัน"):
     ทุก scenario เป็นผังเดียวที่ต่อกัน — start จุดเดียว · ขั้นสุดท้ายของ scenario ต่อเข้าขั้นแรกของ scenario ถัดไป (ไม่มี start/End คั่น)
     กติการวม = plugin-lib/journey-merge.js · ลำดับ/ทางแยก/จุดต่อ = maintainance-plugin/build.json "journey" (ชุดเดียวกับปุ่ม journey ในปลั๊กอิน Figma)
     scenario ละแถบพื้น (lane) ชื่อ S<n> · หัวช่วงงานด้านบน · เส้นข้าม scenario = connector จริง (ลากกล่องแล้วเส้นตาม)
         node figma-export/8-flow-userflow.js --journey
         node figma-export/3-figjam-board.js --maintainance-journey --only --out=board-maintainance-journey.json
   ============================================================ */

const fs = require('fs');
const path = require('path');

const arg = (k, d) => {
  const hit = process.argv.slice(2).find(a => a.startsWith('--' + k + '='));
  return hit ? hit.slice(k.length + 3) : d;
};
const SRC = path.resolve(__dirname, '..', arg('src', path.join('Diagram', '01-บำรุงรักษาตามวาระ', '14-บำรุงรักษา-userflow.md')));
const JOURNEY = process.argv.includes('--journey');
const OUT = path.join(__dirname, 'out', arg('out', JOURNEY ? 'diagram-userflow-maintainance-journey.json' : 'diagram-userflow-maintainance.json'));
const JOURNEY_CFG = path.resolve(__dirname, arg('journey-cfg', path.join('maintainance-plugin', 'build.json')));
const TITLE = arg('title', 'บำรุงรักษาตามวาระ');

/* ---- หน้าตา Template (อ่านค่าจริงจากบอร์ด Planning 1-2 เมื่อ 5 ต.ค. 2569 — ดู 6-flow-disposal.js) ---- */
const rgb = (r, g, b) => ({ r, g, b });
const GRAY = rgb(0.4588235318660736, 0.4588235318660736, 0.4588235318660736);
const ST = {
  end:      { size: 112, fill: rgb(1, 1, 1), stroke: GRAY },
  action:   { size: 176, fill: rgb(0.7607843279838562, 0.8980392217636108, 1), stroke: rgb(0.239215686917305, 0.6784313917160034, 1) },
  display:  { size: 176, fill: rgb(0.7764706015586853, 0.9803921580314636, 0.9647058844566345), stroke: rgb(0.3529411852359772, 0.8470588326454163, 0.800000011920929) },
  decision: { size: 176, fill: rgb(0.8627451062202454, 0.800000011920929, 1), stroke: rgb(0.529411792755127, 0.30980393290519714, 1) }
};
const YELLOW = rgb(0xFF / 255, 0xE2 / 255, 0x99 / 255);
const FONT = { family: 'IBM Plex Sans Thai', style: 'Bold' };
const CELL = 176;          // ขนาดกล่องใหญ่สุด — ใช้จัดกึ่งกลางช่อง
const COLW = 280;          // ระยะคอลัมน์ (176 + ช่องให้เส้นหักมุม)
const ROWH = 236;          // ระยะแถว
const X0 = 40, Y0 = 40;
const STICKY_H = 280;      // sticky ซ้อนกันในคอลัมน์เดียว
const MAX_LINE = 15;       // ตัวอักษรต่อบรรทัดในวงกลม 176 (ไทยไม่มีช่องว่าง ต้องตัดเอง)
const MAX_LINES = 5;

/* ---- อ่าน .md: scenario + บล็อก mermaid ---- */
function readScenarios(src) {
  const md = fs.readFileSync(src, 'utf8');
  const RE_H = /^### Scenario (\d+) · (.+)$/gm;
  const out = [];
  let hm;
  while ((hm = RE_H.exec(md))) {
    const start = hm.index + hm[0].length;
    const nextH = md.slice(start).search(/^### Scenario \d+ · /m);
    const body = md.slice(start, nextH === -1 ? undefined : start + nextH);
    const code = body.match(/```mermaid\n([\s\S]*?)```/);
    if (!code) { console.error('Scenario ' + hm[1] + ' ไม่มีบล็อก mermaid'); process.exit(1); }
    out.push({ n: Number(hm[1]), title: hm[2].trim(), code: code[1] });
  }
  if (!out.length) { console.error('ไม่พบหัวข้อ "### Scenario N · …" ใน ' + src); process.exit(1); }
  return out;
}

/* ---- parse ซอร์ส mermaid แบบจำกัดรูป (เราเป็นคนเขียนซอร์สเอง จึงคุมรูปได้) ---- */
const NODE_RE = /^(\w+)(\(\[(?:"[^"]*"|[^\]]*)\]\)|\(\((?:"[^"]*"|[^)]*)\)\)|\{(?:"[^"]*"|[^}]*)\}|\[(?:"[^"]*"|[^\]]*)\]|\((?:"[^"]*"|[^)]*)\))?/;
const ARROW_RE = /^-->(?:\|([^|]*)\|)?/;

function parseShape(raw) {
  if (!raw) return null;
  let kind, inner;
  if (raw.startsWith('([')) { kind = 'end'; inner = raw.slice(2, -2); }
  else if (raw.startsWith('((')) { kind = 'action'; inner = raw.slice(2, -2); }
  else if (raw.startsWith('{')) { kind = 'decision'; inner = raw.slice(1, -1); }
  else if (raw.startsWith('[')) { kind = 'display'; inner = raw.slice(1, -1); }
  else { kind = 'action'; inner = raw.slice(1, -1); }
  inner = inner.trim().replace(/^"|"$/g, '');
  const label = inner.replace(/<br\s*\/?>/g, '\n').replace(/\n+/g, '\n').trim();
  return { kind, label };
}

function parseFlow(code) {
  const nodes = [];           // เรียงตามที่เจอครั้งแรก
  const byId = {};
  const edges = [];
  const stickies = [];
  const define = (id, shape) => {
    if (!byId[id]) { byId[id] = { id, kind: shape ? shape.kind : 'action', label: shape ? shape.label : id, defined: !!shape }; nodes.push(byId[id]); }
    else if (shape && !byId[id].defined) { Object.assign(byId[id], { kind: shape.kind, label: shape.label, defined: true }); }
  };
  for (const rawLine of code.split('\n')) {
    let s = rawLine.trim();
    if (!s || /^flowchart\b/.test(s)) continue;
    const q = s.match(/^%%\s*Q:\s*(\w+)\s*\|\s*(.+)$/);
    if (q) { stickies.push({ node: q[1], text: q[2].trim() }); continue; }
    if (s.startsWith('%%')) continue;
    let prev = null, pendingLabel = '';
    let guard = 0;
    while (s && guard++ < 50) {
      const nm = s.match(NODE_RE);
      if (!nm) { console.error('อ่านบรรทัดไม่ออก: ' + rawLine.trim()); process.exit(1); }
      define(nm[1], parseShape(nm[2]));
      if (prev) edges.push({ from: prev, to: nm[1], label: pendingLabel });
      prev = nm[1];
      s = s.slice(nm[0].length).trimStart();
      if (!s) break;
      const am = s.match(ARROW_RE);
      if (!am) { console.error('คาดว่าเป็นลูกศร แต่เจอ: ' + s.slice(0, 40) + '  (บรรทัด: ' + rawLine.trim() + ')'); process.exit(1); }
      pendingLabel = (am[1] || '').trim();
      s = s.slice(am[0].length).trimStart();
    }
  }
  const undefinedNodes = nodes.filter(n => !n.defined);
  if (undefinedNodes.length) { console.error('node ไม่มีรูปทรง/ป้าย: ' + undefinedNodes.map(n => n.id).join(', ')); process.exit(1); }
  for (const st of stickies) if (!byId[st.node]) { console.error('sticky ชี้ node ที่ไม่มี: ' + st.node); process.exit(1); }
  return { nodes, edges, stickies, byId };
}

/* ---- จัดวาง: คอลัมน์ = longest path · แถว = เส้นหลักก่อน ทางแยกลงล่าง ---- */
const isNo = (label) => /^(N|No|ไม่)/i.test(label || '');
/* rank = ระยะไกลสุดจาก start (ไม่นับเส้นย้อนกลับ) · row = เส้นหลักแถว 0 ทางแยก N ลงแถวถัดไป · back = เส้นย้อนกลับ — ใช้ทั้งบอร์ด FigJam (แนวนอน) และผังข้างจอในปลั๊กอิน Figma (แนวตั้ง · plugin-lib/userflow-layout.js) */
function rankRows(flow) {
  const { nodes, edges } = flow;
  const ids = nodes.map(n => n.id);
  const out = {}; ids.forEach(id => { out[id] = []; });
  edges.forEach(e => out[e.from].push(e));

  // เส้นย้อนกลับ (loop) — DFS หา edge ที่ชี้เข้า node ที่ยังอยู่บน stack
  const state = {}; const back = new Set();
  const dfs = (u) => { state[u] = 1; for (const e of out[u]) { if (state[e.to] === 1) back.add(e); else if (!state[e.to]) dfs(e.to); } state[u] = 2; };
  ids.forEach(id => { if (!state[id]) dfs(id); });

  const rank = {}; ids.forEach(id => { rank[id] = 0; });
  let changed = true, guard = 0;
  while (changed && guard++ < 10000) {
    changed = false;
    for (const e of edges) { if (back.has(e)) continue; if (rank[e.to] < rank[e.from] + 1) { rank[e.to] = rank[e.from] + 1; changed = true; } }
  }

  const row = {}; const occ = new Set(); const key = (id, r) => rank[id] + ':' + r;
  const place = (id, want) => { let r = want; while (occ.has(key(id, r))) r++; row[id] = r; occ.add(key(id, r)); };
  const seen = new Set();
  const walk = (u) => {
    if (seen.has(u)) return; seen.add(u);
    const fw = out[u].filter(e => !back.has(e));
    const main = fw.filter(e => !isNo(e.label)), rest = fw.filter(e => isNo(e.label));
    [...main, ...rest].forEach((e, i) => { if (row[e.to] === undefined) place(e.to, i === 0 ? row[u] : row[u] + 1); });
    [...main, ...rest].forEach(e => walk(e.to));
  };
  place(ids[0], 0); walk(ids[0]);
  ids.forEach(id => { if (row[id] === undefined) { place(id, 0); walk(id); } });
  return { rank, row, back };
}
function layout(flow) {
  const { nodes, edges } = flow;
  const ids = nodes.map(n => n.id);
  const { rank, row, back } = rankRows(flow);

  const maxRank = Math.max(...ids.map(id => rank[id]));
  const maxRow = Math.max(...ids.map(id => row[id]));
  const placed = nodes.map(n => {
    const st = ST[n.kind];
    return {
      id: n.id, kind: n.kind, label: n.label,
      x: X0 + rank[n.id] * COLW + (CELL - st.size) / 2,
      y: Y0 + row[n.id] * ROWH + (CELL - st.size) / 2,
      w: st.size, h: st.size, fill: st.fill, stroke: st.stroke, strokeWeight: 4, fontSize: 14
    };
  });
  const pos = Object.fromEntries(placed.map(n => [n.id, n]));

  const specEdges = edges.map(e => {
    const a = pos[e.from], b = pos[e.to];
    /* magnet: คอลัมน์ติดกัน (รวมคนละแถว) = RIGHT→LEFT ให้เส้นหักมุมในช่องว่างระหว่างคอลัมน์ ไม่ลากผ่านกล่องที่อยู่ใต้ทางแยก
       (พรีวิว 19 ต.ค. 2569: BOTTOM→LEFT ของ "ว่าจ้าง ?" ทะลุกล่อง End ที่อยู่แถวล่าง) ·
       รวมเส้นข้ามหลายคอลัมน์ = RIGHT→(BOTTOM|TOP) วิ่งตามแถวต้นทางแล้วค่อยขึ้น/ลงเข้าปลายทาง · เส้นย้อนกลับ = BOTTOM→BOTTOM วนใต้แถว */
    let ms = 'RIGHT', me = 'LEFT';
    if (back.has(e)) { ms = 'BOTTOM'; me = 'BOTTOM'; }
    else if (row[e.to] !== row[e.from] && rank[e.to] > rank[e.from] + 1) { ms = 'RIGHT'; me = row[e.to] < row[e.from] ? 'BOTTOM' : 'TOP'; }
    return { from: e.from, to: e.to, label: e.label || '', style: 'solid', color: a.stroke, weight: 4, lineType: 'ELBOWED', ms, me, _b: b };
  }).map(({ _b, ...e }) => e);

  // sticky ใต้คอลัมน์ของ node ที่อ้าง · ซ้อนลงถ้าอยู่คอลัมน์เดียวกัน
  const stackByCol = {};
  const stickies = flow.stickies.map(st => {
    const r = rank[st.node];
    const k = stackByCol[r] = (stackByCol[r] || 0) + 1;
    return { x: X0 + r * COLW - 30, y: Y0 + (maxRow + 1) * ROWH + 20 + (k - 1) * STICKY_H, text: st.text, color: YELLOW };
  });
  const stickyRows = Math.max(0, ...Object.values(stackByCol));

  return {
    w: X0 + (maxRank + 1) * COLW + 40,
    h: Y0 + (maxRow + 1) * ROWH + (stickyRows ? 20 + stickyRows * STICKY_H : 0) + 40,
    font: FONT, phases: [], clusters: [], nodes: placed, edges: specEdges, stickies,
    _rank: rank, _row: row
  };
}

/* ---- ตรวจความยาวป้าย (ไทยไม่มีช่องว่าง Figma จะตัดกลางคำ) ---- */
const visibleLen = (s) => s.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g, '').length;
function labelWarnings(sc, nodes) {
  const w = [];
  for (const n of nodes) {
    const lines = n.label.split('\n');
    if (lines.length > MAX_LINES) w.push('S' + sc + ' ' + n.id + ': ' + lines.length + ' บรรทัด (เกิน ' + MAX_LINES + ')');
    for (const l of lines) if (visibleLen(l) > MAX_LINE) w.push('S' + sc + ' ' + n.id + ': "' + l + '" ยาว ' + visibleLen(l) + ' ตัว (เกิน ' + MAX_LINE + ')');
  }
  return w;
}

/* ---- section คำอธิบายสัญลักษณ์ (หัวบอร์ด) ---- */
function legend(count, note) {
  const items = [
    ['L1', 'end', 'start /\nEnd'],
    ['L2', 'action', 'Action\nสิ่งที่ผู้ใช้ทำ'],
    ['L3', 'display', 'Display\nหน้าจอ /\nระบบแสดง'],
    ['L4', 'decision', 'Decision ?\nY / N']
  ];
  const nodes = items.map(([id, kind, label], i) => {
    const st = ST[kind];
    return { id, kind, label, x: X0 + i * COLW + (CELL - st.size) / 2, y: Y0 + (CELL - st.size) / 2, w: st.size, h: st.size, fill: st.fill, stroke: st.stroke, strokeWeight: 4, fontSize: 14 };
  });
  const stickies = [{
    x: X0 + 4 * COLW, y: Y0 - 20, color: YELLOW,
    text: TITLE + ' — userflow ' + count + ' scenario (ร่าง 19 ต.ค. 2569)\n' + (note || 'section ละ scenario เรียงตามลำดับงาน · อ่านซ้าย → ขวา') + '\nป้าย Y/N บนเส้น · เส้นที่วนใต้แถว = ย้อนกลับไปแก้\n❓ ในกล่อง / sticky เหลือง = ยังไม่รู้ ต้องถาม\nเนื้อหาคู่กัน: ' + path.relative(path.join(__dirname, '..'), SRC)
  }];
  return { name: TITLE + ' · userflow — สัญลักษณ์และวิธีอ่าน', diagram: { w: X0 + 4 * COLW + 420, h: Y0 + CELL + 120, font: FONT, phases: [], clusters: [], nodes, edges: [], stickies } };
}

/* ---- journey: ผังเดียวต่อกันทุก scenario ---- */
const BAND_HEAD = 110;     // หัวแถบ scenario (ชื่อ S<n> ตัว 30)
const BLOCK_GAP = 260;     // ช่องระหว่างบล็อก scenario (ให้เส้นข้ามหักมุม + ป้าย)
const PHASE_H = 80;        // แถวหัวช่วงงานเหนือแถบ
const BACK_GRAY = rgb(0.596, 0.635, 0.702);
function journeyDiagram() {
  const cfg = JSON.parse(fs.readFileSync(JOURNEY_CFG, 'utf8')).journey;
  if (!cfg) { console.error('ไม่มี "journey" ใน ' + JOURNEY_CFG); process.exit(1); }
  const m = require('./plugin-lib/journey-merge.js').merge(SRC, cfg);
  const L = {};
  for (const n of m.order) if (m.blocks[n]) L[n] = layout(m.blocks[n].flow);
  const rowOf = (n) => (cfg.row && cfg.row[n]) || 0;
  const colX = []; let x = X0;
  cfg.cols.forEach((col, i) => { colX[i] = x; x += Math.max(...col.map(n => L[n] ? L[n].w : 0)) + BLOCK_GAP; });
  const top = Y0 + PHASE_H;
  const h0 = Math.max(...m.order.filter(n => L[n] && !rowOf(n)).map(n => L[n].h)) + BAND_HEAD;
  const rowY = [top, top + h0 + BLOCK_GAP];
  const colOf = {}; cfg.cols.forEach((col, i) => col.forEach(n => { colOf[n] = i; }));
  const nodes = [], edges = [], stickies = [], clusters = [], phases = [], at = {};
  const id = (n, k) => 'S' + n + '_' + k;
  for (const n of m.order) {
    const d = L[n]; if (!d) continue;
    const bx = colX[colOf[n]], by = rowY[rowOf(n)];
    at[n] = { x: bx, y: by, w: d.w, h: d.h + BAND_HEAD };
    clusters.push({ label: 'S' + n + ' · ' + m.blocks[n].title, x: bx, y: by, w: d.w, h: d.h + BAND_HEAD });
    for (const nd of d.nodes) nodes.push(Object.assign({}, nd, { id: id(n, nd.id), x: bx + nd.x, y: by + BAND_HEAD + nd.y }));
    for (const e of d.edges) edges.push(Object.assign({}, e, { from: id(n, e.from), to: id(n, e.to) }));
    for (const st of d.stickies) stickies.push(Object.assign({}, st, { x: bx + st.x, y: by + BAND_HEAD + st.y }));
  }
  const pos = Object.fromEntries(nodes.map(nd => [nd.id, nd]));
  for (const c of m.cross) {
    const a = pos[id(c.a, c.from)];
    if (!a || !pos[id(c.b, c.to)]) { console.error('เส้นข้าม scenario ชี้กล่องที่ไม่มี: S' + c.a + '.' + c.from + ' → S' + c.b + '.' + c.to); process.exit(1); }
    edges.push(c.back
      ? { from: id(c.a, c.from), to: id(c.b, c.to), label: c.label, style: 'dotted', dash: [16, 12], color: BACK_GRAY, weight: 4, lineType: 'ELBOWED', ms: 'BOTTOM', me: 'BOTTOM' }
      : { from: id(c.a, c.from), to: id(c.b, c.to), label: c.label, style: 'solid', color: a.stroke, weight: 4, lineType: 'ELBOWED', ms: 'RIGHT', me: 'LEFT' });
  }
  for (const [title, ns] of (cfg.phases || [])) {
    const xs = ns.filter(n => at[n]).map(n => at[n].x);
    if (xs.length) phases.push({ label: '▸ ' + title, x: Math.min(...xs), y: Y0 });
  }
  const w = Math.max(...Object.values(at).map(b => b.x + b.w)) + 40;
  const h = Math.max(...Object.values(at).map(b => b.y + b.h)) + 200;   // เผื่อเส้นย้อนกลับวิ่งใต้แถบ
  return { diagram: { w, h, font: FONT, phases, clusters, nodes, edges, stickies }, m };
}

/* ---- ประกอบ ---- */
function main() {
if (JOURNEY) {
  const { diagram, m } = journeyDiagram();
  const back = m.cross.filter(c => c.back).length;
  const sections = [legend(m.order.length, 'ผังเดียวต่อกันทุก scenario · start จุดเดียว อ่านซ้าย → ขวา · แถบสี = scenario · เส้นประเทา = ย้อนกลับ'),
    { name: TITLE + ' · journey — userflow ต่อกันทั้งเรื่อง (S' + m.order[0] + ' → S' + m.order[m.order.length - 1] + ')', diagram }];
  const jw = labelWarnings('J', diagram.nodes).concat(m.warnings);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify({ title: TITLE, src: path.relative(path.join(__dirname, '..'), SRC), generatedAt: new Date().toISOString(), sections }));
  console.log('journey ' + m.order.length + ' scenario · node ' + diagram.nodes.length + ' · เส้น ' + diagram.edges.length + ' (ข้าม scenario ' + m.cross.length + ' · ย้อนกลับ ' + back + ') · sticky ' + diagram.stickies.length +
    ' · start ' + diagram.nodes.filter(n => n.kind === 'end' && n.label === 'start').length + ' · ' + Math.round(diagram.w) + '×' + Math.round(diagram.h));
  if (jw.length) { console.log('⚠ เตือน ' + jw.length + ' ข้อ:'); jw.forEach(w => console.log('   ' + w)); }
  console.log('เขียน ' + path.relative(process.cwd(), OUT));
  return;
}
const scenarios = readScenarios(SRC);
const sections = [legend(scenarios.length)];
const warnings = [];
let totals = { nodes: 0, edges: 0, stickies: 0 };
for (const sc of scenarios) {
  const flow = parseFlow(sc.code);
  const d = layout(flow);
  warnings.push(...labelWarnings(sc.n, d.nodes));
  const ends = flow.nodes.filter(n => n.kind === 'end');
  if (ends.length < 2) warnings.push('S' + sc.n + ': มี start/End แค่ ' + ends.length + ' กล่อง');
  const dec = flow.nodes.filter(n => n.kind === 'decision');
  for (const q of dec) {
    const outs = flow.edges.filter(e => e.from === q.id);
    if (outs.length < 2) warnings.push('S' + sc.n + ' ' + q.id + ': ทางแยกมีเส้นออกแค่ ' + outs.length);
    if (!q.label.includes('?')) warnings.push('S' + sc.n + ' ' + q.id + ': Decision ไม่ลงท้าย ?');
  }
  const { _rank, _row, ...diagram } = d;
  sections.push({ name: TITLE + ' · Scenario ' + sc.n + ' · ' + sc.title, diagram });
  totals.nodes += diagram.nodes.length; totals.edges += diagram.edges.length; totals.stickies += diagram.stickies.length;
  console.log('S' + String(sc.n).padStart(2) + '  node ' + String(diagram.nodes.length).padStart(2) + ' · เส้น ' + String(diagram.edges.length).padStart(2) +
    ' · sticky ' + diagram.stickies.length + ' · ' + diagram.w + '×' + diagram.h + '  ' + sc.title);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify({ title: TITLE, src: path.relative(path.join(__dirname, '..'), SRC), generatedAt: new Date().toISOString(), sections }));
console.log('รวม ' + scenarios.length + ' scenario + สัญลักษณ์ 1 section · node ' + totals.nodes + ' · เส้น ' + totals.edges + ' · sticky ' + totals.stickies);
if (warnings.length) { console.log('⚠ เตือน ' + warnings.length + ' ข้อ:'); warnings.forEach(w => console.log('   ' + w)); }
console.log('เขียน ' + path.relative(process.cwd(), OUT));
}

module.exports = { readScenarios, parseFlow, rankRows, layout, isNo, ST, MAX_LINE, MAX_LINES };
if (require.main === module) main();
