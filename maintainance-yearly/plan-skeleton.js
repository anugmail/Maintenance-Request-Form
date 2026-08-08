// plan-skeleton.js — โครงหน้า "ออกเลขงาน" ที่ "แก้โครงได้" (แบบ B+)
//
// ใช้ตอนไปเก็บ requirement — นั่งกับเจ้าของงานแล้ว เพิ่ม/ลด/แก้ชื่อคอลัมน์ได้สดๆ
// พร้อมดึง "ตัวอย่างข้อมูลจริง" จาก MYD มาโชว์ข้างๆ ให้เห็นภาพ
// คอลัมน์ที่ยังไม่มีข้อมูลในระบบ = requirement ใหม่ → ติดป้าย "รอข้อมูล" + ใส่โน้ตได้
//
// แยกจากหน้าจริงโดยตั้งใจ: แก้ตรงนี้ไม่กระทบ plan-new.html
//   โครงที่ตกลง = ไฟล์นี้ (สัญญา) · ของที่ทำแล้ว = หน้าจริง (สถานะ)
// เก็บใน localStorage แยก key + Export เป็น Markdown แปะเข้า plan.md ได้
//
// ต้องโหลด common.js + mock-yearly.js ก่อนไฟล์นี้

const SKEL_KEY = 'maintaind.yearly.skeleton.v1';

// ---------- ตัวอย่างข้อมูลจริง ----------
// src ของฟิลด์ต้องเป็น key ในตารางนี้ ถ้าไม่มี = ยังไม่มีข้อมูลในระบบ (requirement ใหม่)
let master, plan, sampleV, sampleL, planLines;

function buildSample() {
  master = MYD.loadMaster();
  plan = MYD.loadPlans()[0] || MYD.SEED_PLAN;
  const r = MYD.planLines(plan, master);
  planLines = r.lines;
  sampleV = r.vehicles[0] || master.vehicles[0];
  sampleL = planLines[0];
}

const SAMPLE = {
  'p.workNumber':  () => plan.workNumber || '(ยังไม่ออกเลข)',
  'p.planName':    () => plan.planName,
  'p.period':      () => quarterYearText(plan),
  'p.vehCount':    () => (plan.selectedVehicleIds || []).length + ' คัน',
  'p.lineCount':   () => planLines.length + ' รายการ',
  'p.ack':         () => plan.suppliesAckAt ? 'รับทราบแล้ว' : 'รอรับทราบ',
  'v.plate':       () => sampleV.plate,
  'v.vehicleType': () => sampleV.vehicleType,
  'v.brand':       () => sampleV.brand,
  'v.chassis':     () => sampleV.chassis,
  'v.status':      () => MYD.STATUS_LABELS[sampleV.status] || sampleV.status,
  'v.region':      () => 'เขต ' + sampleV.region,
  'v.zone':        () => MYD.ZONE_LABELS[MYD.regionZone(sampleV.region)],
  'v.mileage':     () => sampleV.mileage.toLocaleString('th-TH') + ' กม.',
  'v.engineHours': () => sampleV.engineHours.toLocaleString('th-TH') + ' ชม.',
  'i.name':        () => sampleL && sampleL.item.name,
  'i.trigger':     () => sampleL && MYD.triggerText(sampleL.item),
  'i.perVehicle':  () => sampleL && sampleL.perVehicle,
  'i.vehicleCount':() => sampleL && sampleL.vehicleCount,
  'i.totalQty':    () => sampleL && sampleL.totalQty,
  'i.unit':        () => sampleL && sampleL.item.unit,
  'i.category':    () => sampleL && MYD.CATEGORY_LABELS[sampleL.item.category],
};

const SRC_LABELS = {
  '': '— ยังไม่มีข้อมูลในระบบ —',
  'p.workNumber': 'แผน · เลขงาน', 'p.planName': 'แผน · ชื่อแผน', 'p.period': 'แผน · ไทรมาส/ปี',
  'p.vehCount': 'แผน · จำนวนรถ', 'p.lineCount': 'แผน · จำนวนรายการอะไหล่', 'p.ack': 'แผน · สถานะพัสดุ',
  'v.plate': 'รถ · ทะเบียน', 'v.vehicleType': 'รถ · ชนิดรถ', 'v.brand': 'รถ · ยี่ห้อ/รุ่นอุปกรณ์',
  'v.chassis': 'รถ · ยี่ห้อรถบรรทุก', 'v.status': 'รถ · สถานะ', 'v.region': 'รถ · เขต', 'v.zone': 'รถ · ภาค',
  'v.mileage': 'รถ · เลขไมล์', 'v.engineHours': 'รถ · ชม.เครื่อง',
  'i.name': 'อะไหล่ · ชื่อ', 'i.trigger': 'อะไหล่ · เงื่อนไขรอบ', 'i.perVehicle': 'อะไหล่ · ต่อคัน',
  'i.vehicleCount': 'อะไหล่ · จำนวนรถ', 'i.totalQty': 'อะไหล่ · รวม', 'i.unit': 'อะไหล่ · หน่วย',
  'i.category': 'อะไหล่ · หมวด',
};

