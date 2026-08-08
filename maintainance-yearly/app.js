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
// sub-stepper 3 ขั้น (ใช้ state.sub ร่วมกับเฟส 1 — goPhase() รีเซ็ตเป็น 1
// ทุกครั้งที่เปลี่ยนเฟส) เขียน/อ่านผ่าน PLAN/MYD.savePlan() เช่นกัน
// เข้าเฟส 2 ครั้งใด ถ้า travelConfirmed แล้ว ข้าม wizard ไปแสดงสรุปยืนยันเลย

const PROC_STEPS = [
  { no: 1, label: 'เบิกอะไหล่' },
  { no: 2, label: 'แผนเดินทาง' },
  { no: 3, label: 'ทวน + ยืนยัน' },
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
  if (n < 1 || n > 3) return;
  state.sub = n;
  renderPhaseBody();
  window.scrollTo({ top: 0 });
}

function nextProcSub() {
  const plan = PLAN;
  if (!validateProcSub(plan, state.sub)) return;
  if (state.sub >= 3) return;
  goProcSub(state.sub + 1);
}

function backProcSub() {
  if (state.sub <= 1) return;
  goProcSub(state.sub - 1);
}

function validateProcSub(plan, sub) {
  if (sub === 1) return !!plan.partsRequisitioned;
  if (sub === 2) {
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
  const primaryLabel = state.sub === 3 ? 'ยืนยันแผนเดินทาง' : 'ถัดไป';
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
    if (state.sub === 3) confirmTravelPlan(plan);
    else nextProcSub();
  });
}

function renderProcSubBody(plan) {
  if (state.sub === 1) return renderProcStep1(plan);
  if (state.sub === 2) return renderProcStep2(plan);
  return renderProcStep3(plan);
}

function bindProcSubBody(plan) {
  if (state.sub === 1) bindProcStep1(plan);
  else if (state.sub === 2) bindProcStep2(plan);
  // ขั้น 3 อ่านอย่างเดียว ไม่มี event ผูก (ปุ่มยืนยันอยู่ที่ actions footer)
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

// ----- ขั้น 2: ทำแผนเดินทาง -----
function ensureTravelPlan(plan) {
  if (!plan.travelPlan) {
    plan.travelPlan = { location: '', dateFrom: '', dateTo: '', perDiem: 0, lodging: 0, travel: 0 };
  }
  return plan.travelPlan;
}

function renderProcStep2(plan) {
  const tp = plan.travelPlan || {};
  return `
    <div class="sect">ขั้นที่ 2: ทำแผนเดินทาง</div>
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

// ----- ขั้น 3: ทวน + ยืนยัน -----
function renderProcStep3(plan) {
  const tp = plan.travelPlan || {};
  const total = (tp.perDiem || 0) + (tp.lodging || 0) + (tp.travel || 0);

  return `
    <div class="sect">ขั้นที่ 3: ทวนแผนเดินทาง + ยืนยัน</div>
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
      <div class="sect">📨 ส่ง Noti แจ้งเจ้าของรถ ${selectedVehicles.length} คัน + กรย. วันที่เข้าตรวจ</div>
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
