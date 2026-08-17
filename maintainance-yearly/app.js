// app.js — รายการแผน + หน้าแผนรายใบ (stepper 5 เฟสปฏิบัติการ)
//
// ⚠️ โครงเปลี่ยน 8 ส.ค. 2569
//   - "ออกเลขงาน" แยกไป plan-new.html แล้ว ไม่อยู่ใน stepper นี้
//   - ระบบเก็บ "หลายแผน" (MYD.loadPlans()) แผนหนึ่ง = ประจำปีหนึ่งใบของ กบค.
//   - เลขงาน (MT-ปี-ไตรมาส-NNN) คือหัวข้อของแผน · stepper เป็นของ "แต่ละแผน"
//
// routing: index.html         -> รายการแผน
//          index.html#<planId> -> เปิดแผนนั้น + stepper 5 เฟส
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้

const PHASES = [
  { id: 'procurement', no: 1, label: 'เบิก/จัดหา + แผนเดินทาง' },
  { id: 'maintenance', no: 2, label: 'ดำเนินการบำรุงรักษา' },
  { id: 'inspection',  no: 3, label: 'ตรวจรับ' },
  { id: 'report',      no: 4, label: 'จัดทำรายงาน' },
  { id: 'cost',        no: 5, label: 'คำนวณต้นทุน' },
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
function isPhaseComplete(id) {
  if (!PLAN) return false;
  if (id === 'procurement') return PLAN.travelConfirmed === true;
  return false;   // เฟส 2-5 ยังไม่มี logic ของตัวเอง (ทำเมื่อถึงคิว)
}

function canGoPhase(id) {
  const idx = PHASES.findIndex(p => p.id === id);
  if (idx <= 0) return true;
  return isPhaseComplete(PHASES[idx - 1].id);
}

function currentPhase() {
  return (PLAN && PLAN.phase) || PHASES[0].id;
}

// ================= รายการแผน =================
// ความคืบหน้าของแผน — ถ้าเฟสที่อยู่ทำเสร็จแล้ว ให้บอกว่าพร้อมไปเฟสถัดไป
// (ตอนนี้มี logic ความสำเร็จเฉพาะเฟส 1 — เฟส 2-5 ยังไม่มีของตัวเอง)
function planProgressText(plan) {
  const idx = Math.max(0, PHASES.findIndex(p => p.id === (plan.phase || PHASES[0].id)));
  const cur = PHASES[idx];
  const done = cur.id === 'procurement' && plan.travelConfirmed === true;
  if (done && idx + 1 < PHASES.length) {
    return `<span class="badge b-ok">เฟส ${cur.no} ✓</span> พร้อมเฟส ${PHASES[idx + 1].no} · ${esc(PHASES[idx + 1].label)}`;
  }
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

function goPhase(id) {
  if (!canGoPhase(id)) {
    toast('ต้องทำเฟสก่อนหน้าให้เสร็จก่อน ถึงจะเข้าเฟสนี้ได้');
    return;
  }
  PLAN.phase = id;
  MYD.savePlan(PLAN);
  state.sub = 1;
  renderStepper();
  renderPhaseBody();
  window.scrollTo({ top: 0 });
}

function renderPlaceholder(id) {
  const phase = PHASES.find(p => p.id === id);
  const label = phase ? phase.label : id;
  return `<div class="card">
    <div class="sect">${esc(label)}</div>
    <div class="empty">เฟสนี้อยู่ในแผนถัดไป — ${esc(label)}</div>
  </div>`;
}

function renderPhaseBody() {
  if (currentPhase() === 'procurement') { renderProcurement(); return; }
  $('phase').innerHTML = renderPlaceholder(currentPhase());
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
// ================= PROCUREMENT WIZARD (Phase 2) =================
// ================================================================
// sub-stepper 4 ขั้น (ใช้ state.sub ร่วมกับเฟส 1 — goPhase() รีเซ็ตเป็น 1
// ทุกครั้งที่เปลี่ยนเฟส) เขียน/อ่านผ่าน PLAN/MYD.savePlan() เช่นกัน
// เข้าเฟส 2 ครั้งใด ถ้า travelConfirmed แล้ว ข้าม wizard ไปแสดงสรุปยืนยันเลย

const PROC_STEPS = [
  { no: 1, label: 'ยืนยันรถเข้าร่วมแผน' },
  { no: 2, label: 'เบิก/จัดหาอะไหล่' },
  { no: 3, label: 'แผนเดินทาง' },
  { no: 4, label: 'ทวน + ยืนยัน' },
];

function renderProcurement() {
  const plan = PLAN;
  if (plan.travelConfirmed === true) {
    renderProcurementConfirmed(plan);
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
  if (n < 1 || n > PROC_STEPS.length) return;
  if (n > state.sub) {
    const plan = PLAN;
    for (let i = 1; i < n; i++) {
      if (!validateProcSub(plan, i)) {
        toast(`ทำขั้น "${PROC_STEPS[i - 1].label}" ให้เสร็จก่อน ถึงจะไปขั้นถัดไปได้`);
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
  if (state.sub >= PROC_STEPS.length) return;
  goProcSub(state.sub + 1);
}

function backProcSub() {
  if (state.sub <= 1) return;
  goProcSub(state.sub - 1);
}

function validateProcSub(plan, sub) {
  if (sub === 1) return MYD.confirmResolved(plan, plan.selectedVehicleIds || []);
  if (sub === 2) return !!plan.partsRequisitioned;
  // ขั้นแผนเดินทางจบเมื่อ: จัดรถเข้าใบครบทุกคัน + ทุกใบได้รับการตอบรับจากหน่วยงาน
  if (sub === 3) return MYD.travelPlanReady(plan, MYD.loadMaster());
  return true;
}

function updateProcPrimaryEnabled(plan) {
  const btn = $('btnPrimaryProc');
  if (!btn) return;
  btn.disabled = !validateProcSub(plan, state.sub);
}

// ----- wizard shell -----
function renderProcWizard(plan) {
  const primaryLabel = state.sub === PROC_STEPS.length ? 'ยืนยันแผนเดินทาง' : 'ถัดไป';
  const primaryDisabled = !validateProcSub(plan, state.sub);

  $('phase').innerHTML = `
    <div class="card">
      <div class="wsteps sm">${PROC_STEPS.map(s => {
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
      <div class="actions">
        <button class="btn btn-g" id="btnBackProc" ${state.sub === 1 ? 'disabled' : ''}>ย้อนกลับ</button>
        <button class="btn btn-p" id="btnPrimaryProc" ${primaryDisabled ? 'disabled' : ''}>${esc(primaryLabel)}</button>
      </div>
    </div>`;

  bindProcSubBody(plan);

  $('btnBackProc').addEventListener('click', backProcSub);
  $('btnPrimaryProc').addEventListener('click', () => {
    if (state.sub === PROC_STEPS.length) confirmTravelPlan(plan);
    else nextProcSub();
  });
}

function renderProcSubBody(plan) {
  if (state.sub === 1) return renderProcStepConfirm(plan);
  if (state.sub === 2) return renderProcStep1(plan);      // เบิก/จัดหาอะไหล่
  if (state.sub === 3) return renderProcStep2(plan);      // แผนเดินทาง
  return renderProcStep3(plan);                            // ทวน + ยืนยัน
}

function bindProcSubBody(plan) {
  if (state.sub === 1) bindProcStepConfirm(plan);
  else if (state.sub === 2) bindProcStep1(plan);
  else if (state.sub === 3) bindProcStep2(plan);
  // ขั้น 4 อ่านอย่างเดียว ไม่มี event ผูก (ปุ่มยืนยันอยู่ที่ actions footer)
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
const CF_VERDICT_LABELS = { keep: 'เข้าตามเดิม', drop: 'ตัดออกจากแผน', defer: 'เลื่อนรอบหน้า' };

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

// ----- ขั้น 3: ทำแผนเดินทาง -----
const TRIP_STATUS_BADGE = {
  draft:    { cls: 'b-low',   text: 'ยังไม่ส่ง' },
  waiting:  { cls: 'b-low',   text: 'รอตอบรับ' },
  rejected: { cls: 'b-brand', text: 'ถูกปฏิเสธ' },
  accepted: { cls: 'b-ok',    text: 'ตอบรับแล้ว' },
};

function tripVehicles(trip, master) {
  const byId = new Map(master.vehicles.map(v => [v.id, v]));
  return (trip.vehicleIds || []).map(id => byId.get(id)).filter(Boolean);
}

// 1 แผนบำรุงรักษามีแผนเดินทางได้หลายใบ — กบค. เลือกเองว่ารถคันไหนเข้าใบไหน
// (เจ้าของงานเคาะ 10 ส.ค. 2569: "การสร้างจะอิสระ หมายถึงเลือกรถได้ เลือกแผน")
function renderProcStep2(plan) {
  const master = MYD.loadMaster();
  const trips = MYD.ensureTrips(plan);
  MYD.ensurePlanQuarters(plan);
  // แผนเดินทางทำทีละไตรมาส (เจ้าของงานสั่ง 17 ส.ค. 2569) — เห็นเฉพาะรถของไตรมาสที่เลือก
  // แล้วย้ายรถข้ามไตรมาส/พักไว้ยังไม่ระบุ ได้จากหน้านี้เลย
  if (!MYD.QUARTER_KEYS.includes(state.travelQ)) state.travelQ = 'Q1';
  const travelQ = state.travelQ;
  const inQuarter = new Set(MYD.planVehicleIds(plan, travelQ));
  const joining = MYD.planVehicleIds(plan, travelQ).filter(id => MYD.isVehicleIn(plan, id));
  const unassigned = MYD.unassignedVehicleIds(plan).filter(id => inQuarter.has(id));
  const accepted = trips.filter(t => MYD.tripStatus(t, master) === 'accepted').length;

  const qSeg = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
    const n = MYD.planVehicleIds(plan, q).length;
    return `<div class="sg travelQSeg ${travelQ === q ? 'sel' : ''}" data-q="${q}">${q} · ${n} คัน</div>`;
  }).join('');
  const noneIds = MYD.planVehicleIds(plan, 'none');

  // จัดตัวเลือกเป็นกลุ่มตามจังหวัด — เห็นได้ทันทีว่ารถที่ยังไม่ถูกจัดกระจายอยู่จังหวัดไหนบ้าง
  // และเลือกทีละจังหวัดได้ง่ายเวลาแผนหนึ่งมีรถข้ามจังหวัด
  const byProvince = {};
  master.vehicles.filter(v => unassigned.includes(v.id)).forEach(v => {
    const prov = MYD.provinceOfRegion(v.region);
    (byProvince[prov] = byProvince[prov] || []).push(v);
  });
  const unassignedOpts = Object.keys(byProvince).sort((a, b) => a.localeCompare(b, 'th')).map(prov => {
    const opts = byProvince[prov].map(v =>
      `<option value="${esc(v.id)}">${esc(v.plate)} · ${esc(v.ownerDept)} — ${esc(v.brand)}</option>`).join('');
    return `<optgroup label="${esc(prov)} (${byProvince[prov].length} คัน)">${opts}</optgroup>`;
  }).join('');

  const tripBoxes = trips.map(trip => {
    const st = MYD.tripStatus(trip, master);
    const b = TRIP_STATUS_BADGE[st];
    const sent = !!trip.sentAt;
    const locked = sent && st !== 'rejected';   // ส่งแล้วแก้ไม่ได้ จนกว่าจะถูกปฏิเสธ
    const dis = locked ? 'disabled' : '';
    const vs = tripVehicles(trip, master);
    const vendor = MYD.tripVendor(trip);

    const rows = vs.map(v => {
      const d = (trip.dates || {})[v.id] || '';
      const bad = d && !MYD.dateInWindow(trip, d);
      const jobs = MYD.tripJobsOf(trip, v.id);
      const noJob = !jobs.change && !jobs.inspect;
      const placeSet = (trip.places || {})[v.id];
      return `<tr>
        <td><b>${esc(v.plate)}</b><div class="cell-sub">${esc(v.brand)}</div></td>
        <td>${esc(v.ownerDept)}<div class="cell-sub">${v.ownerLevel === 'region' ? 'รถของเขต' : esc(v.province)}</div></td>
        <td>${locked
              ? esc(MYD.tripJobsText(trip, v.id))
              : `<div class="chips pick">${MYD.TRIP_JOBS.map(j => `
                  <span class="chip ${jobs[j.id] ? 'sel' : ''}" data-job-trip="${esc(trip.id)}"
                    data-job-veh="${esc(v.id)}" data-job="${esc(j.id)}">${esc(j.label)}</span>`).join('')}</div>
                 ${noJob ? '<div class="cell-sub">ต้องเลือกอย่างน้อย 1 งาน</div>' : ''}`}</td>
        <td><div class="in noic"><input type="text" value="${esc(placeSet || '')}" ${dis}
              placeholder="${esc(MYD.defaultPlaceOf(v))}"
              data-place-trip="${esc(trip.id)}" data-place-veh="${esc(v.id)}"></div>
            <div class="cell-sub">${placeSet ? 'แก้จากค่าตั้งต้น' : 'ค่าตั้งต้น: ' + esc(MYD.defaultPlaceOf(v))}</div></td>
        <td><div class="in noic"><input type="date" value="${esc(d)}" ${dis}
              data-trip="${esc(trip.id)}" data-veh="${esc(v.id)}"></div>
            ${bad ? `<div class="cell-sub">อยู่นอกช่วงที่เสนอ</div>` : ''}</td>
        <td>${locked ? esc(MYD.bucketOf(plan, v.id) || '—') : `
          <div class="in noic"><select class="vehQMove" data-veh="${esc(v.id)}" data-trip="${esc(trip.id)}">
            ${['Q1', 'Q2', 'Q3', 'Q4'].map(q => `<option value="${q}" ${MYD.bucketOf(plan, v.id) === q ? 'selected' : ''}>อยู่ ${q}</option>`).join('')}
            <option value="none" ${MYD.bucketOf(plan, v.id) === 'none' ? 'selected' : ''}>ยังไม่ระบุไตรมาส</option>
            <option value="out">เอาออกจากแผนทั้งใบ</option>
          </select></div>`}</td>
        <td class="num">${locked ? '' : `<button class="btn btn-g btn-sm" data-trip-drop="${esc(trip.id)}" data-veh="${esc(v.id)}">เอาออกจากใบนี้</button>`}</td>
      </tr>`;
    }).join('');

    const replyRows = MYD.tripDepts(trip, master).map(d => {
      const r = MYD.tripReply(trip, d);
      const rb = r.status === 'accepted' ? 'b-ok' : r.status === 'rejected' ? 'b-brand' : 'b-low';
      const rt = r.status === 'accepted' ? 'ตอบรับ' : r.status === 'rejected' ? 'ปฏิเสธ' : 'รอตอบ';
      return `<tr><td>${esc(d)}</td>
        <td><span class="badge ${rb}">${rt}</span></td>
        <td>${esc(r.reason || '—')}</td>
        <td>${esc(r.at || '—')}</td></tr>`;
    }).join('');

    return `
      <div class="rzone">
        <div class="rzone-head">
          <span class="ms rzone-caret">event</span>
          <b>${esc(trip.name || 'แผนเดินทาง')}</b>
          <span class="rzone-count">${vs.length} คัน · ${MYD.tripDepts(trip, master).length} หน่วยงาน · ${MYD.tripCost(trip).toLocaleString('th-TH')} บาท</span>
          <span class="badge ${trip.mode === 'vendor' ? 'b-info' : 'b-neutral'}">${trip.mode === 'vendor' ? (vendor ? esc(vendor.name) : 'จ้าง — ยังไม่เลือกผู้รับจ้าง') : 'กบค. ตรวจเอง'}</span>
          <span class="badge ${b.cls}">${b.text}</span>
        </div>
        <div class="rzone-body">
          <div class="fgrid">
            <div class="f sp2"><label>ชื่อแผน</label>
              <div class="in"><span class="ms">label</span>
                <input type="text" value="${esc(trip.name || '')}" ${dis}
                  placeholder="เช่น ชัยนาท รอบ 1" data-trip="${esc(trip.id)}" data-field="name"></div></div>
            <div class="f sp2"><label>สถานที่บำรุงรักษา</label>
              <div class="in"><span class="ms">place</span>
                <input type="text" value="${esc(trip.location || '')}" ${dis}
                  placeholder="เช่น จุดรวมงาน กฟจ. ชัยนาท" data-trip="${esc(trip.id)}" data-field="location"></div></div>
            <div class="f sp2"><label>ช่วงที่เสนอ — จากวันที่</label>
              <div class="in noic"><input type="date" value="${esc(trip.windowFrom || '')}" ${dis}
                data-trip="${esc(trip.id)}" data-field="windowFrom"></div></div>
            <div class="f sp2"><label>ถึงวันที่</label>
              <div class="in noic"><input type="date" value="${esc(trip.windowTo || '')}" ${dis}
                data-trip="${esc(trip.id)}" data-field="windowTo"></div></div>
            <div class="f sp4"><label>ผู้ดำเนินการของใบนี้</label>
              <div class="seg">
                <div class="sg tripMode ${trip.mode !== 'vendor' ? 'sel' : ''}" data-mode-trip="${esc(trip.id)}" data-mode="self">
                  กบค. ตรวจเอง<div class="sg-sub">ระบุชื่อพนักงานที่ออกไปซ่อม</div></div>
                <div class="sg tripMode ${trip.mode === 'vendor' ? 'sel' : ''}" data-mode-trip="${esc(trip.id)}" data-mode="vendor">
                  จ้างผู้รับจ้าง<div class="sg-sub">assign ใบนี้ให้ผู้รับจ้างไปทำ</div></div>
              </div></div>
            ${trip.mode === 'vendor' ? `
            <div class="f sp2"><label>ผู้รับจ้าง</label>
              <div class="in noic"><select data-vendor-trip="${esc(trip.id)}" ${dis}>
                <option value="">— เลือกผู้รับจ้าง —</option>
                ${MYD.vendorsForTrip(trip, master).map(vd => `
                  <option value="${esc(vd.id)}" ${trip.vendorId === vd.id ? 'selected' : ''}>${esc(vd.name)}</option>`).join('')}
              </select></div>
              ${vendor ? `<div class="cell-sub">ผู้ติดต่อ ${esc(vendor.contact)} · ${esc(vendor.phone)} · เลขผู้เสียภาษี ${esc(vendor.taxId)}</div>` : ''}</div>
            <div class="f sp2"><label>ค่าจ้างเหมา (บาท)</label>
              <div class="in noic"><input type="number" min="0" value="${esc(trip.hireCost ?? 0)}" ${dis}
                data-trip="${esc(trip.id)}" data-field="hireCost"></div></div>
            ` : `
            <div class="f"><label>ค่าเบี้ยเลี้ยง (บาท)</label>
              <div class="in noic"><input type="number" min="0" value="${esc(trip.perDiem ?? 0)}" ${dis}
                data-trip="${esc(trip.id)}" data-field="perDiem"></div></div>
            <div class="f"><label>ค่าที่พัก (บาท)</label>
              <div class="in noic"><input type="number" min="0" value="${esc(trip.lodging ?? 0)}" ${dis}
                data-trip="${esc(trip.id)}" data-field="lodging"></div></div>
            <div class="f"><label>ค่าเดินทาง (บาท)</label>
              <div class="in noic"><input type="number" min="0" value="${esc(trip.travel ?? 0)}" ${dis}
                data-trip="${esc(trip.id)}" data-field="travel"></div></div>
            <div class="f"><label>รวม</label><div><b>${esc((trip.perDiem || 0) + (trip.lodging || 0) + (trip.travel || 0))} บาท</b></div></div>
            `}
          </div>

          ${trip.mode === 'vendor' ? '' : `
          <div class="sect">พนักงาน กบค. ที่ออกไปซ่อม</div>
          <div class="sub">ปกติ 2-3 คนต่อใบ — ใส่ชื่อไว้เพื่อให้หน่วยงานเจ้าของรถรู้ว่าใครจะไป</div>
          <div class="fgrid">
            ${(trip.staff || ['']).map((name, i) => `
              <div class="f sp2"><label>คนที่ ${i + 1}</label>
                <div class="in"><span class="ms">engineering</span>
                  <input type="text" value="${esc(name || '')}" ${dis} placeholder="ชื่อ-สกุล"
                    data-staff-trip="${esc(trip.id)}" data-staff-i="${i}"></div></div>`).join('')}
          </div>
          ${locked ? '' : `<div class="actions" style="justify-content:flex-start;margin-top:-6px">
            <button class="btn btn-t btn-sm" data-staff-add="${esc(trip.id)}"><span class="ms">add</span> เพิ่มคน</button>
            ${(trip.staff || []).length > 1 ? `<button class="btn btn-t btn-sm" data-staff-del="${esc(trip.id)}"><span class="ms">remove</span> ลดคน</button>` : ''}
          </div>`}
          `}

          <div class="sect">รถในแผนนี้ + วันนัดรายคัน</div>
          ${vs.length ? `<div class="tblwrap"><table class="tbl">
            <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th><th>งานที่จะทำ</th><th>สถานที่บำรุงรักษา</th><th>วันนัด</th><th>ไตรมาส</th><th></th></tr></thead>
            <tbody>${rows}</tbody></table></div>`
            : `<div class="empty">ยังไม่มีรถในแผนนี้ — เลือกจากรายการด้านล่าง</div>`}

          ${locked ? '' : `
          <div class="fgrid">
            <div class="f sp2"><label>เพิ่มรถเข้าแผนนี้ <small>เลือกจากคันที่ยังไม่ถูกจัด</small></label>
              <div class="in"><span class="ms">directions_car</span>
                <select data-trip-add-sel="${esc(trip.id)}" ${unassignedOpts ? '' : 'disabled'}>
                  ${unassignedOpts || '<option>— จัดครบทุกคันแล้ว —</option>'}</select></div></div>
            <div class="f"><label>&nbsp;</label>
              <button class="btn btn-s" data-trip-add="${esc(trip.id)}" ${unassignedOpts ? '' : 'disabled'}>เพิ่ม</button></div>
          </div>`}

          ${sent ? `
            <div class="sect">การตอบรับรายหน่วยงาน</div>
            <div class="sub">ส่งเมื่อ ${esc(trip.sentAt)} · เอกสารส่งถึงเจ้าของรถและ กรย. (กรย. รับสำเนา ไม่ต้องกดตอบ)</div>
            <div class="tblwrap"><table class="tbl">
              <thead><tr><th>หน่วยงาน</th><th>สถานะ</th><th>เหตุผลที่ปฏิเสธ</th><th>ตอบเมื่อ</th></tr></thead>
              <tbody>${replyRows}</tbody></table></div>` : ''}

          <div class="actions">
            ${locked
              ? `<button class="btn btn-g" data-trip-del="${esc(trip.id)}" disabled>ส่งแล้ว แก้ไม่ได้</button>`
              : `<button class="btn btn-g" data-trip-del="${esc(trip.id)}">ลบแผนนี้</button>
                 <button class="btn btn-o" data-trip-send="${esc(trip.id)}" ${MYD.tripReadyToSend(trip) && MYD.tripDoerReady(trip) && !MYD.tripJobsIncomplete(trip).length ? '' : 'disabled'}>
                   <span class="ms">send</span> ${st === 'rejected' ? 'แก้แล้วส่งใหม่' : 'ส่งแผนนัดให้หน่วยงาน'}</button>`}
          </div>
        </div>
      </div>`;
  }).join('');

  return `
    <div class="sect">ขั้นที่ 3: ทำแผนเดินทาง</div>
    <div class="f" style="margin-bottom:14px">
      <label>เลือกไตรมาสที่จะทำแผนเดินทาง</label>
      <div class="seg">${qSeg}</div>
    </div>
    ${noneIds.length ? `<div class="note note-info"><span class="ms">inbox</span>
      <div>มีรถ <b>${noneIds.length}</b> คันถูกพักไว้แบบ <b>ยังไม่ระบุไตรมาส</b> — ยังอยู่ในแผน
      แต่จะไม่โผล่ในไตรมาสไหนจนกว่าจะย้ายกลับเข้าไตรมาส</div></div>` : ''}
    <div class="sub">ไตรมาส ${esc(travelQ)}: รถที่ยืนยันแล้ว <b>${joining.length}</b> คัน — จัดเข้าแผนแล้ว <b>${joining.length - unassigned.length}</b>
      · ยังไม่จัด <b>${unassigned.length}</b> · แผนเดินทาง <b>${trips.length}</b> ใบ (ตอบรับแล้ว ${accepted})</div>
    <div class="sub">แผนหนึ่งมีได้หลายใบ — จะแยกตามจังหวัด หรือจังหวัดละหลายใบก็ได้ · แต่ละใบเสนอเป็นช่วงเวลา
      แล้วระบุวันนัดรายคันภายในช่วงนั้น</div>
    <div class="actions" style="justify-content:flex-start">
      <button class="btn btn-o" id="btnAddTrip"><span class="ms">add</span> สร้างแผนเดินทางใหม่</button>
      ${unassigned.length ? `<button class="btn btn-s" id="btnAutoTrips">
        <span class="ms">auto_awesome_motion</span> แยกอัตโนมัติตามจังหวัด</button>` : ''}
    </div>
    ${trips.length ? tripBoxes : `<div class="empty">ยังไม่มีแผนเดินทาง — กดสร้างแผนใหม่ หรือให้ระบบแยกตามจังหวัดให้</div>`}
    ${unassigned.length ? `<div class="empty">ยังมีรถ ${unassigned.length} คันที่ยังไม่ถูกจัดเข้าแผนใด — ต้องจัดครบก่อนไปขั้นถัดไป</div>` : ''}`;
}

function bindProcStep2(plan) {
  const master = MYD.loadMaster();
  const trips = MYD.ensureTrips(plan);
  const find = id => trips.find(t => t.id === id);
  const rerender = () => { MYD.savePlan(plan); renderProcWizard(plan); };

  // สลับ ตรวจเอง / จ้างผู้รับจ้าง — รายใบเดินทาง (เจ้าของงานเคาะ 17 ส.ค. 2569)
  document.querySelectorAll('.tripMode').forEach(sg => {
    sg.addEventListener('click', () => {
      const t = find(sg.dataset.modeTrip);
      if (!t || (t.sentAt && MYD.tripStatus(t, master) !== 'rejected')) return;
      t.mode = sg.dataset.mode;
      if (t.mode !== 'vendor') t.vendorId = null;
      rerender();
    });
  });

  document.querySelectorAll('[data-vendor-trip]').forEach(sel => {
    sel.addEventListener('change', e => {
      const t = find(sel.dataset.vendorTrip);
      if (!t) return;
      t.vendorId = e.target.value || null;
      const vd = MYD.vendorById(t.vendorId);
      if (vd) toast('assign ใบนี้ให้ ' + vd.name + ' แล้ว');
      rerender();
    });
  });

  // ชื่อพนักงาน กบค. — บันทึกทันทีแต่ไม่ re-render (ไม่งั้นโฟกัสหลุดระหว่างพิมพ์)
  document.querySelectorAll('[data-staff-trip]').forEach(el => {
    el.addEventListener('input', e => {
      const t = find(el.dataset.staffTrip);
      if (!t) return;
      t.staff = t.staff || [];
      t.staff[Number(el.dataset.staffI)] = e.target.value;
      MYD.savePlan(plan);
    });
  });
  document.querySelectorAll('[data-staff-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = find(btn.dataset.staffAdd);
      if (!t) return;
      t.staff = [...(t.staff || []), ''];
      rerender();
    });
  });
  document.querySelectorAll('[data-staff-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = find(btn.dataset.staffDel);
      if (!t || (t.staff || []).length <= 1) return;
      t.staff = t.staff.slice(0, -1);
      rerender();
    });
  });

  // งานต่อคัน — ติ๊กได้ทั้งสองอย่าง หรืออย่างเดียว
  document.querySelectorAll('[data-job]').forEach(chip => {
    chip.addEventListener('click', () => {
      const t = find(chip.dataset.jobTrip);
      if (!t) return;
      const veh = chip.dataset.jobVeh;
      const cur = MYD.tripJobsOf(t, veh);
      t.jobs = t.jobs || {};
      t.jobs[veh] = { ...cur, [chip.dataset.job]: !cur[chip.dataset.job] };
      rerender();
    });
  });

  // สถานที่บำรุงรักษารายคัน — ว่าง = กลับไปใช้ค่าตั้งต้น
  document.querySelectorAll('[data-place-trip]').forEach(el => {
    el.addEventListener('input', e => {
      const t = find(el.dataset.placeTrip);
      if (!t) return;
      t.places = t.places || {};
      t.places[el.dataset.placeVeh] = e.target.value;
      MYD.savePlan(plan);
    });
  });

  // สลับไตรมาสที่กำลังทำแผนเดินทาง — ไม่แตะข้อมูล แค่เปลี่ยนมุมมอง
  document.querySelectorAll('.travelQSeg').forEach(sg => {
    sg.addEventListener('click', () => { state.travelQ = sg.dataset.q; renderProcWizard(plan); });
  });

  // ย้ายรถข้ามไตรมาส / พักไว้ยังไม่ระบุ / เอาออกจากแผน — ทำจากหน้าแผนเดินทางได้เลย
  // (เจ้าของงานสั่ง 17 ส.ค. 2569) · ถอดออกจากใบเดินทางที่ถืออยู่ด้วยเสมอ ไม่งั้นใบเดินทาง
  // ของไตรมาสนี้จะยังค้างรถที่ย้ายไปไตรมาสอื่นแล้ว
  document.querySelectorAll('.vehQMove').forEach(sel => {
    sel.addEventListener('change', e => {
      const vehId = sel.dataset.veh;
      const target = e.target.value;
      const t = find(sel.dataset.trip);
      if (t) t.vehicleIds = (t.vehicleIds || []).filter(id => id !== vehId);
      if (t && t.dates) delete t.dates[vehId];
      MYD.assignVehicle(plan, vehId, target === 'out' ? null : target);
      toast(target === 'out' ? 'เอารถออกจากแผนแล้ว'
        : target === 'none' ? 'พักรถไว้แบบยังไม่ระบุไตรมาสแล้ว'
        : 'ย้ายรถไป ' + target + ' แล้ว');
      rerender();
    });
  });

  // ช่องกรอกระดับใบ — บันทึกทันทีแต่ไม่ re-render (ไม่งั้นโฟกัสหลุดระหว่างพิมพ์)
  document.querySelectorAll('[data-field][data-trip]').forEach(el => {
    el.addEventListener('input', e => {
      const t = find(el.dataset.trip);
      if (!t) return;
      const f = el.dataset.field;
      t[f] = ['perDiem', 'lodging', 'travel', 'hireCost'].includes(f) ? (Number(e.target.value) || 0) : e.target.value;
      MYD.savePlan(plan);
      updateProcPrimaryEnabled(plan);
      const btn = document.querySelector(`[data-trip-send="${t.id}"]`);
      if (btn) btn.disabled = !MYD.tripReadyToSend(t);
    });
  });

  // วันนัดรายคัน
  document.querySelectorAll('[data-veh][data-trip]:not([data-trip-drop])').forEach(el => {
    if (el.tagName !== 'INPUT') return;
    el.addEventListener('input', e => {
      const t = find(el.dataset.trip);
      if (!t) return;
      (t.dates = t.dates || {})[el.dataset.veh] = e.target.value;
      MYD.savePlan(plan);
      if (e.target.value && !MYD.dateInWindow(t, e.target.value)) {
        toast('วันนัดต้องอยู่ในช่วงที่เสนอ');
      }
      renderProcWizard(plan);
    });
  });

  $('btnAddTrip')?.addEventListener('click', () => {
    const t = MYD.emptyTrip('trip-' + Date.now().toString(36), `แผนเดินทาง ${trips.length + 1}`);
    trips.push(t);
    rerender();
  });

  // ทางลัด: หนึ่งจังหวัดหนึ่งใบ — เป็นแค่จุดตั้งต้น กบค. ยังแก้/แตกใบต่อได้
  $('btnAutoTrips')?.addEventListener('click', () => {
    const unassigned = MYD.unassignedVehicleIds(plan);
    const byRegion = {};
    master.vehicles.filter(v => unassigned.includes(v.id))
      .forEach(v => (byRegion[v.region] = byRegion[v.region] || []).push(v.id));
    Object.keys(byRegion).sort((a, b) => a - b).forEach(r => {
      const t = MYD.emptyTrip('trip-' + Date.now().toString(36) + '-' + r, MYD.provinceOfRegion(Number(r)));
      t.vehicleIds = byRegion[r];
      trips.push(t);
    });
    toast(`สร้าง ${Object.keys(byRegion).length} แผนตามจังหวัดแล้ว`);
    rerender();
  });

  document.querySelectorAll('[data-trip-add]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = find(btn.dataset.tripAdd);
      const sel = document.querySelector(`[data-trip-add-sel="${btn.dataset.tripAdd}"]`);
      if (!t || !sel || !sel.value) return;
      t.vehicleIds = [...new Set([...(t.vehicleIds || []), sel.value])];
      rerender();
    });
  });

  document.querySelectorAll('[data-trip-drop]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = find(btn.dataset.tripDrop);
      if (!t) return;
      t.vehicleIds = (t.vehicleIds || []).filter(id => id !== btn.dataset.veh);
      delete (t.dates || {})[btn.dataset.veh];
      rerender();
    });
  });

  document.querySelectorAll('[data-trip-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('ลบแผนเดินทางใบนี้? รถในใบจะกลับไปเป็นยังไม่ถูกจัด')) return;
      plan.trips = trips.filter(t => t.id !== btn.dataset.tripDel);
      rerender();
    });
  });

  document.querySelectorAll('[data-trip-send]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = find(btn.dataset.tripSend);
      if (!t || !MYD.tripReadyToSend(t)) { toast('กรอกสถานที่ ช่วงวัน และวันนัดให้ครบก่อน'); return; }
      t.sentAt = nowTh();
      t.replies = {};   // ส่งใหม่ = เริ่มนับการตอบรับใหม่ทั้งใบ
      MYD.tripDepts(t, master).forEach(d => {
        t.replies[d] = { status: 'pending', reason: '', by: '', at: '', history: [] };
      });
      toast('ส่งแผนนัดให้หน่วยงานแล้ว (สำเนาถึง กรย.)');
      rerender();
    });
  });
}

