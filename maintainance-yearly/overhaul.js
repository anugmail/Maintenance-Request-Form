// overhaul.js — เมนู "Overhaul": คัดว่ารถคันไหนเข้าข่ายยกเครื่อง
//
// ขอบเขต (เจ้าของงานสั่ง 8 ก.ย. 2569): เฉพาะ **รถขนาดใหญ่** ที่อยู่ในโฟลว์บำรุงรักษานี้
// (กระเช้า/เครน/รถขุด) ยังไม่รวมรถเล็ก
//
// ⚠️ เกณฑ์เป็นค่าที่เสนอไว้ก่อน ไม่ใช่ของจริงจาก กฟภ. — เจ้าของงานยกตัวอย่างไว้ข้อเดียวคือ
// "อายุเกิน 15 ปี" ที่เหลือประมาณจากช่วงข้อมูลรถในต้นแบบ · แก้ได้ที่ Admin › เกณฑ์ Overhaul
// ตรรกะการประเมินอยู่ที่ MYD.overhaulAssess() (pure — เทสด้วย test/overhaul.test.mjs)
//
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้

const OV_UI = { q: '', level: 'all', type: 'all', page: 1, size: 25, open: {} };

const OV_LEVEL = {
  due:  { cls: 'b-brand',   text: 'เข้าข่าย' },
  near: { cls: 'b-low',     text: 'ใกล้เกณฑ์' },
  ok:   { cls: 'b-neutral', text: 'ยังไม่ถึง' },
};

const num = n => Number(n || 0).toLocaleString('th-TH');

// ----- รวมผลประเมินของรถทุกคัน (คำนวณครั้งเดียวต่อการเรนเดอร์) -----
function assessAll() {
  const master = MYD.loadMaster();
  const plans = MYD.loadPlans();
  const cfg = MYD.overhaulConfig();
  const fy = fiscalNow().fy;
  return master.vehicles.map(v => ({
    v,
    r: MYD.overhaulAssess(v, cfg, {
      fiscalYearNow: fy,
      maintCost: MYD.vehicleMaintCostTotal(v.id, plans),
    }),
  }));
}

// ----- แถบท้ายตาราง — โครงเดียวกับหน้ารายการแผน -----
function ovTblFoot(total, from, to, pages) {
  const pg = [`<button class="pg" ${OV_UI.page <= 1 ? 'disabled' : ''} onclick="ovPage(${OV_UI.page - 1})" aria-label="หน้าก่อนหน้า"><span class="ms">chevron_left</span></button>`];
  for (let i = 1; i <= pages; i++) pg.push(`<button class="pg${i === OV_UI.page ? ' on' : ''}" onclick="ovPage(${i})">${i}</button>`);
  pg.push(`<button class="pg" ${OV_UI.page >= pages ? 'disabled' : ''} onclick="ovPage(${OV_UI.page + 1})" aria-label="หน้าถัดไป"><span class="ms">chevron_right</span></button>`);
  const sizes = [10, 25, 50].map(n => `<option value="${n}"${n === OV_UI.size ? ' selected' : ''}>${n}</option>`).join('');
  return `<div class="tblfoot">
    <div class="tf-left"><span>แสดง ${from} ถึง ${to} จาก ${total} รายการ</span>
      <select class="select-inline" aria-label="จำนวนแถวต่อหน้า" onchange="ovSize(this.value)">${sizes}</select></div>
    <div class="pager">${pg.join('')}</div>
  </div>`;
}

// ----- แถวรายละเอียด: ค่าจริงเทียบเกณฑ์ทีละข้อ (กางจากแถวหลัก) -----
function metricRow(m) {
  // เกินเกณฑ์แล้วให้เห็นว่าเกินไปเท่าไร ไม่ตัดที่ 100% (24 ปี จากเกณฑ์ 15 = 160% ไม่ใช่ 100%)
  const pct = Math.round(m.ratio * 100);
  return `<div class="ov-metric grid grid-cols-[200px_1fr_56px] items-center gap-3 py-1">
    <span>${esc(m.label)}</span>
    <span class="${m.over ? 'font-semibold text-brand-600' : ''}">${num(m.value)} / ${num(m.limit)} ${esc(m.unit)}</span>
    <span class="badge ${m.over ? 'b-brand' : 'b-neutral'}">${pct}%</span>
  </div>`;
}

