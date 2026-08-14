# 数据与版本更新方案

本文档定义浏览器版本、设备目录、操作系统数据和 UA 模板的维护流程。

## 1. 更新原则

1. 优先使用浏览器厂商或操作系统厂商的官方资料。
2. 不把 Beta、Dev、Canary 或未经发布的型号标记为“当前稳定”。
3. 设备营销名称与 Android Build.MODEL 分开维护。
4. 页面选择的真实设备不等于 UA 一定会暴露该设备。
5. 每次更新必须同时修改数据核验日期并运行验证。
6. 无法确认的数据宁可暂不加入，也不使用推测值。

## 2. 官方资料清单

### 浏览器

- Chrome Version History API：
  https://versionhistory.googleapis.com/v1/chrome/platforms/win/channels/stable/versions
- Chrome Releases：
  https://chromereleases.googleblog.com/
- Edge Update API：
  https://edgeupdates.microsoft.com/api/products?view=enterprise
- Edge Stable Release Notes：
  https://learn.microsoft.com/deployedge/microsoft-edge-relnote-stable-channel
- Safari Release Notes：
  https://developer.apple.com/documentation/safari-release-notes
- Apple Security Releases：
  https://support.apple.com/100100

### 操作系统

- Android Releases：
  https://developer.android.com/about/versions
- Windows 11 Release Information：
  https://learn.microsoft.com/windows/release-health/windows11-release-information
- Apple 系统版本：
  https://support.apple.com/109033

### 设备

- Apple 设备识别：
  https://support.apple.com/108044
- Pixel Hardware Specs：
  https://support.google.com/pixelphone/answer/7158570
- Samsung 官方产品页：
  https://www.samsung.com/smartphones/

## 3. 每月浏览器版本更新

在 index.html 中找到 browserVersions。

### Chrome

分别核对：

- win
- mac
- android
- ios

每个平台保留最近约 6–8 个稳定主版本，每个主版本保留官方接口返回的最新补丁版本。

### Edge

从 Edge Update API 的 Stable 产品中取最新版本。桌面版本以官方 API 为准；移动端如无结构化接口，需再核对 Edge 安全更新说明，不能直接假设版本完全一致。

### Safari

从 Apple Security Releases 和 Safari Release Notes 交叉核对：

- 最新稳定 Safari 版本
- 适用 macOS 范围
- 同期 iOS/iPadOS 版本
- 是否有 User-Agent 冻结规则变化

### 核验日期

修改 index.html 中：

~~~javascript
var DATA_VERIFIED_AT = 'YYYY-MM-DD';
~~~

并同步更新页面中的默认核验标签和数据来源说明。

## 4. 操作系统更新

在 index.html 中找到 osVersions。

每条数据至少包含：

- id：稳定、不可重复的内部标识。
- platform：所属平台。
- name：用户看到的完整名称。
- version：系统版本。
- year：该具体版本的发布年份。
- date：官方发布日期。
- build 或 api：Windows Build、Apple 版本/构建信息或 Android API。
- ua：传统 UA 中使用的版本格式。
- ch：UA Client Hints 的 platformVersion。
- timeline：设备兼容性初筛时间线。

Windows 需要注意：

- 传统 UA 无法可靠区分 Windows 10/11。
- UA Client Hints platformVersion 不是 Windows OS Build。
- platformVersion 应依据 Chromium 的 Windows UniversalApiContract 实现核对。

Apple 需要注意：

- iOS 26+ Safari 会冻结 UA 中的 OS 版本。
- iPadOS Safari 默认桌面模式可能与 macOS UA 相同。
- Chrome/Edge on iOS 的 token 分别为 CriOS、EdgiOS。

Android 需要注意：

- 现代 Chromium UA Reduction 通常使用 Android 10; K。
- 真实 OS 与型号应通过高熵 Client Hints 请求，且浏览器可能拒绝返回。

## 5. 新设备更新

在 index.html 中找到 devices。

每条设备至少包含：

- id
- platform
- name
- variant
- year
- arch
- bitness
- uaModel

对于 Android：

- name 使用厂商营销名称。
- variant 可记录全球版或代表性型号代码。
- uaModel 必须尽量对应 Android Build.MODEL。
- 同一设备地区型号差异较大时，应增加独立条目或明确标注代表性 SKU。

对于 Apple、Mac 和 Windows：

- 保存真实设备名称和年份用于配置与导出。
- 不把营销机型强行插入标准 UA。

## 6. UA 模板更新

在 generateUA 函数中维护生成规则。

修改前需核对：

- Chrome UA Reduction 文档。
- Edge 的 Edg、EdgA、EdgiOS token。
- Safari/WebKit release notes。
- Chrome on iOS 的 CriOS token。
- 移动端 Mobile token 与平板行为。
- UA Client Hints 支持范围。

任何模板更新至少验证以下组合：

1. Chrome + Windows，reduced/legacy。
2. Chrome + Android 手机和平板。
3. Chrome + iPhone/iPad。
4. Edge + Windows/macOS/Android/iOS。
5. Safari + macOS/iPhone/iPad。
6. 新设备配旧系统时的兼容性警告。

## 7. 本地验证

~~~powershell
node scripts/validate.mjs
python -m http.server 8080
~~~

在桌面和窄屏浏览器中检查：

- 页面无横向滚动。
- 所有下拉框都能联动。
- Safari 不出现 Windows/Android 平台。
- 复制、随机、批量生成和 JSON/CSV 导出正常。
- iOS/iPadOS 不错误显示 Chromium UA Client Hints。

## 8. Git 分支与发布

推荐流程：

~~~powershell
git switch -c update/browser-data-YYYY-MM
git add index.html CHANGELOG.md
git commit -m "data: refresh browser versions for YYYY-MM"
git push -u origin update/browser-data-YYYY-MM
~~~

检查完成后合并到 main。

版本策略：

- 数据刷新/勘误：1.0.x
- 新设备、新平台或新功能：1.x.0
- API/导出格式不兼容：x.0.0

发布前清单：

- [ ] 官方来源已核对。
- [ ] DATA_VERIFIED_AT 已更新。
- [ ] README 中的当前版本说明已同步。
- [ ] CHANGELOG 已记录。
- [ ] node scripts/validate.mjs 通过。
- [ ] 桌面与移动布局已检查。
- [ ] git diff 不含日志、令牌或本机路径。
- [ ] GitHub Actions 通过。
