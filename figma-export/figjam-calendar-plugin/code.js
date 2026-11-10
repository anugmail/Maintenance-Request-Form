/* ============================================================
   Maintain-D — Card Calendar · ฝั่ง sandbox
   ------------------------------------------------------------
   รับข้อความ CSV (export ของ Trello / ไฟล์ import ที่เราเขียน) จาก ui.html
   แล้ววางการ์ดลงปฏิทินบนบอร์ด FigJam:
     คอลัมน์ = sprint (SP08 = 2–13 พ.ย. 2569 แล้วนับต่อทีละ 2 สัปดาห์ · ตั้งค่าได้ใน ui)
             + คอลัมน์ท้าย "ยังไม่ลง sprint" สำหรับการ์ด [SPxx]
     แถว    = UC ตามเลขการ์ด [PEA-1.<UC>.<running>] หรือ [MD-JO<n>-UC-<UC>(-<sub>)] (ของที่ยังไม่มีเลข PEA)
     การ์ด  = ShapeWithText สีตามทีม ⭐️ / ❤️ · การ์ด Done เป็นสีเทาพร้อม ✓
   หัวคอลัมน์มีช่วงวันที่ + แต้มรวมต่อทีม · เส้น "วันนี้" ในคอลัมน์ sprint ปัจจุบัน

   รันซ้ำ = update โหนดเดิมในตำแหน่งเดิม (จับคู่ด้วยชื่อ เช่น 'card / 1.23.1', 'uc / 1.7')
   ไม่ลบ section แล้วสร้างใหม่ทั้งก้อน — โหนดที่ตรงชื่อถูก reuse (ขยับ/resize/เปลี่ยนสี-ข้อความในที่เดิม)
   โหนดเดิมที่ไฟล์ CSV รอบนี้ไม่มี (เช่น เลือกไฟล์ไม่ครบ หรือการ์ดถูกลบจาก Trello ไปแล้ว) "ไม่ถูกลบ" — ปล่อยอยู่กับที่เสมอ
   ดังนั้นรอบไหนอยากให้ตรงกับ Trello 100% ต้องเลือกไฟล์ CSV ให้ครบทุกไฟล์ที่เคยใช้วางมาก่อน ไม่ใช่ปล่อยให้ plugin ลบเอง
   ฟังก์ชันล้วนส่วนบน (parse/layout) export ให้เทสใน node ได้ — ดู test-figjam-calendar-plugin.js
   ============================================================ */

const SECTION_NAME = 'Card Calendar · Maintain-D';

/* ชื่อ UC จาก project_timeline_1760 (ชีต "Project timeline (1,760)") — เลขกลางของการ์ด 1.<UC>.n
   คีย์ <JO>.<UC> ใช้ร่วมกันทั้งการ์ดที่มีเลข PEA-1.<UC>.n แล้ว และการ์ดที่ยังไม่มีเลข (ชื่อ [MD-JO1-UC-<UC>…])
   จึงรวมแถวเดียวกันได้แม้สลับมาใช้เลข PEA จริงทีหลัง */
