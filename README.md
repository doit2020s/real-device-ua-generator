# 真实设备 UA 生成器

一个无需构建、打开即用的中文 User-Agent 生成页面。它基于官方版本资料维护 Chrome、Microsoft Edge、Safari、Windows、macOS、Android、iPhone 和 iPad 的常用真实组合。

## 功能

- 选择 Chrome、Edge 或 Safari。
- 选择 Windows、macOS、Android、iPhone、iPad。
- 按设备发布年份筛选真实设备名称与型号。
- 选择操作系统版本、发布日期、Windows Build 或 Android API Level。
- 生成现代精简 UA 或传统完整 UA。
- 为支持的平台生成 UA Client Hints。
- 随机生成组合，批量导出 JSON 或 CSV。
- 通过 window.UAGenerator 在其他 JavaScript 中调用。
- 可从 Google 和 Microsoft 官方接口临时刷新浏览器版本。

## 快速使用

### 直接打开

双击 index.html。页面不依赖 npm、数据库或后端服务。

### 本地 HTTP 服务

在项目目录运行：

~~~powershell
python -m http.server 8080
~~~

浏览器访问 http://localhost:8080。

使用本地 HTTP 服务时，剪贴板和部分浏览器安全 API 的兼容性通常比 file 协议更好。

## 页面操作

1. 选择浏览器。
2. 选择设备平台。
3. 选择设备年份和设备名称/型号。
4. 选择操作系统与浏览器版本。
5. 选择“现代真实 UA”或“传统完整 UA”。
6. 复制 UA，或切换至“批量生成”导出 JSON/CSV。

### 两种 UA 模式

| 模式 | 用途 | 特征 |
| --- | --- | --- |
| 现代真实 UA | 模拟当前浏览器默认上报行为 | Chrome/Edge 会冻结次版本、系统版本或 Android 型号；Safari 也会冻结部分 OS 信息 |
| 传统完整 UA | 兼容性测试、旧日志格式构造 | 尽可能保留浏览器完整版本、Android 型号和实际 OS 版本 |

现代浏览器的 UA 不一定包含用户在页面中选择的具体硬件：

- Windows 10 与 Windows 11 的传统 UA 都可能显示 Windows NT 10.0。
- macOS 上的浏览器可能报告冻结的 Mac OS X 版本。
- iPhone、iPad 和 Mac 的营销机型通常不会进入 UA。
- Android 的传统完整 UA 可以包含 Build.MODEL；现代精简 UA 通常只显示 K。
- iOS/iPadOS 上的第三方浏览器基于 WebKit，不提供 Chromium UA Client Hints。

## JavaScript API

页面加载后会暴露 window.UAGenerator。

~~~javascript
const result = UAGenerator.generate({
  browser: 'chrome',
  platform: 'android',
  deviceId: 'pixel-10-pro-xl',
  osId: 'android-16',
  version: '152.0.7977.42',
  mode: 'legacy'
});

console.log(result.ua);
console.log(result.clientHints);
console.log(result.config);
~~~

### 参数

| 参数 | 可选值/说明 |
| --- | --- |
| browser | chrome、edge、safari |
| platform | windows、macos、android、iphone、ipad |
| deviceId | UAGenerator.devices 中的设备 id |
| osId | UAGenerator.operatingSystems 中的系统 id |
| version | 浏览器完整版本字符串 |
| mode | reduced 或 legacy |

### 可读取的数据

~~~javascript
UAGenerator.devices;
UAGenerator.operatingSystems;
UAGenerator.browserVersions;
UAGenerator.verifiedAt;
~~~

## 项目结构

~~~text
.
├─ index.html                 单文件应用：HTML、CSS、数据与 JavaScript
├─ README.md                  使用文档
├─ CHANGELOG.md               版本变更记录
├─ docs/
│  └─ UPDATING.md             数据和版本更新方案
├─ scripts/
│  └─ validate.mjs            本地静态验证脚本
└─ .github/
   └─ workflows/
      └─ validate.yml         GitHub Actions 自动检查
~~~

## 验证

需要 Node.js 18 或更高版本：

~~~powershell
node scripts/validate.mjs
~~~

验证脚本会检查：

- index.html 是否存在且包含完整应用结构。
- 内联 JavaScript 是否能通过语法编译。
- UAGenerator、设备数据、操作系统数据和批量导出功能是否存在。
- 数据核验日期格式是否正确。

## 数据来源

- Google Chrome Version History API
- Microsoft Edge Update API 与 Stable Channel Release Notes
- Apple Security Releases 与 Safari Release Notes
- Android Developers 版本文档
- Microsoft Windows Release Health
- Apple、Google Pixel、Samsung 官方设备资料

页面内“数据来源与版本口径”区域提供可点击的官方链接。

## 更新与发布

完整维护流程见 [docs/UPDATING.md](docs/UPDATING.md)。

建议节奏：

- 每月：更新 Chrome、Edge、Safari 稳定版本。
- 每季度：补充设备与操作系统版本。
- 新设备发布后：核对名称、年份和 Android Build.MODEL。
- 浏览器 UA 规则改变时：立即更新生成模板并发布补丁。

版本号建议遵循 SemVer：

- PATCH：浏览器版本或数据勘误。
- MINOR：新增设备、平台、导出能力或兼容规则。
- MAJOR：JavaScript API 或导出结构不兼容变更。

## 使用边界

UA 是客户端声明字符串，不能证明请求来自对应真实设备。项目适用于网页兼容性测试、测试数据生成、日志分析和受控设备模拟，不应被用于绕过访问控制或冒充可信设备。

本仓库为私有仓库，未附带开源许可证；除仓库所有者明确授权外，不授予公开分发权。
