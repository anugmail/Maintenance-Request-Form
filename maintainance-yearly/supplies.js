// supplies.js — หน้าฝ่ายพัสดุ
//
// ⚠️ ฝ่ายพัสดุ **ไม่ใช่ผู้อนุมัติ** — กบค. ออกเลขงานเองที่หน้า plan-new.html
// แล้วระบบ "ส่งเอกสารแจ้ง" มาที่นี่ เพื่อให้พัสดุเตรียม/สั่งอะไหล่
//   plan.workNumber    มีค่า → มีเอกสารส่งมาแล้ว
//   plan.suppliesAckAt null → รอรับทราบ | มีค่า → รับทราบแล้ว
//
// routing: supplies.html          -> รายการเอกสาร (ทุกแผนที่ออกเลขงานแล้ว)
//          supplies.html#<planId> -> เปิดเอกสารใบนั้น
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้

// ยอดรวมของกลุ่ม — หน่วยต่างกันบวกรวมกันไม่ได้ จึงรวมแยกตามหน่วย
function unitTotals(lines) {
  const by = {};
  lines.forEach(l => { by[l.item.unit] = (by[l.item.unit] || 0) + l.totalQty; });
  return Object.entries(by).map(([u, n]) => `<b>${n.toLocaleString('th-TH')}</b> ${esc(u)}`).join(' · ');
}

// ================= RENDER =================
function render() {
  const id = (location.hash || '').replace('#', '');
  if (!id) { renderList(); return; }
  const plan = MYD.getPlan(id);
  if (!plan || !plan.workNumber) { location.hash = ''; renderList(); return; }
  renderDoc(plan);
}

