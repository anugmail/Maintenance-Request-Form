// plan-new.js — หน้า "ออกเลขงาน" (แยกออกจาก stepper ปฏิบัติการแล้ว)
//
// หน้านี้ทำเรื่องเดียว: สร้างแผนบำรุงรักษาประจำปีของ กบค. แล้วออกเลขงาน
// wizard 2 ขั้น: ไทรมาส+ชื่อแผน+เลือกรถ → สรุปแผน → [ออกเลขงาน]
// ขั้น "เลือก/แก้รายการอะไหล่" ถูกตัดออก 17 ส.ค. 2569 ตามคำสั่งเจ้าของงาน
// ระบบยังคำนวณรายการอะไหล่จากรถที่เลือกให้เอง (ใช้ในสรุป + เอกสารพัสดุ) แค่ไม่ให้แก้ตอนทำแผน
// ออกเลขแล้วส่งเอกสารแจ้งฝ่ายพัสดุ และแผนจะไปโผล่ใน "รายการแผน" (index.html)
//
// deep-link: plan-new.html#<planId> = แก้แผนร่างที่ค้างอยู่ · ไม่มี hash = สร้างใหม่
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้

const state = { sub: 1, expandedRegions: {} };
let PLAN = null;

const SUB_STEPS = [
  { no: 1, label: 'ไทรมาส + ชื่อแผน + เลือกรถ' },
  { no: 2, label: 'สรุปแผน' },
];
const LAST_SUB = SUB_STEPS.length;

// ----- sub-nav -----
function goSub(n) {
  if (n < 1 || n > LAST_SUB) return;
  state.sub = n;
  render();
  window.scrollTo({ top: 0 });
}

function nextSub() {
  const plan = PLAN;
  if (!validateSub(plan, state.sub)) return;
  if (state.sub >= LAST_SUB) return;
  goSub(state.sub + 1);
}

function backSub() {
  if (state.sub <= 1) return;
  goSub(state.sub - 1);
}

function validateSub(plan, sub) {
  if (sub === 1) return !!plan.quarter && !!(plan.planName && plan.planName.trim()) && (plan.selectedVehicleIds || []).length >= 1;
  return true; // ขั้นสุดท้าย (สรุป) กดออกเลขงานได้เสมอ
}

function updatePrimaryEnabled(plan) {
  const btn = $('btnPrimarySub');
  if (!btn) return;
  btn.disabled = !validateSub(plan, state.sub);
}

// ----- wizard shell -----
function renderWizard(plan) {
  const primaryLabel = state.sub === LAST_SUB ? 'ออกเลขงาน' : 'ถัดไป';
  const primaryDisabled = !validateSub(plan, state.sub);

  $('planNewBody').innerHTML = `
    <div class="card">
      <div class="wsteps sm">${SUB_STEPS.map(s => {
        const active = s.no === state.sub;
        const passed = s.no < state.sub;
        const cls = ['wstep'];
        if (active) cls.push('active');
        if (passed) cls.push('passed');
        if (s.no > state.sub) cls.push('locked');
        return `<div class="${cls.join(' ')}" onclick="goSub(${s.no})">
          <span class="num">${passed ? '✓' : s.no}</span>
          <span class="lbl">${esc(s.label)}</span>
        </div>`;
      }).join('')}</div>
      <div id="subBody">${renderSubBody(plan)}</div>
      <div class="actions">
        <button class="btn btn-g" id="btnBackSub" ${state.sub === 1 ? 'disabled' : ''}>ย้อนกลับ</button>
        <button class="btn btn-p" id="btnPrimarySub" ${primaryDisabled ? 'disabled' : ''}>${esc(primaryLabel)}</button>
      </div>
    </div>`;

  bindSubBody(plan);

  $('btnBackSub').addEventListener('click', backSub);
  $('btnPrimarySub').addEventListener('click', () => {
    if (state.sub === LAST_SUB) issueWorkNumber(plan);
    else nextSub();
  });
}

function renderSubBody(plan) {
  if (state.sub === 1) return renderStep1(plan);
  return renderStepSummary(plan);
}

function bindSubBody(plan) {
  if (state.sub === 1) bindStep1(plan);
}

