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

const rows = []
const t0 = Date.now()
for (let i = 0; i < 45; i++) {
  const st = await page.evaluate(() => {
    const mk = document.querySelector('.ba-mark')
    const sh = document.querySelector('.ba-sheen')
    return {
      computedMark: mk ? getComputedStyle(mk).opacity : null,
      inlineMark: mk ? mk.style.opacity : null,
      markClass: mk ? mk.className : null,
      sheenOp: sh ? getComputedStyle(sh).opacity : null,
    }
  })
  rows.push({ t: Date.now() - t0, ...st })
  await page.waitForTimeout(100)
}
await browser.close()

console.log('=== 字标透明度逐 100ms ===')
console.log('  时刻  computed  inline   class         sheen')
for (const r of rows) {
  if (r.t < 3200) continue
  console.log(`  ${String(r.t).padStart(5)}  ${String(r.computedMark).padEnd(8)}  ${String(r.inlineMark).padEnd(6)}  ${String(r.markClass).padEnd(12)}  ${r.sheenOp}`)
}
