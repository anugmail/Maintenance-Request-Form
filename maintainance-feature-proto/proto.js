/* Prototype เล่นได้ — Feature "แผนบำรุงรักษา" (Happy flow) · 18 พ.ย. 2569
   แหล่งความจริง: ลำดับจอ = HAPPY ใน figma-export/maintainance-feature-plugin/features/plan.js
                 ข้อความ/คอลัมน์/ข้อมูลตัวอย่าง = ฟังก์ชันจอใน figma-export/maintainance-feature-plugin/base/screens.js (ชุดเดียวกับที่ปลั๊กอินพระผู้สร้างวาดลง Figma)
   ตัวช่วย (notify · modal · เมนู "…") ลอกเป็นสำเนาจาก design-mock/overhaul-v2-mock.js ของพี่นุ (ไม่แก้ไฟล์ต้นทาง)
   state เก็บใน localStorage คีย์ mfp-plan-v1 · ข้อมูลทั้งหมดเป็นค่าสมมติ */

const MFP_KEY = 'mfp-plan-v2';   // v2 (18 พ.ย. 2569 ค่ำ): เพิ่มแผนเดินทาง (trips) + แจ้งเตือน (notis)

/* ---------- ข้อมูลตัวอย่าง (ลอกจาก base/screens.js) ---------- */
/* สถานะแผน — PST · สี Warning/Error/Brand/Info/Gray → .badge b-low/b-out/b-brand/b-info/b-neutral */
const PST = { review: ['รออนุมัติ', 'b-low'], returned: ['ส่งกลับแก้ไข', 'b-out'], approved: ['อนุมัติแล้ว', 'b-brand'], active: ['ดำเนินการ', 'b-info'], closed: ['ปิดงานแล้ว', 'b-neutral'] };
const UNITS = ['กบผ.', 'กปส.', 'กรย.', 'กบค.', 'กส.1', 'กส.2'];
const CREATOR = 'นายวิชัย ทองดี';
const APPROVER = 'นายสมศักดิ์ เรืองชัย';
const QUARTERS = ['ไตรมาส 1 (ม.ค.–มี.ค.)', 'ไตรมาส 2 (เม.ย.–มิ.ย.)', 'ไตรมาส 3 (ก.ค.–ก.ย.)', 'ไตรมาส 4 (ต.ค.–ธ.ค.)'];
const YEARS = ['2568', '2569', '2570', '2571', '2572'];
const REGIONS = ['ภาค 1 (เหนือ)', 'ภาค 2 (ตะวันออกเฉียงเหนือ)', 'ภาค 3 (กลาง)', 'ภาค 4 (ใต้)', 'สนง. (สำนักงานใหญ่)'];
const REG_OF = { 'กฟน': 0, 'กฟฉ': 1, 'กฟก': 2, 'กฟต': 3 };
const VTYPES = ['กระเช้าฮอทไลน์', 'กระเช้าแก้ไฟ', 'รถพ่วงฉีดน้ำ'];

