/* ============================================================================
   maintainance-feature-plugin/update.js — แท็บ "อัปเดต / ลบ" (18 พ.ย. 2569 · ผู้ใช้ขอ)
   ----------------------------------------------------------------------------
   ก. ลบส่วนที่สร้างแล้ว — Feature ที่ติ๊ก × ส่วน Happy flow / ทุกเคส ⇒ ลบหัวส่วน แถบ Header ป้าย Device และจอของส่วนนั้น (ทุกชุดบน Page)
      หาจากป้าย pluginData 'mf' ที่ featureGrid ติดไว้ ('happy' 'happy-<j>' = Happy flow · 'full' '<j>' = ทุกเคส · 'title' = Title Feature ไม่ลบเด็ดขาด)
      ชิ้นที่ไม่มีป้าย ⇒ ดูตำแหน่ง: อยู่ใต้หัวส่วนไหน (หัวที่ใกล้ที่สุดด้านบน และแนวนอนอยู่ในช่วงของหัวนั้น)
      ชิ้นที่ไม่ใช่ของปลั๊กอิน (ไม่มีป้าย และชื่อไม่ขึ้นต้น "MF / " หรือ "MF · ") ไม่แตะ · ต้องยืนยันจำนวนก่อนลบ · ลบแล้วไม่ขยับของอื่น
   ข. อัปเดตจอที่เปลี่ยน — เทียบลายเซ็น (sig.js) ที่เก็บในจอกับลายเซ็นของโค้ดตอนนี้ ⇒ สร้างใหม่เฉพาะจอที่ต่าง วางที่เดิม (parent · ลำดับ layer · x/y)
      จอที่ยังไม่มีบนหน้า วางในช่องของมันถ้าช่องว่าง · จอที่ไม่มีใน Feature แล้ว รายงานเฉยๆ ไม่ลบ
      จอเก่าที่สร้างก่อนมีลายเซ็น ⇒ เลือกได้: "เก็บเป็นฐาน" (จำลายเซ็นตอนนี้ ไม่สร้าง) หรือ "สร้างใหม่"
   ค. สร้างจอที่เลือกใหม่ — เลือกเฟรมจอ MF / … ใน Figma แล้วกด (แนวเดียวกับ replaceSelected ของพี่นุ 890d54c: จับคู่ด้วยชื่อเคส วางที่ตำแหน่งและลำดับ layer เดิม)
   ทุกโหมด: ไม่แตะจอที่ไม่เกี่ยว · ย้อนได้ด้วย Cmd+Z หรือ Version history
   ============================================================================ */
const FRAME_CODE_RE = /^MF \/ (H?\d+(?:\.\d+)+) · (.+?) › (.+?) — (.+?)( · mobile)?$/;
const SECTION_OF_TAG = (t) => t === 'title' ? 'title' : t === 'happy' || /^happy-\d+$/.test(t) ? 'happy' : t === 'full' || /^\d+$/.test(t) ? 'full' : '';
const PART_NAME = { happy: 'Happy flow', full: 'ทุกเคส' };
const tagOf = (n) => { try { return (n.getPluginData && n.getPluginData(MF_TAG)) || ''; } catch (e) { return ''; } };
const pdata = (n, k) => { try { return (n.getPluginData && n.getPluginData(k)) || ''; } catch (e) { return ''; } };

/* Page ของ Feature ที่มีอยู่แล้ว — ไม่สร้าง · ต่างจาก featurePage(false) ตรงที่ยอมให้มีของคนอื่นปนบน Page (ผู้ใช้วางของเพิ่มเองได้) */
async function existingPage() {
  const name = FEATURE_PAGE[0], byName = (n) => figma.root.children.find(p => p.type === 'PAGE' && p.name === n);
  const p = byName(ALT_PAGE(name)) || byName(name);
  if (p && p.loadAsync) await p.loadAsync();
  return p || null;
}
/* ไล่ชิ้นบน Page แบบลึก (ผู้ใช้อาจย้ายเข้า Section / Group) · ไม่เข้าไปในจอ */
function walkPage(page, fn) {
  (function w(node) { for (const c of (node.children || []).slice()) { fn(c); if (c.children && (c.type === 'SECTION' || c.type === 'GROUP') ) w(c); } })(page);
}

