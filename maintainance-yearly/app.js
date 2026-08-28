// app.js — รายการแผน + หน้าแผนรายใบ (stepper 6 เฟสปฏิบัติการ)
//
// ⚠️ โครงเปลี่ยน 8 ส.ค. 2569
//   - "ออกเลขงาน" แยกไป plan-new.html แล้ว ไม่อยู่ใน stepper นี้
//   - ระบบเก็บ "หลายแผน" (MYD.loadPlans()) แผนหนึ่ง = ประจำปีหนึ่งใบของ กบค.
//   - เลขงาน (MT-ปี-ไตรมาส-NNN) คือหัวข้อของแผน · stepper เป็นของ "แต่ละแผน"
//
// routing: index.html         -> รายการแผน
//          index.html#<planId> -> เปิดแผนนั้น + stepper 6 เฟส
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้

// ⚠️ แยกเฟส 21 ส.ค. 2569 — "เบิก/จัดหา + แผนเดินทาง" เดิมแตกเป็น 2 เฟส
//   (เบิก/จัดหา · แผนเดินทาง) เฟส 2-5 เดิมจึงเลื่อนเป็น 3-6
const PHASES = [
  { id: 'procurement', no: 1, label: 'เบิก/จัดหา' },
  { id: 'travel',      no: 2, label: 'แผนเดินทาง' },
  { id: 'inspection',  no: 3, label: 'ตรวจสภาพก่อนซ่อม' },
  { id: 'maintenance', no: 4, label: 'ดำเนินการบำรุงรักษา' },
  { id: 'report',      no: 5, label: 'จัดทำรายงาน' },
  { id: 'cost',        no: 6, label: 'คำนวณต้นทุน' },
];

// สถานะแผนเทียบกับปฏิทินปีงบ — แผนทำล่วงหน้า 2 ปี จึงมีช่วง "รอ" และ "รอบทบทวน"
// ก่อนถึงปีที่แผนมีผลจริง (ดู MYD.planStage)
const PLAN_STAGE_BADGE = {
  drafting:  { cls: 'b-out',     text: 'ฉบับร่าง' },
  scheduled: { cls: 'b-neutral', text: 'รอถึงรอบทบทวน' },
  revising:  { cls: 'b-low',     text: 'ถึงรอบทบทวน' },
  revised:   { cls: 'b-info',    text: 'สรุปแผนแล้ว' },
  active:    { cls: 'b-ok',      text: 'ปีนี้มีผล — ออกปฏิบัติงาน' },
  past:      { cls: 'b-neutral', text: 'ปีงบผ่านไปแล้ว' },
};

// travelQ = ไตรมาสที่กำลังทำแผนเดินทางอยู่ (memory เท่านั้น ไม่ผูกกับแผน เหมือน sub)
const state = { sub: 1, travelQ: 'Q1' };
let PLAN = null;   // แผนที่กำลังเปิดอยู่ (null = อยู่หน้ารายการ)

// ================= PHASE COMPLETION / GUARD (ต่อแผน) =================
// เฟส 1 จบด้วยการส่งคำขอเบิกอะไหล่ · เฟส 2 จบด้วยการยืนยันแผนเดินทางจริง
// เฟส 3-6 ยังไม่ได้ทำหน้าจริงทั้งหมด จึงใช้ธง plan.phaseDone[id] ที่ปุ่ม "ถัดไป"
// ของการ์ดเปล่าเป็นคนติ๊กให้ (ทางลัดของต้นแบบ)
function phaseCompleteOf(plan, id) {
  if (!plan) return false;
  if (id === 'procurement') {
    // ต้องยืนยันรถครบ (ขั้น 1) ด้วย ไม่ใช่แค่เบิกอะไหล่ (ขั้น 2) — กันเคสข้อมูลเก่า/ทางลัดที่
    // partsRequisitioned เป็น true ทั้งที่รถยังไม่มีข้อสรุปครบ (เจ้าของงานสั่ง 10 ส.ค. 2569)
    // travelConfirmed ไว้รองรับแผนเก่าที่ยืนยันแผนเดินทางไปแล้วตั้งแต่ตอนยังเป็นเฟสเดียว
    return plan.travelConfirmed === true ||
      (MYD.confirmResolved(plan, plan.selectedVehicleIds || []) && plan.partsRequisitioned === true);
  }
  if (id === 'travel') return plan.travelConfirmed === true;
  // คำนวณต้นทุน (26 ส.ค. 2569) — ส่งอนุมัติครบทุกไตรมาสที่มีรถแล้วถือว่าเสร็จ ไม่ต้องรอผู้บังคับบัญชาอนุมัติกลับ
  if (id === 'cost') return MYD.allQuartersCloseRequested(plan);
  return !!(plan.phaseDone || {})[id];
}

function isPhaseComplete(id) {
  return phaseCompleteOf(PLAN, id);
}

function canGoPhase(id) {
  const idx = PHASES.findIndex(p => p.id === id);
  if (idx <= 0) return true;
  return isPhaseComplete(PHASES[idx - 1].id);
}

// เฟสถัดไปตามลำดับใน PHASES — ใช้แทนการ hardcode id/ชื่อเฟส
// (สลับลำดับเฟสเมื่อไหร่ ปุ่มทุกจุดจะตามให้เอง)
function nextPhaseOf(id) {
  const i = PHASES.findIndex(p => p.id === id);
  return i >= 0 ? PHASES[i + 1] || null : null;
}

function nextPhaseLabel(id) {
  const nx = nextPhaseOf(id);
  return nx ? ` — ${nx.label}` : '';
}

function currentPhase() {
  return (PLAN && PLAN.phase) || PHASES[0].id;
}

// ================= รายการแผน =================
// ความคืบหน้าของแผน — ถ้าเฟสที่อยู่ทำเสร็จแล้ว ให้บอกว่าพร้อมไปเฟสถัดไป
// (ตอนนี้มี logic ความสำเร็จเฉพาะเฟส 1-2 — เฟส 3-6 ยังไม่มีของตัวเอง)
function planProgressText(plan) {
  const idx = Math.max(0, PHASES.findIndex(p => p.id === (plan.phase || PHASES[0].id)));
  const cur = PHASES[idx];
  const done = phaseCompleteOf(plan, cur.id);
  if (done && idx + 1 < PHASES.length) {
    return `<span class="badge b-ok">เฟส ${cur.no} ✓</span> พร้อมเฟส ${PHASES[idx + 1].no} · ${esc(PHASES[idx + 1].label)}`;
  }
  if (done) return `<span class="badge b-ok">จบแผนแล้ว</span> ครบทั้ง ${PHASES.length} เฟส`;
  return `เฟส ${cur.no}/${PHASES.length} · ${esc(cur.label)}`;
}

