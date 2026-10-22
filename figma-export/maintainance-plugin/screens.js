/* ============================================================================
   Maintain-D — บำรุงรักษาตามวาระ · จอตาม userflow 18 scenario (รอบแรก: เส้นของ กบค. 9 scenario) จาก component จริง
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
  'Mobile table', 'Bottom sheet header', 'Bottom sheet footer', 'Modal header'];
const NESTED = ['Nav button', 'Sort icon', 'Badge outline with remove icon', 'Button groups pagination item', 'Tertiary brand button', 'Primary danger button',
  '_Content item base', '_File upload item base', 'List with checkbox item', 'List header item', 'Checkbox', 'Badge outline', 'Mobile table item', 'Table cell', 'Table header cell', 'Radio button'];
const LOCAL_OPTIONAL = ['PartRequestStepPanel', 'PartsInventoryPanel', 'RequestedPartsPanel', 'Spare Part Card Item', 'IncidentPhotoGallery', 'VehicleAndReporterInfo', 'SummaryRequestedParts',
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
const PLANS = [   // เลขงาน · ชื่อแผน · ปีงบ · ไตรมาส · จำนวนรถ · สถานะ · วันที่สร้าง
  ['MT-2570-001', 'บำรุงรักษาตามวาระ ปีงบ 2570 รถกระเช้า ภาค 1 (เหนือ)', '2570', 'Q1', '12', 'active', '03/10/2569'],
  ['MT-2570-002', 'บำรุงรักษาตามวาระ ปีงบ 2570 รถเครน ภาค 2 (อีสาน)', '2570', 'Q2', '8', 'approved', '05/10/2569'],
  ['—', 'บำรุงรักษาตามวาระ ปีงบ 2570 รถขุด ภาค 3 (กลาง)', '2570', 'Q1', '6', 'review', '17/10/2569'],
  ['—', 'บำรุงรักษาตามวาระ ปีงบ 2570 รถกระเช้า ภาค 4 (ใต้)', '2570', 'Q3', '9', 'returned', '12/10/2569'],
  ['MT-2569-011', 'บำรุงรักษาตามวาระ ปีงบ 2569 รถกระเช้า ภาค 1 (เหนือ)', '2569', 'Q4', '10', 'closed', '02/06/2569']];
const NEW_PLAN = ['—', 'บำรุงรักษาตามวาระ ปีงบ 2570 รถกระเช้า ภาค 2 (อีสาน)', '2570', 'Q2', '7', 'review', '20/10/2569'];
const P = PLANS[0];
const PLAN_KV = [['ชื่อแผน', P[1]], ['ปีงบประมาณ', P[2]], ['ไตรมาส', P[3]], ['จำนวนรถ', P[4] + ' คัน'], ['เลขงาน', P[0]], ['ผู้สร้างแผน', 'นายวิชัย ทองดี (กบค.)'], ['วันที่สร้าง', P[6]], ['ผพจ. อนุมัติ', '08/10/2569']];
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
/* เบิก/จองอะไหล่ — ยืม PartRequestStepPanel (ขั้นเบิกอะไหล่ของงานซ่อม = PartsInventoryPanel "คลังอะไหล่" Smart Inventory + RequestedPartsPanel "อะไหล่ที่ต้องการใช้งาน")
   · mobile / ไฟล์ที่ไม่มี component → ตาราง Table ของไลบรารี */
