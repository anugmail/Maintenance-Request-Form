// app.js — รายการแผน + หน้าแผนรายใบ (stepper 5 เฟสปฏิบัติการ)
//
// ⚠️ โครงเปลี่ยน 8 ส.ค. 2569
//   - "ออกเลขงาน" แยกไป plan-new.html แล้ว ไม่อยู่ใน stepper นี้
//   - ระบบเก็บ "หลายแผน" (MYD.loadPlans()) แผนหนึ่ง = ประจำปีหนึ่งใบของ กบค.
//   - เลขงาน (MT-ปี-ไทรมาส-NNN) คือหัวข้อของแผน · stepper เป็นของ "แต่ละแผน"
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

const state = { sub: 1 };
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
    return `<tr>
      <td>
        <b style="color:var(--gray-900)">${esc(planTitle(p))}</b>
        ${issued ? '' : '<span class="badge b-low" style="margin-left:6px">ฉบับร่าง</span>'}
        <div style="font-size:12px;color:var(--gray-500)">${issued && p.planName ? esc(p.planName) + ' · ' : ''}${p.createdAt ? 'สร้าง ' + esc(p.createdAt) : ''}</div>
      </td>
      <td class="num">${n}</td>
      <td>${issued ? quarterYearText(p) : '—'}</td>
      <td>${issued
            ? (ack ? '<span class="badge b-ok">พัสดุรับทราบแล้ว</span>' : '<span class="badge b-low">รอพัสดุรับทราบ</span>')
            : '<span class="badge b-out">ยังไม่ออกเลขงาน</span>'}</td>
      <td>${issued ? planProgressText(p) : '—'}</td>
      <td class="num" style="white-space:nowrap">
        ${issued
          ? `<a class="btn btn-s btn-sm" href="#${esc(p.id)}">เปิดแผน</a>`
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
        <thead><tr><th>เลขงาน / ชื่อแผน</th><th class="num">รถ (คัน)</th><th>ไทรมาส/ปี</th><th>สถานะเอกสาร</th><th>ความคืบหน้า</th><th></th></tr></thead>
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
  { no: 1, label: 'เบิกอะไหล่' },
  { no: 2, label: 'ยืนยันรถเข้าร่วมแผน' },
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
function goProcSub(n) {
  if (n < 1 || n > PROC_STEPS.length) return;
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
  if (sub === 1) return !!plan.partsRequisitioned;
  if (sub === 2) return MYD.confirmResolved(plan, plan.selectedVehicleIds || []);
  if (sub === 3) {
    const tp = plan.travelPlan;
    return !!(tp && tp.location && tp.location.trim() && tp.dateFrom && tp.dateTo);
  }
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
  if (state.sub === 1) return renderProcStep1(plan);
  if (state.sub === 2) return renderProcStepConfirm(plan);
  if (state.sub === 3) return renderProcStep2(plan);
  return renderProcStep3(plan);
}

function bindProcSubBody(plan) {
  if (state.sub === 1) bindProcStep1(plan);
  else if (state.sub === 2) bindProcStepConfirm(plan);
  else if (state.sub === 3) bindProcStep2(plan);
  // ขั้น 4 อ่านอย่างเดียว ไม่มี event ผูก (ปุ่มยืนยันอยู่ที่ actions footer)
}

// ----- ขั้น 1: เบิกอะไหล่ -----
function renderProcStep1(plan) {
  const master = MYD.loadMaster();
  const selectedVehicles = master.vehicles.filter(v => (plan.selectedVehicleIds || []).includes(v.id));
  const lines = MYD.deriveItems(selectedVehicles, master.items);

  const groups = ['part', 'oil', 'filter'].map(cat => {
    const catLines = lines.filter(l => l.item.category === cat);
    if (!catLines.length) return '';
    const rows = catLines.map(l => `
      <tr>
        <td>${esc(l.item.name)}<div style="font-size:12px;color:var(--gray-500)">${esc(MYD.triggerText(l.item))}</div></td>
        <td class="num">${esc(l.item.qtyPerVehicle)}</td>
        <td class="num">${esc(l.vehicleCount)}</td>
        <td class="num">${esc(l.totalQty)}</td>
        <td>${esc(l.item.unit)}</td>
      </tr>`).join('');
    return `
      <div class="sect">${esc(MYD.CATEGORY_LABELS[cat])}</div>
      <div class="tblwrap">
        <table class="tbl itbl">
          <thead><tr><th>ชื่อ</th><th>ต่อคัน</th><th>จำนวนรถ</th><th>รวม</th><th>หน่วย</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join('');

  return `
    <div class="sect">ขั้นที่ 1: เบิกอะไหล่ (สรุปรายการจากแผน)</div>
    <div class="sub">รถที่เข้าแผน ${selectedVehicles.length} คัน — รายการนี้คำนวณอัตโนมัติจากรถที่เลือกไว้ในเฟส 1</div>
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

// ----- ขั้น 2: ยืนยันรถเข้าร่วมแผน -----
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
      <div class="sect">ขั้นที่ 2: ยืนยันรถเข้าร่วมแผน</div>
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
  const rows = vehicles.map(v => {
    const e = MYD.vehicleConfirm(plan, v.id);
    const st = MYD.confirmStatus(plan, v.id, today);
    const b = CF_STATUS_BADGE[st];
    const needsVerdict = (st === 'notready' || st === 'overdue') && e.verdict === null;
    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="sub">${esc(v.brand)}</div></td>
      <td>${esc(v.ownerDept)}<div class="sub">เขต ${esc(v.region)}</div></td>
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
  }).join('');

  const left = ids.filter(id => {
    const e = MYD.vehicleConfirm(plan, id);
    return !(e.answer === 'ready' || e.verdict !== null);
  }).length;

  return `
    <div class="sect">ขั้นที่ 2: ยืนยันรถเข้าร่วมแผน</div>
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
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th><th>คำตอบ</th>
        <th>จุดนัดรับ</th><th>ตอบเมื่อ</th><th>คำตัดสิน กบค.</th><th>ผล</th></tr></thead>
      <tbody>${rows}</tbody></table></div>
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
function ensureTravelPlan(plan) {
  if (!plan.travelPlan) {
    plan.travelPlan = { location: '', dateFrom: '', dateTo: '', perDiem: 0, lodging: 0, travel: 0 };
  }
  return plan.travelPlan;
}

