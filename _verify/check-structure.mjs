// 结构完整性检查 + 敏感信息扫描（CI 与本地共用）。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
process.chdir(ROOT)

let failed = 0
const ok = (m) => console.log('  ok   ' + m)
const fail = (m) => { console.error('  FAIL ' + m); failed++ }

console.log('=== 一、结构完整性 ===')

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
if (pkg.name !== '@local/dsh-boot-anim') fail('package name 应为 @local/dsh-boot-anim，实际 ' + pkg.name)
else ok('package name = ' + pkg.name)

if (!pkg.dsh?.bundle?.patch) fail('package.json 缺 dsh.bundle.patch')
else ok('dsh.bundle.patch = ' + pkg.dsh.bundle.patch)

const patch = fs.readFileSync(pkg.dsh.bundle.patch, 'utf8')
if (!patch.includes('@local/dsh-boot-anim')) fail('cordis.patch.yml 未引用本包')
else ok('cordis.patch.yml 引用了本包')

const js = fs.readFileSync('lib/boot-anim.js', 'utf8')
const css = fs.readFileSync('lib/boot-anim.css', 'utf8')

// 鲸鱼 path 一致性
const m = js.match(/var WHALE = "([^"]+)"/)
if (!m) fail('lib/boot-anim.js 里找不到 WHALE 常量')
else {
  const ref = fs.readFileSync('_verify/fish-logo-path.txt', 'utf8').trim()
  if (m[1] !== ref) fail('鲸鱼 path 与 _verify/fish-logo-path.txt 不一致（' + m[1].length + ' vs ' + ref.length + '）')
  else ok('鲸鱼 path 与校验锚点逐字节一致（' + m[1].length + ' 字符）')
}

// CSS
if (!css.includes('[data-dsh-boot-anim]')) fail('CSS 缺作用域前缀 [data-dsh-boot-anim]')
else ok('CSS 作用域前缀就位')
if (!css.includes('--dsw-alias-bg-base')) fail('CSS 缺皮肤变量回退 --dsw-alias-bg-base')
else ok('CSS 皮肤变量回退就位')
if (!css.includes('non-scaling-stroke')) fail('CSS 缺 non-scaling-stroke')
else ok('CSS non-scaling-stroke 就位')

// 分镜函数
for (const f of ['shot12', 'shot3', 'shot4', 'shot56', 'shot7']) {
  if (!js.includes('function ' + f)) fail('缺少分镜函数 ' + f)
}
if (['shot12', 'shot3', 'shot4', 'shot56', 'shot7'].every((f) => js.includes('function ' + f))) ok('七段分镜函数齐全')

// 安全网
for (const [label, needle] of [
  ['reduced-motion 守卫', 'prefers-reduced-motion'],
  ['幂等守卫', '__DSH_BOOT_ANIM__'],
  ['display:contents 穿透采集器', 'collectBlocks'],
  ['状态闸门', 'waitApp'],
  ['跳过后清理', 'teardown'],
]) {
  if (!js.includes(needle)) fail('缺 ' + label)
  else ok(label + ' 就位')
}

for (const f of ['LICENSE', 'README.md', 'CHANGELOG.md', 'SECURITY.md', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md', 'cordis.patch.yml']) {
  if (!fs.existsSync(f)) fail('缺根文件 ' + f)
  else ok('根文件 ' + f + ' 存在')
}

console.log('')
console.log('=== 二、敏感信息扫描 ===')
const SKIP = new Set(['.git', '_extract', '_tool', 'node_modules', 'frames'])
// 模式本身也要避开自指：用拼接构造，避免扫描器扫到自己的字面量。
const A = 'Administrat' + 'or'
const pats = [
  ['宿主用户名', new RegExp(A, 'g')],
  ['C 盘用户路径', /C:[\\/]Users/gi],
  ['工作区绝对路径', /[A-Z]:[\\/](AAAhuancun|obsidian|jietu)/g],
  ['sk- 密钥', /sk-[A-Za-z0-9_-]{16,}/g],
  ['GitHub 令牌', /gh[pousr]_[A-Za-z0-9]{20,}/g],
  ['JWT', /eyJ[A-Za-z0-9_-]{20,}\./g],
  ['私钥块', new RegExp('BEGIN .*PRIV' + 'ATE KEY', 'g')],
]

let hits = 0, scanned = 0
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue
    const p = path.join(d, e.name)
    if (e.isDirectory()) { walk(p); continue }
    const buf = fs.readFileSync(p)
    if (buf.includes(0)) continue
    scanned++
    const t = buf.toString('utf8')
    for (const [label, re] of pats) {
      re.lastIndex = 0
      const mm = t.match(re)
      if (mm) { hits++; console.error('  HIT [' + label + '] ' + path.relative(ROOT, p) + ' x' + mm.length + ' e.g. ' + String(mm[0]).slice(0, 40)) }
    }
  }
}
walk(ROOT)
console.log('  扫描文本文件 ' + scanned + ' 个')
if (hits) fail('敏感信息 ' + hits + ' 处')
else ok('无敏感信息')

console.log('')
console.log(failed === 0 ? 'STRUCT_CHECK = PASS' : 'STRUCT_CHECK = FAIL (' + failed + ')')
process.exit(failed === 0 ? 0 : 1)
