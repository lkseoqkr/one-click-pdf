let isActive = false;
let hoverElement = null;

// ---- Element isolation for selection PDF ----
// Hides all siblings along the ancestor chain so only the selected element
// remains visible. Background then prints the live tab via CDP (full CSS intact).
// Background sends "restoreIsolation" after the PDF download starts.
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

// ---- Cat scratch animation ----
function showCatAnimation() {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes _pdf_cat_swipe_ {
      0%   { transform: translate(0, 0)       rotate(-35deg) scale(0.7); opacity: 0; }
      12%  { transform: translate(-15px, 15px) rotate(-28deg) scale(1.3); opacity: 1; }
      22%  { transform: translate(8px, -8px)   rotate(-32deg) scale(1.2); }
      38%  { transform: translate(-20px, 20px) rotate(-22deg) scale(1.4); }
      100% { transform: translate(-120vw, 90vh) rotate(15deg) scale(0.5); opacity: 0; }
    }
    ._pdf_cat_paw_ {
      position: fixed !important;
      top: 8vh !important;
      right: -10px !important;
      font-size: 88px !important;
      line-height: 1 !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      user-select: none !important;
      animation: _pdf_cat_swipe_ 0.75s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
      filter: drop-shadow(3px 3px 8px rgba(0,0,0,0.4)) !important;
    }
  `;
  document.head.appendChild(style);

  const paw = document.createElement("div");
  paw.className = "_pdf_cat_paw_";
  paw.textContent = "🐾";
  document.body.appendChild(paw);

  setTimeout(() => { paw.remove(); style.remove(); }, 800);
}
// --------------------------------

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "toggleState") {
    isActive = request.status;
    if (isActive) showCatAnimation();
    if (!isActive && hoverElement) {
      hoverElement.classList.remove("pdf-target-highlight");
      hoverElement = null;
    }
  }

  if (request.action === "showCatAnimation") {
    showCatAnimation();
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
  chrome.runtime.sendMessage({ action: "turnOff" });

  isolateForPDF(target);
  chrome.runtime.sendMessage({ action: "printSelectionDirect" });
}, true);