// ---------- โครงตั้งต้น = สิ่งที่หน้าจริงมีอยู่ตอนนี้ ----------
// done:true = ทำในหน้าจริงแล้ว · false = ตกลงกันไว้แต่ยังไม่ทำ
const f = (key, label, src, done = true) => ({ key, label, src, show: true, note: '', done });

const DEFAULT_SKEL = {
  screens: [
    { id: 's1', title: 'ขั้น 1 · ชื่อแผน + เลือกรถ', sections: [
      { id: 's1-head', title: 'หัวแผน', kind: 'form', fields: [
        f('planName', 'ชื่อแผน', 'p.planName'),
      ]},
      { id: 's1-veh', title: 'ตารางรถในเขต (ภาค → เขต → กางออก)', kind: 'table', fields: [
        f('chk',   'ช่องเลือก', ''),
        f('plate', 'ทะเบียน', 'v.plate'),
        f('type',  'ประเภท', 'v.vehicleType'),
        f('brand', 'ยี่ห้อ/รุ่นอุปกรณ์', 'v.brand'),
        f('status','สถานะ', 'v.status'),
      ]},
    ]},

    { id: 's2', title: 'ขั้น 2 · รายการอะไหล่', sections: [
      { id: 's2-tool', title: 'แถบเครื่องมือ', kind: 'form', fields: [
        f('group', 'จัดกลุ่ม (ชนิดอะไหล่/ภาค/เขต/ยี่ห้อ)', ''),
        f('add',   'เพิ่มอะไหล่เข้าแผน', ''),
      ]},
      { id: 's2-tbl', title: 'ตารางอะไหล่ (แก้จำนวน/ลบได้)', kind: 'table', fields: [
        f('name',  'ชื่อ', 'i.name'),
        f('per',   'ต่อคัน', 'i.perVehicle'),
        f('nveh',  'จำนวนรถ', 'i.vehicleCount'),
        f('total', 'รวม', 'i.totalQty'),
        f('unit',  'หน่วย', 'i.unit'),
        f('del',   'ปุ่มลบ', ''),
      ]},
    ]},

    { id: 's3', title: 'ขั้น 3 · สรุปแผนทั้งปี', sections: [
      { id: 's3-sum', title: 'กล่องสรุปหัวหน้า', kind: 'form', fields: [
        f('planName', 'ชื่อแผน', 'p.planName'),
        f('period',   'ช่วงเวลา', 'p.period'),
        f('nveh',     'รถเข้าแผนบำรุงรักษา', 'p.vehCount'),
        f('nline',    'รายการอะไหล่ที่ต้องใช้', 'p.lineCount'),
      ]},
      { id: 's3-zone', title: 'ตารางรถแยกตามภาค', kind: 'table', fields: [
        f('zone',  'ภาค', 'v.zone'),
        f('regs',  'เขตที่มีรถเข้าแผน', 'v.region'),
        f('n',     'จำนวนรถ', 'p.vehCount'),
      ]},
      { id: 's3-brand', title: 'ตารางรถแยกตามยี่ห้อ/รุ่นอุปกรณ์', kind: 'table', fields: [
        f('brand',   'ยี่ห้อ/รุ่นอุปกรณ์', 'v.brand'),
        f('chassis', 'ยี่ห้อรถบรรทุก', 'v.chassis'),
        f('type',    'ชนิดรถ', 'v.vehicleType'),
        f('n',       'จำนวนรถ', 'p.vehCount'),
      ]},
      { id: 's3-items', title: 'ตารางอะไหล่ที่ต้องใช้ทั้งปี', kind: 'table', fields: [
        f('name',  'ชื่อ', 'i.name'),
        f('per',   'ต่อคัน', 'i.perVehicle'),
        f('nveh',  'จำนวนรถ', 'i.vehicleCount'),
        f('total', 'รวม', 'i.totalQty'),
        f('unit',  'หน่วย', 'i.unit'),
      ]},
    ]},

    { id: 'sup', title: 'หน้าฝ่ายพัสดุ · เอกสารแจ้งเตรียมอะไหล่', sections: [
      { id: 'sup-head', title: 'หัวเอกสาร', kind: 'form', fields: [
        f('wn',     'เลขงาน', 'p.workNumber'),
        f('ack',    'สถานะรับทราบ', 'p.ack'),
        f('name',   'ชื่อแผน', 'p.planName'),
        f('period', 'ไทรมาสที่ออกเลขงาน', 'p.period'),
        f('nveh',   'รถเข้าแผน', 'p.vehCount'),
        f('nline',  'รายการอะไหล่ที่ต้องเตรียม', 'p.lineCount'),
      ]},
      { id: 'sup-items', title: 'ตารางอะไหล่ที่ต้องเตรียม/สั่ง', kind: 'table', fields: [
        f('name',  'ชื่อ', 'i.name'),
        f('per',   'ต่อคัน', 'i.perVehicle'),
        f('nveh',  'จำนวนรถ', 'i.vehicleCount'),
        f('total', 'รวมที่ต้องเตรียม', 'i.totalQty'),
        f('unit',  'หน่วย', 'i.unit'),
      ]},
    ]},
  ],
};

