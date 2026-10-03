import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PW = process.env.DSH_PLAYWRIGHT || 'playwright'
const { chromium } = await import(PW.startsWith('http') || PW.includes(':') ? pathToFileURL(PW).href : PW)

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
  .replace('window.__APP_DELAY_MS__ || 1800', String(process.env.DSH_APP_DELAY_MS || 12000))
fs.writeFileSync(path.join(ROOT, '_verify', 'harness.built.html'), html, 'utf8')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(pathToFileURL(path.join(ROOT, '_verify', 'harness.built.html')).href)

// 观察 band 的 transform 是否持续变化；mask 内的元素不参与布局，只能用 computed style
const samples = []
for (let i = 0; i < 20; i++) {
  await page.waitForTimeout(400)
  samples.push({ t: i * 400, v: await page.evaluate(() => {
    const b = document.querySelector('.ba-sheen-band')
    return b ? getComputedStyle(b).transform : '(none)'
  }) })
}
await browser.close()

console.log('=== band transform 逐 400ms ===')
const distinct = new Set()
for (const s of samples) { console.log('  ' + s.t + 'ms  ' + s.v); distinct.add(s.v) }
console.log('')
console.log('不同取值数:', distinct.size, distinct.size > 3 ? '(光带在扫动)' : '(疑似静止)')
