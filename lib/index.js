/**
 * @local/dsh-boot-anim — Host half.
 *
 * Contributes the boot animation and the UI entrance transition as structured
 * index-injection rows. The desktop shell hands the same row table to the page
 * over IPC, where the client bundle interprets it, so a `style` row becomes a
 * <style> element, a `global` row a global assignment, and a `script` row an
 * inline <script>.
 *
 * No HTTP route and no injected asset: every payload rides the row text, so
 * nothing has to be served and nothing in the installed build is touched.
 *
 * @module @local/dsh-boot-anim
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Loader identity for this contribution. */
export const name = 'boot-anim'

/** The index-injection table belongs to the web server service. */
export const inject = ['webServer']

const read = (asset) => readFileSync(fileURLToPath(new URL(asset, import.meta.url)), 'utf8')

const CSS = read('./boot-anim.css')
const JS = read('./boot-anim.js')

/**
 * 官方字标数据。作为 `global` 注入行送出 —— boot-anim.js 是注入的独立脚本，
 * 无法 import，所以数据必须走全局量而不是模块。
 *
 * 文件缺失时降级为 null：过场会跳过字标，只播光带与白场，其余分镜不受影响。
 */
const BRAND = (() => {
  try {
    return JSON.parse(read('./brand-wordmark.json'))
  } catch {
    return null
  }
})()

/**
 * Push this profile's index rows once per collection.
 * @param ctx - Profile scope owning the web server service.
 */
export function apply(ctx) {
  ctx.on('webserver/index-inject', (table) => {
    table.push(
      { kind: 'global', name: '__DSH_BRAND_WORDMARK__', value: BRAND },
      { kind: 'style', text: CSS },
      { kind: 'script', placement: 'head', text: JS },
    )
  })
}