// ---------- storage ----------
function loadSkel() {
  try {
    const raw = localStorage.getItem(SKEL_KEY);
    if (!raw) throw 0;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.screens)) throw 0;
    return s;
  } catch { return JSON.parse(JSON.stringify(DEFAULT_SKEL)); }
}
function saveSkel() { localStorage.setItem(SKEL_KEY, JSON.stringify(SKEL)); }
function resetSkel() { localStorage.removeItem(SKEL_KEY); SKEL = loadSkel(); }

let SKEL = null;
let cur = 0;          // หน้าจอที่กำลังดู
let editMode = true;  // โหมดแก้โครง

// ---------- helpers ----------
const screenNow = () => SKEL.screens[cur];
function findSec(secId) { return screenNow().sections.find(s => s.id === secId); }
function sampleFor(src) {
  if (!src || !SAMPLE[src]) return null;
  try { const v = SAMPLE[src](); return v == null ? null : String(v); } catch { return null; }
}
function countAll() {
  let total = 0, shown = 0, waiting = 0, notDone = 0;
  SKEL.screens.forEach(sc => sc.sections.forEach(se => se.fields.forEach(fd => {
    total++;
    if (fd.show) shown++;
    if (!fd.src) waiting++;
    if (!fd.done) notDone++;
  })));
  return { total, shown, waiting, notDone };
}

// ---------- render ----------
function renderTabs() {
  $('tabs').innerHTML = `<div class="wsteps">${SKEL.screens.map((s, i) => `
    <div class="wstep ${i === cur ? 'active' : ''}" onclick="goScreen(${i})" title="${esc(s.title)}">
      <span class="num">${i + 1}</span><span class="lbl">${esc(s.title)}</span>
    </div>`).join('')}</div>`;
}

function fieldRow(secId, fd, i, len) {
  const smp = sampleFor(fd.src);
  return `<tr>
    <td>
      ${editMode
        ? `<input value="${esc(fd.label)}" oninput="setField('${secId}',${i},'label',this.value)" style="width:100%">`
        : `<b>${esc(fd.label)}</b>`}
      ${fd.done ? '' : '<span class="badge b-low" style="margin-top:4px;display:inline-block">ยังไม่ทำในหน้าจริง</span>'}
    </td>
    <td class="num">
      ${editMode
        ? `<input type="checkbox" ${fd.show ? 'checked' : ''} onchange="setField('${secId}',${i},'show',this.checked)">`
        : (fd.show ? '<span class="ms">check</span>' : '')}
    </td>
    <td>
      ${editMode
        ? `<select onchange="setField('${secId}',${i},'src',this.value)" style="width:100%">
             ${Object.keys(SRC_LABELS).map(k => `<option value="${k}" ${fd.src === k ? 'selected' : ''}>${esc(SRC_LABELS[k])}</option>`).join('')}
           </select>`
        : (fd.src ? esc(SRC_LABELS[fd.src] || fd.src) : '—')}
    </td>
    <td>${smp !== null
          ? `<code>${esc(smp)}</code>`
          : '<span class="badge b-out">รอข้อมูล</span>'}</td>
    <td>${editMode
          ? `<input value="${esc(fd.note)}" placeholder="โน้ตจากเจ้าของงาน…" oninput="setField('${secId}',${i},'note',this.value)" style="width:100%">`
          : esc(fd.note || '—')}</td>
    <td class="num" style="white-space:nowrap">
      ${editMode ? `
        <button class="btn btn-t btn-sm" onclick="moveField('${secId}',${i},-1)" ${i === 0 ? 'disabled' : ''} title="เลื่อนขึ้น"><span class="ms">arrow_upward</span></button>
        <button class="btn btn-t btn-sm" onclick="moveField('${secId}',${i},1)" ${i === len - 1 ? 'disabled' : ''} title="เลื่อนลง"><span class="ms">arrow_downward</span></button>
        <button class="btn btn-t btn-sm" onclick="delField('${secId}',${i})" title="ลบ"><span class="ms">delete</span></button>` : ''}
    </td>
  </tr>`;
}

