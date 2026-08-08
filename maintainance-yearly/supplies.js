// supplies.js — หน้าฝ่ายพัสดุ
//
// ⚠️ เปลี่ยนบทบาท 8 ส.ค. 2569: ฝ่ายพัสดุ **ไม่ใช่ผู้อนุมัติ**
// กบก. ออกเลขงานเองที่หน้าสรุป (เฟส 1 ขั้น 3) แล้วระบบ "ส่งเอกสารแจ้ง" มาที่นี่
// หน้านี้จึงเป็น read + กดรับทราบ เพื่อเอาไปเตรียม/สั่งอะไหล่
//   plan.workNumber    มีค่า → มีเอกสารส่งมาแล้ว
//   plan.suppliesAckAt null → รอรับทราบ | มีค่า → รับทราบแล้ว
// เขียนกลับผ่าน MYD.savePlan() ให้หน้า กบก. เห็นสถานะตรงกัน

const QUARTER_MONTHS = { Q1: 'ต.ค.–ธ.ค.', Q2: 'ม.ค.–มี.ค.', Q3: 'เม.ย.–มิ.ย.', Q4: 'ก.ค.–ก.ย.' };

const STATUS_HISTORY_LABELS = { draft: 'ฉบับร่าง', issued: 'ออกเลขงาน', notified: 'แจ้งฝ่ายพัสดุ', acknowledged: 'ฝ่ายพัสดุรับทราบ' };

// ================= HELPERS =================
const $ = id => document.getElementById(id);

