/* NARKE presentation only. Never rewrite URLs, values, IDs or persisted data. */
(() => {
  "use strict";
  const legacyBrand = /\b(?:IVECO|SHINERAY|SWM|Sprite|AERONOVA|Valhalla)\b/gi;
  const excluded = "script,style,noscript,textarea,input,code,pre,[contenteditable]," +
    ".support-conversation,.support-inbox-list,.support-thread-title,.support-thread-identity,.support-thread-message," +
    ".social-post-card,.social-post-caption,.social-review-note,.social-message";
  const attributes = ["title", "alt", "aria-label", "placeholder"];
  const replace = value => value.replace(/\biveco\s*pay\b/gi, "NARKE Pay")
    .replace(legacyBrand, "NARKE")
    .replace(/\bsonara[\s-]*pay\b/gi, "service de paiement");
  function labels(element) {
    for (const name of attributes) {
      const value = element.getAttribute(name);
      if (value !== null && replace(value) !== value) element.setAttribute(name, replace(value));
    }
    if (element.tagName === "IMG" &&
        /\/pages\/assets\/iveco-(?:auth-)?logo\.png(?:\?|$)/.test(element.getAttribute("src") || "")) {
      element.src = "/pages/assets/narke-home-logo.png";
      element.alt = "NARKE Industries";
    }
  }
  function rewrite(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      if (root.parentElement && !root.parentElement.closest(excluded)) {
        const value = replace(root.data);
        if (value !== root.data) root.data = value;
      }
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(excluded)) return;
    labels(root);
    for (const element of root.querySelectorAll("[title],[alt],[aria-label],[placeholder],img")) {
      if (!element.closest(excluded)) labels(element);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) rewrite(walker.currentNode);
  }
  rewrite(document.documentElement);
  const adminBrand = document.querySelector(".admin-login-brand");
  if (adminBrand) {
    const brand = document.createElement("div");
    brand.className = "iamgold-console-brand";
    const mark = document.createElement("span");
    mark.className = "iamgold-console-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.innerHTML = '<svg viewBox="0 0 48 32" focusable="false"><path d="M2 27 17 8l7 9L35 3l11 24H2Z"/><path d="m10 22 7-9 7 9m8-5 3-5 5 10"/></svg>';
    const words = document.createElement("span");
    words.className = "iamgold-console-wordmark";
    const name = document.createElement("strong");
    name.textContent = "IAMGOLD";
    const privateLabel = document.createElement("small");
    privateLabel.textContent = "Administration NARKE";
    words.append(name, privateLabel);
    brand.append(mark, words);
    adminBrand.replaceChildren(brand);
  }
  new MutationObserver(records => {
    const changed = new Set();
    for (const record of records) {
      if (record.type === "attributes") {
        if (!record.target.closest(excluded)) labels(record.target);
      }
      else if (record.type === "characterData") changed.add(record.target);
      else for (const node of record.addedNodes) changed.add(node);
    }
    for (const node of changed) rewrite(node);
  }).observe(document.documentElement, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: [...attributes, "src"]
  });
})();