const UC_NAMES = {
  '1.0': 'พื้นฐานระบบ · Login · Permission',
  '1.1': 'UC-01 แจ้งซ่อม',
  '1.2': 'UC-02 รับเรื่อง · พิจารณาแจ้งซ่อม',
  '1.3': 'UC-03 บันทึกผลซ่อม · ส่งมอบรถ',
  '1.4': 'UC-04 รายการซ่อม · อะไหล่ · ค่าใช้จ่าย',
  '1.5': 'UC-05 ประวัติการซ่อม',
  '1.6': 'UC-06 ศูนย์บริการ · อู่',
  '1.7': 'UC-07 กำหนดตารางบำรุงรักษา',
  '1.8': 'UC-08 ปฏิทินแผนบำรุงรักษา',
  '1.9': 'UC-09 แจ้งเตือนบำรุงรักษา',
  '1.15': 'UC-15 อนุมัติการซ่อม (รถทั่วไป)',
  '1.16': 'UC-16 ซ่อมรถติดตั้งเครื่องมือกล',
  '1.17': 'UC-17 ตรวจสภาพ · ปิดงาน · รับประกัน',
  '1.18': 'UC-18 ทะเบียนอู่ (ส่วนเพิ่ม)',
  '1.19': 'UC-19 ทะเบียนรถติดตั้งเครื่องมือกล',
  '1.20': 'UC-20 เกณฑ์บำรุงรักษา · นำเข้า · Dashboard',
  '1.21': 'UC-21 วางแผนบำรุงรักษาเครื่องมือกล',
  '1.22': 'UC-22 บันทึกผลบำรุงรักษา',
  '1.23': 'UC-23 วางแผน Overhaul',
  '1.24': 'UC-24 ดำเนินการ Overhaul',
  '1.25': 'UC-25 รายงาน · แบบฟอร์ม · เอกสาร',
  '1.PRE': 'JO1 Pre-deploy (UAT · Security Scan)',
  '1.DEP': 'JO1 Deploy (UAT → Production)',
  '1.POST': 'JO1 Post-deploy (คู่มือ · KT)',
  '2.1': 'JO2 UC-01 เริ่ม-จบงาน · ผู้ควบคุมรถ',
  '2.2': 'JO2 UC-02 เลขไมล์ · ชั่วโมงเครื่องจักร',
  '2.3': 'JO2 UC-03 ดูการมอบหมาย-นำรถออกปฏิบัติงาน',
  '2.4': 'JO2 UC-04 ค่าใช้จ่ายตามศูนย์ต้นทุน/เลขงาน',
  '2.5': 'JO2 UC-05 ค้นหารถที่พร้อมให้ยืม',
  '2.6': 'JO2 UC-06 ขอยืมรถ · ติดตามสถานะ',
  '2.7': 'JO2 UC-07 Checklist ตรวจสภาพก่อน-หลังยืม',
  '2.8': 'JO2 UC-08 โอนย้ายรถระหว่างหน่วยงาน',
  '2.9': 'JO2 UC-09 แจ้งหยุดใช้งาน · หยุดชำระภาษี',
  '2.10': 'JO2 UC-10 กำหนดวิธีจำหน่ายทรัพย์สิน',
  '2.11': 'JO2 UC-11 รายชื่อรถที่ต้องพิจารณาจำหน่าย',
  '2.12': 'JO2 UC-12 สถานะ · ประวัติการจำหน่าย',
  '2.PRE': 'JO2 Pre-deploy (UAT · Security Scan)',
  '2.DEP': 'JO2 Deploy (UAT → Production)',
  '2.POST': 'JO2 Post-deploy (คู่มือ · KT)',
  '3.1': 'JO3 UC-01 บัญชีลูกค้าธนาคารต่อหน่วยงาน',
  '3.2': 'JO3 UC-02 ข้อมูลหลัก Fleet Card',
  '3.3': 'JO3 UC-03 บันทึกเติมน้ำมัน · แนบสลิป',
  '3.4': 'JO3 UC-04 ค้นหาเติมน้ำมันย้อนหลัง',
  '3.5': 'JO3 UC-05 Import Transaction · Reconciliation',
  '3.6': 'JO3 UC-06 Statement รายเดือน',
  '3.7': 'JO3 UC-07 เบิกจ่าย · Interface SAP',
  '3.8': 'JO3 UC-08 ตรวจสอบสถานะ SAP',
  '3.PRE': 'JO3 Pre-deploy (UAT · Security Scan)',
  '3.DEP': 'JO3 Deploy (UAT → Production)',
  '3.POST': 'JO3 Post-deploy (คู่มือ · KT)'
};
const NO_UC = 'ไม่มีเลข UC';
const UNSCHEDULED = 'ยังไม่ลง sprint';
const DONE_NO_SPRINT = 'Done · ไม่ระบุ sprint';
/* เกณฑ์สี % ความคืบหน้า (การ์ดรายงานสถานะ เช่น JO-เลขข้อ-สถานะการ์ด.csv) — มีไปบางแล้ว (>0%) = เหลือง · ทำไปเยอะแล้ว (≥ เกณฑ์นี้) = เขียว */
const PROGRESS_GREEN_AT = 0.7;

const DEFAULTS = {
  anchorSprint: 8,
  anchorStart: '2026-11-02',   // จันทร์ — SP08 = 2–13 พ.ย. 2569
  weeks: 2,
  extraSprints: 0,             // แสดงคอลัมน์ว่างต่อจาก sprint ล่าสุดอีกกี่ช่อง
  untilMonth: '2027-02',       // แสดงคอลัมน์ไปจนถึงเดือนนี้ (ก.พ. 2570 — เจ้าของงานขอ 2 พ.ย. 2569) · ว่าง = ไม่บังคับ
  includeDefects: false,
  includeNoNumber: false
};

/* ---------------- CSV ---------------- */
function parseCSV(text) {
  const rows = []; let row = []; let field = ''; let q = false;
  text = String(text).replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else q = false; }
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(f => f !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some(f => f !== '')) rows.push(row);
  return rows;
}

