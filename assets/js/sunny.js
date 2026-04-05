(() => {
  const layer = document.getElementById('scene-layer');
  if (!layer) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:multiply;opacity:0;transition:opacity 0.3s ease;will-change:transform;';
  layer.appendChild(canvas);
  const X = canvas.getContext('2d');

  let active = false, raf = null, W, H, lastDraw = 0;
  const FRAME_INTERVAL = 66; // ~15 FPS — light beam barely moves
  const offCache = {};

  // --- Leaves ---
  const leaves = [];
  const LEAF_COUNT = 12;
  function spawnLeaf(fresh) {
    return {
      x: Math.random() * (W + 200) - 100,
      y: fresh ? Math.random() * H : -30 - Math.random() * 100,
      size: 8 + Math.random() * 18, speed: 1.2 + Math.random() * 1.8,
      drift: 0.6 + Math.random() * 1.2, wobblePhase: Math.random() * Math.PI * 2,
      wobbleAmp: 0.8 + Math.random() * 2, wobbleSpeed: 0.5 + Math.random() * 0.8,
      rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.03,
      alpha: 0.04 + Math.random() * 0.08, aspect: 0.5 + Math.random() * 0.3,
    };
  }
  function initLeaves() { leaves.length = 0; for (let i = 0; i < LEAF_COUNT; i++) leaves.push(spawnLeaf(true)); }

  function fit() {
    const dpr = devicePixelRatio || 1;
    const newW = innerWidth, newH = innerHeight;
    if (newW === W && newH === H) return;
    W = newW; H = newH;
    canvas.width = W * dpr; canvas.height = H * dpr;
    X.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastDraw = 0; // force immediate redraw after resize
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function getOff(key, w, h) {
    const c = offCache[key];
    if (c && c.width === w && c.height === h) return c;
    const nc = document.createElement('canvas'); nc.width = w; nc.height = h;
    offCache[key] = nc; return nc;
  }

  function draw(now) {
    if (!active) return;
    raf = requestAnimationFrame(draw);

    // Throttle heavy beam rendering
    if (now - lastDraw < FRAME_INTERVAL) return;
    lastDraw = now;

    X.clearRect(0, 0, W, H);
    const period = 120000, phase = (now % (period * 2)) / period;
    const t = (phase < 1 ? phase : 2 - phase) * 0.1;
    const open = 0.5 + Math.sin(now * 0.00006) * 0.04 + Math.sin(now * 0.00015) * 0.02;
    const n = t / 0.35;

    const sr = 228 + (6 * n) | 0, sg = 214 + (10 * n) | 0, sb = 196 + (14 * n) | 0;
    const wg = 215 + (15 * n) | 0, wb = 155 + (35 * n) | 0;
    const skewX = lerp(0.34, 0.26, n), skewY = lerp(0.13, 0.09, n);
    const stretch = lerp(1.9, 1.6, n), warmAlpha = lerp(0.28, 0.17, n), baseSoft = lerp(12, 7, n);

    X.fillStyle = `rgb(${sr},${sg},${sb})`;
    X.fillRect(0, 0, W, H);

    const projW = Math.min(W * 0.58, 420) * stretch;
    const projH = Math.min(H * 0.72, 500) * stretch * 0.78;
    const bx = Math.sin(now * 0.00009) * 5 + Math.sin(now * 0.00025) * 2.5;
    const by = Math.cos(now * 0.00011) * 3.5 + Math.cos(now * 0.00022) * 1.8;
    const px = lerp(W * 0.01, W * 0.06, n) + bx, py = lerp(H * 0.01, H * 0.03, n) + by;
    const frameT = lerp(10, 7, n);
    const numSlats = 18, innerH = projH - frameT * 2, spacing = innerH / numSlats;
    const slatThick = spacing * lerp(0.88, 0.12, open), gapH = spacing - slatThick;
    if (gapH < 0.3) return;

    X.save(); X.translate(px, py); X.transform(1, skewY, skewX, 1, 0, 0);

    const offW = Math.ceil(projW + 80), offH = Math.ceil(projH + 80);
    const OC = getOff('off', offW, offH), OX = OC.getContext('2d');
    OX.clearRect(0, 0, offW, offH);

    for (let i = 0; i < numSlats; i++) {
      const baseY = frameT + i * spacing + slatThick;
      const wb2 = Math.sin(now * 0.00008 + i * 0.53) * 1.1 + Math.sin(now * 0.00019 + i * 0.79) * 0.6;
      const sy = baseY + wb2, padY = baseSoft * (0.55 + i / numSlats) * 1.2;
      const slatAlpha = 1 - Math.abs(i - 9) / 9 * 0.1;
      const r = padY / (gapH + padY * 2);
      const g = OX.createLinearGradient(0, sy - padY, 0, sy + gapH + padY);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(r, `rgba(255,255,255,${slatAlpha})`);
      g.addColorStop(1 - r, `rgba(255,255,255,${slatAlpha})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      OX.fillStyle = g; OX.fillRect(frameT, sy - padY, projW - frameT * 2, gapH + padY * 2);
    }

    // Vignettes
    OX.globalCompositeOperation = 'destination-in';
    let gv = OX.createLinearGradient(frameT, 0, projW - frameT, 0);
    gv.addColorStop(0, 'rgba(255,255,255,0.1)'); gv.addColorStop(0.06, 'rgba(255,255,255,0.55)');
    gv.addColorStop(0.15, 'rgba(255,255,255,1)'); gv.addColorStop(0.5, 'rgba(255,255,255,1)');
    gv.addColorStop(0.72, 'rgba(255,255,255,0.8)'); gv.addColorStop(0.85, 'rgba(255,255,255,0.35)');
    gv.addColorStop(0.94, 'rgba(255,255,255,0.12)'); gv.addColorStop(1, 'rgba(255,255,255,0.02)');
    OX.fillStyle = gv; OX.fillRect(0, 0, offW, offH);
    gv = OX.createLinearGradient(0, frameT, 0, projH - frameT);
    gv.addColorStop(0, 'rgba(255,255,255,0.08)'); gv.addColorStop(0.05, 'rgba(255,255,255,0.6)');
    gv.addColorStop(0.12, 'rgba(255,255,255,1)'); gv.addColorStop(0.75, 'rgba(255,255,255,0.85)');
    gv.addColorStop(0.88, 'rgba(255,255,255,0.35)'); gv.addColorStop(0.95, 'rgba(255,255,255,0.1)');
    gv.addColorStop(1, 'rgba(255,255,255,0.02)');
    OX.fillStyle = gv; OX.fillRect(0, 0, offW, offH);
    OX.globalCompositeOperation = 'source-over';

    // Mullions
    OX.globalCompositeOperation = 'destination-out';
    const mW = frameT * 0.5, mS = baseSoft * 0.9, mx = projW * 0.47;
    let gm = OX.createLinearGradient(mx - mW - mS, 0, mx + mW + mS, 0);
    gm.addColorStop(0, 'rgba(255,255,255,0)'); gm.addColorStop(0.15, 'rgba(255,255,255,1)');
    gm.addColorStop(0.85, 'rgba(255,255,255,1)'); gm.addColorStop(1, 'rgba(255,255,255,0)');
    OX.fillStyle = gm; OX.fillRect(mx - mW - mS, 0, (mW + mS) * 2, projH);
    const my = projH * 0.4;
    gm = OX.createLinearGradient(0, my - mW - mS, 0, my + mW + mS);
    gm.addColorStop(0, 'rgba(255,255,255,0)'); gm.addColorStop(0.15, 'rgba(255,255,255,1)');
    gm.addColorStop(0.85, 'rgba(255,255,255,1)'); gm.addColorStop(1, 'rgba(255,255,255,0)');
    OX.fillStyle = gm; OX.fillRect(0, my - mW - mS, projW, (mW + mS) * 2);
    const cx = projW * 0.73 + Math.sin(now * 0.00025) * 2.5;
    gm = OX.createLinearGradient(cx - 5, 0, cx + 5, 0);
    gm.addColorStop(0, 'rgba(255,255,255,0)'); gm.addColorStop(0.25, 'rgba(255,255,255,0.6)');
    gm.addColorStop(0.75, 'rgba(255,255,255,0.6)'); gm.addColorStop(1, 'rgba(255,255,255,0)');
    OX.fillStyle = gm; OX.fillRect(cx - 5, frameT, 10, projH - frameT * 2);
    OX.globalCompositeOperation = 'source-over';

    X.globalCompositeOperation = 'destination-out'; X.drawImage(OC, 0, 0);
    X.globalCompositeOperation = 'source-over';

    // Warm glow
    const WC = getOff('w', offW, offH), WX = WC.getContext('2d');
    WX.clearRect(0, 0, offW, offH);
    const wG = WX.createRadialGradient(projW * 0.4, projH * 0.45, 0, projW * 0.4, projH * 0.45, projW * 0.8);
    wG.addColorStop(0, `rgba(255,${wg},${wb},${(warmAlpha * 0.9).toFixed(3)})`);
    wG.addColorStop(0.5, `rgba(255,${wg},${wb},${(warmAlpha * 0.6).toFixed(3)})`);
    wG.addColorStop(1, `rgba(255,${wg},${wb},${(warmAlpha * 0.15).toFixed(3)})`);
    WX.fillStyle = wG; WX.fillRect(0, 0, offW, offH);
    WX.globalCompositeOperation = 'destination-in'; WX.drawImage(OC, 0, 0);
    WX.globalCompositeOperation = 'source-over'; X.drawImage(WC, 0, 0);

    X.restore();

    // Leaves at full framerate (lightweight)
    const time = now * 0.001;
    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      l.y += l.speed; l.x += l.drift + Math.sin(l.wobblePhase + time * l.wobbleSpeed) * l.wobbleAmp * 0.15;
      l.rotation += l.rotSpeed;
      if (l.y > H + 50) { leaves[i] = spawnLeaf(false); continue; }
      X.save(); X.translate(l.x, l.y); X.rotate(l.rotation);
      const s = l.size;
      X.beginPath(); X.moveTo(0, -s);
      X.quadraticCurveTo(s * l.aspect * 1.2, -s * 0.3, 0, s);
      X.quadraticCurveTo(-s * l.aspect * 1.2, -s * 0.3, 0, -s);
      X.fillStyle = `rgba(60,55,40,${l.alpha})`; X.fill(); X.restore();
    }
  }

  // --- Wind sound (deferred buffer creation) ---
  let audioCtx = null, windNodes = [];
  function startWindAudio() {
    if (window._audioMuted || windNodes.length) return;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    // Defer heavy noise buffer creation
    setTimeout(() => {
      if (!active || !audioCtx) return;
      function noise(dur, amp) {
        const len = Math.ceil(audioCtx.sampleRate * dur), buf = audioCtx.createBuffer(1, len, audioCtx.sampleRate);
        const d = buf.getChannelData(0); let s = 0;
        for (let i = 0; i < len; i++) { s = s * 0.985 + (Math.random() * 2 - 1) * amp * 0.16; d[i] = s; }
        return buf;
      }
      const s1 = audioCtx.createBufferSource(); s1.buffer = noise(5, 0.02); s1.loop = true;
      const hp = audioCtx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 200;
      const lp = audioCtx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2000;
      const g1 = audioCtx.createGain(); g1.gain.value = 0.14;
      s1.connect(hp).connect(lp).connect(g1).connect(audioCtx.destination); s1.start();
      const s2 = audioCtx.createBufferSource(); s2.buffer = noise(3.5, 0.015); s2.loop = true;
      const hp2 = audioCtx.createBiquadFilter(); hp2.type = 'highpass'; hp2.frequency.value = 1200;
      const lp2 = audioCtx.createBiquadFilter(); lp2.type = 'lowpass'; lp2.frequency.value = 5000;
      const g2 = audioCtx.createGain(); g2.gain.value = 0.06;
      s2.connect(hp2).connect(lp2).connect(g2).connect(audioCtx.destination); s2.start();
      windNodes = [s1, s2];
    }, 100);
  }
  function stopWindAudio() {
    windNodes.forEach(n => { try { n.stop(); } catch (e) {} }); windNodes = [];
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
  }

  function fadeIn() {
    if (active) return;
    active = true; fit(); initLeaves(); lastDraw = 0;
    canvas.style.opacity = '1';
    raf = requestAnimationFrame(draw);
    startWindAudio();
    window.dispatchEvent(new CustomEvent('audio-active', { detail: { scene: 'sunny' } }));
  }
  function fadeOut() {
    canvas.style.opacity = '0';
    stopWindAudio();
    setTimeout(() => { if (!active) return; active = false; if (raf) cancelAnimationFrame(raf); }, 400);
    window.dispatchEvent(new CustomEvent('audio-active', { detail: { scene: null } }));
  }
  function stop() {
    active = false; canvas.style.opacity = '0';
    if (raf) cancelAnimationFrame(raf);
    stopWindAudio();
  }

  addEventListener('resize', fit);
  window.addEventListener('scene-fadein', e => { if (e.detail.scene === 'sunny') fadeIn(); });
  window.addEventListener('scene-fadeout', e => { if (e.detail.from === 'sunny') fadeOut(); });
  window.addEventListener('audio-mute-toggle', () => { if (active) { window._audioMuted ? stopWindAudio() : startWindAudio(); } });

  // Initial load: if sunny, show immediately
  if (document.documentElement.getAttribute('data-scene') === 'sunny') fadeIn();
})();
