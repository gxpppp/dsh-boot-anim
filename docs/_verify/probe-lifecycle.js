window.__R__ = { frames: [], stat: { readyFrames: 0, movedFrames: 0 }, reduce: matchMedia('(prefers-reduced-motion: reduce)').matches };
const R = window.__R__;
const t0 = performance.now();
const boot = document.createElement('script');
boot.src = './anim.js';
(document.head || document.documentElement).appendChild(boot);
(function loop() {
  const fr = document.getElementById('frame');
  const row = { f: R.frames.length + 1, t: +(performance.now() - t0).toFixed(1), kids: fr ? fr.children.length : 0, pending: document.documentElement.hasAttribute('data-dsh-enter-pending') ? 1 : 0, ready: fr && fr.hasAttribute('data-dsh-enter-ready') ? 1 : 0 };
  let moved = false;
  if (fr) row.cells = [...fr.children].map(el => {
    const cs = getComputedStyle(el);
    const m = cs.transform === 'none' ? [1,0,0,1,0,0] : cs.transform.replace('matrix(','').replace(')','').split(',').map(x => +(+x).toFixed(1));
    if (Math.abs(m[4]) > 0.05 || Math.abs(m[5]) > 0.05 || +cs.opacity < 0.999) moved = true;
    return el.id + ':o=' + (+cs.opacity).toFixed(3) + ',x=' + m[4] + ',y=' + m[5];
  });
  if (row.ready) R.stat.readyFrames++;
  if (moved) R.stat.movedFrames++;
  R.frames.push(row);
  if (R.frames.length < 150) requestAnimationFrame(loop); else window.__DONE__ = true;
})();
