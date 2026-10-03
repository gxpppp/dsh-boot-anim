// 校验 lib/boot-anim.js 里的鲸鱼 path 与锚点逐字节一致（CI 同款）。
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const js = fs.readFileSync(path.join(ROOT, 'lib', 'boot-anim.js'), 'utf8')
const m = js.match(/var WHALE = "([^"]+)"/)
const ref = fs.readFileSync(path.join(ROOT, '_verify', 'fish-logo-path.txt'), 'utf8').trim()
const same = m && m[1] === ref
console.log('鲸鱼 path 一致:', same ? 'YES (' + m[1].length + ' 字符)' : 'NO')
process.exit(same ? 0 : 1)
