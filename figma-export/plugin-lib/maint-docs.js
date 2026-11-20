/* เอกสารงานบำรุงรักษาตามวาระย้ายไปรีโป maintenance-utility-vehicle (20 พ.ย. 2569 เจ้าของงาน "อยากแก้ส่วนของเอกสาร ให้แยกออกจากกัน")
   path ใน build.json และ --src ยังเขียนแบบเดิม "Diagram/01-บำรุงรักษาตามวาระ/…" (ชื่อโฟลเดอร์เดียวกันทั้งสองรีโป)
   docPath(rel): มีไฟล์ในรีโปนี้ (เช่นเอกสาร Overhaul ที่ยังอยู่) → ใช้ของรีโปนี้ · ไม่มี → หาในรีโปบำรุงรักษา
   รีโปบำรุงรักษาตั้งต้นอยู่ข้างโฟลเดอร์ Maintenance-Request (…/Maintain-D/maintenance-utility-vehicle) · ที่อื่นตั้ง MAINT_REPO=<path> */
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const MAINT_REPO = process.env.MAINT_REPO ? path.resolve(process.env.MAINT_REPO) : path.resolve(ROOT, '..', '..', 'maintenance-utility-vehicle');
function docPath(rel) {
  const local = path.resolve(ROOT, rel);
  if (path.isAbsolute(rel) || fs.existsSync(local)) return local;
  const moved = path.resolve(MAINT_REPO, rel);
  if (fs.existsSync(moved)) return moved;
  throw new Error('ไม่เจอ ' + rel + ' ทั้งในรีโปนี้และรีโปบำรุงรักษา (' + MAINT_REPO + ') — clone maintenance-utility-vehicle ไว้ข้างกัน หรือตั้ง MAINT_REPO');
}
module.exports = { docPath, MAINT_REPO, ROOT };
