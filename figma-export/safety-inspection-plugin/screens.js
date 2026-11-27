/* ============================================================================
   Maintain-D — Safety Inspection (แผนตรวจ ปจ.2) · จอจาก component จริง ครบทุกหน้าของต้นแบบ safety-inspection
   ----------------------------------------------------------------------------
   ผู้ใช้สั่ง 26 พ.ย. 2569: "อยากให้เพิ่มเมนูในนี้" (เมนู Plugins → Development แบบปลั๊กอินอื่นของ Maintain-D) · "ปลั๊กอิน Figma ครบทุกหน้า"
   ต้นทางหน้าตา/ข้อความ/ข้อมูลตัวอย่าง = ต้นแบบเว็บ github.com/liinux-cw/safety-inspection branch feature/create-inspection (26 พ.ย. 2569)
     · ข้อมูลจำลอง = src/lib/mock/data.ts รุ่น 22 (แผน MRZ7000010 … · แผนเดินทาง MRZ7000010-1 · MRZ7000010-2 ผู้รับจ้างเสนอ)
     · flow: สร้างแผน (ชื่อแผน + ผู้รับจ้างและสัญญา section เดียว · ไม่มีรอบตรวจ) → หัวหน้า กบค. อนุมัติ (ผู้รับจ้างเห็นแผน) → แผนเดินทาง 2 เส้น
       (กบค. สร้างเอง · ผู้รับจ้างเสนอ → กบค. ตรวจ/กรอกค่าจ้าง → ส่งหัวหน้า) → ผู้รับจ้างบันทึกผลรายคัน → กบค. อนุมัติรายคัน → เสร็จสิ้นเอง
     · เมนูอยู่ในกลุ่ม "งานซ่อมและบำรุงรักษา" · หน้ารายการแผน = บำรุงรักษาตามวาระ แท็บ Safety Inspection
   โครงปลั๊กอินตามแบบประเมินผู้รับจ้าง (contractor-eval-plugin) · ตัวช่วยที่ยกมาจากปลั๊กอินบำรุงรักษา (maintainance-plugin/screens.js) ระบุไว้ที่ฟังก์ชัน
   อัปเดต 27 พ.ย. 2569 ให้ตรงเว็บล่าสุด (6b08a2d): ผลตรวจรายเครื่องมือกลแสดงเป็นคันเดียวมีเครื่องข้างใน (ป้ายต่อเครื่อง · popup แท็บต่อเครื่อง · ติ๊กเป็นคัน)
     · ทะเบียน ปจ.2 แถวละคัน + ที่มา/เลขที่อ้างอิงของผลนอกแผน · การตรวจ ปจ.2 ในหน้าข้อมูลยานพาหนะการ์ดละเครื่อง + ดูประวัติ · ย้ายเครื่องเมื่อรหัสซ้ำ
     · สถานะตามตาราง status (ผู้รับจ้าง: เสร็จสิ้นสีเขียว) · แผนเดินทางที่ผู้รับจ้างเสนอเปิดแล้วเข้าหน้าแก้ไขเลย ไม่มีปุ่มส่งออก
     · ตัวอย่างคันที่มีเครื่องมือกล 2 เครื่อง = 74-7745 (เครน + กระเช้า) — เว็บตั้งต้นทุกคันมีเครื่องเดียว คันหลายเครื่องเกิดจากเพิ่มในหน้าข้อมูลยานพาหนะ
   กติกา: component-rules.md · 1 scenario = 1 บล็อกตัวอักษร (R19) · ตารางไม่เกิน 8 คอลัมน์ · คำว่า "ยานพาหนะ" แทน "รถ" (ยกเว้นข้อมูลจาก API เช่นชื่อประเภท)
   ============================================================================ */

/* แถบสีฟ้าอธิบาย (Alert Color=Info) ไม่ใช้ในงาน Safety (ผู้ใช้ 27 พ.ย. 2569 "ไม่ต้องทำ เอาออกในทุกที่") — ห้ามเพิ่ม alertBox('Info', …) */
const PLUGIN = { prefix: 'SI', page: 'Safety Inspection', menu: 'งานซ่อมและบำรุงรักษา', searchHint: 'ค้นหาชื่อแผน, เลขที่ MR, หน่วยงานที่สร้างแผน' };

/* ---------- component ที่ใช้ — ขาดตัวไหนหยุด (ไลบรารี) · NESTED = ชิ้นซ้อนใน component อื่น · LOCAL_OPTIONAL = ป้ายของทีมออกแบบ ไม่มีก็วาดแถบธรรมดา ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Table header',
  'Table pagination', 'Text input', 'Input dropdown', 'Input dropdown with badges', 'Text area', 'File upload', 'Input label', 'Alert', 'Pill outline',
  'Primary button', 'Secondary button', 'Secondary danger button', 'Tertiary button', 'Background overlay', 'Modal', 'Notification',
  'Empty state/Data empty', 'Empty state/Search not found', 'Radio text card', 'Images', 'Date picker', 'Dropdown menu', 'Dropdown list',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header', 'Modal footer', 'Tabs', 'Notification card', 'Metric item',
  'Side panel header', 'Side panel footer', 'Card item row',
  'add-24-300-round', 'filter_list-24-400-round', 'more_horiz-20-400-round', 'delete-24-300-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round',
  'cloud_upload-24-300-round', 'stylus-24-300-round', 'check-24-300-round', 'quick_reference_all-24-300-round', 'description-24-300-round',
  'calendar_month-24-300-round', 'download-24-300-round', 'paid-24-300-round', 'close-24-300-round', 'arrow_right_alt-24-300-round'];
const NESTED = ['_Dropdown menu item', 'Nav button', 'Tab item', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Tertiary danger button', 'Primary danger button',
  '_Content item base', '_File upload item base', 'Checkbox', 'Badge outline', 'Mobile table item', 'Table cell', 'Table header cell', 'List with checkbox', 'List with checkbox item', 'List header item',
  '_Notification item base', 'Status', 'Card item base', 'Dropdown list item', 'Featured icon'];
const LOCAL_OPTIONAL = ['Device Type', 'Component 1', 'Header'];
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี (ดัมป์ 19 ต.ค. 2569 · ตัวเดียวกับปลั๊กอินบำรุงรักษา) — รูปแบบบรรทัดต้องเหมือน KEYS ใน core ("ชื่อ": ["key", set]) เพราะ test harness อ่านด้วย regex */
Object.assign(KEYS, {
  "Input dropdown with badges": ["705d2a75bc12121c2c1c0a9737327fbc1ea60696", true],
  "Images": ["39fe2574c3dcfeebe3eded7a76fecbc04ee41ef7", true],
  "Radio text card": ["e4510738f989bb24dbfb70fe6acfbf5705dcd60b", true],
  "Modal footer": ["78e84b8dfd520b686df45c5219feaf5f64a4bcec", true],
  "Notification card": ["8b00e80ca7ead162e5de06e8cc261b86d5904c32", false],
  "_Notification item base": ["5e4101e154462cac0b912c28d0499b61f84c3001", false],
  "Status": ["65871480cb419a27224a15825374bc1486ab34d6", true],
  "Metric item": ["5e82119aab7dc5401c7f5940b7a500339ace506a", true],
  "Card item row": ["5511f46face9e65e08d274bbf7c9d73489124362", true],
  "Card item base": ["68f4c18df873c10da2f8bfac894446e5c2bbc731", true],
  "description-24-300-round": ["e42bf9bc8971c1449df0a602f3beca96cd3e5b77", false],
  "calendar_month-24-300-round": ["afb81bef65f96089512284d42edd7bb46646a465", false],
  "download-24-300-round": ["336f0dff014c26316e0fa56959bc75f09f71531d", false],
  "paid-24-300-round": ["3f83a333cb688dd77b4f3702646969ca0591bd02", false],
  "close-24-300-round": ["7e5fda1e879f54c662e57e91b0167792eaa6e95a", false],
  "arrow_right_alt-24-300-round": ["2f2382706842284efca0f4e6bca7cb875306f891", false]
});

/* ============================================================================
   ตัวช่วยที่ยกจากปลั๊กอินบำรุงรักษา (maintainance-plugin/screens.js) — ชื่อเดิม พฤติกรรมเดิม
   ============================================================================ */