// พรีวิว: แสดงเฉพาะฟิลด์ที่ติ๊ก "แสดง" พร้อมข้อมูลตัวอย่างจริง
function preview(sec) {
  const on = sec.fields.filter(x => x.show);
  if (!on.length) return `<div class="empty">ไม่มีฟิลด์ที่เปิดแสดง</div>`;
  if (sec.kind === 'form') {
    return `<div class="fgrid">${on.map(x => {
      const s = sampleFor(x.src);
      return `<div class="f sp2"><label>${esc(x.label)}</label>
        <div>${s !== null ? esc(s) : '<span class="badge b-out">รอข้อมูล</span>'}</div></div>`;
    }).join('')}</div>`;
  }
  return `<div class="tblwrap"><table class="tbl">
    <thead><tr>${on.map(x => `<th>${esc(x.label)}</th>`).join('')}</tr></thead>
    <tbody><tr>${on.map(x => {
      const s = sampleFor(x.src);
      return `<td>${s !== null ? esc(s) : '<span class="badge b-out">รอข้อมูล</span>'}</td>`;
    }).join('')}</tr>
    <tr><td colspan="${on.length}" class="empty" style="padding:8px">…แถวที่เหลือใช้รูปแบบเดียวกัน</td></tr></tbody>
  </table></div>`;
}

function renderBody() {
  const sc = screenNow();
  $('body').innerHTML = sc.sections.map(sec => `
    <div class="card">
      <div class="page-title-row" style="margin-bottom:6px">
        ${editMode
          ? `<input value="${esc(sec.title)}" oninput="setSecTitle('${sec.id}',this.value)"
               style="font-size:16px;font-weight:600;width:100%;max-width:520px">`
          : `<h2 style="margin:0">${esc(sec.title)}</h2>`}
        <span class="badge b-ok" style="margin-left:10px">${sec.fields.filter(x => x.show).length}/${sec.fields.length} ฟิลด์</span>
        ${editMode ? `<button class="btn btn-t btn-sm" style="margin-left:auto" onclick="delSection('${sec.id}')" title="ลบหัวข้อนี้"><span class="ms">delete</span> ลบหัวข้อ</button>` : ''}
      </div>

      <div class="tblwrap"><table class="tbl">
        <thead><tr>
          <th style="width:24%">ชื่อฟิลด์ / คอลัมน์</th>
          <th style="width:7%" class="num">แสดง</th>
          <th style="width:20%">ข้อมูลจากไหน</th>
          <th style="width:17%">ตัวอย่างจริง</th>
          <th style="width:22%">โน้ต</th>
          <th style="width:10%"></th>
        </tr></thead>
        <tbody>${sec.fields.map((fd, i) => fieldRow(sec.id, fd, i, sec.fields.length)).join('')}</tbody>
      </table></div>

      ${editMode ? `<div class="actions" style="margin-top:10px">
        <button class="btn btn-s btn-sm" onclick="addField('${sec.id}')"><span class="ms">add</span> เพิ่มฟิลด์</button>
      </div>` : ''}

      <div class="sect" style="margin-top:18px">พรีวิว</div>
      ${preview(sec)}
    </div>`).join('') +
    (editMode ? `<div class="actions">
      <button class="btn btn-s" onclick="addSection()"><span class="ms">add</span> เพิ่มหัวข้อในหน้านี้</button>
    </div>` : '');
}

