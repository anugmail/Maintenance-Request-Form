/* ============================================================================
   maintainance-feature-plugin/rcache.js — หา component แบบจำผลไว้ (18 พ.ย. 2569)
   ----------------------------------------------------------------------------
   ปัญหา: log จริงในไฟล์ใหญ่ resolveAll (core.js) ใช้ 837 วินาที — component บางตัวนำเข้าจากไลบรารีไม่ได้ (ชิ้นส่วนซ้อนที่ไม่ได้ publish)
          resolveAll จึงไล่ instance ทั้งไฟล์ + getMainComponentAsync ทีละตัว ทุกครั้งที่กดสร้าง
   ทางของเรา (ไม่แก้ core.js · ลำดับการหาเหมือน resolveAll):
     1. นำเข้าด้วย key (preImport ทำพร้อมกันไว้แล้ว ⇒ เร็ว)
     2. component ในไฟล์นี้ (สำเนา)
     3. ความจำของไฟล์ (pluginData บน document ชื่อ mf-resolve): เคยเจอจาก instance ⇒ เปิดด้วย id ทันที · เคยหาไม่เจอ ⇒ ข้าม ไม่สแกนซ้ำ
     4. ไม่มีในความจำ ⇒ ไล่ instance ที่ "ชื่อตรง" (เรียก getMainComponentAsync เฉพาะตัวที่ชื่อตรง) · ตัวที่ขาดไม่ได้ (ไม่ใช่ชิ้นส่วนซ้อน/ของไฟล์ Maintain-D) ยังไม่เจอ ⇒ สแกนทั้งไฟล์แบบ resolveAll
     5. จำผลลงไฟล์ (ทั้งเจอและไม่เจอ) · ปุ่ม "ล้างความจำ component" ในแท็บอัปเดต/ลบ ⇒ รอบหน้าหาใหม่หมด
   ความจำอยู่ในไฟล์ (ไม่ใช่ clientStorage) เพราะ id ของ component ที่ยืมจาก instance ใช้ได้เฉพาะไฟล์นั้น
   ============================================================================ */
