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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Cache-Control': 'no-store'
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors);
    return res.end();
  }

  // กัน path traversal — รับเฉพาะชื่อไฟล์ตรงๆ ใน out/
  const name = path.basename(decodeURIComponent(req.url.split('?')[0]));
  const file = path.join(OUT, name === '' || name === '/' ? 'spec.json' : name);

  fs.readFile(file, (err, body) => {
    if (err) {
      res.writeHead(404, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors));
      return res.end(JSON.stringify({ error: 'ไม่พบไฟล์ ' + path.relative(process.cwd(), file) }));
    }
    res.writeHead(200, Object.assign({ 'Content-Type': 'application/json; charset=utf-8' }, cors));
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