function esc(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

function toast(m) {
  const t = $('toast');
  t.textContent = m;
  t.classList.add('show');
  clearTimeout(t._x);
  t._x = setTimeout(() => t.classList.remove('show'), 2600);
}

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

function quarterYearText(plan) {
  const months = QUARTER_MONTHS[plan.quarter];
  return `${esc(plan.quarter || '—')}${months ? ' (' + esc(months) + ')' : ''} / ${esc(plan.year)}`;
}

// ================= RENDER =================
function render() {
  const plan = MYD.loadPlan();
  if (!plan.workNumber) {
    renderEmpty();
    return;
  }
  renderDoc(plan);
}

function renderEmpty() {
  $('supBody').innerHTML = `
    <div class="card">
      <div class="empty">ยังไม่มีเอกสารส่งเข้ามา — รอ กบก. ออกเลขงาน</div>
    </div>`;
}

// เอกสารแจ้งเตรียม/สั่งอะไหล่ — รถกี่คัน ใช้อะไหล่อะไรบ้าง
function renderDoc(plan) {
  const master = MYD.loadMaster();
  const { vehicles, lines } = MYD.planLines(plan, master);
  const acked = !!plan.suppliesAckAt;

  // รถแยกตามภาค
  const byZone = MYD.ZONE_ORDER.map(z => {
    const vs = vehicles.filter(v => MYD.regionZone(v.region) === z);
    if (!vs.length) return null;
    const regions = [...new Set(vs.map(v => v.region))].sort((a, b) => a - b);
    return { label: MYD.ZONE_LABELS[z], n: vs.length, regions };
  }).filter(Boolean);

  // รถแยกตามยี่ห้อ/รุ่นอุปกรณ์ — พัสดุใช้ตัดสินว่าต้องสั่งอะไหล่ของยี่ห้อไหน
  const byBrand = [...new Set(vehicles.map(v => v.brand))].sort().map(brand => {
    const vs = vehicles.filter(v => v.brand === brand);
    return { brand, chassis: vs[0].chassis, type: vs[0].vehicleType, n: vs.length };
  });

  const itemRows = cat => lines.filter(l => l.item.category === cat).map(l => `
    <tr>
      <td>${esc(l.item.name)}
        <div style="font-size:12px;color:var(--gray-500)">${esc(MYD.triggerText(l.item))}</div></td>
      <td class="num">${esc(l.perVehicle)}</td>
      <td class="num">${esc(l.vehicleCount)}</td>
      <td class="num"><b>${esc(l.totalQty)}</b></td>
      <td>${esc(l.item.unit)}</td>
    </tr>`).join('');

  const itemTables = ['part', 'oil', 'filter'].map(cat => {
    const rows = itemRows(cat);
    if (!rows) return '';
    return `<div class="sect">${esc(MYD.CATEGORY_LABELS[cat])}</div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th>ชื่อ</th><th class="num">ต่อคัน</th><th class="num">จำนวนรถ</th><th class="num">รวมที่ต้องเตรียม</th><th>หน่วย</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`;
  }).join('');

  $('supBody').innerHTML = `
    <div class="card">
      <div class="sect">เอกสารแจ้งเตรียม/สั่งอะไหล่</div>
      <span class="badge b-ok" style="font-size:15px;padding:6px 16px">${esc(plan.workNumber)}</span>
      ${acked
        ? `<span class="badge b-ok" style="margin-left:8px">รับทราบแล้ว · ${esc(plan.suppliesAckAt)}</span>`
        : `<span class="badge b-low" style="margin-left:8px">รอรับทราบ</span>`}

      <div class="fgrid" style="margin-top:16px">
        <div class="f sp2"><label>ชื่อแผน</label><div>${esc(plan.planName)}</div></div>
        <div class="f sp2"><label>ไทรมาสที่ออกเลขงาน</label><div>${quarterYearText(plan)}</div></div>
        <div class="f sp2"><label>รถเข้าแผนบำรุงรักษา</label><div><b style="font-size:20px">${vehicles.length}</b> คัน</div></div>
        <div class="f sp2"><label>รายการอะไหล่ที่ต้องเตรียม</label><div><b style="font-size:20px">${lines.length}</b> รายการ</div></div>
      </div>

      <div class="sect">รถแยกตามภาค</div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th>ภาค</th><th class="num">จำนวนรถ</th><th>เขต</th></tr></thead>
        <tbody>${byZone.map(z => `<tr>
          <td>${esc(z.label)}</td><td class="num"><b>${z.n}</b></td>
          <td>${z.regions.map(r => `<span class="badge b-ok">เขต ${r}</span>`).join(' ')}</td>
        </tr>`).join('')}</tbody></table></div>

      <div class="sect">รถแยกตามยี่ห้อ/รุ่นอุปกรณ์</div>
      <div class="tblwrap"><table class="tbl">
        <thead><tr><th>ยี่ห้อ/รุ่นอุปกรณ์</th><th>ชนิดรถ</th><th class="num">จำนวนรถ</th></tr></thead>
        <tbody>${byBrand.map(b => `<tr>
          <td><b>${esc(b.brand)}</b>${b.chassis && b.chassis !== '—' ? `<div style="font-size:12px;color:var(--gray-500)">${esc(b.chassis)}</div>` : ''}</td>
          <td>${esc(b.type)}</td><td class="num"><b>${b.n}</b></td>
        </tr>`).join('')}</tbody></table></div>

      <div class="sect">อะไหล่ที่ต้องเตรียม/สั่ง</div>
      ${itemTables || `<div class="empty">ไม่มีรายการ</div>`}

      ${renderTimelineHtml(plan.statusHistory)}

      ${acked ? '' : `<div class="actions">
        <button class="btn btn-p" id="btnAck"><span class="ms">check</span> รับทราบ</button>
      </div>`}
    </div>`;

  if (!acked) $('btnAck').addEventListener('click', () => ackPlan(plan));
}

// ฝ่ายพัสดุกดรับทราบ — ไม่ใช่การอนุมัติ ไม่บล็อกเฟสถัดไปของ กบก.
function ackPlan(plan) {
  plan.suppliesAckAt = nowTh();
  plan.statusHistory = [...(plan.statusHistory || []), {
    status: 'acknowledged', at: plan.suppliesAckAt, note: 'ฝ่ายพัสดุรับทราบ — เตรียม/สั่งอะไหล่ตามรายการ',
  }];
  MYD.savePlan(plan);
  toast('รับทราบแล้ว');
  render();
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  render();
});
