import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const inline = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(inline, '找不到页面内联脚本');

const cutoff = inline.indexOf('    function getCurrentResult()');
assert.ok(cutoff > 0, '无法定位生成器与界面逻辑边界');

const harness = inline.slice(0, cutoff) + `
    globalThis.__uaTestApi = { generateUA: generateUA, devices: devices, osVersions: osVersions };
  }());`;
const context = { console };
vm.createContext(context);
new vm.Script(harness, { filename: 'index.html:harmony-test-harness.js' }).runInContext(context);

const { generateUA } = context.__uaTestApi;
const base = {
  browser: 'huawei',
  platform: 'harmonyos',
  deviceId: 'harmony-pura80-ultra',
  osId: 'harmony-6-1-1',
  version: '6.1.6.310',
  harmonyUaType: 'huawei'
};

const standard = generateUA({ ...base, mode: 'reduced' });
assert.equal(standard.ua, 'Mozilla/5.0 (Phone; OpenHarmony 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36  ArkWeb/6.1.0.120 Mobile HuaweiBrowser/6.1.6.310');
assert.equal(standard.clientHints, null);
assert.equal(standard.config.chromeCompatibleVersion, '132.0.0.0');
assert.equal(standard.config.arkWebVersion, '6.1.0.120');

const compatible = generateUA({ ...base, mode: 'legacy' });
assert.match(compatible.ua, /\(Phone; OpenHarmony 6\.1; Android 10\)/);
assert.match(compatible.ua, /HuaweiBrowser\/6\.1\.6\.310$/);

const arkweb = generateUA({ ...base, mode: 'reduced', harmonyUaType: 'arkweb', version: '6.1.0.120' });
assert.match(arkweb.ua, /ArkWeb\/6\.1\.0\.120 Mobile$/);
assert.doesNotMatch(arkweb.ua, /HuaweiBrowser|Android 10/);

const tablet = generateUA({ ...base, deviceId: 'harmony-matepad-pro-132', mode: 'reduced' });
assert.match(tablet.ua, /^Mozilla\/5\.0 \(Tablet; OpenHarmony 6\.1\)/);
assert.doesNotMatch(tablet.ua, / Mobile(?: |$)/);

const pc = generateUA({ ...base, deviceId: 'harmony-matebook-pro', mode: 'reduced' });
assert.match(pc.ua, /^Mozilla\/5\.0 \(PC; OpenHarmony 6\.1\)/);
assert.doesNotMatch(pc.ua, / Mobile(?: |$)/);

console.log('鸿蒙 UA 测试通过');
console.log('- Phone 官方标准：' + standard.ua);
console.log('- Phone 浏览器兼容：' + compatible.ua);
console.log('- Tablet / PC 设备类型与 Mobile 规则正确');
