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
  "paid-24-300-round": ["3f83a333cb688dd77b4f3702646969ca0591bd02", false],   // ไอคอนนำช่องประเภทงบประมาณ (29 ต.ค. 2569 · ไลบรารี component หน้า 21:163)
  "account_balance-24-300-round": ["48c0cb9ff8ec9c4c6c9a2be469bcd54a12742890", false],   // ไอคอนนำช่องศูนย์ต้นทุน
  "Toggle with description": ["3d62d45097c0e86cf73f73500c668e528a3fa734", false],   // สวิตช์ "มีการรับประกันงานซ่อม" หน้าปิดงาน (30 ต.ค. 2569)
  "Date picker": ["aec5697b4e4cea8ef26f19f2803c0518c8d44498", true],   // S16 ปฏิทินเลือกวันตอบรับ (Single) · ช่วงวันที่สะดวกตอนปฏิเสธ (Dual) — key เดียวกับ plugin-lib/core.js
  "Radio text card": ["e4510738f989bb24dbfb70fe6acfbf5705dcd60b", true],
  "Checkbox with description": ["dfc323f6bb605f586c4928ecb08c77acfb241f53", false],   // S18 ฟอร์มส่งออก: เลือกหัวข้อที่รวมในไฟล์ (key เดียวกับปลั๊กอินบำรุงรักษา)
  "download-24-300-round": ["336f0dff014c26316e0fa56959bc75f09f71531d", false],   // S18 ปุ่ม ส่งออก PDF / Excel (ไลบรารี component หน้า 21:163)   // S16 เลือก ตอบรับ / ปฏิเสธนัดหมาย (30 ต.ค. 2569 · ชุดเดียวกับปลั๊กอินบำรุงรักษา · งานซ่อมใช้ใน Select Repair Method)
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
  "Images": ["39fe2574c3dcfeebe3eded7a76fecbc04ee41ef7", true],
  "Metric item": ["5e82119aab7dc5401c7f5940b7a500339ace506a", true],   // Dashboard งาน Overhaul (21 ต.ค. 2569) — หน้า Metrics ของไลบรารี (Number · Text · Breakpoint · Featured icon ซ้อน)   // lightbox รูปแนบความคืบหน้าบนมือถือ (PO CF หน้า 5 · 21 ต.ค. 2569) — ชุดเดียวกับที่ซ้อนใน Modal Type=Centered image carousel
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
  'paid-24-300-round', 'account_balance-24-300-round', 'Toggle with description', 'Radio text card', 'Date picker', 'Checkbox with description', 'download-24-300-round',
  // mobile (19 ต.ค. 2569)
  'Mobile table', 'Mobile progress steps', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header',
  // dashboard (21 ต.ค. 2569)
  'Metric item', 'Tabs', 'Tab item', 'Featured icon'];
/* ตัวที่ใช้แค่เป็นชิ้นซ้อนใน component อื่น (แก้ property ของตัวที่ซ้อนอยู่) — ขาดได้ไม่หยุด
   (เช่น _Dropdown menu item ที่ Figma ไม่ publish เพราะชื่อขึ้นต้น "_" · Primary danger button ที่มากับ Modal Destructive) */
const NESTED = ['Nav button', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button',
  'Primary danger button', '_Dropdown menu item', 'Dropdown list item', '_Content item base', '_File upload item base',
  'List with checkbox item', 'List header item', 'Checkbox', 'Card form row', 'Badge outline', 'Mobile table item', 'Step circles / 5 steps',
  '_Notification item base', 'Status', 'Images'];   // ชิ้นใน Notification card (20 ต.ค. 2569) · Images = lightbox มือถือ (ไม่มี ⇒ ข้ามจอนั้น + รายงาน)
/* component ในตัวไฟล์ Maintain-D (ไม่อยู่ในไลบรารี) — ไฟล์อื่นไม่มี ⇒ ไม่หยุด ใช้แบบเดิมแทนแล้วรายงาน */
const LOCAL_OPTIONAL = ['RepairAppointmentStep', 'ReceiptChecklist', 'HandoverSignature', 'Modal Signature', 'Device Type', 'Component 1', 'Header'];   // Device Type = ป้าย Device/Desktop/Mobile ของทีมออกแบบ (20 ต.ค. 2569 · แทน Component 1 ที่เก็บไว้เป็นตัวสำรอง) · Header = แถบรหัส flow (ไลบรารีอื่น หาจาก instance ในไฟล์)
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
  if (list.indexOf('Table') >= 0) { const b = await probeTable(); if (b) log('· Table ในไลบรารี: "' + b.name + '" ' + b.cols + ' คอลัมน์ × ' + b.rows + ' แถว' + (b.all.length > 1 ? ' (variant: ' + b.all.join(' · ') + ')' : '') + (LIB_TABLE.cols >= PLAN_COLS_D.length ? ' ⇒ หน้ารายการแผนตามจอเจ้าของงาน ' + PLAN_COLS_D.length + ' คอลัมน์' : ' ⇒ ไลบรารีมีแค่ ' + LIB_TABLE.cols + ' คอลัมน์ หน้ารายการแผนยุบ หมายเลขแผน/ชื่อแผน เป็นช่องเดียว (สำรอง)')); }
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
/* ชื่อสถานะแผนตามที่ PO confirm (ชีตแท็บ "1 รายการแผน" อ่าน 21 ต.ค. 2569): ยังไม่มี PO → รอเลข PO · ดำเนินการ → รอดำเนินการ · เสร็จสิ้น คงเดิม
   แท็บ "Overhaul (PEA) 1 draft" คอลัมน์ status final ให้อีกชุด (กำลังดำเนินการ PO · อนุมัติ PO) ขัดกับแท็บหน้า — ยังไม่ใช้ รอเคาะ · ชื่อก่อน CF (ยังไม่มี PO · ดำเนินการ) ดูใน git ก่อน 21 ต.ค. */
const STATUS = { P1: ['รอเลข PO', 'Gray'], P2: ['รอดำเนินการ', 'Info'], P3: ['เสร็จสิ้น', 'Success'] };
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
/* PO ในแผน [หมายเลข, ชื่อ, อู่, จำนวนรถ, ปิดงานแล้ว, เริ่มสัญญา, สิ้นสุดสัญญา, ใกล้ครบสัญญา] — หน้า 2 CF 21 ต.ค. 2569: เพิ่มคอลัมน์ความคืบหน้า + ระยะสัญญา (ใกล้ครบ = บรรทัดรองสีแดง) */
const POS = [['PO-690101', 'ซ่อมระบบเครื่องยนต์', 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด', '2', 1, '1 ก.ย. 2569', '30 พ.ย. 2569', false],
  ['PO-690102', 'ซ่อมระบบไฮดรอลิกเครน', 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด', '1', 0, '15 ก.ย. 2569', '28 ต.ค. 2569', true],
  ['PO-690103', 'ซ่อมระบบแอร์', 'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', '1', 1, '1 ต.ค. 2569', '31 ธ.ค. 2569', false]];
/* รถใน PO [ทะเบียน, รุ่น · ประเภท, หน่วยงานเจ้าของรถ, เลขไมล์, อายุ, สถานะ V, รายละเอียดตามสถานะ, บรรทัดรอง] — หน้า 3 CF 21 ต.ค. 2569:
   PO ขอยุบ "วันนัดถัดไป · จำนวนวันที่อยู่อู่ · ประกันถึงวันที่" เป็นบรรทัดรองของสถานะ — Table cell Style=Badge ของไลบรารีมีแค่ Pill ไม่มีบรรทัดรอง
   ⇒ ใส่เป็นคอลัมน์ถัดจากสถานะ 1 คอลัมน์ (ค่าเปลี่ยนตามสถานะ) รวม 8 คอลัมน์พอดี component Table */
const CARS = [['8234 กค กทม', 'HINO FM2P · รถเครน 10 ตัน', 'กฟฟ.กทม.', '182,400', '12', 'V5', 'อยู่อู่ 12 วัน', 'รับรถ 9 ต.ค. 2569'],
  ['70-1123 ชลบุรี', 'HINO FG8J · รถเครน 5 ตัน', 'กฟฟ.ชลบุรี', '150,200', '11', 'V2', 'นัดเข้าอู่ 22 – 24 ต.ค. 2569', 'รอหน่วยงานตอบรับ']];
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
const CONTENT_W = () => (MOB ? VW() - 32 : 1296);
/* VIEW = จอดูอย่างเดียวของหน่วยงานเจ้าของรถ / กรย. (S17 · 30 ต.ค. 2569 · R30) — ปุ่มที่บทบาทนี้ไม่มีวันกดได้ ซ่อน ไม่ใช้ Disabled:
   หลัก "ผู้ใช้จะกดได้สักวันไหม" ไม่ได้ = ซ่อน · ได้แต่ยังไม่ครบเงื่อนไข = Disabled + บอกเหตุผล (Smashing Hidden vs Disabled 2024 · NN/g · USWDS 2023)
   ตามแบบ UI Release#2: หน้า User/Driver ของ Vehicle Breakdown ไม่มีปุ่มของ Admin · ตัวช่วยที่ดู VIEW: pageHead · section · sectionLabel · btnRow · tbl · job */
let VIEW = false;   // กว้างพื้นที่เนื้อหา (desktop = 1440 − sidebar − ขอบ · Metric 4 ใบพอดี 1296)

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
    Helper: !!(o.error || o.helper), 'Helper text': o.error || o.helper || '', 'Info icon': false, 'Leading icon': !!o.lead, 'Trailing icon': false,
    'Show Placeholder': !value });
  if (o.lead) setProps(n, { 'Leading icon swap': icon(typeof o.lead === 'string' ? o.lead : 'search-24-300-round') });
  return syncLabel(n, label, o.optional);
}
function dropdown(label, value, o) {   // Input dropdown
  o = o || {};
  const st = o.state || (o.error ? 'Error' : value ? 'Selected' : 'Default');
  const p = { 'Label text': label, Text: value || o.placeholder || 'เลือก', Optional: !!o.optional, Helper: !!o.error, 'Helper text': o.error || '',
    'Info icon': false, 'Leading icon': !!o.lead, Supporting: false };
  if (o.lead) p['Leading icon swap'] = icon(o.lead);
  return syncLabel(inst('Input dropdown', { State: st, Size: 'md' }, p), label, !!o.optional);
}
function area(label, value, o) {
  o = o || {};
  return syncLabel(inst('Text area', { State: o.error ? 'Error' : value ? 'Filled' : 'Default', Size: 'md' }, { 'Label text': label, Text: value || o.placeholder || '',
    Optional: !!o.optional, Helper: !!o.error, 'Helper text': o.error || '', 'Info icon': false, 'Trailing icon': false, 'Show Placeholder': !value }), label, o.optional);
}
async function section(title, o) {   // Section header + ปุ่มขวา
  o = o || {};
  if (VIEW) o = Object.assign({}, o, { buttons: [] });
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
  if (VIEW) o = Object.assign({}, o, { buttons: [] });
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
  if (base) { await text(base, 'Supporting text', o.hint || ((o.accept || 'PDF, JPG') + ' · สูงสุด 10 ไฟล์ · ' + files.length + '/10 ไฟล์')); }   // hint = คำใต้กล่องตามจอเจ้าของงาน (บล็อก B)
  const items = u.findAll(n => n.name === '_File upload item base');
  items.forEach((it, i) => {
    if (i >= files.length) { it.visible = false; return; }
    const f = files[i];
    setProps(it, { State: f.err ? 'Error' : f.progress ? 'In progress' : 'Completed' });   // f.progress = กำลังอัปโหลด · f.bar = แสดงแถบ 100% (บล็อก M ฉบับเจ้าของงาน)
    setProps(it, { 'File name': f.name, 'File size': f.err ? (f.errText || o.errText || 'อัปโหลดไม่สำเร็จ — รับเฉพาะไฟล์ PDF หรือ JPG') : f.size, 'Progress bar': !!(f.progress || f.bar),
      Actions: true, 'Download action': !f.err && !o.readonly, 'Delete action': !o.readonly });
  });
  return u;
}
/* ไอคอนท้ายแถว — Table cell / Mobile table item Style=Action icons มี 4 ช่อง View · Edit · Print · Delete · ROW_ICONS = ชุด ดู/แก้ไข/ลบ (ชีต CF "ICON Action" 21 ต.ค. เช้า) ตอนนี้ใช้แค่ใน patchTexts — ตารางรายการแผน/PO กลับเป็นปุ่ม "…" + เมนู (เจ้าของงาน 21 ต.ค. ค่ำ ดู menuAt)
   เปิดช่องตามจำนวนไอคอนเรียงซ้ายไปขวา แล้วสลับไอคอนในช่องเป็นของเรา (ดูรายละเอียด · แก้ไข · ลบ) */
