/* Searches all accounts on the server without rebuilding the focused input. */
(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  window.createAdminUserSearch = ({root, api, isActive}) => {
    let search = '', rows = [], nextCursor = null, generation = 0, controller;
    const invalidate = () => { generation++; controller?.abort(); };
    function card(user) {
      const created = user.createdAt ? new Date(user.createdAt).toLocaleString('fr-FR') : '—';
      return `<article class="admin-list-card"><div><strong>${escape(user.phone)}</strong>
        <p>ID #${escape(user.id)} · ${escape(user.referralCode)}</p><small>${escape(created)}</small></div>
        <div class="admin-badges">${user.isBanned?'<span>banni</span>':''}${user.isBlocked?'<span>bloqué</span>':''}${user.withdrawalsDisabled?'<span>retraits fermés</span>':''}</div>
        <button type="button" data-user="${escape(user.id)}">Gérer</button></article>`;
    }
    async function load(append = false) {
      invalidate();
      const version = generation;
      controller = new AbortController();
      const currentController = controller;
      const timer = setTimeout(() => currentController.abort(), 15000);
      const panel = root.querySelector('[data-user-search-panel]');
      const current = () => version === generation && isActive() && root.contains(panel);
      const feedback = panel.querySelector('[data-user-search-feedback]');
      const more = panel.querySelector('[data-user-search-more]');
      panel.setAttribute('aria-busy', 'true');
      feedback.textContent = 'Recherche…';
      more.disabled = true;
      if (!append) {
        rows = []; nextCursor = null;
        panel.querySelector('[data-user-search-list]').replaceChildren();
        panel.querySelector('[data-user-search-title]').textContent = 'Utilisateurs';
        more.hidden = true;
      }
      const query = new URLSearchParams({search});
      if (append && nextCursor) query.set('cursor', nextCursor);
      try {
        const result = await api(`/api/admin/users/search?${query}`, {signal:currentController.signal});
        if (!current()) return;
        if (!Array.isArray(result.users) || result.total === undefined) throw Error('Résultats de recherche indisponibles.');
        rows = append ? [...rows, ...result.users] : result.users;
        nextCursor = result.nextCursor;
        panel.querySelector('[data-user-search-title]').textContent = `Utilisateurs (${result.total})`;
        panel.querySelector('[data-user-search-list]').innerHTML = rows.map(card).join('');
        feedback.textContent = rows.length ? `${rows.length} compte(s) affiché(s) sur ${result.total}. Recherche dans tous les comptes.` : 'Aucun utilisateur trouvé.';
        more.hidden = !nextCursor;
      } catch (error) {
        if (current()) feedback.textContent = error.message;
      } finally {
        clearTimeout(timer);
        if (current()) { panel.setAttribute('aria-busy', 'false'); more.disabled = false; }
      }
    }
    function mount() {
      invalidate();
      root.innerHTML = `<section class="admin-panel" data-user-search-panel>
        <h2 data-user-search-title>Utilisateurs</h2>
        <input type="search" class="admin-runtime-search" data-admin-user-search maxlength="100"
          aria-label="Rechercher un numéro ou un identifiant dans tous les comptes"
          placeholder="Téléphone ou identifiant" value="${escape(search)}">
        <p data-user-search-feedback role="status" aria-live="polite"></p>
        <div class="admin-list" data-user-search-list></div>
        <button type="button" data-user-search-more hidden>Afficher plus</button>
      </section>`;
      load();
    }
    root.addEventListener('input', event => {
      if (!isActive() || !event.target.matches('[data-admin-user-search]')) return;
      search = event.target.value.trim();
      load(); // No debounce: start the server search on this keystroke.
    });
    root.addEventListener('click', event => {
      if (isActive() && event.target.closest('[data-user-search-more]') && nextCursor) load(true);
    });
    return {mount, invalidate};
  };
})();