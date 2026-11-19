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
