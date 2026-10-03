window.__R__ = { marks: [], firstSeen: [], frames: [], reduce: matchMedia('(prefers-reduced-motion: reduce)').matches };
const R = window.__R__;
const t0 = performance.now();
const mark = (k, o) => R.marks.push({ k, t: +(performance.now() - t0).toFixed(2), ...(o || {}) });
const snap = (el, tag) => {
  const cs = getComputedStyle(el);
  const m = cs.transform === 'none' ? [1,0,0,1,0,0] : cs.transform.replace('matrix(','').replace(')','').split(',').map(x => +(+x).toFixed(1));
  return { tag, id: el.id, o: +cs.opacity, x: m[4], y: m[5] };
};
// MutationObserver：捕获 frame 子元素首次出现的瞬间
const mo = new MutationObserver(recs => {
  for (const r of recs) for (const n of r.addedNodes) {
    if (!(n instanceof HTMLElement)) continue;
    if (n.id === 'frame') R.firstSeen.push({ t: +(performance.now() - t0).toFixed(2), ...snap(n, 'frame-itself') });
    else if (n.parentElement && n.parentElement.id === 'frame') R.firstSeen.push({ t: +(performance.now() - t0).toFixed(2), ...snap(n, 'frame-child') });
  }
});
mo.observe(document.documentElement, { childList: true, subtree: true });
const boot = document.createElement('script');
boot.src = './anim.js';
(document.head || document.documentElement).appendChild(boot);
mark('anim-injected', { readyState: document.readyState });
(function loop() {
  const fr = document.getElementById('frame');
  const row = { f: R.frames.length + 1, t: +(performance.now() - t0).toFixed(1), kids: fr ? fr.children.length : 0, pending: document.documentElement.hasAttribute('data-dsh-enter-pending') ? 1 : 0, ready: fr && fr.hasAttribute('data-dsh-enter-ready') ? 1 : 0 };
  if (fr) row.cells = [...fr.children].map(el => { const s = snap(el, ''); return el.id + ':o=' + s.o + ',x=' + s.x + ',y=' + s.y; });
  R.frames.push(row);
  if (R.frames.length < 150) requestAnimationFrame(loop); else window.__DONE__ = true;
})();
