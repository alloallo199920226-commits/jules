(() => {
  "use strict";
  const e=(tag,text,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;};
   const memberBadge=()=>{const badge=e("span",undefined,"support-member-gold-badge");badge.setAttribute("role","img");badge.setAttribute("aria-label","Badge membre IAMGOLD");badge.title="Badge membre IAMGOLD";const image=e("img");image.src="/iamgold-industrial-art/member-gold-badge.svg?v=2";image.alt="";image.setAttribute("aria-hidden","true");badge.append(image);return badge;};
  const json=value=>JSON.stringify(value);
  const newId=()=>crypto.randomUUID();
  window.renderSupportInbox=({root,api,isActive})=>{
    if(window.iamgoldSupportCleanup)window.iamgoldSupportCleanup();
    let selected=null,conversations=[],messages=[],draft="",file=null,fileVersion=0,previewUrl="",poll=null,disposed=false,loadToken=0,sending=false,nav=null,navListener=null,errorMessage="",threadUser=null,sendController=null,query="",filter="all",statusBusy=false,viewerCleanup=null,conversationRetryAt=0,threadRetryAt=0,conversationFailures=0,threadFailures=0,presenceRetryAt=0,presenceFailures=0;
    let lastRenderFingerprint="",renderedSelection=null,conversationRequest=null,conversationRefreshPending=false,threadRequest=null,threadRequestId=null,threadRefreshPending=false,presenceRequest=null,presencePostRequest=null,presenceReadBusy=false,presenceBusy=false,presenceOfflinePending=false,presenceActivePending=false,presenceObserver=null,presenceFlushTimer=null,presencePoll=null,activityHeartbeat=null,presenceKnown=false,presenceValue=null,presenceDeadline=0,rootInputHandler=null;
    const presenceClientId=newId(),queuedSeenIds=new Set(),ackedSeenIds=new Set(),listPresenceById=new Map(),draftsByAccount=new Map(),filesByAccount=new Map(),retryByAccount=new Map(),aborters=new Set();
    const viewport=window.visualViewport,framed=window.parent!==window;
    let viewportFrame=null;
    const measureInbox=()=>{
      viewportFrame=null;
      // The host iframe already follows the parent's visible viewport.
      // Applying the parent's offset/height again would move/shrink it twice.
      const height=framed?window.innerHeight:(viewport?.height??window.innerHeight);
      const top=framed?0:(viewport?.offsetTop??0);
      root.style.setProperty("--support-console-height",`${Math.round(height)}px`);
      root.style.setProperty("--support-console-top",`${Math.max(0,Math.round(top))}px`);
    };
    const resizeInbox=()=>{if(viewportFrame===null)viewportFrame=requestAnimationFrame(measureInbox);};
    measureInbox();
    viewport?.addEventListener("resize",resizeInbox);
    viewport?.addEventListener("scroll",resizeInbox);
    window.addEventListener("resize",resizeInbox);
    window.addEventListener("scroll",resizeInbox,{passive:true});
    const abortController=()=>{const controller=new AbortController();aborters.add(controller);controller.signal.addEventListener("abort",()=>aborters.delete(controller),{once:true});return controller;};
    const presencePath=id=>`/api/admin/support/conversations/${encodeURIComponent(String(id))}/presence`;
    const sendOfflineBeacon=id=>{
      if(!id)return;
      presenceActivePending=false;
      void fetch(presencePath(id),{method:"POST",credentials:"include",keepalive:true,headers:{"Content-Type":"application/json"},body:json({clientId:presenceClientId,active:false,messageIds:[]})}).catch(()=>{});
    };
    const halt=()=>{
      if(selected){presencePostRequest?.abort();sendOfflineBeacon(selected);}
      disposed=true;clearInterval(poll);clearInterval(presencePoll);clearInterval(activityHeartbeat);clearTimeout(presenceFlushTimer);presenceObserver?.disconnect();conversationRequest?.abort();threadRequest?.abort();presenceRequest?.abort();presencePostRequest?.abort();sendController?.abort();viewerCleanup?.();aborters.forEach(controller=>controller.abort());aborters.clear();
      if(previewUrl)URL.revokeObjectURL(previewUrl);
      if(nav&&navListener)nav.removeEventListener("click",navListener);
      if(rootInputHandler)root.removeEventListener("input",rootInputHandler);
      viewport?.removeEventListener("resize",resizeInbox);
      viewport?.removeEventListener("scroll",resizeInbox);
      window.removeEventListener("resize",resizeInbox);
      window.removeEventListener("scroll",resizeInbox);
      if(viewportFrame!==null)cancelAnimationFrame(viewportFrame);
      root.style.removeProperty("--support-console-height");
      root.style.removeProperty("--support-console-top");
      document.removeEventListener("visibilitychange",onPresenceVisibility);
      window.removeEventListener("focus",onPresenceFocus);
      window.removeEventListener("blur",onPresenceBlur);
      window.removeEventListener("pagehide",onPresencePageHide);
      if(window.iamgoldSupportCleanup===halt)window.iamgoldSupportCleanup=null;
    };
    const canRun=()=>!disposed&&isActive();
    const request=async(url,options={})=>{
      const controller=abortController();
      const upstream=options.signal,relayAbort=()=>controller.abort();
      if(upstream?.aborted)controller.abort();
      else upstream?.addEventListener("abort",relayAbort,{once:true});
      const deadline=setTimeout(()=>controller.abort(),15000);
      try{return await api(url,{...options,signal:controller.signal});}
      finally{clearTimeout(deadline);upstream?.removeEventListener("abort",relayAbort);aborters.delete(controller);}
    };
    const retryDelay=failures=>Math.min(30000,1000*2**Math.min(failures,5));
    const adminThreadIsActive=()=>Boolean(!disposed&&isActive()&&selected&&document.visibilityState==="visible"&&document.hasFocus()&&!viewerCleanup);
    const formatPresenceStamp=value=>value?new Date(value).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}):"";
    const isMemberPresenceOnline=()=>Boolean(presenceKnown&&presenceValue?.presence?.online&&presenceDeadline&&performance.now()<presenceDeadline);
    const presenceLabel=()=>{
      if(!presenceKnown)return"Disponibilité non vérifiée";
      return isMemberPresenceOnline()?"En ligne":"Hors ligne";
    };
    const presenceDetails=value=>{
      if(!value?.presence)return"Historique de présence indisponible pour le moment.";
      const first=formatPresenceStamp(value?.presence?.firstSeenAt),last=formatPresenceStamp(value?.presence?.lastSeenAt);
      if(!first&&!last)return"Le suivi de présence commencera à la prochaine ouverture du chat par ce membre.";
      return[first?`Première présence enregistrée : ${first}`:"",last?`Dernière activité : ${last}`:""].filter(Boolean).join(" · ");
    };
    const listPresenceOnline=id=>{const value=listPresenceById.get(String(id));return Boolean(value?.known&&value.online&&value.expiresAt&&performance.now()<value.expiresAt);};
    const listPresenceLabel=id=>{const value=listPresenceById.get(String(id));return !value?.known?"Disponibilité non vérifiée":listPresenceOnline(id)?"En ligne":"Hors ligne";};
    const listPresenceDetails=id=>{
      const value=listPresenceById.get(String(id));
      if(!value)return"Historique de présence indisponible";
      const last=formatPresenceStamp(value.lastSeenAt),first=formatPresenceStamp(value.firstSeenAt);
      return last?`Dernière activité : ${last}`:first?`Première présence enregistrée : ${first}`:"Aucune présence enregistrée";
    };
    const listPresenceFingerprint=id=>{const value=listPresenceById.get(String(id));return[value?.known||false,listPresenceOnline(id),value?.firstSeenAt||null,value?.lastSeenAt||null];};
    const captureListPresence=(items,serverNow)=>{
      const serverTime=Date.parse(serverNow||""),sampledAt=performance.now(),seen=new Set();
      items.forEach(item=>{
        const id=String(item.id),raw=item.presence,prior=listPresenceById.get(id);seen.add(id);
        if(!raw){listPresenceById.set(id,{known:false,online:false,expiresAt:0,firstSeenAt:prior?.firstSeenAt||null,lastSeenAt:prior?.lastSeenAt||null});return;}
        const remaining=Date.parse(raw.onlineUntil||"")-serverTime,known=Number.isFinite(serverTime);
        listPresenceById.set(id,{
          known,online:Boolean(raw.online),expiresAt:known&&raw.online&&Number.isFinite(remaining)&&remaining>0?sampledAt+remaining:0,
          firstSeenAt:raw.firstSeenAt||null,lastSeenAt:raw.lastSeenAt||null,
        });
      });
      for(const id of listPresenceById.keys())if(!seen.has(id))listPresenceById.delete(id);
    };
    const invalidateListPresence=()=>{for(const [id,value]of listPresenceById)listPresenceById.set(id,{...value,known:false,online:false,expiresAt:0});};
    const updateConversationPresenceUi=()=>{
      root.querySelectorAll(".support-conversation[data-conversation]").forEach(row=>{
        const id=row.dataset.conversation,state=row.querySelector(".support-conversation-presence"),times=row.querySelector(".support-conversation-presence-times");
        if(state){state.textContent=listPresenceLabel(id);state.classList.toggle("is-online",listPresenceOnline(id));}
        if(times)times.textContent=listPresenceDetails(id);
      });
    };
    const updatePresenceUi=()=>{
      const node=root.querySelector(".support-member-presence");
      if(node){node.textContent=presenceLabel();node.classList.toggle("is-online",isMemberPresenceOnline());}
      const details=root.querySelector(".support-member-presence-details");
      if(details)details.textContent=presenceDetails(presenceValue);
    };
    const loadMemberPresence=async id=>{
      if(!id||presenceReadBusy||Date.now()<presenceRetryAt)return;
      presenceReadBusy=true;
      presenceRequest?.abort();
      const controller=abortController();presenceRequest=controller;
      try{
        const state=await request(presencePath(id),{signal:controller.signal});
        if(!canRun()||String(selected)!==String(id)||controller.signal.aborted)return;
        presenceValue=state;
        const serverNow=Date.parse(state.serverNow),until=Date.parse(state.presence?.onlineUntil||"");
        const remaining=until-serverNow;
        presenceDeadline=state.presence?.online&&Number.isFinite(remaining)&&remaining>0?performance.now()+remaining:0;
        presenceFailures=0;presenceRetryAt=0;presenceKnown=true;updatePresenceUi();
      }catch{
        if(!controller.signal.aborted){presenceFailures++;presenceRetryAt=Date.now()+retryDelay(presenceFailures);presenceKnown=false;updatePresenceUi();}
      }finally{
        presenceReadBusy=false;
        aborters.delete(controller);
        if(presenceRequest===controller)presenceRequest=null;
      }
    };
    const postAdminPresence=async(active,keepalive=false)=>{
      const targetId=String(selected||"");
      if(!targetId)return;
      const foreground=active&&adminThreadIsActive();
      if(!foreground&&keepalive){presencePostRequest?.abort();sendOfflineBeacon(targetId);return;}
      if(presenceBusy&&!keepalive){if(foreground)presenceActivePending=true;else presenceOfflinePending=true;return;}
      const messageIds=foreground?[...queuedSeenIds].slice(0,100):[];
      if(!keepalive)presenceBusy=true;
      const controller=abortController();presencePostRequest=controller;
      try{
        await request(presencePath(targetId),{method:"POST",body:json({clientId:presenceClientId,active:foreground,messageIds}),signal:controller.signal});
        if(foreground){
          messageIds.forEach(id=>{queuedSeenIds.delete(id);ackedSeenIds.add(id);});
          if(messageIds.length){void loadThread(false,true);void loadConversations(true);}
        }
      }catch{
        // Keep failed visible-message acknowledgements queued for the next heartbeat.
      }finally{
        aborters.delete(controller);
        if(!keepalive){
          presenceBusy=false;
          if(presencePostRequest===controller)presencePostRequest=null;
          if(presenceOfflinePending){presenceOfflinePending=false;sendOfflineBeacon(targetId);}
          if(presenceActivePending&&adminThreadIsActive()){presenceActivePending=false;setTimeout(()=>void postAdminPresence(true),50);}
        }
      }
    };
    function onPresenceVisibility(){
      if(!selected)return;
      if(adminThreadIsActive()){void postAdminPresence(true);void loadMemberPresence(selected);}
      else{presencePostRequest?.abort();sendOfflineBeacon(selected);}
    }
    function onPresenceFocus(){
      if(adminThreadIsActive()){void postAdminPresence(true);void loadMemberPresence(selected);}
    }
    function onPresenceBlur(){if(selected){presencePostRequest?.abort();sendOfflineBeacon(selected);}}
    function onPresencePageHide(){if(selected){presencePostRequest?.abort();sendOfflineBeacon(selected);}}
    const observeVisibleIncoming=()=>{
      presenceObserver?.disconnect();presenceObserver=null;
      const scroller=root.querySelector("[data-support-thread-scroll]");
      if(!scroller||!adminThreadIsActive())return;
      presenceObserver=new IntersectionObserver(entries=>{
        if(!adminThreadIsActive())return;
        for(const entry of entries){
          const id=entry.target.dataset.seenMessageId;
          const needed=Math.min(80,entry.boundingClientRect.height/2);
          if(!entry.isIntersecting||entry.intersectionRect.height<needed||!id||ackedSeenIds.has(id))continue;
          queuedSeenIds.add(id);
        }
        if(queuedSeenIds.size){
          clearTimeout(presenceFlushTimer);
          presenceFlushTimer=setTimeout(()=>{presenceFlushTimer=null;void postAdminPresence(true);},180);
        }
      },{root:scroller,threshold:[0,.25,.5,.75,1]});
      scroller.querySelectorAll("[data-seen-message-id]").forEach(node=>presenceObserver.observe(node));
    };
    const setPreview=(next)=>{
      if(previewUrl)URL.revokeObjectURL(previewUrl);
      file=next;fileVersion++;previewUrl=next?URL.createObjectURL(next):"";
    };
    const formatTime=value=>value?new Date(value).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"}):"";
    const downloadImage=src=>fetch(src,{credentials:"include"}).then(response=>{if(!response.ok)throw new Error();return response.blob();}).then(blob=>{const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="iamgold-piece-jointe";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}).catch(()=>window.open(src,"_blank","noopener,noreferrer"));
    const openViewer=src=>{
      let zoom=1;
      let closed=false;
      const returnFocus=document.activeElement,bodyOverflow=document.body.style.overflow,htmlOverflow=document.documentElement.style.overflow;
      const overlay=e("div",undefined,"support-image-viewer");overlay.setAttribute("role","dialog");overlay.setAttribute("aria-modal","true");overlay.setAttribute("aria-label","Aperçu de la pièce jointe");
      const image=e("img");image.src=src;image.alt="Pièce jointe";image.style.transform="scale(1)";
      const close=e("button","Fermer","support-viewer-close");close.type="button";close.setAttribute("aria-label","Fermer la visionneuse");
      const tools=e("div",undefined,"support-viewer-tools");
      const minus=e("button","−"),zoomLabel=e("span","100%"),plus=e("button","+"),download=e("button","Télécharger");
      [minus,plus,download].forEach(button=>button.type="button");
      minus.setAttribute("aria-label","Zoom arrière");plus.setAttribute("aria-label","Zoom avant");
      const update=()=>{image.style.transform=`scale(${zoom})`;zoomLabel.textContent=`${Math.round(zoom*100)}%`;};
      minus.onclick=()=>{zoom=Math.max(.5,zoom-.25);update();};plus.onclick=()=>{zoom=Math.min(3,zoom+.25);update();};download.onclick=()=>downloadImage(src);
      const dismiss=()=>{if(closed)return;closed=true;overlay.remove();document.removeEventListener("keydown",key);document.body.style.overflow=bodyOverflow;document.documentElement.style.overflow=htmlOverflow;if(viewerCleanup===dismiss)viewerCleanup=null;const fallback=root.querySelector(".support-thread-image-open");if(returnFocus?.isConnected)returnFocus.focus();else fallback?.focus();if(adminThreadIsActive())void postAdminPresence(true);};
      const key=event=>{
        if(event.key==="Escape"){event.preventDefault();dismiss();return;}
        if(event.key!=="Tab")return;
        const focusable=[...overlay.querySelectorAll("button:not(:disabled)")],first=focusable[0],last=focusable[focusable.length-1];
        if(!overlay.contains(document.activeElement)){event.preventDefault();(event.shiftKey?last:first)?.focus();return;}
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
      };
      close.onclick=dismiss;overlay.onclick=event=>{if(event.target===overlay)dismiss();};
      tools.append(minus,zoomLabel,plus,download);overlay.append(close,image,tools);document.body.append(overlay);
      document.body.style.overflow="hidden";document.documentElement.style.overflow="hidden";
      viewerCleanup=dismiss;document.addEventListener("keydown",key);close.focus();void postAdminPresence(false,true);
    };
    const render=()=>{
      if(!canRun())return;
      const old=root.querySelector("[data-support-thread-scroll]");
      const wasNearBottom=old?old.scrollHeight-old.scrollTop-old.clientHeight<100:true,y=old?.scrollTop||0;
      const oldDraft=root.querySelector("[data-support-draft]");
      const oldSelectionStart=oldDraft?.selectionStart,oldSelectionEnd=oldDraft?.selectionEnd;
      const keepFocus=oldDraft===document.activeElement;
      const oldSearch=root.querySelector(".support-conversation-search");
      const keepSearchFocus=oldSearch===document.activeElement,searchStart=oldSearch?.selectionStart,searchEnd=oldSearch?.selectionEnd;
      const oldForm=root.querySelector(".support-thread-composer");
      const oldSelected=renderedSelection;
      const signature=json({
        selected,query,filter,errorMessage,statusBusy,sending,fileVersion,threadUser:threadUser?[threadUser.id,threadUser.nickname,threadUser.phone,threadUser.email,threadUser.country,threadUser.createdAt,threadUser.avatarPath]:null,file:file?{name:file.name,size:file.size,lastModified:file.lastModified}:null,
        conversations:conversations.map(item=>[item.id,item.nickname,item.phone,item.country,item.lastMessage,item.lastImagePath,item.lastMessageAt,item.unread,item.status,item.avatarPath,item.createdAt,item.accountId,listPresenceFingerprint(item.id)]),
        messages:messages.map(message=>[message.id,message.clientId,message.sender,message.body,message.imagePath,message.createdAt,message.seenAt,message.liked,message.likes,message.sending]),
      });
      if(signature===lastRenderFingerprint){updatePresenceUi();return;}
      const shell=e("section",undefined,"admin-panel support-inbox");
      shell.setAttribute("aria-label","Service client en plein écran");
      const header=e("header",undefined,"support-inbox-heading");
      const exit=e("button","← Retour à l’administration","support-exit");
      exit.type="button";exit.disabled=sending;
      exit.onclick=()=>{
        if((draft.trim()||file)&&!window.confirm("Votre réponse n’a pas été envoyée. Quitter le service client sans l’envoyer ?"))return;
        const target=document.querySelector('#general-admin-nav [data-tab="overview"]')||document.querySelector('#general-admin-nav [data-tab]:not([data-tab="support"])');
        if(target)target.click();
        else{errorMessage="Le retour à l’administration est temporairement indisponible.";render();}
      };
      header.append(exit,e("div","Service client"),e("small",`${conversations.length} conversation(s)`));shell.append(header);
      if(errorMessage){const error=e("div",undefined,"support-inbox-error");error.dataset.supportError="1";error.setAttribute("role","alert");error.append(e("span",errorMessage));const dismiss=e("button","Fermer");dismiss.type="button";dismiss.onclick=()=>{errorMessage="";render();};error.append(dismiss);shell.append(error);}
       const layout=e("div",undefined,`support-inbox-layout${selected?" has-selection":""}`),list=e("aside",undefined,"support-inbox-list");
      list.setAttribute("aria-label","Conversations");
       const controls=e("div",undefined,"support-inbox-list-tools");
       const searchWrap=e("div",undefined,"support-search-wrap"),searchIcon=e("span");
       searchIcon.className="support-search-icon";searchIcon.setAttribute("aria-hidden","true");
       searchIcon.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="url(#support-search-gold)" stroke-width="2" stroke-linecap="round"><defs><linearGradient id="support-search-gold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff0a8"/><stop offset="1" stop-color="#b47d1c"/></linearGradient></defs><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></svg>';
       const search=e("input");search.type="search";search.placeholder="Rechercher une conversation…";search.value=query;search.setAttribute("aria-label","Rechercher une conversation");
        search.oninput=event=>{const input=event.currentTarget;query=input.value;const start=input.selectionStart,end=input.selectionEnd;render();const next=root.querySelector(".support-conversation-search");if(next!==input)next?.focus({preventScroll:true});if(start!==null&&end!==null)next?.setSelectionRange(start,end);};
       search.className="support-conversation-search";
       const clearSearch=e("button","Effacer la recherche","support-search-clear");clearSearch.type="button";clearSearch.hidden=!query;clearSearch.setAttribute("aria-label","Effacer la recherche");
       clearSearch.onclick=()=>{query="";render();root.querySelector(".support-conversation-search")?.focus();};
       searchWrap.append(searchIcon,search,clearSearch);
       const filters=e("div",undefined,"support-inbox-filters");
       [["all","Toutes"],["unread","Non lues"],["in_progress","En cours"],["resolved","Résolues"]].forEach(([value,label])=>{const button=e("button",label);button.type="button";button.setAttribute("aria-pressed",String(filter===value));if(filter===value)button.className="active";button.onclick=()=>{filter=value;render();};filters.append(button);});
       if(query||filter!=="all"){const reset=e("button","Réinitialiser","support-filter-reset");reset.type="button";reset.onclick=()=>{query="";filter="all";render();};filters.append(reset);}
       controls.append(searchWrap,filters);list.append(controls);
       const visible=conversations.filter(item=>{
         const unread=Number(item.unread)||0,status=item.status||"in_progress",text=[item.nickname,item.phone,item.country,item.lastMessage].filter(Boolean).join(" ").toLocaleLowerCase("fr");
         return (!query||text.includes(query.toLocaleLowerCase("fr")))&&(filter==="all"||(filter==="unread"?unread>0:status===filter));
       });
       if(!visible.length)list.append(e("p",conversations.length?"Aucune conversation pour ces critères.":"Aucune conversation reçue.","support-list-empty"));
       visible.forEach(conversation=>{
        const conversationId=String(conversation.id);
        const unread=Number(conversation.unread)||0;
        const button=e("button",undefined,`support-conversation${conversationId===String(selected)?" selected":""}${unread?" is-unread":""}`);
        button.type="button";button.dataset.conversation=conversationId;button.disabled=sending;
        const name=conversation.nickname||conversation.phone||"Membre";
        const avatar=conversation.avatarPath?e("img"):e("span",String(name).trim().charAt(0).toUpperCase());
        avatar.className="support-conversation-avatar";
        if(conversation.avatarPath){avatar.src=`/api/storage${conversation.avatarPath}`;avatar.alt="";avatar.loading="lazy";}
          const copy=e("div",undefined,"support-conversation-copy"),preview=conversation.lastMessage||(conversation.lastImagePath?"Photo":"");
          const nameLine=e("span",undefined,"support-conversation-name"),nameLabel=e("strong",name);
          nameLine.append(nameLabel);if(conversation.nickname)nameLine.append(memberBadge());
           const state=e("small",conversation.status==="resolved"?"Résolue":"En cours","support-conversation-state");
           const presence=e("small",listPresenceLabel(conversationId),"support-conversation-presence");
           if(listPresenceOnline(conversationId))presence.classList.add("is-online");
           const stateLine=e("div",undefined,"support-conversation-state-line");stateLine.append(state,presence);
           const presenceTimes=e("small",listPresenceDetails(conversationId),"support-conversation-presence-times");
           copy.append(nameLine,e("span",preview),e("small",`${conversation.country||"Pays non renseigné"} · ${conversation.phone||"Téléphone non renseigné"}`),stateLine,presenceTimes);
         if(conversation.lastMessageAt)button.dataset.timestamp=conversation.lastMessageAt;
         if(conversation.lastMessageAt){const time=e("time",formatTime(conversation.lastMessageAt),"support-conversation-time");time.dateTime=conversation.lastMessageAt;button.append(time);}
        button.append(avatar,copy);
        button.setAttribute("aria-label",`${name}${unread?`, ${unread} message(s) non lu(s)`:""} : ${conversation.lastMessage||"Photo"}`);
        if(unread)button.append(e("i",String(unread),"support-unread"));
        button.onclick=()=>{
          if(sending||conversationId===String(selected))return;
          if(selected){draftsByAccount.set(String(selected),draft);filesByAccount.set(String(selected),file);}
          if(selected){presencePostRequest?.abort();sendOfflineBeacon(selected);queuedSeenIds.clear();clearTimeout(presenceFlushTimer);presenceFlushTimer=null;}
          threadRequest?.abort();presenceRequest?.abort();selected=conversationId;messages=[];threadUser=null;threadFailures=0;threadRetryAt=0;presenceFailures=0;presenceRetryAt=0;presenceKnown=false;presenceValue=null;presenceDeadline=0;
          draft=draftsByAccount.get(conversationId)||"";setPreview(filesByAccount.get(conversationId)||null);
          errorMessage="";render();void loadThread(true);void loadMemberPresence(conversationId);void postAdminPresence(true);
        };
        list.append(button);
      });
      layout.append(list);
      const thread=e("section",undefined,"support-inbox-thread");
      thread.hidden=!selected;
      if(!selected||!conversations.some(item=>String(item.id)===String(selected))){
        thread.append(e("div","Sélectionnez une conversation pour lire les messages.","support-thread-empty"));
      }else{
        const active=conversations.find(item=>String(item.id)===String(selected));
        const back=e("button","← Conversations","support-thread-back");
        back.type="button";back.disabled=sending;back.setAttribute("aria-label","Retour aux conversations");
        back.onclick=()=>{
          if(sending)return;
          const leaving=String(selected);presencePostRequest?.abort();sendOfflineBeacon(leaving);queuedSeenIds.clear();clearTimeout(presenceFlushTimer);presenceFlushTimer=null;threadRequest?.abort();presenceRequest?.abort();
          draftsByAccount.set(leaving,draft);filesByAccount.set(leaving,file);
          selected=null;messages=[];threadUser=null;threadFailures=0;threadRetryAt=0;loadToken++;draft="";setPreview(null);errorMessage="";presenceKnown=false;presenceValue=null;presenceDeadline=0;
          render();void loadConversations();
        };
        thread.append(back);
         const title=e("header",undefined,"support-thread-title");
        const avatarPath=threadUser?.avatarPath||active.avatarPath;
        const avatar=avatarPath?e("img"):e("span",String(active.nickname||active.phone||"M").trim().charAt(0).toUpperCase(),"support-thread-avatar");
        if(avatarPath){avatar.src=`/api/storage${avatarPath}`;avatar.alt="Photo du membre";}
         const identity=e("div",undefined,"support-thread-identity"),threadNickname=threadUser?.nickname||active.nickname;
         const threadName=e("span",undefined,"support-thread-name"),threadNameLabel=e("strong",threadNickname||"Membre");
         threadName.append(threadNameLabel);if(threadNickname)threadName.append(memberBadge());
         identity.append(threadName);
        identity.append(e("small",[threadUser?.phone||active.phone,threadUser?.email||active.email,threadUser?.country||active.country].filter(Boolean).join(" · ")||"Compte membre"));
         const presenceStatus=e("small",presenceLabel(),"support-member-presence");if(isMemberPresenceOnline())presenceStatus.classList.add("is-online");identity.append(presenceStatus);
         const memberDetails=e("details",undefined,"support-member-details");
         memberDetails.open=Boolean(renderedSelection===selected&&root.querySelector(".support-member-details")?.open);
         memberDetails.append(e("summary","Informations du membre"));
         memberDetails.append(e("small",presenceDetails(presenceValue),"support-member-presence-details"));
        const joined=threadUser?.createdAt||active.createdAt;
        memberDetails.append(e("small",`Identifiant membre : ${String(threadUser?.id||active.accountId||active.id)}${joined?` · Inscrit le ${new Date(joined).toLocaleDateString("fr-FR")}`:""}`));
        identity.append(memberDetails);
         const statusToggle=e("button",active.status==="resolved"?"Réactiver":"Résoudre","support-status-toggle");
         statusToggle.type="button";statusToggle.disabled=statusBusy;statusToggle.setAttribute("aria-pressed",String(active.status==="resolved"));
         statusToggle.onclick=async()=>{if(statusBusy)return;const targetId=String(selected),status=active.status==="resolved"?"in_progress":"resolved";statusBusy=true;render();try{await request(`/api/admin/support/conversations/${encodeURIComponent(targetId)}/status`,{method:"PATCH",body:json({status})});conversations=conversations.map(item=>String(item.id)===targetId?{...item,status}:item);errorMessage="";}catch(error){errorMessage=error.message||"Impossible de modifier l’état."; }finally{statusBusy=false;render();}};
         title.append(avatar,identity,statusToggle);
        const scroll=e("div",undefined,"support-thread-messages");scroll.dataset.supportThreadScroll="1";
        messages.forEach(message=>{
           const row=e("article",undefined,`support-thread-message ${message.sender==="admin"?"from-admin":"from-member"}`);
           row.dataset.messageId=String(message.id);row.dataset.messageContent=json([message.id,message.sender,message.body,message.imagePath,message.createdAt]);
           if(message.sender==="member"&&!String(message.id).startsWith("local-"))row.dataset.seenMessageId=String(message.id);
          const bubble=e("div",undefined,"support-thread-bubble");
          if(message.body)bubble.append(e("p",message.body));
           if(message.imagePath){const media=e("div",undefined,"support-thread-media"),open=e("button");open.type="button";open.className="support-thread-image-open";open.setAttribute("aria-label","Afficher la pièce jointe en plein écran");const image=e("img");image.src=`/api/storage${message.imagePath}`;image.alt="Image envoyée dans la conversation";image.loading="lazy";open.append(image);open.onclick=()=>openViewer(image.src);const dl=e("button","Télécharger","support-attachment-download");dl.type="button";dl.onclick=()=>downloadImage(image.src);media.append(open,dl);bubble.append(media);}
          const footer=e("footer",undefined,"support-thread-message-meta");
          footer.append(e("time",new Date(message.createdAt).toLocaleString("fr-FR",{hour:"2-digit",minute:"2-digit"})));
           if(message.sending)footer.append(e("span","Envoi…"));
            else if(message.sender==="admin"){
              const receipt=e("span",message.seenAt?`Lu à ${new Date(message.seenAt).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"})}`:"Envoyé");
              if(message.seenAt)receipt.title=new Date(message.seenAt).toLocaleString("fr-FR");
              footer.append(receipt);
            }
          const like=e("button",message.liked?`Aimé · ${message.likes}`:`J’aime · ${message.likes}`,"support-message-like");
          like.type="button";like.disabled=Boolean(message.sending)||String(message.id).startsWith("local-");
          like.setAttribute("aria-pressed",String(Boolean(message.liked)));
          like.onclick=async()=>{
            if(like.disabled)return;
            const liked=!message.liked;
            messages=messages.map(item=>item.id===message.id?{...item,liked,likes:Math.max(0,item.likes+(liked?1:-1))}:item);render();
            try{await request(`/api/admin/support/messages/${encodeURIComponent(message.id)}/like`,{method:"POST",body:json({liked})});}
            catch(error){errorMessage=error.message||"La réaction n’a pas été enregistrée.";render();}
            finally{void loadThread(false);}
          };
          bubble.append(footer);row.append(bubble,like);scroll.append(row);
        });
         thread.append(title,scroll);
        if(file){const preview=e("div",undefined,"support-thread-preview"),image=e("img");image.src=previewUrl;image.alt="Aperçu de l’image";
          const remove=e("button","Retirer");remove.type="button";remove.disabled=sending;remove.onclick=()=>{setPreview(null);filesByAccount.set(String(selected),null);render();};
          preview.append(image,remove);thread.append(preview);}
        const form=e("form",undefined,"support-thread-composer");
        const textarea=e("textarea");textarea.dataset.supportDraft="1";textarea.value=draft;textarea.placeholder="Écrire une réponse…";textarea.maxLength=4000;textarea.disabled=sending;textarea.setAttribute("aria-label","Réponse au membre");
         textarea.oninput=event=>{
           draft=event.currentTarget.value;draftsByAccount.set(String(selected),draft);
           const submit=event.currentTarget.form?.querySelector('button[type="submit"]');
           if(submit)submit.disabled=sending||(!draft.trim()&&!file);
         };
        const controls=e("div",undefined,"support-thread-controls"),attach=e("label","Joindre une image","support-thread-attach");
        const input=e("input");input.type="file";input.accept="image/png,image/jpeg,image/webp";input.disabled=sending;input.setAttribute("aria-label","Choisir une image");
         input.onchange=event=>{
           const next=event.currentTarget.files&&event.currentTarget.files[0];if(!next)return;
          if(!["image/png","image/jpeg","image/webp"].includes(next.type)||next.size<1||next.size>5*1024*1024){errorMessage="Choisissez une image PNG, JPEG ou WebP de 5 Mo maximum.";render();return;}
          setPreview(next);filesByAccount.set(String(selected),next);errorMessage="";render();
        };
        attach.append(input);controls.append(attach,e("span","PNG, JPEG, WebP · 5 Mo max"));
        const send=e("button",sending?"Envoi…":"Envoyer","admin-primary-button");send.type="submit";send.disabled=sending||(!draft.trim()&&!file);controls.append(send);
        form.append(textarea,controls);
        form.onsubmit=async event=>{
          event.preventDefault();
          const targetId=String(selected),body=draft.trim(),selectedFile=file;
          if(sending||(!body&&!selectedFile))return;
          const prior=retryByAccount.get(targetId);
          const pending=prior&&prior.body===body&&prior.file===selectedFile?prior:{body,file:selectedFile,clientId:newId(),imagePath:undefined};
          retryByAccount.set(targetId,pending);sendController=new AbortController();
          const sendSignal=sendController.signal;sending=true;draft="";draftsByAccount.set(targetId,"");setPreview(null);filesByAccount.set(targetId,null);errorMessage="";
          const local={id:`local-${pending.clientId}`,clientId:pending.clientId,body,imagePath:pending.imagePath||null,sender:"admin",createdAt:new Date().toISOString(),liked:false,likes:0,sending:true};
          messages.push(local);render();
          try{
            let imagePath=pending.imagePath;
            if(selectedFile&&!imagePath){
              const ticket=await request("/api/admin/support/uploads/request-url",{method:"POST",body:json({name:selectedFile.name,size:selectedFile.size,contentType:selectedFile.type,accountId:targetId}),signal:sendSignal});
              const response=await fetch(ticket.uploadURL,{method:"PUT",headers:{"Content-Type":selectedFile.type},body:selectedFile,credentials:"omit",signal:sendSignal});
              if(!response.ok)throw new Error("Le transfert de l’image a échoué.");
              imagePath=ticket.objectPath;pending.imagePath=imagePath;
            }
            await request(`/api/admin/support/conversations/${encodeURIComponent(targetId)}/messages`,{method:"POST",body:json({body,...(imagePath?{imagePath}:{}),clientId:pending.clientId}),signal:sendSignal});
            retryByAccount.delete(targetId);draftsByAccount.delete(targetId);filesByAccount.delete(targetId);
            messages=messages.filter(item=>item.clientId!==pending.clientId);errorMessage="";
            await loadThread(false);await loadConversations();
          }catch(error){
            if(!sendSignal.aborted){messages=messages.filter(item=>item.clientId!==pending.clientId);draft=body;draftsByAccount.set(targetId,body);setPreview(selectedFile);filesByAccount.set(targetId,selectedFile);errorMessage=error.message||"Le message n’a pas été envoyé. Réessayez.";}
          }finally{
            sending=false;sendController=null;render();
          }
        };
        thread.append(form);
      }
      layout.append(thread);shell.append(layout);
      const nextSearch=shell.querySelector(".support-conversation-search");
      if(oldSearch&&nextSearch){
        if(oldSearch.value!==query)oldSearch.value=query;
        oldSearch.oninput=nextSearch.oninput;
        nextSearch.replaceWith(oldSearch);
      }
      const nextForm=shell.querySelector(".support-thread-composer");
      if(oldForm&&nextForm&&String(oldSelected||"")===String(selected||"")){
        const nextTextarea=nextForm.querySelector("[data-support-draft]");
        const nextFile=nextForm.querySelector('input[type="file"]');
        if(oldDraft&&nextTextarea){
          if(oldDraft.value!==nextTextarea.value)oldDraft.value=nextTextarea.value;
          oldDraft.disabled=nextTextarea.disabled;oldDraft.oninput=nextTextarea.oninput;
          nextTextarea.replaceWith(oldDraft);
        }
        const oldFile=oldForm.querySelector('input[type="file"]');
        if(oldFile&&nextFile){oldFile.disabled=nextFile.disabled;oldFile.accept=nextFile.accept;oldFile.onchange=nextFile.onchange;if(!file)oldFile.value="";nextFile.replaceWith(oldFile);}
        oldForm.onsubmit=nextForm.onsubmit;
        oldForm.replaceChildren(...nextForm.childNodes);
        nextForm.replaceWith(oldForm);
      }
      const nextScroll=shell.querySelector("[data-support-thread-scroll]");
      let preservedScroll=null;
      if(old&&nextScroll&&String(oldSelected||"")===String(selected||"")){
        const oldRows=new Map([...old.querySelectorAll(".support-thread-message")].map(row=>[row.dataset.messageId,row]));
        const nextRows=[...nextScroll.querySelectorAll(".support-thread-message")];
        const reconciled=nextRows.map(nextRow=>{
          const prior=oldRows.get(nextRow.dataset.messageId);
          if(!prior||prior.dataset.messageContent!==nextRow.dataset.messageContent)return nextRow;
          const oldMeta=prior.querySelector(".support-thread-message-meta"),newMeta=nextRow.querySelector(".support-thread-message-meta");
          const oldLike=prior.querySelector(".support-message-like"),newLike=nextRow.querySelector(".support-message-like");
          if(oldMeta&&newMeta)oldMeta.replaceWith(newMeta);
          if(oldLike&&newLike)oldLike.replaceWith(newLike);
          return prior;
        });
        old.replaceChildren(...reconciled);
        nextScroll.replaceWith(old);
        preservedScroll=old;
      }
      root.replaceChildren(shell);
      const newScroll=preservedScroll||root.querySelector("[data-support-thread-scroll]");
      if(newScroll){if(wasNearBottom)newScroll.scrollTop=newScroll.scrollHeight;else newScroll.scrollTop=y;}
      if(keepFocus){const field=root.querySelector("[data-support-draft]");field?.focus({preventScroll:true});if(oldSelectionStart!==null&&oldSelectionStart!==undefined&&oldSelectionEnd!==null&&oldSelectionEnd!==undefined)field?.setSelectionRange(oldSelectionStart,oldSelectionEnd);}
      if(keepSearchFocus){const field=root.querySelector(".support-conversation-search");field?.focus({preventScroll:true});if(searchStart!==null&&searchStart!==undefined&&searchEnd!==null&&searchEnd!==undefined)field?.setSelectionRange(searchStart,searchEnd);}
      lastRenderFingerprint=signature;renderedSelection=selected;
      updatePresenceUi();observeVisibleIncoming();
    };
    const showError=message=>{if(!canRun())return;errorMessage=message;render();};
    const loadConversations=async(ensureAfterCurrent=false)=>{
      if(!canRun())return;
      if(conversationRequest){if(ensureAfterCurrent)conversationRefreshPending=true;return;}
      const controller=abortController();conversationRequest=controller;
      try{
        const result=await request("/api/admin/support/conversations",{signal:controller.signal});
        if(!canRun()||controller.signal.aborted)return;
        conversationFailures=0;conversationRetryAt=0;
        conversations=result.conversations||[];
        captureListPresence(conversations,result.serverNow);
        if(selected&&!conversations.some(item=>String(item.id)===String(selected))&&!sending)selected=null;
        render();
      }catch(error){if(canRun()&&!controller.signal.aborted){conversationFailures++;conversationRetryAt=Date.now()+retryDelay(conversationFailures);invalidateListPresence();showError(error.message||"Impossible de charger les conversations.");}}
      finally{
        aborters.delete(controller);
        if(conversationRequest===controller)conversationRequest=null;
        if(conversationRefreshPending&&canRun()){conversationRefreshPending=false;setTimeout(()=>void loadConversations(),0);}
      }
    };
    const loadThread=async(initial=false,ensureAfterCurrent=false)=>{
      if(!canRun()||!selected)return;
      const targetId=String(selected);
      if(threadRequest&&threadRequestId===targetId){if(ensureAfterCurrent)threadRefreshPending=true;return;}
      threadRequest?.abort();
      const controller=abortController();threadRequest=controller;threadRequestId=targetId;
      const token=++loadToken;
      try{
        const result=await request(`/api/admin/support/conversations/${encodeURIComponent(targetId)}/messages`,{signal:controller.signal});
        if(!canRun()||controller.signal.aborted||token!==loadToken||String(selected)!==targetId)return;
        threadFailures=0;threadRetryAt=0;
        threadUser=result.user||null;
        const incoming=result.messages||[];
        const confirmedClients=new Set(incoming.map(item=>item.clientId).filter(Boolean));
        const optimistic=messages.filter(message=>message.sending&&message.clientId&&!confirmedClients.has(message.clientId));
        const merged=new Map();
        incoming.forEach(message=>merged.set(String(message.id),message));
        optimistic.forEach(message=>merged.set(String(message.id),message));
        messages=[...merged.values()].sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt)));
        render();
        if(initial){const scroller=root.querySelector("[data-support-thread-scroll]");if(scroller)scroller.scrollTop=scroller.scrollHeight;}
      }catch(error){if(canRun()&&!controller.signal.aborted&&token===loadToken&&String(selected)===targetId){threadFailures++;threadRetryAt=Date.now()+retryDelay(threadFailures);showError(error.message||"Impossible de charger les messages.");}}
      finally{
        aborters.delete(controller);
        if(threadRequest===controller){threadRequest=null;threadRequestId=null;}
        if(threadRefreshPending&&canRun()&&String(selected)===targetId){threadRefreshPending=false;setTimeout(()=>void loadThread(false),0);}
      }
    };
    rootInputHandler=event=>{if(event.target.matches("[data-support-draft]")){draft=event.target.value;if(selected)draftsByAccount.set(String(selected),draft);const submit=event.target.form?.querySelector('button[type="submit"]');if(submit)submit.disabled=sending||(!draft.trim()&&!file);}};
    root.addEventListener("input",rootInputHandler);
    const cleanupCheck=()=>{if(!isActive())halt();};
    window.iamgoldSupportCleanup=halt;
    nav=document.querySelector("#general-admin-nav");
    navListener=event=>{if(event.target.closest("[data-tab]")?.dataset.tab!=="support")halt();};
    nav?.addEventListener("click",navListener);
    render();void loadConversations();
    document.addEventListener("visibilitychange",onPresenceVisibility);
    window.addEventListener("focus",onPresenceFocus);
    window.addEventListener("blur",onPresenceBlur);
    window.addEventListener("pagehide",onPresencePageHide);
    activityHeartbeat=setInterval(()=>{if(adminThreadIsActive())void postAdminPresence(true);},10000);
    presencePoll=setInterval(()=>{if(!canRun())return;if(selected&&adminThreadIsActive())void loadMemberPresence(selected);updatePresenceUi();updateConversationPresenceUi();},2500);
    poll=setInterval(()=>{if(!isActive()){cleanupCheck();return;}const now=Date.now();if(now>=conversationRetryAt)void loadConversations();if(selected&&now>=threadRetryAt)void loadThread(false);},2000);
    root.dataset.supportCleanup="active";
  };
})();