/* แปลงแถว CSV → การ์ด · คืน { cards, skipped } */
function cardsFromCSV(text, opt) {
  opt = Object.assign({}, DEFAULTS, opt || {});
  const rows = parseCSV(text);
  if (!rows.length) return { cards: [], skipped: { template: 0, defect: 0, noNumber: 0 } };
  const head = rows[0].map(h => h.trim().toLowerCase());
  const col = (re) => head.findIndex(h => re.test(h));
  const iName = col(/card name|^name$|^title$/);
  const iList = col(/current list|^list$/);
  const iLabels = col(/label|tag/);
  if (iName < 0) throw new Error('CSV ไม่มีคอลัมน์ "Card Name"');
  const skipped = { template: 0, defect: 0, noNumber: 0 };
  const cards = [];
  for (const r of rows.slice(1)) {
    const name = (r[iName] || '').trim();
    if (!name) continue;
    if (/X\.X\.X/.test(name)) { skipped.template++; continue; }
    const defect = /\[defect\]/i.test(name);
    if (defect && !opt.includeDefects) { skipped.defect++; continue; }
    // เลข PEA จริง [PEA-1.<UC>.<running>] ก่อน ไม่เจอค่อยลองเลขชั่วคราว [MD-JO<n>-UC-<UC>(-<sub>)] (ของที่ยังไม่มีเลข PEA)
    const m = name.match(/\[(?:PEA-)?(\d+)\.(\d+)\.(\d+)\]/i);
    const md = !m ? name.match(/\[MD-JO(\d+)-UC-([A-Za-z0-9]+)(?:-(\d+))?\]/i) : null;
    if (!m && !md && !opt.includeNoNumber) { skipped.noNumber++; continue; }
    // ตัวเลข UC ตัดเลข 0 นำหน้าออกก่อนเทียบ (UC-07 ต้องตรงกับ UC_NAMES['1.7'] เดียวกับการ์ดที่มีเลข PEA-1.7.n แล้ว)
    const mdUc = md ? (/^\d+$/.test(md[2]) ? String(parseInt(md[2], 10)) : md[2].toUpperCase()) : '';
    const sp = name.match(/\[SP\s*(\d+|xx)\]/i);
    const labels = iLabels >= 0 ? (r[iLabels] || '') : '';
    const list = iList >= 0 ? (r[iList] || '') : '';
    const pt = labels.match(/(\d+)\s*pt/i);
    // % ความคืบหน้าใน Labels (เช่น "70%") — ใช้กับการ์ดรายงานสถานะ (ไม่ใช่การ์ด sprint ปกติที่ใช้ ⭐️/❤️)
    const pctM = labels.match(/(\d+)\s*%/);
    const progress = pctM ? parseInt(pctM[1], 10) / 100 : null;
    let team;
    if (/⭐/.test(labels)) team = 'star';
    else if (/❤/.test(labels)) team = 'heart';
    else if (progress != null && progress >= PROGRESS_GREEN_AT) team = 'green';
    else if (progress != null && progress > 0) team = 'yellow';
    else team = '';
    cards.push({
      raw: name,
      no: m ? m[1] + '.' + m[2] + '.' + m[3] : (md ? 'J' + md[1] + '-UC-' + mdUc + (md[3] ? '-' + md[3] : '') : ''),
      uc: m ? m[1] + '.' + m[2] : (md ? md[1] + '.' + mdUc : NO_UC),
      sprint: sp && /^\d+$/.test(sp[1]) ? parseInt(sp[1], 10) : null,
      team,
      progress,
      points: pt ? parseInt(pt[1], 10) : null,
      done: /done|complete/i.test(list),
      defect,
      title: cleanTitle(name)
    });
  }
  return { cards, skipped };
}

/* ตัดวงเล็บนำหน้า [PEA-…][SP..][E.1][Defect] ออก เหลือชื่อเรื่อง */
function cleanTitle(name) {
  // วงเล็บที่ติดกันเท่านั้น — "[…][…][E.1] [รวม] ชื่อ" ต้องเหลือ "[รวม] ชื่อ"
  return name.trim().replace(/^(\[[^\]]*\])+\s*/, '').trim() || name;
}

/* การ์ดซ้ำ (เลขเดียวกันจากหลายไฟล์) — เก็บใบที่ Done ไว้ก่อน ไม่งั้นเก็บใบหลังสุด */
function dedupe(cards) {
  const byKey = new Map();
  const out = [];
  for (const c of cards) {
    const key = c.no && !c.defect ? c.no : null;
    if (!key) { out.push(c); continue; }
    const prev = byKey.get(key);
    if (!prev) { byKey.set(key, c); out.push(c); continue; }
    if (prev.done && !c.done) continue;
    out[out.indexOf(prev)] = c;
    byKey.set(key, c);
  }
  return out;
}

