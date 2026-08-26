// ============================================================================
// trip-plan-page.js — ตัวคุมหน้าเดี่ยว "ทำแผนการเดินทาง" (trip-plan.html)
// ============================================================================
// สร้าง 25 ส.ค. 2569 พร้อมกับการยกโค้ดแผนเดินทางออกมาเป็นโมดูล trip-plan.js
//
// หน้านี้ทำหน้าที่เป็น "host" ให้โมดูล TRIP — เลือกแผน + ไตรมาส แล้วยื่น plan ให้โมดูล
// ตัวมันเองไม่รู้เรื่องแผนเดินทางเลยสักนิด ตรรกะทั้งหมดอยู่ใน trip-plan.js
// (host อีกตัวคือ app.js ซึ่งยื่น plan ตัวเดียวกันให้ในฐานะเฟส 2 ของ stepper 6 เฟส)
//
// ข้อมูลชุดเดียวกับหน้ารายการแผน (localStorage ผ่าน MYD) — กดสลับหน้าไปมาได้
// ============================================================================
'use strict';

let PLAN = null;
const state = { sub: 1 };

const STEPS = [
  { no: 1, label: 'ทำแผนเดินทาง' },
  { no: 2, label: 'ทวน + ยืนยัน' },
];

// ---------------------------------------------------------------- เลือกแผน
function travelSummary(plan) {
  if (plan.travelConfirmed === true) return { cls: 'b-ok', text: 'ยืนยันแผนเดินทางแล้ว' };
  const trips = MYD.ensureTrips(plan);
  if (!trips.length) return { cls: 'b-neutral', text: 'ยังไม่มีใบเดินทาง' };
  const master = MYD.loadMaster();
  const accepted = trips.filter(t => MYD.tripStatus(t, master) === 'accepted').length;
  return { cls: accepted === trips.length ? 'b-low' : 'b-neutral',
           text: `${trips.length} ใบ · ตอบรับแล้ว ${accepted}` };
}

// แถบสลับสายงาน — ใช้ .seg/.sg จาก components.css (ตัวเลือกสั้น 2 ตัว ตามตารางข้อ 4.2)
function sourceSeg(cur) {
  const opt = (k, label, sub) =>
    `<div class="sg ${cur === k ? 'sel' : ''}" data-src="${k}">${label}<div class="sg-sub">${sub}</div></div>`;
  return `<div class="seg">
    ${opt('plan', 'บำรุงรักษาตามวาระ', 'ทำแผนเดินทางจากแผนประจำปี')}
    ${opt('repair', 'งานซ่อม', 'ออกซ่อมหน้างานตามใบแจ้งซ่อม')}
  </div>`;
}

function bindSourceSeg() {
  document.querySelectorAll('[data-src]').forEach(el => el.addEventListener('click', () => {
    location.hash = el.dataset.src === 'repair' ? 'repair' : '';
    if (el.dataset.src !== 'repair') route();   // ไป hash ว่าง hashchange อาจไม่ยิงถ้าอยู่ที่ว่างอยู่แล้ว
  }));
}

