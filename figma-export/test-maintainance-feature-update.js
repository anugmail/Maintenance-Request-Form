#!/usr/bin/env node
/* เทสหน่วยของงาน "อัปเดตเฉพาะจุด" ปลั๊กอินพระผู้สร้าง (18 พ.ย. 2569) — ไม่ต้องเปิด Figma
   ก. ลายเซ็นจอ (maintainance-feature-plugin/sig.js) จากซอร์สจริง:
      แก้ฟังก์ชันจอ ⇒ ลายเซ็นของจอที่ใช้ฟังก์ชันนั้นเปลี่ยน · จอที่ไม่เกี่ยวไม่เปลี่ยน · แก้คอมเมนต์อย่างเดียวไม่เปลี่ยน · ชื่อในไฟล์ Feature หาในไฟล์นั้นก่อน
   ข. ความจำการหา component (maintainance-feature-plugin/rcache.js) บน figma จำลอง:
      รอบแรกสแกนเฉพาะ instance ชื่อตรง · รอบสอง (เปิดปลั๊กอินใหม่) ไม่สแกนเลย · ตัวที่ไม่มีจำว่าไม่มี · component ถูกลบ ⇒ หาใหม่ · ล้างความจำ ⇒ หาใหม่
      ตัวที่ขาดไม่ได้ (ไม่ใช่ชิ้นส่วนซ้อน) หาชื่อตรงไม่เจอ ⇒ สแกนทั้งไฟล์ (เหมือน resolveAll) และไม่จำว่าไม่มี
   รัน:  node figma-export/test-maintainance-feature-update.js */
const fs = require('fs'), path = require('path'), vm = require('vm');
const D = path.join(__dirname, 'maintainance-feature-plugin');
const S = require(path.join(D, 'sig.js'));
const out = []; const t = (ok, m) => out.push((ok ? '✓ ' : '⚠ ') + m);

