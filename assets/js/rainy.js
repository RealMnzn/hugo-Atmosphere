(() => {
  const layer = document.getElementById('scene-layer');
  if (!layer) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 0.3s ease;';
  layer.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const fog = document.createElement('div');
  fog.style.cssText = `position:absolute;inset:0;
    background:radial-gradient(ellipse at 50% 100%,rgba(70,80,95,0.15) 0%,transparent 45%),
    radial-gradient(ellipse at 20% 85%,rgba(60,70,85,0.08) 0%,transparent 35%),
    radial-gradient(ellipse at 80% 90%,rgba(55,65,80,0.06) 0%,transparent 30%);
    animation:fogDrift 25s ease-in-out infinite alternate;opacity:0;transition:opacity 0.3s ease;`;
  layer.appendChild(fog);

  if (!document.getElementById('rain-kf')) {
    const s = document.createElement('style'); s.id = 'rain-kf';
    s.textContent = '@keyframes fogDrift{0%{transform:translateX(-1.5%);opacity:.7}100%{transform:translateX(1.5%);opacity:1}}';
    document.head.appendChild(s);
  }

  let W, H, active = false, raf = null;
  const LAYERS = [
    { count: 70,  lenMin: 12, lenMax: 22, speed: 20, w: 1.0, color: 'rgba(200,210,225,', alphaMin: 0.20, alphaMax: 0.38, splash: 0.3 },
    { count: 150, lenMin: 7,  lenMax: 15, speed: 14, w: 0.7, color: 'rgba(185,195,212,', alphaMin: 0.12, alphaMax: 0.25, splash: 0.05 },
    { count: 120, lenMin: 4,  lenMax: 9,  speed: 9,  w: 0.4, color: 'rgba(170,180,200,', alphaMin: 0.06, alphaMax: 0.15, splash: 0.05 },
  ];
  const drops = [];
  const splashPool = new Array(64);
  let splashCount = 0;

  function resize() {
    const dpr = devicePixelRatio || 1;
    W = innerWidth; H = innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnDrops() {
    drops.length = 0; splashCount = 0;
    for (const l of LAYERS) for (let i = 0; i < l.count; i++) {
      const a = l.alphaMin + Math.random() * (l.alphaMax - l.alphaMin);
      drops.push({ x: Math.random() * (W + 60) - 30, y: Math.random() * H,
        len: l.lenMin + Math.random() * (l.lenMax - l.lenMin),
        speed: l.speed + Math.random() * l.speed * 0.4,
        w: l.w + Math.random() * 0.15, cs: l.color + a.toFixed(3) + ')',
        drift: 1.5 + Math.random(), splash: l.splash });
    }
  }

  function tick() {
    if (!active) return;
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round';

    for (let i = 0; i < drops.length; i++) {
      const d = drops[i];
      ctx.beginPath(); ctx.moveTo(d.x, d.y);
      ctx.lineTo(d.x + d.drift * (d.len / d.speed), d.y + d.len);
      ctx.strokeStyle = d.cs; ctx.lineWidth = d.w; ctx.stroke();
      d.y += d.speed; d.x += d.drift;
      if (d.y > H) {
        if (splashCount < 64 && Math.random() < d.splash)
          splashPool[splashCount++] = { x: d.x, y: H - 2 + Math.random() * 4, maxR: 2 + Math.random() * 3, alpha: 0.2 + Math.random() * 0.15, life: 0, maxLife: 8 + Math.random() * 6 };
        d.y = -d.len - Math.random() * 80; d.x = Math.random() * (W + 60) - 30;
      }
    }

    ctx.lineWidth = 0.5;
    let wi = 0;
    for (let i = 0; i < splashCount; i++) {
      const s = splashPool[i]; s.life++;
      const p = s.life / s.maxLife;
      if (p >= 1) continue;
      ctx.beginPath(); ctx.ellipse(s.x, s.y, s.maxR * p * 1.5, s.maxR * p * 0.5, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180,190,205,${(s.alpha * (1 - p)).toFixed(3)})`; ctx.stroke();
      splashPool[wi++] = s;
    }
    splashCount = wi;
    raf = requestAnimationFrame(tick);
  }

  // --- Audio (deferred creation) ---
  let audioCtx = null, audioNodes = [], thunderT = null, dripT = null;
  function pinkNoise(actx, dur, ch) {
    const len = actx.sampleRate * dur, buf = actx.createBuffer(ch, len, actx.sampleRate);
    for (let c = 0; c < ch; c++) {
      const d = buf.getChannelData(c);
      let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
      for (let i = 0; i < len; i++) {
        const w = Math.random()*2-1;
        b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;
        b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;
        d[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.015;b6=w*.115926;
      }
    } return buf;
  }

  function startAudio() {
    if (window._audioMuted || audioNodes.length) return;
    setTimeout(() => {
      if (!active) return;
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e){return;}
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
      function filt(type, freq) { const f = audioCtx.createBiquadFilter(); f.type = type; f.frequency.value = freq; return f; }

      const s1 = audioCtx.createBufferSource(); s1.buffer = pinkNoise(audioCtx,4,2); s1.loop = true;
      const g1 = audioCtx.createGain(); g1.gain.value = 0.18;
      s1.connect(filt('highpass',400)).connect(filt('lowpass',8000)).connect(g1).connect(audioCtx.destination); s1.start(); audioNodes.push(s1);
      const s2 = audioCtx.createBufferSource(); s2.buffer = pinkNoise(audioCtx,3,1); s2.loop = true;
      const g2 = audioCtx.createGain(); g2.gain.value = 0.06;
      s2.connect(filt('highpass',3000)).connect(filt('lowpass',12000)).connect(g2).connect(audioCtx.destination); s2.start(); audioNodes.push(s2);
      const s3 = audioCtx.createBufferSource(); s3.buffer = pinkNoise(audioCtx,5,1); s3.loop = true;
      const g3 = audioCtx.createGain(); g3.gain.value = 0.2;
      s3.connect(filt('lowpass',200)).connect(g3).connect(audioCtx.destination); s3.start(); audioNodes.push(s3);

      function thunder() {
        if (!active||!audioCtx) return;
        const now=audioCtx.currentTime, dur=1.5+Math.random()*3;
        const ts=audioCtx.createBufferSource(); ts.buffer=pinkNoise(audioCtx,dur,1);
        const tg=audioCtx.createGain(); tg.gain.setValueAtTime(0,now);
        tg.gain.linearRampToValueAtTime(.15+Math.random()*.2,now+.08);
        tg.gain.exponentialRampToValueAtTime(.001,now+dur);
        ts.connect(filt('lowpass',120+Math.random()*80)).connect(tg).connect(audioCtx.destination);
        ts.start(now); ts.stop(now+dur+.1);
        thunderT=setTimeout(thunder,8000+Math.random()*20000);
      }
      thunderT=setTimeout(thunder,3000+Math.random()*5000);

      function drip() {
        if (!active||!audioCtx) return;
        const now=audioCtx.currentTime;
        for (let i=0,c=1+Math.floor(Math.random()*3);i<c;i++) {
          const t=now+Math.random()*.15,dur=.02+Math.random()*.04;
          const nL=Math.ceil(audioCtx.sampleRate*dur),nB=audioCtx.createBuffer(1,nL,audioCtx.sampleRate);
          const nd=nB.getChannelData(0); for(let j=0;j<nL;j++) nd[j]=(Math.random()*2-1)*Math.exp(-j/(nL*.3));
          const ns=audioCtx.createBufferSource(); ns.buffer=nB;
          const bp=filt('bandpass',2000+Math.random()*4000); bp.Q.value=2+Math.random()*3;
          const ng=audioCtx.createGain(); ng.gain.setValueAtTime(.04+Math.random()*.06,t);
          ng.gain.exponentialRampToValueAtTime(.0001,t+dur);
          ns.connect(bp).connect(ng).connect(audioCtx.destination); ns.start(t); ns.stop(t+dur+.01);
        }
        dripT=setTimeout(drip,40+Math.random()*100);
      }
      drip();
    }, 150);
  }

  function stopAudio() {
    clearTimeout(thunderT); clearTimeout(dripT);
    audioNodes.forEach(n=>{try{n.stop();}catch(e){}}); audioNodes=[];
    if (audioCtx) { audioCtx.close().catch(()=>{}); audioCtx=null; }
  }

  function fadeIn() {
    if (active) return;
    active = true; resize(); spawnDrops();
    canvas.style.opacity = '1'; fog.style.opacity = '1';
    tick(); startAudio();
    window.dispatchEvent(new CustomEvent('audio-active', { detail: { scene: 'rainy' } }));
  }
  function fadeOut() {
    canvas.style.opacity = '0'; fog.style.opacity = '0';
    stopAudio();
    setTimeout(() => { if (!active) return; active = false; if (raf) cancelAnimationFrame(raf); }, 400);
    window.dispatchEvent(new CustomEvent('audio-active', { detail: { scene: null } }));
  }

  addEventListener('resize', resize); resize();
  window.addEventListener('scene-fadein', e => { if (e.detail.scene === 'rainy') fadeIn(); });
  window.addEventListener('scene-fadeout', e => { if (e.detail.from === 'rainy') fadeOut(); });
  window.addEventListener('audio-mute-toggle', () => { if (active) { window._audioMuted ? stopAudio() : startAudio(); } });
  if (document.documentElement.getAttribute('data-scene') === 'rainy') fadeIn();
})();
