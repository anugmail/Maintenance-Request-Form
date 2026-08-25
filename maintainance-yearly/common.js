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

// ================= นาฬิกาของต้นแบบ (จริง / จำลอง) =================
// แผนบำรุงรักษาทำล่วงหน้า 2 ปี และมีรอบทบทวนทุกปลายปีงบ ⇒ เหตุการณ์สำคัญอยู่ในอนาคต
// (วันนี้ปีงบ 2569 · แผนใหม่เป็นของ 2571 · รอบทบทวนอยู่ปลายปีงบ 2570)
// ถ้าไม่มีตัวเลื่อนเวลา จะเดโมรอบทบทวนไม่ได้เลย ⇒ เก็บ "วันที่จำลอง" ไว้ใน localStorage
// แล้วให้ทุกหน้าอ่านเวลาผ่าน simNow() ตัวเดียว ห้ามเรียก new Date() ตรงๆ อีก
const SIMDATE_KEY = 'maintaind.yearly.simdate.v1';

function simNow() {
  try {
    const raw = localStorage.getItem(SIMDATE_KEY);
    if (raw) {
      const d = new Date(raw);
      if (!isNaN(d)) return d;
    }
  } catch (e) { /* localStorage ใช้ไม่ได้ → ใช้เวลาจริง */ }
  return new Date();
}

function isSimulated() {
  try { return !!localStorage.getItem(SIMDATE_KEY); } catch (e) { return false; }
}

function setSimDate(iso) {
  if (iso) localStorage.setItem(SIMDATE_KEY, iso);
  else localStorage.removeItem(SIMDATE_KEY);
}

// ปีงบ + เดือนของ "ตอนนี้" (ตามนาฬิกาที่ใช้อยู่) — ปี ค.ศ. → พ.ศ.
function fiscalNow() {
  const d = simNow();
  const month = d.getMonth() + 1;
  const buddhistYear = d.getFullYear() + 543;
  return { fy: MYD.fiscalYearOf(buddhistYear, month), month, buddhistYear, date: d };
}

// หมุดเวลาให้เลื่อนไปดู — ครอบทุกช่วงที่โฟลว์มีความหมายต่างกัน
// ⚠️ ป้ายต้องตรงกับ MYD.reviseRoundsFor() — แผนที่ทำปีงบ 2569 ใช้ปี 2571
// มีรอบทบทวน **ครั้งเดียว ปลายปีงบ 2570** (ปีถัดจากปีที่สร้างแผน ถึงปีก่อนแผนมีผล)
// เคยเขียนป้ายผิดเป็น "ทบทวนรอบ 1/รอบ 2" ตอนที่ตรรกะยังนับปีที่สร้างแผนด้วย
// เจ้าของงานทักเอง 17 ส.ค. 2569 — ตรรกะถูกอยู่แล้ว ผิดแค่ป้าย
const TIME_MARKS = [
  { id: 'real',    label: 'เวลาจริง',                            iso: null },
  { id: 'p2569',   label: 'ปลายปีงบ 2569 — ยังไม่ถึงรอบทบทวน',    iso: '2026-08-15T09:00:00' },
  { id: 'r2570',   label: 'ปลายปีงบ 2570 — รอบทบทวน (รอบเดียว)',  iso: '2027-08-15T09:00:00' },
  { id: 'a2571',   label: 'ต้นปีงบ 2571 — แผนมีผล ออกปฏิบัติงาน',  iso: '2027-10-05T09:00:00' },
  { id: 'm2571',   label: 'กลางปีงบ 2571',                        iso: '2028-03-05T09:00:00' },
];

// แถบเลือกเวลาบน topbar — ใส่ให้ทุกหน้าที่มี #timeSim
function renderTimeSim() {
  const host = $('timeSim');
  if (!host) return;
  const cur = (() => {
    try { return localStorage.getItem(SIMDATE_KEY) || ''; } catch (e) { return ''; }
  })();
  const f = fiscalNow();
  host.innerHTML = `
    <div class="in noic" style="width:auto">
      <select id="timeSimSel" title="จำลองวันที่ เพื่อดูรอบทบทวนแผนที่อยู่ในอนาคต">
        ${TIME_MARKS.map(m => `<option value="${m.iso || ''}" ${(m.iso || '') === cur ? 'selected' : ''}>${esc(m.label)}</option>`).join('')}
      </select>
    </div>
    <span class="badge ${isSimulated() ? 'b-low' : 'b-neutral'}">ปีงบ ${f.fy}${isSimulated() ? ' · จำลอง' : ''}</span>`;
  $('timeSimSel').addEventListener('change', e => {
    setSimDate(e.target.value);
    location.reload();
  });
}

