// approve-close.js — หน้าผู้บังคับบัญชา กบค. อนุมัติปิดแผน
//
// เกิดจากปุ่ม "ส่งอนุมัติปิดแผน" ที่หน้าเฟส 6 คำนวณต้นทุน (renderCost ใน app.js) — กดแล้วไม่ได้ปิดแผนทันที
// แค่ตั้ง plan.closeApproval = {status:'pending', requestedAt} ส่งมารออนุมัติที่นี่
//   plan.closeApproval = { status:'pending'|'approved', requestedAt, approvedAt, approvedBy }
//
// routing: approve-close.html          -> รายการแผนที่ส่งอนุมัติมา (รอ + อนุมัติแล้ว)
//          approve-close.html#<planId> -> เปิดแผนใบนั้น
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้

const CLOSE_APPROVER_NAMES = ['ผอ.กบค. สมชาย ตั้งใจ', 'ผช.ผอ.กบค. วิภาวรรณ ศรีสุข'];

// ยอดต้นทุนรวมของแผน — sum จาก plan.vehicleCost ทุกคันในแผน (ตัวเดียวกับที่ renderCost ใช้)
function planCostTotal(plan, master) {
  const ids = (plan.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(plan, id));
  return ids.reduce((sum, id) => {
    const c = MYD.vehicleCostOf(plan, id);
    return sum + (Number(c.perDiem) || 0) + (Number(c.lodging) || 0) + (Number(c.travel) || 0);
  }, 0);
}

// ================= RENDER =================
function render() {
  const id = (location.hash || '').replace('#', '');
  if (!id) { renderList(); return; }
  const plan = MYD.getPlan(id);
  if (!plan || !plan.closeApproval) { location.hash = ''; renderList(); return; }
  renderDetail(plan);
}