const RC_KEY = 'mf-resolve';
const RC_VER = 1;
function rcLoad() {
  try { const j = JSON.parse((figma.root.getPluginData && figma.root.getPluginData(RC_KEY)) || '{}'); return j && j.v === RC_VER && j.items ? j : { v: RC_VER, items: {} }; } catch (e) { return { v: RC_VER, items: {} }; }
}
function rcSave(c) { try { c.at = Date.now(); if (figma.root.setPluginData) figma.root.setPluginData(RC_KEY, JSON.stringify(c)); } catch (e) { /* จำไม่ได้ก็ทำงานต่อ รอบหน้าหาใหม่ */ } }
function rcClear() { try { if (figma.root.setPluginData) figma.root.setPluginData(RC_KEY, ''); } catch (e) { /* */ } }
async function rcNode(id) {
  try { const n = figma.getNodeByIdAsync ? await figma.getNodeByIdAsync(id) : figma.getNodeById ? figma.getNodeById(id) : null; return n && !n.removed && (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') ? n : null; } catch (e) { return null; }
}
/* ไล่ instance ในไฟล์หา component ของ want (Map ชื่อที่จะหา → ชื่อใน INDEX) · byName = เรียกเฉพาะ instance ที่ชื่อตรง · คืนจำนวนครั้งที่เรียก getMainComponentAsync */
async function rcScan(want, found, byName) {
  let calls = 0;
  const left = () => [...new Set(want.values())].filter(n => !found.has(n));
  if (!left().length) return 0;
  for (const i of figma.root.findAllWithCriteria({ types: ['INSTANCE'] })) {
    if (byName && !want.has(i.name)) continue;
    try {
      calls++; const mc = await i.getMainComponentAsync(); if (!mc) continue;
      const h = holderOf(mc), n = want.get(byName ? i.name : h.name);
      if (n && !found.has(n)) found.set(n, h);
    } catch (e) { /* เข้าไม่ถึง ข้าม */ }
    if (!left().length) break;
  }
  return calls;
}
/* ใช้แทน resolveAll(list) — ผลลง INDEX / ROUTE แบบเดียวกัน · คำเตือน/โยน error ตามกติกาเดิมของ resolveAll */
let RC_STAT = null;   // สถิติรอบล่าสุด (เทสอ่าน)
async function resolveLib(list) {
  const t = Date.now(), cache = rcLoad(), st = { fromKey: 0, local: 0, mem: 0, memMiss: 0, scanned: 0, calls: 0, full: false };
  if (figma.loadAllPagesAsync) await figma.loadAllPagesAsync();
  const local = new Map();
  for (const n of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
    if (n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') continue;
    if (!local.has(n.name)) local.set(n.name, n);
  }
  const pending = [], errOf = {};
  for (const name of list) {
    const names = [name].concat(ALIAS[name] || []); let got = null, how = '', importErr = '';
    for (const x of names) {
      const k = KEYS[x]; if (!k) continue;
      try { got = k[1] ? await figma.importComponentSetByKeyAsync(k[0]) : await figma.importComponentByKeyAsync(k[0]); how = 'นำเข้าจากไลบรารี'; break; }
      catch (e) { importErr = (e && e.message) || String(e); }
    }
    if (got) st.fromKey++;
    if (!got) for (const x of names) if (local.has(x)) { got = local.get(x); how = 'สำเนาในไฟล์นี้ ⚠ ลิงก์วนในไฟล์นี้'; st.local++; break; }
    if (importErr && !IMPORT_ERR && !NESTED_ONLY.has(name)) IMPORT_ERR = importErr;
    if (got) { INDEX.set(name, got); ROUTE[name] = how + (got.name !== name ? ' (ชื่อ ' + got.name + ')' : ''); continue; }
    errOf[name] = importErr; pending.push(name);
  }
  const r = await rcFind(pending, cache, (n) => !NESTED_ONLY.has(n) && LOCAL_OPTIONAL.indexOf(n) < 0, st);
  const missing = [];
  for (const name of pending) {
    if (r.has(name)) { const got = r.get(name); INDEX.set(name, got); ROUTE[name] = 'จาก instance ในไฟล์ ⚠ อาจลิงก์ไปไลบรารีที่เปิดไม่ได้' + (got.name !== name ? ' (ชื่อ ' + got.name + ')' : ''); }
    else missing.push(name + (errOf[name] ? ' — นำเข้าไม่ได้: ' + errOf[name] : ''));
  }
  rcSave(cache);
  if (IMPORT_ERR) log('⚠ นำเข้าจากไลบรารีไม่ได้ (' + IMPORT_ERR + ') — ตัวที่ได้ "จาก instance ในไฟล์" จะกด Go to main component ไปไฟล์ Component ที่อ่านมาไม่ได้ · เปิดใช้ไลบรารี (Component) VMS Plus ในไฟล์นี้ (Assets → Libraries) แล้วรันใหม่');
  log('หา component ได้ ' + list.filter(n => INDEX.has(n)).length + '/' + list.length + ' · ไลบรารี ' + st.fromKey + ' · สำเนาในไฟล์ ' + st.local + ' · จากความจำ ' + st.mem + (st.memMiss ? ' · จำไว้ว่าไม่มี ' + st.memMiss : '') + (st.scanned ? ' · สแกนหา ' + st.scanned + ' ตัว (เรียก ' + st.calls + ' ครั้ง' + (st.full ? ' · ทั้งไฟล์' : ' · เฉพาะชื่อตรง') + ')' : ' · ไม่ต้องสแกนไฟล์') + ' ' + secs(t));
  if (st.memMiss) log('  · จำไว้ว่าไฟล์นี้ไม่มี ' + st.memMiss + ' ตัว (ไม่สแกนซ้ำ) — ถ้าเพิ่งเพิ่ม component กด "ล้างความจำ component" ในแท็บอัปเดต/ลบ');
  RC_STAT = st;
  const soft = missing.filter(m => NESTED_ONLY.has(m.split(' — ')[0]));
  missing.filter(m => LOCAL_OPTIONAL.includes(m.split(' — ')[0])).forEach(m => log('  · ไม่พบ ' + m.split(' — ')[0] + ' ในไฟล์นี้ (component ของไฟล์ Maintain-D) — ใช้แบบเดิมแทน'));
  soft.forEach(m => log('  · ไม่พบ ' + m.split(' — ')[0] + ' — ไม่เป็นไร ใช้ตัวที่ซ้อนอยู่ใน component อื่น'));
  const hard = missing.filter(m => !NESTED_ONLY.has(m.split(' — ')[0]) && !LOCAL_OPTIONAL.includes(m.split(' — ')[0]));
  if (hard.length) {
    log('ไม่พบ ' + hard.length + ' ตัวที่ต้องสร้างเอง:'); hard.forEach(m => log('  ✗ ' + m));
    throw new Error('component ไม่ครบ — ถ้าขึ้น "นำเข้าไม่ได้" ให้เปิดใช้ไลบรารี VMS Plus ในไฟล์นี้ (Assets → Libraries) แล้วรันใหม่');
  }
}
/* ส่วนกลางของข้อ 3–5: names = ชื่อที่ยังหาไม่ได้ · mustFull(n) = ตัวที่ขาดไม่ได้ (ยอมสแกนทั้งไฟล์) · คืน Map ชื่อ → component · แก้ cache ในที่ */
async function rcFind(names, cache, mustFull, st) {
  const found = new Map(), want = new Map();
  for (const name of names) {
    const c = cache.items[name];
    if (c && c.id) { const n = await rcNode(c.id); if (n) { found.set(name, n); st.mem++; continue; } }   // id ใช้ไม่ได้แล้ว (ถูกลบ) ⇒ หาใหม่
    if (c && c.miss) { st.memMiss++; continue; }
    [name].concat(ALIAS[name] || []).forEach(x => want.set(x, name));
  }
  const todo = [...new Set(want.values())];
  if (todo.length) {
    st.scanned += todo.length;
    st.calls += await rcScan(want, found, true);
    const hard = todo.filter(n => !found.has(n) && mustFull(n));
    if (hard.length) { const w2 = new Map(); hard.forEach(n => [n].concat(ALIAS[n] || []).forEach(x => w2.set(x, n))); st.full = true; st.calls += await rcScan(w2, found, false); }
    for (const n of todo) { if (found.has(n)) cache.items[n] = { id: found.get(n).id, name: found.get(n).name }; else if (mustFull(n)) delete cache.items[n]; else cache.items[n] = { miss: 1 }; }   // ตัวที่ขาดไม่ได้ไม่จำว่า "ไม่มี" (รอบหน้าหาใหม่ทันทีหลังผู้ใช้เพิ่ม)
  }
  return found;
}
