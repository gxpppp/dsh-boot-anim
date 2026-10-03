# DSH 桌面版启动动画 + UI 入场过渡

SteamOS 风格的七段启动分镜，以及 DSH 桌面端 UI 的「由外向内、环环平移」入场过渡。

**零依赖、零源码改动、可一键还原。**

---

## 快速开始

````powershell
# 安装
powershell -ExecutionPolicy Bypass -File install.ps1

# 重启「DeepSeek Harness」桌面应用

# 还原
powershell -ExecutionPolicy Bypass -File uninstall.ps1
````

不想重启桌面版也能复现动画（无头 Chromium，跑的是同一份 CSS/JS）：

````powershell
powershell -ExecutionPolicy Bypass -File verify-headless.ps1
````

---

## 交付物

| 文档 | 内容 |
|---|---|
| [docs/01-方案检索清单.md](docs/01-方案检索清单.md) | 检索到的 SteamOS 参考、现成 Skill/提示词、技术实现参考，含来源链接与可直接抄用的数值 |
| [docs/02-UI入场动画技术对比.md](docs/02-UI入场动画技术对比.md) | 六种挂钩方式的技术对比与本机实测、不闪烁的硬约束、元素分组策略 |
| [docs/03-技术选型与实现.md](docs/03-技术选型与实现.md) | 技术选型理由、七段分镜的实现映射、改动文件清单 |
| [docs/04-验证结果.md](docs/04-验证结果.md) | 时序实测表、逐帧截图、断言结果、**未验证项的诚实标注** |

---

## 七段分镜

| # | 画面 | 实测时间窗 |
|---|---|---|
| ① | 黑屏 | 0 – ~0.5s |
| ② | 屏幕中央出现鲸鱼 | ~0.2 – ~0.9s |
| ③ | 转全黑，两条线由左右两侧向中间延伸 | ~0.95 – ~1.4s |
| ④ | 两线构筑成鲸鱼，并勾出与侧边栏图标一致的轮廓 | ~1.4 – ~2.15s |
| ⑤ | 中央横线向上下两侧展开，画面一分为二 | ~3.3 – ~4.2s |
| ⑥ | 展开同时鲸鱼缓缓消失，露出 DSH 默认白色底色/已装配皮肤 | ~3.45 – ~4.2s |
| ⑦ | UI 以由外向内、环环平移的方式入场 | ~4.3 – ~5.3s |
| | **总时长** | **≈ 5.6s** |

④ 收笔后会**停住等应用真正挂载**再揭幕（最多 9 秒），避免慢启动时「动画放完露空白」。

鲸鱼轮廓取自 `@deepseek-ai/dsh-client-ui-primitives` 的 `FISH_LOGO_PATH` 原文（3448 字符，4 条子路径，`viewBox="0 0 23.16 17.04"`），与侧边栏图标是**同一条 path**，不是重画。

---

## 文件结构

````
dsh-boot-anim/
├── package.json            插件包声明（dsh.bundle.patch）
├── cordis.patch.yml        loader patch：insert 进 desktop profile
├── install.ps1             安装（改 profile package.json + 建 junction）
├── uninstall.ps1           卸载
├── verify-headless.ps1     一键无头复现
├── lib/
│   ├── index.js            宿主半侧：订阅 webserver/index-inject
│   ├── boot-anim.css       舞台样式（作用域前缀，不碰应用类名）
│   └── boot-anim.js        前端半侧：七段分镜 + 三层波次（零依赖 IIFE）
├── docs/                   四份交付文档 + _verify 验证资产
├── _verify/                无头验收 harness 与逐帧截图
├── _extract/               app.asar 提取的只读参考（鲸鱼 path 等）
└── _tool/                  asar 读取工具（只读）
````

---

## 技术要点

**为什么是插件而不是改 asar**：DSH 桌面版运行时只加载 `app.asar`，`resources/app/` 是陈旧副本（改了不生效）；而重打包 121 MB 的 asar 会被每次自动更新覆盖。走 `webserver/index-inject` 插件通道既不动原始文件，也不会因更新失效 —— 桌面版虽然不把注入行渲染进 HTML，但会把同一张行表通过 IPC 交给页面，由前端解释执行。