/* ---------- ก. ลายเซ็น ---------- */
{
  const rd = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
  const core = rd('plugin-lib/core.js'), screens = rd('maintainance-plugin/screens.js'), feat = rd('maintainance-feature-plugin/feature.js');
  const fsrc = (id) => rd('maintainance-feature-plugin/features/' + id + '.js');
  const scopes = (scr, trip) => ({ '*': [core, scr, feat], plan: fsrc('plan'), trip: trip || fsrc('trip') });
  const A = S.sigDepHash(scopes(screens));
  t(S.sigDepHash(scopes(screens)).trip.TOASTS === A.trip.TOASTS && JSON.stringify(S.sigDepHash(scopes(screens))) === JSON.stringify(A), 'คิดซ้ำได้ค่าเดิม (ไม่สุ่ม)');
  /* แก้ตัวเลขในตัวฟังก์ชัน tripList (จอแผนเดินทาง) */
  const m = screens.match(/\nasync function tripList\([^)]*\) \{\n/);
  t(!!m, 'หา async function tripList ใน screens.js เจอ (ใช้ทดสอบ)');
  if (m) {
    const i = screens.indexOf(m[0]) + m[0].length;
    const B = S.sigDepHash(scopes(screens.slice(0, i) + '  const __mfTest = 1;\n' + screens.slice(i)));
    const C = S.sigDepHash(scopes(screens.slice(0, i) + '  /* แก้คอมเมนต์อย่างเดียว */ // อีกบรรทัด\n' + screens.slice(i)));
    t(A['*'].tripList !== B['*'].tripList, 'แก้ tripList ⇒ hash ของ tripList เปลี่ยน');
    t(A['*'].planForm === B['*'].planForm || /tripList/.test(screens.slice(screens.indexOf('function planForm'), screens.indexOf('function planForm') + 20000).split(/\n(?:async )?function /)[0]) , 'จอที่ไม่ได้ใช้ tripList (planForm) hash เท่าเดิม');
    t(JSON.stringify(A) === JSON.stringify(C), 'แก้คอมเมนต์อย่างเดียว ⇒ ทุก hash เท่าเดิม');
    const fn = function () { return tripList('S6 x', { trips: [] }); };
    const sigA = (() => { global.MF_DEPHASH = A; return S.sigOf(fn, 'trip', ['makeScreen'], { code: '1.1.1' }); })();
    const sigB = (() => { global.MF_DEPHASH = B; return S.sigOf(fn, 'trip', ['makeScreen'], { code: '1.1.1' }); })();
    const sigC = (() => { global.MF_DEPHASH = A; return S.sigOf(fn, 'trip', ['makeScreen'], { code: '1.1.1', label: 'ชื่อใหม่' }); })();
    const fn2 = function () { return listScreen('S1 x', {}); };
    const sigD = (() => { global.MF_DEPHASH = A; return S.sigOf(fn2, 'trip', ['makeScreen'], { code: '1.1.1' }); })();
    const sigE = (() => { global.MF_DEPHASH = B; return S.sigOf(fn2, 'trip', ['makeScreen'], { code: '1.1.1' }); })();
    t(sigA !== sigB, 'ลายเซ็นจอที่เรียก tripList เปลี่ยนเมื่อ tripList เปลี่ยน');
    t(sigA !== sigC, 'ลายเซ็นเปลี่ยนเมื่อชื่อเคสเปลี่ยน');
    t(sigD === sigE || /tripList/.test(screens.split('function listScreen')[1].split(/\n(?:async )?function /)[0]), 'ลายเซ็นจอ listScreen ไม่เปลี่ยนเมื่อแก้ tripList');
  }
  /* ชื่อซ้ำข้ามไฟล์ Feature: TOASTS ของ trip ต้องไม่ปนของ plan · แก้ข้อความ toast ใน trip ⇒ เฉพาะ trip เปลี่ยน */
  const trip2 = fsrc('trip').replace("S3: { text: 'อนุมัติแผนเดินทางสำเร็จ'", "S3: { text: 'อนุมัติแผนเดินทางสำเร็จแล้ว'");
  t(trip2 !== fsrc('trip'), 'เตรียมแก้ข้อความ toast ใน trip.js ได้');
  const T = S.sigDepHash(scopes(screens, trip2));
  t(T.trip.TOASTS !== A.trip.TOASTS && JSON.stringify(T['*']) === JSON.stringify(A['*']) && JSON.stringify(T.plan) === JSON.stringify(A.plan), 'แก้ TOASTS ใน trip.js ⇒ เปลี่ยนเฉพาะ scope trip (ส่วนกลางและ plan เท่าเดิม)');
  /* ตัวตัดคำ: ตัดคอมเมนต์แล้วยังเป็น JS ที่ถูกต้อง */
  let okParse = true; for (const src of [core, screens, feat]) { try { new Function(S.sigScan(src).code); } catch (e) { okParse = false; } }
  t(okParse, 'ตัดคอมเมนต์ core/screens/feature แล้ว parse ผ่าน (ตัวตัดคำไม่กินโค้ด)');
  const sc = S.sigScan("const a = b.c + `x${d + e}y` + '/* f */' + /g\\/h/.test(i); // j");
  t(['a', 'b', 'd', 'e', 'i'].every(x => sc.ids.has(x)) && !sc.ids.has('c') && !sc.ids.has('f') && !sc.ids.has('j') && !sc.ids.has('h'), 'ตัวตัดคำเก็บชื่อถูก (ไม่นับ property · ข้อความ · regex · คอมเมนต์)');
  global.MF_DEPHASH = undefined;
  t(S.sigSourceOk(), 'node อ่านซอร์สฟังก์ชันได้ (ใน Figma ตรวจตอนกดอีกครั้ง)');
}