// ----- ขั้น 1: ชื่อแผน + เลือกรถเข้าแผน (ภาค → เขต → รถ) -----
// state.expandedRegions: { [regionId]: true|false } — เก็บสถานะขยาย/ย่อของแต่ละเขต
// ข้าม re-render ของ wizard ได้ (ไม่ผูกกับ plan, อยู่ใน memory เท่านั้น เหมือน state.sub)
function regionVehiclesFor(master, regionId) {
  return master.vehicles.filter(v => v.region === regionId);
}

function renderStep1(plan) {
  if (!state.expandedRegions) state.expandedRegions = {};
  const master = MYD.loadMaster();
  const allVehicles = master.vehicles;
  const selected = new Set(plan.selectedVehicleIds || []);
  // ทุกยอด "เลือกได้กี่คัน" นับจากรถที่ผ่าน canJoinPlan เท่านั้น — รถซ่อมอยู่/หมดสภาพ
  // ติ๊กไม่ได้ ถ้ายังเอามานับ ช่อง "เลือกทั้งเขต" จะไม่มีวันขึ้นเครื่องหมายถูก
  const joinableAll = allVehicles.filter(v => MYD.canJoinPlan(v));
  const allSelected = joinableAll.length > 0 && joinableAll.every(v => selected.has(v.id));
  const regionsSelected = new Set(allVehicles.filter(v => selected.has(v.id)).map(v => v.region));

  const zonesHtml = MYD.ZONE_ORDER.map(zone => {
    const regions = MYD.REGIONS.filter(r => r.zone === zone);
    if (!regions.length) return '';
    const regionIds = new Set(regions.map(r => r.id));
    const zoneVehicles = allVehicles.filter(v => regionIds.has(v.region));
    const zoneJoinable = zoneVehicles.filter(v => MYD.canJoinPlan(v));
    const zoneSel = zoneVehicles.filter(v => selected.has(v.id)).length;
    const zoneChecked = zoneJoinable.length > 0 && zoneSel === zoneJoinable.length;
    const zoneBlocked = zoneVehicles.length - zoneJoinable.length;
    const blocks = regions.map(r => renderRegionBlock(r, master, selected)).join('');
    return `<div class="sect">
      <span style="margin-right:auto">${esc(MYD.ZONE_LABELS[zone])} <span style="font-weight:400;color:var(--gray-500);font-size:14px">(${zoneJoinable.length} คัน${zoneBlocked ? ` · เลือกไม่ได้ ${zoneBlocked}` : ''})</span></span>
      <label class="rzone-allchk" style="font-weight:500" onclick="event.stopPropagation()"><input type="checkbox" class="zoneAllChk" data-zone="${zone}" ${zoneJoinable.length === 0 ? 'disabled' : ''} ${zoneChecked ? 'checked' : ''}> เลือกทั้งภาค</label>
    </div>${blocks}`;
  }).join('');

  const nowQ = MYD.quarterOfMonth(new Date().getMonth() + 1);
  const qInfo = QUARTERS.find(q => q.q === plan.quarter);
  const qSeg = QUARTERS.map(q => `
    <div class="sg qSeg ${plan.quarter === q.q ? 'sel' : ''}" data-q="${q.q}">
      ${esc(q.q)}<div style="font-weight:400;font-size:var(--fs-text-xs);color:var(--gray-500)">${esc(q.months)}${q.q === nowQ ? ' · ตอนนี้' : ''}</div>
    </div>`).join('');

  return `
    <div class="sect">ขั้นที่ 1: ไทรมาส + ชื่อแผน + เลือกรถเข้าแผน</div>
    <div class="fgrid">
      <div class="f sp2">
        <label>ไทรมาสของแผน (ปีงบประมาณ ${esc(plan.year)})</label>
        <div class="seg">${qSeg}</div>
      </div>
      <div class="f sp4">
        <label>ชื่อแผน</label>
        <div class="in"><span class="ms">assignment</span>
          <input type="text" id="fPlanName" placeholder="เช่น แผนบำรุงรักษาไตรมาส 3/2569" value="${esc(plan.planName || '')}">
        </div>
      </div>
    </div>
    ${!plan.quarter ? `
    <div class="empty">เลือกไทรมาสก่อน จึงจะเลือกรถเข้าแผนได้</div>` : `
    <div class="sect">เลือกรถเข้าแผนไทรมาส ${esc(plan.quarter.replace('Q', ''))}${qInfo ? ' (' + esc(qInfo.months) + ')' : ''}</div>
    <div class="sub">เลือกแล้ว ${selected.size} คัน จาก ${regionsSelected.size} เขต${allVehicles.length - joinableAll.length ? ` · มีรถที่เลือกเข้าแผนไม่ได้ ${allVehicles.length - joinableAll.length} คัน (ซ่อมอยู่ · หมดสภาพ · โอนย้าย · รอจำหน่าย)` : ''}</div>
    <div class="chk" style="margin-bottom:12px">
      <label><input type="checkbox" id="chkAllZones" ${allSelected ? 'checked' : ''} ${joinableAll.length === 0 ? 'disabled' : ''}> เลือกทั้งหมด (ทุกเขต) — ${joinableAll.length} คันที่เลือกได้</label>
    </div>
    ${zonesHtml || `<div class="empty">ไม่มีรถ</div>`}`}`;
}

