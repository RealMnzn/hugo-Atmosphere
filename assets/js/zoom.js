(() => {
  function bindZoom() {
    document.querySelectorAll('.post-content img').forEach(img => {
      if (img._zoomBound || img.closest('.encrypt-locked')) return;
      img._zoomBound = true;
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => openZoom(img));
    });
  }

  let overlay = null;

  function openZoom(img) {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.className = 'img-zoom-overlay';
    const clone = document.createElement('img');
    clone.src = img.src;
    clone.className = 'img-zoom-image';
    overlay.appendChild(clone);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    overlay.addEventListener('click', closeZoom);
    document.addEventListener('keydown', onKey);
  }

  function closeZoom() {
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.addEventListener('transitionend', () => {
      overlay.remove();
      overlay = null;
    }, { once: true });
    document.removeEventListener('keydown', onKey);
  }

  function onKey(e) {
    if (e.key === 'Escape') closeZoom();
  }

  bindZoom();
  window.addEventListener('pjax:complete', bindZoom);
})();