/* ---------------- วันที่ ---------------- */
const TH_MONTH_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
const TH_MONTH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
function parseISO(s) {
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error('วันที่ต้องเป็นรูปแบบ YYYY-MM-DD (ได้ "' + s + '")');
  let y = +m[1]; if (y > 2400) y -= 543;   // รับ พ.ศ. ได้ด้วย
  return Date.UTC(y, +m[2] - 1, +m[3]);
}
const DAY = 86400000;
function sprintRange(n, opt) {
  const start = parseISO(opt.anchorStart) + (n - opt.anchorSprint) * opt.weeks * 7 * DAY;
  const end = start + (opt.weeks * 7 - 3) * DAY;    // จันทร์ → ศุกร์สัปดาห์สุดท้าย
  return { start, end };
}
function fmtDate(ms) {
  const d = new Date(ms);
  return d.getUTCDate() + ' ' + TH_MONTH[d.getUTCMonth()] + ' ' + (d.getUTCFullYear() + 543);
}
function fmtRange(r) {
  const a = new Date(r.start), b = new Date(r.end);
  const by = b.getUTCFullYear() + 543;
  if (a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear()) {
    return a.getUTCDate() + '–' + b.getUTCDate() + ' ' + TH_MONTH[b.getUTCMonth()] + ' ' + by;
  }
  const ay = a.getUTCFullYear() !== b.getUTCFullYear() ? ' ' + (a.getUTCFullYear() + 543) : '';
  return a.getUTCDate() + ' ' + TH_MONTH[a.getUTCMonth()] + ay + ' – ' + b.getUTCDate() + ' ' + TH_MONTH[b.getUTCMonth()] + ' ' + by;
}

/* ---------------- จัดวาง (ไม่แตะ figma — เทสได้) ---------------- */
/* หัวตาราง 3 ชั้น: แถบเดือน · แถบสัปดาห์ · หัว sprint (แบบ A เจ้าของงานเลือก 2 พ.ย. 2569) */
const L = { ucW: 360, colW: 320, cardW: 280, pad: 20, gap: 12, monthH: 56, weekH: 40, sprintH: 132, lineH: 20, cardPadY: 14, minRowH: 96 };
L.headH = L.monthH + L.weekH + L.sprintH;

function cardHeight(c) {
  const chars = (c.title || '').length;
  const lines = 1 + Math.max(1, Math.ceil(chars / 26));
  return Math.max(64, L.cardPadY * 2 + lines * L.lineH);
}

/* ลำดับ UC ย่อยที่ไม่ใช่ตัวเลข (ของ MD-JO<n>-UC-PRE/DEP/POST) — ให้อยู่ท้ายสุดของ JO นั้นเสมอ ตามลำดับงานจริง */
const UC_TAIL_ORDER = { PRE: 1, DEP: 2, POST: 3 };
function ucOrder(a, b) {
  if (a === NO_UC) return 1;
  if (b === NO_UC) return -1;
  const [ja, ua] = a.split('.'), [jb, ub] = b.split('.');
  if (ja !== jb) return Number(ja) - Number(jb);
  const na = Number(ua), nb = Number(ub);
  const aNum = !Number.isNaN(na), bNum = !Number.isNaN(nb);
  if (aNum && bNum) return na - nb;
  if (aNum !== bNum) return aNum ? -1 : 1;   // ตัวเลข (UC จริง) มาก่อนตัวอักษร (PRE/DEP/POST)
  return (UC_TAIL_ORDER[ua] || 99) - (UC_TAIL_ORDER[ub] || 99);
}