function renderRegionBlock(region, master, selected) {
  const vehicles = regionVehiclesFor(master, region.id);
  const joinable = vehicles.filter(v => MYD.canJoinPlan(v));   // นับจากรถที่เลือกได้จริงเท่านั้น
  const selCount = vehicles.filter(v => selected.has(v.id)).length;
  const blocked = vehicles.length - joinable.length;
  const expanded = !!state.expandedRegions[region.id];

  const rows = vehicles.map(v => {
    const can = MYD.canJoinPlan(v);
    const reason = MYD.blockReason(v);
    return `
    <tr data-id="${esc(v.id)}"${can ? '' : ' class="vrow-blocked"'}>
      <td><input type="checkbox" class="rowChk" data-id="${esc(v.id)}" ${selected.has(v.id) ? 'checked' : ''} ${can ? '' : 'disabled'}></td>
      <td>${esc(v.plate)}</td>
      <td>${esc(v.vehicleType)}
        <div class="cell-sub">${esc(v.brand)}${v.chassis && v.chassis !== '—' ? ' · ' + esc(v.chassis) : ''}</div></td>
      <td>${esc(v.province)}
        <div class="cell-sub">${esc(v.ownerDept)}</div></td>
      <td><span class="badge ${STATUS_BADGE_CLASS[v.status] || 'b-neutral'}">${esc(MYD.STATUS_LABELS[v.status] || v.status)}</span>
        ${reason ? `<div class="cell-sub">${esc(reason)}</div>` : ''}</td>
    </tr>`;
  }).join('');

  return `
    <div class="rzone" data-region="${region.id}">
      <div class="rzone-head" onclick="toggleRegion(${region.id})">
        <span class="ms rzone-caret">${expanded ? 'expand_more' : 'chevron_right'}</span>
        <b>${esc(region.name)}</b>
        <span class="rzone-count">(เลือก ${selCount}/${joinable.length} คัน${blocked ? ` · เลือกไม่ได้ ${blocked}` : ''})</span>
        <label class="rzone-allchk" onclick="event.stopPropagation()">
          <input type="checkbox" class="regionAllChk" data-region="${region.id}" ${joinable.length === 0 ? 'disabled' : ''} ${joinable.length > 0 && selCount === joinable.length ? 'checked' : ''}> เลือกทั้งเขต
        </label>
      </div>
      ${expanded ? `
      <div class="rzone-body">
        <div class="tblwrap">
          <table class="tbl">
            <thead><tr><th></th><th>ทะเบียน</th><th>ประเภท</th><th>จังหวัด</th><th>สถานะ</th></tr></thead>
            <tbody>${rows || `<tr><td colspan="5" class="empty">ไม่มีรถในเขตนี้</td></tr>`}</tbody>
          </table>
        </div>
      </div>` : ''}
    </div>`;
}

function toggleRegion(regionId) {
  if (!state.expandedRegions) state.expandedRegions = {};
  state.expandedRegions[regionId] = !state.expandedRegions[regionId];
  renderWizard(PLAN);
}

