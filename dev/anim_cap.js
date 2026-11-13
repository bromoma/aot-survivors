(() => {
  const P = new URLSearchParams(location.search);
  const N = +P.get('n') || 40, step = +P.get('step') || 2, cw = +P.get('cw') || 900, ch = +P.get('ch') || 560;
  const wait = setInterval(() => {
    if (!window.FREEZE || typeof player === 'undefined') return;
    clearInterval(wait);
    if (typeof SND !== 'undefined') SND.setMuted(true);
    const out = [];
    const [c, g] = makeCanvas(cw, ch);
    for (let f = 0; f < N; f++) {
      for (let k = 0; k < step; k++) update(1 / 60);
      render();
      const ox = Math.round(W / 2 - cw / 2), oy = Math.round(H / 2 - ch / 2 + (+P.get('dy') || 0));
      g.clearRect(0, 0, cw, ch);
      g.drawImage(canvas, ox, oy, cw, ch, 0, 0, cw, ch);
      out.push(c.toDataURL('image/png'));
    }
    const pre = document.createElement('pre');
    pre.id = 'frames';
    pre.textContent = out.join('\n');
    document.body.appendChild(pre);
  }, 50);
})();
