# AC annotator รุ่นแยก

สำหรับการส่งข้อมูลระหว่าง Figma และ FigJam ให้ใช้ plugin รวมที่ `../figjam-userstory-plugin/manifest.json` ชื่อ **Maintain-D — AC Bridge (Figma + FigJam)** แทน ดูขั้นตอนที่ `../figjam-userstory-plugin/README.md` ตัวนี้ยังคงไว้สำหรับการใช้งานแบบเดิมและไม่ได้ใช้ที่เก็บข้ามโหมดร่วมกับ plugin รวม

# AC annotator — Overhaul

## อ่าน component จาก frame ปัจจุบัน

เปิดปลั๊กอินใน Figma Design แล้วเลือก frame ที่ต้องการ แผง **Component ล่าสุดจาก frame ที่เลือก** จะอ่านชื่อ instance, main component, variant, property (รวมค่า false) และข้อความใน visible layers ของ frame นั้น อ่านใหม่เมื่อเปลี่ยน selection, เพิ่ม/แก้ component ในหน้าปัจจุบัน หรือกด **อ่าน frame อีกครั้ง** ใช้ปุ่ม **คัดลอกข้อมูล** ส่งรายละเอียดกลับมาเพื่อปรับ behavior ของ AC ได้

ตัวเลือก **แนบ UI ที่อ่านได้ล่าสุดกับ AC** เปิดไว้เป็นค่าเริ่มต้น เมื่อกดแปะ AC จะอ่าน frame สดอีกครั้งและเพิ่มหัวข้อ **UI ล่าสุดจาก frame ที่เลือก** ต่อท้าย AC สเปกเดิมไม่ถูกแก้หรือยืนยันโดยอัตโนมัติ ข้อมูลที่เห็นบน design ไม่ยืนยัน validation, สิทธิ์, API หรือ behavior ตอนคลิก; component ที่เพิ่มจึงถูกบันทึกเป็นข้อมูลที่อ่านได้ ไม่ได้เดาข้อกำหนดให้เอง ป้ายเดิมที่สร้างก่อนหน้านี้ยังคงอยู่ ให้ล้างป้ายเดิมก่อนแปะใหม่เมื่อไม่ต้องการเก็บฉบับก่อน

อ่านได้จาก instance ใน Design เท่านั้น ภาพ screenshot ที่วางใน FigJam ไม่มีข้อมูล component ภายใน ส่วน layers ที่ detach แล้วอ่านได้เฉพาะข้อความและโครงที่เหลือ Hidden layers ไม่ถูกนับเป็น UI ที่แสดง หาก library อ่านไม่ได้จะแสดงคำเตือนและเก็บ property จาก instance เท่าที่อ่านได้ จำกัด 10,000 layers ต่อ frame และแจ้งชัดเมื่ออ่านไม่ครบ

ตัวอ่านร่วมอยู่ที่ `../plugin-lib/frame-inspector.js` หลังแก้ให้รัน `node figma-export/build-frame-inspector.js` เพื่อฝังลงทั้ง ac-annotator-plugin และ figjam-userstory-plugin โดยตัวอ่านไม่เปลี่ยน design และไม่เรียกเครือข่าย

ใช้ page-scoped `nodechange` เพื่อรองรับ dynamic-page โดยไม่ต้องโหลดทุกหน้า: [Figma Plugin API — dynamic loading](https://developers.figma.com/docs/plugins/migrating-to-dynamic-loading/)

ตรวจด้วย:

```sh
node figma-export/test-frame-inspector.js
node figma-export/test-ac-annotator-plugin.js
node figma-export/test-figjam-userstory-plugin.js
```
