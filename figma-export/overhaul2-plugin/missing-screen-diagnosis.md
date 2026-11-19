# ตรวจหน้าหาย — 6 พ.ย. 2569

## อาการที่จำลองได้

เรียก callback จริงทุก state ด้วย component ที่ประกาศใน NEEDED โดยใช้ Figma API จำลองสำหรับการทำงาน JavaScript ไม่จำลอง variant/auto-layout จริง:

- I.2 / I.3 / I.4 / I.5 และ M.2 ล้มด้วย `ไม่พบ component "Icon button"` เพราะ photoCard เรียกชื่อที่ไม่ได้อยู่ใน KEYS/NEEDED จึงไม่เคยถูกโหลด
- H.3 ล้มด้วยการอ่าน findOne จาก undefined เมื่อ RepairAppointmentStep ไม่มีช่องผู้ประสานงานตามโครงที่คาด (repro นี้ตั้งใจใช้ composite ที่ไม่มีชั้นดังกล่าว)
- Header ที่มีชื่อถูก แต่ไม่มี Type=Subheader ทำให้ flowBar โยน exception ก่อนเข้าลูปสร้างจอ อาจหยุดทั้งชุดและไม่สร้างบล็อกที่เหลือ
- buildGrid เดิม catch error ของแต่ละจอแล้วข้าม แต่ท้ายบล็อก log ✓ เสมอ ไม่มีรายการหน้าที่ขาดชัดเจน
- UI แสดงจำนวนเก่า 62 จอ ทั้งที่ SCENARIOS ปัจจุบันมี 86 จอ Desktop

## สิ่งที่แก้

- photoCard ใช้ Secondary button ที่โหลดอยู่แล้ว ตั้ง Leading icon=delete และ Button text=false (property ยืนยันจาก dump) ไม่มี dependency/key ใหม่
- H.3 เก็บเฟรมและแจ้งเตือนโครงช่องผู้ประสานงานที่ขาด ไม่อ่าน property จาก undefined
- Header ผิด variant ใช้แถบสำรองนอกเฟรมจอที่มีอยู่แล้วตาม R19 พร้อม log เหตุผล ไม่หยุดชุดที่เหลือ
- buildGrid คืน made / failed / incomplete / expected และรายงานรหัส อุปกรณ์ ข้อความ error หรือ warnings ของแต่ละหน้า
- บล็อกที่มีหน้าล้มเหลวหรือ warning ไม่ขึ้น ✓ ว่าครบ
- buildSet ส่ง build-report ไป UI และแสดงยอด created/expected พร้อมรายการ error
- UI อ่านจำนวนจอและจำนวนแต่ละ scenario จาก SCENARIOS ปัจจุบัน ไม่เขียนยอด 62 ค้างไว้

## ผลตรวจและขอบเขต

- test-overhaul-all-screen-runtime.js: ก่อนแก้ล้ม 6/86 จอ; หลังแก้ callback 86/86 ผ่าน ทั้งกรณีมีและไม่มี local composites และ Header ผิด variant ไม่หยุดชุด
- test-overhaul-build-report.js: inject 1 exception และ 1 warning แล้วต้องได้ made2/expected3, failed1, incomplete1 และไม่ขึ้น success ของบล็อก · ทดสอบ UI แสดงยอดและสาเหตุด้วย
- เทสต์ round2/review/component-loading/vehicle-summary และ syntax ผ่าน
- ไม่อ้างว่าตรวจไลบรารีหรือเรนเดอร์จริงผ่าน: harness ตัวเต็มยังเริ่มไม่ได้เพราะ dump ไม่มีนิยาม Table; Figma MCP ยังเข้าไฟล์ไม่ได้
- ยังรอ log จริงจากเจ้าของงานเพื่อยืนยันว่ามี error component/variant อื่นนอกเหนือจากอาการที่จำลองได้หรือไม่
