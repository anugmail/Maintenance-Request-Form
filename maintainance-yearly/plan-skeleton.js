// plan-skeleton.js — โครงทั้งโฟลว์บำรุงรักษาที่ "แก้โครงได้" (11 หน้าจอ)
//
// ใช้ตอนไปเก็บ requirement — นั่งกับเจ้าของงานแล้ว เพิ่ม/ลด/แก้ชื่อฟิลด์ได้สดๆ
// พร้อมดึง "ตัวอย่างข้อมูลจริง" จาก MYD มาโชว์ข้างๆ ให้เห็นภาพ
// ฟิลด์ที่ยังไม่มีข้อมูลในระบบ = requirement ใหม่ → ติดป้าย "รอข้อมูล" + ใส่โน้ตได้
//
// หน้านี้เป็น "โครงเปล่า" โดยตั้งใจ — ไม่มีคำอธิบายว่าเฟสนี้คืออะไร ใครทำ ลำดับยังไง
// เพราะ flow มีเจ้าของอยู่แล้วที่ Diagram/01-บำรุงรักษาตามวาระ/ ถ้าเขียนซ้ำ 2 ที่จะเพี้ยนกัน
//
// แยกจากหน้าจริงโดยตั้งใจ: แก้ตรงนี้ไม่กระทบ plan-new.html
//   โครงที่ตกลง = ไฟล์นี้ (สัญญา) · ของที่ทำแล้ว = หน้าจริง (สถานะ)
//
// ต้องโหลด common.js + mock-yearly.js + skeleton-data.js ก่อนไฟล์นี้

const SKEL_KEY = 'maintaind.yearly.skeleton.v1';
const ASK_STATUS = { open: 'รอเคาะ', agreed: 'เคาะแล้ว', dropped: 'ตกไป' };
const ASK_BADGE  = { open: 'b-out', agreed: 'b-ok', dropped: 'b-low' };

// ---------- storage + migration ----------
//
// key คงเดิมเสมอ แล้วเก็บรุ่นของ schema ไว้ในก้อนข้อมูลแทน
// (ขึ้น key ใหม่ = ของที่เจ้าของงานแก้ไว้หายทันที ซึ่งเป็นสิ่งเดียวที่ห้ามเกิด)
function migrate(old) {
  const byId = new Map((old.screens || []).map(s => [s.id, s]));
  const screens = DEFAULT_SKEL.screens.map(def => {
    const prev = byId.get(def.id);
    if (!prev) return deepCopy(def);
    byId.delete(def.id);
    // ของที่เจ้าของงานแก้ไว้ชนะเสมอ — เติมเฉพาะคีย์ที่รุ่นเก่ายังไม่มี
    return {
      ...prev,
      group: prev.group ?? def.group,
      no:    prev.no    ?? def.no,
      icon:  prev.icon  ?? def.icon,
      real:  prev.real !== undefined ? prev.real : def.real,
      asks:  prev.asks  ?? deepCopy(def.asks || []),
    };
  });
  // หน้าจอที่เจ้าของงานเพิ่มเองไม่มีใน DEFAULT_SKEL — เก็บไว้ต่อท้าย ห้ามทิ้ง
  byId.forEach(s => screens.push({ group: 'unit', no: '', real: null, asks: [], ...s }));
  return { version: 2, screens };
}

// deepCopy() มาจาก mock-yearly.js (global) — ห้ามประกาศซ้ำ classic script จะ SyntaxError

function loadSkel() {
  try {
    const raw = localStorage.getItem(SKEL_KEY);
    if (!raw) throw 0;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.screens)) throw 0;
    if (s.version === 2) return s;
    const up = migrate(s);            // v1 (หรือไม่มี version) → v2
    localStorage.setItem(SKEL_KEY, JSON.stringify(up));
    return up;
  } catch { return deepCopy(DEFAULT_SKEL); }
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
  let total = 0, shown = 0, waiting = 0, notDone = 0, asks = 0, agreed = 0;
  SKEL.screens.forEach(sc => {
    sc.sections.forEach(se => se.fields.forEach(fd => {
      total++;
      if (fd.show) shown++;
      if (!fd.src) waiting++;
      if (!fd.done) notDone++;
    }));
    (sc.asks || []).forEach(a => { asks++; if (a.status === 'agreed') agreed++; });
  });
  return { total, shown, waiting, notDone, asks, agreed };
}

