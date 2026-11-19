// Inline only rules actually documented in the full AC. Keep unresolved
// decisions explicit; do not turn missing Sheet values into confirmed enums.
const permissionTag = '[Sheet พี่นุ — OH-Permission]';
const scopeRules = [
  'กบค. (admin-super): เห็นทุกแผน ทุก PO และรถทุกคัน รวมรถต่างเขตและสำนักงานใหญ่; สร้าง/แก้ไข/ลบแผนได้ ' + permissionTag,
  'กรย. เขต (admin-region): เปิดได้เฉพาะแผนที่มีรถในเขตตัวเอง ภายในแผนเห็นเฉพาะ PO และรถในเขตตัวเอง และดูข้อมูลได้อย่างเดียว ' + permissionTag,
  'หน่วยงานเจ้าของรถ (admin-department): เปิดได้เฉพาะแผนที่มีรถของหน่วยงานตัวเอง เห็นหัว PO (เลข PO ชื่อ PO และอู่) แต่ไม่เห็นรถของหน่วยงานอื่น แม้อยู่ใน PO เดียวกัน; ดูข้อมูลได้ และตอบรับ/ปฏิเสธเฉพาะนัดเข้าอู่และนัดรับรถของตัวเอง ' + permissionTag,
  'admin-super ของหน่วยงานอื่น เช่น กกฟ.1/กกฟ.2: ดูได้เฉพาะรถในหน่วยงานตัวเอง; ความต่างจาก role หน่วยงานเจ้าของรถยังต้องตกลง ' + permissionTag,
  'แผนที่ยังไม่มี PO: มีเฉพาะ กบค. ที่เห็นและจัดการได้ กรย. เขตและหน่วยงานเจ้าของรถเริ่มเห็นเมื่อมี PO ที่มีรถในขอบเขตของตัวเอง ' + permissionTag,
  'ปุ่ม “+ สร้างแผน Overhaul” และเมนูแก้ไข/ลบแผนแสดงเฉพาะ กบค. role อื่นมีเฉพาะ “ดูรายละเอียด” ของแผนที่มีสิทธิ์เห็น [Sheet พี่นุ — 1 รายการแผน]',
  'API รายการและรายละเอียดต้องกรองแผน PO และรถตามสิทธิ์ด้วย ไม่ใช้เพียงการซ่อนปุ่มหรือแถวในหน้าจอ ' + permissionTag,
];
const statusQuestion = 'ต้องตกลงข้อความ “รายละเอียดตามสถานะ” ให้ครบแต่ละสถานะของรถ: รอนัดหมายเข้าอู่, รอหน่วยงานตอบรับนัดเข้าอู่, หน่วยงานปฏิเสธนัดเข้าอู่, รอตรวจรับรถ, กำลังซ่อม, รอตรวจสภาพ Safety, รอนัดหมายรับรถ, รอหน่วยงานตอบรับนัดหมายรับรถ, หน่วยงานปฏิเสธนัดหมายรับรถ, รอปิดงาน และปิดงานแล้ว; ต้นฉบับมีตัวอย่างข้อความเพียง 2 สถานะ รายการนี้ใช้ชื่อที่แสดงใน mock โดยชื่อที่ต่างจาก status final ใน Sheet ยังต้องตกลง';
function inlineRuleText(text) {
  if (text.includes('รายละเอียดตามสถานะ') && text.includes('ตารางกติกากลาง')) return statusQuestion;
  if (text.includes('ไม่มีใน Sheet PEA ดูกติกากลาง')) {
    return 'สถานะเริ่มต้นของรถหลังสร้าง PO ใน mock คือ “รอนัดหมายเข้าอู่” และอยู่ขั้น 01 นัดเอารถเข้าอู่ แต่ Sheet PEA ไม่มีชื่อนี้ ต้องตกลงชื่อสถานะที่จะใช้ก่อนกำหนด enum';
  }
  return text;
}
function inlineRules(story) {
  const sections = story.sections.map(section => ({
    ...section,
    ...(section.bullets ? {bullets: section.bullets.flatMap(text => text.includes('ทุก role เห็นเฉพาะแผน') && text.includes('ดูกติกากลาง') ? scopeRules : [inlineRuleText(text)])} : {}),
    ...(section.paragraph ? {paragraph: inlineRuleText(section.paragraph)} : {}),
  }));
  if (story.sections.some(s => (s.bullets || []).some(t => t.includes('ทุก role เห็นเฉพาะแผน') && t.includes('ดูกติกากลาง')))) {
    let questions = sections.find(s => s.label === 'ประเด็นที่ต้องเคาะ');
    if (!questions) {questions = {level: 'h3', label: 'ประเด็นที่ต้องเคาะ', bullets: []}; sections.push(questions);}
    questions.bullets = [...questions.bullets,
      'ต้องตกลงว่า “จำนวนรถ” และ “ความคืบหน้า x/n” ในรายการของ กรย. และหน่วยงานเจ้าของรถนับทั้งแผนหรือเฉพาะรถที่ role นั้นมีสิทธิ์เห็น ' + permissionTag,
      'ต้องตกลงความแตกต่างระหว่าง admin-super ของหน่วยงานอื่น (กกฟ.) กับ admin-department หน่วยงานเจ้าของรถ เพราะตารางสิทธิ์ระบุว่าทั้งคู่ดูรถของหน่วยงานตัวเอง ' + permissionTag,
    ];
  }
  return sections;
}
module.exports = {inlineRules, inlineRuleText};
