#!/usr/bin/env node
/* ทดสอบ maintainance-feature-plugin/code.js บน mock Plugin API ชุดเดียวกับปลั๊กอินอื่น (test-overhaul2-plugin.js)
   รัน:  node figma-export/maintainance-feature-plugin/build.js && node figma-export/test-maintainance-feature-plugin.js
         MODE=build-pick PICK=0,2 · DEVICES=desktop
   ตรวจเพิ่มจากตัวกลาง: ระยะ case ในหน้าเดียวกัน 200 · คนละหน้า 500 · เฟรม toast มีแค่ Notification · รหัสจอใน feature.js ตรงไฟล์ 32 */
const path = require('path'), fs = require('fs');
process.env.CODE = process.env.CODE || path.join(__dirname, 'maintainance-feature-plugin', 'code.js');
process.env.PREFIX = 'MF';
process.env.FIRST = process.env.FIRST || 'ขั้น 1 ·';   // 17 พ.ย. 2569 Happy flow มาก่อนชุดทุกเคส ⇒ จอแรกคือขั้น 1 ของ happy flow
process.env.LOCAL = process.env.LOCAL || 'RepairFeedback,ReturnPart,PartRequestStepPanel,PartsInventoryPanel,RequestedPartsPanel,Spare Part Card Item,Selecte Spare Part,IncidentPhotoGallery,VehicleAndReporterInfo,SummaryRequestedParts,Device Type,Component 1';

/* หลาย Feature (17 พ.ย. 2569): FEATURE=<id> (plan · trip · job · close · track · ไม่ใส่ = plan) — อ่านค่าของ Feature จาก features/<id>.js
   รหัสจอเดิมในไฟล์ Feature ต้องตรงกับที่เอกสารของ Feature ระบุว่าสร้าง (หัวข้อ 3 คอลัมน์ "จอที่สร้าง") */
