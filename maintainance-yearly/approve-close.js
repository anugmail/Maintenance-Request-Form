// approve-close.js — หน้าผู้บังคับบัญชา กบค. อนุมัติปิดแผน
//
// เกิดจากปุ่ม "ส่งอนุมัติปิดแผน[ไตรมาส]" ที่หน้าเฟส 6 คำนวณต้นทุน (renderCost ใน app.js) — แยกส่งเป็น
// รายไตรมาส (เจ้าของงานสั่ง 26 ส.ค. 2569 — เดิมส่งทั้งแผนทีเดียว) กดแล้วไม่ได้ปิดไตรมาสนั้นทันที
// แค่ตั้งสถานะรออนุมัติที่นี่
//   plan.closeApprovalByQuarter = { [q]: {status:'pending'|'approved', requestedAt, approvedAt, approvedBy} }
//
// routing: approve-close.html              -> รายการ (แผน × ไตรมาส) ที่ส่งอนุมัติมา (รอ + อนุมัติแล้ว)
//          approve-close.html#<planId>/<Q> -> เปิดไตรมาสนั้นของแผนนั้น
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้

const CLOSE_APPROVER_NAMES = ['ผอ.กบค. สมชาย ตั้งใจ', 'ผช.ผอ.กบค. วิภาวรรณ ศรีสุข'];

// รถของไตรมาสหนึ่งที่ยังอยู่ในแผน — ใช้ทั้งหน้ารายการและหน้ารายละเอียด
function quarterVehicleIds(plan, q) {
  return ((plan.byQuarter || {})[q] || []).filter(id => MYD.isVehicleIn(plan, id));
}

// ยอดต้นทุนรวมของไตรมาสหนึ่ง — sum จาก plan.vehicleCost เฉพาะรถของไตรมาสนั้น (ตัวเดียวกับที่ renderCost ใช้)
function quarterCostTotal(plan, q) {
  return quarterVehicleIds(plan, q).reduce((sum, id) => {
    const c = MYD.vehicleCostOf(plan, id);
    return sum + (Number(c.perDiem) || 0) + (Number(c.lodging) || 0) + (Number(c.travel) || 0);
  }, 0);
}

// ================= RENDER =================
function render() {
  const hash = (location.hash || '').replace('#', '');
  if (!hash) { renderList(); return; }
  const [planId, q] = hash.split('/');
  const plan = MYD.getPlan(planId);
  const entry = plan && MYD.closeApprovalOf(plan, q);
  if (!plan || !entry) { location.hash = ''; renderList(); return; }
  renderDetail(plan, q);
}

