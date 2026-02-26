let isModeOn = false;
let activeContentTabId = null; // last non-extension tab the addon was used on

chrome.action.onClicked.addListener(async (tab) => {
  isModeOn = !isModeOn;
  updateState(tab.id, isModeOn);
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "startMode") {
    (async () => {
      let { tabId } = request;
      try {
        const tab = await chrome.tabs.get(tabId);
        if (tab.url?.startsWith("chrome-extension://") || tab.url?.startsWith("chrome://")) {
          tabId = activeContentTabId;
        } else {
          activeContentTabId = tabId;
        }
      } catch {
        tabId = activeContentTabId;
      }
      if (tabId) updateState(tabId, true);
    })();
  } else if (request.action === "turnOff") {
    updateBadge(false);
    if (sender.tab) {
      chrome.scripting.executeScript({
        target: { tabId: sender.tab.id },
        world: "MAIN",
        func: pageLock
      }).catch(() => {});
    }
  } else if (request.action === "fullPagePDF") {
    printTabAsPDF(request.tabId, "fullpage");
  } else if (request.action === "printSelectionDirect") {
    // content.js has already hidden all siblings — print the live tab via CDP
    const tabId = sender.tab.id;
    (async () => {
      try {
        await new Promise(r => setTimeout(r, 150)); // let DOM isolation settle
        await printTabAsPDF(tabId, "selection");
      } finally {
        chrome.tabs.sendMessage(tabId, { action: "restoreIsolation" }).catch(() => {});
      }
    })();
  }
});

// Runs in the page's JS context (world: MAIN) to intercept addEventListener
// and block copy-protection handlers while the extension is active.
function pageUnlock() {
  const BLOCKED = ["selectstart", "contextmenu", "copy", "cut", "dragstart"];
  if (!EventTarget.prototype.__pdfPatched) {
    const _orig = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, fn, opts) {
      if (window.__pdfUnlock && BLOCKED.indexOf(type) !== -1) return;
      return _orig.call(this, type, fn, opts);
    };
    EventTarget.prototype.__pdfPatched = true;
  }
  window.__pdfUnlock = true;
}

function pageLock() {
  window.__pdfUnlock = false;
}

// Attaches CDP to tabId and prints it as a single-page PDF sized to the
// page's actual content dimensions (no reflow, no layout change).
async function printTabAsPDF(tabId, filenamePrefix = "fullpage") {
  let debuggerAttached = false;
  try {
    await chrome.debugger.attach({ tabId }, "1.3");
    debuggerAttached = true;

    // Use screen media so @media print rules don't reset backgrounds to white
    await chrome.debugger.sendCommand({ tabId }, "Emulation.setEmulatedMedia", { media: "screen" });

    // Wait for the page to re-render after the media change before measuring
    await new Promise(r => setTimeout(r, 300));

    // Measure from both CDP and JS and use the larger to avoid clipping
    const { contentSize } = await chrome.debugger.sendCommand({ tabId }, "Page.getLayoutMetrics", {});
    const { result: evalResult } = await chrome.debugger.sendCommand(
      { tabId }, "Runtime.evaluate",
      { expression: `Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)`, returnByValue: true }
    );
    const paperWidth  = contentSize.width / 96;
    const paperHeight = Math.max(contentSize.height, evalResult.value || 0) / 96 + 3;

    const pdfResult = await chrome.debugger.sendCommand({ tabId }, "Page.printToPDF", {
      printBackground: true,
      paperWidth,
      paperHeight,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      preferCSSPageSize: false
    });

    await chrome.debugger.detach({ tabId });
    debuggerAttached = false;

    const date = new Date().toISOString().slice(0, 10);
    await chrome.downloads.download({
      url: `data:application/pdf;base64,${pdfResult.data}`,
      filename: `${filenamePrefix}-${date}.pdf`,
      saveAs: true
    });
  } catch (err) {
    console.error("[One-Click-PDF] PDF failed:", err);
  } finally {
    if (debuggerAttached) {
      try { await chrome.debugger.detach({ tabId }); } catch {}
    }
  }
}

async function updateState(tabId, isOn) {
  await updateBadge(isOn);
  // Inject into world: MAIN to override EventTarget.prototype.addEventListener,
  // bypassing the page's CSP
  await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: isOn ? pageUnlock : pageLock
  }).catch(err => console.log("Page context injection failed:", err));
  chrome.tabs.sendMessage(tabId, { action: "toggleState", status: isOn })
    .catch(() => {});
}

async function updateBadge(isOn) {
  await chrome.action.setBadgeText({ text: isOn ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#00D2D3" });
}