function renderList() {
  PLAN = null;
  const plans = MYD.loadPlans().slice().reverse();   // ใหม่สุดขึ้นก่อน
  const master = MYD.loadMaster();

  const rows = plans.map(p => {
    const n = (p.selectedVehicleIds || []).length;
    const issued = !!p.workNumber;
    const ack = !!p.suppliesAckAt;
    const f = fiscalNow();
    const stage = MYD.planStage(p, f.fy, f.month);
    const st = PLAN_STAGE_BADGE[stage];
    return `<tr>
      <td>
        <b style="color:var(--gray-900)">${esc(planTitle(p))}</b>
        ${issued ? '' : '<span class="badge b-low" style="margin-left:6px">ฉบับร่าง</span>'}
        <div class="cell-sub">${issued
            ? MYD.workNumberList(p).map(x => esc(x.no)).join(' · ') + (p.createdAt ? ' · ' : '')
            : ''}${p.createdAt ? 'สร้าง ' + esc(p.createdAt) : ''}</div>
      </td>
      <td class="num">${n}</td>
      <td>${issued ? quarterYearText(p) : '—'}</td>
      <td><span class="badge ${st.cls}">${st.text}</span>
        ${issued ? `<div class="cell-sub">${ack ? 'พัสดุรับทราบแล้ว' : 'รอพัสดุรับทราบ'}${(p.revisions || []).length ? ` · ทบทวนแล้ว ${p.revisions.length} รอบ` : ''}</div>` : ''}</td>
      <td>${issued ? planProgressText(p) : '—'}</td>
      <td class="num" style="white-space:nowrap">
        ${stage === 'revising'
          ? `<a class="btn btn-p btn-sm" href="plan-new.html#${esc(p.id)}"><span class="ms">event_repeat</span> ทบทวนแผน</a>`
          : issued
          ? `<a class="btn btn-s btn-sm" href="#${esc(p.id)}" ${stage === 'active' || stage === 'past' ? '' : 'title="แผนยังไม่ถึงปีที่มีผล — เปิดดูได้ แต่ยังไม่ควรออกปฏิบัติงาน"'}>เปิดแผน</a>`
          : `<a class="btn btn-s btn-sm" href="plan-new.html#${esc(p.id)}">ทำต่อ</a>
             <button class="btn btn-t btn-sm" data-del="${esc(p.id)}" title="ลบแผนร่างนี้"><span class="ms">delete</span></button>`}
      </td>
    </tr>`;
  }).join('');

  $('phase').innerHTML = `
    <div class="page-title-row">
      <h1 class="page-title">แผนบำรุงรักษาประจำปี — กบค.</h1>
      <a class="btn btn-p" href="plan-new.html" style="margin-left:auto">
        <span class="ms">note_add</span> สร้างแผน / ออกเลขงาน</a>
    </div>
    <div class="card">
      <div class="sub">เลือกแผนเพื่อทำเฟสถัดไป — เลขงานคือหัวข้อของแผนแต่ละใบ</div>
      ${plans.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>เลขงาน / ชื่อแผน</th><th class="num">รถ (คัน)</th><th>ไตรมาส/ปี</th><th>สถานะเอกสาร</th><th>ความคืบหน้า</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">ยังไม่มีแผน — กด "สร้างแผน / ออกเลขงาน" เพื่อเริ่ม</div>`}
      <div class="actions" style="margin-top:14px">
        <button class="btn btn-t btn-sm" id="btnReseed">
          <span class="ms">restart_alt</span> คืนแผนตัวอย่าง (เดโม)</button>
      </div>
    </div>`;
  $('stepper').innerHTML = '';
  $('crumbs').innerHTML = `<span class="ms">list_alt</span><span class="cur">รายการแผน</span>`;

  $('phase').querySelectorAll('[data-del]').forEach(el => {
    el.addEventListener('click', () => {
      if (!confirm('ลบแผนร่างนี้?')) return;
      MYD.deletePlan(el.getAttribute('data-del'));
      toast('ลบแผนร่างแล้ว');
      renderList();
    });
  });
  const btnSeed = $('btnReseed');
  if (btnSeed) btnSeed.addEventListener('click', () => {
    if (!confirm('คืนแผนตัวอย่าง? แผนทั้งหมดที่มีอยู่จะถูกแทนที่ด้วยแผนตัวอย่าง 1 ใบ')) return;
    MYD.reseedPlans();
    toast('คืนแผนตัวอย่างแล้ว');
    renderList();
  });
}

// ================= หน้าแผนรายใบ =================
function renderStepper() {
  const cur = currentPhase();
  $('stepper').innerHTML = `<div class="wsteps">${PHASES.map(p => {
    const active = p.id === cur;
    const passed = isPhaseComplete(p.id);
    const clickable = canGoPhase(p.id);
    const cls = ['wstep'];
    if (active) cls.push('active');
    if (passed) cls.push('passed');
    if (!clickable) cls.push('locked');
    return `<div class="${cls.join(' ')}" onclick="goPhase('${p.id}')">
      <span class="num">${passed ? '✓' : p.no}</span>
      <span class="lbl">${esc(p.label)}</span>
    </div>`;
  }).join('')}</div>`;
}

function goPhase(id, opts = {}) {
  if (!canGoPhase(id)) {
    toast('ต้องทำเฟสก่อนหน้าให้เสร็จก่อน ถึงจะเข้าเฟสนี้ได้');
    return;
  }
  PLAN.phase = id;
  MYD.savePlan(PLAN);
  state.sub = 1;
  // เข้าเฟสดำเนินการบำรุงรักษา ต่อจากตรวจสภาพคันเดียว → โฟกัสคันนั้น (26 ส.ค. 2569)
  // เข้าเฟสจัดทำรายงาน ต่อจากดำเนินการบำรุงรักษาคันเดียว → โฟกัสคันเดียวกันต่อ (28 ส.ค. 2569)
  // ทางอื่นที่เข้าเฟสเหล่านี้ (คลิก stepper ตรงๆ) ไม่ส่ง opts.vehicleId มา จึงเห็นรถทั้งหมดตามปกติ
  if (id === 'maintenance') MAINT.vehicleId = opts.vehicleId || null;
  if (id === 'report') REPORT.vehicleId = opts.vehicleId || null;
  renderStepper();
  renderPhaseBody();
  window.scrollTo({ top: 0 });
}

function renderPlaceholder(id) {
  const idx = PHASES.findIndex(p => p.id === id);
  const phase = PHASES[idx];
  const label = phase ? phase.label : id;
  const next = nextPhaseOf(id);
  const done = isPhaseComplete(id);
  return `<div class="card">
    <div class="sect">${esc(label)}</div>
    <div class="note note-info"><span class="ms">science</span>
      <div><b>หน้าจอของเฟสนี้ยังไม่ได้ทำ</b> — ปุ่มด้านล่างเป็น<b>ทางลัดของต้นแบบ</b>
        ไว้เดินดูขั้นตอนถัดไปเท่านั้น ยังไม่มีการบันทึกงานจริงของเฟสนี้</div></div>
    ${done ? `<div class="note note-ok"><span class="ms">check_circle</span>
      <div>ทำเครื่องหมายว่าเฟสนี้เสร็จแล้ว — กดปุ่มเพื่อไปเฟสถัดไปได้เลย</div></div>` : ''}
    <div class="actions">
      ${next
        ? `<button class="btn btn-p" id="btnPhaseNext">ถัดไป — ${esc(next.label)}</button>`
        : `<button class="btn btn-p" id="btnPhaseNext" ${done ? 'disabled' : ''}>${done ? 'จบแผนแล้ว' : 'จบแผน'}</button>`}
    </div>
  </div>`;
}

// ================= เฟส 4 · ดำเนินการบำรุงรักษา =================
// แสดง "รายละเอียดงาน" ที่เลือกไว้ตอนทำแผนเดินทาง (ขั้น 1 ของเฟส 2 · แผนเดินทาง) มาให้ช่างเห็นหน้างาน ติ๊กได้ทีละงาน
// ยังไม่มีการบันทึกผลงานจริง — หน้านี้เป็นตัวส่งต่อข้อมูลอย่างเดียว
// MAINT.vehicleId = โฟกัสรถคันเดียว — ตั้งจาก goPhase('maintenance', {vehicleId}) ตอนกด "เสร็จสิ้น" ใบตรวจสภาพ
// ของคันนั้น (26 ส.ค. 2569) ให้เห็นแค่งานของคันที่เพิ่งตรวจ ไม่ใช่ทุกคันปนกัน · ล้างเองถ้าออกจากเฟสนี้ (ดู goPhase)
// แนบรูปหลักฐานต่อรายการงานได้ที่นี่ (27 ส.ค. 2569 — เจ้าของงานสั่งย้ายมาจากเฟส 5 จัดทำรายงาน เพราะรูปหลักฐาน
// เป็นของ "ตอนลงมือทำงาน" ไม่ใช่ตอนปิดรายงาน) อยู่คอลัมน์ "รายละเอียดงาน" เดียวกับ checkbox ติ๊กงานเสร็จ
// (28 ส.ค. 2569 — เคยแยกเป็นบล็อกต่างหากใต้ตารางไปรอบหนึ่ง แต่เจ้าของงานสั่งย้ายกลับมาคอลัมน์เดิม) —
// UI เป็นแค่ปุ่ม "แนบรูป" + ชื่อไฟล์ที่แนบ ไม่มีกรอบพรีวิวรูป (เจ้าของงานสั่งตัดออก ใช้ `.btn` ธรรมดาพอ ไม่ต้อง
// มี component ใหม่แล้ว)
let MAINT = { vehicleId: null };

// jobPhotoTarget = {vehicleId, jobId} ที่กำลังรอผู้ใช้เลือกไฟล์จาก input[type=file] ตัวเดียวที่ใช้ร่วมกันทั้งหน้า
let jobPhotoTarget = null;

// ย่อรูปเป็น thumbnail ก่อนเก็บ (กัน localStorage ล้น) — โครงเดียวกับ daily-record/app.js:makeThumb
function makeJobPhotoThumb(file) {
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const mx = 200, sc = Math.min(1, mx / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * sc));
      c.height = Math.max(1, Math.round(img.height * sc));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      res(c.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = () => res(null);
    img.src = URL.createObjectURL(file);
  });
}

function renderMaintenance() {
  const master = MYD.loadMaster();
  const byId = new Map(master.vehicles.map(v => [v.id, v]));
  // แสดงเฉพาะคันที่ "ลงนามรับมอบตัวรถครบ 2 ฝั่งแล้ว" (เจ้าของงานสั่ง 27 ส.ค. 2569 — ผ่อนกลับจากเดิมที่
  // ต้องตอบครบทุกข้อตรวจ 23 ข้อก่อนด้วย (26 ส.ค. 2569) เพราะลงมือบำรุงรักษาได้ทันทีที่รับมอบตัวรถแล้ว
  // ไม่ต้องรอกรอกเอกสารตรวจสภาพให้ครบ · ต่อมาสั่งผ่อนเกณฑ์เดียวกันนี้ให้เฟส 5/6 ด้วย จึงเหลือเกณฑ์เดียว
  // (MYD.inspectionDone) ใช้ร่วมกันทุกเฟส)
  const joined = (PLAN.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(PLAN, id));
  const received = joined.filter(id => MYD.inspectionDone(PLAN, id));
  const waiting = joined.length - received.length;
  // คันที่กดลบออก (มีเหตุผลบันทึกไว้) — หายจากตารางทำงาน ไปขึ้นเป็นรายการเหตุผลด้านล่างแทน (25 ส.ค. 2569)
  const ids = received.filter(id => !MYD.maintExcluded(PLAN, id));
  const excluded = received.filter(id => MYD.maintExcluded(PLAN, id));

  // ถ้าคันที่โฟกัสไว้ไม่อยู่ใน ids แล้ว (ยังไม่ได้ลงนามรับมอบ/ถูกลบออก) ให้ตกกลับไปโชว์รายการทั้งหมดแทนเงียบๆ
  const focusId = MAINT.vehicleId && ids.includes(MAINT.vehicleId) ? MAINT.vehicleId : null;
  const focusV = focusId ? byId.get(focusId) : null;
  const viewIds = focusV ? [focusId] : ids;

  // นับว่ามีรถกี่คันที่ต้องทำแต่ละงาน — ช่วยเตรียมของก่อนออกหน้างาน (นับเฉพาะรถที่กำลังแสดงอยู่)
  const tally = MYD.TRIP_JOBS.map(j => ({
    label: j.label,
    n: viewIds.filter(id => {
      const t = MYD.tripOfVehicle(PLAN, id);
      return t && MYD.tripJobsOf(t, id)[j.id];
    }).length,
  }));

  let doneJobs = 0, totalJobs = 0;
  const rows = viewIds.map(id => {
    const v = byId.get(id);
    if (!v) return '';
    const t = MYD.tripOfVehicle(PLAN, id);
    const need = t ? MYD.maintJobsFor(t, id) : [];
    totalJobs += need.length + MYD.MAINT_EXTRA_JOBS.length;
    // ติ๊กได้จริง — ทำงานเสร็จข้อไหนกดติ๊กไว้ที่นี่ (แก้ "งานที่ต้องทำ" เองต้องไปหน้าแผนเดินทาง)
    // แนบรูปหลักฐานต่อรายการอยู่บรรทัดเดียวกับ checkbox (28 ส.ค. 2569) — แค่ปุ่ม "แนบรูป" + ชื่อไฟล์ ไม่มีกรอบ
    // พรีวิวรูป · ปุ่ม/ข้อความอยู่นอก <label> เพื่อไม่ให้คลิกแล้วไปสลับ checkbox โดยไม่ได้ตั้งใจ
    const jobCheckbox = j => {
      const on = MYD.maintJobDone(PLAN, id, j.id);
      if (on) doneJobs++;
      const photo = MYD.jobPhotoOf(PLAN, id, j.id);
      return `<div style="display:flex;align-items:center;gap:var(--space-2);flex-wrap:wrap">
        <label style="margin:0"><input type="checkbox" ${on ? 'checked' : ''}
          data-maint-v="${esc(id)}" data-maint-j="${esc(j.id)}">${esc(j.label)}</label>
        <button type="button" class="btn btn-s btn-sm" data-jobphoto-attach="${esc(id)}" data-jobphoto-job="${esc(j.id)}">
          <span class="ms">upload</span> ${photo ? 'เปลี่ยนรูป' : 'แนบรูป'}</button>
        <span class="cell-sub">${photo ? esc(photo.name) : 'ยังไม่ได้แนบรูป'}</span>
        ${photo ? `<button type="button" class="btn btn-t btn-sm" data-jobphoto-remove="${esc(id)}" data-jobphoto-remove-job="${esc(j.id)}">
          <span class="ms">delete</span></button>` : ''}
      </div>`;
    };
    // MAINT_EXTRA_JOBS ("เก็บตัวอย่างน้ำมัน") ไม่ต้องเลือกตอนทำแผนเดินทาง — ขึ้นให้ทุกคันเสมอ ไม่ขึ้นกับ need
    // ห่อด้วย .stack.tight (8px) ให้ระยะระหว่างสองบล็อกเท่ากับ gap ภายใน .chk เอง — ไม่พึ่ง margin แยกตัว (README ข้อ 4)
    const jobDetail = `<div class="stack tight">
      ${need.length
        ? `<div class="chk" style="margin:0">${need.map(jobCheckbox).join('')}</div>`
        : '<span class="badge b-low">ยังไม่เลือกงาน</span>'}
      <div class="chk" style="margin:0">${MYD.MAINT_EXTRA_JOBS.map(jobCheckbox).join('')}</div>
    </div>`;

    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="cell-sub">${esc(v.brand)}</div></td>
      <td>${esc(v.ownerDept)}<div class="cell-sub">${esc(MYD.quarterLabel(MYD.bucketOf(PLAN, id)) || '—')}</div></td>
      <td>${jobDetail}</td>
      <td>${t ? esc(MYD.tripPlaceOf(t, v)) : '—'}
          <div class="cell-sub">${t ? 'ใบ: ' + esc(t.name || 'แผนเดินทาง') : 'ยังไม่อยู่ในใบเดินทาง'}</div></td>
      <td class="num"><button class="btn btn-t btn-sm" data-maint-exclude="${esc(id)}"
        title="ลบรถออกจากแผนบำรุงรักษา"><span class="ms">delete</span></button></td>
    </tr>`;
  }).join('');

  // รายการรถที่ถูกลบออกแล้ว — โชว์ทะเบียน + เหตุผลไว้ตรวจสอบย้อนหลัง (ตัดออกจากตารางทำงานด้านบนแล้ว)
  const excludedList = excluded.map(id => {
    const v = byId.get(id);
    const ex = MYD.maintExcluded(PLAN, id);
    return `<div class="cell-sub">${esc(v ? v.plate : id)} — ${esc(ex.reason)}${ex.at ? ' · ' + esc(ex.at) : ''}</div>`;
  }).join('');

  $('phase').innerHTML = `
    <div class="card">
      <div class="sect">ดำเนินการบำรุงรักษา${focusV ? ` — ${esc(focusV.plate)}` : ''}</div>
      ${focusV
        ? `<div class="note note-info"><span class="ms">filter_alt</span>
            <div>กำลังแสดงเฉพาะ <b>${esc(focusV.plate)} ${esc(focusV.brand)}</b> — คันที่เพิ่งตรวจสภาพก่อนซ่อมเสร็จ
              <button type="button" class="btn btn-t btn-sm" id="btnMaintShowAll" style="margin-left:8px">ดูรถทั้งหมด (${ids.length} คัน)</button></div></div>`
        : `<div class="sub">แสดงเฉพาะรถที่<b>ลงนามรับมอบตัวรถครบ 2 ฝั่งแล้ว</b> (ยังไม่ต้องตอบครบทุกข้อตรวจก็ลงมือได้) — รายละเอียดงานมาจากที่เลือกไว้
            ตอนทำแผนเดินทาง (เฟส 2 · ขั้นที่ 1) แก้รายการงานได้ที่หน้านั้น — ที่นี่ติ๊กเมื่อทำเสร็จแล้ว</div>
          <div class="sub">พร้อมลงมือ <b>${ids.length}</b> จาก <b>${joined.length}</b> คัน${
            ids.length ? ' · ' + tally.map(x => `${esc(x.label)} <b>${x.n}</b> คัน`).join(' · ') : ''}${
            excluded.length ? ` · ลบออกแล้ว <b>${excluded.length}</b> คัน` : ''}</div>`}
      ${totalJobs ? `<div class="sub">ติ๊กเสร็จแล้ว <b id="maintDoneCount">${doneJobs}</b> จาก <b>${totalJobs}</b> งาน</div>` : ''}
      ${waiting && !focusV ? `<div class="note note-warn"><span class="ms">pending</span>
        <div>อีก <b>${waiting}</b> คันยัง<b>ไม่ได้ลงนามรับมอบตัวรถครบ 2 ฝั่ง</b> จึงยังไม่ขึ้นที่นี่ —
          กลับไปเฟส 3 เพื่อลงนามรับมอบให้ครบก่อน</div></div>` : ''}
      <div class="note note-info"><span class="ms">science</span>
        <div>หน้านี้ให้<b>ติ๊กงานที่ทำเสร็จ</b>และ<b>แนบรูปหลักฐานต่อรายการ</b>ได้แล้ว — ส่วนการบันทึกผลงานหน้างานแบบละเอียด
          อื่น (อะไหล่ที่ใช้จริง · เลขไมล์/ชม.เครื่อง) ยังไม่ได้ทำในต้นแบบ</div></div>
      ${excluded.length && !focusV ? `<div class="note note-warn"><span class="ms">delete</span>
        <div><b>ลบออกจากแผนบำรุงรักษาแล้ว ${excluded.length} คัน</b>
          <div class="stack tight" style="margin-top:6px">${excludedList}</div></div></div>` : ''}
      ${viewIds.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th><th>รายละเอียดงาน</th><th>สถานที่บำรุงรักษา</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">${
            excluded.length && excluded.length === received.length
              ? 'รถที่ลงนามรับมอบครบถูกลบออกจากแผนบำรุงรักษาหมดแล้ว — ดูเหตุผลด้านบน'
              : joined.length
              ? 'ยังไม่มีรถที่ลงนามรับมอบครบ — กลับไปเฟส 3 เพื่อลงนามรับมอบก่อน'
              : 'ยังไม่มีรถที่ยืนยันเข้าแผน'}</div>`}
      <div class="actions">
        <button class="btn btn-p" id="btnPhaseNext">ถัดไป${nextPhaseLabel('maintenance')}</button>
      </div>
      <input type="file" id="jobPhotoFile" accept="image/*" capture="environment" class="hidden">
    </div>`;

  // ติ๊ก/ยกเลิกติ๊กงาน — บันทึกทันทีแบบไม่ re-render ทั้งหน้า (กันจอกระโดดเหมือนใบตรวจสภาพ)
  // แค่ขยับตัวนับ "ติ๊กเสร็จแล้ว X จาก Y งาน" ที่หัวหน้าให้ตรงของจริง
  const doneCountEl = $('maintDoneCount');
  document.querySelectorAll('[data-maint-v]').forEach(el => el.addEventListener('change', e => {
    MYD.setMaintJobDone(PLAN, el.dataset.maintV, el.dataset.maintJ, e.target.checked);
    MYD.savePlan(PLAN);
    if (doneCountEl) doneCountEl.textContent = document.querySelectorAll('[data-maint-v]:checked').length;
  }));

  // แนบ/เปลี่ยนรูปต่อรายการงาน — ปุ่มเดียวกันใช้เปิด input[type=file] ที่ซ่อนไว้ตัวเดียวทั้งหน้า แล้วจำไว้ว่า
  // กำลังแนบให้คัน/งานไหนอยู่ผ่าน jobPhotoTarget (module-level) ระหว่างรอผู้ใช้เลือกไฟล์
  document.querySelectorAll('[data-jobphoto-attach]').forEach(btn => btn.addEventListener('click', () => {
    jobPhotoTarget = { vehicleId: btn.dataset.jobphotoAttach, jobId: btn.dataset.jobphotoJob };
    $('jobPhotoFile').click();
  }));
  document.querySelectorAll('[data-jobphoto-remove]').forEach(btn => btn.addEventListener('click', () => {
    MYD.setJobPhoto(PLAN, btn.dataset.jobphotoRemove, btn.dataset.jobphotoRemoveJob, null);
    MYD.savePlan(PLAN);
    renderMaintenance();
  }));
  $('jobPhotoFile').addEventListener('change', async e => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file || !jobPhotoTarget) return;
    const { vehicleId, jobId } = jobPhotoTarget;
    jobPhotoTarget = null;
    const dataUrl = await makeJobPhotoThumb(file);
    if (!dataUrl) { toast('อ่านไฟล์รูปไม่สำเร็จ ลองใหม่อีกครั้ง'); return; }
    MYD.setJobPhoto(PLAN, vehicleId, jobId, { name: file.name, dataUrl });
    MYD.savePlan(PLAN);
    renderMaintenance();
  });

  $('btnMaintShowAll')?.addEventListener('click', () => { MAINT.vehicleId = null; renderMaintenance(); });

  document.querySelectorAll('[data-maint-exclude]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.getAttribute('data-maint-exclude');
    const v = byId.get(id);
    openMaintExcludeModal(id, v ? MYD.plateFull(v) : id);
  }));

  // ส่ง vehicleId ของคันที่โฟกัสอยู่ (ถ้ามี) ต่อไปให้เฟส 5 จัดทำรายงาน จะได้โฟกัสคันเดิมต่อ ไม่ใช่เห็นรถทุกคันปนกัน (28 ส.ค. 2569)
  $('btnPhaseNext')?.addEventListener('click', () => finishPhase('maintenance', { vehicleId: focusId }));
}

// Modal ลบรถออกจากแผนบำรุงรักษา — ต้องกรอกเหตุผลก่อนยืนยัน (แพตเทิร์นเดียวกับ showVehicleDetail ใน plan-new.js:
// วาง HTML ลงตัวครอบ #maintModal ที่ว่างเปล่า แล้วเคลียร์ innerHTML ทิ้งตอนปิด)
function openMaintExcludeModal(vehicleId, plateLabel) {
  const host = $('maintModal');
  host.innerHTML = `
    <div class="modal-overlay" id="maintExcludeOverlay">
      <div class="modal">
        <div class="modal-head">
          <h2>ลบรถออกจากแผนบำรุงรักษา</h2>
          <button type="button" class="modal-close" id="maintExcludeClose"><span class="ms">close</span></button>
        </div>
        <div class="sub">${esc(plateLabel)}</div>
        <div class="f"><label>เหตุผลที่ลบออก <small>(จำเป็น)</small></label>
          <textarea id="maintExcludeReason" rows="3" placeholder="เช่น รถเสียหายจนซ่อมไม่ได้ อยู่ระหว่างจำหน่าย…"></textarea></div>
        <div class="modal-foot">
          <button type="button" class="btn btn-g" id="maintExcludeCancel">ยกเลิก</button>
          <button type="button" class="btn btn-d" id="maintExcludeConfirm"><span class="ms">delete</span> ลบออกจากแผน</button>
        </div>
      </div>
    </div>`;
  const close = () => { host.innerHTML = ''; };
  $('maintExcludeClose').addEventListener('click', close);
  $('maintExcludeCancel').addEventListener('click', close);
  $('maintExcludeOverlay').addEventListener('click', e => { if (e.target.id === 'maintExcludeOverlay') close(); });
  $('maintExcludeConfirm').addEventListener('click', () => {
    const ta = $('maintExcludeReason');
    const reason = ta.value.trim();
    if (!reason) { ta.focus(); toast('กรอกเหตุผลที่ลบออกก่อน'); return; }
    MYD.excludeFromMaint(PLAN, vehicleId, reason, nowTh());
    MYD.savePlan(PLAN);
    close();
    toast('ลบรถออกจากแผนบำรุงรักษาแล้ว');
    renderMaintenance();
  });
}

// Modal เตือนก่อนไปเฟส 6 (คำนวณต้นทุน) ตอนตรวจสภาพก่อนซ่อมยังไม่ครบทุกคัน — เจ้าของงานสั่ง 26 ส.ค. 2569
// ไม่บล็อกเด็ดขาด (ปุ่ม "ไปต่อ" ยังกดผ่านได้) แค่เตือน + เสนอทางลัดกลับไปตรวจให้ครบก่อน
// opts.question/opts.proceedLabel ปรับข้อความ/ปุ่มยืนยันได้ตามจุดที่เรียก (27 ส.ค. 2569 — เพิ่มจุดเรียกที่ 2
// คือปุ่ม "ส่งอนุมัติปิดแผนไตรมาส" ในเฟส 6 ซึ่งข้อความต้องพูดถึงการส่งอนุมัติ ไม่ใช่การไปขั้นคำนวณต้นทุน)
function openInspectIncompleteModal(count, q, onProceed, opts = {}) {
  const host = $('maintModal');
  const question = opts.question || 'จะไปขั้นคำนวณต้นทุนต่อเลยไหม?';
  const proceedLabel = opts.proceedLabel || 'ไปต่อ — คำนวณต้นทุน';
  host.innerHTML = `
    <div class="modal-overlay" id="inspectWarnOverlay">
      <div class="modal">
        <div class="modal-head">
          <h2>ตรวจสภาพก่อนซ่อมยังไม่ครบ</h2>
          <button type="button" class="modal-close" id="inspectWarnClose"><span class="ms">close</span></button>
        </div>
        <div class="sub">ยังมีรถ <b>${count}</b> คันของ<b>${esc(MYD.quarterLabel(q))}</b>ที่ตรวจสภาพก่อนซ่อมยังไม่ครบ
          (ยังไม่ได้ลงนามรับมอบครบ 2 ฝั่ง) — ${esc(question)}</div>
        <div class="modal-foot">
          <button type="button" class="btn btn-g" id="inspectWarnBack"><span class="ms">arrow_back</span> กลับไปตรวจสภาพก่อน</button>
          <button type="button" class="btn btn-p" id="inspectWarnProceed">${esc(proceedLabel)}</button>
        </div>
      </div>
    </div>`;
  const close = () => { host.innerHTML = ''; };
  $('inspectWarnClose').addEventListener('click', close);
  $('inspectWarnOverlay').addEventListener('click', e => { if (e.target.id === 'inspectWarnOverlay') close(); });
  $('inspectWarnBack').addEventListener('click', () => {
    close();
    INSP.vehicleId = null;
    INSP.q = q;   // พาไปแท็บไตรมาสเดียวกับที่เตือน ไม่ต้องไปหาเอง
    goPhase('inspection');
  });
  $('inspectWarnProceed').addEventListener('click', () => { close(); onProceed(); });
}

// ================= เฟส 5 · จัดทำรายงาน =================
// เช็คว่าใช้อะไหล่ที่เบิกไปครบหรือไม่ต่อคัน — ตรงกับ node D{ใช้อะไหล่ครบ?} ในผัง 05-เฟส4-จัดทำรายงาน.md (25 ส.ค. 2569)
// รวมช่องกรอกต้นทุน (เบี้ยเลี้ยง/ที่พัก/เดินทาง) เข้ามาด้วย (26 ส.ค. 2569 — เจ้าของงานสั่งย้ายมาจากเฟส 6
// คำนวณต้นทุน) เพราะเป็นข้อมูลที่กรอกตอนปิดงานเช่นเดียวกับเช็คอะไหล่ · เฟส 6 เหลือแค่แสดงผลรวมอ่านอย่างเดียว
// ยังไม่มีส่วนอื่นของหน้ารายงาน (ตรวจสภาพการทำงาน · ผลตรวจน้ำมัน · อนุมัติปิดงาน) — รอออกแบบเพิ่ม
// แยกแสดง/กรอกรายไตรมาส (27 ส.ค. 2569 — เจ้าของงานสั่งให้เห็นแค่รถของไตรมาสที่กำลังบำรุงอยู่ เหมือนขั้น
// ตรวจสภาพก่อนซ่อมกับคำนวณต้นทุน) ใช้ COST.q ตัวเดียวกับเฟส 6 เพราะเป็น "ไตรมาสที่กำลังปิดงานอยู่" ตัวเดียวกัน
// REPORT.vehicleId = โฟกัสรถคันเดียว — ตั้งจาก goPhase('report', {vehicleId}) ตอนกด "ถัดไป — จัดทำรายงาน"
// ขณะเฟส 4 กำลังโฟกัสคันเดียวอยู่ (28 ส.ค. 2569 — แพตเทิร์นเดียวกับ MAINT.vehicleId) ให้เห็นแค่คันที่เพิ่งทำ
// เฟส 4 เสร็จ ไม่ใช่ทุกคันที่ตรวจครบแล้วปนกัน · ล้างเองถ้าออกจากเฟสนี้ (ดู goPhase)
let REPORT = { vehicleId: null };

function renderReport() {
  const master = MYD.loadMaster();
  const byId = new Map(master.vehicles.map(v => [v.id, v]));
  // แสดงเฉพาะคันที่ "ตรวจสภาพก่อนซ่อมครบแล้ว" (เจ้าของงานสั่ง 26 ส.ค. 2569 — เกณฑ์เดียวกับเฟส 4 ดำเนินการ
  // บำรุงรักษา ดู MYD.inspectionDone)
  const joined = (PLAN.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(PLAN, id));
  const received = joined.filter(id => MYD.inspectionDone(PLAN, id));
  const all = received.filter(id => !MYD.maintExcluded(PLAN, id));

  // ถ้าคันที่โฟกัสไว้ไม่อยู่ใน all แล้ว (ยังไม่ผ่านเกณฑ์/ถูกลบออก) ให้ตกกลับไปโชว์รายการทั้งหมดแทนเงียบๆ
  // (แพตเทิร์นเดียวกับ MAINT ใน renderMaintenance) — ล็อกแท็บไตรมาสไปที่ไตรมาสของคันที่โฟกัสด้วย จะได้ไม่ต้องเลือกเอง
  const focusId = REPORT.vehicleId && all.includes(REPORT.vehicleId) ? REPORT.vehicleId : null;
  const focusV = focusId ? byId.get(focusId) : null;
  if (focusV) COST.q = MYD.bucketOf(PLAN, focusId) || COST.q;
  if (!QUARTERS.some(q => q.q === COST.q)) COST.q = 'Q1';

  // แท็บไตรมาส — ป้าย sg-sub บอกช่วงเดือนของไตรมาสนั้น (ซ่อนตอนโฟกัสคันเดียว ไม่ต้องเลือกไตรมาสเอง)
  const qSeg = QUARTERS.map(q => {
    const qIds = all.filter(id => MYD.bucketOf(PLAN, id) === q.q);
    return `<div class="sg reportQSeg ${COST.q === q.q ? 'sel' : ''}" data-q="${q.q}">
      ${esc(MYD.quarterLabel(q.q))} · ${qIds.length} คัน
      <div class="sg-sub">${esc(q.months)}</div>
    </div>`;
  }).join('');

  const qIds = all.filter(id => MYD.bucketOf(PLAN, id) === COST.q);
  const ids = focusV ? [focusId] : qIds;

  const rows = ids.map(id => {
    const v = byId.get(id);
    if (!v) return '';
    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="cell-sub">${esc(v.brand)}</div></td>
      <td>${esc(v.ownerDept)}</td>
    </tr>`;
  }).join('');

  // หัวข้อแยกจากตารางรายการรถด้านบน — แต่ละคันเป็นบล็อกของตัวเอง ไม่ใช่คอลัมน์ในตาราง (25 ส.ค. 2569)
  const partsBlocks = ids.map(id => {
    const v = byId.get(id);
    if (!v) return '';
    // รายการอะไหล่ยกจาก partsIssuedFor (ลอจิกเดียวกับที่ฝ่ายพัสดุเห็น) ไม่ใช่คำนวณแยกชุดใหม่
    const usage = MYD.partsUsageOf(PLAN, id);
    const partsIssued = MYD.partsIssuedFor(PLAN, master, v);
    // ตาราง ชื่ออะไหล่ / รายการเบิก / รายการคืน — ช่องกรอกคืน (แคบ) + หน่วยกำกับ ชิดกันเป็นกลุ่มเดียวในคอลัมน์ขวาสุด (25 ส.ค. 2569)
    const partsRows = partsIssued.map(l => `
      <tr>
        <td>${esc(l.item.name)}</td>
        <td class="num">${esc(l.perVehicle)} ${esc(l.item.unit)}</td>
        <td class="num">
          <div style="display:flex;align-items:center;justify-content:flex-end;gap:var(--space-1_5)">
            <div class="in noic" style="width:72px"><input type="number" min="0" max="${esc(l.perVehicle)}" value="${esc(usage.returns[l.item.id] ?? 0)}"
              data-parts-return-v="${esc(id)}" data-parts-return-item="${esc(l.item.id)}"></div>
            <span class="cell-sub">${esc(l.item.unit)}</span>
          </div>
        </td>
      </tr>`).join('');
    // ห่อหัวป้ายทะเบียน + radio + รายการอะไหล่ด้วย .stack.tight ชั้นเดียวกัน ให้ทุกช่องว่างในบล็อกนี้เท่ากันหมด (8px)
    // .chk มี margin:10px 0 ของตัวเอง ต้องล้างทิ้งไม่งั้นจะไปบวกกับ gap ของ stack (เคยพลาดมาแล้ว)
    return `<div data-parts-block="${esc(id)}">
      <div class="stack tight">
        <div><b>${esc(v.plate)}</b> <span class="cell-sub">${esc(v.brand)} · ${esc(v.ownerDept)}</span></div>
        <div class="chk" style="margin:0">
          <label><input type="radio" name="partsComplete-${esc(id)}" value="complete" ${usage.complete === true ? 'checked' : ''}
            data-parts-complete="${esc(id)}"> ครบ</label>
          <label><input type="radio" name="partsComplete-${esc(id)}" value="incomplete" ${usage.complete === false ? 'checked' : ''}
            data-parts-complete="${esc(id)}"> ไม่ครบ</label>
        </div>
        <div style="${usage.complete === false ? '' : 'display:none'}" data-parts-return-list>
          ${partsIssued.length ? `<div class="tblwrap"><table class="tbl">
            <thead><tr><th>ชื่ออะไหล่</th><th class="num">รายการเบิก</th><th class="num">รายการคืน</th></tr></thead>
            <tbody>${partsRows}</tbody></table></div>`
            : '<div class="cell-sub">ไม่มีรายการอะไหล่ที่เบิกสำหรับรถคันนี้</div>'}
        </div>
      </div>
    </div>`;
  }).join('');

  // ต้นทุนค่าใช้จ่ายกรอกได้ต่อรถแต่ละคัน — แยกจาก trip.perDiem/lodging/travel ที่กรอกไว้ตอนทำแผนเดินทาง (เฟส 2 · ครอบทั้งใบ)
  // ค่าที่กรอกที่นี่คือยอดจัดสรรจริงต่อคันสำหรับปิดงบ ไม่ใช่ยอดใบเดินทางซ้ำ — รวมแต่ละแถวเองจึงไม่นับซ้ำ (25 ส.ค. 2569)
  // ขอบเขต = ids เดียวกับตารางอะไหล่ด้านบน (26 ส.ค. 2569)
  let sumPerDiem = 0, sumLodging = 0, sumTravel = 0;
  const numInput = (id, field, value) => `<div class="in noic" style="width:88px">
    <input type="number" min="0" value="${esc(value)}" data-cost-v="${esc(id)}" data-cost-field="${field}"></div>`;
  const costRows = ids.map(id => {
    const v = byId.get(id);
    if (!v) return '';
    const c = MYD.vehicleCostOf(PLAN, id);
    const perDiem = Number(c.perDiem) || 0;
    const lodging = Number(c.lodging) || 0;
    const travel = Number(c.travel) || 0;
    sumPerDiem += perDiem; sumLodging += lodging; sumTravel += travel;
    const rowSum = perDiem + lodging + travel;
    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="cell-sub">${esc(v.brand)}</div></td>
      <td>${esc(v.ownerDept)}</td>
      <td class="num">${numInput(id, 'perDiem', perDiem)}</td>
      <td class="num">${numInput(id, 'lodging', lodging)}</td>
      <td class="num">${numInput(id, 'travel', travel)}</td>
      <td class="num" data-cost-rowsum="${esc(id)}"><b>${rowSum.toLocaleString('th-TH')}</b></td>
    </tr>`;
  }).join('');
  const grandTotal = sumPerDiem + sumLodging + sumTravel;
  const totalCellStyle = 'background:var(--gray-50);border-top:2px solid var(--gray-200);color:var(--gray-700);font-size:var(--fs-sm)';

  $('phase').innerHTML = `
    <div class="card">
      <div class="sect">จัดทำรายงาน${focusV ? ` — ${esc(focusV.plate)}` : ''}</div>
      ${focusV
        ? `<div class="note note-info"><span class="ms">filter_alt</span>
            <div>กำลังแสดงเฉพาะ <b>${esc(focusV.plate)} ${esc(focusV.brand)}</b> — คันที่เพิ่งทำเฟส 4 ดำเนินการบำรุงรักษาเสร็จ
              <button type="button" class="btn btn-t btn-sm" id="btnReportShowAll" style="margin-left:8px">ดูรถทั้งหมด (${qIds.length} คัน)</button></div></div>`
        : `<div class="sub">รถที่ผ่านเฟส 4 ดำเนินการบำรุงรักษามาแล้ว — ทำทีละไตรมาสตามรอบที่กำลังปิดงานอยู่</div>`}
      <div class="note note-info"><span class="ms">science</span>
        <div>หน้านี้มีแค่ส่วนตรวจอะไหล่กับคำนวณต้นทุน — ส่วนตรวจสภาพการทำงาน/ผลตรวจน้ำมัน/อนุมัติปิดงาน ยังไม่ได้ทำในต้นแบบ</div></div>
      ${all.length ? `
      ${!focusV ? `<div class="f" style="margin-bottom:14px">
        <label>เลือกไตรมาสที่จะทำรายงาน</label>
        <div class="seg">${qSeg}</div>
      </div>` : ''}
      ${ids.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th></tr></thead>
        <tbody>${rows}</tbody></table></div>

        <div class="sect" style="margin-top:22px">ใช้อะไหล่ครบหรือไม่</div>
        <div class="sub">เลือก "ไม่ครบ" แล้วกรอกจำนวนที่คืนต่อรายการ ต่อคัน</div>
        <div class="stack">${partsBlocks}</div>

        <div class="sect" style="margin-top:22px">คำนวณต้นทุน</div>
        <div class="sub">กรอกค่าเบี้ยเลี้ยง/ที่พัก/เดินทางที่จัดสรรจริงต่อคันได้ — แยกจากยอดใบเดินทางที่กรอกไว้ตอนเฟส 2</div>
        <div class="tblwrap"><table class="tbl">
          <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th>
            <th class="num">ค่าเบี้ยเลี้ยง (บาท)</th><th class="num">ค่าที่พัก (บาท)</th>
            <th class="num">ค่าเดินทาง (บาท)</th><th class="num">รวม (บาท)</th></tr></thead>
          <tbody>${costRows}</tbody>
          <tfoot><tr>
            <td colspan="2" style="${totalCellStyle}"><b>ต้นทุน${esc(MYD.quarterLabel(COST.q))}</b></td>
            <td class="num" style="${totalCellStyle}" id="costSumPerDiem">${sumPerDiem.toLocaleString('th-TH')}</td>
            <td class="num" style="${totalCellStyle}" id="costSumLodging">${sumLodging.toLocaleString('th-TH')}</td>
            <td class="num" style="${totalCellStyle}" id="costSumTravel">${sumTravel.toLocaleString('th-TH')}</td>
            <td class="num" style="${totalCellStyle}"><b id="costGrandTotal">${grandTotal.toLocaleString('th-TH')}</b></td>
          </tr></tfoot></table></div>
        <div class="note note-warn"><span class="ms">help</span>
          <div>เงื่อนไขการตัดงบประมาณเป็นยังไง เลือกการตัดงบประมาณอะไรได้บ้าง</div></div>`
        : `<div class="empty">ไม่มีรถของ${esc(MYD.quarterLabel(COST.q))}</div>`}`
        : '<div class="empty">ยังไม่มีรถที่เข้าเกณฑ์ — กลับไปเฟส 4 ดำเนินการบำรุงรักษาก่อน</div>'}
      <div class="actions" style="justify-content:space-between">
        <button class="btn btn-g" id="btnBackToInspect"><span class="ms">arrow_back</span> กลับไปเลือกรถตรวจสภาพก่อนซ่อม</button>
        <button class="btn btn-p" id="btnPhaseNext">ถัดไป${nextPhaseLabel('report')}</button>
      </div>
    </div>`;

  // ทางลัดกลับไปเฟส 3 (ตรวจสภาพก่อนซ่อม) หน้ารายการรถ — เผื่อกลับไปแก้/ดูใบตรวจของคันไหนเพิ่ม
  // เคลียร์ INSP.vehicleId ก่อนเสมอ ไม่งั้นถ้าค้างจากรอบก่อนจะเด้งเข้าใบตรวจคันเดิมแทนหน้ารายการรถ
  $('btnBackToInspect')?.addEventListener('click', () => {
    INSP.vehicleId = null;
    goPhase('inspection');
  });

  document.querySelectorAll('.reportQSeg').forEach(sg => sg.addEventListener('click', () => {
    COST.q = sg.dataset.q;
    renderReport();
  }));

  $('btnReportShowAll')?.addEventListener('click', () => { REPORT.vehicleId = null; renderReport(); });

  document.querySelectorAll('[data-parts-complete]').forEach(el => el.addEventListener('change', e => {
    const vid = el.dataset.partsComplete;
    const complete = e.target.value === 'complete';
    MYD.setPartsComplete(PLAN, vid, complete);
    MYD.savePlan(PLAN);
    const list = el.closest('[data-parts-block]')?.querySelector('[data-parts-return-list]');
    if (list) list.style.display = complete ? 'none' : '';
  }));

  document.querySelectorAll('[data-parts-return-item]').forEach(el => el.addEventListener('input', e => {
    MYD.setPartReturnQty(PLAN, el.dataset.partsReturnV, el.dataset.partsReturnItem, Number(e.target.value) || 0);
    MYD.savePlan(PLAN);
  }));

  // แก้ค่าต้นทุนต่อคัน — บันทึกทันที + ขยับผลรวมแถวนั้นกับยอดรวมท้ายตาราง โดยไม่ re-render ทั้งหน้า
  document.querySelectorAll('[data-cost-v]').forEach(el => el.addEventListener('input', e => {
    const vid = el.dataset.costV;
    MYD.setVehicleCost(PLAN, vid, el.dataset.costField, Number(e.target.value) || 0);
    MYD.savePlan(PLAN);

    const c = MYD.vehicleCostOf(PLAN, vid);
    const rowSum = (Number(c.perDiem) || 0) + (Number(c.lodging) || 0) + (Number(c.travel) || 0);
    const rowCell = document.querySelector(`[data-cost-rowsum="${vid}"]`);
    if (rowCell) rowCell.innerHTML = `<b>${rowSum.toLocaleString('th-TH')}</b>`;

    let tPerDiem = 0, tLodging = 0, tTravel = 0;
    ids.forEach(id => {
      const cc = MYD.vehicleCostOf(PLAN, id);
      tPerDiem += Number(cc.perDiem) || 0; tLodging += Number(cc.lodging) || 0; tTravel += Number(cc.travel) || 0;
    });
    $('costSumPerDiem').textContent = tPerDiem.toLocaleString('th-TH');
    $('costSumLodging').textContent = tLodging.toLocaleString('th-TH');
    $('costSumTravel').textContent = tTravel.toLocaleString('th-TH');
    $('costGrandTotal').textContent = (tPerDiem + tLodging + tTravel).toLocaleString('th-TH');
  }));

  // "ถัดไป — คำนวณต้นทุน" เตือนก่อนถ้าไตรมาสที่กำลังจะไปดู (COST.q — แท็บเดียวกับที่เลือกอยู่ในหน้านี้
  // และแท็บของเฟส 6) ยังตรวจสภาพก่อนซ่อมไม่ครบ (26 ส.ค. 2569 · ปรับ 26 ส.ค. 2569 อีกรอบ: เดิมเช็คทั้งแผน
  // 4 ไตรมาส ตอนนี้เช็คแค่ไตรมาสเดียวพอ เพราะคำนวณต้นทุนก็ดูทีละไตรมาสอยู่แล้ว) — เกณฑ์ความครบใช้
  // MYD.inspectionDone เหมือนหน้าตรวจสภาพเฟส 3
  $('btnPhaseNext')?.addEventListener('click', () => {
    if (!QUARTERS.some(q => q.q === COST.q)) COST.q = 'Q1';
    const qIds = (PLAN.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(PLAN, id) && MYD.bucketOf(PLAN, id) === COST.q);
    const notInspected = qIds.filter(id => !MYD.inspectionDone(PLAN, id)).length;
    if (notInspected) { openInspectIncompleteModal(notInspected, COST.q, () => finishPhase('report')); return; }
    finishPhase('report');
  });
}

// ================= เฟส 6 · คำนวณต้นทุน =================
// อ่านอย่างเดียว (26 ส.ค. 2569 — เจ้าของงานสั่งย้ายช่องกรอกไปเฟส 5 จัดทำรายงานแล้ว) แสดงผลรวมต้นทุน
// ต่อคันที่กรอกไว้จากเฟส 5 เท่านั้น ไม่มีช่องให้กรอกที่หน้านี้อีกต่อไป
// แยกแสดงรายไตรมาส (26 ส.ค. 2569 — เจ้าของงานสั่งให้โชว์แค่รถของไตรมาสที่กำลังดูอยู่ เหมือนขั้นตรวจสภาพก่อนซ่อม
// เพราะบำรุงรักษาทำทีละไตรมาสตามรอบจริง ไม่ใช่ดูทั้งปีปนกัน)
let COST = { q: 'Q1' };

function renderCost() {
  const master = MYD.loadMaster();
  const byId = new Map(master.vehicles.map(v => [v.id, v]));
  const ids = (PLAN.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(PLAN, id));
  if (!QUARTERS.some(q => q.q === COST.q)) COST.q = 'Q1';

  // รวมต้นทุนของแต่ละคัน — ใช้ทั้งบรรทัดสรุปทั้งปีด้านบน และป้ายท้ายแท็บของแต่ละไตรมาส
  const costTotalOf = id => {
    const c = MYD.vehicleCostOf(PLAN, id);
    return (Number(c.perDiem) || 0) + (Number(c.lodging) || 0) + (Number(c.travel) || 0);
  };
  const grandAll = ids.reduce((sum, id) => sum + costTotalOf(id), 0);

  // แท็บไตรมาส — ป้าย sg-sub บอกช่วงเดือน + ต้นทุนรวมของไตรมาสนั้น
  const qSeg = QUARTERS.map(q => {
    const qIds = ids.filter(id => MYD.bucketOf(PLAN, id) === q.q);
    const qSum = qIds.reduce((sum, id) => sum + costTotalOf(id), 0);
    return `<div class="sg costQSeg ${COST.q === q.q ? 'sel' : ''}" data-q="${q.q}">
      ${esc(MYD.quarterLabel(q.q))} · ${qIds.length} คัน
      <div class="sg-sub">${esc(q.months)}${qIds.length ? ` · ${qSum.toLocaleString('th-TH')} บาท` : ''}</div>
    </div>`;
  }).join('');

  const qIds = ids.filter(id => MYD.bucketOf(PLAN, id) === COST.q);
  let sumPerDiem = 0, sumLodging = 0, sumTravel = 0;
  const rows = qIds.map(id => {
    const v = byId.get(id);
    if (!v) return '';
    const c = MYD.vehicleCostOf(PLAN, id);
    const perDiem = Number(c.perDiem) || 0;
    const lodging = Number(c.lodging) || 0;
    const travel = Number(c.travel) || 0;
    sumPerDiem += perDiem; sumLodging += lodging; sumTravel += travel;
    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="cell-sub">${esc(v.brand)}</div></td>
      <td>${esc(v.ownerDept)}</td>
      <td class="num">${perDiem.toLocaleString('th-TH')}</td>
      <td class="num">${lodging.toLocaleString('th-TH')}</td>
      <td class="num">${travel.toLocaleString('th-TH')}</td>
      <td class="num"><b>${(perDiem + lodging + travel).toLocaleString('th-TH')}</b></td>
    </tr>`;
  }).join('');
  const grandTotal = sumPerDiem + sumLodging + sumTravel;
  const totalCellStyle = 'background:var(--gray-50);border-top:2px solid var(--gray-200);color:var(--gray-700);font-size:var(--fs-sm)';

  // ส่งอนุมัติปิดแผนแยกรายไตรมาส (26 ส.ค. 2569) — กดส่งของไตรมาสที่กำลังดูอยู่ ไม่กระทบไตรมาสอื่น
  const approval = MYD.closeApprovalOf(PLAN, COST.q);

  $('phase').innerHTML = `
    <div class="card">
      <div class="sect">คำนวณต้นทุน</div>
      <div class="sub">รถในแผนนี้ทั้งหมด <b>${ids.length}</b> คัน — ต้นทุนรวมทั้งปี <b>${grandAll.toLocaleString('th-TH')}</b> บาท</div>
      <div class="note note-info"><span class="ms">science</span>
        <div>หน้านี้แสดงผลรวมต้นทุนที่กรอกไว้จากเฟส 5 จัดทำรายงานเท่านั้น — แก้ตัวเลขได้ที่เฟสนั้น
          ค่าจ้างเหมา (สายว่าจ้าง) และต้นทุนอะไหล่/น้ำมัน ยังไม่ได้ทำในต้นแบบ · ส่งอนุมัติปิดแผนแยกได้ทีละไตรมาส</div></div>
      ${ids.length ? `
      <div class="f" style="margin-bottom:14px">
        <label>เลือกไตรมาสที่จะดู</label>
        <div class="seg">${qSeg}</div>
      </div>
      ${qIds.length ? `<div class="stack">
        <div class="tblwrap"><table class="tbl">
          <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th>
            <th class="num">ค่าเบี้ยเลี้ยง (บาท)</th><th class="num">ค่าที่พัก (บาท)</th>
            <th class="num">ค่าเดินทาง (บาท)</th><th class="num">รวม (บาท)</th></tr></thead>
          <tbody>${rows}</tbody>
          <tfoot><tr>
            <td colspan="2" style="${totalCellStyle}"><b>ต้นทุน${esc(MYD.quarterLabel(COST.q))}</b></td>
            <td class="num" style="${totalCellStyle}">${sumPerDiem.toLocaleString('th-TH')}</td>
            <td class="num" style="${totalCellStyle}">${sumLodging.toLocaleString('th-TH')}</td>
            <td class="num" style="${totalCellStyle}">${sumTravel.toLocaleString('th-TH')}</td>
            <td class="num" style="${totalCellStyle}"><b>${grandTotal.toLocaleString('th-TH')}</b></td>
          </tr></tfoot></table></div>
        <div class="note note-warn"><span class="ms">help</span>
          <div>เงื่อนไขการตัดงบประมาณเป็นยังไง เลือกการตัดงบประมาณอะไรได้บ้าง</div></div>
        ${approval
          ? `<div class="note ${approval.status === 'approved' ? 'note-ok' : 'note-info'}">
              <span class="ms">${approval.status === 'approved' ? 'check_circle' : 'schedule'}</span>
              <div>${approval.status === 'approved'
                ? `ผู้บังคับบัญชา กบค. อนุมัติปิดแผน${esc(MYD.quarterLabel(COST.q))}แล้ว เมื่อ ${esc(approval.approvedAt)}`
                : `ส่งอนุมัติปิดแผน${esc(MYD.quarterLabel(COST.q))}แล้ว เมื่อ ${esc(approval.requestedAt)} — รอผู้บังคับบัญชา กบค. อนุมัติ`}</div>
            </div>`
          : `<div class="actions">
              <button class="btn btn-p" id="btnSendCloseQ"><span class="ms">send</span> ส่งอนุมัติปิดแผน${esc(MYD.quarterLabel(COST.q))}</button>
            </div>`}
      </div>`
        : `<div class="empty">ไม่มีรถของ${esc(MYD.quarterLabel(COST.q))}</div>`}`
        : '<div class="empty">ยังไม่มีรถในแผนนี้</div>'}
    </div>`;

  document.querySelectorAll('.costQSeg').forEach(sg => sg.addEventListener('click', () => {
    COST.q = sg.dataset.q;
    renderCost();
  }));

  // ส่งอนุมัติปิดแผนไตรมาส — เตือนก่อนถ้ารถของไตรมาสนี้ตรวจสภาพก่อนซ่อมยังไม่ครบ (27 ส.ค. 2569 — เกณฑ์/modal
  // เดียวกับปุ่ม "ถัดไป" ของเฟส 5 จัดทำรายงาน ดู openInspectIncompleteModal · กันส่งอนุมัติปิดงบไปทั้งที่ยังมี
  // รถค้างตรวจสภาพอยู่ ไม่ใช่ block เด็ดขาด เพราะยังมีเคสที่ต้องส่งไปก่อนแล้วตามแก้ทีหลัง)
  const sendCloseQ = () => {
    MYD.requestCloseApprovalQuarter(PLAN, COST.q, nowTh());
    MYD.savePlan(PLAN);
    toast(`ส่งอนุมัติปิดแผน${MYD.quarterLabel(COST.q)}แล้ว`);
    renderStepper();
    renderCost();
  };
  $('btnSendCloseQ')?.addEventListener('click', () => {
    const notInspected = qIds.filter(id => !MYD.inspectionDone(PLAN, id)).length;
    if (notInspected) {
      openInspectIncompleteModal(notInspected, COST.q, sendCloseQ, {
        question: 'จะส่งอนุมัติปิดแผนไตรมาสนี้ต่อเลยไหม?',
        proceedLabel: 'ส่งอนุมัติปิดแผนต่อ',
      });
      return;
    }
    sendCloseQ();
  });
}

// ================= เฟส 3 · ตรวจสภาพก่อนซ่อม =================
// รายการรถในแผน → กดปุ่มท้ายแถวเพื่อเปิดใบตรวจของคันนั้น (โครงตามแบบฟอร์มกระดาษของ กบค.)
// แยกรายการตามไตรมาส + เลือกได้ว่าจะตรวจไตรมาสไหนก่อน (เจ้าของงานสั่ง 26 ส.ค. 2569 — ให้ตรงกับ
// รูปแบบเดียวกับขั้นแผนเดินทาง เพราะงานตรวจสภาพก็ทยอยทำทีละไตรมาสตามรอบนัดจริงเหมือนกัน)
let INSP = { vehicleId: null, q: 'Q1' };

function renderInspection() {
  if (INSP.vehicleId) { renderInspectForm(INSP.vehicleId); return; }
  renderInspectList();
}

function renderInspectList() {
  const master = MYD.loadMaster();
  const ids = (PLAN.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(PLAN, id));
  const byId = new Map(master.vehicles.map(v => [v.id, v]));
  const done = ids.filter(id => MYD.inspectionDone(PLAN, id)).length;
  if (!QUARTERS.some(q => q.q === INSP.q)) INSP.q = 'Q1';

  // แท็บไตรมาส — ป้าย sg-sub บอกช่วงเดือน + ความคืบหน้าของไตรมาสนั้น
  const qSeg = QUARTERS.map(q => {
    const qIds = ids.filter(id => MYD.bucketOf(PLAN, id) === q.q);
    const qDone = qIds.filter(id => MYD.inspectionDone(PLAN, id)).length;
    return `<div class="sg inspQSeg ${INSP.q === q.q ? 'sel' : ''}" data-q="${q.q}">
      ${esc(MYD.quarterLabel(q.q))} · ${qIds.length} คัน
      <div class="sg-sub">${esc(q.months)}${qIds.length ? ` · ตรวจแล้ว ${qDone}/${qIds.length}` : ''}</div>
    </div>`;
  }).join('');

  const qIds = ids.filter(id => MYD.bucketOf(PLAN, id) === INSP.q);
  const rows = qIds.map(id => {
    const v = byId.get(id);
    if (!v) return '';
    const ok = MYD.inspectionDone(PLAN, id);
    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="cell-sub">${esc(v.brand)}</div></td>
      <td>${esc(v.ownerDept)}</td>
      <td><span class="badge ${ok ? 'b-ok' : 'b-low'}">${ok ? 'ตรวจแล้ว' : 'ยังไม่ตรวจ'}</span></td>
      <td class="num"><button class="btn btn-s btn-sm" data-insp-open="${esc(id)}">
        <span class="ms">fact_check</span> ตรวจสภาพก่อนบำรุงรักษา</button></td>
    </tr>`;
  }).join('');

  $('phase').innerHTML = `
    <div class="card">
      <div class="sect">ตรวจสภาพก่อนซ่อม</div>
      <div class="sub">ตรวจสภาพรถร่วมกับผู้ส่งมอบในวันนัด ก่อนเริ่มงานบำรุงรักษา — กดปุ่มท้ายแถวเพื่อเปิดใบตรวจของรถคันนั้น</div>
      <div class="sub">ทั้งปี — ตรวจแล้ว <b>${done}</b> จาก <b>${ids.length}</b> คัน</div>
      ${ids.length ? `
      <div class="f" style="margin-bottom:14px">
        <label>เลือกไตรมาสที่จะตรวจก่อน</label>
        <div class="seg">${qSeg}</div>
      </div>
      ${qIds.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">ไม่มีรถของ${esc(MYD.quarterLabel(INSP.q))}</div>`}`
        : '<div class="empty">ยังไม่มีรถที่ยืนยันเข้าแผน</div>'}
    </div>`;

  document.querySelectorAll('[data-insp-open]').forEach(b => b.addEventListener('click', () => {
    INSP.vehicleId = b.dataset.inspOpen;
    renderInspection();
  }));
  document.querySelectorAll('.inspQSeg').forEach(sg => sg.addEventListener('click', () => {
    INSP.q = sg.dataset.q;
    renderInspectList();
  }));
}

function renderInspectForm(vehicleId) {
  const master = MYD.loadMaster();
  const v = master.vehicles.find(x => x.id === vehicleId);
  if (!v) { INSP.vehicleId = null; renderInspection(); return; }
  const f = MYD.ensureInspection(PLAN, vehicleId);
  const trip = MYD.tripOfVehicle(PLAN, vehicleId);
  const kbkStaff = trip ? MYD.tripStaffList(trip) : [];

  const opt = (list, sel) => list.map(n =>
    `<option value="${esc(n)}" ${n === sel ? 'selected' : ''}>${esc(n)}</option>`).join('');

  const itemRows = f.items.map((it, i) => `
    <tr>
      <td>${i + 1}. ${esc(it.name)}</td>
      <td class="num"><input type="radio" name="insp-${i}" ${it.result === 'yes' ? 'checked' : ''}
        data-insp-r="${i}" value="yes"></td>
      <td class="num"><input type="radio" name="insp-${i}" ${it.result === 'no' ? 'checked' : ''}
        data-insp-r="${i}" value="no"></td>
      <td><div class="in noic"><input type="text" value="${esc(it.note || '')}"
        placeholder="ระบุหมายเหตุ" data-insp-note="${i}"></div></td>
    </tr>`).join('');

  $('phase').innerHTML = `
    <div class="card">
      <button class="btn btn-t" id="btnInspBack" style="margin-bottom:8px">
        <span class="ms">arrow_back</span> กลับไปรายการรถ</button>

      <div class="sect">ตรวจสภาพก่อนซ่อม — ${esc(v.plate)}</div>
      <div class="sub"><b>${esc(v.plate)} ${esc(v.plateProvince || '')}</b> · ${esc(v.brand)} · ${esc(v.ownerDept)}</div>
      <div class="sub">เลขครุภัณฑ์ ${esc(v.assetCode || '—')} · Serial No. ${esc(v.serialNo || '—')} · HC No. ${esc(v.hcNo || '—')}</div>

      <div class="sect" style="margin-top:22px">ลงนามการรับมอบรถ</div>
      <div class="fgrid">
        <div class="f sp2"><label>ผู้ส่งมอบรถ</label>
          <div class="in"><span class="ms">person</span>
            <select data-insp-field="deliverBy">
              <option value="">— เลือกผู้ส่งมอบรถ —</option>
              ${opt(MYD.deliverersOf(v), f.deliverBy)}
            </select></div>
          <div class="actions" style="justify-content:flex-start;margin-top:8px">
            ${f.signedDeliverAt
              ? `<span class="badge b-ok"><span class="ms" style="font-size:var(--fs-body)">check_circle</span> เซ็นแล้ว ${esc(f.signedDeliverAt)}</span>`
              : `<button class="btn btn-s btn-sm" id="btnSignDeliver" ${f.deliverBy ? '' : 'disabled'}>เซ็นลงนาม</button>`}
          </div></div>

        <div class="f sp2"><label>ผู้รับมอบ (กบค.)</label>
          <div class="in"><span class="ms">badge</span>
            <select data-insp-field="receiveBy">
              <option value="">${kbkStaff.length ? '— เลือกผู้รับมอบ —' : '— ยังไม่ได้ระบุพนักงาน กบค. ในแผนเดินทาง —'}</option>
              ${opt(kbkStaff, f.receiveBy)}
            </select></div>
          <div class="actions" style="justify-content:flex-start;margin-top:8px">
            ${f.signedReceiveAt
              ? `<span class="badge b-ok"><span class="ms" style="font-size:var(--fs-body)">check_circle</span> เซ็นแล้ว ${esc(f.signedReceiveAt)}</span>`
              : `<button class="btn btn-s btn-sm" id="btnSignReceive" ${f.receiveBy ? '' : 'disabled'}>เซ็นลงนาม</button>`}
          </div></div>
      </div>

      <div class="sect" style="margin-top:22px">รายละเอียดการตรวจสภาพก่อนซ่อม</div>
      <div class="tblwrap"><table class="tbl">
        <thead>
          <tr><th rowspan="2">รายการ</th><th colspan="2">ผลการตรวจ</th><th rowspan="2">หมายเหตุ</th></tr>
          <tr><th class="num">มี</th><th class="num">ไม่มี</th></tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table></div>
      <div class="actions" style="justify-content:space-between;margin-top:10px">
        <button class="btn btn-t btn-sm" id="btnInspAdd"><span class="ms">add</span> เพิ่มรายการ</button>
        <button class="btn btn-p" id="btnInspDone"><span class="ms">check</span> เสร็จสิ้น${nextPhaseLabel('inspection').replace(' — ', ' — ไป')}</button>
      </div>
    </div>`;

  bindInspectForm(vehicleId, f);
}

function bindInspectForm(vehicleId, f) {
  const save = () => MYD.savePlan(PLAN);
  const redraw = () => { save(); renderStepper(); renderInspectForm(vehicleId); };

  $('btnInspBack').addEventListener('click', () => { INSP.vehicleId = null; renderInspection(); });

  document.querySelectorAll('[data-insp-field]').forEach(el => el.addEventListener('change', e => {
    f[el.dataset.inspField] = e.target.value;
    redraw();   // ปุ่มเซ็นลงนามปลดล็อกตามชื่อที่เลือก
  }));

  $('btnSignDeliver')?.addEventListener('click', () => { f.signedDeliverAt = nowTh(); toast('ลงนามผู้ส่งมอบแล้ว'); redraw(); });
  $('btnSignReceive')?.addEventListener('click', () => { f.signedReceiveAt = nowTh(); toast('ลงนามผู้รับมอบแล้ว'); redraw(); });

  // ผลตรวจรายข้อ — บันทึกทันที ไม่ re-render (กันจอกระโดดตอนติ๊กรายการล่างๆ)
  document.querySelectorAll('[data-insp-r]').forEach(el => el.addEventListener('change', e => {
    f.items[Number(el.dataset.inspR)].result = e.target.value;
    save();
  }));
  document.querySelectorAll('[data-insp-note]').forEach(el => el.addEventListener('input', e => {
    f.items[Number(el.dataset.inspNote)].note = e.target.value;
    save();
  }));

  // เสร็จสิ้น = บันทึกใบนี้ + ปิดเฟสตรวจสภาพ แล้วข้ามไปเฟสถัดไปเลย (ปุ่มเดียวจบตามที่เจ้าของงานสั่ง)
  // ไม่บล็อกถ้ายังตรวจไม่ครบทุกคัน — แค่บอกให้รู้ว่าเหลือกี่คัน · กลับมาแก้ทีหลังได้จาก stepper
  $('btnInspDone').addEventListener('click', () => {
    save();
    const ids = (PLAN.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(PLAN, id));
    const left = ids.filter(id => !MYD.inspectionDone(PLAN, id)).length;
    const nx = nextPhaseOf('inspection');
    PLAN.phaseDone = PLAN.phaseDone || {};
    PLAN.phaseDone.inspection = true;
    MYD.savePlan(PLAN);
    INSP.vehicleId = null;
    // ส่ง vehicleId ต่อไปด้วย — ถ้าเฟสถัดไปคือดำเนินการบำรุงรักษา จะโฟกัสแค่คันที่เพิ่งตรวจสภาพเสร็จ (26 ส.ค. 2569)
    if (nx) goPhase(nx.id, { vehicleId }); else { renderStepper(); renderInspection(); }
    toast(left
      ? `บันทึกแล้ว — ยังตรวจไม่ครบอีก ${left} คัน${nx ? ' · ข้ามไป' + nx.label : ''}`
      : `ตรวจครบทุกคันแล้ว${nx ? ' — ไป' + nx.label : ''}`);
  });

  $('btnInspAdd').addEventListener('click', () => {
    f.items.push({ name: '', result: null, note: '' });
    redraw();
  });
}

// ติ๊กว่าเฟสนี้เสร็จ แล้วพาไปเฟสถัดไป (เฟสสุดท้ายแค่ติ๊กจบ ไม่มีที่ให้ไปต่อ)
// opts ส่งต่อให้ goPhase ตรงๆ — ใช้ส่ง {vehicleId} ตอนกด "ถัดไป" ขณะโฟกัสรถคันเดียวอยู่ (28 ส.ค. 2569)
// เพื่อให้เฟสถัดไปโฟกัสคันเดิมต่อ (ดู MAINT.vehicleId/REPORT.vehicleId)
function finishPhase(id, opts = {}) {
  const idx = PHASES.findIndex(p => p.id === id);
  const next = PHASES[idx + 1];
  PLAN.phaseDone = PLAN.phaseDone || {};
  PLAN.phaseDone[id] = true;
  MYD.savePlan(PLAN);
  if (next) { goPhase(next.id, opts); toast(`ผ่านเฟส ${PHASES[idx].no} แล้ว — ต่อที่ ${next.label}`); return; }
  // เฟสสุดท้าย (คำนวณต้นทุน) จบด้วยการส่งอนุมัติปิดแผนรายไตรมาสในหน้าของมันเอง (renderCost) ไม่ใช่ปุ่มนี้
  // เหลือ fallback ไว้เผื่อเฟสอื่นเป็นเฟสสุดท้ายในอนาคต (ยังไม่มีตอนนี้)
  toast(`ทำเฟส ${PHASES[idx].no} เสร็จแล้ว — ครบทั้ง ${PHASES.length} เฟส`);
  renderStepper();
  renderPhaseBody();
}

function renderPhaseBody() {
  if (currentPhase() === 'procurement') { renderProcurement(); return; }
  if (currentPhase() === 'travel') { renderTravelPhase(); return; }
  if (currentPhase() === 'inspection') { renderInspection(); return; }
  if (currentPhase() === 'maintenance') { renderMaintenance(); return; }
  if (currentPhase() === 'report') { renderReport(); return; }
  if (currentPhase() === 'cost') { renderCost(); return; }
  const id = currentPhase();
  $('phase').innerHTML = renderPlaceholder(id);
  $('btnPhaseNext')?.addEventListener('click', () => finishPhase(id));
}

function renderPlanHeader() {
  const n = (PLAN.selectedVehicleIds || []).length;
  $('crumbs').innerHTML = `
    <a href="index.html" style="color:inherit;text-decoration:none"><span class="ms">list_alt</span> รายการแผน</a>
    <span class="sep">›</span><span class="cur">${esc(planTitle(PLAN))}</span>`;
  $('planHead').innerHTML = `
    <div class="page-title-row">
      <h1 class="page-title">${esc(planTitle(PLAN))}</h1>
      ${PLAN.suppliesAckAt
        ? '<span class="badge b-ok" style="margin-left:10px">พัสดุรับทราบแล้ว</span>'
        : '<span class="badge b-low" style="margin-left:10px">รอพัสดุรับทราบ</span>'}
      <a class="btn btn-t" href="index.html" style="margin-left:auto"><span class="ms">arrow_back</span> รายการแผน</a>
    </div>
    <div class="sub" style="margin-top:-12px;margin-bottom:16px">
      ${esc(PLAN.planName || '—')} · ${quarterYearText(PLAN)} · รถ ${n} คัน</div>`;
}

function renderPlan() {
  renderPlanHeader();
  renderStepper();
  renderPhaseBody();
}

// ================= ROUTER =================
function route() {
  const id = (location.hash || '').replace('#', '');
  $('planHead').innerHTML = '';
  if (!id) { renderList(); return; }
  const p = MYD.getPlan(id);
  if (!p || !p.workNumber) { location.hash = ''; renderList(); return; }
  PLAN = p;
  state.sub = 1;
  renderPlan();
  window.scrollTo({ top: 0 });
}

// ================================================================
// ============ เฟส 1 (เบิก/จัดหา) + เฟส 2 (แผนเดินทาง) wizard ============
// ================================================================
// เดิมเป็น wizard เดียว 4 ขั้นของเฟส "เบิก/จัดหา + แผนเดินทาง" · แยก 21 ส.ค. 2569
// เป็น 2 เฟสบน stepper บน (เบิก/จัดหา · แผนเดินทาง) แต่ยัง reuse โครง wizard เดิม
// อยู่ — แค่แบ่ง PROC_STEPS ออกเป็น 2 ชุดตามเฟส (2 ขั้นต่อเฟส) โดยใช้ "master step"
// (1-4 อิงลำดับเดิม) เป็นตัวคุม logic ร่วม ส่วน state.sub คือขั้นย่อย "ภายในเฟสนั้น" (1-2)
// goPhase() รีเซ็ต state.sub เป็น 1 ทุกครั้งที่เปลี่ยนเฟส
// เข้าเฟส "แผนเดินทาง" ครั้งใด ถ้า travelConfirmed แล้ว ข้าม wizard ไปแสดงสรุปยืนยันเลย

const PROC_STEPS = [        // เฟส 1 · เบิก/จัดหา
  { no: 1, label: 'ยืนยันรถเข้าร่วมแผน' },
  { no: 2, label: 'เบิก/จัดหาอะไหล่' },
];
const TRAVEL_STEPS = [      // เฟส 2 · แผนเดินทาง
  { no: 1, label: 'แผนเดินทาง' },
  { no: 2, label: 'ทวน + ยืนยัน' },
];

// ขั้นย่อยของเฟสปัจจุบัน (2 ขั้นเสมอ ไม่ว่าจะเฟส "เบิก/จัดหา" หรือ "แผนเดินทาง")
function currentProcSteps() {
  return currentPhase() === 'travel' ? TRAVEL_STEPS : PROC_STEPS;
}

// master step 1-4 อิงลำดับเดิม — ใช้คุม logic ที่ใช้ร่วมกันระหว่าง 2 เฟส (validate/render/bind)
function masterStep(sub) {
  return currentPhase() === 'travel' ? sub + 2 : sub;
}

function renderProcurement() {
  if (!state.sub) state.sub = 1;
  renderProcWizard(PLAN);
}

function renderTravelPhase() {
  const plan = PLAN;
  if (plan.travelConfirmed === true) {
    const opts = { onNextPhase: () => { const nx = nextPhaseOf('travel'); if (nx) goPhase(nx.id); } };
    $('phase').innerHTML = TRIP.renderConfirmed(plan, opts);
    TRIP.bindConfirmed(opts);
    return;
  }
  if (!state.sub) state.sub = 1;
  renderProcWizard(plan);
}

// ----- sub-nav -----
// ถอยหลังไปขั้นก่อนหน้าได้เสมอ (ดู/แก้ของที่ทำไปแล้ว) แต่เดินหน้าข้ามขั้นบน stepper ได้
// เฉพาะเมื่อทุกขั้นก่อนหน้าปลายทางผ่าน validateProcSub แล้ว — กันคลิกหัวข้อ stepper
// ข้ามเข้าขั้นที่ยังไม่ถึง (เจ้าของงานสั่ง 10 ส.ค. 2569: ต้องยืนยันรถให้ครบก่อนเบิกอะไหล่จริง
// ปุ่ม "ถัดไป" อย่างเดียวกันได้ไม่พอ เพราะ node บน stepper คลิกข้ามได้ตรงๆ)
function goProcSub(n) {
  const steps = currentProcSteps();
  if (n < 1 || n > steps.length) return;
  if (n > state.sub) {
    const plan = PLAN;
    for (let i = 1; i < n; i++) {
      if (!validateProcSub(plan, i)) {
        toast(`ทำขั้น "${steps[i - 1].label}" ให้เสร็จก่อน ถึงจะไปขั้นถัดไปได้`);
        return;
      }
    }
  }
  state.sub = n;
  renderPhaseBody();
  window.scrollTo({ top: 0 });
}

function nextProcSub() {
  const plan = PLAN;
  if (!validateProcSub(plan, state.sub)) return;
  if (state.sub >= currentProcSteps().length) return;
  goProcSub(state.sub + 1);
}

function backProcSub() {
  if (state.sub <= 1) return;
  goProcSub(state.sub - 1);
}

function validateProcSub(plan, sub) {
  const m = masterStep(sub);
  if (m === 1) return MYD.confirmResolved(plan, plan.selectedVehicleIds || []);
  if (m === 2) return !!plan.partsRequisitioned;
  // ขั้น "ถัดไป" ของแผนเดินทางไปต่อได้เมื่อทำแผนเดินทางครบทั้ง 4 ไตรมาสแล้ว (เจ้าของงานสั่ง 26 ส.ค. 2569)
  if (m === 3) return MYD.allQuartersTravelReady(plan, MYD.loadMaster());
  // ปุ่ม "ยืนยันแผนเดินทาง" (ขั้นสุดท้ายของเฟส) ยังต้องครบทุกไตรมาสเหมือนเดิม
  if (m === 4) return MYD.travelPlanReady(plan, MYD.loadMaster());
  return true;
}


function updateProcPrimaryEnabled(plan) {
  const btn = $('btnPrimaryProc');
  if (!btn) return;
  btn.disabled = !validateProcSub(plan, state.sub);
}

// ----- wizard shell -----
function renderProcWizard(plan) {
  const steps = currentProcSteps();
  const onTravel = currentPhase() === 'travel';
  const isLastStep = state.sub === steps.length;
  const primaryLabel = isLastStep ? (onTravel ? 'ยืนยันแผนเดินทาง' : 'ไปเฟสถัดไป') : 'ถัดไป';
  const primaryDisabled = !validateProcSub(plan, state.sub);

  $('phase').innerHTML = `
    <div class="card">
      <div class="wsteps sm">${steps.map(s => {
        const active = s.no === state.sub;
        const passed = s.no < state.sub;
        const cls = ['wstep'];
        if (active) cls.push('active');
        if (passed) cls.push('passed');
        if (s.no > state.sub) cls.push('locked');
        return `<div class="${cls.join(' ')}" onclick="goProcSub(${s.no})">
          <span class="num">${passed ? '✓' : s.no}</span>
          <span class="lbl">${esc(s.label)}</span>
        </div>`;
      }).join('')}</div>
      <div id="procBody">${renderProcSubBody(plan)}</div>
      ${primaryDisabled && masterStep(state.sub) === 3 ? (() => {
        const bl = TRIP.blockers(plan);
        return bl.length ? `<div class="note note-warn"><span class="ms">error</span>
          <div><b>ยังไปขั้นถัดไปไม่ได้</b> — ต้องทำแผนเดินทางให้ครบทั้ง 4 ไตรมาสก่อน ตอนนี้แต่ละไตรมาสยังค้าง:
            <ul style="margin:6px 0 0 18px">${bl.map(x => `<li>${x}</li>`).join('')}</ul></div></div>` : '';
      })() : ''}
      <div class="actions">
        <button class="btn btn-g" id="btnBackProc" ${state.sub === 1 ? 'disabled' : ''}>ย้อนกลับ</button>
        <button class="btn btn-p" id="btnPrimaryProc" ${primaryDisabled ? 'disabled' : ''}
          ${primaryDisabled && masterStep(state.sub) === 3 ? 'title="กรุณาทำแผนเดินทางครบทั้ง4ไตรมาส"' : ''}>${esc(primaryLabel)}</button>
      </div>
    </div>`;

  bindProcSubBody(plan);

  $('btnBackProc').addEventListener('click', backProcSub);
  $('btnPrimaryProc').addEventListener('click', () => {
    if (!isLastStep) { nextProcSub(); return; }
    if (onTravel) { TRIP.confirm(plan); renderStepper(); renderTravelPhase(); return; }
    const nx = nextPhaseOf('procurement');
    if (nx) goPhase(nx.id);
  });
}

function renderProcSubBody(plan) {
  const m = masterStep(state.sub);
  if (m === 1) return renderProcStepConfirm(plan);
  if (m === 2) return renderProcStep1(plan);      // เบิก/จัดหาอะไหล่
  if (m === 3) return TRIP.renderStep1(plan);     // แผนเดินทาง — โมดูล trip-plan.js
  return TRIP.renderStep2(plan);                   // ทวน + ยืนยัน — โมดูล trip-plan.js
}

function bindProcSubBody(plan) {
  const m = masterStep(state.sub);
  if (m === 1) bindProcStepConfirm(plan);
  else if (m === 2) bindProcStep1(plan);
  else if (m === 3) TRIP.bindStep1(plan, {
    onChange: () => renderProcWizard(plan),        // โมดูลขอให้วาดใหม่ทั้ง wizard
    onValidity: () => updateProcPrimaryEnabled(plan), // โมดูลขอให้ทวนสถานะปุ่ม "ถัดไป"
  });
  // ขั้นทวน+ยืนยัน — มีแค่แท็บสลับไตรมาส ไม่กระทบสถานะปุ่ม "ยืนยัน" จึงไม่ต้องส่ง onValidity
  else TRIP.bindStep2(plan, { onChange: () => renderProcWizard(plan) });
}

// ----- ขั้น 1 (ชื่อฟังก์ชันค้างจากตอนมี 3 ขั้น เนื้อหาจริงคือเบิกอะไหล่ เรียกเป็นขั้นที่ 2) -----
function renderProcStep1(plan) {
  const master = MYD.loadMaster();
  // นับเฉพาะคันที่ผ่านขั้นยืนยันแล้ว — เจ้าของงานสั่ง 10 ส.ค. 2569:
  // เบิกตามจำนวนรถในแผนจะสั่งของเกิน เพราะบางคันถูกตัด/เลื่อนไปแล้ว
  const selectedVehicles = master.vehicles.filter(v =>
    (plan.selectedVehicleIds || []).includes(v.id) && MYD.isVehicleIn(plan, v.id));
  const lines = MYD.deriveItems(selectedVehicles, master.items);
  const dropped = (plan.selectedVehicleIds || []).length - selectedVehicles.length;

  const groups = ['part', 'oil', 'filter'].map(cat => {
    const catLines = lines.filter(l => l.item.category === cat);
    if (!catLines.length) return '';
    const rows = catLines.map(l => {
      // ขั้นเบิกจริง — ต้องเห็นยอดคงเหลือคู่กับยอดที่ขอเบิก ไม่งั้นเบิกไปแล้วค่อยรู้ว่าของไม่พอ
      const st = MYD.stockStatus(l.item.id, l.totalQty);
      return `
      <tr>
        <td>${esc(l.item.name)}<div class="cell-sub">${esc(MYD.triggerText(l.item))}</div></td>
        <td class="num">${esc(l.item.qtyPerVehicle)}</td>
        <td class="num">${esc(l.vehicleCount)}</td>
        <td class="num">${esc(l.totalQty)}</td>
        <td>${esc(l.item.unit)}</td>
        <td class="num">${st.have == null ? '<span class="cell-sub">—</span>' : `<b>${st.have.toLocaleString('th-TH')}</b>`}
          <div><span class="badge ${STOCK_BADGE[st.level]}">${esc(st.text)}</span></div></td>
      </tr>`;
    }).join('');
    return `
      <div class="sect">${esc(MYD.CATEGORY_LABELS[cat])}</div>
      <div class="tblwrap">
        <table class="tbl itbl">
          <thead><tr><th>ชื่อ</th><th>ต่อคัน</th><th>จำนวนรถ</th><th>รวม</th><th>หน่วย</th><th>คงเหลือ (Smart Inventory)</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join('');

  return `
    <div class="sect">ขั้นที่ 2: เบิก/จัดหาอะไหล่ (สรุปรายการจากแผน)</div>
    <div class="sub">คิดจากรถที่ยืนยันแล้ว <b>${selectedVehicles.length}</b> คัน
      ${dropped ? `(ตัด/เลื่อน ${dropped} คันจากขั้นยืนยันรถ)` : ''}</div>
    ${(() => {
      const sm = MYD.stockSummary(lines);
      if (sm.short.length) return `<div class="note note-warn"><span class="ms">inventory</span>
        <div><b>เบิกได้ไม่ครบ ${sm.short.length} รายการ</b> — ${esc(sm.short.map(l =>
          `${l.item.name} (ขาด ${MYD.stockStatus(l.item.id, l.totalQty).short} ${l.item.unit})`).join(' · '))}
        <br>ต้องรอฝ่ายพัสดุสั่งเพิ่ม หรือปรับแผนก่อน</div></div>`;
      if (sm.tight.length) return `<div class="note note-info"><span class="ms">inventory</span>
        <div>เบิกได้ครบ แต่คลังจะเหลือน้อย ${sm.tight.length} รายการ</div></div>`;
      return `<div class="note note-ok"><span class="ms">inventory</span><div>คลังพอทุกรายการ เบิกได้ครบ</div></div>`;
    })()}
    ${groups || `<div class="empty">ไม่มีรายการที่เกี่ยวข้องกับรถที่เลือก</div>`}
    <div style="margin-top:14px">
      ${plan.partsRequisitioned
        ? `<span class="badge b-ok">ส่งคำขอแล้ว</span>`
        : `<button class="btn btn-o" id="btnRequisition">ส่งคำขอเบิกอะไหล่</button>`}
    </div>`;
}

function bindProcStep1(plan) {
  const btn = $('btnRequisition');
  if (!btn) return;
  btn.addEventListener('click', () => {
    plan.partsRequisitioned = true;
    MYD.savePlan(plan);
    toast('ส่งคำขอเบิกอะไหล่สำเร็จ');
    renderProcWizard(plan);
  });
}

// ----- ขั้น 1: ยืนยันรถเข้าร่วมแผน (ฟังก์ชันชื่อ renderProcStepConfirm) -----
const CF_STATUS_BADGE = {
  ready:    { cls: 'b-ok',    text: 'พร้อม' },
  notready: { cls: 'b-brand', text: 'ไม่พร้อม' },
  pending:  { cls: 'b-low',   text: 'รอตอบ' },
  overdue:  { cls: 'b-low',   text: 'เลยกำหนด' },
};
// CF_VERDICT_LABELS ย้ายไป common.js แล้ว (25 ส.ค. 2569) — ใช้ทั้งที่นี่และ trip-plan.js

function renderProcStepConfirm(plan) {
  const master = MYD.loadMaster();
  const ids = plan.selectedVehicleIds || [];
  const vehicles = master.vehicles.filter(v => ids.includes(v.id));
  const days = MYD.loadSettings().confirmDueDays;

  if (!plan.confirm || !plan.confirm.requestedAt) {
    const depts = new Set(vehicles.map(v => v.ownerDept));
    return `
      <div class="sect">ขั้นที่ 1: ยืนยันรถเข้าร่วมแผน</div>
      <div class="sub">ส่งรายการรถให้หน่วยงานเจ้าของรถยืนยันว่าเข้าบำรุงรักษาได้จริง
        — ต้องรู้จำนวนรถที่แน่นอนก่อนวางแผนเดินทาง</div>
      <div class="card">
        <div>จะส่งคำขอไป <b>${depts.size}</b> หน่วยงาน รวม <b>${vehicles.length}</b> คัน</div>
        <div class="sub">กำหนดตอบภายใน ${days} วัน (แก้ได้ที่หน้า Admin)</div>
        <button class="btn btn-o" id="btnSendConfirm">
          <span class="ms">send</span> ส่งคำขอยืนยัน</button>
      </div>`;
  }

  const today = todayIso();
  const s = MYD.confirmSummary(plan, ids, today);

  const cfRow = v => {
    const e = MYD.vehicleConfirm(plan, v.id);
    const st = MYD.confirmStatus(plan, v.id, today);
    const b = CF_STATUS_BADGE[st];
    const needsVerdict = (st === 'notready' || st === 'overdue') && e.verdict === null;
    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="sub">${esc(v.brand)}</div></td>
      <td>${esc(v.ownerDept)}</td>
      <td><span class="badge ${b.cls}">${b.text}</span>
        ${e.reason ? `<div class="sub">${esc(e.reason)}</div>` : ''}</td>
      <td>${esc(e.meetPoint || '—')}</td>
      <td>${esc(e.at || '—')}</td>
      <td>${e.verdict
            ? `<span class="badge b-brand">${CF_VERDICT_LABELS[e.verdict]}</span>
               ${e.verdictWhy ? `<div class="sub">${esc(e.verdictWhy)}</div>` : ''}`
            : needsVerdict
              ? `<button class="btn btn-s btn-sm" data-verdict-for="${esc(v.id)}">ตัดสิน</button>`
              : '—'}</td>
      <td>${MYD.isVehicleIn(plan, v.id)
            ? `<span class="badge b-ok">เข้าทริป</span>`
            : `<span class="badge b-low">ไม่เข้า</span>`}</td>
    </tr>`;
  };

  // แบ่งรายการเป็น ภาค → จังหวัด ตามที่เจ้าของงานสั่ง 10 ส.ค. 2569
  // แสดงเฉพาะภาค/จังหวัดที่มีรถในแผนนี้จริง ไม่ไล่ทั้ง 12 เขต
  const cfTable = rows => `
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th><th>คำตอบ</th>
        <th>จุดนัดรับ</th><th>ตอบเมื่อ</th><th>คำตัดสิน กบค.</th><th>ผล</th></tr></thead>
      <tbody>${rows}</tbody></table></div>`;

  const countText = list => {
    const g = MYD.confirmSummary(plan, list.map(v => v.id), today);
    const parts = [`${g.total} คัน`, `เข้าทริป ${g.joining}`];
    if (g.notready) parts.push(`ไม่พร้อม ${g.notready}`);
    if (g.overdue) parts.push(`เลยกำหนด ${g.overdue}`);
    if (g.waiting) parts.push(`รอตอบ ${g.waiting}`);
    return parts.join(' · ');
  };

  const groups = MYD.ZONE_ORDER.map(zone => {
    const inZone = vehicles.filter(v => MYD.regionZone(v.region) === zone);
    if (!inZone.length) return '';

    const provinces = [...new Set(inZone.map(v => v.region))].sort((a, b) => a - b).map(r => {
      const inProv = inZone.filter(v => v.region === r);
      return `
        <div class="rzone">
          <div class="rzone-head">
            <span class="ms rzone-caret">location_city</span>
            <b>${esc(MYD.provinceOfRegion(r))}</b>
            <span class="rzone-count">เขต ${esc(r)} · ${countText(inProv)}</span>
          </div>
          <div class="rzone-body flush">${cfTable(inProv.map(cfRow).join(''))}</div>
        </div>`;
    }).join('');

    return `<div class="wgrp">${esc(MYD.ZONE_LABELS[zone])} — ${countText(inZone)}</div>${provinces}`;
  }).join('');

  const left = ids.filter(id => {
    const e = MYD.vehicleConfirm(plan, id);
    return !(e.answer === 'ready' || e.verdict !== null);
  }).length;

  return `
    <div class="sect">ขั้นที่ 1: ยืนยันรถเข้าร่วมแผน</div>
    <div class="sub">ส่งคำขอเมื่อ ${dateTh(plan.confirm.requestedAt)}
      · ครบกำหนดตอบ ${dateTh(plan.confirm.dueAt)}
      ${plan.confirm.remindedAt ? `· เตือนซ้ำล่าสุด ${esc(plan.confirm.remindedAt)}` : ''}</div>
    <div class="card">
      <div class="sect">สรุปการยืนยัน</div>
      <div>
        <span class="badge b-ok">ยืนยันแล้ว ${s.ready}</span>
        <span class="badge b-low">รอตอบ ${s.waiting}</span>
        <span class="badge b-brand">ไม่พร้อม ${s.notready}</span>
        <span class="badge b-low">เลยกำหนด ${s.overdue}</span>
      </div>
      <div class="sub" style="margin-top:8px">
        เข้าทริปนี้ <b>${s.joining}</b> คัน จากรถในแผน ${s.total} คัน
        — ตัวเลขนี้คือจำนวนที่แผนเดินทางจะใช้</div>
      <button class="btn btn-g btn-sm" id="btnRemind">
        <span class="ms">notifications</span> ส่งเตือนซ้ำ</button>
    </div>
    ${groups}
    ${left ? `<div class="empty">เหลืออีก ${left} คันที่ยังไม่มีข้อสรุป — ทำแผนเดินทางต่อไม่ได้จนกว่าจะครบ</div>` : ''}`;
}

function bindProcStepConfirm(plan) {
  const send = $('btnSendConfirm');
  if (send) {
    send.addEventListener('click', () => {
      // เขียน storage ตอนกดเท่านั้น — ห้ามสร้างตั้งแต่ render (บทเรียน plan-new.html)
      const c = MYD.ensureConfirm(plan);
      const days = MYD.loadSettings().confirmDueDays;
      const d = new Date(); d.setDate(d.getDate() + days);
      c.requestedAt = todayIso();
      c.dueAt = toIsoBE(d);
      (plan.selectedVehicleIds || []).forEach(id => {
        if (!c.byVehicle[id]) c.byVehicle[id] = MYD.emptyConfirmEntry();
      });
      MYD.savePlan(plan);
      toast('ส่งคำขอยืนยันแล้ว');
      renderProcWizard(plan);
    });
  }

  const remind = $('btnRemind');
  if (remind) {
    remind.addEventListener('click', () => {
      MYD.ensureConfirm(plan).remindedAt = nowTh();
      MYD.savePlan(plan);
      toast('ส่งเตือนซ้ำแล้ว (ต้นแบบยังไม่มีระบบแจ้งเตือนจริง)');
      renderProcWizard(plan);
    });
  }

  document.querySelectorAll('[data-verdict-for]').forEach(btn => {
    btn.addEventListener('click', () => openVerdictRow(plan, btn.dataset.verdictFor));
  });
}

// แถวขยายในตาราง (ไม่ใช่ modal — components.css ไม่มีคลาส modal/dialog)
// ใช้คลาสที่มีจริง: .rads (กลุ่ม radio) · .f (ช่องกรอก) · .btn
function openVerdictRow(plan, vehicleId) {
  const tr = document.querySelector(`[data-verdict-for="${vehicleId}"]`).closest('tr');
  if (tr.nextElementSibling && tr.nextElementSibling.dataset.verdictRow) {
    tr.nextElementSibling.remove(); return;          // กดซ้ำ = ปิด
  }
  const row = document.createElement('tr');
  row.dataset.verdictRow = vehicleId;
  row.innerHTML = `<td colspan="7">
    <div class="rads">
      <label><input type="radio" name="vd" value="keep"> เข้าตามเดิม</label>
      <label><input type="radio" name="vd" value="drop"> ตัดออกจากแผน</label>
      <label><input type="radio" name="vd" value="defer"> เลื่อนรอบหน้า</label>
    </div>
    <div class="f"><label>เหตุผลการตัดสิน</label>
      <input type="text" id="vdWhy" placeholder="บันทึกไว้ให้ตรวจสอบย้อนหลังได้"></div>
    <button class="btn btn-o btn-sm" id="vdSave">บันทึกคำตัดสิน</button></td>`;
  tr.after(row);

  $('vdSave').addEventListener('click', () => {
    const picked = row.querySelector('input[name="vd"]:checked');
    if (!picked) { toast('เลือกคำตัดสินก่อน'); return; }
    const c = MYD.ensureConfirm(plan);
    const e = c.byVehicle[vehicleId] || (c.byVehicle[vehicleId] = MYD.emptyConfirmEntry());
    e.verdict = picked.value;
    e.verdictWhy = ($('vdWhy').value || '').trim();
    e.verdictAt = nowTh();
    MYD.savePlan(plan);
    toast('บันทึกคำตัดสินแล้ว');
    renderProcWizard(plan);
  });
}


// ================= INIT =================
window.addEventListener('hashchange', route);
document.addEventListener('DOMContentLoaded', () => {
  renderTimeSim();
  route();

  const btnReset = $('btnResetDemo');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (!confirm('เริ่มเดโมใหม่? แผนทั้งหมดจะถูกแทนที่ด้วยแผนตัวอย่าง 1 ใบ')) return;
      MYD.reseedPlans();
      location.hash = '';
      route();
      toast('เริ่มเดโมใหม่แล้ว — เหลือแผนตัวอย่าง 1 ใบ');
    });
  }
});
