/**
 * @local/dsh-boot-anim — client half. 零依赖 IIFE，由 index 注入行原样执行。
 *
 * 分镜：
 *   ① 黑屏
 *   ② 屏幕中央出现鲸鱼
 *   ③ 画面转全黑，两条线由左右两侧向中间延伸
 *   ④ 两条线分别构筑成鲸鱼，并勾出与侧边栏图标一致的轮廓
 *   ⑤ 中央横线向上下两侧展开，画面一分为二
 *   ⑥ 展开同时鲸鱼淡出，露出 DSH 底色 / 已装配皮肤
 *   ⑦ UI 由外向内、环环平移入场
 *
 * 锚点全部是语义化 data-* 属性与结构位置，不含任何 hash 类名。
 */
(function () {
  'use strict'

  var g = globalThis
  if (g.__DSH_BOOT_ANIM__) return
  g.__DSH_BOOT_ANIM__ = true

  /* 与 @deepseek-ai/dsh-client-ui-primitives 的 FISH_LOGO_PATH 逐字节一致。 */
  var WHALE = "M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746L11.1749 14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z"
  var VB_W = 23.16
  var VB_H = 17.04
  var WHALE_PX = 272

  /* 官方字标数据由宿主插件以 global 注入行送来（见 lib/index.js）。
     缺失时过场跳过字标，只播光带与白场，不影响其余分镜。 */
  var BRAND = (typeof globalThis !== 'undefined' && globalThis.__DSH_BRAND_WORDMARK__) || null

  /* 光带几何。渐变按 viewBox 坐标定义（纯文字 viewBox 是 26..182 / 0..24），
     这道渐变沿「左上→右下」方向分布，扫过时与字标掩码求交。 */
  /* 光带几何（viewBox 坐标，纯文字版是 26..182 / 0..24）。
     一条斜向光带从左外侧扫到右外侧；因为方向是「左上→右下」，
     位移的 x 与 y 同号 —— x 走正的、y 也走正的，视觉上就是从左上掠向右下。 */
  var SHEEN_X0 = 0            // 光带左边缘的起始 x（会被 translate 推着走）
  var SHEEN_Y0 = -60          // 起点在字标上方
  var T_SHEEN_BAND = 70       // 光带宽度（viewBox 单位）
  var T_SHEEN_H = 144         // 光带高度，需盖住整段字标
  var SHEEN_FROM = 0          // 起始位移：仍在字标左侧之外
  var SHEEN_FROMY = 0
  var SHEEN_TO = 220          // 结束位移：越过字标右缘
  var SHEEN_TOY = 100         // 与 x 同向 → 斜向「左上→右下」

  /* 动效令牌。数值出处见 docs/01-方案检索清单.md 的 B2 / B6 / B7：
     - ENTER：emilkowalski/skills 的 --ease-out「strong ease-out for UI」
     - IN_OUT：emilkowalski/skills 的 --ease-in-out「on-screen movement」
     - 时长与位移：joepUI/motion-ref-skill 13.7（横向滑入 250-400ms、20-40px）
       + 13.5（stagger 60ms、总时长 <800ms）
     - 原则：mblode/agent-skills 的「Never ease-in on UI」「禁动布局属性」
       「入场比出场长 30-50%」。 */
  var T = {
    ENTER: 'cubic-bezier(0.23, 1, 0.32, 1)',
    IN_OUT: 'cubic-bezier(0.77, 0, 0.175, 1)',
    DRAW: 'cubic-bezier(0.22, 1, 0.36, 1)',
    WAIT: 220,
    REVEAL: 620,
    WHALE_OUT: 240,
    LINES: 600,
    LINES_DELAY: 200,
    BUILD_DELAY: 60,
    UNFLATTEN: 1180,
    STROKE: 1280,
    STROKE_DELAY: 140,
    SEAM_IN: 260,
    CURTAIN: 900,
    CURTAIN_DELAY: 260,
    COL: 460,
    COL_DIST: 40,
    INNER: 380,
    INNER_DIST: 26,
    DEEP: 320,
    DEEP_DIST: 16,
    COL_STEP: 70,
    INNER_STEP: 60,
    DEEP_STEP: 40,
    /* 过场：鲸鱼淡出后重组，左移让位给字标，字标浮现；等待期播斜光带。
       数值对齐既有量级 —— 左移时长同 REVEAL，字标浮现时长同 COL。 */
    MARK_OUT: 240,
    REFORM: 300,
    WHALE_SHIFT: 620,
    WHALE_SHIFT_PX: 180,
    MARK_IN_DELAY: 180,      // 保留：仅用于没有左移动作时的兜底
    MARK_ENTER_AFTER: 0.82,  // 字标在鲸鱼左移到多少比例时开始浮现
    MARK_IN: 520,
    MARK_DIST: 24,
    MARK_DIM: 0.22,        // 加载期间字标的压暗程度；越暗扫光对比越强
    MARK_DIM_FADE: 260,    // 压暗的过渡时长，避免入场结束瞬间跳变
    MARK_EXIT: 320,
    SHEEN_OUT: 260,
    MARK_H: 0.046,
    MARK_MAX_H: 64,
    MARK_GAP: 44,
    SHEEN: 1100,
    SHEEN_GAP: 420,
    SHEEN_BAND: 220,
    SHEEN_ANGLE: 18,
  }

  var reduced = false
  try { reduced = matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) {}

  /* ---------- 小工具 ---------- */
  function wait(ms) { return new Promise(function (r) { setTimeout(r, Math.max(0, ms)) }) }

  function play(el, frames, opts) {
    if (!el || typeof el.animate !== 'function') return null
    var options = { fill: 'both', easing: T.ENTER }
    for (var k in (opts || {})) options[k] = opts[k]
    try { return el.animate(frames, options) } catch (e) { return null }
  }

  /** 立即取消一个动画（用于中断循环播放的光带）。 */
  function stopAnim(a) {
    if (!a) return
    try { a.cancel() } catch (e) {}
  }

  function settle(a) {
    if (!a) return Promise.resolve()
    try { return a.finished.catch(function () {}) } catch (e) { return Promise.resolve() }
  }

  function label(el, on) {
    if (on) el.setAttribute('data-ba-anim', '')
    else el.removeAttribute('data-ba-anim')
  }

  /* ---------- 舞台 ---------- */
  var HALF = VB_W / 2
  var stage = document.createElement('div')
  stage.setAttribute('data-dsh-boot-anim', '')
  stage.setAttribute('aria-hidden', 'true')
  stage.innerHTML =
    '<div class="ba-curtain ba-top"></div>' +
    '<div class="ba-curtain ba-bottom"></div>' +
    '<div class="ba-seam"></div>' +
    '<div class="ba-line ba-line-l"></div>' +
    '<div class="ba-line ba-line-r"></div>' +
    '<svg class="ba-whale" width="' + WHALE_PX + '" height="' + (WHALE_PX * VB_H / VB_W).toFixed(1) +
      '" viewBox="0 0 ' + VB_W + ' ' + VB_H + '" fill="none" aria-hidden="true">' +
      '<defs>' +
        '<clipPath id="ba-clip-l" clipPathUnits="userSpaceOnUse">' +
          '<rect x="-1" y="-1" width="' + (HALF + 1) + '" height="' + (VB_H + 2) + '"/></clipPath>' +
        '<clipPath id="ba-clip-r" clipPathUnits="userSpaceOnUse">' +
          '<rect x="' + HALF + '" y="-1" width="' + (HALF + 1) + '" height="' + (VB_H + 2) + '"/></clipPath>' +
      '</defs>' +
      '<g class="ba-whale-g">' +
        '<path class="ba-p ba-p-l" pathLength="1" clip-path="url(#ba-clip-l)" d="' + WHALE + '"/>' +
        '<path class="ba-p ba-p-r" pathLength="1" clip-path="url(#ba-clip-r)" d="' + WHALE + '"/>' +
      '</g>' +
    '</svg>' +
    '<svg class="ba-mark" viewBox="' + (BRAND ? BRAND.viewBox : '26 0 156 24') + '" fill="none" aria-hidden="true">' +
      (BRAND ? BRAND.parts.map(function (seg, i) {
        if (seg.t === 'rect') {
          return '<rect x="' + seg.x + '" y="' + seg.y + '" width="' + seg.width + '" height="' + seg.height +
            '" rx="' + seg.rx + '" fill="' + (seg.c === 'inv' ? 'var(--ba-ink)' : 'currentColor') + '"/>'
        }
        return '<path d="' + seg.d + '" fill="' + (seg.c === 'inv' ? 'var(--ba-ink)' : 'currentColor') + '"/>'
      }).join('') : '') +
    '</svg>' +
    /* 光带层的工作原理：字标本体在 .ba-mark 里，这一层与之同形、纯白高亮，
       但被一道「移动的光带」遮罩裁切 —— 只有光带扫过的部分才高亮出来。
       这样得到的是「一道亮带掠过字面」，而不是「白色叠白色」（后者什么也看不见）。 */
    '<svg class="ba-sheen" viewBox="' + (BRAND ? BRAND.viewBox : '26 0 156 24') + '" fill="none" aria-hidden="true">' +
      '<defs>' +
        '<linearGradient id="ba-band-grad" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#fff" stop-opacity="0"/>' +
          '<stop offset="0.34" stop-color="#fff" stop-opacity="0"/>' +
          '<stop offset="0.5" stop-color="#fff" stop-opacity="1"/>' +
          '<stop offset="0.66" stop-color="#fff" stop-opacity="0"/>' +
          '<stop offset="1" stop-color="#fff" stop-opacity="0"/>' +
        '</linearGradient>' +
        '<mask id="ba-sheen-mask" maskUnits="userSpaceOnUse">' +
          '<rect class="ba-sheen-band" x="' + SHEEN_X0 + '" y="' + SHEEN_Y0 +
            '" width="' + T_SHEEN_BAND + '" height="' + T_SHEEN_H + '" fill="url(#ba-band-grad)"/>' +
        '</mask>' +
      '</defs>' +
      '<g mask="url(#ba-sheen-mask)">' +
        (BRAND ? BRAND.parts.map(function (seg) {
          if (seg.t === 'rect') {
            return '<rect x="' + seg.x + '" y="' + seg.y + '" width="' + seg.width + '" height="' + seg.height +
              '" rx="' + seg.rx + '" fill="#fff"/>'
          }
          return '<path d="' + seg.d + '" fill="#fff"/>'
        }).join('') : '') +
      '</g>' +
    '</svg>'

  var q = function (sel) { return stage.querySelector(sel) }
  var curtainTop = q('.ba-top')
  var curtainBottom = q('.ba-bottom')
  var seam = q('.ba-seam')
  var lineL = q('.ba-line-l')
  var lineR = q('.ba-line-r')
  var whale = q('.ba-whale')
  var whaleG = q('.ba-whale-g')
  var pL = q('.ba-p-l')
  var pR = q('.ba-p-r')
  var mark = q('.ba-mark')
  var sheen = q('.ba-sheen')
  var sheenBand = q('.ba-sheen-band')

  /* ---------- 过场辅助 ---------- */

  /** 视口居中坐标，供字标定位使用。 */
  function centre() {
    return { x: innerWidth / 2, y: innerHeight / 2 }
  }

  /**
   * 后端是否已经就绪。与 appReady 同义，但额外识别「加载失败」——
   * 内建加载页失败时会在 [data-dsh-boot] 内部渲染失败文案，此时后端不会再就绪。
   */
  function bootFailed() {
    var el = document.getElementById('root')
    if (!el) return false
    var page = el.querySelector('[data-dsh-boot]')
    if (!page) return false
    var txt = page.textContent || ''
    return /Failed to load|加载失败/i.test(txt)
  }

  /**
   * 等后端就绪。不设上限 —— 后端一直未完成就继续等，由光带负责说明进度。
   * @param onTick - 每帧回调，用于驱动光带
   * @returns 就绪返回 true；检测到加载失败返回 false
   */
  function waitAppForever(onTick) {
    return new Promise(function (resolve) {
      ;(function poll() {
        if (appReady()) { resolve(true); return }
        if (bootFailed()) { resolve(false); return }
        if (onTick) onTick()
        requestAnimationFrame(poll)
      })()
    })
  }

  /** 字标压暗用的动画句柄（WAAPI，优先级高于内联样式）。 */
  var markDim = null

  /** 反复播放斜向光带，直到返回的停止函数被调用。 */
  function startSheen() {
    if (!sheen || !sheenBand) return function () {}
    var stopped = false
    var run = null
    /* 压暗字标本体，让掠过的光带有对比可循。
       必须用 WAAPI 而不是改样式：.ba-mark 上的入场动画带 fill:'forwards'，
       它的动画值优先级高于内联样式与类选择器 —— 实测 inline 写 0.22、
       computed 仍读 1。只有再叠一个 WAAPI 动画才能压下去。
       用 composite:'replace' 覆盖（默认值），duration 给到足够长以覆盖整个等待期。 */
    /* 从当前不透明度柔和过渡到压暗值 —— 直接跳到 0.22 会在字标刚淡入到全白后
       「啪」一下变暗，比不压暗还扎眼。给一段过渡让它自然沉下去。 */
    if (mark) markDim = play(mark, [{ opacity: 1 }, { opacity: T.MARK_DIM }],
      { duration: T.MARK_DIM_FADE, easing: T.IN_OUT, fill: 'forwards' })
    play(sheen, [{ opacity: 0 }, { opacity: 1 }], { duration: 260, easing: T.ENTER, fill: 'forwards' })
    ;(function loop() {
      if (stopped) return
      run = play(sheenBand, [
        { transform: 'translate(' + SHEEN_FROM + 'px,' + SHEEN_FROMY + 'px)' },
        { transform: 'translate(' + SHEEN_TO + 'px,' + SHEEN_TOY + 'px)' },
      ], { duration: T.SHEEN, easing: 'linear', fill: 'forwards' })
      var chain = settle(run).then(function () {
        if (stopped) return
        return wait(T.SHEEN_GAP).then(loop)
      })
      void chain
    })()
    return function () {
      stopped = true
      stopAnim(run)
      /* 收束：撤掉压暗动画，字标恢复入场动画的终值（满亮）；光带退场 */
      if (markDim) { stopAnim(markDim); markDim = null }
      if (mark) mark.classList.remove('is-loading')
      play(sheen, [{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: T.IN_OUT })
    }
  }

  var html = document.documentElement
  var bootPage = document.querySelector('[data-dsh-boot]')
  var prevOverflow = ''

  /* 内建加载页在整个分镜期间让位；分镜结束后原样归还。 */
  function hideBootPage(hide) {
    if (!bootPage) return
    if (hide) {
      bootPage.style.setProperty('opacity', '0', 'important')
      bootPage.style.setProperty('pointer-events', 'none', 'important')
    } else {
      bootPage.style.removeProperty('opacity')
      bootPage.style.removeProperty('pointer-events')
    }
  }

  /* ---------- 分镜 ---------- */

  /* ①② 黑屏 → 中央出现鲸鱼。 */
  function shot12() {
    return settle(play(whale, [
      { opacity: 0, transform: 'translate(-50%,-50%) scale(.86)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }
    ], { duration: T.REVEAL, delay: T.WAIT, easing: T.ENTER }))
  }

  /* ③ 鲸鱼退场，两条线由两侧向中间延伸。 */
  function shot3(done) {
    settle(play(whale, [
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' },
      { opacity: 0, transform: 'translate(-50%,-50%) scale(1.04)' }
    ], { duration: T.WHALE_OUT, easing: T.IN_OUT }))
    play(lineL, [{ opacity: 1, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)' }],
      { duration: T.LINES, delay: T.LINES_DELAY, easing: T.IN_OUT })
    return settle(play(lineR, [{ opacity: 1, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)' }],
      { duration: T.LINES, delay: T.LINES_DELAY, easing: T.IN_OUT }))
  }

  /* ④ 两条线分别构筑成鲸鱼：压扁的鲸鱼纵向展开，两半轮廓同时勾出。 */
  function shot4() {
    whale.style.opacity = '1'
    play(lineL, [{ opacity: 1 }, { opacity: 0 }], { duration: T.SEAM_IN, easing: T.IN_OUT })
    play(lineR, [{ opacity: 1 }, { opacity: 0 }], { duration: T.SEAM_IN, easing: T.IN_OUT })

    play(whale, [
      { opacity: 0, transform: 'translate(-50%,-50%) scale(.92)' },
      { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }
    ], { duration: 280, easing: T.ENTER })

    play(whaleG, [
      { transform: 'scaleY(0.018)' },
      { transform: 'scaleY(1)' }
    ], { duration: T.UNFLATTEN, delay: T.BUILD_DELAY, easing: T.DRAW })

    var a = play(pL, [{ strokeDashoffset: -1 }, { strokeDashoffset: 0 }],
      { duration: T.STROKE, delay: T.STROKE_DELAY, easing: T.DRAW })
    var b = play(pR, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
      { duration: T.STROKE, delay: T.STROKE_DELAY, easing: T.DRAW })
    return Promise.all([settle(a), settle(b)])
  }

  /* ---------- 过场：鲸鱼淡出重组 → 左移让位 → 字标浮现 → 光带等待 → 白场 ---------- */

  /**
   * 缓冲过场。插在「轮廓勾勒完成」与「横线展开」之间。
   *
   * 时序：
   *   ① 鲸鱼淡出 → ② 重新组合 → ③ 左移让出中央 → ④ 官方字标浮现 →
   *   ⑤ 后端未就绪则循环播放斜向光带 → ⑥ 字标退场、画面铺白
   *
   * @returns 后端是否正常就绪（false 表示检测到加载失败）
   */
  function interlude() {
    /* ① 淡出（前一段已收笔，这里显式补一次，保证无论从哪个状态进入都成立） */
    play(whale, [{ opacity: 1 }, { opacity: 0 }], { duration: T.MARK_OUT, easing: T.IN_OUT })

    /* ② 重新组合：淡出后重新出现，为左移建立起点 */
    var reform = play(whale, [{ opacity: 0 }, { opacity: 1 }],
      { duration: T.REFORM, delay: T.MARK_OUT, easing: T.ENTER, fill: 'forwards' })

    /* ③④ 鲸鱼左移让位、字标浮现。
       位移不写死：先按视口定出字标高度，再实测鲸鱼宽度，算出「鲸鱼 + 间距 + 字标」
       这一组居中时鲸鱼该在的位置，从而在任何视口下都不重叠。 */
    var vw = (typeof innerWidth === 'number' && innerWidth) || 1280
    var markH = Math.max(22, Math.min(T.MARK_MAX_H, Math.round(vw * T.MARK_H)))
    var markW = markH * ((BRAND && BRAND.ratio) || 6.5)
    var whaleW = whale ? whale.getBoundingClientRect().width || WHALE_PX : WHALE_PX
    var groupW = whaleW + T.MARK_GAP + markW
    /* 太挤时整体收缩字标，避免小屏上把鲸鱼挤出画面 */
    if (groupW > vw * 0.92) {
      var scale = (vw * 0.92 - whaleW - T.MARK_GAP) / markW
      if (scale > 0.4) { markH = Math.round(markH * scale); markW = markH * ((BRAND && BRAND.ratio) || 6.5) }
    }
    /* 鲸鱼中心相对视口中心的偏移 = -(组宽/2) + 鲸鱼半宽 = -(字标宽 + 间距)/2 */
    var shift = -(markW + T.MARK_GAP) / 2

    play(whale, [
      { transform: 'translate(-50%,-50%) translateX(0)' },
      { transform: 'translate(-50%,-50%) translateX(' + shift.toFixed(1) + 'px)' },
    ], { duration: T.WHALE_SHIFT, delay: T.MARK_OUT + T.REFORM, easing: T.ENTER, fill: 'forwards' })

    /* 字标要等鲸鱼左移到接近终态才浮现，否则会叠在还停在中央的鲸鱼身上。
       取左移时长的 82%：此时鲸鱼已让出绝大部分空间，字标再淡入就不会重叠，
       同时两个动作仍有短暂的交叠，不会显得脱节。 */
    var markDelay = T.MARK_OUT + T.REFORM + Math.round(T.WHALE_SHIFT * T.MARK_ENTER_AFTER)

    var markDone = null
    if (mark && BRAND) {
      /* 设在舞台上而非 mark 上：.ba-sheen 是它的兄弟节点，只有父级变量才能被两层同时继承 */
      stage.style.setProperty('--ba-mark-h', markH + 'px')
      /* 字标出现在鲸鱼右侧，与鲸鱼同属一组，整体居中。
         光带层是字标的同形副本，必须套用完全相同的位移，
         否则两层错位 —— 光带会裁在空处，字面上看不到扫光。 */
      var markShift = (whaleW + T.MARK_GAP) / 2
      var markFrom = 'translate(-50%,-50%) translate(' + markShift.toFixed(1) + 'px,' + T.MARK_DIST + 'px)'
      var markTo = 'translate(-50%,-50%) translate(' + markShift.toFixed(1) + 'px,0)'
      /* 光带层不做入场位移（它是遮罩载体，跟着字标最终位置即可） */
      var sheenAt = 'translate(-50%,-50%) translate(' + markShift.toFixed(1) + 'px,0)'
      if (sheen) sheen.style.transform = sheenAt

      markDone = play(mark, [
        { opacity: 0, transform: markFrom },
        { opacity: 1, transform: markTo },
      ], { duration: T.MARK_IN, delay: markDelay, easing: T.ENTER, fill: 'forwards' })
    }

    /* ⑤ 等后端。光带只在这一阶段登场。
       关键：入场的两个动作（左移、字标浮现）必须先播完，
       否则后端一快，字标就会在自己的收束逻辑里被截断 —— 表现为「一闪而过」甚至看不到。
       因此先 await 入场结束，再判定就绪。 */
    var stopSheen = null
    /* 入场总时长 = max(鲸鱼左移结束, 字标浮现结束) —— 两者现在有先后关系，取后者。 */
    var entranceMs = Math.max(
      T.MARK_OUT + T.REFORM + T.WHALE_SHIFT,
      markDelay + T.MARK_IN,
    )
    var entered = Promise.all([settle(markDone), wait(entranceMs)])

    var gate = entered.then(function () {
      if (appReady()) return true
      stopSheen = startSheen()
      return waitAppForever()
    })

    return gate.then(function (ok) {
      if (stopSheen) stopSheen()
      /* ⑥ 字标与光带退场。
         不另铺白场：需求里「展开后画面变为白色」与 ⑤⑥ 的「展开露出皮肤」是同一个动作
         —— DSH 界面本身就是白的。多铺一层白会在黑幕与 UI 之间插出一次
         「黑 → 白 → 黑 → UI」的闪烁，与「衔接无跳变」的验收标准相悖。 */
      if (markDone) play(mark, [{ opacity: 1 }, { opacity: 0 }], { duration: T.MARK_EXIT, easing: T.IN_OUT })
      if (sheen) play(sheen, [{ opacity: 1 }, { opacity: 0 }], { duration: T.SHEEN_OUT, easing: T.IN_OUT })
      /* 退场也要让完，再交回横线展开 */
      return wait(T.MARK_EXIT).then(function () { return ok })
    })
  }

  /* ⑤⑥ 中央横线展开，两片黑幕向上下退场，鲸鱼缓缓消失，露出皮肤。 */
  function shot56() {
    play(seam, [{ opacity: 1, transform: 'scaleX(0)' }, { opacity: 1, transform: 'scaleX(1)' }],
      { duration: T.SEAM_IN, easing: T.ENTER })
    play(whale, [{ opacity: 1 }, { opacity: 0 }], { duration: T.CURTAIN, delay: T.CURTAIN_DELAY, easing: T.IN_OUT })
    play(seam, [{ opacity: 1 }, { opacity: 0 }], { duration: 460, delay: 420, easing: T.IN_OUT })

    var a = play(curtainTop, [{ height: '50%' }, { height: '0%' }],
      { duration: T.CURTAIN, delay: T.CURTAIN_DELAY, easing: T.IN_OUT })
    var b = play(curtainBottom, [{ height: '50%' }, { height: '0%' }],
      { duration: T.CURTAIN, delay: T.CURTAIN_DELAY, easing: T.IN_OUT })
    return Promise.all([settle(a), settle(b)])
  }

  /* ---------- ⑦ UI 由外向内、环环平移入场 ---------- */

  function box(el) {
    try { return el.getBoundingClientRect() } catch (e) { return null }
  }

  /** 应用主框架：三列 grid 容器，其直接子节点中含 [data-shell-overlay]。 */
  function findFrame() {
    var overlay = document.querySelector('[data-shell-overlay]')
    var frame = overlay && overlay.parentElement
    if (frame && frame.children.length >= 3) return frame
    var root = document.getElementById('root')
    if (!root) return null
    var divs = root.querySelectorAll('div')
    for (var i = 0; i < divs.length; i++) {
      var s = divs[i].style && divs[i].style.gridTemplateColumns
      if (s && s.indexOf('px') >= 0 && divs[i].children.length >= 3) return divs[i]
    }
    return null
  }

  /** 按三列容器中的横向次序把子节点判定为 侧栏 / 中列 / 右栏。 */
  function classifyKhf(frame) {
    var kids = []
    for (var i = 0; i < frame.children.length; i++) {
      var el = frame.children[i]
      if (el.hasAttribute('data-shell-overlay') || el.hasAttribute('data-shell-leading')) continue
      var r = box(el)
      if (!r || r.width < 24 || r.height < 24) continue
      kids.push({ el: el, left: r.left, width: r.width })
    }
    kids.sort(function (a, b) { return a.left - b.left })
    return kids
  }

  /**
   * 收集 root 子树里"真正有盒子"的块。
   * [data-slot] 锚点与若干包裹层是 display:contents（无盒子、不可动画），
   * 它们会被穿透下钻，但只收藏第一个有盒子的元素，以保持层级感。
   * @param root - 起点
   * @param max - 最多收集几个
   * @param minW - 最小宽度
   * @param minH - 最小高度
   * @param maxDepth - 最多下钻几层
   * @returns 有盒子的元素
   */
  function collectBlocks(root, max, minW, minH, maxDepth) {
    var out = []
    function walk(node, depth) {
      for (var i = 0; i < node.children.length && out.length < max; i++) {
        var el = node.children[i]
        if (el.hasAttribute('data-dsh-boot-anim')) continue
        var r = box(el)
        if (r && r.width >= minW && r.height >= minH) { out.push(el); continue }
        if (depth < maxDepth) walk(el, depth + 1)
      }
    }
    walk(root, 0)
    return out
  }

  function wave(items, opt) {
    var runs = []
    for (var i = 0; i < items.length; i++) {
      var el = items[i]
      if (!el) continue
      var d = opt.dist
      var dx = 0
      var dy = 0
      if (opt.dir === 'left') dx = -d
      else if (opt.dir === 'right') dx = d
      else if (opt.dir === 'up') dy = -d
      else dy = d
      label(el, true)
      runs.push(settle(play(el, [
        { opacity: 0, transform: 'translate3d(' + dx + 'px,' + dy + 'px,0)' },
        { opacity: 1, transform: 'translate3d(0,0,0)' }
      ], {
        duration: opt.duration,
        delay: (opt.delay || 0) + i * opt.step,
        easing: T.ENTER
      })))
    }
    return Promise.all(runs)
  }

  /** 环环内移：每一列自身先入场，随后是它的直接子块，再是更内层的 slot 内容。 */
  function shot7() {
    var frame = findFrame()
    if (!frame) return Promise.resolve()

    var cols = classifyKhf(frame)
    var inner = []
    var deeper = []
    for (var i = 0; i < cols.length; i++) {
      var el = cols[i].el
      /* 第二层：本列内的主块。第三层：主块内的内容块。
         两层都用 collectBlocks 穿透 display:contents 的锚点与包裹层。 */
      var blocks = collectBlocks(el, 3, 80, 48, 3)
      for (var j = 0; j < blocks.length; j++) {
        inner.push(blocks[j])
        var sub = collectBlocks(blocks[j], 4, 80, 40, 2)
        for (var k = 0; k < sub.length; k++) deeper.push(sub[k])
      }
    }

    /* 由外向内：左栏从左侧滑入、右栏从右侧滑入、中列自下浮起；
       随后是各列的直接子块，再是更内层的 slot 块。三层共用 ENTER 曲线。 */
    if (g.__DSH_BOOT_ANIM_DEBUG__) console.info('[boot-anim] shot7 目标数', { cols: cols.length, inner: inner.length, deeper: deeper.length })
    var dirs = ['left', 'up', 'right']
    var runs = []
    for (var n = 0; n < cols.length; n++) {
      runs.push(wave([cols[n].el], {
        dir: dirs[n] || 'up', dist: T.COL_DIST, duration: T.COL, step: 0, delay: n * T.COL_STEP,
      }))
    }
    return Promise.all(runs).then(function () {
      return wave(inner, { dir: 'up', dist: T.INNER_DIST, duration: T.INNER, step: T.INNER_STEP, delay: 0 })
    }).then(function () {
      return wave(deeper, { dir: 'up', dist: T.DEEP_DIST, duration: T.DEEP, step: T.DEEP_STEP, delay: 0 })
    })
  }

  /* ---------- 应用就绪闸门 ---------- */

  function appReady() {
    if (document.querySelector('[data-shell-overlay]')) return true
    var root = document.getElementById('root')
    if (!root) return false
    for (var i = 0; i < root.children.length; i++) {
      var c = root.children[i]
      if (c.hasAttribute('data-dsh-boot')) continue
      var r = box(c)
      if (r && r.width > 320 && r.height > 240) return true
    }
    return false
  }

  function waitApp(deadlineMs) {
    var end = Date.now() + deadlineMs
    return new Promise(function (resolve) {
      ;(function poll() {
        if (appReady()) { resolve(true); return }
        if (Date.now() >= end) { resolve(false); return }
        requestAnimationFrame(poll)
      })()
    })
  }

  /* ---------- 跳过 ---------- */

  var skipping = false
  var onSkip = null
  function requestSkip() {
    if (skipping) return
    skipping = true
    if (onSkip) onSkip()
  }

  /* ---------- 收尾 ---------- */

  function teardown() {
    hideBootPage(false)
    if (prevOverflow !== '') html.style.overflow = prevOverflow
    else html.style.removeProperty('overflow')
    var stray = document.querySelectorAll('[data-ba-anim]')
    for (var i = 0; i < stray.length; i++) stray[i].removeAttribute('data-ba-anim')
    if (stage.parentNode) stage.parentNode.removeChild(stage)
    document.removeEventListener('keydown', requestSkip, true)
    document.removeEventListener('pointerdown', requestSkip, true)
    document.removeEventListener('wheel', requestSkip, true)
  }

  /* ---------- 主流程 ---------- */

  function run() {
    if (reduced) { teardown(); return }

    prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    document.body.appendChild(stage)
    hideBootPage(true)

    document.addEventListener('keydown', requestSkip, true)
    document.addEventListener('pointerdown', requestSkip, true)
    document.addEventListener('wheel', requestSkip, true)

    /* 兜底：任何一环卡死都不得把界面永久压在黑幕下。 */
    var guard = setTimeout(function () { requestSkip() }, 20000)

    var fast = false
    onSkip = function () { fast = true }

    ;(async function () {
      try {
        await shot12()
        if (fast) return
        await shot3()
        if (fast) return
        await shot4()
        if (fast) return

        /* ④ 收笔 → 缓冲过场。
           过场自己负责就绪判定，且不设上限：后端一直没完成就一直播光带。
           ok=false 表示检测到插件加载失败 —— 此时同样先播完整段过场再收尾。 */
        var ok = await interlude()
        if (fast) return

        if (ok) {
          /* 正常路径：横线展开 → 露出皮肤 → UI 环环入场 */
          await shot56()
        } else {
          /* 失败路径：白场already 铺满，直接撤场，让内建加载页的失败提示露出来。
             不播 ⑤⑥，因为后端没有可展示的界面。 */
          if (g.console && console.info) console.info('[boot-anim] 后端加载失败：过场结束后直接展示错误提示')
        }
      } catch (e) {
        if (g.console && console.warn) console.warn('[boot-anim] staged animation aborted', e)
      } finally {
        clearTimeout(guard)
        onSkip = null
        teardown()
      }
      try { await shot7() } catch (e) {} finally {
        var stray = document.querySelectorAll('[data-ba-anim]')
        for (var i = 0; i < stray.length; i++) stray[i].removeAttribute('data-ba-anim')
      }
    })()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true })
  else run()
})()
