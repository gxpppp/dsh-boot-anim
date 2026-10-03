// 全帧渲染：把过场动画按固定步长逐帧截图，供逐帧检视。
// 用法：node _verify/render-all-frames.mjs [步长ms] [应用挂载延迟ms]
// 产物：_verify/allframes/NNNNN.png（文件名即时间戳，单位 ms）
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PW = process.env.DSH_PLAYWRIGHT || 'playwright'
const { chromium } = await import(PW.includes(':') ? pathToFileURL(PW).href : PW)

const STEP = Number(process.argv[2] || 50)          // 采样步长 ms
const APP_DELAY = Number(process.argv[3] || 12000)  // 应用挂载延迟，默认压到很晚以便看清过场
const DURATION = Number(process.argv[4] || 7000)    // 覆盖总时长

const OUT = path.join(ROOT, '_verify', 'allframes')
fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

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
  .replace('window.__APP_DELAY_MS__ || 1800', String(APP_DELAY))
const built = path.join(ROOT, '_verify', 'harness.allframes.html')
fs.writeFileSync(built, html, 'utf8')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const logs = []
page.on('console', (m) => logs.push(m.text()))
page.on('pageerror', (e) => logs.push('PAGEERROR ' + e.message))

await page.goto(pathToFileURL(built).href)
const t0 = Date.now()

// 逐帧：每 STEP ms 截一张，文件名记录真实经过时间
const marks = []
for (let t = 0; t <= DURATION; t += STEP) {
  const wait = t - (Date.now() - t0)
  if (wait > 0) await page.waitForTimeout(wait)
  const elapsed = Date.now() - t0
  const state = await page.evaluate(() => {
    const g = (s) => document.querySelector(s)
    const op = (el) => (el ? Number(getComputedStyle(el).opacity).toFixed(2) : null)
    const w = g('.ba-whale'), mk = g('.ba-mark'), sh = g('.ba-sheen')
    const stage = g('[data-dsh-boot-anim]')
    return {
      stage: stage ? 1 : 0,
      whaleOp: op(w),
      markOp: op(mk),
      sheenOp: op(sh),
      markClass: mk ? mk.className : null,
      appMounted: g('[data-shell-overlay]') ? 1 : 0,
      rootKids: document.getElementById('root') ? document.getElementById('root').children.length : -1,
    }
  })
  const name = String(elapsed).padStart(5, '0') + '.png'
  await page.screenshot({ path: path.join(OUT, name) })
  marks.push({ file: name, ...state })
}

await browser.close()

fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify(marks, null, 1), 'utf8')
const csv = ['file,stage,whaleOp,markOp,sheenOp,markClass,appMounted,rootKids']
  .concat(marks.map((m) => [m.file, m.stage, m.whaleOp, m.markOp, m.sheenOp, m.markClass, m.appMounted, m.rootKids].join(',')))
  .join('\n')
fs.writeFileSync(path.join(OUT, 'timeline.csv'), csv, 'utf8')

console.log('帧数:', marks.length, '| 步长', STEP + 'ms', '| 覆盖', DURATION + 'ms')
console.log('输出:', OUT)
console.log('LOGS:', JSON.stringify(logs.filter((l) => l.includes('boot-anim') || l.includes('PAGEERROR'))))
