/* ============================================================================
   Maintain-D — Overhaul v2 หน้า "จัดการงาน Overhaul" 8 state จาก component จริง
   ----------------------------------------------------------------------------
   เจ้าของงานสั่ง 19 ต.ค. 2569: "อ่านจาก component จริงเท่านั้น"
   ⇒ ทุกชิ้นในหน้าจอเป็น instance (createInstance) ของ component ในไฟล์นี้ — ไฟล์ "Maintain-D" ที่ duplicate
     มาจาก (Component) VMS Plus · กรอบที่สร้างเองมีแค่ frame จัดวาง (auto-layout) ตามโครงหน้า Contract list ของ UI Release#2
   ตารางจับคู่: figma-export/overhaul-v2-component-map.md · หน้า mock ต้นทาง: design-mock/overhaul-v2-01-plans.html
   ระยะกรอบจากหน้า Contract list (5.1): Page pad 32 gap 32 · Section gap 24 · Table gap 20 · Side panel gap 24 / pad 24
   ============================================================================ */

figma.showUI(__html__, { width: 420, height: 440 });
const log = (text) => figma.ui.postMessage({ type: 'log', text });
const errors = [];
const warn = (where, e) => { const m = where + ' — ' + (e && e.message ? e.message : e); errors.push(m); log('⚠ ' + m); };

/* ---------- หา component — 3 ทาง (19 ต.ค. 2569: ไฟล์ Maintain-D มี component ในตัวแค่บางส่วน) ----------
   1) มีในไฟล์นี้เอง (local)  2) มี instance ของมันอยู่ในไฟล์แล้ว (ไลบรารี) → ใช้ main component ของ instance นั้น
   3) นำเข้าจากไลบรารี VMS Plus ด้วย key — ไฟล์ต้องเปิดใช้ไลบรารีนั้นอยู่ (Assets → Libraries)
   ทั้ง 3 ทางได้ instance ที่ผูกกับ component จริง ไม่มีการวาดเอง */
