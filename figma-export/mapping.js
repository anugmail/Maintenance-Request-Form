/* ============================================================
   ตารางแปลง — คลาสใน design system → ชื่อ/ชนิดของ node ใน Figma
   ------------------------------------------------------------
   ไฟล์นี้คือ "หัวใจ" ของงานแปลง แก้ที่นี่แล้วรัน 2-map.js ซ้ำได้ทันที
   ไม่ต้องเปิด Chromium ใหม่

   หลักการ: ชื่อ layer ต้อง map กลับไปหาคลาสในโค้ดได้เสมอ
     .btn.btn-p.btn-md  →  btn / primary / md
   เพราะมันเป็นทั้งสะพานให้ dev อ่าน และเป็นตัวเดียวที่จับได้ว่า
   ไฟล์ Figma เริ่มหลุดจากโค้ดเมื่อไหร่
   ============================================================ */

/* ---------- Button: hierarchy + size อ่านจากคลาส ---------- */
const BTN_HIERARCHY = {
  'btn-p': 'primary', 'btn-s': 'secondary', 'btn-t': 'tertiary',
  'btn-o': 'outline', 'btn-g': 'gray', 'btn-d': 'destructive',
  'btn-ds': 'destructive-secondary', 'btn-link': 'link', 'btn-linkgray': 'link-gray'
};
const BTN_SIZE = { 'btn-sm': 'sm', 'btn-md': 'md', 'btn-lg': 'lg', 'btn-xl': 'xl' };

/* ---------- Badge: สถานะอ่านจากคลาส ---------- */
const BADGE_STATUS = { 'b-ok': 'success', 'b-low': 'warning', 'b-out': 'error', 'b-brand': 'brand' };

/* ---------- คลาสที่ตั้งชื่อตรงๆ ได้เลย ----------
   ค่าคือชื่อที่จะใช้ใน Figma · เรียงตามลำดับความจำเพาะ (เจาะจงก่อนกว้าง) */
const SIMPLE = [
  ['shell', 'shell'], ['side', 'sidebar'], ['work', 'work'], ['topbar', 'topbar'],
  ['content', 'content'], ['vlogo', 'logo'], ['nv', 'sidebar item'],
  ['draft', 'draft banner'], ['crumbs', 'breadcrumb'],
  ['page-title-row', 'page title row'], ['page-title', 'page title'], ['page-back', 'page back'],
  ['wsteps', 'stepper'], ['wstep', 'stepper step'], ['wgrp', 'stepper group label'],
  ['sect', 'section header'], ['card', 'card'], ['sub', 'subtitle'],
  ['tblwrap', 'table wrap'], ['tbl', 'table'],
  ['rzone-head', 'review zone / head'], ['rzone-body', 'review zone / body'],
  ['rzone-count', 'review zone / count'], ['rzone-caret', 'review zone / caret'],
  ['rzone-allchk', 'review zone / select all'], ['rzone', 'review zone'],
  // การ์ดรถของ mock แจ้งซ่อม (UIC.vehicleCard ใน ui-components.js)
  ['vehicle-detail-card', 'vehicle detail card'], ['vehicle-detail-grid', 'vehicle detail grid'],
  ['vehicle-detail-label', 'vehicle detail label'], ['vehicle-detail-value', 'vehicle detail value'],
  ['vehicle-target-option', 'vehicle target option'], ['vehicle-target-legend', 'vehicle target legend'],
  ['vehicle-target', 'vehicle target'], ['veh', 'vehicle card'],
  ['fgrid', 'form grid'], ['actions', 'actions'], ['footer', 'footer'],
  ['empty', 'empty state'], ['toast', 'toast'], ['chk', 'checkbox'],
  ['seg', 'segmented'], ['chips', 'chips'], ['chip', 'chip'],
  ['tl', 'timeline'], ['qty', 'qty stepper'], ['numfld', 'number field'],
  ['st', 'step status'], ['toolbar', 'toolbar'], ['done', 'done'], ['todo', 'todo'],
  ['ms', 'icon'], ['lbl', 'label'], ['num', 'number'], ['sep', 'separator'],
  ['cur', 'current'], ['in', 'input wrap'], ['f', 'form field']
];

