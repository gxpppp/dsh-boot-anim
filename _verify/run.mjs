import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'

// Playwright 解析顺序：DSH_PLAYWRIGHT > 常见兄弟目录 > 全局 node_modules
function resolvePlaywright() {
  const req = createRequire(import.meta.url)
  const candidates = []
  if (process.env.DSH_PLAYWRIGHT) candidates.push(process.env.DSH_PLAYWRIGHT)
  candidates.push('playwright')
  for (const c of candidates) {
    try { return pathToFileURL(req.resolve(c)).href } catch { /* next */ }
  }
  throw new Error('需要 playwright。设置 DSH_PLAYWRIGHT 指向 playwright/index.mjs，或在含 playwright 的工作目录下运行。')
}

const { chromium } = await import(await resolvePlaywright())

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const T = path.join(ROOT, '_verify')
const css = fs.readFileSync(path.join(ROOT, 'lib', 'boot-anim.css'), 'utf8')
const js = fs.readFileSync(path.join(ROOT, 'lib', 'boot-anim.js'), 'utf8')

const html = fs.readFileSync(path.join(T, 'harness.html'), 'utf8')
  .replace('globalThis.__INJECTIONS__ = window.__INJECTIONS__ || [];',
    'globalThis.__INJECTIONS__ = ' + JSON.stringify([
      { kind: 'style', text: css },
      { kind: 'script', placement: 'head', text: js },
    ]) + ';')
  .replace('window.__APP_DELAY_MS__ || 1800', '1600')
fs.writeFileSync(path.join(T, 'harness.built.html'), html, 'utf8')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
const logs = []
page.on('console', (m) => logs.push('[' + m.type() + '] ' + m.text()))
page.on('pageerror', (e) => logs.push('[pageerror] ' + e.message))

const t0 = Date.now()
await page.goto(pathToFileURL(path.join(T, 'harness.built.html')).href)

const targets = [0, 350, 650, 950, 1100, 1300, 1600, 1900, 2300, 2700, 3000, 3300, 3600, 3900, 4300, 4700, 5200, 6000]
const marks = []
for (const t of targets) {
  const wait = t - (Date.now() - t0) + 200
  if (wait > 0) await page.waitForTimeout(wait)
  const elapsed = Date.now() - t0
  const state = await page.evaluate(() => {
    const stage = document.querySelector('[data-dsh-boot-anim]')
    const w = document.querySelector('.ba-whale')
    const frame = document.querySelector('[data-shell-overlay]')
    return {
      stage: stage ? 1 : 0,
      whaleOpacity: w ? Number(getComputedStyle(w).opacity).toFixed(2) : null,
      whaleTransform: w ? getComputedStyle(w).transform.slice(0, 60) : null,
      appMounted: frame ? 1 : 0,
      bg: getComputedStyle(document.body).backgroundColor,
    }
  })
  marks.push({ t, elapsed, ...state })
  await page.screenshot({ path: path.join(T, 'f' + String(t).padStart(5, '0') + '.png') })
}

await page.waitForTimeout(2500)
const final = await page.evaluate(() => {
  const stage = document.querySelector('[data-dsh-boot-anim]')
  const marked = document.querySelectorAll('[data-ba-anim]')
  const boot = document.querySelector('[data-dsh-boot]')
  return {
    stageRemoved: stage === null,
    markedLeft: marked.length,
    bootPagePresent: boot !== null,
    htmlOverflow: document.documentElement.style.overflow || '(none)',
  }
})
await page.screenshot({ path: path.join(T, 'final.png') })

console.log('MARKS:')
for (const m of marks) console.log('  ' + JSON.stringify(m))
const shot7 = logs.filter((l) => l.includes('shot7'))
console.log('SHOT7: ' + JSON.stringify(shot7))
console.log('FINAL: ' + JSON.stringify(final))
console.log('LOGS: ' + JSON.stringify(logs.filter((l) => !l.includes('shot7'))))
await browser.close()
