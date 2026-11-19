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
