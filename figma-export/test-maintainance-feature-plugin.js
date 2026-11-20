#!/usr/bin/env node
/* ทดสอบ maintainance-feature-plugin/code.js บน mock Plugin API ชุดเดียวกับปลั๊กอินอื่น (test-overhaul2-plugin.js)
   รัน:  node figma-export/maintainance-feature-plugin/build.js && node figma-export/test-maintainance-feature-plugin.js
         MODE=build-pick PICK=0,2 · DEVICES=desktop
   ตรวจเพิ่มจากตัวกลาง: ระยะ case ในหน้าเดียวกัน 200 · คนละหน้า 500 · เฟรม toast มีแค่ Notification · รหัสจอใน features/*.js ตรงเอกสาร Feature 40–44 (หัวข้อ 3) */
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
    const doc = fs.readFileSync(require('./plugin-lib/maint-docs.js').docPath(path.join('Diagram', '01-บำรุงรักษาตามวาระ', docName)), 'utf8');
    /* รหัสชั้นเดียว (A.3 · ช่วง A.3–A.9) และรหัสซ้อนของเส้นทางย่อย (V.4.1 · ช่วง V.4.1–V.4.3) — 17 พ.ย. 2569 รองรับรหัสซ้อน (Feature งานรายคัน) */
    const exp = (t) => { const r = []; t.replace(/\b([A-Z]\d*)\.((?:\d+\.)*)(\d+)(?:[–-](?:\1\.\2)?(\d+))?/g, (m, a, mid, x, y) => { for (let i = +x; i <= (y ? +y : +x); i++) r.push(a + '.' + mid + i); }); return r; };
    const used = new Set([...FSRC.matchAll(/\['([A-Z]\d*\.\d+(?:\.\d+)*)', '/g)].map(m => m[1]));   // 18 พ.ย. 2569 ฐาน origin: รหัสเรื่องย่อย A1.7
    const sec = (doc.split('## 3.')[1] || '').split('## 4.')[0], want = new Set();
    const rowsT = sec.split('\n').filter(l => /^\| /.test(l)), hdr = (rowsT[0] || '').split('|').map(s => s.trim());
    const cols = hdr.map((h, i) => /^จอที่สร้าง/.test(h) ? i : -1).filter(i => i > 0);   // ทุกคอลัมน์ที่หัวขึ้นต้น "จอที่สร้าง"
    rowsT.slice(1).filter(l => /^\| [^-|]/.test(l)).forEach(l => { const c = l.split('|'); (cols.length ? cols : [3]).forEach(i => exp(c[i] || '').forEach(x => want.add(x))); });
    const miss = [...want].filter(c => !used.has(c)), extra = [...used].filter(c => !want.has(c));
    /* DOC_PENDING=1 (18 พ.ย. 2569 ย้ายฐาน): เอกสาร 40–44 (เดิม 32–36) ยังเป็นรหัสฐานเก่า รอแก้ ⇒ พิมพ์รายการที่เอกสารต้องเปลี่ยน (ⓘ) ไม่นับเป็นไม่ผ่าน */
    const pend = !!process.env.DOC_PENDING;
    if (!want.size || miss.length || extra.length) { console.log((pend ? 'ⓘ เอกสารต้องแก้ ' : '⚠ ') + 'features/' + FEAT + '.js ไม่ตรง ' + docName + ' — เอกสารมีแต่ Feature ไม่ใช้ (' + miss.length + '): ' + (miss.join(' ') || '-') + ' · Feature ใช้แต่เอกสารไม่มี (' + extra.length + '): ' + (extra.join(' ') || '-') + (want.size ? '' : ' · เอกสารไม่มีตารางหัวข้อ 3')); if (!pend) process.exitCode = 1; }
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
/* ---------- อัปเดต / ลบ (18 พ.ย. 2569 · ปรับตามรีวิวโคนัน) ----------
   MODE=delete-section PARTS=happy|full (FEATURES=… หลาย Feature) · UNTAG=1 ลบป้าย mf ของชิ้นในส่วน (ต้องหาจากตำแหน่ง) · DEL_FOREIGN=1 วางของผู้ใช้ไว้กลางส่วนที่ลบ (ต้องไม่ถูกแตะ)
     DEL_BOTH=1 Page "(พระผู้สร้าง)" มีชุดด้วย + ชิ้นที่ไม่รู้ว่าอยู่ส่วนไหน 1 ชิ้น ⇒ กล่องยืนยันบอกชื่อ Page ทั้งสอง + จำนวนที่ไม่ลบ · ลบทั้งสอง Page
   MODE=update-changed UPD_SETUP=1: ปลอมลายเซ็น 3 จอ (= โค้ดเปลี่ยน) + ชื่อแถบเก่า · ลบ 2 จอ (= ยังไม่มีบนหน้า) · จอที่สร้างก่อนมีระบบตรวจ: ใหม่กว่า build 5 คู่ · เก่ากว่า build 2 คู่ · ชื่อเคสไม่ตรง 1 จอ · จอรหัสที่ไม่มีแล้ว 1
     ค่าตั้งต้น (ไม่ส่ง legacy) = สร้างใหม่ทั้งหมด · LEGACY=baseline = ถือว่าล่าสุดเฉพาะจอใหม่กว่า build · UPD_FORCE=1 สร้างใหม่ทุกจอ (จอเก่าต้องเข้าด้วย) · UPD_OVERLAP=1 จอใหม่สูงขึ้นทับของข้างล่าง ⇒ เตือนพร้อมชื่อ · UPD_TWICE=1 ตรวจซ้ำ
   MODE=rebuild-selected SEL=<regex ชื่อจอ> (+ SEL_INNER=1 เลือกชิ้นในจออีก 1 จอ) · SEL_MATCH=1 จับคู่ journey + หน้า ก่อนชื่อเคส (รหัสเปลี่ยน · ชื่อเคสเปลี่ยน · journey ไม่มีแล้ว ⇒ ข้าม) */
const UPD = { started: false, confirm: null, before: [], setup: {} }, LOGS = [];
const MF_TAG_T = 'mf';
const fpages = () => (process.env.FEATURES ? process.env.FEATURES.split(',') : [FEAT]).map(id => { const sx = fs.readFileSync(path.join(__dirname, 'maintainance-feature-plugin', 'features', id + '.js'), 'utf8'); const pg = (sx.match(/page: \[\s*'([^']+)'/) || [])[1]; return mockFigma.root.children.find(p => p.name === pg || p.name === pg + ' (พระผู้สร้าง)'); }).filter(Boolean);
const deskFrames = (pg) => pg.children.filter(n => n.type === 'FRAME' && /^MF \/ \d/.test(n.name) && !/ · mobile$/.test(n.name)).sort((a, b) => a.y - b.y || a.x - b.x);
const mobOf = (pg, d) => pg.children.find(n => n.name === d.name + ' · mobile' && n.x === d.x);
const okWarn = (re) => { const w = LOGS.filter(l => /^⚠|^✗/.test(l)); return w.length > 0 && w.every(l => re.test(l)); };   // คำเตือนที่ตั้งใจให้เกิดเท่านั้น ⇒ ไม่นับว่าไม่ผ่าน
function updSetup(m) {
  for (const pg of fpages()) UPD.before.push(...pg.children.map((n, i) => ({ pg, n, x: n.x, y: n.y, i, name: n.name, tag: n.getPluginData(MF_TAG_T) })));
  const pg = fpages()[0]; if (!pg) return;
  if (process.env.UNTAG) { let k = 0; for (const n of pg.children) { const t = n.getPluginData(MF_TAG_T); if (t && t !== 'title') { n.setPluginData(MF_TAG_T, ''); k++; } } UPD.setup.untag = k; }
  if (process.env.DEL_FOREIGN) { const h = pg.children.filter(n => /^MF \/ H/.test(n.name)).sort((a, b) => a.y - b.y)[0] || pg.children.find(n => /^MF \/ \d/.test(n.name)); const f = mockFigma.createFrame(); f.name = 'ของผู้ใช้'; pg.appendChild(f); f.x = h.x + 10; f.y = h.y + 10; UPD.setup.foreign = { f, x: f.x, y: f.y }; }
  if (process.env.DEL_BOTH) {
    const alt = mockFigma.createPage(); alt.name = pg.name + ' (พระผู้สร้าง)';
    const mk = (name, tag, y) => { const f = mockFigma.createFrame(); f.name = name; alt.appendChild(f); f.x = 0; f.y = y; f.resize(1440, 100); f.setPluginData(MF_TAG_T, tag); return f; };
    UPD.setup.alt = { page: alt, happy: [mk('MF / H1.1 · ทดสอบ (Happy flow) › หน้า — ขั้น 1 · ทดสอบ', 'happy-0', 0), mk('MF · H1 ทดสอบ · Happy flow', 'happy', -300)], full: mk('MF / 1.1.1 · ทดสอบ › หน้า — ทดสอบ', '0', 2000) };
    const f = mockFigma.createFrame(); f.name = 'MF · ป้ายลอย'; pg.appendChild(f); f.x = Math.min(...pg.children.map(n => n.x)); f.y = Math.min(...pg.children.map(n => n.y)) - 3000; UPD.setup.loose = { f, x: f.x, y: f.y };
  }
  if (process.env.DEL_OLD) {   // ชื่อ Page เดิมของ Feature (page ช่องที่ 2 · close เดิม "ประวัติและปิดงาน") ⇒ ปุ่มลบส่วนต้องลบชุดเก่าบน Page นั้นด้วย
    const old = mockFigma.createPage(); old.name = process.env.DEL_OLD;
    const mk = (name, tag, y) => { const f = mockFigma.createFrame(); f.name = name; old.appendChild(f); f.x = 0; f.y = y; f.resize(1440, 100); f.setPluginData(MF_TAG_T, tag); return f; };
    UPD.setup.oldPage = { page: old, happy: mk('MF / H1.1 · ชุดเก่า (Happy flow) › หน้า — ขั้น 1 · เก่า', 'happy-0', 0), title: mk('MF · Feature ' + process.env.DEL_OLD, 'title', -1000) };
  }
  if (process.env.UPD_SETUP) {
    const D = deskFrames(pg), S = UPD.setup; S.tamper = []; S.gone = []; S.legacy = []; S.old = []; S.renamed = [];
    for (const i of [3, 10]) { S.tamper.push(D[i]); D[i].setPluginData('mfSig', 'tampered'); }
    const m3 = mobOf(pg, D[3]); m3.setPluginData('mfSig', 'tampered'); S.tamper.push(m3);
    const code3 = D[3].name.match(/^MF \/ (\S+) /)[1]; S.bar = pg.children.find(n => n.name.indexOf('MF · ' + code3 + ' ') === 0 && n.x === D[3].x); S.barWant = S.bar.name; S.bar.name = 'MF · ' + code3 + ' ชื่อเคสเก่า';
    for (const n of [D[5], mobOf(pg, D[12])]) { S.gone.push({ name: n.name, x: n.x, y: n.y }); n.remove(); }
    for (const i of [20, 21, 22, 23, 24]) for (const n of [D[i], mobOf(pg, D[i])]) { n.setPluginData('mfSig', ''); S.legacy.push(n); }
    for (const i of [26, 27]) for (const n of [D[i], mobOf(pg, D[i])]) { n.setPluginData('mfSig', ''); n.setPluginData('builtAt', '1'); S.old.push(n); }   // สร้างก่อน build ปลั๊กอินรุ่นนี้
    D[29].setPluginData('mfSig', ''); D[29].name = D[29].name + ' (ชื่อเคสเดิม)'; S.renamed.push(D[29]);   // ชื่อเคสในชื่อเฟรมไม่ตรง label ปัจจุบัน ⇒ เปลี่ยน
    if (process.env.UPD_OVERLAP) { D[10].resize(D[10].width, 200); const f = mockFigma.createFrame(); f.name = 'ของผู้ใช้ใต้จอ'; pg.appendChild(f); f.x = D[10].x; f.y = D[10].y + 400; f.resize(1440, 100); S.under = f; }
    const x = mockFigma.createFrame(); x.name = 'MF / 1.1.99 · จอที่ตัดออกแล้ว › หน้าเก่า — ทดสอบ'; x.resize(1440, 100); pg.insertChild(0, x); x.x = D[0].x; x.y = Math.max(...pg.children.map(n => n.y + n.height)) + 2000; S.extra = x;
    S.all = UPD.before.filter(b => b.pg === pg && b.n.type === 'FRAME' && /^MF \//.test(b.name));
    S.order = pg.children.slice();   // ลำดับ layer หลังเตรียม (ก่อนกดอัปเดต)
  }
  if (process.env.SEL) {
    const re = new RegExp(process.env.SEL), sel = pg.children.filter(n => n.type === 'FRAME' && re.test(n.name));
    if (process.env.SEL_INNER) { const other = deskFrames(pg).find(n => !re.test(n.name) && n.children.length); if (other) { sel.push(other.children[0]); UPD.setup.inner = other; } }
    UPD.setup.sel = sel.filter(n => n.type === 'FRAME' && /^MF \//.test(n.name)).concat(UPD.setup.inner ? [UPD.setup.inner] : []);
    mockFigma.currentPage = pg; pg.selection = sel;
  }
  if (process.env.SEL_MATCH) {   // ข้อ 6: A รหัสเปลี่ยน · B ชื่อเคสเปลี่ยน · C journey ไม่มีแล้ว + ชื่อเคสเปลี่ยน
    const D = deskFrames(pg), [A, B, C] = [D[2], D[4], D[6]], S = UPD.setup;
    S.match = { A: { n: A, name: A.name }, B: { n: B, name: B.name }, C: { n: C, name: C.name } };
    A.name = A.name.replace(/^MF \/ \S+ /, 'MF / 1.9.9 ');
    B.name = B.name.replace(/ \(([A-Z]\d*\.\d+)\)$/, ' เดิม ($1)');
    C.name = C.name.replace(/ · ([^›]+) › /, ' · journey ที่ไม่มีแล้ว › ') + ' เดิม';
    S.sel = [A, B]; S.skip = C;
    mockFigma.currentPage = pg; pg.selection = [A, B, C];
  }
}
process.on('beforeExit', () => {
  if (global.__mfUpd || !mockFigma || !UPD.started) return; global.__mfUpd = true;
  const bad = [], t = (ok, msg) => { if (!ok) bad.push(msg); };
  const still = (b) => b.pg.children.indexOf(b.n) >= 0 && b.n.x === b.x && b.n.y === b.y;
  let allowWarn = null;   // regex ของคำเตือนที่เทสนี้ตั้งใจให้เกิด
  if (process.env.MODE === 'delete-section') {
    const parts = (process.env.PARTS || '').split(','), isPart = (b) => { const tg = b.tag, nm = b.name, inH = /^(happy|happy-\d+)$/.test(tg) || /^MF \/ H|^MF · H\d|^MF · ส่วน Happy/.test(nm), inF = /^(full|\d+)$/.test(tg) || /^MF \/ \d|^MF · \d|^MF · ส่วน ทุกเคส/.test(nm); return (parts.includes('happy') && inH) || (parts.includes('full') && inF); };
    const pgs = fpages(), NOOP = !!(process.env.EXPECT_SHIFT || process.env.NO_CONFIRM); let gone = 0, kept = 0, wrongly = 0;
    for (const b of UPD.before) {
      if (b.n === (UPD.setup.foreign || {}).f) continue;
      const del = !NOOP && isPart(b) && !/^MF · Feature /.test(b.name) && b.tag !== 'title' && /^MF [\/·] /.test(b.name);
      if (del) { if (b.pg.children.indexOf(b.n) >= 0) bad.push('ยังไม่ถูกลบ: ' + b.name); else gone++; }
      else if (!still(b)) { wrongly++; if (wrongly < 6) bad.push('ถูกแตะทั้งที่ไม่ใช่ส่วนที่ลบ: ' + b.name); } else kept++;
    }
    for (const pg of pgs) t(pg.children.filter(n => /^MF · Feature /.test(n.name)).length === 1, 'Title Feature หาย: ' + pg.name);
    const f = UPD.setup.foreign; if (f) { t(f.f.parent && f.f.x === f.x && f.f.y === f.y, 'ของผู้ใช้ถูกแตะ'); f.f.remove(); }
    let extra = 0; const A = UPD.setup.alt, L = UPD.setup.loose;
    if (A) {   // ข้อ 7
      const lines = (UPD.first && UPD.first.lines || []).join('\n');
      t(lines.indexOf('Page "' + pgs[0].name + '"') >= 0 && lines.indexOf('Page "' + A.page.name + '"') >= 0, 'กล่องยืนยันไม่บอกชื่อ Page ทั้งสอง: ' + lines);
      t(/ชิ้นที่ไม่รู้ว่าอยู่ส่วนไหน \(ไม่ลบ\) 1/.test(lines), 'กล่องยืนยันไม่บอกชิ้นที่ไม่รู้ว่าอยู่ส่วนไหน: ' + lines);
      t(/มีชุดทั้ง Page หลักและ "\(พระผู้สร้าง\)"/.test(lines), 'กล่องยืนยันไม่บอกว่ามีชุดทั้งสอง Page');
      t(A.happy.every(n => A.page.children.indexOf(n) < 0) && A.page.children.indexOf(A.full) >= 0, 'Page "(พระผู้สร้าง)": Happy ต้องถูกลบ ทุกเคสต้องอยู่');
      t(L.f.parent && L.f.x === L.x && L.f.y === L.y, 'ชิ้นที่ไม่รู้ว่าอยู่ส่วนไหนถูกแตะ'); L.f.remove();
      extra = A.happy.length;
    }
    const O = UPD.setup.oldPage;
    if (O) { t((UPD.first.lines || []).join('\n').indexOf('Page "' + O.page.name + '"') >= 0, 'กล่องยืนยันไม่บอก Page ชื่อเดิม'); t(O.page.children.indexOf(O.happy) < 0 && O.page.children.indexOf(O.title) >= 0, 'Page ชื่อเดิม: Happy ต้องถูกลบ Title ต้องอยู่'); extra += 1; }
    if (!NOOP) t(UPD.first && UPD.first.total === gone + extra, 'ยืนยัน ' + (UPD.first && UPD.first.total) + ' ชิ้น แต่ลบไป ' + (gone + extra));
    if (NOOP) { t(gone === 0, 'จำนวนไม่ตรง/ยกเลิก แต่ยังลบ ' + gone); if (process.env.EXPECT_SHIFT) { t(okWarn(/จำนวนชิ้นเปลี่ยนจากตอนตรวจ/), 'ไม่ได้บอกว่าจำนวนเปลี่ยน'); allowWarn = /จำนวนชิ้นเปลี่ยนจากตอนตรวจ/; } }
    else t(gone > 0, 'ไม่ได้ลบอะไร');
    console.log('ลบส่วน ' + parts.join('+') + ': ' + pgs.map(p => p.name).join(' · ') + ' · ลบ ' + (gone + extra) + ' ชิ้น (ยืนยัน ' + (UPD.first && UPD.first.total) + ') · ไม่แตะ ' + kept + (UPD.setup.untag ? ' · ลบป้ายก่อน ' + UPD.setup.untag + ' ชิ้น (หาจากตำแหน่ง)' : '') + (f ? ' · ของผู้ใช้ไม่ถูกแตะ' : '') + (A ? ' · 2 Page + ชิ้นไม่รู้ส่วนไม่ลบ' : '') + (O ? ' · Page ชื่อเดิม "' + O.page.name + '" ลบด้วย' : '') + (bad.length ? ' ⚠' : ' ✓'));
  }
  if (process.env.MODE === 'update-changed' && UPD.setup.all) {
    const S = UPD.setup, pg = fpages()[0], force = !!process.env.UPD_FORCE, base = process.env.LEGACY === 'baseline' && !force;
    const at = (b) => pg.children.find(n => n.type === 'FRAME' && n.x === b.x && n.y === b.y && n.name === b.name);
    let replaced = 0, untouched = 0, placed = 0, based = 0, oldKept = 0;
    for (const b of S.all) {
      if (b.n === S.extra) continue;
      const tam = S.tamper.includes(b.n), leg = S.legacy.includes(b.n), old = S.old.includes(b.n), ren = S.renamed.includes(b.n), gone = S.gone.some(g => g.name === b.name && g.x === b.x);
      if (gone) continue;
      const redo = force || tam || ren || ((leg || old) && !base);
      if (redo) { const n = at(b); if (!n || n === b.n) bad.push('จอที่ต้องสร้างใหม่ไม่ถูกแทนที่ที่เดิม: ' + b.name); else { replaced++; t(n.getPluginData('mfSig') && n.getPluginData('mfSig') !== 'tampered', 'ลายเซ็นใหม่ไม่ถูกเก็บ: ' + b.name); } }
      else if (!still(b)) bad.push('จอที่ไม่เปลี่ยนถูกแตะ: ' + b.name);
      else { untouched++; if (leg) { if (b.n.getPluginData('mfSig')) based++; else bad.push('จอเก่าที่สร้างหลัง build ไม่ได้ถือว่าล่าสุด: ' + b.name); } if (old) { if (!b.n.getPluginData('mfSig')) oldKept++; else bad.push('จอที่สร้างก่อน build ถูกถือว่าล่าสุด (ห้าม): ' + b.name); } }
    }
    for (const g of S.gone) { const n = at(g); if (!n) bad.push('จอที่หายไม่ถูกวางกลับที่ช่องเดิม: ' + g.name); else placed++; }
    t(pg.children.indexOf(S.extra) >= 0, 'จอที่ไม่มีใน Feature แล้วถูกลบ (ต้องรายงานเฉยๆ)');
    const bar = pg.children.find(n => n.name === S.barWant && n.x === S.bar.x && n.y === S.bar.y); t(bar && pg.children.indexOf(S.bar) < 0, 'แถบชื่อเคสเก่าไม่ถูกแทน');
    const live = (n) => pg.children.indexOf(n) >= 0 && !S.tamper.includes(n) && !S.legacy.includes(n) && !S.old.includes(n) && !S.renamed.includes(n) && !force;
    const order = S.tamper.map(n => UPD.before.find(b => b.n === n)).every(b => { const i = S.order.indexOf(b.n), prev = S.order.slice(0, i).reverse().find(live), next = S.order.slice(i + 1).find(live), k = pg.children.indexOf(at(b));
      return (!prev || pg.children.indexOf(prev) < k) && (!next || pg.children.indexOf(next) > k); });
    t(order, 'ลำดับ layer ของจอที่แทนที่ไม่ตรงเดิม');
    const F1 = UPD.first || {}, nLeg = S.legacy.length + S.old.length;
    if (force) { t(F1.unknown === 0 && F1.total === S.all.length, 'ติ๊กสร้างใหม่ทุกจอ: จอเก่าต้องเข้าสร้างใหม่ (unknown ' + F1.unknown + ' · total ' + F1.total + ' ต้อง ' + S.all.length + ')'); }
    else {
      t(F1.unknown === nLeg, 'นับจอที่สร้างก่อนมีระบบตรวจ ' + F1.unknown + ' ต้อง ' + nLeg);
      t(F1.unknownFresh === S.legacy.length, 'นับจอที่ถือว่าล่าสุดได้ ' + F1.unknownFresh + ' ต้อง ' + S.legacy.length + ' (จอที่สร้างก่อน build ห้ามนับ)');
      t(F1.total === S.tamper.length + S.gone.length + S.renamed.length, 'นับจอที่ต้องอัปเดต ' + F1.total + ' ต้อง ' + (S.tamper.length + S.gone.length + S.renamed.length) + ' (รวมจอชื่อเคสไม่ตรง)');
    }
    if (process.env.UPD_TWICE) { const want = base ? S.old.length : 0, wantT = force ? F1.total : 0; t(UPD.second && UPD.second.total === wantT && UPD.second.unknown === want, 'ตรวจซ้ำหลังอัปเดต ' + JSON.stringify(UPD.second && [UPD.second.total, UPD.second.unknown]) + ' ต้อง [' + wantT + ',' + want + ']'); }   // ติ๊กสร้างใหม่ทุกจอ ⇒ ตรวจซ้ำยังนับทุกจอ
    if (S.under) {   // ข้อ 5
      t(okWarn(/สูงขึ้น/) && LOGS.some(l => /^⚠ จอ "MF \/ .*" สูงขึ้นจาก 200 เป็น \d+ จึงทับ "ของผู้ใช้ใต้จอ"/.test(l)), 'จอสูงขึ้นทับเฟรมอื่นไม่ได้เตือนพร้อมชื่อ: ' + LOGS.filter(l => /^⚠/.test(l)).join(' | '));
      allowWarn = /สูงขึ้น/; S.under.remove();
    }
    console.log('อัปเดตจอที่เปลี่ยน' + (force ? ' (สร้างใหม่ทุกจอ)' : '') + ': แทนที่ ' + replaced + ' · วางกลับช่องเดิม ' + placed + ' · ไม่แตะ ' + untouched + ' · จอก่อนมีระบบตรวจ ' + (force ? 'สร้างใหม่' : base ? 'ถือว่าล่าสุด ' + based + ' · สร้างก่อน build ไม่แตะ ' + oldKept : 'สร้างใหม่ (ค่าตั้งต้น)') + ' · ชื่อเคสไม่ตรงสร้างใหม่ · จอที่ตัดแล้วยังอยู่ · แถบชื่อเคสแทนแล้ว' + (S.under ? ' · เตือนจอสูงขึ้นทับ' : '') + (process.env.UPD_TWICE ? ' · ตรวจซ้ำเหลือ ' + (UPD.second ? UPD.second.total + '/' + UPD.second.unknown : '?') : '') + (bad.length ? ' ⚠' : ' ✓'));
    S.extra.remove();   // ไม่ให้ตัวตรวจส่วนอื่นนับจอปลอม
  }
  if (process.env.MODE === 'rebuild-selected' && UPD.setup.match) {   // ข้อ 6
    const pg = fpages()[0], M = UPD.setup.match;
    for (const k of ['A', 'B']) { const o = M[k], b = UPD.before.find(x => x.n === o.n), n = pg.children.find(c => c.type === 'FRAME' && c.x === b.x && c.y === b.y && c !== o.n);
      t(pg.children.indexOf(o.n) < 0 && n && n.name === o.name, k + ': ต้องจับคู่ด้วย journey + หน้า แล้วแทนที่ด้วยชื่อเดิม (ได้ ' + (n && n.name) + ')'); }
    t(M.cKept, 'C (journey ไม่มีแล้ว) ต้องข้าม ไม่แตะ');
    let kept = 0; for (const b of UPD.before.filter(x => x.pg === pg && x.n.type === 'FRAME' && /^MF \//.test(x.name) && ![M.A.n, M.B.n, M.C.n].includes(x.n))) { if (!still(b)) bad.push('จอที่ไม่ได้เลือกถูกแตะ: ' + b.name); else kept++; }
    console.log('สร้างจอที่เลือกใหม่ (จับคู่ journey + หน้า): รหัสเปลี่ยน ✓ ชื่อเคสเปลี่ยน ✓ journey ไม่มีแล้ว ข้าม · ไม่แตะ ' + kept + (bad.length ? ' ⚠' : ' ✓'));
  } else if (process.env.MODE === 'rebuild-selected') {
    const pg = fpages()[0], sel = UPD.setup.sel || [];
    let rep = 0, kept = 0;
    for (const b of UPD.before.filter(x => x.pg === pg && x.n.type === 'FRAME' && /^MF \//.test(x.name))) {
      if (sel.includes(b.n)) { const n = pg.children[b.i]; if (pg.children.indexOf(b.n) >= 0 || !n || n.name !== b.name || n.x !== b.x || n.y !== b.y) bad.push('จอที่เลือกไม่ถูกแทนที่ตำแหน่ง/ลำดับเดิม: ' + b.name); else rep++; }
      else if (!still(b)) bad.push('จอที่ไม่ได้เลือกถูกแตะ: ' + b.name); else kept++;
    }
    t(sel.length && rep === sel.length, 'แทนที่ ' + rep + '/' + sel.length);
    console.log('สร้างจอที่เลือกใหม่: แทนที่ ' + rep + '/' + sel.length + (UPD.setup.inner ? ' (รวมจอที่เลือกชิ้นข้างใน)' : '') + ' · ไม่แตะ ' + kept + (bad.length ? ' ⚠' : ' ✓'));
  }
  bad.slice(0, 15).forEach(b => console.log('⚠ ' + b));
  if (bad.length) process.exitCode = 1;
  else if (allowWarn && okWarn(allowWarn)) { process.exitCode = 0; console.log('(คำเตือนที่ตัวกลางนับ = คำเตือนที่เทสนี้ตั้งใจให้เกิดเท่านั้น ⇒ ผ่าน)'); }
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
    ctx.figma.ui.postMessage = (m) => { if (m && m.type === 'shot') FJ.shots.push(m); if (m && m.type === 'fj-file') FJ.files.push(m); if (m && m.type === 'fj-done') FJ.done = m; if (m && m.type === 'fj-all-done') FJ.allDone = m; if (m && m.type === 'build-all-done') FJ.buildDone = m; if (m && m.type === 'mf-confirm') UPD.confirm = m; if (m && m.type === 'log') LOGS.push(m.text); return pm(m); };
    /* FJ_TARGET=<ลิงก์บอร์ด>: เลือกบอร์ดปลายทางก่อนกดปุ่มใดๆ ⇒ สเปกต้องมี target */
    /* FEATURE: ทุกข้อความจากหน้าต่างแนบ feature (แบบที่ ui.html ส่ง) */
    /* MODE=export-figjam-all + PRE_FEATURES=plan,trip,…: ปุ่มสร้าง (PRE_MODE) กดครั้งละ Feature ตามรายการ แล้วกด "ส่งทุก Feature" */
    const PRE_F = process.env.MODE === 'export-figjam-all' ? (process.env.PRE_FEATURES || FEAT).split(',') : null;
    { const d = Object.getOwnPropertyDescriptor(ctx.figma.ui, 'onmessage'); Object.defineProperty(ctx.figma.ui, 'onmessage', { configurable: true, set(f) { d.set.call(ctx.figma.ui, async (m) => {
      if (PRE_F && m && /^build/.test(m.type)) { for (const id of PRE_F) await f(Object.assign({}, m, { feature: id })); return; }
      if (process.env.PICKS && m && typeof m === 'object' && /^(build|export-figjam$|update-changed$)/.test(m.type || '')) m = Object.assign({}, m, { picks: Object.fromEntries(process.env.PICKS.split(';').map(x => [x.split(':')[0], x.split(':')[1].split(',')])) });   // PICKS=plan:1;close:0 เลือก journey ราย Feature (17 พ.ย. 2569)
      if (process.env.FEATURES && m && typeof m === 'object' && /^(build|export-figjam$|update-changed$|delete-section$)/.test(m.type || '')) m = Object.assign({}, m, { features: process.env.FEATURES.split(',') });   // FEATURES=close,track: ติ๊กหลาย Feature (17 พ.ย. 2569)
      return f(m && typeof m === 'object' && !m.feature ? Object.assign({ feature: FEAT }, m) : m); }); } }); }
    /* FEATURES: ทุก Feature ที่ติ๊กต้องมีหน้าของตัวเองและมีจอ */
    if (process.env.FEATURES) process.on('beforeExit', () => { if (global.__mfMulti) return; global.__mfMulti = true;
      const want = process.env.FEATURES.split(','), got = want.map(id => { const s = fs.readFileSync(path.join(__dirname, 'maintainance-feature-plugin', 'features', id + '.js'), 'utf8'); const pg = (s.match(/page: \[\s*'([^']+)'/) || [])[1]; const page = mockFigma.root.children.find(p => p.name === pg); return id + ' ' + (page ? page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('MF / ') === 0).length : 0); });
      const ok = got.every(g => +g.split(' ')[1] > 0); console.log('ติ๊กหลาย Feature: ' + got.join(' · ') + ' เฟรม' + (ok ? ' ✓' : ' ⚠')); if (!ok) process.exitCode = 1; });
    /* อัปเดต / ลบ (18 พ.ย. 2569): mock ไม่มี getNodeByIdAsync · MODE=delete-section / update-changed กดตรวจ → ยืนยันจำนวนที่ปลั๊กอินบอก (แบบหน้าต่าง) · ก่อนกดเตรียมหน้าตาม env (updSetup) */
    if (!ctx.figma.getNodeByIdAsync) ctx.figma.getNodeByIdAsync = async (id) => { const w = (n) => { if (n.id === id) return n; for (const c of n.children || []) { const r = w(c); if (r) return r; } return null; }; return w(ctx.figma.root); };
    if (/^(delete-section|update-changed|rebuild-selected)$/.test(process.env.MODE || '')) { const d = Object.getOwnPropertyDescriptor(ctx.figma.ui, 'onmessage'); Object.defineProperty(ctx.figma.ui, 'onmessage', { configurable: true, set(f) { d.set.call(ctx.figma.ui, async (m) => {
      if (!m || m.type !== process.env.MODE || UPD.started) return f(m);
      UPD.started = true; updSetup(m); if (process.env.UPD_FORCE) m = Object.assign({}, m, { force: true });
      if (m.type === 'rebuild-selected') { const r = await f(m); const M = UPD.setup.match; if (M) { M.cKept = M.C.n.parent && M.C.n.parent.children.indexOf(M.C.n) >= 0 && M.C.n.name !== M.C.name; M.C.n.name = M.C.name; } return r; }   // SEL_MATCH: คืนชื่อ C ก่อนตัวตรวจกลาง (R19 จับคู่ด้วยชื่อ)
      await f(m); UPD.first = UPD.confirm;
      if (!UPD.first) { console.log('⚠ ไม่ได้รับ mf-confirm'); process.exitCode = 1; return; }
      if (process.env.NO_CONFIRM) return;   // กดตรวจแล้วกดยกเลิก ⇒ ต้องไม่มีอะไรถูกแตะ
      const expect = process.env.EXPECT_SHIFT ? UPD.first.total + 1 : UPD.first.total;   // EXPECT_SHIFT = จำนวนเปลี่ยนระหว่างตรวจกับยืนยัน ⇒ ต้องไม่ทำ
      await f(Object.assign({}, m, UPD.first.payload, Object.assign({ confirm: true, expect, expectUnknown: UPD.first.unknown }, process.env.LEGACY ? { legacy: process.env.LEGACY } : {})));
      if (process.env.UPD_TWICE) { UPD.confirm = null; await f(Object.assign({}, m, UPD.first.payload, { confirm: false })); UPD.second = UPD.confirm; }
    }); } }); }
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
      const ph = n.name === 'Input dropdown' ? /^(เลือก|ค้นหา)/.test(tx) : /^(ระบุ|เลือก|0$|ค้นหา|วว\/ดด\/ปปปป|0XX-|เช่น |\d+ หลัก$|ชั่วโมง$)/.test(tx);   // 18 พ.ย. 2569 ฐาน origin: placeholder popup เครื่องมือกล W.24–W.26 (เช่น … · 12 หลัก · ชั่วโมง)   // 17 พ.ย. 2569 + placeholder วันที่ · เบอร์โทร · dropdown ค้นหา (Feature แผนเดินทาง)
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
