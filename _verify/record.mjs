// 录制真实动画的视频（Playwright recordVideo），供 README 封面与演示使用。
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
await page.goto(pathToFileURL(path.join(T, 'harness.built.html')).href)
await page.waitForTimeout(7200)          // 覆盖完整 5.6s 动画 + 余量
await page.close()
await context.close()
await browser.close()

const vids = fs.readdirSync(rawDir).filter((f) => f.endsWith('.webm'))
console.log('raw videos:', vids.map((v) => v + ' (' + fs.statSync(path.join(rawDir, v)).size + 'B)').join(', '))
const src = path.join(rawDir, vids[0])
fs.copyFileSync(src, path.join(OUT, 'boot-anim.webm'))
console.log('已保存 webm ->', path.join(OUT, 'boot-anim.webm'))
