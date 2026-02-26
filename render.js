(async () => {
  // Extension page scripts have direct chrome API access
  const tab = await new Promise(resolve => chrome.tabs.getCurrent(resolve));
  const key = `pdf_render_${tab.id}`;

  const result = await chrome.storage.session.get(key);
  const data = result[key];
  if (!data) {
    chrome.runtime.sendMessage({ action: "renderFailed" });
    return;
  }

  const { html, css, baseUrl, darkMode, htmlAttrs, bodyAttrs, bodyBg, htmlBg, elementBg, ancestorChain } = data;

  // Helper: fully transparent color provides no visual background
  const isTransparent = c => !c || c === "rgba(0, 0, 0, 0)" || c === "transparent";

  // Apply html-element attributes from the original page
  // (e.g. class="dark-mode", data-theme="dark") so CSS rules like
  // `.dark-mode .el { background: black }` resolve correctly
  if (htmlAttrs) {
    for (const [name, value] of Object.entries(htmlAttrs)) {
      if (name !== "style") document.documentElement.setAttribute(name, value);
    }
  }
  if (bodyAttrs) {
    for (const [name, value] of Object.entries(bodyAttrs)) {
      if (name !== "style") document.body.setAttribute(name, value);
    }
  }

  // Match original page's color-scheme for @media (prefers-color-scheme: dark)
  if (darkMode) {
    document.documentElement.style.colorScheme = "dark";
  }

  // Base URL for relative resources
  const base = document.createElement("base");
  base.href = baseUrl;
  document.head.appendChild(base);

  // Inject original page CSS
  const tmp = document.createElement("div");
  tmp.innerHTML = css;
  Array.from(tmp.childNodes).forEach(node => {
    if (node.nodeType === 1) document.head.appendChild(node.cloneNode(true));
  });

  // Inject resolved background colors from the original page.
  // Only inject non-transparent values — injecting transparent would actively
  // override CSS that might correctly set a dark background.
  // Also mirror inside @media print in case Page.printToPDF evaluates print rules.
  {
    const hRule = !isTransparent(htmlBg) ? `html { background-color: ${htmlBg} !important; }` : "";
    const bRule = !isTransparent(bodyBg) ? `body { background-color: ${bodyBg} !important; }` : "";
    if (hRule || bRule) {
      const bgFallback = document.createElement("style");
      bgFallback.textContent = [
        hRule, bRule,
        "@media print {",
        hRule ? `  ${hRule}` : "",
        bRule ? `  ${bRule}` : "",
        "  * { background-color: inherit; }",
        "}"
      ].filter(Boolean).join("\n");
      document.head.appendChild(bgFallback);
    }
  }

  // Preserve all colors exactly as rendered
  const style = document.createElement("style");
  style.textContent = [
    "* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }",
    "body { margin: 20px; }"
  ].join("\n");
  document.head.appendChild(style);

  // Render selected content wrapped in ancestor context.
  // ancestorChain is an array of opening tags (outermost → innermost) with
  // display:contents so they are layout-transparent but still satisfy CSS
  // selectors like ".parent .child { … }" that need ancestor context.
  if (Array.isArray(ancestorChain) && ancestorChain.length > 0) {
    const opens  = ancestorChain.join('');
    const closes = ancestorChain
      .map(t => `</${t.match(/^<(\w+)/)[1]}>`)
      .reverse()
      .join('');
    document.body.innerHTML = opens + html + closes;
  } else {
    document.body.innerHTML = html;
  }

  // Apply the selected element's resolved background color directly.
  // This is the most reliable fallback: getComputedStyle() in content.js already
  // resolved CSS variables (e.g. var(--color-canvas-default) → rgb(13,17,23)),
  // so the correct dark color is applied even if external CSS hasn't loaded.
  if (!isTransparent(elementBg) && document.body.firstElementChild) {
    document.body.firstElementChild.style.backgroundColor = elementBg;
  }

  // Wait for external stylesheets to load (important: dark-mode rules may live here).
  // Each sheet is given at most 6 s — a hanging request (e.g. SRI without crossorigin)
  // must not block the entire render and trigger the 15-second render timeout.
  await Promise.all(
    Array.from(document.querySelectorAll("link[rel='stylesheet']")).map(link =>
      new Promise(resolve => {
        if (link.sheet) return resolve();
        const timer = setTimeout(resolve, 6000);
        const done = () => { clearTimeout(timer); resolve(); };
        link.addEventListener("load",  done, { once: true });
        link.addEventListener("error", done, { once: true });
      })
    )
  );

  // Wait for images to finish loading
  await Promise.all(
    Array.from(document.querySelectorAll("img")).map(img =>
      new Promise(resolve => {
        if (img.complete) return resolve();
        img.onload = resolve;
        img.onerror = resolve;
      })
    )
  );

  // Extra buffer for fonts / layout / CSS variable resolution
  await new Promise(resolve => setTimeout(resolve, 800));

  // Signal background: ready to print
  chrome.runtime.sendMessage({ action: "renderReady" });
})();
