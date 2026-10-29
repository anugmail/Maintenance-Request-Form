/* ⚠ ไฟล์นี้ประกอบอัตโนมัติจาก plugin-lib/core.js + maintainance-plugin/screens.js + Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md ด้วย build-plugin.js — แก้ที่ต้นทางแล้วรัน  node figma-export/build-plugin.js maintainance-plugin  (2026-10-29) */

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
  if (base) { await text(base, 'Supporting text', (o.hint || 'PDF, JPG · สูงสุด 10 ไฟล์') + ' · ' + files.length + '/10 ไฟล์'); }
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
/* ช่องตาราง 1 ช่อง — ใช้ทั้งกับ Table cell ที่ซ้อนใน Table (รีวิว 19 ต.ค. 2569) และ mobile */
function fillCell(cell, v, style, alt) {
  const st = v && v.check != null ? 'Lead checkbox' : v && v.pill ? 'Badge' : v && (v.menu || v.icons) ? 'Action icons' : style || 'Text';
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
  } else setProps(cell, { Text: v == null ? '' : String(v), Supporting: false });
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
async function formModal(scr, o) {   // Modal Type=Form · แถวที่ 2 สลับเป็น Text area ด้วย property "Input 1 swap" ของ Card form row · o.ok / o.cancel = ชื่อปุ่ม (ค่าเริ่ม บันทึก / ยกเลิก · 22 ต.ค. 2569 ใช้กับ "ส่งกลับ" "ปฏิเสธ")
  if (MOB) { await sheet(scr, { title: o.title, content: o.fields.map(f => f.area ? area(f.label, f.value) : field(f.label, f.value)), ok: o.ok || 'บันทึก', cancel: o.cancel }); return; }
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
    if (b.name === 'Primary button') setProps(b, { Text: o.ok || 'บันทึก', 'Leading icon': false, 'Trailing icon': false });
    else if (b.name === 'Secondary button') setProps(b, { Text: o.cancel || 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
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
    setProps(it, { Text: items[i][0], 'Supporting text': items[i][1] || '', Avatar: false, 'Supporting 2': false, Supporting: !!items[i][1] });   // ไม่ส่งบรรทัดรอง = แถวเดียว (เลือกรถ: ทะเบียนอย่างเดียว · ยกจาก Overhaul R24)
  });
  const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = false;
  overlay(scr, l, 0, 0);
  if (anchor) { const sb = scr.absoluteBoundingBox, ab = anchor.absoluteBoundingBox; l.resize(ab.width, l.height); l.x = ab.x - sb.x; l.y = ab.y - sb.y + ab.height + 4; }
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
            const s = await fn(); stripDividers(s); await polish(s);
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
const USERFLOW = {"src":"Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md","scenarios":{"1":{"n":1,"title":"กบค. สร้างแผนบำรุงรักษา","w":836,"h":3796,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nบำรุงรักษา\nตามวาระ","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nแผนบำรุงรักษา","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด\nสร้างแผน","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nบำรุงรักษา","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ระบุ\nชื่อแผน\n+ ไตรมาส","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"เลือกภาค\n+ ประเภทรถ","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบแสดง\nรถที่เข้า\nเงื่อนไข","x":40,"y":2100,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A4","kind":"action","label":"ติ๊กเลือก/\nเอาออก\nรายคัน","x":120,"y":2480,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":120,"y":2720,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D3","kind":"display","label":"ระบบแสดง\nรายการอะไหล่\nที่ต้องใช้","x":40,"y":2960,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A5","kind":"action","label":"บันทึก\n+ ส่งให้ ผพจ.\nตรวจสอบ","x":120,"y":3340,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":152,"y":3612,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"A3","to":"D4","label":"","back":false,"pts":[[208,2036],[208,2100]]},{"from":"D4","to":"A4","label":"","back":false,"pts":[[208,2416],[208,2480]]},{"from":"A4","to":"Q1","label":"","back":false,"pts":[[208,2656],[208,2720]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[296,2808],[400,2808],[400,1398],[376,1398]]},{"from":"Q1","to":"D3","label":"Y","back":false,"pts":[[208,2896],[208,2960]]},{"from":"D3","to":"A5","label":"","back":false,"pts":[[208,3276],[208,3340]]},{"from":"A5","to":"E","label":"","back":false,"pts":[[208,3516],[208,3612]]}],"stickies":[{"node":"A3","text":"Q29 ❓ เลือกได้ทีละภาค หรือหลายภาคในแผนเดียว · ประเภทรถเลือกได้หลายประเภทไหม · ประเภทรถอ้างรายการจากทะเบียนรถ VMS+ ชุดไหน","x":476,"y":1860,"w":320},{"node":"D4","text":"Q30 ❓ รถที่เข้าเงื่อนไขติ๊กไว้ให้ทั้งหมดก่อน (เอาออกได้) หรือว่างให้เลือกเอง · รถสถานะรอยุบ/โอน ไม่แสดงตั้งแต่ตรงนี้ หรือแสดงแต่ติ๊กไม่ได้","x":476,"y":2100,"w":320},{"node":"D3","text":"Q2 ❓ รายการอะไหล่ที่ระบบคำนวณ ให้ กบค. แก้ได้ไหม หรือเป็น Display อย่างเดียว","x":476,"y":2960,"w":320}],"gap":16},"2":{"n":2,"title":"ผพจ. ตรวจสอบและอนุมัติแผนบำรุงรักษา","w":1280,"h":3316,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nแผนรอ\nตรวจสอบ","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการแผน\nรอตรวจสอบ","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายละเอียด\nแผน + รายการ\nอะไหล่","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ\nแผน","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"อนุมัติ ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ระบุเหตุผล\nแผนไม่ถูกต้อง","x":600,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ กบค.\nแก้ไข","x":520,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":632,"y":2822,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"ตรวจ/เตรียม\nอะไหล่สำหรับ\nไตรมาส","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A5","kind":"action","label":"กดอนุมัติ\nแผน","x":120,"y":2410,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบเปลี่ยน\nสถานะแผน\nอนุมัติแล้ว","x":40,"y":2720,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[296,1948],[688,1948],[688,2100]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[688,2276],[688,2340]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[688,2656],[688,2822]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A4","to":"A5","label":"","back":false,"pts":[[208,2276],[208,2410]]},{"from":"A5","to":"D4","label":"","back":false,"pts":[[208,2586],[208,2720]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[208,3036],[208,3132]]}],"stickies":[{"node":"A0","text":"Q1 ❓ ผพจ. ย่อจากอะไร เป็นหน่วยเดียวกับ \"ฝ่ายพัสดุ\" ที่ผังเดิมเรียกไหม","x":920,"y":380,"w":320},{"node":"A4","text":"Q3 ❓ \"ตรวจ/เตรียมอะไหล่เพื่อใช้ในไตรมาส\" ทำในระบบ (มีหน้าจอ) หรือนอกระบบ","x":920,"y":2100,"w":320}],"gap":16},"3":{"n":3,"title":"ผพจ. ออกเลขงานและจัดซื้ออะไหล่","w":1120,"h":3316,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า รายละเอียด\nแผน\n(อนุมัติแล้ว)","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด\nออกเลขงาน","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"ระบบออก\nเลขงาน\nของแผน","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ส่งรายการ\nอะไหล่ให้\nหัวหน้า ผพจ.","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"หน้า รายการ\nอะไหล่รอ\nหัวหน้าตรวจ","x":40,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"หัวหน้า ผพจ.\nตรวจสอบ\nรายการ","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"อนุมัติ ?","x":120,"y":2240,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A4","kind":"action","label":"ระบุเหตุผล\nอะไหล่\nไม่ถูกต้อง","x":520,"y":2480,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A5","kind":"action","label":"ทำเรื่อง\nคืนอะไหล่ ❓","x":520,"y":2790,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E1","kind":"end","label":"End","x":552,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A6","kind":"action","label":"ทำเรื่อง\nซื้ออะไหล่ ❓","x":120,"y":2480,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบบันทึก\nใบ PO","x":40,"y":2720,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"D3","to":"A3","label":"","back":false,"pts":[[208,1936],[208,2000]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"Q1","to":"A4","label":"N","back":false,"pts":[[296,2328],[608,2328],[608,2480]]},{"from":"A4","to":"A5","label":"","back":false,"pts":[[608,2656],[608,2790]]},{"from":"A5","to":"E1","label":"","back":false,"pts":[[608,2966],[608,3132]]},{"from":"Q1","to":"A6","label":"Y","back":false,"pts":[[208,2416],[208,2480]]},{"from":"A6","to":"D4","label":"","back":false,"pts":[[208,2656],[208,2720]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[208,3036],[208,3132]]}],"stickies":[{"node":"D2","text":"Q4 ❓ รูปแบบเลขงาน — เจ้าของงานบอกว่ามีเกณฑ์ของจริง ยังไม่ได้ส่ง","x":760,"y":1000,"w":320},{"node":"A5","text":"Q5 ❓ อะไหล่ไม่ถูกต้องแล้ว \"ทำเรื่องคืนอะไหล่\" คือคืนอะไร ยังไม่ได้ซื้อ — หรือหมายถึงแก้รายการแล้วส่งใหม่","x":760,"y":2790,"w":320},{"node":"A6","text":"Q6 ❓ ซื้ออะไหล่ \"ที่ไหน อย่างไร\" (คำถามบนบอร์ด) · ซื้อผ่าน Smart Inventory/SAP หรือบันทึกผลอย่างเดียว","x":760,"y":2480,"w":320}],"gap":16},"4":{"n":4,"title":"กบค. ตรวจสอบจำนวนรถปัจจุบันตามแผน","w":1536,"h":2176,"nodes":[{"id":"S","kind":"end","label":"start","x":212,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"เปิดแผน\nที่มีเลขงาน","x":180,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการรถ\nในแผน\nพร้อม / ไม่พร้อม","x":100,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"ตรวจสอบ\nสถานะรถ\nรายคัน","x":180,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"มีรถสถานะ\nรอยุบ/โอน ?","x":180,"y":1240,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A2","kind":"action","label":"นำรถออก\nจากแผน","x":180,"y":1480,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"จำนวนรถ\nตรงแผน ?","x":580,"y":1480,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ปรับจำนวน\nรถในแผน","x":900,"y":1720,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"ยืนยัน\nจำนวนรถ","x":580,"y":1720,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":612,"y":1992,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[268,284],[268,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[268,556],[268,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[268,936],[268,1000]]},{"from":"A1","to":"Q1","label":"","back":false,"pts":[[268,1176],[268,1240]]},{"from":"Q1","to":"A2","label":"Y","back":false,"pts":[[268,1416],[268,1480]]},{"from":"A2","to":"D1","label":"","back":true,"pts":[[180,1568],[76,1568],[76,778],[100,778]]},{"from":"Q1","to":"Q2","label":"N","back":false,"pts":[[356,1328],[668,1328],[668,1480]]},{"from":"Q2","to":"A3","label":"N","back":false,"pts":[[756,1568],[988,1568],[988,1720]]},{"from":"A3","to":"D1","label":"","back":true,"pts":[[1076,1808],[1100,1808],[1100,778],[436,778]]},{"from":"Q2","to":"A4","label":"Y","back":false,"pts":[[668,1656],[668,1720]]},{"from":"A4","to":"E","label":"","back":false,"pts":[[668,1896],[668,1992]]}],"stickies":[{"node":"D1","text":"Q7 ❓ \"พร้อม / ไม่พร้อม\" ใครเป็นคนตอบ และตอบจากหน้าไหน — ต้นแบบมีขั้นยืนยันรถให้หน่วยงานเจ้าของรถตอบ แต่บอร์ดนี้ไม่มีเลนตอบ","x":1176,"y":620,"w":320},{"node":"A2","text":"Q8 ❓ นำรถออกจากแผนหลังมีเลขงานแล้ว ต้องแจ้ง ผพจ. ให้ปรับรายการอะไหล่ไหม","x":1176,"y":1480,"w":320}],"gap":16},"5":{"n":5,"title":"กบค. ตรวจสอบและเบิกอะไหล่ผ่านระบบจองอะไหล่","w":1280,"h":2696,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า รายการ\nอะไหล่ที่ต้องใช้\nตามแผน","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"ตรวจสอบ\nยอดคงเหลือ","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด เบิก/จอง\nอะไหล่","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"ระบบจอง\nอะไหล่\n(ระบบภายนอก)","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"มีอะไหล่\nพร้อม ?","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D3","kind":"display","label":"แสดงรายการ\nที่ขาด\nรอจัดซื้อ S3","x":520,"y":1860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":632,"y":2272,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D4","kind":"display","label":"ระบบแสดง\nสถานะ\nอะไหล่พร้อม","x":40,"y":1860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q2","kind":"decision","label":"ว่าจ้าง ?","x":120,"y":2240,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E2","kind":"end","label":"ไป S6\nกบค. ทำแผน\nเดินทาง","x":632,"y":2512,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"E3","kind":"end","label":"ไป S7\nผู้รับจ้าง\nทำแผนเดินทาง","x":152,"y":2512,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A2","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"Q1","to":"D3","label":"N","back":false,"pts":[[296,1708],[688,1708],[688,1860]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[688,2176],[688,2272]]},{"from":"Q1","to":"D4","label":"Y","back":false,"pts":[[208,1796],[208,1860]]},{"from":"D4","to":"Q2","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"Q2","to":"E2","label":"N","back":false,"pts":[[208,2416],[208,2448],[688,2448],[688,2512]]},{"from":"Q2","to":"E3","label":"Y","back":false,"pts":[[208,2416],[208,2512]]}],"stickies":[{"node":"D2","text":"Q9 ❓ \"ระบบจองอะไหล่\" คือระบบไหน (Smart Inventory / App ขออะไหล่) เชื่อมกับ VMS+ ยังไง","x":920,"y":1240,"w":320},{"node":"Q2","text":"Q10 ❓ ตัดสินใจว่าจ้างต่อแผนทั้งใบ หรือต่อคัน/ต่อพื้นที่","x":920,"y":2240,"w":320}],"gap":16},"6":{"n":6,"title":"กบค. ทำแผนเดินทาง (ตรวจเอง)","w":836,"h":2936,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nเดินทาง\nของแผนนี้","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด สร้างแผน\nเดินทาง","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nเดินทาง","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"เลือกรถ\nสถานที่\nช่วงวันเดินทาง","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"ระบุพนักงาน\n2-3 คน\n+ ค่าใช้จ่าย","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A4","kind":"action","label":"ยืนยันการ\nสร้างแผน\nเดินทาง","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่ง\nNotification\nเจ้าของรถ + กรย.","x":40,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":2752,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[296,1948],[400,1948],[400,1158],[376,1158]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[208,2276],[208,2340]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[208,2656],[208,2752]]}],"stickies":[{"node":"A2","text":"Q11 ❓ \"สถานที่บำรุงรักษา\" คือจุดรวมงานเดียวกับที่ กรย. วางอะไหล่ไหม ใครกำหนดรายชื่อจุด","x":476,"y":1380,"w":320},{"node":"D3","text":"Q12 ❓ Notification ส่งช่องทางไหน (เลนหน่วยงานบอก e-mail + VMS+) และเจ้าของรถต้องตอบรับวันไหม","x":476,"y":2340,"w":320}],"gap":16},"7":{"n":7,"title":"ผู้รับจ้างทำแผนเดินทาง (ว่าจ้าง)","w":836,"h":3316,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"เข้าระบบ\nผู้รับจ้าง ❓","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า งานที่\nได้รับว่าจ้าง","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด สร้างแผน\nเดินทาง","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nเดินทาง","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"เลือกรถ\nสถานที่\nช่วงวันเดินทาง","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ยืนยันการ\nสร้างแผน\nเดินทาง","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่ง\nNotification\nเจ้าของรถ + กรย.","x":40,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D4","kind":"display","label":"ระบบส่งแผน\nให้ กบค.\nตรวจสอบ","x":40,"y":2720,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[296,1948],[400,1948],[400,1398],[376,1398]]},{"from":"Q1","to":"A3","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[208,2276],[208,2340]]},{"from":"D3","to":"D4","label":"","back":false,"pts":[[208,2656],[208,2720]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[208,3036],[208,3132]]}],"stickies":[{"node":"A0","text":"Q13 ❓ ผู้รับจ้างเข้า VMS+ ทางไหน มีบัญชีภายนอกไหม หรือ กบค. กรอกแทน","x":476,"y":380,"w":320},{"node":"D1","text":"Q14 ❓ \"ทำเรื่องซื้ออะไหล่\" ของผู้รับจ้าง (บอร์ด) ทำนอกระบบ หรือต้องบันทึกในระบบ","x":476,"y":620,"w":320}],"gap":16},"8":{"n":8,"title":"กบค. ตรวจสอบแผนเดินทางของผู้รับจ้าง","w":1280,"h":2936,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nแผนเดินทาง\nผู้รับจ้าง","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการแผน\nเดินทางจาก\nผู้รับจ้าง","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เลือกแท็บ\nรอตรวจสอบ","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"ดูรายละเอียด\nแผน","x":120,"y":1240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง","x":40,"y":1480,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"อนุมัติ ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ปฏิเสธ\n+ ระบุเหตุผล","x":600,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบแจ้ง\nผู้รับจ้าง\nย้ายไปแท็บปฏิเสธ","x":520,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":632,"y":2752,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"กดอนุมัติ","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบย้ายไป\nแท็บอนุมัติแล้ว\n+ แจ้ง กรย.","x":40,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":2752,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"A2","to":"D2","label":"","back":false,"pts":[[208,1416],[208,1480]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[296,1948],[688,1948],[688,2100]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[688,2276],[688,2340]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[688,2656],[688,2752]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A4","to":"D4","label":"","back":false,"pts":[[208,2276],[208,2340]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[208,2656],[208,2752]]}],"stickies":[{"node":"A3","text":"Q15 ❓ (บอร์ด) ผู้รับจ้างต้องเสนอแผนใหม่? มี limit การเสนอใหม่ไหม? ต้องบอกใครบ้าง? ใครต้องทำอะไรต่อบ้าง?","x":920,"y":2100,"w":320}],"gap":16},"9":{"n":9,"title":"กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน","w":1120,"h":2556,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ได้รับ\nNotification\nแผนเดินทาง","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D1","kind":"display","label":"หน้า แผนเดินทาง\nที่ต้องเตรียม\nอะไหล่","x":40,"y":760,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด รับทราบ\nแผน","x":120,"y":1140,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"ไปเอาอะไหล่\nก่อนวันเดินทาง\n(นอกระบบ)","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"มีอะไหล่\nพร้อม ?","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"แจ้ง กบค.\nอะไหล่\nไม่พร้อม ❓","x":520,"y":1860,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E1","kind":"end","label":"End","x":552,"y":2132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"เตรียมอะไหล่\nไว้ที่จุดกลาง/\nรวมงาน","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A5","kind":"action","label":"กด บันทึกว่า\nเตรียมแล้ว","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":152,"y":2372,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D0","to":"D1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,1076],[208,1140]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[296,1708],[608,1708],[608,1860]]},{"from":"A3","to":"E1","label":"","back":false,"pts":[[608,2036],[608,2132]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[208,1796],[208,1860]]},{"from":"A4","to":"A5","label":"","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A5","to":"E","label":"","back":false,"pts":[[208,2276],[208,2372]]}],"stickies":[{"node":"A3","text":"Q16 ❓ กรย. พบอะไหล่ไม่พร้อม ต้องแจ้งใคร ผ่านระบบไหม (บอร์ดมีทาง \"ไม่\" แต่ไม่มีปลายทาง)","x":760,"y":1860,"w":320}],"gap":16},"10":{"n":10,"title":"กบค./ผู้รับจ้าง บันทึกงานบำรุงรักษารายคัน","w":1192,"h":3996,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"ไปจุดรวมงาน\nรับอะไหล่\n(นอกระบบ)","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A1","kind":"action","label":"เดินทางไป\nหน้างาน\n(นอกระบบ)","x":120,"y":620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการรถ\nตามแผนเดินทาง","x":40,"y":860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"เลือกคัน","x":120,"y":1240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า บันทึกงาน\nบำรุงรักษา\nรายคัน","x":40,"y":1480,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษา\nได้ ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ระบุสาเหตุ\nที่บำรุงรักษา\nไม่ได้","x":520,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"บันทึก","x":520,"y":2340,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q3","kind":"decision","label":"มีคันอื่น\nในแผน ?","x":120,"y":3540,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A5","kind":"action","label":"อัปโหลดภาพ\nก่อนเริ่มงาน","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A6","kind":"action","label":"ตรวจ + บำรุง\n+ เก็บตัวอย่าง\nน้ำมันไฮโดรลิก","x":120,"y":2340,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A7","kind":"action","label":"บันทึกงาน\n+ อะไหล่\nที่ใช้จริง","x":120,"y":2580,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A8","kind":"action","label":"อัปโหลดภาพ\nตอนจบงาน","x":120,"y":2820,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"ระบุครบ ?","x":120,"y":3060,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A9","kind":"action","label":"บันทึก","x":120,"y":3300,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":152,"y":3812,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"A1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"A1","to":"D1","label":"","back":false,"pts":[[208,796],[208,860]]},{"from":"D1","to":"A2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"A2","to":"D2","label":"","back":false,"pts":[[208,1416],[208,1480]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[296,1948],[608,1948],[608,2100]]},{"from":"A3","to":"A4","label":"","back":false,"pts":[[608,2276],[608,2340]]},{"from":"A4","to":"Q3","label":"","back":false,"pts":[[608,2516],[608,3508],[208,3508],[208,3540]]},{"from":"Q1","to":"A5","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A5","to":"A6","label":"","back":false,"pts":[[208,2276],[208,2340]]},{"from":"A6","to":"A7","label":"","back":false,"pts":[[208,2516],[208,2580]]},{"from":"A7","to":"A8","label":"","back":false,"pts":[[208,2756],[208,2820]]},{"from":"A8","to":"Q2","label":"","back":false,"pts":[[208,2996],[208,3060]]},{"from":"Q2","to":"D2","label":"N","back":true,"pts":[[296,3148],[720,3148],[720,1638],[376,1638]]},{"from":"Q2","to":"A9","label":"Y","back":false,"pts":[[208,3236],[208,3300]]},{"from":"A9","to":"Q3","label":"","back":false,"pts":[[208,3476],[208,3540]]},{"from":"Q3","to":"D1","label":"Y","back":true,"pts":[[296,3628],[756,3628],[756,1018],[376,1018]]},{"from":"Q3","to":"E","label":"N","back":false,"pts":[[208,3716],[208,3812]]}],"stickies":[{"node":"A5","text":"Q17 ❓ (บอร์ด) ระบบต้อง stamp ระยะเวลาระหว่างที่ Upload ภาพก่อนเริ่มไปจนถึงตอนจบการบำรุงรักษาไหม?","x":832,"y":2100,"w":320},{"node":"A8","text":"Q18 ❓ (บอร์ด) ชั่วโมงเครื่องจักร — ภาพถ่ายหรือกรอกข้อมูล? · อะไหล่เก่า? · อะไหล่ใหม่ (ถ้าเหลือ?)","x":832,"y":2820,"w":320},{"node":"A3","text":"Q19 ❓ (บอร์ด) กรณีบำรุงรักษาไม่ได้ จำเป็นต้องใช้ form รูปแบบเดียวกันไหม? หากแยกกันจะต้องมี field อะไรบ้าง?","x":832,"y":2100,"w":320}],"gap":16},"11":{"n":11,"title":"กบค. ตรวจสอบงานจากผู้รับจ้างและรับคืนอะไหล่","w":1120,"h":3036,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า งานบำรุง\nรักษาที่ผู้รับจ้าง\nส่งมา","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดรายคัน","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายละเอียด\nงาน ภาพก่อน/หลัง\nอะไหล่ที่ใช้","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ตรวจสอบ\nผ่าน ?","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ส่งกลับให้\nผู้รับจ้าง\nแก้ไข ❓","x":520,"y":1860,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E1","kind":"end","label":"End","x":552,"y":2132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"รับคืนอะไหล่/\nน้ำมันที่\nไม่ได้ใช้","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"ใช้อะไหล่\nครบ ?","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A5","kind":"action","label":"ทำเรื่อง\nคืนอะไหล่\nเข้าคลัง","x":520,"y":2340,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A6","kind":"action","label":"บันทึกผล\nตรวจสอบ","x":120,"y":2580,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":152,"y":2852,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[296,1708],[608,1708],[608,1860]]},{"from":"A3","to":"E1","label":"","back":false,"pts":[[608,2036],[608,2132]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[208,1796],[208,1860]]},{"from":"A4","to":"Q2","label":"","back":false,"pts":[[208,2036],[208,2100]]},{"from":"Q2","to":"A5","label":"N","back":false,"pts":[[208,2276],[208,2308],[608,2308],[608,2340]]},{"from":"A5","to":"A6","label":"","back":false,"pts":[[520,2428],[208,2428],[208,2580]]},{"from":"Q2","to":"A6","label":"Y","back":false,"pts":[[208,2276],[208,2580]]},{"from":"A6","to":"E","label":"","back":false,"pts":[[208,2756],[208,2852]]}],"stickies":[{"node":"A3","text":"Q20 ❓ ตรวจสอบไม่ผ่าน ส่งกลับผู้รับจ้างยังไง (บอร์ดมีทาง \"ไม่\" แต่ไม่มีปลายทาง)","x":760,"y":1860,"w":320}],"gap":16},"12":{"n":12,"title":"กบค. บันทึกผลตรวจน้ำมันไฮโดรลิก","w":836,"h":2936,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"ตรวจการนำ\nไฟฟ้าน้ำมัน\n(นอกระบบ)","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า งาน\nบำรุงรักษา\nรายคัน","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด บันทึก\nผลตรวจน้ำมัน","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า บันทึกผล\nตรวจน้ำมัน\nไฮโดรลิก","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ระบุผล","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"บันทึก","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบแจ้งเตือน\nเจ้าของรถ\nผลตรวจน้ำมัน","x":40,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":2752,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[296,1948],[400,1948],[400,1398],[376,1398]]},{"from":"Q1","to":"A3","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[208,2276],[208,2340]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[208,2656],[208,2752]]}],"stickies":[{"node":"D2","text":"Q21 ❓ ผลตรวจเป็นค่าตัวเลข (เกณฑ์ผ่าน/ไม่ผ่านเท่าไหร่) หรือเลือก ผ่าน/ไม่ผ่าน · แนบใบผลแล็บไหม","x":476,"y":1240,"w":320}],"gap":16},"13":{"n":13,"title":"หน่วยงาน/เจ้าของรถ ยอมรับผลการตรวจบำรุงรถรายคัน","w":1120,"h":3316,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ได้รับแจ้งเตือน\ne-mail + VMS+\n(รายคัน)","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A0","kind":"action","label":"กดลิงก์/เมนู\nจากแจ้งเตือน","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nการตรวจบำรุงรถ\nที่รอตรวจสอบ","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดรายการ\nของคันนั้น","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายการ\nตรวจบำรุงรถ\nใบตรวจ 2 ใบ","x":40,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ดูใบตรวจ\n+ ภาพก่อน/หลัง","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กดยอมรับ\nผลการตรวจ\nบำรุงรถ","x":120,"y":2240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบบันทึก\nการยอมรับ\nรายคัน","x":40,"y":2480,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษาครบ\nทุกคันตามแผน ?","x":120,"y":2860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E1","kind":"end","label":"รอแจ้งเตือน\nคันถัดไป","x":552,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"E2","kind":"end","label":"ไป S14\nตรวจหลักฐาน\nทั้งแผน","x":152,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D0","to":"A0","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1936],[208,2000]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[208,2416],[208,2480]]},{"from":"D3","to":"Q1","label":"","back":false,"pts":[[208,2796],[208,2860]]},{"from":"Q1","to":"E1","label":"N","back":false,"pts":[[296,2948],[608,2948],[608,3132]]},{"from":"Q1","to":"E2","label":"Y","back":false,"pts":[[208,3036],[208,3132]]}],"stickies":[{"node":"D2","text":"Q19 ❓ (บอร์ด) กรณีที่ไม่สามารถบำรุงรักษาได้ จำเป็นต้องใช้ form รูปแบบเดียวกันไหม? หากแยกกันจะต้องมี field อะไรบ้าง?","x":760,"y":1620,"w":320},{"node":"A3","text":"Q23 ❓ ถ้าไม่ยอมรับผล ทำยังไง (บอร์ดมีแค่ปุ่มยอมรับ) · \"หน่วยงาน\" กับ \"เจ้าของรถ\" เป็นคนเดียวกันไหม","x":760,"y":2240,"w":320}],"gap":16},"14":{"n":14,"title":"หน่วยงาน/เจ้าของรถ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)","w":800,"h":3316,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ได้รับแจ้งเตือน\ne-mail + VMS+\n(ครบทุกคัน)","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A0","kind":"action","label":"กดลิงก์/เมนู\nจากแจ้งเตือน","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nการตรวจบำรุงรถ\nที่รอตรวจสอบ","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดรายการ\nของแผน","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า เอกสาร\nหลักฐานการตรวจ\nบำรุงรถทั้งแผน","x":40,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ\nเอกสาร\nหลักฐาน","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"ประเมิน\nความพึงพอใจ","x":120,"y":2240,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"กดยอมรับ\nผลการตรวจ\nบำรุงรถ","x":120,"y":2480,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบบันทึก\nการยอมรับ\n+ แจ้ง กบค.","x":40,"y":2720,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":3132,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D0","to":"A0","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1936],[208,2000]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[208,2176],[208,2240]]},{"from":"A3","to":"A4","label":"","back":false,"pts":[[208,2416],[208,2480]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[208,2656],[208,2720]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[208,3036],[208,3132]]}],"stickies":[{"node":"A3","text":"Q22 ❓ (บอร์ด) ประเมินความพึงพอใจ (ต้องทำทุกครั้ง?) · แบบประเมินมีข้อ/สเกลอะไร","x":440,"y":2240,"w":320},{"node":"A4","text":"Q28 ❓ การยอมรับ 2 รอบ (รายคัน S13 + ทั้งแผน S14) จำเป็นทั้งคู่ไหม หรือรอบเดียวพอ","x":440,"y":2480,"w":320}],"gap":16},"15":{"n":15,"title":"กบค. บันทึกและส่งประวัติงานบำรุงรักษา","w":1120,"h":2456,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\nความคืบหน้ารายคัน","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษาเสร็จ\nทั้งหมด ?","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E1","kind":"end","label":"กลับ S10\nทำคันที่เหลือ","x":552,"y":1102,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D2","kind":"display","label":"หน้า ประวัติงาน\nบำรุงรักษา\nทั้งหมด","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"ตรวจทาน\nประวัติ","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด ส่งประวัติ\nให้หัวหน้า\nตรวจสอบ","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบเปลี่ยน\nสถานะ\nรอหัวหน้าตรวจ","x":40,"y":1860,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":2272,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"Q1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"Q1","to":"E1","label":"N","back":false,"pts":[[296,848],[608,848],[608,1102]]},{"from":"Q1","to":"D2","label":"Y","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A1","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[208,2176],[208,2272]]}],"stickies":[{"node":"Q1","text":"Q24 ❓ คันที่ \"บำรุงรักษาไม่ได้\" (S10) นับว่าเสร็จไหม — ส่งประวัติได้ทั้งที่มีคันทำไม่ได้หรือเปล่า","x":760,"y":760,"w":320}],"gap":16},"16":{"n":16,"title":"หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา","w":920,"h":2936,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nประวัติรอ\nตรวจสอบ","x":120,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nประวัติรอ\nตรวจสอบ","x":40,"y":620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน","x":120,"y":1000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า ประวัติงาน\nบำรุงรักษา\nของแผน","x":40,"y":1240,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ผ่าน ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ตีกลับ\n+ ระบุเหตุผล","x":600,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ กบค.\nแก้ไข","x":520,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":632,"y":2752,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"กดอนุมัติ","x":120,"y":2100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบบันทึก\nประวัติ\nเป็นทางการ","x":40,"y":2340,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":2752,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[208,556],[208,620]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,1176],[208,1240]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[296,1948],[688,1948],[688,2100]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[688,2276],[688,2340]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[688,2656],[688,2752]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"A4","to":"D4","label":"","back":false,"pts":[[208,2276],[208,2340]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[208,2656],[208,2752]]}],"stickies":[],"gap":16},"17":{"n":17,"title":"กบค. ออกรายงานผลและปิดงาน","w":836,"h":2696,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\n(ประวัติผ่านแล้ว)","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด รายงานผล\nการบำรุงรักษา","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายงานผล\nการบำรุงรักษา","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ดาวน์โหลด\nรายงาน","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กด ปิดงาน","x":120,"y":1620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ยืนยัน\nปิดงาน ?","x":120,"y":1860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D3","kind":"display","label":"ระบบเปลี่ยน\nสถานะแผน\nปิดงานแล้ว","x":40,"y":2100,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":152,"y":2512,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[208,1796],[208,1860]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[296,1948],[400,1948],[400,1158],[376,1158]]},{"from":"Q1","to":"D3","label":"Y","back":false,"pts":[[208,2036],[208,2100]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[208,2416],[208,2512]]}],"stickies":[{"node":"D2","text":"Q25 ❓ รายงานผลมีหัวข้ออะไรบ้าง รูปแบบไฟล์ (PDF/Excel) — บอร์ดบอกแค่ \"Download ได้\"","x":476,"y":1000,"w":320}],"gap":16},"18":{"n":18,"title":"กบค. คำนวณต้นทุนการบำรุงรักษา","w":800,"h":2456,"nodes":[{"id":"S","kind":"end","label":"start","x":152,"y":172,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\n(ปิดงานแล้ว)","x":40,"y":380,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด คำนวณ\nต้นทุน","x":120,"y":760,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า ต้นทุน\nค่าแรง ที่พัก\nเดินทาง","x":40,"y":1000,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจทาน\nค่าใช้จ่าย","x":120,"y":1380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบแสดง\nSummary\nต้นทุน","x":40,"y":1620,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"ดาวน์โหลด\nExcel","x":120,"y":2000,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":152,"y":2272,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[208,284],[208,380]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[208,696],[208,760]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[208,936],[208,1000]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[208,1316],[208,1380]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[208,1556],[208,1620]]},{"from":"D3","to":"A3","label":"","back":false,"pts":[[208,1936],[208,2000]]},{"from":"A3","to":"E","label":"","back":false,"pts":[[208,2176],[208,2272]]}],"stickies":[{"node":"D2","text":"Q26 ❓ \"ค่าแรง\" ในต้นทุน กับ \"ค่าเบี้ยเลี้ยง\" ที่กรอกตอนทำแผนเดินทาง (S6) เป็นรายการเดียวกันไหม · ต้นทุนรวมค่าอะไหล่/ค่าจ้างผู้รับจ้างไหม","x":440,"y":1000,"w":320}],"gap":16}},"journey":{"_note":"journey แนวขวาง (เจ้าของงานสั่ง 22 ต.ค. 2569) — cols = ลำดับคอลัมน์ซ้าย→ขวา · row = scenario ที่อยู่แถว 2 (ทางแยก) · links = [จาก, ไป, ป้าย, 'back' = ย้อนกลับ] · แก้ลำดับ/จุดต่อที่นี่แล้วรัน node figma-export/build-plugin.js maintainance-plugin","title":"Journey : บำรุงรักษาตามวาระ — กบค. สร้างแผน → ผพจ. อนุมัติ/ออกเลขงาน → เบิกอะไหล่ → แผนเดินทาง (ตรวจเอง/ว่าจ้าง) → บำรุงรักษารายคัน → ตรวจรับ → ประวัติ/รายงาน → ต้นทุน","phases":[["เตรียมดำเนินการ",[1,2]],["ออกเลขงาน / เบิก จัดหาอะไหล่",[3,4,5]],["จ้างดำเนินการ",[6,7,8,9]],["ดำเนินการบำรุงรักษา",[10]],["ตรวจรับ",[11,12,13,14]],["จัดทำรายงานการบำรุงรักษา",[15,16,17]],["คำนวณต้นทุน",[18]]],"cols":[[1],[2],[3],[4],[5],[6,7],[8],[9],[10],[11],[12],[13],[14],[15],[16],[17],[18]],"row":{"7":1,"8":1,"11":1},"links":[[1,2,""],[2,1,"ส่งกลับแก้ไข","back"],[2,3,"อนุมัติ"],[3,4,""],[4,5,""],[5,6,"ตรวจเอง"],[5,7,"ว่าจ้าง"],[7,8,""],[8,7,"ปฏิเสธ","back"],[6,9,""],[8,9,"อนุมัติ"],[9,10,""],[10,11,"ว่าจ้าง"],[10,12,"ตรวจเอง"],[11,12,""],[12,13,""],[13,10,"ยังไม่ครบทุกคัน","back"],[13,14,"ครบทุกคัน"],[14,15,""],[15,16,""],[16,15,"ตีกลับ","back"],[16,17,"ผ่าน"],[17,18,""]],"scenarios":{"1":{"n":1,"title":"กบค. สร้างแผนบำรุงรักษา","w":3744,"h":680,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nบำรุงรักษา\nตามวาระ","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nแผนบำรุงรักษา","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด\nสร้างแผน","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nบำรุงรักษา","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ระบุ\nชื่อแผน\n+ ไตรมาส","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"เลือกภาค\n+ ประเภทรถ","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบแสดง\nรถที่เข้า\nเงื่อนไข","x":2040,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A4","kind":"action","label":"ติ๊กเลือก/\nเอาออก\nรายคัน","x":2440,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":2680,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D3","kind":"display","label":"ระบบแสดง\nรายการอะไหล่\nที่ต้องใช้","x":2920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A5","kind":"action","label":"บันทึก\n+ ส่งให้ ผพจ.\nตรวจสอบ","x":3320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":3592,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"A3","to":"D4","label":"","back":false,"pts":[[1976,298],[2040,298]]},{"from":"D4","to":"A4","label":"","back":false,"pts":[[2376,298],[2440,298]]},{"from":"A4","to":"Q1","label":"","back":false,"pts":[[2616,298],[2680,298]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[2768,386],[2768,480],[1328,480],[1328,456]]},{"from":"Q1","to":"D3","label":"Y","back":false,"pts":[[2856,298],[2920,298]]},{"from":"D3","to":"A5","label":"","back":false,"pts":[[3256,298],[3320,298]]},{"from":"A5","to":"E","label":"","back":false,"pts":[[3496,298],[3592,298]]}],"stickies":[{"node":"A3","text":"Q29 ❓ เลือกได้ทีละภาค หรือหลายภาคในแผนเดียว · ประเภทรถเลือกได้หลายประเภทไหม · ประเภทรถอ้างรายการจากทะเบียนรถ VMS+ ชุดไหน","x":1800,"y":520,"w":320},{"node":"D4","text":"Q30 ❓ รถที่เข้าเงื่อนไขติ๊กไว้ให้ทั้งหมดก่อน (เอาออกได้) หรือว่างให้เลือกเอง · รถสถานะรอยุบ/โอน ไม่แสดงตั้งแต่ตรงนี้ หรือแสดงแต่ติ๊กไม่ได้","x":2040,"y":520,"w":320},{"node":"D3","text":"Q2 ❓ รายการอะไหล่ที่ระบบคำนวณ ให้ กบค. แก้ได้ไหม หรือเป็น Display อย่างเดียว","x":2920,"y":520,"w":320}],"gap":16,"horizontal":true},"2":{"n":2,"title":"ผพจ. ตรวจสอบและอนุมัติแผนบำรุงรักษา","w":3264,"h":1116,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nแผนรอ\nตรวจสอบ","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการแผน\nรอตรวจสอบ","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายละเอียด\nแผน + รายการ\nอะไหล่","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ\nแผน","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"อนุมัติ ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ระบุเหตุผล\nแผนไม่ถูกต้อง","x":2040,"y":670,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ กบค.\nแก้ไข","x":2280,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":2792,"y":702,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"ตรวจ/เตรียม\nอะไหล่สำหรับ\nไตรมาส","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A5","kind":"action","label":"กดอนุมัติ\nแผน","x":2360,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบเปลี่ยน\nสถานะแผน\nอนุมัติแล้ว","x":2680,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":3112,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[1888,386],[1888,758],[2040,758]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[2216,758],[2280,758]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[2616,758],[2792,758]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A4","to":"A5","label":"","back":false,"pts":[[2216,298],[2360,298]]},{"from":"A5","to":"D4","label":"","back":false,"pts":[[2536,298],[2680,298]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[3016,298],[3112,298]]}],"stickies":[{"node":"A0","text":"Q1 ❓ ผพจ. ย่อจากอะไร เป็นหน่วยเดียวกับ \"ฝ่ายพัสดุ\" ที่ผังเดิมเรียกไหม","x":280,"y":956,"w":320},{"node":"A4","text":"Q3 ❓ \"ตรวจ/เตรียมอะไหล่เพื่อใช้ในไตรมาส\" ทำในระบบ (มีหน้าจอ) หรือนอกระบบ","x":2040,"y":956,"w":320}],"gap":16,"horizontal":true},"3":{"n":3,"title":"ผพจ. ออกเลขงานและจัดซื้ออะไหล่","w":3264,"h":976,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า รายละเอียด\nแผน\n(อนุมัติแล้ว)","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด\nออกเลขงาน","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"ระบบออก\nเลขงาน\nของแผน","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ส่งรายการ\nอะไหล่ให้\nหัวหน้า ผพจ.","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"หน้า รายการ\nอะไหล่รอ\nหัวหน้าตรวจ","x":1560,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"หัวหน้า ผพจ.\nตรวจสอบ\nรายการ","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"อนุมัติ ?","x":2200,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A4","kind":"action","label":"ระบุเหตุผล\nอะไหล่\nไม่ถูกต้อง","x":2440,"y":600,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A5","kind":"action","label":"ทำเรื่อง\nคืนอะไหล่ ❓","x":2760,"y":600,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E1","kind":"end","label":"End","x":3112,"y":632,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A6","kind":"action","label":"ทำเรื่อง\nซื้ออะไหล่ ❓","x":2440,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบบันทึก\nใบ PO","x":2680,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":3112,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"D3","to":"A3","label":"","back":false,"pts":[[1896,298],[1960,298]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"Q1","to":"A4","label":"N","back":false,"pts":[[2288,386],[2288,688],[2440,688]]},{"from":"A4","to":"A5","label":"","back":false,"pts":[[2616,688],[2760,688]]},{"from":"A5","to":"E1","label":"","back":false,"pts":[[2936,688],[3112,688]]},{"from":"Q1","to":"A6","label":"Y","back":false,"pts":[[2376,298],[2440,298]]},{"from":"A6","to":"D4","label":"","back":false,"pts":[[2616,298],[2680,298]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[3016,298],[3112,298]]}],"stickies":[{"node":"D2","text":"Q4 ❓ รูปแบบเลขงาน — เจ้าของงานบอกว่ามีเกณฑ์ของจริง ยังไม่ได้ส่ง","x":920,"y":816,"w":320},{"node":"A5","text":"Q5 ❓ อะไหล่ไม่ถูกต้องแล้ว \"ทำเรื่องคืนอะไหล่\" คือคืนอะไร ยังไม่ได้ซื้อ — หรือหมายถึงแก้รายการแล้วส่งใหม่","x":2760,"y":816,"w":320},{"node":"A6","text":"Q6 ❓ ซื้ออะไหล่ \"ที่ไหน อย่างไร\" (คำถามบนบอร์ด) · ซื้อผ่าน Smart Inventory/SAP หรือบันทึกผลอย่างเดียว","x":2440,"y":816,"w":320}],"gap":16,"horizontal":true},"4":{"n":4,"title":"กบค. ตรวจสอบจำนวนรถปัจจุบันตามแผน","w":2064,"h":1380,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":302,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"เปิดแผน\nที่มีเลขงาน","x":280,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการรถ\nในแผน\nพร้อม / ไม่พร้อม","x":520,"y":200,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"ตรวจสอบ\nสถานะรถ\nรายคัน","x":920,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"มีรถสถานะ\nรอยุบ/โอน ?","x":1160,"y":270,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A2","kind":"action","label":"นำรถออก\nจากแผน","x":1400,"y":270,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"จำนวนรถ\nตรงแผน ?","x":1400,"y":660,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ปรับจำนวน\nรถในแผน","x":1640,"y":980,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"ยืนยัน\nจำนวนรถ","x":1640,"y":660,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":1912,"y":692,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,358],[280,358]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,358],[520,358]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,358],[920,358]]},{"from":"A1","to":"Q1","label":"","back":false,"pts":[[1096,358],[1160,358]]},{"from":"Q1","to":"A2","label":"Y","back":false,"pts":[[1336,358],[1400,358]]},{"from":"A2","to":"D1","label":"","back":true,"pts":[[1488,270],[1488,176],[688,176],[688,200]]},{"from":"Q1","to":"Q2","label":"N","back":false,"pts":[[1248,446],[1248,748],[1400,748]]},{"from":"Q2","to":"A3","label":"N","back":false,"pts":[[1488,836],[1488,1068],[1640,1068]]},{"from":"A3","to":"D1","label":"","back":true,"pts":[[1728,1156],[1728,1180],[688,1180],[688,516]]},{"from":"Q2","to":"A4","label":"Y","back":false,"pts":[[1576,748],[1640,748]]},{"from":"A4","to":"E","label":"","back":false,"pts":[[1816,748],[1912,748]]}],"stickies":[{"node":"D1","text":"Q7 ❓ \"พร้อม / ไม่พร้อม\" ใครเป็นคนตอบ และตอบจากหน้าไหน — ต้นแบบมีขั้นยืนยันรถให้หน่วยงานเจ้าของรถตอบ แต่บอร์ดนี้ไม่มีเลนตอบ","x":520,"y":1220,"w":320},{"node":"A2","text":"Q8 ❓ นำรถออกจากแผนหลังมีเลขงานแล้ว ต้องแจ้ง ผพจ. ให้ปรับรายการอะไหล่ไหม","x":1400,"y":1220,"w":320}],"gap":16,"horizontal":true},"5":{"n":5,"title":"กบค. ตรวจสอบและเบิกอะไหล่ผ่านระบบจองอะไหล่","w":2624,"h":1116,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า รายการ\nอะไหล่ที่ต้องใช้\nตามแผน","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"ตรวจสอบ\nยอดคงเหลือ","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด เบิก/จอง\nอะไหล่","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"ระบบจอง\nอะไหล่\n(ระบบภายนอก)","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"มีอะไหล่\nพร้อม ?","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D3","kind":"display","label":"แสดงรายการ\nที่ขาด\nรอจัดซื้อ S3","x":1800,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":2232,"y":702,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D4","kind":"display","label":"ระบบแสดง\nสถานะ\nอะไหล่พร้อม","x":1800,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q2","kind":"decision","label":"ว่าจ้าง ?","x":2200,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E2","kind":"end","label":"ไป S6\nกบค. ทำแผน\nเดินทาง","x":2472,"y":702,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"E3","kind":"end","label":"ไป S7\nผู้รับจ้าง\nทำแผนเดินทาง","x":2472,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A2","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"Q1","to":"D3","label":"N","back":false,"pts":[[1648,386],[1648,758],[1800,758]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[2136,758],[2232,758]]},{"from":"Q1","to":"D4","label":"Y","back":false,"pts":[[1736,298],[1800,298]]},{"from":"D4","to":"Q2","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"Q2","to":"E2","label":"N","back":false,"pts":[[2376,298],[2408,298],[2408,758],[2472,758]]},{"from":"Q2","to":"E3","label":"Y","back":false,"pts":[[2376,298],[2472,298]]}],"stickies":[{"node":"D2","text":"Q9 ❓ \"ระบบจองอะไหล่\" คือระบบไหน (Smart Inventory / App ขออะไหล่) เชื่อมกับ VMS+ ยังไง","x":1160,"y":956,"w":320},{"node":"Q2","text":"Q10 ❓ ตัดสินใจว่าจ้างต่อแผนทั้งใบ หรือต่อคัน/ต่อพื้นที่","x":2200,"y":956,"w":320}],"gap":16,"horizontal":true},"6":{"n":6,"title":"กบค. ทำแผนเดินทาง (ตรวจเอง)","w":2864,"h":680,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nเดินทาง\nของแผนนี้","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด สร้างแผน\nเดินทาง","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nเดินทาง","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"เลือกรถ\nสถานที่\nช่วงวันเดินทาง","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"ระบุพนักงาน\n2-3 คน\n+ ค่าใช้จ่าย","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A4","kind":"action","label":"ยืนยันการ\nสร้างแผน\nเดินทาง","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่ง\nNotification\nเจ้าของรถ + กรย.","x":2280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2712,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[1888,386],[1888,480],[1088,480],[1088,456]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[2216,298],[2280,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[2616,298],[2712,298]]}],"stickies":[{"node":"A2","text":"Q11 ❓ \"สถานที่บำรุงรักษา\" คือจุดรวมงานเดียวกับที่ กรย. วางอะไหล่ไหม ใครกำหนดรายชื่อจุด","x":1320,"y":520,"w":320},{"node":"D3","text":"Q12 ❓ Notification ส่งช่องทางไหน (เลนหน่วยงานบอก e-mail + VMS+) และเจ้าของรถต้องตอบรับวันไหม","x":2280,"y":520,"w":320}],"gap":16,"horizontal":true},"7":{"n":7,"title":"ผู้รับจ้างทำแผนเดินทาง (ว่าจ้าง)","w":3264,"h":680,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"เข้าระบบ\nผู้รับจ้าง ❓","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า งานที่\nได้รับว่าจ้าง","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด สร้างแผน\nเดินทาง","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า สร้างแผน\nเดินทาง","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"เลือกรถ\nสถานที่\nช่วงวันเดินทาง","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ยืนยันการ\nสร้างแผน\nเดินทาง","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่ง\nNotification\nเจ้าของรถ + กรย.","x":2280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D4","kind":"display","label":"ระบบส่งแผน\nให้ กบค.\nตรวจสอบ","x":2680,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":3112,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[1888,386],[1888,480],[1328,480],[1328,456]]},{"from":"Q1","to":"A3","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[2216,298],[2280,298]]},{"from":"D3","to":"D4","label":"","back":false,"pts":[[2616,298],[2680,298]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[3016,298],[3112,298]]}],"stickies":[{"node":"A0","text":"Q13 ❓ ผู้รับจ้างเข้า VMS+ ทางไหน มีบัญชีภายนอกไหม หรือ กบค. กรอกแทน","x":280,"y":520,"w":320},{"node":"D1","text":"Q14 ❓ \"ทำเรื่องซื้ออะไหล่\" ของผู้รับจ้าง (บอร์ด) ทำนอกระบบ หรือต้องบันทึกในระบบ","x":520,"y":520,"w":320}],"gap":16,"horizontal":true},"8":{"n":8,"title":"กบค. ตรวจสอบแผนเดินทางของผู้รับจ้าง","w":2864,"h":1116,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nแผนเดินทาง\nผู้รับจ้าง","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการแผน\nเดินทางจาก\nผู้รับจ้าง","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เลือกแท็บ\nรอตรวจสอบ","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"ดูรายละเอียด\nแผน","x":1160,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายละเอียด\nแผนเดินทาง","x":1400,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"อนุมัติ ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ปฏิเสธ\n+ ระบุเหตุผล","x":2040,"y":670,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบแจ้ง\nผู้รับจ้าง\nย้ายไปแท็บปฏิเสธ","x":2280,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":2712,"y":702,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"กดอนุมัติ","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบย้ายไป\nแท็บอนุมัติแล้ว\n+ แจ้ง กรย.","x":2280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2712,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"A2","to":"D2","label":"","back":false,"pts":[[1336,298],[1400,298]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[1888,386],[1888,758],[2040,758]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[2216,758],[2280,758]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[2616,758],[2712,758]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A4","to":"D4","label":"","back":false,"pts":[[2216,298],[2280,298]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[2616,298],[2712,298]]}],"stickies":[{"node":"A3","text":"Q15 ❓ (บอร์ด) ผู้รับจ้างต้องเสนอแผนใหม่? มี limit การเสนอใหม่ไหม? ต้องบอกใครบ้าง? ใครต้องทำอะไรต่อบ้าง?","x":2040,"y":956,"w":320}],"gap":16,"horizontal":true},"9":{"n":9,"title":"กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน","w":2464,"h":976,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ได้รับ\nNotification\nแผนเดินทาง","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"D1","kind":"display","label":"หน้า แผนเดินทาง\nที่ต้องเตรียม\nอะไหล่","x":680,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด รับทราบ\nแผน","x":1080,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"ไปเอาอะไหล่\nก่อนวันเดินทาง\n(นอกระบบ)","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"มีอะไหล่\nพร้อม ?","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"แจ้ง กบค.\nอะไหล่\nไม่พร้อม ❓","x":1800,"y":600,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E1","kind":"end","label":"End","x":2072,"y":632,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"เตรียมอะไหล่\nไว้ที่จุดกลาง/\nรวมงาน","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A5","kind":"action","label":"กด บันทึกว่า\nเตรียมแล้ว","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":2312,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D0","to":"D1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[1016,298],[1080,298]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[1648,386],[1648,688],[1800,688]]},{"from":"A3","to":"E1","label":"","back":false,"pts":[[1976,688],[2072,688]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[1736,298],[1800,298]]},{"from":"A4","to":"A5","label":"","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A5","to":"E","label":"","back":false,"pts":[[2216,298],[2312,298]]}],"stickies":[{"node":"A3","text":"Q16 ❓ กรย. พบอะไหล่ไม่พร้อม ต้องแจ้งใคร ผ่านระบบไหม (บอร์ดมีทาง \"ไม่\" แต่ไม่มีปลายทาง)","x":1800,"y":816,"w":320}],"gap":16,"horizontal":true},"10":{"n":10,"title":"กบค./ผู้รับจ้าง บันทึกงานบำรุงรักษารายคัน","w":3904,"h":1036,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"ไปจุดรวมงาน\nรับอะไหล่\n(นอกระบบ)","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A1","kind":"action","label":"เดินทางไป\nหน้างาน\n(นอกระบบ)","x":520,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการรถ\nตามแผนเดินทาง","x":760,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"เลือกคัน","x":1160,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า บันทึกงาน\nบำรุงรักษา\nรายคัน","x":1400,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษา\nได้ ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ระบุสาเหตุ\nที่บำรุงรักษา\nไม่ได้","x":2040,"y":600,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"บันทึก","x":2280,"y":600,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q3","kind":"decision","label":"มีคันอื่น\nในแผน ?","x":3480,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A5","kind":"action","label":"อัปโหลดภาพ\nก่อนเริ่มงาน","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A6","kind":"action","label":"ตรวจ + บำรุง\n+ เก็บตัวอย่าง\nน้ำมันไฮโดรลิก","x":2280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A7","kind":"action","label":"บันทึกงาน\n+ อะไหล่\nที่ใช้จริง","x":2520,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A8","kind":"action","label":"อัปโหลดภาพ\nตอนจบงาน","x":2760,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"ระบุครบ ?","x":3000,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A9","kind":"action","label":"บันทึก","x":3240,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":3752,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"A1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"A1","to":"D1","label":"","back":false,"pts":[[696,298],[760,298]]},{"from":"D1","to":"A2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"A2","to":"D2","label":"","back":false,"pts":[[1336,298],[1400,298]]},{"from":"D2","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[1888,386],[1888,688],[2040,688]]},{"from":"A3","to":"A4","label":"","back":false,"pts":[[2216,688],[2280,688]]},{"from":"A4","to":"Q3","label":"","back":false,"pts":[[2456,688],[3448,688],[3448,298],[3480,298]]},{"from":"Q1","to":"A5","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A5","to":"A6","label":"","back":false,"pts":[[2216,298],[2280,298]]},{"from":"A6","to":"A7","label":"","back":false,"pts":[[2456,298],[2520,298]]},{"from":"A7","to":"A8","label":"","back":false,"pts":[[2696,298],[2760,298]]},{"from":"A8","to":"Q2","label":"","back":false,"pts":[[2936,298],[3000,298]]},{"from":"Q2","to":"D2","label":"N","back":true,"pts":[[3088,386],[3088,800],[1568,800],[1568,456]]},{"from":"Q2","to":"A9","label":"Y","back":false,"pts":[[3176,298],[3240,298]]},{"from":"A9","to":"Q3","label":"","back":false,"pts":[[3416,298],[3480,298]]},{"from":"Q3","to":"D1","label":"Y","back":true,"pts":[[3568,386],[3568,836],[928,836],[928,456]]},{"from":"Q3","to":"E","label":"N","back":false,"pts":[[3656,298],[3752,298]]}],"stickies":[{"node":"A5","text":"Q17 ❓ (บอร์ด) ระบบต้อง stamp ระยะเวลาระหว่างที่ Upload ภาพก่อนเริ่มไปจนถึงตอนจบการบำรุงรักษาไหม?","x":2040,"y":876,"w":320},{"node":"A8","text":"Q18 ❓ (บอร์ด) ชั่วโมงเครื่องจักร — ภาพถ่ายหรือกรอกข้อมูล? · อะไหล่เก่า? · อะไหล่ใหม่ (ถ้าเหลือ?)","x":2760,"y":876,"w":320},{"node":"A3","text":"Q19 ❓ (บอร์ด) กรณีบำรุงรักษาไม่ได้ จำเป็นต้องใช้ form รูปแบบเดียวกันไหม? หากแยกกันจะต้องมี field อะไรบ้าง?","x":2040,"y":876,"w":320}],"gap":16,"horizontal":true},"11":{"n":11,"title":"กบค. ตรวจสอบงานจากผู้รับจ้างและรับคืนอะไหล่","w":2944,"h":976,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า งานบำรุง\nรักษาที่ผู้รับจ้าง\nส่งมา","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดรายคัน","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายละเอียด\nงาน ภาพก่อน/หลัง\nอะไหล่ที่ใช้","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ตรวจสอบ\nผ่าน ?","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ส่งกลับให้\nผู้รับจ้าง\nแก้ไข ❓","x":1800,"y":600,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E1","kind":"end","label":"End","x":2072,"y":632,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"รับคืนอะไหล่/\nน้ำมันที่\nไม่ได้ใช้","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q2","kind":"decision","label":"ใช้อะไหล่\nครบ ?","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A5","kind":"action","label":"ทำเรื่อง\nคืนอะไหล่\nเข้าคลัง","x":2280,"y":600,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A6","kind":"action","label":"บันทึกผล\nตรวจสอบ","x":2520,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":2792,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[1648,386],[1648,688],[1800,688]]},{"from":"A3","to":"E1","label":"","back":false,"pts":[[1976,688],[2072,688]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[1736,298],[1800,298]]},{"from":"A4","to":"Q2","label":"","back":false,"pts":[[1976,298],[2040,298]]},{"from":"Q2","to":"A5","label":"N","back":false,"pts":[[2216,298],[2248,298],[2248,688],[2280,688]]},{"from":"A5","to":"A6","label":"","back":false,"pts":[[2368,600],[2368,298],[2520,298]]},{"from":"Q2","to":"A6","label":"Y","back":false,"pts":[[2216,298],[2520,298]]},{"from":"A6","to":"E","label":"","back":false,"pts":[[2696,298],[2792,298]]}],"stickies":[{"node":"A3","text":"Q20 ❓ ตรวจสอบไม่ผ่าน ส่งกลับผู้รับจ้างยังไง (บอร์ดมีทาง \"ไม่\" แต่ไม่มีปลายทาง)","x":1800,"y":816,"w":320}],"gap":16,"horizontal":true},"12":{"n":12,"title":"กบค. บันทึกผลตรวจน้ำมันไฮโดรลิก","w":2864,"h":680,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"ตรวจการนำ\nไฟฟ้าน้ำมัน\n(นอกระบบ)","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า งาน\nบำรุงรักษา\nรายคัน","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด บันทึก\nผลตรวจน้ำมัน","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า บันทึกผล\nตรวจน้ำมัน\nไฮโดรลิก","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ระบุผล","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ระบุครบ ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"บันทึก","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบแจ้งเตือน\nเจ้าของรถ\nผลตรวจน้ำมัน","x":2280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2712,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[1888,386],[1888,480],[1328,480],[1328,456]]},{"from":"Q1","to":"A3","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[2216,298],[2280,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[2616,298],[2712,298]]}],"stickies":[{"node":"D2","text":"Q21 ❓ ผลตรวจเป็นค่าตัวเลข (เกณฑ์ผ่าน/ไม่ผ่านเท่าไหร่) หรือเลือก ผ่าน/ไม่ผ่าน · แนบใบผลแล็บไหม","x":1160,"y":520,"w":320}],"gap":16,"horizontal":true},"13":{"n":13,"title":"หน่วยงาน/เจ้าของรถ ยอมรับผลการตรวจบำรุงรถรายคัน","w":3264,"h":944,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ได้รับแจ้งเตือน\ne-mail + VMS+\n(รายคัน)","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A0","kind":"action","label":"กดลิงก์/เมนู\nจากแจ้งเตือน","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nการตรวจบำรุงรถ\nที่รอตรวจสอบ","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดรายการ\nของคันนั้น","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายการ\nตรวจบำรุงรถ\nใบตรวจ 2 ใบ","x":1560,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ดูใบตรวจ\n+ ภาพก่อน/หลัง","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กดยอมรับ\nผลการตรวจ\nบำรุงรถ","x":2200,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบบันทึก\nการยอมรับ\nรายคัน","x":2440,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษาครบ\nทุกคันตามแผน ?","x":2840,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E1","kind":"end","label":"รอแจ้งเตือน\nคันถัดไป","x":3112,"y":632,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"E2","kind":"end","label":"ไป S14\nตรวจหลักฐาน\nทั้งแผน","x":3112,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D0","to":"A0","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1896,298],[1960,298]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[2376,298],[2440,298]]},{"from":"D3","to":"Q1","label":"","back":false,"pts":[[2776,298],[2840,298]]},{"from":"Q1","to":"E1","label":"N","back":false,"pts":[[2928,386],[2928,688],[3112,688]]},{"from":"Q1","to":"E2","label":"Y","back":false,"pts":[[3016,298],[3112,298]]}],"stickies":[{"node":"D2","text":"Q19 ❓ (บอร์ด) กรณีที่ไม่สามารถบำรุงรักษาได้ จำเป็นต้องใช้ form รูปแบบเดียวกันไหม? หากแยกกันจะต้องมี field อะไรบ้าง?","x":1560,"y":784,"w":320},{"node":"A3","text":"Q23 ❓ ถ้าไม่ยอมรับผล ทำยังไง (บอร์ดมีแค่ปุ่มยอมรับ) · \"หน่วยงาน\" กับ \"เจ้าของรถ\" เป็นคนเดียวกันไหม","x":2200,"y":784,"w":320}],"gap":16,"horizontal":true},"14":{"n":14,"title":"หน่วยงาน/เจ้าของรถ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)","w":3264,"h":656,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D0","kind":"display","label":"ได้รับแจ้งเตือน\ne-mail + VMS+\n(ครบทุกคัน)","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A0","kind":"action","label":"กดลิงก์/เมนู\nจากแจ้งเตือน","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nการตรวจบำรุงรถ\nที่รอตรวจสอบ","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดรายการ\nของแผน","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า เอกสาร\nหลักฐานการตรวจ\nบำรุงรถทั้งแผน","x":1560,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ\nเอกสาร\nหลักฐาน","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"ประเมิน\nความพึงพอใจ","x":2200,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A4","kind":"action","label":"กดยอมรับ\nผลการตรวจ\nบำรุงรถ","x":2440,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบบันทึก\nการยอมรับ\n+ แจ้ง กบค.","x":2680,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":3112,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D0","to":"A0","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1896,298],[1960,298]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[2136,298],[2200,298]]},{"from":"A3","to":"A4","label":"","back":false,"pts":[[2376,298],[2440,298]]},{"from":"A4","to":"D3","label":"","back":false,"pts":[[2616,298],[2680,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[3016,298],[3112,298]]}],"stickies":[{"node":"A3","text":"Q22 ❓ (บอร์ด) ประเมินความพึงพอใจ (ต้องทำทุกครั้ง?) · แบบประเมินมีข้อ/สเกลอะไร","x":2200,"y":496,"w":320},{"node":"A4","text":"Q28 ❓ การยอมรับ 2 รอบ (รายคัน S13 + ทั้งแผน S14) จำเป็นทั้งคู่ไหม หรือรอบเดียวพอ","x":2440,"y":496,"w":320}],"gap":16,"horizontal":true},"15":{"n":15,"title":"กบค. บันทึกและส่งประวัติงานบำรุงรักษา","w":2384,"h":944,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\nความคืบหน้ารายคัน","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"Q1","kind":"decision","label":"บำรุงรักษาเสร็จ\nทั้งหมด ?","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E1","kind":"end","label":"กลับ S10\nทำคันที่เหลือ","x":1032,"y":632,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D2","kind":"display","label":"หน้า ประวัติงาน\nบำรุงรักษา\nทั้งหมด","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"ตรวจทาน\nประวัติ","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"action","label":"กด ส่งประวัติ\nให้หัวหน้า\nตรวจสอบ","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบเปลี่ยน\nสถานะ\nรอหัวหน้าตรวจ","x":1800,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2232,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"Q1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"Q1","to":"E1","label":"N","back":false,"pts":[[768,386],[768,688],[1032,688]]},{"from":"Q1","to":"D2","label":"Y","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A1","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[2136,298],[2232,298]]}],"stickies":[{"node":"Q1","text":"Q24 ❓ คันที่ \"บำรุงรักษาไม่ได้\" (S10) นับว่าเสร็จไหม — ส่งประวัติได้ทั้งที่มีคันทำไม่ได้หรือเปล่า","x":680,"y":784,"w":320}],"gap":16,"horizontal":true},"16":{"n":16,"title":"หัวหน้า กบค. ตรวจสอบประวัติงานบำรุงรักษา","w":2864,"h":956,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A0","kind":"action","label":"กดเมนู\nประวัติรอ\nตรวจสอบ","x":280,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D1","kind":"display","label":"หน้า รายการ\nประวัติรอ\nตรวจสอบ","x":520,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"เปิดแผน","x":920,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า ประวัติงาน\nบำรุงรักษา\nของแผน","x":1160,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจสอบ","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ผ่าน ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"action","label":"ตีกลับ\n+ ระบุเหตุผล","x":2040,"y":670,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบส่งกลับ\nให้ กบค.\nแก้ไข","x":2280,"y":600,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E1","kind":"end","label":"End","x":2712,"y":702,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"action","label":"กดอนุมัติ","x":2040,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D4","kind":"display","label":"ระบบบันทึก\nประวัติ\nเป็นทางการ","x":2280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2712,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A0","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"A0","to":"D1","label":"","back":false,"pts":[[456,298],[520,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[1096,298],[1160,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"A3","label":"N","back":false,"pts":[[1888,386],[1888,758],[2040,758]]},{"from":"A3","to":"D3","label":"","back":false,"pts":[[2216,758],[2280,758]]},{"from":"D3","to":"E1","label":"","back":false,"pts":[[2616,758],[2712,758]]},{"from":"Q1","to":"A4","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"A4","to":"D4","label":"","back":false,"pts":[[2216,298],[2280,298]]},{"from":"D4","to":"E","label":"","back":false,"pts":[[2616,298],[2712,298]]}],"stickies":[],"gap":16,"horizontal":true},"17":{"n":17,"title":"กบค. ออกรายงานผลและปิดงาน","w":2624,"h":680,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\n(ประวัติผ่านแล้ว)","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด รายงานผล\nการบำรุงรักษา","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า รายงานผล\nการบำรุงรักษา","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ดาวน์โหลด\nรายงาน","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"action","label":"กด ปิดงาน","x":1560,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"ยืนยัน\nปิดงาน ?","x":1800,"y":210,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"D3","kind":"display","label":"ระบบเปลี่ยน\nสถานะแผน\nปิดงานแล้ว","x":2040,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"E","kind":"end","label":"End","x":2472,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[1736,298],[1800,298]]},{"from":"Q1","to":"D2","label":"N","back":true,"pts":[[1888,386],[1888,480],[1088,480],[1088,456]]},{"from":"Q1","to":"D3","label":"Y","back":false,"pts":[[1976,298],[2040,298]]},{"from":"D3","to":"E","label":"","back":false,"pts":[[2376,298],[2472,298]]}],"stickies":[{"node":"D2","text":"Q25 ❓ รายงานผลมีหัวข้ออะไรบ้าง รูปแบบไฟล์ (PDF/Excel) — บอร์ดบอกแค่ \"Download ได้\"","x":920,"y":520,"w":320}],"gap":16,"horizontal":true},"18":{"n":18,"title":"กบค. คำนวณต้นทุนการบำรุงรักษา","w":2384,"h":656,"nodes":[{"id":"S","kind":"end","label":"start","x":72,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"D1","kind":"display","label":"หน้า แผน\nบำรุงรักษา\n(ปิดงานแล้ว)","x":280,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A1","kind":"action","label":"กด คำนวณ\nต้นทุน","x":680,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D2","kind":"display","label":"หน้า ต้นทุน\nค่าแรง ที่พัก\nเดินทาง","x":920,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A2","kind":"action","label":"ตรวจทาน\nค่าใช้จ่าย","x":1320,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"D3","kind":"display","label":"ระบบแสดง\nSummary\nต้นทุน","x":1560,"y":140,"w":336,"h":316,"fill":{"r":0.7764706015586853,"g":0.9803921580314636,"b":0.9647058844566345},"stroke":{"r":0.3529411852359772,"g":0.8470588326454163,"b":0.800000011920929},"thumb":{"x":8,"y":8,"w":320,"h":228}},{"id":"A3","kind":"action","label":"ดาวน์โหลด\nExcel","x":1960,"y":210,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"End","x":2232,"y":242,"w":112,"h":112,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"D1","label":"","back":false,"pts":[[184,298],[280,298]]},{"from":"D1","to":"A1","label":"","back":false,"pts":[[616,298],[680,298]]},{"from":"A1","to":"D2","label":"","back":false,"pts":[[856,298],[920,298]]},{"from":"D2","to":"A2","label":"","back":false,"pts":[[1256,298],[1320,298]]},{"from":"A2","to":"D3","label":"","back":false,"pts":[[1496,298],[1560,298]]},{"from":"D3","to":"A3","label":"","back":false,"pts":[[1896,298],[1960,298]]},{"from":"A3","to":"E","label":"","back":false,"pts":[[2136,298],[2232,298]]}],"stickies":[{"node":"D2","text":"Q26 ❓ \"ค่าแรง\" ในต้นทุน กับ \"ค่าเบี้ยเลี้ยง\" ที่กรอกตอนทำแผนเดินทาง (S6) เป็นรายการเดียวกันไหม · ต้นทุนรวมค่าอะไหล่/ค่าจ้างผู้รับจ้างไหม","x":920,"y":496,"w":320}],"gap":16,"horizontal":true}}}};

