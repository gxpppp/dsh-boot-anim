/**
 * dsh-boot-anim — Host half.
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
 * @module dsh-boot-anim
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/** Loader identity for this contribution. */
export const name = 'boot-anim'

/** The index-injection table belongs to the web server service. */
export const inject = ['webServer']

const read = (asset) => readFileSync(fileURLToPath(new URL(asset, import.meta.url)), 'utf8')

/**
 * Push this profile's index rows once per collection.
 *
 * 三个载荷都在回调里现读，而不是在模块加载时缓存成 const。
 * 模块级 const 只在宿主进程启动时求值一次 —— 改了 lib/boot-anim.js 之后，
 * 页面刷新拿到的仍然是启动那一刻的那份，必须重启整个 DSH 才生效。
 * 放到回调里读，代价只是每次 index 收集多一次读盘（每个页面加载一次），
 * 换来「改完动画刷新页面即可见」。
 *
 * @param ctx - Profile scope owning the web server service.
 */
export function apply(ctx) {
  ctx.on('webserver/index-inject', (table) => {
    let js = ''
    let css = ''
    let brand = null
    try { js = read('./boot-anim.js') } catch (e) { return }
    try { css = read('./boot-anim.css') } catch (e) {}
    try { brand = JSON.parse(read('./brand-wordmark.json')) } catch (e) {}
    table.push(
      { kind: 'global', name: '__DSH_BRAND_WORDMARK__', value: brand },
      { kind: 'style', text: css },
      { kind: 'script', placement: 'head', text: js },
    )
  })
}
