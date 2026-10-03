// 检测鲸鱼与字标是否重叠：只在字标开始可见后记录。
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
fs.writeFileSync(path.join(ROOT, '_verify', 'harness.ov.html'), html, 'utf8')

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(pathToFileURL(path.join(ROOT, '_verify', 'harness.ov.html')).href)

const rows = []
const t0 = Date.now()
for (let i = 0; i < 120; i++) {
  const st = await page.evaluate(() => {
    const w = document.querySelector('.ba-whale')
    const mk = document.querySelector('.ba-mark')
    const g = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { l: Math.round(b.x), r: Math.round(b.x + b.width), o: Number(getComputedStyle(el).opacity) } }
    return { w: g(w), mk: g(mk) }
  })
  rows.push({ t: Date.now() - t0, ...st })
  await page.waitForTimeout(60)
}
await browser.close()

// 只挑字标真正可见（opacity > 0.05）且鲸鱼也在场的时刻
console.log('=== 字标可见期间的两者位置与间隙 ===')
console.log('  时刻   鲸鱼范围(move)      字标范围(op)         间隙   判定')
let worst = 999
let overlapFrames = 0
for (const r of rows) {
  if (!r.mk || r.mk.o <= 0.05) continue
  const gap = r.mk.l - r.w.r
  const bad = gap < 0
  if (bad) overlapFrames++
  if (gap < worst) worst = gap
  console.log(`  ${String(r.t).padStart(5)}  ${String(r.w.l + '..' + r.w.r).padEnd(12)}  ${String(r.mk.l + '..' + r.mk.r).padEnd(12)}(${r.mk.o.toFixed(2)})  ${String(gap).padStart(5)}  ${bad ? '❌ 重叠' : '✅'}`)
}
console.log('')
console.log('最小间隙:', worst, 'px | 重叠帧数:', overlapFrames)
console.log(overlapFrames === 0 ? 'OVERLAP = NONE ✅ 已消除' : 'OVERLAP = STILL ❌')
