/* ============================================================
   Mock OCR — อ่านใบเสร็จน้ำมัน (daily-record)
   สัญญา (CONTRACT): OCR จริงในอนาคตแทนที่ "ไฟล์นี้ไฟล์เดียว"
     DailyOCR.readReceipt(file: File) -> Promise<{station,no,date,liters,amount,fuelType}>
   - ฝั่ง UI (app.js) เป็นเจ้าของ animation/สถานะสแกน: แสดงตอนเรียก
     และเคลียร์เมื่อ resolve — OCR จริงที่ช้ากว่านี้ไม่ต้องแก้ UI
   - reject ได้เมื่ออ่านไม่สำเร็จ (mock ไม่เกิด แต่ UI รองรับ)
   ============================================================ */
(function(){
const STATIONS=['ปตท.','ปตท.','ปตท.','บางจาก','Shell','PT'];   // ถ่วงน้ำหนัก ปตท.
const FUELS=['ดีเซล','ดีเซล','ดีเซล B7'];
function gen(){
  const st=STATIONS[Math.floor(Math.random()*STATIONS.length)];
  const fuel=FUELS[Math.floor(Math.random()*FUELS.length)];
  const price=32+Math.random()*3;                 // 32.00-35.00 บาท/ลิตร
  const liters=+(20+Math.random()*40).toFixed(2); // 20-60 ลิตร
  const amount=+(liters*price).toFixed(2);
  const d=new Date();
  const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const bud=(d.getFullYear()+543)%100;
  const no=`INV-${bud}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${1000+Math.floor(Math.random()*9000)}`;
  return{station:st,no,date:iso,liters,amount,fuelType:fuel};
}
window.DailyOCR={
  readReceipt(file){   // file ยังไม่ถูกใช้ใน mock — คง signature ไว้ให้ OCR จริง
    return new Promise(res=>setTimeout(()=>res(gen()),1500+Math.random()*500));
  }
};
})();
