(() => {
  "use strict";
  const root=document.querySelector("#admin-content"),nav=document.querySelector("#general-admin-nav");
  if(!root)return;
  const categoryNames={stable:"Stable",wellbeing:"Bien-être",activity:"Activités"};
  let productsById=new Map(),editingCategory="stable",editingProductId=null,productsLoading=false,reloadAfterProductsFetch=false,selectedCategoryFilter="all";
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const money=value=>`${Number(value||0).toLocaleString("fr-FR")} FCFA`;
  const ensureCategory=()=>{
    const form=root.querySelector('form[data-form="product"]');
    if(!form||form.querySelector('[name="category"]'))return;
    const label=document.createElement("label");label.className="admin-product-field iamgold-product-category";
    label.innerHTML='<span>Catégorie du produit</span><select name="category" required><option value="stable">Stable</option><option value="wellbeing">Bien-être</option><option value="activity">Activités</option></select>';
    const button=form.querySelector('button[type="submit"],button:not([type])');
    form.insertBefore(label,button||null);
    const isEditing=Boolean(form.querySelector('[data-cancel-edit="product"]'));
    const selected=isEditing?editingCategory:"stable";
    label.querySelector("select").value=Object.hasOwn(categoryNames,selected)?selected:"stable";
  };
  const decorateProducts=()=>{
    root.querySelectorAll(".admin-product-card").forEach(card=>{
      const edit=card.querySelector("[data-product-edit]");
      if(!edit)return;
      const product=productsById.get(String(edit.dataset.productEdit));
      if(!product)return;
      card.dataset.iamgoldCategory=product.category||"stable";
      const details=card.querySelector(".admin-product-details");
      if(details){
        let value=details.querySelector(".iamgold-category-value");
        if(!value){const item=document.createElement("small");item.innerHTML='<b>Catégorie</b><span class="iamgold-category-value"></span>';details.append(item);value=item.querySelector(".iamgold-category-value");}
        const label=categoryNames[product.category]||"Stable";
        if(value.textContent!==label)value.textContent=label;
      }
    });
  };
  const ensureCategoryFilter=()=>{
    const list=root.querySelector(".admin-list");
    if(!list||root.querySelector("[data-iamgold-category-filter]"))return;
    const label=document.createElement("label");label.className="iamgold-product-filter";
    label.innerHTML='<span>Filtrer les produits</span><select data-iamgold-category-filter><option value="all">Toutes les catégories</option><option value="stable">Stable</option><option value="wellbeing">Bien-être</option><option value="activity">Activités</option></select>';
    list.before(label);
    const select=label.querySelector("select");select.value=selectedCategoryFilter;
    select.addEventListener("change",()=>{selectedCategoryFilter=select.value;filterProducts();});
  };
  const filterProducts=()=>{
    root.querySelectorAll(".admin-product-card").forEach(card=>{
      card.hidden=selectedCategoryFilter!=="all"&&card.dataset.iamgoldCategory!==selectedCategoryFilter;
    });
  };
  const enhanceForum=()=>{
    const socialButton=nav?.querySelector('[data-tab="social"]');
    if(socialButton&&socialButton.textContent!=="Forum")socialButton.textContent="Forum";
    const heading=root.querySelector(".social-admin-heading h2");
    if(heading&&heading.textContent!=="Forum · Modération")heading.textContent="Forum · Modération";
    root.querySelectorAll("h2").forEach(node=>{if(node.textContent.trim()==="Blogue")node.textContent="Forum · Modération";});
    const descriptions=root.querySelectorAll(".social-admin-heading p");
    descriptions.forEach(node=>{const copy="Examinez les publications, les images et les primes avant toute décision.";if(node.textContent!==copy)node.textContent=copy;});
    root.querySelectorAll(".social-post-card").forEach(card=>{
      const status=card.querySelector(".admin-status");
      const approved=status?.classList.contains("approved")||status?.textContent?.trim()==="Approuvés";
      if(!approved&&!card.querySelector('[data-iamgold-bonus-form]'))return;
      if(card.querySelector('[data-iamgold-bonus-form]'))return;
      const form=document.createElement("form");form.className="social-extra-bonus";form.dataset.iamgoldBonusForm="1";
      form.innerHTML='<label>Ajouter une prime (FCFA)<input name="amount" type="number" min="1" step="1" inputmode="numeric" required></label><button type="submit">Ajouter la prime</button>';
      const actions=card.querySelector(".social-delete-actions");
      if(actions)card.insertBefore(form,actions);else card.append(form);
    });
  };
  const enhance=()=>{
    ensureCategory();ensureCategoryFilter();decorateProducts();filterProducts();enhanceForum();
    if(!productsLoading&&!productsById.size&&(root.querySelector(".admin-product-card")||root.querySelector('form[data-form="product"]')))void loadProducts();
  };
  const loadProducts=async()=>{
    if(productsLoading)return;
    productsLoading=true;
    try{
      const response=await fetch("/api/admin/overview",{credentials:"same-origin"});
      if(!response.ok)return;
      const result=await response.json();
      if(Array.isArray(result.products)){
        productsById=new Map(result.products.map(product=>[String(product.id),product]));
        if(editingProductId)editingCategory=productsById.get(String(editingProductId))?.category||editingCategory;
        decorateProducts();
        filterProducts();
        ensureCategory();
        const select=root.querySelector('form[data-form="product"] [name="category"]');
        if(select&&editingProductId)select.value=editingCategory;
      }
    }catch(_){/* category remains selectable on create; backend reports unsupported writes. */}
    finally{
      productsLoading=false;
      if(reloadAfterProductsFetch){reloadAfterProductsFetch=false;productsById.clear();setTimeout(()=>void loadProducts(),50);}
    }
  };
  const refreshProducts=()=>{
    if(productsLoading){reloadAfterProductsFetch=true;return;}
    productsById.clear();void loadProducts();
  };
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
    const response=await originalFetch(input,init);
    try{
      const url=new URL(typeof input==="string"?input:input.url,location.href);
      const method=String(init?.method||(input instanceof Request?input.method:"GET")).toUpperCase();
      if(response.ok&&method!=="GET"&&/^\/api\/admin\/products(?:\/|$)/.test(url.pathname))setTimeout(refreshProducts,350);
    }catch(_){/* Preserve the original fetch result for nonstandard request inputs. */}
    return response;
  };
  root.addEventListener("click",event=>{
    const button=event.target.closest("[data-product-edit]");
    if(button){editingProductId=String(button.dataset.productEdit);const product=productsById.get(editingProductId);if(product)editingCategory=product.category||"stable";setTimeout(enhance,0);}
  },true);
  root.addEventListener("submit",async event=>{
    const form=event.target.closest("[data-iamgold-bonus-form]");
    if(!form||!root.contains(form))return;
    event.preventDefault();
    const amount=Number(form.elements.amount.value),card=form.closest("[data-social-post]"),postId=card?.dataset.socialPost;
    if(!Number.isSafeInteger(amount)||amount<1||!postId){form.elements.amount.focus();return;}
    if(!window.confirm(`Ajouter une prime de ${money(amount)} à cette publication ?`))return;
    const button=form.querySelector("button");button.disabled=true;
    if(form.dataset.pendingAmount!==String(amount)){form.dataset.pendingAmount=String(amount);form.dataset.pendingRequest=crypto.randomUUID();}
    try{
      const response=await fetch(`/api/admin/social/posts/${encodeURIComponent(postId)}/bonus`,{method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},body:JSON.stringify({amount,requestId:form.dataset.pendingRequest})});
      const result=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(result.error||"La prime supplémentaire n’a pas été enregistrée.");
      const amountNode=Array.from(card.querySelectorAll(".social-post-meta span")).find(node=>node.querySelector("strong")?.textContent?.includes("Bonus"));
      const cumulative=Number.isSafeInteger(result.bonus)?result.bonus:undefined;
      if(amountNode){const value=amountNode.querySelector("strong")?.nextSibling; if(value)value.textContent=money(cumulative??((Number((value.textContent||"").replace(/[^\d]/g,""))||0)+amount));}
      form.reset();
      delete form.dataset.pendingRequest;delete form.dataset.pendingAmount;
      let notice=root.querySelector("[data-social-feedback]");
      if(notice){notice.textContent=`Prime supplémentaire de ${money(amount)} ajoutée.`;notice.hidden=false;notice.className="social-message is-success";}
    }catch(error){
      let notice=root.querySelector("[data-social-feedback]");
      if(notice){notice.textContent=error.message||"La prime supplémentaire a échoué.";notice.hidden=false;notice.className="social-message is-error";}
    }finally{button.disabled=false;}
  });
  const observer=new MutationObserver(enhance);observer.observe(root,{childList:true,subtree:true});
  enhance();
  void loadProducts();
})();