const FEAT = process.env.FEATURE || 'plan';
const FSRC = fs.readFileSync(path.join(__dirname, 'maintainance-feature-plugin', 'features', FEAT + '.js'), 'utf8');
const FPAGE = (FSRC.match(/page: \[\s*'([^']+)'/) || [])[1] || 'Maintainance Feature';
const FPAGE_USE = () => process.env.FOREIGN ? FPAGE + ' (พระผู้สร้าง)' : FPAGE;
const FDIR = (FSRC.match(/fjDir: '([^']+)'/) || [])[1] || 'flow-maintainance-feature-' + FEAT;
{
  const docName = (FSRC.match(/doc: '([^']+)'/) || [])[1];
  if (!docName) { console.log('⚠ features/' + FEAT + '.js ไม่มี doc'); process.exitCode = 1; }
  else {
    const doc = fs.readFileSync(path.join(__dirname, '..', 'Diagram', '01-บำรุงรักษาตามวาระ', docName), 'utf8');
    /* รหัสชั้นเดียว (A.3 · ช่วง A.3–A.9) และรหัสซ้อนของเส้นทางย่อย (V.4.1 · ช่วง V.4.1–V.4.3) — 17 พ.ย. 2569 รองรับรหัสซ้อน (Feature งานรายคัน) */
    const exp = (t) => { const r = []; t.replace(/\b([A-Z])\.((?:\d+\.)*)(\d+)(?:[–-](?:\1\.\2)?(\d+))?/g, (m, a, mid, x, y) => { for (let i = +x; i <= (y ? +y : +x); i++) r.push(a + '.' + mid + i); }); return r; };
    const used = new Set([...FSRC.matchAll(/\['([A-Z]\.\d+(?:\.\d+)*)', '/g)].map(m => m[1]));
    const sec = (doc.split('## 3.')[1] || '').split('## 4.')[0], want = new Set();
    const rowsT = sec.split('\n').filter(l => /^\| /.test(l)), hdr = (rowsT[0] || '').split('|').map(s => s.trim());
    const cols = hdr.map((h, i) => /^จอที่สร้าง/.test(h) ? i : -1).filter(i => i > 0);   // ทุกคอลัมน์ที่หัวขึ้นต้น "จอที่สร้าง"
    rowsT.slice(1).filter(l => /^\| [^-|]/.test(l)).forEach(l => { const c = l.split('|'); (cols.length ? cols : [3]).forEach(i => exp(c[i] || '').forEach(x => want.add(x))); });
    const miss = [...want].filter(c => !used.has(c)), extra = [...used].filter(c => !want.has(c));
    if (!want.size || miss.length || extra.length) { console.log('⚠ features/' + FEAT + '.js ไม่ตรง ' + docName + ' — ขาด ' + (miss.join(' ') || '-') + ' · เกิน ' + (extra.join(' ') || '-') + (want.size ? '' : ' · เอกสารไม่มีตารางหัวข้อ 3')); process.exitCode = 1; }
    else console.log('Feature ' + FEAT + ': รหัสจอตรง ' + docName + ' ครบ ' + used.size + ' จอ ✓');
  }
}

/* mock ตัวกลางไม่มี get/setPluginData — ปลั๊กอินนี้ใช้ติดป้ายหัวข้อเพื่อรันทับ (13 พ.ย. 2569) ⇒ เติมให้เฉพาะเทสนี้ (ไม่แก้ตัวกลาง) */
{
  const store = new WeakMap();
  for (const [k, fn] of Object.entries({
    setPluginData(key, v) { if (!store.has(this)) store.set(this, {}); store.get(this)[key] = String(v); },
    getPluginData(key) { return (store.get(this) || {})[key] || ''; } })) {
    if (!Object.prototype[k]) Object.defineProperty(Object.prototype, k, { value: fn, writable: true, configurable: true, enumerable: false });
  }
}
/* รันซ้ำ (PRE_MODE=build แล้ว MODE=build หรือ build-pick): บนหน้าต้องมีชุดเดียว ไม่ซ้อน — WANT_FRAMES = จำนวนจอที่ควรมี */
process.on('beforeExit', () => {
  if (global.__mfDup || !mockFigma || !process.env.WANT_FRAMES) return; global.__mfDup = true;
  const page = mockFigma.root.children.find(p => p.name === FPAGE_USE());
  const fr = page ? page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('MF / ') === 0) : [];
  const names = fr.map(n => n.name), dup = names.filter((n, i) => names.indexOf(n) !== i);
  const titles = page ? page.children.filter(n => / · Feature /.test(n.name)).length : 0;
  /* 16 พ.ย. 2569 ผู้ใช้สั่งไม่สร้างทับ ⇒ รันซ้ำต้องได้ชุดใหม่ต่อท้าย ของเดิมอยู่ครบ · WANT_TITLES = จำนวน Title ที่ควรมี (1 ต่อการกด 1 ครั้ง) */
  const wantT = +process.env.WANT_TITLES || 1;
  /* มีหลายชุดบนหน้า ⇒ ชื่อจอซ้ำกัน ตัวกลางจับคู่ mobile กับ desktop ชุดแรกที่ชื่อตรง (ผิดชุด) จึงเตือน R19 ⇒ ตรวจคู่แบบรู้ชุด: ต้องมี desktop ชื่อเดียวกัน x เดียวกัน อยู่เหนือ */
  if (wantT > 1) {
    const mobs = fr.filter(n => / · mobile$/.test(n.name)), desks = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('MF / ') === 0 && !/ · mobile$/.test(n.name));
    const lone = mobs.filter(m => !desks.some(d => d.name === m.name.replace(/ · mobile$/, '') && d.x === m.x && d.y < m.y));
    console.log('จับคู่ desktop/mobile แบบรู้ชุด: ' + (mobs.length - lone.length) + '/' + mobs.length + (lone.length ? ' ⚠' : ' ✓ (คำเตือน R19 ของตัวกลางในเคสนี้มาจากชื่อจอซ้ำข้ามชุด)'));
    if (lone.length) process.exitCode = 1;
  }
  const ok = fr.length === +process.env.WANT_FRAMES && titles === wantT;
  console.log('ไม่สร้างทับ: จอบนหน้า ' + fr.length + '/' + process.env.WANT_FRAMES + ' · Title ' + titles + '/' + wantT + ' · ชื่อซ้ำ (จากชุดเก่า) ' + dup.length + (ok ? ' ✓' : ' ⚠'));
  if (!ok) process.exitCode = 1;
});
/* ตรวจระยะหลังตัวกลางทดสอบเสร็จ — ตัวกลางเก็บ figma (mock) ไว้ในตัว ⇒ ดักจาก vm.runInNewContext ตอนโหลด code.js */
const vm = require('vm'), run0 = vm.runInNewContext;
let mockFigma = null;
const FJ = { shots: [], files: [], done: null };   // ส่งจอไป FigJam (17 พ.ย. 2569): ดักข้อความที่ปลั๊กอินส่งให้ UI
vm.runInNewContext = function (code, ctx) {
  if (ctx && ctx.figma && !mockFigma) {
    mockFigma = ctx.figma; const pm = ctx.figma.ui.postMessage;
    /* FOREIGN=1: มี Page ชื่อเดียวกับ Feature ที่มีของคนอื่นอยู่ก่อน ⇒ ปลั๊กอินต้องไปใช้ "<ชื่อ> (พระผู้สร้าง)" ไม่วางปน (17 พ.ย. 2569) */
    if (process.env.FOREIGN) { const fp = ctx.figma.createPage(); fp.name = FPAGE; const r = ctx.figma.createFrame(); r.name = 'ของทีมอื่น'; fp.appendChild(r); global.__foreign = fp; }
    /* FAIL_PAGE=<ชื่อ Page>: จำลอง Feature นั้นพังกลางทาง ⇒ Feature ที่เหลือต้องยังถูกสร้าง */
    if (process.env.FAIL_PAGE) { const sc = ctx.figma.setCurrentPageAsync; ctx.figma.setCurrentPageAsync = async (pg) => { if (pg && pg.name === process.env.FAIL_PAGE) throw new Error('จำลองพัง'); return sc ? sc.call(ctx.figma, pg) : undefined; }; }
    ctx.figma.ui.postMessage = (m) => { if (m && m.type === 'shot') FJ.shots.push(m); if (m && m.type === 'fj-file') FJ.files.push(m); if (m && m.type === 'fj-done') FJ.done = m; if (m && m.type === 'fj-all-done') FJ.allDone = m; if (m && m.type === 'build-all-done') FJ.buildDone = m; return pm(m); };
    /* FJ_TARGET=<ลิงก์บอร์ด>: เลือกบอร์ดปลายทางก่อนกดปุ่มใดๆ ⇒ สเปกต้องมี target */
    /* FEATURE: ทุกข้อความจากหน้าต่างแนบ feature (แบบที่ ui.html ส่ง) */
    /* MODE=export-figjam-all + PRE_FEATURES=plan,trip,…: ปุ่มสร้าง (PRE_MODE) กดครั้งละ Feature ตามรายการ แล้วกด "ส่งทุก Feature" */
    const PRE_F = process.env.MODE === 'export-figjam-all' ? (process.env.PRE_FEATURES || FEAT).split(',') : null;
    { const d = Object.getOwnPropertyDescriptor(ctx.figma.ui, 'onmessage'); Object.defineProperty(ctx.figma.ui, 'onmessage', { configurable: true, set(f) { d.set.call(ctx.figma.ui, async (m) => {
      if (PRE_F && m && /^build/.test(m.type)) { for (const id of PRE_F) await f(Object.assign({}, m, { feature: id })); return; }
      if (process.env.PICKS && m && typeof m === 'object' && /^(build|export-figjam$)/.test(m.type || '')) m = Object.assign({}, m, { picks: Object.fromEntries(process.env.PICKS.split(';').map(x => [x.split(':')[0], x.split(':')[1].split(',')])) });   // PICKS=plan:1;close:0 เลือก journey ราย Feature (17 พ.ย. 2569)
      if (process.env.FEATURES && m && typeof m === 'object' && /^(build|export-figjam$)/.test(m.type || '')) m = Object.assign({}, m, { features: process.env.FEATURES.split(',') });   // FEATURES=close,track: ติ๊กหลาย Feature (17 พ.ย. 2569)
      return f(m && typeof m === 'object' && !m.feature ? Object.assign({ feature: FEAT }, m) : m); }); } }); }
    /* FEATURES: ทุก Feature ที่ติ๊กต้องมีหน้าของตัวเองและมีจอ */
    if (process.env.FEATURES) process.on('beforeExit', () => { if (global.__mfMulti) return; global.__mfMulti = true;
      const want = process.env.FEATURES.split(','), got = want.map(id => { const s = fs.readFileSync(path.join(__dirname, 'maintainance-feature-plugin', 'features', id + '.js'), 'utf8'); const pg = (s.match(/page: \[\s*'([^']+)'/) || [])[1]; const page = mockFigma.root.children.find(p => p.name === pg); return id + ' ' + (page ? page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('MF / ') === 0).length : 0); });
      const ok = got.every(g => +g.split(' ')[1] > 0); console.log('ติ๊กหลาย Feature: ' + got.join(' · ') + ' เฟรม' + (ok ? ' ✓' : ' ⚠')); if (!ok) process.exitCode = 1; });
    if (process.env.FJ_TARGET) { const d = Object.getOwnPropertyDescriptor(ctx.figma.ui, 'onmessage'); Object.defineProperty(ctx.figma.ui, 'onmessage', { configurable: true, set(f) { d.set.call(ctx.figma.ui, async (m) => { if (!FJ.tgt) { FJ.tgt = true; await f({ type: 'fj-target-add', url: process.env.FJ_TARGET }); } return f(m); }); } }); }
  }
  return run0.apply(this, arguments);
};
/* MODE=export-figjam (PRE_MODE=build ก่อน): ภาพครบทุกเฟรมชุดล่าสุด ชื่อไฟล์ไม่ซ้ำ · สเปกอ้างภาพที่ส่งจริง · คอลัมน์เรียงตามรหัสจอ · เขียนสเปกลง out/test-mf/ ให้ test-figjam-plugin.js (SPEC=test-mf/…) */
process.on('beforeExit', () => {
  if (global.__mfFj || !mockFigma || process.env.MODE !== 'export-figjam') return; global.__mfFj = true;
  const bad = [];
  const page = mockFigma.root.children.find(p => p.name === FPAGE_USE());
  const frames = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('MF / ') === 0);
  const pickJ = (process.env.PICK || '').split(',').filter(Boolean).map(i => String(+i + 1));   // PICK = journey ที่ติ๊ก (0 เริ่ม) ⇒ นับเฉพาะจอของ journey นั้น (ทุกเคส + Happy flow)
  const keys = new Set(frames.map(n => n.name.match(/^MF \/ (\S+) /)[1]).filter(c => !pickJ.length || pickJ.includes(c.replace('H', '').split('.')[0])).map(c => c));
  frames.forEach(n => { const c = n.name.match(/^MF \/ (\S+) /)[1]; if (/ · mobile$/.test(n.name) && keys.has(c)) keys.add(c + '-m'); });
  if (process.env.DEVICES === 'mobile') [...keys].forEach(k => { if (!/-m$/.test(k)) keys.delete(k); });   // ส่งเฉพาะอุปกรณ์ที่เลือก
  if (process.env.DEVICES === 'desktop') [...keys].forEach(k => { if (/-m$/.test(k)) keys.delete(k); });
  const files = FJ.shots.map(m => m.file);
  if (new Set(files).size !== files.length) bad.push('ชื่อไฟล์ภาพซ้ำ');
  if (FJ.shots.length !== keys.size) bad.push('ส่งภาพ ' + FJ.shots.length + ' ไฟล์ แต่จอบนหน้า ' + keys.size + ' จอ');
  if (FJ.shots.some(m => m.dir !== FDIR)) bad.push('โฟลเดอร์ภาพผิด (ต้อง ' + FDIR + ')');
  const boards = FJ.files.filter(f => f.board);
  if (!FJ.done) bad.push('ไม่มีข้อความ fj-done');
  if (!FJ.files.some(f => /manifest\.json$/.test(f.path))) bad.push('ไม่ได้ส่ง manifest.json');
  const dir = require('path').join(__dirname, 'out', 'test-mf'); require('fs').mkdirSync(dir, { recursive: true });
  let nImg = 0;
  for (const b of boards) {
    const spec = JSON.parse(b.text);
    if (spec.anchor !== 'below' || !spec.title || !spec.sections.length) bad.push('สเปกไม่ครบ: ' + b.path);
    if (process.env.FJ_TARGET && !(spec.target && process.env.FJ_TARGET.indexOf(spec.target.url) === 0)) bad.push('สเปกไม่มีบอร์ดปลายทางที่เลือก: ' + b.path + ' ' + JSON.stringify(spec.target));
    for (const sec of spec.sections) {
      const codes = sec.cols.map(c => c.label.split(' · ')[0]);
      const key = (c) => c.replace('H', '').split('.').map(x => x.padStart(3, '0')).join('.');
      if (codes.some((c, i) => i && key(codes[i - 1]) >= key(c))) bad.push('คอลัมน์ไม่เรียงตามรหัส: ' + sec.name);
      sec.cols.forEach(c => c.images.forEach(im => { nImg++; if (!files.includes(im.src.split('/').pop())) bad.push('สเปกอ้างภาพที่ไม่ได้ส่ง: ' + im.src); if (im.w > 4000 || im.h > 4000) bad.push('ภาพเกิน 4000: ' + im.src); }));
    }
    require('fs').writeFileSync(require('path').join(dir, b.path), b.text);
  }
  if (nImg !== FJ.shots.length) bad.push('ภาพในสเปก ' + nImg + ' ไม่เท่าภาพที่ส่ง ' + FJ.shots.length);
  bad.slice(0, 15).forEach(b => console.log('⚠ FigJam ' + b));
  console.log('ส่งไป FigJam: ภาพ ' + FJ.shots.length + ' · บอร์ด ' + boards.length + ' ไฟล์ (' + boards.map(b => b.path).join(', ') + ') · ภาพในสเปก ' + nImg + (bad.length ? ' ⚠' : ' ✓'));
  if (bad.length) process.exitCode = 1;
});
/* MODE=export-figjam-all (17 พ.ย. 2569): ส่งทุก Feature รอบเดียว — ทุก Feature ใน PRE_FEATURES ต้องได้ภาพในโฟลเดอร์ของตัวเอง + บอร์ดของตัวเอง · ชื่อไฟล์บอร์ดไม่ชนกัน · สเปกอ้างภาพที่ส่งจริง */
process.on('beforeExit', () => {
  if (global.__mfFjAll || !mockFigma || process.env.MODE !== 'export-figjam-all') return; global.__mfFjAll = true;
  const bad = [], ids = (process.env.PRE_FEATURES || FEAT).split(',');
  const dirs = {}; FJ.shots.forEach(m => { dirs[m.dir] = (dirs[m.dir] || 0) + 1; });
  const boards = FJ.files.filter(f => f.board), names = boards.map(b => b.path);
  if (new Set(names).size !== names.length) bad.push('ชื่อไฟล์บอร์ดซ้ำ');
  const sent = new Set(FJ.shots.map(m => 'figjam/' + m.dir + '/' + m.file));
  for (const id of ids) {
    const src = fs.readFileSync(path.join(__dirname, 'maintainance-feature-plugin', 'features', id + '.js'), 'utf8');
    const dir = (src.match(/fjDir: '([^']+)'/) || [])[1] || 'flow-maintainance-feature-' + id, bp = (src.match(/fjBoard: '([^']+)'/) || [])[1] || 'board-maintainance-feature-' + id;
    if (!dirs[dir]) bad.push(id + ': ไม่มีภาพใน ' + dir);
    const mine = names.filter(n => n.indexOf(bp + '-') === 0 && /^-(happy|\d+)\.json$/.test(n.slice(bp.length)));
    if (!mine.length) bad.push(id + ': ไม่มีบอร์ด ' + bp + '-*.json');
    console.log('  ' + id + ': ภาพ ' + (dirs[dir] || 0) + ' (' + dir + ') · บอร์ด ' + mine.length);
  }
  let nImg = 0;
  boards.forEach(b => JSON.parse(b.text).sections.forEach(s => s.cols.forEach(c => c.images.forEach(im => { nImg++; if (!sent.has(im.src)) bad.push('สเปกอ้างภาพที่ไม่ได้ส่ง ' + im.src); }))));
  if (!FJ.allDone) bad.push('ไม่มีข้อความ fj-all-done');
  bad.slice(0, 10).forEach(b => console.log('⚠ FigJam ทุก Feature ' + b));
  console.log('ส่งทุก Feature: ' + ids.length + ' Feature · ภาพ ' + FJ.shots.length + ' · บอร์ด ' + boards.length + ' · ภาพในสเปก ' + nImg + (bad.length ? ' ⚠' : ' ✓'));
  if (bad.length) process.exitCode = 1;
});
process.on('beforeExit', () => {
  if (global.__mfExtra || !mockFigma) return; global.__mfExtra = true;
  if (process.env.FOREIGN) { const f = global.__foreign, ok = f.children.length === 1 && f.children[0].name === 'ของทีมอื่น' && mockFigma.root.children.some(p => p.name === FPAGE + ' (พระผู้สร้าง)');
    console.log('Page ชื่อชนกับของคนอื่น: ของเดิม ' + f.children.length + ' ชิ้น ไม่ถูกแตะ · ใช้ Page "' + FPAGE + ' (พระผู้สร้าง)"' + (ok ? ' ✓' : ' ⚠')); if (!ok) process.exitCode = 1; }
  if (process.env.FAIL_PAGE) { const d = FJ.buildDone || { ok: [], fail: [] }, ok = d.fail.length === 1 && d.ok.length === (process.env.FEATURES || '').split(',').length - 1;
    console.log('Feature พังกลางทาง: ทำได้ ' + d.ok.length + ' · พัง ' + d.fail.join(',') + (ok ? ' ✓ ไปต่อ Feature ถัดไป' : ' ⚠')); if (!ok) process.exitCode = 1; }
});
process.on('beforeExit', () => {
  if (global.__mfChecked || !mockFigma) return; global.__mfChecked = true;
  const page = mockFigma.root.children.find(p => p.name === FPAGE_USE());
  if (!page) { console.log('⚠ ไม่พบหน้า ' + FPAGE); process.exitCode = 1; return; }
  const fr = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('MF / ') === 0 && !/ · mobile$/.test(n.name));
  const bad = [];
  const rows = {};
  fr.forEach(n => { (rows[Math.round(n.y)] = rows[Math.round(n.y)] || []).push(n); });
  for (const row of Object.values(rows)) {
    row.sort((a, b) => a.x - b.x);
    for (let i = 1; i < row.length; i++) {
      const pg = (n) => n.name.split(' · ')[1].split(' — ')[0], gap = Math.round(row[i].x - (row[i - 1].x + 1440));
      const want = pg(row[i]) === pg(row[i - 1]) ? 200 : 500;
      if (gap !== want) bad.push(row[i].name + ' ห่าง ' + gap + ' ต้อง ' + want);
    }
  }
  /* ชิ้นหลุดนอกจอ (ผู้ใช้เจอ Section / Text input / Input dropdown ซ้ำๆ บนหน้า 13 พ.ย. 2569) — ชั้นบนสุดต้องมีแค่จอและป้ายของปลั๊กอิน */
  const stray = page.children.filter(n => n.name.indexOf('MF / ') !== 0 && n.name.indexOf('MF · ') !== 0);
  if (stray.length) bad.push('ชิ้นหลุดนอกจอบนหน้า ' + stray.length + ' ชิ้น: ' + stray.slice(0, 5).map(n => n.type + ' ' + n.name).join(' · '));
  else console.log('ไม่มีชิ้นหลุดนอกจอบนหน้า ✓');
  /* ตัว Z: ทุกแถบ journey เริ่ม x เดียวกัน · ทุกชิ้นอยู่ในขอบพื้นที่วางงานของ Figma ±65,500 */
  const jb = page.children.filter(n => /^MF · \d+ /.test(n.name) && !/^MF · \d+\.\d/.test(n.name));
  if (new Set(jb.map(n => Math.round(n.x))).size > 1) bad.push('แถบ journey เริ่มคนละ x: ' + jb.map(n => Math.round(n.x)).join(','));
  const out = page.children.filter(n => n.x < -65500 || n.x + n.width > 65500 || n.y < -65500 || n.y + n.height > 65500);
  if (out.length) bad.push('ชิ้นเกินขอบพื้นที่วางงาน ' + out.length + ' ชิ้น: ' + out[0].name);
  console.log('ตัว Z: แถบ journey ' + jb.length + ' แถบ เริ่ม x เดียวกัน · อยู่ในขอบ ±65,500' + (out.length ? ' ⚠' : ' ✓'));
  /* จอที่มีชั้นทับต้องสูงไม่เกินขนาดจอ (ผู้ใช้สั่ง 16 พ.ย. 2569) */
  const ov = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('MF / ') === 0 && (n.children || []).some(c => c.layoutPositioning === 'ABSOLUTE' && c.type === 'INSTANCE' && /^(Background overlay|Modal)$/.test(c.name)));
  const tall = ov.filter(n => n.height > (n.width <= 500 ? 874 : 1024));
  tall.slice(0, 5).forEach(n => bad.push('จอมีชั้นทับสูงเกิน ' + Math.round(n.height) + ': ' + n.name));
  console.log('จอที่มีชั้นทับ ' + ov.length + ' จอ · สูงไม่เกิน 1024 / 874' + (tall.length ? ' ⚠ เกิน ' + tall.length : ' ✓'));
  /* Happy flow (17 พ.ย. 2569): ขั้นในแต่ละ journey เรียง 1..n ซ้ายไปขวา แถวเดียว · WANT_HAPPY = จำนวนเฟรม desktop ที่ควรมี */
  const hp = page.children.filter(n => n.type === 'FRAME' && /^MF \/ H\d+\.\d+ /.test(n.name) && !/ · mobile$/.test(n.name));
  const byJ = {}; hp.forEach(n => { const m = n.name.match(/^MF \/ H(\d+)\.(\d+) .* — ขั้น (\d+) · /); if (!m) { bad.push('ชื่อเฟรม happy flow ผิดรูป: ' + n.name); return; } (byJ[m[1]] = byJ[m[1]] || []).push([+m[2], +m[3], n.x, n.y]); });
  for (const [j, a] of Object.entries(byJ)) { a.sort((p, q) => p[2] - q[2]); a.forEach((v, i) => { if (v[0] !== i + 1 || v[1] !== i + 1) bad.push('happy flow ' + j + ' ขั้นไม่เรียง: ' + JSON.stringify(a.map(z => z[1]))); }); if (new Set(a.map(v => v[3])).size > 1) bad.push('happy flow ' + j + ' ไม่อยู่แถวเดียว'); }
  if (process.env.WANT_HAPPY && hp.length !== +process.env.WANT_HAPPY) bad.push('happy flow desktop ' + hp.length + ' เฟรม ต้อง ' + process.env.WANT_HAPPY);
  console.log('Happy flow: ' + Object.keys(byJ).length + ' journey · ' + hp.length + ' ขั้น (desktop) · เรียงขั้นและแถวเดียว' + (bad.some(b => /happy flow/.test(b)) ? ' ⚠' : ' ✓'));
  /* ช่องกรอกแสดงตรงเคส (ผู้ใช้สั่ง 17 พ.ย. 2569): ค่าจริง = State กรอกแล้ว · ยังไม่กรอก/ไม่เลือก = placeholder (State Default)
     สีข้อความของ Text input / Input dropdown ในไลบรารีผูกกับ State (Default = Color/text/placeholder) · ไม่นับช่องจำนวนแถวต่อหน้าในแถบแบ่งหน้า */
  const pv = (n, k) => { const x = Object.keys(n.componentProperties || {}).find(y => y.split('#')[0] === k); return x ? n.componentProperties[x].value : undefined; };
  const vis = (n, top) => { for (let p = n; p && p !== top.parent; p = p.parent) if (p.visible === false) return false; return true; };
  const inPg = (n) => { for (let p = n.parent; p; p = p.parent) if (p.name === 'Table pagination') return true; return false; };
  let nIn = 0, nSp = 0; const badIn = [];
  page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('MF / ') === 0).forEach(fr => {
    fr.findAll(n => n.type === 'INSTANCE' && /^(Text input|Text area|Input dropdown)$/.test(n.name) && vis(n, fr) && !inPg(n)).forEach(n => {
      const st = (n.variantProperties || {}).State, tx = String(pv(n, 'Text') || ''), lb = pv(n, 'Label text') || '';
      /* Show Placeholder ต้องเปิดทุกช่อง (ผู้ใช้สั่ง 17 พ.ย. 2569) — ปิดแล้วชั้นข้อความหาย ช่องที่มีค่าเห็นแต่ป้าย */
      if (n.name !== 'Input dropdown') { nSp++; if (pv(n, 'Show Placeholder') !== true) badIn.push('ช่อง "' + lb + '" Show Placeholder ปิด (' + st + ' "' + tx.slice(0, 20) + '"): ' + fr.name); }
      if (lb === 'Label') return;   // ช่องค้นหาของแถบเครื่องมือ (ป้ายซ่อน) ตรวจเฉพาะ Show Placeholder
      nIn++;
      const ph = n.name === 'Input dropdown' ? /^(เลือก|ค้นหา)/.test(tx) : /^(ระบุ|เลือก|0$|ค้นหา|วว\/ดด\/ปปปป|0XX-)/.test(tx);   // 17 พ.ย. 2569 + placeholder วันที่ · เบอร์โทร · dropdown ค้นหา (Feature แผนเดินทาง)
      const filledSt = n.name === 'Input dropdown' ? /^(Selected)$/.test(st) : /^(Filled|Readonly)$/.test(st);
      if (ph && filledSt && !(tx === '0' && st === 'Readonly')) badIn.push('ช่อง "' + lb + '" เป็น placeholder "' + tx + '" แต่ State ' + st + ': ' + fr.name);
      if (!ph && tx && st === 'Default') badIn.push('ช่อง "' + lb + '" มีค่า "' + tx + '" แต่ State Default (สี placeholder): ' + fr.name);
    });
    /* T.4 เลือกเบอร์น้ำมันอยู่ ⇒ รหัสน้ำมันและจำนวนต้องยังไม่กรอก */
    if (/\(T\.4\)/.test(fr.name)) fr.findAll(n => n.type === 'INSTANCE' && n.name === 'Text input' && /^(รหัสน้ำมัน|จำนวน \(ลิตร\))$/.test(pv(n, 'Label text') || '')).forEach(n => { if ((n.variantProperties || {}).State !== 'Default') badIn.push('T.4 ช่อง ' + pv(n, 'Label text') + ' กรอกไว้ก่อนเลือกเบอร์น้ำมัน: ' + fr.name); });
  });
  badIn.slice(0, 10).forEach(b => bad.push(b));
  console.log('ช่องกรอกตรงเคส ' + nIn + ' ช่อง · Show Placeholder เปิด ' + nSp + ' ช่อง' + (badIn.length ? ' ⚠ ผิด ' + badIn.length : ' ✓'));
  const toasts = page.children.filter(n => n.type === 'FRAME' && / — Toast /.test(n.name));
  for (const t of toasts) {
    const inst = t.children.filter(c => c.type === 'INSTANCE');
    if (inst.length !== 1 || !/Notification/.test(inst[0].name)) bad.push('เฟรม toast มีชิ้นอื่นนอกจาก Notification: ' + t.name);
  }
  bad.slice(0, 20).forEach(b => console.log('⚠ ' + b));
  console.log('ระยะ 200 ในหน้าเดียวกัน · 500 คนละหน้า · toast ' + toasts.length + ' เฟรม' + (bad.length ? ' — ผิด ' + bad.length + ' จุด' : ' ✓'));
  if (bad.length) process.exitCode = 1;
});
/* กติกา R1 ของพี่นุกำหนด desktop = Tablet · ปลั๊กอินนี้เปลี่ยนเป็น Desktop ตามที่ผู้ใช้สั่ง 16 พ.ย. 2569 ⇒ เทสนี้ตรวจ R1 เป็น Desktop (ไม่แก้ component-rules.json) */
{ const r1 = require('./check-component-rules').RULES.variants.find(v => v.id === 'R1'); if (r1) r1.desktop = { Breakpoint: 'Desktop' }; }
require('./test-overhaul2-plugin.js');
