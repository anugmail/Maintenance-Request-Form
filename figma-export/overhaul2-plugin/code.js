/* ============================================================================
   Maintain-D — Overhaul v2 หน้า "จัดการงาน Overhaul" 8 state จาก component จริง
   ----------------------------------------------------------------------------
   เจ้าของงานสั่ง 19 ต.ค. 2569: "อ่านจาก component จริงเท่านั้น"
   ⇒ ทุกชิ้นในหน้าจอเป็น instance (createInstance) ของ component ในไฟล์นี้ — ไฟล์ "Maintain-D" ที่ duplicate
     มาจาก (Component) VMS Plus · กรอบที่สร้างเองมีแค่ frame จัดวาง (auto-layout) ตามโครงหน้า Contract list ของ UI Release#2
   ตารางจับคู่: figma-export/overhaul-v2-component-map.md · หน้า mock ต้นทาง: design-mock/overhaul-v2-01-plans.html
   ระยะกรอบจากหน้า Contract list (5.1): Page pad 32 gap 32 · Section gap 24 · Table gap 20 · Side panel gap 24 / pad 24
   ============================================================================ */

figma.showUI(__html__, { width: 460, height: 520 });
const log = (text) => figma.ui.postMessage({ type: 'log', text });
const errors = [];
const warn = (where, e) => { const m = where + ' — ' + (e && e.message ? e.message : e); errors.push(m); log('⚠ ' + m); };

/* ---------- หา component — 3 ทาง (19 ต.ค. 2569: ไฟล์ Maintain-D มี component ในตัวแค่บางส่วน) ----------
   1) มีในไฟล์นี้เอง (local)  2) มี instance ของมันอยู่ในไฟล์แล้ว (ไลบรารี) → ใช้ main component ของ instance นั้น
   3) นำเข้าจากไลบรารี VMS Plus ด้วย key — ไฟล์ต้องเปิดใช้ไลบรารีนั้นอยู่ (Assets → Libraries)
   ทั้ง 3 ทางได้ instance ที่ผูกกับ component จริง ไม่มีการวาดเอง */
/* key ของ component ต้นฉบับในไฟล์ "component" ที่เราอ่านค่ามา (ดัมป์ 19 ต.ค. 2569 10:52 · เก็บ key ของ main component ตรงๆ) · [key, เป็น component set ไหม] */
const KEYS = {
  "Mobile table": ["4ca09b73532ee1f8f21e3e0a6f2c7f151839ee62", true],
  "Mobile table item": ["754d62b4c29ea0f402f67950cfe7a4eae279e591", true],
  "Mobile progress steps": ["9154edd850c0be2201a44213fe6e94163a7a1516", true],
  "Step circles / 5 steps": ["998a4238f9644a495a163c6153656f3cad2442e2", true],
  "Bottom sheet header": ["8b8c40f9f3a569cf24b0c2207402d4cf6d2df6ff", false],
  "Bottom sheet footer": ["0f09ce0ff9507963e6129019503d00e0cf52c50d", false],
  "Modal header": ["8eebbafefb7a0db78e062e96c6cbb2feb9b5841a", true],
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
  "Secondary danger button": ["bb23b83c2d5b8b890f4a2990ffc4d4e4e6be25af", true],
  "keyboard_arrow_right-20-400-round": ["a01b27c1070404627f9a1e8127466603a83eb12c", false],
  "keyboard_arrow_left-20-400-round": ["32933c0651c04a63cb2aa78648cf8b15ebc7c266", false],
  "cloud_upload-24-300-round": ["bb12332b86d47144684d92bf7d358b9c2b7a4e50", false],
};
const ALIAS = {};   // 19 ต.ค.: Sidebar navigation มี key ของไฟล์ component แล้ว ไม่ต้องอ้างชื่อ Sidebar ของ UI Release#2
/* component ที่ปลั๊กอินสร้างเองหรือใช้สลับไอคอน — ขาดตัวไหนหยุด (19 ต.ค. 2569 ขยายครบ 14 scenario) */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Content item row', 'Table header',
  'Table header cell', 'Table cell', 'Table pagination', 'Text input', 'Input dropdown', 'Text area', 'File upload', 'Input label',
  'List with checkbox', 'Horizontal step item', 'Alert', 'Pill outline', 'Primary button', 'Secondary button', 'Secondary danger button',
  'Tertiary button', 'Dropdown menu', 'Dropdown list', 'Background overlay', 'Side panel header', 'Side panel footer', 'Checkbox with badge',
  'Modal', 'Notification', 'Empty state/Search not found', 'Empty state/Data empty',
  'add-24-300-round', 'filter_list-24-400-round', 'more_horiz-20-400-round', 'quick_reference_all-24-300-round', 'stylus-24-300-round',
  'delete-24-300-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round', 'keyboard_arrow_left-20-400-round', 'cloud_upload-24-300-round',
  // mobile (19 ต.ค. 2569)
  'Mobile table', 'Mobile progress steps', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header'];
/* ตัวที่ใช้แค่เป็นชิ้นซ้อนใน component อื่น (แก้ property ของตัวที่ซ้อนอยู่) — ขาดได้ไม่หยุด
   (เช่น _Dropdown menu item ที่ Figma ไม่ publish เพราะชื่อขึ้นต้น "_" · Primary danger button ที่มากับ Modal Destructive) */
const NESTED = ['Nav button', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button',
  'Primary danger button', '_Dropdown menu item', 'Dropdown list item', '_Content item base', '_File upload item base',
  'List with checkbox item', 'List header item', 'Checkbox', 'Card form row', 'Badge outline', 'Mobile table item', 'Step circles / 5 steps'];