function bindStep1(plan) {
  // เปลี่ยนไทรมาสหลังเลือกรถไปแล้วไม่ล้างรถที่เลือก — 1 แผน = 1 ไทรมาส
  // การกดเปลี่ยนจึงเป็น "แก้ไทรมาสของแผนใบนี้" ไม่ใช่ย้ายรถข้ามแผน
  document.querySelectorAll('.qSeg').forEach(sg => {
    sg.addEventListener('click', () => {
      plan.quarter = sg.dataset.q;
      persist(plan);
      renderWizard(plan);
    });
  });

  $('fPlanName').addEventListener('input', e => {
    plan.planName = e.target.value;
    persist(plan);
    updatePrimaryEnabled(plan);
  });

  const master = MYD.loadMaster();
  const allVehicles = master.vehicles;
  // เลือกหมู่ทุกระดับทำงานกับ "รถที่เลือกได้" ชุดเดียวกับที่เรนเดอร์ช่องติ๊ก
  const joinable = vs => vs.filter(v => MYD.canJoinPlan(v));

  const chkAllZones = $('chkAllZones');
  if (chkAllZones) {
    chkAllZones.addEventListener('change', e => {
      plan.selectedVehicleIds = e.target.checked ? joinable(allVehicles).map(v => v.id) : [];
      persist(plan);
      renderWizard(plan);
    });
  }

  document.querySelectorAll('.zoneAllChk').forEach(chk => {
    const zone = chk.dataset.zone;
    const regionIds = new Set(MYD.REGIONS.filter(r => r.zone === zone).map(r => r.id));
    const zoneVehicles = joinable(allVehicles.filter(v => regionIds.has(v.region)));
    const selectedNow = new Set(plan.selectedVehicleIds || []);
    const selCount = zoneVehicles.filter(v => selectedNow.has(v.id)).length;
    chk.indeterminate = selCount > 0 && selCount < zoneVehicles.length;

    chk.addEventListener('change', e => {
      const set = new Set(plan.selectedVehicleIds || []);
      if (e.target.checked) zoneVehicles.forEach(v => set.add(v.id));
      else zoneVehicles.forEach(v => set.delete(v.id));
      plan.selectedVehicleIds = [...set];
      persist(plan);
      renderWizard(plan);
    });
  });

  document.querySelectorAll('.regionAllChk').forEach(chk => {
    const regionId = Number(chk.dataset.region);
    const vehicles = joinable(regionVehiclesFor(master, regionId));
    const selectedNow = new Set(plan.selectedVehicleIds || []);
    const selCount = vehicles.filter(v => selectedNow.has(v.id)).length;
    chk.indeterminate = selCount > 0 && selCount < vehicles.length;

    chk.addEventListener('change', e => {
      const set = new Set(plan.selectedVehicleIds || []);
      if (e.target.checked) vehicles.forEach(v => set.add(v.id));
      else vehicles.forEach(v => set.delete(v.id));
      plan.selectedVehicleIds = [...set];
      persist(plan);
      renderWizard(plan);
    });
  });

  document.querySelectorAll('.rowChk').forEach(chk => {
    chk.addEventListener('change', e => {
      const id = e.target.dataset.id;
      const set = new Set(plan.selectedVehicleIds || []);
      if (e.target.checked) set.add(id); else set.delete(id);
      plan.selectedVehicleIds = [...set];
      persist(plan);
      renderWizard(plan);
    });
  });
}

// ----- รายการอะไหล่/น้ำมัน/ไส้กรอง (คำนวณอย่างเดียว ไม่ให้แก้แล้ว) -----
// ระบบคำนวณจากรถที่เลือกในขั้น 1 → ใช้ในหน้าสรุป + เอกสารฝ่ายพัสดุ
// plan.itemAdj ยังอ่านอยู่เพื่อไม่ทิ้งค่าของแผนเก่าที่เคยแก้มือไว้ตอนยังมีขั้นเลือกอะไหล่
// แต่ไม่มีหน้าจอไหนเขียนค่านี้แล้ว (ตัดขั้นนั้นออก 17 ส.ค. 2569)
function planAdj(plan) {
  if (!plan.itemAdj) plan.itemAdj = {};
  return plan.itemAdj;
}

