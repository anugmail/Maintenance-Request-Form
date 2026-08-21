/* ============================================================
   Maintain-D — Job Store (job-store.js)
   ที่เก็บ "ใบแจ้งซ่อม" ร่วมกันระหว่างไฟล์ เพราะต้นแบบเป็น static HTML หลายไฟล์:
     - mock/Maintenance-Request-Form.html      (แอปหลัก — เจ้าของ JOBS ตัวจริง)
     - design-mock/kbk-self-repair-parts.html        (ขั้น 1 เบิกอะไหล่)
     - design-mock/kbk-self-repair-appointment.html  (ขั้น 2 นัดหมายวันซ่อม)
   เดิม JOBS อยู่ในหน่วยความจำล้วน ข้ามไฟล์ทีไรสถานะใบงานเด้งกลับค่าตั้งต้นทุกครั้ง

   เก็บใน localStorage key เดียว: maintaind.jobs.v1
   ⚠️ shape ของใบงานคือของ mock/Maintenance-Request-Form.html (statusInfo/renderMyDetail/
      kbkActionHTML) — โมดูลนี้ไม่ตีความอะไรทั้งสิ้น เก็บ/คืนตามที่ได้รับมา
   ⚠️ ล้างค่า: เปิดแอปหลักด้วย ?reset → กลับ seed ตั้งต้น
      (ล้าง localStorage เฉยๆ ไม่พอ เพราะหน้าที่เปิดค้างอยู่จะเขียนสถานะในหน่วยความจำกลับลงไปตอนออกจากหน้า)
   ============================================================ */
(function () {
const KEY = 'maintaind.jobs.v1';

/* คืน array ใบงานที่เซฟไว้ · ไม่มี/พังให้คืน null เพื่อให้ผู้เรียกใช้ seed ตั้งต้นแทน */
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const list = JSON.parse(raw);
    return Array.isArray(list) && list.length ? list : null;
  } catch (e) { return null }
}

function save(jobs) {
  try { localStorage.setItem(KEY, JSON.stringify(jobs)) } catch (e) {}
}

function clear() { try { localStorage.removeItem(KEY) } catch (e) {} }

function get(no) {
  const list = load();
  return list ? list.find(j => j.no === no) || null : null;
}

/* แก้ใบงานใบเดียวแล้วเซฟทั้งชุด — ใช้จากหน้า design-mock ที่ไม่มี JOBS ของตัวเอง
   fn(job) แก้ object ตรงๆ ได้เลย · คืน job ที่แก้แล้ว หรือ null ถ้าไม่เจอใบนั้น */
function update(no, fn) {
  const list = load();
  if (!list) return null;
  const j = list.find(x => x.no === no);
  if (!j) return null;
  fn(j);
  save(list);
  return j;
}

window.MDJ = { KEY, load, save, clear, get, update };
})();
