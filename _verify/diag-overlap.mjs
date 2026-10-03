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

// 等过场进入字标阶段
await page.waitForTimeout(4200)

const d = await page.evaluate(() => {
  const w = document.querySelector('.ba-whale')
  const mk = document.querySelector('.ba-mark')
  const mksvg = mk ? mk.querySelector('svg') : null
  const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), c: Math.round(b.x + b.width/2) } }
  return {
    viewport: { w: innerWidth, h: innerHeight, cx: innerWidth/2 },
    whale: r(w),
    mark: r(mk),
    markSvg: r(mksvg),
    whaleTransform: w ? getComputedStyle(w).transform : null,
    markTransform: mk ? getComputedStyle(mk).transform : null,
    markVarH: mk ? getComputedStyle(mk).getPropertyValue('--ba-mark-h') : null,
    markViewBox: mksvg ? mksvg.getAttribute('viewBox') : null,
  }
})
console.log(JSON.stringify(d, null, 1))

// 计算重叠
const w = d.whale, m = d.markSvg || d.mark
if (w && m) {
  const overlap = Math.min(w.x + w.w, m.x + m.w) - Math.max(w.x, m.x)
  console.log('')
  console.log('鲸鱼范围: ' + w.x + ' .. ' + (w.x + w.w))
  console.log('字标范围: ' + m.x + ' .. ' + (m.x + m.w))
  console.log('横向重叠: ' + overlap + ' px  ' + (overlap > 0 ? '← 确实重叠' : '← 无重叠'))
  console.log('间隙应为: ' + (m.x - (w.x + w.w)) + ' px')
}
await browser.close()
