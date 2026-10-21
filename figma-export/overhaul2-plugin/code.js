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
const warn = (where, e) => {   // แนบบรรทัดใน code.js ที่พัง (20 ต.ค. 2569)
  const at = e && e.stack ? String(e.stack).split('\n').find(l => /code\.js|<anonymous>|at /.test(l) && !/warn/.test(l)) : '';
  const m = where + ' — ' + (e && e.message ? e.message : e) + (at ? '  [' + at.trim().slice(0, 90) + ']' : '');
  errors.push(m); log('⚠ ' + m);
};

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
  // แผงแจ้งเตือนใต้กระดิ่ง (หน้า Header navigation ของไฟล์ component · สเปก Diagram/01-บำรุงรักษาตามวาระ/16-overhaul-toast-notification.md · 20 ต.ค. 2569)
  "Notification card": ["8b00e80ca7ead162e5de06e8cc261b86d5904c32", false],
  "_Notification item base": ["5e4101e154462cac0b912c28d0499b61f84c3001", false],
  "Status": ["65871480cb419a27224a15825374bc1486ab34d6", true],
  "Section label": ["a9baa20a14b45ef90e3e74cd5eef8ae17adac1c0", true],
  "Tabs": ["abbfc528e17b049b49dfa1dcc3c7bc26ab1cb76f", false],
  "Tab item": ["efb1391effff741a0bd41f92c8b8ebb5f7ae8fdc", true],
  "Progress steps": ["ad140301ab65437a50300845a46a423e4c7e3952", true],
  "Table": ["f1bf4ff71490cea64e92f210d8941eecb1d236e3", true],
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
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Progress steps', 'Content item row', 'Table header',
  'Table header cell', 'Table cell', 'Table pagination', 'Text input', 'Input dropdown', 'Text area', 'File upload', 'Input label',
  'List with checkbox', 'Horizontal step item', 'Alert', 'Pill outline', 'Primary button', 'Secondary button', 'Secondary danger button',
  'Tertiary button', 'Dropdown menu', 'Dropdown list', 'Background overlay', 'Side panel header', 'Side panel footer', 'Checkbox with badge',
  'Modal', 'Notification', 'Notification card', 'Empty state/Search not found', 'Empty state/Data empty',
  'add-24-300-round', 'filter_list-24-400-round', 'more_horiz-20-400-round', 'quick_reference_all-24-300-round', 'stylus-24-300-round',
  'delete-24-300-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round', 'keyboard_arrow_left-20-400-round', 'cloud_upload-24-300-round',
  // mobile (19 ต.ค. 2569)
  'Mobile table', 'Mobile progress steps', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header'];
/* ตัวที่ใช้แค่เป็นชิ้นซ้อนใน component อื่น (แก้ property ของตัวที่ซ้อนอยู่) — ขาดได้ไม่หยุด
   (เช่น _Dropdown menu item ที่ Figma ไม่ publish เพราะชื่อขึ้นต้น "_" · Primary danger button ที่มากับ Modal Destructive) */
const NESTED = ['Nav button', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button',
  'Primary danger button', '_Dropdown menu item', 'Dropdown list item', '_Content item base', '_File upload item base',
  'List with checkbox item', 'List header item', 'Checkbox', 'Card form row', 'Badge outline', 'Mobile table item', 'Step circles / 5 steps',
  '_Notification item base', 'Status'];   // ชิ้นใน Notification card (20 ต.ค. 2569)
/* component ในตัวไฟล์ Maintain-D (ไม่อยู่ในไลบรารี) — ไฟล์อื่นไม่มี ⇒ ไม่หยุด ใช้แบบเดิมแทนแล้วรายงาน */
const LOCAL_OPTIONAL = ['RepairAppointmentStep', 'Device Type', 'Component 1', 'Header'];   // Device Type = ป้าย Device/Desktop/Mobile ของทีมออกแบบ (20 ต.ค. 2569 · แทน Component 1 ที่เก็บไว้เป็นตัวสำรอง) · Header = แถบรหัส flow (ไลบรารีอื่น หาจาก instance ในไฟล์)
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
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
  missing.filter(m => LOCAL_OPTIONAL.includes(m.split(' — ')[0])).forEach(m => log('  · ไม่พบ ' + m.split(' — ')[0] + ' ในไฟล์นี้ (component ของไฟล์ Maintain-D) — ใช้แบบเดิมแทน'));
  const hard = missing.filter(m => !NESTED_ONLY.has(m.split(' — ')[0]) && !LOCAL_OPTIONAL.includes(m.split(' — ')[0]));
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
    const full = Object.keys(cp).find(x => x === k || x.split('#')[0].trim() === k);
    if (!full) { warn(node.name, 'ไม่มี property "' + k + '"'); continue; }
    out[full] = obj[k];
  }
  try { if (Object.keys(out).length) node.setProperties(out); } catch (e) { warn(node.name + ' setProperties ' + JSON.stringify(obj), e); }
}
const USED = new Set();
/* ชิ้นที่สร้างระหว่างประกอบจอปัจจุบัน — Figma วาง node ใหม่ที่ (0,0) ของหน้าจนกว่าจะ appendChild ⇒ พังกลางทางแล้วค้างซ้อนที่มุม (20 ต.ค. 2569) */
let CREATED = [];
let PLACE = null;   // ตำแหน่งที่จอปัจจุบันจะไปอยู่ — shell() วางเฟรมจอทันทีที่สร้าง
function dropCreated(page) { let n = 0; for (const node of CREATED) { try { if (node.parent === page) { node.remove(); n++; } } catch (e) { /* ลบแล้ว */ } } CREATED = []; return n; }
const INNER_FRAMES = new Set(['Section', 'Row', 'Content', 'Content item', 'Actions', 'Dual list', 'Table', 'Page', 'Container', 'WBS', 'Sheet', 'Panel', 'Sign', 'Signed', 'Spacer', 'Mobile table', 'Page header', 'Progress steps', 'Header', 'State', 'Detail', 'Device']);
function sweepOrphans(page, names) {   // ชิ้นค้างจากรอบก่อนที่ (0,0) ของหน้าปลั๊กอิน (ไม่ใช่เฟรมจอ) — ลบเฉพาะที่เข้าเกณฑ์
  let n = 0;
  for (const node of page.children.slice()) {
    if (node.x !== 0 || node.y !== 0 || node.name.indexOf('OH2 / ') === 0 || node.name.indexOf('OH2 · ') === 0) continue;
    if ((node.type === 'FRAME' && INNER_FRAMES.has(node.name)) || (node.type === 'INSTANCE' && names.has(node.name))) { try { node.remove(); n++; } catch (e) { /* ข้าม */ } }
  }
  return n;
}
function inst(name, variant, props) {
  USED.add(name);
  const n = main(name, variant).createInstance();
  CREATED.push(n);
  if (props) setProps(n, props);
  return n;
}
const find = (root, name, nth) => {
  const all = root.findAll(n => n.name === name);
  return all[nth || 0] || null;
};
const FONTS = new Set();
/* ฟอนต์สำรองเมื่อ component ใช้ฟอนต์ที่เครื่องไม่มี (เจ้าของงานเจอ 20 ต.ค. 2569: แถบ Header/State ของทีมออกแบบใช้ LINE Seed Sans → แก้ข้อความไม่ได้ ป้ายเลยไม่ตรง scenario) */
let FALLBACK_FONT, FONT_SWAPPED = 0;
async function fallbackFont() {
  if (FALLBACK_FONT) return FALLBACK_FONT;
  for (const f of [{ family: 'IBM Plex Sans Thai', style: 'Bold' }, { family: 'IBM Plex Sans Thai', style: 'Medium' }, { family: 'Inter', style: 'Bold' }, { family: 'Inter', style: 'Regular' }]) {
    try { await figma.loadFontAsync(f); return (FALLBACK_FONT = f); } catch (e) { /* ลองตัวถัดไป */ }
  }
  return null;
}
async function text(root, layer, value, nth) {
  const t = typeof layer === 'string' ? find(root, layer, nth) : layer;
  if (!t || t.type !== 'TEXT') { warn(root.name, 'ไม่พบข้อความ "' + layer + '"'); return false; }
  try {
    const fonts = t.fontName === figma.mixed ? t.getRangeAllFontNames(0, t.characters.length) : [t.fontName];
    let missing = false;
    for (const f of fonts) { const k = f.family + '|' + f.style; if (FONTS.has(k)) continue; try { await figma.loadFontAsync(f); FONTS.add(k); } catch (e) { missing = true; } }   // โหลดฟอนต์ละครั้งเดียว
    if (missing) {   // ฟอนต์ของ component ไม่มีในเครื่อง → สลับเป็นฟอนต์ที่มี แล้วค่อยใส่ข้อความ
      const fb = await fallbackFont();
      if (!fb) throw new Error('ฟอนต์ ' + fonts.map(f => f.family + ' ' + f.style).join(', ') + ' ไม่มีในเครื่อง และไม่มีฟอนต์สำรอง');
      t.fontName = fb; FONT_SWAPPED++;
    }
    t.characters = value;
    return true;
  } catch (e) { warn('ข้อความ ' + (typeof layer === 'string' ? layer : layer.name), e); return false; }
}
function hide(root, name, all) {
  const list = root.findAll(n => n.name === name);
  if (!list.length) { warn(root.name, 'ไม่พบ layer "' + name + '" ให้ซ่อน'); return; }
  (all ? list : [list[0]]).forEach(n => { n.visible = false; });
}
function frame(name, dir, o) {
  const f = figma.createFrame();
  CREATED.push(f);
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
/* ป้ายที่เห็นคือ Input label ที่ซ้อนอยู่ในช่อง (property ชั้นบนคุมป้ายชุดเก่าที่ซ่อนอยู่) ⇒ ตั้งทั้งสองชั้นให้ตรงกัน */
function syncLabel(n, label, optional) {
  const l = n && find(n, 'Input label');
  if (l) setProps(l, { 'Label text': label, Optional: !!optional, 'Info icon': false });
  return n;
}
function field(label, value, o) {   // Text input
  o = o || {};
  const st = o.state || (o.error ? 'Error' : value ? 'Filled' : 'Default');
  const n = inst('Text input', { State: st, Size: 'md' }, { 'Label text': label, Text: value || o.placeholder || '', Optional: !!o.optional,
    Helper: !!o.error, 'Helper text': o.error || '', 'Info icon': false, 'Leading icon': !!o.lead, 'Trailing icon': false,
    'Show Placeholder': !value });
  if (o.lead) setProps(n, { 'Leading icon swap': icon(typeof o.lead === 'string' ? o.lead : 'search-24-300-round') });
  return syncLabel(n, label, o.optional);
}
function dropdown(label, value, o) {   // Input dropdown
  o = o || {};
  const st = o.state || (o.error ? 'Error' : value ? 'Selected' : 'Default');
  const p = { 'Label text': label, Text: value || o.placeholder || 'เลือก', Optional: false, Helper: !!o.error, 'Helper text': o.error || '',
    'Info icon': false, 'Leading icon': !!o.lead, Supporting: false };
  if (o.lead) p['Leading icon swap'] = icon(o.lead);
  return syncLabel(inst('Input dropdown', { State: st, Size: 'md' }, p), label, false);
}
function area(label, value, o) {
  o = o || {};
  return syncLabel(inst('Text area', { State: value ? 'Filled' : 'Default', Size: 'md' }, { 'Label text': label, Text: value || o.placeholder || '',
    Optional: !!o.optional, Helper: false, 'Info icon': false, 'Trailing icon': false, 'Show Placeholder': !value }), label, o.optional);
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
/* Section label — หัวข้อของหน้า Detail (รีวิว 19 ต.ค. 2569: Section header ใช้เฉพาะหน้า Create/Edit)
   ไม่มี Badge ⇒ จำนวนต่อท้ายชื่อ "(n)" ตาม wireframe "รายการรถ (จำนวน xx)" · ปุ่ม: Primary action = Tertiary brand button · Secondary action = Tertiary button */
async function sectionLabel(title, o) {
  o = o || {};
  const bs = o.buttons || [];
  const pri = bs.find(b => b.kind === 'Primary button'), sec = bs.find(b => b.kind !== 'Primary button');
  const sl = inst('Section label', { Breakpoint: BP() }, { Title: o.badge != null ? title + ' (' + o.badge + ')' : title, Supporting: false, 'Info icon': false,
    'More actions': false, Actions: !!(pri || sec), 'Primary action': !!pri, 'Secondary action': !!sec });
  const put = (b, node) => { if (b && node) setProps(node, { Text: b.text, 'Leading icon': !!b.icon, 'Trailing icon': false, ...(b.icon ? { 'Leading icon swap': icon(b.icon) } : {}) }); };
  put(pri, find(sl, 'Tertiary brand button')); put(sec, find(sl, 'Tertiary button'));
  return sl;
}
/* กล่องแสดงข้อมูล (display) ตามตัวอย่างที่เจ้าของงานส่ง 19 ต.ค. 2569 (Maintain-D หน้า "Flow การซ่อม" — VehicleInfo > Content):
   พื้น Color/surface/secondary-subtle (gray-50) · มุม 8 · ขอบใน 24 · ระยะแถว 24 · แถวละ 4 ช่อง Content item row (Text with label ไม่มีไอคอน) */
const SURFACE_SUB = { r: 249 / 255, g: 250 / 255, b: 251 / 255 };
let SURFACE_VAR;
async function surfaceVar() {   // ผูกสีกับตัวแปรของไลบรารีถ้าหาได้ ไม่ได้ก็ใช้ค่าสีเดียวกัน
  if (SURFACE_VAR !== undefined) return SURFACE_VAR;
  SURFACE_VAR = null;
  const ok = (v) => /^Color\/surface\/secondary-sub/i.test(v.name);
  try { const l = (await figma.variables.getLocalVariablesAsync('COLOR')).find(ok); if (l) return (SURFACE_VAR = l); } catch (e) { /* ไม่มี API */ }
  try {
    for (const c of await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()) {
      const v = (await figma.teamLibrary.getVariablesInLibraryCollectionAsync(c.key)).find(ok);
      if (v) return (SURFACE_VAR = await figma.variables.importVariableByKeyAsync(v.key));
    }
  } catch (e) { /* ไม่มีสิทธิ์ teamlibrary — ใช้ค่าสี */ }
  return SURFACE_VAR;
}
async function displayBox(box) {
  box.name = 'Content';
  box.itemSpacing = 24; box.paddingTop = box.paddingBottom = box.paddingLeft = box.paddingRight = 24; box.cornerRadius = 8;
  let paint = { type: 'SOLID', color: SURFACE_SUB };
  const v = await surfaceVar();
  if (v) try { paint = figma.variables.setBoundVariableForPaint(paint, 'color', v); } catch (e) { /* ใช้ค่าสี */ }
  box.fills = [paint];
  return box;
}
function kv(pairs, perRow) {   // Content item row ละ 4 ช่อง (Type=Text with label) · mobile แถวละ 2
  perRow = MOB ? 2 : (perRow || 4);
  const box = frame('Content item', 'VERTICAL', { gap: 8 });   // displayBox() แต่งเป็นกล่องแสดงข้อมูลตอนสร้างจอเสร็จ (ต้อง await ตัวแปรสี)
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
      else if (v && v.progress != null) { setProps(it, { Style: 'Text' }); setProps(it, { Header: head, Text: (v.text ? v.text + ' · ' : '') + v.progress + '%', Supporting: false }); }   // mobile: ความคืบหน้าเป็นข้อความ (Mobile table item ไม่มี progress bar)
      else if (v && typeof v === 'object' && v.text != null) {
        setProps(it, { Style: i === 0 ? 'Lead text' : 'Text' });
        const hasSub = !!v.sub && propVal(it, 'Supporting text') !== undefined;
        setProps(it, hasSub ? { Header: head, Text: v.text, Supporting: true, 'Supporting text': v.sub } : { Header: head, Text: v.text + (v.sub ? ' · ' + v.sub : ''), Supporting: false });
      }
      else { setProps(it, { Style: i === 0 ? 'Lead text' : 'Text' }); setProps(it, { Header: head, Text: v == null ? '' : String(v), Supporting: false }); }
    });
    add(box, card, 'h');
  });
  return box;
}
/* ตารางประกอบเองแบบเดิม — ใช้เฉพาะตารางที่เกินขนาด component Table ของไลบรารี (8 คอลัมน์ × 10 แถว) */
function tblComposed(cols, rows) {   // cols: [หัว, กว้าง, Style, เรียงได้] · ช่อง: ข้อความ | {pill:[t,สี]} | {menu:1} | {icons:[..]} | {check:bool,text}
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
      const st = cellStyle(v, style);
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
      } else fillTextCell(cell, v);
    });
  });
  return t;
}
/* ช่องตารางชนิดเพิ่ม (CF หน้า 1 · 20 ต.ค. 2569): {text, sub} = Text + SubText (property Supporting text ของ Table cell) · {progress: 0–100, text} = Style "Lead Progress Bar"
   ข้อความใน Progress bar ต้องใส่ผ่าน text() (async) ⇒ เก็บคิวไว้แล้วให้ tbl() เรียก flushCellText() ตอนจบ */
