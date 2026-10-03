// 宿主半侧单测：用假 ctx 验证 apply() 真的会 push 出注入行。
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const pluginDir = process.env.DSH_PLUGIN_DIR
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const mod = await import(pathToFileURL(path.join(pluginDir, 'lib', 'index.js')).href)

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
  console.log('  -', r.kind, 'placement=' + (r.placement ?? '(default)'), 'len=' + r.text.length)
}

const kinds = table.map((r) => r.kind)
console.log('ROWS_OK =', table.length === 2 && kinds[0] === 'style' && kinds[1] === 'script')

const css = table.find((r) => r.kind === 'style').text
const jsRow = table.find((r) => r.kind === 'script').text
console.log('css has scope prefix =', css.includes('[data-dsh-boot-anim]'))
console.log('css has skin var =', css.includes('--dsw-alias-bg-base'))
console.log('js has full whale path =', jsRow.includes('M22.9168 1.43018'))
console.log('js whale path len ok =', /"M22\.9168[^"]{3000,}"/.test(jsRow))
console.log('js is IIFE =', jsRow.includes('(function () {') && jsRow.includes('use strict'))
console.log('js row starts with comment =', jsRow.trim().startsWith('/**'))
console.log('js strict mode guard idempotent =', jsRow.includes('__DSH_BOOT_ANIM__'))
console.log('js has all 7 shots =', ['shot12', 'shot3', 'shot4', 'shot56', 'shot7'].every((f) => jsRow.includes('function ' + f)))
