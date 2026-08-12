/* ============================================================
   ยกของที่ซ้ำในหน้าจอเป็น Figma component + แทนจุดใช้งานด้วย instance
   ------------------------------------------------------------
   ชื่อ layer จาก mapping.js คือกุญแจ — ตัวไหนชื่อเข้า pattern ของชุด
   component (btn / … ฯลฯ) จะถูกเทียบโครงกับ "ตัวนิยาม" (occurrence
   ที่ node เยอะสุดของ variant นั้น) ด้วย tree-diff:

     · text ตรงตำแหน่ง        → override ข้อความ (+สี/ขนาดถ้าต่าง)
     · icon ตรงตำแหน่ง        → override glyph/สี (ปลั๊กอิน swap ให้)
     · ลูกของตัวนิยามที่ instance ไม่มี → ซ่อน (visible=false)
     · instance มีของที่ตัวนิยามไม่มี  → แปลงไม่ได้ คงเป็น frame แล้ว log

   กติกาเข้มตรง "frame ลูกต้องชื่อตรงกันเป๊ะ" — badge/success ใน cell
   จะไม่มีวันโดนจับคู่กับ badge/error (สีจะเพี้ยน) เคสนั้นให้คงเป็น frame

   ชุดที่มีสถานะจับไม่ได้จากการเรนเดอร์ครั้งเดียว (form field, review zone
   ฯลฯ) ทำเป็น "specimen" — component ตัวอย่างในหน้า Foundations
   ให้ดีไซเนอร์หยิบใช้ต่อ แต่ในหน้าจอคงเป็น frame ตามจริง
   ============================================================ */

/* ---------- ชุดที่แปลงเป็น variant + instance จริง ---------- */
/* def: ตัวนิยามของ variant เลือกยังไง
   'rich'   — โครงลูกแบน (icon/text ใต้รากตรงๆ) เอา occurrence ที่ node เยอะสุด
              ตัวที่จนกว่าจะ match แบบซ่อนส่วนเกินได้ (ปุ่มไม่มีไอคอน = ซ่อนไอคอน)
   'common' — โครงข้างในหลากหลาย (เซลล์ตาราง) เอาโครงที่พบบ่อยสุดเป็นตัวนิยาม
              ตัวประหลาด (เซลล์มี badge/ปุ่ม/checkbox) คงเป็น frame ไป */
const SETS = [
  // ' (actions)' กับ ' / disabled' ไม่เข้า pattern โดยตั้งใจ — หน้าตาต่างจาก variant หลัก
  { set: 'btn', def: 'rich', re: /^btn \/ ([a-z-]+) \/ ([a-z]+)$/, props: (m) => ({ Hierarchy: m[1], Size: m[2] }) },
  { set: 'badge', def: 'rich', re: /^badge \/ ([a-z-]+)$/, props: (m) => ({ Status: m[1] }) },
  { set: 'sidebar item', def: 'rich', re: /^sidebar item( \/ active)?$/, props: (m) => ({ State: m[1] ? 'active' : 'default' }) },
  { set: 'stepper step', def: 'rich', re: /^stepper step( \/ (active|passed|locked))?$/, props: (m) => ({ State: m[2] || 'default' }) },
  { set: 'header cell', def: 'common', re: /^header cell$/, props: () => ({}) },
  { set: 'cell', def: 'common', re: /^cell$/, props: () => ({}) }
];

/* ---------- ชุดที่เป็น specimen อย่างเดียว ---------- */
const SPECIMENS = ['form field', 'section header', 'card', 'breadcrumb',
                   'empty state', 'toast', 'draft banner', 'review zone'];

const keyOf = (props) => {
  const parts = Object.entries(props).map(([k, v]) => k + '=' + v);
  return parts.length ? parts.join(', ') : 'default';
};

function matchSet(name) {
  for (const s of SETS) {
    const m = s.re.exec(name || '');
    if (m) return { set: s.set, def: s.def, props: s.props(m) };
  }
  return null;
}

/* ลายเซ็นโครง — ชนิด+ชื่อของทั้งต้นไม้ ไม่สนข้อความ/glyph/สี */
function skeleton(n) {
  const tag = n.type === 'text' ? 'T' : n.type === 'svg' ? 'I' : n.type + ':' + n.name;
  return tag + '(' + (n.children || []).map(skeleton).join(',') + ')';
}

const countNodes = (n) => 1 + (n.children || []).reduce((a, c) => a + countNodes(c), 0);
const clone = (n) => JSON.parse(JSON.stringify(n));

/* ---------- tree-diff: instance เทียบตัวนิยาม ----------
   เดินตัวนิยามแบบ pre-order พร้อมตัวนับ text/icon เพื่อให้ index
   ตรงกับลำดับ findAll ของปลั๊กอิน (ตัวที่ถูกซ่อนก็ยังนับ) */
function compatible(d, i) {
  if (d.type === 'text' && i.type === 'text') return true;
  if (d.type === 'svg' && i.type === 'svg') return true;
  return d.type === i.type && d.name === i.name;
}

function skipLeaves(def, out) {
  if (def.type === 'text') out._ti++;
  else if (def.type === 'svg') out._ii++;
  (def.children || []).forEach(c => skipLeaves(c, out));
}