/* ======================== maintainance-plugin/screens.js ======================== */
/* ============================================================================
   Maintain-D — บำรุงรักษาตามวาระ · จอตาม userflow ครบ 18 scenario จาก component จริง (รอบแรก 20 ต.ค. เส้นของ กบค. 9 scenario · รอบสอง 22 ต.ค. อีก 9 scenario ของ ผพจ. ผู้รับจ้าง กรย. หน่วยงาน หัวหน้า)
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

const PLUGIN = { prefix: 'MT', page: 'Maintainance', menu: 'บำรุงรักษาตามวาระ', searchHint: 'ค้นหาเลขงาน, ชื่อแผน' };

/* ---------- component ที่ใช้ — ขาดตัวไหนหยุด (ไลบรารี) · NESTED = ชิ้นซ้อนใน component อื่น · LOCAL_OPTIONAL = ของไฟล์ Maintain-D ไม่มีก็ใช้แบบสำรอง ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Table header',
  'Table pagination', 'Text input', 'Input dropdown', 'Text area', 'Number input', 'File upload', 'Input label', 'List with checkbox', 'Alert', 'Pill outline',
  'Primary button', 'Secondary button', 'Secondary danger button', 'Tertiary button', 'Dropdown list', 'Background overlay', 'Modal', 'Notification',
  'Empty state/Data empty', 'Radio text card', 'Images', 'Date picker', 'Checkbox with description',
  'add-24-300-round', 'filter_list-24-400-round', 'more_horiz-20-400-round', 'delete-24-300-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round',
  'cloud_upload-24-300-round', 'stylus-24-300-round',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header', 'Tabs'];
const NESTED = ['Nav button', 'Tab item', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Primary danger button',
  '_Content item base', '_File upload item base', 'List with checkbox item', 'List header item', 'Checkbox', 'Badge outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Radio button'];
const LOCAL_OPTIONAL = ['RepairFeedback', 'ReturnPart', 'PartRequestStepPanel', 'PartsInventoryPanel', 'RequestedPartsPanel', 'Spare Part Card Item', 'IncidentPhotoGallery', 'VehicleAndReporterInfo', 'SummaryRequestedParts',
  'Device Type', 'Component 1', 'Header'];   // Device Type = ป้าย Device/Desktop/Mobile ชุดเดียวกับ Overhaul (22 ต.ค. 2569 · Component 1 = ตัวสำรองชุดเก่า) · Header = แถบรหัส flow ของทีมออกแบบ (ไลบรารีอื่น หาจาก instance ในไฟล์)
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี (ดัมป์ 19 ต.ค. 2569) — ตัวที่ core ยังไม่มี */
/* รูปแบบบรรทัดต้องเหมือน KEYS ใน core ("ชื่อ": ["key", set]) — test harness อ่าน key ด้วย regex จากซอร์ส */
Object.assign(KEYS, {
  "Images": ["39fe2574c3dcfeebe3eded7a76fecbc04ee41ef7", true],
  "Radio text card": ["e4510738f989bb24dbfb70fe6acfbf5705dcd60b", true],
  "Radio button": ["b29b98831c56216e005bb1c403e3f833d5e0f1cf", true],
  "Checkbox with description": ["dfc323f6bb605f586c4928ecb08c77acfb241f53", false],
  "Rating": ["1d3c2e045977bc6b2b407cdd2c82eb43dc00325a", true],
  "Checkbox text card": ["a29fe414b23f6ac84089cc837b8f2ff06ac561a3", true]
});

