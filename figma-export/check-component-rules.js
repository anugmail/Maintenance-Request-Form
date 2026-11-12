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

function check(screens, opt) {   // opt.inFile(ชื่อ) = ไฟล์มี component นั้นไหม (กติกา ifInFile: component ของไฟล์งานซ่อม ไม่มีในไฟล์ → ปลั๊กอินใช้แบบสำรอง ไม่นับผิด · 3 พ.ย. 2569)
  opt = opt || {};
  const fails = [], pending = new Map();
  const fail = (r, sc, msg) => fails.push(r.id + ' ' + sc.name + ' — ' + msg);
  /* กติการายจอที่ไม่ตรงจอไหนเลย = กติกาตาย (ชื่อจอเปลี่ยนแล้วกติกาไม่ได้ตาม เช่น รถ → ยานพาหนะ 9 พ.ย. 2569) · นับเฉพาะชุดที่มีจอขึ้นต้นด้วยคำนำหน้าเดียวกัน (MT / · OH2 / …)
     retired = scenario ที่ตัดแล้ว เก็บกติกาไว้ดูประวัติ ไม่ตรวจ (10 พ.ย. 2569) */
  const unmatched = [];
  for (const k of ['screensUse', 'buttonFill', 'displayLabels']) for (const r of RULES[k] || []) {
    const m = /^\^([^ ]+) \//.exec(r.screens || '');
    if (r.retired || !m || !screens.some(sc => sc.name.indexOf(m[1] + ' / ') === 0)) continue;
    if (!screens.some(sc => new RegExp(r.screens).test(sc.name))) unmatched.push(r.id + ' (' + k + ') ' + r.screens);
  }
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
    } else if (RULES.screen.docs && new RegExp(RULES.screen.docs.nameRegex).test(sc.name)) {   // R32 เฟรมหน้าตาไฟล์ที่ส่งออก (PDF A4 · ชีต Excel) ไม่ใช่จอ — ไม่ผูกขนาดอุปกรณ์ (30 ต.ค. 2569)
      const d = RULES.screen.docs, okW = /ไฟล์ PDF/.test(sc.name) ? d.pdf[0] : d.excel[0];
      if (Math.round(sc.width) !== okW) fail(d, sc, 'กว้าง ' + sc.width + ' ต้องเป็น ' + okW);
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
        if ((r.allowInside || []).some(c => isInst(p, c))) { ok = true; break; }
        if (p.type === 'FRAME' && (r.allowInFrame || []).includes(p.name)) { ok = true; break; }   // แบบสำรองที่ลอกตารางของ component งานซ่อมชื่อเดียวกัน เมื่อไฟล์ไม่มี component นั้น (R47 · 3 พ.ย. 2569)   // component ของทีมออกแบบที่ประกอบตารางไว้เอง (ReturnPart · 22 ต.ค. 2569) — ไม่ใช่ปลั๊กอินประกอบ
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
      if (r.retired) continue;
      if (!new RegExp(r.screens).test(sc.name) || (r.desktopOnly && mobile) || (r.mobileOnly && !mobile)) continue;   // mobileOnly (5 พ.ย. 2569 R70 Mobile progress steps)
      if (r.ifInFile && opt.inFile && !opt.inFile(r.component)) continue;
      if (!all.some(x => isInst(x, r.component) && shown(x))) fail(r, sc, 'ไม่มี ' + r.component);
      else if (r.badgeMatch && !all.some(x => isInst(x, r.component) && shown(x) && x.findAll(b => isInst(b, 'Badge outline') && shown(b) && new RegExp(r.badgeMatch).test((prop(b, 'Text') || '').trim())).length))
        fail(r, sc, r.component + ' ไม่มี Badge ข้อความตรง ' + r.badgeMatch);   // R71 ตัวนับ "ตรวจแล้ว x/y" (5 พ.ย. 2569)
      else if (r.tabTexts && !all.some(x => isInst(x, r.component) && shown(x) && x.findAll(b => isInst(b, 'Tab item') && shown(b)).map(b => (prop(b, 'Text') || '').trim()).join('|') === r.tabTexts.join('|')))
        fail(r, sc, r.component + ' แท็บไม่ตรง ' + r.tabTexts.join(' · '));   // R88 แท็บของหน้าอนุมัติ (10 พ.ย. 2569)
      else if (r.buttonText && !all.some(x => isInst(x, r.component) && shown(x) && (prop(x, 'Text') || '').trim() === r.buttonText && new RegExp(r.state).test((x.variantProperties || {}).State || '')))
        fail(r, sc, r.component + ' "' + r.buttonText + '" ต้อง State ตรง ' + r.state);   // R93 ปุ่มเพิ่มยานพาหนะของหน้าไตรมาส Disabled เมื่อทุกคันปิดงาน (11 พ.ย. 2569)
      else if (r.hasTexts) { const vals = new Set(all.filter(x => x.type === 'INSTANCE' && shown(x)).flatMap(x => Object.values(x.componentProperties || {}).filter(v => v.type === 'TEXT').map(v => String(v.value).trim())));
        const miss = r.hasTexts.filter(t => !vals.has(t)); if (miss.length) fail(r, sc, 'ไม่มีข้อความ ' + miss.join(' · ')); }   // R93 รายการภาค/เขตในแผงตัวกรอง (11 พ.ย. 2569)
      for (const t of r.forbidSectionTitles || []) if (all.some(x => isInst(x, 'Section header') && shown(x) && prop(x, 'Title') === t)) fail(r, sc, 'ยังมีหัวข้อเดิม "' + t + '"');
      if (r.sectionOrder) {   // R107 (12 พ.ย. 2569) ลำดับหัวข้อ Section label ของหน้า — นับเฉพาะชื่อที่ขึ้นต้นตามรายการ (หัวการ์ดอื่นไม่นับ) · ขาด/เกิน/สลับ = ไม่ผ่าน
        const got = all.filter(x => isInst(x, 'Section label') && shown(x)).map(x => (prop(x, 'Title') || '').trim()).filter(t => r.sectionOrder.some(w => t.indexOf(w) === 0));
        if (got.length !== r.sectionOrder.length || r.sectionOrder.some((w, k) => got[k].indexOf(w) !== 0)) fail(r, sc, 'ลำดับหัวข้อ [' + got.join(' · ') + '] ไม่ตรง [' + r.sectionOrder.join(' · ') + ']');
      }
    }
    // R89 ปุ่มสีตามหน้าจริง (10 พ.ย. 2569 S13 ปุ่มรับทราบสีเขียวแบบปุ่ม "ตรวจแล้ว" หน้า 5.14 - 5.15 UI Release#2): ปุ่มข้อความ text ที่กดได้ ต้องพื้นสี fill · forbidText = ข้อความปุ่มที่ห้ามมีในจอชุดนี้
    for (const r of RULES.buttonFill || []) {
      if (!new RegExp(r.screens).test(sc.name)) continue;
      const bs = all.filter(x => isInst(x, r.component) && shown(x));
      const hex = (f) => { const c = f && f.color; return c ? '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase() : ''; };
      for (const b of bs.filter(x => (prop(x, 'Text') || '').trim() === r.text && !/Disabled/.test((x.variantProperties || {}).State || '')))
        if (hex((b.fills || [])[0]) !== r.fill.toUpperCase()) fail(r, sc, 'ปุ่ม "' + r.text + '" ต้องพื้น ' + r.fill + ' (ได้ ' + (hex((b.fills || [])[0]) || 'ค่าตั้งต้นของ component') + ')');
      for (const t of r.forbidText || []) if (all.some(x => /button/i.test(compName(x) || x.name) && shown(x) && (prop(x, 'Text') || '').trim() === t)) fail(r, sc, 'มีปุ่ม "' + t + '" — ' + r.source);
      if (r.requireText && !bs.some(x => (prop(x, 'Text') || '').trim() === r.text) && (!r.requireUnless || !new RegExp(r.requireUnless).test(sc.name))) fail(r, sc, 'ไม่มีปุ่ม "' + r.text + '"');
    }
    // R76 กล่องข้อมูลแยกตามประเภทงาน (5 พ.ย. 2569): ป้ายของ _Content item base ชุดแรกในจอต้องเรียงตาม labels · ป้ายใน forbidLabels (ไม่มีที่มาในข้อมูลของงานนั้น) ห้ามมีในจอ
    for (const r of RULES.displayLabels || []) {
      if (!new RegExp(r.screens).test(sc.name)) continue;
      const got = all.filter(x => isInst(x, '_Content item base') && shown(x)).map(x => (prop(x, 'Label') || '').trim()).filter(l => l && l !== 'Label');   // ช่องว่างท้ายแถว (ป้ายตั้งต้น "Label" · ปิดด้วย property Item n) ไม่นับ
      const want = r.labels || [];
      if (want.some((l, i) => got[i] !== l)) fail(r, sc, 'ป้ายกล่องข้อมูล [' + got.slice(0, want.length).join(' · ') + '] ไม่ตรง [' + want.join(' · ') + ']');
      for (const l of r.forbidLabels || []) if (got.indexOf(l) >= 0) fail(r, sc, 'มีช่อง "' + l + '" ที่ข้อมูลของงานนี้ไม่มี');
    }
    // component ที่ห้ามใช้ในจอชุดนี้ (R21: Overhaul เลิกใช้เมนู "…" — PO CF 21 ต.ค. 2569 ขอเป็นไอคอน)
    const inside = (x, names) => { for (let p = x.parent; p && p !== sc; p = p.parent) if (p.type === 'INSTANCE' && names.some(nm => isInst(p, nm))) return true; return false; };   // allowInside = ยกเว้นตัวที่อยู่ใน component ที่กำหนด (R30 ปุ่มตัวกรองใน Table header) · allowText = ยกเว้นปุ่มที่ข้อความตรง (R30 ปุ่มส่งออก)
    for (const r of RULES.forbid || []) { if (!new RegExp(r.screens).test(sc.name)) continue; if (all.some(x => isInst(x, r.component) && shown(x) && !(r.allowInside && inside(x, r.allowInside)) && !(r.allowText && r.allowText.indexOf((prop(x, 'Text') || '').trim()) >= 0))) fail(r, sc, 'ใช้ ' + r.component + ' — ' + r.source); }
    // R80 คำบนจอ (6 พ.ย. 2569): ข้อความที่มองเห็น (TEXT + property ข้อความของ instance) ห้ามมีคำต้องห้าม ยกเว้นคำใน allow (ข้อมูลจาก API)
    for (const r of RULES.wording || []) {
      if (!new RegExp(r.screens).test(sc.name)) continue;
      const strip = (s) => (r.allow || []).reduce((t, w) => t.split(w).join(''), s || '');
      const owner = (x) => { for (let p = x.parent; p && p !== sc; p = p.parent) if (p.type === 'INSTANCE') return ' (ใน ' + compName(p) + ')'; return ''; };   // บอก component ที่ข้อความอยู่ ⇒ รู้ว่าเป็นค่าตั้งต้นของ component หรือปลั๊กอินใส่เอง
      const texts = all.filter(x => shown(x) && x.type === 'TEXT').map(x => [x.characters, owner(x)])
        .concat(...all.filter(x => shown(x) && x.type === 'INSTANCE').map(x => Object.values(x.componentProperties || {}).filter(v => v.type === 'TEXT').map(v => [v.value, ' (ใน ' + compName(x) + ')'])));
      const bad = [...new Set(texts.filter(([t]) => strip(t).indexOf(r.word) >= 0).map(([t, w]) => t + '"' + w))];
      if (bad.length) fail(r, sc, 'ยังมีคำว่า "' + r.word + '" ต้องใช้ "' + r.use + '": ' + bad.slice(0, 3).map(t => '"' + t).join(' · '));
    }
    // R106 ชิ้นวาดเอง (12 พ.ย. 2569 เจ้าของงาน "ให้เฉพาะ dashboard ที่ทำสิ่งนี้ได้ หน้าอื่นๆ ยังคงต้องตาม component เหมือนเดิม"): ชิ้นที่ไม่ใช่ instance/กรอบ นอก instance
    // ยอมเฉพาะในกรอบชื่อ containerRegex บนจอ allowScreens (แดชบอร์ด S4 S24) · จออื่นในชุด screens = ไม่ผ่าน · mustHave = จอแดชบอร์ดต้องมีกรอบนั้น
    const ds = RULES.drawnShapes;
    if (ds && new RegExp(ds.screens).test(sc.name)) {
      const okScr = new RegExp(ds.allowScreens).test(sc.name), box = new RegExp(ds.containerRegex);
      const inBox = (x) => { for (let p = x.parent; p && p !== sc; p = p.parent) if (p.type === 'FRAME' && box.test(p.name)) return true; return false; };
      const bad = all.filter(x => x.type !== 'INSTANCE' && x.type !== 'FRAME' && !inInst(x) && !(okScr && inBox(x)));
      if (bad.length) fail(ds, sc, 'ชิ้นวาดเอง ' + bad.length + ' ชิ้น (' + [...new Set(bad.map(x => x.type + ' "' + x.name + '"'))].slice(0, 3).join(' · ') + ') ' + (okScr ? 'นอกกรอบ VMS+ ของแดชบอร์ด' : '— จอนี้ไม่ใช่แดชบอร์ด S4 S24 ต้องเป็น instance ของไลบรารีเท่านั้น'));
      for (const m of ds.mustHave || []) if (!(m.desktopOnly && mobile) && new RegExp(m.screens).test(sc.name) && !all.some(x => x.type === 'FRAME' && x.name.indexOf(m.frame) === 0)) fail(ds, sc, 'ไม่มีกรอบ ' + m.frame + '…');
    }
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
  return { fails, unmatched, pending: [...pending].map(([k, s]) => k + ' (' + s.size + ' จอ)') };
}

