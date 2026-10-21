/* ตรวจจอที่ปลั๊กอินสร้างตามกติกา component-rules.json (19 ต.ค. 2569)
   ใช้กับต้นไม้ node แบบ Figma (ของจริงหรือตัวจำลองใน test-overhaul2-plugin.js) — คืน { fails, pending }
   fails = ผิดกติกา (ทดสอบไม่ผ่าน) · pending = ข้อยกเว้นที่รอเจ้าของงานเคาะ (แสดงให้เห็น แต่ไม่ทำให้ล้ม) */
const fs = require('fs');
const path = require('path');

const RULES = JSON.parse(fs.readFileSync(path.join(__dirname, 'component-rules.json'), 'utf8'));

const shown = (n) => { for (let p = n; p; p = p.parent) if (p.visible === false) return false; return true; };
const compName = (n) => { const m = n._main || n.mainComponent; if (m && m.parent && m.parent.type === 'COMPONENT_SET') return m.parent.name; return m ? m.name : n.name; };
const isInst = (n, name) => n.type === 'INSTANCE' && (n.name === name || compName(n) === name);
const prop = (n, k) => { const cp = n.componentProperties || {}; const x = Object.keys(cp).find(y => y.split('#')[0].trim() === k); return x ? cp[x].value : undefined; };
const hex = (c) => '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const composedTables = (sc) => sc.findAll(n => n.type === 'FRAME' && n.name === 'Table' && n.children.some(x => x.name === 'Column'));
const oversize = (t) => { const cs = t.children.filter(x => x.name === 'Column'); return cs.length > RULES.library.Table.cols || (cs[0] && cs[0].children.length - 1 > RULES.library.Table.rows); };

