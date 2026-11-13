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
      for (let k = 0; k < step; k++) {
        if (P.get('bot')) {
          const t = game.boss || nearestTitan(5000);
          for (const kk of ['KeyW', 'KeyA', 'KeyS', 'KeyD']) keys[kk] = false;
          if (t) {
            const dx = t.x - player.x, dy = t.y - player.y, d = Math.hypot(dx, dy);
            let mx = dx, my = dy;
            if (d < 380) { mx = -dy; my = dx; }
            if (Math.abs(mx) > 60) keys[mx > 0 ? 'KeyD' : 'KeyA'] = true;
            if (Math.abs(my) > 60) keys[my > 0 ? 'KeyS' : 'KeyW'] = true;
            if (d < 700 && (f * step + k) % 20 === 0) engage();
          }
          player.hp = Math.max(player.hp, 3);
          if (state === 'levelup') choose(0);
        }
        update(1 / 60);
      }
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
