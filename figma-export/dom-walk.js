/* ============================================================
   walkDom — เดิน DOM เก็บ rect + computed style + pseudo-element
   ------------------------------------------------------------
   ฟังก์ชันนี้ถูก serialize ไปรันในเบราว์เซอร์ (page.evaluate)
   — ห้ามอ้างตัวแปรนอก scope เด็ดขาด

   แชร์กันระหว่าง 1-extract.js (เก็บทีละหน้า สถานะแรก)
   กับ flow-report-extract.js (เก็บทีละ state ของ wizard แจ้งซ่อม)
   ============================================================ */

function walkDom() {
  /* style ที่เก็บ — เลือกเฉพาะที่มีผลกับการสร้าง node ใน Figma
     เก็บเกินก็แค่ไฟล์ใหญ่ แต่เก็บขาดแล้วต้องเปิด Chromium ใหม่ทั้งรอบ */
  const PROPS = [
    'display', 'position', 'overflow', 'opacity', 'visibility', 'boxSizing',
    'flexDirection', 'flexWrap', 'justifyContent', 'alignItems', 'alignSelf', 'flexGrow', 'flexShrink', 'flexBasis',
    'rowGap', 'columnGap',
    'gridTemplateColumns', 'gridTemplateRows',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'backgroundColor', 'backgroundImage',
    'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'borderTopStyle', 'borderRightStyle', 'borderBottomStyle', 'borderLeftStyle',
    'borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomRightRadius', 'borderBottomLeftRadius',
    'boxShadow', 'transform',
    'color', 'fontSize', 'fontWeight', 'fontFamily', 'fontStyle',
    'lineHeight', 'letterSpacing', 'textAlign', 'textDecorationLine', 'whiteSpace', 'textTransform'
  ];

  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'LINK', 'META', 'TITLE', 'HEAD', 'BR', 'NOSCRIPT']);

  function pick(cs) {
    const out = {};
    for (const p of PROPS) out[p] = cs[p];
    return out;
  }

  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
  }

  /* ข้อความที่มองไม่เห็นจะทำให้ layout ใน Figma เพี้ยน — คัดออกตั้งแต่ต้นทาง
     หมายเหตุ: ตัดเฉพาะที่ "ซ่อนจริง" ไม่ตัดของที่กว้าง 0 เพราะ auto-layout ยุบเอง */
  function isHidden(el, cs, rect) {
    if (SKIP_TAGS.has(el.tagName)) return true;
    if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    if (parseFloat(cs.opacity) === 0) return true;
    if (rect.w === 0 && rect.h === 0) return true;
    return false;
  }

  /* ::before / ::after ที่มีภาพจริง — DOM ไม่มี node ให้เดิน ต้องดึงจาก computed style
     ในระบบนี้มี 8 จุด เช่น แถบม่วง 4×20 ของ .sect และเส้นเฉียงของ .wstep
     ถ้าไม่เก็บ หน้าจอจะขาดแถบหัวข้อกับเส้นคั่น stepper ทั้งหมด */
  function pseudos(el) {
    const found = [];
    for (const which of ['::before', '::after']) {
      const cs = getComputedStyle(el, which);
      if (!cs || cs.content === 'none' || cs.content === 'normal') continue;
      if (cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
      const w = parseFloat(cs.width), h = parseFloat(cs.height);
      const hasBox = (w > 0 && h > 0);
      const hasText = cs.content && cs.content !== '""' && cs.content !== "''";
      if (!hasBox && !hasText) continue;
      found.push({ which, content: cs.content, style: pick(cs), width: w, height: h });
    }
    return found;
  }

  /* rect ของ text node ต้องใช้ Range — el.getBoundingClientRect() ให้กล่องของ element
     ซึ่งกว้างกว่าตัวอักษรจริง ทำให้จัดกึ่งกลางใน Figma เพี้ยน */
  function textRect(node) {
    const range = document.createRange();
    range.selectNodeContents(node);
    const r = range.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
  }

  let counter = 0;

  function walk(el) {
    const cs = getComputedStyle(el);
    const rect = rectOf(el);
    if (isHidden(el, cs, rect)) return null;

    const node = {
      id: 'n' + (counter++),
      tag: el.tagName.toLowerCase(),
      classes: Array.from(el.classList),
      attrs: {},
      rect,
      style: pick(cs),
      pseudo: pseudos(el),
      children: []
    };

    for (const a of ['id', 'title', 'type', 'placeholder', 'value', 'href', 'colspan', 'aria-disabled', 'disabled']) {
      const v = el.getAttribute && el.getAttribute(a);
      if (v != null) node.attrs[a] = v;
    }
    // input/select ไม่มี text node ลูก ค่าที่เห็นบนหน้าจออยู่ใน property
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') node.attrs.value = el.value;
    if (el.tagName === 'SELECT') node.attrs.selectedText = el.selectedOptions[0] ? el.selectedOptions[0].text : '';

    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const chars = child.nodeValue.replace(/\s+/g, ' ').trim();
        if (!chars) continue;
        node.children.push({ id: 'n' + (counter++), tag: '#text', chars, rect: textRect(child), style: pick(cs) });
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const sub = walk(child);
        if (sub) node.children.push(sub);
      }
    }
    return node;
  }

  const root = document.querySelector('.shell') || document.body;
  return {
    root: walk(root),
    docHeight: document.documentElement.scrollHeight,
    counted: counter
  };
}

module.exports = { walkDom };
