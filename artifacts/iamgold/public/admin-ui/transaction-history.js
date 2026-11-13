/* Shared, bounded rendering of an unbounded, server-searched financial history. */
(() => {
  const escape = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const money = value => `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
  const dates = value => { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toLocaleString("fr-FR") : "Date indisponible"; };
  const statusName = value => ({pending:"En attente",pending_review:"À vérifier",pending_verification:"Vérification en cours",approved:"Approuvé",completed:"Confirmé",rejected:"Refusé",failed:"Échoué",cancelled:"Annulé",expired:"Expiré"}[value] || value);
  window.createAdminTransactionHistory = ({root, api, scope, isActive, onMutation, renderCard}) => {
    let context = "", filters = {}, cursor = null, cursors = [null], page = 0, nextCursor = null;
    let rows = [], total = null, generation = 0, loading = false, mutating = false, timer, lastMessage = "";
    const base = scope === "cameroon" ? "/api/cameroon-admin" : "/api/admin";
    const active = () => isActive() && root.querySelector("[data-history-panel]");
    function card(row) {
        if(renderCard){
          return renderCard(row)
            .replace(/\sdata-tx-type="[^"]*"/g,"")
            .replace(/\sdata-tx="[^"]*"/g,` data-history-key="${escape(row.type+":"+row.id)}"`)
            .replace(/\sdata-next="([^"]*)"/g,(_match,value)=>` data-history-action="${escape(value)}"`);
        }
        const actionable = ["pending","pending_review"].includes(row.status);
        const approve = actionable && (row.type === "withdrawal" || row.paymentProvider === "manual");
        return `<article class="admin-list-card"><div class="admin-card-main">
          <div><h3>${row.type==="deposit"?"Dépôt":"Retrait"} ${row.adminAssisted?"· Admin crédit":""} · #${escape(row.id)}</h3>
          <p>${escape(row.registrationNumber || row.userPhone)} · ${escape(row.operatorName || "Opérateur non renseigné")}</p>
          <p>Compte de paiement : ${escape(row.payerNumber || row.destination || "—")}</p>
          <p>Référence : ${escape(row.reference)} · ${escape(dates(row.createdAt))}</p></div>
          <div><strong>${money(row.amount)}</strong><p>${escape(statusName(row.status))}</p>
          ${row.type==="withdrawal"?`<p>Net : ${money(row.netAmount)} · Frais : ${money(row.fee)}</p>`:""}</div></div>
          ${actionable?`<div class="admin-card-actions">${approve?`<button type="button" class="admin-primary-button" data-history-action="approved" data-history-key="${escape(row.type+":"+row.id)}">Approuver</button>`:"<span>Confirmation par le prestataire requise.</span>"}<button type="button" data-history-action="rejected" data-history-key="${escape(row.type+":"+row.id)}">Refuser</button></div>`:""}
        </article>`;
    }
    function paint(keepCards = false) {
      if (!active()) return;
      const list = root.querySelector("[data-history-list]");
      if (!keepCards) list.innerHTML = rows.map(card).join("") || `<p class="admin-empty">${loading?"Chargement…":lastMessage?"Historique indisponible.":"Aucune transaction pour ces filtres."}</p>`;
      root.querySelector("[data-history-total]").textContent = total===null?"":`${rows.length} opérations sur cette page · ${total} au total · Page ${page+1}`;
      root.querySelector("[data-history-message]").textContent = loading ? "Actualisation…" : lastMessage;
      root.querySelector("[data-history-previous]").disabled = loading || mutating || page === 0;
      root.querySelector("[data-history-next]").disabled = loading || mutating || !nextCursor;
      root.querySelectorAll("[data-history-action]").forEach(button => button.disabled = loading || mutating);
    }
    async function load() {
      const version = ++generation;
      loading = true; lastMessage = ""; paint();
      const query = new URLSearchParams({...filters,limit:"50"});
      if (cursor) query.set("cursor",cursor);
      try {
        const result = await api(`${base}/transaction-history?${query}`);
        if (version !== generation || !active()) return;
        if (!Array.isArray(result.transactions) || !/^\d+$/.test(String(result.total)) ||
            !(result.nextCursor===null || typeof result.nextCursor==="string")) throw Error("Historique reçu invalide.");
        rows = result.transactions; total = String(result.total); nextCursor = result.nextCursor; loading = false; paint();
      } catch (reason) {
        if (version !== generation || !active()) return;
        loading = false; lastMessage = `${reason.message} Utilisez Actualiser pour réessayer.`; paint();
      }
    }
    function mount(defaults = {}, view = {}) {
      const key = JSON.stringify({defaults,view});
      if (context !== key) { context=key; filters={type:"all",status:"all",assistance:"all",search:"",...defaults}; cursor=null;cursors=[null];page=0;rows=[];nextCursor=null;total=null; }
      generation++;clearTimeout(timer);
      root.innerHTML = `<section class="admin-panel" data-history-panel><h2>${escape(view.title || "Historique des transactions")}</h2>
        <p>${escape(view.description || "Toutes les opérations restent accessibles, sans limite d’historique. La recherche porte sur l’ensemble des pages.")}</p>
        <div class="admin-history-filters">
        <label>Type<select data-history-filter="type"><option value="all">Dépôts et retraits</option><option value="deposit">Dépôts</option><option value="withdrawal">Retraits</option></select></label>
        <label>Statut<select data-history-filter="status"><option value="all">Tous les statuts</option><option value="pending">En attente</option><option value="approved">Confirmés</option><option value="rejected">Refusés</option></select></label>
        <label>Rechercher<input type="search" data-history-search placeholder="Numéro, référence ou identifiant"></label></div>
         <p data-history-message role="status" style="min-height:1.5em"></p><p data-history-total></p>
        <div class="admin-list" data-history-list style="overflow-anchor:none"></div>
        <div class="admin-history-pages"><button type="button" data-history-previous>Précédent</button><button type="button" data-history-next>Suivant</button></div></section>`;
      root.querySelectorAll("[data-history-filter]").forEach(select=>{select.value=filters[select.dataset.historyFilter];select.disabled=(select.dataset.historyFilter==="type" && defaults.assistance==="admin") || (view.lockedFilters||[]).includes(select.dataset.historyFilter);});
      root.querySelector("[data-history-search]").value=filters.search;
      load();
    }
    function resetPage() { generation++;cursor=null;cursors=[null];page=0;nextCursor=null;load(); }
    root.addEventListener("input",event=>{
      if (!event.target.matches("[data-history-search]") || mutating) return;
      filters.search=event.target.value.trim();generation++;clearTimeout(timer);timer=setTimeout(resetPage,200);
    });
    root.addEventListener("change",event=>{
      if (!event.target.matches("[data-history-filter]") || mutating) return;
      filters[event.target.dataset.historyFilter]=event.target.value;clearTimeout(timer);resetPage();
    });
    root.addEventListener("click",async event=>{
      const button=event.target.closest("button");if(!button || !active() || loading || mutating)return;
      if(button.hasAttribute("data-history-previous")&&page>0){page--;cursor=cursors[page];load();return;}
      if(button.hasAttribute("data-history-next")&&nextCursor){cursors=cursors.slice(0,page+1);cursors.push(nextCursor);page++;cursor=nextCursor;load();return;}
      if(!button.dataset.historyAction)return;
      const row=rows.find(item=>item.type+":"+item.id===button.dataset.historyKey);if(!row)return;
      const approve=button.dataset.historyAction!=="rejected";
      const status=approve?(row.type==="withdrawal"?"completed":"approved"):"rejected";
      if(!window.confirm(`${approve?"Approuver":"Refuser"} ce ${row.type==="deposit"?"dépôt":"retrait"} de ${money(row.amount)} ?`))return;
      let proofReference;
      if(row.type==="deposit"&&approve&&!["manual","westpay"].includes(row.paymentProvider)){
        proofReference=window.prompt("Référence opérateur unique confirmant le paiement :")?.trim();
        if(!proofReference)return;
      }
      mutating=true;const version=++generation;clearTimeout(timer);paint(true);
      let committed=false;
      try {
        await api(`${base}/${row.type==="deposit"?"deposits":"withdrawals"}/${encodeURIComponent(row.id)}`,{method:"PATCH",body:JSON.stringify({status,...(proofReference?{proofReference}:{})})});
        committed=true;
        if(version===generation&&active()){
          const list=root.querySelector("[data-history-list]"),element=button.closest("article");
          // Preserve the viewport, not the browser's anchor to a card below the removed row.
          const positions=[];
          for(let node=root;node;node=node.parentElement)positions.push([node,node.scrollTop]);
          const scrollX=window.scrollX,scrollY=window.scrollY;
          row.status=status;
          const remains=filters.status==="all"||filters.status===(approve?"approved":"rejected");
          if(remains){
            if(element)element.outerHTML=card(row);
          }else{
            rows=rows.filter(item=>item!==row);
            if(total!==null)total=String(BigInt(total)>0n?BigInt(total)-1n:0n);
            element?.remove();
            if(!rows.length)list.innerHTML='<p class="admin-empty">Aucune autre transaction sur cette page.</p>';
          }
          lastMessage="Opération enregistrée.";paint(true);
          list.getBoundingClientRect();
          positions.forEach(([node,top])=>{node.scrollTop=top;});
          window.scrollTo({left:scrollX,top:scrollY,behavior:"instant"});
        }
      } catch(reason){if(version===generation&&active()){lastMessage=reason.message;paint(true);}}
      finally {mutating=false;paint(true);}
      // Refresh summary data separately: never remount or reorder the active queue.
      if(committed){
        try{await onMutation();}
        catch(reason){if(version===generation&&active()){lastMessage=`Opération enregistrée. Synthèse non actualisée : ${reason.message}`;paint(true);}}
      }
    });
    return {mount,refresh:load,invalidate:()=>{generation++;clearTimeout(timer);}};
  };
})();