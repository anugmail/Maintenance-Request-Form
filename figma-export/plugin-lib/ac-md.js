/* AC รายจอ (.md แม่แบบของทีม 30 ต.ค. 2569) → ข้อมูลให้ปลั๊กอินวางการ์ด AC ใต้จอ — build-plugin.js เรียกเมื่อ build.json มี "ac"
   รูปแบบที่อ่าน: `## AC <รหัสจอ> — ชื่อ` · `### หัวข้อ` · `- ข้อ` · `  - ข้อย่อย` (ย่อหน้าอื่น/บรรทัด > ข้าม)
   คืน { 'A.1': { title, sections: [{ h, items: [{ t, sub: [..] }] }] } } · ตัด **ตัวหนา** / `โค้ด` / [ลิงก์](…) เหลือข้อความ */
const fs = require('fs');
const clean = (s) => s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').trim();

function parse(file) {
  const out = {};
  let cur = null, sec = null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    let m;
    if ((m = line.match(/^## AC (\S+)\s+[—-]\s+(.+)$/))) { cur = out[m[1]] = { title: clean(m[2]), sections: [] }; sec = null; continue; }
    if (/^## /.test(line)) { cur = null; continue; }
    if (!cur) continue;
    if ((m = line.match(/^### (.+)$/))) { sec = { h: clean(m[1]), items: [] }; cur.sections.push(sec); continue; }
    if (!sec) continue;
    if ((m = line.match(/^- (.+)$/))) sec.items.push({ t: clean(m[1]), sub: [] });
    else if ((m = line.match(/^\s{2,}- (.+)$/)) && sec.items.length) sec.items[sec.items.length - 1].sub.push(clean(m[1]));
  }
  return out;
}
module.exports = { parse };
