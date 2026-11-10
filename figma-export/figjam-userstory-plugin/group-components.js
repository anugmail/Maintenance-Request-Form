// Presentation only: preserve source wording/provenance, group by the component
// being described (rather than every component mentioned in its behavior).
const UI_LABEL = 'UI Component & Behavior';
const {mergeRules, plainLanguage} = require('./merge-behavior');
function componentFor(text) {
  const head = text.split(/[:：]| → /)[0];
  if (/^(?:ไม่มี|ไม่แสดง|ซ่อน)(?:ช่องค้นหา|ปุ่ม|ตัวกรอง|การแบ่งหน้า)/.test(head)) return ['Visibility'];
  if (/Pagination|เปลี่ยนหน้าใต้ตาราง|จำนวนรายการต่อหน้า|^แบ่งหน้า/.test(head)) return ['Table (DataTable)', 'Pagination'];
  if (/RowMenu|ท้ายแถว|จัดการ.*(?:Action|เมนู)/.test(head)) return ['Table (DataTable)', 'Row Actions (RowMenu)'];
  if (/^(?:ปุ่ม|กดปุ่ม)/.test(head)) return ['Buttons'];
  if (/^(?:ช่องกรอก|ออกจากช่องบังคับ|วงเงิน)/.test(head)) return ['Form Fields'];
  if (/^(?:แถบขั้นตอน|Stepper)/.test(head)) return ['Stepper'];
  if (/Sorting|sort|เรียงลำดับ/i.test(head)) return ['Table (DataTable)', 'Sorting'];
  if (/คอลัมน์|ชื่อแผนยาว|ความคืบหน้า.*แสดง|จำนวนรถที่ Overhaul/.test(head)) return ['Table (DataTable)', 'Columns'];
  if (/DataTable|ตารางรายการ|^ตาราง/.test(head)) return ['Table (DataTable)', 'Behavior'];
  if (/SearchInput|ช่องค้นหา|^ค้นหา|^Search/.test(head)) return ['Search Input (SearchInput)'];
  if (/FilterPanel|PlanFilter|FilterDrawer|^แผง.*ตัวกรอง|^คลิกภายในแผง|^กด “ล้างตัวกรอง”|^จุดต่างในโค้ด/.test(head)) return ['Side panel (FilterPanel)'];
  if (/ConfirmDialog|Modal|^กล่อง|^modal/i.test(head)) return ['Modal'];
  if (/FileUpload|ไฟล์|เอกสาร|แนบ/.test(head)) return ['File Upload (FileUpload)'];
  if (/EmptyState|ไม่พบแผน|ยังไม่มีแผน|ส่วนแสดงเมื่อไม่มีข้อมูล/.test(head)) return ['Empty State (EmptyState)'];
  if (/Combobox/.test(head)) return ['Combobox'];
  if (/DualList|รายการเลือกรถ|ป้ายรายการที่เลือก/.test(head)) return ['Vehicle Selection'];
  if (/ลายเซ็น|พื้นที่วาด/.test(head)) return ['Signature'];
  if (/DateRangeInput|วันที่|ช่วงวัน|ปฏิทิน/.test(head)) return ['Date Input'];
  if (/Stepper|stepper|ขั้นตอน|ขั้น 0/.test(head)) return ['Stepper'];
  if (/checkbox|ช่องติ๊ก|ช่องเลือกสถานะ|^งบประมาณ.*checkbox/i.test(text.slice(0, 100))) return ['Checkbox'];
  if (/Status|สถานะ|ป้ายสถานะ/.test(head)) return ['Status (StatusBadge)'];
  if (/dropdown|ปีงบ|SelectField|ช่องเลือก/.test(head)) return ['Select Field'];
  if (/ช่องกรอก|TextField|ฟิลด์/.test(head)) return ['Form Fields'];
  if (/ปุ่ม|Button/.test(head)) return ['Buttons'];
  if (/breadcrumb|เส้นทางนำทาง|ย้อนกลับ|^จาก.*(?:Form|plans)|^จากหน้ารายการ/.test(head)) return ['Navigation'];
  return ['Page Behavior'];
}
function groupComponents(sections, frameId) {
  const start = sections.findIndex(s => s.label === 'รายละเอียดหน้าจอ');
  const dev = sections.findIndex(s => s.label.startsWith('มุม Dev'));
  if (start < 0 || dev < start) throw new Error('Missing component source sections');
  const groups = new Map();
  const tables = [];
  const input = [...sections.filter(s => s.label === 'Behavior'), ...sections.slice(start, dev + 1)];
  const add = (text, origin) => {
    if (text.startsWith('ลูกค้าแก้ข้อความในช่องค้นหา:') && text.includes('\nรายละเอียดการค้นหา:')) {
      for (const item of text.split('\n')) add(item, origin);
      return;
    }
    let [name, child] = componentFor(text);
    if (/^(ลูกค้าแก้ข้อความในช่องค้นหา:|รายละเอียดการค้นหา:)/.test(text)) name = 'Search Input (SearchInput)';
    if (frameId === 'A.2') {
      child = /Checkbox|Select Field|Form Fields/.test(name) || /ปีงบ|งบประมาณ|สถานะ|ประเภทยานพาหนะ/.test(text.split(/[:：]/)[0]) ? 'Fields'
        : 'Behavior';
      name = 'Side panel (FilterPanel)';
    }
    if (!groups.has(name)) groups.set(name, new Map());
    const children = groups.get(name);
    const key = child || 'Behavior';
    if (!children.has(key)) children.set(key, {facts: [], notes: []});
    const target = children.get(key)[origin === 'dev' ? 'notes' : 'facts'];
    if (!target.includes(text)) target.push(text);
  };
  for (const section of input) {
    const origin = section.label.startsWith('มุม Dev') ? 'dev' : 'screen';
    for (const fact of section.bullets || []) add(fact, origin);
    if (section.paragraph) add(section.paragraph, origin);
    for (const code of section.code || []) add(code, origin);
    if (section.table) tables.push({...section, label: section.label || 'Supporting Table'});
  }
  const bullets = [];
  for (const [name, children] of groups) {
    const lines = [name];
    for (const [child, {facts, notes}] of children) {
      const nested = name === 'Table (DataTable)' || frameId === 'A.2';
      if (nested) lines.push('  - ' + child);
      const indent = nested ? '    ' : '  ';
      let rules = mergeRules([...facts, ...notes]);
      if (frameId === 'A.1' && name === 'Table (DataTable)' && child === 'Columns') {
        const overflow = rules.find(rule => /^ชื่อแผนยาวเกินคอลัมน์/.test(rule));
        const columns = rules.findIndex(rule => rule.startsWith('คอลัมน์ในตาราง ') && /\n  - ชื่อแผน(?:\n|$)/.test(rule));
        if (overflow && columns >= 0) {
          rules[columns] = rules[columns].replace(/(\n  - ชื่อแผน)(?=\n|$)/, '$1: ' + overflow);
          rules = rules.filter(rule => rule !== overflow);
        }
      }
      if (frameId === 'A.2' && child === 'Behavior') rules = [
        'กด “ตัวกรอง” เปิดแผงด้านขวา (FilterPanel / PlanFilter) โดยแสดงตัวกรองที่ใช้อยู่จริง การเปลี่ยนค่าในแผงยังไม่เปลี่ยนตารางด้านหลัง',
        'กด “ตกลง” → กรองรายการตามค่าที่เลือกทั้งหมด แล้วปิดแผงกลับไปดูรายการ A.1',
        'กด “ยกเลิก” / × / Esc หรือคลิกพื้นหลังทึบ → ปิดแผงกลับไปดูรายการ A.1 โดยไม่ใช้ตัวกรองที่เพิ่งเปลี่ยน เปิดใหม่แสดงตัวกรองที่ใช้อยู่จริง',
        'กด “ล้างตัวกรอง” → ล้างตัวเลือกในแผง โดยแผงยังเปิด แล้วกด “ตกลง” เพื่ออัปเดตรายการ หากปิดแผงก่อนกด “ตกลง” รายการจะยังใช้ตัวกรองเดิม และเมื่อเปิดแผงอีกครั้ง ตัวเลือกจะกลับมาเป็นค่าเดิม',
        'คลิกภายในแผงหรือช่องกรองแล้วแผงไม่ปิด ขณะเปิดแผงหน้าเบื้องหลังเลื่อนไม่ได้ (useOverlay)',
        'แนวทางพัฒนานี้ใช้ PlanFilter ของ overhaul-next เป็นฐาน; FilterDrawer ในต้นแบบเก่าล้างแล้วกรองทันที จึงต้องระวังไม่ใช้พฤติกรรมเก่าปะปน',
      ];
      for (const rule of rules) lines.push(indent + '- ' + rule.replace(/\n/g, '\n' + indent + '  '));
    }
    bullets.push(lines.join('\n'));
  }
  return [{level: 'h2', label: UI_LABEL, bullets}, ...sections.slice(0, start).filter(s => s.label !== 'Behavior'), ...tables, ...sections.slice(dev + 1)].map(section => ({
    ...section,
    ...(section.bullets ? {bullets: section.bullets.map(plainLanguage)} : {}),
    ...(section.paragraph ? {paragraph: plainLanguage(section.paragraph)} : {}),
  }));
}
module.exports = {groupComponents, componentFor, UI_LABEL};
