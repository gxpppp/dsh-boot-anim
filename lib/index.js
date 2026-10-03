/**
 * @local/dsh-boot-anim — Host half.
 *
 * Contributes the boot animation and the UI entrance transition as two
 * structured index-injection rows. The desktop shell hands the same row table
 * to the page over IPC, where the client bundle interprets it, so a `style`
 * row becomes a <style> element and a `script` row an inline <script>.
 *
 * No HTTP route and no injected asset: both payloads ride the row text, so
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
 * Push this profile's index rows once per collection.
 * @param ctx - Profile scope owning the web server service.
 */
export function apply(ctx) {
  ctx.on('webserver/index-inject', (table) => {
    table.push(
      { kind: 'style', text: CSS },
      { kind: 'script', placement: 'head', text: JS },
    )
  })
}
