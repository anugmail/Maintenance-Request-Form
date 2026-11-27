/* ⚠ ไฟล์นี้ประกอบอัตโนมัติจาก plugin-lib/core.js + safety-inspection-plugin/screens.js ด้วย build-plugin.js — แก้ที่ต้นทางแล้วรัน  node figma-export/build-plugin.js safety-inspection-plugin  (2026-11-27) */

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
  /* 10 พ.ย. 2569 เจ้าของงาน "ตอนออกแบบครั้งต่ออยากให้ใช้ design จาก component กลาง" = หน้า Design Annotations ของไฟล์ (UI) VMS Plus – Release#2
     แถบหัวบล็อก/ป้าย state (Header · Type=Header / Subheader) — key จากดัมป์ design-system/.figma-extract/ui-release2/1-56.json · นำเข้าไม่ได้ (ไฟล์นั้นไม่ได้เปิดเป็นไลบรารี) → หาในไฟล์/instance ตามเดิม */
  "Header": ["cbdb14c4c43c175124ce4c7bb138bb980fc2f4ae", true],
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
  "check-24-300-round": ["8c1bd305deb686415a28e6999512f486d5b3d5b1", false],   // ไอคอนนำปุ่ม "รับทราบ" สีเขียว S13 (10 พ.ย. 2569 · แบบปุ่ม "ตรวจแล้ว" หน้า 5.14 - 5.15 UI Release#2)
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
const SOFT_KEY = new Set(['Header']);   // นำเข้าด้วย key ไม่ได้ไม่ต้องเตือนเรื่องไลบรารี VMS Plus (อยู่คนละไฟล์) — ถอยไปหาในไฟล์ตามเดิม
const ALIAS = {};   // 19 ต.ค.: Sidebar navigation มี key ของไฟล์ component แล้ว ไม่ต้องอ้างชื่อ Sidebar ของ UI Release#2
const INDEX = new Map();     // ชื่อ → COMPONENT_SET / COMPONENT ที่ใช้ได้
const ROUTE = {};            // ชื่อ → ได้มาทางไหน
let IMPORT_ERR = '';
const holderOf = (c) => (c.parent && c.parent.type === 'COMPONENT_SET') ? c.parent : c;
/* ลดการโหลดทุกหน้า (10 พ.ย. 2569 เจ้าของงาน "ทำไมเวลาไฟล์เยอะๆ ถึงกินทรัพยากรของ figma เยอะ" · เลือกข้อ ก.)
   เดิมทุกครั้งที่กดสร้างจะ loadAllPagesAsync + ไล่ component ทั้งไฟล์ และถ้ามีตัวที่ไม่อยู่ในไฟล์ (เช่น Component 1) จะสแกน instance ทั้งไฟล์ทุกรอบ
   ⇒ 1) นำเข้าด้วย key ก่อน ไม่ต้องโหลดหน้าอื่น  2) ตัวที่ไม่มี key (component ยืมจากไฟล์ Maintain-D) เปิดตรงจาก id ที่จำไว้ในไฟล์ (pluginData ของ document)
   3) ยังไม่ได้ และรอบก่อนไม่ได้บันทึกว่าไม่มีในไฟล์ → โหลดทุกหน้าแล้วหาแบบเดิม  4) ตัวที่หาไม่เจอจำไว้ รอบหน้าข้าม (ไม่สแกน instance ทั้งไฟล์ซ้ำ)
   ปุ่ม "เช็ค component" (checkOnly) หาเต็มทุกครั้งแล้วเขียนที่จำไว้ใหม่ — วาง component ลงไฟล์ใหม่ให้กดปุ่มนี้ก่อน */
