# MES (Mobile Element Selector)

文档语言：[한국어](README.md) · [English](README-en.md) · 中文 · [日本語](README-ja.md)

MES 是面向移动浏览器的高级 userscript，可直接选择网页元素并保存隐藏规则。它重点优化触控界面、选择器生成、规则管理、动态页面重新应用，以及隐私友好的检查工具。

[从 GitHub 安装](https://raw.githubusercontent.com/sampple-korea/MES/refs/heads/main/MES.min.js) · [源代码](https://github.com/sampple-korea/MES)

## 2.1.2

MES 2.1.2 防止仪表盘按钮在 iframe 内重复显示。保存的屏蔽规则和 DOM 监视仍会在 iframe 内运行，但可见按钮和面板只会在顶层页面创建。

## 2.1.1

MES 2.1.1 增加了 UI 语言切换，支持韩语、英语、中文、日语。默认语言仍为韩语，安装和更新继续使用 GitHub raw 的 `MES.min.js`。

## 主要功能

- 面向移动触控的元素选择器，支持上级/下级元素遍历
- 选择模式会抑制广告链接、iframe 和固定层的点击泄漏
- 保存前显示选择器质量、风险、匹配数量和预览
- 提供精确、相似模式、属性、类名、资源和高级广告模式候选选择器
- 保存规则搜索、复制、启用/停用、当前站点清理、备份、恢复
- 支持 open Shadow DOM 内部选择和 host 范围规则
- 动态页面自动重新应用，并提供低功耗模式
- 页面修改隐藏样式或规则 stylesheet 时可尝试恢复
- 可查看 HTML、计算 CSS、脚本线索、页面源码、Cookie、资源、诊断信息
- 隐私模式会默认遮蔽敏感 Cookie 和资源 URL 信息
- 支持紧凑选择面板、磁吸式面板对齐、手势启动、按钮启动和 tablets 布局
- 设置中支持韩语、英语、中文、日语 UI 切换

## 安装

使用 Tampermonkey、Violentmonkey 等 userscript 管理器打开以下地址：

```text
https://raw.githubusercontent.com/sampple-korea/MES/refs/heads/main/MES.min.js
```

更新也使用同一个 GitHub 地址。

## 基本使用

1. 安装脚本并打开目标网站。
2. 点击小型 MES 启动按钮。
3. 触摸想要隐藏的元素。
4. 调整上级/下级范围并预览效果。
5. 保存选择器规则。
6. 在列表和设置面板中管理保存的规则。

## 设置

| 设置项 | 默认值 | 说明 |
| --- | --- | --- |
| `uiLanguage` | ko | UI 语言：韩语、英语、中文、日语 |
| `observeDomChanges` | true | DOM 动态变化时重新应用规则 |
| `lowPowerMode` | false | 降低动态监控强度 |
| `shadowDomSupport` | true | 遍历 open Shadow DOM |
| `selectorHintMode` | true | 生成增强选择器提示 |
| `privacyMode` | true | 遮蔽敏感 Cookie 和资源 URL 信息 |
| `compactPickerMode` | true | 选择元素后自动切换为紧凑面板 |
| `hideToggleButton` | false | 使用手势启动代替按钮启动 |
| `hideStrategy` | stylesheet | 默认隐藏方式 |

## 开发

```bash
npm ci
npm test
```

`npm test` 会构建 minified 文件，执行语法检查、UI 噪声检查，并同时 smoke-test 源文件和压缩文件。
