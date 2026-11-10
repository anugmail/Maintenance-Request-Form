// Read-only selection exporter. No server, credentials, or canvas mutations.
figma.showUI(__html__, { width: 520, height: 640, themeColors: true });
const FIELDS = ('x y width height visible opacity rotation layoutMode layoutSizingHorizontal layoutSizingVertical primaryAxisSizingMode counterAxisSizingMode primaryAxisAlignItems counterAxisAlignItems layoutWrap layoutPositioning layoutGrow layoutAlign paddingTop paddingRight paddingBottom paddingLeft itemSpacing counterAxisSpacing cornerRadius topLeftRadius topRightRadius bottomLeftRadius bottomRightRadius fills strokes strokeWeight strokeAlign effects constraints clipsContent boundVariables explicitVariableModes fillStyleId strokeStyleId effectStyleId textStyleId componentPropertyReferences variantProperties componentProperties componentPropertyDefinitions').split(' ');
function plain(value) {
  if (value === figma.mixed) return { mixed: true };
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}
function selection() {
  figma.ui.postMessage({ type: 'selection', nodes: figma.currentPage.selection.map(n => ({ id: n.id, name: n.name, type: n.type })) });
}
function listNodes() {
  const roots = figma.currentPage.selection.length ? Array.from(figma.currentPage.selection) : Array.from(figma.currentPage.children);
  const nodes = [], stack = roots.slice().reverse().map(n => ({ n, path: '' }));
  while (stack.length && nodes.length < 2500) {
    const { n, path } = stack.pop();
    const label = path ? path + ' / ' + n.name : n.name;
    nodes.push({ id: n.id, name: n.name, type: n.type, path: label, text: n.type === 'TEXT' ? n.characters : '', visible: n.visible });
    if ('children' in n) for (let i = n.children.length - 1; i >= 0; i--) stack.push({ n: n.children[i], path: label });
  }
  figma.ui.postMessage({ type: 'node-list', nodes, truncated: stack.length > 0 });
}
async function selectNodes(ids) {
  if (!Array.isArray(ids) || !ids.length || ids.some(id => typeof id !== 'string')) throw new Error('ไม่มี component ให้เลือก');
  const nodes = [];
  let page = null;
  for (const id of ids) {
    const n = await figma.getNodeByIdAsync(id);
    if (!n || n.removed || n.type === 'PAGE' || n.type === 'DOCUMENT') throw new Error('ไม่พบ layer นี้แล้ว กรุณาโหลดรายการใหม่');
    let owner = n.parent;
    while (owner && owner.type !== 'PAGE') owner = owner.parent;
    if (!owner) throw new Error('Layer นี้ไม่ได้อยู่บนหน้า Figma');
    if (page && page.id !== owner.id) throw new Error('เลือกหลาย layer ได้เฉพาะในหน้าเดียวกัน');
    page = owner; nodes.push(n);
  }
  if (figma.currentPage.id !== page.id) await figma.setCurrentPageAsync(page);
  figma.currentPage.selection = nodes;
  figma.viewport.scrollAndZoomIntoView(nodes);
  selection();
  figma.ui.postMessage({ type: 'selected', names: nodes.map(n => n.name) });
}
figma.on('selectionchange', selection);
let busy = false;
// Persist a baseline across plugin launches on this device, separately per file.
const baselineKey = 'maintain-d-review-v1:' + (figma.fileKey || (figma.root.id + ':' + figma.root.name));
function compareReferences(before, after) {
  const changes = [];
  function index(nodes) {
    const map = new Map();
    function visit(n, parent, position) {
      map.set(n.id, { node: n, parent, position });
      (n.children || []).forEach((child, i) => visit(child, n.id, i));
    }
    nodes.forEach((n, i) => visit(n, null, i));
    return map;
  }
  const old = index(before.nodes), current = index(after.nodes);
  for (const [id, record] of old) {
    if (!current.has(id)) changes.push({ kind: 'removed', id, name: record.node.name, parent: record.parent, position: record.position });
  }
  for (const [id, record] of current) {
    const prior = old.get(id), n = record.node;
    if (!prior) { changes.push({ kind: 'added', id, name: n.name, parent: record.parent, position: record.position }); continue; }
    if (prior.parent !== record.parent || prior.position !== record.position) changes.push({ kind: 'moved', id, name: n.name, before: { parent: prior.parent, position: prior.position }, after: { parent: record.parent, position: record.position } });
    for (const field of new Set([...Object.keys(prior.node), ...Object.keys(n)])) {
      if (field === 'children' || field === 'id') continue;
      if (JSON.stringify(prior.node[field]) !== JSON.stringify(n[field])) changes.push({ kind: 'changed', id, name: n.name, field, before: prior.node[field] === undefined ? null : prior.node[field], after: n[field] === undefined ? null : n[field] });
    }
  }
  for (const field of ['variables', 'styles', 'components']) {
    if (JSON.stringify(before[field]) !== JSON.stringify(after[field])) changes.push({ kind: 'resource-changed', field, before: before[field], after: after[field] });
  }
  return changes;
}
figma.ui.onmessage = async msg => {
  if (msg.type === 'ready') return selection();
  if (['list-nodes', 'select-node', 'select-baseline'].includes(msg.type)) {
    if (busy) return;
    try {
      if (msg.type === 'list-nodes') listNodes();
      if (msg.type === 'select-node') await selectNodes([msg.id]);
      if (msg.type === 'select-baseline') {
        const baseline = await figma.clientStorage.getAsync(baselineKey);
        if (!baseline) throw new Error('ยังไม่มีฉบับก่อนแก้ที่บันทึกไว้');
        await selectNodes(baseline.nodes.map(n => n.id));
      }
    } catch (e) { figma.ui.postMessage({ type: 'picker-error', message: String(e.message || e) }); }
    return;
  }
  if (msg.type !== 'extract' || busy) return;
  busy = true;
  try {
    const roots = Array.from(figma.currentPage.selection);
    if (!roots.length) throw new Error('เลือก component, instance หรือ frame ใน Figma ก่อน');
    const warnings = new Set(), variables = {}, styles = {}, components = {};
    const source = { file: figma.root.name, fileKey: figma.fileKey || null, page: figma.currentPage.name, pageId: figma.currentPage.id };
    let count = 0;
    async function resources(value) {
      if (!value || typeof value !== 'object') return;
      if (value.type === 'VARIABLE_ALIAS' && value.id && !Object.prototype.hasOwnProperty.call(variables, value.id)) {
        variables[value.id] = null;
        try {
          const v = await figma.variables.getVariableByIdAsync(value.id);
          if (v) {
            variables[value.id] = plain({ id: v.id, key: v.key, name: v.name, resolvedType: v.resolvedType, variableCollectionId: v.variableCollectionId, valuesByMode: v.valuesByMode });
            const collection = await figma.variables.getVariableCollectionByIdAsync(v.variableCollectionId);
            if (collection) variables[value.id].collection = plain({ name: collection.name, modes: collection.modes, defaultModeId: collection.defaultModeId });
            await resources(variables[value.id].valuesByMode);
          } else warnings.add('Variable unavailable: ' + value.id);
        } catch (e) { warnings.add('Variable unavailable: ' + value.id); }
      }
      for (const k of Object.keys(value)) await resources(value[k]);
    }
    async function walk(n, depth) {
      if (count >= 2500 || depth > 30) {
        warnings.add('Export truncated: maximum 2500 nodes / depth 30. Select a smaller component.');
        return { id: n.id, name: n.name, type: n.type, truncated: true };
      }
      count++;
      if (count % 100 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      const out = { id: n.id, name: n.name, type: n.type };
      for (const field of FIELDS) {
        try { if (field in n) out[field] = plain(n[field]); }
        catch (e) { warnings.add(n.id + ': cannot read ' + field); }
      }
      if (n.type === 'TEXT') {
        out.characters = n.characters;
        try { out.textSegments = plain(n.getStyledTextSegments(['fontName', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'fills', 'textStyleId', 'textDecoration', 'textCase'])); }
        catch (e) { warnings.add(n.id + ': text segments unavailable'); }
        out.textAlignHorizontal = n.textAlignHorizontal;
        out.textAlignVertical = n.textAlignVertical;
        out.textAutoResize = n.textAutoResize;
      }
      if (n.type === 'COMPONENT' || n.type === 'COMPONENT_SET') out.key = n.key;
      if (n.type === 'INSTANCE') {
        try {
          const main = await n.getMainComponentAsync();
          if (main) {
            const set = main.parent && main.parent.type === 'COMPONENT_SET' ? main.parent : null;
            out.mainComponent = plain({ id: main.id, key: main.key, name: main.name, remote: main.remote, set: set ? { id: set.id, key: set.key, name: set.name } : null });
            if (!components[main.key]) components[main.key] = plain({ ...out.mainComponent, variantProperties: main.variantProperties, propertyDefinitions: set ? set.componentPropertyDefinitions : main.componentPropertyDefinitions });
          } else warnings.add(n.id + ': main component unavailable');
        } catch (e) { warnings.add(n.id + ': main component unavailable'); }
      }
      await resources(out);
      for (const field of ['fillStyleId', 'strokeStyleId', 'effectStyleId', 'textStyleId']) {
        const id = out[field];
        if (typeof id !== 'string' || !id || Object.prototype.hasOwnProperty.call(styles, id)) continue;
        styles[id] = null;
        try { const s = await figma.getStyleByIdAsync(id); if (s) styles[id] = { id: s.id, key: s.key, name: s.name, type: s.type }; }
        catch (e) { warnings.add('Style unavailable: ' + id); }
      }
      if ('children' in n) {
        out.children = [];
        for (const child of n.children) {
          if (count >= 2500) { warnings.add('Export truncated: maximum 2500 nodes. Select a smaller component.'); out.childrenTruncated = true; break; }
          out.children.push(await walk(child, depth + 1));
        }
      }
      return out;
    }
    const nodes = [];
    for (const n of roots) nodes.push(await walk(n, 0));
    const snapshot = { schema: 'maintain-d/component-reference/v1', exportedAt: new Date().toISOString(), source, nodeCount: count, nodes, components, variables, styles, warnings: Array.from(warnings), limitations: ['Reference data only; not an importable canvas clone.', 'Vector paths, image bytes, and prototype interactions are not included.', 'Only selected subtrees and metadata of referenced main components are included; other variants are not automatically exported.'] };
    let result = snapshot;
    if (msg.mode === 'baseline') {
      if (snapshot.warnings.some(w => /truncated/.test(w))) throw new Error('ต้นฉบับถูกตัด เลือก frame เล็กลงก่อนบันทึก');
      await figma.clientStorage.setAsync(baselineKey, snapshot);
    }
    if (msg.mode === 'review') {
      const baseline = await figma.clientStorage.getAsync(baselineKey);
      if (!baseline) throw new Error('ยังไม่มีฉบับก่อนแก้ กดบันทึกก่อน AI ส่งรีวิว หรือใช้ “อ่านฉบับแก้แล้ว” เพื่อศึกษาเฉพาะผลลัพธ์');
      if (baseline.nodes.length !== snapshot.nodes.length || baseline.nodes.some((n, i) => n.id !== snapshot.nodes[i].id)) throw new Error('กรุณาเลือก frame เดิมและลำดับเดิมที่บันทึกก่อนแก้ เพื่อเทียบด้วย node ID ได้ถูกต้อง');
      if (snapshot.warnings.some(w => /truncated/.test(w))) throw new Error('ฉบับแก้ถูกตัด เลือก frame เล็กลงและเก็บก่อน–หลังใหม่');
      result = { schema: 'maintain-d/review-learning/v1', baseline, reviewed: snapshot, changes: compareReferences(baseline, snapshot), matching: 'node-id; replaced nodes appear as removed and added', reviewStatus: 'captured-after-human-edit; rules-require-human-review' };
    }
    figma.ui.postMessage({ type: 'result', mode: msg.mode || 'reference', data: result });
  } catch (e) { figma.ui.postMessage({ type: 'error', message: String(e.message || e) }); }
  finally { busy = false; }
};
