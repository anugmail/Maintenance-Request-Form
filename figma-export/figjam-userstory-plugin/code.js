// BEGIN FRAME_BRIDGE
/* One plugin identity, two editor modes, local transfer of observed frame data. */
const FrameBridge = (() => {
  const KEY = 'maintain-d/ac-bridge/v1';
  const SOURCE_KEY = 'maintain-d/ac-bridge/source';
  const copy = value => JSON.parse(JSON.stringify(value));
  async function load(api) {
    const value = await api.clientStorage.getAsync(KEY);
    if (value == null) return {version: 1, records: []};
    if (value.version !== 1 || !Array.isArray(value.records)) throw Error('ข้อมูลที่บันทึกเป็นคนละ version กรุณาบันทึกจาก Figma ใหม่');
    return value;
  }
  function source(api) {
    let id = api.fileKey ? 'file:' + api.fileKey : api.root.getPluginData(SOURCE_KEY);
    if (!id) {
      id = 'local:' + Date.now().toString(36) + ':' + Math.random().toString(36).slice(2);
      api.root.setPluginData(SOURCE_KEY, id);
    }
    return {id, fileKey: api.fileKey || '', fileName: api.root.name || '', pageId: api.currentPage.id || '', pageName: api.currentPage.name || ''};
  }
  async function save(api, inspector) {
    if (api.editorType !== 'figma') throw Error('บันทึกข้อมูลจาก frame ต้นฉบับใน Figma Design เท่านั้น');
    const nodes = Array.from(api.currentPage.selection || []);
    if (!nodes.length) throw Error('เลือก frame ใน Figma ก่อนบันทึก');
    if (nodes.some(node => !node.id || !['FRAME', 'COMPONENT', 'COMPONENT_SET', 'INSTANCE', 'SECTION', 'GROUP'].includes(node.type))) {
      throw Error('เลือก frame หรือ component ที่ต้องการบันทึก ไม่เลือกเฉพาะ text หรือ image');
    }
    // Capture source/page before awaiting reads; the user may switch pages meanwhile.
    const origin = source(api);
    const report = await inspector.readSelection(nodes);
    const capturedAt = new Date().toISOString();
    const store = await load(api);
    for (const frame of report.frames) {
      if (frame.warnings.some(warning => warning.startsWith('อ่านไม่ครบ:'))) throw Error('frame ใหญ่เกินขอบเขตที่อ่านได้ กรุณาเลือก frame ที่เล็กลงก่อนบันทึก');
      const key = origin.id + '/' + frame.id;
      const record = {key, source: origin, capturedAt, frame};
      const index = store.records.findIndex(item => item.key === key);
      if (index >= 0) store.records[index] = record;
      else store.records.push(record);
    }
    // Conservative upper bound on UTF-8 size, below the plugin storage quota.
    if (JSON.stringify(store).length * 3 > 4 * 1024 * 1024) throw Error('ข้อมูลที่เก็บมีขนาดใหญ่เกินไป กรุณาลบรายการเก่าที่ไม่ใช้ก่อนบันทึก');
    await api.clientStorage.setAsync(KEY, copy(store));
    return report.frames.map(frame => store.records.find(item => item.key === origin.id + '/' + frame.id));
  }
  async function list(api) {
    return (await load(api)).records.slice().sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));
  }
  async function get(api, key) {
    const record = (await load(api)).records.find(item => item.key === key);
    if (!record) throw Error('ไม่พบข้อมูล frame ที่เลือก กรุณาโหลดรายการใหม่หรือบันทึกจาก Figma ก่อน');
    return copy(record);
  }
  async function remove(api, key) {
    const store = await load(api);
    store.records = store.records.filter(item => item.key !== key);
    await api.clientStorage.setAsync(KEY, store);
  }
  function metadata(record) {
    return 'Figma: ' + record.source.fileName + '\nPage: ' + record.source.pageName +
      '\nFrame: ' + record.frame.name + '\nบันทึกเมื่อ: ' + record.capturedAt;
  }
  // Human-facing observations; technical layers remain in the JSON snapshot.
  function readable(report) {
    return report.frames.map(frame => {
      const lines = [frame.name];
      const meaningful = item => !/\/(?: Sidebar navigation| Header navigation)(?: \/|$)/.test(item.path || '');
      const texts = [...new Set((frame.texts || []).filter(meaningful).map(item => item.text).filter(Boolean))];
      if (texts.length) lines.push('ข้อความและข้อมูลบนหน้าจอ', ...texts.map(text => '• ' + text));
      for (const item of (frame.components || []).filter(meaningful)) {
        if (!/button/i.test(item.name)) continue;
        const label = (item.properties || []).find(prop => prop.type === 'TEXT' && prop.name === 'Text');
        if (!label || !label.value || label.value === 'Text') continue;
        const disabled = (item.variants || {}).State === 'Disabled';
        lines.push('• ปุ่ม “' + label.value + '” — ' + (disabled ? 'ยังใช้งานไม่ได้ในจอนี้' : 'แสดงในสถานะ ' + ((item.variants || {}).State || 'ไม่ระบุ')));
      }
      if (!texts.length) lines.push('ยังไม่มีข้อความหน้าจอที่อ่านได้ ต้องเลือก frame ต้นฉบับที่มีช่องกรอกหรือเนื้อหา');
      lines.push(...(frame.warnings || []).map(warning => 'หมายเหตุ: ' + warning));
      lines.push('ส่วนนี้สรุปสิ่งที่เห็นในแบบ ยังไม่ยืนยันผลหลังกดปุ่ม เงื่อนไขตรวจข้อมูล หรือสิทธิ์ที่แบบไม่ได้ระบุ');
      return lines.join('\n');
    }).join('\n\n');
  }
  function code(name) {
    const match = /(?:^|[\/·]\s*)((?:[A-O]|S19)\.\d+(?:\.\d+)?)(?=\s|$|[·—–-])/.exec(name || '');
    return match ? match[1] : null;
  }
  return {save, list, get, remove, metadata, code, readable};
})();
if (typeof module !== 'undefined') module.exports = FrameBridge;
// END FRAME_BRIDGE
// BEGIN FRAME_INSPECTOR
/* Read visible UI from the selected frame. Observations are not behavior requirements. */
const FrameInspector = (() => {
  const LIMIT = 10000;
  const clean = value => value == null ? value : JSON.parse(JSON.stringify(value));
  async function read(root) {
    const frame = {id: root.id || '', name: root.name || '', type: root.type || '', components: [], texts: [], warnings: []};
    const pending = [{node: root, path: root.name || '', owners: []}];
    let visited = 0;
    let images = 0;
    while (pending.length) {
      const {node, path, owners} = pending.pop();
      let childOwners = owners;
      if (node.visible === false) continue;
      if (++visited > LIMIT) {frame.warnings.push('อ่านไม่ครบ: frame มีมากกว่า ' + LIMIT + ' layers'); break;}
      if (node.type === 'TEXT' && node.characters) {
        frame.texts.push({id: node.id || '', path, text: node.characters});
        for (const item of owners) item.texts.push(node.characters);
      }
      if (node.type === 'IMAGE' || (Array.isArray(node.fills) && node.fills.some(fill => fill.type === 'IMAGE'))) images++;
      if (node.type === 'INSTANCE') {
        const item = {id: node.id || '', name: node.name || '', path, component: null, variants: clean(node.variantProperties || {}), properties: [], texts: []};
        try {
          const props = node.componentProperties || {};
          item.properties = Object.keys(props).map(key => ({name: key.split('#')[0], key, type: props[key].type, value: clean(props[key].value)}));
        } catch (error) {frame.warnings.push(path + ': อ่าน property ไม่ได้ — ' + (error.message || error));}
        try {
          const main = typeof node.getMainComponentAsync === 'function' ? await node.getMainComponentAsync() : null;
          if (main) item.component = {id: main.id || '', name: main.name || '', key: main.key || '', set: main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent.name : ''};
          else frame.warnings.push(path + ': ไม่พบ main component; แสดงค่าจาก instance ที่อ่านได้');
        } catch (error) {frame.warnings.push(path + ': อ่าน main component ไม่ได้ — ' + (error.message || error));}
        frame.components.push(item);
        childOwners = owners.concat(item);
      }
      const children = node.children || [];
      for (let i = children.length - 1; i >= 0; i--) pending.push({node: children[i], path: path + ' / ' + (children[i].name || children[i].type || ''), owners: childOwners});
    }
    // Give component instances their visible text, including nested library layers.
    for (const item of frame.components) {
      item.texts = [...new Set(item.texts)];
    }
    if (!frame.components.length) frame.warnings.push(images
      ? 'พบภาพใน frame แต่ไม่มี component instance จึงอ่าน component ภายในภาพไม่ได้ ให้เลือก frame ต้นฉบับใน Figma Design'
      : 'ไม่พบ component instance อาจเป็น layers ที่ detach แล้ว อ่านได้เฉพาะข้อความและโครงที่เหลือ');
    return frame;
  }
  async function readSelection(nodes) {
    const frames = [];
    for (const node of nodes) frames.push(await read(node));
    return {version: 1, frames};
  }
  function format(report) {
    if (!report.frames.length) return 'เลือก frame เพื่ออ่าน component ล่าสุด';
    const lines = [];
    for (const frame of report.frames) {
      lines.push(frame.name + ' — ' + frame.components.length + ' component instances');
      for (const item of frame.components) {
        lines.push('• ' + item.name + (item.component ? ' [' + (item.component.set ? item.component.set + ' / ' : '') + item.component.name + ']' : ''));
        lines.push('  Layer: ' + item.path);
        const variants = Object.keys(item.variants).map(key => key + '=' + item.variants[key]);
        if (variants.length) lines.push('  Variant: ' + variants.join(', '));
        for (const prop of item.properties) lines.push('  ' + prop.name + ' (' + prop.type + '): ' + String(prop.value));
        if (item.texts.length) lines.push('  Text: ' + item.texts.join(' | '));
      }
      if (frame.texts.length) lines.push('ข้อความที่แสดงใน frame:\n' + [...new Set(frame.texts.map(item => item.text))].join('\n'));
      for (const warning of frame.warnings) lines.push('หมายเหตุ: ' + warning);
      lines.push('ข้อมูลนี้อ่านจาก design ปัจจุบัน ไม่ยืนยัน behavior, validation, สิทธิ์ หรือ API ที่ไม่ได้แสดงใน frame');
    }
    return lines.join('\n');
  }
  // A new selection invalidates any older asynchronous response.
  function watch(api, formatter = format) {
    let revision = 0;
    let timer;
    let stopped = false;
    async function refresh() {
      const current = ++revision;
      const nodes = Array.from(api.currentPage.selection || []);
      try {
        const report = await readSelection(nodes);
        if (!stopped && current === revision) api.ui.postMessage({type: 'frame-inspection', report, text: formatter(report)});
      } catch (error) {
        if (!stopped && current === revision) api.ui.postMessage({type: 'frame-inspection', report: {version: 1, frames: []}, text: 'อ่าน frame ไม่สำเร็จ: ' + (error.message || error)});
      }
    }
    function schedule() {
      ++revision;
      clearTimeout(timer);
      timer = setTimeout(refresh, 180);
    }
    let watchedPage;
    function watchPage() {
      if (watchedPage && typeof watchedPage.off === 'function') watchedPage.off('nodechange', schedule);
      watchedPage = api.currentPage;
      // Page-scoped nodechange supports dynamic-page without loading every page.
      if (typeof watchedPage.on === 'function') watchedPage.on('nodechange', schedule);
      schedule();
    }
    api.on('selectionchange', schedule);
    api.on('currentpagechange', watchPage);
    api.on('close', () => {
      stopped = true; ++revision; clearTimeout(timer);
      if (watchedPage && typeof watchedPage.off === 'function') watchedPage.off('nodechange', schedule);
    });
    watchPage();
    clearTimeout(timer);
    refresh();
    return refresh;
  }
  return {read, readSelection, format, watch};
})();
if (typeof module !== 'undefined') module.exports = FrameInspector;
// END FRAME_INSPECTOR
/* Maintain-D — Overhaul exact-frame AC annotator (FigJam).
 * Source: readable per-frame AC + explicitly authored component Dev notes. Run node build-content.js after editing it.
 * Match complete frame IDs (including H.4.1 and D.2.1); never infer from visible
 * quotes or substitute another frame. Render frame AC, scenario Dev context,
 * proposals and unresolved questions in one narrative text; tables stay separate.
 * Legacy USER_STORIES and matching helpers below are retained for compatibility
 * tests; annotations exclusively use FRAME_STORIES from the new document.
 */
// BEGIN FRAME_STORIES
const FRAME_STORIES = {
  "A.1": {
    "title": "AC A.1 — รายการแผน",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ค้นหาและติดตามแผน Overhaul — รายการแผน",
          "Who: กบค. ใช้จัดการแผน; กรย. เขตและหน่วยงานเจ้าของรถใช้ดูข้อมูลในขอบเขตสิทธิ์",
          "Do: ค้นหา กรอง เรียงลำดับ เปลี่ยนหน้า และเปิดรายละเอียด; กบค. สร้าง แก้ไข หรือลบแผนได้ตามเงื่อนไข"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีหน้ารายการ ค้นหา ตัวกรอง ตารางและเมนูท้ายแถว แต่ไม่ได้แยกผลของคำค้นที่ส่งซ้อน/การโหลดผิดพลาดเป็นข้อกำหนดราย state"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดช่องค้นหา (SearchInput): คงคำค้นเมื่อ blur/โหลดผิดพลาด และไม่ให้ผลคำค้นก่อนหน้าทับคำล่าสุด; จังหวะเริ่มค้นยังต้องตกลง",
          "NEW — เพิ่มข้อกำหนดเมนู “…” ท้ายแถว (RowMenu): คลิกนอกปิดโดยไม่ทำ action; Esc ปิดคืน focus; เลือกแก้ไข/ลบต้องอ้าง ID ของแถวที่กด ไม่ใช่ตำแหน่งแถวหลังเรียงใหม่"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - คลิกค้นหาแล้วพิมพ์ได้; คำค้นใหม่ต้องเปลี่ยนผล ไม่เอาผลคำค้นเก่ามาแสดงทับ\n  - กดล้างคำค้นแล้วกลับไปแสดงรายการตามตัวกรองที่ยังเลือกอยู่",
          "Table (DataTable)\n  - Sorting\n    - เมื่อเปิดหน้า แสดงรายการตามสิทธิ์และตัวเลือกค้นหา/ตัวกรอง/เรียงลำดับ/แบ่งหน้า\n    - Sorting: เลขแผน ค่าเริ่มต้นใหม่→เก่า · ชื่อแผน, สถานะ ตามตัวอักษร · ประเภทงบ เรียงตามประเภทงบ [Sheet พี่นุ — 1 รายการแผน]\n  - Pagination\n    - เลือกการเรียงลำดับหรือจำนวนรายการต่อหน้าแล้วตารางเปลี่ยนให้ตรงกัน\n    - แบ่งหน้า: \"แสดง 1 ถึง 10 จาก 95 รายการ\" + dropdown จำนวนต่อหน้า (ค่าเริ่มต้น 10) + ปุ่มเลขหน้า ‹ 1 2 … 9 10 ›\n    - จำนวนรายการต่อหน้าและปุ่มเปลี่ยนหน้า: ลูกค้าฝากให้ตรวจรายละเอียด (CF) [Sheet พี่นุ — 1 รายการแผน]\n    - ปุ่มเปลี่ยนหน้าใต้ตาราง (Pagination) และช่องเลือกจำนวนต่อหน้า: เปลี่ยนแล้วโหลดหน้าที่ถูกต้องโดยคงคำค้น/ตัวกรอง; ไม่คำนวณจำนวนทั้งหมดจากเพียงแถวในหน้าปัจจุบัน\n  - Columns\n    - คอลัมน์ในตาราง [Sheet พี่นุ — 1 รายการแผน]:\n        - เลขแผน\n        - ชื่อแผน: ชื่อแผนยาวเกินคอลัมน์ตัดด้วย \"…\"\n        - ประเภทงบ\n        - ปีงบประมาณ\n        - งบประมาณ (บาท)\n        - จำนวนรถที่ Overhaul: นับรถไม่ซ้ำจากทุก PO\n        - ความคืบหน้า: รถที่ปิดงานแล้ว / รถทั้งหมด; แผนที่ยังไม่มี PO แสดง “-”\n        - สถานะ\n        - วันที่สร้าง\n        - จัดการ\n  - Behavior\n    - ตารางรายการแผน (DataTable): หัวคอลัมน์ที่เรียงได้ต้องเปลี่ยนทิศ sort และข้อมูลพร้อมกัน; ชื่อยาวตัดด้วย …; ป้ายสถานะ/ความคืบหน้าอ่านค่าจากรายการเดียวกัน\n  - Row Actions (RowMenu)\n    - เมนู “…” ท้ายแถวรายการ (RowMenu): คลิกนอกเมนูปิดโดยไม่ทำ action; Esc ปิดและคืน focus ให้ปุ่มเมนูเดิม ลูกศรขึ้น/ลงเลื่อนรายการ และเมื่อเลือกรายการจะปิดเมนูก่อนนำทาง/เปิดกล่อง",
          "Status (StatusBadge)\n  - ลูกค้าแก้ชื่อสถานะ:\n      - ยังไม่มี PO -> รอเลข PO [Sheet พี่นุ — 1 รายการแผน]\n      - ดำเนินการ -> รอดำเนินการ [Sheet พี่นุ — 1 รายการแผน]\n      - เสร็จสิ้น: ใช้ชื่อเดิม [Sheet พี่นุ — 1 รายการแผน]",
          "Search Input (SearchInput)\n  - ลูกค้าแก้ข้อความในช่องค้นหา: เลขศูนย์ต้นทุน -> เลขที่งบประมาณ [Sheet พี่นุ — 1 รายการแผน]\n  - รายละเอียดการค้นหา: ค้นได้จากเลขแผน, ชื่อแผน, เลขที่งบประมาณ หรือเลข WBS, ทะเบียนรถ (CF) · พิมพ์ 3 อักขระแรกขึ้น AutoComplete [Sheet พี่นุ — 1 รายการแผน]\n  - ช่องค้นหา (SearchInput): คลิกในช่อง → เข้า focus แสดง cursor และพิมพ์ แก้ไข หรือลบคำค้นได้\n  - ช่องค้นหา (SearchInput): คลิกออกจากช่อง → blur แต่ข้อความในช่องยังอยู่ ไม่ล้างออกเอง\n  - ช่องค้นหา (SearchInput): ระหว่าง loading ให้แสดงคำค้นที่พิมพ์ไว้; หากเปลี่ยนคำค้น ให้ใช้ผลของคำล่าสุด ไม่แสดงผลจากคำค้นก่อนหน้าทับ\n  - ช่องค้นหา (SearchInput): หากเกิด error ให้เก็บคำค้นไว้และลองใหม่ได้; วิธีเริ่มค้นหาและ AutoComplete ยังต้องตกลง",
          "Buttons\n  - ปุ่ม “ตัวกรอง”: เปิดแผงตัวกรอง A.2; แต่ละคลิกเปิดครั้งเดียว ไม่เปิดแผงซ้อนจากการกดซ้ำ\n  - ปุ่ม “+ สร้างแผน Overhaul”: เปิด form สร้างแผน B.1; แสดงเฉพาะผู้มีสิทธิ์ และไม่เปิดหน้าใหม่ซ้อนจากการกดซ้ำ"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "กบค. (admin-super): เห็นทุกแผน ทุก PO และรถทุกคัน รวมรถต่างเขตและสำนักงานใหญ่; สร้าง/แก้ไข/ลบแผนได้ [Sheet พี่นุ — OH-Permission]",
          "กรย. เขต (admin-region): เปิดได้เฉพาะแผนที่มีรถในเขตตัวเอง ภายในแผนเห็นเฉพาะ PO และรถในเขตตัวเอง และดูข้อมูลได้อย่างเดียว [Sheet พี่นุ — OH-Permission]",
          "หน่วยงานเจ้าของรถ (admin-department): เปิดได้เฉพาะแผนที่มีรถของหน่วยงานตัวเอง เห็นหัว PO (เลข PO ชื่อ PO และอู่) แต่ไม่เห็นรถของหน่วยงานอื่น แม้อยู่ใน PO เดียวกัน; ดูข้อมูลได้ และตอบรับ/ปฏิเสธเฉพาะนัดเข้าอู่และนัดรับรถของตัวเอง [Sheet พี่นุ — OH-Permission]",
          "admin-super ของหน่วยงานอื่น เช่น กกฟ.1/กกฟ.2: ดูได้เฉพาะรถในหน่วยงานตัวเอง; ความต่างจาก role หน่วยงานเจ้าของรถยังต้องตกลง [Sheet พี่นุ — OH-Permission]",
          "แผนที่ยังไม่มี PO: มีเฉพาะ กบค. ที่เห็นและจัดการได้ กรย. เขตและหน่วยงานเจ้าของรถเริ่มเห็นเมื่อมี PO ที่มีรถในขอบเขตของตัวเอง [Sheet พี่นุ — OH-Permission]",
          "ปุ่ม “+ สร้างแผน Overhaul” และเมนูแก้ไข/ลบแผนแสดงเฉพาะ กบค. role อื่นมีเฉพาะ “ดูรายละเอียด” ของแผนที่มีสิทธิ์เห็น [Sheet พี่นุ — 1 รายการแผน]",
          "API รายการและรายละเอียดต้องกรองแผน PO และรถตามสิทธิ์ด้วย ไม่ใช้เพียงการซ่อนปุ่มหรือแถวในหน้าจอ [Sheet พี่นุ — OH-Permission]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "โหลดรายการไม่สำเร็จ: แจ้งปัญหาและให้ลองใหม่ ไม่ใช้ “ยังไม่มีแผน” แทนข้อผิดพลาด",
          "พิมพ์ค้นหาต่อเนื่อง: ผลคำเก่าที่กลับมาช้าต้องไม่ทับคำล่าสุด; เมื่อเปลี่ยนคำค้นหาหรือตัวกรอง ให้แสดงหน้า 1 ของผลค้นหาใหม่",
          "กดเปิดแผนที่อีกคนลบไปแล้ว: แจ้งว่าไม่พบแผนและโหลดรายการใหม่ ไม่เปิด form สร้างแผนแทน"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ค่าเริ่มต้น sort คือ หมายเลขแผน ↑ แต่แถว mock เรียงตามวันที่สร้างใหม่→เก่า ต้องเคาะว่า default sort คืออะไร",
          "หมายเลขแผนใน mock เป็น \"Z69000X\" ทุกแถว ไม่ตรงกับ format จริง ORZ690000X",
          "ICON Action ขัดกับ mock C.1/D.1.1 ที่เป็นเมนู \"…\" (เอกสารเดิมบอกว่าเจ้าของงานเลือก \"…\" เมื่อ 21 ต.ค.) ต้องเคาะใหม่ว่าใช้แบบไหน",
          "ต้องตกลงว่า “จำนวนรถ” และ “ความคืบหน้า x/n” ในรายการของ กรย. และหน่วยงานเจ้าของรถนับทั้งแผนหรือเฉพาะรถที่ role นั้นมีสิทธิ์เห็น [Sheet พี่นุ — OH-Permission]",
          "ต้องตกลงความแตกต่างระหว่าง admin-super ของหน่วยงานอื่น (กกฟ.) กับ admin-department หน่วยงานเจ้าของรถ เพราะตารางสิทธิ์ระบุว่าทั้งคู่ดูรถของหน่วยงานตัวเอง [Sheet พี่นุ — OH-Permission]"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / A.1 · หน้ารายการแผน — ค้นหา — รายการแผน"
      ]
    }
  },
  "A.2": {
    "title": "AC A.2 — ตัวกรอง",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ค้นหาและติดตามแผน Overhaul — ตัวกรอง",
          "Who: กบค. ใช้จัดการแผน; กรย. เขตและหน่วยงานเจ้าของรถใช้ดูข้อมูลในขอบเขตสิทธิ์",
          "Do: เลือกหรือปรับตัวกรอง ล้างค่า กดตกลงเพื่อใช้ค่า หรือปิดแผงโดยไม่ใช้ค่าที่เปลี่ยน"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีปีงบ งบประมาณ สถานะ และล้าง/ยกเลิก/ตกลง แต่ยังไม่ระบุ behavior การคลิกพื้นที่นอกแผงหรือกด Esc เพื่อปิด และข้อมูลที่ยังไม่บันทึกครบทุกทาง"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "CHANGE — ลูกค้าแก้ชื่อสถานะ:\n  - ยังไม่มี PO -> รอเลข PO [Sheet พี่นุ — 1 รายการแผน]\n  - ดำเนินการ -> รอดำเนินการ [Sheet พี่นุ — 1 รายการแผน]\n  - เสร็จสิ้น: ใช้ชื่อเดิม [Sheet พี่นุ — 1 รายการแผน]",
          "NEW — เพิ่มข้อกำหนดการปิดแผง: พื้นหลังทึบ/×/Esc/ยกเลิกปิดแผง ไม่ใช้ข้อมูลที่ยังไม่บันทึก และกลับ A.1 ไม่ใช่สร้างตัวกรองใหม่ทั้งชุด; แผงตัวกรอง (FilterPanel/PlanFilter) ในโค้ดรองรับอยู่แล้ว",
          "NEW — กด “ล้างตัวกรอง” เพื่อล้างตัวเลือกในแผง แล้วกด “ตกลง” เพื่ออัปเดตรายการ หากปิดแผงก่อนกด “ตกลง” รายการจะยังใช้ตัวกรองเดิม และเมื่อเปิดแผงอีกครั้ง ตัวเลือกจะกลับมาเป็นค่าเดิม"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "Side panel (FilterPanel)\n  - Behavior\n    - กด “ตัวกรอง” เปิดแผงด้านขวา (FilterPanel / PlanFilter) โดยแสดงตัวกรองที่ใช้อยู่จริง การเปลี่ยนค่าในแผงยังไม่เปลี่ยนตารางด้านหลัง\n    - กด “ตกลง” → กรองรายการตามค่าที่เลือกทั้งหมด แล้วปิดแผงกลับไปดูรายการ A.1\n    - กด “ยกเลิก” / × / Esc หรือคลิกพื้นหลังทึบ → ปิดแผงกลับไปดูรายการ A.1 โดยไม่ใช้ตัวกรองที่เพิ่งเปลี่ยน เปิดใหม่แสดงตัวกรองที่ใช้อยู่จริง\n    - กด “ล้างตัวกรอง” → ล้างตัวเลือกในแผง โดยแผงยังเปิด แล้วกด “ตกลง” เพื่ออัปเดตรายการ หากปิดแผงก่อนกด “ตกลง” รายการจะยังใช้ตัวกรองเดิม และเมื่อเปิดแผงอีกครั้ง ตัวเลือกจะกลับมาเป็นค่าเดิม\n    - คลิกภายในแผงหรือช่องกรองแล้วแผงไม่ปิด ขณะเปิดแผงหน้าเบื้องหลังเลื่อนไม่ได้ (useOverlay)\n    - แนวทางพัฒนานี้ใช้ PlanFilter ของ overhaul-next เป็นฐาน; FilterDrawer ในต้นแบบเก่าล้างแล้วกรองทันที จึงต้องระวังไม่ใช้พฤติกรรมเก่าปะปน\n  - Fields\n    - ปีงบประมาณ: dropdown ค่าเริ่มต้น \"ทั้งหมด\" [Sheet พี่นุ — 1 รายการแผน]\n    - งบประมาณ (บาท): checkbox 6 ช่วง เลือกได้หลายช่วง\n    - ช่องเลือกสถานะ: เลือกได้หลายค่าพร้อมกัน\n    - ประเภทยานพาหนะ (เพิ่ม): ลูกค้าเปลี่ยนตัวกรอง\n        - ค้นทะเบียนรถ -> เลือกประเภทยานพาหนะแบบเลือกได้หลายค่า [Sheet พี่นุ — 1 รายการแผน]\n        - ตัวกรองแบบใหม่ยังไม่มีใน mock\n    - งบประมาณ: ลูกค้าให้พิจารณา Range Slider Input แทนช่วงตายตัว [Sheet พี่นุ — 1 รายการแผน]\n    - ช่องเลือกปีงบ: เปิดแผงแล้วแสดงปีงบที่ใช้กรองรายการปัจจุบัน; เปลี่ยนปีงบได้โดยไม่เปลี่ยนช่วงงบหรือสถานะที่เลือกไว้\n    - checkbox ช่วงงบและสถานะ: เลือกได้หลายข้อในกลุ่มเดียว; คลิกซ้ำที่ข้อเดิมเพื่อยกเลิกข้อนั้น\n    - label ของ checkbox: คลิกข้อความข้าง checkbox เพื่อเลือกหรือยกเลิก checkbox ข้อนั้น เช่น คลิก “รอเลข PO” เพื่อเลือกหรือยกเลิกสถานะ “รอเลข PO”"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เปลี่ยนค่าแล้วกดยกเลิก/×/Esc/พื้นหลัง: ทิ้งเฉพาะข้อมูลที่ยังไม่บันทึก ตารางยังใช้ตัวกรองเดิม; เปิดใหม่ห้ามเห็นค่าที่ทิ้งไป",
          "ถ้าใช้ตัวกรองแล้วต้องโหลดรายการใหม่แต่โหลดไม่สำเร็จ: คงค่าที่เลือกให้ลองใหม่ ไม่แสดง “ไม่พบแผน” แทน error และไม่แสดงข้อมูลเก่าว่าเป็นผลของตัวกรองใหม่"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ตัวเลขช่วงงบพิมพ์ผิด: \"น้อยกว่า 1,000,0000\", \"1,000,0000 - 5,000,000\", \"5,000,0001 - 10,000,000\", \"10,000,0001 - 15,000,000\", \"15,000,0001 - 20,000,000\", \"20,000,001 ขึ้นไป\" ต้องแก้เป็น 1,000,000 / 5,000,001 / 10,000,001 / 15,000,001 และนิยามขอบให้ชัด (ค่า 1,000,000 พอดีอยู่ช่วงไหน)",
          "ชื่อสถานะในตัวกรอง (\"ยังไม่มี PO / ดำเนินการ / เสร็จสิ้น\") ไม่ตรงกับ chip ในตาราง (\"รอเลข PO / รอดำเนินการ\") ต้องใช้ชุดเดียวกัน",
          "ต้องเคาะ: ตัวเลือกปีงบมีปีไหนบ้าง, ปุ่ม \"ตัวกรอง\" แสดงจำนวนตัวกรองที่ใช้อยู่หรือไม่ (จอไม่มี), กรองแล้วกลับหน้า 1 หรือไม่",
          "ช่วงงบมี 3 แบบไม่ตรงกัน: mock 6 checkbox, Sheet column-sorting-filter dropdown 3 ช่วง (ไม่เกิน 5 ล้าน · 5–20 ล้าน · มากกว่า 20 ล้านบาท), ลูกค้าเสนอ Range Slider ต้องเลือกแบบเดียว",
          "Sheet column-sorting-filter มีตัวกรอง \"ศูนย์ต้นทุน / WBS\" (dropdown) แต่ลูกค้ายังไม่ confirm และไม่มีใน mock"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / A.2 · หน้ารายการแผน — ค้นหา — ตัวกรอง"
      ]
    }
  },
  "A.3": {
    "title": "AC A.3 — ค้นไม่เจอ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ค้นหาและติดตามแผน Overhaul — ค้นไม่เจอ",
          "Who: กบค. ใช้จัดการแผน; กรย. เขตและหน่วยงานเจ้าของรถใช้ดูข้อมูลในขอบเขตสิทธิ์",
          "Do: แก้คำค้นหรือตัวกรอง และล้างเงื่อนไขเพื่อกลับไปดูรายการ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีจอค้นไม่พบและการล้างคำค้น แต่ไม่ได้แยก no-result จากการโหลด/error และผลต่อ focus เป็น behavior ชัดเจน"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนด state ค้นไม่พบ: ไม่แสดงตารางเก่าหรือ Pagination ค้าง แต่ยังคงคำค้น/ตัวกรองไว้ให้แก้; error ต้องไม่ใช้ภาพค้นไม่พบแทน",
          "NEW — เพิ่มผลปุ่มล้าง: ล้างคำค้นและตัวกรองพร้อมกันแล้วกลับรายการ A.1 ในหน้าเดิมและคืน focus ที่ช่องค้นหา"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - คำค้นและตัวกรองเดิมต้องยังอยู่ เพื่อให้ผู้ใช้แก้ไขได้\n  - กด “ล้างคำค้นและตัวกรอง” ให้ล้างทั้งคู่ แล้วโหลดรายการใหม่\n  - กด \"ล้างคำค้นและตัวกรอง\" ล้างคำค้นและตัวกรอง กลับแสดงรายการทั้งหมด\n  - ใช้กติกาค้นหาเดียวกับ A.1 (รวมทะเบียนรถและ AutoComplete 3 อักขระ) ไม่มี toast [Sheet พี่นุ]",
          "Empty State (EmptyState)\n  - หลังค้นหาแล้วไม่มีผล ต้องแสดง “ไม่พบแผน Overhaul” ไม่แสดงข้อมูลเก่าหรือการแบ่งหน้า\n  - กบค. พิมพ์คำค้น (ตัวอย่าง \"แผน Overhaul ปี 2573\") หรือเลือกตัวกรองที่ไม่มีแผนตรง แทนตารางด้วยภาพ empty หัวข้อ \"ไม่พบแผน Overhaul\" ข้อความรอง \"ไม่มีแผนที่ตรงกับคำค้นหรือตัวกรอง\" และปุ่ม \"ล้างคำค้นและตัวกรอง\"\n  - ส่วนแสดงเมื่อไม่มีข้อมูล “ไม่พบแผน Overhaul”: ใช้เมื่อค้นสำเร็จแต่ไม่มีผล ไม่ใช้แทน loading หรือ error",
          "Search Input (SearchInput)\n  - ช่องค้นหา (SearchInput): คลิกในช่อง → เข้า focus แสดงขอบสีม่วงและ cursor สามารถพิมพ์ แก้ไข หรือลบคำค้นได้\n  - ช่องค้นหา (SearchInput): คลิกออกจากช่อง → blur ขอบสีม่วงหาย แต่คำค้นยังอยู่\n  - ช่องค้นหา (SearchInput): ค้นหาแล้วไม่พบรายการ → แสดง Empty State “ไม่พบแผน Overhaul” โดยเก็บคำค้นและค่าตัวกรองเดิมไว้ เพื่อให้แก้ไขแล้วค้นหาใหม่ได้",
          "Buttons\n  - ปุ่ม “ตัวกรอง”: ยังแสดงเมื่อค้นหาไม่พบรายการ กดแล้วเปิดแผงตัวกรอง A.2\n  - ปุ่ม “+ สร้างแผน Overhaul”: ยังแสดงเฉพาะผู้มีสิทธิ์เมื่อค้นหาไม่พบรายการ กดแล้วเปิด form สร้างแผน B.1\n  - ปุ่ม “ล้างคำค้นและตัวกรอง”: ล้างทั้งคู่แล้วโหลดรายการใหม่; ไม่คงหน้าที่ไม่มีรายการหลังล้าง",
          "Table (DataTable)\n  - Pagination\n    - Pagination: ไม่แสดงปุ่มเปลี่ยนหน้าและตัวเลือกจำนวนรายการต่อหน้า เมื่อไม่มีผลค้นหา",
          "Navigation\n  - จากหน้ารายการ plans: ปุ่มล้างคำค้น/ตัวกรองทำงานในหน้าเดิม A.1 ไม่เปิด แผงตัวกรอง และไม่ไปหน้าสร้างแผน; คง focus ที่ช่องค้นหาเพื่อพิมพ์ใหม่"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ล้างคำค้น/ตัวกรองแล้วโหลดไม่สำเร็จ: แจ้งปัญหาแทนการค้างข้อความค้นไม่พบของคำเดิม และให้ลองใหม่ด้วยค่าที่ล้างแล้ว",
          "ผลคำค้นเดิมกลับมาหลังล้าง: ห้ามนำกลับมาแสดงทับรายการที่กำลังโหลดใหม่"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: ค้นแบบพิมพ์แล้วกรองทันที (debounce) หรือกด Enter, ค้นแบบ contains หรือ prefix"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / A.3 · หน้ารายการแผน — ค้นหา — ค้นไม่เจอ"
      ]
    }
  },
  "A.4": {
    "title": "AC A.4 — ยังไม่มีแผน",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ค้นหาและติดตามแผน Overhaul — ยังไม่มีแผน",
          "Who: กบค. ใช้จัดการแผน; กรย. เขตและหน่วยงานเจ้าของรถใช้ดูข้อมูลในขอบเขตสิทธิ์",
          "Do: ดูสถานะยังไม่มีแผน; กบค. เริ่มสร้างแผนได้"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีจอยังไม่มีแผนและปุ่มสร้าง ไม่ได้แยกข้อกำหนดการเข้าถึงปุ่มกับการกลับจาก form เป็นราย state"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดปุ่มสร้างกลางจอ: ผู้มีสิทธิ์กดแล้วไป B.1; กลับโดยยังไม่สร้างต้องยังเห็น A.4 ไม่สร้างแผนจากการเปิด form",
          "NEW — เพิ่มขอบเขต empty state: ไม่แสดงแถบค้นหา/ตัวกรอง/แบ่งหน้าในจอว่าง และไม่ใช้ state นี้แทน A.3 ที่ค้นไม่พบ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "Empty State (EmptyState)\n  - ถ้าระบบไม่มีรายการที่ผู้ใช้มีสิทธิ์เห็น ให้แสดงข้อความยังไม่มีแผน\n  - ยังไม่มีแผนในระบบเลย เปิดหน้า แสดงภาพ empty หัวข้อ \"ยังไม่มีแผน Overhaul\" ข้อความรอง \"สร้างแผน Overhaul เพื่อเพิ่ม Purchase Order และติดตามสถานะซ่อมของรถแต่ละคัน\" และปุ่ม \"+ สร้างแผน Overhaul\" ตรงกลาง\n  - ส่วนแสดงเมื่อไม่มีข้อมูล “ยังไม่มีแผน Overhaul”: ใช้เมื่อยังไม่มีข้อมูล ไม่ปะปนกับค้นไม่พบของ A.3",
          "Buttons\n  - แสดงปุ่มสร้างแผนเฉพาะผู้ที่มีสิทธิ์; กดแล้วไปหน้าสร้างแผน\n  - กดปุ่ม ไปหน้าสร้างแผน (B.1)\n  - ปุ่ม \"+ สร้างแผน Overhaul\" แสดงเฉพาะ กบค. role อื่นเห็นแค่ข้อความ empty · หน่วยงาน/กรย. ที่ยังไม่มีรถอยู่ใน PO ใดเลยจะเห็นหน้านี้ [Sheet พี่นุ — permission]\n  - ปุ่ม “+ สร้างแผน Overhaul” กลางจอ: พาไป B.1 และตรวจสิทธิ์; ไม่สร้างช่องค้นหา/ตัวกรองหรือ Pagination เพิ่มใน state นี้\n  - ปุ่มสร้างแผนเป็นลิงก์ไป form สร้าง B.1; ถ้าผู้ใช้กลับจาก form โดยยังไม่สร้างสำเร็จ ให้เห็น state ว่าง A.4 เดิม ไม่สร้างแผนจากการเปิด form",
          "Status (StatusBadge)\n  - ไม่แสดงตารางหรือการแบ่งหน้าในสถานะนี้",
          "Visibility\n  - ไม่มีช่องค้นหา ปุ่มตัวกรอง ปุ่มสร้างด้านบน และการแบ่งหน้า"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ยังโหลดข้อมูลไม่เสร็จหรือโหลดล้มเหลว: อย่าแสดงจอยังไม่มีแผน เพราะยังยืนยันไม่ได้ว่าจำนวนแผนเป็นศูนย์",
          "ผู้ใช้ไม่มีสิทธิ์สร้างแผน: ไม่เปิดทางสร้างจากปุ่มกลางจอ และไม่ถือว่าการซ่อนปุ่มอย่างเดียวป้องกันการเข้าหน้าสร้างได้"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / A.4 · หน้ารายการแผน — ค้นหา — ยังไม่มีแผน"
      ]
    }
  },
  "B.1": {
    "title": "AC B.1 — form สร้างแผน (Default)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้างแผน Overhaul และตรวจรายละเอียดแผนที่สร้าง — form สร้างแผน (Default)",
          "Who: กบค. ใช้สร้างแผน; หน้ารายละเอียดเปิดดูได้ตามขอบเขตสิทธิ์",
          "Do: กรอกข้อมูลแผน เลือกค่าที่จำเป็น บันทึก หรือย้อนกลับ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มี form สร้างว่างและช่องบังคับ แต่ยังไม่แยก behavior การออกจาก form ทุกทาง และกรณีที่ยังไม่เคยแก้ค่า"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดทางออก: ไม่เคยแก้ค่าให้กลับรายการ A ได้ทันที; มีข้อมูลที่ยังไม่บันทึก เปิด modal “ยืนยันการออก” (ConfirmDialog — Modal แบบ centered) B.4 ก่อนออก โดยต้องครอบคลุม breadcrumb ที่โค้ดปัจจุบันยังเป็นลิงก์ตรง",
          "NEW — เพิ่มเงื่อนไขเริ่มต้น: ปีงบยังไม่เลือกและปุ่มบันทึกยังไม่พร้อม ห้ามตั้งปีหรือสร้างแผนแทนผู้ใช้"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดแก้ไขหรือสร้างแล้วแสดงข้อมูลใน form ตามจอ; สำหรับ B.1 เป็นการสร้างแผนใหม่ ทุกช่องเริ่มต้นว่าง\n  - ช่องบังคับที่ปล่อยว่างต้องมีข้อความเตือน โดยตรวจเมื่อออกจากช่องตาม B.2\n  - กดบันทึกแล้วรอผล; ไม่สำเร็จต้องคงค่าที่กรอกและไฟล์ที่แนบไว้\n  - form แบ่ง 2 ส่วน: “ข้อมูลแผน” และ “เอกสาร”",
          "Navigation\n  - กด “+ สร้างแผน Overhaul” เปิดหน้า breadcrumb “จัดการงาน Overhaul > สร้างแผน Overhaul” หัวข้อ “สร้างแผน Overhaul”\n  - จากหน้า form สร้าง/แก้ไขแผน (PlanForm): ปุ่มย้อนกลับไปหน้ารายการ A ถ้ายังไม่แก้ค่าให้ออกได้ทันที; ถ้ามีข้อมูลที่ยังไม่บันทึก เปิด modal “ยืนยันการออก” (ConfirmDialog — Modal แบบ centered) B.4 ก่อน\n  - breadcrumb ในโค้ดปัจจุบันเป็นลิงก์ตรงและยังไม่ผ่าน guard จึงต้องปรับให้ครอบคลุมก่อนอ้างว่าป้องกันข้อมูลหายทุกทาง\n  - Figma ล่าสุดมีปุ่ม “ยกเลิก” ท้าย form แต่โค้ดที่ตรวจไว้ใช้ปุ่มย้อนกลับ ต้องยืนยันให้ตรงกัน; ข้อเสนอให้ปุ่ม “ยกเลิก” ใช้กติกาเดียวกับปุ่มย้อนกลับ",
          "Buttons\n  - ปุ่ม “บันทึก”: เริ่ม disable และคำนวณสถานะจาก field ที่ยืนยันแล้วว่าบังคับ\n  - ปุ่ม “ยกเลิก”: Figma ล่าสุดแสดงในสถานะใช้งานได้ตั้งแต่เปิดหน้า; ปลายทางและการยืนยันก่อนออกต้องตกลงตาม Navigation",
          "Form Fields\n  - ช่องกรอกชื่อแผนและวงเงิน: เริ่มต้นว่าง; คลิกในช่อง → เข้า focus แสดง cursor และพิมพ์หรือแก้ไขค่าได้; คลิกออกจากช่อง → blur โดยเก็บค่าที่กรอกไว้ หากช่องบังคับยังว่าง ให้แสดง validation ตาม B.2 (validate on blur)\n  - ชื่อแผน: แสดง placeholder “ระบุชื่อแผน”; วงเงินอนุมัติ (บาท): แสดง placeholder “ระบุวงเงินอนุมัติ”\n  - เลข WBS / เลขโครงข่าย / เลขกิจกรรม: เริ่มต้นว่าง แสดง placeholder “ระบุเลข WBS” / “ระบุเลขโครงข่าย” / “ระบุเลขกิจกรรม” แต่ละช่องระบุ “(ถ้ามี)” จึงไม่บังคับกรอก",
          "Select Field\n  - ช่องเลือกจากรายการ ปีงบประมาณ: เริ่มยังไม่เลือก แสดง “เลือกปีงบประมาณ” ไม่กำหนดปีเองแทนผู้ใช้",
          "File Upload (FileUpload)\n  - ทั้งสามช่องเลือกไฟล์ด้วยการคลิกหรือลากไฟล์มาวางได้\n  - ช่องแนบไฟล์ “หนังสืออนุมัติหลักการ”: รับ PDF, PNG และ JPG ขนาดไม่เกิน 10 MB ต่อไฟล์; ข้อกำหนดเดิมระบุสูงสุด 10 ไฟล์ในช่องนี้ ต้องยืนยันจำนวนและการบังคับแนบ\n  - ช่องแนบไฟล์ “เอกสารอนุมัติงบ”: รับ PDF, PNG และ JPG ขนาดไม่เกิน 10 MB ต่อไฟล์; ข้อกำหนดเดิมระบุสูงสุด 10 ไฟล์ในช่องนี้ ต้องยืนยันจำนวนและการบังคับแนบ\n  - ช่องแนบไฟล์ “เอกสารอื่น ๆ”: ไม่บังคับแนบ รับ PDF, PNG และ JPG ขนาดไม่เกิน 10 MB ต่อไฟล์; ข้อกำหนดเดิมระบุสูงสุด 10 ไฟล์ในช่องนี้ ต้องยืนยันจำนวน"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "สร้างแผนเป็น Layer 1 ทำได้เฉพาะ กบค. (role อื่นเข้า URL นี้ตรง ๆ ต้องถูกปฏิเสธที่ backend) [Sheet พี่นุ]",
          "แผนใหม่ได้สถานะ “รอเลข PO” [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "กดออกจาก form หลังเริ่มกรอก: ต้องผ่านยืนยันการออกทุกทางที่รองรับ ไม่ปล่อย breadcrumb ข้ามการเตือนจนข้อมูลหาย",
          "เลือกไฟล์ผิดประเภท/เกินขนาด 10 MB/เกินจำนวนที่ตกลง: แจ้งที่รายการไฟล์นั้น ไม่ล้างชื่อแผน ปีงบ หรือไฟล์ที่เลือกถูกแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ช่องใดบังคับกรอก และเงื่อนไขใดทำให้ปุ่ม “บันทึก” ใช้งานได้",
          "ตัวเลือกปีงบประมาณ ความยาวและการซ้ำของชื่อแผน รวมถึงรูปแบบวงเงินที่รับ",
          "รูปแบบและความสัมพันธ์ของเลข WBS เลขโครงข่าย และเลขกิจกรรม",
          "ยืนยันจำนวนสูงสุด 10 ไฟล์ต่อหมวด และการบังคับแนบสองหมวดแรก",
          "ยืนยันพฤติกรรมของปุ่ม “ยกเลิก” และ breadcrumb รวมถึงการใช้ B.4",
          "ข้อความและหน้าปลายทางหลังบันทึกสำเร็จหรือผิดพลาด"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / B.1 · S1 — ฟอร์มสร้างแผน (ว่าง)"
      ]
    }
  },
  "B.2": {
    "title": "AC B.2 — Validation (ไม่ได้เลือก, Out of focus)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้างแผน Overhaul และตรวจรายละเอียดแผนที่สร้าง — Validation (ไม่ได้เลือก, Out of focus)",
          "Who: กบค. ใช้สร้างแผน; หน้ารายละเอียดเปิดดูได้ตามขอบเขตสิทธิ์",
          "Do: ดูช่องที่ข้อมูลไม่ครบและแก้ไขก่อนบันทึกอีกครั้ง"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม ตั้งชื่อ state กดบันทึกโดยยังไม่ครบ ส่วน AC ล่าสุดอธิบายการออกจากช่องโดยไม่กรอก"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "CHANGE — เปลี่ยนจังหวะ validation จาก state กดบันทึกใน baseline เป็น blur เมื่อออกจากช่องบังคับที่ยังว่าง พร้อมปุ่มบันทึก disable; ต้องยืนยัน pattern ก่อนพัฒนา",
          "NEW — เพิ่มการแก้ error รายช่อง: กรอกถูกให้ล้างเฉพาะ error ช่องนั้น คงค่าช่องอื่น; วงเงิน 0 ยังไม่ผ่าน และไม่สร้าง error เอกสารเองขณะที่ยังไม่ตกลง required"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - คลิกช่องแล้วออกโดยไม่กรอก จะแสดงข้อความเตือนใต้ช่องนั้น\n  - กรอกค่าที่ถูกต้องกลับเข้าไปแล้ว ข้อความเตือนช่องนั้นต้องหาย\n  - หากวงเงินเป็นศูนย์หรือไม่ถูกต้อง ห้ามบันทึก",
          "Buttons\n  - เมื่อข้อมูลยังไม่ครบ ให้ปุ่มบันทึกเป็นไปตามแบบที่ยืนยัน\n  - ปุ่ม \"บันทึก\" ยัง disable\n  - ปุ่ม “บันทึก”: คง disable เมื่อข้อมูลบังคับไม่ครบ; ไม่เพิ่ม error เอกสารเองเพราะเฟรมยังไม่มีข้อความนี้",
          "Form Fields\n  - ออกจากช่องบังคับโดยไม่กรอก (out of focus) ขอบช่องเป็นสีแดงและขึ้นข้อความใต้ช่อง: \"กรุณาระบุชื่อแผน\", \"กรุณาเลือกปีงบประมาณ\", \"กรุณาระบุวงเงินอนุมัติ\"\n  - วงเงินเป็น 0 ถือว่าไม่ผ่าน\n  - ช่องกรอก ชื่อแผน/วงเงิน และ รายการตัวเลือก ปีงบ: blur แล้วแสดง error ใต้ช่องที่ผิด พร้อมขอบแดง; แก้ช่องใดถูกให้ล้างเฉพาะ error ช่องนั้น ข้อความผิดพลาดต้องระบุช่อง ไม่ใช้ toast แทน validation รายช่อง\n  - ช่องกรอก วงเงิน: ค่า 0 ไม่ผ่าน; ทศนิยม/การใส่ comma ยังต้องตกลง"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "แก้ช่องที่ผิดให้ถูก: ล้างเฉพาะ error ช่องนั้น ไม่ล้าง error ช่องอื่นทั้ง form",
          "วงเงินว่างหรือ 0: ไม่ผ่านเงื่อนไขบันทึก; ช่องเอกสารที่ยังไม่ตกลง required ต้องไม่สร้าง error บังคับเอง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ช่องเอกสารใน B.2 ไม่ขึ้น error เลย ต้องเคาะว่าหนังสืออนุมัติหลักการ/เอกสารอนุมัติงบบังคับแนบหรือไม่ ถ้าบังคับต้องเพิ่มข้อความ error",
          "ต้องเคาะ: ตัวเลือกปีงบมีช่วงไหน, วงเงินมีทศนิยมได้ไหม/ใส่ comma อัตโนมัติไหม, ความยาวสูงสุดของชื่อแผน, ขนาดไฟล์สูงสุดต่อไฟล์"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / B.2 · S1 — กดบันทึกโดยยังไม่ครบ"
      ]
    }
  },
  "B.3": {
    "title": "AC B.3 — Filled",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้างแผน Overhaul และตรวจรายละเอียดแผนที่สร้าง — Filled",
          "Who: กบค. ใช้สร้างแผน; หน้ารายละเอียดเปิดดูได้ตามขอบเขตสิทธิ์",
          "Do: ตรวจข้อมูลที่กรอกครบแล้ว บันทึก หรือกลับไปแก้ไข"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มี form กรอกครบ/ไฟล์แนบ แต่ยังไม่แยกข้อกำหนดหลายไฟล์และการส่งซ้ำเป็น behavior ราย action"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดรายการไฟล์: ลบเฉพาะไฟล์ที่กด ปรับจำนวน/progress ตามจริง และไม่ reset ช่องกรอกที่ครบแล้ว",
          "NEW — เพิ่ม state บันทึกกำลังส่ง: ปิดการกดซ้ำจากเมาส์/คีย์บอร์ดโดยคงข้อมูลชุดที่กำลังส่งไว้"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดแก้ไขหรือสร้างแล้วแสดงข้อมูลใน form ตามจอ\n  - ช่องบังคับที่ปล่อยว่างต้องมีข้อความเตือน\n  - กดยืนยันแล้วรอผล; ไม่สำเร็จต้องคงค่าที่กรอกไว้",
          "File Upload (FileUpload)\n  - กรอกครบ (ตัวอย่าง ชื่อ \"Overhaul ประจำปีงบ 2570 — รถเจาะหลุม\", ปี 2571, วงเงิน 5,000,000, WBS C-70-OH-0003, โครงข่าย 60002103, กิจกรรม 0010) และแนบไฟล์ ปุ่ม \"บันทึก\" enable\n  - ไฟล์ที่แนบแสดงชื่อ ขนาด (เช่น \"Document.pdf 200 KB\") แถบ \"100%\" และปุ่มลบ แนบได้หลายไฟล์ต่อช่อง (Document.pdf, Image001.jpg, Image002.png)\n  - รายการไฟล์แนบ: แสดงชื่อ ขนาด progress และปุ่มลบแยกต่อไฟล์; ลบรายการที่เลือกเท่านั้น",
          "Form Fields\n  - ช่องกรอก ชื่อแผน/วงเงิน/เลขอ้างอิง และ รายการตัวเลือก ปีงบ: คงค่าที่กรอกครบ ไม่ reset เมื่อมีไฟล์เพิ่ม",
          "Buttons\n  - ปุ่ม “บันทึก”: enable เมื่อข้อมูลครบ และกันกดซ้ำระหว่างรอผลโดยยังคงค่า form"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "กดบันทึกซ้ำขณะรอ: ส่งชุดข้อมูลเดียว ไม่สร้างแผนสองรายการ",
          "มีไฟล์ที่ยังอัปโหลดไม่เสร็จ/ล้มเหลว: อย่าถือว่าพร้อมเพียงเพราะเห็นชื่อไฟล์ และอย่าทิ้งไฟล์อื่นที่สำเร็จแล้ว"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / B.3 · S1 — กรอกครบ"
      ]
    }
  },
  "B.4": {
    "title": "AC B.4 — ย้อนกลับ ยืนยันการออก",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้างแผน Overhaul และตรวจรายละเอียดแผนที่สร้าง — ย้อนกลับ ยืนยันการออก",
          "Who: กบค. ใช้สร้างแผน; หน้ารายละเอียดเปิดดูได้ตามขอบเขตสิทธิ์",
          "Do: ยืนยันออกจาก form โดยทิ้งข้อมูล หรือยกเลิกการออกเพื่อกรอกต่อ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีการยืนยันออกจาก form แต่รายละเอียดการคลิกพื้นที่นอกแผงหรือกด Esc เพื่อปิด และการคง ข้อมูลที่ยังไม่บันทึก ยังไม่แยกครบทุกทาง"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดปิดกล่อง (ConfirmDialog): ปิด/×/Esc/พื้นหลังกลับ B.1/B.3 พร้อม ข้อมูลที่ยังไม่บันทึก ไม่ใช่ออกจาก form",
          "NEW — เพิ่มผลยืนยันออก: ทิ้งเฉพาะค่าที่ยังไม่บันทึกแล้วไปหน้ารายการ A; ปิดกล่องธรรมดาต้องไม่ทำผลเดียวกับยืนยัน"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ถ้ามีข้อมูลเปลี่ยนและยังไม่บันทึก ให้เปิดหน้าต่างยืนยันการออก\n  - กดปิด/ยกเลิก กลับมาพร้อมข้อมูลที่กรอกไว้\n  - กดยืนยัน จึงออกจากหน้าและไม่บันทึกการเปลี่ยนแปลง\n  - \"ปิด\" กลับ form ค่าเดิมครบ · \"ยืนยัน\" ออกโดยไม่บันทึก\n  - Breadcrumb/ทางออกจากหน้า: ต้องตกลง trigger ที่แท้จริง เพราะจอสร้างแผนไม่มีปุ่มย้อนกลับ/ยกเลิก\n  - กด “ยืนยัน” → ทิ้ง ข้อมูลที่ยังไม่บันทึก และไปหน้ารายการแผน A ผ่าน หน้าต้นทางที่กำหนดไว้; เส้นทางนำทางด้านบน ของ prototype ยังเป็นลิงก์ตรง ไม่ผ่านกล่องนี้ จึงต้องเพิ่ม guard ให้ตรง AC ก่อน",
          "Modal\n  - กรอกข้อมูลไว้แล้ว ออกจาก form โดยไม่บันทึก (breadcrumb/ย้อนกลับ) เปิด modal \"ยืนยันการออก\" ข้อความ \"ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก\" ปุ่ม \"ปิด\" / \"ยืนยัน\"\n  - กล่องโต้ตอบกลางจอ (Modal) “ยืนยันการออก”: เปิดจากการออกจาก form ที่แก้แล้ว; คง form ไว้ด้านหลัง\n  - จาก หน้า form สร้าง/แก้ไขแผน (PlanForm) + กล่อง “ยืนยันการออก” (ConfirmDialog): ปุ่ม “ปิด”, ×, Esc หรือคลิกพื้นหลัง → ปิดเฉพาะ กล่องโต้ตอบกลางจอ (Modal) แล้วกลับ B.1/B.3 พร้อมชื่อแผน ปีงบ วงเงิน และไฟล์ ข้อมูลที่ยังไม่บันทึก เดิม ไม่ออกจาก form",
          "Buttons\n  - ปุ่ม “ปิด”: ปิดกล่องแล้วกลับ form สร้างแผน B.1/B.3 โดยไม่ล้างค่า\n  - ปุ่ม “ยืนยัน”: ทิ้งข้อมูลที่ยังไม่บันทึกแล้วกลับรายการแผน A.1 หรือหน้าว่าง A.4 ตามข้อมูลที่มี"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เปิดยืนยันออกแล้วกดปิด/×/Esc/พื้นหลัง: กลับ form พร้อม ข้อมูลที่ยังไม่บันทึก ไม่ทำผลเดียวกับกดยืนยันออก",
          "กดยืนยันออกซ้ำระหว่างเปลี่ยนหน้า: ออกเพียงครั้งเดียว และไม่ยิงบันทึกแผนจากการปิดกล่อง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "form สร้างไม่มีปุ่ม \"ย้อนกลับ/ยกเลิก\" (มีแค่ \"บันทึก\") ต้องเคาะว่าจุดที่เปิด modal นี้คืออะไร และถ้ายังไม่กรอกอะไรเลยไม่ต้องเปิด modal"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / B.4 · S1 — ย้อนกลับ — ยืนยันการออก"
      ]
    }
  },
  "B.5": {
    "title": "AC B.5 — บันทึกไม่สำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้างแผน Overhaul และตรวจรายละเอียดแผนที่สร้าง — บันทึกไม่สำเร็จ",
          "Who: กบค. ใช้สร้างแผน; หน้ารายละเอียดเปิดดูได้ตามขอบเขตสิทธิ์",
          "Do: ตรวจข้อผิดพลาดและลองบันทึกใหม่โดยคงข้อมูลที่กรอก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีผลบันทึกแผนไม่สำเร็จ แต่ไม่ได้แยก retry กับการคงข้อมูล/ไฟล์เป็น behavior รายส่วน"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนด error: toast ปิดได้โดย form ยังอยู่และคงค่า/ไฟล์ทุกช่อง ไม่ทำแผนใหม่จากการ retry อัตโนมัติ",
          "NEW — เพิ่มผลปุ่ม retry: เมื่อพ้น pending กดบันทึกใหม่ได้ และผลล้มเหลวเดิมต้องไม่แสดง success ทับ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อกดบันทึกหรือส่งแล้วผิดพลาด ให้แสดงข้อความแจ้งตามจอ\n  - ข้อความแจ้งผลมุมขวาบน error: แสดงเมื่อบันทึกไม่สำเร็จ; ใช้ข้อความ error ตามที่ตกลง ไม่แจ้งสำเร็จซ้ำ",
          "File Upload (FileUpload)\n  - อยู่หน้าเดิม และค่าที่กรอก/ไฟล์ที่เลือกต้องไม่หาย\n  - กด \"บันทึก\" แล้ว server ตอบผิดพลาด แสดง toast error \"general error\" อยู่หน้าเดิม ค่าที่กรอกและไฟล์คงอยู่",
          "Status (StatusBadge)\n  - ปลดสถานะกำลังทำ เพื่อให้แก้ไขและกดใหม่ได้ โดยไม่สร้างข้อมูลซ้ำ\n  - ใช้กติกา error กลาง (แสดง Status Code ถ้าไม่รู้สาเหตุ)\n  - toast \"General Error\" ถ้าไม่รู้สาเหตุให้แสดง Status Code แทน เช่น \"500 Internal Server Error\" ใช้ทั้ง form สร้างและแก้ไขแผน [Sheet พี่นุ — OH-Toast #2, ✅ CF]",
          "Form Fields\n  - ช่องกรอก, รายการตัวเลือก และไฟล์แนบ: เก็บค่าทั้งหมดไว้ให้แก้หรือส่งใหม่",
          "Buttons\n  - ปุ่ม “บันทึก”: ออกจากสถานะกำลังส่งหลังล้มเหลว และกด retry ได้โดยไม่สร้างแผนซ้ำ"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "บันทึกไม่สำเร็จ: คงค่าทุกช่องและไฟล์ ให้แก้/ลองใหม่ในหน้าเดิมโดยไม่แสดงสำเร็จ",
          "ไม่ทราบว่าคำขอเดิมสำเร็จหรือยังเพราะการเชื่อมต่อขาด: อย่าสร้างแผนซ้ำทันที ต้องตรวจผลเดิมหรือมีกลไกป้องกันรายการซ้ำก่อนส่งใหม่"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / B.5 · S1 — บันทึกไม่สำเร็จ"
      ]
    }
  },
  "B.6": {
    "title": "AC B.6 — บันทึกสำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้างแผน Overhaul และตรวจรายละเอียดแผนที่สร้าง — บันทึกสำเร็จ",
          "Who: กบค. ใช้สร้างแผน; หน้ารายละเอียดเปิดดูได้ตามขอบเขตสิทธิ์",
          "Do: ดูผลสร้างแผนสำเร็จและไปตรวจรายละเอียดแผน"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีบันทึกแผนสำเร็จและกลับรายการ แต่ยังไม่ได้ระบุการป้องกันผลสำเร็จซ้ำจากการกลับมาอ่านหน้า"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดหลังสำเร็จ: โหลดรายการแผนจากผลที่บันทึกจริงพร้อมสถานะรอเลข PO และความคืบหน้า “-” ไม่คงข้อมูลก่อนสร้าง",
          "NEW — เพิ่ม behavior toast: แสดงครั้งเดียวจากการสร้างสำเร็จ ไม่ยิงอีกเพียงเพราะ refresh/กลับมาที่รายการ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ปรับรายการหรือรายละเอียดล่าสุดให้เห็นตรงกับข้อมูลที่บันทึก\n  - ไม่ให้กดยืนยันซ้ำขณะกำลังส่งข้อมูล\n  - กด \"บันทึก\" สำเร็จ กลับหน้ารายการแผน (A.1) และแสดง toast \"สร้างแผน Overhaul สำเร็จ\"\n  - กลับหน้ารายการหลังบันทึก ✅ CF · ไม่มี notification (งานภายใน กบค.) [Sheet พี่นุ — OH-Toast #1]\n  - ข้อความแจ้งผลมุมขวาบน สร้างแผนสำเร็จ: แสดงหลังบันทึกสำเร็จจริงและกลับหน้ารายการ\n  - ความคืบหน้าในแถวใหม่: แผนยังไม่มี PO แสดง “-” ไม่ใช้ยอดเก่าค้าง",
          "Status (StatusBadge)\n  - เมื่อระบบยืนยันว่าทำสำเร็จ จึงเปลี่ยนหน้า/สถานะและแสดงข้อความสำเร็จ\n  - แผนใหม่สถานะ \"รอเลข PO\" ความคืบหน้า \"-\"",
          "Table (DataTable)\n  - Behavior\n    - ตารางรายการแผน (DataTable)และ ป้ายรายการที่เลือก: โหลดรายการใหม่ให้มีแผนที่สร้างพร้อมสถานะ “รอเลข PO”; ตำแหน่งแถวขึ้นกับ default sort ที่ตกลง"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "บันทึกสำเร็จแต่โหลดรายการหลังกลับหน้าล้มเหลว: แจ้งปัญหาการโหลดและให้ลองโหลดรายการใหม่ ไม่ส่งสร้างแผนซ้ำ",
          "ย้อนกลับมาอ่านรายการหรือ refresh: ไม่แสดง toast สร้างสำเร็จซ้ำโดยไม่มีการสร้างครั้งใหม่"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: แผนใหม่ขึ้นแถวบนสุดหรือไม่ (ขึ้นกับ default sort ใน A.1)",
          "ข้อความ toast มี 3 แบบไม่ตรงกัน: mock \"สร้างแผน Overhaul สำเร็จ\" · Sheet 1 รายการแผน (✅ CF) \"การสร้างแผน overhaul สำเร็จ\" · Sheet OH-Toast (🤔 เสนอ) \"สร้างแผน Overhaul {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ\" แนะนำแบบที่มีเลขแผน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / B.6 · S1 — บันทึกสำเร็จ"
      ]
    }
  },
  "B.7": {
    "title": "AC B.7 — ดูรายละเอียดแผน",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้างแผน Overhaul และตรวจรายละเอียดแผนที่สร้าง — ดูรายละเอียดแผน",
          "Who: กบค. ใช้สร้างแผน; หน้ารายละเอียดเปิดดูได้ตามขอบเขตสิทธิ์",
          "Do: ดูข้อมูลแผนและรายการ PO; การจัดการแผนขึ้นกับสิทธิ์และสถานะ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีรายละเอียดแผนและส่วน PO/เอกสาร แต่ไม่ได้แยกผลของปุ่มและการเปิดข้อมูลข้ามแผนเป็น behavior ครบถ้วน"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดข้อมูลรายละเอียด: เปลี่ยนแผนแล้วเอกสาร/จำนวน PO/สถานะต้องเป็นของแผนนั้น ไม่คงข้อมูลแผนก่อนหน้า",
          "NEW — เพิ่มปลายทาง action: แก้ไขไป C.2 พร้อมต้นทางรายละเอียด; ลบเปิด D.2.2 บนหน้าเดิม; สร้าง PO ไป E.2 โดยตรวจสิทธิ์แต่ละปุ่ม"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดแก้ไขหรือสร้างแล้วแสดงข้อมูลใน form ตามจอ\n  - ช่องบังคับที่ปล่อยว่างต้องมีข้อความเตือน\n  - กดยืนยันแล้วรอผล; ไม่สำเร็จต้องคงค่าที่กรอกไว้\n  - ส่วน \"รายละเอียดแผน\": ชื่อแผน, ประจำปีงบประมาณ, วงเงินอนุมัติ (บาท), จำนวนรถที่ Overhaul (\"0 คัน\"), วันที่สร้าง (dd/mm/yyyy พ.ศ.), เลข WBS (ศูนย์ต้นทุน), เลขโครงข่าย, เลขกิจกรรม\n  - ส่วน \"Purchase Order (0)\": empty \"ยังไม่มี Purchase Order\" ข้อความรอง \"เพิ่ม PO เพื่อเลือกรถที่จะเข้า Overhaul และเริ่มงานรายคัน\" ปุ่ม \"+ สร้าง Purchase Order\" (ไป E.2)\n  - ส่วน \"อะไหล่ที่ใช้\": empty \"ยังไม่มีรายการเบิกอะไหล่\" ข้อความรอง \"ส่วนนี้จองไว้ตาม userflow — ขั้นตอนเบิกอะไหล่ยังไม่ได้ออกแบบ\" ปุ่ม \"+ เบิกอะไหล่\" (ยังไม่มีปลายทาง ดู Scenario 21)\n  - หัวหน้า ✅ CF: breadcrumb \"หน้าแรก > จัดการงาน Overhaul > แผน {เลขแผน}\" ปุ่ม แก้ไข / ลบแผน / + PO [Sheet พี่นุ — 2 รายละเอียดแผน]\n  - ระยะสัญญา: เมื่อใกล้ครบสัญญาแสดง SubText สีแดง (ผูกกับ Scenario 16: 30 วัน / 15 วัน) [Sheet พี่นุ — 2 รายละเอียดแผน]\n  - จำนวนรถ: ลูกค้าให้ดูความเป็นไปได้ทำ Expand Row กดแล้วแสดงรายการรถในแถว [Sheet พี่นุ — 2 รายละเอียดแผน]\n  - ส่วน Purchase Order: แยกตารางกับ empty state ตามจำนวน PO จริง",
          "Status (StatusBadge)\n  - เปิดแผนจากรายการ (เมนู \"ดูรายละเอียด\") breadcrumb \"จัดการงาน Overhaul > แผน {เลข}\" หัวข้อ \"หมายเลขแผน {เลข}\" chip สถานะ และปุ่ม \"ลบแผน\" (กรอบแดง) / \"แก้ไข\" ขวาบน",
          "File Upload (FileUpload)\n  - ส่วน \"เอกสาร\": แยกกลุ่ม หนังสืออนุมัติหลักการ / เอกสารอนุมัติงบ แต่ละไฟล์มีicon ชนิด ชื่อ ขนาด และปุ่มดาวน์โหลด\n  - ส่วนข้อมูลแผนและเอกสาร: แสดงข้อมูลของแผนที่เปิดจริง; ดาวน์โหลดไฟล์ตามรายการ ไม่ใช้ข้อมูลจากแถวก่อนหน้า",
          "Table (DataTable)\n  - Behavior\n    - ตาราง PO ✅ CF: หมายเลข PO, ชื่อ PO (เช่น ซ่อมระบบแอร์), ศูนย์บริการ/อู่, จำนวนรถ (ชิดขวา), ความคืบหน้า (ปิดงานแล้ว x/n คันใน PO), ระยะสัญญา (เริ่ม–สิ้นสุด ตามใบสั่งจ้าง), จัดการ (ICON Action: ดูรายละเอียด · แก้ไข · ลบ) [Sheet พี่นุ — 2 รายละเอียดแผน]",
          "Search Input (SearchInput)\n  - ค้นหา/ตัวกรอง: ไม่มี (รอ confirm) · Sorting: ตามลำดับที่สร้าง PO (รอ confirm) [Sheet พี่นุ — 2 รายละเอียดแผน]",
          "Buttons\n  - ปุ่ม “แก้ไขแผน”: เปิด form แก้ไขแผน C.2 เฉพาะผู้มีสิทธิ์\n  - ปุ่ม “ลบแผน”: เปิดกล่องยืนยันลบแผน D.2.2 เฉพาะผู้มีสิทธิ์\n  - ปุ่มสร้าง Purchase Order: เปิด form สร้าง PO E.2 เฉพาะผู้มีสิทธิ์; ความต่างระหว่าง B.7/E.1 ต้องตกลงก่อนใช้ component ชุดเดียวกัน"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "ปุ่ม แก้ไข / ลบแผน / + PO และเมนูจัดการ PO เฉพาะ กบค. [Sheet พี่นุ — 2 รายละเอียดแผน]",
          "กรย. เห็นเฉพาะ PO ที่มีรถในเขตตัวเอง [Sheet พี่นุ — 2 รายละเอียดแผน]",
          "หน่วยงานเจ้าของรถเห็นเฉพาะ PO ที่มีรถตัวเอง [Sheet พี่นุ — 2 รายละเอียดแผน]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เปิดรายละเอียดแผนที่ถูกลบ/ไม่มีสิทธิ์แล้ว: แจ้งตามสาเหตุ ไม่คงรายละเอียดแผนก่อนหน้าให้ดูเหมือนยังเปิดได้",
          "โหลดเอกสารหรือ PO ของแผนไม่สำเร็จ: แจ้งเฉพาะส่วนที่โหลดไม่ได้ ไม่แทนด้วย “ไม่มีเอกสาร/ไม่มี PO” ซึ่งสื่อว่าข้อมูลว่างจริง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "หน้ารายละเอียดมี 2 แบบในไฟล์: B.7/C.5/D/F/G ใช้ \"เลข WBS (ศูนย์ต้นทุน)\" + ส่วน \"อะไหล่ที่ใช้\" + ปุ่ม \"เบิกอะไหล่\" ส่วน E.1/E.9 ใช้ \"ประเภทงบ · เลขที่งบประมาณ\" (เช่น \"งบลงทุน · C-69-OH-0103\") + ส่วน \"อะไหล่จากคลัง\" + ปุ่ม \"เบิก\" ต้องเลือกแบบเดียว",
          "chip สถานะในหน้านี้คือ \"ยังไม่มี PO\" แต่ในตารางรายการคือ \"รอเลข PO\" และใน form ไม่มีช่อง \"ประเภทงบ\" ทั้งที่ตารางแสดง ต้องเคาะที่มาของค่า",
          "breadcrumb \"แผน 123461\" ไม่ตรงกับหัวข้อ \"หมายเลขแผน Z69000X\" และค่าใน detail (ปี 2570, 5,500,000, 60001234) ไม่ตรงกับที่กรอกใน B.3 (2571, 5,000,000, 60002103) — mock ไม่ตรงกัน",
          "ลูกค้าฝากถาม: PO 1 ใบมีศูนย์บริการ/อู่มากกว่า 1 แห่งได้ไหม (schema ตอนนี้ 1:1) ต้องตอบก่อนออกแบบ E.2/F.2",
          "ตาราง PO ที่ CF มีทั้งชื่อ PO, ความคืบหน้า และระยะสัญญา ตรงกับรวม E.9 + F.1 ต้องแก้ mock ให้ทุกเฟรมใช้ชุดนี้"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / B.7 · S1 — ดูรายละเอียดแผน"
      ]
    }
  },
  "C.1": {
    "title": "AC C.1 — เมนู \"…\" → แก้ไข",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขข้อมูลแผน Overhaul — เมนู \"…\" → แก้ไข",
          "Who: กบค. ใช้แก้ไขและยืนยันข้อมูลแผน",
          "Do: เปิดเมนูท้ายแถวและเลือกแก้ไขแผนที่ต้องการ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีเมนูแก้ไขแผนในแถว แต่ไม่ได้แยกการปิดเมนูกับการเลือก action ทุกทาง"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดเมนู “…” (RowMenu): คลิกนอก/Esc ปิดแล้วค้าง A.1 และคืน focus; เลือกแก้ไขจึงไป C.2 ของแถวที่กด",
          "NEW — เพิ่มการรักษาเป้าหมาย: หลัง sort/เปลี่ยนหน้า ห้ามนำ action ไปใช้กับแถวใหม่ที่ตำแหน่งเดิม"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดแก้ไขหรือสร้างแล้วแสดงข้อมูลใน form ตามจอ\n  - ช่องบังคับที่ปล่อยว่างต้องมีข้อความเตือน\n  - กดยืนยันแล้วรอผล; ไม่สำเร็จต้องคงค่าที่กรอกไว้\n  - เลือก \"แก้ไข\" ไป form แก้ไขแผนนั้น (C.2)\n  - รายการเมนู “แก้ไข”: พาไป C.2 พร้อมเลขแผนของแถวนั้น; ซ่อน action ที่ role ไม่มีสิทธิ์\n  - การปิดเมนู: ตาม เมนู “…” ท้ายแถวรายการ (RowMenu) คลิกนอกปิดเมนู และ Esc ปิดพร้อมคืน focus ให้ปุ่มเมนูเดิม ไม่ออกจากหน้ารายการ",
          "Table (DataTable)\n  - Row Actions (RowMenu)\n    - กบค. กด \"…\" ท้ายแถวในหน้ารายการ เปิดเมนู 3 ข้อ: \"ดูรายละเอียด\" (icon แว่นขยาย), \"แก้ไข\" (icon ดินสอ), \"ลบ\" (icon ถังขยะ)\n    - ลูกค้าขอจัดการท้ายแถวเป็น ICON Action (ดู ⚠️ ใน A.1) [Sheet พี่นุ]\n    - เมนู “…” ท้ายแถว: เปิดให้ตรงแผนที่กด ไม่สลับไปใช้ ID แถวอื่นหลัง sort/แบ่งหน้า\n    - เมนู “…” ท้ายแถวรายการ (RowMenu): คลิกนอกเมนู/Esc → ปิดเมนูแล้วค้างหน้ารายการแผน ไม่เข้าสู่ form; กดแก้ไข → ปิดเมนูแล้วเปิด C.2 ของแถวนั้น",
          "Status (StatusBadge)\n  - เมนูแสดงทั้งแถวสถานะ \"รอเลข PO\" และ \"รอดำเนินการ\""
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "แก้ไขแผนเฉพาะ กบค. (role อื่นไม่เห็นเมนู \"แก้ไข\"/\"ลบ\") [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ตารางถูกเรียงหรือโหลดใหม่หลังเปิดเมนู: action แก้ไขต้องยังอ้าง ID แผนที่กด ไม่เปลี่ยนตามตำแหน่งแถว",
          "แผนถูกลบหรือสิทธิ์เปลี่ยนก่อนเข้า form: แจ้งว่าเปิดแก้ไม่ได้และกลับรายการ ไม่เปิด form ว่างแทน"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: แผนสถานะ \"รอดำเนินการ\" (มี PO/รถกำลังซ่อม) หรือ \"เสร็จสิ้น\" ยังแก้ไข/ลบได้หรือไม่ ถ้าไม่ได้ ต้องซ่อนหรือ disable เมนูนั้น",
          "Sheet PEA ใส่ action \"แก้ไขแผน\" ไว้เฉพาะสถานะ \"รอเลข PO\" ต้องเคาะว่าแผน \"รอดำเนินการ\" (มี PO แล้ว) ยังแก้ได้ไหม และแก้ได้ทุกช่องหรือเฉพาะบางช่อง (เช่น ห้ามแก้ปีงบเมื่อมี PO)"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / C.1 · S2 — เมนู \"…\" → แก้ไข"
      ]
    }
  },
  "C.2": {
    "title": "AC C.2 — form แก้ไข",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขข้อมูลแผน Overhaul — form แก้ไข",
          "Who: กบค. ใช้แก้ไขและยืนยันข้อมูลแผน",
          "Do: ปรับข้อมูลแผน ตรวจข้อมูล และบันทึกหรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม ระบุแก้ไขเข้าจากรายการหรือรายละเอียดและยกเลิกกลับทางเดิม แต่ยังไม่แยก callback/ข้อมูลที่ยังไม่บันทึก/ไฟล์ทุกกรณี"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ยกเลิก: ไม่แก้ให้กลับต้นทางทันที; มี ข้อมูลที่ยังไม่บันทึก เปิด C.3 ก่อน และจำต้นทางเป็นรายการ A.1 หรือรายละเอียด B.7 ให้ชัด",
          "NEW — เพิ่ม behavior prefill: แยกค่าเดิม/ค่าที่แก้/ไฟล์ใหม่ ไม่อัปโหลดไฟล์เดิมซ้ำและไม่ reset ข้อมูลที่ยังไม่บันทึก เมื่อเปิดกล่องยืนยัน"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดแก้ไขหรือสร้างแล้วแสดงข้อมูลใน form ตามจอ\n  - ช่องบังคับที่ปล่อยว่างต้องมีข้อความเตือน\n  - กดยืนยันแล้วรอผล; ไม่สำเร็จต้องคงค่าที่กรอกไว้\n  - บันทึกไม่สำเร็จใช้ toast \"General Error\" (#2) เหมือน B.5 · เปิดลิงก์แก้ไขแผนที่ถูกลบแล้ว → toast \"ไม่พบแผน {เลขแผน}\" (#6, ✅ CF) และอยู่หน้ารายการ [Sheet พี่นุ]\n  - กด “บันทึก” → validate; ถ้ามีการแก้ที่ผ่านเงื่อนไขเปิด C.4 และยังไม่บันทึกจริงจนกดยืนยัน",
          "File Upload (FileUpload)\n  - ทุกช่องเติมค่าที่สร้างไว้ (prefill — โน้ตในจอ) รวมไฟล์เดิมทุกไฟล์\n  - รายการเอกสารเดิมและ upload: แยกไฟล์ที่เก็บแล้วออกจากไฟล์ใหม่ ไม่อัปโหลดไฟล์เดิมซ้ำ",
          "Form Fields\n  - ใช้ฟิลด์และ validation เดียวกับ B.1/B.2\n  - ช่องกรอก/รายการตัวเลือก ใน form แก้ไข: เติมค่าของแผนล่าสุด; แยกค่าที่โหลดมากับค่าที่ผู้ใช้เปลี่ยน",
          "Buttons\n  - ปุ่มล่าง: \"ยกเลิก\" (ซ้าย) / \"บันทึก\" (ขวา)\n  - ปุ่ม “ยกเลิก”: เปิดกล่องยืนยันการออก C.3 เมื่อมีการแก้ไข; ถ้ายังไม่แก้ กลับหน้าต้นทาง\n  - ปุ่ม “บันทึก”: เปิดกล่องยืนยันการแก้ไขแผน C.4 เมื่อข้อมูลผ่านเงื่อนไข",
          "Navigation\n  - จาก หน้า form สร้าง/แก้ไขแผน (PlanForm) และหน้า plans/edit: “ยกเลิก” ถ้าไม่แก้ข้อมูล → กลับหน้าที่เข้ามา (จากรายการกลับรายการ; เข้าจากหน้ารายละเอียด กลับรายละเอียด B.7); ถ้าแก้แล้ว → เปิด C.3 ก่อน ไม่ทิ้ง ข้อมูลที่ยังไม่บันทึก ทันที"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "โหลดค่าเดิมของแผนไม่สำเร็จ: ไม่เปิดให้บันทึกค่า form ว่างทับข้อมูลเดิม และให้ลองโหลดใหม่ได้",
          "อีกคนแก้แผนระหว่างกรอก: แจ้งว่าข้อมูลเปลี่ยนแล้วและให้ตรวจค่าล่าสุด ไม่ทับการแก้อื่นเงียบ ๆ; วิธีเก็บ ข้อมูลที่ยังไม่บันทึก เพื่อเทียบต้องตกลง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: \"บันทึก\" enable ตลอดหรือ enable เฉพาะเมื่อมีการแก้ไข, ลบไฟล์เดิมจนเหลือ 0 ได้ไหม"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / C.2 · S2 — ฟอร์มแก้ไข (เติมค่าเดิม)"
      ]
    }
  },
  "C.3": {
    "title": "AC C.3 — \"ยกเลิก\" → ยืนยันการออก",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขข้อมูลแผน Overhaul — \"ยกเลิก\" → ยืนยันการออก",
          "Who: กบค. ใช้แก้ไขและยืนยันข้อมูลแผน",
          "Do: ยืนยันออกโดยทิ้งการแก้ไข หรือกลับไปแก้ไขต่อ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีกล่องยืนยันออกเมื่อยกเลิกการแก้ไข แต่ไม่ได้ระบุผลพื้นหลัง/Esc อย่างละเอียด"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดปิดกล่อง: ปิด/×/Esc/พื้นหลังกลับ C.2 พร้อม ข้อมูลที่ยังไม่บันทึก; ยืนยันจึงทิ้ง ข้อมูลที่ยังไม่บันทึก แล้วกลับรายการหรือรายละเอียดตามทางเข้า",
          "NEW — เพิ่มขอบเขตการทิ้งข้อมูล: การปิดกล่องไม่ลบไฟล์เดิมหรือแผนที่บันทึกแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ถ้ามีข้อมูลเปลี่ยนและยังไม่บันทึก ให้เปิดหน้าต่างยืนยันการออก\n  - กดปิด/ยกเลิก กลับมาพร้อมข้อมูลที่กรอกไว้\n  - กดยืนยัน จึงออกจากหน้าและไม่บันทึกการเปลี่ยนแปลง\n  - \"ปิด\" กลับ form พร้อมค่าที่แก้ไว้ · \"ยืนยัน\" ทิ้งการแก้ไข กลับหน้าก่อนหน้า",
          "Modal\n  - มีการแก้ไขเกิดขึ้น (โน้ตในจอ) กด \"ยกเลิก\" เปิด modal \"ยืนยันการออก\" ข้อความ \"ข้อมูลที่แก้ไขไว้จะไม่ถูกบันทึก\" ปุ่ม \"ปิด\" / \"ยืนยัน\"\n  - ยังไม่ได้แก้อะไร กด \"ยกเลิก\" ออกได้เลยไม่มี modal\n  - กล่องโต้ตอบกลางจอ (Modal) ยืนยันการออก: แสดงบน form แก้ไขโดยยังเก็บ ข้อมูลที่ยังไม่บันทึก\n  - จาก หน้า form สร้าง/แก้ไขแผน (PlanForm)/กล่อง “ยืนยันการออก” (ConfirmDialog): “ปิด”, ×, Esc, คลิกพื้นหลัง → ปิดเฉพาะกล่องและกลับ C.2 พร้อม ข้อมูลที่ยังไม่บันทึก; “ยืนยัน” → ทิ้ง ข้อมูลที่ยังไม่บันทึก แล้วกลับรายการหรือรายละเอียดแผนตามจุดที่เข้ามา",
          "Buttons\n  - ปุ่ม “ปิด”: ปิดกล่องแล้วกลับ form แก้ไข C.2 พร้อมค่าที่แก้ทั้งหมด\n  - ปุ่ม “ยืนยัน”: ทิ้งการแก้ไข แล้วกลับรายการแผน A.1 หรือรายละเอียดแผน B.7 ตามจุดที่เข้ามา"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ปิดกล่องยืนยันออกด้วยทุกทางที่อนุญาต: ต้องคงชื่อแผน วงเงิน และไฟล์ที่แก้ไว้ ไม่ reset form",
          "มาจากรายการกับมาจากรายละเอียด: ยืนยันออกต้องไปต้นทางที่จำไว้ ไม่ใช้ history ย้อนสุ่มจนกลับผิดแผน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / C.3 · S2 — ยกเลิกการแก้ไขแผน"
      ]
    }
  },
  "C.4": {
    "title": "AC C.4 — ยืนยันการแก้ไขแผน",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขข้อมูลแผน Overhaul — ยืนยันการแก้ไขแผน",
          "Who: กบค. ใช้แก้ไขและยืนยันข้อมูลแผน",
          "Do: ตรวจและยืนยันการแก้ไข หรือยกเลิกเพื่อกลับไปตรวจข้อมูล"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มียืนยันแก้ไข แต่ไม่ได้แยกการยกเลิกยืนยันกับการออกจาก form และการปิดระหว่าง pending"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มผลยกเลิกยืนยัน: ยกเลิก/×/Esc/พื้นหลังกลับ C.2 พร้อมค่าที่แก้ ไม่บันทึกและไม่กลับรายการ",
          "NEW — เพิ่มข้อกำหนดกำลังบันทึก: ยืนยันได้ครั้งเดียว; ต้องตกลงว่าจะค้างกล่องหรือยอมปิดระหว่าง pending เพราะกล่องเดิมยังปิดด้วยพื้นหลัง/Esc ได้"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดยกเลิก ปิดหน้าต่างโดยไม่เปลี่ยนข้อมูล\n  - กดยืนยันเพียงครั้งเดียวแล้วรอผล; ถ้าไม่สำเร็จต้องไม่แสดงว่าลบ/แก้ไขแล้ว\n  - “ยืนยัน” → เริ่มบันทึก แล้วไปหน้าต้นทางเมื่อสำเร็จ; ปุ่มบนจอ (Button) ที่ loading ปิดการกดซ้ำ แต่ กล่องโต้ตอบกลางจอ (Modal) ปัจจุบันยังปิดด้วยพื้นหลัง/Esc ได้ระหว่างรอ จึงต้องตกลงว่าจะล็อกการปิดระหว่าง pending หรือไม่",
          "Buttons\n  - กดปุ่มลบหรือแก้ไขแล้วให้เปิดหน้าต่างยืนยันตามจอ\n  - ปุ่ม “ยกเลิก”: ปิดกล่องแล้วกลับ form แก้ไขแผน C.2 พร้อมข้อมูลเดิม\n  - ปุ่ม “ยืนยัน”: ส่งการแก้ไขเพียงครั้งเดียว แสดง pending ระหว่างรอ; สำเร็จแสดงผล C.5",
          "Modal\n  - กด \"บันทึก\" เปิด modal \"ยืนยันการแก้ไข\" ข้อความ \"เมื่อยืนยันการแก้ไขแล้วจะไม่สามารถย้อนกลับได้ โปรดตรวจสอบก่อนยืนยัน\" ปุ่ม \"ยกเลิก\" / \"ยืนยัน\"\n  - \"ยกเลิก\" ปิด modal กลับ form ค่าคงอยู่ · \"ยืนยัน\" ส่งบันทึก\n  - กล่องโต้ตอบกลางจอ (Modal) “ยืนยันการแก้ไข”: แสดงข้อความเตือนก่อนส่งบันทึกจริง\n  - จาก กล่อง “ยืนยันการแก้ไขแผน” (ConfirmDialog) ของ หน้า form สร้าง/แก้ไขแผน (PlanForm): “ยกเลิก”, ×, Esc หรือคลิกพื้นหลัง → ปิดกล่องยืนยันและกลับ C.2 พร้อมค่าที่แก้ ไม่บันทึกและไม่กลับรายการ"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "กดยืนยันแก้ไขซ้ำ: ส่งครั้งเดียวและไม่ปิดเป็นผลสำเร็จจนทราบผลบันทึก",
          "บันทึกล้มเหลวหรือแผนถูกลบระหว่างยืนยัน: แจ้งสาเหตุ คง ข้อมูลที่ยังไม่บันทึก ที่กู้คืนได้ ไม่แสดงข้อมูลใหม่ว่าเป็นค่าที่บันทึกแล้ว\nเมื่อยืนยันไม่สำเร็จ: อย่าล้าง ช่องกรอก/ไฟล์หรือเปลี่ยนข้อมูลบนจอเป็นสำเร็จ"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / C.4 · S2 — ยืนยันการแก้ไขแผน"
      ]
    }
  },
  "C.5": {
    "title": "AC C.5 — บันทึกสำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขข้อมูลแผน Overhaul — บันทึกสำเร็จ",
          "Who: กบค. ใช้แก้ไขและยืนยันข้อมูลแผน",
          "Do: ดูผลบันทึกสำเร็จและข้อมูลแผนที่อัปเดต"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีผลแก้แผนสำเร็จ แต่ไม่ได้แยกการโหลดค่าหลังแก้และ toast จากการนำทางซ้ำ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดแสดงผล: ชื่อแผน/ปีงบ/วงเงิน/ไฟล์ต้องเป็นค่าที่บันทึกใหม่ ไม่แสดง cache ก่อนแก้",
          "NEW — เพิ่ม behavior กลับต้นทาง: ใช้ปลายทางตามทางเข้าและยืนยันกับ AC ล่าสุด; toast เกิดจากการแก้สำเร็จ ไม่เกิดซ้ำเมื่อเปิดหน้าอ่าน"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ปรับรายการหรือรายละเอียดล่าสุดให้เห็นตรงกับข้อมูลที่บันทึก\n  - ไม่ให้กดยืนยันซ้ำขณะกำลังส่งข้อมูล\n  - ยืนยันแล้วบันทึกสำเร็จ ไปหน้ารายละเอียดแผน (B.7) แสดงค่าใหม่ และ toast \"บันทึกการแก้ไขแผนสำเร็จ\"\n  - toast \"บันทึกการแก้ไขแผนสำเร็จ\" แสดงที่หน้ารายละเอียดแผน · ไม่มี notification [Sheet พี่นุ — OH-Toast #3, ✅ CF]\n  - ข้อความแจ้งผลมุมขวาบน บันทึกการแก้ไขสำเร็จ: แสดงจากผลบันทึก ไม่ใช่เพียงเพราะปิด กล่องโต้ตอบกลางจอ (Modal)\n  - ส่วนรายละเอียดแผน: โหลดค่าที่แก้ใหม่ รวมเอกสารและข้อมูลชื่อแผน; ไม่แสดง cache ก่อนแก้",
          "Status (StatusBadge)\n  - เมื่อระบบยืนยันว่าทำสำเร็จ จึงเปลี่ยนหน้า/สถานะและแสดงข้อความสำเร็จ\n  - สถานะแผนไม่เปลี่ยน"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "แก้ไขสำเร็จแต่โหลดรายละเอียด/รายการล่าสุดล้มเหลว: ให้ลองโหลดใหม่ ไม่ส่งแก้ไขซ้ำโดยอัตโนมัติ",
          "กลับมาอ่านหน้าสำเร็จอีกครั้ง: ไม่ยิง toast แก้ไขสำเร็จซ้ำ และไม่ใช้ cache ก่อนแก้เป็นค่าปัจจุบัน"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ไม่มีเฟรมบันทึกการแก้ไขไม่สำเร็จ ให้ใช้แบบ B.5 (toast error อยู่หน้าเดิม)",
          "ไม่มีเฟรมเปิดลิงก์แก้ไขแผนที่ถูกลบแล้ว ให้ใช้แบบ E.8 (toast \"ไม่พบแผน\")"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / C.5 · S2 — บันทึกสำเร็จ"
      ]
    }
  },
  "D.1.1": {
    "title": "AC D.1.1 — เมนู \"…\" → ลบ ในหน้า List",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ลบแผน Overhaul — เมนู \"…\" → ลบ ในหน้า List",
          "Who: กบค. ใช้ตรวจสอบและยืนยันแผนที่จะลบ",
          "Do: เปิดเมนูในรายการแผนและเลือกแผนที่จะลบ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีทางเข้าลบจากเมนูแถวรายการ แต่ยังไม่ได้แยกการเปิดเมนูออกจากการยืนยันลบเป็น behavior ละเอียด"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดเมนูลบ: คลิกนอก/Esc ก่อนเลือกลบเพียงปิดเมนูอยู่ A.1 ไม่เปลี่ยนข้อมูล; เลือกลบจึงเปิด D.2.1",
          "NEW — เพิ่มการจำแผนเป้าหมายด้วย ID ไม่ใช้ index ของตารางที่อาจเปลี่ยนจาก sort"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดยกเลิก ปิดหน้าต่างโดยไม่เปลี่ยนข้อมูล\n  - กดยืนยันเพียงครั้งเดียวแล้วรอผล; ถ้าไม่สำเร็จต้องไม่แสดงว่าลบ/แก้ไขแล้ว\n  - เมนู “…” ในตารางแผน: จับแถว/ID ที่กำลังลบไว้ให้แน่นอน\n  - รายการ “ลบ”: เปิด D.2.1 โดยยังไม่ลบข้อมูลเมื่อเลือกเมนู; ตรวจสิทธิ์ของ action",
          "Buttons\n  - กดปุ่มลบหรือแก้ไขแล้วให้เปิดหน้าต่างยืนยันตามจอ",
          "Modal\n  - กบค. กด \"…\" แล้วเลือก \"ลบ\" เปิด modal ยืนยันการลบแผน (D.2.1)",
          "Table (DataTable)\n  - Row Actions (RowMenu)\n    - เมนู “…” ท้ายแถวรายการ (RowMenu): คลิกพื้นหลังนอกเมนู/Esc ก่อนเลือกลบ → แค่ปิดเมนู อยู่ A.1 และไม่ลบ; เลือกลบ → ปิดเมนูแล้วเปิด D.2.1"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "ลบแผนเฉพาะ กบค. [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "รายการแผนเปลี่ยนหลังเปิดเมนูลบ: กล่องยืนยันยังต้องอ้างแผนที่ผู้ใช้เลือกจริง ไม่ลบแถวที่เลื่อนมาแทน",
          "ผู้ใช้ปิดเมนูก่อนเลือกลบ: ต้องไม่เปิดกล่องยืนยันลบจาก event ค้างหรือการคลิกทะลุ"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / D.1 · S3 — เมนู \"…\" → ลบ"
      ]
    }
  },
  "D.1.2": {
    "title": "AC D.1.2 — ปุ่ม \"ลบแผน\" ในหน้า Detail",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ลบแผน Overhaul — ปุ่ม \"ลบแผน\" ในหน้า Detail",
          "Who: กบค. ใช้ตรวจสอบและยืนยันแผนที่จะลบ",
          "Do: เริ่มลบแผนจากหน้ารายละเอียด"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม snapshot ยังไม่พบเฟรมทางเข้าปุ่มลบในรายละเอียดที่แยกตรงรหัสนี้"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มการอ้างอิงทางเข้าลบจากปุ่มใน B.7 แยกจากเมนูรายการ; กดแล้วเปิด D.2.2 บนรายละเอียดเดิม ยังไม่ลบ",
          "NEW — เพิ่มผลเมื่อยกเลิกกล่องจากทางเข้านี้: กลับรายละเอียด B.7 ไม่กลับรายการ A.1 โดยไม่สรุปว่าระบบเดิมไม่มีสิทธิ์ลบจากรายละเอียด"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดยกเลิก ปิดหน้าต่างโดยไม่เปลี่ยนข้อมูล\n  - กดยืนยันเพียงครั้งเดียวแล้วรอผล; ถ้าไม่สำเร็จต้องไม่แสดงว่าลบ/แก้ไขแล้ว\n  - ข้อมูลรายละเอียดด้านหลัง: คงเดิมจนกดยืนยันใน กล่องโต้ตอบกลางจอ (Modal) ไม่ลบเมื่อเพียงเปิดกล่อง",
          "Buttons\n  - กดปุ่มลบหรือแก้ไขแล้วให้เปิดหน้าต่างยืนยันตามจอ\n  - ปุ่ม “ลบแผน” หน้ารายละเอียด: อ้างแผนที่เปิดอยู่และเปิด D.2.2",
          "Modal\n  - กบค. กดปุ่ม \"ลบแผน\" (กรอบแดง ขวาบน) ในหน้ารายละเอียดแผน เปิด modal ยืนยันการลบแผน (D.2.2)\n  - modal หัวข้อ \"ยืนยันการลบแผน\" ข้อความ \"เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่\" ปุ่ม \"ยกเลิก\" / \"ยืนยัน\" (สีแดง)"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "แผนถูกลบ/สิทธิ์เปลี่ยนหลังเปิดรายละเอียด: ห้ามเปิดให้ยืนยันลบจากข้อมูลเก่าโดยไม่ตรวจล่าสุด",
          "เปิดกล่องลบแล้วกดยกเลิก: กลับรายละเอียดแผนเดิม ไม่กลับรายการหรือทำข้อมูลหายก่อนยืนยัน"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "modal ไม่ระบุเลขแผน/ชื่อแผนและไม่บอกว่า PO/รถใต้แผนจะหายด้วย เสี่ยงลบผิดแผน แนะนำให้เพิ่มชื่อแผนและจำนวน PO ในข้อความ",
          "ต้องเคาะ: ลบแผนที่มี PO หรือมีรถกำลังซ่อมได้ไหม (D.1.2 ใน mock เป็นแผน \"ยังไม่มี PO\"), soft หรือ hard delete — ข้อความ \"กู้คืนไม่ได้\" บอกฝั่งผู้ใช้ แต่ไม่บอกฝั่ง DB"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "D.3": {
    "title": "AC D.3 — ลบสำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ลบแผน Overhaul — ลบสำเร็จ",
          "Who: กบค. ใช้ตรวจสอบและยืนยันแผนที่จะลบ",
          "Do: ดูผลลบสำเร็จและกลับไปยังรายการที่ไม่มีแผนที่ลบแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีผลลบแผนสำเร็จ แต่ไม่ได้แยกกรณีลบแถวสุดท้ายของหน้ากับรายการทั้งหมดว่าง"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดตารางหลังลบ: โหลดจำนวนใหม่และไม่คงแถวแผนที่ลบ; หากไม่เหลือแผนให้แสดง A.4",
          "NEW — เพิ่มกรณี Pagination หลุดหน้า: หากหน้าปัจจุบันว่างแต่ยังมีข้อมูลหน้าอื่น ต้องตกลงหน้าที่จะกลับและไม่แสดงว่ายังไม่มีแผนทั้งระบบ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ปรับรายการหรือรายละเอียดล่าสุดให้เห็นตรงกับข้อมูลที่บันทึก\n  - ไม่ให้กดยืนยันซ้ำขณะกำลังส่งข้อมูล\n  - ยืนยันลบสำเร็จ (จาก List หรือ Detail) อยู่/กลับมาที่หน้ารายการแผน แผนหายจากตาราง และ toast \"ลบแผน overhaul สำเร็จ\"\n  - จำนวนรายการรวม (\"จาก 95 รายการ\") ลดลง\n  - ลบจาก List หรือ Detail กลับหน้ารายการ ✅ CF [Sheet พี่นุ — OH-Toast #4]\n  - ข้อความแจ้งผลมุมขวาบน ลบแผนสำเร็จ: แสดงหลังผลยืนยันจาก server",
          "Status (StatusBadge)\n  - เมื่อระบบยืนยันว่าทำสำเร็จ จึงเปลี่ยนหน้า/สถานะและแสดงข้อความสำเร็จ",
          "Table (DataTable)\n  - Behavior\n    - ตารางแผน/จำนวนรายการ: เอาแผนที่ลบออกแล้วโหลดจำนวนใหม่; ถ้าไม่เหลือข้อมูลให้แสดง empty state ที่ถูกต้อง\n  - Pagination\n    - ปุ่มเปลี่ยนหน้าใต้ตาราง (Pagination): ต้องตกลงหน้าที่แสดงต่อหากแถวที่ลบเป็นแถวสุดท้ายของหน้านั้น"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ลบแผนแล้วเหลือหน้าปัจจุบันว่าง แต่ยังมีรายการหน้าอื่น: ไปหน้าที่ยังมีข้อมูล ไม่สรุปว่าไม่มีแผนทั้งระบบ",
          "ลบสำเร็จแล้วโหลดรายการใหม่ไม่สำเร็จ: ให้ลองโหลดรายการ ไม่ส่งลบซ้ำจากปุ่ม retry การโหลด"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ไม่มีเฟรมลบไม่สำเร็จ ให้ใช้กติกา error กลาง",
          "ข้อความ toast 2 แบบ: mock และ Sheet 1 รายการแผน (✅ CF) \"ลบแผน overhaul สำเร็จ\" · Sheet OH-Toast (🤔 เสนอ) \"ลบแผน Overhaul {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ\""
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / D.3 · S3 — ลบสำเร็จ"
      ]
    }
  },
  "E.1": {
    "title": "AC E.1 — รายละเอียดแผน (ยังไม่มี PO)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้าง PO ภายใต้แผนและตรวจรายละเอียด PO — รายละเอียดแผน (ยังไม่มี PO)",
          "Who: กบค. ใช้จัดการ PO; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลแผน PO และรถในขอบเขตของตน",
          "Do: ดูแผนที่ยังไม่มี PO และเริ่มสร้าง PO ตามสิทธิ์"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีแผนยังไม่มี PO เอกสาร และทางเข้าสร้าง PO แต่ไม่ได้แยก behavior แต่ละส่วนเมื่อเป็นข้อมูลว่าง"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดปุ่ม “+ PO”: เปิด E.2 ของแผนปัจจุบัน ไม่สร้าง PO จากการเปิด form และไม่ทำงานร่วมกับปุ่มเบิกอะไหล่",
          "NEW — เพิ่มข้อกำหนดเอกสารสองคอลัมน์: ดาวน์โหลดไฟล์ตามประเภท/แผนที่กด ไม่ใช้ไฟล์จากแผนก่อนหน้า"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อเปิด form แสดงค่าปัจจุบันให้ครบ; ช่องที่ยังไม่เลือกต้องว่าง\n  - ระหว่างบันทึกให้รอผลและไม่ให้กดซ้ำ\n  - บันทึกไม่สำเร็จต้องคงข้อมูลที่กรอก; สำเร็จจึงแสดงรายละเอียดใหม่\n  - กด \"+ PO\" ไปหน้าเพิ่ม Purchase Order (E.2)",
          "File Upload (FileUpload)\n  - เปลี่ยนชื่อ PO อู่ รถ หรือไฟล์แล้วตรวจความครบถ้วนก่อนบันทึก",
          "Status (StatusBadge)\n  - แผนสถานะ \"รอเลข PO\" ส่วน \"Purchase Order (0)\" แสดง empty \"ยังไม่มี Purchase Order\" ข้อความรอง \"เพิ่ม PO เพื่อเลือกรถที่จะเข้า Overhaul และเริ่มงานรายคัน\" และปุ่ม \"+ PO\" ที่หัวส่วน",
          "Table (DataTable)\n  - Columns\n    - ส่วนเอกสารแสดง 2 คอลัมน์ (หนังสืออนุมัติหลักการ | เอกสารอนุมัติงบ) เช่น \"หนังสืออนุมัติหลักการ-123458.pdf 822 KB\"\n    - รายการเอกสารสองคอลัมน์: ดาวน์โหลดไฟล์ของประเภทที่กดและของแผนปัจจุบัน",
          "Buttons\n  - ส่วน \"อะไหล่จากคลัง\" มีปุ่ม \"+ เบิก\" และ empty \"ยังไม่มีรายการเบิกอะไหล่\"\n  - ปุ่ม “+ PO”: เปิด form สร้าง PO E.2\n  - ปุ่ม “+ เบิก”: ทำรายการในส่วนอะไหล่ ไม่เปิด form PO; ปลายทางของการเบิกยังต้องตกลง",
          "Empty State (EmptyState)\n  - ส่วนแสดงเมื่อไม่มีข้อมูล Purchase Order (0): แสดงเมื่อแผนนี้ยังไม่มี PO"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "ปุ่ม \"+ PO\" เฉพาะ กบค. [Sheet พี่นุ]",
          "แผนสถานะ \"รอเลข PO\" ยังเป็น Layer 1 หน่วยงาน/กรย. ยังไม่เห็นแผนนี้ [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "โหลดส่วน PO ไม่สำเร็จ: ไม่แสดง Purchase Order (0) หรือ empty state จนกว่าจะรู้ว่าไม่มี PO จริง",
          "กดเพิ่ม PO ขณะแผนถูกลบจากอีกหน้าจอ: แจ้งไม่พบแผนและไม่ให้สร้าง PO ค้างใต้แผนที่ใช้ไม่ได้"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "หน้ารายละเอียดเวอร์ชันนี้ต่างจาก B.7 (ดู ⚠️ ใน B.7) และ empty state ของ PO ใน E.1 ไม่มีปุ่มกลาง ขณะที่ B.7 มี \"+ สร้าง Purchase Order\""
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / E.1 · S4 — รายละเอียดแผน (ยังไม่มี PO)"
      ]
    }
  },
  "E.2": {
    "title": "AC E.2 — form PO (ว่าง)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้าง PO ภายใต้แผนและตรวจรายละเอียด PO — form PO (ว่าง)",
          "Who: กบค. ใช้จัดการ PO; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลแผน PO และรถในขอบเขตของตน",
          "Do: กรอกข้อมูล PO เลือกอู่และรถ บันทึก หรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มี form เพิ่ม PO พร้อมอู่ รถและเอกสาร แต่ไม่ได้แยก behavior การออกทุกทาง/การเลือกเป็น ID ครบถ้วน"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดเลือกอู่/รถ: พิมพ์ชื่ออย่างเดียวไม่ถือว่าเลือก ต้องมีรายการจริงและค่าที่ส่งตรงกับสิ่งที่แสดง",
          "NEW — เพิ่มการออกจาก form: ปุ่มย้อนกลับใช้ leave guard กลับ E.1 ส่วน breadcrumb ปัจจุบันยังข้าม guard ต้องแก้ให้ตรงข้อกำหนดก่อนอ้างว่าป้องกันข้อมูลหายครบ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อเปิด form แสดงค่าปัจจุบันให้ครบ; ช่องที่ยังไม่เลือกต้องว่าง\n  - ระหว่างบันทึกให้รอผลและไม่ให้กดซ้ำ\n  - บันทึกไม่สำเร็จต้องคงข้อมูลที่กรอก; สำเร็จจึงแสดงรายละเอียดใหม่\n  - 3 ส่วน: \"รายละเอียด Purchase Order\" (ชื่อ PO, ศูนย์บริการ/อู่), \"เลือกรถ\" (ช่องค้นหารถ), \"เอกสาร\" (ใบสั่งจ้าง, อื่นๆ)",
          "File Upload (FileUpload)\n  - เปลี่ยนชื่อ PO อู่ รถ หรือไฟล์แล้วตรวจความครบถ้วนก่อนบันทึก\n  - ช่องอัปโหลดแสดง \"PDF, JPG · สูงสุด 10 ไฟล์ · 0/10 ไฟล์\" (มีตัวนับ)\n  - ช่องแนบไฟล์ ใบสั่งจ้าง/เอกสารอื่น: แยกแต่ละประเภทและแสดงตัวนับ 0/10; รับ PDF และ JPG สูงสุด 10 ไฟล์ต่อช่อง โดยใบสั่งจ้างบังคับแนบ ส่วนเอกสารอื่นไม่บังคับแนบ",
          "Buttons\n  - ปุ่ม \"บันทึก\" ขวาล่าง ไม่มีปุ่มยกเลิก/ย้อนกลับ\n  - ปุ่ม “บันทึก”: ใช้รูปแบบ validation ของ PO ตาม E.3 ไม่ยก disable ของหน้าสร้างแผนมาใช้เอง",
          "Select Field\n  - breadcrumb \"… > แผน {เลขแผน} > เพิ่ม Purchase Order\" [Sheet พี่นุ — 4 เพิ่ม-แก้ไข PO, ✅ CF]\n    \n    ช่องเลือกอู่แบบพิมพ์ค้นหา (vendor list) [Sheet พี่นุ — 4 เพิ่ม-แก้ไข PO, ✅ CF]",
          "Form Fields\n  - ช่องกรอก ชื่อ PO: เริ่มว่าง; ช่องเลือกอู่และรถต้องเลือกจากรายการจริง ไม่ถือข้อความที่พิมพ์ว่าเลือกแล้ว",
          "Navigation\n  - จาก หน้า form สร้าง/แก้ไข PO (PoForm): ปุ่มย้อนกลับใช้ หน้าต้นทางที่กำหนดไว้ กลับรายละเอียดแผน E.1; มี ข้อมูลที่ยังไม่บันทึก เปิด “ยืนยันการออก” ก่อน ปิดกล่องแล้วกลับ form เดิม ยืนยันแล้วทิ้ง ข้อมูลที่ยังไม่บันทึก ไปต้นทาง ส่วน เส้นทางนำทางด้านบน ยังเป็นลิงก์ตรงไม่ผ่าน guard ต้องแก้/เคาะให้ครอบคลุม; ไม่เพิ่มปุ่มยกเลิกท้ายหน้าสร้าง PO ที่ AC ไม่มี"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "เฉพาะ กบค. [Sheet พี่นุ — 4 เพิ่ม-แก้ไข PO, ✅ CF]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "พิมพ์ชื่ออู่/รถแต่ไม่ได้เลือกรายการ: ไม่ถือว่ามีรายการที่ถูกต้องสำหรับบันทึก",
          "ออกจาก form ที่เลือกไฟล์หรือรถแล้ว: ผ่าน leave guard และคง ข้อมูลที่ยังไม่บันทึก เมื่อปิดกล่องเตือน ไม่ทิ้งข้อมูลจาก breadcrumb โดยไม่เตือน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / E.2 · S4 — ฟอร์ม PO (ว่าง)"
      ]
    }
  },
  "E.3": {
    "title": "AC E.3 — กดบันทึกโดยยังไม่ครบ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้าง PO ภายใต้แผนและตรวจรายละเอียด PO — กดบันทึกโดยยังไม่ครบ",
          "Who: กบค. ใช้จัดการ PO; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลแผน PO และรถในขอบเขตของตน",
          "Do: ตรวจช่องที่ยังไม่ครบและแก้ไขก่อนบันทึก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีผลบันทึก PO โดยยังไม่ครบ แต่ยังไม่แยกการแก้ error รายช่อง/เงื่อนไขรถที่ยังไม่เคาะ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior validation รายส่วน: ชื่อ PO/อู่/ใบสั่งจ้างแสดงใต้ส่วนที่ผิด แก้ถูกให้หายเฉพาะส่วนนั้น ไม่ล้างค่าหรือไฟล์ส่วนอื่น",
          "NEW — ระบุเงื่อนไขรถเป็นเรื่องต้องตกลง ไม่เพิ่ม required อย่างน้อยหนึ่งคันเป็นข้อยืนยันเพียงเพราะ prototype ตรวจไว้"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อออกจากช่องที่จำเป็นโดยไม่กรอก ให้ขึ้นข้อความเตือนตามหน้าจอ\n  - เมื่อกรอกถูกต้องให้ลบข้อความเตือนของช่องนั้น\n  - หากข้อมูลยังไม่ครบ ต้องไม่ส่งข้อมูลผิดไปบันทึก\n  - กด \"บันทึก\" โดยยังไม่กรอก ไม่บันทึก ขึ้นข้อความใต้ช่อง: \"กรุณาระบุชื่อ Purchase Order\", \"กรุณาเลือกศูนย์บริการ/อู่\", \"กรุณาแนบใบสั่งจ้าง\"",
          "Form Fields\n  - ช่องกรอก ชื่อ Purchase Order: กดบันทึกแล้วว่างให้แสดง error ใต้ช่องนี้",
          "Select Field\n  - ช่องเลือกอู่และ upload ใบสั่งจ้าง: แสดง error แยกแต่ละส่วน และล้างเฉพาะ error ของส่วนที่แก้ถูก",
          "Buttons\n  - ปุ่ม “บันทึก”: ไม่ส่งข้อมูลเมื่อ validation ไม่ผ่าน; เงื่อนไขต้องเลือกรถอย่างน้อยหนึ่งคันยังต้องตกลง"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "แก้ชื่อ PO/อู่/ใบสั่งจ้างแล้ว: ล้าง error เฉพาะส่วนที่แก้ถูก ไม่ล้างทุกข้อความเพียงเพราะกดบันทึกอีกครั้ง",
          "กดบันทึกทั้งที่ validation ยังไม่ผ่าน: ไม่ส่งสร้าง PO; เงื่อนไขบังคับมีรถอย่างน้อยหนึ่งคันยังต้องยึดข้อสรุปทีม"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "แผนสร้างใช้ปุ่ม disable + validate ตอน out of focus (B.1/B.2) แต่ PO ใช้กดบันทึกแล้ว validate (ปุ่ม enable) ต้องเลือก pattern เดียวกันทั้งระบบ",
          "ไม่มี error ของ \"เลือกรถ\" ต้องเคาะว่าบันทึก PO ที่ไม่มีรถได้ไหม (แนะนำให้บังคับอย่างน้อย 1 คัน)"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / E.3 · S4 — กดบันทึกโดยยังไม่ครบ"
      ]
    }
  },
  "E.4": {
    "title": "AC E.4 — เลือกอู่ (พิมพ์ค้น)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้าง PO ภายใต้แผนและตรวจรายละเอียด PO — เลือกอู่ (พิมพ์ค้น)",
          "Who: กบค. ใช้จัดการ PO; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลแผน PO และรถในขอบเขตของตน",
          "Do: พิมพ์ค้นหาและเลือกอู่สำหรับ PO"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีช่องค้นและเลือกอู่ แต่ยังไม่ระบุ blur/Esc/Enter และผลของข้อความที่พิมพ์แต่ไม่ได้เลือก"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ช่องเลือกอู่ (Combobox): blur คืนชื่อเดิม Esc ปิดไม่เลือก Enter เลือกแถวไฮไลต์; พิมพ์ไม่เลือกไม่เปลี่ยนอู่",
          "NEW — เพิ่มผลเปลี่ยนอู่: ID/ชื่อ/เบอร์/ที่อยู่ต้องเปลี่ยนเป็นอู่เดียวกัน ไม่คง snapshot ของอู่เดิมหลังเปลี่ยนข้อความ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - คลิกช่องอู่หรือพิมพ์ชื่อแล้วเปิดรายการอู่ที่ตรงกัน\n  - เมื่อกำลังค้นหา แสดงว่ากำลังโหลด; ไม่พบให้แสดงข้อความไม่พบ\n  - คลิกชื่ออู่แล้วใช้รายการที่เลือกจริง และปิดรายการค้นหา\n  - เปลี่ยนอู่แล้วชื่อ เบอร์โทร และที่อยู่ที่สัมพันธ์กับอู่ต้องเปลี่ยนตาม\n  - พิมพ์ชื่ออู่แต่ไม่เลือกจากรายการ ต้องไม่ถือว่าเลือกอู่สำเร็จ\n  - เลือก ช่องแสดงชื่ออู่ เลือกได้อู่เดียว\n  - ช่องพิมพ์ค้นหา อู่: พิมพ์แล้วค้นจาก vendor list; แยกข้อความค้นจากอู่ที่เลือกแล้ว\n  - เมื่อเลือกอู่: เก็บ vendor_id พร้อมชื่อ/เบอร์/ที่อยู่ตาม Dev mapping; เปลี่ยนข้อความค้นแล้วต้องไม่คง ID ของอู่เดิมผิดรายการ",
          "Select Field\n  - พิมพ์ชื่อในช่องศูนย์บริการ/อู่ (เช่น \"ตรีเพชร\") dropdown แสดงอู่ที่ตรง แต่ละรายการมี 2 บรรทัด: ชื่อ (\"บริษัท ตรีเพชรอีซูซุเซลส์ จำกัด\") และ \"เบอร์ · เขต จังหวัด\" (\"02-111-2202 · เขตพระนคร กรุงเทพฯ\")\n  - ช่องเลือกจากรายการ ผลค้น: แต่ละแถวแสดงชื่ออู่และข้อมูลรองเบอร์/พื้นที่; เลือกได้อู่เดียว คลิกแล้วปิดรายการและแสดงชื่อที่เลือก ช่องพิมพ์ค้นและเลือกจากรายการ (Combobox) ในโปรเจกต์รองรับลูกศร/Enter เพื่อเลือกและ Esc เพื่อปิดแล้ว",
          "Combobox\n  - จาก ช่องพิมพ์ค้นและเลือกจากรายการ (Combobox): focus เปิดรายการ; blur/คลิกนอกช่องปิดรายการและคืนชื่อรายการที่เลือกไว้ ถ้าพิมพ์แต่ไม่เลือกจะไม่ถือว่ามีอู่ใหม่; ลบข้อความจนว่างล้างค่าที่เลือก",
          "Buttons\n  - ↑/↓ เลื่อนตัวเลือก, Enter เลือกและปิด, Esc ปิดรายการโดยไม่เปลี่ยนอู่; ปุ่มเลือกในรายการตัวเลือก ป้องกัน blur ก่อนเลือก เพื่อไม่ให้คลิกแล้วค่าหาย"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "พิมพ์ชื่ออู่แล้วคลิกนอกโดยไม่เลือก: คืนอู่ที่เลือกเดิม ไม่ส่งข้อความค้นเป็นอู่ใหม่",
          "ค้นอู่ไม่สำเร็จกับค้นแล้วไม่มีผล: แสดงต่างกันและให้ลองใหม่; ผลคำค้นเก่าต้องไม่ทับคำที่พิมพ์ล่าสุด\nLoading/ไม่พบอู่/error ของผลค้น: ต้องตกลงข้อความและจำนวนตัวอักษรเริ่มค้น ไม่เพิ่มค่า 3 ตัวอักษรเอง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: เริ่มค้นเมื่อพิมพ์กี่ตัว, ไม่พบอู่แสดงอะไร"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / E.4 · S4 — เลือกอู่ (พิมพ์ค้น)"
      ]
    }
  },
  "E.5": {
    "title": "AC E.5 — เลือกรถ (พิมพ์ค้นแล้วเลือกจาก dropdown)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้าง PO ภายใต้แผนและตรวจรายละเอียด PO — เลือกรถ (พิมพ์ค้นแล้วเลือกจาก dropdown)",
          "Who: กบค. ใช้จัดการ PO; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลแผน PO และรถในขอบเขตของตน",
          "Do: พิมพ์ค้นหาและเลือกรถที่จะเพิ่มใน PO"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีจอเลือกรถหลายเวอร์ชัน ทั้ง chip และสองฝั่ง จึงไม่ถือว่ารหัสเท่ากันแปลว่าใช้รูปแบบเดียวกัน"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "CHANGE — ต้องเลือก component เลือกรถให้ตรงแบบล่าสุดที่ตกลง ไม่ผสม chip ของ E.5 กับสองฝั่งของ F.2 เป็นข้อกำหนดเดียวกันโดยอัตโนมัติ",
          "NEW — เพิ่ม behavior เลือก/เอาออก: ไม่เพิ่มรถซ้ำ กด × ลบเฉพาะคันนั้นและปรับสถานะเลือกในผลค้นโดย form ยังอยู่"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - พิมพ์ทะเบียนหรือคำค้นแล้วแสดงรถที่ตรงเงื่อนไข\n  - เลือกรถซ้ำต้องไม่เพิ่มรายการซ้ำ\n  - กดกากบาทบนป้ายรถให้เอาคันนั้นออก และสามารถเลือกกลับมาได้\n  - ถ้าค้นแล้วไม่พบ/โหลดผิดพลาด ต้องแสดงข้อความแยกกัน\n  - เลือกรถ รายการนั้นมีเครื่องหมาย ✓ และเพิ่มเป็นชิป \"70-1123 ชลบุรี ×\" ใต้ช่อง เลือกได้หลายคัน\n  - กด × บนชิป เอารถคันนั้นออก\n  - ตัวกรองเพิ่ม: หน่วยงาน/เขต และ ประเภทรถ (รายการรถทั้งประเทศยาวมาก) [Sheet พี่นุ — 4 เพิ่ม-แก้ไข PO, ✅ CF]\n  - ช่องพิมพ์ค้นหา รถ: แยกคำค้นจากรายการรถที่เลือกไว้ และไม่ให้ผลคำเก่ามาทับคำใหม่",
          "Vehicle Selection\n  - คลิกรถหนึ่งคันแล้วเพิ่มเป็นป้ายรายการที่เลือก พร้อมเครื่องหมายถูกในรายการ\n  - รายการเลือกรถแสดง: ทะเบียน, เลขไมล์, อายุการใช้งาน, หน่วยงานเจ้าของรถ (ช่วยเลือกให้ตรงกับที่อนุมัติหลักการไว้) [Sheet พี่นุ — 4 เพิ่ม-แก้ไข PO, ✅ CF]\n  - รูปแบบเลือกแบบ ป้ายรายการที่เลือก กับรายการสองฝั่งใน Sheet/F.2 ยังขัดกัน จึงไม่สร้างตัวกรองที่ยังไม่มีใน mock เป็นข้อยืนยัน\n  - มุม Dev สำหรับ ป้ายรายการที่เลือก ยังยึด AC E.5: กด × เอารถออกแต่ form PO ยังค้าง ไม่ใช่ปิดทั้งหน้า; component รายการเลือกรถสองฝั่ง “รายการรถทั้งหมด”/“เลือกแล้ว” (DualList) ที่มีในโปรเจกต์เป็นสองฝั่ง จึงใช้แทน ป้ายรายการที่เลือก โดยไม่เคาะรูปแบบไม่ได้",
          "Select Field\n  - พิมพ์ในช่องเลือกรถ (เช่น \"7\") dropdown แสดงรถที่ตรง เช่น \"70-1123 ชลบุรี\", \"82-0457 สระบุรี\", \"71-9902 ขอนแก่น\", \"72-6648 สงขลา\"\n  - ช่องเลือกจากรายการ รถ: แสดงเครื่องหมายเลือกของคันที่อยู่ในรายการแล้ว; เลือกหลายคันได้โดยไม่เพิ่มคันเดิมซ้ำ",
          "Search Input (SearchInput)\n  - ค้นหา: ทะเบียน, รุ่น/ยี่ห้อ placeholder \"ค้นหาทะเบียน, รุ่น/ยี่ห้อ\" [Sheet พี่นุ — 4 เพิ่ม-แก้ไข PO, ✅ CF]",
          "Table (DataTable)\n  - Sorting\n    - Sorting (เสนอ ยังไม่ CF): อายุการใช้งาน เก่าสุดก่อน [Sheet พี่นุ — 4 เพิ่ม-แก้ไข PO, ✅ CF]",
          "Status (StatusBadge)\n  - ป้ายสถานะ/รายการที่เลือก ทะเบียนและปุ่ม ×: ลบเฉพาะคันนั้น และเอาเครื่องหมายเลือกในรายการตัวเลือก ออกพร้อมกัน"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เลือกรถคันเดิมซ้ำหรือกดเพิ่มเร็วหลายครั้ง: เก็บ ID คันนั้นเพียงครั้งเดียว ไม่เพิ่มจำนวนรถซ้ำ",
          "รถที่เลือกใช้ไม่ได้แล้วก่อนบันทึก: แจ้งคันที่ต้องตรวจ/เลือกใหม่ โดยไม่ล้างอู่ ไฟล์ และรถคันอื่นทั้งหมด"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: รถที่อยู่ใน PO อื่นที่ยังไม่ปิดงานขึ้นให้เลือกไหม (แนะนำไม่ให้เลือก), เกณฑ์รถที่แสดง (ทุกคัน/เฉพาะหน่วยงานในแผน), ค้นด้วยจังหวัดอย่างเดียวได้ไหม",
          "ที่ CF ตรงกับแบบ 2 รายการของ F.2 (มีเลขไมล์/อายุ, ค้นรุ่น/ยี่ห้อ) ไม่ตรงกับชิปใน E.5 (ค้นทะเบียน, จังหวัด ไม่มีข้อมูลรอง) แนะนำใช้แบบ F.2 ทั้งสร้างและแก้ไข และเพิ่มหน่วยงานเจ้าของรถ + ตัวกรองหน่วยงาน/เขต, ประเภทรถ ลง mock"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / E.5 · S4 — เลือกรถ (พิมพ์ค้นแล้วเลือกจาก dropdown)",
        "OH2 / E.5 · S4 — ติ๊กรถแล้วกดเพิ่ม"
      ]
    }
  },
  "E.6": {
    "title": "AC E.6 — กรอกครบ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้าง PO ภายใต้แผนและตรวจรายละเอียด PO — กรอกครบ",
          "Who: กบค. ใช้จัดการ PO; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลแผน PO และรถในขอบเขตของตน",
          "Do: ตรวจข้อมูล PO อู่และรถที่เลือก แล้วบันทึก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มี form PO กรอกครบ แต่ไม่แยกข้อมูลที่พร้อมส่งจากการอัปโหลดที่ยังไม่เสร็จและการกดซ้ำ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดพร้อมบันทึก: ชื่อ/อู่/รถ/ไฟล์ต้องเป็นชุดปัจจุบันที่ผ่าน validation ไม่ถือแค่ชื่อไฟล์บนจอว่าอัปโหลดเสร็จ",
          "NEW — เพิ่ม pending: ปุ่มบันทึกปิดการส่งซ้ำทั้งเมาส์/คีย์บอร์ด และคงข้อมูลที่ส่งไว้ให้ retry หากผิดพลาด"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อเปิด form แสดงค่าปัจจุบันให้ครบ; ช่องที่ยังไม่เลือกต้องว่าง\n  - ระหว่างบันทึกให้รอผลและไม่ให้กดซ้ำ\n  - บันทึกไม่สำเร็จต้องคงข้อมูลที่กรอก; สำเร็จจึงแสดงรายละเอียดใหม่",
          "File Upload (FileUpload)\n  - เปลี่ยนชื่อ PO อู่ รถ หรือไฟล์แล้วตรวจความครบถ้วนก่อนบันทึก\n  - กรอกชื่อ PO เลือกอู่ เลือกรถ (ชิป \"82-0457 สระบุรี\", \"83-2210 นครราชสีมา\") และแนบใบสั่งจ้าง ไฟล์แสดง \"ใบสั่งจ้าง.pdf 195 KB\" ตัวนับเป็น \"1/10 ไฟล์\" ปุ่ม \"บันทึก\" พร้อมกด\n  - ช่องแนบไฟล์ ใบสั่งจ้าง: แสดงชื่อ ขนาด และตัวนับ 1/10 ตามจำนวนไฟล์จริง",
          "Form Fields\n  - ช่องกรอก ชื่อ PO/อู่ และ ป้ายรายการที่เลือก รถ: แสดงค่าที่เลือกครบให้สอดคล้องกับข้อมูลที่จะส่ง",
          "Buttons\n  - ปุ่ม “บันทึก”: ส่งชุดข้อมูลปัจจุบันครั้งเดียว และกันกดซ้ำระหว่างรอผล\n  - จาก ปุ่มบนจอ (Button): เมื่อส่งให้ใช้ loading เพื่อปิดการกดซ้ำทั้งเมาส์/คีย์บอร์ด; ไม่ใช้เพียงเปลี่ยนสี เพราะตัวปุ่มจะ disable จริงเมื่อ loading; หากออกจาก form ขณะมี ข้อมูลที่ยังไม่บันทึก ต้องผ่าน leave guard ของ หน้า form สร้าง/แก้ไข PO (PoForm)"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "บันทึก PO ขณะมีไฟล์แนบที่ยังไม่พร้อม: ไม่ถือว่าพร้อมจากตัวนับอย่างเดียว และให้เห็นไฟล์ที่มีปัญหา",
          "กดบันทึกซ้ำระหว่างรอ: ไม่สร้าง PO หรือรายการรถซ้ำ และคงข้อมูลให้ส่งใหม่ได้เมื่อยืนยันว่าครั้งเดิมล้มเหลว"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / E.6 · S4 — กรอกครบ"
      ]
    }
  },
  "E.7": {
    "title": "AC E.7 — บันทึกไม่สำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้าง PO ภายใต้แผนและตรวจรายละเอียด PO — บันทึกไม่สำเร็จ",
          "Who: กบค. ใช้จัดการ PO; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลแผน PO และรถในขอบเขตของตน",
          "Do: ตรวจข้อผิดพลาดและลองบันทึก PO ใหม่โดยคงข้อมูลเดิม"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีบันทึก PO ล้มเหลว แต่ยังไม่แยกปิด toast ออกจากการออกจาก form หรือรีเซ็ตค่า"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนด error: กด × ปิดเฉพาะ toast form/อู่/chip รถ/ไฟล์ยังครบและไม่เปลี่ยนหน้า",
          "NEW — เพิ่ม retry: พ้น pending แล้วกดส่งใหม่ได้ โดยไม่สร้าง PO ซ้ำจาก request ก่อนหน้า"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อกดบันทึกหรือส่งแล้วผิดพลาด ให้แสดงข้อความแจ้งตามจอ\n  - ข้อความแจ้งผลมุมขวาบน “General Error”: อยู่บน form เดิมเมื่อส่งไม่สำเร็จ",
          "File Upload (FileUpload)\n  - อยู่หน้าเดิม และค่าที่กรอก/ไฟล์ที่เลือกต้องไม่หาย\n  - server ตอบผิดพลาด toast \"General Error\" (ไม่รู้สาเหตุให้แสดง Status Code เช่น \"500 Internal Server Error\") อยู่หน้าเดิม ค่าทุกช่อง ชิปรถ และไฟล์คงอยู่",
          "Status (StatusBadge)\n  - ปลดสถานะกำลังทำ เพื่อให้แก้ไขและกดใหม่ได้ โดยไม่สร้างข้อมูลซ้ำ\n  - \"General Error\" แสดง Status Code เมื่อไม่รู้สาเหตุ [Sheet พี่นุ — OH-Toast #11, ✅ CF]",
          "Form Fields\n  - ช่องกรอก ชื่อ PO, อู่, ป้ายรายการที่เลือก รถ และไฟล์แนบ: คงค่าทั้งหมด ไม่ reset จากการ refetch ที่ล้มเหลว",
          "Buttons\n  - ปุ่ม “บันทึก”: กลับมากด retry ได้หลังพ้น pending",
          "Modal\n  - ข้อความแจ้งผลมุมขวาบน error ไม่ใช่ กล่องโต้ตอบกลางจอ (Modal) จึงไม่สร้างพื้นหลังทึบหรือบังคับให้ปิดก่อนกรอกต่อ; กด × บน toast ปิดเฉพาะข้อความ form PO กับไฟล์เดิมยังอยู่"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ส่ง PO ล้มเหลว: เก็บชื่อ อู่ รถและไฟล์ครบในหน้าเดิม ปิด toast แล้วต้องยังแก้/ลองใหม่ได้",
          "ขาดการเชื่อมต่อหลังส่ง: ตรวจผลคำขอเดิมก่อนสร้างซ้ำ ไม่ถือว่าขึ้น error แปลว่า server ไม่ได้บันทึกแน่นอน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / E.7 · S4 — บันทึกไม่สำเร็จ (toast 11)",
        "OH2 / E.7 · S4 — บันทึกไม่สำเร็จ (toast 11) · toast ขวาบน"
      ]
    }
  },
  "E.8": {
    "title": "AC E.8 — เปิด form จากแผนที่ถูกลบไปแล้ว",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้าง PO ภายใต้แผนและตรวจรายละเอียด PO — เปิด form จากแผนที่ถูกลบไปแล้ว",
          "Who: กบค. ใช้จัดการ PO; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลแผน PO และรถในขอบเขตของตน",
          "Do: รับทราบว่าแผนถูกลบและกลับไปยังรายการ; ไม่บันทึก PO ลงแผนที่ไม่มีอยู่"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีจอเปิด PO จากแผนที่ถูกลบพร้อม toast ไม่พบแผน แต่ยังไม่เคาะการนำทางต่อ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดความปลอดภัยการบันทึก: ไม่ให้สร้าง PO ลงแผนที่ถูกลบแม้ form ยังแสดงด้านหลัง",
          "NEW — เพิ่มจุดตัดสินหลัง toast: ต้องตกลงจะค้าง form พร้อมปิดปุ่มหรือกลับรายการ และใช้กรณีแผนถูกลบระหว่างกรอกอย่างไร ไม่เดาปลายทางจากข้อความ error"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดยกเลิก ปิดหน้าต่างโดยไม่เปลี่ยนข้อมูล\n  - กดยืนยันเพียงครั้งเดียวแล้วรอผล; ถ้าไม่สำเร็จต้องไม่แสดงว่าลบ/แก้ไขแล้ว\n  - form PO ด้านหลัง: ต้องตกลงว่าจะค้างพร้อมปิดปุ่ม หรือพากลับรายการ ไม่ตัดสินใจนำทางเองจาก toast",
          "Buttons\n  - กดปุ่มลบหรือแก้ไขแล้วให้เปิดหน้าต่างยืนยันตามจอ",
          "Empty State (EmptyState)\n  - แผนต้นทางถูกลบไปแล้ว เปิด form เพิ่ม PO ของแผนนั้น toast \"ไม่พบแผน\"\n  - toast \"ไม่พบแผน\" [Sheet พี่นุ — OH-Toast #12, ✅ CF]\n  - ข้อความแจ้งผลมุมขวาบน “ไม่พบแผน”: ผูกกับแผนที่ form อ้างอิงและไม่เปิดให้บันทึกลงแผนที่ลบแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "แผนถูกลบระหว่างเปิด form กับกดบันทึก: ตรวจซ้ำตอนส่งและไม่ยอมสร้าง PO แม้ form ด้านหลังยังอยู่",
          "กด retry หลัง toast ไม่พบแผน: ไม่ส่งสร้างวนซ้ำ ต้องให้กลับไปเลือกแผนที่ใช้งานได้ตามปลายทางที่ตกลง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "เฟรมยังแสดง form อยู่ด้านหลัง toast ต้องเคาะว่าหลัง toast พาไปหน้ารายการแผนหรือไม่ (แนะนำพาไปหน้ารายการ) และกรณีแผนถูกลบระหว่างกรอกแล้วกดบันทึกใช้ toast เดียวกันไหม"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / E.8 · S4 — เปิดฟอร์มจากแผนที่ถูกลบไปแล้ว (toast 12)"
      ]
    }
  },
  "E.9": {
    "title": "AC E.9 — บันทึกสำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้าง PO ภายใต้แผนและตรวจรายละเอียด PO — บันทึกสำเร็จ",
          "Who: กบค. ใช้จัดการ PO; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลแผน PO และรถในขอบเขตของตน",
          "Do: ดูผลสร้าง PO สำเร็จและตรวจข้อมูลที่บันทึก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีสร้าง PO สำเร็จและรายละเอียดแผน แต่ยังไม่แยกความสอดคล้องจำนวนรถ/PO/สถานะหลังโหลดใหม่"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior หลังสร้าง: ตาราง PO หัวจำนวน รถทั้งหมดและสถานะแผนต้องอัปเดตจากผลเดียวกัน ไม่คง 0 คันจากก่อนสร้าง",
          "NEW — เพิ่มข้อกำหนดแหล่งระยะสัญญา: ไม่แสดงค่าจำลองเป็นข้อมูลจริงจนตกลงจุดกรอก/ที่มาของวันเริ่มสิ้นสุด"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ปรับรายการหรือรายละเอียดล่าสุดให้เห็นตรงกับข้อมูลที่บันทึก\n  - ไม่ให้กดยืนยันซ้ำขณะกำลังส่งข้อมูล\n  - บันทึกสำเร็จ กลับหน้ารายละเอียดแผน toast \"การสร้าง purchase order สำเร็จ\"\n  - Permission: ตั้งแต่ PO นี้ หน่วยงานเจ้าของรถและ กรย. เขตของรถเริ่มเห็นแผน (เฉพาะ PO/รถในขอบเขตตัวเอง)\n  - Sheet PEA: ลบ PO จนเหลือ 0 แผนย้อนกลับเป็น \"รอเลข PO\" (ตอบ ⚠️ ใน G.1)\n  - toast \"การสร้าง purchase order สำเร็จ\" แสดงที่หน้ารายละเอียดแผน [Sheet พี่นุ — OH-Toast #7, ✅ CF]\n  - ข้อความแจ้งผลมุมขวาบน สร้าง PO สำเร็จ: แสดงที่รายละเอียดแผนหลังบันทึก",
          "Status (StatusBadge)\n  - เมื่อระบบยืนยันว่าทำสำเร็จ จึงเปลี่ยนหน้า/สถานะและแสดงข้อความสำเร็จ\n  - chip สถานะแผนเปลี่ยนเป็น \"รอดำเนินการ\" และส่วนเปลี่ยนเป็น \"Purchase Order (1)\"\n  - รถทุกคันใน PO สถานะ \"รอนัดหมายเข้าอู่\"\n  - Status: แผน \"รอเลข PO\" → \"รอดำเนินการ\" (status final: \"กำลังดำเนินการ PO\") · รถทุกคันใน PO → \"รอนัดหมายเข้าอู่\"\n  - ป้ายสถานะ/รายการที่เลือก สถานะแผนและจำนวนรถ: อัปเดตตามผลสร้าง PO ไม่คง 0 คันจากหน้าก่อน; ที่มาระยะสัญญายังต้องตกลง",
          "Table (DataTable)\n  - Columns\n    - ตาราง PO คอลัมน์: หมายเลข PO, ศูนย์บริการ/อู่, จำนวนรถ, ความคืบหน้า (แถบ + \"0/2\"), ระยะสัญญา (\"20 ต.ค. 2569 – 20 ม.ค. 2570\" + บรรทัดรอง \"ตามใบสั่งจ้าง\") และicon ดูรายละเอียด\n  - Behavior\n    - ตาราง PO และหัวส่วน Purchase Order: โหลดแถวใหม่พร้อมจำนวนรถ/ความคืบหน้า/ระยะสัญญาตามข้อมูลจริง"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "สร้าง PO สำเร็จแต่โหลดแผนใหม่ล้มเหลว: ให้ลองโหลดแผน ไม่ส่งสร้าง PO ซ้ำ",
          "จำนวนรถ/PO/สถานะโหลดมาคนละช่วง: อย่าแสดงยอด 0 คันค้างข้าง PO ใหม่ ต้อง refresh ข้อมูลที่เกี่ยวข้องให้สอดคล้องกัน"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "\"ระยะสัญญา\" ไม่มีช่องกรอกใน form PO ต้องเคาะว่ามาจากไหน (กรอกเอง/อ่านจากใบสั่งจ้าง) — เกี่ยวกับ Scenario 16 แจ้งเตือนก่อนหมดสัญญา 30 และ 15 วัน",
          "ตาราง PO ใน E.9 ไม่มีคอลัมน์ \"ชื่อ PO\" แต่ F.1/G.1 มี และ F.1 ไม่มี \"ความคืบหน้า\"/\"ระยะสัญญา\" ต้องเลือกชุดคอลัมน์เดียว",
          "\"จำนวนรถที่ Overhaul\" ยัง \"0 คัน\" ทั้งที่ PO มีรถ 2 คัน ต้องนับจากรถใน PO ทั้งหมด (overhauled_car_count)",
          "Sheet ไม่มี notification ตอนรถถูกจัดเข้า PO หน่วยงานเจ้าของรถจะไม่รู้ตัวจนได้นัดหมาย (#13) ต้องเคาะว่าจำเป็นไหม"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / E.9 · S4 — บันทึกสำเร็จ (toast 7)"
      ]
    }
  },
  "E.10": {
    "title": "AC E.10 — รายละเอียด PO",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: สร้าง PO ภายใต้แผนและตรวจรายละเอียด PO — รายละเอียด PO",
          "Who: กบค. ใช้จัดการ PO; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลแผน PO และรถในขอบเขตของตน",
          "Do: ดูข้อมูล PO อู่ รถ และสถานะงาน; เปิดงานรายคันหรือจัดการ PO ตามสิทธิ์และสถานะ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีรายละเอียด PO และตารางรถ แต่ยังไม่ครบ behavior ข้อมูลรองตามสถานะ/ปลายทางยกเลิกลบ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดตารางรายคัน: สถานะและข้อมูลรองต้องเป็นของรถแต่ละคัน กดหน้างานไปแผน/PO/รถชุดเดียวกัน",
          "NEW — เพิ่มทางเข้าลบ/แก้ไข: ยกเลิกกล่องลบกลับรายละเอียด PO เดิม และจำต้นทางนี้เพื่อยกเลิก form แก้ไขได้ถูกหน้า"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อเปิด form แสดงค่าปัจจุบันให้ครบ; ช่องที่ยังไม่เลือกต้องว่าง\n  - ระหว่างบันทึกให้รอผลและไม่ให้กดซ้ำ\n  - บันทึกไม่สำเร็จต้องคงข้อมูลที่กรอก; สำเร็จจึงแสดงรายละเอียดใหม่\n  - ส่วน \"รายละเอียด Purchase Order\": ชื่อแผน, ชื่อ Purchase Order, ศูนย์บริการ/อู่, เบอร์โทรอู่, ที่อยู่\n  - ส่วน \"รายการรถ (2)\": คอลัมน์ ทะเบียน, หน่วยงานเจ้าของรถ, เลขไมล์ (กม.), อายุการใช้งาน, สถานะงาน (chip), รายละเอียดตามสถานะ และปุ่ม › ไปหน้างานรายคัน\n  - หัวหน้า: breadcrumb \"… > แผน {เลขแผน} > {เลข PO}\" ปุ่ม แก้ไข / ลบ PO (เฉพาะ กบค.) [Sheet พี่นุ — 3 รายละเอียด PO, ✅ CF]\n  - Toast: แก้ไข PO → \"บันทึกการแก้ไข PO สำเร็จ\" (#8) · ลบ PO → กลับหน้ารายละเอียดแผน (#9) [Sheet พี่นุ — 3 รายละเอียด PO, ✅ CF]\n  - จาก หน้ารายละเอียด PO (PoDetail): กด “ลบ PO” เปิด G.1 บนหน้าเดิม; ยกเลิกกล่อง → กลับรายละเอียด PO นี้; กด “แก้ไข” → เปิด F.2 โดยจำว่ามาจากรายละเอียด PO เพื่อให้ยกเลิกกลับถูกหน้า",
          "File Upload (FileUpload)\n  - เปลี่ยนชื่อ PO อู่ รถ หรือไฟล์แล้วตรวจความครบถ้วนก่อนบันทึก\n  - ส่วน \"เอกสาร\": ใบสั่งจ้าง (เช่น \"ใบสั่งจ้าง-PO-690101.pdf 10 MB\")\n  - รายการเอกสาร: ตรวจสิทธิ์เข้าถึงไฟล์ ไม่อาศัยเพียงซ่อนปุ่มบนหน้า",
          "Buttons\n  - กดดูรายละเอียด PO breadcrumb \"จัดการงาน Overhaul > แผน {เลข} > {เลข PO}\" หัวข้อ \"หมายเลข {เลข PO}\" ปุ่ม \"ลบ PO\" (กรอบแดง) / \"แก้ไข\"\n  - ปุ่ม ›/หน้างาน: เปิดรถที่กดพร้อมแผนและ PO ถูกชุด\n  - ปุ่ม “แก้ไข”: เปิด form แก้ไข PO F.2 โดยตรวจสิทธิ์ก่อน\n  - ปุ่ม “ลบ PO”: เปิดกล่องยืนยันลบ PO G.1 โดยตรวจสิทธิ์ก่อน",
          "Status (StatusBadge)\n  - ตัวอย่าง \"รายละเอียดตามสถานะ\": กำลังซ่อม → \"อยู่อู่ 12 วัน / รับรถ 9 ต.ค. 2569\" · รอหน่วยงานตอบรับนัดเข้าอู่ → \"นัดเข้าอู่ 22 – 24 ต.ค. 2569 / รอหน่วยงานตอบรับ\"\n  - SubText ใต้สถานะงาน (🤔 ลูกค้าเสนอ): วันนัดถัดไป (ช่วงนัดเข้าอู่/นัดรับรถที่ยืนยัน หรือ \"รอตอบรับ\"), จำนวนวันที่อยู่อู่ (นับจากวันยืนยันรับรถ), ประกันหลัง Overhaul ถึงวันที่ (หลังปิดงาน) ถ้าทำ SubText ไม่ได้ให้แยกเป็น 3 คอลัมน์ [Sheet พี่นุ — 3 รายละเอียด PO, ✅ CF]",
          "Table (DataTable)\n  - Behavior\n    - ตารางรถ: ทะเบียน, ยี่ห้อ/รุ่น · ประเภท, หน่วยงานเจ้าของรถ, เลขไมล์ (กม. ชิดขวา), อายุการใช้งาน (ปี), สถานะงาน (ป้าย 11 สถานะ), ปุ่ม \"หน้างาน\" เป็น ICON Action [Sheet พี่นุ — 3 รายละเอียด PO, ✅ CF]\n    - ตารางรถ: แต่ละแถวแสดง ป้ายรายการที่เลือก และข้อมูลรองตามสถานะของรถคันนั้น; ไม่ใช้ข้อความสถานะร่วมกันทั้งตาราง\n  - Sorting\n    - ค้นหาทะเบียน, ตัวกรองสถานะงาน, sort สถานะงาน/วันนัดถัดไป: เสนอ รอ confirm [Sheet พี่นุ — 3 รายละเอียด PO, ✅ CF]"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "กบค. เห็นทุกคัน [Sheet พี่นุ — 3 รายละเอียด PO, ✅ CF]",
          "กรย. เห็นเฉพาะคันในเขต [Sheet พี่นุ — 3 รายละเอียด PO, ✅ CF]",
          "หน่วยงานเจ้าของรถเห็นหัว PO (เลข PO [Sheet พี่นุ — 3 รายละเอียด PO, ✅ CF]",
          "ชื่อ PO [Sheet พี่นุ — 3 รายละเอียด PO, ✅ CF]",
          "อู่) + เฉพาะคันตัวเอง [Sheet พี่นุ — 3 รายละเอียด PO, ✅ CF]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "กดหน้างานของรถที่ถูกนำออกจาก PO ไปแล้ว: แจ้งว่าเปิดไม่ได้และโหลดรายการรถใหม่ ไม่เปิดรถคนละคันแทน",
          "โหลดเอกสารหรือตารางรถไม่สำเร็จ: แจ้งเฉพาะส่วน ไม่แสดงว่า PO ไม่มีรถ/เอกสารจริง และไม่เอารถจาก PO ก่อนหน้ามาค้าง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องตกลงข้อความ “รายละเอียดตามสถานะ” ให้ครบแต่ละสถานะของรถ: รอนัดหมายเข้าอู่, รอหน่วยงานตอบรับนัดเข้าอู่, หน่วยงานปฏิเสธนัดเข้าอู่, รอตรวจรับรถ, กำลังซ่อม, รอตรวจสภาพ Safety, รอนัดหมายรับรถ, รอหน่วยงานตอบรับนัดหมายรับรถ, หน่วยงานปฏิเสธนัดหมายรับรถ, รอปิดงาน และปิดงานแล้ว; ต้นฉบับมีตัวอย่างข้อความเพียง 2 สถานะ รายการนี้ใช้ชื่อที่แสดงใน mock โดยชื่อที่ต่างจาก status final ใน Sheet ยังต้องตกลง",
          "หมายเลข PO ใน mock เป็น \"PO-690101\" ไม่ตรงกับ format จริง {overhaul_code}-{seq} เช่น ORZ6900001-01 และไม่แสดงเอกสาร \"อื่นๆ\" ในหน้านี้",
          "\"ประกันหลัง Overhaul ถึงวันที่\" ไม่มีช่องกรอกในเฟรมไหนเลย (M, O ไม่มี) ต้องเคาะว่ากรอกที่ขั้นไหน",
          "ตารางรถที่ CF ไม่ตรงกับทั้ง E.10 (ไม่มียี่ห้อ/รุ่น) และ F.4 (ไม่มีหน่วยงานเจ้าของรถ) ต้องแก้ mock ให้ใช้ชุดนี้"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / E.10 · S4 — รายละเอียด PO"
      ]
    }
  },
  "F.1": {
    "title": "AC F.1 — เมนู \"…\" ของ PO → แก้ไข",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขข้อมูล PO — เมนู \"…\" ของ PO → แก้ไข",
          "Who: กบค. ใช้แก้ไขและยืนยันข้อมูล PO",
          "Do: เปิดเมนูของ PO และเลือกแก้ไข"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีเมนูแก้ไข PO แต่ไม่ได้แยกการปิดเมนูกับการจำทางเข้า form เป็น behavior ทุก action"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มเมนู “…” (RowMenu): คลิกนอก/Esc ปิดแล้วคงรายละเอียดแผน; เลือกแก้ไขจึงเปิด F.2 ของ PO แถวนั้น",
          "NEW — เพิ่มต้นทาง form เป็นรายละเอียดแผน เพื่อให้กดยกเลิกจาก F.2 ไม่ไปหน้า PO ผิดทางเข้า"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อเปิด form แสดงค่าปัจจุบันให้ครบ; ช่องที่ยังไม่เลือกต้องว่าง\n  - ระหว่างบันทึกให้รอผลและไม่ให้กดซ้ำ\n  - บันทึกไม่สำเร็จต้องคงข้อมูลที่กรอก; สำเร็จจึงแสดงรายละเอียดใหม่\n  - เลือก \"แก้ไข\" ไป form แก้ไข PO (F.2)\n  - เมนู “…” ในตาราง PO: จับ PO ของแถวที่กด\n  - รายการ “แก้ไข”: เปิด F.2 พร้อมข้อมูล PO เป้าหมาย; role ที่ดูอย่างเดียวไม่มี action แก้ไข/ลบ",
          "File Upload (FileUpload)\n  - เปลี่ยนชื่อ PO อู่ รถ หรือไฟล์แล้วตรวจความครบถ้วนก่อนบันทึก",
          "Table (DataTable)\n  - Row Actions (RowMenu)\n    - แผนมี PO (ตัวอย่าง \"Purchase Order (3)\") กด \"…\" ท้ายแถว PO เมนู \"ดูรายละเอียด\" / \"แก้ไข\" / \"ลบ\"\n    - ลูกค้าขอจัดการเป็น ICON Action [Sheet พี่นุ]\n      \n      ตาราง PO ให้ใช้คอลัมน์ชุดที่ CF ใน B.7 [Sheet พี่นุ]\n    - เมนู “…” ท้ายแถวรายการ (RowMenu): คลิกนอก/Esc ปิดเมนูแล้วอยู่หน้ารายละเอียดแผน (PlanDetail); กดแก้ไข → เปิด F.2 โดยเก็บต้นทางเป็นหน้ารายละเอียดแผน (PlanDetail)\n  - Columns\n    - ตาราง PO ในเฟรมนี้มีคอลัมน์ หมายเลข PO, ชื่อ PO, ศูนย์บริการ/อู่, จำนวนรถ"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "เมนูแก้ไข/ลบ PO เฉพาะ กบค. role อื่นเห็นแค่ \"ดูรายละเอียด\" [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "PO ถูกลบหรือรายการเรียงใหม่หลังเปิดเมนูแก้ไข: อ้าง ID เดิมและตรวจว่ายังเปิดได้ก่อนนำทาง",
          "คลิกนอก/Esc ปิดเมนู: ไม่ควรมีการเปิด form แก้ไขตามหลังจาก event ที่ยังค้าง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "chip สถานะแผนในเฟรมนี้คือ \"ดำเนินการ\" ไม่ใช่ \"รอดำเนินการ\" และจำนวนรถแถวแรกแสดง \"2/10\" ขณะที่ G.1 แสดง \"2\" ต้องเคาะว่าคอลัมน์นี้แสดงอะไร"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / F.1 · S5 — เมนู \"…\" ของ PO → แก้ไข"
      ]
    }
  },
  "F.2": {
    "title": "AC F.2 — form แก้ไข PO",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขข้อมูล PO — form แก้ไข PO",
          "Who: กบค. ใช้แก้ไขและยืนยันข้อมูล PO",
          "Do: ปรับข้อมูล PO แล้วบันทึกหรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีรายการรถสองฝั่งและยกเลิกกลับทางเดิม แต่ไม่แยกการติ๊ก/ค้น/ย้ายและการทิ้ง ข้อมูลที่ยังไม่บันทึก ทุกทาง"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior สองฝั่ง (DualList): ค้นเปลี่ยนฝั่งซ้ายแต่ไม่ล้างรถเลือกแล้ว เลือกทั้งหมดจำกัดตามรายการที่แสดง และย้ายแล้วล้างการติ๊กฝั่งที่ย้าย",
          "NEW — เพิ่ม behavior ยกเลิก: ไม่เปลี่ยนค่าให้กลับต้นทางทันที มี ข้อมูลที่ยังไม่บันทึก เปิดยืนยันออก; ปิดกล่องคง ข้อมูลที่ยังไม่บันทึก ยืนยันแล้วกลับ PO/แผนตามทางเข้า"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อเปิด form แสดงค่าปัจจุบันให้ครบ; ช่องที่ยังไม่เลือกต้องว่าง\n  - ระหว่างบันทึกให้รอผลและไม่ให้กดซ้ำ\n  - บันทึกไม่สำเร็จต้องคงข้อมูลที่กรอก; สำเร็จจึงแสดงรายละเอียดใหม่\n  - ส่วน \"เลือกรถ\" เป็นแบบ 2 รายการ: ช่อง \"ค้นหารถ\" placeholder \"ค้นหาทะเบียน, รุ่น/ยี่ห้อ\" · ซ้าย \"รายการรถทั้งหมด\" + จำนวน · ขวา \"เลือกแล้ว\" + จำนวน · ตรงกลางปุ่ม \"เพิ่ม\" / \"นำออก\"",
          "File Upload (FileUpload)\n  - เปลี่ยนชื่อ PO อู่ รถ หรือไฟล์แล้วตรวจความครบถ้วนก่อนบันทึก\n  - ชื่อ PO, อู่ และใบสั่งจ้างเติมค่าเดิม (ตัวนับ \"1/10 ไฟล์\")",
          "Buttons\n  - ติ๊กรถฝั่งซ้ายแล้วกด \"เพิ่ม\" ย้ายไปฝั่ง \"เลือกแล้ว\" · ติ๊กฝั่งขวาแล้วกด \"นำออก\" ย้ายกลับ ปุ่มจะ enable เมื่อมีรถถูกติ๊ก\n  - ปุ่มล่าง \"ยกเลิก\" / \"บันทึก\"\n  - ปุ่ม “เพิ่ม”/“นำออก”: enable เมื่อฝั่งนั้นมีรายการติ๊ก ย้ายตาม ID และอัปเดตจำนวนทั้งสองฝั่ง ไม่ให้รถซ้ำ",
          "Checkbox\n  - แต่ละแถวรถมี checkbox ทะเบียน และบรรทัดรอง \"ยี่ห้อรุ่น · ประเภท เลขไมล์ {x} กม. · อายุ {y} ปี\" เช่น \"ISUZU FVM · รถกระเช้า เลขไมล์ 210,050 กม. · อายุ 14 ปี\" หัวรายการมี checkbox เลือกทั้งหมด\n  - checkbox รายแถว/เลือกทั้งหมด: เก็บสถานะติ๊กแยกสองฝั่ง; ต้องตกลงเลือกทั้งหมดเฉพาะผลค้นหรือทุกรายการ",
          "Table (DataTable)\n  - Columns\n    - breadcrumb \"แก้ไข {เลข PO}\" · รายการเลือกรถ คอลัมน์ ค้นหา และตัวกรองชุดเดียวกับ E.5 (ทะเบียน, เลขไมล์, อายุ, หน่วยงานเจ้าของรถ · ค้น ทะเบียน, รุ่น/ยี่ห้อ · กรอง หน่วยงาน/เขต, ประเภทรถ) [Sheet พี่นุ — 4 เพิ่ม-แก้ไข PO, ✅ CF]",
          "Search Input (SearchInput)\n  - ช่องค้นหาเหนือรายการ (SearchInput)รถ: เปลี่ยนผลรายการฝั่งซ้าย โดยไม่ล้างรถฝั่ง “เลือกแล้ว”",
          "Form Fields\n  - ช่องกรอก ชื่อ PO/อู่และ upload: เติมค่าที่บันทึกเดิม; “ยกเลิก”/“บันทึก” จัดการ ข้อมูลที่ยังไม่บันทึก และเปิดยืนยันตาม flow",
          "Navigation\n  - จาก หน้า form สร้าง/แก้ไข PO (PoForm): “ยกเลิก” ถ้าไม่มีการเปลี่ยนค่า → กลับต้นทาง (มาจากตาราง PO กลับรายละเอียดแผน; มาจากรายละเอียด PO กลับ PO เดิม); ถ้ามี ข้อมูลที่ยังไม่บันทึก → เปิดยืนยันการออก ไม่ทิ้งค่าทันที",
          "Modal\n  - กล่องยืนยันการออก: “ปิด”/×/Esc/พื้นหลัง → กลับ F.2 พร้อม ข้อมูลที่ยังไม่บันทึก; “ยืนยัน” → ทิ้ง ข้อมูลที่ยังไม่บันทึก แล้วไปต้นทางที่จำไว้",
          "Vehicle Selection\n  - จาก รายการเลือกรถสองฝั่ง “รายการรถทั้งหมด”/“เลือกแล้ว” (DualList): checkbox เลือกทั้งหมดเลือกเฉพาะรายการในกล่อง/ผลค้นที่แสดง; กดเพิ่ม/นำออกแล้วล้างการติ๊กของฝั่งที่ย้าย แต่คงรถที่เลือกและคำค้นของอีกฝั่ง"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ค้นรถฝั่งซ้ายแล้วกดเลือกทั้งหมด: เลือกตามขอบเขตที่ตกลง ไม่เพิ่มรถที่ถูกเลือกฝั่งขวาซ้ำ",
          "อีกคนแก้ PO/รถเริ่มขั้นถัดไปก่อนบันทึก: ตรวจล่าสุดและแจ้งรายการที่แก้ต่อไม่ได้ ไม่ล้าง ข้อมูลที่ยังไม่บันทึก ทั้ง form หรือทับการแก้อื่นเงียบ ๆ"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "form สร้าง (E.5) เลือกรถแบบชิป ค้น \"ทะเบียน, จังหวัด\" แต่ form แก้ไขเป็นแบบ 2 รายการ ค้น \"ทะเบียน, รุ่น/ยี่ห้อ\" ต้องใช้แบบเดียวกันทั้งสร้างและแก้ไข",
          "ช่องชื่อ PO ใน mock ว่าง ทั้งที่ต้อง prefill \"ซ่อมระบบเครื่องยนต์\" และตัวเลข \"รายการรถทั้งหมด 6\" แต่แสดง 5 คัน",
          "ต้องเคาะ: นำรถที่งานเริ่มแล้ว (เกินขั้น 01) ออกจาก PO ได้ไหม, เปลี่ยนอู่ได้ไหมเมื่อมีนัดหมายแล้ว (ข้อมูลอู่ถูกใช้ใน H/N), กด \"ยกเลิก\" หลังแก้ไขใช้ modal ยืนยันการออกเหมือน C.3 ไหม",
          "mock F.2 ยังไม่มี \"หน่วยงานเจ้าของรถ\" ในแต่ละแถว และไม่มีตัวกรอง หน่วยงาน/เขต, ประเภทรถ"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / F.2 · S5 — ฟอร์มแก้ไข PO"
      ]
    }
  },
  "F.3": {
    "title": "AC F.3 — ยืนยันการแก้ไข PO",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขข้อมูล PO — ยืนยันการแก้ไข PO",
          "Who: กบค. ใช้แก้ไขและยืนยันข้อมูล PO",
          "Do: ตรวจ PO ที่แก้ไข ยืนยันบันทึก หรือกลับไปแก้ไข"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มียืนยันแก้ PO แต่ไม่ได้แยกผลยกเลิกทุกทางและปลายทางสำเร็จที่ต่างจาก prototype ล่าสุด"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ยกเลิก/×/Esc/พื้นหลัง: กลับ F.2 พร้อมชื่อ อู่ รถ ไฟล์ที่แก้ ไม่ทิ้ง ข้อมูลที่ยังไม่บันทึก และยังไม่บันทึก",
          "CHANGE — ปลายทางสำเร็จต้องตรง AC F.4 ที่ไป PO; prototype บางทางกลับตามต้นทาง ต้องเคาะและปรับไม่ยก callback เก่ามาเป็นข้อยืนยัน"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดยกเลิก ปิดหน้าต่างโดยไม่เปลี่ยนข้อมูล\n  - กดยืนยันเพียงครั้งเดียวแล้วรอผล; ถ้าไม่สำเร็จต้องไม่แสดงว่าลบ/แก้ไขแล้ว\n  - ปลายทางหลังบันทึกใน prototype กลับตามต้นทาง แต่ AC ล่าสุดระบุไปหน้ารายละเอียด PO (PoDetail) F.4 จึงต้องยึด AC/เคาะจุดต่างก่อน ไม่สรุปว่าตาม component แล้วเส้นทางถูกเสมอ",
          "Buttons\n  - กดปุ่มลบหรือแก้ไขแล้วให้เปิดหน้าต่างยืนยันตามจอ\n  - ปุ่ม “ยกเลิก”: ปิดกล่องแล้วกลับ form แก้ไข PO F.2 พร้อมค่าที่แก้\n  - ปุ่ม “ยืนยัน”: ส่งการแก้ไขเพียงครั้งเดียว; สำเร็จไปหน้ารายละเอียด PO F.4 และคงข้อมูลที่แก้หากผิดพลาด",
          "Modal\n  - กด \"บันทึก\" modal \"ยืนยันการแก้ไข\" ข้อความ \"เมื่อยืนยันการแก้ไขแล้วจะไม่สามารถย้อนกลับได้ โปรดตรวจสอบก่อนยืนยัน\" ปุ่ม \"ยกเลิก\" / \"ยืนยัน\"\n  - กล่องโต้ตอบกลางจอ (Modal) “ยืนยันการแก้ไข”: แสดงก่อนส่งการแก้ PO\n  - จาก กล่อง “ยืนยันการแก้ไข” (ConfirmDialog) ของ หน้า form สร้าง/แก้ไข PO (PoForm): “ยกเลิก”, ×, Esc หรือคลิกพื้นหลัง → ปิดเฉพาะกล่องแล้วกลับ F.2 พร้อมชื่อ PO อู่ รถ และไฟล์ที่แก้; “ยืนยัน” จึงส่งบันทึก"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "กดยืนยันแก้ PO ซ้ำ: ส่งครั้งเดียวและคงรายการรถ/ไฟล์ที่จะบันทึกชุดเดิมระหว่างรอ",
          "บันทึกไม่สำเร็จ: กลับหรือคง form พร้อม ข้อมูลที่ยังไม่บันทึก ไม่พาไป F.4 ให้ดูเหมือนแก้สำเร็จ"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / F.3 · S5 — ยืนยันการแก้ไข PO"
      ]
    }
  },
  "F.4": {
    "title": "AC F.4 — บันทึกสำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขข้อมูล PO — บันทึกสำเร็จ",
          "Who: กบค. ใช้แก้ไขและยืนยันข้อมูล PO",
          "Do: ดูผลบันทึกสำเร็จและรายละเอียด PO ที่อัปเดต"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีผลแก้ PO สำเร็จ แต่ยังไม่แยกการคงสถานะรถเดิมจากการเริ่มสถานะรถใหม่หลังแก้"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior โหลดใหม่: จำนวนรถ/แถว/ข้อมูล PO ต้องตรงผลบันทึก รถที่เพิ่มเริ่มรอนัดเข้าอู่ รถเดิมคงสถานะ ไม่ reset ทุกคัน",
          "NEW — เพิ่ม toast แก้สำเร็จครั้งเดียวหลังบันทึก ไม่ยิงใหม่เมื่อกลับมาอ่านรายละเอียด"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ปรับรายการหรือรายละเอียดล่าสุดให้เห็นตรงกับข้อมูลที่บันทึก\n  - ไม่ให้กดยืนยันซ้ำขณะกำลังส่งข้อมูล\n  - ยืนยันสำเร็จ ไปหน้ารายละเอียด PO แสดงค่าใหม่ \"รายการรถ ({จำนวน})\" อัปเดต\n  - ข้อความแจ้งผลมุมขวาบน สำเร็จ: ใช้ข้อความที่ Sheet ยืนยัน ไม่ยิงซ้ำจากการโหลดรายละเอียดใหม่",
          "Status (StatusBadge)\n  - เมื่อระบบยืนยันว่าทำสำเร็จ จึงเปลี่ยนหน้า/สถานะและแสดงข้อความสำเร็จ\n  - รถที่เพิ่มเข้ามาใหม่เริ่มสถานะ \"รอนัดหมายเข้าอู่\" รถเดิมสถานะไม่เปลี่ยน\n  - toast \"บันทึกการแก้ไข PO สำเร็จ\" (ปิด ⚠️ toast ที่ขาดด้านบน) · Status แผนคงเดิม · ไม่มี notification [Sheet พี่นุ — OH-Toast #8, ✅ CF]\n  - ป้ายสถานะ/รายการที่เลือก สถานะรายคัน: รถใหม่เริ่มรอนัดหมายเข้าอู่ ส่วนรถเดิมคงสถานะเดิม ไม่ reset ทั้งตาราง",
          "Table (DataTable)\n  - Columns\n    - ตารางรถในเฟรมนี้มีคอลัมน์ ทะเบียน, ยี่ห้อ/รุ่น · ประเภท, เลขไมล์ (กม.), อายุการใช้งาน, สถานะงาน\n  - Behavior\n    - ตารางรถในรายละเอียด PO: โหลดค่าหลังแก้และจำนวนในหัวรายการให้ตรงกัน"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "แก้ PO สำเร็จแต่โหลดรถใหม่ล้มเหลว: ให้ลองโหลดข้อมูล ไม่ส่งบันทึกแก้ซ้ำ",
          "เพิ่มรถใหม่แล้ว: รถเดิมต้องไม่ถูก reset สถานะตามรถใหม่ และจำนวนรถในหัวส่วนต้องตรงรายการจริง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "เฟรม F.4 ไม่มี toast ต้องเคาะข้อความ (แนะนำ \"บันทึกการแก้ไข PO สำเร็จ\" ให้ตรงกับ C.5)",
          "คอลัมน์ตารางรถใน F.4 ไม่ตรงกับ E.10 (E.10 มี \"หน่วยงานเจ้าของรถ\" และ \"รายละเอียดตามสถานะ\") ต้องเลือกชุดเดียว",
          "รถที่เพิ่มเข้า PO ระหว่างแก้ไข ไม่มี notification ถึงหน่วยงานเจ้าของรถ (เหมือน E.9)"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / F.4 · S5 — บันทึกสำเร็จ"
      ]
    }
  },
  "G.1": {
    "title": "AC G.1 — ยืนยันการลบ PO",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ลบ PO ออกจากแผน — ยืนยันการลบ PO",
          "Who: กบค. ใช้ตรวจสอบและยืนยัน PO ที่จะลบ",
          "Do: ตรวจ PO ที่จะลบ ยืนยันลบ หรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มียืนยันลบ PO และปิดด้วยยกเลิก แต่ยังไม่ครบพื้นหลัง/Esc และการกลับตามหน้าที่เปิดกล่อง"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ยกเลิก/×/Esc/พื้นหลัง: กลับรายละเอียดแผนหรือ PO ที่เปิดกล่อง คง PO/รถเดิม ไม่ลบจากการปิด modal",
          "NEW — เพิ่ม behavior ยืนยัน: ลบครั้งเดียวแล้วไป G.2 เมื่อสำเร็จ; เงื่อนไข PO ที่รถเริ่มงานแล้วต้องตกลงก่อนเปิดให้ยืนยัน"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดยกเลิก ปิดหน้าต่างโดยไม่เปลี่ยนข้อมูล\n  - กดยืนยันเพียงครั้งเดียวแล้วรอผล; ถ้าไม่สำเร็จต้องไม่แสดงว่าลบ/แก้ไขแล้ว\n  - ลบเป็น Soft Delete (#10) ไม่มีเคสลบไม่สำเร็จ [Sheet พี่นุ]\n  - กด “ยืนยัน” ลบสำเร็จ → ไปหน้ารายละเอียดแผน (PlanDetail) G.2; ไม่ใช้การปิดกล่องเป็นหลักฐานว่าลบสำเร็จ",
          "Buttons\n  - กดปุ่มลบหรือแก้ไขแล้วให้เปิดหน้าต่างยืนยันตามจอ\n  - ปุ่ม “ยกเลิก”: ปิดโดยไม่เปลี่ยนตาราง; “ยืนยัน” สีแดง: กันกดซ้ำและทำ Soft Delete",
          "Modal\n  - เลือก \"ลบ\" จากเมนู PO modal \"ยืนยันการลบ\" ข้อความ \"เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่\" ปุ่ม \"ยกเลิก\" / \"ยืนยัน\" (สีแดง)\n  - \"ยกเลิก\" ปิด modal ไม่มีอะไรเปลี่ยน\n  - กล่องโต้ตอบกลางจอ (Modal) “ยืนยันการลบ”: จับ PO เป้าหมายจาก action ที่เปิดกล่องไว้\n  - ข้อความ กล่องโต้ตอบกลางจอ (Modal) ยังไม่มีเลข PO/จำนวนรถ การเพิ่มข้อความเหล่านี้ต้องตกลงก่อน ไม่เติมเป็นคำยืนยันจากจอ\n  - จาก กล่อง “ยืนยันการลบ” (ConfirmDialog) ใน หน้ารายละเอียดแผน (PlanDetail)/หน้ารายละเอียด PO (PoDetail): “ยกเลิก”, ×, Esc หรือคลิกพื้นหลัง → ปิด กล่องโต้ตอบกลางจอ (Modal) และกลับหน้าที่เปิดกล่อง (รายละเอียดแผนหรือรายละเอียด PO) โดย PO/รถยังอยู่; กดในเนื้อกล่องไม่ปิด"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "ลบ PO เฉพาะ กบค. [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "PO หรือรถใต้ PO เปลี่ยนสถานะหลังเปิดกล่อง: ตรวจเงื่อนไขลบล่าสุดก่อนยืนยัน ไม่ลบจากภาพข้อมูลเก่า",
          "กดยืนยันซ้ำหรือ PO ถูกลบไปก่อนแล้ว: ไม่แจ้งลบใหม่สำเร็จซ้ำ; ยกเลิกต้องคง PO ไว้จนมีผลลบจริง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "modal ไม่ระบุเลข PO และจำนวนรถที่งานจะหายไปด้วย แนะนำให้เพิ่ม",
          "ต้องเคาะ: ลบ PO ที่มีรถเกินขั้น 01 แล้วได้ไหม (แนะนำไม่ได้), ลบ PO ใบสุดท้ายแล้วสถานะแผนย้อนกลับเป็น \"รอเลข PO\" ไหม, ลบจากหน้ารายละเอียด PO (E.10) แล้วกลับไปไหน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / G.1 · S6 — ยืนยันการลบ PO"
      ]
    }
  },
  "G.2": {
    "title": "AC G.2 — ลบสำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ลบ PO ออกจากแผน — ลบสำเร็จ",
          "Who: กบค. ใช้ตรวจสอบและยืนยัน PO ที่จะลบ",
          "Do: ดูผลลบสำเร็จและรายการ PO ที่อัปเดต"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มี PO หายจากตารางหลังลบ แต่ยังไม่แยกผลเมื่อเหลือ PO ศูนย์กับสิทธิ์มองเห็นแผน"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดโหลดผลลบ: จำนวน PO/รถ/ความคืบหน้าต้องลดตามข้อมูลจริงไม่คงยอดเดิม",
          "NEW — เพิ่มกรณี PO สุดท้าย: ใช้กติกาสถานะแผน/ขอบเขตการมองเห็นตาม Sheet และแจ้งผลครั้งเดียว ไม่ใช้การปิดกล่องแทนผลสำเร็จ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ปรับรายการหรือรายละเอียดล่าสุดให้เห็นตรงกับข้อมูลที่บันทึก\n  - ไม่ให้กดยืนยันซ้ำขณะกำลังส่งข้อมูล\n  - ยืนยันลบสำเร็จ อยู่หน้ารายละเอียดแผน toast \"ลบ purchase order สำเร็จ\"\n  - PO หายจากตาราง หัวส่วนลดจำนวน (\"Purchase Order (3)\" → \"(2)\")\n  - Permission: แผนที่กลับเป็น \"รอเลข PO\" กลับเป็น Layer 1 หน่วยงาน/กรย. มองไม่เห็นแผนอีก\n  - ลูกค้าแก้ข้อความแจ้งผลลบ PO (ยืนยันแล้ว):\n      - ลบ purchase order สำเร็จ -> ลบ PO สำเร็จ [Sheet พี่นุ — OH-Toast #9]\n  - ข้อความแจ้งผลมุมขวาบน ลบ PO สำเร็จ: แสดงครั้งเดียวบนหน้ารายละเอียดแผน (PlanDetail)",
          "Status (StatusBadge)\n  - เมื่อระบบยืนยันว่าทำสำเร็จ จึงเปลี่ยนหน้า/สถานะและแสดงข้อความสำเร็จ\n  - Status (Sheet PEA): ยังเหลือ PO ≥ 1 → แผนคง \"รอดำเนินการ\" · เหลือ PO = 0 → แผนกลับเป็น \"รอเลข PO\" ใช้ toast เดียวกัน\n  - ป้ายสถานะ/รายการที่เลือก สถานะแผน/จำนวนรถ: คำนวณใหม่หลังลบ โดยกรณีเหลือ PO ศูนย์แผนกลับรอเลข PO ตาม Sheet",
          "Table (DataTable)\n  - Columns\n    - \"จำนวนรถที่ Overhaul\" ต้องลดตามจำนวนรถใน PO ที่ถูกลบ\n  - Behavior\n    - ตาราง PO/หัวส่วนจำนวน: เอา PO ที่ลบออกและโหลดจำนวนใหม่"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ลบ PO ใบสุดท้าย: อัปเดตสถานะแผนและขอบเขตมองเห็นตามกติกา ไม่คงรอดำเนินการกับจำนวน PO ศูนย์",
          "ลบสำเร็จแต่โหลดรายละเอียดแผนไม่สำเร็จ: retry เฉพาะการโหลด ไม่ยิงลบซ้ำและไม่คงจำนวนรถเดิมโดยไม่มีสถานะเตือน"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "mock ยังแสดง \"3 คัน\" หลังลบ PO ที่มีรถ 2 คัน (ควรเป็น 1 คัน)",
          "เมื่อลบ PO รถใน PO หายจากมุมมองของหน่วยงานเจ้าของรถทันทีโดยไม่มี notification ต้องเคาะว่าแจ้งไหม"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / G.2 · S6 — ลบสำเร็จ"
      ]
    }
  },
  "H.1": {
    "title": "AC H.1 — form นัด Default",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรถเข้าอู่และติดตามผลตอบรับ — form นัด Default",
          "Who: กบค. ใช้จัดการนัด; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: เลือกวันเวลาและกรอกข้อมูลนัดเข้าอู่ แล้วส่งนัดหรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มี form นัดเข้าอู่ แต่ยังไม่แยกทางออกจากหน้างานกับการถอยสถานะงาน"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ย้อนกลับ: ไป E.10 ของ PO นี้ ไม่ย้อนสถานะรถ; มี ข้อมูลที่ยังไม่บันทึก เปิดยืนยันออกก่อน",
          "NEW — เพิ่มค่าเริ่มต้น: ช่วงวัน/ผู้ประสานงานยังไม่เลือก ข้อมูลอู่ดูอย่างเดียว และส่งนัดยังไม่พร้อมจนข้อมูลครบ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เลือกวันและเวลาแล้วตรวจว่าข้อมูลจำเป็นครบก่อนส่ง\n  - ออกจากช่องที่บังคับแต่ยังว่างให้ขึ้นคำเตือน และแก้ถูกแล้วเตือนหาย\n  - ระหว่างส่งนัดห้ามกดส่งซ้ำ\n  - หน้างานรายคัน ✅ CF: breadcrumb \"… > แผน {เลขแผน} > {เลข PO} > {ทะเบียน}\" + stepper 6 ขั้น [Sheet พี่นุ]\n  - จาก หน้าหน้างานรถรายคัน (JobView): “ย้อนกลับ” → รายละเอียด PO E.10; ถ้ามี ข้อมูลที่ยังไม่บันทึก ที่หน้าแจ้ง dirty เปิด “ยืนยันการออก” ก่อน ปิดกล่องแล้วอยู่ขั้นนัดเดิม ยืนยันแล้วจึงกลับ PO",
          "Status (StatusBadge)\n  - ส่งสำเร็จให้แสดงสถานะรอหน่วยงานตอบรับ; ไม่สำเร็จต้องคงค่าที่กรอก",
          "Stepper\n  - รถสถานะ \"รอนัดหมายเข้าอู่\" stepper อยู่ขั้น 01 \"นัดเอารถเข้าอู่\" แสดงส่วน \"รายละเอียดการนัดหมาย\" ตามตารางฟิลด์ ช่องว่างทั้งหมด\n  - สถานะเริ่มต้นของรถหลังสร้าง PO ใน mock คือ “รอนัดหมายเข้าอู่” และอยู่ขั้น 01 นัดเอารถเข้าอู่ แต่ Sheet PEA ไม่มีชื่อนี้ ต้องตกลงชื่อสถานะที่จะใช้ก่อนกำหนด enum",
          "Buttons\n  - ปุ่ม \"ย้อนกลับ\" (ซ้าย) / \"ส่งนัดหมาย\" (ขวา, disable)\n  - ปุ่ม “ส่งนัดหมาย”: เริ่ม disable จนข้อมูลครบ; ส่งสำเร็จแสดงสถานะรอหน่วยงานตอบรับ H.4.2\n  - ปุ่ม “ย้อนกลับ”: กลับรายละเอียด PO E.10 โดยไม่ส่งนัด; ถ้ามีข้อมูลที่ยังไม่บันทึกต้องยืนยันการออกก่อน",
          "Date Input\n  - ช่องเลือกช่วงวันที่ (DateRangeInput) ช่วงวันนำรถเข้า: เริ่มว่าง ไม่ใส่วันนัดเอง",
          "Select Field\n  - ช่องเลือกผู้ประสานงาน: เริ่มยังไม่เลือก; ข้อมูลอู่/เบอร์/ที่อยู่เป็นค่าดูอย่างเดียว"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "ส่ง/แก้ไขนัด เฉพาะ กบค. [Sheet พี่นุ]",
          "หน่วยงานเจ้าของรถและ กรย. เห็นหน้านี้แบบอ่านอย่างเดียว (ไม่มีปุ่ม \"ส่งนัดหมาย\") [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ข้อมูลอู่/ผู้ประสานงานยังโหลดไม่ได้: ไม่เติมค่าเก่าจากรถก่อนหน้า และยังไม่เปิดส่งนัดจากข้อมูลที่ไม่ครบ",
          "กดย้อนกลับหลังเลือกวันแล้ว: ถ้ามี ข้อมูลที่ยังไม่บันทึก ให้ยืนยันก่อนออก ไม่ถอยสถานะรถหรือทิ้งวันที่เลือกโดยไม่เตือน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / H.1 · S7 — ฟอร์มนัด (ว่าง)"
      ]
    }
  },
  "H.2": {
    "title": "AC H.2 — Validation (ไม่ได้เลือก, Out of focus)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรถเข้าอู่และติดตามผลตอบรับ — Validation (ไม่ได้เลือก, Out of focus)",
          "Who: กบค. ใช้จัดการนัด; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ดูช่องที่ยังไม่ครบและแก้ไขก่อนส่งนัด"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม จอชื่อกดยืนยันโดยยังไม่ครบ ส่วน AC ล่าสุดระบุเปิดแล้วปิดช่องโดยไม่เลือก"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "CHANGE — เปลี่ยนรายละเอียด validation เป็น blur เมื่อออกจากช่องบังคับที่ยังว่าง ไม่ใช้ชื่อ state เดิมเป็นเหตุให้ส่ง request ก่อนเตือน",
          "NEW — เพิ่มข้อกำหนด Clear/คลิกนอก/Esc ของปฏิทิน: ปิดเฉพาะแผง ไม่ออกจากหน้างาน และคำนวณ error/ปุ่มส่งตามค่าที่ยังเหลือ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อออกจากช่องที่จำเป็นโดยไม่กรอก ให้ขึ้นข้อความเตือนตามหน้าจอ\n  - เมื่อกรอกถูกต้องให้ลบข้อความเตือนของช่องนั้น\n  - หากข้อมูลยังไม่ครบ ต้องไม่ส่งข้อมูลผิดไปบันทึก",
          "Date Input\n  - เปิดแล้วปิดช่องโดยไม่เลือก ขอบแดง + \"กรุณาเลือกช่วงวันนำรถเข้า\" และ/หรือ \"กรุณาเลือกผู้ประสานงาน\"\n  - ปฏิทินเปิดเป็น dropdown มีปุ่ม \"Clear\"\n  - ช่องเลือกช่วงวันที่ (DateRangeInput) และช่องเลือกผู้ประสานงาน: เปิดแล้วปิดโดยยังไม่เลือกให้ขึ้นขอบแดงและ error ของช่องนั้น\n  - จาก ช่องเลือกช่วงวันที่ (DateRangeInput): คลิกนอกช่องหรือกด Esc → ปิดเฉพาะแผงปฏิทิน ไม่ออกจากหน้างาน; การแสดง validation ตอน blur ยังเป็นหน้าที่ของ form ไม่ใช่แผงปฏิทินทำให้เอง",
          "Buttons\n  - ปุ่ม “Clear” ในปฏิทิน: ล้างช่วงวันแล้วคำนวณ validation/ปุ่มส่งใหม่ ไม่คงวันเดิมในข้อมูลที่จะส่ง"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เปิดแล้วปิดปฏิทิน/ช่องผู้ประสานงานโดยไม่เลือก: ขึ้น error เฉพาะช่องที่ต้องกรอก และยังอยู่หน้าหน้างาน",
          "กด Clear ล้างวันแล้ว: ค่าที่ส่งต้องถูกล้างจริง ไม่เหลือวันเก่าใน state แม้ช่องแสดงว่าง"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / H.2 · S7 — กดยืนยันโดยยังไม่ครบ"
      ]
    }
  },
  "H.3": {
    "title": "AC H.3 — Filled",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรถเข้าอู่และติดตามผลตอบรับ — Filled",
          "Who: กบค. ใช้จัดการนัด; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ตรวจวันเวลาและข้อมูลที่กรอกครบแล้วก่อนส่งนัด"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีเลือกผู้ประสานงานและช่วงวัน แต่ยังไม่แยก ข้อมูลที่ยังไม่บันทึก ปฏิทินกับค่าที่ Apply และการปิดรายการชื่อ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เลือกวันในปฏิทินแล้วกด “Apply” เพื่อใช้ช่วงวันที่เลือก; กด “Cancel” เพื่อปิดปฏิทินและใช้ช่วงวันเดิม; ปฏิทินในโค้ดยังแก้ค่าทันทีและไม่มี Apply/Cancel ต้องพัฒนาเพิ่มก่อนอ้างว่ารองรับ",
          "NEW — เพิ่ม behavior ผู้ประสานงาน (Combobox): blur คืนชื่อที่เลือก Esc ปิด Enter เลือกแถวจริง และเบอร์เปลี่ยนตามคนนั้น ไม่ส่งนัดจากการเลือกชื่ออย่างเดียว"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เลือกวันและเวลาแล้วตรวจว่าข้อมูลจำเป็นครบก่อนส่ง\n  - ออกจากช่องที่บังคับแต่ยังว่างให้ขึ้นคำเตือน และแก้ถูกแล้วเตือนหาย\n  - ระหว่างส่งนัดห้ามกดส่งซ้ำ\n  - ช่องพิมพ์ค้นและรายการตัวเลือก ผู้ประสานงาน: เลือกชื่อจริงจากรายการสองบรรทัดแล้วเติมเบอร์ของคนนั้น; แก้คำค้นต้องไม่คงผู้ประสานงานผิดคน",
          "Status (StatusBadge)\n  - ส่งสำเร็จให้แสดงสถานะรอหน่วยงานตอบรับ; ไม่สำเร็จต้องคงค่าที่กรอก",
          "Date Input\n  - เลือกช่วงวัน ปฏิทิน 2 เดือนเลือกวันเริ่ม-สิ้นสุด ปุ่ม \"Cancel\" / \"Apply\" แสดงผล \"22/10/2569 - 24/10/2569\"\n  - ช่องเลือกช่วงวันที่ (DateRangeInput) สองเดือน: เก็บช่วงวันที่กำลังเลือกแยกจากค่าที่ Apply; Cancel ไม่เปลี่ยนค่าที่แสดงใน form\n  - จาก ช่องเลือกช่วงวันที่ (DateRangeInput) ปัจจุบัน: คลิกนอก/Esc ปิดแผง และการเลือกวันแก้ค่า form ทันที ไม่มีปุ่ม Apply/Cancel; ต่างจาก AC ที่มี ข้อมูลที่ยังไม่บันทึก และ Apply/Cancel จึงต้องเคาะ/ปรับ component ไม่อ้างว่ารองรับแล้ว",
          "Select Field\n  - พิมพ์ค้นผู้ประสานงาน dropdown แต่ละรายการ 2 บรรทัด: ชื่อ (\"นายวิชัย ทองดี\") และ \"ตำแหน่ง · เบอร์\" (\"วิศวกร กบค. · 02-590-9123\")\n  - ผู้ประสานงาน (กบค.) เป็นช่องเลือกแบบพิมพ์ค้นหาชื่อ [Sheet พี่นุ — OH-5, ✅ CF]",
          "Buttons\n  - เลือก ช่องแสดง \"นายวิชัย ทองดี วิศวกร กบค.\" เบอร์ \"02-590-9123\" เติมอัตโนมัติ ปุ่ม \"ส่งนัดหมาย\" enable\n  - ปุ่ม “ส่งนัดหมาย”: enable เมื่อเลือกข้อมูลครบ; รูปแบบปฏิทินไทย/พ.ศ. ต้องตรงค่าที่แสดงและข้อสรุปทีม",
          "Combobox\n  - จาก ช่องพิมพ์ค้นและเลือกจากรายการ (Combobox) ผู้ประสานงาน: blur ปิดรายการคืนชื่อที่เลือกไว้, Esc ปิดไม่เลือกใหม่, Enter เลือกแถวที่ไฮไลต์; ไม่ออกจากหน้า form เพียงเพราะปิด รายการตัวเลือก"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เลือกวันสิ้นสุดก่อนวันเริ่ม: ไม่ส่งช่วงวันผิดลำดับ และให้แก้ค่าโดยไม่ล้างผู้ประสานงาน",
          "พิมพ์ชื่อผู้ประสานงานแต่ไม่เลือก หรือเปลี่ยนไปเลือกคนอื่น: ไม่คง ID/เบอร์ของคนเดิมให้ส่งผิดคน"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ปฏิทินใน mock เป็นภาษาอังกฤษ ค.ศ. (\"Dec 2024 / Jan 2025\", Mo–Su, Cancel/Apply) แต่ผลแสดงเป็น พ.ศ. ต้องใช้ปฏิทินไทย พ.ศ. ให้ตรงกัน",
          "ต้องเคาะ: เลือกวันก่อนวันนี้ได้ไหม (แนะนำไม่ได้), วันเดียวได้ไหม, ช่วงยาวสุดกี่วัน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / H.3 · S7 — เลือกผู้ประสานงาน"
      ]
    }
  },
  "H.4.1": {
    "title": "AC H.4.1 — สร้างนัดไม่สำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรถเข้าอู่และติดตามผลตอบรับ — สร้างนัดไม่สำเร็จ",
          "Who: กบค. ใช้จัดการนัด; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ตรวจข้อผิดพลาดและลองส่งนัดใหม่โดยคงข้อมูลเดิม"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม เดิมมีผลส่งนัดเข้าอู่ล้มเหลวภายใต้ H.4 แต่ไม่แยกผลต่อ ข้อมูลที่ยังไม่บันทึก/ปุ่มส่งใหม่เป็น behavior ครบ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มข้อกำหนดล้มเหลว: คงช่วงวัน/ผู้ประสานงาน สถานะยังรอนัดเข้าอู่และไม่เลื่อน stepper",
          "NEW — เพิ่ม retry หลังพ้น pending โดยไม่สร้างนัดซ้ำหรือให้ผล request เก่าทับครั้งใหม่"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อกดบันทึกหรือส่งแล้วผิดพลาด ให้แสดงข้อความแจ้งตามจอ\n  - \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} ไม่สำเร็จ\" (🤔 แก้จาก \"ไม่สามารถสร้าง นัดหมาย\") ตรงกับ mock · ไม่มี notification [Sheet พี่นุ — OH-Toast #14]\n  - ข้อความแจ้งผลมุมขวาบน นัดหมายไม่สำเร็จ: คงสถานะก่อนส่ง ไม่เลื่อน stepper",
          "File Upload (FileUpload)\n  - อยู่หน้าเดิม และค่าที่กรอก/ไฟล์ที่เลือกต้องไม่หาย",
          "Status (StatusBadge)\n  - ปลดสถานะกำลังทำ เพื่อให้แก้ไขและกดใหม่ได้ โดยไม่สร้างข้อมูลซ้ำ\n  - กด \"ส่งนัดหมาย\" แล้ว server ผิดพลาด toast \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} ไม่สำเร็จ\" อยู่หน้าเดิม ค่าคงอยู่ สถานะยัง \"รอนัดหมายเข้าอู่\"",
          "Date Input\n  - ช่องเลือกช่วงวันที่ (DateRangeInput)/ผู้ประสานงาน: คงค่าที่เลือกไว้ให้ส่งใหม่",
          "Buttons\n  - ปุ่ม “ส่งนัดหมาย”: พ้น pending แล้ว retry ได้ ไม่สร้างนัดซ้ำจากการกดค้าง"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ส่งนัดไม่สำเร็จ: คงช่วงวัน ผู้ประสานงาน และสถานะรอนัดเข้าอู่ ไม่เลื่อน stepper",
          "การเชื่อมต่อขาดจนไม่รู้ผลนัด: ตรวจนัดล่าสุดก่อนกดส่งใหม่ เพื่อไม่เกิดนัด/ข้อความแจ้งซ้ำ"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / H.4 · S7 — สร้างนัดไม่สำเร็จ (toast 14)"
      ]
    }
  },
  "H.4.2": {
    "title": "AC H.4.2 — ส่งนัดสำเร็จ รอหน่วยงานตอบรับ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรถเข้าอู่และติดตามผลตอบรับ — ส่งนัดสำเร็จ รอหน่วยงานตอบรับ",
          "Who: กบค. ใช้จัดการนัด; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ดูข้อมูลนัดที่ส่งแล้วและสถานะรอหน่วยงานตอบรับ; การตอบรับหรือปฏิเสธเป็นสิทธิ์ของหน่วยงานเจ้าของรถ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม เดิมมีจอรอตอบรับภายใต้ H.5 ไม่ใช่ state H.5 ปัจจุบันที่อ่านอย่างเดียว"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ระหว่างรอ: ส่งสำเร็จยังไม่ถือว่าหน่วยงานตอบรับและไม่เลื่อนขั้นเอง; toast เกิดครั้งเดียว",
          "NEW — เพิ่มปุ่มแก้ไขนัด: เปิด H.4.3 ด้วยนัดปัจจุบันและตรวจสถานะตอบรับล่าสุดก่อนให้แก้"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ปรับรายการหรือรายละเอียดล่าสุดให้เห็นตรงกับข้อมูลที่บันทึก\n  - ไม่ให้กดยืนยันซ้ำขณะกำลังส่งข้อมูล\n  - Toast #13: \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ\" (🤔 แก้จาก \"การสร้าง นัดหมาย สำเร็จ\") ตรงกับ mock [Sheet พี่นุ]\n  - Notification #13: ข้อความเดียวกับ toast ส่งถึงหน่วยงานเจ้าของรถของคันนั้น [Sheet พี่นุ]\n  - ข้อความแจ้งผลมุมขวาบน สำเร็จ: แสดงหลังส่งสำเร็จครั้งเดียว; วิธีแสดงผลเมื่อหน่วยงานตอบภายหลังยังต้องตกลง",
          "Status (StatusBadge)\n  - เมื่อระบบยืนยันว่าทำสำเร็จ จึงเปลี่ยนหน้า/สถานะและแสดงข้อความสำเร็จ\n  - ส่งสำเร็จ toast \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ\" สถานะเป็น \"รอหน่วยงานตอบรับนัดเข้าอู่\"\n  - สถานะ \"รอหน่วยงานตอบรับนัดเข้าอู่\" หน่วยงานเจ้าของรถกดตอบรับ สถานะเป็น \"รอตรวจรับรถ\" (status final: \"หน่วยงานตอบรับเข้าอู่แล้ว\") stepper ไปขั้น 02\n  - Status: \"รอหน่วยงานตอบรับนัดเข้าอู่\" (status final: \"รอหน่วยงานตอบรับเข้าอู่\") [Sheet พี่นุ]\n  - ป้ายสถานะ/รายการที่เลือก สถานะและข้อความ “รอตอบกลับจากหน่วยงาน”: แสดงผลนัดที่ส่งสำเร็จ ไม่เปลี่ยนเป็นตอบรับเอง",
          "Buttons\n  - ส่วน form ถูกแทนด้วย empty \"รอตอบกลับจากหน่วยงาน\" และปุ่ม \"แก้ไขนัดหมาย\"\n  - ปุ่ม “แก้ไขนัดหมาย”: เปิด H.4.3 พร้อมนัดปัจจุบัน และตรวจว่ายังแก้ได้เมื่อกด"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "หน่วยงานเจ้าของรถเห็นปุ่มตอบรับ/ปฏิเสธนัด (จอฝั่งหน่วยงานยังไม่มี — Scenario 20) [Sheet พี่นุ]",
          "กรย. ดูอย่างเดียว [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "หน่วยงานตอบรับ/ปฏิเสธระหว่างเปิดรอตอบกลับ: โหลดสถานะล่าสุดก่อนแก้ ไม่ค้างปุ่มที่ใช้ไม่ได้แล้ว",
          "refresh หน้ารอตอบกลับ: ไม่ส่งนัดหรือ notification ซ้ำเพราะแค่เปิดอ่านหน้า"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะค่าจริงของ {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} (แนะนำ เลข PO + ทะเบียน)",
          "สภาพรอตอบรับซ่อนช่วงวันและผู้ประสานงานที่ส่งไป กบค. จะไม่เห็นว่านัดอะไรไว้ แนะนำให้แสดงค่าที่ส่งแบบอ่านอย่างเดียวด้วย"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / H.5 · S7 — รอหน่วยงานตอบรับ (toast 13)"
      ]
    }
  },
  "H.4.3": {
    "title": "AC H.4.3 — แก้ไขนัดหมาย",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรถเข้าอู่และติดตามผลตอบรับ — แก้ไขนัดหมาย",
          "Who: กบค. ใช้จัดการนัด; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ปรับวันเวลาหรือข้อมูลนัดและส่งใหม่ตามสิทธิ์"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม เดิมมีแก้นัดภายใต้ H.7 แต่ยังไม่แยกการปิดส่วนย่อย/ออกจาก ข้อมูลที่ยังไม่บันทึก กับนัดที่ส่งแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ข้อมูลที่ยังไม่บันทึก แก้นัด: ปิด dropdown/ปฏิทินไม่ยกเลิกนัดเดิม; ย้อนกลับไป PO ผ่าน guard ปิดกล่องแล้วกลับ ข้อมูลที่ยังไม่บันทึก เดิม",
          "NEW — เพิ่มการส่งใหม่: ตรวจว่ายังไม่มีคำตอบจากหน่วยงานระหว่างเปิด form ก่อนแก้นัด และกันกดซ้ำ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เปิด form โดยใส่วัน เวลา และข้อมูลนัดเดิมให้เห็น\n  - แก้ค่าใหม่แล้วตรวจว่าข้อมูลจำเป็นครบก่อนส่งอีกครั้ง\n  - หากยกเลิกการแก้ไข ให้ข้อมูลเดิมไม่เปลี่ยน\n  - กด \"แก้ไขนัดหมาย\" form เปิดพร้อมค่าเดิม (22/10/2569 - 24/10/2569, นายวิชัย ทองดี, 02-590-9123) แก้ได้ทุกช่อง",
          "Status (StatusBadge)\n  - กด \"ส่งนัดหมาย\" ถือเป็นการส่งนัดใหม่ ใช้ toast และสถานะเดียวกับ H.4.2\n  - แก้ไขนัดได้จนกว่าหน่วยงานจะตอบ แก้แล้วส่งใหม่ใช้ toast #13 \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ\" และสถานะกลับเป็น \"รอหน่วยงานตอบรับนัดเข้าอู่\" (ตอบ ⚠️ ด้านบนแล้ว) [Sheet พี่นุ — PEA]\n  - ป้ายสถานะ/รายการที่เลือก สถานะ: ใช้ผลนัดล่าสุดหลังส่งใหม่ ไม่คงป้ายปฏิเสธหรือค่าจาก ข้อมูลที่ยังไม่บันทึก",
          "Date Input\n  - ช่องเลือกช่วงวันที่ (DateRangeInput)/ช่องผู้ประสานงาน: เติมข้อมูลนัดเดิมและเปิดแก้เป็น ข้อมูลที่ยังไม่บันทึก\n  - ปิดเฉพาะ รายการตัวเลือก ผู้ประสานงาน/ปฏิทินด้วยคลิกนอก ไม่ถือเป็นการยกเลิกนัดที่เคยส่ง",
          "Buttons\n  - ปุ่มส่งนัดใหม่: ตรวจสิทธิ์และสถานะตอบรับล่าสุดก่อนส่ง พร้อมกันกดซ้ำ\n  - ออกจากการแก้นัดด้วยปุ่มย้อนกลับ → ขอไปรายละเอียด PO ผ่าน leave guard ของ หน้าหน้างานรถรายคัน (JobView); ถ้ามี ข้อมูลที่ยังไม่บันทึก ปิดกล่องยืนยันการออกจะกลับนัดที่กำลังแก้ ไม่ใช่ส่งนัดใหม่"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "หน่วยงานตอบรับขณะ กบค. กำลังแก้นัด: ตรวจอีกครั้งตอนส่งและแจ้งว่าแก้ต่อไม่ได้ แทนการทับนัดที่ตอบรับแล้ว",
          "ส่งแก้นัดล้มเหลว: คง ข้อมูลที่ยังไม่บันทึก ที่แก้และนัดเดิมที่บันทึกแล้วแยกกัน ไม่แสดงวันใหม่เหมือนส่งสำเร็จ"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "chip ในเฟรมนี้เป็น \"หน่วยงานปฏิเสธนัดเข้าอู่\" ทั้งที่เป็นการแก้ไขระหว่างรอตอบ (ควรเป็น \"รอหน่วยงานตอบรับนัดเข้าอู่\")",
          "ต้องเคาะ: แก้ไขนัดได้ถึงเมื่อไร (แนะนำจนกว่าหน่วยงานตอบรับ) และกด \"ย้อนกลับ\" ระหว่างแก้ไขต้องมี modal ยืนยันการออกไหม",
          "ต้องเคาะว่าส่งนัดใหม่หลังแก้ไข ส่ง notification #13 ซ้ำถึงหน่วยงานไหม (แนะนำส่ง)"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / H.7 · S7 — แก้ไขนัดหมาย"
      ]
    }
  },
  "H.4.4": {
    "title": "AC H.4.4 — หน่วยงานปฏิเสธ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรถเข้าอู่และติดตามผลตอบรับ — หน่วยงานปฏิเสธ",
          "Who: กบค. ใช้จัดการนัด; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ดูผลปฏิเสธและกลับไปจัดนัดใหม่ตามสิทธิ์"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีจอหน่วยงานปฏิเสธภายใต้ H.6 แต่ยังไม่แยกข้อมูลเหตุผลกับ ข้อมูลที่ยังไม่บันทึก นัดครั้งใหม่"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior กล่องเหตุผล: คงหมายเหตุของครั้งที่ปฏิเสธแบบอ่านอย่างเดียวขณะปรับวัน/ผู้ประสานงานนัดใหม่",
          "NEW — เพิ่มทางออก: ย้อนกลับผ่าน guard ไป PO ไม่ลบประวัติปฏิเสธ; ส่งใหม่เปลี่ยนสถานะเมื่อสำเร็จเท่านั้น"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ผู้มีสิทธิ์แก้ไขนัดต้องกลับไปเลือกวัน/ข้อมูลนัดใหม่ได้\n  - ห้ามข้ามไปขั้นถัดไปเพียงเพราะส่งนัดไปแล้ว\n  - form เติมค่านัดเดิม แก้แล้วกด \"ส่งนัดหมาย\" ได้ → กลับไป H.4.2\n  - Action (PEA): หน่วยงานปฏิเสธนัด + หมายเหตุ (เหตุผล) [Sheet พี่นุ]\n  - Toast #16 (ถึง กบค.): \"หน่วยงาน {สังกัด} ของ {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} ปฏิเสธนัดหมาย\" (ประเภทแจ้งเตือน) [Sheet พี่นุ]\n  - กบค. แก้ไขนัดแล้วส่งใหม่: toast #13 สถานะกลับเป็น \"รอหน่วยงานตอบรับนัดเข้าอู่\" [Sheet พี่นุ]",
          "Status (StatusBadge)\n  - เมื่อหน่วยงานปฏิเสธ ให้แสดงสถานะปฏิเสธตามจอ\n  - หน่วยงานปฏิเสธนัด สถานะ \"หน่วยงานปฏิเสธนัดเข้าอู่\" แสดงกล่อง \"เหตุผลการปฏิเสธ\" (เช่น \"รถติดภารกิจซ่อมบำรุงสายส่ง ขอเลื่อนเป็นสัปดาห์ถัดไป\") เหนือ form\n  - Status: \"หน่วยงานปฏิเสธนัดเข้าอู่\" (status final: \"หน่วยงานปฏิเสธเข้าอู่\") [Sheet พี่นุ]",
          "Modal\n  - กล่องเหตุผลการปฏิเสธ: แสดงหมายเหตุของนัดที่ถูกปฏิเสธแบบอ่านอย่างเดียว",
          "Date Input\n  - ช่องเลือกช่วงวันที่ (DateRangeInput)/ผู้ประสานงาน: เติมค่าครั้งก่อนให้แก้ใหม่โดยไม่ทำเหตุผลปฏิเสธเดิมหายระหว่างกรอก",
          "Buttons\n  - ปุ่มส่งนัดใหม่: ส่งค่าที่แก้ และอัปเดตกล่องสถานะตามผล server",
          "Navigation\n  - กด “ย้อนกลับ” ออกจาก form ที่แก้นัดหลังถูกปฏิเสธ ใช้ leave guard แล้วกลับรายละเอียด PO; การปิดกล่องยืนยันการออกคงเหตุผลปฏิเสธและ ข้อมูลที่ยังไม่บันทึก ไว้ ไม่ลบประวัตินัด"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "เฉพาะหน่วยงานเจ้าของรถ [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เปลี่ยนวันหลังถูกปฏิเสธ: เก็บเหตุผลของครั้งเดิมให้ดูได้ ไม่เอา ข้อมูลที่ยังไม่บันทึก ใหม่ไปเขียนทับประวัติเหตุผล",
          "ส่งนัดใหม่ล้มเหลว: คงสถานะปฏิเสธและค่าที่กำลังแก้ ไม่เปลี่ยนเป็นรอตอบรับก่อนผลจริง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ฝั่งหน่วยงาน (ปุ่มตอบรับ/ปฏิเสธ + ช่องเหตุผล) ยังไม่มีจอ ดู Scenario 20",
          "#16 ไม่มี notification ใน Sheet ถ้า กบค. ไม่ได้เปิดหน้าอยู่จะไม่เห็น toast แนะนำให้มี notification ข้อความเดียวกัน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / H.6 · S7 — หน่วยงานปฏิเสธ (toast 16)"
      ]
    }
  },
  "H.5": {
    "title": "AC H.5 — ย้อนกลับมาจากหน้าอื่นหลังนัดหมายแล้ว",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรถเข้าอู่และติดตามผลตอบรับ — ย้อนกลับมาจากหน้าอื่นหลังนัดหมายแล้ว",
          "Who: กบค. ใช้จัดการนัด; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: กลับมาดูข้อมูลนัดและผลตอบรับล่าสุด โดยไม่สร้างนัดซ้ำหรือถอยสถานะ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีสถานะนัดตอบรับ แต่ยังไม่พบเฟรมกลับมาดูขั้นนัดที่ผ่านแล้วแยกตรง state ปัจจุบันนี้"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มจอกลับมาดูนัดเข้าอู่แบบอ่านอย่างเดียว ไม่มีปุ่มส่ง/แก้ไขและไม่เปิด picker",
          "NEW — เพิ่มการแยกมุมมองกับสถานะ: กลับไปดูขั้น 01 ไม่ถอยสถานะปัจจุบันของรถ ย้อนกลับหมายถึงกลับ PO"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เลือกวันและเวลาแล้วตรวจว่าข้อมูลจำเป็นครบก่อนส่ง\n  - ออกจากช่องที่บังคับแต่ยังว่างให้ขึ้นคำเตือน และแก้ถูกแล้วเตือนหาย\n  - ระหว่างส่งนัดห้ามกดส่งซ้ำ\n  - ข้อมูลนัดที่ผ่านขั้นแล้ว: แสดงวัน/ผู้ประสานงานเป็นอ่านอย่างเดียว ไม่เปิด picker หรือ รายการตัวเลือก ให้แก้\n  - จาก หน้าหน้างานรถรายคัน (JobView): “ย้อนกลับ” ของหน้างานหมายถึงไปรายละเอียด PO ไม่ใช่ถอยสถานะจากขั้นตรวจรับกลับเป็นรอนัดเข้าอู่; การคลิกดูขั้นก่อนหน้าไม่แก้สถานะที่บันทึกแล้ว",
          "Status (StatusBadge)\n  - ส่งสำเร็จให้แสดงสถานะรอหน่วยงานตอบรับ; ไม่สำเร็จต้องคงค่าที่กรอก",
          "Stepper\n  - รถผ่านขั้น 01 ไปแล้ว กดขั้น 01 บน stepper แสดงข้อมูลนัดแบบอ่านอย่างเดียว (ช่อง disable) ไม่มีปุ่ม \"ส่งนัดหมาย\"/\"แก้ไขนัดหมาย\"\n  - stepper ขั้นที่ผ่านแล้วแสดงเครื่องหมายถูก",
          "Buttons\n  - ปุ่มส่ง/แก้ไขนัด: ไม่แสดงใน state นี้; stepper และ ป้ายรายการที่เลือก ต้องตรงนัดที่ตอบรับแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "ทุก role ดูอย่างเดียวในขั้นที่ผ่านแล้ว [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "กลับมาอ่านขั้นนัดที่ผ่านแล้ว: ไม่เปิดให้แก้/ส่งนัดจากปุ่มค้างหรือ URL ที่เคยใช้",
          "โหลดนัดเดิมไม่สำเร็จ: แจ้งให้ลองโหลดใหม่ ไม่แสดง form ว่างที่ทำให้เข้าใจว่าต้องนัดอีกครั้ง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "chip ใน mock ยังเป็น \"หน่วยงานปฏิเสธนัดเข้าอู่\" ต้องแสดงสถานะปัจจุบันของรถ และขั้น 01 ควรเป็นเครื่องหมายถูก ไม่ใช่เลข 01",
          "ที่อยู่อู่ใน H.1 เป็นที่อยู่เต็ม (\"200 ถนน งามวงศ์วาน แขวงลาดยาว เขตจตุจักร กรุงเทพมหานคร 10900\") แต่ H.2–H.5 เป็น \"อ.บางพลี สมุทรปราการ\" mock ไม่ตรงกัน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "I.1": {
    "title": "AC I.1 — Default",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: บันทึกการตรวจรับรถเข้าอู่และการลงนาม — Default",
          "Who: กบค. ใช้บันทึกผลตรวจและข้อมูลผู้ลงนาม; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลตามขอบเขตของตน",
          "Do: เริ่มกรอกข้อมูลตรวจรับรถเข้าอู่"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีรายการตรวจรับและลงนาม แต่ไม่ครบ behavior รายแถว/การยกเลิก ข้อมูลที่ยังไม่บันทึก จากหน้างาน"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior checklist: radio มี/ไม่มีหนึ่งค่า และ checkbox/หมายเหตุเก็บตามแถว ไม่ reset เมื่อเลือกผู้เซ็น",
          "NEW — เพิ่ม การตรวจข้อมูลที่ยังไม่บันทึกก่อนออกจากหน้า ก่อนกลับ PO เมื่อแก้ checklist/ผู้ลงนาม; ปิดกล่องคง ข้อมูลที่ยังไม่บันทึก ยืนยันออกจึงทิ้งส่วนยังไม่บันทึก"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เช็กรายการตรวจรับทีละข้อ; สิ่งที่เลือกต้องไม่หายเมื่อเปิดช่องลงนาม\n  - เลือกรายชื่อผู้ลงนามตามที่หน้าจอกำหนด\n  - ส่วน \"ลงนามการรับมอบรถ\": ผู้ส่งมอบรถ (dropdown \"เลือกผู้ส่งมอบรถ\") และ ผู้รับมอบ (กบค.) (dropdown \"เลือกผู้รับมอบ (กบค.)\") ใต้แต่ละช่องมีปุ่ม \"เซ็นลงนาม\"\n  - จาก หน้าหน้างานรถรายคัน (JobView): “ย้อนกลับ” → รายละเอียด PO และผ่าน leave guard หาก checklist/ผู้ลงนามมี ข้อมูลที่ยังไม่บันทึก; ปิดกล่องแล้วคง checklist เดิม ยืนยันออกจึงทิ้งการแก้ที่ยังไม่บันทึก",
          "Signature\n  - วาดลายเซ็นได้ ลบแล้วเซ็นใหม่ได้; ช่องลายเซ็นว่างต้องไม่นับว่าเซ็นแล้ว\n  - ยืนยันรับรถได้เมื่อข้อมูลตรวจและลายเซ็นครบตามกติกาในจอ",
          "Stepper\n  - สถานะ \"รอตรวจรับรถ\" stepper ขั้น 01 เป็นเครื่องหมายถูก ขั้น 02 \"ตรวจรับรถ\" เป็นปัจจุบัน",
          "Buttons\n  - แสดง checklist 13 ข้อยังไม่เลือก และปุ่ม \"+ เพิ่มรายการ\" ใต้ตาราง\n  - ปุ่ม \"ย้อนกลับ\" / \"ยืนยันรับรถ\" (disable)\n  - ปุ่ม “+ เพิ่มรายการ”: ยังต้องตกลงรูปแบบแถวใหม่และการลบ จึงไม่สร้างวิธีเพิ่มเอง\n  - ปุ่ม “ยืนยันรับรถ”: เริ่ม disable ตาม state เริ่มต้น",
          "Table (DataTable)\n  - Behavior\n    - ตารางตรวจรับรถ (OH-5, ✅ CF): รายการตรวจสอบ, ผลตรวจ, หมายเหตุ (mock แยกผลตรวจเป็น มี/ไม่มี/ชำรุด/ผิดรุ่น) [Sheet พี่นุ]\n    - ตารางรายการตรวจสอบ 13 ข้อ: radio มี/ไม่มีเลือกได้หนึ่งค่า ส่วน checkbox ชำรุด/ผิดรุ่นเก็บแยก; note เป็น ช่องกรอก ของแต่ละแถว",
          "Status (StatusBadge)\n  - Status: \"รอตรวจรับรถ\" (status final: \"หน่วยงานตอบรับเข้าอู่แล้ว\") [Sheet พี่นุ]",
          "Select Field\n  - ช่องเลือกจากรายการ ผู้ส่งมอบ/ผู้รับมอบ และปุ่ม “เซ็นลงนาม”: เก็บแยกสองฝ่าย; เงื่อนไขเปิดเซ็นก่อนเลือกชื่อยังต้องตกลง"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "กรอก checklist + ลงนาม + ยืนยันรับรถในระบบ เฉพาะ กบค. [Sheet พี่นุ]",
          "หน่วยงานเจ้าของรถดูอย่างเดียว (สิทธิ์ของหน่วยงานในระบบมีแค่ตอบรับ/ปฏิเสธนัด) [Sheet พี่นุ]",
          "กรย. ดูอย่างเดียว [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ผลตรวจบางข้อยังไม่ครบ: ไม่ถือว่าตรวจครบจากจำนวนแถวอย่างเดียว และตรวจตามกติกาที่ตกลงก่อนยืนยันรับรถ",
          "แก้ checklist แล้วออก/เปลี่ยนขั้น: เตือนก่อนทิ้ง ข้อมูลที่ยังไม่บันทึก แต่ไม่บันทึกผลตรวจจากการเพียงปิดกล่องเตือน"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: \"+ เพิ่มรายการ\" เพิ่มแถวแบบไหน (ชื่อรายการพิมพ์เอง? ลบได้ไหม), ต้องเลือก มี/ไม่มี ครบทุกข้อก่อนยืนยันไหม, ชำรุด/ผิดรุ่นติ๊กได้เมื่อเลือก \"ไม่มี\" ไหม, รายชื่อผู้ส่งมอบรถดึงจากหน่วยงานเจ้าของรถหรือพิมพ์เอง",
          "label ไม่ตรงกัน: I.1 \"ผู้รับมอบ (กบค.)\" แต่ I.2–I.5 \"ผู้รับมอบรถ (กบค.)\"",
          "ผลจาก permission: ผู้ส่งมอบรถ (ฝั่งหน่วยงาน) ต้องเซ็นบนเครื่องของ กบค. หน้างาน ต้องยืนยันกับลูกค้าว่ายอมรับแบบนี้"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / I.1 · S8 — รายการตรวจสอบ"
      ]
    }
  },
  "I.2": {
    "title": "AC I.2 — Filled ตรวจ + เลือกผู้ลงนาม + ยังไม่ได้เซ็น",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: บันทึกการตรวจรับรถเข้าอู่และการลงนาม — Filled ตรวจ + เลือกผู้ลงนาม + ยังไม่ได้เซ็น",
          "Who: กบค. ใช้บันทึกผลตรวจและข้อมูลผู้ลงนาม; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลตามขอบเขตของตน",
          "Do: ตรวจข้อมูลและเลือกผู้ลงนามก่อนลงลายเซ็น"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีจอเริ่มตรวจและจอเซ็นครบ แต่ยังไม่พบ state ตรวจครบ/เลือกชื่อแล้วแต่ยังไม่เซ็นแยกไว้"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มเฟรมก่อนเซ็น: เลือกผู้ส่ง/ผู้รับมอบแล้วแสดงชื่อแต่ยังไม่ถือว่ามีลายเซ็น ปุ่มยืนยันรับรถยังไม่พร้อม",
          "NEW — เพิ่มปุ่มเซ็นรายฝ่าย: เปิด I.3 ของฝ่ายที่กดและคง checklist/หมายเหตุเดิม"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เช็กรายการตรวจรับทีละข้อ; สิ่งที่เลือกต้องไม่หายเมื่อเปิดช่องลงนาม\n  - เลือกรายชื่อผู้ลงนามตามที่หน้าจอกำหนด",
          "Signature\n  - วาดลายเซ็นได้ ลบแล้วเซ็นใหม่ได้; ช่องลายเซ็นว่างต้องไม่นับว่าเซ็นแล้ว\n  - ยืนยันรับรถได้เมื่อข้อมูลตรวจและลายเซ็นครบตามกติกาในจอ",
          "Status (StatusBadge)\n  - กบค. เลือกสถานะแต่ละข้อและใส่หมายเหตุ (เช่น \"ต้องติดต่อขนส่ง\", \"รอทำเรื่องเบิกเพื่อนำมาติดตั้งอย่างเร่งด่วน\", \"รอจัดซื้อมาติดตั้ง\") และแบตเตอรี่ \"GS Yuasa\" \"1\" ลูก ค่าแสดงในตาราง",
          "Buttons\n  - เลือกผู้ส่งมอบ \"นายอนุชิต ลิ้มกิมฮวย\" และผู้รับมอบ \"นายสมาน ใจมั่น\" ชื่อแสดงในช่อง ปุ่ม \"เซ็นลงนาม\" ทั้งสองยังไม่ได้เซ็น \"ยืนยันรับรถ\" ยัง disable\n  - ปุ่ม “เซ็นลงนาม” สองฝ่าย: เปิด กล่องโต้ตอบกลางจอ (Modal) ของฝ่ายที่กด; “ยืนยันรับรถ” ยัง disable เพราะยังไม่มีลายเซ็น",
          "Checkbox\n  - ตัวเลือกที่เลือกได้หนึ่งค่า/checkbox และ ช่องกรอก หมายเหตุใน checklist: รักษาค่าต่อแถว ไม่ reset เมื่อลงชื่อ",
          "Select Field\n  - ช่องเลือกจากรายการ ผู้ส่งมอบ/ผู้รับมอบ: เลือกแล้วแสดงชื่อ แต่ยังไม่ถือว่าเซ็นแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เลือกชื่อครบแต่ยังไม่ได้เซ็น: ปุ่มยืนยันรับรถยังไม่พร้อม ไม่ถือชื่อใน dropdown เป็นหลักฐานลงนาม",
          "เปิดเซ็นของผู้ส่ง/ผู้รับสลับกัน: modal ต้องใช้ชื่อและฝ่ายที่กด ไม่บันทึกภาพลงอีกฝ่าย"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "I.3": {
    "title": "AC I.3 — เซ็นลงนาม Default",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: บันทึกการตรวจรับรถเข้าอู่และการลงนาม — เซ็นลงนาม Default",
          "Who: กบค. ใช้บันทึกผลตรวจและข้อมูลผู้ลงนาม; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลตามขอบเขตของตน",
          "Do: เปิดพื้นที่ลงนามและเริ่มวาดลายเซ็น"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม ยังไม่พบเฟรม modal ลายเซ็นว่างแยกเฉพาะ ส่วน prototype ปัจจุบันยังลงชื่อจากรายชื่อ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มกล่องวาดลายเซ็นว่างพร้อมชื่อ/บทบาทของฝ่ายที่กด และปุ่มบันทึก disable เมื่อยังไม่มีเส้นวาด; ต้องพัฒนา canvas เพิ่ม",
          "NEW — เพิ่ม behavior ปิด/×/Esc/พื้นหลัง: ทิ้งภาพ ข้อมูลที่ยังไม่บันทึก แล้วกลับ I.2 ฝ่ายเดิม โดยคลิก/วาดในกล่องไม่ทำให้ modal ปิด"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เช็กรายการตรวจรับทีละข้อ; สิ่งที่เลือกต้องไม่หายเมื่อเปิดช่องลงนาม\n  - เลือกรายชื่อผู้ลงนามตามที่หน้าจอกำหนด\n  - ข้อจำกัดที่พบ: หน้าตรวจรับรถ (StepReceive) ใน prototype ลงชื่อจากรายชื่อ ยังไม่มี กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้) วาดลายเซ็นตาม I.3 จึงเป็นพฤติกรรมที่จะนำจาก กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้) มาใช้ ไม่ใช่ยืนยันว่า signature component ทำไว้ครบแล้ว",
          "Signature\n  - วาดลายเซ็นได้ ลบแล้วเซ็นใหม่ได้; ช่องลายเซ็นว่างต้องไม่นับว่าเซ็นแล้ว\n  - ยืนยันรับรถได้เมื่อข้อมูลตรวจและลายเซ็นครบตามกติกาในจอ\n  - พื้นที่วาดลายเซ็น: เริ่มว่าง รองรับการลากวาดด้วยเมาส์/สัมผัสตามอุปกรณ์ที่ใช้; วาดอยู่ต้องไม่ลากทั้ง กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้) หรือเลื่อนหน้าพื้นหลังไปพร้อมกัน",
          "Modal\n  - กด \"เซ็นลงนาม\" modal \"เซ็นลงนาม\" แสดงกล่องชื่อผู้เซ็น (\"ผู้ส่งมอบรถ / นาย อนุชิต ลิ้มกิมฮวย\") และพื้นที่วาดลายเซ็นว่าง ปุ่ม \"ปิด\" / \"บันทึก\" (disable) และ ×\n  - กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้) “เซ็นลงนาม”: แสดงชื่อและบทบาทของฝ่ายที่กด ไม่หยิบชื่ออีกฝ่าย\n  - ข้อเสนออ้าง กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้): “ปิด”/×/คลิกพื้นหลัง/Esc ปิดเฉพาะกล่องลายเซ็นแล้วกลับ I.2 ฝ่ายเดิม โดยไม่บันทึกภาพ ข้อมูลที่ยังไม่บันทึก; คลิก/วาดในกล่องต้องไม่ปิดตามพื้นหลัง",
          "Buttons\n  - ปุ่ม “บันทึก”: disable เมื่อพื้นที่ว่าง; “ปิด”/× ปิดโดยไม่บันทึกลายเซ็น ข้อมูลที่ยังไม่บันทึก"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "แตะพื้นที่ว่างโดยยังไม่มีเส้นวาด: ยังไม่เปิดปุ่มบันทึกเป็นลายเซ็นที่ใช้ได้",
          "ปิดกล่องขณะยังไม่บันทึก: ทิ้งเฉพาะภาพ ข้อมูลที่ยังไม่บันทึก และคง checklist/ชื่อผู้เซ็น ไม่แสดงสถานะเซ็นแล้ว"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: กด \"เซ็นลงนาม\" ก่อนเลือกชื่อได้ไหม (แนะนำ disable จนกว่าจะเลือก), มีปุ่มล้างลายเซ็นในกล่องไหม"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "I.4": {
    "title": "AC I.4 — เซ็นลงนาม Filled",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: บันทึกการตรวจรับรถเข้าอู่และการลงนาม — เซ็นลงนาม Filled",
          "Who: กบค. ใช้บันทึกผลตรวจและข้อมูลผู้ลงนาม; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลตามขอบเขตของตน",
          "Do: ตรวจลายเซ็น ล้างเพื่อเซ็นใหม่ หรือยืนยัน"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม ยังไม่พบ state มีภาพลายเซ็นใน modal ก่อนบันทึกแยกไว้"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม state วาดแล้ว: บันทึกพร้อมภาพ ผู้เซ็น เวลา และฝ่ายที่ถูกต้อง; แค่แตะพื้นที่ว่างไม่ถือว่าเซ็น",
          "NEW — เพิ่มปิดโดยไม่บันทึก: กลับ I.2/I.5 ไม่เปลี่ยนหลักฐานที่เคยบันทึกไว้ และไม่ขึ้นเซ็นแล้วจากภาพ ข้อมูลที่ยังไม่บันทึก"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เช็กรายการตรวจรับทีละข้อ; สิ่งที่เลือกต้องไม่หายเมื่อเปิดช่องลงนาม\n  - เลือกรายชื่อผู้ลงนามตามที่หน้าจอกำหนด",
          "Signature\n  - วาดลายเซ็นได้ ลบแล้วเซ็นใหม่ได้; ช่องลายเซ็นว่างต้องไม่นับว่าเซ็นแล้ว\n  - ยืนยันรับรถได้เมื่อข้อมูลตรวจและลายเซ็นครบตามกติกาในจอ\n  - วาดลายเซ็นในกล่อง ปุ่ม \"บันทึก\" enable\n  - พื้นที่วาดลายเซ็น: เมื่อมีเส้นวาดให้เปิดปุ่มบันทึก ไม่ถือการแตะพื้นที่ว่างว่าได้เซ็นแล้ว",
          "Modal\n  - กด \"บันทึก\" ปิด modal ฝั่งนั้นเป็นสถานะเซ็นแล้ว · \"ปิด\" ปิดโดยไม่บันทึกลายเซ็น\n  - ข้อเสนอใช้ กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้) สำหรับลายเซ็น: “ปิด”/×/พื้นหลัง/Esc ทิ้งเฉพาะภาพที่ยังไม่บันทึกและกลับ checklist I.2/I.5; “บันทึก” สำเร็จแล้วจึงเปลี่ยนสถานะฝ่ายนั้น; signature canvas ยังไม่พบใน prototype",
          "Buttons\n  - ปุ่ม “บันทึก”: เก็บภาพ ผู้เซ็น เวลา และฝ่ายที่ถูกต้อง แล้วปิด กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้)\n  - ปุ่ม “ปิด”: ทิ้งภาพที่ยังไม่ได้บันทึก ไม่เปลี่ยนสถานะฝ่ายนั้นเป็นเซ็นแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "บันทึกลายเซ็นไม่สำเร็จ: คงภาพ ข้อมูลที่ยังไม่บันทึก ให้ลองใหม่ ไม่เปลี่ยนฝ่ายนั้นเป็นเซ็นแล้วหรือปิดกล่องเป็นสำเร็จ",
          "กดบันทึกเร็วหลายครั้ง: เก็บภาพให้ฝ่ายเดิมครั้งเดียว ไม่สลับภาพ/ผู้เซ็นกับอีก modal"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "I.5": {
    "title": "AC I.5 — Filled ตรวจ + เซ็น 2 ฝ่าย",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: บันทึกการตรวจรับรถเข้าอู่และการลงนาม — Filled ตรวจ + เซ็น 2 ฝ่าย",
          "Who: กบค. ใช้บันทึกผลตรวจและข้อมูลผู้ลงนาม; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลตามขอบเขตของตน",
          "Do: ตรวจผลตรวจรับและลายเซ็นทั้งสองฝ่ายก่อนบันทึกตามเงื่อนไข"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีจอเซ็นสองฝ่ายภายใต้ I.2 แต่ไม่ครบ behavior แก้ลายเซ็น/เปลี่ยนชื่อ/ยืนยันซ้ำ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior แก้ลงนามรายฝ่าย: ปิดโดยไม่บันทึกคงภาพเดิม ส่วนเปลี่ยนชื่อผู้เซ็นหลังเซ็นแล้วต้องตกลงการล้างภาพ",
          "NEW — เพิ่ม behavior ยืนยันรับรถ: กันกดซ้ำและไปกำลังซ่อมหลังผลบันทึกจริง ไม่เลื่อนขั้นจากการปิด modal"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เช็กรายการตรวจรับทีละข้อ; สิ่งที่เลือกต้องไม่หายเมื่อเปิดช่องลงนาม\n  - เลือกรายชื่อผู้ลงนามตามที่หน้าจอกำหนด",
          "Signature\n  - วาดลายเซ็นได้ ลบแล้วเซ็นใหม่ได้; ช่องลายเซ็นว่างต้องไม่นับว่าเซ็นแล้ว\n  - ยืนยันรับรถได้เมื่อข้อมูลตรวจและลายเซ็นครบตามกติกาในจอ",
          "Buttons\n  - เซ็นครบทั้งสองฝ่าย ใต้แต่ละชื่อแสดง \"เซ็นลงนามแล้ว\" และปุ่ม \"แก้ไขลงนาม\" และปุ่ม \"ยืนยันรับรถ\" enable (โน้ตในจอ)\n  - ข้อความ “เซ็นลงนามแล้ว” และปุ่ม “แก้ไขลงนาม”: แสดงแยกสองฝ่าย เปิด กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้) ฝ่ายที่เลือก\n  - ปุ่ม “ยืนยันรับรถ”: enable เมื่อครบเงื่อนไขที่ตกลงแล้ว; pending กันกดซ้ำ\n  - ปุ่ม “แก้ไขลงนาม” เปิดกล่องของฝ่ายนั้น; ปิดกล่องโดยไม่บันทึกให้กลับ I.5 และเก็บลายเซ็นที่เคยบันทึกไว้ ไม่ใช้ภาพ ข้อมูลที่ยังไม่บันทึก แทนหลักฐานเดิม (แนวทางจาก กล่อง “เซ็นลงนาม” (Modal — แนวทางนำไปใช้) ต้องนำไปทำใน signature component)",
          "Modal\n  - กด \"แก้ไขลงนาม\" เปิด modal เซ็นลงนามใหม่ (I.3)",
          "Stepper\n  - กด \"ยืนยันรับรถ\" สถานะรถเป็น \"กำลังซ่อม\" stepper ไปขั้น 03\n  - แถบขั้นตอน 6 ขั้น (Stepper)/ป้ายรายการที่เลือก: ไปกำลังซ่อมหลังยืนยันสำเร็จจริง; การเปลี่ยนชื่อแล้วล้างลายเซ็นต้องตกลงก่อน",
          "Status (StatusBadge)\n  - toast \"ยืนยันรับรถสำเร็จ\" (ปิด ⚠️ toast ที่ขาดด้านบน) · Notification ข้อความเดียวกันถึงหน่วยงานเจ้าของรถ · Status → \"กำลังซ่อม\" · บันทึกไม่สำเร็จใช้ \"General Error\" (#26) [Sheet พี่นุ — OH-Toast #17, ✅ CF]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เปลี่ยนผู้ลงนามหลังมีภาพเซ็น: ห้ามยืนยันรับรถโดยชื่อใหม่ยังผูกภาพคนเดิม ต้องตกลงว่าจะล้างภาพหรือบังคับเซ็นใหม่",
          "ยืนยันรับรถล้มเหลว: คงผลตรวจและลายเซ็นที่บันทึกแล้ว ไม่เลื่อนไปกำลังซ่อมหรือบังคับเซ็นใหม่ทั้งหมด"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ไม่มีเฟรมผลหลังกด \"ยืนยันรับรถ\" (toast สำเร็จ/ไม่สำเร็จ, modal ยืนยัน) ต้องเคาะ แนะนำ toast \"ยืนยันรับรถสำเร็จ\" และใช้กติกา error กลาง",
          "ต้องเคาะ: เปลี่ยนชื่อผู้เซ็นหลังเซ็นแล้ว ลายเซ็นเดิมต้องล้างไหม (แนะนำล้าง), หลังยืนยันกลับมาดูขั้น 02 เป็นอ่านอย่างเดียวไหม"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / I.2 · S8 — ตรวจครบ + ลงนาม 2 ฝ่าย"
      ]
    }
  },
  "J.1": {
    "title": "AC J.1 — ยังไม่มีความคืบหน้า",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: เพิ่มและติดตามความคืบหน้าการซ่อมรถ — ยังไม่มีความคืบหน้า",
          "Who: กบค. ใช้บันทึกความคืบหน้า; ผู้มีสิทธิ์ดูใช้ติดตามรถในขอบเขตของตน",
          "Do: ดูสถานะยังไม่มีความคืบหน้าและเริ่มเพิ่มรายการ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีไม่มีความคืบหน้าและปุ่มเพิ่ม แต่ไม่แยก empty จากโหลดผิดพลาดกับเงื่อนไขซ่อมสำเร็จที่อ้างข้อมูลจริง"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior state ว่าง: แสดงเมื่อโหลดสำเร็จแล้วไม่มีรายการ ไม่ใช้แทน loading/error หรือคงแถวเก่า",
          "NEW — เพิ่ม action: ปุ่มเพิ่มเปิด J.2 ปุ่มซ่อมสำเร็จยังไม่พร้อมเมื่อยังไม่มีรายการที่บันทึกจริง"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - แสดงรายการความคืบหน้าที่บันทึกไว้ตามลำดับในจอ\n  - เมื่อเพิ่มหรือแก้ไข ให้เปิดช่องพร้อมค่าที่เกี่ยวข้องและตรวจข้อมูลจำเป็น\n  - บันทึกสำเร็จแล้วรายการต้องอัปเดต; บันทึกไม่สำเร็จให้คงข้อความไว้\n  - หากลบ ให้ถามยืนยันก่อน และไม่ให้รายการหายจนระบบยืนยันสำเร็จ\n  - ไม่มี notification [Sheet พี่นุ]",
          "Stepper\n  - สถานะ \"กำลังซ่อม\" ยังไม่มีรายการ stepper ขั้น 01–02 เป็นเครื่องหมายถูก ขั้น 03 \"ติดตามงานซ่อม\" ปัจจุบัน",
          "Buttons\n  - ส่วน \"รายละเอียดการติดตาม\" มีปุ่ม \"+ ความคืบหน้า\" และ empty \"ยังไม่มีความคืบหน้า\" ข้อความรอง \"เพิ่มความคืบหน้าอย่างน้อย 1 รายการก่อนกด \"ซ่อมสำเร็จ\"\"\n  - ปุ่ม \"ย้อนกลับ\" / \"ซ่อมสำเร็จ\" (disable)\n  - ปุ่ม “+ ความคืบหน้า”: เปิดกล่องเพิ่มความคืบหน้า J.2\n  - ปุ่ม “ซ่อมสำเร็จ”: disable ขณะยังไม่มีรายการ จึงยังไม่เปลี่ยนหน้าหรือขั้นตอน",
          "Table (DataTable)\n  - Behavior\n    - ตารางความคืบหน้า (OH-5, ✅ CF): วันที่/เวลา, รายละเอียด, ผู้บันทึก (เพิ่ม — ใครก็ได้ที่มีสิทธิ์ในงานนี้), รูป/ไฟล์แนบ (เพิ่ม — TOR 7.4.2-05 ต้องมีรูปก่อนและระหว่างซ่อม เปิดดูแบบ Lightbox), จัดการ (ICON Action แก้ไข · ลบ ลบได้เมื่อมีมากกว่า 1 รายการ) [Sheet พี่นุ]\n  - Sorting\n    - Sorting (เสนอ รอ confirm): ล่าสุดก่อน [Sheet พี่นุ]",
          "Status (StatusBadge)\n  - Status: \"กำลังซ่อม\" [Sheet พี่นุ]",
          "Empty State (EmptyState)\n  - ส่วนแสดงเมื่อไม่มีข้อมูล ความคืบหน้า: แสดงเมื่อยังไม่มีรายการ ไม่แสดงตารางเก่าค้าง"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "เพิ่ม/แก้ไข/ลบ เฉพาะ กบค. role อื่นดูอย่างเดียว [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "โหลดความคืบหน้าไม่สำเร็จ: ไม่ใช้ข้อความยังไม่มีความคืบหน้าแทน error และไม่เปิดซ่อมสำเร็จจากรายการเก่าค้าง",
          "ปิด popup เพิ่มโดยไม่บันทึก: กลับจอว่างเดิม ไม่เพิ่มแถวหรือเปิดปุ่มซ่อมสำเร็จจาก ข้อมูลที่ยังไม่บันทึก ที่ทิ้งไป"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "mock J–L ยังไม่มีคอลัมน์ผู้บันทึก และ popup J.2/K.2 ไม่มีช่องแนบรูป/ไฟล์ ต้องเพิ่มใน mock และเคาะ ชนิดไฟล์ จำนวนสูงสุด บังคับแนบไหม",
          "Sort ที่ Sheet เสนอ (ล่าสุดก่อน) ขัดกับ mock (เก่า→ใหม่) ต้องเลือกแบบเดียว",
          "\"ผู้บันทึก = ใครก็ได้ที่มีสิทธิ์\" แต่สิทธิ์แก้ไขมีแค่ กบค. จึงเท่ากับ กบค. ต้องยืนยันว่าอู่หรือหน่วยงานไม่ได้บันทึกเอง"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / J.1 · S9 — ยังไม่มีความคืบหน้า"
      ]
    }
  },
  "J.2": {
    "title": "AC J.2 — เพิ่มความคืบหน้า",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: เพิ่มและติดตามความคืบหน้าการซ่อมรถ — เพิ่มความคืบหน้า",
          "Who: กบค. ใช้บันทึกความคืบหน้า; ผู้มีสิทธิ์ดูใช้ติดตามรถในขอบเขตของตน",
          "Do: กรอกรายละเอียดความคืบหน้าแล้วบันทึกหรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มี popup เพิ่มความคืบหน้าและยกเลิก แต่ยังไม่ครบ behavior คลิกพื้นที่นอกแผงหรือกด Esc เพื่อปิด กับ ข้อมูลที่ยังไม่บันทึก"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ยกเลิก/×/Esc/พื้นหลัง: ปิด popup กลับ J.1/J.3 โดยไม่บันทึก textarea; คลิกใน popup ไม่ปิด",
          "CHANGE — แสดงช่องรายละเอียดความคืบหน้าและหมายเหตุ โดยไม่มีช่องวันที่/เวลา ไม่ยกฟิลด์วันที่/เวลาจาก prototype มาเพิ่มโดยไม่มีข้อสรุป"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - แสดงรายการความคืบหน้าที่บันทึกไว้ตามลำดับในจอ\n  - เมื่อเพิ่มหรือแก้ไข ให้เปิดช่องพร้อมค่าที่เกี่ยวข้องและตรวจข้อมูลจำเป็น\n  - บันทึกสำเร็จแล้วรายการต้องอัปเดต; บันทึกไม่สำเร็จให้คงข้อความไว้\n  - หากลบ ให้ถามยืนยันก่อน และไม่ให้รายการหายจนระบบยืนยันสำเร็จ\n  - กรอกรายละเอียด (เช่น \"รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน\") แล้วกด \"บันทึก\" ปิด popup เพิ่มแถวในตาราง\n  - \"ยกเลิก\" หรือ × ปิด popup ไม่บันทึก\n  - ข้อแตกต่างของ prototype: หน้าติดตามความคืบหน้า (StepProgress) ยังมีวันที่/เวลา แต่ AC ปัจจุบันไม่มี จึงไม่นำช่องนี้มาเพิ่มใน AC; ถ้าต้องการถามก่อนทิ้งข้อความที่แก้ใน กล่องกรอกข้อมูลกลางจอ ต้องเพิ่ม guard เพราะ กล่อง “เพิ่มความคืบหน้า” (Modal) ปัจจุบันปิดทันที",
          "Buttons\n  - กด \"+ ความคืบหน้า\" popup \"เพิ่มความคืบหน้า\" มี × ปุ่ม \"ยกเลิก\" / \"บันทึก\"\n  - ปุ่มบันทึก/ปิด กล่องกรอกข้อมูลกลางจอ: กันกดซ้ำตอนส่ง และเก็บค่าที่กรอกเมื่อส่งไม่สำเร็จ; ไม่เพิ่ม date/time ช่องกรอก ที่จอไม่มี",
          "Form Fields\n  - ช่องกรอกข้อความหลายบรรทัด (TextArea) รายละเอียดการติดตาม: กรอกข้อความหลายบรรทัดและตรวจค่าว่างตามข้อความ error ที่ตกลง\n  - ช่องกรอก หมายเหตุ: เป็น optional ไม่ใช้เป็นเงื่อนไขบังคับบันทึก",
          "Modal\n  - จาก กล่อง “เพิ่มความคืบหน้า” (Modal) + หน้าติดตามความคืบหน้า (StepProgress): “ยกเลิก”, ×, คลิกพื้นหลังหรือ Esc → ปิด กล่องกรอกข้อมูลกลางจอ แล้วกลับ J.1/J.3 ที่อยู่ด้านหลัง โดยไม่บันทึก textarea; คลิกภายใน กล่องกรอกข้อมูลกลางจอ ไม่ปิด; บันทึกสำเร็จจึงปิดและโหลดแถวใหม่"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "รายละเอียดว่างหรือมีแต่ช่องว่าง: ไม่บันทึกเป็นความคืบหน้าว่าง และคงหมายเหตุที่กรอกไว้",
          "บันทึกไม่สำเร็จ: คงข้อความใน popup ให้ลองใหม่ และไม่เพิ่มแถว/วันที่ปลอมลงตารางก่อนผลจริง"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / J.2 · S9 — เพิ่มความคืบหน้า"
      ]
    }
  },
  "J.3": {
    "title": "AC J.3 — เพิ่มความคืบหน้าสำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: เพิ่มและติดตามความคืบหน้าการซ่อมรถ — เพิ่มความคืบหน้าสำเร็จ",
          "Who: กบค. ใช้บันทึกความคืบหน้า; ผู้มีสิทธิ์ดูใช้ติดตามรถในขอบเขตของตน",
          "Do: ดูรายการความคืบหน้าที่เพิ่มสำเร็จ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีรายการความคืบหน้าหลังเพิ่ม แต่ไม่แยกการสร้างแถวจริงกับ ข้อมูลที่ยังไม่บันทึก/การแสดงซ้ำจาก retry"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ตาราง: เพิ่มเฉพาะแถวที่บันทึกสำเร็จ มีวันที่/รายละเอียด/หมายเหตุตรงผลจริง และไม่ซ้ำจาก retry",
          "NEW — เพิ่มเงื่อนไขซ่อมสำเร็จ: ใช้จำนวนรายการจาก server ไม่ใช้ข้อความที่ยังอยู่ใน popup เป็นรายการครบแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ปรับรายการหรือรายละเอียดล่าสุดให้เห็นตรงกับข้อมูลที่บันทึก\n  - ไม่ให้กดยืนยันซ้ำขณะกำลังส่งข้อมูล\n  - toast \"เพิ่มความคืบหน้าสำเร็จ\" (ปิด ⚠️ toast ด้านบน) · ไม่สำเร็จใช้ \"General Error\" (#26) [Sheet พี่นุ — OH-Toast #18, ✅ CF]\n  - icon แก้ไข/ลบในแถว: จับรายการของแถวนั้นให้ถูกต้อง",
          "Status (StatusBadge)\n  - เมื่อระบบยืนยันว่าทำสำเร็จ จึงเปลี่ยนหน้า/สถานะและแสดงข้อความสำเร็จ",
          "Table (DataTable)\n  - Behavior\n    - ตารางแสดงแถวใหม่ \"22/10/2569 10:00 น. | รื้อเครื่องยนต์ ตรวจสภาพชิ้นส่วนภายใน | -\" ปุ่ม \"ซ่อมสำเร็จ\" enable\n    - ตารางความคืบหน้า: เพิ่มแถวที่ server บันทึกแล้ว พร้อมวันที่ รายละเอียด หมายเหตุ",
          "Buttons\n  - ปุ่ม “ซ่อมสำเร็จ”: เปิดตามจำนวนรายการที่ใช้ได้จริง ไม่ใช้แค่แถว ข้อมูลที่ยังไม่บันทึก ใน กล่องกรอกข้อมูลกลางจอ"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เพิ่มสำเร็จแต่โหลดตารางล้มเหลว: ให้ลองโหลดรายการ ไม่ส่งเพิ่มความคืบหน้าซ้ำ",
          "อีกหน้าจอเปลี่ยนสถานะรถก่อนกดซ่อมสำเร็จ: ตรวจสถานะล่าสุดและจำนวนรายการจริง ไม่ปิดขั้นจากปุ่มที่ค้างอยู่"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "เฟรมไม่มี toast ต้องเคาะ (แนะนำ \"เพิ่มความคืบหน้าสำเร็จ\" ให้คู่กับ L.3) และกรณีบันทึกไม่สำเร็จใช้กติกา error กลาง popup ไม่ปิด"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / J.3 · S9 — มีความคืบหน้า 2 รายการ"
      ]
    }
  },
  "K.1": {
    "title": "AC K.1 — แก้ไขรายละเอียดการติดตาม",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขรายละเอียดการติดตามงานซ่อม — แก้ไขรายละเอียดการติดตาม",
          "Who: กบค. ใช้แก้ไขรายการติดตามหรือหมายเหตุ",
          "Do: เปิดรายการติดตามที่ต้องการแก้ไข"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีแก้ไขความคืบหน้า แต่ไม่แยกการเลือกicon เป้าหมายหลังตารางเปลี่ยนเป็น behavior ราย action"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ดินสอท้ายแถว: เปิดข้อมูล ID แถวนั้น ไม่เปลี่ยนแถวอื่นหลัง sort/refetch",
          "NEW — เพิ่มผลปิดเมนู/ยกเลิกก่อนแก้: ไม่เปลี่ยนรายการหรือเปิด popup ซ้ำจาก event ค้าง"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - แสดงรายการความคืบหน้าที่บันทึกไว้ตามลำดับในจอ\n  - เมื่อเพิ่มหรือแก้ไข ให้เปิดช่องพร้อมค่าที่เกี่ยวข้องและตรวจข้อมูลจำเป็น\n  - บันทึกสำเร็จแล้วรายการต้องอัปเดต; บันทึกไม่สำเร็จให้คงข้อความไว้\n  - หากลบ ให้ถามยืนยันก่อน และไม่ให้รายการหายจนระบบยืนยันสำเร็จ\n  - กดicon ดินสอที่แถว เปิด popup แก้ไข (K.2)\n  - icon ดินสอในตารางความคืบหน้า: เปิด กล่องกรอกข้อมูลกลางจอ ของรายการที่กด พร้อมค่าปัจจุบัน\n  - รายการแถวอื่น: ไม่ถูกแก้หรือเปิด กล่องกรอกข้อมูลกลางจอ ซ้ำเมื่อโหลดตารางใหม่",
          "Table (DataTable)\n  - Row Actions (RowMenu)\n    - จาก icon ดินสอท้ายแถวความคืบหน้า: เปิดแก้ไขต้องจำ ID รายการ; กดนอกเมนู/Esc ก่อนเลือกแก้ไข → แค่ปิดเมนู ไม่เปลี่ยนข้อมูลหรือเปิด กล่องกรอกข้อมูลกลางจอ"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "รายการเปลี่ยนลำดับหลังเปิดหน้า: icon แก้ไขต้องอ้างรายการ ID เดิม ไม่ใช้ index ไปเปิดแถวอื่น",
          "รายการถูกลบจากอีกหน้าจอก่อนเปิดแก้: แจ้งไม่พบและโหลดตารางใหม่ ไม่เปิด popup ว่างให้บันทึกเพิ่มแทน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / K.1 · S10 — แก้ไขความคืบหน้า"
      ]
    }
  },
  "K.2": {
    "title": "AC K.2 — แก้ไขรายละเอียดการติดตาม or หมายเหตุ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขรายละเอียดการติดตามงานซ่อม — แก้ไขรายละเอียดการติดตาม or หมายเหตุ",
          "Who: กบค. ใช้แก้ไขรายการติดตามหรือหมายเหตุ",
          "Do: ปรับรายละเอียดหรือหมายเหตุแล้วบันทึกหรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มี flow แก้ไขโดยรวม แต่ยังไม่พบ state popup แก้รายละเอียด/หมายเหตุแยกตรงรหัสนี้"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มเฟรม ข้อมูลที่ยังไม่บันทึก แก้ไข: เติมค่าเดิมใน textarea/หมายเหตุและแยก ข้อมูลที่ยังไม่บันทึก จากแถวที่บันทึกแล้ว",
          "NEW — เพิ่ม behavior ปิด popup: ยกเลิก/×/Esc/พื้นหลังกลับตาราง K.1 โดยคงค่าเดิม; บันทึกอ้าง ID เดิม ไม่เพิ่มเป็นรายการใหม่"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - แสดงรายการความคืบหน้าที่บันทึกไว้ตามลำดับในจอ\n  - เมื่อเพิ่มหรือแก้ไข ให้เปิดช่องพร้อมค่าที่เกี่ยวข้องและตรวจข้อมูลจำเป็น\n  - บันทึกสำเร็จแล้วรายการต้องอัปเดต; บันทึกไม่สำเร็จให้คงข้อความไว้\n  - หากลบ ให้ถามยืนยันก่อน และไม่ให้รายการหายจนระบบยืนยันสำเร็จ",
          "Buttons\n  - popup \"แก้ไขรายละเอียดการติดตาม\" เติมค่าเดิม แก้รายละเอียดหรือหมายเหตุได้ ปุ่ม \"ยกเลิก\" / \"บันทึก\"\n  - ปุ่มบันทึก: ส่ง ID รายการเดิม ไม่เพิ่มเป็นแถวใหม่; ปิดโดยไม่บันทึกต้องไม่เปลี่ยนตาราง",
          "Form Fields\n  - ช่องกรอกข้อความหลายบรรทัด (TextArea) รายละเอียดและ ช่องกรอก หมายเหตุใน กล่องกรอกข้อมูลกลางจอ แก้ไข: เติมค่าเดิม แล้วเก็บ ข้อมูลที่ยังไม่บันทึก แยกจากแถวที่บันทึกแล้ว",
          "Modal\n  - จาก กล่อง “แก้ไขความคืบหน้า” (Modal) + หน้าติดตามความคืบหน้า (StepProgress): “ยกเลิก”, ×, พื้นหลังทึบ/Esc → ปิด กล่องกรอกข้อมูลกลางจอ แล้วกลับตารางความคืบหน้า K.1 โดยแถวเดิมยังเป็นค่าก่อนแก้; “บันทึก” สำเร็จจึงปรับแถวเดิม ไม่สร้างแถวใหม่"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "อีกคนแก้รายการเดียวกันระหว่างกรอก: แจ้งให้ตรวจค่าล่าสุด ไม่ทับการแก้อื่นเงียบ ๆ และเก็บ ข้อมูลที่ยังไม่บันทึก ที่กำลังแก้ไว้เทียบ",
          "แก้แล้วบันทึกไม่สำเร็จ: ไม่อัปเดตแถวเดิมเป็นค่าใหม่ ให้ลองส่งรายการ ID เดิม ไม่เพิ่มเป็นแถวซ้ำ"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "K.3": {
    "title": "AC K.3 — Update การแก้ไข",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แก้ไขรายละเอียดการติดตามงานซ่อม — Update การแก้ไข",
          "Who: กบค. ใช้แก้ไขรายการติดตามหรือหมายเหตุ",
          "Do: ดูรายการติดตามที่อัปเดตหลังบันทึก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม ยังไม่พบเฟรมผลหลังแก้ไขสำเร็จแยกจาก flow แก้ไข"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มเฟรมผลสำเร็จ: แถวเดิมแสดงค่าที่แก้จริงโดยไม่เพิ่มซ้ำ และ toast แสดงหลังบันทึก",
          "NEW — เพิ่มข้อกำหนดวันที่ของแถวที่แก้: ต้องตกลงคงเวลาสร้างหรือแสดงเวลาแก้ ไม่เปลี่ยนเองจากการ refresh"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - แสดงรายการความคืบหน้าที่บันทึกไว้ตามลำดับในจอ\n  - เมื่อเพิ่มหรือแก้ไข ให้เปิดช่องพร้อมค่าที่เกี่ยวข้องและตรวจข้อมูลจำเป็น\n  - บันทึกสำเร็จแล้วรายการต้องอัปเดต; บันทึกไม่สำเร็จให้คงข้อความไว้\n  - หากลบ ให้ถามยืนยันก่อน และไม่ให้รายการหายจนระบบยืนยันสำเร็จ\n  - กด \"บันทึก\" แถวในตารางแสดงค่าใหม่ (เช่น \"ข้อความทดสอบการแก้ไข\") ลำดับแถวไม่เปลี่ยน\n  - toast \"แก้ไขความคืบหน้าสำเร็จ\" (ปิด ⚠️ toast ด้านบน) [Sheet พี่นุ — OH-Toast #19, ✅ CF]\n  - ข้อความแจ้งผลมุมขวาบน แก้ไขสำเร็จ: แสดงหลัง server สำเร็จ; ต้องตกลงวันที่ในแถวว่าจะคงเวลาสร้างหรือเปลี่ยนเป็นเวลาแก้ไข",
          "Table (DataTable)\n  - Behavior\n    - ตารางความคืบหน้า: เปลี่ยนเฉพาะรายการที่บันทึกแก้ ไม่เพิ่มแถวซ้ำ"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "บันทึกแก้สำเร็จแต่โหลดรายการใหม่ล้มเหลว: retry การโหลดอย่างเดียว ไม่ส่งแก้ซ้ำ",
          "กลับมาอ่านผลแก้อีกครั้ง: ไม่ยิง toast ซ้ำ และวันที่/หมายเหตุต้องอ้างรายการที่แก้จริงไม่ใช่แถวข้างเคียง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ไม่มี toast ต้องเคาะ (แนะนำ \"แก้ไขรายละเอียดการติดตาม สำเร็จ\") และแก้ไขไม่มี modal ยืนยัน ต่างจากแก้ไขแผน/PO"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "L.1": {
    "title": "AC L.1 — ลบรายละเอียดการติดตาม",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ลบรายละเอียดการติดตามงานซ่อม — ลบรายละเอียดการติดตาม",
          "Who: กบค. ใช้เลือกรายการและยืนยันการลบ",
          "Do: เลือกรายการติดตามที่จะลบ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีicon ลบความคืบหน้า แต่ไม่แยกจำนวนรายการล่าสุดกับการจำเป้าหมายหลังตารางเปลี่ยน"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ถังขยะท้ายแถว: จำ ID ก่อนเปิด L.2 และไม่ลบจากการเพียงเปิดกล่อง",
          "NEW — เพิ่มการตรวจห้ามลบจนเหลือศูนย์จากจำนวนล่าสุด ไม่ใช้จำนวนที่ค้างตอนเปิดหน้า"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดยกเลิก ปิดหน้าต่างโดยไม่เปลี่ยนข้อมูล\n  - กดยืนยันเพียงครั้งเดียวแล้วรอผล; ถ้าไม่สำเร็จต้องไม่แสดงว่าลบ/แก้ไขแล้ว\n  - icon ถังขยะในตาราง: ผูก ID ของรายการที่จะลบก่อนเปิด L.2\n  - เงื่อนไขลบ: ตรวจจำนวนรายการตามกติกาที่ห้ามลบจนเหลือศูนย์ ไม่เปิด action ให้ทำเกินเงื่อนไข",
          "Buttons\n  - กดปุ่มลบหรือแก้ไขแล้วให้เปิดหน้าต่างยืนยันตามจอ",
          "Modal\n  - มีความคืบหน้า 2 รายการขึ้นไป (โน้ต \"ลบได้เมื่อมี 2 รายการขึ้นไป\") กดicon ถังขยะ เปิด modal ยืนยัน (L.2)"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เหลือความคืบหน้าหนึ่งรายการ: ไม่เปิดลบจนเหลือศูนย์ตามกติกา แม้ปุ่มเก่าจะยังอยู่หลัง refetch",
          "กดถังขยะแล้วตารางเปลี่ยนลำดับ: กล่องที่เปิดต้องยังอ้าง ID รายการเดิม"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / L.1 · S11 — ลบการติดตาม"
      ]
    }
  },
  "L.2": {
    "title": "AC L.2 — ยืนยันการลบรายละเอียดการติดตาม",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ลบรายละเอียดการติดตามงานซ่อม — ยืนยันการลบรายละเอียดการติดตาม",
          "Who: กบค. ใช้เลือกรายการและยืนยันการลบ",
          "Do: ตรวจรายการ ยืนยันลบ หรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีจอยืนยันลบ และมีรหัส L.2 ซ้ำกับจอเหลือหนึ่งรายการ จึงต้องดูชื่อ state ไม่จับจากรหัสเดียว"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior กล่องยืนยัน: ยกเลิก/×/Esc/พื้นหลังกลับ L.1 พร้อมรายการครบเดิม; ยืนยันส่งลบ ID เดิมเพียงครั้งเดียว",
          "NEW — เพิ่มตรวจจำนวนล่าสุดก่อนลบเพื่อกันสองหน้าจอลบจนไม่เหลือรายการ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - กดยกเลิก ปิดหน้าต่างโดยไม่เปลี่ยนข้อมูล\n  - กดยืนยันเพียงครั้งเดียวแล้วรอผล; ถ้าไม่สำเร็จต้องไม่แสดงว่าลบ/แก้ไขแล้ว",
          "Buttons\n  - กดปุ่มลบหรือแก้ไขแล้วให้เปิดหน้าต่างยืนยันตามจอ\n  - ปุ่มยกเลิก: ปิดโดยไม่ลบ; ยืนยัน: กันส่งซ้ำและตรวจจำนวนรายการล่าสุดอีกครั้ง",
          "Modal\n  - modal \"ยืนยันการลบ\" ข้อความ \"เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่\" ปุ่ม \"ยกเลิก\" / \"ยืนยัน\" (สีแดง)\n  - กล่องโต้ตอบกลางจอ (Modal) ยืนยันลบความคืบหน้า: คงรายการเป้าหมายไว้แม้ตารางเปลี่ยนระหว่างเปิด\n  - จาก กล่องยืนยันลบความคืบหน้า (ConfirmDialog) + หน้าติดตามความคืบหน้า (StepProgress): “ยกเลิก”, ×, คลิกพื้นหลัง/Esc → ปิดกล่องแล้วกลับตาราง L.1 พร้อมรายการครบเดิม; กด “ยืนยัน” จึงลบรายการเป้าหมาย; คลิกในกล่องไม่ปิด"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "อีกคนลบรายการอื่นขณะกล่องยังเปิด: ตรวจจำนวนล่าสุดอีกครั้งก่อนยืนยัน เพื่อไม่ลบจนเหลือศูนย์",
          "ยืนยันลบไม่สำเร็จ: คงรายการเดิม ไม่เอาแถวออกก่อนทราบผล และให้ลองใหม่โดยไม่เปลี่ยนเป้าหมาย"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / L.2 · S11 — ยืนยันการลบการติดตาม"
      ]
    }
  },
  "L.3": {
    "title": "AC L.3 — ลบสำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ลบรายละเอียดการติดตามงานซ่อม — ลบสำเร็จ",
          "Who: กบค. ใช้เลือกรายการและยืนยันการลบ",
          "Do: ดูผลลบสำเร็จและรายการติดตามที่เหลือ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีผลเหลือหนึ่งรายการแต่ไม่พบเฟรมลบสำเร็จที่อ้างรหัส L.3 โดยตรง"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มเฟรมผลลบสำเร็จ: เอาเฉพาะแถวเป้าหมายออกแล้วแสดงรายการคงเหลือจริง",
          "NEW — เพิ่ม behavior ปุ่มซ่อมสำเร็จ/ลบ: คำนวณจากจำนวนหลังลบ ไม่คงสิทธิ์กดจากตารางก่อนลบ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ปรับรายการหรือรายละเอียดล่าสุดให้เห็นตรงกับข้อมูลที่บันทึก\n  - ไม่ให้กดยืนยันซ้ำขณะกำลังส่งข้อมูล\n  - ยืนยัน แถวหายจากตาราง toast \"ลบรายละเอียดการติดตาม สำเร็จ\"\n  - เหลือ 1 รายการ (โน้ต \"เหลือ 1 รายการจะลบไม่ได้\") ลบรายการสุดท้ายไม่ได้\n  - toast \"ลบความคืบหน้าสำเร็จ\" · ลบได้เมื่อมีมากกว่า 1 รายการ (OH-5 ✅ CF) [Sheet พี่นุ — OH-Toast #20, ✅ CF]",
          "Status (StatusBadge)\n  - เมื่อระบบยืนยันว่าทำสำเร็จ จึงเปลี่ยนหน้า/สถานะและแสดงข้อความสำเร็จ",
          "Table (DataTable)\n  - Behavior\n    - ตารางความคืบหน้า: เอาเฉพาะแถวที่ลบออกหลังสำเร็จ และคงรายการที่เหลือ",
          "Buttons\n  - ข้อความแจ้งผลมุมขวาบน ลบสำเร็จ/ปุ่มซ่อมสำเร็จ: อิงผลลบจริงกับจำนวนรายการล่าสุด ไม่แสดงความสำเร็จก่อนผลบันทึก"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ผลลบสำเร็จแต่ตารางโหลดไม่ขึ้น: retry รายการ ไม่ยิงลบซ้ำ",
          "ลบแล้วเหลือหนึ่งรายการ: ปิด action ลบที่ใช้ต่อไม่ได้ แต่ยังคง action ซ่อมสำเร็จตามสถานะงานจริง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "mock L.3 ยังแสดงicon ถังขยะที่แถวสุดท้าย ต้อง disable หรือซ่อนicon (และ backend ต้องปฏิเสธการลบรายการสุดท้ายด้วย)",
          "ข้อความไม่ตรงกับ mock L.3 \"ลบรายละเอียดการติดตาม สำเร็จ\" ให้ใช้ตาม Sheet"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "M.1": {
    "title": "AC M.1 — Default (ยังไม่มีเอกสาร)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แนบและตรวจเอกสารงานซ่อม — Default (ยังไม่มีเอกสาร)",
          "Who: กบค. ใช้จัดการเอกสาร; ผู้มีสิทธิ์ดูใช้ตรวจเอกสารตามขอบเขตของตน",
          "Do: ดูสถานะยังไม่มีเอกสารและเริ่มแนบไฟล์ตามสิทธิ์"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีช่อง Safety ว่าง แต่ไม่แยกยกเลิก file picker/ไฟล์ผิดชนิด/เลือกกับอัปโหลดจริง"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior เลือกไฟล์: Cancel หน้าต่างเครื่องคงรายการเดิม ไฟล์ผิดชนิดหรือเกินจำนวนไม่ถูกนับพร้อมยืนยัน",
          "NEW — รับเอกสาร Safety Inspection เป็น PDF, PNG และ JPG สูงสุด 10 ไฟล์ พร้อมแสดงสถานะอัปโหลดแต่ละไฟล์; component ปัจจุบันยังจำลอง PDF/JPG จึงต้องปรับก่อนใช้จริง"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "File Upload (FileUpload)\n  - คลิกเลือกไฟล์หรือลากวางได้ตามพื้นที่อัปโหลด\n  - รับเฉพาะไฟล์ตามชนิดที่หน้าจอกำหนด; ไฟล์ไม่ถูกต้องให้แจ้งเหตุผล\n  - เลือกแล้วแสดงชื่อไฟล์และสถานะ; ลบไฟล์ออกได้ก่อนบันทึก\n  - ไฟล์ที่บันทึกแล้วต้องเปิดดูหรือดาวน์โหลดได้ตามสิทธิ์\n  - สถานะ \"รอตรวจสภาพ Safety\" stepper ขั้น 04 \"ตรวจสภาพ\" ปัจจุบัน แสดงส่วน \"เอกสารแนบ\" ช่อง \"เอกสาร Safety Inspection\" รับ \"PDF, PNG, or JPG (สูงสุด 10 ไฟล์)\"\n  - ช่องแนบไฟล์ “เอกสาร Safety Inspection”: รับ PDF, PNG, JPG สูงสุด 10 ไฟล์; แยกเลือกไฟล์กับอัปโหลดสำเร็จ ไม่รับไฟล์ผิดชนิดหรือเกินจำนวน หากไฟล์ใดอัปโหลดไม่สำเร็จให้แสดงสถานะของไฟล์นั้นโดยไม่ลบไฟล์อื่น ขนาดสูงสุดและข้อความ error ยังต้องตกลง\n  - จาก ช่องแนบไฟล์และรายการไฟล์ (FileUpload): เลือกไฟล์แล้วกด Cancel ในหน้าต่างเลือกไฟล์ของเครื่อง → รายการเดิมไม่เปลี่ยน; ตอนนี้โค้ดตรวจ PDF/JPG และไม่อัปโหลดจริง จึงต้องเพิ่มการรับ PNG และสถานะอัปโหลดจริงให้ครบก่อนใช้จริง",
          "Buttons\n  - ปุ่ม \"ย้อนกลับ\" / \"ยืนยันการตรวจสภาพ\" (disable)\n  - ปุ่ม “ยืนยันการตรวจสภาพ”: เริ่ม disable เพราะยังไม่มีไฟล์ที่ใช้ได้\n  - ปุ่ม “ย้อนกลับ”: กลับหน้ารายละเอียด PO (E.10); หากเลือกไฟล์ไว้แต่ยังไม่บันทึก ต้องแสดงกล่องยืนยันการออกก่อน โดยให้หน้าตรวจ Safety เป็นผู้ตรวจว่ามีข้อมูลที่ยังไม่บันทึกและเปิดกล่องยืนยัน ส่วน FileUpload ทำหน้าที่เลือกและแสดงไฟล์เท่านั้น",
          "Stepper\n  - แถบขั้นตอน 6 ขั้น (Stepper) ขั้น 04: ไม่เลื่อนไปขั้นนัดรับรถเพียงเพราะเลือกไฟล์"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ไฟล์ผิดชนิด/เกินจำนวน: แจ้งเป็นรายไฟล์ ไม่รวมเป็นไฟล์พร้อมยืนยัน และไม่ลบไฟล์อื่นที่ถูกต้อง",
          "กด Cancel ในหน้าต่างเลือกไฟล์ของเครื่อง: อยู่หน้า Safety เดิม ไม่แสดง error หรือเปลี่ยนจำนวนไฟล์ทั้งที่ไม่ได้เลือก"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / M.1 · S12 — ยังไม่มีเอกสาร"
      ]
    }
  },
  "M.2": {
    "title": "AC M.2 — Filled (อัปโหลดเอกสารแล้ว)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: แนบและตรวจเอกสารงานซ่อม — Filled (อัปโหลดเอกสารแล้ว)",
          "Who: กบค. ใช้จัดการเอกสาร; ผู้มีสิทธิ์ดูใช้ตรวจเอกสารตามขอบเขตของตน",
          "Do: ตรวจไฟล์ที่อัปโหลดและจัดการเอกสารตามสิทธิ์"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีอัปโหลดแล้ว แต่ไม่ครบ behavior ลบรายไฟล์/error/ยืนยันซ้ำและ viewer ที่ยังเป็น mock"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior รายไฟล์: ลบเฉพาะไฟล์ที่กด อัปเดตปุ่มยืนยันเมื่อไม่เหลือไฟล์ที่ใช้ได้ และคงไฟล์อื่นเมื่อไฟล์หนึ่งผิดพลาด",
          "NEW — เพิ่ม behavior ยืนยัน: กันส่งซ้ำ เลื่อนไปนัดรับรถหลังบันทึกจริง และไม่ถือข้อความจำลองดูตัวอย่าง/ดาวน์โหลดว่าเป็น viewer ที่ทำเสร็จแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "File Upload (FileUpload)\n  - คลิกเลือกไฟล์หรือลากวางได้ตามพื้นที่อัปโหลด\n  - รับเฉพาะไฟล์ตามชนิดที่หน้าจอกำหนด; ไฟล์ไม่ถูกต้องให้แจ้งเหตุผล\n  - เลือกแล้วแสดงชื่อไฟล์และสถานะ; ลบไฟล์ออกได้ก่อนบันทึก\n  - ไฟล์ที่บันทึกแล้วต้องเปิดดูหรือดาวน์โหลดได้ตามสิทธิ์\n  - แนบไฟล์ แสดง \"Document.pdf 200 KB\" แถบ \"100%\" และปุ่มลบ ปุ่ม \"ยืนยันการตรวจสภาพ\" enable\n  - รายการไฟล์แนบ: แสดงชื่อ ขนาด progress และปุ่มลบรายไฟล์; ลบแล้วคำนวณจำนวนไฟล์ที่พร้อมใหม่\n  - จาก ช่องแนบไฟล์และรายการไฟล์ (FileUpload): กดicon ลบลบเฉพาะไฟล์นั้น หน้าตรวจ Safety ยังอยู่; กดชื่อไฟล์/ดาวน์โหลดใน prototype เป็นข้อความจำลอง ไม่ได้มี viewer จริงที่ยืนยันการปิด/ย้อนกลับได้\n  - กด “ย้อนกลับ” ไป PO ผ่าน guard หากมีการเปลี่ยนไฟล์; กด × ปิด toast สำเร็จ/ผิดพลาดไม่เปลี่ยนรายการไฟล์และไม่เปลี่ยนขั้นเอง",
          "Stepper\n  - กด \"ยืนยันการตรวจสภาพ\" สถานะเป็น \"รอนัดหมายรับรถ\" stepper ไปขั้น 05\n  - แถบขั้นตอน 6 ขั้น (Stepper)/ป้ายรายการที่เลือก: ไปขั้นนัดรับรถหลังยืนยันสำเร็จเท่านั้น; error ต้องคงไฟล์ไว้",
          "Status (StatusBadge)\n  - toast \"ยืนยันการตรวจสอบสำเร็จ\" (ปิด ⚠️ toast ด้านบน) [Sheet พี่นุ — OH-Toast #22, ✅ CF]\n    \n    Status \"รอตรวจสภาพ Safety\" → \"รอนัดหมายรับรถ\" (status final: \"อยู่ระหว่างตรวจ\" → \"รอนัดหมาย\") [Sheet พี่นุ — OH-Toast #22, ✅ CF]\n    \n    ไม่มี notification [Sheet พี่นุ — OH-Toast #22, ✅ CF]\n    \n    ไม่สำเร็จใช้ \"General Error\" (#26) [Sheet พี่นุ — OH-Toast #22, ✅ CF]",
          "Buttons\n  - ปุ่ม “ยืนยันการตรวจสภาพ”: enable จากไฟล์ที่อัปโหลดสำเร็จ และกันกดซ้ำระหว่างยืนยัน"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "อัปโหลด/ยืนยัน เฉพาะ กบค. [Sheet พี่นุ — OH-Toast #22, ✅ CF]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ไฟล์หนึ่งอัปโหลดล้มเหลว: ให้เห็นไฟล์ที่มีปัญหาและลองใหม่/เอาออกได้ โดยคงไฟล์สำเร็จอื่น",
          "ยืนยันตรวจสภาพไม่สำเร็จ: คงไฟล์ไว้และสถานะขั้น 04 ไม่เลื่อนไปนัดรับรถจากการกดปุ่มอย่างเดียว"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ไม่มีเฟรมหลังกดยืนยัน (toast สำเร็จ/ไม่สำเร็จ) และไม่มีเฟรมอัปโหลดไฟล์ล้มเหลว/ไฟล์ผิดชนิด ต้องเคาะข้อความ",
          "ต้องเคาะ: ต้องบันทึกผล \"ผ่าน/ไม่ผ่าน\" แยกไหม ถ้าไม่ผ่านย้อนกลับขั้น 03 ได้ไหม, ขนาดไฟล์สูงสุด, ลบไฟล์หลังยืนยันแล้วได้ไหม",
          "Sheet เรียกปุ่มว่า \"ยืนยันการตรวจสอบ\" แต่ mock เป็น \"ยืนยันการตรวจสภาพ\" ใช้คำใน mock สำหรับปุ่ม และคำใน Sheet สำหรับ toast",
          "หน่วยงานเจ้าของรถไม่ได้รับแจ้งว่ารถซ่อมเสร็จและผ่าน Safety แล้ว จนกว่าจะได้นัดรับรถ (#13) ต้องเคาะว่าพอไหม"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / M.2 · S12 — อัปโหลดแล้ว"
      ]
    }
  },
  "N.1": {
    "title": "AC N.1 — form นัด Default",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรับรถและติดตามผลตอบรับ — form นัด Default",
          "Who: กบค. ใช้จัดการนัดรับรถ; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: เลือกวันเวลาและกรอกข้อมูลนัดรับรถ แล้วส่งนัดหรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มี form นัดรับรถ แต่ยังไม่แยกการกลับ PO กับการถอยสถานะงานและ ข้อมูลที่ยังไม่บันทึก ทางกลับ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ย้อนกลับ: กลับ PO นี้ไม่ถอยไปสถานะนัดเข้าอู่; มี ข้อมูลที่ยังไม่บันทึก ต้องยืนยันออกก่อน",
          "NEW — เพิ่มค่าเริ่มต้นขากลับ: วัน/ผู้ประสานงานยังไม่เลือก stepper ขั้น 05 และข้อมูลอู่เป็นอ่านอย่างเดียว"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เลือกวันและเวลาแล้วตรวจว่าข้อมูลจำเป็นครบก่อนส่ง\n  - ออกจากช่องที่บังคับแต่ยังว่างให้ขึ้นคำเตือน และแก้ถูกแล้วเตือนหาย\n  - ระหว่างส่งนัดห้ามกดส่งซ้ำ\n  - จาก หน้าหน้างานรถรายคัน (JobView): “ย้อนกลับ” → รายละเอียด PO เดิม; หากมี ข้อมูลที่ยังไม่บันทึก นัดรับรถให้เปิดยืนยันการออกก่อน ไม่ถอยสถานะไปเป็นนัดเข้าอู่",
          "Status (StatusBadge)\n  - ส่งสำเร็จให้แสดงสถานะรอหน่วยงานตอบรับ; ไม่สำเร็จต้องคงค่าที่กรอก\n  - Status \"รอนัดหมายรับรถ\" (status final: \"รอนัดหมาย\") [Sheet พี่นุ]",
          "Stepper\n  - สถานะ \"รอนัดหมายรับรถ\" stepper ขั้น 01–04 เป็นเครื่องหมายถูก ขั้น 05 \"นัดรับรถ\" ปัจจุบัน",
          "Date Input\n  - ฟิลด์และปุ่มเหมือน H.1 (อู่/เบอร์/ที่อยู่แสดงอย่างเดียว, ช่วงวัน, ผู้ประสานงาน, เบอร์อัตโนมัติ) \"ส่งนัดหมาย\" disable\n  - ช่องเลือกช่วงวันที่ (DateRangeInput) นัดรับรถและช่องเลือกผู้ประสานงาน: เริ่มว่าง; ข้อมูลอู่เป็นอ่านอย่างเดียว",
          "Buttons\n  - ปุ่ม “ส่งนัดหมาย”: disable จนเลือกครบตามกติกา; stepper อยู่ขั้น 05 ไม่ใช้ขั้นนัดเข้าอู่"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "เหมือน H.1: ส่ง/แก้ไขนัดเฉพาะ กบค. role อื่นอ่านอย่างเดียว [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เข้าขั้นนัดรับรถแต่ข้อมูลอู่/รถโหลดไม่ครบ: ไม่เอาข้อมูลนัดเข้าอู่ของรถอื่นมาเติม และไม่เปิดส่งนัดก่อนข้อมูลพร้อม",
          "กดย้อนกลับหลังเริ่มเลือกนัด: ผ่านยืนยันออกก่อนทิ้ง ข้อมูลที่ยังไม่บันทึก และกลับ PO โดยไม่ถอยสถานะงาน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / N.1 · S13 — ฟอร์มนัดรับรถ (ค่าอู่ตั้งต้น)"
      ]
    }
  },
  "N.2": {
    "title": "AC N.2 — Validation (ไม่ได้เลือก, Out of focus)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรับรถและติดตามผลตอบรับ — Validation (ไม่ได้เลือก, Out of focus)",
          "Who: กบค. ใช้จัดการนัดรับรถ; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ดูช่องที่ยังไม่ครบและแก้ไขก่อนส่งนัด"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม ยังไม่พบเฟรม validation นัดรับรถแยกจาก form เริ่มต้น"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มเฟรม error รายช่องวัน/ผู้ประสานงานเมื่อออกโดยไม่เลือก และล้างเฉพาะช่องที่แก้ถูก",
          "NEW — เพิ่มคำเฉพาะขากลับ: ต้องตกลง label/error ช่วงวันนัดรับรถ ไม่ใช้คำขาเข้าตาม component ที่ reuse โดยไม่ตรวจ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อออกจากช่องที่จำเป็นโดยไม่กรอก ให้ขึ้นข้อความเตือนตามหน้าจอ\n  - เมื่อกรอกถูกต้องให้ลบข้อความเตือนของช่องนั้น\n  - หากข้อมูลยังไม่ครบ ต้องไม่ส่งข้อมูลผิดไปบันทึก\n  - เหมือน H.2: ขอบแดง + \"กรุณาเลือกช่วงวันนำรถเข้า\" (ต้องแก้คำ ดูด้านบน) และ \"กรุณาเลือกผู้ประสานงาน\"",
          "Date Input\n  - ช่องเลือกช่วงวันที่ (DateRangeInput)/ช่องผู้ประสานงาน: blur โดยไม่เลือกแสดง error ของช่องนั้น; แก้ถูกแล้วหายเฉพาะช่อง\n  - Label/error ช่วงวัน: ต้นฉบับยังใช้คำขาเข้า ต้องตกลงคำ “ช่วงวันนัดรับรถ” ก่อนใช้จริง\n  - จาก ช่องเลือกช่วงวันที่ (DateRangeInput): คลิกนอกปฏิทิน/Esc ปิดเฉพาะแผง ยังอยู่หน้าขั้นนัดรับรถ; label/error ต้องใช้ของขากลับตามข้อสรุป ไม่ยกข้อความขาเข้ามาเพราะ reuse component"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ปิดช่องวันรับรถ/ผู้ประสานงานโดยไม่เลือก: ขึ้น error เฉพาะช่องว่าง ไม่ใช้ข้อความขาเข้าผิดขั้น",
          "แก้ค่าถูกแล้ว: ล้างเฉพาะ error ของช่องนั้น ไม่ทำให้วันเก่าที่กดล้างกลับมาในข้อมูลส่ง"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "N.3": {
    "title": "AC N.3 — Filled",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรับรถและติดตามผลตอบรับ — Filled",
          "Who: กบค. ใช้จัดการนัดรับรถ; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ตรวจวันเวลาและข้อมูลที่กรอกครบแล้วก่อนส่งนัด"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม ยังไม่พบเฟรมกรอกนัดรับรถครบแยกจาก form เริ่มต้น"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม state วัน/ผู้ประสานงานครบและปุ่มส่งพร้อม; ข้อความชื่อที่พิมพ์แต่ไม่เลือกยังไม่ถือว่าครบ",
          "NEW — เลือกวันในปฏิทินแล้วกด “Apply” เพื่อใช้ช่วงวันที่เลือก; กด “Cancel” เพื่อปิดปฏิทินและใช้ช่วงวันเดิม; เงื่อนไขห้ามเลือกวันก่อนวันผ่าน Safety ยังต้องตกลง; โค้ดปฏิทินเดิมไม่มี Apply/Cancel จึงต้องปรับ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เลือกวันและเวลาแล้วตรวจว่าข้อมูลจำเป็นครบก่อนส่ง\n  - ออกจากช่องที่บังคับแต่ยังว่างให้ขึ้นคำเตือน และแก้ถูกแล้วเตือนหาย\n  - ระหว่างส่งนัดห้ามกดส่งซ้ำ\n  - เหมือน H.3: \"22/10/2569 - 24/10/2569\", \"นายวิชัย ทองดี วิศวกร กบค.\", \"02-590-9123\" ปุ่ม \"ส่งนัดหมาย\" enable",
          "Status (StatusBadge)\n  - ส่งสำเร็จให้แสดงสถานะรอหน่วยงานตอบรับ; ไม่สำเร็จต้องคงค่าที่กรอก",
          "Date Input\n  - ช่องเลือกช่วงวันที่ (DateRangeInput): Apply ช่วงวันรับรถลง form ส่วน Cancel คงวันเดิม; เงื่อนไขเทียบวันผ่าน Safety ต้องตกลง\n  - ช่องเลือกช่วงวันที่ (DateRangeInput) ในโค้ดยังไม่มี Apply/Cancel และแก้ค่าทันทีเมื่อเลือก ต่างจาก AC นัดรับรถ จึงต้องเพิ่ม ข้อมูลที่ยังไม่บันทึก หากจะใช้รูปแบบ Apply/Cancel; คลิกนอก/Esc ปิดแผงไม่ใช่ออกจากหน้างาน",
          "Select Field\n  - ช่องเลือกจากรายการ ผู้ประสานงาน: เลือกชื่อจริงแล้วเติมเบอร์ให้ตรงคน",
          "Buttons\n  - ปุ่ม “ส่งนัดหมาย”: enable จากข้อมูลที่เลือกครบ ไม่ใช้เพียงข้อความที่พิมพ์ในช่องชื่อ",
          "Combobox\n  - ช่องพิมพ์ค้นและเลือกจากรายการ (Combobox) ผู้ประสานงาน: blur คืนชื่อที่เลือกไว้, Enter เลือกและปิด, Esc ปิดรายการ; การเลือกนี้ยังไม่ส่งนัดจนกดปุ่มส่ง"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "เลือกวันรับก่อนวันผ่าน Safety: แจ้งตามกติกาวันที่ที่ทีมตกลง ไม่ปล่อยส่งช่วงวันผิดลำดับเพียงเพราะปฏิทินเลือกได้",
          "เปลี่ยนชื่อผู้ประสานงานโดยไม่เลือกรายการใหม่: ไม่ใช้ ID/เบอร์คนเดิมกับชื่อที่พิมพ์ค้าง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: ช่วงวันรับรถต้องไม่ก่อนวันยืนยันตรวจสภาพ (mock ใช้วันเดียวกับนัดเข้าอู่ 22–24 ต.ค. ซึ่งเป็นไปไม่ได้)"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "N.4.1": {
    "title": "AC N.4.1 — สร้างนัดไม่สำเร็จ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรับรถและติดตามผลตอบรับ — สร้างนัดไม่สำเร็จ",
          "Who: กบค. ใช้จัดการนัดรับรถ; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ตรวจข้อผิดพลาดและลองส่งนัดใหม่โดยคงข้อมูลเดิม"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม ยังไม่พบ state ส่งนัดรับรถไม่สำเร็จแยกไว้"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มผลล้มเหลว: toast แสดงในหน้าเดิม คงวัน/ผู้ประสานงานและสถานะรอนัดรับรถ ไม่เลื่อน stepper",
          "NEW — เพิ่ม retry หลังพ้น pending โดยไม่สร้างนัดซ้ำจากครั้งก่อน"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อกดบันทึกหรือส่งแล้วผิดพลาด ให้แสดงข้อความแจ้งตามจอ\n  - \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} ไม่สำเร็จ\" ใช้ร่วมกับขั้น 1 [Sheet พี่นุ — OH-Toast #14]\n  - ข้อความแจ้งผลมุมขวาบน นัดรับรถไม่สำเร็จ: แสดงบน form เดิมและไม่เลื่อน stepper",
          "File Upload (FileUpload)\n  - อยู่หน้าเดิม และค่าที่กรอก/ไฟล์ที่เลือกต้องไม่หาย",
          "Status (StatusBadge)\n  - ปลดสถานะกำลังทำ เพื่อให้แก้ไขและกดใหม่ได้ โดยไม่สร้างข้อมูลซ้ำ\n  - toast \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} ไม่สำเร็จ\" อยู่หน้าเดิม สถานะยัง \"รอนัดหมายรับรถ\"",
          "Date Input\n  - ช่องเลือกช่วงวันที่ (DateRangeInput)/ผู้ประสานงาน: คงค่าที่เลือก; ปุ่มส่งพ้น pending แล้วให้ลองใหม่ได้"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ส่งนัดรับรถไม่สำเร็จ: คงวัน/ผู้ประสานงานและสถานะรอนัดรับรถ ไม่เลื่อนไปรอปิดงาน",
          "ไม่รู้ผลเพราะการเชื่อมต่อขาด: ตรวจนัดรับล่าสุดก่อนส่งใหม่ ไม่สร้างนัดรับ/การแจ้งซ้ำ"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "N.4.2": {
    "title": "AC N.4.2 — ส่งนัดสำเร็จ รอหน่วยงานตอบรับ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรับรถและติดตามผลตอบรับ — ส่งนัดสำเร็จ รอหน่วยงานตอบรับ",
          "Who: กบค. ใช้จัดการนัดรับรถ; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ดูข้อมูลนัดที่ส่งแล้วและสถานะรอหน่วยงานตอบรับ; การตอบรับหรือปฏิเสธเป็นสิทธิ์ของหน่วยงานเจ้าของรถ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีรอหน่วยงานตอบรับภายใต้ N.2 แต่ไม่แยกผลส่งนัด/แก้ไข/การตอบรับจากอีกฝ่ายครบ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ระหว่างรอ: ส่งสำเร็จยังไม่เท่าตอบรับ ไม่เปลี่ยนเป็นรอปิดงานเอง และ toast ไม่ซ้ำจาก refresh",
          "NEW — เพิ่ม action แก้ไขนัดที่เปิดค่าปัจจุบันใน N.4.3 และตรวจสถานะล่าสุดก่อนให้แก้"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ปรับรายการหรือรายละเอียดล่าสุดให้เห็นตรงกับข้อมูลที่บันทึก\n  - ไม่ให้กดยืนยันซ้ำขณะกำลังส่งข้อมูล\n  - Toast + Notification #13: \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ\" notification ถึงหน่วยงานเจ้าของรถ [Sheet พี่นุ]\n  - ข้อความแจ้งผลมุมขวาบน สำเร็จ: ส่งเพียงครั้งเดียวจาก action ไม่ยิงซ้ำเมื่อ refresh หน้า",
          "Status (StatusBadge)\n  - เมื่อระบบยืนยันว่าทำสำเร็จ จึงเปลี่ยนหน้า/สถานะและแสดงข้อความสำเร็จ\n  - toast \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ\" สถานะ \"รอหน่วยงานตอบรับนัดหมายรับรถ\" แสดง \"รอตอบกลับจากหน่วยงาน\" + ปุ่ม \"แก้ไขนัดหมาย\"\n  - Status: \"รอหน่วยงานตอบรับนัดหมายรับรถ\" (status final: \"รอหน่วยงานตอบรับรถ\") [Sheet พี่นุ]\n  - ป้ายสถานะ/รายการที่เลือก และข้อความรอตอบกลับ: แสดง “รอหน่วยงานตอบรับนัดหมายรับรถ” หลังส่งสำเร็จ",
          "Buttons\n  - ปุ่ม “แก้ไขนัดหมาย”: เปิดค่าปัจจุบันที่ N.4.3; ต้องตรวจว่ายังไม่มีคำตอบใหม่ก่อนให้แก้"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "หน่วยงานตอบนัดรับรถระหว่างเปิดรอ: แสดงสถานะล่าสุดและไม่เปิดให้แก้นัดเก่าที่ตอบแล้ว",
          "เปิดอ่านหน้ารอตอบกลับซ้ำ: ไม่ส่งนัดรับรถหรือ notification ใหม่โดยไม่มี action ส่ง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "#13/#15 ใช้ข้อความเดียวกันทั้งนัดเข้าอู่และนัดรับรถ ผู้รับแยกไม่ออกว่าเป็นนัดไหน แนะนำเติมคำ \"นัดเข้าอู่\" / \"นัดรับรถ\" ในข้อความ"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / N.2 · S13 — รอหน่วยงานตอบรับ"
      ]
    }
  },
  "N.4.3": {
    "title": "AC N.4.3 — แก้ไขนัดหมาย",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรับรถและติดตามผลตอบรับ — แก้ไขนัดหมาย",
          "Who: กบค. ใช้จัดการนัดรับรถ; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ปรับวันเวลาหรือข้อมูลนัดและส่งใหม่ตามสิทธิ์"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม ยังไม่พบเฟรมแก้นัดรับรถแยกจากรอตอบรับ/ปฏิเสธ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม ข้อมูลที่ยังไม่บันทึก แก้นัดรับรถโดยแยกจากนัดเข้าอู่และนัดที่ส่งแล้ว",
          "NEW — เพิ่ม behavior ออก/ส่งใหม่: ปิดกล่องยืนยันออกคง ข้อมูลที่ยังไม่บันทึก ยืนยันจึงไป PO; ส่งใหม่ตรวจว่ายังแก้ได้และกันกดซ้ำ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เปิด form โดยใส่วัน เวลา และข้อมูลนัดเดิมให้เห็น\n  - แก้ค่าใหม่แล้วตรวจว่าข้อมูลจำเป็นครบก่อนส่งอีกครั้ง\n  - หากยกเลิกการแก้ไข ให้ข้อมูลเดิมไม่เปลี่ยน\n  - เหมือน H.4.3: form เติมค่าเดิม ส่งใหม่ได้",
          "Status (StatusBadge)\n  - แก้ไขได้จนกว่าหน่วยงานจะตอบ ส่งใหม่ใช้ toast #13 สถานะกลับเป็น \"รอหน่วยงานตอบรับนัดหมายรับรถ\" [Sheet พี่นุ — PEA]\n  - ป้ายสถานะ/รายการที่เลือก ปฏิเสธใน mock: เป็นจุดขัดกันที่ต้องตกลง ไม่ hardcode ตามภาพจนสถานะผิด",
          "Date Input\n  - ช่องเลือกช่วงวันที่ (DateRangeInput)/ผู้ประสานงาน: เติมนัดรับรถครั้งก่อนให้แก้ได้ โดยแยก ข้อมูลที่ยังไม่บันทึก",
          "Buttons\n  - ปุ่มส่งนัดใหม่: ตรวจสถานะล่าสุดก่อนส่ง กันซ้ำ และแสดงสถานะรอตอบรับจากผลใหม่",
          "Navigation\n  - “ย้อนกลับ” ขณะแก้นัดรับรถ → ขอไป PO ผ่าน leave guard; ปิดกล่องยืนยัน → กลับ ข้อมูลที่ยังไม่บันทึก ใน N.4.3, ยืนยัน → ทิ้ง ข้อมูลที่ยังไม่บันทึก ไป PO โดยไม่ยกเลิกนัดที่บันทึกไว้"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "หน่วยงานตอบรับขณะกำลังแก้นัดรับรถ: ตรวจสถานะตอนส่งอีกครั้งและไม่ทับนัดที่ตอบรับแล้ว",
          "แก้นัดส่งไม่สำเร็จ: คงนัดที่บันทึกเดิมกับ ข้อมูลที่ยังไม่บันทึก วันใหม่ให้ชัด ไม่แสดงวันใหม่เป็นนัดยืนยันแล้ว"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "chip ในเฟรมนี้เป็น \"หน่วยงานปฏิเสธนัดหมายรับรถ\" (ควรเป็น \"รอหน่วยงานตอบรับนัดหมายรับรถ\")"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "N.4.4": {
    "title": "AC N.4.4 — หน่วยงานปฏิเสธ",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรับรถและติดตามผลตอบรับ — หน่วยงานปฏิเสธ",
          "Who: กบค. ใช้จัดการนัดรับรถ; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: ดูผลปฏิเสธและกลับไปจัดนัดใหม่ตามสิทธิ์"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีหน่วยงานปฏิเสธภายใต้ N.3 แต่ไม่แยกเหตุผลเดิมกับนัดขากลับครั้งใหม่ทุก action"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior กล่องเหตุผล: คงหมายเหตุการปฏิเสธขากลับไว้ขณะเลือกวันใหม่ ไม่ใช้ข้อมูลนัดเข้าอู่",
          "NEW — เพิ่ม behavior ปิด dropdown/ย้อนกลับ: ปิดส่วนเลือกไม่ล้างเหตุผล ย้อนกลับผ่าน guard ไม่ลบนัดที่เคยปฏิเสธ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ผู้มีสิทธิ์แก้ไขนัดต้องกลับไปเลือกวัน/ข้อมูลนัดใหม่ได้\n  - ห้ามข้ามไปขั้นถัดไปเพียงเพราะส่งนัดไปแล้ว",
          "Status (StatusBadge)\n  - เมื่อหน่วยงานปฏิเสธ ให้แสดงสถานะปฏิเสธตามจอ\n  - สถานะ \"หน่วยงานปฏิเสธนัดหมายรับรถ\" แสดงกล่อง \"เหตุผลการปฏิเสธ\" (\"รถติดภารกิจซ่อมบำรุงสายส่ง ขอเลื่อนเป็นสัปดาห์ถัดไป\") form เติมค่าเดิม ส่งใหม่ได้\n  - หน่วยงานปฏิเสธนัด + หมายเหตุ (เฉพาะหน่วยงานเจ้าของรถ) · Status \"หน่วยงานปฏิเสธนัดหมายรับรถ\" (status final: \"หน่วยงานปฏิเสธรับรถ\") · toast #16 ถึง กบค. \"หน่วยงาน {สังกัด} ของ {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} ปฏิเสธนัดหมาย\" [Sheet พี่นุ]",
          "Modal\n  - กล่อง “เหตุผลการปฏิเสธ”: แสดงหมายเหตุของนัดรับรถครั้งที่ถูกปฏิเสธ",
          "Date Input\n  - ช่องเลือกช่วงวันที่ (DateRangeInput)/ผู้ประสานงานและปุ่มส่งใหม่: คงค่าเดิมให้ปรับแล้วส่ง โดยไม่เปลี่ยนไปใช้ข้อมูลนัดเข้าอู่\n  - ปิด รายการตัวเลือก/ปฏิทินไม่ล้างเหตุผลปฏิเสธ; กดย้อนกลับใช้ guard แล้วไป PO ไม่ใช่ลบนัดรับรถที่ถูกปฏิเสธ"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "แก้วันรับหลังถูกปฏิเสธ: ไม่ล้างเหตุผลเดิมและไม่หยิบหมายเหตุของนัดเข้าอู่มาแทน",
          "ส่งนัดรับใหม่ไม่สำเร็จ: คงสถานะปฏิเสธ/ข้อมูลที่ยังไม่บันทึก ไม่เปลี่ยนเป็นรอตอบกลับก่อนผลจริง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ไม่มี notification เหมือน H.4.4"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / N.3 · S13 — หน่วยงานปฏิเสธ"
      ]
    }
  },
  "N.5": {
    "title": "AC N.5 — ย้อนกลับมาจากหน้าอื่นหลังนัดหมายแล้ว",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: นัดหมายรับรถและติดตามผลตอบรับ — ย้อนกลับมาจากหน้าอื่นหลังนัดหมายแล้ว",
          "Who: กบค. ใช้จัดการนัดรับรถ; หน่วยงานเจ้าของรถตอบรับหรือปฏิเสธนัดของตน; กรย. เขตดูข้อมูลตามสิทธิ์",
          "Do: กลับมาดูข้อมูลนัดและผลตอบรับล่าสุด โดยไม่สร้างนัดซ้ำหรือถอยสถานะ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม ยังไม่พบเฟรมกลับมาดูขั้นนัดรับรถที่ผ่านแล้วแบบอ่านอย่างเดียวแยกไว้"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม state อ่านอย่างเดียว: แสดงนัดตอบรับแล้วและรอปิดงาน ไม่มีส่ง/แก้ไขหรือ picker ที่เปิดแก้ได้",
          "NEW — เพิ่มข้อกำหนดมุมมอง: กลับดูขั้น 05 ไม่ยกเลิกการตอบรับหรือถอยสถานะรถ ย้อนกลับไป PO ไม่ใช่ย้อน flow"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เลือกวันและเวลาแล้วตรวจว่าข้อมูลจำเป็นครบก่อนส่ง\n  - ออกจากช่องที่บังคับแต่ยังว่างให้ขึ้นคำเตือน และแก้ถูกแล้วเตือนหาย\n  - ระหว่างส่งนัดห้ามกดส่งซ้ำ\n  - ข้อมูลนัดรับรถที่ตอบรับแล้ว: แสดงเป็นอ่านอย่างเดียว ไม่มีการเปิด picker/รายการตัวเลือก เพื่อแก้\n  - จาก หน้าหน้างานรถรายคัน (JobView): ปุ่มย้อนกลับเปิดรายละเอียด PO; การกลับไปดูขั้นก่อนหน้าเป็นการเปลี่ยนมุมมองเท่านั้น ไม่ถอยขั้นตอน/ยกเลิกการตอบรับนัดที่บันทึกแล้ว",
          "Status (StatusBadge)\n  - ส่งสำเร็จให้แสดงสถานะรอหน่วยงานตอบรับ; ไม่สำเร็จต้องคงค่าที่กรอก\n  - Status \"รอปิดงาน\" (status final: \"หน่วยงานตอบรับรถแล้ว\") [Sheet พี่นุ]",
          "Stepper\n  - หน่วยงานตอบรับนัดรับรถแล้ว สถานะ \"รอปิดงาน\" ขั้น 05 แสดงข้อมูลนัดแบบอ่านอย่างเดียว ไม่มีปุ่มส่ง/แก้ไข\n  - แถบขั้นตอน 6 ขั้น (Stepper)/ป้ายรายการที่เลือก และปุ่ม: ขั้น 05 ผ่านแล้ว สถานะรอปิดงาน ไม่แสดงปุ่มส่ง/แก้ไขนัด"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "ทุก role อ่านอย่างเดียวในขั้นนี้ [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "กลับมาอ่านนัดรับที่ตอบรับแล้ว: ไม่เปิดปุ่มส่ง/แก้จาก state เก่าหรือการเปลี่ยน URL",
          "โหลดรายละเอียดนัดรับไม่สำเร็จ: แสดงปัญหาและลองใหม่ ไม่แสดง form ว่างจนผู้ใช้ส่งนัดซ้ำ"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: ขากลับต้องมีลงนามส่งมอบรถคืนแบบ I หรือไม่ (จอไม่มี)"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "O.1": {
    "title": "AC O.1 — ยังไม่ได้ระบุอะไหล่",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: บันทึกอะไหล่และปิดงาน Overhaul รายคัน — ยังไม่ได้ระบุอะไหล่",
          "Who: กบค. ใช้จัดการอะไหล่และปิดงาน; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลรถในขอบเขตของตน",
          "Do: เริ่มระบุอะไหล่และตรวจข้อมูลจำเป็นก่อนปิดงาน"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีกรอกอะไหล่/นำเข้า/ปิดงาน แต่ไม่ครบ behavior file picker cancel และ validation รายช่องที่ยังไม่เคาะ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior นำเข้า: Cancel หน้าต่างเลือกไฟล์คงรายการเดิม; ต้องตกลง template/ชนิดไฟล์/ต่อท้ายหรือแทนที่ก่อนพัฒนา",
          "NEW — เพิ่ม behavior แถวกรอก: ชื่อว่าง/จำนวนผิด/หน่วยไม่เลือกไม่กลายเป็นรายการพร้อมปิด และต้องตกลงวิธีเพิ่มแถวกับทศนิยมก่อน"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ถ้าข้อมูลที่จำเป็นยังไม่ครบ อย่าให้ปิดงานสำเร็จ\n  - เมื่อกดยืนยันปิดงานแล้วระหว่างรอผลต้องไม่กดซ้ำ",
          "Status (StatusBadge)\n  - แสดงข้อมูลการปิดงานและอะไหล่ตามสถานะจริงของรถ\n  - Status: \"รอปิดงาน\" (status final: \"อยู่ระหว่างปิดงาน\") [Sheet พี่นุ]",
          "Stepper\n  - ปิดสำเร็จให้สถานะรถและขั้นตอนแสดง “ปิดงานแล้ว”\n  - สถานะ \"รอปิดงาน\" stepper ขั้น 01–05 เป็นเครื่องหมายถูก ขั้น 06 \"ปิดงาน\" ปัจจุบัน",
          "File Upload (FileUpload)\n  - ส่วน \"รายการอะไหล่ที่ใช้\" มีปุ่ม \"นำเข้าไฟล์\" ขวาบน แถวกรอก ชื่ออะไหล่ / จำนวน / หน่วย\n  - empty \"ยังไม่ได้ระบุอะไหล่ที่ใช้\" ข้อความรอง \"เพิ่มทีละรายการหรือนำเข้าไฟล์ — ต้องมีอย่างน้อย 1 รายการจึงปิดงานได้\"\n  - นำเข้าไฟล์สำเร็จ (#23, ✅ CF): toast \"นำเข้าไฟล์ {ชื่อไฟล์} สำเร็จ\" [Sheet พี่นุ]\n  - นำเข้าไฟล์ผิดรูปแบบ (#24, ✅ CF): ไม่ใช้ toast ให้ขึ้นเป็น Validation แทน [Sheet พี่นุ]",
          "Buttons\n  - ปุ่ม \"ย้อนกลับ\" / \"ปิดงาน\"\n  - ปุ่ม “นำเข้าไฟล์”: เปิดเลือกไฟล์ แต่ชนิด/template/การต่อท้ายหรือแทนที่ยังต้องตกลง\n  - ปุ่ม “นำเข้าไฟล์” เปิด file picker; ถ้ากด Cancel ที่หน้าต่างของเครื่องให้กลับ O.1 พร้อมรายการอะไหล่เดิม ไม่เปิดกล่องยืนยันออกจากหน้าแทน",
          "Table (DataTable)\n  - Behavior\n    - ตารางอะไหล่ (OH-5): ชื่ออะไหล่ ✅ CF · ลบ ✅ [Sheet พี่นุ]",
          "Form Fields\n  - ช่องกรอก ชื่ออะไหล่/จำนวน และ รายการตัวเลือก หน่วย: แยกค่าต่อแถว ชื่อว่างและจำนวนไม่ถูกต้องต้องไม่กลายเป็นรายการพร้อมปิดงาน; หน่วยต้องอ้างค่าที่เลือก ไม่ตีความหน่วยเป็นจำนวน ส่วนทศนิยมและข้อความ error ยังต้องตกลง",
          "Empty State (EmptyState)\n  - ส่วนแสดงเมื่อไม่มีข้อมูล และปุ่ม “ปิดงาน”: ต้องมีอย่างน้อยหนึ่งรายการตามกติกา; วิธีเพิ่มแถว/Enter ยังไม่มีข้อสรุป",
          "Navigation\n  - “ย้อนกลับ” → PO ผ่าน leave guard เมื่อมีรายการที่ยังไม่บันทึก; เส้นทางนี้เป็นของ หน้าหน้างานรถรายคัน (JobView) ส่วน file import ของอะไหล่ยังไม่มี component ที่ยืนยัน behavior template/rollback ได้"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "ระบุอะไหล่/นำเข้าไฟล์/ปิดงาน เฉพาะ กบค. [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ชื่ออะไหล่ว่าง/จำนวนไม่ถูกต้อง: ไม่เพิ่มเป็นรายการพร้อมปิดงานและแจ้งช่องที่ต้องแก้ โดยไม่ล้างค่าอีกช่อง",
          "นำเข้าไฟล์ผิดรูปแบบ: แสดง validation ของไฟล์ ไม่ใช้ toast แทนการแจ้งไฟล์ผิดรูปแบบ และไม่ทิ้งรายการเดิม [Sheet พี่นุ — OH-Toast #24]; กด Cancel ของ file picker ไม่เปลี่ยนรายการ"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ไม่มีปุ่ม \"เพิ่ม\" ข้างแถวกรอก ต้องเคาะวิธีเพิ่มรายการ (กด Enter? ปุ่ม \"+ เพิ่ม\"?) และ validation จำนวน (> 0, จำนวนเต็มหรือทศนิยม เช่นน้ำมัน 18 ลิตร)",
          "ปุ่ม \"ปิดงาน\" ใน mock ดู enable ทั้งที่ยังไม่มีรายการ ต้อง disable จนกว่ามีอย่างน้อย 1 รายการ",
          "ต้องเคาะ \"นำเข้าไฟล์\": ชนิดไฟล์ (.xlsx/.csv), template คอลัมน์ (ชื่ออะไหล่, จำนวน, หน่วย), นำเข้าแล้วต่อท้ายหรือแทนที่รายการเดิม, ข้อความเมื่อไฟล์ผิดรูปแบบ — ไม่มีเฟรมเหล่านี้",
          "ลูกค้าถาม 2 ข้อที่ต้องตอบใน refinement: \"จำนวน กับ หน่วย ต่างกันยังไง (แบบ จำนวน 1 หน่วย EA)\" และ \"มีปุ่มเพิ่มด้วยรึเปล่า\" (ตรงกับ ⚠️ ไม่มีปุ่มเพิ่มด้านบน) · แนะนำ: จำนวน = ตัวเลข, หน่วย = dropdown จาก master หน่วยนับ, เพิ่มปุ่ม \"+ เพิ่ม\" ท้ายแถวกรอก"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / O.1 · S14 — ยังไม่ได้ระบุอะไหล่"
      ]
    }
  },
  "O.2": {
    "title": "AC O.2 — ระบุอะไหล่แล้ว",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: บันทึกอะไหล่และปิดงาน Overhaul รายคัน — ระบุอะไหล่แล้ว",
          "Who: กบค. ใช้จัดการอะไหล่และปิดงาน; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลรถในขอบเขตของตน",
          "Do: ตรวจหรือปรับรายการอะไหล่และยืนยันปิดงานเมื่อข้อมูลครบ"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีตารางอะไหล่และลบแถว แต่ไม่แยก ข้อมูลที่ยังไม่บันทึก ที่ยังไม่ปิดงานกับผลการออกจากหน้า/รายการซ้ำ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior แถวอะไหล่: ลบเฉพาะแถวที่เลือก ปรับความพร้อมปิดงานตามรายการที่เหลือ และไม่รวมรายการชื่อซ้ำเอง",
          "NEW — เพิ่ม behavior ย้อนกลับ: ต้องพิจารณา guard ก่อนทิ้งรายการที่เพิ่ม; การคง ข้อมูลที่ยังไม่บันทึก หลังออก/refresh ยังต้องตกลง"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ถ้าข้อมูลที่จำเป็นยังไม่ครบ อย่าให้ปิดงานสำเร็จ\n  - เมื่อกดยืนยันปิดงานแล้วระหว่างรอผลต้องไม่กดซ้ำ\n  - อ้างอิง Planning 1,2_.pdf: ส่วนการรับประกันมีสวิตช์ วันเริ่มรับประกัน ระยะรับประกัน และวันหมดอายุ; การเปิดรายการตัวเลือกเป็น O.2.1 และปิดสวิตช์เป็น O.2.2",
          "Status (StatusBadge)\n  - แสดงข้อมูลการปิดงานและอะไหล่ตามสถานะจริงของรถ",
          "Stepper\n  - ปิดสำเร็จให้สถานะรถและขั้นตอนแสดง “ปิดงานแล้ว”",
          "Table (DataTable)\n  - Row Actions (RowMenu)\n    - เพิ่มรายการ ตารางคอลัมน์ ชื่ออะไหล่, จำนวน, หน่วย พร้อมicon ลบท้ายแถว เช่น \"ชุดลูกสูบพร้อมแหวน 6 ชุด\", \"กรองน้ำมันเครื่อง 2 ชิ้น\", \"น้ำมันเครื่อง 15W-40 18 ลิตร\"\n  - Behavior\n    - ตารางอะไหล่และicon ลบ: ลบเฉพาะรายการนั้น แล้วปรับจำนวนรายการที่ใช้ปิดงาน",
          "Buttons\n  - แถวกรอกยังอยู่ด้านบนเพื่อเพิ่มต่อ ปุ่ม \"ปิดงาน\" enable\n  - ปุ่ม “ปิดงาน”: enable เมื่อมีรายการถูกต้อง กันส่งซ้ำ และตรวจรายการล่าสุดก่อนบันทึก\n  - กดicon ลบแถวเป็นการแก้ ข้อมูลที่ยังไม่บันทึก ในหน้าปิดงาน ไม่ใช่นำทางออก; ปุ่มย้อนกลับไป PO ต้องพิจารณา การตรวจข้อมูลที่ยังไม่บันทึกก่อนออกจากหน้า เพื่อไม่ทิ้งรายการที่เพิ่มโดยไม่ตั้งใจ; การคง ข้อมูลที่ยังไม่บันทึก หลังออกยังต้องตกลง",
          "Form Fields\n  - แถว ช่องกรอก ชื่อ/จำนวน/รายการตัวเลือก หน่วย: คงไว้สำหรับกรอกเพิ่ม แต่ไม่สมมติว่ารายการซ้ำต้องรวมเอง"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ลบอะไหล่จนไม่เหลือรายการ: ปิดการยืนยันปิดงานจนมีรายการที่ใช้ได้ ไม่ใช้จำนวนเดิมก่อนลบ",
          "นำเข้าซ้ำหรือชื่ออะไหล่ซ้ำ: อย่ารวม/แทนที่เองโดยยังไม่ตกลงกติกา และไม่ทิ้งรายการที่กรอกไว้โดยไม่แจ้ง"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: แก้ไขรายการที่เพิ่มแล้วได้ไหม (มีแค่icon ลบ), รายการชื่อซ้ำรวมกันหรือแยกแถว, บันทึกเป็น ข้อมูลที่ยังไม่บันทึก ก่อนกดปิดงานไหม (ออกจากหน้าแล้วรายการยังอยู่ไหม)"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / O.2 · S14 — ระบุอะไหล่แล้ว"
      ]
    }
  },
  "O.2.1": {
    "title": "AC O.2.1 — เลือกระยะรับประกัน",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: บันทึกอะไหล่และปิดงาน Overhaul รายคัน — เลือกระยะรับประกัน",
          "Who: กบค. ใช้จัดการอะไหล่และปิดงาน; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลรถในขอบเขตของตน",
          "Do: เลือกวันเริ่มและระยะรับประกัน ตรวจวันหมดอายุและเงื่อนไขแจ้งเตือน"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีขั้นปิดงาน แต่ยังไม่มีรายละเอียดตัวเลือกระยะรับประกันตาม Planning 1,2_.pdf ชุดนี้"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มตัวเลือกรับประกัน 90/180/360/720 วัน และคำนวณวันหมดอายุจากวันเริ่มที่แก้ไขได้",
          "NEW — ระบุการแจ้งเตือนผ่านกระดิ่งถึงหน่วยงานเจ้าของรถและ กบค. ก่อนหมดประกัน 30 และ 15 วัน โดยกติกาแจ้งย้อนหลังยังต้องตกลง"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อเปิดรายการเลือกระยะรับประกัน ระบบแสดง 90, 180, 360 และ 720 วัน พร้อมวันหมดอายุของแต่ละตัวเลือกจากวันเริ่มรับประกัน\n  - เมื่อเลือกระยะรับประกัน ระบบแสดงระยะที่เลือกและคำนวณวันหมดอายุ = วันเริ่มรับประกัน + จำนวนวันรับประกัน\n  - เมื่อเปลี่ยนวันเริ่มหรือระยะรับประกัน ระบบคำนวณวันหมดอายุใหม่ เช่น 09/11/2569 + 360 วัน = 04/11/2570\n  - วันเริ่มรับประกันตั้งต้นเป็นวันปิดงานและแก้ไขได้; ก่อนเลือกข้อมูลครบให้แสดง “คำนวณเมื่อเลือกระยะรับประกัน” แทนวันหมดอายุ\n  - ระบบแสดงว่าจะส่งแจ้งเตือนทางกระดิ่งให้หน่วยงานเจ้าของรถและ กบค. ก่อนประกันหมด 30 วัน และ 15 วัน\n  - ข้อเสนอเพิ่มเติม: เมื่อเปิดรับประกันแต่วันที่ไม่ถูกต้องหรือยังไม่เลือกระยะ ระบบไม่ให้ปิดงานและแจ้งช่องที่ต้องแก้ โดยคงข้อมูลอะไหล่ไว้\n  - อ้างอิง Planning 1,2_.pdf: สถานะรอปิดงาน มีรายการอะไหล่ และเปิดสวิตช์ “มีการรับประกันงานซ่อม”\n  - สวิตช์รับประกัน/ช่องวันเริ่ม/รายการเลือกระยะ: ใช้ข้อมูลรับประกันชุดเดียวกับ O.2; เปิดตัวเลือกไม่เปลี่ยนรายการอะไหล่หรือสถานะรถ\n  - วันหมดอายุ: คำนวณด้วยวันปฏิทินจากวันเริ่ม + 90/180/360/720 วัน แสดงปี พ.ศ. และไม่บันทึกเพียงข้อความวันที่บนหน้าจอ\n  - ข้อเสนอเพิ่มเติม: ตรวจวันเริ่มและระยะก่อนปิดงานเมื่อเปิดรับประกัน; การคำนวณไม่ได้แปลว่าบันทึกหรือส่งแจ้งเตือนแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ข้อเสนอเพิ่มเติม: วันเริ่มว่างหรือไม่ใช่วันที่จริงขณะเปิดรับประกัน ไม่คำนวณเป็นวันที่ผิดและไม่ให้ปิดงาน; คงรายการอะไหล่ให้แก้ไขต่อ",
          "ข้อเสนอเพิ่มเติม: เปลี่ยนวันเริ่มหลังเลือกระยะแล้ว ต้องไม่แสดงวันหมดอายุจากค่าเดิม; ทดสอบข้ามเดือน ข้ามปี และปีอธิกสุรทิน"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "วันเริ่มรับประกันย้อนหลังหรืออนาคตได้หรือไม่ และปรับค่าเริ่มต้นอย่างไรหากเปิด form ค้างข้ามวัน",
          "หากปิดงานหลังผ่านวันแจ้งเตือนแล้ว ต้องแจ้งย้อนหลังหรือข้ามรอบนั้น และส่งแจ้งเตือนเวลาใด"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "O.2.2": {
    "title": "AC O.2.2 — ไม่มีการรับประกัน (ปิดสวิตช์)",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: บันทึกอะไหล่และปิดงาน Overhaul รายคัน — ไม่มีการรับประกัน (ปิดสวิตช์)",
          "Who: กบค. ใช้จัดการอะไหล่และปิดงาน; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลรถในขอบเขตของตน",
          "Do: ระบุว่างานไม่มีการรับประกันและตรวจอะไหล่ก่อนปิดงาน"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีขั้นปิดงาน แต่ยังไม่มีรายละเอียดสถานะปิดสวิตช์รับประกันตาม Planning 1,2_.pdf ชุดนี้"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่มสถานะไม่มีการรับประกัน ซ่อนช่องรับประกันและไม่บังคับกรอกวันที่หรือระยะ",
          "NEW — ปิดงานโดยไม่สร้างแจ้งเตือนก่อนหมดประกัน และยังบังคับอะไหล่อย่างน้อย 1 รายการ"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - เมื่อปิดสวิตช์ ระบบซ่อนช่องวันเริ่มรับประกัน ระยะรับประกัน และวันหมดอายุ แล้วแสดงข้อความว่างานนี้ไม่มีการรับประกันและระบบจะไม่แจ้งเตือนก่อนหมดประกัน\n  - เมื่อไม่มีการรับประกัน ระบบไม่บังคับกรอกข้อมูลรับประกัน แต่ยังต้องมีอะไหล่อย่างน้อย 1 รายการจึงปิดงานได้\n  - อ้างอิง Planning 1,2_.pdf: ปิดสวิตช์ “มีการรับประกันงานซ่อม” แล้วแสดง “งานนี้ไม่มีการรับประกัน”\n  - สวิตช์รับประกัน: ปิดแล้วแสดงไม่มีการรับประกันและไม่บังคับกรอกช่องวันที่/ระยะ โดยยังตรวจรายการอะไหล่\n  - ข้อมูลปิดงาน: บันทึกสถานะไม่มีการรับประกันให้ชัด ไม่ใช้วันที่ที่ซ่อนอยู่สร้างแจ้งเตือน\n  - การคืนค่าหลังเปิดสวิตช์อีกครั้งและข้อความสรุปหลังปิดงานยังต้องตกลง ไม่กำหนดเองจากค่าที่ซ่อนไว้",
          "Status (StatusBadge)\n  - เมื่อปิดงานสำเร็จในสถานะนี้ ระบบบันทึกว่าไม่มีการรับประกัน และไม่สร้างการแจ้งเตือนก่อนหมดประกันจากค่าที่เคยเลือกไว้"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ปิดรับประกันหลังเลือกวันและระยะไว้: ค่าที่ซ่อนต้องไม่ทำให้บังคับกรอกหรือสร้างการแจ้งเตือนก่อนหมดประกัน",
          "ไม่มีการรับประกันและลบอะไหล่รายการสุดท้าย: ยังไม่อนุญาตให้ปิดงาน เพราะข้อกำหนดอะไหล่อย่างน้อย 1 รายการยังใช้"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "เมื่อปิดแล้วเปิดสวิตช์อีกครั้งก่อนบันทึก ให้คืนค่ารับประกันที่เลือกไว้หรือตั้งค่าใหม่",
          "หน้าปิดงานแล้วกรณีไม่มีการรับประกันจะแสดงข้อความใดแทนตารางรับประกัน"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": []
    }
  },
  "O.3": {
    "title": "AC O.3 — ปิดงานแล้ว",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: บันทึกอะไหล่และปิดงาน Overhaul รายคัน — ปิดงานแล้ว",
          "Who: กบค. ใช้จัดการอะไหล่และปิดงาน; ผู้มีสิทธิ์ดูใช้ตรวจข้อมูลรถในขอบเขตของตน",
          "Do: ดูข้อมูลและผลปิดงานที่บันทึกแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีปิดงานแล้ว แต่ไม่ครบ behavior กลับมาอ่าน URL เดิมและผลต่อ action/แผนสุดท้าย"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior อ่านอย่างเดียว: กลับมาเปิดแล้วไม่มีแถวกรอก/นำเข้า/ลบ/ปิดงาน แม้ใช้ URL เดิม และไม่ยิง success ซ้ำ",
          "NEW — เพิ่มความสอดคล้องผลปิด: chip/stepper/ความคืบหน้าและสถานะแผนกรณีรถคันสุดท้ายต้องอ่านจากผลบันทึกจริง ไม่ใช้เพียงภาพ toast"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ถ้าข้อมูลที่จำเป็นยังไม่ครบ อย่าให้ปิดงานสำเร็จ\n  - เมื่อกดยืนยันปิดงานแล้วระหว่างรอผลต้องไม่กดซ้ำ\n  - อ้างอิง Planning 1,2_.pdf: แสดงวันที่ปิดงาน ข้อความ “รถคันนี้จบรอบ Overhaul” และข้อมูลรับประกันที่บันทึก ได้แก่ วันเริ่ม ระยะ วันหมดอายุ และผู้รับแจ้งเตือนก่อนหมด 30 วันและ 15 วัน\n  - Toast #25 (🤔 เสนอ): \"ปิดงาน {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} เรียบร้อยแล้ว\" แทน \"ปิดงานสำเร็จ\" ใน mock [Sheet พี่นุ]\n  - Notification #25: ข้อความเดียวกับ toast ถึงหน่วยงานเจ้าของรถ [Sheet พี่นุ]\n  - แผน (Sheet PEA): เมื่อรถทุกคันในทุก PO ปิดงาน ระบบเปลี่ยนแผนเป็น \"เสร็จสิ้น\" อัตโนมัติ (status final: \"อนุมัติ PO\") ตอบ ⚠️ ด้านบนแล้ว [Sheet พี่นุ]\n  - ความคืบหน้า: หน้ารายการ/PO แสดง \"ปิดงานแล้ว x/n คัน\" = รถที่ปิดงานหารรถทั้งหมด [Sheet พี่นุ]\n  - ไม่สำเร็จ: \"General Error\" (#26) [Sheet พี่นุ]",
          "Status (StatusBadge)\n  - แสดงข้อมูลการปิดงานและอะไหล่ตามสถานะจริงของรถ\n  - Status: รถ \"ปิดงานแล้ว\" (status final: \"เสร็จสิ้น\") [Sheet พี่นุ]",
          "Stepper\n  - ปิดสำเร็จให้สถานะรถและขั้นตอนแสดง “ปิดงานแล้ว”\n  - กด \"ปิดงาน\" สำเร็จ toast \"ปิดงานสำเร็จ\" chip สถานะ \"ปิดงานแล้ว\" stepper ทั้ง 6 ขั้นเป็นเครื่องหมายถูก\n  - ป้ายสถานะ/รายการที่เลือก/stepper: แสดงปิดงานแล้วและครบทั้ง 6 ขั้น; toast สำเร็จไม่ยิงซ้ำเพียงเพราะกลับมาอ่านหน้า",
          "File Upload (FileUpload)\n  - \"รายการอะไหล่ที่ใช้\" เป็นตารางอ่านอย่างเดียว ไม่มีแถวกรอก ปุ่มนำเข้าไฟล์ icon ลบ และปุ่ม \"ปิดงาน\"",
          "Table (DataTable)\n  - Behavior\n    - ตารางอะไหล่: แสดงรายการที่บันทึกจริงเป็นอ่านอย่างเดียว ไม่มีแถว ช่องกรอก หรือicon ลบ",
          "Buttons\n  - ปุ่มนำเข้า/ปิดงาน: ไม่แสดงในสถานะปิดแล้ว แม้กลับมาเปิดจาก URL เดิม\n  - ปุ่มย้อนกลับ/ไปดู PO เป็นการออกจากมุมมองอ่านอย่างเดียว ไม่เปิดยืนยันการออกเพราะไม่มี ข้อมูลที่ยังไม่บันทึก และไม่เปลี่ยนสถานะปิดงานแล้ว"
        ]
      },
      {
        "level": "h2",
        "label": "สิทธิ์การใช้งาน (Permission)",
        "bullets": [
          "ทุก role ดูอย่างเดียว [Sheet พี่นุ]"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "กลับมาเปิดงานที่ปิดแล้ว: อ่านอย่างเดียวทั้งหน้า ไม่ให้ URL/ปุ่มค้างเปิดกรอก นำเข้า หรือลบอะไหล่อีก",
          "ปิดงานสำเร็จแต่โหลดสถานะแผน/ความคืบหน้าล้มเหลว: โหลดข้อมูลใหม่ ไม่ส่งปิดงานซ้ำหรือย้อนสถานะรถ"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "ต้องเคาะ: หลังปิดงานแสดง toast แล้วอยู่หน้าเดิมหรือเปลี่ยนหน้า ตามคำถามใน Planning 1,2_.pdf",
          "ต้องเคาะ: modal ยืนยันก่อนปิดงาน (แนะนำมี เพราะแก้ไม่ได้อีก), toast/กติกา error เมื่อปิดไม่สำเร็จ, รถคันสุดท้ายของแผนปิดงานแล้วสถานะแผนเป็น \"เสร็จสิ้น\" อัตโนมัติไหม, ความคืบหน้าในหน้ารายการ (เช่น \"5/10\") นับจากรถที่ \"ปิดงานแล้ว\" ใช่ไหม",
          "ตารางใน O.2/O.3 ยังมีคอลัมน์ placeholder \"Header / Text\" ต้องลบออกหรือระบุว่าเป็นคอลัมน์อะไร (พบแบบเดียวกันในตาราง PO และตารางรถ E.9, E.10, F.1, F.4)",
          "Sheet ไม่มี notification ถึง กบค. เมื่อแผนเสร็จสิ้นทั้งแผน ต้องเคาะว่าจำเป็นไหม"
        ]
      }
    ],
    "source": "Overhaul-AC-ฉบับอ่านง่าย-ทุกเฟรม.md + Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / O.3 · S14 — ปิดงานแล้ว"
      ]
    }
  },
  "D.2.1": {
    "title": "AC D.2.1 — ยืนยันการลบแผน",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ลบแผน Overhaul — ยืนยันการลบแผน",
          "Who: กบค. ใช้ตรวจสอบและยืนยันแผนที่จะลบ",
          "Do: ตรวจแผนที่เลือกจากรายการ ยืนยันลบ หรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีกล่องยืนยันลบแผน แต่ไม่แยกปลายทางปิดกล่องตามทางเข้ารายการอย่างละเอียด"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — เพิ่ม behavior ยกเลิก/×/Esc/พื้นหลัง: ปิดกล่องกลับ A.1 คงแถวแผนเดิม; คลิกในกล่องไม่ปิด",
          "NEW — เพิ่ม behavior ยืนยัน: ส่งลบครั้งเดียวตาม Soft Delete และไม่แสดงสำเร็จก่อนผลจริง; เงื่อนไขปิดระหว่างกำลังลบต้องตกลง"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ลบแผนเป็น Soft Delete จึงไม่มีเคสลบไม่สำเร็จ (ตอบ ⚠️ soft/hard ด้านบนแล้ว) · Sheet PEA: แผนที่ถูกลบไม่แสดงในรายการ [Sheet พี่นุ — OH-Toast #5, #10]",
          "Modal\n  - Then modal หัวข้อ \"ยืนยันการลบแผน\" ข้อความ \"เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่\" ปุ่ม \"ยกเลิก\" / \"ยืนยัน\" (สีแดง)\n  - \"ยกเลิก\" ปิด modal อยู่หน้าเดิม · \"ยืนยัน\" ลบแผน\n  - กล่องโต้ตอบกลางจอ (Modal) “ยืนยันการลบแผน”: เปิดต่อจากเมนูแถวรายการ และคงแผนเป้าหมายแม้ตารางโหลดใหม่\n  - จาก กล่อง “ยืนยันการลบแผน” (ConfirmDialog) ในหน้ารายการ plans: “ยกเลิก”, ×, Esc หรือคลิกพื้นหลัง → ปิด กล่องโต้ตอบกลางจอ (Modal) กลับ A.1 คงแถวแผนเดิม; คลิกในกล่องไม่ปิด และไม่ลบจนกด “ยืนยัน”",
          "Status (StatusBadge)\n  - soft delete ต้องซ่อนแผนจากทุก API (รายการ, ค้นหา, รายละเอียด) และ PO/รถใต้แผนต้องถูก soft delete ตามด้วย เพื่อไม่ให้รถติดสถานะค้างใน PO ที่มองไม่เห็น",
          "Buttons\n  - ปุ่ม “ยกเลิก”: ปิดกล่องแล้วกลับรายการแผน A.1 โดยไม่ลบ\n  - ปุ่ม “ยืนยัน” สีแดง: ลบแบบ Soft Delete ตาม Sheet และกันกดซ้ำ; สำเร็จกลับรายการแผนพร้อมผลลบ D.3"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "แผนถูกลบไปแล้วระหว่างเปิดกล่อง: ไม่แจ้งว่าลบใหม่สำเร็จซ้ำ ให้แจ้งสถานะล่าสุดและโหลดรายการ",
          "กดยืนยันลบซ้ำ: ทำ Soft Delete ครั้งเดียว; ยกเลิก/ปิดกล่องต้องไม่ทำให้แถวหายจากรายการ"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "modal ไม่ระบุเลขแผน/ชื่อแผนและไม่บอกว่า PO/รถใต้แผนจะหายด้วย เสี่ยงลบผิดแผน แนะนำให้เพิ่มชื่อแผนและจำนวน PO ในข้อความ",
          "ต้องเคาะ: ลบแผนที่มี PO หรือมีรถกำลังซ่อมได้ไหม (D.1.2 ใน mock เป็นแผน \"ยังไม่มี PO\"), soft หรือ hard delete — ข้อความ \"กู้คืนไม่ได้\" บอกฝั่งผู้ใช้ แต่ไม่บอกฝั่ง DB"
        ]
      }
    ],
    "source": "Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / D.2 · S3 — ยืนยันการลบแผน"
      ]
    }
  },
  "D.2.2": {
    "title": "AC D.2.2 — ยืนยันการลบแผน",
    "sections": [
      {
        "level": "h2",
        "label": "ภาพรวมหน้านี้",
        "bullets": [
          "What: ลบแผน Overhaul — ยืนยันการลบแผน",
          "Who: กบค. ใช้ตรวจสอบและยืนยันแผนที่จะลบ",
          "Do: ตรวจแผนที่เปิดจากรายละเอียด ยืนยันลบ หรือยกเลิก"
        ]
      },
      {
        "level": "h2",
        "label": "As-is — Sprint 06",
        "bullets": [
          "จากเดิม มีกล่องยืนยันลบรวม แต่ไม่แยก state เปิดจากรายละเอียดเป็นรหัสเฉพาะ"
        ]
      },
      {
        "level": "h2",
        "label": "To-be — สิ่งที่เปลี่ยนหรือเพิ่มใหม่",
        "bullets": [
          "NEW — แยก behavior ของกล่องลบจากรายละเอียด: ยกเลิก/×/Esc/พื้นหลังกลับ B.7 ไม่กลับ A.1",
          "NEW — ยืนยันลบสำเร็จจึงไปหน้ารายการ A; การแค่ปิดกล่องต้องไม่ทำให้รายละเอียดถูกนำออกหรือลบข้อมูล"
        ]
      },
      {
        "level": "h2",
        "label": "UI Component & Behavior",
        "bullets": [
          "พฤติกรรมการใช้งาน\n  - ลบแผนเป็น Soft Delete จึงไม่มีเคสลบไม่สำเร็จ (ตอบ ⚠️ soft/hard ด้านบนแล้ว) · Sheet PEA: แผนที่ถูกลบไม่แสดงในรายการ [Sheet พี่นุ — OH-Toast #5, #10]",
          "Modal\n  - Then modal หัวข้อ \"ยืนยันการลบแผน\" ข้อความ \"เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลได้ ต้องการลบใช่หรือไม่\" ปุ่ม \"ยกเลิก\" / \"ยืนยัน\" (สีแดง)\n  - \"ยกเลิก\" ปิด modal อยู่หน้าเดิม · \"ยืนยัน\" ลบแผน\n  - กล่องโต้ตอบกลางจอ (Modal) “ยืนยันการลบแผน”: เปิดต่อจากปุ่มในหน้ารายละเอียด โดยอ้างเลขแผนของหน้านั้น\n  - จาก กล่อง “ยืนยันการลบแผน” (ConfirmDialog) ใน หน้ารายละเอียดแผน (PlanDetail): “ยกเลิก”, ×, Esc หรือคลิกพื้นหลัง → ปิด กล่องโต้ตอบกลางจอ (Modal) กลับรายละเอียดแผนเดิม B.7 ไม่กลับรายการ; กดยืนยันลบสำเร็จจึงไป A",
          "Status (StatusBadge)\n  - soft delete ต้องซ่อนแผนจากทุก API (รายการ, ค้นหา, รายละเอียด) และ PO/รถใต้แผนต้องถูก soft delete ตามด้วย เพื่อไม่ให้รถติดสถานะค้างใน PO ที่มองไม่เห็น",
          "Buttons\n  - ปุ่ม “ยกเลิก”: ปิดกล่องแล้วกลับรายละเอียดแผน B.7 เดิม\n  - ปุ่ม “ยืนยัน” สีแดง: ลบแผนและกันกดซ้ำ; สำเร็จกลับรายการแผนพร้อมผลลบ D.3"
        ]
      },
      {
        "level": "h2",
        "label": "Error Handling / Edge Cases",
        "bullets": [
          "ลบจากหน้ารายละเอียดแล้วแผนไม่มีอยู่ก่อนยืนยัน: กลับรายการพร้อมแจ้งสถานะ ไม่ค้างรายละเอียดที่ใช้ต่อไม่ได้",
          "ยกเลิกกล่องจากรายละเอียด: ไม่ลบแผน และไม่ใช้ปลายทางของกล่องที่เปิดจากรายการโดยผิดทางเข้า"
        ]
      },
      {
        "level": "h3",
        "label": "ประเด็นที่ต้องเคาะ",
        "bullets": [
          "modal ไม่ระบุเลขแผน/ชื่อแผนและไม่บอกว่า PO/รถใต้แผนจะหายด้วย เสี่ยงลบผิดแผน แนะนำให้เพิ่มชื่อแผนและจำนวน PO ในข้อความ",
          "ต้องเคาะ: ลบแผนที่มี PO หรือมีรถกำลังซ่อมได้ไหม (D.1.2 ใน mock เป็นแผน \"ยังไม่มี PO\"), soft หรือ hard delete — ข้อความ \"กู้คืนไม่ได้\" บอกฝั่งผู้ใช้ แต่ไม่บอกฝั่ง DB"
        ]
      }
    ],
    "source": "Overhaul-AC-รายเฟรม.md + Overhaul-Dev-แนวทางประกอบ.md + Overhaul-Sprint06-Delta-รายเฟรม.md + Overhaul-Error-Handling-Edge-Cases-รายเฟรม.md",
    "baseline": {
      "board": "Refinement 15/10/69 - Final Userflow Overhaul #14/10/2026",
      "frameNames": [
        "OH2 / D.2 · S3 — ยืนยันการลบแผน"
      ]
    }
  }
};
const FRAME_COMMON = [
  {
    "level": "h3",
    "label": "กติกาที่ใช้ร่วมกันทุกหน้าจอ",
    "bullets": [
      "ช่องกรอก: คลิกแล้วกรอกได้ ออกจากช่องที่ต้องกรอกแต่ยังว่างให้ขึ้นข้อความเตือนตามจอ เมื่อแก้ถูกแล้วข้อความเตือนของช่องนั้นหาย",
      "ค้นหา: ระหว่างพิมพ์ให้เห็นข้อความที่กรอกทันที; กำลังหาข้อมูลแสดงว่ารออยู่; ไม่พบแสดงข้อความไม่พบ; ถ้าค้นผิดพลาดต้องลองใหม่ได้; เมื่อค้นคำใหม่ห้ามผลคำเก่ามาแทน",
      "ช่องเลือกจากรายการ: ต้องเลือกรายการจริง ไม่ใช่พิมพ์ชื่อคล้าย ๆ แล้วถือว่าเลือก; เมื่อเปลี่ยนรายการต้องเปลี่ยนข้อมูลที่เกี่ยวข้องด้วย",
      "ปุ่มบันทึก/ยืนยัน: กดแล้วแสดงสถานะกำลังทำ ป้องกันการกดซ้ำ; สำเร็จแสดงผลตามจอ; ไม่สำเร็จเก็บข้อมูลที่กรอกไว้",
      "การออกจาก form: ถ้าแก้ข้อมูลแล้วแต่ยังไม่บันทึก ให้ถามก่อนออกตามจอเดิม; ถ้ายังไม่แก้ ออกได้เลย (ข้อเสนอ)",
      "สิทธิ์: เห็นเฉพาะข้อมูลที่มีสิทธิ์ และกดทำรายการได้เฉพาะบทบาทที่กำหนด",
      "วัน เวลา และไฟล์: ต้องไม่ยอมรับวันที่ผิดลำดับหรือไฟล์ผิดประเภท; เก็บไฟล์ที่แนบแล้วไว้เมื่อบันทึกไม่สำเร็จ"
    ]
  },
  {
    "level": "h3",
    "label": "เรื่อง Search จากเอกสารเก่า",
    "bullets": [
      "Sheet เก่าเคยเสนอให้เริ่มแสดงคำแนะนำเมื่อพิมพ์ครบ 3 ตัวอักษร และค้นทะเบียน/WBS ได้ แต่ Figma ปัจจุบันยังไม่มีพฤติกรรมนี้",
      "ยังไม่พบข้อสรุปว่าจะค้นทันที หรือรอกด Enter และยังไม่พบเวลาหน่วงการค้นหา (debounce)",
      "ต้องตกลง: จะใช้รายการคำแนะนำหรือไม่; จะค้นเมื่อพิมพ์หรือกด Enter; จะค้นจากข้อมูลอะไรบ้าง ถ้าเลือกค้นระหว่างพิมพ์ ทีม Dev ค่อยเสนอเวลาหน่วงที่เหมาะสม"
    ]
  }
];
// END FRAME_STORIES

const TAG_KEY = 'mtd-userstory-tag';
const ANNOT_WIDTH = 640;
const FONT_SIZE = 13;

/* ---------- ตัวอักษรนำหน้ารหัสเฟรม → กลุ่ม scenario (ตรงกับ AC_FLOWS keys ใน overhaul-schema-plugin)
   A = หน้ารายการแผน (list, ไม่ใช่ scenario เดี่ยว แต่เป็นส่วนเดียวกับ S1-3 ตาม AC_FLOWS.plan13)
   B,C,D = S1,S2,S3 (สร้าง/แก้ไข/ลบแผน) · E,F,G = S4,S5,S6 (PO — ไม่มีเฟรมในไฟล์นี้แต่กันไว้)
   H = S7 · I = S8 · J,K,L = S9,S10,S11 · M = S12 · N = S13 · O = S14 ---------- */
const LETTER_TO_FLOW = {
  A: 'plan13', B: 'plan13', C: 'plan13', D: 'plan13',
  E: 'po46', F: 'po46', G: 'po46',
  H: 'scenario7',
  I: 'scenario8',
  J: 'scenario911', K: 'scenario911', L: 'scenario911',
  M: 'scenario12',
  N: 'scenario13',
  O: 'scenario14',
};

/** ดึงตัวอักษรนำหน้ารหัสเฟรมจากชื่อ เช่น "OH2 / B.2 · S1 — ..." → "B", "OH2 / N.4.1 · S13 — ..." → "N"
 *  ทนรหัสที่มีจุดซ้อน (N.4.1) ได้ด้วย ต่างจาก ac-annotator-plugin ที่ต้องการรหัสเต็มเป๊ะ */
function frameLetter(name) {
  const m = /(?:^|[\/·]\s*)([A-Za-z]+)\.\d/.exec(name || '');
  return m ? m[1].toUpperCase() : null;
}

/** คืน AC_FLOWS key ที่ตรงกับชื่อเฟรม หรือ null ถ้าไม่เจอ (ตัวอักษรไม่อยู่ใน LETTER_TO_FLOW
 *  หรือชื่อเฟรมไม่มีรูปแบบรหัสเลย เช่น พิมพ์ผิดเป็น "OOH2") */
function findFlowForNode(name) {
  const letter = frameLetter(name);
  return letter ? (LETTER_TO_FLOW[letter] || null) : null;
}

/* ---------- เนื้อหา User Story เต็มรูปแบบต่อกลุ่ม scenario — ดึงมาจาก
   Diagram/01-บำรุงรักษาตามวาระ/25-overhaul-user-stories-AC.md จริงด้วย build-content.js
   (ตัด Open Questions/Dependencies ออกแล้ว แทนที่ด้วย "สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม"
   ตามที่เจ้าของงานสั่ง 26 ต.ค. 2569) — ไฟล์ 25 แก้ไขเมื่อไหร่ รัน `node build-content.js`
   ซ้ำเพื่อ sync เนื้อหา ห้ามแก้ string ด้านล่างด้วยมือ (จะถูกเขียนทับรอบถัดไป) ---------- */
const USER_STORIES = {
  "plan13": {
    "title": "US-OH-01 จัดการแผน Overhaul (สร้าง/แก้ไข/ลบแผน)",
    "sections": [
      {
        "level": "h2",
        "label": "A. Story Header",
        "table": {
          "headers": [
            "รายการ",
            "รายละเอียด"
          ],
          "rows": [
            [
              "Story ID",
              "US-OH-01"
            ],
            [
              "TOR Reference",
              "ข้อ 1 ซ่อมแซมและบำรุงรักษายานพาหนะ — T2 กำหนดตารางบำรุงรักษาตามวาระ (อ้างอิง MVP Tasks ข้อ 1 ของ `CLAUDE.md` ระดับโครงการ)"
            ],
            [
              "Priority",
              "ยังไม่เคาะ — ไม่มีเอกสารใดกำหนด MoSCoW ต่อฟีเจอร์นี้ไว้ตรงๆ (เป็นจุดตั้งต้นของวงจรงานทั้งหมด ไม่มีแผนก็เปิด PO/นัดหมายต่อไม่ได้ แต่ไม่ใช่การยืนยัน Priority อย่างเป็นทางการ)"
            ],
            [
              "งวดส่งมอบ",
              "ยังไม่เคาะ — ไม่มี JO/งวดที่ระบุผูกกับฟีเจอร์ Overhaul นี้โดยเฉพาะในเอกสารที่มี"
            ],
            [
              "Actor",
              "กบค. (กองบำรุงรักษาและควบคุมยานพาหนะ)"
            ]
          ]
        }
      },
      {
        "level": "bold",
        "label": "User Story",
        "paragraph": "ในฐานะเจ้าหน้าที่ กบค. ต้องการสร้าง/แก้ไข/ลบแผน Overhaul ที่ผูกกับงบ (WBS) ที่อนุมัติไว้แล้ว เพื่อป้องกันการเริ่มงาน Overhaul โดยไม่มีงบรองรับ และติดตามได้ว่าใช้งบไปแล้วเท่าไหร่ต่อแผน"
      },
      {
        "level": "bold",
        "label": "Precondition",
        "bullets": [
          "กบค. อยู่ที่เมนู \"จัดการงาน Overhaul\" (url `/overhaul-utility-vehicle`)",
          "มีหนังสืออนุมัติหลักการและเอกสารอนุมัติงบของแผนอยู่ในมือ (เอกสารบังคับก่อนบันทึกแผนได้)",
          "(เฉพาะแก้ไข/ลบ) มีแผนอยู่แล้วในระบบ"
        ]
      },
      {
        "level": "h2",
        "label": "B. Business AC (มุม BA)"
      },
      {
        "level": "h3",
        "label": "B1. Happy Path",
        "code": [
          "Scenario: AC-01 กบค. สร้างแผน Overhaul สำเร็จ\n  Given กบค. อยู่ที่เมนู \"จัดการงาน Overhaul\" และมีหนังสืออนุมัติหลักการกับเอกสารอนุมัติงบในมือ\n  When  กบค. กด \"สร้างแผน Overhaul\" กรอกชื่อแผน ประจำปีงบประมาณ วงเงินอนุมัติ (บาท) แนบหนังสืออนุมัติหลักการและเอกสารอนุมัติงบครบ แล้วกด \"บันทึก\"\n  Then  ระบบสร้างแผนใหม่ 1 แผน สถานะ \"รอเลข PO\" ขึ้นแถวบนสุดของรายการ\n  And   แสดง toast \"สร้างแผน Overhaul {เลขแผน} สำเร็จ\"\n  And   เปิดดูหน้ารายละเอียดแผนได้ทันที"
        ]
      },
      {
        "level": "h3",
        "label": "B2. Alternative Flow",
        "code": [
          "Scenario: AC-02 กบค. แก้ไขแผนที่มีอยู่แล้ว\n  Given มีแผนอยู่แล้ว (สถานะ \"รอเลข PO\" หรือ \"รอดำเนินการ\")\n  When  กบค. เปิดฟอร์มแก้ไข แก้ค่าในฟอร์ม แล้วกด \"บันทึก\" และยืนยันใน modal \"ยืนยันการแก้ไขแผน\"\n  Then  ระบบบันทึกค่าใหม่ กลับหน้ารายละเอียดแผน สถานะแผนคงเดิม\n  And   แสดง toast \"บันทึกการแก้ไขแผนสำเร็จ\"\n\nScenario: AC-09 กบค. เปิดหน้ารายละเอียดแผนที่ยังไม่มี Purchase Order (จากบอร์ด Refinement 29 oct 2026)\n  Given แผนยังไม่มี Purchase Order เลย\n  When  กบค. เปิดหน้ารายละเอียดแผน\n  Then  ส่วน Purchase Order แสดงข้อความ \"ยังไม่มี Purchase Order\" ข้อความรอง \"เพิ่ม PO เพื่อเลือกรถที่จะเข้า Overhaul และเริ่มงานรายคัน\"\n  And   แสดงปุ่ม \"ข้าม\" และปุ่ม \"สร้าง Purchase Order\"\n\nScenario: AC-10 กบค. เปิดหน้ารายละเอียดแผนในส่วนอะไหล่ที่ใช้ (จากบอร์ด Refinement 29 oct 2026)\n  Given กบค. เปิดหน้ารายละเอียดแผน\n  When  กบค. เลื่อนไปดูส่วน \"อะไหล่ที่ใช้\"\n  Then  ส่วนนี้แสดงข้อความ \"ยังไม่มีรายการเบิกอะไหล่\" ข้อความรอง \"ส่วนนี้จองไว้ตาม userflow — ขั้นตอนเบิกอะไหล่ยังไม่ได้ออกแบบ\"\n  And   แสดงปุ่ม \"ข้าม\" และปุ่ม \"เบิกอะไหล่\"\n  And   ปุ่ม \"เบิกอะไหล่\" ยังกดใช้งานจริงไม่ได้ — เป็นคำยืนยันจากทีมออกแบบเองว่า Scenario 21 (เบิกอะไหล่) ยังไม่มีจอ ตรงกับที่เอกสารนี้เคยระบุไว้เป็น \"ยังไม่มีจอ\" ใน US-OH-01 Out of Scope\n\nScenario: AC-05 กบค. ค้นหาแผนในหน้ารายการ\n  Given กบค. อยู่ที่หน้า \"จัดการงาน Overhaul\" และมีแผนอยู่ในระบบ\n  When  กบค. พิมพ์คำค้นในช่องค้นหา (ค้นได้จากเลขแผน ชื่อแผน เลขศูนย์ต้นทุน เลข WBS หรือทะเบียนรถของรถคันใดก็ได้ใน PO ของแผน)\n  Then  ตารางกรองทันทีโดยไม่ต้องกดปุ่ม คำค้นทำงานร่วมกับตัวกรองที่เลือกไว้ (ต้องตรงทั้งคู่) และกลับไปหน้าที่ 1 ของการแบ่งหน้า\n  And   เมื่อพิมพ์ครบ 3 อักขระ แสดงรายการแนะนำใต้ช่องค้นหา (บรรทัดบนเลขที่งบประมาณที่ตรงกับที่พิมพ์ บรรทัดล่างชื่อแผน) เลือกรายการแนะนำแล้วตารางกรองเหลือแผนนั้น\n\nScenario: AC-06 กบค. ใช้ตัวกรองในหน้ารายการ\n  Given กบค. อยู่ที่หน้า \"จัดการงาน Overhaul\"\n  When  กบค. กด \"ตัวกรอง\" เลือกปีงบประมาณ และ/หรือ งบประมาณ (บาท) และ/หรือ สถานะ (เลือกได้ค่าเดียวต่อช่อง ไม่บังคับเลือก) แล้วกด \"ตกลง\"\n  Then  ตารางกรองเหลือเฉพาะแผนที่ตรงทุกช่องที่เลือกไว้ และกลับไปหน้าที่ 1 ของการแบ่งหน้า\n  And   ปุ่ม \"ตัวกรอง\" แสดงจำนวนช่องที่มีค่าอยู่ เช่น \"ตัวกรอง 2\"\n  And   กด \"ล้างตัวกรอง\" ในแผงตัวกรองล้างทุกช่องกลับค่าเริ่มต้น กด \"ยกเลิก\" ปิดแผงโดยไม่เปลี่ยนค่าที่ใช้อยู่"
        ]
      },
      {
        "level": "h3",
        "label": "B3. Exception / Negative Flow",
        "code": [
          "Scenario: AC-03 กบค. กดบันทึกโดยกรอกข้อมูลไม่ครบ\n  Given กบค. อยู่ในฟอร์มสร้าง/แก้ไขแผน\n  When  กบค. กด \"บันทึก\" โดยยังไม่กรอกชื่อแผน วงเงินอนุมัติ หรือยังไม่แนบเอกสารบังคับ\n  Then  ระบบไม่บันทึกข้อมูล\n  And   แสดงข้อความใต้ช่องที่ขาดตรงตัว เช่น \"กรุณาระบุชื่อแผน\", \"กรุณาระบุวงเงินอนุมัติ (บาท)\", \"กรุณาแนบหนังสืออนุมัติหลักการ\", \"กรุณาแนบเอกสารอนุมัติงบ\"\n\nScenario: AC-04 กบค. เปิดแก้ไขแผนที่ถูกลบไปแล้ว\n  Given แผนที่จะเปิดถูกลบไปแล้ว (เช่น เปิดจากลิงก์เก่า)\n  When  กบค. เปิดลิงก์แก้ไขแผนนั้น\n  Then  ระบบไม่เปิดฟอร์ม อยู่ที่หน้ารายการแผนเดิม\n  And   แสดง toast \"ไม่พบแผน {เลขแผน}\"\n\nScenario: AC-07 ค้นหรือกรองในหน้ารายการแล้วไม่พบแผน\n  Given กบค. มีแผนอยู่ในระบบ แต่พิมพ์คำค้นหรือเลือกตัวกรองที่ไม่มีแผนไหนผ่านเงื่อนไข\n  When  ระบบกรองตารางตามคำค้น/ตัวกรองที่ใช้อยู่\n  Then  แทนที่ตารางด้วยข้อความ \"ไม่พบแผน Overhaul\" ข้อความรอง \"ไม่มีแผนที่ตรงกับคำค้นหรือตัวกรอง\"\n  And   แสดงปุ่ม \"ล้างคำค้นและตัวกรอง\" ช่องค้นหาและปุ่มตัวกรองคงค่าที่พิมพ์/เลือกไว้ ไม่มีการแบ่งหน้าในสภาพนี้\n\nScenario: AC-08 หน้ารายการยังไม่มีแผนเลยในขอบเขตของ role นั้น\n  Given ไม่มีแผนเลยในขอบเขตของ role นั้น และยังไม่ได้พิมพ์คำค้นหรือเลือกตัวกรอง\n  When  เปิดหน้า \"จัดการงาน Overhaul\"\n  Then  แทนที่ตารางด้วยข้อความ \"ยังไม่มีแผน Overhaul\" ข้อความรอง \"สร้างแผน Overhaul เพื่อเพิ่ม Purchase Order และติดตามสถานะซ่อมของรถแต่ละคัน\"\n  And   แสดงปุ่ม \"สร้างแผน Overhaul\" เฉพาะ role กบค. — role อื่นเห็นแค่ข้อความ ไม่มีปุ่ม\n  And   ไม่มีช่องค้นหา ปุ่มตัวกรอง และการแบ่งหน้าในสภาพนี้"
        ]
      },
      {
        "level": "h3",
        "label": "B4. Business Rules",
        "bullets": [
          "BR-01 ต้องกรอกครบทุกฟิลด์บังคับก่อนบันทึกได้ ยกเว้นเลข WBS/เลขโครงข่าย/เลขกิจกรรม/อื่นๆ ที่มีคำว่า \"(ถ้ามี)\"",
          "BR-02 เลือกปีงบประมาณได้ตั้งแต่ปีปัจจุบันถึง +10 ปีเท่านั้น (dropdown ไม่ใช่กรอกเอง) — ไม่มีปีงบย้อนหลังให้เลือก",
          "BR-03 ต้องแนบ \"หนังสืออนุมัติหลักการ\" และ \"เอกสารอนุมัติงบ\" ก่อนบันทึกแผนได้เสมอ เอกสารละไม่เกิน 10 ไฟล์ ชนิด PDF, PNG หรือ JPG (จากบอร์ด Refinement 29 oct 2026 — หน้าฟอร์มสร้างแผนระบุ \"PDF, PNG, or JPG\" ไม่ใช่แค่ pdf/jpeg ตามที่เอกสารนี้เคยระบุ)",
          "BR-04 แก้ไข/ลบแผนต้องมีหน้า/modal ยืนยันแยกก่อนทุกครั้ง (modal \"ยืนยันการแก้ไขแผน\" ระบุเลขแผน+ชื่อแผน / modal \"ยืนยันการลบแผน\" บอกเลขแผน ชื่อแผน และจำนวน PO ที่จะถูกลบไปด้วย)",
          "BR-05 ย้อนกลับจากฟอร์มที่แก้ค่าไว้แล้วโดยไม่บันทึก ต้องมี modal \"ยืนยันการออก\" เตือนว่าข้อมูลจะไม่ถูกบันทึก (ถ้าไม่ได้แก้อะไรออกได้เลยไม่มี modal)",
          "BR-06 ไม่เก็บ audit log การแก้ไข/ลบแผน — ยืนยันจากการอ่านบอร์ดดิบซ้ำ 26 ต.ค. 2569 (\"ไม่เก็บทั้งคู่ ใครอยากทำไรก็ทำ\")"
        ]
      },
      {
        "level": "h3",
        "label": "B5. Permission",
        "table": {
          "headers": [
            "Action",
            "กบค.",
            "หน่วยงานเจ้าของรถ",
            "กรย. เขตนั้นๆ"
          ],
          "rows": [
            [
              "สร้างแผน",
              "✓",
              "✗ (ไม่เห็นขั้นนี้เลยจนกว่าแผนจะมี PO แรก)",
              "✗ (ไม่เห็นขั้นนี้เลยจนกว่าแผนจะมี PO แรก)"
            ],
            [
              "แก้ไขแผน",
              "✓",
              "✗",
              "✗"
            ],
            [
              "ลบแผน",
              "✓",
              "✗",
              "✗"
            ],
            [
              "ดูรายการ/รายละเอียดแผน",
              "✓",
              "✗ ก่อนมี PO แรก",
              "✗ ก่อนมี PO แรก"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "B6. Notification",
        "bullets": [
          "สร้าง/แก้ไข/ลบแผน **ไม่ส่ง notification ถึงใคร** — เป็นงานภายในของ กบค. เท่านั้น (ยืนยันใน `16-overhaul-toast-notification.md` § 2.2 \"เหตุการณ์ที่ไม่ส่ง notification\") ผู้กดเห็นแค่ toast T1 (สร้าง)/T2 (แก้ไข)/T3 (ลบ) บนหน้าจอตัวเอง"
        ]
      },
      {
        "level": "h2",
        "label": "C. Technical AC (มุม Dev)"
      },
      {
        "level": "h3",
        "label": "C1. Field Validation",
        "table": {
          "headers": [
            "ฟิลด์",
            "Type",
            "บังคับ",
            "กฎ",
            "Error Message"
          ],
          "rows": [
            [
              "ชื่อแผน",
              "text",
              "ใช่",
              "ข้อความอิสระ",
              "\"กรุณาระบุชื่อแผน\""
            ],
            [
              "ประจำปีงบประมาณ",
              "select (ปี พ.ศ.)",
              "ค่าตั้งต้นมีให้เสมอ (ยังไม่เคาะว่าบังคับเลือกเองหรือไม่ — ไม่มี error message ระบุไว้ในกันพลาด)",
              "เลือกได้เฉพาะปีปัจจุบันถึง +10 ปี ค่าตั้งต้น = ปี พ.ศ. ปัจจุบัน",
              "ไม่มีระบุ"
            ],
            [
              "วงเงินอนุมัติ (บาท)",
              "number",
              "ใช่",
              "—",
              "\"กรุณาระบุวงเงินอนุมัติ (บาท)\""
            ],
            [
              "เลข WBS",
              "text",
              "ไม่บังคับ (ถ้ามี)",
              "—",
              "ไม่มี"
            ],
            [
              "เลขโครงข่าย",
              "text",
              "ไม่บังคับ (ถ้ามี)",
              "—",
              "ไม่มี"
            ],
            [
              "เลขกิจกรรม",
              "text",
              "ไม่บังคับ (ถ้ามี)",
              "—",
              "ไม่มี"
            ],
            [
              "หนังสืออนุมัติหลักการ",
              "file upload",
              "ใช่",
              "≤10 ไฟล์ ชนิด PDF, PNG หรือ JPG (จากบอร์ด Refinement 29 oct 2026 — เดิมเอกสารนี้ระบุแค่ pdf/jpeg)",
              "\"กรุณาแนบหนังสืออนุมัติหลักการ\""
            ],
            [
              "เอกสารอนุมัติงบ",
              "file upload",
              "ใช่",
              "≤10 ไฟล์ ชนิด PDF, PNG หรือ JPG (จากบอร์ด Refinement 29 oct 2026)",
              "\"กรุณาแนบเอกสารอนุมัติงบ\""
            ],
            [
              "เอกสารอื่น ๆ",
              "file upload",
              "ไม่บังคับ (ถ้ามี)",
              "≤10 ไฟล์ ชนิด PDF, PNG หรือ JPG (จากบอร์ด Refinement 29 oct 2026)",
              "ไม่มี"
            ],
            [
              "ประเภทงบ",
              "ยังไม่เคาะ",
              "ยังไม่เคาะ",
              "⚠️ ไม่มี enum/column รองรับจริง ค่าที่เห็นในทุกแถว mock เป็น \"งบลงทุน\" เหมือนกันหมด (เสี่ยงเป็น placeholder ตายตัว) — ดู SCHEMA['ประเภทงบ'] ใน `code.js` · ยืนยันซ้ำจากบอร์ด Refinement 29 oct 2026: ฟิลด์นี้ปรากฏเฉพาะในตารางรายการ ไม่มีช่องกรอกในฟอร์มสร้าง/แก้ไขแผนเลย (B.5/B.6) และยังเป็น \"งบลงทุน\" ทั้ง 11/11 แถว mock เหมือนเดิม — ยิ่งตอกย้ำว่าอาจเป็นค่าคงที่ตายตัว ไม่ใช่ enum จริง",
              "ไม่มี"
            ]
          ]
        },
        "paragraph": "ขนาดไฟล์สูงสุดต่อไฟล์: ยังไม่เคาะ (เอกสารระบุแค่ \"ตามเกณฑ์เดิมของระบบ\" ไม่ได้บอกตัวเลข — บอร์ด Refinement 29 oct 2026 ก็ไม่มีตัวเลข MB ระบุ มีแค่ cap จำนวนไฟล์ ≤10 และตัวอย่างขนาดไฟล์ mock \"200 KB\" ซึ่งเป็นข้อมูลจำลอง ไม่ใช่ spec)"
      },
      {
        "level": "h3",
        "label": "C2. State Transition",
        "table": {
          "headers": [
            "จากสถานะ",
            "Action",
            "ไปสถานะ",
            "ผู้มีสิทธิ์"
          ],
          "rows": [
            [
              "(ยังไม่มีแผน)",
              "สร้างแผนสำเร็จ",
              "รอเลข PO",
              "กบค."
            ],
            [
              "รอเลข PO / รอดำเนินการ",
              "แก้ไขแผน",
              "คงเดิม (ไม่เปลี่ยนสถานะ)",
              "กบค."
            ],
            [
              "รอเลข PO / รอดำเนินการ",
              "ลบแผน",
              "(แผนหายจากรายการ — soft delete ตาม note ของ `code.js`, ยังไม่ยืนยันจากเอกสาร AC ตรงๆ ว่า soft หรือ hard)",
              "กบค."
            ]
          ]
        },
        "paragraph": "⚠️ **ยังไม่เคาะ**: ชื่อสถานะแผนทางการ — `15-overhaul-AC.md` ยืนยันจากจอจริง 21 ต.ค. 2569 ว่าใช้ 3 ค่า \"รอเลข PO / รอดำเนินการ / เสร็จสิ้น\" แต่ชีต Google Sheet เดิมให้ชื่ออีกชุด (\"กำลังดำเนินการ PO\", \"อนุมัติ PO\") และสถานะงานรายคันอีก 11 ค่า — เอกสารต้นทาง (`15-overhaul-AC.md` \"คำถามรวมที่ต้องเคาะ\" ข้อ 1) ยังไม่ปิดว่าใช้ชุดไหนเป็นทางการที่สุด เอกสารนี้ใช้ชุดจากจอจริงเป็นหลัก"
      },
      {
        "level": "h3",
        "label": "C3. API / Integration",
        "bullets": [
          "`POST /overhauls` → 201 เมื่อสร้างแผนสำเร็จ (implement แล้วจริง — `21-overhaul-full-audit.md` § 1)",
          "`GET /overhauls` → 200 รายการแผน (implement แล้วจริง)",
          "`GET /overhauls/:id` → 200 รายละเอียดแผน (implement แล้วจริง)",
          "`PATCH /overhauls/:id` → 200 เมื่อแก้ไขแผนสำเร็จ (implement แล้วจริง)",
          "`DELETE /overhauls/:id` → 200/204 เมื่อลบแผนสำเร็จ (implement แล้วจริง)",
          "`plan_no` format จริงคือ `ORZ690000X` (`FormatPlanNo`) — ไม่ใช่ placeholder ตัวเลขที่เห็นในดีไซน์ (บอร์ด Refinement 29 oct 2026 ก็ยังไม่ตรงกับ backend: หน้ารายละเอียดแผนแสดง \"หมายเลขแผน Z69000X\" แต่ breadcrumb จุดอื่นแสดง \"แผน 123461\"/\"แผน 123460\" เป็นตัวเลขล้วน — สองรูปแบบนี้ขัดกันเองในมock และไม่ตรงกับ `ORZ690000X` ของจริงทั้งคู่ ยังไม่เคาะ)"
        ]
      },
      {
        "level": "h3",
        "label": "C4. Error Handling",
        "bullets": [
          "เมื่อบันทึก (สร้าง/แก้ไข) ไม่สำเร็จจากฝั่ง server ระบบต้องอยู่หน้าเดิม ค่าที่กรอกคงอยู่ พร้อม toast แสดงรหัสและข้อความผิดพลาดจากระบบ เช่น \"500 Internal Server Error\"",
          "เมื่อเปิดลิงก์แก้ไขแผนที่ถูกลบไปแล้ว ระบบต้องไม่เปิดฟอร์ม แสดง toast \"ไม่พบแผน {เลขแผน}\" และอยู่หน้ารายการแผน"
        ]
      },
      {
        "level": "h3",
        "label": "C5. Audit / Logging",
        "bullets": [
          "**ไม่ต้องบันทึก audit log** สำหรับการแก้ไข/ลบแผน — ยืนยันแล้วจากการอ่านบอร์ดดิบซ้ำ 26 ต.ค. 2569 (`23-figjam-raw-reread-AC-ready.md`): \"ไม่เก็บทั้งคู่ ใครอยากทำไรก็ทำ\" (เป็นข้อยกเว้นที่ยืนยันแล้ว ไม่ใช่ gap ที่ต้องเพิ่ม logging)"
        ]
      },
      {
        "level": "h3",
        "label": "C6. NFR",
        "bullets": [
          "Performance: ยังไม่เคาะตัวเลขเฉพาะฟีเจอร์นี้ — ใช้มาตรฐานรวมโครงการตาม TOR ข้อ 19 (ต้องผ่าน Performance Test ทั้งปริมาณผู้ใช้พร้อมกันและ Response Time ก่อน UAT/PVT)",
          "Security / PDPA: ต้องผ่าน Fortify SCA (source code), Black Duck (composition), Fortify WebInspect (web app) ก่อน Go Live ตาม TOR ข้อ 19 · จัดเก็บ Log การใช้งานอย่างน้อย 90 วันตาม พ.ร.บ. คอมพิวเตอร์ (TOR ข้อ 26) · สอดคล้อง PDPA (TOR ข้อ 26)"
        ]
      },
      {
        "level": "h2",
        "label": "D. ส่วนประกอบท้าย"
      },
      {
        "level": "bold",
        "label": "Out of Scope",
        "bullets": [
          "หน้าจอฝั่งหน่วยงานเจ้าของรถสำหรับดูแผน (ยังไม่มี userflow ฝั่งหน่วยงานเลย — เป็นคำถามรวมข้อ 2 ของ `15-overhaul-AC.md`)",
          "การเชื่อม Smart Inventory สำหรับ \"อะไหล่ที่ใช้\" (ยังจองไว้เฉยๆ ตาม userflow ไม่ใช่เชื่อม API จริง)"
        ]
      },
      {
        "level": "bold",
        "label": "Assumptions",
        "bullets": [
          "หนังสืออนุมัติหลักการและเอกสารอนุมัติงบ ผ่านการอนุมัติจากหน่วยงานที่เกี่ยวข้องมาก่อนแล้วนอกระบบ ก่อนเริ่มสร้างแผน",
          "เลข WBS ที่กรอกอ้างอิงงบที่อนุมัติไว้แล้วใน SAP (ไม่ validate กับ SAP แบบ real-time ในขั้นนี้ — ไม่มีเอกสารยืนยันว่ามี integration นี้)"
        ]
      },
      {
        "level": "bold",
        "label": "สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม",
        "bullets": [
          "ยืนยัน Priority (Must/Should/Could) กับ PO — ไม่มีแหล่งอ้างอิงในเอกสารที่มีอยู่",
          "ยืนยันงวดส่งมอบ/JO ที่ผูกกับฟีเจอร์นี้ — ไม่มีเอกสารระบุไว้",
          "เคาะชื่อสถานะแผนทางการชุดสุดท้าย (จอจริง 3 ค่า \"รอเลข PO/รอดำเนินการ/เสร็จสิ้น\" vs ชีตเดิม \"กำลังดำเนินการ PO/อนุมัติ PO\" vs สถานะรายคัน 11 ค่า) — กระทบ enum บน `plan_status` และข้อความ notification",
          "เคาะที่มาของ \"ประเภทงบ\" (งบลงทุน/งบทำการ) ว่าเป็น enum ใหม่หรือค่าคงที่ตายตัว — ปัจจุบันไม่มี column รองรับ",
          "เคาะว่าช่อง \"ประจำปีงบประมาณ\" บังคับให้ผู้ใช้เลือกเองหรือใช้ค่าตั้งต้น (ปี พ.ศ. ปัจจุบัน) ไปเลยได้ — ไม่มี error message ระบุไว้ถ้าไม่เลือก",
          "หารูปแบบการรันเลขที่แผน (`plan_no`) จริงจากทีม backend",
          "หาตัวเลขขนาดไฟล์สูงสุดต่อไฟล์ที่แนบ (\"ตามเกณฑ์เดิมของระบบ\" ไม่ได้ระบุตัวเลข)",
          "หาจอ/สเปกฝั่งหน่วยงานเจ้าของรถ ว่าเห็นแผนจากหน้าไหน (ยังไม่มี userflow ฝั่งนี้เลย)",
          "เคาะว่าแก้ไขแผนได้ในสถานะไหนบ้าง (แผนที่ดำเนินการแล้วแก้วงเงิน/ปีงบได้ไหม)",
          "เคาะว่าลบแผนที่มี PO และรถกำลังซ่อมอยู่ได้ไหม และลบแล้วกู้คืนได้ไหม",
          "ยืนยันตัวเลข Performance SLA เฉพาะฟีเจอร์นี้ — ตอนนี้มีแค่มาตรฐานรวมโครงการ TOR ข้อ 19 ไม่มีตัวเลขเจาะจง"
        ]
      },
      {
        "level": "bold",
        "label": "ข้อเสนอปิดช่องโหว่ (เสนอโดย senior BA + senior dev ร่วมกัน — เป็นข้อเสนอให้ทีมพิจารณา ไม่ใช่ข้อยืนยันจากเอกสาร/บอร์ดใดๆ)",
        "paragraph": "1. Priority → **Must** เหตุผล: เป็นจุดตั้งต้นของทั้งวงจรงาน Overhaul ไม่มีแผนก็เปิด PO/นัดหมาย/ติดตามงาน/ปิดงานไม่ได้เลยทั้งชุด (US-OH-02 ถึง 08 ทั้งหมดพึ่งพาฟีเจอร์นี้)\n2. งวดส่งมอบ/JO → จัดอยู่ JO เดียวกับ US-OH-02 ถึง 08 ทั้งชุด เหตุผล: เป็น flow ต่อเนื่องเดียวกันตั้งแต่สร้างแผนถึงปิดงาน แยก JO กลางวงจรจะทดสอบ end-to-end ไม่ได้ก่อนส่งมอบ\n3. ชื่อสถานะแผนทางการ → ใช้ชุดจากจอจริง **\"รอเลข PO / รอดำเนินการ / เสร็จสิ้น\"** เหตุผล: เป็นชุดที่เจ้าของงานยืนยันจากจอจริงล่าสุด (21 ต.ค.) และบอร์ด Refinement 29 oct 2026 ก็ใช้ 2 ใน 3 ค่านี้ซ้ำ (รอดำเนินการ/รอเลข PO) สอดคล้องกันข้ามเวลา ส่วนชีตเดิม (\"กำลังดำเนินการ PO\"ฯลฯ) ถือเป็นฉบับร่างก่อนจอจริง\n4. ที่มาของ \"ประเภทงบ\" → เป็น **ค่าคงที่ตายตัว \"งบลงทุน\"** ในเฟสแรก ไม่ใช่ enum ใหม่ เหตุผล: ทั้งฟอร์มสร้าง/แก้ไขไม่มีช่องกรอกเลยทั้งสองรอบที่ตรวจสอบ (21 ต.ค. และบอร์ด 29 oct 2026) และ mock ทุกแถวเป็นค่าเดียวกันหมดทั้งสองรอบ — ถ้าต้องรองรับ \"งบทำการ\" จริงในอนาคตค่อยเพิ่ม enum ทีหลัง\n5. \"ประจำปีงบประมาณ\" บังคับเลือกเองไหม → **ไม่บังคับ** ใช้ค่าตั้งต้น = ปี พ.ศ. ปัจจุบันได้เลย เหตุผล: มี default เสมอและไม่มี error message ระบุไว้ในทุกแหล่งที่ตรวจสอบ ถ้าบังคับจริงปกติต้องมี error message กำกับเหมือนฟิลด์บังคับอื่น\n6. รูปแบบ `plan_no` → ใช้ตามที่ backend ยืนยันแล้ว (`ORZ690000X` จาก `FormatPlanNo`) ไม่ต้องรอ เหตุผล: เป็นโค้ดจริงที่ implement แล้ว ไม่ใช่ข้อเสนอ — ส่วนจอ mock ที่ยังไม่ตรง (Z69000X/ตัวเลขล้วน) ให้แจ้งทีมดีไซน์อัปเดตจอให้ตรง backend แทน\n7. ขนาดไฟล์สูงสุดต่อไฟล์ → เสนอ **10MB/ไฟล์** เป็นค่าเริ่มต้นที่ปลอดภัย เหตุผล: สอดคล้องกับแนวทาง BR-02 ของ US-OH-06 ที่บอกให้ \"ใช้เงื่อนไขการอัปโหลดเดียวกับฟีเจอร์แจ้งซ่อมเดิม\" — ให้ยืนยันตัวเลขจริงจากทีม infra ก่อน แต่ใช้ 10MB ตั้งต้นในการพัฒนาได้\n8. จอฝั่งหน่วยงานเจ้าของรถ → **ยังไม่ทำในเฟสนี้** เหตุผล: หน่วยงานไม่มีสิทธิ์เห็นแผนจนกว่าจะมี PO แรกอยู่แล้วตาม B5 ให้หน่วยงานเห็นผ่าน notification + หน้างานรายคันที่มีอยู่แล้วไปก่อน\n9. แก้ไขแผนได้ในสถานะไหน → แก้ไขได้ทั้ง \"รอเลข PO\" และ \"รอดำเนินการ\" (ตรงกับที่ Gherkin AC-02 ระบุอยู่แล้ว) แต่ **ห้ามแก้ไขเมื่อ \"เสร็จสิ้น\"** เหตุผล: ปิดงานแล้วไม่ควรแก้ย้อนหลัง สอดคล้องกับหลักการ \"ปิดแล้วแก้ไม่ได้อีก\" ที่ใช้ซ้ำทั่วทั้งเอกสารนี้ (US-OH-03 BR-05, US-OH-05 BR-03, US-OH-08 BR-03)\n10. ลบแผนที่มี PO/รถกำลังซ่อม → **ไม่อนุญาต** ถ้ามี PO ที่มีรถสถานะอื่นที่ไม่ใช่ \"ปิดงานแล้ว\" ทั้งหมด เหตุผล: ป้องกันลบงานที่กำลังดำเนินอยู่ · กู้คืนได้ไหม → **ไม่ต้องรองรับ** เพราะ C5 ยืนยันแล้วว่าไม่เก็บ audit log การลบ ถ้าไม่มี log ก็ยากจะกู้คืนอย่างมีความหมาย\n11. Performance SLA → ใช้มาตรฐานรวมโครงการ TOR ข้อ 19 ไปก่อน ไม่ต้องตั้งตัวเลขเฉพาะ เหตุผล: ปริมาณธุรกรรมของฟีเจอร์นี้ต่ำ (สร้าง/แก้ไข/ลบแผนไม่บ่อย ไม่ใช่ high-throughput endpoint)"
      }
    ]
  },
  "po46": {
    "title": "US-OH-02 จัดการ Purchase Order (สร้าง/แก้ไข/ลบ PO)",
    "sections": [
      {
        "level": "h2",
        "label": "A. Story Header",
        "table": {
          "headers": [
            "รายการ",
            "รายละเอียด"
          ],
          "rows": [
            [
              "Story ID",
              "US-OH-02"
            ],
            [
              "TOR Reference",
              "ข้อ 1 ซ่อมแซมและบำรุงรักษายานพาหนะ — T3 ประวัติศูนย์บริการ/อู่ + บันทึกงานซ่อม + ค่าใช้จ่าย (PO ผูกรถกับอู่ภายใต้แผน)"
            ],
            [
              "Priority",
              "ยังไม่เคาะ"
            ],
            [
              "งวดส่งมอบ",
              "ยังไม่เคาะ"
            ],
            [
              "Actor",
              "กบค."
            ]
          ]
        }
      },
      {
        "level": "bold",
        "label": "User Story",
        "paragraph": "ในฐานะเจ้าหน้าที่ กบค. ต้องการสร้าง Purchase Order ผูกรถเข้ากับผู้รับจ้าง (อู่/บริษัท) ภายใต้แผนหนึ่งแผน เพื่อควบคุมว่ารถคันไหนมอบให้อู่ไหนรับผิดชอบซ่อม ภายใต้งบของแผนไหน และใช้เป็นหลักฐานอ้างอิงตอนตรวจรับงาน/จ่ายเงิน"
      },
      {
        "level": "bold",
        "label": "Precondition",
        "bullets": [
          "เปิดหน้ารายละเอียดแผน (จะมี PO อยู่แล้วหรือยังไม่มีก็ได้)",
          "(เฉพาะแก้ไข/ลบ) มี PO อยู่แล้วในแผน"
        ]
      },
      {
        "level": "h2",
        "label": "B. Business AC (มุม BA)"
      },
      {
        "level": "h3",
        "label": "B1. Happy Path",
        "code": [
          "Scenario: AC-01 กบค. สร้าง Purchase Order สำเร็จ\n  Given กบค. เปิดหน้ารายละเอียดแผน\n  When  กบค. กด \"PO\" กรอกชื่อ PO เลือกศูนย์บริการ/อู่ เลือกรถอย่างน้อย 1 คัน แนบใบสั่งจ้าง แล้วกด \"บันทึก\"\n  Then  ระบบสร้าง PO ใหม่ในแผน รถทุกคันใน PO เริ่มงานที่ขั้นที่ 1 สถานะ \"รอนัดหมายเข้าอู่\"\n  And   ถ้าเป็น PO ใบแรกของแผน สถานะแผนเปลี่ยนเป็น \"รอดำเนินการ\"\n  And   แสดง toast \"การสร้าง purchase order สำเร็จ\"\n  And   กลับหน้ารายละเอียดแผนและเห็น PO ใหม่ในตาราง"
        ]
      },
      {
        "level": "h3",
        "label": "B2. Alternative Flow",
        "code": [
          "Scenario: AC-02 กบค. แก้ไข PO เพิ่มรถเข้าไปอีก\n  Given มี PO อยู่แล้วในแผน\n  When  กบค. เปิดฟอร์มแก้ไข PO เพิ่มรถอีกคัน แล้วกด \"บันทึก\" และยืนยันใน modal \"ยืนยันการแก้ไข PO\"\n  Then  รถที่เพิ่มเข้ามาใหม่เริ่มงานที่ขั้นที่ 1 เหมือนรถเดิมในแผน\n  And   จำนวนรถในตาราง PO และในแผนอัปเดต\n  And   แสดง toast \"บันทึกการแก้ไข PO สำเร็จ\""
        ]
      },
      {
        "level": "h3",
        "label": "B3. Exception / Negative Flow",
        "code": [
          "Scenario: AC-03 กบค. กดบันทึก PO โดยกรอกข้อมูลไม่ครบ\n  Given กบค. อยู่ในฟอร์มสร้าง/แก้ไข PO\n  When  กบค. กด \"บันทึก\" โดยยังไม่กรอกชื่อ PO ยังไม่เลือกศูนย์บริการ/อู่ หรือยังไม่แนบใบสั่งจ้าง\n  Then  ระบบไม่บันทึกข้อมูล\n  And   แสดงข้อความใต้ช่องที่ขาดตรงตัว เช่น \"กรุณาระบุชื่อ Purchase Order\", \"กรุณาเลือกศูนย์บริการ/อู่\", \"กรุณาแนบใบสั่งจ้าง\"\n\nScenario: AC-04 กบค. เปิดฟอร์มสร้าง PO จากแผนที่ถูกลบไปแล้ว\n  Given แผนต้นทางถูกลบไปแล้ว\n  When  กบค. เปิดฟอร์มสร้าง PO ของแผนนั้น\n  Then  ระบบไม่เปิดฟอร์ม\n  And   แสดง toast \"ไม่พบแผน\""
        ]
      },
      {
        "level": "h3",
        "label": "B4. Business Rules",
        "bullets": [
          "BR-01 1 PO เลือกรถเข้าได้หลายคัน ต้องเห็นจำนวนที่เลือกไว้แล้วชัดเจนตลอดเวลา (แสดงเป็นชิป มีปุ่มกากบาทเพื่อเอาออก — เปลี่ยนจากรายการสองฝั่งแบบติ๊กแล้วกดเพิ่ม ตามที่เจ้าของงานสั่ง 21 ต.ค. 2569 เฉพาะจอ desktop มือถือยังเป็นแบบเดิมจนกว่าจะทำ)",
          "BR-02 ปุ่มบันทึกต้อง disable จนกรอกฟิลด์บังคับครบ (ชื่อ PO, ศูนย์บริการ/อู่, ใบสั่งจ้าง)",
          "BR-03 แก้ไข PO แล้วจะย้อนกลับโดยไม่บันทึก ต้องมี modal \"ยืนยันการออก\" เตือนก่อนเสมอ",
          "BR-04 ลบ PO ต้องมี modal \"ยืนยันการลบ PO\" บอกหมายเลข PO ชื่อ PO และจำนวนรถที่งานจะถูกลบไปด้วย ก่อนยืนยันทุกครั้ง"
        ]
      },
      {
        "level": "h3",
        "label": "B5. Permission",
        "table": {
          "headers": [
            "Action",
            "กบค.",
            "หน่วยงานเจ้าของรถ",
            "กรย. เขตนั้นๆ"
          ],
          "rows": [
            [
              "สร้าง PO",
              "✓",
              "✗",
              "✗"
            ],
            [
              "แก้ไข PO",
              "✓",
              "✗",
              "✗"
            ],
            [
              "ลบ PO",
              "✓",
              "✗",
              "✗"
            ],
            [
              "ดู PO (ตั้งแต่มี PO แรกในแผน)",
              "✓",
              "✓ (ดูอย่างเดียว)",
              "✓ (ดูอย่างเดียว)"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "B6. Notification",
        "bullets": [
          "สร้าง/แก้ไข PO ที่มีรถถูกเพิ่มเข้ามา → หน่วยงานเจ้าของรถได้รับ **N1** (Info: \"รถ [ทะเบียน] ถูกจัดเข้าแผน Overhaul [ชื่อแผน] ตาม PO [หมายเลข]\") กดแล้วไปหน้ารายละเอียด PO",
          "ลบ PO → **ไม่มี** notification N1 ตาม `16-overhaul-toast-notification.md` § 2.3 (⚠️ ยังไม่เคาะว่าควรมีหรือไม่)",
          "กบค.ที่กดเองเห็นแค่ toast T4 (สร้าง)/T5 (แก้ไข)/T6 (ลบ) — ไม่ใช่ notification"
        ]
      },
      {
        "level": "h2",
        "label": "C. Technical AC (มุม Dev)"
      },
      {
        "level": "h3",
        "label": "C1. Field Validation",
        "table": {
          "headers": [
            "ฟิลด์",
            "Type",
            "บังคับ",
            "กฎ",
            "Error Message"
          ],
          "rows": [
            [
              "ชื่อ Purchase Order",
              "text",
              "ใช่",
              "ข้อความอิสระ เช่น \"ซ่อมระบบแอร์\"",
              "\"กรุณาระบุชื่อ Purchase Order\""
            ],
            [
              "ศูนย์บริการ/อู่",
              "search-select",
              "ใช่",
              "พิมพ์ค้นแล้วเลือกจากรายชื่ออู่ แสดงชื่อ เบอร์โทร ที่ตั้ง",
              "\"กรุณาเลือกศูนย์บริการ/อู่\""
            ],
            [
              "เลือกรถ",
              "multi-select (dropdown + ชิป)",
              "ยังไม่เคาะว่าบังคับเลือกอย่างน้อย 1 คันไหม",
              "พิมพ์ค้นด้วยทะเบียน/จังหวัด เลือกได้หลายคัน",
              "ไม่มีระบุ"
            ],
            [
              "ใบสั่งจ้าง",
              "file upload",
              "ใช่",
              "≤10 ไฟล์ pdf/jpeg",
              "\"กรุณาแนบใบสั่งจ้าง\""
            ],
            [
              "อื่นๆ (ถ้ามี)",
              "file upload",
              "ไม่บังคับ",
              "≤10 ไฟล์ pdf/jpeg",
              "ไม่มี"
            ],
            [
              "มูลค่า PO (บาท)",
              "ไม่มีช่องนี้ในฟอร์มจริง",
              "—",
              "⚠️ ไม่มีช่องกรอกนี้เลยทั้งใน FigJam และ DTO จริง (`21-overhaul-full-audit.md`)",
              "—"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C2. State Transition",
        "table": {
          "headers": [
            "จากสถานะ",
            "Action",
            "ไปสถานะ",
            "ผู้มีสิทธิ์"
          ],
          "rows": [
            [
              "รอเลข PO (แผนยังไม่มี PO)",
              "สร้าง PO ใบแรกสำเร็จ",
              "รอดำเนินการ (แผน) / รอนัดหมายเข้าอู่ (รถทุกคันใน PO)",
              "กบค."
            ],
            [
              "รอดำเนินการ (แผน)",
              "สร้าง PO ใบถัดไป",
              "คงเดิม (แผน) / รอนัดหมายเข้าอู่ (รถใหม่ใน PO)",
              "กบค."
            ],
            [
              "รอดำเนินการ",
              "แก้ไข PO",
              "คงเดิม",
              "กบค."
            ],
            [
              "รอดำเนินการ",
              "ลบ PO (ยังมี PO อื่นเหลือ)",
              "คงเดิม",
              "กบค."
            ],
            [
              "รอดำเนินการ",
              "ลบ PO ตัวสุดท้าย (เหลือ PO = 0)",
              "รอเลข PO (ย้อนกลับ)",
              "กบค."
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C3. API / Integration",
        "bullets": [
          "`POST /overhauls/:id/purchase-orders` → 201 (implement แล้วจริง — `21-overhaul-full-audit.md` § 2)",
          "`GET /overhauls/:id/purchase-orders` → 200",
          "`GET/PUT/DELETE purchaseOrderByIDPath` → รายละเอียด/แก้ไข/ลบ PO (implement แล้วจริง)",
          "`POST /vendors/search` → ค้นหาอู่ (implement แล้วจริง)",
          "`po_number` format จริง `{overhaul_code}-{seq}` (`FormatPONumber`) เช่น `ORZ6900001-01`"
        ]
      },
      {
        "level": "h3",
        "label": "C4. Error Handling",
        "bullets": [
          "บันทึก PO ไม่สำเร็จจากฝั่ง server → อยู่หน้าเดิม พร้อม toast แสดงรหัสและข้อความผิดพลาดจากระบบ เช่น \"500 Internal Server Error\"",
          "เปิดฟอร์มสร้าง PO จากแผนที่ถูกลบไปแล้ว → ไม่เปิดฟอร์ม toast \"ไม่พบแผน\""
        ]
      },
      {
        "level": "h3",
        "label": "C5. Audit / Logging",
        "bullets": [
          "ยังไม่เคาะ — ไม่มีเอกสารยืนยันว่าต้องเก็บ audit log การแก้ไข/ลบ PO (สันนิษฐานตามแนวเดียวกับแผน คือไม่เก็บ แต่ไม่มีแหล่งยืนยันตรงจุดนี้ ต้องถามแยก)"
        ]
      },
      {
        "level": "h3",
        "label": "C6. NFR",
        "bullets": [
          "Performance/Security: ใช้มาตรฐานรวมโครงการเดียวกับ US-OH-01 (TOR ข้อ 19/26) — ไม่มีตัวเลขเฉพาะฟีเจอร์นี้"
        ]
      },
      {
        "level": "h2",
        "label": "D. ส่วนประกอบท้าย"
      },
      {
        "level": "bold",
        "label": "Out of Scope",
        "bullets": [
          "การรองรับ PO ที่มีศูนย์บริการ/อู่มากกว่า 1 แห่งต่อใบ (ปัจจุบัน schema เป็น 1:1 vendor ต่อ PO)",
          "การกรอก/ตรวจสอบมูลค่า PO (บาท) — ไม่มีช่องนี้ในดีไซน์/DTO จริง"
        ]
      },
      {
        "level": "bold",
        "label": "Assumptions",
        "bullets": [
          "รายชื่ออู่ (vendor list) เป็นข้อมูลที่มีอยู่แล้วในระบบ ไม่ใช่กรอกใหม่ทุกครั้งที่สร้าง PO",
          "เลขไมล์ที่แสดงตอนเลือกรถเข้า PO เป็นค่าสด (live) จาก `vms_mas_vehicle.odometer` ไม่ใช่ snapshot"
        ]
      },
      {
        "level": "bold",
        "label": "สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม",
        "bullets": [
          "ยืนยัน Priority (Must/Should/Could) กับ PO — ไม่มีแหล่งอ้างอิง",
          "ยืนยันงวดส่งมอบ/JO ที่ผูกกับฟีเจอร์นี้",
          "เคาะว่า PO หนึ่งใบมีได้แค่ศูนย์บริการ/อู่เดียว หรือมากกว่า 1 แห่งได้ (ลูกค้าฝากคำถามนี้ไว้ในชีตเอง)",
          "เคาะว่าต้องเพิ่มช่องกรอกมูลค่า PO (บาท) หรือไม่ — ปัจจุบันไม่มีทั้งในดีไซน์และ DTO จริง",
          "เคาะว่ารถที่อยู่ใน PO อื่นแล้วเลือกซ้ำเข้า PO ใหม่ได้ไหม (ควรไม่ได้)",
          "เคาะเกณฑ์รถที่ขึ้นให้เลือกได้ (อายุ 10 ปีขึ้นไป/เฉพาะคันที่อนุมัติเข้าแผน หรือเห็นทุกคัน)",
          "เคาะว่าต้องเลือกรถอย่างน้อย 1 คันก่อนบันทึก PO ได้ไหม",
          "เคาะว่าเปลี่ยนอู่ได้ไหมเมื่อมีรถนัดเข้าอู่แล้ว (กระทบข้อมูลที่ prefill ไปหน้านัดหมายแล้ว)",
          "เคาะว่านำรถออกจาก PO ได้ไหมถ้างานรายคันเริ่มไปแล้ว และข้อมูลงานของคันนั้นไปไหน",
          "เคาะว่าลบ PO ที่มีรถกำลังซ่อมอยู่ได้ไหม และงานรายคัน/ความคืบหน้าถูกลบทิ้งหรือเก็บประวัติ",
          "เคาะว่าลบ PO ควรส่ง notification N1 ถึงหน่วยงานเจ้าของรถด้วยไหม (ปัจจุบันไม่มี)",
          "ยืนยันว่าต้องเก็บ audit log การแก้ไข/ลบ PO ไหม (ยังไม่มีแหล่งยืนยันแยกจากกรณีแผน)"
        ]
      },
      {
        "level": "bold",
        "label": "ข้อเสนอปิดช่องโหว่ (เสนอโดย senior BA + senior dev ร่วมกัน — เป็นข้อเสนอให้ทีมพิจารณา ไม่ใช่ข้อยืนยันจากเอกสาร/บอร์ดใดๆ หมายเหตุ: บอร์ด Refinement 29 oct 2026 ไม่มีจอของ Scenario 4-6 เลย จึงไม่มีข้อมูลใหม่มาช่วยปิดช่องโหว่กลุ่มนี้ ข้อเสนอทั้งหมดด้านล่างอิงจาก pattern ที่ใช้ในส่วนอื่นของเอกสารนี้และ schema จริงที่ implement แล้วเท่านั้น)",
        "paragraph": "1. Priority → **Must** เหตุผล: เป็นขั้นต่อจากแผนทันที ไม่มี PO ก็เริ่มงานรายคัน (นัดหมาย/ตรวจรับ/ติดตาม/ปิดงาน) ไม่ได้เลย\n2. งวดส่งมอบ/JO → JO เดียวกับทั้งชุด US-OH-01 ถึง 08\n3. PO 1 ใบ 1 อู่หรือหลายอู่ → **1:1 ต่อไปก่อน** ตาม schema ปัจจุบันที่ implement แล้วจริง เหตุผล: ถ้าต้องการหลายอู่ให้สร้าง PO แยกใบแทน ง่ายกว่าแก้ schema ที่ทำงานอยู่แล้ว และยังคงความชัดเจนของ \"1 PO = 1 อู่รับผิดชอบ\" ที่ใช้เป็นหลักฐานตรวจรับ/จ่ายเงินได้ตรงไปตรงมา\n4. ช่องมูลค่า PO (บาท) → **ไม่ต้องเพิ่ม** เหตุผล: งบคุมอยู่ที่ระดับแผนแล้ว (วงเงินอนุมัติของแผน) การเพิ่มช่องนี้ซ้ำซ้อนและไม่มีรองรับใน DTO จริง ถ้าต้องการเทียบงบใช้จริงให้สรุปจากอะไหล่ที่บันทึกตอนปิดงาน (US-OH-08) แทน\n5. รถซ้ำ PO อื่น → **ห้าม** validate ที่ backend ตอนเลือกรถ ไม่ให้เลือกคันที่อยู่ใน PO อื่นที่ยังไม่ปิดงานอยู่แล้ว เหตุผล: ป้องกันรถคันเดียวมี 2 งานซ่อมพร้อมกันซึ่งขัดกับความเป็นจริง (รถอยู่ที่เดียวได้ที่เดียว)\n6. เกณฑ์รถที่เลือกได้ → แสดงรถทุกคันที่ยังไม่อยู่ใน PO อื่นที่ active ไม่กรองตามอายุ เหตุผล: Overhaul อาจทำกับรถอายุน้อยได้เหมือนกันถ้ามีเหตุจำเป็น ไม่ควรผูกกับเกณฑ์อายุที่ใช้ตัดสินใจจำหน่ายทรัพย์สิน (เป็นคนละ flow คนละวัตถุประสงค์)\n7. บังคับเลือกรถอย่างน้อย 1 คัน → **บังคับ** ปุ่มบันทึก disable จนกว่าจะเลือกอย่างน้อย 1 คัน เหตุผล: PO ที่ไม่มีรถเลยไม่มีประโยชน์ สร้างงานเปล่าในระบบ\n8. เปลี่ยนอู่ได้ไหมเมื่อมีรถนัดแล้ว → **ไม่ให้เปลี่ยน** หลังมีนัดหมายแล้ว ต้องลบนัดหมายก่อนถึงจะแก้ไขอู่ได้ เหตุผล: ป้องกันข้อมูลที่ prefill ไปหน้านัดหมาย (ที่อยู่/เบอร์โทรอู่) ไม่ตรงกับอู่ใหม่\n9. นำรถออกจาก PO ได้ไหมถ้างานเริ่มแล้ว → **ไม่ให้เอาออก** ถ้างานรายคันเริ่มเกินขั้นที่ 1 (นัดหมาย) แล้ว ต้องลบทั้ง PO หรือปล่อยให้ซ่อมจบ flow ไปก่อน เหตุผล: ป้องกันข้อมูลงานลอยไม่มีเจ้าของ\n10. ลบ PO ที่มีรถกำลังซ่อม → **ไม่อนุญาต** ถ้ามีรถคันใดในนั้นสถานะไม่ใช่ \"รอนัดหมายเข้าอู่\" (ขั้นที่ 1) แล้ว เหตุผล: ป้องกันข้อมูลงานที่อยู่ระหว่างซ่อมหายไป ถ้าต้องการยกเลิกงานที่เริ่มไปแล้วควรมี flow \"ยกเลิกงาน\" แยกต่างหาก ไม่ใช่ลบ PO ตรงๆ\n11. ลบ PO ส่ง N1 ไหม → **ส่ง** ใช้ template เดียวกับตอนเพิ่มรถแต่เปลี่ยนข้อความเป็น \"รถ [ทะเบียน] ถูกถอดออกจากแผน Overhaul [ชื่อแผน]\" เหตุผล: ความสมมาตรกับตอนสร้าง/แก้ไข ไม่ให้หน่วยงานงงว่ารถหายไปไหน\n12. audit log การแก้ไข/ลบ PO → **ไม่เก็บ** เหตุผล: เพื่อความสม่ำเสมอของนโยบายกับแผน (BR-06 ของ US-OH-01) เป็นงานภายใน กบค. ระดับเดียวกัน"
      }
    ]
  },
  "scenario7": {
    "title": "US-OH-03 นัดหมายหน่วยงานนำรถเข้า Overhaul",
    "sections": [
      {
        "level": "h2",
        "label": "A. Story Header",
        "table": {
          "headers": [
            "รายการ",
            "รายละเอียด"
          ],
          "rows": [
            [
              "Story ID",
              "US-OH-03"
            ],
            [
              "TOR Reference",
              "ข้อ 1 ซ่อมแซมและบำรุงรักษายานพาหนะ — T2/T3 (ขั้นตอนก่อนเริ่มซ่อมบำรุงตามวาระ)"
            ],
            [
              "Priority",
              "ยังไม่เคาะ"
            ],
            [
              "งวดส่งมอบ",
              "ยังไม่เคาะ"
            ],
            [
              "Actor",
              "กบค. (สร้างนัดหมาย) · หน่วยงานเจ้าของรถ (ตอบรับ/ปฏิเสธ)"
            ]
          ]
        }
      },
      {
        "level": "bold",
        "label": "User Story",
        "paragraph": "ในฐานะเจ้าหน้าที่ กบค. ต้องการนัดหมายวัน-ช่วงเวลาที่จะนำรถไปที่อู่ พร้อมแจ้งหน่วยงานเจ้าของรถล่วงหน้าให้ตอบรับ/ปฏิเสธ เพื่อลดเคสนำรถไปอู่ไม่ตรงนัด และให้หน่วยงานรู้ตัวล่วงหน้าว่ารถจะถูกนำไปซ่อม"
      },
      {
        "level": "bold",
        "label": "Precondition",
        "bullets": [
          "รถอยู่ใน PO และสถานะ \"รอนัดหมายเข้าอู่\" (ขั้นที่ 1 ของ stepper)",
          "กบค. เปิดหน้างานรายคันจากตารางรายการรถในรายละเอียด PO"
        ]
      },
      {
        "level": "h2",
        "label": "B. Business AC (มุม BA)"
      },
      {
        "level": "h3",
        "label": "B1. Happy Path",
        "code": [
          "Scenario: AC-01 กบค. ส่งนัดหมายนำรถเข้าอู่สำเร็จ\n  Given รถอยู่ใน PO สถานะ \"รอนัดหมายเข้าอู่\"\n  When  กบค. กรอกช่วงวันนำรถเข้า สถานที่รับรถ เลือกผู้ประสานงาน (กบค.) จาก search-select แล้วกด \"ส่งนัดหมาย\"\n  Then  สถานะรถเปลี่ยนเป็น \"รอหน่วยงานตอบรับนัดเข้าอู่\"\n  And   แสดง toast \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ\"\n  And   หน่วยงานเจ้าของรถได้รับ notification N2\n  And   หน้างานแสดงรายละเอียดนัดพร้อมข้อความรอตอบกลับและปุ่ม \"แก้ไขนัดหมาย\""
        ]
      },
      {
        "level": "h3",
        "label": "B2. Alternative Flow",
        "code": [
          "Scenario: AC-02 หน่วยงานตอบรับนัดหมาย\n  Given หน่วยงานเจ้าของรถได้รับ notification N2 ให้ตอบรับนัด\n  When  หน่วยงานกด \"ตอบรับ\"\n  Then  สถานะรถเปลี่ยนเป็น \"รอตรวจรับรถ\" ไปขั้นที่ 2 ของ stepper\n  And   กบค. ได้รับ notification N3 และเห็น toast \"หน่วยงาน {สังกัด} ของ {หมายเลข PO} ยืนยันนัดหมายแล้ว\"\n  And   ฟิลด์ในนัดหมายล็อก แก้ไขไม่ได้อีก เห็นได้แค่ preview\n\nScenario: AC-03 กบค. แก้ไขนัดหมายก่อนหน่วยงานตอบ\n  Given หน่วยงานยังไม่ตอบรับ/ปฏิเสธนัดหมาย\n  When  กบค. กด \"แก้ไขนัดหมาย\" แก้ค่าในฟอร์มที่เติมค่าเดิมไว้ แล้วยืนยันใหม่\n  Then  ถือเป็นการส่งนัดใหม่ (toast เดิม)\n  And   หน่วยงานได้รับ notification ใหม่อีกครั้ง"
        ]
      },
      {
        "level": "h3",
        "label": "B3. Exception / Negative Flow",
        "code": [
          "Scenario: AC-04 กบค. กดยืนยันนัดหมายโดยกรอกไม่ครบ\n  Given กบค. อยู่ในฟอร์มนัดหมาย\n  When  กบค. กด \"ส่งนัดหมาย\" โดยยังไม่เลือกช่วงวันนำรถเข้า หรือยังไม่เลือกผู้ประสานงาน\n  Then  ระบบไม่ส่งนัดหมาย\n  And   แสดงข้อความ \"กรุณาเลือกช่วงวันนำรถเข้า\" และ/หรือ \"กรุณาเลือกผู้ประสานงาน\" ใต้ช่องที่ขาด\n\nScenario: AC-05 หน่วยงานปฏิเสธนัดหมาย\n  Given หน่วยงานเจ้าของรถได้รับ notification N2\n  When  หน่วยงานกด \"ปฏิเสธ\" และกรอกเหตุผล (ห้ามเว้นว่าง)\n  Then  สถานะรถเปลี่ยนเป็น \"หน่วยงานปฏิเสธนัดเข้าอู่\"\n  And   กบค. ได้รับ notification N4 พร้อม toast \"หน่วยงาน {สังกัด} ของ {หมายเลข PO} ปฏิเสธนัดหมาย\"\n  And   กบค. แก้ไขนัดหมายใหม่ได้ กลับไปสถานะ \"รอหน่วยงานตอบรับนัดเข้าอู่\""
        ]
      },
      {
        "level": "h3",
        "label": "B4. Business Rules",
        "bullets": [
          "BR-01 ผู้ประสานงาน (ฝั่ง กบค.) ต้องเลือกจากรายชื่อพนักงานจริงในระบบ (ดึงจาก userhub ผ่าน `GET /overhaul/coordinators`) ไม่ใช่กรอกเองเป็น free text",
          "BR-02 เบอร์โทรผู้ประสานงานต้อง prefill อัตโนมัติทันทีที่เลือกชื่อ ไม่ให้ผู้ใช้กรอกเองซ้ำ",
          "BR-03 เลือกวันนำรถเข้าน้อยกว่าวันปัจจุบันไม่ได้",
          "BR-04 ปุ่ม \"ส่งนัดหมาย\" ต้อง disable จนกรอกครบทุกฟิลด์บังคับ",
          "BR-05 เมื่อหน่วยงานตอบรับนัดหมายแล้ว ห้ามแก้ไขนัดหมายได้อีก (เห็นได้แค่ preview)",
          "BR-06 ถ้าหน่วยงานปฏิเสธนัดหมาย ต้องกรอกเหตุผลเสมอ ไม่ปล่อยว่าง"
        ]
      },
      {
        "level": "h3",
        "label": "B5. Permission",
        "table": {
          "headers": [
            "Action",
            "กบค.",
            "หน่วยงานเจ้าของรถ",
            "กรย. เขตนั้นๆ"
          ],
          "rows": [
            [
              "สร้าง/แก้ไขนัดหมาย (ก่อนหน่วยงานตอบรับ)",
              "✓",
              "✗",
              "✗"
            ],
            [
              "ตอบรับ/ปฏิเสธนัดหมาย",
              "✗",
              "✓",
              "✗"
            ],
            [
              "ดูรายละเอียดนัดหมาย",
              "✓",
              "✓",
              "✓ (ดูอย่างเดียวทุกกรณี)"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "B6. Notification",
        "bullets": [
          "N2 (Warning) → หน่วยงานเจ้าของรถ เมื่อ กบค. ส่ง/แก้ไขนัดหมาย — ปุ่มลัด \"ตอบรับนัด\" (ปลายทาง: หน้าตอบรับนัดของหน่วยงาน **ยังไม่มีจอ**)",
          "N3 (Success) → กบค. เมื่อหน่วยงานยืนยันนัดเข้าอู่",
          "N4 (Error) → กบค. เมื่อหน่วยงานปฏิเสธนัดเข้าอู่ พร้อมปุ่มลัด \"นัดใหม่\"",
          "N13 (Warning, เสนอ) → กบค. เมื่อหน่วยงานไม่ตอบรับนัดเกินกำหนด — ⚠️ จำนวนวันยังไม่เคาะ"
        ]
      },
      {
        "level": "h2",
        "label": "C. Technical AC (มุม Dev)"
      },
      {
        "level": "h3",
        "label": "C1. Field Validation",
        "table": {
          "headers": [
            "ฟิลด์",
            "Type",
            "บังคับ",
            "กฎ",
            "Error Message"
          ],
          "rows": [
            [
              "ช่วงวันนำรถเข้า",
              "date range",
              "ใช่",
              "เลือกวันก่อนวันนี้ไม่ได้",
              "\"กรุณาเลือกช่วงวันนำรถเข้า\""
            ],
            [
              "สถานที่รับรถ",
              "text",
              "ยังไม่เคาะ",
              "พบใหม่จากบอร์ด Refinement 29 oct 2026 — placeholder \"ระบุสถานที่รับรถ\" ไม่เคยอยู่ในเอกสารนี้มาก่อน ยังไม่เคาะว่าบังคับกรอกไหม และขัดกับ Assumption เดิมที่ว่าสถานที่คือศูนย์บริการ/อู่ตาม PO เสมอ",
              "ไม่มีระบุ"
            ],
            [
              "ผู้ประสานงาน (กบค.)",
              "search-select (userhub)",
              "ใช่",
              "พิมพ์ค้นชื่อ/รหัสพนักงาน ห้าม free text",
              "\"กรุณาเลือกผู้ประสานงาน\""
            ],
            [
              "เบอร์โทรผู้ประสานงาน (กบค.)",
              "text (readonly)",
              "prefill อัตโนมัติ",
              "แก้ไขไม่ได้เอง",
              "ไม่มี"
            ],
            [
              "ศูนย์บริการ/อู่ + เบอร์โทร + ที่อยู่",
              "text (readonly)",
              "prefill จาก PO",
              "แสดงอย่างเดียว ไม่มีช่องให้กรอกอู่/หมายเหตุในจอ desktop ที่ยืนยันแล้ว",
              "ไม่มี"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C2. State Transition",
        "table": {
          "headers": [
            "จากสถานะ",
            "Action",
            "ไปสถานะ",
            "ผู้มีสิทธิ์"
          ],
          "rows": [
            [
              "รอนัดหมายเข้าอู่",
              "กบค. ยืนยันนัดหมายสำเร็จ",
              "รอหน่วยงานตอบรับนัดเข้าอู่",
              "กบค."
            ],
            [
              "รอหน่วยงานตอบรับนัดเข้าอู่",
              "หน่วยงานตอบรับ",
              "รอตรวจรับรถ (ขั้นที่ 2)",
              "หน่วยงานเจ้าของรถ"
            ],
            [
              "รอหน่วยงานตอบรับนัดเข้าอู่",
              "หน่วยงานปฏิเสธ",
              "หน่วยงานปฏิเสธนัดเข้าอู่",
              "หน่วยงานเจ้าของรถ"
            ],
            [
              "หน่วยงานปฏิเสธนัดเข้าอู่",
              "กบค. แก้ไขนัดหมายใหม่",
              "รอหน่วยงานตอบรับนัดเข้าอู่",
              "กบค."
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C3. API / Integration",
        "bullets": [
          "`PATCH .../accept` → หน่วยงานตอบรับนัด (implement แล้วจริง — `21-overhaul-full-audit.md` § 3)",
          "`PATCH .../reject` → หน่วยงานปฏิเสธนัด (implement แล้วจริง)",
          "`PATCH .../response` → บันทึกการตอบกลับ (implement แล้วจริง)",
          "`GET /overhaul/coordinators` → ดึงรายชื่อผู้ประสานงานจาก userhub (implement แล้วจริง)",
          "Scenario 7 (นัดนำรถเข้า) ยืนยันแล้วว่า implement ครบ API+DB ไม่มี gap เหลือ"
        ]
      },
      {
        "level": "h3",
        "label": "C4. Error Handling",
        "bullets": [
          "ส่งนัดหมายไม่สำเร็จจากฝั่ง server → อยู่หน้าเดิม พร้อม toast \"นัดหมาย {หมายเลข PO} ไม่สำเร็จ\""
        ]
      },
      {
        "level": "h3",
        "label": "C5. Audit / Logging",
        "bullets": [
          "ยังไม่เคาะ — ไม่มีเอกสารยืนยันว่าต้องเก็บ log การแก้ไขนัดหมายซ้ำ (เช่น ประวัติการแก้ไขนัดก่อนหน่วยงานตอบรับ)"
        ]
      },
      {
        "level": "h3",
        "label": "C6. NFR",
        "bullets": [
          "ใช้มาตรฐานรวมโครงการเดียวกับ US-OH-01 (TOR ข้อ 19/26) — ไม่มีตัวเลขเฉพาะฟีเจอร์นี้"
        ]
      },
      {
        "level": "h2",
        "label": "D. ส่วนประกอบท้าย"
      },
      {
        "level": "bold",
        "label": "Out of Scope",
        "bullets": [
          "หน้าจอฝั่งหน่วยงานเจ้าของรถสำหรับตอบรับ/ปฏิเสธนัดหมาย (ยังไม่มีจอเลย)",
          "ช่องหมายเหตุในฟอร์มนัดหมาย (มีใน userflow แต่จอ desktop ที่ยืนยันแล้วไม่มี)"
        ]
      },
      {
        "level": "bold",
        "label": "Assumptions",
        "bullets": [
          "สถานที่รับ-ส่งรถคือศูนย์บริการ/อู่ตาม PO เสมอ (ไม่มีช่องให้เลือกที่อื่น) — ⚠️ assumption นี้อาจไม่ตรงแล้ว เพราะบอร์ด Refinement 29 oct 2026 พบฟิลด์ \"สถานที่รับรถ\" ที่กรอกได้แยกต่างหาก ยังไม่เคาะว่า assumption เดิมยังใช้ได้ไหม",
          "จอมือถือของฟอร์มนัดหมายยังไม่ถูกปรับตามจอ desktop ฉบับล่าสุด จนกว่าจะทำมือถือจริง"
        ]
      },
      {
        "level": "bold",
        "label": "สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม",
        "bullets": [
          "ยืนยัน Priority (Must/Should/Could) กับ PO — ไม่มีแหล่งอ้างอิง",
          "ยืนยันงวดส่งมอบ/JO ที่ผูกกับฟีเจอร์นี้",
          "หาจอ/สเปกฝั่งหน่วยงานเจ้าของรถสำหรับตอบรับ/ปฏิเสธนัดหมาย — ยังไม่มีจอเลย",
          "[x] ~~เคาะคำบนปุ่มยืนยันนัดหมายให้ตรงกัน~~ — ปิดแล้ว 26 ต.ค. 2569 จากบอร์ด Refinement 29 oct 2026 ยืนยัน \"ส่งนัดหมาย\"",
          "เคาะว่าฟิลด์ \"สถานที่รับรถ\" (พบใหม่จากบอร์ด Refinement 29 oct 2026) บังคับกรอกไหม และขัดกับ assumption เดิมเรื่องสถานที่ตายตัวตามอู่ของ PO หรือไม่",
          "เคาะว่า badge ตัวเลขข้างปุ่ม \"แก้ไขนัดหมาย\" (พบใหม่จากบอร์ด) คือตัวนับอะไร",
          "ยืนยันว่า selector \"รูปแบบการซ่อม\" ที่พบในจอ S13 เป็นของ Overhaul จริงหรือปนมาจากคอมโพเนนต์อื่น",
          "เคาะจำนวนวันแจ้งเตือนล่วงหน้าก่อนถึงวันนัด และระยะเวลาที่หน่วยงานไม่ตอบก่อนเตือนซ้ำ (N12/N13)",
          "ยืนยันว่าต้องเก็บ log การแก้ไขนัดหมายซ้ำก่อนหน่วยงานตอบรับไหม"
        ]
      },
      {
        "level": "bold",
        "label": "ข้อเสนอปิดช่องโหว่ (เสนอโดย senior BA + senior dev ร่วมกัน — เป็นข้อเสนอให้ทีมพิจารณา ไม่ใช่ข้อยืนยันจากเอกสาร/บอร์ดใดๆ)",
        "paragraph": "1. Priority → **Must** เหตุผล: เป็นขั้นแรกของ flow งานรายคัน ไม่มีนัดหมายก็เริ่มซ่อมไม่ได้\n2. งวดส่งมอบ/JO → JO เดียวกับทั้งชุด US-OH-01 ถึง 08\n3. จอฝั่งหน่วยงาน → **ยังไม่ทำเฟสนี้** เหตุผล: ปุ่มลัด \"ตอบรับนัด\" จาก N2 ชี้ไปหน้าที่ยังไม่มี เสนอให้ทำแค่ popup ยืนยัน/ปฏิเสธแบบง่ายใน notification panel โดยตรง ไม่ต้องทำหน้าเต็มในเฟสแรก ลดงานแต่ยังปิด use case ได้\n4. ฟิลด์ \"สถานที่รับรถ\" บังคับไหม/ขัด assumption → เสนอ **เก็บไว้แต่ prefill จากที่อยู่อู่ของ PO เป็นค่าเริ่มต้นและแก้ไขได้ (ไม่บังคับ)** เหตุผล: รองรับกรณีพิเศษเช่นไปรับรถนอกสถานที่ โดยไม่ต้องขัดกับ assumption เดิม แค่ขยายให้ยืดหยุ่นขึ้น\n5. badge ตัวเลขข้าง \"แก้ไขนัดหมาย\" → เสนอว่าเป็น**ตัวนับจำนวนครั้งที่ส่ง/แก้ไขนัดหมายซ้ำ** ใช้แสดงผลอย่างเดียว ไม่กระทบ logic เสนอให้ backend เก็บ counter ง่ายๆ ที่ increment ทุกครั้งที่ส่งนัดใหม่\n6. selector \"รูปแบบการซ่อม\" → **ไม่เพิ่มเข้า AC** จนกว่าทีมออกแบบจะยืนยันว่าเป็นของ Overhaul จริง (ไม่ใช่ปนจากคอมโพเนนต์อื่น)\n7. จำนวนวันแจ้งเตือนล่วงหน้า/เตือนซ้ำ (N12/N13) → เสนอ **เตือนล่วงหน้า 1 วันก่อนถึงวันนัด และเตือนซ้ำถ้าหน่วยงานไม่ตอบภายใน 3 วันทำการ** เหตุผล: เป็นค่าเริ่มต้นที่ใช้กันทั่วไปในระบบแจ้งเตือนราชการ ปรับได้ภายหลังตามพฤติกรรมใช้งานจริง\n8. log การแก้ไขนัดหมายซ้ำ → **ไม่ต้องเก็บ** เหตุผล: สอดคล้องกับนโยบายรวม (BR-06 US-OH-01) ที่ไม่เก็บ log การแก้ไขงานภายใน กบค."
      }
    ]
  },
  "scenario8": {
    "title": "US-OH-04 ตรวจรับรถก่อน Overhaul (Check Pick-up)",
    "sections": [
      {
        "level": "h2",
        "label": "A. Story Header",
        "table": {
          "headers": [
            "รายการ",
            "รายละเอียด"
          ],
          "rows": [
            [
              "Story ID",
              "US-OH-04"
            ],
            [
              "TOR Reference",
              "ข้อ 1 ซ่อมแซมและบำรุงรักษายานพาหนะ — T3 ประวัติศูนย์บริการ/อู่ + บันทึกงานซ่อม"
            ],
            [
              "Priority",
              "ยังไม่เคาะ"
            ],
            [
              "งวดส่งมอบ",
              "ยังไม่เคาะ"
            ],
            [
              "Actor",
              "กบค. + หน่วยงานเจ้าของรถ (ลงนามร่วมกัน)"
            ]
          ]
        }
      },
      {
        "level": "bold",
        "label": "User Story",
        "paragraph": "ในฐานะเจ้าหน้าที่ กบค. ต้องการบันทึกการตรวจสภาพรถตอนรับเข้าอู่พร้อมลงนามรับรองจากทั้งสองฝ่าย เพื่อเป็นหลักฐานยืนยันสภาพรถ ณ วันรับเข้า ป้องกันข้อพิพาทเรื่องสภาพรถเสียหายเพิ่มระหว่างอยู่ที่อู่"
      },
      {
        "level": "bold",
        "label": "Precondition",
        "bullets": [
          "หน่วยงานยืนยันนัดแล้ว รถอยู่สถานะ \"รอตรวจรับรถ\" (ขั้นที่ 2 ของ stepper)"
        ]
      },
      {
        "level": "h2",
        "label": "B. Business AC (มุม BA)"
      },
      {
        "level": "h3",
        "label": "B1. Happy Path",
        "code": [
          "Scenario: AC-01 กบค. ยืนยันรับรถสำเร็จ\n  Given รถอยู่สถานะ \"รอตรวจรับรถ\"\n  When  กบค. ติ๊กรายการตรวจสอบตาม checklist ใส่หมายเหตุ เลือกผู้ลงนามฝั่ง กบค. และฝั่งหน่วยงานเจ้าของรถ กดเซ็นทั้งสองฝ่าย แล้วกด \"ยืนยันรับรถ\"\n  Then  สถานะรถเปลี่ยนเป็น \"กำลังซ่อม\" ไปขั้นที่ 3 ของ stepper\n  And   แสดง toast \"ยืนยันรับรถสำเร็จ\"\n  And   หน่วยงานเจ้าของรถได้รับ notification N5"
        ]
      },
      {
        "level": "h3",
        "label": "B2. Alternative Flow",
        "code": [
          "Scenario: AC-02 กบค. เซ็นฝั่งตัวเองก่อนแล้วรอหน่วยงานเซ็น\n  Given รายการตรวจสอบติ๊กไว้บางส่วนแล้ว\n  When  กบค. กด \"เซ็น\" ฝั่ง กบค. ก่อน\n  Then  ฝั่ง กบค. แสดง \"ลงนามแล้ว\" พร้อมวันที่\n  And   ปุ่ม \"ยืนยันรับรถ\" ยังกดไม่ได้จนกว่าฝั่งหน่วยงานจะเซ็นด้วย"
        ]
      },
      {
        "level": "h3",
        "label": "B3. Exception / Negative Flow",
        "code": [
          "Scenario: AC-03 กบค. กด \"ยืนยันรับรถ\" ก่อนลงนามครบ\n  Given ยังลงนามไม่ครบทั้งสองฝ่าย\n  When  กบค. พยายามกด \"ยืนยันรับรถ\"\n  Then  ปุ่มถูก disable กดไม่ได้ (เสนอจาก userflow — ไม่ได้ระบุข้อความ error ไว้)"
        ]
      },
      {
        "level": "h3",
        "label": "B4. Business Rules",
        "bullets": [
          "BR-01 กด \"ยืนยันรับรถ\" ไม่ได้จนกว่าจะลงนามครบทั้งสองฝ่าย",
          "BR-02 ⚠️ ยังไม่ชัดเจนจากบอร์ด: ต้องติ๊กครบทุกช่อง checklist ก่อนยืนยันได้ไหม หรือติ๊กไม่ผ่านบางข้อได้",
          "BR-03 ปุ่มท้ายหน้า \"ย้อนกลับ\" ชิดซ้าย \"ยืนยันรับรถ\" ชิดขวา"
        ]
      },
      {
        "level": "h3",
        "label": "B5. Permission",
        "table": {
          "headers": [
            "Action",
            "กบค.",
            "หน่วยงานเจ้าของรถ",
            "กรย. เขตนั้นๆ"
          ],
          "rows": [
            [
              "กรอก checklist + กดยืนยันรับรถในระบบ",
              "✓",
              "⚠️ ยังไม่เคาะ (ร่วมลงนามรับรถจริงหน้างาน แต่ชีตให้สิทธิ์ \"แก้ไข\" ในระบบกับ กบค. คนเดียว — ต้องเคาะว่าหน่วยงานกดยืนยันในระบบได้ด้วยไหม)",
              "✗ (ดูอย่างเดียว)"
            ],
            [
              "ลงนามรับรถ (หน้างานจริง)",
              "✓",
              "✓",
              "✗"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "B6. Notification",
        "bullets": [
          "N5 (Success, เสนอ) → หน่วยงานเจ้าของรถ เมื่อ กบค. ยืนยันรับรถเข้า Overhaul — ปลายทาง: หน้างานรายคัน (ดูอย่างเดียว)"
        ]
      },
      {
        "level": "h2",
        "label": "C. Technical AC (มุม Dev)"
      },
      {
        "level": "h3",
        "label": "C1. Field Validation",
        "table": {
          "headers": [
            "ฟิลด์",
            "Type",
            "บังคับ",
            "กฎ",
            "Error Message"
          ],
          "rows": [
            [
              "รายการตรวจสอบ (checklist)",
              "checkbox list + หมายเหตุ",
              "⚠️ ยังไม่เคาะ",
              "ชุดตายตัวหรือแยกตามประเภทรถ — ยังไม่เคาะ จากบอร์ด Refinement 29 oct 2026 พบรายการที่อ่านได้ 12 ข้อ: สภาพตัวถังและสี, สภาพยาง, ยางอะไหล่, ระบบไฟแสงสว่าง, เครื่องมือประจำรถ/แม่แรง/ประแจถอดล้อ, อุปกรณ์บนหน้าปัด/แตร, วิทยุ/ลำโพง/เสาอากาศ/วิทยุรับ-ส่ง, กระจกมองข้างซ้าย-ขวา/กระจกมองหลัง, ป้ายทะเบียนติดกระจกและ พรบ., แผ่นป้ายทะเบียนหน้า-หลัง, ใบปัดน้ำฝน, ฝาถังน้ำมัน — แต่ละข้อเลือกสถานะ \"มี\"/\"ไม่มี\"/\"ชำรุด\"/\"ผิดรุ่น\" ได้ ⚠️ **ข้อควรระวัง**: เฟรมนี้มีร่องรอยข้อความปนจากคอมโพเนนต์ \"แจ้งรถเสีย\" ที่ใช้ร่วมกัน จึงยังไม่ยืนยัน 100% ว่ารายการนี้เป็นของ Overhaul ล้วนๆ และขัดกับ Assumption เดิมของเอกสารนี้ที่ว่า \"ข้อมูลจำลองในจอใช้ 8 ข้อ\" ต้องยืนยันกับทีมก่อนนำไปเขียนโค้ด",
              "ไม่มีระบุ"
            ],
            [
              "ลงนามรับรถ (กบค.)",
              "signature",
              "ใช่ (ต้องเซ็นก่อนยืนยันได้)",
              "จากบอร์ด Refinement 29 oct 2026: ไม่มีกลไกวาดลายเซ็นหรือยืนยันตัวตน เป็นการเลือกชื่อจาก search-select ฟิลด์ \"ผู้รับมอบ (กบค.)\" แล้วกดปุ่ม \"เซ็นลงนาม\" — แก้ไขได้ด้วยปุ่ม \"แก้ไขลงนาม\"",
              "ไม่มีระบุ"
            ],
            [
              "ลงนามรับรถ (หน่วยงาน)",
              "signature",
              "ใช่",
              "จากบอร์ด Refinement 29 oct 2026: เดียวกับฝั่ง กบค. — เลือกชื่อจาก search-select ฟิลด์ \"ผู้ส่งมอบรถ\" แล้วกดปุ่ม \"เซ็นลงนาม\" ยังไม่เคาะว่าเซ็นจากเครื่องเดียวกับ กบค. หรือฝั่งตัวเอง",
              "ไม่มีระบุ"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C2. State Transition",
        "table": {
          "headers": [
            "จากสถานะ",
            "Action",
            "ไปสถานะ",
            "ผู้มีสิทธิ์"
          ],
          "rows": [
            [
              "รอตรวจรับรถ",
              "กบค. ยืนยันรับรถสำเร็จ (ลงนามครบ 2 ฝ่าย)",
              "กำลังซ่อม (ขั้นที่ 3)",
              "กบค."
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C3. API / Integration",
        "bullets": [
          "⚠️ **ไม่มี route ใดๆ รองรับ Scenario นี้เลย** — 0% backend ตาม `21-overhaul-full-audit.md` § 4 ตั้งใจ reuse โดเมนซ่อม (`vms_mas_repair_job_vehicle_handover_items` + `vms_trn_repair_job_vehicle_handover_form_items`) แต่ยังไม่มี FK เชื่อม Overhaul เลย",
          "ชื่อตาราง draft ที่เจอบนบอร์ดดิบ (26 ต.ค. 2569, `23-figjam-raw-reread-AC-ready.md`): `vms_trn_overhaul_po_vehicle`, `vms_trn_overhaul_inspection_form_items` — ยังไม่ migrate จริง"
        ]
      },
      {
        "level": "h3",
        "label": "C4. Error Handling",
        "bullets": [
          "ยังไม่เคาะ — ไม่มี sticky FE/BE ระบุไว้สำหรับ scenario นี้ (ต่างจาก scenario อื่นที่มี breakdown ชัดเจน)"
        ]
      },
      {
        "level": "h3",
        "label": "C5. Audit / Logging",
        "bullets": [
          "ยังไม่เคาะ — ควรมี log การลงนาม (ใครเซ็น เมื่อไหร่) แต่ไม่มีเอกสารยืนยัน requirement นี้ตรงๆ"
        ]
      },
      {
        "level": "h3",
        "label": "C6. NFR",
        "bullets": [
          "ใช้มาตรฐานรวมโครงการเดียวกับ US-OH-01 (TOR ข้อ 19/26)"
        ]
      },
      {
        "level": "h2",
        "label": "D. ส่วนประกอบท้าย"
      },
      {
        "level": "bold",
        "label": "Out of Scope",
        "bullets": [
          "Checklist ที่แยกตามประเภทรถ (ถ้ามี) — ยังไม่เคาะว่าต้องมีหรือไม่"
        ]
      },
      {
        "level": "bold",
        "label": "Assumptions",
        "bullets": [
          "รายการตรวจสอบอ้างอิงรูปแบบเดียวกับเอกสารตรวจสภาพของงานซ่อมเดิมที่ กบค. ใช้อยู่แล้ว (ข้อมูลจำลองในจอใช้ 8 ข้อ ณ รอบที่เขียนเอกสารนี้ครั้งแรก — บอร์ด Refinement 29 oct 2026 ให้เห็น 12 ข้อ ดู C1 ด้านบน ยังไม่เคาะว่าชุดไหนเป็นของจริง)"
        ]
      },
      {
        "level": "bold",
        "label": "สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม",
        "bullets": [
          "ยืนยัน Priority (Must/Should/Could) กับ PO — ไม่มีแหล่งอ้างอิง",
          "ยืนยันงวดส่งมอบ/JO ที่ผูกกับฟีเจอร์นี้",
          "เคาะว่าต้องติ๊กครบทุกข้อ checklist ก่อนยืนยันรับรถได้ไหม หรือติ๊กไม่ผ่านบางข้อได้",
          "เคาะว่าหน่วยงานเจ้าของรถกดยืนยันรับรถในระบบได้ด้วยไหม หรือสิทธิ์อยู่ที่ กบค. คนเดียว",
          "เคาะว่า checklist ตรวจสภาพเป็นชุดตายตัวหรือแยกตามประเภทรถ — บอร์ด Refinement 29 oct 2026 มีรายการ 12 ข้อให้ดูแล้ว แต่ยังต้องยืนยันว่าไม่ได้ปนจากคอมโพเนนต์ \"แจ้งรถเสีย\"",
          "[x] ~~เคาะวิธีลงนาม (วาดบนจอ/ยืนยันตัวตน/พิมพ์ชื่อ)~~ — ปิดแล้ว 26 ต.ค. 2569 จากบอร์ด Refinement 29 oct 2026: เป็นการเลือกชื่อจาก search-select แล้วกดปุ่ม \"เซ็นลงนาม\" ไม่มีวาด/ยืนยันตัวตน ยังเหลือแค่ว่าหน่วยงานเซ็นจากเครื่องเดียวกับ กบค. หรือฝั่งตัวเอง ยังไม่เคาะ",
          "เคาะว่าย้อนกลับไปขั้นที่ 1 (นัดหมายใหม่) ได้ไหมเมื่อรถไม่มาตามนัด",
          "เคาะสถาปัตยกรรม schema — สร้างแถว `vms_trn_repair_job` ปลอมคู่กัน (เสี่ยงปนข้าม domain) หรือสร้างตารางใหม่เฉพาะ Overhaul",
          "หา/สร้าง API route รองรับ scenario นี้ — ปัจจุบัน 0% backend ตาม `21-overhaul-full-audit.md` § 4",
          "ยืนยัน/migrate ตาราง `vms_trn_overhaul_po_vehicle`, `vms_trn_overhaul_inspection_form_items` ที่ยังเป็นแค่ชื่อ draft",
          "นำ scenario นี้เข้าคุยในที่ประชุมก่อนพัฒนา — ไม่มี sticky FE/BE วางไว้เหมือน scenario อื่น",
          "เคาะข้อความ error ตอนกด \"ยืนยันรับรถ\" ก่อนลงนามครบ — ปัจจุบันแค่ disable ปุ่ม ไม่มี error message ระบุ",
          "ยืนยันว่าต้องเก็บ log การลงนาม (ใครเซ็น เมื่อไหร่) ไหม"
        ]
      },
      {
        "level": "bold",
        "label": "ข้อเสนอปิดช่องโหว่ (เสนอโดย senior BA + senior dev ร่วมกัน — เป็นข้อเสนอให้ทีมพิจารณา ไม่ใช่ข้อยืนยันจากเอกสาร/บอร์ดใดๆ)",
        "paragraph": "1. Priority → **Must** เหตุผล: เป็นหลักฐานยืนยันสภาพรถก่อนเริ่มซ่อม ป้องกันข้อพิพาทที่กระทบความน่าเชื่อถือของทั้งระบบถ้าไม่มี\n2. งวดส่งมอบ/JO → JO เดียวกับทั้งชุด US-OH-01 ถึง 08\n3. ติ๊กครบทุกข้อ checklist ก่อนยืนยันได้ไหม → **ไม่บังคับติ๊กผ่านทุกข้อ** อนุญาตติ๊ก \"ชำรุด\"/\"ผิดรุ่น\" ได้และยังเซ็นต่อได้ เหตุผล: จุดประสงค์ของ checklist คือบันทึกสภาพรถ ณ วันรับเข้าให้ครบถ้วน ไม่ใช่เงื่อนไขผ่าน/ไม่ผ่านแบบ Safety (นั่นเป็นหน้าที่ของ US-OH-06)\n4. หน่วยงานกดยืนยันรับรถในระบบได้ไหม → **ไม่ได้** สิทธิ์กดยืนยันในระบบอยู่ที่ กบค. คนเดียว (ตามที่ B5 ปัจจุบันเขียนไว้) หน่วยงานร่วมลงนามหน้างานจริงเท่านั้น เหตุผล: สอดคล้องกับรูปแบบสิทธิ์ทั้งเอกสารที่หน่วยงานเป็น \"ดูอย่างเดียว\" ในระบบตลอดทั้ง flow\n5. checklist ตายตัวหรือแยกตามประเภทรถ → ใช้ **ชุดตายตัว 12 ข้อ** (จากบอร์ด Refinement 29 oct 2026) เป็นเฟสแรก ไม่แยกตามประเภทรถ เหตุผล: ลดความซับซ้อนตอนเริ่มต้น ค่อยแยกทีหลังถ้าพบว่าจำเป็นจริงจากการใช้งาน\n6. ย้อนกลับไปขั้นที่ 1 ถ้ารถไม่มาตามนัด → **ได้** ผ่านปุ่ม \"ย้อนกลับ\" ที่มีอยู่แล้วในหน้า (BR-03 ระบุปุ่มนี้ไว้แล้วแต่ไม่ได้บอกปลายทาง) เสนอให้ย้อนกลับไปขั้นที่ 1 แล้วสร้างนัดหมายใหม่ได้เลย\n7. schema สร้างแถวปลอมคู่ domain ซ่อม vs ตารางใหม่เฉพาะ Overhaul → **สร้างตารางใหม่เฉพาะ Overhaul** (ตามชื่อ draft ที่เจอแล้ว `vms_trn_overhaul_inspection_form_items`) เหตุผล: ลด coupling ข้าม domain และแก้ปัญหาที่ audit เดิมเตือนไว้เรื่อง FK ไม่เชื่อมกับโดเมนซ่อมทั่วไป\n8. error message ตอนกด \"ยืนยันรับรถ\" ก่อนลงนามครบ → **ไม่ต้องมี error message แยก** แค่ disable ปุ่มพอ เหตุผล: ใช้ pattern เดียวกับปุ่ม \"ส่งนัดหมาย\"/\"บันทึก\" อื่นๆ ในเอกสารนี้ที่ disable เฉยๆ ไม่มีข้อความ\n9. log การลงนาม → **เก็บ** `signed_at` + `signed_by` ต่อฝ่าย (ไม่ใช่ audit log เต็มรูปแบบ แค่ timestamp พื้นฐาน) เหตุผล: ใช้เป็นหลักฐานทางกฎหมายได้ถ้าต้องพิพาทเรื่องสภาพรถ ตรงกับจุดประสงค์ของ scenario นี้โดยตรง"
      }
    ]
  },
  "scenario911": {
    "title": "US-OH-05 ติดตามงานซ่อม (Follow-up) — เพิ่ม/แก้ไข/ลบความคืบหน้า",
    "sections": [
      {
        "level": "h2",
        "label": "A. Story Header",
        "table": {
          "headers": [
            "รายการ",
            "รายละเอียด"
          ],
          "rows": [
            [
              "Story ID",
              "US-OH-05"
            ],
            [
              "TOR Reference",
              "ข้อ 1 ซ่อมแซมและบำรุงรักษายานพาหนะ — T3 บันทึกงานซ่อม + ค่าใช้จ่าย"
            ],
            [
              "Priority",
              "ยังไม่เคาะ"
            ],
            [
              "งวดส่งมอบ",
              "ยังไม่เคาะ"
            ],
            [
              "Actor",
              "กบค."
            ]
          ]
        }
      },
      {
        "level": "bold",
        "label": "User Story",
        "paragraph": "ในฐานะเจ้าหน้าที่ กบค. ต้องการบันทึกความคืบหน้างานซ่อมที่อู่เป็นระยะๆ เพื่อติดตามสถานะงานได้โดยไม่ต้องโทรถามอู่ซ้ำๆ และมีประวัติย้อนดูได้ว่าอู่รายงานความคืบหน้าอะไรไว้บ้าง เมื่อไหร่"
      },
      {
        "level": "bold",
        "label": "Precondition",
        "bullets": [
          "รถอยู่สถานะ \"กำลังซ่อม\" (ขั้นที่ 3 ของ stepper)"
        ]
      },
      {
        "level": "h2",
        "label": "B. Business AC (มุม BA)"
      },
      {
        "level": "h3",
        "label": "B1. Happy Path",
        "code": [
          "Scenario: AC-01 กบค. เพิ่มความคืบหน้าสำเร็จ\n  Given รถอยู่สถานะ \"กำลังซ่อม\"\n  When  กบค. กด \"ความคืบหน้า\" กรอกวันที่และเวลา กับรายละเอียด (หมายเหตุใส่หรือไม่ก็ได้) แล้วกด \"บันทึก\"\n  Then  รายการความคืบหน้าเพิ่มเข้าตาราง\n  And   แสดง toast \"เพิ่มความคืบหน้าสำเร็จ\"\n  And   ปุ่ม \"ซ่อมสำเร็จ\" เปิดใช้ได้เมื่อมีอย่างน้อย 1 รายการ\n\nScenario: AC-02 กบค. กด \"ซ่อมสำเร็จ\"\n  Given มีความคืบหน้าอย่างน้อย 1 รายการ\n  When  กบค. กด \"ซ่อมสำเร็จ\"\n  Then  สถานะรถเปลี่ยนเป็น \"รอตรวจสภาพ Safety\" ไปขั้นที่ 4 ของ stepper\n  And   แสดง toast \"บันทึกซ่อมสำเร็จ\""
        ]
      },
      {
        "level": "h3",
        "label": "B2. Alternative Flow",
        "code": [
          "Scenario: AC-03 กบค. แก้ไขความคืบหน้าเดิม\n  Given มีความคืบหน้าอยู่แล้วอย่างน้อย 1 รายการ\n  When  กบค. กดปุ่มแก้ไขที่รายการ แก้ค่าใน popup ที่เติมค่าเดิม แล้วกด \"บันทึก\"\n  Then  รายการนั้นอัปเดตในตาราง\n  And   แสดง toast \"แก้ไขความคืบหน้าสำเร็จ\"\n\nScenario: AC-04 กบค. ลบความคืบหน้า (ยังมีรายการอื่นเหลือ)\n  Given มีความคืบหน้ามากกว่า 1 รายการ\n  When  กบค. กดปุ่มลบที่รายการ แล้วยืนยันใน modal \"ยืนยันการลบความคืบหน้า\" (บอกวันที่และเวลาของรายการนั้น)\n  Then  รายการหายจากตาราง\n  And   แสดง toast \"ลบความคืบหน้าสำเร็จ\""
        ]
      },
      {
        "level": "h3",
        "label": "B3. Exception / Negative Flow",
        "code": [
          "Scenario: AC-05 กบค. พยายามกด \"ซ่อมสำเร็จ\" โดยยังไม่มีความคืบหน้าเลย\n  Given ยังไม่มีความคืบหน้าสักรายการ\n  When  กบค. ดูปุ่ม \"ซ่อมสำเร็จ\"\n  Then  ปุ่มถูก disable กดไม่ได้ พร้อมข้อความ \"เพิ่มความคืบหน้าอย่างน้อย 1 รายการก่อนกด \"ซ่อมสำเร็จ\"\" (จากบอร์ด Refinement 29 oct 2026 — เดิมเอกสารนี้ไม่มีข้อความชัดเจน)\n  And   ตารางแสดงข้อความ \"ยังไม่มีความคืบหน้า\" พร้อมคำอธิบายว่าต้องเพิ่มอย่างน้อย 1 รายการก่อน\n\nScenario: AC-06 กบค. พยายามลบความคืบหน้ารายการสุดท้าย\n  Given เหลือความคืบหน้าอยู่รายการเดียว\n  When  กบค. มองหาปุ่มลบที่รายการนั้น\n  Then  ลบไม่ได้ — ปุ่มลบไม่แสดง/ใช้งานไม่ได้เมื่อเหลือรายการเดียว"
        ]
      },
      {
        "level": "h3",
        "label": "B4. Business Rules",
        "bullets": [
          "BR-01 บันทึกความคืบหน้าได้หลายรายการ เรียงเก่าไปใหม่ (รายการเก่าสุดอยู่บนสุด) — แก้ไขแล้ว 26 ต.ค. 2569 จากบอร์ด Refinement 29 oct 2026: ตาราง S11 แสดงแถว \"22/10/2569 10:00 น.\" ก่อน \"05/11/2569 14:00 น.\" ยืนยันว่าเรียงเก่าไปใหม่ ไม่ใช่ใหม่ไปเก่าตามที่เอกสารนี้เคยระบุ",
          "BR-02 หมายเหตุพิมพ์ได้ไม่เกิน 500 ตัวอักษร",
          "BR-03 เมื่อกด \"ซ่อมสำเร็จ\" ถือว่าปิดขั้นติดตามแล้วไปขั้นถัดไป — ย้อนมาดูได้แต่แก้ไขไม่ได้อีก",
          "BR-04 ห้ามไปขั้นที่ 4 โดยไม่มีความคืบหน้าเลย (ปุ่ม \"ซ่อมสำเร็จ\" disable)",
          "[x] BR-05 ต้องเหลือความคืบหน้าอย่างน้อย 1 รายการเสมอ ลบจนเหลือ 0 ไม่ได้ — ปิดแล้ว 26 ต.ค. 2569 ดูหมายเหตุ ✅ ใต้ B3 ด้านบน"
        ]
      },
      {
        "level": "h3",
        "label": "B5. Permission",
        "table": {
          "headers": [
            "Action",
            "กบค.",
            "หน่วยงานเจ้าของรถ",
            "กรย. เขตนั้นๆ"
          ],
          "rows": [
            [
              "เพิ่ม/แก้ไข/ลบความคืบหน้า",
              "✓",
              "✗ (ดูอย่างเดียว)",
              "✗ (ดูอย่างเดียว)"
            ],
            [
              "กด \"ซ่อมสำเร็จ\"",
              "✓",
              "✗",
              "✗"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "B6. Notification",
        "bullets": [
          "**ไม่ส่ง notification** สำหรับเพิ่ม/แก้ไข/ลบความคืบหน้า — เป็นงานภายในของ กบค. (ยืนยันใน `16-overhaul-toast-notification.md` § 2.2) ⚠️ ยังไม่เคาะว่าหน่วยงานอยากรู้ความคืบหน้าการซ่อมเป็นรายครั้งไหม"
        ]
      },
      {
        "level": "h2",
        "label": "C. Technical AC (มุม Dev)"
      },
      {
        "level": "h3",
        "label": "C1. Field Validation",
        "table": {
          "headers": [
            "ฟิลด์",
            "Type",
            "บังคับ",
            "กฎ",
            "Error Message"
          ],
          "rows": [
            [
              "วันที่และเวลา",
              "datetime",
              "ใช่",
              "⚠️ ยังไม่เคาะว่ากรอกเองหรือระบบใส่ให้แล้วแก้ได้ ใส่วันที่อนาคตได้ไหมก็ยังไม่เคาะ",
              "ไม่มีระบุ"
            ],
            [
              "รายละเอียด",
              "text (ยาว)",
              "ใช่",
              "—",
              "ไม่มีระบุ"
            ],
            [
              "หมายเหตุ",
              "text",
              "ไม่บังคับ",
              "≤500 ตัวอักษร ช่องว่างแสดงคำว่า \"ระบุหมายเหตุ\"",
              "ไม่มี"
            ],
            [
              "รูป/ไฟล์แนบ",
              "file upload",
              "⚠️ ยังไม่เคาะ",
              "PO เสนอคอลัมน์รูป/ไฟล์แนบ+ผู้บันทึกไว้ในชีต แต่จอจริงที่เจ้าของงานส่ง 21 ต.ค. 2569 ไม่มีช่องนี้ จึงยังไม่ใส่",
              "ไม่มี"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C2. State Transition",
        "table": {
          "headers": [
            "จากสถานะ",
            "Action",
            "ไปสถานะ",
            "ผู้มีสิทธิ์"
          ],
          "rows": [
            [
              "กำลังซ่อม",
              "เพิ่ม/แก้ไข/ลบความคืบหน้า",
              "คงเดิม (ไม่เปลี่ยนสถานะ)",
              "กบค."
            ],
            [
              "กำลังซ่อม",
              "กด \"ซ่อมสำเร็จ\" (มี progress ≥1 รายการ)",
              "รอตรวจสภาพ Safety (ขั้นที่ 4)",
              "กบค."
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C3. API / Integration",
        "bullets": [
          "⚠️ **0% backend — gap สมบูรณ์ที่สุดในทุก scenario** ไม่มีแม้แต่ draft migration ตาม `21-overhaul-full-audit.md` § 5 (รหัส J)",
          "ชื่อตาราง draft ที่เจอบนบอร์ดดิบ (26 ต.ค. 2569): `vms_trn_overhaul_progress_log` — ยังไม่ migrate จริง เสนอ column: `po_vehicle_uid`, `detail text(500)`, `logged_at timestamptz`, `note text`"
        ]
      },
      {
        "level": "h3",
        "label": "C4. Error Handling",
        "bullets": [
          "ยังไม่เคาะ — ไม่มี sticky FE/BE ระบุรายละเอียด error handling ของ scenario นี้โดยตรง"
        ]
      },
      {
        "level": "h3",
        "label": "C5. Audit / Logging",
        "bullets": [
          "บันทึก `logged_at` ของแต่ละความคืบหน้า (ตาม schema draft ที่เสนอ) — แต่ไม่มี audit log แยกสำหรับ \"ใครแก้ไข/ลบเมื่อไหร่\" ยืนยันจากเอกสารตรงๆ"
        ]
      },
      {
        "level": "h3",
        "label": "C6. NFR",
        "bullets": [
          "ใช้มาตรฐานรวมโครงการเดียวกับ US-OH-01 (TOR ข้อ 19/26)"
        ]
      },
      {
        "level": "h2",
        "label": "D. ส่วนประกอบท้าย"
      },
      {
        "level": "bold",
        "label": "Out of Scope",
        "bullets": [
          "คอลัมน์ผู้บันทึกและรูป/ไฟล์แนบ ที่ PO เสนอในชีตแต่จอจริงล่าสุดไม่มี (รอเจ้าของงานเคาะ)"
        ]
      },
      {
        "level": "bold",
        "label": "Assumptions",
        "bullets": [
          "ไม่มี modal ยืนยันตอนกด \"ซ่อมสำเร็จ\" ในจอ mock ปัจจุบัน (ยังไม่เคาะเป็น spec — ดูข้อเสนอ senior BA+dev ท้ายหัวข้อนี้ว่าควรมี)"
        ]
      },
      {
        "level": "bold",
        "label": "สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม",
        "bullets": [
          "ยืนยัน Priority (Must/Should/Could) กับ PO — ไม่มีแหล่งอ้างอิง",
          "ยืนยันงวดส่งมอบ/JO ที่ผูกกับฟีเจอร์นี้",
          "[x] ~~เคาะว่าลบความคืบหน้าจนเหลือ 0 รายการได้ไหม~~ — ปิดแล้ว ดู BR-05",
          "เคาะว่าวันที่และเวลา กรอกเองหรือระบบใส่ให้แล้วแก้ได้ และใส่วันที่อนาคตได้ไหม",
          "เคาะช่องแนบรูป/ไฟล์ในฟอร์มเพิ่มความคืบหน้า — ต้องมีหรือไม่ และหน้าตาเป็นอย่างไร",
          "เคาะว่ากด \"ซ่อมสำเร็จ\" ต้องมี modal ยืนยันไหม",
          "[x] ~~เคาะลำดับการแสดงรายการความคืบหน้า~~ — ปิดแล้ว ดู BR-01 (เก่าไปใหม่)",
          "เคาะว่าแก้ไขได้ทุกรายการหรือเฉพาะล่าสุด และแก้ได้หลังกด \"ซ่อมสำเร็จ\" แล้วไหม",
          "เคาะว่าหน่วยงานเจ้าของรถควรได้รับ notification ความคืบหน้าเป็นรายครั้งไหม (ปัจจุบันไม่ส่งเลย)",
          "หา/สร้าง API route รองรับ scenario นี้ — ปัจจุบัน 0% backend (gap สมบูรณ์ที่สุดในทุก scenario)",
          "ยืนยัน/migrate ตาราง `vms_trn_overhaul_progress_log` (draft) ให้เป็นจริง",
          "เคาะ error handling ของ scenario นี้ — ไม่มี sticky FE/BE ระบุไว้",
          "ยืนยันว่าต้องเก็บ audit log แยกว่าใครแก้ไข/ลบความคืบหน้าเมื่อไหร่ไหม",
          "ยืนยันความหมายของปุ่ม \"ข้าม\" ที่พบใหม่ข้างปุ่ม \"เพิ่มความคืบหน้า\"/\"ซ่อมสำเร็จ\" ในบอร์ด Refinement 29 oct 2026 (ไม่เคยอยู่ในเอกสารนี้มาก่อน)"
        ]
      },
      {
        "level": "bold",
        "label": "ข้อเสนอปิดช่องโหว่ (เสนอโดย senior BA + senior dev ร่วมกัน — เป็นข้อเสนอให้ทีมพิจารณา ไม่ใช่ข้อยืนยันจากเอกสาร/บอร์ดใดๆ)",
        "paragraph": "1. Priority → **Must** เหตุผล: เป็นขั้นตอนบังคับผ่านก่อนไปขั้น Safety (ขั้นที่ 4) รถทุกคันต้องมีอย่างน้อย 1 รายการความคืบหน้าก่อนปิดขั้นนี้ได้ตาม BR-04 ที่ยืนยันแล้ว\n2. งวดส่งมอบ/JO → จัดอยู่ JO เดียวกับ US-OH-01 ถึง 08 ทั้งชุด เพราะเป็น flow ต่อเนื่องเดียวกัน แยก JO กลาง flow จะทำให้ทดสอบ end-to-end ไม่ได้ก่อนส่งมอบ\n3. วันที่และเวลา กรอกเองหรือระบบใส่ให้ → ระบบตั้งค่าเริ่มต้นเป็นวันเวลาปัจจุบัน แก้ไขได้ แต่ **ห้ามเลือกวันที่อนาคต** เหตุผล: เป็นการบันทึกเหตุการณ์ที่เกิดขึ้นแล้ว (อู่รายงานความคืบหน้าจริง) ไม่ใช่การนัดหมายล่วงหน้าแบบ US-OH-03/07\n4. ช่องแนบรูป/ไฟล์ → ไม่ต้องมีในเฟสแรก เหตุผล: จอจริงล่าสุดทั้งสองรอบ (21 ต.ค. และบอร์ด Refinement 29 oct 2026) ไม่มีช่องนี้ตรงกัน ถือเป็นสัญญาณที่สม่ำเสมอว่าทีมตัดออกแล้ว เพิ่มทีหลังได้ถ้าจำเป็นจริง\n5. modal ยืนยันตอนกด \"ซ่อมสำเร็จ\" → **ควรมี** เหตุผล: BR-03 ระบุว่าเป็นจุดปิดถาวร (แก้ไขไม่ได้อีก) เอกสารนี้ใช้ modal ยืนยันกับทุกจุดปิดถาวรแบบเดียวกันอยู่แล้ว (ลบแผน ลบ PO) ควรสม่ำเสมอกัน\n6. แก้ไขได้ทุกรายการหรือเฉพาะล่าสุด / แก้หลัง \"ซ่อมสำเร็จ\" ได้ไหม → แก้ไขได้ทุกรายการ **ก่อน** กด \"ซ่อมสำเร็จ\" เท่านั้น หลังกดแล้วล็อกทั้งหมดแก้ไม่ได้อีกเลย เหตุผล: ตรงกับ BR-03 ที่ระบุไว้แล้วว่า \"ย้อนมาดูได้แต่แก้ไขไม่ได้อีก\" ไม่ได้บอกว่าเฉพาะรายการล่าสุด จึงตีความว่าทุกรายการแก้ได้เท่ากันก่อนปิด\n7. notification ความคืบหน้ารายครั้ง → **ไม่ส่ง** เหตุผล: ลด noise ให้หน่วยงาน เอกสารนี้ออกแบบให้หน่วยงานได้ notification เฉพาะ milestone สำคัญ (N5 ตรวจรับ, N6 Safety ผ่าน, N10 ปิดงาน) การแจ้งทุกความคืบหน้าย่อยจะถี่เกินจำเป็นและไม่ตรงกับ pattern ที่ใช้ทั้งเอกสาร\n8. API route + migrate ตาราง → ใช้ชื่อ draft ที่เสนอไว้แล้ว `vms_trn_overhaul_progress_log` เป็นจุดเริ่ม เพราะเป็น gap เดียวที่ยังไม่มีแม้แต่ draft migration เลย ควรเร่งคุยกับทีม backend ก่อน scenario อื่นเนื่องจากเสี่ยงบล็อก sprint\n9. error handling → ใช้ pattern เดียวกับทุก scenario อื่นในเอกสารนี้ (อยู่หน้าเดิม ค่าที่กรอกคงอยู่ พร้อม toast error code จาก server) ไม่ต้องคิดรูปแบบใหม่\n10. audit log แยกว่าใครแก้ไข/ลบ → **ไม่เก็บ** เหตุผล: สอดคล้องกับนโยบายรวมที่ยืนยันแล้วใน BR-06 ของ US-OH-01 (\"ไม่เก็บทั้งคู่ ใครอยากทำไรก็ทำ\") เป็นงานภายใน กบค. ระดับเดียวกัน ควรใช้นโยบายเดียวกันทั้งเอกสาร\n11. ปุ่ม \"ข้าม\" ที่พบใหม่ → **ไม่เสนอความหมาย** เพราะถ้ากด \"ข้าม\" ได้ทั้งที่ยังไม่มีความคืบหน้าเลยจะขัดกับ BR-04 ที่ยืนยันแล้วตรงๆ (ห้ามไปขั้นที่ 4 โดยไม่มีความคืบหน้า) ความเสี่ยงสูงถ้าเดาผิด ต้องถามทีมออกแบบโดยตรงก่อนเขียนโค้ด"
      }
    ]
  },
  "scenario12": {
    "title": "US-OH-06 ตรวจสภาพความปลอดภัย (Check Safety)",
    "sections": [
      {
        "level": "h2",
        "label": "A. Story Header",
        "table": {
          "headers": [
            "รายการ",
            "รายละเอียด"
          ],
          "rows": [
            [
              "Story ID",
              "US-OH-06"
            ],
            [
              "TOR Reference",
              "ข้อ 1 ซ่อมแซมและบำรุงรักษายานพาหนะ — T3/T4 ตรวจสอบประวัติซ่อมบำรุง"
            ],
            [
              "Priority",
              "ยังไม่เคาะ"
            ],
            [
              "งวดส่งมอบ",
              "ยังไม่เคาะ"
            ],
            [
              "Actor",
              "กบค."
            ]
          ]
        }
      },
      {
        "level": "bold",
        "label": "User Story",
        "paragraph": "ในฐานะเจ้าหน้าที่ กบค. ต้องการอัปโหลดเอกสารผลตรวจความปลอดภัยของรถก่อนส่งคืนหน่วยงาน เพื่อยืนยันว่ารถผ่านมาตรฐานความปลอดภัยก่อนกลับไปใช้งานจริง ลดความเสี่ยงอุบัติเหตุ และเป็นหลักฐานตรวจสอบย้อนหลังได้"
      },
      {
        "level": "bold",
        "label": "Precondition",
        "bullets": [
          "กด \"ซ่อมสำเร็จ\" แล้ว รถอยู่สถานะ \"รอตรวจสภาพ Safety\" (ขั้นที่ 4 ของ stepper)"
        ]
      },
      {
        "level": "h2",
        "label": "B. Business AC (มุม BA)"
      },
      {
        "level": "h3",
        "label": "B1. Happy Path",
        "code": [
          "Scenario: AC-01 กบค. ยืนยันการตรวจสภาพ Safety สำเร็จ\n  Given รถอยู่สถานะ \"รอตรวจสภาพ Safety\"\n  When  กบค. อัปโหลดเอกสาร Safety Inspection แล้วกด \"ยืนยันการตรวจสภาพ\"\n  Then  สถานะรถเปลี่ยนเป็น \"รอนัดหมายรับรถ\" ไปขั้นที่ 5 ของ stepper\n  And   แสดง toast \"ยืนยันการตรวจสอบสำเร็จ\"\n  And   หน่วยงานเจ้าของรถได้รับ notification N6"
        ]
      },
      {
        "level": "h3",
        "label": "B2. Alternative Flow",
        "code": [
          "Scenario: AC-02 กบค. อัปโหลดเอกสารหลายไฟล์ก่อนยืนยัน\n  Given รถอยู่สถานะ \"รอตรวจสภาพ Safety\"\n  When  กบค. อัปโหลดเอกสาร PDF, PNG หรือ JPG ทีละไฟล์ (ไม่เกิน 10 ไฟล์)\n  Then  แต่ละไฟล์ดาวน์โหลดและพรีวิวได้ทันที ก่อนกด \"ยืนยันการตรวจสภาพ\""
        ]
      },
      {
        "level": "h3",
        "label": "B3. Exception / Negative Flow",
        "code": [
          "Scenario: AC-03 กบค. พยายามยืนยันโดยยังไม่มีไฟล์แนบ\n  Given ยังไม่มีเอกสาร Safety Inspection แนบเลย\n  When  กบค. กด \"ยืนยันการตรวจสภาพ\"\n  Then  ระบบไม่ยืนยัน (เสนอจาก userflow — ไม่ได้ระบุข้อความ error ไว้ตรงๆ)\n\nScenario: AC-04 กบค. อัปโหลดไฟล์ไม่สำเร็จ (จากบอร์ด Refinement 29 oct 2026)\n  Given กบค. เลือกไฟล์เพื่ออัปโหลด\n  When  การอัปโหลดล้มเหลว (เช่น ไฟล์ผิดชนิด/ปัญหาเครือข่าย)\n  Then  แสดงข้อความ \"อัปโหลดไม่สำเร็จ\" ที่ตัวไฟล์"
        ]
      },
      {
        "level": "h3",
        "label": "B4. Business Rules",
        "bullets": [
          "BR-01 ต้องอัปโหลดเอกสารก่อนยืนยันการตรวจสอบได้ (ไฟล์ PDF, PNG หรือ JPG เท่านั้น ไม่เกิน 10 ไฟล์ — ปรับชนิดไฟล์ตามบอร์ด Refinement 29 oct 2026 แล้ว)",
          "BR-02 ใช้เงื่อนไขการอัปโหลดเดียวกับฟีเจอร์แจ้งซ่อมเดิม (ความสม่ำเสมอของระบบ ไม่ตั้งเงื่อนไขใหม่)"
        ]
      },
      {
        "level": "h3",
        "label": "B5. Permission",
        "table": {
          "headers": [
            "Action",
            "กบค.",
            "หน่วยงานเจ้าของรถ",
            "กรย. เขตนั้นๆ"
          ],
          "rows": [
            [
              "อัปโหลดเอกสาร + กดยืนยันการตรวจสอบ",
              "✓",
              "✗ (ดูอย่างเดียว)",
              "✗ (ดูอย่างเดียว)"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "B6. Notification",
        "bullets": [
          "N6 (Info, เสนอ) → หน่วยงานเจ้าของรถ เมื่อซ่อมเสร็จและผ่านการตรวจสอบความปลอดภัย ข้อความ \"รถ [ทะเบียน] Overhaul เสร็จและผ่านการตรวจสอบความปลอดภัยแล้ว รอนัดรับรถ\" ปลายทาง: หน้างานรายคัน ขั้นที่ 4"
        ]
      },
      {
        "level": "h2",
        "label": "C. Technical AC (มุม Dev)"
      },
      {
        "level": "h3",
        "label": "C1. Field Validation",
        "table": {
          "headers": [
            "ฟิลด์",
            "Type",
            "บังคับ",
            "กฎ",
            "Error Message"
          ],
          "rows": [
            [
              "เอกสาร Safety Inspection",
              "file upload",
              "ใช่",
              "≤10 ไฟล์ ชนิด PDF, PNG หรือ JPG ดาวน์โหลด/พรีวิวได้ (จากบอร์ด Refinement 29 oct 2026 — เดิมระบุแค่ pdf/jpeg)",
              "ไม่มีระบุตรงๆ (เสนอจาก userflow)"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C2. State Transition",
        "table": {
          "headers": [
            "จากสถานะ",
            "Action",
            "ไปสถานะ",
            "ผู้มีสิทธิ์"
          ],
          "rows": [
            [
              "รอตรวจสภาพ Safety",
              "อัปโหลดเอกสาร + ยืนยันการตรวจสอบสำเร็จ",
              "รอนัดหมายรับรถ (ขั้นที่ 5)",
              "กบค."
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C3. API / Integration",
        "bullets": [
          "⚠️ ไม่มี route ยืนยันการทำงานของ scenario นี้ในเอกสาร audit โดยตรง — ทีมเสนอชื่อตาราง `vms_trn_po_vehicle_document` ไว้แล้ว (`po_vehicle_uid`, `file_name/ext/size/path`, `uploaded_at`) แต่ยังไม่ migrate จริง (รหัส K, `21-overhaul-full-audit.md` § 6)"
        ]
      },
      {
        "level": "h3",
        "label": "C4. Error Handling",
        "bullets": [
          "ยังไม่เคาะ — ไม่มี sticky breakdown FE/BE เหมือน Scenario 8 (US-OH-04) ควรคุยในที่ประชุมว่ามีเงื่อนไขอื่นอีกไหมก่อน implement"
        ]
      },
      {
        "level": "h3",
        "label": "C5. Audit / Logging",
        "bullets": [
          "บันทึก `uploaded_at` ต่อไฟล์ (ตาม schema draft ที่เสนอ) — ไม่มี audit log อื่นเพิ่มเติมที่ระบุไว้"
        ]
      },
      {
        "level": "h3",
        "label": "C6. NFR",
        "bullets": [
          "ใช้มาตรฐานรวมโครงการเดียวกับ US-OH-01 (TOR ข้อ 19/26)"
        ]
      },
      {
        "level": "h2",
        "label": "D. ส่วนประกอบท้าย"
      },
      {
        "level": "bold",
        "label": "Out of Scope",
        "bullets": [
          "การบันทึกผลตรวจ \"ผ่าน/ไม่ผ่าน\" แยกจากการอัปโหลดไฟล์ (ยังไม่เคาะว่าต้องมี)",
          "การบันทึกวันหมดประกันงาน (ต้นแบบชุดเก่ามีช่องรับประกัน+เตือนก่อนหมด 45 วัน แต่ userflow ชุดนี้ไม่มี — ดู N14 ที่เสนอรูปแบบใหม่ เตือน 2 ครั้งก่อนหมด 1 เดือนและ 15 วัน ยังไม่ผูกกับ scenario นี้ชัดเจน)"
        ]
      },
      {
        "level": "bold",
        "label": "Assumptions",
        "bullets": [
          "ผู้ตรวจ Safety คือ กบค. เอง (ไม่ใช่อู่) — สมมติตามผู้ถือสิทธิ์กดยืนยันในระบบ ไม่มีเอกสารยืนยันตรงว่าใครเป็นผู้ตรวจจริงหน้างาน"
        ]
      },
      {
        "level": "bold",
        "label": "สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม",
        "bullets": [
          "ยืนยัน Priority (Must/Should/Could) กับ PO — ไม่มีแหล่งอ้างอิง",
          "ยืนยันงวดส่งมอบ/JO ที่ผูกกับฟีเจอร์นี้",
          "เคาะข้อความ error ตอนกด \"ยืนยันการตรวจสภาพ\" โดยยังไม่มีไฟล์แนบ — ปัจจุบันแค่ \"ไม่ยืนยัน\" ไม่มีข้อความระบุ",
          "เคาะว่าต้องบันทึกผลตรวจ \"ผ่าน/ไม่ผ่าน\" แยกจากการอัปโหลดไฟล์ไหม และถ้าไม่ผ่านย้อนกลับไปขั้นที่ 3 (กำลังซ่อม) ได้ไหม",
          "ยืนยันว่าใครเป็นผู้ตรวจ Safety จริงหน้างาน (อู่ หรือ กบค.) — ตอนนี้สมมติว่า กบค. เองจากสิทธิ์กดยืนยันในระบบ ไม่มีเอกสารยืนยันตรง",
          "เคาะว่าต้องบันทึกวันหมดประกันงานไหม และผูกกับ N14 (เตือนก่อนหมดประกัน 1 เดือน/15 วัน) อย่างไร",
          "หา/ยืนยัน API route รองรับ scenario นี้ — ยังไม่มีในเอกสาร audit โดยตรง มีแค่ชื่อตาราง `vms_trn_po_vehicle_document` ที่ยังไม่ migrate",
          "เคาะ error handling ของ scenario นี้ในที่ประชุม — ไม่มี sticky breakdown FE/BE เหมือน US-OH-04"
        ]
      },
      {
        "level": "bold",
        "label": "ข้อเสนอปิดช่องโหว่ (เสนอโดย senior BA + senior dev ร่วมกัน — เป็นข้อเสนอให้ทีมพิจารณา ไม่ใช่ข้อยืนยันจากเอกสาร/บอร์ดใดๆ)",
        "paragraph": "1. Priority → **Must** เหตุผล: เป็นประตูบังคับก่อนคืนรถให้หน่วยงาน (ขั้นที่ 5) ป้องกันรถไม่ผ่านมาตรฐานความปลอดภัยกลับไปใช้งาน\n2. งวดส่งมอบ/JO → JO เดียวกับทั้งชุด US-OH-01 ถึง 08\n3. error ตอนกด \"ยืนยันการตรวจสภาพ\" ไม่มีไฟล์ → แสดงข้อความ \"กรุณาแนบเอกสาร Safety Inspection\" ใต้ช่องอัปโหลด เหตุผล: ใช้ pattern เดียวกับฟิลด์บังคับอื่นทั้งเอกสารนี้ที่ขึ้นข้อความใต้ช่องตรงๆ\n4. ผ่าน/ไม่ผ่าน แยกจากอัปโหลด → **ไม่ต้องมีฟิลด์แยก** เหตุผล: การอัปโหลดเอกสารผลตรวจถือเป็นหลักฐานผลตรวจอยู่แล้ว เพิ่มฟิลด์ผ่าน/ไม่ผ่านซ้ำจะซ้ำซ้อนกับเนื้อหาในไฟล์ ถ้ารถไม่ผ่านจริง กบค. ก็แค่ยังไม่อัปโหลดเอกสารนี้ (รถค้างอยู่ขั้นนี้) ไม่ต้องมี flow ย้อนกลับพิเศษ\n5. ผู้ตรวจ Safety คือใคร → เสนอว่าเป็น **กบค.** ผู้กดยืนยันในระบบ (อู่อาจเป็นผู้ตรวจจริงหน้างานแต่ไม่มีสิทธิ์กดในระบบ) เหตุผล: สอดคล้องกับรูปแบบสิทธิ์ทั้งเอกสารที่ กบค. เป็นผู้ดำเนินการในระบบเสมอ แม้ลงมือจริงจะเป็นอู่/หน่วยงานก็ตาม (เหมือน US-OH-04)\n6. วันหมดประกันงาน + N14 → **ไม่ทำในเฟสแรก** เหตุผล: N14 ยังเป็นแค่ข้อเสนอไม่มีจอรองรับเลย และ scope ของ scenario นี้คือ safety inspection ไม่ใช่ warranty tracking ควรแยก scope ให้ชัดเป็นฟีเจอร์ถัดไป\n7. API route → ใช้ชื่อตาราง `vms_trn_po_vehicle_document` ที่เสนอไว้แล้วเป็นจุดเริ่ม\n8. error handling → ใช้ pattern เดียวกับทุก scenario อื่น (toast + อยู่หน้าเดิม) ไม่ต้องรอประชุมแยก"
      }
    ]
  },
  "scenario13": {
    "title": "US-OH-07 นัดหมายหน่วยงานส่งคืนรถ (reuse flow เดียวกับ US-OH-03)",
    "sections": [
      {
        "level": "h2",
        "label": "A. Story Header",
        "table": {
          "headers": [
            "รายการ",
            "รายละเอียด"
          ],
          "rows": [
            [
              "Story ID",
              "US-OH-07"
            ],
            [
              "TOR Reference",
              "ข้อ 1 ซ่อมแซมและบำรุงรักษายานพาหนะ — T2/T3"
            ],
            [
              "Priority",
              "ยังไม่เคาะ"
            ],
            [
              "งวดส่งมอบ",
              "ยังไม่เคาะ"
            ],
            [
              "Actor",
              "กบค. (สร้างนัดหมาย) · หน่วยงานเจ้าของรถ (ตอบรับ/ปฏิเสธ)"
            ]
          ]
        }
      },
      {
        "level": "bold",
        "label": "User Story",
        "paragraph": "ในฐานะเจ้าหน้าที่ กบค. ต้องการนัดหมายวันรับรถคืนจากอู่กลับไปใช้งาน เพื่อให้หน่วยงานเจ้าของรถรู้ล่วงหน้าว่าจะได้รถคืนวันไหน และวางแผนใช้งานรถต่อได้"
      },
      {
        "level": "bold",
        "label": "Precondition",
        "bullets": [
          "รถอยู่สถานะ \"รอนัดหมายรับรถ\" (ขั้นที่ 5 ของ stepper — มาจากการยืนยันการตรวจสอบ Safety สำเร็จ)"
        ]
      },
      {
        "level": "h2",
        "label": "B. Business AC (มุม BA)"
      },
      {
        "level": "h3",
        "label": "B1. Happy Path",
        "code": [
          "Scenario: AC-01 กบค. ส่งนัดหมายรับรถคืนสำเร็จ\n  Given รถอยู่สถานะ \"รอนัดหมายรับรถ\"\n  When  กบค. กรอกช่วงวันนัดรับรถ สถานที่รับรถ เลือกผู้ประสานงาน (กบค.) แล้วกด \"ส่งนัดหมาย\"\n  Then  สถานะรถเปลี่ยนเป็น \"รอหน่วยงานตอบรับนัดรับรถ\"\n  And   แสดง toast \"นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ\"\n  And   หน่วยงานเจ้าของรถได้รับ notification N7"
        ]
      },
      {
        "level": "h3",
        "label": "B2. Alternative Flow",
        "code": [
          "Scenario: AC-02 หน่วยงานตอบรับนัดรับรถ\n  Given หน่วยงานได้รับ notification N7\n  When  หน่วยงานกด \"ตอบรับ\"\n  Then  สถานะรถเปลี่ยนเป็น \"รอปิดงาน\" ไปขั้นที่ 6 ของ stepper\n  And   กบค. ได้รับ notification N8"
        ]
      },
      {
        "level": "h3",
        "label": "B3. Exception / Negative Flow",
        "code": [
          "Scenario: AC-03 กบค. กดยืนยันนัดหมายโดยกรอกไม่ครบ\n  Given กบค. อยู่ในฟอร์มนัดรับรถ\n  When  กบค. กดยืนยันโดยยังไม่เลือกช่วงวันนัดรับรถ หรือยังไม่เลือกผู้ประสานงาน\n  Then  ระบบไม่ส่งนัดหมาย\n  And   แสดงข้อความ \"กรุณาเลือกช่วงวันนัดรับรถ\" และ/หรือ \"กรุณาเลือกผู้ประสานงาน\"\n\nScenario: AC-04 หน่วยงานปฏิเสธนัดรับรถ\n  Given หน่วยงานได้รับ notification N7\n  When  หน่วยงานกด \"ปฏิเสธ\" และกรอกเหตุผล\n  Then  สถานะรถเปลี่ยนเป็น \"หน่วยงานปฏิเสธนัดรับรถ\"\n  And   กบค. ได้รับ notification N9 พร้อม toast \"นัดหมาย {หมายเลข PO} ไม่สำเร็จ\"\n  And   กบค. แก้ไขนัดหมายใหม่ได้"
        ]
      },
      {
        "level": "h3",
        "label": "B4. Business Rules",
        "bullets": [
          "BR-01 ฟอร์มเหมือนขั้นที่ 1 (US-OH-03) ไม่มีช่องอู่ สถานที่รับรถคือศูนย์บริการ/อู่ตาม PO (แสดงในกล่องข้อมูลยานพาหนะ) ช่วงวันเลือกก่อนวันนี้ไม่ได้",
          "BR-02 แก้ไขนัดหมายได้จนกว่าหน่วยงานจะตอบ",
          "BR-03 เดียวกับ US-OH-03 ทุกข้อ (reuse flow เดิมทั้งหมด)"
        ]
      },
      {
        "level": "h3",
        "label": "B5. Permission",
        "table": {
          "headers": [
            "Action",
            "กบค.",
            "หน่วยงานเจ้าของรถ",
            "กรย. เขตนั้นๆ"
          ],
          "rows": [
            [
              "สร้าง/แก้ไขนัดหมายรับรถคืน (ก่อนหน่วยงานตอบรับ)",
              "✓",
              "✗",
              "✗"
            ],
            [
              "ตอบรับ/ปฏิเสธนัดรับรถ",
              "✗",
              "✓",
              "✗"
            ],
            [
              "ดูรายละเอียดนัดหมาย",
              "✓",
              "✓",
              "✓ (ดูอย่างเดียวทุกกรณี)"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "B6. Notification",
        "bullets": [
          "N7 (Warning) → หน่วยงานเจ้าของรถ เมื่อ กบค. ส่ง/แก้ไขนัดรับรถ — ปุ่มลัด \"ตอบรับนัด\" (ปลายทาง: หน้าตอบรับนัดของหน่วยงาน **ยังไม่มีจอ**)",
          "N8 (Success) → กบค. เมื่อหน่วยงานยืนยันรับรถ",
          "N9 (Error) → กบค. เมื่อหน่วยงานปฏิเสธนัดรับรถ พร้อมปุ่มลัด \"นัดใหม่\""
        ]
      },
      {
        "level": "h2",
        "label": "C. Technical AC (มุม Dev)"
      },
      {
        "level": "h3",
        "label": "C1. Field Validation",
        "table": {
          "headers": [
            "ฟิลด์",
            "Type",
            "บังคับ",
            "กฎ",
            "Error Message"
          ],
          "rows": [
            [
              "ช่วงวันนัดรับรถ",
              "date range",
              "ใช่",
              "เลือกก่อนวันนี้ไม่ได้",
              "\"กรุณาเลือกช่วงวันนัดรับรถ\""
            ],
            [
              "สถานที่รับรถ",
              "text",
              "ยังไม่เคาะ",
              "พบใหม่จากบอร์ด Refinement 29 oct 2026 เหมือน US-OH-03 — ดูรายละเอียดที่นั่น",
              "ไม่มีระบุ"
            ],
            [
              "ผู้ประสานงาน (กบค.)",
              "search-select",
              "ใช่",
              "เดียวกับ US-OH-03",
              "\"กรุณาเลือกผู้ประสานงาน\""
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C2. State Transition",
        "table": {
          "headers": [
            "จากสถานะ",
            "Action",
            "ไปสถานะ",
            "ผู้มีสิทธิ์"
          ],
          "rows": [
            [
              "รอนัดหมายรับรถ",
              "กบค. ยืนยันนัดหมายสำเร็จ",
              "รอหน่วยงานตอบรับนัดรับรถ",
              "กบค."
            ],
            [
              "รอหน่วยงานตอบรับนัดรับรถ",
              "หน่วยงานตอบรับ",
              "รอปิดงาน (ขั้นที่ 6)",
              "หน่วยงานเจ้าของรถ"
            ],
            [
              "รอหน่วยงานตอบรับนัดรับรถ",
              "หน่วยงานปฏิเสธ",
              "หน่วยงานปฏิเสธนัดรับรถ",
              "หน่วยงานเจ้าของรถ"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C3. API / Integration",
        "bullets": [
          "⚠️ **PARTIAL ที่ชั้น API**: โครง DB รองรับอยู่แล้ว (`appointment_type` เป็น enum 2 ค่า) แต่ `handler.go` ปัจจุบันตั้งชื่อ route ว่า `intake-appointments` ตรงๆ ยังไม่เห็น parameter ให้เลือกชนิดนัด (รหัส M, `21-overhaul-full-audit.md` § 3 คำถาม Q5) — ต้องถามทีม backend ว่าจะเพิ่ม query param หรือทำ route คู่ขนาน `return-appointments`"
        ]
      },
      {
        "level": "h3",
        "label": "C4. Error Handling",
        "bullets": [
          "ส่งนัดหมายไม่สำเร็จจากฝั่ง server → toast \"นัดหมาย {หมายเลข PO} ไม่สำเร็จ\" (ข้อความเดียวกับตอนหน่วยงานปฏิเสธ แต่ context ต่างกัน — ดู C2)"
        ]
      },
      {
        "level": "h3",
        "label": "C5. Audit / Logging",
        "bullets": [
          "ยังไม่เคาะ — เดียวกับ US-OH-03"
        ]
      },
      {
        "level": "h3",
        "label": "C6. NFR",
        "bullets": [
          "ใช้มาตรฐานรวมโครงการเดียวกับ US-OH-01 (TOR ข้อ 19/26)"
        ]
      },
      {
        "level": "h2",
        "label": "D. ส่วนประกอบท้าย"
      },
      {
        "level": "bold",
        "label": "Out of Scope",
        "bullets": [
          "ขั้นลงนามส่งมอบรถคืน (ขั้นที่ 2/US-OH-04 มีลงนามรับ 2 ฝ่าย แต่ขากลับไม่มีขั้นลงนามเทียบเท่า — ยังไม่เคาะว่าต้องมีไหม)"
        ]
      },
      {
        "level": "bold",
        "label": "Assumptions",
        "bullets": [
          "สถานที่รับรถคืนคือศูนย์บริการ/อู่ตาม PO เสมอ (เดียวกับ US-OH-03)"
        ]
      },
      {
        "level": "bold",
        "label": "สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม",
        "bullets": [
          "ยืนยัน Priority (Must/Should/Could) กับ PO — ไม่มีแหล่งอ้างอิง",
          "ยืนยันงวดส่งมอบ/JO ที่ผูกกับฟีเจอร์นี้",
          "เคาะกับทีม backend ว่า endpoint นัดหมายรับรถคืนใช้ query param เพิ่มจาก `intake-appointments` เดิม หรือทำ route คู่ขนาน `return-appointments`",
          "เคาะว่าต้องมีขั้นลงนามส่งมอบรถคืนไหม — ขากลับไม่มีขั้นลงนามเทียบเท่าขั้นรับรถของ US-OH-04",
          "เคาะว่าสถานที่รับรถคืนแก้เป็นที่อื่นนอกจากอู่ตาม PO ได้ไหม (พบฟิลด์ \"สถานที่รับรถ\" แล้วจากบอร์ด Refinement 29 oct 2026)",
          "หาจอ/สเปกฝั่งหน่วยงานเจ้าของรถสำหรับตอบรับ/ปฏิเสธนัดรับรถคืน — ยังไม่มีจอเลย (เหมือน US-OH-03)",
          "[x] ~~เคาะคำบนปุ่มยืนยันนัดหมายให้ตรงกัน~~ — ปิดแล้ว 26 ต.ค. 2569 ยืนยัน \"ส่งนัดหมาย\" เหมือน US-OH-03",
          "เคาะจำนวนวันแจ้งเตือนล่วงหน้าก่อนถึงวันนัดรับรถ และระยะเวลาที่หน่วยงานไม่ตอบก่อนเตือนซ้ำ",
          "ยืนยันว่าต้องเก็บ log การแก้ไขนัดหมายซ้ำก่อนหน่วยงานตอบรับไหม (เหมือน US-OH-03)"
        ]
      },
      {
        "level": "bold",
        "label": "ข้อเสนอปิดช่องโหว่ (เสนอโดย senior BA + senior dev ร่วมกัน — เป็นข้อเสนอให้ทีมพิจารณา ไม่ใช่ข้อยืนยันจากเอกสาร/บอร์ดใดๆ)",
        "paragraph": "1. Priority → **Must** เหตุผล: เป็นขั้นตอนบังคับก่อนปิดงาน (US-OH-08) ไม่มีนัดรับรถก็ปิดงานไม่ได้\n2. งวดส่งมอบ/JO → JO เดียวกับทั้งชุด US-OH-01 ถึง 08\n3. query param หรือ route คู่ขนาน → เสนอ **เพิ่ม query param** (`intake-appointments?type=return` หรือเทียบเท่า) จาก endpoint เดิม เหตุผล: logic เบื้องหลังเหมือนกันเกือบทั้งหมด (DB รองรับ `appointment_type` enum 2 ค่าอยู่แล้ว) ทำ route คู่ขนานจะซ้ำโค้ดโดยไม่จำเป็น\n4. ขั้นลงนามส่งมอบรถคืน → **ไม่ต้องมี** เหตุผล: ขั้นปิดงาน (US-OH-08) ทำหน้าที่เป็นจุดยืนยันสุดท้ายของวงจรอยู่แล้วก่อนเปลี่ยนสถานะเป็น \"ปิดงานแล้ว\" เพิ่มลงนามอีกขั้นจะซ้ำซ้อนกับขั้นรับรถ (US-OH-04) ที่มีไว้ป้องกันข้อพิพาทสภาพรถตอนเข้าอู่โดยเฉพาะ ซึ่งขากลับไม่มีความเสี่ยงแบบเดียวกัน\n5. สถานที่รับรถคืนแก้เป็นที่อื่นได้ไหม → **ได้** ใช้ฟิลด์ \"สถานที่รับรถ\" เดียวกับ US-OH-03 ที่พบใหม่ ไม่บังคับต้องเป็นอู่ตาม PO เสมอไป\n6. จำนวนวันแจ้งเตือนล่วงหน้า/เตือนซ้ำ → ใช้ค่าเดียวกับ US-OH-03 (เสนอ 1 วันก่อนถึงวันนัด เตือนซ้ำถ้าไม่ตอบภายใน 3 วันทำการ) เพื่อความสม่ำเสมอของ flow ที่ reuse กัน\n7. log การแก้ไขนัดหมายซ้ำ → **ไม่เก็บ** เหตุผลเดียวกับ US-OH-03"
      }
    ]
  },
  "scenario14": {
    "title": "US-OH-08 ปิดงาน (Closing Work)",
    "sections": [
      {
        "level": "h2",
        "label": "A. Story Header",
        "table": {
          "headers": [
            "รายการ",
            "รายละเอียด"
          ],
          "rows": [
            [
              "Story ID",
              "US-OH-08"
            ],
            [
              "TOR Reference",
              "ข้อ 1 ซ่อมแซมและบำรุงรักษายานพาหนะ — T3 บันทึกงานซ่อม + ค่าใช้จ่าย (คำนวณค่าซ่อมสะสม)"
            ],
            [
              "Priority",
              "ยังไม่เคาะ"
            ],
            [
              "งวดส่งมอบ",
              "ยังไม่เคาะ"
            ],
            [
              "Actor",
              "กบค."
            ]
          ]
        }
      },
      {
        "level": "bold",
        "label": "User Story",
        "paragraph": "ในฐานะเจ้าหน้าที่ กบค. ต้องการบันทึกรายการค่าใช้จ่าย/อะไหล่จริงที่เกิดขึ้นระหว่าง Overhaul แล้วปิดงาน เพื่อเทียบค่าใช้จ่ายจริงกับงบที่อนุมัติไว้ตอนสร้างแผน และปิดวงจรงานอย่างเป็นทางการพร้อมหลักฐานอ้างอิงได้"
      },
      {
        "level": "bold",
        "label": "Precondition",
        "bullets": [
          "หน่วยงานยืนยันนัดรับรถแล้ว รถอยู่สถานะ \"รอปิดงาน\" (ขั้นที่ 6 ของ stepper)"
        ]
      },
      {
        "level": "h2",
        "label": "B. Business AC (มุม BA)"
      },
      {
        "level": "h3",
        "label": "B1. Happy Path",
        "code": [
          "Scenario: AC-01 กบค. ปิดงานสำเร็จ\n  Given รถอยู่สถานะ \"รอปิดงาน\" และมีรายการอะไหล่/ค่าใช้จ่ายอย่างน้อย 1 รายการ\n  When  กบค. ระบุอะไหล่ที่ใช้ (เพิ่มทีละรายการ หรือกด \"นำเข้าไฟล์\") แล้วกด \"ปิดงาน\"\n  Then  สถานะรถเปลี่ยนเป็น \"ปิดงานแล้ว\"\n  And   แสดง toast \"ปิดงาน {หมายเลข PO} เรียบร้อยแล้ว\"\n  And   หน้างานแสดงรายการอะไหล่แบบอ่านอย่างเดียวและข้อความปิดงานแล้วพร้อมวันที่\n  And   เมื่อรถทุกคันในทุก PO ของแผนปิดงาน สถานะแผนเปลี่ยนเป็น \"เสร็จสิ้น\""
        ]
      },
      {
        "level": "h3",
        "label": "B2. Alternative Flow",
        "code": [
          "Scenario: AC-02 กบค. นำเข้าไฟล์รายการอะไหล่หลายรายการพร้อมกัน\n  Given รถอยู่สถานะ \"รอปิดงาน\"\n  When  กบค. กด \"นำเข้าไฟล์\" แล้วเลือกไฟล์ที่ถูกรูปแบบ\n  Then  รายการอะไหล่ทั้งหมดในไฟล์ถูกเพิ่มเข้าตาราง\n  And   แสดง toast \"นำเข้าไฟล์ {ชื่อไฟล์} สำเร็จ\""
        ]
      },
      {
        "level": "h3",
        "label": "B3. Exception / Negative Flow",
        "code": [
          "Scenario: AC-03 กบค. พยายามปิดงานโดยยังไม่มีรายการอะไหล่\n  Given ยังไม่มีรายการอะไหล่เลย\n  When  กบค. กด \"ปิดงาน\"\n  Then  ระบบไม่ให้ปิดงาน\n  And   ตารางแสดงข้อความ \"ยังไม่ได้ระบุอะไหล่ที่ใช้\" พร้อมคำอธิบาย \"เพิ่มทีละรายการหรือนำเข้าไฟล์ — ต้องมีอย่างน้อย 1 รายการจึงปิดงานได้\" (ข้อความเต็มจากบอร์ด Refinement 29 oct 2026)\n\nScenario: AC-04 กบค. นำเข้าไฟล์ผิดรูปแบบ\n  Given กบค. กด \"นำเข้าไฟล์\"\n  When  ไฟล์ที่เลือกผิดรูปแบบที่ระบบรองรับ\n  Then  ระบบแสดงข้อความผิดพลาดที่ตัวไฟล์ (ไม่ใช่ toast)\n\nScenario: AC-05 บันทึกไม่สำเร็จระหว่างขั้นที่ 2 ถึง 6\n  Given กบค. กดบันทึก/ยืนยันในขั้นใดขั้นหนึ่ง (ขั้นที่ 2-6)\n  When  ระบบตอบกลับผิดพลาดจาก server\n  Then  อยู่หน้าเดิม\n  And   แสดง toast รหัสและข้อความผิดพลาดจากระบบ เช่น \"500 Internal Server Error\""
        ]
      },
      {
        "level": "h3",
        "label": "B4. Business Rules",
        "bullets": [
          "BR-01 (จากชีต, ยืนยันแล้ว) ต้องมีอะไหล่/รายการอย่างน้อย 1 รายการก่อนกดปิดงานได้",
          "[x] BR-02 ไม่มีฟิลด์ \"ใบสำคัญจ่ายเลขที่\" ในฟอร์มจริง — ปิดคำถามเดิมแล้ว ดู C1/ข้อขัดแย้งที่แก้แล้วด้านล่าง (เดิม BR นี้ถามว่าต้องตรวจกับระบบบัญชีไหม แต่ฟิลด์นี้ไม่มีอยู่จริงตามบอร์ด Refinement 29 oct 2026 จึงไม่ใช่คำถามที่ต้องตอบอีกต่อไป)",
          "BR-03 ปิดงานแล้วแก้ไขอะไรในหน้างานรายคันไม่ได้อีก (ดูอย่างเดียว)",
          "BR-04 \"ปิดงาน\" ไม่รวมเรื่องประกัน/Safety (แยกไปเป็น US-OH-06 แล้ว ไม่มี checklist ซ้ำ)"
        ]
      },
      {
        "level": "h3",
        "label": "B5. Permission",
        "table": {
          "headers": [
            "Action",
            "กบค.",
            "หน่วยงานเจ้าของรถ",
            "กรย. เขตนั้นๆ"
          ],
          "rows": [
            [
              "ระบุอะไหล่ที่ใช้ + กด \"ปิดงาน\"",
              "✓",
              "✗ (ดูอย่างเดียว ตลอด รวมหลังปิดงานแล้ว)",
              "✗ (ดูอย่างเดียว ตลอด รวมหลังปิดงานแล้ว)"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "B6. Notification",
        "bullets": [
          "N10 (Success, เสนอ) → หน่วยงานเจ้าของรถ เมื่อปิดงานรายคัน ข้อความ \"งาน Overhaul รถ [ทะเบียน] ปิดงานแล้ว ดูรายการอะไหล่ที่ใช้ได้\"",
          "N11 (Brand, เสนอ) → กบค. เมื่อแผนเสร็จสิ้น (รถทุกคันปิดงาน) — ⚠️ ยังไม่เคาะว่าแผนปิดเองอัตโนมัติหรือ กบค. ต้องกดปิดแผน"
        ]
      },
      {
        "level": "h2",
        "label": "C. Technical AC (มุม Dev)"
      },
      {
        "level": "h3",
        "label": "C1. Field Validation",
        "table": {
          "headers": [
            "ฟิลด์",
            "Type",
            "บังคับ",
            "กฎ",
            "Error Message"
          ],
          "rows": [
            [
              "ชื่ออะไหล่",
              "text",
              "ใช่ (เพิ่มทีละรายการ)",
              "ตัวอย่าง mock: \"กรองน้ำมันเครื่อง\", \"ชุดลูกสูบพร้อมแหวน\", \"น้ำมันเครื่อง 15W-40\" placeholder \"เช่น ชุดลูกสูบพร้อมแหวน\" (จากบอร์ด Refinement 29 oct 2026)",
              "ไม่มีระบุตรงๆ"
            ],
            [
              "จำนวน",
              "number",
              "ใช่",
              "—",
              "ไม่มีระบุ"
            ],
            [
              "หน่วย",
              "text/select",
              "ใช่",
              "ตัวอย่าง mock: \"ชิ้น\", \"ชุด\", \"ลิตร\" (จากบอร์ด Refinement 29 oct 2026)",
              "ไม่มีระบุ"
            ],
            [
              "นำเข้าไฟล์",
              "file upload",
              "alternative ต่อการกรอกทีละรายการ",
              "รูปแบบไฟล์/คอลัมน์ที่ต้องมี — ยังไม่เคาะ (คอลัมน์ควรตรงกับฟิลด์ทีละรายการข้างต้น คือ ชื่ออะไหล่/จำนวน/หน่วย)",
              "ข้อความผิดพลาดแสดงที่ตัวไฟล์ (ไม่ใช่ toast)"
            ]
          ]
        },
        "paragraph": "✅ **แก้ไขแล้ว 26 ต.ค. 2569 (จากบอร์ด Refinement 29 oct 2026)** — ข้อขัดแย้งเดิม (`21-overhaul-full-audit.md` § 9) ระหว่างจอ Figma ที่ใช้คำว่า \"อะไหล่\" กับบอร์ด FigJam รุ่นก่อนหน้าที่นิยามเป็น \"ค่าใช้จ่าย/ใบสำคัญจ่าย\" ได้รับการแก้แล้ว — บอร์ด Refinement 29 oct 2026 (ใหม่กว่าทั้งสองแหล่งเดิม) ยืนยันฟิลด์ในฟอร์ม/ตารางเป็น **ชื่ออะไหล่ / จำนวน / หน่วย** ตรงตัว **ไม่มีฟิลด์ \"ค่าใช้จ่าย\" หรือ \"ใบสำคัญจ่ายเลขที่\" เลย** จึงตัดสองฟิลด์นี้ออกจาก C1 และยึดแนวทาง \"อะไหล่\" เป็นหลัก ปิด open question เดิมแล้ว — ส่วนคำถามว่า \"Scenario 21 เบิกอะไหล่\" เป็นคนละเรื่องกับขั้นปิดงานนี้หรือไม่ ยังไม่มีจอยืนยัน ดูข้อเสนอ senior BA+dev ท้ายหัวข้อนี้"
      },
      {
        "level": "h3",
        "label": "C2. State Transition",
        "table": {
          "headers": [
            "จากสถานะ",
            "Action",
            "ไปสถานะ",
            "ผู้มีสิทธิ์"
          ],
          "rows": [
            [
              "รอปิดงาน",
              "ระบุอะไหล่ที่ใช้ (ยังไม่กดปิดงาน)",
              "คงเดิม (รอปิดงาน / อยู่ระหว่างปิดงาน)",
              "กบค."
            ],
            [
              "รอปิดงาน",
              "กด \"ปิดงาน\" (มีรายการ ≥1)",
              "ปิดงานแล้ว (เสร็จสิ้น)",
              "กบค."
            ],
            [
              "(รถทุกคันในทุก PO ของแผนปิดงานแล้ว)",
              "ระบบตรวจครบอัตโนมัติ",
              "สถานะแผน → เสร็จสิ้น",
              "ระบบ"
            ]
          ]
        }
      },
      {
        "level": "h3",
        "label": "C3. API / Integration",
        "bullets": [
          "⚠️ **ไม่มี route รองรับ Scenario นี้เลย** ตาม `21-overhaul-full-audit.md` § 9 — เสนอตาราง \"closing purchase items\": `item_name`, `cost numeric`, `payment_voucher_no`, `created_at` ผูกกับ `po_vehicle_uid` หรือ `overhaul_job_uid` (รหัส L) ทีมยังไม่เสนอชื่อตารางที่ชัดเจน ณ เอกสาร 21 (ภายหลังพบชื่อ `senario14` บนบอร์ดดิบ 26 ต.ค. 2569 — `23-figjam-raw-reread-AC-ready.md` — แต่เป็นชื่อที่ดูเหมือน placeholder มากกว่าชื่อตารางจริง ต้องยืนยันกับทีมก่อนใช้)"
        ]
      },
      {
        "level": "h3",
        "label": "C4. Error Handling",
        "bullets": [
          "นำเข้าไฟล์ผิดรูปแบบ → แสดงข้อความผิดพลาดที่ตัวไฟล์ ไม่ใช่ toast",
          "บันทึกไม่สำเร็จ (ขั้นที่ 2-6 ใดก็ตาม) → อยู่หน้าเดิม พร้อม toast แสดงรหัสและข้อความผิดพลาดจากระบบ เช่น \"500 Internal Server Error\""
        ]
      },
      {
        "level": "h3",
        "label": "C5. Audit / Logging",
        "bullets": [
          "บันทึก `created_at` ต่อรายการ (ตาม schema draft ที่เสนอ) — ไม่มี audit log อื่นที่ระบุไว้เพิ่มเติม"
        ]
      },
      {
        "level": "h3",
        "label": "C6. NFR",
        "bullets": [
          "ใช้มาตรฐานรวมโครงการเดียวกับ US-OH-01 (TOR ข้อ 19/26)"
        ]
      },
      {
        "level": "h2",
        "label": "D. ส่วนประกอบท้าย"
      },
      {
        "level": "bold",
        "label": "Out of Scope",
        "bullets": [
          "การเชื่อมรายการอะไหล่ที่ใช้จริงกับส่วน \"อะไหล่จากคลัง\" ที่จองไว้ตอนสร้างแผน (US-OH-01) — userflow จองไว้เฉยๆ ไม่ได้เชื่อมจริง",
          "การประเมินความพึงพอใจหลังปิดงาน (พบเป็นไอเดียบนบอร์ดดิบ แต่ถูกระบุว่า out-of-scope แล้ว — `23-figjam-raw-reread-AC-ready.md`)"
        ]
      },
      {
        "level": "bold",
        "label": "Assumptions",
        "bullets": [
          "ข้อมูลจำลองในจอใช้รายการอะไหล่ 3 รายการ (ไม่ใช่ตัวเลขจริง)"
        ]
      },
      {
        "level": "bold",
        "label": "สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม",
        "bullets": [
          "ยืนยัน Priority (Must/Should/Could) กับ PO — ไม่มีแหล่งอ้างอิง",
          "ยืนยันงวดส่งมอบ/JO ที่ผูกกับฟีเจอร์นี้",
          "[x] ~~เคาะให้ชัดว่าขั้นปิดงานเก็บเป็น \"อะไหล่\" หรือ \"ค่าใช้จ่าย/ใบสำคัญจ่าย\"~~ — ปิดแล้ว 26 ต.ค. 2569 ยืนยัน \"อะไหล่\" ดู C1 ด้านบน",
          "ยืนยันว่า \"Scenario 21 เบิกอะไหล่\" เป็นคนละ flow กับขั้นปิดงานนี้หรือไม่ (ยังไม่มีจอออกแบบ Scenario 21 เลย)",
          "[x] ~~เคาะว่าเลขใบสำคัญจ่ายต้องตรวจสอบกับระบบบัญชีไหม~~ — ปิดแล้ว ไม่มีฟิลด์นี้ในฟอร์มจริง",
          "เคาะรูปแบบไฟล์นำเข้าและคอลัมน์ที่ต้องมี",
          "เคาะว่าต้องมี modal ยืนยันปิดงานไหม และปิดงานได้ก่อนวันรับรถจริงไหม",
          "เคาะว่าปิดงานแล้วหน่วยงานต้องกดรับทราบหรือประเมินไหม (ฝั่งหน่วยงานยังไม่มีจอ)",
          "เคาะว่าแผนเสร็จสิ้นอัตโนมัติเมื่อรถทุกคันปิดงาน หรือ กบค. ต้องกดปิดแผนเอง",
          "หา/สร้าง API route รองรับ scenario นี้ — ปัจจุบันไม่มี route เลย และต้องยืนยันชื่อตารางจริง (พบแค่ placeholder `senario14` บนบอร์ดดิบ)",
          "ยืนยันความหมายของปุ่ม \"ข้าม\" ที่พบใหม่ในเฟรมนี้",
          "ยืนยันข้อความ toast ปิดงาน — เอกสารนี้ระบุ `\"ปิดงาน {หมายเลข PO} เรียบร้อยแล้ว\"` แต่บอร์ด Refinement 29 oct 2026 แสดงแค่ `\"ปิดงานสำเร็จ\"`"
        ]
      },
      {
        "level": "bold",
        "label": "ข้อเสนอปิดช่องโหว่ (เสนอโดย senior BA + senior dev ร่วมกัน — เป็นข้อเสนอให้ทีมพิจารณา ไม่ใช่ข้อยืนยันจากเอกสาร/บอร์ดใดๆ)",
        "paragraph": "1. Priority → **Must** เหตุผล: เป็นขั้นตอนสุดท้ายที่ปิดวงจรงานและเทียบงบใช้จริงกับงบอนุมัติ — ถ้าไม่ทำ แผนจะค้างสถานะ \"เสร็จสิ้น\" ไม่ได้เลย กระทบการติดตามงบทั้งระบบ\n2. งวดส่งมอบ/JO → JO เดียวกับทั้งชุด US-OH-01 ถึง 08\n3. \"Scenario 21 เบิกอะไหล่\" คือคนละเรื่องกับปิดงานไหม → เสนอว่า **ใช่ คนละเรื่องกัน** เหตุผล: จากที่พบในหน้ารายละเอียดแผน (US-OH-01 AC-10) \"เบิกอะไหล่\" ดูเหมือนเป็นขั้นตอนจองอะไหล่ล่วงหน้าระดับแผน/ระหว่างซ่อม ส่วน \"ปิดงาน\" (ที่นี่) คือบันทึกอะไหล่ที่ใช้จริงหลังซ่อมเสร็จต่อคันรถ จุดประสงค์ต่างกัน (จองล่วงหน้า vs สรุปใช้จริง) แต่ยังต้องยืนยันกับทีมเพราะ Scenario 21 ยังไม่มีจอเลย\n4. รูปแบบไฟล์นำเข้า/คอลัมน์ → ใช้คอลัมน์ตรงกับฟิลด์ทีละรายการที่ยืนยันแล้ว (ชื่ออะไหล่, จำนวน, หน่วย) รองรับ .xlsx/.csv\n5. modal ยืนยันปิดงาน → **ควรมี** เหตุผล: BR-03 ระบุว่าปิดงานแล้วแก้ไขอะไรในหน้างานรายคันไม่ได้อีกเลย เป็นจุดปิดถาวรแบบเดียวกับลบแผน/ลบ PO ที่มี modal ยืนยันอยู่แล้ว ควรสม่ำเสมอ · ปิดงานได้ก่อนวันรับรถจริงไหม → **ได้** ไม่ควร validate กับวันนัดรับรถ เพราะอะไหล่/ค่าใช้จ่ายอาจสรุปเสร็จก่อนส่งมอบจริงได้\n6. หน่วยงานกดรับทราบ/ประเมินหลังปิดงาน → **ไม่ต้อง** เหตุผล: N10 ออกแบบไว้แล้วเป็นแค่ Info notification ให้ดูอย่างเดียว สอดคล้องกับ permission ที่หน่วยงานดูอย่างเดียวตลอดทั้ง flow (B5 ของ story นี้)\n7. แผนเสร็จสิ้นอัตโนมัติหรือ กบค. กดเอง → **อัตโนมัติ** ตามที่ C2 ปัจจุบันเขียนไว้แล้ว (\"ระบบตรวจครบอัตโนมัติ\") เหตุผล: ลดภาระให้ กบค. ไม่ต้องมานั่งไล่เช็คว่ารถครบทุกคันหรือยัง\n8. API route → ต้องยืนยันชื่อตารางจริงกับทีม backend ก่อน ไม่ใช้ `senario14` ที่ดูเหมือน placeholder — เสนอตั้งชื่อตาม pattern ตารางอื่นในโดเมนนี้ เช่น `vms_trn_overhaul_closing_item`\n9. ปุ่ม \"ข้าม\" ใหม่ → เหมือน US-OH-05 ไม่เสนอความหมายเพราะเสี่ยงขัดกับ BR-01 ที่ต้องมีอย่างน้อย 1 รายการก่อนปิดงานได้ ต้องถามทีมออกแบบก่อน\n10. toast ปิดงาน `{หมายเลข PO}` vs ไม่มีตัวแปร → เสนอให้ **คงตัวแปรไว้** (`\"ปิดงาน {หมายเลข PO} เรียบร้อยแล้ว\"`) เหตุผล: ผู้ใช้ปิดงานทีละคัน/ทีละ PO มีโอกาสปิดหลายรายการใกล้กัน ข้อความที่ระบุหมายเลข PO ชัดเจนช่วยลดความสับสนว่า toast นี้พูดถึงคันไหน ต่างจาก toast สร้างแผนที่ใช้ครั้งเดียวต่อ session"
      }
    ]
  }
};

/* ---------- Renderer: แยกเป็นตารางจริง (TABLE) + กล่องโค้ด (CODE_BLOCK) + ข้อความ (TEXT)
   ต่อหัวข้อ แทนการยัด markdown เป็น text ก้อนเดียว (เจ้าของงานสั่ง 26 ต.ค. 2569 — ของเดิม
   อ่านยากเพราะตาราง markdown เพี้ยนฟอนต์ไม่ monospace) ---------- */
const SECTION_GAP_X = 40;
const BLOCK_GAP_Y = 10;
const SECTION_GAP_Y = 18;
const LABEL_SIZE = { h2: 20, h3: 14, bold: 13 };

async function loadInter(style) {
  await figma.loadFontAsync({ family: 'Inter', style });
}

/** แถบหัวข้อ (h2/h3/bold label) — ตัวหนาเสมอ ขนาดต่างกันตามระดับ */
async function createLabelText(label, level) {
  await loadInter('Bold');
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: 'Bold' };
  t.fontSize = LABEL_SIZE[level] || 13;
  t.characters = label;
  t.textAutoResize = 'HEIGHT';
  t.resize(ANNOT_WIDTH, 10);
  return t;
}

/** ข้อความธรรมดา (paragraph) — กว้างคงที่ สูงอัตโนมัติ */
async function createBodyText(text, width) {
  await loadInter('Regular');
  const t = figma.createText();
  t.fontName = { family: 'Inter', style: 'Regular' };
  t.fontSize = FONT_SIZE;
  t.characters = text;
  t.textAutoResize = 'HEIGHT';
  t.resize(width, 10);
  return t;
}

/** bullet list — ใส่ "•" นำหน้าทุกข้อ แทน "- [ ] " markdown */
async function createBulletText(bullets, width) {
  return createBodyText(bullets.map((b) => '•  ' + b.replace(/\n/g, '\n   ')).join('\n\n'), width);
}

/** gherkin scenario → TEXT ธรรมดา (เคยลองใช้ figma.createCodeBlock() แล้วไม่ขึ้นเลยในบอร์ดจริง
 *  เจ้าของงานสั่ง 26 ต.ค. 2569 ให้ตกเป็น text ธรรมดาไปก่อน — ย่อหน้า Given/When/Then ยังคงไว้
 *  เพราะ text ธรรมดาเก็บ whitespace/newline ตามที่ป้อนได้อยู่แล้ว ไม่ต้องมี code block) */
async function createGherkinBlock(code, width) {
  return createBodyText(code, width);
}

/** ตาราง markdown → TABLE จริงของ FigJam (คอลัมน์ตรงแนวจริง ไม่ใช่ pipe-text) */
async function createDataTable(tableData) {
  const { headers, rows } = tableData;
  const table = figma.createTable(rows.length + 1, headers.length);
  await loadInter('Regular');
  for (let c = 0; c < headers.length; c++) {
    const cell = table.cellAt(0, c);
    await figma.loadFontAsync(cell.text.fontName);
    cell.text.characters = headers[c];
  }
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < headers.length; c++) {
      const cell = table.cellAt(r + 1, c);
      await figma.loadFontAsync(cell.text.fontName);
      cell.text.characters = rows[r][c] || '';
    }
  }
  return table;
}

/** สร้างทุก node ของ 1 section (label + table/code/bullets/paragraph) ตามลำดับ
 *  แต่ละชิ้นแยก try/catch กันเอง — ชิ้นหนึ่งพังไม่ทำให้ชิ้นอื่น/section อื่นหายไปด้วย
 *  (บั๊กเดิมที่เจอใน overhaul-schema-plugin: throw กลางลูปทำให้ทั้ง batch เงียบหายไปเลย) */
async function renderSection(section, width, errors) {
  errors = errors || [];
  const nodes = [];
  const tryPush = async (what, fn) => {
    try {
      const n = await fn();
      if (n) nodes.push(n);
    } catch (e) {
      errors.push((section.label || '(ไม่มี label)') + ' / ' + what + ': ' + (e && e.message ? e.message : String(e)));
    }
  };
  if (section.label) await tryPush('label', () => createLabelText(section.label, section.level));
  if (section.table) await tryPush('table', () => createDataTable(section.table));
  if (section.code) for (const c of section.code) await tryPush('code', () => createGherkinBlock(c, width));
  if (section.paragraph) await tryPush('paragraph', () => createBodyText(section.paragraph, width));
  if (section.bullets && section.bullets.length) await tryPush('bullets', () => createBulletText(section.bullets, width));
  return nodes;
}

/** ตัดส่วน "A. Story Header" (ตาราง Story ID/TOR Reference/Priority/งวดส่งมอบ/Actor) ออก
 *  ตามที่เจ้าของงานสั่ง 26 ต.ค. 2569 — ไม่ได้ลบจากข้อมูล USER_STORIES เพราะ doc 25 ยังใช้อยู่
 *  แค่ไม่เอามาวางบนบอร์ด FigJam เท่านั้น */
function isStoryHeaderSection(section) {
  return section.level === 'h2' && section.label === 'A. Story Header';
}

/* ============================================================================
   AC ย่อยตาม frame — เจ้าของงานสั่ง 26 ต.ค. 2569: "อยากให้พอเลือก frame นั้นแล้ว
   ดึงข้อมูลมาแล้ววิเคราะห์ข้อมูลที่มีไปเขียน ac" แทนการยัด Gherkin ทั้ง B1/B2/B3 ของ
   ทั้งกลุ่ม scenario มาให้ทุกครั้งไม่ว่าจะเลือกจอไหนในกลุ่มนั้น

   วิธีทำ (เรียงลำดับความน่าเชื่อถือจากสูงไปต่ำ — ใช้วิธีแรกที่ได้ผลลัพธ์ก่อนเสมอ):
   1) อ่านข้อความจริงในเฟรมที่เลือก (เทคนิคเดียวกับ overhaul-schema-plugin เดินทุก node
      ลูก type TEXT) แล้วเทียบกับ "ข้อความในเครื่องหมายคำพูด" ของแต่ละ Scenario ใน Gherkin
      (เช่น error message, toast) — ถ้าเจอ Scenario ที่มีข้อความตรงกับของจริงในเฟรม
      อย่างน้อย 1 จุด ถือว่า "วิเคราะห์จากข้อมูลจริง" ยืนยันได้แน่นอน (ไม่ใช่เดา)
   2) ถ้าไม่เจอข้อความตรงเลย (เช่น เฟรมที่เลือกไม่มี error/toast ให้เทียบ) ตกไปใช้ชื่อ
      เฟรม (ส่วนหลัง "—") เทียบ bigram กับหัวข้อ Scenario แทน — เป็นการเดาที่อ่อนกว่า
      ต้องชนะชัดเจนจึงใช้ได้
   3) ไม่เจอทั้งสองวิธี → ไม่เดา แสดง Gherkin ทั้งหมดของกลุ่มไว้เหมือนเดิม พร้อมบอกตรงๆ
      ว่าไม่มั่นใจว่าตรงกับจอไหน กันข้อมูลหาย
   ============================================================================ */

/** ดึง "Scenario: ..." ทุกก้อนจาก code string เดียว (บางก้อนใน B3 มี 2 scenario ติดกัน) */
function splitScenarios(code) {
  const out = [];
  const re = /Scenario:\s*([^\n]+)\n([\s\S]*?)(?=\nScenario:|$)/g;
  let m;
  while ((m = re.exec(code))) {
    out.push({ title: m[1].trim(), text: 'Scenario: ' + m[1].trim() + '\n' + m[2].trimEnd() });
  }
  return out;
}

const GHERKIN_SECTION_LABELS = ['B1. Happy Path', 'B2. Alternative Flow', 'B3. Exception / Negative Flow'];

/** รวม scenario ทั้งหมดจาก B1/B2/B3 ของ story เดียว เป็น pool เดียวให้เลือก */
function collectScenarios(story) {
  const pool = [];
  for (const section of story.sections) {
    if (!GHERKIN_SECTION_LABELS.includes(section.label) || !section.code) continue;
    for (const code of section.code) pool.push(...splitScenarios(code).map((s) => ({ ...s, sourceLabel: section.label })));
  }
  return pool;
}

/** ดึงข้อความในเครื่องหมายคำพูดจาก 1 scenario ทั้งหมด (ไม่กรอง) — ใช้ตอนรวบรวม "action quotes" */
function extractQuotedStrings(text) {
  const out = [];
  const re = /"([^"]+)"/g;
  let m;
  while ((m = re.exec(text))) out.push(m[1]);
  return out;
}

/** ดึงข้อความในเครื่องหมายคำพูดเฉพาะจากบรรทัด Given/When — คือปุ่ม/การกระทำตั้งต้น
 *  (ป้ายปุ่มพวกนี้มักอยู่ทุกหน้าที่ไปถึง scenario นั้นได้ ไม่ใช่สัญญาณเฉพาะ state) */
function extractActionQuotes(text) {
  const out = [];
  const re = /"([^"]+)"/g;
  for (const line of text.split('\n')) {
    if (!/^\s*(Given|When)\b/i.test(line)) continue;
    let m;
    while ((m = re.exec(line))) out.push(m[1]);
  }
  return out;
}

/** ข้อความในเครื่องหมายคำพูดที่ "ยืนยัน state จริง" ของ scenario เดียว — ตัด action quotes
 *  (ของทั้ง pool) ออกแม้จะไปโผล่ซ้ำใน Then/And ก็ตาม เพราะยังเป็นแค่การพูดถึงปุ่มเดิม ไม่ใช่
 *  ผลลัพธ์ใหม่ที่เฉพาะเจาะจง — บั๊กจริงที่เจอ 26 ต.ค. 2569: เฟรม "A.1 มีรายการ" มีปุ่ม
 *  "สร้างแผน Overhaul" อยู่ด้วย ไปจับคู่ผิดกับ AC-01 (ปุ่มนี้ถูกกดใน When ของ AC-01) และ
 *  AC-08 (ปุ่มเดียวกันถูกพูดถึงใน And ว่า "แสดงปุ่มนี้" — ก็ยังเป็นปุ่มเดิม ไม่ใช่ state ใหม่) */
function extractStateQuotes(text, actionQuotes) {
  const out = [];
  for (const line of text.split('\n')) {
    if (/^\s*(Given|When)\b/i.test(line)) continue;
    const re = /"([^"]+)"/g;
    let m;
    while ((m = re.exec(line))) {
      if (!actionQuotes.has(m[1])) out.push(m[1]);
    }
  }
  return out;
}

/** เดินทุก node ใต้ root เก็บ .characters ของ TEXT ทั้งหมด (เทคนิคเดียวกับ overhaul-schema-plugin) */
function readFrameTexts(root) {
  const out = [];
  const walk = (n) => {
    if (n.type === 'TEXT' && n.characters) out.push(n.characters.trim());
    for (const c of n.children || []) walk(c);
  };
  walk(root);
  return out;
}

/** วิธีที่ 1: เทียบข้อความจริงในเฟรมกับข้อความในเครื่องหมายคำพูดของแต่ละ scenario
 *  คืน scenario ที่ "ยืนยันได้จากของจริง" มากที่สุด (ต้องยืนยันได้ ≥1 จุด) พร้อมรายการ
 *  ที่ยืนยันได้/ไม่ได้ ไว้เขียนเป็นหมายเหตุใต้ AC (นี่คือส่วน "วิเคราะห์ข้อมูลที่มี") */
function matchScenarioByContent(scenarios, frameTexts) {
  // ขั้น 1: รวบรวม "action quotes" ของทั้ง pool (ปุ่ม/การกระทำจาก Given/When ทุก scenario)
  // ป้ายปุ่มเหล่านี้ตัดออกจากการนับเป็นหลักฐานยืนยัน state เสมอ แม้จะไปโผล่ซ้ำใน Then/And
  // ของ scenario อื่นก็ตาม (ดู extractStateQuotes ด้านบน)
  const actionQuotes = new Set();
  for (const sc of scenarios) for (const q of extractActionQuotes(sc.text)) actionQuotes.add(q);

  // น้ำหนักต่อ quote = 1 / จำนวน scenario ในกลุ่มที่พูดถึงข้อความนี้ — ป้ายทั่วไปที่ซ้ำกันข้าม
  // scenario ได้น้ำหนักน้อย ข้อความเฉพาะ state (เช่น error message ที่มีแค่ scenario เดียว)
  // ได้น้ำหนักเต็ม กันไม่ให้ป้ายทั่วไปกลบสัญญาณที่แม่นกว่า
  const quotesByScenario = scenarios.map((sc) => extractStateQuotes(sc.text, actionQuotes));
  const freq = new Map();
  for (const quotes of quotesByScenario) for (const q of new Set(quotes)) freq.set(q, (freq.get(q) || 0) + 1);

  let best = null;
  for (let i = 0; i < scenarios.length; i++) {
    const quotes = quotesByScenario[i];
    if (!quotes.length) continue;
    // ทิศทางเดียว: ข้อความจริงในเฟรม "มี" quote นี้อยู่เป๊ะๆ (ไม่ใช่ quote ที่ยาวกว่าแล้วบังเอิญ
    // มีข้อความสั้นๆ ในเฟรมเป็น substring — ทิศนั้นทำให้ข้อความที่มี {placeholder} เช่น
    // "สร้างแผน Overhaul {เลขแผน} สำเร็จ" ถูกนับว่า "เจอจริง" ทั้งที่ไม่มีทางเจอตัวเต็มบนจอจริง)
    const confirmed = quotes.filter((q) => frameTexts.some((t) => t.includes(q)));
    if (!confirmed.length) continue;
    const score = confirmed.reduce((sum, q) => sum + (1 / freq.get(q)), 0);
    if (!best || score > best.score) {
      best = { scenario: scenarios[i], quotes, confirmed, score };
    }
  }
  return best;
}

/** วิธีที่ 2 (สำรอง): bigram overlap ระหว่างชื่อสถานะของเฟรมกับหัวข้อ scenario — ภาษาไทยไม่มีช่องว่าง
 *  คั่นคำชัดเจน จึงใช้ n-gram ตัวอักษรแทนการตัดคำ ทนทานกว่าการเทียบ substring ตรงๆ */
function extractFrameState(name) {
  const parts = (name || '').split('—');
  return parts.length > 1 ? parts[parts.length - 1].trim() : null;
}

function thaiBigrams(s) {
  const clean = (s || '').replace(/[\s"().,/]/g, '');
  const out = new Set();
  for (let i = 0; i < clean.length - 1; i++) out.add(clean.slice(i, i + 2));
  return out;
}

function bigramOverlapRatio(a, b) {
  const A = thaiBigrams(a);
  const B = thaiBigrams(b);
  if (!A.size || !B.size) return 0;
  let hit = 0;
  for (const g of A) if (B.has(g)) hit++;
  return hit / Math.min(A.size, B.size);
}

function pickScenarioByFrameName(frameState, scenarios) {
  if (!frameState || !scenarios.length) return null;
  const scored = scenarios.map((sc) => ({ sc, score: bigramOverlapRatio(frameState, sc.title) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored[0];
  const second = scored[1];
  const confident = top.score >= 0.35 && (!second || top.score - second.score >= 0.15);
  return confident ? top.sc : null;
}

/** ประกอบ bullet สรุปว่าข้อความไหนในเครื่องหมายคำพูดของ scenario ที่เลือก ยืนยันได้จริงจาก
 *  เฟรม (✅) และไหนยังไม่เจอ (❓ — อาจจอยังไม่ทำ/ข้อความไม่ตรงเป๊ะ ไม่ได้แปลว่าผิด) */
function buildContentConfirmationBullets(match) {
  const bullets = [];
  for (const q of match.quotes) {
    bullets.push((match.confirmed.includes(q) ? '✅ ยืนยันจากข้อความจริงในเฟรม: ' : '❓ ไม่เจอข้อความนี้ในเฟรมที่เลือก (เช็คอีกรอบ — อาจพิมพ์ไม่ตรงเป๊ะหรือจอยังไม่ทำ): ') + '"' + q + '"');
  }
  return bullets;
}

/** เลือก section Gherkin ให้เหมาะกับเฟรมที่เลือกจริง แทนการยัดทั้ง B1/B2/B3 มาให้ทุกครั้ง */
function buildGherkinSectionForFrame(story, node) {
  const pool = collectScenarios(story);
  if (!pool.length) return null;

  const frameTexts = readFrameTexts(node);
  const contentMatch = matchScenarioByContent(pool, frameTexts);
  if (contentMatch) {
    return {
      level: 'h3',
      label: 'AC เฉพาะจอนี้ — วิเคราะห์จากข้อความจริงในเฟรม (' + contentMatch.scenario.title + ')',
      code: [contentMatch.scenario.text],
      bullets: buildContentConfirmationBullets(contentMatch),
    };
  }

  const frameState = extractFrameState(node.name);
  const namePick = pickScenarioByFrameName(frameState, pool);
  if (namePick) {
    return {
      level: 'h3',
      label: 'AC เฉพาะจอนี้ — จับคู่จากชื่อเฟรม (' + namePick.title + ')',
      code: [namePick.text],
      bullets: ['⚠️ จับคู่จากชื่อเฟรม ไม่ได้ยืนยันจากข้อความจริงในเฟรม (เฟรมนี้ไม่มีข้อความใน " " ให้เทียบ หรือยังไม่ตรงกับ scenario ไหนเป๊ะ) — ควรเช็คซ้ำด้วยตา'],
    };
  }

  return {
    level: 'h3',
    label: 'Gherkin ที่เกี่ยวข้องทั้งกลุ่ม (ไม่มั่นใจว่าตรงกับจอนี้ตัวไหนเป๊ะ — แสดงทั้งหมดไว้ก่อน ไม่เดา)',
    code: pool.map((s) => s.text),
  };
}

/** แทนที่ section B1/B2/B3 เดิม (ทั้งกลุ่ม) ด้วย section Gherkin เฉพาะจอที่เลือกจริง */
/** เช็คว่าข้อความ (1 bullet หรือ 1 แถวตาราง รวมทุก cell เป็น string เดียว) "ยืนยันได้จากของจริง
 *  ในเฟรม" ไหม — ใช้หลักการเดียวกับ Gherkin (ตัด action quote ของปุ่ม/การกระทำออกก่อน แล้วเช็ค
 *  ว่า quote ที่เหลือ [error message/สถานะ/ข้อความเฉพาะ] ไปโผล่ในข้อความจริงของเฟรมไหม) */
function rowOrBulletMatchesFrame(text, frameTexts, actionQuotes) {
  const quotes = extractStateQuotes(text, actionQuotes);
  return quotes.some((q) => frameTexts.some((t) => t.includes(q)));
}

/** กรอง bullets/table rows ของ 1 section ให้เหลือเฉพาะที่ "ยืนยันได้จากข้อความจริงในเฟรม"
 *  ถ้าไม่มีแถว/ข้อไหนยืนยันได้เลย (เช่น section ไม่มี quote ให้เทียบ อย่าง B5 Permission หรือ
 *  เฟรมที่เลือกไม่มีข้อความเกี่ยวข้องพอ) คงเนื้อหาเดิมไว้ทั้งหมด ไม่เดาว่าอันไหนตัดได้ */
function filterSectionByFrame(section, frameTexts, actionQuotes) {
  if (section.bullets && section.bullets.length) {
    const matched = section.bullets.filter((b) => rowOrBulletMatchesFrame(b, frameTexts, actionQuotes));
    if (!matched.length) return section;
    return {
      ...section,
      bullets: [...matched, 'ℹ️ กรองตามข้อความจริงในเฟรมที่เลือกแล้ว — เหลือ ' + matched.length + ' จาก ' + section.bullets.length + ' ข้อ (ข้ออื่นไม่เกี่ยวกับจอนี้)'],
    };
  }
  if (section.table) {
    const matchedRows = section.table.rows.filter((r) => rowOrBulletMatchesFrame(r.join(' | '), frameTexts, actionQuotes));
    if (!matchedRows.length) return section;
    const note = 'ℹ️ กรองตามข้อความจริงในเฟรมที่เลือกแล้ว — เหลือ ' + matchedRows.length + ' จาก ' + section.table.rows.length + ' แถว (แถวอื่นไม่เกี่ยวกับจอนี้)';
    return { ...section, table: { ...section.table, rows: matchedRows }, paragraph: section.paragraph ? section.paragraph + '\n' + note : note };
  }
  return section;
}

/** ส่วนที่ไม่ใช่ "ข้อเท็จจริงของ AC" (B4-B6/C1-C6) — เป็นข้อมูลเกริ่น/วางแผนระดับ story
 *  ไม่ควรถูกกรองตามเฟรม เพราะไม่ได้พูดถึง "จอหนึ่งจอ" โดยเฉพาะ */
const NON_FILTERABLE_LABELS = new Set(['User Story', 'Precondition', 'Out of Scope', 'Assumptions', 'สิ่งที่ยังไม่ครบ — ต้องไปหาอะไรมาเพิ่ม']);

function buildSectionsForFrame(story, node) {
  const consolidated = buildGherkinSectionForFrame(story, node);
  if (!consolidated) return story.sections;
  const idx = story.sections.findIndex((s) => GHERKIN_SECTION_LABELS.includes(s.label));
  const rest = story.sections.filter((s) => !GHERKIN_SECTION_LABELS.includes(s.label));

  // ใช้ action quotes ชุดเดียวกับที่ใช้จับคู่ Gherkin (ปุ่ม/การกระทำทั่วไปของทั้ง story)
  // กรอง B4-B6/C1-C6 ด้วยหลักการเดียวกัน — แถว/ข้อไหนยืนยันได้จากข้อความจริงในเฟรมก็เหลือไว้
  const pool = collectScenarios(story);
  const actionQuotes = new Set();
  for (const sc of pool) for (const q of extractActionQuotes(sc.text)) actionQuotes.add(q);
  const frameTexts = readFrameTexts(node);

  const kept = rest.map((s) => {
    if (s.level !== 'h3' || NON_FILTERABLE_LABELS.has(s.label)) return s;
    return filterSectionByFrame(s, frameTexts, actionQuotes);
  });
  kept.splice(idx, 0, consolidated);
  return kept;
}

/** แปะ user story เต็มรูปแบบ (ตาราง/โค้ด/ข้อความจริงแยกกล่อง) ไว้ทางขวาของ node ที่เลือก
 *  เรียง section ตามลำดับในเอกสาร ไล่ y ลงตามความสูงจริงของแต่ละ node ที่สร้าง —
 *  ส่วน Gherkin ถูกย่อให้เหลือแค่ scenario ที่ตรงกับเฟรมที่เลือกจริง (ดู buildSectionsForFrame) */
// Assemble every textual section in reading order into a single editable text.
// Tables remain separate, with an in-story pointer at their original position.
function composeFrameStory(story) {
  const parts = [story.title];
  const tables = [];
  for (const section of story.sections) {
    let label = section.label;
    if (label === 'พฤติกรรมที่ควรทำ') label += ' (ข้อเสนอเพื่อคุยกับทีม)';
    if (label) parts.push(label);
    if (section.paragraph) parts.push(section.paragraph);
    if (section.bullets && section.bullets.length) {
      parts.push(section.bullets.map(text => '• ' + text).join('\n\n'));
    }
    if (section.code) parts.push(section.code.join('\n\n'));
    if (section.table) {
      tables.push({label: section.label || 'ข้อมูลประกอบ', table: section.table});
      parts.push('ดูตารางที่ ' + tables.length + ' ด้านล่าง');
    }
  }
  if (!story.sprint09) parts.push('UI Component & Behavior รวมแนวทางพัฒนาจากโปรเจกต์และข้อเสนอ; Error Handling / Edge Cases เป็นข้อเสนอ ส่วนที่อ้าง Sheet ให้ยึดตามแหล่งที่ระบุ ส่วนที่ต้องตกลงยังไม่ใช่ข้อสรุป');
  return {text: parts.join('\n\n'), tables};
}

// The Sprint 06 board has a shared D.2 modal; newer AC splits its entry points.
// Keep both contracts instead of guessing whether the frame came from list/detail.
function sharedDeletePlanStory() {
  const list = FRAME_STORIES['D.2.1'];
  const detail = FRAME_STORIES['D.2.2'];
  if (!list || !detail) return null;
  const sections = list.sections.map(section => ({...section, ...(section.bullets ? {bullets: [...section.bullets]} : {})}));
  for (const section of detail.sections) {
    const existing = sections.find(item => item.label === section.label);
    if (!existing) {sections.push({...section, ...(section.bullets ? {bullets: [...section.bullets]} : {})}); continue;}
    if (section.bullets) existing.bullets = [...new Set([...(existing.bullets || []), ...section.bullets])];
    if (section.paragraph && section.paragraph !== existing.paragraph) existing.paragraph = [existing.paragraph, section.paragraph].filter(Boolean).join('\n');
  }
  return {...list, title: 'AC D.2 — ยืนยันการลบแผน', sections};
}

function resolveFrameStory(name) {
  const match = /(?:^|[\/·]\s*)([A-O]\.\d+(?:\.\d+)?)(?=\s|$|[·—–-])/.exec(name || '');
  // Legacy Sprint 06 IDs are accepted only for the documented state.
  const legacyStates = {
    'H.4': {id: 'H.4.1', state: /สร้างนัดไม่สำเร็จ/},
    'H.7': {id: 'H.4.3', state: /แก้ไขนัดหมาย/},
    'H.6': {id: 'H.4.4', state: /ปฏิเสธ/},
    'D.1': {id: 'D.1.1', state: /เมนู/},
  };
  const legacy = match && legacyStates[match[1]];
  const frameId = match && (legacy && legacy.state.test(name) ? legacy.id : match[1]);
  const story = frameId && (frameId === 'D.2' ? sharedDeletePlanStory() : FRAME_STORIES[frameId]);
  return {story, frameId};
}

async function annotateUserStory(node, flowKey, liveUI, transferred, destinationPage, storyOverride) {
  const annotationPage = destinationPage || figma.currentPage;
  if (!storyOverride && !USER_STORIES[flowKey] && !transferred) return null;
  const sourceName = transferred ? transferred.frame.name : node.name;
  const resolved = resolveFrameStory(sourceName);
  const story = storyOverride || resolved.story || (transferred ? {
    title: 'UI — ' + sourceName,
    sections: [{level: 'h2', label: 'ข้อมูลจาก design', paragraph: 'ยังไม่มี AC behavior สำหรับ frame นี้ รายการด้านล่างเป็นข้อมูล UI ที่บันทึกจาก Figma'}],
  } : null);
  if (!story) throw new Error('ไม่พบ AC ตรงรหัสเฟรม: ' + node.name);
  if (!storyOverride && !transferred && LETTER_TO_FLOW[resolved.frameId[0]] !== flowKey) throw new Error('flow ที่เลือกไม่ตรงกับรหัสเฟรม ' + resolved.frameId);
  const abs = node.absoluteTransform
    ? {x: node.absoluteTransform[0][2], y: node.absoluteTransform[1][2]}
    : {x: node.x, y: node.y};
  const x = abs.x + (node.width || 0) + SECTION_GAP_X;
  let y = abs.y;
  const created = [];
  const errors = [];
  const composed = composeFrameStory(story);
  // Reviewed AC already integrates observed UI. Only unknown frames need a summary.
  if (!resolved.story && transferred) composed.text += '\n\nรายละเอียดหน้าจอ\n' + FrameBridge.readable({frames: [transferred.frame]});
  const pad = 20;
  function add(n, nx, ny) {
    n.x = nx; n.y = ny;
    annotationPage.appendChild(n);
    n.setPluginData(TAG_KEY, '1');
    created.push(n);
  }
  // Measure with a temporary TextNode, but retain only the shape's native text.
  // TextSublayer cannot be resized or positioned independently of its shape.
  async function styleText(text) {
    text.fontName = {family: 'Inter', style: 'Regular'};
    text.fontSize = FONT_SIZE;
    text.characters = composed.text;
    text.textAlignHorizontal = 'LEFT';
    if (typeof text.setRangeFontName === 'function') {
      text.setRangeFontName(0, story.title.length, {family: 'Inter', style: 'Bold'});
      text.setRangeFontSize(0, story.title.length, 20);
      for (const section of story.sections) {
        if (!section.label) continue;
        const label = section.label === 'พฤติกรรมที่ควรทำ'
          ? section.label + ' (ข้อเสนอเพื่อคุยกับทีม)' : section.label;
        const start = composed.text.indexOf('\n\n' + label + '\n');
        if (start >= 0) {
          text.setRangeFontName(start + 2, start + 2 + label.length, {family: 'Inter', style: 'Bold'});
          text.setRangeFontSize(start + 2, start + 2 + label.length, section.level === 'h2' ? 16 : 14);
        }
      }
      const components = story.sections.find(s => s.label === 'UI Component & Behavior');
      for (const group of components ? components.bullets || [] : []) {
        const name = group.split('\n')[0];
        const start = composed.text.indexOf('• ' + name + '\n');
        if (start >= 0) text.setRangeFontName(start + 2, start + 2 + name.length, {family: 'Inter', style: 'Bold'});
      }
    }
  }
  let measure;
  let shape;
  try {
    await loadInter('Regular');
    await loadInter('Bold');
    measure = await createBodyText(composed.text, ANNOT_WIDTH);
    await styleText(measure);
    const height = Math.max(100, measure.height + pad * 4);
    shape = figma.createShapeWithText();
    shape.name = story.title + ' / เรื่องราว';
    shape.shapeType = 'SQUARE';
    shape.fills = [{type: 'SOLID', color: {r: 1, g: 1, b: 1}}];
    shape.strokes = [{type: 'SOLID', color: {r: 0.816, g: 0.835, b: 0.867}}];
    // Match Figma's embedded shape text API; never set textAutoResize on it.
    await styleText(shape.text);
    shape.resize(ANNOT_WIDTH + pad * 4, height);
    add(shape, x - pad, y);
    y += shape.height;
  } catch (e) {
    if (shape && !created.includes(shape)) shape.remove();
    errors.push('AC shape text: ' + (e.message || String(e)));
  } finally {
    if (measure) measure.remove();
  }
  for (const [i, table] of composed.tables.entries()) {
    y += SECTION_GAP_Y;
    const nodes = await renderSection({level: 'h3', label: 'ตารางที่ ' + (i + 1) + ' — ' + table.label, table: table.table}, ANNOT_WIDTH, errors);
    for (const n of nodes) { add(n, x, y); y += n.height + BLOCK_GAP_Y; }
  }
  if (created.length) {
    try { created.container = figma.group(created, annotationPage); } catch (e) { /* editor may not support grouping */ }
  }
  created.errors = errors;
  return created;
}

/** ลบป้ายที่ปลั๊กอินนี้แปะไว้ก่อนหน้า */
function clearTags(root) {
  let n = 0;
  const walk = (node) => {
    const kids = (node.children || []).slice();
    for (const c of kids) {
      if (c.getPluginData && c.getPluginData(TAG_KEY) === '1') {
        c.remove();
        n++;
        continue;
      }
      walk(c);
    }
  };
  walk(root);
  return n;
}

const BRIDGE_PLACEMENT = 'maintain-d-ac-bridge-placement';
function bridgeAnnotations(root, placement) {
  const found = [];
  function walk(node) {
    for (const child of node.children || []) {
      if (child.getPluginData && child.getPluginData(BRIDGE_PLACEMENT) === placement) found.push(child);
      else walk(child);
    }
  }
  walk(root);
  return found;
}
async function pasteSavedFrame(key) {
  if (figma.editorType !== 'figjam') throw Error('เปิด plugin นี้ใน FigJam เพื่อแปะข้อมูลที่บันทึกจาก Figma');
  const destination = figma.currentPage;
  const selection = Array.from(destination.selection || []);
  const record = await FrameBridge.get(figma, key);
  if (selection.length > 1) throw Error('เลือก frame หรือภาพปลายทางครั้งละ 1 ชิ้น หรือไม่เลือกเพื่อวางบนพื้นที่ว่าง');
  const center = figma.viewport.center || {x: 0, y: 0};
  let target = selection[0] || {id: 'floating', name: record.frame.name, width: 0, x: center.x, y: center.y};
  // Selecting an existing AC (or one of its children) updates its original binding.
  for (let owner = selection[0]; owner && owner !== destination; owner = owner.parent) {
    const binding = owner.getPluginData && owner.getPluginData(BRIDGE_PLACEMENT);
    if (!binding) continue;
    const parts = JSON.parse(binding);
    if (parts[0] !== record.key) throw Error('ป้าย AC ที่เลือกเป็นของ frame อื่น กรุณาเลือกรายการข้อมูลให้ตรงกับป้าย หรือเลือกภาพปลายทางใหม่');
    target = {id: parts[1], name: record.frame.name, width: 0, x: center.x, y: center.y};
    break;
  }
  const targetCode = FrameBridge.code(target.name);
  const sourceCode = FrameBridge.code(record.frame.name);
  const canonical = name => resolveFrameStory(name).frameId || FrameBridge.code(name);
  if (targetCode && sourceCode && canonical(target.name) !== canonical(record.frame.name)) {
    throw Error('รหัสปลายทาง ' + targetCode + ' ไม่ตรงกับข้อมูล Figma ' + sourceCode + ' กรุณาเลือกภาพ/frame ที่ตรงกัน หรือยกเลิก selection เพื่อวางแยก');
  }
  const placement = JSON.stringify([record.key, target.id]);
  const previous = bridgeAnnotations(destination, placement);
  const oldPosition = previous[0] && (previous[0].absoluteTransform
    ? {x: previous[0].absoluteTransform[0][2], y: previous[0].absoluteTransform[1][2]}
    : {x: previous[0].x, y: previous[0].y});
  const nodes = await annotateUserStory(target, findFlowForNode(record.frame.name), false, record, destination);
  if (!nodes || !nodes.length || (nodes.errors && nodes.errors.length)) {
    if (nodes) {
      if (nodes.container && typeof nodes.container.remove === 'function') nodes.container.remove();
      else for (const node of nodes) node.remove();
    }
    throw Error('สร้าง AC ใหม่ไม่ครบ จึงยังเก็บป้ายเดิมไว้: ' + (nodes && nodes.errors ? nodes.errors.join(' · ') : 'ไม่พบข้อมูล'));
  }
  const container = nodes.container;
  const owners = container && typeof container.setPluginData === 'function' ? [container] : nodes;
  for (const owner of owners) {
    owner.setPluginData(BRIDGE_PLACEMENT, placement);
    owner.setPluginData(TAG_KEY, '1');
  }
  if (oldPosition) {
    const first = owners[0];
    const dx = oldPosition.x - first.x, dy = oldPosition.y - first.y;
    for (const owner of owners) {owner.x += dx; owner.y += dy;}
  }
  // Replace only this source/target binding, after successful creation.
  for (const old of previous) old.remove();
  if (figma.currentPage === destination) figma.viewport.scrollAndZoomIntoView(owners);
  return {updated: previous.length > 0, frame: record.frame.name, capturedAt: record.capturedAt};
}

function matchSprint09Frame(name) {
  // Ordered state-specific rules: a bare A.1 never determines the dataset.
  const rule = SPRINT09_FRAME_MAP.find(rule => new RegExp(rule.pattern, 'i').test(name || ''));
  if (rule) return {storyId: 'US-S09-' + rule.story, acIds: rule.ac.map(id => 'AC-S09-' + rule.story + '-' + id)};
  // Use the authored per-frame catalog, including names without an OH2 prefix.
  // SP09 has its own reused A–J IDs; never treat its unreviewed screens as Overhaul.
  if (!/^SP09\b/i.test(name || '')) {
    const resolved = resolveFrameStory(name);
    if (resolved.story) return {legacyFrameId: resolved.frameId, storyId: 'Overhaul — AC รายเฟรม', acIds: ['AC ' + resolved.frameId]};
  }
  return null;
}

function sprint09Story(storyId, acIds) {
  const source = SPRINT09_AC[storyId];
  if (!source || !Array.isArray(acIds) || !acIds.length) throw Error('เลือก Story และ AC อย่างน้อย 1 ข้อ');
  if (new Set(acIds).size !== acIds.length || acIds.some(id => !source.ac.some(ac => ac.id === id))) throw Error('AC ไม่ตรงกับ Story ที่เลือก');
  const labels = {R: 'ข้อสรุป refinement', D: 'ตามหน้าจอ — รอยืนยัน Sprint scope', P: 'ข้อเสนอ — รอรับรอง'};
  return {sprint09: true, title: source.id + ' — ' + source.title, sections: [
    {level: 'h2', label: 'Acceptance Criteria — Sprint 09', bullets: source.ac.filter(ac => acIds.includes(ac.id)).map(ac => ac.id + ' [' + labels[ac.level] + ']\n' + ac.text)},
    {level: 'h2', label: 'บริบทและประเด็นที่ต้องยืนยัน', paragraph: source.context},
    {level: 'h2', label: 'แหล่งอ้างอิง', paragraph: 'refinement-sprint09.pdf / docs/sprint09-acceptance-criteria.md; mapping เลือกโดยผู้ใช้ ไม่อนุมานสิทธิ์หรือ behavior จากชื่อเฟรม'}
  ]};
}

function findSprint09Annotations(root, binding) {
  const found = [];
  const pending = Array.from(root.children || []);
  while (pending.length) {
    const node = pending.pop();
    if (typeof node.getPluginData === 'function' && node.getPluginData('sprint09-binding') === binding) {
      found.push(node);
      // A matching group owns its descendants: remove the owner just once.
      continue;
    }
    if (node.children) pending.push(...node.children);
  }
  return found;
}

function isACLabel(node) {
  return node.type === 'SHAPE_WITH_TEXT' || node.type === 'TEXT' ||
    (typeof node.getPluginData === 'function' && node.getPluginData(TAG_KEY) === '1');
}

async function annotateSprint09(storyId, acIds, target, destinationPage, frameStory) {
  if (figma.editorType !== 'figjam') throw Error('แปะ AC ใน FigJam: เลือกภาพหรือ frame ปลายทางก่อน');
  const selection = target ? [target] : Array.from(figma.currentPage.selection || []);
  if (selection.length !== 1) throw Error('เลือก frame หรือภาพปลายทาง 1 ชิ้นสำหรับ mapping ที่เลือกเอง');
  const node = selection[0];
  const story = frameStory || sprint09Story(storyId, acIds);
  const page = destinationPage || figma.currentPage;
  if (node.removed) throw Error('เฟรมปลายทางถูกลบแล้ว');
  const binding = 'sprint09:' + node.id;
  const previous = findSprint09Annotations(page, binding);
  const created = await annotateUserStory(node, null, false, null, page, story);
  if (!created.length || created.errors.length) {
    for (const item of created) item.remove();
    if (created.container) created.container.remove();
    throw Error('แปะ AC ไม่สำเร็จ: ' + created.errors.join(' / '));
  }
  for (const item of created) item.setPluginData('sprint09-binding', binding);
  if (created.container) created.container.setPluginData('sprint09-binding', binding);
  for (const item of previous) { if (!item.removed) item.remove(); }
  node.setPluginData('sprint09-map', JSON.stringify({storyId, acIds}));
  return {updated: previous.length > 0, nodes: created, owner: created.container || created[0]};
}

// BEGIN SPRINT09_AC
const SPRINT09_AC = {
  "US-S09-01": {
    "id": "US-S09-01",
    "title": "Login จริงผ่าน VMS+ / Keycloak",
    "ac": [
      {
        "id": "AC-S09-01-01",
        "level": "R",
        "text": "**Given** ยังไม่ได้เข้าสู่ระบบ **When** เปิดการเข้าสู่ Maintain-D **Then** แสดงทางเข้าสู่ระบบ VMS+ และเข้าสู่กระบวนการ Login จริงได้ โดยไม่มีหน้าเลือก mock user"
      },
      {
        "id": "AC-S09-01-02",
        "level": "D",
        "text": "**Given** อยู่หน้าเข้าสู่ VMS+ **When** เลือก “พนักงาน กฟภ.” **Then** ไปหน้า SSO กฟภ. เพื่อกรอกบัญชี"
      },
      {
        "id": "AC-S09-01-03",
        "level": "R",
        "text": "**Given** บัญชีถูกต้องและมีสิทธิ์ **When** Login สำเร็จ **Then** ได้ token ของผู้ใช้ที่ Login จริง และเข้าสู่หน้า Overhaul ได้ โดยไม่ใช้ identity ของ mock user"
      },
      {
        "id": "AC-S09-01-04",
        "level": "R",
        "text": "**Given** มีบัญชีทดสอบแยก `admin-super`, `general`, `admin-region` **When** Login ทีละบัญชี **Then** ทั้งสามบัญชีเข้าสู่ระบบได้และได้รับ identity/role ตรงกับบัญชีที่ใช้"
      },
      {
        "id": "AC-S09-01-05",
        "level": "D",
        "text": "**Given** อยู่หน้า SSO **When** กรอกบัญชีหรือรหัสผ่านไม่ถูกต้อง **Then** ไม่เข้าสู่ VMS+ และ SSO แสดง “Invalid username or password.” ตามพฤติกรรมเดิม"
      },
      {
        "id": "AC-S09-01-06",
        "level": "D",
        "text": "**Given** ยืนยันตัวตน SSO สำเร็จแต่บัญชียังไม่มีสิทธิ์เข้า VMS+ **When** กลับจาก SSO **Then** แสดง “คุณไม่มีสิทธิ์เข้าใช้งานระบบ” และ “กรุณาติดต่อผู้ดูแลหากต้องการเข้าใช้งาน” โดยไม่เก็บ token สำหรับใช้งานต่อ ปิดข้อความแล้วยังอยู่หน้าเข้าสู่ระบบ"
      },
      {
        "id": "AC-S09-01-07",
        "level": "P",
        "text": "**Given** ยังไม่ได้ Login **When** เปิด URL รายละเอียด Overhaul/PO โดยตรง **Then** ต้องเข้าสู่กระบวนการ Login ก่อน และไม่แสดงข้อมูลรายละเอียดระหว่างรอ"
      }
    ],
    "context": "**User story:** ในฐานะผู้ใช้งาน ฉันต้องการเข้าสู่ Maintain-D ผ่านการยืนยันตัวตนของ VMS+ เพื่อใช้งานด้วยบัญชีและสิทธิ์จริง\n**ขอบเขต:** Keycloak ยืนยันตัวตน และ UserHub เป็นแหล่งสิทธิ์ตามโน้ตในบอร์ด หน้า SSO เป็นระบบที่มีอยู่แล้ว ใช้ทดสอบการเชื่อมต่อโดยไม่ถือว่าเป็นงานออกแบบ SSO ใหม่\n|---|---|---|\n**รอยืนยัน:** ระยะเวลา token/session และ refresh token, การกลับหน้าปลายทางหลัง Login, URL ของแต่ละ environment และ CORS ที่จำเป็น หน้าเลือกบัญชี VMS+ เดิมกับหน้าเลือก mock user เป็นคนละส่วน—ข้อสรุปให้เอาออกหมายถึงหน้า mock user"
  },
  "US-S09-02": {
    "id": "US-S09-02",
    "title": "เมนูและข้อมูลตามสิทธิ์",
    "ac": [
      {
        "id": "AC-S09-02-01",
        "level": "R",
        "text": "**Given** Login จริงสำเร็จ **When** เปิดหน้าใช้งาน **Then** เมนูและรายละเอียดที่เข้าถึงได้สอดคล้องกับสิทธิ์ที่ได้รับจากระบบสิทธิ์"
      },
      {
        "id": "AC-S09-02-02",
        "level": "R",
        "text": "**Given** ผู้ใช้มี role `general` และผูกหน่วยงานแล้ว **When** เปิดรายการรถ **Then** เห็นเฉพาะรถภายในหน่วยงานของตน"
      },
      {
        "id": "AC-S09-02-03",
        "level": "R",
        "text": "**Given** ผู้ใช้มี role `admin-region` และผูกเขตแล้ว **When** เปิดรายการรถ **Then** เห็นเฉพาะรถภายในเขตของตน"
      },
      {
        "id": "AC-S09-02-04",
        "level": "R",
        "text": "**Given** ผู้ใช้มี role `admin-super` **When** เปิดรายการรถ **Then** เห็นรถทั้งหมดในขอบเขตระบบ"
      },
      {
        "id": "AC-S09-02-05",
        "level": "D",
        "text": "**Given** ผู้ใช้เข้า VMS+ ได้แต่ไม่มีสิทธิ์ Overhaul เช่นมีเพียง `vehicle-user` ตามตัวอย่างในบล็อก A.4 **When** เปิดเมนู **Then** ไม่แสดงเมนู “จัดการงาน Overhaul” โดยไม่ตีความว่าผู้ใช้ไม่มีสิทธิ์เข้า VMS+ ทั้งระบบ"
      },
      {
        "id": "AC-S09-02-06",
        "level": "D",
        "text": "**Given** ผู้ใช้ไม่มีสิทธิ์ Overhaul **When** เปิด URL Overhaul โดยตรง **Then** ไม่แสดงข้อมูลแผนหรือรถแม้บางส่วน และแจ้งว่าไม่มีสิทธิ์เข้าถึง"
      },
      {
        "id": "AC-S09-02-07",
        "level": "P",
        "text": "**Given** ผู้ใช้มีสิทธิ์เฉพาะหน่วยงาน/เขต **When** เปลี่ยน ID ใน URL หรือเรียกข้อมูลรถนอกขอบเขต **Then** ระบบปฏิเสธการเข้าถึงและไม่ส่งข้อมูลรถนั้นกลับ"
      }
    ],
    "context": "**User story:** ในฐานะเจ้าของรถ/ผู้ดูแลเขต/ผู้ดูแลส่วนกลาง ฉันต้องการเห็นเมนูและรถตามสิทธิ์ เพื่อทำงานกับข้อมูลในความรับผิดชอบ\n|---|---|---|\n**Dependency:** ต้องมีชุดข้อมูลผูกผู้ใช้→หน่วยงาน/เขต→รถ และ mapping role กับเมนูซ่อม/บำรุงรักษา/Overhaul ก่อน QA ตรวจรับ; บอร์ดยังไม่ได้ระบุสิทธิ์สร้าง/แก้ไข/ลบราย role จึงไม่อนุมานว่า role ที่อ่านได้จะแก้ไขได้"
  },
  "US-S09-03": {
    "id": "US-S09-03",
    "title": "Notification ตามเหตุการณ์ธุรกิจ",
    "ac": [
      {
        "id": "AC-S09-03-01",
        "level": "R",
        "text": "**Given** มีการนัดหมายรถเข้าอู่ **When** ส่งนัดหมายสำเร็จ **Then** สร้างการแจ้งเตือนถึงหน่วยงานต้นทางสำหรับรายการนัดหมายนั้น"
      },
      {
        "id": "AC-S09-03-02",
        "level": "R",
        "text": "**Given** หน่วยงานต้นทางได้รับนัดหมาย **When** ต้นทางยืนยันนัดหมายสำเร็จ **Then** สร้างการแจ้งเตือนถึง กบค. ว่าหน่วยงานต้นทางยืนยันแล้ว"
      },
      {
        "id": "AC-S09-03-03",
        "level": "R",
        "text": "**Given** มีงานตรวจรับรถ **When** ตรวจรับรถสำเร็จ **Then** สร้างการแจ้งเตือนถึงหน่วยงานต้นทางของรถนั้น"
      },
      {
        "id": "AC-S09-03-04",
        "level": "R",
        "text": "**Given** งานพร้อมยืนยันขั้นตอนที่ 7 **When** ยืนยันการส่งอนุมัติสำเร็จ **Then** สร้างการแจ้งเตือนปิดงานถึงหน่วยงานต้นทาง โดยไม่รอผู้อนุมัติ"
      },
      {
        "id": "AC-S09-03-05",
        "level": "R",
        "text": "**Given** เกิดเหตุการณ์ใดเหตุการณ์หนึ่งข้างต้นและทราบผู้รับ **When** ส่งแจ้งเตือน **Then** รองรับการส่งผ่าน VMS+, PEA Life และ Work-D ตามผู้รับที่เกี่ยวข้อง และใช้ SMS เฉพาะผู้รับ Vendor ที่มี `is_employee = false`"
      },
      {
        "id": "AC-S09-03-06",
        "level": "R",
        "text": "**Given** ผู้รับเป็นพนักงาน กฟภ. (`is_employee = true`) **When** เกิดเหตุการณ์แจ้งเตือน **Then** ไม่ส่ง SMS ให้ผู้รับรายนั้น"
      },
      {
        "id": "AC-S09-03-07",
        "level": "R",
        "text": "**Given** สร้าง notification ของ Overhaul **When** บันทึกแจ้งเตือน **Then** มี `notify_type` ให้แยกประเภทงาน Overhaul ออกจากประเภทงานอื่นได้; ค่าจริงและชื่อประเภทงานซ่อมใหญ่รอยืนยัน"
      },
      {
        "id": "AC-S09-03-08",
        "level": "P",
        "text": "**Given** การบันทึกขั้นตอนธุรกิจไม่สำเร็จ **When** ระบบตอบกลับว่าล้มเหลว **Then** ไม่สร้างแจ้งเตือนที่ระบุว่าขั้นตอนนั้นสำเร็จ"
      },
      {
        "id": "AC-S09-03-09",
        "level": "P",
        "text": "**Given** เหตุการณ์หนึ่งส่งไปบางช่องทางสำเร็จแต่บางช่องทางล้มเหลว **When** ตรวจสอบผลส่ง **Then** แยกผลรายช่องทางได้ และไม่เปลี่ยนผลธุรกิจที่บันทึกสำเร็จแล้วเป็นล้มเหลวเพียงเพราะการส่งแจ้งเตือนล้มเหลว; วิธี retry รอยืนยัน"
      }
    ],
    "context": "**User story:** ในฐานะหน่วยงานต้นทางและ กบค. ฉันต้องการรับแจ้งเตือนเมื่อขั้นตอนสำคัญสำเร็จ เพื่อทราบสถานะและดำเนินการต่อ\n**ช่องทางตามข้อสรุป [R]:** VMS+ (in-app), PEA Life, Work-D และ SMS โดยไม่รวม Firebase; SMS ส่งเฉพาะ Vendor ที่ `is_employee = false` ไม่ส่งให้พนักงาน กฟภ. ทั้งนี้ต้องยืนยัน mapping ผู้รับแต่ละช่องทางก่อนทดสอบครบวงจร\n|---|---|---|\n**ข้อความตามบอร์ด [R] — ตัวแปรต้องใช้ข้อมูลของรายการจริง:**\n| เหตุการณ์ | ข้อความ |\n|---|---|\n| นัดหมายรถเข้าอู่ | “นัดหมาย {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} สำเร็จ” |\n| ต้นทางยืนยันนัดหมาย | “หน่วยงาน {สังกัด} ของ {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} ยืนยันนัดหมายแล้ว” |\n| ตรวจรับรถสำเร็จ | “ยืนยันรับรถสำเร็จ” |\n| ยืนยันขั้นตอนที่ 7 | “ปิดงาน {ข้อมูลสำคัญ เช่นเลขแผนหรือ PO} เรียบร้อยแล้ว” |\n**รอยืนยัน:** จะใช้เลขแผน, PO, ทะเบียนรถ หรือหลายค่าร่วมกันในข้อความ; ผู้รับเป็นรายบุคคลหรือกลุ่มหน่วยงาน; แหล่ง EmployeeId ของ PEA Life; ผู้รับ Work-D; endpoint และสัญญาข้อมูลที่ใช้งานจริง; กรณี Vendor ไม่มีเบอร์หรือ `is_employee` ไม่ทราบค่า ไม่มีการถือว่าค่าว่างเท่ากับ false"
  },
  "US-S09-04": {
    "id": "US-S09-04",
    "title": "รายการแจ้งเตือนใน VMS+ และลิงก์รายละเอียด",
    "ac": [
      {
        "id": "AC-S09-04-01",
        "level": "R",
        "text": "**Given** มีข้อความที่ยังไม่อ่าน **When** แสดงไอคอนแจ้งเตือน **Then** แสดง badge dot สีเขียว"
      },
      {
        "id": "AC-S09-04-02",
        "level": "R",
        "text": "**Given** มีรายการแจ้งเตือน **When** เปิดรายการ **Then** รายการที่ยังไม่ได้กดมีพื้นหลังสีเทา และรายการที่กดอ่านแล้วมีพื้นหลังสีขาว"
      },
      {
        "id": "AC-S09-04-03",
        "level": "R",
        "text": "**Given** กำลังแสดงรายการแจ้งเตือน **When** กดรายการหนึ่ง **Then** เปิดหน้ารายละเอียดที่สัมพันธ์กับแจ้งเตือนนั้น เช่นรายละเอียด Overhaul หรือ PO โดยใช้ ID ใน URL เป็นพารามิเตอร์เพื่อดึงข้อมูล"
      },
      {
        "id": "AC-S09-04-04",
        "level": "R",
        "text": "**Given** กดอ่านรายการที่ยังไม่อ่าน **When** กลับมาดูรายการ **Then** รายการนั้นมีสถานะอ่านแล้ว และเมื่อไม่มีข้อความที่ยังไม่อ่าน badge dot หายไป"
      },
      {
        "id": "AC-S09-04-05",
        "level": "R",
        "text": "**Given** มีรายการแจ้งเตือน **When** กด “ล้างข้อความแจ้งเตือน” **Then** เคลียร์รายการแจ้งเตือนทั้งหมดของผู้ใช้และซ่อน badge dot"
      },
      {
        "id": "AC-S09-04-06",
        "level": "R",
        "text": "**Given** ไม่มีรายการแจ้งเตือนหรือถูกล้างแล้ว **When** เปิดรายการ **Then** แสดงสภาพรายการว่างและไม่มี badge dot"
      },
      {
        "id": "AC-S09-04-07",
        "level": "P",
        "text": "**Given** URL รายละเอียดมี ID ที่ถูกต้องและผู้ใช้มีสิทธิ์ **When** เปิด URL โดยตรงหรือ refresh หน้า **Then** โหลดรายละเอียดรายการเดิมได้โดยไม่อาศัยการคลิกมาจากหน้ารายการ"
      },
      {
        "id": "AC-S09-04-08",
        "level": "P",
        "text": "**Given** ปลายทางถูกลบ ไม่มีอยู่ หรือผู้รับไม่มีสิทธิ์ **When** กดแจ้งเตือน **Then** แจ้งว่าไม่สามารถเปิดรายละเอียดได้และไม่เปิดเผยข้อมูลที่ไม่มีสิทธิ์"
      }
    ],
    "context": "**User story:** ในฐานะผู้รับแจ้งเตือน ฉันต้องการแยกข้อความที่ยังไม่อ่าน เปิดรายการที่เกี่ยวข้อง และล้างรายการได้\n|---|---|---|\n**รอยืนยัน:** ล้างรายการหมายถึงซ่อนสำหรับผู้ใช้หรือลบข้อมูลจริง, การคงสถานะอ่าน/ล้างเมื่อ refresh หรือ Login ใหม่, สีวงขอบไอคอนและข้อความ empty state, ลิงก์ปลายทางของแจ้งเตือนแต่ละเหตุการณ์"
  },
  "US-S09-05": {
    "id": "US-S09-05",
    "title": "เตือนก่อนสิ้นสุดประกัน",
    "ac": [
      {
        "id": "AC-S09-05-01",
        "level": "R",
        "text": "**Given** รถมีวันสิ้นสุดประกัน **When** ถึงวันก่อนสิ้นสุดประกัน 30 วัน **Then** สร้างแจ้งเตือนล่วงหน้า 30 วันหนึ่งครั้งสำหรับรอบประกันนั้น"
      },
      {
        "id": "AC-S09-05-02",
        "level": "R",
        "text": "**Given** รถมีวันสิ้นสุดประกัน **When** ถึงวันก่อนสิ้นสุดประกัน 15 วัน **Then** สร้างแจ้งเตือนล่วงหน้า 15 วันหนึ่งครั้งสำหรับรอบประกันนั้น แม้เคยแจ้งที่ 30 วันแล้ว"
      },
      {
        "id": "AC-S09-05-03",
        "level": "R",
        "text": "**Given** เข้าเงื่อนไขเตือน **When** กำหนดผู้รับ **Then** แจ้งเจ้าของรถ กรย. และ กบค. ที่เกี่ยวข้องกับรถนั้น"
      },
      {
        "id": "AC-S09-05-04",
        "level": "R",
        "text": "**Given** สร้างแจ้งเตือนสิ้นสุดประกัน **When** แสดงข้อความ **Then** หัวข้อเป็น “แจ้งวันสิ้นสุดประกัน” และรายละเอียดเป็น “แจ้งวันสิ้นสุดประกัน วันที่ {วันสิ้นสุดประกัน} ของรถ {เลขทะเบียน} โปรดตรวจสอบความเรียบร้อย” โดยแทนค่าจริง"
      },
      {
        "id": "AC-S09-05-05",
        "level": "R",
        "text": "**Given** เคยสร้างแจ้งเตือนระยะ 30 หรือ 15 วันของรอบประกันนั้นแล้ว **When** กระบวนการตรวจสอบทำงานซ้ำ **Then** ไม่สร้างแจ้งเตือนระยะเดิมซ้ำ"
      },
      {
        "id": "AC-S09-05-06",
        "level": "P",
        "text": "**Given** รถไม่มีวันสิ้นสุดประกัน **When** ตรวจเงื่อนไขแจ้งเตือน **Then** ไม่คำนวณวันเตือนจากวันที่สมมติและไม่ใช้วันสิ้นสุด PO แทนโดยอัตโนมัติ"
      }
    ],
    "context": "**User story:** ในฐานะเจ้าของรถ กรย. และ กบค. ฉันต้องการรับแจ้งเตือนก่อนประกันงานซ่อมสิ้นสุด เพื่อมีเวลาตรวจสอบรถ\n**กติกาจากบอร์ด:** หัวข้อเดิมเขียน “ก่อนหมดสัญญา” แต่คำอธิบายระบุชัดให้นับจาก **วันสิ้นสุดประกัน** จึงใช้วันสิ้นสุดประกันเป็นฐานของ AC ชุดนี้ ไม่ใช้วันสิ้นสุดสัญญา PO\n|---|---|---|\n**ตัวอย่างตรวจรับ [P]:** หากวันสิ้นสุดประกันเป็น 31/12/2569 จะเข้าเงื่อนไข 30 วันในวันที่ 1/12/2569 และ 15 วันในวันที่ 16/12/2569 โดยเสนอให้นับวันปฏิทินตามเวลาไทย\n**รอยืนยัน:** ช่องทางแจ้งเตือนของประกัน (ไม่อนุมานว่าใช้ทุกช่องทางเช่นเดียวกับ 4 เหตุการณ์), เวลารันงาน, timezone, วิธีชดเชยเมื่อระบบหยุดทำงาน, การแจ้งย้อนหลังเมื่อเพิ่งบันทึกประกัน, การแก้วันสิ้นสุดประกันหลังเคยส่ง และเจ้าของรถหมายถึงผู้ใช้หรือผู้รับแทนหน่วยงานใด"
  },
  "US-S09-06": {
    "id": "US-S09-06",
    "title": "ปิดงานเมื่อยืนยันขั้นตอนที่ 7",
    "ac": [
      {
        "id": "AC-S09-06-01",
        "level": "D",
        "text": "**Given** งานพร้อมสำหรับขั้นตอนที่ 7 **When** เปิดหน้าสรุปก่อนส่ง **Then** แสดงข้อมูลผู้ซ่อม ยานพาหนะ ประกันงานซ่อม บันทึกติดตามงาน อะไหล่ และเอกสารที่บันทึกไว้ของงานนั้น"
      },
      {
        "id": "AC-S09-06-02",
        "level": "R",
        "text": "**Given** กบค. ทำขั้นตอนก่อนหน้าครบและข้อมูลพร้อม **When** ยืนยันการส่งอนุมัติขั้นตอนที่ 7 สำเร็จ **Then** งานเปลี่ยนเป็น “ปิดงานแล้ว” ทันที โดยไม่เข้าสู่กระบวนการรอผู้อนุมัติ"
      },
      {
        "id": "AC-S09-06-03",
        "level": "D",
        "text": "**Given** ยืนยันขั้นตอนที่ 7 สำเร็จ **When** แสดงผลหลังปิดงาน **Then** แสดงความคืบหน้า 100% และข้อความ “ปิดงาน {ข้อมูลสำคัญ เช่นเลขแผนหรือ Purchase Order} เรียบร้อยแล้ว”"
      },
      {
        "id": "AC-S09-06-04",
        "level": "R",
        "text": "**Given** ปิดงานจากขั้นตอนที่ 7 สำเร็จ **When** ดำเนินผลต่อเนื่อง **Then** แจ้งหน่วยงานต้นทางตาม AC-S09-03-04 โดยไม่ต้องมี action อนุมัติเพิ่ม"
      },
      {
        "id": "AC-S09-06-05",
        "level": "P",
        "text": "**Given** การยืนยันขั้นตอนที่ 7 บันทึกไม่สำเร็จ **When** ระบบแจ้งข้อผิดพลาด **Then** คงสถานะก่อนปิดงานและไม่แสดงข้อความปิดงานสำเร็จ"
      }
    ],
    "context": "**User story:** ในฐานะ กบค. ฉันต้องการยืนยันขั้นตอนสุดท้ายแล้วปิดงานได้ทันที เพื่อจบงานและแจ้งหน่วยงานต้นทาง\n|---|---|---|\n**ข้อขัดแย้งที่ต้องแก้:** หน้าจอ P.1 ยังแสดง “รอ ผบช. อนุมัติปิดงาน” และชื่อปุ่ม “ส่งอนุมัติ” แต่ข้อสรุปใหม่ให้ปิดงานทันที ต้องยืนยันชื่อปุ่ม/ชื่อขั้นตอนใหม่ ส่วน workflow ผู้อนุมัติไม่รวมในร่าง Sprint นี้ตามโน้ต “ตัดเรื่องของผู้อนุมัติไปก่อน”"
  },
  "US-S09-07": {
    "id": "US-S09-07",
    "title": "Dashboard รถที่ Overhaul [รอยืนยัน Sprint scope]",
    "ac": [
      {
        "id": "AC-S09-07-01",
        "level": "D",
        "text": "**Given** เข้าถึงหน้าได้ตามสิทธิ์ **When** เลือกแท็บ “รถที่ Overhaul” **Then** แสดงสรุปความคุ้มค่า ความคืบหน้า ประเภทรถ ยี่ห้อ และตารางรถ"
      },
      {
        "id": "AC-S09-07-02",
        "level": "D",
        "text": "**Given** มีข้อมูลรถ **When** ค้นหาทะเบียน/ยี่ห้อ/รุ่น หรือใช้ตัวกรอง **Then** ตารางแสดงรถที่ตรงเงื่อนไข; หน้าตัวกรองมี ยี่ห้อ รุ่นรถ ประเภทรถ อายุการใช้งาน เลขไมล์สะสม ค่า Overhaul เทียบราคารถ และสถานะงาน"
      },
      {
        "id": "AC-S09-07-03",
        "level": "D",
        "text": "**Given** ใช้ตัวกรองแล้ว **When** แสดงสรุป **Then** ความคุ้มค่า ความคืบหน้า และจำนวนตามประเภทรถอิงชุดรถตามตัวกรอง ส่วน “ยี่ห้อที่ Overhaul บ่อยที่สุด” อิงข้อมูลรวมตามข้อความกำกับและไม่เปลี่ยนตามตัวกรอง โดยยังต้องอยู่ภายในสิทธิ์ผู้ใช้"
      },
      {
        "id": "AC-S09-07-04",
        "level": "D",
        "text": "**Given** รถมีราคาซื้อใหม่ทดแทน 2,700,000 บาท และประเมิน Overhaul 250,000 บาท **When** แสดงส่วนต่างประมาณการ **Then** แสดง 2,450,000 บาท และแยกราคาซื้อเดิม 2,030,000 บาทเป็นอีกค่า ไม่ใช้ราคาซื้อเดิมแทนราคาซื้อใหม่"
      },
      {
        "id": "AC-S09-07-05",
        "level": "D",
        "text": "**Given** แสดงการ์ดความคุ้มค่า **When** ผู้ใช้อ่านผล **Then** มีคำอธิบายว่าเป็นประมาณการ ไม่ใช่ผลประหยัดจากค่าใช้จ่ายจริง และแสดงจำนวนรถที่มีราคาครบเทียบจำนวนรถทั้งหมดในชุดนั้น"
      },
      {
        "id": "AC-S09-07-06",
        "level": "D",
        "text": "**Given** รถบางคันไม่มีข้อมูลความคืบหน้า **When** คำนวณค่าเฉลี่ย **Then** ไม่นับค่าที่ขาดเป็น 0% และแสดงจำนวนรถที่มีข้อมูล จำนวนที่ถึง 100% และจำนวนที่ยังไม่มีข้อมูล"
      },
      {
        "id": "AC-S09-07-07",
        "level": "D",
        "text": "**Given** กรองแล้วเหลือรถที่มีความคืบหน้า 100% เพียงคันเดียว **When** แสดงสรุป **Then** ค่าเฉลี่ยเป็น 100% รถที่ถึง 100% เท่ากับ 1 และรถที่ยังไม่มีข้อมูลเท่ากับ 0"
      },
      {
        "id": "AC-S09-07-08",
        "level": "D",
        "text": "**Given** ไม่มีรถตรงเงื่อนไข **When** แสดงผล **Then** ตารางแสดง “ไม่พบรถตามตัวกรอง” มีคำแนะนำเปลี่ยนตัวกรอง สรุปราคา/ค่าเฉลี่ยแสดง “—” และจำนวนรถเป็น 0 โดยไม่ค้างค่าจากผลก่อนหน้า"
      }
    ],
    "context": "**User story:** ในฐานะผู้ดูแลงาน ฉันต้องการดูภาพรวมรถ ต้นทุนประมาณการ และความคืบหน้า เพื่อประกอบการติดตามและตัดสินใจ\nAC ทั้งชุดเป็น **[D] ตามหน้าจอ Scenario 15 / A.5–A.8** ยังไม่ถือว่า commit ส่งมอบใน Sprint 09\n|---|---|\n**รอยืนยัน:** สูตรเปอร์เซ็นต์และการปัดเศษ, กรณีราคาขาดบางคันจะรวมราคาจากชุดใด, ช่วงตัวกรอง/เงื่อนไขขอบเขตตัวเลข, “ข้อมูลรวม” รวมระดับใด, ชื่อสถานะงานที่ยังมี “รอ ผบช. อนุมัติปิดงาน” ต้องสอดคล้องกับ US-S09-06"
  },
  "US-S09-08": {
    "id": "US-S09-08",
    "title": "ราคาประมาณการรายคัน [รอยืนยัน Sprint scope]",
    "ac": [
      {
        "id": "AC-S09-08-01",
        "level": "D",
        "text": "**Given** เปิดรายละเอียดรถจากแผน **When** แสดงข้อมูลรถ **Then** แสดงราคาประมาณการซื้อใหม่ทดแทนและราคา Overhaul จากแบบประเมินรายคัน"
      },
      {
        "id": "AC-S09-08-02",
        "level": "D",
        "text": "**Given** ผู้ใช้มีสิทธิ์แก้ไขราคารายคัน **When** เปิดแก้ไขและบันทึกค่าที่ถูกต้อง **Then** บันทึกค่าให้รถที่เลือกและแสดง “แก้ไขราคารายคันสำเร็จ”"
      }
    ],
    "context": "**User story:** ในฐานะผู้จัดการแผน ฉันต้องการบันทึกราคาซื้อใหม่ทดแทนและราคา Overhaul รายคัน เพื่อใช้เปรียบเทียบประมาณการ\nAC ทั้งชุดเป็น **[D] ตามหน้าจอ B.9–B.12**; สิทธิ์แก้ไขจริงรอยืนยันตาม US-S09-02\n|---|---|\n**รอยืนยันก่อนเพิ่ม AC validation:** ราคาบังคับหรือไม่, 0 ได้หรือไม่, จำนวนทศนิยม/ค่าสูงสุด, ความสัมพันธ์ราคาประเมินกับค่าใช้จ่ายจริง, จังหวะอัปเดต Dashboard หลังแก้ไข ไม่ใช้ตัวเลขตัวอย่างในภาพเป็นขีดจำกัดธุรกิจ"
  },
  "US-S09-09": {
    "id": "US-S09-09",
    "title": "ข้อมูลอู่/ศูนย์บริการ [รอยืนยัน Sprint scope]",
    "ac": [
      {
        "id": "AC-S09-09-01",
        "level": "D",
        "text": "**Given** มีข้อมูลอู่ **When** เปิดรายการ **Then** แสดงรหัส ชื่อ ประเภท/ยี่ห้อที่รองรับ ที่ตั้ง เบอร์โทร และคะแนนเฉลี่ย"
      },
      {
        "id": "AC-S09-09-02",
        "level": "D",
        "text": "**Given** มีอู่ที่ตรงเงื่อนไข **When** ค้นหาชื่ออู่ จังหวัด หรือเบอร์โทร **Then** แสดงรายการที่ตรงคำค้น"
      },
      {
        "id": "AC-S09-09-03",
        "level": "D",
        "text": "**Given** ผู้ใช้มีสิทธิ์เพิ่มอู่ **When** กรอกชื่ออู่และบันทึก **Then** สร้างข้อมูลอู่ได้ โดยประเภท/ยี่ห้อที่รองรับ ที่อยู่ เบอร์โทร อีเมล พิกัด และเอกสารเป็นข้อมูล “ถ้ามี” ตามแบบฟอร์ม"
      },
      {
        "id": "AC-S09-09-04",
        "level": "D",
        "text": "**Given** แบบฟอร์มยังไม่มีชื่ออู่ **When** กดบันทึก **Then** ไม่สร้างรายการและแสดง “กรุณาระบุชื่ออู่/ศูนย์บริการ”"
      },
      {
        "id": "AC-S09-09-05",
        "level": "D",
        "text": "**Given** มีอู่เดิมและผู้ใช้มีสิทธิ์แก้ไข **When** แก้ข้อมูลแล้วบันทึกสำเร็จ **Then** ข้อมูลอู่เดิมเปลี่ยนตามที่บันทึกและแสดง “บันทึกข้อมูลอู่สำเร็จ”"
      },
      {
        "id": "AC-S09-09-06",
        "level": "D",
        "text": "**Given** อู่มีคะแนน **When** เปิดรายละเอียด **Then** แสดงคะแนนเฉลี่ยและจำนวนครั้ง; ถ้ายังไม่มีคะแนนแสดง “ยังไม่มีคะแนน” โดยไม่แสดงเป็น 0 คะแนน"
      },
      {
        "id": "AC-S09-09-07",
        "level": "D",
        "text": "**Given** อู่มีข้อมูลพิกัด **When** กด “นำทางด้วย Google Maps” **Then** เปิดการนำทางไปยังพิกัดของอู่นั้น"
      },
      {
        "id": "AC-S09-09-08",
        "level": "D",
        "text": "**Given** มี PO หรือเอกสารอ้างอิงของอู่ **When** เปิดรายละเอียด **Then** แสดงรายการที่สัมพันธ์กับอู่นั้น; ถ้าไม่มีแสดงสภาพไม่มีเอกสารอ้างอิง"
      },
      {
        "id": "AC-S09-09-09",
        "level": "D",
        "text": "**Given** ไม่มีข้อมูลอู่เลย **When** เปิดรายการ **Then** แสดง “ยังไม่มีอู่/ศูนย์บริการ”; ถ้ามีข้อมูลแต่ค้นไม่ตรงแสดง “ไม่พบอู่/ศูนย์บริการ” และแนะนำให้เปลี่ยนคำค้นหรือตัวกรอง"
      },
      {
        "id": "AC-S09-09-10",
        "level": "D",
        "text": "**Given** แนบเอกสารข้อมูลอู่ **When** เลือกไฟล์ **Then** รองรับ PDF/JPG และจำนวนสูงสุด 10 ไฟล์ตามข้อความในแบบฟอร์ม"
      }
    ],
    "context": "**User story:** ในฐานะผู้จัดการข้อมูลอู่ ฉันต้องการค้นหา เพิ่ม แก้ไข และดูข้อมูลอู่ เพื่อใช้อ้างอิงในการจัดการงาน Overhaul\nAC ทั้งชุดเป็น **[D] ตามหน้าจอ UC-6/18 A.1–A.11**; role ที่ดู/เพิ่ม/แก้ไขได้รอยืนยัน\n|---|---|\n**รอยืนยัน:** รายละเอียดตัวกรอง, ชื่ออู่ซ้ำ, validation เบอร์/อีเมล/พิกัด, ขนาดไฟล์สูงสุด, แหล่งคะแนนและสูตรเฉลี่ย, สิทธิ์เปิด PO, ข้อความ/การลองใหม่เมื่อโหลดไม่สำเร็จ (มีชื่อเฟรม A.11 แต่ยังไม่มีรายละเอียดพฤติกรรมเพียงพอ)"
  }
};
const SPRINT09_FRAME_MAP = [
  {
    "pattern": "(?:SSO|Login to your account).*(?:กรอกรหัสผิด|รหัสผิด)|SSO กรอกรหัสผิด",
    "story": "01",
    "ac": [
      "05"
    ]
  },
  {
    "pattern": "ไม่มีสิทธิ์เข้าใช้งานระบบ",
    "story": "01",
    "ac": [
      "06"
    ]
  },
  {
    "pattern": "SSO.*Login to your account",
    "story": "01",
    "ac": [
      "03"
    ]
  },
  {
    "pattern": "หน้าเข้าสู่ระบบ VMS|เข้าสู่ระบบ.*VMS|SP09 / เข้าสู่ระบบ|ทางเข้า.*Keycloak",
    "story": "01",
    "ac": [
      "01",
      "02",
      "03"
    ]
  },
  {
    "pattern": "เจ้าของรถ.*กรย|permission|สิทธิ์.*(?:general|admin)|(?:general|admin-region|admin-super).*สิทธิ์",
    "story": "02",
    "ac": [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07"
    ]
  },
  {
    "pattern": "(?:ก่อนหมด|สิ้นสุด|หมดอายุ|หมด).*ประกัน|แจ้งเตือนก่อนหมดสัญญา",
    "story": "05",
    "ac": [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06"
    ]
  },
  {
    "pattern": "(?:notification|แจ้งเตือน).*(?:ว่าง|ไม่มี)|(?:ว่าง|ไม่มี).*แจ้งเตือน",
    "story": "04",
    "ac": [
      "01",
      "06"
    ]
  },
  {
    "pattern": "ล้าง.*แจ้งเตือน",
    "story": "04",
    "ac": [
      "05",
      "06"
    ]
  },
  {
    "pattern": "(?:notification|แจ้งเตือน).*(?:อ่าน|รายการ|แผง)|แผงแจ้งเตือน|กระดิ่ง",
    "story": "04",
    "ac": [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08"
    ]
  },
  {
    "pattern": "ต้นทางยืนยันนัดหมาย|หน่วยงานยืนยันนัดหมาย",
    "story": "03",
    "ac": [
      "02",
      "05",
      "06",
      "07",
      "08",
      "09"
    ]
  },
  {
    "pattern": "นัดหมายรถเข้าอู่สำเร็จ|นัดเอารถเข้าอู่.*สำเร็จ",
    "story": "03",
    "ac": [
      "01",
      "05",
      "06",
      "07",
      "08",
      "09"
    ]
  },
  {
    "pattern": "ตรวจรับรถสำเร็จ",
    "story": "03",
    "ac": [
      "03",
      "05",
      "06",
      "07",
      "08",
      "09"
    ]
  },
  {
    "pattern": "(?:P\\.2|ยืนยันการส่งอนุมัติ|ปิดงานแล้ว|ส่งอนุมัติปิดงาน)",
    "story": "06",
    "ac": [
      "02",
      "03",
      "04",
      "05"
    ]
  },
  {
    "pattern": "P\\.1|สรุปก่อนส่งอนุมัติ|รอปิดงาน.*สรุป",
    "story": "06",
    "ac": [
      "01",
      "02",
      "04",
      "05"
    ]
  },
  {
    "pattern": "รถที่ Overhaul.*(?:ไม่พบ|ไม่มีข้อมูล)|ไม่พบรถตามตัวกรอง",
    "story": "07",
    "ac": [
      "03",
      "08"
    ]
  },
  {
    "pattern": "รถที่ Overhaul.*(?:ตัวกรอง|กรองรุ่น)",
    "story": "07",
    "ac": [
      "02",
      "03"
    ]
  },
  {
    "pattern": "รถที่ Overhaul|Dashboard.*ประมาณการ",
    "story": "07",
    "ac": [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08"
    ]
  },
  {
    "pattern": "B\\.9|รายละเอียดรถจากแผน",
    "story": "08",
    "ac": [
      "01"
    ]
  },
  {
    "pattern": "B\\.(?:10|11|12)|แก้ไขราคาประมาณการ|ราคารายคัน",
    "story": "08",
    "ac": [
      "01",
      "02"
    ]
  },
  {
    "pattern": "(?:อู่|ศูนย์บริการ).*(?:Validation|validation)|Validation.*(?:อู่|ศูนย์บริการ)",
    "story": "09",
    "ac": [
      "03",
      "04"
    ]
  },
  {
    "pattern": "(?:อู่|ศูนย์บริการ).*(?:ไม่มีข้อมูล|ค้นหาไม่พบ)|(?:ไม่มีข้อมูล|ค้นหาไม่พบ).*อู่",
    "story": "09",
    "ac": [
      "02",
      "09"
    ]
  },
  {
    "pattern": "(?:รายละเอียด.*(?:อู่|ศูนย์บริการ)|(?:อู่|ศูนย์บริการ).*รายละเอียด)",
    "story": "09",
    "ac": [
      "06",
      "07",
      "08"
    ]
  },
  {
    "pattern": "แก้ไข.*(?:อู่|ศูนย์บริการ)",
    "story": "09",
    "ac": [
      "05",
      "10"
    ]
  },
  {
    "pattern": "เพิ่ม.*(?:อู่|ศูนย์บริการ)",
    "story": "09",
    "ac": [
      "03",
      "04",
      "10"
    ]
  },
  {
    "pattern": "รายการ.*(?:อู่|ศูนย์บริการ)",
    "story": "09",
    "ac": [
      "01",
      "02",
      "06",
      "09"
    ]
  }
];
// END SPRINT09_AC

/* ---------- ทางเข้าจริงของปลั๊กอิน ---------- */
if (typeof figma !== 'undefined' && figma.showUI) {
  figma.showUI(__html__, { width: 420, height: 480 });

  const refreshInspection = FrameInspector.watch(figma, FrameBridge.readable);
  let bridgeWrite = Promise.resolve();
  const sendSaved = async () => {
    const records = await FrameBridge.list(figma);
    figma.ui.postMessage({type: 'saved-frames', records});
  };
  const sendSelection = () => {
    figma.ui.postMessage({ type: 'selection', names: figma.currentPage.selection.map((n) => n.name), sprint09: figma.currentPage.selection.filter(node => !isACLabel(node)).map(node => ({name: node.name, mapping: matchSprint09Frame(node.name)})) });
  };
  figma.on('selectionchange', sendSelection);

  figma.ui.onmessage = async (msg) => {
    if (msg.type === 'inspect-frame') { await refreshInspection(); return; }
    try {
      if (msg.type === 'bridge-save') {
        bridgeWrite = bridgeWrite.catch(() => {}).then(() => FrameBridge.save(figma, FrameInspector));
        const records = await bridgeWrite;
        figma.ui.postMessage({type: 'export-ac-source', records: await FrameBridge.list(figma)});
        await sendSaved();
        figma.ui.postMessage({type: 'result', ok: true, text: 'บันทึกข้อมูลแล้ว ' + records.length + ' frame — เปิด plugin เดียวกันใน FigJam แล้วกด “โหลดข้อมูลจาก Figma”'});
        return;
      }
      if (msg.type === 'bridge-load') { await sendSaved(); return; }
      if (msg.type === 'bridge-remove') {
        bridgeWrite = bridgeWrite.catch(() => {}).then(() => FrameBridge.remove(figma, msg.key));
        await bridgeWrite;
        await sendSaved();
        figma.ui.postMessage({type: 'result', ok: true, text: 'ลบข้อมูลที่บันทึกไว้แล้ว โดยไม่ลบ frame หรือ AC บน canvas'});
        return;
      }
      if (msg.type === 'bridge-paste') {
        bridgeWrite = bridgeWrite.catch(() => {}).then(() => pasteSavedFrame(msg.key));
        const result = await bridgeWrite;
        figma.ui.postMessage({type: 'result', ok: true, text: (result.updated ? 'อัปเดต AC เดิมแล้ว: ' : 'แปะ AC แล้ว: ') + result.frame + '\nข้อมูลจาก Figma บันทึกเมื่อ ' + result.capturedAt});
        return;
      }
      if (msg.type === 'sprint09-auto') {
        const page = figma.currentPage;
        const selected = Array.from(page.selection || []);
        const nodes = selected.filter(node => !isACLabel(node));
        const ignored = selected.length - nodes.length;
        if (!nodes.length) throw Error('เลือก frame หรือภาพหน้าจออย่างน้อย 1 ชิ้น (ไม่เลือกเฉพาะป้าย AC หรือข้อความ)');
        const jobs = nodes.map(node => ({node, mapping: matchSprint09Frame(node.name)}));
        bridgeWrite = bridgeWrite.catch(() => {}).then(async () => {
          let success = 0;
          let firstCreated = null;
          let legacyCount = 0;
          const skipped = [];
          const failed = [];
          for (const [index, {node, mapping}] of jobs.entries()) {
            figma.ui.postMessage({type: 'ac-progress', text: 'กำลังแปะ ' + (index + 1) + '/' + jobs.length + ': ' + node.name});
            if (!mapping) { skipped.push(node.name); continue; }
            try {
              const legacyStory = mapping.legacyFrameId && resolveFrameStory(node.name).story;
              const output = await annotateSprint09(mapping.storyId, mapping.acIds, node, page, legacyStory);
              if (!firstCreated) firstCreated = output;
              success++;
              if (mapping.legacyFrameId) legacyCount++;
            } catch (error) { failed.push(node.name + ': ' + (error.message || error)); }
          }
          if (firstCreated && figma.currentPage === page) {
            try { figma.viewport.scrollAndZoomIntoView([firstCreated.owner]); } catch (error) { /* Report still shows the creation result. */ }
          }
          const lines = ['แปะ / อัปเดต AC ตามเฟรมสำเร็จ ' + success + '/' + nodes.length + ' เฟรม'];
          if (success) lines.push('สร้างป้ายข้างเฟรมแล้ว — พาไปป้ายแรกให้แล้ว');
          if (typeof figma.notify === 'function') figma.notify('แปะ AC สำเร็จ ' + success + '/' + nodes.length + ' เฟรม', {error: success === 0});
          if (ignored) lines.push('ข้ามป้าย/ข้อความ ' + ignored + ' ชิ้น');
          if (legacyCount) lines.push('ใช้ AC Overhaul รายเฟรม ' + legacyCount + ' เฟรม');
          if (skipped.length) lines.push('ยังไม่มี mapping (' + skipped.length + '): ' + skipped.join(' · '));
          if (failed.length) lines.push('แปะไม่สำเร็จ (' + failed.length + '): ' + failed.join(' · '));
          figma.ui.postMessage({type: 'result', ok: success > 0 && failed.length === 0, text: lines.join('\n')});
        });
        await bridgeWrite;
        return;
      }
      if (msg.type === 'sprint09-annotate') {
        bridgeWrite = bridgeWrite.catch(() => {}).then(() => annotateSprint09(msg.storyId, msg.acIds));
        const result = await bridgeWrite;
        if (result.owner) figma.viewport.scrollAndZoomIntoView([result.owner]);
        figma.ui.postMessage({type: 'result', ok: true, text: (result.updated ? 'อัปเดต' : 'แปะ') + ' AC Sprint 09 ให้เฟรมที่เลือกแล้ว'});
        return;
      }
      if (msg.type === 'list') {
        figma.ui.postMessage({type: 'sprint09-stories', stories: SPRINT09_AC});
        figma.ui.postMessage({type: 'editor-mode', editor: figma.editorType || 'figjam'});
        figma.ui.postMessage({ type: 'flows', keys: Object.keys(USER_STORIES) });
        sendSelection();
      }
      if (msg.type === 'annotate-auto') {
        if (figma.editorType === 'figma') throw Error('ใน Figma ให้กด “บันทึกข้อมูลสำหรับ AC” แล้วเปิด plugin เดียวกันใน FigJam');
        const sel = figma.currentPage.selection;
        if (!sel.length) {
          figma.ui.postMessage({ type: 'result', ok: false, text: 'ยังไม่ได้เลือกเฟรมในหน้า — เลือกก่อนแล้วกดใหม่' });
          return;
        }
        let created = 0;
        const unmatched = [];
        const noContent = [];
        const allNodes = [];
        const allErrors = [];
        for (const node of sel) {
          const key = findFlowForNode(node.name);
          if (!key) { unmatched.push(node.name); continue; }
          if (!USER_STORIES[key]) { noContent.push(node.name + ' (' + key + ')'); continue; }
          try {
            const nodes = await annotateUserStory(node, key, msg.liveUI);
            if (nodes) {
              allNodes.push(...nodes);
              if (nodes.errors && nodes.errors.length) allErrors.push(...nodes.errors.map((e) => node.name + ' » ' + e));
            }
            created++;
          } catch (e) {
            allErrors.push(node.name + ' » ' + (e && e.message ? e.message : String(e)));
          }
        }
        if (allNodes.length) {
          try { figma.viewport.scrollAndZoomIntoView(allNodes); } catch (e) { /* ไม่ critical ถ้าเลื่อนจอไม่ได้ */ }
        }
        const lines = [];
        if (created) lines.push('แปะ user story แล้ว ' + created + ' เฟรม' + (allNodes.length ? ' — เลื่อนจอไปที่เนื้อหาใหม่ให้แล้ว' : ''));
        if (noContent.length) lines.push('จับคู่กลุ่มได้แต่ยังไม่มีเนื้อหา (รอใส่): ' + noContent.join(' · '));
        if (unmatched.length) lines.push('หาไม่เจอ ' + unmatched.length + ' เฟรม: ' + unmatched.join(' · ') + ' — เลือก flow เองจาก dropdown แทน');
        if (allErrors.length) lines.push('⚠️ พบปัญหา ' + allErrors.length + ' จุด: ' + allErrors.slice(0, 6).join(' · ') + (allErrors.length > 6 ? ' …' : ''));
        figma.ui.postMessage({ type: 'result', ok: created > 0 && allNodes.length > 0, text: lines.join('\n') || 'ไม่พบอะไรให้แปะ' });
      }
      if (msg.type === 'annotate') {
        if (figma.editorType === 'figma') throw Error('ใน Figma ให้บันทึกข้อมูลสำหรับ AC แล้วแปะใน FigJam');
        const sel = figma.currentPage.selection;
        if (!sel.length) {
          figma.ui.postMessage({ type: 'result', ok: false, text: 'ยังไม่ได้เลือกเฟรมในหน้า — เลือกก่อนแล้วกดใหม่' });
          return;
        }
        if (!msg.flow || !(msg.flow in USER_STORIES)) {
          figma.ui.postMessage({ type: 'result', ok: false, text: 'ยังไม่ได้เลือก flow จาก dropdown' });
          return;
        }
        if (!USER_STORIES[msg.flow]) {
          figma.ui.postMessage({ type: 'result', ok: false, text: 'flow นี้ยังไม่มีเนื้อหา (รอใส่จากไฟล์ 25)' });
          return;
        }
        let created = 0;
        const allNodes = [];
        const allErrors = [];
        for (const node of sel) {
          try {
            const nodes = await annotateUserStory(node, msg.flow, msg.liveUI);
            if (nodes) {
              allNodes.push(...nodes);
              if (nodes.errors && nodes.errors.length) allErrors.push(...nodes.errors.map((e) => node.name + ' » ' + e));
            }
            created++;
          } catch (e) {
            allErrors.push(node.name + ' » ' + (e && e.message ? e.message : String(e)));
          }
        }
        if (allNodes.length) {
          try { figma.viewport.scrollAndZoomIntoView(allNodes); } catch (e) { /* ไม่ critical ถ้าเลื่อนจอไม่ได้ */ }
        }
        const lines = [];
        lines.push('แปะ user story "' + msg.flow + '" แล้ว ' + created + ' เฟรม' + (allNodes.length ? ' — เลื่อนจอไปที่เนื้อหาใหม่ให้แล้ว' : ''));
        if (allErrors.length) lines.push('⚠️ พบปัญหา ' + allErrors.length + ' จุด: ' + allErrors.slice(0, 6).join(' · ') + (allErrors.length > 6 ? ' …' : ''));
        figma.ui.postMessage({ type: 'result', ok: allNodes.length > 0, text: lines.join('\n') });
      }
      if (msg.type === 'clear') {
        const total = clearTags(figma.currentPage);
        figma.ui.postMessage({ type: 'result', ok: true, text: 'ลบป้ายที่แปะไว้แล้ว ' + total + ' ป้าย' });
      }
    } catch (e) {
      // กันไม่ให้ UI เงียบสนิทเมื่อเกิด error ที่ไม่คาดคิดนอกเหนือจาก try/catch ย่อยด้านบน
      figma.ui.postMessage({ type: 'result', ok: false, text: '⚠️ เกิดข้อผิดพลาดไม่คาดคิด: ' + (e && e.message ? e.message : String(e)) });
    }
  };
}

/* ---------- export สำหรับเทสบน Node ---------- */
if (typeof module !== 'undefined') {
  module.exports = {
    matchSprint09Frame, SPRINT09_AC, sprint09Story, annotateSprint09, pasteSavedFrame, bridgeAnnotations, BRIDGE_PLACEMENT, resolveFrameStory, composeFrameStory, FRAME_STORIES, LETTER_TO_FLOW, USER_STORIES, frameLetter, findFlowForNode, annotateUserStory, clearTags, TAG_KEY,
    createLabelText, createBodyText, createBulletText, createGherkinBlock, createDataTable, renderSection,
    isStoryHeaderSection,
    splitScenarios, collectScenarios, extractQuotedStrings, extractActionQuotes, extractStateQuotes,
    readFrameTexts, matchScenarioByContent,
    extractFrameState, thaiBigrams, bigramOverlapRatio, pickScenarioByFrameName,
    buildContentConfirmationBullets, buildGherkinSectionForFrame, buildSectionsForFrame,
    rowOrBulletMatchesFrame, filterSectionByFrame, NON_FILTERABLE_LABELS,
  };
}
