// 录制过场动画的视频，供 README 演示使用。
// 用法：node _verify/record.mjs [应用挂载延迟ms] [录制时长ms]
// 产物：docs/media/boot-anim.webm
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL, fileURLToPath } from 'node:url'

function resolvePlaywright() {
  const req = createRequire(import.meta.url)
  for (const c of [process.env.DSH_PLAYWRIGHT, 'playwright']) {
    if (!c) continue
    try { return pathToFileURL(req.resolve(c)).href } catch { /* next */ }
  }
  throw new Error('需要 playwright：设置 DSH_PLAYWRIGHT 环境变量')
}

const { chromium } = await import(await resolvePlaywright())

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const T = path.join(ROOT, '_verify')
const OUT = path.join(ROOT, 'docs', 'media')
fs.mkdirSync(OUT, { recursive: true })

const APP_DELAY = Number(process.argv[2] || 9000)   // 延迟挂载，让光带有时间展示
const RECORD_MS = Number(process.argv[3] || 9000)   // 录制时长

const css = fs.readFileSync(path.join(ROOT, 'lib', 'boot-anim.css'), 'utf8')
const js = fs.readFileSync(path.join(ROOT, 'lib', 'boot-anim.js'), 'utf8')
const brand = JSON.parse(fs.readFileSync(path.join(ROOT, 'lib', 'brand-wordmark.json'), 'utf8'))

const html = fs.readFileSync(path.join(T, 'harness.html'), 'utf8')
  .replace('globalThis.__INJECTIONS__ = window.__INJECTIONS__ || [];',
    'globalThis.__INJECTIONS__ = ' + JSON.stringify([
      { kind: 'global', name: '__DSH_BRAND_WORDMARK__', value: brand },
      { kind: 'style', text: css },
      { kind: 'script', placement: 'head', text: js },
    ]) + ';')
  .replace('window.__APP_DELAY_MS__ || 1800', String(APP_DELAY))
fs.writeFileSync(path.join(T, 'harness.rec.html'), html, 'utf8')

const rawDir = path.join(T, 'rec-raw')
fs.rmSync(rawDir, { recursive: true, force: true })
fs.mkdirSync(rawDir, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
  recordVideo: { dir: rawDir, size: { width: 1280, height: 800 } },
})
const page = await context.newPage()
await page.goto(pathToFileURL(path.join(T, 'harness.rec.html')).href)
await page.waitForTimeout(RECORD_MS)
await page.close()
await context.close()
await browser.close()

const vids = fs.readdirSync(rawDir).filter((f) => f.endsWith('.webm'))
if (!vids.length) throw new Error('未产出视频')
const src = path.join(rawDir, vids[0])
const dst = path.join(OUT, 'boot-anim.webm')
fs.copyFileSync(src, dst)
console.log('已保存:', dst, fs.statSync(dst).size, 'B')
