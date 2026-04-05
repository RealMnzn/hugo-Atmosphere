(() => {
  let searchIndex = null;
  const overlay = document.getElementById('search-overlay');
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const btn = document.getElementById('search-btn');
  if (!overlay || !input || !results) return;

  async function loadIndex() {
    if (searchIndex) return;
    try {
      const base = window.__basePath || '/';
      const res = await fetch(base + 'index.json');
      searchIndex = await res.json();
    } catch (e) {
      searchIndex = [];
    }
  }

  function open() {
    loadIndex();
    overlay.classList.add('open');
    input.value = '';
    results.innerHTML = '';
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    overlay.classList.remove('open');
    input.blur();
  }

  function search(query) {
    if (!searchIndex || !query.trim()) {
      results.innerHTML = '';
      return;
    }
    const q = query.toLowerCase().trim();
    const matches = searchIndex.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.content && p.content.toLowerCase().includes(q)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
    ).slice(0, 10);

    if (matches.length === 0) {
      results.innerHTML = '<div class="search-empty">No results found.</div>';
      return;
    }

    results.innerHTML = matches.map(p => {
      const tags = p.tags ? p.tags.map(t => '#' + t).join(' ') : '';
      let snippet = '';
      if (p.content) {
        const idx = p.content.toLowerCase().indexOf(q);
        if (idx >= 0) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(p.content.length, idx + q.length + 60);
          snippet = (start > 0 ? '...' : '') +
            p.content.slice(start, idx) +
            '<mark>' + p.content.slice(idx, idx + q.length) + '</mark>' +
            p.content.slice(idx + q.length, end) +
            (end < p.content.length ? '...' : '');
        }
      }
      return `<a href="${p.url}" class="search-result-item" data-search-link>
        <div class="search-result-title">${p.title}</div>
        <div class="search-result-meta">${p.date}${tags ? ' · ' + tags : ''}</div>
        ${snippet ? '<div class="search-result-snippet">' + snippet + '</div>' : ''}
      </a>`;
    }).join('');
  }

  // Events
  if (btn) btn.addEventListener('click', open);

  overlay.addEventListener('click', e => {
    if (e.target === overlay) close();
  });

  input.addEventListener('input', () => search(input.value));

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      overlay.classList.contains('open') ? close() : open();
    }
    if (e.key === 'Escape' && overlay.classList.contains('open')) {
      close();
    }
  });

  // Navigate on result click (integrate with PJAX if available)
  results.addEventListener('click', e => {
    const link = e.target.closest('[data-search-link]');
    if (link) close();
  });
})();