const COMP_CACHE = 'componentCache';
function readCompCache() { try { const c = JSON.parse(figma.root.getPluginData(COMP_CACHE) || '{}'); return { ids: c.ids || {}, absent: c.absent || [] }; } catch (e) { return { ids: {}, absent: [] }; } }
function writeCompCache(c) { try { figma.root.setPluginData(COMP_CACHE, JSON.stringify(c)); } catch (e) { /* เขียนไม่ได้ก็หาเต็มรอบหน้า */ } }
async function resolveAll(list, checkOnly) {
  list = list || NEEDED;
  const cache = checkOnly ? { ids: {}, absent: [] } : readCompCache();
  let local = null;
  const loadLocal = async () => {   // โหลดทุกหน้า + รายการ component ในไฟล์ — ทำเมื่อจำเป็นเท่านั้น ครั้งเดียวต่อรอบ
    if (local) return local;
    await figma.loadAllPagesAsync();
    local = new Map();
    for (const n of figma.root.findAllWithCriteria({ types: ['COMPONENT_SET', 'COMPONENT'] })) {
      if (n.type === 'COMPONENT' && n.parent && n.parent.type === 'COMPONENT_SET') continue;
      if (!local.has(n.name)) local.set(n.name, n);
    }
    log('โหลดทุกหน้าเพื่อหา component ในไฟล์นี้เอง ' + local.size + ' ตัว');
    return local;
  };
  /* ยืมจาก instance ในไฟล์ = ทางสุดท้าย — สแกนเฉพาะเมื่อมีตัวที่นำเข้าไม่ได้ (เดิมสแกนทุกรอบ: ไฟล์มี instance หลายพันตัว ช้ามาก) */
  const viaInst = new Map();
  let scanned = false;
  const scanInstances = async () => {
    if (scanned) return; scanned = true;
    await loadLocal();
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
  const fromCache = async (x) => {   // id ที่จำไว้ → node · ถูกลบหรือเปลี่ยนชื่อแล้ว = ไม่ใช้
    const c = cache.ids[x]; if (!c || typeof figma.getNodeByIdAsync !== 'function') return null;
    try { const n = await figma.getNodeByIdAsync(c[0]); if (n && !n.removed && (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') && n.name === c[2]) return [n, c[1]]; } catch (e) { /* หาใหม่ */ }
    return null;
  };
  const skipped = [];
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
    if (!got) for (const x of names) { const c = await fromCache(x); if (c) { [got, how] = c; break; } }
    const absent = !got && names.every(x => cache.absent.indexOf(x) >= 0);
    if (absent) skipped.push(name);
    if (!got && !absent) { const L = await loadLocal(); for (const x of names) { if (L.has(x)) { got = L.get(x); how = 'สำเนาในไฟล์นี้ ⚠ ลิงก์วนในไฟล์นี้'; break; } } }
    if (!got && !absent) await scanInstances();
    if (!got && !absent) for (const x of names) { if (viaInst.has(x)) { got = viaInst.get(x); how = 'จาก instance ในไฟล์ ⚠ อาจลิงก์ไปไลบรารีที่เปิดไม่ได้'; break; } }
    if (got && how.indexOf('นำเข้าจากไลบรารี') !== 0) cache.ids[name] = [got.id, how, got.name];
    if (got) cache.absent = cache.absent.filter(x => x !== name);
    else if (!absent && cache.absent.indexOf(name) < 0) cache.absent.push(name);
    if (!got && importErr) how = 'นำเข้าไม่ได้: ' + importErr;
    if (importErr && !IMPORT_ERR && !NESTED_ONLY.has(name) && !SOFT_KEY.has(name)) IMPORT_ERR = importErr;   // ชิ้นส่วนซ้อน (เช่น _Dropdown menu item ที่ Figma ไม่ publish) ไม่ต้องเตือน
    if (got) { INDEX.set(name, got); ROUTE[name] = how + (got.name !== name ? ' (ชื่อ ' + got.name + ')' : ''); }
    else missing.push(name + (how ? ' — ' + how : ''));
  }
  writeCompCache(cache);
  if (!local) log('ไม่ต้องโหลดทุกหน้า — นำเข้าจากไลบรารีด้วย key · ตัวในไฟล์ใช้ตำแหน่งที่จำไว้');
  if (skipped.length) log('ข้าม ' + skipped.length + ' ตัวที่รอบก่อนไม่เจอในไฟล์ (' + skipped.join(', ') + ') — ถ้าเพิ่งวางลงไฟล์ กด "เช็ค component" ก่อน');
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
  if (kind !== 'Tertiary brand button' && kind !== 'Tertiary danger button') variant.Size = o.size || 'md';   // Tertiary brand / Tertiary danger button ไม่มี Size (20 พ.ย. 2569 ส่งกลับแก้ไขที่หัวหน้า S2 S7)
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
  const n = inst('Input dropdown with badges', { State: st, Size: 'md' }, { 'Label text': label, Text: values.length ? '' : o.placeholder || 'เลือก', Optional: !!o.optional, Helper: !!o.error, 'Helper text': o.error || '', 'Info icon': false, 'Leading icon': false });   // o.optional = "(ถ้ามี)" ในแผงตัวกรอง (5 พ.ย. 2569)
  const chips = n.findAll(c => c.type === 'INSTANCE' && c.name === 'Badge outline with remove icon');
  chips.forEach((c, j) => {
    if (j >= values.length) { c.visible = false; return; }
    setProps(c, { Text: values.length > chips.length && j === chips.length - 1 ? '+' + (values.length - j) : values[j] });
  });
  return syncLabel(n, label, !!o.optional);
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
  const put = (b, node) => { if (b && node) setProps(node, { Text: b.text, 'Leading icon': !!b.icon, 'Trailing icon': false, ...(b.icon ? { 'Leading icon swap': icon(b.icon) } : {}), ...(b.disabled ? { State: 'Disabled' } : {}) }); };   // b.disabled = State Disabled ของ Tertiary (brand) button (5 พ.ย. 2569 ปุ่มสร้างแผนเดินทางเมื่อรถครบทุกคัน)
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
      setProps(it, { State: rows[i][0].disabled ? 'Disabled' : rows[i][0].check ? 'Selected' : 'Default' });   // disabled = ติ๊กไม่ได้ (อยู่ไตรมาส/แผนเดินทางอื่น · 5 พ.ย. 2569)
      setProps(it, { Text: rows[i][0].text, Avatar: false, Supporting: !!rows[i][0].sub, 'Supporting text': rows[i][0].sub || '', 'Supporting 2': false });
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
        /* 4 พ.ย. 2569 เจ้าของงาน "ส่วนที่เป็น mobile อยากให้ expand view edit delete icon ออกมาแบบตัวอย่างทั้งหมด"
           ⇒ ช่องเมนู "…" ที่รู้รายการ (menu + items) บนมือถือเปิดปุ่มไอคอนของ Mobile table item Style=Action icons ตามรายการเลย
           (View = ดูรายละเอียด · Edit = แก้ไข · Delete = ลบ · Print ปิด · ไอคอนตั้งต้นของไลบรารีตรงอยู่แล้ว ไม่สลับ) · ไม่มี items = ปุ่ม … ปุ่มเดียวแบบเดิม */
        if (acts[0].menu && acts[0].items) {
          const has = (t) => acts[0].items.some(x => x[0] === t);
          setProps(it, { View: has('ดูรายละเอียด'), Edit: has('แก้ไข'), Print: false, Delete: has('ลบ') });
          return;
        }
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
        setProps(cell, { Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' });
        const cb = find(cell, 'Checkbox'); if (cb) setProps(cb, { Type: v.check ? 'Selected' : 'Unselected', State: v.disabled ? 'Disabled' : 'Default' });
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
    setProps(cell, { Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' });   // { check, text, sub, disabled } — แถวที่ติ๊กไม่ได้ = Checkbox State=Disabled + บรรทัดรองบอกเหตุผล (5 พ.ย. 2569)
    const cb = find(cell, 'Checkbox'); if (cb) setProps(cb, { Type: v.check ? 'Selected' : 'Unselected', State: v.disabled ? 'Disabled' : 'Default' });
  } else if (v && typeof v === 'object' && v.text != null) {   // { text, sub } = 2 บรรทัด ตามแบบ Overhaul
    setProps(cell, { Text: v.text, Supporting: !!v.sub, 'Supporting text': v.sub || '' });
    if (v.tone && v.sub) toneText(find(cell, 'Supporting text'), v.tone);   // บรรทัดรองสีเตือน/แดง แบบ Vehicle list ของ UI Release#2 (S24)
  }
  else setProps(cell, { Text: v == null ? '' : String(v), Supporting: false });
}
/* บรรทัดรองสีตามสถานะ — Vehicle list ของ UI Release#2 ใช้ Supporting text ผูกตัวแปร Color/text/warning (#DC6803) · Color/text/error (#D92D20) ("ใกล้ครบกำหนดบำรุงรักษา" · "ครบกำหนดบำรุงรักษา")
   ใส่ค่าสีทันที แล้ว bindTones() ผูกตัวแปรของไลบรารีหลังประกอบจอ (หาไม่ได้ก็คงค่าสี) */
const TONE_HEX = { warning: '#DC6803', error: '#D92D20' };
let TONED = [];
const TONE_VARS = {};
function toneText(t, tone) {
  if (!t || t.type !== 'TEXT' || !TONE_HEX[tone]) return;
  try { t.fills = [{ type: 'SOLID', color: rgbOf(TONE_HEX[tone]) }]; TONED.push([t, tone]); } catch (e) { warn('สีบรรทัดรอง', e); }
}
async function libVar(re) {   // ตัวแปรสีของไลบรารีตามชื่อ (แบบ surfaceVar)
  try { const l = (await figma.variables.getLocalVariablesAsync('COLOR')).find(v => re.test(v.name)); if (l) return l; } catch (e) { /* ไม่มี API */ }
  try {
    for (const c of await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync()) {
      const v = (await figma.teamLibrary.getVariablesInLibraryCollectionAsync(c.key)).find(x => re.test(x.name));
      if (v) return await figma.variables.importVariableByKeyAsync(v.key);
    }
  } catch (e) { /* ไม่มีสิทธิ์ teamlibrary */ }
  return null;
}
async function bindTones() {
  const list = TONED; TONED = [];
  for (const [t, tone] of list) {
    if (!(tone in TONE_VARS)) TONE_VARS[tone] = await libVar(new RegExp('^Color/text/' + tone + '$', 'i'));
    const v = TONE_VARS[tone]; if (!v) continue;
    try { t.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: rgbOf(TONE_HEX[tone]) }, 'color', v)]; } catch (e) { /* คงค่าสี */ }
  }
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
  const crumbs = [o.root || PLUGIN.menu].concat(o.crumbs || []);   // o.root = เมนูอื่นของระบบ (เช่น ยานพาหนะ ของ Vehicle Management · S24 4 พ.ย. 2569)
  for (const [i, n] of ['Link 1', 'Link 2', 'Link 3'].entries()) {
    const l = find(ph, n); if (!l) continue;
    if (i < crumbs.length - 1) { const lk = find(l, 'Link'); if (lk) await text(l, lk, crumbs[i]); } else l.visible = false;
  }
  const tr = find(ph, 'Truncate link'); if (tr) tr.visible = false;
  const cur = find(ph, 'Current link'); if (cur) await text(cur, 'Link', crumbs[crumbs.length - 1]);
  if (crumbs.length === 1) { /* หน้าแรกของเมนู: ลิงก์ปัจจุบันคือชื่อเมนูเอง */ }
  if (o.badge) { const b = find(ph, 'Badge outline'); if (b) setProps(b, { Color: BADGE_OF[o.badge[1]] || 'Gray', Text: o.badge[0] }); }
  const acts = find(ph, 'Actions');
  if (acts && !o.primary) acts.visible = false;   // ตรงกับ property Actions=false (5 พ.ย. 2569 ตัวตรวจ R56 ดูการมองเห็นของชั้น)
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
  /* toast ขวาบนเสมอ ไม่อยู่ตรงกลาง (เจ้าของงาน 5 พ.ย. 2569 "toast จะขึ้นที่มุมขวาบน เสมอ ไม่อยู่ตรงกลาง" · รีวิวทีมออกแบบ S2 "แสดง Toast ด้านบนขวา")
     Desktop: variant ของ Notification จัดการ์ดบนขวาในตัว (justify MIN · pt 24 · pr 24) แบบที่ Flow การซ่อมวาง "อนุมัติรายการสำเร็จ" ⇒ วาง instance ชิดขอบบนขวา
     Mobile: variant จัดการ์ดล่างกลาง (justify MAX · align CENTER · pb 16) ⇒ override การจัดวาง auto layout ของ instance เป็นบนขวา ขอบ 16 แล้ววางชิดขอบบนขวา (การ์ดเป็นของไลบรารีเหมือนเดิม) */
  if (MOB) { try { n.primaryAxisAlignItems = 'MIN'; n.counterAxisAlignItems = 'MAX'; n.paddingTop = 16; n.paddingBottom = 0; } catch (e) { warn('toast มือถือขวาบน', e); } }
  overlay(scr, n, VW() - n.width, 0);
}
/* bottom sheet ประกอบจากชิ้นไลบรารี (Bottom sheet ของไลบรารีล็อกเนื้อหาตายตัว) — แบบเดียวกับที่ UI Release#2 ประกอบแผงตัวกรอง */
/* แผงตัวกรองด้านข้าง — ตาม Filter ของ Vehicle list (UI Release#2): Background overlay + Side panel header "ตัวกรอง" + dropdown + Side panel footer
   (ประกอบจากชิ้นไลบรารีแบบ filterPanelCF ของ Overhaul · component-rules §7) · มือถือ = bottom sheet */
async function filterPanel(scr, content, o) {
  o = o || {};
  if (MOB) { await sheet(scr, { title: 'ตัวกรอง', action: 'ล้างตัวกรอง', content, ok: 'ตกลง' }); return; }
  overlay(scr, inst('Background overlay'), 0, 0).resize(1440, Math.max(1024, scr.height));
  const panel = frame('Panel', 'VERTICAL', { gap: 24, fill: WHITE });
  overlay(scr, panel, 960, 0); panel.primaryAxisSizingMode = 'FIXED'; panel.counterAxisSizingMode = 'FIXED'; panel.resize(480, 1024);
  const hd = inst('Side panel header'); add(panel, hd, 'h'); hide(hd, 'Tabs');
  await text(hd, 'Text', 'ตัวกรอง'); await text(hd, 'Supporting text', 'กรองข้อมูลให้แสดงเฉพาะข้อมูลที่ต้องการ');
  const body = frame('Content', 'VERTICAL', { gap: 24, pad: [0, 24] }); add(panel, body, 'both');
  for (const n of content) add(body, n, 'h');
  const ft = inst('Side panel footer'); add(panel, ft, 'h');
  [['Tertiary brand button', 'ล้างตัวกรอง'], ['Secondary button', 'ยกเลิก'], ['Primary button', 'ตกลง']].forEach(([k, t]) => { const b = find(ft, k); if (b) setProps(b, { Text: t, 'Leading icon': false, 'Trailing icon': false }); });
  return panel;
}
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
  if (MOB) { await sheet(scr, { title: o.title, content: [].concat(...o.fields.map(f => f.pair || [f])).map(f => f.area ? area(f.label, f.value, { placeholder: f.placeholder, error: f.error }) : field(f.label, f.value, { optional: f.optional })), ok: o.ok || 'บันทึก', cancel: o.cancel, danger: o.danger }); return; }
  const m = inst('Modal', { Type: 'Form', Size: 'md' });
  overlay(scr, m, 0, 0);
  modalHead(find(m, 'Modal header'), o.title, o.sub, { 'Back icon': false, 'Featured icon': false });
  const rows = (find(m, 'Form') || m).children.filter(c => c.name === 'Card form row');
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (i >= o.fields.length) { r.visible = false; continue; }
    /* f.pair = [ช่องซ้าย, ช่องขวา] ใช้ Input 2 ของ Card form row (5 พ.ย. 2569 popup ระบุอะไหล่เพิ่มเติม 6 ช่อง: ชื่อ · ยี่ห้อ / รุ่น · รหัส / จำนวน · หน่วย) */
    if (o.fields[i].pair) {
      setProps(r, { 'Input 2': true });
      const ins = r.children.filter(c => c.type === 'INSTANCE');
      if (ins[1]) ins[1].visible = true;
      for (const [k, pf] of o.fields[i].pair.entries()) { const inp = ins[k]; if (!inp) continue;
        setProps(inp, { State: pf.value ? 'Filled' : 'Default' });
        setProps(inp, { 'Label text': pf.label, Text: pf.value || pf.placeholder || '', Optional: !!pf.optional, Helper: false, 'Info icon': false, 'Show Placeholder': !pf.value });
        syncLabel(inp, pf.label, pf.optional);
        const ct = find(inp, 'Container'), tv = ct && ct.findOne(n => n.type === 'TEXT' && n.visible !== false);
        if (tv && (pf.value || pf.placeholder) && tv.characters !== (pf.value || pf.placeholder)) await text(ct, tv, pf.value || pf.placeholder); }
      continue;
    }
    const f = o.fields[i];
    setProps(r, { 'Input 2': false });
    if (f.area) setProps(r, { 'Input 1 swap': main('Text area', { State: 'Filled', Size: 'md' }).id });
    const inp = r.children.find(c => c.type === 'INSTANCE' && c.visible !== false);
    if (inp) setProps(inp, { State: f.value ? 'Filled' : 'Default' });
    if (inp) setProps(inp, { 'Label text': f.label, Text: f.value || f.placeholder || '', Optional: !!f.optional, Helper: !!f.error, 'Info icon': false, 'Show Placeholder': !f.value });
    if (inp && f.error) setProps(inp, { State: 'Error', 'Helper text': f.error });   // 20 พ.ย. 2569 popup ส่งกลับแก้ไข (S2 S7) เหตุผลบังคับ · error แบบ area()
    if (inp) syncLabel(inp, f.label, f.optional);   // ป้ายที่เห็นคือ Input label ที่ซ้อน (ตาม Overhaul) — เดิมไม่ตั้ง ป้ายเลยค้าง "ผู้ใช้ยานพาหนะ" ของไลบรารี
    const ct = inp && !f.area && find(inp, 'Container'), tv = ct && ct.findOne(n => n.type === 'TEXT' && n.visible !== false);
    if (tv && f.value && tv.characters !== f.value) await text(ct, tv, f.value);   // 3 พ.ย. 2569 ไฟล์จริงช่องขึ้นว่าง — ค่าที่เห็นไม่ตรง property ก็ใส่ที่ข้อความโดยตรง
  }
  /* ปุ่มของ Modal Type=Form อยู่ใน Modal footer > Actions > "Primary and secondary actions" (ไม่ใช่ลูกของ Actions ตรงๆ) — เดิมกรองแค่ parent = Actions ปุ่มหลักเลยค้างคำของไลบรารี
     (ชีตลูกค้า 5 พ.ย. 2569: popup ตีกลับขึ้น "บันทึก" แทน "ตีกลับ" · popup ระบุอะไหล่เพิ่มเติมขึ้น "บันทึก" แทน "เพิ่ม") */
  const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && (n.parent.name === 'Actions' || n.parent.name === 'Primary and secondary actions'));
  ft.forEach(b => {
    if (b.name === 'Primary button' && o.danger) { try { b.swapComponent(main('Primary danger button', { State: 'Default', Size: 'lg' })); b.name = 'Primary danger button'; } catch (e) { warn('ปุ่มหลักสีแดงของ popup ฟอร์ม', e); } }   // 20 พ.ย. 2569 o.danger = ปุ่มหลัก Primary danger (ส่งกลับแก้ไข แบบหน้าอนุมัติปิดงานของ Overhaul)
    if (b.name === 'Primary button' || b.name === 'Primary danger button') setProps(b, { Text: o.ok || 'บันทึก', 'Leading icon': false, 'Trailing icon': false });
    else if (b.name === 'Secondary button') setProps(b, { Text: o.cancel || 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false });
    else b.visible = false;
  });
}
/* 4 พ.ย. 2569 เจ้าของงาน "จังหวะที่เป็น dropdown ต้องชิดกับจุดที่เลือก" — วางรายการตอนสร้างจอ แล้ว stripDividers/polish ทำให้ของเหนือช่องเตี้ยลง ช่องเลื่อนขึ้นแต่รายการค้างที่เดิม
   ⇒ จำวิธีวางไว้ (PINS) แล้ววางซ้ำอีกรอบหลังจอเสร็จ (repin ใน buildGrid) รายการจึงอยู่ใต้ช่อง 4 px / เมนูชิดปุ่ม "…" ตามตำแหน่งสุดท้ายของช่อง */
