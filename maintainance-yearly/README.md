# 🛠️ Prototype — งานบำรุงรักษาตามวาระ (To-be)

Prototype แบบ **static HTML คลิกเล่นได้จริง** ของ flow *Smart Mechanical Service Management — งานบำรุงรักษาตามวาระ (To-be)* ของ PEA (VMS Plus)
เดินตาม happy path **สายตรวจเอง (กบก.)** ครบ 6 เฟส: ออกเลขงาน → เบิก/จัดหา → ดำเนินการ → ตรวจรับ → รายงาน → คำนวณต้นทุน

> โฟลเดอร์นี้เป็น **โมดูลย่อยใน repo [`Maintenance-Request-Form`](https://github.com/anugmail/Maintenance-Request-Form)** — คนละเรื่องกับต้นแบบ *ฟอร์มแจ้งซ่อม* ที่อยู่ระดับบน (นี่คือ **บำรุงรักษาตามวาระ / scheduled PM**) · ใช้ **design-system ร่วมกัน** กับทั้ง repo

## 🔗 ลิงก์เข้าดู

| ที่ | ลิงก์ |
|---|---|
| **🌐 GitHub Pages (live)** | **https://anugmail.github.io/Maintenance-Request-Form/maintainance-yearly/** — Flow · `.../maintainance-yearly/admin.html` — Master Data |
| **🏠 หน้า Landing รวม** | https://anugmail.github.io/Maintenance-Request-Form/ (มี card "บำรุงรักษาตามวาระ") |
| **📦 Repo** | https://github.com/anugmail/Maintenance-Request-Form |
| **💻 Local** | `http://127.0.0.1:8124/maintainance-yearly/index.html` (ดู "วิธีรัน") |

## 📊 สถานะ (Progress)

| เฟส | สถานะ | ผล |
|---|---|---|
| **Phase 0** — โครง + data/logic | ✅ เสร็จ | `mock-yearly.js` (node test ผ่าน) · shell + stepper 6 เฟส |
| **Phase A** — Admin (Master Data) | ✅ เสร็จ | ตาราง + CRUD รถ / อะไหล่-น้ำมัน-ไส้กรอง (localStorage) · ฟิลเตอร์เขต |
| **Phase 1** — Master Plan | ✅ เสร็จ | wizard 5 ขั้น · เลือกรถ **กรย. 12 เขต / 4 ภาค** (เลือกทั้งเขต/รายคัน/ข้ามเขต) · อนุมัติได้เลขงาน `MT-2569-Q3-001` |
| **Phase 2** — เบิก/จัดหา + แผนเดินทาง | ✅ เสร็จ | เบิกอะไหล่ → แผนเดินทาง → ยืนยัน + Noti + ใบนำจ่าย |
| **Phase 3–6** — ดำเนินการ / ตรวจรับ / รายงาน / ต้นทุน | ⏳ รอทำ | outline อยู่ใน `plan.md` |

## ▶️ วิธีรัน (local, ไม่มี build step)

serve จาก **root ของ repo MRF** (เพื่อให้ลิงก์ `../design-system/` resolve):

```bash
cd Maintenance-Request-Form
python3 -m http.server 8124 --bind 127.0.0.1
# เปิด http://127.0.0.1:8124/maintainance-yearly/index.html   (ห้ามเปิดด้วย file://)
```

## 📁 ไฟล์

| ไฟล์ | เนื้อหา |
|---|---|
| `index.html` + `app.js` | แอปหลัก: flow 6 เฟส (stepper) |
| `admin.html` + `admin.js` | หน้า Admin (Master Data) — จัดการ รถ / อะไหล่-น้ำมัน-ไส้กรอง |
| `mock-yearly.js` | ข้อมูล seed (~120 คัน, 12 เขต) + logic (`deriveItems`, `workNumber`) + storage |
| `test/logic.test.mjs` | เทสต์ logic (รันด้วย `node test/logic.test.mjs`) |
| `plan.md` | แผนการทำแบบแบ่งเฟส |
| `maintannance-yearly.md` | สรุป flow ต้นทาง |

## 🎨 Design system (ใช้ร่วมกับ repo — ไม่ vendored แล้ว)

หน้าเว็บลิงก์ **design-system กลางของ repo โดยตรง** (แหล่งเดียว ไม่มีสำเนาซ้ำ ไม่ drift):
- `../design-system/tokens.css` · `../design-system/components.css` · `../ui-components.js`

ถ้าปรับ design-system ให้แก้ที่ `Maintenance-Request-Form/design-system/` — มีผลกับทั้ง *ฟอร์มแจ้งซ่อม* และ *บำรุงรักษาตามวาระ* พร้อมกัน

## ✅ Verify

- **Logic:** `node maintainance-yearly/test/logic.test.mjs`
- **UI:** serve จาก root MRF แล้วขับด้วย Playwright + Chrome ที่ติดเครื่อง
