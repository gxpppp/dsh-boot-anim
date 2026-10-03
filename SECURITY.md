# 安全策略

## 报告漏洞

请通过 GitHub 的 [私密漏洞报告](https://github.com/gxpppp/dsh-boot-anim/security/advisories/new) 提交，
**不要开公开 issue**。收到后会尽快确认并回复。

请尽量包含：复现步骤、影响范围、DSH 桌面版版本、以及可选的修复建议。

## 设计上的安全边界

本插件的安全姿态是刻意收窄的，理解这些边界有助于判断什么是真问题：

- **不监听端口**。插件不注册任何 HTTP 路由，只往 `webserver/index-inject` 的表里 push 两行数据。
- **不注入静态资源**。CSS 与 JS 都作为注入行的文本随行传递，因此不存在可被外部替换的资源 URL。
- **不加载任何外部代码**。注入的脚本是自包含的 IIFE，不 import、不 fetch、不 eval。
- **不写文件**。运行时只操作 DOM，不触碰磁盘。
- **不改动 DSH 自身**。不修改 `app.asar`、`resources/app/` 或任何前端源码；卸载脚本可完全回滚。
- **注入内容不含敏感数据**。CSS 与 JS 里没有凭证、路径或环境信息。

## 安装脚本会改动什么

`install.ps1` 是唯一会写盘的部分，它的改动范围是明确且可逆的：

1. 备份 `<profile>/package.json` 为 `package.json.bak-boot-anim`；
2. 在 `dependencies` 加一条 `link:` 依赖；
3. 在 `dsh.profile.bundles` 末尾追加本包名；
4. 在 `node_modules/@local/` 建一个 junction。

它**不**触碰 DSH 安装目录。写入 `package.json` 时强制使用 UTF-8 **无 BOM** 编码，并在写后回读头三字节自检——
BOM 会让 Node 的 `JSON.parse` 抛错、导致桌面版读不出 profile，因此这是硬性要求。

## 已知的信任边界

- 本插件运行在 DSH 前端的页面上下文内，与宿主注入的其他插件共享同一环境。这是 DSH 插件模型的固有属性，不是本插件的额外风险。
- `_verify/` 下的探针脚本会读取本机 DSH 安装路径与 profile，仅用于本地验证，不参与运行时。