const propVal = (n, k) => { const cp = n.componentProperties || {}; const f = Object.keys(cp).find(x => x === k || x.split('#')[0].trim() === k); return f ? cp[f].value : undefined; };
async function putText(inst0, layer, value) {
  const t = inst0 && inst0.findAll(n => n.type === 'TEXT' && n.name === layer && n.visible !== false)[0];
  if (t && t.characters !== value) await text(inst0, t, value);
}
async function tabs(items, active) {   // component Tabs (5 ช่อง Tab item) · items [[ข้อความ, จำนวน]] · ซ่อนช่องที่เกิน
  const t = inst('Tabs');
  const its = t.children.filter(c => c.type === 'INSTANCE' && c.name === 'Tab item');
  its.forEach((it, i) => {
    if (i >= items.length) { it.visible = false; return; }
    setProps(it, { Active: i === active ? 'True' : 'False', State: 'Default' });
    setProps(it, { Text: items[i][0], Badge: items[i][1] != null });
    const p = find(it, 'Pill outline'); if (p && items[i][1] != null) setProps(p, { Color: 'Brand', Text: String(items[i][1]) });
  });
  return t;
}
async function tblShort(cols, rows, o) {   // ไม่เกิน 10 แถวไม่มีตัวแบ่งหน้า · เกินแสดงหน้าแรก + Table pagination
  if (!(o && o.pagination) && rows.length > TABLE_MAX.rows) { o = Object.assign({}, o, { pagination: { shown: TABLE_MAX.rows, total: rows.length } }); rows = rows.slice(0, TABLE_MAX.rows); }
  const t = await tbl(cols, rows, o); if (!(o && o.pagination)) (t.findAll ? t.findAll(n => n.name === 'Table pagination') : []).forEach(n => { n.visible = false; }); return t;
}
function headCheck(t, rows) {   // ติ๊กทั้งหมดที่หัวคอลัมน์แรก
  const hc = t && t.findOne ? t.findOne(n => n.type === 'INSTANCE' && n.name === 'Table header cell') : null; if (!hc) return;
  const ok = rows.filter(r => !r[0].disabled), n = ok.filter(r => r[0].check).length;
  setProps(hc, { Checkbox: 'True' });
  const cb = find(hc, 'Checkbox'); if (cb) setProps(cb, { Type: n === 0 ? 'Unselected' : n === ok.length ? 'Selected' : 'Indeterminate', State: ok.length ? 'Default' : 'Disabled' });
}
async function searchNotFound() {
  const es = inst('Empty state/Search not found');
  await text(es, 'Text', 'ไม่พบข้อมูล'); await text(es, 'Supporting text', 'เปลี่ยนคำค้นหรือเงื่อนไขแล้วลองใหม่อีกครั้ง');
  es.findAll(n => n.type === 'INSTANCE' && /button/i.test(n.name)).forEach((b, i) => { if (i === 0) setProps(b, { Text: 'ล้างตัวกรอง', 'Leading icon': false, 'Trailing icon': false }); else b.visible = false; });
  return es;
}
async function popupModal(scr, o) {   // Background overlay + กรอบ Modal + Modal header + เนื้อหา + Modal footer · มือถือ = bottom sheet
  if (MOB) {
    const r = await sheet(scr, { title: o.title, content: o.body, ok: o.ok, cancel: o.cancel || 'ยกเลิก', danger: o.danger });
    const pb = find(r.sh, 'Primary button'); if (pb && o.okOff) setProps(pb, { State: 'Disabled' });
    if (r.sh.height > VH() - 40) { try { r.sh.primaryAxisSizingMode = 'FIXED'; r.sh.resize(VW(), VH() - 40); r.body.layoutGrow = 1; r.body.clipsContent = true; r.sh.y = 40; } catch (e) { warn('ความสูง bottom sheet', e); } }
    return r;
  }
  overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), Math.max(VH(), scr.height));
  const m = frame('Modal', 'VERTICAL', { fill: WHITE });
  m.cornerRadius = 12;
  overlay(scr, m, 0, 0); m.counterAxisSizingMode = 'FIXED'; m.resize(o.w || 640, m.height);
  const hd = inst('Modal header', { Alignment: 'Left' }, { Title: o.title, Supporting: !!o.sub, 'Supporting text': o.sub || '', 'Featured icon': false, 'Back icon': false, 'Close icon': true, Divider: false });
  add(m, hd, 'h');
  const body = frame('Content', 'VERTICAL', { gap: 24, pad: [0, 24] }); body.paddingBottom = 24;
  add(m, body, 'h');
  o.body.forEach(n => { if (n) add(body, n, 'h'); });
  const ft = inst('Modal footer', { Alignment: 'Horizontal right' }, { 'Tertiary action': false, Divider: false });
  add(m, ft, 'h');
  ft.findAll(b => b.type === 'INSTANCE' && /button/.test(b.name) && b.parent && (b.parent.name === 'Actions' || b.parent.name === 'Primary and secondary actions')).forEach(b => {
    if (b.name === 'Primary button' && o.danger) { try { b.swapComponent(main('Primary danger button', { State: 'Default', Size: 'lg' })); b.name = 'Primary danger button'; } catch (e) { warn('ปุ่มหลักสีแดงของ popup', e); } }
    if (b.name === 'Primary button' || b.name === 'Primary danger button') { if (o.ok) setProps(b, { Text: o.ok, 'Leading icon': false, 'Trailing icon': false, State: o.okOff ? 'Disabled' : 'Default' }); else b.visible = false; }
    else if (b.name === 'Secondary button') setProps(b, { Text: o.cancel || 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
    else b.visible = false;
  });
  m.x = (VW() - m.width) / 2; m.y = Math.max(40, (VH() - m.height) / 2);
  return { m, body };
}
const TH_WD = { Mo: 'จ.', Tu: 'อ.', We: 'พ.', Th: 'พฤ.', Fr: 'ศ.', Sa: 'ส.', Su: 'อา.' };
const ptext = (n) => { const cp = n.componentProperties || {}, k = Object.keys(cp).find(x => x.split('#')[0].trim() === 'Text'); return k ? cp[k].value : ''; };
async function thaiDatePicker(dp, months) {   // Date picker ภาษาไทย: หัวเดือน · ชื่อวัน · ปุ่ม ปิด / ตกลง
  let m = 0;
  const put = async (n, v) => { setProps(n, { Text: v }); await putText(n, 'Text', v); };
  for (const n of dp.findAll(x => x.type === 'INSTANCE')) {
    const tl = n.findAll(x => x.type === 'TEXT' && x.name === 'Text' && x.visible !== false)[0];
    const t = tl ? tl.characters : ptext(n);
    if (n.name === 'Tertiary button' && /^[A-Z][a-z]{2} \d{4}$/.test(t)) await put(n, months[Math.min(m++, months.length - 1)]);
    else if (n.name === '_Date picker calendar item base' && TH_WD[t]) await put(n, TH_WD[t]);
    else if (n.name === 'Tertiary brand button') n.visible = false;
    else if (n.name === 'Secondary button') await put(n, 'ปิด');
    else if (n.name === 'Primary button') await put(n, 'ตกลง');
  }
  return dp;
}
async function metric(text, number, color) {   // Metric item + สี Featured icon
  const m = inst('Metric item', { Breakpoint: BP() }, { Number: String(number), Text: text });
  const fi = find(m, 'Featured icon'); if (fi) setProps(fi, { Color: color || 'Brand' });
  return m;
}
function metricRow(items) {   // desktop เต็มแถว · มือถือแถวละ 2
  if (MOB) {
    const box = frame('Metrics', 'VERTICAL', { gap: 12 });
    for (let i = 0; i < items.length; i += 2) { const r = frame('Row', 'HORIZONTAL', { gap: 12 }); items.slice(i, i + 2).forEach(m => { r.appendChild(m); m.layoutGrow = 1; }); add(box, r, 'h'); }
    return box;
  }
  const r = frame('Metrics', 'HORIZONTAL', { gap: 24 }); items.forEach(m => { r.appendChild(m); m.layoutGrow = 1; }); return r;
}
function rowMenu(scr, items) {   // เมนู "…" ใต้ปุ่มของแถวแรก (planMenu) · น้อยกว่า 3 รายการซ่อนเส้นคั่น · มือถือไม่เปิด (ไอคอนอยู่บนการ์ด)
  const m = menuAt(scr, firstMenuCell(scr), items);
  if (!m) return null;
  if (items.length < 3) { const d = (find(m, 'Menu items') || m).children[3]; if (d) d.visible = false; }
  return m;
}
function fillNotiItem(r, it) {   // it = [สีจุด | 'read' (อ่านแล้ว ไม่มีจุด), ข้อความ, เวลา]
  const unread = it[0] !== 'read';
  setProps(r, { Text: it[1], 'Supporting text': it[2], 'Show status': unread, 'Show button': false });
  const st = r.findAll(x => x.type === 'INSTANCE' && x.name === 'Status')[0]; if (st && unread) setProps(st, { State: it[0] });
}
async function notiPanel(scr, items, badge) {   // กระดิ่งแจ้งเตือน = Notification card ใต้ Header navigation · มือถือ bottom sheet
  const card = inst('Notification card');
  const hd = find(card, '_Notification header'); const bg = hd && find(hd, 'Badge outline'); if (bg) setProps(bg, { Text: badge, Color: 'Gray' });
  const rows = card.findAll(n => n.type === 'INSTANCE' && n.name === '_Notification item base');
  for (const [i, r] of rows.entries()) { if (items[i]) fillNotiItem(r, items[i]); else r.visible = false; }
  if (MOB) {
    if (hd) hd.visible = false; const cf = find(card, '_Notification footer'); if (cf) cf.visible = false;
    const r = await sheet(scr, { title: 'แจ้งเตือน (' + badge + ')', content: [card], ok: 'ลบข้อความแจ้งเตือนทั้งหมด' });
    try { card.resize(VW() - 32, card.height); } catch (e) { warn('การ์ดแจ้งเตือนบนมือถือ', e); }
    const ft = find(r.sh, 'Bottom sheet footer'); const sb = ft && find(ft, 'Secondary button'); if (sb) sb.visible = false;
    return r.sh;
  }
  const hdr = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Header navigation')[0];
  overlay(scr, card, VW() - card.width - 24, (hdr ? hdr.height : 64) + 8);
  return card;
}
/* การ์ดของหน้าข้อมูลยานพาหนะ (viBorder viSubtle viCard viCardRow · ปลั๊กอินบำรุงรักษา 25 พ.ย. 2569 ตามต้นแบบ Safety Inspection) */
let VI_BORDER;
async function viBorder() {
  if (VI_BORDER === undefined) VI_BORDER = await libVar(/^Color\/border\/secondary$/i);
  let p = { type: 'SOLID', color: rgbOf('#EAECF0') };
  if (VI_BORDER) try { p = figma.variables.setBoundVariableForPaint(p, 'color', VI_BORDER); } catch (e) { /* ใช้ค่าสี */ }
  return p;
}
async function viSubtle(f) { let p = { type: 'SOLID', color: SURFACE_SUB }; const v = await surfaceVar(); if (v) try { p = figma.variables.setBoundVariableForPaint(p, 'color', v); } catch (e) { /* ใช้ค่าสี */ } f.fills = [p]; f.cornerRadius = 8; return f; }
async function viCard(name, dir) { const f = frame(name, dir || 'VERTICAL', { gap: 16, pad: 16, fill: WHITE }); f.cornerRadius = 16; f.strokes = [await viBorder()]; f.strokeWeight = 1; f.strokeAlign = 'INSIDE'; return f; }
const viSection = (kids) => col('Section', kids, 8);
function viCardRow(label, value) {   // Card item row Type=1 Row · ข้อความชิดขวา · { pill: [ข้อความ, สี] } = Pill outline ชิดขวา
  const r = inst('Card item row', { Type: '1 Row' }, { 'Item 2': false });
  const b = r.children.find(c => c.type === 'INSTANCE' && c.name === 'Card item base');
  if (!b) return r;
  try { b.layoutSizingHorizontal = 'FILL'; } catch (e) { /* ตามขนาดของ component */ }
  const comp = value && value.pill;
  setProps(b, { Type: comp ? 'Text with label and component' : 'Text with label' });
  setProps(b, { Label: label, Text: comp ? '' : value, Supporting: false, 'Leading icon': false });
  const own = b.children.find(c => c.type === 'TEXT' && c.name === 'Text'), lab = b.children.find(c => c.type === 'TEXT' && c.name === 'Label');
  if (comp) {
    if (own) own.visible = false;
    if (lab) try { lab.layoutGrow = 1; } catch (e) { /* ตามขนาดของ component */ }
    const slot = b.children.find(c => c.type === 'INSTANCE' && c.name === 'Badge outline');
    if (slot) try { slot.swapComponent(main('Pill outline', { Color: value.pill[1] })); slot.name = 'Pill outline'; setProps(slot, { Text: value.pill[0] }); } catch (e) { warn('ผลการตรวจ ปจ.2', e); }
  } else if (own) try { own.textAlignHorizontal = 'RIGHT'; } catch (e) { /* ชิดซ้ายตาม component */ }
  return r;
}

/* ============================================================================
   ข้อมูลตัวอย่าง (ตรงกับต้นแบบ src/lib/mock/data.ts รุ่น 22 · วันที่ พ.ศ.)
   ============================================================================ */
const HOT = 'รถกระเช้าฮอทไลน์', FIX = 'รถกระเช้าแก้กระแสไฟฟ้าขัดข้อง', CR = 'รถเครนพิกัด 3-50 ตัน', FOLD = 'รถเครนพับ', CATA = 'รถกระเช้าฮอทไลน์ (CAT. A)', DRILL = 'รถเครน/สว่าน/ขุดเจาะ';
/* ยานพาหนะ: [ทะเบียน, รหัสข้าง, ประเภท, สังกัด, ผู้ครอบครอง, เบอร์, ครบกำหนดตรวจ, วาระ (เดือน), ที่มาวาระ, ยี่ห้อ/รุ่นเครื่องมือกล] */
const V = {
  v01: ['63-4569 ยะลา', 'ต.3-09-4569', HOT, 'กฟต.3 ยะลา', 'นายสมชาย ใจดี', '081-234-5601', '05/11/2569', 6, 'ตามรุ่น ALTEC AM855', 'ALTEC AM855'],
  v02: ['70-1053 เชียงใหม่', 'น.1-09-1053', FIX, 'กฟน.1 เชียงใหม่', 'นายวิชัย แก้วมา', '081-234-5602', '15/12/2569', 6, 'ตามรุ่น VERSALIFT SST37EIH', 'VERSALIFT SST37EIH'],
  v03: ['72-6079 สระบุรี', 'ก.1-09-6079', FIX, 'กฟก.1 สระบุรี', 'นายประเสริฐ สุขใจ', '081-234-5603', '20/12/2569', 6, 'ตามรุ่น ALTEC AT35G', 'ALTEC AT35G'],
  v04: ['74-1974 กรุงเทพมหานคร', 'กปส.-09-1974', CR, 'กปส.', 'นายธนา รุ่งเรือง', '081-234-5604', '10/01/2570', 6, '', 'TADANO GT-300ER'],
  v05: ['82-6789 ขอนแก่น', 'ฉ.2-09-6789', FIX, 'กฟฉ.2 ขอนแก่น', 'นายอนุชา ศรีสุข', '081-234-5605', '25/01/2570', 12, '', 'ETI PALFINGER ETC-37-IH'],
  v09: ['63-7710 ยะลา', 'ต.3-09-7710', CR, 'กฟต.3 ยะลา', 'นายอับดุล สาและ', '081-234-5609', '01/03/2570', 6, '', 'KATO NK250M-III'],
  v16: ['76-2234 เพชรบุรี', 'ต.1-09-2234', FOLD, 'กฟต.1 เพชรบุรี', 'นายมนตรี สายสุข', '081-234-5616', '08/06/2570', 12, '', 'PALFINGER PK15500A'],
  v17: ['70-8801 เชียงใหม่', 'น.1-09-8801', FIX, 'กฟน.1 เชียงใหม่', 'นายเกียรติ อินทร์แก้ว', '081-234-5617', '05/12/2569', 6, 'ตามรุ่น VERSALIFT SST37EIH', 'VERSALIFT SST37EIH'],
  v18: ['72-3302 สระบุรี', 'ก.1-09-3302', HOT, 'กฟก.1 สระบุรี', 'นายชาตรี มั่นคง', '081-234-5618', '12/12/2569', 6, 'ตามรุ่น ALTEC AM855', 'ALTEC AM855'],
  v19: ['74-7745 กรุงเทพมหานคร', 'กปส.-09-7745', CR, 'กปส.', 'นายสมพงษ์ เรืองศรี', '081-234-5619', '03/01/2570', 6, '', 'TADANO GT300ER-3'],
  v20: ['82-9956 ขอนแก่น', 'ฉ.2-09-9956', FIX, 'กฟฉ.2 ขอนแก่น', 'นายทวีศักดิ์ คำดี', '081-234-5620', '18/01/2570', 12, '', 'ETI PALFINGER ETC-37-IH'],
  v21: ['81-4401 อุดรธานี', 'ฉ.1-09-4401', FOLD, 'กฟฉ.1 อุดรธานี', 'นายบุญเลิศ ศรีวงศ์', '081-234-5621', '10/02/2570', 12, '', 'PALFINGER PK10500'],
  v22: ['75-1123 ชลบุรี', 'ก.3-09-1123', FIX, 'กฟก.3 ชลบุรี', 'นายวีระ ทองคำ', '081-234-5622', '25/02/2570', 12, 'กรอกเอง · ไม่พบเกณฑ์วาระ', 'VERSALIFT SST37EIH-02'],
  v23: ['63-2208 ยะลา', 'ต.3-09-2208', FIX, 'กฟต.3 ยะลา', 'นายรอซาลี ยูโซะ', '081-234-5623', '28/12/2569', 6, 'ตามรุ่น ALTEC AT37G', 'ALTEC AT37G'],
  v24: ['76-6650 เพชรบุรี', 'ต.1-09-6650', HOT, 'กฟต.1 เพชรบุรี', 'นายสุเมธ ใจกล้า', '081-234-5624', '30/01/2570', 12, '', 'SIMON 57 OM'],
  v42: ['70-5311 เชียงใหม่', 'น.1-09-5311', FOLD, 'กฟน.1 เชียงใหม่', 'นายศักดิ์ชัย รัตนพันธ์', '081-234-5642', '08/12/2569', 12, '', 'HIAB 215'],
  v50: ['70-6281 เชียงใหม่', 'น.1-09-6281', CATA, 'กฟน.1 เชียงใหม่', 'นายจิรายุ ศรีจันทร์', '081-234-5650', '14/12/2569', 6, '', 'ALTEC AM855-E81'],
  v58: ['70-7251 เชียงใหม่', 'น.1-09-7251', DRILL, 'กฟน.1 เชียงใหม่', 'นายชนะ แสงจันทร์', '081-234-5658', '20/12/2569', 12, '', 'ALTEC DM45TB'],
};
const ADMIN = { 'กฟต.3 ยะลา': ['นายอับดุลเลาะ สาและ', '073-212-301'], 'กฟน.1 เชียงใหม่': ['นางสาวศิริพร คำแสน', '053-241-302'], 'กฟก.1 สระบุรี': ['นายประเสริฐ บุญมา', '036-211-303'],
  'กปส.': ['นายธนากร ศรีสุข', '02-590-5304'], 'กฟฉ.1 อุดรธานี': ['นางวราภรณ์ พลศรี', '042-221-305'], 'กฟฉ.2 ขอนแก่น': ['นายสุรชัย ทองดี', '043-236-306'],
  'กฟก.3 ชลบุรี': ['นางสาวกมลวรรณ รัตนะ', '038-273-307'], 'กฟต.1 เพชรบุรี': ['นายอนุชา เพชรรัตน์', '032-425-308'] };
const VENDORS = [['บจก. เซฟตี้ เอ็นจิเนียริ่ง', '02-555-0101'], ['หจก. ช่างกลตรวจสอบ', '02-555-0202'], ['บจก. ไทยเครน เซอร์วิส', '02-555-0303']];
const HEAD1 = 'นายสมศักดิ์ วงศ์ไทย', HEAD2 = 'นางสาวพิมพ์ชนก แสงดาว', ME = 'นางสาวอรอุมา ศรีวงศ์';
const PLAN_ST = { review: ['รออนุมัติ', 'Warning'], returned: ['ส่งกลับแก้ไข', 'Error'], approved: ['อนุมัติแล้ว', 'Info'], closed: ['เสร็จสิ้น', 'Success'], cancelled: ['ยกเลิก', 'Gray'] };
const TRIP_ST = { proposed: ['รออนุมัติ', 'Warning'], review: ['รออนุมัติ', 'Warning'], returned: ['ส่งกลับแก้ไข', 'Error'], active: ['ดำเนินการ', 'Info'], closed: ['เสร็จสิ้น', 'Gray'] };
const DOC_ST = { none: ['รอดำเนินการ', 'Gray'], draft: ['กำลังดำเนินการ', 'Info'], sent: ['รออนุมัติ', 'Warning'], approved: ['เสร็จสิ้น', 'Success'], returned: ['ส่งกลับแก้ไข', 'Error'] };
const RES_C = { 'ผ่าน': 'Success', 'ไม่ผ่าน': 'Error', 'ระงับ': 'Warning', 'ตรวจไม่ได้': 'Gray' };
const RESULTS = ['ผ่าน', 'ไม่ผ่าน', 'ระงับ', 'ตรวจไม่ได้'];
/* แผน (ช่วงของแผน = ระยะเวลาตามสัญญา · 26 พ.ย. 2569 ไม่มีรอบตรวจ) */
const PLANS = [
  { mr: 'MRA7000013', name: 'ตรวจ ปจ.2 กฟน.1 เชียงใหม่ รอบ ธ.ค. 2569', dept: 'กรย. กฟน.1', by: 'นายพีระพงษ์ ใจมั่น', budget: '40,000.00', ven: 1, contract: 'PO-2570-0131', c1: '16/11/2569', c2: '31/12/2569', days: 45, cars: ['v02', 'v42', 'v50', 'v58'], st: 'approved', docs: ['อนุมัติ 1/4', 'รออนุมัติ 1 คัน'] },
  { mr: 'MRZ7000012', name: 'ตรวจ ปจ.2 กระเช้าฮอทไลน์ ก.พ. 2570', dept: 'กบค.', by: ME, budget: '10,000.00', ven: 2, contract: '', c1: '15/01/2570', c2: '01/03/2570', days: 45, cars: ['v24'], st: 'review', docs: ['อนุมัติ 0/1'], sent: '18/11/2569' },
  { mr: 'MRZ7000011', name: 'ตรวจ ปจ.2 ภาคตะวันออก รอบ ม.ค. – มี.ค. 2570', dept: 'กบค.', by: 'นายธนวัฒน์ มีสุข', budget: '20,000.00', ven: 1, contract: '', c1: '01/01/2570', c2: '02/03/2570', days: 60, cars: ['v21', 'v22'], st: 'approved', docs: ['อนุมัติ 0/2'] },
  { mr: 'MRZ7000010', name: 'ตรวจ ปจ.2 รอบ ธ.ค. 2569 – ก.พ. 2570', dept: 'กบค.', by: ME, budget: '45,000.00', ven: 0, contract: 'PO-2570-0112', c1: '01/11/2569', c2: '30/01/2570', days: 90, cars: ['v17', 'v18', 'v19', 'v20', 'v23'], st: 'approved', docs: ['อนุมัติ 2/5', 'รออนุมัติ 1 คัน'], approvedAt: '10/11/2569' },
  { mr: 'MRZ7000009', name: 'ตรวจ ปจ.2 หลัง Overhaul รอบ ม.ค. 2570', dept: 'กบค.', by: ME, budget: '15,000.00', ven: 0, contract: 'PO-2570-0098', c1: '01/11/2569', c2: '01/12/2569', days: 30, cars: ['v16'], st: 'approved', docs: ['อนุมัติ 0/1', 'รออนุมัติ 1 คัน'] },
  { mr: 'MRZ7000008', name: 'ตรวจ ปจ.2 เครน ภาคใต้ มี.ค. 2570', dept: 'กบค.', by: 'นายธนวัฒน์ มีสุข', budget: '12,000.00', ven: 0, contract: 'PO-2570-0140', c1: '20/02/2570', c2: '01/04/2570', days: 40, cars: ['v09'], st: 'review', docs: ['อนุมัติ 0/1'], sent: '19/11/2569' },
];
const DONE_PLANS = [
  { mr: 'MRZ6900020', name: 'ตรวจ ปจ.2 รอบ ก.ค. – ก.ย. 2569', dept: 'กบค.', by: ME, budget: '30,000.00', ven: 0, contract: 'PO-2569-0077', c1: '15/06/2569', c2: '13/10/2569', days: 120, cars: [], st: 'closed', docs: ['อนุมัติ 0/0'] },
  { mr: 'MRZ6900019', name: 'ตรวจ ปจ.2 เครนพับ ภาคกลาง ส.ค. 2569', dept: 'กบค.', by: 'นายธนวัฒน์ มีสุข', budget: '18,000.00', ven: 2, contract: '', c1: '01/08/2569', c2: '30/09/2569', days: 60, cars: ['v03', 'v04'], st: 'cancelled', docs: ['อนุมัติ 0/2'] },
];
const P10 = PLANS[3];
const planOf = (mr) => PLANS.concat(DONE_PLANS).find(p => p.mr === mr);
/* แผนเดินทาง · res = ผลรายคัน { ทะเบียน: [สถานะเอกสาร, ผล, วันที่ตรวจ, เหตุผล/ส่งกลับ, ไฟล์] } */
const T1 = { id: 'MRZ7000010-1', mr: 'MRZ7000010', name: 'ตรวจ ปจ.2 ภาคเหนือและภาคกลาง', d1: '10/11/2569', d2: '20/12/2569', cars: ['v17', 'v18', 'v19', 'v20'],
  costs: { v17: 9000, v18: 9000, v19: 9500, v20: 9000 }, st: 'active', by: 'กบค.', approvedBy: HEAD1 + ' · 11/11/2569',
  res: { v17: ['approved', 'ผ่าน', '12/11/2569', '', 'ปจ2-70-8801.pdf'], v18: ['approved', 'ตรวจไม่ได้', '17/11/2569', 'ยานพาหนะอยู่ระหว่างซ่อมระบบไฮดรอลิก ไม่สามารถยกกระเช้าทดสอบได้', 'หนังสือรับรอง-72-3302.pdf'],
    v19: ['sent', 'ไม่ผ่าน', '14/11/2569', '', 'ปจ2-74-7745.pdf'], v20: ['returned', 'ผ่าน', '13/11/2569', 'เอกสารไม่ชัด อ่านเลขตัวถังไม่ได้ กรุณาสแกนใหม่', 'ปจ2-82-9956.jpg'] },
  res2: { v19: [['sent', 'ผ่าน', '14/11/2569', '', 'ปจ2-74-7745-กระเช้า.pdf']] } };   /* res2 = ผลของเครื่องที่ 2 ขึ้นไปของคัน (EXTRA_M) */
const T2 = { id: 'MRZ7000010-2', mr: 'MRZ7000010', name: 'ตรวจ ปจ.2 ปทุมธานี (ผู้รับจ้างเสนอ)', d1: '21/12/2569', d2: '10/01/2570', cars: ['v23'], costs: {}, st: 'proposed', by: 'vendor', res: {}, sent: '25/11/2569' };
const T3 = { id: 'MRZ7000011-1', mr: 'MRZ7000011', name: 'ตรวจ ปจ.2 ชลบุรีและอุดรธานี', d1: '10/01/2570', d2: '15/02/2570', cars: ['v21', 'v22'], costs: { v21: 8500, v22: 9200 }, st: 'review', by: 'กบค.', res: {}, sent: '19/11/2569' };
const T1_DONE = Object.assign({}, T1, { st: 'closed', res: Object.assign({}, T1.res, { v19: ['approved', 'ไม่ผ่าน', '14/11/2569', '', 'ปจ2-74-7745.pdf'], v20: ['approved', 'ผ่าน', '13/11/2569', '', 'ปจ2-82-9956.pdf'] }),
  res2: { v19: [['approved', 'ผ่าน', '14/11/2569', '', 'ปจ2-74-7745-กระเช้า.pdf']] } });
/* ผลรายเครื่องของคัน (เครื่องหลัก = res · เครื่องอื่น = res2) · สถานะรวมของคัน = เสร็จสิ้นเมื่อทุกเครื่องอนุมัติ อื่นๆ ตามลำดับ ส่งกลับแก้ไข › รออนุมัติ › กำลังดำเนินการ › รอดำเนินการ (carState ของเว็บ) */
const unitRes = (t, id) => [t.res[id]].concat((t.res2 && t.res2[id]) || []).concat(Array(Math.max(0, machinesOfCar(id).length - 1 - ((t.res2 && t.res2[id]) || []).length)).fill(undefined));
const carSt = (t, id) => { const sts = unitRes(t, id).map(r => r ? r[0] : 'none'); return sts.every(x => x === 'approved') ? 'approved' : ['returned', 'sent', 'draft', 'none'].find(x => sts.indexOf(x) >= 0) || 'none'; };
/* ป้ายผลต่อเครื่อง (carPills ของเว็บ): คันเครื่องเดียว = ผลอย่างเดียว · หลายเครื่อง = "ประเภท · ผล" (ไม่มีผล = "ประเภท · -" สีเทา) · only = เฉพาะสถานะที่นับ */
function resPills(t, id, only) {
  const ms = machinesOfCar(id), many = ms.length > 1, out = [];
  unitRes(t, id).forEach((r, i) => { const ok = r && r[0] !== 'none' && (!only || only.indexOf(r[0]) >= 0); if (ok) out.push([(many ? machineTag(ms, ms[i]) + ' · ' : '') + r[1], RES_C[r[1]]]); else if (many) out.push([machineTag(ms, ms[i]) + ' · -', 'Gray']); });
  return out.some(x => !/ · -$/.test(x[0])) ? { pills: out } : '-';
}
const baht = (n) => n ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' บาท' : 'ยังไม่กำหนด';
const tripBudget = (t) => t.cars.reduce((a, c) => a + (t.costs[c] || 0), 0);
const vend = (p) => VENDORS[p.ven];
const contractTxt = (p) => p.c1 + ' – ' + p.c2;

/* ============================================================================
   ชิ้นที่ใช้ร่วม
   ============================================================================ */
const ROOT = 'งานซ่อมและบำรุงรักษา';
async function dataEmpty(t, sub, btnText) {
  const es = inst('Empty state/Data empty'); await text(es, 'Text', t); await text(es, 'Supporting text', sub);
  const pb = find(es, 'Primary button'), sb = find(es, 'Secondary button');
  if (sb) sb.visible = false;
  if (pb) { if (btnText) setProps(pb, { Text: btnText, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') }); else pb.visible = false; }
  if (!btnText) { const a = find(es, 'Actions'); if (a) a.visible = false; }
  return es;
}
const planInfoPairs = (p) => [['เลขที่ MR', p.mr], ['ชื่อแผน', p.name], ['หน่วยงานที่สร้างแผน', p.dept + ' · ' + p.by], ['งบประมาณ', p.budget + ' บาท'],
  ['จำนวนยานพาหนะ', p.cars.length + ' คัน'], ['สถานะแผน', PLAN_ST[p.st][0]], ['แผนเดินทาง', p.mr === 'MRZ7000010' ? '2 แผน · ยังไม่อยู่ในแผนเดินทาง 0 คัน' : '0 แผน · ยังไม่อยู่ในแผนเดินทาง ' + p.cars.length + ' คัน']];
const vendorPairs = (p) => [['ผู้รับจ้าง', vend(p)[0]], ['เบอร์โทรผู้รับจ้าง', vend(p)[1]], ['เลขที่สัญญา/ใบสั่งจ้าง', p.contract || '-'], ['ระยะเวลาตามสัญญา (' + p.days + ' วัน)', contractTxt(p)]];
async function planBoxes(p, o) {   // กล่องข้อมูลแผน + ข้อมูลผู้รับจ้าง (PlanInfo · VendorInfo ของเว็บ)
  o = o || {};
  const pairs = planInfoPairs(p).concat(o.extra || []);
  return [col('Section', [await sectionLabel('ข้อมูลแผน'), kv(pairs)], 16), col('Section', [await sectionLabel('ข้อมูลผู้รับจ้าง'), kv(vendorPairs(p))], 16)];
}
const tripPairs = (t, p) => [['ชื่อแผนเดินทาง', t.name], ['แผนตรวจ ปจ.2', p.mr + ' · ' + p.name], ['สร้างโดย', t.by === 'vendor' ? 'ผู้รับจ้าง · ' + vend(p)[0] : p.dept], ['ช่วงวันที่ดำเนินการ', t.d1 + ' – ' + t.d2],
  ['จำนวนยานพาหนะ', t.cars.length + ' คัน'], ['สถานะ', TRIP_ST[t.st][0]], ['อนุมัติโดย', t.approvedBy || '-']];
const tripVendorPairs = (t, p) => vendorPairs(p).concat([['งบประมาณ', baht(tripBudget(t))], ['ค่าจ้างตรวจรวม', t.id === T1.id ? (t.st === 'closed' ? '27,500.00 บาท' : '9,000.00 บาท') : '0.00 บาท']]);
async function tripBoxes(t, p, vendor) {
  const parts = [];
  if (!vendor) parts.push(col('Section', [await sectionLabel('ข้อมูลแผนเดินทาง'), kv(tripPairs(t, p))], 16));
  parts.push(col('Section', [await sectionLabel('ข้อมูลผู้รับจ้าง'), kv(tripVendorPairs(t, p))], 16));
  return parts;
}
function radioCards(options, sel, o) {   // Radio text card แถวเดียว (มือถือเรียงลง) — แบบ radioPick ของปลั๊กอินบำรุงรักษา ไม่มีหัว section
  o = o || {};
  const r = MOB ? col('Radio', [], 12) : row('Radio', [], { gap: 16 });
  options.forEach((t, i) => {
    const sub = Array.isArray(t) ? t[1] : '';
    const c = inst('Radio text card', { State: o.disabled ? 'Disabled' : 'Default', Selected: i === sel ? 'True' : 'False' }, { Text: Array.isArray(t) ? t[0] : t, Supporting: !!sub, 'Supporting text': sub });
    if (MOB) add(r, c, 'h'); else { r.appendChild(c); c.layoutGrow = 1; try { c.layoutSizingVertical = 'FILL'; } catch (e) { /* ไฟล์เก่าไม่รองรับ */ } }
    c.findAll(n => n.type === 'FRAME' && (n.name === 'Content' || n.name === 'Text and supporting text')).forEach(f => { try { f.layoutSizingHorizontal = 'FILL'; } catch (e) { /* ชั้นนอก auto layout */ } });
    c.findAll(n => n.type === 'TEXT').forEach(t => { try { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; } catch (e) { /* ชั้นนอก auto layout */ } });
  });
  return r;
}
function labeled(label, node) { const lb = inst('Input label'); setProps(lb, { 'Label text': label }); return col('Field', [lb, node], 8); }
/* MENU (ดูรายละเอียด · แก้ไข · ลบ) ประกาศใน core แล้ว */
const actCell = (n) => MOB ? { icons: MENU.slice(0, n).map(m => m[1]) } : { menu: 1 };
const viewCell = () => ({ icons: ['quick_reference_all-24-300-round'] });

/* ============================================================================
   S1 รายการแผน — บำรุงรักษาตามวาระ แท็บ Safety Inspection (กบค.)
   ============================================================================ */
const LIST_COLS = [['เลขที่ MR', 140, 'Lead text'], ['ชื่อแผน', 0], ['หน่วยงานที่สร้างแผน', 190], ['ระยะเวลาตามสัญญา', 190], ['ยานพาหนะ', 110], ['เอกสาร ปจ.2', 150], ['สถานะ', 140], ['', 72]];
const planMenuN = (p) => p.dept !== 'กบค.' ? 1 : (p.st === 'review' || p.st === 'returned') ? 3 : 1;
const listRow = (p) => [p.mr, p.name, { text: p.dept, sub: p.by }, contractTxt(p), p.cars.length + ' คัน', { text: p.docs[0], sub: p.docs[1] }, { pill: PLAN_ST[p.st] }, actCell(planMenuN(p))];
async function planList(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'บำรุงรักษาตามวาระ', crumbs: ['บำรุงรักษาตามวาระ'] });
  add(page, await tabs([['บำรุงรักษาตามวาระ', null], ['Safety Inspection', null]], 1), 'h');
  const sec = col('Section', [], 24); add(page, sec, 'h');
  if (o.empty) { add(sec, await dataEmpty('ยังไม่มีแผนตรวจ ปจ.2', 'เมื่อสร้างแผนตรวจ ปจ.2 รายการแผนจะแสดงที่นี่', 'สร้างแผนตรวจ ปจ.2'), 'h'); return scr; }
  add(sec, await tabs([['แผนตรวจ ปจ.2', null], ['เสร็จสิ้นและยกเลิก', null]], o.tab || 0), 'h');
  const list = o.rows || (o.tab ? DONE_PLANS : PLANS);
  add(sec, await tableHeader({ query: o.query, chips: o.chips, filterCount: o.chips ? o.chips.length : 0, primary: 'สร้างแผนตรวจ ปจ.2' }), 'h');
  if (!list.length) add(sec, await searchNotFound(), 'h');
  else add(sec, await tblShort(LIST_COLS, list.map(listRow), { pagination: list.length }), 'h');
  if (o.menu) rowMenu(scr, MENU.slice(0, o.menu));
  if (o.filter) await filterPanel(scr, [multiDropdown('สถานะ', o.filter.st || [], { placeholder: 'ทั้งหมด', optional: true }), multiDropdown('หน่วยงานที่สร้างแผน', o.filter.dept || [], { placeholder: 'ทั้งหมด', optional: true }),
    multiDropdown('ปีงบประมาณ', o.filter.fy || [], { placeholder: 'ทั้งหมด', optional: true }), field('ระยะเวลาตามสัญญา', o.filter.range || '', { placeholder: 'ทั้งหมด', optional: true, lead: 'calendar_month-24-300-round' })]);
  return scr;
}

/* ============================================================================
   S2 สร้าง/แก้ไขแผน — section เดียว "ข้อมูลแผนและผู้รับจ้าง" + ยานพาหนะในแผน (กบค. · กรย.)
   ============================================================================ */
const FORM_COLS = [['ทะเบียน', 260, 'Lead text'], ['สังกัด', 150], ['ผู้ครอบครอง/เบอร์ติดต่อ', 0], ['วาระ', 170], ['ครบกำหนดตรวจ', 150], ['', 104]];
const formCarRow = (id, o) => { const v = V[id], unknown = o && o.unknown === id;
  return [{ text: v[0], sub: v[1] + ' · ' + v[2] }, v[3], { text: v[4], sub: v[5] }, unknown ? (o.cycleSet ? { text: '12 เดือน', sub: 'กรอกเอง · ไม่พบเกณฑ์วาระ' } : { pill: ['ยังไม่ระบุวาระ', 'Error'] }) : { text: v[7] + ' เดือน', sub: v[8] || undefined },
    { text: v[6], sub: id === 'v01' ? 'เกินกำหนด 21 วัน' : 'อีก ' + (20 + id.slice(1) * 3 % 60) + ' วัน' }, { icons: unknown ? ['stylus-24-300-round', 'delete-24-300-round'] : ['delete-24-300-round'] }]; };
const FILLED = { name: 'ตรวจ ปจ.2 รอบ ธ.ค. 2569 – ก.พ. 2570', ven: 0, contract: 'PO-2570-0150', c1: '01/12/2569', days: '90', c2: '01/03/2570', budget: '40,000.00', cars: ['v01', 'v03', 'v04', 'v05'] };
async function planForm(name, o) {
  o = o || {};
  const d = o.values || {}, E = (m) => o.errors ? m : '';
  const head = o.edit ? 'แก้ไขแผนตรวจ ปจ.2' : 'สร้างแผนตรวจ ปจ.2';
  const { scr, page } = await shell(name, { title: head, back: true, crumbs: ['บำรุงรักษาตามวาระ', head] });
  const vendorDd = dropdown('ผู้รับจ้าง', d.ven != null ? VENDORS[d.ven][0] : '', { placeholder: 'เลือกผู้รับจ้าง', error: E(d.ven == null ? 'กรุณาเลือกผู้รับจ้าง' : ''), state: o.vendorOpen ? 'Focused' : undefined });
  const c1 = field('วันเริ่มต้นสัญญา', d.c1, { placeholder: 'ระบุวันที่', lead: 'calendar_month-24-300-round', error: E(d.c1 ? '' : 'กรุณาเลือกวันเริ่มต้นสัญญา'), state: o.dateOpen ? 'Focused' : undefined });
  const info = col('Section', [await section('ข้อมูลแผนและผู้รับจ้าง'),
    alertBox('Gray', 'ผู้รับจ้างรายเดียวตรวจทุกแผนเดินทางของแผนนี้', 'ผู้รับจ้างเห็นแผนหลังหัวหน้า กบค. อนุมัติ และเปลี่ยนผู้รับจ้างไม่ได้หลังอนุมัติ'),
    row('Row', [field('ชื่อแผน', d.name, { placeholder: 'ระบุชื่อแผน', error: E(d.name ? '' : 'กรุณาระบุชื่อแผน') }), vendorDd]),
    row('Row', [field('เบอร์โทรผู้รับจ้าง', d.ven != null ? VENDORS[d.ven][1] : '', { placeholder: '0XX-XXX-XXXX', error: E(d.ven != null ? '' : 'กรุณาระบุเบอร์โทรผู้รับจ้าง') }),
      field('เลขที่สัญญา/ใบสั่งจ้าง', d.contract, { placeholder: 'ระบุเลขที่สัญญาหรือใบสั่งจ้าง', optional: true }),
      field('งบประมาณ (บาท)', d.budget, { placeholder: '0.00', error: E(d.budget ? '' : 'กรุณาระบุงบประมาณ') })]),
    row('Row', [c1, field('ระยะเวลาตามสัญญา (วัน)', d.days, { placeholder: 'เช่น 90', error: E(d.days ? '' : 'กรุณาระบุจำนวนวัน') }), field('วันสิ้นสุดสัญญา', d.c2, { state: 'Readonly', placeholder: 'ระบบคำนวณให้' })])], 16);
  const cars = d.cars || [];
  const carSec = col('Section', [await section('ยานพาหนะในแผน', { badge: cars.length + ' คัน' })], 16);
  if (o.unknown && cars.indexOf(o.unknown) >= 0 && !o.cycleSet) add(carSec, alertBox('Warning', 'ยังไม่ระบุวาระ 1 คัน', 'ยานพาหนะที่หาเกณฑ์วาระไม่เจอ กดไอคอนระบุวาระท้ายแถวเพื่อเลือกวาระการตรวจเอง'), 'h');
  if (cars.length) {
    add(carSec, await tableHeader({ placeholder: 'ค้นหาทะเบียน, รหัส, สังกัด', noFilter: true, more: [{ text: 'เพิ่มยานพาหนะ', icon: 'add-24-300-round' }] }), 'h');
    add(carSec, await tblShort(FORM_COLS, cars.map(id => formCarRow(id, o))), 'h');
  } else add(carSec, await dataEmpty('ยังไม่มียานพาหนะในแผน', 'เพิ่มยานพาหนะประเภท 09 ที่ต้องตรวจ ปจ.2 อย่างน้อย 1 คัน', 'เพิ่มยานพาหนะ'), 'h');
  const complete = d.name && d.ven != null && d.c1 && d.days && d.budget && cars.length && !(o.unknown && !o.cycleSet);
  add(page, col('Content', [o.edit && o.returned ? alertBox('Error', 'หัวหน้า กบค. ส่งกลับให้แก้ไข', 'แก้ชื่อแผนให้ระบุภาคที่ตรวจ · แก้ไขแล้วกดบันทึกและส่งอนุมัติอีกครั้ง') : null, info, carSec,
    btnRow([['Secondary button', o.edit ? 'ยกเลิก' : 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกและส่งอนุมัติ', { size: 'lg', disabled: !complete }]])], 32), 'h');
  if (o.vendorOpen) comboAt(scr, vendorDd.findOne(n => n.name === 'Container') || vendorDd, VENDORS.map((x, i) => [x[0], x[1], i === d.ven]));
  if (o.dateOpen && !MOB) {
    const dp = await thaiDatePicker(inst('Date picker', { Type: 'Single' }, { 'Time picker': false }), ['ธันวาคม 2569']);
    overlay(scr, dp, 0, 0);
    pin(() => { const sb = scr.absoluteBoundingBox, ab = c1.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4; });
  }
  if (o.picker) await vehiclePicker(scr, o.picker);
  if (o.cyclePick) await popupModal(scr, { title: 'ระบุวาระการตรวจ · ' + V[o.unknown][0], sub: 'ไม่พบเกณฑ์วาระของยานพาหนะคันนี้ในตารางวาระ กบค. เลือกวาระเอง', w: 640, ok: 'บันทึก', body: [radioCards(['3 เดือน', '6 เดือน', '12 เดือน'], 2)] });
  if (o.drop) await confirm(scr, { danger: true, title: 'เอายานพาหนะออกจากแผน', sub: V[o.drop][0] + ' จะถูกเอาออกจากแผนนี้ เพิ่มกลับได้ภายหลัง', ok: 'เอาออก' });
  if (o.leave) await confirm(scr, { danger: true, title: 'ยืนยันการออกจากหน้านี้', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'อยู่ต่อ', ok: 'ออกจากหน้านี้' });
  return scr;
}
/* หน้าต่างเพิ่มยานพาหนะ (VehiclePicker ของเว็บ) — ติ๊กเลือก · ตัวกรอง 4 ช่อง · คันที่อยู่ในแผนอื่นเลือกไม่ได้ */
const PICK_COLS = [['ทะเบียน', 260], ['สังกัด', 160], ['ประเภทยานพาหนะ', 0], ['วาระ', 130], ['ครบกำหนดตรวจ', 170]];
async function vehiclePicker(scr, o) {
  const pool = o.pool || ['v01', 'v03', 'v04', 'v05', 'v17', 'v09', 'v22', 'v24'], ticked = o.ticked || [], taken = { v17: 'MRZ7000010', v09: 'MRZ7000008', v24: 'MRZ7000012' };
  const rows = pool.map(id => { const v = V[id]; return [{ check: !taken[id] && ticked.indexOf(id) >= 0, text: v[0], sub: taken[id] ? 'อยู่ในแผน ' + taken[id] + ' ที่ยังไม่ปิด เลือกไม่ได้' : v[1], disabled: !!taken[id] },
    v[3], v[2], v[7] + ' เดือน', { text: v[6], sub: id === 'v01' ? 'เกินกำหนด 21 วัน' : 'ครบกำหนดในระยะสัญญา' }]; });
  const body = [await tableHeader({ placeholder: 'ค้นหาทะเบียน, รหัส, สังกัด', chips: o.chips, filterCount: o.chips ? o.chips.length : 0 })];
  if (o.filter && !MOB) body.push(col('Filter panel', [row('Row', [multiDropdown('สังกัด', [], { placeholder: 'ทั้งหมด', optional: true }), multiDropdown('ครบกำหนดตรวจ', o.filter, { placeholder: 'ทั้งหมด', optional: true })]),
    row('Row', [multiDropdown('วาระ', [], { placeholder: 'ทั้งหมด', optional: true }), multiDropdown('ประเภทยานพาหนะ', [], { placeholder: 'ทั้งหมด', optional: true })]),
    btnRow([['Tertiary button', 'ล้างตัวกรอง'], ['Secondary button', 'ยกเลิก'], ['Primary button', 'ตกลง']])], 20));
  const t = await tblShort(PICK_COLS, rows, { pagination: { shown: rows.length, total: o.total || 62 } }); headCheck(t, rows); body.push(t);
  const n = ticked.filter(i => !taken[i]).length;
  await popupModal(scr, { title: o.title || 'เพิ่มยานพาหนะ', sub: o.sub || 'แสดงเฉพาะยานพาหนะประเภท 09 ที่ต้องตรวจ ปจ.2 · 3 คันอยู่ในแผนอื่นที่ยังไม่ปิด', w: 1140, body, ok: 'เพิ่มยานพาหนะ' + (n ? ' (' + n + ')' : ''), okOff: !n });
}

/* ============================================================================
   S3 หัวหน้า กบค. — การอนุมัติแผน ปจ.2 (แท็บแผนใหญ่ / แผนเดินทาง · การ์ดสถานะ Metric item กรอง)
   ============================================================================ */
const APR_COLS = [['ชื่อ', 0], ['ช่วงเวลา', 230], ['ยานพาหนะ', 120], ['วันที่ส่ง', 140], ['สถานะ', 150], ['', 72]];
async function approvals(name, o) {
  o = o || {};
  const trip = o.tab === 1;
  const { scr, page } = await shell(name, { title: 'การอนุมัติแผน ปจ.2', crumbs: ['การอนุมัติแผน ปจ.2'] });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs([['แผนใหญ่', null], ['แผนเดินทาง', null]], trip ? 1 : 0), 'h');
  const counts = trip ? [o.waitN != null ? o.waitN : 1, 0, 2] : [o.waitN != null ? o.waitN : 2, 0, 3];
  add(sec, metricRow([await metric('รออนุมัติ', counts[0], 'Warning'), await metric('ส่งกลับแก้ไข', counts[1], 'Error'), await metric('อนุมัติแล้ว', counts[2], 'Success')]), 'h');
  const rows = o.rows || (trip ? [[T3.name, T3.mr + ' · ' + VENDORS[1][0], T3.d1 + ' – ' + T3.d2, '2 คัน', T3.sent]] : [[PLANS[1].mr, PLANS[1].name, contractTxt(PLANS[1]), '1 คัน', PLANS[1].sent], [PLANS[5].mr, PLANS[5].name, contractTxt(PLANS[5]), '1 คัน', PLANS[5].sent]]);
  const ticked = o.ticked || [];
  add(sec, await tableHeader({ placeholder: trip ? 'ค้นหาชื่อแผนเดินทาง, เลขที่ MR' : 'ค้นหาเลขที่ MR, ชื่อแผน', noFilter: true, more: [{ text: trip ? 'อนุมัติแผนเดินทาง' + (ticked.length ? ' (' + ticked.length + ')' : '') : 'อนุมัติแผน' + (ticked.length ? ' (' + ticked.length + ')' : ''), icon: 'check-24-300-round', disabled: !ticked.length }] }), 'h');
  if (!rows.length) add(sec, await dataEmpty('ไม่มีรายการรออนุมัติ', 'เมื่อมีแผนส่งมาให้อนุมัติ รายการจะแสดงที่นี่'), 'h');
  else {
    const data = rows.map((r, i) => [{ check: ticked.indexOf(i) >= 0, text: r[0], sub: r[1] }, r[2], r[3], r[4], { pill: ['รออนุมัติ', 'Warning'] }, viewCell()]);
    const t = await tblShort(APR_COLS, data); headCheck(t, data); add(sec, t, 'h');
  }
  if (o.confirm) await confirm(scr, { title: 'อนุมัติ ' + ticked.length + (trip ? ' แผนเดินทาง' : ' แผน'), sub: trip ? 'แผนเดินทางที่เลือกจะอนุมัติ ผู้รับจ้างเริ่มบันทึกผลได้ และแจ้งเตือนผู้ดูแลยานพาหนะกับ กรย.' : 'แผนที่เลือกจะอนุมัติ ผู้รับจ้างของแผนเห็นแผน และ กบค. สร้างแผนเดินทางได้', ok: 'อนุมัติ' });
  if (o.toast) notify(scr, o.toast);
  return scr;
}
const DEC = (trip) => [['อนุมัติ', trip ? 'แจ้งผู้รับจ้าง กรย. และผู้ดูแลยานพาหนะ · ผู้รับจ้างเริ่มบันทึกผลตรวจได้' : 'ผู้รับจ้างเห็นแผน · กบค. สร้างแผนเดินทางและนัดวันเข้าตรวจได้'], ['ส่งกลับแก้ไข', trip ? 'กบค. แก้ไขแผนเดินทางแล้วส่งอนุมัติใหม่' : 'กบค. แก้ไขแผนแล้วส่งอนุมัติใหม่']];
async function decisionSec(trip, sel, reason, err) {
  const kids = [await sectionLabel('ผลการพิจารณา'), radioCards(DEC(trip), sel)];
  if (sel === 1) kids.push(area('เหตุผลที่ส่งกลับ', reason || '', { placeholder: 'ระบุเหตุผลที่ส่งกลับ', error: err ? 'กรุณาระบุเหตุผลที่ส่งกลับ' : '' }));
  return col('Section', kids, 16);
}
const APR_CAR_COLS = [['ทะเบียน', 260, 'Lead text'], ['สังกัด', 180], ['วาระ', 170], ['ครบกำหนดตรวจ', 0]];
async function planApproval(name, o) {
  o = o || {};
  const p = o.plan || PLANS[1];
  const { scr, page } = await shell(name, { title: p.name, back: true, crumbs: ['การอนุมัติแผน ปจ.2', p.mr] });
  const parts = [];
  if (o.done) parts.push(alertBox('Success', 'อนุมัติแล้ว', 'โดย ' + HEAD1 + ' · 26/11/2569'));
  else parts.push(await decisionSec(false, o.sel == null ? -1 : o.sel, o.reason, o.err));
  parts.push(...await planBoxes(p));
  parts.push(col('Section', [await sectionLabel('ยานพาหนะในแผน', { badge: p.cars.length }), await tblShort(APR_CAR_COLS, p.cars.map(id => [{ text: V[id][0], sub: V[id][1] + ' · ' + V[id][2] }, V[id][3], { text: V[id][7] + ' เดือน', sub: V[id][8] || undefined }, V[id][6]]))], 16));
  if (!o.done) parts.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg', disabled: o.sel == null || (o.sel === 1 && !o.reason) }]]));
  add(page, col('Content', parts, 32), 'h');
  return scr;
}
const TRIP_CAR_COLS = [['ทะเบียน', 240, 'Lead text'], ['สถานที่ตรวจ / ผู้ดูแลยานพาหนะ', 0], ['วันดำเนินการ', 200], ['ค่าจ้างตรวจ', 160]];
const tripCarView = (t, id) => [{ text: V[id][0], sub: V[id][1] + ' · ' + V[id][2] }, { text: 'สำนักงาน ' + V[id][3], sub: ADMIN[V[id][3]][0] + ' · ' + ADMIN[V[id][3]][1] }, { text: t.d1 + ' – ' + t.d2, sub: 'ตามช่วงวันที่ดำเนินการ' }, baht(t.costs[id])];
async function tripApproval(name, o) {
  o = o || {};
  const t = o.trip || T3, p = planOf(t.mr);
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: ['การอนุมัติแผน ปจ.2', t.name] });
  const parts = [o.done ? alertBox('Success', 'อนุมัติแล้ว', 'โดย ' + HEAD1 + ' · 26/11/2569') : await decisionSec(true, o.sel == null ? -1 : o.sel, o.reason, o.err)];
  parts.push(...await tripBoxes(t, p));
  parts.push(col('Section', [await sectionLabel('ยานพาหนะในแผนเดินทาง', { badge: t.cars.length + ' คัน · งบประมาณ ' + baht(tripBudget(t)) }), await tblShort(TRIP_CAR_COLS, t.cars.map(id => tripCarView(t, id)))], 16));
  if (!o.done) parts.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg', disabled: o.sel == null || (o.sel === 1 && !o.reason) }]]));
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ============================================================================
   S4 รายละเอียดแผน (กบค.) — กล่องข้อมูลแผน + ผู้รับจ้าง · ตารางแผนเดินทาง · ยานพาหนะในแผน
   ============================================================================ */
const TRIP_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวันที่ดำเนินการ', 210], ['ผลตรวจอนุมัติ', 140], ['ตรวจไม่ได้', 110], ['ค่าจ้างตรวจรวม', 150], ['สถานะ', 130], ['', 72]];
const CAR_COLS = [['ทะเบียน', 220, 'Lead text'], ['สังกัด', 150], ['ผู้ดูแลยานพาหนะ', 190], ['วาระ', 130], ['แผนเดินทาง', 0], ['ผล ปจ.2', 180], ['สถานะ', 150], ['', 72]];   /* ผู้ดูแลยานพาหนะ (เว็บ 27 พ.ย. 2569): ของแผนเดินทาง · ยังไม่มี = ผู้ดูแลหลักของสังกัด */
const tripOfCar = (id) => [T1, T2].find(t => t.cars.indexOf(id) >= 0);
const carRowDetail = (id, o) => {
  const v = V[id], t = tripOfCar(id), n = machinesOfCar(id).length;
  const st = !t ? null : carSt(t, id);
  return [o && o.check ? { check: (o.ticked || []).indexOf(id) >= 0, text: v[0], sub: v[1] + ' · ' + v[2], disabled: st !== 'sent' } : { text: v[0], sub: v[1] + ' · ' + v[2] }, v[3], { text: ADMIN[v[3]][0], sub: ADMIN[v[3]][1] }, { text: v[7] + ' เดือน', sub: n > 1 ? n + ' เครื่องมือกล' : v[8] || undefined },
    t ? { text: t.name, sub: 'วันดำเนินการ ' + t.d1 + ' – ' + t.d2 } : { pill: ['ยังไม่มีแผนเดินทาง', 'Gray'] },
    t ? resPills(t, id, ['sent', 'approved', 'returned']) : '-', st ? { pill: DOC_ST[st] } : '-', { icons: [st === 'sent' ? 'check-24-300-round' : 'quick_reference_all-24-300-round'] }];
};
async function planDetail(name, o) {
  o = o || {};
  const p = o.plan || P10, own = p.dept === 'กบค.';
  const trips = o.trips || (p.mr === 'MRZ7000010' ? [T1, T2] : []);
  const actions = !own ? null : (p.st === 'review' || p.st === 'returned') ? [['Secondary danger button', 'ลบ', 'delete-24-300-round'], ['Secondary button', 'แก้ไข', 'stylus-24-300-round']] : p.st === 'approved' && !trips.length ? [['Secondary danger button', 'ยกเลิกแผน', 'close-24-300-round']] : null;
  const { scr, page } = await shell(name, { title: p.name, back: true, crumbs: ['บำรุงรักษาตามวาระ', 'รายละเอียดแผน'], actions });
  const parts = [];
  parts.push(...await planBoxes(p, { extra: p.st === 'returned' ? [['เหตุผลที่ส่งกลับแก้ไข', 'แก้ชื่อแผนให้ระบุภาคที่ตรวจ']] : p.st === 'cancelled' ? [['ยกเลิกเมื่อ', '26/11/2569 · ผู้รับจ้างยกเลิกสัญญา']] : [] }));
  const canCreate = own && p.st === 'approved';
  const tripSec = col('Section', [await sectionLabel('แผนเดินทาง', { badge: trips.length, buttons: canCreate && trips.length ? [{ kind: 'Primary button', text: 'สร้างแผนเดินทาง', icon: 'add-24-300-round', disabled: p.mr === 'MRZ7000010' }] : [] })], 16);
  if (trips.length) add(tripSec, await tblShort(TRIP_COLS, trips.map(t => [{ text: t.name }, t.d1 + ' – ' + t.d2, { text: t.id === T1.id ? '2/4 คัน' : '0/' + t.cars.length + ' คัน', sub: t.id === T1.id ? 'รออนุมัติ 1 คัน' : undefined },
    t.id === T1.id ? '1 คัน' : '0 คัน', t.id === T1.id ? '9,000.00 บาท' : '0.00 บาท', { pill: TRIP_ST[t.st] }, viewCell()])), 'h');
  else add(tripSec, await dataEmpty('ยังไม่มีแผนเดินทาง', canCreate ? 'สร้างแผนเดินทางเพื่อนัดวันเข้าตรวจ กำหนดค่าจ้างรายคัน และแจ้ง กรย. กับผู้ดูแลยานพาหนะ' : p.st === 'cancelled' ? 'แผนนี้ถูกยกเลิกแล้ว' : 'สร้างแผนเดินทางได้หลังหัวหน้า กบค. อนุมัติแผน', canCreate ? 'สร้างแผนเดินทาง' : null), 'h');
  parts.push(tripSec);
  const check = own && p.mr === 'MRZ7000010' && !o.noCheck, ticked = o.ticked || [];
  const carSec = col('Section', [await sectionLabel('ยานพาหนะในแผน', { badge: p.cars.length, buttons: check ? [{ kind: 'Primary button', text: 'อนุมัติ' + (ticked.length ? ' (' + ticked.length + ' คัน)' : ''), icon: 'check-24-300-round', disabled: !ticked.length }] : [] })], 16);
  if (p.cars.length) { const rows = p.cars.map(id => carRowDetail(id, { check, ticked })); const t = await tblShort(CAR_COLS, rows); if (check) headCheck(t, rows); add(carSec, t, 'h'); }
  else add(carSec, await dataEmpty('ไม่มียานพาหนะในแผน', 'แผนนี้เสร็จสิ้นแล้ว'), 'h');
  parts.push(carSec);
  add(page, col('Content', parts, 32), 'h');
  if (o.cancel) await formModal(scr, { title: 'ยกเลิกแผน ' + p.mr, sub: 'ยกเลิกได้เฉพาะแผนที่ยังไม่มีผลตรวจ · แผนเดินทางของแผนนี้จะถูกลบ และยานพาหนะกลับไปเลือกเข้าแผนอื่นได้', fields: [{ label: 'เหตุผลที่ยกเลิก', value: o.cancel === 2 ? 'ผู้รับจ้างยกเลิกสัญญา' : '', area: 1, placeholder: 'ระบุเหตุผล' }], ok: 'ยกเลิกแผน', danger: true });
  if (o.del) await confirm(scr, { danger: true, title: 'ยืนยันการลบแผนตรวจ ปจ.2', sub: 'แผนและรายการยานพาหนะในแผนจะถูกลบ ไม่สามารถกู้คืนได้', ok: 'ลบแผน' });
  if (o.bulk) await confirm(scr, { title: 'อนุมัติผลตรวจ ปจ.2 ' + ticked.length + ' คัน', sub: 'เครื่องมือกลที่รออนุมัติของคันที่เลือก ' + sentUnits(T1, ticked) + ' เครื่อง · ผลตรวจและเอกสารจะถูกล็อก ส่งกลับแก้ไขไม่ได้อีก', ok: 'อนุมัติ' });
  if (o.toast) notify(scr, o.toast);
  return scr;
}
const sentUnits = (t, cars) => cars.reduce((a, id) => a + unitRes(t, id).filter(r => r && r[0] === 'sent').length, 0);

/* ============================================================================
   S5 สร้าง/แก้ไขแผนเดินทาง — 2 เส้น: กบค. สร้างเอง · ผู้รับจ้างเสนอ (byVendor) · ค่าจ้างรายคันไม่บังคับ
   ============================================================================ */
const TRIP_FORM_COLS = [['ทะเบียน', 260], ['สถานที่ตรวจ / ผู้ดูแลยานพาหนะ', 0], ['วันดำเนินการ', 200], ['ค่าจ้างตรวจ (บาท)', 160], ['', 104]];
async function tripForm(name, o) {
  o = o || {};
  const p = o.plan || P10, t = o.trip, vendor = !!o.byVendor, v = o.values || {};
  const head = t ? 'แก้ไขแผนเดินทาง' : 'สร้างแผนเดินทาง';
  const proposed = !!t && t.st === 'proposed';   /* แผนเดินทางที่ผู้รับจ้างเสนอ: หน่วยงานที่สร้างแผนเปิดแล้วมาหน้านี้เลย · ลบได้ที่หัวหน้า · ไม่มีส่งออก (เว็บ 27 พ.ย. 2569) */
  const { scr, page } = await shell(name, { title: head, back: true, crumbs: vendor ? ['เอกสาร ปจ.2', p.mr, head] : ['บำรุงรักษาตามวาระ', p.mr, head], actions: proposed ? [['Secondary danger button', 'ลบ', 'delete-24-300-round']] : null });
  const sel = v.cars || [], costs = v.costs || {};
  const work = field('ช่วงวันที่ดำเนินการ', v.d1 ? v.d1 + ' – ' + v.d2 : '', { placeholder: 'เลือกวันเริ่มและวันสิ้นสุด', lead: 'calendar_month-24-300-round', state: o.dateOpen ? 'Focused' : undefined, error: o.errors && !v.d1 ? 'กรุณาเลือกช่วงวันที่ดำเนินการ' : '' });
  const info = col('Section', [await section('ข้อมูลแผนเดินทาง'),
    alertBox('Gray', vendor ? 'ส่งให้ ' + p.dept + ' ตรวจหรือแก้ไข แล้วส่งให้หัวหน้า ' + p.dept + ' อนุมัติ' : t && t.by === 'vendor' ? 'ผู้รับจ้างเสนอแผนเดินทางนี้' : t && t.st === 'active' ? 'แผนเดินทางอนุมัติแล้ว บันทึกการแก้ไขแล้วมีผลทันที' : 'ผู้รับจ้างเห็นแผนเดินทางหลังหัวหน้า กบค. อนุมัติ',
      vendor ? 'บันทึกผลตรวจได้หลังอนุมัติ · ช่วงวันที่ดำเนินการเป็นวันดำเนินการตั้งต้นของทุกคัน' : t && t.by === 'vendor' ? 'ตรวจหรือแก้ไข (กรอกค่าจ้างรายคันได้) แล้วส่งให้หัวหน้า กบค. อนุมัติ' : 'ช่วงวันที่ดำเนินการเป็นวันดำเนินการตั้งต้นของทุกคัน (เปลี่ยนช่วง = วันดำเนินการรายคันกลับเป็นค่าเริ่มต้น)'),
    row('Row', [field('ชื่อแผนเดินทาง', v.name, { placeholder: 'เช่น ตรวจ ปจ.2 ภาคเหนือ', error: o.errors && !v.name ? 'กรุณาระบุชื่อแผนเดินทาง' : '' }), field('ผู้รับจ้าง', vend(p)[0], { state: 'Readonly' })]),
    row('Row', [field('ระยะเวลาตามสัญญา', contractTxt(p) + ' (' + p.days + ' วัน)', { state: 'Readonly' }), work])], 16);
  const carSec = col('Section', [await section('ยานพาหนะในแผนเดินทาง', { badge: sel.length + ' คัน · งบประมาณ ' + (sel.length ? baht(sel.reduce((a, c) => a + (costs[c] || 0), 0)).replace('ยังไม่กำหนด', '0.00 บาท') : '0.00 บาท'),
    buttons: sel.length ? [{ kind: 'Secondary button', text: 'เพิ่มยานพาหนะ', icon: 'add-24-300-round' }] : [] })], 16);
  if (!vendor && o.over) add(carSec, alertBox('Warning', 'งบประมาณแผนเดินทางรวมเกินงบประมาณของแผน 4,500.00 บาท', 'งบประมาณของแผน 45,000.00 บาท · แผนเดินทางทั้งหมดของแผนนี้รวม 49,500.00 บาท · บันทึกต่อได้'), 'h');
  if (sel.length) {
    const rows = sel.map(id => [{ check: (o.ticked || []).indexOf(id) >= 0, text: V[id][0], sub: V[id][1] + ' · ' + V[id][2] }, { text: 'สำนักงาน ' + V[id][3], sub: ADMIN[V[id][3]][0] + ' · ' + ADMIN[V[id][3]][1] },
      { text: v.d1 ? v.d1 + ' – ' + v.d2 : '-', sub: v.d1 ? 'ตามช่วงวันที่ดำเนินการ' : undefined }, costs[id] ? costs[id].toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'ยังไม่กำหนด', { icons: ['stylus-24-300-round', 'delete-24-300-round'] }]);
    const tb = await tblShort(TRIP_FORM_COLS, rows); headCheck(tb, rows); add(carSec, tb, 'h');
  } else add(carSec, await dataEmpty('ยังไม่มียานพาหนะในแผนเดินทาง', 'เพิ่มยานพาหนะของแผนนี้ที่ยังไม่อยู่ในแผนเดินทางใด อย่างน้อย 1 คัน', 'เพิ่มยานพาหนะ'), 'h');
  const complete = v.name && v.d1 && sel.length;
  add(page, col('Content', [t && t.st === 'returned' ? alertBox('Error', 'หัวหน้า กบค. ส่งกลับให้แก้ไข', 'ตรวจวันที่อีกครั้ง · แก้ไขแล้วกดบันทึกและส่งอนุมัติอีกครั้ง') : null, info, carSec,
    btnRow([['Secondary button', t ? 'ยกเลิก' : 'ย้อนกลับ', { size: 'lg' }], ['Primary button', t && t.st === 'active' ? 'บันทึก' : 'บันทึกและส่งอนุมัติ', { size: 'lg', disabled: !complete }]])], 32), 'h');
  if (o.dateOpen && !MOB) {
    const dp = await thaiDatePicker(inst('Date picker', { Type: 'Dual' }, { 'Time picker': false }), ['ธันวาคม 2569', 'มกราคม 2570']);
    overlay(scr, dp, 0, 0);
    pin(() => { const sb = scr.absoluteBoundingBox, ab = work.absoluteBoundingBox; dp.x = Math.min(ab.x - sb.x, VW() - dp.width - 24); dp.y = ab.y - sb.y + ab.height + 4; });
  }
  if (o.picker) await vehiclePicker(scr, { title: 'เพิ่มยานพาหนะ', sub: 'เลือกจากยานพาหนะในแผนที่ยังไม่อยู่ในแผนเดินทางใด', pool: o.picker.pool || ['v17', 'v18', 'v19', 'v20', 'v23'], ticked: o.picker.ticked || [], total: 5 });
  if (o.carEdit) await formModal(scr, { title: 'แก้ไขยานพาหนะในแผนเดินทาง · ' + V[o.carEdit][0], sub: 'ค่าเริ่มต้น: สำนักงาน ' + V[o.carEdit][3] + ' · ' + ADMIN[V[o.carEdit][3]][0],
    fields: [{ pair: [{ label: 'เบอร์ติดต่อ', value: ADMIN[V[o.carEdit][3]][1] }, { label: 'ผู้ดูแลยานพาหนะ', value: ADMIN[V[o.carEdit][3]][0] }] }, { label: 'สถานที่ตรวจ', value: 'สำนักงาน ' + V[o.carEdit][3] }, { label: 'วันดำเนินการ', value: v.d1 + ' – ' + v.d2 }], ok: 'บันทึก' });
  if (o.costFor) await formModal(scr, { title: 'กำหนดค่าจ้างตรวจ · ' + o.costFor + ' คัน', sub: 'ใส่ค่าเดียวกันให้ทุกคันที่ติ๊ก', fields: [{ label: 'ค่าจ้างตรวจ (บาท)', value: '9,000.00' }], ok: 'บันทึก' });
  if (o.leave) await confirm(scr, { danger: true, title: 'ยืนยันการออกจากหน้านี้', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'อยู่ต่อ', ok: 'ออกจากหน้านี้' });
  if (o.del) await confirm(scr, { danger: true, title: 'ยืนยันการลบแผนเดินทาง', sub: 'ยานพาหนะในแผนเดินทางนี้จะกลับไปเป็นคันที่ยังไม่มีแผนเดินทาง', ok: 'ลบแผนเดินทาง' });
  return scr;
}
const TRIP_FILLED = { name: 'ตรวจ ปจ.2 ภาคเหนือและภาคกลาง', d1: '01/12/2569', d2: '15/01/2570', cars: ['v17', 'v18', 'v19'], costs: { v17: 9000, v18: 9500, v19: 9000 } };
const TRIP_VENDOR = { name: 'ตรวจ ปจ.2 ปทุมธานี', d1: '21/12/2569', d2: '10/01/2570', cars: ['v23'], costs: {} };

/* ============================================================================
   S6 รายละเอียดแผนเดินทาง (กบค.) · ผลการตรวจ ปจ.2 รายคัน · แผนเดินทางที่ผู้รับจ้างเสนอ
   ============================================================================ */
const RES_COLS = [['ทะเบียน', 200, 'Lead text'], ['ผู้ดูแลยานพาหนะ', 0], ['ครบกำหนดตรวจ', 150], ['วันที่ตรวจ', 120], ['ผล ปจ.2', 120], ['ค่าจ้างตรวจ', 150], ['สถานะ', 160], ['', 72]];
const resRow = (t, id, o) => {   /* แถวละคัน มีเครื่องอยู่ข้างใน (resultCells ของเว็บ): บรรทัดรอง สังกัด · n เครื่องมือกล · วันที่ตรวจล่าสุด x/y เครื่อง · ผลป้ายต่อเครื่อง · สถานะรวมของคัน */
  const v = V[id], n = machinesOfCar(id).length, st = carSt(t, id), dates = unitRes(t, id).filter(r => r && r[2]).map(r => r[2]);
  const sub = v[3] + (n > 1 ? ' · ' + n + ' เครื่องมือกล' : '');
  const lead = o && o.check ? { check: (o.ticked || []).indexOf(id) >= 0, text: v[0], sub, disabled: !(o.can || ['sent']).includes(st) } : { text: v[0], sub };
  return [lead, { text: ADMIN[v[3]][0], sub: ADMIN[v[3]][1] }, { text: v[6], sub: 'วาระ ' + v[7] + ' เดือน' }, dates.length ? { text: dates[dates.length - 1], sub: n > 1 ? dates.length + '/' + n + ' เครื่อง' : undefined } : '-', resPills(t, id),
    { text: baht(t.costs[id]), sub: t.costs[id] ? 'ตามสัญญา' : undefined }, { pill: DOC_ST[st] }, { icons: [o && o.vendor ? (st === 'approved' || st === 'sent' ? 'quick_reference_all-24-300-round' : 'stylus-24-300-round') : st === 'sent' ? 'check-24-300-round' : st === 'approved' ? 'quick_reference_all-24-300-round' : 'stylus-24-300-round'] }];
};
async function tripDetail(name, o) {
  o = o || {};
  const t = o.trip || T1, p = planOf(t.mr), proposed = t.st === 'proposed';
  /* แผนเดินทางที่ผู้รับจ้างเสนอ: หน่วยงานที่สร้างแผนไปหน้าแก้ไข (tripForm) · หน้านี้ = ดูอย่างเดียว ไม่มีปุ่มส่งออก (เว็บ 27 พ.ย. 2569) */
  const actions = proposed ? [] : [['Secondary button', 'ส่งออก', 'download-24-300-round']];
  if (t.st === 'active') actions.push(['Secondary button', 'ปิดแผนเดินทาง', 'check-24-300-round'], ['Secondary button', 'แก้ไข', 'stylus-24-300-round']);
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: ['บำรุงรักษาตามวาระ', p.mr, t.name], actions });
  const parts = [];
  if (t.st === 'closed') parts.push(alertBox('Success', 'เสร็จสิ้นเมื่อ 26/11/2569', 'กบค. อนุมัติผลตรวจครบทุกคันหรือปิดแผนเดินทางแล้ว · ทะเบียน ปจ.2 อัปเดตตามผลที่อนุมัติ'));
  parts.push(...await tripBoxes(t, p));
  if (t.st === 'closed') parts.push(col('Section', [await sectionLabel('สรุปผลการตรวจ'), kv([['ผลอนุมัติแล้ว', '4/4 คัน'], ['ผ่าน', '3 เครื่อง'], ['ไม่ผ่าน', '1 เครื่อง'], ['ระงับ', '0 เครื่อง'], ['ตรวจไม่ได้', '1 เครื่อง'], ['ค่าจ้างตรวจรวม', '27,500.00 บาท'], ['งบประมาณ', '36,500.00 บาท']])], 16));
  const check = t.st === 'active' && !o.noCheck, ticked = o.ticked || [];
  const sec = col('Section', [await sectionLabel('ผลการตรวจ ปจ.2 รายคัน', { badge: 'อนุมัติแล้ว ' + t.cars.filter(c => t.res[c] && t.res[c][0] === 'approved').length + '/' + t.cars.length + ' คัน',
    buttons: check ? [{ kind: 'Primary button', text: 'อนุมัติ' + (ticked.length ? ' (' + ticked.length + ' คัน)' : ''), icon: 'check-24-300-round', disabled: !ticked.length }] : [] })], 16);
  const rows = t.cars.map(id => resRow(t, id, { check, ticked })); const tb = await tblShort(RES_COLS, rows); if (check) headCheck(tb, rows); add(sec, tb, 'h');
  parts.push(sec);
  add(page, col('Content', parts, 32), 'h');
  if (o.close) await confirm(scr, { title: 'ปิดแผนเดินทาง ' + t.name, sub: 'ยานพาหนะที่ยังไม่อนุมัติผล 2 คันจะออกจากแผนเดินทางนี้ กลับไปเป็นคันที่ยังไม่มีแผนเดินทาง (สร้างแผนเดินทางใหม่ หรือเอาออกจากแผนได้) · ผลที่ยังไม่อนุมัติของคันเหล่านั้นจะถูกล้าง เครื่องที่อนุมัติแล้วเก็บผลไว้ แผนเดินทางใหม่ส่งผลแค่เครื่องที่ค้าง', ok: 'ปิดแผนเดินทาง' });
  if (o.del) await confirm(scr, { danger: true, title: 'ยืนยันการลบแผนเดินทาง', sub: 'ยานพาหนะในแผนเดินทางนี้จะกลับไปเป็นคันที่ยังไม่มีแผนเดินทาง', ok: 'ลบแผนเดินทาง' });
  if (o.bulk) await confirm(scr, { title: 'อนุมัติผลตรวจ ปจ.2 ' + ticked.length + ' คัน', sub: 'เครื่องมือกลที่รออนุมัติของคันที่เลือก ' + sentUnits(t, ticked) + ' เครื่อง · ผลตรวจและเอกสารจะถูกล็อก ส่งกลับแก้ไขไม่ได้อีก', ok: 'อนุมัติ' });
  if (o.export) await popupModal(scr, { title: 'ส่งออกแผนเดินทาง', sub: t.name + ' · ยานพาหนะ ' + t.cars.length + ' คัน และผลการตรวจ ปจ.2 รายคัน (ป้ายผลต่อเครื่องคั่นด้วยจุลภาค)', w: 640, ok: 'ส่งออก',
    body: [labeled('รูปแบบไฟล์', radioCards([['PDF', 'เอกสาร A4 สำหรับพิมพ์หรือแนบเอกสาร'], ['Excel', 'ไฟล์ .csv เปิดด้วย Excel ได้']], 0))] });
  if (o.result) await resultModal(scr, t, o.result.car, o.result);
  if (o.toast) notify(scr, o.toast);
  return scr;
}
/* popup ผลการตรวจ ปจ.2 รายคัน (ResultModal ของเว็บ) — ผู้รับจ้างบันทึก · กบค. พิจารณา (อนุมัติ / ส่งกลับแก้ไข) · บันทึกแทนผู้รับจ้าง */
async function resultModal(scr, t, id, o) {   /* popup ของคัน: แท็บต่อเครื่อง (CarResultModal) + ผลของเครื่องที่เลือก (ResultModal) · o.unit = ลำดับเครื่อง */
  o = o || {};
  const v = V[id], ms = machinesOfCar(id), ui = o.unit || 0, m = ms[ui], r = unitRes(t, id)[ui] || [], res = o.res || r[1] || '', st = r[0] || 'none';
  const cannot = res === 'ตรวจไม่ได้', needFile = res === 'ผ่าน' || res === 'ไม่ผ่าน';
  const body = [];
  if (ms.length > 1) body.push(await tabs(ms.map(x => [machineTag(ms, x), null]), ui));
  if (MOB) body.push(kv([['ทะเบียน', v[0]], ['เครื่องมือกล', machineLabel(m)], ['รหัสทรัพย์สิน', m.asset + ' - ' + m.sub], ['วาระการตรวจ', v[7] + ' เดือน']]));
  if (st === 'returned' && o.mode !== 'review') body.push(alertBox('Error', 'กบค. ส่งกลับแก้ไข', r[3] + ' · แก้ไขแล้วกดส่งอนุมัติอีกครั้ง'));
  const sum = v[0] + ' · ' + machineLabel(m) + ' · วาระ ' + v[7] + ' เดือน';
  if (o.mode === 'review' || o.mode === 'view') {
    body.push(kv([['วันที่ตรวจ', r[2] || '-'], ['ค่าจ้างตรวจคันนี้', baht(t.costs[id])], ['ผลการตรวจ', res || '-'], ['ครบกำหนดตรวจเดิม', v[6]]].concat(cannot ? [['เหตุผลที่ตรวจไม่ได้', r[3]]] : []), 2));
    if (r[4]) body.push(await upload(cannot ? 'หนังสือรับรองจากผู้แทนหน่วยงาน' : 'เอกสารการตรวจ ปจ.2', [{ name: r[4], size: '1.2 MB' }], { readonly: true }));
    if (o.mode === 'review') {
      body.push(col('Section', [await sectionLabel('ผลการพิจารณา'), radioCards([['อนุมัติ', 'ทะเบียน ปจ.2 อัปเดตทันที'], ['ส่งกลับแก้ไข', 'ผู้รับจ้างแก้ไขแล้วส่งใหม่']], o.sel == null ? -1 : o.sel)], 16));
      if (o.sel === 1) body.push(area('เหตุผลที่ส่งกลับ', o.reason || '', { placeholder: 'ระบุเหตุผลที่ส่งกลับ', error: o.err ? 'กรุณาระบุเหตุผลที่ส่งกลับ' : '' }));
    }
    await popupModal(scr, { title: o.mode === 'review' ? 'พิจารณาผลการตรวจ ปจ.2' : 'ผลการตรวจ ปจ.2', sub: sum, w: 640, body, ok: o.mode === 'review' ? 'ยืนยันผลการพิจารณา' : null, cancel: o.mode === 'review' ? 'ยกเลิก' : 'ปิด', okOff: o.mode === 'review' && (o.sel == null || (o.sel === 1 && !o.reason)) });
    return;
  }
  /* บันทึกผล (ผู้รับจ้าง · บันทึกแทน) */
  const date = o.date || r[2] || '';
  body.push(row('Row', [field('วันที่ตรวจ', date, { placeholder: 'ระบุวันที่', lead: 'calendar_month-24-300-round', error: o.errors && !date ? 'กรุณาเลือกวันที่ตรวจ' : '' }),
    field('ค่าจ้างตรวจคันนี้ (บาท)', t.costs[id] ? t.costs[id].toLocaleString('en-US', { minimumFractionDigits: 2 }) : '', { state: 'Disabled', placeholder: 'ยังไม่กำหนด' })]));
  body.push(labeled('ผลการตรวจ', radioCards(RESULTS, RESULTS.indexOf(res))));
  if (cannot) body.push(area('เหตุผลที่ตรวจไม่ได้', o.reason || '', { placeholder: 'ระบุเหตุผล', error: o.errors && !o.reason ? 'กรุณาระบุเหตุผลที่ตรวจไม่ได้' : '' }));
  const files = o.files || (r[4] && st !== 'none' ? [{ name: r[4], size: '1.2 MB' }] : []);
  body.push(await upload(cannot ? 'หนังสือรับรองจากผู้แทนหน่วยงาน' : 'เอกสารการตรวจ ปจ.2', files, { optional: res && !needFile, hint: 'PDF, PNG, JPG · ไฟล์ละไม่เกิน 10 MB · สูงสุด 10 ไฟล์', error: o.errors && needFile && !files.length ? 'กรุณาแนบเอกสารอย่างน้อย 1 ไฟล์' : '' }));
  const complete = date && res && (!cannot || o.reason) && (!needFile || files.length);
  const r0 = await popupModal(scr, { title: o.behalf ? 'บันทึกผลการตรวจ ปจ.2 แทนผู้รับจ้าง' : 'บันทึกผลการตรวจ ปจ.2', sub: sum, w: 640, body, ok: 'ส่งอนุมัติ', okOff: !complete });
  if (r0 && r0.m) { const ft = r0.m.findAll(n => n.type === 'INSTANCE' && n.name === 'Modal footer')[0]; const tb = ft && ft.findAll(n => n.type === 'INSTANCE' && n.name === 'Tertiary button')[0]; if (tb) { /* ปุ่ม "บันทึก" (เก็บไว้ กรอกไม่ครบได้) ใช้ Tertiary action ของ Modal footer */ setProps(ft, { 'Tertiary action': true }); tb.visible = true; setProps(tb, { Text: 'บันทึก', 'Leading icon': false, 'Trailing icon': false }); } }
  if (o.dateOpen && !MOB && r0 && r0.m) { const dp = await thaiDatePicker(inst('Date picker', { Type: 'Single' }, { 'Time picker': false }), ['พฤศจิกายน 2569']); overlay(scr, dp, 0, 0); const di = r0.body.findAll(n => n.type === 'INSTANCE' && n.name === 'Text input')[0]; pin(() => { const sb = scr.absoluteBoundingBox, ab = di.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4; }); }
}

/* ============================================================================
   S7–S9 ผู้รับจ้าง — เอกสาร ปจ.2 (รายการแผน) · หน้าแผนของผู้รับจ้าง · แผนเดินทางของผู้รับจ้าง
   ============================================================================ */
const VPLAN_COLS = [['เลขที่ MR', 0, 'Lead text'], ['ระยะเวลาตามสัญญา', 220], ['ยานพาหนะ', 110], ['แผนเดินทาง', 120], ['อนุมัติแล้ว', 120], ['ตรวจไม่ได้', 110], ['สถานะ', 210], ['', 72]];
const V_PLANS = [[P10, '2 แผน', '2/5 คัน', '1 คัน', ['มีเอกสารที่ถูกส่งกลับแก้ไข', 'Error']], [PLANS[4], '1 แผน', '0/1 คัน', '0 คัน', ['รออนุมัติ', 'Info']], [DONE_PLANS[0], '0 แผน', '0/0 คัน', '0 คัน', ['เสร็จสิ้น', 'Success']]];   /* ตาราง status ข้อ 25: เสร็จสิ้นสีเขียว · ข้อ 20: แผนที่ยังไม่มีแผนเดินทางที่อนุมัติ = "อนุมัติแล้ว" (ฟ้า) */
async function vendorPlans(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'เอกสาร ปจ.2', crumbs: ['เอกสาร ปจ.2'] });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  const list = o.rows || V_PLANS;
  if (!list.length) { add(sec, await dataEmpty('ยังไม่มีแผนที่คุณเป็นผู้รับจ้าง', 'เมื่อแผนที่ระบุคุณเป็นผู้รับจ้างได้รับอนุมัติ แผนจะแสดงที่นี่'), 'h'); return scr; }
  add(sec, await tableHeader({ placeholder: 'ค้นหาเลขที่ MR', noFilter: true }), 'h');
  add(sec, await tblShort(VPLAN_COLS, list.map(([p, nt, ok, cn, st]) => [p.mr, { text: contractTxt(p), sub: p.days + ' วัน' }, p.cars.length + ' คัน', nt, ok, cn, { pill: st }, viewCell()]), { pagination: list.length }), 'h');
  return scr;
}
const VTRIP_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวันที่ดำเนินการ', 210], ['ยานพาหนะ', 110], ['อนุมัติแล้ว', 120], ['ตรวจไม่ได้', 110], ['สถานะ', 210], ['', 72]];
const VCAR_COLS = [['ทะเบียน', 220, 'Lead text'], ['สังกัด / สถานที่ตรวจ', 0], ['ครบกำหนดตรวจ', 150], ['แผนเดินทาง', 240], ['ผล ปจ.2', 120]];
async function vendorPlan(name, o) {
  o = o || {};
  const p = o.plan || P10, trips = o.trips || [T1, T2], can = o.can !== false;
  const { scr, page } = await shell(name, { title: p.mr, back: true, crumbs: ['เอกสาร ปจ.2', p.mr] });
  const parts = [col('Section', [await sectionLabel('ข้อมูลผู้รับจ้าง'), kv(vendorPairs(p))], 16)];
  const tsec = col('Section', [await sectionLabel('แผนเดินทาง', { badge: trips.length, buttons: can && trips.length ? [{ kind: 'Primary button', text: 'สร้างแผนเดินทาง', icon: 'add-24-300-round' }] : [] })], 16);
  if (trips.length) add(tsec, await tblShort(VTRIP_COLS, trips.map(t => [{ text: t.name }, t.d1 + ' – ' + t.d2, t.cars.length + ' คัน', t.id === T1.id ? '2/4 คัน' : '0/' + t.cars.length + ' คัน', t.id === T1.id ? '1 คัน' : '0 คัน',
    { pill: t.st === 'active' ? ['มีเอกสารที่ถูกส่งกลับแก้ไข', 'Error'] : t.st === 'closed' ? ['เสร็จสิ้น', 'Success'] : ['รออนุมัติ', 'Info'] }, viewCell()])), 'h');
  else add(tsec, await dataEmpty('ยังไม่มีแผนเดินทาง', 'สร้างแผนเดินทางเสนอ ' + p.dept + ' หรือรอ ' + p.dept + ' จัดแผนเดินทาง', can ? 'สร้างแผนเดินทาง' : null), 'h');
  parts.push(tsec);
  const inTrip = (id) => trips.find(t => t.cars.indexOf(id) >= 0);
  parts.push(col('Section', [await sectionLabel('ยานพาหนะในแผน', { badge: p.cars.length }), await tblShort(VCAR_COLS, p.cars.map(id => { const t = inTrip(id);
    return [{ text: V[id][0], sub: V[id][1] + ' · ' + V[id][2] }, { text: V[id][3], sub: t ? 'สำนักงาน ' + V[id][3] : undefined }, { text: V[id][6], sub: 'วาระ ' + V[id][7] + ' เดือน' },
      t ? { text: t.name, sub: 'วันดำเนินการ ' + t.d1 + ' – ' + t.d2 } : { pill: ['ยังไม่มีแผนเดินทาง', 'Gray'] }, t ? resPills(t, id, ['sent', 'approved']) : '-']; }), { pagination: p.cars.length })], 16));
  add(page, col('Content', parts, 32), 'h');
  if (o.toast) notify(scr, o.toast);
  return scr;
}
async function vendorTrip(name, o) {
  o = o || {};
  const t = o.trip || T1, p = planOf(t.mr), open = t.st === 'active';
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: ['เอกสาร ปจ.2', t.mr, t.name], actions: [['Secondary button', 'ส่งออก', 'download-24-300-round']] });
  const parts = [];
  if (!open && t.st !== 'closed') parts.push(alertBox('Warning', 'รออนุมัติแผนเดินทาง', 'ส่งเมื่อ ' + (t.sent || '26/11/2569') + ' · บันทึกผลตรวจได้หลังแผนเดินทางได้รับอนุมัติ'));
  if (t.st === 'closed') parts.push(alertBox('Success', 'เสร็จสิ้นเมื่อ 26/11/2569', 'กบค. อนุมัติผลตรวจครบทุกคันแล้ว · ดูและดาวน์โหลดเอกสารที่ส่งไปแล้วได้อย่างเดียว'));
  if (open && t.res.v20 && t.res.v20[0] === 'returned') parts.push(alertBox('Error', 'ส่งกลับแก้ไข 1 คัน', 'เปิดคันที่ถูกส่งกลับเพื่อดูเหตุผล แก้ไขผลหรือเอกสาร แล้วกดส่งอนุมัติอีกครั้ง'));
  parts.push(...await tripBoxes(t, p, true));
  const ready = o.ready || [], ticked = o.ticked || [];
  const sec = col('Section', [await sectionLabel('ผลการตรวจ ปจ.2 รายคัน', { badge: 'อนุมัติแล้ว ' + t.cars.filter(c => t.res[c] && t.res[c][0] === 'approved').length + '/' + t.cars.length + ' คัน',
    buttons: open && ready.length ? [{ kind: 'Primary button', text: 'ส่งอนุมัติ' + (ticked.length ? ' (' + ticked.length + ' คัน)' : ''), icon: 'arrow_right_alt-24-300-round', disabled: !ticked.length }] : [] })], 16);
  const res = o.res ? Object.assign({}, t, { res: Object.assign({}, t.res, o.res) }) : t;
  const rows = t.cars.map(id => resRow(res, id, { check: open && ready.length, ticked, can: ready.length ? ['draft', 'returned'] : [], vendor: true }));
  const tb = await tblShort(RES_COLS, rows); if (open && ready.length) headCheck(tb, rows); add(sec, tb, 'h');
  parts.push(sec);
  add(page, col('Content', parts, 32), 'h');
  if (o.result) await resultModal(scr, res, o.result.car, o.result);
  if (o.ask) await confirm(scr, { title: 'ยืนยันส่งผลการตรวจ ปจ.2 ' + ticked.length + ' คันเพื่ออนุมัติ', sub: 'เครื่องมือกลที่กรอกครบของคันที่เลือก ' + ticked.reduce((a, id) => a + unitRes(res, id).filter(r => r && r[0] === 'draft').length, 0) + ' เครื่อง · ระหว่างรออนุมัติจะแก้ไขหรือลบเอกสารไม่ได้ แต่ยังดูได้', ok: 'ส่งอนุมัติ' });
  if (o.toast) notify(scr, o.toast);
  return scr;
}

