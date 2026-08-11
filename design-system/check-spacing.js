// check-spacing.js — จับ "คอมโพเนนต์ติดกันสนิท 0px" ที่ตาไม่ทันเห็น
//
// ทำไมต้องมี: คอมโพเนนต์ในระบบนี้ถือ margin ของตัวเองไม่สม่ำเสมอ
//   .job มี margin-bottom 10px · .search ไม่มีเลย · .sect มี 8px 0 2px
// เอามาต่อกันแล้วระยะเดาไม่ได้ ต้องวัด — เคยหลุดจริง (search ติดลิสต์ 0px, 10 ส.ค. 2569)
// grep จับไม่ได้เพราะไม่ใช่ความผิดเชิงข้อความ ต้องเรนเดอร์แล้ววัดเท่านั้น
//
// รัน: python3 -m http.server 8123 --bind 127.0.0.1 &
//      NODE_PATH=<ที่ที่ npm i playwright-core ไว้>/node_modules \
//        node design-system/check-spacing.js [path1 path2 ...]
//      (ไม่ใส่ path = ตรวจชุดหน้าหลักของโปรเจกต์)

const { chromium } = require('playwright-core');

const DEFAULT_PAGES = [
  '/design-mock/index.html',
  '/design-mock/kbk-self-repair-parts.html',
  '/design-mock/kbk-self-repair-appointment.html',
  '/maintainance-yearly/index.html',
  '/maintainance-yearly/plan-new.html',
  '/maintainance-yearly/confirm.html',
  '/maintainance-yearly/supplies.html',
  '/maintainance-yearly/admin.html',
];

// คอนเทนเนอร์ที่ "ตั้งใจให้ลูกติดกัน" — ข้ามทั้งซับทรี
const FLUSH_BY_DESIGN = ['.wsteps', '.qty', '.tbl', '.seg', '.chips', '.rads', '.numfld', '.side', '.topbar', '.steps'];

// ตัวที่ "ตั้งใจให้ชิดกับของถัดไป" — เป็น page chrome เต็มความกว้าง ไม่ใช่คอมโพเนนต์เนื้อหา
// .draft/.topbar = แบนเนอร์ระบบ · .seg = แถบแท็บที่แปะติดกับพาเนลของตัวเอง
// .gframe = พื้นที่พรีวิว/รูปปกของการ์ด ต้องชิดกับคำบรรยายใต้ภาพเสมอ
const FLUSH_SELF = ['.draft', '.topbar', '.seg', '.crumbs', '.gframe'];

const BASE = process.env.BASE || 'http://127.0.0.1:8123';
const pages = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PAGES;

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome',
    headless: true,
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  let total = 0;
  for (const path of pages) {
    await page.goto(BASE + path, { waitUntil: 'networkidle' });
    const findings = await page.evaluate(([FLUSH, FLUSH_SELF]) => {
      const out = [];
      const label = el => {
        const cls = (el.className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 3).join('.');
        const id = el.id ? '#' + el.id : '';
        const txt = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
        return `${el.tagName.toLowerCase()}${id}${cls ? '.' + cls : ''}${txt ? ` "${txt}"` : ''}`;
      };

      for (const parent of document.querySelectorAll('body *')) {
        if (FLUSH.some(sel => parent.closest(sel))) continue;
        // นับเฉพาะ "กล่อง" (มีขอบ/พื้น/มีลูกเป็นอิลิเมนต์) — บรรทัดข้อความเปล่าๆ
        // อย่างชื่อ+รหัสในแถวเดียวกันตั้งใจให้ชิด line-height เป็นตัวคุมระยะเอง
        const isBox = el => {
          const cs = getComputedStyle(el);
          const hasBorder = ['Top','Right','Bottom','Left'].some(s => parseFloat(cs['border' + s + 'Width']) > 0);
          const hasBg = cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent';
          return hasBorder || hasBg || el.childElementCount > 0;
        };
        const kids = [...parent.children].filter(el => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.height > 0 && r.width > 0 && cs.display !== 'inline' && cs.position !== 'absolute' && isBox(el);
        });
        for (let i = 0; i < kids.length - 1; i++) {
          const a = kids[i].getBoundingClientRect(), b = kids[i + 1].getBoundingClientRect();
          const stackedVertically = Math.abs(a.left - b.left) < 2 && b.top >= a.top;
          if (!stackedVertically) continue;              // เรียงแนวนอน ไม่เกี่ยว
          const gap = Math.round(b.top - a.bottom);
          if (gap !== 0) continue;
          // ตัวบนตั้งใจชิดของถัดไป (แบนเนอร์/แท็บ) — ไม่นับเป็นบั๊ก
          if (FLUSH_SELF.some(sel => kids[i].matches(sel))) continue;
          out.push({ parent: label(parent), a: label(kids[i]), b: label(kids[i + 1]) });
        }
      }
      return out;
    }, [FLUSH_BY_DESIGN, FLUSH_SELF]);

    total += findings.length;
    if (findings.length) {
      console.log(`\n✗ ${path} — ติดกัน 0px ${findings.length} จุด`);
      findings.slice(0, 8).forEach(f => console.log(`    ใน ${f.parent}\n      ${f.a}\n      ${f.b}`));
      if (findings.length > 8) console.log(`    … อีก ${findings.length - 8} จุด`);
    } else {
      console.log(`✓ ${path}`);
    }
  }

  console.log(total === 0
    ? '\nผ่าน — ไม่มีคอมโพเนนต์ติดกันสนิท'
    : `\nไม่ผ่าน — รวม ${total} จุด · แก้โดยห่อกลุ่มนั้นด้วย .stack (ดู design-system/README.md ข้อ 4)`);

  await browser.close();
  process.exit(total === 0 ? 0 : 1);
})();
