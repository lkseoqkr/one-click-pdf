chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.action === "startMode") {
    updateState(request.tabId, true);
  } else if (request.action === "turnOff") {
    updateBadge(false);
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

// Attaches CDP to tabId and prints it as a single-page PDF sized to the
// page's actual content dimensions (no reflow, no layout change).
// The debugger permission is used solely for Page.printToPDF via CDP.
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
  chrome.tabs.sendMessage(tabId, { action: "toggleState", status: isOn })
    .catch(() => {});
}

async function updateBadge(isOn) {
  await chrome.action.setBadgeText({ text: isOn ? "ON" : "" });
  await chrome.action.setBadgeBackgroundColor({ color: "#00D2D3" });
}
