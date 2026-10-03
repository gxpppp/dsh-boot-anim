# Changelog

本项目的所有重要变更都记录在此文件。
格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2026-10-03

首个版本。

### 新增

- **启动动画**：SteamOS 风格七段分镜，总时长约 5.6 秒
  - ① 黑屏 → ② 屏幕中央出现鲸鱼 → ③ 双线由左右两侧向中间延伸 → ④ 两线构筑成鲸鱼并勾出轮廓 → ⑤ 中央横线向上下两侧展开、画面一分为二 → ⑥ 展开同时鲸鱼淡出、露出默认白底/已装配皮肤 → ⑦ UI 由外向内环环平移入场
  - 鲸鱼轮廓逐字节取自 `@deepseek-ai/dsh-client-ui-primitives` 的 `FISH_LOGO_PATH`，与侧边栏图标是同一条 path
- **UI 入场过渡**：三段波次（外层三列 → 列内主块 → 主块内内容块），由外向内平移
- **状态闸门**：分镜 ④ 收笔后等待应用真正挂载（最长期 9 秒）再揭幕
- **安全网**：`prefers-reduced-motion` 跳过 / 用户输入即跳过 / `finally` 保证清理 / 20 秒兜底定时器
- 安装与卸载脚本，改动可一键回滚
- 无头验收工具链（`_verify/`）与四份交付文档（`docs/`）

### 说明

- 零运行时依赖：只用 CSS3 / SVG / Web Animations API
- 零源码改动：不触碰 `app.asar`、`resources/app/` 或任何前端源码
- 经 DSH 自带的 `webserver/index-inject` 通道注入 2 行（`style` + `script`）

[1.0.0]: https://github.com/gxpppp/dsh-boot-anim/releases/tag/v1.0.0
