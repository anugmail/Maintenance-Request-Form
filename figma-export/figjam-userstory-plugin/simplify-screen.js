// Keep interaction/business rules; remove stale design-only annotations from the
// displayed notes. Original source documents remain available for reference.
// Observable behavior includes display rules, not only click handlers. Keep
// these contracts when trimming descriptions of headings, columns or icons.
function hasQaBehavior(text) {
  return /กด|บันทึก|เลือก|ค้นหา|ดาวน์โหลด|ยืนยัน|กลับ|ต้องเคาะ|เมื่อ|หาก|กรณี|ต้องไม่|ห้าม|เท่านั้น|อย่างน้อย|ไม่เกิน|เกินคอลัมน์|ตัดด้วย|อ่านอย่างเดียว|ซ่อน|ปิดใช้งาน|ไม่สามารถ|disabled|read.?only|validation|error|loading|empty|overflow|ellipsis/i.test(text);
}

function simplifyScreenSections(sections) {
  const start = sections.findIndex(s => s.label === 'รายละเอียดหน้าจอ');
  const end = sections.findIndex(s => s.label.startsWith('มุม Dev'));
  if (start < 0 || end < 0) return sections;
  const screen = sections.slice(start, end);
  const allFacts = screen.flatMap(s => s.bullets || []);
  const confirmedColumns = allFacts.find(t => t.startsWith('คอลัมน์ CF: เลขแผน, ชื่อแผน,'));
  const renameElsewhere = sections.slice(0, start).some(s => (s.bullets || []).some(t => t.includes('ลูกค้าแก้ชื่อสถานะ:')));
  const renameOnScreen = allFacts.some(t => t.includes('ลูกค้าแก้ชื่อสถานะ:'));
  let emittedColumns = false;
  let emittedStatusControl = false;
  const tagOf = text => (text.match(/\[Sheet พี่นุ[^\]]*\]/g) || []).join(' ');
  function staticDesign(text) {
    return /^ตัดออก:/.test(text) ||
      /^คอลัมน์ "ประเภทงบ" แสดง 2 บรรทัด:/.test(text) ||
      /^จัดการ: ลูกค้าขอเป็น ICON Action/.test(text) ||
      // A route or action is meaningful; a line containing only breadcrumb and
      // heading layout repeats the design without adding a behavioral contract.
      (/^(?:breadcrumb|หัวข้อ)\s/.test(text) && !hasQaBehavior(text));
  }
  const cleaned = screen.map(section => {
    const result = {...section};
    if (result.bullets) result.bullets = result.bullets.flatMap(text => {
      if (staticDesign(text)) return [];
      if (confirmedColumns && /^ตารางมี \d+ คอลัมน์:/.test(text) && !hasQaBehavior(text)) return [];
      if (confirmedColumns && /^มีแผนอยู่ในระบบ กบค\. เปิดหน้า/.test(text) && !/เมื่อ|หาก|กรณี|ต้องไม่|ห้าม|เท่านั้น|เกินคอลัมน์|ตัดด้วย|อ่านอย่างเดียว|ซ่อน|ปิดใช้งาน|disabled|error/i.test(text)) return [];
      if (confirmedColumns && /^"ความคืบหน้า" แสดง/.test(text)) return [];
      if ((renameElsewhere || renameOnScreen) && /^(?:"สถานะ" เป็น chip:|Status: chip )/.test(text)) return [];
      if ((renameElsewhere || renameOnScreen) && /^สถานะ: checkbox \d+ ค่า/.test(text)) {
        if (emittedStatusControl) return [];
        emittedStatusControl = true;
        return ['ช่องเลือกสถานะ: เลือกได้หลายค่าพร้อมกัน'];
      }
      if (renameElsewhere && text.includes('ลูกค้าแก้ชื่อสถานะ:')) return [];
      if (text.startsWith('คอลัมน์ CF: เลขแผน, ชื่อแผน,')) {
        if (emittedColumns) return [];
        emittedColumns = true;
        return ['คอลัมน์ในตาราง ' + tagOf(text) + ':\n' + [
          'เลขแผน', 'ชื่อแผน', 'ประเภทงบ', 'ปีงบประมาณ', 'งบประมาณ (บาท)',
          'จำนวนรถที่ Overhaul: นับรถไม่ซ้ำจากทุก PO',
          'ความคืบหน้า: รถที่ปิดงานแล้ว / รถทั้งหมด; แผนที่ยังไม่มี PO แสดง “-”',
          'สถานะ', 'วันที่สร้าง', 'จัดการ',
        ].map(name => '  - ' + name).join('\n')];
      }
      // Retain the sorting rule, not the description of the icon's location.
      if (confirmedColumns && /^ไอคอน sort มีที่/.test(text)) return [];
      return [text];
    });
    return result;
  }).filter(s => s.paragraph || s.table || s.code || (s.bullets && s.bullets.length));
  if (cleaned.length) {cleaned[0].label = 'รายละเอียดหน้าจอ'; cleaned[0].level = 'h2';}
  const result = [...sections.slice(0, start), ...cleaned, ...sections.slice(end)];
  // These are explicitly visual mock errata already handled by the design, not
  // unsolved behavior. Keep permission, validation and competing behavior rules.
  return result.map(s => s.label !== 'ประเด็นที่ต้องเคาะ' ? s : {
    ...s, bullets: (s.bullets || []).filter(text => !/^(?:ชื่อแผน "Overhaul.*mock ไม่ตรงกัน|mock A\.1 ไม่มีคอลัมน์)/.test(text)),
  }).filter(s => s.paragraph || s.table || s.code || (s.bullets && s.bullets.length));
}
module.exports = {simplifyScreenSections, hasQaBehavior};