let PINS = [];
function pin(place) { place(); PINS.push(place); }
function repin() { const p = PINS; PINS = []; for (const f of p) { try { f(); } catch (e) { /* ช่องถูกลบไปแล้ว */ } } }
let MENU_SHEET = false;
/* ช่องของ Dropdown menu: 3 รายการ = 0 1 (เส้นคั่น) 4 แบบเดิม · 4 รายการ = 0 1 2 (เส้นคั่น) 4 — รายการสุดท้าย (ลบ) อยู่ใต้เส้นคั่นเสมอ (12 พ.ย. 2569 เมนูยานพาหนะของฟอร์มแผนเพิ่ม ย้ายไปไตรมาสอื่น) */
const slotsOf = (items) => items.length > 3 ? { 0: items[0], 1: items[1], 2: items[2], 3: 'divider', 4: items[3] } : { 0: items[0], 1: items[1], 3: 'divider', 4: items[2] };
function menuAt(scr, anchor, items) {   // Dropdown menu ใต้ปุ่ม "…" · mobile = ไม่เปิดเมนู เพราะการ์ดมือถือแสดงไอคอนดู แก้ไข ลบ ครบแล้ว (4 พ.ย. 2569) · ตั้ง MENU_SHEET = true ถ้าจะกลับไปใช้ bottom sheet
  if (MOB && !MENU_SHEET) return null;
  if (MOB) {
    overlay(scr, inst('Background overlay'), 0, 0).resize(VW(), VH());
    const sh = frame('Sheet', 'VERTICAL', { fill: WHITE, pad: [0, 0] }); sh.topLeftRadius = sh.topRightRadius = 24;
    overlay(scr, sh, 0, 0); sh.counterAxisSizingMode = 'FIXED'; sh.resize(VW(), sh.height);
    const hd = inst('Bottom sheet header'); add(sh, hd, 'h'); const ta = find(hd, 'Text and action'); if (ta) ta.visible = false; const dv = find(hd, 'Divider'); if (dv) dv.visible = false;
    const m = inst('Dropdown menu'); add(sh, m, 'h'); hide(m, '_Dropdown menu header');
    const list = (find(m, 'Menu items') || m).children; const want = slotsOf(items);
    list.forEach((it, i) => { const w = want[i]; if (!w) { it.visible = false; return; } if (w !== 'divider') setProps(it, { Text: w[0], Shortcut: false, Icon: true, 'Icon swap': icon(w[1]) }); });
    m.strokes = []; sh.y = VH() - sh.height;
    return m;
  }
  const m = inst('Dropdown menu');
  hide(m, '_Dropdown menu header');
  const list = (find(m, 'Menu items') || m).children;
  const want = slotsOf(items);
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
  const sc = find(l, 'Vertical scrollbar'); if (sc) sc.visible = items.length > rows.length;   // รายการเกินแถวของไลบรารี (5) = คง scrollbar ไว้ (5 พ.ย. 2569 เขตของหลายภาค)
  overlay(scr, l, 0, 0);
  if (anchor) pin(() => { const sb = scr.absoluteBoundingBox, ab = anchor.absoluteBoundingBox; l.resize(ab.width, l.height); l.x = ab.x - sb.x; l.y = ab.y - sb.y + ab.height + 4; });
}

/* ---------- แถบค้นหา + แบ่งหน้า (ตาม Table header / Table pagination ของไลบรารี) ---------- */
/* o.title + o.badge = หัวตาราง "ชื่อ" + Badge outline (เช่น "ยานพาหนะ" "5 คัน" ของ Vehicle list ใน UI Release#2) · o.filterCount = Pill บนปุ่มตัวกรอง (ช่องแรกของ Actions มี Pill outline ในตัว)
   o.more = [{ text, disabled }] ปุ่ม Secondary ช่องถัดไป (เช่น "จัดลงไตรมาส" แบบปุ่ม "รายงาน" ของ Export reports - Select vehicles · ช่องนี้ใน Table header ของไฟล์ Component ไม่มี Pill ⇒ จำนวนต่อท้ายข้อความ) — 5 พ.ย. 2569 */