function diff(def, inst, out, path) {
  if (def.type === 'text') {
    const o = { i: out._ti++, chars: inst.text.chars };
    const dt = def.text || {}, it = inst.text || {};
    if (it.color !== dt.color) o.color = it.color;
    if (it.size !== dt.size) o.size = it.size;
    if (it.weight !== dt.weight) o.weight = it.weight;
    out.texts.push(o);
    return true;
  }
  if (def.type === 'svg') {
    out.icons.push({ i: out._ii++, glyph: inst.glyph, color: inst.color });
    return true;
  }

  const dk = def.children || [];
  const ik = inst.children || [];
  let di = 0;
  for (const ic of ik) {
    let found = -1;
    for (let j = di; j < dk.length; j++) if (compatible(dk[j], ic)) { found = j; break; }
    if (found === -1) return false;                  // instance มีของที่ตัวนิยามไม่มี
    for (let j = di; j < found; j++) {               // ลูกตัวนิยามที่โดนข้าม → ซ่อน
      out.hidden.push(path.concat(j));
      skipLeaves(dk[j], out);
    }
    if (!diff(dk[found], ic, out, path.concat(found))) return false;
    di = found + 1;
  }
  for (let j = di; j < dk.length; j++) {             // ที่เหลือท้ายแถว → ซ่อน
    out.hidden.push(path.concat(j));
    skipLeaves(dk[j], out);
  }
  return true;
}

/* ---------- เดินหน้าจอ ---------- */
function walk(node, fn) {
  fn(node);
  (node.children || []).forEach(c => walk(c, fn));
}

function collectDefs(screens) {
  const found = new Map();          // set§key → { set, key, props, def, nodes: [] }
  const specimens = new Map();      // name → root
  for (const sc of screens) {
    walk(sc.root, (node) => {
      const m = matchSet(node.name);
      if (m) {
        const k = m.set + '§' + keyOf(m.props);
        if (!found.has(k)) found.set(k, { set: m.set, key: keyOf(m.props), props: m.props, def: m.def, nodes: [] });
        found.get(k).nodes.push(node);
      }
      if (SPECIMENS.includes(node.name) && !specimens.has(node.name)) specimens.set(node.name, node);
    });
  }

  const variants = new Map();       // set§key → { set, key, props, root(ยังไม่ clone) }
  for (const [k, v] of found) {
    let pool = v.nodes;
    if (v.def === 'common') {
      const freq = new Map();
      for (const n of pool) {
        const sig = skeleton(n);
        if (!freq.has(sig)) freq.set(sig, []);
        freq.get(sig).push(n);
      }
      pool = [...freq.values()].sort((a, b) => b.length - a.length)[0];
    }
    const root = pool.reduce((best, n) => countNodes(n) > countNodes(best) ? n : best, pool[0]);
    variants.set(k, { set: v.set, key: v.key, props: v.props, root });
  }
  return { variants, specimens };
}

function toInstance(node, defEntry, stats) {
  const out = { texts: [], icons: [], hidden: [], _ti: 0, _ii: 0 };
  if (!diff(defEntry.root, node, out, [])) {
    stats.componentFallback[node.name] = (stats.componentFallback[node.name] || 0) + 1;
    return null;
  }
  delete out._ti; delete out._ii;
  stats.instances++;
  const inst = {
    type: 'instance', set: defEntry.set, key: defEntry.key,
    name: node.name, size: node.size, overrides: out
  };
  if (node.pos) inst.pos = node.pos;
  return inst;
}

function replaceInstances(node, variants, stats) {
  const m = matchSet(node.name);
  if (m) {
    const d = variants.get(m.set + '§' + keyOf(m.props));
    if (d) {
      const inst = toInstance(node, d, stats);
      if (inst) return inst;                         // ไม่ลงลึกต่อ — ข้างในเป็นของ component แล้ว
    }
  }
  if (node.children) node.children = node.children.map(c => replaceInstances(c, variants, stats));
  return node;
}

/* ------------------------------------------------------------
   ทางเข้า — mutate screens แล้วคืนก้อน components สำหรับ spec.json
   ------------------------------------------------------------ */
function collectComponents(screens, iconSvgs, stats) {
  stats.instances = 0;
  stats.componentFallback = {};

  const { variants, specimens } = collectDefs(screens);

  // clone ตัวนิยามก่อนแทนที่ — ไม่งั้นตัวนิยามเองโดนแปลงเป็น instance ไปด้วย
  const sets = new Map();
  for (const v of variants.values()) {
    if (!sets.has(v.set)) sets.set(v.set, []);
    sets.get(v.set).push({ key: v.key, props: v.props, root: clone(v.root) });
  }
  const specimenDefs = [...specimens.entries()].map(([name, root]) => ({ name, root: clone(root) }));

  for (const sc of screens) sc.root = replaceInstances(sc.root, variants, stats);
  // ใน specimen ก็ใช้ instance ได้ (component ซ้อน instance เป็นเรื่องปกติใน Figma)
  for (const sp of specimenDefs) sp.root = replaceInstances(sp.root, variants, stats);

  // ไอคอนทุก glyph ที่หน้าจอใช้ → ทำเป็น icon component ในหน้า Foundations
  const glyphs = new Set();
  for (const sc of screens) walk(sc.root, (n) => {
    if (n.type === 'svg' && n.glyph) glyphs.add(n.glyph);
    if (n.type === 'instance') (n.overrides.icons || []).forEach(o => o.glyph && glyphs.add(o.glyph));
  });
  for (const s of sets.values()) s.forEach(v => walk(v.root, (n) => { if (n.type === 'svg' && n.glyph) glyphs.add(n.glyph); }));
  for (const sp of specimenDefs) walk(sp.root, (n) => { if (n.type === 'svg' && n.glyph) glyphs.add(n.glyph); });

  return {
    pageName: 'Foundations & Components',
    sets: [...sets.entries()].map(([set, variants]) => ({ set, variants })),
    specimens: specimenDefs,
    icons: [...glyphs].sort().filter(g => iconSvgs[g]).map(g => ({ glyph: g, svg: iconSvgs[g] }))
  };
}

module.exports = { collectComponents, matchSet };
