let isActive = false;
let hoverElement = null;

// ---- Copy-protection unlock ----
function allowEvent(e) {
  e.stopImmediatePropagation();
}

function unlockPage() {
  if (!document.getElementById("pdf-unlock-style")) {
    const style = document.createElement("style");
    style.id = "pdf-unlock-style";
    style.textContent = "* { user-select: text !important; -webkit-user-select: text !important; }";
    (document.head || document.documentElement).appendChild(style);
  }
  document.querySelectorAll("*").forEach(el => {
    el.style.userSelect = "";
    el.style.webkitUserSelect = "";
    ["onselectstart", "oncontextmenu", "oncopy", "ondragstart"].forEach(attr => {
      el.removeAttribute(attr);
      el[attr] = null;
    });
  });
  window.addEventListener("selectstart", allowEvent, true);
  window.addEventListener("contextmenu", allowEvent, true);
  window.addEventListener("copy",        allowEvent, true);
}

function lockPage() {
  const style = document.getElementById("pdf-unlock-style");
  if (style) style.remove();
  window.removeEventListener("selectstart", allowEvent, true);
  window.removeEventListener("contextmenu", allowEvent, true);
  window.removeEventListener("copy",        allowEvent, true);
}
// --------------------------------

// ---- Element isolation for selection PDF ----
// Hides all siblings along the ancestor chain so only the selected element
// remains visible. Background then prints the live tab via CDP (full CSS intact)
// instead of extracting HTML, which loses selector/variable context.
let _isolatedItems = [];

function isolateForPDF(element) {
  _isolatedItems = [];
  let el = element;
  while (el && el !== document.body) {
    const parent = el.parentElement;
    if (parent) {
      Array.from(parent.children).forEach(sibling => {
        if (sibling !== el) {
          _isolatedItems.push({ el: sibling, prevDisplay: sibling.style.display });
          sibling.style.display = "none";
        }
      });
    }
    el = parent;
  }
}

function restoreFromIsolation() {
  _isolatedItems.forEach(({ el, prevDisplay }) => {
    el.style.display = prevDisplay;
  });
  _isolatedItems = [];
}
// ---------------------------------------------

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

  if (request.action === "restoreIsolation") {
    restoreFromIsolation();
  }
});

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

document.addEventListener("mouseover", (e) => {
  if (!isActive) return;
  if (hoverElement === e.target) return;
  if (hoverElement) hoverElement.classList.remove("pdf-target-highlight");
  hoverElement = e.target;
  hoverElement.classList.add("pdf-target-highlight");
}, true);

document.addEventListener("click", (e) => {
  if (!isActive || !hoverElement) return;

  e.preventDefault();
  e.stopPropagation();

  const target = hoverElement;
  target.classList.remove("pdf-target-highlight");

  isActive = false;
  hoverElement = null;
  lockPage();
  chrome.runtime.sendMessage({ action: "turnOff" });

  // Hide all siblings along the ancestor chain so only this element remains,
  // then ask background to print the live tab via CDP.
  // Background will send "restoreIsolation" after the PDF download starts.
  isolateForPDF(target);
  chrome.runtime.sendMessage({ action: "printSelectionDirect" });
}, true);