function renderProcStep2(plan) {
  const tp = plan.travelPlan || {};
  const master = MYD.loadMaster();
  const joining = (plan.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(plan, id));
  const plates = master.vehicles.filter(v => joining.includes(v.id)).map(v => v.plate);
  const dropped = (plan.selectedVehicleIds || []).length - joining.length;
  return `
    <div class="sect">ขั้นที่ 3: ทำแผนเดินทาง</div>
    <div class="sub">คิดจากรถที่ยืนยันแล้ว <b>${joining.length}</b> คัน
      ${dropped ? `(ตัด/เลื่อน ${dropped} คันจากขั้นยืนยันรถ)` : ''}
      — เบี้ยเลี้ยง/ที่พัก/ค่าเดินทางให้กรอกตามจำนวนนี้</div>
    <div class="sub">${esc(plates.join(' · '))}</div>
    <div class="fgrid">
      <div class="f sp4">
        <label>สถานที่บำรุงรักษา</label>
        <div class="in"><span class="ms">place</span>
          <input type="text" id="fLocation" placeholder="เช่น คลังพัสดุ กฟก.3 นครสวรรค์" value="${esc(tp.location || '')}">
        </div>
      </div>
      <div class="f sp2">
        <label>จากวันที่</label>
        <div class="in noic"><input type="date" id="fDateFrom" value="${esc(tp.dateFrom || '')}"></div>
      </div>
      <div class="f sp2">
        <label>ถึงวันที่</label>
        <div class="in noic"><input type="date" id="fDateTo" value="${esc(tp.dateTo || '')}"></div>
      </div>
      <div class="f">
        <label>ค่าเบี้ยเลี้ยง (บาท)</label>
        <div class="in noic"><input type="number" min="0" id="fPerDiem" value="${esc(tp.perDiem ?? 0)}"></div>
      </div>
      <div class="f">
        <label>ค่าที่พัก (บาท)</label>
        <div class="in noic"><input type="number" min="0" id="fLodging" value="${esc(tp.lodging ?? 0)}"></div>
      </div>
      <div class="f">
        <label>ค่าเดินทาง (บาท)</label>
        <div class="in noic"><input type="number" min="0" id="fTravel" value="${esc(tp.travel ?? 0)}"></div>
      </div>
    </div>`;
}

