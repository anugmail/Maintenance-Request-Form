/* ⚠ ไฟล์นี้ประกอบอัตโนมัติจาก plugin-lib/core.js + contractor-eval-plugin/screens.js ด้วย build-plugin.js — แก้ที่ต้นทางแล้วรัน  node figma-export/build-plugin.js contractor-eval-plugin  (2026-11-13) */

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
  if (MOB) { await sheet(scr, { title: o.title, content: [].concat(...o.fields.map(f => f.pair || [f])).map(f => f.area ? area(f.label, f.value) : field(f.label, f.value, { optional: f.optional })), ok: o.ok || 'บันทึก', cancel: o.cancel }); return; }
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
    if (inp) setProps(inp, { 'Label text': f.label, Text: f.value || f.placeholder || '', Optional: !!f.optional, Helper: false, 'Info icon': false, 'Show Placeholder': !f.value });
    if (inp) syncLabel(inp, f.label, f.optional);   // ป้ายที่เห็นคือ Input label ที่ซ้อน (ตาม Overhaul) — เดิมไม่ตั้ง ป้ายเลยค้าง "ผู้ใช้ยานพาหนะ" ของไลบรารี
    const ct = inp && !f.area && find(inp, 'Container'), tv = ct && ct.findOne(n => n.type === 'TEXT' && n.visible !== false);
    if (tv && f.value && tv.characters !== f.value) await text(ct, tv, f.value);   // 3 พ.ย. 2569 ไฟล์จริงช่องขึ้นว่าง — ค่าที่เห็นไม่ตรง property ก็ใส่ที่ข้อความโดยตรง
  }
  /* ปุ่มของ Modal Type=Form อยู่ใน Modal footer > Actions > "Primary and secondary actions" (ไม่ใช่ลูกของ Actions ตรงๆ) — เดิมกรองแค่ parent = Actions ปุ่มหลักเลยค้างคำของไลบรารี
     (ชีตลูกค้า 5 พ.ย. 2569: popup ตีกลับขึ้น "บันทึก" แทน "ตีกลับ" · popup ระบุอะไหล่เพิ่มเติมขึ้น "บันทึก" แทน "เพิ่ม") */
  const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && (n.parent.name === 'Actions' || n.parent.name === 'Primary and secondary actions'));
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
  if (acts) { let first = true; for (const b of acts.children) {
    if (b.name === 'Secondary button' && first && o.add) { first = false; setProps(b, { Text: o.add, 'Leading icon': true, 'Trailing icon': false, 'Leading icon swap': icon('add-24-300-round') }); const p = find(b, 'Pill outline'); if (p) p.visible = false; }   // o.add = ปุ่มเพิ่มแทนตัวกรอง (ฟอร์มแผนแท็บไตรมาส 12 พ.ย. 2569)
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
/* ชื่อเฟรมจอ "MT / A.3 · S1 — ชื่อ" · เรื่องย่อย "MT / A1.3 · S1 — ชื่อ" (R108) · บล็อกย่อยตามประเภทงาน "CE / B1.5 · S2 งานซ่อม — ชื่อ" (13 พ.ย. 2569 เดิมไม่ตรง ⇒ จอพวกนี้ไม่ถูกส่งไป FigJam)
   กลุ่ม: 1 prefix · 2 ตัวอักษรบล็อก · 3 เลขเรื่องย่อย (ว่างได้) · 4 ลำดับจอ · 5 scenario · 6 ชื่อบล็อกย่อย (ว่างได้) · 7 ชื่อจอ */
const SHOT_RE = /^(\S+) \/ ([A-Z])(\d*)\.([0-9.]+) · (S\d+)(?: ([^—]+?))? — (.+)$/;
async function exportShots(dir, scen, titles) {   // titles = { S1: 'ชื่อ scenario' } ใส่ใน manifest ให้ตัวสร้างบอร์ดตั้งชื่อ section (13 พ.ย. 2569 แบบประเมิน)   // scen = ['S1', 'S2'] ส่งเฉพาะ scenario ที่ติ๊ก (ว่าง = ทุกจอ · 9 พ.ย. 2569 เจ้าของงาน "อยากแยกการ export figjam ออกเป็น S เหมือนกันได้หรือไม่")
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
  if (dir === 'flow-maintainance') log('ขั้นต่อไป: node figma-export/3-figjam-board.js --maintainance-ui --only --split-scen --out=board-maintainance-ui.json (ชุดเต็ม + แยกไฟล์ราย S) แล้วเปิดปลั๊กอินบอร์ดใน FigJam ใหม่ เลือกกลุ่ม "บำรุงรักษาตามวาระ · ราย scenario"');
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

/* GROUPS = [{ code: 'A', title: '…', subs: [{ code: 'A', title: '…', tag: 'S1', screens: [[label, fn, 'D1 D2'?], …] }] }]
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
    const nCols = Math.max(...g.subs.map(s => s.screens.length));
    const top = y;
    CREATED = []; put(await flowBar(prefix, g.code, g.title, 'Default', nCols * GRID.colW + (nCols - 1) * GRID.colGap), x0, y);   // บล็อกตัวอักษร = Subheader State=Default (หน้าจริง: "A แก้ไขตารางบำรุงรักษา…")
    y += GRID.barH + GRID.gap;
    let flowBottom = top;
    const flowDone = new Set();   // บล็อกที่แบ่งเรื่องย่อย (A1 A2 …) ใช้ scenario เดียวกัน ⇒ ผังข้างจอวางครั้งเดียวต่อบล็อก (12 พ.ย. 2569)
    for (const sub of g.subs) {
      const n = sub.screens.length, w = n * GRID.colW + (n - 1) * GRID.colGap;
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
      /* ป้าย state รายคอลัมน์ = Header Subheader สีตาม stateTone (หน้าจริงของ UI Release#2 · 10 พ.ย. 2569) · บรรทัดอธิบายซ่อนแบบหน้าจริง
         ป้าย Device สูงเท่าป้าย state ที่สูงสุด */
      let sh = GRID.barH;
      for (const [i, [label]] of sub.screens.entries()) {
        const b = put(await flowBar(prefix, sub.code + '.' + (i + 1), label, stateTone(label), GRID.colW), x0 + i * pitch, y);
        sh = Math.max(sh, b.height);
      }
      put(await deviceLabel(prefix, 'Header', sh), 0, y);
      y += sh + GRID.gap;
      for (const mob of (opts.devices || [false, true])) {   // devices: [false]=desktop อย่างเดียว · [true]=mobile อย่างเดียว · ไม่ส่ง=ทั้งคู่ (แถว mobile ใต้ desktop)
        MOB = mob; let h = 0; const rowY = y;
        for (const [i, [label, fn]] of sub.screens.entries()) {
          const x = x0 + i * pitch;
          CREATED = []; PLACE = { x, y: rowY };   // เฟรมจอไปอยู่ตำแหน่งจริงทันทีที่สร้าง · ชิ้นที่สร้างระหว่างทางถูกติดตามไว้
          try {
            PINS = []; const s = await fn(); stripDividers(s); await polish(s); repin(); await bindTones(); if (typeof AFTER_SCREEN === 'function') await AFTER_SCREEN(s);   // AFTER_SCREEN = ตัวเรียกเฉพาะปลั๊กอิน (บำรุงรักษา: ลิงก์เลขทะเบียน 6 พ.ย. 2569)
            s.name = prefix + ' / ' + sub.code + '.' + (i + 1) + ' · ' + sub.tag + ' — ' + label + (mob ? ' · mobile' : '');
            if (s.setPluginData) s.setPluginData('builtAt', String(Date.now()));   // ส่งภาพไป FigJam เลือกจอที่สร้างล่าสุดตามเวลานี้ (exportShots · 9 พ.ย. 2569)
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

/* ======================== contractor-eval-plugin/screens.js ======================== */
/* ============================================================================
   Maintain-D — ประเมินผู้รับจ้าง (อู่/ศูนย์บริการ) ต่อ 1 ใบสั่งจ้าง · จอจาก component จริง
   ----------------------------------------------------------------------------
   เจ้าของงานสั่ง 22 ต.ค. 2569: "ลองออกแบบ จอ figma" — เนื้อหาจากแบบประเมินผู้รับจ้าง (Excel SharePoint isan · 6 หมวด 20 ข้อ เต็ม 100)
   หน้าตาอิงเมนู "ประเมินพนักงานขับรถ" ของ VMS+ เดิม (2 แท็บ · ดาว 1–5 · Modal ยืนยัน · toast พร้อมเลขอ้างอิง)
   เคาะ 22 ต.ค. 2569: ช่องคะแนน = component `Rating` ของไลบรารี (ดาว · ไม่ใช่ Radio text card แบบ RepairFeedback ของงานซ่อม) ·
   ปลั๊กอินแยก วางบนหน้า "ประเมินผู้รับจ้าง" ต่อใต้ของเดิม (ไม่มีก็สร้าง)
   สเปก: Diagram/07-ประเมินผู้รับจ้าง/01-ออกแบบ-…-VMS+เดิม.md · ข้อประเมิน: 02-ข้อประเมินผู้รับจ้าง-6หมวด-20ข้อ.csv · ต้นแบบ HTML: design-mock/contractor-eval.html
   กติกา: plan.md หัวข้อ 🎯 + component-rules.md (R1–R26) · ตารางทุกตัว = component Table (R25) · 1 scenario = 1 บล็อก (R19)
   ตีความเอง (รอเคาะ Q1–Q7 ของสเปก): ผู้ตรวจประเมิน = กบค. · ดาวเริ่มว่าง ปุ่มบันทึกกดได้เมื่อครบ 20 ข้อ · บันทึกแล้วแก้ไม่ได้
   ข้อความคำถามใช้ `Input label` (ป้ายของช่องกรอก) · หน้าดูผลใช้ Table ต่อหมวด (ข้อ · รายการ · คะแนน)
   22 ต.ค. 2569 — เจ้าของงานสั่ง "กับส่วนที่ต้องอัพโหลด อนุมัติ ไม่มี" ⇒ ไม่มีส่วนแนบแบบประเมินที่ลงนามแล้ว (S3 เหลือจอผลประเมินจอเดียว) · ตอบ Q4 ของสเปก
   22 ต.ค. 2569 — เจ้าของงานสั่ง "แค่มี หมายเหตุ แค่ล่างสุดอย่างเดียว แต่ละข้อไม่ต้องให้เพิ่มหมายเหตุได้" ⇒ ไม่มีปุ่ม "เพิ่มหมายเหตุ"/ช่องหมายเหตุรายข้อ · ตารางหน้าดูผลไม่มีคอลัมน์หมายเหตุ · หมายเหตุมีช่องเดียวท้ายฟอร์ม
   22 ต.ค. 2569 ดึก — style ตามหน้าจริง https://vmsplus-dev.pea.co.th/driver-evaluation (เจ้าของงานล็อกอินให้อ่าน · "เอาแค่ style มาเฉยๆ เนื้อหายังใช้ตามเอกสาร"):
     รายการไม่มีช่องค้นหา (แท็บ + ตาราง) · คอลัมน์แรก # · ท้ายแถวยังไม่ได้ประเมิน = ไอคอนดาว (หน้าจริงเป็นปุ่ม "★ ประเมิน" — Table cell ของไลบรารีไม่มีช่องปุ่ม ใช้ Action icons ดาวแทน · รอเคาะ)
     ฟอร์ม: หัวหมวด = Featured icon สีหลัก + ชื่อหมวด (หน้าจริงมีไอคอนต่อข้อ) · ข้อ = ข้อความตัวหนา แล้วดาว 5 ดวงใต้ข้อความ
     เจ้าของงานเลือก: ฟอร์มยังเป็นหน้าเต็ม (ไม่ใช่ modal 500 แบบหน้าจริง) · ดาวเริ่มว่าง ต้องกดครบ 20 ข้อ (หน้าจริงเริ่ม 5 ดวง)
   5 พ.ย. 2569 (R76) — เจ้าของงานสั่งแยก display ตามประเภทงาน + "สร้าง script การสร้างออกจากกัน":
     กล่อง "ข้อมูลผู้รับจ้าง" = `displayFor(type)` ช่องตามข้อมูลจริงของแต่ละงาน (ที่มารายช่อง ไฟล์นอกรีโป db-schema/map-09-ประเมินผู้รับจ้าง-ข้อมูลผู้รับจ้างตามประเภทงาน.md (มีชื่อตาราง DB จริง ไม่เก็บในรีโป public))
     S2 ฟอร์มประเมิน · S3 ดูผล แยกบล็อกย่อยตามประเภทงาน B1/C1 งานซ่อม · B2/C2 งานบำรุงรักษา · B3/C3 งาน Overhaul · ปุ่มสร้างแยกประเภท (build-repair · build-pm · build-oh)
     ข้อประเมิน 20 ข้อ · ดาว · หมายเหตุ · สรุปคะแนน · Modal · toast ใช้ร่วมกันทุกประเภท
   ============================================================================ */

const PLUGIN = { prefix: 'CE', page: 'ประเมินผู้รับจ้าง', menu: 'ประเมินผู้รับจ้าง', searchHint: 'ค้นหาเลขใบสั่งจ้าง, ชื่อผู้รับจ้าง' };

/* ---------- component ที่ใช้ — ขาดตัวไหนหยุด (ไลบรารี) · NESTED = ชิ้นซ้อนใน component อื่น · LOCAL_OPTIONAL = ป้ายของทีมออกแบบ ไม่มีก็วาดแถบธรรมดา ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Featured icon',
  'Table pagination', 'Text input', 'Text area', 'Input label', 'Alert', 'Tabs', 'Rating',
  'Primary button', 'Secondary button', 'Background overlay', 'Modal', 'Notification', 'Empty state/Data empty',
  'add-24-300-round', 'filter_list-24-400-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round', 'quick_reference_all-24-300-round', 'schedule-24-300-round',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header'];
const NESTED = ['Nav button', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Tertiary button',
  '_Content item base', 'Badge outline', 'Pill outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Tab item', '_Rating star base',
  'garage_home-24-300-round', 'car_repair-24-300-round', 'groups-24-300-round', 'call-24-300-round', 'search_check-24-300-round', 'star-24-300-round'];   // ไอคอนหมวด/ปุ่มดาว — นำเข้าไม่ได้ = Featured icon ใช้ไอคอนตั้งต้น (ไม่หยุด ไม่เตือน)
const LOCAL_OPTIONAL = ['Device Type', 'Component 1', 'Header'];   // ป้าย Device/Desktop/Mobile + แถบรหัส flow ชุดเดียวกับ Overhaul/บำรุงรักษา
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี (ดัมป์ 19 ต.ค. 2569) — รูปแบบบรรทัดต้องเหมือน KEYS ใน core ("ชื่อ": ["key", set]) เพราะ test harness อ่านด้วย regex */
Object.assign(KEYS, {
  "Rating": ["1d3c2e045977bc6b2b407cdd2c82eb43dc00325a", true],
  "_Rating star base": ["51d4e5f5f09b643b0816d27100d99a9bf08432f5", true],
  "schedule-24-300-round": ["a2a51c1f870eac9f78166d8ff258c826d8b5ecf1", false],
  "garage_home-24-300-round": ["d7a761b13980dd20ac94a5cc377d5e1d30677bc0", false],
  "car_repair-24-300-round": ["1e59e85c3ba457b3fbc4ea88a7eacba331ca23c7", false],
  "groups-24-300-round": ["16f9e5ce96b0b738a6cc2e87a7500a6898ac28ae", false],
  "call-24-300-round": ["117dd21b39fd7f89391fa783e220ad32b61746e2", false],
  "search_check-24-300-round": ["230bb3b003a72d41a3649ee10760711ec3846d87", false],
  "star-24-300-round": ["ecf8821fb00ba65575f6814101291f6166e00aa6", false]
});
/* ไอคอนหมวด (หน้าจริงมีไอคอนสีหลักต่อข้อ · เรามี 20 ข้อ จึงใส่ต่อหมวด) */
const GROUP_ICON = ['garage_home-24-300-round', 'car_repair-24-300-round', 'groups-24-300-round', 'call-24-300-round', 'search_check-24-300-round', 'schedule-24-300-round'];   // 22 ต.ค. ดึก: เลือกจากไอคอนที่มี instance ในไฟล์ Maintain-D จริง (apartment/build นำเข้าไม่ได้ในไฟล์จริง ขึ้นเป็น info)

/* ---------- ข้อประเมิน (ลอกจาก Excel — ตรงกับ Diagram/07-ประเมินผู้รับจ้าง/02-…csv) ---------- */
const GROUPS_Q = [
  ['สถานประกอบการ', [
    'ได้รับการรับรองระบบคุณภาพมาตรฐาน (ISO หรือ Authorized Service หรือ มาตรฐานฝีมือแรงงานแห่งชาติ โดยกรมพัฒนาฝีมือแรงงาน)',
    'มีขนาดพื้นที่ปฏิบัติงานเพียงพอรองรับงานซ่อม เป็นระเบียบ สะอาด',
    'พื้นที่ปฏิบัติงานมีความปลอดภัยในการจัดเก็บทรัพย์สินระหว่างซ่อม']],
  ['เครื่องมืออุปกรณ์', [
    'ความพร้อมของเครื่องมืออุปกรณ์',
    'เครื่องมืออุปกรณ์มีการบำรุงรักษา/การสอบเทียบ',
    'มีอุปกรณ์ความปลอดภัยครบถ้วนเหมาะสมกับลักษณะงาน ขณะให้บริการ']],
  ['ผู้ปฏิบัติงาน', [
    'ผู้ปฏิบัติงานปฏิบัติถูกต้องตามข้อกำหนด/ระเบียบของ กฟภ.',
    'ผู้ปฏิบัติงานปฏิบัติตามมาตรฐาน ข้อกำหนด คู่มือ กฎหมาย พรบ. และประกาศของทางราชการ',
    'พนักงานได้รับการฝึกอบรมทักษะการปฏิบัติงานมีความเข้าใจและรอบรู้ในงาน',
    'มีมนุษย์สัมพันธ์ดี แต่งกายสุภาพ สะอาด']],
  ['การให้บริการ', [
    'ความสะดวกรวดเร็วในการติดต่อ สามารถอธิบาย ให้คำแนะนำการให้บริการ',
    'สามารถแก้ไขปัญหาเกี่ยวกับการให้บริการได้ทันที',
    'มีความพร้อมกรณีมีความต้องการใช้บริการเร่งด่วน',
    'มีบริการหลังการส่งมอบงาน']],
  ['คุณภาพของผลงาน', [
    'อะไหล่อุปกรณ์ที่ใช้มีคุณภาพตรงตามข้อกำหนดการจ้าง มีเอกสารให้ตรวจสอบ',
    'คุณภาพงานตรงตามรายละเอียดที่กำหนดโดยไม่ต้องแก้ไข',
    'เอกสาร/รายงาน/ข้อเสนอแนะประกอบผลงาน ถูกต้องครบถ้วน',
    'มีการรับประกันผลงาน']],
  ['การส่งมอบงาน', [
    'ส่งมอบงาน ตรงตามกำหนดเวลา',
    'ความถูกต้องของเอกสารประกอบในการส่งมอบ']]];
const LEVEL = ['', 'ต้องปรับปรุงมาก', 'ต้องปรับปรุง', 'พอใช้', 'ดี', 'ดีมาก'];   // ชื่อระดับ — รอเคาะ Q6 (แบบกระดาษเขียนแค่ "1 - 5")
const QN = GROUPS_Q.reduce((n, g) => n + g[1].length, 0);   // 20

/* ---------- ข้อมูลตัวอย่าง (ค่าสมมติทั้งหมด) ----------
   22 ต.ค. 2569 ดึก เจ้าของงาน: "คอลัมน์ตารางพวกคนขับรถ ให้เอาบริบทของงานบำรุงรักษา งานซ่อมมาทำ — ตัวอย่างที่ให้ไปดูเป็นการจองรถ บริบทจะไม่เหมือนกัน"
   ⇒ ผู้รับจ้างถูกประเมินต่อ 1 งานจ้าง ได้ทั้ง งานซ่อม (ส่งอู่ · อ้างใบแจ้งซ่อม) · บำรุงรักษาตามวาระ (แผนเดินทางจ้างดำเนินการ S9 · อ้างเลขที่ MR) · Overhaul (PO · อ้างแผน)
   5 พ.ย. 2569 เจ้าของงาน: "ส่วนที่เป็น display เป็นส่วนที่มีความแตกต่างกันของงาน … ต้องแยกการแสดงที่แตกต่างกัน อยากให้ไปอ่าน code ของการเก็บข้อมูล repo be fe … แล้ว สร้าง script การสร้างออกจากกัน"
   ⇒ กล่อง "ข้อมูลผู้รับจ้าง" แยกตามประเภทงาน (`DISPLAY` · `displayFor()` · R76) · ค่าตัวอย่างตรงกับปลั๊กอิน Overhaul / บำรุงรักษา และงานซ่อมของ Maintain-D
   ที่มารายช่อง (ตาราง/คอลัมน์ใน code-maintainD หรือแบบของเรา): ไฟล์นอกรีโป db-schema/map-09-ประเมินผู้รับจ้าง-ข้อมูลผู้รับจ้างตามประเภทงาน.md (มีชื่อตาราง DB จริง ไม่เก็บในรีโป public) */
const EVALUATOR = 'นางสาวกนกวรรณ ใจมั่น (กบค.)';
const TODAY = '24/11/2569';   // วันที่ประเมินในตัวอย่าง — หลังวันส่งมอบงานของทั้ง 3 ประเภท (แผนเดินทางจ้างบำรุงรักษา 17–21/11/2569 ตามปลั๊กอินบำรุงรักษา TRIP_V)
const JOB = { repair: ['งานซ่อม', 'Info'], pm: ['บำรุงรักษา', 'Success'], oh: ['Overhaul', 'Brand'] };
const TYPES = ['repair', 'pm', 'oh'];   // ลำดับคงที่ — รหัสบล็อกย่อย B1 B2 B3 / C1 C2 C3 ตามลำดับนี้ (สร้างแยกประเภทแล้วรหัสไม่เลื่อน)
const TYPE_TITLE = { repair: 'งานซ่อม', pm: 'งานบำรุงรักษา', oh: 'งาน Overhaul' };
/* หัวหน้าดูผล ต้องขึ้นต้น "หมายเลข" (R11 หน้า Detail) — เลขหลักของงานจ้างแต่ละประเภท */
const KEY_TITLE = { repair: 'หมายเลขใบแจ้งซ่อม', pm: 'หมายเลขสัญญา/ใบสั่งจ้าง', oh: 'หมายเลขใบสั่งจ้าง' };

/* งานที่รอประเมิน 1 ใบต่อประเภท — po = ช่อง "ใบสั่งจ้าง" ของหน้ารายการ (งานซ่อมไม่มีในข้อมูลจริง = "-" · ยังไม่เคาะ) · key = เลขหลักที่ใช้ในหัวหน้า/toast */
const REC = {
  repair: {   // งานซ่อมส่งอู่ — ข้อมูลใบแจ้งซ่อม (ใบแจ้งซ่อม Maintain-D) + ข้อมูลงานซ่อมที่ศูนย์บริการ (งานซ่อมที่ศูนย์บริการ) · ไม่มีใบสั่งจ้าง/สัญญา/ที่อยู่อู่
    po: '-', key: 'MTD-691003-014', vendor: 'อู่ ช.เจริญยนต์ ขอนแก่น', ref: 'ใบแจ้งซ่อม MTD-691003-014', plate: '82-1145 ขอนแก่น', delivered: '15/10/2569',
    job: 'MTD-691003-014', repairNo: 'RAM000245', invoice: 'R202510147', due: '14/10/2569  17:00', done: '15/10/2569  16:30', warranty: '90 วัน' },
  pm: {       // แผนเดินทางจ้างดำเนินการ (S9) ของปลั๊กอินบำรุงรักษา TRIP_V — แผน MRZ7000001 ไตรมาส 1 รถ 6 คัน
    po: 'สจ.69-0142', key: 'สจ.69-0142', vendor: 'บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด', ref: 'MRZ7000001', plate: '80-5738 น่าน +5 คัน', delivered: '21/11/2569',
    addr: 'อ.บางพลี สมุทรปราการ', mr: 'MRZ7000001', trip: 'จ้างบำรุงรักษา น่าน เชียงใหม่ เชียงราย', period: '17/11/2569 – 21/11/2569', cars: '6 คัน' },
  oh: {       // Purchase Order ของปลั๊กอิน Overhaul — PO-690201 แผน ORZ6900002 รถ 72-6648 สงขลา ปิดงาน 5 ต.ค. 2569 ประกัน 360 วัน ถึง 30 ก.ย. 2570
    po: 'PO-690201', key: 'PO-690201', vendor: 'บริษัท มิตซูบิชิ ฟูโซ่ ทรัค จำกัด', ref: 'แผน ORZ6900002', plate: '72-6648 สงขลา', delivered: '05/10/2569',
    addr: 'อ.บางพลี สมุทรปราการ', poName: 'ซ่อมระบบไฮดรอลิกกระเช้า', plan: 'ORZ6900002', cars: '1 คัน', contract: '01/09/2569 – 31/10/2569', closed: '05/10/2569', warranty: '360 วัน · ถึง 30/09/2570' },
};
const PENDING = TYPES.map(t => Object.assign({ type: t }, REC[t]));
/* ประเมินแล้วก่อนหน้า (แท็บประเมินแล้ว) — po · ผู้รับจ้าง · ประเภทงาน · ทะเบียนรถ · วันที่ประเมิน · คะแนน */
const DONE = [
  { po: '-', vendor: 'อู่ ช.เจริญยนต์ ขอนแก่น', type: 'repair', plate: '82-6789 ขอนแก่น', date: '27/09/2569', score: 88 },
  { po: 'PO-680101', vendor: 'บริษัท ฮีโน่ มอเตอร์ส เซลส์ จำกัด', type: 'oh', plate: '71-9902 ขอนแก่น +1 คัน', date: '08/01/2569', score: 92 }];   // PO-680101 แผน ORZ6800001 ปิดงาน 20 ธ.ค. 2568 (ปลั๊กอิน Overhaul)
const FULL = [5, 4, 4, 5, 4, 5, 4, 5, 4, 4, 5, 4, 4, 3, 5, 4, 5, 4, 4, 5];   // ฟอร์มกรอกครบ = 87
const PART = FULL.slice(0, 12);                                             // กรอกไป 12 ข้อ = 53
const REMARK = {   // [หมายเหตุตอนกรอกบางข้อ, หมายเหตุตอนกรอกครบ] — ถ้อยคำตามบริบทงาน
  repair: ['พื้นที่จอดรถรอซ่อมได้ 2 คัน รถคันที่ 2 ต้องจอดนอกอาคาร', 'งานเรียบร้อย ควรเพิ่มพื้นที่จอดรถรอซ่อม'],
  pm: ['วันแรกผู้รับจ้างมาถึงจุดรวมงานช้ากว่านัด 1 ชั่วโมง', 'ทำงานครบ 6 คันตามช่วงวันทำงาน ควรแจ้งรายชื่อช่างล่วงหน้า'],
  oh: ['อู่แจ้งความคืบหน้าทุกสัปดาห์ตามที่นัดไว้', 'งานเรียบร้อย ควรส่งรายการอะไหล่ที่เปลี่ยนพร้อมรถ']};
const justDone = (t) => ({ po: REC[t].po, vendor: REC[t].vendor, type: t, plate: REC[t].plate, date: TODAY, score: sum(FULL) });
const sum = (a) => a.reduce((t, x) => t + (x || 0), 0);
const avg = (a) => a.length ? (sum(a) / a.length).toFixed(2) : '-';

/* ---------- กล่อง "ข้อมูลผู้รับจ้าง" แยกตามประเภทงาน (R76 · 5 พ.ย. 2569) ----------
   component เดิม (Section header/label + กล่อง Content > Content item row · R12) — ต่างกันแค่ช่อง
   ใส่เฉพาะช่องที่ข้อมูลจริง (code-maintainD · DB) หรือแบบบำรุงรักษา/Overhaul ของเรามี · ช่องที่ไม่มีที่มาไม่แสดง ไปอยู่ "ยังไม่เคาะ" ของ ไฟล์นอกรีโป db-schema/map-09-ประเมินผู้รับจ้าง-ข้อมูลผู้รับจ้างตามประเภทงาน.md (มีชื่อตาราง DB จริง ไม่เก็บในรีโป public)
   ป้ายตามระบบเดิม: งานซ่อม = ป้ายของ Repair section / RP & MA Job ใน UI Release#2 (หมายเลขงานซ่อม · วันที่ / เวลาที่… · เลขที่ใบแจ้งหนี้ · ระยะเวลารับประกัน)
   บำรุงรักษา = ป้ายของ tripKv() ปลั๊กอินบำรุงรักษา · Overhaul = ป้ายของ poDetail()/PO_COLS ปลั๊กอิน Overhaul + "ใบสั่งจ้างเลขที่" ของแบบประเมินกระดาษ */
const DISPLAY = {
  repair: (r) => [['ผู้รับจ้าง', r.vendor], ['ประเภทงาน', JOB.repair[0]], ['เลขที่ใบแจ้งซ่อม', r.job], ['หมายเลขงานซ่อม', r.repairNo], ['ทะเบียนรถ', r.plate],
    ['เลขที่ใบแจ้งหนี้', r.invoice], ['วันที่ / เวลาที่คาดว่าจะซ่อมเสร็จ', r.due], ['วันที่ / เวลาที่ซ่อมเสร็จ', r.done], ['ระยะเวลารับประกัน', r.warranty]],
  pm: (r) => [['ผู้รับจ้าง', r.vendor], ['ที่อยู่', r.addr], ['ประเภทงาน', JOB.pm[0]], ['เลขที่สัญญา/ใบสั่งจ้าง', r.po], ['เลขที่ MR', r.mr], ['ชื่อแผนเดินทาง', r.trip],
    ['ช่วงวันทำงาน', r.period], ['รถในแผนเดินทาง', r.cars]],
  oh: (r) => [['ผู้รับจ้าง', r.vendor], ['ที่อยู่', r.addr], ['ประเภทงาน', JOB.oh[0]], ['ใบสั่งจ้างเลขที่', r.po], ['ชื่อ Purchase Order', r.poName], ['หมายเลขแผน', r.plan],
    ['จำนวนรถ', r.cars], ['ระยะสัญญา', r.contract], ['วันที่ปิดงาน', r.closed], ['ระยะเวลารับประกัน', r.warranty]],
};
/* o.form = ฟอร์มประเมิน ต่อท้ายด้วยช่องของแบบประเมินกระดาษ (วันที่ประเมิน · ผู้ตรวจประเมิน) · หน้าดูผลสองช่องนี้อยู่ในสรุปผล */
const displayFor = (type, rec, o) => DISPLAY[type](rec).concat(o && o.form ? [['วันที่ประเมิน', TODAY], ['ผู้ตรวจประเมิน', EVALUATOR]] : []);

/* ---------- หน้ารายการ (S1) — Tabs ยังไม่ได้ประเมิน / ประเมินแล้ว ตามเมนูประเมินพนักงานขับรถของ VMS+ เดิม ---------- */
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
const PEND_COLS = [['#', 64], ['ใบสั่งจ้าง', 150, 'Lead text'], ['ประเภทงาน', 140, 'Badge'], ['ผู้รับจ้าง', 0], ['เลขที่อ้างอิง', 0], ['ทะเบียนรถ', 190], ['วันที่ส่งมอบงาน', 160], ['ดำเนินการ', 104]];   // ตามหน้าจริง: # นำ · ไม่มีปุ่มเรียง · บริบทงานซ่อม/บำรุงรักษา
const pendRow = (r, i) => [String(i + 1), r.po, { pill: JOB[r.type] }, r.vendor, r.ref, r.plate, r.delivered, { icons: [has('star-24-300-round') ? 'star-24-300-round' : 'keyboard_arrow_right-20-400-round'] }];
const DONE_COLS = [['#', 64], ['ใบสั่งจ้าง', 150, 'Lead text'], ['ประเภทงาน', 140, 'Badge'], ['ผู้รับจ้าง', 0], ['ทะเบียนรถ', 190], ['วันที่ประเมิน', 140], ['คะแนน (เต็ม 100)', 200], ['', 60]];   // หน้าจริงมี "คะแนนเฉลี่ย" ดาว + ตัวเลข — ช่องตารางใส่ดาวไม่ได้ ⇒ ข้อความ · ผู้ตรวจประเมิน อยู่หน้าดูผล (ตารางไลบรารี 8 คอลัมน์)
const doneRow = (r, i) => [String(i + 1), r.po, { pill: JOB[r.type] }, r.vendor, r.plate, r.date, r.score + ' / 100 · เฉลี่ย ' + (r.score / 20).toFixed(2), { icons: ['quick_reference_all-24-300-round'] }];
async function listScreen(name, o) {
  o = o || {};
  const pend = o.pending || PENDING, done = o.done || DONE;
  const { scr, page } = await shell(name, { title: 'ประเมินผู้รับจ้าง' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs([['ยังไม่ได้ประเมิน', pend.length], ['ประเมินแล้ว', null]], o.tab || 0), 'h');
  const rows = o.tab ? done : pend;
  if (!rows.length) {   // ไม่มีรายการ — Empty state + ปุ่มไปแท็บประเมินแล้ว (แบบ ZeroRecord ของเว็บเดิม)
    const es = inst('Empty state/Data empty'); add(sec, es, 'h');
    await text(es, 'Text', 'ไม่มีรายการที่ต้องประเมิน');
    await text(es, 'Supporting text', 'ใบสั่งจ้างงานซ่อม บำรุงรักษา และ Overhaul จะเข้ามาที่นี่เมื่อผู้รับจ้างส่งมอบงานครบแล้ว');
    const pb = find(es, 'Primary button'); if (pb) pb.visible = false;
    const sb = find(es, 'Secondary button'); if (sb) setProps(sb, { Text: 'ดูรายการที่ประเมินแล้ว', 'Leading icon': false, 'Trailing icon': false });
    return scr;
  }
  add(sec, await tbl(o.tab ? DONE_COLS : PEND_COLS, rows.map((r, i) => (o.tab ? doneRow : pendRow)(r, i)), { pagination: rows.length }), 'h');
  return scr;
}

/* ---------- ฟอร์มประเมิน (S2) — หน้า Create ⇒ Section header (R3) · กล่องข้อมูลผู้รับจ้างตามประเภทงาน (R76) · ข้อประเมิน/ดาว/หมายเหตุ/สรุป ใช้ร่วมกันทุกประเภท ---------- */
/* 1 ข้อ (style หน้าจริง) = Input label ข้อความตัวหนา · แถวถัดไป Rating ดาว 5 ดวง (ไม่มีหมายเหตุรายข้อ) */
async function question(no, q, score) {
  const lb = inst('Input label'); lb.name = 'Input label';
  await text(lb, 'Label', no + '. ' + q);
  const op = find(lb, '(ถ้ามี)'); if (op) op.visible = false;
  const ic = find(lb, 'info-24-300-round'); if (ic) ic.visible = false;
  const tb = find(lb, 'Tertiary brand button'); if (tb) tb.visible = false;
  try {   // ข้อความยาวต้องตัดบรรทัด — ยืดป้ายเต็มช่องแล้วให้ข้อความสูงตามเนื้อหา (override ขนาดลูกใน instance)
    const left = find(lb, 'Left'), lt = find(lb, 'Label');
    if (left) left.layoutSizingHorizontal = 'FILL';
    if (lt) { lt.layoutSizingHorizontal = 'FILL'; lt.textAutoResize = 'HEIGHT'; }
    // 22 ต.ค. ดึก เจ้าของงานเจอบนมือถือ: Input label สูงตายตัว 24 ⇒ ข้อความหลายบรรทัดล้นขึ้นบนทับข้อก่อนหน้า — ให้ป้ายและกรอบ Left สูงตามข้อความ
    if (left) { left.counterAxisSizingMode = 'AUTO'; left.counterAxisAlignItems = 'MIN'; }   // กรอบแนวนอน ⇒ แกนรอง = ความสูง · AUTO = สูงตามข้อความ (ตั้งได้โดยไม่ต้องรอใส่ในกรอบแม่)
    lb.counterAxisSizingMode = 'AUTO'; lb.counterAxisAlignItems = 'MIN';
  } catch (e) { warn('ตัดบรรทัดข้อ ' + no, e); }
  const rt = inst('Rating', { Point: String(score || 0) }); rt.name = 'Rating';
  return col('Item', [lb, rt], 12);
}
/* หัวหมวด = Featured icon สีหลัก (ไอคอนหมวด) + Section header (ชื่อหมวด + คะแนนหมวด) */
async function groupHead(gi, title, badge) {
  const fi = inst('Featured icon', { Color: 'Brand', Size: 'md' });
  if (has(GROUP_ICON[gi])) setProps(fi, { 'Icon swap': icon(GROUP_ICON[gi]) });
  const sh = await section(title, { badge });
  const r = row('Group', [fi, sh], { hug: true, gap: 16, align: 'CENTER', keep: true });
  sh.layoutGrow = 1;
  return r;
}
async function evalForm(name, type, o) {
  o = o || {};
  const sc = o.scores || [], r = REC[type];
  const { scr, page } = await shell(name, { title: 'ประเมินผู้รับจ้าง ' + r.key, back: true, crumbs: [r.key] });
  const parts = [col('Section', [await section('ข้อมูลผู้รับจ้าง'), kv(displayFor(type, r, { form: true }))], 16),
    alertBox('Info', 'ให้คะแนนทุกข้อ 1 ถึง 5 ดาว', LEVEL.slice(1).map((l, i) => (i + 1) + ' ' + l).join(' · ') + ' · คะแนนรวมเต็ม 100 (20 ข้อ × 5) · หมายเหตุไม่บังคับ')];
  let k = 0;
  for (const [gi, [title, qs]] of GROUPS_Q.entries()) {
    const items = [];
    const gs = [];
    for (const [i, q] of qs.entries()) { k++; gs.push(sc[k - 1] || 0); items.push(await question(i + 1, q, sc[k - 1])); }
    const qcol = col('Questions', items, 24); if (!MOB) qcol.paddingLeft = 64;   // ข้อเยื้องตรงชื่อหมวด (ไอคอน 48 + ช่อง 16)
    parts.push(col('Section', [await groupHead(gi, title, sum(gs) + '/' + qs.length * 5), qcol], 16));
  }
  parts.push(col('Section', [await section('หมายเหตุ/ข้อเสนอแนะเพิ่มเติม'), area('หมายเหตุ/ข้อเสนอแนะเพิ่มเติม', o.remark || '', { optional: true, placeholder: 'ระบุหมายเหตุหรือข้อเสนอแนะ' })], 16));
  const n = sc.filter(Boolean).length;
  parts.push(col('Section', [await section('สรุปคะแนน'), kv([['ให้คะแนนแล้ว', n + ' / ' + QN + ' ข้อ'], ['คะแนนรวม', sum(sc) + ' / 100'], ['ค่าเฉลี่ย', n ? avg(sc.filter(Boolean)) + ' จาก 5' : '-'], ['ผลระดับ', 'รอเคาะเกณฑ์']])], 16));
  parts.push(btnRow([['Secondary button', 'ยกเลิก', { size: 'lg' }], ['Primary button', 'บันทึกการประเมิน', { size: 'lg', disabled: n < QN }]]));
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ---------- ดูผลประเมิน (S3) — หน้า Detail ⇒ Section label (R5/R11) · กล่องข้อมูลผู้รับจ้างตามประเภทงาน (R76) · ตารางต่อหมวด (ข้อ · รายการ · คะแนน) · หมายเหตุอยู่ในสรุปผล
   ผลของงานที่เพิ่งประเมินในบล็อก B ของประเภทเดียวกัน (คะแนน FULL = 87 · วันที่ TODAY) — ไม่สร้างใบสมมติเพิ่มต่อประเภท ---------- */
const DETAIL_COLS = [['ข้อ', 80], ['รายการประเมิน', 0], ['คะแนน', 160]];
async function resultScreen(name, type) {
  const r = REC[type], seen = FULL;
  const { scr, page } = await shell(name, { title: KEY_TITLE[type] + ' ' + r.key, back: true, crumbs: [r.key], badge: ['ประเมินแล้ว', 'Success'],
    actions: [['Secondary button', 'พิมพ์แบบประเมิน (PDF)']] });
  const parts = [col('Section', [await sectionLabel('ข้อมูลผู้รับจ้าง'), kv(displayFor(type, r))], 16)];
  const gsum = []; let k = 0;
  for (const [title, qs] of GROUPS_Q) { const a = seen.slice(k, k + qs.length); gsum.push([title, sum(a) + ' / ' + qs.length * 5]); k += qs.length; }
  parts.push(col('Section', [await sectionLabel('สรุปผลการประเมิน'), kv([['คะแนนรวม', sum(seen) + ' / 100'], ['ค่าเฉลี่ย', avg(seen) + ' จาก 5'], ['ผู้ตรวจประเมิน', EVALUATOR], ['วันที่ประเมิน', TODAY]]
    .concat(gsum, [['หมายเหตุ/ข้อเสนอแนะเพิ่มเติม', REMARK[type][1]]]))], 16));
  k = 0;
  for (const [gi, [title, qs]] of GROUPS_Q.entries()) {
    const rows = qs.map((q, i) => { k++; return [String(i + 1), q, seen[k - 1] + ' · ' + LEVEL[seen[k - 1]]]; });
    parts.push(col('Section', [await sectionLabel(title + ' ' + gsum[gi][1]), await tbl(DETAIL_COLS, rows)], 16));
  }
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ---------- รายการจอแยกตาม scenario · S2 S3 สร้างแยกตามประเภทงาน (R76 · เจ้าของงาน 5 พ.ย. 2569 "สร้าง script การสร้างออกจากกัน") ----------
   [ชื่อ scenario, จอ (ใช้ร่วม) | null, ตัวสร้างจอตามประเภท (type) => จอ | null] */
const formStates = (t) => {
  const r = REC[t], T = TYPE_TITLE[t], rm = REMARK[t];
  return [
    ['ฟอร์มประเมิน (ยังไม่ให้คะแนน)', () => evalForm('S2 ' + T + ' ฟอร์มว่าง', t, {})],
    ['ให้คะแนนบางข้อ + กรอกหมายเหตุท้ายฟอร์ม', () => evalForm('S2 ' + T + ' กรอกบางข้อ', t, { scores: PART, remark: rm[0] })],
    ['ให้คะแนนครบ 20 ข้อ', () => evalForm('S2 ' + T + ' กรอกครบ', t, { scores: FULL, remark: rm[1] })],
    ['ยืนยันการประเมิน', async () => { const s = await evalForm('S2 ' + T + ' ยืนยัน', t, { scores: FULL, remark: rm[1] }); await confirm(s, { title: 'ยืนยันการประเมิน', sub: 'คุณต้องการบันทึกคะแนนการประเมินสำหรับ ' + r.vendor + ' (' + r.key + ') ใช่หรือไม่? คะแนนรวม ' + sum(FULL) + ' / 100 · บันทึกแล้วแก้ไขไม่ได้', ok: 'ยืนยัน' }); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await evalForm('S2 ' + T + ' บันทึกไม่สำเร็จ', t, { scores: FULL, remark: rm[1] }); notify(s, 'บันทึกการประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง', true); return s; }],
    ['บันทึกสำเร็จ — ย้ายไปแท็บประเมินแล้ว', async () => { const s = await listScreen('S2 ' + T + ' บันทึกสำเร็จ', { tab: 1, pending: PENDING.filter(p => p.type !== t), done: [justDone(t)].concat(DONE) }); notify(s, 'ประเมินผู้รับจ้างสำเร็จ (' + r.key + ')'); return s; }],
    ['ยกเลิกระหว่างกรอก — ยืนยันการออก', async () => { const s = await evalForm('S2 ' + T + ' ยืนยันการออก', t, { scores: PART, remark: rm[0] }); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' }); return s; }]];
};
const resultStates = (t) => [['ผลประเมิน', () => resultScreen('S3 ' + TYPE_TITLE[t] + ' ผลประเมิน', t)]];
const SCENARIOS = [
  ['S1 · กบค. ดูรายการประเมินผู้รับจ้าง', [
    ['แท็บยังไม่ได้ประเมิน', () => listScreen('S1 ยังไม่ได้ประเมิน', { tab: 0 })],
    ['แท็บประเมินแล้ว', () => listScreen('S1 ประเมินแล้ว', { tab: 1 })],
    ['ไม่มีรายการที่ต้องประเมิน', () => listScreen('S1 ไม่มีรายการ', { tab: 0, pending: [] })]], null],
  ['S2 · กบค. ประเมินผู้รับจ้าง 1 งานจ้าง', null, formStates],
  ['S3 · กบค. ดูผลประเมิน', null, resultStates],
];

/* ---------- กลุ่ม = scenario (R19: 1 scenario = 1 บล็อก · A.1 A.2 = state) · ยังไม่มีผัง userflow (ไม่มี build.json)
   S2 S3 มีบล็อกย่อยตามประเภทงาน (แถบ Sub Flow): B1 งานซ่อม · B2 งานบำรุงรักษา · B3 งาน Overhaul (C1–C3 เช่นกัน) · ป้าย state B1.1 B1.2 …
   ตัวเลขบล็อกย่อยผูกกับ TYPES (ไม่ใช่ลำดับที่เลือก) ⇒ สร้างประเภทเดียวรหัสก็ยังเป็น B2 C2 ฯลฯ ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function groupsFor(idx, types) {
  types = TYPES.filter(t => (types || TYPES).indexOf(t) >= 0);
  return idx.map(i => {
    const [title, screens, perType] = SCENARIOS[i];
    const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
    const subs = perType
      ? types.map(t => ({ code: code + (TYPES.indexOf(t) + 1), title: rest + ' · ' + TYPE_TITLE[t], tag: tag + ' ' + TYPE_TITLE[t], screens: perType(t).map(([label, fn]) => [label, fn, '']) }))
      : [{ code, title: rest, tag, screens: screens.map(([label, fn]) => [label, fn, '']) }];
    return { code, title: tag + ' ' + rest, subs };
  }).filter(g => g.subs.length);
}
const ALL_IDX = SCENARIOS.map((_, i) => i);

/* ---------- สร้าง: Desktop · Mobile · เฉพาะ scenario ที่เลือก · เฉพาะประเภทงาน · เช็ค component — วางบนหน้า "ประเมินผู้รับจ้าง" ต่อใต้ของเดิม (ไม่มีก็สร้าง) ---------- */
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
  const codes = GRP.map(g => g.subs.map(s => s.code).join(' ')).join(' ');
  log('');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · ' + GRP.length + ' บล็อก ' + what + ' (' + codes + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓'));
  log('component ที่ใช้ (' + USED.size + '): ' + [...USED].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่ต้องสลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด — ฟอนต์ ' + (FALLBACK_FONT ? FALLBACK_FONT.family + ' ' + FALLBACK_FONT.style : '-'));
  reportOversize();
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
const typesOf = (o) => { const t = (o && o.types || []).filter(x => TYPES.indexOf(x) >= 0); return t.length ? t : TYPES; };   // ไม่ส่ง/ไม่ติ๊ก = ทุกประเภท
async function build(o) { await buildSet(groupsFor(ALL_IDX, typesOf(o)), 'scenario', devOf(o)); }
async function buildDesktop(o) { await buildSet(groupsFor(ALL_IDX, typesOf(o)), 'scenario · desktop', [false]); }
async function buildMobile(o) { await buildSet(groupsFor(ALL_IDX, typesOf(o)), 'scenario · mobile', [true]); }
async function buildPick(o) {   // ติ๊กเฉพาะบาง scenario · รหัสตัวอักษรคงเดิม (A–C) · S2 S3 ตามประเภทงานที่ติ๊ก
  const idx = (o.pick || []).map(Number).filter(i => i >= 0 && i < SCENARIOS.length);
  if (!idx.length) { log('ยังไม่ได้ติ๊ก scenario — ติ๊กอย่างน้อย 1 รายการแล้วกดอีกครั้ง'); return; }
  await buildSet(groupsFor(idx, typesOf(o)), 'scenario ที่เลือก', devOf(o));
}
/* ปุ่มสร้างแยกประเภทงาน (R76) — S2 ฟอร์มประเมิน + S3 ดูผล ของประเภทนั้นอย่างเดียว · หน้ารายการ S1 ใช้ร่วม สร้างจากปุ่ม "เฉพาะ scenario ที่เลือก" A */
async function buildType(t, o) {
  await buildSet(groupsFor([1, 2], [t]), TYPE_TITLE[t], devOf(o));
}

/* แบบประเมินความพึงพอใจ กบค. (XCHO) ในหน้าต่างเดียวกัน — เจ้าของงาน 12 พ.ย. 2569 "อยากให้เขียนเรื่องการประเมิน กบค มาใส่ในนี้"
   โค้ดจอมาจาก satisfaction-plugin/screens.js (build.json include · ไม่ก๊อป) · วางบนหน้า "ประเมินความพึงพอใจ" ของไฟล์นี้ (เรื่องแยกจากประเมินผู้รับจ้าง · R105)
   ตอนสร้าง สลับค่าที่ core อ่าน (PLUGIN prefix/page/menu/searchHint · ผัง flowchart · รายการ component) เป็นของแบบประเมินความพึงพอใจ แล้วคืนค่าเดิมเสมอ */
async function withInclude(key, fn) {
  const inc = INCLUDE[key];
  if (!inc) { log('✗ ไม่มี ' + key + ' ฝังมา — รัน node figma-export/build-plugin.js contractor-eval-plugin ใหม่'); return; }
  const keep = Object.assign({}, PLUGIN), act = ACTIVITY;
  const addNeed = inc.NEEDED.filter(n => NEEDED.indexOf(n) < 0), addNested = inc.NESTED.filter(n => !NESTED_ONLY.has(n) && NEEDED.indexOf(n) < 0);
  Object.assign(PLUGIN, inc.PLUGIN); ACTIVITY = inc.ACTIVITY; NEEDED.push(...addNeed); addNested.forEach(n => NESTED_ONLY.add(n));
  try { await fn(inc); }
  finally {
    Object.keys(PLUGIN).forEach(k => { if (!(k in keep)) delete PLUGIN[k]; }); Object.assign(PLUGIN, keep); ACTIVITY = act;
    addNeed.forEach(n => NEEDED.splice(NEEDED.indexOf(n), 1)); addNested.forEach(n => NESTED_ONLY.delete(n));
  }
}
/* ส่งภาพจอไป FigJam (13 พ.ย. 2569 เจ้าของงาน "อยาก export แบบประเมิน figjam") — แบบละโฟลเดอร์ out/figjam/<dir>/ ผ่าน serve.js แบบปุ่มของบำรุงรักษา
   เปิดหน้าของแบบนั้นก่อน (ประเมินผู้รับจ้าง / ประเมินความพึงพอใจ) แล้วส่งจอชุดล่าสุดทุกจอ (desktop + mobile) · ชื่อ scenario ใส่ manifest ให้ตัวสร้างบอร์ดตั้งชื่อ section */
const SHOT_DIR = { ce: 'flow-eval-contractor', sat: 'flow-eval-satisfaction' };
const titlesOf = (scen) => Object.fromEntries(scen.map(([t]) => [t.split(' · ')[0], t.split(' · ').slice(1).join(' · ')]));
async function shotsOn(pageName, dir, titles) {
  const pg = figma.root.children.find(p => p.name.trim() === pageName);
  if (!pg) { log('✗ ไม่พบหน้า "' + pageName + '" ในไฟล์นี้ — กดสร้างจอของแบบนี้ก่อน แล้วค่อยส่งภาพ'); return; }
  if (pg.loadAsync) await pg.loadAsync();
  await figma.setCurrentPageAsync(pg);
  await exportShots(dir, null, titles);
  log('ขั้นต่อไป: node figma-export/3-figjam-board.js --eval-ui --only แล้วเปิดปลั๊กอินบอร์ดใน FigJam เลือก "แบบประเมิน · ' + (dir === SHOT_DIR.ce ? 'ประเมินผู้รับจ้าง' : 'ประเมินความพึงพอใจ') + '"');
}
const SAT_BOTH = [false, true];   // ปุ่มทั้งชุดได้ flowchart + Desktop + Mobile ครบเสมอ (export ครบ 3 อย่าง 6 พ.ย. 2569)
if (figma.ui.resize) figma.ui.resize(460, 680);   // 13 พ.ย. 2569 หน้าต่างมี 2 แบบ (สลับที่หัว) ⇒ สูงขึ้นให้เห็นปุ่มครบ

figma.ui.onmessage = async (msg) => {
  try {
    const o = { devices: msg.devices, pick: msg.pick, types: msg.types };
    if (msg.type === 'build') await build(o);
    if (msg.type === 'build-desktop') await buildDesktop(o);
    if (msg.type === 'build-mobile') await buildMobile(o);
    if (msg.type === 'build-pick') await buildPick(o);
    if (msg.type === 'build-repair') await buildType('repair', o);
    if (msg.type === 'build-pm') await buildType('pm', o);
    if (msg.type === 'build-oh') await buildType('oh', o);
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
    if (msg.type === 'sat-build') await withInclude('SAT', (inc) => inc.buildSet(inc.groupsFor(inc.ALL_IDX), 'แบบประเมินความพึงพอใจ กบค.', SAT_BOTH));
    if (msg.type === 'sat-pick') await withInclude('SAT', (inc) => inc.buildPick(o));
    if (msg.type === 'shots-ce') await shotsOn(PLUGIN.page, SHOT_DIR.ce, titlesOf(SCENARIOS));
    if (msg.type === 'shots-sat') await withInclude('SAT', (inc) => shotsOn(inc.PLUGIN.page, SHOT_DIR.sat, titlesOf(inc.SCENARIOS)));
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]), types: TYPES.map((t, i) => [t, TYPE_TITLE[t], i + 1]) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก" + ประเภทงาน
Promise.resolve().then(() => { if (INCLUDE.SAT) figma.ui.postMessage({ type: 'sat-scenarios', items: INCLUDE.SAT.SCENARIOS.map(x => x[0]) }); });   // INCLUDE เติมท้าย code.js หลังบรรทัดนี้ ⇒ ส่งหลังโหลดครบ

/* ======================== ปลั๊กอินที่รวมเข้ามา (build.json include) ======================== */

/* ======================== include SAT = satisfaction-plugin/screens.js (ฝังตอน build) ======================== */
INCLUDE["SAT"] = (() => {
const ACTIVITY_INC = {"src":"Diagram/09-ประเมินความพึงพอใจ/02-ประเมินความพึงพอใจ-flowchart-กิจกรรม.md","title":"บำรุงรักษาตามวาระ — flowchart กิจกรรมราย scenario","w":2608,"h":2360,"scenarios":[{"n":1,"title":"ผู้ดูแลยานพาหนะ ดูรายการประเมินความพึงพอใจ","w":720,"h":1796,"nodes":[{"id":"S","kind":"end","label":"งานของยานพาหนะ\nปิดงานแล้ว","x":100,"y":140,"w":176,"h":176,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A1","kind":"step","label":"ระบบเพิ่มงานนั้น\nเข้ารายการ\nยังไม่ได้ประเมิน","x":100,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"step","label":"ระบบเติม\nหน่วยงานให้บริการ\nตามผู้ดำเนินการงาน","x":100,"y":620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A3","kind":"step","label":"ผู้ดูแลยานพาหนะ\nเปิดเมนู แบบประเมิน\nความพึงพอใจ","x":100,"y":860,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"มีงานที่ยัง\nไม่ได้ประเมินไหม","x":100,"y":1100,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A5","kind":"step","label":"ค้นหาหรือกรอง\nตามประเภทงาน\nหน่วยงานที่ให้บริการ","x":100,"y":1340,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E1","kind":"end","label":"เลือกงาน\nเพื่อประเมิน\n(S2)","x":100,"y":1580,"w":176,"h":176,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A4","kind":"step","label":"เปิดแท็บ\nประเมินแล้ว","x":420,"y":1340,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E2","kind":"end","label":"เปิดดูผล\n(S3)","x":420,"y":1580,"w":176,"h":176,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A1","label":"","back":false,"pts":[[188,316],[188,380]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[188,556],[188,620]]},{"from":"A2","to":"A3","label":"","back":false,"pts":[[188,796],[188,860]]},{"from":"A3","to":"Q1","label":"","back":false,"pts":[[188,1036],[188,1100]]},{"from":"Q1","to":"A5","label":"มี","back":false,"pts":[[188,1276],[188,1340]],"lab":[198,1280]},{"from":"A5","to":"E1","label":"","back":false,"pts":[[188,1516],[188,1580]]},{"from":"Q1","to":"A4","label":"ไม่มี","back":false,"pts":[[276,1188],[508,1188],[508,1340]],"lab":[288,1160]},{"from":"A4","to":"E2","label":"","back":false,"pts":[[508,1516],[508,1580]]}],"stickies":[],"gap":16,"x":64,"y":260},{"n":2,"title":"ผู้ดูแลยานพาหนะ ประเมินความพึงพอใจการให้บริการ 1 งาน","w":720,"h":2036,"nodes":[{"id":"S","kind":"end","label":"เลือกงานจากแท็บ\nยังไม่ได้ประเมิน\n(S1) หรือกดประเมิน\nหลังรับทราบผล","x":64,"y":140,"w":176,"h":176,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A1","kind":"step","label":"ดูข้อมูลงาน\nหน่วยงานให้บริการ\nและข้อมูลผู้ใช้รถฯ","x":64,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"step","label":"ให้ดาว 1 ถึง 5\nทีละข้อ 11 ข้อ\nใส่หมายเหตุถ้ามี","x":64,"y":620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q1","kind":"decision","label":"จะออกจาก\nหน้านี้ไหม","x":64,"y":860,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A5","kind":"step","label":"ยืนยันการออก\nข้อมูลที่กรอก\nไม่ถูกบันทึก","x":64,"y":1100,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E2","kind":"end","label":"กลับหน้ารายการ\n(S1)","x":64,"y":1340,"w":176,"h":176,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"Q2","kind":"decision","label":"ให้คะแนน\nครบทุกข้อแล้วไหม","x":384,"y":1100,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"A3","kind":"step","label":"กดบันทึก\nและยืนยัน\nการประเมิน","x":384,"y":1340,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"Q3","kind":"decision","label":"บันทึก\nสำเร็จไหม","x":384,"y":1580,"w":176,"h":176,"fill":{"r":0.8627451062202454,"g":0.800000011920929,"b":1},"stroke":{"r":0.529411792755127,"g":0.30980393290519714,"b":1}},{"id":"E1","kind":"end","label":"งานนั้นอยู่ในแท็บ\nประเมินแล้ว\n(S3)","x":384,"y":1820,"w":176,"h":176,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A1","label":"","back":false,"pts":[[152,316],[152,380]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[152,556],[152,620]]},{"from":"A2","to":"Q1","label":"","back":false,"pts":[[152,796],[152,860]]},{"from":"Q1","to":"A5","label":"ออก","back":false,"pts":[[152,1036],[152,1100]],"lab":[162,1040]},{"from":"A5","to":"E2","label":"","back":false,"pts":[[152,1276],[152,1340]]},{"from":"Q1","to":"Q2","label":"ไม่ออก","back":false,"pts":[[240,948],[472,948],[472,1100]],"lab":[252,920]},{"from":"Q2","to":"A2","label":"ยังไม่ครบ","back":true,"pts":[[560,1188],[584,1188],[584,708],[240,708]],"lab":[572,1160]},{"from":"Q2","to":"A3","label":"ครบ","back":false,"pts":[[472,1276],[472,1340]],"lab":[482,1280]},{"from":"A3","to":"Q3","label":"","back":false,"pts":[[472,1516],[472,1580]]},{"from":"Q3","to":"A3","label":"ไม่สำเร็จ","back":true,"pts":[[560,1668],[620,1668],[620,1428],[560,1428]],"lab":[572,1640]},{"from":"Q3","to":"E1","label":"สำเร็จ","back":false,"pts":[[472,1756],[472,1820]],"lab":[482,1760]}],"stickies":[],"gap":16,"x":944,"y":260},{"n":3,"title":"ผู้ดูแลยานพาหนะ ดูผลประเมินความพึงพอใจ","w":720,"h":1076,"nodes":[{"id":"S","kind":"end","label":"เปิดแท็บ\nประเมินแล้ว\n(S1)","x":260,"y":140,"w":176,"h":176,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}},{"id":"A1","kind":"step","label":"กดดูผล\nของงานที่\nประเมินแล้ว","x":260,"y":380,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"A2","kind":"step","label":"ดูคะแนนรวม\nคะแนนรายด้าน\nและรายข้อ","x":260,"y":620,"w":176,"h":176,"fill":{"r":0.7607843279838562,"g":0.8980392217636108,"b":1},"stroke":{"r":0.239215686917305,"g":0.6784313917160034,"b":1}},{"id":"E","kind":"end","label":"กลับหน้ารายการ\n(S1)","x":260,"y":860,"w":176,"h":176,"fill":{"r":1,"g":1,"b":1},"stroke":{"r":0.4588235318660736,"g":0.4588235318660736,"b":0.4588235318660736}}],"edges":[{"from":"S","to":"A1","label":"","back":false,"pts":[[348,316],[348,380]]},{"from":"A1","to":"A2","label":"","back":false,"pts":[[348,556],[348,620]]},{"from":"A2","to":"E","label":"","back":false,"pts":[[348,796],[348,860]]}],"stickies":[],"gap":16,"x":1824,"y":260}],"problems":[]};
/* ============================================================================
   Maintain-D — แบบประเมินความพึงพอใจ (XCHO) · เรื่องแยก · จอจาก component จริง
   ----------------------------------------------------------------------------
   เจ้าของงาน 12 พ.ย. 2569: "เรื่องการประเมินเป็นเรื่องแยกที่จะไปผูกตาม flow ต่างๆ เลยอยากแยกใว้"
     ⇒ ย้ายแบบประเมินความพึงพอใจออกจากปลั๊กอินบำรุงรักษา (เดิม S27 บล็อก Y · R94) มาเป็นปลั๊กอินแยก · งานซ่อม บำรุงรักษาตามวาระ Overhaul ผูกเข้ามาที่เรื่องนี้
   โครงจอ = เฟรมประเมินผู้รับจ้างของเจ้าของงาน (~/PEA/Maintain-D/userflow/figma-ref/contractor-eval-ABC-2569-11-12.txt บล็อก A B C)
     ยกโค้ดแบบ copy แล้วปรับจาก contractor-eval-plugin/screens.js (listScreen · evalForm · resultScreen) และบล็อก Y เดิมของ maintainance-plugin (satList · satForm · satResult) ไม่ import ข้ามปลั๊กอิน
   12 พ.ย. 2569 รอบ 2 — ข้อมูลและข้อความตรงกับต้นแบบเว็บ (รีโป maintenance-utility-vehicle commit db7bf4a · src/lib/mock/survey.ts · src/app/satisfaction/**)
     เว็บเป็นหลักของข้อมูลเรื่องนี้ · ข้อความบนจอสองฝั่งต้องเหมือนกันตรงตัว:
     รายการ = Table header ค้นหา "ค้นหาเลขที่งาน, ทะเบียน" + ตัวกรอง (ประเภทงาน · หน่วยงานที่ให้บริการ) · ฟอร์ม = หมายเหตุรายข้อ "หมายเหตุข้อ n" (ถ้ามี) + หมายเหตุท้ายฟอร์ม
     · ผล = ตารางรายด้าน ข้อ · รายการประเมิน · คะแนน "5 · ดีมาก" · หมายเหตุ · ชื่อเมนู/หัวหน้า "แบบประเมินความพึงพอใจ"
   เนื้อหา = แบบสำรวจ "VMS+" ของ กบค. ในระบบจัดการแบบฟอร์ม XCHO (ไฟล์ VMS+ _ Xcho-1…5.pdf) ลอกหัวข้อ คำถามตรงตัว
     ข้อมูลผู้ใช้รถฯ 5 ช่อง (ระบบเติมให้) · 4 ด้าน 11 ข้อ ดาว 1–5 (`Rating`) · ด้านละ 10/20/15/10 · รวมเต็ม 55 (ไม่แปลงเป็นร้อย) · ผลระดับ "รอเคาะเกณฑ์"
     ข้อความที่ลอกจากแบบสำรวจคง "ผู้ใช้รถฯ" "ทะเบียนรถ" · "รถกระเช้า" = ประเภทยานพาหนะจากข้อมูล Overhaul (allow ของ R105) · ข้อความของเราใช้ "ยานพาหนะ" (R80 ฉบับเรื่องนี้)
   ใครประเมิน (เจ้าของงาน 12 พ.ย. 2569): หน่วยงานของยานพาหนะ (ผู้ดูแลยานพาหนะ) หลังงานปิด · 1 แถว = 1 งานของยานพาหนะ 1 คัน
     ประเมิน "หน่วยงานที่ให้บริการ" — ระบบเติมให้ ฟอร์มเดียวกัน:
       งานซ่อม = กบค. · Overhaul = กบค. · บำรุงรักษาตามวาระ แผนที่ กบค. ดำเนินการ = กบค. · แผนของกองอื่น (กบผ. กปส. กรย. กส.1 กส.2) = กองที่ดำเนินการ
   ข้อมูลจำลอง = ชุดเดียวกับเว็บ (survey.ts seeds + ?sample=S27):
     ยังไม่ได้ประเมิน MRZ7100004 73-5019 เพชรบุรี (กบค.) · MRZ7000001 82-6789 ขอนแก่น (กบผ.) · งานซ่อม MTD-691003-014 82-1145 ขอนแก่น (กบค.) · Overhaul ORZ6900002 PO-690201 72-6648 สงขลา (กบค.)
     ประเมินแล้ว MRZ7000001 82-1145 ขอนแก่น (กบผ. · 47/55) · งานซ่อม MTD-690716-031 82-6789 ขอนแก่น (กบค. · 45/55) · MRZ6900011 80-4458 แพร่ (กรย. · 48/55)
   ที่มา: component Tabs · Table header · Table · Pill outline · Empty state/Data empty · Section header · Section label · Content item row · Alert · Featured icon · Input label · Rating
     · Text input · Text area · Input dropdown with badges · Side panel header/footer · Primary/Secondary button · Modal · Notification · Mobile table ของไฟล์ (Component) VMS Plus
     + หน้าประเมินผู้รับจ้าง (เฟรมเจ้าของงาน 12 พ.ย. 2569) + แผงตัวกรองของ Vehicle list หน้า 5.2 Vehicle Management ของ UI Release#2 (ชุดเดียวกับ S24 ของบำรุงรักษา) · ไม่มี component ใหม่
   กติกา: component-rules.md §5.1 (R19) · §5.43 (R105) · plan.md หัวข้อ 🎯
   ============================================================================ */

const PLUGIN = { prefix: 'SAT', page: 'ประเมินความพึงพอใจ', menu: 'แบบประเมินความพึงพอใจ', searchHint: 'ค้นหาเลขที่งาน, ทะเบียน' };   // menu = ชื่อเมนูชั้นบนใน Sidebar ของเว็บ (SAT_LABEL) · page = หน้า Figma เดิม

/* ---------- component ที่ใช้ — ชุดเดียวกับ contractor-eval-plugin + Table header/แผงตัวกรอง (ขาดตัวไหนหยุด) · NESTED = ชิ้นซ้อน · LOCAL_OPTIONAL = ป้ายของทีมออกแบบ ไม่มีก็วาดแถบธรรมดา ---------- */
const DIRECT = ['Sidebar navigation', 'Header navigation', 'Page header', 'Section header', 'Section label', 'Table', 'Content item row', 'Featured icon',
  'Table header', 'Table pagination', 'Text input', 'Text area', 'Input label', 'Input dropdown with badges', 'Alert', 'Tabs', 'Rating',
  'Primary button', 'Secondary button', 'Background overlay', 'Modal', 'Notification', 'Empty state/Data empty', 'Empty state/Search not found', 'Side panel header', 'Side panel footer',
  'add-24-300-round', 'filter_list-24-400-round', 'search-24-300-round', 'keyboard_arrow_right-20-400-round', 'quick_reference_all-24-300-round',
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header'];
const NESTED = ['Nav button', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Tertiary button',
  '_Content item base', 'Badge outline', 'Pill outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Tab item', '_Rating star base',
  'call-24-300-round', 'groups-24-300-round', 'car_repair-24-300-round', 'search_check-24-300-round', 'star-24-300-round'];   // ไอคอนหัวด้าน/ปุ่มดาว — นำเข้าไม่ได้ = Featured icon ใช้ไอคอนตั้งต้น / ปุ่มลูกศร (ทางถอยเดียวกับ contractor-eval)
const LOCAL_OPTIONAL = ['Device Type', 'Component 1', 'Header'];   // ป้าย Device/Desktop/Mobile + แถบรหัส flow (Design Annotations ของ UI Release#2)
const NEEDED = DIRECT.concat(NESTED, LOCAL_OPTIONAL);
const NESTED_ONLY = new Set(NESTED);
const has = (n) => INDEX.has(n);

/* key เพิ่มของไลบรารี — ชุดเดียวกับ contractor-eval-plugin (ดัมป์ 19 ต.ค. 2569) + Input dropdown with badges ของ maintainance-plugin · รูปแบบบรรทัดต้องเหมือน KEYS ใน core เพราะ test harness อ่านด้วย regex */
Object.assign(KEYS, {
  "Input dropdown with badges": ["705d2a75bc12121c2c1c0a9737327fbc1ea60696", true],
  "Rating": ["1d3c2e045977bc6b2b407cdd2c82eb43dc00325a", true],
  "_Rating star base": ["51d4e5f5f09b643b0816d27100d99a9bf08432f5", true],
  "car_repair-24-300-round": ["1e59e85c3ba457b3fbc4ea88a7eacba331ca23c7", false],
  "groups-24-300-round": ["16f9e5ce96b0b738a6cc2e87a7500a6898ac28ae", false],
  "call-24-300-round": ["117dd21b39fd7f89391fa783e220ad32b61746e2", false],
  "search_check-24-300-round": ["230bb3b003a72d41a3649ee10760711ec3846d87", false],
  "star-24-300-round": ["ecf8821fb00ba65575f6814101291f6166e00aa6", false]
});

/* ---------- แบบสำรวจ XCHO (ลอกตรงตัวจาก VMS+ _ Xcho-1…5.pdf · ตรงกับ SURVEY_GROUPS ของเว็บ) ---------- */
const SURVEY_INFO = ['ทะเบียนรถ', 'ชื่อผู้ตอบแบบสอบถาม', 'นามสกุลผู้ตอบแบบสอบถาม', 'ตำแหน่ง ผู้ตอบแบบสอบถาม', 'สังกัด'];
const SURVEY = [   // [ชื่อด้าน, ข้อ, ไอคอนหัวด้าน]
  ['ด้านระบบการให้บริการ', ['ความรวดเร็วในการรับบริการ', 'ความสะดวกในการติดต่อเพื่อขอรับบริการ'], 'call-24-300-round'],
  ['ด้านเจ้าหน้าที่และ/หรือผู้ให้บริการ', ['อัธยาศัยของผู้ให้บริการ', 'ความรู้ของผู้ให้บริการ', 'การให้ความรู้และคำแนะนำแก่ผู้รับบริการ', 'ความตั้งใจในการดำเนินการให้ผู้รับบริการ'], 'groups-24-300-round'],
  ['ด้านคุณภาพของสินค้าและ/หรือบริการ', ['คุณภาพของอะไหล่และการบริการ', 'ระยะเวลาในการได้รับอะไหล่และการบริการ', 'อุปกรณ์ เครื่องมือและเทคโนโลยีในการให้บริการ'], 'car_repair-24-300-round'],
  ['ด้านสภาพแวดล้อมต่างๆ', ['การทำความสะอาดพื้นที่หลังการให้บริการ', 'การทำความสะอาดเครื่องจักรกลหลังการให้บริการ'], 'search_check-24-300-round']];
const SURVEY_N = SURVEY.reduce((n, g) => n + g[1].length, 0);   // 11
const SURVEY_MAX = SURVEY_N * 5;   // 55
/* ข้อความหน้าจอ — ตรงตัวกับค่าคงที่ของเว็บ (survey.ts SAT_*) */
const TITLE = 'แบบประเมินความพึงพอใจ';                                              // SAT_TITLE · ชื่อเมนู + หัวหน้ารายการ · หัวฟอร์ม/ผล = TITLE + ' ' + เลขที่งาน
const TABS = ['ยังไม่ได้ประเมิน', 'ประเมินแล้ว'];                                      // SAT_TABS
const EMPTY = ['ไม่มีรายการที่ต้องประเมิน', 'งานจะเข้ามาที่นี่เมื่อปิดงานแล้ว'];          // SAT_EMPTY
const EMPTY_BTN = 'ดูรายการที่ประเมินแล้ว';                                            // SAT_EMPTY_BTN
const LEVEL = ['', 'ต้องปรับปรุงมาก', 'ต้องปรับปรุง', 'พอใช้', 'ดี', 'ดีมาก'];               // ชื่อระดับ 1–5 (ช่องคะแนนในหน้าผล "5 · ดีมาก")
const ALERT = ['ให้คะแนนทุกข้อ 1 ถึง 5 ดาว',
  LEVEL.slice(1).map((l, i) => i + 1 + ' ' + l).join(' · ') + ' · คะแนนรวมเต็ม ' + SURVEY_MAX + ' (' + SURVEY_N + ' ข้อ × 5) · หมายเหตุไม่บังคับ'];   // SAT_ALERT
const REMARK_LABEL = 'หมายเหตุ/ข้อเสนอแนะเพิ่มเติม';                                    // SAT_REMARK
const NOTE_LABEL = (n) => 'หมายเหตุข้อ ' + n;                                          // SAT_NOTE
const PROVIDER = 'หน่วยงานที่ให้บริการ';                                                // PROVIDER_LABEL
const CONFIRM = (j, sum) => ({ title: 'ยืนยันการประเมิน', sub: 'คุณต้องการบันทึกคะแนนการประเมินสำหรับ ' + j.provider + ' (' + j.no + ') ใช่หรือไม่? คะแนนรวม ' + sum + ' / ' + SURVEY_MAX + ' · บันทึกแล้วแก้ไขไม่ได้', ok: 'ยืนยัน' });   // SAT_CONFIRM
const LEAVE = { title: 'ยืนยันการออก', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' };   // SAT_LEAVE
const FAIL = 'บันทึกการประเมินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง';                              // SAT_FAIL
const OK = (no) => 'ประเมินความพึงพอใจสำเร็จ (' + no + ')';                                // SAT_OK
const EVAL_AT = '07/11/2569 09:30 น.';                                                  // วันที่ประเมินของต้นแบบ (หลังรับทราบ S13)
const ssum = (a) => a.reduce((t, x) => t + (x || 0), 0);
const savg = (a) => { const n = a.filter(Boolean).length; return n ? (ssum(a) / n).toFixed(2) : '-'; };

/* ---------- ข้อมูลจำลอง (ตรงกับ seeds + ?sample=S27 ของ survey.ts) ----------
   1 แถว = 1 งานของยานพาหนะ 1 คัน · kind = ประเภทงาน · provider = หน่วยงานที่ให้บริการ (ระบบเติมจากผู้ดำเนินการงาน) · pairs = ช่องเฉพาะประเภทงานของกล่องข้อมูลงาน
   กล่องข้อมูลงาน (jobPairs ของเว็บ) = ประเภทงาน · เลขที่งาน (ป้ายตามประเภท) · ทะเบียน · ประเภทยานพาหนะ · pairs · วันที่ปิดงาน · หน่วยงานที่ให้บริการ (+ ฟอร์ม: วันที่ประเมิน · ผู้ประเมิน)
   ตำแหน่งผู้ดูแลยานพาหนะ ชก.7 = ค่าสมมติของเว็บ (CARETAKER_POS) */
const KIND = { ma: ['บำรุงรักษาตามวาระ', 'Success'], repair: ['งานซ่อม', 'Info'], oh: ['Overhaul', 'Brand'] };   // สีป้ายชุดเดียวกับประเมินผู้รับจ้าง
const NO_LABEL = { ma: 'เลขที่ MR', repair: 'เลขที่ใบแจ้งซ่อม', oh: 'หมายเลขแผน' };
const CARETAKER_POS = 'ชก.7';
const TRIP_T1 = 'ตรวจยานพาหนะ ขอนแก่น อุดรธานี ลำปาง', PLAN_T1 = 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 และภาค 2 ปีงบประมาณ 2570';
const JOBS = {
  kbk: { kind: 'ma', no: 'MRZ7100004', plate: '73-5019 เพชรบุรี', vtype: 'กระเช้าแก้ไฟ', work: 'ตรวจยานพาหนะ เพชรบุรี', provider: 'กบค.', closed: '05/11/2569',
    caretaker: 'นายธนกร ศรีสมุทร', owner: 'กฟต.1 เพชรบุรี', pairs: [['ชื่อแผน', 'บำรุงรักษากระเช้าแก้ไฟ กบค. ปีงบประมาณ 2571'], ['ไตรมาส', 'ไตรมาส 1'], ['ผู้ดำเนินการ', 'นายวิชัย ทองดี (กบค.)']] },
  ma6789: { kind: 'ma', no: 'MRZ7000001', plate: '82-6789 ขอนแก่น', vtype: 'กระเช้าแก้ไฟ', work: TRIP_T1, provider: 'กบผ.', closed: '04/11/2569',
    caretaker: 'นายสมชาย แก้วมณี', owner: 'กฟฉ.1 ขอนแก่น', pairs: [['ชื่อแผน', PLAN_T1], ['แผนเดินทาง', TRIP_T1], ['ผู้ดำเนินการ', 'นายวิชัย ทองดี (กบผ.)'], ['รับทราบผลเมื่อ', '06/11/2569 10:05 น.']] },
  rp014: { kind: 'repair', no: 'MTD-691003-014', plate: '82-1145 ขอนแก่น', vtype: 'กระเช้าฮอทไลน์', work: 'ระบบไฮดรอลิกกระเช้ารั่วซึม', provider: 'กบค.', closed: '15/10/2569',
    caretaker: 'นายสมชาย แก้วมณี', owner: 'กฟฉ.1 ขอนแก่น', pairs: [['หมายเลขงานซ่อม', 'RAM000245'], ['อาการที่แจ้ง', 'ระบบไฮดรอลิกกระเช้ารั่วซึม'], ['วันที่ / เวลาที่ซ่อมเสร็จ', '15/10/2569 16:30 น.']] },
  oh: { kind: 'oh', no: 'ORZ6900002', plate: '72-6648 สงขลา', vtype: 'รถกระเช้า', work: 'ซ่อมระบบไฮดรอลิกกระเช้า', provider: 'กบค.', closed: '05/10/2569',
    caretaker: 'นายอดิศักดิ์ ทองสุข', owner: 'กฟต.3 สงขลา', pairs: [['ชื่อแผน', 'Overhaul ประจำปีงบ 2569 — รถกระเช้า'], ['ใบสั่งจ้างเลขที่', 'PO-690201'], ['ชื่อ Purchase Order', 'ซ่อมระบบไฮดรอลิกกระเช้า'], ['ยี่ห้อ/รุ่น', 'HINO FG1J']] },
  ma1145: { kind: 'ma', no: 'MRZ7000001', plate: '82-1145 ขอนแก่น', vtype: 'กระเช้าฮอทไลน์', work: TRIP_T1, provider: 'กบผ.', closed: '05/11/2569',
    caretaker: 'นายสมชาย แก้วมณี', owner: 'กฟฉ.1 ขอนแก่น', pairs: [['ชื่อแผน', PLAN_T1], ['แผนเดินทาง', TRIP_T1], ['ผู้ดำเนินการ', 'นางสาวกนกวรรณ ใจมั่น (กบผ.)'], ['รับทราบผลเมื่อ', '06/11/2569 10:05 น.']],
    done: { answers: [4, 4, 5, 4, 4, 5, 4, 4, 4, 4, 5], at: '06/11/2569 14:20 น.', remark: 'ช่างอธิบายงานที่ทำให้ฟังก่อนส่งคืน ควรแจ้งเวลาถึงล่วงหน้า' } },   // 47 · SAMPLE_DONE + SAMPLE_REMARK ของเว็บ
  rp031: { kind: 'repair', no: 'MTD-690716-031', plate: '82-6789 ขอนแก่น', vtype: 'กระเช้าแก้ไฟ', work: 'กระเช้าเอียง/ล็อกไม่อยู่', provider: 'กบค.', closed: '24/09/2569',
    caretaker: 'นายสมชาย แก้วมณี', owner: 'กฟฉ.1 ขอนแก่น', pairs: [['หมายเลขงานซ่อม', 'RAM000198'], ['อาการที่แจ้ง', 'กระเช้าเอียง/ล็อกไม่อยู่'], ['วันที่ / เวลาที่ซ่อมเสร็จ', '24/09/2569 15:10 น.']],
    done: { answers: [5, 4, 4, 4, 4, 5, 4, 3, 4, 4, 4], at: '27/09/2569 10:15 น.', remark: 'ซ่อมเสร็จตามนัด ควรแจ้งความคืบหน้าระหว่างรออะไหล่' } },   // 45
  ma4458: { kind: 'ma', no: 'MRZ6900011', plate: '80-4458 แพร่', vtype: 'กระเช้าฮอทไลน์', work: 'ตรวจยานพาหนะ แพร่', provider: 'กรย.', closed: '01/10/2568',
    caretaker: 'นายพิชิต ปัญญาดี', owner: 'กฟน.2 แพร่', pairs: [['ชื่อแผน', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 ปีงบประมาณ 2569'], ['ไตรมาส', 'ไตรมาส 1'], ['ผู้ดำเนินการ', 'นางสาวพิมพ์ชนก ศรีสุข (กรย.)']],
    done: { answers: [4, 5, 4, 4, 5, 4, 4, 4, 4, 5, 5], at: '03/10/2568 14:00 น.' } }};   // 48
const SAMPLE = [5, 4, 4, 5, 4, 4, 4, 3, 4, 5, 4];   // ปุ่มต้นแบบ "กรอกข้อมูลตัวอย่าง" ของเว็บ (SAMPLE_ANSWERS) ครบ 11 ข้อ = 46
const PART = SAMPLE.slice(0, 6);                    // 2 ด้านแรก 6 ข้อ = 26
const SAMPLE_NOTES = SAMPLE.map((_, i) => (i === 7 ? 'รออะไหล่ไส้กรองไฮดรอลิก 2 วัน' : ''));   // หมายเหตุข้อ 8 (sampleNotes ของเว็บ)
const SAMPLE_REMARK = 'ช่างมาตรงเวลา อธิบายงานที่ทำก่อนส่งคืนยานพาหนะ';   // SAMPLE_FORM_REMARK ของเว็บ
const PART_REMARK = 'ช่างมาตรงเวลา';
const SAVED = { answers: SAMPLE, notes: SAMPLE_NOTES, at: EVAL_AT, remark: SAMPLE_REMARK };   // MRZ7000001 82-6789 หลังกดบันทึก (B.6 · C.4)
const PENDING = ['kbk', 'ma6789', 'rp014', 'oh'];   // เรียงวันที่ปิดงานใหม่สุดก่อน (evalRows ของเว็บ)
const DONE = ['ma1145', 'rp031', 'ma4458'];
const doneOf = (k, saved) => (saved && saved[k]) || JOBS[k].done;
const surveyInfo = (j) => { const s = j.caretaker.indexOf(' '); return [j.plate, j.caretaker.slice(0, s), j.caretaker.slice(s + 1), CARETAKER_POS, j.owner]; };
const jobPairs = (j) => [['ประเภทงาน', KIND[j.kind][0]], [NO_LABEL[j.kind], j.no], ['ทะเบียน', j.plate], ['ประเภทยานพาหนะ', j.vtype]].concat(j.pairs, [['วันที่ปิดงาน', j.closed], [PROVIDER, j.provider]]);

/* ---------- A รายการ — Tabs ยังไม่ได้ประเมิน (จำนวน) / ประเมินแล้ว · Table header ค้นหา + ตัวกรอง · ตารางหน้าละ 10 (เว็บ /satisfaction/) ---------- */
async function tabs(items, active) {   // component Tabs (5 ช่อง Tab item) · items [[ข้อความ, จำนวน]] · ซ่อนช่องที่เกิน (ยกจาก contractor-eval-plugin)
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
const PEND_COLS = [['เลขที่งาน', 170, 'Lead text'], ['ประเภทงาน', 170, 'Badge'], ['ทะเบียน', 200], ['งาน', 0], [PROVIDER, 170], ['วันที่ปิดงาน', 130], ['ดำเนินการ', 104]];
const pendRow = (ro) => (k) => { const j = JOBS[k]; return [j.no, { pill: KIND[j.kind] }, { text: j.plate, sub: j.vtype }, j.work, j.provider, j.closed,
  { icons: ro ? [] : [has('star-24-300-round') ? 'star-24-300-round' : 'keyboard_arrow_right-20-400-round'] }]; };   // ro = ดูอย่างเดียว (กบค.) ช่องดำเนินการว่าง แบบ actions [] ของเว็บ (canEvaluate = ผู้ดูแลยานพาหนะเท่านั้น)
const DONE_COLS = [['เลขที่งาน', 170, 'Lead text'], ['ประเภทงาน', 170, 'Badge'], ['ทะเบียน', 0], [PROVIDER, 170], ['วันที่ประเมิน', 130], ['ผู้ประเมิน', 190], ['คะแนน (เต็ม ' + SURVEY_MAX + ')', 190], ['', 60]];
const doneRow = (saved) => (k) => { const j = JOBS[k], d = doneOf(k, saved); return [j.no, { pill: KIND[j.kind] }, { text: j.plate, sub: j.vtype }, j.provider, d.at.slice(0, 10), j.caretaker,
  ssum(d.answers) + ' / ' + SURVEY_MAX + ' · เฉลี่ย ' + savg(d.answers), { icons: ['quick_reference_all-24-300-round'] }]; };
/* ค้นหา/กรองไม่พบ — Empty state/Search not found ค่าของเว็บ (EmptyStateSearchNotFound ค่าเริ่ม "ไม่พบข้อมูล" / "เปลี่ยนคำค้นหรือเงื่อนไขแล้วลองใหม่อีกครั้ง") + Secondary button "ล้างตัวกรอง" (Primary button ซ่อน)
   ยกแบบ copy จาก searchNotFound() ของ maintainance-plugin (S24 ค้นหาไม่พบ · Vehicle list State=Search not found ของ UI Release#2) ไม่ import ข้ามปลั๊กอิน */
const NOT_FOUND = ['ไม่พบข้อมูล', 'เปลี่ยนคำค้นหรือเงื่อนไขแล้วลองใหม่อีกครั้ง'], CLEAR_BTN = 'ล้างตัวกรอง';
async function searchNotFound() {
  const es = inst('Empty state/Search not found');
  await text(es, 'Text', NOT_FOUND[0]); await text(es, 'Supporting text', NOT_FOUND[1]);
  es.findAll(n => n.type === 'INSTANCE' && /button/i.test(n.name)).forEach((b, i) => { if (i === 0) setProps(b, { Text: CLEAR_BTN, 'Leading icon': false, 'Trailing icon': false }); else b.visible = false; });
  return es;
}
/* o.tab · o.pending / o.done (คีย์ JOBS) · o.saved = ผลที่เพิ่งบันทึก { คีย์: ผล }
   o.readOnly = มุม กบค. (rowsFor ของเว็บ: เห็นเฉพาะงานที่หน่วยงานที่ให้บริการเป็น กบค. ดูอย่างเดียว ไม่มีไอคอนดาว · ดูผลได้) · o.query = คำค้นในช่องค้นหา · o.notFound = ค้นหาไม่พบ */
async function listScreen(name, o) {
  o = o || {};
  const pend = o.pending || PENDING, done = o.done || DONE;
  const { scr, page } = await shell(name, { title: TITLE });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tabs([[TABS[0], pend.length], [TABS[1], null]], o.tab || 0), 'h');
  const rows = o.tab ? done : pend;
  if (!rows.length) {   // ไม่มีรายการ — Empty state + ปุ่มไปแท็บประเมินแล้ว (ไม่มี Table header ตามเว็บ)
    const es = inst('Empty state/Data empty'); add(sec, es, 'h');
    await text(es, 'Text', EMPTY[0]);
    await text(es, 'Supporting text', EMPTY[1]);
    const pb = find(es, 'Primary button'); if (pb) pb.visible = false;
    const sb = find(es, 'Secondary button'); if (sb) setProps(sb, { Text: EMPTY_BTN, 'Leading icon': false, 'Trailing icon': false });
    return scr;
  }
  add(sec, await tableHeader({ query: o.query }), 'h');   // ค้นหา "ค้นหาเลขที่งาน, ทะเบียน" (PLUGIN.searchHint) + ปุ่มตัวกรอง
  if (o.notFound) { add(sec, await searchNotFound(), 'h'); return scr; }   // ค้นหา/กรองไม่เจอ = Empty state/Search not found แทนตาราง (Tabs + Table header คงอยู่ ตามเว็บ)
  add(sec, await tbl(o.tab ? DONE_COLS : PEND_COLS, rows.map(o.tab ? doneRow(o.saved) : pendRow(o.readOnly)), { pagination: rows.length }), 'h');
  return scr;
}
const FILTER_FIELDS = () => [multiDropdown('ประเภทงาน', [], { optional: true, placeholder: 'ทั้งหมด' }), multiDropdown(PROVIDER, [], { optional: true, placeholder: 'ทั้งหมด' })];   // FilterShell ของเว็บ (ชุดเดียวกับ S24) · ค่าเริ่ม "ทั้งหมด"

/* ---------- B ฟอร์ม — หน้า Create ⇒ Section header (R3) · ข้อมูลงาน · ข้อมูลผู้ใช้รถฯ · Alert สเกล · 4 ด้าน (ข้อละ Rating + หมายเหตุข้อ n) · หมายเหตุท้ายฟอร์ม · สรุปคะแนน · ปุ่ม ---------- */
function question(no, n, q, score, note) {   // Input label "n. ข้อ" (ไม่มี "(ถ้ามี)" = บังคับ) → 12 → Rating ดาว 5 ดวง (เริ่มว่าง Point=0) → 12 → Text input "หมายเหตุข้อ n" (ถ้ามี) กว้างตั้งต้นของไลบรารี · มือถือเต็มแถว
  const lb = inst('Input label', {}, { 'Label text': no + '. ' + q, Optional: false, 'Info icon': false });
  const rt = inst('Rating', { Point: String(score || 0) }); rt.name = 'Rating';
  const c = col('Item', [lb, rt], 12);
  const nt = field(NOTE_LABEL(n), note || '', { optional: true, placeholder: 'ระบุหมายเหตุ' });
  if (MOB) add(c, nt, 'h'); else c.appendChild(nt);
  return c;
}
async function groupHead(title, ic, badge) {   // Featured icon สีหลัก + Section header (ชื่อด้าน + Badge คะแนนด้าน) — หัวหมวดของประเมินผู้รับจ้าง
  const fi = inst('Featured icon', { Color: 'Brand', Size: 'md' });
  if (has(ic)) setProps(fi, { 'Icon swap': icon(ic) });
  const sh = await section(title, { badge });
  const r = row('Group', [fi, sh], { hug: true, gap: 16, align: 'CENTER', keep: true });
  sh.layoutGrow = 1;
  return r;
}
async function evalForm(name, k, o) {   // o.scores · o.notes · o.remark
  o = o || {};
  const sc = o.scores || [], nts = o.notes || [], j = JOBS[k];
  const { scr, page } = await shell(name, { title: TITLE + ' ' + j.no, back: true, crumbs: [j.no] });
  const parts = [col('Section', [await section('ข้อมูลงาน'), kv(jobPairs(j).concat([['วันที่ประเมิน', EVAL_AT.slice(0, 10)], ['ผู้ประเมิน', j.caretaker]]))], 16),
    col('Section', [await section('ข้อมูลผู้ใช้รถฯ'), kv(SURVEY_INFO.map((l, x) => [l, surveyInfo(j)[x]]))], 16),
    alertBox('Info', ALERT[0], ALERT[1])];
  let n0 = 0;
  for (const [title, qs, ic] of SURVEY) {
    const items = [], gs = [];
    qs.forEach((q, i) => { gs.push(sc[n0] || 0); items.push(question(i + 1, n0 + 1, q, sc[n0], nts[n0])); n0++; });
    const qcol = col('Questions', items, 24); if (!MOB) qcol.paddingLeft = 64;   // ข้อเยื้องตรงชื่อด้าน (ไอคอน 48 + ช่อง 16)
    parts.push(col('Section', [await groupHead(title, ic, ssum(gs) + '/' + qs.length * 5), qcol], 16));
  }
  parts.push(col('Section', [await section(REMARK_LABEL), area(REMARK_LABEL, o.remark || '', { optional: true, placeholder: 'ระบุหมายเหตุหรือข้อเสนอแนะ' })], 16));
  const n = sc.filter(Boolean).length;
  parts.push(col('Section', [await section('สรุปคะแนน'), kv([['ให้คะแนนแล้ว', n + ' / ' + SURVEY_N + ' ข้อ'], ['คะแนนรวม', ssum(sc) + ' / ' + SURVEY_MAX], ['ค่าเฉลี่ย', n ? savg(sc) + ' จาก 5' : '-'], ['ผลระดับ', 'รอเคาะเกณฑ์']])], 16));
  parts.push(btnRow([['Secondary button', 'ยกเลิก', { size: 'lg' }], ['Primary button', 'บันทึกการประเมิน', { size: 'lg', disabled: n < SURVEY_N }]]));
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ---------- C ดูผล — หน้า Detail ⇒ Section label (R5/R11) · ป้ายประเมินแล้ว · สรุปผล + ตารางต่อด้าน (ข้อ · รายการประเมิน · คะแนน "5 · ดีมาก" · หมายเหตุ) · ไม่มีปุ่มพิมพ์ ไม่มีส่วนแนบ ---------- */
const DETAIL_COLS = [['ข้อ', 80], ['รายการประเมิน', 0], ['คะแนน', 160], ['หมายเหตุ', 280]];
async function resultScreen(name, k, saved) {
  const j = JOBS[k], d = doneOf(k, saved), a = d.answers;
  const { scr, page } = await shell(name, { title: TITLE + ' ' + j.no, back: true, crumbs: [j.no], badge: ['ประเมินแล้ว', 'Success'] });
  const gsum = []; let n0 = 0;
  for (const [title, qs] of SURVEY) { gsum.push([title, ssum(a.slice(n0, n0 + qs.length)) + ' / ' + qs.length * 5]); n0 += qs.length; }
  const parts = [col('Section', [await sectionLabel('ข้อมูลงาน'), kv(jobPairs(j))], 16),
    col('Section', [await sectionLabel('ข้อมูลผู้ใช้รถฯ'), kv(SURVEY_INFO.map((l, x) => [l, surveyInfo(j)[x]]))], 16),
    col('Section', [await sectionLabel('สรุปผลการประเมิน'), kv([['คะแนนรวม', ssum(a) + ' / ' + SURVEY_MAX], ['ค่าเฉลี่ย', savg(a) + ' จาก 5'], ['ผู้ประเมิน', j.caretaker], ['วันที่ประเมิน', d.at]]
      .concat(gsum, [[REMARK_LABEL, d.remark || '-']]))], 16)];
  n0 = 0;
  for (const [gi, [title, qs]] of SURVEY.entries()) {
    const rows = qs.map((q, i) => { const x = n0++; return [String(i + 1), q, a[x] + ' · ' + LEVEL[a[x]], (d.notes && d.notes[x]) || '-']; });
    parts.push(col('Section', [await sectionLabel(title + ' ' + gsum[gi][1]), await tbl(DETAIL_COLS, rows)], 16));
  }
  parts.push(btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }]]));
  add(page, col('Content', parts, 32), 'h');
  return scr;
}

/* ---------- state ราย scenario (R19: 1 scenario = 1 บล็อก · A.1 A.2 = state · state ใหม่ต่อท้าย รหัสเดิมไม่เลื่อน) ---------- */
const KBK = (k) => JOBS[k].provider === 'กบค.';   // rowsFor ของเว็บ: บทบาท กบค. เห็นเฉพาะงานที่ประเมิน กบค.
const KBK_VIEW = { readOnly: true, pending: PENDING.filter(KBK), done: DONE.filter(KBK) };   // ยังไม่ได้ประเมิน MRZ7100004 MTD-691003-014 ORZ6900002 · ประเมินแล้ว MTD-690716-031
const NOT_FOUND_Q = '99-9999';   // คำค้นที่ไม่ตรงงานไหน (เลขที่งาน ทะเบียน งาน หน่วยงานที่ให้บริการ) — ค่าเดียวกับ S24 ค้นหาไม่พบของบำรุงรักษา
const AFTER_SAVE = { tab: 1, pending: ['kbk', 'rp014', 'oh'], done: ['ma1145', 'ma6789', 'rp031', 'ma4458'], saved: { ma6789: SAVED } };   // เรียงวันที่ปิดงาน (82-1145 05/11 ก่อน 82-6789 04/11)
const LIST_STATES = [
  ['แท็บยังไม่ได้ประเมิน — งานที่ปิดแล้ว', () => listScreen('S1 ยังไม่ได้ประเมิน', { tab: 0 })],
  ['แท็บประเมินแล้ว', () => listScreen('S1 ประเมินแล้ว', { tab: 1 })],
  ['ไม่มีรายการที่ต้องประเมิน', () => listScreen('S1 ไม่มีรายการ', { tab: 0, pending: [] })],
  ['กดตัวกรอง — แผงตัวกรอง ประเภทงาน หน่วยงานที่ให้บริการ', async () => { const s = await listScreen('S1 ตัวกรอง', { tab: 0 }); await filterPanel(s, FILTER_FIELDS()); return s; }],   // A.4 ต่อท้าย 12 พ.ย. 2569 รอบ 2 (ตัวกรองของเว็บ)
  /* A.5–A.7 ต่อท้าย 12 พ.ย. 2569 รอบ 3 (ต้นแบบเว็บ ?sample=S27_kbk · EmptyStateSearchNotFound ของ /satisfaction/) */
  ['กบค. — แท็บยังไม่ได้ประเมิน เฉพาะงานที่ประเมิน กบค. ดูอย่างเดียว ไม่มีไอคอนดาว', () => listScreen('S1 กบค. ยังไม่ได้ประเมิน', Object.assign({ tab: 0 }, KBK_VIEW))],
  ['กบค. — แท็บประเมินแล้ว เฉพาะการประเมินที่ประเมิน กบค. ดูผลได้', () => listScreen('S1 กบค. ประเมินแล้ว', Object.assign({ tab: 1 }, KBK_VIEW))],
  ['ค้นหาไม่พบ — ไม่พบข้อมูล ปุ่มล้างตัวกรอง', () => listScreen('S1 ค้นหาไม่พบ', { tab: 0, query: NOT_FOUND_Q, notFound: true })]];
const FORM_STATES = [
  ['ฟอร์มประเมิน (ยังไม่ให้คะแนน) — บำรุงรักษาตามวาระ หน่วยงานที่ให้บริการ กบผ.', () => evalForm('S2 ฟอร์มว่าง', 'ma6789', {})],
  ['ให้คะแนนบางข้อ + กรอกหมายเหตุท้ายฟอร์ม', () => evalForm('S2 กรอกบางข้อ', 'ma6789', { scores: PART, remark: PART_REMARK })],
  ['ให้คะแนนครบ 11 ข้อ + หมายเหตุข้อ 8', () => evalForm('S2 กรอกครบ', 'ma6789', { scores: SAMPLE, notes: SAMPLE_NOTES, remark: SAMPLE_REMARK })],
  ['ยืนยันการประเมิน', async () => { const s = await evalForm('S2 ยืนยัน', 'ma6789', { scores: SAMPLE, notes: SAMPLE_NOTES, remark: SAMPLE_REMARK }); await confirm(s, CONFIRM(JOBS.ma6789, ssum(SAMPLE))); return s; }],
  ['บันทึกไม่สำเร็จ', async () => { const s = await evalForm('S2 บันทึกไม่สำเร็จ', 'ma6789', { scores: SAMPLE, notes: SAMPLE_NOTES, remark: SAMPLE_REMARK }); notify(s, FAIL, true); return s; }],
  ['บันทึกสำเร็จ — ย้ายไปแท็บประเมินแล้ว', async () => { const s = await listScreen('S2 บันทึกสำเร็จ', AFTER_SAVE); notify(s, OK(JOBS.ma6789.no)); return s; }],
  ['ยกเลิกระหว่างกรอก — ยืนยันการออก', async () => { const s = await evalForm('S2 ยืนยันการออก', 'ma6789', { scores: PART, remark: PART_REMARK }); await confirm(s, LEAVE); return s; }],
  ['ฟอร์มประเมินงานซ่อม — หน่วยงานที่ให้บริการ กบค.', () => evalForm('S2 ฟอร์มงานซ่อม', 'rp014', {})],
  ['ฟอร์มประเมิน Overhaul — หน่วยงานที่ให้บริการ กบค.', () => evalForm('S2 ฟอร์ม Overhaul', 'oh', {})],
  /* 13 พ.ย. 2569 เจ้าของงาน (ภาพหน้า /satisfaction/form ของเว็บ "แบบประเมินความพึงพอใจ MRZ7100004") "อยากสร้าง export … ใส่ในแบบประเมิน"
     ⇒ ฟอร์มบำรุงรักษาตามวาระที่ กบค. ดำเนินการ (แผนของ กบค. · หน่วยงานที่ให้บริการ กบค.) ต่อท้าย B.10 รหัสจอเดิมไม่เลื่อน · ข้อมูล JOBS.kbk = แถวแรกของแท็บยังไม่ได้ประเมินของเว็บ */
  ['ฟอร์มประเมิน บำรุงรักษาตามวาระ — หน่วยงานที่ให้บริการ กบค. (แผนของ กบค.)', () => evalForm('S2 ฟอร์ม กบค.', 'kbk', {})]];   // B.9 ต่อท้าย 12 พ.ย. 2569 รอบ 2 (แถว Overhaul ของเว็บ)
const RESULT_STATES = [
  ['ผลประเมิน — บำรุงรักษาตามวาระ หน่วยงานที่ให้บริการ กบผ.', () => resultScreen('S3 ผลบำรุงรักษา กบผ.', 'ma1145')],
  ['ผลประเมิน — บำรุงรักษาตามวาระ หน่วยงานที่ให้บริการ กรย.', () => resultScreen('S3 ผลบำรุงรักษา กรย.', 'ma4458')],
  ['ผลประเมิน — งานซ่อม หน่วยงานที่ให้บริการ กบค.', () => resultScreen('S3 ผลงานซ่อม', 'rp031')],
  ['ผลประเมินที่เพิ่งบันทึก — มีหมายเหตุรายข้อ', () => resultScreen('S3 ผลที่เพิ่งบันทึก', 'ma6789', { ma6789: SAVED })]];   // C.4 ต่อท้าย 12 พ.ย. 2569 รอบ 2
const SCENARIOS = [
  ['S1 · ผู้ดูแลยานพาหนะ ดูรายการประเมินความพึงพอใจ', LIST_STATES],
  ['S2 · ผู้ดูแลยานพาหนะ ประเมินความพึงพอใจการให้บริการ 1 งาน', FORM_STATES],
  ['S3 · ผู้ดูแลยานพาหนะ ดูผลประเมินความพึงพอใจ', RESULT_STATES]];

/* ---------- กลุ่ม = scenario · ตัวอักษรตามลำดับ (A B C) · flowchart กิจกรรมซ้ายของบล็อกจาก Diagram/09-ประเมินความพึงพอใจ/02-…-flowchart-กิจกรรม.md (build.json activity) ---------- */
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const groupsFor = (idx) => idx.map(i => {
  const [title, screens] = SCENARIOS[i];
  const code = LETTERS[i], tag = title.split(' · ')[0], rest = title.split(' · ').slice(1).join(' · ');
  return { code, title: tag + ' ' + rest, subs: [{ code, title: rest, tag, screens: screens.map(([label, fn]) => [label, fn, '']) }] };
});
const ALL_IDX = SCENARIOS.map((_, i) => i);

/* ---------- สร้าง: ทั้งชุด · Desktop · Mobile · เฉพาะ scenario ที่เลือก · เช็ค component — วางบนหน้า "ประเมินความพึงพอใจ" ต่อใต้ของเดิม (ไม่มีก็สร้าง) ---------- */
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
  const { made, flows } = await buildGrid(page, PLUGIN.prefix, GRP, y, TOTAL * devices.length, { devices });
  let instances = 0, loose = 0;
  for (const s of made) for (const n of s.findAll(x => !findInstanceAncestor(x))) {
    if (n.type === 'INSTANCE') instances++;
    else if (n.type !== 'FRAME') loose++;
  }
  figma.viewport.scrollAndZoomIntoView(made.slice(0, 4));
  log('');
  log('สร้าง ' + made.length + ' จอ (' + (devices.length === 2 ? 'Desktop + Mobile' : devices[0] ? 'Mobile' : 'Desktop') + ') · flowchart ' + flows + ' ผัง · ' + GRP.length + ' บล็อก ' + what + ' (' + GRP.map(g => g.code).join(' ') + ') · instance ชั้นบนสุด ' + instances + ' ชิ้น');
  log('ชิ้นในจอที่ไม่ใช่ instance/กรอบ: ' + loose + (loose ? ' ⚠ ต้องเป็น 0' : ' ✓') + ' (flowchart เป็นของวาดประกอบนอกจอ ไม่นับ)');
  log('component ที่ใช้ (' + USED.size + '): ' + [...USED].sort().join(' · '));
  log(errors.length ? '⚠ เตือน ' + errors.length + ' จุด (รายการด้านบน) — ส่งข้อความนี้กลับมาให้ตรวจ' : 'ไม่มีคำเตือน ✓');
  if (FONT_SWAPPED) log('· ข้อความที่ต้องสลับเป็นฟอนต์สำรอง ' + FONT_SWAPPED + ' จุด — ฟอนต์ ' + (FALLBACK_FONT ? FALLBACK_FONT.family + ' ' + FALLBACK_FONT.style : '-'));
  reportOversize();
  log('ใช้เวลารวม ' + Math.round((Date.now() - t0) / 1000) + ' วินาที');
}
async function buildPick(o) {   // ติ๊กเฉพาะบาง scenario · รหัสตัวอักษรคงเดิม (A–C)
  const idx = (o.pick || []).map(Number).filter(i => i >= 0 && i < SCENARIOS.length);
  if (!idx.length) { log('ยังไม่ได้ติ๊ก scenario — ติ๊กอย่างน้อย 1 รายการแล้วกดอีกครั้ง'); return; }
  await buildSet(groupsFor(idx), 'scenario ที่เลือก', devOf(o));
}

return { PLUGIN, NEEDED, NESTED, ACTIVITY: ACTIVITY_INC, SCENARIOS, groupsFor, ALL_IDX, buildSet, buildPick };
})();