function renderPicker() {
  PLAN = null;
  // ทำแผนเดินทางได้เฉพาะแผนที่ออกเลขงานแล้ว — แผนร่างยังไม่มีรถที่ยืนยันให้จัดเข้าใบ
  const plans = MYD.loadPlans().slice().reverse().filter(p => !!p.workNumber);

  const rows = plans.map(p => {
    const s = travelSummary(p);
    return `<tr>
      <td><b style="color:var(--gray-900)">${esc(planTitle(p))}</b>
        <div class="cell-sub">${MYD.workNumberList(p).map(x => esc(x.no)).join(' · ')}</div></td>
      <td class="num">${(p.selectedVehicleIds || []).length}</td>
      <td>${quarterYearText(p)}</td>
      <td><span class="badge ${s.cls}">${esc(s.text)}</span></td>
      <td class="num"><a class="btn btn-s btn-sm" href="#${esc(p.id)}">ทำแผนเดินทาง</a></td>
    </tr>`;
  }).join('');

  $('crumbs').innerHTML = `<span class="ms">event_available</span><span class="cur">ทำแผนการเดินทาง</span>`;
  $('phase').innerHTML = `
    <div class="page-title-row">
      <h1 class="page-title">ทำแผนการเดินทาง — กบค.</h1>
    </div>
    <div class="stack">
      ${sourceSeg('plan')}
    </div>
    <div class="card">
      <div class="sub">เลือกแผนที่จะทำแผนเดินทาง — เลือกไตรมาสได้ในขั้นถัดไป
        · ข้อมูลชุดเดียวกับ <a href="index.html">รายการแผนบำรุงรักษา</a> สลับไปมาได้</div>
      ${plans.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>เลขงาน / ชื่อแผน</th><th class="num">รถ (คัน)</th><th>ไตรมาส/ปี</th>
          <th>สถานะแผนเดินทาง</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">ยังไม่มีแผนที่ออกเลขงานแล้ว —
             ไปที่ <a href="plan-new.html">ออกเลขงาน</a> เพื่อสร้างแผนก่อน</div>`}
    </div>`;
  bindSourceSeg();
}

// ---------------------------------------------------------------- ตัว wizard
function primaryReady(plan) {
  // ขั้น 1 "ถัดไป" ปลดล็อกเมื่อทำแผนเดินทางครบทั้ง 4 ไตรมาสแล้วเท่านั้น (เจ้าของงานสั่ง 26 ส.ค. 2569)
  // ปุ่ม "ยืนยันแผนเดินทาง" ที่ขั้น 2 ใช้เกณฑ์เดียวกัน (travelPlanReady)
  if (state.sub === 1) return MYD.allQuartersTravelReady(plan, MYD.loadMaster());
  return MYD.travelPlanReady(plan, MYD.loadMaster());
}

function updatePrimary(plan) {
  const btn = $('btnPrimaryTrip');
  if (btn) btn.disabled = !primaryReady(plan);
}

function goSub(n) {
  if (n < 1 || n > STEPS.length) return;
  if (n > state.sub && !primaryReady(PLAN)) {
    toast('ทำขั้น "ทำแผนเดินทาง" ให้เสร็จก่อน ถึงจะไปขั้นถัดไปได้');
    return;
  }
  state.sub = n;
  renderWizard(PLAN);
  window.scrollTo({ top: 0 });
}

function renderWizard(plan) {
  const isLast = state.sub === STEPS.length;
  const disabled = !primaryReady(plan);
  const blockers = (state.sub === 1 && disabled) ? TRIP.blockers(plan) : [];

  $('crumbs').innerHTML = `<span class="ms">event_available</span>
    <a href="#">ทำแผนการเดินทาง</a><span class="ms">chevron_right</span>
    <span class="cur">${esc(planTitle(plan))}</span>`;

  $('phase').innerHTML = `
    <div class="page-title-row">
      <h1 class="page-title">${esc(planTitle(plan))}</h1>
      <a class="btn btn-g" href="#" style="margin-left:auto">
        <span class="ms">arrow_back</span> เปลี่ยนแผน</a>
    </div>
    ${plan.partsRequisitioned ? '' : `<div class="note note-info"><span class="ms">info</span>
      <div><b>หน้านี้ข้ามมาที่ขั้นแผนเดินทางโดยตรง</b> — ในโฟลว์เต็ม แผนนี้ยังไม่ผ่าน
        "ยืนยันรถเข้าร่วมแผน + เบิก/จัดหาอะไหล่" (เฟส 1) ทำที่นี่ได้เพื่อดูหน้าจอ
        แต่เวลาใช้จริงต้องจบเฟส 1 ก่อน — ดูโฟลว์เต็มที่ <a href="index.html#${esc(plan.id)}">หน้ารายการแผน</a></div></div>`}
    <div class="card">
      <div class="wsteps sm">${STEPS.map(s => {
        const cls = ['wstep'];
        if (s.no === state.sub) cls.push('active');
        if (s.no < state.sub) cls.push('passed');
        if (s.no > state.sub) cls.push('locked');
        return `<div class="${cls.join(' ')}" data-sub="${s.no}">
          <span class="num">${s.no < state.sub ? '✓' : s.no}</span>
          <span class="lbl">${esc(s.label)}</span>
        </div>`;
      }).join('')}</div>
      <div id="tripBody">${state.sub === 1 ? TRIP.renderStep1(plan) : TRIP.renderStep2(plan)}</div>
      ${blockers.length ? `<div class="note note-warn"><span class="ms">error</span>
        <div><b>ยังไปขั้นถัดไปไม่ได้</b> — ต้องทำแผนเดินทางให้ครบทั้ง 4 ไตรมาสก่อน ตอนนี้แต่ละไตรมาสยังค้าง:
          <ul style="margin:6px 0 0 18px">${blockers.map(x => `<li>${x}</li>`).join('')}</ul></div></div>` : ''}
      <div class="actions">
        <button class="btn btn-g" id="btnBackTrip" ${state.sub === 1 ? 'disabled' : ''}>ย้อนกลับ</button>
        <button class="btn btn-p" id="btnPrimaryTrip" ${disabled ? 'disabled' : ''}
          ${state.sub === 1 && disabled ? 'title="กรุณาทำแผนเดินทางครบทั้ง4ไตรมาส"' : ''}>
          ${isLast ? 'ยืนยันแผนเดินทาง' : 'ถัดไป'}</button>
      </div>
    </div>`;

  if (state.sub === 1) {
    // callback ที่โมดูลใช้คุยกลับมา — โมดูลไม่รู้ว่า host หน้าตาเป็นยังไง
    TRIP.bindStep1(plan, {
      onChange: () => renderWizard(plan),
      onValidity: () => updatePrimary(plan),
    });
  } else {
    TRIP.bindStep2(plan, { onChange: () => renderWizard(plan) });
  }

  $('phase').querySelectorAll('.wstep').forEach(el =>
    el.addEventListener('click', () => goSub(Number(el.dataset.sub))));
  $('btnBackTrip').addEventListener('click', () => goSub(state.sub - 1));
  $('btnPrimaryTrip').addEventListener('click', () => {
    if (!isLast) { goSub(state.sub + 1); return; }
    TRIP.confirm(plan);
    renderConfirmed(plan);
  });
}

// ---------------------------------------------------------------- ยืนยันแล้ว
function renderConfirmed(plan) {
  $('crumbs').innerHTML = `<span class="ms">event_available</span>
    <a href="#">ทำแผนการเดินทาง</a><span class="ms">chevron_right</span>
    <span class="cur">${esc(planTitle(plan))}</span>`;
  // ไม่ส่ง onNextPhase — หน้าเดี่ยวไม่มีเฟสถัดไป ปุ่มนั้นจะไม่ถูกวาด
  $('phase').innerHTML = `
    <div class="page-title-row">
      <h1 class="page-title">${esc(planTitle(plan))}</h1>
      <a class="btn btn-g" href="#" style="margin-left:auto">
        <span class="ms">arrow_back</span> เปลี่ยนแผน</a>
    </div>` + TRIP.renderConfirmed(plan);
  TRIP.bindConfirmed();
}

// ------------------------------------------------- สายงานซ่อม (SC-15)
// host ของโมดูล TRIP อีกตัว — โครงเดียวกับหน้าแผนบำรุงรักษา ตัดไตรมาสและปุ่มแยกอัตโนมัติออก
// ตามที่เจ้าของงานสั่ง 25 ส.ค. 2569 · ขอบเขตรอบนี้จบที่ "ส่งแผนนัด" ยังไม่มีตอบรับ/อนุมัติ/ยืนยัน
function renderRepair() {
  PLAN = null;
  $('crumbs').innerHTML = `<span class="ms">event_available</span>
    <a href="#">ทำแผนการเดินทาง</a><span class="ms">chevron_right</span>
    <span class="cur">งานซ่อม</span>`;

  $('phase').innerHTML = `
    <div class="page-title-row">
      <h1 class="page-title">แผนการเดินทาง — งานซ่อม</h1>
    </div>
    <div class="stack">
      ${sourceSeg('repair')}
    </div>
    <div class="card">
      <div class="note note-info"><span class="ms">info</span>
        <div><b>ขอบเขตของต้นแบบรอบนี้ = จังหวะสร้างแผนเท่านั้น</b> — จบที่ "ส่งแผนนัดให้หน่วยงาน"
          ส่วนหน่วยงานตอบรับ · ขั้นขออนุมัติแผน · ยืนยันแผน ยังไม่ได้ทำ</div></div>
      ${TRIP.renderRepairStep1()}
    </div>`;

  TRIP.bindRepairStep1({ onChange: renderRepair });
  bindSourceSeg();
}

// ---------------------------------------------------------------- router
function route() {
  const id = (location.hash || '').replace('#', '');
  if (!id) { renderPicker(); return; }
  if (id === 'repair') { renderRepair(); window.scrollTo({ top: 0 }); return; }
  const p = MYD.getPlan(id);
  if (!p || !p.workNumber) { location.hash = ''; renderPicker(); return; }
  PLAN = p;
  state.sub = 1;
  if (p.travelConfirmed === true) renderConfirmed(p);
  else renderWizard(p);
  window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', () => {
  renderTimeSim();
  route();
});
