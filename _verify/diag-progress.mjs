import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PW = process.env.DSH_PLAYWRIGHT || 'playwright'
const { chromium } = await import(PW.includes(':') ? pathToFileURL(PW).href : PW)

const css = fs.readFileSync(path.join(ROOT, 'lib', 'boot-anim.css'), 'utf8')
const js = fs.readFileSync(path.join(ROOT, 'lib', 'boot-anim.js'), 'utf8')
const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', 'brand-wordmark.json'), 'utf8'))
const html = fs.readFileSync(path.join(ROOT, '_verify', 'harness.html'), 'utf8')
  .replace('globalThis.__INJECTIONS__ = window.__INJECTIONS__ || [];',
    'globalThis.__INJECTIONS__ = ' + JSON.stringify([
      { kind: 'global', name: '__DSH_BRAND_WORDMARK__', value: brand },
      { kind: 'style', text: css },
      { kind: 'script', placement: 'head', text: js },
    ]) + ';')
  .replace('window.__APP_DELAY_MS__ || 1800', '12000')
fs.writeFileSync(path.join(ROOT, '_verify', 'harness.diag.html'), html, 'utf8')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(pathToFileURL(path.join(ROOT, '_verify', 'harness.diag.html')).href)

const t0 = Date.now()
const rows = []
for (let i = 0; i < 60; i++) {
  const st = await page.evaluate(() => {
    const w = document.querySelector('.ba-whale')
    const mk = document.querySelector('.ba-mark')
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.x), r: Math.round(b.x+b.width), o: Number(getComputedStyle(el).opacity).toFixed(2) } }
    const st = document.querySelector('[data-dsh-boot-anim]')
    return { w: r(w), mk: r(mk), stage: st ? 1 : 0, markH: mk ? getComputedStyle(mk).getPropertyValue('--ba-mark-h') : null }
  })
  const e = Date.now() - t0
  const gap = (st.w && st.mk && st.mk.o !== '0.00') ? (st.mk.l - st.w.r) : null
  rows.push({ t: e, whale: st.w, mark: st.mk, gap })
  await page.waitForTimeout(80)
}
await browser.close()

console.log('=== 过程中鲸鱼 / 字标位置（每 100ms）===')
console.log('  时刻  鲸鱼[左..右](透明度)      字标[左..右](透明度)      间隙')
for (const r of rows) {
  const w = r.whale ? `${r.whale.l}..${r.whale.r}(${r.whale.o})` : '-'
  const m = r.mark ? `${r.mark.l}..${r.mark.r}(${r.mark.o})` : '-'
  const g = r.gap === null ? '(字标未显示)' : String(r.gap)
  console.log(`  ${String(r.t).padStart(5)}  stage=${r.stage}  ${w.padEnd(22)} ${m.padEnd(22)} 间隙=${String(g).padEnd(12)} markH=${r.markH}`)
}
