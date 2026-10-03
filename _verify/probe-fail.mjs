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
  .replace('window.__APP_DELAY_MS__ || 1800', '2000')
  .replace('window.__FAIL_MODE__ = false;', 'window.__FAIL_MODE__ = true;')
const failPage = path.join(ROOT, '_verify', 'harness-fail.html')
fs.writeFileSync(failPage, html, 'utf8')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const logs = []
page.on('console', (m) => logs.push(m.text()))
await page.goto(pathToFileURL(failPage).href)

const marks = []
let prev = 0
for (const t of [3200, 3800, 4400, 5000, 5600, 6400]) {
  await page.waitForTimeout(t - prev)
  prev = t
  marks.push({ t, ...(await page.evaluate(() => {
    const stage = document.querySelector('[data-dsh-boot-anim]')
    const boot = document.querySelector('[data-dsh-boot]')
    return {
      stage: !!stage,
      bootVisible: boot ? getComputedStyle(boot).opacity : 'gone',
      failText: document.body.innerText.includes('Failed to load'),
    }
  })) })
}
console.log('=== 失败场景 ===')
for (const m of marks) console.log('  ' + JSON.stringify(m))
console.log('')
console.log('LOGS:', JSON.stringify(logs.filter((l) => l.includes('boot-anim'))))
await page.screenshot({ path: path.join(ROOT, '_verify', 'fail-final.png') })
await browser.close()
