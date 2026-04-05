import { init, pageviewCount } from 'https://unpkg.com/@waline/client@v3/dist/waline.js';

const serverURL = document.querySelector('meta[name="waline-server"]')?.content;
if (serverURL) {
  let walineInstance = null;

  function initWaline() {
    const el = document.getElementById('waline-comment');
    if (!el) {
      pageviewCount({ serverURL, update: true });
      return;
    }

    if (walineInstance) {
      walineInstance.update({ path: location.pathname });
      return;
    }

    walineInstance = init({
      el: '#waline-comment',
      serverURL,
      dark: 'html[data-scene="rainy"]',
      pageview: true,
      locale: { placeholder: 'Leave a comment...' },
      emoji: false,
      meta: ['nick', 'mail', 'link'],
      requiredMeta: ['nick'],
      login: 'enable',
      copyright: false,
    });
  }

  initWaline();

  window.addEventListener('pjax:complete', () => {
    if (walineInstance) {
      walineInstance.destroy();
      walineInstance = null;
    }
    initWaline();
  });
}
