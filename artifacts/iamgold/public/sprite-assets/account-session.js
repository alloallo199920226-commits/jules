(() => {
  if (window.__aeronovaSessionGuard) return;
  window.__aeronovaSessionGuard = true;
  const pathname = location.pathname;
  const loginPage = pathname.startsWith('/connexion/');
  const protectedPage = /^\/(?:accueil_produits_coca_cola|checkout|espace_social|historique_des_depots|historique_des_retraits|historique_du_compte|modal_confirmation_achat_vip1|paiement_gopay|produits_vip_investissement|profil_utilisateur_le_mien|quipe_profil_utilisateur|recharge_paiement_gopay|retrait_d_argent)(?:\/|$)/.test(pathname)
    || /^\/pages\/(?:ajouter-compte|comptes-retrait|historique-equipe|mes-produits|missions|mon-coca-cola|mot-de-passe|pointage|service-client|solde)\.html$/.test(pathname);
  if (!protectedPage && !loginPage) return;
  const MESSAGE = 'votre communauté est gelé';
  let leaving = false;
  let stream;
  function notice() {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', notice, { once: true });
      return;
    }
    let box = document.getElementById('account-frozen-notice');
    if (!box) {
      box = document.createElement('p');
      box.id = 'account-frozen-notice';
      box.setAttribute('role', 'alert');
      box.style.cssText = 'padding:14px;margin:12px 0;border:1px solid #f2b6bf;border-radius:12px;background:#fff0f2;color:#8b1530;font:600 16px/1.5 system-ui;';
      const form = document.querySelector('form');
      if (form) form.prepend(box);
      else document.body.prepend(box);
    }
    box.textContent = MESSAGE;
  }
  function disconnect(reason) {
    if (loginPage) { if (reason === 'banned') notice(); return; }
    if (leaving) return;
    leaving = true;
    stream?.close();
    location.replace('/connexion/code.html' + (reason === 'banned' ? '?account=frozen' : ''));
  }
  if (loginPage && new URLSearchParams(location.search).get('account') === 'frozen') notice();
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, options) => {
    const response = await originalFetch(input, options);
    const url = new URL(input?.url || String(input), location.href);
    if (url.origin === location.origin && url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/admin/')) {
      if (response.status === 401 && protectedPage) disconnect('expired');
      if (response.status === 403) {
        const data = await response.clone().json().catch(() => ({}));
        if (data.code === 'ACCOUNT_BANNED' || data.error === MESSAGE) disconnect('banned');
        else if (data.code === 'ACCOUNT_BLOCKED') disconnect('blocked');
      }
    }
    return response;
  };
  if (!protectedPage) return;
  let checking = false;
  async function check() {
    if (checking || leaving || navigator.onLine === false) return;
    checking = true;
    try { await window.fetch('/api/auth/session-status', { credentials: 'same-origin', cache: 'no-store' }); }
    catch { /* Network loss is not account revocation. */ }
    finally { checking = false; }
  }
  if (window.EventSource) {
    stream = new EventSource('/api/auth/session-events');
    stream.addEventListener('revoked', event => {
      try { disconnect(JSON.parse(event.data).reason); } catch { /* Ignore invalid events. */ }
    });
    stream.addEventListener('error', check);
  } else {
    setInterval(check, 5000);
  }
  window.addEventListener('focus', check);
  window.addEventListener('online', check);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void check(); });
  window.addEventListener('pagehide', () => stream?.close());
  window.addEventListener('pageshow', event => { if (event.persisted) location.reload(); });
  void check();
})();
