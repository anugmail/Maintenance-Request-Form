#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const html = fs.readFileSync(require('path').join(__dirname, 'figjam-userstory-plugin/ui.html'), 'utf8');
class Element {
  constructor(id) {this.id = id; this.value = ''; this.children = []; this.disabled = false; this.checked = true; this.style = {};}
  replaceChildren() {this.children = []; this.value = '';}
  appendChild(child) {this.children.push(child); if (!this.value) this.value = child.value;}
  focus() {}
  select() {}
}
const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(match => [match[1], new Element(match[1])]));
const sent = [];
const context = vm.createContext({
  window: {}, parent: {postMessage: message => sent.push(message.pluginMessage)}, navigator: {},
  document: {getElementById: id => elements.get(id), createElement: tag => new Element(tag), execCommand: () => true},
});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
const receive = message => context.window.onmessage({data: {pluginMessage: message}});
assert.strictEqual(sent[0].type, 'list');
receive({type: 'editor-mode', editor: 'figma'});
assert.strictEqual(elements.get('design-tools').hidden, false);
assert.strictEqual(elements.get('figjam-tools').hidden, true);
elements.get('btn-save').onclick();
assert.strictEqual(sent[sent.length - 1].type, 'bridge-save');
assert.strictEqual(elements.get('btn-save').disabled, true);
receive({type: 'result', ok: false, text: 'storage failed'});
assert.strictEqual(elements.get('btn-save').disabled, false);
assert.strictEqual(elements.get('result').textContent, 'storage failed');
receive({type: 'editor-mode', editor: 'figjam'});
assert.strictEqual(elements.get('design-tools').hidden, true);
assert.strictEqual(elements.get('figjam-tools').hidden, false);
elements.get('btn-load').onclick();
assert.strictEqual(sent[sent.length - 1].type, 'bridge-load');
const record = {key: 'source/1:1', capturedAt: '2026-10-28T01:00:00Z', source: {fileName: 'Maintain-D', pageName: 'Design'}, frame: {name: '<img src=x onerror=alert(1)>', components: []}};
receive({type: 'saved-frames', records: [record]});
assert.strictEqual(elements.get('btn-paste').disabled, false);
assert.ok(elements.get('saved-info').textContent.includes('Maintain-D'));
assert.ok(elements.get('saved-frames').children[0].textContent.includes('<img'));
assert.strictEqual(elements.get('saved-frames').children[0].innerHTML, undefined, 'saved names must be plain text');
elements.get('btn-paste').onclick();
assert.strictEqual(sent[sent.length - 1].type, 'bridge-paste');
assert.strictEqual(sent[sent.length - 1].key, record.key);
assert.strictEqual(elements.get('btn-paste').disabled, true);
receive({type: 'result', ok: true, text: 'updated'});
assert.strictEqual(elements.get('btn-paste').disabled, false);
receive({type: 'saved-frames', records: []});
assert.strictEqual(elements.get('btn-paste').disabled, true);
assert.strictEqual(elements.get('btn-remove-saved').disabled, true);
console.log('PASS: editor mode, save/load/paste routing, busy/error recovery and safe source names');
