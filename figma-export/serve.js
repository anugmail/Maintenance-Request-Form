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
  if (req.method === 'POST') {
    if (path.extname(file) !== '.json') {
      res.writeHead(400, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors));
      return res.end(JSON.stringify({ error: 'เขียนได้เฉพาะไฟล์ .json' }));
    }
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
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