/* R80 ตรวจซอร์สปลั๊กอิน (6 พ.ย. 2569): ข้อความใน string literal ห้ามมีคำต้องห้าม ยกเว้น allow — ข้ามคอมเมนต์และ regex literal (คำพูดเจ้าของงานในคอมเมนต์คงตามจริง)
   คืน [[บรรทัด, ข้อความ]] ที่ผิด */
function stringLiterals(src) {
  const out = []; let i = 0, prev = '';
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { const j = src.indexOf('\n', i); i = j < 0 ? n : j; continue; }
    if (c === '/' && src[i + 1] === '*') { const j = src.indexOf('*/', i + 2); i = j < 0 ? n : j + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      let j = i + 1, start = i + 1;
      while (j < n) {
        const d = src[j];
        if (d === '\\') { j += 2; continue; }
        if (c === '`' && d === '$' && src[j + 1] === '{') { out.push([start, j]); let k = j + 2, lvl = 1; while (k < n && lvl) { if (src[k] === '{') lvl++; else if (src[k] === '}') lvl--; k++; } start = k; j = k; continue; }
        if (d === c || (d === '\n' && c !== '`')) break;
        j++;
      }
      out.push([start, j]); i = j + 1; prev = c; continue;
    }
    if (c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.indexOf(prev) >= 0 || /return\s*$/.test(src.slice(Math.max(0, i - 8), i)))) {
      let j = i + 1, cls = false;
      while (j < n && src[j] !== '\n') { const d = src[j]; if (d === '\\') { j += 2; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; j++; }
      i = j + 1; prev = '/'; continue;
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return out.map(([a, b]) => [src.slice(0, a).split('\n').length, src.slice(a, b)]);
}
function checkSourceWording(src, rule) {
  const strip = (s) => (rule.allow || []).reduce((t, w) => t.split(w).join(''), s);
  return stringLiterals(src).filter(([, s]) => strip(s).indexOf(rule.word) >= 0);
}

module.exports = { check, RULES, checkSourceWording };