/* ยานพาหนะ = CAND (10 คัน) + Q_EXTRA (ยานพาหนะนอกพื้นที่) · ทะเบียน · ยี่ห้อ/รุ่น · หน่วยงานเจ้าของยานพาหนะ */
const POOL = [
  ['82-6789 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น'], ['82-1145 ขอนแก่น', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 ขอนแก่น'],
  ['82-3302 อุดรธานี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟฉ.1 อุดรธานี'], ['82-4410 ขอนแก่น', 'Isuzu FTR + กระเช้า Aichi SK17A', 'กฟฉ.1 ขอนแก่น'],
  ['83-1207 อุดรธานี', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟฉ.1 อุดรธานี'], ['84-5521 นครราชสีมา', 'Hino FG + กระเช้า Tadano AT-146', 'กฟฉ.3 นครราชสีมา'],
  ['85-0918 อุบลราชธานี', 'Isuzu FTR + กระเช้า Aichi SH15A', 'กฟฉ.2 อุบลราชธานี'], ['80-5738 น่าน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.2 น่าน'],
  ['81-2210 เชียงใหม่', 'Hino FG + กระเช้า Tadano AT-146', 'กฟน.1 เชียงใหม่'], ['82-9012 ขอนแก่น', 'Hino FM + ถังฉีดน้ำ 6,000 ลิตร', 'กฟฉ.2 ขอนแก่น'],
  ['81-9035 ลำปาง', 'Isuzu FTR + กระเช้า Aichi SK12A', 'กฟน.2 ลำปาง'], ['82-4417 น่าน', 'Hino FC + กระเช้า Tadano AT-121', 'กฟน.2 น่าน'],
  ['80-6652 ลำพูน', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟน.1 ลำพูน'], ['85-3127 พระนครศรีอยุธยา', 'Isuzu FTR + กระเช้า Aichi SK12A', 'กฟก.1 พระนครศรีอยุธยา'],
  ['86-4402 ชลบุรี', 'Hino FC + กระเช้า Tadano AT-100', 'กฟก.2 ชลบุรี'], ['84-7719 นครปฐม', 'Isuzu FRR + กระเช้า Aichi SK10A', 'กฟก.3 นครปฐม'],
  ['83-2286 เพชรบุรี', 'Hino FG + กระเช้า Tadano AT-146', 'กฟต.1 เพชรบุรี']];
const typeOf = (c) => /ฉีดน้ำ/.test(c[1]) ? VTYPES[2] : /Tadano/.test(c[1]) ? VTYPES[0] : VTYPES[1];
const regionOf = (c) => REGIONS[REG_OF[c[2].split(' ')[0].replace(/\.\d+$/, '')]] || REGIONS[4];
const shortRegion = (r) => r.split(' (')[0];
const modelOf = (c) => c[1].split(' + ')[0];
const NO_HIST = 'ไม่มีข้อมูล';
const histDate = (d, m, y) => String(d).padStart(2, '0') + '/' + String(m).padStart(2, '0') + '/' + y;
const lastMa = (i) => i % 9 === 4 ? NO_HIST : histDate(1 + ((i * 11) % 28), 1 + ((i * 7) % 12), 2567 + (i % 3));       // MA_HEAD
const lastRepair = (i) => i % 5 === 2 ? NO_HIST : histDate(1 + ((i * 13) % 28), 1 + ((i * 5) % 12), 2566 + (i % 4)); // REPAIR_HEAD
const LAST_OIL = ['12/03/2568', '12/03/2567', '05/02/2567', '20/11/2566', NO_HIST, '18/06/2568', '09/01/2566', '14/10/2568', NO_HIST, NO_HIST];
const lastOil = (i) => LAST_OIL[i] || NO_HIST;

/* อะไหล่ — PARTS · CAR_QTY (จำนวนต่อคัน) · OIL_OPTS */
const PARTS = [['น้ำมันไฮดรอลิก ISO VG 46', 'OL-0011', 'น้ำมัน', 'ลิตร'], ['ไส้กรองไฮดรอลิก', 'FL-0022', 'ไส้กรอง', 'ชิ้น'],
  ['ไส้กรองน้ำมันเครื่อง', 'FL-0031', 'ไส้กรอง', 'ชิ้น'], ['ไส้กรองอากาศ', 'FL-0040', 'ไส้กรอง', 'ชิ้น'], ['ไส้กรองเชื้อเพลิง', 'FL-0052', 'ไส้กรอง', 'ชิ้น']];
const CAR_QTY = [30, 2, 2, 2, 2];
const OIL_OPTS = ['เก็บตัวอย่าง', 'เปลี่ยนน้ำมัน', 'เก็บตัวอย่างและเปลี่ยน'];   // 3 ตัวเลือกตามจอ Figma "หน้าจัดการอะไหล่ของยานพาหนะ" (MF / H1.9)
const oilChange = (o) => /เปลี่ยน/.test(o || '');
/* อะไหล่อื่นๆ ตั้งต้นเมื่อเลือกเบิก — ชื่อ · ยี่ห้อ · รุ่น · รหัส · จำนวน · หน่วย ตามตารางในจอ H1.9 */
const PART_DEFAULT = [['ไส้กรองไฮดรอลิก', 'Donaldson', 'P550388', 'FL-0022', 2, 'ชิ้น'], ['ไส้กรองน้ำมันเครื่อง', 'Sakura', 'C-1809', 'FL-0031', 2, 'ชิ้น'], ['ไส้กรองอากาศ', 'Sakura', 'A-1033', 'FL-0040', 2, 'ชิ้น'], ['ไส้กรองเชื้อเพลิง', 'Isuzu', '8-98159693-0', 'FL-0052', 2, 'ชิ้น']];

/* แผนตัวอย่าง — PLANS + UNIT_PLANS (เลขที่ MR · ชื่อแผน · สถานะ · วันที่สร้าง · ปีงบ · ยานพาหนะรายไตรมาส) · หน่วยงานตาม PLAN_UNIT */
const SEED = [
  ['MRZ7000001', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 และภาค 2 ปีงบประมาณ 2570', 'active', '03/10/2569', '2570', [6, 3, 2, 1], 'กบผ.'],
  ['MRZ7000002', 'บำรุงรักษารถพ่วงฉีดน้ำ ภาค 2 ปีงบประมาณ 2570', 'approved', '05/10/2569', '2570', [0, 4, 2, 2], 'กปส.'],
  ['MRZ7000003', 'บำรุงรักษากระเช้าฮอทไลน์ ภาค 3 ปีงบประมาณ 2570', 'review', '17/10/2569', '2570', [2, 2, 1, 1], 'กรย.'],
  ['MRZ7100001', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 4 ปีงบประมาณ 2571', 'returned', '12/10/2569', '2571', [3, 2, 2, 2], 'กบค.'],
  ['MRZ6900011', 'บำรุงรักษากระเช้าแก้ไฟ ภาค 1 ปีงบประมาณ 2569', 'closed', '02/06/2568', '2569', [3, 3, 2, 2], 'กรย.'],
  ['MRZ6900012', 'บำรุงรักษายานพาหนะ กบผ. ปีงบประมาณ 2569', 'closed', '05/06/2568', '2569', [3, 2, 2, 2], 'กบผ.'],
  ['MRZ7100002', 'บำรุงรักษายานพาหนะ กปส. ปีงบประมาณ 2571', 'review', '15/10/2569', '2571', [2, 2, 2, 1], 'กปส.']];

function mfpSeed() {
  let k = 0;
  const plans = SEED.map(([id, name, status, created, year, qs, unit]) => {
    const cars = {}, parts = {};
    qs.forEach((n, q) => { for (let j = 0; j < n; j++) { const i = k++ % POOL.length; cars[i] = q + 1; parts[i] = { oil: OIL_OPTS[i % 2], picks: [1, 2, 3], none: false }; } });
    return { id, name, status, created, year, unit, cars, parts, sentAt: created, approvedAt: status === 'approved' || status === 'active' || status === 'closed' ? '08/10/2569' : '', reason: status === 'returned' ? 'จำนวนไส้กรองไฮดรอลิกไม่ตรงกับรอบบำรุงรักษาของกระเช้าแก้ไฟ กรุณาตรวจสอบยานพาหนะที่เลือกเข้าแผน' : '' };
  });
  return { plans, role: 'creator', draft: null, trips: [], notis: [{ to: 'owner', text: 'บำรุงรักษายานพาหนะ 82-3302 อุดรธานี ตามแผนเดินทางเดือนตุลาคมเสร็จแล้ว', at: '2 วันที่แล้ว', isNew: false }] };
}
function mfpLoad() { try { const s = JSON.parse(localStorage.getItem(MFP_KEY)); if (s && s.plans) return s; } catch (e) { /* ใช้ค่าตั้งต้น */ } const s = mfpSeed(); mfpSave(s); return s; }
function mfpSave(s) { try { localStorage.setItem(MFP_KEY, JSON.stringify(s)); } catch (e) { /* โหมดส่วนตัว — ไม่เก็บ */ } }
function mfpReset() { try { localStorage.removeItem(MFP_KEY); } catch (e) { /* */ } return mfpLoad(); }

/* เลขที่ MR ใหม่ — MR + Z + ปี 2 หลัก + ลำดับ 5 หลักนับต่อในปีนั้น */
function nextMr(s, year) { const p = 'MRZ' + String(year).slice(2); const n = Math.max(0, ...s.plans.filter(x => x.id.startsWith(p)).map(x => +x.id.slice(5))); return p + String(n + 1).padStart(5, '0'); }
function today() { const d = new Date(); return histDate(d.getDate(), d.getMonth() + 1, d.getFullYear() + 543); }

/* ---------- สรุปข้อมูลแผน ---------- */
const carIds = (p) => Object.keys(p.cars).map(Number);
const inQ = (p, q) => carIds(p).filter(i => p.cars[i] === q);
const listOf = (x) => x.list || (x.picks || []).map(k => PART_DEFAULT[k - 1]);   // แผนตัวอย่างเก็บเป็นลำดับ PARTS · แผนที่กรอกเองเก็บเป็นรายการ
const decided = (p, i) => { const x = p.parts[i]; return !!x && (x.none || listOf(x).length > 0); };
/* ภาค / ประเภทยานพาหนะของแผนตัวอย่าง = ค่าเดียวกับ PLANS + PLAN_SCOPE ของ base/screens.js (ภาค ช่องที่ 2 · ประเภท ช่องที่ 7) · แผนที่สร้างใหม่คิดจากรถในแผน */
const SEED_SCOPE = { MRZ7000001: ['ภาค 1, ภาค 2', 'กระเช้าแก้ไฟ'], MRZ7000002: ['ภาค 2, ภาค 3', 'กระเช้าแก้ไฟ, รถพ่วงฉีดน้ำ'], MRZ7000003: ['ภาค 3', 'กระเช้าฮอทไลน์'], MRZ7100001: ['ภาค 4', 'กระเช้าแก้ไฟ'], MRZ6900011: ['ภาค 1', 'กระเช้าแก้ไฟ'], MRZ6900012: ['ภาค 1, ภาค 2', 'กระเช้าแก้ไฟ'], MRZ7100002: ['ภาค 3, ภาค 4', 'กระเช้าฮอทไลน์, รถพ่วงฉีดน้ำ'] };
function scopeOf(p) { if (!p.mine && SEED_SCOPE[p.id]) return { text: SEED_SCOPE[p.id][0], sub: SEED_SCOPE[p.id][1] }; const cs = carIds(p).map(i => POOL[i]); const r = [...new Set(cs.map(c => shortRegion(regionOf(c))))]; const t = [...new Set(cs.map(typeOf))]; return { text: r.join(', ') || '—', sub: t.join(', ') }; }
const qSummary = (p) => [1, 2, 3, 4].map(q => 'ไตรมาส ' + q + ': ' + inQ(p, q).length);
/* อะไหล่รวมของรายการคัน — QPART_COLS: ชนิด · รหัสอะไหล่ · ประเภท · จำนวน · หน่วย */
function partsOf(p, ids) {
  const sum = PARTS.map(() => 0);
  const extra = {};
  ids.forEach(i => { const x = p.parts[i]; if (!x) return; if (oilChange(x.oil)) sum[0] += x.oilQty || CAR_QTY[0];
    if (!x.none) listOf(x).forEach(r => { const k = PARTS.findIndex(q => q[1] === r[3]); if (k >= 0) sum[k] += +r[4]; else { const e = extra[r[0]] || (extra[r[0]] = [r[0], r[3] || '-', 'เพิ่มเอง', 0, r[5]]); e[3] += +r[4]; } }); });   // น้ำมันไฮดรอลิกนับแยกจากการเบิกอะไหล่อื่นๆ
  return PARTS.map((r, k) => [r[0], r[1], r[2], sum[k], r[3]]).filter(r => r[3] > 0).concat(Object.values(extra));
}
const otherParts = (p, i) => { const x = p.parts[i]; if (!x) return '—'; if (x.none) return 'ไม่เบิกอะไหล่'; return listOf(x).length ? listOf(x).length + ' รายการ' : '—'; };

/* ---------- ตัวช่วยหน้าจอ (สำเนาจาก overhaul-v2-mock.js) ---------- */
const $ = (id) => document.getElementById(id);
function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const badge = (st) => `<span class="badge ${PST[st][1]}">${esc(PST[st][0])}</span>`;
const pill = (t, c) => `<span class="badge ${c}">${esc(t)}</span>`;
const two = (t, sub) => `<div>${esc(t)}</div>${sub ? `<div class="text-sm text-gray-500">${esc(sub)}</div>` : ''}`;

/* Notification (.notif) — ไลบรารี `Notification` · หายเองใน 4 วินาที */
function notify(title, { err = false, sub = '' } = {}) {
  let n = $('notif');
  if (!n) { n = document.createElement('div'); n.id = 'notif'; n.className = 'notif'; n.setAttribute('role', 'status');
    n.innerHTML = '<span class="ms notif-ic"></span><div class="notif-tx"><b></b><span></span></div><button class="notif-x" type="button" aria-label="ปิด"><span class="ms">close</span></button>';
    n.querySelector('.notif-x').addEventListener('click', () => n.classList.remove('show')); document.body.appendChild(n); }
  n.classList.toggle('err', err); n.querySelector('.notif-ic').textContent = err ? 'cancel' : 'check_circle';
  n.querySelector('b').textContent = title; n.querySelector('.notif-tx span').textContent = sub;
  n.classList.add('show'); clearTimeout(n._t); n._t = setTimeout(() => n.classList.remove('show'), 4000);
}
/* ส่งข้อความแจ้งผลข้ามหน้า (เช่น บันทึกแล้วกลับหน้ารายการ) */
function flash(title, opt) { try { sessionStorage.setItem('mfp-flash', JSON.stringify([title, opt || {}])); } catch (e) { /* */ } }
function showFlash() { try { const f = JSON.parse(sessionStorage.getItem('mfp-flash')); sessionStorage.removeItem('mfp-flash'); if (f) notify(f[0], f[1]); } catch (e) { /* */ } }

function modal(id, open) { const m = $(id); m.classList.toggle('hidden', !open); document.body.classList.toggle('modal-open', open); }
document.addEventListener('keydown', e => { if (e.key !== 'Escape') return; document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(m => modal(m.id, false)); document.querySelectorAll('details.dd[open]').forEach(d => d.open = false); });
document.addEventListener('click', e => {
  if (e.target.classList && e.target.classList.contains('modal-overlay')) modal(e.target.id, false);
  const x = e.target.closest && e.target.closest('[data-close]'); if (x) modal(x.dataset.close, false);
  document.querySelectorAll('details.dd[open]').forEach(d => { if (!d.contains(e.target)) d.open = false; });
});
/* เมนู "…" — Dropdown menu + _Dropdown menu item · items: [{label, icon, href | attr}] หรือ '-' (เส้นคั่น) */
function menu(label, items) {
  return `<details class="dd"><summary class="btn btn-t btn-icon" aria-label="${esc(label)}"><span class="ms">more_horiz</span></summary><div class="dd-menu">` +
    items.map(i => i === '-' ? '<div class="dd-sep"></div>' : (i.href ? `<a class="dd-item !no-underline" href="${i.href}">` : `<button class="dd-item" type="button" ${i.attr || ''}>`) +
      `<span><span class="ms">${i.icon}</span>${esc(i.label)}</span>` + (i.href ? '</a>' : '</button>')).join('') + '</div></details>';
}
function placeMenu(d) { const m = d.querySelector('.dd-menu'), r = d.querySelector('summary').getBoundingClientRect();
  m.style.position = 'fixed'; m.style.right = 'auto'; m.style.left = Math.max(8, r.right - m.offsetWidth) + 'px';
  const below = r.bottom + 4, h = m.offsetHeight; m.style.top = (below + h > innerHeight - 8 ? Math.max(8, r.top - 4 - h) : below) + 'px'; }
document.addEventListener('toggle', e => { const d = e.target; if (!(d.matches && d.matches('details.dd')) || !d.open) return;
  document.querySelectorAll('details.dd[open]').forEach(o => { if (o !== d) o.open = false; }); placeMenu(d); }, true);
window.addEventListener('scroll', () => document.querySelectorAll('details.dd[open]').forEach(placeMenu), true);

/* ---------- โครงหน้า ตามจอ Figma (MF / H1.1 · H1.7): Sidebar navigation State=Collapsed · Header navigation Breakpoint=Desktop ----------
   แถบบน = ปุ่มไอคอน ค้นหา · ธีม · แจ้งเตือน + รูปโปรไฟล์ (ไม่มีชื่อผู้ใช้) · ตัวสลับบทบาท/จำลองไม่สำเร็จ/คืนค่าข้อมูล ของ Prototype ซ่อนในเมนูโปรไฟล์ (ไม่มีใน Figma) */
/* บทบาท — ผู้สร้างแผน · ผู้อนุมัติ · ผู้ดูแลยานพาหนะ (รับแจ้งเตือนแผนเดินทาง G.1–G.3 · ชื่อ CTRL_NAME[0] ของ base/screens.js) */
const ROLES = { creator: [CREATOR + ' (กบผ.)', 'ผู้สร้างแผน', 'plans.html'], approver: [APPROVER, 'ผู้อนุมัติ', 'approvals.html'], owner: ['นายสมชาย แก้วมณี', 'ผู้ดูแลยานพาหนะ', 'trips.html'], contractor: ['บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด', 'ผู้รับจ้าง', 'trips.html'] };   // ผู้รับจ้าง (S23 · V.*) = VENDORS[0]
const simFail = () => { try { return sessionStorage.getItem('mfp-fail') === '1'; } catch (e) { return false; } };
function shell(S, active) {
  const nav = S.role === 'contractor' ? [['trips', 'trips.html', 'route', 'แผนเดินทางที่รับจ้าง']] : S.role === 'owner' ? [['trips', 'trips.html', 'route', 'แผนเดินทางบำรุงรักษา'], ['acks', 'acks.html', 'task_alt', 'ผลการบำรุงรักษารอรับทราบ']]
    : S.role === 'approver' ? [['approvals', 'approvals.html', 'fact_check', 'แผนรออนุมัติ'], ['trip-approvals', 'trip-approvals.html', 'route', 'แผนเดินทางรออนุมัติ']]
    : [['plans', 'plans.html', 'build_circle', 'บำรุงรักษาตามวาระ'], ['parts-track', 'parts-track.html', 'inventory_2', 'อะไหล่ของแผนที่อนุมัติแล้ว'], ['vehicles', 'vehicles.html', 'directions_car', 'ข้อมูลยานพาหนะ']];
  $('side').innerHTML = `<div class="vlogo">VMS<em>+</em></div>` + nav.concat([['start', 'index.html', 'apps', 'เริ่มต้น Prototype']]).map(([k, h, ic, t]) =>
    `<a class="nv${active === k ? ' on' : ''}" href="${h}" title="${t}"><span class="ms">${ic}</span><span class="nvlbl">${t}</span></a>`).join('');
  const others = Object.keys(ROLES).filter(k => k !== S.role);
  document.querySelector('.topbar').classList.add('relative');
  document.querySelector('.topbar').innerHTML = `<span class="mr-auto"></span>
    <button class="btn btn-t btn-icon" type="button" aria-label="ค้นหา"><span class="ms">search</span></button>
    <button class="btn btn-t btn-icon" type="button" aria-label="ธีม"><span class="ms">light_mode</span></button>
    <button class="btn btn-t btn-icon" type="button" id="bell" aria-label="การแจ้งเตือน"><span class="ms">notifications</span></button>
    ${menu('โปรไฟล์ ' + ROLES[S.role][0], [{ label: ROLES[S.role][0] + ' · ' + ROLES[S.role][1], icon: 'account_circle', attr: 'disabled' }, '-']
      .concat(others.map(o => ({ label: 'สลับเป็น' + ROLES[o][1], icon: 'swap_horiz', attr: `data-role="${o}"` })), [
      { label: (simFail() ? 'ปิด' : 'เปิด') + 'จำลองบันทึกไม่สำเร็จ (A23)', icon: 'error', attr: 'data-fail' },
      { label: 'คืนค่าข้อมูลตัวอย่าง', icon: 'restart_alt', attr: 'data-reset' }])).replace('<span class="ms">more_horiz</span>', '<span class="ms">account_circle</span>')}`;
  document.querySelectorAll('.draft').forEach(x => x.remove());
  /* แผงแจ้งเตือน (Notification card) — ข้อความแจ้งเตือนของบทบาทนี้ (S.notis) · ลบทั้งหมดได้ */
  const drawBell = () => { const old = $('ncard'); if (old) { old.remove(); return; }
    const ns = (S.notis || []).filter(n => n.to === S.role).reverse(), unread = ns.filter(n => n.isNew).length;
    const c = document.createElement('div'); c.id = 'ncard'; c.className = 'ncard'; c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'แจ้งเตือน');
    c.innerHTML = `<div class="ncard-hd">แจ้งเตือน<span class="badge sq">${unread} แจ้งเตือนใหม่</span></div><div class="ncard-bd">` +
      (ns.length ? ns.map(n => `<a class="ncard-item !no-underline" href="${n.href || '#'}"><span class="ncard-dot${n.isNew ? ' new' : ''}"></span><span>${esc(n.text)}<small>${esc(n.at)}</small></span></a>`).join('')
        : '<div class="ncard-item">ไม่มีการแจ้งเตือน</div>') +
      `</div><div class="ncard-ft"><button class="btn btn-p" type="button" id="nclear">ลบข้อความแจ้งเตือนทั้งหมด</button></div>`;
    document.querySelector('.topbar').appendChild(c);
    (S.notis || []).forEach(n => { if (n.to === S.role) n.isNew = false; }); mfpSave(S);
    $('nclear').addEventListener('click', () => { S.notis = (S.notis || []).filter(n => n.to !== S.role); mfpSave(S); c.remove(); notify('ลบข้อความแจ้งเตือนทั้งหมดแล้ว'); }); };
  $('bell').addEventListener('click', drawBell);
  document.addEventListener('click', e => {
    const r = e.target.closest('[data-role]'); if (r) { S.role = r.dataset.role; mfpSave(S); location.href = ROLES[S.role][2]; }
    if (e.target.closest('[data-fail]')) { try { sessionStorage.setItem('mfp-fail', simFail() ? '0' : '1'); } catch (x) { /* */ } location.reload(); }
    if (e.target.closest('[data-reset]')) { mfpReset(); try { sessionStorage.clear(); } catch (x) { /* */ } location.href = 'index.html'; }
  });
  showFlash();
}
/* Empty state/Data empty — ภาพประกอบ Graphic 200×200 ของไลบรารี (img/data-empty.png ดึงจากจอ Figma) · ภาพยานพาหนะ (empty-vehicle) ตาม noCarsInQ (R61) */
const emptyState = (img, title, sub, btn) => `<div class="parts-empty"><img class="parts-empty-image w-[200px] h-[200px]" src="img/${img}.png" alt="">
  <b>${esc(title)}</b>${sub ? `<span>${esc(sub)}</span>` : ''}${btn || ''}</div>`;
/* Table pagination — ข้อความ "แสดง a ถึง b จาก n รายการ" + จำนวนแถว + ปุ่มหน้า */
const pager = (n, from, to, pages, cur) => `<div class="tblfoot"><div class="tf-left">${n ? `แสดง ${from} ถึง ${to} จาก ${n} รายการ` : ''}
  <select class="select-inline" aria-label="จำนวนแถวต่อหน้า"><option selected>10</option><option>25</option><option>50</option></select></div>
  <div class="pager"><button class="pg" type="button" data-pg="${(cur || 0) - 1}"${cur ? '' : ' disabled'} aria-label="หน้าก่อน"><span class="ms">chevron_left</span></button>` +
  Array.from({ length: pages || 1 }, (_, k) => `<button class="pg${k === (cur || 0) ? ' on' : ''}" type="button" data-pg="${k}">${k + 1}</button>`).join('') +
  `<button class="pg" type="button" data-pg="${(cur || 0) + 1}"${(cur || 0) < (pages || 1) - 1 ? '' : ' disabled'} aria-label="หน้าถัดไป"><span class="ms">chevron_right</span></button></div></div>`;
/* ทะเบียนเป็นลิงก์ + บรรทัดรอง ตัดข้อความยาวด้วย … (Table cell Lead text) */
const plateCell = (c, sub, w) => `<a href="#" class="block truncate ${w || 'max-w-[140px]'}" data-plate>${esc(c[0])}</a><div class="text-xs text-gray-500 truncate ${w || 'max-w-[140px]'}">${esc(sub)}</div>`;
document.addEventListener('click', e => { const a = e.target.closest('[data-plate]'); if (a) { e.preventDefault(); notify('ข้อมูลยานพาหนะ ' + a.textContent, { sub: 'Prototype รอบนี้ยังไม่มีหน้าข้อมูลยานพาหนะ' }); } });
const SECT = 'sect border-b-0 pb-0';   // Section header ปิด Divider ตามจอ Figma

/* ---------- Feature แผนเดินทาง (ข้อมูลตาม base/screens.js: CTRL_NAME · OWNER_PH · STAFF_INFO · VENDORS · TST) ---------- */
const CTRL_NAME = ['นายสมชาย แก้วมณี', 'นายสมชาย แก้วมณี', 'นายวีระ ทองคำ', 'นายประยุทธ ศรีวงศ์', 'นายณรงค์ บุญมา', 'นายสุรชัย พลอยงาม', 'นายอำนาจ ไชยสิทธิ์', 'นายบุญเลิศ คำแสน', 'นายชาตรี อินทร์แก้ว', 'นายพิชิต ปัญญาดี'];
const OWNER_PH = ['081-472-3365', '081-472-3365', '054-710-224', '053-241-560', '089-635-1172', '042-221-908', '043-246-118', '054-411-737', '053-711-402', '054-511-226'];
const STAFF = [['นายวิชัย ทองดี', 'วศ.8', '081-472-1180'], ['นางสาวกนกวรรณ ใจมั่น', 'ชก.6', '089-221-4407'], ['นายสมชาย พูลสุข', 'ชก.5', '086-530-2291']];
const VENDORS = [['บริษัท สยามไฮดรอลิก เซอร์วิส จำกัด', 'กระเช้าแก้ไฟ · กระเช้าฮอทไลน์'], ['หจก. ช่างกลภาคอีสาน', 'กระเช้าแก้ไฟ'], ['บริษัท เครนเทค เอ็นจิเนียริ่ง จำกัด', 'รถพ่วงฉีดน้ำ'], ['หจก. ล้านนาไฮดรอลิก', 'กระเช้าแก้ไฟ · รถพ่วงฉีดน้ำ']];
const TST = { review: ['รออนุมัติ', 'b-low'], approved: ['อนุมัติแล้ว', 'b-ok'], returned: ['ส่งกลับแก้ไข', 'b-out'] };
const tBadge = (st) => `<span class="badge ${TST[st][1]}">${esc(TST[st][0])}</span>`;
const isoTh = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${+y + 543}`; };
/* ผู้ดูแลยานพาหนะ · เบอร์ · สถานที่บำรุงรักษา · วันดำเนินการ รายคัน — ค่าเริ่มต้นจากข้อมูลยานพาหนะ แก้ได้ทีละคัน (edits) */
function carInfo(t, i) {
  const e = (t.edits || {})[i] || {};
  return { ctrl: e.ctrl || CTRL_NAME[i % 10], tel: e.tel || OWNER_PH[i % 10], loc: e.loc || 'สำนักงาน ' + POOL[i][2], locEdited: !!e.loc,
    w: e.w1 ? isoTh(e.w1) + ' – ' + isoTh(e.w2 || e.w1) : (t.d1 ? isoTh(t.d1) + ' – ' + isoTh(t.d2) : '—'), wEdited: !!e.w1 };
}
const tripRange = (t) => t.d1 ? isoTh(t.d1) + ' – ' + isoTh(t.d2) : '—';
const tripBy = (t) => t.mode === 'hire' ? (t.vendor || 'จ้างดำเนินการ') : 'ดำเนินการเอง';
function tripPlaces(t) { const locs = new Set(t.cars.map(i => carInfo(t, i).loc)); const def = t.cars.filter(i => !carInfo(t, i).locEdited).length;
  return `${locs.size} แห่ง (สำนักงานเจ้าของยานพาหนะ ${def} คัน)`; }
/* แถวตารางยานพาหนะของแผนเดินทาง — TRIP_V_COLS ชุดเดียวทุกหน้า (R82): ทะเบียน · ประเภท · ยี่ห้อ/รุ่น · หน่วยงาน · เบอร์ติดต่อ · สถานที่บำรุงรักษา · วันดำเนินการ */
const TRIP_TH = '<th class="w-[130px]">ทะเบียน</th><th class="w-[130px]">ประเภทยานพาหนะ</th><th>ยี่ห้อ/รุ่น</th><th class="w-[150px]">หน่วยงานเจ้าของยานพาหนะ</th><th class="w-[130px]">เบอร์ติดต่อ</th><th class="w-[150px]">สถานที่บำรุงรักษา</th><th class="w-[130px]">วันดำเนินการ</th>';
function tripRow(t, i, extra) { const c = POOL[i], x = carInfo(t, i);
  return `<tr><td><a href="#" data-plate class="whitespace-nowrap">${esc(c[0])}</a></td><td>${typeOf(c)}</td><td><div class="truncate max-w-[220px]">${esc(c[1])}</div></td><td><div class="truncate max-w-[140px]">${esc(c[2])}</div></td>
    <td><span class="whitespace-nowrap">${x.tel}</span><div class="text-xs text-gray-500 whitespace-nowrap">${esc(x.ctrl)}</div></td>
    <td><div class="truncate max-w-[140px]">${esc(x.loc)}</div><div class="text-xs text-gray-500 truncate max-w-[140px]">${x.locEdited ? 'แก้จากสำนักงานเจ้าของยานพาหนะ' : 'ค่าเริ่มต้น สำนักงานที่ยานพาหนะอยู่'}</div></td>
    <td><div class="truncate max-w-[130px]">${x.w}</div>${t.d1 ? `<div class="text-xs text-gray-500">${x.wEdited ? 'แก้จากช่วงวันเดินทาง' : 'ค่าเริ่มต้น ช่วงวันเดินทาง'}</div>` : ''}</td>${extra || ''}</tr>`; }
const partsTable = (r, emptySub) => r.length ? `<div class="tblwrap mt-0"><table class="tbl striped"><thead><tr><th>ชนิด</th><th class="w-[160px]">รหัสอะไหล่</th><th class="w-[160px]">ประเภท</th><th class="w-[160px]">จำนวน</th><th class="w-[144px]">หน่วย</th></tr></thead>
  <tbody>${r.map(x => `<tr><td>${esc(x[0])}</td><td>${x[1]}</td><td>${x[2]}</td><td>${x[3]}</td><td>${x[4]}</td></tr>`).join('')}</tbody></table></div>` : emptyState('data-empty', 'ยังไม่มีรายการอะไหล่', emptySub);
const tripOf = (S, planId, q, i, skipId) => (S.trips || []).find(t => t.plan === planId && t.q === q && t.id !== skipId && t.cars.includes(i));

/* ---------- Feature งานบำรุงรักษารายคัน (I.* K.* L.*) — ข้อมูลตามจอ Figma Page งานบำรุงรักษารายคัน ----------
   สถานะงานรายคัน (WSTAT): ยังไม่เริ่ม · อยู่ระหว่างบำรุงรักษา · เสร็จสิ้น · บำรุงรักษาไม่ได้ · ป้ายเสริม รอผลตรวจน้ำมัน */
const WSTAT = { todo: ['ยังไม่เริ่ม', 'b-neutral'], doing: ['อยู่ระหว่างบำรุงรักษา', 'b-low'], done: ['เสร็จสิ้น', 'b-ok'], cannot: ['บำรุงรักษาไม่ได้', 'b-out'] };
const wBadge = (st) => `<span class="badge ${WSTAT[st][1]}">${esc(WSTAT[st][0])}</span>`;
/* รายการตรวจสภาพ 30 ข้อ — แบบฟอร์มการตรวจสภาพกระเช้าแก้ไฟและกระเช้าฮอทไลน์ (จอ I.6) */
const CHECK_ITEMS = ['น้ำมันไฮดรอลิก', 'กรองน้ำมันไฮดรอลิก', 'แรงดันน้ำมันไฮดรอลิก MAIN 2400-2600 PSI', 'ชุดเกียร์ PTO', 'ปั๊มน้ำมันไฮดรอลิก', 'เพลาขับปั๊มน้ำมันไฮดรอลิก',
  'ชุดกระบอกขาช้างหน้าซ้าย-ขวา', 'ชุดกระบอกขาช้างหลังซ้าย-ขวา', 'น้ำมันหล่อลื่นชุดเฟืองหมุนฐานเครน', 'ชุดมอเตอร์และเฟืองหมุนฐานเครน', 'ชุดกระบอก LOWER BOOM', 'ชุดกระบอก UPPER BOOM',
  'ชุดกระบอก EXTENSION', 'ชุดโรตารี่', 'ระบบ EMERGENCY', 'ชุด CONTROL ล่าง', 'ชุด CONTROL บน', 'สายน้ำมันไฮดรอลิก', 'สายสัญญาณต่างๆ', 'เกจวัดต่างๆ', 'ชุดวาล์วล็อคต่างๆ',
  'ชุดปรับการหมุนและปรับตั้งในกระเช้า', 'BUCKET, LINER', 'ชุดการ์ดครอบป้องกันกระแสไฟ', 'รอกและเชือกวินช์', 'ชุด LIFT รุ่น 115 KV', 'การอัดและเคลือบจารบีตามจุดต่างๆ', 'ชุดยึดฐานเครน', 'ท่อนบูม, สลัก, จุดยึด', 'PLATE รองบูม, SLIDE PAD ADJ.'];
/* ราคาต่อหน่วยอะไหล่ (ค่าสมมติตามจอ I.13) · ค่าเบี้ยเลี้ยง/ที่พัก/ค่าเดินทาง/ชั่วโมงทำงาน */
const PRICE = { 'OL-0011': 120, 'FL-0022': 680, 'FL-0031': 250, 'FL-0040': 420, 'FL-0052': 350 };
const jobKey = (t, i) => t.id + ':' + i;
function jobOf(S, t, i) { S.jobs = S.jobs || {}; return S.jobs[jobKey(t, i)] || (S.jobs[jobKey(t, i)] = { st: 'todo' }); }
/* รายการงานและอะไหล่ตามแผน ของคันนี้ (จากอะไหล่ที่กำหนดตอนทำแผน) — [รายการงาน, อะไหล่, จำนวน, หน่วย, รหัส] */
function jobTasks(p, i) { const x = p.parts[i] || {}, r = [];
  if (oilChange(x.oil)) r.push(['เปลี่ยนน้ำมันไฮดรอลิก', PARTS[0][0], x.oilQty || CAR_QTY[0], 'ลิตร', 'OL-0011']);
  if (!x.none) listOf(x).forEach(l => r.push(['เปลี่ยน' + l[0], l[0], +l[4], l[5], l[3]]));
  return r; }
const vehicleCard = (i) => { const c = POOL[i]; return `<dl class="incident-summary lg:grid-cols-4">` +
  [['ทะเบียน', `<a href="#" data-plate>${esc(c[0])}</a>`], ['ยี่ห้อ/รุ่น', esc(c[1])], ['ประเภท', typeOf(c)], ['หน่วยงานเจ้าของยานพาหนะ', esc(c[2])],
   ['เลขไมล์สะสม', '182,400 กม.'], ['ชั่วโมงเครื่องจักรสะสม', '6,120 ชม.']].map(([k, v]) => `<div class="incident-field"><dt>${k}</dt><dd>${v}</dd></div>`).join('') + '</dl>'; };
const kvCard = (rows) => `<dl class="incident-summary lg:grid-cols-4">${rows.map(([k, v]) => `<div class="incident-field"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
const nowTh = () => { const d = new Date(); return today() + ' ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ' น.'; };
/* ภาพตัวอย่าง (ไม่มีไฟล์จริง) — กล่องเทาแทนภาพถ่าย */
const photoBox = () => '<div class="h-[160px] rounded-lg bg-gray-100 flex items-center justify-center text-gray-400"><span class="ms">image</span></div>';

/* ---------- Feature ต้นทุนการบำรุงรักษา (S18 · Q.1–Q.6 · R92) — costBody() ของ base/screens.js ----------
   นับเฉพาะงานที่หน่วยงานทำเอง · ค่าอะไหล่ = ราคารวมที่ใช้จริงตอนปิดงาน · ค่าชั่วโมงทำงาน = ชั่วโมง × อัตรา · คันบำรุงรักษาไม่ได้แยก section
   แถว = [ลำดับรถ, วันที่ปิดงาน, ค่าอะไหล่, ค่าเบี้ยเลี้ยง, ชั่วโมง, อัตรา, ค่าที่พัก, ค่าเดินทาง, ไตรมาส] */
const COST_SAMPLE = { done: [[0, '04/11/2569', 5880, 1200, 6, 150, 4000, 1210, 1], [1, '05/11/2569', 5420, 960, 5, 150, 3200, 980, 1], [3, '06/11/2569', 7130, 1200, 0, 150, 4000, 1210, 1], [8, '18/11/2569', 4980, 720, 4, 150, 2400, 860, 2], [7, '19/11/2569', 6240, 960, 6, 150, 3200, 980, 2]],
  cannot: [[2, '04/11/2569', 1150, 480, 0, 150, 1600, 450, 1]] };   // ค่าตามตัวอย่าง COST_V / COST_X ของ base/screens.js — ใช้กับแผนปิดงานแล้ว MRZ6900011
function costRowsOf(S, p) {
  if (p.id === 'MRZ6900011') return COST_SAMPLE;
  const done = [], cannot = [];
  (S.trips || []).filter(t => t.plan === p.id && t.mode !== 'hire').forEach(t => t.cars.forEach(i => { const j = (S.jobs || {})[jobKey(t, i)]; if (!j) return;
    if (j.st === 'done') { const k = j.cost || {}, parts = jobTasks(p, i).reduce((a, r) => a + (PRICE[r[4]] || 0) * ((j.used || {})[r[4]] ?? r[2]), 0);
      done.push([i, (j.closed || '').split(' ')[0], parts, k.perSum || 0, k.hours || 0, k.rate || 0, k.lodgeSum || 0, +k.travel || 0, t.q]); }
    if (j.st === 'cannot') cannot.push([i, today(), 0, 480, 0, 0, 1600, 450, t.q]); }));
  return { done, cannot };
}
const costTotal = (r) => r[2] + r[3] + r[4] * r[5] + r[6] + r[7];
const nf = (n) => Number(n || 0).toLocaleString('th-TH');

/* ---------- Feature ติดตามและแดชบอร์ด (C.* · W.*) ----------
   ⚠ ส่วนหัวแดชบอร์ด · เรื่องที่ควรดู · การ์ดตัวเลขสี · กราฟ ในจอ Figma เป็นกรอบที่ปลั๊กอินวาดเอง (VMS+ head/alert/KPI/chart) ไม่ใช่ component ของไลบรารี
     ⇒ ยังไม่ทำใน Prototype จนกว่าเจ้าของงานเคาะ (กติกา CLAUDE.md "ของที่ไม่มีในไลบรารี → ถามก่อน")
   ข้อมูลยานพาหนะทุกคัน (W.1) — ค่าตามตารางในจอ "MF / H3.1 แดชบอร์ดยานพาหนะทุกคัน" (node 195:1014552)
   [ทะเบียน, ประเภท, อายุ (ปี), ไมล์ · ชม., บำรุงรักษาล่าสุด, MR, ครั้งถัดไป, ป้ายกำหนด (due|soon|''), ผลน้ำมัน, เก็บตัวอย่าง, ประกัน, สถานะยานพาหนะ, ผู้ดูแล, เบอร์] */
const VDATA = [
  ['80-4458 แพร่', 'กระเช้าฮอทไลน์', 12, '171,220 กม. · 5,610 ชม.', '01/10/2568', 'MRZ6900011', '01/10/2569 · รอบบำรุงรักษา', 'due', 'ผ่าน', '01/10/2568', 'ไม่มีประกัน', 'ปกติ', 'นายพิชิต ปัญญาดี', '054-511-226'],
  ['80-5738 น่าน', 'กระเช้าแก้ไฟ', 11, '168,900 กม. · 5,480 ชม.', '14/10/2568', 'MRZ6900011', '14/10/2568 · ไส้กรองไฮดรอลิก', 'due', 'ไม่ผ่าน', '14/10/2568', 'หมดประกัน', 'อยู่ระหว่างซ่อม', 'นายวีระ ทองคำ', '054-710-224'],
  ['80-3316 พะเยา', 'กระเช้าฮอทไลน์', 9, '154,300 กม. · 4,920 ชม.', '20/11/2568', 'MRZ6900011', '20/11/2569 · รอบบำรุงรักษา', 'soon', 'ผ่าน', '20/11/2568', 'ไม่มีประกัน', 'ปกติ', 'นายบุญเลิศ คำแสน', '054-411-737'],
  ['80-9981 ลำปาง', 'กระเช้าแก้ไฟ', 8, '176,050 กม. · 5,840 ชม.', '10/01/2569', 'MRZ6900014', '10/01/2570 · รอบบำรุงรักษา', 'soon', 'ผ่าน', '10/01/2569', 'อยู่ในประกัน', 'ปกติ', 'นายณรงค์ บุญมา', '089-635-1172'],
  ['82-7720 ขอนแก่น', 'กระเช้าแก้ไฟ', 7, '149,700 กม. · 4,410 ชม.', '02/02/2569', 'MRZ6900014', '02/02/2570 · รอบบำรุงรักษา', 'soon', 'ผ่าน', '02/02/2569', 'ไม่มีประกัน', 'ปกติ', 'นายอำนาจ ไชยสิทธิ์', '043-246-118'],
  ['82-1145 ขอนแก่น', 'กระเช้าฮอทไลน์', 10, '176,050 กม. · 6,010 ชม.', '18/06/2569', 'MRZ6900014', '12/03/2570 · เปลี่ยนน้ำมันไฮดรอลิก', 'soon', 'ผ่าน', '18/06/2569', 'ใกล้หมดประกัน', 'ปกติ', 'นายสมชาย แก้วมณี', '081-472-3365'],
  ['81-6604 เชียงราย', 'กระเช้าแก้ไฟ', 6, '163,480 กม. · 5,120 ชม.', '20/09/2569', 'MRZ7000001', '20/09/2570 · รอบบำรุงรักษา', '', 'ผ่าน', '20/09/2569', 'ไม่มีประกัน', 'ปกติ', 'นายชาตรี อินทร์แก้ว', '053-711-402'],
  ['82-6789 ขอนแก่น', 'กระเช้าแก้ไฟ', 5, '182,640 กม. · 6,131 ชม.', '04/11/2569', 'MRZ7000001', '04/11/2570 · รอบบำรุงรักษา', '', 'รอผลตรวจ', '04/11/2569', 'อยู่ในประกัน', 'ปกติ', 'นายสมชาย แก้วมณี', '081-472-3365'],
  ['81-2210 เชียงใหม่', 'กระเช้าฮอทไลน์', 3, '41,200 กม. · 980 ชม.', '-', '', 'ยังไม่มีข้อมูลการบำรุงรักษา', '', '-', '', 'ไม่มีประกัน', 'งดใช้งาน', 'นายประยุทธ ศรีวงศ์', '053-241-560']];
const DUE = { due: ['ครบกำหนดบำรุงรักษา', 'text-error-600'], soon: ['ใกล้ครบกำหนดบำรุงรักษา', 'text-warning-600'] };
const INS = { 'ไม่มีประกัน': 'b-neutral', 'หมดประกัน': 'b-neutral', 'อยู่ในประกัน': 'b-ok', 'ใกล้หมดประกัน': 'b-low' };
const VST2 = { 'ปกติ': 'b-ok', 'อยู่ระหว่างซ่อม': 'b-low', 'งดใช้งาน': 'b-neutral' };
const sortTh = (label, w, first) => `<th${w ? ` class="w-[${w}px]"` : ''}>${label} <span class="ms">${first ? 'arrow_downward' : 'swap_vert'}</span></th>`;