function renderCounts() {
  const c = countAll();
  $('counts').innerHTML = `
    <b>${c.total}</b> ฟิลด์ทั้งหมด ·
    <b>${c.shown}</b> เปิดแสดง ·
    <span class="badge b-out">รอข้อมูล ${c.waiting}</span>
    <span class="badge b-low">ยังไม่ทำในหน้าจริง ${c.notDone}</span>`;
}

function render() { renderTabs(); renderBody(); renderCounts(); }

// ---------- actions ----------
function goScreen(i) { cur = i; render(); window.scrollTo({ top: 0 }); }
function setField(secId, i, k, v) { findSec(secId).fields[i][k] = v; saveSkel(); if (k !== 'label' && k !== 'note') render(); else renderCounts(); }
function setSecTitle(secId, v) { findSec(secId).title = v; saveSkel(); }
function moveField(secId, i, d) {
  const arr = findSec(secId).fields; const j = i + d;
  if (j < 0 || j >= arr.length) return;
  [arr[i], arr[j]] = [arr[j], arr[i]]; saveSkel(); render();
}
function delField(secId, i) {
  const sec = findSec(secId);
  if (!confirm(`ลบฟิลด์ "${sec.fields[i].label}"?`)) return;
  sec.fields.splice(i, 1); saveSkel(); render(); toast('ลบฟิลด์แล้ว');
}
function addField(secId) {
  const label = prompt('ชื่อฟิลด์/คอลัมน์ใหม่ (เช่น ชม.เครื่อง)');
  if (!label || !label.trim()) return;
  findSec(secId).fields.push({ key: 'x' + Date.now().toString(36), label: label.trim(), src: '', show: true, note: '', done: false });
  saveSkel(); render(); toast('เพิ่มฟิลด์แล้ว — เลือกแหล่งข้อมูลได้ถ้ามี');
}
function addSection() {
  const title = prompt('ชื่อหัวข้อใหม่');
  if (!title || !title.trim()) return;
  screenNow().sections.push({ id: 'sec' + Date.now().toString(36), title: title.trim(), kind: 'table', fields: [] });
  saveSkel(); render();
}
function delSection(secId) {
  const sec = findSec(secId);
  if (!confirm(`ลบหัวข้อ "${sec.title}" ทั้งหมด?`)) return;
  screenNow().sections = screenNow().sections.filter(s => s.id !== secId);
  saveSkel(); render(); toast('ลบหัวข้อแล้ว');
}

// ---------- export ----------
function exportMd() {
  const c = countAll();
  let md = `# โครงหน้า "ออกเลขงาน" — ที่ตกลงกับเจ้าของงาน\n\n`;
  md += `> สร้างจาก \`maintainance-yearly/plan-skeleton.html\` · ${nowTh()}\n`;
  md += `> รวม **${c.total}** ฟิลด์ · เปิดแสดง **${c.shown}** · **รอข้อมูล ${c.waiting}** · **ยังไม่ทำในหน้าจริง ${c.notDone}**\n\n`;
  SKEL.screens.forEach(sc => {
    md += `## ${sc.title}\n\n`;
    sc.sections.forEach(se => {
      md += `### ${se.title}\n\n`;
      md += `| ฟิลด์ | แสดง | ข้อมูลจากไหน | ทำแล้ว | โน้ต |\n|---|---|---|---|---|\n`;
      se.fields.forEach(fd => {
        md += `| ${fd.label} | ${fd.show ? '✓' : '✗'} | ${fd.src ? (SRC_LABELS[fd.src] || fd.src) : '**ยังไม่มีข้อมูล**'} | ${fd.done ? '✓' : '✗'} | ${fd.note || ''} |\n`;
      });
      md += `\n`;
    });
  });
  $('mdout').value = md;
  $('mdwrap').classList.remove('hidden');
  $('mdout').select();
  toast('สร้าง Markdown แล้ว — กด Ctrl/Cmd+C คัดลอกไปแปะ plan.md ได้เลย');
}

// ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
  buildSample();
  SKEL = loadSkel();
  render();

  $('btnEdit').addEventListener('click', () => {
    editMode = !editMode;
    $('btnEdit').innerHTML = editMode
      ? '<span class="ms">visibility</span> ดูอย่างเดียว'
      : '<span class="ms">edit</span> โหมดแก้โครง';
    render();
  });
  $('btnExport').addEventListener('click', exportMd);
  $('btnResetSkel').addEventListener('click', () => {
    if (!confirm('คืนโครงตั้งต้น? สิ่งที่แก้ไว้ทั้งหมดจะหาย')) return;
    resetSkel(); render(); toast('คืนโครงตั้งต้นแล้ว');
  });
});