// ----- รายการแผนที่ส่งอนุมัติมา -----
function renderList() {
  const plans = MYD.loadPlans().filter(p => p.closeApproval).reverse();
  const master = MYD.loadMaster();

  const rows = plans.map(p => {
    const ids = (p.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(p, id));
    const approved = p.closeApproval.status === 'approved';
    return `<tr>
      <td><b style="color:var(--gray-900)">${esc(p.workNumber || '—')}</b>
        <div class="cell-sub">${esc(p.planName || '—')}</div></td>
      <td class="num">${ids.length}</td>
      <td class="num">${planCostTotal(p, master).toLocaleString('th-TH')}</td>
      <td>${quarterYearText(p)}</td>
      <td>${approved
            ? `<span class="badge b-ok">อนุมัติแล้ว</span>`
            : `<span class="badge b-low">รออนุมัติ</span>`}</td>
      <td class="num"><a class="btn btn-s btn-sm" href="#${esc(p.id)}">เปิดแผน</a></td>
    </tr>`;
  }).join('');

  const waiting = plans.filter(p => p.closeApproval.status !== 'approved').length;

  $('crumbs').innerHTML = `<span class="ms">task_alt</span><span class="cur">รายการแผน</span>`;
  $('apTitle').textContent = 'อนุมัติปิดแผน';
  $('apBody').innerHTML = `
    <div class="card">
      <div class="sect">แผนที่ส่งอนุมัติปิดแผนมา
        ${waiting ? `<span class="badge b-low" style="margin-left:8px">รออนุมัติ ${waiting}</span>` : ''}</div>
      <div class="sub">ส่งมาจากหน้าคำนวณต้นทุน (เฟส 6) — เลขงานคือหัวข้อของแผน</div>
      ${plans.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>เลขงาน / ชื่อแผน</th><th class="num">รถ (คัน)</th><th class="num">ต้นทุนรวม (บาท)</th>
          <th>ไตรมาส/ปี</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">ยังไม่มีแผนส่งเข้ามา — รอ กบค. กด "ส่งอนุมัติปิดแผน" ที่หน้าคำนวณต้นทุน</div>`}
    </div>`;
}

// ----- แผนรายใบ: สรุปต้นทุน + อนุมัติ -----
function renderDetail(plan) {
  const master = MYD.loadMaster();
  const byId = new Map(master.vehicles.map(v => [v.id, v]));
  const ids = (plan.selectedVehicleIds || []).filter(id => MYD.isVehicleIn(plan, id));
  const approved = plan.closeApproval.status === 'approved';

  let sumPerDiem = 0, sumLodging = 0, sumTravel = 0;
  const rows = ids.map(id => {
    const v = byId.get(id);
    if (!v) return '';
    const c = MYD.vehicleCostOf(plan, id);
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

  $('crumbs').innerHTML = `
    <a href="approve-close.html" style="color:inherit;text-decoration:none"><span class="ms">task_alt</span> รายการแผน</a>
    <span class="sep">›</span><span class="cur">${esc(plan.workNumber || planTitle(plan))}</span>`;
  $('apTitle').textContent = plan.workNumber || planTitle(plan);

  $('apBody').innerHTML = `
    <div class="card">
      <div class="page-title-row" style="margin-bottom:10px">
        <div class="sect" style="margin:0">สรุปต้นทุนเพื่ออนุมัติปิดแผน</div>
        ${approved
          ? `<span class="badge b-ok" style="margin-left:10px">อนุมัติแล้ว · ${esc(plan.closeApproval.approvedAt)}</span>`
          : `<span class="badge b-low" style="margin-left:10px">รออนุมัติ · ส่งมา ${esc(plan.closeApproval.requestedAt)}</span>`}
        <a class="btn btn-t" href="approve-close.html" style="margin-left:auto"><span class="ms">arrow_back</span> รายการแผน</a>
      </div>

      <div class="fgrid">
        <div class="f sp2"><label>ชื่อแผน</label><div>${esc(plan.planName || '—')}</div></div>
        <div class="f sp2"><label>ไตรมาสที่ออกเลขงาน</label><div>${quarterYearText(plan)}</div></div>
        <div class="f sp2"><label>รถในแผน</label><div><b style="font-size:20px">${ids.length}</b> คัน</div></div>
        <div class="f sp2"><label>ต้นทุนรวมทั้งแผน</label><div><b style="font-size:20px">${grandTotal.toLocaleString('th-TH')}</b> บาท</div></div>
      </div>

      <div class="sect">ต้นทุนต่อคัน</div>
      ${ids.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>ทะเบียน</th><th>หน่วยงานเจ้าของรถ</th>
          <th class="num">ค่าเบี้ยเลี้ยง (บาท)</th><th class="num">ค่าที่พัก (บาท)</th>
          <th class="num">ค่าเดินทาง (บาท)</th><th class="num">รวม (บาท)</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr>
          <td colspan="2" style="${totalCellStyle}"><b>ต้นทุนทั้งหมด</b></td>
          <td class="num" style="${totalCellStyle}">${sumPerDiem.toLocaleString('th-TH')}</td>
          <td class="num" style="${totalCellStyle}">${sumLodging.toLocaleString('th-TH')}</td>
          <td class="num" style="${totalCellStyle}">${sumTravel.toLocaleString('th-TH')}</td>
          <td class="num" style="${totalCellStyle}"><b>${grandTotal.toLocaleString('th-TH')}</b></td>
        </tr></tfoot></table></div>`
        : `<div class="empty">ไม่มีรถในแผนนี้</div>`}

      ${renderTimelineHtml(plan.statusHistory)}

      ${approved ? '' : `<div class="actions">
        <button class="btn btn-p" id="btnApprove"><span class="ms">task_alt</span> อนุมัติปิดแผน</button>
      </div>`}
    </div>`;

  if (!approved) $('btnApprove').addEventListener('click', () => approvePlan(plan));
}

// ผู้บังคับบัญชา กบค. กดอนุมัติ — ปิดแผนจริง (แยกจากการกด "ส่งอนุมัติปิดแผน" ของ กบค. ผู้ทำแผน ที่แค่ส่งคำขอ)
function approvePlan(plan) {
  const by = CLOSE_APPROVER_NAMES[Math.abs(hashStr(plan.id)) % CLOSE_APPROVER_NAMES.length];
  plan.closeApproval.status = 'approved';
  plan.closeApproval.approvedAt = nowTh();
  plan.closeApproval.approvedBy = by;
  plan.statusHistory = [...(plan.statusHistory || []), {
    status: 'closed', at: plan.closeApproval.approvedAt, note: `${by} อนุมัติปิดแผน`,
  }];
  MYD.savePlan(plan);
  toast('อนุมัติปิดแผนแล้ว');
  render();
}

// สุ่มชื่อผู้อนุมัติแบบคงที่ต่อแผน (ไม่สุ่มใหม่ทุกครั้งที่เรนเดอร์) — ⚠️ ข้อมูลจำลอง ของจริงต้องผูกกับผู้ login
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

// ================= INIT =================
window.addEventListener('hashchange', render);
document.addEventListener('DOMContentLoaded', () => { renderTimeSim(); render(); });