// ----- ขั้น 4: ทวน + ยืนยัน -----
function renderProcStep3(plan) {
  const master3 = MYD.loadMaster();
  const trips = MYD.ensureTrips(plan);
  const grand = trips.reduce((n, t) => n + (t.perDiem || 0) + (t.lodging || 0) + (t.travel || 0), 0);

  const outRows = (plan.selectedVehicleIds || [])
    .filter(id => !MYD.isVehicleIn(plan, id))
    .map(id => {
      const v = master3.vehicles.find(x => x.id === id);
      const e = MYD.vehicleConfirm(plan, id);
      return `<tr><td>${esc(v ? v.plate : id)}</td>
        <td>${esc(CF_VERDICT_LABELS[e.verdict] || 'ไม่พร้อม')}</td>
        <td>${esc(e.verdictWhy || e.reason || '—')}</td></tr>`;
    }).join('');

  const tripBlocks = trips.map(t => {
    const vs = tripVehicles(t, master3);
    const sum = (t.perDiem || 0) + (t.lodging || 0) + (t.travel || 0);
    const rows = vs.map(v => `<tr>
        <td>${esc(v.plate)}</td>
        <td>${esc(v.ownerDept)}</td>
        <td>${dateTh((t.dates || {})[v.id] || '')}</td>
      </tr>`).join('');
    return `
      <div class="rzone">
        <div class="rzone-head">
          <span class="ms rzone-caret">event_available</span>
          <b>${esc(t.name || 'แผนเดินทาง')}</b>
          <span class="rzone-count">${esc(t.location || '—')} · ${dateTh(t.windowFrom)}–${dateTh(t.windowTo)}
            · ${vs.length} คัน · ${sum.toLocaleString('th-TH')} บาท</span>
          <span class="badge b-ok">ตอบรับแล้ว</span>
        </div>
        <div class="rzone-body flush"><div class="tblwrap"><table class="tbl">
          <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th><th>วันนัด</th></tr></thead>
          <tbody>${rows}</tbody></table></div></div>
      </div>`;
  }).join('');

  return `
    <div class="sect">ขั้นที่ 4: ทวนแผนเดินทาง + ยืนยัน</div>
    <div class="sub">แผนเดินทาง <b>${trips.length}</b> ใบ · รวมค่าใช้จ่ายทั้งหมด <b>${grand.toLocaleString('th-TH')}</b> บาท</div>
    ${tripBlocks || `<div class="empty">ยังไม่มีแผนเดินทาง</div>`}
    ${outRows ? `
    <div class="sect">รถที่ไม่เข้าแผนเดินทางรอบนี้</div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>ทะเบียน</th><th>คำตัดสิน กบค.</th><th>เหตุผล</th></tr></thead>
      <tbody>${outRows}</tbody></table></div>` : ''}`;
}