/* ---------- ข้อมูลตัวอย่าง (ยกชื่อรถ/หน่วยงาน/จังหวัดจาก maintainance-yearly/mock-yearly.js — ค่าสมมติทั้งหมด) ---------- */
const PST = { review: ['รอ ผพจ. ตรวจสอบ', 'Warning'], returned: ['ส่งกลับแก้ไข', 'Error'], approved: ['อนุมัติแล้ว', 'Brand'], active: ['ดำเนินการ', 'Info'],
  hist: ['รอหัวหน้าตรวจสอบ', 'Warning'], passed: ['ประวัติผ่านแล้ว', 'Success'], closed: ['ปิดงานแล้ว', 'Gray'] };
/* 22 ต.ค. 2569 เจ้าของงาน: ไม่ทำเรื่องยื่นของบ/ทบทวนแผน · เริ่มที่สร้างแผน · เลือกรถตามภาค + ประเภทรถ ⇒ ตัดปีงบประมาณ · ช่องที่ 3 = ภาค · ช่องที่ 8 = ประเภทรถ */
const PLANS = [   // เลขงาน · ชื่อแผน · ภาค · ไตรมาส · จำนวนรถ · สถานะ · วันที่สร้าง · ประเภทรถ
  ['MT-2570-001', 'บำรุงรักษารถกระเช้า ภาค 1 ไตรมาส 1/2570', 'ภาค 1 (เหนือ)', 'Q1', '12', 'active', '03/10/2569', 'รถกระเช้า'],
  ['MT-2570-002', 'บำรุงรักษารถเครน ภาค 2 ไตรมาส 2/2570', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'Q2', '8', 'approved', '05/10/2569', 'รถเครน'],
  ['—', 'บำรุงรักษารถขุด ภาค 3 ไตรมาส 1/2570', 'ภาค 3 (กลาง)', 'Q1', '6', 'review', '17/10/2569', 'รถขุด'],
  ['—', 'บำรุงรักษารถกระเช้า ภาค 4 ไตรมาส 3/2570', 'ภาค 4 (ใต้)', 'Q3', '9', 'returned', '12/10/2569', 'รถกระเช้า'],
  ['MT-2569-011', 'บำรุงรักษารถกระเช้า ภาค 1 ไตรมาส 4/2569', 'ภาค 1 (เหนือ)', 'Q4', '10', 'closed', '02/06/2569', 'รถกระเช้า']];
