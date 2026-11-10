/* ============================================================================
   Maintain-D — Login และมุมมองตาม role · ปลั๊กอินแยก (เจ้าของงานสั่ง 30 ต.ค. 2569 "แยก plug-in ออกมาอีกอันนึง")
   ----------------------------------------------------------------------------
   ที่มา: ล็อกอินระบบจริง vmsplus-dev (บัญชีทดสอบที่เจ้าของงานให้) + โค้ด VMS Plus · เอกสาร Diagram/08-login-และสิทธิ์/ (01 ลำดับ login · 02 สิทธิ์ Overhaul · 03 AC รายจอ)
   - บล็อก A: หน้า login เป็นของ VMS Plus / SSO กฟภ. ที่มีอยู่แล้ว ⇒ เจ้าของงานเลือก "วางภาพหน้าจริง" (ไลบรารีและ UI Release#2 ไม่มีหน้า login)
     - ภาพอยู่นอกรีโป ~/PEA/Maintain-D/vmsplus-login/ ก๊อปเข้า figma-export/out/figjam/login/
     - หน้าต่างปลั๊กอินดึงจาก serve.js (localhost:8124) ส่งเข้ามาเป็นข้อความ 'shots' ก่อนสั่งสร้าง
   - บล็อก B: หน้ารายการแผน Overhaul หลัง login ของ 3 role (persona ชุดเดียวกับ design-mock/auth/personas.json)
     - ปุ่มที่ role นั้นกดไม่ได้ = ซ่อน ไม่ disable (R30 · hide-not-disable-by-role)
   - วางต่อใต้ของเดิมบนหน้าที่เปิดอยู่ ไม่สร้างหน้าใหม่ (เจ้าของงานสั่ง 30 ต.ค. 2569 "เขียนเพิ่มจากหน้าที่เลือก")
   - AC รายจอแม่แบบของทีมวางใต้จอคอลัมน์เดียวกัน (const AC ฝังตอน build จาก build.json "ac") ⇒ export แล้วเห็น UI กับ AC คู่กัน
   ============================================================================ */

const PLUGIN = { prefix: 'LG', menu: 'จัดการงาน Overhaul', searchHint: 'ค้นหาเลขแผน, ชื่อแผน, เลขศูนย์ต้นทุน' };

const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Table', 'Table header', 'Table pagination', 'Alert',
  'Primary button', 'Secondary button', 'Background overlay', 'Modal', 'add-24-300-round', 'filter_list-24-400-round', 'search-24-300-round',
  'keyboard_arrow_right-20-400-round', 'more_horiz-20-400-round', 'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header'];
const NESTED = ['Nav button', 'Sort icon', 'Button groups pagination item', 'Tertiary button', 'Tertiary brand button', 'Badge outline', 'Pill outline',
  'Mobile table item', 'Table cell', 'Table header cell', 'Text input', 'Badge outline with remove icon'];
const LOCAL_OPTIONAL = ['Device Type', 'Component 1', 'Header'];
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* ---------- ภาพหน้าจริง (บล็อก A) ---------- */
const SHOTS = {};   // ชื่อไฟล์ (ไม่มี .png) → bytes · '-mobile' = ภาพ 402×874
async function shotScreen(name, key) {
  const f = frame(PLUGIN.prefix + ' / ' + name, 'VERTICAL', { fill: WHITE });   // auto layout ⇒ วาง modal ทับด้วย overlay ได้
  if (PLACE) { f.x = PLACE.x; f.y = PLACE.y; }
  f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; f.resize(VW(), VH()); f.clipsContent = true;
  const k = key + (MOB ? '-mobile' : ''), bytes = SHOTS[k];
  if (bytes) f.fills = [{ type: 'IMAGE', imageHash: figma.createImage(bytes).hash, scaleMode: 'FILL' }];
  else {
    warn('ภาพหน้าจริง ' + k, 'ยังไม่ได้โหลด — รัน node figma-export/serve.js (ภาพอยู่ out/figjam/login/) แล้วกดสร้างใหม่');
    add(f, alertBox('Warning', 'ยังไม่มีภาพหน้าจริง ' + k, 'รัน node figma-export/serve.js แล้วกดสร้างใหม่'), 'h');
  }
  return f;
}
async function noAccess(name) {   // A.4 หน้าเข้าสู่ระบบ + modal ไม่มีสิทธิ์ (หน้าจริงมีแค่ปุ่ม ✕ — ใช้ปุ่ม "ปิด" ของ Modal ในไลบรารี · จดใน AC)
  const s = await shotScreen(name, '01-หน้าเข้าสู่ระบบ');
  await confirm(s, { title: 'คุณไม่มีสิทธิเข้าใช้งานระบบ', sub: 'กรุณาติดต่อผู้ดูแลหากต้องการเข้าใช้งาน', ok: 'ปิด' });
  s.findAll(n => n.type === 'INSTANCE' && n.name === 'Secondary button').forEach(b => { b.visible = false; });   // ปุ่มเดียว
  return s;
}

