// Presentation only: expand explicit old/new pairs; never infer mappings by
// zipping unequal lists (e.g. two renamed states plus one unchanged state).
function formatContent(input) {
  let text = input.replace(/^\s*\d+[.)]\s*/, '');
  const tags = text.match(/\[Sheet พี่นุ[^\]]*\]/g) || [];
  const tag = [...new Set(tags)].join(' ');
  const cite = tag ? ' ' + tag : '';
  const body = text.replace(/\s*\[Sheet พี่นุ[^\]]*\]/g, '').trim();
  const isRename = body.includes('ลูกค้าแก้จาก "ยังไม่มี PO" / "ดำเนินการ"') ||
    (/^CHANGE — ชื่อสถานะ/.test(body) && body.includes('“ยังไม่มี PO” → “รอเลข PO”') && body.includes('“ดำเนินการ” → “รอดำเนินการ”'));
  if (isRename) {
    return (body.startsWith('CHANGE') ? 'CHANGE — ' : '') + 'ลูกค้าแก้ชื่อสถานะ:\n' +
      '  - ยังไม่มี PO -> รอเลข PO' + cite + '\n' +
      '  - ดำเนินการ -> รอดำเนินการ' + cite + '\n' +
      '  - เสร็จสิ้น: ใช้ชื่อเดิม' + cite;
  }
  if (body.startsWith('ค้นหา: เปลี่ยน placeholder "เลขศูนย์ต้นทุน" เป็น "เลขที่งบประมาณ"')) {
    const rest = body.split(' · ').slice(1);
    return 'ลูกค้าแก้ข้อความในช่องค้นหา: เลขศูนย์ต้นทุน -> เลขที่งบประมาณ' + cite +
      (rest.length ? '\nรายละเอียดการค้นหา: ' + rest.join(' · ').replace(/เลขศูนย์ต้นทุน/g, 'เลขที่งบประมาณ') + cite : '');
  }
  if (body.startsWith('ประเภทยานพาหนะ (เพิ่ม):') && body.includes('ลูกค้าเปลี่ยนตัวกรอง "รถ"')) {
    return 'ประเภทยานพาหนะ (เพิ่ม): ลูกค้าเปลี่ยนตัวกรอง\n' +
      '  - ค้นทะเบียนรถ -> เลือกประเภทยานพาหนะแบบเลือกได้หลายค่า' + cite + '\n' +
      '  - ตัวกรองแบบใหม่ยังไม่มีใน mock';
  }
  if (body.includes('ลูกค้าให้เปลี่ยนข้อความเป็น "ลบ PO สำเร็จ"') && body.includes('ลบ purchase order สำเร็จ')) {
    return 'ลูกค้าแก้ข้อความแจ้งผลลบ PO (ยืนยันแล้ว):\n' +
      '  - ลบ purchase order สำเร็จ -> ลบ PO สำเร็จ' + cite;
  }
  // Keep the supplied options. Formatting a list is not adding a new page size.
  text = text.replace(/Pagination\s*\(\s*(\d+(?:\s*,\s*\d+)+)\s*\)/gi, (_, values) => {
    const numbers = values.split(',').map(v => v.trim());
    return 'จำนวนรายการต่อหน้า: ' + numbers.slice(0, -1).join(', ') + ' หรือ ' + numbers[numbers.length - 1] + ' รายการ';
  });
  return text.replace('ลูกค้าฝากเรื่อง Record Per Page และ Pagination (CF)',
    'จำนวนรายการต่อหน้าและปุ่มเปลี่ยนหน้า: ลูกค้าฝากให้ตรวจรายละเอียด (CF)');
}
module.exports = {formatContent};

// Merge summary/full-source questions without silently discarding additional
// conditions from a longer version of the same question.
function mergeQuestions(sections) {
  const key = text => text.replace(/\[Sheet พี่นุ[^\]]*\]/g, '')
    .replace(/^(?:⚠️\s*)?(?:ต้องเคาะ|ต้องตกลง)\s*[:：]\s*/, '')
    .replace(/[“”]/g, '"').replace(/[…]+$/, '').replace(/\s+/g, ' ').trim();
  const result = [];
  for (const text of sections.flatMap(s => [...(s.bullets || []), ...(s.paragraph ? [s.paragraph] : [])])) {
    const normalized = key(text);
    if (!normalized) continue;
    const index = result.findIndex(item => key(item).includes(normalized) || normalized.includes(key(item)));
    if (index < 0) result.push(text);
    else if (normalized.length > key(result[index]).length) result[index] = text;
  }
  return result;
}

// Split mixed Sheet statements such as "Status ... · Permission ... · ไม่มี
// notification" while retaining provenance on each resulting fact.
function splitPermissionFacts(text) {
  const tags = [...new Set(text.match(/\[Sheet พี่นุ[^\]]*\]/g) || [])];
  const cite = tags.length ? ' ' + tags.join(' ') : '';
  const body = text.replace(/\s*\[Sheet พี่นุ[^\]]*\]/g, '').trim();
  const permission = [];
  const other = [];
  let inPermission = false;
  for (const part of body.split(/\s+·\s+/)) {
    const marker = /\bPermission\b\s*[:：—-]?\s*/i.exec(part);
    if (marker) {
      const before = part.slice(0, marker.index).replace(/\s*[—-]\s*$/, '').trim();
      if (before) other.push(before + cite);
      const value = part.slice(marker.index + marker[0].length).trim();
      if (value) permission.push(value + cite);
      inPermission = true;
      continue;
    }
    const explicitOther = /^(?:Status|Toast|Notification|ไม่มี notification|ไม่สำเร็จ|ลบเป็น|ลูกค้า|ตาราง|ช่องเลือก|breadcrumb)/i.test(part);
    const roleStatement = /^(?:ทุก role|role อื่น|กรย\.|หน่วยงานเจ้าของรถ|กบค\.)/.test(part) && /ดูอย่างเดียว|อ่านอย่างเดียว|เห็น|สิทธิ์|เฉพาะ/.test(part);
    if ((inPermission && !explicitOther) || roleStatement) permission.push(part + cite);
    else { other.push(part + cite); inPermission = false; }
  }
  // Do not reflow ordinary prose when there was no permission to separate.
  return permission.length ? {permission, other} : {permission: [], other: [text]};
}
module.exports.mergeQuestions = mergeQuestions;
module.exports.splitPermissionFacts = splitPermissionFacts;
