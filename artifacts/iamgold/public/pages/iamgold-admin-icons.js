/* Shared metallic icon treatment for the vanilla NARKE console shell. */
(() => {
  "use strict";
  const paths={
    overview:'<path d="M3 13h7V3H3zm11 8h7V11h-7zm0-18v5h7V3zM3 21h7v-5H3z"/>',
    transactions:'<path d="M4 7h15m-4-4 4 4-4 4M20 17H5m4 4-4-4 4-4"/>',
    normalWithdrawals:'<path d="M12 3v12m-4-4 4 4 4-4M4 20h16"/>',
    history:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
    adminCredits:'<path d="M4 7h16v13H4zM8 7V4h8v3m-4 5v5m-2.5-2.5h5"/>',
    users:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-4 2-6 6-6s6 2 6 6m1-9a3 3 0 1 0 0-6m1 9c2 .3 4 2 4 5"/>',
    products:'<path d="m3 8 9-5 9 5-9 5zm0 0v9l9 5 9-5V8m-9 5v9"/>',
    codes:'<path d="M4 5h16v14H4zM8 9h8m-8 4h5m-5 3h7"/>',
    channels:'<circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="m7 11 10-5M7 13l10 5"/>',
    announcements:'<path d="M4 14V9l13-5v15L4 14zm13-7h3v9h-3M7 15l2 5h4l-2-4"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m19 13 2 1-2 4-2-1-2 1v2H9v-2l-2-1-2 1-2-4 2-1v-2l-2-1 2-4 2 1 2-1V4h6v2l2 1 2-1 2 4-2 1z"/>',
    cameroon:'<path d="M7 3h10l4 9-4 9H7l-4-9z"/><path d="M12 3v18m-1-11 1-2 1 2-1 2z"/>',
    social:'<path d="M4 5h16v11H9l-5 4z"/><circle cx="9" cy="10" r=".7"/><circle cx="12" cy="10" r=".7"/><circle cx="15" cy="10" r=".7"/>',
    support:'<path d="M4 13v-2a8 8 0 0 1 16 0v2m-16-1h4v7H6a2 2 0 0 1-2-2zm16 0h-4v7h2a2 2 0 0 0 2-2zm-4 7c-.5 2-2 3-4 3"/>',
    trace:'<path d="M4 5h16v14H4zM8 9h8m-8 3h5m-5 3h7"/><path d="m16 14 2 2 3-4"/>'
  };
  const markup=(name,shape)=>`<svg viewBox="0 0 24 24" fill="none" stroke="url(#ig-admin-gold-${name})" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="ig-admin-gold-${name}" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff1a9"/><stop offset=".45" stop-color="#e1b13d"/><stop offset="1" stop-color="#9b6817"/></linearGradient></defs>${shape}</svg>`;
  const decorate=button=>{
    const name=button.dataset.tab||(button.hasAttribute("data-transaction-trace")?"trace":"");
    const shape=paths[name];
    if(!shape||button.querySelector(".ig-admin-nav-icon"))return;
    const icon=document.createElement("span");icon.className="ig-admin-nav-icon";icon.setAttribute("aria-hidden","true");
    icon.innerHTML=markup(name,shape);
    button.prepend(icon);
  };
  const nav=document.querySelector("#general-admin-nav");
  nav?.querySelectorAll("[data-tab]").forEach(decorate);
  if(nav)new MutationObserver(records=>records.flatMap(record=>[...record.addedNodes]).forEach(node=>{
    if(node instanceof HTMLElement){if(node.matches("button"))decorate(node);node.querySelectorAll?.("button").forEach(decorate);}
  })).observe(nav,{childList:true});
  const actions={
    refresh:'<path d="M20 6v5h-5M4 18v-5h5"/><path d="M5.5 9a7 7 0 0 1 12-2l2.5 4M4 13l2.5 4a7 7 0 0 0 12-2"/>',
    logout:'<path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M13 16l4-4-4-4m4 4H8"/>'
  };
  Object.entries(actions).forEach(([id,shape])=>{
    const button=document.getElementById(id);
    if(!button)return;
    const icon=document.createElement("span");icon.className="ig-admin-action-icon";icon.setAttribute("aria-hidden","true");icon.innerHTML=markup(`action-${id}`,shape);button.replaceChildren(icon);
  });
})();
