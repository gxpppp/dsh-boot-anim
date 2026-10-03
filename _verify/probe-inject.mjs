// 验证宿主插件的 apply() 产出的注入行，并核对字标数据完整装载。
// 用法：node _verify/probe-inject.mjs
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const mod = await import(pathToFileURL(path.join(ROOT, 'lib', 'index.js')).href)

let failed = 0
const ok = (m) => console.log('  ok   ' + m)
const bad = (m) => { console.error('  FAIL ' + m); failed++ }

console.log('插件 name:', mod.name)

const handlers = {}
const ctx = { on(e, f) { (handlers[e] ??= []).push(f) } }
mod.apply(ctx)

const table = []
for (const fn of handlers['webserver/index-inject'] ?? []) fn(table)

console.log('注入行数:', table.length)
for (const r of table) {
  const size = r.kind === 'global' ? JSON.stringify(r.value ?? null).length : (r.text ?? '').length
  console.log('  -', r.kind.padEnd(7), 'name=' + (r.name ?? '-'), 'size=' + size)
}

const g = table.find((r) => r.kind === 'global')
if (!g) bad('缺 global 注入行')
else if (!g.value) bad('global 行的 value 为空')
else {
  ok('字标数据已装载')
  if (g.value.parts.length === 18) ok('图元 18 个')
  else bad('图元数异常: ' + g.value.parts.length)
  const chars = g.value.parts.filter((p) => p.d).reduce((a, p) => a + p.d.length, 0)
  if (chars > 13000) ok('path 总字符 ' + chars)
  else bad('path 字符数异常: ' + chars)
}

console.log('')
console.log(failed === 0 ? 'INJECT_PROBE = PASS' : 'INJECT_PROBE = FAIL (' + failed + ')')
process.exit(failed === 0 ? 0 : 1)