function layout(cards, opt, todayMs) {
  opt = Object.assign({}, DEFAULTS, opt || {});
  const sprints = cards.filter(c => c.sprint != null).map(c => c.sprint);
  const lo = sprints.length ? Math.min(...sprints) : opt.anchorSprint;
  let hi = Math.max(sprints.length ? Math.max(...sprints) : opt.anchorSprint, opt.anchorSprint) + opt.extraSprints;
  // ถึงเดือนที่กำหนด: รวมทุก sprint ที่เริ่มก่อนสิ้นเดือนนั้น
  if (opt.untilMonth) {
    const m = String(opt.untilMonth).match(/^(\d{4})-(\d{2})/);
    if (!m) throw new Error('เดือนสุดท้ายต้องเป็นรูปแบบ YYYY-MM (ได้ "' + opt.untilMonth + '")');
    let yy = +m[1]; if (yy > 2400) yy -= 543;
    const monthEnd = Date.UTC(yy, +m[2], 1);          // วันที่ 1 ของเดือนถัดไป
    while (sprintRange(hi + 1, opt).start < monthEnd) hi++;
  }
  const cols = [];
  // การ์ด Done ที่ชื่อไม่มี sprint (เช่น ย้ายมาจาก ClickUp) — แยกไว้ซ้ายสุด ไม่ปนกับงานที่ยังไม่ลง sprint
  if (cards.some(c => c.sprint == null && c.done)) cols.push({ key: 'd', label: DONE_NO_SPRINT, date: 'ทำเสร็จแล้ว ชื่อการ์ดไม่มี [SPxx]', state: 'past' });
  for (let n = lo; n <= hi; n++) {
    const r = sprintRange(n, opt);
    cols.push({ key: n, label: 'SP' + String(n).padStart(2, '0'), date: fmtRange(r), range: r,
      state: todayMs == null ? '' : (todayMs > r.end + DAY ? 'past' : (todayMs >= r.start ? 'now' : 'future')) });
  }
  const hasUnscheduled = cards.some(c => c.sprint == null && !c.done);
  if (hasUnscheduled) cols.push({ key: 'x', label: UNSCHEDULED, date: '[SPxx] รอกำหนด sprint', state: 'unscheduled' });

  const ucs = [...new Set(cards.map(c => c.uc))].sort(ucOrder);
  const colIndex = new Map(cols.map((c, i) => [c.key, i]));
  // จัดกลุ่มลงช่อง
  const cell = new Map();
  for (const c of cards) {
    const ci = colIndex.get(c.sprint != null ? c.sprint : (c.done ? 'd' : 'x'));
    const k = c.uc + '|' + ci;
    if (!cell.has(k)) cell.set(k, []);
    cell.get(k).push(c);
  }
  for (const list of cell.values()) list.sort((a, b) => (a.no || '').localeCompare(b.no || '', undefined, { numeric: true }));

  // แต้มรวมต่อคอลัมน์ต่อทีม
  for (let i = 0; i < cols.length; i++) {
    const t = { star: 0, heart: 0, none: 0, yellow: 0, green: 0, count: 0 };
    for (const uc of ucs) for (const c of (cell.get(uc + '|' + i) || [])) {
      t.count++; t[c.team || 'none'] += c.points || 0;
    }
    cols[i].totals = t;
  }

  const rows = [];
  let y = L.headH;
  for (const uc of ucs) {
    let h = L.minRowH;
    for (let i = 0; i < cols.length; i++) {
      const list = cell.get(uc + '|' + i) || [];
      const stack = list.reduce((s, c) => s + cardHeight(c) + L.gap, 0);
      h = Math.max(h, stack - (list.length ? L.gap : 0) + L.pad * 2);
    }
    rows.push({ uc, label: UC_NAMES[uc] || (uc === NO_UC ? uc : 'UC ' + uc), y, h });
    y += h;
  }
  const placed = [];
  rows.forEach((row) => {
    cols.forEach((_, i) => {
      let yy = row.y + L.pad;
      for (const c of (cell.get(row.uc + '|' + i) || [])) {
        const h = cardHeight(c);
        placed.push({ card: c, x: L.ucW + i * L.colW + (L.colW - L.cardW) / 2, y: yy, w: L.cardW, h });
        yy += h + L.gap;
      }
    });
  });
  // แถบเดือน/สัปดาห์ — คอลัมน์ sprint เรียงต่อกันเป็นเส้นเวลาเดียว (1 คอลัมน์ = weeks×7 วันปฏิทิน)
  // เดือนที่ตัดกลาง sprint แบ่งแถบตรงวันที่ 1 จริง ไม่ปัดทั้ง sprint ไปเดือนใดเดือนหนึ่ง
  const months = [], weeks = [];
  let today = null;
  const si = cols.findIndex(c => typeof c.key === 'number');
  if (si >= 0) {
    const ns = cols.filter(c => typeof c.key === 'number').length;
    const period = opt.weeks * 7 * DAY;
    const T0 = cols[si].range.start, T1 = T0 + ns * period;
    const xOf = (ms) => L.ucW + si * L.colW + (ms - T0) / period * L.colW;
    const d0 = new Date(T0);
    for (let y0 = d0.getUTCFullYear(), m0 = d0.getUTCMonth(); ; m0++) {
      const ms = Date.UTC(y0, m0, 1), me = Date.UTC(y0, m0 + 1, 1);
      if (ms >= T1) break;
      const a = Math.max(ms, T0), b = Math.min(me, T1);
      const dm = new Date(ms);
      const x = xOf(a), w = xOf(b) - xOf(a);
      months.push({ x, w, label: (w >= 200 ? TH_MONTH_FULL[dm.getUTCMonth()] : TH_MONTH[dm.getUTCMonth()]) + ' ' + (dm.getUTCFullYear() + 543),
        now: todayMs != null && todayMs >= ms && todayMs < me });
    }
    for (let t = T0; t < T1; t += 7 * DAY) {
      const a = new Date(t), b = new Date(t + 6 * DAY);
      const label = a.getUTCMonth() === b.getUTCMonth()
        ? a.getUTCDate() + '–' + b.getUTCDate() + ' ' + TH_MONTH[b.getUTCMonth()]
        : a.getUTCDate() + ' ' + TH_MONTH[a.getUTCMonth()] + ' – ' + b.getUTCDate() + ' ' + TH_MONTH[b.getUTCMonth()];
      weeks.push({ x: xOf(t), w: xOf(t + 7 * DAY) - xOf(t), label, now: todayMs != null && todayMs >= t && todayMs < t + 7 * DAY });
    }
    // เส้นวันนี้ — ใช้สเกลเดียวกับแถบเดือน/สัปดาห์ จึงตรงกับช่องสัปดาห์เสมอ
    if (todayMs != null && todayMs >= T0 && todayMs < T1) today = { x: xOf(todayMs + DAY / 2) };
  }
  return { cols, rows, placed, months, weeks, today, width: L.ucW + cols.length * L.colW, height: y };
}

