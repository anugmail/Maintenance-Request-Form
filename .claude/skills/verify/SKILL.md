---
name: verify
description: Build/launch/drive recipe for verifying this static prototype (mock + admin-config) end-to-end in a real browser
---

# Verify: Maintenance-Request-Form prototype

Static HTML, no build step. Surface = browser pixels/DOM.

## Launch

```bash
cd <repo-root>
python3 -m http.server 8123 --bind 127.0.0.1   # ห้ามใช้ file:// — storage event ข้ามแท็บไม่เสถียร
```

## Drive (Playwright + Chrome ติดเครื่อง — ไม่ต้องโหลด browser)

```bash
npm i playwright-core   # ใน scratchpad
```

```js
const {chromium}=require('playwright-core');
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome 2.app/Contents/MacOS/Google Chrome',headless:true});
// เปิด mock กับ admin-config.html เป็นคนละ page ใน context เดียวกัน → localStorage ร่วมกัน + storage event ยิงข้ามหน้าจริง
```

## Flows worth driving

1. **Regression gate**: ล้าง localStorage → mock ต้องเหมือน default ทุกอย่าง (magenta, 4 ขั้น, 2 งาน, เมนูครบ)
2. **ธีมสด**: admin เลือก preset → mock เปลี่ยนสีทันทีโดย "ไม่รีโหลด" (เช็คด้วย window marker)
3. **Toggle/variant/seed/master** → mock ต้องรีโหลดเอง (waitForEvent('load')) แล้วสะท้อนค่าใหม่
4. ฟอร์มแจ้งซ่อมจนจบ + flow กบค. (รับเรื่อง → เดินสถานะ → นัดรับ → ปิดงาน) ทั้งแบบเปิด/ปิดตรวจสภาพ
5. Reset ทั้งหมด + corrupt localStorage (`{{{broken`) → ต้องไม่ crash

## Gotchas

- Playwright `hasText:'ปิด'` จะ match "เ**ปิด**" ด้วย — ใช้ `hasText:/^ปิด$/`
- ปุ่ม confirm ใช้ native dialog → `page.on('dialog',d=>d.accept())`
- seed jobs ใน config.js ต้อง shape ตรงกับ mock (statusInfo/renderKbkDetail) — แก้ mock แล้วรัน flow 4 ซ้ำ