// คำนวณรายการอะไหล่ของ "รถชุดหนึ่ง" — logic กลางอยู่ที่ MYD.linesFor()
// (ใช้ร่วมกับหน้าฝ่ายพัสดุ ให้เห็นตัวเลขชุดเดียวกัน)
function computeLines(vehicles, master, adj) {
  return MYD.linesFor(vehicles, master, adj);
}

function deriveLinesForPlan(plan) {
  const master = MYD.loadMaster();
  const selectedVehicles = master.vehicles.filter(v => (plan.selectedVehicleIds || []).includes(v.id));
  return { master, selectedVehicles, lines: computeLines(selectedVehicles, master, planAdj(plan)) };
}

function lineRow(l) {
  const tags = [
    l.manual ? '<span class="badge b-brand">เพิ่มเอง</span>' : '',
    l.edited ? '<span class="badge b-low">แก้จำนวนแล้ว</span>' : '',
  ].join(' ');
  return `<tr>
      <td>${esc(l.item.name)} ${tags}
        <div class="cell-sub">${esc(MYD.triggerText(l.item))}</div></td>
      <td class="num">${esc(l.perVehicle)}</td>
      <td class="num">${esc(l.vehicleCount)}</td>
      <td class="num"><b>${esc(l.totalQty)}</b></td>
      <td>${esc(l.item.unit)}</td>
      <td></td>
    </tr>`;
}

// ยอดรวมของกลุ่ม — หน่วยต่างกันบวกรวมกันไม่ได้ จึงรวมแยกตามหน่วย
function unitTotals(lines) {
  const by = {};
  lines.forEach(l => { by[l.item.unit] = (by[l.item.unit] || 0) + l.totalQty; });
  return Object.entries(by).map(([u, n]) => `<b>${n.toLocaleString('th-TH')}</b> ${esc(u)}`).join(' · ');
}

function lineTable(lines) {
  if (!lines.length) return `<div class="empty">ไม่มีรายการ</div>`;
  return `<div class="tblwrap"><table class="tbl itbl">
      <thead><tr><th>ชื่อ</th><th>ต่อคัน</th><th>จำนวนรถ</th><th>รวม</th><th>หน่วย</th><th></th></tr></thead>
      <tbody>${lines.map(l => lineRow(l)).join('')}</tbody>
      <tfoot><tr class="sumrow">
        <td><b>รวมทั้งแผน</b> · ${lines.length} รายการ</td>
        <td colspan="5" style="text-align:right">${unitTotals(lines)}</td>
      </tr></tfoot>
    </table></div>`;
}

// สรุปแผน — ใช้ร่วมกันทั้งขั้นสรุปและ renderIssuedSummary
function computePlanSummary(plan) {
  const { master, selectedVehicles, lines } = deriveLinesForPlan(plan);
  const qInfo = QUARTERS.find(q => q.q === plan.quarter);
  const catSummary = ['part', 'oil', 'filter']
    .map(cat => {
      const catLines = lines.filter(l => l.item.category === cat);
      return catLines.length ? `${esc(MYD.CATEGORY_LABELS[cat])} ${catLines.length} รายการ` : null;
    })
    .filter(Boolean)
    .join(' · ');
  // ใช้ตัวเดียวกับที่อื่นทั้งระบบ (common.js) — เดิมหน้านี้เขียนสูตรซ้ำเอง
  // ข้อความจึงไม่ตรงกับหน้ารายการแผนเวลาข้อความเปลี่ยน
  const periodText = quarterYearText(plan);
  return { master, selectedVehicles, lines, qInfo, catSummary, periodText };
}

