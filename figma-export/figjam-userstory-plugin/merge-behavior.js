// Merge identical/contained rules conservatively. Different conditions, source
// tags and qualifications are retained rather than guessed to be equivalent.
function plainLanguage(text) {
  return text.replace(/ค่าร่างล่าสุด/g, 'ค่าตัวกรองที่ใช้อยู่กับรายการปัจจุบัน')
    .replace(/ค่าร่าง|ฉบับร่าง/g, 'ข้อมูลที่ยังไม่บันทึก')
    .replace(/\bdraft\b/g, 'ข้อมูลที่ยังไม่บันทึก')
    .replace(/ฟอร์ม/g, 'form')
    .replace(/([ก-๙])form/g, '$1 form')
    .replace(/form([ก-๙])/g, 'form $1')
    .replace(/เคอร์เซอร์/g, 'cursor')
    .replace(/โฟกัส/g, 'focus')
    .replace(/ช่องติ๊กเลือก|ช่องติ๊ก/g, 'checkbox')
    .replace(/ไอคอน\s*/g, 'icon ')
    .replace(/\bcontract\b/g, 'behavior')
    .replace(/\bpagination\b/gi, 'Pagination')
    .replace(/\bautocomplete\b/gi, 'AutoComplete')
    .replace(/\bdirty guard\b/g, 'การตรวจข้อมูลที่ยังไม่บันทึกก่อนออกจากหน้า')
    .replace(/คงคำที่พิมพ์/g, 'เก็บข้อความในช่องค้นหาไว้ ไม่ล้างออกเอง')
    .replace(/เปลี่ยนคำค้น\/ตัวกรองขณะอยู่หน้าหลังให้กลับหน้าแรกของผลใหม่/g,
      'เมื่อเปลี่ยนคำค้นหาหรือตัวกรอง ให้แสดงหน้า 1 ของผลค้นหาใหม่')
    .replace(/ปิดพื้นหลัง\/Esc/g, 'คลิกพื้นที่นอกแผงหรือกด Esc เพื่อปิด')
    .replace(/คลิก label ต้องเปลี่ยน\s*checkbox\s*ตัวเดียวกับที่แสดง/g,
      'คลิกข้อความข้าง checkbox เพื่อเลือกหรือยกเลิก checkbox ข้อนั้น');
}
function key(text) { return text.replace(/[“”"'`….;；\s]/g, '').toLowerCase(); }
function mergeRules(items) {
  const result = [];
  for (const raw of items) {
    const item = plainLanguage(raw);
    if (!result.some(existing => key(existing).includes(key(item)))) {
      // A more complete version may replace a shorter statement only when it
      // actually includes it, including any source tag or caveat.
      const shorter = result.findIndex(existing => key(item).includes(key(existing)));
      if (shorter >= 0) result[shorter] = item;
      else result.push(item);
    }
  }
  return result;
}
module.exports = {plainLanguage, mergeRules};