/* key ของ component ต้นฉบับในไฟล์ "component" ที่เราอ่านค่ามา (ดัมป์ 19 ต.ค. 2569 10:52 · เก็บ key ของ main component ตรงๆ) · [key, เป็น component set ไหม] */
const KEYS = {
  "Sidebar navigation": ["44614a4b2e944d2921a8735bf39d89755dc08929", true],
  "Content divider": ["5df7bd211099b5c13967ca55809923011c1695b8", true],
  "Checkbox": ["431aec9aa85f5271ad209a8baf7c667d89394db1", true],
  "Modal header": ["8eebbafefb7a0db78e062e96c6cbb2feb9b5841a", true],
  "Featured icon": ["7924204fcda3126999753512ecb890a13a586498", true],
  "Card form row": ["838a872eb4065425e9335a11ad6377782e722d36", true],
  "Number input": ["ab8ab9ec5b4725d353971d3843b9e6325ec256ca", true],
  "Badge outline": ["8a652f68828860d38ce4b04953c826f6f2748d84", true],
  "Section label": ["a9baa20a14b45ef90e3e74cd5eef8ae17adac1c0", true],
  "Tabs": ["abbfc528e17b049b49dfa1dcc3c7bc26ab1cb76f", false],
  "Tab item": ["efb1391effff741a0bd41f92c8b8ebb5f7ae8fdc", true],
  "Progress steps": ["ad140301ab65437a50300845a46a423e4c7e3952", true],
  "Horizontal step item": ["c7f7e148cc3b16706d96e1c487f01c989bd6bd82", true],
  "Alert": ["2f2e06fa7d21aa4fff19dfce8881d3116c05b18e", true],
  "Progress bar": ["7896062a5845c131efe81e39c373d335102da12f", true],
  "_File upload item base": ["114c601616d02bb1afec21af83e4ece8bc9e10d6", true],
  "_File icon": ["d8c1ddb33805d573b0a431b159cd94e0e20e3fb4", true],
  "Modal footer": ["78e84b8dfd520b686df45c5219feaf5f64a4bcec", true],
  "Text area": ["7c785b9589252e678fd93790a7f7e14a5c4295ef", true],
  "Tertiary danger button": ["9bb3414bf62bfc8b4b678a17a539fbf0a8aa1660", true],
  "Section header": ["0c9fb1c08a612abd000d804a95c1c03b0a765462", true],
  "_File upload base": ["db2705beaf011d82fd9d2c9f3fd4b4209dbb7112", true],
  "File upload": ["82991026baf7e7e4063dc8b837e282678c3a252e", true],
  "_Content item base": ["a131ef189e777d69cebddfe4c9062fa42045b5ce", true],
  "Content item row": ["e8c610799a7f365e0cad447fa9b42d1fea9103dc", true],
  "List header item": ["3407ff1533898ceb3de86bd3fe73e6bc65d9b690", false],
  "List with checkbox item": ["3a4c16006b31a6a874d6a42f58798196d493e0c1", true],
  "List with checkbox": ["9a7807cf30ce63f749dd5041b49f444ea73816d8", false],
  "Date picker": ["aec5697b4e4cea8ef26f19f2803c0518c8d44498", true],
  "Secondary button": ["707d8f051bf2eb42aecb6b2b0af9ae1552b387b8", true],
  "Primary button": ["cf8aa9f0a6181051108f4dc3f32529ce3bf6520f", true],
  "Tertiary button": ["54f378df2a98f217edb5f4afdc06b8e4d17964b0", true],
  "Tertiary brand button": ["ae32e68f4168736350672eec7a8922acb0046b99", true],
  "Background overlay": ["7508216023c093b6775ecbdc8da566f002c42b35", false],
  "Input label": ["100b172084b1ad5149031c2be07b944e763d0614", false],
  "Checkbox with badge": ["56110090d18655cb65f9f66d5bb63de68ca14813", false],
  "Pill outline": ["9b2ab6144dd44edbe96c5f23607ecda2b649d353", true],
  "Text input": ["ee163422d91020d39770ea1da8b3b7029591f5c9", true],
  "Table header": ["4c2192715fe57cede2ebb34c09c440e480d326a8", true],
  "search-24-300-round": ["2686cdef98896d918405092d40c6c08ea6b6406a", false],
  "Input dropdown": ["8cacaddc8403f16136cdd9eef163fd7dc5efe835", true],
  "filter_list-24-400-round": ["5e274a00f056dc8b4802e262a414017f4725f40c", false],
  "Badge outline with remove icon": ["a285551749934eae24da851c1acf1247dd5e7c99", true],
  "Notification": ["fc959d9835c4148fa850540cf242c2167e05e9f0", true],
  "Side panel header": ["3ea502c415f48f8c0ecd06f1d68853d3ed4e7b6e", false],
  "Side panel footer": ["5c7bb5aaeee5919a801447690f4717e085eab59d", false],
  "more_horiz-20-400-round": ["eaff13f98af363da8bd768280924ecdf6713af2f", false],
  "Page header": ["69471f2ac8d0daf0fe58a85fddac8ac2d79fbd35", true],
  "Header navigation": ["7f45afc3a183edd34cdd943b3b6641ab1f71dd2b", true],
  "Nav button": ["fb0cf06df292e5bff53d7503855a3b943fb8225b", true],
  "quick_reference_all-24-300-round": ["9ed6481ba385035617f2491e6e7b5d6a58e9997c", false],
  "stylus-24-300-round": ["803aec7e2947f42a48164aa843ea6078b14cae1f", false],
  "delete-24-300-round": ["d0a4abe7a062d89630de6bd7cb8ce325d1fd8336", false],
  "Table cell": ["2c5b641cf63a8a66f18d2a702c0fddf3fe3b2b20", true],
  "Table header cell": ["d689fd327ddac63e712a5bb5a3b4f3e39fab435e", true],
  "Sort icon": ["928313a87632334f23fdab3838bfa254beea6487", true],
  "Table pagination": ["11f4baa0cf668c7223365b87083857c061746379", true],
  "Button groups pagination item": ["5e1bc247e077b6c16b789d24c6d7f00b12dad97c", true],
  "add-24-300-round": ["47c602564a20cd47b2a10f3c87a5e752321eeca4", false],
  "Dropdown list": ["e702e9f249a6bb7225014ce050e03b13a2b965ed", false],
  "Dropdown list item": ["74ddf5510c3e2082fb7324804c0f1500f532947b", true],
  "Primary danger button": ["b3e8e8e49e99d7d98f1b3865880a63c410e1566e", true],
  "Modal": ["34dca4d1ae5102bbe6181fb4524d5cf6b6e82fe1", true],
  "_Dropdown menu item": ["fbe755b4b02920368151d62c89564c2e38376b62", true],
  "Empty state/Search not found": ["32ec03005ee4bc44e7b30227d21bcfd04fa21ce6", false],
  "Empty state/Data empty": ["15a4fa89592939d4234a5e4f03760a76dc7f0a11", false],
  "Dropdown menu": ["640a71ed325bbbbd32290c9e81dfcd431fe2d6b2", false],
};
const ALIAS = {};   // 19 ต.ค.: Sidebar navigation มี key ของไฟล์ component แล้ว ไม่ต้องอ้างชื่อ Sidebar ของ UI Release#2
const NEEDED = ['Sidebar navigation', 'Nav button', 'Header navigation', 'Page header', 'Table header', 'Table header cell', 'Table cell',
  'Table pagination', 'Sort icon', 'Pill outline', 'Badge outline with remove icon', 'Button groups pagination item', 'Primary button',
  'Secondary button', 'Tertiary button', 'Tertiary brand button', 'Primary danger button', 'Text input', 'Dropdown menu', '_Dropdown menu item',
  'Background overlay', 'Side panel header', 'Side panel footer', 'Input dropdown', 'Input label', 'Checkbox with badge', 'Dropdown list',
  'Dropdown list item', 'Modal', 'Notification', 'Empty state/Search not found', 'Empty state/Data empty', 'add-24-300-round',
  'filter_list-24-400-round', 'more_horiz-20-400-round', 'quick_reference_all-24-300-round', 'stylus-24-300-round', 'delete-24-300-round',
  'search-24-300-round'];
/* ตัวที่ใช้แค่เป็นชิ้นซ้อนใน component อื่น (แก้ property ของตัวที่ซ้อนอยู่) — ไม่ต้อง createInstance เอง ⇒ ขาดได้ไม่หยุด
   (19 ต.ค. 2569: ไฟล์ Maintain-D ไม่มี Primary danger button ให้ดึง แต่ปุ่มนี้ซ้อนอยู่ใน Modal Destructive อยู่แล้ว) */
