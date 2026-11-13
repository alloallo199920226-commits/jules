(() => {
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  window.openAdminUserMaintenance = async ({api,onComplete}) => {
    if(document.querySelector("[data-user-purge-dialog]"))return;
    const dialog=document.createElement("dialog");dialog.className="admin-purge-dialog";dialog.dataset.userPurgeDialog="1";
    dialog.innerHTML='<h2>Suppression définitive</h2><p role="status">Calcul des comptes créés il y a plus de 7 jours…</p><button type="button" data-purge-close>Fermer</button>';
    document.body.appendChild(dialog);dialog.showModal();
    let mutating=false, preview, requestId=crypto.randomUUID();
    const close=()=>{if(mutating)return;dialog.close();dialog.remove();};
    dialog.addEventListener("cancel",event=>{event.preventDefault();close();});
    dialog.addEventListener("click",event=>{if(event.target.closest("[data-purge-close]"))close();});
    try {
      preview=await api("/api/admin/users-purge-preview");
      if(!dialog.isConnected)return;
      const cutoff=new Date(preview.cutoff).toLocaleString("fr-FR");
      dialog.innerHTML=`<h2>Supprimer les comptes de plus de 7 jours</h2>
        <p><strong>${escape(preview.count)} comptes</strong> créés avant le ${escape(cutoff)}.</p>
        <p>Seront aussi effacés : ${escape(preview.depositCount)} dépôts, ${escape(preview.withdrawalCount)} retraits,
        ${escape(preview.vipCount)} achats VIP et ${Number(preview.balanceTotal||0).toLocaleString("fr-FR")} FCFA de soldes cumulés.</p>
        <p><strong>Cette opération est définitive. Les historiques supprimés ne seront plus affichables.</strong> Les comptes plus récents sont conservés.</p>
        <form data-purge-form><label>Mot de passe administrateur<input type="password" name="password" autocomplete="current-password" required></label>
        <label>Saisissez SUPPRIMER<input name="confirmation" autocomplete="off" required pattern="SUPPRIMER"></label>
        <p data-purge-error role="alert"></p><div class="admin-history-pages"><button type="button" data-purge-close>Annuler</button>
        <button type="submit" class="admin-primary-button" ${Number(preview.count)===0?"disabled":""}>Supprimer définitivement</button></div></form>`;
      dialog.querySelector("form").addEventListener("submit",async event=>{
        event.preventDefault();if(mutating||!event.target.reportValidity())return;
        const form=event.target, password=form.elements.password.value,confirmation=form.elements.confirmation.value;
        form.elements.password.value="";mutating=true;
        dialog.querySelectorAll("button,input").forEach(control=>control.disabled=true);
        const error=dialog.querySelector("[data-purge-error]");error.textContent="Suppression en cours…";
        try {
          const result=await api("/api/admin/users-purge",{method:"POST",body:JSON.stringify({password,confirmation,confirmationToken:preview.confirmationToken,requestId})});
          mutating=false;close();await onComplete(result);
        } catch(reason) {
          error.textContent=`${reason.message} En cas de coupure réseau, le résultat peut être incertain. Une nouvelle tentative dans cette fenêtre conserve le même identifiant et ne répète pas une suppression déjà enregistrée.`;
          mutating=false;dialog.querySelectorAll("button,input").forEach(control=>control.disabled=false);form.elements.password.focus();
        }
      });
      dialog.querySelector('input[type="password"]').focus();
    } catch(reason){if(dialog.isConnected)dialog.querySelector('[role="status"]').textContent=reason.message;}
  };
})();