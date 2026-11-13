(() => {
  "use strict";
  const restricted=document.body?.dataset?.adminScope==="restricted";
  if(restricted)document.querySelectorAll('[data-tab="channels"],[data-tab="cameroon"]').forEach(button=>button.remove());
  const $=(s,r=document)=>r.querySelector(s), login=$("#login-view"), dash=$("#dashboard-view"), out=$("#admin-content"), note=$("#admin-notice"), err=$("#admin-error");
  let data=null, tab="overview", q="", kind="deposit", filter="pending", adminCreditFilter="pending", selected=null, busy=false, editProduct=null, editChannel=null, editAnnouncement=null, channelsData=[], announcementsData=[];
  let loadRequest=null, dataVersion=0, renderVersion=0, searchTimer=null, searchCards=[], draftDirty=false, socialRefreshing=false;
  let cameroonTotals=null, cameroonError="", cameroonLoading=false, cameroonRequestVersion=0;
  let transactionHistory=null, userSearch=null;
  const pendingReads=new Map();
  const scopePath=()=>{const raw=location.pathname.split("/").filter(Boolean)[0]||"";try{return decodeURIComponent(raw);}catch(_){return raw;}};
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const money=v=>`${Number(v||0).toLocaleString("fr-FR")} FCFA`, date=v=>v?new Date(v).toLocaleString("fr-FR"):"—";
  const request=async(url,o={})=>{if(restricted&&/^\/api\/admin\/(?:login|logout)$/.test(url))url=url.replace("/api/admin/","/api/restricted-admin/");const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const r=await fetch(url,{credentials:"same-origin",...o,signal:o.signal||controller.signal,headers:{"Content-Type":"application/json",...(o.headers||{})}}),b=await r.json().catch(()=>({}));if(!r.ok){const e=new Error(b.error||"Action impossible.");e.status=r.status;throw e;}return b;}catch(e){if(e.name==="AbortError")throw new Error("La connexion prend trop de temps. Veuillez réessayer.");throw e;}finally{clearTimeout(timer)}};
  const api=(url,o={})=>{
    if((o.method||"GET")!=="GET")return request(url,o);
    const version=renderVersion;
    let promise=pendingReads.get(url);
    if(!promise){
      promise=request(url,o).finally(()=>{if(pendingReads.get(url)===promise)pendingReads.delete(url);});
      pendingReads.set(url,promise);
    }
    // A resource callback must never write into a newer tab or edit form.
    const checkView=()=>{
      if(/\/(?:gift-codes|payment-channels|announcements|popup-config|payment-provider-controls)$/.test(url)&&(version!==renderVersion||dash.hidden))
        throw Object.assign(new Error("Vue remplacée."),{name:"StaleViewError"});
    };
    return promise.then(result=>{checkView();return result;},error=>{checkView();throw error;});
  };
  function updateBusy(){
    const loading=Boolean(loadRequest)||busy||socialRefreshing||cameroonLoading;
    dash.classList.toggle("admin-refreshing",loading);
    dash.setAttribute("aria-busy",String(loading));
    $("#refresh").disabled=loading;
    $("#refresh").setAttribute("aria-label",loading?"Actualisation en cours":"Actualiser");
  }
  function filterSearch(){
    let count=0;
    for(const item of searchCards){const match=!q||item.text.includes(q);item.node.hidden=!match;if(match)count++;}
    const empty=$("[data-search-empty]");
    if(empty)empty.hidden=count>0;
  }
  const socialAdmin=createSocialAdmin(out,false,()=>tab==="social"&&!dash.hidden);
  function createSocialAdmin(root,cameroonOnly,isActive=()=>true){
    const base=cameroonOnly?"/api/cameroon-admin/social/posts":"/api/admin/social/posts";
    const states=["pending","approved","rejected"],labels={pending:"En attente",approved:"Approuvés",rejected:"Rejetés"};
    let status="pending",posts=[],nextCursor=null,cursors=[null],page=0,loaded=false,loading=false,mutating=false,message="",messageBad=false,requestGeneration=0;
    const escape=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
    const displayDate=value=>{if(!value)return"—";const parsed=new Date(value);return Number.isNaN(parsed.getTime())?"—":parsed.toLocaleString("fr-FR");};
    function updateFeedback(){const node=root.querySelector("[data-social-feedback]");if(!node)return;node.textContent=message;node.hidden=!message;node.className=`social-message ${messageBad?"is-error":"is-success"}`;node.setAttribute("role",messageBad?"alert":"status");}
    async function request(url,options={}){
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
      try{
        const method=String(options.method||"GET").toUpperCase();
        const bodyOptions=method!=="GET"&&method!=="HEAD"&&options.body===undefined?{body:"{}"}:{};
        const response=await fetch(url,{credentials:"same-origin",...options,...bodyOptions,signal:options.signal||controller.signal,headers:{"Content-Type":"application/json",...(options.headers||{})}});
        const body=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(body.error||"Action impossible.");
        return body;
      }catch(error){if(error.name==="AbortError")throw new Error("La connexion prend trop de temps. Veuillez réessayer.");throw error;}
      finally{clearTimeout(timer);}
    }
    function render(){
      if(!isActive())return;
      if(!loaded&&!loading){root.innerHTML='<section class="admin-panel"><h2>Blogue</h2><p role="status">Chargement sécurisé…</p></section>';load();return;}
      const cards=posts.map(post=>{
        const author=post.author||{},images=Array.isArray(post.images)?post.images:[];
        const imageMarkup=images.map((image,index)=>{
          const id=String(image?.id||"");
          if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return "";
          return `<img src="/api/social/images/${escape(id)}" alt="Image ${index+1} du dossier" loading="lazy">`;
        }).join("");
        const review=post.status==="rejected"&&post.reviewNote?`<p class="social-review-note"><strong>Motif de refus :</strong> ${escape(post.reviewNote)}</p>`:"";
        let actions=post.status==="pending"?`<div class="social-review-actions"><form data-social-action="approve"><label>Bonus (FCFA)<input name="bonus" type="number" min="0" step="1" inputmode="numeric" required aria-label="Bonus entier non négatif en FCFA"></label><button type="submit" class="social-approve">Approuver et créditer le bonus</button></form><form data-social-action="reject"><label>Motif du refus<textarea name="reason" minlength="1" maxlength="1000" rows="3" required></textarea></label><button type="submit" class="social-reject">Refuser le dossier</button></form></div>`:"";
        actions+=`<div class="social-delete-actions"><button type="button" class="social-reject" data-social-delete="${escape(post.id)}">Annuler et supprimer définitivement</button><small>Supprime la publication et ses images du fil.${post.status==="approved"?" La prime déjà versée reste acquise.":""}</small></div>`;
        return `<article class="admin-list-card social-post-card" data-social-post="${escape(post.id)}"><div class="social-post-top"><div><span class="admin-status ${escape(post.status)}">${escape(labels[post.status]||post.status)}</span><h3>Dossier · ${escape(author.registrationNumber||"Inscription inconnue")}</h3></div><small>${escape(displayDate(post.createdAt))}</small></div><p class="social-post-caption">${escape(post.caption)}</p><div class="social-post-meta"><span><strong>Pays</strong>${escape(author.country||"Non renseigné")}</span><span><strong>Utilisateur</strong>#${escape(author.userId??"—")}</span><span><strong>Soumis le</strong>${escape(displayDate(post.createdAt))}</span><span><strong>Approuvé le</strong>${escape(displayDate(post.approvedAt))}</span>${post.status==="approved"?`<span><strong>Bonus versé</strong>${escape(Number(post.bonus||0).toLocaleString("fr-FR"))} FCFA</span>`:""}</div><div class="social-post-images" aria-label="${images.length} image(s)">${imageMarkup}</div>${review}${actions}</article>`;
      }).join("");
        root.innerHTML=`<section class="admin-panel social-admin-panel"><header class="social-admin-heading"><div><h2>Forum · Modération</h2><p>Examinez les dossiers et les images avant toute décision.</p></div></header><div class="social-status-filters" role="group" aria-label="Filtrer les dossiers">${states.map(value=>`<button type="button" data-social-status="${value}" class="${status===value?"active":""}" aria-pressed="${status===value}">${labels[value]}</button>`).join("")}</div><p class="social-message ${messageBad?"is-error":"is-success"}" data-social-feedback role="${messageBad?"alert":"status"}" ${message?"":"hidden"}>${escape(message)}</p>${loading&&!loaded?'<p role="status">Chargement des dossiers…</p>':cards?`<div class="social-post-list">${cards}</div>`:'<p class="admin-empty">Aucun dossier dans cette catégorie.</p>'}<nav class="social-pagination" aria-label="Pagination des dossiers"><button type="button" data-social-page="previous" ${page===0||mutating?"disabled":""}>Précédent</button><span>Page ${page+1}</span><button type="button" data-social-page="next" ${nextCursor===null||mutating?"disabled":""}>Suivant</button></nav></section>`;
      root.querySelectorAll('[data-social-action] button,[data-social-delete]').forEach(button=>{button.disabled=mutating;});
    }
    async function deletePublication(postId){
      if(mutating||!posts.some(post=>post.id===postId))return;
      if(!window.confirm("Annuler et supprimer définitivement cette publication, ses images, ses mentions J’aime et ses vues ? Elle disparaîtra du fil. Cette action est irréversible. Les primes déjà versées restent acquises."))return;
      mutating=true;requestGeneration++;message="";messageBad=false;
      root.querySelectorAll('[data-social-action] button,[data-social-delete]').forEach(button=>button.disabled=true);
      try{
        const result=await request(`${base}/${encodeURIComponent(postId)}`,{method:"DELETE"});
        if(!result.ok||!result.deleted)throw new Error("La suppression n’a pas été confirmée par le serveur.");
        posts=posts.filter(post=>post.id!==postId);cursors=[null];page=0;nextCursor=null;render();
        const refreshed=await load();
        message=refreshed?"Publication et images supprimées définitivement.":"Publication supprimée définitivement. Actualisation impossible : "+message;messageBad=!refreshed;
      }catch(error){message=error.message;messageBad=true;}
      finally{mutating=false;root.querySelectorAll('[data-social-action] button,[data-social-delete]').forEach(button=>button.disabled=false);updateFeedback();}
    }
    async function load(){
      const generation=++requestGeneration;
      loading=true;
       const cursor=cursors[page],requestedStatus=status;
      const query=new URLSearchParams({status:requestedStatus});
       query.set("cursor",String(cursor??0));
      try{
        const result=await request(`${base}?${query.toString()}`);
        if(generation!==requestGeneration)return false;
         if(!result||!Array.isArray(result.posts)||!(result.nextCursor===null||typeof result.nextCursor==="string"||Number.isSafeInteger(result.nextCursor)))throw new Error("Réponse de dossiers invalide.");
        posts=result.posts;nextCursor=result.nextCursor;loaded=true;loading=false;message="";messageBad=false;render();return true;
      }catch(error){if(generation!==requestGeneration)return false;loading=false;message=error.message;messageBad=true;if(!isActive())return false;if(!loaded){root.innerHTML=`<section class="admin-panel social-admin-panel"><h2>Blogue</h2><p class="social-message is-error" role="alert">${escape(message)}</p><button type="button" data-social-retry="1">Réessayer</button></section>`;}else{render();}return false;}
    }
    root.addEventListener("click",event=>{
      const button=event.target.closest("button");if(!button||!root.contains(button))return;
      if(mutating)return;
      if(button.dataset.socialDelete){deletePublication(button.dataset.socialDelete);return;}
      if(button.dataset.socialRetry){message="";load();return;}
      if(button.dataset.socialStatus){status=button.dataset.socialStatus;requestGeneration++;loading=false;cursors=[null];page=0;posts=[];nextCursor=null;loaded=false;message="";render();return;}
      if(button.dataset.socialPage==="previous"&&page>0){page--;message="";load();return;}
       if(button.dataset.socialPage==="next"&&nextCursor!==null){cursors=cursors.slice(0,page+1);cursors.push(nextCursor);page++;message="";load();}
    });
    root.addEventListener("submit",async event=>{
      const form=event.target.closest("form[data-social-action]");if(!form||!root.contains(form))return;
      event.preventDefault();if(mutating)return;
      if(!form.reportValidity())return;
      const card=form.closest("[data-social-post]")||form.closest(".social-post-card"),postId=card?.dataset.socialPost;
      if(!postId)return;
      const action=form.dataset.socialAction,raw=action==="approve"?form.elements.bonus.value:form.elements.reason.value;
      const amount=Number(raw),reason=String(raw).trim();
       if(action==="approve"&&(!Number.isSafeInteger(amount)||amount<0)){form.elements.bonus.focus();return;}
      if(action==="reject"&&(!reason||Array.from(raw).length>500)){form.elements.reason.focus();return;}
       const confirmation=action==="approve"?(amount===0?"Approuver ce dossier sans attribuer de bonus ?":`Approuver et créditer le bonus de ${amount.toLocaleString("fr-FR")} FCFA ?`):"Confirmer le refus de ce dossier ?";
      if(!window.confirm(confirmation))return;
      mutating=true;message="";messageBad=false;root.querySelectorAll('[data-social-action] button').forEach(button=>button.disabled=true);
      try{
        await request(`${base}/${encodeURIComponent(postId)}/${action}`,{method:"POST",body:JSON.stringify(action==="approve"?{bonus:amount}:{reason})});
        const refreshed=await load();
         if(refreshed){message=action==="approve"?(amount===0?"Dossier approuvé sans bonus.":"Dossier approuvé et bonus crédité."):"Dossier refusé.";messageBad=false;}
        else{message=`Action enregistrée par le serveur. Actualisation impossible : ${message}`;messageBad=true;}
      }catch(error){message=error.message;messageBad=true;}
      finally{mutating=false;root.querySelectorAll('[data-social-action] button').forEach(button=>button.disabled=false);updateFeedback();}
    });
    return {render,refresh(){if(loading||mutating)return;message="";messageBad=false;return load();}};
  }
  const renderTransactionCard=txCard;
  txCard=function(t){const provider=String(t.paymentProvider??t.payment_provider??"").toLowerCase();if(t.type==="withdrawal"||provider!=="ashtechpay")return renderTransactionCard(t).replaceAll('data-tx="',`data-tx-type="${esc(t.type)}" data-tx="`);const card=renderTransactionCard({...t,paymentProvider:"ashtechpay"}),withProvider=card.replace('<div class="admin-detail-grid">','<div class="admin-detail-grid"><small><b>Fournisseur de paiement</b><span>stripe pay</span></small><small><b>Confirmation du paiement</b><span>Automatique après vérification par le fournisseur</span></small>');return withProvider.replace(/<div class="admin-card-actions admin-icon-actions">[\s\S]*?<\/div>/,"")};
  const msg=(s,bad=false)=>{if(s==="Vue remplacée.")return;const a=bad?err:note,c=bad?note:err;c.hidden=true;a.textContent=s;a.hidden=!s;};
  const resourceError=(name,error)=>{if(error.name==="StaleViewError")return;const node=$(`[data-resource="${name}"]`);if(node)node.innerHTML=`<p class="admin-empty">${esc(error.message)}<br><button type="button" data-reload-tab="1">Réessayer</button></p>`;msg(error.message,true);};
  const st=v=>`<span class="admin-status ${esc(v)}">${esc(v)}</span>`;
  const btn=(s,a="")=>`<button type="button" ${a}>${esc(s)}</button>`;
  const copyIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>';
  const copyable=(value,label)=>{const text=String(value||"—");return `<span class="admin-copyable-value"><span>${esc(text)}</span>${text!=="—"?`<button type="button" data-copy-value="${esc(text)}" title="Copier ${esc(label)}" aria-label="Copier ${esc(label)}">${copyIcon}</button>`:""}</span>`;};
  const icon=(name)=>({deposit:'<svg viewBox="0 0 24 24"><path d="M12 3v14m-5-5 5 5 5-5M5 21h14"/></svg>',withdrawal:'<svg viewBox="0 0 24 24"><path d="M12 21V7m-5 5 5-5 5 5M5 3h14"/></svg>',users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-7a5 5 0 0 1 5 5v2"/></svg>',product:'<svg viewBox="0 0 24 24"><path d="m12 3 8 4-8 4-8-4 8-4Zm-8 4v10l8 4 8-4V7M12 11v10"/></svg>',wallet:'<svg viewBox="0 0 24 24"><path d="M3 6h18v14H3zM16 11h5v5h-5a2.5 2.5 0 0 1 0-5Z"/></svg>',check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',x:'<svg viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18"/></svg>',edit:'<svg viewBox="0 0 24 24"><path d="m4 20 4-1 11-11-3-3L5 16zM14 7l3 3"/></svg>',trash:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3m-9 0 1 14h10l1-14"/></svg>'})[name]||'';
  async function load({force=false,renderView=true}={}){
    if(loadRequest){await loadRequest;if(force)return load({force:true,renderView});return;}
    const version=dataVersion;
    if(!data)out.innerHTML='<div class="admin-panel admin-panel-loading" role="status">Chargement sécurisé…</div>';
    loadRequest=(async()=>{
      try{
        const result=await api(window.createAdminTransactionHistory?"/api/admin/overview?summary=true":"/api/admin/overview");
        if(version!==dataVersion)return;
        data=result;login.hidden=true;dash.hidden=false;
        const draft=out.querySelector("form");
        // A background financial refresh must not erase an unfinished form.
        if(renderView){if(!draft||!draftDirty||force)render();else msg("Données actualisées. Votre saisie est conservée.");}
      }catch(e){
        if(version!==dataVersion)return;
        if(e.status===401){data=null;renderVersion++;dash.hidden=true;login.hidden=false;}
        else{msg(e.message,true);if(!data){login.hidden=true;dash.hidden=false;out.innerHTML=`<div class="admin-panel admin-panel-loading" role="alert">${esc(e.message)}<br><button type="button" data-retry-overview="1">Réessayer</button></div>`;}}
      }finally{loadRequest=null;updateBusy();}
    })();
    updateBusy();await loadRequest;
  }
  async function act(url,method="POST",body={},success="Opération effectuée.",afterSuccess){
    if(busy)return;busy=true;dataVersion++;updateBusy();
    try{
      await api(url,{method,body:JSON.stringify(body)});
      dataVersion++;pendingReads.clear();
      editProduct=null;editChannel=null;editAnnouncement=null;
      if(afterSuccess)afterSuccess();msg(success);await load({force:true});
      return true;
    }catch(e){msg(e.message,true);return false;}
    finally{busy=false;updateBusy();}
  }
  const confirmAct=(text,fn)=>window.confirm(text)?fn():undefined;
  function stats(){let s=data.stats||{};return `<section class="admin-stats-grid">${[["Dépôts",money(s.approvedDeposits??s.completed_deposits),"deposit"],["Retraits",money(s.approvedWithdrawals??s.completed_withdrawals),"withdrawal"],["Utilisateurs",s.users,"users"],["VIP actifs",s.investments??s.active_vips,"product"],["Crédits admin",money(s.adminCredits),"wallet"]].filter(x=>!restricted||!["deposit","withdrawal"].includes(x[2])).map(x=>`<article class="admin-stat-card"><span>${icon(x[2])}</span><div><strong>${esc(x[1])}</strong><small>${esc(x[0])}</small></div></article>`).join("")}</section>`;}
  function overview(){let s=data.stats||{},mode=data.withdrawClosedOverride?"closed":data.withdrawOpenOverride?"open":"scheduled";out.innerHTML=`${stats()}<section class="admin-panel"><h2>État de la plateforme</h2><div class="admin-alert-grid"><article><strong>${esc(s.pendingDeposits||0)}</strong><span>dépôt(s) en attente</span></article><article><strong>${esc(s.pendingWithdrawals||0)}</strong><span>retrait(s) en attente</span></article></div><div class="admin-setting-row"><div><strong>Retraits</strong><small>${mode==="closed"?"Fermés manuellement — aucune nouvelle demande":mode==="open"?"Ouverts manuellement, même hors horaire":"Horaire normal : 10 h à 00 h (minuit), heure de l’Algérie"}</small></div><div class="admin-card-actions">${btn("Fermer",`data-withdraw-mode="closed" ${mode==="closed"?"disabled":""}`)}${btn("Ouvrir",`data-withdraw-mode="open" ${mode==="open"?"disabled":""}`)}${btn("Horaire normal",`data-withdraw-mode="scheduled" ${mode==="scheduled"?"disabled":""}`)}</div></div></section>`;}
  function txCard(t){let p=["pending","pending_review"].includes(t.status),w=t.type==="withdrawal",ref=(t.orderNumber||t.reference||"Non disponible").replace(/^(deposit|withdrawal)-/,""),registration=t.registrationNumber||t.userPhone||t.phone||"—",payer=t.paymentAccountReference||t.payerNumber||"Non renseigné",westpay=!w&&String(t.paymentProvider).toLowerCase()==="westpay",westpayConfirmed=westpay&&Boolean(t.providerConfirmedAt),adminBanner=w&&t.adminAssisted?`<div class="admin-assistance-banner"><strong>ADMIN</strong><span>${t.hasAdminCredit&&t.hasAdminVipGrant?"Crédit manuel et VIP octroyé":t.hasAdminCredit?"Crédit manuel de solde":"VIP octroyé"}</span></div>`:"",referralCount=Number(t.referralCount||0),referralLabel=`${String(referralCount).padStart(2,"0")} filleul${referralCount>1?"s":""}`;return `<article class="admin-list-card admin-transaction-card">${adminBanner}<div class="admin-transaction-details"><div class="admin-transaction-title"><strong class="${w?"admin-red-text":"admin-green-text"}">${money(t.amount)}</strong>${st(t.status)}</div><div class="admin-detail-grid"><small><b>N° d’inscription</b>${copyable(registration,"le numéro d’inscription")}</small><small><b>Identifiant utilisateur</b><span>#${esc(t.userId)}</span></small><small><b>Pays de l’utilisateur</b><span>${esc(t.countryCode||"Non renseigné")}</span></small><small><b>Opérateur</b><span>${esc(t.operatorName||"Non renseigné")}</span></small>${westpay?`<small><b>Fournisseur de paiement</b><span>WestPay</span></small>`:""}${w?`<small class="admin-referral-metric admin-referral-count"><b>Filleuls directs</b><span class="admin-referral-value">${esc(referralLabel)}</span></small><small class="admin-referral-metric admin-referral-money"><b>Commissions obtenues</b><span class="admin-referral-value">${money(t.referralCommissionAmount)}</span></small><small><b>Titulaire</b><span>${esc(t.walletHolderName||"Non renseigné")}</span></small><small><b>Numéro de réception</b><span>${esc(t.payerNumber||t.destination||"Non renseigné")}</span></small>`:`<small><b>Référence / compte de paiement</b>${copyable(payer,"la référence du compte de paiement")}</small>`}<small><b>N° de commande</b>${copyable(ref,"le numéro de commande")}</small>${westpay?`<small><b>Référence WestPay</b>${t.providerTxId?copyable(t.providerTxId,"la référence WestPay"):"<span>En attente du webhook signé</span>"}</small><small><b>Confirmation fournisseur</b><span>${westpayConfirmed?"Confirmée — validation admin requise":"En attente"}</span></small>`:""}<small><b>Heure d’initiation</b><span>${date(t.initiatedAt||t.createdAt||t.created_at)}</span></small>${w?`<small><b>Frais</b><span>${money(t.fee)}</span></small><small><b>Net à envoyer</b><span class="admin-green-text">${money(t.netAmount)}</span></small>`:""}</div></div>${p?`<div class="admin-card-actions admin-icon-actions">${(!westpay||westpayConfirmed)?`<button type="button" title="Valider" aria-label="Valider" data-tx="${esc(t.id)}" data-next="${w?"completed":"approved"}" class="approve">${icon("check")}</button>`:""}<button type="button" title="Refuser" aria-label="Refuser" data-tx="${esc(t.id)}" data-next="rejected" class="reject">${icon("x")}</button></div>`:""}</article>`;}
  function transactions(){let list=(data.transactions||[]).filter(t=>t.type===kind&&(kind!=="withdrawal"||!t.adminAssisted)&&((filter==="pending"&&["pending","pending_review"].includes(t.status))||(filter==="approved"&&["approved","completed"].includes(t.status))||(filter==="rejected"&&t.status==="rejected"))&&(!q||JSON.stringify(t).toLowerCase().includes(q)));out.innerHTML=`<section class="admin-panel"><h2>Transactions</h2><div class="admin-transaction-kind-tabs">${btn("Dépôts",`data-kind="deposit" class="${kind==="deposit"?"active":""}"`)}${btn("Retraits",`data-kind="withdrawal" class="${kind==="withdrawal"?"active":""}"`)}</div><div class="admin-transaction-filters">${[["pending","En attente"],["approved","Validés"],["rejected","Rejetés"]].map(x=>btn(x[1],`data-filter="${x[0]}" class="${filter===x[0]?"active":""}"`)).join("")}</div><input class="admin-runtime-search" data-search value="${esc(q)}" placeholder="Référence ou téléphone"><div class="admin-list">${list.map(txCard).join("")||'<p class="admin-empty">Aucune transaction.</p>'}</div></section>`;}
  function adminCredits(){let list=(data.withdrawals||[]).filter(t=>t.adminAssisted&&((adminCreditFilter==="pending"&&["pending","pending_review"].includes(t.status))||(adminCreditFilter==="approved"&&["approved","completed"].includes(t.status))||(adminCreditFilter==="rejected"&&t.status==="rejected"))&&(!q||JSON.stringify(t).toLowerCase().includes(q)));out.innerHTML=`<section class="admin-panel"><h2>Admin crédit</h2><p class="admin-section-description">Retraits des utilisateurs ayant reçu un crédit manuel ou un VIP octroyé par l’administration.</p><div class="admin-transaction-filters">${[["pending","En attente"],["approved","Validés"],["rejected","Rejetés"]].map(x=>btn(x[1],`data-admin-credit-filter="${x[0]}" class="${adminCreditFilter===x[0]?"active":""}"`)).join("")}</div><input class="admin-runtime-search" data-search value="${esc(q)}" placeholder="Référence ou téléphone"><div class="admin-list">${list.map(txCard).join("")||'<p class="admin-empty">Aucun retrait administratif dans cette catégorie.</p>'}</div></section>`;}
  function normalWithdrawals(){const list=(data.withdrawals||[]).filter(t=>!t.adminAssisted&&["pending","pending_review"].includes(t.status));out.innerHTML=`<section class="admin-panel"><h2>Retraits normaux</h2><p>Demandes en attente des utilisateurs sans crédit admin ni VIP octroyé.</p><div class="admin-list">${list.map(txCard).join("")||'<p class="admin-empty">Aucun retrait normal en attente.</p>'}</div></section>`;}
  function users(){
    if(!window.createAdminUserSearch){out.innerHTML='<section class="admin-panel" role="alert">La recherche des utilisateurs est indisponible. Rechargez la page.</section>';return;}
    if(!userSearch)userSearch=window.createAdminUserSearch({root:out,api:request,isActive:()=>Boolean(data)&&tab==="users"&&!dash.hidden});
    userSearch.mount();
  }
  function products(){const p=editProduct||{};out.innerHTML=`<section class="admin-panel"><h2>Produits</h2><form class="admin-inline-form admin-product-form" data-form="product"><label class="admin-product-field"><span>Nom du produit</span><input name="name" required placeholder="Ex. VIP 1" value="${esc(p.name)}"></label><label class="admin-product-field"><span>Prix du produit (FCFA)</span><input name="price" type="number" min="1" required placeholder="Ex. 3000" value="${esc(p.price)}"></label><label class="admin-product-field"><span>Revenu journalier (FCFA)</span><input name="dailyIncome" type="number" min="1" required placeholder="Ex. 600" value="${esc(p.dailyIncome)}"></label><label class="admin-product-field"><span>Revenu total (FCFA)</span><input name="totalIncome" type="number" min="1" required placeholder="Ex. 54000" value="${esc(p.totalIncome)}"></label><label class="admin-product-field"><span>Durée du produit (jours)</span><input name="durationDays" type="number" min="1" required placeholder="Ex. 90" value="${esc(p.durationDays)}"></label><button>${editProduct?"Enregistrer":"Ajouter"}</button>${editProduct?btn("Annuler",'data-cancel-edit="product"'):""}</form><div class="admin-list">${(data.products||[]).map(p=>`<article class="admin-list-card admin-product-card"><div class="admin-product-main"><div class="admin-product-heading"><strong>${esc(p.name)}</strong>${st(p.active?"actif":"inactif")}</div><div class="admin-product-details"><small><b>Prix</b><span>${money(p.price)}</span></small><small><b>Revenu journalier</b><span>${money(p.dailyIncome)} / jour</span></small><small><b>Revenu total</b><span>${money(p.totalIncome)}</span></small><small><b>Durée</b><span>${esc(p.durationDays)} jours</span></small></div></div><div class="admin-product-actions" aria-label="Actions du produit">${btn("Modifier",`data-product-edit="${esc(p.id)}" class="admin-product-edit"`)}${p.active?btn("Désactiver",`data-product-disable="${esc(p.id)}" class="admin-product-disable"`):btn("Réactiver",`data-product-activate="${esc(p.id)}" class="admin-product-activate"`)}${btn("Supprimer",`data-product-remove="${esc(p.id)}" class="admin-product-remove"`)}</div></article>`).join("")||'<p class="admin-empty">Aucun produit.</p>'}</div></section>`;}
  function codes(){out.innerHTML=`<section class="admin-panel"><h2>Codes cadeaux</h2><form class="admin-inline-form" data-form="code"><input name="code" minlength="16" placeholder="Vide = code sécurisé automatique"><input name="amount" type="number" min="1" required placeholder="Montant"><input name="maxRedemptions" type="number" min="1" max="10000" value="1" required placeholder="Utilisations maximales"><input name="expiresInDays" type="number" min="1" max="365" value="30" required placeholder="Expiration en jours"><button>Créer</button></form><div data-resource="codes">Chargement…</div></section>`;api("/api/admin/gift-codes").then(d=>{$('[data-resource="codes"]').innerHTML=(d.codes||[]).map(c=>`<article class="admin-list-card"><div><strong>${esc(c.code)}</strong><p>${money(c.amount)}</p><small>${esc(c.redemptions)} / ${esc(c.maxRedemptions)} utilisation(s) · expiration ${date(c.expiresAt)}</small></div>${btn("Supprimer",`data-code-delete="${esc(c.id)}" class="reject"`)}</article>`).join("")||'<p class="admin-empty">Aucun code.</p>';}).catch(e=>resourceError("codes",e));}
  const presets=[["MTN","#ffd000"],["ORANGE","#ff7900"],["MOOV","#20a0df"],["WAVE","#1c9bd1"],["AIRTEL","#d71920"],["TOGOCEL","#009b72"]];
  const eligibleCountries=[["Bénin","+229"],["Togo","+228"],["Niger","+227"],["Tchad","+235"],["Cameroun","+237"],["Sénégal","+221"],["Burkina Faso","+226"],["Côte d'Ivoire","+225"]];
  const logo=(c)=>c.logoUrl?`<span class="operator-logo" style="background:${esc(c.logoColor)}"><img src="${esc(c.logoUrl)}" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><strong hidden>${esc((c.logoText||"").slice(0,4))}</strong></span>`:`<span class="operator-logo" style="background:${esc(c.logoColor)}">${esc((c.logoText||"").slice(0,4))}</span>`;
  function channels(){const current=editChannel||{},selectedCountry=current.country||"";out.innerHTML=`<section class="admin-panel"><h2>Canaux de paiement par pays</h2><p>Seuls les canaux actifs renseignés ici apparaissent dans le dépôt du pays correspondant.</p><div class="admin-operator-presets">${presets.map(p=>`<button type="button" data-preset="${p[0]}"><span class="operator-logo" style="background:${p[1]}">${p[0].slice(0,4)}</span><small>${p[0]}</small></button>`).join("")}</div><form class="admin-inline-form" data-form="channel"><select name="country" required aria-label="Pays éligible"><option value="">Choisir un pays éligible</option>${eligibleCountries.map(([name,code])=>`<option value="${esc(name)}" data-code="${esc(code)}" ${selectedCountry===name?"selected":""}>${esc(name)}</option>`).join("")}</select><input name="countryCode" required readonly aria-label="Indicatif téléphonique" placeholder="Indicatif automatique" value="${esc(current.countryCode||"")}"><input name="operatorName" required placeholder="Canal / opérateur" value="${esc(current.operatorName||"")}"><input name="receiverNumber" required placeholder="Compte ou numéro marchand" value="${esc(current.receiverNumber||"")}"><input name="receiverName" placeholder="Nom du marchand" value="${esc(current.receiverName||"")}"><input name="ussdTemplate" placeholder="USSD : *123*{account}*{amount}#" value="${esc(current.ussdTemplate||"")}"><input name="logoUrl" placeholder="URL du logo" value="${esc(current.logoUrl||"")}"><input name="logoColor" value="${esc(current.logoColor||"#26352d")}"><input name="logoText" placeholder="Texte du logo" value="${esc(current.logoText||"")}"><button>${editChannel?"Enregistrer":"Ajouter le canal"}</button>${editChannel?btn("Annuler",'data-cancel-edit="channel"'):""}</form><div data-resource="channels">Chargement…</div></section>`;const countrySelect=$('[data-form="channel"] [name="country"]'),countryCode=$('[data-form="channel"] [name="countryCode"]');countrySelect.addEventListener("change",()=>{countryCode.value=countrySelect.selectedOptions[0]?.dataset.code||""});if(countrySelect.value&&!countryCode.value)countrySelect.dispatchEvent(new Event("change"));api("/api/admin/payment-channels").then(d=>{channelsData=d.channels||[];$('[data-resource="channels"]').innerHTML=channelsData.map(c=>`<article class="admin-list-card">${logo(c)}<div><strong>${esc(c.operatorName)}</strong><p>${esc(c.country)} (${esc(c.countryCode)}) · ${esc(c.receiverNumber)} · ${esc(c.receiverName)}</p><small>${c.isActive?"Actif et visible":"Inactif et masqué"} · ${esc(c.ussdTemplate)}</small></div><div>${btn("Modifier",`data-channel-edit="${esc(c.id)}"`)}${btn(c.isActive?"Désactiver":"Activer",`data-channel-toggle="${esc(c.id)}" data-active="${c.isActive}"`)}${btn("Supprimer",`data-channel-delete="${esc(c.id)}" class="reject"`)}</div></article>`).join("")||'<p class="admin-empty">Aucun canal.</p>';}).catch(e=>resourceError("channels",e));}
  function announcements(){const a=editAnnouncement||{};out.innerHTML=`<section class="admin-panel"><h2>Annonces</h2><form class="admin-announcement-form" data-form="announcement"><input name="title" required placeholder="Titre" value="${esc(a.title)}"><textarea name="content" required placeholder="Contenu">${esc(a.content)}</textarea><select name="kind"><option value="announcement">Annonce</option><option value="notification">Notification</option></select><select name="audience"><option value="all">Tous</option><option value="level">Niveau</option></select><input name="audienceLevel" placeholder="Niveau" value="${esc(a.audienceLevel)}"><button>${editAnnouncement?"Enregistrer":"Enregistrer en brouillon"}</button>${editAnnouncement?btn("Annuler",'data-cancel-edit="announcement"'):""}</form><div data-resource="announcements">Chargement…</div></section>`;api("/api/admin/announcements").then(d=>{announcementsData=d.announcements||[];$('[data-resource="announcements"]').innerHTML=announcementsData.map(a=>`<article class="admin-list-card"><div><strong>${esc(a.title)}</strong><p>${esc(a.content)}</p><small>${st(a.status)} · ${date(a.updatedAt||a.updated_at)}</small></div><div>${btn("Modifier",`data-ann-edit="${esc(a.id)}"`)}${a.status==="draft"?btn("Publier",`data-ann-publish="${esc(a.id)}"`):btn("Retirer",`data-ann-withdraw="${esc(a.id)}" class="reject"`)}${btn("Supprimer",`data-ann-delete="${esc(a.id)}" class="reject"`)}</div></article>`).join("")||'<p class="admin-empty">Aucune annonce.</p>';}).catch(e=>resourceError("announcements",e));}
  function settings(){const labels={depositMin:"Dépôt minimum",withdrawalMin:"Retrait minimum",withdrawalFeePercent:"Frais de retrait (%)",dashboxDeposit:"Montant rapide de dépôt",dashboxWithdraw:"Montant rapide de retrait",signupBonus:"Bonus d’inscription",checkinBonus:"Bonus de pointage"};out.innerHTML=`<section class="admin-panel"><h2>Paramètres financiers</h2><form class="admin-settings-grid" data-form="settings">${Object.keys(labels).map(k=>`<label>${labels[k]}<input name="${k}" type="number" min="0"></label>`).join("")}<label>Retraits maximum par jour<select name="maxWithdrawalsMode" aria-label="Limite quotidienne de retraits"><option value="limited">Nombre limité</option><option value="unlimited">Illimité</option></select></label><label>Nombre maximum de retraits par jour<input name="maxWithdrawals" type="number" min="1" step="1" required disabled></label><button class="admin-primary-button" disabled>Enregistrer</button></form></section>`;const form=$('[data-form="settings"]'),mode=form.elements.maxWithdrawalsMode,maxInput=form.elements.maxWithdrawals;mode.addEventListener("change",()=>{const unlimited=mode.value==="unlimited";maxInput.disabled=unlimited;maxInput.required=!unlimited});api("/api/admin/popup-config").then(d=>{if(!d.config)throw new Error("Les paramètres financiers sont indisponibles.");Object.entries(labels).forEach(([k])=>{const input=form.elements[k];if(input)input.value=d.config[k]??""});const max=d.config.maxWithdrawals;if(max===null){mode.value="unlimited";maxInput.value="";maxInput.disabled=true;maxInput.required=false}else if(Number.isSafeInteger(Number(max))&&Number(max)>0){mode.value="limited";maxInput.value=String(max);maxInput.disabled=false;maxInput.required=true}else throw new Error("La limite quotidienne reçue est invalide.");form.querySelector("button[type=submit],button:not([type])").disabled=false}).catch(e=>msg(e.message,true));}
  function paymentProviderControls(){
    out.insertAdjacentHTML("beforeend",'<section class="admin-panel" data-payment-providers><h2>Prestataires de dépôt</h2><div class="admin-setting-row"><div><strong>Saspay</strong><small data-saspay-state role="status">Chargement de l’état…</small></div><div class="admin-card-actions"><button type="button" class="admin-primary-button" data-payment-saspay disabled>Chargement…</button></div></div><div class="admin-setting-row"><div><strong>SonaraPay</strong><small data-sonara-state role="status">Chargement de l’état…</small></div><div class="admin-card-actions"><button type="button" class="admin-primary-button" data-payment-sonara disabled>Chargement…</button></div></div><p>La mise en réserve bloque les nouvelles collectes. Les clés, l’intégration et la vérification des paiements déjà engagés sont conservées.</p><p>Activer un prestataire met l’autre en réserve. Une panne ne réactive jamais automatiquement Saspay.</p><p>Les pays et opérateurs réservés au paiement manuel ne changent pas lors d’une réactivation.</p></section>');
    api("/api/admin/payment-provider-controls").then(d=>{
      if(typeof d.saspayEnabled!=="boolean")throw new Error("État du prestataire indisponible.");
      const panel=out.querySelector("[data-payment-providers]"),button=panel?.querySelector("[data-payment-saspay]");
      if(!button)return;
      panel.querySelector("[data-saspay-state]").textContent=d.saspayEnabled?"Actif pour les nouvelles demandes autorisées":"En réserve — nouvelles demandes manuelles";
      button.dataset.paymentSaspay=String(!d.saspayEnabled);
      button.textContent=d.saspayEnabled?"Mettre Saspay en réserve":"Réactiver Saspay";
      button.disabled=false;
      const sonaraButton=panel.querySelector("[data-payment-sonara]");
      panel.querySelector("[data-sonara-state]").textContent=d.sonarapayAutomaticEnabled?"Actif — paiement direct et confirmation signée":d.sonarapayConfigured?"En réserve — intégration et clés conservées":"Clé SDK ou secret webhook non configuré";
      sonaraButton.dataset.paymentSonara=String(!d.sonarapayAutomaticEnabled);
      sonaraButton.textContent=d.sonarapayAutomaticEnabled?"Mettre SonaraPay en réserve":"Activer SonaraPay";
      sonaraButton.disabled=!d.sonarapayConfigured;
    }).catch(e=>{
      if(e.name==="StaleViewError")return;
      const state=out.querySelector("[data-saspay-state]");
      if(state)state.textContent="État indisponible : aucune modification possible.";
      msg(e.message,true);
    });
  }
  function renderCameroonTotals(){
    if(cameroonLoading){
      out.innerHTML='<section class="admin-panel" aria-busy="true"><h2>Totaux · Cameroun</h2><p role="status">Chargement des totaux…</p></section>';
      return;
    }
    if(cameroonError){
      out.innerHTML=`<section class="admin-panel"><h2>Totaux · Cameroun</h2><p class="admin-error" role="alert">${esc(cameroonError)}</p><button type="button" data-cameroon-retry>Réessayer</button></section>`;
      return;
    }
    if(!cameroonTotals){
      out.innerHTML='<section class="admin-panel"><h2>Totaux · Cameroun</h2><p role="status">Aucun total chargé.</p></section>';
      return;
    }
    const format=value=>`${Number(value).toLocaleString("fr-FR")} XAF`;
    out.innerHTML=`<section class="admin-panel"><h2>Totaux · Cameroun</h2><p class="admin-section-description">Montants cumulés sur l’ensemble de l’historique pour les comptes du Cameroun. Seules les opérations terminées sont incluses ; les opérations en attente ou rejetées sont exclues.</p><section class="admin-stats-grid" aria-label="Totaux des opérations Cameroun"><article class="admin-stat-card"><span>${icon("deposit")}</span><div><strong>${esc(format(cameroonTotals.totalDeposits))}</strong><small>Total des dépôts terminés</small></div></article><article class="admin-stat-card"><span>${icon("withdrawal")}</span><div><strong>${esc(format(cameroonTotals.totalWithdrawals))}</strong><small>Total des retraits terminés</small></div></article></section><button type="button" data-cameroon-refresh>Actualiser les totaux</button></section>`;
  }
  async function loadCameroonTotals(){
    if(restricted||tab!=="cameroon"||dash.hidden)return;
    const requestVersion=++cameroonRequestVersion, viewVersion=renderVersion;
    const isCurrent=()=>requestVersion===cameroonRequestVersion&&renderVersion===viewVersion&&tab==="cameroon"&&!dash.hidden;
    cameroonLoading=true;cameroonError="";renderCameroonTotals();updateBusy();
    try{
      const result=await api("/api/admin/cameroon-totals");
      if(!isCurrent())return;
      if(!result||typeof result.totalDeposits!=="number"||!Number.isFinite(result.totalDeposits)||result.totalDeposits<0||typeof result.totalWithdrawals!=="number"||!Number.isFinite(result.totalWithdrawals)||result.totalWithdrawals<0||result.currency!=="XAF"||result.country!=="Cameroun")throw new Error("Réponse des totaux Cameroun invalide.");
      cameroonTotals=result;cameroonError="";
    }catch(error){
      if(!isCurrent())return;
      cameroonTotals=null;cameroonError=error.message||"Impossible de charger les totaux Cameroun.";
    }finally{
      if(isCurrent()){cameroonLoading=false;renderCameroonTotals();updateBusy();}
    }
  }
  function render(){
    renderVersion++;draftDirty=false;clearTimeout(searchTimer);
    if(tab!=="cameroon"){cameroonRequestVersion++;cameroonLoading=false;updateBusy();}
    document.querySelectorAll("[data-tab]").forEach(b=>{b.classList.toggle("active",b.dataset.tab===tab);b.setAttribute("aria-current",b.dataset.tab===tab?"page":"false");});
    if(restricted&&tab==="cameroon")tab="overview";
    if(!data)return;
    userSearch?.invalidate();
    if(window.createAdminTransactionHistory && ["transactions","normalWithdrawals","adminCredits","history"].includes(tab)){
      if(!transactionHistory)transactionHistory=window.createAdminTransactionHistory({root:out,api,scope:"general",
        renderCard:txCard,
        isActive:()=>Boolean(data)&&["transactions","normalWithdrawals","adminCredits","history"].includes(tab),
        onMutation:async()=>{dataVersion++;await load({force:true,renderView:false});}});
      if(tab==="normalWithdrawals"){
        transactionHistory.mount({type:"withdrawal",assistance:"normal",status:"pending"},
          {title:"Retraits normaux",description:"Demandes en attente des utilisateurs sans crédit admin ni VIP octroyé.",lockedFilters:["type","status"]});
      }else transactionHistory.mount(tab==="history"?{}:tab==="adminCredits"?{type:"withdrawal",assistance:"admin",status:"pending"}:{assistance:"normal",status:"pending"});
      return;
    }
    transactionHistory?.invalidate();
    if(tab==="support"&&window.renderSupportInbox){
      const supportVersion=renderVersion;
      window.renderSupportInbox({root:out,api,isActive:()=>tab==="support"&&supportVersion===renderVersion&&!dash.hidden});
      return;
    }
    if(tab==="social"){socialAdmin.render();return;}
    if(tab==="cameroon"){renderCameroonTotals();loadCameroonTotals();return;}
    const query=q;q="";
    ({overview,transactions,normalWithdrawals,adminCredits,users,products,codes,channels,announcements,settings}[tab]||overview)();
    if(tab==="settings")paymentProviderControls();
    if(tab==="users"&&window.openAdminUserMaintenance){
      out.querySelector(".admin-panel").insertAdjacentHTML("afterbegin",'<button type="button" data-users-purge>Supprimer les comptes de plus de 7 jours</button>');
    }
    q=query;
    const search=out.querySelector("[data-search]");
    searchCards=[];
    if(search){
      search.value=q;
      searchCards=[...out.querySelectorAll(".admin-list > .admin-list-card")].map(node=>({node,text:node.textContent.toLowerCase()}));
      const list=out.querySelector(".admin-list");
      if(searchCards.length)list.insertAdjacentHTML("beforeend",'<p class="admin-empty" data-search-empty hidden>Aucun résultat pour cette recherche.</p>');
      filterSearch();
    }
  }
  async function userPanel(id) {
    selected=id; const version=renderVersion; let d;
    try { d=await api(`/api/admin/users/${id}`); } catch(e) { msg(e.message,true); return; }
    if(selected!==id||version!==renderVersion||dash.hidden)return;
    document.querySelectorAll(".admin-overlay").forEach(panel=>panel.remove());
    const u=d.user,w=d.wallet||{};
    const rows=(d.transactions||[]).map(t=>`<div class="admin-mini-row"><span>${esc(t.type)} · ${st(t.status)}</span><strong>${money(t.amount)}</strong></div>`).join("");
    const vip=(d.orders||[]).map(o=>`<div class="admin-mini-row"><span>${esc(o.productName)}<small>${date(o.createdAt)}</small></span>${btn("Révoquer",`data-vip-revoke="${esc(o.id)}" class="reject"`)}</div>`).join("");
    const panel=document.createElement("div");panel.className="admin-overlay";panel.innerHTML=`<section class="admin-user-panel" role="dialog" aria-modal="true" aria-label="Gestion de l’utilisateur"><header><div><strong>${esc(u.phone)}</strong><small>Utilisateur #${esc(u.id)}</small></div><button class="admin-panel-close" type="button" data-user-close title="Fermer" aria-label="Fermer">${icon("x")}</button></header><div class="admin-user-body"><div class="admin-balance"><span>Solde disponible</span><strong>${money(w.balance)}</strong></div><div class="admin-balance-actions"><input name="credit" type="number" min="1" placeholder="Crédit"><button data-balance="credit">Créditer</button><input name="debit" type="number" min="1" placeholder="Débit"><button class="danger" data-balance="debit">Débiter</button></div><div class="admin-user-actions">${btn(u.isBanned?"Débannir":"Bannir",'data-moderate="ban"')}${btn(u.isBlocked?"Débloquer":"Bloquer",'data-moderate="block"')}${btn(u.withdrawalsDisabled?"Ouvrir retraits":"Fermer retraits",'data-moderate="withdrawals"')}</div><h3>Octroyer un VIP</h3><div class="admin-grant-row"><select name="vipProduct"><option value="">Choisir un produit</option>${(data.products||[]).filter(p=>p.active).map(p=>`<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select>${btn("Octroyer",'data-vip-grant')}</div><div class="admin-summary-grid"><span>Dépôts<strong>${money(w.totalDeposits)}</strong></span><span>Retraits<strong>${money(w.totalWithdrawals)}</strong></span><span>Crédits admin<strong>${money(w.totalAdminCredits)}</strong></span><span>Commissions<strong>${money(w.totalCommissions)}</strong></span></div><h3>Transactions</h3>${rows||'<p class="admin-empty">Aucune transaction.</p>'}<h3>Historique VIP</h3>${vip||'<p class="admin-empty">Aucun VIP.</p>'}</div></section>`;
    if(restricted)panel.querySelectorAll(".admin-summary-grid > span").forEach(node=>{if(/^(Dépôts|Retraits)/.test(node.textContent))node.remove()});
    document.body.appendChild(panel);
    panel.addEventListener("click",async e=>{
      const b=e.target.closest("button");if(!b)return;
      if(b.hasAttribute("data-user-close")){panel.remove();return;}
      if(b.dataset.balance){const n=Number($(`[name="${b.dataset.balance}"]`,panel).value);if(!Number.isSafeInteger(n)||n<1||!window.confirm(`Confirmer ${b.dataset.balance==="credit"?"le crédit":"le débit"} de ${money(n)} ?`))return;if(b.dataset.pendingAmount!==String(n)){b.dataset.pendingAmount=String(n);b.dataset.pendingRequest=crypto.randomUUID();}b.disabled=true;const ok=await act(`/api/admin/users/${id}/${b.dataset.balance}`,"POST",{amount:n,requestId:b.dataset.pendingRequest},"Solde mis à jour.");b.disabled=false;if(ok)panel.remove();return;}
      if(b.dataset.moderate){const route=b.dataset.moderate==="ban"?(u.isBanned?"unban":"ban"):b.dataset.moderate==="block"?(u.isBlocked?"unblock":"block"):(u.withdrawalsDisabled?"open-withdrawals":"close-withdrawals");await act(`/api/admin/users/${id}/${route}`,"POST",{}, "Statut utilisateur mis à jour.");panel.remove();return;}
      if(b.hasAttribute("data-vip-grant")){const product=Number($('[name="vipProduct"]',panel).value);if(!product){msg("Sélectionnez un produit VIP.",true);return;}if(window.confirm("Octroyer ce VIP ?")){await act(`/api/admin/users/${id}/grant-vip`,"POST",{productId:product,requestId:crypto.randomUUID()},"VIP octroyé.");panel.remove();}return;}
      if(b.dataset.vipRevoke){await confirmAct("Révoquer ce VIP ? Sans remboursement.",()=>act(`/api/admin/orders/${b.dataset.vipRevoke}/revoke-vip`,"POST",{},"VIP révoqué."));panel.remove();}
    });
    panel.addEventListener("click",e=>{if(e.target===panel)panel.remove()});
    const closeOnEscape=e=>{if(e.key==="Escape"){panel.remove();document.removeEventListener("keydown",closeOnEscape)}};document.addEventListener("keydown",closeOnEscape);
  }
  document.querySelector("#admin-login").addEventListener("submit",async e=>{e.preventDefault();const b=e.currentTarget.querySelector('button[type="submit"]'),le=$("#login-error");if(b.disabled)return;b.disabled=true;b.setAttribute("aria-busy","true");le.hidden=true;try{await api("/api/admin/login",{method:"POST",body:JSON.stringify({password:$("#admin-password").value,path:scopePath()})});$("#admin-password").value="";await load({force:true});}catch(x){le.textContent=x.message;le.hidden=false;}finally{b.disabled=false;b.removeAttribute("aria-busy");}});
  $(".admin-password-toggle").addEventListener("click",e=>{const p=$("#admin-password"),v=p.type==="text";p.type=v?"password":"text";e.currentTarget.textContent=v?"Afficher":"Masquer";});
  $("#logout").addEventListener("click",async()=>{dataVersion++;renderVersion++;data=null;userSearch?.invalidate();pendingReads.clear();try{await api("/api/admin/logout",{method:"POST"});}finally{dash.hidden=true;login.hidden=false;out.innerHTML="";}});
  $("#refresh").addEventListener("click",async()=>{if(busy||socialRefreshing)return;if(tab==="cameroon")return loadCameroonTotals();if(tab!=="social")return load();socialRefreshing=true;updateBusy();try{await socialAdmin.refresh();}finally{socialRefreshing=false;updateBusy();}});
  document.querySelector(".admin-runtime-nav").addEventListener("click",e=>{const b=e.target.closest("[data-tab]");if(restricted&&["channels","cameroon"].includes(b?.dataset.tab))return;if(b&&b.dataset.tab!==tab){tab=b.dataset.tab;q="";render();}});
  out.addEventListener("input",e=>{if(e.target.matches("[data-search]")){q=e.target.value.trim().toLowerCase();clearTimeout(searchTimer);searchTimer=setTimeout(filterSearch,100);}else if(e.target.closest("form"))draftDirty=true;});
  out.addEventListener("change",e=>{if(e.target.closest("form"))draftDirty=true;});
  out.addEventListener("click",async e=>{
    const b=e.target.closest("button");if(!b)return;
    if(b.hasAttribute("data-cameroon-retry")||b.hasAttribute("data-cameroon-refresh")){if(tab==="cameroon")await loadCameroonTotals();return;}
    if(b.hasAttribute("data-users-purge")){
      if(busy)return;
      await window.openAdminUserMaintenance({api,onComplete:async result=>{
        dataVersion++;await load({force:true});msg(`${result.deletedUsers} comptes supprimés définitivement.`);
      }});
      return;
    }
    if(b.dataset.retryOverview)return load();
    if(b.dataset.reloadTab)return render();
    if(b.dataset.copyValue){const value=b.dataset.copyValue;try{await navigator.clipboard.writeText(value);}catch(_){const field=document.createElement("textarea");field.value=value;field.style.position="fixed";field.style.opacity="0";document.body.appendChild(field);field.select();document.execCommand("copy");field.remove();}b.classList.add("copied");b.setAttribute("aria-label","Copié");msg("Valeur copiée.");setTimeout(()=>{b.classList.remove("copied");},1200);return;}
    if(b.dataset.kind){kind=b.dataset.kind;render();return;} if(b.dataset.filter){filter=b.dataset.filter;render();return;} if(b.dataset.adminCreditFilter){adminCreditFilter=b.dataset.adminCreditFilter;render();return;}
    if(b.dataset.withdrawMode){const mode=b.dataset.withdrawMode;return confirmAct(mode==="closed"?"Fermer toutes les nouvelles demandes de retrait, même pendant les horaires habituels ? Les demandes déjà en attente restent à traiter.":mode==="open"?"Ouvrir les retraits même hors horaire ? Les restrictions individuelles restent actives.":"Rétablir les horaires de retrait de 10 h à 00 h (minuit), heure de l’Algérie ?",()=>act("/api/admin/withdraw-override","PATCH",{mode},"Règle de retrait mise à jour."));}
    if(b.dataset.paymentSaspay==="true"||b.dataset.paymentSaspay==="false"){
      if(busy)return;
      const enabled=b.dataset.paymentSaspay==="true";
      b.disabled=true;
      try { await act("/api/admin/payment-provider-controls","PATCH",{saspayEnabled:enabled},enabled?"Saspay réactivé pour les opérateurs autorisés.":"Saspay mis en réserve. Les paiements déjà engagés restent vérifiables."); }
      finally { if(b.isConnected)b.disabled=false; }
      return;
    }
    if(b.dataset.paymentSonara==="true"||b.dataset.paymentSonara==="false"){
      if(busy)return;
      const enabled=b.dataset.paymentSonara==="true";
      b.disabled=true;
      try { await act("/api/admin/payment-provider-controls","PATCH",{sonarapayEnabled:enabled},enabled?"SonaraPay activé. Saspay reste en réserve.":"SonaraPay mis en réserve. Les canaux manuels restent accessibles."); }
      finally { if(b.isConnected)b.disabled=false; }
      return;
    }
    if(b.dataset.tx){const transaction=(data.transactions||[]).find(t=>String(t.id)===String(b.dataset.tx)&&t.type===b.dataset.txType);if(!transaction){msg("Opération introuvable. Actualisez les transactions.",true);return;}const endpoint=transaction.type==="withdrawal"?"withdrawals":"deposits",provider=transaction.paymentProvider??transaction.payment_provider??"manual",westpay=endpoint==="deposits"&&String(provider).toLowerCase()==="westpay",manual=endpoint==="deposits"&&provider==="manual";let proofReference;if(endpoint==="deposits"&&!westpay&&!manual&&b.dataset.next!=="rejected"){proofReference=window.prompt("Référence opérateur unique confirmant le paiement :","")?.trim();if(!proofReference){msg("La référence opérateur est obligatoire.",true);return;}}return confirmAct(b.dataset.next==="rejected"?"Refuser cette opération ?":"Valider cette opération confirmée ?",()=>act(`/api/admin/${endpoint}/${b.dataset.tx}`,"PATCH",{status:b.dataset.next,...(proofReference?{proofReference}: {})},"Transaction traitée.",()=>{const id=String(b.dataset.tx);data.transactions=(data.transactions||[]).filter(t=>String(t.id)!==id||t.type!==transaction.type);data[endpoint]=(data[endpoint]||[]).filter(t=>String(t.id)!==id);render();}));}
    if(b.dataset.user)return userPanel(b.dataset.user);
    if(b.dataset.productEdit){editProduct=(data.products||[]).find(p=>String(p.id)===String(b.dataset.productEdit))||null;render();return;}
    if(b.dataset.cancelEdit==="product"){editProduct=null;render();return;}
    if(b.dataset.productDisable)return confirmAct("Désactiver ce produit ? Il ne sera plus proposé aux utilisateurs.",()=>act(`/api/admin/products/${b.dataset.productDisable}`,"DELETE",{},"Produit désactivé."));
    if(b.dataset.productActivate)return act(`/api/admin/products/${b.dataset.productActivate}/activate`,"PATCH",{},"Produit réactivé.");
    if(b.dataset.productRemove)return confirmAct("Supprimer définitivement ce produit ? Cette action est irréversible et n’est possible que si le produit n’a jamais été acheté.",()=>act(`/api/admin/products/${b.dataset.productRemove}/permanent`,"DELETE",{},"Produit supprimé."));
    if(b.dataset.codeDelete)return confirmAct("Supprimer ce code cadeau ?",()=>act(`/api/admin/gift-codes/${b.dataset.codeDelete}`,"DELETE",{},"Code supprimé."));
    if(b.dataset.channelEdit){editChannel=channelsData.find(c=>String(c.id)===String(b.dataset.channelEdit))||null;channels();const form=$('[data-form="channel"]');if(form&&editChannel)Object.keys(editChannel).forEach(k=>{if(form.elements[k])form.elements[k].value=editChannel[k]??"";});return;}
    if(b.dataset.cancelEdit==="channel"){editChannel=null;render();return;}
    if(b.dataset.channelToggle)return act(`/api/admin/payment-channels/${b.dataset.channelToggle}`,"PATCH",{isActive:b.dataset.active!=="true"},"Canal mis à jour.");
    if(b.dataset.channelDelete)return confirmAct("Supprimer ce canal ?",()=>act(`/api/admin/payment-channels/${b.dataset.channelDelete}`,"DELETE",{},"Canal supprimé."));
    if(b.dataset.annEdit){editAnnouncement=announcementsData.find(a=>String(a.id)===String(b.dataset.annEdit))||null;render();return;}
    if(b.dataset.cancelEdit==="announcement"){editAnnouncement=null;render();return;}
    if(b.dataset.annPublish)return act(`/api/admin/announcements/${b.dataset.annPublish}/publish`,"POST",{},"Annonce publiée.");
    if(b.dataset.annWithdraw)return act(`/api/admin/announcements/${b.dataset.annWithdraw}/withdraw`,"POST",{},"Annonce retirée.");
    if(b.dataset.annDelete)return confirmAct("Supprimer cette annonce ?",()=>act(`/api/admin/announcements/${b.dataset.annDelete}`,"DELETE",{},"Annonce supprimée."));
    if(b.dataset.preset){const f=$('[data-form="channel"]');f.operatorName.value=b.dataset.preset==="TOGOCEL"?"Togocel":b.dataset.preset;f.logoText.value=b.dataset.preset;f.logoColor.value=({MTN:"#ffd000",ORANGE:"#ff7900",MOOV:"#20a0df",WAVE:"#1c9bd1",AIRTEL:"#d71920",TOGOCEL:"#009b72"})[b.dataset.preset];}
  });
  out.addEventListener("submit",async e=>{e.preventDefault();const f=e.target,fd=new FormData(f),o=Object.fromEntries(fd);if(f.dataset.form==="product"){["price","dailyIncome","totalIncome","durationDays"].forEach(k=>o[k]=Number(o[k]));await act(editProduct?`/api/admin/products/${editProduct.id}`:"/api/admin/products",editProduct?"PATCH":"POST",o,editProduct?"Produit modifié.":"Produit créé.");}if(f.dataset.form==="code"){["amount","maxRedemptions","expiresInDays"].forEach(k=>o[k]=Number(o[k]));await act("/api/admin/gift-codes","POST",o,"Code créé.");}if(f.dataset.form==="channel"){await act(editChannel?`/api/admin/payment-channels/${editChannel.id}`:"/api/admin/payment-channels",editChannel?"PATCH":"POST",o,editChannel?"Canal modifié.":"Canal créé.");}if(f.dataset.form==="announcement"){await act(editAnnouncement?`/api/admin/announcements/${editAnnouncement.id}`:"/api/admin/announcements",editAnnouncement?"PATCH":"POST",o,editAnnouncement?"Annonce modifiée.":"Brouillon enregistré.");}if(f.dataset.form==="settings"){const unlimited=f.elements.maxWithdrawalsMode.value==="unlimited",max=unlimited?null:Number(f.elements.maxWithdrawals.value);if(!unlimited&&(!Number.isSafeInteger(max)||max<=0)){msg("Le nombre maximum de retraits doit être un entier positif.",true);return}delete o.maxWithdrawalsMode;Object.keys(o).forEach(k=>o[k]=Number(o[k]));o.maxWithdrawals=max;await act("/api/admin/popup-config","PATCH",o,"Paramètres enregistrés.");}});
  load();
})();