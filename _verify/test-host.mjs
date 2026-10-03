// 宿主半侧单测：用假 ctx 验证 apply() 真的会 push 出注入行，且内容完整。
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const pluginDir = process.env.DSH_PLUGIN_DIR
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const mod = await import(pathToFileURL(path.join(pluginDir, 'lib', 'index.js')).href)

let failed = 0
const ok = (m) => console.log('  ok   ' + m)
const bad = (m) => { console.error('  FAIL ' + m); failed++ }
const check = (cond, m) => (cond ? ok(m) : bad(m))

console.log('name =', mod.name)
console.log('inject =', JSON.stringify(mod.inject))

const handlers = {}
const ctx = { on(evt, fn) { (handlers[evt] ??= []).push(fn) } }

mod.apply(ctx)
console.log('registered events =', JSON.stringify(Object.keys(handlers)))

const table = []
for (const fn of handlers['webserver/index-inject'] ?? []) fn(table)

console.log('rows pushed =', table.length)
for (const r of table) {
  const size = r.kind === 'global' ? JSON.stringify(r.value ?? null).length : (r.text ?? '').length
  console.log('  -', r.kind.padEnd(7), 'placement=' + (r.placement ?? '(default)'), 'size=' + size)
}

// 三行：global(字标) + style + script
const kinds = table.map((r) => r.kind)
check(table.length === 3, '共 3 行注入')
check(kinds[0] === 'global' && kinds[1] === 'style' && kinds[2] === 'script', '顺序为 global / style / script')

const globalRow = table.find((r) => r.kind === 'global')
const css = (table.find((r) => r.kind === 'style') || {}).text || ''
const jsRow = (table.find((r) => r.kind === 'script') || {}).text || ''

console.log('')
console.log('=== 字标数据 ===')
check(globalRow && globalRow.name === '__DSH_BRAND_WORDMARK__', 'global 名称为 __DSH_BRAND_WORDMARK__')
const brand = globalRow && globalRow.value
check(!!brand, '字标数据已装载')
if (brand) {
  check(brand.parts.length === 18, '字标图元 18 个（实际 ' + brand.parts.length + '）')
  check(Object.keys(brand.clips).length === 2, '裁剪框 2 个')
  check(brand.viewBox === '26 0 156 24', 'viewBox 为纯文字版 ' + brand.viewBox)
  check(brand.parts.filter((p) => p.c === 'inv').length === 7, '反色图元 7 个')
  const pathChars = brand.parts.filter((p) => p.d).reduce((a, p) => a + p.d.length, 0)
  check(pathChars > 13000, 'path 总字符 ' + pathChars)
}

console.log('')
console.log('=== CSS ===')
check(css.includes('[data-dsh-boot-anim]'), 'CSS 作用域前缀')
check(css.includes('--dsw-alias-bg-base'), 'CSS 皮肤变量回退')
check(css.includes('non-scaling-stroke'), 'CSS non-scaling-stroke')
check(css.includes('.ba-mark'), 'CSS 含字标层')
check(css.includes('.ba-sheen'), 'CSS 含光带层')

console.log('')
console.log('=== 前端脚本 ===')
check(jsRow.includes('M22.9168 1.43018'), '含完整鲸鱼 path')
check(/"M22\.9168[^"]{3000,}"/.test(jsRow), '鲸鱼 path 长度正常')
check(jsRow.includes('(function () {') && jsRow.includes('use strict'), '零依赖 IIFE')
check(jsRow.includes('__DSH_BOOT_ANIM__'), '幂等守卫')
for (const f of ['shot12', 'shot3', 'shot4', 'shot56', 'shot7', 'interlude']) {
  check(jsRow.includes('function ' + f), '含函数 ' + f)
}
check(jsRow.includes('waitAppForever'), '含无上限就绪等待')
check(jsRow.includes('bootFailed'), '含加载失败检测')
check(jsRow.includes('startSheen'), '含光带循环')
check(jsRow.includes('__DSH_BRAND_WORDMARK__'), '读取字标全局量')

console.log('')
console.log(failed === 0 ? 'HOST_TEST = PASS' : 'HOST_TEST = FAIL (' + failed + ')')
process.exit(failed === 0 ? 0 : 1)
