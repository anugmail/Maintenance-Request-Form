// supplies.js — ฝ่ายพัสดุ (Supplies Dept) page logic: reads the single
// mock plan (MYD.loadPlan()) and drives the cross-unit approval workflow —
// approvalStatus: 'pending' (ส่งมาจาก กบก.) -> 'approved' (ออกเลขงาน) |
// 'rejected' (ตีกลับ พร้อมเหตุผล). Writes back via MYD.savePlan() so
// index.html (กบก.) sees the result immediately on next render/reload.

const QUARTER_MONTHS = { Q1: 'ต.ค.–ธ.ค.', Q2: 'ม.ค.–มี.ค.', Q3: 'เม.ย.–มิ.ย.', Q4: 'ก.ค.–ก.ย.' };

const STATUS_HISTORY_LABELS = { draft: 'ฉบับร่าง', pending: 'รออนุมัติ', approved: 'อนุมัติ/ออกเลขงาน', rejected: 'ตีกลับ' };

// ================= HELPERS =================
const $ = id => document.getElementById(id);

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

function toast(m) {
  const t = $('toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(t._x);
  t._x = setTimeout(() => t.classList.remove('show'), 2600);
}

// เวลาปัจจุบันแบบไทย ใช้สร้าง statusHistory entry (Date() อยู่ฝั่ง browser
// เท่านั้น — ห้ามเรียกใน mock-yearly.js เพื่อให้ logic ที่นั่น pure/testable)
function nowTh() {
  return new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
}

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

// ----- สรุปแผน (ชื่อ/จำนวนรถ/ไทรมาส-ปี/สรุปอะไหล่รวม) -----
function planSummary(plan) {
  const master = MYD.loadMaster();
  const selectedVehicles = master.vehicles.filter(v => (plan.selectedVehicleIds || []).includes(v.id));
  const lines = MYD.deriveItems(selectedVehicles, master.items);
  const catSummary = ['part', 'oil', 'filter']
    .map(cat => {
      const catLines = lines.filter(l => l.item.category === cat);
      return catLines.length ? `${esc(MYD.CATEGORY_LABELS[cat])} ${catLines.length} รายการ` : null;
    })
    .filter(Boolean)
    .join(' · ');
  return { selectedVehicles, catSummary };
}

function quarterYearText(plan) {
  const months = QUARTER_MONTHS[plan.quarter];
  return `${esc(plan.quarter)}${months ? ' (' + esc(months) + ')' : ''} / ${esc(plan.year)}`;
}

// ================= RENDER (dispatch by approvalStatus) =================
function render() {
  const plan = MYD.loadPlan();
  if (plan.approvalStatus === 'pending') {
    renderPending(plan);
  } else if (plan.approvalStatus === 'approved') {
    renderApproved(plan);
  } else if (plan.approvalStatus === 'rejected') {
    renderRejected(plan);
  } else {
    renderEmpty();
  }
}

function renderEmpty() {
  $('supBody').innerHTML = `
    <div class="card">
      <div class="empty">ยังไม่มีแผนส่งเข้ามา — รอ กบก. ส่งขออนุมัติ</div>
    </div>`;
}

// ----- pending: คิวรออนุมัติ + ปุ่มออกเลขงาน/ตีกลับ -----
function renderPending(plan) {
  const { selectedVehicles, catSummary } = planSummary(plan);

  $('supBody').innerHTML = `
    <div class="sect">คิวรออนุมัติ (1)</div>
    <div class="card">
      <div class="sect">${esc(plan.planName || '(ไม่มีชื่อแผน)')}</div>
      <span class="badge b-low">⏳ รอฝ่ายพัสดุอนุมัติ</span>
      <div class="fgrid" style="margin-top:16px">
        <div class="f sp2"><label>ชื่อแผน</label><div>${esc(plan.planName)}</div></div>
        <div class="f sp2"><label>จำนวนรถ</label><div>${selectedVehicles.length} คัน</div></div>
        <div class="f sp2"><label>ไทรมาส/ปี</label><div>${quarterYearText(plan)}</div></div>
        <div class="f sp4"><label>สรุปอะไหล่รวม</label><div>${catSummary || 'ไม่มีรายการ'}</div></div>
      </div>
      ${renderTimelineHtml(plan.statusHistory)}
      <div class="actions">
        <button class="btn btn-o" id="btnReject">ตีกลับ</button>
        <button class="btn btn-p" id="btnApprove">ออกเลขงาน (อนุมัติ)</button>
      </div>
    </div>`;

  $('btnApprove').addEventListener('click', () => approvePlan(plan));
  $('btnReject').addEventListener('click', () => openRejectModal(plan));
}

function approvePlan(plan) {
  if (!confirm('ยืนยันออกเลขงาน (อนุมัติแผนนี้)?')) return;
  plan.workNumber = MYD.workNumber(plan.quarter, plan.year, 1);
  plan.approvalStatus = 'approved';
  plan.statusHistory = [...(plan.statusHistory || []), {
    status: 'approved', at: nowTh(), note: 'ฝ่ายพัสดุออกเลขงาน ' + plan.workNumber,
  }];
  MYD.savePlan(plan);
  toast('ออกเลขงานสำเร็จ: ' + plan.workNumber);
  render();
}

function openRejectModal(plan) {
  const ov = document.createElement('div');
  ov.className = 'modal-ov';
  ov.innerHTML = `
    <div class="card">
      <div class="sect">ตีกลับแผน — ระบุเหตุผล</div>
      <div class="fgrid">
        <div class="f sp4">
          <label>เหตุผล</label>
          <div class="in"><span class="ms">edit_note</span>
            <input type="text" id="fRejectReason" placeholder="เช่น จำนวนอะไหล่เกินงบประมาณไตรมาสนี้">
          </div>
        </div>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-g" id="btnCancelReject">ยกเลิก</button>
        <button type="button" class="btn btn-o" id="btnConfirmReject">ยืนยันตีกลับ</button>
      </div>
    </div>`;
  document.body.appendChild(ov);

  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  ov.querySelector('#btnCancelReject').addEventListener('click', () => ov.remove());
  ov.querySelector('#btnConfirmReject').addEventListener('click', () => {
    const reason = ov.querySelector('#fRejectReason').value.trim();
    if (!reason) { toast('กรุณาระบุเหตุผล'); return; }
    plan.approvalStatus = 'rejected';
    plan.rejectReason = reason;
    plan.statusHistory = [...(plan.statusHistory || []), {
      status: 'rejected', at: nowTh(), note: 'ฝ่ายพัสดุตีกลับ: ' + reason,
    }];
    MYD.savePlan(plan);
    ov.remove();
    toast('ตีกลับแผนแล้ว');
    render();
  });
}

// ----- approved: read-only -----
function renderApproved(plan) {
  const { selectedVehicles, catSummary } = planSummary(plan);

  $('supBody').innerHTML = `
    <div class="card">
      <div class="sect">ออกเลขงานแล้ว</div>
      <span class="badge b-ok" style="font-size:15px;padding:6px 16px">${esc(plan.workNumber)}</span>
      <div class="fgrid" style="margin-top:16px">
        <div class="f sp2"><label>ชื่อแผน</label><div>${esc(plan.planName)}</div></div>
        <div class="f sp2"><label>จำนวนรถ</label><div>${selectedVehicles.length} คัน</div></div>
        <div class="f sp2"><label>ไทรมาส/ปี</label><div>${quarterYearText(plan)}</div></div>
        <div class="f sp4"><label>สรุปอะไหล่รวม</label><div>${catSummary || 'ไม่มีรายการ'}</div></div>
      </div>
      ${renderTimelineHtml(plan.statusHistory)}
    </div>`;
}

// ----- rejected: read-only -----
function renderRejected(plan) {
  $('supBody').innerHTML = `
    <div class="card">
      <div class="sect">ตีกลับแล้ว</div>
      <span class="badge b-out">❌ ตีกลับแล้ว</span>
      <div class="fgrid" style="margin-top:16px">
        <div class="f sp4"><label>เหตุผล</label><div>${esc(plan.rejectReason || '-')}</div></div>
      </div>
      ${renderTimelineHtml(plan.statusHistory)}
    </div>`;
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  render();
});