/* ---------- ชื่อจาก tag เมื่อไม่มีคลาสให้ยึด ---------- */
const TAG_NAME = {
  table: 'table', thead: 'table head', tbody: 'table body', tr: 'row',
  th: 'header cell', td: 'cell', ul: 'list', ol: 'list', li: 'list item',
  input: 'input', select: 'select', textarea: 'textarea', button: 'button',
  a: 'link', h1: 'heading 1', h2: 'heading 2', h3: 'heading 3',
  label: 'label', main: 'main', aside: 'aside', header: 'header', footer: 'footer',
  // ตัวห่อทั่วไป — ไม่มีความหมายเชิงดีไซน์ แต่ต้องนับว่า "รู้จัก"
  // ไม่งั้นรายการ unknown จะเต็มไปด้วย <div> จนอ่านไม่ออกว่าอะไรคือของจริงที่ยังไม่ได้แปล
  div: 'group', span: 'text group', b: 'bold', strong: 'bold', em: 'emphasis',
  small: 'small', code: 'code', p: 'paragraph', section: 'section', nav: 'nav'
};

/* ค่าคงที่ที่ 2-map.js ใช้ร่วม */
const ICON_CLASS = 'ms';                 // <span class="ms">build</span> = Material Symbols
const GAP_TOLERANCE = 2;                 // ระยะห่างต่างกันไม่เกินนี้ ถือว่าสม่ำเสมอ → ใช้ auto-layout ได้

/* ------------------------------------------------------------
   ตั้งชื่อ node
   ------------------------------------------------------------ */
function nameFor(node, ctx) {
  const c = node.classes || [];
  const has = (x) => c.includes(x);

  if (has('btn')) {
    const hierarchy = c.map(x => BTN_HIERARCHY[x]).find(Boolean) || 'default';
    const size = c.map(x => BTN_SIZE[x]).find(Boolean) || 'md';
    // .actions .btn และ .footer .btn ทับขนาดปุ่มใน components.css
    // (min-width:170px; padding:12px 24px; font-size:15px) จึงต้องแยกชื่อ
    // ไม่งั้นสองอันที่หน้าตาต่างกันจริงจะกลายเป็น variant เดียวกัน
    const ctxSuffix = (ctx && (ctx.inActions || ctx.inFooter)) ? ' (actions)' : '';
    const state = node.attrs && (node.attrs.disabled != null || node.attrs['aria-disabled'] === 'true') ? ' / disabled' : '';
    return 'btn / ' + hierarchy + ' / ' + size + state + ctxSuffix;
  }

  if (has('badge')) {
    const status = c.map(x => BADGE_STATUS[x]).find(Boolean) || 'default';
    return 'badge / ' + status;
  }

  if (has(ICON_CLASS)) {
    const glyph = (node.children || []).filter(k => k.tag === '#text').map(k => k.chars).join('');
    return 'icon / ' + (glyph || '?');
  }

  if (has('nv')) return 'sidebar item' + (has('on') ? ' / active' : '');
  if (has('wstep')) {
    if (has('active')) return 'stepper step / active';
    if (has('passed') || has('done')) return 'stepper step / passed';
    if (has('locked')) return 'stepper step / locked';
    return 'stepper step';
  }

  for (const [cls, name] of SIMPLE) if (has(cls)) return name;
  if (TAG_NAME[node.tag]) return TAG_NAME[node.tag];
  return node.tag;
}

/* element นี้ "รู้จัก" ไหม — ตัวที่ไม่รู้จักจะถูกนับเป็น fallback
   ใช้เป็นเกณฑ์วัดว่าตารางแปลงครอบคลุมพอหรือยัง (ดู spec ข้อ 6) */
function isKnown(node) {
  const c = node.classes || [];
  if (c.includes('btn') || c.includes('badge') || c.includes(ICON_CLASS)) return true;
  if (SIMPLE.some(([cls]) => c.includes(cls))) return true;
  if (TAG_NAME[node.tag]) return true;
  return false;
}

module.exports = { nameFor, isKnown, ICON_CLASS, GAP_TOLERANCE, BTN_HIERARCHY, BTN_SIZE, BADGE_STATUS };