/* ---------------- figma ---------------- */
const C = {
  star: { r: 1, g: 0.906, b: 0.561 },        // เหลือง sticky FigJam (ทีม ⭐️)
  heart: { r: 1, g: 0.773, b: 0.839 },       // ชมพู (ทีม ❤️)
  none: { r: 0.878, g: 0.906, b: 0.961 },    // ฟ้าอ่อน
  yellow: { r: 1, g: 0.906, b: 0.561 },      // เหลือง — การ์ดรายงานสถานะที่ "มีไปบางแล้ว" (progress > 0 แต่ไม่ถึงเกณฑ์เขียว)
  green: { r: 0.682, g: 0.886, b: 0.682 },   // เขียว — การ์ดรายงานสถานะที่ "ทำไปเยอะแล้ว" (progress ≥ PROGRESS_GREEN_AT)
  done: { r: 0.902, g: 0.902, b: 0.902 },
  head: { r: 0.953, g: 0.957, b: 0.965 },
  monthBand: { r: 0.886, g: 0.91, b: 0.976 },
  headNow: { r: 0.847, g: 0.953, b: 0.863 },
  headPast: { r: 0.925, g: 0.925, b: 0.925 },
  headUnsched: { r: 0.992, g: 0.929, b: 0.851 },
  cell: { r: 1, g: 1, b: 1 },
  cellPast: { r: 0.976, g: 0.976, b: 0.976 },
  line: { r: 0.82, g: 0.835, b: 0.867 },
  today: { r: 0.937, g: 0.267, b: 0.267 },
  text: { r: 0.12, g: 0.13, b: 0.15 },
  sub: { r: 0.4, g: 0.42, b: 0.46 },
  section: { r: 0.98, g: 0.98, b: 0.99 }
};

function post(text, cls) { figma.ui.postMessage({ type: 'log', text, cls }); }

/* โหนดเดิมของ section รอบที่แล้ว (name → node) — ตั้งค่าตอนเริ่ม build() แต่ละครั้งเท่านั้น
   box() เช็คชื่อในนี้ก่อนสร้างใหม่เสมอ · ชื่อที่ไม่ถูกเอาออก (ไม่ได้ reuse รอบนี้) = ของเก่าที่ไม่ใช้แล้ว ลบทิ้งท้าย build() */
let existingByName = null;

async function loadFonts() {
  // text ใน ShapeWithText เกิดมาเป็น Inter Medium — ต้องโหลดก่อนแก้ทุกครั้ง
  for (const f of [{ family: 'Inter', style: 'Medium' }, { family: 'Inter', style: 'Regular' }]) {
    try { await figma.loadFontAsync(f); } catch (e) { /* ไม่มีก็ปล่อย */ }
  }
  const tries = [
    [{ family: 'IBM Plex Sans Thai', style: 'Regular' }, { family: 'IBM Plex Sans Thai', style: 'SemiBold' }],
    [{ family: 'Noto Sans Thai', style: 'Regular' }, { family: 'Noto Sans Thai', style: 'SemiBold' }],
    [{ family: 'Inter', style: 'Regular' }, { family: 'Inter', style: 'Medium' }]
  ];
  for (const [reg, bold] of tries) {
    try { await figma.loadFontAsync(reg); await figma.loadFontAsync(bold); return { reg, bold }; }
    catch (e) { /* ลองตัวถัดไป */ }
  }
  throw new Error('โหลดฟอนต์ไม่ได้สักตัว');
}

