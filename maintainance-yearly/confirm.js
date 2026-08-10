// confirm.js — หน้าหน่วยงานเจ้าของรถ: ตอบคำขอยืนยันรถเข้าร่วมแผน
//
// routing: confirm.html                     -> รายการคำขอ (ทุกหน่วยงาน × ทุกแผนที่ส่งคำขอแล้ว)
//          confirm.html#<planId>/<deptIdx>  -> เปิดคำขอของหน่วยงานนั้น
// ต้นแบบไม่มี login — ของจริงจะกรองด้วยหน่วยงานของผู้ใช้
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้

// คำขอ = คู่ (แผน, หน่วยงาน) — 1 หน่วยงานอาจมีรถหลายคันในแผนเดียว
function buildRequests() {
  const master = MYD.loadMaster();
  const out = [];
  MYD.loadPlans().forEach(plan => {
    if (!plan.confirm || !plan.confirm.requestedAt) return;
    const vehicles = master.vehicles.filter(v => (plan.selectedVehicleIds || []).includes(v.id));
    const byDept = {};
    vehicles.forEach(v => { (byDept[v.ownerDept] = byDept[v.ownerDept] || []).push(v); });
    Object.keys(byDept).sort((a, b) => a.localeCompare(b, 'th')).forEach((dept, i) => {
      out.push({ plan, dept, deptIdx: i, vehicles: byDept[dept] });
    });
  });
  return out;
}

function render() {
  const hash = (location.hash || '').replace('#', '');
  if (!hash) { renderList(); return; }
  const [planId, idx] = hash.split('/');
  const req = buildRequests().find(r => r.plan.id === planId && String(r.deptIdx) === idx);
  if (!req) { location.hash = ''; renderList(); return; }
  renderRequest(req);
}

function renderList() {
  const reqs = buildRequests();
  const rows = reqs.map(r => {
    const answered = r.vehicles.filter(v => MYD.vehicleConfirm(r.plan, v.id).answer !== 'pending').length;
    const locked = MYD.confirmLocked(r.plan);
    return `<tr>
      <td><b style="color:var(--gray-900)">${esc(r.dept)}</b>
        <div class="sub">${esc(r.plan.workNumber)} · ${esc(r.plan.planName || '—')}</div></td>
      <td class="num">${r.vehicles.length}</td>
      <td class="num">${answered}</td>
      <td>${dateTh(r.plan.confirm.dueAt)}</td>
      <td>${locked ? `<span class="badge b-brand">ปิดรับคำตอบ</span>`
            : answered === r.vehicles.length ? `<span class="badge b-ok">ตอบครบแล้ว</span>`
            : `<span class="badge b-low">รอตอบ ${r.vehicles.length - answered}</span>`}</td>
      <td class="num"><a class="btn btn-s btn-sm" href="#${esc(r.plan.id)}/${r.deptIdx}">เปิดคำขอ</a></td>
    </tr>`;
  }).join('');

  $('crumbs').innerHTML = `<span class="ms">fact_check</span><span class="cur">รายการคำขอ</span>`;
  $('cfBody').innerHTML = `
    <div class="card">
      <div class="sect">คำขอยืนยันรถเข้าร่วมแผน จาก กบค.</div>
      <div class="sub">แต่ละแถวคือคำขอของหน่วยงานหนึ่งในแผนหนึ่ง — ตอบว่ารถแต่ละคันเข้าบำรุงรักษาได้ไหม</div>
      ${reqs.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>หน่วยงาน / แผน</th><th class="num">รถ (คัน)</th><th class="num">ตอบแล้ว</th>
          <th>กำหนดตอบ</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">ยังไม่มีคำขอ — รอ กบค. กด "ส่งคำขอยืนยัน" ในเฟส 1 ของแผน</div>`}
    </div>`;
}

// ----- เปิดคำขอรายใบ: รถของหน่วยงานนี้ในแผนนี้ -----
function renderRequest(req) {
  const { plan, dept, vehicles } = req;
  const locked = MYD.confirmLocked(plan);
  const today = todayIso();

  const rows = vehicles.map(v => {
    const e = MYD.vehicleConfirm(plan, v.id);
    const dis = locked ? 'disabled' : '';
    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="sub">${esc(v.brand)}</div></td>
      <td>${esc(MYD.STATUS_LABELS[v.status] || v.status)}</td>
      <td>
        <label><input type="radio" name="ans-${esc(v.id)}" value="ready"
          ${e.answer === 'ready' ? 'checked' : ''} ${dis}> พร้อม</label>
        <label><input type="radio" name="ans-${esc(v.id)}" value="notready"
          ${e.answer === 'notready' ? 'checked' : ''} ${dis}> ไม่พร้อม</label>
      </td>
      <td><input type="text" id="rsn-${esc(v.id)}" value="${esc(e.reason)}"
        placeholder="ระบุเมื่อไม่พร้อม" ${dis}></td>
      <td><input type="text" id="mp-${esc(v.id)}" value="${esc(e.meetPoint)}"
        placeholder="จุดนัดรับที่สะดวก" ${dis}></td>
      <td>${e.at ? esc(e.at) : '—'}
        ${e.history.length ? `<div class="sub">แก้ ${e.history.length} ครั้ง</div>` : ''}</td>
    </tr>`;
  }).join('');

  $('crumbs').innerHTML = `<a href="confirm.html" style="color:inherit;text-decoration:none">
      <span class="ms">fact_check</span> รายการคำขอ</a>
    <span class="sep">›</span><span class="cur">${esc(dept)}</span>`;
  $('cfBody').innerHTML = `
    <div class="card">
      <div class="sect">${esc(plan.workNumber)} — ${esc(plan.planName || '—')}</div>
      <div class="sub">หน่วยงานผู้ขอ: กบค. · ส่งคำขอ ${dateTh(plan.confirm.requestedAt)}
        · กำหนดตอบ ${dateTh(plan.confirm.dueAt)}
        ${today > plan.confirm.dueAt && !locked ? ' · <b>เลยกำหนดแล้ว</b>' : ''}</div>
    </div>
    ${locked ? `<div class="empty">แผนเดินทางถูกยืนยันแล้ว — ปิดรับการแก้คำตอบ
        หากมีการเปลี่ยนแปลงกรุณาติดต่อ กบค. โดยตรง</div>` : ''}
    <div class="card">
      <div class="sect">รถของ ${esc(dept)} ในแผนนี้</div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th>ทะเบียน</th><th>สถานะรถ</th><th>คำตอบ</th>
          <th>เหตุผลถ้าไม่พร้อม</th><th>จุดนัดรับ</th><th>ตอบเมื่อ</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      ${locked ? '' : `
        <div class="sect">ผู้ตอบ</div>
        <div class="sub">ยังไม่ได้เคาะว่าใครในหน่วยงานเป็นผู้มีสิทธิ์กด — ต้นแบบให้พิมพ์ชื่อไปก่อน</div>
        <input type="text" id="cfBy" placeholder="ชื่อผู้ตอบ">
        <button class="btn btn-o" id="btnAnswer"><span class="ms">send</span> ส่งคำตอบ</button>`}`;

  if (!locked) bindRequest(req);
}