/* ---------- ข. ความจำการหา component ---------- */
{
  const src = fs.readFileSync(path.join(D, 'rcache.js'), 'utf8');
  let uid = 0;
  const mk = (type, name, kids, extra) => { const n = Object.assign({ id: 'n' + (++uid), type, name, children: kids || [], parent: null }, extra || {}); n.children.forEach(c => { c.parent = n; }); return n; };
  function world() {
    const comps = { A: mk('COMPONENT_SET', 'A'), B: mk('COMPONENT', 'B'), Nest: mk('COMPONENT', '_Nest'), Loc: mk('COMPONENT', 'Loc') };
    const insts = [];
    const inst = (name, main) => { const i = mk('INSTANCE', name); i.getMainComponentAsync = async () => { calls++; return main; }; insts.push(i); return i; };
    let calls = 0;
    const pageKids = [inst('A', comps.A), inst('ชื่อเปลี่ยน', comps.B), inst('_Nest', comps.Nest), inst('X', null)].concat(Array.from({ length: 50 }, (_, k) => inst('อื่น ' + k, null)));
    const doc = mk('DOCUMENT', 'doc', [mk('PAGE', 'p', pageKids.concat([comps.Loc]))]);
    const byId = new Map(); (function w(n) { byId.set(n.id, n); (n.children || []).forEach(w); })(doc);
    Object.values(comps).forEach(c => byId.set(c.id, c));
    let pd = {};
    doc.getPluginData = (k) => pd[k] || ''; doc.setPluginData = (k, v) => { pd[k] = v; };
    const all = (n, f, o) => { for (const c of n.children || []) { if (f(c)) o.push(c); all(c, f, o); } return o; };
    doc.findAllWithCriteria = (c) => all(doc, n => c.types.includes(n.type), []);
    const figma = { root: doc, loadAllPagesAsync: async () => {}, getNodeByIdAsync: async (id) => byId.get(id) || null,
      importComponentSetByKeyAsync: async () => { throw new Error('not published'); }, importComponentByKeyAsync: async () => { throw new Error('not published'); } };
    return { figma, comps, byId, get calls() { return calls; }, reset() { calls = 0; }, pd: () => pd, setPd: (x) => { pd = x; } };
  }
  function load(W) {
    const logs = [];
    const ctx = { figma: W.figma, KEYS: { A: ['k1', true], B: ['k2', false] }, ALIAS: {}, INDEX: new Map(), ROUTE: {}, IMPORT_ERR: '', NESTED_ONLY: new Set(['_Nest', '_Gone']), LOCAL_OPTIONAL: ['LocalOpt'],
      holderOf: (c) => (c.parent && c.parent.type === 'COMPONENT_SET') ? c.parent : c, log: (x) => logs.push(x), secs: () => '', JSON, Date, Map, Set, Error, Promise, String, Object, Array };
    vm.createContext(ctx); vm.runInContext(src + '\nthis.run = (l) => resolveLib(l); this.stat = () => RC_STAT; this.clear = () => rcClear();', ctx);
    return { ctx, logs };
  }
  (async () => {
    const W = world();
    let P = load(W); await P.ctx.run(['A', 'Loc', '_Nest', '_Gone']);
    const s1 = P.ctx.stat();
    t(P.ctx.INDEX.get('A') === W.comps.A && P.ctx.INDEX.get('Loc') === W.comps.Loc && P.ctx.INDEX.get('_Nest') === W.comps.Nest && !P.ctx.INDEX.has('_Gone'), 'รอบแรก: ได้ A (instance ชื่อตรง) · Loc (สำเนาในไฟล์) · _Nest · _Gone ไม่มี (ชิ้นส่วนซ้อน ไม่บังคับ)');
    t(s1.calls === 2 && !s1.full, 'รอบแรก: เรียก getMainComponentAsync เฉพาะ instance ชื่อตรง ' + s1.calls + ' ครั้ง (ไม่สแกนทั้งไฟล์ 54 ชิ้น)');
    const mem = JSON.parse(W.pd()['mf-resolve']);
    t(mem.items.A && mem.items.A.id === W.comps.A.id && mem.items._Gone && mem.items._Gone.miss, 'จำไว้ในไฟล์: A = id · _Gone = ไม่มี');
    W.reset(); P = load(W); await P.ctx.run(['A', 'Loc', '_Nest', '_Gone']);
    const s2 = P.ctx.stat();
    t(W.calls === 0 && s2.mem === 2 && s2.memMiss === 1 && P.ctx.INDEX.get('A') === W.comps.A, 'เปิดปลั๊กอินใหม่: ไม่สแกนเลย (เรียก ' + W.calls + ' ครั้ง) · จากความจำ ' + s2.mem + ' · จำว่าไม่มี ' + s2.memMiss);
    t(P.logs.some(l => /ล้างความจำ component/.test(l)), 'log บอกทางล้างความจำเมื่อมีตัวที่จำว่าไม่มี');
    W.byId.delete(W.comps.A.id); W.reset(); P = load(W); await P.ctx.run(['A']);
    t(P.ctx.INDEX.get('A') === W.comps.A && W.calls === 1, 'component ที่จำไว้หาด้วย id ไม่เจอ ⇒ หาใหม่ด้วย instance ชื่อตรง');
    W.byId.set(W.comps.A.id, W.comps.A);
    P.ctx.clear(); W.reset(); P = load(W); await P.ctx.run(['A', '_Gone']);
    t(W.calls === 1 && P.ctx.stat().memMiss === 0 && P.ctx.stat().mem === 0 && P.ctx.stat().scanned === 2, 'ล้างความจำแล้ว ⇒ หาใหม่ทั้งหมด ไม่ใช้ความจำเดิม (หา 2 ตัว · เรียก ' + W.calls + ' ครั้ง)');
    /* B ตัวขาดไม่ได้ ชื่อ instance ไม่ตรง ⇒ สแกนทั้งไฟล์แบบ resolveAll */
    W.reset(); P = load(W); await P.ctx.run(['B']);
    t(P.ctx.INDEX.get('B') === W.comps.B && P.ctx.stat().full, 'ตัวขาดไม่ได้ (B) instance ชื่อไม่ตรง ⇒ สแกนทั้งไฟล์ แล้วเจอ');
    W.reset(); P = load(W); await P.ctx.run(['B']);
    t(W.calls === 0 && P.ctx.INDEX.get('B') === W.comps.B, 'รอบถัดไป B มาจากความจำ ไม่สแกน');
    /* ตัวขาดไม่ได้ที่ไม่มีจริง ⇒ หยุดพร้อม error เดิมของ resolveAll และไม่จำว่าไม่มี */
    W.reset(); P = load(W); let err = '';
    try { await P.ctx.run(['Hard']); } catch (e) { err = e.message; }
    const mem2 = JSON.parse(W.pd()['mf-resolve']);
    t(/component ไม่ครบ/.test(err) && !mem2.items.Hard, 'ตัวขาดไม่ได้ที่ไม่มีจริง ⇒ หยุดแบบ resolveAll · ไม่จำว่าไม่มี (เพิ่มแล้วกดใหม่ได้ทันที)');
    /* ความจำเสีย (JSON พัง) ⇒ ทำงานต่อได้ */
    W.setPd({ 'mf-resolve': '{พัง' }); W.reset(); P = load(W); await P.ctx.run(['A']);
    t(P.ctx.INDEX.get('A') === W.comps.A, 'ความจำในไฟล์เสีย ⇒ หาใหม่ ไม่พัง');
    out.forEach(x => console.log(x));
    const bad = out.filter(x => x[0] === '⚠').length;
    console.log(bad ? 'ผล: ⚠ ไม่ผ่าน ' + bad + ' ข้อ' : 'ผล: ผ่านทุกข้อ (' + out.length + ')');
    process.exitCode = bad ? 1 : 0;
  })().catch(e => { console.log('พัง', e); process.exitCode = 1; });
}
