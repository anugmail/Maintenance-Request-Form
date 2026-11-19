/* ======================== ฝั่งไฟล์ FigJam — วางจอที่ส่งมาลงบอร์ดนี้ (17 พ.ย. 2569) ========================
   ส่วนสร้างบอร์ด (build) ลอกจาก figjam-plugin/code.js ของพี่นุตอนประกอบ (build.js อ่านอย่างเดียว ไม่แก้ไฟล์เขา) · ไฟล์นี้ต่อท้าย:
   หน้าต่างแสดงบอร์ดที่เปิดอยู่เทียบกับบอร์ดปลายทาง · รายการชุดที่ส่งมา (out/board-maintainance-feature-*.json) · กดวางทีละชุดตามลำดับ */
const fjBuild = figma.ui.onmessage;   // ตัวรับ 'build' ของ figjam-plugin
figma.ui.onmessage = async (msg) => {
  if (msg && msg.type === 'build') return fjBuild(msg);
  if (msg) await tgtHandle(msg);
};
{
  let key = '', name = '';
  try { key = figma.fileKey || ''; } catch (e) { /* อ่านไม่ได้ */ }
  try { name = figma.root.name || ''; } catch (e) { /* อ่านไม่ได้ */ }
  figma.ui.postMessage({ type: 'fj-mode', file: name, key });
  tgtPost();
}