// ----- รายการเอกสารที่ส่งมา -----
function renderList() {
  const docs = MYD.loadPlans().filter(p => p.workNumber).reverse();
  const master = MYD.loadMaster();

  const rows = docs.map(p => {
    const { vehicles, lines } = MYD.planLines(p, master);
    const acked = !!p.suppliesAckAt;
    return `<tr>
      <td><b style="color:var(--gray-900)">${esc(p.workNumber)}</b>
        <div style="font-size:12px;color:var(--gray-500)">${esc(p.planName || '—')}</div></td>
      <td class="num">${vehicles.length}</td>
      <td class="num">${lines.length}</td>
      <td>${quarterYearText(p)}</td>
      <td>${acked
            ? `<span class="badge b-ok">รับทราบแล้ว</span>`
            : `<span class="badge b-low">รอรับทราบ</span>`}</td>
      <td class="num"><a class="btn btn-s btn-sm" href="#${esc(p.id)}">เปิดเอกสาร</a></td>
    </tr>`;
  }).join('');

  const waiting = docs.filter(p => !p.suppliesAckAt).length;

  $('crumbs').innerHTML = `<span class="ms">inventory_2</span><span class="cur">รายการเอกสาร</span>`;
  $('supTitle').textContent = 'ฝ่ายพัสดุ — เอกสารแจ้งเตรียม/สั่งอะไหล่';
  $('supBody').innerHTML = `
    <div class="card">
      <div class="sect">เอกสารที่ส่งมาจาก กบค.
        ${waiting ? `<span class="badge b-low" style="margin-left:8px">รอรับทราบ ${waiting}</span>` : ''}</div>
      <div class="sub">แต่ละใบคือแผนบำรุงรักษาประจำปีหนึ่งแผน — เลขงานคือหัวข้อของแผน</div>
      ${docs.length ? `<div class="tblwrap"><table class="tbl">
        <thead><tr><th>เลขงาน / ชื่อแผน</th><th class="num">รถ (คัน)</th><th class="num">อะไหล่ (รายการ)</th><th>ไตรมาส/ปี</th><th>สถานะ</th><th></th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
        : `<div class="empty">ยังไม่มีเอกสารส่งเข้ามา — รอ กบค. ออกเลขงาน</div>`}
    </div>`;
}

// ----- เอกสารรายใบ: รถกี่คัน ใช้อะไหล่อะไรบ้าง -----
function renderDoc(plan) {
  const master = MYD.loadMaster();
  const { vehicles, lines } = MYD.planLines(plan, master);
  const acked = !!plan.suppliesAckAt;

  const byZone = MYD.ZONE_ORDER.map(z => {
    const vs = vehicles.filter(v => MYD.regionZone(v.region) === z);
    if (!vs.length) return null;
    const regions = [...new Set(vs.map(v => v.region))].sort((a, b) => a - b);
    return { label: MYD.ZONE_LABELS[z], n: vs.length, regions };
  }).filter(Boolean);

  // แยกยี่ห้อ/รุ่นอุปกรณ์ — พัสดุใช้ตัดสินว่าต้องสั่งอะไหล่ของยี่ห้อไหน
  const byBrand = [...new Set(vehicles.map(v => v.brand))].sort().map(brand => {
    const vs = vehicles.filter(v => v.brand === brand);
    return { brand, chassis: vs[0].chassis, type: vs[0].vehicleType, n: vs.length };
  });

  const itemTables = ['part', 'oil', 'filter'].map(cat => {
    const rows = lines.filter(l => l.item.category === cat).map(l => `
      <tr>
        <td>${esc(l.item.name)}
          <div style="font-size:12px;color:var(--gray-500)">${esc(MYD.triggerText(l.item))}</div></td>
        <td class="num">${esc(l.perVehicle)}</td>
        <td class="num">${esc(l.vehicleCount)}</td>
        <td class="num"><b>${esc(l.totalQty)}</b></td>
        <td>${esc(l.item.unit)}</td><td></td>
      </tr>`).join('');
    if (!rows) return '';
    const catLines = lines.filter(l => l.item.category === cat);
    return `<div class="sect">${esc(MYD.CATEGORY_LABELS[cat])}</div>
      <div class="tblwrap"><table class="tbl itbl">
        <thead><tr><th>ชื่อ</th><th>ต่อคัน</th><th>จำนวนรถ</th><th>รวมที่ต้องเตรียม</th><th>หน่วย</th><th></th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="sumrow">
          <td><b>รวมกลุ่มนี้</b> · ${catLines.length} รายการ</td>
          <td colspan="5" style="text-align:right">${unitTotals(catLines)}</td>
        </tr></tfoot></table></div>`;
  }).join('');

  $('crumbs').innerHTML = `
    <a href="supplies.html" style="color:inherit;text-decoration:none"><span class="ms">inventory_2</span> รายการเอกสาร</a>
    <span class="sep">›</span><span class="cur">${esc(plan.workNumber)}</span>`;
  $('supTitle').textContent = plan.workNumber;

  $('supBody').innerHTML = `
    <div class="card">
      <div class="page-title-row" style="margin-bottom:10px">
        <div class="sect" style="margin:0">เอกสารแจ้งเตรียม/สั่งอะไหล่</div>
        ${acked
          ? `<span class="badge b-ok" style="margin-left:10px">รับทราบแล้ว · ${esc(plan.suppliesAckAt)}</span>`
          : `<span class="badge b-low" style="margin-left:10px">รอรับทราบ</span>`}
        <a class="btn btn-t" href="supplies.html" style="margin-left:auto"><span class="ms">arrow_back</span> รายการเอกสาร</a>
      </div>

      <div class="fgrid">
        <div class="f sp2"><label>ชื่อแผน</label><div>${esc(plan.planName || '—')}</div></div>
        <div class="f sp2"><label>ไตรมาสที่ออกเลขงาน</label><div>${quarterYearText(plan)}</div></div>
        <div class="f sp2"><label>รถเข้าแผนบำรุงรักษา</label><div><b style="font-size:20px">${vehicles.length}</b> คัน</div></div>
        <div class="f sp2"><label>รายการอะไหล่ที่ต้องเตรียม</label><div><b style="font-size:20px">${lines.length}</b> รายการ</div></div>
      </div>

      <div class="sect">รถแยกตามภาค</div>
      <div class="tblwrap"><table class="tbl itbl">
        <thead><tr><th>ภาค</th><th colspan="2">เขต</th><th>จำนวนรถ</th><th>หน่วย</th><th></th></tr></thead>
        <tbody>${byZone.map(z => `<tr>
          <td>${esc(z.label)}</td>
          <td colspan="2">${z.regions.map(r => `<span class="badge b-ok">เขต ${r}</span>`).join(' ')}</td>
          <td class="num"><b>${z.n}</b></td><td>คัน</td><td></td>
        </tr>`).join('')}</tbody>
        <tfoot><tr class="sumrow"><td><b>รวม</b></td><td colspan="2"></td>
          <td class="num"><b>${vehicles.length}</b></td><td>คัน</td><td></td></tr></tfoot></table></div>

      <div class="sect">รถแยกตามยี่ห้อ/รุ่นอุปกรณ์</div>
      <div class="tblwrap"><table class="tbl itbl">
        <thead><tr><th>ยี่ห้อ/รุ่นอุปกรณ์</th><th colspan="2">ชนิดรถ</th><th>จำนวนรถ</th><th>หน่วย</th><th></th></tr></thead>
        <tbody>${byBrand.map(b => `<tr>
          <td><b>${esc(b.brand)}</b>${b.chassis && b.chassis !== '—' ? `<div style="font-size:12px;color:var(--gray-500)">${esc(b.chassis)}</div>` : ''}</td>
          <td colspan="2">${esc(b.type)}</td><td class="num"><b>${b.n}</b></td><td>คัน</td><td></td>
        </tr>`).join('')}</tbody>
        <tfoot><tr class="sumrow"><td><b>รวม</b> · ${byBrand.length} ยี่ห้อ</td><td colspan="2"></td>
          <td class="num"><b>${vehicles.length}</b></td><td>คัน</td><td></td></tr></tfoot></table></div>

      <div class="sect">อะไหล่ที่ต้องเตรียม/สั่ง</div>
      ${itemTables || `<div class="empty">ไม่มีรายการ</div>`}

      ${renderTimelineHtml(plan.statusHistory)}

      ${acked ? '' : `<div class="actions">
        <button class="btn btn-p" id="btnAck"><span class="ms">check</span> รับทราบ</button>
      </div>`}
    </div>`;

  if (!acked) $('btnAck').addEventListener('click', () => ackPlan(plan));
}

// ฝ่ายพัสดุกดรับทราบ — ไม่ใช่การอนุมัติ ไม่บล็อกเฟสถัดไปของ กบค.
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
window.addEventListener('hashchange', render);
document.addEventListener('DOMContentLoaded', () => { renderTimeSim(); render(); });