async function tableHeader(o) {
  const th = inst('Table header', { Breakpoint: BP() }, { 'Table title': !!o.title, Badge: o.badge != null, 'Supporting text': false, 'More actions': false, Filters: !!(o.chips && o.chips.length) });
  if (o.title) { setProps(th, { Title: o.title }); const tt = find(th, 'Front Section'); const tx = tt && tt.findOne(n => n.type === 'TEXT'); if (tx) await text(tt, tx, o.title); }
  if (o.badge != null) { const b = find(th, 'Badge outline'); if (b) setProps(b, { Text: String(o.badge) }); }
  const ti = find(th, 'Text input');
  if (ti) setProps(ti, { Label: false, Helper: false, 'Trailing icon': false, Text: o.query || o.placeholder || PLUGIN.searchHint, State: o.query ? 'Filled' : 'Default' });
  const acts = find(th, 'Actions'), more = (o.more || []).slice();
  if (o.addLast && o.add) more.push({ text: o.add, icon: 'add-24-300-round', disabled: !!o.addDisabled });   // 20 พ.ย. 2569 o.addLast = ปุ่มเพิ่มอยู่ท้ายปุ่มรอง (ลำดับแบบเว็บ PlanForm: กำหนดอะไหล่ → ย้าย/จัดเข้าไตรมาส → เพิ่มยานพาหนะ)
  const addFirst = o.addLast ? null : o.add;
  if (acts) { let first = true; for (const b of acts.children) {
    if (b.name === 'Secondary button' && first && o.addLast) { first = false; const m = more.shift(); const p = find(b, 'Pill outline'); if (p) p.visible = false;
      if (m) setProps(b, { Text: m.text, 'Leading icon': !!m.icon, 'Trailing icon': false, State: m.disabled ? 'Disabled' : 'Default' }), m.icon && setProps(b, { 'Leading icon swap': icon(m.icon) }); else b.visible = false; }
    else if (b.name === 'Secondary button' && first && addFirst) { first = false; setProps(b, { Text: o.add, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') }); const p = find(b, 'Pill outline'); if (p) p.visible = false; }   // o.add = ปุ่มเพิ่มแทนตัวกรอง (ฟอร์มแผนแท็บไตรมาส 12 พ.ย. 2569)
    else if (b.name === 'Secondary button' && first && o.noFilter) { first = false; b.visible = false; }
    else if (b.name === 'Secondary button' && first) { first = false; setProps(b, { Text: 'ตัวกรอง', 'Leading icon': true, 'Leading icon swap': icon('filter_list-24-400-round') }); const p = find(b, 'Pill outline'); if (p) { if (o.filterCount) setProps(p, { Text: String(o.filterCount) }); else p.visible = false; } }
    else if (b.name === 'Secondary button' && more.length) { const m = more.shift(); b.visible = true; setProps(b, { Text: m.text, 'Leading icon': !!m.icon, 'Trailing icon': false, State: m.disabled ? 'Disabled' : 'Default' }); if (m.icon) setProps(b, { 'Leading icon swap': icon(m.icon) }); }
    else if (o.primary && b.name === 'Primary button') setProps(b, { Text: o.primary, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') });
    else if (o.primary && MOB && b.name === 'Secondary button' && !acts.children.some(x => x.name === 'Primary button')) {   // Table header Mobile มีแค่ Secondary 2 ช่อง ⇒ สลับช่องที่ 2 เป็น Primary แบบ Request list ของ 5.10 Vehicle In Use (EV) · UI Release#2
      try { b.swapComponent(main('Primary button', { State: 'Default', Size: 'lg' })); b.name = 'Primary button'; setProps(b, { Text: o.primary, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') }); } catch (e) { warn('ปุ่มหลักใน Table header มือถือ', e); }
    }
    else b.visible = false; } }   // o.primary = ปุ่มหลักขวาของ "ตัวกรอง" (5 พ.ย. 2569 รีวิวทีมออกแบบ · ตาม Incident list ของ 5.5 Repair & Maintenance Job (Admin) ใน UI Release#2)
  th.findAll(n => n.name === 'Badge outline with remove icon').forEach((c, i) => { if (o.chips && i < o.chips.length) setProps(c, { Text: o.chips[i] }); else c.visible = false; });
  return th;
}
async function pagination(n) { return fillPagination(inst('Table pagination', { Breakpoint: BP() }), n); }
async function fillPagination(pg, n) {   // n = จำนวนแถว · { shown, total } = แถวมากกว่าที่ Table แสดงได้ (10 แถว) แสดงหน้าแรก (4 พ.ย. 2569)
  const shown = typeof n === 'object' ? n.shown : n, total = typeof n === 'object' ? n.total : n;
  const tx = find(pg, 'Text'); if (tx && tx.type === 'TEXT') await text(pg, tx, 'แสดง 1 ถึง ' + shown + ' จาก ' + total + ' รายการ');
  const items = pg.findAll(x => x.name === 'Button groups pagination item');
  const pages = Math.max(1, Math.ceil(total / Math.max(1, shown)));
  items.forEach((it, i) => { if (i === 0 || (i === items.length - 1 && pages === 1)) setProps(it, { State: 'Disabled' }); else if (i === items.length - 1) { /* ไปหน้าถัดไปได้ */ } else if (i >= 1 && i <= pages) setProps(it, { Number: String(i) }); else it.visible = false; });
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
/* ระยะในกริดบล็อก — เจ้าของงาน 10 พ.ย. 2569: "ปรับ spacing ของแต่ละหน้าจอและหัวข้อให้เป็น 200 เสมอ"
   gap = แถบหัวข้อ → จอ (และระยะเริ่มคอลัมน์จากคอลัมน์ป้าย Device) · colGap = จอ → จอ · rowGap = แถว desktop → แถว mobile
   ทั้งสามเป็น 200 เท่ากันหมด · groupGap คง 400 ไว้ให้บล็อก scenario ยังแยกจากกันชัด (เดิม gap 80 · rowGap 160) */
const GRID = { side: 300, gap: 200, colW: 1440, colGap: 200, rowGap: 200, groupGap: 400, barH: 120, stateW: 344, mobW: 402, deskH: 1024, mobH: 874 };
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
async function flowBar(prefix, code, title, state, width, desc) {
  let bar = null;
  if (INDEX.has('Header') && !HEADER_BROKEN) {
    bar = inst('Header', { Type: 'Subheader' });
    const st = find(bar, 'State');
    if (st) setProps(st, { State: state });
    // Flow เป็น property ข้อความที่ผูกฟอนต์ของ component (LINE Seed Sans) — ตั้งตัวอักษรตรงๆ ผ่าน text() ที่สลับฟอนต์สำรองให้เมื่อเครื่องไม่มี
    const okCode = st ? await text(st, 'Text', code) : false;
    const det = find(bar, 'Detail'); const ts = det ? det.children.filter(c => c.type === 'TEXT') : [];
    const okTitle = ts[0] ? await text(det, ts[0], title) : false;
    /* บรรทัดที่ 2 = เงื่อนไขของ state (แบบตัวอย่าง "เงื่อนไขการแสดงผล …" ใน Design Annotations · 10 พ.ย. 2569) — ไม่มีก็ซ่อน */
    if (ts[1]) { if (desc && await text(det, ts[1], desc)) { try { ts[1].layoutSizingHorizontal = 'FILL'; ts[1].textAutoResize = 'HEIGHT'; } catch (e) { /* ปล่อยกว้างตาม component */ } } else ts[1].visible = false; }
    if (!(okCode && okTitle)) {   // ใส่ข้อความไม่ได้ (ฟอนต์/โครง) → ป้ายจะไม่ตรง scenario ⇒ ถอยไปแถบธรรมดาทั้งชุด
      try { bar.remove(); } catch (e) { /* ลบไม่ได้ ปล่อย */ }
      bar = null; HEADER_BROKEN = true;
      log('⚠ แถบ Header ของทีมออกแบบใส่ข้อความไม่ได้ (ฟอนต์ของ component ไม่มีในเครื่อง) — ใช้แถบธรรมดาสีเดียวกันแทนทั้งชุด');
    } else {
      try { bar.resize(width, bar.height); } catch (e) { warn('ปรับกว้างแถบ ' + code, e); }
      /* ชื่อยาวไม่ล้นไปทับคอลัมน์ข้าง (เจ้าของงาน 10 พ.ย. 2569 ส่งภาพ V.4.1 ทับ V.4.2 "ปรับกล่องให้เหมาะสมกับคำ"):
         ข้อความกว้างเต็ม Detail แล้วขึ้นบรรทัดใหม่ · แถบสูงตามข้อความ (กว้างคงเท่าจอ) · กล่องรหัสยืดสูงตาม */
      try { ts[0].layoutSizingHorizontal = 'FILL'; ts[0].textAutoResize = 'HEIGHT'; bar.counterAxisSizingMode = 'AUTO'; if (st) st.layoutSizingVertical = 'FILL'; } catch (e) { warn('ตัดบรรทัดแถบ ' + code, e); }
    }
  }
  if (!bar) {   // แถบธรรมดา: กว้างคงที่ สูงตามข้อความ (อย่างน้อย GRID.barH) · ชื่อยาวขึ้นบรรทัดใหม่ไม่ล้นคอลัมน์ (10 พ.ย. 2569)
    bar = fixed(frame('Header', 'HORIZONTAL'), width, GRID.barH);
    bar.counterAxisSizingMode = 'AUTO'; bar.minHeight = GRID.barH;
    const st = fixed(frame('State', 'HORIZONTAL', { fill: rgbOf(BAR_FILL[state] || BAR_FILL.Default), pad: [0, 40] }), GRID.stateW, GRID.barH);
    st.primaryAxisAlignItems = 'CENTER'; st.counterAxisAlignItems = 'CENTER'; st.appendChild(await labelText(code, 64, '#FFFFFF')); bar.appendChild(st); st.layoutSizingVertical = 'FILL';
    const det = frame('Detail', 'HORIZONTAL', { fill: WHITE, pad: [24, 40] }); det.counterAxisAlignItems = 'CENTER'; bar.appendChild(det); det.layoutGrow = 1;
    const tt = await labelText(title + (desc ? ' — ' + desc : ''), 48, '#101828'); det.appendChild(tt); tt.layoutSizingHorizontal = 'FILL'; tt.textAutoResize = 'HEIGHT';
  }
  bar.name = prefix + ' · ' + code + ' ' + title + (desc ? ' — ' + desc : '');
  return bar;
}
/* สีป้าย state ตามหน้าจริงของ UI Release#2 (10 พ.ย. 2569): ปกติ Sub Flow (เทา) · ผลสำเร็จ (A - S1 …) Success (เขียว) · ผิดพลาด (A3.1 - F …) Failed (แดง)
   ของเรา: ชื่อจอมี "สำเร็จ" = Success · "Validation" หรือ "ไม่สำเร็จ" = Failed · ที่เหลือ Sub Flow */
const stateTone = (label) => /ไม่สำเร็จ|Validation/.test(label) ? 'Failed' : /สำเร็จ/.test(label) ? 'Success' : 'Sub Flow';
/* หัวหน้า (10 พ.ย. 2569 เจ้าของงาน "ใช้ design จาก component กลาง" — หน้า Design Annotations ของ UI Release#2 · ไฟล์ Backup):
   Header Type=Header = ชื่อใหญ่ + บรรทัดอธิบาย + Header / Status · หน้าจริงของไฟล์ (5.1–5.17) ใช้ "1 ตัวต่อหน้า" เป็นชื่อขอบเขตงาน สถานะ Ready for Review / Work In Progress
   บรรทัดอธิบายซ่อน · บล็อกตัวอักษรไม่ใช้ตัวนี้ (ใช้ Subheader State=Default) · ใช้กับหัวหน้าของชุดจอ และแถบ Journey
   component ไม่มี variant Type=Header (ชุดเก่าในไฟล์) หรือใส่ข้อความไม่ได้ → แถบ Subheader แบบเดิม */
async function blockHeader(prefix, code, title, width, desc, status) {
  const set = INDEX.get('Header');
  const top = !HEADER_BROKEN && set && set.type === 'COMPONENT_SET' && set.children.some(c => c.variantProperties && c.variantProperties.Type === 'Header');
  if (!top) return flowBar(prefix, code, title, 'Default', width);
  const bar = inst('Header', { Type: 'Header' });
  const ts = bar.children.filter(c => c.type === 'TEXT');
  if (!(ts[0] && await text(bar, ts[0], code === 'Page' ? title : code + ' · ' + title))) {
    try { bar.remove(); } catch (e) { /* ลบไม่ได้ ปล่อย */ }
    log('⚠ แถบหัวบล็อก (Header Type=Header) ใส่ข้อความไม่ได้ — ใช้แถบ Subheader แทน');
    return flowBar(prefix, code, title, 'Default', width);
  }
  if (ts[1]) { if (desc && await text(bar, ts[1], desc)) { try { ts[1].textAutoResize = 'HEIGHT'; } catch (e) { /* ปล่อย */ } } else ts[1].visible = false; }
  const hs = find(bar, 'Header / Status');   // ค่าที่หน้าจริงใช้: Work In Progress (ค่าตั้งต้นของ component) · Ready for Review
  if (hs && !status) hs.visible = false;   // ไม่ส่งสถานะ = ซ่อนป้าย (เจ้าของงาน 10 พ.ย. 2569 "แถบ Journey เอาป้าย Work In Progress ออกด้วย")
  else if (hs && Object.keys(hs.componentProperties || {}).some(k => k.split('#')[0] === 'Property 1')) setProps(hs, { 'Property 1': status });
  else if (hs && status !== 'Work In Progress') warn('Header / Status', 'เปลี่ยนเป็น ' + status + ' ไม่ได้ (component ไม่เปิด property)');
  try { bar.resize(width, bar.height); } catch (e) { warn('ปรับกว้างแถบหัวบล็อก ' + code, e); }
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
/* ภาพประกอบ Empty state ที่ UI Release#2 เปลี่ยนจากภาพตั้งต้น (5 พ.ย. 2569 เจ้าของงาน "empty s1 ของรถ ใช้ ui นี้") —
   ใส่ IMAGE fill ทับสี่เหลี่ยมใน Graphic ของ instance แบบเดียวกับ Contract vehicle list - Empty (1-54) · ภาพฝังตอน build (build.json "images") */
async function emptyGraphic(es, key) {
  const png = typeof IMAGES !== 'undefined' && IMAGES && IMAGES[key];
  const g = find(es, 'Graphic'), r = g && g.findOne && g.findOne(n => n.type === 'RECTANGLE');
  if (!png || !r) { warn('ภาพ Empty state ' + key, new Error(png ? 'ไม่เจอสี่เหลี่ยมใน Graphic' : 'ไม่มีภาพใน build.json images')); return es; }
  r.fills = [{ type: 'IMAGE', imageHash: figma.createImage(figma.base64Decode(png)).hash, scaleMode: 'FILL' }];
  return es;
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

/* ---------- user journey swimlane ตามผู้เกี่ยวข้อง (เจ้าของงานสั่ง 4 พ.ย. 2569 "อยากให้ทำ user journey ยาวๆ เป็น swimlane ที่มี stakeholder ด้วย") ----------
   ข้อมูลฝังตอน build (const SWIMLANE · plugin-lib/swimlane-layout.js อ่าน Diagram/…-swimlane.md) — ปลั๊กอินแค่วาดตามตำแหน่ง
   1 แถว = 1 ผู้เกี่ยวข้อง (ชื่อซ้ายสุด) · แถบช่วงงานด้านบน · "อยากได้เป็นสี่เหลี่ยม และทางแยกเป็นข้าวหลามตัด" ⇒ ขั้นงาน = สี่เหลี่ยมเขียว · ทางแยก = ข้าวหลามตัดม่วง (สีชุดผัง userflow)
   เส้นทึบ = ไปขั้นถัดไป · เส้นประเทา = ย้อนกลับไปทำซ้ำ · เป็นของวาดประกอบนอกเฟรมจอ (shape + vector) เหมือนผัง userflow */
async function swimlaneBoard(prefix, sw) {
  CREATED = [];
  const f = figma.createFrame(); CREATED.push(f);
  f.name = prefix + ' · user journey swimlane';
  f.resize(sw.w, sw.h); f.fills = [{ type: 'SOLID', color: WHITE }];
  f.strokes = [{ type: 'SOLID', color: rgbOf('#D0D5DD') }]; f.strokeWeight = 2; f.cornerRadius = 24; f.clipsContent = false;
  const put = (node, x, y) => { f.appendChild(node); node.x = x; node.y = y; return node; };
  const rect = (name, x, y, w, h, hex, stroke) => {
    const r = figma.createRectangle(); CREATED.push(r); r.name = name; r.resize(w, h);
    r.fills = hex ? [{ type: 'SOLID', color: rgbOf(hex) }] : [];
    if (stroke) { r.strokes = [{ type: 'SOLID', color: rgbOf(stroke) }]; r.strokeWeight = 1; }
    return put(r, x, y);
  };
  put(await docText(sw.title, 56, '#101828'), 64, 48);
  put(await docText('สี่เหลี่ยม = ขั้นงาน (วงเล็บ = scenario · ภาพ = จอจริงบนหน้านี้ · ป้ายเทา = รหัสจอ) · ข้าวหลามตัด = ทางแยก · เส้นประเทา = ย้อนกลับไปทำซ้ำ · ต้นฉบับ ' + sw.src, 24, '#475467', null, true), 64, 128);
  for (const l of sw.lanes) {   // แถวผู้เกี่ยวข้อง: พื้นสลับสี + ช่องชื่อซ้าย
    rect('lane · ' + l.label, 0, l.y, sw.w, l.h, l.i % 2 ? '#F9FAFB' : '#FFFFFF', '#EAECF0');
    rect('ชื่อ lane · ' + l.label, 0, l.y, sw.headW, l.h, '#F2F4F7', '#EAECF0');
    const t = put(await docText(l.label, 28, '#101828', sw.headW - 48), 24, 0); t.name = 'ชื่อ ' + l.label;
    t.y = l.y + (l.h - t.height) / 2;
  }
  for (const b of sw.bands) {   // แถบช่วงงาน (สีหัวการ์ด story map)
    const r = rect('ช่วงงาน · ' + b.name, b.x, b.y, b.w, b.h, '#A80689'); r.cornerRadius = 8;
    const t = put(await docText(b.name, 26, '#FFFFFF'), b.x + 20, 0); t.y = b.y + (b.h - t.height) / 2;
  }
  let links = 0;
  for (const e of sw.edges) {   // เส้นก่อน กล่องทับเส้น
    const v = await arrow(e.pts, e.back ? '#98A2B3' : '#475467', 3);
    if (e.back) { try { v.dashPattern = [16, 10]; } catch (err) { /* ไม่มี dash ก็เส้นทึบ */ } }
    put(v, Math.min(...e.pts.map(p => p[0])), Math.min(...e.pts.map(p => p[1])));
    v.name = 'เส้น ' + e.from + ' → ' + e.to + (e.back ? ' (ย้อนกลับ)' : '');
    if (e.lab) { const t = put(await labelText(e.label, 18, '#101828'), e.lab[0], e.lab[1]); t.name = 'ป้าย ' + e.label; }
    links++;
  }
  let steps = 0, forks = 0; const slots = [];
  for (const nd of sw.nodes) {
    const s = flowNode(nd.kind === 'decision' ? 'decision' : 'display'); f.appendChild(s);
    s.resize(nd.w, nd.h); s.x = nd.x; s.y = nd.y;
    s.fills = [{ type: 'SOLID', color: nd.fill }]; s.strokes = [{ type: 'SOLID', color: nd.stroke }]; s.strokeWeight = 4;
    s.name = (nd.kind === 'decision' ? 'ทางแยก ' : 'ขั้น ') + nd.id + ' / ' + nd.label;
    if (nd.thumb) {   // ภาพย่อจอจริง (เจ้าของงาน 4 พ.ย. 2569 "ภาพย่อจอจริง + รหัสจอ") — ช่องบน + ข้อความใต้ภาพ + ป้ายรหัสจอมุมขวาบน แบบกล่องหน้าจอของผัง userflow
      const th = rect('ภาพย่อ ' + nd.id, nd.x + nd.thumb.x, nd.y + nd.thumb.y, nd.thumb.w, nd.thumb.h, '#FFFFFF', '#D0D5DD'); th.cornerRadius = 4;
      slots.push({ id: nd.id, rect: th, codes: nd.screens });
      const top = nd.thumb.y + nd.thumb.h + 4, ih = nd.h - top - 6, iw = nd.w - 16;
      const t = put(await flowText(nd.label, 15, '#101828', iw, ih), nd.x + 8, nd.y + top); t.name = nd.id + ' ข้อความ';
      const b = frame('ป้ายจอ ' + nd.screens.join(' '), 'HORIZONTAL', { fill: rgbOf(BADGE_FILL), pad: [4, 10] }); b.cornerRadius = 6;
      b.primaryAxisSizingMode = 'AUTO'; b.counterAxisSizingMode = 'AUTO';
      b.appendChild(await labelText(nd.screens.join(' · '), 16, '#101828'));
      put(b, nd.x + nd.w - 24, nd.y - 16);
    } else {
      const iw = nd.kind === 'decision' ? nd.w * 0.62 : nd.w - 24, ih = nd.kind === 'decision' ? nd.h * 0.62 : nd.h - 16;
      const t = put(await flowText(nd.label, 17, '#101828', iw, ih), nd.x + (nd.w - iw) / 2, nd.y + (nd.h - ih) / 2); t.name = nd.id + ' ข้อความ';
    }
    if (nd.kind === 'decision') forks++; else steps++;
  }
  CREATED = [];
  return { frame: f, steps, forks, links, slots };
}

/* ---------- flowchart กิจกรรมราย scenario (เจ้าของงาน 6 พ.ย. 2569 "สร้าง แต่ละ scen ออกมา … ทำ script ให้ export ใน figma" + "อยากได้ flowchart") ----------
   ข้อมูลฝังตอน build (const ACTIVITY · plugin-lib/activity-layout.js อ่าน Diagram/…-flowchart-กิจกรรม.md) — ปลั๊กอินแค่วาดตามตำแหน่ง
   "เอาเป็นแค่กิจกรรม … ไม่ต้องเอาหน้าจอไปรวม" ⇒ ไม่มีภาพย่อจอ ไม่มีป้ายรหัสจอ
   "อยากให้แยก scen เลยนะ" ⇒ ประกอบในกรอบชั่วคราวเพื่อหาที่ว่างบนหน้า (putBelow) แล้วแยกออกเป็นกรอบบนหน้า 1 scenario = 1 กรอบ + กรอบคำอธิบาย 1 กรอบ
   รูปทรงแบบ swimlane ("สี่เหลี่ยม และทางแยกเป็นข้าวหลามตัด"): กิจกรรม = สี่เหลี่ยม · ทางเลือก = ข้าวหลามตัด · เริ่ม/จบ/ไปต่อ = วงกลม · เส้นประเทา = ย้อนกลับไปทำซ้ำ
   คำอธิบายบนกรอบใช้คำธรรมดา (เจ้าของงาน "ไม่ต้องใช้คำแปลกๆนะ ให้ใช้คำปกติเหมือนมนุษย์อ่าน") */
/* กรอบผัง 1 scenario — ใช้ทั้งปุ่ม "สร้าง flowchart กิจกรรม" (กรอบละ scenario) และวางซ้ายของแถวจอในบล็อก scenario แทนผัง userflow
   (เจ้าของงาน 6 พ.ย. 2569 "export รอบต่อไป … อยากให้ flowchart คู่กับ ui ไม่ใช่ user flow") · sc = 1 scenario จาก ACTIVITY.scenarios */
async function activityFrame(name, sc) {
  const g = figma.createFrame(); CREATED.push(g);
  g.name = name; g.resize(sc.w, sc.h); g.clipsContent = false;
  g.fills = [{ type: 'SOLID', color: WHITE }]; g.strokes = [{ type: 'SOLID', color: rgbOf('#D0D5DD') }]; g.strokeWeight = 2; g.cornerRadius = 16;
  const put = (node, x, y) => { g.appendChild(node); node.x = x; node.y = y; return node; };
  put(await docText('S' + sc.n + ' · ' + sc.title, 26, '#101828', sc.w - 80), 40, 32).name = 'ชื่อ scenario';
  let steps = 0, forks = 0, links = 0;
  for (const e of sc.edges) {   // เส้นก่อน กล่องทับเส้น
    const v = await arrow(e.pts, e.back ? '#98A2B3' : '#475467', 3);
    if (e.back) { try { v.dashPattern = [16, 10]; } catch (err) { /* ไม่มี dash ก็เส้นทึบ */ } }
    put(v, Math.min(...e.pts.map(p => p[0])), Math.min(...e.pts.map(p => p[1])));
    v.name = 'เส้น ' + e.from + ' → ' + e.to + (e.back ? ' (ย้อนกลับ)' : '');
    if (e.lab) put(await labelText(e.label, 18, '#101828'), e.lab[0], e.lab[1]).name = 'ป้าย ' + e.label;   // ตำแหน่งจาก activity-layout.js (กรอบขยายให้แล้ว)
    links++;
  }
  for (const nd of sc.nodes) {
    const s = flowNode(nd.kind === 'decision' ? 'decision' : nd.kind === 'end' ? 'end' : 'display'); g.appendChild(s);
    s.resize(nd.w, nd.h); s.x = nd.x; s.y = nd.y;
    s.fills = [{ type: 'SOLID', color: nd.fill }]; s.strokes = [{ type: 'SOLID', color: nd.stroke }]; s.strokeWeight = 4;
    s.name = (nd.kind === 'decision' ? 'ทางเลือก ' : nd.kind === 'end' ? 'เริ่ม/จบ ' : 'กิจกรรม ') + nd.id + ' / ' + nd.label.split('\n')[0];
    const iw = nd.kind === 'decision' ? nd.w * 0.62 : nd.w * 0.86, ih = nd.kind === 'decision' ? nd.h * 0.62 : nd.h * 0.8;
    put(await flowText(nd.label, nd.kind === 'end' ? 16 : 17, '#101828', iw, ih), nd.x + (nd.w - iw) / 2, nd.y + (nd.h - ih) / 2).name = nd.id + ' ข้อความ';
    if (nd.kind === 'decision') forks++; else if (nd.kind !== 'end') steps++;
  }
  return { frame: g, steps, forks, links };
}
async function activityBoard(prefix, ac) {
  CREATED = [];
  const f = figma.createFrame(); CREATED.push(f);
  f.name = prefix + ' · flowchart กิจกรรม';
  f.resize(ac.w, ac.h); f.fills = [{ type: 'SOLID', color: WHITE }];
  f.strokes = [{ type: 'SOLID', color: rgbOf('#D0D5DD') }]; f.strokeWeight = 2; f.cornerRadius = 24; f.clipsContent = false;
  const hd = figma.createFrame(); CREATED.push(hd);
  hd.name = prefix + ' · flowchart กิจกรรม · คำอธิบาย'; hd.resize(Math.min(ac.w, 4000), 200); hd.fills = []; hd.clipsContent = false;
  f.appendChild(hd); hd.x = 0; hd.y = 0;
  const head = await docText(ac.title + ' · ' + ac.scenarios.length + ' scenario', 56, '#101828'); hd.appendChild(head); head.x = 64; head.y = 48;
  const lg = await docText('อ่านจากบนลงล่าง กล่องสี่เหลี่ยมคือสิ่งที่ทำ รูปข้าวหลามตัดคือจุดที่ต้องเลือก คำบนเส้นบอกว่าเลือกแล้วไปทางไหน วงกลมคือจุดเริ่มและจุดจบ เส้นประสีเทาคือย้อนกลับไปทำอีกครั้ง ผังนี้ไม่มีหน้าจอ ดูหน้าจอได้ที่ userflow (ต้นฉบับ ' + ac.src + ')', 24, '#475467', null, true);
  hd.appendChild(lg); lg.x = 64; lg.y = 128;
  let steps = 0, forks = 0, links = 0;
  for (const sc of ac.scenarios) {
    const r = await activityFrame(prefix + ' · flowchart กิจกรรม · S' + sc.n + ' · ' + sc.title, sc);
    f.appendChild(r.frame); r.frame.x = sc.x; r.frame.y = sc.y;
    steps += r.steps; forks += r.forks; links += r.links;
  }
  CREATED = [];
  return { frame: f, scenarios: ac.scenarios.length, steps, forks, links };
}
/* แยกกรอบชั่วคราวของ activityBoard ออกเป็นกรอบบนหน้า (ตำแหน่งเดิมบนหน้า) แล้วลบกรอบชั่วคราว · คืนรายการกรอบที่แยกแล้ว */
function splitBoard(page, f) {
  const kids = f.children.slice();
  for (const k of kids) { const x = f.x + k.x, y = f.y + k.y; page.insertChild(0, k); k.x = x; k.y = y; }
  f.remove();
  return kids;
}

/* ---------- ส่งภาพจอบนหน้านี้ไป FigJam (เจ้าของงาน 30 ต.ค. 2569 "export … ไปที่ figjam ด้วย userflow และ design มาจาก figma ปรับใหม่ล่าสุด") ----------
   export เฟรมจอ "<prefix> / A.1 · S1 — ชื่อ" บนหน้าที่เปิดอยู่ (จอที่ทีมแก้มือแล้วก็ได้) เป็น PNG ส่งให้หน้าต่างปลั๊กอิน → POST เข้า serve.js ที่ out/figjam/<dir>/
   แล้ว 3-figjam-board.js วางภาพต่อจากผัง userflow ของ scenario เดียวกัน · desktop อย่างเดียว · ด้านยาวไม่เกิน 4000 px (FigJam รับไม่เกิน 4096) */
const SHOT_RE = /^(\S+) \/ ([A-Z])(\d*)\.([0-9.]+) · (S\d+)(?: ([^—]+?))? — (.+)$/;   // 24 พ.ย. 2569 คืนฉบับที่อ่านรหัสเรื่องย่อย A1.3 ได้ (ตอนรวมสาขาย้อนเป็นฉบับเก่า ⇒ จอ S1 แยก journey ถูกข้ามตอนส่ง FigJam)
/* ตรวจจอซ้ำบนหน้าปัจจุบัน — ไม่แก้ไม่ลบอะไรทั้งสิ้น (เจ้าของงาน 10 พ.ย. 2569 "ช่วยหาทางตรวจให้" · "ลบเองได้")
   ทุกปุ่มสร้างของปลั๊กอินวางชุดใหม่ "ต่อใต้ของเดิม" เสมอ ⇒ กดสร้างซ้ำบนหน้าเดิมจะมีหลายชุดซ้อนกัน (เช่น เคยกด "สร้างเฉพาะ Desktop" แล้วมากด "สร้างทั้งชุด" ทีหลัง = Desktop 2 แถว Mobile 1 แถว)
   จับคู่ด้วย รหัสจอ + อุปกรณ์ จากชื่อเฟรม (SHOT_RE) · ชุดล่าสุดดูจาก pluginData builtAt */
async function auditDuplicates() {
  errors.length = 0;
  const page = figma.currentPage;
  if (page.loadAsync) await page.loadAsync();
  const all = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0);
  if (!all.length) { log('ไม่พบเฟรมจอ "' + PLUGIN.prefix + ' / …" บนหน้า "' + page.name.trim() + '" — เปิดหน้าที่มีจอแล้วกดใหม่'); return; }
  const by = new Map(); let skipped = 0;
  for (const f of all) {
    const mob = / · mobile$/.test(f.name), m = f.name.replace(/ · mobile$/, '').match(SHOT_RE);
    if (!m) { skipped++; continue; }
    const key = m[2] + m[3] + '.' + m[4] + ' · ' + (mob ? 'mobile' : 'desktop');
    if (!by.has(key)) by.set(key, []);
    by.get(key).push(f);
  }
  const builtAt = (f) => +((f.getPluginData && f.getPluginData('builtAt')) || 0);
  const dup = [...by.entries()].filter(([, v]) => v.length > 1);
  log('— ตรวจจอซ้ำบนหน้า "' + page.name.trim() + '" (ไม่แก้อะไร) —');
  log('เฟรมจอทั้งหมด ' + all.length + ' · รหัสจอไม่ซ้ำ ' + by.size + (skipped ? ' · ชื่อไม่เข้ารูปแบบ ' + skipped : ''));
  if (!dup.length) { log('✓ ไม่มีจอซ้ำ — หน้านี้มีชุดเดียว'); return; }
  const copies = Math.max(...dup.map(([, v]) => v.length));
  log('⚠ มีจอซ้ำ ' + dup.length + ' รหัส · ซ้ำมากสุด ' + copies + ' ชุด ⇒ หน้านี้น่าจะมี ' + copies + ' ชุดซ้อนกัน');
  const rows = {};   // แถว y ของแต่ละชุด เพื่อบอกว่าชุดไหนอยู่ตรงไหน
  for (const [, v] of dup) v.forEach((f, i) => { const k = Math.round(f.y / 500) * 500; rows[k] = (rows[k] || 0) + 1; });
  log('แถวที่พบจอซ้ำ (y โดยประมาณ → จำนวนจอ): ' + Object.keys(rows).sort((a, b) => a - b).map(k => k + ' → ' + rows[k]).join(' · '));
  for (const [k, v] of dup.slice(0, 20)) {
    const newest = v.reduce((a, b) => builtAt(b) > builtAt(a) ? b : a);
    log('  · ' + k + ' — ' + v.length + ' ชุด · y = ' + v.map(f => Math.round(f.y)).sort((a, b) => a - b).join(', ')
      + ' · ล่าสุด y=' + Math.round(newest.y) + (builtAt(newest) ? '' : ' (ชุดเก่าไม่มีเวลาสร้าง เดาจากลำดับไม่ได้)'));
  }
  if (dup.length > 20) log('  … และอีก ' + (dup.length - 20) + ' รหัส');
  log('วิธีเก็บกวาด: เก็บชุดที่ y ของ "ล่าสุด" ไว้ แล้วลบชุดอื่นเองใน Figma (ปลั๊กอินไม่ลบให้ — ตั้งใจไม่แตะของบนหน้า)');
}

async function exportShots(dir, scen, titles) {   // scen = ['S1', 'S2'] ส่งเฉพาะ scenario ที่ติ๊ก (ว่าง = ทุกจอ · 9 พ.ย. 2569 เจ้าของงาน "อยากแยกการ export figjam ออกเป็น S เหมือนกันได้หรือไม่")
  errors.length = 0;
  const page = figma.currentPage;
  /* 5 พ.ย. 2569 เจ้าของงาน "export figjam อยากให้ออกมาเป็นแบบนี้ มี mobile มาด้วย … บอกว่าส่วนใหน desktop , mobile" ⇒ ส่งจอ mobile ด้วย (ชื่อเฟรมลงท้าย " · mobile") · device ใน manifest */
  const all = page.children.filter(n => n.type === 'FRAME' && n.name.indexOf(PLUGIN.prefix + ' / ') === 0 && n.name.indexOf(' · ตัดแล้ว') < 0);
  const shots = [], skipped = [];
  for (const f of all) {
    const mob = / · mobile$/.test(f.name), m = f.name.replace(/ · mobile$/, '').match(SHOT_RE);
    if (m) shots.push({ f, code: m[2] + m[3] + '.' + m[4], letter: m[2], sub: m[3], no: m[4], scenario: m[5], group: m[2] + m[3], groupName: m[6] || '', name: m[7], device: mob ? 'mobile' : 'desktop' }); else skipped.push(f.name);
  }
  /* หน้าเดียวกันมีหลายชุด ⇒ จอรหัสเดียวกันเก็บตัวที่สร้างล่าสุด
     9 พ.ย. 2569 เดิมเลือกตามตำแหน่งล่างสุด แต่หน้าเต็มแล้วปลั๊กอินวางชุดใหม่ที่ช่องว่างด้านบนหรือคอลัมน์ขวา ⇒ ส่งชุดเก่าไป FigJam (เจ้าของงาน "ของฝั่ง figma มาแล้ว แต่ figjam ยังไม่มา")
     9 พ.ย. 2569 (รอบ 2 · เจ้าของงาน "ทำไมหน้า figjam ไม่เท่า figma ทำให้เท่าหน่อย"): buildGrid วางทุกชิ้นด้วย page.insertChild(0) ⇒ ชุดใหม่อยู่ลำดับต้นของ page.children (ล่างสุดของแผง Layers)
     ไม่ใช่ลำดับท้าย — รอบแรกเลือกลำดับท้ายจึงได้ชุดเก่าสุด (A.20 ฉบับก่อน 6 พ.ย.) ⇒ จอที่มีเวลาสร้าง (pluginData builtAt) เลือกตามเวลา · จอที่สร้างก่อนมีเวลา ลำดับต้นของหน้า = ล่าสุด */
  const order = new Map(page.children.map((n, i) => [n.id, i]));
  const builtAt = (f) => +((f.getPluginData && f.getPluginData('builtAt')) || 0);
  const seen = new Set();
  const total = shots.length;
  shots.sort((p, q) => (builtAt(q.f) - builtAt(p.f)) || (order.get(p.f.id) - order.get(q.f.id)));
  shots.splice(0, shots.length, ...shots.filter(x => !seen.has(x.code + x.device) && seen.add(x.code + x.device)));
  if (total > shots.length) log('หน้านี้มีจอหลายชุด — ส่งเฉพาะชุดที่สร้างล่าสุดของแต่ละจอ · ข้ามชุดเก่า ' + (total - shots.length) + ' จอ');
  if (scen && scen.length) { shots.splice(0, shots.length, ...shots.filter(x => scen.indexOf(x.scenario) >= 0)); log('ส่งเฉพาะ ' + scen.join(' ')); }
  const key = (s) => s.letter + (s.sub || '').padStart(3, '0') + '.' + s.no.split('.').map(x => x.padStart(3, '0')).join('.');
  shots.sort((a, b) => key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0);
  if (!shots.length) { log('ไม่พบเฟรมจอ "' + PLUGIN.prefix + ' / …" บนหน้า "' + page.name + '" — เปิดหน้าที่มีจอแล้วกดใหม่'); return; }
  log('ส่งภาพจอ ' + shots.length + ' จอ จากหน้า "' + page.name + '" ไปที่ out/figjam/' + dir + '/ …');
  const manifest = { source: 'figma', page: page.name, exportedAt: new Date().toISOString(), scen: scen && scen.length ? scen : undefined, titles: titles || undefined, shots: [] };
  for (const s of shots) {
    try {
      const scale = Math.min(1, 4000 / Math.max(s.f.width, s.f.height));
      const bytes = await s.f.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: scale } });
      const file = s.code + '-' + s.scenario + (s.device === 'mobile' ? '-mobile' : '') + '.png';
      figma.ui.postMessage({ type: 'shot', dir, file, bytes });
      manifest.shots.push({ code: s.code, scenario: s.scenario, group: s.group, groupName: s.groupName || undefined, name: s.name, device: s.device, file, w: Math.round(s.f.width * scale), h: Math.round(s.f.height * scale) });
    } catch (e) { warn('export ' + s.f.name, e); }
  }
  figma.ui.postMessage({ type: 'shots-done', dir, manifest });
  log('export แล้ว ' + manifest.shots.length + '/' + shots.length + ' จอ' + (skipped.length ? ' · ข้าม ' + skipped.length + ' เฟรมที่ชื่อไม่ตรงรูปแบบ (เช่น ' + skipped[0] + ')' : '') + (errors.length ? ' · ⚠ เตือน ' + errors.length + ' จุด' : ''));
  if (dir === 'flow-maintainance') log('ขั้นต่อไป: serve.js สร้างบอร์ดราย scenario ให้เอง (ดูหน้าต่าง serve.js) → ใน FigJam เปิด "Maintain-D → FigJam board" → โหลดรายการใหม่ → ติ๊ก S ในกลุ่ม "บำรุงรักษาตามวาระ · ราย scenario" → สร้างส่วนที่ติ๊ก (แทนที่ของเดิมตรงตำแหน่งเดิม)');
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
      /* J.kind 'activity' (บำรุงรักษา 6 พ.ย. 2569): ต่อผัง flowchart กิจกรรมแนวนอนแทนผัง userflow · ไม่มีภาพย่อจอ */
      const uf = J.kind === 'activity' ? Object.assign(await activityFrame(prefix + ' · journey flowchart S' + n, sc), { slots: [] })
        : await userflowFrame(prefix, 'journey', n, c.codes, [], { sc, title: 'Scenario ' + n + ' · ' + sc.title });
      F[n] = uf.frame; page.insertChild(0, uf.frame); made++;
      for (const sl of uf.slots) { const cd = (c.codes[sl.id] || [])[0]; if (cd) thumbs.push([sl.rect, cd]); }
    } catch (e) { warn('journey S' + n, e); dropCreated(page); }
    CREATED = [];
  }
  /* ตำแหน่ง: คอลัมน์กว้างเท่ากรอบที่กว้างสุดในคอลัมน์ · แถว 2 อยู่ใต้กรอบแถว 1 ที่สูงสุด */
  const rowOf = (n) => (J.row && J.row[n]) || 0;
  const backTop = J.links.filter(l => l[3] === 'back' && !rowOf(l[0]) && !rowOf(l[1])).length;
  /* แถบ Journey = Header Type=Header (สูงกว่าแถบเดิม) ⇒ สร้างก่อนเพื่อวัดความสูง แล้วค่อยยืดกว้างเท่าผังด้านล่าง (10 พ.ย. 2569) */
  CREATED = []; const jb = put(await blockHeader(prefix, 'Journey', J.title, 1000), 0, y0); const jh = Math.max(GRID.barH, jb.height);
  const top = y0 + jh + JGAP.bar + GRID.barH + JGAP.bar + backTop * JGAP.lane;
  const colX = []; let x = 0;
  J.cols.forEach((col, i) => { colX[i] = x; x += Math.max(...col.map(n => F[n] ? F[n].width : 0)) + JGAP.col; });
  const totalW = x - JGAP.col;
  const h0 = Math.max(...Object.keys(F).filter(n => !rowOf(n)).map(n => F[n].height));
  const rowY = [top, top + h0 + JGAP.row];
  const colOf = {}; J.cols.forEach((col, i) => col.forEach(n => { colOf[n] = i; }));
  for (const n of Object.keys(F)) { F[n].x = colX[colOf[n]]; F[n].y = rowY[rowOf(n)]; }
  /* แถบ Journey + ช่วงงาน (component Header ของทีมออกแบบ · ไม่มี = แถบธรรมดา) */
  CREATED = [];
  try { jb.resize(totalW, jb.height); } catch (e) { warn('ปรับกว้างแถบ Journey', e); }
  for (const [i, [title, ns]] of (J.phases || []).entries()) {
    const xs = ns.filter(n => F[n]).map(n => F[n].x), xe = ns.filter(n => F[n]).map(n => F[n].x + F[n].width);
    if (!xs.length) continue;
    put(await flowBar(prefix, 'ช่วง ' + (i + 1), title, 'Sub Flow', Math.max(...xe) - Math.min(...xs)), Math.min(...xs), y0 + jh + JGAP.bar);
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

/* เส้นทางย่อยในบล็อก — แพตเทิร์นที่เจ้าของงานเคาะ 10 พ.ย. 2569 จากบล็อก S20 (S.3 ลบจากหน้า Detail → S.3.1 S.3.2)
   screens[i] เป็น { path: 'ชื่อเส้นทาง', screens: [[label, fn, ids], …] } แทน [label, fn, ids] ได้
   ⇒ ตำแหน่งนั้นมีแถบชื่อเส้นทาง (Sub Flow) คร่อมคอลัมน์ของตัวเอง และจอข้างใต้ได้รหัสซ้อน <code>.<i+1>.<j+1>
   ลำดับตำแหน่งระดับบนยังนับ 1..n ตามเดิม ⇒ เส้นหลักอ่านเป็นแถวเดียวจบ ส่วนทางแยกไม่กินเลขของเส้นหลัก
   entry แบบ array เดิมทำงานเหมือนเดิมทุกอย่าง (ปลั๊กอิน login · contractor-eval ไม่ต้องแก้) */
const isPath = (e) => !!e && !Array.isArray(e) && Array.isArray(e.screens);
const countScreens = (list) => list.reduce((a, e) => a + (isPath(e) ? e.screens.length : 1), 0);
function flatScreens(list, code) {   // → [{ code, label, fn, ids, path?, pathCode?, first, span }] เรียงตามคอลัมน์จริง
  const out = [];
  list.forEach((e, i) => {
    const c = code + '.' + (i + 1);
    if (isPath(e)) e.screens.forEach(([label, fn, ids], j) =>
      out.push({ code: c + '.' + (j + 1), label: label, fn: fn, ids: ids, path: e.path, pathCode: c, first: j === 0, span: e.screens.length }));
    else out.push({ code: c, label: e[0], fn: e[1], ids: e[2], first: true, span: 1 });
  });
  return out;
}

/* GROUPS = [{ code: 'A', title: '…', subs: [{ code: 'A', title: '…', tag: 'S1', screens: [[label, fn, 'D1 D2'?] | { path, screens }, …] }] }]
   screens[i][2] = id กล่องในผัง userflow ที่จอนี้แสดง (คั่นด้วยช่องว่าง · ไม่ใส่ = ผังยังไม่มีกล่องของจอนี้)
   fn() สร้างจอตามตัวแปร MOB · จอชื่อ "<prefix> / A.2 · S1 — <label>[ · mobile]" · คืน { made, y, flows }
   opts.devices = [false] desktop · [true] mobile · ไม่ส่ง = ทั้งคู่ · opts.rowMin = ความสูงแถวขั้นต่ำ · opts.flow = false ไม่วางผัง userflow */
async function buildGrid(page, prefix, GROUPS, y0, total, opts) {
  opts = opts || {};
  const made = []; let y = y0; const x0 = GRID.side + GRID.gap; const pitch = GRID.colW + GRID.colGap; let flows = 0;
  const put = (n, x, yy) => { page.insertChild(0, n); n.x = x; n.y = yy; return n; };
  if (opts.page) {   // หัวหน้าของชุดจอ 1 ตัว (Header Type=Header) กว้างเท่าบล็อกที่กว้างสุด — แบบหน้า 5.x ของ UI Release#2
    const nMax = Math.max(...GROUPS.map(g => Math.max(...g.subs.map(s => s.screens.length))));
    CREATED = []; const ph = put(await blockHeader(prefix, 'Page', opts.page.title, nMax * GRID.colW + (nMax - 1) * GRID.colGap, '', opts.page.status), x0, y);
    y += ph.height + GRID.groupGap;
  }
  for (const g of GROUPS) {
    const nCols = Math.max(...g.subs.map(s => countScreens(s.screens)));
    const top = y;
    CREATED = []; put(await flowBar(prefix, g.code, g.title, 'Default', nCols * GRID.colW + (nCols - 1) * GRID.colGap), x0, y);   // บล็อกตัวอักษร = Subheader State=Default (หน้าจริง: "A แก้ไขตารางบำรุงรักษา…")
    y += GRID.barH + GRID.gap;
    let flowBottom = top;
    const flowDone = new Set();   // บล็อกที่แบ่งเรื่องย่อย (A1 A2 …) ใช้ scenario เดียวกัน ⇒ ผังข้างจอวางครั้งเดียวต่อบล็อก (12 พ.ย. 2569)
    for (const sub of g.subs) {
      const flat = flatScreens(sub.screens, sub.code), n = flat.length, w = n * GRID.colW + (n - 1) * GRID.colGap;
      if (sub.code !== g.code) {   // แถบย่อย (B1 B2) เฉพาะเมื่อกลุ่มมีหลาย scenario · เจ้าของงานเคาะ 20 ต.ค. 2569: 1 scenario = 1 บล็อก ⇒ ไม่มีแถบย่อย ป้าย state = A.1 A.2 …
        put(await flowBar(prefix, sub.code, sub.title, 'Sub Flow', w), x0, y);
        y += GRID.barH + GRID.gap;
      }
      const sn = flowDone.has(sub.tag) ? null : scenNo(sub.tag); flowDone.add(sub.tag);
      let flowSlots = null; const byCode = {};   // รหัสจอ → เฟรมจอ (desktop ก่อน) สำหรับภาพย่อในผัง
      /* ปลั๊กอินที่ฝัง ACTIVITY (บำรุงรักษา) วาง flowchart กิจกรรมซ้ายของบล็อกแทนผัง userflow (เจ้าของงาน 6 พ.ย. 2569 "อยากให้ flowchart คู่กับ ui ไม่ใช่ user flow")
         ไม่มีภาพย่อจอ ไม่มีป้ายรหัสจอ (flowchart ไม่มีหน้าจอ) · ปลั๊กอินอื่นที่ไม่มี ACTIVITY ใช้ผัง userflow ตามเดิม */
      const act = (typeof ACTIVITY !== 'undefined' && ACTIVITY && sn != null) ? ACTIVITY.scenarios.find(x => x.n === sn) : null;
      if (opts.flow !== false && act) {
        CREATED = [];
        try {
          const fr = (await activityFrame(prefix + ' · ' + g.code + ' flowchart S' + sn, act)).frame;
          put(fr, -(fr.width + FLOW_GAP), top); flowBottom = Math.max(flowBottom, top + fr.height); flows++;
          log('  · flowchart กิจกรรม S' + sn + ' (' + act.nodes.length + ' กล่อง)');
        } catch (e) { warn('flowchart กิจกรรม S' + sn, e); const k = dropCreated(page); if (k) log('    ลบชิ้นที่ค้างจากผังที่พัง ' + k + ' ชิ้น'); }
        CREATED = [];
      } else if (opts.flow !== false && USERFLOW && sn != null && USERFLOW.scenarios[sn]) {   // ผัง userflow ซ้ายของบล็อก (ขอบขวาห่างป้าย Device FLOW_GAP)
        const codes = {}, loose = [];
        flat.forEach(({ code: c, label, ids }) => {
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
      /* แถวบน: จอเดี่ยว = ป้ายจอ · เส้นทางย่อย = ป้ายชื่อเส้นทางคร่อมคอลัมน์ของตัวเอง (Sub Flow)
         แถวล่าง: ป้ายจอของเส้นทางย่อย มีเฉพาะบล็อกที่มีเส้นทางย่อย (แพตเทิร์น S20 · 10 พ.ย. 2569) */
      const hasPath = flat.some(s => s.path);
      put(await deviceLabel(prefix, 'Header', GRID.barH), 0, y);
      for (const [i, sc] of flat.entries()) {
        if (!sc.path) put(await flowBar(prefix, sc.code, sc.label, 'Sub Flow 2', GRID.colW), x0 + i * pitch, y);
        else if (sc.first) put(await flowBar(prefix, sc.pathCode, sc.path, 'Sub Flow', sc.span * GRID.colW + (sc.span - 1) * GRID.colGap), x0 + i * pitch, y);
      }
      if (hasPath) {
        y += GRID.barH + GRID.gap;
        put(await deviceLabel(prefix, 'Header', GRID.barH), 0, y);
        for (const [i, sc] of flat.entries()) if (sc.path) put(await flowBar(prefix, sc.code, sc.label, 'Sub Flow 2', GRID.colW), x0 + i * pitch, y);
      }
      y += GRID.barH + GRID.gap;
      for (const mob of (opts.devices || [false, true])) {   // devices: [false]=desktop อย่างเดียว · [true]=mobile อย่างเดียว · ไม่ส่ง=ทั้งคู่ (แถว mobile ใต้ desktop)
        MOB = mob; let h = 0; const rowY = y;
        for (const [i, { code: cd, label, fn }] of flat.entries()) {
          const x = x0 + i * pitch;
          CREATED = []; PLACE = { x, y: rowY };   // เฟรมจอไปอยู่ตำแหน่งจริงทันทีที่สร้าง · ชิ้นที่สร้างระหว่างทางถูกติดตามไว้
          try {
            PINS = []; const s = await fn(); stripDividers(s); await polish(s); repin(); await bindTones(); if (typeof AFTER_SCREEN === 'function') await AFTER_SCREEN(s);   // AFTER_SCREEN = ตัวเรียกเฉพาะปลั๊กอิน (บำรุงรักษา: ลิงก์เลขทะเบียน 6 พ.ย. 2569)
            s.name = prefix + ' / ' + cd + ' · ' + sub.tag + ' — ' + label + (mob ? ' · mobile' : '');
            if (s.setPluginData) s.setPluginData('builtAt', String(Date.now()));   // ส่งภาพไป FigJam เลือกจอที่สร้างล่าสุดตามเวลานี้ (exportShots · 9 พ.ย. 2569)
            put(s, x, rowY); h = Math.max(h, s.height); made.push(s);
            if (!byCode[cd]) byCode[cd] = s;
            log('  · ' + made.length + '/' + total + ' ' + s.name);
          } catch (e) {
            warn(cd + ' ' + label + (mob ? ' (mobile)' : ''), e);
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
const USERFLOW = null;

/* ======================== AC รายจอ (ฝังตอน build) ======================== */
const AC = null;

/* ======================== เอกสาร story map / use case (ฝังตอน build) ======================== */
const DOCS = null;

/* ======================== user journey swimlane (ฝังตอน build) ======================== */
const SWIMLANE = null;

/* ======================== flowchart กิจกรรมราย scenario (ฝังตอน build) ======================== */
let ACTIVITY = null;   // let: ปลั๊กอินที่รวมปลั๊กอินอื่นเข้ามา (build.json include) สลับผังตอนสร้างจอของปลั๊กอินนั้น

/* ======================== ภาพประกอบ (ฝังตอน build) ======================== */
const IMAGES = null;

/* ======================== ปลั๊กอินที่รวมเข้ามา (build.json include · เติมท้ายไฟล์) ======================== */
const INCLUDE = {};

/* ======================== safety-inspection-plugin/screens.js ======================== */
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
const CAR_COLS = [['ทะเบียน', 220, 'Lead text'], ['สังกัด', 150], ['วาระ', 130], ['แผนเดินทาง', 0], ['ผล ปจ.2', 120], ['สถานะ', 150], ['', 72]];
const tripOfCar = (id) => [T1, T2].find(t => t.cars.indexOf(id) >= 0);
const carRowDetail = (id, o) => {
  const v = V[id], t = tripOfCar(id), n = machinesOfCar(id).length;
  const st = !t ? null : carSt(t, id);
  return [o && o.check ? { check: (o.ticked || []).indexOf(id) >= 0, text: v[0], sub: v[1] + ' · ' + v[2], disabled: st !== 'sent' } : { text: v[0], sub: v[1] + ' · ' + v[2] }, v[3], { text: v[7] + ' เดือน', sub: n > 1 ? n + ' เครื่องมือกล' : v[8] || undefined },
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
  if (!own) parts.push(alertBox('Info', 'แผนของ ' + p.dept + ' · ดูได้อย่างเดียว', 'กบค. ไม่ดำเนินการในส่วนของ กรย. การสร้างแผนเดินทาง การอนุมัติผลตรวจ การแก้ไขและลบแผน ทำโดย กรย.'));
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
  add(page, col('Content', [proposed ? alertBox('Info', 'ผู้รับจ้างเสนอแผนเดินทางนี้', 'ตรวจหรือแก้ไขได้ (กรอกค่าจ้างตรวจรายคันได้ ไม่บังคับ) แล้วกดบันทึกและส่งอนุมัติให้หัวหน้า กบค. · เสนอเมื่อ ' + t.sent) : null,
    t && t.st === 'returned' ? alertBox('Error', 'หัวหน้า กบค. ส่งกลับให้แก้ไข', 'ตรวจวันที่อีกครั้ง · แก้ไขแล้วกดบันทึกและส่งอนุมัติอีกครั้ง') : null, info, carSec,
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
  if (proposed) parts.push(alertBox('Info', 'ผู้รับจ้างเสนอแผนเดินทางนี้', 'ตรวจหรือแก้ไขได้ (กรอกค่าจ้างตรวจรายคันได้ ไม่บังคับ) แล้วกดบันทึกและส่งอนุมัติให้หัวหน้า กบค. · เสนอเมื่อ ' + t.sent));
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
  if (o.behalf) body.push(alertBox('Info', 'กบค. บันทึกผลแทนผู้รับจ้าง', 'กรอกผลแล้วกดส่งอนุมัติ จากนั้นพิจารณาอนุมัติผลของเครื่องนี้ได้ตามปกติ'));
  if (st === 'returned' && o.mode !== 'review') body.push(alertBox('Error', 'กบค. ส่งกลับแก้ไข', r[3] + ' · แก้ไขแล้วกดส่งอนุมัติอีกครั้ง'));
  if (st === 'sent' && o.mode === 'view') body.push(alertBox('Info', 'ส่งอนุมัติแล้วเมื่อ 18/11/2569 · รอ กบค. อนุมัติ', 'ระหว่างรออนุมัติแก้ไขหรือลบไม่ได้ ดูและดาวน์โหลดได้'));
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
    const f = o.upload, id = f.car, v = V[id], ms = machinesOfCar(id), ui = f.unit || 0, m = ms[ui], r = REG.find(x => x[0] === id), inPlan = r && r[4] !== '-' ? r[4] : '';
    const body = [];
    if (ms.length > 1) body.push(await tabs(ms.map(x => [machineTag(ms, x), null]), ui));
    body.push(alertBox('Info', 'ใช้สำหรับผลตรวจนอกแผน เช่น ตรวจรายคัน ตรวจหลังซ่อมหรือ Overhaul', 'บันทึกแล้วทะเบียน ปจ.2 อัปเดตทันที ไม่ต้องอนุมัติ' + (inPlan ? ' · คันนี้อยู่ในแผน ' + inPlan + ' ที่ยังไม่ปิด' : '')),
      row('Row', [dropdown('ที่มา', f.filled ? 'งานซ่อม' : '', { placeholder: 'เลือกที่มาของผลตรวจ' }), field('เลขที่อ้างอิง', f.filled ? 'MRP-2569-0412' : '', { placeholder: 'เช่น เลขที่ใบแจ้งซ่อม หรือแผนบำรุงรักษา', optional: true })]),
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