// ----- ขั้น 2 (ขั้นสุดท้าย): สรุปแผน + ออกเลขงาน -----
function renderStepSummary(plan) {
  const { master, selectedVehicles, lines, catSummary, periodText } = computePlanSummary(plan);

  // รถแยกตามภาค → เขต
  const byZone = MYD.ZONE_ORDER.map(z => {
    const vs = selectedVehicles.filter(v => MYD.regionZone(v.region) === z);
    if (!vs.length) return null;
    const regions = [...new Set(vs.map(v => v.region))].sort((a, b) => a - b);
    return { label: MYD.ZONE_LABELS[z], count: vs.length, regions };
  }).filter(Boolean);

  // รถแยกตามชนิด
  const byType = [...new Set(selectedVehicles.map(v => v.vehicleType))]
    .map(t => ({ t, n: selectedVehicles.filter(v => v.vehicleType === t).length }));

  // รถแยกตามยี่ห้อ/รุ่นอุปกรณ์
  const byBrand = [...new Set(selectedVehicles.map(v => v.brand))].sort().map(brand => {
    const vs = selectedVehicles.filter(v => v.brand === brand);
    return { brand, chassis: vs[0].chassis, type: vs[0].vehicleType, n: vs.length };
  });

  return `
    <div class="sect">ขั้นที่ 2: สรุปแผน</div>
    <div class="sub">ทวนสอบก่อนส่งขออนุมัติเลขงานกับฝ่ายพัสดุ</div>

    <div class="fgrid">
      <div class="f sp2"><label>ชื่อแผน</label><div>${esc(plan.planName)}</div></div>
      <div class="f sp2"><label>ช่วงเวลา</label><div>${periodText}</div></div>
      <div class="f sp2"><label>รถเข้าแผนบำรุงรักษา</label><div><b style="font-size:20px">${selectedVehicles.length}</b> คัน</div></div>
      <div class="f sp2"><label>รายการอะไหล่ที่ต้องใช้</label><div><b style="font-size:20px">${lines.length}</b> รายการ</div></div>
      <div class="f sp4"><label>แยกตามหมวด</label><div>${catSummary || 'ไม่มีรายการ'}</div></div>
    </div>

    <div class="sect">รถที่เลือกเข้าแผน — แยกตามภาค</div>
    <div class="tblwrap"><table class="tbl itbl">
      <thead><tr><th>ภาค</th><th colspan="2">เขตที่มีรถเข้าแผน</th><th>จำนวนรถ</th><th>หน่วย</th><th></th></tr></thead>
      <tbody>${byZone.map(z => `<tr>
        <td>${esc(z.label)}</td>
        <td colspan="2">${z.regions.map(r => `<span class="badge b-ok">เขต ${r}</span>`).join(' ')}</td>
        <td class="num"><b>${z.count}</b></td>
        <td>คัน</td><td></td>
      </tr>`).join('')}</tbody>
      <tfoot><tr class="sumrow">
        <td><b>รวม</b></td>
        <td colspan="2">${byType.map(x => `<span class="badge b-low">${esc(x.t)} ${x.n}</span>`).join(' ')}</td>
        <td class="num"><b>${selectedVehicles.length}</b></td>
        <td>คัน</td><td></td>
      </tr></tfoot></table></div>

    <div class="sect">รถที่เลือกเข้าแผน — แยกตามยี่ห้อ/รุ่นอุปกรณ์</div>
    <div class="tblwrap"><table class="tbl itbl">
      <thead><tr><th>ยี่ห้อ/รุ่นอุปกรณ์</th><th colspan="2">ชนิดรถ</th><th>จำนวนรถ</th><th>หน่วย</th><th></th></tr></thead>
      <tbody>${byBrand.map(b => `<tr>
        <td><b>${esc(b.brand)}</b>${b.chassis && b.chassis !== '—' ? `<div class="cell-sub">${esc(b.chassis)}</div>` : ''}</td>
        <td colspan="2">${esc(b.type)}</td>
        <td class="num"><b>${b.n}</b></td>
        <td>คัน</td><td></td>
      </tr>`).join('')}</tbody>
      <tfoot><tr class="sumrow">
        <td><b>รวม</b> · ${byBrand.length} ยี่ห้อ</td><td colspan="2"></td>
        <td class="num"><b>${selectedVehicles.length}</b></td><td>คัน</td><td></td>
      </tr></tfoot></table></div>

    <div class="sect">อะไหล่ที่ต้องใช้ในไทรมาสนี้ (ระบบคำนวณจากรถที่เลือก)</div>
    ${lineTable(lines)}

    <div class="sub" style="margin-top:14px">
      <span class="ms" style="font-size:16px">info</span>
      กดออกเลขงานแล้ว ระบบจะ<b>ส่งเอกสารแจ้งฝ่ายพัสดุ</b>ให้ทราบว่าต้องเตรียม/สั่งอะไหล่อะไรบ้าง
    </div>`;
}