// ---------- render ----------
function renderTabs() {
  const groups = ['issue', 'phase', 'unit'];
  $('tabs').innerHTML = groups.map(g => {
    const items = SKEL.screens.map((s, i) => ({ s, i })).filter(x => (x.s.group || 'unit') === g);
    if (!items.length) return '';
    return `<div class="wgrp">${esc(GROUP_LABELS[g] || g)}</div>
      <div class="wsteps wrap">${items.map(({ s, i }) => `
        <div class="wstep ${i === cur ? 'active' : ''}" onclick="goScreen(${i})" title="${esc(s.title)}">
          <span class="num">${s.no ? esc(s.no) : `<span class="ms">${esc(s.icon || 'description')}</span>`}</span>
          <span class="lbl">${esc(s.title)}</span>
          <span class="st">${s.real
            ? `<span class="ms done" title="ทำหน้าจริงแล้ว">check_circle</span
               ><a href="${esc(s.real)}" target="_blank" rel="noopener"
                  onclick="event.stopPropagation()" title="เปิดหน้าจริง"><span class="ms">open_in_new</span></a>`
            : '<span class="ms todo" title="ยังเป็นหน้าเปล่า">radio_button_unchecked</span>'}</span>
        </div>`).join('')}</div>`;
  }).join('');
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

function renderAsks() {
  const sc = screenNow();
  const asks = sc.asks || [];
  const nAgreed = asks.filter(a => a.status === 'agreed').length;
  return `<div class="card">
    <div class="page-title-row" style="margin-bottom:6px">
      <h2 style="margin:0"><span class="ms">build</span> เงื่อนไขที่ต้องเคาะ</h2>
      <span class="badge ${nAgreed === asks.length && asks.length ? 'b-ok' : 'b-out'}" style="margin-left:10px">เคาะแล้ว ${nAgreed}/${asks.length}</span>
    </div>
    ${asks.length ? `<div class="tblwrap"><table class="tbl">
      <thead><tr>
        <th style="width:6%">ข้อ</th>
        <th style="width:40%">คำถาม</th>
        <th style="width:34%">คำตอบ</th>
        <th style="width:14%">สถานะ</th>
        <th style="width:6%"></th>
      </tr></thead>
      <tbody>${asks.map((a, i) => `<tr>
        <td><code>${esc(a.id)}</code></td>
        <td>${editMode
              ? `<input value="${esc(a.q)}" oninput="setAsk(${i},'q',this.value)" style="width:100%">`
              : esc(a.q)}</td>
        <td>${editMode
              ? `<input value="${esc(a.ans)}" placeholder="คำตอบจากเจ้าของงาน…" oninput="setAsk(${i},'ans',this.value)" style="width:100%">`
              : esc(a.ans || '—')}</td>
        <td>${editMode
              ? `<select onchange="setAsk(${i},'status',this.value)" style="width:100%">
                   ${Object.keys(ASK_STATUS).map(k => `<option value="${k}" ${a.status === k ? 'selected' : ''}>${esc(ASK_STATUS[k])}</option>`).join('')}
                 </select>`
              : `<span class="badge ${ASK_BADGE[a.status]}">${esc(ASK_STATUS[a.status])}</span>`}</td>
        <td class="num">${editMode
              ? `<button class="btn btn-t btn-sm" onclick="delAsk(${i})" title="ลบ"><span class="ms">delete</span></button>` : ''}</td>
      </tr>`).join('')}</tbody>
    </table></div>` : '<div class="empty">ยังไม่มีคำถามค้างในหน้าจอนี้</div>'}
    ${editMode ? `<div class="actions" style="margin-top:10px">
      <button class="btn btn-s btn-sm" onclick="addAsk()"><span class="ms">add</span> เพิ่มคำถาม</button>
    </div>` : ''}
  </div>`;
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
    (editMode ? `<div class="actions" style="margin-bottom:18px">
      <button class="btn btn-s" onclick="addSection()"><span class="ms">add</span> เพิ่มหัวข้อในหน้านี้</button>
    </div>` : '') +
    renderAsks();
}

function renderCounts() {
  const c = countAll();
  $('counts').innerHTML = `
    <b>${c.total}</b> ฟิลด์ทั้งหมด ·
    <b>${c.shown}</b> เปิดแสดง ·
    <span class="badge b-out">รอข้อมูล ${c.waiting}</span>
    <span class="badge b-low">ยังไม่ทำในหน้าจริง ${c.notDone}</span>
    <span class="badge ${c.agreed === c.asks && c.asks ? 'b-ok' : 'b-brand'}">เคาะแล้ว ${c.agreed}/${c.asks}</span>`;
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
function setAsk(i, k, v) {
  screenNow().asks[i][k] = v; saveSkel();
  if (k === 'status') render(); else renderCounts();
}
function addAsk() {
  const text = prompt('คำถามใหม่ที่ต้องเคาะกับเจ้าของงาน');
  if (!text || !text.trim()) return;
  const sc = screenNow();
  sc.asks = sc.asks || [];
  sc.asks.push({ id: `${sc.no || sc.id}.${sc.asks.length + 1}`, q: text.trim(), ans: '', status: 'open' });
  saveSkel(); render(); toast('เพิ่มคำถามแล้ว');
}
function delAsk(i) {
  const sc = screenNow();
  if (!confirm(`ลบคำถาม "${sc.asks[i].q}"?`)) return;
  sc.asks.splice(i, 1); saveSkel(); render(); toast('ลบคำถามแล้ว');
}

// ---------- export ----------
function exportMd() {
  const c = countAll();
  let md = `# โครงหน้าจอทั้งโฟลว์บำรุงรักษา — ที่ตกลงกับเจ้าของงาน\n\n`;
  md += `> สร้างจาก \`maintainance-yearly/plan-skeleton.html\` · ${nowTh()}\n`;
  md += `> **${SKEL.screens.length}** หน้าจอ · **${c.total}** ฟิลด์ · เปิดแสดง **${c.shown}** · `;
  md += `**รอข้อมูล ${c.waiting}** · **ยังไม่ทำในหน้าจริง ${c.notDone}** · **เคาะแล้ว ${c.agreed}/${c.asks}**\n\n`;

  SKEL.screens.forEach(sc => {
    const st = sc.real ? `✅ ทำแล้ว — \`${sc.real}\`` : '⬜ ยังเป็นหน้าเปล่า';
    md += `## [${GROUP_LABELS[sc.group] || sc.group}] ${sc.no ? sc.no + ' · ' : ''}${sc.title}\n\n${st}\n\n`;

    sc.sections.forEach(se => {
      md += `### ${se.title}\n\n`;
      md += `| ฟิลด์ | แสดง | ข้อมูลจากไหน | ทำแล้ว | โน้ต |\n|---|---|---|---|---|\n`;
      se.fields.forEach(fd => {
        md += `| ${fd.label} | ${fd.show ? '✓' : '✗'} | ${fd.src ? (SRC_LABELS[fd.src] || fd.src) : '**ยังไม่มีข้อมูล**'} | ${fd.done ? '✓' : '✗'} | ${fd.note || ''} |\n`;
      });
      md += `\n`;
    });

    if ((sc.asks || []).length) {
      md += `### เงื่อนไขที่ต้องเคาะ\n\n`;
      sc.asks.forEach(a => {
        const box = a.status === 'agreed' ? 'x' : ' ';
        const tail = a.status === 'dropped' ? ' _(ตกไป)_' : (a.ans ? ` — **ตอบ:** ${a.ans}` : '');
        md += `- [${box}] **${a.id}** ${a.q}${tail}\n`;
      });
      md += `\n`;
    }

    const sw = sc.sections.flatMap(s => s.fields).filter(x => !x.src).length;
    const sn = sc.sections.flatMap(s => s.fields).filter(x => !x.done).length;
    md += `_ช่องว่าง: รอข้อมูล ${sw} · ยังไม่ทำในหน้าจริง ${sn}_\n\n`;
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