function bindProcStep2(plan) {
  const tp = ensureTravelPlan(plan);

  $('fLocation').addEventListener('input', e => {
    tp.location = e.target.value;
    MYD.savePlan(plan);
    updateProcPrimaryEnabled(plan);
  });
  $('fDateFrom').addEventListener('input', e => {
    tp.dateFrom = e.target.value;
    MYD.savePlan(plan);
    updateProcPrimaryEnabled(plan);
  });
  $('fDateTo').addEventListener('input', e => {
    tp.dateTo = e.target.value;
    MYD.savePlan(plan);
    updateProcPrimaryEnabled(plan);
  });
  $('fPerDiem').addEventListener('input', e => {
    tp.perDiem = Number(e.target.value) || 0;
    MYD.savePlan(plan);
  });
  $('fLodging').addEventListener('input', e => {
    tp.lodging = Number(e.target.value) || 0;
    MYD.savePlan(plan);
  });
  $('fTravel').addEventListener('input', e => {
    tp.travel = Number(e.target.value) || 0;
    MYD.savePlan(plan);
  });
}

// ----- ขั้น 4: ทวน + ยืนยัน -----
function renderProcStep3(plan) {
  const tp = plan.travelPlan || {};
  const total = (tp.perDiem || 0) + (tp.lodging || 0) + (tp.travel || 0);
  const master3 = MYD.loadMaster();
  const outRows = (plan.selectedVehicleIds || [])
    .filter(id => !MYD.isVehicleIn(plan, id))
    .map(id => {
      const v = master3.vehicles.find(x => x.id === id);
      const e = MYD.vehicleConfirm(plan, id);
      return `<tr><td>${esc(v ? v.plate : id)}</td>
        <td>${esc(CF_VERDICT_LABELS[e.verdict] || 'ไม่พร้อม')}</td>
        <td>${esc(e.verdictWhy || e.reason || '—')}</td></tr>`;
    }).join('');

  return `
    <div class="sect">ขั้นที่ 4: ทวนแผนเดินทาง + ยืนยัน</div>
    ${outRows ? `
    <div class="sect">รถที่ไม่เข้าทริปนี้</div>
    <div class="tblwrap"><table class="tbl">
      <thead><tr><th>ทะเบียน</th><th>คำตัดสิน กบค.</th><th>เหตุผล</th></tr></thead>
      <tbody>${outRows}</tbody></table></div>` : ''}
    <div class="fgrid">
      <div class="f sp4"><label>สถานที่บำรุงรักษา</label><div>${esc(tp.location || '-')}</div></div>
      <div class="f sp2"><label>จากวันที่</label><div>${esc(tp.dateFrom || '-')}</div></div>
      <div class="f sp2"><label>ถึงวันที่</label><div>${esc(tp.dateTo || '-')}</div></div>
      <div class="f"><label>ค่าเบี้ยเลี้ยง</label><div>${esc(tp.perDiem || 0)} บาท</div></div>
      <div class="f"><label>ค่าที่พัก</label><div>${esc(tp.lodging || 0)} บาท</div></div>
      <div class="f"><label>ค่าเดินทาง</label><div>${esc(tp.travel || 0)} บาท</div></div>
      <div class="f sp4"><label>รวมค่าใช้จ่าย</label><div><b>${esc(total)} บาท</b></div></div>
    </div>`;
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
  const tp = plan.travelPlan || {};
  const total = (tp.perDiem || 0) + (tp.lodging || 0) + (tp.travel || 0);

  $('phase').innerHTML = `
    <div class="card">
      <div class="sect">เบิก/จัดหา + แผนเดินทาง — ยืนยันแล้ว</div>
      <span class="badge b-ok" style="font-size:15px;padding:6px 16px">แผนเดินทางยืนยันแล้ว</span>
      <div class="fgrid" style="margin-top:16px">
        <div class="f sp4"><label>สถานที่บำรุงรักษา</label><div>${esc(tp.location || '-')}</div></div>
        <div class="f sp2"><label>จากวันที่</label><div>${dateTh(tp.dateFrom)}</div></div>
        <div class="f sp2"><label>ถึงวันที่</label><div>${dateTh(tp.dateTo)}</div></div>
        <div class="f"><label>ค่าเบี้ยเลี้ยง</label><div>${(tp.perDiem || 0).toLocaleString('th-TH')} บาท</div></div>
        <div class="f"><label>ค่าที่พัก</label><div>${(tp.lodging || 0).toLocaleString('th-TH')} บาท</div></div>
        <div class="f"><label>ค่าเดินทาง</label><div>${(tp.travel || 0).toLocaleString('th-TH')} บาท</div></div>
        <div class="f sp4"><label>รวมค่าใช้จ่าย</label><div><b>${total.toLocaleString('th-TH')} บาท</b></div></div>
      </div>
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
