(function () {
  'use strict';
  if (window.__DSH_ENTER_ANIM__) return;
  window.__DSH_ENTER_ANIM__ = true;

  var KEY = 'dsh-enter-anim-played';
  var STYLE_ID = 'dsh-enter-anim-style';
  var CFG = {
    baseDelay: 90,   // 每层间隔 ms
    duration: 520,   // 单元素时长 ms
    distance: 26,    // 横向位移 px
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)'
  };
  var CSS_TEXT = "@layer dsh-enter-anim {\n  /* 1. 只作用于被标记的 frame，避免污染其它页面 */\n  #root > [data-dsh-enter-ready] > * {\n    transform: translate3d(var(--dsh-enter-x, 0px), var(--dsh-enter-y, 0px), 0);\n    opacity: var(--dsh-enter-o, 1);\n    will-change: transform, opacity;\n  }\n  /* 2. 首帧即入场：浏览器在\"首次样式解析\"阶段就把元素放到起点，不经过中间帧 */\n  @starting-style {\n    #root > [data-dsh-enter-ready] > * {\n      opacity: var(--dsh-enter-o0, 0);\n      transform: translate3d(var(--dsh-enter-x0, 0px), var(--dsh-enter-y0, 0px), 0);\n    }\n  }\n  /* 3. 动画期间禁掉横向滚动条抖动 */\n  html[data-dsh-enter-pending] { overflow-x: clip; }\n}";
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS_TEXT;
    (document.head || document.documentElement).appendChild(s);
  }

  // ---- 第一件事：抢在首帧之前挂上"待入场"状态并注入样式 ----
  if (!sessionStorage.getItem(KEY)) document.documentElement.setAttribute('data-dsh-enter-pending', '');
  injectStyle();

  // ---- 盒子判定：跳过 display:contents 的 slot 锚点与不可见元素 ----
  function box(el) {
    var cs = getComputedStyle(el);
    if (cs.display === 'contents') return null;
    if (cs.display === 'none' || cs.visibility === 'hidden') return null;
    if (parseFloat(cs.opacity) === 0) return null;
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return null;
    return { el: el, r: r };
  }

  function pickFrame() {
    var root = document.getElementById('root');
    if (!root) return null;
    for (var i = 0; i < root.children.length; i++) {
      var k = box(root.children[i]);          // #root 下只有 AppFrame 有盒子
      if (k) return k;
    }
    return null;
  }

  function run() {
    var f = pickFrame();
    if (!f) { document.documentElement.removeAttribute('data-dsh-enter-pending'); return; }

    var W = f.r.width, H = f.r.height, frame = f.el;
    frame.setAttribute('data-dsh-enter-ready', '');

    // ---- 由外向内的 stagger：按水平中心到画面中心的距离排序 ----
    var items = [];
    for (var i = 0; i < frame.children.length; i++) {
      var k = box(frame.children[i]);
      if (!k) continue;
      var cx = k.r.left + k.r.width / 2;
      var side = cx < W * 0.45 ? -1 : (cx > W * 0.55 ? 1 : 0);   // 左列从左侧入、右列从右侧入
      var depth = Math.min(1, Math.abs(cx / W - 0.5) * 2);        // 0 = 画面中心，1 = 最外
      var isBottom = k.r.bottom > f.r.top + H * 0.72 && k.r.height < H * 0.35;
      items.push({
        el: k.el,
        dx: side * CFG.distance * (0.6 + 0.4 * depth),
        dy: isBottom ? 14 : (depth > 0.85 ? 0 : 8),
        delay: CFG.baseDelay * depth + (isBottom ? CFG.baseDelay : 0)
      });
    }
    if (!items.length) { document.documentElement.removeAttribute('data-dsh-enter-pending'); return; }

    // ---- 先把起点写进 CSS 变量，让 @starting-style 有值可用 ----
    items.forEach(function (it) {
      it.el.style.setProperty('--dsh-enter-x0', it.dx + 'px');
      it.el.style.setProperty('--dsh-enter-y0', it.dy + 'px');
      it.el.style.setProperty('--dsh-enter-o0', '0');
      it.el.style.setProperty('--dsh-enter-x', '0px');
      it.el.style.setProperty('--dsh-enter-y', '0px');
      it.el.style.setProperty('--dsh-enter-o', '1');
    });

    function cleanup() {
      sessionStorage.setItem(KEY, '1');
      document.documentElement.removeAttribute('data-dsh-enter-pending');
      frame.removeAttribute('data-dsh-enter-ready');
      items.forEach(function (it) {
        ['--dsh-enter-x0', '--dsh-enter-y0', '--dsh-enter-o0',
         '--dsh-enter-x', '--dsh-enter-y', '--dsh-enter-o'].forEach(function (p) {
          it.el.style.removeProperty(p);
        });
      });
    }

    // ---- 双 rAF：让起始状态先落一次样式，再交给 WAAPI 接管 ----
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.documentElement.removeAttribute('data-dsh-enter-pending');
        var running = items.map(function (it) {
          return it.el.animate(
            [
              { opacity: 0, transform: 'translate3d(' + it.dx + 'px,' + it.dy + 'px,0)' },
              { opacity: 1, transform: 'translate3d(0px,0px,0)' }
            ],
            { duration: CFG.duration, delay: it.delay, easing: CFG.easing, fill: 'backwards' }
          );
        });
        var last = running[running.length - 1];
        if (last) last.finished.then(cleanup, cleanup); else cleanup();
      });
    });
  }

  function boot() {
    if (sessionStorage.getItem(KEY)) { document.documentElement.removeAttribute('data-dsh-enter-pending'); return; }
    if (reduce.matches) {
      sessionStorage.setItem(KEY, '1');
      document.documentElement.removeAttribute('data-dsh-enter-pending');
      return;
    }
    var tries = 0;
    (function wait() {                     // 等 React 把 frame 挂上来
      if (pickFrame()) return run();
      if (++tries > 200) { document.documentElement.removeAttribute('data-dsh-enter-pending'); return; }
      requestAnimationFrame(wait);
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();