async function partsPanel(o) {
  o = o || {};
  const picked = o.picked || [];
  if (!MOB && has('PartRequestStepPanel')) {
    const p = inst('PartRequestStepPanel'); p.name = 'PartRequestStepPanel';
    const inv = find(p, 'PartsInventoryPanel'), req = find(p, 'RequestedPartsPanel');
    if (inv) {
      setProps(inv, { State: 'Default' });
      const sh = find(inv, 'Section header');
      if (sh) { setProps(sh, { Title: 'คลังอะไหล่', 'Supporting text': true, 'More actions': false, Badge: false, Actions: false }); await text(sh, 'Supporting text', 'อะไหล่ตามแผนจาก Smart Inventory และคลังสำรอง'); }
      const ti = find(inv, 'Text input'); if (ti) setProps(ti, { Text: 'ค้นหาชื่อหรือรหัสอะไหล่', Label: false, Helper: false, 'Info icon': false });
      const cards = inv.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
      for (const [i, c] of cards.entries()) {
        const part = PARTS[i];
        if (!part) { c.visible = false; continue; }
        setProps(c, { Suggestion: false, Select: picked.indexOf(i) >= 0, Add: picked.indexOf(i) < 0, 'จัดซื้อเพิ่ม': false, 'เลือกผู้จัดซื้อ': false });
        await text(c, 'Name', part[0]);
        await text(c, 'Supporting text', part[1] + ' · ' + part[2], 0);
        await text(c, 'Supporting text', 'Smart Inventory : คงเหลือ ' + part[5] + ' ' + part[4] + ' · ตามแผน ' + part[3] + ' ' + part[4], 1);
        const inf = find(c, 'Info'); if (inf) inf.visible = false;
      }
    }
    if (req) {
      setProps(req, { State: picked.length ? 'Filled' : 'Default' });
      const sh = find(req, 'Section header');
      if (sh) { setProps(sh, { Title: 'อะไหล่ที่ต้องใช้ตามแผน', 'Supporting text': true, 'More actions': false, Badge: picked.length > 0, Actions: false }); await text(sh, 'Supporting text', 'ระบบคำนวณจากรถในแผน · เบิก/จองผ่านระบบจองอะไหล่'); const b = find(sh, 'Badge outline'); if (b && picked.length) setProps(b, { Text: String(picked.length) }); }
      const cards = req.findAll(n => n.type === 'INSTANCE' && n.name === 'Spare Part Card Item');
      let k = 0;
      for (const c of cards) {
        const vp = (c.variantProperties || {})['อะไหล่'];
        if (vp === 'เพิ่มอะไหล่') { c.visible = false; continue; }
        const part = PARTS[picked[k++]];
        if (!part) { c.visible = false; continue; }
        setProps(c, { Suggestion: false, 'จัดซื้อเพิ่ม': false, 'เลือกผู้จัดซื้อ': false });
        const nm = find(c, 'Name'); if (nm) await text(c, nm, part[0]);
        await text(c, 'Supporting text', 'Smart Inventory : คงเหลือ ' + part[5] + ' ' + part[4], 0);
        const num = find(c, 'Number input'); if (num) setProps(num, { Number: part[3], Label: false, Helper: false });
        const price = find(c, 'Text'); if (price && price.type === 'TEXT') await text(c, price, part[3] + ' ' + part[4]);
      }
      const addBtn = find(req, 'Secondary button'); if (addBtn) setProps(addBtn, { Text: 'ระบุอะไหล่เพิ่มเติม' });
    }
    return p;
  }
  return col('Section', [await section('รายการอะไหล่ที่ต้องใช้ตามแผน', { badge: PARTS.length }), await tbl(PART_COLS, PARTS.map((p, i) => partRow(p, i, o)))], 16);
}
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
    const ft = m.findAll(n => n.type === 'INSTANCE' && /button/.test(n.name) && n.parent && n.parent.name === 'Actions');
    ft.forEach(b => { if (b.name === 'Primary button') setProps(b, { Text: 'ยืนยันเบิก/จอง', 'Leading icon': false, 'Trailing icon': false }); else if (b.name === 'Secondary button') setProps(b, { Text: 'ยกเลิก', 'Leading icon': false, 'Trailing icon': false }); else b.visible = false; });
    return;
  }
  await confirm(scr, { title: 'ยืนยันการเบิก/จองอะไหล่', sub: 'เบิกจากคลัง ' + o.stock + ' รายการ · คงเหลือไม่พอรอจัดซื้อ ' + o.buy + ' รายการ', ok: 'ยืนยันเบิก/จอง' });
}