**怎么在没有稳定类名的情况下动画 UI**：DSH 前端是 CSS Modules + 打包产物，没有可挂钩的类名。做法是从 `[data-shell-overlay]`（AppFrame 里唯一的语义锚点）拿到它的父节点 —— 就是三列 grid 容器 —— 再按 `getBoundingClientRect().left` 排序判定侧栏/中列/右栏。

**一个踩到的坑**：`[data-slot]` 锚点是 `display: contents`（无盒子、`getBoundingClientRect()` 返回全 0），拿它做动画目标会**静默失效**。实现里有 `collectBlocks()` 专门穿透这类中间层。

**终态皮肤适配**：幕布退场后舞台整体从 DOM 移除，露出的是真实 UI 本身，所以「露出的皮肤」在构造上就等于「已装配的皮肤」。颜色只从 `var(--dsw-alias-bg-base, #fff)` 取，不硬编码。

**安全网**：`prefers-reduced-motion` 直接跳过 / 用户任何输入即跳过 / `finally` 保证必 `teardown` / 20 秒兜底。

---

## 已验证 / 未验证

**已验证**（Chromium 154 无头，跑的是即将上线的同一份 CSS/JS）：

- 七段分镜顺序与时序（18 个采样点）
- 第四段鲸鱼轮廓可辨识、与侧边栏图标同一条 path
- 舞台自毁、无 DOM 残留、无标记残留、`html.overflow` 已还原、控制台零报错
- ⑦ 三层波次目标数 `{cols: 3, inner: 5, deeper: 2}`
- 宿主半侧单测：`apply()` 产出 2 行注入（`style` + `script`），CSS/JS 内容正确读入
- 安装/卸载往返：profile 的 `package.json` 正确改写与回滚，junction 正确建立与删除

**已安装到真实 desktop profile 并通过加载器验证**（2026-10-03 12:53）：25 个 bundle 全部被接受、0 跳过；真实 cordis 端到端 12/12 断言通过。详见 [docs/04](docs/04-验证结果.md) §7。

**未验证**（如实标注，不从等价验证外推）：

- 真实 DSH 桌面窗口中的最终观感 —— **已安装并待重启观察**；重启会终止本会话，故动画的肉眼确认需由你完成
- 真实桌面版的 IPC 往返时机 —— 同上
- 注入晚于 React 首次挂载的情形 —— 理论推断：舞台 `z-index` 极高且 `waitApp()` 会等 UI 就绪，最差是 UI 闪一帧后被覆盖

---

## 检索来源

完整清单见 [docs/01-方案检索清单.md](docs/01-方案检索清单.md)。核心来源：

- [mblode/agent-skills · ui-animation](https://github.com/mblode/agent-skills) —— 动效决策框架、choreography、SVG 线描（含 `pathLength` / `transform-box` / round cap 陷阱）
- [emilkowalski/skills · animate](https://github.com/emilkowalski/skills) —— `--ease-out: cubic-bezier(0.23,1,0.32,1)`、UI 动画 <300ms、禁止 ease-in
- [joepUI/motion-ref-skill](https://github.com/joepUI/motion-ref-skill) —— 13.7 横向滑入 + 13.5 stagger 配方
- [LottieFiles/motion-design-skill](https://github.com/LottieFiles/motion-design-skill) —— 时长表与 stagger 预算
- [Jake Archibald · Animated line drawing in SVG](https://jakearchibald.com/2013/animated-line-drawing-svg)
- [CSS-Tricks · How SVG Line Animation Works](https://css-tricks.com/svg-line-animation-works)
- [Christian Engvall · Electron white screen app startup](https://www.christianengvall.se/electron-white-screen-app-startup)
- Steam Deck 开机动画工程约束与官方文件元数据：见 docs/01 §0（本机 Steam 客户端实测）

---

## 许可

MIT