const cellStyle = (v, style) => v && v.check != null ? 'Lead checkbox' : v && v.pill ? 'Badge' : v && (v.menu || v.icons) ? 'Action icons' : v && v.progress != null ? 'Lead Progress Bar' : style || 'Text';
const CELL_TEXT = [];
async function flushCellText() { for (const [n, layer, val] of CELL_TEXT.splice(0)) await text(n, layer, val); }
function fillTextCell(cell, v) {
  if (v && v.progress != null) {
    const pb = cell.findAll(n => n.type === 'INSTANCE' && n.name === 'Progress bar')[0];
    if (pb) { setProps(pb, { Progress: Math.max(0, Math.min(100, Math.round(v.progress / 20) * 20)) + '%', Percentage: true, Label: 'Right' }); if (v.text) CELL_TEXT.push([pb, 'Percentage', v.text]); }
    return;
  }
  if (v && typeof v === 'object' && v.text != null) { setProps(cell, { Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' }); return; }
  setProps(cell, { Text: v == null ? '' : String(v), Supporting: false });
}
/* ช่องตาราง 1 ช่อง — ใช้ทั้งกับ Table cell ที่ซ้อนใน Table (รีวิว 19 ต.ค. 2569) และ mobile */
function fillCell(cell, v, style, alt) {
  const st = cellStyle(v, style);
  setProps(cell, { Style: st, 'Alternating fills': alt });
  if (st === 'Badge') { const p = find(cell, 'Pill outline'); if (p) setProps(p, { Color: v.pill[1], Text: v.pill[0] }); }
  else if (st === 'Action icons') {
    const ic = v.menu ? ['more_horiz-20-400-round'] : v.icons;
    setProps(cell, { View: ic.length > 0, Edit: ic.length > 1, Print: false, Delete: false });
    const bs = cell.findAll(n => n.name === 'Tertiary button');
    ic.forEach((name, i) => { if (bs[i]) setProps(bs[i], { 'Leading icon swap': icon(name) }); });
  } else if (st === 'Lead checkbox') {
    setProps(cell, { Text: v.text, Supporting: false });
    const cb = find(cell, 'Checkbox'); if (cb) setProps(cb, { Type: v.check ? 'Selected' : 'Unselected' });
  } else fillTextCell(cell, v);
}
/* กว้างคอลัมน์ใน instance: w = คงที่ · 0 = ยืดเต็ม — Figma ยอมให้ override ขนาดลูกใน instance ที่เป็น auto layout */
function sizeCol(c, w) {
  try {
    if (w) { c.layoutSizingHorizontal = 'FIXED'; c.resize(w, c.height); } else c.layoutSizingHorizontal = 'FILL';
    c.children.forEach(x => { x.layoutSizingHorizontal = 'FILL'; });
  } catch (e) { warn('ปรับกว้างคอลัมน์ ' + c.name, e); }
}
/* ตาราง = instance ของ component "Table" (รีวิว 19 ต.ค. 2569: เดิมประกอบเองจาก Table cell/Table header cell ⇒ ไม่มีกรอบตาราง)
   Table ของไลบรารีมี 8 คอลัมน์ × 10 แถว ⇒ ซ่อนส่วนที่เกิน · ปิด Scrollbar · Pagination ตาม o.pagination (จำนวนรายการ) */
const TABLE_MAX = { cols: 8, rows: 10 };   // ขนาด component Table ของไลบรารี
const OVERSIZE = [];
async function tbl(cols, rows, o) {   // cols: [หัว, กว้าง, Style, เรียงได้] · ช่อง: ข้อความ | {pill:[t,สี]} | {menu:1} | {icons:[..]} | {check:bool,text}
  o = o || {};
  if (MOB) {
    const m = mobileCards(cols, rows); await flushCellText();
    if (!o.pagination) return m;
    const box = col('Table', [m], 20); add(box, await pagination(o.pagination, o.pageOpt), 'h'); return box;
  }
  if (cols.length > TABLE_MAX.cols || rows.length > TABLE_MAX.rows) {   // ไลบรารีขยายไม่ได้ (instance เพิ่มคอลัมน์/แถวไม่ได้) ⇒ คงแบบเดิม แล้วรายงาน
    OVERSIZE.push(cols.length + ' คอลัมน์ × ' + rows.length + ' แถว');
    const box = col('Table', [tblComposed(cols, rows)], 20); await flushCellText(); if (o.pagination) add(box, await pagination(o.pagination, o.pageOpt), 'h'); return box;
  }
  const t = inst('Table', { 'Alternating fills': 'True' }, { Scrollbar: false, Pagination: !!o.pagination });
  t.name = 'Table';
  const wrap = find(t, 'Content with scrollbar'), content = wrap && wrap.children.find(c => c.name === 'Content');
  try { if (wrap) wrap.layoutSizingHorizontal = 'FILL'; if (content) content.layoutSizingHorizontal = 'FILL'; } catch (e) { warn('ยืดตารางเต็มกว้าง', e); }
  const columns = content ? content.children.filter(c => c.name === 'Column') : [];
  if (cols.length > columns.length) warn('Table', 'มี ' + cols.length + ' คอลัมน์ เกิน ' + columns.length + ' ของไลบรารี');
  columns.forEach((c, ci) => {
    if (ci >= cols.length) { c.visible = false; return; }
    const [head, w, style, sort] = cols[ci];
    const [hc, ...cells] = c.children;
    setProps(hc, { Text: head || ' ', 'Sort icon': !!sort, 'Header text': !!head });
    if (sort) { const si = find(hc, 'Sort icon'); if (si) setProps(si, { Icon: sort }); }
    if (rows.length > cells.length) warn('Table', 'มี ' + rows.length + ' แถว เกิน ' + cells.length + ' ของไลบรารี');
    cells.forEach((cell, ri) => { if (ri >= rows.length) { cell.visible = false; return; } fillCell(cell, rows[ri][ci], style, ri % 2 ? 'True' : 'False'); });
    sizeCol(c, w);
  });
  await flushCellText();
  if (o.pagination) { const pg = find(t, 'Table pagination'); if (pg) await fillPagination(pg, o.pagination, o.pageOpt); }
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
/* stepper = instance ของ component "Progress steps" Type=Horizontal ทั้งก้อน (เจ้าของงานส่งภาพ component 19 ต.ค. 2569 · กติกา R10)
   นับช่อง Horizontal step item ของไลบรารีตอนรัน — พอกับจำนวนขั้นเมื่อไหร่ใช้ทันที · ไม่พอ ⇒ คืน null ให้วางแบบเดิม + รายงาน (ไม่ตัดขั้นทิ้งเงียบๆ) */
const STEP_SHORT = [];
/* stepper อ้างอิงของหน้างานซ่อม (19 ต.ค. 2569 เจ้าของงาน: "อยากให้สร้างการแก้ stepper เข้ามารวมกับการแก้นัดหมาย")
   หน้างานซ่อมในไฟล์ Maintain-D มี 7 ขั้นในแถบเดียว ⇒ ตอนรันหา "Progress steps" ที่มีช่อง ≥ จำนวนขั้นในไฟล์ (นอกจอ OH2):
   เป็น instance → ใช้ main component ของมัน · เป็นเฟรม → ลอกกรอบ/มุม/พื้น/ระยะของมัน · ไม่เจอ → ค่ากรอบของ component Progress steps (เส้น gray-300 · มุม 8) */
let STEP_REF;
const PS_STROKE = { r: 208 / 255, g: 213 / 255, b: 221 / 255 };
async function findStepRef() {
  if (STEP_REF !== undefined) return STEP_REF;
  STEP_REF = null;
  const inOH2 = (n) => { for (let p = n; p && p.type !== 'PAGE'; p = p.parent) if (p.parent && p.parent.type === 'PAGE' && p.name.indexOf('OH2') === 0) return true; return false; };
  const slots = (n) => (n.children || []).filter(c => c.name === 'Horizontal step item').length;
  try {
    const cands = figma.root.findAllWithCriteria({ types: ['FRAME', 'INSTANCE'] }).filter(n => n.name === 'Progress steps' && slots(n) >= STEPS.length && !inOH2(n));
    for (const c of cands.filter(c => c.type === 'INSTANCE')) {
      const mc = await c.getMainComponentAsync();
      if (mc && slots(mc) >= STEPS.length) { STEP_REF = { kind: 'component', comp: mc, from: c }; break; }
    }
    if (!STEP_REF && cands.length) STEP_REF = { kind: 'frame', node: cands.find(c => c.type === 'FRAME') || cands[0] };
  } catch (e) { warn('หา stepper อ้างอิง', e); }
  log(STEP_REF ? 'stepper อ้างอิงหน้างานซ่อม: ' + (STEP_REF.kind === 'component' ? 'component ' + STEP_REF.comp.name : 'เฟรม "' + STEP_REF.node.name + '" (' + slots(STEP_REF.node) + ' ขั้น)') : 'ไม่พบ stepper ของหน้างานซ่อมในไฟล์ — ใช้กรอบตาม component Progress steps');
  return STEP_REF;
}
/* component ของแถบขั้นตอนที่ใช้ได้ (ช่องพอจำนวนขั้น): ① Progress steps ของไลบรารี (เจ้าของงานเพิ่มเป็น 7 ช่อง + publish 19 ต.ค. 2569) ② component ของหน้างานซ่อม */
function stepComp() {
  try {
    const h = main('Progress steps', { Type: 'Horizontal' });
    if (h.children.filter(c => c.type === 'INSTANCE' && c.name === 'Horizontal step item').length >= STEPS.length) return { comp: h, lib: true };
  } catch (e) { /* ไม่มี variant */ }
  return STEP_REF && STEP_REF.kind === 'component' ? { comp: STEP_REF.comp, lib: false } : null;
}
function newStepInst(sc) {
  const ps = sc.comp.createInstance(); ps.name = 'Progress steps';
  if (sc.lib) setProps(ps, { 'Step 2': true, 'Step 3': true, 'Step 4': true });
  return ps;
}
function styleStepFrame(r) {   // กรอบของแถบขั้นตอน = แบบหน้างานซ่อม (หรือค่าของ component Progress steps)
  const ref = STEP_REF && STEP_REF.kind === 'frame' ? STEP_REF.node : null;
  if (ref) {
    for (const k of ['strokes', 'strokeWeight', 'strokeAlign', 'cornerRadius', 'fills', 'effects', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'itemSpacing', 'counterAxisAlignItems']) {
      try { if (ref[k] !== undefined && ref[k] !== figma.mixed) r[k] = JSON.parse(JSON.stringify(ref[k])); } catch (e) { /* ค่าที่ลอกไม่ได้ ข้าม */ }
    }
  } else {
    r.strokes = [{ type: 'SOLID', color: PS_STROKE }]; r.strokeWeight = 1; r.cornerRadius = 8; r.clipsContent = false;   // 20 ต.ค. 2569 ไม่ clip
    r.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }]; r.counterAxisAlignItems = 'CENTER';
  }
  return r;
}
function progressSteps(cur, allDone) {
  const sc = stepComp();
  if (sc) {
    const ps = newStepInst(sc);
    fillSteps(ps.children.filter(c => c.type === 'INSTANCE' && c.name === 'Horizontal step item'), cur, allDone);
    return ps;
  }
  const ps = inst('Progress steps', { Type: 'Horizontal' }, { 'Step 2': true, 'Step 3': true, 'Step 4': true });
  const items = ps.children.filter(c => c.type === 'INSTANCE' && c.name === 'Horizontal step item');
  if (items.length < STEPS.length) { STEP_SHORT.push(items.length); ps.remove(); return null; }
  fillSteps(items, cur, allDone);
  return ps;
}
function fillSteps(items, cur, allDone) {
  items.forEach((it, i) => {
    if (i >= STEPS.length) { it.visible = false; return; }
    const n = i + 1, st = allDone || n < cur ? 'Completed' : n === cur ? 'Current' : 'Incomplete';
    setProps(it, { Status: st });
    setProps(it, { Text: STEPS[i], Number: String(n).padStart(2, '0'), Supporting: false, Connector: n < STEPS.length });
    try { it.layoutGrow = 1; } catch (e) { /* กว้างตามไลบรารี */ }
  });
}
function stepper(cur, allDone) {   // Progress steps — component ถ้าช่องพอ · ไม่พอ = เฟรมมีกรอบแบบหน้างานซ่อม (R10)
  if (MOB) {   // Mobile progress steps — วงกลมในไลบรารีมีสูงสุด 5 ขั้น ⇒ ใช้ 5 ขั้น แล้วแก้ตัวเลขเป็น x/6 (เส้นรอบวงไม่ตรงสัดส่วน 6 ขั้น)
    const m = inst('Mobile progress steps', { Collapsed: 'True' }, { Text: STEPS[cur - 1], Supporting: cur < STEPS.length, 'Supporting text': STEPS[cur] || '' });
    const circ = main('Step circles / 5 steps', { Step: String(Math.min(cur, 5)) });
    setProps(m, { 'Stepper item swap': circ.id });
    const c = m.findAll(n => n.type === 'INSTANCE' && /^Step circles/.test(n.name))[0];
    if (c) { text(c, 'Current', String(allDone ? 6 : cur)); text(c, 'Total', '6'); }
    return m;
  }
  const ps = progressSteps(cur, allDone);
  if (ps) return ps;
  const r = styleStepFrame(frame('Progress steps', 'HORIZONTAL'));   // ไลบรารีมีช่องไม่พอ — เฟรมมีกรอบแบบหน้างานซ่อม (R10)
  STEPS.forEach((s, i) => {
    const n = i + 1, st = allDone || n < cur ? 'Completed' : n === cur ? 'Current' : 'Incomplete';
    const it = inst('Horizontal step item', { Status: st }, { Text: s, Number: String(n).padStart(2, '0'), Supporting: false, Connector: n < STEPS.length });
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
    if (PLACE) { scr.x = PLACE.x; scr.y = PLACE.y; }
    scr.counterAxisSizingMode = 'FIXED'; scr.resize(VW(), VH()); scr.primaryAxisSizingMode = 'AUTO'; scr.minHeight = VH(); scr.clipsContent = false;   // เจ้าของงานสั่ง 20 ต.ค. 2569 "clip content เอาออก"
    add(scr, inst('Header navigation', { Breakpoint: 'Mobile' }), 'h');
    const page = frame('Page', 'VERTICAL', { gap: 24, pad: [16, 16], fill: WHITE });
    add(scr, page, 'h');
    add(page, await pageHead(o), 'h');
    return { scr, page };
  }
  const scr = frame('OH2 / ' + name, 'HORIZONTAL', { fill: WHITE });
  if (PLACE) { scr.x = PLACE.x; scr.y = PLACE.y; }
  scr.primaryAxisSizingMode = 'FIXED'; scr.resize(1440, 1024); scr.counterAxisSizingMode = 'AUTO'; scr.minHeight = 1024; scr.clipsContent = false;   // เจ้าของงานสั่ง 20 ต.ค. 2569 "clip content เอาออก"
  const sb = inst('Sidebar navigation', { State: 'Collapsed' });
  scr.appendChild(sb); try { sb.layoutSizingVertical = 'FILL'; } catch (e) { /* สูงตามตัวเองก็ได้ */ }
  const navs = sb.findAll(n => n.name === 'Nav button'); if (navs[0]) setProps(navs[0], { State: 'Active' });
  const ctn = frame('Container', 'VERTICAL', { fill: WHITE });
  scr.appendChild(ctn); ctn.layoutGrow = 1;
  add(ctn, inst('Header navigation', { Breakpoint: 'Tablet' }), 'h');   // รีวิว 19 ต.ค. 2569: จอ desktop ใช้ Header navigation แบบ Tablet
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
/* ---------- toast + notification ตามสเปก Diagram/01-บำรุงรักษาตามวาระ/16-overhaul-toast-notification.md (20 ต.ค. 2569) ----------
   toast = component Notification (Type Success/Error) มุมขวาล่าง ห่างขอบ 24 · mobile เต็มกว้าง ห่างขอบ 16 · มีบรรทัดรอง (Supporting text)
   notification = กระดิ่ง Nav button (Indicator = จุดแดง) + Notification card ใต้กระดิ่ง · mobile = bottom sheet (card ไม่มี variant มือถือ — เสนอ ยังไม่ผ่านรีวิว) */
async function toast(scr, o) {
  const n = inst('Notification', { Type: o.err ? 'Error' : 'Success', Breakpoint: BP() }, { Text: o.title, Actions: false, 'Supporting text': o.sub || '' });
  const sup = find(n, 'Supporting text'); if (sup && !o.sub) sup.visible = false;
  const m = MOB ? 16 : 24;
  if (MOB) { try { n.resize(VW() - m * 2, n.height); } catch (e) { warn('toast mobile กว้าง', e); } }
  overlay(scr, n, MOB ? m : VW() - n.width - m, VH() - n.height - m);
  return n;
}
const propVal = (n, k) => { const cp = n.componentProperties || {}; const f = Object.keys(cp).find(x => x === k || x.split('#')[0].trim() === k); return f ? cp[f].value : undefined; };
/* กระดิ่งใน Header navigation = Nav button ตัวที่ไลบรารีเปิด Indicator ไว้ (จุดแดง) · on = มีแจ้งเตือนใหม่ */
function bell(scr, on) {
  const hdr = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Header navigation')[0];
  if (!hdr) { warn('กระดิ่ง', 'ไม่พบ Header navigation'); return null; }
  const items = find(hdr, 'Nav items') || hdr;
  const b = items.findAll(n => n.type === 'INSTANCE' && n.name === 'Nav button').find(n => propVal(n, 'Indicator') === true);
  if (!b) { warn('กระดิ่ง', 'ไม่พบ Nav button ที่มี Indicator'); return null; }
  setProps(b, { Indicator: !!on });
  return b;
}
/* รายการแจ้งเตือนฝั่ง กบค. (รหัส N ตามสเปก 16 ข้อ 2.2) — [สีจุดสถานะ, ข้อความ, เวลา, ปุ่มรอง] */
const NOTI_ITEMS = [
  ['Success', 'หน่วยงาน กฟฟ.สงขลา ยืนยันนำรถ 72-6648 สงขลา เข้าอู่วันที่ 22 ต.ค. 2569 เตรียมตรวจรับรถ', '10 นาทีที่แล้ว', ''],
  ['Error', 'หน่วยงาน กฟฟ.ชลบุรี ปฏิเสธนัดนำรถ 70-1123 ชลบุรี เข้าอู่ เหตุผล รถติดภารกิจซ่อมบำรุงสายส่ง กรุณานัดใหม่', '1 ชั่วโมงที่แล้ว', 'นัดใหม่'],
  ['Warning', 'หน่วยงาน กฟฟ.ภูเก็ต ยังไม่ตอบรับนัดรถ 81-2210 ภูเก็ต มาแล้ว 3 วัน', 'เมื่อวาน 09:00', ''],
  ['Success', 'หน่วยงาน กฟฟ.กทม. ยืนยันรับรถ 8234 กค กทม วันที่ 9 พ.ย. 2569 เตรียมปิดงาน', 'เมื่อวาน 15:30', ''],
  ['Brand', 'แผน 123456 Overhaul ประจำปีงบ 2569 — รถเครน เสร็จสิ้น รถทั้ง 3 คันปิดงานแล้ว', '2 วันที่แล้ว', ''],
];
function fillNotiItem(r, it) {   // _Notification item base: จุดสถานะ + ข้อความ + เวลา + ปุ่มรองเมื่อผู้รับต้องทำต่อ
  setProps(r, { Text: it[1], 'Supporting text': it[2], 'Show status': true, 'Show button': !!it[3] });
  const st = r.findAll(x => x.type === 'INSTANCE' && x.name === 'Status')[0]; if (st) setProps(st, { State: it[0] });
  const b = find(r, 'Secondary button'); if (b && it[3]) setProps(b, { Text: it[3], 'Leading icon': false, 'Trailing icon': false });
}
async function notiPanel(scr, items, badge) {
  /* รายการทุกใบมาจาก instance ของ Notification card (ชิ้นซ้อน _Notification item base นำเข้าตรงไม่ได้ — Figma ไม่ publish ชื่อขึ้นต้น "_") */
  const card = inst('Notification card');
  const hd = find(card, '_Notification header'); const bg = hd && find(hd, 'Badge outline'); if (bg) setProps(bg, { Text: badge, Color: 'Gray' });
  const rows = card.findAll(n => n.type === 'INSTANCE' && n.name === '_Notification item base');
  for (const [i, r] of rows.entries()) { if (items[i]) fillNotiItem(r, items[i]); else r.visible = false; }
  if (MOB) {   // mobile: Notification card ไม่มี variant มือถือ ⇒ bottom sheet หัว "แจ้งเตือน" + การ์ด (ซ่อนหัว/ท้ายของการ์ดเอง) + ปุ่มท้าย "ลบข้อความแจ้งเตือนทั้งหมด"
    if (hd) hd.visible = false; const cf = find(card, '_Notification footer'); if (cf) cf.visible = false;
    const r = await sheet(scr, { title: 'แจ้งเตือน (' + badge + ')', content: [card], ok: 'ลบข้อความแจ้งเตือนทั้งหมด' });
    try { card.resize(VW() - 32, card.height); } catch (e) { warn('การ์ดแจ้งเตือนบนมือถือ', e); }
    const ft = find(r.sh, 'Bottom sheet footer'); const sb = ft && find(ft, 'Secondary button'); if (sb) sb.visible = false;
    return r.sh;
  }
  const hdr = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Header navigation')[0];
  overlay(scr, card, VW() - card.width - 24, (hdr ? hdr.height : 64) + 8);   // ใต้กระดิ่ง ชิดขวา
  return card;
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
  if (ti) setProps(ti, { Label: false, Helper: false, 'Trailing icon': false, Text: o.query || o.placeholder || 'ค้นหาเลขแผน, ชื่อแผน, เลขศูนย์ต้นทุน', State: o.query ? 'Filled' : 'Default' });
  const acts = find(th, 'Actions');
  if (acts) { let first = true; for (const b of acts.children) {
    if (b.name === 'Secondary button' && first) { first = false; setProps(b, { Text: 'ตัวกรอง', 'Leading icon': true, 'Leading icon swap': icon('filter_list-24-400-round') }); const p = find(b, 'Pill outline'); if (p) p.visible = false; }
    else b.visible = false; } }
  th.findAll(n => n.name === 'Badge outline with remove icon').forEach((c, i) => { if (o.chips && i < o.chips.length) setProps(c, { Text: o.chips[i] }); else c.visible = false; });
  return th;
}
async function pagination(n, o) { return fillPagination(inst('Table pagination', { Breakpoint: BP() }), n, o); }
/* o.per / o.total (CF หน้า 1: PO ฝากเรื่อง record per page + pagination) — ไม่ส่ง = หน้าเดียว n รายการ · Items per page dropdown เป็นของ component อยู่แล้ว */
async function fillPagination(pg, n, o) {
  o = o || {}; const per = o.per || n, total = o.total || n, pages = Math.max(1, Math.ceil(total / per));
  const tx = find(pg, 'Text'); if (tx && tx.type === 'TEXT') await text(pg, tx, 'แสดง 1 ถึง ' + Math.min(per, total) + ' จาก ' + total + ' รายการ');
  const items = pg.findAll(x => x.name === 'Button groups pagination item');
  items.forEach((it, i) => {
    if (i === 0) setProps(it, { State: 'Disabled' });
    else if (i === items.length - 1) setProps(it, { State: pages > 1 ? 'Default' : 'Disabled' });
    else if (i <= pages) setProps(it, { Number: String(i), State: i === 1 ? 'Hover/Active' : 'Default' });
    else it.visible = false;
  });
  if (o.per) { const ipp = find(pg, 'Items per page dropdown'); const dd = ipp && find(ipp, 'Input dropdown'); if (dd) setProps(dd, { Text: String(per) }); }
  return pg;
}
async function listScreen(name, o) {
  const { scr, page } = await shell(name, { title: 'จัดการงาน Overhaul', primary: 'สร้างแผน Overhaul' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  const th = o.empty ? null : add(sec, await tableHeader(o), 'h');
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
    add(sec, await tbl(o.cols || PLAN_COLS, o.rows.map(o.rowFn || planRow), { pagination: o.rows.length, pageOpt: o.pageOpt }), 'h');   // o.cols/o.rowFn/o.pageOpt = ฉบับ CF หน้า 1
  }
  if (o.combo && th) { const ti = find(th, 'Text input'); if (ti) comboAt(scr, find(ti, 'Container') || ti, o.combo); }   // autocomplete ใต้ช่องค้นหา (CF: พิมพ์ 3 ตัวอักษร)
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
      // 3 ช่อง WBS ไม่บังคับ "(ถ้ามี)" — เจ้าของงานเคาะ 19 ต.ค. 2569 ⇒ ไม่มี error ตอนกดบันทึก
      field('เลข WBS', v.wbs, { placeholder: 'เช่น C-70-OH-0003', optional: true }),
      field('เลขโครงข่าย', v.net, { placeholder: 'เช่น 60002103', optional: true }), field('เลขกิจกรรม', v.act, { placeholder: 'เช่น 0010', optional: true })])], 16),
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
    col('Section', [await sectionLabel('รายละเอียดแผน'), kv([['ชื่อแผน', p[1]], ['ประจำปีงบประมาณ', '25' + p[2].slice(2, 4)], ['วงเงินอนุมัติ (บาท)', p[3]], ['จำนวนรถที่ Overhaul', p[5] + ' คัน'],
      ['วันที่สร้าง', p[7]], ['เลข WBS (ศูนย์ต้นทุน)', p[2]], ['เลขโครงข่าย', '60001234'], ['เลขกิจกรรม', '0010']])], 16),
    col('Section', [await sectionLabel('เอกสาร'), row('Row', [await upload('หนังสืออนุมัติหลักการ', [{ name: 'หนังสืออนุมัติหลักการ-' + p[0] + '.pdf', size: '822 KB' }], { readonly: true }),
      await upload('เอกสารอนุมัติงบ', [{ name: 'เอกสารอนุมัติงบ-' + p[0] + '.pdf', size: '601 KB' }], { readonly: true })])], 16),
  ];
  const poSec = col('Section', [await sectionLabel('Purchase Order', { badge: pos.length, buttons: [{ kind: 'Primary button', text: 'PO', icon: 'add-24-300-round' }] })], 16);
  if (pos.length) add(poSec, await tbl([['หมายเลข PO', 180, 'Lead text'], ['ชื่อ PO', 0], ['ศูนย์บริการ/อู่', 400], ['จำนวนรถ', 140], ['', 60]], pos.map(r => [r[0], r[1], r[2], r[3], { menu: 1 }])), 'h');
  else { const es = inst('Empty state/Data empty'); add(poSec, es, 'h'); await text(es, 'Text', 'ยังไม่มี Purchase Order'); await text(es, 'Supporting text', 'เพิ่ม PO เพื่อเลือกรถที่จะเข้า Overhaul และเริ่มงานรายคัน');
    const a = find(es, 'Actions'); if (a) a.visible = false; }
  sections.push(poSec);
  const partSec = col('Section', [await sectionLabel('อะไหล่จากคลัง', { buttons: [{ kind: 'Secondary button', text: 'เบิก', icon: 'add-24-300-round' }] })], 16);
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
    col('Section', [await sectionLabel('รายละเอียด Purchase Order'), kv([['ชื่อแผน', PLANS[4][1]], ['ชื่อ Purchase Order', 'ซ่อมระบบเครื่องยนต์'], ['ศูนย์บริการ/อู่', 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด'], ['เบอร์โทรอู่', '02-111-2201'], ['ที่อยู่', 'เขตบางนา กรุงเทพฯ']])], 16),
    col('Section', [await sectionLabel('เอกสาร'), row('Row', [await upload('ใบสั่งจ้าง', [{ name: 'ใบสั่งจ้าง-PO-690101.pdf', size: '500 KB' }], { readonly: true }), frame('Spacer', 'VERTICAL')])], 16),
    col('Section', [await sectionLabel('รายการรถ', { badge: CARS.length }), await tbl([['ทะเบียน', 180, 'Lead text'], ['ยี่ห้อ/รุ่น · ประเภท', 0], ['เลขไมล์ (กม.)', 150], ['อายุการใช้งาน', 150], ['สถานะงาน', 260, 'Badge'], ['', 120]],
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
/* นัดหมาย (desktop) = instance ของ RepairAppointmentStep — component ในไฟล์ Maintain-D หน้า Design (ฟอร์มนัดของงานซ่อม)
   เจ้าของงานสั่ง 19 ต.ค. 2569: "การนัดหมายเข้าซ่อมอยากให้ใช้แบบนี้ เพราะเรื่องการซ่อมบำรุงใช้แบบนี้ โดย section รูปแบบการซ่อมไม่ต้องมี" (RepairMethod = false)
   variant: ฟอร์ม Type=In · State=Default/Filled · รอตอบกลับ Type=Wating · ปฏิเสธ Type=In State=ReturnReason (ผลตอบกลับ + ฟอร์มส่งนัดใหม่)
   ช่องของงานซ่อม → ช่องของ Overhaul (userflow S7/S13): ช่วงเวลาที่รับมอบรถ → ช่วงวันนำรถเข้า/นัดรับรถ · ช่างซ่อม → ผู้ประสานงาน (กบค.) ·
   เบอร์ผู้รับมอบรถ → เบอร์โทรผู้ประสานงาน (กบค.) · สถานที่รับรถ → ศูนย์บริการ/อู่ (ค่าจาก PO) · ไม่มีช่องหมายเหตุ (component ไม่มี) · mobile: component ไม่มี variant มือถือ ⇒ ใช้แบบเดิม */
const COORD = ['นายวิชัย ทองดี', 'วิศวกร กบค.', '02-590-9123'];
const REJECT_NOTE = 'รถติดภารกิจซ่อมบำรุงสายส่ง ขอเลื่อนเป็นสัปดาห์ถัดไป';
function repairAppt(ret, kind, o) {
  o = o || {};
  const filled = !!o.coord || kind === 'rejected';
  const a = inst('RepairAppointmentStep', kind === 'wait' ? { Type: 'Wating', State: 'Default' } : { Type: 'In', State: kind === 'rejected' ? 'ReturnReason' : filled ? 'Filled' : 'Default' }, { RepairMethod: false });
  a.name = 'RepairAppointmentStep';
  if (kind === 'wait') return { node: a };
  const sec = find(a, 'Appointment section');
  const box = sec && sec.children.find(c => c.name === 'Container');
  const [date, search, phone] = box ? box.children : [];
  const area = sec && sec.children.find(c => c.name === 'Text area');
  const lbl = (n, t) => { if (!n) return; setProps(n, { 'Label text': t, Optional: false, 'Info icon': false }); const l = find(n, 'Input label'); if (l) setProps(l, { 'Label text': t, Optional: false, 'Info icon': false }); };
  const err = (n, t) => { if (n && o.errors) setProps(n, { State: 'Error', Helper: true, 'Helper text': t }); };
  const d1 = o.d1 || (kind === 'rejected' ? o.r1 : ''), d2 = o.d2 || (kind === 'rejected' ? o.r2 : '');
  if (date) { lbl(date, ret ? 'ช่วงวันนัดรับรถ' : 'ช่วงวันนำรถเข้า'); setProps(date, { Text: d1 ? d1 + ' - ' + d2 : 'เลือกวันที่เริ่มต้น - วันที่สิ้นสุด' }); err(date, ret ? 'กรุณาเลือกช่วงวันนัดรับรถ' : 'กรุณาเลือกช่วงวันนำรถเข้า'); }
  const dd = search && (search.name === 'Input dropdown' ? search : find(search, 'Input dropdown'));
  if (dd) {
    lbl(dd, 'ผู้ประสานงาน (กบค.)');
    setProps(dd, filled ? { Text: COORD[0], Supporting: true, 'Supporting text': COORD[1] } : { Text: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', Supporting: false });
    if (o.open) setProps(dd, { State: 'Focused' });
    err(dd, 'กรุณาเลือกผู้ประสานงาน');
  }
  if (phone) { lbl(phone, 'เบอร์โทรผู้ประสานงาน (กบค.)'); setProps(phone, { Text: filled ? COORD[2] : 'แสดงเมื่อเลือกผู้ประสานงาน' }); }
  if (area) { lbl(area, 'ศูนย์บริการ/อู่' + (ret ? ' (ค่าตั้งต้นจาก PO)' : '')); setProps(area, { Text: VENDOR[0] + ' · ' + VENDOR[1] + ' · ' + VENDOR[2], 'Show Placeholder': false }); }
  if (kind === 'rejected') {
    const it = find(a, '_Content item base');
    if (it) setProps(it, { Label: 'เหตุผลการปฏิเสธ', Text: REJECT_NOTE, Supporting: false, 'Leading icon': false });
  }
  return { node: a, coord: dd };
}
async function apptForm(ret, o) {
  o = o || {};
  if (!MOB && INDEX.has('RepairAppointmentStep')) {
    const r = repairAppt(ret, 'form', o);
    const nodes = [r.node, btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งนัดหมาย', { size: 'lg' }]])];
    nodes._coord = r.coord && (r.coord.findOne(n => n.name === 'Container') || r.coord);
    return nodes;
  }
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
  if (!MOB && INDEX.has('RepairAppointmentStep')) return [repairAppt(ret, 'wait').node];   // Type=Wating: "รอตอบกลับจากหน่วยงาน" + ปุ่มแก้ไขนัดหมายในตัว
  return [col('Section', [await section(ret ? 'นัดหมายรับรถ' : 'นัดหมายนำรถเข้าอู่'),
    alertBox('Info', 'รอหน่วยงานเจ้าของรถตอบกลับ', 'ส่งนัดหมายแล้ว 19/10/2569 · แก้ไขนัดหมายได้จนกว่าหน่วยงานจะตอบรับ'), apptKv(ret, d1, d2)], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Secondary button', 'แก้ไขนัดหมาย', { size: 'lg' }]])];
}
async function apptRejected(ret, d1, d2) {
  if (!MOB && INDEX.has('RepairAppointmentStep')) return [repairAppt(ret, 'rejected', { r1: d1, r2: d2 }).node, btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งนัดหมาย', { size: 'lg' }]])];
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
  return [col('Section', [await section('รายการตรวจสอบก่อนซ่อม'), await tbl([['รายการตรวจสอบ', 0], ['หมายเหตุ', 420]], CHECKLIST.map(c => [{ check: !!done, text: c }, '—']))], 16),
    col('Section', [await section('ลงนามรับรถ'), row('Row', [await sign('กบค.', 'นายวิชัย ทองดี'), await sign('หน่วยงานเจ้าของรถ', 'นายประวิทย์ แสงทอง')])], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันรับรถ', { size: 'lg' }]])];
}
const LOGS = [['20/10/2569 09:30 น.', 'รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน'], ['05/11/2569 14:00 น.', 'เปลี่ยนชุดลูกสูบและแหวน ประกอบกลับ']];
async function logs(list) {
  const sec = col('Section', [await section('รายละเอียดการติดตาม', { buttons: [{ kind: 'Secondary button', text: 'ความคืบหน้า', icon: 'add-24-300-round' }] })], 16);
  if (list.length) add(sec, await tbl([['วันที่/เวลา', 220], ['รายละเอียด', 0], ['', 104]], list.map(l => [l[0], l[1], { icons: list.length > 1 ? ['stylus-24-300-round', 'delete-24-300-round'] : ['stylus-24-300-round'] }])), 'h');
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
  if (parts.length) add(sec, await tbl([['ชื่ออะไหล่', 0], ['จำนวน', 160], ['หน่วย', 160]].concat(closed ? [] : [['', 72]]), parts.map(p => closed ? p : p.concat([{ icons: ['delete-24-300-round'] }]))), 'h');
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
      comboAt(s, (c.findOne && c.findOne(x => x.name === 'Container')) || c, [['นายวิชัย ทองดี', 'วิศวกร กบค. · 02-590-9123'], ['นางสาวกนกวรรณ ใจมั่น', 'พนักงานช่าง กบค. · 02-590-9124']]); return s; }],
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

/* แต่งจอตามรีวิว 19 ต.ค. 2569 (ใช้ทั้งตอนสร้างและปุ่มแก้เฉพาะจุด): ปิด Info icon ของ Input label · กล่องแสดงข้อมูล (display) */
async function polish(root) {
  let info = 0, disp = 0;
  for (const l of root.findAll(n => n.type === 'INSTANCE' && n.name === 'Input label')) {
    const cp = l.componentProperties || {}, k = Object.keys(cp).find(x => x.split('#')[0] === 'Info icon');
    if (k && cp[k].value !== false) { setProps(l, { 'Info icon': false }); info++; }
  }
  for (const n of root.findAll(n => n.type === 'INSTANCE' && (n.name === 'Text input' || n.name === 'Input dropdown' || n.name === 'Text area'))) {
    const cp = n.componentProperties || {}, k = Object.keys(cp).find(x => x.split('#')[0] === 'Info icon');
    if (k && cp[k].value !== false) { setProps(n, { 'Info icon': false }); info++; }
  }
  for (const b of root.findAll(n => n.type === 'FRAME' && n.name === 'Content item' && n.children.some(c => c.name === 'Content item row'))) { await displayBox(b); disp++; }
  return { info, disp };
}

function reportOversize() {
  if (STEP_SHORT.length) { log('· Progress steps ของไลบรารีมี ' + STEP_SHORT[0] + ' ช่อง แต่หน้างานมี ' + STEPS.length + ' ขั้น ⇒ ' + STEP_SHORT.length + ' จอยังวาง Horizontal step item ทีละขั้น — เพิ่มช่องใน component แล้วกด "แก้ตามรีวิว" อีกรอบ จะสลับให้เอง'); STEP_SHORT.length = 0; }
  if (!OVERSIZE.length) return;
  const by = {}; OVERSIZE.forEach(x => { by[x] = (by[x] || 0) + 1; });
  log('· ตารางที่ใหญ่กว่า component Table ของไลบรารี (8 คอลัมน์ × 10 แถว) คงแบบประกอบเองไว้ ' + OVERSIZE.length + ' ตาราง: ' + Object.keys(by).map(k => k + ' ×' + by[k]).join(' · ') + ' — รอเจ้าของงานเคาะ');
  OVERSIZE.length = 0;
}


/* ---------- จัดวางจอแบบตาราง flow ของทีมออกแบบ (เจ้าของงานสั่ง 20 ต.ค. 2569: "ต่อไปสร้างให้ทำแบบนี้ จนกว่าจะมีการเปลี่ยนแปลง") ----------
   แถบตัวอักษร (Header › State=Default ดำ) → แถบย่อย (State=Sub Flow เทา) → ป้าย state รายคอลัมน์ (State=Sub Flow 2 ฟ้า)
   → แถว Desktop (1440) → แถว Mobile (402) ใต้คอลัมน์เดียวกัน · ป้ายข้างซ้าย = component "Component 1" ของทีมออกแบบ (Type=Header "Device" · Desktop · Mobile)
   ตัวอย่างต้นแบบ: หน้า Flow การซ่อม ไฟล์ Maintain-D (B นัดหมายวันซ่อม › B1 เข้าซ่อมที่… › B1.1 Default …) · ป้ายทุกตัวชื่อ "<prefix> · …" ปลั๊กอินล้างตอนรันซ้ำ
   Header/State เป็น component จากอีกไลบรารี (หาได้จาก instance ในไฟล์) — เปิดไม่ได้ → วาดแถบธรรมดาสีเดียวกัน (อยู่นอกจอ ไม่กระทบกติกา "ทุกชิ้นในจอเป็น instance") */
const GRID = { side: 300, gap: 80, colW: 1440, colGap: 200, rowGap: 160, groupGap: 400, barH: 120, stateW: 344, mobW: 402, deskH: 1024, mobH: 874 };
const BAR_FILL = { Default: '#101828', 'Sub Flow': '#667085', 'Sub Flow 2': '#9CACCC' };
let HEADER_BROKEN = false;   // แถบ Header ของทีมออกแบบใส่ข้อความไม่ได้ (ฟอนต์หาย) → ใช้แถบธรรมดาตลอดรอบ
const rgbOf = (hex) => ({ r: parseInt(hex.slice(1, 3), 16) / 255, g: parseInt(hex.slice(3, 5), 16) / 255, b: parseInt(hex.slice(5, 7), 16) / 255 });
let LABEL_FONT;
async function labelText(chars, size, hex) {
  if (!LABEL_FONT) LABEL_FONT = (await fallbackFont()) || { family: 'Inter', style: 'Regular' };
  const t = figma.createText(); CREATED.push(t);
  t.fontName = LABEL_FONT; t.fontSize = size; t.characters = chars; t.fills = [{ type: 'SOLID', color: rgbOf(hex) }];
  return t;
}
function fixed(f, w, h) { f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; f.resize(w, h); return f; }
async function flowBar(prefix, code, title, state, width) {
  let bar = null;
  if (INDEX.has('Header') && !HEADER_BROKEN) {
    bar = inst('Header', { Type: 'Subheader' });
    const st = find(bar, 'State');
    if (st) setProps(st, { State: state });
    // Flow เป็น property ข้อความที่ผูกฟอนต์ของ component (LINE Seed Sans) — ตั้งตัวอักษรตรงๆ ผ่าน text() ที่สลับฟอนต์สำรองให้เมื่อเครื่องไม่มี
    const okCode = st ? await text(st, 'Text', code) : false;
    const det = find(bar, 'Detail'); const ts = det ? det.children.filter(c => c.type === 'TEXT') : [];
    const okTitle = ts[0] ? await text(det, ts[0], title) : false;
    if (ts[1]) ts[1].visible = false;   // บรรทัด "เงื่อนไข" ของทีมออกแบบ — ไม่ใช้
    if (!(okCode && okTitle)) {   // ใส่ข้อความไม่ได้ (ฟอนต์/โครง) → ป้ายจะไม่ตรง scenario ⇒ ถอยไปแถบธรรมดาทั้งชุด
      try { bar.remove(); } catch (e) { /* ลบไม่ได้ ปล่อย */ }
      bar = null; HEADER_BROKEN = true;
      log('⚠ แถบ Header ของทีมออกแบบใส่ข้อความไม่ได้ (ฟอนต์ของ component ไม่มีในเครื่อง) — ใช้แถบธรรมดาสีเดียวกันแทนทั้งชุด');
    } else { try { bar.resize(width, bar.height); } catch (e) { warn('ปรับกว้างแถบ ' + code, e); } }
  }
  if (!bar) {
    bar = fixed(frame('Header', 'HORIZONTAL'), width, GRID.barH);
    const st = fixed(frame('State', 'HORIZONTAL', { fill: rgbOf(BAR_FILL[state] || BAR_FILL.Default), pad: [0, 40] }), GRID.stateW, GRID.barH);
    st.primaryAxisAlignItems = 'CENTER'; st.counterAxisAlignItems = 'CENTER'; st.appendChild(await labelText(code, 64, '#FFFFFF')); bar.appendChild(st);
    const det = frame('Detail', 'HORIZONTAL', { fill: WHITE, pad: [0, 40] }); det.counterAxisAlignItems = 'CENTER'; bar.appendChild(det); det.layoutGrow = 1; det.layoutSizingVertical = 'FILL';
    det.appendChild(await labelText(title, 48, '#101828'));
  }
  bar.name = prefix + ' · ' + code + ' ' + title;
  return bar;
}
/* ป้ายข้างจอ (Device · Desktop · Mobile) — เจ้าของงานสั่ง 20 ต.ค. 2569: อ่านจาก component set "Device Type" ของทีมออกแบบ (property Type · กว้าง 300 · พื้น #667085)
   ชื่อ variant จับแบบไม่สนตัวพิมพ์ตาม DEVICE_ALIAS · ไม่พบ set หรือไม่มี variant นั้น → ถอยไป "Component 1" (ชุดเก่า) → กรอบธรรมดา */
const DEVICE_ALIAS = { Header: ['device', 'header', 'label'], Desktop: ['desktop'], Mobile: ['mobile'], Tablet: ['tablet'] };
function deviceVariant(kind) {   // → { key, value } ของ variant ใน Device Type ที่ตรง kind · null = ไม่มี
  const set = INDEX.get('Device Type'); if (!set || set.type !== 'COMPONENT_SET') return null;
  const want = DEVICE_ALIAS[kind] || [String(kind).toLowerCase()];
  for (const c of set.children) {
    if (c.type !== 'COMPONENT') continue;
    const vp = c.variantProperties || {};
    for (const k of Object.keys(vp)) if (want.indexOf(String(vp[k]).trim().toLowerCase()) >= 0) return { key: k, value: vp[k] };
  }
  return null;
}
function deviceSetInfo() {   // ข้อความรายงานในหน้าต่างปลั๊กอิน (ปุ่มเช็ค + ตอนสร้าง)
  const set = INDEX.get('Device Type');
  if (!set) return 'ป้ายข้างจอ: ไม่พบ component "Device Type" ในไฟล์ — ' + (INDEX.has('Component 1') ? 'ใช้ "Component 1" (ชุดเก่า) แทน' : 'วาดป้ายธรรมดาแทน');
  const vals = set.type === 'COMPONENT_SET' ? set.children.filter(c => c.type === 'COMPONENT').map(c => Object.keys(c.variantProperties || {}).map(k => k + '=' + c.variantProperties[k]).join(',')).join(' · ') : '(component เดี่ยว ไม่มี variant)';
  const miss = ['Header', 'Desktop', 'Mobile'].filter(k => !deviceVariant(k));
  return 'ป้ายข้างจอ: component "Device Type" [' + vals + ']' + (miss.length ? ' ⚠ ไม่มี variant สำหรับ ' + miss.join(', ') + ' — ป้ายนั้นถอยไป Component 1/กรอบธรรมดา' : ' ✓ ใช้ Device/Desktop/Mobile ครบ');
}
async function deviceLabel(prefix, type, height) {
  let n; const dv = deviceVariant(type);
  if (dv) { n = inst('Device Type', { [dv.key]: dv.value }); try { n.resize(GRID.side, height); } catch (e) { warn('ปรับสูงป้าย ' + type, e); } }
  else if (INDEX.has('Component 1')) { n = inst('Component 1', { Type: type }); try { n.resize(GRID.side, height); } catch (e) { warn('ปรับสูงป้าย ' + type, e); } }
  else { n = fixed(frame('Device', 'VERTICAL', { fill: rgbOf('#667085') }), GRID.side, height); n.primaryAxisAlignItems = 'CENTER'; n.counterAxisAlignItems = 'CENTER'; n.appendChild(await labelText(type === 'Header' ? 'Device' : type, 48, '#FFFFFF')); }
  n.name = prefix + ' · ' + (type === 'Header' ? 'Device' : type);
  return n;
}

/* หน้าปลายทาง = หน้าใหม่ทุกครั้ง ไม่แตะชุดเดิม (เจ้าของงานสั่ง 20 ต.ค. 2569 "สร้างใหม่เลย ไม่รบกวนของเดิม"):
   ใช้หน้า <base>-N ที่ยังว่าง (ไม่มีเฟรม/ป้ายของปลั๊กอิน) · ไม่มีก็สร้าง <base>-(N+1) · สร้างหน้าไม่ได้ (แพลนจำกัด) → หน้าปัจจุบัน วางต่อใต้ของเดิม ไม่ลบอะไร */
async function targetPage(base, prefix) {
  const lower = (p) => p.name.trim().toLowerCase();
  const re = new RegExp('^' + base + '-(\\d+)$');
  const pages = figma.root.children.filter(p => re.test(lower(p)));
  const mine = (n) => n.name.indexOf(prefix + ' / ') === 0 || n.name.indexOf(prefix + ' · ') === 0;
  const empty = pages.find(p => !p.children.some(mine));
  if (empty) return { page: empty, fresh: true };
  const next = pages.reduce((m, p) => Math.max(m, +lower(p).match(re)[1]), 0) + 1;
  try { const p = figma.createPage(); p.name = base + '-' + next; return { page: p, fresh: true }; }
  catch (e) { return { page: figma.currentPage, fresh: false }; }
}

/* GROUPS = [{ code: 'B', title: 'แผน Overhaul', subs: [{ code: 'B1', title: 'กบค. สร้างแผน', tag: 'S1', screens: [[label, fn], …] }] }]
   fn() สร้างจอตามตัวแปร MOB · จอชื่อ "<prefix> / B1.2 · S1 — <label>[ · mobile]" · คืน { made, y } */
async function buildGrid(page, prefix, GROUPS, y0, total, opts) {
  opts = opts || {};   // opts.reuse(sub, i, label, mob) → เฟรมเดิมที่จะย้ายเข้าผังแทนการสร้างใหม่ (ปุ่ม "จัดวางใหม่" · ที่แก้มือไว้ไม่หาย)
  const made = []; let y = y0; const x0 = GRID.side + GRID.gap; const pitch = GRID.colW + GRID.colGap; const skipped = [];
  const put = (n, x, yy) => { page.insertChild(0, n); n.x = x; n.y = yy; return n; };
  for (const g of GROUPS) {
    const nCols = Math.max(...g.subs.map(s => s.screens.length));
    CREATED = []; put(await flowBar(prefix, g.code, g.title, 'Default', nCols * GRID.colW + (nCols - 1) * GRID.colGap), x0, y);
    y += GRID.barH + GRID.gap;
    for (const sub of g.subs) {
      const n = sub.screens.length, w = n * GRID.colW + (n - 1) * GRID.colGap;
      if (sub.code !== g.code) {   // แถบย่อย (B1 B2) เฉพาะเมื่อกลุ่มมีหลาย scenario · เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก ⇒ ไม่มีแถบย่อย ป้าย state = A.1 A.2 …
        put(await flowBar(prefix, sub.code, sub.title, 'Sub Flow', w), x0, y);
        y += GRID.barH + GRID.gap;
      }
      put(await deviceLabel(prefix, 'Header', GRID.barH), 0, y);
      for (const [i, [label]] of sub.screens.entries()) put(await flowBar(prefix, sub.code + '.' + (i + 1), label, 'Sub Flow 2', GRID.colW), x0 + i * pitch, y);
      y += GRID.barH + GRID.gap;
      for (const mob of [false, true]) {
        MOB = mob; let h = 0; const rowY = y;
        for (const [i, [label, fn]] of sub.screens.entries()) {
          const x = x0 + i * pitch;
          CREATED = []; PLACE = { x, y: rowY };   // เฟรมจอไปอยู่ตำแหน่งจริงทันทีที่สร้าง · ชิ้นที่สร้างระหว่างทางถูกติดตามไว้
          try {
            const name = prefix + ' / ' + sub.code + '.' + (i + 1) + ' · ' + sub.tag + ' — ' + label + (mob ? ' · mobile' : '');
            let s = opts.reuse ? opts.reuse(sub, i, label, mob) : null;
            if (opts.reuse && !s) { skipped.push(name); CREATED = []; PLACE = null; continue; }   // โหมดจัดวางใหม่: ไม่มีจอนี้บนหน้า → เว้นช่องไว้ ไม่สร้างใหม่
            if (!s) { s = await fn(); stripDividers(s); await polish(s); }
            s.name = name;
            put(s, x, rowY); h = Math.max(h, s.height); made.push(s);
            log('  · ' + made.length + '/' + total + ' ' + s.name);
          } catch (e) {
            warn(sub.code + '.' + (i + 1) + ' ' + label + (mob ? ' (mobile)' : ''), e);
            const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้างจากจอที่พัง ' + k + ' ชิ้น');
          }
          CREATED = []; PLACE = null;
        }
        MOB = false;
        const rowH = Math.max(h, mob ? GRID.mobH : GRID.deskH);
        CREATED = []; put(await deviceLabel(prefix, mob ? 'Mobile' : 'Desktop', rowH), 0, rowY);
        y = rowY + rowH + GRID.rowGap;
      }
      y += GRID.groupGap - GRID.rowGap;
      log('✓ ' + sub.code + ' ' + sub.title + ' (' + n + ' state)');
    }
  }
  CREATED = [];
  if (skipped.length) log('· ไม่พบจอบนหน้านี้ ' + skipped.length + ' จอ (เว้นช่องไว้ — กดสร้างใหม่ทั้งชุดถ้าต้องการ): ' + skipped.slice(0, 5).map(n => n.split(' / ')[1]).join(' · ') + (skipped.length > 5 ? ' …' : ''));
  return { made, y, skipped };
}
/* ปุ่ม "ปิด Clip content" (เจ้าของงานสั่ง 20 ต.ค. 2569 "clip content เอาออก") — ไม่สร้างจอใหม่: ปิด Clip content ของเฟรมจอ "OH2 /" ทุกจอบนหน้าปัจจุบัน
   และกรอบ Progress steps ที่ประกอบเอง (ชุดใหม่ปิดให้ตั้งแต่สร้าง) */
async function patchClip() {
  const page = figma.currentPage;
  const scrs = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('OH2 / ') === 0);
  if (!scrs.length) { log('ไม่พบเฟรม "OH2 /" บนหน้านี้ — เปิดหน้า overhaul-N ที่มีจอก่อน'); return; }
  let n = 0, ps = 0;
  for (const s of scrs) {
    if (s.clipsContent) { s.clipsContent = false; n++; }
    for (const f of s.findAll(x => x.type === 'FRAME' && x.name === 'Progress steps' && x.clipsContent)) { f.clipsContent = false; ps++; }
  }
  log('ปิด Clip content แล้ว: เฟรมจอ ' + n + ' จาก ' + scrs.length + ' จอ · กรอบ Progress steps ' + ps + ' กรอบ · ไม่ได้สร้างหรือย้ายจอ');
}
/* ปุ่ม "เปลี่ยนป้ายข้างจอเป็น Device Type" (20 ต.ค. 2569) — ไม่สร้างจอใหม่ ไม่ย้ายอะไร: แทนป้าย "OH2 · Device/Desktop/Mobile" บนหน้าปัจจุบัน
   ด้วย instance ของ Device Type ที่ตำแหน่ง/ขนาดเดิม · ป้ายที่เป็น Device Type อยู่แล้วข้าม · ไม่พบ component → ไม่เปลี่ยนอะไร */
async function patchDevice() {
  await resolveAll(['Device Type', 'Component 1']);
  log(deviceSetInfo());
  if (!INDEX.has('Device Type')) { log('ไม่พบ component "Device Type" ในไฟล์นี้ — ไม่เปลี่ยนอะไร (ลาก component set Device Type มาไว้ในไฟล์นี้ก่อน)'); return; }
  const page = figma.currentPage;
  const KIND = { Device: 'Header', Desktop: 'Desktop', Mobile: 'Mobile' };
  const olds = page.children.filter(n => /^OH2 · (Device|Desktop|Mobile)$/.test(n.name));
  if (!olds.length) { log('ไม่พบป้าย "OH2 · Device/Desktop/Mobile" บนหน้านี้ — เปิดหน้า overhaul-N ที่มีจอก่อน'); return; }
  let n = 0, same = 0;
  for (const old of olds) {
    const kind = KIND[old.name.split(' · ')[1]];
    if (old.type === 'INSTANCE') { try { const mc = await old.getMainComponentAsync(); if (mc && holderOf(mc).name === 'Device Type') { same++; continue; } } catch (e) { /* เช็คไม่ได้ → เปลี่ยน */ } }
    if (!deviceVariant(kind)) { warn('ป้าย ' + old.name, 'Device Type ไม่มี variant สำหรับ ' + kind); continue; }
    CREATED = [];
    const fresh = await deviceLabel('OH2', kind, old.height);
    page.insertChild(page.children.indexOf(old), fresh); fresh.x = old.x; fresh.y = old.y;
    old.remove(); n++;
    CREATED = [];
  }
  log('เปลี่ยนป้ายข้างจอเป็น Device Type ' + n + ' ป้าย' + (same ? ' · เป็น Device Type อยู่แล้ว ' + same + ' ป้าย' : '') + ' · ตำแหน่งและขนาดเดิม · ไม่ได้สร้างหรือย้ายจอ');
  if (errors.length) log('⚠ เตือน ' + errors.length + ' จุด — ดูรายละเอียดด้านบน');
}
/* ปุ่ม "จัดวางใหม่เป็นตาราง flow" — ย้ายเฟรมจอที่มีอยู่บนหน้าปัจจุบันเข้าผัง R19 โดยไม่สร้างจอใหม่ (ที่แก้มือไว้ไม่หาย)
   จับคู่จอจากชื่อ "<prefix> / <tag> — <state>" (ชื่อเดิม) หรือ "<prefix> / B1.2 · <tag> — <state>" (ชื่อใหม่) · ป้ายสร้างใหม่ทุกครั้ง · จอที่ไม่อยู่ในผังย้ายไปแถวท้าย */
async function patchLayout(page, prefix, GROUPS) {
  const frames = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(prefix + ' / ') === 0);
  if (!frames.length) { log('ไม่พบเฟรม "' + prefix + ' /" บนหน้านี้ — ใช้ปุ่มสร้างทั้งชุดแทน'); return; }
  const strip = (n) => n.replace(new RegExp('^' + prefix + ' / (?:[A-Z]\\d*\\.\\d+ · )?'), '');
  const byKey = new Map(); frames.forEach(f => { const k = strip(f.name); if (!byKey.has(k)) byKey.set(k, f); });
  const used = new Set();
  const reuse = (sub, i, label, mob) => {   // ชื่อตรง → ไม่ตรงก็เอาจอของ scenario เดียวกันที่ลงท้ายด้วย state เดียวกัน (ป้าย state เคยเปลี่ยนถ้อยคำ)
    const suf = (mob ? ' · mobile' : '');
    let f = byKey.get(sub.tag + ' — ' + label + suf) || null;
    if (!f) for (const [k, v] of byKey) { if (!used.has(v) && k.indexOf(sub.tag + ' — ') === 0 && k.endsWith(' — ' + label + suf) === true) { f = v; break; } }
    if (!f) for (const [k, v] of byKey) { if (!used.has(v) && k.indexOf(sub.tag + ' — ') === 0 && (mob ? / · mobile$/.test(k) : !/ · mobile$/.test(k)) && k.indexOf(label) >= 0) { f = v; break; } }
    if (f) used.add(f);
    return f;
  };
  page.children.filter(n => n.name.indexOf(prefix + ' · ') === 0).forEach(n => n.remove());
  const swept = sweepOrphans(page, new Set(NEEDED)); if (swept) log('เก็บชิ้นส่วนที่ค้าง ' + swept + ' ชิ้น');
  const y0 = Math.min(...frames.map(f => f.y));
  log(INDEX.has('Header') ? 'แถบรหัส flow: component Header ของทีมออกแบบ' : 'แถบรหัส flow: ไม่พบ component Header ในไฟล์ — วาดแถบธรรมดาสีเดียวกันแทน');
  const r = await buildGrid(page, prefix, GROUPS, y0, frames.length, { reuse });
  const rest = frames.filter(f => !used.has(f));
  if (rest.length) {   // จอที่ไม่อยู่ในผัง (ชื่อไม่ตรง scenario/state ใด) — ย้ายไปแถวท้าย ไม่ลบ
    let x = GRID.side + GRID.gap, yy = r.y;
    page.insertChild(0, await flowBar(prefix, '?', 'จอที่ไม่อยู่ในผัง (ชื่อไม่ตรง) ' + rest.length + ' จอ', 'Sub Flow', Math.max(GRID.colW, rest.length * (GRID.colW + GRID.colGap) - GRID.colGap)));
    page.children[0].x = x; page.children[0].y = yy; yy += GRID.barH + GRID.gap;
    rest.forEach(f => { f.x = x; f.y = yy; x += f.width + GRID.colGap; });
    log('· จอที่ไม่อยู่ในผัง ' + rest.length + ' จอ ย้ายไปแถวท้าย: ' + rest.slice(0, 4).map(f => f.name.split(' / ')[1]).join(' · ') + (rest.length > 4 ? ' …' : ''));
  }
  log('จัดวางใหม่แล้ว ' + r.made.length + ' จอ · ' + GROUPS.length + ' กลุ่ม · ไม่ได้สร้างจอใหม่' + (r.skipped.length ? ' · เว้นช่อง ' + r.skipped.length : ''));
}

/* ---------- กลุ่ม = scenario (เจ้าของงานเคาะ 20 ต.ค. 2569: "อยากแยก scenario ออกจากกัน และแยก mobile กับ desktop")
   ตัวอักษร = scenario (A รายการแผน · B S1 … O S14) · ป้าย state = A.1 A.2 … · แต่ละบล็อกมีแถว Desktop แล้วแถว Mobile ใต้คอลัมน์เดียวกัน · ไม่มีแถบย่อย ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GROUPS = SCENARIOS.map(([title, screens], i) => {
  const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  return { code, title: rest ? tag + ' ' + rest : title, subs: [{ code, title: rest || title, tag, screens }] };
});

/* ---------- บล็อก toast + notification (สเปก 16 · 20 ต.ค. 2569) — ชุดแยก สร้างบนหน้า overhaul-noti-N · รหัสบล็อก P (toast) · Q (notification) ต่อจาก A–O ---------- */
const NOTI_SCENARIOS = [
  ['toast · ผลของการกระทำ (Notification Success/Error ขวาล่าง หายเอง 4 วินาที · Error ค้างจนกดปิด)', [
    ['สำเร็จ บนหน้ารายการแผน', async () => { const s = await listScreen('toast สำเร็จ รายการแผน', { rows: [NEW_PLAN].concat(PLANS) }); await toast(s, { title: 'การสร้างแผน overhaul สำเร็จ', sub: 'แผน ' + NEW_PLAN[0] + ' ' + NEW_PLAN[1] }); return s; }],
    ['ไม่สำเร็จ บนฟอร์ม (ค้างจนกดปิด)', async () => { const s = await planForm('toast ไม่สำเร็จ ฟอร์ม', { values: FILLED }); await toast(s, { err: true, title: 'general error', sub: 'ลองอีกครั้ง หากยังไม่ได้ติดต่อผู้ดูแลระบบ' }); return s; }],
    ['สำเร็จ บนหน้างานรายคัน', async () => { const s = await job('toast สำเร็จ งานรายคัน', 'V2', () => apptWait(false, '22/10/2569', '24/10/2569')); await toast(s, { title: 'การสร้าง นัดหมาย สำเร็จ', sub: 'ทะเบียน 72-6648 สงขลา' }); return s; }],
    ['ไม่สำเร็จ บนหน้างานรายคัน', async () => { const s = await job('toast ไม่สำเร็จ งานรายคัน', 'V1', () => apptForm(false, { d1: '22/10/2569', d2: '24/10/2569', coord: 1 })); await toast(s, { err: true, title: 'ไม่สามารถสร้าง นัดหมาย', sub: 'ทะเบียน 72-6648 สงขลา ลองอีกครั้ง' }); return s; }]]],
  ['notification · ข่าวถึงอีกฝ่าย (กระดิ่ง Nav button Indicator + Notification card)', [
    ['ไม่มีแจ้งเตือนใหม่', async () => { const s = await listScreen('noti ไม่มีใหม่', { rows: PLANS }); bell(s, false); return s; }],
    ['มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)', async () => { const s = await listScreen('noti มีใหม่', { rows: PLANS }); bell(s, true); return s; }],
    ['เปิดแผงแจ้งเตือน (ฝั่ง กบค.)', async () => { const s = await listScreen('noti แผงเปิด', { rows: PLANS }); bell(s, true); await notiPanel(s, NOTI_ITEMS, '3 แจ้งเตือนใหม่'); return s; }],
    ['กดรายการ ไปหน้างานที่เกี่ยว', async () => { const s = await job('noti ปลายทาง', 'V3', () => apptRejected(false, '22/10/2569', '24/10/2569')); bell(s, false); return s; }]]],
];
const NOTI_GROUPS = NOTI_SCENARIOS.map(([title, screens], i) => {
  const code = LETTERS[15 + i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens }] };
});

/* ---------- หน้า 1 รายการแผน ฉบับหลัง CF จาก PO (Google Sheet แท็บ "1 รายการแผน" · อ่าน 20 ต.ค. 2569) — สร้างคู่กับฉบับที่ออกแบบไว้บนหน้า overhaul-cf-N ให้เห็นความต่าง
   mapping รายฟิลด์: Diagram/01-บำรุงรักษาตามวาระ/17-overhaul-cf-หน้า1-mapping.md ---------- */
const STATUS_CF = { P1: ['รอเลข PO', 'Gray'], P2: ['รอดำเนินการ', 'Info'], P3: ['เสร็จสิ้น', 'Success'] };   // PO: ยังไม่มี PO → รอเลข PO · ดำเนินการ → รอดำเนินการ
const SEARCH_CF = 'ค้นหาเลขแผน, ชื่อแผน, เลขที่งบประมาณ, ทะเบียนรถ';   // PO: เลขศูนย์ต้นทุน → เลขที่งบประมาณ (ค้นได้ทั้งศูนย์ต้นทุนและ WBS) + ค้นด้วยทะเบียนรถ
/* [เลขแผน, ชื่อแผน, ประเภทงบ, เลขที่งบประมาณ (SubText), ปีงบ, งบ, จำนวนรถ, ปิดงานแล้ว, รถรอติดตาม, สถานะ, วันที่สร้าง, ผู้แก้ไขล่าสุด, แก้ไขเมื่อ] — ข้อมูลจำลอง */
const PLANS_CF = [
  ['123460', 'Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้', 'งบลงทุน', 'WBS: I-70-Z-DPMXX.JM.0002', '2570', '21,500,000', '1', 0, '1', 'P2', '10 ต.ค. 2569', 'นายวิชัย ทองดี', '19 ต.ค. 2569 14:20'],
  ['123459', 'Overhaul ประจำปีงบ 2570 — รถเครน กฟน.1', 'งบลงทุน', 'WBS: I-70-Z-DPMXX.JM.0001', '2570', '12,400,000', '0', 0, '0', 'P1', '1 ต.ค. 2569', 'นางสาวกนกวรรณ ใจมั่น', '1 ต.ค. 2569 09:05'],
  ['123458', 'Overhaul ประจำปีงบ 2569 — รถเจาะหลุม', 'งบทำการ', 'ศูนย์ต้นทุน: C-69-OH-0103', '2569', '6,200,000', '0', 0, '0', 'P1', '2 ก.ย. 2569', 'นายวิชัย ทองดี', '2 ก.ย. 2569 16:40'],
  ['123457', 'Overhaul ประจำปีงบ 2569 — รถกระเช้า', 'งบลงทุน', 'WBS: I-69-Z-DPMXX.JM.0102', '2569', '8,500,000', '3', 1, '1', 'P2', '20 ส.ค. 2569', 'นายวิชัย ทองดี', '18 ต.ค. 2569 11:12'],
  ['123456', 'Overhaul ประจำปีงบ 2569 — รถเครน', 'งบลงทุน', 'WBS: I-69-Z-DPMXX.JM.0003', '2569', '10,000,000', '3', 2, '0', 'P2', '12 ส.ค. 2569', 'นางสาวกนกวรรณ ใจมั่น', '20 ต.ค. 2569 08:30'],
  ['123402', 'Overhaul ประจำปีงบ 2568 — รถกระเช้า', 'งบลงทุน', 'WBS: I-68-Z-DPMXX.JM.0102', '2568', '4,300,000', '1', 1, '0', 'P3', '1 ส.ค. 2568', 'นายวิชัย ทองดี', '30 พ.ย. 2568 10:00'],
  ['123401', 'Overhaul ประจำปีงบ 2568 — รถเครน', 'งบลงทุน', 'WBS: I-68-Z-DPMXX.JM.0101', '2568', '9,800,000', '2', 2, '0', 'P3', '15 ก.ค. 2568', 'นายวิชัย ทองดี', '20 ธ.ค. 2568 15:45'],
];
/* 12 คอลัมน์ตาม CF (เกิน component Table 8 คอลัมน์ ⇒ ประกอบเอง R8 รอเคาะ) · กว้างรวม ~1,500 เกินพื้นที่จอ 1440 — ตั้งใจให้เห็นว่าต้องเคาะว่าจะซ่อน/รวมคอลัมน์ไหน */
const PLAN_COLS_CF = [['เลขแผน', 92, 'Lead text', 'Down'], ['ชื่อแผน', 200, 'Text', 'Swap'], ['ประเภทงบ', 176, 'Text', 'Swap'], ['ปีงบประมาณ', 96], ['งบประมาณ (บาท)', 120], ['จำนวนรถที่ Overhaul', 112],
  ['ความคืบหน้า (ปิดงานแล้ว)', 170], ['รถรอติดตาม', 100], ['สถานะ', 120, 'Badge', 'Swap'], ['วันที่สร้าง', 110], ['แก้ไขล่าสุด', 168], ['', 56]];
const planRowCF = (p) => { const n = +p[6], d = +p[7];
  return [p[0], p[1], { text: p[2], sub: p[3] }, p[4], p[5], p[6], n ? { progress: Math.round(d / n * 100), text: d + '/' + n } : { text: '—', sub: 'ยังไม่มีรถใน PO' }, p[8], { pill: STATUS_CF[p[9]] }, p[10], { text: p[11], sub: p[12] }, { menu: 1 }]; };
const CF_LIST = { rows: PLANS_CF.slice(0, 5), cols: PLAN_COLS_CF, rowFn: planRowCF, placeholder: SEARCH_CF, pageOpt: { per: 5, total: PLANS_CF.length } };
const VEHICLE_TYPES = [['รถเครน'], ['รถกระเช้า'], ['รถเจาะหลุม'], ['รถขุดตัก'], ['รถพ่วงฉีดน้ำ']];
async function checkGroup(label, items) {   // Input label + Checkbox with badge ต่อรายการ (ใช้กับสถานะ และประเภทยานพาหนะที่ PO ขอเลือกหลายค่า)
  const st = col('Section', [], 12);
  const lb = inst('Input label'); add(st, lb, 'h'); await text(lb, 'Label', label); hide(lb, '(ถ้ามี)'); hide(lb, 'info-24-300-round'); hide(lb, 'Tertiary brand button');
  for (const [t, color] of items) { const cb = inst('Checkbox with badge'); st.appendChild(cb); const p = find(cb, 'Pill outline'); if (p) setProps(p, { Color: color || 'Gray', Text: t }); }
  return st;
}
/* ตัวกรองฉบับ CF: ปีงบประมาณ · สถานะ (ชื่อใหม่) · ประเภทยานพาหนะ (PO ขอ multiple select — ไลบรารีไม่มี dropdown หลายค่า ⇒ รายการ checkbox รอทีมออกแบบ)
   · งบประมาณ (PO ให้พิจารณา range slider — ไลบรารีไม่มี Slider ⇒ คง dropdown ช่วงวงเงิน รอเคาะ) · ตัดตัวกรอง "รถ" (ทะเบียน) และ "ศูนย์ต้นทุน" */
async function filterPanelCF(scr) {
  const content = [dropdown('ปีงบประมาณ', '2570'), await checkGroup('สถานะ', ['P1', 'P2', 'P3'].map(k => [STATUS_CF[k][0], STATUS_CF[k][1]])),
    await checkGroup('ประเภทยานพาหนะ (เลือกได้หลายค่า)', VEHICLE_TYPES), dropdown('งบประมาณ (ช่วงวงเงิน)', 'ไม่เกิน 5 ล้านบาท')];
  if (MOB) { await sheet(scr, { title: 'ตัวกรอง', action: 'ล้างตัวกรอง', content, ok: 'ตกลง' }); return; }
  overlay(scr, inst('Background overlay'), 0, 0).resize(1440, 1024);
  const panel = frame('Panel', 'VERTICAL', { gap: 24, fill: WHITE });
  overlay(scr, panel, 960, 0); panel.primaryAxisSizingMode = 'FIXED'; panel.counterAxisSizingMode = 'FIXED'; panel.resize(480, 1024);
  const hd = inst('Side panel header'); add(panel, hd, 'h'); hide(hd, 'Tabs');
  await text(hd, 'Text', 'ตัวกรอง'); await text(hd, 'Supporting text', 'กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ');
  const body = frame('Content', 'VERTICAL', { gap: 24, pad: [0, 24] }); add(panel, body, 'both');
  for (const n of content) add(body, n, 'h');
  const ft = inst('Side panel footer'); add(panel, ft, 'h');
  [['Tertiary brand button', 'ล้างตัวกรอง'], ['Secondary button', 'ยกเลิก'], ['Primary button', 'ตกลง']].forEach(([k, t]) => { const b = find(ft, k); if (b) setProps(b, { Text: t, 'Leading icon': false, 'Trailing icon': false }); });
}
const CF1_SCENARIOS = [
  ['เดิม · หน้า 1 รายการแผน ฉบับที่ออกแบบไว้ (ก่อน CF)', [
    ['รายการแผน', () => listScreen('เดิม รายการแผน', { rows: PLANS })],
    ['ตัวกรอง', async () => { const s = await listScreen('เดิม ตัวกรอง', { rows: PLANS }); await filterPanel(s); return s; }]]],
  ['CF · หน้า 1 รายการแผน หลัง PO confirm (ชีต "1 รายการแผน" อ่าน 20 ต.ค. 2569)', [
    ['รายการแผน (คอลัมน์ใหม่ · ชื่อสถานะใหม่ · pagination)', () => listScreen('CF รายการแผน', CF_LIST)],
    ['ตัวกรอง (ปีงบ · สถานะ · ประเภทยานพาหนะ · ช่วงวงเงิน)', async () => { const s = await listScreen('CF ตัวกรอง', CF_LIST); await filterPanelCF(s); return s; }],
    ['ค้นหา พิมพ์ 3 ตัวอักษร ขึ้น autocomplete', () => listScreen('CF ค้นหา', Object.assign({}, CF_LIST, { query: 'I-69', combo: [['WBS: I-69-Z-DPMXX.JM.0003', 'แผน 123456 Overhaul ประจำปีงบ 2569 — รถเครน'], ['WBS: I-69-Z-DPMXX.JM.0102', 'แผน 123457 Overhaul ประจำปีงบ 2569 — รถกระเช้า'], ['ศูนย์ต้นทุน: C-69-OH-0103', 'แผน 123458 Overhaul ประจำปีงบ 2569 — รถเจาะหลุม']] }))]]],
];
const CF1_GROUPS = CF1_SCENARIOS.map(([title, screens], i) => {
  const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens }] };
});
async function buildCF1() { await buildSet('overhaul-cf', CF1_SCENARIOS, CF1_GROUPS, 'หน้า 1 ก่อน/หลัง CF'); }

/* ---------- สร้างทั้งหมด ---------- */
async function build() { await buildSet('overhaul', SCENARIOS, GROUPS, 'scenario'); }
async function buildNoti() { await buildSet('overhaul-noti', NOTI_SCENARIOS, NOTI_GROUPS, 'toast/notification'); }
async function buildSet(base, SCEN, GRP, what) {
  errors.length = 0;
  const t0 = Date.now();
  log('นำเข้า component จากไลบรารี…');
  await resolveAll();
  log('นำเข้าเสร็จใน ' + Math.round((Date.now() - t0) / 1000) + ' วินาที · เริ่มสร้างจอ');
  await findStepRef();
  log(deviceSetInfo());
  // หน้าปลายทาง = หน้าใหม่ <base>-N ไม่แตะชุดเดิม (เจ้าของงานสั่ง 20 ต.ค. 2569 — ของเดิมบน overhaul-1 ถูกย้าย/แก้มือไว้)
  const tp = await targetPage(base, 'OH2');
  const page = tp.page;
  log(tp.fresh ? 'วางในหน้าใหม่ "' + page.name + '" — ชุดเดิมบนหน้าอื่นไม่ถูกแตะ' : '⚠ สร้างหน้าใหม่ไม่ได้ (แพลนจำกัดจำนวนหน้า) — วางต่อใต้ของเดิมในหน้า "' + page.name + '" ไม่ลบอะไร');
  await figma.setCurrentPageAsync(page);
  const swept = tp.fresh ? 0 : sweepOrphans(page, new Set(NEEDED)); if (swept) log('เก็บชิ้นส่วนที่ค้างจากรอบก่อน (ซ้อนอยู่ที่มุมหน้า) ' + swept + ' ชิ้น');
  let y = 0;
  page.children.forEach(n => { if (n.absoluteBoundingBox) y = Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + 400); });
  /* จัดวางแบบตาราง flow ของทีมออกแบบ (20 ต.ค. 2569): ตัวอักษร = หน้า/ขั้น · ตัวเลข = scenario · x.y = state · แถว Desktop แล้วแถว Mobile ใต้คอลัมน์เดียวกัน
     (เดิม: scenario ละแถว desktop–mobile คู่กัน) · ป้ายใช้ Header/State + Component 1 ของทีมออกแบบ · ไม่ใช้ section */
  const TOTAL = SCEN.reduce((a, x) => a + x[1].length, 0);
  log(INDEX.has('Header') ? 'แถบรหัส flow: component Header ของทีมออกแบบ' : 'แถบรหัส flow: ไม่พบ component Header ในไฟล์ — วาดแถบธรรมดาสีเดียวกันแทน');
  const { made } = await buildGrid(page, 'OH2', GRP, y, TOTAL * 2);
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
  log('สร้าง ' + made.length + ' จอ · ' + GRP.length + ' บล็อก ' + what + ' (' + GRP[0].code + '–' + GRP[GRP.length - 1].code + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓'));
  log('component ที่ใช้ (' + names.size + '): ' + [...names].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่ต้องสลับเป็นฟอนต์สำรอง (component ใช้ฟอนต์ที่เครื่องไม่มี) ' + FONT_SWAPPED + ' จุด — ฟอนต์ ' + (FALLBACK_FONT ? FALLBACK_FONT.family + ' ' + FALLBACK_FONT.style : '-'));
  reportOversize();
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
function findInstanceAncestor(n) { let p = n.parent; while (p) { if (p.type === 'INSTANCE') return p; p = p.parent; } return null; }

figma.ui.onmessage = async (msg) => {
  try {
    if (msg.type === 'build') await build();
    if (msg.type === 'build-noti') await buildNoti();
    if (msg.type === 'build-cf1') await buildCF1();
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
    if (msg.type === 'patch-device') await patchDevice();
    if (msg.type === 'patch-clip') await patchClip();
    if (msg.type === 'patch-layout') { await resolveAll(['Device Type', 'Component 1', 'Header']); log(deviceSetInfo()); await patchLayout(figma.currentPage, 'OH2', GROUPS); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