/* ============================================================================
   S10 ทะเบียน ปจ.2 · S11 ข้อมูลยานพาหนะ · S12 ผู้ดูแลยานพาหนะ (แจ้งเตือน)
   ============================================================================ */
const REG_COLS = [['ทะเบียน', 220, 'Lead text'], ['สังกัด', 0], ['ตรวจล่าสุด', 140], ['ผลล่าสุด', 180], ['ครบกำหนดครั้งถัดไป', 170], ['แผน', 140], ['', 104]];
const NO_RESULT = 'ยังไม่มีผลในระบบ';
const REG = [['v17', '12/11/2569', 'ผ่าน', '12/05/2570', 'MRZ7000010'], ['v18', '17/11/2569', 'ตรวจไม่ได้', '12/12/2569', 'MRZ7000010'], ['v42', '20/11/2569', 'ผ่าน', '20/11/2570', 'MRA7000013'],
  ['v01', '', '', '05/11/2569', '-'], ['v03', '05/06/2569', 'ผ่าน', '20/12/2569', '-'], ['v04', '10/07/2569', 'ระงับ', '10/01/2570', '-'], ['v05', '25/01/2569', 'ผ่าน', '25/01/2570', '-'],
  ['v16', '08/06/2569', 'ผ่าน', '08/06/2570', 'MRZ7000009'], ['v19', '03/01/2569', 'ไม่ผ่าน', '03/01/2570', 'MRZ7000010'], ['v24', '30/01/2569', 'ผ่าน', '30/01/2570', 'MRZ7000012']];
