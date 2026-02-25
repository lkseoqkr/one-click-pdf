let isActive = false;
let hoverElement = null;

// ---- Copy protection unlock helpers ----
function allowEvent(e) {
  e.stopImmediatePropagation();
}

function unlockPage() {
  // 1) CSS: force user-select on every element
  if (!document.getElementById("pdf-unlock-style")) {
    const style = document.createElement("style");
    style.id = "pdf-unlock-style";
    style.textContent =
      "* { user-select: text !important; -webkit-user-select: text !important; }";
    (document.head || document.documentElement).appendChild(style);
  }
  // 2) JS: intercept site event handlers that block selection / right-click / copy
  window.addEventListener("selectstart",  allowEvent, true);
  window.addEventListener("contextmenu",  allowEvent, true);
  window.addEventListener("copy",         allowEvent, true);
}

function lockPage() {
  const style = document.getElementById("pdf-unlock-style");
  if (style) style.remove();
  window.removeEventListener("selectstart",  allowEvent, true);
  window.removeEventListener("contextmenu",  allowEvent, true);
  window.removeEventListener("copy",         allowEvent, true);
}
// ----------------------------------------

// 1. Receive state (ON/OFF)
chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "toggleState") {
    isActive = request.status;
    if (isActive) {
      unlockPage();
    } else {
      lockPage();
      if (hoverElement) {
        hoverElement.classList.remove("pdf-target-highlight");
        hoverElement = null;
      }
    }
  }
});

// 2. ESC key to cancel
document.addEventListener("keydown", (e) => {
  if (!isActive || e.key !== "Escape") return;
  isActive = false;
  if (hoverElement) {
    hoverElement.classList.remove("pdf-target-highlight");
    hoverElement = null;
  }
  lockPage();
  chrome.runtime.sendMessage({ action: "turnOff" });
}, true);

// 3. Mouseover (highlight)
document.addEventListener("mouseover", (e) => {
  if (!isActive) return;
  if (hoverElement === e.target) return;
  
  if (hoverElement) hoverElement.classList.remove("pdf-target-highlight");
  
  hoverElement = e.target;
  hoverElement.classList.add("pdf-target-highlight");
}, true);

// 3. Click (execute print and auto deactivate)
document.addEventListener("click", (e) => {
  if (!isActive || !hoverElement) return;

  // Block click event propagation
  e.preventDefault();
  e.stopPropagation();

  const target = hoverElement;
  target.classList.remove("pdf-target-highlight");

  // [Important] Deactivate immediately (prevent reselection)
  isActive = false;
  hoverElement = null;
  lockPage();

  // Send "turn off icon" message to background
  chrome.runtime.sendMessage({ action: "turnOff" });

  // Open print window (high-quality vector rendering)
  openPrintWindow(target);

}, true);


// 4. Open new window and print (preserving original quality)
function openPrintWindow(element) {
  const styles = document.querySelectorAll("link[rel='stylesheet'], style");
  let cssString = "";
  styles.forEach(style => cssString += style.outerHTML);

  const htmlContent = element.outerHTML;
  const win = window.open('', '_blank');

  if (!win) {
    alert("Please disable your popup blocker.");
    return;
  }

  win.document.write(`
    <html>
      <head>
        <title>Print Selection</title>
        <base href="${window.location.href}">
        ${cssString}
        <style>
          body { margin: 20px; background: white; }
          @media print { body { -webkit-print-color-adjust: exact; } }
        </style>
      </head>
      <body>${htmlContent}</body>
    </html>
  `);
  
  win.document.close();

  // Wait for resources to load, then print
  win.onload = function() {
    setTimeout(() => {
      win.focus();
      win.print();
      // Uncomment below to close the window after printing
      // win.close(); 
    }, 500);
  };
}