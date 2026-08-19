import fs from 'node:fs';
import vm from 'node:vm';

const file = new URL('../index.html', import.meta.url);
const html = fs.readFileSync(file, 'utf8');
const failures = [];
const root = new URL('../', import.meta.url);

function requireMatch(pattern, message) {
  if (!pattern.test(html)) failures.push(message);
}

requireMatch(/<!doctype html>/i, '缺少 HTML doctype');
requireMatch(/<meta[^>]+charset="utf-8"/i, '缺少 UTF-8 声明');
requireMatch(/真实设备 UA 生成器/, '缺少页面标题');
requireMatch(/window\.UAGenerator\s*=/, '缺少 window.UAGenerator API');
requireMatch(/var\s+devices\s*=\s*\[/, '缺少设备数据');
requireMatch(/var\s+osVersions\s*=\s*\[/, '缺少操作系统数据');
requireMatch(/var\s+browserVersions\s*=\s*\{/, '缺少浏览器版本数据');
requireMatch(/function\s+generateUA\s*\(/, '缺少 UA 生成函数');
requireMatch(/function\s+exportJSON\s*\(/, '缺少 JSON 导出');
requireMatch(/function\s+exportCSV\s*\(/, '缺少 CSV 导出');
requireMatch(/DATA_VERIFIED_AT\s*=\s*'\d{4}-\d{2}-\d{2}'/, '核验日期格式错误');
requireMatch(/id="deviceBrand"/, '缺少设备品牌筛选');
requireMatch(/fetch\('\.\/api\/browser-versions'/, '缺少同源浏览器版本接口');
requireMatch(/data-browser="huawei"/, '缺少华为浏览器选项');
requireMatch(/data-platform="harmonyos"/, '缺少 HarmonyOS 平台选项');
requireMatch(/Phone'; OpenHarmony|OpenHarmony '\s*\+\s*os\.ua/, '缺少 OpenHarmony UA 生成逻辑');
requireMatch(/ArkWeb\//, '缺少 ArkWeb UA 标识');
requireMatch(/HuaweiBrowser\//, '缺少 HuaweiBrowser UA 标识');
requireMatch(/harmonyUaType/, '缺少鸿蒙 UA 类型切换');

const scripts = Array.from(html.matchAll(/<script>([\s\S]*?)<\/script>/gi));
if (scripts.length !== 1) {
  failures.push('预期恰好一个内联 script，实际为 ' + scripts.length);
} else {
  try {
    new vm.Script(scripts[0][1], { filename: 'index.html:inline-script.js' });
  } catch (error) {
    failures.push('JavaScript 语法错误：' + error.message);
  }
}

const deviceRecords = (html.match(/\{\s*id:'[^']+',\s*platform:'(?:windows|macos|android|iphone|ipad|harmonyos)'/g) || []).length;
if (deviceRecords < 60) failures.push('设备/系统数据条目异常偏少：' + deviceRecords);
const recentDeviceRows = (html.match(/^\s*'[^']+\|(?:windows|macos|android|iphone|ipad|harmonyos)\|/gm) || []).length;
if (recentDeviceRows < 100) failures.push('近五年补充设备条目异常偏少：' + recentDeviceRows);
const harmonyDeviceRows = (html.match(/^\s*'[^']+\|harmonyos\|/gm) || []).length;
if (harmonyDeviceRows < 15) failures.push('鸿蒙设备条目异常偏少：' + harmonyDeviceRows);
const harmonyOsRecords = (html.match(/\{\s*id:'harmony-[^']+',\s*platform:'harmonyos'/g) || []).length;
if (harmonyOsRecords < 5) failures.push('鸿蒙系统档案异常偏少：' + harmonyOsRecords);

for (const relative of ['server.mjs', 'data/browser-versions.json', 'scripts/browser-data-lib.mjs', 'scripts/update-browser-data.mjs']) {
  if (!fs.existsSync(new URL(relative, root))) failures.push('缺少文件：' + relative);
}

try {
  const browserData = JSON.parse(fs.readFileSync(new URL('data/browser-versions.json', root), 'utf8'));
  for (const browser of ['chrome', 'edge', 'safari']) {
    if (!browserData.sources?.[browser]?.versions?.desktop?.length) failures.push('版本缓存缺少：' + browser);
  }
} catch (error) {
  failures.push('浏览器版本缓存无效：' + error.message);
}

if (failures.length) {
  console.error('验证失败：');
  failures.forEach((failure) => console.error('- ' + failure));
  process.exit(1);
}

console.log('验证通过');
console.log('- HTML 字节：' + Buffer.byteLength(html, 'utf8'));
console.log('- 内联脚本：1');
console.log('- 设备/系统条目（正则计数）：' + deviceRecords);
console.log('- 近五年补充设备：' + recentDeviceRows);
console.log('- 鸿蒙设备 / 系统档案：' + harmonyDeviceRows + ' / ' + harmonyOsRecords);
