#!/usr/bin/env node
/* เสิร์ฟไฟล์ใน out/ ให้ปลั๊กอิน Figma ดึงไปใช้
   ต้องมี CORS เพราะ iframe ของปลั๊กอินมี origin เป็น null
   ใช้เฉพาะ built-in ของ node ไม่มี dependency

   รัน:  node figma-export/serve.js            (พอร์ต 8124)
         PORT=9000 node figma-export/serve.js  (เปลี่ยนพอร์ต — อย่าลืมแก้ manifest ด้วย) */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = Number(process.env.PORT) || 8124;
const OUT = path.join(__dirname, 'out');
/* ป้ายของสเปกบอร์ดที่รู้จัก (ลำดับ = ลำดับที่แสดงในปลั๊กอินบอร์ด) */
const BOARD_LABELS = [
  { file: 'board-maintainance.json', group: 'บำรุงรักษาตามวาระ', label: 'userflow รายscenario' },
  { file: 'board-maintainance-ui.json', group: 'บำรุงรักษาตามวาระ', label: 'UI scenario (ภาพจอจาก Figma)' },
  { file: 'board-maintainance-flow-ui.json', group: 'บำรุงรักษาตามวาระ', label: 'userflow คู่ภาพจอ', inAll: false },
  { file: 'board-maintainance-journey.json', group: 'บำรุงรักษาตามวาระ', label: 'journey ต่อกันทั้งเรื่อง' },
  { file: 'board-maintainance-story-map.json', group: 'บำรุงรักษาตามวาระ', label: 'user story mapping (JO ข้อ 7.3)' },
  { file: 'board-maintainance-usecase.json', group: 'บำรุงรักษาตามวาระ', label: 'use case 92 ข้อ' },
  { file: 'board-maintainance-ac-create.json', group: 'บำรุงรักษาตามวาระ', label: 'AC หน้าสร้างแผน (ไฟล์ 25)' },   // 5 พ.ย. 2569 · 9-ac-board.js --src=…/25-บำรุงรักษา-AC-หน้า-สร้างแผน.md
  { file: 'board-login-flow.json', group: 'Login และสิทธิ์', label: 'ลำดับ login + ภาพหน้าจริง' },
  { file: 'board-login-permission.json', group: 'Login และสิทธิ์', label: 'สิทธิ์ Overhaul ตาม role' },
  { file: 'board-login-ac.json', group: 'Login และสิทธิ์', label: 'AC รายจอ 7 จอ' },
  { file: 'board-ac-overhaul-page1.json', group: 'Overhaul', label: 'AC หน้า 1 รายการแผน' },
  { file: 'board-overhaul2.json', group: 'Overhaul', label: 'ภาพจอจาก HTML (ชุดเก่า 19 ต.ค.)', inAll: false },
];