// ----- บันทึกคำตอบ + ประวัติการแก้ -----
function bindRequest(req) {
  const { plan, vehicles } = req;
  $('btnAnswer').addEventListener('click', () => {
    const by = ($('cfBy').value || '').trim();
    if (!by) { toast('กรุณากรอกชื่อผู้ตอบ'); return; }

    const c = MYD.ensureConfirm(plan);
    let changed = 0, missing = 0;
    vehicles.forEach(v => {
      const picked = document.querySelector(`input[name="ans-${v.id}"]:checked`);
      if (!picked) { missing++; return; }
      const e = c.byVehicle[v.id] || (c.byVehicle[v.id] = MYD.emptyConfirmEntry());
      const reason = ($(`rsn-${v.id}`).value || '').trim();
      if (picked.value === 'notready' && !reason) { missing++; return; }
      if (e.answer !== picked.value || e.reason !== reason) {
        // เก็บประวัติเฉพาะการ "เปลี่ยนคำตอบที่เคยตอบไปแล้ว"
        if (e.answer !== 'pending') {
          e.history.push({ at: nowTh(), by, from: e.answer, to: picked.value, reason: e.reason });
        }
        changed++;
      }
      e.answer = picked.value;
      e.reason = picked.value === 'notready' ? reason : '';
      e.meetPoint = ($(`mp-${v.id}`).value || '').trim();
      e.by = by;
      e.at = nowTh();
    });

    if (missing) { toast(`ยังตอบไม่ครบ ${missing} คัน (ไม่พร้อมต้องระบุเหตุผล)`); return; }
    MYD.savePlan(plan);
    toast(changed ? 'ส่งคำตอบแล้ว' : 'ไม่มีการเปลี่ยนแปลง');
    render();
  });
}

// ================= INIT =================
window.addEventListener('hashchange', render);
render();
