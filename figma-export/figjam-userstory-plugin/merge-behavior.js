// Merge identical/contained rules conservatively. Different conditions, source
// tags and qualifications are retained rather than guessed to be equivalent.
function plainLanguage(text) {
  return text.replace(/ค่าร่างล่าสุด/g, 'ค่าที่เลือกล่าสุด')
    .replace(/ค่าร่าง|ฉบับร่าง/g, 'ค่าที่เลือกไว้')
    .replace(/\bdraft\b/g, 'ข้อมูลที่ยังไม่บันทึก');
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