const handler = (req, res) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Cache-Control': 'no-store'
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    return res.end();
  }

  // กัน path traversal — normalize แล้วต้องยังอยู่ใต้ out/ เท่านั้น
  // (รับ path ย่อยได้ เช่น figjam/flow-plan/01-….png สำหรับบอร์ด FigJam)
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.normalize(path.join(OUT, rel === '' ? 'spec.json' : rel));
  if (file !== OUT && !file.startsWith(OUT + path.sep)) {
    res.writeHead(403, cors);
    return res.end();
  }

  /* POST — ให้ปลั๊กอินส่งผลกลับมาเขียนลง out/ (ใช้กับ catalog-plugin ที่ดัมป์ component
     จากไฟล์ Figma จริง) · เขียนได้เฉพาะ .json ใต้ out/ เท่านั้น กัน path traversal ด้วย guard ตัวเดียวกับ GET */
  if (req.method === 'POST' && path.extname(file) === '.png') {   // ภาพจอจากปลั๊กอิน Figma (30 ต.ค. 2569) — เขียนได้เฉพาะใต้ out/figjam/
    if (!file.startsWith(path.join(OUT, 'figjam') + path.sep)) { res.writeHead(403, cors); return res.end(); }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const buf = Buffer.concat(chunks);
      fs.mkdir(path.dirname(file), { recursive: true }, () => fs.writeFile(file, buf, (err) => {
        console.log((err ? '✗ เขียนไม่ได้ ' : '✓ เขียน ') + path.relative(process.cwd(), file) + (err ? ' — ' + err.message : ' (' + buf.length.toLocaleString() + ' ไบต์)'));
        res.writeHead(err ? 500 : 200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors));
        res.end(JSON.stringify(err ? { error: err.message } : { ok: true, bytes: buf.length }));
      }));
    });
    return;
  }
  if (req.method === 'POST') {
    if (path.extname(file) !== '.json') {
      res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors));
      return res.end(JSON.stringify({ error: 'เขียนได้เฉพาะไฟล์ .json' }));
    }
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      /* manifest ภาพจอ (5 พ.ย. 2569): ส่งหลายหน้า Figma ⇒ รวมกับ manifest เดิมในโฟลเดอร์เดียวกัน (รหัสจอซ้ำ = ภาพที่ส่งล่าสุด) ไม่ทับทั้งไฟล์ */
      if (path.basename(file) === 'manifest.json' && file.startsWith(path.join(OUT, 'figjam') + path.sep) && fs.existsSync(file)) {
        try {
          const old = JSON.parse(fs.readFileSync(file, 'utf8')), neu = JSON.parse(body);
          if (Array.isArray(old.shots) && Array.isArray(neu.shots)) {
            const k = (x) => x.code + '|' + (x.device || 'desktop');   // จอเดียวกันมีทั้ง desktop และ mobile (5 พ.ย. 2569)
            const by = new Map(old.shots.map(x => [k(x), x]));
            neu.shots.forEach(x => by.set(k(x), x));
            const pages = [...new Set([].concat(old.pages || [old.page], neu.page).filter(Boolean))];
            body = JSON.stringify(Object.assign({}, neu, { page: pages.join(' + '), pages, shots: [...by.values()] }), null, 1);
            console.log('รวม manifest กับของเดิม: ' + by.size + ' จอ จาก ' + pages.length + ' หน้า');
          }
        } catch (e) { console.log('รวม manifest ไม่ได้ เขียนทับ — ' + e.message); }
      }
      fs.mkdir(path.dirname(file), { recursive: true }, () => {
        fs.writeFile(file, body, (err) => {
          const ok = !err;
          console.log((ok ? '✓ เขียน ' : '✗ เขียนไม่ได้ ') + path.relative(process.cwd(), file)
            + (ok ? ' (' + body.length.toLocaleString() + ' ไบต์)' : ' — ' + err.message));
          res.writeHead(ok ? 200 : 500, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors));
          res.end(JSON.stringify(ok ? { ok: true, bytes: body.length } : { error: err.message }));
        });
      });
    });
    return;
  }

  /* GET /boards.json — รายการสเปกบอร์ด FigJam ที่มีใน out/ ตอนนี้ (สร้างสดทุกครั้ง) ให้ปลั๊กอินบอร์ดติ๊กเลือกสร้างทีละส่วนบนบอร์ดเดียว (30 ต.ค. 2569)
     กลุ่ม/ป้ายของไฟล์ที่รู้จักอยู่ใน BOARD_LABELS · ไฟล์อื่นขึ้นในกลุ่ม "อื่น ๆ" ด้วยชื่อเรื่องในสเปก · board.json (ชุดแรก ไม่มี anchor = ล้างของบนบอร์ด) ไม่แสดง */
  if (req.method === 'GET' && rel === 'boards.json') {
    const list = fs.readdirSync(OUT).filter(f => /^board-.+\.json$/.test(f)).map(f => {
      let spec = {}; try { spec = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); } catch (e) { return null; }
      if (!Array.isArray(spec.sections)) return null;
      const known = BOARD_LABELS.find(x => x.file === f);
      const perS = f.match(/^board-maintainance-ui-S(\d+)\.json$/);   // 9 พ.ย. 2569 บอร์ดราย scenario (3-figjam-board.js --split-scen) · ไม่รวมใน "ติ๊กทั้งหมด" กันซ้ำกับชุดเต็ม
      if (perS) return { file: f, group: 'บำรุงรักษาตามวาระ · ราย scenario', label: spec.title || ('S' + perS[1]), order: 500 + Number(perS[1]), inAll: false,
        sections: spec.sections.length, images: spec.sections.reduce((n, s) => n + (s.cols || []).reduce((m, c) => m + c.images.length, 0), 0), updated: fs.statSync(path.join(OUT, f)).mtime.toISOString() };
      return { file: f, group: known ? known.group : 'อื่น ๆ', label: known ? known.label : (spec.title || f), order: known ? BOARD_LABELS.indexOf(known) : 999, inAll: !known || known.inAll !== false,   // inAll:false = ไม่ติ๊กตอนกด "ติ๊กทั้งหมด" (ซ้ำกับส่วนอื่น หรือชุดเก่า)
        sections: spec.sections.length, images: spec.sections.reduce((n, s) => n + (s.cols || []).reduce((m, c) => m + c.images.length, 0), 0),
        updated: fs.statSync(path.join(OUT, f)).mtime.toISOString() };
    }).filter(Boolean).sort((x, y) => x.order - y.order || x.file.localeCompare(y.file));
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors));
    return res.end(JSON.stringify({ boards: list }));
  }

  const TYPES = { '.png': 'image/png', '.json': 'application/json; charset=utf-8' };
  fs.readFile(file, (err, body) => {
    if (err) {
      res.writeHead(404, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors));
      return res.end(JSON.stringify({ error: 'ไม่พบไฟล์ ' + path.relative(process.cwd(), file) }));
    }
    const type = TYPES[path.extname(file)] || 'application/octet-stream';
    res.writeHead(200, Object.assign({ 'Content-Type': type }, cors));
    res.end(body);
  });
};

/* Figma รับเฉพาะ "localhost" ใน devAllowedDomains (IP literal ถูก reject)
   แต่บน macOS "localhost" resolve เป็น ::1 ก่อน 127.0.0.1
   ⇒ ต้อง listen ทั้งสองฝั่ง ไม่งั้นปลั๊กอินจะต่อไม่ติดแบบงงๆ
   ทั้งคู่เป็น loopback ล้วน ไม่เปิดออกเน็ตเวิร์ก                        */
let ready = 0;
for (const host of ['127.0.0.1', '::1']) {
  const server = http.createServer(handler);
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error('พอร์ต ' + PORT + ' ถูกใช้อยู่แล้ว — ปิดตัวเดิมก่อน หรือใช้ PORT=xxxx');
      process.exit(1);
    }
    // ไม่มี IPv6 ในเครื่องก็ไม่เป็นไร ขอให้ 127.0.0.1 ขึ้นก็พอ
    if (host === '::1') return;
    throw err;
  });
  server.listen(PORT, host, () => {
    if (++ready === 1) {
      console.log('เสิร์ฟ ' + path.relative(process.cwd(), OUT) + '/ ที่ http://localhost:' + PORT);
      console.log('ปลั๊กอินจะดึง http://localhost:' + PORT + '/spec.json');
    }
  });
}