const NESTED_ONLY = new Set(['Nav button', 'Sort icon', 'Pill outline', 'Badge outline with remove icon', 'Button groups pagination item',
  'Primary button', 'Secondary button', 'Tertiary button', 'Tertiary brand button', 'Primary danger button', 'Text input',
  '_Dropdown menu item', 'Dropdown list item']);
/* หน้าที่เหลือ (ฟอร์มแผน · รายละเอียดแผน · PO · หน้างานรายคัน) — อ่านจากหน้าจริงใน UI Release#2 ที่เป็นแบบ
   (Create rental contract · Rental contract info · Contract vehicle list · Modal / Edit contract · Create vehicle (Step 1) ·
   Modal / Create appointment · Incident log · Job detail) — ใช้ในโหมด "เช็คอย่างเดียว" ให้เจ้าของงานเตรียม instance ที่ขาด */
const FUTURE = ['Section header', 'Section label', 'Content item row', '_Content item base', 'Tab item', 'Tabs', 'Card form row',
  'Modal header', 'Modal footer', 'Content divider', 'File upload', '_File upload base', '_File upload item base', '_File icon',
  'Progress bar', 'Progress steps', 'Horizontal step item', 'List with checkbox', 'List with checkbox item', 'List header item',
  'Checkbox', 'Text area', 'Date picker', 'Badge outline', 'Tertiary danger button', 'Featured icon', 'Number input', 'Alert'];