/* ---------- รายการแผนตาม role (บล็อก B) — ชื่อสถานะชุด status final 30 ต.ค. 2569 ---------- */
const STATUS = { P1: ['รอเลข Purchase Order', 'Gray'], P2: ['กำลังดำเนินการ Purchase Order', 'Info'], P3: ['เสร็จสิ้น', 'Success'] };
/* persona = design-mock/auth/personas.json (roles · หน่วยงาน) · edit = ปุ่มสร้าง/… · rows = ขอบเขตรถ (OH-Permission ✅ CF) */
const PERSONA = {
  kbk: { who: 'นายวิชัย ทองดี · กบค.', roles: 'admin-super', edit: true, rows: () => PLANS },
  kry: { who: 'นางสาวพิมพ์ชนก ศรีสุข · กรย. กฟต.3', roles: 'admin-region', edit: false, rows: () => PLANS.filter(p => p[7] === 'ใต้' && p[5] !== 'P1') },
  owner: { who: 'นางวรรณา แก้วมณี · กฟฟ.สงขลา', roles: 'admin-department', edit: false, rows: () => PLANS.filter(p => p[0] === '123460') },
};
/* [เลขแผน, ชื่อแผน, ประเภทงบ, งบประมาณ, ความคืบหน้า, สถานะ, วันที่สร้าง, ภาค] — ชุดเดียวกับหน้ารายการแผนของปลั๊กอิน Overhaul (ค่าสมมติ) · รถ 72-6648 สงขลา อยู่แผน 123460 */
const PLANS = [
  ['123460', 'Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้', 'งบลงทุน', '20,000,000', '0/5', 'P2', '21 ต.ค. 2569', 'ใต้'],
  ['123459', 'Overhaul รถกระเช้า ภาคเหนือ', 'งบลงทุน', '15,000,000', '-', 'P1', '20 ต.ค. 2569', 'เหนือ'],
  ['123458', 'Overhaul รถกระเช้า ภาคกลาง', 'งบลงทุน', '12,500,000', '-', 'P1', '19 ต.ค. 2569', 'กลาง'],
  ['123457', 'Overhaul รถกระเช้า ภาคอีสาน', 'งบลงทุน', '18,000,000', '5/10', 'P2', '18 ต.ค. 2569', 'อีสาน'],
  ['123456', 'จัดซื้อรถกระเช้า ภาคใต้', 'งบลงทุน', '25,000,000', '7/15', 'P2', '17 ต.ค. 2569', 'ใต้'],
  ['123455', 'ปรับปรุงรถบริการ ภาคเหนือ', 'งบลงทุน', '8,500,000', '3/5', 'P2', '16 ต.ค. 2569', 'เหนือ'],
  ['123452', 'ปรับปรุงรถกระเช้า ภาคใต้', 'งบลงทุน', '9,500,000', '-', 'P1', '13 ต.ค. 2569', 'ใต้'],
  ['123401', 'Overhaul ประจำปีงบ 2568 — รถเครน', 'งบลงทุน', '9,800,000', '2/2', 'P3', '15 ก.ค. 2568', 'กลาง'],
];
const PLAN_COLS = [['หมายเลขแผน', 130, 'Lead text', 'Down'], ['ชื่อแผน', 0, 'Text', 'Swap'], ['ประเภทงบ', 130], ['งบประมาณ (บาท)', 150], ['ความคืบหน้า', 120], ['สถานะ', 240, 'Badge', 'Swap'], ['วันที่สร้าง', 120], ['', 72]];
async function planList(name, id) {
  const p = PERSONA[id], rows = p.rows();
  const { scr, page } = await shell(name, { title: 'จัดการงาน Overhaul', primary: p.edit ? 'สร้างแผน Overhaul' : '' });   // ไม่มีสิทธิ์สร้าง = ไม่มีปุ่ม (R30)
  if (!p.edit) { const ph = scr.findOne(n => n.type === 'INSTANCE' && n.name === 'Page header'); const acts = ph && find(ph, 'Actions'); if (acts) acts.visible = false; }   // ซ่อนชั้นปุ่มให้แน่ (แบบ VIEW ของปลั๊กอิน Overhaul) — R33
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tableHeader({}), 'h');
  add(sec, await tbl(PLAN_COLS, rows.map(r => [r[0], r[1], r[2], r[3], r[4], { pill: STATUS[r[5]] }, r[6], p.edit ? { menu: 1 } : { icons: ['keyboard_arrow_right-20-400-round'] }]), { pagination: rows.length }), 'h');   // ดูอย่างเดียว: ไม่มีเมนู … กดแถว/ลูกศรเปิดรายละเอียด
  return scr;
}