/* ---------- S1 หน้ารายการแผน + ฟอร์มสร้างแผน ---------- */
const PLAN_COLS = [['เลขงาน', 130, 'Lead text', 'Down'], ['ชื่อแผน', 0, 'Text', 'Swap'], ['ปีงบประมาณ', 120], ['ไตรมาส', 100], ['จำนวนรถ', 110], ['สถานะ', 180, 'Badge', 'Swap'], ['วันที่สร้าง', 120], ['', 60]];
const planRow = (p) => [p[0], p[1], p[2], p[3], p[4], { pill: PST[p[5]] }, p[6], { menu: 1 }];
async function listScreen(name, o) {
  o = o || {};
  const { scr, page } = await shell(name, { title: 'บำรุงรักษาตามวาระ', primary: 'สร้างแผน' });
  const sec = col('Section', [], 24); add(page, sec, 'h');
  add(sec, await tableHeader(o), 'h');
  add(sec, await tbl(PLAN_COLS, (o.rows || PLANS).map(planRow), { pagination: (o.rows || PLANS).length }), 'h');
  return scr;
}
const CARS = VEH.map(v => [v[0], v[1], v[2]]);
async function planForm(name, o) {
  o = o || {};
  const v = o.values || {}, E = (m) => o.errors ? m : '';
  const { scr, page } = await shell(name, { title: 'สร้างแผนบำรุงรักษา', back: true, crumbs: ['สร้างแผน'] });
  const sel = o.sel || [];
  const left = CARS.filter((_, i) => sel.indexOf(i) < 0), right = CARS.filter((_, i) => sel.indexOf(i) >= 0);
  const mid = MOB ? row('Actions', [btn('Secondary button', 'เพิ่ม'), btn('Secondary button', 'นำออก', { disabled: !sel.length })], { gap: 12, keep: true })
    : col('Actions', [btn('Secondary button', 'เพิ่ม'), btn('Secondary button', 'นำออก', { disabled: !sel.length })], 12);
  const L = await listCheck('รถที่เข้าเกณฑ์ (' + left.length + ')', left, []), R = await listCheck('เลือกเข้าแผนแล้ว (' + right.length + ')', right, []);
  const dual = row('Dual list', [L, mid, R], { gap: 16 }); mid.layoutGrow = 0; if (!MOB) mid.primaryAxisAlignItems = 'CENTER';
  const partsSec = col('Section', [await section('รายการอะไหล่ที่ต้องใช้ (ระบบคำนวณจากรถที่เลือก)', { badge: sel.length ? PARTS.length : null })], 16);
  if (sel.length) add(partsSec, await tbl(PART_COLS.slice(0, 5), PARTS.map(p => [p[0], p[1], p[2], p[3], p[4]])), 'h');
  else { const es = inst('Empty state/Data empty'); add(partsSec, es, 'h'); await text(es, 'Text', 'ยังไม่มีรายการอะไหล่'); await text(es, 'Supporting text', 'เลือกรถเข้าแผนก่อน ระบบจะคำนวณน้ำมัน ไส้กรอง และอะไหล่ตามรอบให้เอง'); const a = find(es, 'Actions'); if (a) a.visible = false; }
  add(page, col('Content', [
    col('Section', [await section('ข้อมูลแผน'),
      row('Row', [field('ชื่อแผน', v.name, { placeholder: 'เช่น บำรุงรักษาตามวาระ ปีงบ 2570 รถกระเช้า ภาค 2', error: E('กรุณาระบุชื่อแผน') }), dropdown('ปีงบประมาณ', v.year || '2570')]),
      row('Row', [dropdown('ไตรมาส', v.q || '', { placeholder: 'เลือกไตรมาส', error: E('กรุณาเลือกไตรมาส') }), dropdown('เกณฑ์เลือกรถ', v.rule || '', { placeholder: 'ทรัค / เนต', error: E('กรุณาเลือกเกณฑ์เลือกรถ') })])], 16),
    col('Section', [await section('เลือกรถเข้าแผน', { badge: right.length }), row('Row', [field('ค้นหารถ', o.query, { placeholder: 'ค้นหาทะเบียน, รุ่น, หน่วยงาน', lead: 1 }), frame('Spacer', 'VERTICAL')]), dual], 16),
    partsSec,
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'บันทึกและส่งตรวจสอบ', { size: 'lg' }]])
  ], 32), 'h');
  return scr;
}
const FILLED = { name: NEW_PLAN[1], year: '2570', q: 'Q2', rule: 'ทรัค' };

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
  if (o.result === 'short') nodes.push(alertBox('Warning', 'ระบบจองอะไหล่ตอบกลับ: จองได้ 3 รายการ · คงเหลือไม่พอ 2 รายการ', 'ไส้กรองไฮโดรลิก · จาระบีอเนกประสงค์ — ส่งรายการให้ ผพจ. จัดซื้อ (S3) แล้ว รอของเข้าคลัง'));
  if (o.result === 'ok') nodes.push(alertBox('Success', 'มีอะไหล่พร้อมครบตามแผน', 'จองผ่านระบบจองอะไหล่แล้ว 5 รายการ · เลือกรูปแบบดำเนินการเพื่อไปทำแผนเดินทาง'));
  if (o.result) nodes.push(col('Section', [await section('รายการอะไหล่ที่ต้องใช้ตามแผน', { badge: PARTS.length }), await tbl(PART_COLS, PARTS.map((p, i) => partRow(p, i, o)))], 16));
  else nodes.push(await partsPanel(o));
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
  const left = CARS.filter((_, i) => sel.indexOf(i) < 0), right = CARS.filter((_, i) => sel.indexOf(i) >= 0);
  const mid = MOB ? row('Actions', [btn('Secondary button', 'เพิ่ม'), btn('Secondary button', 'นำออก', { disabled: !sel.length })], { gap: 12, keep: true })
    : col('Actions', [btn('Secondary button', 'เพิ่ม'), btn('Secondary button', 'นำออก', { disabled: !sel.length })], 12);
  const L = await listCheck('รถในแผน (' + left.length + ')', left, []), R = await listCheck('รถที่จะบำรุงรักษาในใบนี้ (' + right.length + ')', right, []);
  const dual = row('Dual list', [L, mid, R], { gap: 16 }); mid.layoutGrow = 0; if (!MOB) mid.primaryAxisAlignItems = 'CENTER';
  const d1 = field('วันที่เดินทาง ตั้งแต่', v.d1, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่เริ่ม'), state: o.dateOpen ? 'Focused' : undefined });
  const d2 = field('ถึงวันที่', v.d2, { placeholder: 'วว/ดด/ปปปป', error: E('กรุณาเลือกวันที่สิ้นสุด') });
  const place = dropdown('สถานที่บำรุงรักษา (จุดรวมงาน)', v.place, { placeholder: 'ค้นหาจุดรวมงาน', lead: 'search-24-300-round', error: E('กรุณาเลือกสถานที่บำรุงรักษา') });
  const staff = [0, 1, 2].map(i => dropdown('พนักงาน กบค. ซ่อม คนที่ ' + (i + 1) + (i === 2 ? ' (ถ้ามี)' : ''), v.staff ? v.staff[i] : '', { placeholder: 'ค้นหาชื่อ-นามสกุล, รหัสพนักงาน', lead: 'search-24-300-round', error: i < 2 ? E('กรุณาเลือกพนักงาน') : '' }));
  add(page, col('Content', [
    col('Section', [await section('รายละเอียดแผนเดินทาง'), row('Row', [place, d1, d2])], 16),
    col('Section', [await section('เลือกรถที่จะบำรุงรักษา', { badge: right.length }), dual], 16),
    col('Section', [await section('พนักงาน กบค. ซ่อม (2-3 คน)'), row('Row', staff)], 16),
    col('Section', [await section('ค่าใช้จ่าย (บาท)'), row('Row', [field('ค่าเบี้ยเลี้ยง', v.perDiem, { placeholder: '0', error: E('กรุณาระบุค่าเบี้ยเลี้ยง') }), field('ค่าที่พัก', v.lodging, { placeholder: '0', error: E('กรุณาระบุค่าที่พัก') }), field('ค่าเดินทาง', v.travel, { placeholder: '0', error: E('กรุณาระบุค่าเดินทาง') })])], 16),
    btnRow([['Secondary button', 'ย้อนกลับ', { size: 'lg' }], ['Primary button', 'ยืนยันการสร้างแผนเดินทาง', { size: 'lg' }]])
  ], 32), 'h');
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

/* ---------- รายการจอแยกตาม scenario (ชื่อ = scenario ใน 14-บำรุงรักษา-userflow.md) ---------- */
const SCENARIOS = [
  ['S1 · กบค. สร้างแผนบำรุงรักษา', [
    ['รายการแผน', () => listScreen('S1 รายการแผน', { rows: PLANS })],
    ['ฟอร์มสร้างแผน (ว่าง)', () => planForm('S1 ฟอร์มสร้างแผน', {})],
    ['กดบันทึกโดยยังไม่ครบ', () => planForm('S1 ยังไม่ครบ', { errors: true })],
    ['เลือกรถแล้ว — ระบบคำนวณอะไหล่', () => planForm('S1 เลือกรถแล้ว', { values: FILLED, sel: [0, 1, 4, 5] })],
    ['ย้อนกลับ — ยืนยันการออก', async () => { const s = await planForm('S1 ยืนยันการออก', { values: FILLED, sel: [0, 1] }); await confirm(s, { title: 'ยืนยันการออก', sub: 'ข้อมูลที่กรอกไว้จะไม่ถูกบันทึก', cancel: 'ปิด', ok: 'ออก' }); return s; }],
    ['บันทึกไม่สำเร็จ', async () => { const s = await planForm('S1 บันทึกไม่สำเร็จ', { values: FILLED, sel: [0, 1, 4, 5] }); notify(s, 'general error', true); return s; }],
    ['บันทึกสำเร็จ — รอ ผพจ. ตรวจสอบ', async () => { const s = await listScreen('S1 บันทึกสำเร็จ', { rows: [NEW_PLAN].concat(PLANS) }); notify(s, 'การสร้างแผนบำรุงรักษาสำเร็จ'); return s; }]]],
  ['S4 · กบค. ตรวจสอบจำนวนรถปัจจุบันตามแผน', [
    ['รายการรถในแผน — มีรถสถานะโอน', () => vehiclesScreen('S4 รายการรถ', {})],
    ['ยืนยันนำรถออกจากแผน', async () => { const s = await vehiclesScreen('S4 ยืนยันนำรถออก', {}); await confirm(s, { danger: true, title: 'ยืนยันการนำรถออกจากแผน', sub: '81-2210 เชียงใหม่ สถานะ "โอน" จะถูกนำออกจากแผน ' + P[0] + ' และระบบจะปรับรายการอะไหล่ให้', ok: 'นำออก' }); return s; }],
    ['นำรถออกแล้ว', async () => { const s = await vehiclesScreen('S4 นำรถออกแล้ว', { removed: true }); notify(s, 'นำรถออกจากแผนแล้ว'); return s; }],
    ['ยืนยันจำนวนรถ', async () => { const s = await vehiclesScreen('S4 ยืนยันจำนวนรถ', { removed: true }); await confirm(s, { title: 'ยืนยันจำนวนรถตามแผน', sub: 'รถในแผน 5 คัน · พร้อม 3 · ไม่พร้อม 1 · ยังไม่ตอบ 1 — ไปขั้นเบิกอะไหล่ (S5)', ok: 'ยืนยัน' }); return s; }]]],
  ['S5 · กบค. ตรวจสอบและเบิกอะไหล่ผ่านระบบจองอะไหล่', [
    ['คลังอะไหล่ + อะไหล่ตามแผน (ยังไม่เลือก)', () => partsScreen('S5 คลังอะไหล่', {})],
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
  ['S10 · กบค./ผู้รับจ้าง บันทึกงานบำรุงรักษารายคัน', [
    ['รายการรถตามแผนเดินทาง', () => workList('S10 รายการรถ', {})],
    ['บันทึกงาน (ว่าง)', () => workForm('S10 บันทึกงาน', {})],
    ['บำรุงรักษาไม่ได้ — ระบุสาเหตุ', () => workForm('S10 ทำไม่ได้', { cannot: true, reason: 'รถติดภารกิจซ่อมสายส่งฉุกเฉิน ไม่อยู่ที่หน่วยงานในวันนัด' })],
    ['กดบันทึกโดยยังไม่ครบ', () => workForm('S10 ยังไม่ครบ', { errors: true })],
    ['กรอกครบ', () => workForm('S10 กรอกครบ', { filled: true })],
    ['บันทึกสำเร็จ', async () => { const s = await workList('S10 บันทึกสำเร็จ', { done: [0] }); notify(s, 'บันทึกงานบำรุงรักษาสำเร็จ'); return s; }],
    ['ดูงานที่บันทึกแล้ว — ภาพก่อน/หลัง', () => workDetail('S10 งานที่บันทึกแล้ว', {})]]],
  ['S12 · กบค. บันทึกผลตรวจน้ำมันไฮโดรลิก', [
    ['งานรายคัน — รอผลตรวจน้ำมัน', () => workDetail('S12 รอผลตรวจ', { oilBtn: true })],
    ['ฟอร์มบันทึกผลตรวจ (ว่าง)', () => oilForm('S12 ฟอร์มผลตรวจ', {})],
    ['กรอกครบ', () => oilForm('S12 กรอกครบ', { v: true })],
    ['บันทึกสำเร็จ — แจ้งเจ้าของรถ', async () => { const s = await workDetail('S12 บันทึกสำเร็จ', { oil: true }); notify(s, 'บันทึกผลตรวจน้ำมันไฮโดรลิกสำเร็จ · แจ้งเตือนเจ้าของรถแล้ว'); return s; }]]],
  ['S15 · กบค. บันทึกและส่งประวัติงานบำรุงรักษา', [
    ['ความคืบหน้ารายคัน (ยังไม่ครบ)', () => progressScreen('S15 ยังไม่ครบ', { done: 10 })],
    ['ครบทุกคัน — ประวัติงานบำรุงรักษา', () => historyScreen('S15 ครบทุกคัน', {})],
    ['ยืนยันส่งประวัติ', async () => { const s = await historyScreen('S15 ยืนยันส่ง', {}); await confirm(s, { title: 'ส่งประวัติให้หัวหน้า กบค. ตรวจสอบ', sub: 'ประวัติงานบำรุงรักษา ' + P[4] + ' คันของแผน ' + P[0] + ' จะแก้ไขไม่ได้จนกว่าหัวหน้าจะตรวจเสร็จ', ok: 'ส่งประวัติ' }); return s; }],
    ['ส่งแล้ว — รอหัวหน้าตรวจสอบ', async () => { const s = await historyScreen('S15 ส่งแล้ว', { sent: true }); notify(s, 'ส่งประวัติงานบำรุงรักษาให้หัวหน้าตรวจสอบแล้ว'); return s; }]]],
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
  S1: { 'รายการแผน': 'D1', 'ฟอร์มสร้างแผน (ว่าง)': 'D2', 'กดบันทึกโดยยังไม่ครบ': 'Q1', 'เลือกรถแล้ว — ระบบคำนวณอะไหล่': 'D3', 'บันทึกสำเร็จ — รอ ผพจ. ตรวจสอบ': 'A3' },
  S4: { 'รายการรถในแผน — มีรถสถานะโอน': 'D1', 'ยืนยันนำรถออกจากแผน': 'A2', 'นำรถออกแล้ว': 'A2', 'ยืนยันจำนวนรถ': 'A4' },
  S5: { 'คลังอะไหล่ + อะไหล่ตามแผน (ยังไม่เลือก)': 'D1', 'เลือกอะไหล่ครบตามแผน': 'A2', 'สรุปรายการเบิก/จอง': 'D2', 'ผลจอง — คงเหลือไม่พอ 2 รายการ': 'D3', 'อะไหล่พร้อมครบ — เลือกรูปแบบดำเนินการ': 'D4' },
  S6: { 'แผนเดินทางของแผนนี้ (ยังไม่มี)': 'D1', 'ฟอร์มสร้างแผนเดินทาง (ว่าง)': 'D2', 'เลือกช่วงวันเดินทาง': 'A2', 'กดยืนยันโดยยังไม่ครบ': 'Q1', 'กรอกครบ': 'A4', 'ยืนยันแล้ว — ส่ง Notification': 'D3' },
  S10: { 'รายการรถตามแผนเดินทาง': 'D1', 'บันทึกงาน (ว่าง)': 'D2', 'บำรุงรักษาไม่ได้ — ระบุสาเหตุ': 'A3', 'กดบันทึกโดยยังไม่ครบ': 'Q2', 'กรอกครบ': 'A8', 'บันทึกสำเร็จ': 'A9' },
  S12: { 'งานรายคัน — รอผลตรวจน้ำมัน': 'D1', 'ฟอร์มบันทึกผลตรวจ (ว่าง)': 'D2', 'กรอกครบ': 'A2', 'บันทึกสำเร็จ — แจ้งเจ้าของรถ': 'D3' },
  S15: { 'ความคืบหน้ารายคัน (ยังไม่ครบ)': 'D1', 'ครบทุกคัน — ประวัติงานบำรุงรักษา': 'D2', 'ยืนยันส่งประวัติ': 'A2', 'ส่งแล้ว — รอหัวหน้าตรวจสอบ': 'D3' },
  S17: { 'รายงานผล (ประวัติผ่านแล้ว)': 'D2', 'ยืนยันปิดงาน': 'Q1', 'ปิดงานแล้ว': 'D3' },
  S18: { 'ต้นทุนการบำรุงรักษา + Summary': 'D2 D3', 'ดาวน์โหลด Excel แล้ว': 'A3' },
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

figma.ui.onmessage = async (msg) => {
  try {
    const o = { devices: msg.devices, pick: msg.pick };
    if (msg.type === 'build') await build(o);
    if (msg.type === 'build-desktop') await buildDesktop();
    if (msg.type === 'build-mobile') await buildMobile();
    if (msg.type === 'build-pick') await buildPick(o);
    if (msg.type === 'check') { log('— เช็ค component (ไม่สร้างอะไร) —'); await resolveAll(NEEDED, true); log(deviceSetInfo()); }
  } catch (e) { log('✗ หยุด — ' + (e && e.message ? e.message : e)); }
};
figma.ui.postMessage({ type: 'scenarios', items: SCENARIOS.map(x => x[0]) });   // รายการติ๊กของปุ่ม "สร้างเฉพาะ scenario ที่เลือก"
