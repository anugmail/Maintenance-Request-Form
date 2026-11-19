#!/usr/bin/env node
// Embed the shared reader into standalone Figma plugins (no require in Plugin API).
const fs = require('fs');
const path = require('path');
const source = fs.readFileSync(path.join(__dirname, 'plugin-lib/frame-inspector.js'), 'utf8');
for (const plugin of ['ac-annotator-plugin', 'figjam-userstory-plugin']) {
  const file = path.join(__dirname, plugin, 'code.js');
  let code = fs.readFileSync(file, 'utf8');
  const block = '// BEGIN FRAME_INSPECTOR\n' + source + '// END FRAME_INSPECTOR\n';
  if (code.includes('// BEGIN FRAME_INSPECTOR')) code = code.replace(/\/\/ BEGIN FRAME_INSPECTOR[\s\S]*?\/\/ END FRAME_INSPECTOR\n/, () => block);
  else code = block + code;
  fs.writeFileSync(file, code);
}

const bridge = fs.readFileSync(path.join(__dirname, 'plugin-lib/frame-bridge.js'), 'utf8');
const bridgePath = path.join(__dirname, 'figjam-userstory-plugin/code.js');
let combined = fs.readFileSync(bridgePath, 'utf8');
const bridgeBlock = '// BEGIN FRAME_BRIDGE\n' + bridge + '// END FRAME_BRIDGE\n';
if (combined.includes('// BEGIN FRAME_BRIDGE')) combined = combined.replace(/\/\/ BEGIN FRAME_BRIDGE[\s\S]*?\/\/ END FRAME_BRIDGE\n/, () => bridgeBlock);
else combined = bridgeBlock + combined;
fs.writeFileSync(bridgePath, combined);
