# 贡献指南

欢迎提交 issue 和 PR。本插件体量小，规则也少，但有几条是硬的。

## 关于 git 传输

本机环境下 `github.com` 的 HTTPS 走代理时 TLS 握手常被掐断（实测成功率约 1/10，
而 `api.github.com` 是 10/10），因此本仓库的 origin 使用 **SSH**：

```
git@github.com:gxpppp/dsh-boot-anim.git
```

若你也在类似网络下，建议同样走 SSH；`ssh.github.com:443` 亦可作为 22 端口被封时的备选。

## 提交前

@@```bash
node --check lib/index.js && node --check lib/boot-anim.js
node _verify/test-host.mjs
node _verify/check-structure.mjs
```@@

CI 会跑同样三步。本地过了再提。

## 改动画时的规矩

**数值不许凭手感编。** 曲线和时长都收在 @@lib/boot-anim.js@@ 顶部的 @@T@@ 表里，
每一项都注明出处（见 [README 的动效令牌](README.md#动效令牌)）。
要改就改那张表，并在 PR 里说明依据——「感觉这样更顺」不是依据。

**只动 @@transform@@ 与 @@opacity@@。** 这两个属性在合成层，不触发布局与重绘。
动 @@width@@ / @@height@@ / @@top@@ / @@left@@ 会让每帧重算布局，一律不接受。

**进场用 ease-out，不用 ease-in。** ease-in 起步慢，正好拖慢用户最关注的那一刻。

**别碰鲸鱼 path。** @@lib/boot-anim.js@@ 里的 @@WHALE@@ 常量是上游图标的逐字节副本，
CI 会拿它跟 @@_verify/fish-logo-path.txt@@ 对账。图标真变了，两个文件一起改。

## 改 UI 入场时的注意

- 目标元素由运行时几何判定选出，**不要引入对 hash 类名的依赖**——那些类名每次构建都会变。
- @@[data-slot]@@ 锚点是 @@display: contents@@，**没有盒子，不能当动画目标**。
  需要用它下面的子元素，@@collectBlocks()@@ 就是干这个的。
- 动画只在页面加载时播一次。**不要加 localStorage / cookie 门控**——那会让调试期无法重放。

## PR 要求

- 跑过 @@verify-headless.ps1@@，确认逐帧截图无异常
- 改了时长或缓动，在描述里说明依据
- **有未验证的部分请明说**，不要写「看起来没问题」这类模糊表述

## 报告缺陷

用 [issue 模板](.github/ISSUE_TEMPLATE/bug_report.yml)。动画类问题，
**描述实际表现比贴截图有用**——比如「鲸鱼消失太快，大约 200ms 就没了」。
安全问题请走 [私密报告](SECURITY.md)，不要开公开 issue。
