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
await page.waitForTimeout(4500)

const d = await page.evaluate(() => {
  const el = (s) => document.querySelector(s)
  const info = (name, e) => {
    if (!e) return { name, missing: true }
    const b = e.getBoundingClientRect()
    const cs = getComputedStyle(e)
    return { name, x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height), opacity: cs.opacity, position: cs.position, inset: cs.inset }
  }
  return {
    viewport: { w: innerWidth, h: innerHeight },
    mark: info('.ba-mark', el('.ba-mark')),
    sheen: info('.ba-sheen', el('.ba-sheen')),
    sheenSvgRect: (() => { const s = el('.ba-sheen'); if (!s) return null; const b = s.getBoundingClientRect(); return { x: Math.round(b.x), y: Math.round(b.y), w: Math.round(b.width), h: Math.round(b.height) } })(),
    markVarH: el('.ba-mark') ? getComputedStyle(el('.ba-mark')).getPropertyValue('--ba-mark-h') : null,
  }
})
console.log(JSON.stringify(d, null, 1))
console.log('')
const m = d.mark, s = d.sheen
if (m && s && !s.missing) {
  console.log('字标层 .ba-mark   : ' + m.w + ' × ' + m.h + '  @ (' + m.x + ',' + m.y + ')')
  console.log('光带层 .ba-sheen  : ' + s.w + ' × ' + s.h + '  @ (' + s.x + ',' + s.y + ')')
  console.log('')
  console.log('两者尺寸比: ' + (s.w / m.w).toFixed(2) + '× 宽, ' + (s.h / m.h).toFixed(2) + '× 高')
  console.log('两者是否重合: ' + (m.x === s.x && m.y === s.y ? '是' : '否 —— 定位方式不同'))
}
await browser.close()
