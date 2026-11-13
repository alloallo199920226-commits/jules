(() => {
  "use strict";
  if (window.spriteStripePayBrandLoaded) return;
  window.spriteStripePayBrandLoaded = true;
  const excluded = "script,style,textarea,input,select,option,svg,pre,code,[contenteditable]:not([contenteditable=false]),[data-stripe-pay-brand]";
  const source = "/sprite-assets/stripe-pay-logo.webp?v=1";
  function decorateText(node) {
    if (!node.parentElement || node.parentElement.closest(excluded)) return;
    const text = node.data;
    const matches = [...text.matchAll(/\bstripe[\s_-]*pay\b/gi)];
    if (!matches.length) return;
    const fragment = document.createDocumentFragment();
    let position = 0;
    for (const match of matches) {
      fragment.appendChild(document.createTextNode(text.slice(position, match.index)));
      const brand = document.createElement("span");
      brand.className = "stripe-pay-inline-brand";
      brand.setAttribute("data-stripe-pay-brand", "");
      const image = document.createElement("img");
      image.src = source;
      image.alt = "";
      image.width = 1000;
      image.height = 519;
      image.decoding = "async";
      const label = document.createElement("span");
      label.className = "stripe-pay-accessible-label";
      label.textContent = match[0];
      image.addEventListener("error", () => {
        image.remove();
        label.classList.remove("stripe-pay-accessible-label");
      }, { once: true });
      brand.append(image, label);
      fragment.appendChild(brand);
      position = match.index + match[0].length;
    }
    fragment.appendChild(document.createTextNode(text.slice(position)));
    node.replaceWith(fragment);
  }
  function decorate(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) return decorateText(root);
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(excluded)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(decorateText);
  }
  function start() {
    if (!document.body) {
      const pending = new MutationObserver(() => {
        if (!document.body) return;
        pending.disconnect();
        start();
      });
      pending.observe(document, { childList: true, subtree: true });
      return;
    }
    decorate(document.body);
    new MutationObserver(records => {
      for (const record of records) {
        if (record.type === "characterData") decorate(record.target);
        else record.addedNodes.forEach(decorate);
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();