const NEEDED = DIRECT.concat(NESTED);
const NESTED_ONLY = new Set(NESTED);
const FUTURE = [];
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
  /* ยืมจาก instance ในไฟล์ = ทางสุดท้าย — สแกนเฉพาะเมื่อมีตัวที่นำเข้าไม่ได้ (เดิมสแกนทุกรอบ: ไฟล์มี instance หลายพันตัว ช้ามาก) */
  const viaInst = new Map();
  let scanned = false;
  const scanInstances = async () => {
    if (scanned) return; scanned = true;
    log('กำลังสแกน instance ในไฟล์ (มีตัวที่นำเข้าจากไลบรารีไม่ได้)…');
    const insts = figma.root.findAllWithCriteria({ types: ['INSTANCE'] });
    for (const i of insts) {
      try {
        const mc = await i.getMainComponentAsync();
        if (!mc) continue;
        const h = holderOf(mc);
        if (!viaInst.has(h.name)) viaInst.set(h.name, h);
      } catch (e) { /* ข้าม instance ที่เข้าไม่ถึง */ }
    }
  };
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
    if (!got) await scanInstances();
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
const USED = new Set();
function inst(name, variant, props) {
  USED.add(name);
  const n = main(name, variant).createInstance();
  if (props) setProps(n, props);
  return n;
}
const find = (root, name, nth) => {
  const all = root.findAll(n => n.name === name);
  return all[nth || 0] || null;
};
const FONTS = new Set();
async function text(root, layer, value, nth) {
  const t = typeof layer === 'string' ? find(root, layer, nth) : layer;
  if (!t || t.type !== 'TEXT') { warn(root.name, 'ไม่พบข้อความ "' + layer + '"'); return; }
  try {
    const fonts = t.fontName === figma.mixed ? t.getRangeAllFontNames(0, t.characters.length) : [t.fontName];
    for (const f of fonts) { const k = f.family + '|' + f.style; if (!FONTS.has(k)) { await figma.loadFontAsync(f); FONTS.add(k); } }   // โหลดฟอนต์ละครั้งเดียว
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

/* ============================================================================
   หน้าจอครบ 14 scenario (19 ต.ค. 2569) — ทุกชิ้นเป็น instance · frame ที่สร้างเองมีแค่กรอบจัดวาง (auto-layout)
   แหล่งเนื้อหา: design-mock/overhaul-v2-0*.html · ระยะตามหน้าจริงใน UI Release#2:
   Page pad 32 gap 32 (Contract list) · แถวช่องกรอกห่าง 24 · แถวห่าง 32 (Create rental contract) · Side panel gap 24
   ============================================================================ */

/* ---------- ข้อมูลตัวอย่าง (ตรงกับ overhaul-v2-mock.js) ---------- */
const STATUS = { P1: ['ยังไม่มี PO', 'Gray'], P2: ['ดำเนินการ', 'Info'], P3: ['เสร็จสิ้น', 'Success'] };
const JOB = { V1: ['รอนัดหมายเข้าอู่', 'Gray'], V2: ['รอหน่วยงานตอบรับนัดเข้าอู่', 'Warning'], V3: ['หน่วยงานปฏิเสธนัดเข้าอู่', 'Error'],
  V4: ['รอตรวจรับรถ', 'Warning'], V5: ['กำลังซ่อม', 'Info'], V6: ['รอตรวจสภาพ Safety', 'Warning'], V7: ['รอนัดหมายรับรถ', 'Gray'],
  V8: ['รอหน่วยงานตอบรับนัดรับรถ', 'Warning'], V9: ['หน่วยงานปฏิเสธนัดรับรถ', 'Error'], V10: ['รอปิดงาน', 'Brand'], V11: ['ปิดงานแล้ว', 'Success'] };
const BADGE_OF = { Gray: 'Gray', Info: 'Brand', Success: 'Success', Warning: 'Brand', Error: 'Error', Brand: 'Brand' };   // Badge outline มีแค่ 5 สี
const PLANS = [
  ['123460', 'Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้', 'C-70-OH-0002', '21,500,000', '1', '1', 'P2', '10/10/2569'],
  ['123459', 'Overhaul ประจำปีงบ 2570 — รถเครน กฟน.1', 'C-70-OH-0001', '12,400,000', '0', '0', 'P1', '01/10/2569'],
  ['123458', 'Overhaul ประจำปีงบ 2569 — รถเจาะหลุม', 'C-69-OH-0103', '6,200,000', '0', '0', 'P1', '02/09/2569'],
  ['123457', 'Overhaul ประจำปีงบ 2569 — รถกระเช้า', 'C-69-OH-0102', '8,500,000', '1', '3', 'P2', '20/08/2569'],
  ['123456', 'Overhaul ประจำปีงบ 2569 — รถเครน', 'C-69-OH-0101', '10,000,000', '3', '3', 'P2', '12/08/2569'],
  ['123402', 'Overhaul ประจำปีงบ 2568 — รถกระเช้า', 'C-68-OH-0102', '4,300,000', '1', '1', 'P3', '01/08/2568'],
  ['123401', 'Overhaul ประจำปีงบ 2568 — รถเครน', 'C-68-OH-0101', '9,800,000', '1', '2', 'P3', '15/07/2568'],
];
const NEW_PLAN = ['123461', 'Overhaul ประจำปีงบ 2570 — รถเจาะหลุม', 'C-70-OH-0003', '5,500,000', '0', '0', 'P1', '19/10/2569'];
const POS = [['PO-690101', 'ซ่อมระบบเครื่องยนต์', 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด', '2'], ['PO-690102', 'ซ่อมระบบไฮดรอลิกเครน', 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด', '1'],
  ['PO-690103', 'ซ่อมระบบแอร์', 'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', '1']];
const CARS = [['8234 กค กทม', 'HINO FM2P · รถเครน 10 ตัน', '182,400', '12', 'V5'], ['70-1123 ชลบุรี', 'HINO FG8J · รถเครน 5 ตัน', '150,200', '11', 'V2']];
const ALL_CARS = [['8234 กค กทม', 'HINO FM2P · รถเครน 10 ตัน', '182,400', '12'], ['81-5521 นครปฐม', 'ISUZU FVM · รถกระเช้า', '210,050', '14'],
  ['70-1123 ชลบุรี', 'HINO FG8J · รถเครน 5 ตัน', '150,200', '11'], ['82-0457 สระบุรี', 'ISUZU FXZ · รถเจาะหลุมปักเสา', '198,700', '13'],
  ['71-9902 ขอนแก่น', 'MITSUBISHI FN · รถกระเช้า', '233,100', '15'], ['80-3316 เชียงใหม่', 'HINO FM1A · รถเครน 10 ตัน', '176,900', '10'],
  ['83-2210 นครราชสีมา', 'ISUZU FVZ · รถเจาะหลุมปักเสา', '205,400', '12'], ['72-6648 สงขลา', 'HINO FG1J · รถกระเช้า', '221,300', '16']];
const CHECKLIST = ['สำเนาคู่มือจดทะเบียนรถ', 'กุญแจรถ (ตัวจริง + สำรอง)', 'สภาพตัวรถภายนอกและสี', 'ระบบไฟส่องสว่างและสัญญาณ', 'ยางและล้อ (รวมยางอะไหล่)', 'ระดับน้ำมันเครื่องและของเหลว', 'เครื่องมือประจำรถ'];
const STEPS = ['นัดเอารถเข้าอู่', 'ตรวจรับรถ', 'ติดตามงานซ่อม', 'ตรวจสภาพ', 'นัดรับรถ', 'ปิดงาน'];
const VENDOR = ['บริษัท มิตซูบิชิ ฟูโซ่ ทรัค จำกัด', '02-111-2203', 'อ.บางพลี สมุทรปราการ'];

/* ---------- mobile (เจ้าของงานเคาะ 19 ต.ค. 2569) ----------
   ใช้กับจอ < 768 (รวม tablet) · ออกแบบเฟรม 402×874 (เจ้าของงานเปลี่ยนจาก 360×850 วันเดียวกัน) · component Breakpoint=Mobile ยืดเต็มกว้าง เว้นขอบ 16
   ตาราง → การ์ด Mobile table · กล่องเด้ง → bottom sheet (Background overlay + Bottom sheet header + เนื้อหา + Bottom sheet footer)
   ทุกฟังก์ชันประกอบหน้าดูตัวแปร MOB — สร้างจอ desktop แล้วสลับ MOB สร้างจอ mobile ด้วยข้อมูลชุดเดียวกัน */
let MOB = false;
const BP = () => (MOB ? 'Mobile' : 'Desktop');
const VW = () => (MOB ? 402 : 1440), VH = () => (MOB ? 874 : 1024);

/* ---------- ตัวช่วยประกอบ ---------- */
function btn(kind, label, o) {
  o = o || {};
  const variant = { State: o.disabled ? 'Disabled' : 'Default' };
  if (kind !== 'Tertiary brand button') variant.Size = o.size || 'md';   // Tertiary brand button ไม่มี Size
  const props = { Text: label, 'Leading icon': !!o.icon, 'Trailing icon': false };
  if (o.icon) props['Leading icon swap'] = icon(o.icon);
  return inst(kind, variant, props);
}
function row(name, kids, o) {
  if (MOB && !(o && o.keep)) {   // mobile: แถวช่องกรอกเรียงลงล่าง เต็มกว้าง (ตัด Spacer ทิ้ง)
    const c = frame(name || 'Row', 'VERTICAL', { gap: 16 });
    kids.forEach(k => { if (!k) return; if (k.type === 'FRAME' && k.name === 'Spacer') { k.remove(); return; } add(c, k, 'h'); });
    return c;
  }
  const r = frame(name || 'Row', 'HORIZONTAL', { gap: (o && o.gap) != null ? o.gap : 24 });
  r.counterAxisAlignItems = (o && o.align) || 'MIN';
  kids.forEach(k => { if (k) { r.appendChild(k); if (!(o && o.hug)) k.layoutGrow = 1; } });
  return r;
}
function col(name, kids, gap) { const c = frame(name || 'Content', 'VERTICAL', { gap: gap == null ? 32 : gap }); kids.forEach(k => { if (k) add(c, k, 'h'); }); return c; }
function field(label, value, o) {   // Text input
  o = o || {};
  const st = o.state || (o.error ? 'Error' : value ? 'Filled' : 'Default');
  const n = inst('Text input', { State: st, Size: 'md' }, { 'Label text': label, Text: value || o.placeholder || '', Optional: !!o.optional,
    Helper: !!o.error, 'Helper text': o.error || '', 'Info icon': false, 'Leading icon': !!o.lead, 'Trailing icon': false,
    'Show Placeholder': !value });
  if (o.lead) setProps(n, { 'Leading icon swap': icon(typeof o.lead === 'string' ? o.lead : 'search-24-300-round') });
  return n;
}
function dropdown(label, value, o) {   // Input dropdown
  o = o || {};
  const st = o.state || (o.error ? 'Error' : value ? 'Selected' : 'Default');
  const p = { 'Label text': label, Text: value || o.placeholder || 'เลือก', Optional: false, Helper: !!o.error, 'Helper text': o.error || '',
    'Info icon': false, 'Leading icon': !!o.lead, Supporting: false };
  if (o.lead) p['Leading icon swap'] = icon(o.lead);
  return inst('Input dropdown', { State: st, Size: 'md' }, p);
}
function area(label, value, o) {
  o = o || {};
  return inst('Text area', { State: value ? 'Filled' : 'Default', Size: 'md' }, { 'Label text': label, Text: value || o.placeholder || '',
    Optional: !!o.optional, Helper: false, 'Info icon': false, 'Trailing icon': false, 'Show Placeholder': !value });
}
async function section(title, o) {   // Section header + ปุ่มขวา
  o = o || {};
  const sh = inst('Section header', { Breakpoint: BP() }, { Title: title, Badge: o.badge != null, 'Supporting text': false,
    Actions: !!(o.buttons && o.buttons.length), 'More actions': false });
  if (o.badge != null) { const b = find(sh, 'Badge outline'); if (b) setProps(b, { Text: String(o.badge) }); }
  const acts = find(sh, 'Actions');
  if (acts) acts.children.forEach(c => { c.visible = false; });
  (o.buttons || []).forEach((b, i) => {
    const slot = acts && acts.children.filter(c => c.name === b.kind)[i] || (acts && acts.children.find(c => c.name === b.kind && !c.visible));
    if (slot) { slot.visible = true; setProps(slot, { Text: b.text, 'Leading icon': !!b.icon, 'Trailing icon': false }); if (b.icon) setProps(slot, { 'Leading icon swap': icon(b.icon) }); }
  });
  return sh;
}
function kv(pairs, perRow) {   // Content item row ละ 4 ช่อง (Type=Text with label) · mobile แถวละ 2
  perRow = MOB ? 2 : (perRow || 4);
  const box = frame('Content item', 'VERTICAL', { gap: 8 });
  for (let i = 0; i < pairs.length; i += perRow) {
    const r = inst('Content item row', { 'Column width': 'Full' });
    const items = r.children.filter(c => c.name === '_Content item base');
    const slice = pairs.slice(i, i + perRow);
    items.forEach((it, j) => {
      if (j >= slice.length) return;
      setProps(it, { Type: 'Text with label' });
      setProps(it, { Label: slice[j][0], Text: slice[j][1], Supporting: false, 'Leading icon': false });
    });
    setProps(r, { 'Item 2': slice.length > 1, 'Item 3': slice.length > 2, 'Item 4': slice.length > 3 });
    add(box, r, 'h');
  }
  return box;
}
async function upload(label, files, o) {   // File upload Type=Default
  o = o || {};
  const u = inst('File upload', { Type: 'Default' }, { 'File queue': files.length > 0, Helper: !!o.error, 'Helper text': o.error || '',
    'File upload': !o.readonly });   // หน้ารายละเอียด: แสดงเฉพาะรายการไฟล์ ไม่มีกล่องอัปโหลด
  const lb = find(u, 'Input label');
  if (lb) { await text(lb, 'Label', label); const op = find(lb, '(ถ้ามี)'); if (op) op.visible = !!o.optional; const ic = find(lb, 'info-24-300-round'); if (ic) ic.visible = false; const tb = find(lb, 'Tertiary brand button'); if (tb) tb.visible = false; }
  const base = find(u, '_File upload base'); if (base && o.error) setProps(base, { State: 'Error' });
  if (base) { await text(base, 'Supporting text', 'PDF, JPG · สูงสุด 10 ไฟล์ · ' + files.length + '/10 ไฟล์'); }
  const items = u.findAll(n => n.name === '_File upload item base');
  items.forEach((it, i) => {
    if (i >= files.length) { it.visible = false; return; }
    const f = files[i];
    setProps(it, { State: f.err ? 'Error' : 'Completed' });
    setProps(it, { 'File name': f.name, 'File size': f.err ? 'อัปโหลดไม่สำเร็จ — รับเฉพาะไฟล์ PDF หรือ JPG' : f.size, 'Progress bar': false,
      Actions: true, 'Download action': !f.err && !o.readonly, 'Delete action': !o.readonly });
  });
  return u;
}
function mobileCards(cols, rows) {   // mobile: 1 แถวตาราง = 1 การ์ด Mobile table (หัวข้อ–ค่า เรียงลง · แถวสุดท้ายเป็นปุ่ม)
  if (rows.some(r => r.some(v => v && v.check != null))) {   // checklist → List with checkbox
    const l = inst('List with checkbox');
    const hd = find(l, 'List header item'); if (hd) { const b = find(hd, 'Badge outline'); if (b) b.visible = false; const cb = find(hd, 'Checkbox'); if (cb) setProps(cb, { Type: rows.every(r => r[0].check) ? 'Selected' : 'Unselected' }); }
    l.children.filter(c => c.name === 'List with checkbox item').forEach((it, i) => {
      if (i >= rows.length) { it.visible = false; return; }
      setProps(it, { State: rows[i][0].check ? 'Selected' : 'Default' });
      setProps(it, { Text: rows[i][0].text, Avatar: false, Supporting: false, 'Supporting 2': false });
    });
    const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = false;
    l._title = cols[0][0];
    return l;
  }
  const box = frame('Mobile table', 'VERTICAL', { gap: 12 });
  rows.forEach((r, ri) => {
    const card = inst('Mobile table', { 'Alternating fills': 'False' });
    const items = card.children.filter(c => c.name === 'Mobile table item');
    const data = [], acts = [];
    cols.forEach(([head], ci) => { const v = r[ci]; if (v && (v.menu || v.icons)) acts.push(v); else if (head) data.push([head, v]); });
    items.forEach((it, i) => {
      const last = i === items.length - 1;
      if (last) {
        if (!acts.length) { it.visible = false; return; }
        const ic = acts[0].menu ? ['more_horiz-20-400-round'] : acts[0].icons;
        setProps(it, { View: ic.length > 0, Edit: ic.length > 1, Print: false, Delete: false });
        it.findAll(n => n.name === 'Tertiary button').forEach((b, k) => { if (ic[k]) setProps(b, { 'Leading icon swap': icon(ic[k]) }); });
        return;
      }
      if (i >= data.length) { it.visible = false; return; }
      const [head, v] = data[i];
      if (v && v.pill) { setProps(it, { Style: 'Badge' }); setProps(it, { Header: head }); const p = find(it, 'Pill outline'); if (p) setProps(p, { Color: v.pill[1], Text: v.pill[0] }); }
      else { setProps(it, { Style: i === 0 ? 'Lead text' : 'Text' }); setProps(it, { Header: head, Text: v == null ? '' : String(v), Supporting: false }); }
    });
    add(box, card, 'h');
  });
  return box;
}
function tbl(cols, rows) {   // cols: [หัว, กว้าง, Style, เรียงได้] · ช่อง: ข้อความ | {pill:[t,สี]} | {menu:1} | {icons:[..]} | {check:bool,text}
  if (MOB) return mobileCards(cols, rows);
  const t = frame('Table', 'HORIZONTAL');
  cols.forEach(([head, w, style, sort], ci) => {
    const c = frame('Column', 'VERTICAL');
    t.appendChild(c);
    if (w) { c.layoutSizingHorizontal = 'FIXED'; c.resize(w, c.height); } else c.layoutGrow = 1;
    const hc = inst('Table header cell', { Checkbox: 'False' }, { Text: head || ' ', 'Sort icon': !!sort, 'Header text': !!head });
    add(c, hc, 'h');
    if (sort) { const s = find(hc, 'Sort icon'); if (s) setProps(s, { Icon: sort }); }
    rows.forEach((r, ri) => {
      const v = r[ci], alt = ri % 2 ? 'True' : 'False';
      const st = v && v.check != null ? 'Lead checkbox' : v && v.pill ? 'Badge' : v && (v.menu || v.icons) ? 'Action icons' : style || 'Text';
      const cell = inst('Table cell', { Style: st, 'Alternating fills': alt });
      add(c, cell, 'h');
      if (st === 'Badge') { const p = find(cell, 'Pill outline'); if (p) setProps(p, { Color: v.pill[1], Text: v.pill[0] }); }
      else if (st === 'Action icons') {
        const ic = v.menu ? ['more_horiz-20-400-round'] : v.icons;
        setProps(cell, { View: ic.length > 0, Edit: ic.length > 1, Print: false, Delete: false });
        const bs = cell.findAll(n => n.name === 'Tertiary button');
        ic.forEach((name, i) => { if (bs[i]) setProps(bs[i], { 'Leading icon swap': icon(name) }); });
      } else if (st === 'Lead checkbox') {
        setProps(cell, { Text: v.text, Supporting: false });
        const cb = find(cell, 'Checkbox'); if (cb) setProps(cb, { Type: v.check ? 'Selected' : 'Unselected' });
      } else setProps(cell, { Text: v == null ? '' : String(v), Supporting: false });
    });
  });
  return t;
}
async function listCheck(title, items, ticked) {   // List with checkbox (หัว + รายการ)
  const l = inst('List with checkbox');
  const hd = find(l, 'List header item');
  if (hd) { await text(hd, 'Text', title); const b = find(hd, 'Badge outline'); if (b) setProps(b, { Text: String(items.length) });
    const cb = find(hd, 'Checkbox'); if (cb) setProps(cb, { Type: ticked.length === 0 ? 'Unselected' : ticked.length === items.length ? 'Selected' : 'Indeterminate' }); }
  const rows = l.children.filter(c => c.name === 'List with checkbox item');
  rows.forEach((r, i) => {
    if (i >= items.length) { r.visible = false; return; }
    const on = ticked.indexOf(i) >= 0;
    setProps(r, { State: on ? 'Selected' : 'Default' });
    setProps(r, { Text: items[i][0], 'Supporting text': items[i][1], 'Supporting 2': true, 'Supporting text 2': 'เลขไมล์ ' + items[i][2] + ' กม. · อายุ ' + items[i][3] + ' ปี', Avatar: false, Supporting: true });
  });
  const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = false;
  return l;
}
function stepper(cur, allDone) {   // Horizontal step item × 6 (Progress steps ของไลบรารีมีได้สูงสุด 4 ขั้น)
  if (MOB) {   // Mobile progress steps — วงกลมในไลบรารีมีสูงสุด 5 ขั้น ⇒ ใช้ 5 ขั้น แล้วแก้ตัวเลขเป็น x/6 (เส้นรอบวงไม่ตรงสัดส่วน 6 ขั้น)
    const m = inst('Mobile progress steps', { Collapsed: 'True' }, { Text: STEPS[cur - 1], Supporting: cur < STEPS.length, 'Supporting text': STEPS[cur] || '' });
    const circ = main('Step circles / 5 steps', { Step: String(Math.min(cur, 5)) });
    setProps(m, { 'Stepper item swap': circ.id });
    const c = m.findAll(n => n.type === 'INSTANCE' && /^Step circles/.test(n.name))[0];
    if (c) { text(c, 'Current', String(allDone ? 6 : cur)); text(c, 'Total', '6'); }
    return m;
  }
  const r = frame('Progress steps', 'HORIZONTAL');
  STEPS.forEach((s, i) => {
    const n = i + 1, st = allDone || n < cur ? 'Completed' : n === cur ? 'Current' : 'Incomplete';
    const it = inst('Horizontal step item', { Status: st }, { Text: s, Number: String(n), Supporting: false, Connector: n < STEPS.length });
    r.appendChild(it); it.layoutGrow = 1;
  });
  return r;
}
function alertBox(color, title, sub) {
  return inst('Alert', { Color: color }, { Text: title, 'Supporting text': sub || '', Supporting: !!sub, 'Leading icon': true, 'Close icon': false });
}
function pill(t, color) { return inst('Pill outline', { Color: color }, { Text: t }); }

/* ---------- โครงหน้า: Sidebar + Header navigation + Page (ตาม Contract list) ---------- */
async function shell(name, o) {
  if (MOB) {   // mobile: ไม่มี Sidebar · Header navigation Mobile · หน้าเว้นขอบ 16
    const scr = frame('OH2 / ' + name, 'VERTICAL', { fill: WHITE });
    scr.counterAxisSizingMode = 'FIXED'; scr.resize(VW(), VH()); scr.primaryAxisSizingMode = 'AUTO'; scr.minHeight = VH(); scr.clipsContent = true;
    add(scr, inst('Header navigation', { Breakpoint: 'Mobile' }), 'h');
    const page = frame('Page', 'VERTICAL', { gap: 24, pad: [16, 16], fill: WHITE });
    add(scr, page, 'h');
    add(page, await pageHead(o), 'h');
    return { scr, page };
  }
  const scr = frame('OH2 / ' + name, 'HORIZONTAL', { fill: WHITE });
  scr.primaryAxisSizingMode = 'FIXED'; scr.resize(1440, 1024); scr.counterAxisSizingMode = 'AUTO'; scr.minHeight = 1024; scr.clipsContent = true;
  const sb = inst('Sidebar navigation', { State: 'Collapsed' });
  scr.appendChild(sb); try { sb.layoutSizingVertical = 'FILL'; } catch (e) { /* สูงตามตัวเองก็ได้ */ }
  const navs = sb.findAll(n => n.name === 'Nav button'); if (navs[0]) setProps(navs[0], { State: 'Active' });
  const ctn = frame('Container', 'VERTICAL', { fill: WHITE });
  scr.appendChild(ctn); ctn.layoutGrow = 1;
  add(ctn, inst('Header navigation', { Breakpoint: 'Desktop' }), 'h');
  const page = frame('Page', 'VERTICAL', { gap: 32, pad: 32, fill: WHITE });
  add(ctn, page, 'h');
  add(page, await pageHead(o), 'h');
  return { scr, page };
}
/* Page header: crumbs = ลิงก์ระดับกลาง · ปุ่มขวาตาม o.primary (Actions ของ Page header) หรือ o.actions (กรอบแยก — ปุ่มลบสีแดงไม่มีใน Page header) */
async function pageHead(o) {
  const ph = inst('Page header', { Breakpoint: BP() }, { Title: o.title, 'Supporting text': false, Badge: !!o.badge,
    'Back action': !!o.back, 'Copy action': false, 'More actions': false, Actions: !!o.primary });
  const crumbs = ['จัดการงาน Overhaul'].concat(o.crumbs || []);
  for (const [i, n] of ['Link 1', 'Link 2', 'Link 3'].entries()) {
    const l = find(ph, n); if (!l) continue;
    if (i < crumbs.length - 1) { const lk = find(l, 'Link'); if (lk) await text(l, lk, crumbs[i]); } else l.visible = false;
  }
  const tr = find(ph, 'Truncate link'); if (tr) tr.visible = false;
  const cur = find(ph, 'Current link'); if (cur) await text(cur, 'Link', crumbs[crumbs.length - 1]);
  if (crumbs.length === 1) { /* หน้าแรกของเมนู: ลิงก์ปัจจุบันคือชื่อเมนูเอง */ }
  if (o.badge) { const b = find(ph, 'Badge outline'); if (b) setProps(b, { Color: BADGE_OF[o.badge[1]] || 'Gray', Text: o.badge[0] }); }
  const acts = find(ph, 'Actions');
  if (acts && o.primary) for (const b of acts.children) {
    if (b.name !== 'Primary button') { b.visible = false; continue; }
    setProps(b, { Text: o.primary, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') });
  }
  if (!o.actions) return ph;
  if (MOB) {   // mobile: ปุ่มของหน้าเรียงใต้หัวหน้า แบ่งครึ่ง
    const w = frame('Page header', 'VERTICAL', { gap: 16 });
    add(w, ph, 'h');
    const ab = frame('Actions', 'HORIZONTAL', { gap: 12 });
    o.actions.forEach(a => { const b = btn(a[0], a[1], { icon: a[2] }); ab.appendChild(b); b.layoutGrow = 1; });
    add(w, ab, 'h');
    return w;
  }
  const wrap = row('Page header', [], { gap: 12, hug: true, align: 'MAX' });
  wrap.appendChild(ph); ph.layoutGrow = 1;
  const ab = row('Actions', o.actions.map(a => btn(a[0], a[1], { icon: a[2] })), { gap: 12, hug: true });
  wrap.appendChild(ab);
  return wrap;
}
/* แถวปุ่มท้ายหน้า: 2 ปุ่มขึ้นไป = ปุ่มแรก (ย้อนกลับ/ยกเลิก) ชิดซ้าย ปุ่มสุดท้ายชิดขวา — เจ้าของงานแก้ในแบบจริง 19 ต.ค. 2569 */
const btnRow = (list) => {
  if (MOB) {   // mobile: ปุ่มเต็มแถว แบ่งเท่ากัน (แบบ Bottom sheet footer ของไลบรารี)
    const r = frame('Actions', 'HORIZONTAL', { gap: 16 });
    list.forEach(b => { const n = btn(b[0], b[1], Object.assign({}, b[2] || {}, { size: 'lg' })); r.appendChild(n); n.layoutGrow = 1; });
    return r;
  }
  const r = row('Actions', list.map(b => btn(b[0], b[1], b[2] || {})), { gap: 12, hug: true, keep: true });
  r.primaryAxisAlignItems = list.length > 1 ? 'SPACE_BETWEEN' : 'MAX';   // ปุ่มเดียวก็ชิดขวา
  return r;
};

/* ---------- ชั้นบน ---------- */
function overlay(scr, node, x, y) { scr.appendChild(node); node.layoutPositioning = 'ABSOLUTE'; node.x = x; node.y = y; return node; }
function notify(scr, title, err) {
  const n = inst('Notification', { Type: err ? 'Error' : 'Success', Breakpoint: BP() }, { Text: title, Actions: false });
  const sup = find(n, 'Supporting text'); if (sup) sup.visible = false;
  overlay(scr, n, VW() - n.width, VH() - n.height);
}
/* bottom sheet ประกอบจากชิ้นไลบรารี (Bottom sheet ของไลบรารีล็อกเนื้อหาตายตัว) — แบบเดียวกับที่ UI Release#2 ประกอบแผงตัวกรอง */
async function sheet(scr, o) {
  overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), VH());
  const sh = frame('Sheet', 'VERTICAL', { fill: WHITE });
  sh.topLeftRadius = sh.topRightRadius = 24;
  overlay(scr, sh, 0, 0); sh.counterAxisSizingMode = 'FIXED'; sh.resize(VW(), sh.height);
  const hd = inst('Bottom sheet header'); add(sh, hd, 'h');
  const ta = find(hd, 'Text and action');
  if (o.title && ta) {
    await text(ta, 'Text', o.title);
    const tb = find(ta, 'Tertiary button'); if (tb) tb.visible = false;
    const br = find(ta, 'Tertiary brand button'); if (br) { if (o.action) setProps(br, { Text: o.action, 'Leading icon': false, 'Trailing icon': false }); else br.visible = false; }
  } else { if (ta) ta.visible = false; const dv = find(hd, 'Divider'); if (dv) dv.visible = false; }
  const body = frame('Content', 'VERTICAL', { gap: 16, pad: [0, 16] });
  add(sh, body, 'h');
  for (const n of (o.content || [])) add(body, n, 'h');
  const ft = inst('Bottom sheet footer'); add(sh, ft, 'h');
  const sb = find(ft, 'Secondary button'); if (sb) setProps(sb, { Text: o.cancel || 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
  let pb = find(ft, 'Primary button');
  if (pb && o.danger) { try { pb.swapComponent(main('Primary danger button', { State: 'Default', Size: 'lg' })); } catch (e) { warn('ปุ่มลบสีแดงใน bottom sheet', e); } }
  if (pb) setProps(pb, { Text: o.ok || 'ยืนยัน', 'Leading icon': false, 'Trailing icon': false });
  sh.y = VH() - sh.height;
  return { sh, body };
}
async function confirm(scr, o) {   // Modal กลาง — danger = Destructive · อื่น = Centered image (ซ่อนรูป) · mobile = bottom sheet
  if (MOB) {
    const mh = inst('Modal header', { Alignment: 'Center' });
    await text(mh, 'Text', o.title); await text(mh, 'Supporting text', o.sub);
    const x = find(mh, 'Tertiary button'); if (x) x.visible = false; const dv = find(mh, 'Divider'); if (dv) dv.visible = false;
    const r = await sheet(scr, { content: [mh], danger: o.danger, ok: o.ok, cancel: o.cancel });
    r.body.paddingLeft = r.body.paddingRight = 0;
    return;
  }
  const m = inst('Modal', { Type: o.danger ? 'Destructive centered image with input' : 'Centered image', Size: 'md' });
  overlay(scr, m, 0, 0);
  hide(m, 'Content'); if (o.danger) hide(m, 'Form');
  const hd = find(m, 'Modal header');
  if (hd) { await text(hd, 'Text', o.title); await text(hd, 'Supporting text', o.sub); }
  const sb = find(m, 'Secondary button'); if (sb) setProps(sb, { Text: o.cancel || 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
  const pb = find(m, o.danger ? 'Primary danger button' : 'Primary button'); if (pb) setProps(pb, { Text: o.ok || 'ยืนยัน', 'Leading icon': false, 'Trailing icon': false });
}
async function formModal(scr, o) {   // Modal Type=Form · แถวที่ 2 สลับเป็น Text area ด้วย property "Input 1 swap" ของ Card form row
  if (MOB) { await sheet(scr, { title: o.title, content: o.fields.map(f => f.area ? area(f.label, f.value) : field(f.label, f.value)), ok: 'บันทึก' }); return; }
  const m = inst('Modal', { Type: 'Form', Size: 'md' });
  overlay(scr, m, 0, 0);
  const hd = find(m, 'Modal header');
  if (hd) { await text(hd, 'Text', o.title); const sup = find(hd, 'Supporting text'); if (sup) sup.visible = false; }
  const rows = (find(m, 'Form') || m).children.filter(c => c.name === 'Card form row');
  rows.forEach((r, i) => {
    if (i >= o.fields.length) { r.visible = false; return; }
    const f = o.fields[i];
    setProps(r, { 'Input 2': false });
    if (f.area) setProps(r, { 'Input 1 swap': main('Text area', { State: 'Filled', Size: 'md' }).id });
    const inp = r.children.find(c => c.type === 'INSTANCE' && c.visible !== false);
    if (inp) setProps(inp, { State: f.value ? 'Filled' : 'Default' });
    if (inp) setProps(inp, { 'Label text': f.label, Text: f.value || '', Optional: false, Helper: false, 'Info icon': false, 'Show Placeholder': !f.value });
  });
  const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && n.parent.name === 'Actions');
  ft.forEach(b => {
    if (b.name === 'Primary button') setProps(b, { Text: 'บันทึก', 'Leading icon': false, 'Trailing icon': false });
    else if (b.name === 'Secondary button') setProps(b, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
    else b.visible = false;
  });
}
function menuAt(scr, anchor, items) {   // Dropdown menu ใต้ปุ่ม "…" · mobile = bottom sheet ที่มีรายการเมนู
  if (MOB) {
    overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), VH());
    const sh = frame('Sheet', 'VERTICAL', { fill: WHITE, pad: [0, 0] }); sh.topLeftRadius = sh.topRightRadius = 24;
    overlay(scr, sh, 0, 0); sh.counterAxisSizingMode = 'FIXED'; sh.resize(VW(), sh.height);
    const hd = inst('Bottom sheet header'); add(sh, hd, 'h'); const ta = find(hd, 'Text and action'); if (ta) ta.visible = false; const dv = find(hd, 'Divider'); if (dv) dv.visible = false;
    const m = inst('Dropdown menu'); add(sh, m, 'h'); hide(m, '_Dropdown menu header');
    const list = (find(m, 'Menu items') || m).children; const want = { 0: items[0], 1: items[1], 3: 'divider', 4: items[2] };
    list.forEach((it, i) => { const w = want[i]; if (!w) { it.visible = false; return; } if (w !== 'divider') setProps(it, { Text: w[0], Shortcut: false, Icon: true, 'Icon swap': icon(w[1]) }); });
    m.strokes = []; sh.y = VH() - sh.height;
    return m;
  }
  const m = inst('Dropdown menu');
  hide(m, '_Dropdown menu header');
  const list = (find(m, 'Menu items') || m).children;
  const want = { 0: items[0], 1: items[1], 3: 'divider', 4: items[2] };
  list.forEach((it, i) => {
    const w = want[i];
    if (!w) { it.visible = false; return; }
    if (w !== 'divider') setProps(it, { Text: w[0], Shortcut: false, Icon: true, 'Icon swap': icon(w[1]) });
  });
  overlay(scr, m, 0, 0);
  if (anchor) { const sb = scr.absoluteBoundingBox, ab = anchor.absoluteBoundingBox; m.x = ab.x - sb.x + ab.width - m.width - 16; m.y = ab.y - sb.y + ab.height - 8; }
  return m;
}
const MENU = [['ดูรายละเอียด', 'quick_reference_all-24-300-round'], ['แก้ไข', 'stylus-24-300-round'], ['ลบ', 'delete-24-300-round']];
function comboAt(scr, anchor, items) {   // Dropdown list ใต้ช่องพิมพ์ค้น
  const l = inst('Dropdown list');
  const rows = l.children.filter(n => n.name === 'Dropdown list item');
  rows.forEach((it, i) => {
    if (i >= items.length) { it.visible = false; return; }
    setProps(it, { State: items[i][2] ? 'Selected' : 'Default' });
    setProps(it, { Text: items[i][0], 'Supporting text': items[i][1], Avatar: false, 'Supporting 2': false, Supporting: true });
  });
  const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = false;
  overlay(scr, l, 0, 0);
  if (anchor) { const sb = scr.absoluteBoundingBox, ab = anchor.absoluteBoundingBox; l.resize(ab.width, l.height); l.x = ab.x - sb.x; l.y = ab.y - sb.y + ab.height + 4; }
}

/* ---------- หน้า 1 รายการแผน ---------- */
const PLAN_COLS = [['เลขแผน', 112, 'Lead text', 'Down'], ['ชื่อแผน', 300, 'Text', 'Swap'], ['ศูนย์ต้นทุน', 140, 'Text', 'Swap'], ['งบประมาณ (บาท)', 140],
  ['Purchase Order', 128], ['จำนวนรถที่ Overhaul', 168], ['สถานะ', 136, 'Badge', 'Swap'], ['วันที่สร้าง', 112], ['', 60]];
const planRow = (p) => [p[0], p[1], p[2], p[3], p[4], p[5], { pill: STATUS[p[6]] }, p[7], { menu: 1 }];
async function tableHeader(o) {
  const th = inst('Table header', { Breakpoint: BP() }, { 'Table title': false, Badge: false, 'Supporting text': false, 'More actions': false, Filters: !!(o.chips && o.chips.length) });
  const ti = find(th, 'Text input');
  if (ti) setProps(ti, { Label: false, Helper: false, 'Trailing icon': false, Text: o.query || 'ค้นหาเลขแผน, ชื่อแผน, เลขศูนย์ต้นทุน', State: o.query ? 'Filled' : 'Default' });
  const acts = find(th, 'Actions');
  if (acts) { let first = true; for (const b of acts.children) {
    if (b.name === 'Secondary button' && first) { first = false; setProps(b, { Text: 'ตัวกรอง', 'Leading icon': true, 'Leading icon swap': icon('filter_list-24-400-round') }); const p = find(b, 'Pill outline'); if (p) p.visible = false; }
    else b.visible = false; } }
  th.findAll(n => n.name === 'Badge outline with remove icon').forEach((c, i) => { if (o.chips && i < o.chips.length) setProps(c, { Text: o.chips[i] }); else c.visible = false; });
  return th;
}
async function pagination(n) {
  const pg = inst('Table pagination', { Breakpoint: BP() });
  const tx = find(pg, 'Text'); if (tx && tx.type === 'TEXT') await text(pg, tx, 'แสดง 1 ถึง ' + n + ' จาก ' + n + ' รายการ');
  const items = pg.findAll(x => x.name === 'Button groups pagination item');
  items.forEach((it, i) => { if (i === 0 || i === items.length - 1) setProps(it, { State: 'Disabled' }); else if (i === 1) setProps(it, { Number: '1' }); else it.visible = false; });
  return pg;
}
async function listScreen(name, o) {
  const { scr, page } = await shell(name, { title: 'จัดการงาน Overhaul', primary: 'สร้างแผน Overhaul' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  if (!o.empty) add(sec, await tableHeader(o), 'h');
  if (o.empty) {
    const es = inst('Empty state/Data empty'); add(sec, es, 'h');
    await text(es, 'Text', 'ยังไม่มีแผน Overhaul'); await text(es, 'Supporting text', 'สร้างแผนเพื่อเริ่มเพิ่ม Purchase Order และติดตามงานรายคัน');
    const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false;
    const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'สร้างแผน Overhaul', 'Leading icon swap': icon('add-24-300-round') });
  } else if (o.notFound) {
    const es = inst('Empty state/Search not found'); add(sec, es, 'h');
    await text(es, 'Text', 'ไม่พบแผน Overhaul'); await text(es, 'Supporting text', 'ไม่มีแผนที่ตรงกับคำค้นหรือตัวกรอง');
    const s2 = find(es, 'Secondary button'); if (s2) setProps(s2, { Text: 'ล้างคำค้นและตัวกรอง', 'Leading icon': false });
    const pb = find(es, 'Primary button'); if (pb) pb.visible = false;
  } else {
    const t = col('Table', [tbl(PLAN_COLS, o.rows.map(planRow))], 20); add(sec, t, 'h');
    add(t, await pagination(o.rows.length), 'h');
  }
  return scr;
}
const firstMenuCell = (scr) => scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Table cell' && n.variantProperties && n.variantProperties.Style === 'Action icons')[0];
async function filterPanel(scr) {
  if (MOB) {   // mobile: bottom sheet ตัวกรอง (ตาม Bottom sheet Type=Filter ของไลบรารี)
    const st = col('Section', [], 12);
    const lb = inst('Input label'); add(st, lb, 'h'); await text(lb, 'Label', 'สถานะ'); hide(lb, '(ถ้ามี)'); hide(lb, 'info-24-300-round'); hide(lb, 'Tertiary brand button');
    for (const k of ['P1', 'P2', 'P3']) { const cb = inst('Checkbox with badge'); st.appendChild(cb); const p = find(cb, 'Pill outline'); if (p) setProps(p, { Color: STATUS[k][1], Text: STATUS[k][0] }); }
    const car = dropdown('รถ', 'สงขลา', { state: 'Focused', lead: 'search-24-300-round' });
    await sheet(scr, { title: 'ตัวกรอง', action: 'ล้างตัวกรอง', content: [dropdown('งบประมาณ', 'ทั้งหมด'), st, car, dropdown('ศูนย์ต้นทุน', 'ทั้งหมด')], ok: 'ตกลง' });
    comboAt(scr, car.findOne(n => n.name === 'Container') || car, [['72-6648 สงขลา', 'HINO FG1J · รถกระเช้า']]);
    return;
  }
  overlay(scr, inst('Background overlay'), 0, 0).resize(1440, 1024);
  const panel = frame('Panel', 'VERTICAL', { gap: 24, fill: WHITE });
  overlay(scr, panel, 960, 0); panel.primaryAxisSizingMode = 'FIXED'; panel.counterAxisSizingMode = 'FIXED'; panel.resize(480, 1024);
  const hd = inst('Side panel header'); add(panel, hd, 'h'); hide(hd, 'Tabs');
  await text(hd, 'Text', 'ตัวกรอง'); await text(hd, 'Supporting text', 'กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ');
  const body = frame('Content', 'VERTICAL', { gap: 24, pad: [0, 24] }); add(panel, body, 'both');
  add(body, dropdown('งบประมาณ', 'ทั้งหมด'), 'h');
  const st = col('Section', [], 12); add(body, st, 'h');
  const lb = inst('Input label'); add(st, lb, 'h'); await text(lb, 'Label', 'สถานะ'); hide(lb, '(ถ้ามี)'); hide(lb, 'info-24-300-round'); hide(lb, 'Tertiary brand button');
  for (const k of ['P1', 'P2', 'P3']) { const cb = inst('Checkbox with badge'); st.appendChild(cb); const p = find(cb, 'Pill outline'); if (p) setProps(p, { Color: STATUS[k][1], Text: STATUS[k][0] }); }
  const car = dropdown('รถ', 'สงขลา', { state: 'Focused', lead: 'search-24-300-round' }); add(body, car, 'h');
  add(body, dropdown('ศูนย์ต้นทุน', 'ทั้งหมด'), 'h');
  const ft = inst('Side panel footer'); add(panel, ft, 'h');
  [['Tertiary brand button', 'ล้างตัวกรอง'], ['Secondary button', 'ยกเลิก'], ['Primary button', 'ตกลง']].forEach(([k, t]) => { const b = find(ft, k); if (b) setProps(b, { Text: t, 'Leading icon': false, 'Trailing icon': false }); });
  comboAt(scr, car.findOne(n => n.name === 'Container') || car, [['72-6648 สงขลา', 'HINO FG1J · รถกระเช้า']]);
}

/* ---------- หน้า 2 ฟอร์มแผน ---------- */
/* แถววงเงิน + WBS: desktop วงเงินครึ่งซ้าย + กลุ่ม "WBS" ครึ่งขวา (3 ช่องเท่ากัน) — Figma รับ layoutGrow แค่ 0/1 จึงใช้ซ้อนกลุ่มแทนสัดส่วน 3:1:1:1
   · mobile เรียงลงต่อกันในแถวเดียว */
function wbsRow(budget, w) { return MOB ? row('Row', [budget].concat(w)) : row('Row', [budget, row('WBS', w)]); }
async function planForm(name, o) {
  const edit = !!o.edit, v = o.values || {};
  const { scr, page } = await shell(name, { title: edit ? 'แก้ไขแผน 123456' : 'สร้างแผน Overhaul', back: true, crumbs: [edit ? 'แก้ไขแผน 123456' : 'สร้างแผน Overhaul'] });
  const E = (k, m) => o.errors ? m : '';
  add(page, col('Content', [
    // วงเงินอนุมัติ + WBS 3 ช่อง แถวเดียว (เจ้าของงานส่งตัวอย่าง 19 ต.ค. 2569): วงเงินครึ่งซ้าย · WBS/โครงข่าย/กิจกรรม แบ่งครึ่งขวา
    col('Section', [await section('ข้อมูลแผน'), row('Row', [field('ชื่อแผน', v.name, { placeholder: 'เช่น Overhaul ประจำปีงบ 2570 — รถเครน', error: E('n', 'กรุณาระบุชื่อแผน') }),
      dropdown('ประจำปีงบประมาณ', v.year || '2569')]), wbsRow(field('วงเงินอนุมัติ (บาท)', v.budget, { placeholder: '0', error: E('b', 'กรุณาระบุวงเงินอนุมัติ (บาท)') }), [
      field('เลข WBS', v.wbs, { placeholder: 'เช่น C-70-OH-0003', error: E('w', 'กรุณาระบุเลข WBS') }),
      field('เลขโครงข่าย', v.net, { placeholder: 'เช่น 60002103', error: E('n', 'กรุณาระบุเลขโครงข่าย') }), field('เลขกิจกรรม', v.act, { placeholder: 'เช่น 0010', error: E('a', 'กรุณาระบุเลขกิจกรรม') })])], 16),
    // กล่องอัปโหลด 1 คอลัมน์ (เจ้าของงานเคาะ 19 ต.ค. 2569)
    col('Section', [await section('เอกสาร'), await upload('หนังสืออนุมัติหลักการ', v.approve || [], { error: E('', 'กรุณาแนบหนังสืออนุมัติหลักการ') }),
      await upload('เอกสารอนุมัติงบ', v.budgetDoc || [], { error: E('', 'กรุณาแนบเอกสารอนุมัติงบ') }),
      await upload('อื่นๆ', v.other || [], { optional: true })], 16),
    btnRow(edit ? [['Secondary button', 'ยกเลิก', { size: 'lg' }], ['Primary button', 'บันทึก', { size: 'lg' }]] : [['Primary button', 'บันทึก', { size: 'lg' }]]),
  ], 32), 'h');
  return scr;
}
const FILLED = { name: 'Overhaul ประจำปีงบ 2570 — รถเจาะหลุม', year: '2569', budget: '5,500,000', wbs: 'C-70-OH-0003', net: '60002103', act: '0010',
  approve: [{ name: 'อนุมัติหลักการ.pdf', size: '293 KB' }], budgetDoc: [{ name: 'อนุมัติงบ.jpg', size: '117 KB' }, { name: 'สรุป.docx', err: 1 }], other: [] };
const EDIT = { name: 'Overhaul ประจำปีงบ 2569 — รถเครน', year: '2569', budget: '10,000,000', wbs: 'C-69-OH-0101', net: '60001234', act: '0010',
  approve: [{ name: 'หนังสืออนุมัติหลักการ-123456.pdf', size: '822 KB' }], budgetDoc: [{ name: 'เอกสารอนุมัติงบ-123456.pdf', size: '601 KB' }], other: [] };

/* ---------- หน้า 3 รายละเอียดแผน ---------- */
async function planDetail(name, o) {
  o = o || {};
  const p = o.plan || PLANS[4];
  const { scr, page } = await shell(name, { title: 'หมายเลขแผน ' + p[0], back: true, crumbs: ['แผน ' + p[0]], badge: STATUS[o.status || p[6]],
    actions: [['Secondary danger button', 'ลบแผน', 'delete-24-300-round'], ['Secondary button', 'แก้ไข', 'stylus-24-300-round']] });
  const pos = o.pos || POS;
  const sections = [
    col('Section', [await section('รายละเอียดแผน'), kv([['ชื่อแผน', p[1]], ['ประจำปีงบประมาณ', '25' + p[2].slice(2, 4)], ['วงเงินอนุมัติ (บาท)', p[3]], ['จำนวนรถที่ Overhaul', p[5] + ' คัน'],
      ['วันที่สร้าง', p[7]], ['เลข WBS (ศูนย์ต้นทุน)', p[2]], ['เลขโครงข่าย', '60001234'], ['เลขกิจกรรม', '0010']])], 16),
    col('Section', [await section('เอกสาร'), row('Row', [await upload('หนังสืออนุมัติหลักการ', [{ name: 'หนังสืออนุมัติหลักการ-' + p[0] + '.pdf', size: '822 KB' }], { readonly: true }),
      await upload('เอกสารอนุมัติงบ', [{ name: 'เอกสารอนุมัติงบ-' + p[0] + '.pdf', size: '601 KB' }], { readonly: true })])], 16),
  ];
  const poSec = col('Section', [await section('Purchase Order', { badge: pos.length, buttons: [{ kind: 'Primary button', text: 'PO', icon: 'add-24-300-round' }] })], 16);
  if (pos.length) add(poSec, tbl([['หมายเลข PO', 180, 'Lead text'], ['ชื่อ PO', 0], ['ศูนย์บริการ/อู่', 400], ['จำนวนรถ', 140], ['', 60]], pos.map(r => [r[0], r[1], r[2], r[3], { menu: 1 }])), 'h');
  else { const es = inst('Empty state/Data empty'); add(poSec, es, 'h'); await text(es, 'Text', 'ยังไม่มี Purchase Order'); await text(es, 'Supporting text', 'เพิ่ม PO เพื่อเลือกรถที่จะเข้า Overhaul และเริ่มงานรายคัน');
    const a = find(es, 'Actions'); if (a) a.visible = false; }
  sections.push(poSec);
  const partSec = col('Section', [await section('อะไหล่จากคลัง', { buttons: [{ kind: 'Secondary button', text: 'เบิก', icon: 'add-24-300-round' }] })], 16);
  const es2 = inst('Empty state/Data empty'); add(partSec, es2, 'h'); await text(es2, 'Text', 'ยังไม่มีรายการเบิกอะไหล่'); await text(es2, 'Supporting text', 'ส่วนนี้จองไว้ตาม userflow — ขั้นตอนเบิกอะไหล่ยังไม่ได้ออกแบบ');
  const a2 = find(es2, 'Actions'); if (a2) a2.visible = false;
  sections.push(partSec);
  add(page, col('Content', sections, 32), 'h');
  return scr;
}

/* ---------- หน้า 4 ฟอร์ม PO ---------- */
async function poForm(name, o) {
  o = o || {};
  const edit = !!o.edit;
  const { scr, page } = await shell(name, { title: edit ? 'แก้ไข PO-690101' : 'เพิ่ม Purchase Order', back: true, crumbs: ['แผน ' + (edit ? '123456' : '123458'), edit ? 'แก้ไข PO-690101' : 'เพิ่ม Purchase Order'] });
  const sel = o.sel || [];
  const left = ALL_CARS.filter((_, i) => sel.indexOf(i) < 0), right = ALL_CARS.filter((_, i) => sel.indexOf(i) >= 0);
  const vendorF = dropdown('ศูนย์บริการ/อู่', o.vendor || '', { placeholder: 'ค้นหาชื่อศูนย์บริการ/อู่', lead: 'search-24-300-round', state: o.vendorOpen ? 'Focused' : undefined, error: o.errors ? 'กรุณาเลือกศูนย์บริการ/อู่' : '' });
  const mid = MOB ? row('Actions', [btn('Secondary button', 'เพิ่ม', { disabled: !(o.tick && o.tick.length) }), btn('Secondary button', 'นำออก', { disabled: true })], { gap: 12, keep: true })
    : col('Actions', [btn('Secondary button', 'เพิ่ม', { disabled: !(o.tick && o.tick.length) }), btn('Secondary button', 'นำออก', { disabled: true })], 12);
  mid.layoutGrow = 0;
  const shown = o.query ? left.filter(c => c[1].indexOf(o.query) >= 0 || c[0].indexOf(o.query) >= 0) : left;   // จอ "ค้นแล้วติ๊ก" กรองตามคำค้น
  const L = await listCheck('รายการรถทั้งหมด', shown, o.tick || []), R = await listCheck('เลือกแล้ว', right, []);
  const dual = row('Dual list', [L, mid, R], { gap: 16 }); mid.layoutGrow = 0; if (!MOB) mid.primaryAxisAlignItems = 'CENTER';
  add(page, col('Content', [
    col('Section', [await section('รายละเอียด Purchase Order'), row('Row', [field('ชื่อ Purchase Order', o.name, { placeholder: 'เช่น ซ่อมระบบแอร์', error: o.errors ? 'กรุณาระบุชื่อ Purchase Order' : '' }), vendorF])], 16),
    col('Section', [await section('เลือกรถ'), row('Row', [field('ค้นหารถ', o.query, { placeholder: 'ค้นหาทะเบียน, รุ่น/ยี่ห้อ', lead: 1 }), frame('Spacer', 'VERTICAL')]), dual], 16),
    col('Section', [await section('เอกสาร'), await upload('ใบสั่งจ้าง', o.order || [], { error: o.errors ? 'กรุณาแนบใบสั่งจ้าง' : '' }), await upload('อื่นๆ', [], { optional: true })], 16),
    btnRow(edit ? [['Secondary button', 'ยกเลิก', { size: 'lg' }], ['Primary button', 'บันทึก', { size: 'lg' }]] : [['Primary button', 'บันทึก', { size: 'lg' }]]),
  ], 32), 'h');
  if (o.vendorOpen) comboAt(scr, vendorF.findOne(n => n.name === 'Container') || vendorF, [['บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', '02-111-2202 · เขตพระนคร กรุงเทพฯ']]);
  return scr;
}

/* ---------- หน้า 5 รายละเอียด PO ---------- */
async function poDetail(name) {
  const { scr, page } = await shell(name, { title: 'หมายเลข PO-690101', back: true, crumbs: ['แผน 123456', 'PO-690101'],
    actions: [['Secondary danger button', 'ลบ PO', 'delete-24-300-round'], ['Secondary button', 'แก้ไข', 'stylus-24-300-round']] });
  add(page, col('Content', [
    col('Section', [await section('รายละเอียด Purchase Order'), kv([['ชื่อแผน', PLANS[4][1]], ['ชื่อ Purchase Order', 'ซ่อมระบบเครื่องยนต์'], ['ศูนย์บริการ/อู่', 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด'], ['เบอร์โทรอู่', '02-111-2201'], ['ที่อยู่', 'เขตบางนา กรุงเทพฯ']])], 16),
    col('Section', [await section('เอกสาร'), row('Row', [await upload('ใบสั่งจ้าง', [{ name: 'ใบสั่งจ้าง-PO-690101.pdf', size: '500 KB' }], { readonly: true }), frame('Spacer', 'VERTICAL')])], 16),
    col('Section', [await section('รายการรถ', { badge: CARS.length }), tbl([['ทะเบียน', 180, 'Lead text'], ['ยี่ห้อ/รุ่น · ประเภท', 0], ['เลขไมล์ (กม.)', 150], ['อายุการใช้งาน', 150], ['สถานะงาน', 260, 'Badge'], ['', 120]],
      CARS.map(c => [c[0], c[1], c[2], c[3] + ' ปี', { pill: JOB[c[4]] }, { icons: ['keyboard_arrow_right-20-400-round'] }]))], 16),
  ], 32), 'h');
  return scr;
}

/* ---------- หน้า 6 หน้างานรายคัน ---------- */
async function job(name, stage, build) {
  const n = +stage.slice(1), cur = { V1: 1, V2: 1, V3: 1, V4: 2, V5: 3, V6: 4, V7: 5, V8: 5, V9: 5, V10: 6, V11: 6 }[stage];
  const { scr, page } = await shell(name, { title: '72-6648 สงขลา', back: true, crumbs: ['แผน 123460', 'PO-700201', '72-6648 สงขลา'], badge: JOB[stage] });
  const content = col('Content', [
    col('Section', [await section('ข้อมูลยานพาหนะ'), kv([['ทะเบียน', '72-6648 สงขลา'], ['ยี่ห้อ/รุ่น', 'HINO FG1J'], ['ประเภท', 'รถกระเช้า'], ['อายุการใช้งาน', '16 ปี'],
      ['เลขไมล์สะสม', '221,300 กม.'], ['ชั่วโมงสะสม', '13,300 ชม.'], ['Purchase Order', 'PO-700201 · ซ่อมช่วงล่างและระบบเบรก'], ['ศูนย์บริการ/อู่', VENDOR[0]]])], 16),
    stepper(cur, n === 11),
  ], 32);
  add(page, content, 'h');
  for (const node of await build()) if (node) add(content, node, 'h');
  return scr;
}
const apptKv = (ret, d1, d2) => kv([[ret ? 'ช่วงวันนัดรับรถ' : 'ช่วงวันนำรถเข้า', d1 + ' – ' + d2], ['ผู้ประสานงาน (กบค.)', 'นายวิชัย ทองดี'], ['เบอร์โทรผู้ประสานงาน (กบค.)', '02-590-9123'],
  ['ชื่ออู่', VENDOR[0]], ['เบอร์อู่', VENDOR[1]], ['ที่อยู่', VENDOR[2]], ['หมายเหตุ', '—']], 3);
async function apptForm(ret, o) {
  o = o || {};
  const coord = dropdown('ผู้ประสานงาน (กบค.)', o.coord ? 'นายวิชัย ทองดี' : '', { placeholder: 'ค้นหาชื่อผู้ประสานงาน', lead: 'search-24-300-round', state: o.open ? 'Focused' : undefined, error: o.errors ? 'กรุณาเลือกผู้ประสานงาน' : '' });
  const nodes = [col('Section', [await section(ret ? 'นัดหมายรับรถ' : 'นัดหมายนำรถเข้าอู่'),
    row('Row', [field(ret ? 'นัดรับรถตั้งแต่วันที่' : 'นำรถเข้าตั้งแต่วันที่', o.d1, { placeholder: 'วว/ดด/ปปปป', error: o.errors ? 'กรุณาเลือกวันที่เริ่ม' : '' }),
      field('ถึงวันที่', o.d2, { placeholder: 'วว/ดด/ปปปป', error: o.errors ? 'กรุณาเลือกวันที่สิ้นสุด' : '' }), frame('Spacer', 'VERTICAL')]),
    row('Row', [coord, field('เบอร์โทรผู้ประสานงาน (กบค.)', o.coord ? '02-590-9123' : '', { state: 'Readonly', placeholder: 'แสดงเมื่อเลือกผู้ประสานงาน' }), frame('Spacer', 'VERTICAL')]),
    row('Row', [field('ชื่ออู่' + (ret ? ' (ค่าตั้งต้นจาก PO)' : ''), VENDOR[0], { state: 'Readonly' }), field('เบอร์อู่', VENDOR[1], { state: 'Readonly' }), field('ที่อยู่', VENDOR[2], { state: 'Readonly' })]),
    area('หมายเหตุ', '', { optional: true, placeholder: 'ระบุหมายเหตุ' })], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันนัดหมาย', { size: 'lg' }]])];
  nodes._coord = coord;
  return nodes;
}
async function apptWait(ret, d1, d2) {
  return [col('Section', [await section(ret ? 'นัดหมายรับรถ' : 'นัดหมายนำรถเข้าอู่'),
    alertBox('Info', 'รอหน่วยงานเจ้าของรถตอบกลับ', 'ส่งนัดหมายแล้ว 19/10/2569 · แก้ไขนัดหมายได้จนกว่าหน่วยงานจะตอบรับ'), apptKv(ret, d1, d2)], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Secondary button', 'แก้ไขนัดหมาย', { size: 'lg' }]])];
}
async function apptRejected(ret, d1, d2) {
  return [col('Section', [await section(ret ? 'นัดหมายรับรถ' : 'นัดหมายนำรถเข้าอู่'),
    alertBox('Warning', 'หน่วยงานปฏิเสธนัดหมาย', 'หมายเหตุ: รถติดภารกิจซ่อมบำรุงสายส่ง ขอเลื่อนเป็นสัปดาห์ถัดไป'), apptKv(ret, d1, d2)], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Secondary button', 'แก้ไขนัดหมาย', { size: 'lg' }]])];
}
async function checkin(done) {
  const sign = async (who, name) => {
    const box = col('Sign', [dropdown(who, done ? name : '', { placeholder: 'เลือกผู้ลงนาม' })], 12);
    add(box, done ? row('Signed', [pill('ลงนามแล้ว 19/10/2569', 'Success')], { hug: true }) : row('Sign', [btn('Secondary button', 'เซ็น')], { hug: true }), 'h');
    return box;
  };
  return [col('Section', [await section('รายการตรวจสอบก่อนซ่อม'), tbl([['รายการตรวจสอบ', 0], ['หมายเหตุ', 420]], CHECKLIST.map(c => [{ check: !!done, text: c }, '—']))], 16),
    col('Section', [await section('ลงนามรับรถ'), row('Row', [await sign('กบค.', 'นายวิชัย ทองดี'), await sign('หน่วยงานเจ้าของรถ', 'นายประวิทย์ แสงทอง')])], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันรับรถ', { size: 'lg' }]])];
}
const LOGS = [['20/10/2569 09:30 น.', 'รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน'], ['05/11/2569 14:00 น.', 'เปลี่ยนชุดลูกสูบและแหวน ประกอบกลับ']];
async function logs(list) {
  const sec = col('Section', [await section('รายละเอียดการติดตาม', { buttons: [{ kind: 'Secondary button', text: 'ความคืบหน้า', icon: 'add-24-300-round' }] })], 16);
  if (list.length) add(sec, tbl([['วันที่/เวลา', 220], ['รายละเอียด', 0], ['', 104]], list.map(l => [l[0], l[1], { icons: list.length > 1 ? ['stylus-24-300-round', 'delete-24-300-round'] : ['stylus-24-300-round'] }])), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ยังไม่มีความคืบหน้า'); await text(es, 'Supporting text', 'เพิ่มความคืบหน้าอย่างน้อย 1 รายการก่อนกด "ซ่อมสำเร็จ"'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  return [sec, btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ซ่อมสำเร็จ', { size: 'lg', disabled: !list.length }]])];
}
async function safety(files) {
  return [col('Section', [await section('เอกสาร Safety Inspection'), await upload('อัปโหลดเอกสาร Safety Inspection', files)], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันการตรวจสอบ', { size: 'lg' }]])];
}
const PARTS = [['ชุดลูกสูบพร้อมแหวน', '6', 'ชุด'], ['กรองน้ำมันเครื่อง', '2', 'ชิ้น'], ['น้ำมันเครื่อง 15W-40', '18', 'ลิตร']];
async function closeJob(parts, closed) {
  const sec = col('Section', [await section('รายการอะไหล่ที่ใช้', { buttons: closed ? [] : [{ kind: 'Secondary button', text: 'นำเข้าไฟล์', icon: 'cloud_upload-24-300-round' }] })], 16);
  if (!closed) add(sec, row('Row', [field('ชื่ออะไหล่', '', { placeholder: 'เช่น ชุดลูกสูบพร้อมแหวน' }), field('จำนวน', '1'), dropdown('หน่วย', 'ชิ้น')]), 'h');
  if (parts.length) add(sec, tbl([['ชื่ออะไหล่', 0], ['จำนวน', 160], ['หน่วย', 160]].concat(closed ? [] : [['', 72]]), parts.map(p => closed ? p : p.concat([{ icons: ['delete-24-300-round'] }]))), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ยังไม่ได้ระบุอะไหล่ที่ใช้'); await text(es, 'Supporting text', 'เพิ่มทีละรายการหรือนำเข้าไฟล์ — ต้องมีอย่างน้อย 1 รายการจึงปิดงานได้'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  return [sec, closed ? alertBox('Success', 'ปิดงานแล้ว 19/10/2569', 'รถคันนี้จบรอบ Overhaul') : btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ปิดงาน', { size: 'lg' }]])];
}

/* ---------- รายการจอแยกตาม scenario (ชื่อ section = ชื่อ scenario ใน userflow) ---------- */
const D = (a, b) => [a, b];
const SCENARIOS = [
  ['หน้ารายการแผน — ค้นหา · ตัวกรอง · ค้นไม่เจอ · ยังไม่มีแผน', [
    ['รายการแผน', () => listScreen('รายการแผน', { rows: PLANS })],
    ['ตัวกรอง', async () => { const s = await listScreen('ตัวกรอง', { rows: PLANS }); await filterPanel(s); return s; }],
    ['ผลกรองด้วยรถ', () => listScreen('ผลกรองด้วยรถ', { rows: [PLANS[0], PLANS[3]], chips: ['72-6648 สงขลา'] })],
    ['ค้นไม่เจอ', () => listScreen('ค้นไม่เจอ', { notFound: true, query: 'ไม่มีแผนนี้' })],
    ['ยังไม่มีแผน', () => listScreen('ยังไม่มีแผน', { empty: true })]]],
  ['S1 · กบค. สร้างแผน Overhaul', [
    ['ฟอร์มสร้างแผน (ว่าง)', () => planForm('S1 ฟอร์มสร้างแผน (ว่าง)', {})],
    ['กดบันทึกโดยยังไม่ครบ', () => planForm('S1 กดบันทึกโดยยังไม่ครบ', { errors: true })],
    ['กรอกครบ', () => planForm('S1 กรอกครบ', { values: FILLED })],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await planForm('S1 ยืนยันการออก', { values: FILLED }); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก', cancel: 'ปิด' }); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S1 บันทึกไม่สำเร็จ', { values: FILLED }); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ', async () => { const s = await listScreen('S1 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(PLANS) }); notify(s, 'การสร้างแผน overhaul สำเร็จ'); return s; }],
    ['ดูรายละเอียดแผน', () => planDetail('S1 รายละเอียดแผน', { plan: NEW_PLAN, pos: [] })]]],
  ['S2 · กบค. แก้ไขแผน', [
    ['เมนู "…" → แก้ไข', async () => { const s = await listScreen('S2 เมนู', { rows: PLANS }); menuAt(s, firstMenuCell(s), MENU); return s; }],
    ['ฟอร์มแก้ไข (เติมค่าเดิม)', () => planForm('S2 ฟอร์มแก้ไข', { edit: true, values: EDIT })],
    ['ยืนยันการแก้ไขแผน', async () => { const s = await planForm('S2 ยืนยันการแก้ไข', { edit: true, values: Object.assign({}, EDIT, { budget: '11,000,000' }) });
      await confirm(s, { title: 'ยืนยันการแก้ไขแผน', sub: 'บันทึกการเปลี่ยนแปลงของแผน 123456 "Overhaul ประจำปีงบ 2569 — รถเครน"' }); return s; }],
    ['บันทึกสำเร็จ', async () => { const s = await planDetail('S2 บันทึกสำเร็จ'); notify(s, 'บันทึกการแก้ไขแผนสำเร็จ'); return s; }]]],
  ['S3 · กบค. ลบแผน', [
    ['เมนู "…" → ลบ', async () => { const s = await listScreen('S3 เมนู', { rows: PLANS }); menuAt(s, firstMenuCell(s), MENU); return s; }],
    ['ยืนยันการลบแผน', async () => { const s = await listScreen('S3 ยืนยันการลบ', { rows: PLANS }); await confirm(s, { danger: true, title: 'ยืนยันการลบแผน',
      sub: 'แผน 123460 "Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้" และ Purchase Order 1 ใบในแผนนี้จะถูกลบ' }); return s; }],
    ['ลบสำเร็จ', async () => { const s = await listScreen('S3 ลบสำเร็จ', { rows: PLANS.slice(1) }); notify(s, 'ลบแผน overhaul สำเร็จ'); return s; }]]],
  ['S4 · กบค. สร้าง Purchase order', [
    ['รายละเอียดแผน (ยังไม่มี PO)', () => planDetail('S4 แผนยังไม่มี PO', { plan: PLANS[2], pos: [] })],
    ['ฟอร์ม PO (ว่าง)', () => poForm('S4 ฟอร์ม PO (ว่าง)', {})],
    ['กดบันทึกโดยยังไม่ครบ', () => poForm('S4 ยังไม่ครบ', { errors: true })],
    ['เลือกอู่ (พิมพ์ค้น)', () => poForm('S4 เลือกอู่', { name: 'ซ่อมระบบเครื่องยนต์และเจาะหลุม', vendor: 'ตรีเพชร', vendorOpen: true })],
    ['ติ๊กรถแล้วกดเพิ่ม', () => poForm('S4 เลือกรถ', { name: 'ซ่อมระบบเครื่องยนต์และเจาะหลุม', vendor: 'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', query: 'เจาะหลุม', tick: [0, 1] })],
    ['กรอกครบ', () => poForm('S4 กรอกครบ', { name: 'ซ่อมระบบเครื่องยนต์และเจาะหลุม', vendor: 'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', sel: [3, 6], order: [{ name: 'ใบสั่งจ้าง.pdf', size: '195 KB' }] })],
    ['บันทึกสำเร็จ', async () => { const s = await planDetail('S4 บันทึกสำเร็จ', { plan: PLANS[2], status: 'P2', pos: [['PO-700202', 'ซ่อมระบบเครื่องยนต์และเจาะหลุม', 'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', '2']] });
      notify(s, 'การสร้าง purchase order สำเร็จ'); return s; }],
    ['รายละเอียด PO', () => poDetail('S4 รายละเอียด PO')]]],
  ['S5 · กบค. แก้ไข Purchase order', [
    ['เมนู "…" ของ PO → แก้ไข', async () => { const s = await planDetail('S5 เมนู PO'); menuAt(s, firstMenuCell(s), MENU); return s; }],
    ['ฟอร์มแก้ไข PO', () => poForm('S5 ฟอร์มแก้ไข PO', { edit: true, name: 'ซ่อมระบบเครื่องยนต์', vendor: 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด', sel: [0, 2], order: [{ name: 'ใบสั่งจ้าง-PO-690101.pdf', size: '500 KB' }] })],
    ['ยืนยันการแก้ไข PO', async () => { const s = await poForm('S5 ยืนยันการแก้ไข PO', { edit: true, name: 'ซ่อมระบบเครื่องยนต์และเกียร์', vendor: 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด', sel: [0, 2], order: [{ name: 'ใบสั่งจ้าง-PO-690101.pdf', size: '500 KB' }] });
      await confirm(s, { title: 'ยืนยันการแก้ไข PO', sub: 'บันทึกการเปลี่ยนแปลงของ PO-690101 "ซ่อมระบบเครื่องยนต์และเกียร์"' }); return s; }],
    ['บันทึกสำเร็จ', async () => { const s = await poDetail('S5 บันทึกสำเร็จ'); notify(s, 'บันทึกการแก้ไข PO สำเร็จ'); return s; }]]],
  ['S6 · กบค. ลบ purchase order', [
    ['ยืนยันการลบ PO', async () => { const s = await planDetail('S6 ยืนยันการลบ PO'); await confirm(s, { danger: true, title: 'ยืนยันการลบ PO', sub: 'PO-690101 "ซ่อมระบบเครื่องยนต์" และงานของรถ 2 คันใน PO นี้จะถูกลบ' }); return s; }],
    ['ลบสำเร็จ', async () => { const s = await planDetail('S6 ลบสำเร็จ', { pos: POS.slice(1) }); notify(s, 'ลบ purchase order สำเร็จ'); return s; }]]],
  ['S7 · กบค. นัดหมายหน่วยงาน นำรถเข้า overhaul', [
    ['ฟอร์มนัด (ว่าง)', () => job('S7 ฟอร์มนัด', 'V1', () => apptForm(false))],
    ['กดยืนยันโดยยังไม่ครบ', () => job('S7 ยังไม่ครบ', 'V1', () => apptForm(false, { errors: true }))],
    ['เลือกผู้ประสานงาน', async () => { let c; const s = await job('S7 เลือกผู้ประสานงาน', 'V1', async () => { const n = await apptForm(false, { d1: '22/10/2569', d2: '24/10/2569', open: true }); c = n._coord; return n; });
      comboAt(s, c.findOne(x => x.name === 'Container') || c, [['นายวิชัย ทองดี', 'วิศวกร กบค. · 02-590-9123'], ['นางสาวกนกวรรณ ใจมั่น', 'พนักงานช่าง กบค. · 02-590-9124']]); return s; }],
    ['สร้างนัดไม่สำเร็จ', async () => { const s = await job('S7 ไม่สำเร็จ', 'V1', () => apptForm(false, { d1: '22/10/2569', d2: '24/10/2569', coord: 1 })); notify(s, 'ไม่สามารถสร้าง นัดหมาย', true); return s; }],
    ['รอหน่วยงานตอบรับ', async () => { const s = await job('S7 รอตอบรับ', 'V2', () => apptWait(false, '22/10/2569', '24/10/2569')); notify(s, 'การสร้าง นัดหมาย สำเร็จ'); return s; }],
    ['หน่วยงานปฏิเสธ', () => job('S7 ปฏิเสธ', 'V3', () => apptRejected(false, '22/10/2569', '24/10/2569'))],
    ['แก้ไขนัดหมาย', () => job('S7 แก้ไขนัด', 'V3', () => apptForm(false, { d1: '29/10/2569', d2: '31/10/2569', coord: 1 }))]]],
  ['S8 · กบค. ตรวจรับรถก่อน Overhaul', [
    ['รายการตรวจสอบ', () => job('S8 รายการตรวจสอบ', 'V4', () => checkin(false))],
    ['ตรวจครบ + ลงนาม 2 ฝ่าย', () => job('S8 ลงนามแล้ว', 'V4', () => checkin(true))]]],
  ['S9 · กบค. เพิ่มการติดตามผลการดำเนินการ overhaul', [
    ['ยังไม่มีความคืบหน้า', () => job('S9 ว่าง', 'V5', () => logs([]))],
    ['เพิ่มความคืบหน้า', async () => { const s = await job('S9 เพิ่ม', 'V5', () => logs([])); await formModal(s, { title: 'เพิ่มความคืบหน้า', fields: [{ label: 'วันที่/เวลา', value: '20/10/2569 09:30' }, { label: 'รายละเอียด', value: 'รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน', area: 1 }] }); return s; }],
    ['มีความคืบหน้า 2 รายการ', () => job('S9 มีรายการ', 'V5', () => logs(LOGS))]]],
  ['S10 · กบค. แก้ไข การติดตามผลการดำเนินการ overhaul', [
    ['แก้ไขความคืบหน้า', async () => { const s = await job('S10 แก้ไข', 'V5', () => logs(LOGS)); await formModal(s, { title: 'แก้ไขความคืบหน้า', fields: [{ label: 'วันที่/เวลา', value: LOGS[0][0].replace(' น.', '') }, { label: 'รายละเอียด', value: LOGS[0][1], area: 1 }] }); return s; }]]],
  ['S11 · กบค. ลบ การติดตามผลการดำเนินการ overhaul', [
    ['ยืนยันการลบความคืบหน้า', async () => { const s = await job('S11 ยืนยันลบ', 'V5', () => logs(LOGS)); await confirm(s, { danger: true, title: 'ยืนยันการลบความคืบหน้า', sub: 'ความคืบหน้า 05/11/2569 14:00 น. จะถูกลบ' }); return s; }],
    ['เหลือ 1 รายการ (ลบไม่ได้แล้ว)', () => job('S11 เหลือ 1', 'V5', () => logs(LOGS.slice(0, 1)))]]],
  ['S12 · กบค. upload เอกสารด้านความปลอดภัย', [
    ['ยังไม่มีเอกสาร', () => job('S12 ว่าง', 'V6', () => safety([]))],
    ['อัปโหลดแล้ว', () => job('S12 อัปโหลดแล้ว', 'V6', () => safety([{ name: 'Safety-Inspection.pdf', size: '293 KB' }]))]]],
  ['S13 · กบค. นัดหมายหน่วยงานส่งคืนรถ', [
    ['ฟอร์มนัดรับรถ (ค่าอู่ตั้งต้น)', () => job('S13 ฟอร์มนัดรับ', 'V7', () => apptForm(true))],
    ['รอหน่วยงานตอบรับ', () => job('S13 รอตอบรับ', 'V8', () => apptWait(true, '08/11/2569', '09/11/2569'))],
    ['หน่วยงานปฏิเสธ', () => job('S13 ปฏิเสธ', 'V9', () => apptRejected(true, '08/11/2569', '09/11/2569'))]]],
  ['S14 · กบค. ปิดงาน', [
    ['ยังไม่ได้ระบุอะไหล่', () => job('S14 ว่าง', 'V10', () => closeJob([]))],
    ['ระบุอะไหล่แล้ว', () => job('S14 มีอะไหล่', 'V10', () => closeJob(PARTS))],
    ['ปิดงานแล้ว', async () => { const s = await job('S14 ปิดงานแล้ว', 'V11', () => closeJob(PARTS, true)); notify(s, 'ปิดงานสำเร็จ'); return s; }]]],
];

/* ปิดเส้นคั่นทุกจุดในจอ (เจ้าของงานสั่ง 19 ต.ค. 2569 "disable divider ออกให้หมด")
   1) component ที่มี property Divider (BOOLEAN) → false  2) เส้นคั่นที่ฝังในชิ้นอื่น (layer "Divider" / "Content divider") → ซ่อน
   3) รายการเมนูแบบ Divider=True → ซ่อน — ยังเป็น instance เดิม แค่ปิดส่วนนั้น */
function stripDividers(root) {
  let n = 0;
  const all = [root].concat(root.findAll(() => true));
  for (const node of all) {
    if (node.type === 'INSTANCE') {
      const cp = node.componentProperties || {};
      const key = Object.keys(cp).find(k => k.split('#')[0] === 'Divider');
      if (key && cp[key].type === 'BOOLEAN' && cp[key].value !== false) { try { node.setProperties({ [key]: false }); n++; } catch (e) { warn('ปิด Divider ' + node.name, e); } }
      if (key && cp[key].type === 'VARIANT' && cp[key].value === 'True') { node.visible = false; n++; }
    }
    if ((node.name === 'Divider' || node.name === 'Content divider') && node.visible !== false && node !== root) { node.visible = false; n++; }
  }
  return n;
}

/* แก้เฉพาะจุด: ย้ายช่อง WBS 3 ช่องมาแถวเดียวกับวงเงินอนุมัติ (19 ต.ค. 2569) — ย้าย instance เดิม ไม่สร้างใหม่ ⇒ ที่แก้มือในช่องไม่หาย */
const labelOf = (n) => { try { const cp = n.componentProperties || {}; const k = Object.keys(cp).find(x => x.split('#')[0] === 'Label text'); return k ? cp[k].value : ''; } catch (e) { return ''; } };
async function patchWbs() {
  const sel = figma.currentPage.selection.filter(n => n.type === 'FRAME');
  const targets = sel.length ? sel : figma.currentPage.children.filter(n => n.type === 'FRAME' && n.name.indexOf('OH2') === 0);
  let done = 0, skip = 0;
  for (const f of targets) {
    const fields = f.findAll(n => n.type === 'INSTANCE' && n.name === 'Text input');
    const by = (t) => fields.find(n => labelOf(n) === t);
    const budget = by('วงเงินอนุมัติ (บาท)'), w = [by('เลข WBS'), by('เลขโครงข่าย'), by('เลขกิจกรรม')];
    if (!budget || w.some(x => !x)) continue;
    const mobile = f.width <= 500;
    if (mobile ? w[0].parent === budget.parent : (w[0].parent.name === 'WBS' && w[0].parent.parent === budget.parent)) { skip++; continue; }   // แก้ไปแล้ว
    const oldSec = w[0].parent && w[0].parent.parent;          // Section "งบโครงการตาม WBS"
    let r;
    if (mobile) {                                               // mobile: ช่องเรียงลงอยู่แล้ว — ต่อท้ายวงเงิน
      r = budget.parent;
      const at = r.children.indexOf(budget) + 1;
      w.forEach((x, i) => { r.insertChild(at + i, x); x.layoutGrow = 0; x.layoutSizingHorizontal = 'FILL'; });
    } else {
      // แถวเดิมมีช่องอื่นด้วย (ชื่อแผน · ปีงบ) → แยกวงเงินออกมาแถวใหม่ · ถ้ารอบก่อนหยุดกลางทางจนแถวเหลือวงเงินตัวเดียว ใช้แถวนั้นต่อ
      r = budget.parent;
      if (r.children.length > 1) {
        const sec = r.parent;
        const nr = frame('Row', 'HORIZONTAL', { gap: 24 }); nr.counterAxisAlignItems = 'MIN';
        sec.insertChild(sec.children.indexOf(r) + 1, nr); nr.layoutSizingHorizontal = 'FILL';
        nr.appendChild(budget); r = nr;
      }
      budget.layoutGrow = 1;
      const g = frame('WBS', 'HORIZONTAL', { gap: 24 }); g.counterAxisAlignItems = 'MIN';
      r.appendChild(g); g.layoutGrow = 1;
      w.forEach(x => { g.appendChild(x); x.layoutGrow = 1; });
    }
    if (oldSec && oldSec.type === 'FRAME' && oldSec.name === 'Section' && !oldSec.findAll(n => n.type === 'INSTANCE' && n.name === 'Text input').length) oldSec.remove();
    done++;
  }
  log('ย้ายช่อง WBS มาแถวเดียวกับวงเงินอนุมัติ ' + done + ' จอ' + (skip ? ' · แก้ไปแล้ว ' + skip + ' จอ' : '') + ' · ไม่ได้สร้างจอใหม่');
}

/* แก้เฉพาะส่วน — ไม่สร้างจอใหม่ (เจ้าของงานถาม 19 ต.ค. 2569 "export แค่ส่วนที่แก้ได้ไหม")
   ไล่เฟรมที่เลือกไว้ (ถ้ามี) หรือทุกเฟรม "OH2 /" ในหน้าปัจจุบัน แล้วปิดเส้นคั่น — ที่แก้มือไว้ในจออื่นไม่หาย */
async function patchDividers() {
  const sel = figma.currentPage.selection.filter(n => n.type === 'FRAME' || n.type === 'INSTANCE' || n.type === 'SECTION');
  const targets = sel.length ? sel : figma.currentPage.children.filter(n => n.name.indexOf('OH2') === 0);
  if (!targets.length) { log('ไม่พบเฟรม "OH2 /" ในหน้านี้ — เปิดหน้า overhaul-1 ก่อน หรือเลือกเฟรมที่จะแก้'); return; }
  let n = 0;
  for (const t of targets) n += stripDividers(t);
  log('ปิดเส้นคั่น ' + n + ' จุด ใน ' + targets.length + (sel.length ? ' ชิ้นที่เลือก' : ' เฟรม') + ' · ไม่ได้สร้างจอใหม่');
}

/* ---------- สร้างทั้งหมด ---------- */
async function build() {
  errors.length = 0;
  const t0 = Date.now();
  log('นำเข้า component จากไลบรารี…');
  await resolveAll();
  log('นำเข้าเสร็จใน ' + Math.round((Date.now() - t0) / 1000) + ' วินาที · เริ่มสร้างจอ');
  // หน้าปลายทาง: หน้าที่ชื่อขึ้นต้นด้วย overhaul (เจ้าของงานสร้าง "overhaul-1") · ไม่มีค่อยสร้าง
  const lower = (p) => p.name.trim().toLowerCase();
  let page = figma.root.children.find(p => lower(p) === 'overhaul-1') || figma.root.children.find(p => lower(p).indexOf('overhaul') === 0);
  if (!page) { try { page = figma.createPage(); page.name = 'overhaul-1'; } catch (e) { page = figma.currentPage; } }
  log('วางในหน้า "' + page.name + '"');
  await figma.setCurrentPageAsync(page);
  // ล้างชุดเดิมของปลั๊กอินนี้ (frame "OH2 / …" และ section "OH2 · …")
  page.children.filter(n => n.name.indexOf('OH2 / ') === 0 || n.name.indexOf('OH2 · ') === 0).forEach(n => n.remove());
  let y = 0;
  page.children.forEach(n => { if (n.absoluteBoundingBox) y = Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + 400); });

  /* 1 จอ = 1 เฟรมระดับบนสุด พื้นขาวของตัวเอง (เจ้าของงานสั่ง 19 ต.ค. 2569: "1 จอ หนึ่งพื้นหลัง" — เลิกใช้ section ที่เป็นพื้นหลังก้อนเดียว)
     scenario ละ 1 แถว เรียงบนลงล่าง · ในแถวเรียงจอซ้ายไปขวาตามลำดับที่กด · แผง Layers เรียงจอแรกไว้บนสุด (insertChild 0) */
  const GAP_X = 200, GAP_Y = 480;
  const TOTAL = SCENARIOS.reduce((a, x) => a + x[1].length, 0);
  const made = [];
  for (const [title, screens] of SCENARIOS) {
    let x = 0, h = 0;
    for (const [label, fn] of screens) {
      // คู่ desktop + mobile วางข้างกัน (เจ้าของงานสั่ง 19 ต.ค. 2569)
      for (const mob of [false, true]) {
        MOB = mob;
        try {
          const s = await fn();
          stripDividers(s);
          s.name = 'OH2 / ' + title.split(' · ')[0] + ' — ' + label + (mob ? ' · mobile' : '');
          page.insertChild(0, s); s.x = x; s.y = y;
          x += (mob ? VW() + GAP_X : 1440 + 80); h = Math.max(h, s.height);
          made.push(s);
          log('  · ' + made.length + '/' + TOTAL * 2 + ' ' + s.name);
        } catch (e) { warn(title + ' / ' + label + (mob ? ' (mobile)' : ''), e); }
      }
      MOB = false;
    }
    y += h + GAP_Y;
    log('✓ ' + title + ' (' + screens.length + ' จอ)');
  }
  // ตรวจ: ทุกชิ้นที่ไม่ใช่กรอบจัดวาง ต้องเป็น instance
  // นับจากโครงอย่างเดียว (เดิมถาม main component ทีละ instance 1,600+ ครั้ง) · ชื่อ component ที่ใช้มาจากที่ปลั๊กอินสร้างเอง (USED)
  let instances = 0, loose = 0;
  const names = USED;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') loose++;
  }
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 6));
  log('');
  log('สร้าง ' + made.length + ' จอ · ' + SCENARIOS.length + ' แถว (scenario ละแถว) · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓'));
  log('component ที่ใช้ (' + names.size + '): ' + [...names].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
function findInstanceAncestor(n) { let p = n.parent; while (p) { if (p.type === 'INSTANCE') return p; p = p.parent; } return null; }

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'build') await build();
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); }
    if (msg.type === 'patch-dividers') await patchDividers();
    if (msg.type === 'patch-wbs') await patchWbs();
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