function box(parent, x, y, w, h, fill, text, font, size, opts) {
  opts = opts || {};
  // มีโหนดเดิมชื่อตรงกันจาก section รอบที่แล้ว → reuse (ขยับ/แก้ในที่เดิม) ไม่สร้างใหม่
  let s = opts.name && existingByName ? existingByName.get(opts.name) : null;
  if (s) {
    existingByName.delete(opts.name);
  } else {
    s = figma.createShapeWithText();
    parent.appendChild(s);
  }
  s.shapeType = opts.shape || 'SQUARE';
  s.resize(w, h);
  s.x = x; s.y = y;
  s.fills = [{ type: 'SOLID', color: fill }];
  s.strokes = opts.noStroke ? [] : [{ type: 'SOLID', color: C.line }];
  s.strokeWeight = 1;
  if (text) {
    s.text.fontName = font;
    s.text.fontSize = size;
    s.text.characters = text;
    s.text.fills = [{ type: 'SOLID', color: opts.color || C.text }];
  }
  if (opts.name) s.name = opts.name;
  return s;
}

async function build(texts, opt) {
  if (typeof figma.createShapeWithText !== 'function' || typeof figma.createSection !== 'function') {
    throw new Error('ไฟล์ที่เปิดอยู่ไม่ใช่ FigJam — ปลั๊กอินนี้ต้องรันในไฟล์ FigJam');
  }
  opt = Object.assign({}, DEFAULTS, opt || {});
  let all = []; const skipped = { template: 0, defect: 0, noNumber: 0 };
  for (const t of texts) {
    const r = cardsFromCSV(t.text, opt);
    all = all.concat(r.cards);
    for (const k in skipped) skipped[k] += r.skipped[k];
    post('อ่าน ' + t.name + ': ' + r.cards.length + ' การ์ด');
  }
  const cards = dedupe(all);
  if (!cards.length) throw new Error('ไม่มีการ์ดให้วาง (ข้าม template ' + skipped.template + ' · defect ' + skipped.defect + ' · ไม่มีเลข ' + skipped.noNumber + ')');
  const now = new Date();
  const todayMs = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const lay = layout(cards, opt, todayMs);

  // รันซ้ำ = หา section เดิมแล้ว update ในที่เดิม (ไม่ลบทั้งก้อน) — เก็บโหนดลูกเดิมไว้ให้ box() จับคู่ชื่อ reuse
  // อัปโหลดไฟล์ใหม่ที่ไม่มีการ์ด/แถวของรอบก่อนครบ → ของเดิมที่ไม่ถูกจับคู่รอบนี้ "ยังคงอยู่เหมือนเดิม" ไม่ลบทิ้ง (เผื่อเลือกไฟล์ไม่ครบ หรือเจตนาดูสะสมหลายรอบ)
  let x0 = 0, y0 = 0, w0 = 0, h0 = 0;
  // findOne = หาทั่วทั้งหน้า (ไม่ใช่แค่ลูกชั้นบนสุด) กันพลาดกรณี section เดิมถูกย้าย/จัดกลุ่มไปอยู่ที่อื่นบนหน้า
  const findSection = (n) => n.type === 'SECTION' && n.name === SECTION_NAME;
  let s = typeof figma.currentPage.findOne === 'function'
    ? figma.currentPage.findOne(findSection)
    : figma.currentPage.children.find(findSection);
  existingByName = new Map();
  if (s) {
    x0 = s.x; y0 = s.y; w0 = s.width; h0 = s.height;
    for (const child of s.children.slice()) existingByName.set(child.name, child);
  } else {
    s = figma.createSection();
    s.name = SECTION_NAME;
  }
  const font = await loadFonts();
  s.fills = [{ type: 'SOLID', color: C.section }];

  // หัวมุมซ้าย
  box(s, 0, 0, L.ucW, L.headH, C.head, 'UC \\ เดือน · สัปดาห์ · Sprint\nสร้างเมื่อ ' + fmtDate(todayMs), font.bold, 18, { name: 'head / corner' });

  // แถบเดือน + แถบสัปดาห์ (เฉพาะช่วงคอลัมน์ sprint) · คอลัมน์พิเศษได้ช่องว่างสูงเท่ากันให้หัวตารางเรียบ
  for (const m of lay.months) {
    box(s, m.x, 0, m.w, L.monthH, m.now ? C.headNow : C.monthBand, m.label, font.bold, 20, { name: 'month / ' + m.label });
  }
  for (const w of lay.weeks) {
    box(s, w.x, L.monthH, w.w, L.weekH, w.now ? C.headNow : C.head, w.label, font.reg, 14, { name: 'week / ' + w.label, color: C.sub });
  }
  lay.cols.forEach((col, i) => {
    if (typeof col.key !== 'number') box(s, L.ucW + i * L.colW, 0, L.colW, L.monthH + L.weekH, C.head, '', font.reg, 12, { name: 'band / ' + col.label });
  });

  // หัวคอลัมน์
  lay.cols.forEach((col, i) => {
    const t = col.totals;
    const pts = [t.star ? '⭐️ ' + t.star + 'pt' : '', t.heart ? '❤️ ' + t.heart + 'pt' : '', t.none ? 'อื่น ' + t.none + 'pt' : '', t.yellow ? '🟡 ' + t.yellow + 'pt' : '', t.green ? '🟢 ' + t.green + 'pt' : ''].filter(Boolean).join('  ');
    const fill = col.state === 'now' ? C.headNow : col.state === 'past' ? C.headPast : col.state === 'unscheduled' ? C.headUnsched : C.head;
    const label = col.label + (col.state === 'now' ? '  (sprint ปัจจุบัน)' : '') + '\n' + col.date + '\n' + t.count + ' การ์ด' + (pts ? ' · ' + pts : '');
    box(s, L.ucW + i * L.colW, L.monthH + L.weekH, L.colW, L.sprintH, fill, label, font.bold, 16, { name: 'head / ' + col.label });
  });

  // แถว UC + ช่อง
  for (const row of lay.rows) {
    box(s, 0, row.y, L.ucW, row.h, C.head, row.label + '\n' + row.uc, font.bold, 18, { name: 'uc / ' + row.uc });
    lay.cols.forEach((col, i) => {
      box(s, L.ucW + i * L.colW, row.y, L.colW, row.h, col.state === 'past' ? C.cellPast : C.cell, '', font.reg, 12, { name: 'cell / ' + row.uc + ' / ' + col.label });
    });
  }

  // การ์ด
  for (const p of lay.placed) {
    const c = p.card;
    const meta = [c.no, c.points != null ? c.points + 'pt' : '', c.team === 'star' ? '⭐️' : c.team === 'heart' ? '❤️' : ''].filter(Boolean).join(' · ');
    const txt = (c.done ? '✓ ' : '') + meta + '\n' + c.title;
    box(s, p.x, p.y, p.w, p.h, c.done ? C.done : C[c.team || 'none'], txt, font.reg, 14,
      { shape: 'ROUNDED_RECTANGLE', noStroke: true, color: c.done ? C.sub : C.text, name: 'card / ' + (c.no || c.title.slice(0, 30)) });
  }

  // เส้นวันนี้
  if (lay.today) {
    box(s, lay.today.x - 2, 0, 4, lay.height, C.today, '', font.reg, 12, { noStroke: true, name: 'today' });
  }

  // โหนดเดิมที่ไม่ถูก reuse รอบนี้ (เช่น การ์ด/แถวของไฟล์ CSV ที่ไม่ได้เลือกเข้ามารอบนี้) = ปล่อยไว้เฉยๆ ไม่ลบ
  const kept = existingByName.size;
  existingByName = null;

  // ไม่ย่อ section เล็กกว่าที่เคยมี — กันของเดิมที่ยังไม่ถูกลบโดนตัดขอบ/บังด้วยขนาดใหม่ที่เล็กกว่า
  s.resizeWithoutConstraints(Math.max(lay.width, w0), Math.max(lay.height, h0));
  s.x = x0; s.y = y0;
  figma.viewport.scrollAndZoomIntoView([s]);
  const unsched = cards.filter(c => c.sprint == null && !c.done).length;
  post('✓ วาง ' + lay.placed.length + ' การ์ด · ' + lay.rows.length + ' UC · ' + lay.cols.length + ' คอลัมน์' + (unsched ? ' · ยังไม่ลง sprint ' + unsched : '') + (kept ? ' · ของเดิมที่ไฟล์รอบนี้ไม่มี ' + kept + ' โหนด (ไม่ถูกลบ)' : ''));
  if (skipped.template + skipped.defect + skipped.noNumber) {
    post('ข้าม: template ' + skipped.template + ' · defect ' + skipped.defect + ' · ไม่มีเลขการ์ด ' + skipped.noNumber, 'warn');
  }
  return { placed: lay.placed.length, rows: lay.rows.length, cols: lay.cols.length, kept };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { parseCSV, cardsFromCSV, cleanTitle, dedupe, sprintRange, fmtRange, layout, DEFAULTS, UC_NAMES, SECTION_NAME, PROGRESS_GREEN_AT, build };
} else {
  figma.showUI(__html__, { width: 420, height: 600, themeColors: true });
  figma.ui.onmessage = async (msg) => {
    if (msg.type !== 'build') return;
    try {
      await build(msg.files, msg.opt);
      figma.ui.postMessage({ type: 'done' });
    } catch (e) {
      post('✗ ' + (e && e.message ? e.message : String(e)), 'err');
      figma.ui.postMessage({ type: 'done' });
    }
  };
}