const INDEX = new Map();     // ชื่อ → COMPONENT_SET / COMPONENT ที่ใช้ได้
const ROUTE = {};            // ชื่อ → ได้มาทางไหน
let IMPORT_ERR = '';
const holderOf = (c) => (c.parent && c.parent.type === 'COMPONENT_SET') ? c.parent : c;
async function resolveAll(list, checkOnly) {
  list = list || NEEDED;
  await figma.loadAllPagesAsync();
  const local = new Map();
  for (const n of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
    if (n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') continue;
    if (!local.has(n.name)) local.set(n.name, n);
  }
  log('component ในไฟล์นี้เอง ' + local.size + ' ตัว');
  const viaInst = new Map();
  {
    const insts = figma.root.findAllWithCriteria({ types: ['INSTANCE'] });
    for (const i of insts) {
      try {
        const mc = await i.getMainComponentAsync();
        if (!mc) continue;
        const h = holderOf(mc);
        if (!viaInst.has(h.name)) viaInst.set(h.name, h);
      } catch (e) { /* ข้าม instance ที่เข้าไม่ถึง */ }
    }
  }
  const missing = [];
  for (const name of list) {
    const names = [name].concat(ALIAS[name] || []);
    let got = null, how = '';
    /* 19 ต.ค. 2569 เจ้าของงานต้องการให้ "Go to main component" พาไปไฟล์ (Component) VMS Plus ที่เราอ่านค่ามา
       ⇒ นำเข้าด้วย key (key ทั้งหมดอ่านจากไฟล์นั้น) มาก่อน · ยืมจาก instance ในไฟล์เป็นทางสุดท้าย (อาจชี้ไลบรารีอื่นที่เปิดไม่ได้) */
    // ลำดับ (19 ต.ค. 2569): นำเข้าจากไลบรารีไฟล์ component ก่อนเสมอ — แม้ไฟล์นี้มีสำเนาชื่อเดียวกัน (เช่น Page header ของ Maintain-D)
    // เพราะสำเนาในไฟล์กด Go to main component แล้ววนอยู่ในไฟล์นี้ ไม่ไปไฟล์ที่อ่านค่ามา
    let importErr = '';
    if (!got) for (const x of names) {
      const k = KEYS[x]; if (!k) continue;
      try { got = k[1] ? await figma.importComponentSetByKeyAsync(k[0]) : await figma.importComponentByKeyAsync(k[0]); how = 'นำเข้าจากไลบรารี'; break; }
      catch (e) { importErr = (e && e.message) || String(e); }
    }
    if (!got) for (const x of names) { if (local.has(x)) { got = local.get(x); how = 'สำเนาในไฟล์นี้ ⚠ ลิงก์วนในไฟล์นี้'; break; } }
    if (!got) for (const x of names) { if (viaInst.has(x)) { got = viaInst.get(x); how = 'จาก instance ในไฟล์ ⚠ อาจลิงก์ไปไลบรารีที่เปิดไม่ได้'; break; } }
    if (!got && importErr) how = 'นำเข้าไม่ได้: ' + importErr;
    if (importErr && !IMPORT_ERR && !NESTED_ONLY.has(name)) IMPORT_ERR = importErr;   // ชิ้นส่วนซ้อน (เช่น _Dropdown menu item ที่ Figma ไม่ publish) ไม่ต้องเตือน
    if (got) { INDEX.set(name, got); ROUTE[name] = how + (got.name !== name ? ' (ชื่อ ' + got.name + ')' : ''); }
    else missing.push(name + (how ? ' — ' + how : ''));
  }
  if (IMPORT_ERR) log('⚠ นำเข้าจากไลบรารีไม่ได้ (' + IMPORT_ERR + ') — ตัวที่ได้ "จาก instance ในไฟล์" จะกด Go to main component ไปไฟล์ Component ที่อ่านมาไม่ได้ · เปิดใช้ไลบรารี (Component) VMS Plus ในไฟล์นี้ (Assets → Libraries) แล้วรันใหม่');
  const by = {};
  for (const n of Object.keys(ROUTE)) { const r = ROUTE[n].split(' (')[0]; by[r] = (by[r] || 0) + 1; }
 log('หา component ได้ ' + list.filter(n => INDEX.has(n)).length + '/' + list.length + ' · ' + Object.keys(by).map(k => k + ' ' + by[k]).join(' · '));
  if (checkOnly) {
    if (!missing.length) log('✓ มีครบ ไม่ต้องเตรียมเพิ่ม');
    else { log('ยังไม่มีในไฟล์ ' + missing.length + ' ตัว — ลากจาก Assets มาวางในไฟล์อย่างละ 1 ชิ้น (หน้าไหนก็ได้):'); missing.forEach(m => log('  ✗ ' + m.split(' — ')[0])); }
    return;
  }
  const soft = missing.filter(m => NESTED_ONLY.has(m.split(' — ')[0]));
  const hard = missing.filter(m => !NESTED_ONLY.has(m.split(' — ')[0]));
  soft.forEach(m => log('  · ไม่พบ ' + m.split(' — ')[0] + ' — ไม่เป็นไร ใช้ตัวที่ซ้อนอยู่ใน component อื่น'));
  if (hard.length) {
    log('ไม่พบ ' + hard.length + ' ตัวที่ต้องสร้างเอง:');
    hard.forEach(m => log('  ✗ ' + m));
    throw new Error('component ไม่ครบ — ถ้าขึ้น "นำเข้าไม่ได้" ให้เปิดใช้ไลบรารี VMS Plus ในไฟล์นี้ (Assets → Libraries) แล้วรันใหม่');
  }
}
function main(name, variant) {
  const n = INDEX.get(name);
  if (!n) throw new Error('ไม่พบ component "' + name + '"');
  if (n.type === 'COMPONENT') return n;
  const want = variant || {};
  const hit = n.children.find(c => Object.keys(want).every(k => c.variantProperties && c.variantProperties[k] === want[k]));
  if (!hit) throw new Error('ไม่พบ variant ' + JSON.stringify(want) + ' ของ "' + name + '"');
  return hit;
}
const icon = (name) => main(name).id;   // ใช้กับ property ชนิด INSTANCE_SWAP

/* ---------- ตัวช่วยแก้ instance ---------- */
function setProps(node, obj) {
  const cp = node.componentProperties || {};
  const out = {};
  for (const k of Object.keys(obj)) {
    const full = Object.keys(cp).find(x => x === k || x.split('#')[0] === k);
    if (!full) { warn(node.name, 'ไม่มี property "' + k + '"'); continue; }
    out[full] = obj[k];
  }
  try { if (Object.keys(out).length) node.setProperties(out); } catch (e) { warn(node.name + ' setProperties ' + JSON.stringify(obj), e); }
}
function inst(name, variant, props) {
  const n = main(name, variant).createInstance();
  if (props) setProps(n, props);
  return n;
}
const find = (root, name, nth) => {
  const all = root.findAll(n => n.name === name);
  return all[nth || 0] || null;
};
async function text(root, layer, value, nth) {
  const t = typeof layer === 'string' ? find(root, layer, nth) : layer;
  if (!t || t.type !== 'TEXT') { warn(root.name, 'ไม่พบข้อความ "' + layer + '"'); return; }
  try {
    const fonts = t.fontName === figma.mixed ? t.getRangeAllFontNames(0, t.characters.length) : [t.fontName];
    for (const f of fonts) await figma.loadFontAsync(f);
    t.characters = value;
  } catch (e) { warn('ข้อความ ' + layer, e); }
}
function hide(root, name, all) {
  const list = root.findAll(n => n.name === name);
  if (!list.length) { warn(root.name, 'ไม่พบ layer "' + name + '" ให้ซ่อน'); return; }
  (all ? list : [list[0]]).forEach(n => { n.visible = false; });
}
function frame(name, dir, o) {
  const f = figma.createFrame();
  f.name = name;
  f.fills = o && o.fill ? [{ type: 'SOLID', color: o.fill }] : [];
  if (dir) {
    f.layoutMode = dir;
    f.itemSpacing = (o && o.gap) || 0;
    const p = (o && o.pad) || 0;
    f.paddingTop = f.paddingBottom = Array.isArray(p) ? p[0] : p;
    f.paddingLeft = f.paddingRight = Array.isArray(p) ? p[1] : p;
    f.primaryAxisSizingMode = 'AUTO';
    f.counterAxisSizingMode = 'AUTO';
  }
  return f;
}
function add(parent, child, fill) {
  parent.appendChild(child);
  if (fill === 'h' || fill === 'both') child.layoutSizingHorizontal = 'FILL';
  if (fill === 'v' || fill === 'both') child.layoutSizingVertical = 'FILL';
  return child;
}
const WHITE = { r: 1, g: 1, b: 1 };

/* ---------- ข้อมูล (ตรงกับ overhaul-v2-mock.js oh2Seed · เรียงเลขแผนมากไปน้อยตามค่าตั้งต้นของ mock) ---------- */
const STATUS = { P1: ['ยังไม่มี PO', 'Gray'], P2: ['ดำเนินการ', 'Info'], P3: ['เสร็จสิ้น', 'Success'] };
const PLANS = [
  ['123460', 'Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้', 'C-70-OH-0002', '21,500,000', '1', '1', 'P2', '10/10/2569'],
  ['123459', 'Overhaul ประจำปีงบ 2570 — รถเครน กฟน.1', 'C-70-OH-0001', '12,400,000', '0', '0', 'P1', '01/10/2569'],
  ['123458', 'Overhaul ประจำปีงบ 2569 — รถเจาะหลุม', 'C-69-OH-0103', '6,200,000', '0', '0', 'P1', '02/09/2569'],
  ['123457', 'Overhaul ประจำปีงบ 2569 — รถกระเช้า', 'C-69-OH-0102', '8,500,000', '1', '3', 'P2', '20/08/2569'],
  ['123456', 'Overhaul ประจำปีงบ 2569 — รถเครน', 'C-69-OH-0101', '10,000,000', '3', '3', 'P2', '12/08/2569'],
  ['123402', 'Overhaul ประจำปีงบ 2568 — รถกระเช้า', 'C-68-OH-0102', '4,300,000', '1', '1', 'P3', '01/08/2568'],
  ['123401', 'Overhaul ประจำปีงบ 2568 — รถเครน', 'C-68-OH-0101', '9,800,000', '1', '2', 'P3', '15/07/2568'],
];
/* คอลัมน์: หัว · ความกว้าง (รวม 1296 = กว้าง Page ของ Contract list) · Style ของ Table cell · เรียงได้ไหม */
const COLS = [
  ['เลขแผน', 112, 'Lead text', true], ['ชื่อแผน', 300, 'Text', true], ['ศูนย์ต้นทุน', 140, 'Text', true],
  ['งบประมาณ (บาท)', 140, 'Text', false], ['Purchase Order', 128, 'Text', false], ['จำนวนรถที่ Overhaul', 168, 'Text', false],
  ['สถานะ', 136, 'Badge', true], ['วันที่สร้าง', 112, 'Text', false], ['', 60, 'Action icons', false],
];

/* ---------- ชิ้นส่วนหน้าจอ ---------- */
async function pageHeader() {
  const ph = inst('Page header', { Breakpoint: 'Desktop' }, {
    Title: 'จัดการงาน Overhaul', 'Supporting text': false, Badge: false, 'Back action': false, 'Copy action': false, 'More actions': false,
  });
  // Breadcrumbs: หน้าแรก › จัดการงาน Overhaul (ซ่อนลิงก์ระดับกลาง)
  ['Link 1', 'Link 2', 'Link 3', 'Truncate link'].forEach(n => hide(ph, n));
  const cur = find(ph, 'Current link');
  if (cur) await text(cur, 'Link', 'จัดการงาน Overhaul');
  // Actions: เหลือ Primary button "สร้างแผน Overhaul"
  const acts = find(ph, 'Actions');
  if (acts) {
    for (const b of acts.children) {
      if (b.name !== 'Primary button') { b.visible = false; continue; }
      setProps(b, { Text: 'สร้างแผน Overhaul', 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') });
    }
  }
  return ph;
}

async function tableHeader(o) {
  const th = inst('Table header', { Breakpoint: 'Desktop' }, {
    'Table title': false, Badge: false, 'Supporting text': false, 'More actions': false, Filters: !!(o.chips && o.chips.length),
  });
  const ti = find(th, 'Text input');
  if (ti) {
    // ใช้ property Text ของ Text input — layer ชื่อ "Text" ตัวแรกในนั้นเป็นของปุ่มใน Input label ไม่ใช่ช่องกรอก
    setProps(ti, { Label: false, Helper: false, 'Trailing icon': false, Text: o.query || 'ค้นหาเลขแผน, ชื่อแผน, เลขศูนย์ต้นทุน' });
  }
  const acts = find(th, 'Actions');
  if (acts) {
    let first = true;
    for (const b of acts.children) {
      if (b.name === 'Secondary button' && first) {
        first = false;
        setProps(b, { Text: 'ตัวกรอง', 'Leading icon': true, 'Leading icon swap': icon('filter_list-24-400-round') });
        const pill = find(b, 'Pill outline'); if (pill) pill.visible = false;   // ใช้ป้ายตัวกรองแทนตัวนับ (เคาะ 19 ต.ค.)
      } else b.visible = false;
    }
  }
  // ป้ายตัวกรองที่ใช้อยู่ — Badge outline with remove icon Color=Brand
  const chips = th.findAll(n => n.name === 'Badge outline with remove icon');
  chips.forEach((c, i) => {
    if (o.chips && i < o.chips.length) setProps(c, { Text: o.chips[i] });
    else c.visible = false;
  });
  return th;
}

function tableBlock(rows) {
  const tbl = frame('Table', 'VERTICAL', { gap: 20 });
  const content = frame('Content', 'HORIZONTAL');
  add(tbl, content, 'h');
  COLS.forEach(([head, w, style, sortable], ci) => {
    const col = frame('Column', 'VERTICAL');
    content.appendChild(col);
    col.layoutSizingHorizontal = 'FIXED';
    col.resize(w, col.height);
    const hc = inst('Table header cell', { Checkbox: 'False' }, { Text: head || ' ', 'Sort icon': sortable, 'Header text': !!head });
    add(col, hc, 'h');
    if (sortable) { const s = find(hc, 'Sort icon'); if (s) setProps(s, { Icon: ci === 0 ? 'Down' : 'Swap' }); }
    rows.forEach((r, ri) => {
      const alt = ri % 2 === 1 ? 'True' : 'False';
      const cell = inst('Table cell', { Style: style, 'Alternating fills': alt });
      add(col, cell, 'h');
      if (style === 'Badge') {
        const pill = find(cell, 'Pill outline');
        if (pill) setProps(pill, { Color: STATUS[r[6]][1], Text: STATUS[r[6]][0] });
      } else if (style === 'Action icons') {
        setProps(cell, { View: true, Edit: false, Print: false, Delete: false });
        const btn = find(cell, 'Tertiary button');
        if (btn) setProps(btn, { 'Leading icon swap': icon('more_horiz-20-400-round') });
      } else {
        const v = ci === 6 ? '' : r[ci];
        setProps(cell, { Text: v, Supporting: false });
      }
    });
  });
  return tbl;
}

async function pagination(n) {
  const pg = inst('Table pagination', { Breakpoint: 'Desktop' });
  await text(pg, 'Text', 'แสดง 1 ถึง ' + n + ' จาก ' + n + ' รายการ');
  const items = pg.findAll(x => x.name === 'Button groups pagination item');
  items.forEach((it, i) => {
    if (i === 0) setProps(it, { State: 'Disabled' });
    else if (i === 1) setProps(it, { Number: '1' });
    else if (i === items.length - 1) setProps(it, { State: 'Disabled' });
    else it.visible = false;
  });
  return pg;
}

/* โครงหน้าเต็ม (Sidebar + Header navigation + Page) — ตามเฟรม Contract list */
async function screen(title, o) {
  const outer = figma.createFrame();
  outer.name = 'OH2 / ' + title;
  outer.resize(1440, 1024);
  outer.fills = [{ type: 'SOLID', color: WHITE }];
  outer.clipsContent = true;

  const scr = frame('Screen', 'HORIZONTAL', { fill: WHITE });
  outer.appendChild(scr);
  scr.primaryAxisSizingMode = 'FIXED'; scr.counterAxisSizingMode = 'FIXED';
  scr.resize(1440, 1024);

  const sb = inst('Sidebar navigation', { State: 'Collapsed' });
  scr.appendChild(sb);
  const navs = sb.findAll(n => n.name === 'Nav button');
  if (navs[0]) setProps(navs[0], { State: 'Active' });

  const ctn = frame('Container', 'VERTICAL', { fill: WHITE });
  add(scr, ctn, 'both');
  add(ctn, inst('Header navigation', { Breakpoint: 'Desktop' }), 'h');

  const page = frame('Page', 'VERTICAL', { gap: 32, pad: 32, fill: WHITE });
  add(ctn, page, 'both');
  add(page, await pageHeader(), 'h');

  const sec = frame('Section', 'VERTICAL', { gap: 24 });
  add(page, sec, 'h');
  if (!o.empty) add(sec, await tableHeader(o), 'h');   // หน้าว่างไม่มีแถบค้นหา (Contract list - Empty state)

  if (o.empty) {
    const es = inst('Empty state/Data empty');
    add(sec, es, 'h');
    await text(es, 'Text', 'ยังไม่มีแผน Overhaul');
    await text(es, 'Supporting text', 'สร้างแผนเพื่อเริ่มเพิ่ม Purchase Order และติดตามงานรายคัน');
    const sb2 = find(es, 'Secondary button'); if (sb2) sb2.visible = false;
    const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'สร้างแผน Overhaul', 'Leading icon swap': icon('add-24-300-round') });
  } else if (o.notFound) {
    const es = inst('Empty state/Search not found');
    add(sec, es, 'h');
    await text(es, 'Text', 'ไม่พบแผน Overhaul');
    await text(es, 'Supporting text', 'ไม่มีแผนที่ตรงกับคำค้นหรือตัวกรอง');
    const sb2 = find(es, 'Secondary button'); if (sb2) setProps(sb2, { Text: 'ล้างคำค้นและตัวกรอง', 'Leading icon': false });
    const pb = find(es, 'Primary button'); if (pb) pb.visible = false;
  } else {
    const tbl = tableBlock(o.rows);
    add(sec, tbl, 'h');
    add(tbl, await pagination(o.rows.length), 'h');
  }
  return outer;
}

/* ---------- ชั้นบน ---------- */
function menuOverRow(outer) {
  // เมนู "…" — Dropdown menu วางใต้ปุ่มท้ายแถวแรก ชิดขวา
  const cell = outer.findAll(n => n.type === 'INSTANCE' && n.name === 'Table cell').filter(n => {
    const v = n.variantProperties; return v && v.Style === 'Action icons';
  })[0];
  const m = inst('Dropdown menu');
  outer.appendChild(m);
  hide(m, '_Dropdown menu header');
  const items = (find(m, 'Menu items') || m).children;
  const want = [['ดูรายละเอียด', 'quick_reference_all-24-300-round'], ['แก้ไข', 'stylus-24-300-round'], null, ['ลบ', 'delete-24-300-round']];
  // ลำดับในคอมโพเนนต์: 0–2 รายการ · 3 เส้นคั่น · 4… รายการ — ใช้ 0, 1, (เส้นคั่น 3), 4
  const map = { 0: want[0], 1: want[1], 3: 'divider', 4: want[3] };
  items.forEach((it, i) => {
    const w = map[i];
    if (!w) { it.visible = false; return; }
    if (w === 'divider') return;
    setProps(it, { Text: w[0], Shortcut: false, Icon: true, 'Icon swap': icon(w[1]) });
  });
  if (cell) {
    const ob = outer.absoluteBoundingBox, cb = cell.absoluteBoundingBox;
    m.x = cb.x - ob.x + cb.width - m.width - 16;
    m.y = cb.y - ob.y + cb.height - 8;
  }
  return m;
}

async function filterPanel(outer) {
  const ov = inst('Background overlay');
  outer.appendChild(ov); ov.x = 0; ov.y = 0; ov.resize(1440, 1024);
  const panel = frame('Panel', 'VERTICAL', { gap: 24, fill: WHITE });
  outer.appendChild(panel);
  panel.primaryAxisSizingMode = 'FIXED'; panel.counterAxisSizingMode = 'FIXED';
  panel.resize(480, 1024); panel.x = 960; panel.y = 0;

  const hd = inst('Side panel header');
  add(panel, hd, 'h');
  hide(hd, 'Tabs');
  await text(hd, 'Text', 'ตัวกรอง');
  await text(hd, 'Supporting text', 'กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ');

  const body = frame('Content', 'VERTICAL', { gap: 24, pad: [0, 24] });
  add(panel, body, 'both');

  const dd = (label, value, state, extra) => {
    const n = inst('Input dropdown', { State: state, Size: 'md' }, Object.assign({
      'Label text': label, Text: value, Optional: false, Helper: false, 'Info icon': false, 'Leading icon': false, Supporting: false,
    }, extra || {}));
    add(body, n, 'h');
    return n;
  };
  dd('งบประมาณ', 'ทั้งหมด', 'Default');

  const st = frame('Section', 'VERTICAL', { gap: 12 });
  add(body, st, 'h');
  const lb = inst('Input label');
  add(st, lb, 'h');
  await text(lb, 'Label', 'สถานะ');
  hide(lb, '(ถ้ามี)'); hide(lb, 'info-24-300-round'); hide(lb, 'Tertiary brand button');
  for (const k of ['P1', 'P2', 'P3']) {
    const cb = inst('Checkbox with badge');
    st.appendChild(cb);
    const pill = find(cb, 'Pill outline');
    if (pill) setProps(pill, { Color: STATUS[k][1], Text: STATUS[k][0] });
  }

  dd('รถ', 'สงขลา', 'Focused', { 'Leading icon': true, 'Leading icon swap': icon('search-24-300-round') });
  const list = inst('Dropdown list');
  add(body, list, 'h');
  const li = list.children.filter(n => n.name === 'Dropdown list item');
  li.forEach((it, i) => {
    if (i > 0) { it.visible = false; return; }
    setProps(it, { State: 'Default', Text: '72-6648 สงขลา', 'Supporting text': 'HINO FG1J · รถกระเช้า', Avatar: false, 'Supporting 2': false });
  });
  const sc = find(list, 'Vertical scrollbar'); if (sc) sc.visible = false;
  dd('ศูนย์ต้นทุน', 'ทั้งหมด', 'Default');

  const ft = inst('Side panel footer');
  add(panel, ft, 'h');
  const tb = find(ft, 'Tertiary brand button'); if (tb) setProps(tb, { Text: 'ล้างตัวกรอง', 'Leading icon': false, 'Trailing icon': false });
  const sb = find(ft, 'Secondary button'); if (sb) setProps(sb, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
  const pb = find(ft, 'Primary button'); if (pb) setProps(pb, { Text: 'ตกลง', 'Leading icon': false, 'Trailing icon': false });
}

async function deleteModal(outer) {
  const m = inst('Modal', { Type: 'Destructive centered image with input', Size: 'md' });
  outer.appendChild(m); m.x = 0; m.y = 0;
  // userflow ไม่มีรูปและช่องเหตุผล ⇒ ซ่อน layer ในตัว instance (ไม่ detach)
  hide(m, 'Content'); hide(m, 'Form');
  const hd = find(m, 'Modal header');
  if (hd) {
    await text(hd, 'Text', 'ยืนยันการลบแผน');
    await text(hd, 'Supporting text', 'แผน 123460 "Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้" และ Purchase Order 1 ใบในแผนนี้จะถูกลบ');
  }
  const sb = find(m, 'Secondary button'); if (sb) setProps(sb, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
  const db = find(m, 'Primary danger button'); if (db) setProps(db, { Text: 'ยืนยัน', 'Leading icon': false, 'Trailing icon': false });
}

function notification(outer, title) {
  const n = inst('Notification', { Type: 'Success', Breakpoint: 'Desktop' }, { Text: title, Actions: false });
  outer.appendChild(n);
  const sup = find(n, 'Supporting text'); if (sup) sup.visible = false;
  n.x = 1440 - n.width; n.y = 1024 - n.height;   // component มีขอบขวา/ล่าง 24 ในตัว
}

/* ---------- ประกอบ 8 state ---------- */
async function build() {
  errors.length = 0;
  await resolveAll();

  // หน้าปลายทาง: สร้างหน้าใหม่ ถ้าแพลนไม่ให้เพิ่มหน้า (Starter จำกัด 3 หน้า) ใช้หน้าปัจจุบัน
  // เจ้าของงานสร้างหน้า "overhaul-1" ไว้เอง 19 ต.ค. 2569 ⇒ ใช้หน้านั้นก่อน (ไม่สนตัวพิมพ์เล็กใหญ่) · ไม่มีค่อยสร้างใหม่
  const lower = (p) => p.name.trim().toLowerCase();
  let page = figma.root.children.find(p => lower(p) === 'overhaul-1')
    || figma.root.children.find(p => lower(p).indexOf('overhaul') === 0)
    || figma.root.children.find(p => p.name === 'Overhaul v2 — จัดการงาน Overhaul');
  if (page) log('วางในหน้า "' + page.name + '"');
  if (!page) {
    try { page = figma.createPage(); page.name = 'Overhaul v2 — จัดการงาน Overhaul'; }
    catch (e) { page = figma.currentPage; log('เพิ่มหน้าใหม่ไม่ได้ (' + e.message + ') → วางในหน้าปัจจุบัน "' + page.name + '"'); }
  }
  await figma.setCurrentPageAsync(page);
  page.children.filter(n => n.name.indexOf('OH2 / ') === 0).forEach(n => n.remove());

  // วางต่อจากของเดิมในหน้า (กันทับ)
  let baseY = 0;
  page.children.forEach(n => { if (n.absoluteBoundingBox) baseY = Math.max(baseY, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + 400); });

  const states = [
    ['01 · S1–S3 รายการแผน', async () => screen('01 · S1–S3 รายการแผน', { rows: PLANS })],
    ['02 · เมนู "…" ท้ายแถว', async () => { const s = await screen('02 · เมนู "…" ท้ายแถว', { rows: PLANS }); menuOverRow(s); return s; }],
    ['03 · ตัวกรอง', async () => { const s = await screen('03 · ตัวกรอง', { rows: PLANS }); await filterPanel(s); return s; }],
    ['04 · ผลกรองด้วยรถ', async () => screen('04 · ผลกรองด้วยรถ', { rows: [PLANS[0], PLANS[3]], chips: ['72-6648 สงขลา'] })],
    ['05 · ค้นไม่เจอ', async () => screen('05 · ค้นไม่เจอ', { notFound: true, query: 'ไม่มีแผนนี้' })],
    ['06 · S3 ยืนยันการลบแผน', async () => { const s = await screen('06 · S3 ยืนยันการลบแผน', { rows: PLANS }); await deleteModal(s); return s; }],
    ['07 · S3 ลบสำเร็จ', async () => { const s = await screen('07 · S3 ลบสำเร็จ', { rows: PLANS.slice(1) }); notification(s, 'ลบแผน overhaul สำเร็จ'); return s; }],
    ['08 · ยังไม่มีแผน', async () => screen('08 · ยังไม่มีแผน', { empty: true })],
  ];

  const made = [];
  for (let i = 0; i < states.length; i++) {
    const [name, fn] = states[i];
    try {
      const s = await fn();
      page.appendChild(s);
      s.x = i * (1440 + 200); s.y = baseY;
      made.push(s);
      log('✓ ' + name);
    } catch (e) { warn(name, e); }
  }

  // ตรวจ: ทุกชิ้นที่ไม่ใช่กรอบจัดวาง ต้องเป็น instance ของ component ในไฟล์นี้
  let instances = 0, remote = 0, loose = 0;
  const names = new Set();
  for (const s of made) {
    for (const n of s.findAll(() => true)) {
      if (n.type === 'INSTANCE') {
        const top = n.parent && (n.parent.type === 'FRAME' && !findInstanceAncestor(n));
        if (top) {
          instances++;
          const mc = await n.getMainComponentAsync();
          if (mc) { names.add(mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name); if (mc.remote) remote++; }
        }
      } else if (n.type !== 'FRAME' && !findInstanceAncestor(n)) loose++;
    }
  }
  figma.viewport.scrollAndZoomIntoView(made);
  log('');
  log('สร้าง ' + made.length + '/8 หน้าจอ · instance ชั้นบนสุด ' + instances + ' ชิ้น (ชี้ไลบรารีภายนอก ' + remote + ')');
  log('ชิ้นที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓'));
  log('component ที่ใช้ (' + names.size + '): ' + [...names].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
}
function findInstanceAncestor(n) {
  let p = n.parent;
  while (p) { if (p.type === 'INSTANCE') return p; p = p.parent; }
  return null;
}

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'build') await build();
    if (msg.type === 'check') {
      log('— เช็ค component ที่หน้าที่เหลือต้องใช้ (ไม่สร้างอะไร) —');
      await resolveAll(NEEDED.concat(FUTURE.filter(n => NEEDED.indexOf(n) < 0)), true);
    }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
