// 用真实 cordis 运行时加载插件，触发 index-inject，核对注入行。
// 用法：ELECTRON_RUN_AS_NODE=1 "<DSH>/DeepSeek Harness.exe" probe-e2e.mjs
import path from 'node:path'
import os from 'node:os'
import { pathToFileURL, fileURLToPath } from 'node:url'

const resources = process.env.DSH_RESOURCES
  || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Programs', 'DeepSeek Harness', 'resources')
const pluginDir = process.env.DSH_PLUGIN_DIR
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const APP = path.join(resources, 'app.asar').replace(/\\/g, '/')
const mod = await import('file:///' + APP + '/node_modules/@deepseek-ai/cordis/lib/index.js')
console.log('cordis 导出:', Object.keys(mod).slice(0, 12).join(', '))

const Cordis = mod.default ?? mod.Context ?? mod.Cordis
console.log('Cordis 构造器:', typeof Cordis)

if (typeof Cordis === 'function') {
  const ctx = new Cordis()
  ctx.provide('webServer', {
    collectIndexInjections() { const t = []; ctx.emit('webserver/index-inject', t); return t },
  })

  const plugin = await import(pathToFileURL(path.join(pluginDir, 'lib', 'index.js')).href)
  console.log('插件 name =', plugin.name, '| inject =', JSON.stringify(plugin.inject))

  await ctx.plugin(plugin)

  const table = ctx.webServer.collectIndexInjections()
  console.log('')
  console.log('=== 注入行 ===')
  console.log('行数 =', table.length)
  for (const r of table) console.log('  -', r.kind, '| placement =', r.placement ?? '(default)', '| len =', r.text.length)

  const css = table.find((r) => r.kind === 'style')
  const js = table.find((r) => r.kind === 'script')
  console.log('')
  console.log('=== 断言 ===')
  const checks = {
    'style 行存在': !!css,
    'script 行存在': !!js,
    'script placement=head': js?.placement === 'head',
    'CSS 作用域前缀': css?.text.includes('[data-dsh-boot-anim]'),
    'CSS 皮肤变量回退': css?.text.includes('--dsw-alias-bg-base, #fff'),
    'CSS reduced-motion': css?.text.includes('prefers-reduced-motion'),
    'JS 完整鲸鱼 path': js?.text.includes('M22.9168 1.43018'),
    'JS 七段分镜齐全': ['shot12','shot3','shot4','shot56','shot7'].every((f) => js?.text.includes('function ' + f)),
    'JS reduced-motion 守卫': js?.text.includes('prefers-reduced-motion'),
    'JS 幂等守卫': js?.text.includes('__DSH_BOOT_ANIM__'),
    'JS 两个半幅 clipPath': js?.text.includes('ba-clip-l') && js?.text.includes('ba-clip-r'),
    'JS non-scaling-stroke': css?.text.includes('non-scaling-stroke'),
  }
  let pass = 0
  for (const [k, v] of Object.entries(checks)) { console.log((v ? '  PASS ' : '  FAIL ') + k); if (v) pass++ }
  console.log('')
  console.log('E2E =', pass + '/' + Object.keys(checks).length, pass === Object.keys(checks).length ? 'ALL PASS' : 'HAS FAILURES')

  await ctx.stop?.()
} else {
  console.log('无法取得 Cordis 构造器，导出为', JSON.stringify(Object.keys(mod)))
}
