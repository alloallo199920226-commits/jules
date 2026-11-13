/* Independent, click-triggered customer reset control. Imported admin scripts stay untouched. */
(() => {
  const dashboard = document.querySelector("#dashboard-view");
  const actions = dashboard?.querySelector(".admin-header-actions");
  if (!dashboard || !actions || document.querySelector("#narke-customer-reset-trigger")) return;

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.id = "narke-customer-reset-trigger";
  trigger.textContent = "Supprimer les anciens utilisateurs";
  trigger.setAttribute("aria-haspopup", "dialog");
  actions.insertBefore(trigger, actions.querySelector("#refresh") || null);

  const dialog = document.createElement("dialog");
  dialog.id = "narke-customer-reset-dialog";
  dialog.setAttribute("aria-labelledby", "narke-reset-title");
  dialog.innerHTML = `
    <div class="narke-reset-shell">
      <header class="narke-reset-head">
        <div>
          <p class="narke-reset-eyebrow">NARKE Industries · Zone sensible</p>
          <h2 id="narke-reset-title">Réinitialiser les comptes clients</h2>
        </div>
        <button class="narke-reset-close" type="button" aria-label="Fermer la fenêtre">×</button>
      </header>
      <p class="narke-reset-intro">L’aperçu identifie les comptes clients présents maintenant. Les comptes créés après cet aperçu ne seront pas concernés.</p>
      <section class="narke-reset-warning" aria-label="Avertissement irréversible">
        <strong>Suppression irréversible — vérifiez avant de continuer.</strong>
        <p>Les soldes, achats, dépôts, retraits, commissions et données de portefeuille seront supprimés. Aucun paiement externe ne sera annulé ni remboursé par cette opération.</p>
      </section>
      <p class="narke-reset-preserve"><strong>Conservés :</strong> produits, paramètres et accès administrateurs. Seuls les comptes clients ciblés et leurs activités sont supprimés.</p>
      <dl class="narke-reset-counts" aria-live="polite">
        <div class="narke-reset-count"><dt>Comptes clients ciblés</dt><dd data-count="customers">—</dd></div>
        <div class="narke-reset-count"><dt>Activités concernées</dt><dd data-count="activities">—</dd></div>
        <div class="narke-reset-count"><dt>Retraits en attente</dt><dd data-count="withdrawals">—</dd></div>
        <div class="narke-reset-count"><dt>Dépôts en attente</dt><dd data-count="deposits">—</dd></div>
      </dl>
      <p class="narke-reset-status" role="status" aria-live="polite">Chargement de l’aperçu…</p>
      <button class="narke-reset-preview" type="button" hidden>Charger un nouvel aperçu</button>
      <form novalidate>
        <label class="narke-reset-field" for="narke-reset-password">
          <span>Mot de passe administrateur</span>
          <input id="narke-reset-password" name="password" type="password" autocomplete="current-password" required>
        </label>
        <label class="narke-reset-field" for="narke-reset-confirmation">
          <span>Saisissez exactement cette phrase : <strong>SUPPRIMER LES UTILISATEURS</strong></span>
          <input id="narke-reset-confirmation" name="confirmation" type="text" autocomplete="off" spellcheck="false" required>
        </label>
        <label class="narke-reset-check" for="narke-reset-backup">
          <input id="narke-reset-backup" name="backup_confirmed" type="checkbox">
          <span>Je confirme qu’une sauvegarde exploitable a été effectuée et vérifiée avant cette suppression.</span>
        </label>
        <div class="narke-reset-actions">
          <button class="narke-reset-cancel" type="button">Annuler</button>
          <div>
            <button class="narke-reset-submit" type="submit" disabled>Supprimer les utilisateurs</button>
            <button class="narke-reset-refresh" type="button" hidden>Actualiser la page</button>
          </div>
        </div>
      </form>
      <p class="narke-reset-footnote">La suppression ne démarre qu’après validation manuelle de ce formulaire. En cas de réponse interrompue, le jeton est conservé pour une nouvelle tentative explicite ; aucune nouvelle tentative n’est automatique.</p>
    </div>`;
  document.querySelector("#admin-root")?.append(dialog);
  if (!dialog.isConnected) return;

  const form = dialog.querySelector("form");
  const password = dialog.querySelector("#narke-reset-password");
  const confirmation = dialog.querySelector("#narke-reset-confirmation");
  const backup = dialog.querySelector("#narke-reset-backup");
  const submit = dialog.querySelector(".narke-reset-submit");
  const refreshPage = dialog.querySelector(".narke-reset-refresh");
  const status = dialog.querySelector(".narke-reset-status");
  const closeButton = dialog.querySelector(".narke-reset-close");
  const cancelButton = dialog.querySelector(".narke-reset-cancel");
  const previewButton = dialog.querySelector(".narke-reset-preview");
  const expectedPhrase = "SUPPRIMER LES UTILISATEURS";
  let previewToken = "";
  let busy = false;
  let completed = false;
  let lastFocus = null;
  let previewSequence = 0;

  const setStatus = (message, kind = "info") => {
    status.textContent = message;
    status.dataset.kind = kind;
    status.hidden = !message;
  };
  const countText = value => {
    const count = Number(value);
    return Number.isFinite(count) && count >= 0 ? Math.floor(count).toLocaleString("fr-FR") : "—";
  };
  const serverMessage = payload => {
    if (payload && typeof payload.error === "string") return payload.error;
    if (payload && typeof payload.message === "string") return payload.message;
    return "";
  };
  const refreshReadiness = () => {
    submit.disabled = busy || completed || !previewToken ||
      password.value.length === 0 ||
      confirmation.value !== expectedPhrase ||
      !backup.checked;
  };
  const readJson = async response => {
    try { return await response.json(); } catch (_) { return {}; }
  };
  const requestPreview = async () => {
    if (busy || completed) return;
    previewButton.disabled = true;
    const sequence = ++previewSequence;
    setStatus("Chargement d’un aperçu récent…");
    try {
      const response = await fetch("/api/admin/customer-reset/preview", {
        method: "GET", credentials: "same-origin", cache: "no-store",
        headers: { "Accept": "application/json" }
      });
      const result = await readJson(response);
      if (sequence !== previewSequence) return;
      if (!response.ok) {
        const message = response.status === 401 || response.status === 403
          ? "Authentification administrateur requise ou mot de passe de session invalide."
          : response.status === 410
            ? "Cet aperçu a expiré. Fermez puis rouvrez la fenêtre pour en créer un nouveau."
            : serverMessage(result) || "Impossible de préparer l’aperçu. Réessayez manuellement.";
        setStatus(message, "error");
        previewButton.hidden = false;
        return;
      }
      if (typeof result.preview_token !== "string" || !result.preview_token) {
        setStatus("L’aperçu reçu est incomplet : aucun jeton de confirmation n’a été fourni.", "error");
        previewButton.hidden = false;
        return;
      }
      previewToken = result.preview_token;
      previewButton.hidden = true;
      dialog.querySelector('[data-count="customers"]').textContent = countText(result.customer_count);
      dialog.querySelector('[data-count="activities"]').textContent = countText(result.activity_count);
      dialog.querySelector('[data-count="withdrawals"]').textContent = countText(result.pending_withdrawals);
      dialog.querySelector('[data-count="deposits"]').textContent = countText(result.pending_deposits);
      const expires = Number(result.expires_in);
      setStatus(`Aperçu prêt. Le jeton expire dans ${Number.isFinite(expires) && expires > 0 ? Math.floor(expires) : 300} secondes.`, "info");
      refreshReadiness();
    } catch (_) {
      if (sequence === previewSequence) {
        setStatus("Aperçu indisponible : vérifiez votre connexion puis réessayez.", "error");
        previewButton.hidden = false;
      }
    } finally {
      previewButton.disabled = false;
    }
  };
  const openDialog = () => {
    if (dashboard.hidden || !dialog.isConnected || dialog.open) return;
    lastFocus = document.activeElement;
    dialog.showModal();
    dialog.scrollTop = 0;
    if (!completed && !previewToken) requestPreview();
    window.requestAnimationFrame(() => (completed ? refreshPage : closeButton).focus({ preventScroll: true }));
  };
  const closeDialog = () => {
    if (busy) return;
    if (dialog.open) dialog.close();
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };
  dialog.addEventListener("close", () => {
    password.value = "";
    refreshReadiness();
  });

  trigger.addEventListener("click", openDialog);
  closeButton.addEventListener("click", closeDialog);
  cancelButton.addEventListener("click", closeDialog);
  dialog.addEventListener("cancel", event => {
    if (busy) event.preventDefault();
  });
  [password, confirmation, backup].forEach(control => control.addEventListener("input", refreshReadiness));
  backup.addEventListener("change", refreshReadiness);
  refreshPage.addEventListener("click", () => window.location.reload());
  previewButton.addEventListener("click", requestPreview);

  form.addEventListener("submit", async event => {
    event.preventDefault();
    refreshReadiness();
    if (submit.disabled || busy || !previewToken) return;

    const requestBody = {
      preview_token: previewToken,
      password: password.value,
      confirmation: confirmation.value,
      backup_confirmed: true
    };
    busy = true;
    submit.textContent = "Suppression en cours…";
    refreshReadiness();
    setStatus("Suppression demandée. Ne fermez pas la fenêtre pendant le traitement…");
    try {
      const request = fetch("/api/admin/customer-reset", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(requestBody)
      });
      password.value = "";
      requestBody.password = "";
      const response = await request;
      const result = await readJson(response);
      if (!response.ok) {
        let message = serverMessage(result) || "La suppression a été refusée.";
        if (response.status === 401 || response.status === 403) {
          message = "Authentification refusée : vérifiez le mot de passe administrateur et votre session.";
        } else if (response.status === 410) {
          message = "L’aperçu a expiré. Aucun nouvel aperçu ne sera demandé automatiquement ; utilisez le bouton ci-dessous pour en charger un autre.";
          previewButton.hidden = false;
        }
        setStatus(message, "error");
        return;
      }
      if (result.ok !== true) {
        setStatus(serverMessage(result) || "La réponse ne confirme pas la suppression. Le jeton est conservé pour vérification ou nouvelle tentative explicite.", "error");
        return;
      }
      completed = true;
      previewToken = "";
      submit.hidden = true;
      refreshPage.hidden = false;
      dialog.querySelector('[data-count="customers"]').textContent = countText(result.deleted_customers);
      dialog.querySelector('[data-count="activities"]').textContent = countText(result.deleted_activities);
      if (result.already_completed === true) {
        setStatus(`Cette opération avait déjà été terminée. Comptes supprimés : ${countText(result.deleted_customers)} ; activités supprimées : ${countText(result.deleted_activities)}.`, "success");
      } else {
        setStatus(`Suppression terminée. Comptes supprimés : ${countText(result.deleted_customers)} ; activités supprimées : ${countText(result.deleted_activities)}.`, "success");
      }
    } catch (_) {
      setStatus("Réponse interrompue : l’état de l’opération peut être incertain. Le jeton est conservé ; aucune nouvelle tentative automatique n’a été faite. Vérifiez l’état avant toute nouvelle validation.", "error");
    } finally {
      busy = false;
      submit.textContent = "Supprimer les utilisateurs";
      refreshReadiness();
    }
  });
})();