const NEW_PLAN = ['—', 'บำรุงรักษารถกระเช้า ภาค 2 ไตรมาส 2/2570', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'Q2', '7', 'review', '20/10/2569', 'รถกระเช้า'];
const REGIONS = ['ภาค 1 (เหนือ)', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ภาค 3 (กลาง)', 'ภาค 4 (ใต้)'];
/* รถที่เข้าเงื่อนไข ภาค 2 + รถกระเช้า (ค่าสมมติ) — ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของรถ · สถานะรถ */
const CAND = [['82-6789 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok'], ['82-1145 ขอนแก่น', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 ขอนแก่น', 'ok'],
  ['82-3302 อุดรธานี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 อุดรธานี', 'ok'], ['82-4410 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น', 'ok'],
  ['83-1207 อุดรธานี', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟฉ.1 อุดรธานี', 'repair'], ['84-5521 นครราชสีมา', 'Hino FG + กระเช้า Tadano AT-146', 'กฟฉ.3 นครราชสีมา', 'ok'],
  ['85-0918 อุบลราชธานี', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟฉ.2 อุบลราชธานี', 'ok']];
const P = PLANS[0];
const PLAN_KV = [['ชื่อแผน', P[1]], ['ภาค', P[2]], ['ประเภทรถ', P[7]], ['ไตรมาส', P[3]], ['จำนวนรถ', P[4] + ' คัน'], ['เลขงาน', P[0]], ['ผู้สร้างแผน', 'นายวิชัย ทองดี (กบค.)'], ['วันที่สร้าง', P[6]], ['ผพจ. อนุมัติ', '08/10/2569']];
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
const VEH_KV = [['ทะเบียน', V[0]], ['ยี่ห้อ/รุ่น', V[1]], ['ประเภท', 'รถกระเช้า'], ['หน่วยงานเจ้าของรถ', V[2]], ['เลขไมล์สะสม', '182,400 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,120 ชม.'], ['แผน', P[0]], ['แผนเดินทาง', 'จุดรวมงาน กฟฉ.1 ขอนแก่น · 03–07/11/2569']];
const PSTAT = { ok: ['พร้อม', 'Success'], short: ['ขาด', 'Error'], reserved: ['จองแล้ว', 'Info'] };
const PARTS = [   // รายการ · รหัส · หมวด · จำนวนตามแผน · หน่วย · คงเหลือ · สถานะเมื่อจอง
  ['น้ำมันไฮโดรลิก ISO VG 46', 'OL-0011', 'น้ำมัน', '180', 'ลิตร', '420', 'ok'],
  ['ไส้กรองไฮโดรลิก', 'FL-0022', 'ไส้กรอง', '12', 'ชิ้น', '3', 'short'],
  ['ไส้กรองน้ำมันเครื่อง', 'FL-0031', 'ไส้กรอง', '12', 'ชิ้น', '40', 'ok'],
  ['น้ำมันเครื่อง 15W-40', 'OL-0046', 'น้ำมัน', '216', 'ลิตร', '600', 'ok'],
  ['จาระบีอเนกประสงค์', 'GR-0007', 'หล่อลื่น', '24', 'กก.', '10', 'short']];
/* อะไหล่แบบงานซ่อม (22 ต.ค. 2569 "ปรับอะไหล่ให้สอดคล้องกับงานซ่อม"): คลัง 2 แบบ Smart Inventory / คลังสำรอง · ราคาต่อหน่วย (ค่าสมมติ) ·
   จำนวนตามแผนเกินคงเหลือ = ซื้อเพิ่มส่วนต่าง + เลือกผู้จัดซื้อ · ผู้จัดซื้อในบำรุงรักษา = Smart Inventory หรือ ผพจ. (S3) แทน "กบค." ของงานซ่อม — รอเคาะ */
const WH = ['Smart Inventory', 'Smart Inventory', 'Smart Inventory', 'คลังสำรอง', 'คลังสำรอง'];
const PRICE = [120, 680, 250, 95, 180];
const BUYER = ['Smart Inventory', 'ผพจ.'];
const BUYER_OF = { 1: 0, 4: 1 };   // อะไหล่ที่ขาด → ผู้จัดซื้อที่เลือกไว้ (ไส้กรองไฮโดรลิก = Smart Inventory · จาระบี = ผพจ.)
const baht = (n) => n.toLocaleString('en-US') + ' บาท';
const shortOf = (i) => Math.max(0, +PARTS[i][3] - +PARTS[i][5]);
const TST = { sent: ['ส่งแจ้งแล้ว', 'Info'], done: ['ดำเนินการแล้ว', 'Success'] };
const TRIP = { place: 'จุดรวมงาน กฟฉ.1 ขอนแก่น', d1: '03/11/2569', d2: '07/11/2569', staff: ['นายวิชัย ทองดี', 'นางสาวกนกวรรณ ใจมั่น', 'นายสมชาย พูลสุข'], perDiem: '7,200', lodging: '9,600', travel: '4,850' };
const TRIPS = [[TRIP.place, TRIP.d1 + ' – ' + TRIP.d2, '6', 'กบค. (ตรวจเอง)', 'sent']];
const WORK = [   // รายการงาน · อะไหล่ · ตามแผน · ใช้จริง · หน่วย
  ['เปลี่ยนน้ำมันไฮโดรลิก', 'น้ำมันไฮโดรลิก ISO VG 46', '30', '30', 'ลิตร'],
  ['เปลี่ยนไส้กรองไฮโดรลิก', 'ไส้กรองไฮโดรลิก', '2', '2', 'ชิ้น'],
  ['เปลี่ยนน้ำมันเครื่องและไส้กรอง', 'น้ำมันเครื่อง 15W-40 · ไส้กรองน้ำมันเครื่อง', '36 · 2', '36 · 2', 'ลิตร · ชิ้น'],
  ['อัดจาระบีจุดหมุนบูม', 'จาระบีอเนกประสงค์', '4', '3', 'กก.']];
const BEFORE = ['รูปรถ + ทะเบียน', 'อะไหล่ใหม่'];
const AFTER = ['รูปรถ + ทะเบียน', 'อะไหล่เก่า', 'อะไหล่ใหม่ที่เหลือ', 'จุดที่บำรุงรักษา (อะไหล่ใหม่)'];
const WSTAT = { todo: ['ยังไม่ทำ', 'Gray'], done: ['ทำแล้ว', 'Success'], cannot: ['ทำไม่ได้', 'Error'] };
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
    const c = inst('Radio text card', { State: o.disabled ? 'Disabled' : 'Default', Selected: i === sel ? 'True' : 'False' }, { Text: t, Supporting: false });
    if (MOB) add(r, c, 'h'); else { r.appendChild(c); c.layoutGrow = 1; }
  });
  return col('Section', [await (o.label ? sectionLabel(title) : section(title)), r], 16);
}
/* เลือกรถหลายคัน (เจ้าของงานสั่ง 22 ต.ค. 2569 "ใช้แบบ Overhaul ช่องค้นหากับชิป") = แบบ R24 ของ Overhaul:
   Input dropdown ช่องเดียว "เลือกรถ" พิมพ์ค้นทะเบียน/จังหวัด → Dropdown list แถวละทะเบียน (คันที่เลือกแล้ว State=Selected) → รถที่เลือกเป็นชิป Badge outline with remove icon ใต้ช่อง
   ไม่ใช้ dual list แล้ว · ใช้ทั้ง desktop และ mobile (mobile ช่องเต็มแถว) · งานซ่อมเลือกรถคันเดียวด้วยช่องค้นทะเบียนแบบเดียวกัน (Dropdown/Search PEA with request) */
async function carPick(title, cands, sel, o) {
  o = o || {};
  const right = cands.filter((_, i) => sel.indexOf(i) >= 0);
  const f = dropdown('เลือกรถ', o.query || '', { placeholder: 'ค้นหาทะเบียน, จังหวัด', lead: 'search-24-300-round', state: o.open ? 'Focused' : undefined, error: o.error || '' });
  let chips = null;
  if (right.length) {
    chips = frame('Selected cars', 'HORIZONTAL', { gap: 8 });
    try { chips.layoutWrap = 'WRAP'; chips.counterAxisSpacing = 8; } catch (e) { /* ไฟล์เก่าไม่มี wrap */ }
    right.forEach(c => chips.appendChild(inst('Badge outline with remove icon', { Color: 'Brand' }, { Text: c[0] })));
  }
  const sec = col('Section', [await section(title, { badge: right.length || null }), MOB ? f : row('Row', [f, frame('Spacer', 'VERTICAL')]), chips], 16);
  const open = (scr) => {   // รายการที่ตรงคำค้น · คันที่เลือกแล้วติ๊ก Selected · แถวเดียวไม่มีบรรทัดรอง
    if (!o.open) return;
    const list = cands.map((c, i) => [c, i]).filter(([c]) => !o.query || c[0].indexOf(o.query) >= 0);
    comboAt(scr, f.findOne(n => n.name === 'Container') || f, list.map(([c, i]) => [c[0], '', sel.indexOf(i) >= 0]));
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
const partRow = (p, i, o) => [p[0], p[1], p[2], p[3], p[4], p[5], { pill: o && o.result ? PSTAT[o.result === 'short' ? p[6] : 'ok'] : o && o.picked && o.picked.indexOf(i) >= 0 ? PSTAT.reserved : [' ', 'Gray'] }];
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
      if (sh) { setProps(sh, { Title: 'อะไหล่ที่ต้องใช้ตามแผน', 'Supporting text': true, 'More actions': false, Badge: picked.length > 0, Actions: false }); await text(sh, 'Supporting text', 'ระบบคำนวณจากรถในแผน · เบิก/จองผ่านระบบจองอะไหล่'); const b = find(sh, 'Badge outline'); if (b && picked.length) setProps(b, { Text: String(picked.length) }); }
      const cards = req.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
      // แผงมีการ์ดรายการที่เลือกแค่ 3 ช่อง (instance เพิ่มลูกไม่ได้) ⇒ เรียงรายการที่ต้องจัดซื้อขึ้นก่อนให้เห็น · ตัวเลข Badge และยอดรวมนับทุกรายการ
      const order = picked.slice().sort((a, b) => (shortOf(b) > 0) - (shortOf(a) > 0));
      let k = 0;
      for (const c of cards) {
        const vp = (c.variantProperties || {})['อะไหล่'];
        if (vp === 'เพิ่มอะไหล่') { c.visible = false; continue; }
        const i = order[k++], part = PARTS[i];
        if (!part) { c.visible = false; continue; }
        const buy = o.result === 'ok' ? 0 : shortOf(i);   // อะไหล่พร้อมครบ = ของเข้าคลังแล้ว ไม่มีซื้อเพิ่ม
        const stock = o.result === 'ok' ? Math.max(+part[5], +part[3]) : part[5];
        setProps(c, { Suggestion: false, 'จัดซื้อเพิ่ม': buy > 0, 'เลือกผู้จัดซื้อ': buy > 0 });
        await fillPartCard(c, i, { stock, buy, qty: +part[3] });
        const num = find(c, 'Number input');
        if (num) setProps(num, { Number: part[3], Label: false, Optional: false, 'Info icon': false, Helper: buy > 0, 'Helper text': buy > 0 ? 'จำนวนที่เกินยอดในคลัง จะถูกตั้งเป็นรายการจัดซื้อให้อัตโนมัติ' : '' });
        if (buy > 0) {
          const il = find(c, 'Input label'); if (il) setProps(il, { Optional: false, 'Info icon': false, button: false });   // ป้าย "เลือกผู้จัดซื้ออะไหล่เพิ่ม" ไม่บังคับเลือก (มีค่าเริ่มต้น) · ไม่มีปุ่มข้างป้าย
          c.findAll(n => n.type === 'INSTANCE' && n.name === 'Radio text card').forEach((r, j) => setProps(r, { Text: BUYER[j] || '', Supporting: false, Selected: (BUYER_OF[i] || 0) === j ? 'True' : 'False' }));
        }
      }
      const addBtn = find(req, 'Secondary button'); if (addBtn) setProps(addBtn, { Text: 'ระบุอะไหล่เพิ่มเติม' });
      // กล่องรวมค่าอะไหล่ท้ายแผง (แบบงานซ่อม): เบิกจากคลัง · ต้องจัดซื้อ · รวมทั้งหมด — คิดจากทุกรายการที่เลือก
      const cost = find(req, 'Cost Container');
      if (cost && picked.length) {
        let take = 0, buyAmt = 0;
        picked.forEach(i => { const q = +PARTS[i][3], st = o.result === 'ok' ? q : Math.min(q, +PARTS[i][5]); take += st * PRICE[i]; buyAmt += (q - st) * PRICE[i]; });
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
  return col('Section', [await section('รายการอะไหล่ที่ต้องใช้ตามแผน', { badge: PARTS.length }), await tbl(PART_COLS, PARTS.map((p, i) => partRow(p, i, o)))], 16);
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
      const pairs = [['แผน', P[1]], ['เลขงาน', P[0]], ['ไตรมาส', P[3]], ['จำนวนรถ', P[4] + ' คัน']];
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
const PLAN_COLS = [['เลขงาน', 130, 'Lead text', 'Down'], ['ชื่อแผน', 0, 'Text', 'Swap'], ['ภาค', 200], ['ประเภทรถ', 120], ['ไตรมาส', 90], ['จำนวนรถ', 100], ['สถานะ', 180, 'Badge', 'Swap'], ['', 60]];   // 22 ต.ค.: ตัดปีงบประมาณ · เพิ่มภาค/ประเภทรถ · วันที่สร้างอยู่หน้ารายละเอียด (Table 8 คอลัมน์)
const planRow = (p) => [p[0], p[1], p[2], p[7], p[3], p[4], { pill: PST[p[5]] }, { menu: 1 }];
async function listScreen(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'บำรุงรักษาตามวาระ', primary: 'สร้างแผน' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tableHeader(o), 'h');
  add(sec, await tbl(PLAN_COLS, (o.rows || PLANS).map(planRow), { pagination: (o.rows || PLANS).length }), 'h');
  return scr;
}
const CARS = VEH.map(v => [v[0], v[1], v[2]]);
/* ฟอร์มสร้างแผน (ปรับ 22 ต.ค. 2569 — เจ้าของงาน "ใส่ชื่อแผน เลือกรถ โดยเลือกรถจะแยกเป็นเลือกตามภาค ตามประเภทรถ แทน"):
   ข้อมูลแผน = ชื่อแผน + ไตรมาส · เลือกรถ = Input dropdown ภาค + ประเภทรถ → Table รถที่เข้าเงื่อนไข (Lead checkbox รายคัน) · ไม่มีปีงบประมาณ/เกณฑ์ทรัค-เนต/ช่องค้นทะเบียน
   o.region / o.type = ค่าที่เลือก · o.ticked = ลำดับรถใน CAND ที่ติ๊ก · o.regionOpen = รายการภาคเปิด */
async function planForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const { scr, page } = await shell(name, { title: 'สร้างแผนบำรุงรักษา', back: true, crumbs: ['สร้างแผน'] });
  const shown = o.region && o.type ? CAND : [], ticked = o.ticked || [];
  const reg = dropdown('ภาค', o.region || '', { placeholder: 'เลือกภาค', error: E('กรุณาเลือกภาค'), state: o.regionOpen ? 'Focused' : undefined });
  const typ = dropdown('ประเภทรถ', o.type || '', { placeholder: 'เลือกประเภทรถ', error: E('กรุณาเลือกประเภทรถ') });
  const carSec = col('Section', [await section('เลือกรถเข้าแผน', { badge: shown.length ? ticked.length + '/' + shown.length : null }), row('Row', [reg, typ])], 16);
  if (shown.length) add(carSec, await tbl([['ทะเบียน', 240, 'Lead checkbox'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 220], ['สถานะรถ', 140, 'Badge']],
    shown.map((c, i) => [{ check: ticked.indexOf(i) >= 0, text: c[0] }, c[1], c[2], { pill: VST[c[3]] }])), 'h');
  else { const es = inst('Empty state/Data empty'); add(carSec, es, 'h'); await text(es, 'Text', 'ยังไม่มีรายการรถ'); await text(es, 'Supporting text', o.errors ? 'กรุณาเลือกรถเข้าแผนอย่างน้อย 1 คัน — เลือกภาคและประเภทรถก่อน' : 'เลือกภาคและประเภทรถเพื่อแสดงรายการรถที่เข้าเงื่อนไข'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  const partsSec = col('Section', [await section('รายการอะไหล่ที่ต้องใช้ (ระบบคำนวณจากรถที่เลือก)', { badge: ticked.length ? PARTS.length : null })], 16);
  if (ticked.length) add(partsSec, await tbl(PART_COLS.slice(0, 5), PARTS.map(p => [p[0], p[1], p[2], p[3], p[4]])), 'h');
  else { const es = inst('Empty state/Data empty'); add(partsSec, es, 'h'); await text(es, 'Text', 'ยังไม่มีรายการอะไหล่'); await text(es, 'Supporting text', 'เลือกรถเข้าแผนก่อน ระบบจะคำนวณน้ำมัน ไส้กรอง และอะไหล่ตามรอบให้เอง'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  add(page, col('Content', [
    col('Section', [await section('ข้อมูลแผน'),
      row('Row', [field('ชื่อแผน', v.name, { placeholder: 'ระบุชื่อแผน', error: E('กรุณาระบุชื่อแผน') }), dropdown('ไตรมาส', v.q || '', { placeholder: 'เลือกไตรมาส', error: E('กรุณาเลือกไตรมาส') })])], 16),
    carSec,
    partsSec,
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกและส่งตรวจสอบ', { size: 'lg' }]])
  ], 32), 'h');
  if (o.regionOpen) comboAt(scr, reg.findOne(n => n.name === 'Container') || reg, REGIONS.map(r => [r, '', r === o.region]));
  return scr;
}
const FILLED = { name: NEW_PLAN[1], q: 'Q2' };
const R2 = { region: REGIONS[1], type: 'รถกระเช้า' };   // ภาค 2 + รถกระเช้า → รถเข้าเงื่อนไข 7 คัน (CAND)
const ALL7 = [0, 1, 2, 3, 4, 5, 6], PICK5 = [0, 1, 2, 3, 5];   // ติ๊กทั้งหมด · เอารถซ่อม (83-1207) กับ 85-0918 ออก

/* ---------- S4 ตรวจสอบจำนวนรถปัจจุบันตามแผน ---------- */
const VEH_COLS = [['ทะเบียน', 170, 'Lead text', 'Swap'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 200], ['สถานะรถ', 120, 'Badge', 'Swap'], ['ความพร้อม', 140, 'Badge', 'Swap'], ['', 72]];
async function vehiclesScreen(name, o) {
  o = o || {};
  const rows = o.removed ? VEH.filter(v => v[3] !== 'transfer') : VEH;
  const bad = rows.filter(v => v[3] === 'transfer' || v[3] === 'dispose').length;
  const { scr, page } = await detail(name, { crumbs: ['ตรวจสอบจำนวนรถ'], status: 'approved' });
  const cnt = (k) => rows.filter(v => v[4] === k).length;
  const summary = kv([['รถตามแผน', P[4] + ' คัน'], ['อยู่ในแผนตอนนี้', rows.length + ' คัน'], ['พร้อม', cnt('ready') + ' คัน'], ['ไม่พร้อม / ยังไม่ตอบ', cnt('notready') + ' / ' + cnt('pending') + ' คัน']]);
  const nodes = [col('Section', [await sectionLabel('สรุปความพร้อมของรถ'), summary], 16)];
  if (bad) nodes.push(alertBox('Error', 'มีรถสถานะโอน/รอยุบ ' + bad + ' คัน', 'บอร์ด: สถานะต้องไม่ใช่ รอยุบ หรือ โอน — นำออกจากแผนก่อนยืนยันจำนวนรถ'));
  nodes.push(col('Section', [await sectionLabel('รายการรถในแผน', { badge: rows.length }),
    await tbl(VEH_COLS, rows.map(v => [v[0], v[1], v[2], { pill: VST[v[3]] }, { pill: RDY[v[4]] }, { icons: ['delete-24-300-round'] }]), { pagination: rows.length })], 16));
  nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันจำนวนรถ', { size: 'lg', disabled: bad > 0 }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S5 ตรวจสอบและเบิกอะไหล่ผ่านระบบจองอะไหล่ ---------- */
async function partsScreen(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'เบิก/จองอะไหล่ · ' + P[0], back: true, crumbs: ['แผน ' + P[0], 'เบิก/จองอะไหล่'] });
  const nodes = [];
  if (o.result === 'short') nodes.push(alertBox('Warning', 'ระบบจองอะไหล่ตอบกลับ: จองได้ 3 รายการ · คงเหลือไม่พอ 2 รายการ', 'ไส้กรองไฮโดรลิก ซื้อเพิ่ม 9 ชิ้น โดย Smart Inventory · จาระบีอเนกประสงค์ ซื้อเพิ่ม 14 กก. โดย ผพจ. (S3) — รอของเข้าคลัง'));
  if (o.result === 'ok') nodes.push(alertBox('Success', 'มีอะไหล่พร้อมครบตามแผน', 'จองผ่านระบบจองอะไหล่แล้ว 5 รายการ · เลือกรูปแบบดำเนินการเพื่อไปทำแผนเดินทาง'));
  nodes.push(await partsPanel(o));   // ผลจองแสดงในแผงการ์ดเดิมแบบงานซ่อม (เลิกใช้ตาราง + ป้ายพร้อม/ขาด · 22 ต.ค. 2569)
  if (o.result === 'ok') nodes.push(await radioPick('รูปแบบดำเนินการ', ['กบค. ดำเนินการเอง — ทำแผนเดินทาง (S6)', 'ว่าจ้างผู้รับจ้าง — ผู้รับจ้างทำแผนเดินทาง (S7)'], o.hire ? 1 : 0));
  nodes.push(btnRow(o.result === 'ok' ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ไปทำแผนเดินทาง', { size: 'lg' }]]
    : o.result === 'short' ? [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ไปทำแผนเดินทาง', { size: 'lg', disabled: true }]]
    : [['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'เบิก/จองอะไหล่', { size: 'lg', disabled: !(o.picked && o.picked.length) }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S6 แผนเดินทาง (ตรวจเอง) ---------- */
const TRIP_COLS = [['จุดรวมงาน / สถานที่', 0, 'Lead text'], ['ช่วงวันเดินทาง', 220], ['รถ (คัน)', 100], ['ผู้ดำเนินการ', 180], ['สถานะ', 150, 'Badge'], ['', 72]];
async function tripList(name, o) {
  o = o || {};
  const { scr, page } = await detail(name, { crumbs: ['แผนเดินทาง'], status: 'active' });
  const sec = col('Section', [await sectionLabel('แผนเดินทาง', { badge: (o.rows || []).length, buttons: [{ kind: 'Primary button', text: 'สร้างแผนเดินทาง', icon: 'add-24-300-round' }] })], 16);
  if (o.rows && o.rows.length) add(sec, await tbl(TRIP_COLS, o.rows.map(t => [t[0], t[1], t[2], t[3], { pill: TST[t[4]] }, { icons: ['keyboard_arrow_right-20-400-round'] }])), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ยังไม่มีแผนเดินทาง'); await text(es, 'Supporting text', 'สร้างแผนเดินทางเพื่อนัดวันเข้าตรวจ แจ้งเจ้าของรถและ กรย.'); const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false; const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: 'สร้างแผนเดินทาง', 'Leading icon swap': icon('add-24-300-round') }); }
  add(page, col('Content', [await vehicleInfo(PLAN_KV, 'รายละเอียดแผน'), sec], 32), 'h');
  return scr;
}
async function tripForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const { scr, page } = await shell(name, { title: 'สร้างแผนเดินทาง', back: true, crumbs: ['แผน ' + P[0], 'สร้างแผนเดินทาง'] });
  const sel = o.sel || [];
  const car = await carPick('เลือกรถที่จะบำรุงรักษา', CARS, sel, { query: o.query, open: o.carOpen, error: sel.length ? '' : E('กรุณาเลือกรถที่จะบำรุงรักษาอย่างน้อย 1 คัน') });   // ค้นได้เฉพาะรถในแผนนี้
  const d1 = field('วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม'), state: o.dateOpen ? 'Focused' : undefined });
  const d2 = field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') });
  const place = dropdown('สถานที่บำรุงรักษา (จุดรวมงาน)', v.place, { placeholder: 'ค้นหาจุดรวมงาน', lead: 'search-24-300-round', error: E('กรุณาเลือกสถานที่บำรุงรักษา') });
  const staff = [0, 1, 2].map(i => dropdown('พนักงาน กบค. ซ่อม คนที่ ' + (i + 1) + (i === 2 ? ' (ถ้ามี)' : ''), v.staff ? v.staff[i] : '', { placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round', error: i < 2 ? E('กรุณาเลือกพนักงาน') : '' }));
  add(page, col('Content', [
    col('Section', [await section('รายละเอียดแผนเดินทาง'), row('Row', [place, d1, d2])], 16),
    car.sec,
    col('Section', [await section('พนักงาน กบค. ซ่อม (2-3 คน)'), row('Row', staff)], 16),
    col('Section', [await section('ค่าใช้จ่าย (บาท)'), row('Row', [field('ค่าเบี้ยเลี้ยง', v.perDiem, { placeholder: '0', error: E('กรุณาระบุค่าเบี้ยเลี้ยง') }), field('ค่าที่พัก', v.lodging, { placeholder: '0', error: E('กรุณาระบุค่าที่พัก') }), field('ค่าเดินทาง', v.travel, { placeholder: '0', error: E('กรุณาระบุค่าเดินทาง') })])], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันการสร้างแผนเดินทาง', { size: 'lg' }]])
  ], 32), 'h');
  car.open(scr);
  if (o.dateOpen && !MOB) {   // ปฏิทินช่วงวัน = Date picker Type=Dual ของไลบรารี วางใต้ช่องวันที่
    const dp = inst('Date picker', { Type: 'Dual' }, { 'Time picker': false });
    overlay(scr, dp, 0, 0);
    const sb = scr.absoluteBoundingBox, ab = d1.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4;
  }
  return scr;
}
const TRIP_FILLED = { place: TRIP.place, d1: TRIP.d1, d2: TRIP.d2, staff: TRIP.staff, perDiem: TRIP.perDiem, lodging: TRIP.lodging, travel: TRIP.travel };

/* ---------- S10 บันทึกงานบำรุงรักษารายคัน ---------- */
const WORK_COLS = [['ทะเบียน', 170, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 200], ['สถานะงาน', 150, 'Badge'], ['', 72]];
async function workList(name, o) {
  o = o || {};
  const rows = VEH.slice(0, 4).map((v, i) => [v[0], v[1], v[2], { pill: WSTAT[(o.done || []).indexOf(i) >= 0 ? 'done' : (o.cannot || []).indexOf(i) >= 0 ? 'cannot' : 'todo'] }, { icons: ['keyboard_arrow_right-20-400-round'] }]);
  const { scr, page } = await detail(name, { crumbs: ['แผนเดินทาง ' + TRIP.place], status: 'active' });
  add(page, col('Content', [
    await vehicleInfo([['จุดรวมงาน', TRIP.place], ['ช่วงวันเดินทาง', TRIP.d1 + ' – ' + TRIP.d2], ['พนักงาน กบค.', TRIP.staff.join(' · ')], ['รถในใบเดินทาง', rows.length + ' คัน']], 'รายละเอียดแผนเดินทาง'),
    col('Section', [await sectionLabel('รายการรถตามแผนเดินทาง', { badge: rows.length }), await tbl(WORK_COLS, rows)], 16)
  ], 32), 'h');
  return scr;
}
const WORK_COLS2 = [['รายการงาน', 0], ['อะไหล่ที่ใช้', 320], ['จำนวนตามแผน', 140], ['จำนวนที่ใช้จริง', 140], ['หน่วย', 110]];
async function workForm(name, o) {
  o = o || {};
  const E = (m) => o.errors ? m : '';
  const { scr, page } = await shell(name, { title: 'บันทึกงานบำรุงรักษา · ' + V[0], back: true, crumbs: ['แผนเดินทาง ' + TRIP.place, V[0]] });
  const nodes = [await vehicleInfo(VEH_KV), await radioPick('บำรุงรักษาได้หรือไม่', ['บำรุงรักษาได้', 'บำรุงรักษาไม่ได้ — ระบุสาเหตุ'], o.cannot ? 1 : 0)];
  if (o.cannot) {
    nodes.push(col('Section', [await section('สาเหตุที่ไม่สามารถบำรุงรักษาได้'), area('สาเหตุ', o.reason || '', { placeholder: 'เช่น รถติดภารกิจ ไม่อยู่ที่หน่วยงาน · เครื่องยนต์เสียต้องส่งซ่อม' })], 16));
  } else {
    nodes.push(col('Section', [await section('ภาพก่อนเริ่มงาน')].concat(await photoUploads(BEFORE, o.filled, o.errors)), 16));
    const workRows = WORK.map((w) => MOB ? [w[0], w[1], w[2], o.filled ? w[3] : '—', w[4], { pill: o.filled ? ['ทำแล้ว', 'Success'] : ['ยังไม่ทำ', 'Gray'] }]
      : [{ check: !!o.filled, text: w[0] }, w[1], w[2], o.filled ? w[3] : '', w[4]]);   // mobile: การ์ด Mobile table เห็นครบทุกช่อง (List with checkbox เห็นแค่ชื่องาน)
    const oil = inst('Checkbox with description'); const cb = find(oil, 'Checkbox'); if (cb) setProps(cb, { Type: o.filled ? 'Selected' : 'Unselected' });
    await text(oil, 'Text', 'เก็บตัวอย่างน้ำมันไฮโดรลิกไปทดสอบแล้ว'); await text(oil, 'Supporting text', 'บันทึกผลตรวจการนำไฟฟ้าในขั้นตรวจรับ (S12)');
    nodes.push(col('Section', [await section('รายการงานและอะไหล่ที่ใช้ (ยืนยันจำนวนที่ใช้จริง)', { badge: WORK.length }), await tbl(MOB ? WORK_COLS2.concat([['สถานะ', 120, 'Badge']]) : WORK_COLS2, workRows), oil], 16));
    nodes.push(col('Section', [await section('ภาพตอนจบงาน')].concat(await photoUploads(AFTER, o.filled, o.errors), [
      row('Row', [field('เลขไมล์รถ (กม.)', o.filled ? '182,640' : '', { placeholder: '0', error: E('กรุณาระบุเลขไมล์รถ') }),
        field('ชั่วโมงเครื่องจักร (ชม.)', o.filled ? '6,131' : '', { placeholder: '0', error: E('กรุณาระบุชั่วโมงเครื่องจักร') })]),
      await upload('ภาพชั่วโมงเครื่องจักร (ถ้ามี)', o.filled ? [jpg('hour-meter')] : [], { optional: true, hint: 'JPG, PNG · 1 ภาพ' })]), 16));
  }
  nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึก', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}
async function workDetail(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'หมายเลขแผน ' + P[0], back: true, crumbs: ['แผนเดินทาง ' + TRIP.place, V[0]], badge: WSTAT.done,
    actions: o.oilBtn ? [['Secondary button', 'บันทึกผลตรวจน้ำมัน', 'stylus-24-300-round']] : undefined });
  const nodes = [await vehicleInfo(VEH_KV.concat([['วันที่บำรุงรักษา', '04/11/2569 10:20 น.'], ['ผู้บันทึก', TRIP.staff[0] + ' (กบค.)'], ['เลขไมล์หลังทำ', '182,640 กม.'], ['ชั่วโมงเครื่องจักรหลังทำ', '6,131 ชม.']]), 'ข้อมูลยานพาหนะและงาน'),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tbl(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16),
    await photoGallery('ภาพตอนจบงาน (' + AFTER.length + ')', AFTER.length)];
  if (o.oil) nodes.push(col('Section', [await sectionLabel('ผลตรวจน้ำมันไฮโดรลิก'), kv([['วันที่เก็บตัวอย่าง', '04/11/2569'], ['วันที่ตรวจ', '11/11/2569'], ['ค่าการนำไฟฟ้า', '1,250 pS/m'], ['ผล', 'ผ่านเกณฑ์'], ['แจ้งเจ้าของรถ', '11/11/2569 14:02 น. (e-mail + VMS+)'], ['ใบผลแล็บ', 'oil-test-82-6789.pdf']])], 16));
  else nodes.push(col('Section', [await sectionLabel('ผลตรวจน้ำมันไฮโดรลิก'), alertBox('Info', 'เก็บตัวอย่างแล้ว 04/11/2569 · รอผลตรวจการนำไฟฟ้า', 'กด "บันทึกผลตรวจน้ำมัน" เมื่อได้ผลจากห้องทดสอบ')], 16));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S12 บันทึกผลตรวจน้ำมันไฮโดรลิก ---------- */
async function oilForm(name, o) {
  o = o || {};
  const E = (m) => o.errors ? m : '';
  const { scr, page } = await shell(name, { title: 'บันทึกผลตรวจน้ำมันไฮโดรลิก · ' + V[0], back: true, crumbs: ['แผนเดินทาง ' + TRIP.place, V[0], 'ผลตรวจน้ำมัน'] });
  add(page, col('Content', [
    await vehicleInfo([['ทะเบียน', V[0]], ['ยี่ห้อ/รุ่น', V[1]], ['วันที่เก็บตัวอย่าง', '04/11/2569'], ['ผู้เก็บตัวอย่าง', TRIP.staff[0] + ' (กบค.)']]),
    col('Section', [await section('ผลตรวจการนำไฟฟ้าน้ำมันไฮโดรลิก'),
      row('Row', [field('วันที่ตรวจ', o.v ? '11/11/2569' : '', { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาระบุวันที่ตรวจ') }), field('ค่าการนำไฟฟ้า (pS/m)', o.v ? '1,250' : '', { placeholder: '0', error: E('กรุณาระบุค่าการนำไฟฟ้า') }), dropdown('ผล', o.v ? 'ผ่านเกณฑ์' : '', { placeholder: 'ผ่านเกณฑ์ / ไม่ผ่านเกณฑ์', error: E('กรุณาเลือกผล') })]),
      await upload('ใบผลตรวจจากห้องทดสอบ', o.v ? [pdf('oil-test-82-6789.pdf', '420 KB')] : [], { hint: 'PDF, JPG · สูงสุด 10 ไฟล์' }),
      area('หมายเหตุ', '', { optional: true, placeholder: 'ระบุหมายเหตุ' })], 16),
    alertBox('Info', 'บันทึกแล้วระบบจะแจ้งเตือนเจ้าของรถทาง e-mail และ VMS+', 'ตามบอร์ด: "เจ้าของรถได้รับแจ้งเตือนผลตรวจน้ำมันไฮโดรลิก"'),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกและแจ้งเจ้าของรถ', { size: 'lg' }]])
  ], 32), 'h');
  return scr;
}

/* ---------- S15 ประวัติงานบำรุงรักษา · S17 รายงานผล/ปิดงาน · S18 ต้นทุน ---------- */
const HIST_COLS = [['ทะเบียน', 160, 'Lead text', 'Swap'], ['วันที่ทำ', 120], ['งานที่ทำ', 0], ['อะไหล่ที่ใช้', 220], ['ผลน้ำมัน', 110, 'Badge'], ['ผู้ทำ', 150], ['การยอมรับ', 190, 'Badge']];
const HIST = VEH.slice(0, 4).map((v, i) => [v[0], '0' + (4 + i) + '/11/2569', 'เปลี่ยนน้ำมันไฮโดรลิก · ไส้กรอง · น้ำมันเครื่อง · อัดจาระบี', '30 ลิตร · 2 ชิ้น · 36 ลิตร · 3 กก.',
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
    alertBox('Info', 'ค่าแรงใช้ยอดเบี้ยเลี้ยงจากแผนเดินทาง (S6) · ยังไม่รวมค่าอะไหล่', 'รอเคาะ Q26 — "ค่าแรง" กับ "ค่าเบี้ยเลี้ยง" รายการเดียวกันไหม · ต้นทุนรวมอะไหล่/ค่าจ้างไหม')
  ], 32), 'h');
  return scr;
}

/* ======================== รอบสอง 9 scenario (เจ้าของงานสั่ง 22 ต.ค. 2569 ดึก "บำรุงรักษา สามารถ export 18 scen ได้เลย") ========================
   S2–S3 ผพจ./หัวหน้า ผพจ. · S7 ผู้รับจ้าง · S8 กบค. ตรวจแผนผู้รับจ้าง · S9 กรย. · S11 กบค. ตรวจงานผู้รับจ้าง + รับคืนอะไหล่ · S13–S14 หน่วยงาน/เจ้าของรถ · S16 หัวหน้า กบค.
   ตีความเอง (คำถามในไฟล์ 14 ยังค้าง — แจ้งเจ้าของงานแล้ว): ผพจ. กับหัวหน้า ผพจ. คนละบทบาท (Q1) · ผู้รับจ้างมีบัญชีเข้า VMS+ เอง (Q13) · ยอมรับ 2 รอบ รายคัน S13 + ทั้งแผน S14 (Q28) ·
   ไม่มีปุ่มไม่ยอมรับ (Q23) · ไม่สร้างทางที่บอร์ดยังไม่มีปลายทาง (กรย. อะไหล่ไม่พร้อม Q16 · ผพจ. คืนอะไหล่ Q5)
   ยืมจาก flow งานซ่อม: `RepairFeedback` (คะแนน 1–5 Radio text card — เจ้าของงานเลือกให้ S14 · การประเมินเกิดตอนบำรุงรักษาครบทุกคัน) · `ReturnPart` (ตารางรับคืนอะไหล่ S11) */
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

/* ---------- S2 ผพจ. ตรวจสอบและอนุมัติแผน ---------- */
const NP = NEW_PLAN;
const NO_NEW = 'MT-2570-003';   // เลขงานที่ ผพจ. ออกให้แผนใหม่ (S3) — รูปแบบเลขงานยังไม่รู้ (Q4)
const npKv = (job) => [['ชื่อแผน', NP[1]], ['ภาค', NP[2]], ['ประเภทรถ', NP[7]], ['ไตรมาส', NP[3]], ['จำนวนรถ', NP[4] + ' คัน'], ['เลขงาน', job || 'ยังไม่ออก'], ['ผู้สร้างแผน', 'นายวิชัย ทองดี (กบค.)'], ['วันที่ส่ง', NP[6]]];
const VEH7 = CAND.map(c => [c[0], c[1], c[2], c[3], 'ready']);   // รถในแผนใหม่ = รถที่ติ๊กตอนสร้างแผน (ภาค 2 รถกระเช้า)
const REVIEW_COLS = [['ชื่อแผน', 0, 'Lead text', 'Swap'], ['ผู้สร้าง (กบค.)', 200], ['ภาค', 200], ['ไตรมาส', 100], ['จำนวนรถ', 110], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 180, 'Badge'], ['', 60]];
const reviewRow = (p) => [p[1], 'นายวิชัย ทองดี', p[2], p[3], p[4] + ' คัน', p[6], { pill: PST[p[5]] }, GO];
const REVIEW_ROWS = [NP, PLANS[2], PLANS[3]];
const PART_CHECK_COLS = [['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['ตามแผน', 110], ['หน่วย', 90], ['คงเหลือในคลัง', 140], ['ต้องซื้อเพิ่ม', 140]];
const partCheckRows = () => PARTS.map((p, i) => [p[0], p[1], p[3], p[4], p[5], shortOf(i) ? String(shortOf(i)) : '-']);
async function planReview(name, o) {   // หน้ารายละเอียดแผนฝั่ง ผพจ. (Detail ⇒ Section label) · ปุ่มส่งกลับ/อนุมัติ
  o = o || {};
  const { scr, page } = await shell(name, { title: 'ตรวจสอบแผนบำรุงรักษา', back: true, crumbs: ['แผนรอตรวจสอบ', NP[1]], badge: PST[o.status || 'review'] });
  const nodes = [await vehicleInfo(npKv(), 'รายละเอียดแผน'),
    col('Section', [await sectionLabel('รายการรถในแผน', { badge: VEH7.length }), await tbl([['ทะเบียน', 170, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 220], ['สถานะรถ', 140, 'Badge']], VEH7.map(v => [v[0], v[1], v[2], { pill: VST[v[3]] }]), { pagination: VEH7.length })], 16),
    col('Section', [await sectionLabel('รายการอะไหล่ที่ต้องใช้', { badge: PARTS.length }), await tbl(PART_CHECK_COLS, partCheckRows()),
      alertBox('Info', 'ตรวจ/เตรียมอะไหล่สำหรับไตรมาส ' + NP[3], 'คงเหลือไม่พอ 2 รายการ — อนุมัติแล้วจะไปขั้นออกเลขงานและจัดซื้อ (S3)')], 16)];
  if (o.status === 'approved') nodes.push(alertBox('Success', 'อนุมัติแผนแล้ว 21/10/2569', 'รอ ผพจ. ออกเลขงาน (S3)'));
  else nodes.push(btnRow([['Secondary button', 'ส่งกลับแก้ไข', { size: 'lg' }], ['Primary button', 'อนุมัติแผน', { size: 'lg' }]]));
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
      alertBox('Warning', 'ต้องซื้อเพิ่ม 2 รายการ รวม ' + baht(PO_TOTAL), 'ไส้กรองไฮโดรลิก 9 ชิ้น · จาระบีอเนกประสงค์ 14 กก.')], 16),
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
const HIRE = PLANS[1];   // แผนที่ว่าจ้าง (MT-2570-002 รถเครน ภาค 2)
const CONTRACTOR = 'บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด';
const TRIP_ST = { none: ['ยังไม่สร้าง', 'Gray'], wait: ['รอ กบค. ตรวจสอบ', 'Warning'], ok: ['อนุมัติแล้ว', 'Success'], rej: ['ปฏิเสธ', 'Error'] };
const HTRIP = { place: 'จุดรวมงาน กฟฉ.2 อุบลราชธานี', d1: '10/11/2569', d2: '13/11/2569' };
const JOBS_COLS = [['เลขงาน', 140, 'Lead text'], ['แผน', 0], ['ไตรมาส', 100], ['จำนวนรถ', 110], ['แผนเดินทาง', 180, 'Badge'], ['', 60]];
const jobsRows = (st) => [[HIRE[0], HIRE[1], HIRE[3], HIRE[4] + ' คัน', { pill: TRIP_ST[st] }, GO], ['MT-2569-014', 'บำรุงรักษารถเครน ภาค 2 ไตรมาส 4/2569', 'Q4', '5 คัน', { pill: TRIP_ST.ok }, GO]];
async function hireTripForm(name, o) {   // ช่องเดียวกับ S6 ยกเว้นพนักงาน กบค. และค่าใช้จ่าย (ไฟล์ 14 S7)
  o = o || {};
  const v = o.filled ? HTRIP : {}, E = (m) => o.errors ? m : '';
  const { scr, page } = await shell(name, { title: 'สร้างแผนเดินทาง', back: true, crumbs: ['งานที่ได้รับว่าจ้าง', HIRE[0], 'สร้างแผนเดินทาง'] });
  const sel = o.filled ? [0, 1, 4] : [];
  const car = await carPick('เลือกรถที่จะบำรุงรักษา', CARS, sel, { error: sel.length ? '' : E('กรุณาเลือกรถที่จะบำรุงรักษาอย่างน้อย 1 คัน') });
  add(page, col('Content', [await vehicleInfo([['เลขงาน', HIRE[0]], ['แผน', HIRE[1]], ['ไตรมาส', HIRE[3]], ['ผู้รับจ้าง', CONTRACTOR]], 'งานที่ได้รับว่าจ้าง'),
    col('Section', [await section('รายละเอียดแผนเดินทาง'), row('Row', [
      dropdown('สถานที่บำรุงรักษา (จุดรวมงาน)', v.place, { placeholder: 'ค้นหาจุดรวมงาน', lead: 'search-24-300-round', error: E('กรุณาเลือกสถานที่บำรุงรักษา') }),
      field('วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม') }), field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') })])], 16),
    car.sec,
    alertBox('Info', 'ยืนยันแล้วระบบส่งแผนให้ กบค. ตรวจสอบ และแจ้งเจ้าของรถ + กรย.', 'ส่งแจ้งเตือนก่อนหรือหลัง กบค. อนุมัติ ยังไม่เคาะ'),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันและส่งให้ กบค. ตรวจสอบ', { size: 'lg' }]])], 32), 'h');
  return scr;
}
const HT_COLS = [['ผู้รับจ้าง', 0, 'Lead text'], ['แผน', 150], ['รถ (คัน)', 100], ['จุดรวมงาน', 260], ['ช่วงวัน', 220], ['วันที่ส่ง', 120], ['', 60]];
const HT_ROWS = { wait: [[CONTRACTOR, HIRE[0], '3', HTRIP.place, HTRIP.d1 + ' – ' + HTRIP.d2, '24/10/2569', GO], ['หจก. ช่างกลภาคอีสาน', 'MT-2570-005', '4', 'จุดรวมงาน กฟฉ.3 นครราชสีมา', '17/11/2569 – 20/11/2569', '25/10/2569', GO]],
  ok: [[CONTRACTOR, 'MT-2569-014', '5', 'จุดรวมงาน กฟฉ.2 อุบลราชธานี', '05/08/2569 – 08/08/2569', '20/07/2569', GO]], rej: [] };
async function hireTripReview(name, o) {   // กบค. ดูรายละเอียดแผนเดินทางของผู้รับจ้าง
  o = o || {};
  const { scr, page } = await shell(name, { title: 'แผนเดินทาง · ' + CONTRACTOR, back: true, crumbs: ['แผนเดินทางผู้รับจ้าง', HIRE[0]], badge: TRIP_ST[o.st || 'wait'] });
  const nodes = [await vehicleInfo([['ผู้รับจ้าง', CONTRACTOR], ['เลขงาน', HIRE[0]], ['แผน', HIRE[1]], ['วันที่ส่ง', '24/10/2569'], ['จุดรวมงาน', HTRIP.place], ['ช่วงวันเดินทาง', HTRIP.d1 + ' – ' + HTRIP.d2], ['รถในแผนเดินทาง', '3 คัน']], 'รายละเอียดแผนเดินทาง'),
    col('Section', [await sectionLabel('รถที่จะบำรุงรักษา', { badge: 3 }), await tbl([['ทะเบียน', 170, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['หน่วยงานเจ้าของรถ', 220]], [0, 1, 4].map(i => [VEH[i][0], VEH[i][1], VEH[i][2]]))], 16),
    btnRow([['Secondary button', 'ปฏิเสธ', { size: 'lg' }], ['Primary button', 'อนุมัติแผนเดินทาง', { size: 'lg' }]])];
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S9 กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน ---------- */
const PREP = { new: ['ยังไม่รับทราบ', 'Gray'], ack: ['รับทราบแล้ว', 'Info'], ready: ['เตรียมแล้ว', 'Success'] };
const PREP_COLS = [['เลขงาน', 140, 'Lead text'], ['ผู้ดำเนินการ', 0], ['จุดรวมงาน', 260], ['วันเดินทาง', 140], ['สถานะ', 160, 'Badge'], ['', 60]];
const prepRows = (st) => [[P[0], 'กบค. (ตรวจเอง)', TRIP.place, TRIP.d1, { pill: PREP[st] }, GO], [HIRE[0], CONTRACTOR, HTRIP.place, HTRIP.d1, { pill: PREP.new }, GO]];
async function prepDetail(name, o) {
  o = o || {};
  const st = o.st || 'new';
  const { scr, page } = await shell(name, { title: 'เตรียมอะไหล่ · ' + P[0], back: true, crumbs: ['แผนเดินทางที่ต้องเตรียมอะไหล่', P[0]], badge: PREP[st] });
  const nodes = [await vehicleInfo([['เลขงาน', P[0]], ['ผู้ดำเนินการ', 'กบค. (ตรวจเอง)'], ['จุดรวมงาน', TRIP.place], ['ช่วงวันเดินทาง', TRIP.d1 + ' – ' + TRIP.d2]], 'แผนเดินทาง'),
    col('Section', [await sectionLabel('อะไหล่ที่ต้องวางที่จุดรวมงาน', { badge: PARTS.length }), await tbl([['รายการอะไหล่', 0, 'Lead text'], ['รหัส', 110], ['จำนวน', 110], ['หน่วย', 90], ['คลัง', 180]], PARTS.map((p, i) => [p[0], p[1], p[3], p[4], WH[i]]))], 16)];
  if (st === 'ready') nodes.push(alertBox('Success', 'เตรียมอะไหล่ไว้ที่จุดรวมงานแล้ว 02/11/2569', 'กบค. เห็นสถานะนี้ที่แผนเดินทาง (S6/S10)'));
  else if (st === 'ack') nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกว่าเตรียมแล้ว', { size: 'lg' }]]));
  else nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'รับทราบแผน', { size: 'lg' }]]));
  add(page, col('Content', nodes, 32), 'h');
  return scr;
}

/* ---------- S11 กบค. ตรวจสอบงานจากผู้รับจ้าง + รับคืนอะไหล่ ---------- */
const CHK = { wait: ['รอตรวจสอบ', 'Warning'], pass: ['ผ่าน', 'Success'], back: ['ส่งกลับแก้ไข', 'Error'] };
const CHK_COLS = [['ทะเบียน', 170, 'Lead text'], ['ยี่ห้อ/รุ่น', 0], ['วันที่ทำ', 130], ['ผู้รับจ้าง', 260], ['สถานะตรวจสอบ', 170, 'Badge'], ['', 60]];
const chkRows = (first) => [0, 1, 4].map((i, k) => [VEH[i][0], VEH[i][1], (10 + k) + '/11/2569', CONTRACTOR, { pill: CHK[k === 0 ? first : 'wait'] }, GO]);
const RETURNS = [['น้ำมันไฮโดรลิก ISO VG 46', '28', '2', baht(PRICE[0]), baht(28 * PRICE[0])], ['ไส้กรองไฮโดรลิก', '2', '0', baht(PRICE[1]), baht(2 * PRICE[1])],
  ['น้ำมันเครื่อง 15W-40', '34', '2', baht(PRICE[3]), baht(34 * PRICE[3])], ['จาระบีอเนกประสงค์', '3', '1', baht(PRICE[4]), baht(3 * PRICE[4])]];
/* รับคืนอะไหล่ — ยืม ReturnPart (ตารางรับคืนอะไหล่ของงานซ่อม: ชื่ออะไหล่ · จำนวนที่ใช้ · จำนวนที่คืน · ราคาต่อหน่วย · ราคารวม) · ไม่มี/mobile → Table ของไลบรารี */
async function returnParts(rows) {
  const title = 'รับคืนอะไหล่/น้ำมันที่ไม่ได้ใช้';
  if (!MOB && has('ReturnPart')) {
    const r = inst('ReturnPart', { Breakpoint: 'Desktop' }, { Delete: false }); r.name = 'ReturnPart';
    const sh = find(r, 'Section header'); if (sh) setProps(sh, { Title: title, Badge: false, 'Supporting text': false, Actions: false, 'More actions': false });
    const content = r.children.find(c => c.name === 'Content');
    const cols = content ? content.children.filter(c => c.name === 'Column') : [];
    const heads = ['ชื่ออะไหล่', 'จำนวนที่ใช้', 'จำนวนที่คืน', 'ราคาต่อหน่วย', 'ราคารวม'];
    for (const [ci, c] of cols.entries()) {
      if (ci >= heads.length) { c.visible = false; continue; }   // คอลัมน์ไอคอนลบ — หน้าตรวจรับไม่ลบแถว
      const hc = c.children.find(x => x.name === 'Table header cell'); if (hc) setProps(hc, { Text: heads[ci] });
      const cells = c.findAll(x => x.name === 'Table cell' && !(x.children || []).some(k => k.name === 'Table cell'));
      for (const [ri, cell] of cells.entries()) {
        if (ri >= rows.length) { cell.visible = false; continue; }
        const v = rows[ri][ci];
        const ti = cell.findOne(x => x.type === 'INSTANCE' && x.name === 'Text input'), ni = cell.findOne(x => x.type === 'INSTANCE' && x.name === 'Number input');
        if (ti) setProps(ti, { Text: v, State: 'Filled' }); else if (ni) setProps(ni, { Number: v }); else await text(cell, 'Text', v);
      }
    }
    const pg = find(r, 'Table pagination'); if (pg) await fillPagination(pg, rows.length);
    return r;
  }
  return col('Section', [await section(title, { badge: rows.length }), await tbl([['ชื่ออะไหล่', 0, 'Lead text'], ['จำนวนที่ใช้', 140], ['จำนวนที่คืน', 140], ['ราคาต่อหน่วย', 150], ['ราคารวม', 150]], rows)], 16);
}
async function hireWorkCheck(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'ตรวจสอบงาน · ' + V[0], back: true, crumbs: ['งานที่ผู้รับจ้างส่งมา', V[0]], badge: CHK[o.st || 'wait'] });
  add(page, col('Content', [
    await vehicleInfo(VEH_KV.slice(0, 6).concat([['ผู้รับจ้าง', CONTRACTOR], ['วันที่ทำ', '10/11/2569']]), 'ข้อมูลยานพาหนะและงาน'),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tbl(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16),
    await photoGallery('ภาพตอนจบงาน (' + AFTER.length + ')', AFTER.length),
    await returnParts(RETURNS),
    alertBox('Info', 'อะไหล่ที่คืน 3 รายการ — ทำเรื่องคืนเข้าคลังผ่านระบบจองอะไหล่', 'ใช้อะไหล่ไม่ครบตามที่เบิก · ช่องทางคืนเข้าคลังยังไม่เคาะ'),
    btnRow([['Secondary button', 'ส่งกลับแก้ไข', { size: 'lg' }], ['Primary button', 'ผ่าน · บันทึกผลตรวจสอบ', { size: 'lg' }]])], 32), 'h');
  return scr;
}

/* ---------- S13 หน่วยงาน/เจ้าของรถ ยอมรับผลรายคัน · S14 ทั้งแผน + ประเมินความพึงพอใจ ---------- */
const ACC_COLS = [['ทะเบียน / แผน', 0, 'Lead text'], ['วันที่บำรุง', 140], ['ผู้ทำ', 220], ['เลขงาน', 140], ['สถานะ', 200, 'Badge'], ['', 60]];
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
  const nodes = [await vehicleInfo([['ทะเบียน', car[0]], ['ยี่ห้อ/รุ่น', car[1]], ['หน่วยงานเจ้าของรถ', car[2]], ['เลขงาน', P[0]], ['วันที่บำรุง', '04/11/2569'], ['ผู้ทำ', TRIP.staff[0] + ' (กบค.)']], 'ข้อมูลยานพาหนะ')];
  if (o.cannot) nodes.push(col('Section', [await sectionLabel('สาเหตุที่บำรุงรักษาไม่ได้'), kv([['สาเหตุ', 'รถติดภารกิจซ่อมสายส่งฉุกเฉิน ไม่อยู่ที่หน่วยงานในวันนัด'], ['ผู้บันทึก', TRIP.staff[0] + ' (กบค.)'], ['วันที่บันทึก', '05/11/2569']])], 16),
    alertBox('Warning', 'ใช้ฟอร์มเดียวกับคันที่บำรุงรักษาได้หรือแยก ยังไม่เคาะ (Q19)', 'จอนี้แสดงสาเหตุจาก S10 แล้วให้ยอมรับรับทราบ'));
  else nodes.push(col('Section', [await sectionLabel('เอกสารการตรวจบำรุงรถ (2)'), await upload('ใบตรวจสภาพอะไหล่ · ใบตรวจสภาพงานบำรุงรักษา', [pdf('ใบตรวจสภาพอะไหล่-' + car[0].split(' ')[0] + '.pdf', '380 KB'), pdf('ใบตรวจสภาพงานบำรุงรักษา-' + car[0].split(' ')[0] + '.pdf', '410 KB')], { readonly: true })], 16),
    await photoGallery('ภาพก่อนเริ่มงาน (' + BEFORE.length + ')', BEFORE.length),
    col('Section', [await sectionLabel('รายการงานและอะไหล่ที่ใช้จริง', { badge: WORK.length }), await tbl(WORK_COLS2, WORK.map(w => [w[0], w[1], w[2], w[3], w[4]]))], 16),
    await photoGallery('ภาพตอนจบงาน (' + AFTER.length + ')', AFTER.length));
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
const HQ_COLS = [['เลขงาน', 140, 'Lead text'], ['แผน', 0], ['กบค. ผู้ส่ง', 200], ['จำนวนรถ', 110], ['วันที่ส่ง', 120, 'Text', 'Down'], ['สถานะ', 180, 'Badge'], ['', 60]];
const hqRows = (st) => [[P[0], P[1], 'นายวิชัย ทองดี', P[4] + ' คัน', '12/11/2569', { pill: HST[st] }, GO], ['MT-2569-011', PLANS[4][1], 'นางสาวกนกวรรณ ใจมั่น', '10 คัน', '28/06/2569', { pill: HST.ok }, GO]];
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
  ['S1 · กบค. สร้างแผนบำรุงรักษา', [
    ['รายการแผน', () => listScreen('S1 รายการแผน', { rows: PLANS })],
    ['ฟอร์มสร้างแผน (ว่าง)', () => planForm('S1 ฟอร์มสร้างแผน', {})],
    ['เลือกภาค — รายการภาคเปิด', () => planForm('S1 เลือกภาค', { values: FILLED, regionOpen: true, region: REGIONS[1] })],
    ['เลือกภาค + ประเภทรถ — แสดงรถที่เข้าเงื่อนไข', () => planForm('S1 รถเข้าเงื่อนไข', Object.assign({ values: FILLED, ticked: ALL7 }, R2))],
    ['ติ๊กเอารถออก — คำนวณอะไหล่ใหม่', () => planForm('S1 เอารถออก', Object.assign({ values: FILLED, ticked: PICK5 }, R2))],
    ['กดบันทึกโดยยังไม่ครบ', () => planForm('S1 ยังไม่ครบ', { errors: true })],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await planForm('S1 ยืนยันการออก', Object.assign({ values: FILLED, ticked: PICK5 }, R2)); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' }); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S1 บันทึกไม่สำเร็จ', Object.assign({ values: FILLED, ticked: PICK5 }, R2)); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — รอ ผพจ. ตรวจสอบ', async () => { const s = await listScreen('S1 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(PLANS) }); notify(s, 'การสร้างแผนบำรุงรักษาสำเร็จ'); return s; }]]],
  ['S2 · ผพจ. ตรวจสอบและอนุมัติแผนบำรุงรักษา', [
    ['รายการแผนรอตรวจสอบ', () => roleList('S2 แผนรอตรวจสอบ', { title: 'แผนรอตรวจสอบ', search: 'ค้นหาชื่อแผน, ผู้สร้าง', cols: REVIEW_COLS, rows: REVIEW_ROWS.map(reviewRow) })],
    ['รายละเอียดแผน + รถ + อะไหล่', () => planReview('S2 รายละเอียดแผน', {})],
    ['ส่งกลับแก้ไข — ระบุเหตุผล', async () => { const s = await planReview('S2 ส่งกลับ', {}); await reason(s, 'ส่งกลับให้ กบค. แก้ไข', 'เหตุผลที่ส่งกลับ', 'จำนวนไส้กรองไฮโดรลิกไม่ตรงกับรอบบำรุงรักษาของรถกระเช้า กรุณาตรวจสอบรถที่เลือกเข้าแผน', 'ส่งกลับ'); return s; }],
    ['ส่งกลับแล้ว', async () => { const s = await roleList('S2 ส่งกลับแล้ว', { title: 'แผนรอตรวจสอบ', search: 'ค้นหาชื่อแผน, ผู้สร้าง', cols: REVIEW_COLS, rows: [NP.slice(0, 5).concat(['returned', NP[6]]), PLANS[2], PLANS[3]].map(reviewRow) }); notify(s, 'ส่งแผนกลับให้ กบค. แก้ไขแล้ว'); return s; }],
    ['ยืนยันอนุมัติแผน', async () => { const s = await planReview('S2 ยืนยันอนุมัติ', {}); await confirm(s, { title: 'ยืนยันอนุมัติแผนบำรุงรักษา', sub: NP[1] + ' · ' + NP[4] + ' คัน · อนุมัติแล้วไปขั้นออกเลขงาน', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแผนสำเร็จ', async () => { const s = await planReview('S2 อนุมัติแล้ว', { status: 'approved' }); notify(s, 'อนุมัติแผนบำรุงรักษาสำเร็จ'); return s; }]]],
  ['S3 · ผพจ. ออกเลขงานและจัดซื้ออะไหล่', [
    ['แผนอนุมัติแล้ว — รอออกเลขงาน', () => planIssue('S3 รอออกเลขงาน', {})],
    ['ยืนยันออกเลขงาน', async () => { const s = await planIssue('S3 ยืนยันออกเลขงาน', {}); await confirm(s, { title: 'ยืนยันออกเลขงาน', sub: 'ระบบจะออกเลขงานให้แผน ' + NP[1] + ' (1 เลขต่อแผน)', ok: 'ออกเลขงาน' }); return s; }],
    ['ออกเลขงานแล้ว — ส่งให้หัวหน้า ผพจ.', async () => { const s = await planIssue('S3 ออกเลขงานแล้ว', { job: true }); notify(s, 'ออกเลขงาน ' + NO_NEW + ' สำเร็จ'); return s; }],
    ['หัวหน้า ผพจ. — ตรวจรายการอะไหล่', () => headPartCheck('S3 หัวหน้าตรวจอะไหล่')],
    ['หัวหน้า ผพจ. — ส่งกลับ ระบุเหตุผล', async () => { const s = await headPartCheck('S3 หัวหน้าส่งกลับ'); await reason(s, 'ส่งกลับรายการอะไหล่', 'เหตุผลที่ส่งกลับ', 'น้ำมันเครื่องใช้เบอร์ไม่ตรงกับรถรุ่น Hino FC', 'ส่งกลับ'); return s; }],
    ['ฟอร์มใบสั่งซื้อ (PO)', () => poForm('S3 ฟอร์มใบ PO')],
    ['บันทึกใบ PO สำเร็จ', async () => { const s = await planIssue('S3 บันทึก PO แล้ว', { job: true, po: true }); notify(s, 'บันทึกใบสั่งซื้ออะไหล่สำเร็จ'); return s; }]]],
  ['S4 · กบค. ตรวจสอบจำนวนรถปัจจุบันตามแผน', [
    ['รายการรถในแผน — มีรถสถานะโอน', () => vehiclesScreen('S4 รายการรถ', {})],
    ['ยืนยันนำรถออกจากแผน', async () => { const s = await vehiclesScreen('S4 ยืนยันนำรถออก', {}); await confirm(s, { danger: true, title: 'ยืนยันการนำรถออกจากแผน', sub: '81-2210 เชียงใหม่ สถานะ "โอน" จะถูกนำออกจากแผน ' + P[0] + ' และระบบจะปรับรายการอะไหล่ให้', ok: 'นำออก' }); return s; }],
    ['นำรถออกแล้ว', async () => { const s = await vehiclesScreen('S4 นำรถออกแล้ว', { removed: true }); notify(s, 'นำรถออกจากแผนแล้ว'); return s; }],
    ['ยืนยันจำนวนรถ', async () => { const s = await vehiclesScreen('S4 ยืนยันจำนวนรถ', { removed: true }); await confirm(s, { title: 'ยืนยันจำนวนรถตามแผน', sub: 'รถในแผน 5 คัน · พร้อม 3 · ไม่พร้อม 1 · ยังไม่ตอบ 1 — ไปขั้นเบิกอะไหล่ (S5)', ok: 'ยืนยัน' }); return s; }]]],
  ['S5 · กบค. ตรวจสอบและเบิกอะไหล่ผ่านระบบจองอะไหล่', [
    ['คลังอะไหล่ + อะไหล่ตามแผน (ยังไม่เลือก)', () => partsScreen('S5 คลังอะไหล่', {})],
    ['ค้นหาอะไหล่ไม่พบ', () => partsScreen('S5 ค้นไม่พบ', { inv: 'Not Found', query: 'ไส้กรองแอร์ FT-0999' })],
    ['ระบบคลังอะไหล่ขัดข้อง', () => partsScreen('S5 คลังขัดข้อง', { inv: 'API error' })],
    ['เลือกอะไหล่ครบตามแผน', () => partsScreen('S5 เลือกครบ', { picked: [0, 1, 2, 3, 4] })],
    ['สรุปรายการเบิก/จอง', async () => { const s = await partsScreen('S5 สรุปรายการ', { picked: [0, 1, 2, 3, 4] }); await partsSummary(s, { stock: 3, buy: 2 }); return s; }],
    ['ผลจอง — คงเหลือไม่พอ 2 รายการ', () => partsScreen('S5 อะไหล่ขาด', { picked: [0, 1, 2, 3, 4], result: 'short' })],
    ['อะไหล่พร้อมครบ — เลือกรูปแบบดำเนินการ', () => partsScreen('S5 อะไหล่พร้อม', { picked: [0, 1, 2, 3, 4], result: 'ok' })]]],
  ['S6 · กบค. ทำแผนเดินทาง (ตรวจเอง)', [
    ['แผนเดินทางของแผนนี้ (ยังไม่มี)', () => tripList('S6 แผนเดินทาง (ว่าง)', { rows: [] })],
    ['ฟอร์มสร้างแผนเดินทาง (ว่าง)', () => tripForm('S6 ฟอร์มแผนเดินทาง', {})],
    ['เลือกช่วงวันเดินทาง', () => tripForm('S6 เลือกช่วงวัน', { values: { place: TRIP.place }, dateOpen: true })],
    ['กดยืนยันโดยยังไม่ครบ', () => tripForm('S6 ยังไม่ครบ', { errors: true })],
    ['กรอกครบ', () => tripForm('S6 กรอกครบ', { values: TRIP_FILLED, sel: [0, 1, 4, 5] })],
    ['ยืนยันแล้ว — ส่ง Notification', async () => { const s = await tripList('S6 ยืนยันแล้ว', { rows: TRIPS }); notify(s, 'สร้างแผนเดินทางสำเร็จ · แจ้งเจ้าของรถและ กรย. แล้ว'); return s; }]]],
  ['S7 · ผู้รับจ้างทำแผนเดินทาง (ว่าจ้าง)', [
    ['งานที่ได้รับว่าจ้าง', () => roleList('S7 งานที่ได้รับว่าจ้าง', { title: 'งานที่ได้รับว่าจ้าง', search: 'ค้นหาเลขงาน, ชื่อแผน', cols: JOBS_COLS, rows: jobsRows('none') })],
    ['ฟอร์มสร้างแผนเดินทาง (ว่าง)', () => hireTripForm('S7 ฟอร์มว่าง', {})],
    ['กดยืนยันโดยยังไม่ครบ', () => hireTripForm('S7 ยังไม่ครบ', { errors: true })],
    ['กรอกครบ', () => hireTripForm('S7 กรอกครบ', { filled: true })],
    ['ส่งแล้ว — รอ กบค. ตรวจสอบ', async () => { const s = await roleList('S7 ส่งแล้ว', { title: 'งานที่ได้รับว่าจ้าง', search: 'ค้นหาเลขงาน, ชื่อแผน', cols: JOBS_COLS, rows: jobsRows('wait') }); notify(s, 'ส่งแผนเดินทางให้ กบค. ตรวจสอบแล้ว · แจ้งเจ้าของรถและ กรย. แล้ว'); return s; }]]],
  ['S8 · กบค. ตรวจสอบแผนเดินทางของผู้รับจ้าง', [
    ['แท็บรอตรวจสอบ', () => roleList('S8 รอตรวจสอบ', { title: 'แผนเดินทางผู้รับจ้าง', search: 'ค้นหาผู้รับจ้าง, เลขงาน', tabs: [['รอตรวจสอบ', 2], ['อนุมัติแล้ว', null], ['ปฏิเสธ', null]], cols: HT_COLS, rows: HT_ROWS.wait })],
    ['รายละเอียดแผนเดินทาง', () => hireTripReview('S8 รายละเอียด', {})],
    ['ปฏิเสธ — ระบุเหตุผล', async () => { const s = await hireTripReview('S8 ปฏิเสธ', {}); await reason(s, 'ปฏิเสธแผนเดินทาง', 'เหตุผลที่ปฏิเสธ', 'ช่วงวันชนกับแผนดับไฟของ กฟฉ.2 กรุณาเลื่อนเป็นสัปดาห์ถัดไป', 'ปฏิเสธ'); return s; }],
    ['ยืนยันอนุมัติแผนเดินทาง', async () => { const s = await hireTripReview('S8 ยืนยันอนุมัติ', {}); await confirm(s, { title: 'ยืนยันอนุมัติแผนเดินทาง', sub: CONTRACTOR + ' · ' + HTRIP.d1 + ' – ' + HTRIP.d2 + ' · ระบบจะแจ้ง กรย. ให้เตรียมอะไหล่', ok: 'อนุมัติ' }); return s; }],
    ['อนุมัติแล้ว — แจ้ง กรย.', async () => { const s = await roleList('S8 อนุมัติแล้ว', { title: 'แผนเดินทางผู้รับจ้าง', search: 'ค้นหาผู้รับจ้าง, เลขงาน', tabs: [['รอตรวจสอบ', 1], ['อนุมัติแล้ว', null], ['ปฏิเสธ', null]], tab: 1, cols: HT_COLS, rows: [HT_ROWS.wait[0]].concat(HT_ROWS.ok) }); notify(s, 'อนุมัติแผนเดินทางสำเร็จ · แจ้ง กรย. ให้เตรียมอะไหล่แล้ว'); return s; }]]],
  ['S9 · กรย. เตรียมอะไหล่ไว้ที่จุดรวมงาน', [
    ['แผนเดินทางที่ต้องเตรียมอะไหล่', () => roleList('S9 รายการ', { title: 'เตรียมอะไหล่ตามแผนเดินทาง', search: 'ค้นหาเลขงาน, จุดรวมงาน', cols: PREP_COLS, rows: prepRows('new') })],
    ['รายละเอียด + อะไหล่ที่ต้องวาง', () => prepDetail('S9 รายละเอียด', {})],
    ['รับทราบแผนแล้ว', async () => { const s = await prepDetail('S9 รับทราบแล้ว', { st: 'ack' }); notify(s, 'รับทราบแผนเดินทางแล้ว'); return s; }],
    ['ยืนยันเตรียมอะไหล่แล้ว', async () => { const s = await prepDetail('S9 ยืนยันเตรียมแล้ว', { st: 'ack' }); await confirm(s, { title: 'ยืนยันเตรียมอะไหล่แล้ว', sub: 'อะไหล่ ' + PARTS.length + ' รายการวางไว้ที่ ' + TRIP.place + ' · กบค. จะเห็นสถานะนี้', ok: 'ยืนยัน' }); return s; }],
    ['เตรียมแล้ว', async () => { const s = await prepDetail('S9 เตรียมแล้ว', { st: 'ready' }); notify(s, 'บันทึกการเตรียมอะไหล่สำเร็จ'); return s; }]]],
  ['S10 · กบค./ผู้รับจ้าง บันทึกงานบำรุงรักษารายคัน', [
    ['รายการรถตามแผนเดินทาง', () => workList('S10 รายการรถ', {})],
    ['บันทึกงาน (ว่าง)', () => workForm('S10 บันทึกงาน', {})],
    ['บำรุงรักษาไม่ได้ — ระบุสาเหตุ', () => workForm('S10 ทำไม่ได้', { cannot: true, reason: 'รถติดภารกิจซ่อมสายส่งฉุกเฉิน ไม่อยู่ที่หน่วยงานในวันนัด' })],
    ['กดบันทึกโดยยังไม่ครบ', () => workForm('S10 ยังไม่ครบ', { errors: true })],
    ['กรอกครบ', () => workForm('S10 กรอกครบ', { filled: true })],
    ['บันทึกสำเร็จ', async () => { const s = await workList('S10 บันทึกสำเร็จ', { done: [0] }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['ดูงานที่บันทึกแล้ว — ภาพก่อน/หลัง', () => workDetail('S10 งานที่บันทึกแล้ว', {})]]],
  ['S11 · กบค. ตรวจสอบงานจากผู้รับจ้างและรับคืนอะไหล่', [
    ['งานที่ผู้รับจ้างส่งมา', () => roleList('S11 รายการ', { title: 'งานบำรุงรักษาที่ผู้รับจ้างส่งมา', search: 'ค้นหาทะเบียน, ผู้รับจ้าง', cols: CHK_COLS, rows: chkRows('wait') })],
    ['รายละเอียดงาน + รับคืนอะไหล่', () => hireWorkCheck('S11 รายละเอียด', {})],
    ['ส่งกลับแก้ไข — ระบุเหตุผล', async () => { const s = await hireWorkCheck('S11 ส่งกลับ', {}); await reason(s, 'ส่งกลับให้ผู้รับจ้างแก้ไข', 'เหตุผลที่ส่งกลับ', 'ภาพจุดที่บำรุงรักษาไม่ชัด กรุณาถ่ายใหม่ให้เห็นอะไหล่ใหม่', 'ส่งกลับ'); return s; }],
    ['ยืนยันผลตรวจสอบและรับคืนอะไหล่', async () => { const s = await hireWorkCheck('S11 ยืนยัน', {}); await confirm(s, { title: 'ยืนยันผลตรวจสอบ', sub: 'งานของ ' + V[0] + ' ผ่าน · รับคืนอะไหล่ 3 รายการเข้าคลัง', ok: 'ยืนยัน' }); return s; }],
    ['บันทึกผลตรวจสอบสำเร็จ', async () => { const s = await roleList('S11 บันทึกแล้ว', { title: 'งานบำรุงรักษาที่ผู้รับจ้างส่งมา', search: 'ค้นหาทะเบียน, ผู้รับจ้าง', cols: CHK_COLS, rows: chkRows('pass') }); notify(s, 'บันทึกผลตรวจสอบและรับคืนอะไหล่สำเร็จ'); return s; }]]],
  ['S12 · กบค. บันทึกผลตรวจน้ำมันไฮโดรลิก', [
    ['งานรายคัน — รอผลตรวจน้ำมัน', () => workDetail('S12 รอผลตรวจ', { oilBtn: true })],
    ['ฟอร์มบันทึกผลตรวจ (ว่าง)', () => oilForm('S12 ฟอร์มผลตรวจ', {})],
    ['กรอกครบ', () => oilForm('S12 กรอกครบ', { v: true })],
    ['บันทึกสำเร็จ — แจ้งเจ้าของรถ', async () => { const s = await workDetail('S12 บันทึกสำเร็จ', { oil: true }); notify(s, 'บันทึกผลตรวจน้ำมันไฮโดรลิกสำเร็จ · แจ้งเตือนเจ้าของรถแล้ว'); return s; }]]],
  ['S13 · หน่วยงาน/เจ้าของรถ ยอมรับผลการตรวจบำรุงรถรายคัน', [
    ['รายการรอตรวจสอบ', () => roleList('S13 รายการ', { title: 'การตรวจบำรุงรถรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขงาน', cols: ACC_COLS, rows: accRows({}) })],
    ['ผลการตรวจบำรุงรถรายคัน', () => carResult('S13 รายคัน', {})],
    ['คันที่บำรุงรักษาไม่ได้ — สาเหตุ', () => carResult('S13 ทำไม่ได้', { cannot: true })],
    ['ยืนยันยอมรับผล', async () => { const s = await carResult('S13 ยืนยัน', {}); await confirm(s, { title: 'ยืนยันยอมรับผลการตรวจบำรุงรถ', sub: V[0] + ' · บำรุงรักษาวันที่ 04/11/2569', ok: 'ยอมรับผล' }); return s; }],
    ['ยอมรับผลแล้ว', async () => { const s = await roleList('S13 ยอมรับแล้ว', { title: 'การตรวจบำรุงรถรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขงาน', cols: ACC_COLS, rows: accRows({ accepted: [0] }) }); notify(s, 'ยอมรับผลการตรวจบำรุงรถ ' + V[0] + ' สำเร็จ'); return s; }]]],
  ['S14 · หน่วยงาน/เจ้าของรถ ตรวจสอบหลักฐานและประเมินความพึงพอใจ (ครบทุกคัน)', [
    ['รายการ — ครบทุกคันแล้ว', () => roleList('S14 รายการ', { title: 'การตรวจบำรุงรถรอตรวจสอบ', search: 'ค้นหาทะเบียน, เลขงาน', cols: ACC_COLS, rows: accRows({ plan: 'wait', accepted: [0, 1, 2] }) })],
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
    ['รายการประวัติรอตรวจสอบ', () => roleList('S16 รายการ', { title: 'ประวัติรอตรวจสอบ', search: 'ค้นหาเลขงาน, ชื่อแผน', cols: HQ_COLS, rows: hqRows('wait') })],
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
];


/* ---------- จอ ↔ กล่องในผัง userflow (เจ้าของงานสั่ง 22 ต.ค. 2569: userflow กับ wireframe อยู่ข้างกันตอน export) ----------
   ชื่อ state → id กล่องในผัง mermaid ของ Diagram/01-บำรุงรักษาตามวาระ/14-บำรุงรักษา-userflow.md (คั่นด้วยช่องว่างได้หลายกล่อง)
   ไม่ใส่ = ผังยังไม่มีกล่องของจอนี้ ⇒ ปลั๊กอินเขียนบอกใต้ผัง "จอที่ยังไม่มีกล่องในผัง" (รอเติม userflow — ไม่เติมผังเอง) */
const FLOW_NODES = {
  S1: { 'รายการแผน': 'D1', 'ฟอร์มสร้างแผน (ว่าง)': 'D2', 'เลือกภาค — รายการภาคเปิด': 'A3', 'เลือกภาค + ประเภทรถ — แสดงรถที่เข้าเงื่อนไข': 'D4', 'ติ๊กเอารถออก — คำนวณอะไหล่ใหม่': 'A4 D3', 'กดบันทึกโดยยังไม่ครบ': 'Q1', 'บันทึกสำเร็จ — รอ ผพจ. ตรวจสอบ': 'A5' },
  S4: { 'รายการรถในแผน — มีรถสถานะโอน': 'D1', 'ยืนยันนำรถออกจากแผน': 'A2', 'นำรถออกแล้ว': 'A2', 'ยืนยันจำนวนรถ': 'A4' },
  S5: { 'คลังอะไหล่ + อะไหล่ตามแผน (ยังไม่เลือก)': 'D1', 'ค้นหาอะไหล่ไม่พบ': 'D1', 'ระบบคลังอะไหล่ขัดข้อง': 'D1', 'เลือกอะไหล่ครบตามแผน': 'A2', 'สรุปรายการเบิก/จอง': 'D2', 'ผลจอง — คงเหลือไม่พอ 2 รายการ': 'D3', 'อะไหล่พร้อมครบ — เลือกรูปแบบดำเนินการ': 'D4' },
  S6: { 'แผนเดินทางของแผนนี้ (ยังไม่มี)': 'D1', 'ฟอร์มสร้างแผนเดินทาง (ว่าง)': 'D2', 'เลือกช่วงวันเดินทาง': 'A2', 'กดยืนยันโดยยังไม่ครบ': 'Q1', 'กรอกครบ': 'A4', 'ยืนยันแล้ว — ส่ง Notification': 'D3' },
  S10: { 'รายการรถตามแผนเดินทาง': 'D1', 'บันทึกงาน (ว่าง)': 'D2', 'บำรุงรักษาไม่ได้ — ระบุสาเหตุ': 'A3', 'กดบันทึกโดยยังไม่ครบ': 'Q2', 'กรอกครบ': 'A8', 'บันทึกสำเร็จ': 'A9' },
  S12: { 'งานรายคัน — รอผลตรวจน้ำมัน': 'D1', 'ฟอร์มบันทึกผลตรวจ (ว่าง)': 'D2', 'กรอกครบ': 'A2', 'บันทึกสำเร็จ — แจ้งเจ้าของรถ': 'D3' },
  S15: { 'ความคืบหน้ารายคัน (ยังไม่ครบ)': 'D1', 'ครบทุกคัน — ประวัติงานบำรุงรักษา': 'D2', 'ยืนยันส่งประวัติ': 'A2', 'ส่งแล้ว — รอหัวหน้าตรวจสอบ': 'D3' },
  S17: { 'รายงานผล (ประวัติผ่านแล้ว)': 'D2', 'ยืนยันปิดงาน': 'Q1', 'ปิดงานแล้ว': 'D3' },
  S18: { 'ต้นทุนการบำรุงรักษา + Summary': 'D2 D3', 'ดาวน์โหลด Excel แล้ว': 'A3' },
  S2: { 'รายการแผนรอตรวจสอบ': 'D1', 'รายละเอียดแผน + รถ + อะไหล่': 'D2', 'ส่งกลับแก้ไข — ระบุเหตุผล': 'A3', 'ส่งกลับแล้ว': 'D3', 'ยืนยันอนุมัติแผน': 'A5', 'อนุมัติแผนสำเร็จ': 'D4' },
  S3: { 'แผนอนุมัติแล้ว — รอออกเลขงาน': 'D1', 'ยืนยันออกเลขงาน': 'A1', 'ออกเลขงานแล้ว — ส่งให้หัวหน้า ผพจ.': 'D2', 'หัวหน้า ผพจ. — ตรวจรายการอะไหล่': 'D3', 'หัวหน้า ผพจ. — ส่งกลับ ระบุเหตุผล': 'A4', 'ฟอร์มใบสั่งซื้อ (PO)': 'A6', 'บันทึกใบ PO สำเร็จ': 'D4' },
  S7: { 'งานที่ได้รับว่าจ้าง': 'D1', 'ฟอร์มสร้างแผนเดินทาง (ว่าง)': 'D2', 'กดยืนยันโดยยังไม่ครบ': 'Q1', 'กรอกครบ': 'A2', 'ส่งแล้ว — รอ กบค. ตรวจสอบ': 'D4' },
  S8: { 'แท็บรอตรวจสอบ': 'D1', 'รายละเอียดแผนเดินทาง': 'D2', 'ปฏิเสธ — ระบุเหตุผล': 'A3', 'ยืนยันอนุมัติแผนเดินทาง': 'A4', 'อนุมัติแล้ว — แจ้ง กรย.': 'D4' },
  S9: { 'แผนเดินทางที่ต้องเตรียมอะไหล่': 'D1', 'รายละเอียด + อะไหล่ที่ต้องวาง': 'D1', 'รับทราบแผนแล้ว': 'A1', 'ยืนยันเตรียมอะไหล่แล้ว': 'A5', 'เตรียมแล้ว': 'A4' },
  S11: { 'งานที่ผู้รับจ้างส่งมา': 'D1', 'รายละเอียดงาน + รับคืนอะไหล่': 'D2', 'ส่งกลับแก้ไข — ระบุเหตุผล': 'A3', 'ยืนยันผลตรวจสอบและรับคืนอะไหล่': 'A4', 'บันทึกผลตรวจสอบสำเร็จ': 'A6' },
  S13: { 'รายการรอตรวจสอบ': 'D1', 'ผลการตรวจบำรุงรถรายคัน': 'D2', 'คันที่บำรุงรักษาไม่ได้ — สาเหตุ': 'D2', 'ยืนยันยอมรับผล': 'A3', 'ยอมรับผลแล้ว': 'D3' },
  S14: { 'รายการ — ครบทุกคันแล้ว': 'D1', 'หลักฐานทั้งแผน — ยังไม่ประเมิน': 'D2', 'ประเมินความพึงพอใจแล้ว': 'A3', 'ยืนยันยอมรับผลทั้งแผน': 'A4', 'ยอมรับผลทั้งแผนแล้ว': 'D3' },
  S16: { 'รายการประวัติรอตรวจสอบ': 'D1', 'ประวัติงานบำรุงรักษาของแผน': 'D2', 'ตีกลับ — ระบุเหตุผล': 'A3', 'ยืนยันอนุมัติประวัติ': 'A4', 'อนุมัติประวัติแล้ว': 'D4' },
};

/* ---------- กลุ่ม = scenario (แพทเทิร์นเดียวกับ Overhaul — เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก · แถว Desktop แล้ว Mobile) ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GROUPS = SCENARIOS.map(([title, screens], i) => {
  const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  const map = FLOW_NODES[tag] || {};
  return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens: screens.map(([label, fn]) => [label, fn, map[label] || '']) }] };
});

/* ---------- สร้าง (ปุ่มชุดเดียวกับ Overhaul 21 ต.ค. 2569: ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component) ----------
   เจ้าของงานสั่ง 22 ต.ค. 2569 "จะเอาลงในเพจ Maintainance ด้วยกันเลย" ⇒ ทุกปุ่มวางบนหน้า "Maintainance" (ไม่มีก็สร้าง) ต่อใต้ของเดิม ไม่ลบ/ไม่ย้ายของที่มีอยู่
   แต่ละบล็อก scenario = ผัง userflow ซ้ายสุด + ป้าย Device + คอลัมน์จอ A.1 A.2 … (แถว Desktop แล้ว Mobile ตามที่เลือก) */
const PAGE_NAMES = ['Maintainance', 'Maintenance'];
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
  const tp = await namedPage(PAGE_NAMES);
  const page = tp.page;
  log(tp.found ? 'วางบนหน้า "' + page.name + '" ต่อใต้ของเดิม — ของที่มีอยู่บนหน้านี้ไม่ถูกแตะ'
    : tp.fallback ? '⚠ หาหน้า "Maintainance" ไม่เจอและสร้างหน้าใหม่ไม่ได้ (แพลนจำกัดจำนวนหน้า) — วางต่อใต้ของเดิมในหน้า "' + page.name + '" ไม่ลบอะไร'
    : 'ไม่พบหน้า "Maintainance" — สร้างหน้าใหม่ชื่อนี้แล้ววางลงไป');
  await figma.setCurrentPageAsync(page);
  let y = 0;
  page.children.forEach(n => { if (n.absoluteBoundingBox) y = Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + 400); });
  if (y) log('ของเดิมบนหน้านี้สูงถึง y=' + Math.round(y - 400) + ' — ชุดนี้เริ่มที่ y=' + Math.round(y));
  const TOTAL = SCEN.reduce((a, x) => a + x[1].length, 0);
  log(INDEX.has('Header') ? 'แถบรหัส flow: component Header ของทีมออกแบบ' : 'แถบรหัส flow: ไม่พบ component Header ในไฟล์ — วาดแถบธรรมดาสีเดียวกันแทน');
  const { made, flows } = await buildGrid(page, PLUGIN.prefix, GRP, y, TOTAL * devices.length, { devices });
  let instances = 0, loose = 0;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') loose++;
  }
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 6));
  log('');
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
  const tp = await namedPage(PAGE_NAMES); const page = tp.page;
  await figma.setCurrentPageAsync(page);
  let y = 0;
  page.children.forEach(n => { if (n.absoluteBoundingBox) y = Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + 600); });
  const screens = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0 && !/ · mobile$/.test(n.name));
  log('วางบนหน้า "' + page.name + '" ต่อใต้ของเดิม (y=' + Math.round(y) + ') · จอ desktop บนหน้านี้ ' + screens.length + ' จอ (ใช้ทำภาพย่อ)');
  const frameFor = (code) => screens.find(f => f.name.indexOf(PLUGIN.prefix + ' / ' + code + ' · ') === 0) || null;   // ชุดล่าสุดอยู่บนสุดของแผง Layers
  const r = await buildJourney(page, PLUGIN.prefix, y, { codes: journeyCodes, frameFor });
  log('');
  log('journey: ผัง ' + r.made + ' scenario · ลูกศรเชื่อม ' + r.links + ' เส้น · ภาพย่อจอ ' + r.thumbs + '/' + r.slots + ' กล่อง' + (r.thumbs < r.slots ? ' (กล่องที่ไม่มีภาพ = ยังไม่มีจอนั้นบนหน้า — กดสร้าง Desktop ก่อนแล้วกดปุ่มนี้ใหม่)' : '') + ' · กว้าง ' + Math.round(r.w) + ' px');
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· สลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด');
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
  const first = page.children.find(n => n.name.indexOf(PLUGIN.prefix + ' · Journey') === 0); if (first) figma.viewport.scrollAndZoomIntoView([first]);
}

figma.ui.onmessage = async (msg) => {
  try {
    const o = { devices: msg.devices, pick: msg.pick };
    if (msg.type === 'build') await build(o);
    if (msg.type === 'build-desktop') await buildDesktop();
    if (msg.type === 'build-mobile') await buildMobile();
    if (msg.type === 'build-pick') await buildPick(o);
    if (msg.type === 'build-journey') await buildJourneyAll();
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก"