/* แถวละคัน (ทะเบียน ปจ.2 ของเว็บ): ตรวจล่าสุด บรรทัดรอง วาระ (+ n เครื่องมือกล) · ผลล่าสุดป้ายต่อเครื่อง (ไม่มีผล = "ยังไม่มีผลในระบบ") · แผน บรรทัดรอง = เจ้าของแผน · ไม่อยู่ในแผน */
const ownerOf = (mr) => (planOf(mr) || {}).dept || 'กบค.';
const regRow = (r) => { const id = r[0], ms = machinesOfCar(id), many = ms.length > 1;
  return [{ text: V[id][0], sub: V[id][1] + ' · ' + V[id][2] }, V[id][3], { text: r[1] || '-', sub: 'วาระ ' + V[id][7] + ' เดือน' + (many ? ' · ' + ms.length + ' เครื่องมือกล' : '') },
    { pills: ms.map((m, i) => { const l = i === 0 ? r[2] : ''; return [(many ? machineTag(ms, m) + ' · ' : '') + (l || NO_RESULT), l ? RES_C[l] : 'Gray']; }) },
    { text: r[3], sub: id === 'v01' ? 'เกินกำหนด 21 วัน' : id === 'v18' ? 'อีก 16 วัน' : undefined, tone: id === 'v01' ? 'error' : id === 'v18' ? 'warning' : undefined },
    r[4] !== '-' ? { text: r[4], sub: ownerOf(r[4]) } : 'ไม่อยู่ในแผน', { icons: ['quick_reference_all-24-300-round', 'cloud_upload-24-300-round'] }]; };