function render() {
  const rows = assessAll();
  const cfg = MYD.overhaulConfig();
  const fy = fiscalNow().fy;

  const counts = { due: 0, near: 0, ok: 0 };
  rows.forEach(x => { counts[x.r.level]++; });

  const q = OV_UI.q.trim().toLowerCase();
  const types = [...new Set(rows.map(x => x.v.vehicleType))];
  let list = rows.filter(({ v, r }) => {
    if (OV_UI.level !== 'all' && r.level !== OV_UI.level) return false;
    if (OV_UI.type !== 'all' && v.vehicleType !== OV_UI.type) return false;
    if (!q) return true;
    return `${MYD.plateFull(v)} ${v.assetCode} ${v.ownerDept} ${v.province}`.toLowerCase().includes(q);
  });
  // เข้าข่ายขึ้นก่อน แล้วเรียงตามข้อที่เกินเกณฑ์มากสุด — คนเปิดหน้านี้มาหาคันที่ต้องตัดสินใจ
  const worst = r => Math.max(0, ...r.metrics.map(m => m.ratio));
  const order = { due: 0, near: 1, ok: 2 };
  list = list.sort((a, b) => (order[a.r.level] - order[b.r.level]) || (worst(b.r) - worst(a.r)));

  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / OV_UI.size));
  if (OV_UI.page > pages) OV_UI.page = pages;
  const from = (OV_UI.page - 1) * OV_UI.size;
  const pageRows = list.slice(from, from + OV_UI.size);

  const filterCount = (OV_UI.level !== 'all' ? 1 : 0) + (OV_UI.type !== 'all' ? 1 : 0);

  const body = pageRows.map(({ v, r }) => {
    const b = OV_LEVEL[r.level];
    const age = MYD.vehicleAgeYears(v, fy);
    const opened = !!OV_UI.open[v.id];
    return `<tr class="cursor-pointer" onclick="ovToggle('${esc(v.id)}')">
      <td><div class="cell-key">${esc(MYD.plateFull(v))}</div>
        <div class="cell-sub">${esc(v.vehicleType)} · ${esc(v.brand)}</div></td>
      <td>${esc(v.ownerDept)}<div class="cell-sub">${esc(v.province)} · เขต ${esc(v.region)}</div></td>
      <td class="num">${age == null ? '—' : age}<div class="cell-sub">ใช้ตั้งแต่ ${esc(v.firstUseYear || '—')}</div></td>
      <td class="num">${num(v.mileage)}</td>
      <td class="num">${num(v.engineHours)}</td>
      <td><span class="badge ${b.cls}">${b.text}</span>
        ${r.disposalFlag ? '<div class="cell-sub">สถานะรถ: ' + esc(MYD.STATUS_LABELS[v.status] || v.status) + '</div>' : ''}
        ${r.reasons.length ? `<div class="cell-sub">เกิน: ${r.reasons.map(x => esc(x.label)).join(' · ')}</div>` : ''}</td>
      <td class="num"><span class="ms text-gray-400">${opened ? 'expand_less' : 'expand_more'}</span></td>
    </tr>
    ${opened ? `<tr><td colspan="7" class="bg-gray-50">
      <div class="incident-section-title">เทียบเกณฑ์ทีละข้อ</div>
      <div class="max-w-[560px]">${r.metrics.map(metricRow).join('')}</div>
      ${r.disposalFlag ? `<div class="note note-warn mt-2"><span class="ms">warning</span>
        <div>รถคันนี้สถานะ <b>${esc(MYD.STATUS_LABELS[v.status] || v.status)}</b> — ควรพิจารณาว่าคุ้มกับการ overhaul หรือควรจำหน่าย</div></div>` : ''}
    </td></tr>` : ''}`;
  }).join('');

  $('crumbs').innerHTML = `<span class="ms">build_circle</span><span class="cur">Overhaul</span>`;
  $('ovHead').innerHTML = `
    <div class="page-title-row">
      <h1 class="page-title">Overhaul — รถที่เข้าข่ายยกเครื่อง</h1>
      <a class="btn btn-g ml-auto" href="admin.html#overhaul"><span class="ms">rule</span> แก้เกณฑ์</a>
    </div>
    <div class="sub -mt-3 mb-4">รถขนาดใหญ่ในระบบ ${rows.length} คัน · ปีงบ ${fy} ·
      เกณฑ์อายุ ${cfg.ageYears} ปี</div>`;

  $('ovBody').innerHTML = `
    <div class="card">
      <div class="ov-sum flex flex-wrap gap-2 mb-3.5">
        <span class="badge b-brand">เข้าข่าย ${counts.due}</span>
        <span class="badge b-low">ใกล้เกณฑ์ ${counts.near}</span>
        <span class="badge b-neutral">ยังไม่ถึง ${counts.ok}</span>
      </div>
      <div class="list-toolbar split">
        <div class="lt-search">
          <div class="search"><span class="ms">search</span>
            <input type="search" id="ov-q" placeholder="ทะเบียน, เลขครุภัณฑ์, หน่วยงาน" value="${esc(OV_UI.q)}"
              oninput="ovSearch(this.value)"></div>
        </div>
        <div class="lt-actions">
          <button class="btn btn-s" id="ov-filter-btn" aria-expanded="${filterCount ? 'true' : 'false'}"
            aria-controls="ov-filter-panel" onclick="ovToggleFilter()">
            <span class="ms">filter_list</span> ตัวกรอง<span class="badge b-neutral">${filterCount}</span></button>
        </div>
      </div>
      <div class="filter-panel${filterCount ? ' open' : ''}" id="ov-filter-panel">
        <div class="filter-field">
          <label for="ov-level">ผลประเมิน</label>
          <select id="ov-level" onchange="ovSetLevel(this.value)">
            <option value="all"${OV_UI.level === 'all' ? ' selected' : ''}>ทั้งหมด</option>
            <option value="due"${OV_UI.level === 'due' ? ' selected' : ''}>เข้าข่าย</option>
            <option value="near"${OV_UI.level === 'near' ? ' selected' : ''}>ใกล้เกณฑ์</option>
            <option value="ok"${OV_UI.level === 'ok' ? ' selected' : ''}>ยังไม่ถึง</option>
          </select>
        </div>
        <div class="filter-field">
          <label for="ov-type">ชนิดรถ</label>
          <select id="ov-type" onchange="ovSetType(this.value)">
            <option value="all"${OV_UI.type === 'all' ? ' selected' : ''}>ทุกชนิด</option>
            ${types.map(t => `<option value="${esc(t)}"${OV_UI.type === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}
          </select>
        </div>
        <button class="btn btn-t" onclick="ovClearFilter()"><span class="ms">filter_alt_off</span> ล้างตัวกรอง</button>
      </div>
      ${total ? `<div class="tblwrap"><table class="tbl striped">
        <thead><tr><th>ทะเบียน / ชนิด</th><th>หน่วยงานเจ้าของรถ</th><th class="num">อายุ (ปี)</th>
          <th class="num">เลขไมล์ (กม.)</th><th class="num">ชั่วโมง (ชม.)</th><th>ผลประเมิน</th><th></th></tr></thead>
        <tbody>${body}</tbody></table></div>
        ${ovTblFoot(total, from + 1, Math.min(from + OV_UI.size, total), pages)}`
      : `<div class="filter-empty"><span class="ms">filter_alt_off</span><b>ไม่พบรถตามเงื่อนไขนี้</b>
          <span>ลองล้างตัวกรองหรือแก้คำค้น</span></div>`}
    </div>`;
}

// ----- ตัวควบคุมรายการ -----
function ovSearch(v) { OV_UI.q = v; OV_UI.page = 1; render(); const el = $('ov-q'); if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); } }
function ovSetLevel(v) { OV_UI.level = v; OV_UI.page = 1; render(); }
function ovSetType(v) { OV_UI.type = v; OV_UI.page = 1; render(); }
function ovClearFilter() { OV_UI.level = 'all'; OV_UI.type = 'all'; OV_UI.page = 1; render(); }
function ovPage(n) { OV_UI.page = n; render(); }
function ovSize(n) { OV_UI.size = Number(n); OV_UI.page = 1; render(); }
function ovToggle(id) { OV_UI.open[id] = !OV_UI.open[id]; render(); }
function ovToggleFilter() {
  const el = $('ov-filter-panel'), btn = $('ov-filter-btn');
  const open = el.classList.toggle('open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}

document.addEventListener('DOMContentLoaded', () => {
  renderTimeSim();
  render();
});