/* ======================= ก. ลบส่วน ======================= */
function sectionPieces(page, parts) {
  const all = [], heads = [];
  walkPage(page, (n) => {
    const nm = n.name || '', t = tagOf(n), mine = !!t || ownedNode(n);
    if (!mine) return;
    const h = nm.match(HEAD_RE);
    if (h) heads.push({ n, kind: h[1] === 'Feature' ? 'title' : /^Happy flow/.test(h[2]) ? 'happy' : 'full' });
    all.push({ n, t });
  });
  const abs = (n) => (n.absoluteBoundingBox || { x: n.x, y: n.y, width: n.width });
  const byPos = (n) => {   // หัวที่ใกล้ที่สุดด้านบน ที่แนวนอนครอบชิ้นนี้ (ป้าย Device อยู่ซ้ายหัว GRID.side + GRID.gap)
    const b = abs(n); let best = null;
    for (const h of heads) { const hb = abs(h.n); if (hb.y <= b.y + 1 && b.x >= hb.x - GRID.side - GRID.gap - 50 && b.x < hb.x + hb.width && (!best || hb.y > abs(best.n).y)) best = h; }
    return best ? best.kind : '';
  };
  const out = [], cnt = { head: 0, bar: 0, dev: 0, screen: 0 }; let guessed = 0, unknown = 0;
  for (const { n, t } of all) {
    if (/^MF · Feature /.test(n.name || '') || t === 'title') continue;   // Title Feature ไม่ลบเด็ดขาด
    let kind = SECTION_OF_TAG(t);
    if (!kind) { kind = byPos(n); if (kind === 'title' || !kind) { unknown++; continue; } guessed++; }
    if (parts.indexOf(kind) < 0) continue;
    out.push(n);
    const nm = n.name || '';
    if (n.type === 'FRAME' && nm.indexOf(FEATURE_PREFIX + ' / ') === 0) cnt.screen++;
    else if (HEAD_RE.test(nm)) cnt.head++;
    else if (LABEL_RE.test(nm)) cnt.dev++;
    else cnt.bar++;
  }
  return { list: out, cnt, guessed, unknown };
}
async function deleteSections(msg, ids) {
  const parts = (msg.parts || []).filter(p => PART_NAME[p]);
  if (!parts.length) { log('✗ ยังไม่ได้ติ๊กส่วนที่จะลบ (Happy flow / ทุกเคส)'); return done([], [], 0); }
  const per = [];
  for (const id of ids) {
    useFeature(id);
    const page = await existingPage();
    if (!page) { per.push({ id, title: F.title, none: true }); continue; }
    per.push(Object.assign({ id, title: F.title, page }, sectionPieces(page, parts)));
  }
  const total = per.reduce((a, p) => a + (p.list ? p.list.length : 0), 0);
  const what = parts.map(p => PART_NAME[p]).join(' + ');
  const lines = per.map(p => p.none ? p.title + ': ยังไม่มี Page' : p.title + ': ' + p.list.length + ' ชิ้น (หัวส่วน ' + p.cnt.head + ' · แถบ ' + p.cnt.bar + ' · ป้าย ' + p.cnt.dev + ' · จอ ' + p.cnt.screen + ')' + (p.guessed ? ' · ดูจากตำแหน่ง ' + p.guessed : ''));
  if (!msg.confirm) {
    log('ตรวจก่อนลบส่วน ' + what + ':'); lines.forEach(l => log('  · ' + l));
    log(total ? 'รอยืนยัน: จะลบ ' + total + ' ชิ้น · Title Feature และของที่ไม่ใช่ของปลั๊กอินไม่ถูกแตะ' : 'ไม่มีชิ้นของส่วน ' + what + ' ให้ลบ');
    figma.ui.postMessage({ type: 'mf-confirm', action: 'delete', total, title: 'ลบส่วน ' + what, lines, payload: { parts, features: ids } });
    return true;
  }
  if (msg.expect !== total) { log('✗ จำนวนชิ้นเปลี่ยนจากตอนตรวจ (' + msg.expect + ' → ' + total + ') ยังไม่ลบ — กดตรวจใหม่อีกครั้ง'); return done([], [], ids.length); }
  let gone = 0;
  for (const p of per) if (p.list) { for (const n of p.list) { try { if (!n.removed) { n.remove(); gone++; } } catch (e) { warn('ลบ ' + n.name, e); } } log('✓ ' + p.title + ': ลบส่วน ' + what + ' แล้ว ' + p.list.length + ' ชิ้น'); }
  log(''); log('ลบแล้ว ' + gone + ' ชิ้น · ของอื่นอยู่ที่เดิม ไม่ถูกขยับ · ย้อนได้ด้วย Cmd+Z');
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน)' : 'ไม่มีคำเตือน ✓');
  return done(per.filter(p => p.list).map(p => p.title), [], ids.length);
}
function done(ok, fail, total) { figma.ui.postMessage({ type: 'build-all-done', ok, fail, total }); return true; }