/* ที่มาของผลล่าสุด (sourceText ของเว็บ): ผลจากแผนที่อนุมัติ พ.ย. 2569 = "แผนตรวจ ปจ.2 MR…" · อื่นๆ = ผลนอกแผน */
const srcOf = (r) => r[4] !== '-' && /\/11\/2569$/.test(r[1]) ? 'แผนตรวจ ปจ.2 ' + r[4] : 'ผลนอกแผน';
/* popup ประวัติการตรวจ ปจ.2 ของคัน (HistoryModal) — แท็บต่อเครื่อง · ผลล่าสุดและย้อนหลัง 1 ครั้ง · เปิดจากทะเบียนและหน้าข้อมูลยานพาหนะ */
async function historyModal(scr, id, ui) {
  ui = ui || 0;
  const v = V[id], ms = machinesOfCar(id), m = ms[ui], r = REG.find(x => x[0] === id) || [id, '', '', v[6], '-'], has = ui === 0 && !!r[1];
  const body = [];
  if (ms.length > 1) body.push(await tabs(ms.map(x => [machineTag(ms, x), null]), ui));
  body.push(kv([['ผลล่าสุด', has ? r[2] : NO_RESULT], ['ตรวจล่าสุด', has ? r[1] : '-'], ['วาระการตรวจ', v[7] + ' เดือน'], ['ครบกำหนดครั้งถัดไป', has ? r[3] : v[6]],
    ['ผู้ครอบครอง', v[4] + ' · ' + v[5]], ['แผนที่ยังไม่ปิด', r[4] !== '-' ? r[4] : 'ไม่อยู่ในแผน']]));
  if (has && r[2] === 'ตรวจไม่ได้') body.push(alertBox('Gray', 'เหตุผลที่ตรวจไม่ได้', 'ยานพาหนะอยู่ระหว่างซ่อมระบบไฮดรอลิก ไม่สามารถยกกระเช้าทดสอบได้'));
  if (has) body.push(await upload('เอกสารผลล่าสุด', [{ name: r[2] === 'ตรวจไม่ได้' ? 'หนังสือรับรอง-' + v[0].split(' ')[0] + '.pdf' : 'ปจ2-' + v[0].split(' ')[0] + '.pdf', size: '1.2 MB' }], { readonly: true }));
  body.push(labeled('ประวัติการตรวจ (ล่าสุดและย้อนหลัง 1 ครั้ง)', has
    ? await tblShort([['วันที่ตรวจ', 120], ['ผล', 120], ['ที่มา', 0], ['ครบกำหนดถัดไป', 150]], [[r[1], { pill: [r[2], RES_C[r[2]]] }, { text: srcOf(r), sub: srcOf(r) === 'ผลนอกแผน' ? undefined : 'ผู้ตรวจ ' + VENDORS[0][0] }, r[3]], ['12/05/2568', { pill: ['ผ่าน', 'Success'] }, 'ผลนอกแผน', '12/11/2568']])
    : alertBox('Gray', 'ยังไม่มีประวัติการตรวจในระบบ', 'ครบกำหนดตั้งต้น ' + v[6])));
  await popupModal(scr, { title: 'ประวัติการตรวจ ปจ.2 · ' + v[0], sub: machineLabel(m) + ' · รหัสทรัพย์สิน ' + m.asset + ' - ' + m.sub, w: 800, body, ok: null, cancel: 'ปิด' });
}
async function registry(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'ทะเบียน ปจ.2', crumbs: ['ทะเบียน ปจ.2'] });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, alertBox('Gray', 'ผลตรวจล่าสุดและวันครบกำหนดของเครื่องมือกลทุกเครื่อง ยานพาหนะประเภท 09', 'อัปเดตทันทีที่อนุมัติผลรายเครื่อง · อัปโหลดผลนอกแผนได้ทุกเครื่อง'), 'h');
  add(sec, await tableHeader({ placeholder: 'ค้นหาทะเบียน, รหัส, สังกัด, ผู้ครอบครอง, เจ้าของแผน, เครื่องมือกล', chips: o.chips, filterCount: o.chips ? o.chips.length : 0 }), 'h');
  const rows = o.rows || REG;
  if (!rows.length) add(sec, await searchNotFound(), 'h'); else add(sec, await tblShort(REG_COLS, rows.map(regRow), { pagination: { shown: rows.length, total: 62 } }), 'h');
  if (o.filter) await filterPanel(scr, [multiDropdown('สังกัด', [], { placeholder: 'ทั้งหมด', optional: true }), multiDropdown('ประเภทเครื่องมือกล', [], { placeholder: 'ทั้งหมด', optional: true }), multiDropdown('ผลล่าสุด', o.filter, { placeholder: 'ทั้งหมด', optional: true }),
    multiDropdown('ครบกำหนดครั้งถัดไป', [], { placeholder: 'ทั้งหมด', optional: true }), multiDropdown('แผน', [], { placeholder: 'ทั้งหมด', optional: true })]);
  if (o.history) await historyModal(scr, o.history, o.unit);
  if (o.upload) {   /* อัปโหลดผลนอกแผนรายเครื่อง: แท็บต่อเครื่อง · ที่มา (บังคับ) + เลขที่อ้างอิง · บอกครบกำหนดครั้งถัดไปก่อนบันทึก */
    const f = o.upload, id = f.car, v = V[id], ms = machinesOfCar(id), ui = f.unit || 0, m = ms[ui];
    const body = [];
    if (ms.length > 1) body.push(await tabs(ms.map(x => [machineTag(ms, x), null]), ui));
    body.push(row('Row', [dropdown('ที่มา', f.filled ? 'งานซ่อม' : '', { placeholder: 'เลือกที่มาของผลตรวจ' }), field('เลขที่อ้างอิง', f.filled ? 'MRP-2569-0412' : '', { placeholder: 'เช่น เลขที่ใบแจ้งซ่อม หรือแผนบำรุงรักษา', optional: true })]),
      field('วันที่ตรวจ', f.filled ? '20/11/2569' : '', { placeholder: 'ระบุวันที่', lead: 'calendar_month-24-300-round' }),
      labeled('ผลการตรวจ', radioCards(RESULTS, f.filled ? 0 : -1)),
      row('Row', [field('ผู้ตรวจ', f.filled ? 'บจก. เซฟตี้ เอ็นจิเนียริ่ง' : '', { placeholder: 'ชื่อผู้ตรวจหรือบริษัท', optional: true }), field('ค่าจ้าง (บาท)', f.filled ? '9,000.00' : '', { placeholder: '0.00', optional: true })]),
      await upload('เอกสารการตรวจ ปจ.2', f.filled ? [{ name: 'ปจ2-' + v[0].split(' ')[0] + '.pdf', size: '1.1 MB' }] : [], { hint: 'PDF, PNG, JPG · ไฟล์ละไม่เกิน 10 MB · สูงสุด 10 ไฟล์' }));
    if (f.filled) body.push(alertBox('Success', 'ครบกำหนดครั้งถัดไป: 20/05/2570', 'วันที่ตรวจ + วาระ ' + v[7] + ' เดือน'));
    await popupModal(scr, { title: 'อัปโหลดผลตรวจนอกแผน · ' + v[0], sub: machineLabel(m) + ' · วาระ ' + v[7] + ' เดือน', w: 640, ok: 'บันทึก', okOff: !f.filled, body });
  }
  if (o.toast) notify(scr, o.toast);
  return scr;
}
/* หน้าข้อมูลยานพาหนะ (ปลายทางลิงก์เลขทะเบียน · /vehicle/?id=) ตามเว็บ src/app/vehicle/page.tsx + _lib/MachineSection.tsx (26 พ.ย. 2569)
   ซ้าย: ข้อมูลทั่วไป · ขวา: รูปยานพาหนะ · เครื่องมือกล · การตรวจ ปจ.2 ครั้งล่าสุด
   เครื่องมือกล: หัว section มี "เพิ่ม" (Tertiary brand) เมื่อมีเครื่องแล้ว · การ์ดละเครื่อง มี "ลบ" (Tertiary danger · หน้าต่างยืนยัน) + "แก้ไข" (Tertiary brand) · พิกัดยกเป็นตัน
   ยังไม่มีเครื่อง = กล่องแบบบัตรเติมน้ำมันว่าง (ภาพ + กล่องเทา + Secondary button "เพิ่ม") · การตรวจ ปจ.2 แสดงเฉพาะครั้งล่าสุด 1 กล่อง (Notion ข้อ 118) */
