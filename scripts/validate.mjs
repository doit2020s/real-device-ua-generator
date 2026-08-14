import fs from 'node:fs';
import vm from 'node:vm';

const file = new URL('../index.html', import.meta.url);
const html = fs.readFileSync(file, 'utf8');
const failures = [];

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

const deviceRecords = (html.match(/\{\s*id:'[^']+',\s*platform:'(?:windows|macos|android|iphone|ipad)'/g) || []).length;
if (deviceRecords < 60) failures.push('设备/系统数据条目异常偏少：' + deviceRecords);

if (failures.length) {
  console.error('验证失败：');
  failures.forEach((failure) => console.error('- ' + failure));
  process.exit(1);
}

console.log('验证通过');
console.log('- HTML 字节：' + Buffer.byteLength(html, 'utf8'));
console.log('- 内联脚本：1');
console.log('- 设备/系统条目（正则计数）：' + deviceRecords);
