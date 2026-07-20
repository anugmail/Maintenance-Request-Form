/* ============================================================
   Service Worker — daily-record PWA
   ⚠️ ทุกครั้งที่ deploy ให้ bump เลขเวอร์ชันใน CACHE (v1 → v2 → …)
      เพื่อให้ผู้ใช้ที่ติดตั้งแอปแล้วได้ไฟล์ชุดใหม่
   กลยุทธ์: network-first สำหรับหน้า HTML (ออนไลน์ได้ของสด,
   ออฟไลน์ fallback เป็น shell ใน cache) · cache-first สำหรับ asset อื่น
   + runtime cache ฟอนต์ Google (ใช้ออฟไลน์ได้หลังเปิดครั้งแรก)
   ============================================================ */
const CACHE='daily-record-v1';
const ASSETS=[
  './','./index.html','./app.js','./ocr.js','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png',
  '../design-system/tokens.css','../design-system/components.css',
  '../config.js','../config-daily.js'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys()
      .then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(e.request.mode==='navigate'){
    e.respondWith(
      fetch(e.request)
        .then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r})
        .catch(()=>caches.match(e.request).then(hit=>hit||caches.match('./index.html')))
    );
    return;
  }
  if(url.hostname.endsWith('fonts.googleapis.com')||url.hostname.endsWith('fonts.gstatic.com')){
    e.respondWith(
      caches.match(e.request).then(hit=>hit||fetch(e.request).then(r=>{
        const cp=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return r;
      }))
    );
    return;
  }
  e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request)));
});
