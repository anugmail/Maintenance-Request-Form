// common.js — helper ที่ทุกหน้าของโฟลว์บำรุงรักษาใช้ร่วมกัน
// โหลดก่อน app.js / plan-new.js / supplies.js เสมอ
// (แยกออกมาเพราะหลังแยก "ออกเลขงาน" เป็นคนละหน้า ต้องใช้ helper ชุดเดียวกัน)

const $ = id => document.getElementById(id);

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function toast(m) {
  const t = $('toast');
  if (!t) return;
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(t._x);
  t._x = setTimeout(() => t.classList.remove('show'), 2600);
}

// เวลาปัจจุบันแบบไทย — Date() อยู่ฝั่ง browser เท่านั้น
// (ห้ามเรียกใน mock-yearly.js เพื่อให้ logic ที่นั่น pure/testable)
function nowTh() {
  return new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

const QUARTERS = [
  { q: 'Q1', months: 'ต.ค.–ธ.ค.' },
  { q: 'Q2', months: 'ม.ค.–มี.ค.' },
  { q: 'Q3', months: 'เม.ย.–มิ.ย.' },
  { q: 'Q4', months: 'ก.ค.–ก.ย.' },
];

const STATUS_BADGE_CLASS = { available: 'b-ok', pending_approval: 'b-low', transferred: 'b-brand' };

const STATUS_HISTORY_LABELS = {
  draft: 'ฉบับร่าง', issued: 'ออกเลขงาน', notified: 'แจ้งฝ่ายพัสดุ', acknowledged: 'ฝ่ายพัสดุรับทราบ',
};

function renderTimelineHtml(history) {
  if (!history || !history.length) return '';
  return `
    <div class="sect">ประวัติการดำเนินการ</div>
    <ul class="tl">${history.map((h, i) => `
      <li class="${i === history.length - 1 ? 'on' : ''}">
        <b>${esc(STATUS_HISTORY_LABELS[h.status] || h.status)}</b>
        <div class="when">${esc(h.at)}</div>
        <div>${esc(h.note)}</div>
      </li>`).join('')}</ul>`;
}

function quarterYearText(plan) {
  const info = QUARTERS.find(q => q.q === plan.quarter);
  if (!plan.quarter) return `ปีงบประมาณ ${esc(plan.year)} — ยังไม่เลือกไทรมาส`;
  return `${esc(plan.quarter)}${info ? ' (' + esc(info.months) + ')' : ''} / ${esc(plan.year)}`;
}

// วันที่จาก <input type="date"> (YYYY-MM-DD ปี พ.ศ.) → อ่านง่ายแบบไทย
const TH_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
function dateTh(v) {
  if (!v) return '-';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return esc(v);
  return `${Number(m[3])} ${TH_MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

// หัวข้อของแผน = เลขงาน · ถ้ายังไม่ออกเลขให้ใช้ชื่อแผนไปก่อน
function planTitle(plan) {
  return plan.workNumber || (plan.planName ? plan.planName : '(แผนใหม่ ยังไม่ตั้งชื่อ)');
}

// แปลง Date -> ISO ปี พ.ศ. ('2569-08-10') ให้ตรงรูปแบบ dueAt และ <input type="date">
// (Date อยู่ฝั่ง browser เท่านั้น — ห้ามย้ายไป mock-yearly.js)
// จุดเดียวของการคำนวณปี พ.ศ. + zero-pad — todayIso() และ dueAt (bindProcStepConfirm
// ใน app.js) เรียกตัวนี้ทั้งคู่ กันพลาดถ้าสูตรออฟเซ็ตปี/padding เปลี่ยนแล้วแก้ไม่ครบ
function toIsoBE(d) {
  return `${d.getFullYear() + 543}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayIso() {
  return toIsoBE(new Date());
}