/* ---------- รายการจอแยกตาม scenario ---------- */
const SCENARIOS = [
  ['S1 · พนักงาน กฟภ. เข้าสู่ระบบ VMS Plus', [
    ['หน้าเข้าสู่ระบบ (ภาพหน้าจริง)', () => shotScreen('S1 หน้าเข้าสู่ระบบ', '01-หน้าเข้าสู่ระบบ')],
    ['SSO กฟภ. Login to your account (ภาพหน้าจริง)', () => shotScreen('S1 SSO', '02-SSO')],
    ['SSO กรอกรหัสผิด (ภาพหน้าจริง)', () => shotScreen('S1 SSO กรอกผิด', '03-SSO-กรอกผิด')],
    ['ไม่มีสิทธิ์เข้าใช้งานระบบ', () => noAccess('S1 ไม่มีสิทธิ์')]]],
  ['S2 · หลังเข้าสู่ระบบ รายการแผน Overhaul ตาม role', [
    ['กบค. — แก้ไขได้ทุกแผน · ' + PERSONA.kbk.who, () => planList('S2 กบค.', 'kbk')],
    ['กรย. เขต — ดูอย่างเดียว แผนที่มีรถในเขต · ' + PERSONA.kry.who, () => planList('S2 กรย.', 'kry')],
    ['หน่วยงานเจ้าของรถ — ดู + ตอบนัด · ' + PERSONA.owner.who, () => planList('S2 หน่วยงาน', 'owner')]]],
];
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GROUPS = SCENARIOS.map(([title, screens], i) => {
  const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens: screens.map(([label, fn]) => [label, fn, '']) }] };
});

/* ---------- การ์ด AC ใต้จอ (แม่แบบ AC รายจอของทีม · 30 ต.ค. 2569) — นอกเฟรมจอ ชื่อ "LG · AC A.1" ปลั๊กอินล้างตอนรันซ้ำแบบป้ายอื่น ---------- */
let AC_FONT = null;
async function acText(chars, size, hex, w, body) {
  const t = await labelText(chars, size, hex);   // หัว = ฟอนต์ป้าย (IBM Plex Sans Thai Bold)
  if (body) {
    if (AC_FONT === null) { AC_FONT = false; for (const f of [{ family: 'IBM Plex Sans Thai', style: 'Regular' }, { family: 'Inter', style: 'Regular' }]) { try { await figma.loadFontAsync(f); AC_FONT = f; break; } catch (e) { /* ลองตัวถัดไป */ } } }
    if (AC_FONT) t.fontName = AC_FONT;
  }
  t.resize(w, t.height); t.textAutoResize = 'HEIGHT';
  return t;
}
async function acCard(code, a) {
  const W = GRID.colW, inner = W - 96;
  const c = frame(PLUGIN.prefix + ' · AC ' + code, 'VERTICAL', { fill: WHITE, pad: 48, gap: 20 });
  c.counterAxisSizingMode = 'FIXED'; c.resize(W, 100); c.primaryAxisSizingMode = 'AUTO';
  c.strokes = [{ type: 'SOLID', color: rgbOf('#D0D5DD') }]; c.strokeWeight = 2; c.cornerRadius = 16;
  c.appendChild(await acText('AC ' + code + ' — ' + a.title, 40, '#101828', inner));
  for (const s of a.sections) {
    c.appendChild(await acText(s.h, 28, '#A80689', inner));
    const lines = s.items.map(it => '• ' + it.t + it.sub.map(x => '\n      - ' + x).join(''));
    if (lines.length) c.appendChild(await acText(lines.join('\n'), 24, '#344054', inner, true));
  }
  return c;
}
async function acRow(page, g, y) {   // แถว AC ใต้แถวจอของบล็อก (ป้ายซ้าย "AC" แบบป้าย Device)
  const sub = g.subs[0], x0 = GRID.side + GRID.gap, pitch = GRID.colW + GRID.colGap;
  let h = 0, n = 0;
  for (let i = 0; i < sub.screens.length; i++) {
    const code = sub.code + '.' + (i + 1), a = AC && AC.screens[code];
    if (!a) { warn('AC ' + code, 'ไม่มี AC ของจอนี้ใน ' + (AC ? AC.src : 'build.json')); continue; }
    CREATED = [];
    try { const card = await acCard(code, a); page.insertChild(0, card); card.x = x0 + i * pitch; card.y = y; h = Math.max(h, card.height); n++; }
    catch (e) { warn('การ์ด AC ' + code, e); dropCreated(page); }
  }
  if (!h) return { y, n };
  CREATED = [];
  const lb = fixed(frame(PLUGIN.prefix + ' · AC', 'VERTICAL', { fill: rgbOf('#667085') }), GRID.side, h);
  lb.primaryAxisAlignItems = 'CENTER'; lb.counterAxisAlignItems = 'CENTER'; lb.appendChild(await labelText('AC', 48, '#FFFFFF'));
  page.insertChild(0, lb); lb.x = 0; lb.y = y;
  CREATED = [];
  return { y: y + h + GRID.rowGap, n };
}