const machineOf = (id) => {   // defaultMachines() ของเว็บ (src/lib/mock/machines.ts): ยี่ห้อ/รุ่นจากยานพาหนะ · พิกัดยก = liftTon ?? 0.2 ตัน · HC = 4 หลักท้ายทะเบียน · ชั่วโมงคิดจากเลขทะเบียน
  const v = V[id], n = Number(v[0].split(' ')[0].replace(/\D/g, '')), [brand, ...rest] = v[9].split(' ');
  const type = /สว่าน/.test(v[2]) ? 'สว่านขุดเจาะ' : /เครน/.test(v[2]) ? 'เครน' : /กระเช้า/.test(v[2]) ? 'กระเช้า' : 'อื่นๆ';
  return { type, brand, model: rest.join(' '), lift: (LIFT_TON[id] != null ? LIFT_TON[id] : 0.2), asset: '5000' + String(n % 1e8).padStart(8, '0'), sub: '0001',
    hc: type === 'กระเช้า' || type === 'เครน' ? 'HC - ' + String(n).slice(-4) : '', eh: 2000 + (n * 397) % 6000, mh: 800 + (n * 211) % 3000 };
};
const LIFT_TON = { v04: 30, v09: 25, v16: 6.1, v19: 30, v21: 4.15, v42: null, v58: 12.72 };
/* เครื่องมือกลของคัน (machinesOf ของเว็บ) · ตัวอย่างคันที่มี 2 เครื่อง: 74-7745 มีกระเช้าที่เพิ่มในหน้าข้อมูลยานพาหนะ (รหัสทรัพย์สินเดียวกัน รหัสย่อย 0002) */
const EXTRA_M = { v19: [{ type: 'กระเช้า', brand: 'ALTEC', model: 'AT37G', lift: 0.2, sub: '0002', hc: 'HC - 7746', eh: 1250, mh: 640 }] };
const machinesOfCar = (id) => { const b = machineOf(id); return [b].concat((EXTRA_M[id] || []).map(x => Object.assign({}, b, x))); };
const machineLabel = (x) => [x.type, x.brand, x.model].filter(Boolean).join(' ') || 'เครื่องมือกล';
/* ชื่อสั้นของเครื่องในคัน (ป้ายในตาราง · แท็บใน popup) = ประเภท · ประเภทซ้ำในคัน = ประเภท + ลำดับ */
const machineTag = (list, x) => { const same = list.filter(y => y.type === x.type); return same.length > 1 ? x.type + ' ' + (same.indexOf(x) + 1) : x.type; };
const nf = (x) => x == null || x === '' ? '-' : Number(x).toLocaleString('en-US', { maximumFractionDigits: 2 });
/* การตรวจ ปจ.2 ครั้งล่าสุด (ทะเบียน ปจ.2 · REG): [วันที่ตรวจ, ผล, กำหนดตรวจครั้งต่อไป, ไฟล์] */
const latestOf = (id) => { const r = REG.find(x => x[0] === id); if (!r || !r[1]) return null; return [r[1], r[2], r[3], r[2] === 'ตรวจไม่ได้' ? 'หนังสือรับรอง-' + V[id][0].split(' ')[0] + '.pdf' : 'ปจ2-' + V[id][0].split(' ')[0] + '.pdf', srcOf(r)]; };
/* การ์ดการตรวจ ปจ.2 ครั้งล่าสุดของเครื่อง (SafetySection ของเว็บ): หัว = ชื่อเครื่อง + รหัสทรัพย์สิน + "ดูประวัติ" · มีผล = 6 แถว (+ เหตุผลเมื่อตรวจไม่ได้) + เอกสาร · ไม่มีผล = กล่องเทา */
async function safetyCard(id, m, i) {
  const v = V[id], c = await viCard('Safety card'), last = i === 0 ? latestOf(id) : null;
  const sl = await sectionLabel(machineLabel(m), { buttons: [{ kind: 'Primary button', text: 'ดูประวัติ' }] });
  setProps(sl, { Supporting: true, 'Supporting text': 'รหัสทรัพย์สิน ' + m.asset + ' - ' + m.sub }); add(c, sl, 'h');
  if (last) {
    [['วันที่ตรวจ', last[0]], ['ผลการตรวจ', { pill: [last[1], RES_C[last[1]]] }], ['กำหนดตรวจครั้งต่อไป', last[2]], ['รอบตรวจประจำ', v[7] + ' เดือน'], ['ที่มา', last[4]]]
      .concat(last[1] === 'ตรวจไม่ได้' ? [['เหตุผลที่ตรวจไม่ได้', 'ยานพาหนะอยู่ระหว่างซ่อมระบบไฮดรอลิก ไม่สามารถยกกระเช้าทดสอบได้']] : []).concat([['เอกสาร', ' ']])
      .forEach(([l, val]) => add(c, viCardRow(l, val), 'h'));
    add(c, inst('_File upload item base', { State: 'Completed' }, { 'File name': last[3], 'File size': '1.1 MB', 'Progress bar': false, Actions: true, 'Download action': true, 'Delete action': false }), 'h');
  } else {
    const box = await viSubtle(frame('Content', 'VERTICAL', { gap: 8, pad: [12, 16] }));
    const el = await sectionLabel('ไม่มีประวัติการตรวจ ปจ.2'); setProps(el, { Supporting: true, 'Supporting text': 'เครื่องนี้ยังไม่มีผลการตรวจ ปจ.2 · ครบกำหนด ' + v[6] }); add(box, el, 'h');
    add(c, box, 'h');
  }
  return c;
}
async function labelWithSecondary(title, sub, label) {   // Section label ที่ช่อง Secondary action สลับเป็น Secondary button (viLabelWithButton ของปลั๊กอินบำรุงรักษา)
  const sl = await sectionLabel(title, { buttons: [{ kind: 'Secondary', text: label, icon: 'add-24-300-round' }] });
  setProps(sl, { Supporting: true, 'Supporting text': sub });
  const tb = sl.findAll(n => n.type === 'INSTANCE' && n.name === 'Tertiary button')[0];
  if (tb) try { tb.swapComponent(main('Secondary button', { State: 'Default', Size: 'md' })); tb.name = 'Secondary button'; setProps(tb, { Text: label, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') }); } catch (e) { warn('ปุ่มเพิ่มเครื่องมือกล', e); }
  return sl;
}
async function machineCard(x) {   // MachineCard ของเว็บ: Section label ชื่อ + รหัสทรัพย์สิน · ลบ (Tertiary danger) + แก้ไข (Tertiary brand) · Card item row 11 แถว
  const card = await viCard('Machine card');
  const sl = await sectionLabel([x.type, x.brand, x.model].filter(Boolean).join(' '), { buttons: [{ kind: 'Primary button', text: 'แก้ไข' }, { kind: 'Secondary', text: 'ลบ' }] });
  setProps(sl, { Supporting: true, 'Supporting text': 'รหัสทรัพย์สิน ' + x.asset + ' - ' + x.sub });
  const tb = sl.findAll(n => n.type === 'INSTANCE' && n.name === 'Tertiary button')[0];
  if (tb) try { tb.swapComponent(main('Tertiary danger button', { State: 'Default' })); tb.name = 'Tertiary danger button'; setProps(tb, { Text: 'ลบ', 'Leading icon': false, 'Trailing icon': false }); } catch (e) { warn('ปุ่มลบเครื่องมือกล', e); }
  add(card, sl, 'h');
  [['ประเภทเครื่องมือกล', x.type], ['ยี่ห้อ', x.brand], ['รุ่น', x.model], ['พิกัดยก (ตัน)', nf(x.lift)], ['รหัสทรัพย์สิน', x.asset], ['รหัสทรัพย์สินย่อย', x.sub],
    ['ชั่วโมงเครื่องยนต์', nf(x.eh)], ['ชั่วโมงเครื่องจักร', nf(x.mh)], ['หมายเลข HC', x.hc || '-'], ['หมายเลขประจำเครื่องจักร (Serial No.)', '-'], ['หมายเลขเครื่องยนต์ (ส่วนเครื่องจักร)', '-']]
    .forEach(([l, val]) => add(card, viCardRow(l, val), 'h'));
  return card;
}
async function vehiclePage(name, o) {
  o = o || {};
  const id = o.id || 'v17', v = V[id], ms = o.noMachine ? [] : machinesOfCar(id), x = ms[0] || null;
  const { scr, page } = await shell(name, { title: v[0], back: true, root: 'ข้อมูลพนักงานและยานพาหนะ', crumbs: ['ข้อมูลยานพาหนะ', v[0]], badge: ['พร้อมใช้งาน', 'Success'] });
  const left = [viSection([await sectionLabel('ข้อมูลทั่วไป'), kv([['ทะเบียน', v[0]], ['รหัสข้างยานพาหนะ', v[1]], ['ประเภทยานพาหนะ', v[2]], ['ยี่ห้อ / รุ่น (เครื่องมือกล)', v[9]], ['สังกัด', v[3]], ['ผู้ครอบครอง', v[4]], ['เบอร์ติดต่อ', v[5]], ['ผู้ดูแลยานพาหนะ', ADMIN[v[3]][0]]], 2)])];
  const img = inst('Images', { Size: 'md', Type: 'Empty' });
  const right = [viSection([await sectionLabel('รูปยานพาหนะ'), img])];
  if (x) { const cards = []; for (const m of ms) cards.push(await machineCard(m)); right.push(viSection([await sectionLabel('เครื่องมือกล', { buttons: [{ kind: 'Primary button', text: 'เพิ่ม', icon: 'add-24-300-round' }] })].concat(cards))); }
  else {   /* ยังไม่มีเครื่อง = กล่องเทา + ปุ่มเพิ่ม · ไม่มีรูป (เว็บ 26 พ.ย. 2569 "ไม่ต้องมี") */
    const card = await viCard('Machine card · ว่าง', 'HORIZONTAL');
    const box = await viSubtle(frame('Content', 'VERTICAL', { gap: 8, pad: [12, 16] }));
    add(box, await labelWithSecondary('ไม่มีเครื่องมือกล', 'ยานพาหนะคันนี้ยังไม่มีข้อมูลเครื่องมือกล', 'เพิ่ม'), 'h');
    card.appendChild(box); box.layoutGrow = 1;
    right.push(viSection([await sectionLabel('เครื่องมือกล'), card]));
  }
  /* การตรวจ ปจ.2 ครั้งล่าสุด: การ์ดละเครื่อง · ไม่มีเครื่องมือกล = ไม่แสดง section นี้ */
  if (ms.length) { const cards = []; for (const [i, m] of ms.entries()) cards.push(await safetyCard(id, m, i)); right.push(viSection([await sectionLabel('การตรวจ ปจ.2 ครั้งล่าสุด')].concat(cards))); }
  const out = col('Vehicle info', [], 24);
  if (MOB) left.concat(right).forEach(k => add(out, k, 'h'));
  else { const two = frame('Row', 'HORIZONTAL', { gap: 24 }); const l = col('Column', left, 24), r = col('Column', right, 24); two.appendChild(l); l.layoutGrow = 1; two.appendChild(r); r.counterAxisSizingMode = 'FIXED'; r.resize(526, r.height); add(out, two, 'h'); }
  try { img.layoutSizingHorizontal = 'FILL'; img.resize(img.width, MOB ? 278 : 395); } catch (e) { /* ขนาดตาม component */ }
  add(page, out, 'h');
  if (o.machineModal) {   // MachineModal ของเว็บ: เพิ่ม = ช่องว่าง (รหัสทรัพย์สินตั้งต้น = ของเครื่องแรก · รหัสย่อยถัดไป) · แก้ไข = ค่าเดิม · พิกัดยกเป็นตัน
    const edit = o.machineModal === 'edit', base = machineOf(id), err = o.machineModal === 'error';
    const d = edit ? { type: base.type, brand: base.brand, model: base.model, lift: String(base.lift), asset: base.asset, sub: base.sub, eh: String(base.eh), mh: String(base.mh), hc: base.hc }
      : { type: '', brand: '', model: '', lift: '', asset: x ? base.asset : '', sub: x ? '0002' : '0001', eh: '', mh: '', hc: '' };
    const f = (k, label, ph, opt, msg) => field(label, d[k], { placeholder: ph, optional: !!opt, error: err && !d[k] && msg ? msg : '' });
    const grid = col('Content', [row('Row', [dropdown('ประเภทเครื่องมือกล', d.type, { placeholder: 'เลือกประเภทเครื่องมือกล', error: err && !d.type ? 'กรุณาเลือกประเภทเครื่องมือกล' : '' }), f('lift', 'พิกัดยก (ตัน)', 'เช่น 3.25', false, 'กรุณาระบุพิกัดยกเป็นตัวเลขมากกว่า 0')]),
      row('Row', [f('brand', 'ยี่ห้อ', 'ระบุยี่ห้อ', false, 'กรุณาระบุยี่ห้อ'), f('model', 'รุ่น', 'ระบุรุ่น', false, 'กรุณาระบุรุ่น')]), row('Row', [f('asset', 'รหัสทรัพย์สิน', '12 หลัก', false, 'กรุณาระบุรหัสทรัพย์สิน 12 หลัก'), f('sub', 'รหัสทรัพย์สินย่อย', '4 หลัก เช่น 0001')]),
      row('Row', [f('eh', 'ชั่วโมงเครื่องยนต์', 'ชั่วโมง', false, 'กรุณาระบุชั่วโมงเครื่องยนต์เป็นจำนวนเต็มตั้งแต่ 0'), f('mh', 'ชั่วโมงเครื่องจักร', 'ชั่วโมง', false, 'กรุณาระบุชั่วโมงเครื่องจักรเป็นจำนวนเต็มตั้งแต่ 0')]),
      row('Row', [f('hc', 'หมายเลข HC', 'เช่น HC - 9001', true), field('หมายเลขประจำเครื่องจักร (Serial No.)', '', { placeholder: 'ระบุหมายเลขประจำเครื่องจักร', optional: true })]),
      row('Row', [field('หมายเลขเครื่องยนต์ (ส่วนเครื่องจักร)', '', { placeholder: 'ระบุหมายเลขเครื่องยนต์ของเครื่องจักร', optional: true }), frame('Spacer', 'VERTICAL')])], 16);
    await popupModal(scr, { title: edit ? 'แก้ไขเครื่องมือกล' : 'เพิ่มเครื่องมือกล', sub: v[0], w: 800, ok: 'บันทึก', body: [grid] });
  }
  if (o.del && x) await confirm(scr, { danger: true, title: 'ลบเครื่องมือกล', sub: [x.type, x.brand, x.model].join(' ') + ' · รหัสทรัพย์สิน ' + x.asset + ' - ' + x.sub + ' จะถูกลบ', ok: 'ลบ' });
  if (o.history != null) await historyModal(scr, id, o.history);
  if (o.move) { const h = machinesOfCar(o.move)[0];   /* รหัสทรัพย์สินซ้ำกับเครื่องของคันอื่น = เตือนแล้วย้ายมาพร้อมประวัติ (MachineSection ของเว็บ) */
    await confirm(scr, { title: 'รหัสทรัพย์สินนี้อยู่กับยานพาหนะคันอื่น', sub: 'รหัสทรัพย์สิน ' + h.asset + ' - ' + h.sub + ' เป็น' + machineLabel(h) + ' ของ ' + V[o.move][0] + ' · ยืนยันแล้วเครื่องนี้จะย้ายมา ' + v[0] + ' พร้อมประวัติการตรวจ ปจ.2', ok: 'ย้ายมาคันนี้' }); }
  if (o.toast) notify(scr, o.toast);
  return scr;
}
const NOTI = [['Brand', 'นัดตรวจ ปจ.2 · 70-8801 เชียงใหม่ · บจก. เซฟตี้ เอ็นจิเนียริ่ง จะเข้าตรวจระหว่างวันที่ 10/11/2569 ถึง 20/12/2569 ที่สำนักงาน กฟน.1 เชียงใหม่', '10 นาทีที่แล้ว'],
  ['Brand', 'ผลตรวจ ปจ.2 · 74-7745 กรุงเทพมหานคร ไม่ผ่าน · กรุณาดำเนินการตามขั้นตอนก่อนนำยานพาหนะไปใช้งาน', '1 ชั่วโมงที่แล้ว'],
  ['read', 'นัดตรวจ ปจ.2 · 76-2234 เพชรบุรี · บจก. เซฟตี้ เอ็นจิเนียริ่ง จะเข้าตรวจระหว่างวันที่ 05/11/2569 ถึง 20/11/2569', '05/11/2569']];
async function caretaker(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'หน้าหลัก', crumbs: ['หน้าหลัก'], root: 'หน้าหลัก' });
  add(page, await dataEmpty('ยังไม่มีหน้าของผู้ดูแลยานพาหนะ', 'ดูการแจ้งเตือนนัดตรวจ ปจ.2 ที่กระดิ่งมุมขวาบน'), 'h');
  if (o.bell) await notiPanel(scr, o.items || NOTI, (o.items || NOTI).filter(x => x[0] === 'Brand').length + ' แจ้งเตือนใหม่');
  return scr;
}

/* ============================================================================
   scenario — [ชื่อ, [[ป้าย state, () => จอ]]] · 1 scenario = 1 บล็อกตัวอักษร (R19)
   ============================================================================ */
const T1_V20 = { v20: ['draft', 'ผ่าน', '13/11/2569', '', 'ปจ2-82-9956-ใหม่.pdf'] };
const SCENARIOS = [
  ['S1 · กบค. ดูรายการแผนตรวจ ปจ.2 (บำรุงรักษาตามวาระ แท็บ Safety Inspection)', [
    ['รายการแผน', () => planList('S1 รายการแผน')],
    ['เมนู … ของแผนรออนุมัติ', () => planList('S1 เมนูแผน', { menu: 3, rows: [PLANS[1]].concat(PLANS.filter(p => p !== PLANS[1])) })],
    ['แผงตัวกรอง', () => planList('S1 ตัวกรอง', { filter: { st: ['อนุมัติแล้ว'], dept: ['กบค.'], fy: [], range: '' } })],
    ['กรองแล้ว · ชิปตัวกรอง', () => planList('S1 กรองแล้ว', { chips: ['อนุมัติแล้ว', 'กบค.'], rows: PLANS.filter(p => p.st === 'approved' && p.dept === 'กบค.') })],
    ['ค้นหาไม่พบ', () => planList('S1 ค้นหาไม่พบ', { query: 'ภาคใต้ 2571', rows: [] })],
    ['แท็บเสร็จสิ้นและยกเลิก', () => planList('S1 เสร็จสิ้นและยกเลิก', { tab: 1 })],
    ['ยังไม่มีแผน', () => planList('S1 ยังไม่มีแผน', { empty: true })]]],
  ['S2 · กบค. สร้างแผนตรวจ ปจ.2 และส่งอนุมัติ', [
    ['ฟอร์มว่าง', () => planForm('S2 ฟอร์มว่าง')],
    ['เลือกผู้รับจ้าง', () => planForm('S2 เลือกผู้รับจ้าง', { values: { name: FILLED.name }, vendorOpen: true })],
    ['ปฏิทินวันเริ่มต้นสัญญา', () => planForm('S2 วันเริ่มต้นสัญญา', { values: { name: FILLED.name, ven: 0, contract: FILLED.contract }, dateOpen: true })],
    ['หน้าต่างเพิ่มยานพาหนะ', () => planForm('S2 เพิ่มยานพาหนะ', { values: Object.assign({}, FILLED, { cars: [] }), picker: { ticked: ['v01', 'v03', 'v04', 'v05'] } })],
    ['ตัวกรองในหน้าต่างเพิ่มยานพาหนะ', () => planForm('S2 ตัวกรองยานพาหนะ', { values: Object.assign({}, FILLED, { cars: [] }), picker: { ticked: [], filter: ['ครบกำหนดในระยะสัญญา', 'เกินกำหนด'] } })],
    ['ยานพาหนะที่หาวาระไม่เจอ', () => planForm('S2 ยังไม่ระบุวาระ', { values: Object.assign({}, FILLED, { cars: FILLED.cars.concat(['v22']) }), unknown: 'v22' })],
    ['ระบุวาระเอง', () => planForm('S2 ระบุวาระ', { values: Object.assign({}, FILLED, { cars: FILLED.cars.concat(['v22']) }), unknown: 'v22', cyclePick: true })],
    ['เอายานพาหนะออก', () => planForm('S2 เอาออก', { values: FILLED, drop: 'v05' })],
    ['กรอกครบ', () => planForm('S2 กรอกครบ', { values: FILLED })],
    ['ข้อมูลไม่ครบ', () => planForm('S2 ไม่ครบ', { values: { cars: [] }, errors: true })],
    ['ยืนยันการออก', () => planForm('S2 ยืนยันการออก', { values: FILLED, leave: true })],
    ['ส่งอนุมัติสำเร็จ', async () => { const s = await planList('S2 ส่งสำเร็จ', { rows: [Object.assign({}, PLANS[3], { mr: 'MRZ7000014', name: FILLED.name, cars: FILLED.cars, st: 'review', docs: ['อนุมัติ 0/4'], c1: '01/12/2569', c2: '01/03/2570' })].concat(PLANS) }); notify(s, 'สร้างแผนตรวจ ปจ.2 MRZ7000014 และส่งให้หัวหน้า กบค. อนุมัติแล้ว'); return s; }]]],
  ['S3 · กบค. แก้ไขหรือลบแผนที่ยังไม่อนุมัติ', [
    ['รายละเอียดแผนรออนุมัติ', () => planDetail('S3 รออนุมัติ', { plan: PLANS[1] })],
    ['แผนถูกส่งกลับแก้ไข', () => planDetail('S3 ส่งกลับแก้ไข', { plan: Object.assign({}, PLANS[1], { st: 'returned' }) })],
    ['ฟอร์มแก้ไข (ส่งกลับแก้ไข)', () => planForm('S3 ฟอร์มแก้ไข', { edit: true, returned: true, values: { name: PLANS[1].name, ven: 2, contract: '', c1: '15/01/2570', days: '45', c2: '01/03/2570', budget: '10,000.00', cars: ['v24'] } })],
    ['ยืนยันการลบแผน', () => planDetail('S3 ลบแผน', { plan: PLANS[1], del: true })]]],
  ['S4 · หัวหน้า กบค. อนุมัติแผน', [
    ['แท็บแผนใหญ่ รออนุมัติ', () => approvals('S4 รายการ')],
    ['ติ๊กหลายแผน', () => approvals('S4 ติ๊กหลายแผน', { ticked: [0, 1] })],
    ['ยืนยันอนุมัติหลายแผน', () => approvals('S4 ยืนยันหลายแผน', { ticked: [0, 1], confirm: true })],
    ['รายละเอียดเพื่ออนุมัติ', () => planApproval('S4 รายละเอียด')],
    ['เลือกอนุมัติ', () => planApproval('S4 เลือกอนุมัติ', { sel: 0 })],
    ['เลือกส่งกลับแก้ไข ไม่ระบุเหตุผล', () => planApproval('S4 ส่งกลับไม่มีเหตุผล', { sel: 1, err: true })],
    ['ส่งกลับแก้ไขพร้อมเหตุผล', () => planApproval('S4 ส่งกลับ', { sel: 1, reason: 'แก้ชื่อแผนให้ระบุภาคที่ตรวจ' })],
    ['อนุมัติสำเร็จ', () => approvals('S4 อนุมัติสำเร็จ', { rows: [[PLANS[5].mr, PLANS[5].name, contractTxt(PLANS[5]), '1 คัน', PLANS[5].sent]], waitN: 1, toast: 'อนุมัติแผน MRZ7000012 แล้ว · ผู้รับจ้างเห็นแผนแล้ว' })]]],
  ['S5 · กบค. ดูรายละเอียดแผนที่อนุมัติแล้ว', [
    ['ยังไม่มีแผนเดินทาง', () => planDetail('S5 ยังไม่มีแผนเดินทาง', { plan: PLANS[2], trips: [] })],
    ['ยกเลิกแผน', () => planDetail('S5 ยกเลิกแผน', { plan: PLANS[2], trips: [], cancel: 2 })],
    ['มีแผนเดินทาง', () => planDetail('S5 มีแผนเดินทาง')],
    ['แผนของ กรย. (ดูอย่างเดียว)', () => planDetail('S5 แผน กรย.', { plan: PLANS[0], trips: [], noCheck: true })],
    ['แผนที่ยกเลิก', () => planDetail('S5 ยกเลิกแล้ว', { plan: DONE_PLANS[1], trips: [] })]]],
  ['S6 · กบค. สร้างแผนเดินทางเอง และส่งอนุมัติ', [
    ['ฟอร์มว่าง', () => tripForm('S6 ฟอร์มว่าง', { plan: PLANS[2], values: {} })],
    ['ปฏิทินช่วงวันที่ดำเนินการ', () => tripForm('S6 ช่วงวันที่ดำเนินการ', { plan: PLANS[2], values: { name: 'ตรวจ ปจ.2 ชลบุรีและอุดรธานี' }, dateOpen: true })],
    ['หน้าต่างเพิ่มยานพาหนะ', () => tripForm('S6 เพิ่มยานพาหนะ', { values: { name: TRIP_FILLED.name, d1: TRIP_FILLED.d1, d2: TRIP_FILLED.d2 }, picker: { ticked: ['v17', 'v18', 'v19'] } })],
    ['ค่าจ้างรายคันไม่บังคับ', () => tripForm('S6 ยังไม่กรอกค่าจ้าง', { values: Object.assign({}, TRIP_FILLED, { costs: {} }) })],
    ['กำหนดค่าจ้างหลายคัน', () => tripForm('S6 กำหนดค่าจ้าง', { values: Object.assign({}, TRIP_FILLED, { costs: {} }), ticked: ['v17', 'v18', 'v19'], costFor: 3 })],
    ['แก้ไขยานพาหนะรายคัน', () => tripForm('S6 แก้ไขรายคัน', { values: TRIP_FILLED, carEdit: 'v17' })],
    ['งบประมาณเกิน', () => tripForm('S6 งบเกิน', { values: TRIP_FILLED, over: true })],
    ['กรอกครบ', () => tripForm('S6 กรอกครบ', { values: TRIP_FILLED })],
    ['ส่งอนุมัติสำเร็จ', async () => { const s = await planDetail('S6 ส่งสำเร็จ', { plan: PLANS[2], trips: [T3] }); notify(s, 'สร้างแผนเดินทางและส่งให้หัวหน้า กบค. อนุมัติแล้ว'); return s; }]]],
  ['S7 · ผู้รับจ้างเห็นแผนและเสนอแผนเดินทาง', [
    ['เอกสาร ปจ.2 (รายการแผน)', () => vendorPlans('S7 รายการแผน')],
    ['ยังไม่มีแผน', () => vendorPlans('S7 ยังไม่มีแผน', { rows: [] })],
    ['หน้าแผน · ยังไม่มีแผนเดินทาง', () => vendorPlan('S7 แผนยังไม่มีแผนเดินทาง', { plan: PLANS[2], trips: [] })],
    ['ฟอร์มเสนอแผนเดินทาง', () => tripForm('S7 ฟอร์มเสนอ', { byVendor: true, values: TRIP_VENDOR })],
    ['เสนอแล้ว · รออนุมัติ', async () => { const s = await vendorPlan('S7 เสนอแล้ว', { can: false }); notify(s, 'ส่งแผนเดินทางให้ กบค. แล้ว · กบค. ตรวจแล้วส่งอนุมัติต่อ'); return s; }],
    ['แผนเดินทางที่เสนอ (รออนุมัติ)', () => vendorTrip('S7 แผนเดินทางที่เสนอ', { trip: T2 })]]],
  ['S8 · กบค. รับแผนเดินทางที่ผู้รับจ้างเสนอ (เปิดแล้วเข้าหน้าแก้ไขเลย)', [
    ['รายละเอียดแผน · มีแผนเดินทางที่เสนอ', () => planDetail('S8 แผนมีข้อเสนอ')],
    ['เปิดแผนเดินทางที่เสนอ = หน้าแก้ไข', () => tripForm('S8 เปิดข้อเสนอ', { trip: T2, values: TRIP_VENDOR })],
    ['กรอกค่าจ้าง', () => tripForm('S8 กรอกค่าจ้าง', { trip: T2, values: Object.assign({}, TRIP_VENDOR, { costs: { v23: 9000 } }) })],
    ['ยืนยันลบแผนเดินทาง', () => tripForm('S8 ลบข้อเสนอ', { trip: T2, values: TRIP_VENDOR, del: true })],
    ['ส่งอนุมัติสำเร็จ', async () => { const s = await tripDetail('S8 ส่งสำเร็จ', { trip: Object.assign({}, T2, { st: 'review' }) }); notify(s, 'ส่งแผนเดินทาง ' + T2.name + ' ให้หัวหน้า กบค. อนุมัติแล้ว'); return s; }]]],
  ['S9 · หัวหน้า กบค. อนุมัติแผนเดินทาง', [
    ['แท็บแผนเดินทาง', () => approvals('S9 รายการ', { tab: 1 })],
    ['รายละเอียดเพื่ออนุมัติ', () => tripApproval('S9 รายละเอียด')],
    ['เลือกอนุมัติ', () => tripApproval('S9 เลือกอนุมัติ', { sel: 0 })],
    ['ส่งกลับแก้ไขพร้อมเหตุผล', () => tripApproval('S9 ส่งกลับ', { sel: 1, reason: 'ตรวจวันที่อีกครั้ง' })],
    ['ฟอร์มแก้ไขที่ถูกส่งกลับ (กบค.)', () => tripForm('S9 แก้ไขที่ถูกส่งกลับ', { plan: PLANS[2], trip: Object.assign({}, T3, { st: 'returned' }), values: { name: T3.name, d1: T3.d1, d2: T3.d2, cars: T3.cars, costs: T3.costs } })],
    ['อนุมัติสำเร็จ', () => approvals('S9 อนุมัติสำเร็จ', { tab: 1, rows: [], waitN: 0, toast: 'อนุมัติแผนเดินทาง ' + T3.name + ' แล้ว · แจ้งผู้รับจ้าง กรย. และผู้ดูแลยานพาหนะแล้ว' })]]],
  ['S10 · ผู้รับจ้างบันทึกผลตรวจรายคันและส่งอนุมัติ', [
    ['แผนเดินทางของผู้รับจ้าง', () => vendorTrip('S10 แผนเดินทาง')],
    ['บันทึกผล · ฟอร์มว่าง', () => vendorTrip('S10 ฟอร์มว่าง', { trip: Object.assign({}, T1, { res: Object.assign({}, T1.res, { v20: undefined }) }), result: { car: 'v20', res: '' } })],
    ['ปฏิทินวันที่ตรวจ', () => vendorTrip('S10 วันที่ตรวจ', { trip: Object.assign({}, T1, { res: Object.assign({}, T1.res, { v20: undefined }) }), result: { car: 'v20', res: '', dateOpen: true } })],
    ['ผลผ่าน · แนบเอกสาร', () => vendorTrip('S10 ผลผ่าน', { trip: Object.assign({}, T1, { res: Object.assign({}, T1.res, { v20: undefined }) }), result: { car: 'v20', res: 'ผ่าน', date: '13/11/2569', files: [{ name: 'ปจ2-82-9956.pdf', size: '1.2 MB', bar: true }] } })],
    ['ผลตรวจไม่ได้ · เอกสารไม่บังคับ', () => vendorTrip('S10 ตรวจไม่ได้', { trip: Object.assign({}, T1, { res: Object.assign({}, T1.res, { v20: undefined }) }), result: { car: 'v20', res: 'ตรวจไม่ได้', date: '13/11/2569', reason: 'ยานพาหนะติดภารกิจซ่อมสายส่งฉุกเฉิน', files: [] } })],
    ['ข้อมูลไม่ครบ', () => vendorTrip('S10 ไม่ครบ', { trip: Object.assign({}, T1, { res: Object.assign({}, T1.res, { v20: undefined }) }), result: { car: 'v20', res: 'ผ่าน', errors: true, files: [] } })],
    ['เอกสารถูกส่งกลับแก้ไข', () => vendorTrip('S10 ถูกส่งกลับ', { result: { car: 'v20', res: 'ผ่าน' } })],
    ['ติ๊กหลายคันส่งอนุมัติ', () => vendorTrip('S10 ติ๊กหลายคัน', { res: T1_V20, ready: ['v20'], ticked: ['v20'] })],
    ['ยืนยันส่งอนุมัติ', () => vendorTrip('S10 ยืนยันส่ง', { res: T1_V20, ready: ['v20'], ticked: ['v20'], ask: true })],
    ['ส่งอนุมัติสำเร็จ', async () => { const s = await vendorTrip('S10 ส่งสำเร็จ', { res: { v20: ['sent', 'ผ่าน', '13/11/2569', '', 'ปจ2-82-9956-ใหม่.pdf'] } }); notify(s, 'ส่งผลการตรวจ ปจ.2 1 คันเพื่ออนุมัติแล้ว'); return s; }],
    ['ดูผลที่รออนุมัติ · คันมี 2 เครื่อง (แท็บ)', () => vendorTrip('S10 ดูผลรออนุมัติ', { result: { car: 'v19', mode: 'view' } })],
    ['สลับแท็บเครื่องที่ 2', () => vendorTrip('S10 แท็บเครื่องที่ 2', { result: { car: 'v19', mode: 'view', unit: 1 } })]]],
  ['S11 · กบค. พิจารณาผลรายเครื่องมือกล ปิดแผนเดินทาง และส่งออก', [
    ['รายละเอียดแผนเดินทาง', () => tripDetail('S11 รายละเอียด')],
    ['พิจารณาผล · แท็บเครื่องแรก', () => tripDetail('S11 พิจารณา', { result: { car: 'v19', mode: 'review' } })],
    ['พิจารณาผล · แท็บเครื่องที่ 2', () => tripDetail('S11 พิจารณาเครื่องที่ 2', { result: { car: 'v19', mode: 'review', unit: 1, sel: 0 } })],
    ['เลือกส่งกลับแก้ไข ไม่ระบุเหตุผล', () => tripDetail('S11 ส่งกลับไม่มีเหตุผล', { result: { car: 'v19', mode: 'review', sel: 1, err: true } })],
    ['ติ๊กหลายคันอนุมัติ', () => tripDetail('S11 ติ๊กหลายคัน', { ticked: ['v19'], bulk: true })],
    ['บันทึกผลแทนผู้รับจ้าง', () => tripDetail('S11 บันทึกแทน', { trip: Object.assign({}, T1, { res: Object.assign({}, T1.res, { v20: undefined }) }), result: { car: 'v20', res: 'ผ่าน', behalf: true, date: '13/11/2569', files: [{ name: 'ปจ2-82-9956.pdf', size: '1.2 MB' }] } })],
    ['ปิดแผนเดินทางเอง', () => tripDetail('S11 ปิดแผนเดินทาง', { close: true })],
    ['ส่งออก PDF / Excel', () => tripDetail('S11 ส่งออก', { export: true })],
    ['แผนเดินทางเสร็จสิ้น', () => tripDetail('S11 เสร็จสิ้น', { trip: T1_DONE })]]],
  ['S12 · ทะเบียน ปจ.2', [
    ['รายการ', () => registry('S12 รายการ')],
    ['แผงตัวกรอง', () => registry('S12 ตัวกรอง', { filter: ['ไม่ผ่าน', 'ตรวจไม่ได้'] })],
    ['กรองแล้ว', () => registry('S12 กรองแล้ว', { chips: ['ไม่ผ่าน', 'ตรวจไม่ได้'], rows: REG.filter(r => r[2] === 'ไม่ผ่าน' || r[2] === 'ตรวจไม่ได้') })],
    ['ประวัติการตรวจ', () => registry('S12 ประวัติ', { history: 'v18' })],
    ['ประวัติ · คันมี 2 เครื่อง (แท็บ)', () => registry('S12 ประวัติ 2 เครื่อง', { history: 'v19', unit: 1 })],
    ['ยังไม่มีประวัติ', () => registry('S12 ไม่มีประวัติ', { history: 'v01' })],
    ['อัปโหลดผลนอกแผน', () => registry('S12 อัปโหลดว่าง', { upload: { car: 'v03' } })],
    ['อัปโหลดผลนอกแผน กรอกครบ', () => registry('S12 อัปโหลดครบ', { upload: { car: 'v03', filled: true } })],
    ['อัปโหลด · คันมี 2 เครื่อง (แท็บ)', () => registry('S12 อัปโหลด 2 เครื่อง', { upload: { car: 'v19', unit: 1 } })],
    ['บันทึกสำเร็จ', () => registry('S12 บันทึกสำเร็จ', { rows: [['v03', '20/11/2569', 'ผ่าน', '20/05/2570', '-']].concat(REG.filter(r => r[0] !== 'v03')), toast: 'บันทึกผลตรวจนอกแผนของ 72-6079 สระบุรี ' + machineLabel(machineOf('v03')) + ' แล้ว · ทะเบียนอัปเดตแล้ว' })]]],
  ['S13 · ข้อมูลยานพาหนะ (เครื่องมือกล · การตรวจ ปจ.2 ครั้งล่าสุดรายเครื่อง)', [
    ['มีเครื่องมือกล · ผลตรวจครั้งล่าสุด', () => vehiclePage('S13 มีเครื่องมือกล', { id: 'v17' })],
    ['ผลตรวจครั้งล่าสุด ตรวจไม่ได้', () => vehiclePage('S13 ตรวจไม่ได้', { id: 'v18' })],
    ['ไม่มีประวัติการตรวจ', () => vehiclePage('S13 ไม่มีประวัติ', { id: 'v01' })],
    ['มีเครื่องมือกล 2 เครื่อง', () => vehiclePage('S13 สองเครื่อง', { id: 'v19' })],
    ['ดูประวัติการตรวจของเครื่อง', () => vehiclePage('S13 ดูประวัติ', { id: 'v19', history: 0 })],
    ['เพิ่มเครื่องมือกลเครื่องที่ 2', () => vehiclePage('S13 เพิ่มเครื่องที่ 2', { id: 'v17', machineModal: 'new' })],
    ['แก้ไขเครื่องมือกล', () => vehiclePage('S13 แก้ไขเครื่องมือกล', { id: 'v17', machineModal: 'edit' })],
    ['รหัสทรัพย์สินซ้ำกับคันอื่น · ย้ายมาคันนี้', () => vehiclePage('S13 ย้ายเครื่อง', { id: 'v17', move: 'v19' })],
    ['บันทึกสำเร็จ', () => vehiclePage('S13 บันทึกสำเร็จ', { id: 'v17', toast: 'บันทึกเครื่องมือกลสำเร็จ' })],
    ['ยืนยันลบเครื่องมือกล', () => vehiclePage('S13 ลบเครื่องมือกล', { id: 'v17', del: true })],
    ['ลบแล้ว · ยังไม่มีเครื่องมือกล', () => vehiclePage('S13 ไม่มีเครื่องมือกล', { id: 'v17', noMachine: true, toast: 'ลบเครื่องมือกลแล้ว' })],
    ['เพิ่มเครื่องมือกล ข้อมูลไม่ครบ', () => vehiclePage('S13 เพิ่มไม่ครบ', { id: 'v17', noMachine: true, machineModal: 'error' })]]],
  ['S14 · ผู้ดูแลยานพาหนะรับแจ้งเตือนนัดตรวจและผลตรวจ', [
    ['หน้าหลัก', () => caretaker('S14 หน้าหลัก')],
    ['แจ้งเตือนที่กระดิ่ง', () => caretaker('S14 แจ้งเตือน', { bell: true })]]],
];

/* ---------- กลุ่ม = scenario (R19: 1 scenario = 1 บล็อก · A.1 A.2 = state) ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function groupsFor(idx) {
  return idx.map(i => {
    const [title, screens] = SCENARIOS[i];
    const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
    return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens: screens.map(([label, fn]) => [label, fn, '']) }] };
  });
}
const ALL_IDX = SCENARIOS.map((_, i) => i);

/* ---------- สร้าง — วางบนหน้า "Safety Inspection" ต่อใต้ของเดิม (ไม่มีก็สร้าง) · แบบ buildSet ของปลั๊กอินแบบประเมิน ---------- */
async function buildSet(GRP, what, devices) {
  errors.length = 0;
  const t0 = Date.now();
  log('นำเข้า component จากไลบรารี…');
  await resolveAll();
  log(deviceSetInfo());
  const tp = await namedPage([PLUGIN.page]);
  const page = tp.page;
  log(tp.found ? 'วางบนหน้า "' + page.name + '" ต่อใต้ของเดิม — ของที่มีอยู่บนหน้านี้ไม่ถูกแตะ'
    : tp.fallback ? '⚠ สร้างหน้า "' + PLUGIN.page + '" ไม่ได้ (แพลนจำกัดจำนวนหน้า) — วางต่อใต้ของเดิมในหน้า "' + page.name + '" ไม่ลบอะไร'
    : 'ไม่พบหน้า "' + PLUGIN.page + '" — สร้างหน้าใหม่ชื่อนี้แล้ววางลงไป');
  await figma.setCurrentPageAsync(page);
  let y = 0;
  page.children.forEach(n => { if (n.absoluteBoundingBox) y = Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + 400); });
  const TOTAL = GRP.reduce((a, g) => a + g.subs.reduce((b, s) => b + s.screens.length, 0), 0);
  const { made } = await buildGrid(page, PLUGIN.prefix, GRP, y, TOTAL * devices.length, { devices, flow: false });
  let instances = 0, loose = 0;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') loose++;
  }
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 4));
  log('');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ' + GRP.length + ' บล็อก ' + what + ' (' + GRP.map(g => g.code).join(' ') + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓'));
  log('component ที่ใช้ (' + USED.size + '): ' + [...USED].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่ต้องสลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด — ฟอนต์ ' + (FALLBACK_FONT ? FALLBACK_FONT.family + ' ' + FALLBACK_FONT.style : '-'));
  reportOversize();
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
async function build(o) { await buildSet(groupsFor(ALL_IDX), 'scenario', devOf(o)); }
async function buildDesktop(o) { await buildSet(groupsFor(ALL_IDX), 'scenario · desktop', [false]); }
async function buildMobile(o) { await buildSet(groupsFor(ALL_IDX), 'scenario · mobile', [true]); }
async function buildPick(o) {
  const idx = (o.pick || []).map(Number).filter(i => i >= 0 && i < SCENARIOS.length);
  if (!idx.length) { log('ยังไม่ได้ติ๊ก scenario — ติ๊กอย่างน้อย 1 รายการแล้วกดอีกครั้ง'); return; }
  await buildSet(groupsFor(idx), 'scenario ที่เลือก', devOf(o));
}
/* ส่งภาพจอไป FigJam — จอชุดล่าสุดบนหน้า "Safety Inspection" ไปที่ out/figjam/flow-safety-inspection/ ผ่าน serve.js */
const SHOT_DIR = 'flow-safety-inspection';
const titlesOf = (scen) => Object.fromEntries(scen.map(([t]) => [t.split(' · ')[0], t.split(' · ').slice(1).join(' · ')]));
async function shots() {
  const pg = figma.root.children.find(p => p.name.trim() === PLUGIN.page);
  if (!pg) { log('✗ ไม่พบหน้า "' + PLUGIN.page + '" ในไฟล์นี้ — กดสร้างจอก่อน แล้วค่อยส่งภาพ'); return; }
  if (pg.loadAsync) await pg.loadAsync();
  await figma.setCurrentPageAsync(pg);
  await exportShots(SHOT_DIR, null, titlesOf(SCENARIOS));
}
if (figma.ui.resize) figma.ui.resize(460, 680);

figma.ui.onmessage = async (msg) => {
  try {
    const o = { devices: msg.devices, pick: msg.pick };
    if (msg.type === 'build') await build(o);
    if (msg.type === 'build-desktop') await buildDesktop(o);
    if (msg.type === 'build-mobile') await buildMobile(o);
    if (msg.type === 'build-pick') await buildPick(o);
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
    if (msg.type === 'shots') await shots();
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]) });