/* ======================= ข. อัปเดตจอที่เปลี่ยน ======================= */
/* ทุกจอของ Feature ตามที่ featureGrid จัด (x ตามผังก่อนเลื่อนทั้งชุด) · row = แถวเดียวกัน (Happy/ทุกเคส × journey) */
function featureItems(pick) {
  const js = pick && pick.length ? FEATURE.filter((j, i) => pick.indexOf(String(i)) >= 0) : FEATURE, out = [];
  for (const j of js) {
    const ji = FEATURE.indexOf(j);
    for (const pg of happyPages(ji)) for (const it of pg.items) out.push({ it, row: 'h' + ji, title: j.title + ' (Happy flow)', pg: pg.name, ji });
    for (const pg of featurePages(j, ji)) for (const it of pg.items) out.push({ it, row: 'f' + ji, title: j.title, pg: pg.name, ji });
  }
  return { out, js: js.map(j => FEATURE.indexOf(j)) };
}
/* จอบนหน้า: รหัส|อุปกรณ์ → เฟรมที่สร้างล่าสุด (หลายชุดบนหน้า ⇒ ชุดล่าสุดตามแบบ fjShots) */
function pageFrames(page) {
  const map = new Map(); let older = 0;
  walkPage(page, (n) => {
    if (n.type !== 'FRAME') return; const m = (n.name || '').match(FRAME_CODE_RE); if (!m) return;
    const k = m[1] + '|' + (m[5] ? 'm' : 'd'), cur = map.get(k);
    if (cur) older++;
    if (!cur || +pdata(n, 'builtAt') >= +pdata(cur, 'builtAt')) map.set(k, n);
  });
  return { map, older };
}
/* วางจอใหม่แทนที่เฟรมเดิม: parent · ลำดับ layer · x/y เดิม · ป้าย mf เดิม แล้วลบเฟรมเดิม */
async function replaceFrame(page, old, x, mob) {
  const parent = old.parent, at = { x: old.x, y: old.y }, tag = tagOf(old);
  const s = await makeScreen(page, x.it, mob, FEATURE_PREFIX, x.title, x.pg, at, (n) => {
    parent.insertChild(Math.min(parent.children.indexOf(old), parent.children.length), n); n.x = at.x; n.y = at.y;
    try { if (tag && n.setPluginData) n.setPluginData(MF_TAG, tag); } catch (e) { /* */ }
  });
  if (!s) return null;
  try { old.remove(); } catch (e) { warn('ลบจอเดิม ' + old.name, e); }
  return s;
}
/* แถบเคสเหนือจอ desktop: ชื่อเคสเปลี่ยน ⇒ แทนแถบที่ x เดียวกัน (ที่เดิม · กว้างเดิม) */
async function refreshBar(page, frame, it) {
  const want = FEATURE_PREFIX + ' · ' + it.code + ' ' + it.label; let bar = null;
  walkPage(page, (n) => { const m = (n.name || '').match(BAR_RE); if (m && m[1] === it.code && Math.abs(n.x - frame.x) < 1 && n.y < frame.y && (!bar || n.y > bar.y)) bar = n; });
  if (!bar || bar.name === want) return false;
  CREATED = [];
  try {
    const n = await flowBar(FEATURE_PREFIX, it.code, it.label, barState(it.code), bar.width), parent = bar.parent;
    parent.insertChild(parent.children.indexOf(bar), n); n.x = bar.x; n.y = bar.y;
    try { const t = tagOf(bar); if (t) n.setPluginData(MF_TAG, t); } catch (e) { /* */ }
    bar.remove(); CREATED = []; return true;
  } catch (e) { warn('แถบ ' + it.code, e); dropMade(); return false; }
}
/* ช่องของจอที่ยังไม่มี: เทียบจอข้างเคียงในแถวเดียวกัน (ชุดเดียวกัน) ⇒ x/y · ช่องต้องว่าง (ไม่ทับเฟรมใด) */
function slotFor(page, x, mob, items, frames) {
  const sib = items.map(o => ({ o, f: frames.get(o.it.code + '|' + (mob ? 'm' : 'd')) })).find(p => p.o.row === x.row && p.f);
  if (!sib) return null;
  const dx = sib.f.x - sib.o.it.x, pos = { x: x.it.x + dx, y: sib.f.y, parent: sib.f.parent, sib: sib.f, sibItem: sib.o.it };
  const w = mob ? GRID.mobW : GRID.colW, h = mob ? GRID.mobH : GRID.deskH;
  const hit = (sib.f.parent.children || []).some(n => n.type === 'FRAME' && n.x < pos.x + w && n.x + n.width > pos.x && n.y < pos.y + h && n.y + n.height > pos.y);
  return hit ? Object.assign(pos, { busy: true }) : pos;
}
async function updateChanged(msg, ids) {
  const devices = devOf({ devices: msg.devices }), srcOk = sigSourceOk(), plans = [];
  for (const id of ids) {
    useFeature(id);
    const page = await existingPage();
    if (!page) { plans.push({ id, title: F.title, none: true }); continue; }
    const pick = (msg.picks || {})[id] || (ids.length > 1 ? null : msg.pick);
    const { out: items, js } = featureItems(pick), { map: frames, older } = pageFrames(page);
    const P = { id, title: F.title, page, items, frames, older, changed: [], unknown: [], missing: [], same: 0, nofn: 0, removed: [] };
    const keys = new Set();
    for (const x of items) for (const mob of devices) {
      const k = x.it.code + '|' + (mob ? 'm' : 'd'); keys.add(k);
      if (!x.it.fn) { P.nofn++; continue; }
      const f = frames.get(k), sig = itemSig(x.it, mob, x.title, x.pg), old = f && pdata(f, 'mfSig');
      if (!f) P.missing.push({ x, mob, sig });
      else if (!old) P.unknown.push({ x, mob, f, sig });
      else if (old !== sig || msg.force) P.changed.push({ x, mob, f, sig });
      else P.same++;
    }
    for (const [k, f] of frames) { const [code, d] = k.split('|'); if (!keys.has(k) && devices.indexOf(d === 'm') >= 0 && js.indexOf(+code.replace('H', '').split('.')[0] - 1) >= 0) P.removed.push(f.name); }
    plans.push(P);
  }
  const live = plans.filter(p => !p.none), sum = (k) => live.reduce((a, p) => a + (Array.isArray(p[k]) ? p[k].length : p[k]), 0);
  const legacy = msg.legacy === 'rebuild' ? 'rebuild' : 'baseline';
  const baseWork = sum('changed') + sum('missing'), work = baseWork + (legacy === 'rebuild' ? sum('unknown') : 0);   // total ที่ส่งไปหน้าต่าง = baseWork (จอเก่าแยกนับใน unknown)
  const lines = plans.map(p => p.none ? p.title + ': ยังไม่มี Page — กดสร้างในแท็บสร้างจอก่อน' : p.title + ': ' + (msg.force ? 'สร้างใหม่ ' : 'เปลี่ยน ') + p.changed.length + ' · ยังไม่มีบนหน้า ' + p.missing.length + ' · ไม่รู้ลายเซ็น ' + p.unknown.length + ' · ไม่เปลี่ยน ' + p.same + (p.removed.length ? ' · ไม่มีใน Feature แล้ว ' + p.removed.length + ' (ไม่ลบ)' : '') + (p.older ? ' · ชุดเก่าบนหน้า ' + p.older + ' (ไม่แตะ)' : ''));
  if (!msg.confirm) {
    log('ตรวจจอที่เปลี่ยน (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + '):'); lines.forEach(l => log('  · ' + l));
    live.forEach(p => p.removed.slice(0, 5).forEach(n => log('    ไม่มีใน Feature แล้ว: ' + n)));
    if (!srcOk && !msg.force) log('ⓘ เครื่องนี้อ่านซอร์สฟังก์ชันจอไม่ได้ ลายเซ็นไว้ใจไม่ได้ — ติ๊ก "สร้างใหม่ทุกจอของ journey ที่ติ๊ก" หรือใช้ "สร้างจอที่เลือกใหม่" แทน');
    figma.ui.postMessage({ type: 'mf-confirm', action: 'update', total: baseWork, unknown: sum('unknown'), title: msg.force ? 'สร้างใหม่ทุกจอของ journey ที่ติ๊ก' : 'อัปเดตจอที่เปลี่ยน', lines, blocked: !srcOk && !msg.force, payload: { features: ids, picks: msg.picks, pick: msg.pick, devices: msg.devices, force: !!msg.force } });
    return true;
  }
  if (!srcOk && !msg.force) { log('✗ ยังไม่อัปเดต — เครื่องนี้อ่านซอร์สฟังก์ชันจอไม่ได้ (ลายเซ็นไว้ใจไม่ได้)'); return done([], [], ids.length); }
  if (msg.expect !== baseWork || (msg.expectUnknown != null && msg.expectUnknown !== sum('unknown'))) { log('✗ จำนวนจอเปลี่ยนจากตอนตรวจ (' + msg.expect + ' → ' + baseWork + (msg.expectUnknown != null ? ' · จอเก่า ' + msg.expectUnknown + ' → ' + sum('unknown') : '') + ') ยังไม่อัปเดต — กดตรวจใหม่อีกครั้ง'); return done([], [], ids.length); }
  errors.length = 0; const t0 = Date.now(); orphans = 0; TIMES = []; capped = 0;
  if (work) { log('นำเข้า component จากไลบรารี…'); await resolveFast(); }
  let n = 0, based = 0, placed = 0, bars = 0; const ok = [], notPlaced = [];
  for (const p of live) {
    useFeature(p.id); await figma.setCurrentPageAsync(p.page);
    if (legacy === 'baseline') for (const u of p.unknown) { try { u.f.setPluginData('mfSig', u.sig); u.f.setPluginData('mfFeature', p.id); based++; } catch (e) { warn('เก็บลายเซ็น ' + u.f.name, e); } }
    const redo = p.changed.concat(legacy === 'rebuild' ? p.unknown : []);
    for (const c of redo) {
      const s = await replaceFrame(p.page, c.f, c.x, c.mob);
      if (s) { n++; log('  · ' + n + '/' + work + ' แทนที่ ' + s.name); if (!c.mob && await refreshBar(p.page, s, c.x.it)) bars++; }
    }
    for (const m of p.missing) {
      const pos = slotFor(p.page, m.x, m.mob, p.items, p.frames);
      if (!pos || pos.busy) { notPlaced.push(p.title + ' ' + m.x.it.code + (m.mob ? ' mobile' : '') + (pos ? ' (ช่องถูกใช้แล้ว — โครงแถวเปลี่ยน)' : ' (ไม่มีจออื่นในแถวนี้ให้เทียบตำแหน่ง)')); continue; }
      const tag = tagOf(pos.sib), parent = pos.parent;
      const s = await makeScreen(p.page, m.x.it, m.mob, FEATURE_PREFIX, m.x.title, m.x.pg, pos, (nn) => { parent.insertChild(parent.children.indexOf(pos.sib), nn); nn.x = pos.x; nn.y = pos.y; try { if (tag) nn.setPluginData(MF_TAG, tag); } catch (e) { /* */ } });
      if (!s) continue;
      n++; placed++; p.frames.set(m.x.it.code + '|' + (m.mob ? 'm' : 'd'), s); log('  · ' + n + '/' + work + ' วางจอใหม่ ' + s.name);
      if (!m.mob) {   // แถบเคสเหนือจอ (แถวแถบเดียวกับแถบของจอข้างเคียง)
        let sb = null; walkPage(p.page, (x) => { const mm = (x.name || '').match(BAR_RE); if (mm && mm[1] === pos.sibItem.code && Math.abs(x.x - pos.sib.x) < 1 && x.y < pos.sib.y) sb = x; });
        if (sb) { CREATED = []; try { const b = await flowBar(FEATURE_PREFIX, m.x.it.code, m.x.it.label, barState(m.x.it.code), GRID.colW); sb.parent.insertChild(sb.parent.children.indexOf(sb), b); b.x = pos.x; b.y = sb.y; try { if (tagOf(sb)) b.setPluginData(MF_TAG, tagOf(sb)); } catch (e) { /* */ } bars++; } catch (e) { warn('แถบ ' + m.x.it.code, e); dropMade(); } CREATED = []; }
      }
    }
    ok.push(p.title);
  }
  log('');
  log('อัปเดตแล้ว ' + n + ' จอ (แทนที่ ' + (n - placed) + ' · วางจอใหม่ ' + placed + ')' + (bars ? ' · แถบเคส ' + bars : '') + (based ? ' · เก็บลายเซ็นเป็นฐาน ' + based + ' จอ' : '') + ' · จอที่ไม่เปลี่ยนไม่ถูกแตะ');
  if (notPlaced.length) { log('ⓘ วางไม่ได้ ' + notPlaced.length + ' จอ — ติ๊ก journey นั้นแล้วกด "สร้าง" ในแท็บสร้างจอ (ได้ชุดใหม่ต่อใต้):'); notPlaced.slice(0, 10).forEach(x => log('    ' + x)); }
  const rm = live.reduce((a, p) => a + p.removed.length, 0); if (rm) log('ⓘ จอที่ไม่มีใน Feature แล้ว ' + rm + ' จอ ยังอยู่บนหน้า (ไม่ลบเอง) — ลบเองได้');
  if (orphans) log('ชิ้นที่หลุดนอกจอระหว่างสร้าง (ลบแล้ว): ' + orphans);
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  log('ใช้เวลา ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
  return done(ok, [], ids.length);
}

/* ======================= ค. สร้างจอที่เลือกใหม่ ======================= */
async function rebuildSelected() {
  errors.length = 0; const t0 = Date.now(); orphans = 0; TIMES = []; capped = 0;
  const page = figma.currentPage;
  const f = MF_FEATURES.find(x => page.name === x.page[0] || page.name === ALT_PAGE(x.page[0]));
  const up = (n) => { for (let p = n; p && p.type !== 'PAGE'; p = p.parent) if (p.type === 'FRAME' && FRAME_CODE_RE.test(p.name || '')) return p; return null; };
  const sel = [...new Set((page.selection || []).map(up).filter(Boolean))];
  if (!f) { log('✗ Page นี้ ("' + page.name + '") ไม่ใช่ Page ของ Feature ใด — เปิด Page ของ Feature แล้วเลือกจอ "MF / …"'); return done([], [], 1); }
  if (!sel.length) { log('✗ ยังไม่ได้เลือกจอ "MF / …" บนหน้านี้ — คลิกเลือกเฟรมจอ (กด Shift เลือกหลายจอ) แล้วกดอีกครั้ง'); return done([], [], 1); }
  useFeature(f.id);
  const { out: items } = featureItems(null);
  log('สร้างจอที่เลือกใหม่ ' + sel.length + ' จอ · Feature ' + F.title);
  log('นำเข้า component จากไลบรารี…'); await resolveFast();
  let n = 0, skip = 0; const made = [];
  for (const old of sel) {
    const m = old.name.match(FRAME_CODE_RE), mob = !!m[5] || old.width <= 500, happy = m[1][0] === 'H';
    const pool = items.filter(x => (x.it.code[0] === 'H') === happy);
    let x = pool.find(o => o.it.code === m[1] && o.it.label === m[4]) || pool.find(o => o.it.label === m[4]) || null, note = '';
    if (!x) { x = pool.find(o => o.it.code === m[1]) || null; if (x) note = ' (ชื่อเคสเปลี่ยน: "' + m[4].slice(0, 40) + '" → "' + x.it.label.slice(0, 40) + '")'; }
    if (!x || !x.it.fn) { skip++; log('  · ข้าม "' + old.name + '" — ไม่มีเคสนี้ใน Feature ตอนนี้ ไม่แตะ'); continue; }
    const s = await replaceFrame(page, old, x, mob);
    if (s) { n++; made.push(s); log('  · ' + n + '/' + sel.length + ' แทนที่ ' + s.name + (x.it.code !== m[1] ? ' (รหัสเดิม ' + m[1] + ')' : '') + note); if (!mob) await refreshBar(page, s, x.it); }
  }
  figma.currentPage.selection = made;
  log('');
  log('แทนที่แล้ว ' + n + ' จอ · ข้าม ' + skip + ' · จอที่ไม่ได้เลือกไม่ถูกแตะ · ส่วนที่แก้มือในจอที่เลือกหาย ย้อนได้ด้วย Cmd+Z หรือ Version history');
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  log('ใช้เวลา ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
  return done([F.title], [], 1);
}

/* ตัวรับคำสั่งของแท็บอัปเดต/ลบ — คืน true = จัดการแล้ว */
async function updHandle(msg) {
  const ids = Array.isArray(msg.features) && msg.features.length ? msg.features : [msg.feature || MF_FEATURES[0].id];
  if (msg.type === 'delete-section') return deleteSections(msg, ids);
  if (msg.type === 'update-changed') return updateChanged(msg, ids);
  if (msg.type === 'rebuild-selected') return rebuildSelected();
  if (msg.type === 'rc-clear') { rcClear(); RESOLVED = false; log('✓ ล้างความจำ component ของไฟล์นี้แล้ว — รอบหน้าหาใหม่ทั้งหมด (ครั้งแรกอาจนานขึ้น)'); return done(['ล้างความจำ'], [], 1); }
  return false;
}
