(() => {
  function initTimeline() {
    const container = document.getElementById('tl-container');
    if (!container) return;

    const tags = document.querySelectorAll('.tl-tag');
    const entries = container.querySelectorAll('.tl-entry');
    const toggleBtn = document.getElementById('tl-toggle-hidden');
    let activeTag = null;

    tags.forEach(btn => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag;
        if (activeTag === tag) {
          activeTag = null;
          btn.classList.remove('active');
          entries.forEach(e => e.classList.remove('tl-filtered'));
        } else {
          activeTag = tag;
          tags.forEach(t => t.classList.remove('active'));
          btn.classList.add('active');
          entries.forEach(e => {
            const entryTags = (e.dataset.tags || '').split(',');
            e.classList.toggle('tl-filtered', !entryTags.includes(tag));
          });
        }
      });
    });

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        container.classList.toggle('tl-show-hidden');
        toggleBtn.classList.toggle('active');
        toggleBtn.textContent = container.classList.contains('tl-show-hidden') ? 'Hide hidden' : 'Show hidden';
      });
    }
  }

  initTimeline();
  window.addEventListener('pjax:complete', initTimeline);
})();
