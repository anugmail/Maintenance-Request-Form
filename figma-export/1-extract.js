#!/usr/bin/env node
/* ============================================================
   ท่อนที่ 1 — เปิดหน้าจริงด้วยเบราว์เซอร์แล้วเก็บ DOM + computed style
   ------------------------------------------------------------
   ทำไมต้องเปิดเบราว์เซอร์: 6 หน้านี้เนื้อหามาจาก JS ทั้งหมด
   (`<div id="planNewBody"></div>` แล้ว plan-new.js เติม) parse HTML ดิบได้ศูนย์

   รัน:
     python3 -m http.server 8123 --bind 127.0.0.1 &
     NODE_PATH=<scratchpad>/node_modules node figma-export/1-extract.js

   ผลลัพธ์: out/dom-<slug>.json + out/shot-<slug>.png (ไว้เทียบด้วยตาทีหลัง)
   ============================================================ */

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright-core');

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const CHROME = process.env.CHROME || '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome';
const OUT = path.join(__dirname, 'out');
const WIDTH = 1440;

const PAGES = [
  { slug: 'index',         path: '/maintainance-yearly/index.html',         name: 'รายการแผนบำรุงรักษา' },
  { slug: 'plan-new',      path: '/maintainance-yearly/plan-new.html',      name: 'ออกเลขงาน' },
  { slug: 'supplies',      path: '/maintainance-yearly/supplies.html',      name: 'ฝ่ายพัสดุ' },
  { slug: 'confirm',       path: '/maintainance-yearly/confirm.html',       name: 'ยืนยันรถเข้าร่วมแผน' },
  { slug: 'plan-skeleton', path: '/maintainance-yearly/plan-skeleton.html', name: 'โครงหน้าจอทั้งโฟลว์' }
  // admin.html ตัดออก — 3,770 node · JSON 5.6MB · ส่งผ่าน postMessage แล้ว Figma อืด
  // ถ้าจะเอากลับ ต้องตัดแถวตารางให้เหลือตัวอย่างไม่กี่แถวก่อน

];

/* ------------------------------------------------------------
   ฟังก์ชันนี้ถูก serialize ไปรันในเบราว์เซอร์ — ห้ามอ้างตัวแปรนอก scope
   ------------------------------------------------------------ */
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

/* ------------------------------------------------------------ */
async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const browser = await chromium.launch({ executablePath: CHROME, headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: 1000 },
    deviceScaleFactor: 2
  });

  const errors = [];
  const summary = [];

  for (const p of PAGES) {
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(p.slug + ': ' + e.message));

    const url = BASE + p.path;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // หน้าพวกนี้เติมเนื้อหาด้วย JS หลัง load — รอจนกล่องเนื้อหามีลูกจริง
    await page.waitForFunction(() => {
      const c = document.querySelector('.content');
      return !c || c.children.length > 0;
    }, null, { timeout: 5000 }).catch(() => errors.push(p.slug + ': .content ยังว่างหลังรอ 5 วิ'));
    await page.waitForTimeout(400);

    // ขยาย viewport ให้สูงเท่าหน้าจริง เพื่อไม่ต้องเลื่อน — rect จะได้เป็นพิกัดหน้าตรงๆ
    const h = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.setViewportSize({ width: WIDTH, height: Math.min(Math.max(h, 900), 8000) });
    await page.waitForTimeout(200);

    const data = await page.evaluate(walkDom);
    await page.screenshot({ path: path.join(OUT, 'shot-' + p.slug + '.png'), fullPage: true });

    const payload = {
      version: 1,
      slug: p.slug,
      name: p.name,
      source: p.path,
      viewport: { width: WIDTH, height: data.docHeight },
      extractedAt: new Date().toISOString(),
      root: data.root
    };
    fs.writeFileSync(path.join(OUT, 'dom-' + p.slug + '.json'), JSON.stringify(payload));

    const kb = Math.round(fs.statSync(path.join(OUT, 'dom-' + p.slug + '.json')).size / 1024);
    summary.push({ slug: p.slug, nodes: data.counted, height: data.docHeight, kb });
    console.log('✓ ' + p.slug.padEnd(14) + data.counted + ' node · สูง ' + data.docHeight + 'px · ' + kb + 'KB');

    await page.close();
  }

  await browser.close();

  if (errors.length) {
    console.log('\n⚠ เจอปัญหา ' + errors.length + ' รายการ:');
    errors.forEach(e => console.log('  ' + e));
  }
  fs.writeFileSync(path.join(OUT, 'extract-summary.json'), JSON.stringify({ summary, errors }, null, 2));
  console.log('\nเขียนลง ' + path.relative(process.cwd(), OUT) + '/ แล้ว');
  if (errors.length) process.exitCode = 1;
}

main().catch(e => { console.error(e); process.exit(1); });
