/* ======================== บอร์ดปลายทาง FigJam (ผู้ใช้สั่ง 17 พ.ย. 2569 "ให้เลือกได้ว่าจะส่ง ui ไป figjam อันไหน") ========================
   ปลั๊กอินตัวเดียวใช้ได้ทั้งไฟล์ Figma (สร้างจอ + ส่งจอ) และไฟล์ FigJam (วางลงบอร์ด) · รายการบอร์ดเก็บใน clientStorage
   (ของปลั๊กอินต่อผู้ใช้ ใช้ร่วมกันทุกไฟล์) ⇒ เลือกบอร์ดในฝั่ง Figma แล้วฝั่ง FigJam รู้ว่าปลายทางคือบอร์ดไหน
   ปลั๊กอินเขียนลงไฟล์อื่นไม่ได้ (ข้อจำกัดของ Figma) ⇒ ยังต้องเปิดบอร์ดปลายทางแล้วกดวางเอง 1 ครั้ง */
const FJ_EDITOR = figma.editorType ? figma.editorType === 'figjam' : typeof figma.createSticky === 'function';   // mock ของเทสไม่มี editorType ⇒ ดูจาก API เฉพาะ FigJam
const TGT_KEY = 'mf-figjam-targets';
const tgtMem = { v: null };
async function tgtLoad() {
  try { if (figma.clientStorage) { const v = await figma.clientStorage.getAsync(TGT_KEY); if (v && Array.isArray(v.list)) return v; } } catch (e) { /* ไม่มี clientStorage (เทส) ⇒ ใช้หน่วยความจำ */ }
  return tgtMem.v || { list: [], sel: -1 };
}
async function tgtSave(v) {
  tgtMem.v = v;
  try { if (figma.clientStorage) await figma.clientStorage.setAsync(TGT_KEY, v); } catch (e) { /* ดูข้างบน */ }
}
async function tgtPost() { const v = await tgtLoad(); figma.ui.postMessage({ type: 'fj-targets', list: v.list, sel: v.sel }); return v; }
async function tgtCurrent() { const v = await tgtLoad(); return v.list[v.sel] || null; }
function tgtFromUrl(url) {
  const m = String(url).match(/figma\.com\/board\/([A-Za-z0-9]+)(?:\/([^?#\s]+))?/);
  if (!m) return null;
  let name = m[2] ? m[2] : '';
  try { name = decodeURIComponent(name); } catch (e) { /* ชื่อเพี้ยนใช้ตามเดิม */ }
  return { name: name ? name.replace(/-/g, ' ') : 'บอร์ด ' + m[1], key: m[1], url: 'https://www.figma.com/board/' + m[1] + (m[2] ? '/' + m[2] : '') };
}
async function tgtHandle(msg) {   // คืน true เมื่อเป็นคำสั่งเรื่องบอร์ดปลายทาง
  const v = await tgtLoad();
  const upsert = (t) => { let i = v.list.findIndex(x => (t.key && x.key === t.key) || x.name === t.name); if (i < 0) { v.list.push(t); i = v.list.length - 1; } else v.list[i] = Object.assign({}, v.list[i], t, { url: t.url || v.list[i].url, key: t.key || v.list[i].key }); v.sel = i; };
  if (msg.type === 'fj-target-add') { const t = tgtFromUrl(msg.url); if (!t) { figma.ui.postMessage({ type: 'log', text: 'ลิงก์ไม่ใช่บอร์ด FigJam' }); return true; } upsert(t); }
  else if (msg.type === 'fj-target-select') { if (v.list[msg.index]) v.sel = msg.index; }
  else if (msg.type === 'fj-target-del') { v.list.splice(msg.index, 1); v.sel = v.list.length ? Math.min(v.sel, v.list.length - 1) : -1; }
  else if (msg.type === 'fj-target-here') {   // ฝั่ง FigJam: ตั้งบอร์ดที่เปิดอยู่เป็นปลายทาง (fileKey อ่านได้เฉพาะบางแบบของปลั๊กอิน ⇒ ไม่มีก็จำแค่ชื่อ)
    let key = '', name = ''; try { key = figma.fileKey || ''; } catch (e) { /* อ่านไม่ได้ */ } try { name = figma.root.name || ''; } catch (e) { /* อ่านไม่ได้ */ }
    upsert({ name: name || 'บอร์ดนี้', key, url: key ? 'https://www.figma.com/board/' + key : '' });
  }
  else if (msg.type === 'open-url') { try { figma.openExternal(msg.url); } catch (e) { figma.ui.postMessage({ type: 'log', text: 'เปิดลิงก์ไม่ได้ — ' + (e && e.message || e) + ' · คัดลอกลิงก์ไปเปิดเอง: ' + msg.url }); } return true; }
  else return false;
  await tgtSave(v); await tgtPost(); return true;
}
