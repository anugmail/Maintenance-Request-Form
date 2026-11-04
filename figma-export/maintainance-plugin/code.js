/* ⚠ ไฟล์นี้ประกอบอัตโนมัติจาก plugin-lib/core.js + maintainance-plugin/screens.js + Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md ด้วย build-plugin.js — แก้ที่ต้นทางแล้วรัน  node figma-export/build-plugin.js maintainance-plugin  (2026-11-04) */

/* ============================================================================
   plugin-lib/core.js — โค้ดส่วนกลางของปลั๊กอินสร้างจอจาก component จริง (แยกจาก overhaul2-plugin 20 ต.ค. 2569)
   ----------------------------------------------------------------------------
   ยกมาจาก overhaul2-plugin/code.js ฉบับ 19 ต.ค. 2569 (ตัดส่วนที่เป็นของ Overhaul: ข้อมูล · จอ · stepper · ปุ่มแก้เฉพาะจุด)
   ใช้ประกอบเป็น code.js ของปลั๊กอินแต่ละเรื่องด้วย  node figma-export/build-plugin.js <โฟลเดอร์ปลั๊กอิน>
   (Figma โหลด code.js ไฟล์เดียว ไม่มี require) · ปลั๊กอิน Overhaul ยังใช้สำเนาของตัวเองอยู่ จะย้ายมาใช้ไฟล์นี้หลัง commit รอบรีวิว 19 ต.ค.

   screens.js ของแต่ละปลั๊กอินต้องประกาศ: PLUGIN { prefix, page, menu, searchHint } · DIRECT · NESTED · LOCAL_OPTIONAL · NEEDED · NESTED_ONLY · SCENARIOS · build()
   ผัง userflow ข้างจอ (22 ต.ค. 2569): build-plugin.js ฝัง const USERFLOW จาก <ปลั๊กอิน>/build.json → buildGrid() วางผังซ้ายของแต่ละบล็อก scenario (userflowFrame)
   กติกาที่โค้ดนี้ทำให้ (component-rules.md): R1 Header Tablet · R2/R13 ไม่มี divider · R4 ปิด Info icon · R6–R7 ช่องกรอก · R8–R9 Table ทั้งก้อน (เกินขนาดค่อยประกอบ) ·
   R12 กล่องแสดงข้อมูล · R14 เฟรม 1440×1024 / 402×874 · ปุ่มท้ายซ้าย–ขวา · อัปโหลด 1 คอลัมน์ · mobile = การ์ด Mobile table / bottom sheet
   ============================================================================ */

figma.showUI(__html__, { width: 460, height: 520 });
const log = (text) => figma.ui.postMessage({ type: 'log', text });
const errors = [];
const warn = (where, e) => {   // แนบบรรทัดใน code.js ที่พัง — ข้อความอย่างเดียวบอกไม่ได้ว่าพังตรงไหน (20 ต.ค. 2569)
  const at = e && e.stack ? String(e.stack).split('\n').find(l => /code\.js|<anonymous>|at /.test(l) && !/warn/.test(l)) : '';
  const m = where + ' — ' + (e && e.message ? e.message : e) + (at ? '  [' + at.trim().slice(0, 90) + ']' : '');
  errors.push(m); log('⚠ ' + m);
};
/* ---------- หา component — 3 ทาง (19 ต.ค. 2569: ไฟล์ Maintain-D มี component ในตัวแค่บางส่วน) · รายชื่อที่ต้องใช้ (NEEDED · NESTED_ONLY · LOCAL_OPTIONAL) ประกาศใน screens.js ----------
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
/* ชิ้นที่สร้างระหว่างประกอบจอปัจจุบัน (เฟรม + instance) — Figma วาง node ใหม่ไว้ที่ (0,0) ของหน้าจนกว่าจะถูก appendChild เข้าจอ
   ถ้าประกอบจอพังกลางทาง ชิ้นเหล่านี้จะค้างซ้อนกันที่มุมหน้า (เจ้าของงานเจอ 20 ต.ค. 2569) ⇒ build() ล้างด้วย dropCreated() */
let CREATED = [];
let PLACE = null;   // ตำแหน่งที่จอปัจจุบันจะไปอยู่ — shell() วางเฟรมจอทันทีที่สร้าง ไม่รอจบ
const INNER_FRAMES = new Set(['Section', 'Row', 'Content', 'Content item', 'Actions', 'Dual list', 'Gallery', 'Table', 'Page', 'Container', 'WBS', 'Sheet', 'Panel', 'Radio', 'Sign', 'Signed', 'Spacer', 'Mobile table', 'Page header']);
function sweepOrphans(page, names) {   // รอบก่อนพังกลางทาง → ชิ้นส่วนค้างซ้อนกันที่ (0,0) ของหน้าปลั๊กอิน (ไม่ใช่เฟรมจอ) — ลบเฉพาะที่เข้าเกณฑ์นี้บนหน้าของปลั๊กอินเท่านั้น
  let n = 0;
  for (const node of page.children.slice()) {
    if (node.x !== 0 || node.y !== 0) continue;
    if (node.name.indexOf(PLUGIN.prefix + ' / ') === 0) continue;
    const orphan = (node.type === 'FRAME' && INNER_FRAMES.has(node.name)) || (node.type === 'INSTANCE' && names.has(node.name));
    if (orphan) { try { node.remove(); n++; } catch (e) { /* ลบไม่ได้ ข้าม */ } }
  }
  return n;
}
function dropCreated(page) {
  let n = 0;
  for (const node of CREATED) { try { if (node.parent === page) { node.remove(); n++; } } catch (e) { /* ลบไปแล้ว */ } }
  CREATED = [];
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

/* สีป้ายสถานะ (Badge outline มีแค่ 5 สี) */
const BADGE_OF = { Gray: 'Gray', Info: 'Brand', Success: 'Success', Warning: 'Brand', Error: 'Error', Brand: 'Brand' };   // Badge outline มีแค่ 5 สี
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
/* เลือกหลายค่า — Input dropdown with badges ค่าที่เลือกเป็นชิปในช่อง (Selected 4 ชิป · Focused 2 ชิป + ช่องพิมพ์) เกินช่องให้ชิปสุดท้ายเป็น "+n"
   ตาม Dropdown/Fleet card gas station หน้า 5.2 Vehicle Management ของ UI Release#2 (เจ้าของงาน 2 พ.ย. 2569 "ภาค เขต ประเภทรถ อยากให้มัลติซีเล็คได้") */
function multiDropdown(label, values, o) {
  o = o || {}; values = values || [];
  const st = o.state || (o.error ? 'Error' : values.length ? 'Selected' : 'Default');
  const n = inst('Input dropdown with badges', { State: st, Size: 'md' }, { 'Label text': label, Text: values.length ? '' : o.placeholder || 'เลือก', Optional: false, Helper: !!o.error, 'Helper text': o.error || '', 'Info icon': false, 'Leading icon': false });
  const chips = n.findAll(c => c.type === 'INSTANCE' && c.name === 'Badge outline with remove icon');
  chips.forEach((c, j) => {
    if (j >= values.length) { c.visible = false; return; }
    setProps(c, { Text: values.length > chips.length && j === chips.length - 1 ? '+' + (values.length - j) : values[j] });
  });
  return syncLabel(n, label, false);
}
function area(label, value, o) {
  o = o || {};
  return syncLabel(inst('Text area', { State: o.error ? 'Error' : value ? 'Filled' : 'Default', Size: 'md' }, { 'Label text': label, Text: value || o.placeholder || '',
    Optional: !!o.optional, Helper: !!o.error, 'Helper text': o.error || '', 'Info icon': false, 'Trailing icon': false, 'Show Placeholder': !value }), label, o.optional);   // error แบบ area() ของ Overhaul (R29)
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
    if (slot) {
      slot.visible = true; setProps(slot, { Text: b.text, 'Leading icon': !!b.icon, 'Trailing icon': false, State: b.disabled ? 'Disabled' : 'Default' }); if (b.icon) setProps(slot, { 'Leading icon swap': icon(b.icon) });
      // 2 พ.ย. 2569 ปุ่ม "เพิ่มอะไหล่" ในไฟล์จริงตัดคำเป็น 2 บรรทัด ⇒ ปุ่มและข้อความในปุ่มกว้างตามคำ
      try { slot.layoutSizingHorizontal = 'HUG'; } catch (e) { /* ไฟล์เก่าไม่รองรับ */ }
      const tx = slot.findOne(n => n.type === 'TEXT' && n.name === 'Text'); if (tx) try { tx.textAutoResize = 'WIDTH_AND_HEIGHT'; } catch (e) { /* ข้ามได้ */ }
    }
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
  if (base) { await text(base, 'Supporting text', (o.hint || 'PDF, JPG · สูงสุด 10 ไฟล์') + ' · ' + files.length + '/10 ไฟล์'); }
  const items = u.findAll(n => n.name === '_File upload item base');
  items.forEach((it, i) => {
    if (i >= files.length) { it.visible = false; return; }
    const f = files[i];
    /* 4 พ.ย. 2569 เจ้าของงาน "upload เอกสาร pdf และ ภาพ จะใช้สัญลักษณ์ไม่เหมือนกัน และ upload แล้ว จะมี progress bar ด้วย อ้างอิงจากของเดิม"
       ไอคอน = _File icon Type=Image (jpg png) / Document (อื่น) ของไลบรารี · แถบ = Progress bar ในรายการไฟล์ แบบปลั๊กอิน Overhaul (บล็อก M):
       f.progress = กำลังอัปโหลด (State In progress · ตัวเลข = %) · f.bar หรือ o.bar = อัปโหลดเสร็จแล้วแสดงแถบ 100% */
    const pct = f.progress ? (typeof f.progress === 'number' ? Math.max(0, Math.min(100, Math.round(f.progress / 20) * 20)) : 40) : 100;
    setProps(it, { State: f.err ? 'Error' : f.progress ? 'In progress' : 'Completed' });
    setProps(it, { 'File name': f.name, 'File size': f.err ? 'อัปโหลดไม่สำเร็จ — รับเฉพาะไฟล์ PDF หรือ JPG' : f.size, 'Progress bar': !f.err && !!(f.progress || f.bar || o.bar),
      Actions: true, 'Download action': !f.err && !o.readonly && !f.progress, 'Delete action': !o.readonly });
    const fi = it.findOne(n => n.type === 'INSTANCE' && n.name === '_File icon'); if (fi) setProps(fi, { Type: /\.(jpe?g|png|gif|webp|heic)$/i.test(f.name) ? 'Image' : 'Document' });
    const pb = it.findOne(n => n.type === 'INSTANCE' && n.name === 'Progress bar'); if (pb && !f.err && (f.progress || f.bar || o.bar)) setProps(pb, { Progress: pct + '%' });
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
    cols.forEach(([head], ci) => { const v = r[ci]; if (v && (v.menu || v.icons)) acts.push(v); else if (head && v && v.pills) v.pills.forEach((pl, k) => data.push([k ? v.pillsHead || head : head, { pill: pl }])); else if (head) data.push([head, v]); });   // Mobile table item ไม่มี Multiple badges ⇒ ป้ายที่ 2 เป็นแถวของการ์ด (4 พ.ย. 2569)
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
      else if (v && typeof v === 'object' && v.text != null) { setProps(it, { Style: i === 0 ? 'Lead text' : 'Text' }); setProps(it, { Header: head, Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' }); }   // บรรทัดรองใช้ช่อง Supporting text ของ Mobile table item (เจ้าของงาน 4 พ.ย. 2569 "รายละเอียดก็มีนี่นา") เดิมต่อท้ายด้วย ·
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
      const st = v && v.check != null ? 'Lead checkbox' : v && v.pills ? 'Multiple badges' : v && v.pill ? 'Badge' : v && (v.menu || v.icons) ? 'Action icons' : style || 'Text';
      const cell = inst('Table cell', { Style: st, 'Alternating fills': alt });
      add(c, cell, 'h');
      if (st === 'Multiple badges') fillPills(cell, v.pills);
      else if (st === 'Badge') { const p = find(cell, 'Pill outline'); if (p) setProps(p, { Color: v.pill[1], Text: v.pill[0] }); }
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
/* ช่องตาราง 1 ช่อง — ใช้ทั้งกับ Table cell ที่ซ้อนใน Table (รีวิว 19 ต.ค. 2569) และ mobile */
/* ป้ายหลายอันในช่องเดียว (4 พ.ย. 2569 S12 สถานะงาน + "รอผลตรวจน้ำมัน") — Table cell Style=Multiple badges ของไลบรารีมี Pill outline 3 อัน (ป้าย · ป้าย · +n) ใช้ตามจำนวน ที่เหลือซ่อน */
function fillPills(cell, pills) {
  cell.findAll(n => n.type === 'INSTANCE' && n.name === 'Pill outline').forEach((p, k) => { if (k < pills.length) setProps(p, { Color: pills[k][1], Text: pills[k][0] }); else p.visible = false; });
}
function fillCell(cell, v, style, alt) {
  const st = v && v.check != null ? 'Lead checkbox' : v && v.pills ? 'Multiple badges' : v && v.pill ? 'Badge' : v && (v.menu || v.icons) ? 'Action icons' : style || 'Text';
  setProps(cell, { Style: st, 'Alternating fills': alt });
  if (st === 'Multiple badges') fillPills(cell, v.pills);
  else if (st === 'Badge') { const p = find(cell, 'Pill outline'); if (p) setProps(p, { Color: v.pill[1], Text: v.pill[0] }); }
  else if (st === 'Action icons') {
    const ic = v.menu ? ['more_horiz-20-400-round'] : v.icons;
    setProps(cell, { View: ic.length > 0, Edit: ic.length > 1, Print: false, Delete: false });
    const bs = cell.findAll(n => n.name === 'Tertiary button');
    ic.forEach((name, i) => { if (bs[i]) setProps(bs[i], { 'Leading icon swap': icon(name) }); });
  } else if (st === 'Lead checkbox') {
    setProps(cell, { Text: v.text, Supporting: false });
    const cb = find(cell, 'Checkbox'); if (cb) setProps(cb, { Type: v.check ? 'Selected' : 'Unselected' });
  } else if (v && typeof v === 'object' && v.text != null) setProps(cell, { Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' });   // { text, sub } = 2 บรรทัด ตามแบบ Overhaul
  else setProps(cell, { Text: v == null ? '' : String(v), Supporting: false });
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
    const m = mobileCards(cols, rows);
    if (!o.pagination) return m;
    const box = col('Table', [m], 20); add(box, await pagination(o.pagination), 'h'); return box;
  }
  if (cols.length > TABLE_MAX.cols || rows.length > TABLE_MAX.rows) {   // ไลบรารีขยายไม่ได้ (instance เพิ่มคอลัมน์/แถวไม่ได้) ⇒ คงแบบเดิม แล้วรายงาน
    OVERSIZE.push(cols.length + ' คอลัมน์ × ' + rows.length + ' แถว');
    const box = col('Table', [tblComposed(cols, rows)], 20); if (o.pagination) add(box, await pagination(o.pagination), 'h'); return box;
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
  if (o.pagination) { const pg = find(t, 'Table pagination'); if (pg) await fillPagination(pg, o.pagination); }
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
    setProps(r, { Text: items[i][0], 'Supporting text': items[i][1] || '', 'Supporting 2': !!items[i][2], 'Supporting text 2': items[i][2] || '', Avatar: false, Supporting: !!items[i][1] });
  });
  const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = false;
  return l;
}
function alertBox(color, title, sub) {
  return inst('Alert', { Color: color }, { Text: title, 'Supporting text': sub || '', Supporting: !!sub, 'Leading icon': true, 'Close icon': false });
}
function pill(t, color) { return inst('Pill outline', { Color: color }, { Text: t }); }

/* ---------- โครงหน้า: Sidebar + Header navigation + Page (ตาม Contract list) ---------- */
async function shell(name, o) {
  if (MOB) {   // mobile: ไม่มี Sidebar · Header navigation Mobile · หน้าเว้นขอบ 16
    const scr = frame(PLUGIN.prefix + ' / ' + name, 'VERTICAL', { fill: WHITE });
    if (PLACE) { scr.x = PLACE.x; scr.y = PLACE.y; }
    scr.counterAxisSizingMode = 'FIXED'; scr.resize(VW(), VH()); scr.primaryAxisSizingMode = 'AUTO'; scr.minHeight = VH(); scr.clipsContent = true;
    add(scr, inst('Header navigation', { Breakpoint: 'Mobile' }), 'h');
    const page = frame('Page', 'VERTICAL', { gap: 24, pad: [16, 16], fill: WHITE });
    add(scr, page, 'h');
    add(page, await pageHead(o), 'h');
    return { scr, page };
  }
  const scr = frame(PLUGIN.prefix + ' / ' + name, 'HORIZONTAL', { fill: WHITE });
  if (PLACE) { scr.x = PLACE.x; scr.y = PLACE.y; }
  scr.primaryAxisSizingMode = 'FIXED'; scr.resize(1440, 1024); scr.counterAxisSizingMode = 'AUTO'; scr.minHeight = 1024; scr.clipsContent = true;
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
  const crumbs = [PLUGIN.menu].concat(o.crumbs || []);
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
/* หัว popup ตั้งผ่าน property ของ Modal header (Title · Supporting · Supporting text) — 3 พ.ย. 2569 เจ้าของงานเจอ popup แก้ไขเบอร์/สถานที่ขึ้นหัวตั้งต้น "แก้ไขข้อมูลผู้ใช้ยานพาหนะ"
   เดิมใช้ text(hd, 'Text') ซึ่งเจอข้อความในปุ่มย้อนกลับ (Tertiary button ที่ซ่อนอยู่) ก่อนหัวเรื่องจริง */
function modalHead(hd, title, sub, extra) {
  if (!hd) return;
  setProps(hd, Object.assign({ Title: title || '', Supporting: !!sub }, sub ? { 'Supporting text': sub } : {}, extra || {}));
}
async function confirm(scr, o) {   // Modal กลาง — danger = Destructive · อื่น = Centered image (ซ่อนรูป) · mobile = bottom sheet
  if (MOB) {
    const mh = inst('Modal header', { Alignment: 'Center' });
    modalHead(mh, o.title, o.sub, { 'Back icon': false, 'Close icon': false, Divider: false });
    const r = await sheet(scr, { content: [mh], danger: o.danger, ok: o.ok, cancel: o.cancel });
    r.body.paddingLeft = r.body.paddingRight = 0;
    return;
  }
  const m = inst('Modal', { Type: o.danger ? 'Destructive centered image with input' : 'Centered image', Size: 'md' });
  overlay(scr, m, 0, 0);
  hide(m, 'Content'); if (o.danger) hide(m, 'Form');
  modalHead(find(m, 'Modal header'), o.title, o.sub);
  const sb = find(m, 'Secondary button'); if (sb) setProps(sb, { Text: o.cancel || 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
  const pb = find(m, o.danger ? 'Primary danger button' : 'Primary button'); if (pb) setProps(pb, { Text: o.ok || 'ยืนยัน', 'Leading icon': false, 'Trailing icon': false });
}
async function formModal(scr, o) {   // Modal Type=Form · แถวที่ 2 สลับเป็น Text area ด้วย property "Input 1 swap" ของ Card form row · o.ok / o.cancel = ชื่อปุ่ม (ค่าเริ่ม บันทึก / ยกเลิก · 22 ต.ค. 2569 ใช้กับ "ส่งกลับ" "ปฏิเสธ")
  if (MOB) { await sheet(scr, { title: o.title, content: o.fields.map(f => f.area ? area(f.label, f.value) : field(f.label, f.value)), ok: o.ok || 'บันทึก', cancel: o.cancel }); return; }
  const m = inst('Modal', { Type: 'Form', Size: 'md' });
  overlay(scr, m, 0, 0);
  modalHead(find(m, 'Modal header'), o.title, o.sub, { 'Back icon': false, 'Featured icon': false });
  const rows = (find(m, 'Form') || m).children.filter(c => c.name === 'Card form row');
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (i >= o.fields.length) { r.visible = false; continue; }
    const f = o.fields[i];
    setProps(r, { 'Input 2': false });
    if (f.area) setProps(r, { 'Input 1 swap': main('Text area', { State: 'Filled', Size: 'md' }).id });
    const inp = r.children.find(c => c.type === 'INSTANCE' && c.visible !== false);
    if (inp) setProps(inp, { State: f.value ? 'Filled' : 'Default' });
    if (inp) setProps(inp, { 'Label text': f.label, Text: f.value || f.placeholder || '', Optional: !!f.optional, Helper: false, 'Info icon': false, 'Show Placeholder': !f.value });
    if (inp) syncLabel(inp, f.label, f.optional);   // ป้ายที่เห็นคือ Input label ที่ซ้อน (ตาม Overhaul) — เดิมไม่ตั้ง ป้ายเลยค้าง "ผู้ใช้ยานพาหนะ" ของไลบรารี
    const ct = inp && !f.area && find(inp, 'Container'), tv = ct && ct.findOne(n => n.type === 'TEXT' && n.visible !== false);
    if (tv && f.value && tv.characters !== f.value) await text(ct, tv, f.value);   // 3 พ.ย. 2569 ไฟล์จริงช่องขึ้นว่าง — ค่าที่เห็นไม่ตรง property ก็ใส่ที่ข้อความโดยตรง
  }
  const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && n.parent.name === 'Actions');
  ft.forEach(b => {
    if (b.name === 'Primary button') setProps(b, { Text: o.ok || 'บันทึก', 'Leading icon': false, 'Trailing icon': false });
    else if (b.name === 'Secondary button') setProps(b, { Text: o.cancel || 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
    else b.visible = false;
  });
}
/* 4 พ.ย. 2569 เจ้าของงาน "จังหวะที่เป็น dropdown ต้องชิดกับจุดที่เลือก" — วางรายการตอนสร้างจอ แล้ว stripDividers/polish ทำให้ของเหนือช่องเตี้ยลง ช่องเลื่อนขึ้นแต่รายการค้างที่เดิม
   ⇒ จำวิธีวางไว้ (PINS) แล้ววางซ้ำอีกรอบหลังจอเสร็จ (repin ใน buildGrid) รายการจึงอยู่ใต้ช่อง 4 px / เมนูชิดปุ่ม "…" ตามตำแหน่งสุดท้ายของช่อง */
let PINS = [];
function pin(place) { place(); PINS.push(place); }
function repin() { const p = PINS; PINS = []; for (const f of p) { try { f(); } catch (e) { /* ช่องถูกลบไปแล้ว */ } } }
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
  if (anchor) pin(() => { const sb = scr.absoluteBoundingBox, ab = anchor.absoluteBoundingBox; m.x = ab.x - sb.x + ab.width - m.width - 16; m.y = ab.y - sb.y + ab.height - 8; });
  return m;
}
const MENU = [['ดูรายละเอียด', 'quick_reference_all-24-300-round'], ['แก้ไข', 'stylus-24-300-round'], ['ลบ', 'delete-24-300-round']];
function comboAt(scr, anchor, items) {   // Dropdown list ใต้ช่องพิมพ์ค้น
  const l = inst('Dropdown list');
  const rows = l.children.filter(n => n.name === 'Dropdown list item');
  rows.forEach((it, i) => {
    if (i >= items.length) { it.visible = false; return; }
    setProps(it, { State: items[i][2] ? 'Selected' : 'Default' });
    setProps(it, { Text: items[i][0], 'Supporting text': items[i][1] || '', Avatar: false, 'Supporting 2': false, Supporting: !!items[i][1] });   // ไม่ส่งบรรทัดรอง = แถวเดียว (เลือกรถ: ทะเบียนอย่างเดียว · ยกจาก Overhaul R24)
  });
  const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = false;
  overlay(scr, l, 0, 0);
  if (anchor) pin(() => { const sb = scr.absoluteBoundingBox, ab = anchor.absoluteBoundingBox; l.resize(ab.width, l.height); l.x = ab.x - sb.x; l.y = ab.y - sb.y + ab.height + 4; });
}

/* ---------- แถบค้นหา + แบ่งหน้า (ตาม Table header / Table pagination ของไลบรารี) ---------- */
async function tableHeader(o) {
  const th = inst('Table header', { Breakpoint: BP() }, { 'Table title': false, Badge: false, 'Supporting text': false, 'More actions': false, Filters: !!(o.chips && o.chips.length) });
  const ti = find(th, 'Text input');
  if (ti) setProps(ti, { Label: false, Helper: false, 'Trailing icon': false, Text: o.query || o.placeholder || PLUGIN.searchHint, State: o.query ? 'Filled' : 'Default' });
  const acts = find(th, 'Actions');
  if (acts) { let first = true; for (const b of acts.children) {
    if (b.name === 'Secondary button' && first) { first = false; setProps(b, { Text: 'ตัวกรอง', 'Leading icon': true, 'Leading icon swap': icon('filter_list-24-400-round') }); const p = find(b, 'Pill outline'); if (p) p.visible = false; }
    else b.visible = false; } }
  th.findAll(n => n.name === 'Badge outline with remove icon').forEach((c, i) => { if (o.chips && i < o.chips.length) setProps(c, { Text: o.chips[i] }); else c.visible = false; });
  return th;
}
async function pagination(n) { return fillPagination(inst('Table pagination', { Breakpoint: BP() }), n); }
async function fillPagination(pg, n) {
  const tx = find(pg, 'Text'); if (tx && tx.type === 'TEXT') await text(pg, tx, 'แสดง 1 ถึง ' + n + ' จาก ' + n + ' รายการ');
  const items = pg.findAll(x => x.name === 'Button groups pagination item');
  items.forEach((it, i) => { if (i === 0 || i === items.length - 1) setProps(it, { State: 'Disabled' }); else if (i === 1) setProps(it, { Number: '1' }); else it.visible = false; });
  return pg;
}
const firstMenuCell = (scr) => scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Table cell' && n.variantProperties && n.variantProperties.Style === 'Action icons')[0];

/* ปิดเส้นคั่นทุกจุดในจอ (เจ้าของงานสั่ง 19 ต.ค. 2569 "disable divider ออกให้หมด") — property Divider → false · layer Divider/Content divider → ซ่อน */
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

/* แต่งจอตามรีวิว 19 ต.ค. 2569: ปิด Info icon ของ Input label · กล่องแสดงข้อมูล (display) */
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
  // R5: Section label / Section header ที่ยืมมาจาก component ของ flow อื่น อาจเปิด Info icon / More actions ไว้ — ปิดให้ทุกตัว (20 ต.ค. 2569)
  for (const n of root.findAll(n => n.type === 'INSTANCE' && (n.name === 'Section label' || n.name === 'Section header'))) {
    const cp = n.componentProperties || {};
    const fix = {};
    for (const k of ['Info icon', 'More actions']) { const key = Object.keys(cp).find(x => x.split('#')[0] === k); if (key && cp[key].value !== false) fix[k] = false; }
    if (Object.keys(fix).length) { setProps(n, fix); info++; }
  }
  for (const b of root.findAll(n => n.type === 'FRAME' && n.name === 'Content item' && n.children.some(c => c.name === 'Content item row'))) { await displayBox(b); disp++; }
  return { info, disp };
}

/* รายงานตารางที่เกินขนาด component Table ของไลบรารี (ต้องประกอบเอง — รอเจ้าของงานเคาะ) */
function reportOversize() {
  if (!OVERSIZE.length) return;
  const by = {}; OVERSIZE.forEach(x => { by[x] = (by[x] || 0) + 1; });
  log('· ตารางที่ใหญ่กว่า component Table ของไลบรารี (' + TABLE_MAX.cols + ' คอลัมน์ × ' + TABLE_MAX.rows + ' แถว) คงแบบประกอบเองไว้ ' + OVERSIZE.length + ' ตาราง: ' + Object.keys(by).map(k => k + ' ×' + by[k]).join(' · ') + ' — รอเจ้าของงานเคาะ');
  OVERSIZE.length = 0;
}
function findInstanceAncestor(n) { let p = n.parent; while (p) { if (p.type === 'INSTANCE') return p; p = p.parent; } return null; }

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
   ชื่อ variant จับแบบไม่สนตัวพิมพ์ตาม DEVICE_ALIAS · ไม่พบ set หรือไม่มี variant นั้น → ถอยไป "Component 1" (ชุดเก่า) → กรอบธรรมดา
   (ยกจาก overhaul2-plugin 22 ต.ค. 2569 — ปลั๊กอินบำรุงรักษาใช้ป้ายชุดเดียวกับ Overhaul) */
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
/* ตัวเลือกอุปกรณ์จากหน้าต่างปลั๊กอิน: 'desktop' → [false] · 'mobile' → [true] · อื่น ('both') → [false, true] (แถว mobile ใต้ desktop) */
const devOf = (o) => (o && o.devices === 'mobile') ? [true] : (o && o.devices === 'desktop') ? [false] : [false, true];

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
/* หน้าปลายทางตามชื่อ (เจ้าของงานสั่ง 22 ต.ค. 2569 "จะเอาลงในเพจ Maintainance ด้วยกันเลย"): หาหน้าที่ชื่อตรง (ไม่สนตัวพิมพ์ · มีอีโมจิ/ช่องว่างนำหน้าได้ · ไม่นับ <ชื่อ>-N)
   ไม่มี → สร้างหน้าชื่อนั้น · สร้างไม่ได้ → หน้าปัจจุบัน · ทุกกรณีวางต่อใต้ของเดิม ไม่ลบ/ไม่ย้ายของที่มีอยู่ */
async function namedPage(names) {
  const want = names.map(n => n.toLowerCase());
  const norm = (p) => p.name.trim().toLowerCase().replace(/^[^a-z0-9ก-๙]+/, '').replace(/[^a-z0-9ก-๙]+$/, '');
  const hit = figma.root.children.find(p => want.indexOf(norm(p)) >= 0);
  if (hit) return { page: hit, fresh: false, found: true };
  try { const p = figma.createPage(); p.name = names[0]; return { page: p, fresh: true, found: false }; }
  catch (e) { return { page: figma.currentPage, fresh: false, found: false, fallback: true }; }
}
/* พื้นที่วางงานของ Figma มีขอบราว ±65,500 เกินแล้วเลื่อนและซูมไปไม่ถึง (2 พ.ย. 2569 จอ S1 ไปอยู่ y=231434 แล้วเจ้าของงานมองไม่เห็น)
   เจ้าของงาน "อยากเพิ่มใน page Maintainance เดิม แทน 2" ⇒ ใต้ของเดิมไม่พอ ให้วางเหนือของเดิมบนหน้าเดียวกัน · เหนือของเดิมก็เต็มแล้วจึงต่อหน้า <ชื่อ>-2 <ชื่อ>-3 …
   ของเดิมไม่ถูกแตะ · ปลั๊กอิน dynamic-page ต้อง loadAsync ก่อนอ่านหน้าที่ยังไม่เปิด */
const CANVAS_MAX = 60000;
const pageBottom = (page) => page.children.reduce((y, n) => n.absoluteBoundingBox ? Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height) : y, 0);
const pageTop = (page) => page.children.reduce((y, n) => n.absoluteBoundingBox ? Math.min(y, n.absoluteBoundingBox.y) : y, CANVAS_MAX);
function spotOn(page, need, gap, skip) {   // { y } = วางจาก y ลงล่าง · limit = ขอบบนของของที่อยู่ถัดลงไป (ห้ามล้น) · null = หน้านี้ไม่มีที่
  /* เจ้าของงาน 2 พ.ย. 2569 "อยากให้การเขียน เป็นเขียนต่อด้านล่าง" ⇒ ใต้ของเดิมไม่พอ ให้หาช่องว่างแรกจากขอบบน (-CANVAS_MAX) ลงมา
     ชุดแรกอยู่ขอบบน ชุดถัดไปต่อใต้ชุดก่อน เรียงลงมาตามลำดับ export · skip = ชิ้นที่ไม่นับ (ชิ้นที่กำลังวาง/ย้าย) */
  const kids = page.children.filter(n => n.absoluteBoundingBox && !(skip && skip.has(n)));
  if (!kids.length) return { y: 0 };
  const top = (n) => n.absoluteBoundingBox.y, bot = (n) => top(n) + n.absoluteBoundingBox.height;
  const b = kids.reduce((m, n) => Math.max(m, bot(n)), -Infinity);
  if (b + gap + need <= CANVAS_MAX) return { y: b + gap };
  let y = -CANVAS_MAX;
  for (let k = 0; k <= kids.length; k++) {
    const hit = kids.filter(n => top(n) < y + need + gap && bot(n) + gap > y);
    if (!hit.length) { const next = kids.filter(n => top(n) >= y).reduce((m, n) => Math.min(m, top(n)), CANVAS_MAX + gap); return { y, limit: next - gap }; }
    y = hit.reduce((m, n) => Math.max(m, bot(n)), -Infinity) + gap;
    if (y + need > CANVAS_MAX) return null;
  }
  return null;
}
async function roomyPage(names, need, gap) {
  gap = gap || 400;
  const tp = await namedPage(names);
  const on = async (p) => { if (p.loadAsync) await p.loadAsync(); return spotOn(p, need, gap); };
  const here = await on(tp.page);
  if (here) return Object.assign(tp, here);
  const lower = (p) => p.name.trim().toLowerCase(), re = new RegExp('^' + names[0].toLowerCase() + '-(\\d+)$');
  const pages = figma.root.children.filter(p => re.test(lower(p)));
  for (const p of pages) { const s = await on(p); if (s) return Object.assign({ page: p, fresh: false, found: true, next: true }, s); }
  const next = pages.reduce((m, p) => Math.max(m, +lower(p).match(re)[1]), 1) + 1;
  try { const p = figma.createPage(); p.name = names[0] + '-' + next; return { page: p, fresh: true, found: true, next: true, y: 0 }; }
  catch (e) { return Object.assign(tp, { full: true, y: pageBottom(tp.page) + gap }); }
}
function liftAbove(page, before, limit) {   // วางในช่องว่างด้านบน: สูงจริงเกินที่เผื่อไว้จนทับของที่อยู่ถัดลงไป ⇒ ขยับทั้งชุดขึ้นเท่าที่ล้น
  const fresh = page.children.filter(n => !before.has(n));
  const dy = Math.min(0, limit - fresh.reduce((y, n) => Math.max(y, n.y + n.height), -Infinity));
  if (dy) fresh.forEach(n => { n.y += dy; });
}
/* 4 พ.ย. 2569 เจ้าของงาน "เมื่อวาน export ไปที่ Maintainance2 … อยากให้ export ไปที่ Maintainance แทน"
   ประเมินก่อนสร้าง (BLOCK_H × จำนวนบล็อก) เกินขอบเสมอเมื่อสร้างทั้งชุด ทั้งที่ชุดจริงสูงราว 77,000 ⇒ สร้างบนหน้าเดิมก่อน วัดขนาดจริงแล้วค่อยย้ายลงช่อง
   ลำดับ: ใต้ของเดิม → ช่องว่างจากขอบบนลงมา (spotOn) → คอลัมน์ใหม่ทางขวาของของเดิม (บนเสมอของเดิม) · null = หน้านี้ไม่มีที่ทั้งแนวตั้งและแนวนอน */
function fitOn(page, nodes, gap) {
  gap = gap || 400;
  const moving = new Set(nodes);
  const top = Math.min(...nodes.map(n => n.y)), h = Math.max(...nodes.map(n => n.y + n.height)) - top;
  const left = Math.min(...nodes.map(n => n.x)), w = Math.max(...nodes.map(n => n.x + n.width)) - left;
  const s = spotOn(page, h, gap, moving);
  if (s) { const y = s.y + h > CANVAS_MAX ? Math.max(-CANVAS_MAX, CANVAS_MAX - h) : s.y; return { dx: 0, dy: y - top, y, side: false }; }   // หน้าว่าง spotOn ให้ y 0 ⇒ ชุดสูงต้องยกขึ้นให้อยู่ในขอบ
  const old = page.children.filter(n => !moving.has(n) && n.absoluteBoundingBox);
  const right = old.reduce((m, n) => Math.max(m, n.absoluteBoundingBox.x + n.absoluteBoundingBox.width), -Infinity) + gap * 5;
  const y = Math.max(-CANVAS_MAX, Math.min(pageTop({ children: old }), CANVAS_MAX - h));
  if (right + w > CANVAS_MAX || h > 2 * CANVAS_MAX) return null;
  return { dx: right - left, dy: y - top, x: right, y, side: true };
}
function shiftAll(nodes, f) { for (const n of nodes) { n.x += f.dx; n.y += f.dy; } }
/* ---------- ผัง userflow ข้างจอ (เจ้าของงานสั่ง 22 ต.ค. 2569: "userflow กับ wireframe เรียงต่อกัน … อยู่ข้างๆกัน ตอนที่ export") ----------
   ข้อมูลผังฝังตอน build (const USERFLOW · plugin-lib/userflow-layout.js อ่านไฟล์ userflow .md) — ปลั๊กอินแค่วาดตามตำแหน่ง
   1 บล็อก scenario = ผังซ้ายสุด (อ่านบน → ล่าง) + ป้าย Device + คอลัมน์จอ A.1 A.2 … · กล่องในผังที่มีจอติดป้ายรหัสจอ (A.2 · A.3)
   รูปทรง/สีชุดเดียวกับบอร์ด FigJam: วงกลมขาว start/End · วงกลมฟ้า Action · สี่เหลี่ยมเขียว Display · ข้าวหลามตัดม่วง Decision · sticky เหลือง = คำถามที่ยังค้าง
   ผังเป็นของวาดประกอบ (shape + vector) อยู่นอกเฟรมจอ เหมือนป้าย Header — ไม่กระทบกติกา "ทุกชิ้นในจอเป็น instance" · Figma design ไม่มี connector ⇒ ลากกล่องแล้วเส้นไม่ตาม */
const FLOW_GAP = 200;          // ช่องระหว่างผังกับป้าย Device
const STICKY_FILL = '#FFE299', BADGE_FILL = '#9CACCC', FLOW_LINE = '#EAECF0';
const scenNo = (tag) => { const m = String(tag || '').match(/^S(\d+)$/); return m ? +m[1] : null; };
function flowNode(kind) {
  let n;
  if (kind === 'decision') { n = figma.createPolygon(); n.pointCount = 4; }
  else if (kind === 'display') { n = figma.createRectangle(); n.cornerRadius = 8; }
  else n = figma.createEllipse();
  CREATED.push(n);
  return n;
}
async function flowText(chars, size, hex, w, h) {
  const t = await labelText(chars, size, hex);
  t.textAlignHorizontal = 'CENTER'; t.textAlignVertical = 'CENTER';
  if (w) { t.textAutoResize = 'NONE'; t.resize(w, h); }
  return t;
}
async function arrow(pts, hex, weight) {   // เส้นหักมุมตามจุด + หัวลูกศรที่ปลาย · พิกัดเทียบมุมซ้ายบนของเส้นเอง แล้วค่อยวาง x/y
  const minX = Math.min(...pts.map(p => p[0])), minY = Math.min(...pts.map(p => p[1]));
  const v = figma.createVector(); CREATED.push(v);
  const net = {
    vertices: pts.map(([x, y], i) => Object.assign({ x: x - minX, y: y - minY }, i === pts.length - 1 ? { strokeCap: 'ARROW_LINES' } : {})),
    segments: pts.slice(1).map((_, i) => ({ start: i, end: i + 1 }))
  };
  if (typeof v.setVectorNetworkAsync === 'function') await v.setVectorNetworkAsync(net); else v.vectorNetwork = net;
  v.strokes = [{ type: 'SOLID', color: rgbOf(hex) }]; v.strokeWeight = weight || 3; v.strokeJoin = 'ROUND';
  v.fills = [];
  return v;
}
/* codes: { nodeId: ['A.2', …] } · loose: ['A.5 ยืนยันการออก', …] = จอที่ยังไม่มีกล่องในผัง */
async function userflowFrame(prefix, code, n, codes, loose, o) {   // o.sc = ผังที่ใช้แทน (แนวนอนของ journey) · o.title = หัวผัง
  o = o || {};
  const sc = o.sc || (USERFLOW && USERFLOW.scenarios && USERFLOW.scenarios[n]);
  if (!sc) return null;
  const f = figma.createFrame(); CREATED.push(f);
  f.name = prefix + ' · ' + code + ' userflow S' + n;
  f.fills = [{ type: 'SOLID', color: WHITE }]; f.strokes = [{ type: 'SOLID', color: rgbOf(FLOW_LINE) }]; f.strokeWeight = 2; f.cornerRadius = 16;
  f.clipsContent = false;
  f.resize(sc.w, sc.h);
  const put = (node, x, y) => { f.appendChild(node); node.x = x; node.y = y; return node; };
  put(await labelText(o.title || ('userflow · S' + n + ' ' + sc.title), 32, '#101828'), 40, 36);
  put(await labelText(sc.horizontal ? 'อ่านซ้าย → ขวา · ทางแยก N ลงล่าง · เส้นที่วนใต้ผัง = ย้อนกลับ · ป้ายเทา = รหัสจอบนหน้านี้'
    : 'อ่านบน → ล่าง · ทางแยก N ไปขวา · เส้นที่วนข้างผัง = ย้อนกลับ · ป้ายเทา = รหัสจอทางขวา', 16, '#475467'), 40, 84);
  const pos = {}, slots = [];
  for (const e of sc.edges) {   // เส้นก่อน กล่องทับเส้น
    const from = sc.nodes.find(x => x.id === e.from);
    const hex = '#' + [from.stroke.r, from.stroke.g, from.stroke.b].map(c => Math.round(c * 255).toString(16).padStart(2, '0')).join('');
    const v = await arrow(e.pts, hex, 3);
    put(v, Math.min(...e.pts.map(p => p[0])), Math.min(...e.pts.map(p => p[1])));   // ตั้ง x/y หลังย้ายเข้ากรอบ (พิกัดในกรอบผัง)
    v.name = 'เส้น ' + e.from + ' → ' + e.to + (e.back ? ' (ย้อนกลับ)' : '');
    if (e.label) {
      const [a, b] = [e.pts[0], e.pts[1]], down = a[0] === b[0];
      const t = put(await labelText(e.label, 18, '#101828'), a[0] + (down ? 10 : 12), a[1] + (down ? 4 : -28)); t.name = 'ป้าย ' + e.label;
    }
  }
  for (const nd of sc.nodes) {
    const s = flowNode(nd.kind); f.appendChild(s);
    s.resize(nd.w, nd.h); s.x = nd.x; s.y = nd.y;
    s.fills = [{ type: 'SOLID', color: nd.fill }]; s.strokes = [{ type: 'SOLID', color: nd.stroke }]; s.strokeWeight = 4;
    s.name = nd.id + ' / ' + (nd.label.split('\n')[0] || nd.kind);
    if (nd.thumb) {   // กล่องหน้าจอ = ช่องภาพย่อจอจริงด้านบน + ชื่อหน้าใต้ภาพ (เจ้าของงานเลือก 22 ต.ค. 2569 "ภาพย่อจอในผัง")
      const th = figma.createRectangle(); CREATED.push(th); f.appendChild(th);
      th.resize(nd.thumb.w, nd.thumb.h); th.x = nd.x + nd.thumb.x; th.y = nd.y + nd.thumb.y; th.cornerRadius = 4;
      th.fills = [{ type: 'SOLID', color: WHITE }]; th.strokes = [{ type: 'SOLID', color: rgbOf('#D0D5DD') }]; th.strokeWeight = 1;
      th.name = 'ภาพย่อ ' + nd.id;
      slots.push({ id: nd.id, rect: th });
      if (!codes[nd.id]) { const ph = put(await flowText('ยังไม่มีจอในบล็อกนี้', 14, '#667085', nd.thumb.w, nd.thumb.h), th.x, th.y); ph.name = nd.id + ' ยังไม่มีจอ'; }
      const top = nd.thumb.y + nd.thumb.h + 4, ih = nd.h - top - 6, iw = nd.w - 16;
      const t = put(await flowText(nd.label.replace(/\n/g, ' '), 15, '#101828', iw, ih), nd.x + 8, nd.y + top);
      t.name = nd.id + ' ข้อความ';
    } else {
      const iw = nd.kind === 'decision' ? nd.w * 0.62 : nd.w * 0.86, ih = nd.kind === 'decision' ? nd.h * 0.62 : nd.h * 0.8;
      const t = put(await flowText(nd.label, nd.kind === 'end' ? 16 : 15, '#101828', iw, ih), nd.x + (nd.w - iw) / 2, nd.y + (nd.h - ih) / 2);
      t.name = nd.id + ' ข้อความ';
    }
    pos[nd.id] = nd;
  }
  for (const id of Object.keys(codes)) {   // ป้ายรหัสจอ มุมขวาบนของกล่อง
    const nd = pos[id]; if (!nd) { warn('ผัง S' + n, new Error('จอผูกกับกล่อง ' + id + ' ที่ไม่มีในผัง userflow')); continue; }
    const b = frame('ป้ายจอ ' + codes[id].join(' '), 'HORIZONTAL', { fill: rgbOf(BADGE_FILL), pad: [4, 10] }); b.cornerRadius = 6;
    b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'AUTO';
    b.appendChild(await labelText(codes[id].join(' · '), 16, '#101828'));
    put(b, nd.x + nd.w - 24, nd.y - 16);
  }
  let low = 0;   // sticky: ซ้อนลงถ้าชนกัน
  for (const st of sc.stickies) {
    const box = frame('คำถาม ' + st.node, 'VERTICAL', { fill: rgbOf(STICKY_FILL), pad: [16, 16] }); box.cornerRadius = 4;
    box.counterAxisSizingMode = 'FIXED'; box.primaryAxisSizingMode = 'AUTO'; box.resize(st.w, 100);
    const t = await labelText(st.text, 15, '#101828'); box.appendChild(t); t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT';
    const y = Math.max(st.y, low);
    put(box, st.x, y); low = y + box.height + sc.gap;
  }
  let h = Math.max(sc.h, low + 40);
  if (loose && loose.length) {   // จอที่ผังยังไม่มีกล่องรองรับ — แจ้งให้เติม userflow (ไม่เดาเติมเอง)
    const t = put(await labelText('จอที่ยังไม่มีกล่องในผัง userflow: ' + loose.join(' · '), 16, '#B42318'), 40, h); t.name = 'จอที่ยังไม่มีกล่องในผัง';
    t.textAutoResize = 'HEIGHT'; t.resize(sc.w - 80, t.height || 24); h += (t.height || 24) + 40;
  }
  f.resize(sc.w, h);
  return { frame: f, slots };
}
/* ภาพย่อจอจริง: export จอเป็น PNG แล้วใส่เป็นภาพในช่อง · จอสูงกว่าช่อง = ตัดเอาส่วนบนเต็มความกว้าง (เห็นหัวหน้า + ส่วนต้นของเนื้อหา) · ภาพเป็นภาพนิ่ง แก้จอแล้วต้องสร้างใหม่ */
async function fillThumb(rect, scr) {
  try {
    const scale = Math.max(0.05, Math.min(1, (rect.width / scr.width) * 2));
    const bytes = await scr.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
    const img = figma.createImage(bytes);
    const vis = (rect.height / rect.width) / (scr.height / scr.width);   // สัดส่วนความสูงของจอที่ช่องแสดงได้เมื่อเต็มความกว้าง
    rect.fills = [vis < 1 ? { type: 'IMAGE', imageHash: img.hash, scaleMode: 'CROP', imageTransform: [[1, 0, 0], [0, vis, 0]] } : { type: 'IMAGE', imageHash: img.hash, scaleMode: 'FIT' }];
    return true;
  } catch (e) { warn('ภาพย่อ ' + scr.name, e); return false; }
}

/* ---------- เอกสารเป็นกรอบบนหน้า Figma: user story mapping + use case (30 ต.ค. 2569 เจ้าของงาน "ทุกอย่างอยู่ใน Figma") ----------
   ข้อมูลฝังตอน build (const DOCS จาก build.json "docs") · กรอบอยู่นอกจอ ชื่อ "<prefix> · …" ปลั๊กอินล้างตอนรันซ้ำแบบป้ายอื่น · ไม่ใช่จอ UI จึงวาดด้วยกรอบ + ข้อความ */
const DOC_STATUS = { 'มีใน flow แล้ว': '#E3F4EA', 'มีบางส่วน': '#FDF0DC', 'ยังไม่มี': '#EFEDF0', 'ขัดกับที่เคาะ': '#FDE8E6' };
let DOC_FONT = null;
async function docText(chars, size, hex, w, regular) {
  const t = await labelText(chars || ' ', size, hex);   // หัว = ฟอนต์ป้าย (ตัวหนา)
  if (regular) {
    if (DOC_FONT === null) { DOC_FONT = false; for (const f of [{ family: 'IBM Plex Sans Thai', style: 'Regular' }, { family: 'Inter', style: 'Regular' }]) { try { await figma.loadFontAsync(f); DOC_FONT = f; break; } catch (e) { /* ลองตัวถัดไป */ } } }
    if (DOC_FONT) t.fontName = DOC_FONT;
  }
  if (w) { t.resize(w, t.height); t.textAutoResize = 'HEIGHT'; }
  return t;
}
function docBox(name, dir, o) {
  const f = frame(name, dir, Object.assign({ fill: WHITE }, o || {}));
  if (o && o.stroke) { f.strokes = [{ type: 'SOLID', color: rgbOf(o.stroke) }]; f.strokeWeight = 1; }
  if (o && o.radius) f.cornerRadius = o.radius;
  return f;
}
function putBelow(page, node, gap) {   // วางต่อใต้ของเดิมบนหน้า ชิดซ้ายที่ x = 0 · กรอบชื่อเดียวกันของรอบก่อนถูกแทนที่ (ไม่ซ้อนหลายชุด)
  page.children.filter(n => n !== node && n.name === node.name).forEach(n => { log('↻ แทนที่ "' + n.name + '" ของรอบก่อน'); n.remove(); });
  let y = 0; page.children.forEach(n => { if (n !== node && n.absoluteBoundingBox) y = Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + (gap || 400)); });
  const s = spotOn(page, node.height, gap || 400, new Set([node]));   // ใต้ของเดิมเกินขอบพื้นที่วางงาน ⇒ ช่องว่างแรกจากขอบบนลงมา
  page.insertChild(0, node); node.x = 0; node.y = s ? s.y : y; return node;
}
/* story map: แถวช่วงงานเรียงซ้าย → ขวา · การ์ดข้อกำหนดใต้แต่ละช่วง (☑ ทำแล้ว · สีตามสถานะ) */
async function storyMapBoard(prefix, sm) {
  CREATED = [];
  const W = 440;
  const outer = docBox(prefix + ' · user story mapping', 'VERTICAL', { pad: 64, gap: 32, stroke: '#D0D5DD', radius: 24 });
  outer.appendChild(await docText(sm.title, 56, '#101828'));
  outer.appendChild(await docText('ต้นฉบับ ' + sm.src + ' · สีการ์ด = flow ครอบแค่ไหน (เขียว มีแล้ว · ส้ม บางส่วน · เทา ยังไม่มี · แดง ขัดกับที่เคาะ) · ☑ = ทำแล้ว', 24, '#475467', null, true));
  const cols = docBox('Columns', 'HORIZONTAL', { gap: 24, fill: null }); cols.fills = []; outer.appendChild(cols);
  for (const sec of sm.sections) {
    const col = docBox('ช่วงงาน · ' + sec.h, 'VERTICAL', { gap: 12 }); col.fills = [];
    col.counterAxisSizingMode = 'FIXED'; col.resize(W, 100); col.primaryAxisSizingMode = 'AUTO';
    const head = docBox('หัว', 'VERTICAL', { pad: 20, gap: 6, fill: rgbOf('#A80689'), radius: 12 });
    head.appendChild(await docText(sec.h, 26, '#FFFFFF', W - 40));
    if (sec.note) head.appendChild(await docText(sec.note, 20, '#FFFFFF', W - 40, true));
    col.appendChild(head); head.layoutAlign = 'STRETCH';
    const hi = (k) => (sec.head || []).indexOf(k);
    for (const r of sec.rows) {
      const st = r[hi('สถานะ')] || '';
      const card = docBox('การ์ด', 'VERTICAL', { pad: 16, gap: 8, fill: rgbOf(DOC_STATUS[st] || '#FFFFFF'), radius: 10, stroke: '#D0D5DD' });
      card.appendChild(await docText((r[hi('ทำแล้ว')] || '☐') + ' ' + (r[hi('use case')] || ''), 22, '#101828', W - 32, true));
      card.appendChild(await docText(['JO ' + (r[hi('JO')] || '-'), st, r[hi('ใน flow ตอนนี้')] || ''].filter(Boolean).join(' · '), 18, '#475467', W - 32, true));
      col.appendChild(card); card.layoutAlign = 'STRETCH';
    }
    cols.appendChild(col);
  }
  CREATED = [];
  return outer;
}
/* ตาราง use case: แยกหัวข้อตามคอลัมน์ group · คอลัมน์กว้างตาม widths · แถวสลับสี · สถานะระบายสี */
async function tableBoard(prefix, name, title, src, data, group, cols) {
  CREATED = [];
  const W = cols.reduce((a, c) => a + c[1], 0);
  const outer = docBox(prefix + ' · ' + name, 'VERTICAL', { pad: 64, gap: 32, stroke: '#D0D5DD', radius: 24 });
  outer.appendChild(await docText(title, 56, '#101828'));
  outer.appendChild(await docText('ต้นฉบับ ' + src + ' · ' + data.rows.length + ' ข้อ', 24, '#475467', null, true));
  const gi = data.head.indexOf(group);
  for (const g of [...new Set(data.rows.map(r => r[gi]))]) {
    const rows = data.rows.filter(r => r[gi] === g);
    outer.appendChild(await docText(g + ' (' + rows.length + ' ข้อ)', 32, '#A80689'));
    const tbl = docBox('ตาราง · ' + g, 'VERTICAL', { stroke: '#D0D5DD', radius: 8 }); tbl.clipsContent = true;
    const line = async (vals, i, header) => {
      const rw = docBox(header ? 'หัวตาราง' : 'แถว', 'HORIZONTAL', { fill: rgbOf(header ? '#F2F4F7' : (i % 2 ? '#FCFCFD' : '#FFFFFF')) });
      for (const [k, [h, w]] of cols.entries()) {
        const v = vals[k] || '';
        const cell = docBox(h, 'VERTICAL', { pad: 12, fill: header ? null : (h === 'สถานะใน flow' && DOC_STATUS[v] ? rgbOf(DOC_STATUS[v]) : null) });
        if (header || !(h === 'สถานะใน flow' && DOC_STATUS[v])) cell.fills = [];
        cell.counterAxisSizingMode = 'FIXED'; cell.resize(w, 40); cell.primaryAxisSizingMode = 'AUTO';
        cell.appendChild(await docText(v, header ? 18 : 18, header ? '#344054' : '#101828', w - 24, !header));
        rw.appendChild(cell); cell.layoutAlign = 'STRETCH';
      }
      tbl.appendChild(rw);
    };
    await line(cols.map(c => c[0]), 0, true);
    for (const [i, r] of rows.entries()) await line(cols.map(c => r[data.head.indexOf(c[0])]), i, false);
    outer.appendChild(tbl);
  }
  CREATED = [];
  return outer;
}

/* ---------- ส่งภาพจอบนหน้านี้ไป FigJam (เจ้าของงาน 30 ต.ค. 2569 "export … ไปที่ figjam ด้วย userflow และ design มาจาก figma ปรับใหม่ล่าสุด") ----------
   export เฟรมจอ "<prefix> / A.1 · S1 — ชื่อ" บนหน้าที่เปิดอยู่ (จอที่ทีมแก้มือแล้วก็ได้) เป็น PNG ส่งให้หน้าต่างปลั๊กอิน → POST เข้า serve.js ที่ out/figjam/<dir>/
   แล้ว 3-figjam-board.js วางภาพต่อจากผัง userflow ของ scenario เดียวกัน · desktop อย่างเดียว · ด้านยาวไม่เกิน 4000 px (FigJam รับไม่เกิน 4096) */
const SHOT_RE = /^(\S+) \/ ([A-Z])\.([0-9.]+) · (S\d+) — (.+)$/;
async function exportShots(dir) {
  errors.length = 0;
  const page = figma.currentPage;
  const all = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0 && !/ · mobile$/.test(n.name) && n.name.indexOf(' · ตัดแล้ว') < 0);
  const shots = [], skipped = [];
  for (const f of all) { const m = f.name.match(SHOT_RE); if (m) shots.push({ f, code: m[2] + '.' + m[3], letter: m[2], no: m[3], scenario: m[4], name: m[5] }); else skipped.push(f.name); }
  /* หน้าเดียวกันมีหลายชุด (ปุ่มสร้างวางต่อใต้ของเดิมทุกครั้ง) ⇒ ใช้ชุดล่าสุด = จอ A.1 ที่อยู่ล่างสุด กับทุกจอที่อยู่ใต้มัน · ชุดเก่าด้านบนไม่ส่ง */
  const a1 = shots.filter(x => x.code === 'A.1');
  if (a1.length > 1) {
    const top = Math.max(...a1.map(x => x.f.y));
    const old = shots.filter(x => x.f.y < top - 1);
    if (old.length) { log('หน้านี้มีจอหลายชุด — ส่งเฉพาะชุดล่าสุด (เริ่มที่ A.1 ล่างสุด) · ข้ามชุดเก่า ' + old.length + ' จอ'); shots.splice(0, shots.length, ...shots.filter(x => old.indexOf(x) < 0)); }
  }
  const seen = new Set();   // รหัสซ้ำในชุดเดียวกัน ⇒ เก็บตัวที่อยู่ล่างสุด (สร้างทีหลัง)
  shots.sort((p, q) => q.f.y - p.f.y);
  shots.splice(0, shots.length, ...shots.filter(x => !seen.has(x.code) && seen.add(x.code)));
  const key = (s) => s.letter + s.no.split('.').map(x => x.padStart(3, '0')).join('.');
  shots.sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  if (!shots.length) { log('ไม่พบเฟรมจอ "' + PLUGIN.prefix + ' / …" บนหน้า "' + page.name + '" — เปิดหน้าที่มีจอแล้วกดใหม่'); return; }
  log('ส่งภาพจอ ' + shots.length + ' จอ จากหน้า "' + page.name + '" ไปที่ out/figjam/' + dir + '/ …');
  const manifest = { source: 'figma', page: page.name, exportedAt: new Date().toISOString(), shots: [] };
  for (const s of shots) {
    try {
      const scale = Math.min(1, 4000 / Math.max(s.f.width, s.f.height));
      const bytes = await s.f.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      const file = s.code + '-' + s.scenario + '.png';
      figma.ui.postMessage({ type: 'shot', dir, file, bytes });
      manifest.shots.push({ code: s.code, scenario: s.scenario, name: s.name, file, w: Math.round(s.f.width * scale), h: Math.round(s.f.height * scale) });
    } catch (e) { warn('export ' + s.f.name, e); }
  }
  figma.ui.postMessage({ type: 'shots-done', dir, manifest });
  log('export แล้ว ' + manifest.shots.length + '/' + shots.length + ' จอ' + (skipped.length ? ' · ข้าม ' + skipped.length + ' เฟรมที่ชื่อไม่ตรงรูปแบบ (เช่น ' + skipped[0] + ')' : '') + (errors.length ? ' · ⚠ เตือน ' + errors.length + ' จุด' : ''));
  log('ขั้นต่อไป: node figma-export/3-figjam-board.js --maintainance --only --out=board-maintainance.json แล้วโหลดบอร์ดใน FigJam');
}

/* ---------- journey แนวขวาง (เจ้าของงานสั่ง 22 ต.ค. 2569: "ทำ scen มาต่อกันเป็นแนวขวาง สำหรับ export" + "ลงในเพจ maintainance แต่มีปุ่มแยก") ----------
   USERFLOW.journey (ฝังตอน build จาก build.json) = { title, phases: [[ชื่อช่วง, [n…]]], cols: [[n…]], row: { n: 1 }, links: [[จาก, ไป, ป้าย, 'back'?]], scenarios: ผังแนวนอน }
   วาง: แถบ Journey → แถบช่วงงาน → กรอบผัง scenario เรียงซ้าย → ขวาตาม cols (ทางแยกลงแถว 2 ตาม row) → ลูกศรระหว่าง scenario (เข้าที่ start ของปลายทาง)
   เส้นย้อนกลับ (back) วิ่งเหนือแถว 1 / ใต้แถว 2 แบบเส้นประ · info.codes(n) = { codes, loose } ป้ายรหัสจอ · info.frameFor(code) = เฟรมจอบนหน้า (ภาพย่อ) หรือ null */
const JGAP = { col: 240, row: 240, bar: 80, lane: 48 };
async function buildJourney(page, prefix, y0, info) {
  const J = USERFLOW && USERFLOW.journey;
  if (!J) throw new Error('ไม่มีข้อมูล journey ฝังมา — ใส่ "journey" ใน build.json แล้วรัน node figma-export/build-plugin.js ใหม่');
  const put = (nd, x, y) => { page.insertChild(0, nd); nd.x = x; nd.y = y; return nd; };
  const F = {}, thumbs = []; let made = 0;
  for (const col of J.cols) for (const n of col) {
    CREATED = [];
    const sc = J.scenarios[n]; if (!sc) { warn('journey', new Error('ไม่มีผัง S' + n + ' ในไฟล์ userflow')); continue; }
    const c = info.codes(n) || { codes: {}, loose: [] };
    try {
      const uf = await userflowFrame(prefix, 'journey', n, c.codes, [], { sc, title: 'Scenario ' + n + ' · ' + sc.title });
      F[n] = uf.frame; page.insertChild(0, uf.frame); made++;
      for (const sl of uf.slots) { const cd = (c.codes[sl.id] || [])[0]; if (cd) thumbs.push([sl.rect, cd]); }
    } catch (e) { warn('journey S' + n, e); dropCreated(page); }
    CREATED = [];
  }
  /* ตำแหน่ง: คอลัมน์กว้างเท่ากรอบที่กว้างสุดในคอลัมน์ · แถว 2 อยู่ใต้กรอบแถว 1 ที่สูงสุด */
  const rowOf = (n) => (J.row && J.row[n]) || 0;
  const backTop = J.links.filter(l => l[3] === 'back' && !rowOf(l[0]) && !rowOf(l[1])).length;
  const top = y0 + GRID.barH + JGAP.bar + GRID.barH + JGAP.bar + backTop * JGAP.lane;
  const colX = []; let x = 0;
  J.cols.forEach((col, i) => { colX[i] = x; x += Math.max(...col.map(n => F[n] ? F[n].width : 0)) + JGAP.col; });
  const totalW = x - JGAP.col;
  const h0 = Math.max(...Object.keys(F).filter(n => !rowOf(n)).map(n => F[n].height));
  const rowY = [top, top + h0 + JGAP.row];
  const colOf = {}; J.cols.forEach((col, i) => col.forEach(n => { colOf[n] = i; }));
  for (const n of Object.keys(F)) { F[n].x = colX[colOf[n]]; F[n].y = rowY[rowOf(n)]; }
  /* แถบ Journey + ช่วงงาน (component Header ของทีมออกแบบ · ไม่มี = แถบธรรมดา) */
  CREATED = [];
  put(await flowBar(prefix, 'Journey', J.title, 'Default', totalW), 0, y0);
  for (const [i, [title, ns]] of (J.phases || []).entries()) {
    const xs = ns.filter(n => F[n]).map(n => F[n].x), xe = ns.filter(n => F[n]).map(n => F[n].x + F[n].width);
    if (!xs.length) continue;
    put(await flowBar(prefix, 'ช่วง ' + (i + 1), title, 'Sub Flow', Math.max(...xe) - Math.min(...xs)), Math.min(...xs), y0 + GRID.barH + JGAP.bar);
  }
  /* ภาพย่อจอจริง (จอที่สร้างไว้บนหน้านี้แล้ว) */
  let tk = 0;
  for (const [rect, cd] of thumbs) { const scr = info.frameFor(cd); if (scr && await fillThumb(rect, scr)) tk++; }
  /* ลูกศรระหว่าง scenario: ออกขอบขวาของต้นทาง (ระดับ start ของต้นทาง) → เข้าซ้ายของ start ปลายทาง · back = เส้นประวิ่งเหนือแถว 1 / ใต้แถว 2 */
  const startOf = (n) => { const s = J.scenarios[n].nodes[0]; return { x: F[n].x + s.x, y: F[n].y + s.y + s.h / 2 }; };
  let lanesTop = 0, lanesBot = 0, links = 0;
  const bottom2 = Math.max(...Object.keys(F).map(n => F[n].y + F[n].height));
  for (const [a, b, label, kind] of J.links) {
    if (!F[a] || !F[b]) continue;
    CREATED = [];
    let pts, hex = '#475467';
    if (kind === 'back') {
      hex = '#98A2B3';
      if (rowOf(a) || rowOf(b)) { const yl = bottom2 + JGAP.lane * (++lanesBot); pts = [[F[a].x + F[a].width / 2, F[a].y + F[a].height], [F[a].x + F[a].width / 2, yl], [F[b].x + F[b].width / 2, yl], [F[b].x + F[b].width / 2, F[b].y + F[b].height]]; }
      else { const yl = top - JGAP.lane * (++lanesTop); pts = [[F[a].x + F[a].width / 2, F[a].y], [F[a].x + F[a].width / 2, yl], [F[b].x + F[b].width / 2, yl], [F[b].x + F[b].width / 2, F[b].y]]; }
    } else {
      const sa = startOf(a), sb = startOf(b), ax = F[a].x + F[a].width, ay = rowOf(a) === rowOf(b) ? sb.y : sa.y;
      const mx = ax + JGAP.col / 2;
      pts = ay === sb.y ? [[ax, ay], [sb.x, sb.y]] : [[ax, ay], [mx, ay], [mx, sb.y], [sb.x, sb.y]];
    }
    try {
      const v = await arrow(pts, hex, 6); put(v, Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])));
      if (kind === 'back') { try { v.dashPattern = [24, 16]; } catch (e) { /* ไม่มี dash ก็เส้นทึบ */ } }
      v.name = prefix + ' · journey S' + a + ' → S' + b + (kind === 'back' ? ' (ย้อนกลับ)' : '');
      if (label) { const p0 = pts[kind === 'back' ? 1 : 0], p1 = pts[kind === 'back' ? 2 : 1]; const t = await labelText(label, 24, '#101828'); put(t, Math.min(p0[0], p1[0]) + 16, Math.min(p0[1], p1[1]) - 36); t.name = prefix + ' · ป้าย ' + label; }
      links++;
    } catch (e) { warn('ลูกศร S' + a + ' → S' + b, e); }
    CREATED = [];
  }
  return { made, links, thumbs: tk, slots: thumbs.length, w: totalW };
}

/* GROUPS = [{ code: 'A', title: '…', subs: [{ code: 'A', title: '…', tag: 'S1', screens: [[label, fn, 'D1 D2'?], …] }] }]
   screens[i][2] = id กล่องในผัง userflow ที่จอนี้แสดง (คั่นด้วยช่องว่าง · ไม่ใส่ = ผังยังไม่มีกล่องของจอนี้)
   fn() สร้างจอตามตัวแปร MOB · จอชื่อ "<prefix> / A.2 · S1 — <label>[ · mobile]" · คืน { made, y, flows }
   opts.devices = [false] desktop · [true] mobile · ไม่ส่ง = ทั้งคู่ · opts.rowMin = ความสูงแถวขั้นต่ำ · opts.flow = false ไม่วางผัง userflow */
async function buildGrid(page, prefix, GROUPS, y0, total, opts) {
  opts = opts || {};
  const made = []; let y = y0; const x0 = GRID.side + GRID.gap; const pitch = GRID.colW + GRID.colGap; let flows = 0;
  const put = (n, x, yy) => { page.insertChild(0, n); n.x = x; n.y = yy; return n; };
  for (const g of GROUPS) {
    const nCols = Math.max(...g.subs.map(s => s.screens.length));
    const top = y;
    CREATED = []; put(await flowBar(prefix, g.code, g.title, 'Default', nCols * GRID.colW + (nCols - 1) * GRID.colGap), x0, y);
    y += GRID.barH + GRID.gap;
    let flowBottom = top;
    for (const sub of g.subs) {
      const n = sub.screens.length, w = n * GRID.colW + (n - 1) * GRID.colGap;
      if (sub.code !== g.code) {   // แถบย่อย (B1 B2) เฉพาะเมื่อกลุ่มมีหลาย scenario · เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก ⇒ ไม่มีแถบย่อย ป้าย state = A.1 A.2 …
        put(await flowBar(prefix, sub.code, sub.title, 'Sub Flow', w), x0, y);
        y += GRID.barH + GRID.gap;
      }
      const sn = scenNo(sub.tag);
      let flowSlots = null; const byCode = {};   // รหัสจอ → เฟรมจอ (desktop ก่อน) สำหรับภาพย่อในผัง
      if (opts.flow !== false && USERFLOW && sn != null && USERFLOW.scenarios[sn]) {   // ผัง userflow ซ้ายของบล็อก (ขอบขวาห่างป้าย Device FLOW_GAP)
        const codes = {}, loose = [];
        sub.screens.forEach(([label, , ids], i) => {
          const c = sub.code + '.' + (i + 1);
          const list = String(ids || '').split(/\s+/).filter(Boolean);
          if (!list.length) loose.push(c + ' ' + label);
          list.forEach(id => { (codes[id] = codes[id] || []).push(c); });
        });
        CREATED = [];
        try {
          const uf = await userflowFrame(prefix, g.code, sn, codes, loose);
          const fr = uf && uf.frame;
          if (uf) flowSlots = { slots: uf.slots, codes };
          if (fr) { put(fr, -(fr.width + FLOW_GAP), top); flowBottom = Math.max(flowBottom, top + fr.height); flows++;
            log('  · ผัง userflow S' + sn + ' (' + USERFLOW.scenarios[sn].nodes.length + ' กล่อง' + (loose.length ? ' · จอที่ยังไม่มีกล่องในผัง ' + loose.length : '') + ')'); }
        } catch (e) { warn('ผัง userflow S' + sn, e); const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้างจากผังที่พัง ' + k + ' ชิ้น'); }
        CREATED = [];
      }
      put(await deviceLabel(prefix, 'Header', GRID.barH), 0, y);
      for (const [i, [label]] of sub.screens.entries()) put(await flowBar(prefix, sub.code + '.' + (i + 1), label, 'Sub Flow 2', GRID.colW), x0 + i * pitch, y);
      y += GRID.barH + GRID.gap;
      for (const mob of (opts.devices || [false, true])) {   // devices: [false]=desktop อย่างเดียว · [true]=mobile อย่างเดียว · ไม่ส่ง=ทั้งคู่ (แถว mobile ใต้ desktop)
        MOB = mob; let h = 0; const rowY = y;
        for (const [i, [label, fn]] of sub.screens.entries()) {
          const x = x0 + i * pitch;
          CREATED = []; PLACE = { x, y: rowY };   // เฟรมจอไปอยู่ตำแหน่งจริงทันทีที่สร้าง · ชิ้นที่สร้างระหว่างทางถูกติดตามไว้
          try {
            PINS = []; const s = await fn(); stripDividers(s); await polish(s); repin();
            s.name = prefix + ' / ' + sub.code + '.' + (i + 1) + ' · ' + sub.tag + ' — ' + label + (mob ? ' · mobile' : '');
            put(s, x, rowY); h = Math.max(h, s.height); made.push(s);
            const cd = sub.code + '.' + (i + 1); if (!byCode[cd]) byCode[cd] = s;
            log('  · ' + made.length + '/' + total + ' ' + s.name);
          } catch (e) {
            warn(sub.code + '.' + (i + 1) + ' ' + label + (mob ? ' (mobile)' : ''), e);
            const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้างจากจอที่พัง ' + k + ' ชิ้น');
          }
          CREATED = []; PLACE = null;
        }
        MOB = false;
        const rowH = Math.max(h, opts.rowMin != null ? opts.rowMin : (mob ? GRID.mobH : GRID.deskH));
        CREATED = []; put(await deviceLabel(prefix, mob ? 'Mobile' : 'Desktop', rowH), 0, rowY);
        y = rowY + rowH + GRID.rowGap;
      }
      if (flowSlots) {   // ภาพย่อจอจริงในกล่องหน้าจอของผัง (จอแรกที่ผูกกับกล่องนั้น)
        let k = 0;
        for (const sl of flowSlots.slots) { const cd = (flowSlots.codes[sl.id] || [])[0]; if (cd && byCode[cd] && await fillThumb(sl.rect, byCode[cd])) k++; }
        if (flowSlots.slots.length) log('  · ภาพย่อจอในผัง ' + k + '/' + flowSlots.slots.length + ' กล่อง');
      }
      log('✓ ' + sub.code + ' ' + sub.title + ' (' + n + ' state)');
    }
    y = Math.max(y, flowBottom + GRID.rowGap);   // ผังสูงกว่าแถวจอ ⇒ บล็อกถัดไปเริ่มใต้ผัง
    y += GRID.groupGap - GRID.rowGap;
  }
  CREATED = [];
  return { made, y, flows };
}

/* ======================== userflow (ฝังตอน build) ======================== */
const USERFLOW = {"src":"Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md","scenarios":{"1":{"n":1,"title":"กบค. สร้างแผนบำรุงรักษาประจำปี และจัดรถลงไตรมาส","w":1768,"h":5376,"nodes":[{"id":"S","kind":"end","label":"start","x":212,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nบำรุงรักษา\nตามวาระ","x":180,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nแผนบำรุงรักษา","x":100,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด\nสร้างแผน","x":180,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nบำรุงรักษา","x":100,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ระบุชื่อแผน\n+ เลือก\nปีงบประมาณ","x":180,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"เลือกภาค","x":180,"y":1860,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A7","kind":"action","label":"เลือกเขต\nภายใต้ภาค","x":180,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A8","kind":"action","label":"เลือก\nประเภทรถ","x":180,"y":2340,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"เลือกแท็บ\nไตรมาส","x":180,"y":2580,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบแสดงรถ\nของเขตนี้ใน\nช่องเลือกรถ","x":100,"y":2820,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A5","kind":"action","label":"ค้นทะเบียน\nแล้วเลือกรถ\nลงไตรมาสนี้","x":180,"y":3200,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"หัวข้ออะไหล่\nของไตรมาสนี้\nตั้งต้นว่าง","x":100,"y":3440,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q3","kind":"decision","label":"เพิ่ม แก้\nหรือลบ\nอะไหล่ ?","x":180,"y":3820,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A9","kind":"action","label":"กดเพิ่มอะไหล่\nหรือแก้ไข\nไปที่ S21","x":180,"y":4060,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A10","kind":"action","label":"ยืนยันเอาอะไหล่\nออกจากทุกคัน\nในไตรมาส","x":580,"y":4060,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"จัดรถครบ\nทุกไตรมาส\nที่ต้องการ ?","x":980,"y":4060,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":980,"y":4300,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A6","kind":"action","label":"บันทึก\n+ ส่งอนุมัติ","x":980,"y":4540,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D5","kind":"display","label":"แผนอยู่ใน\nรายการ\nสถานะรออนุมัติ","x":900,"y":4780,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":1012,"y":5192,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[268,284],[268,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[268,556],[268,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[268,936],[268,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[268,1176],[268,1240]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[268,1556],[268,1620]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[268,1796],[268,1860]]},{"from":"A3","to":"A7","label":"","back":false,"pts":[[268,2036],[268,2100]]},{"from":"A7","to":"A8","label":"","back":false,"pts":[[268,2276],[268,2340]]},{"from":"A8","to":"A4","label":"","back":false,"pts":[[268,2516],[268,2580]]},{"from":"A4","to":"D4","label":"","back":false,"pts":[[268,2756],[268,2820]]},{"from":"D4","to":"A5","label":"","back":false,"pts":[[268,3136],[268,3200]]},{"from":"A5","to":"D3","label":"","back":false,"pts":[[268,3376],[268,3440]]},{"from":"D3","to":"Q3","label":"","back":false,"pts":[[268,3756],[268,3820]]},{"from":"Q3","to":"A9","label":"Y","back":false,"pts":[[268,3996],[268,4060]]},{"from":"A9","to":"D3","label":"","back":true,"pts":[[180,4148],[76,4148],[76,3598],[100,3598]]},{"from":"Q3","to":"A10","label":"ลบ","back":false,"pts":[[356,3908],[668,3908],[668,4060]]},{"from":"A10","to":"D3","label":"","back":true,"pts":[[668,4236],[668,4268],[1260,4268],[1260,3598],[436,3598]]},{"from":"Q3","to":"Q2","label":"N","back":false,"pts":[[356,3908],[1068,3908],[1068,4060]]},{"from":"Q2","to":"A4","label":"N","back":true,"pts":[[1156,4148],[1296,4148],[1296,2668],[356,2668]]},{"from":"Q2","to":"Q1","label":"Y","back":false,"pts":[[1068,4236],[1068,4300]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[1156,4388],[1332,4388],[1332,1398],[436,1398]]},{"from":"Q1","to":"A6","label":"Y","back":false,"pts":[[1068,4476],[1068,4540]]},{"from":"A6","to":"D5","label":"","back":false,"pts":[[1068,4716],[1068,4780]]},{"from":"D5","to":"E","label":"","back":false,"pts":[[1068,5096],[1068,5192]]}],"stickies":[{"node":"A2","text":"Q31 ❓ รายการปีงบประมาณในช่องเลือก แสดงย้อนหลังและล่วงหน้ากี่ปี (เจ้าของงาน \"ไม่จำกัดปี\")","x":1408,"y":1620,"w":320},{"node":"A8","text":"Q29 ❓ ประเภทรถอ้างรายการจากทะเบียนรถ VMS+ ชุดไหน","x":1408,"y":2340,"w":320},{"node":"D4","text":"Q30 ❓ รถสถานะรอยุบ/โอน ซ่อนตั้งแต่ตอนเลือก หรือแสดงแต่เลือกไม่ได้","x":1408,"y":2820,"w":320},{"node":"A6","text":"Q32 ❓ ส่งอนุมัติไปที่ใคร (ผู้บังคับบัญชาตามสาย หรือหัวหน้า กบค.) กบค. ต้องเลือกผู้อนุมัติเองไหม","x":1408,"y":4540,"w":320}],"gap":16},"2":{"n":2,"title":"ผู้อนุมัติ ตรวจสอบและอนุมัติแผนบำรุงรักษา","w":1280,"h":3316,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nแผนรออนุมัติ\nหรือแจ้งเตือน","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการแผน\nรออนุมัติ","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายละเอียด\nแผน + รถ\nรายไตรมาส","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบแผน\nเลือกผลการพิจารณา\nอนุมัติเป็นค่าเริ่มต้น","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ผลการ\nพิจารณา ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ระบุเหตุผล\nที่ส่งกลับ","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"กดยืนยัน\nผลการพิจารณา\n+ ยืนยันส่งกลับ","x":120,"y":2410,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ กบค.\nแก้ไข","x":40,"y":2720,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":152,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A5","kind":"action","label":"กดยืนยัน\nผลการพิจารณา\n+ ยืนยันอนุมัติ","x":600,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบเปลี่ยน\nสถานะอนุมัติแล้ว\nส่งรายการให้คลัง S22","x":520,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":632,"y":2822,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"A3","label":"ส่งกลับแก้ไข","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A3","to":"A4","label":"","back":false,"pts":[[208,2276],[208,2410]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[208,2586],[208,2720]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[208,3036],[208,3132]]},{"from":"Q1","to":"A5","label":"อนุมัติ","back":false,"pts":[[296,1948],[688,1948],[688,2100]]},{"from":"A5","to":"D4","label":"","back":false,"pts":[[688,2276],[688,2340]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[688,2656],[688,2822]]}],"stickies":[{"node":"A0","text":"Q32 ❓ ผู้อนุมัติคือใคร (ผู้บังคับบัญชาตามสาย หรือหัวหน้า กบค.) · อนุมัติชั้นเดียวหรือหลายชั้น","x":920,"y":380,"w":320}],"gap":16},"4":{"n":4,"title":"กบค. ติดตามความคืบหน้าและเบิกอะไหล่ของไตรมาส","w":1316,"h":2696,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"เปิดแผน\nไตรมาสที่\nกำลังทำ","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า ความคืบหน้า\nอะไหล่ ต้องเบิก\nเทียบ Smart Inventory","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"กด\nเบิก/จองอะไหล่","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"สรุปรายการ\nเบิก/จอง","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"คงเหลือ\nพอ ?","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D3","kind":"display","label":"รายการที่ไม่พอ\nสถานะรอจัดซื้อ","x":520,"y":1860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D4","kind":"display","label":"สถานะ\nเบิกแล้ว\nครบ","x":40,"y":1860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"กด ไปทำ\nแผนเดินทาง","x":120,"y":2240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E1","kind":"end","label":"ไป S6\nหน้าแผนเดินทาง\nของไตรมาส","x":152,"y":2512,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A2","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"Q1","to":"D3","label":"N","back":false,"pts":[[296,1708],[688,1708],[688,1860]]},{"from":"D3","to":"D1","label":"","back":true,"pts":[[856,2018],[880,2018],[880,778],[376,778]]},{"from":"Q1","to":"D4","label":"Y","back":false,"pts":[[208,1796],[208,1860]]},{"from":"D4","to":"A3","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"A3","to":"E1","label":"","back":false,"pts":[[208,2416],[208,2512]]}],"stickies":[{"node":"D1","text":"Q9 ❓ เชื่อม Smart Inventory กับ VMS+ ยังไง (ดึงคงเหลือ · ส่งเบิก/จอง)","x":956,"y":620,"w":320},{"node":"D3","text":"Q6 ❓ อะไหล่ไม่พอ จัดซื้อนอกระบบ หรือต้องบันทึกในระบบ · สถานะรอจัดซื้อเปลี่ยนเป็นเบิกแล้วเมื่อไหร่","x":956,"y":1860,"w":320}],"gap":16},"6":{"n":6,"title":"กบค. ทำแผนเดินทาง (ตรวจเอง)","w":1352,"h":4556,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผนเดินทาง\nรถในไตรมาส\n+ แผนเดินทาง","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด สร้างแผน\nเดินทาง","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nเดินทาง\nไตรมาส n","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"กด เพิ่มรถ","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D5","kind":"display","label":"popup เพิ่มรถ\nรถของไตรมาส\nที่ยังไม่มีแผนเดินทาง","x":40,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q2","kind":"decision","label":"มีรถ\nให้เลือก ?","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D6","kind":"display","label":"แจ้ง รถทุกคัน\nอยู่ในแผน\nเดินทางแล้ว","x":520,"y":2240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A6","kind":"action","label":"ติ๊กรถ\nกด เพิ่มเข้า\nแผนเดินทาง","x":120,"y":2310,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ตารางรถ\nสถานที่ตั้งต้น\nสำนักงานที่รถอยู่","x":40,"y":2620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A5","kind":"action","label":"แก้เบอร์ติดต่อ\nและสถานที่\nรายคัน ถ้าต้องการ","x":120,"y":3000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"ตั้งชื่อแผนเดินทาง\nเลือกช่วงวัน\n+ พนักงาน","x":120,"y":3240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":120,"y":3480,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A4","kind":"action","label":"ยืนยันการ\nสร้างแผน\nเดินทาง","x":120,"y":3720,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งแผนเดินทาง\nให้ผู้อนุมัติ S7\nสถานะรออนุมัติ","x":40,"y":3960,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":4372,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A2","to":"D5","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"D5","to":"Q2","label":"","back":false,"pts":[[208,1936],[208,2000]]},{"from":"Q2","to":"D6","label":"N","back":false,"pts":[[296,2088],[688,2088],[688,2240]]},{"from":"D6","to":"D2","label":"","back":true,"pts":[[856,2398],[880,2398],[880,1158],[376,1158]]},{"from":"Q2","to":"A6","label":"Y","back":false,"pts":[[208,2176],[208,2310]]},{"from":"A6","to":"D4","label":"","back":false,"pts":[[208,2486],[208,2620]]},{"from":"D4","to":"A5","label":"","back":false,"pts":[[208,2936],[208,3000]]},{"from":"A5","to":"A3","label":"","back":false,"pts":[[208,3176],[208,3240]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[208,3416],[208,3480]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[296,3568],[916,3568],[916,1158],[376,1158]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[208,3656],[208,3720]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[208,3896],[208,3960]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[208,4276],[208,4372]]}],"stickies":[{"node":"D5","text":"Q44 ❓ ฟอร์มที่ยังไม่กดยืนยัน กันรถไว้ไหม · ยกเลิกหรือแก้ไขแผนเดินทางที่ยืนยันแล้ว รถกลับมาเลือกได้ไหม","x":992,"y":1620,"w":320},{"node":"A5","text":"Q47 ❓ เบอร์ติดต่อเจ้าของรถดึงจากข้อมูลไหน · S7 S8 ต้องแสดงเบอร์ด้วยไหม","x":992,"y":3000,"w":320}],"gap":16},"7":{"n":7,"title":"ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง","w":1280,"h":3316,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดแจ้งเตือน\nหรือเมนูแผนเดินทาง\nรออนุมัติ","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nแผนเดินทาง\nรออนุมัติ","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน\nเดินทาง","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง\n+ รถรายคัน","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ\nเลือกผลการพิจารณา\nอนุมัติเป็นค่าเริ่มต้น","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ผลการ\nพิจารณา ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ระบุเหตุผล\nที่ส่งกลับ","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"กดยืนยัน\nผลการพิจารณา\n+ ยืนยันส่งกลับ","x":120,"y":2410,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ กบค. แก้ไข\nที่ S6","x":40,"y":2720,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":152,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A5","kind":"action","label":"กดยืนยัน\nผลการพิจารณา\n+ ยืนยันอนุมัติ","x":600,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบเปลี่ยนสถานะ\nอนุมัติแล้ว\nแจ้งเตือน S8","x":520,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":632,"y":2822,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"A3","label":"ส่งกลับแก้ไข","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A3","to":"A4","label":"","back":false,"pts":[[208,2276],[208,2410]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[208,2586],[208,2720]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[208,3036],[208,3132]]},{"from":"Q1","to":"A5","label":"อนุมัติ","back":false,"pts":[[296,1948],[688,1948],[688,2100]]},{"from":"A5","to":"D4","label":"","back":false,"pts":[[688,2276],[688,2340]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[688,2656],[688,2822]]}],"stickies":[{"node":"A0","text":"Q45 ❓ ผู้อนุมัติแผนเดินทางมาจาก API getUpperLower ตำแหน่งไหน (หัวหน้า กบค. หรือไม่) · ชั้นเดียวหรือหลายชั้น","x":920,"y":380,"w":320}],"gap":16},"8":{"n":8,"title":"กรย. และหน่วยงานเจ้าของรถ ได้รับแจ้งเตือนแผนเดินทาง","w":920,"h":1836,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"ระบบแจ้งเตือน\nในแอป ถึง กรย.\n+ หน่วยงาน","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"ผู้รับ ?","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A1","kind":"action","label":"กดแจ้งเตือน\nฝั่ง กรย.","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า แผนเดินทาง\nดูอย่างเดียว\nรถทุกคันในใบ","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"กดแจ้งเตือน\nฝั่งหน่วยงาน","x":600,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"หน้า แผนเดินทาง\nดูอย่างเดียว\nเฉพาะรถของหน่วยงาน","x":520,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":1652,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"Q1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"Q1","to":"A1","label":"กรย.","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"Q1","to":"A2","label":"หน่วยงานเจ้าของรถ","back":false,"pts":[[296,848],[688,848],[688,1000]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[688,1176],[688,1240]]},{"from":"D2","to":"E","label":"","back":false,"pts":[[208,1556],[208,1652]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[688,1556],[688,1588],[208,1588],[208,1652]]}],"stickies":[],"gap":16},"9":{"n":9,"title":"กบค. สร้างแผนเดินทางจ้างดำเนินการ (vendor)","w":836,"h":3796,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผนเดินทาง\nรถในไตรมาส\n+ แผนเดินทาง","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด สร้างแผน\nเดินทาง","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nเดินทาง เลือก\nจ้างดำเนินการ","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"เลือกผู้รับจ้าง\nจาก vendor list\n+ เลขที่สัญญา","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด เพิ่มรถ","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D5","kind":"display","label":"popup เพิ่มรถ\nรถของไตรมาส\nที่ยังไม่มีแผนเดินทาง","x":40,"y":1860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A4","kind":"action","label":"ติ๊กรถ\nกด เพิ่มเข้า\nแผนเดินทาง","x":120,"y":2240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A5","kind":"action","label":"แก้เบอร์ติดต่อ\nสถานที่รายคัน +\nเลือกช่วงวันทำงาน","x":120,"y":2480,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":120,"y":2720,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A6","kind":"action","label":"ยืนยันการ\nสร้างแผน\nเดินทาง","x":120,"y":2960,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งแผนเดินทาง\nให้ผู้อนุมัติ S7\nสถานะรออนุมัติ","x":40,"y":3200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":3612,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A3","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A3","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"D5","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"D5","to":"A4","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"A4","to":"A5","label":"","back":false,"pts":[[208,2416],[208,2480]]},{"from":"A5","to":"Q1","label":"","back":false,"pts":[[208,2656],[208,2720]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[296,2808],[400,2808],[400,1158],[376,1158]]},{"from":"Q1","to":"A6","label":"Y","back":false,"pts":[[208,2896],[208,2960]]},{"from":"A6","to":"D3","label":"","back":false,"pts":[[208,3136],[208,3200]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[208,3516],[208,3612]]}],"stickies":[{"node":"A3","text":"Q46 ❓ vendor list มาจากไหน (ทะเบียนผู้รับจ้างของ กฟภ. หรือ กบค. เพิ่มเอง) · กรองตามประเภทรถไหม · เลขที่สัญญาบังคับไหม","x":476,"y":1380,"w":320}],"gap":16},"10":{"n":10,"title":"กบค. บันทึกงานบำรุงรักษารายคัน","w":2064,"h":4176,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"ไปจุดนัด\nรับอะไหล่\n(นอกระบบ)","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง\nสถานะงานรายคัน","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เลือกรถ\nทีละคัน","x":120,"y":1070,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า งานรายคัน\nยังไม่เริ่ม","x":40,"y":1380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษา\nได้ ?","x":120,"y":1760,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"กด บำรุงรักษา\nไม่ได้ ระบุสาเหตุ\n+ อะไหล่ส่งคืน","x":600,"y":2620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด เริ่มงาน\nตรวจรายการรับรถ\n+ ลงนามรับมอบ","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"งานรายคัน\nอยู่ระหว่าง\nบำรุงรักษา","x":40,"y":2240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A4","kind":"action","label":"ตรวจ + บำรุง\n+ เก็บตัวอย่าง\nน้ำมัน (นอกระบบ)","x":120,"y":2620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A5","kind":"action","label":"กด ปิดงาน\nกรอกผลงาน ตรวจสภาพ\n+ ลงนามส่งคืน","x":120,"y":2860,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"ระบุครบ ?","x":120,"y":3100,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"ระบบบันทึกผล\nเสร็จสิ้น หรือ\nบำรุงรักษาไม่ได้","x":40,"y":3340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q3","kind":"decision","label":"มีคันอื่น\nในแผน ?","x":120,"y":3720,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E","kind":"end","label":"End","x":152,"y":3992,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D5","kind":"display","label":"หน้า งานรายคัน\nเสร็จสิ้น\nดูอย่างเดียว","x":520,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A6","kind":"action","label":"แก้เบอร์ติดต่อ\nและสถานที่\nของรถ","x":1000,"y":1070,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A7","kind":"action","label":"ยืนยันเอารถ\nออกจาก\nแผนเดินทาง","x":1320,"y":1070,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1070]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1246],[208,1380]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[208,1696],[208,1760]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[296,1848],[688,1848],[688,2620]]},{"from":"Q1","to":"A2","label":"Y","back":false,"pts":[[208,1936],[208,2000]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"D3","to":"A4","label":"","back":false,"pts":[[208,2556],[208,2620]]},{"from":"D3","to":"A3","label":"ทำต่อไม่ได้","back":false,"pts":[[376,2398],[688,2398],[688,2620]]},{"from":"A4","to":"A5","label":"","back":false,"pts":[[208,2796],[208,2860]]},{"from":"A5","to":"Q2","label":"","back":false,"pts":[[208,3036],[208,3100]]},{"from":"Q2","to":"A5","label":"N","back":true,"pts":[[296,3188],[1520,3188],[1520,2948],[296,2948]]},{"from":"Q2","to":"D4","label":"Y","back":false,"pts":[[208,3276],[208,3340]]},{"from":"A3","to":"D4","label":"","back":false,"pts":[[688,2796],[688,3308],[208,3308],[208,3340]]},{"from":"D4","to":"Q3","label":"","back":false,"pts":[[208,3656],[208,3720]]},{"from":"Q3","to":"D1","label":"Y","back":true,"pts":[[296,3808],[1556,3808],[1556,778],[376,778]]},{"from":"Q3","to":"E","label":"N","back":false,"pts":[[208,3896],[208,3992]]},{"from":"D1","to":"D5","label":"คันที่ปิดงานแล้ว","back":false,"pts":[[376,778],[688,778],[688,1000]]},{"from":"D1","to":"A6","label":"เมนู แก้ไข","back":false,"pts":[[376,778],[1088,778],[1088,1070]]},{"from":"A6","to":"D1","label":"","back":true,"pts":[[1088,1246],[1088,1278],[1592,1278],[1592,778],[376,778]]},{"from":"D1","to":"A7","label":"เมนู ลบ","back":false,"pts":[[376,778],[1408,778],[1408,1070]]},{"from":"A7","to":"D1","label":"","back":true,"pts":[[1496,1158],[1628,1158],[1628,778],[376,778]]}],"stickies":[{"node":"A4","text":"Q18 ❓ (บอร์ด) ชั่วโมงเครื่องจักร — ภาพถ่ายหรือกรอกข้อมูล? · อะไหล่เก่า? · อะไหล่ใหม่ (ถ้าเหลือ?)","x":1704,"y":2620,"w":320}],"gap":16},"11":{"n":11,"title":"กบค. ตรวจรับงานรายคันของผู้รับจ้างและรับคืนอะไหล่","w":1280,"h":3556,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดแจ้งเตือน\nส่งตรวจงาน\nหรือเปิดแผนเดินทาง","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง\nคันที่รอตรวจรับ","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เลือกรถ\nที่รอตรวจรับ","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า งานรายคัน\nรอตรวจรับ\nผลงาน + อะไหล่ส่งคืน","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ\nข้อมูลจาก\nผู้รับจ้าง","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ตรวจสอบ\nผ่าน ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A4","kind":"action","label":"เลือก อนุมัติ\nกดยืนยัน\nผลการพิจารณา","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"เลือก ส่งกลับแก้ไข\nระบุเหตุผล\nกดยืนยัน","x":600,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ผู้รับจ้าง\nแก้ไขที่ S23","x":520,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":632,"y":2752,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A6","kind":"action","label":"ระบบรับคืนอะไหล่\nตามจำนวนที่คืน\n+ บันทึกผล","x":120,"y":2410,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"ผู้รับจ้าง\nปิดงาน ?","x":120,"y":2720,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"งานรายคัน\nเสร็จสิ้น","x":40,"y":2960,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D5","kind":"display","label":"งานรายคัน\nบำรุงรักษาไม่ได้","x":520,"y":2960,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":3372,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[296,1948],[688,1948],[688,2100]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[688,2276],[688,2340]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[688,2656],[688,2752]]},{"from":"A4","to":"A6","label":"","back":false,"pts":[[208,2276],[208,2410]]},{"from":"A6","to":"Q2","label":"","back":false,"pts":[[208,2586],[208,2720]]},{"from":"Q2","to":"D4","label":"Y","back":false,"pts":[[208,2896],[208,2960]]},{"from":"Q2","to":"D5","label":"N","back":false,"pts":[[208,2896],[208,2928],[688,2928],[688,2960]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[208,3276],[208,3372]]},{"from":"D5","to":"E","label":"","back":false,"pts":[[688,3276],[688,3308],[208,3308],[208,3372]]}],"stickies":[{"node":"A6","text":"Q41 ❓ อะไหล่ที่รับคืนกลับเข้าคลังทางไหน (ระบบจองอะไหล่ Q9) หรือยกไปใช้ไตรมาสถัดไป","x":920,"y":2410,"w":320},{"node":"D1","text":"Q50 ❓ จนท. กบค. ที่ตรวจรับคือใคร ผู้สร้างแผนเดินทาง หรือ กบค. คนใดก็ได้ในหน่วย","x":920,"y":620,"w":320}],"gap":16},"12":{"n":12,"title":"กบค. บันทึกผลตรวจน้ำมันไฮโดรลิก","w":1376,"h":2836,"nodes":[{"id":"S","kind":"end","label":"start","x":212,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"หน้าปิดงาน\nเลือกน้ำมันแบบ\nเก็บตัวอย่าง","x":180,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"มีผลตอน\nปิดงาน ?","x":180,"y":620,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A1","kind":"action","label":"ใส่ผลการทดสอบ\n(ถ้ามี) + แนบไฟล์\nในหน้าปิดงาน","x":180,"y":930,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบเก็บผล\nไว้ในข้อมูล\nรถคันนั้น","x":100,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D1","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง ป้าย\nรอผลตรวจน้ำมัน","x":580,"y":860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจน้ำมัน\nที่ห้องทดสอบ\n(นอกระบบ)","x":660,"y":1310,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กดปุ่ม … ของรถ\nดูรายละเอียด","x":660,"y":1690,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า งานรายคัน\nsection ผลการทดสอบ\nน้ำมันไฮโดรลิก","x":580,"y":2000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A4","kind":"action","label":"เลือก ผ่าน หรือ\nไม่ผ่าน + แนบไฟล์\nกด บันทึกผลการทดสอบ","x":660,"y":2380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"เลือกผล\nแล้ว ?","x":660,"y":2620,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"ป้ายที่สถานะงาน\nผ่าน ป้ายหาย\nไม่ผ่าน น้ำมันไม่ผ่าน","x":100,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":212,"y":2102,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[268,284],[268,380]]},{"from":"A0","to":"Q1","label":"","back":false,"pts":[[268,556],[268,620]]},{"from":"Q1","to":"A1","label":"Y","back":false,"pts":[[268,796],[268,930]]},{"from":"A1","to":"D3","label":"","back":false,"pts":[[268,1106],[268,1240]]},{"from":"Q1","to":"D1","label":"N","back":false,"pts":[[356,708],[748,708],[748,860]]},{"from":"D1","to":"A2","label":"","back":false,"pts":[[748,1176],[748,1310]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[748,1486],[748,1690]]},{"from":"A3","to":"D2","label":"","back":false,"pts":[[748,1866],[748,2000]]},{"from":"D2","to":"A4","label":"","back":false,"pts":[[748,2316],[748,2380]]},{"from":"A4","to":"Q2","label":"","back":false,"pts":[[748,2556],[748,2620]]},{"from":"Q2","to":"D2","label":"N","back":true,"pts":[[836,2708],[940,2708],[940,2158],[916,2158]]},{"from":"Q2","to":"D3","label":"Y","back":true,"pts":[[660,2708],[76,2708],[76,1398],[100,1398]]},{"from":"D3","to":"D4","label":"","back":false,"pts":[[268,1556],[268,1620]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[268,1936],[268,2102]]},{"from":"D4","to":"D2","label":"แก้ผลภายหลัง","back":false,"pts":[[268,1936],[268,1968],[748,1968],[748,2000]]}],"stickies":[{"node":"D3","text":"Q21 ❓ ผลไม่ผ่านมีผลต่อแผนรอบถัดไปไหม (เช่น ให้เปลี่ยนน้ำมันรอบหน้า) · จะเริ่มแจ้งเจ้าของรถเมื่อไหร่","x":1016,"y":1240,"w":320},{"node":"D1","text":"Q51 ❓ ป้ายรอผลที่ข้อมูลรถรายคัน (Vehicle Management ระบบเดิม) ทำเมื่อไหร่ ใครดูแลหน้านั้น","x":1016,"y":860,"w":320}],"gap":16},"13":{"n":13,"title":"หน่วยงาน/เจ้าของรถ ยอมรับผลการตรวจบำรุงรถรายคัน","w":1120,"h":3316,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ได้รับแจ้งเตือน\ne-mail + VMS+\n(รายคัน)","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A0","kind":"action","label":"กดลิงก์/เมนู\nจากแจ้งเตือน","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nการตรวจบำรุงรถ\nที่รอตรวจสอบ","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดรายการ\nของคันนั้น","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายการ\nตรวจบำรุงรถ\nใบตรวจ 2 ใบ","x":40,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ดูใบตรวจ\n+ ภาพก่อน/หลัง","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กดยอมรับ\nผลการตรวจ\nบำรุงรถ","x":120,"y":2240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบบันทึก\nการยอมรับ\nรายคัน","x":40,"y":2480,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษาครบ\nทุกคันตามแผน ?","x":120,"y":2860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E1","kind":"end","label":"รอแจ้งเตือน\nคันถัดไป","x":552,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"E2","kind":"end","label":"ไป S14\nตรวจหลักฐาน\nทั้งแผน","x":152,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D0","to":"A0","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1936],[208,2000]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[208,2416],[208,2480]]},{"from":"D3","to":"Q1","label":"","back":false,"pts":[[208,2796],[208,2860]]},{"from":"Q1","to":"E1","label":"N","back":false,"pts":[[296,2948],[608,2948],[608,3132]]},{"from":"Q1","to":"E2","label":"Y","back":false,"pts":[[208,3036],[208,3132]]}],"stickies":[{"node":"D2","text":"Q19 ❓ (บอร์ด) กรณีที่ไม่สามารถบำรุงรักษาได้ จำเป็นต้องใช้ form รูปแบบเดียวกันไหม? หากแยกกันจะต้องมี field อะไรบ้าง?","x":760,"y":1620,"w":320},{"node":"A3","text":"Q23 ❓ ถ้าไม่ยอมรับผล ทำยังไง (บอร์ดมีแค่ปุ่มยอมรับ) · \"หน่วยงาน\" กับ \"เจ้าของรถ\" เป็นคนเดียวกันไหม","x":760,"y":2240,"w":320}],"gap":16},"14":{"n":14,"title":"หน่วยงาน/เจ้าของรถ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)","w":800,"h":3316,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ได้รับแจ้งเตือน\ne-mail + VMS+\n(ครบทุกคัน)","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A0","kind":"action","label":"กดลิงก์/เมนู\nจากแจ้งเตือน","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nการตรวจบำรุงรถ\nที่รอตรวจสอบ","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดรายการ\nของแผน","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า เอกสาร\nหลักฐานการตรวจ\nบำรุงรถทั้งแผน","x":40,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ\nเอกสาร\nหลักฐาน","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"ประเมิน\nความพึงพอใจ","x":120,"y":2240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"กดยอมรับ\nผลการตรวจ\nบำรุงรถ","x":120,"y":2480,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบบันทึก\nการยอมรับ\n+ แจ้ง กบค.","x":40,"y":2720,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D0","to":"A0","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1936],[208,2000]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"A3","to":"A4","label":"","back":false,"pts":[[208,2416],[208,2480]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[208,2656],[208,2720]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[208,3036],[208,3132]]}],"stickies":[{"node":"A3","text":"Q22 ❓ (บอร์ด) ประเมินความพึงพอใจ (ต้องทำทุกครั้ง?) · แบบประเมินมีข้อ/สเกลอะไร","x":440,"y":2240,"w":320},{"node":"A4","text":"Q28 ❓ การยอมรับ 2 รอบ (รายคัน S13 + ทั้งแผน S14) จำเป็นทั้งคู่ไหม หรือรอบเดียวพอ","x":440,"y":2480,"w":320}],"gap":16},"15":{"n":15,"title":"กบค. บันทึกและส่งประวัติงานบำรุงรักษา","w":1120,"h":2456,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\nความคืบหน้ารายคัน","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษาเสร็จ\nทั้งหมด ?","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E1","kind":"end","label":"กลับ S10\nทำคันที่เหลือ","x":552,"y":1102,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D2","kind":"display","label":"หน้า ประวัติงาน\nบำรุงรักษา\nทั้งหมด","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"ตรวจทาน\nประวัติ","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด ส่งประวัติ\nให้หัวหน้า\nตรวจสอบ","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบเปลี่ยน\nสถานะ\nรอหัวหน้าตรวจ","x":40,"y":1860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":2272,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"Q1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"Q1","to":"E1","label":"N","back":false,"pts":[[296,848],[608,848],[608,1102]]},{"from":"Q1","to":"D2","label":"Y","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A1","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[208,2176],[208,2272]]}],"stickies":[{"node":"Q1","text":"Q24 ❓ คันที่ \"บำรุงรักษาไม่ได้\" (S10) นับว่าเสร็จไหม — ส่งประวัติได้ทั้งที่มีคันทำไม่ได้หรือเปล่า","x":760,"y":760,"w":320}],"gap":16},"16":{"n":16,"title":"หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา","w":920,"h":2936,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nประวัติรอ\nตรวจสอบ","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nประวัติรอ\nตรวจสอบ","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า ประวัติงาน\nบำรุงรักษา\nของแผน","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ผ่าน ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ตีกลับ\n+ ระบุเหตุผล","x":600,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ กบค.\nแก้ไข","x":520,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":632,"y":2752,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"กดอนุมัติ","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบบันทึก\nประวัติ\nเป็นทางการ","x":40,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":2752,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[296,1948],[688,1948],[688,2100]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[688,2276],[688,2340]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[688,2656],[688,2752]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A4","to":"D4","label":"","back":false,"pts":[[208,2276],[208,2340]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[208,2656],[208,2752]]}],"stickies":[],"gap":16},"17":{"n":17,"title":"กบค. ออกรายงานผลและปิดงาน","w":836,"h":2696,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\n(ประวัติผ่านแล้ว)","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด รายงานผล\nการบำรุงรักษา","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายงานผล\nการบำรุงรักษา","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ดาวน์โหลด\nรายงาน","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กด ปิดงาน","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ยืนยัน\nปิดงาน ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D3","kind":"display","label":"ระบบเปลี่ยน\nสถานะแผน\nปิดงานแล้ว","x":40,"y":2100,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":2512,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[296,1948],[400,1948],[400,1158],[376,1158]]},{"from":"Q1","to":"D3","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[208,2416],[208,2512]]}],"stickies":[{"node":"D2","text":"Q25 ❓ รายงานผลมีหัวข้ออะไรบ้าง รูปแบบไฟล์ (PDF/Excel) — บอร์ดบอกแค่ \"Download ได้\"","x":476,"y":1000,"w":320}],"gap":16},"18":{"n":18,"title":"กบค. คำนวณต้นทุนการบำรุงรักษา","w":800,"h":2456,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\n(ปิดงานแล้ว)","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด คำนวณ\nต้นทุน","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า ต้นทุน\nค่าแรง ที่พัก\nเดินทาง","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจทาน\nค่าใช้จ่าย","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบแสดง\nSummary\nต้นทุน","x":40,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"ดาวน์โหลด\nExcel","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":152,"y":2272,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"D3","to":"A3","label":"","back":false,"pts":[[208,1936],[208,2000]]},{"from":"A3","to":"E","label":"","back":false,"pts":[[208,2176],[208,2272]]}],"stickies":[{"node":"D2","text":"Q26 ❓ \"ค่าแรง\" ในต้นทุน กับ \"ค่าเบี้ยเลี้ยง\" ที่กรอกรายคันตอนปิดงาน (S10 · ย้ายจาก S6 3 พ.ย. 2569) เป็นรายการเดียวกันไหม · ต้นทุนรวมค่าอะไหล่/ค่าจ้างผู้รับจ้างไหม","x":440,"y":1000,"w":320}],"gap":16},"19":{"n":19,"title":"กบค. แก้ไขแผนบำรุงรักษา แล้วส่งอนุมัติใหม่","w":1892,"h":4076,"nodes":[{"id":"S","kind":"end","label":"start","x":248,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า รายการ\nแผนบำรุงรักษา","x":136,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กดเมนู …\nหรือเปิดหน้า\nรายละเอียดแผน","x":216,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"สถานะแผน\nแก้ไขได้ ?","x":216,"y":1000,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D2","kind":"display","label":"ดูรายละเอียด\nได้อย่างเดียว","x":616,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":728,"y":1722,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A2","kind":"action","label":"กด แก้ไข","x":216,"y":1310,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"หน้า แก้ไขแผน\nค่าเดิมกรอกไว้","x":136,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"แก้ชื่อแผน ภาค\nประเภทรถ\nหรือรถรายไตรมาส","x":216,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"เอาภาค เขต\nหรือประเภทรถ\nออก ?","x":216,"y":2240,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"ยืนยันเอารถ\nที่ตรงค่านั้นออก","x":136,"y":2480,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q3","kind":"decision","label":"บันทึก\nหรือออก ?","x":696,"y":2550,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D5","kind":"display","label":"ยืนยันการออก\nเมื่อมีการแก้ไข","x":1096,"y":2860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D6","kind":"display","label":"ยืนยันการแก้ไข\nส่งอนุมัติใหม่","x":616,"y":2860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q4","kind":"decision","label":"บันทึก\nสำเร็จ ?","x":696,"y":3240,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D7","kind":"display","label":"แจ้งบันทึก\nไม่สำเร็จ","x":1096,"y":3480,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D8","kind":"display","label":"แผนสถานะ\nรออนุมัติ","x":616,"y":3480,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E2","kind":"end","label":"กลับ S2\nผู้อนุมัติ\nตรวจสอบ","x":728,"y":3892,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[304,284],[304,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[304,696],[304,760]]},{"from":"A1","to":"Q1","label":"","back":false,"pts":[[304,936],[304,1000]]},{"from":"Q1","to":"D2","label":"N","back":false,"pts":[[392,1088],[784,1088],[784,1240]]},{"from":"D2","to":"E1","label":"","back":false,"pts":[[784,1556],[784,1722]]},{"from":"Q1","to":"A2","label":"Y","back":false,"pts":[[304,1176],[304,1310]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[304,1486],[304,1620]]},{"from":"D3","to":"A3","label":"","back":false,"pts":[[304,1936],[304,2000]]},{"from":"A3","to":"Q2","label":"","back":false,"pts":[[304,2176],[304,2240]]},{"from":"Q2","to":"D4","label":"Y","back":false,"pts":[[304,2416],[304,2480]]},{"from":"D4","to":"D3","label":"","back":true,"pts":[[136,2638],[112,2638],[112,1778],[136,1778]]},{"from":"Q2","to":"Q3","label":"N","back":false,"pts":[[392,2328],[784,2328],[784,2550]]},{"from":"Q3","to":"D5","label":"N","back":false,"pts":[[872,2638],[1264,2638],[1264,2860]]},{"from":"D5","to":"D1","label":"","back":true,"pts":[[1432,3018],[1456,3018],[1456,538],[472,538]]},{"from":"Q3","to":"D6","label":"Y","back":false,"pts":[[784,2726],[784,2860]]},{"from":"D6","to":"Q4","label":"","back":false,"pts":[[784,3176],[784,3240]]},{"from":"Q4","to":"D7","label":"N","back":false,"pts":[[872,3328],[1264,3328],[1264,3480]]},{"from":"D7","to":"D3","label":"","back":true,"pts":[[1264,3796],[1264,3828],[76,3828],[76,1778],[136,1778]]},{"from":"Q4","to":"D8","label":"Y","back":false,"pts":[[784,3416],[784,3480]]},{"from":"D8","to":"E2","label":"","back":false,"pts":[[784,3796],[784,3892]]}],"stickies":[{"node":"Q1","text":"Q34 ❓ แผนที่อนุมัติแล้ว แก้เรื่องเล็กน้อย เช่น ชื่อแผน ต้องส่งอนุมัติใหม่ทุกครั้งหรือไม่ (ตอนนี้ใส่ไว้ก่อนว่าต้องส่งทุกครั้ง)","x":1532,"y":1000,"w":320}],"gap":16},"20":{"n":20,"title":"กบค. ลบแผนบำรุงรักษาที่ยังไม่อนุมัติ","w":1340,"h":2456,"nodes":[{"id":"S","kind":"end","label":"start","x":212,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า รายการ\nแผนบำรุงรักษา","x":100,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กดเมนู …\nเลือกลบ","x":180,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"เปิดหน้า\nรายละเอียดแผน\nกดลบแผน","x":660,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"แผนยัง\nไม่อนุมัติ ?","x":180,"y":1000,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D2","kind":"display","label":"ไม่มีปุ่มลบ\nแก้ไขได้ตาม S19","x":580,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":692,"y":1652,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D3","kind":"display","label":"ยืนยันการ\nลบแผน","x":100,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q2","kind":"decision","label":"ยืนยัน ?","x":180,"y":1620,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"ลบแผนออกจาก\nรายการ\nแจ้งลบสำเร็จ","x":100,"y":1860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":212,"y":2272,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[268,284],[268,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[268,696],[268,760]]},{"from":"D1","to":"A2","label":"","back":false,"pts":[[436,538],[748,538],[748,760]]},{"from":"A1","to":"Q1","label":"","back":false,"pts":[[268,936],[268,1000]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[748,936],[748,968],[268,968],[268,1000]]},{"from":"Q1","to":"D2","label":"N","back":false,"pts":[[356,1088],[748,1088],[748,1240]]},{"from":"D2","to":"E1","label":"","back":false,"pts":[[748,1556],[748,1652]]},{"from":"Q1","to":"D3","label":"Y","back":false,"pts":[[268,1176],[268,1240]]},{"from":"D3","to":"Q2","label":"","back":false,"pts":[[268,1556],[268,1620]]},{"from":"Q2","to":"D1","label":"N","back":true,"pts":[[180,1708],[76,1708],[76,538],[100,538]]},{"from":"Q2","to":"D4","label":"Y","back":false,"pts":[[268,1796],[268,1860]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[268,2176],[268,2272]]}],"stickies":[{"node":"Q1","text":"Q35 ❓ แผนที่อนุมัติแล้วแต่ยังไม่เริ่มงานจะเอาออกอย่างไร (ไม่มียกเลิกแผนแล้ว · ตอนนี้ลบไม่ได้)","x":980,"y":1000,"w":320}],"gap":16},"21":{"n":21,"title":"กบค. กำหนดอะไหล่ของรถแต่ละคันในแผน","w":836,"h":4276,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"อะไหล่ในไตรมาส\nบนฟอร์มแผน","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กดเพิ่มอะไหล่\nหรือไอคอนแก้ไข\nที่แถวรถ","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า อะไหล่\nของรถ","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"เลือกรถ\nในแผน","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบแสดง\nอะไหล่ที่เลือกไว้\nของคันนี้ ตั้งต้นว่าง","x":40,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A6","kind":"action","label":"เลือกเก็บตัวอย่าง\nหรือเปลี่ยน\nน้ำมันไฮดรอลิก","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"ค้นคลังอะไหล่\nแล้วกดเลือก","x":120,"y":2240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A7","kind":"action","label":"กดระบุอะไหล่\nเพิ่มเติม ถ้าไม่มี\nในคลัง","x":120,"y":2480,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A8","kind":"action","label":"กรอกชื่อ รหัส\nราคา จำนวน","x":120,"y":2720,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"แก้จำนวน\nหรือเอาออก","x":120,"y":2960,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ครบ ?","x":120,"y":3200,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A5","kind":"action","label":"กดบันทึก\nอะไหล่ของรถ","x":120,"y":3440,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"กลับฟอร์มแผน\nอะไหล่ในไตรมาส\nเปลี่ยนตาม","x":40,"y":3680,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":4092,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"D3","to":"A6","label":"","back":false,"pts":[[208,1936],[208,2000]]},{"from":"A6","to":"A3","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"A3","to":"A7","label":"","back":false,"pts":[[208,2416],[208,2480]]},{"from":"A7","to":"A8","label":"","back":false,"pts":[[208,2656],[208,2720]]},{"from":"A8","to":"A4","label":"","back":false,"pts":[[208,2896],[208,2960]]},{"from":"A4","to":"Q1","label":"","back":false,"pts":[[208,3136],[208,3200]]},{"from":"Q1","to":"A3","label":"N","back":true,"pts":[[296,3288],[400,3288],[400,2328],[296,2328]]},{"from":"Q1","to":"A5","label":"Y","back":false,"pts":[[208,3376],[208,3440]]},{"from":"A5","to":"D4","label":"","back":false,"pts":[[208,3616],[208,3680]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[208,3996],[208,4092]]}],"stickies":[{"node":"A6","text":"Q39 ❓ เงื่อนไขอายุการใช้งานของน้ำมันคืออะไร นอกจากอายุ 3 ปี · คันที่เลือกเปลี่ยนน้ำมัน ยังต้องเก็บตัวอย่างและบันทึกผลตรวจ (S10 S12) ไหม","x":476,"y":2000,"w":320},{"node":"D4","text":"Q38 ❓ เปลี่ยนรถออกจากแผนแล้ว อะไหล่ที่เพิ่มเองของคันนั้นหายไปด้วยใช่ไหม","x":476,"y":3680,"w":320}],"gap":16},"22":{"n":22,"title":"กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส","w":1316,"h":3836,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ระบบส่งรายการ\nอะไหล่ทั้งปี\nแยกไตรมาส","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A0","kind":"action","label":"กบค. คลัง\nได้แจ้งเตือน\nหรือเปิดเมนู","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการแผน\nที่ต้องเตรียม\nอะไหล่","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า อะไหล่\nที่ต้องเบิก\nแยกแท็บไตรมาส","x":40,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ดูทีละไตรมาส\nเทียบคงเหลือ\nในคลัง","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กดรับทราบ\nไตรมาสนั้น\n+ ยืนยัน","x":120,"y":2240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ไตรมาสนั้น\nรับทราบแล้ว","x":40,"y":2480,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D5","kind":"display","label":"หน้ารายการและ\nรายละเอียดแผน\nของ กบค. เห็น\nสถานะรายไตรมาส","x":40,"y":2860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"รับทราบครบ\nทุกไตรมาส\nที่มีรถ ?","x":600,"y":2930,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"สถานะฝั่งคลัง\nรับทราบครบแล้ว","x":520,"y":3240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":632,"y":3652,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D0","to":"A0","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1936],[208,2000]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[208,2416],[208,2480]]},{"from":"D3","to":"D5","label":"","back":false,"pts":[[208,2796],[208,2860]]},{"from":"D3","to":"Q1","label":"","back":false,"pts":[[376,2638],[688,2638],[688,2930]]},{"from":"Q1","to":"A2","label":"N","back":true,"pts":[[776,3018],[880,3018],[880,2088],[296,2088]]},{"from":"Q1","to":"D4","label":"Y","back":false,"pts":[[688,3106],[688,3240]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[688,3556],[688,3652]]}],"stickies":[{"node":"A0","text":"Q42 ❓ กบค. คลัง คือบทบาทแยกในระบบ หรือ กบค. ที่ได้สิทธิ์คลัง · ได้แจ้งเตือนทางไหน","x":956,"y":760,"w":320},{"node":"D2","text":"Q43 ❓ แก้แผนหลังอนุมัติ (S19 ส่งอนุมัติใหม่) ต้องส่งรายการให้คลังรับทราบใหม่ไหม · อะไหล่ไม่พอ คลังต้องแจ้งกลับ กบค. ไหม","x":956,"y":1620,"w":320}],"gap":16},"23":{"n":23,"title":"ผู้รับจ้าง บันทึกงานรายคันและส่งตรวจงาน","w":1928,"h":4696,"nodes":[{"id":"S","kind":"end","label":"start","x":212,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง\nมุมผู้รับจ้าง","x":100,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เลือกรถ\nทีละคัน","x":180,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า งานรายคัน\nยังไม่เริ่ม\nดูอย่างเดียว","x":100,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษา\nได้ ?","x":180,"y":1380,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"กด บำรุงรักษา\nไม่ได้ ระบุสาเหตุ\n+ อะไหล่ส่งคืน","x":660,"y":2240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด เริ่มงาน\nรับรถ + ลงนาม\n(หน้าเดียวกับ S10)","x":180,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"งานรายคัน\nอยู่ระหว่าง\nบำรุงรักษา","x":100,"y":1860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A5","kind":"action","label":"กด ปิดงาน\nกรอกผลงาน\n(หน้าเดียวกับ S10)","x":1140,"y":2240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"งานรายคัน\nดำเนินการ\nบำรุงรักษาแล้ว","x":1060,"y":4340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D5","kind":"display","label":"งานรายคัน\nแจ้งบำรุงรักษา\nไม่ได้","x":580,"y":2480,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A6","kind":"action","label":"popup แก้ไขอะไหล่\nหรือ ยืนยัน\nเอาออก","x":1140,"y":4100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A8","kind":"action","label":"กด ส่งตรวจงาน\n+ ยืนยัน","x":660,"y":2860,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D6","kind":"display","label":"งานรายคัน\nรอตรวจรับ\n(ต่อ S11)","x":580,"y":3100,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q2","kind":"decision","label":"กบค. ตรวจรับ\nผ่าน ?","x":660,"y":3480,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D7","kind":"display","label":"เสร็จสิ้น หรือ\nบำรุงรักษาไม่ได้","x":580,"y":3720,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D8","kind":"display","label":"หน้า งานรายคัน\nส่งกลับแก้ไข\n+ เหตุผลจาก กบค.","x":1060,"y":3720,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q3","kind":"decision","label":"มีคันอื่น\nในใบ ?","x":660,"y":4100,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E","kind":"end","label":"End","x":692,"y":4442,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[268,284],[268,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[268,696],[268,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[268,936],[268,1000]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[268,1316],[268,1380]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[356,1468],[748,1468],[748,2240]]},{"from":"Q1","to":"A2","label":"Y","back":false,"pts":[[268,1556],[268,1620]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[268,1796],[268,1860]]},{"from":"D3","to":"A3","label":"ทำต่อไม่ได้","back":false,"pts":[[436,2018],[748,2018],[748,2240]]},{"from":"D3","to":"A5","label":"","back":false,"pts":[[436,2018],[1228,2018],[1228,2240]]},{"from":"A5","to":"D4","label":"","back":false,"pts":[[1140,2328],[988,2328],[988,4498],[1060,4498]]},{"from":"A3","to":"D5","label":"","back":false,"pts":[[748,2416],[748,2480]]},{"from":"D4","to":"A6","label":"แก้ไข ลบ<br/>อะไหล่ ภาพ","back":true,"pts":[[1396,4498],[1420,4498],[1420,4188],[1316,4188]]},{"from":"A6","to":"D4","label":"","back":false,"pts":[[1228,4276],[1228,4340]]},{"from":"D4","to":"A8","label":"","back":true,"pts":[[1396,4498],[1456,4498],[1456,2948],[836,2948]]},{"from":"D5","to":"A8","label":"","back":false,"pts":[[748,2796],[748,2860]]},{"from":"A8","to":"D6","label":"","back":false,"pts":[[748,3036],[748,3100]]},{"from":"D6","to":"Q2","label":"","back":false,"pts":[[748,3416],[748,3480]]},{"from":"Q2","to":"D7","label":"Y","back":false,"pts":[[748,3656],[748,3720]]},{"from":"Q2","to":"D8","label":"N","back":false,"pts":[[836,3568],[1228,3568],[1228,3720]]},{"from":"D8","to":"A6","label":"ปิดงานไว้","back":false,"pts":[[1228,4036],[1228,4100]]},{"from":"D8","to":"Q1","label":"แจ้งไม่ได้ไว้","back":true,"pts":[[1396,3878],[1492,3878],[1492,1468],[356,1468]]},{"from":"D7","to":"Q3","label":"","back":false,"pts":[[748,4036],[748,4100]]},{"from":"Q3","to":"D1","label":"Y","back":true,"pts":[[660,4188],[76,4188],[76,538],[100,538]]},{"from":"Q3","to":"E","label":"N","back":false,"pts":[[748,4276],[748,4442]]}],"stickies":[{"node":"A8","text":"Q49 ❓ ส่งตรวจงานทีละคันอย่างเดียว หรือเลือกหลายคันส่งพร้อมกันได้ด้วย","x":1568,"y":2860,"w":320}],"gap":16}},"journey":{"_note":"journey แนวขวาง (เจ้าของงานสั่ง 22 ต.ค. 2569) — cols = ลำดับคอลัมน์ซ้าย→ขวา · row = scenario ที่อยู่แถว 2 (ทางแยก) · links = [จาก, ไป, ป้าย, 'back' = ย้อนกลับ] · แก้ลำดับ/จุดต่อที่นี่แล้วรัน node figma-export/build-plugin.js maintainance-plugin · 30 ต.ค. 2569: S3 (ออกเลขงาน/จัดซื้อ ผพจ.) พักไว้ — S2 อนุมัติแล้วไป S4 รายไตรมาส · 3 พ.ย. 2569: S7 อนุมัติแผนเดินทาง · S8 แจ้งเตือน กรย./เจ้าของรถ · S9 เดิมตัดออก แทนด้วย S9 แผนเดินทางจ้างดำเนินการ (S4 ไป S6 หรือ S9 แล้วเข้า S7) · 4 พ.ย. 2569: S23 ผู้รับจ้างบันทึกงานรายคันและส่งตรวจงาน (แยกจาก S10 เลขชั่วคราว) แถว 2 ใต้ S10 · S8 ไป S10 (ดำเนินการเอง) หรือ S23 (จ้างดำเนินการ) แล้ว S23 → S11 ตรวจรับ","title":"Journey : บำรุงรักษาตามวาระ — กบค. สร้างแผนปี + จัดรถรายไตรมาส → ส่งอนุมัติ → (รายไตรมาส) ความคืบหน้าและเบิกอะไหล่ → แผนเดินทาง → อนุมัติแผนเดินทาง → แจ้งเตือน กรย./เจ้าของรถ → บำรุงรักษารายคัน → ตรวจรับ → ประวัติ/รายงาน → ต้นทุน","phases":[["เตรียมดำเนินการ (แผนปี)",[1,2,19,20]],["เบิก จัดหาอะไหล่ (รายไตรมาส)",[22,4]],["จ้างดำเนินการ",[6,9,7,8]],["ดำเนินการบำรุงรักษา",[10,23]],["ตรวจรับ",[11,12,13,14]],["จัดทำรายงานการบำรุงรักษา",[15,16,17]],["คำนวณต้นทุน",[18]]],"cols":[[1,20],[21],[2,19],[22],[4],[6,9],[7],[8],[10,23],[11],[12],[13],[14],[15],[16],[17],[18]],"row":{"9":1,"11":1,"19":1,"20":1,"23":1},"links":[[1,2,""],[1,21,"เพิ่มอะไหล่"],[21,1,"กลับฟอร์ม","back"],[2,19,"ส่งกลับแก้ไข / แก้ไขแผน"],[19,2,"ส่งอนุมัติใหม่","back"],[1,20,"ลบแผน"],[2,22,"อนุมัติ"],[22,4,"รับทราบ"],[4,6,"ดำเนินการเอง"],[4,9,"จ้างดำเนินการ"],[6,7,"ส่งอนุมัติ"],[9,7,"ส่งอนุมัติ"],[7,6,"ส่งกลับแก้ไข","back"],[7,8,"อนุมัติ"],[8,10,"ดำเนินการเอง"],[8,23,"จ้างดำเนินการ"],[23,11,"ส่งตรวจงาน"],[11,23,"ส่งกลับแก้ไข","back"],[10,12,"ตรวจเอง"],[11,12,""],[12,13,""],[13,10,"ยังไม่ครบทุกคัน","back"],[13,14,"ครบทุกคัน"],[14,15,""],[15,16,""],[16,15,"ตีกลับ","back"],[16,17,"ผ่าน"],[17,18,""]],"scenarios":{"1":{"n":1,"title":"กบค. สร้างแผนบำรุงรักษาประจำปี และจัดรถลงไตรมาส","w":5344,"h":1592,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":302,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nบำรุงรักษา\nตามวาระ","x":280,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nแผนบำรุงรักษา","x":520,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด\nสร้างแผน","x":920,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nบำรุงรักษา","x":1160,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ระบุชื่อแผน\n+ เลือก\nปีงบประมาณ","x":1560,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"เลือกภาค","x":1800,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A7","kind":"action","label":"เลือกเขต\nภายใต้ภาค","x":2040,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A8","kind":"action","label":"เลือก\nประเภทรถ","x":2280,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"เลือกแท็บ\nไตรมาส","x":2520,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบแสดงรถ\nของเขตนี้ใน\nช่องเลือกรถ","x":2760,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A5","kind":"action","label":"ค้นทะเบียน\nแล้วเลือกรถ\nลงไตรมาสนี้","x":3160,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"หัวข้ออะไหล่\nของไตรมาสนี้\nตั้งต้นว่าง","x":3400,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q3","kind":"decision","label":"เพิ่ม แก้\nหรือลบ\nอะไหล่ ?","x":3800,"y":270,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A9","kind":"action","label":"กดเพิ่มอะไหล่\nหรือแก้ไข\nไปที่ S21","x":4040,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A10","kind":"action","label":"ยืนยันเอาอะไหล่\nออกจากทุกคัน\nในไตรมาส","x":4040,"y":660,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"จัดรถครบ\nทุกไตรมาส\nที่ต้องการ ?","x":4040,"y":1050,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":4280,"y":1050,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A6","kind":"action","label":"บันทึก\n+ ส่งอนุมัติ","x":4520,"y":1050,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D5","kind":"display","label":"แผนอยู่ใน\nรายการ\nสถานะรออนุมัติ","x":4760,"y":980,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":5192,"y":1082,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,358],[280,358]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,358],[520,358]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,358],[920,358]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,358],[1160,358]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1496,358],[1560,358]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[1736,358],[1800,358]]},{"from":"A3","to":"A7","label":"","back":false,"pts":[[1976,358],[2040,358]]},{"from":"A7","to":"A8","label":"","back":false,"pts":[[2216,358],[2280,358]]},{"from":"A8","to":"A4","label":"","back":false,"pts":[[2456,358],[2520,358]]},{"from":"A4","to":"D4","label":"","back":false,"pts":[[2696,358],[2760,358]]},{"from":"D4","to":"A5","label":"","back":false,"pts":[[3096,358],[3160,358]]},{"from":"A5","to":"D3","label":"","back":false,"pts":[[3336,358],[3400,358]]},{"from":"D3","to":"Q3","label":"","back":false,"pts":[[3736,358],[3800,358]]},{"from":"Q3","to":"A9","label":"Y","back":false,"pts":[[3976,358],[4040,358]]},{"from":"A9","to":"D3","label":"","back":true,"pts":[[4128,270],[4128,176],[3568,176],[3568,200]]},{"from":"Q3","to":"A10","label":"ลบ","back":false,"pts":[[3888,446],[3888,748],[4040,748]]},{"from":"A10","to":"D3","label":"","back":true,"pts":[[4216,748],[4248,748],[4248,1320],[3568,1320],[3568,516]]},{"from":"Q3","to":"Q2","label":"N","back":false,"pts":[[3888,446],[3888,1138],[4040,1138]]},{"from":"Q2","to":"A4","label":"N","back":true,"pts":[[4128,1226],[4128,1356],[2608,1356],[2608,446]]},{"from":"Q2","to":"Q1","label":"Y","back":false,"pts":[[4216,1138],[4280,1138]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[4368,1226],[4368,1392],[1328,1392],[1328,516]]},{"from":"Q1","to":"A6","label":"Y","back":false,"pts":[[4456,1138],[4520,1138]]},{"from":"A6","to":"D5","label":"","back":false,"pts":[[4696,1138],[4760,1138]]},{"from":"D5","to":"E","label":"","back":false,"pts":[[5096,1138],[5192,1138]]}],"stickies":[{"node":"A2","text":"Q31 ❓ รายการปีงบประมาณในช่องเลือก แสดงย้อนหลังและล่วงหน้ากี่ปี (เจ้าของงาน \"ไม่จำกัดปี\")","x":1560,"y":1432,"w":320},{"node":"A8","text":"Q29 ❓ ประเภทรถอ้างรายการจากทะเบียนรถ VMS+ ชุดไหน","x":2280,"y":1432,"w":320},{"node":"D4","text":"Q30 ❓ รถสถานะรอยุบ/โอน ซ่อนตั้งแต่ตอนเลือก หรือแสดงแต่เลือกไม่ได้","x":2760,"y":1432,"w":320},{"node":"A6","text":"Q32 ❓ ส่งอนุมัติไปที่ใคร (ผู้บังคับบัญชาตามสาย หรือหัวหน้า กบค.) กบค. ต้องเลือกผู้อนุมัติเองไหม","x":4520,"y":1432,"w":320}],"gap":16,"horizontal":true},"2":{"n":2,"title":"ผู้อนุมัติ ตรวจสอบและอนุมัติแผนบำรุงรักษา","w":3264,"h":1116,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nแผนรออนุมัติ\nหรือแจ้งเตือน","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการแผน\nรออนุมัติ","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายละเอียด\nแผน + รถ\nรายไตรมาส","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบแผน\nเลือกผลการพิจารณา\nอนุมัติเป็นค่าเริ่มต้น","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ผลการ\nพิจารณา ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ระบุเหตุผล\nที่ส่งกลับ","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"กดยืนยัน\nผลการพิจารณา\n+ ยืนยันส่งกลับ","x":2360,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ กบค.\nแก้ไข","x":2680,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":3112,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A5","kind":"action","label":"กดยืนยัน\nผลการพิจารณา\n+ ยืนยันอนุมัติ","x":2040,"y":670,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบเปลี่ยน\nสถานะอนุมัติแล้ว\nส่งรายการให้คลัง S22","x":2280,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2792,"y":702,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"A3","label":"ส่งกลับแก้ไข","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A3","to":"A4","label":"","back":false,"pts":[[2216,298],[2360,298]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[2536,298],[2680,298]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[3016,298],[3112,298]]},{"from":"Q1","to":"A5","label":"อนุมัติ","back":false,"pts":[[1888,386],[1888,758],[2040,758]]},{"from":"A5","to":"D4","label":"","back":false,"pts":[[2216,758],[2280,758]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[2616,758],[2792,758]]}],"stickies":[{"node":"A0","text":"Q32 ❓ ผู้อนุมัติคือใคร (ผู้บังคับบัญชาตามสาย หรือหัวหน้า กบค.) · อนุมัติชั้นเดียวหรือหลายชั้น","x":280,"y":956,"w":320}],"gap":16,"horizontal":true},"4":{"n":4,"title":"กบค. ติดตามความคืบหน้าและเบิกอะไหล่ของไตรมาส","w":2624,"h":1140,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"เปิดแผน\nไตรมาสที่\nกำลังทำ","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า ความคืบหน้า\nอะไหล่ ต้องเบิก\nเทียบ Smart Inventory","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"กด\nเบิก/จองอะไหล่","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"สรุปรายการ\nเบิก/จอง","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"คงเหลือ\nพอ ?","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D3","kind":"display","label":"รายการที่ไม่พอ\nสถานะรอจัดซื้อ","x":1800,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D4","kind":"display","label":"สถานะ\nเบิกแล้ว\nครบ","x":1800,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"กด ไปทำ\nแผนเดินทาง","x":2200,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E1","kind":"end","label":"ไป S6\nหน้าแผนเดินทาง\nของไตรมาส","x":2472,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A2","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"Q1","to":"D3","label":"N","back":false,"pts":[[1648,386],[1648,758],[1800,758]]},{"from":"D3","to":"D1","label":"","back":true,"pts":[[1968,916],[1968,940],[688,940],[688,456]]},{"from":"Q1","to":"D4","label":"Y","back":false,"pts":[[1736,298],[1800,298]]},{"from":"D4","to":"A3","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"A3","to":"E1","label":"","back":false,"pts":[[2376,298],[2472,298]]}],"stickies":[{"node":"D1","text":"Q9 ❓ เชื่อม Smart Inventory กับ VMS+ ยังไง (ดึงคงเหลือ · ส่งเบิก/จอง)","x":520,"y":980,"w":320},{"node":"D3","text":"Q6 ❓ อะไหล่ไม่พอ จัดซื้อนอกระบบ หรือต้องบันทึกในระบบ · สถานะรอจัดซื้อเปลี่ยนเป็นเบิกแล้วเมื่อไหร่","x":1800,"y":980,"w":320}],"gap":16,"horizontal":true},"6":{"n":6,"title":"กบค. ทำแผนเดินทาง (ตรวจเอง)","w":4544,"h":1176,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผนเดินทาง\nรถในไตรมาส\n+ แผนเดินทาง","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด สร้างแผน\nเดินทาง","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nเดินทาง\nไตรมาส n","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"กด เพิ่มรถ","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D5","kind":"display","label":"popup เพิ่มรถ\nรถของไตรมาส\nที่ยังไม่มีแผนเดินทาง","x":1560,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q2","kind":"decision","label":"มีรถ\nให้เลือก ?","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D6","kind":"display","label":"แจ้ง รถทุกคัน\nอยู่ในแผน\nเดินทางแล้ว","x":2200,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A6","kind":"action","label":"ติ๊กรถ\nกด เพิ่มเข้า\nแผนเดินทาง","x":2280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ตารางรถ\nสถานที่ตั้งต้น\nสำนักงานที่รถอยู่","x":2600,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A5","kind":"action","label":"แก้เบอร์ติดต่อ\nและสถานที่\nรายคัน ถ้าต้องการ","x":3000,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"ตั้งชื่อแผนเดินทาง\nเลือกช่วงวัน\n+ พนักงาน","x":3240,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":3480,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A4","kind":"action","label":"ยืนยันการ\nสร้างแผน\nเดินทาง","x":3720,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งแผนเดินทาง\nให้ผู้อนุมัติ S7\nสถานะรออนุมัติ","x":3960,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":4392,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A2","to":"D5","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"D5","to":"Q2","label":"","back":false,"pts":[[1896,298],[1960,298]]},{"from":"Q2","to":"D6","label":"N","back":false,"pts":[[2048,386],[2048,758],[2200,758]]},{"from":"D6","to":"D2","label":"","back":true,"pts":[[2368,916],[2368,940],[1088,940],[1088,456]]},{"from":"Q2","to":"A6","label":"Y","back":false,"pts":[[2136,298],[2280,298]]},{"from":"A6","to":"D4","label":"","back":false,"pts":[[2456,298],[2600,298]]},{"from":"D4","to":"A5","label":"","back":false,"pts":[[2936,298],[3000,298]]},{"from":"A5","to":"A3","label":"","back":false,"pts":[[3176,298],[3240,298]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[3416,298],[3480,298]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[3568,386],[3568,976],[1088,976],[1088,456]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[3656,298],[3720,298]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[3896,298],[3960,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[4296,298],[4392,298]]}],"stickies":[{"node":"D5","text":"Q44 ❓ ฟอร์มที่ยังไม่กดยืนยัน กันรถไว้ไหม · ยกเลิกหรือแก้ไขแผนเดินทางที่ยืนยันแล้ว รถกลับมาเลือกได้ไหม","x":1560,"y":1016,"w":320},{"node":"A5","text":"Q47 ❓ เบอร์ติดต่อเจ้าของรถดึงจากข้อมูลไหน · S7 S8 ต้องแสดงเบอร์ด้วยไหม","x":3000,"y":1016,"w":320}],"gap":16,"horizontal":true},"7":{"n":7,"title":"ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง","w":3264,"h":1116,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดแจ้งเตือน\nหรือเมนูแผนเดินทาง\nรออนุมัติ","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nแผนเดินทาง\nรออนุมัติ","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน\nเดินทาง","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง\n+ รถรายคัน","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ\nเลือกผลการพิจารณา\nอนุมัติเป็นค่าเริ่มต้น","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ผลการ\nพิจารณา ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ระบุเหตุผล\nที่ส่งกลับ","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"กดยืนยัน\nผลการพิจารณา\n+ ยืนยันส่งกลับ","x":2360,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ กบค. แก้ไข\nที่ S6","x":2680,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":3112,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A5","kind":"action","label":"กดยืนยัน\nผลการพิจารณา\n+ ยืนยันอนุมัติ","x":2040,"y":670,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบเปลี่ยนสถานะ\nอนุมัติแล้ว\nแจ้งเตือน S8","x":2280,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2792,"y":702,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"A3","label":"ส่งกลับแก้ไข","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A3","to":"A4","label":"","back":false,"pts":[[2216,298],[2360,298]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[2536,298],[2680,298]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[3016,298],[3112,298]]},{"from":"Q1","to":"A5","label":"อนุมัติ","back":false,"pts":[[1888,386],[1888,758],[2040,758]]},{"from":"A5","to":"D4","label":"","back":false,"pts":[[2216,758],[2280,758]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[2616,758],[2792,758]]}],"stickies":[{"node":"A0","text":"Q45 ❓ ผู้อนุมัติแผนเดินทางมาจาก API getUpperLower ตำแหน่งไหน (หัวหน้า กบค. หรือไม่) · ชั้นเดียวหรือหลายชั้น","x":280,"y":956,"w":320}],"gap":16,"horizontal":true},"8":{"n":8,"title":"กรย. และหน่วยงานเจ้าของรถ ได้รับแจ้งเตือนแผนเดินทาง","w":1744,"h":956,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"ระบบแจ้งเตือน\nในแอป ถึง กรย.\n+ หน่วยงาน","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"ผู้รับ ?","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A1","kind":"action","label":"กดแจ้งเตือน\nฝั่ง กรย.","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า แผนเดินทาง\nดูอย่างเดียว\nรถทุกคันในใบ","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"กดแจ้งเตือน\nฝั่งหน่วยงาน","x":920,"y":670,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"หน้า แผนเดินทาง\nดูอย่างเดียว\nเฉพาะรถของหน่วยงาน","x":1160,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":1592,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"Q1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"Q1","to":"A1","label":"กรย.","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"Q1","to":"A2","label":"หน่วยงานเจ้าของรถ","back":false,"pts":[[768,386],[768,758],[920,758]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[1096,758],[1160,758]]},{"from":"D2","to":"E","label":"","back":false,"pts":[[1496,298],[1592,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[1496,758],[1528,758],[1528,298],[1592,298]]}],"stickies":[],"gap":16,"horizontal":true},"9":{"n":9,"title":"กบค. สร้างแผนเดินทางจ้างดำเนินการ (vendor)","w":3744,"h":680,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผนเดินทาง\nรถในไตรมาส\n+ แผนเดินทาง","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด สร้างแผน\nเดินทาง","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nเดินทาง เลือก\nจ้างดำเนินการ","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"เลือกผู้รับจ้าง\nจาก vendor list\n+ เลขที่สัญญา","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด เพิ่มรถ","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D5","kind":"display","label":"popup เพิ่มรถ\nรถของไตรมาส\nที่ยังไม่มีแผนเดินทาง","x":1800,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A4","kind":"action","label":"ติ๊กรถ\nกด เพิ่มเข้า\nแผนเดินทาง","x":2200,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A5","kind":"action","label":"แก้เบอร์ติดต่อ\nสถานที่รายคัน +\nเลือกช่วงวันทำงาน","x":2440,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":2680,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A6","kind":"action","label":"ยืนยันการ\nสร้างแผน\nเดินทาง","x":2920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งแผนเดินทาง\nให้ผู้อนุมัติ S7\nสถานะรออนุมัติ","x":3160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":3592,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A3","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A3","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"D5","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"D5","to":"A4","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"A4","to":"A5","label":"","back":false,"pts":[[2376,298],[2440,298]]},{"from":"A5","to":"Q1","label":"","back":false,"pts":[[2616,298],[2680,298]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[2768,386],[2768,480],[1088,480],[1088,456]]},{"from":"Q1","to":"A6","label":"Y","back":false,"pts":[[2856,298],[2920,298]]},{"from":"A6","to":"D3","label":"","back":false,"pts":[[3096,298],[3160,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[3496,298],[3592,298]]}],"stickies":[{"node":"A3","text":"Q46 ❓ vendor list มาจากไหน (ทะเบียนผู้รับจ้างของ กฟภ. หรือ กบค. เพิ่มเอง) · กรองตามประเภทรถไหม · เลขที่สัญญาบังคับไหม","x":1320,"y":520,"w":320}],"gap":16,"horizontal":true},"10":{"n":10,"title":"กบค. บันทึกงานบำรุงรักษารายคัน","w":4144,"h":1888,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"ไปจุดนัด\nรับอะไหล่\n(นอกระบบ)","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง\nสถานะงานรายคัน","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เลือกรถ\nทีละคัน","x":1000,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า งานรายคัน\nยังไม่เริ่ม","x":1320,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษา\nได้ ?","x":1720,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"กด บำรุงรักษา\nไม่ได้ ระบุสาเหตุ\n+ อะไหล่ส่งคืน","x":2600,"y":670,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด เริ่มงาน\nตรวจรายการรับรถ\n+ ลงนามรับมอบ","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"งานรายคัน\nอยู่ระหว่าง\nบำรุงรักษา","x":2200,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A4","kind":"action","label":"ตรวจ + บำรุง\n+ เก็บตัวอย่าง\nน้ำมัน (นอกระบบ)","x":2600,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A5","kind":"action","label":"กด ปิดงาน\nกรอกผลงาน ตรวจสภาพ\n+ ลงนามส่งคืน","x":2840,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"ระบุครบ ?","x":3080,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"ระบบบันทึกผล\nเสร็จสิ้น หรือ\nบำรุงรักษาไม่ได้","x":3320,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q3","kind":"decision","label":"มีคันอื่น\nในแผน ?","x":3720,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E","kind":"end","label":"End","x":3992,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D5","kind":"display","label":"หน้า งานรายคัน\nเสร็จสิ้น\nดูอย่างเดียว","x":920,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A6","kind":"action","label":"แก้เบอร์ติดต่อ\nและสถานที่\nของรถ","x":1000,"y":1060,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A7","kind":"action","label":"ยืนยันเอารถ\nออกจาก\nแผนเดินทาง","x":1000,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[1000,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1176,298],[1320,298]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[1656,298],[1720,298]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[1808,386],[1808,758],[2600,758]]},{"from":"Q1","to":"A2","label":"Y","back":false,"pts":[[1896,298],[1960,298]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"D3","to":"A4","label":"","back":false,"pts":[[2536,298],[2600,298]]},{"from":"D3","to":"A3","label":"ทำต่อไม่ได้","back":false,"pts":[[2368,456],[2368,758],[2600,758]]},{"from":"A4","to":"A5","label":"","back":false,"pts":[[2776,298],[2840,298]]},{"from":"A5","to":"Q2","label":"","back":false,"pts":[[3016,298],[3080,298]]},{"from":"Q2","to":"A5","label":"N","back":true,"pts":[[3168,386],[3168,1580],[2928,1580],[2928,386]]},{"from":"Q2","to":"D4","label":"Y","back":false,"pts":[[3256,298],[3320,298]]},{"from":"A3","to":"D4","label":"","back":false,"pts":[[2776,758],[3288,758],[3288,298],[3320,298]]},{"from":"D4","to":"Q3","label":"","back":false,"pts":[[3656,298],[3720,298]]},{"from":"Q3","to":"D1","label":"Y","back":true,"pts":[[3808,386],[3808,1616],[688,1616],[688,456]]},{"from":"Q3","to":"E","label":"N","back":false,"pts":[[3896,298],[3992,298]]},{"from":"D1","to":"D5","label":"คันที่ปิดงานแล้ว","back":false,"pts":[[688,456],[688,758],[920,758]]},{"from":"D1","to":"A6","label":"เมนู แก้ไข","back":false,"pts":[[688,456],[688,1148],[1000,1148]]},{"from":"A6","to":"D1","label":"","back":true,"pts":[[1176,1148],[1208,1148],[1208,1652],[688,1652],[688,456]]},{"from":"D1","to":"A7","label":"เมนู ลบ","back":false,"pts":[[688,456],[688,1468],[1000,1468]]},{"from":"A7","to":"D1","label":"","back":true,"pts":[[1088,1556],[1088,1688],[688,1688],[688,456]]}],"stickies":[{"node":"A4","text":"Q18 ❓ (บอร์ด) ชั่วโมงเครื่องจักร — ภาพถ่ายหรือกรอกข้อมูล? · อะไหล่เก่า? · อะไหล่ใหม่ (ถ้าเหลือ?)","x":2600,"y":1728,"w":320}],"gap":16,"horizontal":true},"11":{"n":11,"title":"กบค. ตรวจรับงานรายคันของผู้รับจ้างและรับคืนอะไหล่","w":3504,"h":1116,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดแจ้งเตือน\nส่งตรวจงาน\nหรือเปิดแผนเดินทาง","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง\nคันที่รอตรวจรับ","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เลือกรถ\nที่รอตรวจรับ","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า งานรายคัน\nรอตรวจรับ\nผลงาน + อะไหล่ส่งคืน","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ\nข้อมูลจาก\nผู้รับจ้าง","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ตรวจสอบ\nผ่าน ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A4","kind":"action","label":"เลือก อนุมัติ\nกดยืนยัน\nผลการพิจารณา","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"เลือก ส่งกลับแก้ไข\nระบุเหตุผล\nกดยืนยัน","x":2040,"y":670,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ผู้รับจ้าง\nแก้ไขที่ S23","x":2280,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":2712,"y":702,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A6","kind":"action","label":"ระบบรับคืนอะไหล่\nตามจำนวนที่คืน\n+ บันทึกผล","x":2360,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"ผู้รับจ้าง\nปิดงาน ?","x":2680,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"งานรายคัน\nเสร็จสิ้น","x":2920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D5","kind":"display","label":"งานรายคัน\nบำรุงรักษาไม่ได้","x":2920,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":3352,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[1888,386],[1888,758],[2040,758]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[2216,758],[2280,758]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[2616,758],[2712,758]]},{"from":"A4","to":"A6","label":"","back":false,"pts":[[2216,298],[2360,298]]},{"from":"A6","to":"Q2","label":"","back":false,"pts":[[2536,298],[2680,298]]},{"from":"Q2","to":"D4","label":"Y","back":false,"pts":[[2856,298],[2920,298]]},{"from":"Q2","to":"D5","label":"N","back":false,"pts":[[2856,298],[2888,298],[2888,758],[2920,758]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[3256,298],[3352,298]]},{"from":"D5","to":"E","label":"","back":false,"pts":[[3256,758],[3288,758],[3288,298],[3352,298]]}],"stickies":[{"node":"A6","text":"Q41 ❓ อะไหล่ที่รับคืนกลับเข้าคลังทางไหน (ระบบจองอะไหล่ Q9) หรือยกไปใช้ไตรมาสถัดไป","x":2360,"y":956,"w":320},{"node":"D1","text":"Q50 ❓ จนท. กบค. ที่ตรวจรับคือใคร ผู้สร้างแผนเดินทาง หรือ กบค. คนใดก็ได้ในหน่วย","x":520,"y":956,"w":320}],"gap":16,"horizontal":true},"12":{"n":12,"title":"กบค. บันทึกผลตรวจน้ำมันไฮโดรลิก","w":2816,"h":1200,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":302,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"หน้าปิดงาน\nเลือกน้ำมันแบบ\nเก็บตัวอย่าง","x":280,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"มีผลตอน\nปิดงาน ?","x":520,"y":270,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A1","kind":"action","label":"ใส่ผลการทดสอบ\n(ถ้ามี) + แนบไฟล์\nในหน้าปิดงาน","x":840,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบเก็บผล\nไว้ในข้อมูล\nรถคันนั้น","x":1160,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D1","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง ป้าย\nรอผลตรวจน้ำมัน","x":760,"y":660,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจน้ำมัน\nที่ห้องทดสอบ\n(นอกระบบ)","x":1240,"y":730,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กดปุ่ม … ของรถ\nดูรายละเอียด","x":1640,"y":730,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า งานรายคัน\nsection ผลการทดสอบ\nน้ำมันไฮโดรลิก","x":1960,"y":660,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A4","kind":"action","label":"เลือก ผ่าน หรือ\nไม่ผ่าน + แนบไฟล์\nกด บันทึกผลการทดสอบ","x":2360,"y":730,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"เลือกผล\nแล้ว ?","x":2600,"y":730,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"ป้ายที่สถานะงาน\nผ่าน ป้ายหาย\nไม่ผ่าน น้ำมันไม่ผ่าน","x":1560,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2072,"y":302,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,358],[280,358]]},{"from":"A0","to":"Q1","label":"","back":false,"pts":[[456,358],[520,358]]},{"from":"Q1","to":"A1","label":"Y","back":false,"pts":[[696,358],[840,358]]},{"from":"A1","to":"D3","label":"","back":false,"pts":[[1016,358],[1160,358]]},{"from":"Q1","to":"D1","label":"N","back":false,"pts":[[608,446],[608,818],[760,818]]},{"from":"D1","to":"A2","label":"","back":false,"pts":[[1096,818],[1240,818]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[1416,818],[1640,818]]},{"from":"A3","to":"D2","label":"","back":false,"pts":[[1816,818],[1960,818]]},{"from":"D2","to":"A4","label":"","back":false,"pts":[[2296,818],[2360,818]]},{"from":"A4","to":"Q2","label":"","back":false,"pts":[[2536,818],[2600,818]]},{"from":"Q2","to":"D2","label":"N","back":true,"pts":[[2688,906],[2688,1000],[2128,1000],[2128,976]]},{"from":"Q2","to":"D3","label":"Y","back":true,"pts":[[2688,730],[2688,176],[1328,176],[1328,200]]},{"from":"D3","to":"D4","label":"","back":false,"pts":[[1496,358],[1560,358]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[1896,358],[2072,358]]},{"from":"D4","to":"D2","label":"แก้ผลภายหลัง","back":false,"pts":[[1896,358],[1928,358],[1928,818],[1960,818]]}],"stickies":[{"node":"D3","text":"Q21 ❓ ผลไม่ผ่านมีผลต่อแผนรอบถัดไปไหม (เช่น ให้เปลี่ยนน้ำมันรอบหน้า) · จะเริ่มแจ้งเจ้าของรถเมื่อไหร่","x":1160,"y":1040,"w":320},{"node":"D1","text":"Q51 ❓ ป้ายรอผลที่ข้อมูลรถรายคัน (Vehicle Management ระบบเดิม) ทำเมื่อไหร่ ใครดูแลหน้านั้น","x":760,"y":1040,"w":320}],"gap":16,"horizontal":true},"13":{"n":13,"title":"หน่วยงาน/เจ้าของรถ ยอมรับผลการตรวจบำรุงรถรายคัน","w":3264,"h":944,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ได้รับแจ้งเตือน\ne-mail + VMS+\n(รายคัน)","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A0","kind":"action","label":"กดลิงก์/เมนู\nจากแจ้งเตือน","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nการตรวจบำรุงรถ\nที่รอตรวจสอบ","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดรายการ\nของคันนั้น","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายการ\nตรวจบำรุงรถ\nใบตรวจ 2 ใบ","x":1560,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ดูใบตรวจ\n+ ภาพก่อน/หลัง","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กดยอมรับ\nผลการตรวจ\nบำรุงรถ","x":2200,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบบันทึก\nการยอมรับ\nรายคัน","x":2440,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษาครบ\nทุกคันตามแผน ?","x":2840,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E1","kind":"end","label":"รอแจ้งเตือน\nคันถัดไป","x":3112,"y":632,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"E2","kind":"end","label":"ไป S14\nตรวจหลักฐาน\nทั้งแผน","x":3112,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D0","to":"A0","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1896,298],[1960,298]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[2376,298],[2440,298]]},{"from":"D3","to":"Q1","label":"","back":false,"pts":[[2776,298],[2840,298]]},{"from":"Q1","to":"E1","label":"N","back":false,"pts":[[2928,386],[2928,688],[3112,688]]},{"from":"Q1","to":"E2","label":"Y","back":false,"pts":[[3016,298],[3112,298]]}],"stickies":[{"node":"D2","text":"Q19 ❓ (บอร์ด) กรณีที่ไม่สามารถบำรุงรักษาได้ จำเป็นต้องใช้ form รูปแบบเดียวกันไหม? หากแยกกันจะต้องมี field อะไรบ้าง?","x":1560,"y":784,"w":320},{"node":"A3","text":"Q23 ❓ ถ้าไม่ยอมรับผล ทำยังไง (บอร์ดมีแค่ปุ่มยอมรับ) · \"หน่วยงาน\" กับ \"เจ้าของรถ\" เป็นคนเดียวกันไหม","x":2200,"y":784,"w":320}],"gap":16,"horizontal":true},"14":{"n":14,"title":"หน่วยงาน/เจ้าของรถ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)","w":3264,"h":656,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ได้รับแจ้งเตือน\ne-mail + VMS+\n(ครบทุกคัน)","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A0","kind":"action","label":"กดลิงก์/เมนู\nจากแจ้งเตือน","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nการตรวจบำรุงรถ\nที่รอตรวจสอบ","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดรายการ\nของแผน","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า เอกสาร\nหลักฐานการตรวจ\nบำรุงรถทั้งแผน","x":1560,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ\nเอกสาร\nหลักฐาน","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"ประเมิน\nความพึงพอใจ","x":2200,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"กดยอมรับ\nผลการตรวจ\nบำรุงรถ","x":2440,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบบันทึก\nการยอมรับ\n+ แจ้ง กบค.","x":2680,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":3112,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D0","to":"A0","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1896,298],[1960,298]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"A3","to":"A4","label":"","back":false,"pts":[[2376,298],[2440,298]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[2616,298],[2680,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[3016,298],[3112,298]]}],"stickies":[{"node":"A3","text":"Q22 ❓ (บอร์ด) ประเมินความพึงพอใจ (ต้องทำทุกครั้ง?) · แบบประเมินมีข้อ/สเกลอะไร","x":2200,"y":496,"w":320},{"node":"A4","text":"Q28 ❓ การยอมรับ 2 รอบ (รายคัน S13 + ทั้งแผน S14) จำเป็นทั้งคู่ไหม หรือรอบเดียวพอ","x":2440,"y":496,"w":320}],"gap":16,"horizontal":true},"15":{"n":15,"title":"กบค. บันทึกและส่งประวัติงานบำรุงรักษา","w":2384,"h":944,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\nความคืบหน้ารายคัน","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษาเสร็จ\nทั้งหมด ?","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E1","kind":"end","label":"กลับ S10\nทำคันที่เหลือ","x":1032,"y":632,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D2","kind":"display","label":"หน้า ประวัติงาน\nบำรุงรักษา\nทั้งหมด","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"ตรวจทาน\nประวัติ","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด ส่งประวัติ\nให้หัวหน้า\nตรวจสอบ","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบเปลี่ยน\nสถานะ\nรอหัวหน้าตรวจ","x":1800,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2232,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"Q1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"Q1","to":"E1","label":"N","back":false,"pts":[[768,386],[768,688],[1032,688]]},{"from":"Q1","to":"D2","label":"Y","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A1","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[2136,298],[2232,298]]}],"stickies":[{"node":"Q1","text":"Q24 ❓ คันที่ \"บำรุงรักษาไม่ได้\" (S10) นับว่าเสร็จไหม — ส่งประวัติได้ทั้งที่มีคันทำไม่ได้หรือเปล่า","x":680,"y":784,"w":320}],"gap":16,"horizontal":true},"16":{"n":16,"title":"หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา","w":2864,"h":956,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nประวัติรอ\nตรวจสอบ","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nประวัติรอ\nตรวจสอบ","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า ประวัติงาน\nบำรุงรักษา\nของแผน","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ผ่าน ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ตีกลับ\n+ ระบุเหตุผล","x":2040,"y":670,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ กบค.\nแก้ไข","x":2280,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":2712,"y":702,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"กดอนุมัติ","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบบันทึก\nประวัติ\nเป็นทางการ","x":2280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2712,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[1888,386],[1888,758],[2040,758]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[2216,758],[2280,758]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[2616,758],[2712,758]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A4","to":"D4","label":"","back":false,"pts":[[2216,298],[2280,298]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[2616,298],[2712,298]]}],"stickies":[],"gap":16,"horizontal":true},"17":{"n":17,"title":"กบค. ออกรายงานผลและปิดงาน","w":2624,"h":680,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\n(ประวัติผ่านแล้ว)","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด รายงานผล\nการบำรุงรักษา","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายงานผล\nการบำรุงรักษา","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ดาวน์โหลด\nรายงาน","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กด ปิดงาน","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ยืนยัน\nปิดงาน ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D3","kind":"display","label":"ระบบเปลี่ยน\nสถานะแผน\nปิดงานแล้ว","x":2040,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2472,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[1888,386],[1888,480],[1088,480],[1088,456]]},{"from":"Q1","to":"D3","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[2376,298],[2472,298]]}],"stickies":[{"node":"D2","text":"Q25 ❓ รายงานผลมีหัวข้ออะไรบ้าง รูปแบบไฟล์ (PDF/Excel) — บอร์ดบอกแค่ \"Download ได้\"","x":920,"y":520,"w":320}],"gap":16,"horizontal":true},"18":{"n":18,"title":"กบค. คำนวณต้นทุนการบำรุงรักษา","w":2384,"h":656,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\n(ปิดงานแล้ว)","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด คำนวณ\nต้นทุน","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า ต้นทุน\nค่าแรง ที่พัก\nเดินทาง","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจทาน\nค่าใช้จ่าย","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบแสดง\nSummary\nต้นทุน","x":1560,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"ดาวน์โหลด\nExcel","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":2232,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"D3","to":"A3","label":"","back":false,"pts":[[1896,298],[1960,298]]},{"from":"A3","to":"E","label":"","back":false,"pts":[[2136,298],[2232,298]]}],"stickies":[{"node":"D2","text":"Q26 ❓ \"ค่าแรง\" ในต้นทุน กับ \"ค่าเบี้ยเลี้ยง\" ที่กรอกรายคันตอนปิดงาน (S10 · ย้ายจาก S6 3 พ.ย. 2569) เป็นรายการเดียวกันไหม · ต้นทุนรวมค่าอะไหล่/ค่าจ้างผู้รับจ้างไหม","x":920,"y":496,"w":320}],"gap":16,"horizontal":true},"19":{"n":19,"title":"กบค. แก้ไขแผนบำรุงรักษา แล้วส่งอนุมัติใหม่","w":4064,"h":1696,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":338,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า รายการ\nแผนบำรุงรักษา","x":280,"y":236,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กดเมนู …\nหรือเปิดหน้า\nรายละเอียดแผน","x":680,"y":306,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"สถานะแผน\nแก้ไขได้ ?","x":920,"y":306,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D2","kind":"display","label":"ดูรายละเอียด\nได้อย่างเดียว","x":1160,"y":696,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":1672,"y":798,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A2","kind":"action","label":"กด แก้ไข","x":1240,"y":306,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"หน้า แก้ไขแผน\nค่าเดิมกรอกไว้","x":1560,"y":236,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"แก้ชื่อแผน ภาค\nประเภทรถ\nหรือรถรายไตรมาส","x":1960,"y":306,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"เอาภาค เขต\nหรือประเภทรถ\nออก ?","x":2200,"y":306,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"ยืนยันเอารถ\nที่ตรงค่านั้นออก","x":2440,"y":236,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q3","kind":"decision","label":"บันทึก\nหรือออก ?","x":2520,"y":766,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D5","kind":"display","label":"ยืนยันการออก\nเมื่อมีการแก้ไข","x":2840,"y":1156,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D6","kind":"display","label":"ยืนยันการแก้ไข\nส่งอนุมัติใหม่","x":2840,"y":696,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q4","kind":"decision","label":"บันทึก\nสำเร็จ ?","x":3240,"y":766,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D7","kind":"display","label":"แจ้งบันทึก\nไม่สำเร็จ","x":3480,"y":1156,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D8","kind":"display","label":"แผนสถานะ\nรออนุมัติ","x":3480,"y":696,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E2","kind":"end","label":"กลับ S2\nผู้อนุมัติ\nตรวจสอบ","x":3912,"y":798,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,394],[280,394]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,394],[680,394]]},{"from":"A1","to":"Q1","label":"","back":false,"pts":[[856,394],[920,394]]},{"from":"Q1","to":"D2","label":"N","back":false,"pts":[[1008,482],[1008,854],[1160,854]]},{"from":"D2","to":"E1","label":"","back":false,"pts":[[1496,854],[1672,854]]},{"from":"Q1","to":"A2","label":"Y","back":false,"pts":[[1096,394],[1240,394]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[1416,394],[1560,394]]},{"from":"D3","to":"A3","label":"","back":false,"pts":[[1896,394],[1960,394]]},{"from":"A3","to":"Q2","label":"","back":false,"pts":[[2136,394],[2200,394]]},{"from":"Q2","to":"D4","label":"Y","back":false,"pts":[[2376,394],[2440,394]]},{"from":"D4","to":"D3","label":"","back":true,"pts":[[2608,236],[2608,212],[1728,212],[1728,236]]},{"from":"Q2","to":"Q3","label":"N","back":false,"pts":[[2288,482],[2288,854],[2520,854]]},{"from":"Q3","to":"D5","label":"N","back":false,"pts":[[2608,942],[2608,1314],[2840,1314]]},{"from":"D5","to":"D1","label":"","back":true,"pts":[[3008,1472],[3008,1496],[448,1496],[448,552]]},{"from":"Q3","to":"D6","label":"Y","back":false,"pts":[[2696,854],[2840,854]]},{"from":"D6","to":"Q4","label":"","back":false,"pts":[[3176,854],[3240,854]]},{"from":"Q4","to":"D7","label":"N","back":false,"pts":[[3328,942],[3328,1314],[3480,1314]]},{"from":"D7","to":"D3","label":"","back":true,"pts":[[3816,1314],[3848,1314],[3848,176],[1728,176],[1728,236]]},{"from":"Q4","to":"D8","label":"Y","back":false,"pts":[[3416,854],[3480,854]]},{"from":"D8","to":"E2","label":"","back":false,"pts":[[3816,854],[3912,854]]}],"stickies":[{"node":"Q1","text":"Q34 ❓ แผนที่อนุมัติแล้ว แก้เรื่องเล็กน้อย เช่น ชื่อแผน ต้องส่งอนุมัติใหม่ทุกครั้งหรือไม่ (ตอนนี้ใส่ไว้ก่อนว่าต้องส่งทุกครั้ง)","x":920,"y":1536,"w":320}],"gap":16,"horizontal":true},"20":{"n":20,"title":"กบค. ลบแผนบำรุงรักษาที่ยังไม่อนุมัติ","w":2384,"h":1176,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":302,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า รายการ\nแผนบำรุงรักษา","x":280,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กดเมนู …\nเลือกลบ","x":680,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"เปิดหน้า\nรายละเอียดแผน\nกดลบแผน","x":680,"y":730,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"แผนยัง\nไม่อนุมัติ ?","x":920,"y":270,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D2","kind":"display","label":"ไม่มีปุ่มลบ\nแก้ไขได้ตาม S19","x":1160,"y":660,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":1592,"y":762,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D3","kind":"display","label":"ยืนยันการ\nลบแผน","x":1160,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q2","kind":"decision","label":"ยืนยัน ?","x":1560,"y":270,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"ลบแผนออกจาก\nรายการ\nแจ้งลบสำเร็จ","x":1800,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2232,"y":302,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,358],[280,358]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,358],[680,358]]},{"from":"D1","to":"A2","label":"","back":false,"pts":[[448,516],[448,818],[680,818]]},{"from":"A1","to":"Q1","label":"","back":false,"pts":[[856,358],[920,358]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[856,818],[888,818],[888,358],[920,358]]},{"from":"Q1","to":"D2","label":"N","back":false,"pts":[[1008,446],[1008,818],[1160,818]]},{"from":"D2","to":"E1","label":"","back":false,"pts":[[1496,818],[1592,818]]},{"from":"Q1","to":"D3","label":"Y","back":false,"pts":[[1096,358],[1160,358]]},{"from":"D3","to":"Q2","label":"","back":false,"pts":[[1496,358],[1560,358]]},{"from":"Q2","to":"D1","label":"N","back":true,"pts":[[1648,270],[1648,176],[448,176],[448,200]]},{"from":"Q2","to":"D4","label":"Y","back":false,"pts":[[1736,358],[1800,358]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[2136,358],[2232,358]]}],"stickies":[{"node":"Q1","text":"Q35 ❓ แผนที่อนุมัติแล้วแต่ยังไม่เริ่มงานจะเอาออกอย่างไร (ไม่มียกเลิกแผนแล้ว · ตอนนี้ลบไม่ได้)","x":920,"y":1016,"w":320}],"gap":16,"horizontal":true},"21":{"n":21,"title":"กบค. กำหนดอะไหล่ของรถแต่ละคันในแผน","w":4224,"h":680,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"อะไหล่ในไตรมาส\nบนฟอร์มแผน","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กดเพิ่มอะไหล่\nหรือไอคอนแก้ไข\nที่แถวรถ","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า อะไหล่\nของรถ","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"เลือกรถ\nในแผน","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบแสดง\nอะไหล่ที่เลือกไว้\nของคันนี้ ตั้งต้นว่าง","x":1560,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A6","kind":"action","label":"เลือกเก็บตัวอย่าง\nหรือเปลี่ยน\nน้ำมันไฮดรอลิก","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"ค้นคลังอะไหล่\nแล้วกดเลือก","x":2200,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A7","kind":"action","label":"กดระบุอะไหล่\nเพิ่มเติม ถ้าไม่มี\nในคลัง","x":2440,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A8","kind":"action","label":"กรอกชื่อ รหัส\nราคา จำนวน","x":2680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"แก้จำนวน\nหรือเอาออก","x":2920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ครบ ?","x":3160,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A5","kind":"action","label":"กดบันทึก\nอะไหล่ของรถ","x":3400,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"กลับฟอร์มแผน\nอะไหล่ในไตรมาส\nเปลี่ยนตาม","x":3640,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":4072,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"D3","to":"A6","label":"","back":false,"pts":[[1896,298],[1960,298]]},{"from":"A6","to":"A3","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"A3","to":"A7","label":"","back":false,"pts":[[2376,298],[2440,298]]},{"from":"A7","to":"A8","label":"","back":false,"pts":[[2616,298],[2680,298]]},{"from":"A8","to":"A4","label":"","back":false,"pts":[[2856,298],[2920,298]]},{"from":"A4","to":"Q1","label":"","back":false,"pts":[[3096,298],[3160,298]]},{"from":"Q1","to":"A3","label":"N","back":true,"pts":[[3248,386],[3248,480],[2288,480],[2288,386]]},{"from":"Q1","to":"A5","label":"Y","back":false,"pts":[[3336,298],[3400,298]]},{"from":"A5","to":"D4","label":"","back":false,"pts":[[3576,298],[3640,298]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[3976,298],[4072,298]]}],"stickies":[{"node":"A6","text":"Q39 ❓ เงื่อนไขอายุการใช้งานของน้ำมันคืออะไร นอกจากอายุ 3 ปี · คันที่เลือกเปลี่ยนน้ำมัน ยังต้องเก็บตัวอย่างและบันทึกผลตรวจ (S10 S12) ไหม","x":1960,"y":520,"w":320},{"node":"D4","text":"Q38 ❓ เปลี่ยนรถออกจากแผนแล้ว อะไหล่ที่เพิ่มเองของคันนั้นหายไปด้วยใช่ไหม","x":3640,"y":520,"w":320}],"gap":16,"horizontal":true},"22":{"n":22,"title":"กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส","w":3824,"h":1140,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ระบบส่งรายการ\nอะไหล่ทั้งปี\nแยกไตรมาส","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A0","kind":"action","label":"กบค. คลัง\nได้แจ้งเตือน\nหรือเปิดเมนู","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการแผน\nที่ต้องเตรียม\nอะไหล่","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า อะไหล่\nที่ต้องเบิก\nแยกแท็บไตรมาส","x":1560,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ดูทีละไตรมาส\nเทียบคงเหลือ\nในคลัง","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กดรับทราบ\nไตรมาสนั้น\n+ ยืนยัน","x":2200,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ไตรมาสนั้น\nรับทราบแล้ว","x":2440,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D5","kind":"display","label":"หน้ารายการและ\nรายละเอียดแผน\nของ กบค. เห็น\nสถานะรายไตรมาส","x":2840,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"รับทราบครบ\nทุกไตรมาส\nที่มีรถ ?","x":2920,"y":670,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D4","kind":"display","label":"สถานะฝั่งคลัง\nรับทราบครบแล้ว","x":3240,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":3672,"y":702,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D0","to":"A0","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1896,298],[1960,298]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[2376,298],[2440,298]]},{"from":"D3","to":"D5","label":"","back":false,"pts":[[2776,298],[2840,298]]},{"from":"D3","to":"Q1","label":"","back":false,"pts":[[2608,456],[2608,758],[2920,758]]},{"from":"Q1","to":"A2","label":"N","back":true,"pts":[[3008,846],[3008,940],[2048,940],[2048,386]]},{"from":"Q1","to":"D4","label":"Y","back":false,"pts":[[3096,758],[3240,758]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[3576,758],[3672,758]]}],"stickies":[{"node":"A0","text":"Q42 ❓ กบค. คลัง คือบทบาทแยกในระบบ หรือ กบค. ที่ได้สิทธิ์คลัง · ได้แจ้งเตือนทางไหน","x":680,"y":980,"w":320},{"node":"D2","text":"Q43 ❓ แก้แผนหลังอนุมัติ (S19 ส่งอนุมัติใหม่) ต้องส่งรายการให้คลังรับทราบใหม่ไหม · อะไหล่ไม่พอ คลังต้องแจ้งกลับ กบค. ไหม","x":1560,"y":980,"w":320}],"gap":16,"horizontal":true},"23":{"n":23,"title":"ผู้รับจ้าง บันทึกงานรายคันและส่งตรวจงาน","w":4736,"h":1732,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":302,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง\nมุมผู้รับจ้าง","x":280,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เลือกรถ\nทีละคัน","x":680,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า งานรายคัน\nยังไม่เริ่ม\nดูอย่างเดียว","x":920,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษา\nได้ ?","x":1320,"y":270,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"กด บำรุงรักษา\nไม่ได้ ระบุสาเหตุ\n+ อะไหล่ส่งคืน","x":2200,"y":730,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด เริ่มงาน\nรับรถ + ลงนาม\n(หน้าเดียวกับ S10)","x":1560,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"งานรายคัน\nอยู่ระหว่าง\nบำรุงรักษา","x":1800,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A5","kind":"action","label":"กด ปิดงาน\nกรอกผลงาน\n(หน้าเดียวกับ S10)","x":2200,"y":1190,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"งานรายคัน\nดำเนินการ\nบำรุงรักษาแล้ว","x":4360,"y":1120,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D5","kind":"display","label":"งานรายคัน\nแจ้งบำรุงรักษา\nไม่ได้","x":2440,"y":660,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A6","kind":"action","label":"popup แก้ไขอะไหล่\nหรือ ยืนยัน\nเอาออก","x":4120,"y":1190,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A8","kind":"action","label":"กด ส่งตรวจงาน\n+ ยืนยัน","x":2840,"y":730,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D6","kind":"display","label":"งานรายคัน\nรอตรวจรับ\n(ต่อ S11)","x":3080,"y":660,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q2","kind":"decision","label":"กบค. ตรวจรับ\nผ่าน ?","x":3480,"y":730,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D7","kind":"display","label":"เสร็จสิ้น หรือ\nบำรุงรักษาไม่ได้","x":3720,"y":660,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D8","kind":"display","label":"หน้า งานรายคัน\nส่งกลับแก้ไข\n+ เหตุผลจาก กบค.","x":3720,"y":1120,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q3","kind":"decision","label":"มีคันอื่น\nในใบ ?","x":4120,"y":730,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E","kind":"end","label":"End","x":4472,"y":762,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,358],[280,358]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,358],[680,358]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,358],[920,358]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[1256,358],[1320,358]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[1408,446],[1408,818],[2200,818]]},{"from":"Q1","to":"A2","label":"Y","back":false,"pts":[[1496,358],[1560,358]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[1736,358],[1800,358]]},{"from":"D3","to":"A3","label":"ทำต่อไม่ได้","back":false,"pts":[[1968,516],[1968,818],[2200,818]]},{"from":"D3","to":"A5","label":"","back":false,"pts":[[1968,516],[1968,1278],[2200,1278]]},{"from":"A5","to":"D4","label":"","back":false,"pts":[[2288,1190],[2288,1048],[4528,1048],[4528,1120]]},{"from":"A3","to":"D5","label":"","back":false,"pts":[[2376,818],[2440,818]]},{"from":"D4","to":"A6","label":"แก้ไข ลบ<br/>อะไหล่ ภาพ","back":true,"pts":[[4528,1436],[4528,1460],[4208,1460],[4208,1366]]},{"from":"A6","to":"D4","label":"","back":false,"pts":[[4296,1278],[4360,1278]]},{"from":"D4","to":"A8","label":"","back":true,"pts":[[4528,1436],[4528,1496],[2928,1496],[2928,906]]},{"from":"D5","to":"A8","label":"","back":false,"pts":[[2776,818],[2840,818]]},{"from":"A8","to":"D6","label":"","back":false,"pts":[[3016,818],[3080,818]]},{"from":"D6","to":"Q2","label":"","back":false,"pts":[[3416,818],[3480,818]]},{"from":"Q2","to":"D7","label":"Y","back":false,"pts":[[3656,818],[3720,818]]},{"from":"Q2","to":"D8","label":"N","back":false,"pts":[[3568,906],[3568,1278],[3720,1278]]},{"from":"D8","to":"A6","label":"ปิดงานไว้","back":false,"pts":[[4056,1278],[4120,1278]]},{"from":"D8","to":"Q1","label":"แจ้งไม่ได้ไว้","back":true,"pts":[[3888,1436],[3888,1532],[1408,1532],[1408,446]]},{"from":"D7","to":"Q3","label":"","back":false,"pts":[[4056,818],[4120,818]]},{"from":"Q3","to":"D1","label":"Y","back":true,"pts":[[4208,730],[4208,176],[448,176],[448,200]]},{"from":"Q3","to":"E","label":"N","back":false,"pts":[[4296,818],[4472,818]]}],"stickies":[{"node":"A8","text":"Q49 ❓ ส่งตรวจงานทีละคันอย่างเดียว หรือเลือกหลายคันส่งพร้อมกันได้ด้วย","x":2840,"y":1572,"w":320}],"gap":16,"horizontal":true}}}};

/* ======================== AC รายจอ (ฝังตอน build) ======================== */
const AC = null;

/* ======================== เอกสาร story map / use case (ฝังตอน build) ======================== */
const DOCS = {"storymap":{"src":"Diagram/01-บำรุงรักษาตามวาระ/23-บำรุงรักษา-story-map-JO-7.3.md","title":"Story Map บำรุงรักษาตามวาระ — use case จาก JO1 ข้อ 7.3 (30 ต.ค. 2569)","sections":[{"h":"1. จำแนกประเภทรถและผู้ทำ (ก่อนเข้าแผน)","head":["ทำแล้ว","use case","JO","สถานะ","ใน flow ตอนนี้"],"rows":[["☐","รถเช่า: บริษัทผู้ให้เช่าเป็นคนบำรุงรักษา ประสานกับหน่วยงานผู้บริหารสัญญาและหน่วยงานเจ้าของรถ","7.3.1","ยังไม่มี","ไม่มีใน flow · ต้องตกลงว่าระบบต้องติดตามด้วยไหม"],["☐","รถซื้อทั่วไปที่ไม่มีเครื่องมือกล: หน่วยงานเจ้าของรถเอาไปศูนย์บริการหรืออู่ตามรอบระยะทางหรือเวลา","7.3.1","ยังไม่มี","ไม่มีใน flow"],["☑","รถที่ติดตั้งเครื่องมือกล: กบค. วางแผนและกำหนดรอบให้ ทำเองหรือจ้างภายนอกก็ได้","7.3.1","มีใน flow แล้ว","ทั้ง flow S1 ถึง S18 · ทำเอง S6 · จ้าง S9"]],"note":"ติ๊กแล้ว 1 จาก 3"},{"h":"2. วางแผนปีและอนุมัติ (S1 · S2 · S19 · S20)","head":["ทำแล้ว","use case","JO","สถานะ","ใน flow ตอนนี้"],"rows":[["☑","กบค. สร้าง แก้ไข ยกเลิก และดูแผนบำรุงรักษาได้","7.3.2","มีใน flow แล้ว","S1 สร้างแผนปีและส่งอนุมัติ · S2 อนุมัติหรือส่งกลับ · S19 แก้ไขแผนแล้วส่งอนุมัติใหม่ · S20 ลบแผนก่อนอนุมัติ · เจ้าของงานเคาะ 30 ต.ค. ไม่มียกเลิกแผน"],["☑","กบค. ระบุ เพิ่ม แก้ไข ลบ รถที่ต้องบำรุงรักษาในแต่ละรอบได้","7.3.2","มีใน flow แล้ว","S1 เลือกภาค เขต ประเภทรถ แล้วค้นรถลงไตรมาส 1 ถึง 4 · S4 นำรถรอยุบหรือโอนออก"],["☐","ทำแผนล่วงหน้า 2 ปี เพื่อเตรียมอะไหล่","7.3.2","ขัดกับที่เคาะ","22 ต.ค. เคาะว่าไม่ทำ · 30 ต.ค. เลือกปีงบประมาณได้ทุกปี สร้างแผนปีถัดไปได้ แต่ไม่มีกลไกแผนล่วงหน้า"],["☐","ทบทวนแผนก่อนถึงกำหนด และยืนยันแผนระหว่าง กบค. กับหน่วยงานพื้นที่","7.3.2","ขัดกับที่เคาะ","22 ต.ค. เคาะว่าไม่ทำรอบทบทวน · S4 มีแค่ป้ายพร้อมหรือไม่พร้อม ไม่มีฝั่งหน่วยงานตอบ (Q7)"],["☑","กำหนดอะไหล่หรือวัสดุที่ต้องใช้ของรถแต่ละคันตามรอบ","7.3.2","มีใน flow แล้ว","S1 หัวข้ออะไหล่แยกตามไตรมาส · S21 กบค. เลือกเอง แก้จำนวน หรือเอาออกทีละคัน ระบบไม่แนะนำ"],["☐","ระบุสิ่งที่ต้องทำตามรอบของรถแต่ละคัน และดูประวัติซ่อมบำรุงก่อนหน้าได้","7.3.2","ยังไม่มี","ไม่มีรายการงานต่อคัน และไม่มีลิงก์ไปประวัติซ่อม"],["☐","กำหนดรายการตรวจสภาพที่ต่างกันตามประเภทรถ","7.3.2","ยังไม่มี","ไม่มีหน้าตั้งค่ารายการตรวจตามประเภทรถ"]],"note":"ติ๊กแล้ว 3 จาก 7"},{"h":"3. เตรียมรายไตรมาส: ความคืบหน้าและเบิกอะไหล่ (S4)","head":["ทำแล้ว","use case","JO","สถานะ","ใน flow ตอนนี้"],"rows":[["☐","ดูหน้ารายละเอียดรถที่ต้องการได้","7.3.2","มีบางส่วน","S10 แสดงข้อมูลรถ · ไม่มีหน้ารายละเอียดรถแยก"],["☑","เบิกอะไหล่จากคลังก่อนเดินทางไปบำรุงรักษา","7.3.2","มีใน flow แล้ว","S4 ติดตามและเบิกหรือจองอะไหล่รายไตรมาส · เตรียมอะไหล่ที่จุดรวมงานประสานกันเองนอกระบบ (S9 ตัดออก 3 พ.ย.)"],["☐","เชื่อมต่อระบบคลังอะไหล่อัจฉริยะ (Smart Inventory) ตอนเบิก","7.3.2","มีบางส่วน","S4 แสดงคงเหลือ Smart Inventory · ยังไม่รู้วิธีเชื่อมจริง (Q9)"]],"note":"ติ๊กแล้ว 1 จาก 3"},{"h":"4. แผนเดินทาง ทำเองหรือจ้าง (S6 · S9 · S7 · S8)","head":["ทำแล้ว","use case","JO","สถานะ","ใน flow ตอนนี้"],"rows":[["☑","วางแผนเดินทาง: ผู้ทำ (พนักงาน กฟภ. หรือผู้รับจ้าง) ช่วงวัน รถ สถานที่","7.3.2","มีใน flow แล้ว","S6 กบค. ดำเนินการเอง · S9 จ้างดำเนินการ เลือกผู้รับจ้างจาก vendor list · S7 ผู้อนุมัติอนุมัติแผนเดินทาง"],["☐","แจ้งเตือนผู้เกี่ยวข้องให้รับทราบ ยืนยัน หรือดำเนินการต่อ","7.3.2","มีบางส่วน","S8 แจ้งเตือนในแอปถึง กรย. และหน่วยงานเจ้าของรถหลังอนุมัติแผนเดินทาง · ยังไม่มีสเปกแจ้งเตือนรวม"]],"note":"ติ๊กแล้ว 1 จาก 2"},{"h":"5. บันทึกงานบำรุงรักษารายคัน (S10 · ผู้รับจ้าง S23)","head":["ทำแล้ว","use case","JO","สถานะ","ใน flow ตอนนี้"],"rows":[["☐","บันทึกการตรวจสภาพ: วันที่ ทะเบียน ประเภท สังกัด ยี่ห้อเครื่องจักร หมายเลขเครน Serial number เลขไมล์ ชั่วโมงเครื่องจักร รายการตรวจ ผลตรวจ ผู้ทำ","7.3.3","มีบางส่วน","S10 มีเลขไมล์ ชั่วโมงเครื่องจักร ภาพ · ยังไม่มีรายการตรวจพร้อมผล หมายเลขเครน Serial number"],["☐","บันทึกการบำรุงรักษา: อะไหล่ที่ใช้ (รหัสและชื่อ) ค่าแรง ค่าอะไหล่ ยอดรวม ผู้ซ่อม อาการชำรุดเพิ่มเติม","7.3.3","มีบางส่วน","S10 อะไหล่ที่ใช้จริง · S18 ค่าแรง ที่พัก เดินทาง · ยังไม่มีค่าอะไหล่ (Q26) และอาการชำรุดเพิ่มเติม"],["☑","แนบภาพรถหรือเครื่องมือกลก่อนและหลังบำรุงรักษา และเอกสาร","7.3.3","มีใน flow แล้ว","S10 ภาพก่อนเริ่มและตอนจบงาน"],["☐","แก้ไขหรือยกเลิกการบันทึกงานบำรุงรักษาได้","7.3.3","มีบางส่วน","S11 ส่งกลับผู้รับจ้างให้แก้ · งานที่ กบค. บันทึกเองยังแก้หรือยกเลิกไม่ได้"]],"note":"ติ๊กแล้ว 1 จาก 4"},{"h":"6. ตรวจรับ ผลน้ำมัน คืนอะไหล่ (S11 · S12 · S13 · S14)","head":["ทำแล้ว","use case","JO","สถานะ","ใน flow ตอนนี้"],"rows":[["☐","บันทึกผลตรวจค่าความเป็นฉนวนน้ำมันไฮดรอลิก คำแนะนำเมื่อไม่ผ่าน วันที่ตรวจและวันที่บันทึก","7.3.3","มีบางส่วน","S10 เก็บตัวอย่าง · S12 บันทึกผล · ยังไม่มีช่องคำแนะนำเมื่อไม่ผ่าน (Q21)"],["☑","แจ้งผลการบำรุงรักษาและผลตรวจน้ำมันไปยังผู้เกี่ยวข้อง","7.3.3","มีใน flow แล้ว","S12 แจ้งเจ้าของรถเรื่องผลน้ำมัน · S13 แจ้งทาง e-mail และ VMS+"],["☐","คืนอะไหล่เข้าคลังหลังกลับจากงาน อะไหล่ที่ไม่มีรหัสพัสดุโอนเข้าคลังสำรอง","7.3.3","มีบางส่วน","S11 รับคืนเฉพาะทางจ้าง · ทางทำเองไม่มีขั้นคืน ไม่มีกรณีคลังสำรอง"],["☐","เชื่อมต่อ Smart Inventory ตอนคืนอะไหล่","7.3.3","ยังไม่มี","ไม่มีในขั้นคืนอะไหล่"],["☑","หน่วยงานเจ้าของรถตรวจผลสภาพและผลบำรุงรักษา และประเมินหรือให้คะแนนคุณภาพงาน","7.3.3","มีใน flow แล้ว","S13 ยอมรับผลรายคัน · S14 ยอมรับทั้งแผนและประเมินความพึงพอใจ"],["☐","Safety Inspection รถเครนและกระเช้า ระบบต้องบังคับตรวจตามรอบปีหรือตามกฎหมาย","7.3.3","ยังไม่มี","ไม่มีในบำรุงรักษา (มีแค่ใน Overhaul S12)"]],"note":"ติ๊กแล้ว 2 จาก 6"},{"h":"7. รายงาน ต้นทุน ภาพรวม (S15 · S16 · S17 · S18)","head":["ทำแล้ว","use case","JO","สถานะ","ใน flow ตอนนี้"],"rows":[["☑","ผู้บังคับบัญชาตรวจความถูกต้องครบถ้วนของงานในแต่ละแผน","7.3.3","มีใน flow แล้ว","S16 หัวหน้า กบค. ตรวจประวัติ ผ่านหรือตีกลับ"],["☐","รายงานผลการบำรุงรักษาตามแบบฟอร์มที่ กฟภ. กำหนด","7.3.3","มีบางส่วน","S17 รายงานผลดาวน์โหลดได้ · ยังไม่รู้หัวข้อและรูปแบบไฟล์ (Q25)"],["☐","Dashboard ภาพรวมงานบำรุงรักษายานพาหนะและเครื่องมือกล","7.3.3","ยังไม่มี","ไม่มี · Overhaul มีแล้ว แต่บำรุงรักษายังไม่มี"],["☐","ค้นหาและกรองรถตามที่ กฟภ. กำหนด: ทะเบียน รหัสรถ รหัสทรัพย์สิน ยี่ห้อรุ่น ประเภท สังกัด เลขตัวถัง ประเภทและยี่ห้อรุ่นเครื่องมือกล","7.3.3","มีบางส่วน","S1 กรองตามภาคและประเภทรถ · รายการแผนค้นได้แค่ชื่อแผน"],["☐","Export ข้อมูลเป็น Excel หรือ PDF","7.3.3","มีบางส่วน","S18 Excel ต้นทุน · S17 ดาวน์โหลดรายงาน"]],"note":"ติ๊กแล้ว 1 จาก 5"}]},"usecase":{"src":"Diagram/01-บำรุงรักษาตามวาระ/24-บำรุงรักษา-usecase.csv","head":["รหัส","ช่วงงาน","scenario","บทบาท","use case","ผ่านเมื่อ","JO","สถานะใน flow","หมายเหตุ"],"rows":[["UC-MT-01","0 จำแนกประเภทรถ","S1","กบค.","กบค. เลือกเข้าแผนได้เฉพาะรถที่ติดตั้งเครื่องมือกล","รายการรถในฟอร์มสร้างแผนไม่มีรถเช่าและรถซื้อทั่วไป","7.3.1","มีบางส่วน","S1 กรองตามประเภทรถ ยังไม่ได้แยกรถเช่าออกชัดๆ"],["UC-MT-02","0 จำแนกประเภทรถ","—","หน่วยงานเจ้าของรถ","หน่วยงานเจ้าของรถ บันทึกการบำรุงรักษารถซื้อทั่วไปที่นำไปศูนย์บริการหรืออู่เองได้","รถคันนั้นมีประวัติบำรุงรักษาตามรอบระยะทางหรือเวลา","7.3.1","ยังไม่มี","ต้องตกลงว่าระบบต้องเก็บไหม"],["UC-MT-03","0 จำแนกประเภทรถ","—","หน่วยงานผู้บริหารสัญญา","หน่วยงานผู้บริหารสัญญา ติดตามการบำรุงรักษารถเช่าที่บริษัทผู้ให้เช่าเป็นผู้ทำได้","เห็นว่ารถเช่าคันไหนบำรุงรักษาแล้วหรือยัง","7.3.1","ยังไม่มี","ต้องตกลงว่าระบบต้องเก็บไหม"],["UC-MT-04","1 วางแผนปีและอนุมัติ","S1","กบค.","กบค. ดูรายการแผน ค้นหาด้วยเลขที่ MR หรือชื่อแผน และกรองตามปี ภาค ประเภทรถ สถานะได้","รายการเหลือเฉพาะแผนที่ตรงกับคำค้นและตัวกรอง","7.3.2","มีใน flow แล้ว",""],["UC-MT-05","1 วางแผนปีและอนุมัติ","S1","กบค.","กบค. สร้างแผนบำรุงรักษาประจำปีได้ โดยตั้งชื่อ เลือกปีงบประมาณ และเลือกภาค เขต ประเภทรถได้หลายค่า","ระบบแสดงรถของทุกเขตและประเภทที่เลือกในช่องเลือกรถ","7.3.2","มีใน flow แล้ว","เลือกปีได้ทุกปี"],["UC-MT-06","1 วางแผนปีและอนุมัติ","S1","กบค.","กบค. จัดรถลงไตรมาส 1 ถึง 4 ได้ โดยรถ 1 คันอยู่ได้ไตรมาสเดียว","แท็บไตรมาสบอกจำนวนรถ รถที่เลือกขึ้นในตารางรถของไตรมาสด้านล่าง และรายการรถบอกไตรมาสของทุกคันที่จัดแล้ว","7.3.2","มีใน flow แล้ว",""],["UC-MT-07","1 วางแผนปีและอนุมัติ","S1","ระบบ","ระบบรวมอะไหล่ที่ กบค. เลือกเป็นยอดของแต่ละไตรมาสได้","เปลี่ยนรถหรืออะไหล่ในไตรมาสแล้วยอดเปลี่ยนตาม","7.3.2","มีใน flow แล้ว","ระบบไม่คำนวณหรือแนะนำอะไหล่"],["UC-MT-08","1 วางแผนปีและอนุมัติ","S1","ระบบ","ระบบออกเลขที่ MR ให้เองได้ ตามเกณฑ์ MR + เขต + ปีที่เลือก + ลำดับ 5 หลัก","แผนที่ 3 ของปี 70 ที่ กบค. สร้าง ได้เลข MR Z7000003","—","มีใน flow แล้ว","เกณฑ์จากเจ้าของงาน 30 ต.ค."],["UC-MT-09","1 วางแผนปีและอนุมัติ","S1","กบค.","กบค. บันทึกแผนและส่งอนุมัติได้สำเร็จ","แผนขึ้นในรายการด้วยสถานะรออนุมัติ และมีข้อความส่งสำเร็จ","7.3.2","มีใน flow แล้ว",""],["UC-MT-10","1 วางแผนปีและอนุมัติ","S1","กบค.","กบค. ออกจากหน้าสร้างแผนได้ โดยระบบถามยืนยันก่อนถ้ามีข้อมูลที่ยังไม่บันทึก","ไม่มีการแก้ไขจะออกเลย มีการแก้ไขจะถามยืนยันการออก","—","มีใน flow แล้ว",""],["UC-MT-11","1 วางแผนปีและอนุมัติ","S2","ผู้อนุมัติ","ผู้อนุมัติ ดูรายการแผนรออนุมัติ และเปิดดูรถรายไตรมาสพร้อมน้ำมันและอะไหล่ของแต่ละคันได้","เห็นข้อมูลแผนครบก่อนตัดสินใจ","7.3.2","มีใน flow แล้ว","ผู้อนุมัติคือใคร (Q32)"],["UC-MT-12","1 วางแผนปีและอนุมัติ","S2","ผู้อนุมัติ","ผู้อนุมัติ อนุมัติแผนได้สำเร็จ","สถานะเป็นอนุมัติแล้ว และระบบส่งรายการอะไหล่รายไตรมาสให้ กบค. คลังรับทราบ (S22)","7.3.2","มีใน flow แล้ว",""],["UC-MT-13","1 วางแผนปีและอนุมัติ","S2","ผู้อนุมัติ","ผู้อนุมัติ ส่งแผนกลับให้แก้ไขพร้อมเหตุผลได้","สถานะเป็นส่งกลับแก้ไข และ กบค. เห็นเหตุผล","7.3.2","มีใน flow แล้ว",""],["UC-MT-67","2 เตรียมรายไตรมาส","S22","ระบบ","ระบบส่งรายการอะไหล่ทั้งปีแยกไตรมาสให้ กบค. คลังได้ทันทีที่แผนอนุมัติ","คลังเห็นแผนในรายการด้วยสถานะรอรับทราบ","7.3.2","มีใน flow แล้ว","กบค. คลังคือใคร (Q42)"],["UC-MT-68","2 เตรียมรายไตรมาส","S22","กบค. คลัง","กบค. คลัง ดูอะไหล่ที่ต้องเบิกทีละไตรมาสเทียบคงเหลือ และกดรับทราบทีละไตรมาสได้","ไตรมาสนั้นเป็นรับทราบแล้ว และสถานะแผนบอกรับทราบกี่ไตรมาส","7.3.2","มีใน flow แล้ว","แก้แผนหลังอนุมัติต้องรับทราบใหม่ไหม (Q43)"],["UC-MT-69","2 เตรียมรายไตรมาส","S22","กบค.","กบค. ดูได้ว่าคลังรับทราบรายการอะไหล่ไตรมาสไหนแล้ว","หน้ารายการแผนบอกรับทราบกี่ไตรมาส และหน้ารายละเอียดแผนบอกในแท็บไตรมาส","7.3.2","มีใน flow แล้ว",""],["UC-MT-14","1 วางแผนปีและอนุมัติ","S19","กบค.","กบค. แก้ไขแผนที่ถูกส่งกลับ แล้วส่งอนุมัติใหม่ได้","แผนกลับเป็นสถานะรออนุมัติ และผู้อนุมัติเห็นฉบับล่าสุด","7.3.2","มีใน flow แล้ว",""],["UC-MT-15","1 วางแผนปีและอนุมัติ","—","กบค.","กบค. ยกเลิกแผนที่ยังไม่เริ่มดำเนินการพร้อมเหตุผลได้","สถานะเป็นยกเลิก และไม่มีงานรายไตรมาสต่อ","7.3.2","ขัดกับที่เคาะ","30 ต.ค. เคาะว่าไม่มียกเลิกแผน มีแก้ไข (S19) และลบ (S20) · แผนอนุมัติแล้วเอาออกอย่างไร ยังไม่เคาะ (Q35)"],["UC-MT-60","1 วางแผนปีและอนุมัติ","S19","กบค.","กบค. แก้ไขแผนได้หลังจากอนุมัติแล้ว ถ้ายังไม่เริ่มงาน และต้องส่งอนุมัติใหม่","ระบบเตือนก่อนบันทึก และแผนกลับเป็นสถานะรออนุมัติ","7.3.2","มีใน flow แล้ว","ทุกการแก้ต้องอนุมัติใหม่ ใส่ไว้ก่อน (Q34)"],["UC-MT-61","1 วางแผนปีและอนุมัติ","S20","กบค.","กบค. ลบแผนที่ยังไม่อนุมัติได้ ทั้งจากหน้ารายการและหน้ารายละเอียด","ยืนยันแล้วแผนหายจากรายการ และมีข้อความลบสำเร็จ","7.3.2","มีใน flow แล้ว","เลขที่ MR ไม่นำกลับมาใช้ซ้ำ"],["UC-MT-62","1 วางแผนปีและอนุมัติ","S19","กบค.","กบค. ดูรายละเอียดแผนได้ และเห็นเฉพาะปุ่มที่ทำได้ในสถานะนั้น","แผนที่อนุมัติแล้วไม่มีปุ่มลบ แผนที่ดำเนินการแล้วเมนูเหลือดูรายละเอียดอย่างเดียว","7.3.2","มีใน flow แล้ว",""],["UC-MT-63","1 วางแผนปีและอนุมัติ","S21","กบค.","กบค. ดูรถในไตรมาสพร้อมสถานะอะไหล่ และเปิดแก้อะไหล่ทีละคันได้","section รถในไตรมาสบอกน้ำมันและจำนวนรายการอะไหล่ของรถทุกคันในไตรมาสนั้น","7.3.2","มีใน flow แล้ว",""],["UC-MT-64","1 วางแผนปีและอนุมัติ","S21","กบค.","กบค. เลือกอะไหล่จากคลัง แก้จำนวน และเอาอะไหล่ออกจากรถแต่ละคันได้","บันทึกแล้วจำนวนรายการของรถคันนั้นและอะไหล่ในไตรมาสเปลี่ยนตาม","7.3.2","มีใน flow แล้ว","ตั้งต้นว่าง ไม่มีรายการแนะนำ"],["UC-MT-65","1 วางแผนปีและอนุมัติ","S21","กบค.","กบค. เลือกได้ว่าน้ำมันไฮดรอลิกของรถแต่ละคันเป็นการเปลี่ยนหรือการเก็บตัวอย่าง","เห็นวันที่เปลี่ยนน้ำมันครั้งล่าสุด และเลือกเปลี่ยนแล้วน้ำมันเข้ารายการอะไหล่","7.3.2","มีใน flow แล้ว","ระบบไม่ตัดสินแทน (Q39)"],["UC-MT-66","1 วางแผนปีและอนุมัติ","S21","กบค.","กบค. เพิ่มอะไหล่เองได้เมื่อไม่มีในคลัง โดยระบุชื่อ รหัส ราคา และจำนวน","รายการขึ้นในอะไหล่ของรถคันนั้น และยอดรวมค่าอะไหล่เปลี่ยนตาม","7.3.2","มีใน flow แล้ว",""],["UC-MT-16","1 วางแผนปีและอนุมัติ","—","กบค.","กบค. ทำแผนล่วงหน้า 2 ปีได้ เพื่อเตรียมอะไหล่","มีแผนของ 2 ปีข้างหน้าพร้อมรายการอะไหล่","7.3.2","ขัดกับที่เคาะ","22 ต.ค. เคาะว่าไม่ทำ · ตอนนี้เลือกปีอนาคตได้"],["UC-MT-17","1 วางแผนปีและอนุมัติ","—","กบค. หน่วยงานพื้นที่","กบค. และหน่วยงานพื้นที่ ทบทวนและยืนยันแผนร่วมกันได้ก่อนถึงกำหนด","แผนมีสถานะยืนยันจากทั้งสองฝั่งก่อนเริ่มงาน","7.3.2","ขัดกับที่เคาะ","22 ต.ค. เคาะว่าไม่ทำรอบทบทวน"],["UC-MT-18","1 วางแผนปีและอนุมัติ","—","กบค.","กบค. กำหนดรายการตรวจสภาพที่ต่างกันตามประเภทรถได้","ฟอร์มบันทึกงานของรถแต่ละประเภทแสดงรายการตรวจของประเภทนั้น","7.3.2","ยังไม่มี",""],["UC-MT-19","1 วางแผนปีและอนุมัติ","—","กบค.","กบค. ดูประวัติซ่อมบำรุงก่อนหน้าของรถในแผนได้","เปิดจากรถในแผนแล้วเห็นประวัติซ่อมของคันนั้น","7.3.2","ยังไม่มี",""],["UC-MT-20","2 เตรียมรายไตรมาส","S4","กบค.","กบค. เปิดไตรมาสที่กำลังทำของแผนที่อนุมัติแล้ว และเห็นอะไหล่ที่ต้องเบิกได้","เห็นอะไหล่ที่ต้องเบิกของไตรมาสนั้น","7.3.2","มีใน flow แล้ว",""],["UC-MT-25","2 เตรียมรายไตรมาส","S4","กบค.","กบค. ดูอะไหล่ที่ต้องเบิกเทียบกับคงเหลือใน Smart Inventory ได้","เห็นจำนวนที่ไม่พอและสถานะการเบิกรายรายการ","7.3.2","มีใน flow แล้ว",""],["UC-MT-26","2 เตรียมรายไตรมาส","S4","กบค.","กบค. เบิกหรือจองอะไหล่ของไตรมาสผ่านระบบคลังได้สำเร็จ","ได้ผลการจองรายรายการกลับมา และไตรมาสอื่นยังไม่ถูกเบิก","7.3.2","มีบางส่วน","ยังไม่รู้วิธีเชื่อมจริง (Q9)"],["UC-MT-27","3 แผนเดินทาง","S6 · S9","กบค.","กบค. เลือกได้ว่าแผนเดินทางนี้ กบค. ดำเนินการเอง หรือจ้างดำเนินการ","เลือกจ้างดำเนินการแล้วฟอร์มเปลี่ยนเป็นแบบจ้าง เลือกผู้รับจ้างได้ และส่วนพนักงาน กบค. ซ่อนไป","7.3.1","มีใน flow แล้ว","3 พ.ย. 2569 ย้ายจากหน้าไตรมาส (S4) มาเลือกต่อใบแผนเดินทาง (Q10 ปิดแล้ว)"],["UC-MT-28","3 แผนเดินทาง","S6","กบค.","กบค. สร้างแผนเดินทางได้สำเร็จ โดยตั้งชื่อ เพิ่มรถของไตรมาส ระบุสถานที่และเบอร์ติดต่อรายคัน ช่วงวัน และพนักงาน 2 ถึง 3 คน","แผนเดินทางขึ้นในรายการของไตรมาสนั้น และรถที่อยู่ในใบแล้วไม่ขึ้นให้เลือกในใบถัดไป","7.3.2","มีใน flow แล้ว",""],["UC-MT-29","4 บันทึกงานรายคัน","S10","กบค.","กบค. กรอกค่าใช้จ่ายของรถแต่ละคันตอนปิดงานได้ ทั้งเบี้ยเลี้ยง ที่พัก ค่าเดินทาง และเลือกงบประมาณ (ศูนย์ต้นทุน)","ค่าใช้จ่ายของรถคันนั้นรวมยอดแล้วผูกกับศูนย์ต้นทุนของหน่วยงานเจ้าของรถ และไปรวมที่หน้าต้นทุน","7.3.3","มีใน flow แล้ว","ย้ายจาก S6 3 พ.ย. 2569"],["UC-MT-30","3 แผนเดินทาง","S6","กบค.","กบค. ส่งแผนเดินทางให้ผู้อนุมัติได้สำเร็จ","แผนเดินทางสถานะรออนุมัติ","7.3.2","มีใน flow แล้ว",""],["UC-MT-74","3 แผนเดินทาง","S6","กบค.","กบค. แก้ไขแผนเดินทางที่ถูกส่งกลับ แล้วส่งใหม่ได้","ใบที่ถูกส่งกลับเห็นเหตุผล และส่งใหม่แล้วกลับเป็นรออนุมัติ","7.3.2","มีใน flow แล้ว",""],["UC-MT-31","3 แผนเดินทาง","S7","ผู้อนุมัติตามสายงาน","ผู้อนุมัติ อนุมัติแผนเดินทางได้สำเร็จ","แผนเดินทางสถานะอนุมัติแล้ว และระบบแจ้งเตือน กรย. และเจ้าของรถ (S8)","7.3.2","มีใน flow แล้ว","ผู้อนุมัติจาก API getUpperLower ตำแหน่งไหน (Q45)"],["UC-MT-75","3 แผนเดินทาง","S7","ผู้อนุมัติตามสายงาน","ผู้อนุมัติ ส่งแผนเดินทางกลับให้แก้ไขพร้อมเหตุผลได้","แผนเดินทางสถานะส่งกลับแก้ไข และ กบค. เห็นเหตุผล","7.3.2","มีใน flow แล้ว",""],["UC-MT-32","3 แผนเดินทาง","S8","กรย. และหน่วยงานเจ้าของรถ","กรย. และหน่วยงานเจ้าของรถ ได้รับแจ้งเตือนเมื่อแผนเดินทางอนุมัติ และเปิดดูแผนเดินทางได้","กรย. เห็นรถทุกคันในใบ · หน่วยงานเห็นเฉพาะรถของตน พร้อมวันและสถานที่","7.3.2","มีใน flow แล้ว","ออกแบบเฉพาะแจ้งเตือนในแอปไปก่อน e-mail และ push ยังไม่ทำ"],["UC-MT-33","3 แผนเดินทาง","S9","กบค.","กบค. สร้างแผนเดินทางจ้างดำเนินการได้สำเร็จ โดยเลือกผู้รับจ้าง รถ สถานที่รายคัน และช่วงวันทำงาน","แผนเดินทางสถานะรออนุมัติ ผู้ดำเนินการเป็นชื่อผู้รับจ้าง · ผู้รับจ้างเห็นเฉพาะรถในใบนี้","7.3.2","มีใน flow แล้ว","ผู้รับจ้างบันทึกงานที่ S23 และ กบค. ตรวจรับรายคันที่ S11 · vendor list มาจากไหน (Q46)"],["UC-MT-34","4 บันทึกงานรายคัน","S10 · S23","กบค. หรือผู้รับจ้าง","กบค. หรือผู้รับจ้าง ดูรถในแผนเดินทางพร้อมสถานะงานรายคัน และเลือกทำทีละคันได้","เห็นว่าคันไหนยังไม่เริ่ม อยู่ระหว่างบำรุงรักษา เสร็จสิ้น หรือบำรุงรักษาไม่ได้","7.3.3","มีใน flow แล้ว",""],["UC-MT-35","4 บันทึกงานรายคัน","S10 · S23","กบค. หรือผู้รับจ้าง","กบค. หรือผู้รับจ้าง เริ่มงานรายคันได้สำเร็จ หลังตรวจรายการรับรถ ลงนามรับมอบ และแนบภาพก่อนเริ่ม","ระบบบันทึกเวลาและผู้เริ่มงาน คันนั้นเป็นอยู่ระหว่างบำรุงรักษา","7.3.3","มีใน flow แล้ว",""],["UC-MT-76","4 บันทึกงานรายคัน","S10 · S23","กบค. หรือผู้รับจ้าง","กบค. หรือผู้รับจ้าง ปิดงานรายคันได้สำเร็จ โดยกรอกอะไหล่ที่ใช้จริงและที่คืน เลขไมล์ ชั่วโมงเครื่องจักร ตรวจสภาพรถ และลงนามส่งคืนรถ","ระบบบันทึกเวลาปิดงาน แผนที่ กบค. ทำเองคันนั้นเป็นเสร็จสิ้น แผนจ้างดำเนินการเป็นดำเนินการบำรุงรักษาแล้ว รอส่งตรวจงาน","7.3.3","มีใน flow แล้ว","ภาพตอนจบงานเอาออกจากหน้าปิดงาน 3 พ.ย. 2569"],["UC-MT-36","4 บันทึกงานรายคัน","S10 · S23","กบค. หรือผู้รับจ้าง","กบค. หรือผู้รับจ้าง บันทึกการตรวจสภาพรถตามรายการตรวจของประเภทรถได้ พร้อมหมายเลขเครนและ Serial number","ใบตรวจสภาพของคันนั้นมีผลครบทุกข้อ","7.3.3","มีบางส่วน","มีตรวจสภาพรถปิดงาน 24 รายการของรถกระเช้า (ปกติ หรือ ต้องแก้ไข) ยังไม่มีหมายเลขเครน Serial number และรายการตามประเภทรถ"],["UC-MT-37","4 บันทึกงานรายคัน","S10 · S23","กบค. หรือผู้รับจ้าง","กบค. หรือผู้รับจ้าง แจ้งได้ว่ารถคันนั้นบำรุงรักษาไม่ได้ พร้อมสาเหตุและอะไหล่ส่งคืน","แผนที่ กบค. ทำเองคันนั้นเป็นบำรุงรักษาไม่ได้ทันที · ผู้รับจ้างเป็นแจ้งบำรุงรักษาไม่ได้ รอส่งตรวจงาน","—","มีใน flow แล้ว","กรอกแค่สาเหตุ ไม่มีแนบภาพ (Q19 ตอบแล้ว 3 พ.ย.)"],["UC-MT-38","4 บันทึกงานรายคัน","S10 · S23","กบค. หรือผู้รับจ้าง","กบค. หรือผู้รับจ้าง บันทึกอาการชำรุดเพิ่มเติมที่พบระหว่างบำรุงรักษาได้","อาการเพิ่มเติมขึ้นในผลการตรวจของคันนั้น","7.3.3","ยังไม่มี",""],["UC-MT-39","4 บันทึกงานรายคัน","S10 · S23","กบค. หรือผู้รับจ้าง","กบค. หรือผู้รับจ้าง เลือกได้ว่าน้ำมันไฮดรอลิกหน้างานเก็บตัวอย่าง เปลี่ยนน้ำมัน หรือทั้งสองอย่าง","มีการเก็บตัวอย่าง คันนั้นเข้ารายการรอผลตรวจน้ำมัน (S12) · เปลี่ยนน้ำมันอย่างเดียวไม่เข้า","7.3.3","มีใน flow แล้ว","3 พ.ย. 2569 แทนการติ๊กเก็บตัวอย่างอย่างเดียว"],["UC-MT-72","4 บันทึกงานรายคัน","S10","กบค.","กบค. แก้เบอร์ติดต่อและสถานที่ของรถในแผนเดินทางที่อนุมัติแล้วได้","ค่าใหม่แสดงในตารางรถในแผนเดินทาง","7.3.2","มีใน flow แล้ว",""],["UC-MT-77","4 บันทึกงานรายคัน","S10","กบค.","กบค. เอารถออกจากแผนเดินทางที่อนุมัติแล้วได้","รถคันนั้นหายจากใบ และเลือกเข้าแผนเดินทางใบอื่นของไตรมาสได้","7.3.2","มีใน flow แล้ว","เอาออกหลังอนุมัติต้องส่งอนุมัติใหม่ไหม ยังไม่เคาะ"],["UC-MT-73","4 บันทึกงานรายคัน","S10","กบค.","กบค. เพิ่ม แก้ไข และลบอะไหล่ตามแผนของรถคันนั้นได้ก่อนปิดงาน","รายการที่แก้เป็นค่าตั้งต้นของรายการสภาพวัสดุอะไหล่ตอนปิดงาน","7.3.3","มีใน flow แล้ว","ผู้รับจ้างทำได้หลังเริ่มงานเท่านั้น (S23)"],["UC-MT-70","4 บันทึกงานรายคัน","S23","ผู้รับจ้าง","ผู้รับจ้าง ส่งตรวจงานรายคันได้สำเร็จ หลังปิดงานหรือแจ้งบำรุงรักษาไม่ได้","สถานะคันนั้นเป็นรอตรวจรับ และ กบค. ได้รับแจ้งให้ตรวจรับ (S11)","7.3.3","มีใน flow แล้ว","ส่งหลายคันพร้อมกันได้ไหม (Q49)"],["UC-MT-78","4 บันทึกงานรายคัน","S23","ผู้รับจ้าง","ผู้รับจ้าง แก้งานที่ กบค. ส่งกลับ แล้วส่งตรวจงานใหม่ได้","เห็นเหตุผลจาก กบค. บนหน้างานรายคัน และส่งใหม่แล้วกลับเป็นรอตรวจรับ","7.3.3","มีใน flow แล้ว",""],["UC-MT-71","4 บันทึกงานรายคัน","S23","ผู้รับจ้าง","ผู้รับจ้าง เพิ่ม แก้ไข และลบอะไหล่ที่ใช้จริง อะไหล่ส่งคืน และภาพได้ ตั้งแต่เริ่มงานจนรอตรวจรับ","จำนวนที่คืนคำนวณใหม่ตามจำนวนที่ใช้จริง และ กบค. เห็นค่าล่าสุดตอนตรวจรับ","7.3.3","มีใน flow แล้ว","อะไหล่ที่เพิ่มเองกรอกชื่อ รหัส จำนวน หน่วย · แก้ระหว่างรอตรวจรับ กบค. ต้องเห็นว่าแก้หลังส่งไหม"],["UC-MT-40","4 บันทึกงานรายคัน","—","กบค.","กบค. แก้ไขหรือยกเลิกงานที่บันทึกไปแล้วได้","งานที่แก้แสดงค่าใหม่ งานที่ยกเลิกกลับเป็นยังไม่ทำ","7.3.3","ยังไม่มี",""],["UC-MT-41","5 ตรวจรับ","S11","กบค.","กบค. อนุมัติงานรายคันที่ผู้รับจ้างส่งมาได้สำเร็จ ทั้งคันที่ปิดงานและคันที่แจ้งบำรุงรักษาไม่ได้","คันนั้นเป็นเสร็จสิ้นหรือบำรุงรักษาไม่ได้ และรับคืนอะไหล่ตามรายการ","7.3.3","มีใน flow แล้ว","ผลการพิจารณาแบบการ์ดเหมือน S2 (3 พ.ย. 2569)"],["UC-MT-79","5 ตรวจรับ","S11","กบค.","กบค. ส่งงานรายคันกลับให้ผู้รับจ้างแก้ไขพร้อมเหตุผลได้","คันนั้นเป็นส่งกลับแก้ไข และผู้รับจ้างเห็นเหตุผลที่ S23","7.3.3","มีใน flow แล้ว",""],["UC-MT-42","5 ตรวจรับ","S11","กบค.","กบค. รับคืนอะไหล่และน้ำมันที่ผู้รับจ้างไม่ได้ใช้ได้","รับคืนตามรายการอะไหล่ส่งคืนเมื่อกดอนุมัติ จำนวนที่คืนเทียบกับที่ใช้จริง","7.3.3","มีใน flow แล้ว",""],["UC-MT-43","5 ตรวจรับ","—","กบค.","กบค. คืนอะไหล่เข้าคลังได้เมื่อดำเนินการเอง และโอนอะไหล่ที่ไม่มีรหัสพัสดุเข้าคลังสำรองได้","คลังได้รับคืนตามจำนวน และของไม่มีรหัสอยู่ในคลังสำรอง","7.3.3","ยังไม่มี","รวมการเชื่อม Smart Inventory ตอนคืน"],["UC-MT-44","5 ตรวจรับ","S12","กบค.","กบค. ใส่ผลทดสอบน้ำมันไฮดรอลิกตอนปิดงานได้ (ถ้ามี) หรือเพิ่มภายหลังในหน้ารายละเอียดงานรายคัน ผ่านหรือไม่ผ่าน พร้อมแนบไฟล์ และแก้ผลภายหลังได้","ผลเก็บไว้ในข้อมูลรถคันนั้น และป้ายที่สถานะงานเปลี่ยนตามผล","7.3.3","มีใน flow แล้ว","4 พ.ย. 2569 เลิก popup ใส่ผลในขั้นงาน · ผ่าน/ไม่ผ่าน (Q21)"],["UC-MT-45","5 ตรวจรับ","S12","กบค.","กบค. ใส่คำแนะนำเพิ่มเติมได้เมื่อผลตรวจน้ำมันไม่ผ่าน","ผลที่ไม่ผ่านมีคำแนะนำแสดงให้เจ้าของรถ","7.3.3","ยังไม่มี",""],["UC-MT-46","5 ตรวจรับ","S12","ระบบ","ระบบแจ้งเจ้าของรถเรื่องผลตรวจน้ำมันได้","เจ้าของรถได้รับแจ้งเมื่อบันทึกผล","7.3.3","ขัดกับที่เคาะ","3 พ.ย. 2569 เจ้าของงาน ไม่ผ่านก็ใส่ผลไว้ในข้อมูลรถ ยังไม่แจ้งเจ้าของรถ"],["UC-MT-81","5 ตรวจรับ","S12","กบค.","กบค. เห็นได้ว่ารถคันไหนรอผลตรวจน้ำมัน หรือผลไม่ผ่าน จากป้ายที่สถานะงานในหน้ารายละเอียดแผนเดินทาง","คันที่เก็บตัวอย่างแต่ยังไม่มีผลขึ้น รอผลตรวจน้ำมัน · ผลไม่ผ่านขึ้น น้ำมันไม่ผ่าน","7.3.3","มีใน flow แล้ว","4 พ.ย. 2569 เจ้าของงานเลือกป้ายที่สถานะงาน"],["UC-MT-82","5 ตรวจรับ","—","กบค.","กบค. เห็นป้ายรอผลตรวจน้ำมันที่ข้อมูลรถรายคันได้","หน้าข้อมูลรถบอกว่าคันนั้นรอผลตรวจน้ำมัน","7.3.3","ยังไม่มี","หน้าข้อมูลรถอยู่ระบบเดิม (Vehicle Management) ทำทีหลัง (Q51)"],["UC-MT-47","5 ตรวจรับ","S13","หน่วยงานเจ้าของรถ","หน่วยงานเจ้าของรถ ดูผลตรวจบำรุงรายคันและยอมรับผลได้","คันนั้นมีสถานะหน่วยงานยอมรับแล้ว","7.3.3","มีใน flow แล้ว","ไม่ยอมรับได้ไหม (Q23)"],["UC-MT-48","5 ตรวจรับ","S14","หน่วยงานเจ้าของรถ","หน่วยงานเจ้าของรถ ดูหลักฐานทั้งแผน ประเมินความพึงพอใจ และยอมรับผลทั้งแผนได้","แผนมีสถานะยอมรับครบ และ กบค. ส่งประวัติได้","7.3.3","มีใน flow แล้ว","ยอมรับ 2 รอบจำเป็นไหม (Q28)"],["UC-MT-49","5 ตรวจรับ","—","กบค.","กบค. บันทึก Safety Inspection ของรถเครนและกระเช้าตามรอบปีหรือตามกฎหมายได้","รถเครนหรือกระเช้ามีผล Safety ของรอบนั้น","7.3.3","ยังไม่มี","JO เขียนว่าบังคับ"],["UC-MT-50","5 ตรวจรับ","—","ระบบ","ระบบเตือนได้เมื่อรถเครนหรือกระเช้าใกล้ครบรอบ Safety Inspection","กบค. ได้รับแจ้งก่อนครบรอบ","7.3.3","ยังไม่มี",""],["UC-MT-51","6 รายงาน ต้นทุน ภาพรวม","S15","กบค.","กบค. ดูความคืบหน้ารายคัน และส่งประวัติให้หัวหน้า กบค. ตรวจได้สำเร็จ","ส่งได้เมื่อทุกคันมีผล และสถานะเป็นรอหัวหน้าตรวจสอบ","7.3.3","มีใน flow แล้ว","คันที่ทำไม่ได้นับว่าเสร็จไหม (Q24)"],["UC-MT-52","6 รายงาน ต้นทุน ภาพรวม","S16","หัวหน้า กบค.","หัวหน้า กบค. ตรวจประวัติงานบำรุงรักษาของแผนแล้วให้ผ่านได้","สถานะแผนเป็นประวัติผ่านแล้ว และ กบค. ออกรายงานได้","7.3.3","มีใน flow แล้ว",""],["UC-MT-80","6 รายงาน ต้นทุน ภาพรวม","S16","หัวหน้า กบค.","หัวหน้า กบค. ตีกลับประวัติงานพร้อมเหตุผลได้","กบค. เห็นเหตุผล แก้ประวัติแล้วส่งใหม่ได้","7.3.3","มีใน flow แล้ว",""],["UC-MT-53","6 รายงาน ต้นทุน ภาพรวม","S17","กบค.","กบค. ออกรายงานผลการบำรุงรักษาตามแบบฟอร์มที่ กฟภ. กำหนด และดาวน์โหลดได้","ได้ไฟล์รายงานของแผนนั้น","7.3.3","มีบางส่วน","หัวข้อและรูปแบบไฟล์ (Q25)"],["UC-MT-54","6 รายงาน ต้นทุน ภาพรวม","S17","กบค.","กบค. ปิดงานแผนได้สำเร็จ","แผนมีสถานะปิดงานแล้ว","—","มีใน flow แล้ว",""],["UC-MT-55","6 รายงาน ต้นทุน ภาพรวม","S18","กบค.","กบค. ดูต้นทุนค่าแรง ที่พัก เดินทาง และสรุปรวมของแผนได้","ยอดรวมตรงกับที่กรอกไว้ในแผนเดินทาง","7.3.3","มีบางส่วน","ยังไม่มีค่าอะไหล่ (Q26)"],["UC-MT-56","6 รายงาน ต้นทุน ภาพรวม","S18","กบค.","กบค. ดาวน์โหลดต้นทุนเป็นไฟล์ Excel ได้","ได้ไฟล์ Excel ของแผนนั้น","7.3.3","มีใน flow แล้ว",""],["UC-MT-57","6 รายงาน ต้นทุน ภาพรวม","—","กบค. ผู้บริหาร","กบค. และผู้บริหาร ดู Dashboard ภาพรวมงานบำรุงรักษาได้","เห็นจำนวนแผน รถ งานที่เสร็จ และต้นทุนรวม","7.3.3","ยังไม่มี",""],["UC-MT-58","6 รายงาน ต้นทุน ภาพรวม","—","ผู้ใช้","ผู้ใช้ ค้นหาและกรองรถตามทะเบียน รหัสรถ รหัสทรัพย์สิน ยี่ห้อรุ่น ประเภท สังกัด เลขตัวถัง และเครื่องมือกลได้","ผลค้นหาตรงกับเงื่อนไขทุกช่องที่กรอก","7.3.3","มีบางส่วน","ตอนนี้กรองได้แค่ภาค เขต และประเภทรถ"],["UC-MT-59","6 รายงาน ต้นทุน ภาพรวม","—","ผู้ใช้","ผู้ใช้ ส่งออกข้อมูลเป็นไฟล์ PDF ได้","ได้ไฟล์ PDF ของข้อมูลที่เลือก","7.3.3","ยังไม่มี","Excel มีแล้วที่ต้นทุน"]]},"scenarios":{"src":"Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md","title":"บำรุงรักษาตามวาระ — userflow 21 scenario (4 พ.ย. แยกมุมผู้รับจ้างจาก S10 เป็น S23 เลขชั่วคราว · ร่าง 19 ต.ค. 2569 · 30 ต.ค. แผนปี + จัดรถรายไตรมาส · อนุมัติทั่วไป · S3 ตัดออก (2 พ.ย.) · เพิ่ม S19 แก้ไขแผน S20 ลบแผน · 2 พ.ย. เลือกภาค เขต ประเภทรถ แล้วค้นรถแบบ Overhaul · เพิ่ม S21 อะไหล่ของรถแต่ละคัน · 3 พ.ย. S7 อนุมัติแผนเดินทาง · S8 แจ้งเตือน กรย. และเจ้าของรถ · S9 เดิมตัดออก แทนด้วย S9 แผนเดินทางจ้างดำเนินการ · เส้นว่าจ้างแยกเป็น scenario ใหม่ · S10 มุมผู้รับจ้าง ส่งตรวจงาน และอะไหล่ส่งคืนเมื่อบำรุงรักษาไม่ได้ · S11 กบค. ตรวจรับงานรายคันของผู้รับจ้าง)","sections":[{"h":"0. ภาพรวม — scenario × ช่วงงาน × บทบาท","head":["#","scenario","ช่วงงาน (คอลัมน์บอร์ด)","บทบาท","กล่องบนบอร์ดที่ใช้"],"rows":[["S1","กบค. สร้างแผนบำรุงรักษาประจำปี และจัดรถลงไตรมาส","เตรียมดำเนินการ","กบค.","สร้างแผนบำรุงรักษา · (30 ต.ค.) เลือกปีงบประมาณได้ทุกปี · จัดรถลงไตรมาส 1 ถึง 4 · ส่งอนุมัติ"],["S2","ผู้อนุมัติ ตรวจสอบและอนุมัติแผนบำรุงรักษา","เตรียมดำเนินการ","ผู้อนุมัติ (สายอนุมัติทั่วไป · 30 ต.ค. ไม่ผ่าน ผพจ.)","ตรวจสอบแผน · อนุมัติ? · ระบุเหตุผล · แผนของ กบค. ไม่ถูกต้อง → กบค. จัดการแก้ไข"],["~~S3~~","~~ผพจ. ออกเลขงานและจัดซื้ออะไหล่~~ ⏸ พักไว้ 30 ต.ค. 2569 · ✂ ตัดออก 2 พ.ย. 2569 (เจ้าของงาน _\"s3 ตัดออก\"_) ย้ายไป 14-…-พักไว้-S3.md","—","—","—"],["S4","กบค. ติดตามความคืบหน้าและเบิกอะไหล่ของไตรมาส","เบิก จัดหาอะไหล่","กบค.","เจ้าของงาน 2 พ.ย. 2569 · แทนตรวจจำนวนรถ · รวม S5 เดิม · ต้องเบิกเทียบคงเหลือ Smart Inventory · สถานะการเบิกรายรายการ"],["~~S5~~","~~กบค. ตรวจสอบและเบิกอะไหล่ผ่านระบบจองอะไหล่~~ ✂ รวมเข้า S4 2 พ.ย. 2569 (เจ้าของงาน _\"รวบ s4 s5 เป็นหน้าเดียวกัน ยุบ S5 ออกไปก่อนเลย\"_) เนื้อหาเดิมอยู่ 14-…-พักไว้-S3.md","—","—","—"],["S6","กบค. ทำแผนเดินทาง (ตรวจเอง)","จ้างดำเนินการ","กบค.","ทำแผนเดินทาง · กบค. ระบุข้อมูล (ชื่อแผนเดินทาง · พนักงาน 2-3 คน · เบี้ยเลี้ยง · ที่พัก · เดินทาง · เพิ่มรถ · สถานที่รายคัน · ช่วงวัน) · ส่งอนุมัติ (S7) · ถูกส่งกลับแล้วแก้ไขส่งใหม่"],["S7","ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง","จ้างดำเนินการ","ผู้อนุมัติตามสายงาน","เจ้าของงาน 3 พ.ย. 2569 · แทน S7 ผู้รับจ้างทำแผนเดินทางเดิม · ผลการพิจารณาแบบ S2 (อนุมัติ / ส่งกลับแก้ไข + เหตุผล)"],["S8","กรย. และหน่วยงานเจ้าของรถ ได้รับแจ้งเตือนแผนเดินทาง","จ้างดำเนินการ","กรย. · หน่วยงานเจ้าของรถ","เจ้าของงาน 3 พ.ย. 2569 · แทน S8 กบค. ตรวจแผนผู้รับจ้างเดิม · แจ้งเตือนหลังอนุมัติ · เปิดดูแผนเดินทางแบบอ่านอย่างเดียว"],["S9","กบค. สร้างแผนเดินทางจ้างดำเนินการ (vendor)","จ้างดำเนินการ","กบค.","เจ้าของงาน 3 พ.ย. 2569 · แทน S9 เดิม (กรย. เตรียมอะไหล่ ตัดออก ย้ายไป 14-…-พักไว้-S3.md) · ฟอร์มเดียวกับ S6 เลือก \"จ้างดำเนินการ\" แล้วเลือกผู้รับจ้างจาก vendor list · ผ่าน S7 และ S8"],["S10","กบค. บันทึกงานบำรุงรักษารายคัน","ดำเนินการบำรุงรักษา","กบค.","หน้ารายละเอียดแผนเดินทาง (สถานะงานรายคัน) · เลือกรถทีละคัน · เริ่มงาน (ภาพก่อน) · ปิดงาน (งานและอะไหล่จำนวนจริง · ภาพหลัง · เลขไมล์ · เก็บตัวอย่างน้ำมัน) · บำรุงรักษาไม่ได้ (สาเหตุ + อะไหล่ส่งคืน) · ทำคันอื่นต่อ · แผนที่ กบค. ดำเนินการเอง จบที่ S10 ไม่ต้องส่งตรวจ · (4 พ.ย.) มุมผู้รับจ้างแยกไป S23"],["S11","กบค. ตรวจรับงานรายคันของผู้รับจ้างและรับคืนอะไหล่","ตรวจรับ","กบค.","ตรวจสอบข้อมูลที่ได้รับจากผู้รับจ้าง · ผ่าน? · รับคืนอะไหล่/น้ำมันที่ไม่ได้ใช้ · (3 พ.ย.) ผลการพิจารณาแบบ S2 อนุมัติ / ส่งกลับแก้ไข + เหตุผล · ตรวจทั้งคันที่ปิดงานและคันที่แจ้งบำรุงรักษาไม่ได้"],["S12","กบค. บันทึกผลตรวจน้ำมันไฮโดรลิก","ตรวจรับ","กบค.","เมนู … ของรถที่เก็บตัวอย่าง · ผลการทดสอบ ผ่าน/ไม่ผ่าน + แนบไฟล์ (ถ้ามี) · เก็บผลในข้อมูลรถ แก้ได้ภายหลัง · ยังไม่แจ้งเจ้าของรถ"],["S13","หน่วยงาน/เจ้าของรถ ยอมรับผลการตรวจบำรุงรถรายคัน","ตรวจรับ","หน่วยงาน / เจ้าของรถ","ได้รับการแจ้งเตือนทาง e-mail และ VMS+ · กดยอมรับผลการตรวจบำรุงรถ · แสดงรายการการตรวจบำรุงรถที่รอตรวจสอบ · ใบตรวจสภาพอะไหล่ · ใบตรวจสภาพงานบำรุงรักษา · ปุ่มยอมรับผล"],["S14","หน่วยงาน/เจ้าของรถ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)","ตรวจรับ","หน่วยงาน / เจ้าของรถ","บำรุงรักษาครบทุกคันตามแผนหรือไม่? · ได้รับการแจ้งเตือน · ตรวจสอบเอกสารหลักฐานการตรวจบำรุงรถ · ประเมินความพึงพอใจ (ต้องทำทุกครั้ง?) · กดยอมรับผลการตรวจบำรุงรถ"],["S15","กบค. บันทึกและส่งประวัติงานบำรุงรักษา","จัดทำรายงานการบำรุงรักษา","กบค.","บำรุงรักษาเสร็จทั้งหมดหรือไม่? · บันทึกประวัติ · ส่งประวัติ · แสดงข้อมูลประวัติงานบำรุงรักษาทั้งหมด"],["S16","หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา","จัดทำรายงานการบำรุงรักษา","หัวหน้า กบค.","หัวหน้า กบค. ตรวจสอบประวัติ · ผ่านหรือไม่? · บันทึกประวัติ · (ไม่ผ่าน) กบค. จัดการแก้ไข"],["S17","กบค. ออกรายงานผลและปิดงาน","จัดทำรายงานการบำรุงรักษา","กบค.","รายงานผลการบำรุงรักษา (Download ได้) · ปิดงาน"],["S18","กบค. คำนวณต้นทุนการบำรุงรักษา","คำนวณต้นทุน","กบค.","คำนวณต้นทุน (ค่าแรง · ที่พัก · เดินทาง) · Download Excel · Summary ต้นทุน"],["S19","กบค. แก้ไขแผนบำรุงรักษา แล้วส่งอนุมัติใหม่","เตรียมดำเนินการ","กบค.","เจ้าของงานเพิ่ม 30 ต.ค. 2569 · แก้ได้ก่อนเริ่มงาน แล้วกลับไปอนุมัติที่ S2"],["S20","กบค. ลบแผนบำรุงรักษาที่ยังไม่อนุมัติ","เตรียมดำเนินการ","กบค.","เจ้าของงานเพิ่ม 30 ต.ค. 2569 · ไม่มียกเลิกแผน"],["S21","กบค. กำหนดอะไหล่ของรถแต่ละคันในแผน","เตรียมดำเนินการ","กบค.","เจ้าของงานเพิ่ม 2 พ.ย. 2569 · ทำระหว่าง S1 หรือ S19"],["S22","กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส","เบิก จัดหาอะไหล่","กบค. คลัง","เจ้าของงานเพิ่ม 2 พ.ย. 2569 · ต่อจาก S2 อนุมัติ ก่อน S4"],["S23","ผู้รับจ้าง บันทึกงานรายคันและส่งตรวจงาน","ดำเนินการบำรุงรักษา","ผู้รับจ้าง","เจ้าของงานแยกจาก S10 4 พ.ย. 2569 (เลขชั่วคราว รอจัดเรียงใหม่) · แผนเดินทางจ้างดำเนินการ · เห็นเฉพาะรถในใบ ไม่มีแก้ไข ลบ รถในแผนและอะไหล่ตามแผน · เริ่มงาน ปิดงาน บำรุงรักษาไม่ได้ ใช้หน้าเดียวกับ S10 · แก้ไข ลบ อะไหล่ที่ใช้จริง อะไหล่ส่งคืน และภาพ · กด \"ส่งตรวจงาน\" รายคัน ไป S11"]],"note":"ทางเข้าเมนู (เจ้าของงาน 4 พ.ย. 2569): _\"ทางเข้าหน้า เป็น url = maintenance-utility-vehicle เป็นเมนูจาก sidebar กดแล้ว expand ออกมา\"_ ⇒ Sidebar navigation (Expanded) กลุ่ม \"งานซ่อมและบำรุงรักษา\" (กดแล้วกางเมนูย่อย ตามหน้า Sidebar Navigation ของ UI Release#2) → เมนูย่อย \"บำรุงรักษาตามวาระ\" → /maintenance-utility-vehicle = หน้ารายการแผน (S1) ลำดับหลัก (30 ต.ค. 2569 · S21 ทำระหว่าง S1 และ S19): S1 → S2 (ส่งกลับหรือแก้ไข S19 แล้วกลับ S2 · ลบก่อนอนุมัติ S20) → S22 ส่งรายการอะไหล่รายไตรมาสให้ กบค. คลังรับทราบ (2 พ.ย.) → แล้วทำรายไตรมาส: S4 ความคืบหน้าและเบิกอะไหล่ → แผนเดินทาง (S6 กบค. ดำเนินการเอง | S9 จ้างดำเนินการ เลือกในฟอร์มเดียวกัน) → S7 ผู้อนุมัติอนุมัติแผนเดินทาง (ส่งกลับ แก้ที่ฟอร์มแผนเดินทางแล้วส่งใหม่) → S8 แจ้งเตือน กรย. และหน่วยงานเจ้าของรถ → S10 (ดำเนินการเอง) | S23 ผู้รับจ้างบันทึกงานและส่งตรวจงาน → S11 กบค. ตรวจรับ (จ้างดำเนินการ) → S12 → S13 → S14 → S15 → S16 → S17 → S18 · S3 ตัดออก · S5 รวมเข้า S4 · S9 เดิมตัดออก แทนด้วยแผนจ้างดำเนินการ (3 พ.ย.) · ติดตามและ approve งานผู้รับจ้างรายคันอยู่ที่ S11 (หัวข้อ 2.1)"},{"h":"1. Permission (ตามเลนบอร์ด · [เสนอ] ทั้งตาราง — บอร์ดนี้ไม่มีกล่อง Permission)","head":["บทบาท","ดู","แก้ไข/กด"],"rows":[["กบค.","ทุกหน้าในเรื่องนี้","S1 · S4 · S6 · S9 · S10 · S11 · S12 · S15 · S17 · S18 · S19 · S20 · S21"],["ผู้อนุมัติ (สายอนุมัติทั่วไป)","แผนและแผนเดินทางที่ส่งมาให้อนุมัติ","S2 · S7 · (ผพจ. / หัวหน้า ผพจ. ไม่อยู่ในเส้นแล้ว 30 ต.ค. — S3 พักไว้)"],["กบค. คลัง","รายการอะไหล่รายไตรมาสของแผนที่อนุมัติแล้ว","S22 (กดรับทราบ)"],["กรย.","แผนเดินทางที่อนุมัติแล้วซึ่งมีรถในเขตตน (ดูอย่างเดียว)","— (S8 ดูอย่างเดียว)"],["ผู้รับจ้าง","เฉพาะรถที่ กบค. เลือกให้ในแผนเดินทางจ้างดำเนินการ (S9)","S23 (บันทึกงานรายคัน · ส่งตรวจงาน · แก้ไขเมื่อถูกส่งกลับ) · ไม่มีแก้ไข ลบ รถในแผนเดินทาง และอะไหล่ตามแผน (4 พ.ย. 2569)"],["หน่วยงาน / เจ้าของรถ","เฉพาะรถของตน (แผนเดินทางที่อนุมัติแล้ว ดูอย่างเดียวที่ S8)","S13 · S14"],["หัวหน้า กบค.","ประวัติงานที่ส่งมา","S16"]],"note":""},{"h":"2. Scenario","head":["ส่วน","เงื่อนไข","ที่มา"],"rows":[["ชื่อแผน","Freetext · บังคับ · ความยาว (ยังไม่รู้) · error \"กรุณาระบุชื่อแผน\"","เสนอ"],["ปีงบประมาณ","dropdown select · บังคับ · ไม่ตั้งค่าไว้ให้ · เลือกได้ทุกปี ไม่จำกัดว่าต้องเป็นปีหน้า · error \"กรุณาเลือกปีงบประมาณ\" · ปีเดียวกันมีหลายแผนได้ · รายการปีที่แสดง (ยังไม่รู้ — Q31)","เจ้าของงาน 30 ต.ค. + เสนอ"],["ภาค","dropdown เลือกได้หลายค่า (Input dropdown with badges) · บังคับ · เลือกก่อนจึงเลือกเขตได้ · ค่าที่เลือกเป็นชิปในช่อง · เอาภาคออกแล้วเขตของภาคนั้นออกด้วย และถ้ามีรถของภาคนั้นจัดไว้ มี confirm ก่อนเอารถออก · error \"กรุณาเลือกภาค\"","เจ้าของงาน 22 ต.ค. + 2 พ.ย."],["เขต","dropdown เลือกได้หลายค่า · บังคับ · ก่อนเลือกภาคเป็น Disabled · รายการเฉพาะเขตภายใต้ภาคที่เลือก ค่าย่อเช่น กฟฉ.1 · placeholder \"เลือกเขต\" · error \"กรุณาเลือกเขต\" · รายการรถแสดงรถของทุกเขตที่เลือก · เอาเขตออกแล้วรถของเขตนั้นที่จัดไว้ออกจากแผนหลัง confirm \"รถของ {เขต} ที่จัดไว้ {n} คัน จะถูกเอาออกจากทุกไตรมาส\"","เจ้าของงาน 2 พ.ย."],["ประเภทรถ","dropdown เลือกได้หลายค่า · บังคับ · ก่อนเลือกเขตเป็น Disabled · ตัวเลือกมาจากประเภทในทะเบียนรถ (ยังไม่รู้ว่าชุดไหน — Q29) · เอาประเภทออกแล้วถามยืนยันแบบเดียวกับเขต · error \"กรุณาเลือกประเภทรถ\"","เจ้าของงาน 22 ต.ค. + 2 พ.ย."],["แท็บไตรมาส","4 แท็บ ไตรมาส 1 ถึง 4 ของปีงบประมาณที่เลือก (ไตรมาส 1 = ต.ค. ถึง ธ.ค. ของปีก่อนหน้า) · ป้ายจำนวนรถบนแท็บ · เปิดแท็บไตรมาส 1 เป็นค่าเริ่มต้น","เจ้าของงาน 30 ต.ค. + ต้นแบบ ส.ค."],["เลือกรถ","ช่องค้นหา \"ค้นหาทะเบียน, จังหวัด\" แบบเดียวกับ Overhaul · เลือกภาค เขต และประเภทรถครบแล้วจึงแสดงแท็บไตรมาสและช่องนี้ ก่อนหน้านั้นแสดง Empty state \"เลือกภาค เขต และประเภทรถเพื่อแสดงรายการรถในเขต\" · รายการแถวละทะเบียนกับจังหวัด คันที่เลือกแล้วอยู่ในสถานะ Selected · ไม่มีรถเข้าเงื่อนไข = \"ไม่มีรถที่ตรงกับเขตและประเภทรถที่เลือก\" · ค่าเริ่มต้นยังไม่เลือก","เจ้าของงาน 2 พ.ย. + เสนอ"],["รถที่เลือกแล้ว","แสดงใน section รถในไตรมาส n เฉพาะรถของไตรมาสที่แท็บเปิดอยู่ ไม่มีชิปใต้ช่องเลือกรถ · เอาออกด้วยไอคอนลบที่แถวรถ หรือกดคันที่ติ๊กไว้ในรายการเลือกรถอีกครั้ง · อะไหล่ที่เลือกไว้ของคันนั้น (ยังไม่รู้ — Q38) · ป้ายหัวข้อบอกจำนวนรถทั้งแผน","เจ้าของงาน 2 พ.ย."],["1 คัน 1 ไตรมาส","รถคันหนึ่งอยู่ได้ไตรมาสเดียวในแผนนี้ · เลือกในแท็บอื่นแล้วรถย้ายไตรมาส · รายการในช่องเลือกรถบอกไตรมาสของทุกคันที่จัดแล้ว ด้วย \"ไตรมาส n\" ต่อท้ายทะเบียน","เจ้าของงาน 17 ส.ค. (ต้นแบบเดิม) + 2 พ.ย."],["จัดครบ","ต้องมีรถในแผนอย่างน้อย 1 คัน error \"กรุณาเลือกรถเข้าแผนอย่างน้อย 1 คัน\" · ไตรมาสที่ไม่มีรถได้ · คันที่ไม่ได้เลือกในแท็บใดเลยไม่อยู่ในแผน","เสนอ"],["รถในไตรมาส","แสดงเมื่อเลือกภาค เขต และประเภทรถครบ · หัวข้อเปลี่ยนตามแท็บ · แสดงเฉพาะรถของไตรมาสนั้น · ยังไม่มีรถ = Empty state \"ยังไม่มีรถในไตรมาสนี้ — ค้นทะเบียนในช่องเลือกรถเพื่อเพิ่มรถเข้าไตรมาสนี้\" · ระบบไม่คำนวณหรือแนะนำอะไหล่ · ยังไม่เลือกอะไหล่แสดง \"ยังไม่เลือก\" · กดไอคอนแก้ไขที่แถวรถ ไปหน้า S21 ของคันนั้น","เจ้าของงาน 2 พ.ย."],["อะไหล่ในไตรมาส","หัวข้อเปลี่ยนตามแท็บไตรมาส · รวมอะไหล่ที่ กบค. เลือกของรถในไตรมาสนั้น รวมรายการที่ระบุเอง · ปุ่ม \"เพิ่มอะไหล่\" แสดงตลอด กดได้เมื่อไตรมาสนั้นมีรถ · ไม่มีรถ = Empty state \"เลือกรถเข้าไตรมาสนี้ก่อน แล้วจึงเพิ่มอะไหล่ได้\" · มีรถแต่ยังไม่เลือก = Empty state \"กดเพิ่มอะไหล่เพื่อเลือกอะไหล่ของรถในไตรมาสนี้\" · ไม่บังคับเลือกก่อนส่งอนุมัติ · ท้ายแถวมีไอคอนแก้ไข (ไปหน้า S21 ของรถที่ใช้อะไหล่นั้น) และไอคอนลบ (confirm \"ยืนยันการเอาอะไหล่ออก — {อะไหล่} จะถูกเอาออกจากรถทุกคันในไตรมาส {n}\" ปุ่ม ยกเลิก · เอาออก)","เจ้าของงาน 2 พ.ย."],["ปุ่มย้อนกลับ","มีการแก้ไข มี confirm modal \"ยืนยันการออก — ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก\" · ไม่มีการแก้ไข ไม่มี CF modal","เสนอ (ตามแบบ Overhaul)"],["เลขที่ MR (Maintenance Request)","ระบบออกให้ตอนบันทึกแผน ผู้ใช้ไม่ได้กรอก · รูปแบบ \"MR Z69000XX\" (เจ้าของงาน 30 ต.ค. 2569) · Z = เขตของการไฟฟ้าที่สร้างแผน (Z = สำนักงานใหญ่ ซึ่งเป็นที่ตั้ง กบค.) · 69 = ปีงบประมาณที่เลือกตอนสร้างแผน · ลำดับ 5 หลัก นับต่อกันภายในปีที่เลือก เช่น เลือกปี 70 สร้างไปแล้ว 2 แผน แผนที่ 3 ของปี 70 = MR Z7000003 · สร้างแผนปี 71 ครั้งแรก = MR Z7100001","เจ้าของงาน 30 ต.ค."],["บันทึกและส่งอนุมัติ","สำเร็จ → สถานะ \"รออนุมัติ\" · กลับหน้ารายการ · toast \"ส่งแผนบำรุงรักษาเพื่ออนุมัติสำเร็จ\" · ไม่สำเร็จ toast general error · ผู้อนุมัติ (ยังไม่รู้ — Q32)","เจ้าของงาน 30 ต.ค. + เสนอ"],["~~ไตรมาส ช่องเดียว~~","เปลี่ยนเป็นแท็บจัดรถรายไตรมาส 30 ต.ค. 2569","เจ้าของงาน"],["~~เกณฑ์เลือกรถ ทรัค/เนต~~","ตัดออก 22 ต.ค. 2569 — แทนด้วยภาค + ประเภทรถ","เจ้าของงาน"],["ส่วน","เงื่อนไข","ที่มา"],["ผู้อนุมัติ","สายอนุมัติทั่วไป ไม่ใช่ ผพจ. · ใครและกี่ชั้น (ยังไม่รู้ — Q32)","เจ้าของงาน 30 ต.ค."],["รถในแผน","Section label \"รถในแผน (n)\" + แท็บไตรมาส 1 ถึง 4 (จำนวนรถบนแท็บ) + ตาราง ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · น้ำมันไฮดรอลิก · เปลี่ยนล่าสุด · อะไหล่ (จำนวนรายการ หรือ ยังไม่เลือก) · ดูอย่างเดียว ไม่มีไอคอน","เจ้าของงาน 2 พ.ย."],["ผลการพิจารณา","Radio text card 2 ใบ สูงเท่ากัน · อนุมัติ (บรรทัดรอง \"แผนผ่านการตรวจสอบ กบค. เริ่มงานรายไตรมาสได้\") เลือกไว้เป็นค่าเริ่มต้น · ส่งกลับแก้ไข (บรรทัดรอง \"แจ้งเหตุผลให้ กบค. แก้ไขแผนแล้วส่งใหม่\")","เจ้าของงาน 2 พ.ย."],["เหตุผลที่ส่งกลับ","Text area แสดงเมื่อเลือกส่งกลับแก้ไข · บังคับ · placeholder \"ระบุเหตุผลที่ส่งกลับ\" · ไม่กรอก = error \"กรุณาระบุเหตุผลที่ส่งกลับ\"","บอร์ด \"ระบุเหตุผล\" + เจ้าของงาน 2 พ.ย."],["ปุ่ม","ย้อนกลับ · ยืนยันผลการพิจารณา → confirm ตามผลที่เลือก: อนุมัติ \"ยืนยันอนุมัติแผนบำรุงรักษา\" ปุ่ม อนุมัติ · ส่งกลับ \"ยืนยันส่งกลับแก้ไข — แผนจะกลับไปให้ กบค. แก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่\" ปุ่ม ส่งกลับ","เจ้าของงาน 2 พ.ย. + เสนอ"],["ส่งกลับ","แผนกลับสถานะ \"ส่งกลับแก้ไข\" · กบค. เห็นเหตุผล แล้วแก้ที่ S19 ส่งใหม่","บอร์ด \"กบค. จัดการแก้ไข\""],["อนุมัติ","มี confirm modal · สถานะเป็น \"อนุมัติแล้ว\" · toast \"อนุมัติแผนบำรุงรักษาสำเร็จ\" · หลังจากนี้ กบค. ทำงานรายไตรมาสได้ (S4)","เสนอ"],["ส่วน","เงื่อนไข","ที่มา"],["ขอบเขต","เฉพาะไตรมาสที่กำลังทำ · จำนวนต้องเบิกมาจากอะไหล่ที่ กบค. เลือกให้รถของไตรมาสนั้น (S1 S21)","เจ้าของงาน 2 พ.ย."],["คงเหลือ Smart Inventory","Display ดึงจาก Smart Inventory · ไม่พอ = ต้องเบิก ลบ คงเหลือ · เชื่อมไม่ได้ = แถบ error \"เชื่อมต่อ Smart Inventory ไม่ได้\" คงเหลือแสดง \"-\" ปุ่มเบิกกดไม่ได้","เจ้าของงาน 2 พ.ย. + เสนอ"],["สถานะการเบิก","รายรายการ รอเบิก (Gray) → จองแล้ว (Info) หรือ รอจัดซื้อ (Warning) เมื่อคงเหลือไม่พอ → เบิกแล้ว (Success)","เจ้าของงาน 2 พ.ย. + เสนอ"],["เบิก/จอง","ปุ่ม \"เบิก/จองอะไหล่\" → modal สรุปรายการ (เบิกจากคลัง · รอจัดซื้อ) → ยืนยัน · ไม่มีอะไหล่ในแผน = ปุ่มกดไม่ได้ เพิ่มอะไหล่ที่แก้ไขแผน","เสนอ"],["~~รูปแบบดำเนินการ~~","ถอดออก 3 พ.ย. 2569 (เจ้าของงาน \"ถอดออกจาก S4 ตามที่เสนอ\") ย้ายไปเลือกในฟอร์มแผนเดินทาง ไตรมาสเดียวมีทั้งแผนที่ กบค. ดำเนินการเองและแผนจ้างดำเนินการได้","เจ้าของงาน 3 พ.ย."],["ไปทำแผนเดินทาง","กดได้เมื่อเบิกครบทุกรายการ · กดแล้วไปหน้าแผนเดินทางของไตรมาส (S6 หน้าแรก) · ข้อความเมื่อเบิกครบ \"เบิกอะไหล่ครบแล้ว\" บรรทัดรอง \"เบิกจาก Smart Inventory n รายการ · ไปทำแผนเดินทางของไตรมาสได้\"","บอร์ด + เจ้าของงาน 3 พ.ย."],["~~ตรวจจำนวนรถ ความพร้อม นำรถออก~~","ตัดทิ้ง 2 พ.ย. 2569 (เจ้าของงาน)","—"],["ส่วน","เงื่อนไข","ที่มา"],["หน้าแผนเดินทาง ส่วนรถ","แสดงรถทุกคันของไตรมาสที่กำลังทำ ไม่ว่าจะอยู่ในแผนเดินทางแล้วหรือยัง · จำนวนคันต่อท้ายหัวข้อ \"รถในไตรมาส n\" · รถที่อยู่ในแผนเดินทางแล้ว คอลัมน์แผนเดินทางแสดงชื่อแผนเดินทางของใบนั้น และคอลัมน์ช่วงวันเดินทางแสดงช่วงวันของใบนั้น · รถที่ยังไม่อยู่ในใบใด แสดงป้าย \"ยังไม่มีแผนเดินทาง\" (สีเทา) และช่วงวันเป็นขีด · คอลัมน์เบอร์ติดต่อ รถที่อยู่ในแผนเดินทางแล้วแสดงเบอร์ของใบนั้น (แก้แล้วมีบรรทัดรอง \"แก้จากเบอร์เจ้าของรถ\") รถที่ยังไม่อยู่ในใบใดแสดงเบอร์เจ้าของรถ · ส่วนนี้ดูอย่างเดียว แก้เบอร์ทำในหน้าสร้างหรือแก้ไขแผนเดินทาง","เจ้าของงาน 3 พ.ย. (คอลัมน์เป็นข้อเสนอ · เบอร์ติดต่อเจ้าของงานขอ)"],["หน้าแผนเดินทาง ส่วนแผนเดินทาง","หัวข้อ \"แผนเดินทาง\" ต่อท้ายจำนวนใบ (มีทั้งใบที่ กบค. ดำเนินการเอง และใบจ้างดำเนินการ) และปุ่ม \"สร้างแผนเดินทาง\" · ยังไม่มีใบ แสดง \"ยังไม่มีแผนเดินทาง\" และ \"สร้างแผนเดินทางเพื่อนัดวันเข้าตรวจ แจ้งเจ้าของรถและ กรย.\" พร้อมปุ่ม \"สร้างแผนเดินทาง\" · มีใบแล้ว แสดงตารางเรียงตามลำดับที่สร้าง คอลัมน์แรก \"ชื่อแผนเดินทาง\" แสดงชื่อที่ตั้งตอนสร้าง บรรทัดรองบอกจำนวนสถานที่ (และจำนวนคันที่ใช้สำนักงานเจ้าของรถ) · ช่วงวัน · รถ (คัน) · ผู้ดำเนินการ (\"กบค. (ดำเนินการเอง)\" หรือชื่อผู้รับจ้าง) · สถานะ \"ส่งแจ้งแล้ว\" · ไอคอนไปหน้ารายละเอียดของใบ (ใบที่อนุมัติแล้วไปหน้ารายละเอียดแผนเดินทางของ S10 ที่มีสถานะงานรายคัน)","เจ้าของงาน 3 พ.ย."],["รูปแบบดำเนินการ","อยู่แถวเดียวกับช่อง \"ชื่อแผนเดินทาง\" คนละครึ่ง (ชื่อแผนเดินทางซ้าย รูปแบบดำเนินการขวา) · ป้าย \"รูปแบบดำเนินการ\" · radio 2 ตัวเรียงแนวนอน \"กบค. ดำเนินการเอง\" เลือกไว้เป็นค่าเริ่มต้น · \"จ้างดำเนินการ\" · ไม่มีคำอธิบายใต้ตัวเลือก · เลือกจ้างดำเนินการแล้วฟอร์มเปลี่ยนเป็นแบบ S9 · บนมือถือ ชื่อแผนเดินทางเต็มแถว แล้วรูปแบบดำเนินการอยู่บรรทัดถัดลงมา radio 2 ตัวยังเรียงข้างกัน","เจ้าของงาน 3 พ.ย. (เปลี่ยนจากการ์ดเป็น radio แถวเดียวกัน)"],["ชื่อแผนเดินทาง","ช่อง \"ชื่อแผนเดินทาง\" อยู่บนสุดของฟอร์ม ใต้หัวข้อ \"ข้อมูลแผนเดินทาง\" · บังคับกรอก · ข้อความในช่องว่า \"ระบุชื่อแผนเดินทาง\" · ไม่มีค่าตั้งต้น · กดยืนยันโดยยังว่าง ขึ้น \"กรุณาระบุชื่อแผนเดินทาง\" ใต้ช่อง · ชื่อที่ตั้งแสดงในหน้าแผนเดินทางทั้งตารางรถ และตารางแผนเดินทาง","เจ้าของงาน 3 พ.ย. (บังคับกรอกและข้อความเป็นข้อเสนอ)"],["แผนเดินทางต่อไตรมาส","1 ไตรมาสมีแผนเดินทางได้หลายใบ · แต่ละใบมีรถต่างกัน · รถ 1 คันอยู่ได้ในแผนเดินทางใบเดียวของไตรมาสนั้น","เจ้าของงาน 3 พ.ย."],["เปิดหน้าสร้างแผนเดินทาง","ตาราง \"รถในแผนเดินทาง\" ยังว่าง แสดง \"ยังไม่มีรถในแผนเดินทาง\" และ \"กดเพิ่มรถเพื่อเลือกรถของไตรมาส n ที่ยังไม่อยู่ในแผนเดินทางใด\" · ปุ่ม \"เพิ่มรถ\" อยู่ที่หัวข้อ \"รถในแผนเดินทาง\" กดได้ทุกเมื่อ ทั้งตอนยังไม่มีรถและตอนมีรถแล้ว","เจ้าของงาน 3 พ.ย."],["popup เพิ่มรถ แสดงเมื่อ","กดปุ่ม \"เพิ่มรถ\" เท่านั้น · ไม่เปิดเองตอนเข้าหน้า","เจ้าของงาน 3 พ.ย."],["รถที่แสดงใน popup","รถทุกคันของไตรมาสที่กำลังทำ ยกเว้น (1) รถที่อยู่ในแผนเดินทางใบอื่นของไตรมาสเดียวกันที่ยืนยันแล้ว (2) รถที่อยู่ในตารางของแผนเดินทางใบนี้แล้ว · รถที่ยกเว้นไม่แสดงในรายการเลย (ไม่ใช่แสดงเป็นสีเทา) · คอลัมน์ ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ","เจ้าของงาน 3 พ.ย."],["บรรทัดรองของ popup","\"รถของไตรมาส n ที่ยังไม่อยู่ในแผนเดินทางใด\" · ถ้ามีรถที่อยู่ในแผนเดินทางใบอื่นแล้ว ต่อท้าย \" · อีก x คันอยู่ในแผนเดินทางอื่นแล้ว\" (x = จำนวนคันนั้น) · ไม่มีก็ไม่ต่อท้าย","เจ้าของงานเลือก 3 พ.ย. (ไม่แสดงแต่บอกจำนวน)"],["ค้นหาใน popup","ค้นจากทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · จับคำที่มีอยู่ในข้อความ · ค้นไม่พบใช้ Empty state ค้นไม่พบ (ยังไม่มีจอ)","เสนอ"],["ติ๊กเลือก","ติ๊กได้หลายคัน · ช่องติ๊กหัวตารางเลือกหรือเอาออกทุกคันที่แสดงอยู่ · หัวตารางเป็นติ๊กครึ่งเมื่อเลือกบางคัน","หน้า Select vehicles ของ UI Release#2"],["ปุ่มใน popup","\"ยกเลิก\" และปุ่มปิดมุมขวา ปิด popup โดยตารางในฟอร์มไม่เปลี่ยน · \"เพิ่มเข้าแผนเดินทาง (n)\" n = จำนวนคันที่ติ๊ก · กดไม่ได้เมื่อยังไม่ติ๊ก (ไม่แสดงวงเล็บ) · กดแล้วปิด popup รถที่ติ๊กต่อท้ายตาราง \"รถในแผนเดินทาง\"","เสนอ"],["ไม่มีรถให้เลือก","รถทุกคันของไตรมาสอยู่ในแผนเดินทางแล้ว ⇒ popup แสดง \"รถทุกคันของไตรมาส n อยู่ในแผนเดินทางแล้ว\" และ \"ไม่มีรถที่เพิ่มเข้าแผนเดินทางนี้ได้\" · ปุ่ม \"เพิ่มเข้าแผนเดินทาง\" กดไม่ได้","เสนอ"],["ตารางรถในแผนเดินทาง","ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · เบอร์ติดต่อ · สถานที่บำรุงรักษา · ไอคอนแก้ไข และลบ · จำนวนคันที่หัวข้อ","เจ้าของงาน 2 พ.ย. · เบอร์ติดต่อ 3 พ.ย."],["เบอร์ติดต่อ","รายคัน · ค่าเริ่มต้นเป็นเบอร์ของเจ้าของรถจากข้อมูลรถ ไม่มีบรรทัดรอง · แก้ได้ทีละคันจากไอคอนแก้ไข (popup เดียวกับสถานที่) · แก้แล้วบรรทัดรอง \"แก้จากเบอร์เจ้าของรถ\" · ไม่มีเบอร์ในข้อมูลรถ แสดง \"-\" (เสนอ)","เจ้าของงาน 3 พ.ย. + เสนอ (บรรทัดรอง)"],["popup แก้ไขรถในแผนเดินทาง","แสดงเมื่อกดไอคอนแก้ไขของแถวนั้น · หัว \"แก้ไขเบอร์ติดต่อและสถานที่ · {ทะเบียน}\" · ช่อง \"เบอร์ติดต่อ\" และ \"สถานที่บำรุงรักษา\" กรอกค่าปัจจุบันของแถวไว้ · ปุ่ม ยกเลิก (ปิดโดยค่าไม่เปลี่ยน) · บันทึก (ปิดแล้วค่าในแถวเปลี่ยนตาม)","เจ้าของงาน 3 พ.ย. + เสนอ (ชื่อหัว popup)"],["ลบรถออกจากตาราง","กดไอคอนลบ รถออกจากตารางทันที แล้วกลับไปแสดงใน popup เพิ่มรถให้เลือกได้อีก","เสนอ"],["รถไม่มีให้เลือกในแผนเดินทางถัดไป","เมื่อยืนยันการสร้างแผนเดินทางสำเร็จ รถทุกคันในใบนั้นไม่แสดงใน popup เพิ่มรถของแผนเดินทางใบถัดไปในไตรมาสเดียวกัน · รถของไตรมาสอื่นไม่เกี่ยว","เจ้าของงาน 3 พ.ย."],["สถานที่บำรุงรักษา","รายคัน · ค่าเริ่มต้น \"สำนักงาน {หน่วยงานเจ้าของรถ}\" · บรรทัดรอง \"ค่าเริ่มต้น สำนักงานที่รถอยู่\" · แก้ได้ทีละคันจากไอคอนแก้ไข (popup แก้ไขรถในแผนเดินทาง ข้างบน) · แก้แล้วบรรทัดรอง \"แก้จากสำนักงานเจ้าของรถ\"","เจ้าของงาน 2 พ.ย."],["วันที่เดินทาง","date range · ไม่สามารถเลือกน้อยกว่าวันนี้","บอร์ด \"เป็นช่วง\" + เสนอ"],["พนักงาน","search select · อย่างน้อย 2 ไม่เกิน 3 คน","บอร์ด \"จำนวน 2-3 คน\""],["~~ค่าเบี้ยเลี้ยง / ที่พัก / เดินทาง~~","ไม่กรอกในแผนเดินทางแล้ว ย้ายไปกรอกรายคันตอนปิดงาน (S10) พร้อมเลือกงบ · เดิม Text number (บาท) ไปรวมที่ S18","เจ้าของงาน 3 พ.ย. 2569 _\"ค่าที่พัก ค่าเดินทาง … จะมีให้กรอกอีกทีตอนปิดงาน โดยรายละเอียดเรื่องค่าใช้จ่ายของรถแต่ละคันจะกรอกแยกกัน\"_"],["ยืนยันโดยยังไม่มีรถ","แจ้ง \"กรุณาเพิ่มรถเข้าแผนเดินทางอย่างน้อย 1 คัน\" ที่หัวข้อรถในแผนเดินทาง พร้อมข้อความของช่องอื่นที่ยังไม่ครบ","เสนอ"],["ยืนยัน","สำเร็จ ⇒ แผนเดินทางสถานะ \"รออนุมัติ\" ส่งให้ผู้อนุมัติ (S7) · toast \"สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว\" · ยังไม่แจ้งเจ้าของรถและ กรย. จนกว่าจะอนุมัติ (S8) · รถในใบนี้นับว่าอยู่ในแผนเดินทางแล้วตั้งแต่ส่งอนุมัติ","เจ้าของงาน 3 พ.ย. (ย้ายแจ้งเตือนไปหลังอนุมัติ)"],["สถานะแผนเดินทาง","รออนุมัติ (สีเหลือง) · อนุมัติแล้ว (สีเขียว) · ส่งกลับแก้ไข (สีแดง) · แสดงที่คอลัมน์สถานะของตารางแผนเดินทาง","เสนอ ตามชื่อสถานะของแผน S2"],["ถูกส่งกลับแก้ไข","ใบที่ถูกส่งกลับ สถานะ \"ส่งกลับแก้ไข\" · เปิดใบนั้นแล้วเข้าหน้าแก้ไขแผนเดินทาง (ฟอร์มเดียวกับสร้าง ค่าเดิมกรอกไว้) · บนสุดมีกล่องแจ้ง \"ผู้อนุมัติส่งกลับให้แก้ไข\" พร้อมเหตุผลที่ผู้อนุมัติระบุ · ปุ่มท้ายหน้า \"ส่งอนุมัติใหม่\" · ส่งแล้วสถานะกลับเป็น \"รออนุมัติ\" · toast \"ส่งแผนเดินทางให้ผู้อนุมัติใหม่แล้ว\" · รถของใบที่ถูกส่งกลับยังไม่กลับไปให้ใบอื่นเลือก","เสนอ ตามแบบ S19 ของแผน"],["ส่วน","เงื่อนไข","ที่มา"],["ผู้อนุมัติ","ผู้บังคับบัญชาตามสายงานของ กบค. ผู้สร้างแผนเดินทาง ได้จาก API getUpperLower · ตำแหน่งและจำนวนชั้นยังไม่รู้ (Q45)","เจ้าของงาน 3 พ.ย."],["เข้าหน้า","แจ้งเตือน \"มีแผนเดินทางรออนุมัติ\" (ร่าง) หรือเมนูแผนเดินทางรออนุมัติ · รายการแสดงเฉพาะใบที่ส่งมาให้ผู้อนุมัติคนนี้","เสนอ"],["รายการ","คอลัมน์ ชื่อแผนเดินทาง (บรรทัดรอง เลขที่ MR และไตรมาส) · ช่วงวันเดินทาง · รถ (คัน) · ผู้สร้าง (กบค.) · วันที่ส่ง · สถานะ · ไอคอนเปิด · ค้นหาด้วยชื่อแผนเดินทาง หรือผู้สร้าง","เสนอ"],["รายละเอียด","กล่อง \"รายละเอียดแผนเดินทาง\": ชื่อแผนเดินทาง · แผน · ไตรมาส · ช่วงวันเดินทาง · พนักงาน กบค. ซ่อม · ผู้สร้าง · วันที่ส่ง (ไม่มีค่าใช้จ่าย ย้ายไปปิดงานรายคัน 3 พ.ย. 2569) · ส่วน \"รถในแผนเดินทาง (n)\" ตาราง ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานที่บำรุงรักษา (บรรทัดรองค่าเริ่มต้นหรือแก้แล้ว) ดูอย่างเดียว","เสนอ ตามช่องที่กรอกใน S6"],["ผลการพิจารณา","Radio text card 2 ใบ สูงเท่ากัน · อนุมัติ (บรรทัดรอง \"แผนเดินทางผ่านการตรวจสอบ แจ้งเจ้าของรถและ กรย.\") เลือกไว้เป็นค่าเริ่มต้น · ส่งกลับแก้ไข (บรรทัดรอง \"แจ้งเหตุผลให้ กบค. แก้ไขแผนเดินทางแล้วส่งใหม่\")","เจ้าของงาน 3 พ.ย. (แบบ S2)"],["เหตุผลที่ส่งกลับ","Text area แสดงเมื่อเลือกส่งกลับแก้ไข · บังคับ · placeholder \"ระบุเหตุผลที่ส่งกลับ\" · ไม่กรอก = error \"กรุณาระบุเหตุผลที่ส่งกลับ\"","แบบ S2"],["ปุ่ม","ย้อนกลับ · ยืนยันผลการพิจารณา ⇒ confirm ตามผลที่เลือก: อนุมัติ \"ยืนยันอนุมัติแผนเดินทาง\" ปุ่ม อนุมัติ · ส่งกลับ \"ยืนยันส่งกลับแก้ไข\" ข้อความ \"แผนเดินทางจะกลับไปให้ กบค. แก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่\" ปุ่ม ส่งกลับ","แบบ S2"],["อนุมัติ","สถานะ \"อนุมัติแล้ว\" · toast \"อนุมัติแผนเดินทางสำเร็จ\" · ระบบแจ้งเตือน กรย. และหน่วยงานเจ้าของรถ (S8) · หน้ารายละเอียดแสดงกล่อง \"อนุมัติแผนเดินทางแล้ว\" พร้อมวันที่ และบอกว่าแจ้งเจ้าของรถและ กรย. แล้ว","เจ้าของงาน 3 พ.ย."],["ส่งกลับ","สถานะ \"ส่งกลับแก้ไข\" · toast \"ส่งแผนเดินทางกลับให้ กบค. แก้ไขแล้ว\" · กบค. แก้ที่ S6 แล้วส่งใหม่ · ใบนั้นหายจากรายการรออนุมัติจนกว่าจะส่งใหม่","แบบ S2"],["ส่วน","เงื่อนไข","ที่มา"],["เมื่อไหร่ส่ง","ทันทีที่ผู้อนุมัติอนุมัติแผนเดินทาง (S7) · ไม่ส่งตอนสร้างหรือตอนส่งกลับ","เจ้าของงาน 3 พ.ย."],["ผู้รับ","กรย. ของเขตที่มีรถอยู่ในแผนเดินทาง · หน่วยงานเจ้าของรถทุกหน่วยงานที่มีรถอยู่ในใบนั้น (หน่วยงานละ 1 แจ้งเตือน) · แผนเดินทางจ้างดำเนินการ (S9) แจ้งผู้รับจ้างด้วย (ยังไม่มีจอฝั่งผู้รับจ้าง)","เจ้าของงาน 3 พ.ย. + เสนอ (แยกต่อหน่วยงาน)"],["ช่องทาง","ออกแบบเฉพาะแจ้งเตือนในแอป (กระดิ่งที่แถบบน) ไปก่อน · e-mail และ push notification ที่เคาะไว้ 2 พ.ย. ยังไม่ออกแบบ","เจ้าของงาน 3 พ.ย."],["ข้อความถึง กรย.","\"แผนเดินทาง {ชื่อแผนเดินทาง} อนุมัติแล้ว กบค. จะเข้าบำรุงรักษารถ {n} คัน ระหว่างวันที่ {วันเริ่ม} ถึง {วันสิ้นสุด}\" (ร่าง)","เสนอ"],["ข้อความถึงหน่วยงานเจ้าของรถ","\"กบค. จะเข้าบำรุงรักษารถของหน่วยงาน {n} คัน ({ทะเบียน}) ระหว่างวันที่ {วันเริ่ม} ถึง {วันสิ้นสุด} ที่ {สถานที่บำรุงรักษา}\" (ร่าง) · ถ้ารถของหน่วยงานอยู่คนละสถานที่ ดูรายคันในหน้าแผนเดินทาง","เสนอ"],["กดแจ้งเตือน","เปิดหน้าแผนเดินทางของใบนั้นแบบดูอย่างเดียว · กระดิ่งจุดแดงหายเมื่ออ่านแล้ว","เสนอ"],["หน้าแผนเดินทาง ฝั่ง กรย.","เห็นรถทุกคันในใบ","เสนอ"],["หน้าแผนเดินทาง ฝั่งหน่วยงานเจ้าของรถ","เห็นเฉพาะรถของหน่วยงานตัวเอง · จำนวนคันต่อท้ายหัวข้อนับเฉพาะรถของหน่วยงาน","เสนอ"],["ทำต่อ","ดูอย่างเดียว ไม่ต้องตอบรับวันเข้าตรวจ ไม่มีปุ่ม","เจ้าของงาน 3 พ.ย. (Q12 ปิด)"],["ส่วน","เงื่อนไข","ที่มา"],["เข้าฟอร์ม","กด \"สร้างแผนเดินทาง\" ในหน้าแผนเดินทางของไตรมาส แล้วเลือก radio \"จ้างดำเนินการ\" ที่ช่องรูปแบบดำเนินการ ข้างช่องชื่อแผนเดินทาง (ค่าเริ่มต้นเป็น \"กบค. ดำเนินการเอง\")","เจ้าของงาน 3 พ.ย."],["เปลี่ยนรูปแบบ","เลือก \"จ้างดำเนินการ\" แล้วหัวข้อ \"ผู้รับจ้าง\" ขึ้นใต้หัวข้อข้อมูลแผนเดินทาง · หัวข้อ \"ช่วงวันเดินทาง\" เปลี่ยนเป็น \"ช่วงวันทำงาน\" · หัวข้อ \"พนักงาน กบค. ซ่อม (2-3 คน)\" ซ่อน · เปลี่ยนกลับเป็นดำเนินการเองแล้วส่วนเหล่านั้นกลับมา","เจ้าของงาน 3 พ.ย. + เสนอ"],["ผู้รับจ้าง","ช่องค้นหา \"ผู้รับจ้าง\" ข้อความในช่อง \"ค้นหาชื่อผู้รับจ้าง\" · กดหรือพิมพ์แล้วรายชื่อผู้รับจ้าง (vendor list) ขึ้นใต้ช่อง แต่ละแถวมีชื่อผู้รับจ้างและบรรทัดรองประเภทรถที่รับงาน · เลือกได้รายเดียว · บังคับ ไม่เลือก ขึ้น \"กรุณาเลือกผู้รับจ้าง\"","เจ้าของงาน 3 พ.ย. + เสนอ (บรรทัดรอง)"],["เลขที่สัญญา/ใบสั่งจ้าง","Text input ข้างช่องผู้รับจ้าง · ไม่บังคับ ป้าย \"(ถ้ามี)\" · ข้อความในช่อง \"ระบุเลขที่สัญญาหรือใบสั่งจ้าง\"","เจ้าของงาน 3 พ.ย. (บังคับหรือไม่ยังไม่เคาะ)"],["รถในแผนเดินทาง","ปุ่ม \"เพิ่มรถ\" และ popup เพิ่มรถเหมือน S6 ทุกข้อ · รถที่อยู่ในแผนเดินทางใบอื่นของไตรมาสแล้ว (ทั้งใบที่ กบค. ดำเนินการเองและใบจ้าง) ไม่มีให้เลือก · ผู้รับจ้างเห็นเฉพาะรถในใบนี้","เจ้าของงาน 3 พ.ย."],["เบอร์ติดต่อและสถานที่บำรุงรักษา","รายคันเหมือน S6 · เบอร์ค่าเริ่มต้นเป็นเบอร์เจ้าของรถ สถานที่ค่าเริ่มต้นสำนักงานที่รถอยู่ · แก้ได้ทีละคันจาก popup แก้ไขรถในแผนเดินทางเหมือน S6","เจ้าของงาน 3 พ.ย."],["ช่วงวันทำงาน","วันที่เริ่มงาน และถึงวันที่ · date range · ไม่สามารถเลือกน้อยกว่าวันนี้ · ไม่กรอก ขึ้น \"กรุณาเลือกวันที่เริ่ม\" และ \"กรุณาเลือกวันที่สิ้นสุด\"","เจ้าของงาน 3 พ.ย."],["ยืนยัน","ปุ่ม \"ยืนยันการสร้างแผนเดินทาง\" · ไม่ครบไม่บันทึก แสดงข้อความใต้ช่องที่ขาด · สำเร็จ แผนเดินทางสถานะ \"รออนุมัติ\" ส่งให้ผู้อนุมัติ (S7) · toast \"สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว\" · ในหน้าแผนเดินทาง คอลัมน์ผู้ดำเนินการแสดงชื่อผู้รับจ้าง","เจ้าของงาน 3 พ.ย."],["อนุมัติและแจ้งเตือน","ผ่าน S7 เหมือนแผนที่ กบค. ดำเนินการเอง (หน้ารายละเอียดแสดง รูปแบบดำเนินการ ผู้รับจ้าง เลขที่สัญญา ช่วงวันทำงาน แทนพนักงาน) · อนุมัติแล้วแจ้งเตือนตาม S8 และแจ้งผู้รับจ้างด้วย","เจ้าของงาน 3 พ.ย."],["ส่วน","เงื่อนไข","ที่มา"],["เข้าหน้ารายละเอียดแผนเดินทาง","กดไอคอนไปต่อของแผนเดินทางที่สถานะ \"อนุมัติแล้ว\" ในหน้าแผนเดินทางของไตรมาส (S6) หรือกดแจ้งเตือนของแผนเดินทางนั้น · ใบที่ยังรออนุมัติหรือถูกส่งกลับ เปิดแล้วไปหน้าแก้ไขหรือหน้าดูตามเดิม ไม่มีส่วนสถานะงาน","เจ้าของงาน 3 พ.ย. + เสนอ (ใบที่ยังไม่อนุมัติ)"],["ความคืบหน้า","\"เสร็จสิ้น x จาก n คัน\" ต่อด้วย \" · อยู่ระหว่างบำรุงรักษา y\" และ \" · บำรุงรักษาไม่ได้ z\" เมื่อมี · แผนจ้างดำเนินการต่อด้วย \" · รอตรวจรับ w\" และ \" · ส่งกลับแก้ไข v\" เมื่อมี · นับ \"เสร็จสิ้น\" และ \"บำรุงรักษาไม่ได้\" ของแผนจ้างดำเนินการเมื่อ กบค. อนุมัติแล้วที่ S11","เสนอ"],["ตารางรถในแผนเดินทาง","รถทุกคันในใบ เรียงตามลำดับในแผนเดินทาง · ทะเบียนมีบรรทัดรองหน่วยงานเจ้าของรถ · เบอร์ติดต่อและสถานที่ตามที่บันทึกในแผนเดินทาง · กดแถวเปิดหน้างานรายคันของคันนั้น","เจ้าของงาน 3 พ.ย."],["ปุ่ม \"…\" ท้ายแถวรถ","กดแล้วเปิดเมนูใต้ปุ่ม (มือถือเป็น bottom sheet) รายการตามสถานะงาน: ยังไม่เริ่ม = ดูรายละเอียด · แก้ไข · ลบ · อยู่ระหว่างบำรุงรักษา = ดูรายละเอียด · แก้ไข · เสร็จสิ้น = ดูรายละเอียด (ผลการทดสอบน้ำมันบันทึกในหน้ารายละเอียด S12 · เลิกเมนูแยก 4 พ.ย.) · บำรุงรักษาไม่ได้ = ดูรายละเอียด · มุมผู้รับจ้างมีแค่ \"ดูรายละเอียด\" (S23) · ดูรายละเอียด เปิดหน้างานรายคัน (เหมือนกดแถว) · แก้ไข เปิด popup \"แก้ไขเบอร์ติดต่อและสถานที่ · {ทะเบียน}\" ช่อง เบอร์ติดต่อ และ สถานที่บำรุงรักษา กรอกค่าปัจจุบันไว้ ปุ่ม ยกเลิก · บันทึก (popup เดียวกับฟอร์มแผนเดินทาง S6) · ลบ ขึ้นหน้าต่างยืนยันสีแดง \"ยืนยันการเอารถออกจากแผนเดินทาง\" ข้อความ \"{ทะเบียน} จะถูกเอาออกจากแผนเดินทางนี้ และเลือกเข้าแผนเดินทางใบอื่นของไตรมาสได้อีก\" ปุ่ม ยกเลิก · เอาออก","เจ้าของงาน 3 พ.ย. _\"แก้ไข คือแก้ไขข้อมูล สถานที่ติดต่อ กับเบอร์โทร ลบ ก็คือรถคันนั้นออกจากแผนการเดินทาง ส่วนดูรายละเอียด ก็ไปหน้ารายละเอียดที่จะมีให้เริ่มการบำรุงรักษา และปิดงาน\"_ (ยืนยันทางแยกในผัง) + เสนอ (รายการตามสถานะ · ข้อความยืนยัน (ร่าง))"],["สถานะงานรายคัน","ยังไม่เริ่ม (สีเทา) · อยู่ระหว่างบำรุงรักษา (สีเหลือง) · เสร็จสิ้น (สีเขียว) · บำรุงรักษาไม่ได้ (สีแดง) · ทุกคันเริ่มที่ \"ยังไม่เริ่ม\" เมื่อแผนเดินทางอนุมัติ · แผนจ้างดำเนินการมีเพิ่ม 4 สถานะ ระหว่างทาง: ดำเนินการบำรุงรักษาแล้ว (ผู้รับจ้างปิดงาน ยังไม่ส่ง) · แจ้งบำรุงรักษาไม่ได้ (ผู้รับจ้างแจ้ง ยังไม่ส่ง) · รอตรวจรับ (ส่งตรวจงานแล้ว) · ส่งกลับแก้ไข (กบค. ส่งกลับ) · สีป้ายของ 4 สถานะเลือกจาก Badge ของไลบรารีตอนทำจอ · \"เสร็จสิ้น\" และ \"บำรุงรักษาไม่ได้\" ของแผนจ้างดำเนินการได้เมื่อ กบค. อนุมัติที่ S11","เสนอ ตามชื่อสถานะของ RP & MA Job + เจ้าของงาน 3 พ.ย. (\"ดำเนินการบำรุงรักษาแล้ว\" · \"ส่งตรวจงาน\")"],["ปุ่มที่หน้างานรายคัน","ยังไม่เริ่ม: \"บำรุงรักษาไม่ได้\" และ \"เริ่มงาน\" · อยู่ระหว่างบำรุงรักษา: \"บำรุงรักษาไม่ได้\" และ \"ปิดงาน\" · เสร็จสิ้นหรือบำรุงรักษาไม่ได้: ไม่มีปุ่ม ดูอย่างเดียว · มุมผู้รับจ้างดู S23 · มุม กบค. ของแผนจ้างดำเนินการ: ไม่มีปุ่มบันทึกงาน ดูความคืบหน้าอย่างเดียว ยกเว้นคันที่รอตรวจรับ (S11)","เสนอ"],["เริ่มงาน","กด \"เริ่มงาน\" เปิดหน้า \"รับรถเข้าบำรุงรักษา · {ทะเบียน}\" · ตรวจรายการรับรถทีละรายการ (มี · ไม่มี · ชำรุด · ผิดรุ่น) · ลงนามการรับมอบรถ 2 ฝ่าย ผู้ส่งมอบ (หน่วยงานเจ้าของรถ) และผู้รับมอบ (กบค.) · แนบภาพก่อนเริ่มงาน \"รูปรถ + ทะเบียน\" และ \"อะไหล่ใหม่\" · ปุ่ม \"ยืนยันรับรถและเริ่มงาน\" กดได้เมื่อลงนามครบ 2 ฝ่าย · สำเร็จ สถานะเปลี่ยนเป็น \"อยู่ระหว่างบำรุงรักษา\" ระบบบันทึกเวลาเริ่มงานและผู้เริ่มงาน toast \"เริ่มงานบำรุงรักษาแล้ว\"","บอร์ด (ภาพก่อนเริ่ม) + เจ้าของงาน 3 พ.ย. (หน้ารับรถ + ลงนาม) + เสนอ (บันทึกเวลา ตอบ Q17 · ปุ่มกดได้เมื่อลงนามครบ)"],["ปิดงาน","กด \"ปิดงาน\" เปิดหน้า \"ปิดงานบำรุงรักษา · {ทะเบียน}\" หน้าเดียวไล่ยาว · ข้อมูลเอกสารและบันทึกข้อตกลงลูกค้าแสดงอย่างเดียว ระบบเติมจากแผนเดินทาง (เบอร์โทรศัพท์ = เบอร์ติดต่อของคันนั้น) · รายการสภาพวัสดุอะไหล่ตั้งต้นจากอะไหล่ตามแผนของคัน จำนวนที่ใช้ตั้งต้นเท่าแผน จำนวนที่คืน จำนวนอะไหล่เก่า และหมายเหตุ กรอกได้ ราคารวมคำนวณเอง · ส่วนที่คืนรับคืนที่ S11 · บันทึกตรวจสอบเอกสารปิดงาน ตั้งต้นรายการเดียว \"บันทึกใบสั่งการ\" (เจ้าของงาน 3 พ.ย. 2569 ตัด 15 รายการของงานซ่อมออก) เพิ่มรายการได้ด้วยปุ่ม \"เพิ่มรายการ\" · แต่ละรายการเลือก มี ไม่มี หรือไม่ต้องใช้ ปุ่มอัพโหลดเอกสารกดได้เมื่อเลือก มี · ตรวจสภาพรถปิดงาน ใช้ InspectionChecklist ของงานซ่อม (รายการตรวจสภาพรถกระเช้า ปกติ · ต้องแก้ไข) พร้อมลงนามการส่งคืนรถ 2 ฝ่าย ปุ่มปิดงานกดได้เมื่อลงนามครบ (เจ้าของงาน 3 พ.ย. 2569 _\"ตอนปิดงานก็เหมือนกัน มีให้ตรวจสภาพรถปิดงาน\"_) · ค่าใช้จ่ายของรถคันนี้ (บาท) อยู่ต่อจากรายการสภาพวัสดุอะไหล่ · กรอกรายคน 1 แถวต่อพนักงาน 1 คน ตั้งต้นเป็นพนักงาน กบค. ซ่อมในแผนเดินทาง เพิ่ม ลด พนักงานได้ (ปุ่ม \"เพิ่มพนักงาน\" ใต้แถว · ไอคอนลบท้ายแถว): พนักงาน (ช่องค้นหา \"ค้นหาชื่อ-นามสกุล, รหัสพนักงาน\") · ค่าเบี้ยเลี้ยง (บาท/วัน) · ค่าที่พัก (บาท/วัน) ป้าย \"(ถ้ามี)\" · จำนวนวัน (เลือก 1 ถึงจำนวนวันของช่วงวันเดินทาง ข้อความในช่องเมื่อว่าง \"เลือกจำนวนวัน\") · รวม (บาท) = (ค่าเบี้ยเลี้ยงต่อวัน + ค่าที่พักต่อวัน) x จำนวนวัน ระบบคำนวณ อ่านอย่างเดียว · ใต้แถวรายคนมีช่อง \"ค่าเดินทาง (รวมทุกคน)\" ช่องเดียว ป้าย \"(ถ้ามี)\" เป็นยอดรวมของทุกคนที่ไปกับแผนเดินทาง · ใต้นั้นสรุป รวมค่าเบี้ยเลี้ยง · รวมค่าที่พัก · ค่าเดินทาง · รวมค่าใช้จ่ายของรถคันนี้ (ยังไม่กรอกแสดง 0 บาท) · ไม่มีกล่องแจ้ง (เจ้าของงานให้ลบ 3 พ.ย. 2569) · ต่อด้วยช่องเลือก \"งบประมาณ (ศูนย์ต้นทุน)\" ตั้งต้นเป็นศูนย์ต้นทุนของหน่วยงานเจ้าของรถคันนั้น เปลี่ยนเป็นศูนย์ต้นทุนอื่นได้ ข้อความในช่องเมื่อว่าง \"เลือกศูนย์ต้นทุน\" (แทนคู่ \"งบที่ตัด\" กับ \"ศูนย์ต้นทุน\" เดิม) · งบนี้ใช้กับค่าใช้จ่ายของรถคันนี้เท่านั้น ค่าอะไหล่เป็นของ กบค. · เลขไมล์รถและชั่วโมงเครื่องจักร บังคับ ไม่กรอกขึ้น \"กรุณาระบุเลขไมล์รถ\" และ \"กรุณาระบุชั่วโมงเครื่องจักร\" · ภาพชั่วโมงเครื่องจักรไม่บังคับ · กด \"ปิดงาน\" สำเร็จ สถานะเป็น \"เสร็จสิ้น\" (แผนจ้างดำเนินการเป็น \"ดำเนินการบำรุงรักษาแล้ว\" รอผู้รับจ้างกดส่งตรวจงาน) ระบบบันทึกเวลาปิดงาน กลับหน้ารายละเอียดแผนเดินทาง toast \"บันทึกงานบำรุงรักษาสำเร็จ\"","บอร์ด + เจ้าของงาน 3 พ.ย. (รูปแบบหน้า · ค่าใช้จ่ายรายคันกรอกรายคน + รวม · งบประมาณ (ศูนย์ต้นทุน) ตั้งต้นศูนย์ต้นทุนเจ้าของรถ) + เสนอ (ค่าตั้งต้น · ปุ่มอัพโหลดกดได้เมื่อ มี · ข้อความกล่องแจ้ง)"],["บำรุงรักษาไม่ได้","กดได้ทั้งก่อนเริ่มและระหว่างบำรุงรักษา · popup \"บำรุงรักษาไม่ได้ · {ทะเบียน}\" ช่อง \"สาเหตุที่บำรุงรักษาไม่ได้\" Text area บังคับ placeholder \"ระบุสาเหตุที่บำรุงรักษาไม่ได้\" ไม่กรอกขึ้น \"กรุณาระบุสาเหตุที่บำรุงรักษาไม่ได้\" · ไม่มีช่องอื่นนอกจากสาเหตุและอะไหล่ส่งคืน (ไม่มีแนบภาพ) · กด \"ยืนยัน\": แผนที่ กบค. ดำเนินการเอง สถานะเป็น \"บำรุงรักษาไม่ได้\" ทันที ไม่ต้องส่งตรวจ toast \"บันทึกบำรุงรักษาไม่ได้แล้ว\" · แผนจ้างดำเนินการ สถานะเป็น \"แจ้งบำรุงรักษาไม่ได้\" รอผู้รับจ้างกดส่งตรวจงาน toast เดียวกัน · กลับหน้ารายละเอียดแผนเดินทาง","บอร์ด + เจ้าของงาน 3 พ.ย. (กรอกแค่สาเหตุ · กบค. จบได้เลย) + เสนอ (ข้อความ error · toast)"],["อะไหล่ส่งคืน","อยู่ใน popup บำรุงรักษาไม่ได้ ใต้ช่องสาเหตุ · แถวตั้งต้นจากตาราง \"รายการงานและอะไหล่ตามแผน\" ของคันนั้น (รวมน้ำมันไฮโดรลิกถ้ามีในรายการ) · คอลัมน์ ชื่ออะไหล่ · จำนวนตามแผน · จำนวนที่ใช้ · จำนวนที่คืน · ยังไม่เริ่ม จำนวนที่ใช้เป็น 0 แก้ไม่ได้ คืนทั้งหมดตามแผน · อยู่ระหว่างบำรุงรักษา จำนวนที่ใช้ Text number กรอกได้ 0 ถึงจำนวนตามแผน ค่าตั้งต้น 0 · จำนวนที่คืน = จำนวนตามแผน − จำนวนที่ใช้ ระบบคำนวณ อ่านอย่างเดียว · ไม่มีอะไหล่ในรายการ แสดง \"ไม่มีอะไหล่ที่ต้องส่งคืน\" · แผนจ้างดำเนินการ กบค. เห็นรายการนี้ตอนตรวจรับ (S11) และรับคืนเมื่ออนุมัติ · แผนที่ กบค. ดำเนินการเอง คืนคลังตามขั้นคืนอะไหล่ (ยังไม่รู้ — Q9 Q41)","เจ้าของงาน 3 พ.ย. _\"มีให้กดส่งคืน ตอนที่กบค รับเรื่องจะเห็นว่ามีอะไหล่อะไรคืนบ้าง\"_ + เสนอ (คอลัมน์ · ค่าตั้งต้นตามสถานะ)"],["อะไหล่ตามแผนในหน้างานรายคัน","ตาราง \"รายการงานและอะไหล่ตามแผน\" ตั้งต้นจากอะไหล่ที่เลือกให้คันนี้ในแผน (S1 S21) · เฉพาะ กบค. เพิ่ม แก้ไข ลบ ได้เมื่อสถานะ ยังไม่เริ่ม หรือ อยู่ระหว่างบำรุงรักษา · มุมผู้รับจ้างดู S23 · ปุ่ม \"เพิ่มอะไหล่\" ที่หัวข้อ และไอคอนแก้ไข ไปหน้าอะไหล่ของรถ (หน้าเดียวกับ S21) · ไอคอนลบ ขึ้นหน้าต่างยืนยันสีแดง \"ยืนยันการเอาอะไหล่ออก\" ข้อความ \"{อะไหล่} จะถูกเอาออกจากรถคันนี้\" (ร่าง) ปุ่ม ยกเลิก · เอาออก · ที่แก้ที่นี่เป็นค่าตั้งต้นของตารางรายการสภาพวัสดุอะไหล่ตอนปิดงาน · เสร็จสิ้นแล้วดูอย่างเดียว","เจ้าของงาน 3 พ.ย. _\"อะไหล่ตามแผนสามารถแก้ไข ลบ เพิ่มได้\"_ + เสนอ (หน้าที่ไป · ข้อความยืนยัน)"],["น้ำมันไฮโดรลิก","การ์ดเลือก 3 แบบ \"เก็บตัวอย่าง\" · \"เปลี่ยนน้ำมัน\" · \"เก็บตัวอย่างและเปลี่ยน\" เลือกได้ 1 แบบ พร้อมช่อง \"เปลี่ยนน้ำมันครั้งล่าสุด\" อ่านอย่างเดียว · แสดงในหน้างานรายคันเมื่ออยู่ระหว่างบำรุงรักษา และในหน้าปิดงาน (ค่าตั้งต้นตามที่เลือกไว้ แก้ได้) · เลือก \"เก็บตัวอย่าง\" อย่างเดียว แถวเปลี่ยนน้ำมันไฮโดรลิกและน้ำมันไม่อยู่ในรายการอะไหล่ · มีการเก็บตัวอย่าง หน้าปิดงานมีช่องผลการทดสอบ (ถ้ามี) และคันนี้เข้ารอผลตรวจน้ำมันที่ S12 (ป้าย \"รอผลตรวจน้ำมัน\" ที่สถานะงาน) · เลือก \"เปลี่ยนน้ำมัน\" อย่างเดียว ไม่เข้า S12 · ทำไม่ได้แทนติ๊ก \"เก็บตัวอย่างน้ำมันไฮโดรลิกไปทดสอบแล้ว\" เดิม","เจ้าของงาน 3 พ.ย. _\"อยากให้สามารถเลือกได้ว่าเก็บตัวอย่างน้ำมันไฮดรอลิก หรือเปลี่ยน เนื่องจากการเปลี่ยนน้ำมันเปลี่ยนทุก 3 ปี … หรือสามารถเลือกได้ว่าเก็บตัวอย่างและเปลี่ยน\"_ + เสนอ (ผลต่อรายการอะไหล่และ S12)"],["ดูงานที่ปิดแล้ว","กดคันที่ \"เสร็จสิ้น\" ในหน้ารายละเอียดแผนเดินทาง เปิดหน้างานรายคันแบบดูอย่างเดียว","เสนอ"],["ส่วน","เงื่อนไข","ที่มา"],["เข้าหน้า","แจ้งเตือนถึง กบค. เมื่อผู้รับจ้างส่งตรวจงาน ข้อความ \"{ผู้รับจ้าง} ส่งตรวจงาน {ทะเบียน}\" (ร่าง) กดแล้วเปิดหน้างานรายคันของคันนั้น · หรือเปิดหน้ารายละเอียดแผนเดินทางของใบจ้างดำเนินการแล้วกดแถวที่ \"รอตรวจรับ\" · ช่องทางแจ้งเตือน in-app · e-mail · push notification แบบ S8","เจ้าของงาน 3 พ.ย. (\"ส่งไปยัง จนท กบค\") + เสนอ (ข้อความ · ช่องทาง)"],["ข้อมูลที่ตรวจ","อ่านอย่างเดียวทั้งหมด กบค. แก้ข้อมูลของผู้รับจ้างไม่ได้ · ข้อมูลไม่ถูกต้องหรือจำนวนอะไหล่ไม่ตรงให้ส่งกลับแก้ไข","เสนอ"],["อะไหล่ส่งคืน","คันที่ปิดงาน ใช้จำนวนที่คืนจากตารางรายการสภาพวัสดุอะไหล่ของหน้าปิดงาน · คันที่แจ้งบำรุงรักษาไม่ได้ ใช้ตาราง \"อะไหล่ส่งคืน\" จาก popup (S10) · ไม่มีอะไหล่คืน แสดง \"ไม่มีอะไหล่ที่ต้องส่งคืน\"","เจ้าของงาน 3 พ.ย. _\"ตอนที่กบค รับเรื่องจะเห็นว่ามีอะไหล่อะไรคืนบ้าง\"_"],["ผลการพิจารณา","Radio text card 2 ใบ สูงเท่ากัน · อนุมัติ (บรรทัดรอง \"งานของรถคันนี้ผ่านการตรวจรับ และรับคืนอะไหล่ตามรายการ\") เลือกไว้เป็นค่าเริ่มต้น · ส่งกลับแก้ไข (บรรทัดรอง \"แจ้งเหตุผลให้ผู้รับจ้างแก้ไขแล้วส่งตรวจงานใหม่\")","เจ้าของงาน 3 พ.ย. (แบบการ์ด S2) + เสนอ (บรรทัดรอง)"],["เหตุผลที่ส่งกลับ","Text area แสดงเมื่อเลือกส่งกลับแก้ไข · บังคับ · placeholder \"ระบุเหตุผลที่ส่งกลับ\" · ไม่กรอก = error \"กรุณาระบุเหตุผลที่ส่งกลับ\"","เจ้าของงาน 3 พ.ย. (ส่งกลับพร้อมเหตุผล) · ข้อความตาม S2"],["ปุ่ม","ย้อนกลับ · ยืนยันผลการพิจารณา → หน้าต่างยืนยันตามผลที่เลือก: อนุมัติ \"ยืนยันอนุมัติงานบำรุงรักษา · {ทะเบียน}\" ปุ่ม อนุมัติ · ส่งกลับ \"ยืนยันส่งกลับแก้ไข — งานของรถคันนี้จะกลับไปให้ผู้รับจ้างแก้ไขตามเหตุผลที่ระบุ แล้วส่งตรวจงานใหม่\" ปุ่ม ส่งกลับ","เสนอ ตามแบบ S2"],["อนุมัติ","คันที่ปิดงาน สถานะเป็น \"เสร็จสิ้น\" · คันที่แจ้งบำรุงรักษาไม่ได้ สถานะเป็น \"บำรุงรักษาไม่ได้\" · ระบบบันทึกรับคืนอะไหล่ตามจำนวนที่คืน พร้อมผู้รับคืน (กบค. ที่อนุมัติ) และเวลา · คันที่เก็บตัวอย่างน้ำมัน เข้ารอผลตรวจน้ำมันที่ S12 · แจ้งหน่วยงานเจ้าของรถ (S13) และผู้รับจ้าง · กลับหน้ารายละเอียดแผนเดินทาง toast \"อนุมัติงานบำรุงรักษาแล้ว\"","บอร์ด (รับคืนอะไหล่) + เสนอ (ต่อ S12 S13 · toast)"],["ส่งกลับ","สถานะเป็น \"ส่งกลับแก้ไข\" · แจ้งผู้รับจ้าง · ผู้รับจ้างเห็นเหตุผลและแก้ที่ S23 (แถว \"ถูกส่งกลับแก้ไข\") · อะไหล่ยังไม่รับคืน · กลับหน้ารายละเอียดแผนเดินทาง toast \"ส่งกลับให้ผู้รับจ้างแก้ไขแล้ว\"","เจ้าของงาน 3 พ.ย. + เสนอ (toast)"],["คืนเข้าคลัง","อะไหล่ที่รับคืนกลับเข้าคลังทางไหน (ยังไม่รู้ — Q9 Q41)","ภาพ ก.ค. \"ทำเรื่องคืนอะไหล่เข้าคลัง\""],["ส่วน","เงื่อนไข","ที่มา"],["ผลการทดสอบในหน้าปิดงาน","แสดงเมื่อเลือกน้ำมันไฮโดรลิกแบบ \"เก็บตัวอย่าง\" หรือ \"เก็บตัวอย่างและเปลี่ยน\" · เลือก \"เปลี่ยนน้ำมัน\" อย่างเดียวไม่แสดง · radio \"ผลการทดสอบ (ถ้ามี)\" ผ่าน หรือ ไม่ผ่าน ไม่บังคับ ค่าเริ่มต้นยังไม่เลือก · ไฟล์ผลการทดสอบ ไม่บังคับ · ไม่เลือกผลก็ปิดงานได้","เจ้าของงาน 4 พ.ย. _\"มีให้เลือกเก็บผล แต่เป็น optional\"_"],["ป้ายที่สถานะงาน","หน้ารายละเอียดแผนเดินทาง คันที่เสร็จสิ้นและเก็บตัวอย่าง: ยังไม่มีผล = \"เสร็จสิ้น\" + \"รอผลตรวจน้ำมัน\" (Warning) · ผลไม่ผ่าน = \"เสร็จสิ้น\" + \"น้ำมันไม่ผ่าน\" (Error) · ผลผ่าน หรือไม่ได้เก็บตัวอย่าง = \"เสร็จสิ้น\" ป้ายเดียว · ใช้ Table cell Style=Multiple badges · มือถือป้ายที่สองเป็นแถว \"ผลตรวจน้ำมัน\" ในการ์ด","เจ้าของงานเลือกป้ายที่สถานะงาน 4 พ.ย. + เสนอ (ข้อความและสีป้าย)"],["ทางเข้าหลังปิดงาน","ทางเดียว: ปุ่ม \"…\" ของรถ แล้ว \"ดูรายละเอียด\" (หรือกดแถว) เปิดหน้ารายละเอียดงานรายคัน · ไม่มีเมนู \"ผลการทดสอบน้ำมันไฮโดรลิก\" และไม่มี popup แล้ว","เจ้าของงาน 4 พ.ย. _\"ทางเข้าคือทางเดียวคือดูรายละเอียดแล้วเพิ่มในส่วนของรายละเอียด\"_"],["section ผลการทดสอบในหน้ารายละเอียด","แสดงเฉพาะคันที่เก็บตัวอย่าง · ค่าที่บันทึกไว้ (ทั้งจากหน้าปิดงานและที่นี่) ขึ้นในช่อง · กด \"บันทึกผลการทดสอบ\" ต้องเลือกผล ยังไม่เลือกขึ้น \"กรุณาเลือกผลการทดสอบ\" · ไฟล์ไม่บังคับ PDF JPG PNG สูงสุด 10 ไฟล์ อัปโหลดแล้วมีแถบความคืบหน้า · บันทึกสำเร็จ toast \"บันทึกผลการทดสอบน้ำมันไฮโดรลิกสำเร็จ\" แสดง บันทึกผลเมื่อ และผู้บันทึก · แก้ผลหรือเพิ่มไฟล์แล้วบันทึกใหม่ได้ภายหลัง","เจ้าของงาน 3–4 พ.ย. + เสนอ (บันทึกผลเมื่อ)"],["ผลเก็บที่ไหน","เก็บไว้ในข้อมูลรถคันนั้น ทั้งผ่านและไม่ผ่าน · ยังไม่แจ้งเจ้าของรถ","เจ้าของงาน 3 พ.ย."],["ส่วน","เงื่อนไข","ที่มา"],["แจ้งเตือน","e-mail และ VMS+ · ส่งเมื่อ S10 บันทึกงานคันนั้น","บอร์ด"],["ปุ่มยอมรับ","กดได้ทันที · ไม่มีปุ่มไม่ยอมรับ (Q23)","บอร์ด"],["กรณีบำรุงรักษาไม่ได้","ใช้ฟอร์มเดียวกันหรือแยก (ยังไม่รู้ — Q19)","บอร์ด"],["ยอมรับแล้ว","สถานะคัน \"หน่วยงานยอมรับแล้ว\" · กบค. เห็นใน S15","เสนอ"],["ส่วน","เงื่อนไข","ที่มา"],["แจ้งเตือน","e-mail และ VMS+ · ส่งเมื่อทุกคันในแผนบันทึกงานแล้ว","บอร์ด"],["ประเมินความพึงพอใจ","บังคับทุกครั้งหรือไม่ (ยังไม่รู้ — Q22) · ข้อ/สเกล (ยังไม่รู้)","บอร์ด"],["ปุ่มยอมรับ","กดได้เมื่อประเมินแล้ว (ถ้าบังคับ)","เสนอ"],["ยอมรับแล้ว","แจ้ง กบค. → ส่งประวัติได้ (S15)","เสนอ"],["ส่วน","เงื่อนไข","ที่มา"],["แก้ไขได้เมื่อ","สถานะ รออนุมัติ · ส่งกลับแก้ไข · อนุมัติแล้ว (ก่อนเริ่มงาน) · ดำเนินการขึ้นไป แก้ไม่ได้ เมนู \"…\" เหลือดูรายละเอียดอย่างเดียว","เสนอ · เจ้าของงานไม่ทักท้วง 30 ต.ค."],["ปีงบประมาณ","Readonly แก้ไม่ได้ เพราะเลขที่ MR ผูกกับปี · ต้องการเปลี่ยนปีให้ลบแล้วสร้างใหม่","เสนอ"],["เลขที่ MR","คงเลขเดิมหลังแก้ไข","เสนอ"],["เอาภาค เขต หรือประเภทรถออก","ถ้ามีรถที่ตรงค่านั้นจัดไว้ มี confirm \"รถของ {ค่า} ที่จัดไว้ {n} คัน จะถูกเอาออกจากทุกไตรมาส\" รถอื่นอยู่เหมือนเดิม","ตาม S1"],["ช่องอื่น","เงื่อนไขและข้อความ error เหมือน S1","ตาม S1"],["แผนที่ถูกส่งกลับ","ฟอร์มแสดงเหตุผลจากผู้อนุมัติบนสุด","บอร์ด \"กบค. จัดการแก้ไข\""],["แผนที่อนุมัติแล้ว","ฟอร์มแสดงคำเตือน \"เมื่อบันทึก แผนจะกลับเป็นสถานะรออนุมัติ และต้องให้ผู้อนุมัติตรวจสอบอีกครั้ง\"","เจ้าของงาน 30 ต.ค."],["ยกเลิก","มีการแก้ไข มี confirm \"ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก\" · ไม่มีการแก้ไข ออกทันที","ตามบล็อก C ของ Overhaul"],["บันทึกและส่งอนุมัติ","มี confirm \"ยืนยันการแก้ไข\" · ทุกสถานะกลับเป็น \"รออนุมัติ\" แล้วไป S2 · toast \"บันทึกการแก้ไขแผนและส่งอนุมัติสำเร็จ\" · ไม่สำเร็จ toast general error","เจ้าของงาน 30 ต.ค."],["ส่วน","เงื่อนไข","ที่มา"],["ลบได้เมื่อ","สถานะ รออนุมัติ · ส่งกลับแก้ไข · อนุมัติแล้วขึ้นไปไม่มีปุ่มลบ (ซ่อน ไม่ disable)","เสนอ · เจ้าของงานไม่ทักท้วง 30 ต.ค."],["ยืนยันการลบ","modal \"ยืนยันการลบแผน\" \"เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่\" ปุ่ม ยกเลิก · ยืนยัน ทั้งหน้า List และ Detail","ตามบล็อก D ของ Overhaul"],["ลบสำเร็จ","กลับหน้ารายการ · toast \"ลบแผนบำรุงรักษาสำเร็จ\"","ตามบล็อก D ของ Overhaul"],["เลขที่ MR ของแผนที่ลบ","ไม่นำกลับมาใช้ซ้ำ ลำดับนับต่อไป","เสนอ"],["ส่วน","เงื่อนไข","ที่มา"],["เลือกรถ","dropdown เฉพาะรถของไตรมาสที่เปิดจากฟอร์ม · ถ้าไตรมาสนั้นยังไม่มีรถ ปุ่มเข้าหน้านี้กดไม่ได้","เจ้าของงาน 2 พ.ย. + เสนอ"],["น้ำมันไฮดรอลิก","เลือกรายคัน เก็บตัวอย่าง หรือ เปลี่ยนน้ำมัน · ค่าเริ่มต้นเก็บตัวอย่าง · ระบบไม่ตัดสินจากเงื่อนไขอายุ · แสดงวันที่เปลี่ยนครั้งล่าสุดของคันนั้น ไม่มีประวัติขึ้น \"ไม่มีข้อมูล\" · เลือกเปลี่ยนน้ำมันแล้วน้ำมันเข้ารายการอะไหล่ เลือกเก็บตัวอย่างแล้วน้ำมันออกจากรายการ","เจ้าของงาน 2 พ.ย. + เสนอ"],["รายการตั้งต้น","ว่าง ระบบไม่คำนวณและไม่แนะนำ กบค. เลือกเอง ไม่มีป้าย \"แนะนำ\"","เจ้าของงาน 2 พ.ย."],["เลือกจากคลัง","แผงคลังอะไหล่แบบงานซ่อม (Smart Inventory · คลังสำรอง)","เจ้าของงาน 2 พ.ย."],["เพิ่มแบบ manual","กด \"ระบุอะไหล่เพิ่มเติม\" แล้วขึ้นการ์ด \"รายการเพิ่มเติม\" ของงานซ่อม · ชื่ออะไหล่ บังคับ · รหัสอะไหล่ (ถ้ามี) · ราคาต่อหน่วย บังคับ · จำนวน · ราคารวมคำนวณให้ · ลบการ์ดได้","เจ้าของงาน 2 พ.ย. + จอ Flow การซ่อม"],["ปุ่มย้อนกลับ","มีการแก้ไข มี confirm \"ยืนยันการออก — อะไหล่ที่แก้ไขไว้จะไม่ถูกบันทึก\" · ไม่มีการแก้ไข ออกทันที","เสนอ"],["บันทึก","สำเร็จ → กลับฟอร์มเดิม จำนวนรายการของรถคันนั้นและอะไหล่ในไตรมาสเปลี่ยนตาม · toast \"บันทึกอะไหล่ของรถ {ทะเบียน} แล้ว\" · ไม่สำเร็จ toast general error","เสนอ"],["เปลี่ยนรถในแผน","รถที่เอาออกจากแผน อะไหล่ที่เลือกไว้ของคันนั้น (ยังไม่รู้ — Q38)","เสนอ"],["ส่วน","เงื่อนไข","ที่มา"],["ส่งให้คลัง","ระบบส่งเองทันทีที่แผนอนุมัติ (S2) ทั้ง 4 ไตรมาส","เจ้าของงาน 2 พ.ย."],["แยกไตรมาส","แท็บไตรมาส 1 ถึง 4 · ยอดรวมจากอะไหล่ที่ กบค. เลือกให้รถของไตรมาสนั้น รวมรายการที่ระบุเอง","เจ้าของงาน 2 พ.ย."],["ไม่พอ","Display จำนวนที่เกินคงเหลือในคลัง ไม่พอ = \"-\"","เสนอ"],["รับทราบ","ทีละไตรมาส · ปุ่ม \"รับทราบไตรมาส n\" → confirm \"ยืนยันรับทราบรายการอะไหล่ไตรมาส n\" → แถบ \"รับทราบไตรมาส n แล้ว\" · toast \"รับทราบรายการอะไหล่ไตรมาส n แล้ว\" · ไตรมาสที่ไม่มีรถไม่ต้องรับทราบ · สถานะแผนฝั่งคลัง รอรับทราบ → รับทราบ x/n ไตรมาส → รับทราบครบแล้ว · ไม่มีส่งกลับ","เจ้าของงาน 2 พ.ย."],["สถานะฝั่ง กบค.","หน้ารายการแผน คอลัมน์ คลังรับทราบ · หน้ารายละเอียดแผน (อนุมัติแล้ว) แถบในแท็บไตรมาส","เจ้าของงาน 2 พ.ย."],["บทบาท","กบค. คลัง ใครและได้แจ้งเตือนทางไหน (ยังไม่รู้ — Q42)","—"],["ส่วน","เงื่อนไข","ที่มา"],["เข้าหน้า","ผู้รับจ้างเห็นเฉพาะแผนเดินทางจ้างดำเนินการที่ตนรับจ้างและอนุมัติแล้ว · เปิดจากแจ้งเตือน · ไม่มีหน้ารายการแผนเดินทางของผู้รับจ้าง (การวางแผนเดินทางเป็นความรับผิดชอบของผู้รับจ้าง)","เจ้าของงาน 4 พ.ย. _\"แผนการเดินทางของผู้รับจ้าง ไม่ต้องมีเนื่องจากเป็นความรับผิดชอบของผู้รับจ้าง\"_"],["ปุ่ม \"…\" ท้ายแถวรถ","ทุกสถานะมีแค่ \"ดูรายละเอียด\" เปิดหน้างานรายคัน · ไม่มีแก้ไข ลบ รถในแผนเดินทาง (ทำได้เฉพาะ กบค. ที่ S10)","เจ้าของงาน 4 พ.ย. _\"vendor … ไม่เห็นปุ้ม ลบ และแก้ไข แต่ว่า กบค จะเห็น\"_"],["ปุ่มที่หน้างานรายคัน","ยังไม่เริ่ม: \"บำรุงรักษาไม่ได้\" และ \"เริ่มงาน\" · อยู่ระหว่างบำรุงรักษา: \"บำรุงรักษาไม่ได้\" และ \"ปิดงาน\" · ดำเนินการบำรุงรักษาแล้ว หรือ แจ้งบำรุงรักษาไม่ได้: \"แก้ไขงาน\" และ \"ส่งตรวจงาน\" · รอตรวจรับ: ไม่มีปุ่ม · ส่งกลับแก้ไข: ดูแถว \"ถูกส่งกลับแก้ไข\" · เริ่มงาน ปิดงาน บำรุงรักษาไม่ได้ ใช้หน้าและเงื่อนไขเดียวกับ S10 ต่างที่ผลลัพธ์: ปิดงานแล้วเป็น \"ดำเนินการบำรุงรักษาแล้ว\" แจ้งไม่ได้แล้วเป็น \"แจ้งบำรุงรักษาไม่ได้\" รอผู้รับจ้างกดส่งตรวจงาน","เจ้าของงาน 3 พ.ย. (ปุ่มส่งตรวจงาน) + 4 พ.ย. (ปุ่มเหมือน กบค.) + เสนอ"],["อะไหล่ตามแผนในหน้างานรายคัน","ยังไม่เริ่ม: ดูอย่างเดียว ไม่มีปุ่ม \"เพิ่มอะไหล่\" และไม่มีคอลัมน์ไอคอนแก้ไข ลบ · อยู่ระหว่างบำรุงรักษา: มีไอคอนแก้ไข ลบ ท้ายแถว (ดูแถว \"แก้ไข ลบ อะไหล่และภาพ\") และปุ่ม \"เพิ่มอะไหล่\" (ดูแถว \"เพิ่มอะไหล่ (ผู้รับจ้าง)\")","เจ้าของงาน 4 พ.ย. + เสนอ (ซ่อนปุ่มเพิ่มอะไหล่)"],["เพิ่มอะไหล่ (ผู้รับจ้าง)","ปุ่ม \"เพิ่มอะไหล่\" ที่หัวตาราง \"รายการงานและอะไหล่ตามแผน\" (อยู่ระหว่างบำรุงรักษา) \"รายการงานและอะไหล่ที่ใช้จริง\" และ \"อะไหล่ส่งคืน\" เมื่อแก้ไขได้ · ยังไม่เริ่มไม่มีปุ่ม · กดแล้วเปิด popup \"เพิ่มอะไหล่ที่ใช้จริง\" ช่อง ชื่ออะไหล่ (บังคับ) · รหัสอะไหล่ (ถ้ามี) · จำนวนที่ใช้จริง (Text number บังคับ) · หน่วย (เลือก) ปุ่ม ยกเลิก · เพิ่ม · มือถือเป็น bottom sheet · เพิ่มแล้วขึ้นในอะไหล่ที่ใช้จริง จำนวนตามแผน 0 จำนวนที่คืน 0 · ข้อความ error (ยังไม่รู้)","เจ้าของงาน 4 พ.ย. _\"ต้องมีเพิ่มรายการได้ด้วย\"_ + เสนอ (กรอกเองแบบรายการเพิ่มเติมของ S21 · ช่องในฟอร์ม)"],["ไฟล์ที่อัปโหลด","รายการไฟล์ของช่องอัปโหลด (ภาพก่อนเริ่มงาน และไฟล์ในหน้าปิดงาน) ไอคอนตามชนิดไฟล์ ภาพ (JPG PNG) ใช้ไอคอนภาพ เอกสาร (PDF) ใช้ไอคอนเอกสาร · ระหว่างอัปโหลดแสดงแถบความคืบหน้าพร้อมเปอร์เซ็นต์ ยังไม่มีปุ่มดาวน์โหลด · อัปโหลดเสร็จแสดงแถบเต็ม 100% พร้อมปุ่มดาวน์โหลดและลบ · ไม่สำเร็จแสดงสถานะ error","เจ้าของงาน 4 พ.ย. _\"upload เอกสาร pdf และ ภาพ จะใช้สัญลักษณ์ไม่เหมือนกัน และ upload แล้ว จะมี progress bar ด้วย อ้างอิงจากของเดิม\"_ (ตามรายการไฟล์ของ File upload ในปลั๊กอิน Overhaul)"],["ส่งตรวจงาน","เฉพาะแผนจ้างดำเนินการ มุมผู้รับจ้าง · ปุ่ม \"ส่งตรวจงาน\" ที่หน้างานรายคันเมื่อสถานะ \"ดำเนินการบำรุงรักษาแล้ว\" หรือ \"แจ้งบำรุงรักษาไม่ได้\" · ก่อนส่ง กด \"แก้ไขงาน\" เปิดหน้าปิดงานหรือ popup บำรุงรักษาไม่ได้ (ค่าเดิมกรอกไว้) แก้แล้วบันทึกได้ สถานะไม่เปลี่ยน · กด \"ส่งตรวจงาน\" ขึ้นหน้าต่างยืนยัน \"ยืนยันส่งตรวจงาน · {ทะเบียน}\" ข้อความ \"งานของรถคันนี้จะส่งให้ กบค. ตรวจรับ\" (4 พ.ย. 2569 ตัด \"ระหว่างรอตรวจรับจะแก้ไขไม่ได้\" เพราะรอตรวจรับยังแก้อะไหล่และภาพได้) ปุ่ม ยกเลิก · ส่งตรวจงาน · สำเร็จ สถานะเป็น \"รอตรวจรับ\" ระบบบันทึกเวลาส่ง แจ้ง กบค. (S11) toast \"ส่งตรวจงานแล้ว\" · ส่งทีละคัน","เจ้าของงาน 3 พ.ย. (ปุ่มส่งตรวจงาน ผู้รับจ้างเป็นคนกด) + เสนอ (แก้ก่อนส่ง · ข้อความยืนยัน · toast)"],["ถูกส่งกลับแก้ไข","กบค. ส่งกลับที่ S11 สถานะเป็น \"ส่งกลับแก้ไข\" แจ้งผู้รับจ้าง · หน้างานรายคันบนสุดมีกล่องแจ้ง \"กบค. ส่งกลับให้แก้ไข\" พร้อมเหตุผล · คันที่ปิดงานไว้ ปุ่ม \"แก้ไขงาน\" เปิดหน้าปิดงาน ค่าเดิมกรอกไว้ บันทึกแล้วสถานะกลับเป็น \"ดำเนินการบำรุงรักษาแล้ว\" แล้วส่งตรวจงานใหม่ · คันที่แจ้งบำรุงรักษาไม่ได้ ปุ่มกลับเป็นแบบก่อนแจ้ง (\"บำรุงรักษาไม่ได้\" กับ \"เริ่มงาน\" ถ้ายังไม่เริ่ม หรือกับ \"ปิดงาน\" ถ้าเริ่มแล้ว) ผู้รับจ้างแก้สาเหตุแล้วแจ้งใหม่ หรือลงมือบำรุงรักษาต่อก็ได้ · กล่องแจ้งหายเมื่อส่งตรวจงานใหม่","เสนอ ตามแบบแผนเดินทางที่ถูกส่งกลับ (S6)"],["แก้ไข ลบ อะไหล่และภาพ (ผู้รับจ้าง)","เฉพาะมุมผู้รับจ้างของแผนจ้างดำเนินการ เมื่อสถานะ อยู่ระหว่างบำรุงรักษา · ดำเนินการบำรุงรักษาแล้ว · แจ้งบำรุงรักษาไม่ได้ · รอตรวจรับ · ส่งกลับแก้ไข (ยังไม่เริ่มดูอย่างเดียว · มุม กบค. ที่ S11 ดูอย่างเดียว) · ตาราง \"รายการงานและอะไหล่ที่ใช้จริง\" (หรือ \"รายการงานและอะไหล่ตามแผน\" ตอนอยู่ระหว่างบำรุงรักษา) และ \"อะไหล่ส่งคืน\" มีไอคอนแก้ไขและลบท้ายแถว · ไอคอนแก้ไข ทั้งสองตารางเปิด popup \"แก้ไขอะไหล่ · {ชื่ออะไหล่}\" ช่อง รายการงาน (อ่านอย่างเดียว) · จำนวนตามแผน (อ่านอย่างเดียว) · จำนวนที่ใช้จริง (Text number 0 ถึงจำนวนตามแผน) · จำนวนที่คืน (= ตามแผน − ใช้จริง ระบบคำนวณ อ่านอย่างเดียว) ปุ่ม ยกเลิก · บันทึก · มือถือเป็น bottom sheet · ไอคอนลบ ขึ้นหน้าต่างยืนยันสีแดง \"ยืนยันการเอาอะไหล่ออก\" ข้อความ \"{ชื่ออะไหล่} จะถูกเอาออกจากรถคันนี้\" ปุ่ม ยกเลิก · เอาออก · ภาพก่อนเริ่มงาน แสดงเป็นรายการไฟล์ภาพ แต่ละไฟล์มีปุ่มลบ และอัปโหลดภาพใหม่แทนได้ (JPG, PNG · สูงสุด 10 ภาพ)","เจ้าของงาน 4 พ.ย. _\"อะใหล่ที่ใช้จริง และ อะใหล่ส่งคืน ต้องมีสัญลักณ์ให้แก้ไขได้ ลบรายการได้ รูปภาพ แก้ไขได้ ลบได้ และกดแล้ว จพสามาถแก้ไข\"_ + เสนอ (ช่องใน popup · ภาพใช้รายการไฟล์ของ File upload เพราะไลบรารีไม่มีภาพที่มีปุ่มแก้ไข ลบ)"]],"note":"### Scenario 1 · กบค. สร้างแผนบำรุงรักษาประจำปี และจัดรถลงไตรมาส ช่วงงาน: เตรียมดำเนินการ · เข้าจาก: เมนู · จบที่: แผนรออนุมัติ · ที่มา: [บอร์ด] กล่อง \"สร้างแผนบำรุงรักษา\" · ช่องในฟอร์มจาก [ภาพ ก.ค.] ช่วงที่ 1 · ปรับ 22 ต.ค. 2569 (เจ้าของงาน): _\"เรื่องการยื่นของบ ไม่ทำ จะเริ่มตั้งแต่สร้างแผนเลย ใส่ชื่อแผน เลือกรถ โดยเลือกรถจะแยกเป็นเลือกตามภาค ตามประเภทรถ แทน\"_ ⇒ ไม่มีขั้นยื่นของบ แผนล่วงหน้า และรอบทบทวน · เลือกรถตามภาคและประเภทรถ · ปรับ 30 ต.ค. 2569 (เจ้าของงาน): _\"สิ่งที่อยากได้คือการสร้างแผนของปีนั้นๆ เลย เช่น ตอนนี้ปี 69 สร้างแผนของปี 70 และก็เข้าสู่การเลือกรถที่จะไปแต่ละไตรมาส\"_ + _\"เลือกสร้างแผนปีได้ ไม่จำกัดปี\"_ + _\"การอนุมัติแผนยังมีเหมือนเดิม แต่ว่าไม่ต้องผ่าน ผพจ ส่งอนุมัติทั่วไปได้เลย\"_ + เลขงาน \"ไม่ต้องมีในระบบแล้ว แยกออกไปก่อน\" ⇒ 1 แผน = 1 ปีงบประมาณ (เลือกปีได้ทุกปี) แล้วจัดรถลงไตรมาส 1 ถึง 4 ในฟอร์มเดียวกัน · บันทึกแล้วส่งอนุมัติทั่วไป (S2) ไม่ผ่าน ผพจ. · ไม่มีเลขงาน (S3 พักไว้ ดู 14-บำรุงรักษา-userflow-พักไว้-S3.md) · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"อยากให้การเลือกรถ เหมือน Overhaul แต่ว่าจังหวะเลือกรถ อยากให้สามารถเลือก เขตได้ด้วย\"_ + _\"ภาคเหนือ มี 3 เขต เขาก็จะเลือก ภาค แล้วจึงเลือก เขต ภายใต้ภาค แล้วถึงเห็นรถ\"_ ⇒ ลำดับเป็น ภาค แล้ว เขต แล้ว ประเภทรถ · เลือกรถด้วยช่องค้นหา + ชิปแบบ Overhaul (R24) แทนตารางติ๊ก · ยังเลือกรายไตรมาสด้วยแท็บเหมือนเดิม · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"พาทอะไหล่ อยากให้มีปุ่มเพิ่มอะไหล่ ไม่มี suggest มาให้เลย ให้เลือกเอง\"_ + _\"หัวข้ออะไหล่ เป็นอะไหล่ในไตรมาสนั้นๆ\"_ ⇒ ระบบไม่คำนวณหรือแนะนำอะไหล่ ตั้งต้นว่าง กบค. เลือกเอง · หัวข้ออะไหล่แสดงตามแท็บไตรมาสที่เปิด แทนยอดทั้งปี · ปุ่ม \"เพิ่มอะไหล่\" อยู่ที่หัวข้อนี้ · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"ภาค เขต ประเภทรถ อยากให้มัลติซีเล็คได้\"_ ⇒ ภาค เขต และประเภทรถเลือกได้หลายค่า ค่าที่เลือกเป็นชิปในช่อง · แผนเดียวมีหลายภาค หลายเขต และหลายประเภทได้ · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"ไม่อยากได้แสดงเป็นชิปแล้ว เพราะว่าเลือกแล้วข้อมูลแสดงข้างล่างอยู่แล้ว\"_ (ชิปรถใต้ช่องเลือกรถ) ⇒ ไม่มีชิปรถใต้ช่องเลือกรถ รถที่เลือกแสดงในตาราง อะไหล่ของรถแต่ละคัน · เอารถออกด้วยการกดคันที่ติ๊กไว้ในรายการเลือกรถอีกครั้ง ตารางรายคันมีแค่ไอคอนแก้ไข (ตามภาพที่เจ้าของงานส่ง _\"ตอนเลือกรถให้เป็นแบบนี้\"_) · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"ตรงเลือกรถ ต้องบอกว่าเป็นรถที่เลือกในไตรมาส ด้านหลังของรถ\"_ + _\"อะไหล่ต้องมีไอคอนแก้ไข และลบด้วย\"_ ⇒ รายการรถทุกคันที่จัดแล้วมี \"ไตรมาส n\" ต่อท้ายทะเบียน · ตารางอะไหล่ในไตรมาสมีไอคอนแก้ไข (ไปหน้า S21) และลบ (ถามยืนยัน แล้วเอาออกจากรถทุกคันในไตรมาส) · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"ตั้งใจเป็น section ของรถที่เลือกมาไตรมาสนั้น ทำให้เป็นแบบนั้นหน่อย\"_ ⇒ ตารางรายคันเปลี่ยนเป็น section รถในไตรมาส n แสดงรถที่เลือกของแท็บที่เปิด · ไตรมาสที่ยังไม่มีรถแสดง Empty state · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"ไอคอนอยากให้มีไอคอนลบรถออกจากไตรมาสได้ด้วย\"_ ⇒ section รถในไตรมาส มีไอคอนแก้ไขและไอคอนลบท้ายแถว ลบ = เอารถออกจากไตรมาสนั้น · ✅ ยึดเป็นแบบหลัก 2 พ.ย. 2569 (เจ้าของงาน): _\"เซฟ scen 1 ไว้ว่ายึดตามนี้\"_ ⇒ S1 ฉบับนี้ (บล็อก A 14 state) คือแบบที่ใช้ export และออกแบบครั้งถัดไป แก้เมื่อเจ้าของงานสั่งเท่านั้น · ภาค เขต ประเภทรถ เลือกได้หลายค่า · เลือกรถด้วยช่องค้นหา รายการบอก \"ไตรมาส n\" ไม่มีชิปใต้ช่อง · section รถในไตรมาส (แก้ไข · ลบ) · section อะไหล่ในไตรมาส ตั้งต้นว่าง กบค. เลือกเอง ปุ่มเพิ่มอะไหล่ (แก้ไข · ลบ) · ข้อที่ผู้เขียนถือตามที่เสนอไว้ และเจ้าของงานไม่ได้ทักท้วง 30 ต.ค.: ปีเดียวกันมีหลายแผนได้ · 1 คันอยู่ได้ไตรมาสเดียวต่อแผน (ตามที่สั่งไว้ 17 ส.ค. ในต้นแบบเดิม) · รถทุกคันในแผนต้องมีไตรมาส แต่ไตรมาสว่างได้ · ขั้น S4 เป็นต้นไปทำรายไตรมาส ```mermaid flowchart LR S([start]) --> A0(\"กดเมนู<br/>บำรุงรักษา<br/>ตามวาระ\") A0 --> D1[\"หน้า รายการ<br/>แผนบำรุงรักษา\"] D1 --> A1(\"กด<br/>สร้างแผน\") A1 --> D2[\"หน้า สร้างแผน<br/>บำรุงรักษา\"] D2 --> A2(\"ระบุชื่อแผน<br/>+ เลือก<br/>ปีงบประมาณ\") A2 --> A3(\"เลือกภาค\") A3 --> A7(\"เลือกเขต<br/>ภายใต้ภาค\") A7 --> A8(\"เลือก<br/>ประเภทรถ\") A8 --> A4(\"เลือกแท็บ<br/>ไตรมาส\") A4 --> D4[\"ระบบแสดงรถ<br/>ของเขตนี้ใน<br/>ช่องเลือกรถ\"] D4 --> A5(\"ค้นทะเบียน<br/>แล้วเลือกรถ<br/>ลงไตรมาสนี้\") A5 --> D3[\"หัวข้ออะไหล่<br/>ของไตรมาสนี้<br/>ตั้งต้นว่าง\"] D3 --> Q3{\"เพิ่ม แก้<br/>หรือลบ<br/>อะไหล่ ?\"} Q3 -->|Y| A9(\"กดเพิ่มอะไหล่<br/>หรือแก้ไข<br/>ไปที่ S21\") A9 --> D3 Q3 -->|ลบ| A10(\"ยืนยันเอาอะไหล่<br/>ออกจากทุกคัน<br/>ในไตรมาส\") A10 --> D3 Q3 -->|N| Q2{\"จัดรถครบ<br/>ทุกไตรมาส<br/>ที่ต้องการ ?\"} Q2 -->|N| A4 Q2 -->|Y| Q1{\"ระบุครบ ?\"} Q1 -->|N| D2 Q1 -->|Y| A6(\"บันทึก<br/>+ ส่งอนุมัติ\") A6 --> D5[\"แผนอยู่ใน<br/>รายการ<br/>สถานะรออนุมัติ\"] D5 --> E([End]) %% Q: A2 | Q31 ❓ รายการปีงบประมาณในช่องเลือก แสดงย้อนหลังและล่วงหน้ากี่ปี (เจ้าของงาน \"ไม่จำกัดปี\") %% Q: A8 | Q29 ❓ ประเภทรถอ้างรายการจากทะเบียนรถ VMS+ ชุดไหน %% Q: D4 | Q30 ❓ รถสถานะรอยุบ/โอน ซ่อนตั้งแต่ตอนเลือก หรือแสดงแต่เลือกไม่ได้ %% Q: A6 | Q32 ❓ ส่งอนุมัติไปที่ใคร (ผู้บังคับบัญชาตามสาย หรือหัวหน้า กบค.) กบค. ต้องเลือกผู้อนุมัติเองไหม ``` Wireframe - หน้า รายการแผนบำรุงรักษา [เสนอ] — ตาราง: เลขที่ MR (เช่น MR Z7000001) · ชื่อแผน (บรรทัดรอง ปีงบประมาณ · 2 พ.ย. ย้ายจากคอลัมน์แยก) · ภาค · จำนวนรถ · รถรายไตรมาส (2 บรรทัด เช่น \"ไตรมาส 1: 3 · ไตรมาส 2: 2\" และ \"ไตรมาส 3: 1 · ไตรมาส 4: 0\" ไม่ใช้ตัวย่อ Q) · คลังรับทราบ (2 พ.ย. · ก่อนอนุมัติ \"-\" · หลังอนุมัติ \"x/n ไตรมาส\" จาก S22) · สถานะ (รออนุมัติ · ส่งกลับแก้ไข · อนุมัติแล้ว · ดำเนินการ · ปิดงานแล้ว) · ปุ่ม \"…\" แสดงตามสถานะแผน (ดูรายละเอียด · แก้ไข S19 · ลบ S20) · ปุ่ม \"สร้างแผน\" · ค้นหา (เลขที่ MR · ชื่อแผน) · ตัวกรอง (ปีงบประมาณ · ภาค · ประเภทรถ · สถานะ) · ประเภทรถอยู่ในชื่อแผนแทนคอลัมน์แยก (Table 8 คอลัมน์) ~~เลขงาน~~ ไม่มีแล้ว (30 ต.ค. — แยกออกไปก่อน) - หน้า สร้างแผนบำรุงรักษา - section ข้อมูลแผน: ชื่อแผน · ปีงบประมาณ (เลือกได้ทุกปี) - section เลือกรถเข้าแผนและจัดลงไตรมาส: ภาค · เขต · ประเภทรถ เรียงในแถวเดียว เลือกได้หลายค่า ค่าที่เลือกเป็นชิปในช่อง · แท็บไตรมาส 1 ถึง 4 (ป้ายบนแท็บบอกจำนวนรถในไตรมาสนั้น) · ช่อง \"เลือกรถ\" แบบค้นหา ไม่มีชิปใต้ช่อง - เลือกรถจากรายการ = เอารถคันนั้นเข้าไตรมาสของแท็บที่เปิดอยู่ แล้วรถขึ้นใน section รถในไตรมาส ด้านล่าง ไม่มีชิปใต้ช่อง · เอาออกด้วยการกดคันที่ติ๊กไว้ในรายการอีกครั้ง - รายการแสดงเฉพาะรถของเขตที่เลือก ทุกคันที่จัดแล้วมี \"ไตรมาส n\" ต่อท้ายทะเบียน ถ้าเลือกคันที่อยู่ไตรมาสอื่นในแท็บนี้ รถจะย้ายมาไตรมาสนี้ และยอดของไตรมาสเดิมลดลง - เลือกได้หลายเขต รายการรถแสดงรถของทุกเขตที่เลือก - section รถในไตรมาส n ตามแท็บที่เปิด: ตาราง ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · น้ำมันไฮดรอลิก (เก็บตัวอย่าง · เปลี่ยนน้ำมัน) · เปลี่ยนล่าสุด · อะไหล่ (จำนวนรายการ หรือ ยังไม่เลือก) · ไอคอนแก้ไข (ไปหน้า S21) และไอคอนลบ (เอารถออกจากไตรมาส) ท้ายแถว · ยังไม่มีรถ = Empty state \"ยังไม่มีรถในไตรมาสนี้\" - section อะไหล่ในไตรมาส n ตามแท็บที่เปิด: ปุ่ม \"เพิ่มอะไหล่\" ไปหน้า S21 · ตาราง รายการ · รหัส · หมวด · จำนวนตามแผน · หน่วย รวมจากรถของไตรมาสนั้น - ปุ่ม ย้อนกลับ · บันทึกและส่งอนุมัติ - ~~ไตรมาส (ช่องเดียวของทั้งแผน)~~ เปลี่ยนเป็นแท็บจัดรถรายไตรมาส (30 ต.ค.) · ~~เกณฑ์เลือกรถ ทรัค/เนต~~ ตัดออก (22 ต.ค.) · ~~ตารางติ๊กรถ + คอลัมน์ไตรมาสในแผน~~ เปลี่ยนกลับเป็นช่องค้นหา + ชิป (2 พ.ย.) Condition ### Scenario 2 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนบำรุงรักษา ช่วงงาน: เตรียมดำเนินการ · เข้าจาก: เมนู/แจ้งเตือน · จบที่: แผนอนุมัติแล้ว หรือ ส่งกลับ กบค. · ที่มา: [บอร์ด] เลน ผพจ. \"ตรวจสอบแผนบำรุงรักษา → อนุมัติ? → ระบุเหตุผล → กบค. จัดการแก้ไข\" · ปรับ 30 ต.ค. 2569 (เจ้าของงาน): _\"การอนุมัติแผนยังมีเหมือนเดิม แต่ว่าไม่ต้องผ่าน ผพจ ส่งอนุมัติทั่วไปได้เลย\"_ ⇒ ผู้อนุมัติเป็นสายอนุมัติทั่วไป ไม่ใช่ ผพจ. · ตัดขั้น \"ตรวจ/เตรียมอะไหล่เพื่อใช้ในไตรมาส\" ของ ผพจ. ออก · อนุมัติแล้วไม่มีขั้นออกเลขงานต่อ (S3 พักไว้) ไปที่ S4 รายไตรมาสได้เลย · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"s2 จะมี scen อนุมัติ และหรือส่งกลับแก้ไข อยากให้ลอง export โดย อนุมัติ กับ ส่งกลับแก้ไข อยากให้แสดงเป็น radio button select อนุมัติไว้เป็น Default\"_ ⇒ ผลการพิจารณาเป็น Radio text card 2 ใบ อนุมัติ (เลือกไว้เป็นค่าเริ่มต้น) · ส่งกลับแก้ไข (ช่องเหตุผลขึ้น บังคับ) · ปุ่มเดียว \"ยืนยันผลการพิจารณา\" แทนปุ่มอนุมัติ/ส่งกลับ 2 ปุ่ม · ยึดแบบการ์ดตอบรับ/ปฏิเสธนัดหมายของ Overhaul (R29) · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"อยากให้ขนาดกล่องเท่ากัน อยากให้ข้อมูลที่แสดงเป็นข้อมูลรถ\"_ (เลือกแบบ รถรายไตรมาสแบบ S1 แทนตารางอะไหล่) ⇒ การ์ดผลการพิจารณาสูงเท่ากัน · หน้ารายละเอียดแผนแสดงรถในแผนแยกแท็บไตรมาส คอลัมน์แบบ section รถในไตรมาสของ S1 ไม่มีตารางอะไหล่ทั้งปี ```mermaid flowchart LR S([start]) --> A0(\"กดเมนู<br/>แผนรออนุมัติ<br/>หรือแจ้งเตือน\") A0 --> D1[\"หน้า รายการแผน<br/>รออนุมัติ\"] D1 --> A1(\"เปิดแผน\") A1 --> D2[\"หน้า รายละเอียด<br/>แผน + รถ<br/>รายไตรมาส\"] D2 --> A2(\"ตรวจสอบแผน<br/>เลือกผลการพิจารณา<br/>อนุมัติเป็นค่าเริ่มต้น\") A2 --> Q1{\"ผลการ<br/>พิจารณา ?\"} Q1 -->|ส่งกลับแก้ไข| A3(\"ระบุเหตุผล<br/>ที่ส่งกลับ\") A3 --> A4(\"กดยืนยัน<br/>ผลการพิจารณา<br/>+ ยืนยันส่งกลับ\") A4 --> D3[\"ระบบส่งกลับ<br/>ให้ กบค.<br/>แก้ไข\"] D3 --> E1([End]) Q1 -->|อนุมัติ| A5(\"กดยืนยัน<br/>ผลการพิจารณา<br/>+ ยืนยันอนุมัติ\") A5 --> D4[\"ระบบเปลี่ยน<br/>สถานะอนุมัติแล้ว<br/>ส่งรายการให้คลัง S22\"] D4 --> E([End]) %% Q: A0 | Q32 ❓ ผู้อนุมัติคือใคร (ผู้บังคับบัญชาตามสาย หรือหัวหน้า กบค.) · อนุมัติชั้นเดียวหรือหลายชั้น ``` Wireframe - หน้า รายการแผนรออนุมัติ [เสนอ] — ชื่อแผน · ปีงบประมาณ · ผู้สร้าง · ภาค · ประเภทรถ · จำนวนรถ · วันที่ส่ง · ปุ่มเปิด - หน้า รายละเอียดแผน (ฝั่งผู้อนุมัติ) — ข้อมูลแผน (Display ดึงจาก S1) · รถในแผน แยกแท็บไตรมาส คอลัมน์แบบ S1 (ไม่มีตารางอะไหล่) · ผลการพิจารณา (Radio text card อนุมัติ · ส่งกลับแก้ไข) · ช่องเหตุผลที่ส่งกลับ เมื่อเลือกส่งกลับ [บอร์ด] · ปุ่ม ย้อนกลับ · ยืนยันผลการพิจารณา Condition ### Scenario 4 · กบค. ติดตามความคืบหน้าและเบิกอะไหล่ของไตรมาส ช่วงงาน: เบิก/จัดหาอะไหล่ · เข้าจาก: แผนอนุมัติแล้วและคลังรับทราบ (S22) เปิดไตรมาสที่กำลังทำ · จบที่: เบิกครบ แล้วไปหน้าแผนเดินทางของไตรมาส (S6 · เลือกดำเนินการเอง หรือจ้างดำเนินการ S9 ในฟอร์มแผนเดินทาง) · ที่มา: เจ้าของงาน 2 พ.ย. 2569 _\"S4 จะไม่ได้เป็นการตรวจความพร้อมของรถ แต่จะเป็นการตรวจความคืบหน้าอะไหล่แทน โดยเห็นรายการว่ามีความต้องการเบิกอะไร และเห็นว่าใน smart inventory มีจำนวนเท่าไร\"_ + เลือก รวม S4 S5 เป็นหน้าเดียว ยุบ S5 ออก · เห็นต้องเบิกเทียบคงเหลือ Smart Inventory + สถานะการเบิกรายรายการ · เฉพาะไตรมาสที่กำลังทำ · ตัดการตรวจรถทิ้งทั้งหมด · แทน S4 เดิม (ตรวจจำนวนรถ · ความพร้อมรถ · นำรถโอน/รอยุบออก — ตัดทิ้ง) และรวม S5 เดิม (เบิกผ่านระบบจองอะไหล่) ไว้หน้าเดียว · เนื้อหาเดิมเก็บใน 14-บำรุงรักษา-userflow-พักไว้-S3.md · ข้อที่ผู้เขียนถือตามที่เสนอ: ถ้าต้องเอารถออก ให้แก้แผนที่ S19 · สถานะการเบิก รอเบิก → จองแล้ว / รอจัดซื้อ → เบิกแล้ว ```mermaid flowchart LR S([start]) --> A0(\"เปิดแผน<br/>ไตรมาสที่<br/>กำลังทำ\") A0 --> D1[\"หน้า ความคืบหน้า<br/>อะไหล่ ต้องเบิก<br/>เทียบ Smart Inventory\"] D1 --> A2(\"กด<br/>เบิก/จองอะไหล่\") A2 --> D2[\"สรุปรายการ<br/>เบิก/จอง\"] D2 --> Q1{\"คงเหลือ<br/>พอ ?\"} Q1 -->|N| D3[\"รายการที่ไม่พอ<br/>สถานะรอจัดซื้อ\"] D3 --> D1 Q1 -->|Y| D4[\"สถานะ<br/>เบิกแล้ว<br/>ครบ\"] D4 --> A3(\"กด ไปทำ<br/>แผนเดินทาง\") A3 --> E1([\"ไป S6<br/>หน้าแผนเดินทาง<br/>ของไตรมาส\"]) %% Q: D1 | Q9 ❓ เชื่อม Smart Inventory กับ VMS+ ยังไง (ดึงคงเหลือ · ส่งเบิก/จอง) %% Q: D3 | Q6 ❓ อะไหล่ไม่พอ จัดซื้อนอกระบบ หรือต้องบันทึกในระบบ · สถานะรอจัดซื้อเปลี่ยนเป็นเบิกแล้วเมื่อไหร่ ``` Wireframe - หน้า ความคืบหน้าอะไหล่ · ไตรมาส n (เฉพาะไตรมาสที่กำลังทำ) — แถบบอกคลังรับทราบไตรมาสนี้แล้ว · ตาราง รายการอะไหล่ · รหัส · ต้องเบิก · หน่วย · คงเหลือ Smart Inventory · ไม่พอ · สถานะการเบิก (รอเบิก · จองแล้ว · รอจัดซื้อ · เบิกแล้ว) · ปุ่ม ย้อนกลับ · เบิก/จองอะไหล่ · มีผลเบิก/จองแล้ว (ตั้งแต่คงเหลือไม่พอ) = ตัวเลือก รูปแบบดำเนินการ (ดำเนินการเอง · ว่าจ้าง) + ปุ่ม ไปทำแผนเดินทาง (กดได้เมื่อเบิกครบ) Condition ### Scenario 6 · กบค. ทำแผนเดินทาง (ตรวจเอง) ช่วงงาน: จ้างดำเนินการ (สายไม่ว่าจ้าง) · เข้าจาก: S4 เลือกไม่ว่าจ้าง · จบที่: ส่งแจ้งเตือน · ที่มา: [บอร์ด] \"ทำแผนเดินทาง → ระบุรายละเอียดแผนการเดินทาง\" + กล่อง \"กบค. ระบุข้อมูล: พนักงาน กบค.ซ่อม จำนวน 2-3 คน · ค่าเบี้ยเลี้ยง · ค่าที่พัก · ค่าเดินทาง · เลือกรถที่จะบำรุงรักษา · ระบุสถานที่บำรุงรักษา · กำหนดวันที่เดินทางไปเป็นช่วง · ยืนยันการสร้างแผนเดินทาง · ส่ง Notification หาวันที่เข้าตรวจ → เจ้าของรถ · กรย.\" · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"ตอนที่สร้างแผนการเดินทาง อยากให้ระบุเป็นรายคัน โดย default เป็นสำนักงานที่รถคันนั้นอยู่ · เลือกรถเป็นการเลือกภายในไตรมาสนั้น วิธีเลือกรถเป็นแบบไม่มีชิป และมีตารางแสดงเหมือน S1 · แจ้งเตือนเป็นแบบ in-app email push noti · ข้อความ toast เป็นไปตามนั้นก่อน\"_ ⇒ สถานที่บำรุงรักษาระบุรายคันในตารางรถ ค่าเริ่มต้นสำนักงานที่รถคันนั้นอยู่ แก้ได้ทีละคัน · เลือกรถเฉพาะไตรมาสที่กำลังทำ ช่องค้นหาไม่มีชิป ตารางรถแบบ S1 · แจ้งเตือน in-app · e-mail · push notification · ปรับ 3 พ.ย. 2569 (เจ้าของงาน): _\"แผนการเดินทาง ตอนเลือก เป็นรายการรถทั้งหมดที่อยู่ในแผนไตรมาสนั้น โดยมีปุ่มให้เพิ่มรถเข้าแผนการเดินทาง เนื่องจาก 1 ไตรมาสอาจมีหลายแผนการเดินทาง แต่ละแผนการเดินทางจะมีรถต่างกันก็ได้ และพอเลือกเข้าแผนการเดินทางนั้นแล้ว การสร้างแผนการเดินทางครั้งต่อไปรถคันนั้นก็ไม่มีให้เลือก\"_ + เลือกแบบ popup เพิ่มรถ และรถที่อยู่ในแผนเดินทางอื่นแล้ว ไม่แสดงแต่บอกจำนวน ⇒ ตัดช่องค้นหาเลือกรถออก ใช้ปุ่ม \"เพิ่มรถ\" เปิด popup รายการรถของไตรมาสแบบติ๊ก · ปรับ 3 พ.ย. 2569 (เจ้าของงาน รอบ 2): _\"scen e1 อยากให้แสดงรถทั้งหมดในแผน และมีให้เพิ่มแผนการเดินทาง … ตัวอย่างมีรถ 10 คัน ในแผน\"_ + เลือก รถของไตรมาสที่กำลังทำ · หน้าเดียวมีตารางรถและตารางแผนเดินทาง · รถ 10 คันใช้เฉพาะ S6 ⇒ หน้าแรกของ S6 เป็นหน้า \"แผนเดินทาง\" ของไตรมาส แสดงรถทุกคันของไตรมาสว่าอยู่แผนเดินทางใบไหนแล้ว และรายการแผนเดินทางพร้อมปุ่ม \"สร้างแผนเดินทาง\" · ปรับ 3 พ.ย. 2569 (เจ้าของงาน รอบ 3): _\"ตอนสร้างแผนการเดินทางอยากให้ตั้งชื่อแผนได้ด้วย เพิ่มช่องชื่อแผนการเดินทางด้วย\"_ ⇒ ฟอร์มมีหัวข้อ \"ข้อมูลแผนเดินทาง\" ช่อง \"ชื่อแผนเดินทาง\" (แบบเดียวกับช่อง \"ชื่อแผน\" ของ S1) · หน้าแผนเดินทางแสดงชื่อที่ตั้งแทน \"แผนเดินทาง k\" ```mermaid flowchart LR S([start]) --> D1[\"หน้า แผนเดินทาง<br/>รถในไตรมาส<br/>+ แผนเดินทาง\"] D1 --> A1(\"กด สร้างแผน<br/>เดินทาง\") A1 --> D2[\"หน้า สร้างแผน<br/>เดินทาง<br/>ไตรมาส n\"] D2 --> A2(\"กด เพิ่มรถ\") A2 --> D5[\"popup เพิ่มรถ<br/>รถของไตรมาส<br/>ที่ยังไม่มีแผนเดินทาง\"] D5 --> Q2{\"มีรถ<br/>ให้เลือก ?\"} Q2 -->|N| D6[\"แจ้ง รถทุกคัน<br/>อยู่ในแผน<br/>เดินทางแล้ว\"] D6 --> D2 Q2 -->|Y| A6(\"ติ๊กรถ<br/>กด เพิ่มเข้า<br/>แผนเดินทาง\") A6 --> D4[\"ตารางรถ<br/>สถานที่ตั้งต้น<br/>สำนักงานที่รถอยู่\"] D4 --> A5(\"แก้เบอร์ติดต่อ<br/>และสถานที่<br/>รายคัน ถ้าต้องการ\") A5 --> A3(\"ตั้งชื่อแผนเดินทาง<br/>เลือกช่วงวัน<br/>+ พนักงาน\") A3 --> Q1{\"ระบุครบ ?\"} Q1 -->|N| D2 Q1 -->|Y| A4(\"ยืนยันการ<br/>สร้างแผน<br/>เดินทาง\") A4 --> D3[\"ระบบส่งแผนเดินทาง<br/>ให้ผู้อนุมัติ S7<br/>สถานะรออนุมัติ\"] D3 --> E([End]) %% Q: D5 | Q44 ❓ ฟอร์มที่ยังไม่กดยืนยัน กันรถไว้ไหม · ยกเลิกหรือแก้ไขแผนเดินทางที่ยืนยันแล้ว รถกลับมาเลือกได้ไหม %% Q: A5 | Q47 ❓ เบอร์ติดต่อเจ้าของรถดึงจากข้อมูลไหน · S7 S8 ต้องแสดงเบอร์ด้วยไหม ``` Wireframe - หน้า แผนเดินทาง (ของไตรมาส n) — กล่องรายละเอียดแผน (ไตรมาสบอกจำนวนรถ เช่น \"ไตรมาส 1 (10 คัน)\") · ส่วน \"รถในไตรมาส n (จำนวน)\": ตารางรถทุกคันของไตรมาส ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · เบอร์ติดต่อ · ช่วงวันเดินทาง · แผนเดินทาง (ชื่อแผนเดินทางที่รถอยู่ หรือป้าย \"ยังไม่มีแผนเดินทาง\") · ส่วน \"แผนเดินทาง (จำนวน)\" + ปุ่ม \"สร้างแผนเดินทาง\": ตาราง ชื่อแผนเดินทาง (บรรทัดรองจำนวนสถานที่) · ช่วงวันเดินทาง · รถ (คัน) · ผู้ดำเนินการ · สถานะ · ไอคอนไปหน้ารายละเอียด - หน้า สร้างแผนเดินทาง · ไตรมาส n — หัวข้อ \"ข้อมูลแผนเดินทาง\" ช่อง \"ชื่อแผนเดินทาง\" · หัวข้อ \"รถในแผนเดินทาง\" (จำนวนคัน) + ปุ่ม \"เพิ่มรถ\" · ตาราง ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · เบอร์ติดต่อ · สถานที่บำรุงรักษา (บรรทัดรองบอกค่าเริ่มต้นหรือแก้แล้ว) · ไอคอนแก้ไข (popup แก้เบอร์ติดต่อและสถานที่) และลบรถ · ช่วงวันเดินทาง · พนักงาน กบค. ซ่อม 2-3 คน · ปุ่ม ย้อนกลับ / ยืนยันการสร้างแผนเดินทาง (ไม่มีค่าใช้จ่ายแล้ว 3 พ.ย. 2569 ย้ายไปกรอกรายคันตอนปิดงาน S10) - popup เพิ่มรถเข้าแผนเดินทาง — หัว \"เพิ่มรถเข้าแผนเดินทาง\" บรรทัดรอง \"รถของไตรมาส n ที่ยังไม่อยู่ในแผนเดินทางใด · อีก x คันอยู่ในแผนเดินทางอื่นแล้ว\" · ช่องค้นหา · ตารางติ๊ก ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ (ช่องหัวตารางติ๊กทั้งหมด) · ปุ่ม ยกเลิก / เพิ่มเข้าแผนเดินทาง (n) - popup เมื่อไม่มีรถให้เลือก [เสนอ] — \"รถทุกคันของไตรมาส n อยู่ในแผนเดินทางแล้ว\" · \"ไม่มีรถที่เพิ่มเข้าแผนเดินทางนี้ได้\" · ปุ่มเพิ่มกดไม่ได้ Condition ยังไม่เคาะ — ชื่อแผนเดินทางบังคับกรอกไหม · ซ้ำกับใบอื่นในไตรมาสเดียวกันได้ไหม · ยาวได้สูงสุดกี่ตัวอักษร · แผนเดินทางมีเลขที่ของระบบด้วยไหม · หน้ารายละเอียดของแผนเดินทางแต่ละใบยังไม่มีจอ · ฟอร์มที่ยังไม่กดยืนยันกันรถไว้ไหม (ตอนนี้นับเฉพาะใบที่ยืนยันแล้ว) · ยกเลิกหรือแก้ไขแผนเดินทางที่ยืนยันแล้ว รถกลับมาเลือกได้ไหม · ลบรถออกจากตารางต้องถามยืนยันไหม · เมื่อรถทุกคันของไตรมาสอยู่ในแผนเดินทางแล้ว ปุ่ม \"สร้างแผนเดินทาง\" ในหน้ารายการควรกดไม่ได้ไหม (Q44) · เบอร์ติดต่อเจ้าของรถดึงจากข้อมูลไหน ตรวจรูปแบบเบอร์ไหม และ S7 S8 ต้องแสดงเบอร์ด้วยไหม (Q47) ### Scenario 7 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง ช่วงงาน: จ้างดำเนินการ · เข้าจาก: แจ้งเตือน หรือเมนูแผนเดินทางรออนุมัติ · จบที่: แผนเดินทางอนุมัติแล้ว (ต่อ S8) หรือส่งกลับให้ กบค. แก้ที่ S6 · ที่มา: เจ้าของงาน 3 พ.ย. 2569 _\"s7 เป็นเรื่องอนุมัติแผนการเดินทาง\"_ + เลือกหน้าอนุมัติแบบเดียวกับ S2 · ผู้อนุมัติ _\"จะเป็นคนตามเส้น api getupper lower เลยไม่แน่ใจว่าเป็นหัวหน้ากบคมั้ย\"_ · S7 เดิม (ผู้รับจ้างทำแผนเดินทาง) ย้ายไป 14-…-พักไว้-S3.md · เส้นว่าจ้างแยกเป็น scenario ใหม่ หัวข้อ 2.1 ```mermaid flowchart LR S([start]) --> A0(\"กดแจ้งเตือน<br/>หรือเมนูแผนเดินทาง<br/>รออนุมัติ\") A0 --> D1[\"หน้า รายการ<br/>แผนเดินทาง<br/>รออนุมัติ\"] D1 --> A1(\"เปิดแผน<br/>เดินทาง\") A1 --> D2[\"หน้า รายละเอียด<br/>แผนเดินทาง<br/>+ รถรายคัน\"] D2 --> A2(\"ตรวจสอบ<br/>เลือกผลการพิจารณา<br/>อนุมัติเป็นค่าเริ่มต้น\") A2 --> Q1{\"ผลการ<br/>พิจารณา ?\"} Q1 -->|ส่งกลับแก้ไข| A3(\"ระบุเหตุผล<br/>ที่ส่งกลับ\") A3 --> A4(\"กดยืนยัน<br/>ผลการพิจารณา<br/>+ ยืนยันส่งกลับ\") A4 --> D3[\"ระบบส่งกลับ<br/>ให้ กบค. แก้ไข<br/>ที่ S6\"] D3 --> E1([End]) Q1 -->|อนุมัติ| A5(\"กดยืนยัน<br/>ผลการพิจารณา<br/>+ ยืนยันอนุมัติ\") A5 --> D4[\"ระบบเปลี่ยนสถานะ<br/>อนุมัติแล้ว<br/>แจ้งเตือน S8\"] D4 --> E([End]) %% Q: A0 | Q45 ❓ ผู้อนุมัติแผนเดินทางมาจาก API getUpperLower ตำแหน่งไหน (หัวหน้า กบค. หรือไม่) · ชั้นเดียวหรือหลายชั้น ``` Wireframe - หน้า รายการแผนเดินทางรออนุมัติ [เสนอ] — ชื่อแผนเดินทาง (บรรทัดรอง เลขที่ MR · ไตรมาส) · ช่วงวันเดินทาง · รถ (คัน) · ผู้สร้าง (กบค.) · วันที่ส่ง · สถานะ · ปุ่มเปิด - หน้า รายละเอียดแผนเดินทาง (ฝั่งผู้อนุมัติ) — กล่องข้อมูลแผนเดินทาง (Display จาก S6) · รถในแผนเดินทาง (ตาราง ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานที่บำรุงรักษา ดูอย่างเดียว) · ผลการพิจารณา (Radio text card อนุมัติ · ส่งกลับแก้ไข) · ช่องเหตุผลที่ส่งกลับเมื่อเลือกส่งกลับ · ปุ่ม ย้อนกลับ · ยืนยันผลการพิจารณา Condition ยังไม่เคาะ — ผู้อนุมัติจาก API getUpperLower เป็นตำแหน่งไหน และอนุมัติกี่ชั้น (Q45) · ผู้อนุมัติได้แจ้งเตือนทางไหน · ส่งกลับได้กี่ครั้ง ### Scenario 8 · กรย. และหน่วยงานเจ้าของรถ ได้รับแจ้งเตือนแผนเดินทาง ช่วงงาน: จ้างดำเนินการ (ก่อนออกเดินทาง) · เข้าจาก: แผนเดินทางอนุมัติแล้ว (S7) · จบที่: รับรู้วันและสถานที่ที่ กบค. จะเข้าบำรุงรักษา · ที่มา: เจ้าของงาน 3 พ.ย. 2569 _\"S8 เป็นเรื่อง noti ไปที่ กรย และหน่วยงานเจ้าของรถ\"_ + เลือก \"ดูอย่างเดียว\" · _\"noti ออกแบบเป็น noti inapp ไปก่อน\"_ ⇒ ออกแบบเฉพาะแจ้งเตือนในแอป (กระดิ่ง) · S8 เดิม (กบค. ตรวจสอบแผนเดินทางของผู้รับจ้าง) ย้ายไป 14-…-พักไว้-S3.md ```mermaid flowchart LR S([start]) --> D1[\"ระบบแจ้งเตือน<br/>ในแอป ถึง กรย.<br/>+ หน่วยงาน\"] D1 --> Q1{\"ผู้รับ ?\"} Q1 -->|กรย.| A1(\"กดแจ้งเตือน<br/>ฝั่ง กรย.\") A1 --> D2[\"หน้า แผนเดินทาง<br/>ดูอย่างเดียว<br/>รถทุกคันในใบ\"] Q1 -->|หน่วยงานเจ้าของรถ| A2(\"กดแจ้งเตือน<br/>ฝั่งหน่วยงาน\") A2 --> D3[\"หน้า แผนเดินทาง<br/>ดูอย่างเดียว<br/>เฉพาะรถของหน่วยงาน\"] D2 --> E([End]) D3 --> E ``` Wireframe - แผงแจ้งเตือน (กระดิ่ง) — แบบเดียวกับแผงแจ้งเตือนของ Overhaul · รายการใหม่อยู่บนสุด จุดสีบอกประเภท ข้อความ เวลา - หน้า แผนเดินทาง (ดูอย่างเดียว) — กล่องข้อมูลแผนเดินทาง (ชื่อ · แผน · ไตรมาส · ช่วงวันเดินทาง · พนักงาน กบค. ซ่อม · ผู้สร้าง · อนุมัติเมื่อ) · ตารางรถ ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานที่บำรุงรักษา · ไม่มีปุ่มแก้ไขหรือตอบกลับ Condition ยังไม่เคาะ — กรย. ของเขตไหนได้แจ้งเตือน (เขตของรถ หรือเขตของ กบค.) · e-mail และ push notification จะทำเมื่อไหร่ และใช้ข้อความเดียวกับในแอปไหม · แผนเดินทางถูกแก้หลังอนุมัติแล้วต้องแจ้งซ้ำไหม ### Scenario 9 · กบค. สร้างแผนเดินทางจ้างดำเนินการ (vendor) ช่วงงาน: จ้างดำเนินการ · เข้าจาก: หน้าแผนเดินทางของไตรมาส (S6) กด \"สร้างแผนเดินทาง\" · จบที่: แผนเดินทางสถานะรออนุมัติ ส่งให้ผู้อนุมัติ (S7) · ที่มา: เจ้าของงาน 3 พ.ย. 2569 _\"s9 อยากแทนด้วยการสร้างแผนการเดินทางของ vendor\"_ + _\"ตอนที่ทำ e2 อยากให้มีการเลือกว่า กบค ดำเนินการเอง หรือ จ้างดำเนินการ และพอเลือกจ้างดำเนินการ ก็มีให้เลือก vendor list\"_ + เลือกช่อง เลขที่สัญญา/ใบสั่งจ้าง · สถานที่รายคัน · ช่วงวันทำงาน + ผ่าน S7 และ S8 · S9 เดิม (กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน) ตัดออก ย้ายไป 14-…-พักไว้-S3.md ```mermaid flowchart LR S([start]) --> D1[\"หน้า แผนเดินทาง<br/>รถในไตรมาส<br/>+ แผนเดินทาง\"] D1 --> A1(\"กด สร้างแผน<br/>เดินทาง\") A1 --> D2[\"หน้า สร้างแผน<br/>เดินทาง เลือก<br/>จ้างดำเนินการ\"] D2 --> A3(\"เลือกผู้รับจ้าง<br/>จาก vendor list<br/>+ เลขที่สัญญา\") A3 --> A2(\"กด เพิ่มรถ\") A2 --> D5[\"popup เพิ่มรถ<br/>รถของไตรมาส<br/>ที่ยังไม่มีแผนเดินทาง\"] D5 --> A4(\"ติ๊กรถ<br/>กด เพิ่มเข้า<br/>แผนเดินทาง\") A4 --> A5(\"แก้เบอร์ติดต่อ<br/>สถานที่รายคัน +<br/>เลือกช่วงวันทำงาน\") A5 --> Q1{\"ระบุครบ ?\"} Q1 -->|N| D2 Q1 -->|Y| A6(\"ยืนยันการ<br/>สร้างแผน<br/>เดินทาง\") A6 --> D3[\"ระบบส่งแผนเดินทาง<br/>ให้ผู้อนุมัติ S7<br/>สถานะรออนุมัติ\"] D3 --> E([End]) %% Q: A3 | Q46 ❓ vendor list มาจากไหน (ทะเบียนผู้รับจ้างของ กฟภ. หรือ กบค. เพิ่มเอง) · กรองตามประเภทรถไหม · เลขที่สัญญาบังคับไหม ``` Wireframe - หน้า สร้างแผนเดินทาง · ไตรมาส n (จ้างดำเนินการ) — ฟอร์มเดียวกับ S6: ข้อมูลแผนเดินทาง (ชื่อแผนเดินทาง คู่กับ radio รูปแบบดำเนินการ เลือก \"จ้างดำเนินการ\") · ผู้รับจ้าง (ช่องค้นหาผู้รับจ้าง + เลขที่สัญญา/ใบสั่งจ้าง) · รถในแผนเดินทาง (ปุ่ม \"เพิ่มรถ\" + ตารางรถ เบอร์ติดต่อและสถานที่รายคัน) · ช่วงวันทำงาน · ไม่มีส่วนพนักงาน กบค. ซ่อม และค่าใช้จ่าย · ปุ่ม ย้อนกลับ / ยืนยันการสร้างแผนเดินทาง Condition ยังไม่เคาะ — vendor list มาจากไหน และกรองตามประเภทรถไหม (Q46) · เลขที่สัญญาบังคับไหม · ผู้รับจ้างได้แจ้งเตือนทางไหน และเข้าระบบทางไหน (Q13) · ติดตามความคืบหน้ารายคันและ approve งานรายคันทำที่ S11 ### Scenario 10 · กบค. บันทึกงานบำรุงรักษารายคัน ช่วงงาน: ดำเนินการบำรุงรักษา · เข้าจาก: หน้ารายละเอียดแผนเดินทางที่อนุมัติแล้ว (ไอคอนไปต่อในตารางแผนเดินทางของหน้าแผนเดินทาง S6 หรือแจ้งเตือน) · จบที่: ทำครบทุกคันในแผนเดินทาง · ที่มา: [บอร์ด] \"ก่อนออกเดินทาง → เดินทางไปจุดรวมงาน → รับอะไหล่ที่จุดรวมงาน → เดินทางไปหน้างานที่จะบำรุงรักษา → บำรุงรักษาได้? → ใช่ → ถ่ายรูปรถก่อนบำรุงรักษา → ดำเนินการตรวจและบำรุงรักษา + เก็บตัวอย่างน้ำมันไฮโดรลิกไปทดสอบ → บันทึกงานบำรุงรักษาและอะไหล่ (ยืนยันจำนวนอะไหล่ที่ใช้จริง) … บำรุงรักษาคันอื่น ๆ ต่อจนครบตามแผน\" + กล่อง Display \"แสดง Field ให้ระบุสาเหตุที่ไม่สามารถบำรุงรักษาได้\" · \"แสดง Field ให้ Upload ภาพที่ต้องถ่ายก่อนเริ่มงาน\" · \"แสดง Field ให้ Upload ภาพที่ต้องถ่ายตอนจบงาน\" · ปรับ 3 พ.ย. 2569 (เจ้าของงาน): _\"หน้าที่เป็นบำรุงรักษารายคัน จะเข้าจากหน้าไหนได้บ้าง จริงมันควรเข้าได้จากหน้าแผนการเดินทาง แล้วเลือกบำรุงรถทีละคัน\"_ → เลือก (1) ทางเข้า = หน้ารายละเอียดแผนเดินทาง (2) หน้ารายคันแบบทำทีละขั้น ⇒ ตามหน้า RP & MA Job ของ UI Release#2 (หน้างานรายคันมีสถานะ ปุ่มเปลี่ยนสถานะที่หัวหน้า และ popup ทีละขั้น) · ฟอร์มยาวบันทึกครั้งเดียวแบบเดิมเลิกใช้ · แยกมุมผู้รับจ้างออกเป็น S23 (4 พ.ย. 2569 เจ้าของงาน): _\"แยกเป็นอีก scen นึงได้ป่ะ\"_ → เลือกแยกโดยไม่เลื่อนเลข (เจ้าของงาน _\"เดี๋ยวสุดท้ายจะจัดเรียงใหม่ทั้งหมด\"_) ⇒ S10 เหลือแผนที่ กบค. ดำเนินการเอง · แผนจ้างดำเนินการ (ผู้รับจ้างบันทึกงานรายคันและส่งตรวจงาน) อยู่ที่ S23 · หน้ารับรถ หน้าปิดงาน และ popup บำรุงรักษาไม่ได้ใช้ร่วมกัน เงื่อนไขอยู่ที่นี่ ```mermaid flowchart LR S([start]) --> A0(\"ไปจุดนัด<br/>รับอะไหล่<br/>(นอกระบบ)\") A0 --> D1[\"หน้า รายละเอียด<br/>แผนเดินทาง<br/>สถานะงานรายคัน\"] D1 --> A1(\"เลือกรถ<br/>ทีละคัน\") A1 --> D2[\"หน้า งานรายคัน<br/>ยังไม่เริ่ม\"] D2 --> Q1{\"บำรุงรักษา<br/>ได้ ?\"} Q1 -->|N| A3(\"กด บำรุงรักษา<br/>ไม่ได้ ระบุสาเหตุ<br/>+ อะไหล่ส่งคืน\") Q1 -->|Y| A2(\"กด เริ่มงาน<br/>ตรวจรายการรับรถ<br/>+ ลงนามรับมอบ\") A2 --> D3[\"งานรายคัน<br/>อยู่ระหว่าง<br/>บำรุงรักษา\"] D3 --> A4(\"ตรวจ + บำรุง<br/>+ เก็บตัวอย่าง<br/>น้ำมัน (นอกระบบ)\") D3 -->|ทำต่อไม่ได้| A3 A4 --> A5(\"กด ปิดงาน<br/>กรอกผลงาน ตรวจสภาพ<br/>+ ลงนามส่งคืน\") A5 --> Q2{\"ระบุครบ ?\"} Q2 -->|N| A5 Q2 -->|Y| D4[\"ระบบบันทึกผล<br/>เสร็จสิ้น หรือ<br/>บำรุงรักษาไม่ได้\"] A3 --> D4 D4 --> Q3{\"มีคันอื่น<br/>ในแผน ?\"} Q3 -->|Y| D1 Q3 -->|N| E([End]) D1 -->|คันที่ปิดงานแล้ว| D5[\"หน้า งานรายคัน<br/>เสร็จสิ้น<br/>ดูอย่างเดียว\"] D1 -->|เมนู แก้ไข| A6(\"แก้เบอร์ติดต่อ<br/>และสถานที่<br/>ของรถ\") A6 --> D1 D1 -->|เมนู ลบ| A7(\"ยืนยันเอารถ<br/>ออกจาก<br/>แผนเดินทาง\") A7 --> D1 %% Q: A4 | Q18 ❓ (บอร์ด) ชั่วโมงเครื่องจักร — ภาพถ่ายหรือกรอกข้อมูล? · อะไหล่เก่า? · อะไหล่ใหม่ (ถ้าเหลือ?) ``` Wireframe - หน้า รายละเอียดแผนเดินทาง — หัวหน้า = ชื่อแผนเดินทาง ป้าย \"อนุมัติแล้ว\" · กล่อง \"รายละเอียดแผนเดินทาง\" (ข้อมูลแผนเดินทางเดียวกับหน้าอนุมัติ S7 + ความคืบหน้า) · ส่วน \"รถในแผนเดินทาง (n)\" ตาราง ทะเบียน (บรรทัดรองหน่วยงานเจ้าของรถ) · ยี่ห้อ/รุ่น · เบอร์ติดต่อ · สถานที่บำรุงรักษา · สถานะงาน · ปุ่ม \"…\" ท้ายแถว (ดูรายละเอียด · แก้ไข · ลบ) - หน้า งานรายคัน — หัวหน้า = ทะเบียน ป้ายสถานะงาน · ปุ่ม \"บำรุงรักษาไม่ได้\" และปุ่มหลัก \"เริ่มงาน\" (ยังไม่เริ่ม) หรือ \"ปิดงาน\" (อยู่ระหว่างบำรุงรักษา) · กล่อง \"ข้อมูลยานพาหนะ\" 6 ช่อง · กล่อง \"การนัดหมาย\" (แผนเดินทาง · ช่วงวันเดินทาง · สถานที่บำรุงรักษา · เบอร์ติดต่อ · เริ่มงานและผู้เริ่มงานเมื่อเริ่มแล้ว) · ภาพก่อนเริ่มงาน และเลือกน้ำมันไฮโดรลิก (เมื่อเริ่มแล้ว) · ตาราง \"รายการงานและอะไหล่ตามแผน\" พร้อมปุ่ม \"เพิ่มอะไหล่\" และไอคอนแก้ไข ลบ ท้ายแถว - หน้า รับรถเข้าบำรุงรักษา (3 พ.ย. 2569 เจ้าของงาน _\"ตอนกดเริ่มงาน อยากได้หน้าที่เป็นรายการรับรถ และมีให้ลงนาม\"_ แทน popup เดิม) — ข้อมูลรถ · รายการเอกสารรับรถ 13 รายการ (แผ่นป้ายทะเบียนหน้า - หลัง … สภาพตัวถังและสี) เป็นตารางแบบงานซ่อม: รายการ · มี · ไม่มี (เลือกอย่างใดอย่างหนึ่ง) · ชำรุด · ผิดรุ่น (ติ๊กได้เมื่อเลือก มี) · หมายเหตุ (ถ้ามี) + ปุ่มเพิ่มรายการท้ายตาราง · มือถือเป็นการ์ดรายการละใบ เลือก มี/ไม่มี แล้วมี \"สภาพ (ถ้ามี)\" ชำรุด/ผิดรุ่น · ลงนามการรับมอบรถ ผู้ส่งมอบรถ (หน่วยงานเจ้าของรถ) และผู้รับมอบรถ (กบค.) แต่ละฝ่ายเลือกชื่อแล้วกด \"เซ็นลงนาม\" (กดได้เมื่อเลือกชื่อแล้ว · popup ลงนาม ปุ่ม ปิด · บันทึก · เซ็นแล้วแสดง \"ลงนามแล้ว\" และปุ่ม \"แก้ไขลงนาม\") · ภาพก่อนเริ่มงาน · ปุ่ม ย้อนกลับ / \"ยืนยันรับรถและเริ่มงาน\" กดได้เมื่อลงนามครบ 2 ฝ่าย · ใช้ component ของงานซ่อม ReceiptChecklist + HandoverSignature + Modal Signature แบบ Overhaul ตรวจรับรถ - หน้า ปิดงานบำรุงรักษา (3 พ.ย. 2569 เจ้าของงาน _\"หน้าปิดงานอยากได้สไตล์แบบนี้ ยังไม่ต้องมีเพิ่มรูป และไม่ต้องมี stepper เป็นหน้าปิดงานหน้าเดียว ไล่ยาวๆ\"_ ตามเฟรมรายงานปิดงานของงานซ่อม) — หน้าเดียวไม่มีขั้นตอน ไม่มีส่วนภาพ เรียงลง: ข้อมูลเอกสาร (เลขที่งาน · หน่วยงานผู้ใช้บริการ · ชื่องาน · วันที่รับงาน · วันที่เสร็จงาน) · บันทึกข้อตกลงลูกค้า (ติดต่อลูกค้าชื่อ · ตำแหน่ง · เมื่อวันที่ · เบอร์โทรศัพท์ · ความต้องการลูกค้า) · รายการสภาพวัสดุอะไหล่ (ชื่ออะไหล่ · ราคาต่อหน่วย · จำนวนที่ใช้ · ราคารวมที่ใช้ · จำนวนที่คืน · ราคารวมที่คืน · จำนวนอะไหล่เก่า · หมายเหตุ + ปุ่มเพิ่มรายการ) · ค่าใช้จ่ายของรถคันนี้ (รายคน ค่าเบี้ยเลี้ยงต่อวัน · ค่าที่พักต่อวัน · จำนวนวัน · รวม + ค่าเดินทางรวมทุกคนช่องเดียว + สรุปรวม + งบประมาณ (ศูนย์ต้นทุน)) · ผลการบำรุงรักษา (เลขไมล์รถ · ชั่วโมงเครื่องจักร) · ตรวจสภาพรถปิดงาน (ตารางแบบงานซ่อม: รายการตรวจสภาพรถกระเช้า 24 รายการ · ปกติ · ต้องแก้ไข · หมายเหตุ (ถ้ามี) + เพิ่มรายการ · มือถือเป็นการ์ดรายการละใบ) + ลงนามการส่งคืนรถ ผู้ส่งมอบรถ (กบค.) และผู้รับมอบรถ (หน่วยงานเจ้าของรถ) · น้ำมันไฮโดรลิก (เก็บตัวอย่าง · เปลี่ยนน้ำมัน · เก็บตัวอย่างและเปลี่ยน) · บันทึกตรวจสอบเอกสารปิดงาน (รายการเดียว \"บันทึกใบสั่งการ\" เลือก มี · ไม่มี · ไม่ต้องใช้ + ปุ่มอัพโหลดเอกสาร + ปุ่มเพิ่มรายการ) · ปุ่ม ย้อนกลับ / ปิดงาน - popup บำรุงรักษาไม่ได้ — ช่อง \"สาเหตุที่บำรุงรักษาไม่ได้\" · ตาราง \"อะไหล่ส่งคืน\" (ชื่ออะไหล่ · จำนวนตามแผน · จำนวนที่ใช้ · จำนวนที่คืน) · ปุ่ม ยกเลิก / ยืนยัน · มือถือเป็น bottom sheet ตารางเป็นการ์ดรายการละใบ - หน้า งานรายคัน (เสร็จสิ้น) — ข้อมูลรถและงาน (เริ่มงาน · ปิดงาน · ผู้บันทึก · เลขไมล์และชั่วโมงหลังทำ) · ภาพก่อนเริ่มงาน (ภาพตอนจบงานเอาออก 4 พ.ย.) · รายการงานและอะไหล่ที่ใช้จริง · ผลตรวจน้ำมัน (S12) Condition ยังไม่เคาะ — เมนู \"…\" ของรถ: แก้ไขหรือลบรถหลังแผนเดินทางอนุมัติแล้ว ต้องส่งอนุมัติใหม่ไหม · ต้องแจ้งเจ้าของรถและ กรย. อีกครั้งไหม · คันที่อยู่ระหว่างบำรุงรักษาแก้ไขได้ไหม · ลบแล้วรถกลับไปให้แผนเดินทางใบอื่นเลือกได้ทันทีไหม · รายการรับรถ 13 รายการและรายการตรวจสภาพ 24 รายการ (ของงานซ่อม รถกระเช้า) ใช้กับรถทุกประเภทในแผนไหม · ผู้ส่งมอบรถฝั่งเจ้าของรถต้องเซ็นในระบบเอง หรือ กบค. เซ็นแทนบนเครื่องเดียว · ชั่วโมงเครื่องจักรถ่ายภาพหรือกรอก (Q18) · ผู้รับจ้างเจออะไหล่ที่ต้องเปลี่ยนเพิ่มหน้างาน ต้องให้ กบค. เพิ่มให้ หรือเพิ่มเองตอนปิดงาน (ตอนนี้ปุ่ม \"เพิ่มอะไหล่\" ซ่อนจากผู้รับจ้าง) · ปุ่ม \"แก้ไขงาน\" ของผู้รับจ้างหลังปิดงาน (ก่อนส่งตรวจ) ยังคงไว้ไหม · แผนที่ กบค. ดำเนินการเอง อะไหล่ส่งคืนของคันที่บำรุงรักษาไม่ได้ ใครรับคืนและคืนคลังทางไหน · ปิดงานแล้วแก้ไขได้ไหม · บำรุงรักษาไม่ได้แล้วรถคันนั้นไปไหนต่อ (ย้ายไปแผนเดินทางใบอื่นหรือไตรมาสถัดไป) · ยกเลิกการเริ่มงานได้ไหม · ระบบบันทึกเวลาเริ่มและปิดงานเองตามข้อเสนอ ใช้แทนคำถาม Q17 ได้ไหม · หน้าปิดงาน: ภาพตอนจบงาน 4 ช่องตามบอร์ดเอาออกตามคำสั่ง \"ยังไม่ต้องมีเพิ่มรูป\" จะกลับมาเมื่อไหร่ · เอกสาร \"บันทึกใบสั่งการ\" บังคับเลือกไหม · รายการที่เพิ่มเองตั้งชื่ออย่างไร · ผลการบำรุงรักษา (เลขไมล์ ชั่วโมงเครื่องจักร เก็บตัวอย่างน้ำมัน) ไม่อยู่ในเฟรม คงไว้เพราะ S12 ใช้ ยืนยันไหม · ปุ่มท้ายเฟรมคือ \"ส่งอนุมัติ\" แต่ S10 ใช้ \"ปิดงาน\" ปิดงานต้องมีผู้อนุมัติไหม · ช่องในตารางอะไหล่บนจอเป็นข้อความ เพราะตารางของไลบรารีไม่มีช่องกรอก · หน้าอะไหล่ของรถ (S21) ตอนวางแผนยังเลือกน้ำมันได้ 2 แบบ ต้องเพิ่ม \"เก็บตัวอย่างและเปลี่ยน\" ให้ตรงกันไหม · หน้าต้นทุน S18 รวมค่าใช้จ่ายรายคันตามงบที่ตัดของแต่ละคันอย่างไร (ตอนนี้ยังแสดงรายใบเดินทาง) · เปลี่ยนศูนย์ต้นทุนเป็นของหน่วยงานอื่นได้ไหม ต้องมีเหตุผลไหม · รายการศูนย์ต้นทุนให้เลือกได้จากหน่วยงานไหนบ้าง · คนที่ไม่ได้อยู่ในแผนเดินทาง (เช่น คนขับเพิ่ม) เพิ่มแถวได้ไหม · ค่าที่พักคูณจำนวนวันเดียวกับเบี้ยเลี้ยง หรือคูณจำนวนคืน (มักน้อยกว่าวัน 1) · ค่าเดินทางรวมทุกคนของแผนเดินทาง แต่กรอกในหน้าปิดงานรายคัน: กรอกที่คันไหน แบ่งต่อคันอย่างไร หรือย้ายไปกรอกระดับแผนเดินทาง · อัตราเบี้ยเลี้ยงและค่าที่พักต่อวันมีค่าตั้งต้นตามระเบียบไหม ### Scenario 11 · กบค. ตรวจรับงานรายคันของผู้รับจ้างและรับคืนอะไหล่ ช่วงงาน: ตรวจรับ (สายว่าจ้าง) · เข้าจาก: ผู้รับจ้างกด \"ส่งตรวจงาน\" รถคันนั้น (S23) แล้ว กบค. กดแจ้งเตือน หรือเปิดหน้ารายละเอียดแผนเดินทางของใบจ้างดำเนินการแล้วกดคันที่ \"รอตรวจรับ\" · จบที่: อนุมัติ (เสร็จสิ้น หรือ บำรุงรักษาไม่ได้ + รับคืนอะไหล่) หรือส่งกลับให้ผู้รับจ้างแก้ไข · ที่มา: [บอร์ด] \"ตรวจสอบข้อมูลการบำรุงรักษาที่ได้รับจากผู้รับจ้าง → ตรวจสอบผ่านหรือไม่? → รับคืนอะไหล่/น้ำมันที่ไม่ได้ใช้งาน … ใช้อะไหล่ครบไหม?\" · ปรับ 3 พ.ย. 2569 (เจ้าของงาน): _\"กบค จะเห็นว่าต้องตรวจรับงาน ที่บอกว่าจะมีปุ่มให้ 2 ปุ่ม อนุมัติ และ ส่งกลับแก้ไข พร้อมเหตุผล\"_ แล้วเลือก _\"ใช้แบบการ์ดเหมือน S2\"_ ⇒ ผลการพิจารณาเป็น Radio text card 2 ใบ + ปุ่มเดียว \"ยืนยันผลการพิจารณา\" · ตรวจรายคัน ทั้งคันที่ปิดงานและคันที่แจ้งบำรุงรักษาไม่ได้ · หน้ารายการ \"งานที่ผู้รับจ้างส่งมา\" แยกเดิมเลิกใช้ ใช้หน้ารายละเอียดแผนเดินทางของ S10 (คอลัมน์สถานะงาน) แทน ```mermaid flowchart LR S([start]) --> A0(\"กดแจ้งเตือน<br/>ส่งตรวจงาน<br/>หรือเปิดแผนเดินทาง\") A0 --> D1[\"หน้า รายละเอียด<br/>แผนเดินทาง<br/>คันที่รอตรวจรับ\"] D1 --> A1(\"เลือกรถ<br/>ที่รอตรวจรับ\") A1 --> D2[\"หน้า งานรายคัน<br/>รอตรวจรับ<br/>ผลงาน + อะไหล่ส่งคืน\"] D2 --> A2(\"ตรวจสอบ<br/>ข้อมูลจาก<br/>ผู้รับจ้าง\") A2 --> Q1{\"ตรวจสอบ<br/>ผ่าน ?\"} Q1 -->|Y| A4(\"เลือก อนุมัติ<br/>กดยืนยัน<br/>ผลการพิจารณา\") Q1 -->|N| A3(\"เลือก ส่งกลับแก้ไข<br/>ระบุเหตุผล<br/>กดยืนยัน\") A3 --> D3[\"ระบบส่งกลับ<br/>ให้ผู้รับจ้าง<br/>แก้ไขที่ S23\"] D3 --> E1([End]) A4 --> A6(\"ระบบรับคืนอะไหล่<br/>ตามจำนวนที่คืน<br/>+ บันทึกผล\") A6 --> Q2{\"ผู้รับจ้าง<br/>ปิดงาน ?\"} Q2 -->|Y| D4[\"งานรายคัน<br/>เสร็จสิ้น\"] Q2 -->|N| D5[\"งานรายคัน<br/>บำรุงรักษาไม่ได้\"] D4 --> E([End]) D5 --> E %% Q: A6 | Q41 ❓ อะไหล่ที่รับคืนกลับเข้าคลังทางไหน (ระบบจองอะไหล่ Q9) หรือยกไปใช้ไตรมาสถัดไป %% Q: D1 | Q50 ❓ จนท. กบค. ที่ตรวจรับคือใคร ผู้สร้างแผนเดินทาง หรือ กบค. คนใดก็ได้ในหน่วย ``` Wireframe - หน้า รายละเอียดแผนเดินทาง (ใบจ้างดำเนินการ มุม กบค.) — หน้าเดียวกับ S10 · คอลัมน์สถานะงานแสดงสถานะของแผนจ้างดำเนินการ · คันที่ \"รอตรวจรับ\" มีบรรทัดรอง \"ส่งเมื่อ {วันที่}\" - หน้า งานรายคัน (รอตรวจรับ มุม กบค.) — หัวหน้า = ทะเบียน ป้าย \"รอตรวจรับ\" · ข้อมูลยานพาหนะและการนัดหมายแบบ S10 · คันที่ปิดงาน ข้อมูลจากหน้าปิดงาน (อ่านอย่างเดียว) · คันที่แจ้งบำรุงรักษาไม่ได้ สาเหตุ · ผู้แจ้ง · วันที่แจ้ง · ตาราง \"อะไหล่ส่งคืน\" ชื่ออะไหล่ · จำนวนตามแผน · จำนวนที่ใช้ · จำนวนที่คืน (ทั้งสองกรณี) · ส่วน \"ผลการพิจารณา\" Radio text card อนุมัติ · ส่งกลับแก้ไข · ช่องเหตุผลที่ส่งกลับ เมื่อเลือกส่งกลับ · ปุ่ม ย้อนกลับ · ยืนยันผลการพิจารณา Condition ยังไม่เคาะ — จนท. กบค. ผู้ตรวจรับคือผู้สร้างแผนเดินทาง หรือ กบค. คนใดก็ได้ (Q50) · ส่งกลับได้กี่ครั้ง และต้องเห็นประวัติการส่งกลับครั้งก่อน ๆ ไหม · อนุมัติแล้วยกเลิกหรือแก้ไขได้ไหม · ตรวจรับหลายคันพร้อมกันได้ไหม · คันที่บำรุงรักษาไม่ได้แล้วอนุมัติ รถไปไหนต่อ (Q48) · อะไหล่ที่รับคืนกลับเข้าคลังทางไหน (Q9 Q41) ### Scenario 12 · กบค. บันทึกผลตรวจน้ำมันไฮโดรลิก ช่วงงาน: ตรวจรับ · เข้าจาก: หน้าปิดงาน (S10 หรือ S23) ที่เลือกน้ำมันแบบมีการเก็บตัวอย่าง หรือภายหลังจากปุ่ม \"…\" ดูรายละเอียดของรถที่ขึ้นป้าย \"รอผลตรวจน้ำมัน\" · จบที่: ผลเก็บไว้ในข้อมูลรถคันนั้น (ยังไม่แจ้งเจ้าของรถ ตามเจ้าของงาน 3 พ.ย. 2569) · ที่มา: [บอร์ด] \"ตรวจสภาพการนำไฟฟ้าน้ำมันไฮโดรลิก → บันทึกข้อมูลผลตรวจน้ำมันไฮโดรลิก\" + เลนเจ้าของรถ \"เจ้าของรถได้รับแจ้งเตือนผลตรวจน้ำมันไฮโดรลิก\" · ปรับ 4 พ.ย. 2569 (เจ้าของงาน รีวิว S12): _\"ไม่ได้อยากเป็น popup อยากได้เป๋นส่วนหนึ่งของ flowเลย เช่น ถ้าเลือก เก็บตัวอย่างน้ำมันไฮดรอลิก ก็จะ มีให้เลืิอกเก็บผล แต่เป็น optional แต่ว่า ตอนที่จะเข้ามาเก็บผล หลังจากปิดงานไปแล้ว อยากให้ทางเข้า ทางแรกเป็นข้อมูลรถรายคัน แต่ว่าจะทำยังไงให้รู้ว่ารถคันนั้นต้องส่งผลการทดสอบ ยังนึกไม่ออก ช่วยคิด แล้วตอนนี้อยากให้ทางเข้าคือทางเดียวคือดูรายละเอียดแล้วเพิ่มในส่วนของรายละเอียด\"_ + เลือกบอกรถที่รอผลด้วย ป้ายที่สถานะงาน (ป้ายที่ข้อมูลรถรายคันทำทีหลัง) ⇒ เลิก popup และเมนู \"ผลการทดสอบน้ำมันไฮโดรลิก\" · ใส่ผลได้ในหน้าปิดงาน (ไม่บังคับ) · หลังปิดงานบันทึกที่ section ในหน้ารายละเอียดงานรายคันที่เดียว · หน้ารายละเอียดเอาภาพตอนจบงานออกให้ตรงกับหน้าปิดงาน · ปรับ 3 พ.ย. 2569 (เจ้าของงาน รอบ 2): _\"ไฟล์แนบเป็น optional แก้ผลหลังปิดงานได้ เพราะการเอาน้ำมันมาตรวจอาจใช้เวลานาน แต่อยากให้สามารถไปเพิ่มผลการตรวจน้ำมันได้ ไม่ผ่านก็ใส่ผลไว้ในข้อมูลรถคันนั้น ยังไม่มีการแจ้งเจ้าของรถ\"_ ⇒ ไฟล์ไม่บังคับ · แก้ผลได้ภายหลังจากเมนูเดิม · ผลเก็บไว้ในข้อมูลรถ · ไม่แจ้งเจ้าของรถ · ปรับ 3 พ.ย. 2569 (เจ้าของงาน): _\"ถ้าเลือกเก็บตัวอย่างแล้ว อยากให้สามารถกลับมาใส่ผลของการเทสน้ำมันที่เก็บตัวอย่าง โดยเป็นการเลือกเมนู ผลการทดสอบน้ำมันไฮดรอลิก แล้วก็มีให้เลือก radio ผ่าน ไม่ผ่าน และมีให้อัปโหลดไฟล์\"_ ⇒ เข้าจากเมนู \"…\" ของรถ ไม่ใช่ปุ่มในหน้างานรายคัน · บันทึกใน popup แทนหน้าฟอร์มเต็ม · ผลเป็น ผ่าน หรือ ไม่ผ่าน ไม่กรอกค่าการนำไฟฟ้าและวันที่ตรวจแล้ว · แนบไฟล์ผล ```mermaid flowchart LR S([start]) --> A0(\"หน้าปิดงาน<br/>เลือกน้ำมันแบบ<br/>เก็บตัวอย่าง\") A0 --> Q1{\"มีผลตอน<br/>ปิดงาน ?\"} Q1 -->|Y| A1(\"ใส่ผลการทดสอบ<br/>(ถ้ามี) + แนบไฟล์<br/>ในหน้าปิดงาน\") A1 --> D3[\"ระบบเก็บผล<br/>ไว้ในข้อมูล<br/>รถคันนั้น\"] Q1 -->|N| D1[\"หน้า รายละเอียด<br/>แผนเดินทาง ป้าย<br/>รอผลตรวจน้ำมัน\"] D1 --> A2(\"ตรวจน้ำมัน<br/>ที่ห้องทดสอบ<br/>(นอกระบบ)\") A2 --> A3(\"กดปุ่ม … ของรถ<br/>ดูรายละเอียด\") A3 --> D2[\"หน้า งานรายคัน<br/>section ผลการทดสอบ<br/>น้ำมันไฮโดรลิก\"] D2 --> A4(\"เลือก ผ่าน หรือ<br/>ไม่ผ่าน + แนบไฟล์<br/>กด บันทึกผลการทดสอบ\") A4 --> Q2{\"เลือกผล<br/>แล้ว ?\"} Q2 -->|N| D2 Q2 -->|Y| D3 D3 --> D4[\"ป้ายที่สถานะงาน<br/>ผ่าน ป้ายหาย<br/>ไม่ผ่าน น้ำมันไม่ผ่าน\"] D4 --> E([End]) D4 -->|แก้ผลภายหลัง| D2 %% Q: D3 | Q21 ❓ ผลไม่ผ่านมีผลต่อแผนรอบถัดไปไหม (เช่น ให้เปลี่ยนน้ำมันรอบหน้า) · จะเริ่มแจ้งเจ้าของรถเมื่อไหร่ %% Q: D1 | Q51 ❓ ป้ายรอผลที่ข้อมูลรถรายคัน (Vehicle Management ระบบเดิม) ทำเมื่อไหร่ ใครดูแลหน้านั้น ``` Wireframe - หน้า ปิดงานบำรุงรักษา (ส่วนน้ำมันไฮโดรลิก) — การ์ดเลือก เก็บตัวอย่าง · เปลี่ยนน้ำมัน · เก็บตัวอย่างและเปลี่ยน + เปลี่ยนน้ำมันครั้งล่าสุด · เลือกแบบที่มีการเก็บตัวอย่างแล้วมี radio \"ผลการทดสอบ (ถ้ามี)\" ผ่าน · ไม่ผ่าน และอัปโหลด \"ไฟล์ผลการทดสอบ (ถ้ามี)\" ต่อท้ายในการ์ดเดียวกัน - หน้า รายละเอียดแผนเดินทาง — คอลัมน์สถานะงานของคันที่เสร็จสิ้นแสดงสองป้าย \"เสร็จสิ้น\" + \"รอผลตรวจน้ำมัน\" (สีเหลือง) หรือ \"น้ำมันไม่ผ่าน\" (สีแดง) · มือถือป้ายที่สองเป็นแถว \"ผลตรวจน้ำมัน\" ในการ์ด · เมนู \"…\" ของคันที่เสร็จสิ้นมีแค่ \"ดูรายละเอียด\" - หน้า งานรายคัน (เสร็จสิ้น) — ไม่มีภาพตอนจบงาน · ท้ายหน้า section \"ผลการทดสอบน้ำมันไฮโดรลิก\" (เฉพาะคันที่เก็บตัวอย่าง): radio ผลการทดสอบ ผ่าน · ไม่ผ่าน · อัปโหลดไฟล์ผลการทดสอบ (ถ้ามี) · เก็บตัวอย่างเมื่อ {วันที่} โดย {ผู้เก็บ} · บันทึกผลเมื่อ {วันเวลา} โดย {ผู้บันทึก} (เมื่อบันทึกแล้ว) · ปุ่ม \"บันทึกผลการทดสอบ\" Condition ยังไม่เคาะ — ป้ายรอผลที่ข้อมูลรถรายคัน (หน้าข้อมูลรถของระบบเดิม Vehicle Management) ทำเมื่อไหร่ ใครดูแลหน้านั้น (Q51) · แผนจ้างดำเนินการ ผู้รับจ้างใส่ผลตอนปิดงานได้ (หน้าเดียวกัน) แต่หลังจากนั้นใครเป็นคนใส่ผล · ผลไม่ผ่านมีผลต่อแผนรอบถัดไปไหม (Q21) · จะเริ่มแจ้งเจ้าของรถเมื่อไหร่ และทางไหน · แก้ผลได้ไม่จำกัดเวลาไหม · ต้องมีช่องคำแนะนำเมื่อผลไม่ผ่านไหม ### Scenario 13 · หน่วยงาน/เจ้าของรถ ยอมรับผลการตรวจบำรุงรถรายคัน ช่วงงาน: ตรวจรับ · เข้าจาก: แจ้งเตือนหลังบันทึกงานแต่ละคัน (S10) · จบที่: ยอมรับผลรายคัน · ที่มา: [บอร์ด] เลนหน่วยงาน รอบแรก \"ได้รับการแจ้งเตือนทาง e-mail และ VMS+ → กดยอมรับผลการตรวจบำรุงรถ → บำรุงรักษาครบทุกคันตามแผนหรือไม่?\" + เลนเจ้าของรถ \"แสดงรายการการตรวจบำรุงรถที่รอตรวจสอบ · รายการตรวจบำรุงรถ: ใบตรวจสภาพอะไหล่ · ใบตรวจสภาพงานบำรุงรักษา · ปุ่มยอมรับผลการตรวจบำรุงรถ\" · บอร์ดวางการยอมรับไว้ 2 รอบ (รายคัน → ครบทุกคัน) scenario นี้คือรอบแรก · รอบสองดู S14 ```mermaid flowchart LR S([start]) --> D0[\"ได้รับแจ้งเตือน<br/>e-mail + VMS+<br/>(รายคัน)\"] D0 --> A0(\"กดลิงก์/เมนู<br/>จากแจ้งเตือน\") A0 --> D1[\"หน้า รายการ<br/>การตรวจบำรุงรถ<br/>ที่รอตรวจสอบ\"] D1 --> A1(\"เปิดรายการ<br/>ของคันนั้น\") A1 --> D2[\"หน้า รายการ<br/>ตรวจบำรุงรถ<br/>ใบตรวจ 2 ใบ\"] D2 --> A2(\"ดูใบตรวจ<br/>+ ภาพก่อน/หลัง\") A2 --> A3(\"กดยอมรับ<br/>ผลการตรวจ<br/>บำรุงรถ\") A3 --> D3[\"ระบบบันทึก<br/>การยอมรับ<br/>รายคัน\"] D3 --> Q1{\"บำรุงรักษาครบ<br/>ทุกคันตามแผน ?\"} Q1 -->|N| E1([\"รอแจ้งเตือน<br/>คันถัดไป\"]) Q1 -->|Y| E2([\"ไป S14<br/>ตรวจหลักฐาน<br/>ทั้งแผน\"]) %% Q: D2 | Q19 ❓ (บอร์ด) กรณีที่ไม่สามารถบำรุงรักษาได้ จำเป็นต้องใช้ form รูปแบบเดียวกันไหม? หากแยกกันจะต้องมี field อะไรบ้าง? %% Q: A3 | Q23 ❓ ถ้าไม่ยอมรับผล ทำยังไง (บอร์ดมีแค่ปุ่มยอมรับ) · \"หน่วยงาน\" กับ \"เจ้าของรถ\" เป็นคนเดียวกันไหม ``` Wireframe - หน้า รายการการตรวจบำรุงรถที่รอตรวจสอบ [บอร์ด] — ทะเบียน · วันที่บำรุง · ผู้ทำ (กบค./ผู้รับจ้าง) · สถานะ (รอยอมรับ · ยอมรับแล้ว) [เสนอ] - หน้า รายการตรวจบำรุงรถ (รายคัน) — ใบตรวจสภาพอะไหล่ [บอร์ด] · ใบตรวจสภาพงานบำรุงรักษา [บอร์ด] · ภาพก่อน/หลัง + อะไหล่ที่ใช้จริง (จาก S10) [เสนอ] · กรณีบำรุงรักษาไม่ได้: สาเหตุ (จาก S10) [บอร์ด] · ปุ่ม \"ยอมรับผลการตรวจบำรุงรถ\" [บอร์ด] Condition ### Scenario 14 · หน่วยงาน/เจ้าของรถ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน) ช่วงงาน: ตรวจรับ · เข้าจาก: แจ้งเตือนเมื่อบำรุงรักษาครบทุกคันตามแผน · จบที่: ยอมรับผลทั้งแผน · ที่มา: [บอร์ด] เลนหน่วยงาน รอบสอง \"บำรุงรักษาครบทุกคันตามแผนหรือไม่? → ได้รับการแจ้งเตือนทาง e-mail และ VMS+ → ตรวจสอบเอกสารหลักฐานการตรวจบำรุงรถ → ประเมินความพึงพอใจ → กดยอมรับผลการตรวจบำรุงรถ\" + เลนเจ้าของรถ \"ประเมินความพึงพอใจ (ต้องทำทุกครั้ง?)\" ```mermaid flowchart LR S([start]) --> D0[\"ได้รับแจ้งเตือน<br/>e-mail + VMS+<br/>(ครบทุกคัน)\"] D0 --> A0(\"กดลิงก์/เมนู<br/>จากแจ้งเตือน\") A0 --> D1[\"หน้า รายการ<br/>การตรวจบำรุงรถ<br/>ที่รอตรวจสอบ\"] D1 --> A1(\"เปิดรายการ<br/>ของแผน\") A1 --> D2[\"หน้า เอกสาร<br/>หลักฐานการตรวจ<br/>บำรุงรถทั้งแผน\"] D2 --> A2(\"ตรวจสอบ<br/>เอกสาร<br/>หลักฐาน\") A2 --> A3(\"ประเมิน<br/>ความพึงพอใจ\") A3 --> A4(\"กดยอมรับ<br/>ผลการตรวจ<br/>บำรุงรถ\") A4 --> D3[\"ระบบบันทึก<br/>การยอมรับ<br/>+ แจ้ง กบค.\"] D3 --> E([End]) %% Q: A3 | Q22 ❓ (บอร์ด) ประเมินความพึงพอใจ (ต้องทำทุกครั้ง?) · แบบประเมินมีข้อ/สเกลอะไร %% Q: A4 | Q28 ❓ การยอมรับ 2 รอบ (รายคัน S13 + ทั้งแผน S14) จำเป็นทั้งคู่ไหม หรือรอบเดียวพอ ``` Wireframe - หน้า รายการการตรวจบำรุงรถที่รอตรวจสอบ [บอร์ด] — หน้าเดียวกับ S13 เพิ่มแถวระดับแผน \"ครบทุกคันแล้ว รอตรวจสอบหลักฐาน\" [เสนอ] - หน้า เอกสารหลักฐานการตรวจบำรุงรถทั้งแผน [บอร์ด] — สรุปรายคัน: ใบตรวจสภาพอะไหล่ · ใบตรวจสภาพงานบำรุงรักษา · การยอมรับรายคัน (S13) [เสนอ] · แบบประเมินความพึงพอใจ [บอร์ด] · ปุ่ม \"ยอมรับผลการตรวจบำรุงรถ\" [บอร์ด] Condition ### Scenario 15 · กบค. บันทึกและส่งประวัติงานบำรุงรักษา ช่วงงาน: จัดทำรายงาน · เข้าจาก: แผน · จบที่: รอหัวหน้า กบค. ตรวจ · ที่มา: [บอร์ด] \"บำรุงรักษาเสร็จทั้งหมดหรือไม่? → ใช่ → บันทึกประวัติงานบำรุงรักษา → ส่งประวัติงานบำรุงรักษา\" + Display \"แสดงข้อมูลประวัติงานบำรุงรักษาทั้งหมด\" ```mermaid flowchart LR S([start]) --> D1[\"หน้า แผน<br/>บำรุงรักษา<br/>ความคืบหน้ารายคัน\"] D1 --> Q1{\"บำรุงรักษาเสร็จ<br/>ทั้งหมด ?\"} Q1 -->|N| E1([\"กลับ S10<br/>ทำคันที่เหลือ\"]) Q1 -->|Y| D2[\"หน้า ประวัติงาน<br/>บำรุงรักษา<br/>ทั้งหมด\"] D2 --> A1(\"ตรวจทาน<br/>ประวัติ\") A1 --> A2(\"กด ส่งประวัติ<br/>ให้หัวหน้า<br/>ตรวจสอบ\") A2 --> D3[\"ระบบเปลี่ยน<br/>สถานะ<br/>รอหัวหน้าตรวจ\"] D3 --> E([End]) %% Q: Q1 | Q24 ❓ คันที่ \"บำรุงรักษาไม่ได้\" (S10) นับว่าเสร็จไหม — ส่งประวัติได้ทั้งที่มีคันทำไม่ได้หรือเปล่า ``` Wireframe - หน้า ประวัติงานบำรุงรักษาทั้งหมด [บอร์ด] — รายคัน: วันที่ · งานที่ทำ · อะไหล่ที่ใช้ · ภาพ · ผลน้ำมัน · ผู้ทำ · การยอมรับของเจ้าของรถ (S13 · S14) [เสนอ] · ปุ่ม \"ส่งประวัติให้หัวหน้าตรวจสอบ\" [บอร์ด] Condition — ส่งได้เมื่อครบทุกคัน [บอร์ด] (คันที่ทำไม่ได้ — Q24) · ส่งแล้วแก้ไม่ได้จนกว่าถูกตีกลับ [เสนอ] ### Scenario 16 · หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา ช่วงงาน: จัดทำรายงาน · เข้าจาก: เมนู/แจ้งเตือน · จบที่: ผ่าน หรือ ตีกลับ · ที่มา: [บอร์ด] \"หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา → ผ่านหรือไม่? → ใช่ → บันทึกประวัติ\" · ไม่ผ่าน → \"กบค. จัดการแก้ไข\" [ภาพ ก.ค.] ```mermaid flowchart LR S([start]) --> A0(\"กดเมนู<br/>ประวัติรอ<br/>ตรวจสอบ\") A0 --> D1[\"หน้า รายการ<br/>ประวัติรอ<br/>ตรวจสอบ\"] D1 --> A1(\"เปิดแผน\") A1 --> D2[\"หน้า ประวัติงาน<br/>บำรุงรักษา<br/>ของแผน\"] D2 --> A2(\"ตรวจสอบ\") A2 --> Q1{\"ผ่าน ?\"} Q1 -->|N| A3(\"ตีกลับ<br/>+ ระบุเหตุผล\") A3 --> D3[\"ระบบส่งกลับ<br/>ให้ กบค.<br/>แก้ไข\"] D3 --> E1([End]) Q1 -->|Y| A4(\"กดอนุมัติ\") A4 --> D4[\"ระบบบันทึก<br/>ประวัติ<br/>เป็นทางการ\"] D4 --> E([End]) ``` Wireframe — หน้า รายการประวัติรอตรวจสอบ [เสนอ]: แผน · กบค. ผู้ส่ง · จำนวนรถ · วันที่ส่ง · หน้า ประวัติของแผน = หน้าเดียวกับ S15 (Display) + ปุ่ม \"ตีกลับ (ระบุเหตุผล)\" [เสนอ] · \"อนุมัติ\" [บอร์ด \"ผ่าน\"] Condition — เหตุผลตีกลับ Freetext บังคับ [เสนอ] · ตีกลับ → แผนกลับสถานะให้ กบค. แก้แล้วส่งใหม่ (S15) [ภาพ ก.ค.] ### Scenario 17 · กบค. ออกรายงานผลและปิดงาน ช่วงงาน: จัดทำรายงาน · เข้าจาก: ประวัติผ่านแล้ว (S16) · จบที่: ปิดงาน · ที่มา: [บอร์ด] \"รายงานผลการบำรุงรักษา → ปิดงาน\" + Display \"แสดงรายงานผลงานบำรุงรักษา (Download ได้)\" ```mermaid flowchart LR S([start]) --> D1[\"หน้า แผน<br/>บำรุงรักษา<br/>(ประวัติผ่านแล้ว)\"] D1 --> A1(\"กด รายงานผล<br/>การบำรุงรักษา\") A1 --> D2[\"หน้า รายงานผล<br/>การบำรุงรักษา\"] D2 --> A2(\"ดาวน์โหลด<br/>รายงาน\") A2 --> A3(\"กด ปิดงาน\") A3 --> Q1{\"ยืนยัน<br/>ปิดงาน ?\"} Q1 -->|N| D2 Q1 -->|Y| D3[\"ระบบเปลี่ยน<br/>สถานะแผน<br/>ปิดงานแล้ว\"] D3 --> E([End]) %% Q: D2 | Q25 ❓ รายงานผลมีหัวข้ออะไรบ้าง รูปแบบไฟล์ (PDF/Excel) — บอร์ดบอกแค่ \"Download ได้\" ``` Wireframe — หน้า รายงานผลการบำรุงรักษา [บอร์ด]: สรุปรายคัน/รายแผน (หัวข้อ ยังไม่รู้ — Q25) · ปุ่ม \"ดาวน์โหลด\" [บอร์ด] · ปุ่ม \"ปิดงาน\" [บอร์ด] Condition — ปิดงาน มี confirm modal [เสนอ] · ปิดแล้วแก้ไม่ได้ [เสนอ] · toast คำว่า (ยังไม่รู้) ### Scenario 18 · กบค. คำนวณต้นทุนการบำรุงรักษา ช่วงงาน: คำนวณต้นทุน · เข้าจาก: แผนที่ปิดงานแล้ว · จบที่: Summary ต้นทุน · ที่มา: [บอร์ด] \"คำนวณต้นทุนการบำรุงรักษา → ได้รับ Summary ต้นทุน\" + Display \"คำนวณต้นทุน: ค่าแรง · ค่าที่พัก · ค่าเดินทาง · สามารถ Download excel ได้ · แสดงผลลัพธ์ Summary ของต้นทุน\" ```mermaid flowchart LR S([start]) --> D1[\"หน้า แผน<br/>บำรุงรักษา<br/>(ปิดงานแล้ว)\"] D1 --> A1(\"กด คำนวณ<br/>ต้นทุน\") A1 --> D2[\"หน้า ต้นทุน<br/>ค่าแรง ที่พัก<br/>เดินทาง\"] D2 --> A2(\"ตรวจทาน<br/>ค่าใช้จ่าย\") A2 --> D3[\"ระบบแสดง<br/>Summary<br/>ต้นทุน\"] D3 --> A3(\"ดาวน์โหลด<br/>Excel\") A3 --> E([End]) %% Q: D2 | Q26 ❓ \"ค่าแรง\" ในต้นทุน กับ \"ค่าเบี้ยเลี้ยง\" ที่กรอกรายคันตอนปิดงาน (S10 · ย้ายจาก S6 3 พ.ย. 2569) เป็นรายการเดียวกันไหม · ต้นทุนรวมค่าอะไหล่/ค่าจ้างผู้รับจ้างไหม ``` Wireframe — หน้า ต้นทุนการบำรุงรักษา [บอร์ด]: ตารางรายคัน/รายใบเดินทาง: ค่าแรง · ค่าที่พัก · ค่าเดินทาง · รวม [บอร์ด] · ยอดตั้งต้นดึงจากแผนเดินทาง S6 [เสนอ] · Summary ของต้นทุน [บอร์ด] · ปุ่ม \"ดาวน์โหลด Excel\" [บอร์ด] Condition — ค่าใช้จ่าย Text number แก้ได้ก่อนยืนยัน [เสนอ] · Excel มีคอลัมน์อะไร (ยังไม่รู้) ### Scenario 19 · กบค. แก้ไขแผนบำรุงรักษา แล้วส่งอนุมัติใหม่ ช่วงงาน: เตรียมดำเนินการ · เข้าจาก: เมนู \"…\" ในรายการแผน หรือหน้ารายละเอียดแผน · จบที่: แผนกลับเป็นรออนุมัติ แล้วไป S2 · ที่มา: เจ้าของงาน 30 ต.ค. 2569 _\"ตอนสร้างแผนเสร็จแล้ว อยากให้สามารถแก้ไขได้\"_ + _\"แก้ไขแล้วมีอนุมัติ อยากให้ใส่ไปก่อน\"_ · จอยึดบล็อก C ของ Overhaul ```mermaid flowchart LR S([start]) --> D1[\"หน้า รายการ<br/>แผนบำรุงรักษา\"] D1 --> A1(\"กดเมนู …<br/>หรือเปิดหน้า<br/>รายละเอียดแผน\") A1 --> Q1{\"สถานะแผน<br/>แก้ไขได้ ?\"} Q1 -->|N| D2[\"ดูรายละเอียด<br/>ได้อย่างเดียว\"] D2 --> E1([End]) Q1 -->|Y| A2(\"กด แก้ไข\") A2 --> D3[\"หน้า แก้ไขแผน<br/>ค่าเดิมกรอกไว้\"] D3 --> A3(\"แก้ชื่อแผน ภาค<br/>ประเภทรถ<br/>หรือรถรายไตรมาส\") A3 --> Q2{\"เอาภาค เขต<br/>หรือประเภทรถ<br/>ออก ?\"} Q2 -->|Y| D4[\"ยืนยันเอารถ<br/>ที่ตรงค่านั้นออก\"] D4 --> D3 Q2 -->|N| Q3{\"บันทึก<br/>หรือออก ?\"} Q3 -->|N| D5[\"ยืนยันการออก<br/>เมื่อมีการแก้ไข\"] D5 --> D1 Q3 -->|Y| D6[\"ยืนยันการแก้ไข<br/>ส่งอนุมัติใหม่\"] D6 --> Q4{\"บันทึก<br/>สำเร็จ ?\"} Q4 -->|N| D7[\"แจ้งบันทึก<br/>ไม่สำเร็จ\"] D7 --> D3 Q4 -->|Y| D8[\"แผนสถานะ<br/>รออนุมัติ\"] D8 --> E2([\"กลับ S2<br/>ผู้อนุมัติ<br/>ตรวจสอบ\"]) %% Q: Q1 | Q34 ❓ แผนที่อนุมัติแล้ว แก้เรื่องเล็กน้อย เช่น ชื่อแผน ต้องส่งอนุมัติใหม่ทุกครั้งหรือไม่ (ตอนนี้ใส่ไว้ก่อนว่าต้องส่งทุกครั้ง) ``` Wireframe - หน้า รายละเอียดแผน (ฝั่ง กบค.) — หัวหน้า \"เลขที่ MR …\" + ป้ายสถานะ · ปุ่ม ลบแผน (เฉพาะก่อนอนุมัติ) · แก้ไข · แผนที่ถูกส่งกลับมีกล่องแจ้งเหตุผลบนสุด · เนื้อหาชุดเดียวกับหน้าฝั่งผู้อนุมัติ (ข้อมูลแผน · รถในแผนแยกแท็บไตรมาส) - หน้า แก้ไขแผน — ฟอร์มเดียวกับ S1 ค่าเดิมกรอกไว้ · หัวหน้า \"แก้ไขแผน <เลขที่ MR>\" · ปีงบประมาณ Readonly · ปุ่ม ยกเลิก · บันทึกและส่งอนุมัติ Condition ### Scenario 20 · กบค. ลบแผนบำรุงรักษาที่ยังไม่อนุมัติ ช่วงงาน: เตรียมดำเนินการ · เข้าจาก: เมนู \"…\" ในรายการแผน หรือหน้ารายละเอียดแผน · จบที่: แผนหายจากรายการ · ที่มา: เจ้าของงาน 30 ต.ค. 2569 _\"ลบแผนได้\"_ + _\"ยกเลิกแผนไม่ต้องมีก็ได้ มีแก้ไข กับลบ\"_ · จอยึดบล็อก D ของ Overhaul ```mermaid flowchart LR S([start]) --> D1[\"หน้า รายการ<br/>แผนบำรุงรักษา\"] D1 --> A1(\"กดเมนู …<br/>เลือกลบ\") D1 --> A2(\"เปิดหน้า<br/>รายละเอียดแผน<br/>กดลบแผน\") A1 --> Q1{\"แผนยัง<br/>ไม่อนุมัติ ?\"} A2 --> Q1 Q1 -->|N| D2[\"ไม่มีปุ่มลบ<br/>แก้ไขได้ตาม S19\"] D2 --> E1([End]) Q1 -->|Y| D3[\"ยืนยันการ<br/>ลบแผน\"] D3 --> Q2{\"ยืนยัน ?\"} Q2 -->|N| D1 Q2 -->|Y| D4[\"ลบแผนออกจาก<br/>รายการ<br/>แจ้งลบสำเร็จ\"] D4 --> E([End]) %% Q: Q1 | Q35 ❓ แผนที่อนุมัติแล้วแต่ยังไม่เริ่มงานจะเอาออกอย่างไร (ไม่มียกเลิกแผนแล้ว · ตอนนี้ลบไม่ได้) ``` Wireframe — ใช้หน้ารายการแผนและหน้ารายละเอียดแผน (S19) · ป๊อปอัปยืนยันการลบ · ไม่ต้องระบุเหตุผล Condition ### Scenario 21 · กบค. กำหนดอะไหล่ของรถแต่ละคันในแผน ช่วงงาน: เตรียมดำเนินการ · เข้าจาก: ปุ่ม \"เพิ่มอะไหล่\" หรือไอคอนแก้ไขที่แถวอะไหล่ในไตรมาส หรือไอคอนแก้ไขที่แถวรถในฟอร์มสร้างแผน (S1) หรือแก้ไขแผน (S19) · จบที่: กลับฟอร์มเดิม · ที่มา: เจ้าของงาน 2 พ.ย. 2569 _\"เพิ่มปุ่มเพิ่มอะไหล่ใน scen A\"_ + _\"แปลว่าจะมี scen ในการเลือกอะไหล่ของรถแต่ละคันด้วย\"_ · ข้อกำหนด JO 7.3.2 กำหนดอะไหล่หรือวัสดุที่ต้องใช้ของรถแต่ละคันตามรอบ · แผงคลังอะไหล่ยึดขั้น S5 · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"อะไหล่ในการบำรุงจะเป็นไส้กรอง และน้ำมันไฮดรอลิก โดยน้ำมันไฮดรอลิค จะไม่ได้เปลี่ยนทุกปี จะเปลี่ยนตามอายุการใช้งาน 1 เงื่อนไข และเงื่อนไข อายุ 3 ปี แปลว่า ถ้าปีนี้เปลี่ยนปีถัดไปจะเป็นการ เลือกเก็บตัวอย่าง แต่เพื่อให้การทำงานของระบบง่าย อยากให้ มีการเลือกว่า เป็นการเปลี่ยนหรือการเก็บตัวอย่างน้ำมันไฮดรอลิก และมีบอกว่า เปลี่ยนไปครั้งล่าสุดเมื่อไร\"_ ⇒ ให้ กบค. เลือกรายคัน ระบบไม่ตัดสินแทน · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"พาทอะไหล่ อยากให้มีปุ่มเพิ่มอะไหล่ ไม่มี suggest มาให้เลย ให้เลือกเอง\"_ + _\"หัวข้ออะไหล่ เป็นอะไหล่ในไตรมาสนั้นๆ\"_ ⇒ หน้านี้ตั้งต้นว่าง ไม่มีป้าย \"แนะนำ\" · เลือกรถได้เฉพาะคันในไตรมาสที่เปิดจากฟอร์ม · ข้อที่ผู้เขียนถือตามที่เสนอ: ค่าเริ่มต้นเป็นเก็บตัวอย่าง · ขั้นนี้เป็นการวางแผน ยังไม่เบิกหรือจอง จึงไม่มีซื้อเพิ่มและเลือกผู้จัดซื้อ · กดปุ่ม \"เพิ่มอะไหล่\" แล้วเปิดรถคันแรกของไตรมาสนั้นให้ก่อน เปลี่ยนรถได้ ```mermaid flowchart LR S([start]) --> D1[\"อะไหล่ในไตรมาส<br/>บนฟอร์มแผน\"] D1 --> A1(\"กดเพิ่มอะไหล่<br/>หรือไอคอนแก้ไข<br/>ที่แถวรถ\") A1 --> D2[\"หน้า อะไหล่<br/>ของรถ\"] D2 --> A2(\"เลือกรถ<br/>ในแผน\") A2 --> D3[\"ระบบแสดง<br/>อะไหล่ที่เลือกไว้<br/>ของคันนี้ ตั้งต้นว่าง\"] D3 --> A6(\"เลือกเก็บตัวอย่าง<br/>หรือเปลี่ยน<br/>น้ำมันไฮดรอลิก\") A6 --> A3(\"ค้นคลังอะไหล่<br/>แล้วกดเลือก\") A3 --> A7(\"กดระบุอะไหล่<br/>เพิ่มเติม ถ้าไม่มี<br/>ในคลัง\") A7 --> A8(\"กรอกชื่อ รหัส<br/>ราคา จำนวน\") A8 --> A4(\"แก้จำนวน<br/>หรือเอาออก\") A4 --> Q1{\"ครบ ?\"} Q1 -->|N| A3 Q1 -->|Y| A5(\"กดบันทึก<br/>อะไหล่ของรถ\") A5 --> D4[\"กลับฟอร์มแผน<br/>อะไหล่ในไตรมาส<br/>เปลี่ยนตาม\"] D4 --> E([End]) %% Q: A6 | Q39 ❓ เงื่อนไขอายุการใช้งานของน้ำมันคืออะไร นอกจากอายุ 3 ปี · คันที่เลือกเปลี่ยนน้ำมัน ยังต้องเก็บตัวอย่างและบันทึกผลตรวจ (S10 S12) ไหม %% Q: D4 | Q38 ❓ เปลี่ยนรถออกจากแผนแล้ว อะไหล่ที่เพิ่มเองของคันนั้นหายไปด้วยใช่ไหม ``` Wireframe — หน้า อะไหล่ของรถ: ช่องเลือกรถ (เฉพาะรถของไตรมาสที่เปิดจากฟอร์ม) · ตัวเลือกน้ำมันไฮดรอลิก เก็บตัวอย่าง หรือ เปลี่ยนน้ำมัน · ช่อง เปลี่ยนน้ำมันครั้งล่าสุด (แสดงอย่างเดียว) · แผง \"คลังอะไหล่\" (ค้นชื่อหรือรหัส · Smart Inventory และคลังสำรอง · ปุ่มเลือก) · แผง \"อะไหล่ของรถคันนี้\" (ตั้งต้นว่าง · จำนวนแก้ได้ · เอาออกได้ · ปุ่ม \"ระบุอะไหล่เพิ่มเติม\" เปิดการ์ดกรอกเอง) · รวมค่าอะไหล่ · ปุ่ม ย้อนกลับ · บันทึกอะไหล่ของรถ Condition ### Scenario 22 · กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส ช่วงงาน: เบิก/จัดหาอะไหล่ · เข้าจาก: แผนอนุมัติแล้ว (S2) ระบบส่งให้ทันที · จบที่: คลังรับทราบ แล้ว กบค. ติดตามและเบิกอะไหล่รายไตรมาสต่อ (S4) · ที่มา: เจ้าของงาน 2 พ.ย. 2569 _\"scen ต่อมา เป็น scen ที่ต่อจากอนุมัติ คือ ส่งไปหา กบค. คลัง ว่าแต่ละไตรมาสมีเบิกอะไหล่อะไรบ้าง แยกเป็นไตรมาสให้ด้วย\"_ + เลือก แทรกหลัง S2 ก่อน S4 · ดูและกดรับทราบ · ส่งทันทีที่อนุมัติทั้งปี · ปรับ 2 พ.ย. 2569 (เจ้าของงาน): _\"พอมี s22 ก็ต้องมี status ให้หน้าของ จนท กบค. ที่ทำเรื่องบำรุงรักษา รู้ว่า ไตรมาสไหน ได้รับการรับทราบแล้วด้วย\"_ + เลือก รับทราบทีละไตรมาส · แสดงที่หน้ารายละเอียดแผนและหน้ารายการแผน ⇒ คลังกดรับทราบทีละไตรมาส (ไตรมาสที่ไม่มีรถไม่ต้องรับทราบ) · กบค. เห็นสถานะในหน้ารายการแผน (คอลัมน์ คลังรับทราบ x/n ไตรมาส) และหน้ารายละเอียดแผน (แถบบอกในแท็บไตรมาส) · ข้อที่ผู้เขียนถือตามที่เสนอ: ยอดของแต่ละไตรมาสรวมจากอะไหล่ที่ กบค. เลือกให้รถของไตรมาสนั้น (S1 S21) · มีคงเหลือในคลังและจำนวนที่ไม่พอให้คลังเห็นล่วงหน้า · คลังไม่มีปุ่มส่งกลับหรือแก้รายการ ```mermaid flowchart LR S([start]) --> D0[\"ระบบส่งรายการ<br/>อะไหล่ทั้งปี<br/>แยกไตรมาส\"] D0 --> A0(\"กบค. คลัง<br/>ได้แจ้งเตือน<br/>หรือเปิดเมนู\") A0 --> D1[\"หน้า รายการแผน<br/>ที่ต้องเตรียม<br/>อะไหล่\"] D1 --> A1(\"เปิดแผน\") A1 --> D2[\"หน้า อะไหล่<br/>ที่ต้องเบิก<br/>แยกแท็บไตรมาส\"] D2 --> A2(\"ดูทีละไตรมาส<br/>เทียบคงเหลือ<br/>ในคลัง\") A2 --> A3(\"กดรับทราบ<br/>ไตรมาสนั้น<br/>+ ยืนยัน\") A3 --> D3[\"ไตรมาสนั้น<br/>รับทราบแล้ว\"] D3 --> D5[\"หน้ารายการและ<br/>รายละเอียดแผน<br/>ของ กบค. เห็น<br/>สถานะรายไตรมาส\"] D3 --> Q1{\"รับทราบครบ<br/>ทุกไตรมาส<br/>ที่มีรถ ?\"} Q1 -->|N| A2 Q1 -->|Y| D4[\"สถานะฝั่งคลัง<br/>รับทราบครบแล้ว\"] D4 --> E([End]) %% Q: A0 | Q42 ❓ กบค. คลัง คือบทบาทแยกในระบบ หรือ กบค. ที่ได้สิทธิ์คลัง · ได้แจ้งเตือนทางไหน %% Q: D2 | Q43 ❓ แก้แผนหลังอนุมัติ (S19 ส่งอนุมัติใหม่) ต้องส่งรายการให้คลังรับทราบใหม่ไหม · อะไหล่ไม่พอ คลังต้องแจ้งกลับ กบค. ไหม ``` Wireframe - หน้า รายการแผนที่ต้องเตรียมอะไหล่ — เลขที่ MR · ชื่อแผน · ปีงบประมาณ · จำนวนรถ · วันที่อนุมัติ · สถานะ (รอรับทราบ · รับทราบ x/n ไตรมาส · รับทราบครบแล้ว) · ค้นหา (เลขที่ MR · ชื่อแผน) - หน้า อะไหล่ที่ต้องเบิกรายไตรมาส — รายละเอียดแผน · แท็บไตรมาส 1 ถึง 4 (ป้ายบอกจำนวนรายการ) · ตาราง รายการอะไหล่ · รหัส · จำนวนที่ต้องเบิก · หน่วย · คงเหลือในคลัง · ไม่พอ · ไตรมาสที่ไม่มีรถ = Empty state \"ไม่มีอะไหล่ที่ต้องเบิก\" · ปุ่ม ย้อนกลับ · รับทราบไตรมาส n · ไตรมาสที่รับทราบแล้วมีแถบ \"รับทราบไตรมาส n แล้ว\" ไม่มีปุ่ม - ฝั่ง กบค. — หน้ารายการแผน คอลัมน์ \"คลังรับทราบ\" (ก่อนอนุมัติ \"-\" · หลังอนุมัติ \"x/n ไตรมาส\") · หน้ารายละเอียดแผน แถบในแท็บไตรมาส \"คลังรับทราบรายการอะไหล่ไตรมาส n แล้ว\" หรือ \"รอคลังรับทราบ…\" Condition ### Scenario 23 · ผู้รับจ้าง บันทึกงานรายคันและส่งตรวจงาน ช่วงงาน: ดำเนินการบำรุงรักษา (ต่อจาก S7 S8 ของแผนเดินทางจ้างดำเนินการ S9 · อยู่ลำดับเดียวกับ S10) · เข้าจาก: แจ้งเตือนแผนเดินทางจ้างดำเนินการที่อนุมัติแล้ว หรือหน้ารายละเอียดแผนเดินทาง (เห็นเฉพาะใบที่ตนรับจ้าง) · จบที่: ส่งตรวจงานครบทุกคันในใบ แล้ว กบค. ตรวจรับที่ S11 · เลขชั่วคราว: แยกจาก S10 เมื่อ 4 พ.ย. 2569 เจ้าของงานจะจัดเรียงเลข scenario ใหม่ทั้งหมดตอนท้าย · แยกจาก S10 (4 พ.ย. 2569 เจ้าของงาน): _\"แยกเป็นอีก scen นึงได้ป่ะ\"_ + _\"เดี๋ยวสุดท้ายจะจัดเรียงใหม่ทั้งหมด\"_ ⇒ ใช้เลข S23 ไปก่อน · หน้ารับรถ หน้าปิดงาน และ popup บำรุงรักษาไม่ได้ ใช้หน้าเดียวกับ S10 (เงื่อนไขอยู่ที่ S10) · ปรับ 4 พ.ย. 2569 รอบ 4 (เจ้าของงาน): _\"scen V ต้่องมีเพิ่มรายการได้ด้วย รวมทั้ง ตรง upload เอกสาร pdf และ ภาพ จะใช้สัญลักษณ์ไม่เหมือนกัน และ upload แล้ว จะมี progress bar ด้วย อิ้างอิงจากของเดิม\"_ ⇒ ปุ่ม \"เพิ่มอะไหล่\" ที่หัวตารางอะไหล่ · รายการไฟล์ใช้ไอคอนภาพกับไอคอนเอกสารต่างกัน · มีแถบความคืบหน้าแบบปลั๊กอิน Overhaul · ปรับ 3 พ.ย. 2569 รอบ 2 (เจ้าของงาน) มุมผู้รับจ้าง: _\"กบค จะเห็นหน้าคนละหน้า เห็นสถานะ ว่ารถคันนั้น ดำเนินการบำรุงรักษาแล้ว ปุ่มจะแสดงให้ส่งตรวจงาน โดยหน้าจอนี้ก็จะส่งไปยัง จนท กบค\"_ · _\"คนตรวจงานเป็นผู้รับจ้าง ส่งตรวจงาน\"_ · บำรุงรักษาไม่ได้ _\"ถ้าเป็นกบค จะสามารถปิดงานได้เลยไม่ต้องส่งตรวจ กรอกแค่สาเหตุพอ\"_ · อะไหล่ของคันที่ไม่ได้ทำ _\"มีให้กดส่งคืน ตอนที่กบค รับเรื่องจะเห็นว่ามีอะไหล่อะไรคืนบ้าง\"_ ⇒ แผนจ้างดำเนินการ: ผู้รับจ้างปิดงานหรือแจ้งบำรุงรักษาไม่ได้แล้วกด \"ส่งตรวจงาน\" รายคัน ไปตรวจรับที่ S11 · แผนที่ กบค. ดำเนินการเองจบที่ S10 เหมือนเดิม · ปรับ 4 พ.ย. 2569 (เจ้าของงาน) แยก view: _\"หน้าจอ ของ s10 น่าจะต้องมี 2 view คือ view ของ กบค และ view ของ vendor โดย vendor ดูรายละเอียดรายคัน จะเห็นแค่ ปุ่มเริ่มงาน และบำรุงรักษาได้ โดยไม่เห็นปุ้ม ลบ และแก้ไข แต่ว่า กบค จะเห็น อยากให้แยก view\"_ ⇒ จอ S10 แบ่งเป็น 2 ชุด \"กบค. —\" และ \"ผู้รับจ้าง —\" · ผู้รับจ้างเห็นปุ่ม \"บำรุงรักษาไม่ได้\" กับ \"เริ่มงาน\" (หรือ \"ปิดงาน\") เหมือน กบค. แต่ไม่มีแก้ไข ลบ ทั้งเมนู \"…\" ของรถและตารางอะไหล่ตามแผน · ปรับ 4 พ.ย. 2569 รอบ 2 (เจ้าของงาน) ผู้รับจ้างแก้ไข ลบ อะไหล่และภาพ: _\"หน้า i22-i26 ส่วนที่เป็นอะใหล่ที่ใช้จริง และ อะใหล่ส่งคืน ต้องมีสัญลักณ์ให้แก้ไขได้ ลบรายการได้ รูปภาพ แก้ไขได้ ลบได้ และกดแล้ว จพสามาถแก้ไข\"_ (I.22 อยู่ระหว่างบำรุงรักษา ถึง I.26 แจ้งบำรุงรักษาไม่ได้ ตามเลขจอตอนนั้น รวมรอตรวจรับ) ⇒ ตารางอะไหล่และอะไหล่ส่งคืนของผู้รับจ้างมีไอคอนแก้ไข ลบ ท้ายแถว · ภาพเป็นรายการไฟล์ลบได้และอัปโหลดใหม่ได้ · ยังไม่เริ่มยังดูอย่างเดียว ```mermaid flowchart LR S([start]) --> D1[\"หน้า รายละเอียด<br/>แผนเดินทาง<br/>มุมผู้รับจ้าง\"] D1 --> A1(\"เลือกรถ<br/>ทีละคัน\") A1 --> D2[\"หน้า งานรายคัน<br/>ยังไม่เริ่ม<br/>ดูอย่างเดียว\"] D2 --> Q1{\"บำรุงรักษา<br/>ได้ ?\"} Q1 -->|N| A3(\"กด บำรุงรักษา<br/>ไม่ได้ ระบุสาเหตุ<br/>+ อะไหล่ส่งคืน\") Q1 -->|Y| A2(\"กด เริ่มงาน<br/>รับรถ + ลงนาม<br/>(หน้าเดียวกับ S10)\") A2 --> D3[\"งานรายคัน<br/>อยู่ระหว่าง<br/>บำรุงรักษา\"] D3 -->|ทำต่อไม่ได้| A3 D3 --> A5(\"กด ปิดงาน<br/>กรอกผลงาน<br/>(หน้าเดียวกับ S10)\") A5 --> D4[\"งานรายคัน<br/>ดำเนินการ<br/>บำรุงรักษาแล้ว\"] A3 --> D5[\"งานรายคัน<br/>แจ้งบำรุงรักษา<br/>ไม่ได้\"] D4 -->|แก้ไข ลบ<br/>อะไหล่ ภาพ| A6(\"popup แก้ไขอะไหล่<br/>หรือ ยืนยัน<br/>เอาออก\") A6 --> D4 D4 --> A8(\"กด ส่งตรวจงาน<br/>+ ยืนยัน\") D5 --> A8 A8 --> D6[\"งานรายคัน<br/>รอตรวจรับ<br/>(ต่อ S11)\"] D6 --> Q2{\"กบค. ตรวจรับ<br/>ผ่าน ?\"} Q2 -->|Y| D7[\"เสร็จสิ้น หรือ<br/>บำรุงรักษาไม่ได้\"] Q2 -->|N| D8[\"หน้า งานรายคัน<br/>ส่งกลับแก้ไข<br/>+ เหตุผลจาก กบค.\"] D8 -->|ปิดงานไว้| A6 D8 -->|แจ้งไม่ได้ไว้| Q1 D7 --> Q3{\"มีคันอื่น<br/>ในใบ ?\"} Q3 -->|Y| D1 Q3 -->|N| E([End]) %% Q: A8 | Q49 ❓ ส่งตรวจงานทีละคันอย่างเดียว หรือเลือกหลายคันส่งพร้อมกันได้ด้วย ``` Wireframe - หน้า รายละเอียดแผนเดินทาง (มุมผู้รับจ้าง) — หน้าเดียวกับ S10 ข้อมูลใบจ้าง · ตารางรถในแผนเดินทางพร้อมสถานะงาน · ปุ่ม \"…\" ท้ายแถวมีแค่ \"ดูรายละเอียด\" - หน้า งานรายคัน (ยังไม่เริ่ม / อยู่ระหว่างบำรุงรักษา) (4 พ.ย. 2569 แยก view) — หน้าเดียวกับของ กบค. ปุ่มหัวหน้าเหมือนกัน (\"บำรุงรักษาไม่ได้\" และ \"เริ่มงาน\" หรือ \"ปิดงาน\") · กล่อง \"การนัดหมาย\" เป็นข้อมูลใบจ้าง (แผนเดินทาง · ผู้รับจ้าง · ช่วงวันทำงาน · สถานที่บำรุงรักษา · เบอร์ติดต่อ · เริ่มงานและผู้เริ่มงานเมื่อเริ่มแล้ว) · ตาราง \"รายการงานและอะไหล่ตามแผน\" ยังไม่เริ่มดูอย่างเดียว ไม่มีปุ่ม \"เพิ่มอะไหล่\" และไม่มีคอลัมน์ไอคอนแก้ไข ลบ · อยู่ระหว่างบำรุงรักษามีไอคอนแก้ไข ลบ ท้ายแถว (ยังไม่มีปุ่มเพิ่มอะไหล่) และ \"ภาพก่อนเริ่มงาน\" เป็นรายการไฟล์ลบได้อัปโหลดใหม่ได้ (4 พ.ย. 2569 รอบ 2) · กดเริ่มงานและปิดงานไปหน้ารับรถและหน้าปิดงานเดียวกับ กบค. - หน้า งานรายคัน (ดำเนินการบำรุงรักษาแล้ว / แจ้งบำรุงรักษาไม่ได้) [เสนอ] — หน้างานรายคันเดิม ป้ายสถานะตามกรณี · ข้อมูลที่บันทึกไว้ (ผลงานจากหน้าปิดงาน หรือสาเหตุที่บำรุงรักษาไม่ได้) · ตาราง \"อะไหล่ส่งคืน\" · ตาราง \"รายการงานและอะไหล่ที่ใช้จริง\" และ \"อะไหล่ส่งคืน\" มีไอคอนแก้ไข ลบ ท้ายแถว ภาพก่อนเริ่มงานเป็นรายการไฟล์ลบได้อัปโหลดใหม่ได้ (4 พ.ย. 2569 รอบ 2) · ปุ่ม \"แก้ไขงาน\" (เปิดหน้าปิดงานหรือ popup บำรุงรักษาไม่ได้ ค่าเดิมกรอกไว้) และปุ่มหลัก \"ส่งตรวจงาน\" - หน้า งานรายคัน (รอตรวจรับ) — ไม่มีปุ่มที่หัวหน้า · อะไหล่ที่ใช้จริง อะไหล่ส่งคืน และภาพ แก้ไข ลบ ได้แบบเดียวกับก่อนส่ง (4 พ.ย. 2569 รอบ 2) · กล่อง \"การนัดหมาย\" ต่อท้าย \"ส่งตรวจงานเมื่อ {วันที่ เวลา}\" และ \"ผู้ส่ง\" - หน้า งานรายคัน (ส่งกลับแก้ไข) — บนสุดกล่องแจ้ง \"กบค. ส่งกลับให้แก้ไข\" พร้อมเหตุผลที่ กบค. ระบุ (แบบกล่องแจ้งของแผนเดินทางที่ถูกส่งกลับ S6) · ปุ่มตามกรณีในตาราง Condition Condition ยังไม่เคาะ — ~~ต้องมีหน้ารายการแผนเดินทางของผู้รับจ้างไหม (Q48)~~ ไม่ต้องมี เป็นความรับผิดชอบของผู้รับจ้าง (เจ้าของงาน 4 พ.ย. 2569) · ส่งตรวจงานเลือกหลายคันพร้อมกันได้ไหม (Q49) · ~~ผู้รับจ้างแก้ไขงานหลังกด \"ส่งตรวจงาน\" แล้วได้ไหม~~ ได้ เฉพาะอะไหล่และภาพ (4 พ.ย. 2569 รอบ 2) — แก้ระหว่างรอตรวจรับแล้ว กบค. ต้องเห็นว่ามีการแก้หลังส่งไหม · แก้ภาพมีแค่ลบแล้วอัปโหลดใหม่ (รายการไฟล์ของ File upload ไม่มีปุ่มแก้ไข และ Images ของไลบรารีไม่มีปุ่มแก้ไข ลบ) พอไหม · อะไหล่ที่ผู้รับจ้างเพิ่มเอง กบค. ต้องอนุมัติแยกไหม และคิดค่าอะไหล่อย่างไร · ปุ่ม \"แก้ไขงาน\" ของผู้รับจ้างหลังปิดงาน (ก่อนส่งตรวจ) ยังคงไว้ไหม · ผู้ลงนามรับมอบรถฝั่งผู้รับเหมาในหน้ารับรถ (หน้าเดียวกับ S10 ที่ผู้รับมอบเป็น กบค.) · เลข scenario ชั่วคราว รอจัดเรียงใหม่ทั้งหมด"},{"h":"2.1 เส้นว่าจ้าง (ผู้รับจ้าง)","head":null,"rows":[],"note":"- สร้างแผน: S9 (ทำแล้ว 3 พ.ย. 2569) ฟอร์มเดียวกับ S6 เลือก \"จ้างดำเนินการ\" แล้วเลือกผู้รับจ้างจาก vendor list ผ่าน S7 และ S8 - ผู้รับจ้างเห็นเฉพาะรถที่ กบค. เลือกให้ และบันทึกงานรายคัน: S23 (แยกจาก S10 4 พ.ย. 2569 · ปรับ 3 พ.ย. 2569: ปิดงานหรือแจ้งบำรุงรักษาไม่ได้แล้วกด \"ส่งตรวจงาน\" รายคัน · ถูกส่งกลับแก้แล้วส่งใหม่) - กบค. ติดตามความคืบหน้ารายคัน และ approve งานรายคันเมื่อผู้รับจ้างทำเสร็จ: S11 (ปรับ 3 พ.ย. 2569: ตรวจรับรายคัน อนุมัติ หรือส่งกลับแก้ไขพร้อมเหตุผล · รับคืนอะไหล่ตอนอนุมัติ)"},{"h":"3. คำถาม — ❓ ทั้งชุด (Q บนบอร์ดเขียนกำกับว่า \"บอร์ด\")","head":["#","คำถาม","scenario","ถามใคร"],"rows":[["Q1","~~ผพจ. ย่อจากอะไร · หัวหน้า ผพจ. แยกบทบาทไหม~~ ไม่ต้องตอบแล้ว 30 ต.ค. (อนุมัติไม่ผ่าน ผพจ. · S3 พักไว้)","—","—"],["Q2","~~รายการอะไหล่ที่ระบบคำนวณ ให้ กบค. แก้ได้ไหม~~ ✅ ตอบแล้ว 2 พ.ย. 2569: แก้ได้รายคันที่ S21","S21","—"],["Q3","~~\"ตรวจ/เตรียมอะไหล่เพื่อใช้ในไตรมาส\" ทำในระบบหรือนอกระบบ~~ ตัดขั้นนี้ออกจาก S2 แล้ว 30 ต.ค.","—","—"],["Q4","~~รูปแบบเลขงาน~~ ไม่ต้องตอบแล้ว S3 ตัดออก 2 พ.ย. 2569 (เลขที่ MR ออกตอนสร้างแผน)","—","—"],["Q5","~~ไม่อนุมัติรายการอะไหล่แล้ว \"ทำเรื่องคืนอะไหล่\" คือคืนอะไร~~ ไม่ต้องตอบแล้ว S3 ตัดออก 2 พ.ย. 2569","—","—"],["Q6","S3 ตัดออก 2 พ.ย. 2569 · ยังเหลือ: อะไหล่ที่คงเหลือไม่พอตอนเบิก (S4) จัดซื้อนอกระบบ หรือต้องบันทึกในระบบ","S4","เจ้าของงาน"],["Q7","~~ความพร้อมรถใครตอบ~~ ไม่ต้องตอบแล้ว ตัดการตรวจรถที่ S4 2 พ.ย. 2569","—","—"],["Q8","~~นำรถออกจากไตรมาสหลังอนุมัติ~~ ไม่ต้องตอบแล้ว ตัดการนำรถออกที่ S4 2 พ.ย. 2569 (เอารถออกให้แก้แผนที่ S19)","—","—"],["Q9","\"ระบบจองอะไหล่\" คือระบบไหน เชื่อมกับ VMS+ ยังไง","S4","กฟภ."],["Q10","~~ตัดสินใจว่าจ้างต่อแผนทั้งใบ หรือต่อคัน/พื้นที่~~ ✅ ตอบแล้ว 3 พ.ย. 2569: เลือกต่อแผนเดินทาง (ฟอร์มแผนเดินทางมีรูปแบบดำเนินการ) ไตรมาสเดียวมีทั้งสองแบบได้","S6 · S9","—"],["Q11","~~สถานที่บำรุงรักษาคือจุดรวมงานไหม~~ ✅ ตอบแล้ว 2 พ.ย. 2569: ระบุรายคัน ค่าเริ่มต้นสำนักงานที่รถอยู่ · เรื่องวางอะไหล่ไม่ต้องตอบแล้ว (S9 ตัดออก 3 พ.ย.)","S6","—"],["Q12","~~Notification ส่งช่องทางไหน · เจ้าของรถต้องตอบรับวันไหม~~ ✅ ตอบแล้ว: in-app · e-mail · push notification (2 พ.ย.) · ดูอย่างเดียว ไม่ต้องตอบรับ (3 พ.ย.)","S8","—"],["Q13","ผู้รับจ้างเข้า VMS+ ทางไหน มีบัญชีภายนอกไหม","S9 · S23","กฟภ."],["Q14","\"ทำเรื่องซื้ออะไหล่\" ของผู้รับจ้าง ทำนอกระบบหรือบันทึกในระบบ","เส้นว่าจ้าง (2.1)","เจ้าของงาน"],["Q15","(บอร์ด) ผู้รับจ้างต้องเสนอแผนใหม่? มี limit ไหม? ต้องบอกใครบ้าง? ใครต้องทำอะไรต่อบ้าง? (ของ S8 เดิม · ใช้กับเส้นว่าจ้างถ้ายังมีแผนเดินทางของผู้รับจ้าง)","เส้นว่าจ้าง (2.1)","กฟภ."],["Q16","~~กรย. พบอะไหล่ไม่พร้อม แจ้งใคร ผ่านระบบไหม~~ ไม่ต้องตอบแล้ว: เตรียมอะไหล่ประสานกันเองนอกระบบ (S9 ตัดออก 3 พ.ย.)","—","—"],["Q17","(บอร์ด) ระบบต้อง stamp ระยะเวลาจากภาพก่อนเริ่มถึงจบงานไหม","S10","กฟภ."],["Q18","(บอร์ด) ชั่วโมงเครื่องจักร (ภาพถ่ายหรือกรอกข้อมูล?) · อะไหล่เก่า? · อะไหล่ใหม่ (ถ้าเหลือ?)","S10","กฟภ."],["Q19","~~(บอร์ด) กรณีที่ไม่สามารถบำรุงรักษาได้ จำเป็นต้องใช้ form รูปแบบเดียวกันไหม? หากแยกกันจะต้องมี field อะไรบ้าง?~~ ✅ ตอบแล้ว 3 พ.ย. 2569: แยกเป็น popup กรอกแค่สาเหตุ + รายการอะไหล่ส่งคืน","S10 · S13","—"],["Q20","~~ตรวจสอบงานผู้รับจ้างไม่ผ่าน ส่งกลับยังไง~~ ✅ ตอบแล้ว 3 พ.ย. 2569: ผลการพิจารณาแบบ S2 เลือกส่งกลับแก้ไข กรอกเหตุผล ผู้รับจ้างเห็นเหตุผลที่หน้างานรายคัน แก้แล้วส่งตรวจงานใหม่","S11","—"],["Q21","ผลตรวจน้ำมันเป็นตัวเลขหรือผ่าน/ไม่ผ่าน · แนบใบผลแล็บไหม","S12","กฟภ."],["Q22","(บอร์ด) ประเมินความพึงพอใจ (ต้องทำทุกครั้ง?) · แบบประเมินมีข้อ/สเกลอะไร","S14","กฟภ."],["Q23","เจ้าของรถไม่ยอมรับผล ทำยังไง · \"หน่วยงาน\" กับ \"เจ้าของรถ\" คนเดียวกันไหม","S13","เจ้าของงาน"],["Q24","คันที่บำรุงรักษาไม่ได้ นับว่าเสร็จไหม ส่งประวัติได้ไหม","S15","เจ้าของงาน"],["Q25","รายงานผลมีหัวข้ออะไร รูปแบบไฟล์","S17","กฟภ."],["Q26","\"ค่าแรง\" กับ \"ค่าเบี้ยเลี้ยง\" รายการเดียวกันไหม · ต้นทุนรวมอะไหล่/ค่าจ้างไหม","S18","เจ้าของงาน"],["Q28","การยอมรับผล 2 รอบ (รายคัน S13 + ครบทุกคัน S14) จำเป็นทั้งคู่ไหม หรือรอบเดียวพอ","S13 · S14","เจ้าของงาน"],["Q29","~~เลือกได้ทีละภาคหรือหลายภาค · ประเภทรถเลือกได้หลายประเภทไหม~~ ✅ ตอบแล้ว 2 พ.ย. 2569: เลือกได้หลายค่าทั้งภาค เขต ประเภทรถ · ยังเหลือ: ประเภทรถอ้างรายการจากทะเบียนรถ VMS+ ชุดไหน","S1","เจ้าของงาน"],["Q30","รถสถานะรอยุบ/โอน ซ่อนตั้งแต่ตอนเลือก หรือแสดงแต่เลือกไม่ได้","S1","เจ้าของงาน"],["Q27","ชื่อ scenario หัวบอร์ด \"กบค.ทำงานรายการซ่อม หลังจากได้รับใบงานการแจ้งซ่อม\" เป็นของบอร์ดนี้จริงไหม","—","เจ้าของงาน"],["Q31","รายการปีงบประมาณในช่องเลือก แสดงย้อนหลังและล่วงหน้ากี่ปี (เจ้าของงานบอก \"ไม่จำกัดปี\")","S1","เจ้าของงาน"],["Q32","ผู้อนุมัติแผนคือใคร (ผู้บังคับบัญชาตามสาย หรือหัวหน้า กบค.) · อนุมัติกี่ชั้น · กบค. เลือกผู้อนุมัติเองไหม","S1 · S2","เจ้าของงาน"],["Q34","แผนที่อนุมัติแล้ว แก้เรื่องเล็กน้อย เช่น ชื่อแผน ต้องส่งอนุมัติใหม่ทุกครั้งหรือไม่ (ตอนนี้ใส่ไว้ก่อนว่าต้องส่งทุกครั้ง)","S19","เจ้าของงาน"],["Q35","แผนที่อนุมัติแล้วแต่ยังไม่เริ่มงาน จะเอาออกอย่างไร (ไม่มียกเลิกแผน · ตอนนี้ลบไม่ได้)","S20","เจ้าของงาน"],["Q36","~~แผนเดียวมีรถได้หลายเขตไหม~~ ✅ ตอบแล้ว 2 พ.ย. 2569: ได้ เลือกเขตได้หลายเขต","S1","—"],["Q37","~~ระบบคำนวณอะไหล่ของแต่ละคันจากข้อมูลอะไร~~ ✅ ตอบแล้ว 2 พ.ย. 2569: ระบบไม่คำนวณ กบค. เลือกเอง","S21","—"],["Q38","เอารถออกจากแผนแล้ว อะไหล่ที่เพิ่มเองของคันนั้นหายไปด้วยใช่ไหม","S21","เจ้าของงาน"],["Q39","เงื่อนไขอายุการใช้งานของน้ำมันคืออะไร นอกจากอายุ 3 ปี · คันที่เลือกเปลี่ยนน้ำมัน ยังต้องเก็บตัวอย่างและบันทึกผลตรวจ (S10 S12) ไหม","S21 · S10 · S12","เจ้าของงาน"],["Q40","~~ต้องเลือกอะไหล่ครบทุกคันก่อนส่งอนุมัติไหม~~ ✅ ตอบแล้ว 2 พ.ย. 2569: ไม่บังคับ","S1","—"],["Q41","อะไหล่ที่เหลือจากไตรมาสหนึ่ง คืนคลังหรือยกไปใช้ไตรมาสถัดไป (ตอนนี้ใส่ไว้ก่อนว่าคืนคลังตามเดิม)","S4 · S11","เจ้าของงาน"],["Q42","กบค. คลัง คือบทบาทแยกในระบบ หรือ กบค. ที่ได้สิทธิ์คลัง · ได้แจ้งเตือนทางไหน","S22","เจ้าของงาน"],["Q43","แก้แผนหลังอนุมัติ (S19 ส่งอนุมัติใหม่) ต้องส่งรายการให้คลังรับทราบใหม่ไหม · อะไหล่ไม่พอ คลังต้องแจ้งกลับ กบค. ไหม","S22","เจ้าของงาน"],["Q44","แผนเดินทาง: ฟอร์มที่ยังไม่ยืนยันกันรถไว้ไหม · ยกเลิกหรือแก้ไขแผนเดินทางที่ยืนยันแล้ว รถกลับมาเลือกได้ไหม · ลบรถออกจากตารางต้องถามยืนยันไหม · รถครบทุกคันแล้วปุ่มสร้างแผนเดินทางกดไม่ได้ไหม","S6","เจ้าของงาน"],["Q45","ผู้อนุมัติแผนเดินทางที่ได้จาก API getUpperLower คือตำแหน่งไหน (หัวหน้า กบค. หรือไม่) · อนุมัติชั้นเดียวหรือหลายชั้น · ได้แจ้งเตือนทางไหน","S7","เจ้าของงาน"],["Q46","vendor list ของแผนเดินทางจ้างดำเนินการมาจากไหน (ทะเบียนผู้รับจ้างของ กฟภ. หรือ กบค. เพิ่มเอง) · กรองตามประเภทรถไหม · เลขที่สัญญา/ใบสั่งจ้างบังคับไหม","S9","เจ้าของงาน"],["Q48","~~งานรายคัน S23 (เดิม S10): มุมผู้รับจ้างเห็นหน้ารายละเอียดแผนเดินทางแบบกรองเฉพาะรถในใบไหม · ต้องมีเมนูรวมงานรายคันแบบ Job list (ค้นทะเบียน กรองสถานะ) ไหม · บำรุงรักษาไม่ได้แล้วรถไปไหนต่อ~~ ✅ 4 พ.ย. 2569 เจ้าของงาน _\"แผนการเดินทางของผู้รับจ้าง ไม่ต้องมีเนื่องจากเป็นความรับผิดชอบของผู้รับจ้าง\"_ ⇒ ไม่มีหน้ารายการแผนเดินทางของผู้รับจ้าง","S23","เจ้าของงาน"],["Q49","ผู้รับจ้างส่งตรวจงานทีละคันอย่างเดียว หรือเลือกหลายคันส่งพร้อมกันได้ด้วย","S23 · S11","เจ้าของงาน"],["Q50","จนท. กบค. ที่ตรวจรับงานผู้รับจ้างคือใคร ผู้สร้างแผนเดินทาง หรือ กบค. คนใดก็ได้ในหน่วย · ได้แจ้งเตือนทางไหน","S11","เจ้าของงาน"],["Q51","ป้าย \"รอผลตรวจน้ำมัน\" ที่หน้าข้อมูลรถรายคัน (Vehicle Management ของระบบเดิม) ทำเมื่อไหร่ ใครดูแลหน้านั้น · หลังปิดงานแผนจ้างดำเนินการ ใครเป็นคนใส่ผล","S12","เจ้าของงาน"],["Q47","เบอร์ติดต่อในแผนเดินทาง: เบอร์เจ้าของรถดึงจากข้อมูลไหน (ผู้รับผิดชอบหลักของรถแบบหน้า MA Appointment หรือเบอร์หน่วยงาน · มือถือหรือเบอร์ภายใน) · ตรวจรูปแบบเบอร์ไหม · หน้าอนุมัติ S7 และหน้าดูอย่างเดียว S8 ต้องแสดงเบอร์ด้วยไหม","S6 S9","เจ้าของงาน"],["Q33","~~เลขที่ MR: Z คืออะไร · 69 คือปีไหน · ลำดับรีเซ็ตไหม~~ ✅ ตอบแล้ว 30 ต.ค. 2569: Z = เขตของการไฟฟ้า (Z = สำนักงานใหญ่) · 69 = ปีที่เลือกตอนสร้างแผน · ลำดับนับต่อกันภายในปีที่เลือก","S1","—"]],"note":""},{"h":"4. จุดที่บอร์ดขัดกับที่เคาะไว้ในต้นแบบ/ผัง 00–06 (ยังไม่แก้ฝั่งไหน — รอเคาะว่าอันไหนชนะ)","head":["เรื่อง","บอร์ด (ไฟล์นี้ยึดตาม)","ต้นแบบ / ผัง Diagram 00–06","วันที่เคาะของเดิม"],"rows":[["ใครอนุมัติแผน + ออกเลขงาน","✅ เคาะแล้ว 30 ต.ค. 2569 — อนุมัติแผนยังมี แต่ส่งเข้าสายอนุมัติทั่วไป ไม่ผ่าน ผพจ. (S2) · เลขงานไม่มีในระบบ แยกออกไปก่อน (S3 พักไว้)","กบค. ออกเลขเอง · ฝ่ายพัสดุแค่รับทราบ","8 ส.ค. 2569"],["สถานะรถตอนเข้าแผน","ต้องไม่ใช่รอยุบ/โอน (S4)","เลือกได้ทุกสถานะ เป็นแค่คำเตือน","17 ส.ค. 2569"],["ยืนยันรถกับหน่วยงาน","มีแค่ sticky \"เห็นรถพร้อม/ไม่พร้อม\" ไม่มีเลนตอบ (S4)","ถาม-ตอบ 2 รอบ (ยืนยันรถ · เลือกวันนัด)","9 ส.ค. 2569"],["ตรวจรับ","หลังบำรุง = หน่วยงาน/เจ้าของรถยอมรับผล 2 รอบ + ประเมินความพึงพอใจ (S13 · S14)","เปลี่ยนเป็น \"ตรวจสภาพก่อนซ่อม\" ย้ายไปก่อนลงมือ · ผัง 03 บอกผู้รับทราบคือ \"หน่วยงานพัสดุ\"","20 ส.ค. 2569"],["สายว่าจ้าง","ผู้รับจ้างทำแผนเดินทาง กบค. อนุมัติ (S7 · S8)","ยังไม่ทำในต้นแบบ","—"],["ต้นทุน","ค่าแรง · ที่พัก · เดินทาง หลังปิดงาน (S18)","เบี้ยเลี้ยง · ที่พัก · เดินทาง กรอกตอนรายงาน แล้วเฟสต้นทุนแสดงรวม + ส่งอนุมัติปิดแผนไตรมาส","17 ส.ค. 2569"],["โครงแผน","✅ เคาะแล้ว 30 ต.ค. 2569 — 1 แผน = 1 ปีงบประมาณ (เลือกปีได้ทุกปี) จัดรถลงไตรมาส 1 ถึง 4 ในฟอร์มสร้างแผน · 1 คันอยู่ไตรมาสเดียว · ขั้นหลังจากนั้นทำรายไตรมาส","1 แผน = ทั้งปีงบ รถแยกรายไตรมาส · แผนล่วงหน้า 2 ปี · รอบทบทวน · หน้าไตรมาส 6 แท็บ — โครงปี + ไตรมาสตรงกับของเดิมแล้ว เหลือต่างเรื่องแผนล่วงหน้า 2 ปีและรอบทบทวน","17–28 ส.ค. 2569"],["ยื่นของบ / ทบทวนแผน","✅ เคาะแล้ว 22 ต.ค. 2569 — ไม่ทำ เริ่มที่สร้างแผน (S1) · ไม่มีรอบทบทวน · (30 ต.ค.) ปีงบประมาณกลับมาเป็นช่องเลือกปีของแผน ไม่ผูกกับการของบ","แผนล่วงหน้า 2 ปี (ทำปี N ได้แผน N+2) + รอบทบทวน \"สรุปแผนก่อนออกปฏิบัติงาน\" ปลายปีงบ (ผัง 00 · 01 · 02 + ต้นแบบ maintainance-yearly) — ยังไม่ได้แก้ผัง 00–02 และต้นแบบเดิม","17 ส.ค. 2569"]],"note":""}]}};

/* ======================== maintainance-plugin/screens.js ======================== */
/* ============================================================================
   Maintain-D — บำรุงรักษาตามวาระ · จอตาม userflow ครบ 18 scenario จาก component จริง (รอบแรก 20 ต.ค. เส้นของ กบค. 9 scenario · รอบสอง 22 ต.ค. อีก 9 scenario ของ ผพจ. ผู้รับจ้าง กรย. หน่วยงาน หัวหน้า · 30 ต.ค. แผนปี + จัดรถรายไตรมาส · S2 อนุมัติทั่วไป · S3 พักไว้ เหลือ 17 scenario)
   ----------------------------------------------------------------------------
   เจ้าของงานสั่ง 20 ต.ค. 2569: "ขึ้น ui figma … แยกออกจากเรื่อง overhaul" และ
   "ลองขึ้นโดยอาศัย component และการ[ออกแบบ]ของ flow อื่น มาประกอบกัน"
   ⇒ ทุกชิ้นเป็น instance: (1) component ไลบรารี (Component) VMS Plus นำเข้าด้วย key · (2) component ที่ทีมออกแบบทำไว้ใน flow งานซ่อม
      ของไฟล์ Maintain-D (local): PartRequestStepPanel (เบิกอะไหล่ Smart Inventory) · IncidentPhotoGallery (ภาพ) · VehicleAndReporterInfo (ข้อมูลรถ) ·
      SummaryRequestedParts (สรุปรายการเบิก) — ไฟล์ที่ไม่มี component เหล่านี้ ปลั๊กอินใช้แบบสำรองจากไลบรารีแล้วรายงาน
   ต้นทาง: Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md · ตารางจับคู่: figma-export/maintainance-component-map.md
   กติกา: figma-export/component-rules.md (R1–R18) · ตารางไม่เกิน 8 คอลัมน์ทุกตาราง (ใช้ component Table ทั้งก้อนได้)
   export (22 ต.ค. 2569 · ปรับให้ตรงเงื่อนไข Overhaul ใน plan.md หัวข้อ 🎯 + component-rules ข้อ 5.1 R19 · ข้อ 5.4 R26):
     ปุ่ม ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component · ป้าย Device Type · 1 scenario = 1 บล็อกตัวอักษร · A.1 A.2 = state
     + ผัง userflow ของ scenario นั้นซ้ายสุดของบล็อก (FLOW_NODES ผูกจอกับกล่องในผัง) · ทุกปุ่มวางบนหน้า "Maintainance" ต่อใต้ของเดิม
   ============================================================================ */

const PLUGIN = { prefix: 'MT', page: 'Maintainance', menu: 'บำรุงรักษาตามวาระ', searchHint: 'ค้นหาเลขที่ MR, ชื่อแผน' };

/* ---------- component ที่ใช้ — ขาดตัวไหนหยุด (ไลบรารี) · NESTED = ชิ้นซ้อนใน component อื่น · LOCAL_OPTIONAL = ของไฟล์ Maintain-D ไม่มีก็ใช้แบบสำรอง ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Table header',
  'Table pagination', 'Text input', 'Input dropdown', 'Input dropdown with badges', 'Text area', 'Number input', 'File upload', 'Input label', 'List with checkbox', 'Alert', 'Pill outline',
  'Primary button', 'Secondary button', 'Secondary danger button', 'Tertiary button', 'Dropdown list', 'Background overlay', 'Modal', 'Notification',
  'Empty state/Data empty', 'Radio text card', 'Images', 'Date picker', 'Checkbox with description',
  'add-24-300-round', 'filter_list-24-400-round', 'more_horiz-20-400-round', 'delete-24-300-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round',
  'cloud_upload-24-300-round', 'stylus-24-300-round', 'quick_reference_all-24-300-round', 'description-24-300-round', 'Dropdown menu',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header', 'Modal footer', 'Tabs', 'Notification card', 'Horizontal radio groups', 'Checkbox text card'];
const NESTED = ['_Dropdown menu item', 'Nav button', 'Tab item', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Primary danger button',
  '_Content item base', '_File upload item base', 'List with checkbox item', 'List header item', 'Checkbox', 'Badge outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Radio button', '_Notification item base', 'Status'];
const LOCAL_OPTIONAL = ['RepairFeedback', 'ReturnPart', 'PartRequestStepPanel', 'PartsInventoryPanel', 'RequestedPartsPanel', 'Spare Part Card Item', 'IncidentPhotoGallery', 'VehicleAndReporterInfo', 'SummaryRequestedParts',
  'ReceiptChecklist', 'HandoverSignature', 'Modal Signature', 'InspectionChecklist',   // รับรถ / ลงนาม / ตรวจสภาพ ของงานซ่อม (S10 · 3 พ.ย. 2569) ไม่มีในไฟล์ → แบบสำรองจากไลบรารี
  'Device Type', 'Component 1', 'Header'];   // Device Type = ป้าย Device/Desktop/Mobile ชุดเดียวกับ Overhaul (22 ต.ค. 2569 · Component 1 = ตัวสำรองชุดเก่า) · Header = แถบรหัส flow ของทีมออกแบบ (ไลบรารีอื่น หาจาก instance ในไฟล์)
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี (ดัมป์ 19 ต.ค. 2569) — ตัวที่ core ยังไม่มี */
/* รูปแบบบรรทัดต้องเหมือน KEYS ใน core ("ชื่อ": ["key", set]) — test harness อ่าน key ด้วย regex จากซอร์ส */
Object.assign(KEYS, {
  "Input dropdown with badges": ["705d2a75bc12121c2c1c0a9737327fbc1ea60696", true],
  "Images": ["39fe2574c3dcfeebe3eded7a76fecbc04ee41ef7", true],
  "Radio text card": ["e4510738f989bb24dbfb70fe6acfbf5705dcd60b", true],
  "Radio button": ["b29b98831c56216e005bb1c403e3f833d5e0f1cf", true],
  "Modal footer": ["78e84b8dfd520b686df45c5219feaf5f64a4bcec", true],
  "description-24-300-round": ["e42bf9bc8971c1449df0a602f3beca96cd3e5b77", false],   // ไอคอนเมนู "ผลการทดสอบน้ำมันไฮโดรลิก" (3 พ.ย. 2569)
  "Horizontal radio groups": ["50c917f3a90caf41227efab4841d0ce003c468dc", false],   // key ของไฟล์ Component (ดัมป์ 19 ต.ค.) · 11d953b1… ที่ UI Release#2 ใช้เป็นไลบรารีอื่น นำเข้าไม่ได้
  "Notification card": ["8b00e80ca7ead162e5de06e8cc261b86d5904c32", false],
  "_Notification item base": ["5e4101e154462cac0b912c28d0499b61f84c3001", false],
  "Status": ["65871480cb419a27224a15825374bc1486ab34d6", true],
  "Checkbox with description": ["dfc323f6bb605f586c4928ecb08c77acfb241f53", false],
  "Rating": ["1d3c2e045977bc6b2b407cdd2c82eb43dc00325a", true],
  "Checkbox text card": ["a29fe414b23f6ac84089cc837b8f2ff06ac561a3", true]
});

/* ---------- ข้อมูลตัวอย่าง (ยกชื่อรถ/หน่วยงาน/จังหวัดจาก maintainance-yearly/mock-yearly.js — ค่าสมมติทั้งหมด) ---------- */
const PST = { review: ['รออนุมัติ', 'Warning'],   // 30 ต.ค. 2569: ส่งอนุมัติทั่วไป ไม่ผ่าน ผพจ.
  returned: ['ส่งกลับแก้ไข', 'Error'], approved: ['อนุมัติแล้ว', 'Brand'], active: ['ดำเนินการ', 'Info'],
  hist: ['รอหัวหน้าตรวจสอบ', 'Warning'], passed: ['ประวัติผ่านแล้ว', 'Success'], closed: ['ปิดงานแล้ว', 'Gray'] };
/* 22 ต.ค. 2569 เจ้าของงาน: ไม่ทำเรื่องยื่นของบ/ทบทวนแผน · เริ่มที่สร้างแผน · เลือกรถตามภาค + ประเภทรถ
   30 ต.ค. 2569 เจ้าของงาน: แผนปี — เลือกปีงบประมาณได้ทุกปี แล้วจัดรถลงไตรมาส · ส่งอนุมัติทั่วไป (ไม่ผ่าน ผพจ.) · ไม่มีเลขงานในระบบ (S3 พักไว้)
   ⇒ ช่องที่ 0 = เลขที่ MR (Maintenance Request) รูปแบบจริงที่เจ้าของงานให้ 30 ต.ค. 2569 "MR Z69000XX" = MR + เขตการไฟฟ้า (Z = สำนักงานใหญ่ ที่ตั้ง กบค.) + ปีที่เลือกตอนสร้างแผน 2 หลัก + ลำดับ 5 หลักนับต่อกันในปีนั้น (ไม่ใช่เลขงาน) · ช่องที่ 3 = ไตรมาสที่กำลังทำ (ขั้น S4 เป็นต้นไปทำรายไตรมาส) · ช่องที่ 8 = ปีงบประมาณ · ช่องที่ 9 = รถรายไตรมาส */
const PLANS = [   // เลขที่ MR · ชื่อแผน · ภาค · ไตรมาสที่กำลังทำ · จำนวนรถ · สถานะ · วันที่สร้าง · ประเภทรถ · ปีงบประมาณ · รถรายไตรมาส
  ['MR Z7000001', 'บำรุงรักษารถกระเช้า ภาค 1 ปีงบประมาณ 2570', 'ภาค 1 (เหนือ)', 'ไตรมาส 1', '12', 'active', '03/10/2569', 'รถกระเช้า', '2570', 'ไตรมาส 1: 6 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 1'],
  ['MR Z7000002', 'บำรุงรักษารถเครน ภาค 2 ปีงบประมาณ 2570', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 2', '8', 'approved', '05/10/2569', 'รถเครน', '2570', 'ไตรมาส 1: 0 · ไตรมาส 2: 4 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MR Z7000003', 'บำรุงรักษารถขุด ภาค 3 ปีงบประมาณ 2570', 'ภาค 3 (กลาง)', 'ไตรมาส 1', '6', 'review', '17/10/2569', 'รถขุด', '2570', 'ไตรมาส 1: 2 · ไตรมาส 2: 2 · ไตรมาส 3: 1 · ไตรมาส 4: 1'],
  ['MR Z7100001', 'บำรุงรักษารถกระเช้า ภาค 4 ปีงบประมาณ 2571', 'ภาค 4 (ใต้)', 'ไตรมาส 1', '9', 'returned', '12/10/2569', 'รถกระเช้า', '2571', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 2 · ไตรมาส 4: 2'],
  ['MR Z6900011', 'บำรุงรักษารถกระเช้า ภาค 1 ปีงบประมาณ 2569', 'ภาค 1 (เหนือ)', 'ไตรมาส 4', '10', 'closed', '02/06/2568', 'รถกระเช้า', '2569', 'ไตรมาส 1: 3 · ไตรมาส 2: 3 · ไตรมาส 3: 2 · ไตรมาส 4: 2']];
const NEW_PLAN = ['MR Z7000004', 'บำรุงรักษารถกระเช้า ภาค 2 ปีงบประมาณ 2570', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ไตรมาส 1', '6', 'review', '30/10/2569', 'รถกระเช้า', '2570', 'ไตรมาส 1: 3 · ไตรมาส 2: 2 · ไตรมาส 3: 1 · ไตรมาส 4: 0'];
const REGIONS = ['ภาค 1 (เหนือ)', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ภาค 3 (กลาง)', 'ภาค 4 (ใต้)'];
/* เขตภายใต้ภาค (R35 · เจ้าของงาน 2 พ.ย. 2569 "ภาคเหนือ มี 3 เขต เขาก็จะเลือก ภาค แล้วจึงเลือก เขต ภายใต้ภาค แล้วถึงเห็นรถ")
   ค่าย่อและ placeholder "เลือกเขต" ตาม Input dropdown ของหน้า 5.9 EV Charging Station ใน UI Release#2 */
const DISTRICTS = { [REGIONS[0]]: ['กฟน.1', 'กฟน.2', 'กฟน.3'], [REGIONS[1]]: ['กฟฉ.1', 'กฟฉ.2', 'กฟฉ.3'], [REGIONS[2]]: ['กฟก.1', 'กฟก.2', 'กฟก.3'], [REGIONS[3]]: ['กฟต.1', 'กฟต.2', 'กฟต.3'] };
const dCode = (c) => c[2].split(' ')[0];   // รหัสเขตของรถ จากหน่วยงานเจ้าของรถ
/* รถที่เข้าเงื่อนไข ภาค 2 + รถกระเช้า (ค่าสมมติ) — ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานะรถ */
const CAND = [['82-6789 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok'], ['82-1145 ขอนแก่น', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 ขอนแก่น', 'ok'],
  ['82-3302 อุดรธานี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 อุดรธานี', 'ok'], ['82-4410 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok'],
  ['83-1207 อุดรธานี', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟฉ.1 อุดรธานี', 'repair'], ['84-5521 นครราชสีมา', 'Hino FG + กระเช้า Tadano AT-146', 'กฟฉ.3 นครราชสีมา', 'ok'],
  ['85-0918 อุบลราชธานี', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟฉ.2 อุบลราชธานี', 'ok']];
const P = PLANS[0];
const PLAN_KV = [['ชื่อแผน', P[1]], ['ปีงบประมาณ', P[8]], ['ภาค', P[2]], ['ประเภทรถ', P[7]], ['ไตรมาส', P[3]], ['จำนวนรถ', P[4] + ' คัน'], ['เลขที่ MR', P[0]], ['ผู้สร้างแผน', 'นายวิชัย ทองดี (กบค.)'], ['วันที่สร้าง', P[6]], ['อนุมัติเมื่อ', '08/10/2569']];
const VST = { ok: ['ปกติ', 'Success'], repair: ['ซ่อม', 'Warning'], transfer: ['โอน', 'Error'], dispose: ['รอยุบ', 'Error'] };
const RDY = { ready: ['พร้อม', 'Success'], notready: ['ไม่พร้อม', 'Error'], pending: ['ยังไม่ตอบ', 'Gray'] };
const VEH = [   // ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานะรถ · ความพร้อม
  ['82-6789 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok', 'ready'],
  ['82-1145 ขอนแก่น', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 ขอนแก่น', 'ok', 'ready'],
  ['80-5738 น่าน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.2 น่าน', 'repair', 'notready'],
  ['81-2210 เชียงใหม่', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.1 เชียงใหม่', 'transfer', 'pending'],
  ['80-9981 ลำปาง', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟน.1 ลำปาง', 'ok', 'ready'],
  ['82-3302 อุดรธานี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 อุดรธานี', 'ok', 'pending']];
const V = VEH[0];
const NOW_Q = P[3], NOW_CARS = VEH.length;   // ไตรมาสที่กำลังทำ · รถของไตรมาส (ไม่มีขั้นนำรถออกแล้ว 2 พ.ย. 2569)
const VEH_KV = [['ทะเบียน', V[0]], ['ยี่ห้อ/รุ่น', V[1]], ['ประเภท', 'รถกระเช้า'], ['หน่วยงานเจ้าของรถ', V[2]], ['เลขไมล์สะสม', '182,400 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,120 ชม.'], ['แผน', P[0]], ['แผนเดินทาง', 'ตรวจรถ ขอนแก่น อุดรธานี ลำปาง · 03–07/11/2569']];
const PSTAT = { ok: ['พร้อม', 'Success'], short: ['ขาด', 'Error'], reserved: ['จองแล้ว', 'Info'] };
/* จำนวนตามแผน = ของไตรมาส 1 ในแผนตัวอย่าง (S4 ขึ้นไปทำรายไตรมาส) รถ 6 คัน · เปลี่ยนน้ำมัน 2 คัน · ไส้กรองเชื้อเพลิง 2 คัน · 2 พ.ย. 2569 ตัดการนำรถออกที่ S4 แล้ว */
const PARTS = [   // รายการ · รหัส · หมวด · จำนวนตามแผน · หน่วย · คงเหลือ · สถานะเมื่อจอง
  ['น้ำมันไฮโดรลิก ISO VG 46', 'OL-0011', 'น้ำมัน', '60', 'ลิตร', '420', 'ok'],
  ['ไส้กรองไฮโดรลิก', 'FL-0022', 'ไส้กรอง', '12', 'ชิ้น', '3', 'short'],
  ['ไส้กรองน้ำมันเครื่อง', 'FL-0031', 'ไส้กรอง', '12', 'ชิ้น', '40', 'ok'],
  ['ไส้กรองอากาศ', 'FL-0040', 'ไส้กรอง', '12', 'ชิ้น', '60', 'ok'],
  ['ไส้กรองเชื้อเพลิง', 'FL-0052', 'ไส้กรอง', '4', 'ชิ้น', '1', 'short']];
/* อะไหล่แบบงานซ่อม (22 ต.ค. 2569 "ปรับอะไหล่ให้สอดคล้องกับงานซ่อม"): คลัง 2 แบบ Smart Inventory / คลังสำรอง · ราคาต่อหน่วย (ค่าสมมติ) ·
   จำนวนตามแผนเกินคงเหลือ = ซื้อเพิ่มส่วนต่าง + เลือกผู้จัดซื้อ · ผู้จัดซื้อในบำรุงรักษา = Smart Inventory หรือ ผพจ. (S3) แทน "กบค." ของงานซ่อม — รอเคาะ */
const WH = ['Smart Inventory', 'Smart Inventory', 'Smart Inventory', 'คลังสำรอง', 'คลังสำรอง'];
const PRICE = [120, 680, 250, 420, 350];
const BUYER = ['Smart Inventory', 'ผพจ.'];
const BUYER_OF = { 1: 0, 4: 1 };   // อะไหล่ที่ขาด → ผู้จัดซื้อที่เลือกไว้ (ไส้กรองไฮโดรลิก = Smart Inventory · ไส้กรองเชื้อเพลิง = ผพจ.)
const baht = (n) => n.toLocaleString('en-US') + ' บาท';
const shortOf = (i) => Math.max(0, +PARTS[i][3] - +PARTS[i][5]);
const TST = { sent: ['ส่งแจ้งแล้ว', 'Info'], done: ['ดำเนินการแล้ว', 'Success'], review: ['รออนุมัติ', 'Warning'], approved: ['อนุมัติแล้ว', 'Success'], returned: ['ส่งกลับแก้ไข', 'Error'] };   // 3 พ.ย. 2569 แผนเดินทางต้องอนุมัติ (S7) · ชื่อตามสถานะแผน S2
const TRIP = { place: 'จุดรวมงาน กฟฉ.1 ขอนแก่น', d1: '03/11/2569', d2: '07/11/2569', staff: ['นายวิชัย ทองดี', 'นางสาวกนกวรรณ ใจมั่น', 'นายสมชาย พูลสุข'], perDiem: '7,200', lodging: '9,600', travel: '4,850' };
/* S6 สถานที่รายคัน (เจ้าของงาน 2 พ.ย. 2569): ค่าเริ่มต้น = สำนักงานที่รถคันนั้นอยู่ (หน่วยงานเจ้าของรถ) แก้ได้ทีละคัน · TRIP.place ยังใช้กับ S9 S10 ที่ยังไม่ได้รีวิวรอบนี้
   3 พ.ย. 2569 เจ้าของงาน: ตัวอย่างรถในไตรมาส 10 คัน เฉพาะ S6 (S1 S2 S4 ยังเป็นไตรมาส 1 = 6 คันตามที่รีวิวแล้ว) · 1 ไตรมาสมีแผนเดินทางหลายใบ รถไม่ซ้ำกัน */
const TRIP_CARS = VEH.map(v => [v[0], v[1], v[2]]).concat([
  ['82-7720 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น'],
  ['80-3316 พะเยา', 'Hino FC + กระเช้า Tadano AT-100', 'กฟน.1 พะเยา'],
  ['81-6604 เชียงราย', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.1 เชียงราย'],
  ['80-4458 แพร่', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.2 แพร่']]);
const TRIP_KV = PLAN_KV.map(([k, v]) => k === 'ไตรมาส' ? [k, v + ' (' + TRIP_CARS.length + ' คัน)'] : [k, v]);
const TRIP_SEL = [0, 1, 4, 5], TRIP_LOCS = { 4: 'จุดรวมงาน กฟน.1 ลำปาง' };
const tripLoc = (i, locs) => (locs || {})[i] || 'สำนักงาน ' + TRIP_CARS[i][2];
/* เบอร์ติดต่อรายคัน (3 พ.ย. 2569 เจ้าของงาน "เพิ่มคอลัมน์เบอร์ติดต่อในหน้ารถที่เลือกแล้ว โดยเบอร์เป็นเบอร์ของเจ้าของรถ และตอนกดแก้ไข อยากเพิ่มการแก้ไขเบอร์โทร และสถานที่นัดได้")
   ค่าเริ่มต้น = เบอร์เจ้าของรถจากข้อมูลรถ · แก้ได้ทีละคันใน popup เดียวกับสถานที่ · คอลัมน์ตามหน้า MA Appointment ของ UI Release#2 ("เบอร์ติดต่อ") */
const OWNER_PH = ['081-472-3365', '081-472-3365', '054-710-224', '053-241-560', '089-635-1172', '042-221-908', '043-246-118', '054-411-737', '053-711-402', '054-511-226'];
const TRIP_PHONES = { 4: '086-552-1904' }, TRIP_V_LOCS = { 6: 'ศูนย์บริการผู้รับจ้าง สาขาขอนแก่น' }, TRIP_V_PHONES = { 6: '095-118-4420' };
const tripPhone = (i, ph) => (ph || {})[i] || OWNER_PH[i];
const tripPhoneCell = (i, ph) => (ph || {})[i] ? { text: tripPhone(i, ph), sub: 'แก้จากเบอร์เจ้าของรถ' } : tripPhone(i, ph);
const TRIP_ALL = TRIP_CARS.map((_, i) => i), TRIP_REST = TRIP_ALL.filter(i => TRIP_SEL.indexOf(i) < 0);   // ใบแรกใช้ TRIP_SEL · ใบถัดไปเลือกได้เฉพาะที่เหลือ
/* ชื่อแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "ตอนสร้างแผนการเดินทางอยากให้ตั้งชื่อแผนได้ด้วย") — ผู้ใช้ตั้งเอง แสดงแทน "แผนเดินทาง k" ในหน้าแผนเดินทาง */
const TRIP_1 = { name: 'ตรวจรถ ขอนแก่น อุดรธานี ลำปาง', sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, d1: TRIP.d1, d2: TRIP.d2, st: 'review' }, TRIP_2 = { name: 'ตรวจรถ น่าน เชียงใหม่ เชียงราย', sel: TRIP_REST, locs: {}, phones: {}, d1: '17/11/2569', d2: '21/11/2569', st: 'review' };
const tripAs = (t, st) => Object.assign({}, t, { st });
/* S9 แผนเดินทางจ้างดำเนินการ (3 พ.ย. 2569 เจ้าของงาน "ตอนที่ทำ e2 อยากให้มีการเลือกว่า กบค ดำเนินการเอง หรือ จ้างดำเนินการ และพอเลือกจ้างดำเนินการ ก็มีให้เลือก vendor list")
   ฟอร์มเดียวกับ S6 · จ้าง = ผู้รับจ้าง (vendor list) + เลขที่สัญญา/ใบสั่งจ้าง + รถ + สถานที่รายคัน + ช่วงวันทำงาน · ไม่มีพนักงาน กบค. และค่าใช้จ่าย */
const VENDORS = [['บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด', 'รถกระเช้า · รถเครน'], ['หจก. ช่างกลภาคอีสาน', 'รถกระเช้า'], ['บริษัท เครนเทค เอ็นจิเนียริ่ง จำกัด', 'รถเครน'], ['หจก. ล้านนาไฮดรอลิก', 'รถกระเช้า · รถขุด']];
const TRIP_V = { name: 'จ้างบำรุงรักษา น่าน เชียงใหม่ เชียงราย', vendor: VENDORS[0][0], contract: 'สจ.69-0142', sel: TRIP_REST, locs: TRIP_V_LOCS, phones: TRIP_V_PHONES, d1: '17/11/2569', d2: '21/11/2569', st: 'review' };
const tripBy = (t) => t.vendor || 'กบค. (ดำเนินการเอง)';
const TRIP_RETURN = 'ช่วงวันที่ 03 ถึง 07/11/2569 ตรงกับแผนดับไฟของ กฟฉ.1 ขอนแก่น กรุณาเลื่อนเป็นสัปดาห์ถัดไป';
const WORK = [   // รายการงาน · อะไหล่ · ตามแผน · ใช้จริง · หน่วย
  ['เปลี่ยนน้ำมันไฮโดรลิก', 'น้ำมันไฮโดรลิก ISO VG 46', '30', '30', 'ลิตร'],
  ['เปลี่ยนไส้กรองไฮโดรลิก', 'ไส้กรองไฮโดรลิก', '2', '2', 'ชิ้น'],
  ['เปลี่ยนไส้กรองน้ำมันเครื่อง', 'ไส้กรองน้ำมันเครื่อง', '2', '2', 'ชิ้น'],
  ['เปลี่ยนไส้กรองอากาศ', 'ไส้กรองอากาศ', '2', '1', 'ชิ้น']];
const BEFORE = ['รูปรถ + ทะเบียน', 'อะไหล่ใหม่'];
const AFTER = ['รูปรถ + ทะเบียน', 'อะไหล่เก่า', 'อะไหล่ใหม่ที่เหลือ', 'จุดที่บำรุงรักษา (อะไหล่ใหม่)'];
/* S10 สถานะงานรายคัน (3 พ.ย. 2569 เจ้าของงานเลือก "ทำทีละขั้น") ตามชื่อสถานะงานของหน้า RP & MA Job ของ UI Release#2 (นัดหมายแล้ว → อยู่ระหว่างซ่อม → เสร็จสิ้น / ยกเลิก) */
const WSTAT = { todo: ['ยังไม่เริ่ม', 'Gray'], doing: ['อยู่ระหว่างบำรุงรักษา', 'Warning'], done: ['เสร็จสิ้น', 'Success'], cannot: ['บำรุงรักษาไม่ได้', 'Error'],
  // แผนจ้างดำเนินการ (3 พ.ย. 2569 รอบ 2 เจ้าของงาน "เห็นสถานะ ว่ารถคันนั้น ดำเนินการบำรุงรักษาแล้ว ปุ่มจะแสดงให้ส่งตรวจงาน") · สีป้ายเสนอ: ยังไม่ส่ง Info · รอตรวจรับ Warning แบบ "รออนุมัติ" ของแผน
  worked: ['ดำเนินการบำรุงรักษาแล้ว', 'Info'], reported: ['แจ้งบำรุงรักษาไม่ได้', 'Info'], wait: ['รอตรวจรับ', 'Warning'], returned: ['ส่งกลับแก้ไข', 'Error'] };
const ACC = { wait: ['รอหน่วยงานยอมรับ', 'Warning'], ok: ['หน่วยงานยอมรับแล้ว', 'Success'] };
const pdf = (name, size) => ({ name, size: size || '1.2 MB' });
const jpg = (name) => ({ name: name + '.jpg', size: '2.4 MB' });

/* ---------- ตัวช่วยเฉพาะเรื่อง ---------- */
/* หน้า Detail (หัว "หมายเลขแผน …") ใช้ Section label ตาม R5/R11 · หน้า Create/Edit ใช้ Section header ตาม R3 */
async function detail(name, o) {
  const { scr, page } = await shell(name, { title: 'หมายเลขแผน ' + P[0], back: true, crumbs: ['แผน ' + P[0]].concat(o.crumbs || []), badge: PST[o.status || 'active'], actions: o.actions });
  return { scr, page };
}
/* ทางเลือก 2 ทาง = Section header + Radio text card (ตามแบบ RadioSelection / AdditionalPartRequest ของงานซ่อม) */
async function radioPick(title, options, sel, o) {
  o = o || {};
  const r = MOB ? col('Radio', [], 12) : row('Radio', [], { gap: 16 });
  options.forEach((t, i) => {
    const sub = Array.isArray(t) ? t[1] : '';   // [ข้อความ, บรรทัดรอง] แบบการ์ดตอบรับ/ปฏิเสธของ Overhaul R29
    const c = inst('Radio text card', { State: o.disabled ? 'Disabled' : 'Default', Selected: i === sel ? 'True' : 'False' }, { Text: Array.isArray(t) ? t[0] : t, Supporting: !!sub, 'Supporting text': sub });
    if (MOB) add(r, c, 'h');
    else {   // การ์ดในแถวสูงเท่ากัน และบรรทัดรองกว้างเต็มการ์ด (เจ้าของงาน 2 พ.ย. 2569 "อยากให้ขนาดกล่องเท่ากัน")
      r.appendChild(c); c.layoutGrow = 1;
      try { c.layoutSizingVertical = 'FILL'; } catch (e) { /* ไฟล์เก่าไม่รองรับ */ }
    }
    // 3 พ.ย. 2569 ภาพจากไฟล์จริง: บรรทัดรองตัดคำกลางคำ ("ผู้รับจ / ้าง") เพราะกรอบ Content (208) และ Text and supporting text (176) กว้างตายตัวตาม component ⇒ ยืดกรอบก่อน แล้วค่อยยืดข้อความ
    c.findAll(n => n.type === 'FRAME' && (n.name === 'Content' || n.name === 'Text and supporting text')).forEach(f => { try { f.layoutSizingHorizontal = 'FILL'; } catch (e) { /* ชั้นที่ไม่อยู่ใน auto layout */ } });
    c.findAll(n => n.type === 'TEXT').forEach(t => { try { t.layoutSizingHorizontal = 'FILL'; t.textAutoResize = 'HEIGHT'; } catch (e) { /* ชั้นที่ไม่อยู่ใน auto layout */ } });
  });
  return col('Section', [await (o.label ? sectionLabel(title) : section(title)), r], 16);
}
/* radio เล็กพร้อมป้าย = Horizontal radio groups (ไฟล์ Component หน้า Radio button) วางในแถวฟอร์มคู่กับช่องกรอก
   ตาม UI Release#2 หน้า 5.1 Rental Contract Management ("ประเภทสัญญา" เช่า/ซื้อ คู่ Input dropdown) · สูง 72 เท่า Text input · ใช้เมื่อ 2–4 ตัวเลือกป้ายสั้น ไม่ต้องมีคำอธิบาย (UX-1)
   options ไม่เกิน 4 · sel = ลำดับที่เลือก */
function radioGroup(label, options, sel, error) {   // error = ข้อความใต้กลุ่ม (Helper) เมื่อยังไม่เลือก
  const p = { 'Label text': label, Label: true, 'Info icon': false, 'Leading icon': false, Helper: !!error, 'Helper text': error || '', 'Radio 3': options.length > 2, 'Radio 4': options.length > 3 };
  options.forEach((t, i) => { p['Radio text ' + (i + 1)] = t; });
  const g = inst('Horizontal radio groups', {}, p);
  const ct = find(g, 'Container');
  (ct ? ct.children : []).filter(c => c.visible !== false).forEach((c, i) => { const rb = c.type === 'INSTANCE' && c.name === 'Radio button' ? c : find(c, 'Radio button'); if (rb) setProps(rb, { Selected: i === sel ? 'True' : 'False' }); });
  return g;
}
/* เลือกรถหลายคัน (เจ้าของงานสั่ง 22 ต.ค. 2569 "ใช้แบบ Overhaul ช่องค้นหากับชิป") = แบบ R24 ของ Overhaul:
   Input dropdown ช่องเดียว "เลือกรถ" พิมพ์ค้นทะเบียน/จังหวัด → Dropdown list แถวละทะเบียน (คันที่เลือกแล้ว State=Selected) → รถที่เลือกเป็นชิป Badge outline with remove icon ใต้ช่อง
   ไม่ใช้ dual list แล้ว · ใช้ทั้ง desktop และ mobile (mobile ช่องเต็มแถว) · งานซ่อมเลือกรถคันเดียวด้วยช่องค้นทะเบียนแบบเดียวกัน (Dropdown/Search PEA with request) */
async function carPick(title, cands, sel, o) {
  o = o || {};
  const right = cands.filter((_, i) => sel.indexOf(i) >= 0);
  const f = dropdown('เลือกรถ', o.query || '', { placeholder: 'ค้นหาทะเบียน, จังหวัด', lead: 'search-24-300-round', state: o.open ? 'Focused' : undefined, error: o.error || '' });
  let chips = null;
  if (right.length && o.chips !== false) {   // o.chips=false = ฟอร์มสร้างแผน รถที่เลือกแสดงในตารางด้านล่างแทน (เจ้าของงาน 2 พ.ย. 2569)
    chips = frame('Selected cars', 'HORIZONTAL', { gap: 8 });
    try { chips.layoutWrap = 'WRAP'; chips.counterAxisSpacing = 8; } catch (e) { /* ไฟล์เก่าไม่มี wrap */ }
    right.forEach(c => chips.appendChild(inst('Badge outline with remove icon', { Color: 'Brand' }, { Text: c[0] })));
  }
  const sec = col('Section', [title ? await section(title, { badge: right.length || null }) : null, MOB ? f : row('Row', [f, frame('Spacer', 'VERTICAL')]), chips], 16);
  const open = (scr) => {   // รายการที่ตรงคำค้น · คันที่เลือกแล้วติ๊ก Selected · แถวเดียวไม่มีบรรทัดรอง
    if (!o.open) return;
    const list = cands.map((c, i) => [c, i]).filter(([c]) => (!o.only || o.only(c)) && (!o.query || c[0].indexOf(o.query) >= 0));
    comboAt(scr, f.findOne(n => n.name === 'Container') || f, list.map(([c, i]) => [c[0], o.note ? o.note(i) : '', sel.indexOf(i) >= 0]));
  };
  return { sec, open };
}
/* กล่องข้อมูลรถ — ยืม VehicleAndReporterInfo (หน้า รายละเอียดงานซ่อม): Section label + Content item row แถวละ 4 · ไม่มี/mobile → Section label + กล่องแสดงข้อมูล (R12) */
async function vehicleInfo(pairs, title) {
  title = title || 'ข้อมูลยานพาหนะ';
  if (!MOB && has('VehicleAndReporterInfo')) {
    const v = inst('VehicleAndReporterInfo'); v.name = 'VehicleAndReporterInfo';
    const sl = find(v, 'Section label'); if (sl) setProps(sl, { Title: title, Supporting: false, 'Info icon': false, Actions: false, 'More actions': false });
    v.findAll(n => n.type === 'INSTANCE' && n.name === 'BudgetSource').forEach(b => { b.visible = false; });
    const rows = v.findAll(n => n.type === 'INSTANCE' && n.name === 'Content item row' && !findInstanceAncestor(n).name.startsWith('BudgetSource'));
    let k = 0;
    for (const r of rows) {
      const items = r.children.filter(c => c.name === '_Content item base');
      const slice = pairs.slice(k, k + items.length);
      if (!slice.length) { r.visible = false; continue; }
      items.forEach((it, j) => { if (j < slice.length) { setProps(it, { Type: 'Text with label' }); setProps(it, { Label: slice[j][0], Text: slice[j][1], Supporting: false, 'Leading icon': false }); } });
      setProps(r, { 'Item 2': slice.length > 1, 'Item 3': slice.length > 2, 'Item 4': slice.length > 3 });
      k += items.length;
    }
    return v;
  }
  return col('Section', [await sectionLabel(title), kv(pairs)], 16);
}
/* แถวภาพ — ยืม IncidentPhotoGallery (หน้า รายละเอียดงานซ่อม): Section label + Images sm × 4 + ปุ่มเลื่อน · ไม่มี/mobile → Section label + Images จากไลบรารี */
async function photoGallery(title, count) {
  if (!MOB && has('IncidentPhotoGallery')) {
    const g = inst('IncidentPhotoGallery'); g.name = 'IncidentPhotoGallery';
    const sl = find(g, 'Section label'); if (sl) setProps(sl, { Title: title, Supporting: false, 'Info icon': false, Actions: false, 'More actions': false });
    g.findAll(n => n.type === 'INSTANCE' && n.name === 'Images').forEach((im, i) => { if (i >= count) im.visible = false; else setProps(im, { Buttons: false, 'Indicator pagination': false }); });
    const ib = find(g, 'Icon button'); if (ib) ib.visible = count > 4;
    return g;
  }
  const r = frame('Gallery', 'HORIZONTAL', { gap: 16 });
  for (let i = 0; i < Math.min(count, MOB ? 2 : 4); i++) r.appendChild(inst('Images', { Size: 'sm', Type: 'Image' }, { Buttons: false, 'Indicator pagination': false }));
  return col('Section', [await sectionLabel(title), r], 16);
}
/* ช่องอัปโหลดภาพ 1 คอลัมน์ (กติกาอัปโหลด) — ช่องละภาพตามรายการบนบอร์ด */
async function photoUploads(list, filled, errors) {
  const nodes = [];
  for (const [i, label] of list.entries()) nodes.push(await upload(label, filled ? [jpg(label.replace(/\s|\+|\(|\)/g, '-') + '-' + (i + 1))] : [], { hint: 'JPG, PNG · 1 ภาพ', error: errors ? 'กรุณาอัปโหลด' + label : '' }));
  return nodes;
}
const partRow = (p, i, o) => [p[0], p[1], p[2], p[3], p[4], p[5], { pill: o && o.result ? PSTAT[o.result === 'short' ? p[6] : 'ok'] : [' ', 'Gray'] }];
const PART_COLS = [['รายการอะไหล่', 0, 'Lead text', 'Swap'], ['รหัส', 100], ['หมวด', 110], ['ตามแผน', 100], ['หน่วย', 90], ['คงเหลือในคลัง', 130], ['สถานะ', 140, 'Badge']];
/* ใส่ข้อความการ์ดอะไหล่ (Spare Part Card Item) — จับชั้นข้อความจากข้อความตัวอย่างของ component ไม่ใช้ลำดับ (การ์ดในแผง Filled วางชั้นต่างจากตัวแม่):
   รหัส · "1 หน่วย" · "| 680 บาท" (ราคาต่อหน่วย) · "<คลัง> : คงเหลือ n" · "| ต้องจัดซื้อ n" · ราคารวมของการ์ด (Text "3,400 บาท") */
async function fillPartCard(c, i, o) {
  o = o || {};
  const part = PARTS[i], unit = part[4];
  const own = (n) => !findInstanceAncestorIn(n, c);
  const sup = c.findAll(n => n.type === 'TEXT' && n.name === 'Supporting text' && own(n));
  const orig = sup.map(t => t.characters || '');
  await text(c, 'Name', part[0]);
  if (sup[0]) await text(c, sup[0], part[1]);
  for (const [k, t] of sup.entries()) {
    const was = orig[k];
    if (k === 0 || was === '·' || was === '|') continue;
    if (/คงเหลือ/.test(was)) await text(c, t, WH[i] + ' : คงเหลือ ' + o.stock + ' ' + unit);
    else if (/^(ต้องจัดซื้อ|ซื้อเพิ่ม)/.test(was)) { if (o.buy > 0) await text(c, t, 'ต้องจัดซื้อ ' + o.buy + ' ' + unit); }   // แถวนี้ซ่อนด้วย property จัดซื้อเพิ่ม เมื่อไม่ขาด
    else if (/หน่วย$/.test(was)) await text(c, t, '1 ' + unit);
    else if (/บาท$/.test(was)) await text(c, t, baht(PRICE[i]));
  }
  if (o.qty != null) {
    const line = c.findAll(n => n.type === 'TEXT' && n.name === 'Text' && own(n))[0];
    if (line) await text(c, line, baht(o.qty * PRICE[i]));
  }
}
/* เบิก/จองอะไหล่ — ยืม PartRequestStepPanel (ขั้นเบิกอะไหล่ของงานซ่อม = PartsInventoryPanel "คลังอะไหล่" + RequestedPartsPanel "อะไหล่ที่ต้องการใช้งาน")
   ตามแบบงานซ่อม (22 ต.ค. 2569): การ์ดคลังบอกคลังและคงเหลือ · การ์ดที่เลือกมีจำนวน + ราคารวม · ถ้าเกินคงเหลือ = "| ซื้อเพิ่ม n" + Helper "จำนวนที่เกินยอดในคลัง…" + เลือกผู้จัดซื้อ (Radio text card)
   o.inv = 'Default' | 'Not Found' | 'API error' (สถานะของ PartsInventoryPanel) · mobile / ไฟล์ที่ไม่มี component → ตาราง Table ของไลบรารี */
async function partsPanel(o) {
  o = o || {};
  const picked = o.picked || [];
  const qty = (i) => o.car ? CAR_QTY[i] : +PARTS[i][3];   // o.car = หน้าอะไหล่รายคัน S21: จำนวนต่อคัน ยังไม่เบิก จึงไม่มีซื้อเพิ่ม · ไม่มีป้าย "แนะนำ" กบค. เลือกเอง
  if (!MOB && has('PartRequestStepPanel')) {
    const p = inst('PartRequestStepPanel'); p.name = 'PartRequestStepPanel';
    const inv = find(p, 'PartsInventoryPanel'), req = find(p, 'RequestedPartsPanel');
    if (inv) {
      setProps(inv, { State: o.inv || 'Default' });
      const sh = find(inv, 'Section header');
      if (sh) { setProps(sh, { Title: 'คลังอะไหล่', 'Supporting text': true, 'More actions': false, Badge: false, Actions: false }); await text(sh, 'Supporting text', 'อะไหล่ทั้งหมดจาก Smart Inventory และ คลังสำรอง'); }
      const ti = find(inv, 'Text input'); if (ti) setProps(ti, { Text: o.query || 'ค้นหาชื่อหรือรหัสอะไหล่', Label: false, Helper: false, 'Info icon': false });
      const cards = inv.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
      for (const [i, c] of cards.entries()) {
        const part = PARTS[i];
        if (!part) { c.visible = false; continue; }
        setProps(c, { Suggestion: false, Select: picked.indexOf(i) >= 0, Add: picked.indexOf(i) < 0, 'จัดซื้อเพิ่ม': false, 'เลือกผู้จัดซื้อ': false });
        await fillPartCard(c, i, { stock: part[5] });
      }
    }
    if (req) {
      setProps(req, { State: picked.length ? 'Filled' : 'Default' });
      const sh = find(req, 'Section header');
      if (sh) { setProps(sh, { Title: o.car ? 'อะไหล่ของรถคันนี้' : 'อะไหล่ที่ต้องใช้ใน' + NOW_Q, 'Supporting text': true, 'More actions': false, Badge: picked.length > 0, Actions: false }); await text(sh, 'Supporting text', o.car ? 'เลือกจากคลังหรือระบุเพิ่มเอง แก้จำนวนหรือเอาออกได้' : 'รวมจากรถ ' + NOW_CARS + ' คันของไตรมาสนี้ · เบิก/จองผ่านระบบจองอะไหล่'); const b = find(sh, 'Badge outline'); if (b && picked.length) setProps(b, { Text: String(picked.length) }); }
      const cards = req.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
      // แผงมีการ์ดรายการที่เลือกแค่ 3 ช่อง (instance เพิ่มลูกไม่ได้) ⇒ เรียงรายการที่ต้องจัดซื้อขึ้นก่อนให้เห็น · ตัวเลข Badge และยอดรวมนับทุกรายการ
      const order = o.car ? picked.filter(i => i === 4).concat(picked.filter(i => i === 0), picked.filter(i => i !== 4 && i !== 0)) : picked.slice().sort((a, b) => (shortOf(b) > 0) - (shortOf(a) > 0));
      let k = 0;
      for (const c of cards) {
        const vp = (c.variantProperties || {})['อะไหล่'];
        if (vp === 'เพิ่มอะไหล่') {   // การ์ด "รายการเพิ่มเติม" ของงานซ่อม = เพิ่มอะไหล่แบบ manual (R36) ชื่ออะไหล่ · รหัสอะไหล่ (ถ้ามี) · ราคาต่อหน่วย · จำนวน
          if (!o.manual) { c.visible = false; continue; }
          const m = o.manual.filled ? MANUAL : {};
          [['ชื่ออะไหล่', m.name, 'ระบุชื่ออะไหล่', false], ['รหัสอะไหล่', m.code, 'ระบุรหัสอะไหล่', true], ['ราคาต่อหน่วย', m.price, '0', false]].forEach(([label, val, ph, opt], j) => {
            const ti = c.findAll(n => n.type === 'INSTANCE' && n.name === 'Text input')[j];
            if (ti) setProps(ti, { State: val ? 'Filled' : 'Default', 'Label text': label, Text: val || ph, Optional: opt, Helper: false, 'Info icon': false });
          });
          const num = find(c, 'Number input'); if (num) setProps(num, { Number: String(m.qty || 1), Label: false, Optional: false, 'Info icon': false, Helper: false });
          const line = c.findAll(n => n.type === 'TEXT' && n.name === 'Text')[0]; if (line) await text(c, line, baht(m.qty ? m.qty * +m.price : 0));
          continue;
        }
        const i = order[k++], part = PARTS[i];
        if (!part) { c.visible = false; continue; }
        const buy = o.car || o.result === 'ok' ? 0 : shortOf(i);   // อะไหล่พร้อมครบ = ของเข้าคลังแล้ว ไม่มีซื้อเพิ่ม
        const stock = o.result === 'ok' ? Math.max(+part[5], +part[3]) : part[5];
        setProps(c, { Suggestion: false, 'จัดซื้อเพิ่ม': buy > 0, 'เลือกผู้จัดซื้อ': buy > 0 });
        await fillPartCard(c, i, { stock, buy, qty: qty(i) });
        const num = find(c, 'Number input');
        if (num) setProps(num, { Number: String(qty(i)), Label: false, Optional: false, 'Info icon': false, Helper: buy > 0, 'Helper text': buy > 0 ? 'จำนวนที่เกินยอดในคลัง จะถูกตั้งเป็นรายการจัดซื้อให้อัตโนมัติ' : '' });
        if (buy > 0) {
          const il = find(c, 'Input label'); if (il) setProps(il, { Optional: false, 'Info icon': false, button: false });   // ป้าย "เลือกผู้จัดซื้ออะไหล่เพิ่ม" ไม่บังคับเลือก (มีค่าเริ่มต้น) · ไม่มีปุ่มข้างป้าย
          c.findAll(n => n.type === 'INSTANCE' && n.name === 'Radio text card').forEach((r, j) => setProps(r, { Text: BUYER[j] || '', Supporting: false, Selected: (BUYER_OF[i] || 0) === j ? 'True' : 'False' }));
        }
      }
      const addBtn = find(req, 'Secondary button'); if (addBtn) setProps(addBtn, { Text: 'ระบุอะไหล่เพิ่มเติม' });
      // กล่องรวมค่าอะไหล่ท้ายแผง (แบบงานซ่อม): เบิกจากคลัง · ต้องจัดซื้อ · รวมทั้งหมด — คิดจากทุกรายการที่เลือก
      const cost = find(req, 'Cost Container');
      if (cost && picked.length) {
        let take = o.manual && o.manual.filled ? MANUAL.qty * +MANUAL.price : 0, buyAmt = 0;
        picked.forEach(i => { const q = qty(i), st = o.car || o.result === 'ok' ? q : Math.min(q, +PARTS[i][5]); take += st * PRICE[i]; buyAmt += (q - st) * PRICE[i]; });
        const csh = find(cost, 'Section header'); if (csh) setProps(csh, { Title: 'รวมค่าอะไหล่', 'Supporting text': false, 'More actions': false, Badge: false, Actions: false });
        const infos = cost.findAll(n => n.type === 'FRAME' && n.name === 'Purchase Info');
        const vals = [['เบิกจากคลัง', take], ['ต้องจัดซื้อ', buyAmt]];
        for (const [j, f] of infos.entries()) { const ts = f.children.filter(x => x.type === 'TEXT'); if (vals[j] && ts[1]) { await text(f, ts[0], vals[j][0]); await text(f, ts[1], baht(vals[j][1])); } }
        const tot = find(cost, 'Total Cost'); const tt = tot ? tot.children.filter(x => x.type === 'TEXT') : [];
        if (tt[1]) await text(tot, tt[1], baht(take + buyAmt));
      }
    }
    return p;
  }
  if (o.car) {
    const extra = o.manual && o.manual.filled ? [MANUAL_ROW] : [];
    const rows = picked.map(i => [PARTS[i][0], PARTS[i][1], PARTS[i][2], String(CAR_QTY[i]), PARTS[i][4]]).concat(extra);
    const sec = col('Section', [await section('อะไหล่ของรถคันนี้', { badge: rows.length || null, buttons: [{ kind: 'Secondary button', text: 'ระบุอะไหล่เพิ่มเติม', icon: 'add-24-300-round' }] })], 16);
    add(sec, rows.length ? await tbl(PART_COLS.slice(0, 5), rows) : await noParts('เลือกอะไหล่จากคลัง หรือระบุอะไหล่เพิ่มเติมเอง'), 'h');
    return sec;
  }
  const head = 'รายการอะไหล่ที่ต้องใช้ใน' + NOW_Q;
  if (!picked.length) return col('Section', [await section(head), await noParts('ไตรมาสนี้ยังไม่มีอะไหล่ในแผน เลือกจากคลังเมื่อต้องการเบิก')], 16);
  return col('Section', [await section(head, { badge: PARTS.length }), await tbl(PART_COLS, PARTS.map((p, i) => partRow(p, i, o)))], 16);
}
/* ข้อความที่อยู่ใน instance ซ้อน (เช่น Pill หรือปุ่ม) ไม่ใช่ข้อความของการ์ดเอง */
function findInstanceAncestorIn(n, stop) { let q = n.parent; while (q && q !== stop) { if (q.type === 'INSTANCE') return q; q = q.parent; } return null; }
/* สรุปรายการเบิก/จอง — ยืม SummaryRequestedParts (modal สรุปรายการอะไหล่ของงานซ่อม) · ไม่มี/mobile → Modal ยืนยัน */
async function partsSummary(scr, o) {
  if (!MOB && has('SummaryRequestedParts')) {
    const m = inst('SummaryRequestedParts'); overlay(scr, m, 0, 0); m.name = 'SummaryRequestedParts';
    const hd = find(m, 'Modal header'); if (hd) setProps(hd, { Title: 'สรุปรายการเบิก/จองอะไหล่', Supporting: false, 'Back icon': false, 'Featured icon': false });
    const labels = m.findAll(n => n.type === 'INSTANCE' && n.name === 'Section label');
    if (labels[0]) setProps(labels[0], { Title: 'เบิกจากคลัง Smart Inventory (' + o.stock + ' รายการ)', Supporting: false, Actions: false, 'More actions': false });
    if (labels[1]) setProps(labels[1], { Title: 'คงเหลือไม่พอ — รอจัดซื้อ ผพจ. (' + o.buy + ' รายการ)', Supporting: false, Actions: false, 'More actions': false });
    const info = find(m, '_Modal content');
    if (info) {
      const pairs = [['แผน', P[1]], ['เลขที่ MR', P[0]], ['ไตรมาส', NOW_Q], ['จำนวนรถ', NOW_CARS + ' คัน']];
      const rows = info.findAll(n => n.type === 'INSTANCE' && n.name === 'Content item row');
      rows.forEach((r, i) => {
        if (i > 0) { r.visible = false; return; }
        setProps(r, { 'Item 2': true, 'Item 3': true, 'Item 4': true });
        r.children.filter(c => c.name === '_Content item base').forEach((it, j) => { if (pairs[j]) setProps(it, { Label: pairs[j][0], Text: pairs[j][1], Supporting: false, 'Leading icon': false }); });
      });
    }
    // ยอดรวมแบบงานซ่อม: เบิกจาก Smart Inventory · เบิกจากคลังสำรอง · จัดซื้อเพิ่มโดย Smart Inventory · จัดซื้อเพิ่มโดย ผพจ. · รวม
    const sum = { take: [0, 0], buy: [0, 0] };
    PARTS.forEach((pt, i) => { const q = +pt[3], st = Math.min(q, +pt[5]); sum.take[WH[i] === 'Smart Inventory' ? 0 : 1] += st * PRICE[i]; if (q > st) sum.buy[BUYER_OF[i] || 0] += (q - st) * PRICE[i]; });
    const lines = [['เบิกจาก Smart Inventory', sum.take[0]], ['เบิกจากคลังสำรอง', sum.take[1]], ['จัดซื้ออะไหล่เพิ่มโดย Smart Inventory', sum.buy[0]], ['จัดซื้ออะไหล่เพิ่มโดย ผพจ.', sum.buy[1]]];
    const rowsT = m.findAll(n => n.type === 'FRAME' && n.children && n.children.length === 2 && n.children.every(c => c.type === 'TEXT') && /^(Supporting text|Text)$/.test(n.children[0].name) && n.children[1].name === 'Text');
    let li = 0;
    for (const r of rowsT) {
      if (r.children[0].name === 'Supporting text' && lines[li]) { await text(m, r.children[0], lines[li][0]); await text(m, r.children[1], baht(lines[li][1])); li++; }
      else if (r.children[0].name === 'Text') await text(m, r.children[1], baht(lines.reduce((a, x) => a + x[1], 0)));
    }
    const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && n.parent.name === 'Actions');
    ft.forEach(b => { if (b.name === 'Primary button') setProps(b, { Text: 'ยืนยันเบิก/จอง', 'Leading icon': false, 'Trailing icon': false }); else if (b.name === 'Secondary button') setProps(b, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false }); else b.visible = false; });
    return;
  }
  await confirm(scr, { title: 'ยืนยันการเบิก/จองอะไหล่', sub: 'เบิกจากคลัง ' + o.stock + ' รายการ · คงเหลือไม่พอรอจัดซื้อ ' + o.buy + ' รายการ', ok: 'ยืนยันเบิก/จอง' });
}

/* ---------- S1 หน้ารายการแผน + ฟอร์มสร้างแผน ---------- */
const PLAN_COLS = [['เลขที่ MR', 150, 'Lead text', 'Down'], ['ชื่อแผน', 0, 'Text', 'Swap'], ['ภาค', 200], ['จำนวนรถ', 100], ['รถรายไตรมาส', 210], ['คลังรับทราบ', 130], ['สถานะ', 150, 'Badge', 'Swap'], ['', 60]];   // 2 พ.ย. 2569 เพิ่มคลังรับทราบ (S22) · ปีงบประมาณย้ายเป็นบรรทัดรองของชื่อแผน (Table 8 คอลัมน์เต็ม)   // 30 ต.ค.: แผนปี · เลขที่ MR Z69000XX นำหน้า (ประเภทรถอยู่ในชื่อแผน) · Table 8 คอลัมน์
const qCell = (t) => { const q = t.split(' · '); return { text: q.slice(0, 2).join(' · '), sub: q.slice(2).join(' · ') }; };   // 4 ไตรมาสยาวเกินคอลัมน์ ⇒ 2 บรรทัด (เจ้าของงาน 2 พ.ย. 2569 เปลี่ยน Q1 เป็นไตรมาส)
/* คลังรับทราบรายไตรมาส (S22): ก่อนอนุมัติ = "-" · หลังอนุมัติ = รับทราบแล้ว / ไตรมาสที่มีรถ · WH_ACK = จำนวนไตรมาสที่คลังรับทราบแล้วต่อเลขที่ MR (ค่าสมมติ) */
const WH_ACK = { 'MR Z7000004': 1, 'MR Z7000001': 2 };
const qWithCars = (p) => (p[9].match(/: (\d+)/g) || []).filter(x => +x.slice(2) > 0).length;
const whCell = (p) => p[5] === 'review' || p[5] === 'returned' ? '-' : (p[5] === 'closed' ? qWithCars(p) : WH_ACK[p[0]] || 0) + '/' + qWithCars(p) + ' ไตรมาส';
const planRow = (p) => [p[0], { text: p[1], sub: 'ปีงบประมาณ ' + p[8] }, p[2], p[4], qCell(p[9]), whCell(p), { pill: PST[p[5]] }, { menu: 1 }];
async function listScreen(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'บำรุงรักษาตามวาระ', primary: 'สร้างแผน' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tableHeader(o), 'h');
  add(sec, await tbl(PLAN_COLS, (o.rows || PLANS).map(planRow), { pagination: (o.rows || PLANS).length }), 'h');
  return scr;
}
const CARS = VEH.map(v => [v[0], v[1], v[2]]);
/* ฟอร์มสร้างแผน — 30 ต.ค. 2569 แผนปี: ปีงบประมาณ (เลือกได้ทุกปี) + แท็บไตรมาส 1–4 จัดรถลงไตรมาส · ปุ่ม "บันทึกและส่งอนุมัติ" (อนุมัติทั่วไป ไม่ผ่าน ผพจ.)
   2 พ.ย. 2569 (R35): เลือกภาค → เขตภายใต้ภาค → ประเภทรถ แล้วจึงเห็นรถ · เลือกรถแบบ R24 ของ Overhaul (ช่องค้นหา + ชิป) แทนตารางติ๊ก
   ชิป = รถของไตรมาสที่แท็บเปิดอยู่ · 1 คันอยู่ได้ไตรมาสเดียว ทุกคันที่จัดแล้วมี "ไตรมาส n" ต่อท้ายทะเบียนในรายการ (เจ้าของงาน 2 พ.ย. 2569) · สลับเขตเพื่อเพิ่มรถได้ ชิปเขตเดิมไม่หาย
   o.noCars = เขตและประเภทรถนี้ไม่มีรถ · o.picks = อะไหล่ที่เลือกรายคัน · o.manualCars = คันที่ระบุอะไหล่เอง · o.alloc = { ลำดับรถใน CAND: ไตรมาส } · o.q = แท็บที่เปิด · o.yearOpen / o.regionOpen / o.districtOpen / o.carOpen = รายการเปิด · o.carQuery = คำค้นรถ
   o.edit = ฟอร์มแก้ไข S19: ปีงบประมาณ Readonly (เลขที่ MR ผูกกับปี) · ปุ่มซ้าย "ยกเลิก" แบบบล็อก C ของ Overhaul · o.alert = [สี, หัวข้อ, ข้อความ] เหนือฟอร์ม */
const YEARS = ['2568', '2569', '2570', '2571', '2572'];   // เจ้าของงาน "ไม่จำกัดปี" — จำนวนปีที่แสดงยังไม่รู้ (Q31)
const CARP_COLS = [['ทะเบียน', 230, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 180], ['น้ำมันไฮโดรลิก', 140], ['เปลี่ยนล่าสุด', 120], ['อะไหล่', 120], ['', 104]];   // ไอคอนแก้ไข + ลบรถออกจากไตรมาส กว้าง 104 แบบบล็อก J ของ Overhaul · ตารางรถในไตรมาส (เจ้าของงาน 2 พ.ย. 2569 "section ของรถที่เลือกมาไตรมาสนั้น")
const CAR_PICK = [1, 2, 3];                 // ไส้กรองที่ กบค. เลือกให้รถ 1 คันในข้อมูลตัวอย่าง (ลำดับใน PARTS) · น้ำมันไฮโดรลิก (0) เข้ารายการเมื่อเลือกเปลี่ยนน้ำมัน
const CAR_QTY = [30, 2, 2, 2, 2];           // จำนวนต่อคัน (ค่าสมมติ)
const MANUAL = { name: 'ไส้กรองอากาศขนาดเล็ก', code: '', price: '750', qty: 2 };   // รายการที่ กบค. ระบุเอง ค่าตามจอ "รายการเพิ่มเติม" ของงานซ่อม
const MANUAL_ROW = [MANUAL.name, '-', 'เพิ่มเอง', String(MANUAL.qty), 'ชิ้น'];
/* อะไหล่ในไตรมาส = รวมจากรถของไตรมาสนั้น · เจ้าของงาน 2 พ.ย. 2569 "ไม่มี suggest มาให้เลย ให้เลือกเอง" + "หัวข้ออะไหล่ เป็นอะไหล่ในไตรมาสนั้นๆ" ⇒ picks = { ลำดับรถ: [ลำดับอะไหล่] } ว่างเมื่อยังไม่เลือก */
const quarterParts = (cars, picks) => PARTS.map((p, i) => [p[0], p[1], p[2], String(CAR_QTY[i] * cars.filter(c => (picks[c] || []).indexOf(i) >= 0).length), p[4]]).filter(r => +r[3] > 0);
async function noCarsInQ() { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มีรถในไตรมาสนี้'); await text(es, 'Supporting text', 'ค้นทะเบียนในช่องเลือกรถเพื่อเพิ่มรถเข้าไตรมาสนี้'); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
async function noParts(sub) { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มีรายการอะไหล่'); await text(es, 'Supporting text', sub); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
const OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน'];   // เจ้าของงาน 2 พ.ย. 2569: น้ำมันไฮโดรลิกไม่ได้เปลี่ยนทุกปี ให้ผู้ใช้เลือกเอง ระบบไม่ตัดสินจากเงื่อนไขอายุ
const LAST_OIL = ['12/03/2568', '12/03/2568', '05/02/2567', '20/11/2566', 'ไม่มีข้อมูล', '18/06/2568', '09/01/2566'];   // เปลี่ยนน้ำมันครั้งล่าสุดตามลำดับ CAND
const QUARTERS = ['ไตรมาส 1 (ต.ค.–ธ.ค.)', 'ไตรมาส 2 (ม.ค.–มี.ค.)', 'ไตรมาส 3 (เม.ย.–มิ.ย.)', 'ไตรมาส 4 (ก.ค.–ก.ย.)'];
async function planForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const heading = o.edit ? 'แก้ไขแผน ' + NEW_PLAN[0] : 'สร้างแผนบำรุงรักษา';
  const { scr, page } = await shell(name, { title: heading, back: true, crumbs: [o.edit ? heading : 'สร้างแผน'] });
  const regions = o.regions || [], districts = o.districts || [], types = o.types || [];   // ภาค เขต ประเภทรถ เลือกได้หลายค่า (R35 · 2 พ.ย. 2569)
  const ready = regions.length && districts.length && types.length, alloc = o.alloc || {}, q = o.q || 1;
  const nIn = Object.keys(alloc).length;
  const yr = o.edit ? field('ปีงบประมาณ', v.year, { state: 'Readonly' })
    : dropdown('ปีงบประมาณ', v.year || '', { placeholder: 'เลือกปีงบประมาณ', error: E('กรุณาเลือกปีงบประมาณ'), state: o.yearOpen ? 'Focused' : undefined });
  const reg = multiDropdown('ภาค', regions, { placeholder: 'เลือกภาค', error: E('กรุณาเลือกภาค'), state: o.regionOpen ? 'Focused' : undefined });
  const dist = multiDropdown('เขต', districts, { placeholder: 'เลือกเขต', error: regions.length ? E('กรุณาเลือกเขต') : '', state: o.districtOpen ? 'Focused' : regions.length ? undefined : 'Disabled' });
  const typ = multiDropdown('ประเภทรถ', types, { placeholder: 'เลือกประเภทรถ', error: districts.length ? E('กรุณาเลือกประเภทรถ') : '', state: districts.length ? undefined : 'Disabled' });
  const carSec = col('Section', [await section('เลือกรถเข้าแผนและจัดลงไตรมาส', { badge: nIn ? 'ในแผน ' + nIn + ' คัน' : null }), row('Row', [reg, dist, typ])], 16);
  let pick = null;
  if (ready && !o.noCars) {
    add(carSec, await tabs(QUARTERS.map((t, i) => [t, Object.values(alloc).filter(x => x === i + 1).length]), q - 1), 'h');
    pick = await carPick(null, CAND, CAND.map((_, i) => i).filter(i => alloc[i] === q), { chips: false, query: o.carQuery, open: o.carOpen, only: c => districts.indexOf(dCode(c)) >= 0, note: i => alloc[i] ? 'ไตรมาส ' + alloc[i] : '' });
    add(carSec, pick.sec, 'h');
  } else { const es = inst('Empty state/Data empty'); add(carSec, es, 'h'); await text(es, 'Text', 'ยังไม่มีรายการรถ'); await text(es, 'Supporting text', o.noCars ? 'ไม่มีรถที่ตรงกับเขตและประเภทรถที่เลือก' : o.errors ? 'กรุณาเลือกรถเข้าแผนอย่างน้อย 1 คัน — เลือกภาค เขต และประเภทรถก่อน' : 'เลือกภาค เขต และประเภทรถเพื่อแสดงรายการรถในเขต'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  /* อะไหล่รายไตรมาส (R36): ตารางรายคันและหัวข้ออะไหล่แสดงเฉพาะรถของแท็บที่เปิด · ปุ่มเพิ่มอะไหล่อยู่ที่หัวข้ออะไหล่ ปิดไว้จนกว่าไตรมาสนี้จะมีรถ · ไอคอนแก้ไขที่แถวรถเข้าหน้า S21 ของคันนั้น · เอารถออกด้วยการกดคันที่ติ๊กไว้ในรายการเลือกรถอีกครั้ง (ไม่มีชิปและไอคอนลบ ตามภาพเจ้าของงาน 2 พ.ย. 2569) */
  const picks = o.picks || {}, manualCars = o.manualCars || [], inQ = Object.keys(alloc).map(Number).filter(i => alloc[i] === q);
  const count = (i) => (picks[i] || []).length + (manualCars.indexOf(i) >= 0 ? 1 : 0);
  const carParts = ready && !o.noCars ? col('Section', [await section('รถในไตรมาส ' + q, { badge: inQ.length ? inQ.length + ' คัน' : null }),
    inQ.length ? await tbl(CARP_COLS, inQ.map(i => [CAND[i][0], CAND[i][1], CAND[i][2], OIL_OPTS[(picks[i] || []).indexOf(0) >= 0 ? 1 : 0], LAST_OIL[i], count(i) ? count(i) + ' รายการ' : 'ยังไม่เลือก', { icons: ['stylus-24-300-round', 'delete-24-300-round'] }])) : await noCarsInQ()], 16) : null;
  const qRows = quarterParts(inQ, picks).concat(manualCars.some(i => inQ.indexOf(i) >= 0) ? [MANUAL_ROW] : []);
  const partsSec = col('Section', [await section('อะไหล่ในไตรมาส' + (ready && !o.noCars ? ' ' + q : ''), { badge: qRows.length || null, buttons: [{ kind: 'Secondary button', text: 'เพิ่มอะไหล่', icon: 'add-24-300-round', disabled: !inQ.length }] })], 16);
  add(partsSec, qRows.length ? await tbl(PART_COLS.slice(0, 5).concat([['', 104]]), qRows.map(r => r.concat([{ icons: ['stylus-24-300-round', 'delete-24-300-round'] }]))) :   // แก้ไข = หน้า S21 · ลบ = ยืนยันแล้วเอาออกจากทุกคันในไตรมาส (เจ้าของงาน 2 พ.ย. 2569) · กว้าง 104 แบบบล็อก J ของ Overhaul
    await noParts(inQ.length ? 'กดเพิ่มอะไหล่เพื่อเลือกอะไหล่ของรถในไตรมาสนี้' : 'เลือกรถเข้าไตรมาสนี้ก่อน แล้วจึงเพิ่มอะไหล่ได้'), 'h');
  add(page, col('Content', (o.alert ? [alertBox(...o.alert)] : []).concat([
    col('Section', [await section('ข้อมูลแผน'),
      row('Row', [field('ชื่อแผน', v.name, { placeholder: 'ระบุชื่อแผน', error: E('กรุณาระบุชื่อแผน') }), yr])], 16),
    carSec,
    carParts,
    partsSec,
    btnRow([['Secondary button', o.edit ? 'ยกเลิก' : 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกและส่งอนุมัติ', { size: 'lg' }]])
  ]), 32), 'h');
  if (o.yearOpen) comboAt(scr, yr.findOne(n => n.name === 'Container') || yr, YEARS.map(y => [y, '', y === v.year]));
  if (o.regionOpen) comboAt(scr, reg.findOne(n => n.name === 'Container') || reg, REGIONS.map(r => [r, '', regions.indexOf(r) >= 0]));
  if (o.districtOpen) comboAt(scr, dist.findOne(n => n.name === 'Container') || dist, regions.flatMap(r => DISTRICTS[r]).map(d => [d, '', districts.indexOf(d) >= 0]));
  if (pick) pick.open(scr);
  return scr;
}
const FILLED = { name: NEW_PLAN[1], year: '2570' };
const R2 = { regions: [REGIONS[1]], districts: ['กฟฉ.1', 'กฟฉ.2', 'กฟฉ.3'], types: ['รถกระเช้า'] };   // ภาค 2 · 3 เขต · รถกระเช้า → รายการรถ 7 คัน
const A_Q1 = { 0: 1, 1: 1, 2: 1 };                          // แท็บไตรมาส 1: เลือกไว้ 3 คัน
const A_PICKS = { 0: CAR_PICK, 1: CAR_PICK, 2: CAR_PICK, 3: CAR_PICK, 5: CAR_PICK, 6: CAR_PICK };   // เลือกอะไหล่ครบทุกคันแล้ว
const A_ALL = { 0: 1, 1: 1, 2: 1, 3: 2, 5: 2, 6: 3 };       // จัดครบ: ไตรมาส 1 3 คัน · ไตรมาส 2 2 คัน · ไตรมาส 3 1 คัน · ไตรมาส 4 ว่าง · รถซ่อม (83-1207) ไม่อยู่ในแผน · มีรถจากเขตอื่น (สลับเขตแล้วเพิ่มต่อ)

/* ---------- S4 ความคืบหน้าและเบิกอะไหล่ของไตรมาส (2 พ.ย. 2569 รวม S5 เดิม · ตัดการตรวจรถ) ----------
   เจ้าของงาน: "S4 จะไม่ได้เป็นการตรวจความพร้อมของรถ แต่จะเป็นการตรวจความคืบหน้าอะไหล่แทน … เห็นว่าใน smart inventory มีจำนวนเท่าไร" + "รวบ s4 s5 เป็นหน้าเดียวกัน ยุบ S5 ออก"
   เฉพาะไตรมาสที่กำลังทำ · ตารางต้องเบิก เทียบคงเหลือ Smart Inventory · สถานะการเบิกรายรายการ · ปุ่มเบิก/จองในหน้าเดียวกัน
   o.picked = อะไหล่ของไตรมาส (ว่าง = ยังไม่มีในแผน) · o.result = 'short' | 'ok' · o.inv = 'API error' */
const Q_ALL = PARTS.map((_, i) => i);
const WD = { wait: ['รอเบิก', 'Gray'], reserved: ['จองแล้ว', 'Info'], taken: ['เบิกแล้ว', 'Success'], buy: ['รอจัดซื้อ', 'Warning'] };
const PROG_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['ต้องเบิก', 110], ['หน่วย', 90], ['คงเหลือ Smart Inventory', 200], ['ไม่พอ', 100], ['สถานะการเบิก', 150, 'Badge']];
async function partsProgress(name, o) {
  o = o || {};
  const picked = o.picked || [], down = o.inv === 'API error';
  const st = (i) => o.result === 'ok' ? WD.taken : o.result === 'short' ? (shortOf(i) > 0 ? WD.buy : WD.reserved) : WD.wait;
  const { scr, page } = await shell(name, { title: 'ความคืบหน้าอะไหล่ · ' + NOW_Q, back: true, crumbs: ['แผน ' + P[0], NOW_Q, 'ความคืบหน้าอะไหล่'] });
  const nodes = [alertBox('Info', 'คลังรับทราบรายการอะไหล่' + NOW_Q + 'แล้ว', 'รถ ' + NOW_CARS + ' คันของไตรมาสนี้ · คลังรับทราบ 02/11/2569')];
  if (down) nodes.push(alertBox('Error', 'เชื่อมต่อ Smart Inventory ไม่ได้', 'ยังดูคงเหลือและเบิก/จองไม่ได้ ลองใหม่อีกครั้ง'));
  if (o.result === 'short') nodes.push(alertBox('Warning', 'จองได้ ' + picked.filter(i => !shortOf(i)).length + ' รายการ · คงเหลือไม่พอ ' + picked.filter(i => shortOf(i)).length + ' รายการ', 'ไส้กรองไฮโดรลิก ขาด ' + shortOf(1) + ' ชิ้น · ไส้กรองเชื้อเพลิง ขาด ' + shortOf(4) + ' ชิ้น — รอจัดซื้อแล้วเข้าคลัง'));
  if (o.result === 'ok') nodes.push(alertBox('Success', 'เบิกอะไหล่ครบแล้ว', 'เบิกจาก Smart Inventory ' + picked.length + ' รายการ · ไปทำแผนเดินทางของไตรมาสได้'));
  const sec = col('Section', [await sectionLabel('อะไหล่ที่ต้องเบิกใน' + NOW_Q, { badge: picked.length || null })], 16);
  if (picked.length) add(sec, await tbl(PROG_COLS, picked.map(i => [PARTS[i][0], PARTS[i][1], PARTS[i][3], PARTS[i][4], down ? '-' : PARTS[i][5], down || o.result === 'ok' || !shortOf(i) ? '-' : String(shortOf(i)), { pill: st(i) }])), 'h');
  else add(sec, await noParts('ไตรมาสนี้ยังไม่มีอะไหล่ในแผน เพิ่มอะไหล่ได้ที่แก้ไขแผน'), 'h');
  nodes.push(sec);
  // 3 พ.ย. 2569 เจ้าของงาน: ถอดการ์ดรูปแบบดำเนินการออกจาก S4 — ย้ายไปเลือกในฟอร์มแผนเดินทาง (S6 ดำเนินการเอง / S9 จ้างดำเนินการ) · ปุ่ม "ไปทำแผนเดินทาง" พาไปหน้าแผนเดินทางของไตรมาส
  nodes.push(btnRow(o.result === 'ok' ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ไปทำแผนเดินทาง', { size: 'lg' }]]
    : o.result === 'short' ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ไปทำแผนเดินทาง', { size: 'lg', disabled: true }]]
    : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'เบิก/จองอะไหล่', { size: 'lg', disabled: !picked.length || down }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S6 แผนเดินทาง (ตรวจเอง) ---------- */
/* หน้าแผนเดินทางของไตรมาส (3 พ.ย. 2569 เจ้าของงาน "อยากให้แสดงรถทั้งหมดในแผน และมีให้เพิ่มแผนการเดินทาง" → เลือกรถของไตรมาสที่กำลังทำ · หน้าเดียว 2 ส่วน)
   ส่วนรถ: รถทุกคันของไตรมาส + ช่วงวันเดินทาง + ป้ายแผนเดินทางที่รถอยู่ (ยังไม่มี = Gray) · ส่วนแผนเดินทาง: รายการใบ + ปุ่มสร้างแผนเดินทาง
   หน้า Detail ⇒ Section label (R3) · o.trips = แผนเดินทางที่ยืนยันแล้ว [{ sel, locs, d1, d2, st }] เรียงตามลำดับที่สร้าง */
const TRIP_Q_COLS = [['ทะเบียน', 170, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 160], ['เบอร์ติดต่อ', 150], ['ช่วงวันเดินทาง', 210], ['แผนเดินทาง', 240]];   // มีใบ = ชื่อแผนเดินทาง (Text) · ยังไม่มี = Badge Gray · เบอร์ติดต่อ 3 พ.ย. 2569 เจ้าของงาน "หน้า e1 ก็อยากให้มีเบอร์ติดต่อด้วย" (อยู่ในใบแล้ว = เบอร์ของใบนั้น)
const TRIP_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวัน', 220], ['รถ (คัน)', 100], ['ผู้ดำเนินการ', 260], ['สถานะ', 150, 'Badge'], ['', 72]];
const tripPlaces = (t) => { const n = new Set(t.sel.map(i => tripLoc(i, t.locs))).size, own = t.sel.filter(i => !t.locs[i]).length; return n + ' แห่ง' + (own ? ' (สำนักงานเจ้าของรถ ' + own + ' คัน)' : ''); };
async function tripList(name, o) {
  o = o || {};
  const trips = o.trips || [];
  const { scr, page } = await detail(name, { crumbs: [NOW_Q, 'แผนเดินทาง'], status: 'active' });
  const tripOf = (i) => trips.findIndex(t => t.sel.indexOf(i) >= 0);
  const cars = col('Section', [await sectionLabel('รถใน' + NOW_Q, { badge: TRIP_CARS.length }),
    await tbl(TRIP_Q_COLS, TRIP_CARS.map((c, i) => { const k = tripOf(i); return [c[0], c[1], c[2], tripPhoneCell(i, k >= 0 ? trips[k].phones : null), k >= 0 ? trips[k].d1 + ' – ' + trips[k].d2 : '—', k >= 0 ? trips[k].name : { pill: ['ยังไม่มีแผนเดินทาง', 'Gray'] }]; }))], 16);
  const sec = col('Section', [await sectionLabel('แผนเดินทาง', { badge: trips.length, buttons: [{ kind: 'Primary button', text: 'สร้างแผนเดินทาง', icon: 'add-24-300-round' }] })], 16);
  if (trips.length) add(sec, await tbl(TRIP_COLS, trips.map(t => [{ text: t.name, sub: tripPlaces(t) }, t.d1 + ' – ' + t.d2, String(t.sel.length), tripBy(t), { pill: TST[t.st] }, { icons: ['keyboard_arrow_right-20-400-round'] }])), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ยังไม่มีแผนเดินทาง'); await text(es, 'Supporting text', 'สร้างแผนเดินทางเพื่อนัดวันเข้าตรวจ แจ้งเจ้าของรถและ กรย.'); const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false; const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'สร้างแผนเดินทาง', 'Leading icon swap': icon('add-24-300-round') }); }
  add(page, col('Content', [await vehicleInfo(TRIP_KV, 'รายละเอียดแผน'), cars, sec], 32), 'h');
  return scr;
}
/* ฟอร์มสร้างแผนเดินทาง — 2 พ.ย. 2569 เจ้าของงาน: สถานที่บำรุงรักษารายคัน ค่าเริ่มต้นสำนักงานที่รถอยู่
   3 พ.ย. 2569 เจ้าของงาน: เลือกรถจากรายการรถทั้งหมดของไตรมาส ผ่านปุ่ม "เพิ่มรถ" (popup tripCarModal) · 1 ไตรมาสมีหลายแผนเดินทางได้
   รถที่อยู่ในแผนเดินทางใดแล้วไม่มีให้เลือกในแผนเดินทางถัดไป
   o.sel = รถในแผนเดินทางนี้ (ลำดับใน VEH) · o.locs = สถานที่ที่แก้ { ลำดับรถ: ข้อความ } · o.phones = เบอร์ติดต่อที่แก้ { ลำดับรถ: เบอร์ } */
const TRIP_CAR_COLS = [['ทะเบียน', 180, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 160], ['เบอร์ติดต่อ', 150], ['สถานที่บำรุงรักษา', 290], ['', 104]];
async function tripForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const head = o.edit ? 'แก้ไขแผนเดินทาง' : 'สร้างแผนเดินทาง';   // o.edit = แก้ใบที่ผู้อนุมัติส่งกลับ (S7) · ฟอร์มเดียวกัน ปุ่มท้าย "ส่งอนุมัติใหม่"
  const { scr, page } = await shell(name, { title: head + ' · ' + NOW_Q, back: true, crumbs: ['แผน ' + P[0], NOW_Q, head] });
  const sel = o.sel || [];
  const car = { sec: col('Section', [await section('รถในแผนเดินทาง', { badge: sel.length || null, buttons: [{ kind: 'Secondary button', text: 'เพิ่มรถ', icon: 'add-24-300-round' }] })], 16) };
  if (sel.length) add(car.sec, await tbl(TRIP_CAR_COLS, sel.map(i => [TRIP_CARS[i][0], TRIP_CARS[i][1], TRIP_CARS[i][2], tripPhoneCell(i, o.phones), { text: tripLoc(i, o.locs), sub: (o.locs || {})[i] ? 'แก้จากสำนักงานเจ้าของรถ' : 'ค่าเริ่มต้น สำนักงานที่รถอยู่' }, { icons: ['stylus-24-300-round', 'delete-24-300-round'] }])), 'h');
  else {
    if (E('x')) add(car.sec, alertBox('Error', 'กรุณาเพิ่มรถเข้าแผนเดินทางอย่างน้อย 1 คัน'), 'h');
    add(car.sec, await noTripCars(), 'h');
  }
  const hire = o.mode === 'hire';   // o.mode = 'hire' จ้างดำเนินการ (S9) · ค่าเริ่มต้น กบค. ดำเนินการเอง (S6)
  // 3 พ.ย. 2569 เจ้าของงาน: ชื่อแผนเดินทางกับรูปแบบดำเนินการแถวเดียวกันคนละครึ่ง radio เล็ก (เดิม Radio text card เต็มแถว) · mobile เรียงลงตาม row()
  const mode = radioGroup('รูปแบบดำเนินการ', ['กบค. ดำเนินการเอง', 'จ้างดำเนินการ'], hire ? 1 : 0);
  const vendor = hire ? dropdown('ผู้รับจ้าง', v.vendor, { placeholder: 'ค้นหาชื่อผู้รับจ้าง', lead: 'search-24-300-round', error: E('กรุณาเลือกผู้รับจ้าง'), state: o.vendorOpen ? 'Focused' : undefined }) : null;
  const d1 = field(hire ? 'วันที่เริ่มงาน' : 'วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม'), state: o.dateOpen ? 'Focused' : undefined });
  const d2 = field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') });
  const staff = [0, 1, 2].map(i => dropdown('พนักงาน กบค. ซ่อม คนที่ ' + (i + 1) + (i === 2 ? ' (ถ้ามี)' : ''), v.staff ? v.staff[i] : '', { placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round', error: i < 2 ? E('กรุณาเลือกพนักงาน') : '' }));
  add(page, col('Content', [
    o.alert ? alertBox(...o.alert) : null,
    col('Section', [await section('ข้อมูลแผนเดินทาง'), row('Row', [field('ชื่อแผนเดินทาง', v.name, { placeholder: 'ระบุชื่อแผนเดินทาง', error: E('กรุณาระบุชื่อแผนเดินทาง') }), mode])], 16),   // ตามช่อง "ชื่อแผน" ของ S1 (ข้อมูลแผน) + radio แบบ 5.1 Rental Contract Management
    hire ? col('Section', [await section('ผู้รับจ้าง'), row('Row', [vendor, field('เลขที่สัญญา/ใบสั่งจ้าง', v.contract, { placeholder: 'ระบุเลขที่สัญญาหรือใบสั่งจ้าง', optional: true })])], 16) : null,
    car.sec,
    col('Section', [await section(hire ? 'ช่วงวันทำงาน' : 'ช่วงวันเดินทาง'), row('Row', [d1, d2, frame('Spacer', 'VERTICAL')])], 16),
    hire ? null : col('Section', [await section('พนักงาน กบค. ซ่อม (2-3 คน)'), row('Row', staff)], 16),
    // 3 พ.ย. 2569 เจ้าของงาน: ค่าเบี้ยเลี้ยง ค่าที่พัก ค่าเดินทาง ไม่กรอกในแผนเดินทางแล้ว ย้ายไปกรอกรายคันตอนปิดงาน (S10) พร้อมเลือกงบ ตั้งต้นศูนย์ต้นทุนของหน่วยงานเจ้าของรถ
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', o.edit ? 'ส่งอนุมัติใหม่' : 'ยืนยันการสร้างแผนเดินทาง', { size: 'lg' }]])
  ], 32), 'h');
  if (o.vendorOpen && vendor) comboAt(scr, vendor.findOne(n => n.name === 'Container') || vendor, VENDORS.map(x => [x[0], x[1], x[0] === v.vendor]));   // vendor list = Dropdown list ใต้ช่อง (R4 พิมพ์ค้น)
  if (o.modal) await tripCarModal(scr, o.modal);
  if (o.dateOpen && !MOB) {   // ปฏิทินช่วงวัน = Date picker Type=Dual ของไลบรารี วางใต้ช่องวันที่
    const dp = inst('Date picker', { Type: 'Dual' }, { 'Time picker': false });
    overlay(scr, dp, 0, 0);
    const sb = scr.absoluteBoundingBox, ab = d1.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4;
  }
  return scr;
}
const TRIP_FILLED = { name: 'ตรวจรถ ขอนแก่น อุดรธานี ลำปาง', place: TRIP.place, d1: TRIP.d1, d2: TRIP.d2, staff: TRIP.staff, perDiem: TRIP.perDiem, lodging: TRIP.lodging, travel: TRIP.travel };
/* popup แก้ไขรถในแผนเดินทาง (ไอคอนแก้ไขในแถว) = formModal (Modal Type=Form) 2 ช่อง เบอร์ติดต่อ + สถานที่บำรุงรักษา · ค่าตั้งต้นในช่อง = ค่าปัจจุบันของแถว
   3 พ.ย. 2569 เพิ่มเบอร์ติดต่อ (เดิมแก้แค่สถานที่) · ตัวอย่างแสดงค่าที่กำลังแก้ */
async function tripCarEdit(scr, i, phones, locs) { await formModal(scr, { title: 'แก้ไขเบอร์ติดต่อและสถานที่ · ' + TRIP_CARS[i][0], fields: [{ label: 'เบอร์ติดต่อ', value: tripPhone(i, phones) }, { label: 'สถานที่บำรุงรักษา', value: tripLoc(i, locs) }], ok: 'บันทึก' }); }
async function noTripCars() { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'ยังไม่มีรถในแผนเดินทาง'); await text(es, 'Supporting text', 'กดเพิ่มรถเพื่อเลือกรถของ' + NOW_Q + 'ที่ยังไม่อยู่ในแผนเดินทางใด'); const a = find(es, 'Actions'); if (a) a.visible = false; return es; }
/* popup เพิ่มรถเข้าแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "รายการรถทั้งหมดที่อยู่ในแผนไตรมาสนั้น โดยมีปุ่มให้เพิ่มรถเข้าแผนการเดินทาง")
   ตามโครง Modal Type=Card list Size=xl "เลือกยานพาหนะ" ของไฟล์ Component (Modal header + Table header ค้นหา + เนื้อหา ขอบใน 24 ระยะ 24 มุม 12)
   + ตารางติ๊กเลือกรถ Table Lead checkbox ตามหน้า Vehicle Management "Export reports - Select vehicles" ของ UI Release#2 + Modal footer Horizontal right
   Modal instance เพิ่มตารางข้างในไม่ได้ ⇒ วางชิ้นไลบรารีเรียงในกรอบ Modal แบบเดียวกับ bottom sheet (§จ) · กว้าง 800 = Modal Size=lg · mobile = bottom sheet
   o.pool = รถที่เลือกได้ (ของไตรมาสที่ยังไม่อยู่ในแผนเดินทางใด และยังไม่อยู่ในใบนี้) · o.ticked = ที่ติ๊กไว้ · o.used = จำนวนรถของไตรมาสที่อยู่ในแผนเดินทางอื่นแล้ว */
const TRIP_PICK_COLS = [['ทะเบียน', 240], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 200]];
async function tripCarModal(scr, o) {
  const pool = o.pool, ticked = o.ticked || [], n = ticked.length;
  const sub = 'รถของ' + NOW_Q + 'ที่ยังไม่อยู่ในแผนเดินทางใด' + (o.used ? ' · อีก ' + o.used + ' คันอยู่ในแผนเดินทางอื่นแล้ว' : '');
  const ok = 'เพิ่มเข้าแผนเดินทาง' + (n ? ' (' + n + ')' : '');
  const rows = pool.map(i => [{ check: ticked.indexOf(i) >= 0, text: TRIP_CARS[i][0] }, TRIP_CARS[i][1], TRIP_CARS[i][2]]);
  const empty = async () => { const es = inst('Empty state/Data empty'); await text(es, 'Text', 'รถทุกคันของ' + NOW_Q + 'อยู่ในแผนเดินทางแล้ว'); await text(es, 'Supporting text', 'ไม่มีรถที่เพิ่มเข้าแผนเดินทางนี้ได้'); const a = find(es, 'Actions'); if (a) a.visible = false; return es; };
  const search = () => { const f = field('', '', { placeholder: 'ค้นหาทะเบียน, ยี่ห้อ/รุ่น, หน่วยงาน', lead: 'search-24-300-round' }); setProps(f, { Label: false, Helper: false }); return f; };
  if (MOB) { await popupModal(scr, { title: 'เพิ่มรถเข้าแผนเดินทาง', body: pool.length ? [search(), await tbl(TRIP_PICK_COLS, rows)] : [await empty()], ok, okOff: !n }); return; }
  const body = [];
  if (pool.length) {
    const th = await tableHeader({ placeholder: 'ค้นหาทะเบียน, ยี่ห้อ/รุ่น, หน่วยงาน' });
    const acts = find(th, 'Actions'); if (acts) acts.visible = false;
    const t = await tbl(TRIP_PICK_COLS, rows);
    const hc = t.findOne(n2 => n2.type === 'INSTANCE' && n2.name === 'Table header cell');   // เลือกทั้งหมดที่หัวคอลัมน์แรก (ตาม Select vehicles)
    if (hc) { setProps(hc, { Checkbox: 'True' }); const cb = find(hc, 'Checkbox'); if (cb) setProps(cb, { Type: n === 0 ? 'Unselected' : n === pool.length ? 'Selected' : 'Indeterminate' }); }
    body.push(th, t);
  } else body.push(await empty());
  await popupModal(scr, { title: 'เพิ่มรถเข้าแผนเดินทาง', sub, w: 800, body, ok, okOff: !n });
}
/* popup ประกอบจากไลบรารี (Modal ของไลบรารีใส่ Table / File upload ไม่ได้): Background overlay + กรอบ Modal (มุม 12) + Modal header + เนื้อหา (ขอบใน 24 ระยะ 24) + Modal footer Horizontal right
   ตามโครง Modal Type=Card list xl ของไฟล์ Component + popup Open Job / Repair Completed หน้า RP & MA Job ของ UI Release#2 · mobile = bottom sheet (sheet())
   o.title · o.sub · o.w (กว้าง ค่าเริ่ม 640) · o.body (node เนื้อหา) · o.ok (ปุ่มหลัก) · o.okOff = ปุ่มหลักกดไม่ได้ · 3 พ.ย. 2569 แยกจาก tripCarModal ให้ S10 ใช้ด้วย */
async function popupModal(scr, o) {
  if (MOB) {
    const r = await sheet(scr, { title: o.title, content: o.body, ok: o.ok, cancel: 'ยกเลิก' });
    const pb = find(r.sh, 'Primary button'); if (pb && o.okOff) setProps(pb, { State: 'Disabled' });
    return r;
  }
  overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), VH());
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
  ft.findAll(b => b.type === 'INSTANCE' && /button/.test(b.name) && b.parent && b.parent.name === 'Actions').forEach(b => {
    if (b.name === 'Primary button') setProps(b, { Text: o.ok, 'Leading icon': false, 'Trailing icon': false, State: o.okOff ? 'Disabled' : 'Default' });
    else if (b.name === 'Secondary button') setProps(b, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
    else b.visible = false;
  });
  m.x = (VW() - m.width) / 2; m.y = Math.max(40, (VH() - m.height) / 2);
  return { m, body };
}

/* ---------- S10 บำรุงรักษารายคันตามแผนเดินทาง (3 พ.ย. 2569 เจ้าของงาน "จริงมันควรเข้าได้จากหน้าแผนการเดินทาง แล้วเลือกบำรุงรถทีละคัน") ----------
   เลือกแล้ว: ทางเข้า = หน้ารายละเอียดแผนเดินทาง (ไอคอน › ในตารางแผนเดินทางของ E.1 หรือแจ้งเตือน) · หน้ารายคัน = ทำทีละขั้นตามหน้า RP & MA Job ของ UI Release#2
   (Page header Badge สถานะ + ปุ่มขวา · Section label + Content item row · popup เริ่มงาน แบบ Open Job · ปิดงานเป็นหน้าฟอร์มเต็ม เพราะตารางงาน + ภาพ 4 ช่อง + ช่องกรอก เกินความสูง popup)
   ข้อมูล = แผนเดินทางใบแรก TRIP_1 ที่อนุมัติแล้ว · รถคันแรก 82-6789 ขอนแก่น */
const JOB_T = tripAs(TRIP_1, 'approved'), JOB_I = TRIP_1.sel[0];
const JOB_START = '04/11/2569 08:42 น.', JOB_END = '04/11/2569 11:15 น.', JOB_BY = TRIP.staff[0] + ' (กบค.)';
const JOB_MIX = { [TRIP_1.sel[0]]: 'done', [TRIP_1.sel[1]]: 'doing', [TRIP_1.sel[2]]: 'cannot' };   // หลังปิดงานคันแรก: คันที่ 2 กำลังทำ · คันที่ 3 บำรุงรักษาไม่ได้ · คันที่ 4 ยังไม่เริ่ม
const JOB_CANNOT = 'รถติดภารกิจซ่อมสายส่งฉุกเฉิน ไม่อยู่ที่จุดนัดในวันเดินทาง';
const TRIP_JOB_COLS = [['ทะเบียน', 190, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['เบอร์ติดต่อ', 150], ['สถานที่บำรุงรักษา', 260], ['สถานะงาน', 320, 'Badge'], ['', 72]];   // 320 = สองป้าย (สถานะ + ผลน้ำมัน · 4 พ.ย. 2569)
/* ปุ่ม "…" ท้ายแถวรถ (3 พ.ย. 2569 เจ้าของงาน "คอลัมน์สุดท้ายอยากได้เป็นจุดสามจุดที่กดไปมีดูรายละเอียด แก้ไข และลบ") แบบเมนูรายการแผน S19 S20 (planMenu)
   รายการตามสถานะงาน (เสนอ): ยังไม่เริ่ม = ดูรายละเอียด แก้ไข ลบ · อยู่ระหว่างบำรุงรักษา = ดูรายละเอียด แก้ไข · เสร็จสิ้น / บำรุงรักษาไม่ได้ = ดูรายละเอียด
   แก้ไข = popup แก้เบอร์ติดต่อและสถานที่ (tripCarEdit เดียวกับ S6) · ลบ = ยืนยันแล้วเอารถออกจากแผนเดินทาง */
const JOB_MENU = { todo: MENU, doing: MENU.slice(0, 2), done: MENU.slice(0, 1), cannot: MENU.slice(0, 1), worked: MENU.slice(0, 1), reported: MENU.slice(0, 1), wait: MENU.slice(0, 1), returned: MENU.slice(0, 1) };   // done = คันที่เลือกน้ำมันแบบมีเก็บตัวอย่าง (ตัวอย่าง JOB_OIL) · ไม่ได้เก็บตัวอย่างเหลือ ดูรายละเอียด
const CAR_REMOVE_CONFIRM = (c) => ({ danger: true, title: 'ยืนยันการเอารถออกจากแผนเดินทาง', sub: c[0] + ' จะถูกเอาออกจากแผนเดินทางนี้ และเลือกเข้าแผนเดินทางใบอื่นของไตรมาสได้อีก', cancel: 'ยกเลิก', ok: 'เอาออก' });
async function tripDetail(name, o) {   // หน้ารายละเอียดแผนเดินทาง (หลังอนุมัติ) · o.trip = ใบที่แสดง (ค่าเริ่ม JOB_T · ใบจ้าง HIRE_T) · o.st = { ลำดับรถ: สถานะใน WSTAT } · o.menu / o.edit / o.del = เมนู … ของรถคันแรก
  o = o || {};
  const t = o.trip || JOB_T, st = (i) => (o.st || {})[i] || 'todo', cnt = (k) => t.sel.filter(i => st(i) === k).length;
  const prog = 'เสร็จสิ้น ' + cnt('done') + ' จาก ' + t.sel.length + ' คัน' + [['doing', 'อยู่ระหว่างบำรุงรักษา'], ['cannot', 'บำรุงรักษาไม่ได้'], ['wait', 'รอตรวจรับ'], ['returned', 'ส่งกลับแก้ไข']]
    .map(([k, l]) => cnt(k) ? ' · ' + l + ' ' + cnt(k) : '').join('');   // ใบจ้าง: รอตรวจรับ · ส่งกลับแก้ไข ต่อท้าย (S10 ตารางความคืบหน้า)
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: ['แผน ' + P[0], 'แผนเดินทาง ' + NOW_Q, t.name], badge: TST.approved });
  const rows = t.sel.map(i => [{ text: TRIP_CARS[i][0], sub: TRIP_CARS[i][2] }, TRIP_CARS[i][1], tripPhoneCell(i, t.phones), tripLoc(i, t.locs), st(i) === 'done' && (o.oil || {})[i] ? { pills: [WSTAT.done, OIL_TAG[o.oil[i]]], pillsHead: 'ผลตรวจน้ำมัน' } : { pill: WSTAT[st(i)] }, { menu: 1 }]);   // o.oil = { ลำดับรถ: wait|fail } ป้ายผลน้ำมันต่อจากสถานะ (S12 · 4 พ.ย. 2569)
  add(page, col('Content', [await vehicleInfo(tripKv(t).concat([['ความคืบหน้า', prog]]), 'รายละเอียดแผนเดินทาง'),
    col('Section', [await sectionLabel('รถในแผนเดินทาง', { badge: t.sel.length }), await tbl(TRIP_JOB_COLS, rows)], 16)], 32), 'h');
  const i0 = t.sel[0];
  if (o.menu) planMenu(scr, o.vendor ? MENU.slice(0, 1) : JOB_MENU[st(i0)]);   // ผู้รับจ้าง: ดูรายละเอียดอย่างเดียว ไม่มีแก้ไข ลบ (เจ้าของงาน 4 พ.ย. 2569)
  if (o.edit) await tripCarEdit(scr, i0, t.phones, t.locs);
  if (o.del) await confirm(scr, CAR_REMOVE_CONFIRM(TRIP_CARS[i0]));
  return scr;
}
/* S12 ผลการทดสอบน้ำมันไฮโดรลิก — 4 พ.ย. 2569 เจ้าของงาน "ไม่ได้อยากเป็น popup อยากได้เป็นส่วนหนึ่งของ flow เลย เช่น ถ้าเลือก เก็บตัวอย่างน้ำมันไฮดรอลิก ก็จะ มีให้เลือกเก็บผล แต่เป็น optional"
   + "ตอนนี้อยากให้ทางเข้าคือทางเดียวคือดูรายละเอียดแล้วเพิ่มในส่วนของรายละเอียด" ⇒ ใส่ผลได้ในหน้าปิดงาน (ไม่บังคับ) หรือภายหลังที่ section ในหน้างานรายคันที่เสร็จสิ้น · เลิก popup และเมนู "ผลการทดสอบน้ำมันไฮโดรลิก"
   รถที่เก็บตัวอย่างแต่ยังไม่มีผล = ป้าย "รอผลตรวจน้ำมัน" ต่อจากสถานะงาน (Table cell Style=Multiple badges · R49) · ผลไม่ผ่าน = "น้ำมันไม่ผ่าน" · ผ่าน = ป้ายสถานะอย่างเดียว
   (ช่องเดิม 3 พ.ย. 2569: radio ผ่าน/ไม่ผ่าน + ไฟล์ไม่บังคับ · ผลเก็บในข้อมูลรถ · ยังไม่แจ้งเจ้าของรถ) */
const OIL_FILE = pdf('oil-test-82-6789.pdf', '420 KB');
const OIL_TAG = { wait: ['รอผลตรวจน้ำมัน', 'Warning'], fail: ['น้ำมันไม่ผ่าน', 'Error'] };
const OIL_SAMPLED = (k) => k === 0 || k === 2;   // ตัวเลือกใน JOB_OIL_OPTS ที่มีการเก็บตัวอย่าง
async function oilResult(o) {   // o.sel (-1 ยังไม่เลือก · 0 ผ่าน · 1 ไม่ผ่าน) · o.files · o.errors · o.optional = หน้าปิดงาน
  return [row('Row', [radioGroup('ผลการทดสอบ' + (o.optional ? ' (ถ้ามี)' : ''), ['ผ่าน', 'ไม่ผ่าน'], o.sel == null ? -1 : o.sel, o.errors ? 'กรุณาเลือกผลการทดสอบ' : ''), frame('Spacer', 'VERTICAL')]),
    await upload('ไฟล์ผลการทดสอบ', o.files || [], { optional: true, hint: 'PDF, JPG, PNG · สูงสุด 10 ไฟล์', bar: true })];
}
const JOB_COLS = [['รายการงาน', 0], ['อะไหล่ตามแผน', 320], ['จำนวนตามแผน', 140], ['หน่วย', 110], ['', 104]];   // ไอคอนแก้ไข + ลบ (3 พ.ย. 2569 เจ้าของงาน "อะไหล่ตามแผนสามารถแก้ไข ลบ เพิ่มได้") กว้าง 104 แบบตารางอะไหล่ในไตรมาสของ S1
/* น้ำมันไฮโดรลิกหน้างาน (3 พ.ย. 2569 เจ้าของงาน "หน้า I.8 I.9 อยากให้สามารถเลือกได้ว่าเก็บตัวอย่างน้ำมันไฮดรอลิก หรือเปลี่ยน เนื่องจากการเปลี่ยนน้ำมันเปลี่ยนทุก 3 ปี … หรือสามารถเลือกได้ว่าเก็บตัวอย่างและเปลี่ยน")
   Radio text card แบบ "น้ำมันไฮโดรลิก" ของหน้าอะไหล่ของรถ (S21) + ช่องเปลี่ยนน้ำมันครั้งล่าสุด · เลือกเก็บตัวอย่างอย่างเดียว = ไม่มีน้ำมันในรายการอะไหล่ · มีเก็บตัวอย่าง = เข้ารอผลตรวจ S12 */
const JOB_OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน', 'เก็บตัวอย่างและเปลี่ยน'], JOB_OIL = 2;
async function jobOil(sel, res) {   // res = หน้าปิดงาน: เลือกแบบที่มีการเก็บตัวอย่างแล้วมีช่องผลการทดสอบ (ถ้ามี) ต่อท้าย (S12 · 4 พ.ย. 2569)
  const oil = await radioPick('น้ำมันไฮโดรลิก', JOB_OIL_OPTS, sel);
  const last = field('เปลี่ยนน้ำมันครั้งล่าสุด', LAST_OIL[0], { state: 'Readonly' });
  add(oil, MOB ? last : row('Row', [last, frame('Spacer', 'VERTICAL')]), 'h');
  if (res && OIL_SAMPLED(sel)) for (const n of await oilResult(Object.assign({ optional: true }, res))) add(oil, n, 'h');
  return oil;
}
const jobWork = (sel) => WORK.filter((w, k) => k > 0 || sel !== 0);   // แถวแรก = เปลี่ยนน้ำมันไฮโดรลิก
/* แยก view กบค. / ผู้รับจ้าง (4 พ.ย. 2569 เจ้าของงาน "vendor ดูรายละเอียดรายคัน จะเห็นแค่ ปุ่มเริ่มงาน และบำรุงรักษาได้ โดยไม่เห็นปุ่ม ลบ และแก้ไข แต่ว่า กบค จะเห็น อยากให้แยก view")
   o.vendor = มุมผู้รับจ้างของแผนจ้างดำเนินการ: ปุ่มหัวหน้าเหมือนกัน (บำรุงรักษาไม่ได้ · เริ่มงาน/ปิดงาน) · อะไหล่ตามแผนดูอย่างเดียว ไม่มีปุ่มเพิ่มอะไหล่และไอคอนแก้ไข ลบ · การนัดหมายเป็นข้อมูลใบจ้าง */
async function jobPage(name, o) {   // หน้างานรายคัน · o.st = todo|doing · o.i = ลำดับรถ · o.modal = 'start' | 'cannot' · o.errors · o.vendor
  o = o || {};
  const v = !!o.vendor, t = v ? HIRE_T : JOB_T, i = o.i == null ? JOB_I : o.i, c = TRIP_CARS[i], s = o.st || 'todo';
  const acts = [['Secondary button', 'บำรุงรักษาไม่ได้'], ['Primary button', s === 'doing' ? 'ปิดงาน' : 'เริ่มงาน']];   // ปุ่มตามสถานะ (Page header Job detail ของ RP & MA Job)
  const { scr, page } = await shell(name, { title: c[0], back: true, crumbs: ['แผนเดินทาง ' + NOW_Q, t.name, c[0]], badge: WSTAT[s], actions: acts });
  const appt = (v ? [['แผนเดินทาง', t.name], ['ผู้รับจ้าง', t.vendor], ['ช่วงวันทำงาน', t.d1 + ' – ' + t.d2]] : [['แผนเดินทาง', t.name], ['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2]])
    .concat([['สถานที่บำรุงรักษา', tripLoc(i, t.locs)], ['เบอร์ติดต่อ', tripPhone(i, t.phones)]])
    .concat(s === 'doing' ? [['เริ่มงาน', v ? HIRE_START : JOB_START], ['ผู้เริ่มงาน', v ? HIRE_BY : JOB_BY]] : []);
  const nodes = [await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภท', 'รถกระเช้า'], ['หน่วยงานเจ้าของรถ', c[2]], ['เลขไมล์สะสม', '182,400 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,120 ชม.']]),
    await vehicleInfo(appt, 'การนัดหมาย')];
  if (s === 'doing') nodes.push(v ? await photoFiles({ uploading: o.uploading }) : await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length), await jobOil(JOB_OIL));
  const wk = jobWork(s === 'doing' ? JOB_OIL : 1);   // ยังไม่เริ่ม: ตามแผน (เปลี่ยนน้ำมัน)
  nodes.push(col('Section', [await sectionLabel('รายการงานและอะไหล่ตามแผน', { badge: wk.length, buttons: v && s !== 'doing' ? null : [v ? ADD_PART : { kind: 'Secondary button', text: 'เพิ่มอะไหล่', icon: 'add-24-300-round' }] }),   // ผู้รับจ้างเริ่มงานแล้วเพิ่มได้ (4 พ.ย. 2569)
    v && s !== 'doing' ? await tbl(JOB_COLS.slice(0, 4), wk.map(w => [w[0], w[1], w[2], w[4]]))   // ผู้รับจ้าง ยังไม่เริ่ม: ดูอย่างเดียว · เริ่มแล้ว: แก้ไข ลบ ได้ (4 พ.ย. 2569) แต่ไม่มีปุ่มเพิ่มอะไหล่
      : await tbl(JOB_COLS, wk.map(w => [w[0], w[1], w[2], w[4], { icons: ['stylus-24-300-round', 'delete-24-300-round'] }]))], 16));   // แก้ไข / เพิ่ม = หน้าอะไหล่ของรถ (S21) · ลบ = ยืนยันแล้วเอาออกจากรถคันนี้
  add(page, col('Content', nodes, 32), 'h');
  if (o.modal === 'cannot') await cannotModal(scr, i, { reason: o.reason, used: s === 'doing' ? CANNOT_USED : null, errors: o.errors });
  return scr;
}
/* บำรุงรักษาไม่ได้ = สาเหตุ + อะไหล่ส่งคืน (3 พ.ย. 2569 รอบ 2 เจ้าของงาน "กรอกแค่สาเหตุพอ" · อะไหล่ของคันที่ไม่ได้ทำ "มีให้กดส่งคืน ตอนที่กบค รับเรื่องจะเห็นว่ามีอะไหล่อะไรคืนบ้าง")
   popupModal (Modal ของไลบรารีใส่ Table ไม่ได้) = Text area + Table ของไลบรารี · ยังไม่เริ่ม ใช้ 0 คืนทั้งหมด · อยู่ระหว่างบำรุงรักษา กรอกจำนวนที่ใช้ (Table cell ไม่มีช่องกรอก แสดงเป็นข้อความ) คืน = ตามแผน − ใช้ */
const RET_COLS = [['ชื่ออะไหล่', 0, 'Lead text'], ['จำนวนตามแผน', 170], ['จำนวนที่ใช้', 170], ['จำนวนที่คืน', 170]];
const retRows = (used) => WORK.map((w, k) => { const u = used ? +used[k] : 0; return [w[1], w[2] + ' ' + w[4], u + ' ' + w[4], (+w[2] - u) + ' ' + w[4]]; });
const CANNOT_USED = ['30', '2', '0', '0'];   // เปลี่ยนน้ำมันและไส้กรองไฮโดรลิกแล้วพบปัญหา ทำต่อไม่ได้
async function retTable(used, label, edit) { const rows = retRows(used); return col('Section', [await (label ? sectionLabel : section)('อะไหล่ส่งคืน', { badge: rows.length, buttons: edit ? [ADD_PART] : null }),
  await tbl(edit ? RET_COLS.concat([['', 104]]) : RET_COLS, edit ? rows.map(r => r.concat([EDIT_ICONS])) : rows)], 16); }   // edit = ผู้รับจ้างแก้ไข ลบ ได้ (4 พ.ย. 2569)
async function cannotModal(scr, i, o) {   // o.reason · o.used (null = ยังไม่เริ่ม) · o.errors
  await popupModal(scr, { title: 'บำรุงรักษาไม่ได้ · ' + TRIP_CARS[i][0], w: 800, ok: 'ยืนยัน',
    body: [area('สาเหตุที่บำรุงรักษาไม่ได้', o.reason, { placeholder: 'ระบุสาเหตุที่บำรุงรักษาไม่ได้', error: o.errors ? 'กรุณาระบุสาเหตุที่บำรุงรักษาไม่ได้' : '' }), await retTable(o.used)] });
}

/* ---------- แผนจ้างดำเนินการ: ผู้รับจ้างส่งตรวจงาน (S10) + กบค. ตรวจรับรายคัน (S11) — 3 พ.ย. 2569 รอบ 2 ----------
   เจ้าของงาน "กบค จะเห็นหน้าคนละหน้า เห็นสถานะ ว่ารถคันนั้น ดำเนินการบำรุงรักษาแล้ว ปุ่มจะแสดงให้ส่งตรวจงาน" · "คนตรวจงานเป็นผู้รับจ้าง ส่งตรวจงาน แต่กบค จะเห็นว่าต้องตรวจรับงาน
   … อนุมัติ และ ส่งกลับแก้ไข พร้อมเหตุผล" → "ใช้แบบการ์ดเหมือน S2"
   หน้าเดียวกับหน้างานรายคัน S10 (Page header Badge + ปุ่มขวา ตามหน้า RP & MA Job ของ UI Release#2) · ผลการพิจารณา = radioPick แบบ S2 S7 (Radio text card ของไฟล์ Component) · ตาราง = Table */
const HIRE_T = tripAs(TRIP_V, 'approved'), HIRE_DONE = TRIP_V.sel[0], HIRE_CANNOT = TRIP_V.sel[1];
const HIRE_BY = 'นายประเสริฐ ศรีสุข (ผู้รับจ้าง)', HIRE_START = '17/11/2569 09:10 น.', HIRE_END = '17/11/2569 13:25 น.', HIRE_SENT = '17/11/2569 16:40 น.', HIRE_REPORTED = '18/11/2569 08:35 น.';
const HIRE_WHY = 'กระบอกสูบไฮโดรลิกหลักรั่ว ต้องส่งซ่อมก่อนจึงบำรุงรักษาได้';
const HIRE_BACK = 'จำนวนไส้กรองอากาศที่คืนไม่ตรงกับภาพอะไหล่ใหม่ที่เหลือ กรุณาตรวจนับและแก้จำนวนที่คืน';
const HIRE_BACK_CANNOT = 'กรุณาระบุตำแหน่งที่รั่วและผลตรวจเบื้องต้นในสาเหตุให้ชัดเจน';
const HIRE_MIX = { [TRIP_V.sel[0]]: 'wait', [TRIP_V.sel[1]]: 'wait', [TRIP_V.sel[2]]: 'doing' };   // มุม กบค. ก่อนตรวจรับ: 2 คันรอตรวจรับ · คันที่ 3 กำลังทำ · ที่เหลือยังไม่เริ่ม
const HIRE_VENDOR = { [TRIP_V.sel[0]]: 'returned', [TRIP_V.sel[1]]: 'wait', [TRIP_V.sel[2]]: 'worked', [TRIP_V.sel[3]]: 'doing' };   // มุมผู้รับจ้างหลัง กบค. ตรวจไปบางคัน
async function hireJob(name, o) {   // o.st = worked|reported|wait|returned · o.cannot = คันที่แจ้งบำรุงรักษาไม่ได้ · o.kbk = มุม กบค. (S11) · o.decision = 'return' · o.reason · o.errors
  o = o || {};
  const t = HIRE_T, cannot = !!o.cannot, i = cannot ? HIRE_CANNOT : HIRE_DONE, c = TRIP_CARS[i], s = o.st;
  const ed = !o.kbk && ['worked', 'reported', 'wait', 'returned'].indexOf(s) >= 0;   // ผู้รับจ้างแก้ไข ลบ อะไหล่และภาพได้ (เจ้าของงาน 4 พ.ย. 2569 "หน้า i22-i26") · มุม กบค. (S11) ดูอย่างเดียว
  const acts = o.kbk ? null
    : s === 'worked' || s === 'reported' ? [['Secondary button', 'แก้ไขงาน'], ['Primary button', 'ส่งตรวจงาน']]
    : s === 'returned' ? (cannot ? [['Secondary button', 'บำรุงรักษาไม่ได้'], ['Primary button', 'เริ่มงาน']] : [['Primary button', 'แก้ไขงาน']]) : null;   // ส่งกลับคันที่แจ้งไม่ได้ = ปุ่มกลับเป็นแบบก่อนแจ้ง (ยังไม่เริ่ม)
  const { scr, page } = await shell(name, { title: c[0], back: true, crumbs: ['แผนเดินทาง ' + NOW_Q, t.name, c[0]], badge: WSTAT[s], actions: acts });
  const nodes = [];
  if (s === 'returned') nodes.push(alertBox('Error', 'กบค. ส่งกลับให้แก้ไข', cannot ? HIRE_BACK_CANNOT : HIRE_BACK));
  nodes.push(await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['ประเภท', 'รถกระเช้า'], ['หน่วยงานเจ้าของรถ', c[2]], ['เลขไมล์สะสม', '176,050 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '5,840 ชม.']]),
    await vehicleInfo([['แผนเดินทาง', t.name], ['ผู้รับจ้าง', t.vendor], ['ช่วงวันทำงาน', t.d1 + ' – ' + t.d2], ['สถานที่บำรุงรักษา', tripLoc(i, t.locs)], ['เบอร์ติดต่อ', tripPhone(i, t.phones)]]
      .concat(s === 'wait' ? [['ส่งตรวจงานเมื่อ', cannot ? '18/11/2569 08:50 น.' : HIRE_SENT], ['ผู้ส่ง', HIRE_BY]] : []), 'การนัดหมาย'));
  if (cannot) nodes.push(await vehicleInfo([['สาเหตุที่บำรุงรักษาไม่ได้', HIRE_WHY], ['ผู้แจ้ง', HIRE_BY], ['แจ้งเมื่อ', HIRE_REPORTED]], 'บำรุงรักษาไม่ได้'));
  else nodes.push(await vehicleInfo([['เริ่มงาน', HIRE_START], ['ปิดงาน', HIRE_END], ['ผู้บันทึก', HIRE_BY], ['เลขไมล์หลังทำ', '176,090 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '5,846 ชม.'], ['น้ำมันไฮโดรลิก', JOB_OIL_OPTS[JOB_OIL]]], 'ผลการบำรุงรักษา'),
    ed ? await photoFiles() : await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length, buttons: ed ? [ADD_PART] : null }),
      await tbl(ed ? WORK_COLS2.concat([['', 104]]) : WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]].concat(ed ? [EDIT_ICONS] : [])))], 16));
  nodes.push(await retTable(cannot ? null : WORK.map(w => w[3]), true, ed));
  if (o.partEdit) await partEditModal(scr, WORK[PART_K]);
  if (o.partAdd) await partAddModal(scr, o.partAdd === 'filled');
  if (o.partDel) await confirm(scr, PART_DEL_CONFIRM(WORK[PART_K]));   // ปิดงาน = จำนวนที่คืนจากหน้าปิดงาน · แจ้งไม่ได้ = จาก popup
  if (o.kbk && s === 'wait') {   // S11 ผลการพิจารณาแบบ S2 (เจ้าของงาน 3 พ.ย. 2569 "ใช้แบบการ์ดเหมือน S2")
    const ret = o.decision === 'return';
    const dec = await radioPick('ผลการพิจารณา', [['อนุมัติ', 'งานของรถคันนี้ผ่านการตรวจรับ และรับคืนอะไหล่ตามรายการ'], ['ส่งกลับแก้ไข', 'แจ้งเหตุผลให้ผู้รับจ้างแก้ไขแล้วส่งตรวจงานใหม่']], ret ? 1 : 0, { label: true });
    if (ret) add(dec, area('เหตุผลที่ส่งกลับ', o.reason, { placeholder: 'ระบุเหตุผลที่ส่งกลับ', error: o.errors ? 'กรุณาระบุเหตุผลที่ส่งกลับ' : '' }), 'h');
    nodes.push(dec, btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg' }]]));
  }
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
const HIRE_SEND_CONFIRM = (c) => ({ title: 'ยืนยันส่งตรวจงาน · ' + c[0], sub: 'งานของรถคันนี้จะส่งให้ กบค. ตรวจรับ', ok: 'ส่งตรวจงาน' });   // 4 พ.ย. 2569 รอตรวจรับยังแก้ไขได้ (เจ้าของงานให้ I.25 มีแก้ไข ลบ) ⇒ ตัด "ระหว่างรอตรวจรับจะแก้ไขไม่ได้"
/* แก้ไข ลบ อะไหล่และภาพของผู้รับจ้าง (4 พ.ย. 2569 เจ้าของงาน "ส่วนที่เป็นอะไหล่ที่ใช้จริง และ อะไหล่ส่งคืน ต้องมีสัญลักษณ์ให้แก้ไขได้ ลบรายการได้ รูปภาพ แก้ไขได้ ลบได้ และกดแล้ว จะสามารถแก้ไข")
   ตาราง = คอลัมน์ไอคอนแก้ไข + ลบ กว้าง 104 แบบตารางอะไหล่ในไตรมาสของ S1 · ไอคอนแก้ไขทั้งสองตาราง = popup เดียวกัน (จำนวนที่คืนคำนวณจากจำนวนที่ใช้จริง)
   ภาพ = File upload ของไลบรารี (รายการไฟล์มีปุ่มลบ · อัปโหลดใหม่แทนภาพเดิม) แบบภาพก่อนเริ่มงานในหน้ารับรถ · Images ของไลบรารีไม่มีปุ่มแก้ไข ลบ */
const EDIT_ICONS = { icons: ['stylus-24-300-round', 'delete-24-300-round'] }, PART_K = 3;   // ตัวอย่างแก้ = ไส้กรองอากาศ (ใช้ 1 คืน 1)
const photoFiles = (o) => upload('ภาพก่อนเริ่มงาน', BEFORE.map((b, k) => jpg('before-' + (k + 1))).concat(o && o.uploading ? [Object.assign(jpg('before-3'), { progress: 60 })] : []), { hint: 'JPG, PNG · สูงสุด 10 ภาพ', bar: true });   // อัปโหลดแล้วมีแถบ 100% · กำลังอัปโหลดแถบตาม % (4 พ.ย. 2569)
async function partEditModal(scr, w) {
  await popupModal(scr, { title: 'แก้ไขอะไหล่ · ' + w[1], ok: 'บันทึก',
    body: [field('รายการงาน', w[0], { state: 'Readonly' }),
      row('Row', [field('จำนวนตามแผน', w[2] + ' ' + w[4], { state: 'Readonly' }), field('จำนวนที่ใช้จริง (' + w[4] + ')', w[3]), field('จำนวนที่คืน', (+w[2] - +w[3]) + ' ' + w[4], { state: 'Readonly' })])] });
}
/* เพิ่มรายการ (4 พ.ย. 2569 เจ้าของงาน "scen V ต้องมีเพิ่มรายการได้ด้วย") — ปุ่ม "เพิ่มอะไหล่" ที่หัวตารางแบบหน้างานรายคันของ กบค. (S10) · ผู้รับจ้างไม่ได้เลือกจากคลัง กบค.
   ⇒ popup กรอกเองแบบ "รายการเพิ่มเติม" ของหน้าอะไหล่ของรถ (S21) + จำนวนที่ใช้จริงและหน่วย · เพิ่มแล้วขึ้นในอะไหล่ที่ใช้จริง และจำนวนที่คืนเป็น 0 */
const ADD_PART = { kind: 'Secondary button', text: 'เพิ่มอะไหล่', icon: 'add-24-300-round' };
async function partAddModal(scr, filled) {
  await popupModal(scr, { title: 'เพิ่มอะไหล่ที่ใช้จริง', ok: 'เพิ่ม',
    body: [field('ชื่ออะไหล่', filled ? 'ไส้กรองเชื้อเพลิง' : '', { placeholder: 'ระบุชื่ออะไหล่' }), field('รหัสอะไหล่', filled ? 'FF-5052' : '', { placeholder: 'ระบุรหัสอะไหล่', optional: true }),
      row('Row', [field('จำนวนที่ใช้จริง', filled ? '1' : '', { placeholder: '0' }), dropdown('หน่วย', filled ? 'ชิ้น' : '', { placeholder: 'เลือกหน่วย' })])] });
}
const PART_DEL_CONFIRM = (w) => ({ danger: true, title: 'ยืนยันการเอาอะไหล่ออก', sub: w[1] + ' จะถูกเอาออกจากรถคันนี้', cancel: 'ยกเลิก', ok: 'เอาออก' });
const HIRE_OK_CONFIRM = (c, cannot) => ({ title: 'ยืนยันอนุมัติงานบำรุงรักษา · ' + c[0], sub: 'รถคันนี้จะเป็น "' + (cannot ? 'บำรุงรักษาไม่ได้' : 'เสร็จสิ้น') + '" และรับคืนอะไหล่ตามรายการ', ok: 'อนุมัติ' });
const HIRE_BACK_CONFIRM = { title: 'ยืนยันส่งกลับแก้ไข', sub: 'งานของรถคันนี้จะกลับไปให้ผู้รับจ้างแก้ไขตามเหตุผลที่ระบุ แล้วส่งตรวจงานใหม่', ok: 'ส่งกลับ' };
const WORK_COLS2 = [['รายการงาน', 0], ['อะไหล่ที่ใช้', 320], ['จำนวนตามแผน', 140], ['จำนวนที่ใช้จริง', 140], ['หน่วย', 110]];
/* ปิดงาน = หน้าเดียวไล่ยาว ไม่มี stepper ไม่มีส่วนภาพ (3 พ.ย. 2569 เจ้าของงานวางข้อความเฟรม "รายงานปิดงาน" ของงานซ่อม: "หน้าปิดงานอยากได้สไตล์แบบนี้ ยังไม่ต้องมีเพิ่มรูป และไม่ต้องมี stepper")
   ส่วนตามเฟรม: ข้อมูลเอกสาร · บันทึกข้อตกลงลูกค้า (Section header + Content item row) · รายการสภาพวัสดุอะไหล่ (Table ของไลบรารี 8 คอลัมน์)
   · บันทึกตรวจสอบเอกสารปิดงาน (แถว Horizontal radio groups มี/ไม่มี/ไม่ต้องใช้ + ปุ่มอัพโหลดเอกสาร — แถวแบบ MA table ในเฟรมเดียวกัน · ตารางของเฟรมมี radio ในช่อง ซึ่ง Table ของไลบรารีไม่มี)
   ผลการบำรุงรักษา (เลขไมล์ ชั่วโมงเครื่องจักร เก็บตัวอย่างน้ำมัน) คงไว้เพราะ S12 และบอร์ดต้องใช้ — ไม่อยู่ในเฟรม (จดยังไม่เคาะ) */
const CLOSE_PARTS = [   // ชื่ออะไหล่ · ราคาต่อหน่วย · จำนวนที่ใช้ · ราคารวมที่ใช้ · จำนวนที่คืน · ราคารวมที่คืน · จำนวนอะไหล่เก่า · หมายเหตุ (ลำดับคอลัมน์ตาม ReturnPart)
  ['น้ำมันไฮโดรลิก ISO VG 46', '120', '30', '3,600', '0', '0', '30', 'น้ำมันเก่าส่งกำจัดตามระเบียบ'],
  ['ไส้กรองไฮโดรลิก', '680', '2', '1,360', '0', '0', '2', ''],
  ['ไส้กรองน้ำมันเครื่อง', '250', '2', '500', '0', '0', '2', ''],
  ['ไส้กรองอากาศ', '420', '1', '420', '1', '420', '1', 'ไส้กรองเดิมอีกลูกยังใช้ได้']];
const CLOSE_PART_HEADS = ['ชื่ออะไหล่', 'ราคาต่อหน่วย', 'จำนวนที่ใช้', 'ราคารวมที่ใช้', 'จำนวนที่คืน', 'ราคารวมที่คืน', 'จำนวนอะไหล่เก่า', 'หมายเหตุ'];
const CLOSE_DOCS_REPAIR = ['บันทึกสั่งงาน/สำเนาบันทึกสั่งงาน', 'บันทึกรับงานเข้างาน', 'ใบเบิกของ', 'ใบส่งของคลัง', 'สำเนาอนุมัติหลักการจัดซื้อ', 'สำเนาบิลส่งของเรื่องจัดซื้อ', 'สำเนาอนุมัติหลักการจัดจ้าง', 'สำเนาบิลส่งของเรื่องจัดจ้าง',
  'บันทึกการตรวจสอบวัสดุอะไหล่', 'สำเนาใบส่งคืนคลังพัสดุ', 'บันทึกการตรวจสภาพบำรุงรักษา', 'บันทึกทดสอบก่อนซ่อม/หลังซ่อม', 'รายงานออกปฏิบัติงานส่วนภูมิภาค', 'เรื่องแจ้งงานเสร็จ', 'เรื่องแจ้งงดซ่อม'];   // ตามเฟรมของเจ้าของงาน
const CLOSE_DOCS = ['บันทึกใบสั่งการ'];   // 3 พ.ย. 2569 เจ้าของงาน "ส่วนนี้ตัดเหลือแค่ 1 รายการ คือบันทึกใบสั่งการ แค่นั้น และมีให้เพิ่มรายการได้" (15 รายการของงานซ่อมเก็บไว้ที่ CLOSE_DOCS_REPAIR)
const CLOSE_DOC_SEL = [0];   // กรอกครบ: 0 มี · 1 ไม่มี · 2 ไม่ต้องใช้
async function closeParts(rows, filled) {   // รายการสภาพวัสดุอะไหล่ = Table ของไลบรารี 8 คอลัมน์ตามเฟรม · ReturnPart ไม่ใช้ (ดัมป์เป็นรุ่นเก่าคอลัมน์ไม่ตรงเฟรม และไฟล์ Maintain-D1 ไม่มี) · ช่องตารางพิมพ์ค่าไม่ได้ (Table cell ไม่มีแบบช่องกรอก) แสดงเป็นข้อความ
  const val = (r) => (filled ? r : r.slice(0, 6).concat(['0', ''])).map((x, i) => i === 7 && !x ? '-' : x);   // ฟอร์มว่าง: จำนวนที่ใช้ตั้งต้นตามแผน · อะไหล่เก่า 0 · หมายเหตุ "-"
  const cols = CLOSE_PART_HEADS.map((h, i) => [h, i === 0 ? 220 : i === 7 ? 0 : 118, i ? 'Text' : 'Lead text']);
  return col('Section', [await section('รายการสภาพวัสดุอะไหล่', { badge: rows.length }), await tbl(cols, rows.map(val)), btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round' })], 16);
}
async function closeDocs(filled) {   // บันทึกตรวจสอบเอกสารปิดงาน: 1 แถว = เอกสาร 1 รายการ (radio มี / ไม่มี / ไม่ต้องใช้ + ปุ่มอัพโหลดเอกสาร)
  const rows = CLOSE_DOCS.map((d, i) => {
    const g = radioGroup(d, ['มี', 'ไม่มี', 'ไม่ต้องใช้'], filled ? CLOSE_DOC_SEL[i] : -1);
    const b = btn('Secondary button', 'อัพโหลดเอกสาร', { icon: 'cloud_upload-24-300-round', disabled: filled && CLOSE_DOC_SEL[i] !== 0 });
    if (MOB) return col('Row', [g, b], 12);
    const r = row('Row', [g, b], { gap: 24, hug: true, align: 'MAX' }); g.layoutGrow = 1;
    return r;
  });
  return col('Section', [await section('บันทึกตรวจสอบเอกสารปิดงาน', { badge: CLOSE_DOCS.length })].concat(rows, [btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round' })]), 16);
}
/* ค่าใช้จ่ายของรถคันนี้ (3 พ.ย. 2569 เจ้าของงาน "ค่าที่พัก ค่าเดินทาง … จะมีให้กรอกอีกทีตอนปิดงาน โดยรายละเอียดเรื่องค่าใช้จ่ายของรถแต่ละคันจะกรอกแยกกัน และมีให้เลือกงบประมาณตอนปิดงานด้วย
   โดยเบื้องต้นจะ default เป็นศูนย์ต้นทุนของเจ้าของรถคันนั้นๆ เนื่องจากพวกค่าอะไหล่จะเป็นของ กบค. แต่ค่าเดินทาง และค่าใช้จ่ายจะเป็นของหน่วยงานเจ้าของรถ")
   รอบ 2 (3 พ.ย. 2569 "ย้ายค่าใช้จ่ายไปต่อจากรายการสภาพวัสดุอะไหล่ ค่าใช้จ่ายอยากให้กรอกละเอียดรายคน และมีการรวมค่าใช้จ่ายให้ด้วย แล้วถึงจะให้เลือกงบที่ตัด ซึ่งอยากเปลี่ยนเป็น งบประมาณ (ศูนย์ต้นทุน)")
   ⇒ 1 แถวต่อพนักงาน กบค. ซ่อม 1 คนในแผนเดินทาง: พนักงาน (Readonly) · ค่าเบี้ยเลี้ยง · ค่าที่พัก · ค่าเดินทาง (ถ้ามี) · รวม (Readonly คำนวณ)
   → สรุปรวม (Content item row) → Input dropdown "งบประมาณ (ศูนย์ต้นทุน)" ตั้งต้นศูนย์ต้นทุนของหน่วยงานเจ้าของรถ (เลิกใช้คู่ "งบที่ตัด" + "ศูนย์ต้นทุน") */
/* รอบ 3 (3 พ.ย. 2569 "ค่าเบี้ยเลี้ยงใส่เป็นรายวัน ค่าที่พักใส่เป็นรายวัน แล้วเลือกจำนวนวันค่อยมาคูณ ส่วนค่าเดินทางอยากเป็นรวมของทุกคนที่ไปแผนการเดินทางนั้น ใส่แค่ช่องเดียว
   … หลังจากการกรอกเบี้ยเลี้ยง ค่าที่พักเรียบร้อยแล้วค่อยมีให้กรอกค่าเดินทางด้านล่าง") ⇒ แถวต่อคน: พนักงาน · ค่าเบี้ยเลี้ยง (บาท/วัน) · ค่าที่พัก (บาท/วัน) · จำนวนวัน (เลือก) · รวม = (เบี้ยเลี้ยง + ที่พัก) × วัน
   → ค่าเดินทาง (รวมทุกคน) ช่องเดียวใต้แถว → สรุปรวม → งบประมาณ (ศูนย์ต้นทุน) */
const CLOSE_COST_BY = [[TRIP.staff[0], 240, 800, 2], [TRIP.staff[1], 240, 800, 2], [TRIP.staff[2], 240, 800, 1]];   // พนักงาน · เบี้ยเลี้ยง/วัน · ที่พัก/วัน · จำนวนวัน
const CLOSE_TRAVEL = 1210;   // ค่าเดินทางรวมทุกคน
const nf = (n) => n.toLocaleString('en-US');
const personSum = (r) => (r[1] + r[2]) * r[3];
const costSum = (k) => CLOSE_COST_BY.reduce((a, r) => a + r[k] * r[3], 0);
const CLOSE_COST = { perDiem: nf(costSum(1)), lodging: nf(costSum(2)), travel: nf(CLOSE_TRAVEL), total: nf(costSum(1) + costSum(2) + CLOSE_TRAVEL) };
const OWNER_CC = (c) => 'E301010000 ' + c[2] + ' - บริหาร';   // ศูนย์ต้นทุนของหน่วยงานเจ้าของรถ (ข้อมูลจำลอง)
async function closeCosts(filled) {
  const c = TRIP_CARS[JOB_I];
  const money = (label, v) => field(label, filled ? nf(v) : '', { placeholder: '0', optional: true });
  // 3 พ.ย. 2569 เจ้าของงาน "เพิ่ม ลด พนักงานได้" ⇒ พนักงาน = Input dropdown ค้นชื่อ (ตั้งต้นตามแผนเดินทาง) · ปุ่มลบท้ายแถว (Tertiary button ไอคอนอย่างเดียว) · ปุ่ม "เพิ่มพนักงาน" ใต้แถว
  const delBtn = () => inst('Tertiary button', { State: 'Default', Size: 'md' }, { 'Button text': false, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('delete-24-300-round') });
  const rows = CLOSE_COST_BY.map(r => {
    const kids = [dropdown('พนักงาน กบค. ซ่อม', r[0], { placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round' }), money('ค่าเบี้ยเลี้ยง (บาท/วัน)', r[1]), money('ค่าที่พัก (บาท/วัน)', r[2]),
      dropdown('จำนวนวัน', filled ? r[3] + ' วัน' : '', { placeholder: 'เลือกจำนวนวัน' }), field('รวม (บาท)', filled ? nf(personSum(r)) : '0', { state: 'Readonly' })];
    if (MOB) return col('Row', kids.concat([delBtn()]), 16);
    const rw = row('Row', kids, { align: 'MAX' }); const d = delBtn(); rw.appendChild(d);   // ปุ่มลบไม่ยืด
    return rw;
  });
  const sum = filled ? CLOSE_COST : { perDiem: '0', lodging: '0', travel: '0', total: '0' };
  return col('Section', [await section('ค่าใช้จ่ายของรถคันนี้ (บาท)', { badge: CLOSE_COST_BY.length + ' คน' })]   // 3 พ.ย. 2569 เจ้าของงานลบกล่องแจ้งในไฟล์เองแล้ว "ลบใน script อย่างเดียว … export ต้องไม่มี"
    .concat(rows, [btn('Secondary button', 'เพิ่มพนักงาน', { icon: 'add-24-300-round' }), row('Row', [money('ค่าเดินทาง (รวมทุกคน)', CLOSE_TRAVEL), frame('Spacer', 'VERTICAL')]),
      kv([['รวมค่าเบี้ยเลี้ยง', sum.perDiem + ' บาท'], ['รวมค่าที่พัก', sum.lodging + ' บาท'], ['ค่าเดินทาง', sum.travel + ' บาท'], ['รวมค่าใช้จ่ายของรถคันนี้', sum.total + ' บาท']]),
      row('Row', [dropdown('งบประมาณ (ศูนย์ต้นทุน)', OWNER_CC(c), { placeholder: 'เลือกศูนย์ต้นทุน' }), frame('Spacer', 'VERTICAL')])]), 16);
}
/* ---------- รับรถก่อนเริ่มงาน + ตรวจสภาพตอนปิดงาน (3 พ.ย. 2569 เจ้าของงาน "ตอนกดเริ่มงาน อยากได้หน้าที่เป็นรายการรับรถ และมีให้ลงนาม และตอนปิดงานก็เหมือนกัน มีให้ตรวจสภาพรถปิดงาน") ----------
   แบบอย่าง = component ของ Flow การซ่อม (ไฟล์ Maintain-D หน้า Design) ที่ Overhaul S8 ใช้: ReceiptChecklist "รายการเอกสารรับรถ" + HandoverSignature "ลงนามการรับมอบรถ" + Modal Signature
   · ปิดงาน = InspectionChecklist (รายการตรวจสภาพรถกระเช้า ปกติ/ต้องแก้ไข) AfterRepair=true เหลือ HandoverSignature "ลงนามการส่งคืนรถ" (ซ่อน RepairFeedback ReturnPart เพราะหน้าปิดงานมีตารางอะไหล่แล้ว)
   ไฟล์ไม่มี component เหล่านี้ / มือถือ → แบบสำรองจากไลบรารี: แถว Horizontal radio groups 2 คอลัมน์ + หมายเหตุ + ช่องผู้ลงนาม (Input dropdown) + ปุ่มเซ็นลงนาม / Pill outline ลงนามแล้ว */
const RECEIPT_ITEMS = ['แผ่นป้ายทะเบียนหน้า - หลัง', 'ป้ายทะเบียนติดกระจกและ พรบ.', 'กระจกมองข้างซ้าย - ขวา, กระจกมองหลัง', 'ยางอะไหล่', 'แบตเตอรี่', 'เครื่องมือประจำรถ, แม่แรง, ประแจถอดล้อ', 'ฝาถังน้ำมัน',
  'อุปกรณ์บนหน้าปัด, แตร', 'ใบปัดน้ำฝน', 'วิทยุ, ลำโพง, เสาอากาศ, วิทยุรับ - ส่ง', 'ระบบไฟแสงสว่าง', 'สภาพยาง', 'สภาพตัวถังและสี'];   // ตาม ReceiptChecklist ของงานซ่อม
const INSPECT_ITEMS = ['ชุดเกียร์ PTO', 'ชุดกระบอกขาช้างหน้า ซ้าย ขวา', 'ชุดกระบอกขาช้างหลัง ซ้าย ขวา', 'ชุดวาร์ลคอนโทรลขาช้าง', 'เพลาขับปั๊มน้ำมันไฮดรอลิค', 'ปั๊มน้ำมันไฮดรอลิค', 'ชุดยึดฐานเครน', 'ชุดโรตารี่',
  'ชุดมอเตอร์และเฟื่องหมุนฐานเครน', 'ชุด CONTROL ล่าง', 'ชุดกระบอก LOWER BOOM', 'ชุดกระบอก UPPER BOOM', 'ชุดกระบอก เทน้ำ-ปรับดิ่ง', 'จุดเชื่อมต่อโครงสร้าง BOOM', 'ชุดวาล์วล๊อคต่างๆ', 'สายน้ำมันไฮดรอลิค',
  'ชุด CONTROL บน', 'กระบอกปรับบิด', 'BUCKET, LINER, ชุดการ์ดครอบ', 'ระบบ EMERGENCY', 'ระบบเร่งเครื่องยนต์', 'สายสัญญาณต่างๆ', 'รอกและเชือกวินซ์', 'ชุด LIFT รุ่น 115 kV'];   // ตาม InspectionChecklist ของงานซ่อม
const SIGN_OWNER = 'นายสุรชัย แก้วมณี', SIGN_DATE = '04/11/2569';
/* ---------- แบบสำรองเมื่อไฟล์ไม่มี component ของงานซ่อม (3 พ.ย. 2569 เจ้าของงาน "ตารางที่เป็นรับรถ ผิด" · "ให้ตรงกับของเดิมที่ทำไปแล้ว")
   ลอกโครงจาก ReceiptChecklist / InspectionChecklist / HandoverSignature ในไฟล์ Maintain-D หน้า Design (ดัมป์ maintain-d/0-1.json):
   desktop = ตาราง หัว Table header cell + ช่องแถวสลับสี ช่องสูง 56 · ช่องที่มี Radio button / Checkbox / Text input เป็น Table cell ที่ detach แล้ววางตัวควบคุมไว้ข้างใน
   (แบบเดียวกับต้นฉบับ — Table cell ของไลบรารีไม่มี Style radio/checkbox/ช่องกรอก · component Table ใส่ไม่ได้) · ปุ่ม "เพิ่มรายการ" แถวท้ายคอลัมน์แรก
   mobile = การ์ดรายการละใบ (ReceiptChecklistCard / InspectionChecklistCard): Section label ชื่อรายการ + Radio text card 2 ใบ · รายการรับรถที่เลือก "มี" เพิ่ม "สภาพ (ถ้ามี)" Checkbox text card ชำรุด/ผิดรุ่น
   ลงนาม = ผู้ส่งมอบ/ผู้รับมอบ ช่องละคอลัมน์ · ยังไม่เซ็น "เซ็นลงนาม" (กดไม่ได้จนเลือกชื่อ) · เซ็นแล้ว "แก้ไขลงนาม" + Pill "ลงนามแล้ว" */
function ctrlCell(alt, text, ctrl, grow) {   // ช่องข้อความ = Table cell ของไลบรารีตรงๆ · ช่องตัวควบคุม/ช่องว่าง = Table cell ที่ detach (สี/ระยะตามไลบรารี) แล้วใส่ตัวควบคุมแทนข้อความ
  const c = inst('Table cell', { Style: 'Text', 'Alternating fills': alt ? 'True' : 'False' }, { Text: text || ' ', Supporting: false });
  if (text && !ctrl) return c;
  const f = c.detachInstance(); f.name = 'Table cell';
  f.children.slice().forEach(k => k.remove());
  if (ctrl) { f.appendChild(ctrl); if (grow) ctrl.layoutGrow = 1; }
  return f;
}
function checkTable(items, cols, addRow) {   // cols: [หัว, กว้าง (0 = ยืด), (แถว) => ตัวควบคุม, ยืดตัวควบคุม]
  const t = frame('Content with scrollbar', 'HORIZONTAL');
  cols.forEach(([head, w, make, grow], ci) => {
    const c = frame('Column', 'VERTICAL'); t.appendChild(c);
    if (w) { c.layoutSizingHorizontal = 'FIXED'; c.resize(w, c.height); } else c.layoutGrow = 1;
    add(c, inst('Table header cell', { Checkbox: 'False' }, { Text: head, 'Sort icon': false, 'Header text': true }), 'h');
    items.forEach((it, ri) => add(c, ctrlCell(ri % 2, ci === 0 ? it : '', ci === 0 ? null : make(ri), grow), 'h'));
    if (addRow) add(c, ctrlCell(items.length % 2, '', ci === 0 ? btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round' }) : null), 'h');
  });
  return t;
}
const radioCell = (on) => inst('Radio button', { State: 'Default', Selected: on ? 'True' : 'False' });
const checkCell = (on, off) => inst('Checkbox', { State: off ? 'Disabled' : 'Default', Type: on ? 'Selected' : 'Unselected' });
function noteCell(v) { const n = field('หมายเหตุ', v, { placeholder: 'ระบุหมายเหตุ', optional: true }); setProps(n, { Label: false }); return n; }
function checkCard(title, opts, sel, more) {   // การ์ดรายการบนมือถือ — กรอบ/พื้นจาก Mobile table ของไลบรารี มุม 12 ตามการ์ดต้นฉบับ
  const card = frame('ChecklistCard', 'VERTICAL', { gap: 16, pad: 16 });
  const ref = inst('Mobile table', { 'Alternating fills': 'False' });
  card.fills = ref.fills || [{ type: 'SOLID', color: WHITE }]; card.strokes = ref.strokes || []; card.strokeWeight = 1; card.cornerRadius = 12; ref.remove();
  add(card, inst('Section label', { Breakpoint: 'Mobile' }, { Title: title, Supporting: false, 'Info icon': false, 'More actions': false, Actions: false }), 'h');
  add(card, row('Radio', opts.map((t, i) => inst('Radio text card', { State: 'Default', Selected: i === sel ? 'True' : 'False' }, { Text: t, Supporting: false })), { keep: true, gap: 16 }), 'h');
  (more || []).forEach(n => add(card, n, 'h'));
  return card;
}
const RECEIPT_NOTE = { 11: 'ยางหลังซ้ายสึก แจ้งเจ้าของรถแล้ว' }, RECEIPT_BAD = 11;   // ข้อมูลจำลองตอนกรอกครบ: ทุกรายการ "มี" · สภาพยาง ชำรุด
const INSPECT_NOTE = { 15: 'มีรอยซึม นัดเปลี่ยนรอบถัดไป' }, INSPECT_FIX = 15;   // ตรวจสภาพปิดงาน: สายน้ำมันไฮดรอลิค ต้องแก้ไข
async function signSection(title, who, filled, signed) {   // HandoverSignature แบบสำรอง
  const box = (label, name) => col('Container', [dropdown(label, filled ? name : '', { placeholder: 'เลือก' + label }),
    signed ? row('Signed', [btn('Secondary button', 'แก้ไขลงนาม'), pill('ลงนามแล้ว', 'Success')], { hug: true, keep: true, gap: 16, align: 'CENTER' })
      : row('Sign', [btn('Secondary button', 'เซ็นลงนาม', { disabled: !filled })], { hug: true, keep: true })], 16);
  return col('Section', [await section(title), row('Row', [box(who[0][0], who[0][1]), box(who[1][0], who[1][1])])], 16);
}
async function signModal(scr, title, filled) {   // Modal Signature ของงานซ่อม · ไม่มี/มือถือ → popup ยืนยันแบบ Overhaul
  if (MOB || !has('Modal Signature')) { await confirm(scr, { title, sub: filled ? 'เซ็นลงนามแล้ว' : 'เซ็นลงนามในช่องด้านล่าง', cancel: 'ปิด', ok: 'บันทึก' }); return; }
  const m = inst('Modal Signature', { State: filled ? 'Filled' : 'Default' }); m.name = 'Modal Signature';
  overlay(scr, m, 0, 0);
  modalHead(find(m, 'Modal header'), title, '');
  const ft = find(m, 'Modal footer');
  if (ft) { const sb = find(ft, 'Secondary button'); if (sb) setProps(sb, { Text: 'ปิด', 'Leading icon': false, 'Trailing icon': false }); const pb = find(ft, 'Primary button'); if (pb) setProps(pb, { Text: 'บันทึก', 'Leading icon': false, 'Trailing icon': false }); }
}
async function receiptPanel(filled, signed) {
  const o = { filled, signed };   // รายการรับรถ + ลงนามการรับมอบรถ
  if (has('ReceiptChecklist') && has('HandoverSignature')) {   // ต้นฉบับมี Breakpoint Mobile ด้วย (การ์ดรายการละใบ) ⇒ ใช้ทั้งสองขนาด
    const rc = inst('ReceiptChecklist', { Breakpoint: BP(), State: filled ? 'Filled' : 'Default' }); rc.name = 'ReceiptChecklist';
    const hs = inst('HandoverSignature', { State: signed ? 'Signed' : filled ? 'Filled' : 'Default' }); hs.name = 'HandoverSignature';
    return [rc, hs];
  }
  const sel = (i) => o.filled ? 0 : -1;
  const list = MOB
    ? RECEIPT_ITEMS.map((t, i) => checkCard(t, ['มี', 'ไม่มี'], sel(i), sel(i) === 0 ? [col('Checklist', [syncLabel(inst('Input label', {}, { 'Label text': 'สภาพ', Optional: true }), 'สภาพ', true),
        row('Check', [['ชำรุด', i === RECEIPT_BAD], ['ผิดรุ่น', false]].map(([x, on]) => inst('Checkbox text card', { State: 'Default', Selected: on ? 'True' : 'False' }, { Text: x, Supporting: false })), { keep: true, gap: 16 })], 8)] : []))
      .concat([btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round', size: 'lg' })])
    : [checkTable(RECEIPT_ITEMS, [['รายการ', 0], ['มี', 100, i => radioCell(sel(i) === 0)], ['ไม่มี', 100, i => radioCell(sel(i) === 1)],
        ['ชำรุด', 100, i => checkCell(o.filled && i === RECEIPT_BAD, !o.filled)], ['ผิดรุ่น', 100, i => checkCell(false, !o.filled)],
        ['หมายเหตุ', 450, i => noteCell(o.filled ? RECEIPT_NOTE[i] || '' : ''), true]], true)];
  return [col('ReceiptChecklist', [await section('รายการเอกสารรับรถ', { badge: RECEIPT_ITEMS.length })].concat(list), 16),
    await signSection('ลงนามการรับมอบรถ', [['ผู้ส่งมอบรถ (หน่วยงานเจ้าของรถ)', SIGN_OWNER], ['ผู้รับมอบรถ (กบค.)', JOB_BY.replace(' (กบค.)', '')]], o.filled, o.signed)];
}
async function inspectPanel(filled, signed) {
  const o = { filled, signed };   // ตรวจสภาพรถปิดงาน + ลงนามการส่งคืนรถ
  if (has('InspectionChecklist')) {
    const ic = inst('InspectionChecklist', { Breakpoint: BP(), State: filled ? 'Filled' : 'Default' }, { AfterRepair: true }); ic.name = 'InspectionChecklist';
    const sh = ic.children.find(c => c.name === 'Section header'); if (sh) setProps(sh, { Title: 'ตรวจสภาพรถปิดงาน' });
    const ar = find(ic, 'AfterRepair');
    if (ar) { ['RepairFeedback', 'ReturnPart'].forEach(nm => { const x = find(ar, nm); if (x) x.visible = false; });
      const hs = find(ar, 'HandoverSignature'); if (hs) setProps(hs, { State: signed ? 'Signed' : filled ? 'Filled' : 'Default' }); }
    return [ic];
  }
  const sel = (i) => o.filled ? (i === INSPECT_FIX ? 1 : 0) : -1;
  const list = MOB
    ? INSPECT_ITEMS.map((t, i) => checkCard(t, ['ปกติ', 'ต้องแก้ไข'], sel(i))).concat([btn('Secondary button', 'เพิ่มรายการ', { icon: 'add-24-300-round', size: 'lg' })])
    : [checkTable(INSPECT_ITEMS, [['รายการ', 0], ['ปกติ', 100, i => radioCell(sel(i) === 0)], ['ต้องแก้ไข', 100, i => radioCell(sel(i) === 1)],
        ['หมายเหตุ', 448, i => noteCell(o.filled ? INSPECT_NOTE[i] || '' : ''), true]], true)];
  return [col('InspectionChecklist', [await section('ตรวจสภาพรถปิดงาน', { badge: INSPECT_ITEMS.length })].concat(list), 16),
    await signSection('ลงนามการส่งคืนรถ', [['ผู้ส่งมอบรถ (กบค.)', JOB_BY.replace(' (กบค.)', '')], ['ผู้รับมอบรถ (หน่วยงานเจ้าของรถ)', SIGN_OWNER]], o.filled, o.signed)];
}
async function receivePage(name, o) {   // หน้ารับรถเข้าบำรุงรักษา (กดเริ่มงาน) · o.filled · o.signed · o.modal = เปิดลงนาม
  o = o || {};
  const t = JOB_T, i = JOB_I, c = TRIP_CARS[i];
  const { scr, page } = await shell(name, { title: 'รับรถเข้าบำรุงรักษา · ' + c[0], back: true, crumbs: ['แผนเดินทาง ' + NOW_Q, t.name, c[0], 'รับรถ'] });
  const nodes = [await vehicleInfo([['ทะเบียน', c[0]], ['ยี่ห้อ/รุ่น', c[1]], ['หน่วยงานเจ้าของรถ', c[2]], ['สถานที่บำรุงรักษา', tripLoc(i, t.locs)], ['เบอร์ติดต่อ', tripPhone(i, t.phones)], ['วันที่รับรถ', SIGN_DATE]])]
    .concat(await receiptPanel(o.filled, o.signed),
      [col('Section', [await section('ภาพก่อนเริ่มงาน')].concat(await photoUploads(BEFORE, o.filled, false)), 16),
        btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันรับรถและเริ่มงาน', { size: 'lg', disabled: !o.signed }]])]);
  add(page, col('Content', nodes, 32), 'h');
  if (o.modal) await signModal(scr, 'ลงนามการรับมอบรถ', o.filled);
  return scr;
}
async function workForm(name, o) {   // ปิดงาน · o.filled · o.errors
  o = o || {};
  const E = (m) => o.errors ? m : '', t = JOB_T, i = JOB_I, c = TRIP_CARS[i];
  const { scr, page } = await shell(name, { title: 'ปิดงานบำรุงรักษา · ' + c[0], back: true, crumbs: ['แผนเดินทาง ' + NOW_Q, t.name, c[0], 'ปิดงาน'] });
  const nodes = [
    col('Section', [await section('ข้อมูลเอกสาร'), kv([['เลขที่งาน', NEW_PLAN[0]], ['หน่วยงานผู้ใช้บริการ', c[2]], ['ชื่องาน', 'บำรุงรักษารถกระเช้า ' + c[1] + ' ทะเบียน ' + c[0] + ' ณ ' + tripLoc(i, t.locs)], ['วันที่รับงาน', JOB_START.slice(0, 10)], ['วันที่เสร็จงาน', JOB_END.slice(0, 10)]])], 16),
    col('Section', [await section('บันทึกข้อตกลงลูกค้า'), kv([['ติดต่อลูกค้าชื่อ', 'นายสุรชัย แก้วมณี'], ['ตำแหน่ง', 'หัวหน้าแผนก ' + c[2]], ['เมื่อวันที่', t.d1], ['เบอร์โทรศัพท์', tripPhone(i, t.phones)], ['ความต้องการลูกค้า', 'บำรุงรักษาตามแผน ณ ' + tripLoc(i, t.locs)]])], 16),
    await closeParts(CLOSE_PARTS.filter((r, k) => k > 0 || JOB_OIL !== 0), o.filled),
    await closeCosts(o.filled)];   // ต่อจากรายการสภาพวัสดุอะไหล่ (3 พ.ย. 2569)
  nodes.push(col('Section', [await section('ผลการบำรุงรักษา'),
    row('Row', [field('เลขไมล์รถ (กม.)', o.filled ? '182,640' : '', { placeholder: '0', error: E('กรุณาระบุเลขไมล์รถ') }),
      field('ชั่วโมงเครื่องจักร (ชม.)', o.filled ? '6,131' : '', { placeholder: '0', error: E('กรุณาระบุชั่วโมงเครื่องจักร') })])], 16),
    await jobOil(JOB_OIL, o.oilRes || {}));   // ค่าตั้งต้นตามที่เลือกไว้ตอนอยู่ระหว่างบำรุงรักษา แก้ได้ (แทนติ๊ก "เก็บตัวอย่างน้ำมันไฮโดรลิกไปทดสอบแล้ว")
  nodes.push(...await inspectPanel(o.filled, o.filled));   // ตรวจสภาพรถปิดงาน + ลงนามการส่งคืนรถ (3 พ.ย. 2569)
  nodes.push(await closeDocs(o.filled));
  nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ปิดงาน', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
async function workDetail(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: V[0], back: true, crumbs: ['แผนเดินทาง ' + NOW_Q, JOB_T.name, V[0]], badge: WSTAT.done,   // 3 พ.ย. 2569 หัวเป็นทะเบียนเหมือนหน้างานรายคัน S10
 });
  const nodes = [await vehicleInfo(VEH_KV.concat([['เริ่มงาน', JOB_START], ['ปิดงาน', JOB_END], ['ผู้บันทึก', JOB_BY], ['น้ำมันไฮโดรลิก', JOB_OIL_OPTS[JOB_OIL]], ['เลขไมล์หลังทำ', '182,640 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '6,131 ชม.']]), 'ข้อมูลยานพาหนะและงาน'),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tbl(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16),
    // ภาพตอนจบงานเอาออก 4 พ.ย. 2569 ให้ตรงกับหน้าปิดงาน ("ยังไม่ต้องมีเพิ่มรูป" 3 พ.ย.)
    // ค่าใช้จ่ายรายคันที่กรอกตอนปิดงาน (3 พ.ย. 2569) · แสดงเฉพาะรายการที่กรอก
    col('Section', [await sectionLabel('ค่าใช้จ่ายของรถคันนี้ (บาท)'), await tbl([['พนักงาน กบค. ซ่อม', 0, 'Lead text'], ['ค่าเบี้ยเลี้ยง/วัน', 150], ['ค่าที่พัก/วัน', 150], ['จำนวนวัน', 120], ['รวม', 150]],
      CLOSE_COST_BY.map(r => [r[0], nf(r[1]), nf(r[2]), String(r[3]), nf(personSum(r))])),
      kv([['รวมค่าเบี้ยเลี้ยง', CLOSE_COST.perDiem + ' บาท'], ['รวมค่าที่พัก', CLOSE_COST.lodging + ' บาท'], ['ค่าเดินทาง (รวมทุกคน)', CLOSE_COST.travel + ' บาท'], ['รวมค่าใช้จ่ายของรถคันนี้', CLOSE_COST.total + ' บาท'], ['งบประมาณ (ศูนย์ต้นทุน)', OWNER_CC(TRIP_CARS[JOB_I])]])], 16)];
  // 3 พ.ย. 2569 เจ้าของงาน "ตรงนี้ลบแบชออก แล้วมี radio ว่าผ่าน ไม่ผ่าน และมีให้ upload ไฟล์เป็น optional" ⇒ กรอกผลในหน้านี้ได้เลย (อีกทางคือเมนู … ในหน้ารายละเอียดแผนเดินทาง S12)
  // S12 (4 พ.ย. 2569) ทางเดียวที่บันทึกผลหลังปิดงาน = section นี้ในหน้ารายละเอียดงานรายคัน · แสดงเฉพาะคันที่เก็บตัวอย่าง · o.res = { sel, files, errors, saved }
  const res = o.res || {};
  if (OIL_SAMPLED(JOB_OIL)) nodes.push(col('Section', [await sectionLabel('ผลการทดสอบน้ำมันไฮโดรลิก'), ...await oilResult(res),   // หน้างานรายคันแบบดู = Section label (R3)
    kv([['เก็บตัวอย่างเมื่อ', JOB_END.slice(0, 10) + ' โดย ' + JOB_BY]].concat(res.saved ? [['บันทึกผลเมื่อ', '11/11/2569 14:02 น. โดย ' + JOB_BY]] : [])),
    btnRow([['Primary button', 'บันทึกผลการทดสอบ', { size: 'md' }]])], 16));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S12 บันทึกผลตรวจน้ำมันไฮโดรลิก ---------- */

/* ---------- S15 ประวัติงานบำรุงรักษา · S17 รายงานผล/ปิดงาน · S18 ต้นทุน ---------- */
const HIST_COLS = [['ทะเบียน', 160, 'Lead text', 'Swap'], ['วันที่ทำ', 120], ['งานที่ทำ', 0], ['อะไหล่ที่ใช้', 220], ['ผลน้ำมัน', 110, 'Badge'], ['ผู้ทำ', 150], ['การยอมรับ', 190, 'Badge']];
const HIST = VEH.slice(0, 4).map((v, i) => [v[0], '0' + (4 + i) + '/11/2569', 'เปลี่ยนน้ำมันไฮโดรลิก · ไส้กรอง', '30 ลิตร · 5 ชิ้น',
  { pill: i === 2 ? ['ไม่ผ่าน', 'Error'] : ['ผ่าน', 'Success'] }, TRIP.staff[i % 3], { pill: i < 3 ? ACC.ok : ACC.wait }]);
async function progressScreen(name, o) {
  o = o || {};
  const done = o.done || 10, total = +P[4];
  const { scr, page } = await detail(name, { crumbs: ['ประวัติงานบำรุงรักษา'], status: 'active' });
  add(page, col('Content', [
    await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ความคืบหน้ารายคัน'), kv([['บำรุงรักษาแล้ว', done + ' / ' + total + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['รอทำ', (total - done) + ' คัน'], ['หน่วยงานยอมรับแล้ว', (done - 1) + ' คัน']]),
      alertBox('Warning', 'ยังบำรุงรักษาไม่ครบทุกคันตามแผน (เหลือ ' + (total - done) + ' คัน)', 'บอร์ด: "บำรุงรักษาเสร็จทั้งหมดหรือไม่?" — ครบแล้วจึงบันทึกและส่งประวัติให้หัวหน้า กบค. ตรวจสอบได้')], 16),
    col('Section', [await sectionLabel('ประวัติงานบำรุงรักษา', { badge: HIST.length }), await tbl(HIST_COLS, HIST)], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งประวัติให้หัวหน้าตรวจสอบ', { size: 'lg', disabled: true }]])
  ], 32), 'h');
  return scr;
}
async function historyScreen(name, o) {
  o = o || {};
  const total = +P[4];
  const { scr, page } = await detail(name, { crumbs: ['ประวัติงานบำรุงรักษา'], status: o.sent ? 'hist' : 'active' });
  const nodes = [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ความคืบหน้ารายคัน'), kv([['บำรุงรักษาแล้ว', total + ' / ' + total + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['รอทำ', '0 คัน'], ['หน่วยงานยอมรับแล้ว', total + ' คัน']])], 16),
    col('Section', [await sectionLabel('ประวัติงานบำรุงรักษาทั้งหมด', { badge: total }), await tbl(HIST_COLS, HIST, { pagination: total })], 16)];
  if (o.sent) nodes.push(alertBox('Info', 'ส่งประวัติให้หัวหน้า กบค. ตรวจสอบแล้ว 12/11/2569', 'แก้ไขไม่ได้จนกว่าหัวหน้าจะตีกลับ (S16)'));
  nodes.push(btnRow(o.sent ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }]] : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งประวัติให้หัวหน้าตรวจสอบ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
async function reportScreen(name, o) {
  o = o || {};
  const { scr, page } = await detail(name, { crumbs: ['รายงานผลการบำรุงรักษา'], status: o.closed ? 'closed' : 'passed',
    actions: [['Secondary button', 'ดาวน์โหลดรายงาน', 'cloud_upload-24-300-round']] });
  const nodes = [await vehicleInfo(PLAN_KV.concat([['หัวหน้า กบค. ตรวจประวัติ', 'ผ่าน · 13/11/2569'], ['ผู้ตรวจ', 'นายประเสริฐ มั่นคง']]), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('สรุปรายงานผลการบำรุงรักษา'), kv([['รถตามแผน', P[4] + ' คัน'], ['บำรุงรักษาแล้ว', P[4] + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['ใบเดินทาง', '2 ใบ'],
      ['อะไหล่ที่ใช้', '5 รายการ · คืนคลัง 1 รายการ'], ['ผลน้ำมันไฮโดรลิก', 'ผ่าน 11 · ไม่ผ่าน 1'], ['หน่วยงานยอมรับผล', P[4] + ' / ' + P[4] + ' คัน'], ['ช่วงดำเนินการ', '03/11/2569 – 12/11/2569']])], 16)];
  if (o.closed) nodes.push(alertBox('Success', 'ปิดงานแล้ว 14/11/2569', 'ไปขั้นคำนวณต้นทุน (S18) ได้'));
  nodes.push(btnRow(o.closed ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'คำนวณต้นทุน', { size: 'lg' }]] : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ปิดงาน', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
const COST_COLS = [['ใบเดินทาง / จุดรวมงาน', 0, 'Lead text'], ['รถ (คัน)', 100], ['ค่าแรง (เบี้ยเลี้ยง)', 160], ['ค่าที่พัก', 140], ['ค่าเดินทาง', 140], ['รวม (บาท)', 150]];
const COSTS = [[TRIP.place, '6', '7,200', '9,600', '4,850', '21,650'], ['จุดรวมงาน กฟน.2 น่าน', '6', '7,200', '12,800', '6,320', '26,320']];
async function costScreen(name) {
  const { scr, page } = await detail(name, { crumbs: ['ต้นทุนการบำรุงรักษา'], status: 'closed', actions: [['Secondary button', 'ดาวน์โหลด Excel', 'cloud_upload-24-300-round']] });
  add(page, col('Content', [
    await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ต้นทุนการบำรุงรักษา รายใบเดินทาง', { badge: COSTS.length }), await tbl(COST_COLS, COSTS)], 16),
    col('Section', [await sectionLabel('Summary ของต้นทุน'), kv([['ค่าแรง (เบี้ยเลี้ยง)', '14,400 บาท'], ['ค่าที่พัก', '22,400 บาท'], ['ค่าเดินทาง', '11,170 บาท'], ['รวมทั้งแผน', '47,970 บาท'], ['เฉลี่ยต่อคัน', '3,997.50 บาท'], ['จำนวนคัน', P[4] + ' คัน']])], 16),
    alertBox('Info', 'ค่าแรงใช้ยอดเบี้ยเลี้ยงที่กรอกรายคันตอนปิดงาน (S10) · ยังไม่รวมค่าอะไหล่', 'รอเคาะ Q26 — "ค่าแรง" กับ "ค่าเบี้ยเลี้ยง" รายการเดียวกันไหม · ต้นทุนรวมอะไหล่/ค่าจ้างไหม')
  ], 32), 'h');
  return scr;
}

/* ======================== รอบสอง 9 scenario (เจ้าของงานสั่ง 22 ต.ค. 2569 ดึก "บำรุงรักษา สามารถ export 18 scen ได้เลย") ========================
   S2–S3 ผพจ./หัวหน้า ผพจ. · S7 ผู้รับจ้าง · S8 กบค. ตรวจแผนผู้รับจ้าง · S9 กรย. · S11 กบค. ตรวจงานผู้รับจ้าง + รับคืนอะไหล่ · S13–S14 หน่วยงาน/เจ้าของรถ · S16 หัวหน้า กบค.
   ตีความเอง (คำถามในไฟล์ 14 ยังค้าง — แจ้งเจ้าของงานแล้ว): ผพจ. กับหัวหน้า ผพจ. คนละบทบาท (Q1) · ผู้รับจ้างมีบัญชีเข้า VMS+ เอง (Q13) · ยอมรับ 2 รอบ รายคัน S13 + ทั้งแผน S14 (Q28) ·
   ไม่มีปุ่มไม่ยอมรับ (Q23) · ไม่สร้างทางที่บอร์ดยังไม่มีปลายทาง (กรย. อะไหล่ไม่พร้อม Q16 · ผพจ. คืนอะไหล่ Q5)
   ยืมจาก flow งานซ่อม: `RepairFeedback` (คะแนน 1–5 Radio text card — เจ้าของงานเลือกให้ S14 · การประเมินเกิดตอนบำรุงรักษาครบทุกคัน) · `ReturnPart` (ตารางรับคืนอะไหล่ S11 — เลิกใช้ 3 พ.ย. 2569 · S11 ใหม่ใช้ hireJob + Table) */
async function tabs(items, active) {   // component Tabs (5 ช่อง Tab item) · items [[ข้อความ, จำนวน]] · ซ่อนช่องที่เกิน (ยกจาก overhaul2-plugin)
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
/* หน้ารายการของบทบาทอื่น (ผพจ. · ผู้รับจ้าง · กรย. · หน่วยงาน · หัวหน้า) — Page header + (Tabs) + Table header + Table · o.tabs = [[ข้อความ, จำนวน]] */
async function roleList(name, o) {
  const { scr, page } = await shell(name, { title: o.title });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  if (o.tabs) add(sec, await tabs(o.tabs, o.tab || 0), 'h');
  add(sec, await tableHeader({ placeholder: o.search }), 'h');
  add(sec, await tbl(o.cols, o.rows, { pagination: o.rows.length }), 'h');
  return scr;
}
const reason = (scr, title, label, value, ok) => formModal(scr, { title, fields: [{ label, value, area: 1 }], ok });   // ส่งกลับ/ปฏิเสธ/ตีกลับ = เหตุผล Freetext บังคับ (ไฟล์ 14)
const GO = { icons: ['keyboard_arrow_right-20-400-round'] };

/* ---------- S7 ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง (3 พ.ย. 2569) ----------
   เจ้าของงาน "s7 เป็นเรื่องอนุมัติแผนการเดินทาง" + หน้าอนุมัติแบบเดียวกับ S2 (radio อนุมัติ ค่าเริ่มต้น / ส่งกลับแก้ไข + เหตุผล) · ผู้อนุมัติตามสายงานจาก API getUpperLower (Q45)
   ตาม `Radio text card` + `Section label` + `Table` ของไฟล์ Component · หน้า Detail ⇒ Section label (R3) */
const TRIP_VIEW_COLS = [['ทะเบียน', 200, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 200], ['สถานที่บำรุงรักษา', 330]];
const tripCarRows = (t, only) => t.sel.filter(i => !only || TRIP_CARS[i][2] === only).map(i => [TRIP_CARS[i][0], TRIP_CARS[i][1], TRIP_CARS[i][2], { text: tripLoc(i, t.locs), sub: t.locs[i] ? 'แก้จากสำนักงานเจ้าของรถ' : 'ค่าเริ่มต้น สำนักงานที่รถอยู่' }]);
const tripKv = (t, more) => [['ชื่อแผนเดินทาง', t.name], ['แผน', P[0] + ' ' + P[1]], ['ไตรมาส', NOW_Q], ['รูปแบบดำเนินการ', t.vendor ? 'จ้างดำเนินการ' : 'กบค. ดำเนินการเอง']].concat(t.vendor
  ? [['ผู้รับจ้าง', t.vendor], ['เลขที่สัญญา/ใบสั่งจ้าง', t.contract || '-'], ['ช่วงวันทำงาน', t.d1 + ' – ' + t.d2]]   // S9 แผนจ้าง: ไม่มีพนักงาน กบค. และค่าใช้จ่าย
  : [['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2], ['พนักงาน กบค. ซ่อม', TRIP.staff.join(', ')]], [['ผู้สร้าง', 'นายวิชัย ทองดี (กบค.)'], ['วันที่ส่ง', '03/11/2569']], more || []);   // ค่าใช้จ่ายย้ายไปปิดงานรายคัน (3 พ.ย. 2569)
const TRIP_REVIEW_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวันเดินทาง', 220], ['รถ (คัน)', 100], ['ผู้สร้าง (กบค.)', 180], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 150, 'Badge'], ['', 60]];
const tripReviewRow = (t) => [{ text: t.name, sub: P[0] + ' · ' + NOW_Q }, t.d1 + ' – ' + t.d2, String(t.sel.length), 'นายวิชัย ทองดี', '03/11/2569', { pill: TST[t.st] }, GO];
const TRIP_OTHER = { name: 'ตรวจรถเครน นครราชสีมา บุรีรัมย์', sel: [0, 1, 2], locs: {}, d1: '10/11/2569', d2: '12/11/2569', st: 'review' };   // อีกใบในรายการรออนุมัติ (แสดงในตารางอย่างเดียว)
const tripReviewList = async (name, rows) => roleList(name, { title: 'แผนเดินทางรออนุมัติ', search: 'ค้นหาชื่อแผนเดินทาง, ผู้สร้าง', cols: TRIP_REVIEW_COLS, rows: rows.map(tripReviewRow) });
async function tripReview(name, o) {   // o.decision = 'return' · o.reason · o.errors · o.status = 'approved'
  o = o || {};
  const t = TRIP_1;
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนเดินทาง', back: true, crumbs: ['แผนเดินทางรออนุมัติ', t.name], badge: TST[o.status || 'review'] });
  const nodes = [await vehicleInfo(tripKv(t), 'รายละเอียดแผนเดินทาง'), col('Section', [await sectionLabel('รถในแผนเดินทาง', { badge: t.sel.length }), await tbl(TRIP_VIEW_COLS, tripCarRows(t))], 16)];
  if (o.status === 'approved') nodes.push(alertBox('Success', 'อนุมัติแผนเดินทางแล้ว 04/11/2569', 'แจ้งเตือนในแอปถึง กรย. และหน่วยงานเจ้าของรถแล้ว'));
  else {
    const ret = o.decision === 'return';
    const dec = await radioPick('ผลการพิจารณา', [['อนุมัติ', 'แผนเดินทางผ่านการตรวจสอบ แจ้งเจ้าของรถและ กรย.'], ['ส่งกลับแก้ไข', 'แจ้งเหตุผลให้ กบค. แก้ไขแผนเดินทางแล้วส่งใหม่']], ret ? 1 : 0, { label: true });
    if (ret) add(dec, area('เหตุผลที่ส่งกลับ', o.reason, { placeholder: 'ระบุเหตุผลที่ส่งกลับ', error: o.errors ? 'กรุณาระบุเหตุผลที่ส่งกลับ' : '' }), 'h');
    nodes.push(dec, btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg' }]]));
  }
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S8 แจ้งเตือนในแอปถึง กรย. และหน่วยงานเจ้าของรถ (3 พ.ย. 2569) ----------
   เจ้าของงาน "S8 เป็นเรื่อง noti ไปที่ กรย และหน่วยงานเจ้าของรถ" + "ดูอย่างเดียว" + "noti ออกแบบเป็น noti inapp ไปก่อน"
   กระดิ่ง + แผงแจ้งเตือน = `Notification card` (+ `_Notification item base` · `Status`) ตามแผงแจ้งเตือนของปลั๊กอิน Overhaul (S15 · บล็อก noti)
   กดแจ้งเตือนแล้วเปิดหน้าแผนเดินทางแบบดูอย่างเดียว · หน่วยงานเจ้าของรถเห็นเฉพาะรถของตน */
const propVal = (n, k) => { const cp = n.componentProperties || {}; const f = Object.keys(cp).find(x => x === k || x.split('#')[0].trim() === k); return f ? cp[f].value : undefined; };
function bell(scr, on) {   // กระดิ่งใน Header navigation = Nav button ที่ไลบรารีเปิด Indicator ไว้ · on = มีแจ้งเตือนใหม่ (จุดแดง)
  const hdr = scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Header navigation')[0];
  if (!hdr) { warn('กระดิ่ง', 'ไม่พบ Header navigation'); return null; }
  const b = (find(hdr, 'Nav items') || hdr).findAll(n => n.type === 'INSTANCE' && n.name === 'Nav button').find(n => propVal(n, 'Indicator') === true);
  if (!b) { warn('กระดิ่ง', 'ไม่พบ Nav button ที่มี Indicator'); return null; }
  setProps(b, { Indicator: !!on });
  return b;
}
function fillNotiItem(r, it) {   // [สีจุดสถานะ, ข้อความ, เวลา]
  setProps(r, { Text: it[1], 'Supporting text': it[2], 'Show status': true, 'Show button': false });
  const st = r.findAll(x => x.type === 'INSTANCE' && x.name === 'Status')[0]; if (st) setProps(st, { State: it[0] });
}
async function notiPanel(scr, items, badge) {
  const card = inst('Notification card');
  const hd = find(card, '_Notification header'); const bg = hd && find(hd, 'Badge outline'); if (bg) setProps(bg, { Text: badge, Color: 'Gray' });
  const rows = card.findAll(n => n.type === 'INSTANCE' && n.name === '_Notification item base');
  for (const [i, r] of rows.entries()) { if (items[i]) fillNotiItem(r, items[i]); else r.visible = false; }
  if (MOB) {   // Notification card ไม่มี variant มือถือ ⇒ bottom sheet หัว "แจ้งเตือน" (แบบ Overhaul)
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
const OWN_UNIT = TRIP_CARS[0][2];   // หน่วยงานเจ้าของรถตัวอย่าง (กฟฉ.1 ขอนแก่น · รถ 2 คันในแผนเดินทาง 1)
const ownCars = (t) => t.sel.filter(i => TRIP_CARS[i][2] === OWN_UNIT);
const NOTI_KRY = ['Brand', 'แผนเดินทาง ' + TRIP_1.name + ' อนุมัติแล้ว กบค. จะเข้าบำรุงรักษารถ ' + TRIP_1.sel.length + ' คัน ระหว่างวันที่ ' + TRIP_1.d1 + ' ถึง ' + TRIP_1.d2, '10 นาทีที่แล้ว'];
const NOTI_OWN = ['Brand', 'กบค. จะเข้าบำรุงรักษารถของหน่วยงาน ' + ownCars(TRIP_1).length + ' คัน (' + ownCars(TRIP_1).map(i => TRIP_CARS[i][0]).join(', ') + ') ระหว่างวันที่ ' + TRIP_1.d1 + ' ถึง ' + TRIP_1.d2 + ' ที่ ' + tripLoc(ownCars(TRIP_1)[0], TRIP_1.locs), '10 นาทีที่แล้ว'];
const NOTI_OLD = ['Success', 'กบค. บำรุงรักษารถ 82-3302 อุดรธานี ตามแผนเดินทางเดือนตุลาคมเสร็จแล้ว', '2 วันที่แล้ว'];
const TRIP_SEEN_COLS = [['ชื่อแผนเดินทาง', 0, 'Lead text'], ['ช่วงวันเดินทาง', 220], ['รถ (คัน)', 100], ['สถานะ', 150, 'Badge'], ['', 60]];
const tripSeenList = (name, own) => roleList(name, { title: 'แผนเดินทางบำรุงรักษา', search: 'ค้นหาชื่อแผนเดินทาง, ทะเบียน', cols: TRIP_SEEN_COLS, rows: [[{ text: TRIP_1.name, sub: P[0] + ' · ' + NOW_Q }, TRIP_1.d1 + ' – ' + TRIP_1.d2, String(own ? ownCars(TRIP_1).length : TRIP_1.sel.length), { pill: TST.approved }, GO]] });
async function tripView(name, own) {   // ดูอย่างเดียว · own = หน่วยงานเจ้าของรถ (เฉพาะรถของตน)
  const t = tripAs(TRIP_1, 'approved');
  const { scr, page } = await shell(name, { title: t.name, back: true, crumbs: ['แผนเดินทางบำรุงรักษา', t.name], badge: TST.approved });
  const kv = [['ชื่อแผนเดินทาง', t.name], ['แผน', P[0] + ' ' + P[1]], ['ไตรมาส', NOW_Q], ['ช่วงวันเดินทาง', t.d1 + ' – ' + t.d2], ['พนักงาน กบค. ซ่อม', TRIP.staff.join(', ')], ['ผู้สร้าง', 'นายวิชัย ทองดี (กบค.)'], ['อนุมัติเมื่อ', '04/11/2569']];
  const rows = tripCarRows(t, own ? OWN_UNIT : null);
  add(page, col('Content', [await vehicleInfo(kv, 'รายละเอียดแผนเดินทาง'), col('Section', [await sectionLabel(own ? 'รถของหน่วยงานในแผนเดินทาง' : 'รถในแผนเดินทาง', { badge: rows.length }), await tbl(TRIP_VIEW_COLS, rows)], 16)], 32), 'h');
  return scr;
}

/* ---------- S2 ผู้อนุมัติ ตรวจสอบและอนุมัติแผน (30 ต.ค. 2569 สายอนุมัติทั่วไป ไม่ผ่าน ผพจ.) ---------- */
const NP = NEW_PLAN;
const NO_NEW = 'MR Z7000003';   // ใช้กับ S3 ที่พักไว้ (เลขงาน) — ไม่อยู่ในชุดสร้างจอ
const npKv = (job) => [['ชื่อแผน', NP[1]], ['ปีงบประมาณ', NP[8]], ['ภาค', NP[2]], ['เขต', [...new Set(Object.keys(A_ALL).map(i => dCode(CAND[i])))].sort().join(', ')], ['ประเภทรถ', NP[7]], ['รถรายไตรมาส', NP[9]], ['จำนวนรถ', NP[4] + ' คัน'], ['เลขที่ MR', job || NP[0]], ['ผู้สร้างแผน', 'นายวิชัย ทองดี (กบค.)'], ['วันที่ส่ง', NP[6]]];
const VEH7 = CAND.map(c => [c[0], c[1], c[2], c[3], 'ready']);   // รถในแผนใหม่ = รถที่ติ๊กตอนสร้างแผน (ภาค 2 รถกระเช้า)
const REVIEW_COLS = [['ชื่อแผน', 0, 'Lead text', 'Swap'], ['ปีงบประมาณ', 120], ['ผู้สร้าง (กบค.)', 180], ['ภาค', 200], ['จำนวนรถ', 100], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 150, 'Badge'], ['', 60]];
const reviewRow = (p) => [p[1], p[8], 'นายวิชัย ทองดี', p[2], p[4] + ' คัน', p[6], { pill: PST[p[5]] }, GO];
const REVIEW_ROWS = [NP, PLANS[2], PLANS[3]];
const PART_CHECK_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['ตามแผน', 110], ['หน่วย', 90], ['คงเหลือในคลัง', 140], ['ต้องซื้อเพิ่ม', 140]];
const partCheckRows = () => PARTS.map((p, i) => [p[0], p[1], p[3], p[4], p[5], shortOf(i) ? String(shortOf(i)) : '-']);
async function planBody(o) {   // เนื้อหน้ารายละเอียดแผน ใช้ทั้งฝั่งผู้อนุมัติ (S2) และ กบค. (S19 S20) · o.wh = ไตรมาสที่คลังรับทราบแล้ว (แผนอนุมัติแล้ว · S22)
  o = o || {};
  const inPlan = Object.keys(A_ALL).map(Number);   // รถในแผนใหม่ = ที่จัดลงไตรมาสตอนสร้างแผน (S1)
  // เจ้าของงาน 2 พ.ย. 2569 "อยากให้ข้อมูลที่แสดงเป็นข้อมูลรถ" ⇒ รถแยกแท็บไตรมาส คอลัมน์เดียวกับ section รถในไตรมาสของ S1 ไม่มีไอคอน (ดูอย่างเดียว) · ไม่มีตารางอะไหล่ทั้งปี
  const q1 = inPlan.filter(i => A_ALL[i] === 1), n = (i) => (A_PICKS[i] || []).length;
  return [await vehicleInfo(npKv(), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('รถในแผน', { badge: inPlan.length }), await tabs(QUARTERS.map((t, k) => [t, inPlan.filter(i => A_ALL[i] === k + 1).length]), 0),
      o.wh ? (o.wh.indexOf(1) >= 0 ? alertBox('Success', 'คลังรับทราบรายการอะไหล่ไตรมาส 1 แล้ว', 'รับทราบ ' + o.wh.length + ' จาก ' + WH_QS.length + ' ไตรมาส · 02/11/2569') : alertBox('Warning', 'รอคลังรับทราบรายการอะไหล่ไตรมาส 1', 'รับทราบ ' + o.wh.length + ' จาก ' + WH_QS.length + ' ไตรมาส')) : null,
      await tbl(CARP_COLS.slice(0, 6), q1.map(i => [CAND[i][0], CAND[i][1], CAND[i][2], OIL_OPTS[(A_PICKS[i] || []).indexOf(0) >= 0 ? 1 : 0], LAST_OIL[i], n(i) ? n(i) + ' รายการ' : 'ยังไม่เลือก']))], 16)];
}
/* หน้ารายละเอียดแผนฝั่งผู้อนุมัติ (Detail ⇒ Section label)
   เจ้าของงาน 2 พ.ย. 2569: ผลการพิจารณาเป็น radio อนุมัติ (ค่าเริ่มต้น) / ส่งกลับแก้ไข แทนปุ่ม 2 ปุ่ม — ตามการ์ดตอบรับ/ปฏิเสธนัดหมายของ Overhaul R29 (§4.2.13)
   o.decision = 'return' เลือกส่งกลับแก้ไข ⇒ Text area เหตุผลบังคับ · o.reason = เหตุผลที่กรอก · o.errors = ยังไม่ระบุเหตุผล */
async function planReview(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนบำรุงรักษา', back: true, crumbs: ['แผนรออนุมัติ', NP[1]], badge: PST[o.status || 'review'] });
  const nodes = await planBody();
  if (o.status === 'approved') nodes.push(alertBox('Success', 'อนุมัติแผนแล้ว 31/10/2569', 'ส่งรายการอะไหล่รายไตรมาสให้ กบค. คลังแล้ว · กบค. เริ่มทำงานรายไตรมาสได้'));
  else {
    const ret = o.decision === 'return';
    const dec = await radioPick('ผลการพิจารณา', [['อนุมัติ', 'แผนผ่านการตรวจสอบ กบค. เริ่มงานรายไตรมาสได้'], ['ส่งกลับแก้ไข', 'แจ้งเหตุผลให้ กบค. แก้ไขแผนแล้วส่งใหม่']], ret ? 1 : 0, { label: true });
    if (ret) add(dec, area('เหตุผลที่ส่งกลับ', o.reason, { placeholder: 'ระบุเหตุผลที่ส่งกลับ', error: o.errors ? 'กรุณาระบุเหตุผลที่ส่งกลับ' : '' }), 'h');
    nodes.push(dec, btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันผลการพิจารณา', { size: 'lg' }]]));
  }
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S22 กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส (2 พ.ย. 2569) ----------
   เจ้าของงาน: ต่อจากอนุมัติ ส่งไปหา กบค. คลัง ว่าแต่ละไตรมาสเบิกอะไหล่อะไรบ้าง แยกไตรมาส · ระบบส่งทั้งปีทันทีที่อนุมัติ · คลังดูแล้วกดรับทราบ (ไม่มีส่งกลับ)
   หน้า Detail ⇒ Section label · Tabs ไตรมาสตัวเดียวกับ S1 · ยอดคิดจากอะไหล่ที่ กบค. เลือกไว้ (A_PICKS) ของรถแต่ละไตรมาส */
const WH_QS = [1, 2, 3, 4].filter(k => Object.values(A_ALL).indexOf(k) >= 0);   // ไตรมาสที่มีรถ = ไตรมาสที่ต้องรับทราบ
const wst = (n) => n === 0 ? ['รอรับทราบ', 'Warning'] : n < WH_QS.length ? ['รับทราบ ' + n + '/' + WH_QS.length + ' ไตรมาส', 'Info'] : ['รับทราบครบแล้ว', 'Success'];   // 2 พ.ย. 2569 รับทราบทีละไตรมาส
const WH_COLS = [['เลขที่ MR', 150, 'Lead text'], ['ชื่อแผน', 0], ['ปีงบประมาณ', 120], ['จำนวนรถ', 100], ['วันที่อนุมัติ', 130], ['สถานะ', 150, 'Badge'], ['', 60]];
const whRow = (p, n, d) => [p[0], p[1], p[8], p[4] + ' คัน', d, { pill: wst(n) }, GO];
const WH_PART_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวนที่ต้องเบิก', 150], ['หน่วย', 90], ['คงเหลือในคลัง', 140], ['ไม่พอ', 110]];
const whCars = (k) => Object.keys(A_ALL).map(Number).filter(i => A_ALL[i] === k);
const whParts = (k) => quarterParts(whCars(k), A_PICKS).map(r => { const st = +PARTS.find(p => p[0] === r[0])[5], need = +r[3]; return [r[0], r[1], r[3], r[4], String(st), need > st ? String(need - st) : '-']; });
async function warehouseScreen(name, o) {   // o.q = แท็บที่เปิด · o.acked = ไตรมาสที่รับทราบแล้ว
  o = o || {};
  const q = o.q || 1, rows = whParts(q), acked = o.acked || [], done = acked.indexOf(q) >= 0;
  const { scr, page } = await shell(name, { title: 'อะไหล่ที่ต้องเบิกรายไตรมาส', back: true, crumbs: ['แผนที่ต้องเตรียมอะไหล่', NP[1]], badge: wst(acked.length) });
  const sec = col('Section', [await sectionLabel('อะไหล่ที่ต้องเบิกรายไตรมาส'), await tabs(QUARTERS.map((t, k) => [t, whParts(k + 1).length]), q - 1)], 16);
  if (done) add(sec, alertBox('Success', 'รับทราบไตรมาส ' + q + ' แล้ว 02/11/2569', 'กบค. เห็นสถานะนี้ในหน้ารายการและหน้ารายละเอียดแผน'), 'h');
  if (rows.length) add(sec, await tbl(WH_PART_COLS, rows), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ไม่มีอะไหล่ที่ต้องเบิก'); await text(es, 'Supporting text', 'ไตรมาสนี้ไม่มีรถในแผน ไม่ต้องรับทราบ'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  const nodes = [await vehicleInfo(npKv(), 'รายละเอียดแผน'), sec];
  if (rows.length && !done) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบไตรมาส ' + q, { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S19 แก้ไขแผน · S20 ลบแผน (30 ต.ค. 2569 · ยึดบล็อก C D ของ Overhaul) ----------
   แก้ไข: รออนุมัติ · ส่งกลับแก้ไข · อนุมัติแล้ว แล้วส่งอนุมัติใหม่ทุกครั้ง (เจ้าของงาน "แก้ไขแล้วมีอนุมัติ อยากให้ใส่ไปก่อน")
   ลบ: เฉพาะก่อนอนุมัติ · ไม่มียกเลิกแผน (เจ้าของงาน "ยกเลิกแผนไม่ต้องมีก็ได้") · ทำไม่ได้ในสถานะนั้น = ซ่อน ไม่ disable */
const planAs = (st) => NP.slice(0, 5).concat([st], NP.slice(6));
const RETURN_REASON = 'จำนวนไส้กรองไฮโดรลิกไม่ตรงกับรอบบำรุงรักษาของรถกระเช้า กรุณาตรวจสอบรถที่เลือกเข้าแผน';
const ALERT_RETURNED = ['Error', 'ผู้อนุมัติส่งกลับให้แก้ไข', RETURN_REASON];
const ALERT_APPROVED = ['Warning', 'แผนนี้อนุมัติแล้ว', 'เมื่อบันทึก แผนจะกลับเป็นสถานะรออนุมัติ และต้องให้ผู้อนุมัติตรวจสอบอีกครั้ง'];
/* S21 อะไหล่ของรถแต่ละคัน: เลือกรถในแผน → แผงคลังอะไหล่ชุดเดียวกับ S5 (PartRequestStepPanel) → บันทึกแล้วกลับฟอร์มสร้างแผน */
const Q_CARS = Object.keys(A_ALL).map(Number).filter(i => A_ALL[i] === 1), CAR_ADD = [0].concat(CAR_PICK, [4]);   // รถของไตรมาสที่เปิดจากฟอร์ม
async function carPartsScreen(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'อะไหล่ของรถ', back: true, crumbs: ['สร้างแผน', 'อะไหล่ของรถ'] });
  const f = dropdown('รถ', CAND[0][0], { placeholder: 'เลือกรถในไตรมาสนี้', lead: 'search-24-300-round', state: o.carOpen ? 'Focused' : undefined });
  const oil = await radioPick('น้ำมันไฮโดรลิก', OIL_OPTS, o.oil === 'change' ? 1 : 0);   // เลือกรายคัน · วันที่เปลี่ยนล่าสุดช่วยตัดสินใจ · เปลี่ยนน้ำมัน = น้ำมันเข้ารายการอะไหล่
  const last = field('เปลี่ยนน้ำมันครั้งล่าสุด', LAST_OIL[0], { state: 'Readonly' });
  add(oil, MOB ? last : row('Row', [last, frame('Spacer', 'VERTICAL')]), 'h');
  add(page, col('Content', [MOB ? f : row('Row', [f, frame('Spacer', 'VERTICAL')]), oil, await partsPanel({ car: true, picked: o.picked || [], manual: o.manual }),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกอะไหล่ของรถ', { size: 'lg' }]])], 32), 'h');
  if (o.carOpen) comboAt(scr, f.findOne(n => n.name === 'Container') || f, Q_CARS.map(i => [CAND[i][0], '', i === 0]));
  if (o.manual && !o.manual.filled && (MOB || !has('PartRequestStepPanel'))) await formModal(scr, { title: 'รายการเพิ่มเติม', fields: [{ label: 'ชื่ออะไหล่' }, { label: 'รหัสอะไหล่ (ถ้ามี)' }, { label: 'ราคาต่อหน่วย' }], ok: 'เพิ่ม' });   // ไม่มีแผงงานซ่อม ⇒ กรอกใน popup
  return scr;
}
const EDIT_FORM = Object.assign({ edit: true, values: FILLED, alloc: A_ALL, picks: A_PICKS, q: 1 }, R2);
const EDIT_CONFIRM = { title: 'ยืนยันการแก้ไข', sub: 'แผนจะกลับเป็นสถานะรออนุมัติ และส่งให้ผู้อนุมัติตรวจสอบอีกครั้ง โปรดตรวจสอบก่อนยืนยัน', cancel: 'ยกเลิก', ok: 'ยืนยัน' };
const AREA_CONFIRM = { title: 'ยืนยันการเอาเขตออก', sub: 'รถของ กฟฉ.3 ที่จัดไว้ 1 คัน จะถูกเอาออกจากทุกไตรมาส', cancel: 'ปิด', ok: 'ยืนยัน' };   // เลือกหลายค่า ⇒ เอาค่าใดออก รถที่ตรงค่านั้นออกจากแผน รถอื่นอยู่เหมือนเดิม
const PART_REMOVE_CONFIRM = { danger: true, title: 'ยืนยันการเอาอะไหล่ออก', sub: 'ไส้กรองไฮโดรลิก จะถูกเอาออกจากรถทุกคันในไตรมาส 2', cancel: 'ยกเลิก', ok: 'เอาออก' };
const DELETE_CONFIRM = { danger: true, title: 'ยืนยันการลบแผน', sub: 'เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่', cancel: 'ยกเลิก', ok: 'ยืนยัน' };
function planMenu(scr, items) {   // เมนู "…" ตามสถานะแผน · ไลบรารีมีเส้นคั่นก่อนรายการที่ 3 ⇒ น้อยกว่า 3 รายการต้องซ่อนเส้นคั่น
  const m = menuAt(scr, firstMenuCell(scr), items);
  if (items.length < 3) { const d = (find(m, 'Menu items') || m).children[3]; if (d) d.visible = false; }
  return m;
}
async function planDetail(name, o) {   // หน้ารายละเอียดแผนฝั่ง กบค. · ก่อนอนุมัติมี ลบแผน + แก้ไข · อนุมัติแล้วเหลือแก้ไข
  o = o || {};
  const st = o.status || 'review';
  const actions = [['Secondary button', 'แก้ไข', 'stylus-24-300-round']];
  if (st !== 'approved') actions.unshift(['Secondary danger button', 'ลบแผน', 'delete-24-300-round']);
  const { scr, page } = await shell(name, { title: 'เลขที่ ' + NP[0], back: true, crumbs: [NP[1]], badge: PST[st], actions });
  const nodes = await planBody({ wh: st === 'approved' || st === 'active' ? (o.wh || [1]) : null });
  if (st === 'returned') nodes.unshift(alertBox(...ALERT_RETURNED));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S3 ผพจ. ออกเลขงาน · หัวหน้า ผพจ. ตรวจรายการอะไหล่ · ใบ PO ---------- */
const PO_ITEMS = [1, 4].map(i => [PARTS[i][0], PARTS[i][1], String(shortOf(i)), PARTS[i][4], baht(PRICE[i]), baht(shortOf(i) * PRICE[i])]);
const PO_TOTAL = [1, 4].reduce((a, i) => a + shortOf(i) * PRICE[i], 0);
const PO_KV = [['เลขที่ PO', 'PO-2570-0158'], ['วันที่ PO', '24/10/2569'], ['ผู้ขาย', 'บริษัท ไทยลูบริแคนท์ ซัพพลาย จำกัด'], ['วงเงิน', baht(PO_TOTAL)]];
async function planIssue(name, o) {   // แผนอนุมัติแล้ว ฝั่ง ผพจ. — ก่อน/หลังออกเลขงาน · หลังบันทึก PO
  o = o || {};
  const job = o.job ? NO_NEW : '';
  const { scr, page } = await shell(name, { title: job ? 'หมายเลขแผน ' + job : 'แผนรอออกเลขงาน', back: true, crumbs: ['แผนอนุมัติแล้ว', job || NP[1]], badge: PST.approved,
    actions: job ? undefined : [['Primary button', 'ออกเลขงาน']] });
  const nodes = [await vehicleInfo(npKv(job), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('รายการอะไหล่ที่ต้องใช้', { badge: PARTS.length }), await tbl(PART_CHECK_COLS, partCheckRows())], 16)];
  if (o.po) nodes.push(col('Section', [await sectionLabel('ใบสั่งซื้ออะไหล่ (PO)'), kv(PO_KV), await tbl([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 100], ['หน่วย', 90], ['ราคาต่อหน่วย', 150], ['รวม', 150]], PO_ITEMS)], 16));
  else if (job) nodes.push(alertBox(o.sent ? 'Info' : 'Brand', o.sent ? 'ส่งรายการอะไหล่ให้หัวหน้า ผพจ. ตรวจสอบแล้ว' : 'ออกเลขงาน ' + job + ' แล้ว', o.sent ? 'หัวหน้า ผพจ. อนุมัติแล้วจึงทำเรื่องซื้ออะไหล่และออกใบ PO' : 'ส่งรายการอะไหล่ให้หัวหน้า ผพจ. ตรวจสอบก่อนจัดซื้อ'));
  if (job && !o.sent && !o.po) nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งให้หัวหน้า ผพจ. ตรวจสอบ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
async function headPartCheck(name) {   // หัวหน้า ผพจ. ตรวจรายการอะไหล่
  const { scr, page } = await shell(name, { title: 'ตรวจรายการอะไหล่ · ' + NO_NEW, back: true, crumbs: ['รายการอะไหล่รอตรวจ', NO_NEW], badge: ['รอหัวหน้า ผพจ. ตรวจ', 'Warning'] });
  add(page, col('Content', [await vehicleInfo(npKv(NO_NEW), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('รายการอะไหล่ที่จะใช้ในแผน', { badge: PARTS.length }), await tbl(PART_CHECK_COLS, partCheckRows()),
      alertBox('Warning', 'ต้องซื้อเพิ่ม 2 รายการ รวม ' + baht(PO_TOTAL), 'ไส้กรองไฮโดรลิก 9 ชิ้น · ไส้กรองเชื้อเพลิง 14 ชิ้น')], 16),
    btnRow([['Secondary button', 'ส่งกลับ', { size: 'lg' }], ['Primary button', 'อนุมัติรายการอะไหล่', { size: 'lg' }]])], 32), 'h');
  return scr;
}
async function poForm(name) {   // ฟอร์มใบ PO — ช่องทั้งหมดยังไม่รู้ (ไฟล์ 14 S3) ใช้ชุดที่เสนอ
  const { scr, page } = await shell(name, { title: 'บันทึกใบสั่งซื้ออะไหล่ (PO)', back: true, crumbs: ['หมายเลขแผน ' + NO_NEW, 'ใบ PO'] });
  add(page, col('Content', [
    col('Section', [await section('ข้อมูลใบสั่งซื้อ'), row('Row', [field('เลขที่ PO', PO_KV[0][1]), field('วันที่ PO', PO_KV[1][1])]),
      row('Row', [dropdown('ผู้ขาย', PO_KV[2][1], { lead: 'search-24-300-round' }), field('วงเงิน (บาท)', PO_TOTAL.toLocaleString('en-US'))])], 16),
    col('Section', [await section('รายการอะไหล่ที่สั่งซื้อ', { badge: PO_ITEMS.length }), await tbl([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 100], ['หน่วย', 90], ['ราคาต่อหน่วย', 150], ['รวม', 150]], PO_ITEMS)], 16),
    col('Section', [await section('เอกสารแนบ'), await upload('ใบสั่งซื้อ (PO)', [pdf('PO-2570-0158.pdf', '310 KB')], { hint: 'PDF, JPG · สูงสุด 10 ไฟล์' })], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกใบ PO', { size: 'lg' }]])], 32), 'h');
  return scr;
}

/* ---------- S7 ผู้รับจ้างทำแผนเดินทาง · S8 กบค. ตรวจแผนเดินทางของผู้รับจ้าง ---------- */
const HIRE = PLANS[1];   // แผนที่ว่าจ้าง (MR Z7000002 รถเครน ภาค 2)
const CONTRACTOR = 'บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด';
const TRIP_ST = { none: ['ยังไม่สร้าง', 'Gray'], wait: ['รอ กบค. ตรวจสอบ', 'Warning'], ok: ['อนุมัติแล้ว', 'Success'], rej: ['ปฏิเสธ', 'Error'] };
const HTRIP = { place: 'จุดรวมงาน กฟฉ.2 อุบลราชธานี', d1: '10/11/2569', d2: '13/11/2569' };
const JOBS_COLS = [['เลขที่ MR', 140, 'Lead text'], ['แผน', 0], ['ไตรมาส', 100], ['จำนวนรถ', 110], ['แผนเดินทาง', 180, 'Badge'], ['', 60]];
const jobsRows = (st) => [[HIRE[0], HIRE[1], HIRE[3], HIRE[4] + ' คัน', { pill: TRIP_ST[st] }, GO], ['MR Z6900014', 'บำรุงรักษารถเครน ภาค 2 ปีงบประมาณ 2569', 'ไตรมาส 4', '5 คัน', { pill: TRIP_ST.ok }, GO]];
async function hireTripForm(name, o) {   // ช่องเดียวกับ S6 ยกเว้นพนักงาน กบค. และค่าใช้จ่าย (ไฟล์ 14 S7)
  o = o || {};
  const v = o.filled ? HTRIP : {}, E = (m) => o.errors ? m : '';
  const { scr, page } = await shell(name, { title: 'สร้างแผนเดินทาง', back: true, crumbs: ['งานที่ได้รับว่าจ้าง', HIRE[0], 'สร้างแผนเดินทาง'] });
  const sel = o.filled ? [0, 1, 4] : [];
  const car = await carPick('เลือกรถที่จะบำรุงรักษา', CARS, sel, { error: sel.length ? '' : E('กรุณาเลือกรถที่จะบำรุงรักษาอย่างน้อย 1 คัน') });
  add(page, col('Content', [await vehicleInfo([['เลขที่ MR', HIRE[0]], ['แผน', HIRE[1]], ['ไตรมาส', HIRE[3]], ['ผู้รับจ้าง', CONTRACTOR]], 'งานที่ได้รับว่าจ้าง'),
    col('Section', [await section('รายละเอียดแผนเดินทาง'), row('Row', [
      dropdown('สถานที่บำรุงรักษา (จุดรวมงาน)', v.place, { placeholder: 'ค้นหาจุดรวมงาน', lead: 'search-24-300-round', error: E('กรุณาเลือกสถานที่บำรุงรักษา') }),
      field('วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม') }), field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') })])], 16),
    car.sec,
    alertBox('Info', 'ยืนยันแล้วระบบส่งแผนให้ กบค. ตรวจสอบ และแจ้งเจ้าของรถ + กรย.', 'ส่งแจ้งเตือนก่อนหรือหลัง กบค. อนุมัติ ยังไม่เคาะ'),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันและส่งให้ กบค. ตรวจสอบ', { size: 'lg' }]])], 32), 'h');
  return scr;
}
const HT_COLS = [['ผู้รับจ้าง', 0, 'Lead text'], ['แผน', 150], ['รถ (คัน)', 100], ['จุดรวมงาน', 260], ['ช่วงวัน', 220], ['วันที่ส่ง', 120], ['', 60]];
const HT_ROWS = { wait: [[CONTRACTOR, HIRE[0], '3', HTRIP.place, HTRIP.d1 + ' – ' + HTRIP.d2, '24/10/2569', GO], ['หจก. ช่างกลภาคอีสาน', 'MR Z7000005', '4', 'จุดรวมงาน กฟฉ.3 นครราชสีมา', '17/11/2569 – 20/11/2569', '25/10/2569', GO]],
  ok: [[CONTRACTOR, 'MR Z6900014', '5', 'จุดรวมงาน กฟฉ.2 อุบลราชธานี', '05/08/2569 – 08/08/2569', '20/07/2569', GO]], rej: [] };
async function hireTripReview(name, o) {   // กบค. ดูรายละเอียดแผนเดินทางของผู้รับจ้าง
  o = o || {};
  const { scr, page } = await shell(name, { title: 'แผนเดินทาง · ' + CONTRACTOR, back: true, crumbs: ['แผนเดินทางผู้รับจ้าง', HIRE[0]], badge: TRIP_ST[o.st || 'wait'] });
  const nodes = [await vehicleInfo([['ผู้รับจ้าง', CONTRACTOR], ['เลขที่ MR', HIRE[0]], ['แผน', HIRE[1]], ['วันที่ส่ง', '24/10/2569'], ['จุดรวมงาน', HTRIP.place], ['ช่วงวันเดินทาง', HTRIP.d1 + ' – ' + HTRIP.d2], ['รถในแผนเดินทาง', '3 คัน']], 'รายละเอียดแผนเดินทาง'),
    col('Section', [await sectionLabel('รถที่จะบำรุงรักษา', { badge: 3 }), await tbl([['ทะเบียน', 170, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 220]], [0, 1, 4].map(i => [VEH[i][0], VEH[i][1], VEH[i][2]]))], 16),
    btnRow([['Secondary button', 'ปฏิเสธ', { size: 'lg' }], ['Primary button', 'อนุมัติแผนเดินทาง', { size: 'lg' }]])];
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S9 กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน ---------- */
const PREP = { new: ['ยังไม่รับทราบ', 'Gray'], ack: ['รับทราบแล้ว', 'Info'], ready: ['เตรียมแล้ว', 'Success'] };
const PREP_COLS = [['เลขที่ MR', 140, 'Lead text'], ['ผู้ดำเนินการ', 0], ['จุดรวมงาน', 260], ['วันเดินทาง', 140], ['สถานะ', 160, 'Badge'], ['', 60]];
const prepRows = (st) => [[P[0], 'กบค. (ตรวจเอง)', TRIP.place, TRIP.d1, { pill: PREP[st] }, GO], [HIRE[0], CONTRACTOR, HTRIP.place, HTRIP.d1, { pill: PREP.new }, GO]];
async function prepDetail(name, o) {
  o = o || {};
  const st = o.st || 'new';
  const { scr, page } = await shell(name, { title: 'เตรียมอะไหล่ · ' + P[0], back: true, crumbs: ['แผนเดินทางที่ต้องเตรียมอะไหล่', P[0]], badge: PREP[st] });
  const nodes = [await vehicleInfo([['เลขที่ MR', P[0]], ['ผู้ดำเนินการ', 'กบค. (ตรวจเอง)'], ['จุดรวมงาน', TRIP.place], ['ช่วงวันเดินทาง', TRIP.d1 + ' – ' + TRIP.d2]], 'แผนเดินทาง'),
    col('Section', [await sectionLabel('อะไหล่ที่ต้องวางที่จุดรวมงาน', { badge: PARTS.length }), await tbl([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 110], ['หน่วย', 90], ['คลัง', 180]], PARTS.map((p, i) => [p[0], p[1], p[3], p[4], WH[i]]))], 16)];
  if (st === 'ready') nodes.push(alertBox('Success', 'เตรียมอะไหล่ไว้ที่จุดรวมงานแล้ว 02/11/2569', 'กบค. เห็นสถานะนี้ที่แผนเดินทาง (S6/S10)'));
  else if (st === 'ack') nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกว่าเตรียมแล้ว', { size: 'lg' }]]));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบแผน', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S11 กบค. ตรวจรับงานรายคันของผู้รับจ้าง — ใช้ hireJob (หน้างานรายคัน) + tripDetail ใบจ้าง · หน้ารายการ "งานที่ผู้รับจ้างส่งมา" และ ReturnPart เดิมเลิกใช้ 3 พ.ย. 2569 ---------- */

/* ---------- S13 หน่วยงาน/เจ้าของรถ ยอมรับผลรายคัน · S14 ทั้งแผน + ประเมินความพึงพอใจ ---------- */
const ACC_COLS = [['ทะเบียน / แผน', 0, 'Lead text'], ['วันที่บำรุง', 140], ['ผู้ทำ', 220], ['เลขที่ MR', 140], ['สถานะ', 200, 'Badge'], ['', 60]];
const ACC_PLAN = ['ทั้งแผน (' + P[4] + ' คัน)', '04–12/11/2569', 'กบค. (ตรวจเอง)', P[0]];
const accRows = (o) => {
  o = o || {};
  const cars = [0, 1, 4].map((i, k) => [VEH[i][0], '0' + (4 + k) + '/11/2569', TRIP.staff[k] + ' (กบค.)', P[0], { pill: (o.accepted || []).indexOf(k) >= 0 ? ACC.ok : ACC.wait }, GO]);
  if (o.plan) cars.unshift([ACC_PLAN[0], ACC_PLAN[1], ACC_PLAN[2], ACC_PLAN[3], { pill: o.plan === 'done' ? ['ยอมรับผลทั้งแผนแล้ว', 'Success'] : ['ครบทุกคันแล้ว รอตรวจหลักฐาน', 'Warning'] }, GO]);
  return cars;
};
async function carResult(name, o) {   // รายการตรวจบำรุงรถรายคัน (ฝั่งหน่วยงาน) — ใบตรวจ 2 ใบ + ภาพ + อะไหล่ที่ใช้จริง · กรณีบำรุงรักษาไม่ได้แสดงสาเหตุ
  o = o || {};
  const car = o.cannot ? VEH[2] : V;
  const { scr, page } = await shell(name, { title: 'ผลการตรวจบำรุงรถ · ' + car[0], back: true, crumbs: ['รอตรวจสอบ', car[0]], badge: o.cannot ? WSTAT.cannot : ACC[o.ok ? 'ok' : 'wait'] });
  const nodes = [await vehicleInfo([['ทะเบียน', car[0]], ['ยี่ห้อ/รุ่น', car[1]], ['หน่วยงานเจ้าของรถ', car[2]], ['เลขที่ MR', P[0]], ['วันที่บำรุง', '04/11/2569'], ['ผู้ทำ', TRIP.staff[0] + ' (กบค.)']], 'ข้อมูลยานพาหนะ')];
  if (o.cannot) nodes.push(col('Section', [await sectionLabel('สาเหตุที่บำรุงรักษาไม่ได้'), kv([['สาเหตุ', 'รถติดภารกิจซ่อมสายส่งฉุกเฉิน ไม่อยู่ที่หน่วยงานในวันนัด'], ['ผู้บันทึก', TRIP.staff[0] + ' (กบค.)'], ['วันที่บันทึก', '05/11/2569']])], 16),
    alertBox('Warning', 'ใช้ฟอร์มเดียวกับคันที่บำรุงรักษาได้หรือแยก ยังไม่เคาะ (Q19)', 'จอนี้แสดงสาเหตุจาก S10 แล้วให้ยอมรับรับทราบ'));
  else nodes.push(col('Section', [await sectionLabel('เอกสารการตรวจบำรุงรถ (2)'), await upload('ใบตรวจสภาพอะไหล่ · ใบตรวจสภาพงานบำรุงรักษา', [pdf('ใบตรวจสภาพอะไหล่-' + car[0].split(' ')[0] + '.pdf', '380 KB'), pdf('ใบตรวจสภาพงานบำรุงรักษา-' + car[0].split(' ')[0] + '.pdf', '410 KB')], { readonly: true })], 16),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tbl(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16));   // ภาพตอนจบงานเอาออก 4 พ.ย. 2569 ให้ตรงกับหน้าปิดงาน
  if (o.ok) nodes.push(alertBox('Success', 'ยอมรับผลการตรวจบำรุงรถแล้ว 06/11/2569', 'รอคันอื่นในแผนครบแล้วจึงตรวจหลักฐานทั้งแผน (S14)'));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยอมรับผลการตรวจบำรุงรถ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
/* ประเมินความพึงพอใจ — ยืม RepairFeedback (คะแนนประเมินคุณภาพงานซ่อมบำรุงของงานซ่อม: Section header + Radio text card 1–5) · เจ้าของงานเลือก 22 ต.ค. 2569
   การประเมินเกิดตอนบำรุงรักษาครบทุกคันตามแผน ก่อนกดยอมรับผลทั้งแผน (S14) · ไม่มี/mobile → Section header + Radio text card ของไลบรารี */
async function feedback(score) {
  const title = 'คะแนนประเมินความพึงพอใจงานบำรุงรักษา', sub = 'ให้คะแนน 1–5 · 1 ต้องปรับปรุงมาก · 5 ดีมาก';
  if (!MOB && has('RepairFeedback')) {
    const f = inst('RepairFeedback'); f.name = 'RepairFeedback';
    const sh = find(f, 'Section header'); if (sh) { setProps(sh, { Title: title, 'Supporting text': true, Badge: false, Actions: false, 'More actions': false }); await text(sh, 'Supporting text', sub); }
    f.findAll(n => n.type === 'INSTANCE' && n.name === 'Radio text card').forEach(c => {
      const t = c.findOne(x => x.type === 'TEXT' && x.name === 'Text');
      const n = t ? +t.characters : NaN;
      setProps(c, { Selected: score && n === score ? 'True' : 'False', Supporting: false });
    });
    return f;
  }
  const r = MOB ? frame('Radio', 'HORIZONTAL', { gap: 8 }) : row('Radio', [], { gap: 16 });
  [1, 2, 3, 4, 5].forEach(n => { const c = inst('Radio text card', { State: 'Default', Selected: n === score ? 'True' : 'False' }, { Text: String(n), Supporting: false }); r.appendChild(c); c.layoutGrow = 1; });
  const sh = await section(title);
  return col('Section', [sh, r], 16);
}
async function planEvidence(name, o) {   // เอกสารหลักฐานการตรวจบำรุงรถทั้งแผน + ประเมินความพึงพอใจ + ยอมรับผลทั้งแผน
  o = o || {};
  const { scr, page } = await shell(name, { title: 'หลักฐานการตรวจบำรุงรถ · ' + P[0], back: true, crumbs: ['รอตรวจสอบ', P[0]], badge: o.done ? ['ยอมรับผลทั้งแผนแล้ว', 'Success'] : ['ครบทุกคันแล้ว', 'Warning'] });
  const nodes = [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('สรุปรายคัน', { badge: 3 }), await tbl([['ทะเบียน', 170, 'Lead text'], ['ใบตรวจสภาพอะไหล่', 0], ['ใบตรวจสภาพงานบำรุงรักษา', 0], ['การยอมรับรายคัน', 200, 'Badge']],
      [0, 1, 4].map(i => [VEH[i][0], 'ใบตรวจสภาพอะไหล่-' + VEH[i][0].split(' ')[0] + '.pdf', 'ใบตรวจสภาพงานบำรุงรักษา-' + VEH[i][0].split(' ')[0] + '.pdf', { pill: ACC.ok }]), { pagination: 3 })], 16),
    await feedback(o.score || 0),
    area('ข้อเสนอแนะเพิ่มเติม', o.score ? 'ทีมงานตรงเวลา ทำความสะอาดพื้นที่หลังเสร็จงาน' : '', { optional: true, placeholder: 'ระบุข้อเสนอแนะ' })];
  if (o.done) nodes.push(alertBox('Success', 'ยอมรับผลการตรวจบำรุงรถทั้งแผนแล้ว 14/11/2569', 'แจ้ง กบค. แล้ว — ส่งประวัติให้หัวหน้า กบค. ได้ (S15)'));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยอมรับผลการตรวจบำรุงรถ', { size: 'lg', disabled: !o.score }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S16 หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา ---------- */
const HST = { wait: ['รอหัวหน้าตรวจสอบ', 'Warning'], ok: ['ผ่านแล้ว', 'Success'], back: ['ตีกลับ', 'Error'] };
const HQ_COLS = [['เลขที่ MR', 140, 'Lead text'], ['แผน', 0], ['กบค. ผู้ส่ง', 200], ['จำนวนรถ', 110], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 180, 'Badge'], ['', 60]];
const hqRows = (st) => [[P[0], P[1], 'นายวิชัย ทองดี', P[4] + ' คัน', '12/11/2569', { pill: HST[st] }, GO], ['MR Z6900011', PLANS[4][1], 'นางสาวกนกวรรณ ใจมั่น', '10 คัน', '28/06/2569', { pill: HST.ok }, GO]];
async function headHistory(name, o) {   // หน้าเดียวกับ S15 (Display) + ปุ่มตีกลับ/อนุมัติ
  o = o || {};
  const { scr, page } = await shell(name, { title: 'หมายเลขแผน ' + P[0], back: true, crumbs: ['ประวัติรอตรวจสอบ', P[0]], badge: HST[o.st || 'wait'] });
  const total = +P[4];
  const nodes = [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('ความคืบหน้ารายคัน'), kv([['บำรุงรักษาแล้ว', total + ' / ' + total + ' คัน'], ['ทำไม่ได้', '0 คัน'], ['หน่วยงานยอมรับแล้ว', total + ' คัน'], ['ผู้ส่ง', 'นายวิชัย ทองดี (กบค.) · 12/11/2569']])], 16),
    col('Section', [await sectionLabel('ประวัติงานบำรุงรักษาทั้งหมด', { badge: total }), await tbl(HIST_COLS, HIST, { pagination: total })], 16)];
  if (o.st === 'ok') nodes.push(alertBox('Success', 'อนุมัติประวัติแล้ว 13/11/2569 — บันทึกเป็นประวัติทางการ', 'กบค. ออกรายงานผลและปิดงานได้ (S17)'));
  else nodes.push(btnRow([['Secondary button', 'ตีกลับ', { size: 'lg' }], ['Primary button', 'อนุมัติประวัติ', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- รายการจอแยกตาม scenario (ชื่อ = scenario ใน 14-บำรุงรักษา-userflow.md) ---------- */
const SCENARIOS = [
  ['S1 · กบค. สร้างแผนบำรุงรักษาประจำปี และจัดรถลงไตรมาส', [
    ['รายการแผน', () => listScreen('S1 รายการแผน', { rows: PLANS })],
    ['ฟอร์มสร้างแผน (ว่าง)', () => planForm('S1 ฟอร์มสร้างแผน', {})],
    ['เลือกปีงบประมาณ — รายการปีเปิด', () => planForm('S1 เลือกปีงบประมาณ', { values: { name: FILLED.name }, yearOpen: true })],
    ['เลือกภาค — รายการภาคเปิด', () => planForm('S1 เลือกภาค', { values: FILLED, regionOpen: true, regions: [REGIONS[1]] })],
    ['เลือกเขต — เลือกได้หลายเขตของภาคที่เลือก', () => planForm('S1 เลือกเขต', { values: FILLED, regions: [REGIONS[1]], districts: ['กฟฉ.1', 'กฟฉ.3'], districtOpen: true })],
    ['ไม่มีรถในเขตและประเภทรถที่เลือก', () => planForm('S1 ไม่มีรถ', { values: FILLED, regions: [REGIONS[1]], districts: ['กฟฉ.3'], types: ['รถขุด'], noCars: true })],
    ['แท็บไตรมาส 1 — พิมพ์ค้นแล้วเลือกรถลงไตรมาส', () => planForm('S1 ไตรมาส 1', Object.assign({ values: FILLED, alloc: A_Q1, q: 1, carOpen: true, carQuery: '82' }, R2))],
    ['แท็บไตรมาส 2 — รายการรถบอกไตรมาสที่จัดไว้', () => planForm('S1 ไตรมาส 2', Object.assign({ values: FILLED, alloc: A_ALL, q: 2, carOpen: true }, R2))],
    ['เอาภาค เขต หรือประเภทรถออก — ยืนยันเอารถที่จัดไว้ออก', async () => { const s = await planForm('S1 เอาเขตออก', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, q: 2 }, R2)); await confirm(s, AREA_CONFIRM); return s; }],
    ['อะไหล่ในไตรมาส — ยืนยันเอาอะไหล่ออกจากทุกคัน', async () => { const s = await planForm('S1 เอาอะไหล่ออก', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, q: 2 }, R2)); await confirm(s, PART_REMOVE_CONFIRM); return s; }],
    ['กดบันทึกโดยยังไม่ครบ', () => planForm('S1 ยังไม่ครบ', { errors: true })],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await planForm('S1 ยืนยันการออก', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, q: 2 }, R2)); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' }); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S1 บันทึกไม่สำเร็จ', Object.assign({ values: FILLED, alloc: A_ALL, picks: A_PICKS, q: 2 }, R2)); notify(s, 'general error', true); return s; }],
    ['บันทึกและส่งอนุมัติสำเร็จ — รออนุมัติ', async () => { const s = await listScreen('S1 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(PLANS) }); notify(s, 'ส่งแผนบำรุงรักษาเพื่ออนุมัติสำเร็จ'); return s; }]]],
  ['S2 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนบำรุงรักษา', [
    ['รายการแผนรออนุมัติ', () => roleList('S2 แผนรออนุมัติ', { title: 'แผนรออนุมัติ', search: 'ค้นหาชื่อแผน, ผู้สร้าง', cols: REVIEW_COLS, rows: REVIEW_ROWS.map(reviewRow) })],
    ['รายละเอียดแผน — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)', () => planReview('S2 รายละเอียดแผน', {})],
    ['อนุมัติ — ยืนยันอนุมัติแผน', async () => { const s = await planReview('S2 ยืนยันอนุมัติ', {}); await confirm(s, { title: 'ยืนยันอนุมัติแผนบำรุงรักษา', sub: NP[1] + ' · ' + NP[4] + ' คัน · อนุมัติแล้ว กบค. เริ่มงานรายไตรมาสได้', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนสำเร็จ', async () => { const s = await planReview('S2 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนบำรุงรักษาสำเร็จ'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => planReview('S2 เลือกส่งกลับ', { decision: 'return' })],
    ['ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล', () => planReview('S2 ส่งกลับไม่ครบ', { decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await planReview('S2 ยืนยันส่งกลับ', { decision: 'return', reason: RETURN_REASON }); await confirm(s, { title: 'ยืนยันส่งกลับแก้ไข', sub: 'แผนจะกลับไปให้ กบค. แก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่', ok: 'ส่งกลับ' }); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await roleList('S2 ส่งกลับแล้ว', { title: 'แผนรออนุมัติ', search: 'ค้นหาชื่อแผน, ผู้สร้าง', cols: REVIEW_COLS, rows: [planAs('returned'), PLANS[2], PLANS[3]].map(reviewRow) }); notify(s, 'ส่งแผนกลับให้ กบค. แก้ไขแล้ว'); return s; }]]],
  // S3 ผพจ. ออกเลขงานและจัดซื้ออะไหล่ — พักไว้ 30 ต.ค. 2569 (เจ้าของงาน "อนุมัติเลขงาน ไม่ต้องมีในระบบแล้ว แยกออกไปก่อน") · ฟังก์ชัน planIssue/headPartCheck/poForm คงไว้ · userflow ย้ายไป 14-…-พักไว้-S3.md
  ['S4 · กบค. ติดตามความคืบหน้าและเบิกอะไหล่ของไตรมาส', [
    ['อะไหล่ไตรมาส 1 — รอเบิก เทียบคงเหลือ Smart Inventory', () => partsProgress('S4 รอเบิก', { picked: Q_ALL })],
    ['ยืนยันเบิก/จอง — สรุปรายการ', async () => { const s = await partsProgress('S4 สรุปรายการ', { picked: Q_ALL }); await partsSummary(s, { stock: 3, buy: 2 }); return s; }],
    ['ผลเบิก/จอง — คงเหลือไม่พอ 2 รายการ', () => partsProgress('S4 ไม่พอ', { picked: Q_ALL, result: 'short' })],
    ['เบิกครบแล้ว — ไปทำแผนเดินทางได้', () => partsProgress('S4 เบิกครบ', { picked: Q_ALL, result: 'ok' })],
    ['Smart Inventory ขัดข้อง', () => partsProgress('S4 คลังขัดข้อง', { picked: Q_ALL, inv: 'API error' })],
    ['ไตรมาสนี้ยังไม่มีอะไหล่ในแผน', () => partsProgress('S4 ไม่มีอะไหล่', { picked: [] })]]],
  // S5 เบิกอะไหล่ผ่านระบบจองอะไหล่ — รวมเข้า S4 2 พ.ย. 2569 (เจ้าของงาน "รวบ s4 s5 เป็นหน้าเดียวกัน ยุบ S5 ออกไปก่อน") · บล็อก D เว้นว่าง
  ['S6 · กบค. ทำแผนเดินทาง (ตรวจเอง)', [
    ['รถในไตรมาสและแผนเดินทาง (ยังไม่มีแผนเดินทาง)', () => tripList('S6 แผนเดินทาง (ว่าง)', { trips: [] })],
    ['ฟอร์มสร้างแผนเดินทาง (ว่าง)', () => tripForm('S6 ฟอร์มแผนเดินทาง', {})],
    ['กดเพิ่มรถ — popup รถของไตรมาสที่ยังไม่อยู่ในแผนเดินทาง', () => tripForm('S6 popup เพิ่มรถ', { modal: { pool: TRIP_ALL, ticked: TRIP_SEL } })],
    ['เพิ่มรถแล้ว — สถานที่ตั้งต้นสำนักงานที่รถอยู่', () => tripForm('S6 เพิ่มรถแล้ว', { sel: TRIP_SEL })],
    ['แก้ไขเบอร์ติดต่อและสถานที่บำรุงรักษาของรถ', async () => { const s = await tripForm('S6 แก้เบอร์และสถานที่', { sel: TRIP_SEL }); await tripCarEdit(s, 4, TRIP_PHONES, TRIP_LOCS); return s; }],
    ['เลือกช่วงวันเดินทาง', () => tripForm('S6 เลือกช่วงวัน', { sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES, dateOpen: true })],
    ['กดยืนยันโดยยังไม่ครบ', () => tripForm('S6 ยังไม่ครบ', { errors: true })],
    ['กรอกครบ', () => tripForm('S6 กรอกครบ', { values: TRIP_FILLED, sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES })],
    ['ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)', async () => { const s = await tripList('S6 ยืนยันแล้ว', { trips: [TRIP_1] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }],
    ['สร้างแผนเดินทางใบถัดไป — popup ไม่แสดงรถที่อยู่ในแผนเดินทางแล้ว', () => tripForm('S6 ใบถัดไป popup', { modal: { pool: TRIP_REST, ticked: TRIP_REST, used: TRIP_SEL.length } })],
    ['แผนเดินทาง 2 ใบ — รถครบทุกคันของไตรมาส', async () => { const s = await tripList('S6 แผนเดินทาง 2 ใบ', { trips: [tripAs(TRIP_1, 'approved'), TRIP_2] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }],
    ['รถทุกคันของไตรมาสอยู่ในแผนเดินทางแล้ว', () => tripForm('S6 รถครบแล้ว', { modal: { pool: [], used: TRIP_ALL.length } })],
    ['แผนเดินทางถูกส่งกลับแก้ไข', () => tripList('S6 ถูกส่งกลับ', { trips: [tripAs(TRIP_1, 'returned')] })],
    ['แก้ไขแผนเดินทางที่ถูกส่งกลับ', () => tripForm('S6 แก้ไขที่ถูกส่งกลับ', { edit: true, alert: ['Error', 'ผู้อนุมัติส่งกลับให้แก้ไข', TRIP_RETURN], values: Object.assign({}, TRIP_FILLED, { d1: '10/11/2569', d2: '14/11/2569' }), sel: TRIP_SEL, locs: TRIP_LOCS, phones: TRIP_PHONES })],
    ['ส่งอนุมัติใหม่แล้ว', async () => { const s = await tripList('S6 ส่งอนุมัติใหม่', { trips: [Object.assign(tripAs(TRIP_1, 'review'), { d1: '10/11/2569', d2: '14/11/2569' })] }); notify(s, 'ส่งแผนเดินทางให้ผู้อนุมัติใหม่แล้ว'); return s; }]]],
  ['S7 · ผู้อนุมัติ ตรวจสอบและอนุมัติแผนเดินทาง', [
    ['รายการแผนเดินทางรออนุมัติ', () => tripReviewList('S7 รออนุมัติ', [TRIP_1, TRIP_V, TRIP_OTHER])],
    ['รายละเอียดแผนเดินทาง — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)', () => tripReview('S7 รายละเอียด', {})],
    ['อนุมัติ — ยืนยันอนุมัติแผนเดินทาง', async () => { const s = await tripReview('S7 ยืนยันอนุมัติ', {}); await confirm(s, { title: 'ยืนยันอนุมัติแผนเดินทาง', sub: TRIP_1.name + ' · ' + TRIP_1.sel.length + ' คัน · อนุมัติแล้วระบบแจ้งเตือน กรย. และหน่วยงานเจ้าของรถ', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนเดินทางสำเร็จ', async () => { const s = await tripReview('S7 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนเดินทางสำเร็จ'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => tripReview('S7 เลือกส่งกลับ', { decision: 'return' })],
    ['ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล', () => tripReview('S7 ส่งกลับไม่ครบ', { decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await tripReview('S7 ยืนยันส่งกลับ', { decision: 'return', reason: TRIP_RETURN }); await confirm(s, { title: 'ยืนยันส่งกลับแก้ไข', sub: 'แผนเดินทางจะกลับไปให้ กบค. แก้ไขตามเหตุผลที่ระบุ แล้วส่งอนุมัติใหม่', ok: 'ส่งกลับ' }); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await tripReviewList('S7 ส่งกลับแล้ว', [TRIP_V, TRIP_OTHER]); notify(s, 'ส่งแผนเดินทางกลับให้ กบค. แก้ไขแล้ว'); return s; }]]],
  ['S8 · กรย. และหน่วยงานเจ้าของรถ ได้รับแจ้งเตือนแผนเดินทาง', [
    ['กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)', async () => { const s = await tripSeenList('S8 กรย. มีใหม่', false); bell(s, true); return s; }],
    ['กรย. — เปิดแผงแจ้งเตือน', async () => { const s = await tripSeenList('S8 กรย. แผงแจ้งเตือน', false); bell(s, true); await notiPanel(s, [NOTI_KRY, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['กรย. — แผนเดินทาง ดูอย่างเดียว (รถทุกคันในใบ)', () => tripView('S8 กรย. แผนเดินทาง', false)],
    ['หน่วยงานเจ้าของรถ — เปิดแผงแจ้งเตือน', async () => { const s = await tripSeenList('S8 หน่วยงาน แผงแจ้งเตือน', true); bell(s, true); await notiPanel(s, [NOTI_OWN, NOTI_OLD], '1 แจ้งเตือนใหม่'); return s; }],
    ['หน่วยงานเจ้าของรถ — แผนเดินทาง ดูอย่างเดียว (เฉพาะรถของหน่วยงาน)', () => tripView('S8 หน่วยงาน แผนเดินทาง', true)]]],
  ['S9 · กบค. สร้างแผนเดินทางจ้างดำเนินการ (vendor)', [
    ['เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น', () => tripForm('S9 เลือกจ้าง', { mode: 'hire' })],
    ['เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด', () => tripForm('S9 รายชื่อผู้รับจ้าง', { mode: 'hire', vendorOpen: true, values: { name: TRIP_V.name } })],
    ['กดเพิ่มรถ — popup รถที่ยังไม่อยู่ในแผนเดินทาง', () => tripForm('S9 popup เพิ่มรถ', { mode: 'hire', values: { name: TRIP_V.name, vendor: TRIP_V.vendor }, modal: { pool: TRIP_REST, ticked: TRIP_REST, used: TRIP_SEL.length } })],
    ['แก้ไขเบอร์ติดต่อและสถานที่บำรุงรักษาของรถ', async () => { const s = await tripForm('S9 แก้เบอร์และสถานที่', { mode: 'hire', values: { name: TRIP_V.name, vendor: TRIP_V.vendor }, sel: TRIP_REST }); await tripCarEdit(s, 6, TRIP_V_PHONES, TRIP_V_LOCS); return s; }],
    ['กดยืนยันโดยยังไม่ครบ', () => tripForm('S9 ยังไม่ครบ', { mode: 'hire', errors: true })],
    ['กรอกครบ', () => tripForm('S9 กรอกครบ', { mode: 'hire', values: TRIP_V, sel: TRIP_REST, locs: TRIP_V_LOCS, phones: TRIP_V_PHONES })],
    ['ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)', async () => { const s = await tripList('S9 ยืนยันแล้ว', { trips: [tripAs(TRIP_1, 'approved'), TRIP_V] }); notify(s, 'สร้างแผนเดินทางสำเร็จ · ส่งให้ผู้อนุมัติแล้ว'); return s; }]]],
  // S9 เดิม กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน — ตัดออก 3 พ.ย. 2569 (เจ้าของงาน "เรื่องเตรียมอะไหล่ เป็นการติดต่อกันเอง") แทนด้วย S9 แผนจ้างดำเนินการ · prepDetail/prepRows คงไว้
  // S7 ผู้รับจ้างทำแผนเดินทาง · S8 กบค. ตรวจแผนผู้รับจ้าง (เดิม) — แทนด้วย S7 อนุมัติ S8 แจ้งเตือน 3 พ.ย. 2569 · hireTripForm/hireTripReview คงไว้ให้เส้นว่าจ้างที่รอออกแบบ (ไฟล์ 14 หัวข้อ 2.1)
  ['S10 · กบค. บันทึกงานบำรุงรักษารายคัน', [
    // แผนที่ กบค. ดำเนินการเอง (มุมผู้รับจ้างแยกเป็น S23 4 พ.ย. 2569) — 3 พ.ย. 2569 เจ้าของงาน: เข้าจากหน้ารายละเอียดแผนเดินทาง เลือกรถทีละคัน · ทำทีละขั้น (เริ่มงาน → ปิดงาน / บำรุงรักษาไม่ได้) ตาม RP & MA Job ของ UI Release#2
    ['หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน', () => tripDetail('S10 รายละเอียดแผนเดินทาง', {})],
    ['กดปุ่ม … ของรถ — ดูรายละเอียด แก้ไข ลบ', () => tripDetail('S10 เมนูของรถ', { menu: true })],
    ['เมนูแก้ไข — แก้ไขเบอร์ติดต่อและสถานที่', () => tripDetail('S10 แก้ไขรถในแผนเดินทาง', { edit: true })],
    ['เมนูลบ — ยืนยันเอารถออกจากแผนเดินทาง', () => tripDetail('S10 ลบรถออกจากแผนเดินทาง', { del: true })],
    ['หน้างานรายคัน — ยังไม่เริ่ม', () => jobPage('S10 งานรายคัน', {})],
    ['กดเริ่มงาน — หน้ารับรถ (รายการรับรถ + ลงนาม)', () => receivePage('S10 รับรถ', {})],
    ['กดเซ็นลงนาม — ลงนามการรับมอบรถ', () => receivePage('S10 ลงนามรับมอบรถ', { filled: true, modal: true })],
    ['ตรวจรายการและลงนามครบ — ยืนยันรับรถและเริ่มงาน', () => receivePage('S10 รับรถครบ', { filled: true, signed: true })],
    ['เริ่มงานแล้ว — อยู่ระหว่างบำรุงรักษา', async () => { const s = await jobPage('S10 อยู่ระหว่างบำรุงรักษา', { st: 'doing' }); notify(s, 'เริ่มงานบำรุงรักษาแล้ว'); return s; }],
    ['ปิดงาน — ฟอร์มผลงาน', () => workForm('S10 ปิดงาน', {})],
    ['กดปิดงานโดยยังไม่ครบ', () => workForm('S10 ปิดงานยังไม่ครบ', { errors: true })],
    ['กรอกผลงานครบ', () => workForm('S10 ปิดงานกรอกครบ', { filled: true })],
    ['ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง', async () => { const s = await tripDetail('S10 ปิดงานสำเร็จ', { st: JOB_MIX, oil: { [JOB_I]: 'wait' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['บำรุงรักษาไม่ได้ — ระบุสาเหตุ', () => jobPage('S10 บำรุงรักษาไม่ได้', { i: TRIP_1.sel[2], modal: 'cannot', reason: JOB_CANNOT })],
    ['บำรุงรักษาไม่ได้ — ยังไม่ระบุสาเหตุ', () => jobPage('S10 บำรุงรักษาไม่ได้ยังไม่ครบ', { i: TRIP_1.sel[2], modal: 'cannot', errors: true })],
    ['บำรุงรักษาไม่ได้ระหว่างบำรุงรักษา — อะไหล่ที่ใช้ไปแล้ว', () => jobPage('S10 บำรุงรักษาไม่ได้ระหว่างทำ', { st: 'doing', modal: 'cannot', reason: HIRE_WHY })],
    ['บันทึกบำรุงรักษาไม่ได้แล้ว — จบได้เลย ไม่ต้องส่งตรวจ', async () => { const s = await tripDetail('S10 บันทึกบำรุงรักษาไม่ได้', { st: { [TRIP_1.sel[2]]: 'cannot' } }); notify(s, 'บันทึกบำรุงรักษาไม่ได้แล้ว'); return s; }],
    ['ดูงานที่ปิดแล้ว — เสร็จสิ้น', () => workDetail('S10 งานที่ปิดแล้ว', {})]]],
  /* S23 ผู้รับจ้าง (เลขชั่วคราว · 4 พ.ย. 2569 เจ้าของงาน "แยกเป็นอีก scen นึงได้ป่ะ" + "เดี๋ยวสุดท้ายจะจัดเรียงใหม่ทั้งหมด") — วางต่อจาก S10 ตามลำดับงาน ไม่เลื่อนเลข S11–S22
     หน้ารับรถ หน้าปิดงาน และ popup บำรุงรักษาไม่ได้ใช้หน้าเดียวกับ S10 · ไม่มีแก้ไข ลบ รถในแผนและอะไหล่ตามแผนก่อนเริ่ม · เริ่มแล้วแก้ไข ลบ อะไหล่และภาพได้ */
  ['S23 · ผู้รับจ้าง บันทึกงานรายคันและส่งตรวจงาน', [
    ['รายละเอียดแผนเดินทาง สถานะงานรายคัน', () => tripDetail('S23 ผู้รับจ้าง แผนเดินทาง', { trip: HIRE_T, st: HIRE_VENDOR })],
    ['กดปุ่ม … ของรถ — ดูรายละเอียดอย่างเดียว', () => tripDetail('S23 ผู้รับจ้าง เมนูของรถ', { trip: HIRE_T, st: HIRE_VENDOR, menu: true, vendor: true })],
    ['หน้างานรายคัน ยังไม่เริ่ม — ไม่มีแก้ไข ลบ', () => jobPage('S23 ผู้รับจ้าง งานรายคัน', { vendor: true, i: TRIP_V.sel[4] })],
    ['เริ่มงานแล้ว — อยู่ระหว่างบำรุงรักษา', () => jobPage('S23 ผู้รับจ้าง อยู่ระหว่างบำรุงรักษา', { vendor: true, st: 'doing', i: TRIP_V.sel[3] })],
    ['อัปโหลดภาพเพิ่ม — กำลังอัปโหลด (แถบความคืบหน้า)', () => jobPage('S23 ผู้รับจ้าง อัปโหลดภาพ', { vendor: true, st: 'doing', i: TRIP_V.sel[3], uploading: true })],
    ['ปิดงานแล้ว ดำเนินการบำรุงรักษาแล้ว', () => hireJob('S23 ผู้รับจ้าง ดำเนินการแล้ว', { st: 'worked' })],
    ['กดไอคอนแก้ไขอะไหล่ — แก้จำนวนที่ใช้จริง', () => hireJob('S23 ผู้รับจ้าง แก้ไขอะไหล่', { st: 'worked', partEdit: true })],
    ['กดเพิ่มอะไหล่ — popup เพิ่มอะไหล่ที่ใช้จริง', () => hireJob('S23 ผู้รับจ้าง เพิ่มอะไหล่', { st: 'worked', partAdd: 'filled' })],
    ['กดไอคอนลบอะไหล่ — ยืนยันเอาออก', () => hireJob('S23 ผู้รับจ้าง ลบอะไหล่', { st: 'worked', partDel: true })],
    ['กดส่งตรวจงาน', async () => { const s = await hireJob('S23 ผู้รับจ้าง ยืนยันส่งตรวจงาน', { st: 'worked' }); await confirm(s, HIRE_SEND_CONFIRM(TRIP_CARS[HIRE_DONE])); return s; }],
    ['ส่งตรวจงานแล้ว รอตรวจรับ', async () => { const s = await hireJob('S23 ผู้รับจ้าง รอตรวจรับ', { st: 'wait' }); notify(s, 'ส่งตรวจงานแล้ว'); return s; }],
    ['แจ้งบำรุงรักษาไม่ได้ (ยังไม่ส่ง)', () => hireJob('S23 ผู้รับจ้าง แจ้งบำรุงรักษาไม่ได้', { st: 'reported', cannot: true })],
    ['ถูกส่งกลับแก้ไข (คันที่ปิดงานไว้)', () => hireJob('S23 ผู้รับจ้าง ส่งกลับแก้ไข', { st: 'returned' })],
    ['ถูกส่งกลับแก้ไข (คันที่แจ้งบำรุงรักษาไม่ได้)', () => hireJob('S23 ผู้รับจ้าง ส่งกลับแก้ไข แจ้งไม่ได้', { st: 'returned', cannot: true })]]],
  ['S11 · กบค. ตรวจรับงานรายคันของผู้รับจ้างและรับคืนอะไหล่', [
    ['หน้ารายละเอียดแผนเดินทาง — คันที่รอตรวจรับ', () => tripDetail('S11 แผนเดินทางจ้าง', { trip: HIRE_T, st: HIRE_MIX })],
    ['หน้างานรายคัน รอตรวจรับ — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)', () => hireJob('S11 ตรวจรับ', { st: 'wait', kbk: true })],
    ['คันที่แจ้งบำรุงรักษาไม่ได้ — สาเหตุและอะไหล่ส่งคืน', () => hireJob('S11 ตรวจรับ แจ้งไม่ได้', { st: 'wait', kbk: true, cannot: true })],
    ['อนุมัติ — ยืนยันอนุมัติงาน', async () => { const s = await hireJob('S11 ยืนยันอนุมัติ', { st: 'wait', kbk: true }); await confirm(s, HIRE_OK_CONFIRM(TRIP_CARS[HIRE_DONE])); return s; }],
    ['อนุมัติสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง', async () => { const s = await tripDetail('S11 อนุมัติแล้ว', { trip: HIRE_T, st: Object.assign({}, HIRE_MIX, { [HIRE_DONE]: 'done' }) }); notify(s, 'อนุมัติงานบำรุงรักษาแล้ว'); return s; }],
    ['เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น', () => hireJob('S11 เลือกส่งกลับ', { st: 'wait', kbk: true, decision: 'return' })],
    ['ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล', () => hireJob('S11 ส่งกลับไม่ครบ', { st: 'wait', kbk: true, decision: 'return', errors: true })],
    ['ส่งกลับแก้ไข — ยืนยันส่งกลับ', async () => { const s = await hireJob('S11 ยืนยันส่งกลับ', { st: 'wait', kbk: true, decision: 'return', reason: HIRE_BACK }); await confirm(s, HIRE_BACK_CONFIRM); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await tripDetail('S11 ส่งกลับแล้ว', { trip: HIRE_T, st: Object.assign({}, HIRE_MIX, { [HIRE_DONE]: 'returned' }) }); notify(s, 'ส่งกลับให้ผู้รับจ้างแก้ไขแล้ว'); return s; }]]],
  ['S12 · กบค. บันทึกผลตรวจน้ำมันไฮโดรลิก', [   // 4 พ.ย. 2569 เลิก popup: ใส่ผลตอนปิดงาน (ถ้ามี) หรือภายหลังที่หน้ารายละเอียดงานรายคัน · ป้ายรอผลที่สถานะงาน
    ['หน้าปิดงาน — เลือกเก็บตัวอย่าง ใส่ผลการทดสอบได้ (ถ้ามี)', () => workForm('S12 ปิดงาน ผลการทดสอบ', { filled: true })],
    ['ปิดงานโดยยังไม่มีผล — ป้ายรอผลตรวจน้ำมัน', async () => { const s = await tripDetail('S12 รอผลตรวจน้ำมัน', { st: JOB_MIX, oil: { [JOB_I]: 'wait' } }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['กดปุ่ม … ของรถ — ดูรายละเอียด', () => tripDetail('S12 เมนูของรถ', { st: JOB_MIX, oil: { [JOB_I]: 'wait' }, menu: true })],
    ['หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง', () => workDetail('S12 งานรายคัน รอผล', { res: {} })],
    ['กดบันทึกโดยยังไม่เลือกผล', () => workDetail('S12 ผลการทดสอบยังไม่ครบ', { res: { errors: true } })],
    ['เลือกผล + แนบไฟล์ (ถ้ามี)', () => workDetail('S12 ผลการทดสอบกรอกครบ', { res: { sel: 1, files: [OIL_FILE] } })],
    ['บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง', async () => { const s = await workDetail('S12 บันทึกผลสำเร็จ', { res: { sel: 1, files: [OIL_FILE], saved: true } }); notify(s, 'บันทึกผลการทดสอบน้ำมันไฮโดรลิกสำเร็จ'); return s; }],
    ['กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน', () => tripDetail('S12 น้ำมันไม่ผ่าน', { st: JOB_MIX, oil: { [JOB_I]: 'fail' } })]]],
  ['S13 · หน่วยงาน/เจ้าของรถ ยอมรับผลการตรวจบำรุงรถรายคัน', [
    ['รายการรอตรวจสอบ', () => roleList('S13 รายการ', { title: 'การตรวจบำรุงรถรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขที่ MR', cols: ACC_COLS, rows: accRows({}) })],
    ['ผลการตรวจบำรุงรถรายคัน', () => carResult('S13 รายคัน', {})],
    ['คันที่บำรุงรักษาไม่ได้ — สาเหตุ', () => carResult('S13 ทำไม่ได้', { cannot: true })],
    ['ยืนยันยอมรับผล', async () => { const s = await carResult('S13 ยืนยัน', {}); await confirm(s, { title: 'ยืนยันยอมรับผลการตรวจบำรุงรถ', sub: V[0] + ' · บำรุงรักษาวันที่ 04/11/2569', ok: 'ยอมรับผล' }); return s; }],
    ['ยอมรับผลแล้ว', async () => { const s = await roleList('S13 ยอมรับแล้ว', { title: 'การตรวจบำรุงรถรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขที่ MR', cols: ACC_COLS, rows: accRows({ accepted: [0] }) }); notify(s, 'ยอมรับผลการตรวจบำรุงรถ ' + V[0] + ' สำเร็จ'); return s; }]]],
  ['S14 · หน่วยงาน/เจ้าของรถ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)', [
    ['รายการ — ครบทุกคันแล้ว', () => roleList('S14 รายการ', { title: 'การตรวจบำรุงรถรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขที่ MR', cols: ACC_COLS, rows: accRows({ plan: 'wait', accepted: [0, 1, 2] }) })],
    ['หลักฐานทั้งแผน — ยังไม่ประเมิน', () => planEvidence('S14 ยังไม่ประเมิน', {})],
    ['ประเมินความพึงพอใจแล้ว', () => planEvidence('S14 ประเมินแล้ว', { score: 5 })],
    ['ยืนยันยอมรับผลทั้งแผน', async () => { const s = await planEvidence('S14 ยืนยัน', { score: 5 }); await confirm(s, { title: 'ยืนยันยอมรับผลการตรวจบำรุงรถทั้งแผน', sub: P[0] + ' · ' + P[4] + ' คัน · คะแนนความพึงพอใจ 5 · ระบบจะแจ้ง กบค.', ok: 'ยอมรับผล' }); return s; }],
    ['ยอมรับผลทั้งแผนแล้ว', async () => { const s = await planEvidence('S14 ยอมรับแล้ว', { score: 5, done: true }); notify(s, 'ยอมรับผลการตรวจบำรุงรถทั้งแผนสำเร็จ'); return s; }]]],
  ['S15 · กบค. บันทึกและส่งประวัติงานบำรุงรักษา', [
    ['ความคืบหน้ารายคัน (ยังไม่ครบ)', () => progressScreen('S15 ยังไม่ครบ', { done: 10 })],
    ['ครบทุกคัน — ประวัติงานบำรุงรักษา', () => historyScreen('S15 ครบทุกคัน', {})],
    ['ยืนยันส่งประวัติ', async () => { const s = await historyScreen('S15 ยืนยันส่ง', {}); await confirm(s, { title: 'ส่งประวัติให้หัวหน้า กบค. ตรวจสอบ', sub: 'ประวัติงานบำรุงรักษา ' + P[4] + ' คันของแผน ' + P[0] + ' จะแก้ไขไม่ได้จนกว่าหัวหน้าจะตรวจเสร็จ', ok: 'ส่งประวัติ' }); return s; }],
    ['ส่งแล้ว — รอหัวหน้าตรวจสอบ', async () => { const s = await historyScreen('S15 ส่งแล้ว', { sent: true }); notify(s, 'ส่งประวัติงานบำรุงรักษาให้หัวหน้าตรวจสอบแล้ว'); return s; }]]],
  ['S16 · หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา', [
    ['รายการประวัติรอตรวจสอบ', () => roleList('S16 รายการ', { title: 'ประวัติรอตรวจสอบ', search: 'ค้นหาเลขที่ MR, ชื่อแผน', cols: HQ_COLS, rows: hqRows('wait') })],
    ['ประวัติงานบำรุงรักษาของแผน', () => headHistory('S16 ประวัติของแผน', {})],
    ['ตีกลับ — ระบุเหตุผล', async () => { const s = await headHistory('S16 ตีกลับ', {}); await reason(s, 'ตีกลับประวัติงานบำรุงรักษา', 'เหตุผลที่ตีกลับ', 'ผลน้ำมันไฮโดรลิกของ 80-5738 น่าน ไม่ผ่าน ต้องระบุการแก้ไขก่อนบันทึกประวัติ', 'ตีกลับ'); return s; }],
    ['ยืนยันอนุมัติประวัติ', async () => { const s = await headHistory('S16 ยืนยันอนุมัติ', {}); await confirm(s, { title: 'ยืนยันอนุมัติประวัติงานบำรุงรักษา', sub: P[0] + ' · ' + P[4] + ' คัน · บันทึกเป็นประวัติทางการ', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติประวัติแล้ว', async () => { const s = await headHistory('S16 อนุมัติแล้ว', { st: 'ok' }); notify(s, 'อนุมัติประวัติงานบำรุงรักษาสำเร็จ'); return s; }]]],
  ['S17 · กบค. ออกรายงานผลและปิดงาน', [
    ['รายงานผล (ประวัติผ่านแล้ว)', () => reportScreen('S17 รายงานผล', {})],
    ['ยืนยันปิดงาน', async () => { const s = await reportScreen('S17 ยืนยันปิดงาน', {}); await confirm(s, { title: 'ยืนยันปิดงาน', sub: 'แผน ' + P[0] + ' จะเปลี่ยนสถานะเป็น "ปิดงานแล้ว" และแก้ไขข้อมูลไม่ได้อีก', ok: 'ปิดงาน' }); return s; }],
    ['ปิดงานแล้ว', async () => { const s = await reportScreen('S17 ปิดงานแล้ว', { closed: true }); notify(s, 'ปิดงานสำเร็จ'); return s; }]]],
  ['S18 · กบค. คำนวณต้นทุนการบำรุงรักษา', [
    ['ต้นทุนการบำรุงรักษา + Summary', () => costScreen('S18 ต้นทุน')],
    ['ดาวน์โหลด Excel แล้ว', async () => { const s = await costScreen('S18 ดาวน์โหลดแล้ว'); notify(s, 'ดาวน์โหลดไฟล์ Excel แล้ว'); return s; }]]],
  // S19 S20 ต่อท้าย ⇒ ตัวอักษรบล็อกของ scenario เดิมไม่ขยับ · ลำดับในเรื่องอยู่ที่ journey (build.json)
  ['S19 · กบค. แก้ไขแผนบำรุงรักษา แล้วส่งอนุมัติใหม่', [
    ['เมนู "…" → แก้ไข', async () => { const s = await listScreen('S19 เมนู', { rows: [planAs('returned')].concat(PLANS) }); planMenu(s, MENU); return s; }],
    ['รายละเอียดแผน — ส่งกลับแก้ไข', () => planDetail('S19 รายละเอียดแผน', { status: 'returned' })],
    ['ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้', () => planForm('S19 ฟอร์มแก้ไข', Object.assign({ alert: ALERT_RETURNED }, EDIT_FORM))],
    ['เอาภาค เขต หรือประเภทรถออก — ยืนยันเอารถที่จัดไว้ออก', async () => { const s = await planForm('S19 เอาเขตออก', EDIT_FORM); await confirm(s, AREA_CONFIRM); return s; }],
    ['“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น', async () => { const s = await planForm('S19 ยืนยันการออก', EDIT_FORM); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ยืนยัน' }); return s; }],
    ['ยืนยันการแก้ไขแผน', async () => { const s = await planForm('S19 ยืนยันการแก้ไข', EDIT_FORM); await confirm(s, EDIT_CONFIRM); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S19 บันทึกไม่สำเร็จ', EDIT_FORM); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — รออนุมัติ', async () => { const s = await listScreen('S19 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(PLANS) }); notify(s, 'บันทึกการแก้ไขแผนและส่งอนุมัติสำเร็จ'); return s; }],
    ['แผนอนุมัติแล้ว — เมนู "…" → แก้ไข', async () => { const s = await listScreen('S19 เมนูอนุมัติแล้ว', { rows: [planAs('approved')].concat(PLANS) }); planMenu(s, MENU.slice(0, 2)); return s; }],
    ['แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่', () => planForm('S19 ฟอร์มอนุมัติแล้ว', Object.assign({ alert: ALERT_APPROVED }, EDIT_FORM))],
    ['แผนดำเนินการแล้ว — เมนู "…" ดูรายละเอียดอย่างเดียว', async () => { const s = await listScreen('S19 เมนูดำเนินการ', { rows: PLANS }); planMenu(s, MENU.slice(0, 1)); return s; }]]],
  ['S20 · กบค. ลบแผนบำรุงรักษาที่ยังไม่อนุมัติ', [
    ['เมนู "…" → ลบ ในหน้า List', async () => { const s = await listScreen('S20 เมนู', { rows: [NEW_PLAN].concat(PLANS) }); planMenu(s, MENU); return s; }],
    ['ยืนยันการลบแผน ในหน้า List', async () => { const s = await listScreen('S20 ยืนยันการลบ List', { rows: [NEW_PLAN].concat(PLANS) }); await confirm(s, DELETE_CONFIRM); return s; }],
    ['ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)', async () => { const s = await listScreen('S20 ลบสำเร็จ', { rows: PLANS }); notify(s, 'ลบแผนบำรุงรักษาสำเร็จ'); return s; }],
    ['ปุ่ม “ลบแผน” ในหน้า Detail', () => planDetail('S20 ปุ่มลบแผน', {})],
    ['ยืนยันการลบแผน ในหน้า Detail', async () => { const s = await planDetail('S20 ยืนยันการลบ Detail', {}); await confirm(s, DELETE_CONFIRM); return s; }],
    ['แผนอนุมัติแล้ว — หน้ารายละเอียดไม่มีปุ่มลบ', () => planDetail('S20 อนุมัติแล้ว', { status: 'approved' })]]],
  ['S21 · กบค. กำหนดอะไหล่ของรถแต่ละคันในแผน', [
    ['อะไหล่ในไตรมาสบนฟอร์มสร้างแผน — ยังไม่มีรายการ', () => planForm('S21 ฟอร์มสร้างแผน', Object.assign({ values: FILLED, alloc: A_ALL, q: 1 }, R2))],
    ['หน้าอะไหล่ของรถ — ยังไม่เลือกอะไหล่', () => carPartsScreen('S21 อะไหล่ของรถ', {})],
    ['เลือกรถคันอื่น — รายการรถในไตรมาสเปิด', () => carPartsScreen('S21 เลือกรถ', { carOpen: true })],
    ['เลือกเปลี่ยนน้ำมัน — น้ำมันเข้ารายการอะไหล่', () => carPartsScreen('S21 เปลี่ยนน้ำมัน', { oil: 'change', picked: [0] })],
    ['เลือกอะไหล่จากคลัง — อะไหล่เข้ารายการของรถคันนี้', () => carPartsScreen('S21 เพิ่มอะไหล่', { oil: 'change', picked: CAR_ADD })],
    ['ระบุอะไหล่เพิ่มเติม — การ์ดรายการเพิ่มเติม (ว่าง)', () => carPartsScreen('S21 ระบุอะไหล่', { oil: 'change', picked: CAR_ADD, manual: {} })],
    ['ระบุอะไหล่เพิ่มเติม — กรอกครบ', () => carPartsScreen('S21 ระบุอะไหล่กรอกครบ', { oil: 'change', picked: CAR_ADD, manual: { filled: true } })],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await carPartsScreen('S21 ยืนยันการออก', { oil: 'change', picked: CAR_ADD, manual: { filled: true } }); await confirm(s, { title: 'ยืนยันการออก', sub: 'อะไหล่ที่แก้ไขไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' }); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await carPartsScreen('S21 บันทึกไม่สำเร็จ', { oil: 'change', picked: CAR_ADD, manual: { filled: true } }); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — กลับฟอร์มสร้างแผน', async () => { const s = await planForm('S21 บันทึกสำเร็จ', Object.assign({ values: FILLED, alloc: A_ALL, q: 1, picks: { 0: CAR_ADD }, manualCars: [0] }, R2)); notify(s, 'บันทึกอะไหล่ของรถ ' + CAND[0][0] + ' แล้ว'); return s; }]]],
  ['S22 · กบค. คลัง รับทราบรายการอะไหล่รายไตรมาส', [
    ['รายการแผนที่ต้องเตรียมอะไหล่', () => roleList('S22 แผนที่ต้องเตรียมอะไหล่', { title: 'แผนที่ต้องเตรียมอะไหล่', search: 'ค้นหาเลขที่ MR, ชื่อแผน', cols: WH_COLS, rows: [whRow(NP, 0, '31/10/2569'), whRow(PLANS[1], 1, '08/10/2569'), whRow(PLANS[0], 4, '06/10/2569')] })],
    ['อะไหล่ไตรมาส 1 — รอรับทราบ', () => warehouseScreen('S22 ไตรมาส 1', { q: 1 })],
    ['ยืนยันรับทราบไตรมาส 1', async () => { const s = await warehouseScreen('S22 ยืนยันรับทราบ', { q: 1 }); await confirm(s, { title: 'ยืนยันรับทราบรายการอะไหล่ไตรมาส 1', sub: NP[1] + ' · ' + whParts(1).length + ' รายการ · กบค. จะเห็นว่าคลังรับทราบไตรมาสนี้แล้ว', ok: 'รับทราบ' }); return s; }],
    ['รับทราบไตรมาส 1 แล้ว', async () => { const s = await warehouseScreen('S22 รับทราบแล้ว', { q: 1, acked: [1] }); notify(s, 'รับทราบรายการอะไหล่ไตรมาส 1 แล้ว'); return s; }],
    ['แท็บไตรมาส 2 — รอรับทราบ', () => warehouseScreen('S22 ไตรมาส 2', { q: 2, acked: [1] })],
    ['แท็บไตรมาส 4 — ไม่มีรถในไตรมาส', () => warehouseScreen('S22 ไตรมาส 4', { q: 4, acked: [1] })],
    ['ฝั่ง กบค. — รายการแผน คอลัมน์คลังรับทราบ', () => listScreen('S22 กบค. รายการแผน', { rows: [planAs('approved')].concat(PLANS) })],
    ['ฝั่ง กบค. — รายละเอียดแผน สถานะคลังรายไตรมาส', () => planDetail('S22 กบค. รายละเอียดแผน', { status: 'approved', wh: [1] })]]],
];


/* ---------- จอ ↔ กล่องในผัง userflow (เจ้าของงานสั่ง 22 ต.ค. 2569: userflow กับ wireframe อยู่ข้างกันตอน export) ----------
   ชื่อ state → id กล่องในผัง mermaid ของ Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md (คั่นด้วยช่องว่างได้หลายกล่อง)
   ไม่ใส่ = ผังยังไม่มีกล่องของจอนี้ ⇒ ปลั๊กอินเขียนบอกใต้ผัง "จอที่ยังไม่มีกล่องในผัง" (รอเติม userflow — ไม่เติมผังเอง) */
const FLOW_NODES = {
  S1: { 'รายการแผน': 'D1', 'ฟอร์มสร้างแผน (ว่าง)': 'D2', 'เลือกปีงบประมาณ — รายการปีเปิด': 'A2', 'เลือกภาค — รายการภาคเปิด': 'A3', 'เลือกเขต — เลือกได้หลายเขตของภาคที่เลือก': 'A7', 'ไม่มีรถในเขตและประเภทรถที่เลือก': 'D4', 'แท็บไตรมาส 1 — พิมพ์ค้นแล้วเลือกรถลงไตรมาส': 'D4 A5', 'แท็บไตรมาส 2 — รายการรถบอกไตรมาสที่จัดไว้': 'A4 D3', 'อะไหล่ในไตรมาส — ยืนยันเอาอะไหล่ออกจากทุกคัน': 'D3 A10', 'เอาภาค เขต หรือประเภทรถออก — ยืนยันเอารถที่จัดไว้ออก': 'A3', 'กดบันทึกโดยยังไม่ครบ': 'Q1', 'บันทึกและส่งอนุมัติสำเร็จ — รออนุมัติ': 'A6 D5' },
  S4: { 'อะไหล่ไตรมาส 1 — รอเบิก เทียบคงเหลือ Smart Inventory': 'D1', 'ยืนยันเบิก/จอง — สรุปรายการ': 'A2 D2', 'ผลเบิก/จอง — คงเหลือไม่พอ 2 รายการ': 'D3', 'เบิกครบแล้ว — ไปทำแผนเดินทางได้': 'D4 A3', 'Smart Inventory ขัดข้อง': 'D1', 'ไตรมาสนี้ยังไม่มีอะไหล่ในแผน': 'D1' },
  S6: { 'รถในไตรมาสและแผนเดินทาง (ยังไม่มีแผนเดินทาง)': 'D1', 'แผนเดินทาง 2 ใบ — รถครบทุกคันของไตรมาส': 'D1', 'ฟอร์มสร้างแผนเดินทาง (ว่าง)': 'D2', 'กดเพิ่มรถ — popup รถของไตรมาสที่ยังไม่อยู่ในแผนเดินทาง': 'D5', 'เพิ่มรถแล้ว — สถานที่ตั้งต้นสำนักงานที่รถอยู่': 'D4', 'แก้ไขเบอร์ติดต่อและสถานที่บำรุงรักษาของรถ': 'A5', 'เลือกช่วงวันเดินทาง': 'A3', 'กดยืนยันโดยยังไม่ครบ': 'Q1', 'กรอกครบ': 'A4', 'ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)': 'D3', 'สร้างแผนเดินทางใบถัดไป — popup ไม่แสดงรถที่อยู่ในแผนเดินทางแล้ว': 'D5', 'รถทุกคันของไตรมาสอยู่ในแผนเดินทางแล้ว': 'D6', 'แผนเดินทางถูกส่งกลับแก้ไข': 'D1', 'แก้ไขแผนเดินทางที่ถูกส่งกลับ': 'D2', 'ส่งอนุมัติใหม่แล้ว': 'D3' },
  S10: { 'หน้ารายละเอียดแผนเดินทาง — ยังไม่เริ่มงาน': 'D1', 'กดปุ่ม … ของรถ — ดูรายละเอียด แก้ไข ลบ': 'D1', 'เมนูแก้ไข — แก้ไขเบอร์ติดต่อและสถานที่': 'A6', 'เมนูลบ — ยืนยันเอารถออกจากแผนเดินทาง': 'A7', 'หน้างานรายคัน — ยังไม่เริ่ม': 'D2', 'กดเริ่มงาน — หน้ารับรถ (รายการรับรถ + ลงนาม)': 'A2', 'กดเซ็นลงนาม — ลงนามการรับมอบรถ': 'A2', 'ตรวจรายการและลงนามครบ — ยืนยันรับรถและเริ่มงาน': 'A2', 'เริ่มงานแล้ว — อยู่ระหว่างบำรุงรักษา': 'D3', 'ปิดงาน — ฟอร์มผลงาน': 'A5', 'กดปิดงานโดยยังไม่ครบ': 'Q2', 'กรอกผลงานครบ': 'A5', 'ปิดงานสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง': 'D4', 'บำรุงรักษาไม่ได้ — ระบุสาเหตุ': 'A3', 'บำรุงรักษาไม่ได้ — ยังไม่ระบุสาเหตุ': 'A3', 'บำรุงรักษาไม่ได้ระหว่างบำรุงรักษา — อะไหล่ที่ใช้ไปแล้ว': 'A3', 'บันทึกบำรุงรักษาไม่ได้แล้ว — จบได้เลย ไม่ต้องส่งตรวจ': 'D4', 'ดูงานที่ปิดแล้ว — เสร็จสิ้น': 'D5' },
  S23: { 'รายละเอียดแผนเดินทาง สถานะงานรายคัน': 'D1', 'กดปุ่ม … ของรถ — ดูรายละเอียดอย่างเดียว': 'D1', 'หน้างานรายคัน ยังไม่เริ่ม — ไม่มีแก้ไข ลบ': 'D2', 'เริ่มงานแล้ว — อยู่ระหว่างบำรุงรักษา': 'D3', 'ปิดงานแล้ว ดำเนินการบำรุงรักษาแล้ว': 'D4', 'กดไอคอนแก้ไขอะไหล่ — แก้จำนวนที่ใช้จริง': 'A6', 'กดไอคอนลบอะไหล่ — ยืนยันเอาออก': 'A6', 'กดเพิ่มอะไหล่ — popup เพิ่มอะไหล่ที่ใช้จริง': 'A6', 'อัปโหลดภาพเพิ่ม — กำลังอัปโหลด (แถบความคืบหน้า)': 'D3', 'กดส่งตรวจงาน': 'A8', 'ส่งตรวจงานแล้ว รอตรวจรับ': 'D6', 'แจ้งบำรุงรักษาไม่ได้ (ยังไม่ส่ง)': 'D5', 'ถูกส่งกลับแก้ไข (คันที่ปิดงานไว้)': 'D8', 'ถูกส่งกลับแก้ไข (คันที่แจ้งบำรุงรักษาไม่ได้)': 'D8' },
  S12: { 'หน้าปิดงาน — เลือกเก็บตัวอย่าง ใส่ผลการทดสอบได้ (ถ้ามี)': 'A1', 'ปิดงานโดยยังไม่มีผล — ป้ายรอผลตรวจน้ำมัน': 'D1', 'กดปุ่ม … ของรถ — ดูรายละเอียด': 'A3', 'หน้างานรายคัน — ส่วนผลการทดสอบยังว่าง': 'D2', 'กดบันทึกโดยยังไม่เลือกผล': 'Q2', 'เลือกผล + แนบไฟล์ (ถ้ามี)': 'A4', 'บันทึกสำเร็จ — แสดงผลที่บันทึก แก้ได้ภายหลัง': 'D3', 'กลับหน้าแผนเดินทาง — ป้ายน้ำมันไม่ผ่าน': 'D4' },
  S15: { 'ความคืบหน้ารายคัน (ยังไม่ครบ)': 'D1', 'ครบทุกคัน — ประวัติงานบำรุงรักษา': 'D2', 'ยืนยันส่งประวัติ': 'A2', 'ส่งแล้ว — รอหัวหน้าตรวจสอบ': 'D3' },
  S17: { 'รายงานผล (ประวัติผ่านแล้ว)': 'D2', 'ยืนยันปิดงาน': 'Q1', 'ปิดงานแล้ว': 'D3' },
  S18: { 'ต้นทุนการบำรุงรักษา + Summary': 'D2 D3', 'ดาวน์โหลด Excel แล้ว': 'A3' },
  S19: { 'เมนู "…" → แก้ไข': 'A1', 'รายละเอียดแผน — ส่งกลับแก้ไข': 'A1', 'ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้': 'D3', 'เอาภาค เขต หรือประเภทรถออก — ยืนยันเอารถที่จัดไว้ออก': 'D4', '“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น': 'D5', 'ยืนยันการแก้ไขแผน': 'D6', 'บันทึกไม่สำเร็จ': 'D7', 'บันทึกสำเร็จ — รออนุมัติ': 'D8', 'แผนอนุมัติแล้ว — เมนู "…" → แก้ไข': 'A1', 'แผนอนุมัติแล้ว — ฟอร์มแก้ไข ต้องส่งอนุมัติใหม่': 'D3', 'แผนดำเนินการแล้ว — เมนู "…" ดูรายละเอียดอย่างเดียว': 'D2' },
  S22: { 'รายการแผนที่ต้องเตรียมอะไหล่': 'D1', 'อะไหล่ไตรมาส 1 — รอรับทราบ': 'D2', 'ยืนยันรับทราบไตรมาส 1': 'A3', 'รับทราบไตรมาส 1 แล้ว': 'D3', 'แท็บไตรมาส 2 — รอรับทราบ': 'A2', 'แท็บไตรมาส 4 — ไม่มีรถในไตรมาส': 'A2', 'ฝั่ง กบค. — รายการแผน คอลัมน์คลังรับทราบ': 'D5', 'ฝั่ง กบค. — รายละเอียดแผน สถานะคลังรายไตรมาส': 'D5' },
  S21: { 'อะไหล่ในไตรมาสบนฟอร์มสร้างแผน — ยังไม่มีรายการ': 'D1', 'หน้าอะไหล่ของรถ — ยังไม่เลือกอะไหล่': 'D2 D3', 'เลือกรถคันอื่น — รายการรถในไตรมาสเปิด': 'A2', 'เลือกเปลี่ยนน้ำมัน — น้ำมันเข้ารายการอะไหล่': 'A6', 'เลือกอะไหล่จากคลัง — อะไหล่เข้ารายการของรถคันนี้': 'A3 A4', 'ระบุอะไหล่เพิ่มเติม — การ์ดรายการเพิ่มเติม (ว่าง)': 'A7', 'ระบุอะไหล่เพิ่มเติม — กรอกครบ': 'A8', 'บันทึกไม่สำเร็จ': 'A5', 'บันทึกสำเร็จ — กลับฟอร์มสร้างแผน': 'D4' },
  S20: { 'เมนู "…" → ลบ ในหน้า List': 'A1', 'ยืนยันการลบแผน ในหน้า List': 'D3', 'ลบสำเร็จ (ลบที่ List หรือ Detail ก็กลับมานี่)': 'D4', 'ปุ่ม “ลบแผน” ในหน้า Detail': 'A2', 'ยืนยันการลบแผน ในหน้า Detail': 'D3', 'แผนอนุมัติแล้ว — หน้ารายละเอียดไม่มีปุ่มลบ': 'D2' },
  S2: { 'รายการแผนรออนุมัติ': 'D1', 'รายละเอียดแผน — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)': 'D2 A2', 'อนุมัติ — ยืนยันอนุมัติแผน': 'A5', 'อนุมัติแผนสำเร็จ': 'D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล': 'A3', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A4', 'ส่งกลับแล้ว': 'D3' },
  // S3 พักไว้ 30 ต.ค. 2569
  S7: { 'รายการแผนเดินทางรออนุมัติ': 'D1', 'รายละเอียดแผนเดินทาง — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)': 'D2 A2', 'อนุมัติ — ยืนยันอนุมัติแผนเดินทาง': 'A5', 'อนุมัติแผนเดินทางสำเร็จ': 'D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล': 'A3', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A4', 'ส่งกลับแล้ว': 'D3' },
  S9: { 'เลือกจ้างดำเนินการ — ช่องผู้รับจ้างขึ้น': 'D2', 'เลือกผู้รับจ้าง — รายชื่อผู้รับจ้างเปิด': 'A3', 'กดเพิ่มรถ — popup รถที่ยังไม่อยู่ในแผนเดินทาง': 'D5', 'แก้ไขเบอร์ติดต่อและสถานที่บำรุงรักษาของรถ': 'A5', 'กดยืนยันโดยยังไม่ครบ': 'Q1', 'กรอกครบ': 'A6', 'ยืนยันแล้ว — ส่งให้ผู้อนุมัติ (รออนุมัติ)': 'D3' },
  S8: { 'กรย. — มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)': 'D1', 'กรย. — เปิดแผงแจ้งเตือน': 'A1', 'กรย. — แผนเดินทาง ดูอย่างเดียว (รถทุกคันในใบ)': 'D2', 'หน่วยงานเจ้าของรถ — เปิดแผงแจ้งเตือน': 'A2', 'หน่วยงานเจ้าของรถ — แผนเดินทาง ดูอย่างเดียว (เฉพาะรถของหน่วยงาน)': 'D3' },
  S11: { 'หน้ารายละเอียดแผนเดินทาง — คันที่รอตรวจรับ': 'D1', 'หน้างานรายคัน รอตรวจรับ — ผลการพิจารณา อนุมัติ (ค่าเริ่มต้น)': 'D2 A2', 'คันที่แจ้งบำรุงรักษาไม่ได้ — สาเหตุและอะไหล่ส่งคืน': 'D2', 'อนุมัติ — ยืนยันอนุมัติงาน': 'A4', 'อนุมัติสำเร็จ — กลับหน้ารายละเอียดแผนเดินทาง': 'A6 D4', 'เลือกส่งกลับแก้ไข — ช่องเหตุผลขึ้น': 'A3', 'ส่งกลับแก้ไข — ยังไม่ระบุเหตุผล': 'A3', 'ส่งกลับแก้ไข — ยืนยันส่งกลับ': 'A3', 'ส่งกลับแล้ว': 'D3' },
  S13: { 'รายการรอตรวจสอบ': 'D1', 'ผลการตรวจบำรุงรถรายคัน': 'D2', 'คันที่บำรุงรักษาไม่ได้ — สาเหตุ': 'D2', 'ยืนยันยอมรับผล': 'A3', 'ยอมรับผลแล้ว': 'D3' },
  S14: { 'รายการ — ครบทุกคันแล้ว': 'D1', 'หลักฐานทั้งแผน — ยังไม่ประเมิน': 'D2', 'ประเมินความพึงพอใจแล้ว': 'A3', 'ยืนยันยอมรับผลทั้งแผน': 'A4', 'ยอมรับผลทั้งแผนแล้ว': 'D3' },
  S16: { 'รายการประวัติรอตรวจสอบ': 'D1', 'ประวัติงานบำรุงรักษาของแผน': 'D2', 'ตีกลับ — ระบุเหตุผล': 'A3', 'ยืนยันอนุมัติประวัติ': 'A4', 'อนุมัติประวัติแล้ว': 'D4' },
};

/* ---------- กลุ่ม = scenario (แพทเทิร์นเดียวกับ Overhaul — เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก · แถว Desktop แล้ว Mobile) ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
/* ตัวอักษรบล็อกผูกกับเลข scenario ตายตัว (2 พ.ย. 2569) — ตัด/รวม scenario แล้วบล็อกอื่นไม่เลื่อน ชื่อเฟรมที่ export ไปแล้วยังตรง · S5 รวมเข้า S4 ⇒ D เว้นว่าง */
const BLOCK_OF = ['S1', 'S2', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18', 'S19', 'S20', 'S21', 'S22', 'S23'];   // S23 ผู้รับจ้าง (4 พ.ย. 2569) = V ต่อท้าย ตัวอักษรเดิมไม่เลื่อน
const GROUPS = SCENARIOS.map(([title, screens], i) => {
  const tag0 = title.split(' · ')[0], code = BLOCK_OF.indexOf(tag0) >= 0 ? LETTERS[BLOCK_OF.indexOf(tag0)] : LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  const map = FLOW_NODES[tag] || {};
  return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens: screens.map(([label, fn]) => [label, fn, map[label] || '']) }] };
});

/* ---------- สร้าง (ปุ่มชุดเดียวกับ Overhaul 21 ต.ค. 2569: ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component) ----------
   เจ้าของงานสั่ง 22 ต.ค. 2569 "จะเอาลงในเพจ Maintainance ด้วยกันเลย" ⇒ ทุกปุ่มวางบนหน้า "Maintainance" (ไม่มีก็สร้าง) ต่อใต้ของเดิม · ใต้ของเดิมเกินขอบพื้นที่วางงานแล้ววางเหนือของเดิม (roomyPage) ไม่ลบ/ไม่ย้ายของที่มีอยู่
   แต่ละบล็อก scenario = ผัง userflow ซ้ายสุด + ป้าย Device + คอลัมน์จอ A.1 A.2 … (แถว Desktop แล้ว Mobile ตามที่เลือก) */
const PAGE_NAMES = ['Maintainance', 'Maintenance'];
const BLOCK_H = 7000;   // ความสูงที่เผื่อต่อ 1 บล็อก scenario ตอนเช็คว่าหน้าเหลือที่พอไหม
/* ย้ายบล็อกล่าสุดที่ล้นขอบ (หรือที่ค้างบนหน้า -2 จากปุ่มรุ่นก่อน) มาไว้เหนือของเดิมบนหน้า Maintainance ไม่ต้องสร้างใหม่ · ของเดิมที่เหลือไม่แตะ แค่รายงานจำนวน */
async function moveLatest() {
  const main = (await namedPage(PAGE_NAMES)).page, tag = PLUGIN.prefix + ' · ', scr = PLUGIN.prefix + ' / ';
  await figma.setCurrentPageAsync(main);
  const isBar = (n) => n.name.indexOf(tag) === 0 && /^[A-Z] /.test(n.name.slice(tag.length)) && n.name.indexOf(' userflow S') < 0;
  const spare = figma.root.children.filter(p => new RegExp('^' + PAGE_NAMES[0] + '-\\d+$', 'i').test(p.name.trim()));
  let src = main, nodes = [];
  for (const p of spare) { if (p.loadAsync) await p.loadAsync(); if (p.children.some(isBar)) { src = p; nodes = p.children.slice(); break; } }
  if (!nodes.length) { const last = main.children.filter(isBar).reduce((m, n) => Math.max(m, n.y), 0); if (last > CANVAS_MAX) nodes = main.children.filter(n => n.y >= last); }
  if (!nodes.length) { log('บล็อกล่าสุดบนหน้า "' + main.name.trim() + '" อยู่ในขอบพื้นที่วางงานอยู่แล้ว ไม่ต้องย้าย'); return; }
  const spot = fitOn(main, nodes);   // แบบเดียวกับตอนสร้าง: ใต้ของเดิม → ช่องว่างจากขอบบน → คอลัมน์ใหม่ทางขวา (4 พ.ย. 2569)
  if (!spot) { log('⚠ หน้านี้ไม่มีที่ว่างในขอบพื้นที่วางงานแล้ว — ย้ายไม่สำเร็จ ไม่มีอะไรเปลี่ยน'); return; }
  for (const n of nodes) { if (src !== main) main.appendChild(n); }
  shiftAll(nodes, spot);
  if (src !== main && !src.children.length) { log('ลบหน้าว่าง "' + src.name + '" แล้ว'); src.remove(); }
  const screens = nodes.filter(n => n.name.indexOf(scr) === 0);
  figma.currentPage.selection = screens.slice(0, 1);
  figma.viewport.scrollAndZoomIntoView(screens.slice(0, 6));
  log('✓ ย้ายบล็อกล่าสุด ' + screens.length + ' จอ (' + nodes.length + ' ชิ้น) มาไว้ในขอบพื้นที่วางงานบนหน้า "' + main.name.trim() + '" แล้ว (' + (spot.side ? 'คอลัมน์ใหม่ทางขวา x=' + Math.round(spot.x) + ', ' : '') + 'y=' + Math.round(spot.y) + ')');
  const left = main.children.filter(n => n.y > CANVAS_MAX && n.name.indexOf(scr) === 0).length;
  if (left) log('บนหน้านี้ยังมีจอชุดเก่าเกินขอบอีก ' + left + ' จอ ไม่ได้แตะ');
}
async function buildSet(SCEN, GRP, what, devices) {
  errors.length = 0;
  const t0 = Date.now();
  log('นำเข้า component จากไลบรารี + ยืมจาก flow งานซ่อมในไฟล์นี้…');
  await resolveAll();
  const borrowed = LOCAL_OPTIONAL.filter(n => has(n) && ['Device Type', 'Component 1', 'Header'].indexOf(n) < 0);
  log('component จาก flow งานซ่อมที่ใช้ได้: ' + (borrowed.length ? borrowed.join(' · ') : 'ไม่มี — ใช้แบบสำรองจากไลบรารีทุกจุด'));
  log(deviceSetInfo());
  log(USERFLOW ? 'ผัง userflow: ' + USERFLOW.src + ' (' + Object.keys(USERFLOW.scenarios).length + ' scenario ในไฟล์ · วางข้างจอเฉพาะ scenario ที่มีจอ)' : '⚠ ไม่มีผัง userflow ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่');
  log('นำเข้าเสร็จใน ' + Math.round((Date.now() - t0) / 1000) + ' วินาที · เริ่มสร้าง');
  /* 4 พ.ย. 2569 เจ้าของงาน "อยากให้ export ไปที่ Maintainance แทน" ⇒ สร้างบนหน้า Maintainance เสมอ (ใต้ของทั้งหมดก่อน) แล้ววัดขนาดจริงค่อยย้ายลงช่อง (fitOn)
     ไม่ใช้ roomyPage(BLOCK_H × จำนวนบล็อก) แบบเดิม เพราะทั้งชุดประเมินได้ 140,000 เกินขอบเสมอจึงไปหน้า -2 ทุกครั้ง · หน้า -2 เหลือไว้เฉพาะตอนหน้าเดิมไม่มีที่จริงๆ */
  const tp = await namedPage(PAGE_NAMES);
  let page = tp.page;
  if (page.loadAsync) await page.loadAsync();
  await figma.setCurrentPageAsync(page);
  const before = new Set(page.children);
  const TOTAL = SCEN.reduce((a, x) => a + x[1].length, 0);
  log(INDEX.has('Header') ? 'แถบรหัส flow: component Header ของทีมออกแบบ' : 'แถบรหัส flow: ไม่พบ component Header ในไฟล์ — วาดแถบธรรมดาสีเดียวกันแทน');
  const { made, flows } = await buildGrid(page, PLUGIN.prefix, GRP, before.size ? pageBottom(page) + 400 : 0, TOTAL * devices.length, { devices });
  const fresh = page.children.filter(n => !before.has(n));
  const fit = fresh.length ? fitOn(page, fresh) : { dx: 0, dy: 0, y: 0 };
  const hgt = fresh.length ? Math.round(Math.max(...fresh.map(n => n.y + n.height)) - Math.min(...fresh.map(n => n.y))) : 0;
  if (fit) {
    shiftAll(fresh, fit);
    log(tp.fallback ? '⚠ หาหน้า "Maintainance" ไม่เจอและสร้างหน้าใหม่ไม่ได้ (แพลนจำกัดจำนวนหน้า) — วางในหน้า "' + page.name + '" ไม่ลบอะไร'
      : tp.fresh ? 'ไม่พบหน้า "Maintainance" — สร้างหน้าใหม่ชื่อนี้แล้ววางลงไป'
      : !before.size ? 'วางบนหน้า "' + page.name.trim() + '" (หน้าว่าง)'
      : fit.side ? 'แนวตั้งของหน้า "' + page.name.trim() + '" ไม่พอสำหรับชุดนี้ (สูง ' + hgt + ') — วางเป็นคอลัมน์ใหม่ทางขวาของของเดิม (x=' + Math.round(fit.x) + ', y=' + Math.round(fit.y) + ') ของที่มีอยู่ไม่ถูกแตะ'
      : fit.y < pageTop({ children: [...before] }) ? 'ใต้ของเดิมเกินขอบพื้นที่วางงานของ Figma — วางในช่องว่างด้านบนของหน้า "' + page.name.trim() + '" (y=' + Math.round(fit.y) + ') ของที่มีอยู่ไม่ถูกแตะ'
      : 'วางบนหน้า "' + page.name.trim() + '" ต่อใต้ของเดิม (y=' + Math.round(fit.y) + ') — ของที่มีอยู่บนหน้านี้ไม่ถูกแตะ');
  } else {   // หน้าเดิมเต็มทั้งแนวตั้งและแนวนอน ⇒ ย้ายชุดนี้ไปหน้า <ชื่อ>-2 <ชื่อ>-3 … ที่ยังมีที่
    const re = new RegExp('^' + PAGE_NAMES[0] + '-(\\d+)$', 'i'), spare = figma.root.children.filter(p => re.test(p.name.trim()));
    let dest = null;
    for (const p of spare) { if (p.loadAsync) await p.loadAsync(); if (spotOn(p, hgt, 400)) { dest = p; break; } }
    if (!dest) { try { dest = figma.createPage(); dest.name = PAGE_NAMES[0] + '-' + (spare.reduce((m, p) => Math.max(m, +p.name.trim().match(re)[1]), 1) + 1); } catch (e) { dest = null; } }
    if (dest) {
      for (const n of fresh) dest.appendChild(n);
      shiftAll(fresh, fitOn(dest, fresh) || { dx: 0, dy: 0 });
      page = dest; await figma.setCurrentPageAsync(page);
      log('หน้า "' + tp.page.name.trim() + '" ไม่มีที่ว่างในขอบพื้นที่วางงานของ Figma แล้ว — ใช้หน้า "' + page.name + '" แทน');
    } else log('⚠ หน้าเดิมเกินขอบพื้นที่วางงานของ Figma และสร้างหน้าใหม่ไม่ได้ — จอชุดนี้อาจเลื่อนไปดูไม่ถึง');
  }
  let instances = 0, loose = 0;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') loose++;
  }
  figma.currentPage.selection = made.slice(0, 1);   // ของใหม่อยู่ล่างสุดของ Layers ⇒ เลือกจอแรกให้ Layers เลื่อนไปหา
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 6));
  log('');
  if (pageBottom(page) > CANVAS_MAX) log('หมายเหตุ: ชุดนี้ยาวเกินขอบพื้นที่วางงานของ Figma จอท้ายๆ อาจเลื่อนไปไม่ถึง — ใช้สร้างทีละ scenario แทน');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ผัง userflow ' + flows + ' ผัง · ' + GRP.length + ' บล็อก ' + what + ' (' + GRP.map(g => g.code).join(' ') + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓') + ' (ผัง userflow เป็นของวาดประกอบนอกจอ ไม่นับ)');
  log('component ที่ใช้ (' + USED.size + '): ' + [...USED].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่ต้องสลับเป็นฟอนต์สำรอง (component ใช้ฟอนต์ที่เครื่องไม่มี) ' + FONT_SWAPPED + ' จุด — ฟอนต์ ' + (FALLBACK_FONT ? FALLBACK_FONT.family + ' ' + FALLBACK_FONT.style : '-'));
  reportOversize();
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
async function build(o) { await buildSet(SCENARIOS, GROUPS, 'scenario', devOf(o)); }
async function buildDesktop() { await buildSet(SCENARIOS, GROUPS, 'scenario · desktop', [false]); }   // ปุ่มนี้ระบุอุปกรณ์เอง ไม่ใช้ตัวเลือกบนหน้าต่าง
async function buildMobile() { await buildSet(SCENARIOS, GROUPS, 'scenario · mobile', [true]); }
async function buildPick(o) {   // ติ๊กเฉพาะบาง scenario · รหัสตัวอักษรคงเดิม (A–I)
  const idx = (o.pick || []).map(Number).filter(i => i >= 0 && i < SCENARIOS.length);
  if (!idx.length) { log('ยังไม่ได้ติ๊ก scenario — ติ๊กอย่างน้อย 1 รายการแล้วกดอีกครั้ง'); return; }
  await buildSet(SCENARIOS.filter((_, i) => idx.indexOf(i) >= 0), GROUPS.filter((_, i) => idx.indexOf(i) >= 0), 'scenario ที่เลือก', devOf(o));
}

/* ---------- journey แนวขวาง (ปุ่มแยก · เจ้าของงานสั่ง 22 ต.ค. 2569 "ลงในเพจ maintainance แต่มีปุ่มแยกการ generate userflow") ----------
   18 scenario ต่อกันซ้าย → ขวา ตาม build.json "journey" · กล่องหน้าจอในผังติดป้ายรหัสจอ (A.1 …) และใส่ภาพย่อจากจอที่สร้างไว้บนหน้านี้แล้ว (ไม่มีจอ = กล่องเปล่า)
   วางต่อใต้ของเดิมบนหน้า "Maintainance" ไม่ลบ/ไม่ย้ายของที่มีอยู่ */
function journeyCodes(n) {
  const g = GROUPS.find(x => x.subs[0].tag === 'S' + n); if (!g) return null;
  const sub = g.subs[0], codes = {}, loose = [];
  sub.screens.forEach(([label, , ids], i) => { const c = sub.code + '.' + (i + 1); const list = String(ids || '').split(/\s+/).filter(Boolean); if (!list.length) loose.push(c + ' ' + label); list.forEach(id => { (codes[id] = codes[id] || []).push(c); }); });
  return { codes, loose };
}
async function buildJourneyAll() {
  errors.length = 0;
  const t0 = Date.now();
  if (!USERFLOW || !USERFLOW.journey) { log('✗ ไม่มีข้อมูล journey ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  log('เตรียม component (แถบ Header ของทีมออกแบบ)…');
  await resolveAll();
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H, 600); const page = tp.page, y = tp.y, before = new Set(page.children);
  await figma.setCurrentPageAsync(page);
  const screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0 && !/ · mobile$/.test(n.name));
  log('วางบนหน้า "' + page.name + '" ' + (tp.limit != null ? 'ในช่องว่างด้านบน ต่อลงมาจากชุดก่อน' : 'ต่อใต้ของเดิม') + ' (y=' + Math.round(y) + ') · จอ desktop บนหน้านี้ ' + screens.length + ' จอ (ใช้ทำภาพย่อ)');
  const frameFor = (code) => screens.find(f => f.name.indexOf(PLUGIN.prefix + ' / ' + code + ' · ') === 0) || null;   // ชุดล่าสุดอยู่บนสุดของแผง Layers
  const r = await buildJourney(page, PLUGIN.prefix, y, { codes: journeyCodes, frameFor });
  if (tp.limit != null) liftAbove(page, before, tp.limit);
  log('');
  log('journey: ผัง ' + r.made + ' scenario · ลูกศรเชื่อม ' + r.links + ' เส้น · ภาพย่อจอ ' + r.thumbs + '/' + r.slots + ' กล่อง' + (r.thumbs < r.slots ? ' (กล่องที่ไม่มีภาพ = ยังไม่มีจอนั้นบนหน้า — กดสร้าง Desktop ก่อนแล้วกดปุ่มนี้ใหม่)' : '') + ' · กว้าง ' + Math.round(r.w) + ' px');
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· สลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด');
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
  const first = page.children.find(n => n.name.indexOf(PLUGIN.prefix + ' · Journey') === 0); if (first) figma.viewport.scrollAndZoomIntoView([first]);
}

/* ---------- ลบลิงก์กดต่อจอออกจากหน้า (2 พ.ย. 2569 เจ้าของงาน "ที่กดแล้วไปหน้าต่อไป กินทรัพยากรเยอะ เอาออก") ----------
   ลบเฉพาะที่ปลั๊กอินเคยผูก: ON_CLICK ที่ไปจอ "MT / …" หรือ Back · interaction อื่นบน component (เช่น hover ของไลบรารี) และลิงก์ไปที่อื่นคงไว้ · flow starting point ของจอเหล่านี้ลบด้วย */
async function clearPrototype(page) {
  const P = PLUGIN.prefix + ' / ';
  const screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(P) === 0);
  if (!screens.length) { log('ไม่พบเฟรมจอ "' + P + '…" บนหน้า "' + page.name.trim() + '"'); return; }
  const ids = new Set(screens.map(f => f.id));
  const ours = (r) => r.trigger && r.trigger.type === 'ON_CLICK' && (r.actions || []).length > 0 && r.actions.every(a => a && (a.type === 'BACK' || (a.type === 'NODE' && ids.has(a.destinationId))));
  let links = 0, nodes = 0;
  for (const f of screens) for (const n of f.findAll(x => x.type === 'INSTANCE' && x.reactions && x.reactions.length)) {
    const keep = n.reactions.filter(r => !ours(r));
    if (keep.length === n.reactions.length) continue;
    try { const gone = n.reactions.length - keep.length; await n.setReactionsAsync(keep); links += gone; nodes++; } catch (e) { warn('ลบลิงก์ ' + f.name, e); }
  }
  const starts = page.flowStartingPoints || [], left = starts.filter(x => !ids.has(x.nodeId));
  page.flowStartingPoints = left;
  log('✓ ลบลิงก์กดต่อจอแล้ว ' + links + ' ลิงก์ บน ' + nodes + ' ชิ้น · flow starting point ' + (starts.length - left.length) + ' จุด · จาก ' + screens.length + ' จอ');
}

/* ---------- เลือกสร้างทีละส่วนหรือทั้งหมดบนหน้า Maintainance (30 ต.ค. 2569 เจ้าของงานเลือก "ทุกอย่างอยู่ใน Figma") ----------
   parts: desktop (userflow + จอ desktop) · mobile · journey · storymap · usecase — เรียงตามลำดับนี้ ต่อใต้ของเดิมทุกส่วน */
/* ตาราง scenario (เจ้าของงาน 2 พ.ย. 2569 "อยากให้ทำตาราง เขียนใน figma") — ช่วงงาน/ผู้ทำจากตารางภาพรวม (หัวข้อ 0) ของ userflow · บล็อก/จำนวนจอจาก GROUPS
   เรียงตามลำดับงานจริง · ท้ายตารางมีกลุ่ม scenario ที่ตัดออก · สถานะรีวิว = ที่ไล่กับเจ้าของงานแล้วในรอบ 2 พ.ย. */
const SCEN_SEQ = ['S1', 'S2', 'S19', 'S20', 'S21', 'S22', 'S4', 'S6', 'S9', 'S7', 'S8', 'S10', 'S23', 'S11', 'S12', 'S13', 'S14', 'S15', 'S16', 'S17', 'S18'];
const SCEN_REVIEW = { S1: 'ยึดเป็นแบบหลัก 2 พ.ย.', S2: 'รีวิวแล้ว 2 พ.ย.', S22: 'ใหม่ · รีวิวแล้ว 2 พ.ย.', S4: 'ใหม่ · รีวิวแล้ว 2 พ.ย.', S21: 'ปรับตาม S1 2 พ.ย.', S19: 'ปรับตาม S1 2 พ.ย.',
  S6: 'ปรับตามเจ้าของงาน 3 พ.ย. · รอรีวิวจอ', S7: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S8: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S9: 'ใหม่ 3 พ.ย. · รอรีวิวจอ', S10: 'แยกมุมผู้รับจ้างไป S23 4 พ.ย. · รอรีวิวจอ', S23: 'ใหม่ 4 พ.ย. · ปรับตามรีวิว (เพิ่ม แก้ไข ลบ อะไหล่ · ไฟล์)', S11: 'เขียนใหม่ 3 พ.ย. · รอรีวิวจอ', S12: 'ปรับตามรีวิว 4 พ.ย.', S18: 'ยังไม่ออกแบบ (เจ้าของงาน 4 พ.ย.)' };   // 4 พ.ย. 2569: ทำตามที่เจ้าของงานสั่งแล้ว แต่ยังไม่ได้ไล่จอด้วยกัน
const SCEN_UPDATED = '4 พ.ย. 2569';   // วันที่ข้อมูลในตาราง scenario ล่าสุด — แก้ SCEN_REVIEW แล้วเปลี่ยนวันนี้ด้วย (ขึ้นที่หัวตาราง)
const SCEN_CUT = [['S3', 'ผพจ. ออกเลขงานและจัดซื้ออะไหล่', 'ตัดออก 2 พ.ย.'], ['S5', 'กบค. เบิกอะไหล่ผ่านระบบจองอะไหล่', 'รวมเข้า S4 2 พ.ย.']];
const SCEN_COLS = [['scenario', 110], ['บล็อก', 90], ['ชื่อ', 600], ['ผู้ทำ', 300], ['จอ', 90], ['สถานะรีวิว', 260]];
function scenData() {
  const sec = DOCS.scenarios.sections.find(s => /^0\./.test(s.h)) || { rows: [] };
  const info = {}; sec.rows.forEach(r => { info[r[0]] = r; });   // # · scenario · ช่วงงาน · บทบาท · กล่องบนบอร์ด
  const rows = SCEN_SEQ.map(tag => { const g = GROUPS.find(x => x.subs[0].tag === tag), r = info[tag] || []; return [r[2] || '-', tag, g ? g.code : '-', r[1] || (g ? g.subs[0].title : ''), r[3] || '-', g ? String(g.subs[0].screens.length) : '0', SCEN_REVIEW[tag] || 'ยังไม่ได้รีวิวรอบนี้']; });
  return { head: ['ช่วงงาน', 'scenario', 'บล็อก', 'ชื่อ', 'ผู้ทำ', 'จอ', 'สถานะรีวิว'], rows: rows.concat(SCEN_CUT.map(([tag, t, st]) => ['ตัดออกแล้ว', tag, '-', t, '-', '0', st])) };
}
/* use case ตาม scenario (4 พ.ย. 2569 เจ้าของงาน "ทำเป็นตาราง usecase ให้ด้วยก็ดีว่า scen นี้มี usecase อะไรบ้าง") — กลุ่มละ scenario เรียงตาม SCEN_SEQ แบบตาราง scenario
   use case ที่ใช้ร่วมหลาย scenario (เช่น "S10 · S23") ขึ้นทุกกลุ่ม · ไม่อยู่ใน scenario ไหน รวมกลุ่มท้าย · scenario ที่ยังไม่มี use case แสดงแถว "ยังไม่มี use case" */
const UCS_COLS = [['รหัส', 130], ['บทบาท', 220], ['use case', 620], ['ผ่านเมื่อ', 480], ['สถานะใน flow', 160], ['หมายเหตุ', 340]];
function ucByScen() {
  const h = DOCS.usecase.head, U = (r, k) => r[h.indexOf(k)] || '', tags = (r) => U(r, 'scenario').split(/\s*·\s*/).filter(t => /^S\d+$/.test(t));
  const sec = DOCS.scenarios.sections.find(x => /^0\./.test(x.h)) || { rows: [] }, info = {}; sec.rows.forEach(r => { info[r[0]] = r; });
  const name = (t) => t + ' ' + ((info[t] || [])[1] || ((GROUPS.find(g => g.subs[0].tag === t) || { subs: [{ title: '' }] }).subs[0].title));
  const out = [], pick = (g, r) => [g, U(r, 'รหัส'), U(r, 'บทบาท'), U(r, 'use case'), U(r, 'ผ่านเมื่อ'), U(r, 'สถานะใน flow'), U(r, 'หมายเหตุ')];
  for (const t of SCEN_SEQ) { const mine = DOCS.usecase.rows.filter(r => tags(r).indexOf(t) >= 0); if (mine.length) mine.forEach(r => out.push(pick(name(t), r))); else out.push([name(t), '-', '-', 'ยังไม่มี use case', '', '', '']); }
  DOCS.usecase.rows.filter(r => !tags(r).length).forEach(r => out.push(pick('ยังไม่อยู่ใน scenario ไหน', r)));
  return { head: ['scenario', 'รหัส', 'บทบาท', 'use case', 'ผ่านเมื่อ', 'สถานะใน flow', 'หมายเหตุ'], rows: out };
}
const UC_COLS = [['รหัส', 130], ['scenario', 100], ['บทบาท', 200], ['use case', 460], ['ผ่านเมื่อ', 420], ['JO', 90], ['สถานะใน flow', 160], ['หมายเหตุ', 320]];
async function buildDocs(o) {
  const parts = (o.parts && o.parts.length) ? o.parts : ['storymap', 'usecase'];
  const devs = [parts.indexOf('desktop') >= 0 ? false : null, parts.indexOf('mobile') >= 0 ? true : null].filter(x => x !== null);
  log('สร้าง ' + parts.length + ' ส่วน: ' + parts.join(' · '));
  if (devs.length) await buildSet(SCENARIOS, GROUPS, 'scenario', devs);
  if (parts.indexOf('journey') >= 0) await buildJourneyAll();
  const docParts = parts.filter(p => p === 'storymap' || p === 'usecase' || p === 'scenarios' || p === 'ucscen');
  if (!docParts.length) return;
  if (!DOCS) { log('✗ ไม่มีข้อมูล story map / use case ฝังมา — รัน node figma-export/build-plugin.js maintainance-plugin ใหม่'); return; }
  const tp = await roomyPage(PAGE_NAMES, BLOCK_H); const page = tp.page;
  await figma.setCurrentPageAsync(page);
  const made = [];
  for (const k of docParts) {
    try {
      const f = k === 'storymap' ? await storyMapBoard(PLUGIN.prefix, DOCS.storymap)
        : k === 'ucscen' ? await tableBoard(PLUGIN.prefix, 'use case ตาม scenario', 'Use case ตาม scenario บำรุงรักษาตามวาระ · อัปเดต ' + SCEN_UPDATED, DOCS.usecase.src, ucByScen(), 'scenario', UCS_COLS)
        : k === 'scenarios' ? await tableBoard(PLUGIN.prefix, 'scenario', 'Scenario บำรุงรักษาตามวาระ · ' + SCEN_SEQ.length + ' scenario · อัปเดต ' + SCEN_UPDATED, DOCS.scenarios.src, scenData(), 'ช่วงงาน', SCEN_COLS)
        : await tableBoard(PLUGIN.prefix, 'use case', 'Use case บำรุงรักษาตามวาระ', DOCS.usecase.src, DOCS.usecase, 'ช่วงงาน', UC_COLS);
      putBelow(page, f); made.push(f);
      log('✓ ' + (k === 'storymap' ? 'user story mapping ' + DOCS.storymap.sections.length + ' ช่วงงาน' : k === 'scenarios' ? 'ตาราง scenario ' + scenData().rows.length + ' แถว' : k === 'ucscen' ? 'use case ตาม scenario ' + SCEN_SEQ.length + ' scenario' : 'use case ' + DOCS.usecase.rows.length + ' ข้อ') + ' (จาก ' + DOCS[k === 'ucscen' ? 'usecase' : k].src + ')');
    } catch (e) { warn(k, e); dropCreated(page); }
  }
  if (made.length) {   // 30 ต.ค. 2569 เจ้าของงาน "ไปสร้างอยู่ที่หน้าไหนหาไม่เจอ" ⇒ บอกชื่อหน้า + ตำแหน่ง แล้วเลือกกรอบให้ด้วย
    page.selection = made;
    figma.viewport.scrollAndZoomIntoView(made);
    log('→ อยู่บนหน้า "' + page.name.trim() + '"' + (tp.fresh ? ' (สร้างหน้าใหม่ เพราะไม่มีหน้าชื่อ Maintainance)' : '') + ' ล่างสุดของหน้า ' + made.map(f => '"' + f.name + '" (x ' + Math.round(f.x) + ', y ' + Math.round(f.y) + ')').join(' · ') + ' · เลือกไว้ให้แล้ว กด Shift+2 เพื่อซูมไปที่กรอบ หรือค้นชื่อใน Layers');
  }
}

figma.ui.onmessage = async (msg) => {
  try {
    const o = { devices: msg.devices, pick: msg.pick };
    if (msg.type === 'build') await build(o);
    if (msg.type === 'build-desktop') await buildDesktop();
    if (msg.type === 'build-mobile') await buildMobile();
    if (msg.type === 'build-pick') await buildPick(o);
    if (msg.type === 'build-journey') await buildJourneyAll();
    if (msg.type === 'export-shots') await exportShots('flow-maintainance');
    if (msg.type === 'move-latest') await moveLatest();
    if (msg.type === 'clear-proto') { const tp = await namedPage(PAGE_NAMES); await figma.setCurrentPageAsync(tp.page); await clearPrototype(tp.page); }
    if (msg.type === 'build-docs') await buildDocs({ parts: msg.parts });   // 30 ต.ค. 2569 ติ๊กเลือกส่วน / สร้างทั้งหมด   // 30 ต.ค. 2569 ส่งภาพจอบนหน้านี้ไป FigJam
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]), codes: GROUPS.map(g => g.code) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก"