/* ---------- สร้าง: Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component — วางต่อใต้ของเดิมบนหน้าที่เปิดอยู่ (ไม่สร้างหน้าใหม่) ---------- */
async function buildSet(SCEN, GRP, what, devices) {
  errors.length = 0;
  const t0 = Date.now();
  log('นำเข้า component จากไลบรารี…');
  await resolveAll();
  log(deviceSetInfo());
  const nShot = Object.keys(SHOTS).length;
  log(nShot ? 'ภาพหน้าจริง ' + nShot + ' ภาพ (จาก serve.js)' : '⚠ ยังไม่มีภาพหน้าจริง — รัน node figma-export/serve.js แล้วกดใหม่ (จอบล็อก A จะเป็นกรอบเปล่าพร้อมคำเตือน)');
  const page = figma.currentPage;   // เจ้าของงานสั่ง 30 ต.ค. 2569 "เป็นการเขียนเพิ่มจากหน้าที่เลือกนะ ไม่ต้องเขียนใหม่" ⇒ ไม่สร้างหน้าใหม่
  log('วางต่อใต้ของเดิมบนหน้า "' + page.name + '" (หน้าที่เปิดอยู่) — ของที่มีอยู่บนหน้านี้ไม่ถูกแตะ');
  let y = 0;
  page.children.forEach(n => { if (n.absoluteBoundingBox) y = Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + 400); });
  const TOTAL = SCEN.reduce((a, x) => a + x[1].length, 0);
  const made = []; let cards = 0;
  for (const g of GRP) {   // ทีละบล็อก: แถวจอ (Desktop/Mobile) แล้วแถว AC ใต้ ก่อนขึ้นบล็อกถัดไป
    const r = await buildGrid(page, PLUGIN.prefix, [g], y, TOTAL * devices.length, { devices, flow: false });
    made.push(...r.made);
    const a = await acRow(page, g, r.y - GRID.groupGap + GRID.rowGap);
    cards += a.n;
    y = a.y + GRID.groupGap - GRID.rowGap;
  }
  let instances = 0, loose = 0;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') loose++;
  }
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 4));
  log('');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ' + GRP.length + ' บล็อก ' + what + ' (' + GRP.map(g => g.code).join(' ') + ') · การ์ด AC ' + cards + ' ใบ · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓'));
  log('component ที่ใช้ (' + USED.size + '): ' + [...USED].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่ต้องสลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด — ฟอนต์ ' + (FALLBACK_FONT ? FALLBACK_FONT.family + ' ' + FALLBACK_FONT.style : '-'));
  reportOversize();
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
async function build(o) { await buildSet(SCENARIOS, GROUPS, 'scenario', devOf(o)); }
async function buildDesktop() { await buildSet(SCENARIOS, GROUPS, 'scenario · desktop', [false]); }
async function buildMobile() { await buildSet(SCENARIOS, GROUPS, 'scenario · mobile', [true]); }
async function buildPick(o) {
  const idx = (o.pick || []).map(Number).filter(i => i >= 0 && i < SCENARIOS.length);
  if (!idx.length) { log('ยังไม่ได้ติ๊ก scenario — ติ๊กอย่างน้อย 1 รายการแล้วกดอีกครั้ง'); return; }
  await buildSet(SCENARIOS.filter((_, i) => idx.indexOf(i) >= 0), GROUPS.filter((_, i) => idx.indexOf(i) >= 0), 'scenario ที่เลือก', devOf(o));
}

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'shots') { for (const k of Object.keys(msg.files || {})) SHOTS[k] = msg.files[k]; return; }   // Uint8Array จากหน้าต่าง ส่งต่อ createImage ตรงๆ   // หน้าต่างส่งภาพหน้าจริงมาก่อนสั่งสร้าง
    const o = { devices: msg.devices, pick: msg.pick };
    if (msg.type === 'build') await build(o);
    if (msg.type === 'build-desktop') await buildDesktop();
    if (msg.type === 'build-mobile') await buildMobile();
    if (msg.type === 'build-pick') await buildPick(o);
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]) });
