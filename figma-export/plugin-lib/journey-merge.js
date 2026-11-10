/* ============================================================
   plugin-lib/journey-merge.js — รวม userflow ทุก scenario เป็นเส้นเดียวที่ต่อกัน (ฝั่ง Node)
   ------------------------------------------------------------
   เจ้าของงานสั่ง 22 ต.ค. 2569: "ที่ส่งไปไม่ได้ต่อกัน แต่สิ่งที่อยากได้คือต่อกัน" — แบบตัวอย่างบอร์ด
   ~/PEA/Maintain-D/userflow/overhaul-journey-ส่งสำรวจ-ตัวอย่างแนวขวาง-2569-10-22.txt (start จุดเดียว · scenario ถัดไปต่อจากขั้นสุดท้ายของ scenario ก่อน)

   กติการวม (ลำดับ/จุดต่อจาก build.json "journey".links = [จาก, ไป, ป้าย, 'back']):
   - start ของทุก scenario ยกเว้นตัวแรก = ถอดออก · ปลายทางของจุดต่อ = ขั้นแรกหลัง start
   - ต้นทางของจุดต่อ: กล่องกระโดด ("ไป S7 …" / "กลับ S10 …") ที่ชี้ scenario ปลายทาง ก่อน ·
     ไม่มี ⇒ กล่อง End — ไปข้างหน้าเลือก End แถวหลัก (ทาง Y) · ย้อนกลับเลือก End ทางแยก (ทาง N) · มีตัวเดียวใช้ตัวนั้น
   - End / กล่องกระโดดที่ใช้เป็นต้นทาง = ถอดออก เส้นที่เข้ามาวิ่งต่อไป scenario ปลายทางเลย ·
     End ที่มีข้อความของตัวเอง (เช่น "รอแจ้งเตือนคันถัดไป") = เก็บไว้เป็นกล่อง Action แล้วต่อจากกล่องนั้น
   - End ที่ไม่ได้ใช้ต่อ (ทางปฏิเสธที่ยังไม่มีปลายทาง) = เป็น End ตามเดิม
   - กล่องเดียวมีจุดต่อไปข้างหน้าหลายทาง (S10 → S11 ว่าจ้าง | S12 ตรวจเอง) ⇒ เติม Decision ให้ ไม่ปล่อยเส้นแตกจากกล่องธรรมดา
   - กล่องกระโดดที่ไม่มีใน links (เช่น S15 "กลับ S10") ⇒ เติมจุดต่อให้เอง (ย้อนกลับถ้าเลขน้อยกว่า)
   ผล: { blocks: { n: { n, title, flow } }, cross: [{ a, from, b, to, label, back }], warnings }
     flow = รูปเดียวกับ parseFlow() (nodes/edges/stickies) เฉพาะเส้นใน scenario · cross = เส้นข้าม scenario (id ยังเป็น id ในบล็อกของตัวเอง)
   ============================================================ */
const uf = require('../8-flow-userflow.js');

const JUMP_RE = /^(ไป|กลับ)\s*S(\d+)/;

