# Changelog

所有重要变更记录在此文件中。

## [1.1.0] - 2026-08-15

### Added

- 扩展 2022–2026 年设备目录，覆盖更多 Apple、Microsoft、Google、Samsung、Xiaomi、OnePlus、OPPO、vivo、iQOO、Honor、Huawei、Nothing、Sony、ASUS、Dell 与 Lenovo 型号。
- 新增设备品牌筛选，并在 JSON/CSV 配置中导出 `deviceBrand`。
- 新增零依赖本地服务、一键启动脚本和浏览器版本缓存更新脚本。

### Fixed

- 修复官方 Chrome/Edge 接口缺少 CORS 响应头导致“联网刷新版本”始终失败的问题。
- Chrome 与 Edge 改为独立刷新；单一来源失败不再导致全部刷新失败。
- 普通静态托管自动回退到本地核验缓存，直接打开文件时给出明确启动提示。

## [1.0.0] - 2026-08-15

### Added

- 首次发布单文件 UA 生成页面。
- Chrome、Microsoft Edge、Safari 浏览器选项。
- Windows、macOS、Android、iPhone、iPad 平台。
- 真实设备名称、型号、发布年份和系统版本联动选择。
- 现代精简 UA 与传统完整 UA 模式。
- Chromium UA Client Hints 输出。
- 随机组合、批量生成、JSON/CSV 导出。
- window.UAGenerator JavaScript API。
- Google Chrome 与 Microsoft Edge 官方接口联网刷新。
- 中文使用文档、更新方案和 GitHub Actions 静态验证。