// กบค. ออกเลขงานเอง — ฝ่ายพัสดุ "รับทราบ" เพื่อเตรียม/สั่งอะไหล่ ไม่ได้เป็นผู้อนุมัติ
// ไทรมาสในเลขงาน = ไทรมาสที่ผู้ทำแผนเลือกไว้ในขั้นที่ 1 (ไม่ใช่วันที่กดออกเลข)
function issueWorkNumber(plan) {
  if (!confirm('ยืนยันออกเลขงานสำหรับแผนนี้?')) return;
  // แผนร่างที่สร้างไว้ก่อนมีตัวเลือกไทรมาสจะยังไม่มีค่า — เติมจากเดือนปัจจุบันให้เลขงานออกได้
  if (!plan.quarter) plan.quarter = MYD.quarterOfMonth(new Date().getMonth() + 1);
  plan.workNumber = MYD.workNumber(plan.quarter, plan.year, 1);
  plan.approvalStatus = 'issued';
  plan.statusHistory = [...(plan.statusHistory || []), {
    status: 'issued', at: nowTh(), note: 'กบค. ออกเลขงาน ' + plan.workNumber,
  }, {
    status: 'notified', at: nowTh(), note: 'ส่งเอกสารแจ้งฝ่ายพัสดุ — แจ้งรายการอะไหล่ที่ต้องเตรียม/สั่ง',
  }];
  persist(plan);
  toast('ออกเลขงานสำเร็จ: ' + plan.workNumber + ' — ส่งเอกสารแจ้งฝ่ายพัสดุแล้ว');
  render();
}

// ================= หน้าเสร็จสิ้น =================
function renderDone(plan) {
  $('planNewBody').innerHTML = `
    <div class="card">
      <div class="sect">ออกเลขงานเรียบร้อย</div>
      <span class="badge b-ok" style="font-size:17px;padding:8px 18px">${esc(plan.workNumber)}</span>
      <div class="sub" style="margin-top:14px">
        เลขงานนี้คือ<b>หัวข้อของแผนบำรุงรักษาประจำปี</b>นี้ · ส่งเอกสารแจ้งฝ่ายพัสดุแล้ว
      </div>
      <div class="fgrid" style="margin-top:12px">
        <div class="f sp2"><label>ชื่อแผน</label><div>${esc(plan.planName)}</div></div>
        <div class="f sp2"><label>ไทรมาสของแผน</label><div>${quarterYearText(plan)}</div></div>
      </div>
      ${renderTimelineHtml(plan.statusHistory)}
      <div class="actions">
        <a class="btn btn-s" href="plan-new.html">สร้างแผนใหม่อีกใบ</a>
        <a class="btn btn-p" href="index.html#${esc(plan.id)}">เปิดแผนนี้เพื่อทำเฟสต่อไป <span class="ms">arrow_forward</span></a>
      </div>
    </div>`;
}

// ================= RENDER =================
function render() {
  if (PLAN.workNumber) { renderDone(PLAN); return; }
  renderWizard(PLAN);
}

// แผนร่างจะถูกบันทึกก็ต่อเมื่อ "มีเนื้อ" แล้วเท่านั้น (เลือกไทรมาส ตั้งชื่อ หรือเลือกรถ)
// ⚠️ ของเดิมบันทึกทันทีที่เปิดหน้า → เปิดหน้ากี่ครั้งก็ได้ร่างเปล่าเท่านั้นใบ
// ไทรมาสนับเป็นเนื้อด้วย เพราะเป็นช่องแรกที่ต้องเลือก — ถ้าไม่นับ เลือกแล้วรีโหลดค่าจะหาย
function hasContent(plan) {
  return !!plan.quarter || !!(plan.planName && plan.planName.trim()) || (plan.selectedVehicleIds || []).length > 0;
}

// เรียกแทน MYD.savePlan() ทุกจุดในหน้านี้
function persist(plan) {
  if (!hasContent(plan) && !MYD.getPlan(plan.id)) return;   // ยังว่าง + ยังไม่เคยบันทึก → ไม่ต้องเขียน
  MYD.savePlan(plan);
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  const id = (location.hash || '').replace('#', '');
  PLAN = (id && MYD.getPlan(id)) || MYD.newPlan(nowTh());
  render();
});
