(() => {
  async function decryptContent(password, salt64, iv64, ct64) {
    const salt = Uint8Array.from(atob(salt64), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(iv64), c => c.charCodeAt(0));
    const ct = Uint8Array.from(atob(ct64), c => c.charCodeAt(0));

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(decrypted);
  }

  function bindEncryptForms() {
    document.querySelectorAll('.encrypt-locked').forEach(locked => {
      if (locked._bound) return;
      locked._bound = true;

      const form = locked.querySelector('.encrypt-form');
      const input = locked.querySelector('.encrypt-input');
      const error = locked.querySelector('.encrypt-error');
      const { salt, iv, ct } = locked.dataset;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = input.value;
        if (!password) return;

        try {
          const html = await decryptContent(password, salt, iv, ct);
          const container = locked.closest('.encrypt-container');
          container.innerHTML = `<div class="post-content encrypt-decrypted">${html}</div>`;
        } catch {
          error.style.display = 'block';
          input.value = '';
          input.focus();
          setTimeout(() => { error.style.display = 'none'; }, 2000);
        }
      });
    });
  }

  bindEncryptForms();
  window.addEventListener('pjax:complete', bindEncryptForms);
})();