const ICON_SLOTS = ['View', 'Edit', 'Print', 'Delete'];
const ROW_ICONS = ['quick_reference_all-24-300-round', 'stylus-24-300-round', 'delete-24-300-round'];
function fillIcons(cell, ic) {
  const on = {}; ICON_SLOTS.forEach((s, i) => { on[s] = i < ic.length; }); setProps(cell, on);
  const bs = cell.findAll(n => n.type === 'INSTANCE' && n.name === 'Tertiary button');
  ic.forEach((name, i) => { if (bs[i]) setProps(bs[i], { 'Leading icon swap': icon(name) }); });
}
const ERR_HEX = '#D92D20';   // error-600 ของ tokens.css — บรรทัดรอง "ใกล้ครบสัญญา" สีแดงตาม PO CF หน้า 2 (21 ต.ค. 2569)
function tintSub(cell, color) {   // ย้อมสีบรรทัดรอง (Supporting text) ของ Table cell / Mobile table item — แตะเฉพาะชั้นข้อความ ไม่แตะโครง instance
  const t = cell.findAll(n => n.type === 'TEXT' && n.name === 'Supporting text')[0];
  if (t) try { t.fills = [{ type: 'SOLID', color: rgbOf(color === 'error' ? ERR_HEX : color) }]; } catch (e) { warn('สีบรรทัดรอง', e); }
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
        fillIcons(it, acts[0].menu ? ['more_horiz-20-400-round'] : acts[0].icons);
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
        if (hasSub && v.subColor) tintSub(it, v.subColor);
      }
      else { setProps(it, { Style: i === 0 ? 'Lead text' : 'Text' }); setProps(it, { Header: head, Text: v == null ? '' : String(v), Supporting: false }); }
    });
    add(box, card, 'h');
  });
  return box;
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
  if (v && typeof v === 'object' && v.text != null) { setProps(cell, { Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' }); if (v.sub && v.subColor) tintSub(cell, v.subColor); return; }
  setProps(cell, { Text: v == null ? '' : String(v), Supporting: false });
}
/* ช่องตาราง 1 ช่อง — ใช้ทั้งกับ Table cell ที่ซ้อนใน Table (รีวิว 19 ต.ค. 2569) และ mobile */
function fillCell(cell, v, style, alt) {
  const st = cellStyle(v, style);
  setProps(cell, { Style: st, 'Alternating fills': alt });
  if (st === 'Badge') { const p = find(cell, 'Pill outline'); if (p) setProps(p, { Color: v.pill[1], Text: v.pill[0] }); }
  else if (st === 'Action icons') fillIcons(cell, v.menu ? ['more_horiz-20-400-round'] : v.icons);
  else if (st === 'Lead checkbox') {
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
/* ตาราง = instance ของ component "Table" (key f1bf4ff7… · รีวิว 19 ต.ค. 2569: เดิมประกอบเองจาก Table cell/Table header cell ⇒ ไม่มีกรอบตาราง)
   R25 (เจ้าของงานสั่ง 21 ต.ค. 2569 ค่ำ): ทุก scenario ที่มีตารางต้องดึง component นี้ **ทุกขนาด** ไม่ประกอบเองอีก — ไลบรารีมี 8 คอลัมน์ × 10 แถว
   ⇒ เกิน 8 คอลัมน์ต้องยุบเป็นช่อง 2 บรรทัด (Text + Supporting text) หรือตัดก่อนเรียก (ดู PLAN_COLS_D) · ซ่อนส่วนที่เกิน · ปิด Scrollbar · Pagination ตาม o.pagination
   cols ส่งเป็นฟังก์ชันได้ (คืนชุดคอลัมน์ตามอุปกรณ์ — desktop ยุบแล้ว / mobile ยังชุดเดิม จนกว่าจะสั่งทำ mobile) */
const LIB_TABLE = { cols: 8, rows: 10, variant: { 'Alternating fills': 'True' }, name: '', w: 0, probed: false };   // โครง Table ของไลบรารี ณ ตอนสร้าง (ค่าตั้งต้น = ฉบับ 19 ต.ค.) — probeTable() อ่านของจริง
/* อ่านโครง component Table จากไลบรารีจริงทุกครั้งที่สร้าง (เจ้าของงาน publish Table ที่มีมากกว่า 8 คอลัมน์ 21 ต.ค. 2569 ค่ำ "component มีแบบมากกว่า 8 column แล้ว")
   เลือก variant ที่มีคอลัมน์มากที่สุด (เท่ากันเอา Alternating fills=True) · จำนวนคอลัมน์นี้ตัดสินว่าหน้ารายการแผนแสดงทีละช่อง (≥ 13) หรือยุบ 2 บรรทัด (PLAN_COLS_CF) */
async function probeTable() {
  try {
    const set = await figma.importComponentSetByKeyAsync(KEYS.Table[0]);
    let best = null; const all = [];
    for (const v of set.children) {
      const cols = v.findAll(x => x.type === 'FRAME' && x.name === 'Column'), rows = cols[0] ? cols[0].children.filter(x => x.name === 'Table cell').length : 0;
      const alt = (v.variantProperties || {})['Alternating fills'] === 'True';
      all.push(v.name + ' = ' + cols.length + ' คอลัมน์');
      if (!best || cols.length > best.cols || (cols.length === best.cols && alt && !best.alt)) best = { cols: cols.length, rows, alt, variant: Object.assign({}, v.variantProperties || {}), name: v.name, w: Math.round(v.width), all };
    }
    if (best && best.cols) Object.assign(LIB_TABLE, { cols: best.cols, rows: best.rows, variant: best.variant, name: best.name, w: best.w, probed: true });
    return best;
  } catch (e) { warn('อ่านโครง Table จากไลบรารี', e); return null; }
}
async function tbl(cols, rows, o) {   // cols: [หัว, กว้าง, Style, เรียงได้] · ช่อง: ข้อความ | {text, sub} | {pill:[t,สี]} | {menu:1} | {icons:[..]} | {check:bool,text} | {progress, text}
  o = o || {};
  if (typeof cols === 'function') cols = cols();
  if (VIEW) ({ cols, rows } = viewTable(cols, rows));
  if (MOB) {
    const m = mobileCards(cols, rows); await flushCellText();
    if (!o.pagination) return m;
    const box = col('Table', [m], 20); add(box, await pagination(o.pagination, o.pageOpt), 'h'); return box;
  }
  if (cols.length > LIB_TABLE.cols || rows.length > LIB_TABLE.rows) warn('Table', 'R25: ' + cols.length + ' คอลัมน์ × ' + rows.length + ' แถว เกิน component Table ของไลบรารี (' + LIB_TABLE.cols + ' × ' + LIB_TABLE.rows + ') — ต้องยุบ/ตัดคอลัมน์หรือแบ่งหน้าก่อนเรียก (ไม่ประกอบเองแล้ว)');
  const fixedW = cols.reduce((a, c) => a + (c[1] || 0), 0), scroll = fixedW > CONTENT_W();   // กว้างรวมเกินพื้นที่ ⇒ เปิด Scrollbar ของ component + clip (ตารางเลื่อนแนวนอน เช่น รายการแผน 13 คอลัมน์)
  const t = inst('Table', LIB_TABLE.variant, { Scrollbar: scroll, Pagination: !!o.pagination });
  t.name = 'Table';
  if (scroll) { try { t.clipsContent = true; } catch (e) { warn('clip ตารางเลื่อนแนวนอน', e); } }
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
/* จอดูอย่างเดียว: ปุ่ม "…" (เมนู ดู/แก้ไข/ลบ) เหลือ "ดูรายละเอียด" อย่างเดียว ⇒ ไอคอนลูกศรขวาแบบตารางรายการรถ · ไอคอนแก้ไข/ลบ ตัด · คอลัมน์จัดการที่ว่างทั้งคอลัมน์ ตัดทิ้ง */
const EDIT_ICONS = ['stylus-24-300-round', 'delete-24-300-round'];
function viewTable(cols, rows) {
  rows = rows.map(r => r.map(v => v && v.menu ? { icons: ['keyboard_arrow_right-20-400-round'] }
    : v && v.icons ? (v.icons.filter(i => EDIT_ICONS.indexOf(i) < 0).length ? Object.assign({}, v, { icons: v.icons.filter(i => EDIT_ICONS.indexOf(i) < 0) }) : '') : v));
  const keep = cols.map((c, ci) => !!c[0] || rows.some(r => r[ci] !== '' && r[ci] != null));
  return { cols: cols.filter((_, ci) => keep[ci]), rows: rows.map(r => r.filter((_, ci) => keep[ci])) };
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
  if (VIEW) o = Object.assign({}, o, { primary: '', actions: o.viewActions || null });   // viewActions = ปุ่มที่ไม่แก้ข้อมูล (ส่งออก) คงไว้ให้บทบาทดูอย่างเดียว   // จอดูอย่างเดียว: ซ่อนปุ่มสร้าง/แก้ไข/ลบที่หัวหน้า
  const ph = inst('Page header', { Breakpoint: BP() }, { Title: o.title, 'Supporting text': false, Badge: !!o.badge,
    'Back action': !!o.back, 'Copy action': false, 'More actions': false, Actions: !!o.primary });
  const crumbs = [o.root || 'จัดการงาน Overhaul'].concat(o.crumbs || []);   // o.root = เมนูต้นทางอื่น (เช่น ข้อมูลยานพาหนะ ของหน้าประวัติการซ่อม)
  for (const [i, n] of ['Link 1', 'Link 2', 'Link 3'].entries()) {
    const l = find(ph, n); if (!l) continue;
    if (i < crumbs.length - 1) { const lk = find(l, 'Link'); if (lk) await text(l, lk, crumbs[i]); } else l.visible = false;
  }
  const tr = find(ph, 'Truncate link'); if (tr) tr.visible = false;
  const cur = find(ph, 'Current link'); if (cur) await text(cur, 'Link', crumbs[crumbs.length - 1]);
  if (crumbs.length === 1) { /* หน้าแรกของเมนู: ลิงก์ปัจจุบันคือชื่อเมนูเอง */ }
  if (o.badge) { const b = find(ph, 'Badge outline'); if (b) setProps(b, { Color: BADGE_OF[o.badge[1]] || 'Gray', Text: o.badge[0] }); }
  const acts = find(ph, 'Actions');
  if (acts && VIEW) acts.visible = false;   // จอดูอย่างเดียว: ซ่อนชั้นปุ่มของ Page header ตรงๆ ด้วย (นอกจาก property Actions=false)
  if (acts && o.primary) for (const b of acts.children) {
    if (b.name !== 'Primary button') { b.visible = false; continue; }
    // o.primaryIcon === false = ปุ่มไม่มีไอคอน (S16 "ยืนยันตอบกลับ" ตามหน้าตอบรับนัดหมายของงานซ่อม) · o.primaryDisabled = ยังกดไม่ได้
    if (o.primaryIcon === false) setProps(b, { Text: o.primary, 'Leading icon': false, 'Trailing icon': false });
    else setProps(b, { Text: o.primary, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') });
    if (o.primaryDisabled) setProps(b, { State: 'Disabled' });
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
  if (VIEW) return null;   // จอดูอย่างเดียว: ไม่มีแถวปุ่มท้ายหน้า (ย้อนกลับใช้ Back action ของ Page header)
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
  ['Warning', 'ประกันของผู้รับจ้าง รถ 83-2210 นครราชสีมา (PO-680102 ตรีเพชรอีซูซุเซลส์) จะหมดวันที่ 5 พ.ย. 2569 เหลือ 15 วัน กรุณาแจ้ง กฟฟ.นครราชสีมา ให้สำรวจความสมบูรณ์ของรถ หากพบปัญหาให้นำรถเข้าเก็บงานก่อนหมดประกัน', 'วันนี้ 09:00', ''],   // N14 (22 ต.ค. 2569: เตือนทุกคนในหน่วยงาน กบค. ทางกระดิ่ง ก่อนหมด 30 และ 15 วัน · แจ้งเตือนอย่างเดียว ไม่มีปุ่ม · เฉพาะ Overhaul)
  ['Success', 'หน่วยงาน กฟฟ.กทม. ยืนยันรับรถ 8234 กค กทม วันที่ 9 พ.ย. 2569 เตรียมปิดงาน', 'เมื่อวาน 15:30', ''],
  ['Brand', 'แผน 123456 Overhaul ประจำปีงบ 2569 — รถเครน เสร็จสิ้น รถทั้ง 3 คันปิดงานแล้ว', '2 วันที่แล้ว', ''],
];
/* S15 แจ้งเตือนประกันงานซ่อมใกล้หมด (30 ต.ค. 2569) — รถคันเดียวกับหน้ารายคันหลัง Overhaul (72-6648 สงขลา ปิดงาน 5 ต.ค. 2569 + 360 วัน = 30 ก.ย. 2570)
   เตือน 31 ส.ค. 2570 (เหลือ 30 วัน) และ 15 ก.ย. 2570 (เหลือ 15 วัน) · กบค. (N14) บอกให้แจ้งหน่วยงาน · เจ้าของรถ (N15) บอกให้สำรวจรถเอง แล้วแจ้ง กบค. ถ้าพบปัญหา */
const warnNoti = (to, left, when) => [left <= 15 ? 'Error' : 'Warning', to === 'kbk'
  ? 'ประกันของผู้รับจ้าง รถ 72-6648 สงขลา (PO-690201 มิตซูบิชิ ฟูโซ่) จะหมดวันที่ 30 ก.ย. 2570 เหลือ ' + left + ' วัน กรุณาแจ้ง กฟฟ.สงขลา ให้สำรวจความสมบูรณ์ของรถ หากพบปัญหาให้นำรถเข้าเก็บงานก่อนหมดประกัน'
  : 'ประกันงานซ่อม Overhaul รถ 72-6648 สงขลา จะหมดวันที่ 30 ก.ย. 2570 เหลือ ' + left + ' วัน กรุณาสำรวจความสมบูรณ์ของรถ หากพบปัญหาให้แจ้ง กบค. เพื่อนำรถเข้าเก็บงานกับผู้รับจ้างก่อนหมดประกัน', when, ''];
const OWN_CLOSED = ['Success', 'งาน Overhaul รถ 72-6648 สงขลา ปิดงานแล้ว ดูรายการอะไหล่ที่ใช้ได้', '5 ต.ค. 2569', ''];   // N10 ฝั่งเจ้าของรถ
const WARN_NOTI = {
  kbk30: [warnNoti('kbk', 30, 'วันนี้ 09:00'), NOTI_ITEMS[3], NOTI_ITEMS[4]],
  kbk15: [warnNoti('kbk', 15, 'วันนี้ 09:00'), NOTI_ITEMS[3], NOTI_ITEMS[4], warnNoti('kbk', 30, '15 วันที่แล้ว')],
  own30: [warnNoti('own', 30, 'วันนี้ 09:00'), OWN_CLOSED],
  own15: [warnNoti('own', 15, 'วันนี้ 09:00'), warnNoti('own', 30, '15 วันที่แล้ว'), OWN_CLOSED],
};
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
    if (inp) setProps(inp, { 'Label text': f.label, Text: f.value || f.placeholder || '', Optional: !!f.optional, Helper: false, 'Info icon': false, 'Show Placeholder': !f.value });
    if (inp) syncLabel(inp, f.label, f.optional);   // ป้ายที่เห็นคือ Input label ที่ซ้อน (R4) · optional ⇒ "(ถ้ามี)"
  });
  const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && n.parent.name === 'Actions');
  ft.forEach(b => {
    if (b.name === 'Primary button') setProps(b, { Text: 'บันทึก', 'Leading icon': false, 'Trailing icon': false });
    else if (b.name === 'Secondary button') setProps(b, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
    else b.visible = false;
  });
}
/* lightbox รูปแนบของความคืบหน้า (PO CF หน้า 5 · 21 ต.ค. 2569 "ทำเป็น Lightbox ขึ้นมาก็ได้") — desktop = Modal Type=Centered image carousel ของไลบรารี (รูป + จุดเลื่อน + หัว) ซ่อนแถวปุ่มท้าย
   · mobile = bottom sheet ใส่ component Images Size=sm (ไฟล์ที่ไม่มี Images ⇒ ข้าม + รายงาน) */
async function lightbox(scr, o) {
  if (MOB) {
    if (!INDEX.has('Images')) { warn('lightbox mobile', 'ไม่มี component Images ในไฟล์ — ข้าม'); return; }
    const img = inst('Images', { Size: 'sm', Type: 'Image' }, { 'Indicator pagination': true, Buttons: true });
    const r = await sheet(scr, { title: o.title, content: [img], ok: 'ปิด' });
    const ft = find(r.sh, 'Bottom sheet footer'); const sb = ft && find(ft, 'Secondary button'); if (sb) sb.visible = false;
    return;
  }
  const m = inst('Modal', { Type: 'Centered image carousel', Size: 'md' });
  overlay(scr, m, 0, 0);
  const hd = find(m, 'Modal header');
  if (hd) { await text(hd, 'Text', o.title); await text(hd, 'Supporting text', o.sub || ''); const fi = find(hd, 'Featured icon'); if (fi) fi.visible = false; }
  const ft = find(m, 'Modal footer'); if (ft) ft.visible = false;
}
/* ปุ่ม "…" ท้ายแถว + Dropdown menu — เจ้าของงานเคาะ 21 ต.ค. 2569 ค่ำ จากภาพจอจริง: "ตรงนี้จริงๆ มันเป็นจุด 3 จุด แล้ว action ถึงจะมีให้เลือกว่า view edit delete"
   ใช้กับ 2 ตาราง: รายการแผน · PO ("สร้างแผน สร้าง PO 2 ตาราง") แทนชีต CF "ขอเป็น ICON Action" (R21 ฉบับใหม่ · R23 แบบเจ้าของงานเหนือชีต) · ตารางอื่นคงไอคอนตรง (S9 ดินสอ/ถังขยะตามจอ J · อะไหล่ · ลูกศร) */
const MENU = [['ดูรายละเอียด', 'quick_reference_all-24-300-round'], ['แก้ไข', 'stylus-24-300-round'], ['ลบ', 'delete-24-300-round']];
const firstMenuCell = (scr) => scr.findAll(n => n.type === 'INSTANCE' && n.name === 'Table cell' && n.variantProperties && n.variantProperties.Style === 'Action icons')[0];
function menuAt(scr, anchor, items) {   // Dropdown menu ใต้ปุ่ม "…" · mobile = bottom sheet ที่มีรายการเมนู
  const fill = (m) => { hide(m, '_Dropdown menu header'); const list = (find(m, 'Menu items') || m).children; const want = { 0: items[0], 1: items[1], 3: 'divider', 4: items[2] };
    list.forEach((it, i) => { const w = want[i]; if (!w) { it.visible = false; return; } if (w !== 'divider') setProps(it, { Text: w[0], Shortcut: false, Icon: true, 'Icon swap': icon(w[1]) }); }); };
  if (MOB) {
    overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), VH());
    const sh = frame('Sheet', 'VERTICAL', { fill: WHITE, pad: [0, 0] }); sh.topLeftRadius = sh.topRightRadius = 24;
    overlay(scr, sh, 0, 0); sh.counterAxisSizingMode = 'FIXED'; sh.resize(VW(), sh.height);
    const hd = inst('Bottom sheet header'); add(sh, hd, 'h'); const ta = find(hd, 'Text and action'); if (ta) ta.visible = false; const dv = find(hd, 'Divider'); if (dv) dv.visible = false;
    const m = inst('Dropdown menu'); add(sh, m, 'h'); fill(m);
    m.strokes = []; sh.y = VH() - sh.height;
    return m;
  }
  const m = inst('Dropdown menu'); fill(m);
  overlay(scr, m, 0, 0);
  if (anchor) {
    const sb = scr.absoluteBoundingBox, ab = anchor.absoluteBoundingBox;
    let right = ab.x - sb.x + ab.width;
    let clip = anchor.parent; while (clip && clip !== scr && !(clip.type === 'INSTANCE' && clip.name === 'Table' && clip.clipsContent)) clip = clip.parent;   // ตารางเลื่อนแนวนอน (13 คอลัมน์): ช่อง … อาจอยู่นอกส่วนที่เห็น
    if (clip && clip !== scr) { const cb = clip.absoluteBoundingBox; if (ab.x + ab.width > cb.x + cb.width) { right = cb.x - sb.x + cb.width; log('· เมนู "…": ช่องจัดการอยู่ในส่วนที่ต้องเลื่อนแนวนอน ⇒ วางเมนูชิดขอบขวาของตารางที่เห็น'); } }
    m.x = right - m.width - 16; m.y = ab.y - sb.y + ab.height - 8;
  }
  return m;
}
function comboAt(scr, anchor, items) {   // Dropdown list ใต้ช่องพิมพ์ค้น
  const l = inst('Dropdown list');
  const rows = l.children.filter(n => n.name === 'Dropdown list item');
  rows.forEach((it, i) => {
    if (i >= items.length) { it.visible = false; return; }
    setProps(it, { State: items[i][2] ? 'Selected' : 'Default' });
    setProps(it, { Text: items[i][0], 'Supporting text': items[i][1] || '', Avatar: false, 'Supporting 2': false, Supporting: !!items[i][1] });   // ไม่ส่งบรรทัดรอง = แถวเดียว (เลือกรถ S4: ทะเบียน+จังหวัดอย่างเดียว)
  });
  const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = false;
  overlay(scr, l, 0, 0);
  if (anchor) { const sb = scr.absoluteBoundingBox, ab = anchor.absoluteBoundingBox; l.resize(ab.width, l.height); l.x = ab.x - sb.x; l.y = ab.y - sb.y + ab.height + 4; }
}

/* ---------- หน้า 1 รายการแผน ---------- */
async function tableHeader(o) {
  const th = inst('Table header', { Breakpoint: BP() }, { 'Table title': false, Badge: false, 'Supporting text': false, 'More actions': false, Filters: !!(o.chips && o.chips.length) });
  const ti = find(th, 'Text input');
  if (ti) setProps(ti, { Label: false, Helper: false, 'Trailing icon': false, Text: o.query || o.placeholder || SEARCH_CF, State: o.query ? 'Filled' : 'Default' });   // ค่าเริ่มต้น = placeholder ฉบับ CF
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
  const tx = find(pg, 'Text'); if (tx && tx.type === 'TEXT') await text(pg, tx, 'แสดง 1 ถึง ' + Math.min(per, total) + '  จาก ' + total + ' รายการ');   // เว้นวรรค 2 ช่องก่อน "จาก" ตาม component และจอเจ้าของงาน (R23)
  const items = pg.findAll(x => x.name === 'Button groups pagination item');
  const nums = items.length - 2, labels = pages <= nums ? Array.from({ length: pages }, (_, k) => String(k + 1)) : ['1', '2', '...', String(pages - 1), String(pages)];   // เกิน 5 หน้า = 1 2 … 9 10 (จอเจ้าของงาน 21 ต.ค. ค่ำ)
  items.forEach((it, i) => {
    if (i === 0) setProps(it, { State: 'Disabled' });
    else if (i === items.length - 1) setProps(it, { State: pages > 1 ? 'Default' : 'Disabled' });
    else if (labels[i - 1]) setProps(it, { Number: labels[i - 1], State: i === 1 ? 'Hover/Active' : 'Default' });
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
    await text(es, 'Text', 'ยังไม่มีแผน Overhaul'); await text(es, 'Supporting text', 'สร้างแผน Overhaul เพื่อเพิ่ม Purchase Order และติดตามสถานะซ่อมของรถแต่ละคัน');
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
/* ---------- หน้า 2 ฟอร์มแผน ---------- */
/* แถววงเงิน + WBS: desktop วงเงินครึ่งซ้าย + กลุ่ม "WBS" ครึ่งขวา (3 ช่องเท่ากัน) — Figma รับ layoutGrow แค่ 0/1 จึงใช้ซ้อนกลุ่มแทนสัดส่วน 3:1:1:1
   · mobile เรียงลงต่อกันในแถวเดียว */
function wbsRow(budget, w) { return MOB ? row('Row', [budget].concat(w)) : row('Row', [budget, row('WBS', w)]); }
/* ประเภทงบประมาณ (เจ้าของงานสั่ง 29 ต.ค. 2569 "scen b อยากให้เลือกประเภทงบประมาณได้" + ภาพ 5 ประเภท · "เลือกงบประมาณอยู่ที่เดิม แต่ประเภทงบอยากให้ช่วยออกแบบ")
   เคาะแล้ว: ประเภทงบแทนที่กลุ่ม WBS (ครึ่งขวาของแถววงเงิน) · ช่องตามประเภทเป็นแถวใหม่ใต้ครึ่งขวา (ครึ่งซ้ายเว้น) · ค่าตั้งต้นว่าง ยังไม่มีแถวช่องตามประเภท
   · ประเภทงบบังคับ "กรุณาเลือกประเภทงบประมาณ" · ช่องตามประเภทไม่บังคับทุกช่อง "(ถ้ามี)" ไม่มี error · อื่น ๆ = Text input "หมายเหตุ"
   · ศูนย์ต้นทุนของหน่วยงานต้นสังกัดระบบเติมให้ (Readonly) · mobile เรียงลงตาม row() */
const BUDGET_TYPES = ['งบทำการ หน่วยงานต้นสังกัด', 'งบทำการ หน่วยงานอื่น', 'งบลงทุน งานก่อสร้าง', 'งบลงทุน งานบำรุงรักษา', 'อื่น ๆ (โปรดระบุในหมายเหตุ)'];
const OWN_COST_CENTER = 'Z903021100  ผจค.กพค.-บริหาร';   // ตามภาพเจ้าของงาน (ศูนย์ต้นทุนของหน่วยงานผู้สร้างแผน)
const COST_CENTERS = [['Z903021100', 'ผจค.กพค.-บริหาร'], ['Z903022100', 'ผจค.กพค.-ปฏิบัติการ'], ['Z903031100', 'ผบร.กบค.-บริหาร']];   // ข้อมูลจำลอง (รหัสจริงรอ vms)
function budgetTypeFields(v) {   // ช่องตามประเภทงบ — ไม่บังคับทุกช่อง
  const t = BUDGET_TYPES.indexOf(v.btype);
  if (t === 0) return [field('ศูนย์ต้นทุน', OWN_COST_CENTER, { state: 'Readonly', lead: 'account_balance-24-300-round' })];
  if (t === 1) return [dropdown('ศูนย์ต้นทุน', v.cc || '', { placeholder: 'เลือกศูนย์ต้นทุน', optional: true, lead: 'account_balance-24-300-round', state: v.ccOpen ? 'Focused' : undefined })];
  if (t === 2) return [field('เลข WBS', v.wbs, { placeholder: 'ระบุเลข WBS', optional: true }),
    field('เลขโครงข่าย', v.net, { placeholder: 'ระบุเลขโครงข่าย', optional: true }), field('เลขกิจกรรม', v.act, { placeholder: 'ระบุเลขกิจกรรม', optional: true })];
  if (t === 3) return [field('เลขที่ใบสั่ง', v.order, { placeholder: 'ระบุเลขที่ใบสั่ง', optional: true })];
  if (t === 4) return [field('หมายเหตุ', v.note, { placeholder: 'ระบุหมายเหตุ', optional: true })];
  return [];
}
function budgetRows(budget, type, v) {   // แถววงเงิน + ประเภทงบ · แถวช่องตามประเภท (ครึ่งขวา)
  const dep = budgetTypeFields(v);
  const rows = [row('Row', [budget, type])];
  if (dep.length) rows.push(MOB ? row('Row', dep) : row('Row', [frame('Spacer', 'VERTICAL'), row('WBS', dep)]));
  return rows;
}
async function planForm(name, o) {
  const edit = !!o.edit, v = o.values || {};
  const no = o.planNo || '123456';   // บล็อก C (22 ต.ค.): แก้ไขแผนที่เพิ่งสร้างในบล็อก B = 123461
  const { scr, page } = await shell(name, { title: edit ? 'แก้ไขแผน ' + no : 'สร้างแผน Overhaul', back: true, crumbs: [edit ? 'แก้ไขแผน ' + no : 'สร้างแผน Overhaul'] });
  const E = (k, m) => o.errors ? m : '';
  add(page, col('Content', [
    // วงเงินอนุมัติ + WBS 3 ช่อง แถวเดียว (เจ้าของงานส่งตัวอย่าง 19 ต.ค. 2569): วงเงินครึ่งซ้าย · WBS/โครงข่าย/กิจกรรม แบ่งครึ่งขวา
    // บล็อก B ฉบับเจ้าของงาน 22 ต.ค. 2569 (component-rules §4.2.1): placeholder "ระบุ…/เลือก…" · ปีงบไม่มีค่าเริ่ม + error "กรุณาเลือกปีงบประมาณ" · error วงเงิน "กรุณาระบุวงเงินอนุมัติ"
    col('Section', [await section('ข้อมูลแผน'), row('Row', [field('ชื่อแผน', v.name, { placeholder: 'ระบุชื่อแผน', error: E('n', 'กรุณาระบุชื่อแผน') }),
      dropdown('ประจำปีงบประมาณ', v.year || '', { placeholder: 'เลือกปีงบประมาณ', error: E('y', 'กรุณาเลือกปีงบประมาณ') })])].concat(
      // 29 ต.ค. 2569: กลุ่ม WBS → ประเภทงบประมาณ + ช่องตามประเภท (budgetRows) · 3 ช่อง WBS ยังไม่บังคับ "(ถ้ามี)" (เคาะ 19 ต.ค. + 29 ต.ค. "ไม่บังคับเลย")
      budgetRows(field('วงเงินอนุมัติ (บาท)', v.budget, { placeholder: 'ระบุวงเงินอนุมัติ', error: E('b', 'กรุณาระบุวงเงินอนุมัติ') }),
        dropdown('ประเภทงบประมาณ', v.btype || '', { placeholder: 'เลือกประเภทงบประมาณ', lead: 'paid-24-300-round', error: E('t', 'กรุณาเลือกประเภทงบประมาณ'), state: o.typeOpen ? 'Focused' : undefined }), v)), 16),
    // กล่องอัปโหลด 1 คอลัมน์ (เจ้าของงานเคาะ 19 ต.ค. 2569)
    // เอกสาร: จอเจ้าของงานไม่มี error ที่ช่องเอกสาร (B.2 มีแค่ ชื่อแผน · ปีงบ · วงเงิน) · ป้าย "เอกสารอื่น ๆ" · คำใต้กล่อง "PDF, PNG, or JPG (สูงสุด 10 ไฟล์)"
    col('Section', [await section('เอกสาร'), await upload('หนังสืออนุมัติหลักการ', v.approve || [], { hint: DOC_HINT }),
      await upload('เอกสารอนุมัติงบ', v.budgetDoc || [], { hint: DOC_HINT }),
      await upload('เอกสารอื่น ๆ', v.other || [], { optional: true, hint: DOC_HINT })], 16),
    btnRow(edit ? [['Secondary button', 'ยกเลิก', { size: 'lg' }], ['Primary button', 'บันทึก', { size: 'lg' }]] : [['Primary button', 'บันทึก', { size: 'lg' }]]),
  ], 32), 'h');
  return scr;
}
const DOC_HINT = 'PDF, PNG, or JPG (สูงสุด 10 ไฟล์)';
const BUDGET_SAMPLE = [{}, {}, {}, { order: '4100012345' }, { note: 'งบกลางเหลือจ่ายปี 2569 ตามบันทึกอนุมัติ' }];   // ข้อมูลจำลองช่องตามประเภท
const budgetFilled = (t, x) => Object.assign({}, FILLED, { btype: BUDGET_TYPES[t], wbs: '', net: '', act: '' }, BUDGET_SAMPLE[t], x || {});
const budgetTypeAnchor = (s) => { const dd = s.findAll(n => n.type === 'INSTANCE' && n.name === 'Input dropdown')[1]; return dd && (find(dd, 'Container') || dd); };   // [0] ปีงบ · [1] ประเภทงบ · [2] ศูนย์ต้นทุน
const FILLED = { name: 'Overhaul ประจำปีงบ 2570 — รถเจาะหลุม', year: '2571', budget: '5,000,000', btype: BUDGET_TYPES[2], wbs: 'C-70-OH-0003', net: '60002103', act: '0010',   // ค่าตามจอ B.3 ของเจ้าของงาน
  approve: [{ name: 'Document.pdf', size: '200 KB' }], budgetDoc: [{ name: 'Image_เอกสารอนุมัติงบ01.jpg', size: '10 KB' }, { name: 'Image_เอกสารอนุมัติงบ02.png', size: '10 KB' }],
  other: [{ name: 'Image001.jpg', size: '200 KB' }, { name: 'Image002.png', size: '200 KB' }] };
const EDIT = { name: 'Overhaul ประจำปีงบ 2569 — รถเครน', year: '2569', budget: '10,000,000', btype: BUDGET_TYPES[2], wbs: 'C-69-OH-0101', net: '60001234', act: '0010',
  approve: [{ name: 'หนังสืออนุมัติหลักการ-123456.pdf', size: '822 KB' }], budgetDoc: [{ name: 'เอกสารอนุมัติงบ-123456.pdf', size: '601 KB' }], other: [] };

/* ---------- หน้า 3 รายละเอียดแผน ---------- */
/* ตาราง PO (หน้า 2 CF 21 ต.ค. 2569): + ความคืบหน้า (ปิดงานแล้ว x/n) + ระยะสัญญา (ใกล้ครบ = บรรทัดรองสีแดง) · จัดการเป็นไอคอน ดู/แก้ไข/ลบ แทนเมนู "…" · 7 คอลัมน์ใช้ component Table ได้
   PO ฝากถาม 2 เรื่องที่ยังไม่ทำ: PO ใบเดียวมีอู่ได้มากกว่า 1 ไหม · กดแถวแล้วขยายเห็นรถใน PO (ไลบรารีไม่มีแถวขยาย) — รอเคาะ */
const PO_COLS = [['หมายเลข PO', 150, 'Lead text'], ['ชื่อ PO', 0], ['ศูนย์บริการ/อู่', 250], ['จำนวนรถ', 96], ['ความคืบหน้า', 150], ['ระยะสัญญา', 210], ['', 72]];
const poRow = (r) => { const n = +r[3] || 0, d = +(r[4] || 0);
  return [r[0], r[1], r[2], r[3], n ? { progress: Math.round(d / n * 100), text: d + '/' + n } : '—',
    r[5] ? { text: r[5] + ' – ' + r[6], sub: r[7] ? 'ใกล้ครบสัญญา (เหลือ 7 วัน)' : 'ตามใบสั่งจ้าง', subColor: r[7] ? 'error' : null } : '—', { menu: 1 }]; };
async function planDetail(name, o) {
  o = o || {};
  const p = o.plan || PLANS[4];
  const { scr, page } = await shell(name, { title: 'หมายเลขแผน ' + p[0], back: true, crumbs: ['แผน ' + p[0]], badge: o.badge || STATUS[o.status || p[6]],   // o.badge = ป้ายตามจอเจ้าของงาน (B.7 "ยังไม่มี PO")
    actions: [['Secondary danger button', 'ลบแผน', 'delete-24-300-round'], ['Secondary button', 'แก้ไข', 'stylus-24-300-round']] });
  const pos = o.pos || POS;
  const sections = [
    col('Section', [await sectionLabel('รายละเอียดแผน'), kv([['ชื่อแผน', p[1]], ['ประจำปีงบประมาณ', '25' + p[2].slice(2, 4)], ['วงเงินอนุมัติ (บาท)', p[3]], ['จำนวนรถที่ Overhaul', p[5] + ' คัน'],
      ['วันที่สร้าง', p[7]], ['เลข WBS (ศูนย์ต้นทุน)', p[2]], ['เลขโครงข่าย', '60001234'], ['เลขกิจกรรม', '0010']])], 16),   // แถว 2 ตามจอ B.7 ของเจ้าของงาน 22 ต.ค. (วันที่สร้าง · เลข WBS (ศูนย์ต้นทุน) · เลขโครงข่าย · เลขกิจกรรม)
    // เอกสารตามจอเจ้าของงาน (B.7 · C.5 · D.1.2 · 22 ต.ค.): หนังสืออนุมัติหลักการ 1 ไฟล์ · เอกสารอนุมัติงบ 3 ไฟล์ ขนาด 10 KB
    col('Section', [await sectionLabel('เอกสาร'), row('Row', [await upload('หนังสืออนุมัติหลักการ', [{ name: 'Document.pdf', size: '10 KB' }], { readonly: true }),
      await upload('เอกสารอนุมัติงบ', [{ name: 'Document.pdf', size: '10 KB' }, { name: 'Image_เอกสารอนุมัติงบ01.jpg', size: '10 KB' }, { name: 'Image_เอกสารอนุมัติงบ02.png', size: '10 KB' }], { readonly: true })])], 16),
  ];
  // ยังไม่มี PO (จอ B.7 ของเจ้าของงาน): หัว "Purchase Order (0)" ไม่มีปุ่มที่หัว · ปุ่ม "สร้าง Purchase Order" อยู่ใน Empty state
  const poSec = col('Section', [await sectionLabel('Purchase Order', { badge: pos.length, buttons: pos.length ? [{ kind: 'Primary button', text: 'PO', icon: 'add-24-300-round' }] : [] })], 16);
  if (pos.length) add(poSec, await tbl(PO_COLS, pos.map(poRow)), 'h');
  else { const es = inst('Empty state/Data empty'); add(poSec, es, 'h'); await text(es, 'Text', 'ยังไม่มี Purchase Order'); await text(es, 'Supporting text', 'เพิ่ม PO เพื่อเลือกรถที่จะเข้า Overhaul และเริ่มงานรายคัน');
    const s2 = find(es, 'Secondary button'); if (s2) s2.visible = false; const pb = find(es, 'Primary button'); if (pb) setProps(pb, { Text: o.poBtn || 'สร้าง Purchase Order' }); }   // o.poBtn = ตามจอเจ้าของงาน (E.1 29 ต.ค. 2569 "เพิ่ม Purchase Order")
  sections.push(poSec);
  // อะไหล่ที่ใช้ (จอ B.7 ของเจ้าของงาน): หัว "อะไหล่ที่ใช้" ไม่มีปุ่มที่หัว · ปุ่ม "เบิกอะไหล่" ใน Empty state (ปุ่มรอง — ปุ่มหลักของหน้าเป็นของ PO)
  const partSec = col('Section', [await sectionLabel('อะไหล่ที่ใช้')], 16);
  const es2 = inst('Empty state/Data empty'); add(partSec, es2, 'h'); await text(es2, 'Text', 'ยังไม่มีรายการเบิกอะไหล่'); await text(es2, 'Supporting text', 'ส่วนนี้จองไว้ตาม userflow — ขั้นตอนเบิกอะไหล่ยังไม่ได้ออกแบบ');
  const s3 = find(es2, 'Secondary button'); if (s3) { setProps(s3, { Text: 'เบิกอะไหล่' }); if (VIEW) s3.visible = false; } const pb2 = find(es2, 'Primary button'); if (pb2) pb2.visible = false;
  sections.push(partSec);
  add(page, col('Content', sections, 32), 'h');
  return scr;
}

/* ---------- หน้า 4 ฟอร์ม PO ---------- */
const PO_FILE_HINT = 'PDF, PNG, or JPG ขนาดไม่เกิน 10 MB ต่อหนึ่งไฟล์';   // คำใต้กล่องอัปโหลดตาม E · F ฉบับเจ้าของงาน 29 ต.ค. 2569
async function poForm(name, o) {
  o = o || {};
  const edit = !!o.edit;
  const { scr, page } = await shell(name, { title: edit ? 'แก้ไข PO-690101' : 'เพิ่ม Purchase Order', back: true, crumbs: ['แผน 123458', edit ? 'แก้ไข PO-690101' : 'เพิ่ม Purchase Order'] });
  const sel = o.sel || [];
  const left = ALL_CARS.filter((_, i) => sel.indexOf(i) < 0), right = ALL_CARS.filter((_, i) => sel.indexOf(i) >= 0);
  const vendorF = dropdown('ศูนย์บริการ/อู่', o.vendor || '', { placeholder: 'ค้นหาชื่อศูนย์บริการ/อู่', lead: 'search-24-300-round', state: o.vendorOpen ? 'Focused' : undefined, error: o.errors ? 'กรุณาเลือกศูนย์บริการ/อู่' : '' });
  /* เลือกรถ — desktop (เจ้าของงานสั่ง 21 ต.ค. 2569 ค่ำ · R24): Input dropdown ช่องเดียว พิมพ์ค้นทะเบียน/จังหวัด → Dropdown list แถวละ "ทะเบียน จังหวัด" (คันที่เลือกแล้ว State=Selected)
     → รถที่เลือกแล้วเป็นชิป Badge outline with remove icon ใต้ช่อง (กด × เอาออก) · ไม่มี dual list เพิ่ม/นำออก · ตัวกรอง หน่วยงาน/เขต · ประเภทรถ ยังไม่ใส่ (รอเคาะ)
     mobile: ยังไม่ทำ — คง dual list แบบเดิม (ถ้าทำมือถือให้อ่านจาก desktop) */
  let carSec;
  const carF = MOB ? null : dropdown('เลือกรถ', o.query || '', { placeholder: 'ค้นหาทะเบียน, จังหวัด', lead: 'search-24-300-round', state: o.carOpen ? 'Focused' : undefined, error: o.errors ? 'กรุณาเลือกรถ' : '' });   // error ตาม E.3 ฉบับเจ้าของงาน 29 ต.ค. 2569
  if (MOB) {
    const mid = row('Actions', [btn('Secondary button', 'เพิ่ม', { disabled: !(o.tick && o.tick.length) }), btn('Secondary button', 'นำออก', { disabled: true })], { gap: 12, keep: true });
    mid.layoutGrow = 0;
    const shown = o.query ? left.filter(c => c[1].indexOf(o.query) >= 0 || c[0].indexOf(o.query) >= 0) : left;
    const L = await listCheck('รายการรถทั้งหมด', shown, o.tick || []), R = await listCheck('เลือกแล้ว', right, []);
    const dual = row('Dual list', [L, mid, R], { gap: 16 }); mid.layoutGrow = 0;
    carSec = col('Section', [await section('เลือกรถ'), row('Row', [field('ค้นหารถ', o.query, { placeholder: 'ค้นหาทะเบียน, รุ่น/ยี่ห้อ', lead: 1 }), frame('Spacer', 'VERTICAL')]), dual], 16);
  } else {
    let chips = null;
    if (right.length) {
      chips = frame('Selected cars', 'HORIZONTAL', { gap: 8 });
      try { chips.layoutWrap = 'WRAP'; chips.counterAxisSpacing = 8; } catch (e) {}
      right.forEach(c => chips.appendChild(inst('Badge outline with remove icon', { Color: 'Brand' }, { Text: c[0] })));
    }
    carSec = col('Section', [await section('เลือกรถ'), row('Row', [carF, frame('Spacer', 'VERTICAL')]), chips], 16);
  }
  add(page, col('Content', [
    col('Section', [await section('รายละเอียด Purchase Order'), row('Row', [field('ชื่อ Purchase Order', o.name, { placeholder: 'เช่น ซ่อมระบบแอร์', error: o.errors ? 'กรุณาระบุชื่อ Purchase Order' : '' }), vendorF])], 16),
    carSec,
    col('Section', [await section('เอกสาร'), await upload('ใบสั่งจ้าง', o.order || [], { error: o.errors ? 'กรุณาแนบใบสั่งจ้าง' : '', hint: PO_FILE_HINT }), await upload('เอกสารอื่น ๆ', [], { optional: true, hint: PO_FILE_HINT })], 16),   // ป้าย/คำใต้กล่องตาม E · F ฉบับเจ้าของงาน 29 ต.ค. 2569
    btnRow(edit ? [['Secondary button', 'ยกเลิก', { size: 'lg' }], ['Primary button', 'บันทึก', { size: 'lg' }]] : [['Primary button', 'บันทึก', { size: 'lg' }]]),
  ], 32), 'h');
  if (o.vendorOpen) comboAt(scr, vendorF.findOne(n => n.name === 'Container') || vendorF, [['บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', '02-111-2202 · เขตพระนคร กรุงเทพฯ']]);
  if (o.carOpen && carF) {   // รายการรถที่ตรงคำค้น (ทะเบียน/จังหวัด) · คันที่เลือกแล้วติ๊ก Selected · แสดงได้เท่าช่องของ component Dropdown list
    const q = (o.query || '').replace(/[^0-9ก-๙a-z]/gi, ''), cands = ALL_CARS.map((c, i) => [c, i]).filter(([c]) => !q || c[0].replace(/[^0-9ก-๙a-z]/gi, '').indexOf(q) >= 0);   // ไม่สนขีด: พิมพ์ "701" เจอ 70-1123 (E.5 ฉบับเจ้าของงาน)
    comboAt(scr, carF.findOne(n => n.name === 'Container') || carF, cands.map(([c, i]) => [c[0], '', sel.indexOf(i) >= 0]));
  }
  return scr;
}

/* ---------- หน้า 5 รายละเอียด PO ---------- */
const CAR_COLS = [['ทะเบียน', 140, 'Lead text'], ['ยี่ห้อ/รุ่น · ประเภท', 0], ['หน่วยงานเจ้าของรถ', 130], ['เลขไมล์ (กม.)', 110], ['อายุการใช้งาน', 100], ['สถานะงาน', 210, 'Badge'], ['รายละเอียดตามสถานะ', 210], ['', 72]];
const carRow = (c) => [c[0], c[1], c[2], c[3], c[4] + ' ปี', { pill: JOB[c[5]] }, c[6] ? { text: c[6], sub: c[7] || '' } : '—', { icons: c[5] === 'V11' ? ['quick_reference_all-24-300-round', 'keyboard_arrow_right-20-400-round'] : ['keyboard_arrow_right-20-400-round'] }];   // ปิดงานแล้ว: ดูสรุปรายคัน (S18) · เปิดหน้างาน
async function poDetail(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'หมายเลข PO-690101', back: true, crumbs: ['แผน 123456', 'PO-690101'],
    actions: [['Secondary danger button', 'ลบ PO', 'delete-24-300-round'], ['Secondary button', 'แก้ไข', 'stylus-24-300-round']] });
  add(page, col('Content', [
    col('Section', [await sectionLabel('รายละเอียด Purchase Order'), kv([['ชื่อแผน', PLANS[4][1]], ['ชื่อ Purchase Order', 'ซ่อมระบบเครื่องยนต์'], ['ศูนย์บริการ/อู่', 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด'], ['เบอร์โทรอู่', '02-111-2201'], ['ที่อยู่', 'เขตบางนา กรุงเทพฯ']])], 16),
    col('Section', [await sectionLabel('เอกสาร'), row('Row', [await upload('ใบสั่งจ้าง', [{ name: 'ใบสั่งจ้าง-PO-690101.pdf', size: '500 KB' }], { readonly: true }), frame('Spacer', 'VERTICAL')])], 16),
    // หน้า 3 CF (21 ต.ค. 2569): + หน่วยงานเจ้าของรถ · วันนัด/วันที่อยู่อู่/ประกัน ยุบเป็นคอลัมน์เดียวถัดจากสถานะ (Badge cell ไม่มีบรรทัดรอง) · ปุ่ม "หน้างาน" เป็นไอคอน · 8 คอลัมน์พอดี Table
    col('Section', [await sectionLabel('รายการรถ', { badge: (o.cars || CARS).length }), await tbl(CAR_COLS, (o.cars || CARS).map(carRow))], 16),   // o.cars = เฉพาะรถของหน่วยงาน (S17)
  ], 32), 'h');
  return scr;
}

/* ---------- หน้า 6 หน้างานรายคัน ---------- */
async function job(name, stage, build, step, head) {   // head = ตัวเลือกเพิ่มของหัวหน้า เช่น actions (S18 ปุ่ม "ดูสรุปรายคัน")   // step = ขั้นที่เปิดดู (จอดูย้อนหลังของ S17 · ไม่ส่ง = ขั้นตามสถานะ)
  const n = +stage.slice(1), cur = step || { V1: 1, V2: 1, V3: 1, V4: 2, V5: 3, V6: 4, V7: 5, V8: 5, V9: 5, V10: 6, V11: 6 }[stage];
  const { scr, page } = await shell(name, Object.assign({ title: '72-6648 สงขลา', back: true, crumbs: ['แผน 123460', 'PO-700201', '72-6648 สงขลา'], badge: JOB[stage] }, head || {}));
  const content = col('Content', [
    VIEW ? alertBox('Info', VIEW_NOTE[0], VIEW_NOTE[1]) : null,   // S17 จอดูอย่างเดียว: บอกทางออกเมื่อข้อมูลไม่ถูกต้อง (ปุ่มแก้ไขถูกซ่อน)
    // กล่องข้อมูลยานพาหนะ 6 ช่อง (ภาพที่เจ้าของงานส่ง 21 ต.ค. 2569 ค่ำ: ไม่มี Purchase Order / ศูนย์บริการ/อู่ — อู่ไปอยู่ในกล่องของส่วนนัดหมาย)
    col('Section', [await section('ข้อมูลยานพาหนะ'), kv([['ทะเบียน', '72-6648 สงขลา'], ['ยี่ห้อ/รุ่น', 'HINO FG1J'], ['ประเภท', 'รถกระเช้า'], ['อายุการใช้งาน', '16 ปี'],
      ['เลขไมล์สะสม', '221,300 กม.'], ['ชั่วโมงสะสม', '13,300 ชม.']])], 16),
    stepper(cur, n === 11),
  ], 32);
  add(page, content, 'h');
  for (const node of await build()) if (node) add(content, node, 'h');
  return scr;
}
const apptKv = (ret, d1, d2) => kv([[ret ? 'ช่วงวันนัดรับรถ' : 'ช่วงวันนำรถเข้า', d1 + ' – ' + d2], ['ผู้ประสานงาน (กบค.)', 'นายวิชัย ทองดี'], ['เบอร์โทรผู้ประสานงาน (กบค.)', '02-590-9123'],
  ['ชื่ออู่', VENDOR[0]], ['เบอร์อู่', VENDOR[1]], ['ที่อยู่', VENDOR[2]], ['หมายเหตุ', '—']], 3);   // มือถือคงเดิม (ยังไม่ทำ mobile — 21 ต.ค. 2569)
/* นัดหมาย (desktop) = instance ของ RepairAppointmentStep — component ในไฟล์ Maintain-D หน้า Design (ฟอร์มนัดของงานซ่อม)
   เจ้าของงานสั่ง 19 ต.ค. 2569: "การนัดหมายเข้าซ่อมอยากให้ใช้แบบนี้ เพราะเรื่องการซ่อมบำรุงใช้แบบนี้ โดย section รูปแบบการซ่อมไม่ต้องมี" (RepairMethod = false)
   variant: ฟอร์ม Type=In · State=Default/Filled · รอตอบกลับ Type=Wating · ปฏิเสธ Type=In State=ReturnReason (ผลตอบกลับ + ฟอร์มส่งนัดใหม่)
   ช่องของงานซ่อม → ช่องของ Overhaul (userflow S7/S13): ช่วงเวลาที่รับมอบรถ → ช่วงวันนำรถเข้า/นัดรับรถ · ช่างซ่อม → ผู้ประสานงาน (กบค.) ·
   เบอร์ผู้รับมอบรถ → เบอร์โทรผู้ประสานงาน (กบค.) · สถานที่รับรถ (Text area) ซ่อน — เจ้าของงานเคาะ 21 ต.ค. 2569 จากจอที่แก้ไว้: ฟอร์มมีแค่ ช่วงวัน · ผู้ประสานงาน · เบอร์ (อู่อยู่ในกล่องข้อมูลยานพาหนะ) · ไม่มีช่องหมายเหตุ · mobile: component ไม่มี variant มือถือ ⇒ ประกอบเองด้วยช่องชุดเดียวกัน */
const COORD = ['นายวิชัย ทองดี', 'วิศวกร กบค.', '02-590-9123'];
const REJECT_NOTE = 'รถติดภารกิจซ่อมบำรุงสายส่ง ขอเลื่อนเป็นสัปดาห์ถัดไป';
/* ภาพที่เจ้าของงานส่ง 21 ต.ค. 2569 (ค่ำ): ส่วน "รายละเอียดการนัดหมาย" = หัวข้อ → กล่องเทา ศูนย์บริการ/อู่ · เบอร์โทร ศูนย์บริการ/อู่ · ที่อยู่ (Content item row 3 ช่อง · ค่าจาก PO) → ช่องกรอก 3 ช่อง
   component ไม่มีกล่องอู่ในส่วนนี้ ⇒ ซ่อนหัวข้อในตัว component แล้วห่อด้วย Section header ของเรา + กล่อง kv + component (ใช้กับทุก state ของ S7/S13 desktop) */
const VENDOR_KV = () => kv([['ศูนย์บริการ/อู่', VENDOR[0]], ['เบอร์โทร ศูนย์บริการ/อู่', VENDOR[1]], ['ที่อยู่', VENDOR[2]]], 3);
async function apptSection(node) {
  const inRM = (n) => { for (let p = n.parent; p && p !== node; p = p.parent) if (p.name === 'RepairMethod') return true; return false; };
  node.findAll(n => n.type === 'INSTANCE' && n.name === 'Section header' && !inRM(n)).forEach(h => { h.visible = false; });   // หัวข้อในตัว component ซ่อน ใช้ของเราแทน
  return col('Section', [await section('รายละเอียดการนัดหมาย'), VENDOR_KV(), node], 16);
}
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
  if (area) area.visible = false;   // 21 ต.ค. 2569 เจ้าของงานส่งจอนัดหมายที่เคาะ: ไม่มีช่องอู่ในฟอร์ม (Text area "สถานที่รับรถ" ซ่อน) — อู่แสดงในกล่องข้อมูลยานพาหนะด้านบนแล้ว
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
    const nodes = [await apptSection(r.node), btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งนัดหมาย', { size: 'lg' }]])];
    nodes._coord = r.coord && (r.coord.findOne(n => n.name === 'Container') || r.coord);
    return nodes;
  }
  const coord = dropdown('ผู้ประสานงาน (กบค.)', o.coord ? 'นายวิชัย ทองดี' : '', { placeholder: 'ค้นหาชื่อผู้ประสานงาน', lead: 'search-24-300-round', state: o.open ? 'Focused' : undefined, error: o.errors ? 'กรุณาเลือกผู้ประสานงาน' : '' });
  const nodes = [col('Section', [await section(ret ? 'นัดหมายรับรถ' : 'นัดหมายนำรถเข้าอู่'),
    row('Row', [field(ret ? 'นัดรับรถตั้งแต่วันที่' : 'นำรถเข้าตั้งแต่วันที่', o.d1, { placeholder: 'วว/ดด/ปปปป', error: o.errors ? 'กรุณาเลือกวันที่เริ่ม' : '' }),
      field('ถึงวันที่', o.d2, { placeholder: 'วว/ดด/ปปปป', error: o.errors ? 'กรุณาเลือกวันที่สิ้นสุด' : '' }), frame('Spacer', 'VERTICAL')]),
    row('Row', [coord, field('เบอร์โทรผู้ประสานงาน (กบค.)', o.coord ? '02-590-9123' : '', { state: 'Readonly', placeholder: 'แสดงเมื่อเลือกผู้ประสานงาน' }), frame('Spacer', 'VERTICAL')]),
    // มือถือ/แบบประกอบเอง คงเดิมไว้ก่อน — เจ้าของงาน 21 ต.ค. 2569: "บนมือถือยังไม่ต้องแก้ ถ้ามีการทำมือถือ ให้อ่านจาก desktop แต่ตอนนี้ยังไม่ทำ mobile" (desktop ซ่อนช่องอู่แล้ว ตอนทำมือถือให้ตัดแถวอู่/หมายเหตุตาม)
    row('Row', [field('ชื่ออู่' + (ret ? ' (ค่าตั้งต้นจาก PO)' : ''), VENDOR[0], { state: 'Readonly' }), field('เบอร์อู่', VENDOR[1], { state: 'Readonly' }), field('ที่อยู่', VENDOR[2], { state: 'Readonly' })]),
    area('หมายเหตุ', '', { optional: true, placeholder: 'ระบุหมายเหตุ' })], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันนัดหมาย', { size: 'lg' }]])];
  nodes._coord = coord;
  return nodes;
}
async function apptWait(ret, d1, d2) {
  if (!MOB && INDEX.has('RepairAppointmentStep')) return [await apptSection(repairAppt(ret, 'wait').node)];   // Type=Wating: "รอตอบกลับจากหน่วยงาน" + ปุ่มแก้ไขนัดหมายในตัว
  return [col('Section', [await section(ret ? 'นัดหมายรับรถ' : 'นัดหมายนำรถเข้าอู่'),
    alertBox('Info', 'รอหน่วยงานเจ้าของรถตอบกลับ', 'ส่งนัดหมายแล้ว 19/10/2569 · แก้ไขนัดหมายได้จนกว่าหน่วยงานจะตอบรับ'), apptKv(ret, d1, d2)], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Secondary button', 'แก้ไขนัดหมาย', { size: 'lg' }]])];
}
async function apptRejected(ret, d1, d2) {
  if (!MOB && INDEX.has('RepairAppointmentStep')) return [await apptSection(repairAppt(ret, 'rejected', { r1: d1, r2: d2 }).node), btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ส่งนัดหมาย', { size: 'lg' }]])];
  return [col('Section', [await section(ret ? 'นัดหมายรับรถ' : 'นัดหมายนำรถเข้าอู่'),
    alertBox('Warning', 'หน่วยงานปฏิเสธนัดหมาย', 'หมายเหตุ: รถติดภารกิจซ่อมบำรุงสายส่ง ขอเลื่อนเป็นสัปดาห์ถัดไป'), apptKv(ret, d1, d2)], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Secondary button', 'แก้ไขนัดหมาย', { size: 'lg' }]])];
}
/* ---------- S16 หน่วยงานเจ้าของรถ ตอบกลับนัดหมาย (บล็อก Q · 30 ต.ค. 2569) ----------
   เจ้าของงาน: "ออกแบบ ตอบรับนัดหมายของงาน Overhaul ให้สอดคล้องกับงานแจ้งซ่อม เพิ่มเป็นอีก scen โดยแยกเป็น ตอบรับ และ ปฏิสเธ" → เคาะ "ตามที่แนะนำ"
   ต้นแบบ = หน้าตอบรับนัดหมายของงานซ่อม (ไฟล์ Maintain-D section "Accepting appointments" · ข้อความดิบ figma-ref/repair-ตอบรับนัดหมาย-2569-10-30.txt):
   Page header ปุ่ม "ยืนยันตอบกลับ" · 2 คอลัมน์ ซ้าย 746 (ตอบกลับ + ข้อมูลการนัดหมาย + รายละเอียด) ขวา 526 (ยานพาหนะ) · Section label ทุกหัวข้อ
   · Modal Centered image "ยืนยันการตอบกลับ" ปุ่ม ไม่ใช่ตอนนี้ / ยืนยัน · toast "ตอบกลับสำเร็จ" + บรรทัดรอง
   ต่างจากงานซ่อม: ไม่มีรูปแบบการนัดหมายให้เลือก (เข้าอู่ตาม PO) ⇒ การ์ด Radio text card 2 ใบ ตอบรับ / ปฏิเสธนัดหมาย แทน
   · ตอบรับ = วันนำรถเข้า/วันรับรถ **บังคับ เลือกวันเดียวในช่วงที่ กบค. เสนอ** (Date picker Single) + คนนำส่ง/คนรับรถ (ถ้ามี · ค้นชื่อ) + เบอร์เติมอัตโนมัติ
   · ปฏิเสธ = ช่วงวันที่สะดวก (ถ้ามี · Date picker Dual) + เหตุผลที่ปฏิเสธ บังคับ — เจ้าของงานเคาะ 30 ต.ค. 2569 "ต้องเลือกวันใดวันนึงถ้าตอบรับ" · ปฏิเสธ "ช่วงวัน ไม่บังคับ"
   · ครอบทั้งนัดเข้าอู่ (S7) และนัดรับรถคืน (S13) */
const S16_APPT = {
  in: { d1: '22/10/2569', d2: '24/10/2569', when: 'ช่วงวันนำรถเข้า', date: 'วันนำรถเข้า', person: 'ผู้นำส่งรถ', phone: 'เบอร์โทรศัพท์ผู้นำส่งรถ', step: 'นัดเอารถเข้าอู่',
    yes: 'เลือกวันนำรถเข้าอู่จากช่วงวันที่ กบค. เสนอ', wait: 'V2', ok: 'V4', no: 'V3', pick: '23/10/2569', who: ['นายสมชาย ใจดี', 'พนักงานขับรถ กฟฟ.สงขลา', '081-234-5678'],
    reason: REJECT_NOTE, want: ['27/10/2569', '31/10/2569'] },
  out: { d1: '08/11/2569', d2: '09/11/2569', when: 'ช่วงวันนัดรับรถ', date: 'วันรับรถ', person: 'ผู้รับรถ', phone: 'เบอร์โทรศัพท์ผู้รับรถ', step: 'นัดรับรถ',
    yes: 'เลือกวันไปรับรถที่อู่จากช่วงวันที่ กบค. เสนอ', wait: 'V8', ok: 'V10', no: 'V9', pick: '09/11/2569', who: ['นายประสิทธิ์ ตรวจสอบดี', 'ช่างคุมรถ กฟฟ.สงขลา', '089-765-4321'],
    reason: 'ไม่มีพนักงานขับรถไปรับรถในวันดังกล่าว', want: ['15/11/2569', '16/11/2569'] },
};
const S16_PEOPLE = [['นายสมชาย ใจดี', '510234 · พนักงานขับรถ กฟฟ.สงขลา', true], ['นายสมศักดิ์ รักษ์ดี', '510871 · พนักงานขับรถ กฟฟ.สงขลา'], ['นางสาวสมใจ ศรีสุข', '512077 · ผปบ. กฟฟ.สงขลา']];
const REPLY_CONFIRM = { title: 'ยืนยันการตอบกลับ', sub: 'คุณต้องการยืนยันการตอบกลับหรือไม่ ?', cancel: 'ไม่ใช่ตอนนี้', ok: 'ยืนยัน' };   // คำตาม Modal ของงานซ่อม
const REPLY_TOAST = (yes) => ({ title: 'ตอบกลับสำเร็จ', sub: yes ? 'ส่งตอบรับนัดหมายรถ 72-6648 สงขลา ให้ กบค. เรียบร้อยแล้ว' : 'ส่งเหตุผลการปฏิเสธนัดหมายให้ กบค. เรียบร้อยแล้ว' });
let REPLY_ANCHOR = null, REPLY_DATE = null;   // ช่องค้นชื่อ / ช่องวันของจอล่าสุด — ใช้วาง Dropdown list (comboAt) และ Date picker
/* o = { stage: 'wait'|'ok'|'no', pick: 0 ตอบรับ | 1 ปฏิเสธ, date: เลือกวันแล้ว, who: เลือกคนแล้ว, query, open, want: กรอกช่วงวันที่สะดวก, reason, errors } */
async function reply(name, k, o) {
  o = o || {};
  const A = S16_APPT[k], stage = o.stage || 'wait', done = stage !== 'wait';
  const { scr, page } = await shell(name, { title: '72-6648 สงขลา', back: true, crumbs: ['แผน 123460', 'PO-700201', '72-6648 สงขลา'], badge: JOB[A[stage]],
    primary: done ? '' : 'ยืนยันตอบกลับ', primaryIcon: false, primaryDisabled: o.pick == null });
  const left = [];
  if (!done) {
    const cards = MOB ? col('Radio', [], 12) : row('Radio', [], { gap: 16 });
    [['ตอบรับนัดหมาย', A.yes], ['ปฏิเสธนัดหมาย', 'แจ้งเหตุผลและช่วงวันที่สะดวกให้ กบค. นัดหมายใหม่']].forEach(([t, sub], i) => {
      const c = inst('Radio text card', { State: 'Default', Selected: o.pick === i ? 'True' : 'False' }, { Text: t, 'Supporting text': sub, Supporting: true });
      if (MOB) add(cards, c, 'h'); else { cards.appendChild(c); c.layoutGrow = 1; }
    });
    const kids = [await sectionLabel('ตอบกลับนัดหมาย'), cards];
    if (o.pick === 0) {
      REPLY_DATE = field(A.date, o.date ? A.pick : '', { placeholder: 'เลือก' + A.date, state: o.dateOpen ? 'Focused' : undefined,
        error: o.errors && !o.date ? 'กรุณาเลือก' + A.date : '', helper: 'เลือกได้ 1 วัน ระหว่าง ' + A.d1 + ' - ' + A.d2 });
      kids.push(REPLY_DATE);
      REPLY_ANCHOR = dropdown(A.person, o.query || (o.who ? A.who[0] : ''), { optional: true, placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round', state: o.open ? 'Focused' : undefined });
      kids.push(row('Row', [REPLY_ANCHOR, field(A.phone, o.who ? A.who[2] : '', { state: 'Readonly', optional: true, placeholder: 'แสดงเมื่อเลือก' + A.person })]));
    }
    if (o.pick === 1) {
      REPLY_DATE = field('ช่วงวันที่สะดวก', o.want ? A.want.join(' - ') : '', { optional: true, placeholder: 'เลือกวันที่เริ่มต้น - วันที่สิ้นสุด', state: o.dateOpen ? 'Focused' : undefined });
      kids.push(REPLY_DATE);
      kids.push(area('เหตุผลที่ปฏิเสธ', o.reason || '', { placeholder: 'ระบุเหตุผลที่ปฏิเสธ', error: o.errors ? 'กรุณาระบุเหตุผลที่ปฏิเสธ' : '' }));
    }
    left.push(col('Section', kids, 16));
  } else {
    const pairs = stage === 'ok' ? [['ผลการตอบกลับ', 'ตอบรับนัดหมาย'], [A.date, A.pick], [A.person, A.who[0]], [A.phone, A.who[2]]]
      : [['ผลการตอบกลับ', 'ปฏิเสธนัดหมาย'], ['ช่วงวันที่สะดวก', A.want.join(' - ')], ['เหตุผลที่ปฏิเสธ', A.reason]];
    left.push(col('Section', [await sectionLabel('ผลการตอบกลับ'), kv(pairs)], 16));
  }
  left.push(col('Section', [await sectionLabel('ข้อมูลการนัดหมาย'), kv([[A.when, A.d1 + ' - ' + A.d2], ['ผู้ประสานงาน (กบค.)', COORD[0]], ['เบอร์โทรผู้ประสานงาน (กบค.)', COORD[2]],
    ['ศูนย์บริการ/อู่', VENDOR[0]], ['เบอร์โทร ศูนย์บริการ/อู่', VENDOR[1]], ['ที่อยู่', VENDOR[2]]], 3)], 16));
  left.push(col('Section', [await sectionLabel('รายละเอียดงาน Overhaul'), kv([['หมายเลขแผน', '123460'], ['ชื่อแผน', PLANS[0][1]], ['หมายเลข PO', 'PO-700201'], ['ขั้นตอน', A.step]], 2)], 16));
  const right = col('Section', [await sectionLabel('ยานพาหนะ'), kv([['ทะเบียน', '72-6648 สงขลา'], ['ยี่ห้อ/รุ่น', 'HINO FG1J'], ['ประเภท', 'รถกระเช้า'], ['อายุการใช้งาน', '16 ปี'],
    ['เลขไมล์สะสม', '221,300 กม.'], ['ชั่วโมงสะสม', '13,300 ชม.']], 2)], 16);
  const L = col('Left', left, 32), R = col('Right', [right], 32);
  if (MOB) { add(page, col('Content', [L, R], 32), 'h'); return scr; }
  const r = row('Content', [], { gap: 24, hug: true });
  r.appendChild(L); L.layoutGrow = 1;
  r.appendChild(R); R.counterAxisSizingMode = 'FIXED'; R.resize(526, R.height);
  add(page, r, 'h');
  return scr;
}
/* ปฏิทินใต้ช่องวัน: ตอบรับ = Type=Single (วันในช่วงที่ กบค. เสนอเท่านั้น — การปิดวันนอกช่วงเป็นพฤติกรรมของระบบ instance ปรับรายวันไม่ได้) · ปฏิเสธ = Type=Dual */
function replyCalendar(scr, type) {
  if (MOB || !REPLY_DATE) return;   // mobile ยังไม่ทำ (21 ต.ค. 2569) — ช่องวันคงเป็นช่องกรอก
  const dp = inst('Date picker', { Type: type }, { 'Time picker': false });
  overlay(scr, dp, 0, 0);
  const sb = scr.absoluteBoundingBox, ab = REPLY_DATE.absoluteBoundingBox; dp.x = ab.x - sb.x; dp.y = ab.y - sb.y + ab.height + 4;
}
const replyDate = async (name, k, o, type) => { const s = await reply(name, k, Object.assign({ dateOpen: true }, o)); replyCalendar(s, type); return s; };
const replyCombo = async (name) => { const s = await reply(name, 'in', { pick: 0, date: true, query: 'สม', open: true }); comboAt(s, REPLY_ANCHOR, S16_PEOPLE); return s; };
const replyModal = async (name, k, o) => { const s = await reply(name, k, o); await confirm(s, REPLY_CONFIRM); return s; };
const replyDone = async (name, k, yes) => { const s = await reply(name, k, { stage: yes ? 'ok' : 'no' }); await toast(s, REPLY_TOAST(yes)); return s; };

/* ---------- S17 หน่วยงานเจ้าของรถ / กรย. ดูข้อมูลอย่างเดียว (บล็อก R · 30 ต.ค. 2569 · R30) ----------
   เจ้าของงาน: "คนที่ไม่ใช่ กบค ที่เป็นเจ้าของรถ เป็น กรย ของหน่วยงานนั้นจะเข้ามาเห็นข้อมูลได้ แต่ว่าแก้ไขข้อมูลไม่ได้ … ลองเสนอความเห็น … ใช้หลักการออกแบบของ ux"
   → เคาะ "เอาตามนั้นเลย": ซ่อนปุ่มที่บทบาทนี้ไม่มีสิทธิ์ (ไม่ Disabled) · รายการแผนเฉพาะแผนที่มีรถของหน่วยงาน · เปิดแผน/PO เห็นข้อมูลทั้งใบ ตารางรถเฉพาะรถของหน่วยงาน
   · Alert Info บนหน้างานรายคันบอกทางออก (ติดต่อผู้ประสานงาน กบค.) · เข้าจากเมนู "จัดการงาน Overhaul" ได้เหมือน กบค.
   ขั้น 1 และ 5 ที่มีนัดแล้ว = ส่วนตอบกลับของ S16 (หน่วยงานมีสิทธิ์ตอบ) ⇒ ไม่ซ้ำในบล็อกนี้ */
const VIEW_NOTE = ['ข้อมูลนี้จัดการโดย กบค. ดูได้อย่างเดียว', 'หากข้อมูลไม่ถูกต้อง ติดต่อผู้ประสานงาน (กบค.) ' + COORD[0] + ' ' + COORD[2]];
const CLOSED_CAR = ['72-6648 สงขลา', 'HINO FG1J · รถกระเช้า', 'กฟฟ.สงขลา', '221,300', '16', 'V11', 'ปิดงาน 09/11/2569', 'ประกันถึง 04/11/2570'];   // S18 แถวรถที่ปิดงานแล้วในตาราง PO
const OWN_CAR = ['72-6648 สงขลา', 'HINO FG1J · รถกระเช้า', 'กฟฟ.สงขลา', '221,300', '16', 'V5', 'อยู่อู่ 12 วัน', 'รับรถ 23 ต.ค. 2569'];
const SAFETY_DONE = [{ name: 'Safety-Inspection-72-6648.pdf', size: '1.2 MB' }, { name: 'Image.jpg', size: '200 KB' }];
const asView = (fn) => async () => { VIEW = true; try { return await fn(); } finally { VIEW = false; } };
async function viewNoAppt() {   // ขั้น 1 ก่อน กบค. ส่งนัด: ยังไม่มีอะไรให้ตอบ
  const es = inst('Empty state/Data empty');
  await text(es, 'Text', 'ยังไม่มีนัดหมาย'); await text(es, 'Supporting text', 'กบค. จะแจ้งช่วงวันนำรถเข้าอู่ทางแจ้งเตือน แล้วตอบรับหรือปฏิเสธได้ที่หน้านี้');
  const a = find(es, 'Actions'); if (a) a.visible = false;
  return [col('Section', [await section('รายละเอียดการนัดหมาย'), es], 16)];
}

/* ---------- S18 หน้าสรุปรายคัน (บล็อก S · 30 ต.ค. 2569 · R31) ----------
   เจ้าของงาน: "หน้าสรุปรายคัน ส่วนในหน้าสรุปรายคันจะแสดงประกันอยู่แล้ว เลยอยากได้แค่หน้าสรุปรายคันก่อน" (ตอบข้อ ค ของข้อเสนอ: รวมว่าคันนั้นทำอะไรไป อะไหล่ ประกัน เอกสาร ไว้หน้าเดียว)
   หน้า Detail อ่านอย่างเดียว เปิดเมื่อปิดงานแล้ว · ทุกหัวข้อ Section label · ตารางทุกตัว = component Table (R25) · กล่องแสดงข้อมูล R12
   ลำดับ: ยานพาหนะ → งาน Overhaul → ระยะเวลาและขั้นตอน (ตาราง 6 ขั้น) → การรับประกันงานซ่อม → อะไหล่ที่ใช้ → การติดตามงานซ่อม → เอกสาร
   ต่างจากแท็บ "หลัง Overhaul" ของหน้าประวัติรถ (dashboard · ไฟล์ 20): แท็บนั้นติดตามหลังรับรถคืน (ซ่อมซ้ำ ก่อน/หลัง) · หน้านี้สรุปงาน Overhaul รอบนั้นจบในตัว */
const SUM_STEPS = () => [['นัดเอารถเข้าอู่', '23/10/2569', 'หน่วยงานตอบรับ · ผู้นำส่งรถ นายสมชาย ใจดี', { text: 'นัด 22/10/2569 - 24/10/2569', sub: 'ส่งนัด 19/10/2569 · ผู้ประสานงาน ' + COORD[0] }],
  ['ตรวจรับรถ', '23/10/2569', 'ลงนาม 2 ฝ่าย กบค. และหน่วยงาน', { text: 'รายการเอกสารรับรถครบ 7 รายการ', sub: '' }],
  ['ติดตามงานซ่อม', '05/11/2569', 'ความคืบหน้า 2 รายการ', { text: 'ซ่อมสำเร็จ 06/11/2569', sub: 'อยู่อู่ 14 วัน' }],
  ['ตรวจสภาพ', '07/11/2569', 'เอกสาร Safety Inspection 2 ไฟล์', { text: 'ยืนยันการตรวจสภาพ', sub: '' }],
  ['นัดรับรถ', '09/11/2569', 'หน่วยงานตอบรับ · ผู้รับรถ นายประสิทธิ์ ตรวจสอบดี', { text: 'นัด 08/11/2569 - 09/11/2569', sub: '' }],
  ['ปิดงาน', CLOSE_DATE, 'อะไหล่ 3 รายการ · รับประกัน 360 วัน', { text: 'ปิดงานโดย ' + COORD[0], sub: '' }]];
const SUM_STEP_COLS = [['ขั้นตอน', 180, 'Lead text'], ['วันที่เสร็จ', 140], ['ผลของขั้น', 0], ['รายละเอียด', 340]];
/* w = ค่าประกัน: { on, start, days, end, left (เหลือกี่วัน ณ วันที่ดู), note } */
async function summaryWarranty(w) {
  const head = await sectionLabel('การรับประกันงานซ่อม');
  if (!w.on) return col('Section', [head, kv([['การรับประกันงานซ่อม', 'ไม่มี'], ['แจ้งเตือนก่อนหมด', 'ไม่แจ้งเตือน']])], 16);
  const state = w.left <= 0 ? ['หมดประกันแล้ว', 'Gray'] : w.left <= 30 ? ['ใกล้หมดประกัน', w.left <= 15 ? 'Error' : 'Warning'] : ['อยู่ในประกัน', 'Success'];
  const kids = [head, kv([['วันเริ่มรับประกัน', w.start], ['ระยะรับประกัน', w.days + ' วัน'], ['วันหมดอายุประกัน', w.end + (w.left > 0 ? ' (เหลือ ' + w.left + ' วัน)' : '')], ['สถานะ', state[0]],
    ['ผู้รับจ้าง', VENDOR[0]], ['หมายเลข PO', 'PO-700201'], ['แจ้งเตือนก่อนหมด', 'เจ้าของรถ และ กบค. 30 วัน และ 15 วัน'], ['แจ้งเตือนที่ส่งแล้ว', w.sent || 'ยังไม่ถึงรอบ']])];
  if (w.left > 0 && w.left <= 30) kids.splice(1, 0, alertBox(w.left <= 15 ? 'Error' : 'Warning', 'ประกันงานซ่อมเหลือ ' + w.left + ' วัน หมด ' + w.end, 'สำรวจความสมบูรณ์ของรถ หากพบปัญหาให้นำรถเข้าเก็บงานกับผู้รับจ้างตาม PO-700201 ก่อนหมดประกัน'));
  return col('Section', kids, 16);
}
async function jobSummary(name, o) {
  o = o || {};
  const w = o.warranty || Object.assign({ left: 360 }, WARRANTY);
  const { scr, page } = await shell(name, { title: '72-6648 สงขลา', back: true, crumbs: ['แผน 123460', 'PO-700201', '72-6648 สงขลา', 'สรุปรายคัน'], badge: JOB.V11, actions: EXPORT_BTNS, viewActions: EXPORT_BTNS });   // ส่งออกเป็นการดูข้อมูล ⇒ หน่วยงาน (VIEW) กดได้
  const sec = async (t, kids) => col('Section', [await sectionLabel(t)].concat(kids), 16);
  add(page, col('Content', [
    VIEW ? alertBox('Info', VIEW_NOTE[0], VIEW_NOTE[1]) : null,
    await sec('ข้อมูลยานพาหนะ', [kv([['ทะเบียน', '72-6648 สงขลา'], ['ยี่ห้อ/รุ่น', 'HINO FG1J'], ['ประเภท', 'รถกระเช้า'], ['อายุการใช้งาน', '16 ปี'], ['เลขไมล์สะสม', '221,300 กม.'], ['ชั่วโมงสะสม', '13,300 ชม.'], ['หน่วยงานเจ้าของรถ', 'กฟฟ.สงขลา']])]),
    await sec('ข้อมูลงาน Overhaul', [kv([['หมายเลขแผน', '123460'], ['ชื่อแผน', PLANS[0][1]], ['หมายเลข PO', 'PO-700201'], ['ศูนย์บริการ/อู่', VENDOR[0]],
      ['รับรถเข้าอู่', '23/10/2569'], ['ปิดงาน', CLOSE_DATE], ['ระยะเวลาทั้งหมด', '17 วัน (อยู่อู่ 14 วัน)'], ['ผู้ประสานงาน (กบค.)', COORD[0] + ' ' + COORD[2]]])]),
    await sec('ระยะเวลาและขั้นตอน', [await tbl(SUM_STEP_COLS, SUM_STEPS())]),
    await summaryWarranty(w),
    await sec('อะไหล่ที่ใช้ (' + PARTS.length + ')', [await tbl([['ชื่ออะไหล่', 0], ['จำนวน', 160], ['หน่วย', 160]], PARTS)]),
    await sec('การติดตามงานซ่อม (' + LOGS.length + ')', [await tbl([['วันที่', 190], ['รายละเอียด', 0], ['หมายเหตุ', 260]], LOGS)]),
    await sec('เอกสาร', [row('Row', [await upload('ใบสั่งจ้าง', [{ name: 'ใบสั่งจ้าง-PO-700201.pdf', size: '500 KB' }], { readonly: true }),
      await upload('เอกสาร Safety Inspection', SAFETY_DONE, { readonly: true })])]),
  ], 32), 'h');
  return scr;
}

/* ---------- S18 ส่งออกสรุปรายคัน PDF / Excel (30 ต.ค. 2569 · R32) ----------
   เจ้าของงาน: "ต้องมีปุ่ม export pdf,excel ด้วย ขอ ฟอร์ม export ด้วย ว่าจะรูปร่างยังไง" → เลือก "ทั้งสองอย่าง" (หน้าต่างกดส่งออก + หน้าตาไฟล์ที่ได้)
   · ปุ่ม Secondary "ส่งออก Excel" · "ส่งออก PDF" ที่หัวหน้า (ตามแบบปุ่ม Export ของ UI Release#2 ซึ่งเป็น Secondary button)
   · หน้าต่าง = Modal Type=Form (Card form row 3 แถว): แถว 1 Radio text card PDF / Excel (ตั้งตามปุ่มที่กด เปลี่ยนได้) · แถว 2–3 Checkbox with description หัวข้อที่รวม 4 ข้อ
     ข้อมูลยานพาหนะและข้อมูลงานรวมทุกครั้ง (บอกในบรรทัดรองของหัว) · ปุ่ม ยกเลิก / ส่งออก · สำเร็จ = toast + ชื่อไฟล์
   · ไฟล์ PDF = หน้ากระดาษ A4 794×1123 (เฟรม "ไฟล์ PDF" ไม่ใช่จอ — R32 ยกเว้นขนาดจอ R14) เรียงหัวข้อแบบหน้าสรุป ทุกชิ้นเป็น instance
   · ไฟล์ Excel = 1 หัวข้อ 1 ชีต (Tabs = แถบชีต) · ทุกชีตมีคอลัมน์ทะเบียน + PO นำหน้า ให้รวมหลายไฟล์ต่อกันได้ */
const EXPORT_BTNS = [['Secondary button', 'ส่งออก Excel', 'download-24-300-round'], ['Secondary button', 'ส่งออก PDF', 'download-24-300-round']];
const EXPORT_PARTS = [['ขั้นตอนและระยะเวลา', 'ตาราง 6 ขั้นพร้อมวันที่เสร็จ'], ['การรับประกันงานซ่อม', 'วันเริ่ม วันหมด และการแจ้งเตือน'], ['อะไหล่ที่ใช้', 'ชื่อ จำนวน หน่วย'], ['การติดตามงานซ่อม', 'ความคืบหน้าทุกรายการ']];
const EXPORT_FILE = (pdf) => 'สรุป-Overhaul-72-6648-สงขลา-PO-700201.' + (pdf ? 'pdf' : 'xlsx');
const EXPORT_CARDS = [['PDF', 'เอกสาร A4 สำหรับพิมพ์หรือแนบหนังสือ'], ['Excel', 'ไฟล์ .xlsx แยกชีตตามหัวข้อ']];
async function exportModal(scr, pdf, off) {   // off = ดัชนีหัวข้อที่ไม่ติ๊ก
  off = off || [];
  const sel = (i) => ((i === 0) === !!pdf ? 'True' : 'False');
  const fillCard = (n, i) => setProps(n, { Text: EXPORT_CARDS[i][0], 'Supporting text': EXPORT_CARDS[i][1], Supporting: true });
  const fillCheck = async (n, i) => { await text(n, 'Text', EXPORT_PARTS[i][0]); await text(n, 'Supporting text', EXPORT_PARTS[i][1]); const cb = find(n, 'Checkbox'); if (cb) setProps(cb, { Type: off.indexOf(i) < 0 ? 'Selected' : 'Unselected' }); };
  if (MOB) {   // mobile: bottom sheet การ์ด 2 ใบ + รายการติ๊ก
    const kids = [];
    for (const i of [0, 1]) { const c = inst('Radio text card', { State: 'Default', Selected: sel(i) }); fillCard(c, i); kids.push(c); }
    for (const i of [0, 1, 2, 3]) { const c = inst('Checkbox with description'); await fillCheck(c, i); kids.push(c); }
    return sheet(scr, { title: 'ส่งออกสรุปรายคัน', content: kids, ok: 'ส่งออก' });
  }
  const m = inst('Modal', { Type: 'Form', Size: 'md' });
  overlay(scr, m, 0, 0);
  const hd = find(m, 'Modal header');
  if (hd) { await text(hd, 'Text', 'ส่งออกสรุปรายคัน'); await text(hd, 'Supporting text', '72-6648 สงขลา · PO-700201 · ข้อมูลยานพาหนะและข้อมูลงานรวมทุกครั้ง'); }
  const rows = (find(m, 'Form') || m).children.filter(c => c.name === 'Card form row');
  const plan = [[['card', 0], ['card', 1]], [['check', 0], ['check', 1]], [['check', 2], ['check', 3]]];   // แถว 1 รูปแบบไฟล์ · แถว 2–3 หัวข้อที่รวม (2 ช่องต่อแถว)
  for (const [ri, r] of rows.entries()) {
    if (!plan[ri]) { r.visible = false; continue; }
    const [a, b] = plan[ri];
    const comp = (x) => x[0] === 'card' ? main('Radio text card', { State: 'Default', Selected: sel(x[1]) }) : main('Checkbox with description');
    setProps(r, { 'Input 2': true });
    const slots = r.children.filter(c => c.type === 'INSTANCE' && c.visible !== false);
    for (const [j, x] of [a, b].entries()) {
      const n = slots[j]; if (!n) { warn('ฟอร์มส่งออก', 'แถว ' + (ri + 1) + ' ไม่มีช่องที่ ' + (j + 1)); continue; }
      try { n.swapComponent(comp(x)); } catch (e) { warn('ฟอร์มส่งออก สลับช่อง', e); continue; }   // สลับช่องของ Card form row เป็นการ์ด/ติ๊ก (property Input swap ทำแบบเดียวกัน)
      USED.add(x[0] === 'card' ? 'Radio text card' : 'Checkbox with description');
      if (x[0] === 'card') fillCard(n, x[1]); else await fillCheck(n, x[1]);
    }
  }
  const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && n.parent.name === 'Actions');
  ft.forEach(btnN => { if (btnN.name === 'Primary button') setProps(btnN, { Text: 'ส่งออก', 'Leading icon': false, 'Trailing icon': false });
    else if (btnN.name === 'Secondary button') setProps(btnN, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false }); else btnN.visible = false; });
  return m;
}
/* หน้าตาไฟล์ — สร้างเป็นเฟรมเอกสาร (ไม่มี Sidebar/Header) ด้วย instance ชุดเดียวกับหน้าสรุป · บังคับ desktop (ไฟล์ไม่เปลี่ยนตามอุปกรณ์) */
async function docFrame(name, w, h, kids) {
  const was = MOB; MOB = false;
  try {
    const f = frame('OH2 / ' + name, 'VERTICAL', { fill: WHITE, pad: 48, gap: 24 });
    if (PLACE) { f.x = PLACE.x; f.y = PLACE.y; }
    f.primaryAxisSizingMode = 'FIXED'; f.counterAxisSizingMode = 'FIXED'; f.resize(w, h); f.clipsContent = false;
    for (const k of await kids()) if (k) add(f, k, 'h');
    return f;
  } finally { MOB = was; }
}
const PDF_HEAD = async (page) => [await sectionLabel('สรุปงาน Overhaul รายคัน · 72-6648 สงขลา'),
  kv([['หน่วยงานที่ออกเอกสาร', 'กบค. การไฟฟ้าส่วนภูมิภาค'], ['พิมพ์เมื่อ', '10/11/2569 10:30 น.'], ['ผู้พิมพ์', COORD[0]], ['หน้า', page + ' / 2']], 4)];
const PDF_STEP_COLS = [['ขั้นตอน', 130, 'Lead text'], ['วันที่เสร็จ', 110], ['ผลของขั้น', 0], ['รายละเอียด', 210]];
async function pdfPage(name, n) {
  return docFrame(name, 794, 1123, async () => {
    const head = await PDF_HEAD(n);
    if (n === 1) return head.concat([
      col('Section', [await sectionLabel('ข้อมูลยานพาหนะ'), kv([['ทะเบียน', '72-6648 สงขลา'], ['ยี่ห้อ/รุ่น', 'HINO FG1J'], ['ประเภท', 'รถกระเช้า'], ['อายุการใช้งาน', '16 ปี'], ['เลขไมล์สะสม', '221,300 กม.'], ['ชั่วโมงสะสม', '13,300 ชม.'], ['หน่วยงานเจ้าของรถ', 'กฟฟ.สงขลา']], 4)], 12),
      col('Section', [await sectionLabel('ข้อมูลงาน Overhaul'), kv([['หมายเลขแผน', '123460'], ['หมายเลข PO', 'PO-700201'], ['ศูนย์บริการ/อู่', VENDOR[0]], ['ผู้ประสานงาน (กบค.)', COORD[0]],
        ['รับรถเข้าอู่', '23/10/2569'], ['ปิดงาน', CLOSE_DATE], ['ระยะเวลาทั้งหมด', '17 วัน'], ['อยู่อู่', '14 วัน']], 4)], 12),
      col('Section', [await sectionLabel('ขั้นตอนและระยะเวลา'), await tbl(PDF_STEP_COLS, SUM_STEPS())], 12)]);
    return head.concat([
      col('Section', [await sectionLabel('การรับประกันงานซ่อม'), kv([['วันเริ่มรับประกัน', WARRANTY.start], ['ระยะรับประกัน', WARRANTY.days + ' วัน'], ['วันหมดอายุประกัน', WARRANTY.end], ['ผู้รับจ้าง', VENDOR[0]]], 4)], 12),
      col('Section', [await sectionLabel('อะไหล่ที่ใช้ (' + PARTS.length + ')'), await tbl([['ชื่ออะไหล่', 0], ['จำนวน', 120], ['หน่วย', 120]], PARTS)], 12),
      col('Section', [await sectionLabel('การติดตามงานซ่อม (' + LOGS.length + ')'), await tbl([['วันที่', 170], ['รายละเอียด', 0], ['หมายเหตุ', 170]], LOGS)], 12),
      col('Section', [await sectionLabel('เอกสารแนบในระบบ'), kv([['ใบสั่งจ้าง', 'ใบสั่งจ้าง-PO-700201.pdf'], ['เอกสาร Safety Inspection', SAFETY_DONE.map(f => f.name).join(', ')]], 2)], 12)]);
  });
}
const XLS_SHEETS = [['สรุป', ''], ['ขั้นตอน', ''], ['การรับประกัน', ''], ['อะไหล่', ''], ['การติดตามงานซ่อม', '']];
async function xlsSheet(name, sheet) {
  return docFrame(name, 1440, 1024, async () => {
    const t = await tabs(XLS_SHEETS, sheet);
    const lead = ['72-6648 สงขลา', 'PO-700201'];
    if (sheet === 0) return [t, await tbl([['ทะเบียน', 160, 'Lead text'], ['หมายเลข PO', 140], ['หัวข้อ', 260], ['ค่า', 0]],
      [['หน่วยงานเจ้าของรถ', 'กฟฟ.สงขลา'], ['ยี่ห้อ/รุ่น · ประเภท', 'HINO FG1J · รถกระเช้า'], ['หมายเลขแผน', '123460'], ['ศูนย์บริการ/อู่', VENDOR[0]], ['รับรถเข้าอู่', '23/10/2569'],
        ['ปิดงาน', CLOSE_DATE], ['ระยะเวลาทั้งหมด (วัน)', '17'], ['วันหมดอายุประกัน', WARRANTY.end], ['จำนวนอะไหล่ (รายการ)', String(PARTS.length)], ['ผู้ประสานงาน (กบค.)', COORD[0]]].map(r => lead.concat(r)))];
    return [t, await tbl([['ทะเบียน', 160, 'Lead text'], ['หมายเลข PO', 140], ['ชื่ออะไหล่', 0], ['จำนวน', 140], ['หน่วย', 140]], PARTS.map(p => lead.concat(p)))];
  });
}

/* ตรวจรับรถ (S8) ฉบับเจ้าของงาน 22 ต.ค. 2569 ดึก (บล็อก I · R23 · component-rules §4.2.4) = component ของ Flow การซ่อมทั้งก้อน:
   ReceiptChecklist "รายการเอกสารรับรถ" (State Default/Filled · Breakpoint Desktop/Mobile) + HandoverSignature "ลงนามการรับมอบรถ" (Default/Filled/Signed)
   + Modal Signature (Default/Filled) ตอนกดเซ็นลงนาม · ข้อความในเฟรมเจ้าของงาน = ค่าในตัว component (ไม่ override) · ไม่มีในไฟล์ → แบบเดิม checkinOld()
   o = { list: 'Default'|'Filled', sign: 'Default'|'Filled'|'Signed', modal: 'Default'|'Filled' } · ปุ่ม "ยืนยันรับรถ" กดได้เมื่อเซ็น 2 ฝ่าย (Signed) */
async function checkinPanel(scr, o) {
  o = o || {};
  if (!INDEX.has('ReceiptChecklist') || !INDEX.has('HandoverSignature') || (MOB && !o.mobOk)) return null;
  const rc = inst('ReceiptChecklist', { Breakpoint: MOB ? 'Mobile' : 'Desktop', State: o.list || 'Default' }); rc.name = 'ReceiptChecklist';
  const nodes = [rc];
  if (!MOB) { const hs = inst('HandoverSignature', { State: o.sign || 'Default' }); hs.name = 'HandoverSignature'; nodes.push(hs); }
  if (VIEW) nodes.forEach(n => n.findAll(x => x.type === 'INSTANCE' && /^(Primary|Secondary) button$/.test(x.name)).forEach(b => { b.visible = false; }));   // S17 ดูย้อนหลัง: ปุ่มแนบไฟล์/เซ็นลงนามในตัว component ของงานซ่อม ซ่อน
  nodes.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันรับรถ', { size: 'lg', disabled: o.sign !== 'Signed' }]]));
  return nodes;
}
async function signModal(scr, state) {   // Modal Signature (เต็มจอ มีพื้นหลังในตัว) หัว "ลงนามการรับมอบรถ" ปุ่ม ปิด · บันทึก ตามเฟรมเจ้าของงาน
  if (MOB || !INDEX.has('Modal Signature')) { await confirm(scr, { title: 'ลงนามการรับมอบรถ', sub: state === 'Filled' ? 'เซ็นลงนามแล้ว' : 'เซ็นลงนามในช่องด้านล่าง', cancel: 'ปิด', ok: 'บันทึก' }); return; }
  const m = inst('Modal Signature', { State: state || 'Default' }); m.name = 'Modal Signature';
  overlay(scr, m, 0, 0);
  const hd = find(m, 'Modal header'); if (hd) { await text(hd, 'Text', 'ลงนามการรับมอบรถ'); const sp = find(hd, 'Supporting text'); if (sp) sp.visible = false; }
  const ft = find(m, 'Modal footer');
  if (ft) { const sb = find(ft, 'Secondary button'); if (sb) setProps(sb, { Text: 'ปิด', 'Leading icon': false, 'Trailing icon': false }); const pb = find(ft, 'Primary button'); if (pb) setProps(pb, { Text: 'บันทึก', 'Leading icon': false, 'Trailing icon': false }); }
}
async function checkin(o) {   // ใช้ component ของงานซ่อมถ้ามี ไม่มี/มือถือ → แบบเดิม
  if (typeof o !== 'object') o = o ? { list: 'Filled', sign: 'Signed' } : {};
  const p = await checkinPanel(null, o);
  return p || checkinOld(o.sign === 'Signed');
}
async function checkinOld(done) {
  const sign = async (who, name) => {
    const box = col('Sign', [dropdown(who, done ? name : '', { placeholder: 'เลือกผู้ลงนาม' })], 12);
    add(box, done ? row('Signed', [pill('ลงนามแล้ว 19/10/2569', 'Success')], { hug: true }) : row('Sign', [btn('Secondary button', 'เซ็น')], { hug: true }), 'h');
    return box;
  };
  // หน้า 5 CF (21 ต.ค. 2569): ตารางตรวจรับรถ = รายการตรวจสอบ · ผลตรวจ · หมายเหตุ
  return [col('Section', [await section('รายการตรวจสอบก่อนซ่อม'), await tbl([['รายการตรวจสอบ', 0], ['ผลตรวจ', 130], ['หมายเหตุ', 360]], CHECKLIST.map(c => [{ check: !!done, text: c }, done ? { pill: ['ผ่าน', 'Success'] } : '—', '—']))], 16),
    col('Section', [await section('ลงนามรับรถ'), row('Row', [await sign('กบค.', 'นายวิชัย ทองดี'), await sign('หน่วยงานเจ้าของรถ', 'นายประวิทย์ แสงทอง')])], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันรับรถ', { size: 'lg' }]])];
}
/* ความคืบหน้า [วันที่, รายละเอียด, หมายเหตุ] — ยึดจอ scen J (J.1–J.3) ที่เจ้าของงานส่งจาก Figma 21 ต.ค. 2569 (R23): ตาราง วันที่ · รายละเอียด · หมายเหตุ · ไอคอนแก้ไข/ลบ + pagination
   · modal เพิ่ม/แก้ไข = วันที่/เวลา · รายละเอียด (Text area) · หมายเหตุ (ถ้ามี) placeholder "ระบุหมายเหตุ" · ปุ่ม ยกเลิก/บันทึก
   · คอลัมน์ ผู้บันทึก / รูป-ไฟล์แนบ ที่ PO CF หน้า 5 ไว้ ไม่อยู่ในจอที่เจ้าของงานเคาะ ⇒ ไม่ใส่ · state ดูรูปแนบ (lightbox) ถอดออก (ฟังก์ชัน lightbox เก็บไว้เผื่อกลับมา) */
const LOGS = [['22/10/2569 10:00 น.', 'รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน', '-'], ['05/11/2569 14:00 น.', 'เปลี่ยนชุดลูกสูบและแหวน ประกอบกลับ', 'ข้อความตัวอย่าง']];   // ค่าตามเฟรม J K L ของเจ้าของงาน 22 ต.ค. 2569
const LOG_EDITED = ['22/10/2569 10:00 น.', 'ข้อความทดสอบการแก้ไข', '-'];   // K.2/K.3 ค่าที่แก้ (ตามเฟรม K)
/* ฟอร์ม popup ฉบับเจ้าของงาน 22 ต.ค. 2569 (บล็อก J K L · component-rules.md §4.2.3) = 2 ช่อง: รายละเอียดการติดตาม (Text area) · หมายเหตุ (ถ้ามี)
   ตัดช่องวันที่/เวลาของฉบับ 21 ต.ค. — วันที่ในตารางระบบลงเอง */
const LOG_FIELDS = (l) => [{ label: 'รายละเอียดการติดตาม', value: l ? l[1] : 'รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน', area: 1 },
  { label: 'หมายเหตุ', value: l && l[2] !== '-' ? l[2] : '', optional: true, placeholder: 'ระบุหมายเหตุ' }];   // Optional ของ Input label แสดงเป็น "(ถ้ามี)" เอง · "-" ในตาราง = ไม่มีหมายเหตุ
async function logs(list) {
  const sec = col('Section', [await section('รายละเอียดการติดตาม', { buttons: [{ kind: 'Secondary button', text: 'ความคืบหน้า', icon: 'add-24-300-round' }] })], 16);
  if (list.length) add(sec, await tbl([['วันที่', 190], ['รายละเอียด', 0], ['หมายเหตุ', 260], ['', 104]], list.map(l => [l[0], l[1], l[2], { icons: list.length > 1 ? ['stylus-24-300-round', 'delete-24-300-round'] : ['stylus-24-300-round'] }]), { pagination: list.length }), 'h');   // ตามจอ scen J ของเจ้าของงาน (R23): วันที่ · รายละเอียด · หมายเหตุ · ไอคอน + pagination
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ยังไม่มีความคืบหน้า'); await text(es, 'Supporting text', 'เพิ่มความคืบหน้าอย่างน้อย 1 รายการก่อนกด "ซ่อมสำเร็จ"'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  return [sec, btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ซ่อมสำเร็จ', { size: 'lg', disabled: !list.length }]])];
}
/* S12 ตรวจสภาพ Safety — บล็อก M ฉบับเจ้าของงาน 22 ต.ค. 2569 (component-rules §4.2.6 · ~/PEA/Maintain-D/userflow/figma-ref/overhaul-M-2569-10-22.txt):
   Section header "เอกสารแนบ" · File upload "เอกสาร Safety Inspection" (ถ้ามี) · "PDF, PNG, or JPG (สูงสุด 10 ไฟล์)" · ปุ่ม ย้อนกลับ / ยืนยันการตรวจสภาพ */
const SAFETY_FILES = [{ name: 'Document.pdf', size: '200 KB', bar: true }, { name: 'Image.jpg', size: '200 KB', progress: true }, { name: 'Image.png', size: '200 KB', progress: true },
  { name: 'Document.pdf', err: true, errText: 'อัปโหลดไม่สำเร็จ' }];   // M.2 ตามเฟรมเจ้าของงาน
async function safety(files) {
  return [col('Section', [await section('เอกสารแนบ'), await upload('เอกสาร Safety Inspection', files, { optional: true, hint: 'PDF, PNG, or JPG (สูงสุด 10 ไฟล์)', readonly: VIEW })], 16),   // VIEW = รายการไฟล์อย่างเดียว ไม่มีกล่องอัปโหลด
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันการตรวจสภาพ', { size: 'lg' }]])];
}
const PARTS = [['ชุดลูกสูบพร้อมแหวน', '6', 'ชุด'], ['กรองน้ำมันเครื่อง', '2', 'ชิ้น'], ['น้ำมันเครื่อง 15W-40', '18', 'ลิตร']];
/* การรับประกันของผู้รับจ้าง (เจ้าของงาน 22 ต.ค. 2569): หน้าสุดท้ายของการปิดงาน กบค. ระบุ "จำนวนวัน" ระบบคำนวณวันหมดอายุให้ ·
   วันเริ่มรับประกัน ค่าตั้งต้น = วันปิดงาน แก้ได้ · เป็นประกันของบริษัทผู้รับจ้าง (ประกันของ กบค. เป็นอีกเรื่อง ยังไม่ทำ) · ใช้เฉพาะ Overhaul ก่อน (เจ้าของงานเคาะ 22 ต.ค.) ·
   ทำไมต้องเตือน: ให้หน่วยงานเจ้าของรถสำรวจความสมบูรณ์ของรถ ถ้าพบปัญหานำรถเข้าเก็บงานก่อนหมดประกัน — แจ้งเตือนอย่างเดียว ไม่มีขั้นตอนในระบบต่อ · ไฟล์ 21 หัวข้อ 4
   30 ต.ค. 2569 (เจ้าของงาน "เลือกรับประกัน งานซ่อม โดยให้เลือกจำนวนวันแล้วระบบคำนวนวันรับประกันให้"): หัว "การรับประกันงานซ่อม" · Toggle "มีการรับประกันงานซ่อม" (ตั้งต้นเปิด)
   เปิด = วันเริ่ม · dropdown ระยะรับประกัน ค่าตายตัว 90/180/360/720 วัน (ไม่มีระบุเอง) · วันหมดอายุ Readonly · ปิด = ซ่อนช่อง ไม่แจ้งเตือน ·
   เตือนทั้งหน่วยงานเจ้าของรถ และ กบค. ทางกระดิ่ง ก่อนหมด 30 และ 15 วัน (S15 บล็อก P · เดิม 22 ต.ค. เตือน กบค. อย่างเดียว) */
const CLOSE_DATE = '09/11/2569';   // วันปิดงานในข้อมูลจำลอง (หลังนัดรับรถ 08–09/11/2569)
const WARRANTY_DAYS = [['90 วัน', 'หมดอายุ 07/02/2570'], ['180 วัน', 'หมดอายุ 08/05/2570'], ['360 วัน', 'หมดอายุ 04/11/2570'], ['720 วัน', 'หมดอายุ 29/10/2571']];   // นับจากวันปิดงานจำลอง
const WARRANTY = { on: true, start: CLOSE_DATE, days: '360', end: '04/11/2570' };   // 9 พ.ย. 2569 + 360 วัน
const WARRANTY_NOTE = 'ระบบจะแจ้งเตือนหน่วยงานเจ้าของรถ และ กบค. ก่อนประกันหมด 30 วัน และ 15 วัน';
async function toggleRow(label, sub, on) {   // Toggle with description: สวิตช์อยู่ใน instance ชื่อ Toggle (Pressed True/False)
  const t = inst('Toggle with description');
  await text(t, 'Text', label);
  if (sub) await text(t, 'Supporting text', sub); else hide(t, 'Supporting text');
  const tg = find(t, 'Toggle'); if (tg) setProps(tg, { Pressed: on ? 'True' : 'False' });
  return t;
}
const warrantyAnchor = (s) => { const dd = s.findAll(n => n.type === 'INSTANCE' && n.name === 'Input dropdown').find(n => Object.entries(n.componentProperties || {}).some(([k, v]) => k.split('#')[0] === 'Label text' && v.value === 'ระยะรับประกัน')); return dd && (find(dd, 'Container') || dd); };
async function warrantySec(closed, w, o) {
  o = o || {};
  const head = await section('การรับประกันงานซ่อม');
  if (closed) return col('Section', [head, kv(w.on ? [['วันเริ่มรับประกัน', w.start], ['ระยะรับประกัน', w.days + ' วัน'], ['วันหมดอายุประกัน', w.end], ['แจ้งเตือนก่อนหมด', 'เจ้าของรถ และ กบค. 30 วัน และ 15 วัน']]
    : [['การรับประกันงานซ่อม', 'ไม่มี'], ['แจ้งเตือนก่อนหมด', 'ไม่แจ้งเตือน']])], 16);
  const tg = await toggleRow('มีการรับประกันงานซ่อม', 'ประกันผลงานของผู้รับจ้างตามสัญญา', w.on);
  if (!w.on) return col('Section', [head, tg, alertBox('Info', 'งานนี้ไม่มีการรับประกัน', 'ระบบจะไม่แจ้งเตือนก่อนหมดประกัน · เปิดสวิตช์เมื่อสัญญามีการรับประกันผลงาน')], 16);
  return col('Section', [head, tg,
    row('Row', [field('วันเริ่มรับประกัน', w.start, { placeholder: 'วว/ดด/ปปปป' }),
      dropdown('ระยะรับประกัน', w.days ? w.days + ' วัน' : '', { placeholder: 'เลือกระยะรับประกัน', error: o.error ? 'กรุณาเลือกระยะรับประกัน' : '', state: o.daysOpen ? 'Focused' : undefined }),
      field('วันหมดอายุประกัน', w.end || '', { state: 'Readonly', placeholder: 'คำนวณเมื่อเลือกระยะรับประกัน' })]),
    alertBox('Info', WARRANTY_NOTE, 'แจ้งทางกระดิ่งในระบบ เพื่อให้หน่วยงานสำรวจความสมบูรณ์ของรถ และนำรถเข้าเก็บงานก่อนหมดประกัน · วันเริ่มตั้งต้นเป็นวันปิดงาน แก้ได้ · วันหมดอายุ = วันเริ่ม + ระยะรับประกัน')], 16);
}
async function closeJob(parts, closed, o) {
  o = o || {};
  const w = o.warranty || (parts.length ? WARRANTY : { on: true, start: CLOSE_DATE });
  const sec = col('Section', [await section('รายการอะไหล่ที่ใช้', { buttons: closed ? [] : [{ kind: 'Secondary button', text: 'นำเข้าไฟล์', icon: 'cloud_upload-24-300-round' }] })], 16);
  if (!closed) add(sec, row('Row', [field('ชื่ออะไหล่', '', { placeholder: 'เช่น ชุดลูกสูบพร้อมแหวน' }), field('จำนวน', '1'), dropdown('หน่วย', 'ชิ้น')]), 'h');   // PO ถาม 21 ต.ค.: "มีเพิ่มด้วยไหม" — มี (แถวนี้) · จำนวน = ตัวเลข หน่วย = ชิ้น/ชุด/ลิตร
  // PO CF หน้า 5 (21 ต.ค. 2569): ไฟล์อะไหล่ผิดรูปแบบขึ้นเป็น validation ที่ตัวไฟล์ ไม่ใช่ toast
  if (o.importErr) add(sec, await upload('นำเข้าไฟล์อะไหล่', [{ name: 'อะไหล่-72-6648.docx', err: 1 }], { accept: 'XLSX, CSV', errText: 'นำเข้าไม่สำเร็จ — รับเฉพาะไฟล์ .xlsx หรือ .csv', error: 'ไฟล์ผิดรูปแบบ กรุณาเลือกไฟล์ .xlsx หรือ .csv' }), 'h');
  if (parts.length) add(sec, await tbl([['ชื่ออะไหล่', 0], ['จำนวน', 160], ['หน่วย', 160]].concat(closed ? [] : [['', 72]]), parts.map(p => closed ? p : p.concat([{ icons: ['delete-24-300-round'] }]))), 'h');
  else { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', 'ยังไม่ได้ระบุอะไหล่ที่ใช้'); await text(es, 'Supporting text', 'เพิ่มทีละรายการหรือนำเข้าไฟล์ — ต้องมีอย่างน้อย 1 รายการจึงปิดงานได้'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  return [sec, await warrantySec(closed, w, o), closed ? alertBox('Success', 'ปิดงานแล้ว ' + CLOSE_DATE, 'รถคันนี้จบรอบ Overhaul') : btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ปิดงาน', { size: 'lg' }]])];
}

/* ---------- ถ้อยคำ toast = คอลัมน์ "ข้อความ toast" ของชีตแท็บ "OH-Toast (ทุกหน้า)" คำต่อคำ (gid 1776901454 · อ่าน 21 ต.ค. 2569 บ่าย · เจ้าของงานสั่ง "คำใน toast ให้ตรงกับชีต อิงจาก tab นี้")
   · placeholder คงไว้ตามชีต ({เลขแผน} · {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} · {สังกัด} · {ชื่อไฟล์}) ไม่แทนด้วยค่าตัวอย่าง · ไม่มีบรรทัดรอง ยกเว้น General Error ที่ชีตเขียนเป็นประโยคยาว (แยกเป็นหัว + บรรทัดรอง)
   · เลข = แถวในชีต (1–26) · ตัด 5 10 (ลบไม่สำเร็จ — PO: soft delete ไม่มีเคส) และ 24 (ไฟล์ผิดรูปแบบ → validation ไม่ใช่ toast)
   · ข้อ 9 ชีตคอลัมน์ข้อความยังเป็น "ลบ purchase order สำเร็จ" แต่ NOTE BY PEACE ให้เปลี่ยนเป็น "ลบ PO สำเร็จ" — ใช้ตาม NOTE
   · noti = ชีตคอลัมน์ notification ระบุ "notification (ตาม Toast เลย)" · แก้ถ้อยคำ → แก้ที่นี่ที่เดียว (ใช้ทั้งจอ scenario และหน้า toast แยก) ---------- */
const GENERAL_ERROR = { err: 1, title: 'General Error', sub: 'ถ้าไม่รู้ว่า Error จากอะไร ให้เอา Status Code มาแสดงแทน เช่น 500 Internal Server Error' };
const TOASTS = {
  1: { page: 1, when: 'สร้างแผน → บันทึก (กลับหน้ารายการ)', title: 'สร้างแผน Overhaul {เลขแผน} สำเร็จ' },
  2: Object.assign({ page: 1, when: 'บันทึกแผนไม่สำเร็จ (ฟอร์มสร้าง/แก้ไขแผน)' }, GENERAL_ERROR),
  3: { page: 1, when: 'แก้ไขแผน → บันทึก', title: 'บันทึกการแก้ไขแผนสำเร็จ' },
  4: { page: 1, when: 'ลบแผน → ยืนยันการลบแผน', title: 'ลบแผน Overhaul {เลขแผน} สำเร็จ' },
  6: { page: 1, when: 'เปิดแก้ไขแผนที่ถูกลบไปแล้ว', err: 1, title: 'ไม่พบแผน {เลขแผน}' },
  7: { page: 2, when: 'เพิ่ม PO → บันทึก (กลับหน้ารายละเอียดแผน)', title: 'การสร้าง purchase order สำเร็จ' },
  8: { page: 2, when: 'แก้ไข PO → บันทึก', title: 'บันทึกการแก้ไข PO สำเร็จ' },
  9: { page: 2, when: 'ลบ PO → ยืนยันการลบ PO', title: 'ลบ PO สำเร็จ' },
  11: Object.assign({ page: 4, when: 'บันทึก PO ไม่สำเร็จ' }, GENERAL_ERROR),
  12: { page: 4, when: 'เปิดฟอร์ม PO จากแผนที่ถูกลบไปแล้ว', err: 1, title: 'ไม่พบแผน' },
  13: { page: 5, when: 'ขั้น 1 / ขั้น 5 → ยืนยันนัดหมาย', title: 'นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ', noti: 1 },
  14: { page: 5, when: 'ขั้น 1 / ขั้น 5 → ยืนยันนัดหมายไม่สำเร็จ', err: 1, title: 'นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} ไม่สำเร็จ' },
  15: { page: 5, when: 'หน่วยงานเจ้าของรถตอบรับนัด', title: 'หน่วยงาน {สังกัด} ของ {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} ยืนยันนัดหมายแล้ว', noti: 1 },
  16: { page: 5, when: 'หน่วยงานเจ้าของรถปฏิเสธนัด', err: 1, title: 'หน่วยงาน {สังกัด} ของ {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} ปฏิเสธนัดหมาย' },
  17: { page: 5, when: 'ขั้น 2 ตรวจรับรถ → ยืนยันรับรถ', title: 'ยืนยันรับรถสำเร็จ', noti: 1 },
  18: { page: 5, when: 'ขั้น 3 → เพิ่มความคืบหน้า → บันทึก', title: 'เพิ่มความคืบหน้าสำเร็จ' },
  19: { page: 5, when: 'ขั้น 3 → แก้ไขความคืบหน้า → บันทึก', title: 'แก้ไขความคืบหน้าสำเร็จ' },
  20: { page: 5, when: 'ขั้น 3 → ลบ → ยืนยันการลบความคืบหน้า', title: 'ลบความคืบหน้าสำเร็จ' },
  21: { page: 5, when: 'ขั้น 3 → ซ่อมสำเร็จ', title: 'บันทึกซ่อมสำเร็จ' },
  22: { page: 5, when: 'ขั้น 4 → อัปโหลด Safety Inspection → ยืนยันการตรวจสอบ', title: 'ยืนยันการตรวจสอบสำเร็จ' },
  23: { page: 5, when: 'ขั้น 6 → นำเข้าไฟล์อะไหล่', title: 'นำเข้าไฟล์ {ชื่อไฟล์} สำเร็จ' },
  25: { page: 5, when: 'ขั้น 6 → ปิดงาน', title: 'ปิดงาน {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} เรียบร้อยแล้ว', noti: 1 },
  26: Object.assign({ page: 5, when: 'บันทึกไม่สำเร็จในขั้น 2–6' }, GENERAL_ERROR),
};
const T = (scr, n) => toast(scr, TOASTS[n]);
/* toast ของบล็อก B ตามจอเจ้าของงาน 22 ต.ค. 2569: หัว "general error" (ตัวเล็ก) · "สร้างแผน Overhaul สำเร็จ" (ไม่มีเลขแผน) — บรรทัดรองในจอเป็นข้อความตัวอย่างของ component ⇒ ใช้ของ GENERAL_ERROR / ไม่มีบรรทัดรอง */
const B_TOAST_ERR = { err: 1, title: 'general error', sub: GENERAL_ERROR.sub };
const B_TOAST_OK = { title: 'สร้างแผน Overhaul สำเร็จ' };
/* บล็อก C · D ตามจอเจ้าของงาน 22 ต.ค. 2569 */
const C_TOAST_OK = { title: 'บันทึกการแก้ไขแผนสำเร็จ' };
const D_TOAST_OK = { title: 'ลบแผน overhaul สำเร็จ' };   // ตัวพิมพ์ตามจอ
/* บล็อก E F G ฉบับเจ้าของงาน 29 ต.ค. 2569 (component-rules §4.2.7–4.2.9) — คำบนจอ scenario ตามเฟรม · หน้า toast แยก (R20) คงคำตามชีต (toast 7 8 9)
   F: เฟรมเขียน "บันทึกการแก้ไขแผนสำเร็จ" (ก๊อปจากบล็อก C) ⇒ เจ้าของงานเคาะ 29 ต.ค. ใช้ "บันทึกการแก้ไข PO สำเร็จ" */
const E_TOAST_OK = { title: 'การเพิ่ม Purchase Order สำเร็จ' };
const F_TOAST_OK = { title: 'บันทึกการแก้ไข PO สำเร็จ' };
const G_TOAST_OK = { title: 'ลบ purchase order สำเร็จ' };
const O_TOAST_OK = { title: 'ปิดงานสำเร็จ' };   // บล็อก O ฉบับเจ้าของงาน 29 ต.ค. 2569
const EDIT_CONFIRM = { title: 'ยืนยันการแก้ไข', sub: 'เมื่อยืนยันการแก้ไขแล้วจะไม่สามารถย้อนกลับได้ โปรดตรวจสอบก่อนยืนยัน', cancel: 'ยกเลิก', ok: 'ยืนยัน' };   // ชุดเดียวกับ C.4 (F.3 ฉบับเจ้าของงาน)
const E_PLAN = ['123458'].concat(NEW_PLAN.slice(1));   // หน้ารายละเอียดแผนของ E/F ตามเฟรม: ค่าของแผนที่เพิ่งสร้าง (2570 รถเจาะหลุม 5,500,000) · เลขแผน 123458 ตาม breadcrumb ของฟอร์ม (Z69000X ในเฟรม = placeholder)
const EDIT_PO = { edit: true, name: 'ซ่อมระบบแอร์', vendor: 'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', sel: [0, 2], order: [{ name: 'ใบสั่งจ้าง.pdf', size: '195 KB' }] };   // F.2 F.3 ตามเฟรม (ขนาดในเฟรม 195 MB เกินเพดาน 10 MB ⇒ ใช้ KB ตามที่เจ้าของงานเคาะ)
const L_TOAST_OK = { title: 'ลบรายละเอียดการติดตาม สำเร็จ' };   // บล็อก L ฉบับเจ้าของงาน 22 ต.ค. (เว้นวรรคตามจอ) — หน้า toast แยก (R20) ยังเป็นถ้อยคำชีต (toast 20)
const D_CONFIRM = { danger: true, title: 'ยืนยันการลบแผน', sub: 'เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่', cancel: 'ยกเลิก', ok: 'ยืนยัน' };   // toast บนจอ scenario = Notification ขวาล่าง ห่างขอบ 24 พร้อมบรรทัดรอง (สเปก 16 ข้อ 1.1)
const NEW_PO = ['PO-700202', 'ซ่อมระบบแอร์', 'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', '2', 0, '20 ต.ค. 2569', '20 ม.ค. 2570', false];

/* ---------- รายการจอแยกตาม scenario (ชื่อ section = ชื่อ scenario ใน userflow) — ฉบับหลัง PO confirm ทุกหน้า (21 ต.ค. 2569)
   เปลี่ยนจาก 19 ต.ค.: จัดการเป็นไอคอน (ไม่มี state เมนู "…") · ตาราง/ตัวกรอง/ค้นหาหน้า 1 ฉบับ CF · ถ้อยคำ toast ตาม TOASTS · + state ไม่พบแผน · บันทึกไม่สำเร็จ · lightbox · validation ไฟล์ ---------- */
const D = (a, b) => [a, b];
const SCENARIOS = [
  ['หน้ารายการแผน — ค้นหา · ตัวกรอง · ค้นไม่เจอ · ยังไม่มีแผน', [
    ['รายการแผน', () => listScreen('รายการแผน', CF_LIST)],
    ['ตัวกรอง', async () => { const s = await listScreen('ตัวกรอง', CF_LIST); await filterPanelCF(s); return s; }],
    ['ค้นไม่เจอ', () => listScreen('ค้นไม่เจอ', { notFound: true, query: 'แผน Overhaul ปี 2573' })],
    ['ยังไม่มีแผน', () => listScreen('ยังไม่มีแผน', { empty: true })]]],
  // บล็อก B ฉบับเจ้าของงาน 22 ต.ค. 2569 — "export scenB ต้องได้แบบที่ส่งให้ เป๊ะเลย" (component-rules §4.2.1 · ข้อความดิบ figma-ref/overhaul-B-2569-10-22.txt)
  ['S1 · กบค. สร้างแผน Overhaul และ ดูรายละเอียด', [
    ['ฟอร์มสร้างแผน Default', () => planForm('S1 ฟอร์มสร้างแผน Default', {}), '1'],
    ['Validation กรณีไม่ได้เลือก, Out of focus', () => planForm('S1 Validation', { errors: true }), '2'],
    // 29 ต.ค. 2569 ประเภทงบประมาณ: B.3 แตกเป็น B.3.1 เปิดรายการประเภทงบ + B.3.2–B.3.6 กรอกครบรายประเภท (B.3.4 = Filled เดิม)
    ['เลือกประเภทงบประมาณ', async () => { const s = await planForm('S1 เลือกประเภทงบประมาณ', { values: Object.assign({}, FILLED, { btype: '' }), typeOpen: true });
      comboAt(s, budgetTypeAnchor(s), BUDGET_TYPES.map(t => [t, ''])); return s; }, '3.1'],
    ['Filled — งบทำการ หน่วยงานต้นสังกัด', () => planForm('S1 Filled ต้นสังกัด', { values: budgetFilled(0) }), '3.2'],
    ['Filled — งบทำการ หน่วยงานอื่น', async () => { const s = await planForm('S1 Filled หน่วยงานอื่น', { values: budgetFilled(1, { ccOpen: true }) });
      const dd = s.findAll(n => n.type === 'INSTANCE' && n.name === 'Input dropdown')[2]; comboAt(s, dd && (find(dd, 'Container') || dd), COST_CENTERS.map(c => [c[0] + '  ' + c[1], ''])); return s; }, '3.3'],
    ['Filled — งบลงทุน งานก่อสร้าง', () => planForm('S1 Filled', { values: FILLED }), '3.4'],
    ['Filled — งบลงทุน งานบำรุงรักษา', () => planForm('S1 Filled งานบำรุงรักษา', { values: budgetFilled(3) }), '3.5'],
    ['Filled — อื่น ๆ', () => planForm('S1 Filled อื่น ๆ', { values: budgetFilled(4) }), '3.6'],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await planForm('S1 ยืนยันการออก', { values: FILLED }); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก', cancel: 'ปิด' }); return s; }, '4'],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S1 บันทึกไม่สำเร็จ', { values: FILLED }); await toast(s, B_TOAST_ERR); return s; }, '5'],
    ['บันทึกสำเร็จ', async () => { const s = await listScreen('S1 บันทึกสำเร็จ', CF_LIST); await toast(s, B_TOAST_OK); return s; }, '6'],   // จอเจ้าของงาน: รายการ 10 แถวเดิม (จาก 95) + toast · ไม่แทรกแถวใหม่
    ['ดูรายละเอียดแผน', () => planDetail('S1 รายละเอียดแผน', { plan: NEW_PLAN, pos: [], badge: ['ยังไม่มี PO', 'Gray'] }), '7']]],
  // บล็อก C · D ฉบับเจ้าของงาน 22 ต.ค. 2569 — "อ่าน scen C and D และ Design ให้เป็นต้นแบบในการ export ครั้งต่อไป" (component-rules §4.2.2 · ข้อความดิบ figma-ref/overhaul-CD-2569-10-22.txt)
  ['S2 · กบค. แก้ไขแผน', [
    ['เมนู "…" → แก้ไข', async () => { const s = await listScreen('S2 เมนู', CF_LIST); menuAt(s, firstMenuCell(s), MENU); return s; }],
    ['ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้', () => planForm('S2 ฟอร์มแก้ไข', { edit: true, planNo: NEW_PLAN[0], values: FILLED })],
    ['“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น', async () => { const s = await planForm('S2 ยืนยันการออก', { edit: true, planNo: NEW_PLAN[0], values: FILLED });
      await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ยืนยัน' }); return s; }],
    ['ยืนยันการแก้ไขแผน', async () => { const s = await planForm('S2 ยืนยันการแก้ไข', { edit: true, planNo: NEW_PLAN[0], values: FILLED });
      await confirm(s, { title: 'ยืนยันการแก้ไข', sub: 'เมื่อยืนยันการแก้ไขแล้วจะไม่สามารถย้อนกลับได้ โปรดตรวจสอบก่อนยืนยัน', cancel: 'ยกเลิก', ok: 'ยืนยัน' }); return s; }],
    ['บันทึกสำเร็จ', async () => { const s = await planDetail('S2 บันทึกสำเร็จ', { plan: NEW_PLAN, pos: [], badge: ['ยังไม่มี PO', 'Gray'] }); await toast(s, C_TOAST_OK); return s; }]]],
  ['S3 · กบค. ลบแผน', [
    // ลำดับคอลัมน์ตามเฟรมเจ้าของงาน 22 ต.ค. ดึก: เส้นหน้า List (D.1.1 → D.2.1 → D.3) แล้วเส้นหน้า Detail (D.1.2 → D.2.2)
    ['เมนู "…" → ลบ ในหน้า List', async () => { const s = await listScreen('S3 เมนู', CF_LIST); menuAt(s, firstMenuCell(s), MENU); return s; }, '1.1'],
    ['ยืนยันการลบแผน ในหน้า List', async () => { const s = await listScreen('S3 ยืนยันการลบ List', CF_LIST); await confirm(s, D_CONFIRM); return s; }, '2.1'],
    ['ลบสำเร็จ (ลบที่ List or Detail ก็กลับมานี่)', async () => { const s = await listScreen('S3 ลบสำเร็จ', CF_LIST); await toast(s, D_TOAST_OK); return s; }, '3'],
    ['ปุ่ม “ลบแผน” ในหน้า Detail', () => planDetail('S3 ปุ่มลบแผน', { plan: NEW_PLAN, pos: [], badge: ['ยังไม่มี PO', 'Gray'] }), '1.2'],
    ['ยืนยันการลบแผน ในหน้า Detail', async () => { const s = await planDetail('S3 ยืนยันการลบ Detail', { plan: NEW_PLAN, pos: [], badge: ['ยังไม่มี PO', 'Gray'] }); await confirm(s, D_CONFIRM); return s; }, '2.2']]],
  // บล็อก E F G ฉบับเจ้าของงาน 29 ต.ค. 2569 (R23 · component-rules §4.2.7–4.2.9 · ข้อความดิบ figma-ref/overhaul-E|F|G-2569-10-29.txt) — หน้ารายละเอียดแผนใช้แบบ E/F ทุกจอ (เจ้าของงานเคาะ: G เป็นฉบับก่อน CF ใช้แค่ state · modal · toast)
  ['S4 · กบค. สร้าง Purchase order', [
    ['รายละเอียดแผน (ยังไม่มี PO)', () => planDetail('S4 แผนยังไม่มี PO', { plan: E_PLAN, pos: [], badge: ['ยังไม่มี PO', 'Gray'], poBtn: 'เพิ่ม Purchase Order' })],
    ['ฟอร์ม PO Default', () => poForm('S4 ฟอร์ม PO Default', {})],
    ['Validation กรณีไม่ได้เลือก, Out of focus', () => poForm('S4 Validation', { errors: true })],
    ['เลือกอู่ (พิมพ์ค้น)', () => poForm('S4 เลือกอู่', { name: 'ซ่อมระบบแอร์', vendor: 'ตรี', vendorOpen: true })],
    ['เลือกรถ (พิมพ์ค้นแล้วเลือกจาก dropdown)', () => poForm('S4 เลือกรถ', { name: 'ซ่อมระบบแอร์', vendor: 'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', query: '701', carOpen: true, sel: [2], tick: [0, 1] })],   // desktop: พิมพ์ "701" → 70-1123 ชลบุรี (เลือกแล้ว) · mobile ยังเป็น dual list เดิม
    ['กรอกครบ', () => poForm('S4 กรอกครบ', { name: 'ซ่อมระบบแอร์', vendor: 'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', sel: [3, 6], order: [{ name: 'ใบสั่งจ้าง.pdf', size: '195 KB' }] })],
    ['บันทึกไม่สำเร็จ (toast 11)', async () => { const s = await poForm('S4 บันทึกไม่สำเร็จ', { name: 'ซ่อมระบบแอร์', vendor: 'บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด', sel: [3, 6], order: [{ name: 'ใบสั่งจ้าง.pdf', size: '195 KB' }] }); await T(s, 11); return s; }],
    ['บันทึกสำเร็จ (toast 7)', async () => { const s = await planDetail('S4 บันทึกสำเร็จ', { plan: E_PLAN, pos: [NEW_PO] }); await toast(s, E_TOAST_OK); return s; }],
    ['รายละเอียด PO', () => poDetail('S4 รายละเอียด PO')]]],
  ['S5 · กบค. แก้ไข Purchase order', [   // เส้นจากหน้ารายละเอียดแผน (F.1.1 → F.2 → F.3 → F.4.1) แล้วเส้นจากหน้ารายละเอียด PO (F.1.2 → F.4.2) — บันทึกแล้วกลับจอที่มา
    ['เมนู "…" ของ PO → แก้ไข', async () => { const s = await planDetail('S5 เมนู PO', { plan: E_PLAN, pos: [NEW_PO] }); menuAt(s, firstMenuCell(s), MENU); return s; }, '1.1'],
    ['ฟอร์มแก้ไข PO', () => poForm('S5 ฟอร์มแก้ไข PO', EDIT_PO), '2'],
    ['ยืนยันการแก้ไข PO', async () => { const s = await poForm('S5 ยืนยันการแก้ไข PO', EDIT_PO); await confirm(s, EDIT_CONFIRM); return s; }, '3'],
    ['บันทึกสำเร็จ', async () => { const s = await planDetail('S5 บันทึกสำเร็จ จากแผน', { plan: E_PLAN, pos: [NEW_PO] }); await toast(s, F_TOAST_OK); return s; }, '4.1'],
    ['รายละเอียด PO → แก้ไข', () => poDetail('S5 รายละเอียด PO → แก้ไข'), '1.2'],
    ['บันทึกสำเร็จ', async () => { const s = await poDetail('S5 บันทึกสำเร็จ จาก PO'); await toast(s, F_TOAST_OK); return s; }, '4.2']]],
  ['S6 · กบค. ลบ purchase order', [
    ['ยืนยันการลบ PO', async () => { const s = await planDetail('S6 ยืนยันการลบ PO'); await confirm(s, Object.assign({}, D_CONFIRM, { title: 'ยืนยันการลบ' })); return s; }],
    ['ลบสำเร็จ', async () => { const s = await planDetail('S6 ลบสำเร็จ', { pos: POS.slice(1) }); await toast(s, G_TOAST_OK); return s; }]]],
  ['S7 · กบค. นัดหมายหน่วยงาน นำรถเข้า overhaul', [
    ['ฟอร์มนัด (ว่าง)', () => job('S7 ฟอร์มนัด', 'V1', () => apptForm(false))],
    ['กดยืนยันโดยยังไม่ครบ', () => job('S7 ยังไม่ครบ', 'V1', () => apptForm(false, { errors: true }))],
    ['เลือกผู้ประสานงาน', async () => { let c; const s = await job('S7 เลือกผู้ประสานงาน', 'V1', async () => { const n = await apptForm(false, { d1: '22/10/2569', d2: '24/10/2569', open: true }); c = n._coord; return n; });
      comboAt(s, (c.findOne && c.findOne(x => x.name === 'Container')) || c, [['นายวิชัย ทองดี', 'วิศวกร กบค. · 02-590-9123'], ['นางสาวกนกวรรณ ใจมั่น', 'พนักงานช่าง กบค. · 02-590-9124']]); return s; }],
    ['สร้างนัดไม่สำเร็จ (toast 14)', async () => { const s = await job('S7 ไม่สำเร็จ', 'V1', () => apptForm(false, { d1: '22/10/2569', d2: '24/10/2569', coord: 1 })); await T(s, 14); return s; }],
    ['รอหน่วยงานตอบรับ (toast 13)', async () => { const s = await job('S7 รอตอบรับ', 'V2', () => apptWait(false, '22/10/2569', '24/10/2569')); await T(s, 13); return s; }],
    ['หน่วยงานปฏิเสธ (toast 16)', async () => { const s = await job('S7 ปฏิเสธ', 'V3', () => apptRejected(false, '22/10/2569', '24/10/2569')); await T(s, 16); return s; }],
    ['แก้ไขนัดหมาย', () => job('S7 แก้ไขนัด', 'V3', () => apptForm(false, { d1: '29/10/2569', d2: '31/10/2569', coord: 1 }))]]],
  ['S8 · กบค. ตรวจรับรถก่อน Overhaul', [   // บล็อก I ฉบับเจ้าของงาน 22 ต.ค. 2569 ดึก (R23 · §4.2.4) — ReceiptChecklist + HandoverSignature + Modal Signature ของงานซ่อม · ไม่มี toast ในเฟรม (toast 15 อยู่หน้า toast แยก)
    ['Default', () => job('S8 Default', 'V4', () => checkin({ list: 'Default', sign: 'Default' }))],
    ['Filled ตรวจ + เลือกผู้ลงนาม + ยังไม่ได้เซ็น', () => job('S8 Filled', 'V4', () => checkin({ list: 'Filled', sign: 'Filled' }))],
    ['เซ็นลงนาม Default', async () => { const s = await job('S8 เซ็นลงนาม', 'V4', () => checkin({ list: 'Filled', sign: 'Filled' })); await signModal(s, 'Default'); return s; }],
    ['เซ็นลงนาม Filled', async () => { const s = await job('S8 เซ็นลงนามแล้ว', 'V4', () => checkin({ list: 'Filled', sign: 'Filled' })); await signModal(s, 'Filled'); return s; }],
    ['Filled ตรวจ + เซ็น 2 ฝ่าย ปุ่ม “ยืนยันรับรถ” จะ Enable', () => job('S8 เซ็น 2 ฝ่าย', 'V4', () => checkin({ list: 'Filled', sign: 'Signed' }))]]],
  ['S9 · กบค. เพิ่มการติดตามผลการดำเนินการ Overhaul', [   // บล็อก J ฉบับเจ้าของงาน 22 ต.ค. 2569 (R23 · §4.2.3) · J.3 ไม่มี toast (เจ้าของงานเคาะ 22 ต.ค. "ยังไม่ต้องมี toast เดี๋ยว implement อีกที") · toast 18 อยู่บนหน้า toast แยก
    ['ยังไม่มีความคืบหน้า', () => job('S9 ว่าง', 'V5', () => logs([]))],
    ['เพิ่มความคืบหน้า', async () => { const s = await job('S9 เพิ่ม', 'V5', () => logs([])); await formModal(s, { title: 'เพิ่มความคืบหน้า', fields: LOG_FIELDS(null) }); return s; }],
    ['เพิ่มความคืบหน้าสำเร็จ', () => job('S9 เพิ่มสำเร็จ', 'V5', () => logs(LOGS.slice(0, 1)))]]],
  ['S10 · กบค. แก้ไข การติดตามผลการดำเนินการ overhaul', [   // บล็อก K ฉบับเจ้าของงาน 22 ต.ค. 2569 — 1 แถว (ไอคอนแก้ไขอย่างเดียว) · K.3 ไม่มี toast (เจ้าของงานเคาะ 22 ต.ค. ทำทีหลัง)
    ['แก้ไขรายละเอียดการติดตาม', () => job('S10 แก้ไข', 'V5', () => logs(LOGS.slice(0, 1)))],
    ['แก้ไขรายละเอียดการติดตาม or หมายเหตุ', async () => { const s = await job('S10 ฟอร์มแก้ไข', 'V5', () => logs(LOGS.slice(0, 1))); await formModal(s, { title: 'แก้ไขรายละเอียดการติดตาม', fields: LOG_FIELDS(LOG_EDITED) }); return s; }],
    ['Update การแก้ไข', () => job('S10 อัปเดตแล้ว', 'V5', () => logs([LOG_EDITED]))]]],
  ['S11 · กบค. ลบ การติดตามผลการดำเนินการ overhaul', [   // บล็อก L ฉบับเจ้าของงาน 22 ต.ค. 2569 — ลบได้เมื่อมี 2 รายการขึ้นไป · ข้อความยืนยันชุดเดียวกับลบแผน (บล็อก D)
    ['ลบรายละเอียดการติดตาม ลบได้เมื่อมี 2 รายการขึ้นไป', () => job('S11 ลบได้', 'V5', () => logs(LOGS))],
    ['ยืนยันการลบรายละเอียดการติดตาม', async () => { const s = await job('S11 ยืนยันลบ', 'V5', () => logs(LOGS)); await confirm(s, { danger: true, title: 'ยืนยันการลบ', sub: 'เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่' }); return s; }],
    ['ลบสำเร็จ เหลือ 1 รายการจะลบไม่ได้', async () => { const s = await job('S11 ลบสำเร็จ', 'V5', () => logs(LOGS.slice(0, 1))); await toast(s, L_TOAST_OK); return s; }]]],
  ['S12 · กบค. upload เอกสารด้านความปลอดภัย', [
    ['Default ยังไม่มีเอกสาร', () => job('S12 ว่าง', 'V6', () => safety([]))],   // บล็อก M ฉบับเจ้าของงาน 22 ต.ค. 2569 — ไม่มี toast ในเฟรม (toast 21/22 อยู่หน้า toast แยก)
    ['Filled อัปโหลดเอกสารแล้ว', () => job('S12 อัปโหลดแล้ว', 'V6', () => safety(SAFETY_FILES))]]],
  // บล็อก N O ฉบับเจ้าของงาน 29 ต.ค. 2569 (R23 · component-rules §4.2.10–4.2.11 · ข้อความดิบ figma-ref/overhaul-MNO-2569-10-29.txt)
  // N: ป้ายช่องในเฟรมเป็น "ช่วงวันนำรถเข้า" (ก๊อปจาก H) ⇒ เจ้าของงานเคาะใช้ "ช่วงวันนัดรับรถ" · N.4 "ส่งนัดหมาย" = หัวแถวย่อย N.4.1–N.4.4 ไม่ใช่จอ · N.5 = กลับมาหน้านี้ระหว่างรอตอบกลับ (Type=Wating + ปุ่มแก้ไขนัดหมาย)
  ['S13 · กบค. นัดหมายหน่วยงานส่งคืนรถ', [
    ['ฟอร์มนัด Default', () => job('S13 ฟอร์มนัด Default', 'V7', () => apptForm(true)), '1'],
    ['Validation กรณีไม่ได้เลือก, Out of focus', () => job('S13 Validation', 'V7', () => apptForm(true, { errors: true })), '2'],
    ['Filled', () => job('S13 Filled', 'V7', () => apptForm(true, { d1: '08/11/2569', d2: '09/11/2569', coord: 1 })), '3'],
    ['สร้างนัดไม่สำเร็จ (toast 14)', async () => { const s = await job('S13 ไม่สำเร็จ', 'V7', () => apptForm(true, { d1: '08/11/2569', d2: '09/11/2569', coord: 1 })); await T(s, 14); return s; }, '4.1'],
    ['รอหน่วยงานตอบรับ (toast 13)', async () => { const s = await job('S13 รอตอบรับ', 'V8', () => apptWait(true, '08/11/2569', '09/11/2569')); await T(s, 13); return s; }, '4.2'],
    ['แก้ไขนัดหมาย', () => job('S13 แก้ไขนัด', 'V9', () => apptForm(true, { d1: '15/11/2569', d2: '16/11/2569', coord: 1 })), '4.3'],
    ['หน่วยงานปฏิเสธ', () => job('S13 ปฏิเสธ', 'V9', () => apptRejected(true, '08/11/2569', '09/11/2569')), '4.4'],
    ['ย้อนกลับมาจากหน้าอื่นหลังนัดหมายแล้ว', () => job('S13 กลับมาหลังนัด', 'V8', () => apptWait(true, '08/11/2569', '09/11/2569')), '5']]],
  // O: เฟรมเหลือ 3 state ⇒ เจ้าของงานเคาะ คงส่วน "การรับประกันของผู้รับจ้าง" (R28) ไว้ใน O.2 O.3 · ตัด state ไฟล์ผิดรูปแบบ · ยังไม่ระบุประกัน · บันทึกไม่สำเร็จ
  // 30 ต.ค. 2569: ส่วนรับประกันเป็น Toggle + dropdown ระยะรับประกัน ⇒ เพิ่ม O.2.1 เปิดรายการระยะ · O.2.2 ปิดสวิตช์ (ไม่มีการรับประกัน) · รหัส O.1 O.2 O.3 คงเดิม
  ['S14 · กบค. ปิดงาน', [
    ['ยังไม่ได้ระบุอะไหล่', () => job('S14 ว่าง', 'V10', () => closeJob([])), '1'],
    ['ระบุอะไหล่แล้ว', () => job('S14 ระบุอะไหล่แล้ว', 'V10', () => closeJob(PARTS)), '2'],
    ['เลือกระยะรับประกัน', async () => { const s = await job('S14 เลือกระยะรับประกัน', 'V10', () => closeJob(PARTS, false, { warranty: { on: true, start: CLOSE_DATE }, daysOpen: 1 }));
      comboAt(s, warrantyAnchor(s), WARRANTY_DAYS); return s; }, '2.1'],
    ['ไม่มีการรับประกัน (ปิดสวิตช์)', () => job('S14 ไม่มีการรับประกัน', 'V10', () => closeJob(PARTS, false, { warranty: { on: false } })), '2.2'],
    ['ปิดงานแล้ว', async () => { const s = await job('S14 ปิดงานแล้ว', 'V11', () => closeJob(PARTS, true)); await toast(s, O_TOAST_OK); return s; }, '3']]],
  // S15 บล็อก P (เจ้าของงาน 30 ต.ค. 2569 "แจ้งเตือนไปยังเจ้าของรถ และกบค เมื่อใกล้ครบกำหนด จะเตือนประกันเหลือ 30 วัน และ 15 วัน"): กระดิ่งในระบบ แจ้งเตือนอย่างเดียว ไม่มีปุ่ม
  //   กดรายการ → หน้ารถ แท็บหลัง Overhaul (ทั้งสองฝั่ง) · 30 วัน = Warning · 15 วัน = Error · ไม่มี toast
  ['S15 · ระบบแจ้งเตือนประกันงานซ่อมใกล้หมด ถึงเจ้าของรถ และ กบค.', [
    ['กบค. — เหลือ 30 วัน', async () => { const s = await listScreen('S15 กบค. 30 วัน', CF_LIST); bell(s, true); await notiPanel(s, WARN_NOTI.kbk30, '1 แจ้งเตือนใหม่'); return s; }],
    ['กบค. — เหลือ 15 วัน', async () => { const s = await listScreen('S15 กบค. 15 วัน', CF_LIST); bell(s, true); await notiPanel(s, WARN_NOTI.kbk15, '1 แจ้งเตือนใหม่'); return s; }],
    ['เจ้าของรถ — เหลือ 30 วัน', async () => { const s = await vehicleHistory('S15 เจ้าของรถ 30 วัน'); bell(s, true); await notiPanel(s, WARN_NOTI.own30, '1 แจ้งเตือนใหม่'); return s; }],
    ['เจ้าของรถ — เหลือ 15 วัน', async () => { const s = await vehicleHistory('S15 เจ้าของรถ 15 วัน'); bell(s, true); await notiPanel(s, WARN_NOTI.own15, '1 แจ้งเตือนใหม่'); return s; }],
    // 30 ต.ค. 2569 เจ้าของงาน "แจ้งเตือนประกันใกล้หมด พาไปได้" ⇒ ปลายทาง = หน้าสรุปรายคัน (S18) แทนแท็บหลัง Overhaul · ชื่อเดิมอยู่ใน STATE_ALIAS
    ['กดแจ้งเตือน ไปหน้าสรุปรายคัน', async () => { const s = await jobSummary('S15 ปลายทาง', { warranty: Object.assign({}, WARRANTY, { left: 15, sent: 'รอบ 30 วัน 05/10/2570 · รอบ 15 วัน 20/10/2570' }) }); bell(s, false); return s; }]]],
  // S16 บล็อก Q (30 ต.ค. 2569 · เจ้าของงานเคาะ "ตามที่แนะนำ"): ฝั่งหน่วยงานเจ้าของรถ ตามหน้าตอบรับนัดหมายของงานซ่อม · Q.1.x ตอบรับ · Q.2.x ปฏิเสธ (นัดเข้าอู่ ครบเส้น)
  //   Q.3.x Q.4.x นัดรับรถคืน (ช่องเดียวกัน ต่างแค่ชื่อช่อง ⇒ เฉพาะ Filled + สำเร็จ) · notification = R
  ['S16 · หน่วยงานเจ้าของรถ ตอบกลับนัดหมาย ตอบรับ และ ปฏิเสธ', [
    ['นัดนำรถเข้าอู่ — รอตอบกลับ', () => reply('S16 นัดเข้าอู่ รอตอบกลับ', 'in'), '1'],
    ['ตอบรับ — เลือกวันจากช่วงที่เสนอ', () => replyDate('S16 ตอบรับ เลือกวัน', 'in', { pick: 0 }, 'Single'), '1.1'],
    ['ตอบรับ — Validation ไม่เลือกวัน', () => reply('S16 ตอบรับ Validation', 'in', { pick: 0, errors: true }), '1.2'],
    ['ตอบรับ — ค้นหาผู้นำส่งรถ', () => replyCombo('S16 ตอบรับ ค้นหาผู้นำส่งรถ'), '1.3'],
    ['ตอบรับ — Filled', () => reply('S16 ตอบรับ Filled', 'in', { pick: 0, date: true, who: true }), '1.4'],
    ['ตอบรับ — ยืนยันการตอบกลับ', () => replyModal('S16 ตอบรับ ยืนยัน', 'in', { pick: 0, date: true, who: true }), '1.5'],
    ['ตอบรับสำเร็จ', () => replyDone('S16 ตอบรับสำเร็จ', 'in', true), '1.6'],
    ['ปฏิเสธ — Validation ไม่ระบุเหตุผล', () => reply('S16 ปฏิเสธ Validation', 'in', { pick: 1, errors: true }), '2.1'],
    ['ปฏิเสธ — เลือกช่วงวันที่สะดวก', () => replyDate('S16 ปฏิเสธ เลือกช่วงวัน', 'in', { pick: 1, reason: S16_APPT.in.reason }, 'Dual'), '2.2'],
    ['ปฏิเสธ — Filled', () => reply('S16 ปฏิเสธ Filled', 'in', { pick: 1, want: true, reason: S16_APPT.in.reason }), '2.3'],
    ['ปฏิเสธ — ยืนยันการตอบกลับ', () => replyModal('S16 ปฏิเสธ ยืนยัน', 'in', { pick: 1, want: true, reason: S16_APPT.in.reason }), '2.4'],
    ['ปฏิเสธสำเร็จ', () => replyDone('S16 ปฏิเสธสำเร็จ', 'in', false), '2.5'],
    ['นัดรับรถคืน — รอตอบกลับ', () => reply('S16 นัดรับรถ รอตอบกลับ', 'out'), '3'],
    ['นัดรับรถ ตอบรับ — Filled', () => reply('S16 นัดรับรถ ตอบรับ Filled', 'out', { pick: 0, date: true, who: true }), '3.1'],
    ['นัดรับรถ ตอบรับสำเร็จ', () => replyDone('S16 นัดรับรถ ตอบรับสำเร็จ', 'out', true), '3.2'],
    ['นัดรับรถ ปฏิเสธ — Filled', () => reply('S16 นัดรับรถ ปฏิเสธ Filled', 'out', { pick: 1, want: true, reason: S16_APPT.out.reason }), '4.1'],
    ['นัดรับรถ ปฏิเสธสำเร็จ', () => replyDone('S16 นัดรับรถ ปฏิเสธสำเร็จ', 'out', false), '4.2']]],
  // S17 บล็อก R (30 ต.ค. 2569 · R30): จอดูอย่างเดียวของหน่วยงานเจ้าของรถ / กรย. — ตัวช่วยเดิมทุกตัวในโหมด VIEW (ปุ่มแก้ไข/ลบ/สร้าง ซ่อน) · notification = S
  ['S17 · หน่วยงานเจ้าของรถ และ กรย. ดูข้อมูลอย่างเดียว', [
    ['รายการแผน — เฉพาะแผนที่มีรถของหน่วยงาน', asView(() => listScreen('S17 รายการแผน', Object.assign({}, CF_LIST, { rows: PLANS_CF.filter(p => p[10] !== 'P1').slice(0, 3), pageOpt: { per: 10, total: 3 } }))), '1'],
    ['รายละเอียดแผน', asView(() => planDetail('S17 รายละเอียดแผน', { pos: [POS[0]] })), '2'],
    ['รายละเอียด PO — เฉพาะรถของหน่วยงาน', asView(() => poDetail('S17 รายละเอียด PO', { cars: [OWN_CAR] })), '3'],
    ['หน้างาน ขั้น 1 — ยังไม่มีนัดหมาย', asView(() => job('S17 ขั้น 1 ยังไม่มีนัด', 'V1', viewNoAppt)), '4'],
    ['หน้างาน ขั้น 2 ตรวจรับรถ (ดูย้อนหลัง)', asView(() => job('S17 ขั้น 2 ตรวจรับรถ', 'V5', () => checkin({ list: 'Filled', sign: 'Signed' }), 2)), '5'],
    ['หน้างาน ขั้น 3 ติดตามงานซ่อม', asView(() => job('S17 ขั้น 3 ติดตามงานซ่อม', 'V5', () => logs(LOGS))), '6'],
    ['หน้างาน ขั้น 4 ตรวจสภาพ (ดูย้อนหลัง)', asView(() => job('S17 ขั้น 4 ตรวจสภาพ', 'V7', () => safety(SAFETY_DONE), 4)), '7'],
    ['หน้างาน ขั้น 6 ปิดงานแล้ว', asView(() => job('S17 ปิดงานแล้ว', 'V11', () => closeJob(PARTS, true))), '8']]],
  // S18 บล็อก S (30 ต.ค. 2569 · R31): หน้าสรุปรายคัน — กบค. และหน่วยงาน (ดูอย่างเดียว) · notification = T
  ['S18 · หน้าสรุปรายคัน งาน Overhaul ที่ปิดงานแล้ว', [
    ['หน้างานปิดงานแล้ว — ปุ่ม ดูสรุปรายคัน', () => job('S18 ทางเข้า', 'V11', () => closeJob(PARTS, true), null, { actions: [['Secondary button', 'ดูสรุปรายคัน', 'quick_reference_all-24-300-round']] }), '1'],
    ['เข้าจากรายละเอียด PO — ไอคอน ดูสรุปรายคัน', () => poDetail('S18 เข้าจาก PO', { cars: [CARS[0], CLOSED_CAR] }), '1.1'],
    ['เข้าจาก Dashboard แท็บรถหลัง Overhaul — ไอคอน ดูสรุปรายคัน', () => carsTab('S18 เข้าจาก Dashboard'), '1.2'],
    ['สรุปรายคัน — อยู่ในประกัน', () => jobSummary('S18 สรุป อยู่ในประกัน'), '2'],
    ['สรุปรายคัน — ประกันใกล้หมด เหลือ 15 วัน', () => jobSummary('S18 สรุป ใกล้หมด', { warranty: Object.assign({}, WARRANTY, { left: 15, sent: 'รอบ 30 วัน 05/10/2570 · รอบ 15 วัน 20/10/2570' }) }), '3'],
    ['สรุปรายคัน — ไม่มีการรับประกัน', () => jobSummary('S18 สรุป ไม่มีประกัน', { warranty: { on: false } }), '4'],
    ['สรุปรายคัน — หน่วยงานเจ้าของรถ (ดูอย่างเดียว)', asView(() => jobSummary('S18 สรุป หน่วยงาน')), '5'],
    ['กดส่งออก PDF — ฟอร์มส่งออก', async () => { const sc = await jobSummary('S18 ฟอร์มส่งออก PDF'); await exportModal(sc, true); return sc; }, '6'],
    ['ฟอร์มส่งออก — เปลี่ยนเป็น Excel เลือกบางหัวข้อ', async () => { const sc = await jobSummary('S18 ฟอร์มส่งออก Excel'); await exportModal(sc, false, [3]); return sc; }, '7'],
    ['ส่งออกสำเร็จ', async () => { const sc = await jobSummary('S18 ส่งออกสำเร็จ'); await toast(sc, { title: 'ส่งออกไฟล์สำเร็จ', sub: EXPORT_FILE(true) }); return sc; }, '8'],
    ['ไฟล์ PDF หน้า 1', () => pdfPage('S18 ไฟล์ PDF หน้า 1', 1), '9'],
    ['ไฟล์ PDF หน้า 2', () => pdfPage('S18 ไฟล์ PDF หน้า 2', 2), '10'],
    ['ไฟล์ Excel ชีต สรุป', () => xlsSheet('S18 ไฟล์ Excel สรุป', 0), '11'],
    ['ไฟล์ Excel ชีต อะไหล่', () => xlsSheet('S18 ไฟล์ Excel อะไหล่', 3), '12']]],
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
function insideInstance(n, stop) { for (let p = n.parent; p && p !== stop; p = p.parent) if (p.type === 'INSTANCE') return true; return false; }
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
  // R5: Section label / Section header ที่ซ้อนใน component ของทีมออกแบบ (Modal Signature ฯลฯ · 22 ต.ค. 2569) อาจเปิด Info icon / More actions — ปิดให้ทุกตัว (แบบเดียวกับ plugin-lib/core.js)
  for (const n of root.findAll(n => n.type === 'INSTANCE' && (n.name === 'Section label' || n.name === 'Section header'))) {
    const cp = n.componentProperties || {}, fix = {};
    for (const k of ['Info icon', 'More actions']) { const key = Object.keys(cp).find(x => x.split('#')[0] === k); if (key && cp[key].value !== false) fix[k] = false; }
    if (Object.keys(fix).length) { setProps(n, fix); info++; }
  }
  // กล่องแสดงข้อมูล: แต่งเฉพาะกรอบที่ปลั๊กอินสร้าง — กรอบ Content item ข้างใน component ของทีมออกแบบ (Modal Signature) แต่งไว้แล้ว ไม่แตะ
  for (const b of root.findAll(n => n.type === 'FRAME' && n.name === 'Content item' && n.children.some(c => c.name === 'Content item row') && !insideInstance(n, root))) { await displayBox(b); disp++; }
  return { info, disp };
}

function reportOversize() {
  if (STEP_SHORT.length) { log('· Progress steps ของไลบรารีมี ' + STEP_SHORT[0] + ' ช่อง แต่หน้างานมี ' + STEPS.length + ' ขั้น ⇒ ' + STEP_SHORT.length + ' จอยังวาง Horizontal step item ทีละขั้น — เพิ่มช่องใน component แล้วสร้างชุดใหม่ จะสลับให้เอง'); STEP_SHORT.length = 0; }
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
async function tableInfo() {   // ปุ่ม "เช็ค component": โครง Table ของไลบรารี ณ ตอนนี้ (R25)
  const b = await probeTable();
  if (!b) { log('· อ่าน component Table (key ' + KEYS.Table[0].slice(0, 8) + '…) จากไลบรารีไม่ได้'); return; }
  log('· component Table (key ' + KEYS.Table[0].slice(0, 8) + '…): ใช้ variant "' + b.name + '" กว้าง ' + b.w + ' · คอลัมน์ ' + b.cols + ' · แถว ' + b.rows + ' · variant ทั้งหมด: ' + b.all.join(' · ')
    + (b.cols >= PLAN_COLS_D.length ? ' ⇒ หน้ารายการแผนตามจอเจ้าของงาน ' + PLAN_COLS_D.length + ' คอลัมน์' : ' ⇒ Table มีแค่ ' + b.cols + ' คอลัมน์ หน้ารายการแผนใช้แบบสำรอง 8 คอลัมน์ — ถ้าไลบรารีที่ publish ใหม่เป็น component คนละ key ให้เลือก instance แล้วกด "อ่านจอที่เลือก" ส่ง key มา'));
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
/* รหัส state: ปกติ = ตัวอักษร.ลำดับ (A.1 A.2) · state ที่ประกาศรหัสเอง (ช่องที่ 3 ของรายการจอ เช่น '1.1') = ตัวอักษร.รหัสนั้น (D.1.1 D.1.2 ตามจอเจ้าของงาน 22 ต.ค. 2569) */
const stateCode = (sub, i) => sub.code + '.' + ((sub.screens[i] && sub.screens[i][2]) || (i + 1));
async function buildGrid(page, prefix, GROUPS, y0, total, opts) {
  opts = opts || {};   // opts.devices · opts.rowMin
  const made = []; let y = y0; const x0 = GRID.side + GRID.gap; const pitch = GRID.colW + GRID.colGap;
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
      for (const [i, [label]] of sub.screens.entries()) put(await flowBar(prefix, stateCode(sub, i), label, 'Sub Flow 2', GRID.colW), x0 + i * pitch, y);
      y += GRID.barH + GRID.gap;
      for (const mob of (opts.devices || [false, true])) {   // devices: [false]=desktop อย่างเดียว · [true]=mobile อย่างเดียว · ไม่ส่ง=ทั้งคู่ (แถว mobile ใต้ desktop)
        MOB = mob; let h = 0; const rowY = y;
        for (const [i, [label, fn]] of sub.screens.entries()) {
          const x = x0 + i * pitch;
          CREATED = []; PLACE = { x, y: rowY };   // เฟรมจอไปอยู่ตำแหน่งจริงทันทีที่สร้าง · ชิ้นที่สร้างระหว่างทางถูกติดตามไว้
          try {
            const name = prefix + ' / ' + stateCode(sub, i) + ' · ' + sub.tag + ' — ' + label + (mob ? ' · mobile' : '');
            const s = await fn(); stripDividers(s); await polish(s);
            s.name = name;
            put(s, x, rowY); h = Math.max(h, s.height); made.push(s);
            log('  · ' + made.length + '/' + total + ' ' + s.name);
          } catch (e) {
            warn(stateCode(sub, i) + ' ' + label + (mob ? ' (mobile)' : ''), e);
            const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้างจากจอที่พัง ' + k + ' ชิ้น');
          }
          CREATED = []; PLACE = null;
        }
        MOB = false;
        const rowH = Math.max(h, opts.rowMin != null ? opts.rowMin : (mob ? GRID.mobH : GRID.deskH));   // rowMin = ชุดที่เฟรมเล็กกว่าจอ (หน้า toast แยก) ไม่ต้องเว้นสูงเท่าจอ
        CREATED = []; put(await deviceLabel(prefix, mob ? 'Mobile' : 'Desktop', rowH), 0, rowY);
        y = rowY + rowH + GRID.rowGap;
      }
      y += GRID.groupGap - GRID.rowGap;
      log('✓ ' + sub.code + ' ' + sub.title + ' (' + n + ' state)');
    }
  }
  CREATED = [];
  return { made, y };
}
/* ---------- กลุ่ม = scenario (เจ้าของงานเคาะ 20 ต.ค. 2569: "อยากแยก scenario ออกจากกัน และแยก mobile กับ desktop")
   ตัวอักษร = scenario (A รายการแผน · B S1 … O S14) · ป้าย state = A.1 A.2 … · แต่ละบล็อกมีแถว Desktop แล้วแถว Mobile ใต้คอลัมน์เดียวกัน · ไม่มีแถบย่อย ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GROUPS = SCENARIOS.map(([title, screens], i) => {
  const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  return { code, title: rest ? tag + ' ' + rest : title, subs: [{ code, title: rest || title, tag, screens }] };
});

/* ---------- บล็อก notification (สเปก 16 ข้อ 2 · 20 ต.ค. 2569) — ชุดแยก สร้างบนหน้า overhaul-noti-N · 21 ต.ค. ตัดบล็อก toast ออก (toast มีหน้าแยกของตัวเองแล้ว) เหลือบล็อกเดียว รหัส P ---------- */
const NOTI_SCENARIOS = [
  ['notification · ข่าวถึงอีกฝ่าย (กระดิ่ง Nav button Indicator + Notification card)', [
    ['ไม่มีแจ้งเตือนใหม่', async () => { const s = await listScreen('noti ไม่มีใหม่', CF_LIST); bell(s, false); return s; }],
    ['มีแจ้งเตือนใหม่ (จุดแดงที่กระดิ่ง)', async () => { const s = await listScreen('noti มีใหม่', CF_LIST); bell(s, true); return s; }],
    ['เปิดแผงแจ้งเตือน (ฝั่ง กบค.)', async () => { const s = await listScreen('noti แผงเปิด', CF_LIST); bell(s, true); await notiPanel(s, NOTI_ITEMS, '3 แจ้งเตือนใหม่'); return s; }],
    ['กดรายการ ไปหน้างานที่เกี่ยว', async () => { const s = await job('noti ปลายทาง', 'V3', () => apptRejected(false, '22/10/2569', '24/10/2569')); bell(s, false); return s; }]]],
];
const NOTI_GROUPS = NOTI_SCENARIOS.map(([title, screens], i) => {
  const code = LETTERS[SCENARIOS.length + i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');   // ถัดบล็อกสุดท้ายของหน้าหลัก (30 ต.ค. 2569 เพิ่ม P S15 ⇒ notification = Q)
  return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens }] };
});

/* ---------- หน้า 1 รายการแผน ฉบับหลัง CF จาก PO (Google Sheet แท็บ "1 รายการแผน" · อ่าน 20 ต.ค. 2569) — สร้างคู่กับฉบับที่ออกแบบไว้บนหน้า overhaul-cf-N ให้เห็นความต่าง
   mapping รายฟิลด์: Diagram/01-บำรุงรักษาตามวาระ/17-overhaul-cf-หน้า1-mapping.md ---------- */
const STATUS_CF = STATUS;   // ชื่อสถานะหลัง CF = ชุดหลักแล้ว (21 ต.ค. 2569)
const SEARCH_CF = 'ค้นหาเลขแผน, ชื่อแผน, เลขศูนย์ต้นทุน';   // ตามจอเจ้าของงาน 21 ต.ค. ค่ำ (R23) — ชีต CF เคยให้ "เลขที่งบประมาณ, ทะเบียนรถ" (patchTexts แปลงกลับ)
/* [เลขแผน, ชื่อแผน, หน่วยงาน, ประเภทงบ, เลขที่งบประมาณ (SubText), ปีงบ, งบ, จำนวนรถ, ปิดงานแล้ว, รถรอติดตาม, สถานะ, วันที่สร้าง, ผู้แก้ไขล่าสุด, แก้ไขเมื่อ] — ข้อมูลจำลอง
   หน่วยงาน = คอลัมน์ที่ PO ขอเพิ่ม 21 ต.ค. 2569 ("สังกัดที่รับผิดชอบแผน ไม่แน่ใจว่ามีไหม") — ตามตารางสิทธิ์ คนสร้างแผนมีแต่ กบค. ⇒ ค่าเป็น กบค. ทุกแถว (แจ้ง PO แล้วว่าอาจซ้ำซ้อน) */
const PLANS_CF = [   // 10 แถวตามเฟรมหน้ารายการแผนที่เจ้าของงานส่ง 21 ต.ค. 2569 ค่ำ (R23) — เลขแผนในจอเป็น placeholder Z69000X ใช้เลขรันแทน · [เลข, ชื่อ, หน่วยงาน, ประเภทงบ, รหัสงบ (บรรทัดรอง), ปีงบ, งบ, n รถ, ปิดงานแล้ว, รอติดตาม, สถานะ, วันที่สร้าง, ผู้แก้, แก้ไขล่าสุด]
  ['123460', 'Overhaul ประจำปีงบ 2570 — รถกระเช้า ภาคใต้', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0002', '2571', '20,000,000', '5', 0, '1', 'P2', '21 ต.ค. 2569', 'นายวิชัย ทองดี', '21 ต.ค. 2569 14:20'],
  ['123459', 'Overhaul รถกระเช้า ภาคเหนือ', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0003', '2571', '15,000,000', '0', 0, '0', 'P1', '20 ต.ค. 2569', 'นางสาวกนกวรรณ ใจมั่น', '20 ต.ค. 2569 09:05'],
  ['123458', 'Overhaul รถกระเช้า ภาคกลาง', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0004', '2571', '12,500,000', '0', 0, '0', 'P1', '19 ต.ค. 2569', 'นายวิชัย ทองดี', '19 ต.ค. 2569 16:40'],
  ['123457', 'Overhaul รถกระเช้า ภาคอีสาน', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0005', '2571', '18,000,000', '10', 5, '2', 'P2', '18 ต.ค. 2569', 'นายวิชัย ทองดี', '18 ต.ค. 2569 11:12'],
  ['123456', 'จัดซื้อรถกระเช้า ภาคใต้', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0006', '2571', '25,000,000', '15', 7, '3', 'P2', '17 ต.ค. 2569', 'นางสาวกนกวรรณ ใจมั่น', '20 ต.ค. 2569 08:30'],
  ['123455', 'ปรับปรุงรถบริการ ภาคเหนือ', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0007', '2570', '8,500,000', '5', 3, '1', 'P2', '16 ต.ค. 2569', 'นายวิชัย ทองดี', '16 ต.ค. 2569 10:00'],
  ['123454', 'Overhaul รถเครน ภาคกลาง', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0008', '2570', '16,000,000', '0', 0, '0', 'P1', '15 ต.ค. 2569', 'นายวิชัย ทองดี', '15 ต.ค. 2569 15:45'],
  ['123453', 'จัดซื้อเครื่องมือซ่อมบำรุง', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0009', '2570', '3,000,000', '0', 0, '0', 'P1', '14 ต.ค. 2569', 'นางสาวกนกวรรณ ใจมั่น', '14 ต.ค. 2569 13:10'],
  ['123452', 'ปรับปรุงรถกระเช้า ภาคใต้', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0010', '2570', '9,500,000', '0', 0, '0', 'P1', '13 ต.ค. 2569', 'นายวิชัย ทองดี', '13 ต.ค. 2569 09:50'],
  ['123451', 'Overhaul รถบริการ ภาคอีสาน', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0011', '2570', '11,000,000', '13', 8, '2', 'P2', '12 ต.ค. 2569', 'นายวิชัย ทองดี', '12 ต.ค. 2569 17:30'],
];
const PLAN_TOTAL = 95;   // "แสดง 1 ถึง 10 จาก 95 รายการ" ตามจอเจ้าของงาน
const NEW_PLAN_CF = ['123461', 'Overhaul ประจำปีงบ 2570 — รถเจาะหลุม', 'กบค.', 'งบลงทุน', 'I-70-Z-DPMXX.JM.0012', '2570', '5,500,000', '0', 0, '0', 'P1', '21 ต.ค. 2569', 'นายวิชัย ทองดี', '21 ต.ค. 2569 10:12'];
/* หน้ารายการแผน — desktop ยึดเฟรมที่เจ้าของงานส่ง 21 ต.ค. 2569 ค่ำ (R23 · ข้อความดิบ ~/PEA/Maintain-D/userflow/figma-ref/overhaul-A-list-2569-10-21.txt):
     "หน้า list คอลัมน์ และ component ให้ยึดตามที่วางให้" ⇒ 8 คอลัมน์ + ปุ่ม … : หมายเลขแผน · ชื่อแผน · ประเภทงบ (บรรทัดรอง = รหัสงบ) · ปีงบประมาณ · งบประมาณ (บาท) · ความคืบหน้า (x/n หรือ -) · สถานะ · วันที่สร้าง
     คอลัมน์ที่ชีต CF มีแต่จอไม่มี (หน่วยงาน · จำนวนรถ · รถรอติดตาม · แก้ไขล่าสุด) ไม่ใส่ จดรอเคาะ (ไฟล์ 18/19) — เจ้าของงานยืนยันซ้ำ 21 ต.ค. ค่ำ "ตัดหน่วยงานออก สิ่งที่ต้องมีคือชื่อแผน" · ต้องใช้ component Table ที่มี ≥ 9 คอลัมน์ (ไลบรารี publish แล้ว) ไม่พอ = PLAN_COLS_D8 (ปีงบ เป็นบรรทัดรองของงบ) · ฉบับสุดท้าย = บล็อก A ที่เจ้าของงานแก้แล้ว 21 ต.ค. ค่ำ "ให้ยึดเป็นหลักในการออกแบบครั้งต่อไป" (4 state: รายการแผน · ตัวกรอง · ค้นไม่เจอ · ยังไม่มีแผน)
   mobile ยังใช้ชุด 13 ช่องตาม CF เป็นการ์ด (ยังไม่ทำ mobile — เมื่อสั่งทำ ให้อ้างอิง desktop) */
const PLAN_COLS_D = [['หมายเลขแผน', 130, 'Lead text', 'Down'], ['ชื่อแผน', 0, 'Text', 'Swap'], ['ประเภทงบ', 190, 'Text', 'Swap'], ['ปีงบประมาณ', 110], ['งบประมาณ (บาท)', 150], ['ความคืบหน้า', 120], ['สถานะ', 124, 'Badge', 'Swap'], ['วันที่สร้าง', 120], ['', 72]];
const planProgress = (p) => { const n = +p[7], d = +p[8]; return n ? d + '/' + n : '-'; };   // เจ้าของงาน 21 ต.ค. ค่ำ: "ความคืบหน้าตัด Progress bar ออก" ⇒ ข้อความ x/n · ไม่มี PO แสดง "-" ไม่มีบรรทัดรอง
const planProgressBar = (p) => { const n = +p[7], d = +p[8]; return n ? { progress: Math.round(d / n * 100), text: d + '/' + n } : '-'; };   // mobile ยังใช้แถบแบบเดิม (ยังไม่ทำ mobile)
const planRowD = (p) => [p[0], p[1], { text: p[3], sub: p[4] }, p[5], p[6], planProgress(p), { pill: STATUS[p[10]] }, p[11], { menu: 1 }];
const PLAN_COLS_D8 = [['หมายเลขแผน', 130, 'Lead text', 'Down'], ['ชื่อแผน', 0, 'Text', 'Swap'], ['ประเภทงบ', 190, 'Text', 'Swap'], ['งบประมาณ (บาท)', 160], ['ความคืบหน้า', 130], ['สถานะ', 124, 'Badge', 'Swap'], ['วันที่สร้าง', 120], ['', 72]];   // สำรองเมื่อไลบรารี Table มีแค่ 8 คอลัมน์: ปีงบประมาณเป็นบรรทัดรองของงบประมาณ (ชื่อแผนคงเป็นคอลัมน์ตามที่เจ้าของงานสั่ง)
const planRowD8 = (p) => [p[0], p[1], { text: p[3], sub: p[4] }, { text: p[6], sub: 'ปีงบประมาณ ' + p[5] }, planProgress(p), { pill: STATUS[p[10]] }, p[11], { menu: 1 }];
const PLAN_COLS_M = [['เลขแผน', 92, 'Lead text', 'Down'], ['ชื่อแผน', 190, 'Text', 'Swap'], ['หน่วยงาน', 90], ['ประเภทงบ', 170, 'Text', 'Swap'], ['ปีงบประมาณ', 96], ['งบประมาณ (บาท)', 116], ['จำนวนรถ', 84],
  ['ความคืบหน้า (ปิดงานแล้ว)', 160], ['รถรอติดตาม', 96], ['สถานะ', 118, 'Badge', 'Swap'], ['วันที่สร้าง', 104], ['แก้ไขล่าสุด', 160], ['', 72]];
const planRowM = (p) => [p[0], p[1], p[2], { text: p[3], sub: p[4] }, p[5], p[6], p[7], planProgressBar(p), p[9], { pill: STATUS[p[10]] }, p[11], { text: p[12], sub: p[13] }, { menu: 1 }];
const planSet = () => MOB ? 'M' : LIB_TABLE.cols >= PLAN_COLS_D.length ? 'D' : 'D8';   // mobile = การ์ด 13 ช่อง · desktop = จอเจ้าของงาน 9 คอลัมน์ · ไลบรารีเก่า 8 = สำรอง
const PLAN_COLS_CF = () => ({ M: PLAN_COLS_M, D: PLAN_COLS_D, D8: PLAN_COLS_D8 })[planSet()];   // tbl() รับฟังก์ชัน — เลือกชุดตอนสร้างจอ
const planRowCF = (p) => ({ M: planRowM, D: planRowD, D8: planRowD8 })[planSet()](p);
const CF_LIST = { rows: PLANS_CF.slice(0, 10), cols: PLAN_COLS_CF, rowFn: planRowCF, placeholder: SEARCH_CF, pageOpt: { per: 10, total: PLAN_TOTAL } };   // 10 แถว · "แสดง 1 ถึง 10 จาก 95 รายการ" ตามจอเจ้าของงาน
const CF_COMBO = [['WBS: I-69-Z-DPMXX.JM.0003', 'แผน 123456 Overhaul ประจำปีงบ 2569 — รถเครน'], ['WBS: I-69-Z-DPMXX.JM.0102', 'แผน 123457 Overhaul ประจำปีงบ 2569 — รถกระเช้า'], ['ศูนย์ต้นทุน: C-69-OH-0103', 'แผน 123458 Overhaul ประจำปีงบ 2569 — รถเจาะหลุม']];
const PLAN_COLS = PLAN_COLS_CF, planRow = planRowCF;   // ชุดหลักใช้ฉบับ CF (listScreen ใช้เป็นค่าเริ่มต้น)
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
  /* จอ A.2 ที่เจ้าของงานแก้แล้ว (21 ต.ค. ค่ำ "ยึดเป็นหลัก"): dropdown 3 ช่อง ป้าย (ถ้ามี) ปีงบประมาณ · งบประมาณ (บาท) (รายการช่วงวงเงิน 6 ช่วงเปิดอยู่) · สถานะ · ไม่มีตัวกรองประเภทยานพาหนะ · ปุ่ม ล้างตัวกรอง · ยกเลิก · ตกลง
     ตัวเลขช่วงวงเงินในจอพิมพ์ผิด (1,000,0000 · 5,000,0001) ใช้ค่าที่แก้แล้ว · รายการสถานะในจอยังมีชื่อเก่า (ยังไม่มี PO · ดำเนินการ) ใช้ชื่อที่ยืนยัน 3 ค่า — จดรอเคาะไฟล์ 18 */
  const budget = dropdown('งบประมาณ (บาท)', '', { placeholder: 'เลือกช่วงวงเงิน', optional: true, state: 'Focused' });
  const content = [dropdown('ปีงบประมาณ', 'ทั้งหมด', { optional: true }), budget, dropdown('สถานะ', '', { placeholder: 'เลือกสถานะ', optional: true })];
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
  comboAt(scr, find(budget, 'Container') || budget, BUDGET_RANGES.map(r => [r, '']));   // รายการช่วงวงเงินเปิดอยู่ตามจอ A.2
}
const BUDGET_RANGES = ['น้อยกว่า 1,000,000', '1,000,000 - 5,000,000', '5,000,001 - 10,000,000', '10,000,001 - 15,000,000', '15,000,001 - 20,000,000', '20,000,001 ขึ้นไป'];
/* ---------- หน้า toast แยก (เจ้าของงานสั่ง 21 ต.ค. 2569: "toast แยกออกเป็นอีกหน้า ไม่ต้องมีหน้า ui อย่างอื่นเข้ามา … พร้อมให้ export แบบแก้ไขได้")
   1 toast = 1 เฟรมโปร่ง (ไม่มีเปลือกหน้า) ชื่อ "TOAST / A.1 · 1 — T1 <ข้อความ>" · ข้างในคือ instance ของ Notification (แก้ข้อความ/สลับ Type ได้ในไฟล์ · Go to main component ไปไลบรารี)
   · ตั้ง Export settings ให้ทุกเฟรม (SVG = เอาไปแก้ต่อได้ · PNG 2x) ⇒ เลือกเฟรมแล้วกด Export ได้ทันที · บล็อกตามหน้า (A หน้า 1 … E หน้า 5) · แถว Desktop (Breakpoint=Desktop) แล้ว Mobile (Breakpoint=Mobile กว้าง 370)
   · toast ที่ชีตแท็บรายหน้าใช้ซ้ำข้ามหน้า (เช่น แก้ไขแผน ขึ้นทั้งหน้า 1 และ 2) สร้างซ้ำในบล็อกของหน้านั้นให้ครบตามชีต ---------- */
const TOAST_PAGES = { 1: '1 · รายการแผน / ฟอร์มแผน', 2: '2 · รายละเอียดแผน', 3: '3 · รายละเอียด PO', 4: '4 · เพิ่ม/แก้ไข PO', 5: '5 · หน้างานรายคัน' };
const TOAST_ALSO = { 2: [3, 4], 3: [8, 9], 4: [7, 8] };
async function toastOnly(n) {
  const t = TOASTS[n];
  const f = frame('toast', 'VERTICAL');   // เฟรมโปร่ง หุ้ม toast พอดี (ไม่มีพื้น ⇒ export ได้พื้นใส)
  if (PLACE) { f.x = PLACE.x; f.y = PLACE.y; }
  const box = inst('Notification', { Type: t.err ? 'Error' : 'Success', Breakpoint: BP() }, { Text: t.title, Actions: false, 'Supporting text': t.sub || '' });
  if (!t.sub) { const sup = find(box, 'Supporting text'); if (sup) sup.visible = false; }
  f.appendChild(box);
  if (MOB) { try { box.resize(VW() - 32, box.height); } catch (e) { warn('toast mobile กว้าง', e); } }
  try { f.exportSettings = [{ format: 'SVG' }, { format: 'PNG', constraint: { type: 'SCALE', value: 2 } }]; } catch (e) { warn('export settings ' + t.title, e); }
  return f;
}
const TOAST_SCENARIOS = [1, 2, 3, 4, 5].map(p => {
  const ids = Object.keys(TOASTS).map(Number).filter(n => TOASTS[n].page === p).concat(TOAST_ALSO[p] || []);
  return [TOAST_PAGES[p], ids.map(n => ['T' + n + ' ' + TOASTS[n].title + (TOASTS[n].err ? ' (ไม่สำเร็จ)' : '') + (TOASTS[n].noti ? ' + notification' : ''), () => toastOnly(n)])];
});
const TOAST_GROUPS = TOAST_SCENARIOS.map(([title, screens], i) => {
  const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  return { code, title: 'หน้า ' + tag + ' ' + rest, subs: [{ code, title: rest, tag, screens }] };
});
const devOf = (o) => (o && o.devices === 'mobile') ? [true] : (o && o.devices === 'desktop') ? [false] : [false, true];   // ตัวเลือกอุปกรณ์จากหน้าต่างปลั๊กอิน (21 ต.ค. 2569 เจ้าของงาน: ตอนนี้ยังไม่ทำ mobile — ค่าเริ่มต้น Desktop)
async function buildToast(o) { await buildSet('overhaul-toast', TOAST_SCENARIOS, TOAST_GROUPS, 'toast (เฉพาะ toast)', Object.assign({ prefix: 'TOAST', rowMin: 0 }, o, { devices: devOf(o) })); }

/* ---------- แก้บนหน้า Figma เดิม (เจ้าของงานถาม 21 ต.ค. 2569: "tab ที่เคย export ไว้ อยากให้เข้าปรับแก้ในนี้ได้หรือเปล่า เพราะมีบางส่วนที่มีการแก้ไขไปบ้างแล้ว" → เคาะ: แก้แค่บางจอ จอที่แก้ให้ตรง CF ทั้งจอ · จอใหม่ต่อท้ายแถวของ scenario นั้น)
   ปุ่ม "อัปเดตจอที่เลือกเป็นฉบับ CF": สร้างจอฉบับปัจจุบัน (SCENARIOS) แทนที่เฟรมที่เลือก ตำแหน่ง/ลำดับ layer เดิม · จอที่ไม่ได้เลือกไม่แตะ · state ที่ CF ตัด (เมนู "…") ไม่ลบ แค่ติดป้าย · state ใหม่ของ scenario ที่แตะ ต่อท้ายแถว desktop/mobile ของบล็อกนั้น
   ปุ่ม "แก้คำ/ไอคอนทุกจอบนหน้านี้": แตะเฉพาะ property ของ instance (ชื่อสถานะ · ถ้อยคำ toast · ช่องจัดการ "…" → ไอคอน · placeholder ค้นหา) ไม่สร้าง/ไม่ย้าย — สำหรับจอที่แก้มือไว้และอยากเก็บ
   ชื่อเฟรมที่รู้จัก: 19 ต.ค. "OH2 / S1 — label[ · mobile]" · หลังจัดวางใหม่ "OH2 / B.1 · S1 — label[ · mobile]" ---------- */
const SCEN_TAGS = SCENARIOS.map(([title]) => title.split(' · ')[0]);
const normLabel = (s) => String(s).replace(/\s*\([^()]*\)\s*$/, '').replace(/\s+/g, ' ').trim();   // ตัดวงเล็บท้าย เช่น "(toast 2)" "(เติมค่าเดิม)"
const STATE_ALIAS = { 'S15|กดแจ้งเตือน ไปหน้ารถ แท็บหลัง Overhaul': 'กดแจ้งเตือน ไปหน้าสรุปรายคัน',   // 30 ต.ค. 2569 ปลายทางแจ้งเตือนประกัน = หน้าสรุปรายคัน
  'S4|ฟอร์ม PO (ว่าง)': 'ฟอร์ม PO Default', 'S4|กดบันทึกโดยยังไม่ครบ': 'Validation กรณีไม่ได้เลือก, Out of focus',   // บล็อก E F G N O ฉบับเจ้าของงาน 29 ต.ค. 2569
  'S5|กดแก้ไขในเมนู … ของ PO → ฟอร์มแก้ไข PO': 'ฟอร์มแก้ไข PO', 'S5|กดไอคอนแก้ไขของ PO → ฟอร์มแก้ไข PO': 'ฟอร์มแก้ไข PO', 'S5|บันทึกสำเร็จ (toast 8)': 'บันทึกสำเร็จ',
  'S6|กดลบในเมนู … ของ PO → ยืนยันการลบ PO': 'ยืนยันการลบ PO', 'S6|กดไอคอนลบของ PO → ยืนยันการลบ PO': 'ยืนยันการลบ PO', 'S6|ลบสำเร็จ (toast 9)': 'ลบสำเร็จ',
  'S13|ฟอร์มนัดรับรถ (ค่าอู่ตั้งต้น)': 'ฟอร์มนัด Default', 'S13|หน่วยงานปฏิเสธ (toast 16)': 'หน่วยงานปฏิเสธ',
  'S14|นำเข้าไฟล์สำเร็จ (toast 23)': 'ระบุอะไหล่แล้ว', 'S14|ปิดงานแล้ว (toast 25)': 'ปิดงานแล้ว',
  'S12|ซ่อมสำเร็จแล้ว ยังไม่มีเอกสาร (toast 21)': 'Default ยังไม่มีเอกสาร', 'S12|อัปโหลดแล้ว': 'Filled อัปโหลดเอกสารแล้ว',   // บล็อก M ฉบับเจ้าของงาน 22 ต.ค. 2569
  'เฟส 1 — คอลัมน์ที่มีข้อมูลวันนี้': 'เฟส 1 — ประกันผู้รับจ้าง · ซ่อมชิ้นที่ Overhaul รายคัน', 'เป้าหมาย — + ประกัน · ใช้งานหลังรับรถ · ในประกัน (Alert บอกช่องที่ต้องเพิ่ม)': 'เป้าหมาย — + ใช้งานหลังรับรถ · ยืนยันชิ้นที่ Overhaul ด้วยรหัส (Alert บอกช่องที่ต้องเพิ่ม)',
  'เฟส 1 — พบคำตรงกันจากข้อความ': 'เฟส 1 — ชิ้นที่ Overhaul (จับชื่อ) · ประกันผู้รับจ้าง', 'เป้าหมาย — เกี่ยวกับ Overhaul? · ในประกัน': 'เป้าหมาย — เกี่ยวกับ Overhaul? (ยืนยัน) · ประกันผู้รับจ้าง',
  'เฟส 1 — ข้อมูลที่มี': 'แท็บหลัง Overhaul เฟส 1 — แทรกรายคัน ซ่อมชิ้นที่ Overhaul ในประกัน · ยังไม่ครบช่วงติดตาม', 'เป้าหมาย — ประกัน · ใช้งานหลังรับรถ · ความคุ้มค่า': 'แท็บหลัง Overhaul เป้าหมาย — + ใช้งานหลังรับรถ · ความคุ้มค่า',
  'เฟส 1 — แทรกรายคัน ซ่อมชิ้นที่ Overhaul ในประกัน · ยังไม่ครบช่วงติดตาม': 'แท็บหลัง Overhaul เฟส 1 — แทรกรายคัน ซ่อมชิ้นที่ Overhaul ในประกัน · ยังไม่ครบช่วงติดตาม', 'เป้าหมาย — + ใช้งานหลังรับรถ · ความคุ้มค่า': 'แท็บหลัง Overhaul เป้าหมาย — + ใช้งานหลังรับรถ · ความคุ้มค่า',   // dashboard ปรับตามไฟล์ 21 (22 ต.ค. 2569)
  'S8|หน่วยงานยืนยันนัดแล้ว → รายการตรวจสอบ (toast 15)': 'Default', 'S8|ตรวจครบ + ลงนาม 2 ฝ่าย': 'Filled ตรวจ + เซ็น 2 ฝ่าย ปุ่ม “ยืนยันรับรถ” จะ Enable',   // บล็อก I ฉบับเจ้าของงาน 22 ต.ค. ดึก
  'S9|มีความคืบหน้า 2 รายการ': 'เพิ่มความคืบหน้าสำเร็จ', 'S10|กดไอคอนแก้ไข → แก้ไขความคืบหน้า': 'แก้ไขรายละเอียดการติดตาม or หมายเหตุ', 'S10|บันทึกแล้ว (toast 19)': 'Update การแก้ไข', 'S11|กดไอคอนลบ → ยืนยันการลบความคืบหน้า': 'ยืนยันการลบรายละเอียดการติดตาม', 'S11|เหลือ 1 รายการ ลบไม่ได้แล้ว (toast 20)': 'ลบสำเร็จ เหลือ 1 รายการจะลบไม่ได้',   // บล็อก J K L ฉบับเจ้าของงาน 22 ต.ค.
  'S2|กดแก้ไขในเมนู … → ฟอร์มแก้ไข (เติมค่าเดิม)': 'ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้', 'S2|ฟอร์มแก้ไข (Prefield ข้อมูลที่สร้างไว้)': 'ฟอร์มแก้ไข Prefield ข้อมูลที่สร้างไว้', 'S2|ปุ่ม “ยกเลิก” → ยืนยันการออก (กรณีที่มีการแก้ไขเกิดขึ้น)': '“ยกเลิก” → ยืนยันการออก กรณีที่มีการแก้ไขเกิดขึ้น',   // ชื่อ C.2 C.3 ฉบับเจ้าของงาน 22 ต.ค. ดึก
   'S2|บันทึกสำเร็จ (toast 3)': 'บันทึกสำเร็จ', 'S3|เมนู "…" → ลบ': 'เมนู "…" → ลบ ในหน้า List', 'S3|กดลบในเมนู … → ยืนยันการลบแผน': 'ยืนยันการลบแผน ในหน้า List', 'S3|ลบสำเร็จ (toast 4)': 'ลบสำเร็จ (ลบที่ List or Detail ก็กลับมานี่)',   // บล็อก C · D ฉบับเจ้าของงาน 22 ต.ค.
  'S1|ฟอร์มสร้างแผน (ว่าง)': 'ฟอร์มสร้างแผน Default', 'S1|กดบันทึกโดยยังไม่ครบ': 'Validation กรณีไม่ได้เลือก, Out of focus', 'S1|กรอกครบ': 'Filled — งบลงทุน งานก่อสร้าง', 'S1|Filled': 'Filled — งบลงทุน งานก่อสร้าง',   // 29 ต.ค. ประเภทงบ: B.3 → B.3.4 'S1|บันทึกไม่สำเร็จ (toast 2)': 'บันทึกไม่สำเร็จ', 'S1|บันทึกสำเร็จ (toast 1)': 'บันทึกสำเร็จ',   // บล็อก B ฉบับเจ้าของงาน 22 ต.ค.
  'ผลกรองด้วยรถ': 'ผลกรองด้วยประเภทยานพาหนะ', 'ยืนยันรับรถแล้ว ยังไม่มีความคืบหน้า': 'ยังไม่มีความคืบหน้า', 'ติ๊กรถแล้วกดเพิ่ม': 'เลือกรถ (พิมพ์ค้นแล้วเลือกจาก dropdown)', 'รายการแผน (13 คอลัมน์ · ไอคอนจัดการ · pagination)': 'รายการแผน', 'รายการแผน (component Table · ปุ่ม … · pagination)': 'รายการแผน', 'ตัวกรอง (ปีงบ · สถานะ · ประเภทยานพาหนะ · ช่วงวงเงิน)': 'ตัวกรอง', 'กดไอคอนแก้ไข → ฟอร์มแก้ไข (เติมค่าเดิม)': 'กดแก้ไขในเมนู … → ฟอร์มแก้ไข (เติมค่าเดิม)', 'กดไอคอนลบ → ยืนยันการลบแผน': 'กดลบในเมนู … → ยืนยันการลบแผน', 'กดไอคอนแก้ไขของ PO → ฟอร์มแก้ไข PO': 'กดแก้ไขในเมนู … ของ PO → ฟอร์มแก้ไข PO', 'กดไอคอนลบของ PO → ยืนยันการลบ PO': 'กดลบในเมนู … ของ PO → ยืนยันการลบ PO', 'รายการแผน (component Table · ไอคอนจัดการ · pagination)': 'รายการแผน' };   // ชื่อฉบับ CF เช้า (ไอคอน) → ฉบับเจ้าของงานค่ำ (ปุ่ม … + เมนู)   // ชื่อ state เดิมที่เทียบด้วยกติกาทั่วไปไม่ได้ (รายการท้าย = ชื่อฉบับ CF เช้า 21 ต.ค. → ชื่อตามจอ J ของเจ้าของงาน)
const REMOVED_STATES = ['เปิดฟอร์มจากแผนที่ถูกลบไปแล้ว (toast 12)', 'นำเข้าไฟล์ผิดรูปแบบ (validation ไม่ใช่ toast)', 'ยังไม่ระบุระยะรับประกัน กดปิดงาน (validation)', 'บันทึกไม่สำเร็จ (toast 26)',   // บล็อก E · O ฉบับเจ้าของงาน 29 ต.ค. 2569
  'ยืนยันการตรวจสอบแล้ว (toast 22)', 'เปิดแก้ไขแผนที่ถูกลบไปแล้ว (toast 6)', 'ดูรูปแนบ (lightbox)', 'ผลกรองด้วยประเภทยานพาหนะ', 'ค้นหา พิมพ์ 3 ตัวอักษร ขึ้น autocomplete'];   // บล็อก A ของเจ้าของงาน (21 ต.ค. ค่ำ) เหลือ 4 state: รายการแผน · ตัวกรอง · ค้นไม่เจอ · ยังไม่มีแผน   // lightbox ไม่อยู่ในจอ J ที่เจ้าของงานส่ง (R23) · state เมนู "…" ที่ CF เคยตัด กลับมาแล้ว 21 ต.ค. ค่ำ (เจ้าของงาน)
const REMOVED_TAG = ' · ตัดแล้ว (ไม่มี state นี้ในฉบับปัจจุบัน)';
function parseFrameName(name) {   // → { code, tag, label, mob } หรือ null
  const m = /^OH2 \/ (?:([A-Z]\d*(?:\.\d+)+) · )?(.*)$/.exec(name); if (!m) return null;   // รหัส D.1.1 ได้ (22 ต.ค. 2569)
  let rest = m[2], mob = false;
  if (/ · mobile$/.test(rest)) { mob = true; rest = rest.replace(/ · mobile$/, ''); }
  for (const tag of SCEN_TAGS) if (rest.indexOf(tag + ' — ') === 0) return { code: m[1] || '', tag, label: rest.slice(tag.length + 3), mob };
  return null;
}
function matchState(tag, label, code) {   // → { si, ti, newLabel, fn } · { removed: true } · null · code = รหัสบนชื่อเฟรม (F.4.2) ใช้แยก state ชื่อซ้ำ
  const si = SCEN_TAGS.indexOf(tag); if (si < 0) return null;
  const states = SCENARIOS[si][1];
  const want = STATE_ALIAS[tag + '|' + label] || STATE_ALIAS[label] || STATE_ALIAS[normLabel(label)] || label;   // 'S1|ชื่อเดิม' = เปลี่ยนชื่อเฉพาะ scenario นั้น (S4 ใช้ชื่อเดียวกันอยู่)
  let ti = states.findIndex(([l]) => l === want);
  const same = states.map((st, i) => i).filter(i => states[i][0] === want);   // ชื่อซ้ำในบล็อก (บล็อก F ฉบับเจ้าของงาน 29 ต.ค. 2569: F.4.1 · F.4.2 บันทึกสำเร็จ)
  if (same.length > 1 && code) { const suf = code.replace(/^[A-Z]\d*\./, ''); const hit = same.find(i => (states[i][2] || String(i + 1)) === suf); if (hit != null) ti = hit; }
  if (ti < 0) ti = states.findIndex(([l]) => normLabel(l) === normLabel(want));
  if (ti < 0) ti = states.findIndex(([l]) => { const a = normLabel(l), b = normLabel(want); return b && (a.endsWith(b) || a.startsWith(b)); });
  if (ti < 0) return REMOVED_STATES.some(r => normLabel(r) === normLabel(label) || normLabel(r) === normLabel(want)) ? { removed: true } : null;   // เทียบทั้งชื่อเดิมและชื่อหลัง alias (เช่น ผลกรองด้วยรถ → ผลกรองด้วยประเภทยานพาหนะ ที่ถูกตัด 21 ต.ค. ค่ำ)
  return { si, ti, newLabel: states[ti][0], fn: states[ti][1] };
}
const frameName = (code, tag, label, mob) => 'OH2 / ' + (code ? code + ' · ' : '') + tag + ' — ' + label + (mob ? ' · mobile' : '');
async function makeAt(fn, mob, x, y) {   // สร้างจอ 1 จอที่ตำแหน่ง (ใช้ PLACE ให้ shell วางทันที) · ผู้เรียกจัดการ error เอง
  MOB = mob; PLACE = { x, y }; CREATED = [];
  try { const s = await fn(); stripDividers(s); await polish(s); return s; }
  finally { MOB = false; PLACE = null; }
}
async function updateSelected(o) {
  o = o || {}; errors.length = 0; const t0 = Date.now();
  const page = figma.currentPage;
  const sel = (page.selection || []).filter(n => n.type === 'FRAME' && n.parent === page && n.name.indexOf('OH2 / ') === 0);
  if (!sel.length) { log('ยังไม่ได้เลือกเฟรมจอ "OH2 / …" บนหน้านี้ — คลิกเลือกเฟรมที่อยากให้เป็นฉบับ CF (เลือกหลายเฟรมได้ · จอที่แก้มือไว้และอยากเก็บ ไม่ต้องเลือก) แล้วกดอีกครั้ง'); return; }
  log('นำเข้า component จากไลบรารี…'); await resolveAll(); await findStepRef(); log(deviceSetInfo());
  const touched = new Set(); let done = 0, skipped = 0, removed = 0;
  for (const old of sel) {
    const p = parseFrameName(old.name), m = p && matchState(p.tag, p.label, p.code);
    if (!p || !m) { skipped++; log('  · ข้าม "' + old.name + '" — ชื่อไม่ตรง scenario/state ใดใน CF'); continue; }
    if (m.removed) { removed++; if (old.name.indexOf(REMOVED_TAG) < 0) old.name += REMOVED_TAG; log('  · "' + old.name + '" — state นี้ไม่มีใน CF แล้ว ไม่แตะ แค่ติดป้าย'); continue; }
    const mob = p.mob || old.width <= 500;
    try {
      const s = await makeAt(m.fn, mob, old.x, old.y);
      s.name = frameName(p.code, p.tag, m.newLabel, mob);
      page.insertChild(page.children.indexOf(old), s); s.x = old.x; s.y = old.y;
      old.remove(); done++; touched.add(m.si);
      log('  · ' + done + '/' + sel.length + ' แทนที่ ' + s.name);
    } catch (e) { warn('อัปเดต ' + old.name, e); const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้าง ' + k + ' ชิ้น'); }
    CREATED = [];
  }
  const added = (o.addNew !== false && touched.size) ? await addNewStates(page, touched) : 0;
  log('');
  log('อัปเดตแล้ว ' + done + ' จอ · ข้าม ' + skipped + ' · ติดป้ายตัดแล้ว ' + removed + ' · เพิ่ม state ใหม่ ' + added + ' จอ · จอที่ไม่ได้เลือกไม่ถูกแตะ (จอเก่าที่แทนที่ กู้ได้จาก Version history)');
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  reportOversize(); log('ใช้เวลา ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
/* state ของ CF ที่ยังไม่มีเฟรมบนหน้า (เฉพาะ scenario ที่เพิ่งอัปเดต) → ต่อท้ายแถวของบล็อกนั้น
   หน้าแบบ R19 (แถว desktop กับ mobile คนละ y): วางคอลัมน์ถัดไปตามระยะ R19 ทั้ง 2 แถว x เดียวกัน + ป้าย state ถ้ามี
   หน้าแบบ 19 ต.ค. (desktop กับ mobile แถวเดียวกัน): ต่อท้ายขอบขวาของแถว desktop แล้ว mobile เคียงกัน */
async function addNewStates(page, touched) {
  const info = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('OH2 / ') === 0 && n.name.indexOf(REMOVED_TAG) < 0)
    .map(f => { const p = parseFrameName(f.name), m = p && matchState(p.tag, p.label, p.code); return m && !m.removed ? { f, p, m, mob: p.mob || f.width <= 500 } : null; }).filter(Boolean);
  const rowOf = (list) => { if (!list.length) return null; const ys = {}; list.forEach(r => { ys[r.f.y] = (ys[r.f.y] || 0) + 1; }); const y = +Object.keys(ys).sort((a, b) => ys[b] - ys[a])[0]; return { y, frames: list.filter(r => r.f.y === y) }; };
  let added = 0;
  for (const si of touched) {
    const states = SCENARIOS[si][1];
    const mine = info.filter(r => r.m.si === si);
    const desk = rowOf(mine.filter(r => !r.mob)), mob = rowOf(mine.filter(r => r.mob));
    if (!desk && !mob) continue;
    const have = new Set(mine.map(r => r.m.ti));
    const letter = (mine.find(r => r.p.code) || { p: { code: '' } }).p.code.split('.')[0];
    const bar = letter ? page.children.find(n => n.name.indexOf('OH2 · ' + letter + '.') === 0) : null;   // ป้าย state ของบล็อกนี้ → แถวป้าย
    const legacy = desk && mob && desk.y === mob.y;   // 19 ต.ค.: mobile วางคู่ desktop ในแถวเดียว
    const pitch = GRID.colW + GRID.colGap;
    let x = legacy ? Math.max(...desk.frames.concat(mob.frames).map(r => r.f.x + r.f.width)) + GRID.colGap
      : Math.max(...(desk || mob).frames.map(r => r.f.x)) + pitch;
    const after = (row) => row.frames[row.frames.length - 1].f;
    for (let ti = 0; ti < states.length; ti++) {
      if (have.has(ti)) continue;
      const [label, fn] = states[ti];
      let dx = x, mx = x;
      if (legacy) { mx = x + GRID.colW + GRID.gap; }   // 19 ต.ค.: mobile ห่าง desktop 80 (ระยะเดิมของหน้านั้น)
      for (const [isMob, row, px] of [[false, desk, dx], [true, mob, mx]]) {
        if (!row) continue;
        try {
          const s = await makeAt(fn, isMob, px, row.y);
          s.name = frameName(letter ? letter + '.' + ((SCENARIOS[si][1][ti] && SCENARIOS[si][1][ti][2]) || (ti + 1)) : '', SCEN_TAGS[si], label, isMob);
          page.insertChild(page.children.indexOf(after(row)), s); s.x = px; s.y = row.y;
          if (!isMob && bar) { CREATED = []; const b = await flowBar('OH2', letter + '.' + ((SCENARIOS[si][1][ti] && SCENARIOS[si][1][ti][2]) || (ti + 1)), label, 'Sub Flow 2', GRID.colW); page.insertChild(0, b); b.x = px; b.y = bar.y; }
          added++; log('  · + state ใหม่ ' + s.name);
        } catch (e) { warn('เพิ่ม ' + label + (isMob ? ' (mobile)' : ''), e); const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้าง ' + k + ' ชิ้น'); }
        CREATED = [];
      }
      x += legacy ? (GRID.colW + GRID.gap + GRID.mobW + GRID.colGap) : pitch;
    }
  }
  return added;
}
const STATUS_RENAME = { 'ยังไม่มี PO': 'รอเลข PO', 'ดำเนินการ': 'รอดำเนินการ' };   // PO CF หน้า 1
const TOAST_RENAME = { 'การสร้างแผน overhaul สำเร็จ': 1, 'general error': 2, 'ลบแผน overhaul สำเร็จ': 4, 'ลบ purchase order สำเร็จ': 9, 'การสร้าง นัดหมาย สำเร็จ': 13, 'ไม่สามารถสร้าง นัดหมาย': 14, 'ปิดงานสำเร็จ': 25 };   // ถ้อยคำเดิม → เลขแถวในชีต OH-Toast
const SEARCH_OLD_PLACEHOLDER = 'ค้นหาเลขแผน, ชื่อแผน, เลขที่งบประมาณ, ทะเบียนรถ';   // ฉบับ CF เช้า 21 ต.ค. → ฉบับจอเจ้าของงาน
async function patchTexts() {
  errors.length = 0;
  const page = figma.currentPage;
  const frames = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf('OH2 / ') === 0);
  if (!frames.length) { log('ไม่พบเฟรม "OH2 /" บนหน้านี้ — เปิดหน้าที่มีจอ Overhaul ก่อน'); return; }
  await resolveAll(['Pill outline', 'Notification', 'Table cell', 'Mobile table item', 'more_horiz-20-400-round', 'quick_reference_all-24-300-round', 'stylus-24-300-round', 'delete-24-300-round', 'Text input']);
  const viewId = INDEX.has('quick_reference_all-24-300-round') ? icon('quick_reference_all-24-300-round') : null;
  let pills = 0, toasts = 0, icons = 0, search = 0;
  for (const f of frames) {
    for (const p of f.findAll(n => n.type === 'INSTANCE' && n.name === 'Pill outline')) { const t = propVal(p, 'Text'); if (STATUS_RENAME[t]) { setProps(p, { Text: STATUS_RENAME[t] }); pills++; } }
    for (const n of f.findAll(x => x.type === 'INSTANCE' && x.name === 'Notification')) {
      const id = TOAST_RENAME[propVal(n, 'Text')]; if (!id) continue;
      const tt = TOASTS[id]; setProps(n, { Text: tt.title, 'Supporting text': tt.sub || '' }); const sup = find(n, 'Supporting text'); if (sup) sup.visible = !!tt.sub; toasts++;
    }
    for (const c of f.findAll(x => x.type === 'INSTANCE' && (x.name === 'Table cell' || x.name === 'Mobile table item') && x.variantProperties && x.variantProperties.Style === 'Action icons')) {
      const on = ICON_SLOTS.filter(k => propVal(c, k) === true), bs = c.findAll(n => n.type === 'INSTANCE' && n.name === 'Tertiary button');
      if (on.length === 3 && bs[0] && viewId && propVal(bs[0], 'Leading icon swap') === viewId) { fillIcons(c, ['more_horiz-20-400-round']); icons++; }   // ช่อง 3 ไอคอน ดู · แก้ไข · ลบ (ฉบับ CF เช้า) → ปุ่ม "…" (เจ้าของงาน 21 ต.ค. ค่ำ) · ไอคอน 1–2 ปุ่ม (S9 แก้ไข/ลบ · อะไหล่ · ลูกศร · ดู) ไม่แตะ
    }
    for (const ti of f.findAll(x => x.type === 'INSTANCE' && x.name === 'Text input')) { if (propVal(ti, 'Text') === SEARCH_OLD_PLACEHOLDER) { setProps(ti, { Text: SEARCH_CF }); search++; } }
  }
  log('แก้บนหน้า "' + page.name + '" ' + frames.length + ' จอ: ป้ายสถานะ ' + pills + ' · ถ้อยคำ toast ' + toasts + ' · ช่องจัดการ ไอคอน 3 ปุ่ม → "…" ' + icons + ' · placeholder ค้นหา ' + search + ' · ไม่ได้สร้างหรือย้ายจอ (คอลัมน์ใหม่/จอใหม่ตาม CF ใช้ปุ่ม "อัปเดตจอที่เลือก")');
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด' : 'ไม่มีคำเตือน ✓');
}

/* ---------- Dashboard งาน Overhaul (เจ้าของงานสั่ง 21 ต.ค. 2569: "tracking อะไหล่ อายุการใช้งานหลังจาก overhaul ทั้งภาพรวม และรายคัน") — เอกสาร Diagram/01-บำรุงรักษาตามวาระ/20-overhaul-dashboard-หลัง-overhaul.md
   โครง = หน้า MA Overview ของ UI Release#2: Page header → Tabs + Pill นับ → Metric item ×4 → Alert → Table header → Table ≤ 8 คอลัมน์ → pagination (กติกา R22)
   แท็บในหน้า "จัดการงาน Overhaul": แผน · รถหลัง Overhaul · ซ่อมหลัง Overhaul · อะไหล่ + หน้ารายคัน "หลัง Overhaul"
   ทุกบล็อกมี 2 ฉบับ: "เฟส 1" = คอลัมน์ที่มีข้อมูลจริงวันนี้ (ตาราง Overhaul ใหม่ + งานซ่อมใน DB) · "เป้าหมาย" = + คอลัมน์ที่ต้องเพิ่มช่องในโฟลว์ก่อน (ประกัน · ไมล์ ณ รับรถ · รหัสอะไหล่ · ค่า Overhaul) ติด Alert บอก
   ข้อมูลทั้งหมดเป็นข้อมูลจำลอง · ไม่มี chart component ในไลบรารี ⇒ ใช้ Metric · Badge · Progress bar · ตาราง เท่านั้น ---------- */
async function metric(text, number, color) {   // Metric item (Breakpoint ตามจอ) + สี Featured icon ที่ซ้อนอยู่
  const m = inst('Metric item', { Breakpoint: BP() }, { Number: String(number), Text: text });
  const fi = find(m, 'Featured icon'); if (fi) setProps(fi, { Color: color || 'Brand' });
  return m;
}
function metricRow(items) {   // desktop: 4 ใบเต็มแถว gap 24 (MA Overview 306 × 4) · mobile: 2 ใบต่อแถว gap 12
  if (MOB) {
    const box = frame('Metrics', 'VERTICAL', { gap: 12 });
    for (let i = 0; i < items.length; i += 2) { const r = frame('Row', 'HORIZONTAL', { gap: 12 }); items.slice(i, i + 2).forEach(m => { r.appendChild(m); m.layoutGrow = 1; }); add(box, r, 'h'); }
    return box;
  }
  const r = frame('Metrics', 'HORIZONTAL', { gap: 24 }); items.forEach(m => { r.appendChild(m); m.layoutGrow = 1; }); return r;
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
const DASH_TABS = [['แผน', 7], ['รถหลัง Overhaul', 6], ['ซ่อมหลัง Overhaul', 5], ['อะไหล่', 14]];
const ASOF = 'ข้อมูล ณ วันที่ 21 ต.ค. 2569';
const DASH_NOTE = 'งานซ่อมหลัง Overhaul อ้างจากประวัติซ่อมในระบบ งานซ่อมนอกระบบไม่ถูกนับ · "ชิ้นที่ Overhaul" เฟส 1 จับจากชื่ออะไหล่ โดยประมาณ · เลขไมล์และชั่วโมงเครื่องอ้างจากทะเบียนรถ (ไม่มีวันที่อัปเดต) · ต้นแบบนี้เป็นข้อมูลจำลอง';
/* ปรับตามไฟล์ศึกษา 21 หัวข้อ 5 (เจ้าของงาน 22 ต.ค. 2569 "ปรับแดชบอร์ดตามข้อเสนอได้เลย แต่การแทรก อาจจะเป็นการแทรกรายคัน โดยดูว่าคันนั้นมีการซ่อมอะไหล่ชิ้นที่มีการ overhaul ไปหรือไม่"):
   ประกันของผู้รับจ้าง (S14 · R28) ขึ้นเฟส 1 แทนค่าซ่อมรวม · สถานะติดตามรายคัน = ซ่อมชิ้นที่ Overhaul / ซ่อมชิ้นอื่น / ยังไม่มีงานซ่อม · ทุกตัวเลขรวมบอกจำนวนคัน ·
   หน้ารายคันมี Alert แทรกเมื่อคันนั้นซ่อมชิ้นที่ Overhaul ในประกัน + สภาพ "ยังไม่ครบช่วงติดตาม" (รับคืนไม่ถึง 6 เดือน ไม่เทียบก่อน → หลัง) · ประกันของ กบค. เป็นอีกเรื่อง ไม่อยู่ใน dashboard */
/* เปลือกหน้า dashboard: Page header "จัดการงาน Overhaul" + Tabs + Metric + Alert · o.tab = แท็บที่เปิด · o.metrics = [[text, number, color]] · o.target = ข้อความ Alert "คอลัมน์ที่ยังไม่มีข้อมูล" */
async function dashShell(name, o) {
  const { scr, page } = await shell(name, { title: 'จัดการงาน Overhaul', primary: o.tab === 0 ? 'สร้างแผน Overhaul' : null, actions: o.tab === 0 ? null : [['Secondary button', 'ส่งออก Excel / PDF']] });
  add(page, await tabs(DASH_TABS, o.tab), 'h');
  add(page, metricRow(await Promise.all(o.metrics.map(m => metric(m[0], m[1], m[2])))), 'h');
  add(page, alertBox('Gray', ASOF, DASH_NOTE), 'h');
  if (o.target) add(page, alertBox('Info', 'คอลัมน์ที่ยังไม่มีข้อมูล ต้องเพิ่มช่องในโฟลว์ก่อน', o.target), 'h');
  return { scr, page };
}
/* ตาราง + หัวตาราง + pagination / empty state ในกล่อง Section (แบบ listScreen) */
async function dashList(page, o) {
  const sec = col('Section', [], 24); add(page, sec, 'h');
  if (!o.empty) add(sec, await tableHeader({ placeholder: o.placeholder, chips: o.chips, query: o.query }), 'h');
  if (o.empty) { const es = inst('Empty state/Data empty'); add(sec, es, 'h'); await text(es, 'Text', o.empty[0]); await text(es, 'Supporting text', o.empty[1]); const a = find(es, 'Actions'); if (a) a.visible = false; }
  else if (o.notFound) { const es = inst('Empty state/Search not found'); add(sec, es, 'h'); await text(es, 'Text', o.notFound[0]); await text(es, 'Supporting text', o.notFound[1]); const s2 = find(es, 'Secondary button'); if (s2) setProps(s2, { Text: 'ล้างคำค้นและตัวกรอง', 'Leading icon': false }); const pb = find(es, 'Primary button'); if (pb) pb.visible = false; }
  else add(sec, await tbl(o.cols, o.rows, { pagination: o.total || o.rows.length, pageOpt: { per: o.rows.length, total: o.total || o.rows.length } }), 'h');
  return sec;
}
const TRACK = { none: ['ยังไม่มีงานซ่อม', 'Success'], other: ['ซ่อมชิ้นอื่น', 'Warning'], same: ['ซ่อมชิ้นที่ Overhaul', 'Error'] };
const VIEW_ICONS = ['quick_reference_all-24-300-round', 'keyboard_arrow_right-20-400-round'];   // ดูสรุปรายคัน (S18 · 30 ต.ค. 2569 เดิม = หน้ารายคันหลัง Overhaul) · เปิดหน้างาน
/* รถที่ปิดงานแล้ว (V11) — [ทะเบียน, รุ่น·ประเภท, หน่วยงาน · เขต, แผน, PO, วันปิดงาน, อยู่อู่ วัน, อะไหล่ n, อะไหล่ 2 ชื่อแรก, ซ่อมหลัง n, ซ่อมล่าสุด, สถานะติดตาม,
   ประกันผู้รับจ้างถึง (= วันเริ่มรับประกัน + จำนวนวันที่กรอกตอนปิดงาน · R28), ข้อความรองของประกัน, แดง? (เหลือ ≤ 30 วัน หรือหมดแล้ว), ใช้งาน +กม., +ชม. ณ วันที่, ซ่อมชิ้นที่ Overhaul n ครั้ง] · วันนี้ในข้อมูลจำลอง = 21 ต.ค. 2569 */
const DASH_CARS = [
  ['72-6648 สงขลา', 'HINO FG1J · รถกระเช้า', 'กฟฟ.สงขลา · กฟต.3', '123457', 'PO-690201 · มิตซูบิชิ ฟูโซ่', '5 ต.ค. 2569', 34, 4, 'ซีลไฮดรอลิก, กรองน้ำมันเครื่อง …', 1, 'ล่าสุด 18 ต.ค. 2569', 'same', '30 ก.ย. 2570', '360 วัน · เหลือ 344 วัน', false, '+2,050 กม.', '+110 ชม. · ณ 20 ต.ค. 2569', 1],
  ['70-1123 ชลบุรี', 'HINO FG8J · รถเครน 5 ตัน', 'กฟฟ.ชลบุรี · กฟก.2', '123456', 'PO-690101 · ฮีโน่ มอเตอร์ส เซลส์', '18 ต.ค. 2569', 33, 3, 'ชุดลูกสูบพร้อมแหวน, กรองน้ำมันเครื่อง …', 1, 'ล่าสุด 20 ต.ค. 2569', 'other', '13 ต.ค. 2570', '360 วัน · เหลือ 357 วัน', false, '+310 กม.', '+12 ชม. · ณ 20 ต.ค. 2569', 0],
  ['8234 กค กทม', 'HINO FM2P · รถเครน 10 ตัน', 'กฟฟ.กทม. · กฟน.1', '123456', 'PO-690101 · ฮีโน่ มอเตอร์ส เซลส์', '9 ต.ค. 2569', 27, 3, 'ชุดลูกสูบพร้อมแหวน, น้ำมันไฮดรอลิก …', 0, '—', 'none', '4 ต.ค. 2570', '360 วัน · เหลือ 348 วัน', false, '+1,230 กม.', '+48 ชม. · ณ 19 ต.ค. 2569', 0],
  ['71-9902 ขอนแก่น', 'MITSUBISHI FN · รถกระเช้า', 'กฟฟ.ขอนแก่น · กฟฉ.1', '123401', 'PO-680101 · ฮีโน่ มอเตอร์ส เซลส์', '20 ธ.ค. 2568', 61, 5, 'ผ้าเบรกหน้า, น้ำมันไฮดรอลิก …', 1, 'ล่าสุด 12 มี.ค. 2569', 'same', '15 ธ.ค. 2569', '360 วัน · เหลือ 55 วัน', false, '+5,400 กม.', '+260 ชม. · ณ 12 ต.ค. 2569', 1],
  ['80-3316 เชียงใหม่', 'HINO FM1A · รถเครน 10 ตัน', 'กฟฟ.เชียงใหม่ · กฟน.1', '123401', 'PO-680101 · ฮีโน่ มอเตอร์ส เซลส์', '20 ธ.ค. 2568', 66, 6, 'ชุดเครน, ซีลไฮดรอลิก …', 0, '—', 'none', '18 มิ.ย. 2569', '180 วัน · หมดประกันแล้ว', true, '+9,870 กม.', '+1,120 ชม. · ณ 15 ต.ค. 2569', 0],
  ['83-2210 นครราชสีมา', 'ISUZU FVZ · รถเจาะหลุมปักเสา', 'กฟฟ.นครราชสีมา · กฟฉ.3', '123402', 'PO-680102 · ตรีเพชรอีซูซุเซลส์', '30 พ.ย. 2568', 27, 4, 'ชุดลูกสูบพร้อมแหวน, กรองน้ำมันเครื่อง …', 2, 'ล่าสุด 2 ก.ย. 2569', 'same', '5 พ.ย. 2569', '340 วัน · เหลือ 15 วัน', true, '+18,420 กม.', '+640 ชม. · ณ 15 ต.ค. 2569', 1],
];
/* เฟส 1 (ปรับ 22 ต.ค.): ปิดงาน · ประกันผู้รับจ้างถึง (แดงเมื่อเหลือ ≤ 30 วันหรือหมดแล้ว) · ซ่อมหลัง Overhaul บรรทัดรอง = ซ่อมชิ้นที่ Overhaul กี่ครั้ง · สถานะติดตามรายคัน */
const carWarranty = (c) => ({ text: c[5], sub: 'ประกันถึง ' + c[12] + ' · ' + c[13].split(' · ')[1], subColor: c[14] ? 'error' : null });
const carRepairs = (c) => ({ text: c[9] + ' ครั้ง', sub: c[17] ? 'ชิ้นที่ Overhaul ' + c[17] + ' ครั้ง' : c[9] ? 'ชิ้นอื่น · ' + c[10] : '—', subColor: c[17] ? 'error' : null });
const CARS_COLS_P1 = [['ทะเบียน', 170, 'Lead text'], ['หน่วยงาน / เขต', 150], ['แผน / PO', 190], ['ปิดงาน · ประกันถึง', 170], ['อะไหล่ที่เปลี่ยน', 190], ['ซ่อมหลัง Overhaul', 150], ['สถานะติดตาม', 160, 'Badge'], ['', 96]];
const carRowP1 = (c) => [{ text: c[0], sub: c[1] }, c[2], { text: 'แผน ' + c[3], sub: c[4] }, carWarranty(c), { text: c[7] + ' รายการ', sub: c[8] }, carRepairs(c), { pill: TRACK[c[11]] }, { icons: VIEW_ICONS }];
/* เป้าหมาย: เหมือนเฟส 1 แต่ใช้งานหลังรับรถ แทนคอลัมน์อะไหล่ (อะไหล่ไปอยู่หน้ารายคัน · ต้องมีไมล์/ชม. ณ รับคืน ช่อง D) · "ชิ้นที่ Overhaul" ยืนยันด้วยรหัสอะไหล่/ช่อง H แทนการจับชื่อ */
const CARS_COLS_T = [['ทะเบียน', 170, 'Lead text'], ['หน่วยงาน / เขต', 150], ['แผน / PO', 190], ['ปิดงาน · ประกันถึง', 170], ['ใช้งานหลังรับรถ', 170], ['ซ่อมหลัง Overhaul', 150], ['สถานะติดตาม', 160, 'Badge'], ['', 96]];
const carRowT = (c) => [{ text: c[0], sub: c[1] }, c[2], { text: 'แผน ' + c[3], sub: c[4] }, carWarranty(c), { text: c[15], sub: c[16] }, carRepairs(c), { pill: TRACK[c[11]] }, { icons: VIEW_ICONS }];
const CARS_SEARCH = 'ค้นหาทะเบียน, เลขแผน, เลข PO, ชื่ออะไหล่';
const CARS_METRICS_P1 = [['ปิดงานแล้ว (คัน)', 6, 'Brand'], ['อยู่ในประกันผู้รับจ้าง (จาก 6 คัน)', 5, 'Success'], ['ใกล้หมดประกัน ≤ 30 วัน (คัน)', 1, 'Warning'], ['ซ่อมชิ้นที่ Overhaul ในประกัน (คัน)', 3, 'Error']];
const CARS_METRICS_T = CARS_METRICS_P1;
const CARS_TARGET_NOTE = 'ใช้งานหลังรับรถ (ไมล์/ชั่วโมง ณ รับคืน ช่อง D + เลขไมล์มีวันที่จากการเติมน้ำมัน) · ชิ้นที่ Overhaul ยืนยันด้วยรหัสอะไหล่ (F) หรือช่อง "เกี่ยวกับ Overhaul?" ในใบงานซ่อม (H) · ค่า Overhaul เทียบราคารถ (E) ยังไม่มีในโฟลว์ — ไฟล์ 20 หัวข้อ 7';
async function carsTab(name, o) {
  o = o || {};
  const { scr, page } = await dashShell(name, { tab: 1, metrics: o.target ? CARS_METRICS_T : CARS_METRICS_P1, target: o.target ? CARS_TARGET_NOTE : null });
  await dashList(page, Object.assign({ placeholder: CARS_SEARCH, cols: o.target ? CARS_COLS_T : CARS_COLS_P1, rows: DASH_CARS.map(o.target ? carRowT : carRowP1) }, o.list || {}));
  return scr;
}
/* แผงตัวกรองของ dashboard (Side panel · mobile bottom sheet): ปีงบ · เขต/หน่วยงาน · ประเภทรถ (หลายค่า) · ยี่ห้อ/รุ่น · อู่ · ช่วงวันปิดงาน · ช่วงติดตาม */
async function dashFilter(scr) {
  const content = [dropdown('ปีงบประมาณของแผน', 'ทุกปี'), dropdown('เขต / หน่วยงานเจ้าของรถ', '', { placeholder: 'ค้นหาเขตหรือหน่วยงาน', lead: 'search-24-300-round' }),
    await checkGroup('ประเภทรถ (เลือกได้หลายค่า)', VEHICLE_TYPES), dropdown('ยี่ห้อ / รุ่น', 'ทั้งหมด'), dropdown('ศูนย์บริการ/อู่', 'ทั้งหมด'),
    dropdown('ช่วงวันปิดงาน', '1 ม.ค. 2568 – 21 ต.ค. 2569'), await checkGroup('ช่วงติดตาม', [['อยู่ในประกัน', 'Success'], ['ปิดงานไม่เกิน 1 ปี', 'Gray'], ['ปิดงานไม่เกิน 10 ปี', 'Gray']])];
  if (MOB) { await sheet(scr, { title: 'ตัวกรอง', action: 'ล้างตัวกรอง', content, ok: 'ตกลง' }); return; }
  overlay(scr, inst('Background overlay'), 0, 0).resize(1440, 1024);
  const panel = frame('Panel', 'VERTICAL', { gap: 24, fill: WHITE });
  overlay(scr, panel, 960, 0); panel.primaryAxisSizingMode = 'FIXED'; panel.counterAxisSizingMode = 'FIXED'; panel.resize(480, 1024);
  const hd = inst('Side panel header'); add(panel, hd, 'h'); hide(hd, 'Tabs');
  await text(hd, 'Text', 'ตัวกรอง'); await text(hd, 'Supporting text', 'ตัวกรองชุดเดียวคุมทั้ง Metric และตารางของแท็บนี้');
  const body = frame('Content', 'VERTICAL', { gap: 24, pad: [0, 24] }); add(panel, body, 'both');
  for (const n of content) add(body, n, 'h');
  const ft = inst('Side panel footer'); add(panel, ft, 'h');
  [['Tertiary brand button', 'ล้างตัวกรอง'], ['Secondary button', 'ยกเลิก'], ['Primary button', 'ตกลง']].forEach(([k, t]) => { const b = find(ft, k); if (b) setProps(b, { Text: t, 'Leading icon': false, 'Trailing icon': false }); });
}
/* งานซ่อมหลังรับรถ — [วันที่, หลังรับรถ, ทะเบียน, รุ่น, อาการ, รายละเอียด, อะไหล่ที่เปลี่ยน, ซ้ำ/เกี่ยว (เฟส 1 · เป้าหมาย), ในประกัน, ผู้ซ่อม, ค่าซ่อม] */
const REL = { found: ['พบคำตรงกัน', 'Warning'], yes: ['ใช่', 'Purple'], no: ['ไม่ใช่', 'Gray'], wait: ['รอระบุ', 'Info'], dash: ['—', 'Gray'] };
const WAR = { co: ['ต้องให้บริษัทแก้', 'Error'], in: ['ในช่วงประกัน · ชิ้นอื่น', 'Gray'], out: ['นอกประกัน', 'Gray'] };   // ประกันของผู้รับจ้าง (R28) · ต้องให้บริษัทแก้ = ซ่อมชิ้นที่ Overhaul ภายในประกัน · ประกัน กบค. เป็นอีกเรื่อง
const DASH_REPAIRS = [
  ['18 ต.ค. 2569', 'หลัง Overhaul 13 วัน', '72-6648 สงขลา', 'HINO FG1J', 'ไฮดรอลิกกระเช้ารั่ว', 'น้ำมันไฮดรอลิกซึมที่ข้อต่อบูม', 'ซีลไฮดรอลิก', 'found', 'yes', 'co', 'มิตซูบิชิ ฟูโซ่', '12,500'],
  ['20 ต.ค. 2569', 'หลัง Overhaul 2 วัน', '70-1123 ชลบุรี', 'HINO FG8J', 'สัญญาณไฟเลี้ยวไม่ติด', 'หลอดไฟเลี้ยวหน้าซ้ายขาด', 'หลอดไฟ', 'dash', 'no', 'in', 'ซ่อมเอง กบค.', '450'],
  ['2 ก.ย. 2569', 'หลัง Overhaul 276 วัน', '83-2210 นครราชสีมา', 'ISUZU FVZ', 'สตาร์ทติดยาก', 'แบตเตอรี่เสื่อม', 'แบตเตอรี่', 'dash', 'no', 'in', 'ซ่อมเอง กบค.', '8,900'],
  ['5 มิ.ย. 2569', 'หลัง Overhaul 187 วัน', '83-2210 นครราชสีมา', 'ISUZU FVZ', 'เครื่องยนต์มีเสียงดัง', 'กรองน้ำมันเครื่องตัน', 'กรองน้ำมันเครื่อง', 'found', 'yes', 'co', 'ซ่อมเอง กบค.', '2,100'],
  ['12 มี.ค. 2569', 'หลัง Overhaul 82 วัน', '71-9902 ขอนแก่น', 'MITSUBISHI FN', 'เบรกไม่อยู่', 'ผ้าเบรกหน้าหมด', 'ผ้าเบรกหน้า', 'found', 'wait', 'co', 'ตรีเพชรอีซูซุ', '6,400'],
];
const REP_COLS_P1 = [['วันที่ซ่อม', 140, 'Lead text'], ['ทะเบียน', 150], ['อาการ / รายละเอียด', 0], ['อะไหล่ที่เปลี่ยน', 130], ['ชิ้นที่ Overhaul?', 130, 'Badge'], ['ประกันผู้รับจ้าง', 160, 'Badge'], ['ผู้ซ่อม · ค่าซ่อม', 150], ['', 96]];
const repRowP1 = (r) => [{ text: r[0], sub: r[1] }, { text: r[2], sub: r[3] }, { text: r[4], sub: r[5] }, r[6], { pill: REL[r[7]] }, { pill: WAR[r[7] === 'found' && r[9] === 'co' ? 'co' : r[9] === 'out' ? 'out' : 'in'] }, { text: r[10], sub: r[11] + ' บาท' }, { icons: VIEW_ICONS }];
const REP_COLS_T = [['วันที่ซ่อม', 140, 'Lead text'], ['ทะเบียน', 150], ['อาการ / รายละเอียด', 0], ['อะไหล่ที่เปลี่ยน', 130], ['เกี่ยวกับ Overhaul?', 120, 'Badge'], ['ประกันผู้รับจ้าง', 160, 'Badge'], ['ผู้ซ่อม · ค่าซ่อม', 150], ['', 96]];
const repRowT = (r) => [{ text: r[0], sub: r[1] }, { text: r[2], sub: r[3] }, { text: r[4], sub: r[5] }, r[6], { pill: REL[r[8]] }, { pill: WAR[r[8] === 'yes' && r[9] === 'co' ? 'co' : r[9] === 'out' ? 'out' : 'in'] }, { text: r[10], sub: r[11] + ' บาท' }, { icons: VIEW_ICONS }];
const REP_METRICS_P1 = [['งานซ่อมหลัง Overhaul (ครั้ง)', 5, 'Gray'], ['คันที่กลับมาซ่อม (จาก 6 คัน)', 4, 'Warning'], ['ซ่อมชิ้นที่ Overhaul (พบชื่อตรงกัน)', 3, 'Error'], ['ต้องให้บริษัทแก้ (ในประกัน)', 3, 'Brand']];
const REP_METRICS_T = [['งานซ่อมหลัง Overhaul (ครั้ง)', 5, 'Gray'], ['รอระบุว่าเกี่ยวกับ Overhaul ไหม', 1, 'Info'], ['ต้องให้บริษัทแก้ (ยืนยันแล้ว)', 2, 'Error'], ['ในช่วงประกัน · ชิ้นอื่น', 2, 'Gray']];
async function repairsTab(name, o) {
  o = o || {};
  const { scr, page } = await dashShell(name, { tab: 2, metrics: o.target ? REP_METRICS_T : REP_METRICS_P1, target: o.target ? '"เกี่ยวกับ Overhaul?" (ช่อง H ในใบงานซ่อม + รหัส/ระบบของอะไหล่ ช่อง F) ยังไม่มีในโฟลว์ — เฟส 1 แสดง "พบคำตรงกัน" จากการจับชื่ออะไหล่แทน · ประกันผู้รับจ้างมีแล้ว (ปิดงาน S14)' : null });
  await dashList(page, { placeholder: 'ค้นหาทะเบียน, อาการ, ชื่ออะไหล่ที่เปลี่ยน', cols: o.target ? REP_COLS_T : REP_COLS_P1, rows: DASH_REPAIRS.map(o.target ? repRowT : repRowP1) });
  return scr;
}
/* อะไหล่ รวมข้ามคัน — [ชื่อ, รหัสวัสดุ · หน่วย, ใช้ใน Overhaul n คัน, รวม x หน่วย, ยี่ห้อ/รุ่นที่พบบ่อย, x จาก n คัน, พบในงานซ่อมหลัง, วิธีจับคู่, เร็วสุดที่พังซ้ำ, +กม., ระบบ, ราคา/หน่วย] */
const DASH_PARTS = [
  ['กรองน้ำมันเครื่อง', 'MAT-10233 · ชิ้น', '6 คัน', 'รวม 12 ชิ้น', 'HINO FM2P', '2 จาก 6 คัน', '1 ครั้ง / 1 คัน', 'จับคู่ด้วยชื่อ (โดยประมาณ)', '187 วันหลังรับรถ', '+9,800 กม.', 'เครื่องยนต์', '380'],
  ['น้ำมันไฮดรอลิก', 'MAT-20815 · ลิตร', '5 คัน', 'รวม 90 ลิตร', 'HINO FM1A', '2 จาก 5 คัน', '0 ครั้ง', '—', '—', '', 'เครน/ไฮดรอลิก', '95'],
  ['ซีลไฮดรอลิก', 'MAT-20901 · ชุด', '4 คัน', 'รวม 12 ชุด', 'HINO FG1J', '2 จาก 4 คัน', '1 ครั้ง / 1 คัน', 'จับคู่ด้วยชื่อ (โดยประมาณ)', '13 วันหลังรับรถ', '+2,050 กม.', 'เครน/ไฮดรอลิก', '1,850'],
  ['ชุดลูกสูบพร้อมแหวน', 'MAT-10110 · ชุด', '3 คัน', 'รวม 18 ชุด', 'ISUZU FVZ', '2 จาก 3 คัน', '0 ครั้ง', '—', '—', '', 'เครื่องยนต์', '4,200'],
  ['ผ้าเบรกหน้า', 'ไม่มีรหัส · ชุด', '2 คัน', 'รวม 4 ชุด', 'MITSUBISHI FN', '1 จาก 2 คัน', '1 ครั้ง / 1 คัน', 'จับคู่ด้วยชื่อ (โดยประมาณ)', '82 วันหลังรับรถ', '+3,200 กม.', 'ช่วงล่าง', '2,600'],
];
const PART_COLS_P1 = [['อะไหล่', 0, 'Lead text'], ['ใช้ใน Overhaul', 160], ['ยี่ห้อ/รุ่นที่พบบ่อย', 180], ['พบในงานซ่อมหลัง Overhaul', 220], ['', 96]];
const partRowP1 = (p) => [p[0], { text: p[2], sub: p[3] }, { text: p[4], sub: p[5] }, { text: p[6], sub: p[7] }, { icons: ['quick_reference_all-24-300-round'] }];
const PART_COLS_T = [['อะไหล่', 0, 'Lead text'], ['ใช้ใน Overhaul', 130], ['ยี่ห้อ/รุ่นที่พบบ่อย', 150], ['พบในงานซ่อมหลัง', 160], ['เร็วสุดที่พังซ้ำ', 140], ['ระบบ', 130, 'Badge'], ['ราคา/หน่วย', 100], ['', 64]];
const partRowT = (p) => [{ text: p[0], sub: p[1] }, { text: p[2], sub: p[3] }, { text: p[4], sub: p[5] }, { text: p[6], sub: p[1].indexOf('ไม่มีรหัส') < 0 ? 'จับคู่ด้วยรหัส' : p[7] }, p[8] === '—' ? '—' : { text: p[8], sub: p[9] }, { pill: [p[10], 'Gray'] }, p[11], { icons: ['quick_reference_all-24-300-round'] }];
const PART_METRICS_P1 = [['รายการอะไหล่ที่เปลี่ยนตอน Overhaul', 14, 'Brand'], ['เปลี่ยนบ่อยสุด: กรองน้ำมันเครื่อง (คัน จาก 6)', 6, 'Info'], ['พบซ้ำในงานซ่อมหลัง Overhaul', 3, 'Warning'], ['รถที่นับ (ปิดงานแล้ว)', 6, 'Gray']];
const PART_METRICS_T = [['รายการอะไหล่ที่เปลี่ยนตอน Overhaul', 14, 'Brand'], ['มีรหัสวัสดุแล้ว', 9, 'Success'], ['เปลี่ยนซ้ำภายในประกัน', 1, 'Error'], ['มูลค่าอะไหล่รวม (บาท)', '186,400', 'Gray']];
async function partsTab(name, o) {
  o = o || {};
  const { scr, page } = await dashShell(name, { tab: 3, metrics: o.target ? PART_METRICS_T : PART_METRICS_P1, target: o.target ? 'รหัสวัสดุ · ระบบ · ราคา/หน่วย (ช่อง F ผูก Smart Inventory) · เร็วสุดที่พังซ้ำ +กม. (ช่อง D) ยังไม่มีในโฟลว์' : null });
  add(page, alertBox('Info', 'รวมตามชื่อที่กรอกตอนปิดงาน', 'ชื่อสะกดต่างกันนับแยกแถว · "พบในงานซ่อมหลัง" จับคำจากข้อความอะไหล่ในใบซ่อม โดยประมาณ จะแม่นเมื่อผูกรหัสวัสดุ'), 'h');
  await dashList(page, { placeholder: 'ค้นหาชื่ออะไหล่, รหัสวัสดุ', cols: o.target ? PART_COLS_T : PART_COLS_P1, rows: DASH_PARTS.map(o.target ? partRowT : partRowP1) });
  return scr;
}
/* แท็บแผน = หน้า 1 เดิม (ตาราง CF) + Tabs + แถว Metric ของแผน */
async function planTab(name) {
  const { scr, page } = await dashShell(name, { tab: 0, metrics: [['แผนทั้งหมด', 7, 'Brand'], ['รถใน PO ทั้งหมด (คัน)', 10, 'Gray'], ['กำลังดำเนินการ (คัน)', 4, 'Info'], ['ปิดงานแล้ว (คัน)', 6, 'Success']] });
  await dashList(page, { placeholder: SEARCH_CF, cols: PLAN_COLS, rows: CF_LIST.rows.map(planRow), total: PLANS_CF.length });
  return scr;
}
/* หน้ารายคัน "หลัง Overhaul" (Detail: Section label + กล่องแสดงข้อมูล R12) — รถ 72-6648 สงขลา */
/* กล่องข้อมูลยานพาหนะ = ชุดเดียวกับหน้างานรายคัน (เจ้าของงาน 21 ต.ค. 2569: "ส่วนที่เป็นรายละเอียดรถจะไม่มีข้อมูล purchase order แสดงแค่ที่ส่งไปให้") · เรื่องแผน/PO/อู่ แยกเป็นกล่อง "งาน Overhaul" */
const V_INFO = [['ทะเบียน', '72-6648 สงขลา'], ['ยี่ห้อ/รุ่น', 'HINO FG1J'], ['ประเภท', 'รถกระเช้า'], ['อายุการใช้งาน', '16 ปี'], ['เลขไมล์สะสม', '223,350 กม.'], ['ชั่วโมงสะสม', '13,420 ชม.']];
const V_JOB = [['แผน', '123457 Overhaul ประจำปีงบ 2569 — รถกระเช้า'], ['PO', 'PO-690201 ซ่อมระบบไฮดรอลิกกระเช้า'], ['ศูนย์บริการ/อู่', 'บริษัท มิตซูบิชิ ฟูโซ่ ทรัค จำกัด'], ['หน่วยงานเจ้าของรถ', 'กฟฟ.สงขลา (กฟต.3)'], ['ปีแผน', '2569'], ['สถานะงาน', 'ปิดงานแล้ว 5 ต.ค. 2569']];
const V_WARRANTY = [['วันเริ่มรับประกัน', '5 ต.ค. 2569'], ['ระยะรับประกัน', '360 วัน'], ['วันหมดอายุประกัน', '30 ก.ย. 2570 (เหลือ 344 วัน)'], ['แจ้งเตือนก่อนหมด', '30 วัน และ 15 วัน']];   // กรอกตอนปิดงาน S14 (R28)
/* แทรกรายคัน (เจ้าของงาน 22 ต.ค. 2569): คันนี้ซ่อมอะไหล่ชิ้นที่ Overhaul ไปหรือไม่ · ในประกันผู้รับจ้างไหม → Alert บนสุดของหน้า */
const V_INSERT = ['คันนี้ซ่อมชิ้นที่ Overhaul ไปแล้ว 1 ครั้ง ภายในประกันของผู้รับจ้าง', 'ซีลไฮดรอลิก · ซ่อม 18 ต.ค. 2569 (13 วันหลังปิดงาน) · ประกันถึง 30 ก.ย. 2570 · ติดต่อ บริษัท มิตซูบิชิ ฟูโซ่ ทรัค จำกัด ตาม PO-690201'];
/* ยังไม่ครบช่วงติดตาม (ปิดงานไม่ถึง 6 เดือน) ⇒ ไม่เทียบค่าซ่อมก่อน → หลัง แสดงวันที่เทียบได้แทน (ไฟล์ 21 หัวข้อ 5 ข้อ 2) */
const BA_P1 = [['วันรับรถเข้าอู่', '1 ก.ย. 2569'], ['วันปิดงาน', '5 ต.ค. 2569'], ['อยู่อู่', '34 วัน'], ['หลังปิดงาน', '16 วัน'],
  ['เลขไมล์ล่าสุด (ตามทะเบียนรถ ไม่ทราบวันที่)', '223,350 กม.'], ['ชั่วโมงเครื่องล่าสุด (ตามทะเบียนรถ ไม่ทราบวันที่)', '13,420 ชม.'], ['ค่าซ่อม 12 เดือนก่อนเข้าอู่', '86,200 บาท · 5 ครั้ง'], ['ค่าซ่อมตั้งแต่ปิดงาน', '12,500 บาท · 1 ครั้ง (ซ่อมในประกัน)'],
  ['เทียบค่าซ่อมก่อน → หลัง', 'ยังไม่ครบช่วงติดตาม · เทียบได้ตั้งแต่ 5 เม.ย. 2570'], ['อายุรถ', '16 ปี (จดทะเบียน 12 มี.ค. 2553)'], ['ราคาที่ได้มา', '2,900,000 บาท'], ['ความคุ้มค่า', 'ยังไม่มีค่า Overhaul (ช่อง E)']];
const BA_T = [['วันรับรถเข้าอู่ → รับรถคืนจริง', '1 ก.ย. 2569 → 5 ต.ค. 2569'], ['หลังรับรถ', '16 วัน'], ['เลขไมล์ ณ รับรถเข้า → รับคืน → ล่าสุด', '221,300 → 221,300 → 223,350 กม.'], ['ใช้ไปแล้วหลังรับรถ', '+2,050 กม. · +110 ชม.'],
  ['ค่าซ่อม 12 เดือนก่อนเข้าอู่ → ตั้งแต่รับรถ', '86,200 บาท (5 ครั้ง) → 12,500 บาท (1 ครั้ง)'], ['เฉลี่ยต่อเดือน ก่อน → หลัง', 'ยังไม่ครบช่วงติดตาม · เทียบได้ตั้งแต่ 5 เม.ย. 2570'],
  ['อายุรถ ณ Overhaul → นับใหม่', '16 ปี → 0.04 ปี จาก 10 ปี (ยังไม่เคาะ Q13)'], ['ราคาที่ได้มา · ราคาซื้อใหม่ปัจจุบัน', '2,900,000 · 8,200,000 บาท'], ['ค่า Overhaul', '980,000 บาท'], ['% ของราคาที่ได้มา · ถูกกว่าซื้อใหม่', '34 % · ถูกกว่าซื้อใหม่ 88 %']];
const VP_COLS_P1 = [['อะไหล่', 0, 'Lead text'], ['จำนวน', 100], ['หน่วย', 100], ['PO / ผู้รับจ้าง', 260], ['เปลี่ยนซ้ำหลัง Overhaul', 200, 'Badge'], ['', 64]];
const VP_COLS_T = [['อะไหล่', 0, 'Lead text'], ['ระบบ', 140, 'Badge'], ['จำนวน', 90], ['หน่วย', 90], ['PO / ผู้รับจ้าง', 220], ['ประกันถึง', 130], ['เปลี่ยนซ้ำหลัง Overhaul', 170, 'Badge'], ['', 64]];
const V_PARTS = [['ซีลไฮดรอลิก', 'MAT-20901', '4', 'ชุด', 'PO-690201 · มิตซูบิชิ ฟูโซ่', '30 ก.ย. 2570', 'เครน/ไฮดรอลิก', ['ซ่อมซ้ำในประกัน 1 ครั้ง', 'Error']],
  ['น้ำมันไฮดรอลิก', 'MAT-20815', '20', 'ลิตร', 'PO-690201 · มิตซูบิชิ ฟูโซ่', '30 ก.ย. 2570', 'เครน/ไฮดรอลิก', ['ยังไม่ซ้ำ', 'Success']],
  ['กรองน้ำมันเครื่อง', 'MAT-10233', '2', 'ชิ้น', 'PO-690201 · มิตซูบิชิ ฟูโซ่', '30 ก.ย. 2570', 'เครื่องยนต์', ['ยังไม่ซ้ำ', 'Success']],
  ['สายไฮดรอลิกบูม', 'ไม่มีรหัส', '2', 'เส้น', 'PO-690201 · มิตซูบิชิ ฟูโซ่', '30 ก.ย. 2570', 'เครน/ไฮดรอลิก', ['ยังไม่ซ้ำ', 'Success']]];
const VR_COLS_P1 = [['วันที่ซ่อม', 150, 'Lead text'], ['อาการ / รายละเอียด', 0], ['อะไหล่ที่เปลี่ยน', 140], ['ชิ้นที่ Overhaul?', 130, 'Badge'], ['ประกันผู้รับจ้าง', 160, 'Badge'], ['ผู้ซ่อม · ค่าซ่อม', 160], ['', 64]];
const VR_COLS_T = [['วันที่ซ่อม', 150, 'Lead text'], ['อาการ / รายละเอียด', 0], ['อะไหล่ที่เปลี่ยน', 140], ['เกี่ยวกับ Overhaul?', 130, 'Badge'], ['ประกันผู้รับจ้าง', 160, 'Badge'], ['ผู้ซ่อม · ค่าซ่อม', 160], ['', 64]];
/* หน้ารายคัน = แท็บ "หลัง Overhaul" ในหน้าประวัติการซ่อมของรถ (เจ้าของงาน 22 ต.ค. 2569: "หน้ารายคัน อยากให้เป็น tab นึงเหมือนหน้าประวัติงานซ่อม … ให้หน้านี้ไปอยู่ใต้ประวัติการซ่อมแทน")
   โครงตามหน้า "RP and MA History" ของ UI Release#2 (5.5 Repair & Maintenance Job): Page header = ทะเบียน · breadcrumb ข้อมูลยานพาหนะ · Tabs ชุดเดียวกับ MA history
   (ข้อมูลยานพาหนะ · ตารางบำรุงรักษา · การนัดหมายซ่อมบำรุง · ประวัติการซ่อมบำรุง) + แท็บใหม่ "หลัง Overhaul" (มีเฉพาะรถที่ปิดงาน Overhaul แล้ว) · Tabs ของไลบรารีมี 5 ช่องพอดี
   แท็บหลัง Overhaul ไม่มีกล่องข้อมูลยานพาหนะ (อยู่แท็บข้อมูลยานพาหนะแล้ว) · แท็บประวัติการซ่อมบำรุงมีป้ายแยกงาน Overhaul / ซ่อมชิ้นที่ Overhaul ในประกัน */
const VEH_TABS = [['ข้อมูลยานพาหนะ', null], ['ตารางบำรุงรักษา', null], ['การนัดหมายซ่อมบำรุง', null], ['ประวัติการซ่อมบำรุง', 7], ['หลัง Overhaul', null]];
const OH_MARK = { oh: ['งาน Overhaul', 'Purple'], same: ['ชิ้นที่ Overhaul · ในประกัน', 'Error'], none: ['—', 'Gray'] };
/* ประวัติการซ่อมบำรุงของ 72-6648 สงขลา — [หมายเลขงาน, วันที่ซ่อมเสร็จ, ศูนย์บริการ, ประเภท, บรรทัดรองประเภท, อาการ, รายละเอียดการซ่อม, ป้าย, ค่าซ่อม] · 5 ใบก่อน Overhaul รวม 86,200 บาท (ตรงกล่องก่อน → หลัง) */
const VEH_HISTORY = [
  ['RP-2569-0533', '18 ต.ค. 2569', 'มิตซูบิชิ ฟูโซ่', 'รถเสีย', 'หลัง Overhaul 13 วัน', 'ไฮดรอลิกกระเช้ารั่ว', 'เปลี่ยนซีลไฮดรอลิกข้อต่อบูม', 'same', '12,500'],
  ['PO-690201', '5 ต.ค. 2569', 'มิตซูบิชิ ฟูโซ่', 'Overhaul', 'แผน 123457', 'ยกเครื่องตามแผน', 'ไฮดรอลิกกระเช้า · เครื่องยนต์ · ช่วงล่าง', 'oh', '—'],
  ['RP-2569-0412', '12 ส.ค. 2569', 'กรย. ภาค 4', 'รถเสีย', '', 'บูมยกไม่ขึ้น', 'ซ่อมปั๊มไฮดรอลิก', 'none', '32,500'],
  ['RP-2569-0288', '3 มิ.ย. 2569', 'อู่ ส.สงขลาการช่าง', 'รถเสีย', '', 'น้ำมันไฮดรอลิกรั่ว', 'เปลี่ยนสายไฮดรอลิก', 'none', '18,900'],
  ['MA-2569-0102', '20 มี.ค. 2569', 'กบค.', 'บำรุงรักษา', 'ตามวาระ ไตรมาส 2', 'ตรวจตามรอบ', 'เปลี่ยนน้ำมันเครื่อง กรอง ตรวจเครน', 'none', '9,800'],
  ['RP-2569-0057', '28 ม.ค. 2569', 'อู่ ส.สงขลาการช่าง', 'รถเสีย', '', 'สตาร์ทติดยาก', 'เปลี่ยนไดสตาร์ท', 'none', '15,000'],
  ['RP-2568-0951', '15 พ.ย. 2568', 'กรย. ภาค 4', 'อุบัติเหตุ', '', 'กระจกข้างแตก', 'เปลี่ยนกระจกข้างซ้าย', 'none', '10,000']];
const VH_COLS = [['หมายเลขงาน', 150, 'Lead text'], ['วันที่ซ่อมเสร็จ', 130], ['ศูนย์บริการ', 170], ['ประเภทการซ่อม', 160], ['อาการ / รายละเอียดการซ่อม', 0], ['เกี่ยวกับ Overhaul', 190, 'Badge'], ['ค่าซ่อม (บาท)', 120], ['', 64]];
async function vehicleShell(name, tab) {
  const { scr, page } = await shell(name, { title: '72-6648 สงขลา', back: true, root: 'ข้อมูลยานพาหนะ', crumbs: ['72-6648 สงขลา'], badge: ['ปกติ', 'Success'],
    actions: tab === 4 ? [['Secondary button', 'ส่งออก PDF'], ['Secondary button', 'เปิดหน้างาน Overhaul', 'keyboard_arrow_right-20-400-round']] : null });
  add(page, await tabs(VEH_TABS, tab), 'h');
  return { scr, page };
}
async function vehicleHistory(name) {   // แท็บประวัติการซ่อมบำรุง: ป้ายแยกงาน Overhaul (ที่ประชุมขอให้หน้าประวัติแยกให้เห็นว่ารายการไหนเป็น Overhaul [5:25])
  const { scr, page } = await vehicleShell(name, 3);
  await dashList(page, { placeholder: 'ค้นหาหมายเลขงาน, อาการ, ชื่ออะไหล่', cols: VH_COLS,
    rows: VEH_HISTORY.map(h => [h[0], h[1], h[2], h[4] ? { text: h[3], sub: h[4] } : h[3], { text: h[5], sub: h[6] }, { pill: OH_MARK[h[7]] }, h[8], { icons: ['quick_reference_all-24-300-round'] }]) });
  return scr;
}
async function vehicleAfter(name, o) {
  o = o || {};
  const { scr, page } = await vehicleShell(name, 4);
  const r = DASH_REPAIRS[0];
  if (o.left) add(page, alertBox(o.left <= 15 ? 'Error' : 'Warning', 'ประกันของผู้รับจ้างเหลือ ' + o.left + ' วัน หมด 30 ก.ย. 2570',
    'สำรวจความสมบูรณ์ของรถ หากพบปัญหาให้นำรถเข้าเก็บงานกับ บริษัท มิตซูบิชิ ฟูโซ่ ทรัค จำกัด ตาม PO-690201 ก่อนหมดประกัน'), 'h');   // ปลายทางแจ้งเตือน S15
  add(page, alertBox('Error', V_INSERT[0], V_INSERT[1]), 'h');   // แทรกรายคัน: ซ่อมชิ้นที่ Overhaul ในประกัน
  const warranty = o.left ? V_WARRANTY.map(([k, v]) => [k, k === 'วันหมดอายุประกัน' ? '30 ก.ย. 2570 (เหลือ ' + o.left + ' วัน)' : k === 'แจ้งเตือนก่อนหมด' ? 'เจ้าของรถ และ กบค. 30 วัน และ 15 วัน' : v]) : V_WARRANTY;
  const sections = [
    col('Section', [await sectionLabel('งาน Overhaul'), kv(V_JOB)], 16),
    col('Section', [await sectionLabel('ประกันของผู้รับจ้าง'), kv(warranty)], 16),
    col('Section', [await sectionLabel(o.target ? 'ก่อน → หลัง Overhaul' : 'ก่อน → หลัง Overhaul (เฟส 1: ข้อมูลที่มี)'), kv(o.target ? BA_T : BA_P1, 2)], 16),
    col('Section', [await sectionLabel('อะไหล่ที่เปลี่ยนตอน Overhaul', { badge: V_PARTS.length }), await tbl(o.target ? VP_COLS_T : VP_COLS_P1,
      V_PARTS.map(p => o.target ? [{ text: p[0], sub: p[1] }, { pill: [p[6], 'Gray'] }, p[2], p[3], p[4], p[5], { pill: p[7] }, { icons: ['quick_reference_all-24-300-round'] }]
        : [p[0], p[2], p[3], p[4], { pill: p[7] }, { icons: ['quick_reference_all-24-300-round'] }]))], 16),
    col('Section', [await sectionLabel('งานซ่อมหลังปิดงาน', { badge: 1 }), await tbl(o.target ? VR_COLS_T : VR_COLS_P1,
      [o.target ? [{ text: r[0], sub: r[1] }, { text: r[4], sub: r[5] }, r[6], { pill: REL[r[8]] }, { pill: WAR.co }, { text: r[10], sub: r[11] + ' บาท' }, { icons: ['quick_reference_all-24-300-round'] }]
        : [{ text: r[0], sub: r[1] }, { text: r[4], sub: r[5] }, r[6], { pill: REL[r[7]] }, { pill: WAR.co }, { text: r[10], sub: r[11] + ' บาท' }, { icons: ['quick_reference_all-24-300-round'] }]])], 16),
  ];
  add(page, col('Content', sections, 32), 'h');
  if (o.target) add(page, alertBox('Info', 'ช่องที่ยังไม่มีในโฟลว์', 'ไมล์/ชั่วโมง ณ รับรถ (D) · รหัส/ระบบอะไหล่ (F) · ค่า Overhaul (E) · ราคาซื้อใหม่ (G) — ไฟล์ 20 หัวข้อ 7 · ประกันของผู้รับจ้างมีแล้วจากปิดงาน'), 'h');
  return scr;
}
const DASH_SCENARIOS = [
  ['DASH แผน · แท็บแผน (หน้า 1 เดิม + Tabs + Metric)', [
    ['แท็บแผน + Metric แผน/รถ/กำลังทำ/ปิดแล้ว', () => planTab('DASH แผน')]]],
  ['DASH รถหลัง Overhaul · แท็บรถหลัง Overhaul (รายคัน V11)', [
    ['เฟส 1 — ประกันผู้รับจ้าง · ซ่อมชิ้นที่ Overhaul รายคัน', () => carsTab('DASH รถ เฟส 1')],
    ['เป้าหมาย — + ใช้งานหลังรับรถ · ยืนยันชิ้นที่ Overhaul ด้วยรหัส (Alert บอกช่องที่ต้องเพิ่ม)', () => carsTab('DASH รถ เป้าหมาย', { target: true })],
    ['ตัวกรอง (ปีงบ · เขต · ประเภทรถ · ยี่ห้อ · อู่ · ช่วงวันปิดงาน · ช่วงติดตาม)', async () => { const s = await carsTab('DASH รถ ตัวกรอง'); await dashFilter(s); return s; }],
    ['ยังไม่มีรถปิดงาน', () => carsTab('DASH รถ ว่าง', { list: { empty: ['ยังไม่มีรถที่ปิดงาน Overhaul', 'เมื่อปิดงานรายคันแล้ว รถจะมาอยู่ที่นี่พร้อมประวัติหลัง Overhaul'] } })],
    ['ค้นหรือกรองไม่เจอ', () => carsTab('DASH รถ ค้นไม่เจอ', { list: { notFound: ['ไม่พบรถหลัง Overhaul', 'ไม่มีรถที่ตรงกับคำค้นหรือตัวกรอง'], query: 'ไม่มีคันนี้' } })]]],
  ['DASH ซ่อมหลัง Overhaul · แท็บซ่อมหลัง Overhaul (รายใบงานซ่อมหลังรับรถ)', [
    ['เฟส 1 — ชิ้นที่ Overhaul (จับชื่อ) · ประกันผู้รับจ้าง', () => repairsTab('DASH ซ่อม เฟส 1')],
    ['เป้าหมาย — เกี่ยวกับ Overhaul? (ยืนยัน) · ประกันผู้รับจ้าง', () => repairsTab('DASH ซ่อม เป้าหมาย', { target: true })]]],
  ['DASH อะไหล่ · แท็บอะไหล่ (รวมข้ามคัน)', [
    ['เฟส 1 — รวมตามชื่อที่กรอก', () => partsTab('DASH อะไหล่ เฟส 1')],
    ['เป้าหมาย — + รหัสวัสดุ · ระบบ · ราคา · เร็วสุดที่พังซ้ำ', () => partsTab('DASH อะไหล่ เป้าหมาย', { target: true })]]],
  ['DASH รายคัน · ประวัติการซ่อมของรถ แท็บหลัง Overhaul (แทนหน้ารายคันแยก)', [
    ['แท็บหลัง Overhaul เฟส 1 — แทรกรายคัน ซ่อมชิ้นที่ Overhaul ในประกัน · ยังไม่ครบช่วงติดตาม', () => vehicleAfter('DASH รายคัน เฟส 1')],
    ['แท็บหลัง Overhaul เป้าหมาย — + ใช้งานหลังรับรถ · ความคุ้มค่า', () => vehicleAfter('DASH รายคัน เป้าหมาย', { target: true })],
    ['แท็บประวัติการซ่อมบำรุง — ป้ายงาน Overhaul · ชิ้นที่ Overhaul ในประกัน', () => vehicleHistory('DASH รายคัน ประวัติการซ่อม')]]],
];
const DASH_GROUPS = DASH_SCENARIOS.map(([title, screens], i) => {
  const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  return { code, title: tag + ' · ' + rest, subs: [{ code, title: rest, tag, screens }] };
});
async function buildDash(o) { await buildSet('overhaul-dash', DASH_SCENARIOS, DASH_GROUPS, 'dashboard', Object.assign({}, o, { devices: devOf(o) })); }

/* ---------- สร้างทั้งหมด ---------- */
/* เจ้าของงานสั่ง 21 ต.ค. 2569: "แยกการ export mobile ออกจาก desktop ทำให้เป็น 2 ปุ่ม" ⇒ desktop → หน้า overhaul-desktop-N · mobile → หน้า overhaul-mobile-N (แต่ละหน้ามีแถวอุปกรณ์เดียว · ผัง R19 เหมือนเดิม)
   build() = ทั้งคู่บนหน้าเดียว (ไม่มีปุ่มแล้ว · harness MODE=build ยังใช้ได้) */
async function build(o) { await buildSet('overhaul', SCENARIOS, GROUPS, 'scenario', o); }
async function buildDesktop(o) { await buildSet('overhaul-desktop', SCENARIOS, GROUPS, 'scenario · desktop', Object.assign({}, o, { devices: [false] })); }   // ปุ่มนี้ระบุอุปกรณ์เอง ไม่ใช้ตัวเลือกบนหน้าต่าง
async function buildMobile(o) { await buildSet('overhaul-mobile', SCENARIOS, GROUPS, 'scenario · mobile', Object.assign({}, o, { devices: [true] })); }
async function buildNoti(o) { await buildSet('overhaul-noti', NOTI_SCENARIOS, NOTI_GROUPS, 'notification', Object.assign({}, o, { devices: devOf(o) })); }
/* สร้างเฉพาะ scenario ที่ติ๊ก (เจ้าของงานสั่ง 21 ต.ค. 2569 "ลอง generate หน้านัดหมายแบบใหม่ออกมา" — ไม่ต้องสร้างทั้ง 14) · รหัสตัวอักษรคงเดิม (A–O) · หน้า overhaul-sel-N หรือต่อท้ายหน้าที่เปิดอยู่ */
async function buildPick(o) {
  o = o || {};
  const idx = (o.pick || []).map(Number).filter(i => i >= 0 && i < SCENARIOS.length);
  if (!idx.length) { log('ยังไม่ได้ติ๊ก scenario — ติ๊กอย่างน้อย 1 รายการแล้วกดอีกครั้ง'); return; }
  const SCEN = SCENARIOS.filter((_, i) => idx.indexOf(i) >= 0), GRP = GROUPS.filter((_, i) => idx.indexOf(i) >= 0);
  await buildSet('overhaul-sel', SCEN, GRP, 'scenario ที่เลือก (' + GRP.map(g => g.code).join(' ') + ')', Object.assign({}, o, { devices: devOf(o) }));
}
async function buildSet(base, SCEN, GRP, what, o) {
  o = o || {};
  const prefix = o.prefix || 'OH2';   // ชื่อเฟรม/ป้าย "<prefix> / …" · หน้า toast แยกใช้ TOAST (เฟรมไม่ใช่ขนาดจอ — กติกา R20)
  errors.length = 0;
  const t0 = Date.now();
  log('นำเข้า component จากไลบรารี…');
  await resolveAll();
  log('นำเข้าเสร็จใน ' + Math.round((Date.now() - t0) / 1000) + ' วินาที · เริ่มสร้างจอ');
  await findStepRef();
  log(deviceSetInfo());
  // หน้าปลายทาง = หน้าใหม่ <base>-N ไม่แตะชุดเดิม (เจ้าของงานสั่ง 20 ต.ค. 2569 — ของเดิมบน overhaul-1 ถูกย้าย/แก้มือไว้)
  const tp = o.here ? { page: figma.currentPage, fresh: false, here: true } : await targetPage(base, prefix);   // here = ติ๊ก "วางต่อท้ายหน้าที่เปิดอยู่" (21 ต.ค. 2569)
  const page = tp.page;
  log(tp.here ? 'วางต่อท้ายหน้าที่เปิดอยู่ "' + page.name + '" (ติ๊กเลือกไว้) — ของเดิมบนหน้านี้ไม่ถูกแตะ' : tp.fresh ? 'วางในหน้าใหม่ "' + page.name + '" — ชุดเดิมบนหน้าอื่นไม่ถูกแตะ' : '⚠ สร้างหน้าใหม่ไม่ได้ (แพลนจำกัดจำนวนหน้า) — วางต่อใต้ของเดิมในหน้า "' + page.name + '" ไม่ลบอะไร');
  await figma.setCurrentPageAsync(page);
  const swept = (tp.fresh || tp.here) ? 0 : sweepOrphans(page, new Set(NEEDED));   // หน้าที่ผู้ใช้เปิดอยู่: ไม่กวาดอะไรทิ้ง if (swept) log('เก็บชิ้นส่วนที่ค้างจากรอบก่อน (ซ้อนอยู่ที่มุมหน้า) ' + swept + ' ชิ้น');
  let y = 0;
  page.children.forEach(n => { if (n.absoluteBoundingBox) y = Math.max(y, n.absoluteBoundingBox.y + n.absoluteBoundingBox.height + 400); });
  /* จัดวางแบบตาราง flow ของทีมออกแบบ (20 ต.ค. 2569): ตัวอักษร = หน้า/ขั้น · ตัวเลข = scenario · x.y = state · แถว Desktop แล้วแถว Mobile ใต้คอลัมน์เดียวกัน
     (เดิม: scenario ละแถว desktop–mobile คู่กัน) · ป้ายใช้ Header/State + Component 1 ของทีมออกแบบ · ไม่ใช้ section */
  const TOTAL = SCEN.reduce((a, x) => a + x[1].length, 0);
  log(INDEX.has('Header') ? 'แถบรหัส flow: component Header ของทีมออกแบบ' : 'แถบรหัส flow: ไม่พบ component Header ในไฟล์ — วาดแถบธรรมดาสีเดียวกันแทน');
  const devices = Array.isArray(o.devices) ? o.devices : devOf(o);   // กันค่าเป็นข้อความ ('desktop'/'mobile'/'both') จากหน้าต่างปลั๊กอิน
  const { made } = await buildGrid(page, prefix, GRP, y, TOTAL * devices.length, { rowMin: o.rowMin, devices });
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

/* อ่านจอที่เลือก (21 ต.ค. 2569 ค่ำ · R23): เจ้าของงานแก้จอบนหน้า Figma เอง (ระยะหัวข้อ · ซ่อน/เปิดช่อง) แต่ข้อความที่ก๊อปจาก Figma ไม่มีระยะและการซ่อนชั้น
   ⇒ ปุ่มนี้พิมพ์โครงของสิ่งที่เลือกเป็นบรรทัดย่อ (ชื่อ · ชนิด · ขนาด · gap/padding ของ auto layout · ตำแหน่งเมื่อไม่มี auto layout · ข้อความ · property ของ instance · ~ = ซ่อน)
   ให้ก๊อป log กลับมา แล้วปรับ script ให้ตรง — ไม่แก้อะไรในไฟล์ */
async function mainInfo(n) {   // "ชุด/variant key=… (ไลบรารี)" ของ instance — ใช้ตอนอ่านจอที่เลือก (เจ้าของงาน publish component ใหม่ 21 ต.ค. 2569 ค่ำ: ต้องรู้ key + โครงใหม่)
  try { const mc = await n.getMainComponentAsync(); if (!mc) return '';
    const set = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
    const cols = n.findAll(x => x.type === 'FRAME' && x.name === 'Column' && x.visible !== false).length;
    return 'component=' + (set ? set.name + ' / ' : '') + mc.name + ' key=' + (set ? set.key : mc.key) + (mc.remote ? ' (ไลบรารี)' : ' (ในไฟล์นี้)') + (cols ? ' · คอลัมน์ ' + cols : '');
  } catch (e) { return 'component=? (' + (e && e.message || e) + ')'; }
}
async function readSelection() {
  const sel = figma.currentPage.selection || [];
  if (!sel.length) { log('ยังไม่ได้เลือกอะไร — คลิกเลือกจอ / ป้าย / ส่วนของจอบนหน้านี้ (เลือกหลายชิ้นได้) แล้วกดอีกครั้ง'); return; }
  const SKIP = { 'Sidebar navigation': 1, 'Header navigation': 1, 'Progress steps': 1 };   // ส่วนเปลือกที่เหมือนกันทุกจอ ไม่ต้องลงลึก
  const MAX = 2500;
  const r = (v) => Math.round(v * 10) / 10;
  const out = [];
  const propsOf = (n) => { const o = []; try { const cp = n.componentProperties || {}; for (const k in cp) { if (cp[k].type === 'INSTANCE_SWAP') continue; const v = cp[k].value; o.push(k.split('#')[0] + '=' + (typeof v === 'string' ? JSON.stringify(v) : v)); } } catch (e) {} return o.join(' '); };
  const walk = (n, d, inInst) => {
    if (out.length > MAX) return;
    const t = n.type, hidden = n.visible === false;
    if (t === 'VECTOR' || t === 'RECTANGLE' || t === 'ELLIPSE' || t === 'LINE' || t === 'BOOLEAN_OPERATION' || t === 'POLYGON' || t === 'STAR') return;
    if (inInst && !hidden && t !== 'TEXT' && t !== 'INSTANCE' && t !== 'FRAME') return;
    if (inInst && !hidden && t === 'INSTANCE' && /-(?:20|24)-\d{3}-round|^_/.test(n.name)) return;   // ไอคอน/ชิ้นภายในของ component ไม่ต้องพิมพ์
    if (inInst > 0 && d - inInst > 3 && !hidden) return;   // ข้างใน instance ลงลึกไม่เกิน 3 ชั้น (พอเห็นข้อความ/ชั้นที่ซ่อน)
    let s = '  '.repeat(d) + (hidden ? '~' : '') + n.name + ' [' + t[0] + ']';
    try { s += ' ' + r(n.width) + '×' + r(n.height); } catch (e) {}
    try { const pl = n.parent && n.parent.layoutMode; if (!pl || pl === 'NONE') s += ' @' + r(n.x) + ',' + r(n.y); } catch (e) {}
    try { if (n.layoutMode && n.layoutMode !== 'NONE') { s += ' ' + n.layoutMode[0] + ' gap' + n.itemSpacing; const p = [n.paddingTop, n.paddingRight, n.paddingBottom, n.paddingLeft]; if (p.some(Boolean)) s += ' pad' + p.join('/'); if (n.layoutWrap === 'WRAP') s += ' wrap'; } } catch (e) {}
    try { if (t === 'TEXT') s += ' "' + String(n.characters).slice(0, 80).replace(/\n/g, '⏎') + '"' + (typeof n.fontSize === 'number' ? ' ' + n.fontSize : ''); } catch (e) {}
    if (t === 'INSTANCE') { const p = propsOf(n); if (p) s += ' {' + p + '}'; }
    out.push(s);
    if (SKIP[n.name]) { out.push('  '.repeat(d + 1) + '…'); return; }
    if (hidden && inInst) return;
    (n.children || []).forEach(c => walk(c, d + 1, inInst || (t === 'INSTANCE' ? d + 1 : 0)));   // inInst = ความลึกที่เริ่มเข้า instance (0 = ยังไม่เข้า)
  };
  for (const n of sel) { out.push('## ' + n.name + ' [' + n.type + '] @' + r(n.x) + ',' + r(n.y) + ' ' + r(n.width) + '×' + r(n.height) + (n.type === 'INSTANCE' ? ' ' + await mainInfo(n) : '')); walk(n, 0, n.type === 'INSTANCE' ? 1 : 0); }
  log('— โครงของที่เลือก ' + sel.length + ' ชิ้น · ' + out.length + ' บรรทัด (~ = ซ่อน · [F]/[I]/[T] = frame/instance/text · V/H gapN padT/R/B/L = auto layout · @x,y = ตำแหน่งเมื่อไม่มี auto layout) — กด "คัดลอก log" แล้ววางกลับมา —');
  for (let i = 0; i < out.length; i += 50) log(out.slice(i, i + 50).join('\n'));
  if (out.length > MAX) log('… ตัดที่ ' + MAX + ' บรรทัด — เลือกทีละจอถ้าต้องการครบ');
}
figma.ui.onmessage = async (msg) => {
  try {
    const o = { here: !!msg.here, devices: msg.devices };
    if (msg.type === 'build') await build(o);
    if (msg.type === 'build-desktop') await buildDesktop(o);
    if (msg.type === 'build-mobile') await buildMobile(o);
    if (msg.type === 'build-noti') await buildNoti(o);
    if (msg.type === 'build-toast') await buildToast(o);
    if (msg.type === 'build-dash') await buildDash(o);
    if (msg.type === 'build-pick') await buildPick(Object.assign(o, { pick: msg.pick }));
    if (msg.type === 'update-selected') await updateSelected({ addNew: msg.addNew !== false });
    if (msg.type === 'patch-texts') await patchTexts();
    if (msg.type === 'read-selection') await readSelection();
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); await tableInfo(); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก"
