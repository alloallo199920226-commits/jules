/* Independent extension: the imported administration JavaScript is unchanged. */
(() => {
  const nav = document.querySelector("#general-admin-nav");
  const original = document.querySelector("#admin-content");
  const dashboard = document.querySelector("#dashboard-view");
  if (!nav || !original || !window.createAdminTransactionHistory) return;
  const buttons = ["vip", "commission"].map(activity => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.todayActivity = activity;
    button.textContent = activity === "vip" ? "VIP achetés aujourd’hui" : "Commissions du jour";
    return button;
  });
  nav.querySelector('[data-tab="normalWithdrawals"]').after(...buttons);
  const panel = document.createElement("section");
  panel.hidden = true;
  original.after(panel);
  let selected = false, previousTab;
  const escape = value => String(value ?? "—").replace(/[&<>"']/g,
    char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const money = value => `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
  const api = async (url, options = {}) => {
    url = url.replace("/api/admin/transaction-history?", "/api/admin/today-withdrawals?");
    const response = await fetch(url, {credentials:"same-origin", cache:"no-store",
      ...options, headers:{"Content-Type":"application/json", ...options.headers}});
    const result = await response.json();
    if (!response.ok) throw Error(result.error || result.message || "Opération indisponible.");
    return result;
  };
  const history = window.createAdminTransactionHistory({
    root:panel, api, scope:"general",
    isActive:() => selected && !dashboard.hidden,
    onMutation:async () => {},
    renderCard:row => `<article class="admin-list-card">
      <h3>Retrait en attente · ${money(row.amount)}</h3>
      <p><strong>${[row.purchasedVipToday ? "VIP acheté aujourd’hui" : "",
        row.referralCommissionToday ? "Commission de parrainage reçue aujourd’hui" : ""].filter(Boolean).join(" · ")}</strong></p>
      <p>${row.adminAssisted ? "Compte avec crédit ou VIP administrateur" : "Compte normal"}</p>
      <p>N° d’inscription : ${escape(row.registrationNumber)} · Utilisateur #${escape(row.userId)}</p>
      <p>${escape(row.operatorName)} · Titulaire : ${escape(row.walletHolderName)}</p>
      <p>Numéro de réception : ${escape(row.destination)}</p>
      <p>Filleuls directs : ${escape(row.referralCount)} · Commissions cumulées : ${money(row.referralCommissionAmount)}</p>
      <p>Frais : ${money(row.fee)} · Net à envoyer : ${money(row.netAmount)}</p>
      <p>N° de commande : ${escape(row.orderNumber)}</p>
      <p>Demande : ${escape(new Date(row.createdAt).toLocaleString("fr-FR", {timeZone:"Africa/Casablanca"}))} (Maroc)</p>
      <div class="admin-card-actions">
        <button type="button" data-tx="${escape(row.type+":"+row.id)}" data-next="approved">Approuver</button>
        <button type="button" data-tx="${escape(row.type+":"+row.id)}" data-next="rejected">Refuser</button>
      </div></article>`
  });
  const mount = () => history.mount(
    {type:"withdrawal", status:"pending", activity:selected},
    {title:selected === "vip" ? "Retraits en attente · VIP achetés aujourd’hui" : "Retraits en attente · Commissions du jour",
      description:(selected === "vip"
        ? "Uniquement les utilisateurs ayant acheté un VIP aujourd’hui, heure du Maroc. Les VIP offerts et les commissions seules ne comptent pas."
        : "Utilisateurs ayant reçu une commission de parrainage aujourd’hui, heure du Maroc.")
        + " Toutes leurs demandes encore en attente sont incluses, même plus anciennes.",
      lockedFilters:["type","status"]});
  const leave = () => {
    if (selected && previousTab) {
      previousTab.classList.add("active");
      previousTab.setAttribute("aria-current", "page");
    }
    selected = false;
    history.invalidate();
    panel.hidden = true;
    original.hidden = false;
    buttons.forEach(button => {
      button.classList.remove("active");
      button.setAttribute("aria-current", "false");
    });
  };
  nav.addEventListener("click", event => {
    const button = event.target.closest("[data-today-activity]");
    if (!button) { leave(); return; }
    if (!selected) previousTab = nav.querySelector("[data-tab].active");
    selected = button.dataset.todayActivity;
    original.hidden = true;
    panel.hidden = false;
    nav.querySelectorAll("button").forEach(item => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-current", item === button ? "page" : "false");
    });
    mount();
  }, true);
  document.querySelector("#refresh").addEventListener("click", event => {
    if (!selected) return;
    event.stopImmediatePropagation();
    mount();
  }, true);
  document.querySelector("#logout").addEventListener("click", leave, true);
})();