function confirmTravelPlan(plan) {
  plan.travelConfirmed = true;
  MYD.savePlan(plan);
  toast('ยืนยันแผนเดินทางสำเร็จ');
  renderStepper(); // เฟส 2 กลายเป็น passed, เฟส 3 ปลดล็อก
  renderProcurement();
}

// ----- สรุปหลังยืนยัน (แทนที่ wizard เมื่อ travelConfirmed===true) -----
function renderProcurementConfirmed(plan) {
  const selectedVehicles = MYD.loadMaster().vehicles.filter(v => (plan.selectedVehicleIds || []).includes(v.id));
  const joiningCount = selectedVehicles.filter(v => MYD.isVehicleIn(plan, v.id)).length;
  const master = MYD.loadMaster();
  const trips = MYD.ensureTrips(plan);
  const grand = trips.reduce((n, t) => n + (t.perDiem || 0) + (t.lodging || 0) + (t.travel || 0), 0);

  const tripRows = trips.map(t => {
    const vs = tripVehicles(t, master);
    const sum = (t.perDiem || 0) + (t.lodging || 0) + (t.travel || 0);
    return `<tr>
      <td><b>${esc(t.name || 'แผนเดินทาง')}</b><div class="sub">${esc(t.location || '—')}</div></td>
      <td>${dateTh(t.windowFrom)} – ${dateTh(t.windowTo)}</td>
      <td class="num">${vs.length}</td>
      <td class="num">${sum.toLocaleString('th-TH')}</td>
      <td>${MYD.tripDepts(t, master).join(' · ')}</td>
    </tr>`;
  }).join('');

  $('phase').innerHTML = `
    <div class="card">
      <div class="sect">เบิก/จัดหา + แผนเดินทาง — ยืนยันแล้ว</div>
      <span class="badge b-ok" style="font-size:var(--fs-body);padding:6px 16px">แผนเดินทางยืนยันแล้ว</span>
      <div class="sub" style="margin-top:12px">แผนเดินทาง <b>${trips.length}</b> ใบ
        · รวมค่าใช้จ่าย <b>${grand.toLocaleString('th-TH')}</b> บาท · ทุกใบได้รับการตอบรับจากหน่วยงานแล้ว</div>
      ${trips.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>แผน / สถานที่</th><th>ช่วงที่นัด</th><th class="num">รถ</th>
          <th class="num">ค่าใช้จ่าย</th><th>หน่วยงานที่ตอบรับ</th></tr></thead>
        <tbody>${tripRows}</tbody></table></div>` : ''}
    </div>
    <div class="card">
      <div class="sect"><span class="ms">mail</span> ส่ง Noti แจ้งเจ้าของรถ ${joiningCount} คัน + กรย. วันที่เข้าตรวจ</div>
      <div class="sub">ระบบส่งการแจ้งเตือนอัตโนมัติแล้ว (mock)</div>
    </div>
    <div class="card">
      <div class="actions">
        <button class="btn btn-o" id="btnPeaLife">ทำใบนำจ่าย (PEA Life)</button>
        <button class="btn btn-p" id="btnGoNextPhaseProc">ไปเฟสถัดไป →</button>
      </div>
    </div>`;

  $('btnPeaLife').addEventListener('click', () => toast('สร้างใบนำจ่าย (PEA Life) สำเร็จ (mock)'));
  $('btnGoNextPhaseProc').addEventListener('click', () => goPhase('maintenance'));
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