function merge(src, journey) {
  const warnings = [];
  const scen = {};
  for (const sc of uf.readScenarios(src)) scen[sc.n] = { n: sc.n, title: sc.title, flow: uf.parseFlow(sc.code) };
  const order = [].concat(...journey.cols);
  const firstN = order[0];

  /* ขั้นแรกของแต่ละ scenario (หลัง start) */
  const entry = {};
  for (const n of order) {
    const f = scen[n] && scen[n].flow; if (!f) { warnings.push('journey ชี้ S' + n + ' แต่ไฟล์ userflow ไม่มี'); continue; }
    const s = f.nodes[0];
    const outs = f.edges.filter(e => e.from === s.id);
    entry[n] = n === firstN ? s.id : (outs[0] && outs[0].to);
    if (n !== firstN && outs.length !== 1) warnings.push('S' + n + ': start มีเส้นออก ' + outs.length + ' เส้น (ใช้เส้นแรก)');
  }

  /* links + กล่องกระโดดที่ไม่มีใน links */
  const links = journey.links.map(([a, b, label, kind]) => ({ a, b, label: label || '', back: kind === 'back' }));
  for (const n of order) {
    const f = scen[n] && scen[n].flow; if (!f) continue;
    for (const nd of f.nodes) {
      const m = nd.kind === 'end' && nd.label.match(JUMP_RE);
      if (m && !links.some(l => l.a === n && l.b === Number(m[2]))) links.push({ a: n, b: Number(m[2]), label: nd.label.replace(JUMP_RE, '').replace(/\s+/g, ''), back: Number(m[2]) < n });   // ป้าย = ข้อความต่อท้าย เช่น "ทำคันที่เหลือ"
    }
  }

  /* หาต้นทางของแต่ละจุดต่อ */
  const used = {};   // n → Set(id ของ End/กล่องกระโดดที่ถูกใช้เป็นต้นทาง)
  for (const l of links) {
    const f = scen[l.a] && scen[l.a].flow; if (!f || entry[l.b] == null) continue;
    const { row } = uf.rankRows(f);
    const ends = f.nodes.filter((nd, i) => i > 0 && nd.kind === 'end');
    const jump = ends.find(nd => { const m = nd.label.match(JUMP_RE); return m && Number(m[2]) === l.b; });
    const plain = ends.filter(nd => !JUMP_RE.test(nd.label));
    let src = jump;
    if (!src) {
      const main = plain.filter(nd => !row[nd.id]), side = plain.filter(nd => row[nd.id]);
      src = l.back ? (side[0] || (plain.length === 1 ? plain[0] : null)) : (main[0] || (plain.length === 1 ? plain[0] : null));
    }
    if (!src) { warnings.push('หาต้นทางของ S' + l.a + ' → S' + l.b + ' ไม่เจอ (ไม่มี End ที่เข้าเงื่อนไข)'); continue; }
    l.src = src.id;
    (used[l.a] = used[l.a] || new Set()).add(src.id);
  }

  /* ประกอบบล็อก: ถอด start (ยกเว้นตัวแรก) · ถอด End/กล่องกระโดดที่ใช้เป็นต้นทาง (End ที่มีข้อความเก็บเป็น Action) */
  const blocks = {}, cross = [];
  for (const n of order) {
    const sc = scen[n]; if (!sc) continue;
    const f = sc.flow, start = f.nodes[0];
    const drop = new Set(); const keepAsAction = new Set();
    if (n !== firstN) drop.add(start.id);
    for (const id of (used[n] || [])) {
      const nd = f.nodes.find(x => x.id === id);
      if (nd.label === 'End' || JUMP_RE.test(nd.label)) drop.add(id); else keepAsAction.add(id);
    }
    const nodes = f.nodes.filter(nd => !drop.has(nd.id)).sort((x, y) => (y.id === entry[n]) - (x.id === entry[n])).map(nd => keepAsAction.has(nd.id) ? Object.assign({}, nd, { kind: 'action' }) : Object.assign({}, nd));
    const edges = f.edges.filter(e => !drop.has(e.from) && !drop.has(e.to)).map(e => Object.assign({}, e));
    const stickies = f.stickies.map(st => drop.has(st.node) ? Object.assign({}, st, { node: (f.edges.find(e => e.to === st.node && !drop.has(e.from)) || {}).from || entry[n] }) : st);
    blocks[n] = { n, title: sc.title, flow: { nodes, edges, stickies } };
  }

  /* เส้นข้าม scenario: ต้นทางที่ถอดออก ⇒ ต่อจากกล่องก่อนหน้า (ทุกเส้นที่เข้ามา) · ป้าย = Y/N เดิม (ถ้ามาจาก Decision) + ป้ายจุดต่อ */
  const pending = {};   // n:กล่องที่เส้นออกจริง:กล่องที่ถอด → [{ b, label, back, inLabel }] (แยกตามกล่องที่ถอด — Decision Y/N ไปคนละ scenario ไม่ต้องเติม Decision ซ้ำ)
  for (const l of links) {
    if (!l.src) continue;
    const f = scen[l.a].flow, blk = blocks[l.a].flow;
    const kept = blk.nodes.some(nd => nd.id === l.src);
    const froms = kept ? [{ id: l.src, inLabel: '' }] : f.edges.filter(e => e.to === l.src).map(e => ({ id: e.from, inLabel: e.label || '' }));
    for (const fr of froms) {
      const k = l.a + ':' + fr.id + ':' + l.src;
      (pending[k] = pending[k] || []).push({ a: l.a, from: fr.id, b: l.b, to: entry[l.b], label: l.label, back: l.back, inLabel: fr.inLabel });
    }
  }
  const join = (a, b) => [a, b].filter(Boolean).join(' · ');
  let qn = 0;
  for (const k of Object.keys(pending)) {
    const list = pending[k], fwd = list.filter(x => !x.back);
    const { a, from } = list[0];
    const blk = blocks[a].flow, fromNode = blk.nodes.find(nd => nd.id === from);
    if (fwd.length > 1) {   // จุดเดียวไปข้างหน้าหลายทาง (S10 → S11 | S12) ⇒ เติม Decision ไม่ให้เส้นแตกจากกล่องเดิม
      const qid = 'J' + a + 'Q' + (++qn);
      const lbls = fwd.map(x => x.label).filter(Boolean);
      blk.nodes.push({ id: qid, kind: 'decision', label: (lbls.length ? lbls.join('\nหรือ ') : 'ไปทางไหน') + ' ?', defined: true });
      blk.edges.push({ from, to: qid, label: fwd[0].inLabel || '' });
      fwd.forEach(x => cross.push({ a, from: qid, b: x.b, to: x.to, label: x.label, back: false }));
      list.filter(x => x.back).forEach(x => cross.push({ a, from, b: x.b, to: x.to, label: join(x.inLabel, x.label), back: true }));
    } else {
      list.forEach(x => cross.push({ a, from, b: x.b, to: x.to, label: fromNode.kind === 'decision' ? join(x.inLabel, x.label) : (x.label || x.inLabel), back: x.back }));
    }
  }
  return { blocks, cross, order, warnings };
}

module.exports = { merge };
