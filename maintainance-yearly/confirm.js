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

// แผนนัดหมายที่ส่งมาแล้ว = คู่ (แผน, ใบเดินทาง, หน่วยงาน) — หน่วยงานตอบเฉพาะรถของตัวเอง
function buildTripInvites() {
  const master = MYD.loadMaster();
  const out = [];
  MYD.loadPlans().forEach(plan => {
    MYD.ensureTrips(plan).forEach(trip => {
      if (!trip.sentAt) return;
      MYD.tripDepts(trip, master).forEach(dept => {
        const vehicles = master.vehicles.filter(v =>
          (trip.vehicleIds || []).includes(v.id) && v.ownerDept === dept);
        out.push({ plan, trip, dept, vehicles });
      });
    });
  });
  return out;
}

function render() {
  const hash = (location.hash || '').replace('#', '');
  if (!hash) { renderList(); return; }

  if (hash.startsWith('trip/')) {
    const [, planId, tripId, dept] = hash.split('/');
    const inv = buildTripInvites().find(i =>
      i.plan.id === planId && i.trip.id === tripId && encodeURIComponent(i.dept) === dept);
    if (!inv) { location.hash = ''; renderList(); return; }
    renderTripInvite(inv);
    return;
  }

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
    </div>
    ${renderInviteListCard()}`;
}

// การ์ดที่ 2: แผนนัดหมายที่ต้องตอบรับ (คนละเรื่องกับการยืนยันรถ)
function renderInviteListCard() {
  const invites = buildTripInvites();
  const rows = invites.map(i => {
    const r = MYD.tripReply(i.trip, i.dept);
    const b = r.status === 'accepted' ? 'b-ok' : r.status === 'rejected' ? 'b-brand' : 'b-low';
    const t = r.status === 'accepted' ? 'ตอบรับแล้ว' : r.status === 'rejected' ? 'ปฏิเสธแล้ว' : 'รอตอบรับ';
    return `<tr>
      <td><b style="color:var(--gray-900)">${esc(i.dept)}</b>
        <div class="sub">${esc(i.plan.workNumber)} · ${esc(i.trip.name || 'แผนเดินทาง')}</div></td>
      <td>${esc(i.trip.location || '—')}</td>
      <td>${dateTh(i.trip.windowFrom)} – ${dateTh(i.trip.windowTo)}</td>
      <td class="num">${i.vehicles.length}</td>
      <td><span class="badge ${b}">${t}</span></td>
      <td class="num"><a class="btn btn-s btn-sm"
        href="#trip/${esc(i.plan.id)}/${esc(i.trip.id)}/${encodeURIComponent(i.dept)}">เปิดแผนนัด</a></td>
    </tr>`;
  }).join('');

  return `
    <div class="card">
      <div class="sect">แผนนัดหมายเข้าบำรุงรักษา จาก กบค.</div>
      <div class="sub">กบค. เสนอเป็น<b>ช่วงเวลา</b> — เลือกวันนัดของรถแต่ละคันได้ภายในช่วงนั้นเท่านั้น
        หรือปฏิเสธพร้อมเหตุผล · เอกสารชุดเดียวกันส่งสำเนาถึง กรย. ด้วย</div>
      ${invites.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>หน่วยงาน / แผนเดินทาง</th><th>สถานที่</th><th>ช่วงที่เสนอ</th>
          <th class="num">รถ (คัน)</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">ยังไม่มีแผนนัด — รอ กบค. ส่งแผนเดินทางมาในขั้นที่ 3</div>`}
    </div>`;
}

function renderTripInvite(inv) {
  const { plan, trip, dept, vehicles } = inv;
  const r = MYD.tripReply(trip, dept);
  const done = r.status !== 'pending';

  const rows = vehicles.map(v => {
    const d = (trip.dates || {})[v.id] || '';
    return `<tr>
      <td><b>${esc(v.plate)}</b><div class="sub">${esc(v.brand)}</div></td>
      <td>${esc(MYD.STATUS_LABELS[v.status] || v.status)}</td>
      <td><div class="in noic"><input type="date" id="td-${esc(v.id)}" value="${esc(d)}"
        min="${esc(trip.windowFrom || '')}" max="${esc(trip.windowTo || '')}" ${done ? 'disabled' : ''}></div></td>
    </tr>`;
  }).join('');

  $('crumbs').innerHTML = `<a href="confirm.html" style="color:inherit;text-decoration:none">
      <span class="ms">fact_check</span> รายการคำขอ</a>
    <span class="sep">›</span><span class="cur">แผนนัด — ${esc(dept)}</span>`;

  $('cfBody').innerHTML = `
    <div class="card">
      <div class="sect">${esc(plan.workNumber)} — ${esc(trip.name || 'แผนเดินทาง')}</div>
      <div class="sub">หน่วยงานผู้ขอ: กบค. · ส่งเมื่อ ${esc(trip.sentAt || '—')}</div>
      <div class="fgrid" style="margin-top:12px">
        <div class="f sp2"><label>สถานที่บำรุงรักษา</label><div>${esc(trip.location || '—')}</div></div>
        <div class="f sp2"><label>ช่วงเวลาที่ กบค. เสนอ</label>
          <div><b>${dateTh(trip.windowFrom)} – ${dateTh(trip.windowTo)}</b></div></div>
      </div>
    </div>
    ${done ? `<div class="empty">${r.status === 'accepted'
        ? `ตอบรับแล้วเมื่อ ${esc(r.at)} โดย ${esc(r.by)}`
        : `ปฏิเสธแล้วเมื่อ ${esc(r.at)} โดย ${esc(r.by)} — เหตุผล: ${esc(r.reason)}`}
        · รอ กบค. ดำเนินการต่อ</div>` : ''}
    <div class="card">
      <div class="sect">รถของ ${esc(dept)} ในแผนนัดนี้</div>
      <div class="sub">เลือกวันได้เฉพาะภายในช่วงที่เสนอ — ถ้าไม่สะดวกทั้งช่วง ให้ปฏิเสธพร้อมเหตุผล</div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th>ทะเบียน</th><th>สถานะรถ</th><th>วันนัด</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
      ${done ? '' : `
        <div class="fgrid">
          <div class="f sp2"><label>ผู้ตอบ</label>
            <div class="in"><span class="ms">person</span>
              <input type="text" id="tripBy" placeholder="ชื่อผู้ตอบ"></div></div>
          <div class="f sp2"><label>เหตุผล <small>กรอกเมื่อปฏิเสธ</small></label>
            <div class="in"><span class="ms">edit_note</span>
              <input type="text" id="tripReason" placeholder="เช่น ติดงานทั้งช่วง"></div></div>
        </div>
        <div class="actions">
          <button class="btn btn-g" id="btnTripReject"><span class="ms">close</span> ปฏิเสธ</button>
          <button class="btn btn-p" id="btnTripAccept"><span class="ms">check</span> ตอบรับแผนนัด</button>
        </div>`}
    </div>`;

  if (!done) bindTripInvite(inv);
}

function bindTripInvite(inv) {
  const { plan, trip, dept, vehicles } = inv;

  const reply = (status) => {
    const by = ($('tripBy').value || '').trim();
    if (!by) { toast('กรุณากรอกชื่อผู้ตอบ'); return; }
    const reason = ($('tripReason').value || '').trim();
    if (status === 'rejected' && !reason) { toast('ปฏิเสธต้องระบุเหตุผล'); return; }

    if (status === 'accepted') {
      // วันที่ทุกคันต้องอยู่ในช่วงที่ กบค. เสนอ — นอกช่วงเสนอไม่ได้ตามกติกาที่เคาะไว้
      for (const v of vehicles) {
        const d = ($(`td-${v.id}`).value || '').trim();
        if (!d) { toast(`ยังไม่ได้เลือกวันนัดของ ${v.plate}`); return; }
        if (!MYD.dateInWindow(trip, d)) { toast(`วันนัดของ ${v.plate} อยู่นอกช่วงที่เสนอ`); return; }
      }
      vehicles.forEach(v => { (trip.dates = trip.dates || {})[v.id] = $(`td-${v.id}`).value; });
    }

    const prev = MYD.tripReply(trip, dept);
    trip.replies = trip.replies || {};
    trip.replies[dept] = {
      status, reason: status === 'rejected' ? reason : '',
      by, at: nowTh(),
      history: [...(prev.history || []), { at: nowTh(), by, from: prev.status, to: status, reason }],
    };
    MYD.savePlan(plan);
    toast(status === 'accepted' ? 'ตอบรับแผนนัดแล้ว' : 'ปฏิเสธแผนนัดแล้ว — แจ้ง กบค. ให้เสนอช่วงใหม่');
    render();
  };

  $('btnTripAccept').addEventListener('click', () => reply('accepted'));
  $('btnTripReject').addEventListener('click', () => reply('rejected'));
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
renderTimeSim();
render();
