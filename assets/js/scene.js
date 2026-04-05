(() => {
  const root = document.documentElement;
  const stored = localStorage.getItem('scene');
  if (stored === 'rainy' || stored === 'sunny') root.setAttribute('data-scene', stored);

  window._audioMuted = localStorage.getItem('audio-muted') === 'true';

  // --- Scene transition ---
  let transitioning = false;

  function switchScene(next) {
    if (transitioning) return;
    const current = root.getAttribute('data-scene');
    if (current === next) return;
    transitioning = true;

    // Fade out current effects immediately
    window.dispatchEvent(new CustomEvent('scene-fadeout', { detail: { from: current } }));
    // Swap CSS palette
    root.setAttribute('data-scene', next);
    localStorage.setItem('scene', next);

    if (next === 'sunny') {
      // Sunny: wait for bg to settle at cream, THEN show light beams
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('scene-fadein', { detail: { scene: next } }));
        transitioning = false;
      }, 320);
    } else {
      // Rainy: rain can appear immediately on darkening bg
      window.dispatchEvent(new CustomEvent('scene-fadein', { detail: { scene: next } }));
      setTimeout(() => { transitioning = false; }, 350);
    }
  }

  // --- Scene toggle ---
  function bindToggle() {
    const btn = document.getElementById('scene-toggle');
    if (!btn || btn._bound) return;
    btn._bound = true;
    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-scene');
      switchScene(current === 'sunny' ? 'rainy' : 'sunny');
    });
  }
  bindToggle();

  // --- Audio mute button ---
  const muteBtn = document.createElement('button');
  muteBtn.className = 'audio-toggle' + (window._audioMuted ? ' muted' : '');
  muteBtn.id = 'audio-mute-btn';
  muteBtn.setAttribute('aria-label', 'Toggle audio');
  muteBtn.innerHTML = `
    <svg class="icon-unmuted" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
    </svg>
    <svg class="icon-muted" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
    </svg>`;
  const ms = document.createElement('style');
  ms.textContent = `.audio-toggle .icon-unmuted{display:block}.audio-toggle .icon-muted{display:none}.audio-toggle.muted .icon-unmuted{display:none}.audio-toggle.muted .icon-muted{display:block}`;
  document.head.appendChild(ms);
  document.body.appendChild(muteBtn);
  muteBtn.addEventListener('click', () => {
    window._audioMuted = !window._audioMuted;
    localStorage.setItem('audio-muted', window._audioMuted);
    muteBtn.classList.toggle('muted', window._audioMuted);
    window.dispatchEvent(new Event('audio-mute-toggle'));
  });
  window.addEventListener('audio-active', e => muteBtn.classList.toggle('visible', e.detail.scene !== null));

  // --- SPA navigation (PJAX) ---
  const mainEl = document.querySelector('.site-main');
  const cache = {};

  function updateActiveNav(path) {
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      link.classList.toggle('is-active', (href === '/' && path === '/') || (href !== '/' && path.startsWith(href)));
    });
  }

  async function navigate(url) {
    try {
      navigate._lastUrl = url;
      const base = url.split('#')[0];
      let html = cache[base];
      if (!html) {
        const res = await fetch(base);
        if (!res.ok) { location.href = url; return; }
        html = await res.text();
        cache[base] = html;
      }
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const newMain = doc.querySelector('.site-main');
      if (!newMain) { location.href = url; return; }

      // Inject missing stylesheets and wait for them to load
      const stylePromises = [];
      doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        const href = link.getAttribute('href');
        if (!document.querySelector(`link[href="${href}"]`)) {
          const nl = document.createElement('link'); nl.rel = 'stylesheet'; nl.href = href;
          stylePromises.push(new Promise(resolve => {
            nl.onload = nl.onerror = resolve;
          }));
          document.head.appendChild(nl);
        }
      });
      if (stylePromises.length) await Promise.all(stylePromises);

      mainEl.style.transition = 'opacity 0.2s ease';
      mainEl.style.opacity = '0';
      await new Promise(r => setTimeout(r, 200));
      mainEl.innerHTML = newMain.innerHTML;
      mainEl.style.opacity = '1';
      document.title = doc.querySelector('title')?.textContent || document.title;
      window.dispatchEvent(new CustomEvent('pjax:complete', { detail: { url } }));
      history.pushState(null, '', url);
      updateActiveNav(new URL(url, location.origin).pathname);
      const hash = new URL(url, location.origin).hash.slice(1);
      if (hash) { const el = document.getElementById(hash); if (el) { el.scrollIntoView(); return; } }
      scrollTo(0, 0);
    } catch (e) { location.href = url; }
  }

  document.addEventListener('click', e => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || link.target === '_blank' || link.hasAttribute('download')) return;
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return;
    // Skip search result links (let search handle close first)
    if (link.hasAttribute('data-search-link')) return;
    // Same-page hash link (e.g. /posts/foo/#heading) — let browser handle scroll
    const parsed = new URL(href, location.origin);
    if (parsed.hash && parsed.pathname === location.pathname) return;
    e.preventDefault();
    const url = parsed.href;
    if (url !== location.href) navigate(url);
  });

  addEventListener('popstate', () => {
    // Hash-only change on the same page — scroll to target, don't re-fetch
    const cur = navigate._lastUrl || '';
    if (cur && location.href.split('#')[0] === cur.split('#')[0]) {
      const id = location.hash.slice(1);
      if (id) { const el = document.getElementById(id); if (el) el.scrollIntoView(); }
      return;
    }
    navigate(location.href);
  });
})();