// เวลาปัจจุบันแบบไทย — Date() อยู่ฝั่ง browser เท่านั้น
// (ห้ามเรียกใน mock-yearly.js เพื่อให้ logic ที่นั่น pure/testable)
function nowTh() {
  return simNow().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

const QUARTERS = [
  { q: 'Q1', months: 'ต.ค.–ธ.ค.' },
  { q: 'Q2', months: 'ม.ค.–มี.ค.' },
  { q: 'Q3', months: 'เม.ย.–มิ.ย.' },
  { q: 'Q4', months: 'ก.ค.–ก.ย.' },
];

const STATUS_BADGE_CLASS = {
  available:        'b-ok',       // เขียว — พร้อมใช้
  pending_approval: 'b-low',      // เหลือง — รอดำเนินการ
  repairing:        'b-info',     // ฟ้า — กำลังมีงานอยู่
  transferred:      'b-brand',    // แบรนด์ — ย้ายออกไปแล้ว ไม่ใช่ปัญหาของรถ
  decommissioned:   'b-out',      // แดง — ใช้งานไม่ได้แล้ว
  disposal:         'b-neutral',  // เทา — รอออกจากระบบ
};

// สีป้ายยอดคงเหลือคลัง — เกณฑ์ (พอ/เหลือน้อย/ขาด) ตัดสินที่ MYD.stockStatus() ที่เดียว
// หน้าจอแค่แปลง level เป็นสี · ใช้ทั้งหน้าสรุปแผน หน้าเอกสารพัสดุ และขั้นเบิกอะไหล่
const STOCK_BADGE = { ok: 'b-ok', tight: 'b-low', short: 'b-out', unknown: 'b-neutral' };

// คำตัดสินของ กบค. ต่อรถรายคันตอนยืนยันเข้าร่วมแผน — ใช้ทั้งขั้นยืนยันรถ (app.js)
// และขั้นทวนแผนเดินทาง (trip-plan.js) จึงอยู่ที่ common.js
const CF_VERDICT_LABELS = { keep: 'เข้าตามเดิม', drop: 'ตัดออกจากแผน', defer: 'เลื่อนรอบหน้า' };

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

// แผน 1 ใบครอบทั้งปีงบ รถแยกรายไตรมาส (แก้ 17 ส.ค. 2569) — ข้อความจึงบอก "ปีงบ + จัดครบกี่ไตรมาส"
// ไม่ใช่ไตรมาสเดียวแบบเดิม
function quarterYearText(plan) {
  const filled = (window.MYD ? MYD.QUARTER_KEYS : ['Q1', 'Q2', 'Q3', 'Q4'])
    .filter(q => plan.byQuarter && (plan.byQuarter[q] || []).length);
  if (!filled.length) return `ปีงบประมาณ ${esc(plan.year)} — ยังไม่ได้จัดรถเข้าไตรมาส`;
  if (filled.length === 4) return `ปีงบประมาณ ${esc(plan.year)} — ครบ 4 ไตรมาส`;
  return `ปีงบประมาณ ${esc(plan.year)} — จัดแล้ว ${esc(filled.map(q => MYD.quarterLabel(q)).join(' · '))}`;
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
// แผนหนึ่งใบมีเลขงาน 4 ใบแล้ว (ไตรมาสละใบ) — ใช้ "ชื่อแผน" เป็นหัวข้อแทนเลขงานเดี่ยว
// เลขงานทุกใบแสดงแยกด้วย MYD.workNumberList() ตรงที่ต้องเห็นครบ
function planTitle(plan) {
  return plan.planName || plan.workNumber || '(แผนใหม่ ยังไม่ตั้งชื่อ)';
}

// แปลง Date -> ISO ปี พ.ศ. ('2569-08-10') ให้ตรงรูปแบบ dueAt และ <input type="date">
// (Date อยู่ฝั่ง browser เท่านั้น — ห้ามย้ายไป mock-yearly.js)
// จุดเดียวของการคำนวณปี พ.ศ. + zero-pad — todayIso() และ dueAt (bindProcStepConfirm
// ใน app.js) เรียกตัวนี้ทั้งคู่ กันพลาดถ้าสูตรออฟเซ็ตปี/padding เปลี่ยนแล้วแก้ไม่ครบ
function toIsoBE(d) {
  return `${d.getFullYear() + 543}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ต้องใช้ simNow() ไม่ใช่ new Date() — ไม่งั้นเลื่อนเวลาไปดูรอบทบทวนแล้ว
// วันครบกำหนดตอบยืนยันรถจะยังคิดจากวันจริง กลายเป็น "เลยกำหนด" ทันที
function todayIso() {
  return toIsoBE(simNow());
}
