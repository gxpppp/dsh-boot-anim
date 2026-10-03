// 从上游 dsh-client-ui-primitives 的 BrandWordmark 提取官方字标矢量。
// 18 个图元手工抄写极易出错，故用脚本生成，并断言数量以防上游结构变化。
// 用法：node _verify/gen-wordmark.mjs <primitives/lib/index.js 路径>
// 产物：lib/brand-wordmark.json —— 由宿主插件作为 global 注入行送进页面。
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const NL = String.fromCharCode(10)
const Q = String.fromCharCode(34)
const TAB = String.fromCharCode(9)
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const src = process.argv[2]
if (!src) { console.error("用法: node _verify/gen-wordmark.mjs <primitives/lib/index.js>"); process.exit(1) }

const text = fs.readFileSync(src, "utf8")
const bi = text.indexOf("function BrandWordmark")
if (bi < 0) { console.error("未找到 BrandWordmark"); process.exit(1) }
const seg = text.slice(bi, text.indexOf("//#endregion", bi))

// 以四处锚点切分：鲸鱼 clip 组 / 徽章底 rect / 徽章 clip 组 / defs
const atWhale = seg.indexOf("dsh-wordmark-whale-clip")
const atBadge = seg.indexOf("dsh-wordmark-badge-clip")
const atDefs = seg.indexOf("jsxs(" + Q + "defs" + Q)
const atRect = seg.indexOf("jsx(" + Q + "rect" + Q + ", {")
if (atWhale < 0 || atRect < 0 || atBadge < 0 || atDefs < 0) { console.error("结构定位失败"); process.exit(1) }
if (!(atWhale < atRect && atRect < atBadge && atBadge < atDefs)) { console.error("锚点顺序异常"); process.exit(1) }

// 在区间内按花括号配平抓取 jsx(path|rect, { ... })
const grab = function (from, to) {
  const chunk = seg.slice(from, to)
  const out = []
  const re = new RegExp("jsx(?:s)?\\(" + Q + "(path|rect)" + Q + ",\\s*\\{", "g")
  let m
  while ((m = re.exec(chunk)) !== null) {
    const kind = m[1]
    let p = m.index + m[0].length - 1
    let depth = 0
    let end = p
    for (; end < chunk.length; end++) {
      const ch = chunk[end]
      if (ch === "{") depth++
      else if (ch === "}") { depth--; if (depth === 0) break }
    }
    const body = chunk.slice(p, end + 1)
    const dm = body.match(new RegExp("d:\\s*" + Q + "([^" + Q + "]+)" + Q))
    const num = function (k) {
      const mm = body.match(new RegExp(k + ":\\s*" + Q + "([^" + Q + "]+)" + Q))
      return mm ? mm[1] : undefined
    }
    if (kind === "path" && dm) out.push({ t: "path", d: dm[1] })
    else if (kind === "rect") out.push({ t: "rect", x: num("x"), y: num("y"), width: num("width"), height: num("height"), rx: num("rx") })
  }
  return out
}

const wordmark = grab(0, atWhale)
const whale = grab(atWhale, atRect)
const badgeRect = grab(atRect, atBadge)
const badgeLetters = grab(atBadge, atDefs)

for (const p of wordmark) p.c = "fg"
for (const p of whale) p.c = "fg"
for (const p of badgeRect) p.c = "fg"
for (const p of badgeLetters) p.c = "inv"
const PARTS = [].concat(wordmark, whale, badgeRect, badgeLetters)

const CLIPS = {}
const cre = new RegExp("id:\\s*" + Q + "(dsh-wordmark-[a-z-]+)" + Q + ",\\s*\\n\\s*children: jsx\\(" + Q + "rect" + Q + ", \\{([\\s\\S]*?)\\}\\)", "g")
let cm
while ((cm = cre.exec(seg)) !== null) {
  const body = cm[2]
  const num = function (k) {
    const mm = body.match(new RegExp(k + ":\\s*" + Q + "([^" + Q + "]+)" + Q))
    return mm ? mm[1] : undefined
  }
  const tm = body.match(new RegExp("transform:\\s*" + Q + "([^" + Q + "]+)" + Q))
  CLIPS[cm[1]] = { width: num("width"), height: num("height"), transform: tm ? tm[1] : undefined }
}

const invCount = PARTS.filter(function (x) { return x.c === "inv" }).length
const checks = [
  ["图元总数", PARTS.length, 18],
  ["deepseek 字标 path", wordmark.length, 9],
  ["鲸鱼标记 path", whale.length, 1],
  ["徽章底 rect", badgeRect.length, 1],
  ["HARNESS 字母 path", badgeLetters.length, 7],
  ["反色图元", invCount, 7],
  ["裁剪框", Object.keys(CLIPS).length, 2],
]
let bad = 0
for (const c of checks) {
  if (c[1] !== c[2]) { console.error("  x " + c[0] + ": 期望 " + c[2] + "，实际 " + c[1]); bad++ }
}
if (bad) { console.error("提取结构异常，已中止"); process.exit(1) }

const payload = {
  _source: "@deepseek-ai/dsh-client-ui-primitives / BrandWordmark",
  _note: "由 _verify/gen-wordmark.mjs 生成，请勿手工编辑；上游更新后重跑生成器",
  viewBox: "26 0 156 24",
  viewBoxFull: "0 0 182 24",
  ratio: 156 / 24,
  parts: PARTS,
  clips: CLIPS,
}
fs.writeFileSync(path.join(ROOT, "lib", "brand-wordmark.json"), JSON.stringify(payload, null, 2) + NL, "utf8")
console.log("图元数:", PARTS.length, "(fg " + (PARTS.length - invCount) + " / inv " + invCount + ")")
console.log("裁剪框:", Object.keys(CLIPS).join(", "))
console.log("path 总字符:", PARTS.filter(function (x) { return x.d }).reduce(function (a, x) { return a + x.d.length }, 0))
console.log("已写入 lib/brand-wordmark.json")