function check(screens) {
  const fails = [], pending = new Map();
  const fail = (r, sc, msg) => fails.push(r.id + ' ' + sc.name + ' — ' + msg);
  for (const sc of screens) {
    const mobile = sc.width <= 500;
    const all = sc.findAll(() => true);
    // R14 ขนาดจอ
    const want = RULES.screen[mobile ? 'mobile' : 'desktop'];
    const ex = RULES.screen.exempt, exempt = !!(ex && sc.name.indexOf(ex.namePrefix) === 0);   // R20 หน้า toast แยก: เฟรม = toast อย่างเดียว ไม่ใช่ขนาดจอ (21 ต.ค. 2569)
    const inInst = (x) => { for (let p = x.parent; p && p !== sc; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };
    if (exempt) {
      if (!all.some(x => isInst(x, ex.mustContain) && shown(x))) fail(ex, sc, 'ไม่มี ' + ex.mustContain);
      if (all.some(x => x.type === 'INSTANCE' && shown(x) && !isInst(x, ex.mustContain) && !inInst(x))) fail(ex, sc, 'มีชิ้นอื่นนอกจาก ' + ex.mustContain + ' — หน้า toast ต้องไม่มี UI อื่น');
      if (ex.exportSettings && !(sc.exportSettings && sc.exportSettings.length)) fail(ex, sc, 'ไม่มี Export settings');
    } else if (Math.round(sc.width) !== want[0]) fail(RULES.screen, sc, 'กว้าง ' + sc.width + ' ต้องเป็น ' + want[0]);
    // variant ที่กำหนด
    for (const r of RULES.variants) for (const n of all.filter(x => isInst(x, r.component) && shown(x))) {
      const w = r[mobile ? 'mobile' : 'desktop']; if (!w) continue;   // บางกติกากำหนดเฉพาะ desktop (mobile ใช้ component คนละตัว)
      for (const k of Object.keys(w)) if ((n.variantProperties || {})[k] !== w[k]) fail(r, sc, r.component + ' ' + k + '=' + (n.variantProperties || {})[k] + ' ต้องเป็น ' + w[k]);
    }
    // property ที่ต้องเป็นค่านี้เสมอ
    for (const r of RULES.props) for (const n of all.filter(x => isInst(x, r.component) && shown(x) && (!r.labels || r.labels.includes(prop(x, 'Label text'))) && Object.keys(r.onlyIf || {}).every(k => prop(x, k) === undefined || prop(x, k) === r.onlyIf[k]) && !(r.skipInside || []).some(c => { for (let p = x.parent; p && p !== sc; p = p.parent) if (isInst(p, c)) return true; return false; }))) {   // onlyIf: เช่นช่องค้นหาใน Header navigation ซ่อน Label ⇒ Info icon ไม่แสดงอยู่แล้ว
      for (const k of Object.keys(r.must)) { const v = prop(n, k); if (v !== undefined && v !== r.must[k]) fail(r, sc, r.component + ' "' + k + '" = ' + v + ' ต้องเป็น ' + r.must[k]); }
    }
    // ชิ้นย่อยต้องอยู่ใน component แม่ทั้งก้อน
    for (const r of RULES.insideOnly) for (const n of all.filter(x => isInst(x, r.component))) {
      let ok = false, allowed = false;
      for (let p = n.parent; p && p !== sc; p = p.parent) {
        if (isInst(p, r.parent)) { ok = true; break; }
        if (r.allowInStyledFrame && p.type === 'FRAME' && p.name === r.parent) {   // เฟรมแทน component ต้องมีกรอบ + มุมแบบ component (หน้างานซ่อม)
          if ((p.strokes || []).length && p.cornerRadius > 0) { ok = true; break; }
          fail(r, sc, r.parent + ' เป็นเฟรมไม่มีกรอบ/มุม — ต้องแต่งแบบหน้างานซ่อม'); ok = true; break;
        }
        if (r.allowWhenOversize && p.type === 'FRAME' && p.name === r.allowWhenOversize && p.children.some(x => x.name === 'Column') && oversize(p)) { allowed = true; break; }
      }
      if (ok) continue;
      if (allowed || r.pending) { const k = r.id + ' ' + (r.pending || 'ตาราง ' + r.component + ' เกินขนาด Table ของไลบรารี'); pending.set(k, (pending.get(k) || new Set()).add(sc.name)); continue; }
      fail(r, sc, r.component + ' วางเดี่ยว ต้องอยู่ใน ' + r.parent);
    }
    // R25 (21 ต.ค. 2569 ค่ำ): ตารางประกอบเอง = ไม่ผ่านทุกขนาด — เจ้าของงานสั่งให้ทุก scenario ดึง component Table (เกิน 8 คอลัมน์ต้องยุบ/ตัดก่อน)
    for (const t of composedTables(sc)) { const nc = t.children.filter(x => x.name === 'Column').length; fail(RULES.tables && RULES.tables.neverCompose ? RULES.tables : RULES.insideOnly[0], sc, 'ตารางประกอบเอง ' + nc + ' คอลัมน์ — ต้องใช้ component Table' + (nc > RULES.library.Table.cols ? ' (ยุบเป็น 2 บรรทัด/ตัดให้เหลือ ' + RULES.library.Table.cols + ')' : '')); }
    // กติการายหน้า (หน้า Detail)
    for (const r of RULES.pages) {
      const ph = all.find(x => isInst(x, 'Page header'));
      const title = ph ? prop(ph, 'Title') || '' : '';
      if (!new RegExp(r.detailTitle).test(title)) continue;
      for (const f of r.forbid) if (all.some(x => isInst(x, f) && shown(x))) fail(r, sc, 'หน้า Detail ใช้ ' + f + ' — ต้องใช้ ' + r.use);
    }
    // จอที่ต้องใช้ component เฉพาะ (เช่น นัดหมาย = RepairAppointmentStep)
    for (const r of RULES.screensUse || []) {
      if (!new RegExp(r.screens).test(sc.name) || (r.desktopOnly && mobile)) continue;
      if (!all.some(x => isInst(x, r.component) && shown(x))) fail(r, sc, 'ไม่มี ' + r.component);
      for (const t of r.forbidSectionTitles || []) if (all.some(x => isInst(x, 'Section header') && shown(x) && prop(x, 'Title') === t)) fail(r, sc, 'ยังมีหัวข้อเดิม "' + t + '"');
    }
    // component ที่ห้ามใช้ในจอชุดนี้ (R21: Overhaul เลิกใช้เมนู "…" — PO CF 21 ต.ค. 2569 ขอเป็นไอคอน)
    for (const r of RULES.forbid || []) { if (!new RegExp(r.screens).test(sc.name)) continue; if (all.some(x => isInst(x, r.component) && shown(x))) fail(r, sc, 'ใช้ ' + r.component + ' — ' + r.source); }
    // R22 dashboard: จอแท็บต้องมี Tabs + Metric item (21 ต.ค. 2569)
    const dr = RULES.dashboard;
    if (dr && new RegExp(dr.screens).test(sc.name)) for (const c of dr.mustHave) if (!all.some(x => isInst(x, c) && shown(x))) fail(dr, sc, 'ไม่มี ' + c);
    // R23 แบบที่เจ้าของงานส่งเป็นหลัก: หัวตารางของจอที่กำหนดต้องตรงลำดับ (21 ต.ค. 2569 ค่ำ · S9 วันที่ · รายละเอียด · หมายเหตุ)
    for (const r of RULES.ownerDesign || []) {
      if (!new RegExp(r.screens).test(sc.name) || (r.desktopOnly && mobile)) continue;
      const heads = all.filter(x => isInst(x, 'Table header cell') && shown(x)).map(x => (prop(x, 'Text') || '').trim()).filter(Boolean);
      if (r.minCols && heads.length < r.minCols) continue;   // แบบสำรองเมื่อไลบรารีมีคอลัมน์ไม่พอ (เช่น Table 8 คอลัมน์) ไม่ตรวจ
      const want = r.tableHeaders || [];
      if (want.some((h, i) => heads[i] !== h)) fail(r, sc, 'หัวตาราง [' + heads.join(' · ') + '] ไม่ตรงแบบที่เจ้าของงานส่ง [' + want.join(' · ') + ']');
    }
    // กล่องแสดงข้อมูล
    const d = RULES.displayBox;
    const inInstance = (x) => { for (let p = x.parent; p && p !== sc; p = p.parent) if (p.type === 'INSTANCE') return true; return false; };   // กล่องที่อยู่ใน component เป็นแบบของ component เอง
    for (const b of all.filter(x => x.type === 'FRAME' && x.children && x.children.some(c => isInst(c, d.contains)) && !inInstance(x))) {
      const p = (b.fills || [])[0];
      const bad = [];
      if (b.name !== d.frame) bad.push('ชื่อ ' + b.name);
      if (!p || !p.color || hex(p.color) !== d.fill) bad.push('พื้น ' + (p && p.color ? hex(p.color) : 'ไม่มี'));
      if (b.cornerRadius !== d.radius) bad.push('มุม ' + b.cornerRadius);
      if (b.paddingTop !== d.padding || b.paddingLeft !== d.padding) bad.push('ขอบใน ' + b.paddingTop);
      if (b.itemSpacing !== d.gap) bad.push('ระยะแถว ' + b.itemSpacing);
      if (bad.length) fail(d, sc, 'กล่องแสดงข้อมูลไม่ตรงตัวอย่าง (' + bad.join(' · ') + ')');
    }
    // เส้นคั่นที่มองเห็น
    for (const n of all.filter(x => shown(x) && (x.name === 'Divider' || x.name === 'Content divider'))) fail(RULES.noVisibleDivider, sc, 'ยังเห็นเส้นคั่น ' + (n.parent ? n.parent.name : ''));
  }
  return { fails, pending: [...pending].map(([k, s]) => k + ' (' + s.size + ' จอ)') };
}

module.exports = { check, RULES };
