// 用 Electron-as-Node 直接调用 app.asar 里的真实加载器，验证 bundle 能否被接受。
//
// 用法：
//   ELECTRON_RUN_AS_NODE=1 "<DSH>/DeepSeek Harness.exe" probe-loader.mjs
//
// 环境变量（建议显式给出，本会话里 HOME/USERPROFILE 可能被宿主改写）：
//   DSH_RESOURCES  resources 目录（默认从自身位置向上推导）
//   DSH_PROFILE     profile 目录（默认 <DSH_HOME>/profiles/desktop）
//   DSH_HOME        DSH 主目录（默认 <USERPROFILE>/.dsh）
import path from 'node:path'
import os from 'node:os'

// 本脚本位于 <repo>/_verify/，仓库与 DSH 安装位置无关，因此这里全部走显式推导。
const home = process.env.HOME && process.env.HOME !== process.cwd()
  ? process.env.HOME
  : (os.homedir() !== process.cwd() ? os.homedir() : '')

function defaultResources() {
  if (process.env.DSH_RESOURCES) return process.env.DSH_RESOURCES
  if (process.env.DSH_BIN) return path.join(path.dirname(process.env.DSH_BIN), 'resources')
  const base = process.env.LOCALAPPDATA || (home ? path.join(home, 'AppData', 'Local') : '')
  if (!base) {
    throw new Error('无法推导 DSH 安装位置。请设置 DSH_RESOURCES 或 DSH_BIN。')
  }
  return path.join(base, 'Programs', 'DeepSeek Harness', 'resources')
}

function defaultProfileDir() {
  if (process.env.DSH_PROFILE) return process.env.DSH_PROFILE
  const dshHome = process.env.DSH_HOME || (home ? path.join(home, '.dsh') : '')
  if (!dshHome) {
    throw new Error('无法推导 DSH_HOME。请设置 DSH_PROFILE 或 DSH_HOME。')
  }
  return path.join(dshHome, 'profiles', 'desktop')
}

const resources = defaultResources()
const profileDir = defaultProfileDir()

const APP_PATH = path.join(resources, 'app.asar', 'dsh')
const APP = APP_PATH.replace(/\\/g, '/')
const boot = await import('file:///' + APP + '/node_modules/@deepseek-ai/dsh-app-boot/lib/index.js')

console.log('resources  =', resources)
console.log('profileDir =', profileDir)

const profile = boot.loadProfileDirectory(
  'dsh',
  profileDir,
  APP + '/node_modules/@deepseek-ai/dsh/package.json',
  { userLayer: false },
)

console.log('profile.name =', profile.name)
console.log('layers 数量 =', profile.layers.length)
console.log('skippedBundles 数量 =', profile.skippedBundles.length)

const mine = profile.layers.find((l) => l.packageName === 'dsh-boot-anim')
console.log('')
console.log('=== 我的 bundle 是否被接受 ===')
console.log('找到 dsh-boot-anim:', mine ? 'YES' : 'NO')

if (mine) {
  console.log('  patchPaths =', JSON.stringify(mine.patchPaths))
  console.log('  patches 条数 =', mine.patches.length)
  console.log('  patches 内容 =', JSON.stringify(mine.patches).slice(0, 400))
}

console.log('')
console.log('=== 所有被跳过的 bundle ===')
if (profile.skippedBundles.length === 0) console.log('  (无)')
for (const s of profile.skippedBundles) {
  console.log('  -', s.packageName)
  console.log('    原因:', String(s.reason).slice(0, 300))
}

const ok = mine !== undefined && profile.skippedBundles.every((s) => s.packageName !== 'dsh-boot-anim')
console.log('')
console.log('VERDICT =', ok ? 'PASS — 加载器接受了该 bundle' : 'FAIL')
