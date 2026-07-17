# Maintenance-Request-Form (Maintain-D)

ต้นแบบ (mock) **ฟอร์มแจ้งซ่อมรถ/อุปกรณ์ + flow งานซ่อม กบค.** ของระบบซ่อมบำรุงรถ Maintain-D — design อิงระบบ VMS Plus ของ กฟภ.

## 🚀 เปิดดูต้นแบบ

ดาวน์โหลด/clone แล้วเปิดไฟล์นี้ในเบราว์เซอร์ได้เลย (ไม่ต้องรัน server):

```
mock/Maintenance-Request-Form.html
```

Mock v0.3 มี 2 บทบาทในไฟล์เดียว สลับจากเมนูซ้าย: **แจ้งซ่อม** (ฟอร์ม 4 ขั้น + จอง/สั่งอะไหล่) · **เรื่องของฉัน** (ติดตามสถานะ) · **งานซ่อม กบค.** (ประเมิน → สถานะซ่อม 5 ขั้น → นัดรับ → ตรวจสภาพ → ปิดงาน)

## 📁 โครงสร้าง

| ไฟล์/โฟลเดอร์ | เนื้อหา |
|---|---|
| [00-README.md](00-README.md) | ขอบเขตงาน บันทึกการตัดสินใจ ประเด็นเปิด |
| [01-Design-Reference-VMSPlus.md](01-Design-Reference-VMSPlus.md) | Design tokens/component ที่สกัดจาก VMS Plus |
| [02-Flow-and-Mock-Data.md](02-Flow-and-Mock-Data.md) | Flow ฝั่งผู้แจ้ง + mock data |
| [03-Flow-KBK-Pickup-Inspection.md](03-Flow-KBK-Pickup-Inspection.md) | Flow ฝั่ง กบค.: รับงาน/ส่งกลับ+แนะนำอู่ · สถานะซ่อม · นัดรับ · ตรวจสภาพ |
| [design-system/](design-system/) | Design system (tokens.css + components.css + [style guide](design-system/index.html) + [เอกสาร](design-system/README.md)) |
| [mock/](mock/) | ต้นแบบ HTML คลิกได้จริง |
| [assets/](assets/) | Screenshot อ้างอิงจาก VMS Plus |

> ℹ️ **repo นี้คือบ้านหลักของ design system** (ตัดสินใจ 17 ก.ค. 2569) — แก้ tokens/components ที่นี่ที่เดียว ทุกหน้าในระบบอ้างจากที่นี่

## 🌐 เปิดดูออนไลน์ (GitHub Pages)

- ต้นแบบ: https://anugmail.github.io/Maintenance-Request-Form/mock/Maintenance-Request-Form.html
- Style guide: https://anugmail.github.io/Maintenance-Request-Form/design-system/index.html