// ----- รายการ (แผน × ไตรมาส) ที่ส่งอนุมัติมา -----
function renderList() {
  const plans = MYD.loadPlans();
  const rows = [];
  plans.forEach(p => {
    MYD.QUARTER_KEYS.forEach(q => {
      const entry = MYD.closeApprovalOf(p, q);
      if (entry) rows.push({ plan: p, q, entry });
    });
  });
  rows.reverse();   // ใหม่สุดขึ้นก่อน (loadPlans คืนเก่า→ใหม่ · loop ไตรมาสตามลำดับ Q1→Q4)

  const trs = rows.map(({ plan: p, q, entry }) => {
    const n = quarterVehicleIds(p, q).length;
    const approved = entry.status === 'approved';
    return `<tr>
      <td><b style="color:var(--gray-900)">${esc(p.workNumber || '—')}</b>
        <div class="cell-sub">${esc(p.planName || '—')}</div></td>
      <td>${esc(MYD.quarterLabel(q))}</td>
      <td class="num">${n}</td>
      <td class="num">${quarterCostTotal(p, q).toLocaleString('th-TH')}</td>
      <td>${approved
            ? `<span class="badge b-ok">อนุมัติแล้ว</span>`
            : `<span class="badge b-low">รออนุมัติ</span>`}</td>
      <td class="num"><a class="btn btn-s btn-sm" href="#${esc(p.id)}/${esc(q)}">เปิดแผน</a></td>
    </tr>`;
  }).join('');

  const waiting = rows.filter(r => r.entry.status !== 'approved').length;

  $('crumbs').innerHTML = `<span class="ms">task_alt</span><span class="cur">รายการแผน</span>`;
  $('apTitle').textContent = 'อนุมัติปิดแผน';
  $('apBody').innerHTML = `
    <div class="card">
      <div class="sect">แผนที่ส่งอนุมัติปิดแผนมา (แยกรายไตรมาส)
        ${waiting ? `<span class="badge b-low" style="margin-left:8px">รออนุมัติ ${waiting}</span>` : ''}</div>
      <div class="sub">ส่งมาจากหน้าคำนวณต้นทุน (เฟส 6) — กบค. ส่งอนุมัติได้ทีละไตรมาส · เลขงานคือหัวข้อของแผน</div>
      ${rows.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>เลขงาน / ชื่อแผน</th><th>ไตรมาส</th><th class="num">รถ (คัน)</th><th class="num">ต้นทุนรวม (บาท)</th>
          <th>สถานะ</th><th></th></tr></thead>
        <tbody>${trs}</tbody></table></div>`
        : `<div class="empty">ยังไม่มีแผนส่งเข้ามา — รอ กบค. กด "ส่งอนุมัติปิดแผน" รายไตรมาสที่หน้าคำนวณต้นทุน</div>`}
    </div>`;
}

// ----- แผนรายใบ ไตรมาสเดียว: สรุปต้นทุน + อนุมัติ -----
function renderDetail(plan, q) {
  const master = MYD.loadMaster();
  const byId = new Map(master.vehicles.map(v => [v.id, v]));
  const ids = quarterVehicleIds(plan, q);
  const entry = MYD.closeApprovalOf(plan, q);
  const approved = entry.status === 'approved';

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
    <span class="sep">›</span><span class="cur">${esc(plan.workNumber || planTitle(plan))} · ${esc(MYD.quarterLabel(q))}</span>`;
  $('apTitle').textContent = `${plan.workNumber || planTitle(plan)} · ${MYD.quarterLabel(q)}`;

  $('apBody').innerHTML = `
    <div class="card">
      <div class="page-title-row" style="margin-bottom:10px">
        <div class="sect" style="margin:0">สรุปต้นทุน${esc(MYD.quarterLabel(q))}เพื่ออนุมัติปิดแผน</div>
        ${approved
          ? `<span class="badge b-ok" style="margin-left:10px">อนุมัติแล้ว · ${esc(entry.approvedAt)}</span>`
          : `<span class="badge b-low" style="margin-left:10px">รออนุมัติ · ส่งมา ${esc(entry.requestedAt)}</span>`}
        <a class="btn btn-t" href="approve-close.html" style="margin-left:auto"><span class="ms">arrow_back</span> รายการแผน</a>
      </div>

      <div class="fgrid">
        <div class="f sp2"><label>ชื่อแผน</label><div>${esc(plan.planName || '—')}</div></div>
        <div class="f sp2"><label>ไตรมาสที่ขออนุมัติ</label><div>${esc(MYD.quarterLabel(q))}</div></div>
        <div class="f sp2"><label>รถในไตรมาสนี้</label><div><b style="font-size:20px">${ids.length}</b> คัน</div></div>
        <div class="f sp2"><label>ต้นทุนรวมไตรมาสนี้</label><div><b style="font-size:20px">${grandTotal.toLocaleString('th-TH')}</b> บาท</div></div>
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
        : `<div class="empty">ไม่มีรถในไตรมาสนี้</div>`}

      ${renderTimelineHtml(plan.statusHistory)}

      ${approved ? '' : `<div class="actions">
        <button class="btn btn-p" id="btnApprove"><span class="ms">task_alt</span> อนุมัติปิดแผน${esc(MYD.quarterLabel(q))}</button>
      </div>`}
    </div>`;

  if (!approved) $('btnApprove').addEventListener('click', () => approvePlan(plan, q));
}

// ผู้บังคับบัญชา กบค. กดอนุมัติ — ปิดไตรมาสนั้นจริง (แยกจากการกด "ส่งอนุมัติปิดแผน" ของ กบค. ผู้ทำแผน ที่แค่ส่งคำขอ)
function approvePlan(plan, q) {
  const by = CLOSE_APPROVER_NAMES[Math.abs(hashStr(plan.id + q)) % CLOSE_APPROVER_NAMES.length];
  const at = nowTh();
  MYD.approveCloseQuarter(plan, q, by, at);
  plan.statusHistory = [...(plan.statusHistory || []), {
    status: 'closed', at, note: `${by} อนุมัติปิดแผน${MYD.quarterLabel(q)}`,
  }];
  MYD.savePlan(plan);
  toast(`อนุมัติปิดแผน${MYD.quarterLabel(q)}แล้ว`);
  render();
}

// สุ่มชื่อผู้อนุมัติแบบคงที่ต่อ (แผน+ไตรมาส) (ไม่สุ่มใหม่ทุกครั้งที่เรนเดอร์) — ⚠️ ข้อมูลจำลอง ของจริงต้องผูกกับผู้ login
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

// ================= INIT =================
window.addEventListener('hashchange', render);
document.addEventListener('DOMContentLoaded', () => { renderTimeSim(); render(); });
