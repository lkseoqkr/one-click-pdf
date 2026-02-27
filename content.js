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
      0%   { transform: translate(-50%, -50%) scale(0.2) rotate(-40deg); opacity: 0; }
      25%  { transform: translate(-50%, -50%) scale(1.05) rotate(-5deg);  opacity: 1; }
      40%  { transform: translate(-48%, -52%) scale(0.95) rotate( 3deg);  opacity: 1; }
      60%  { transform: translate(-52%, -48%) scale(1.00) rotate(-3deg);  opacity: 1; }
      75%  { transform: translate(-50%, -50%) scale(1.02) rotate( 0deg);  opacity: 1; }
      100% { transform: translate(-50%, -50%) scale(1.4)  rotate(10deg);  opacity: 0; }
    }
    ._pdf_cat_paw_ {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      width: 80vmin !important;
      height: 80vmin !important;
      z-index: 2147483647 !important;
      pointer-events: none !important;
      user-select: none !important;
      animation: _pdf_cat_swipe_ 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
      filter: drop-shadow(0 0 40px rgba(0,0,0,0.55)) !important;
    }
  `;
  document.head.appendChild(style);

  const paw = document.createElement("div");
  paw.className = "_pdf_cat_paw_";
  paw.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 130" width="100%" height="100%">
    <!-- Claws (drawn behind pads so base is hidden naturally) -->
    <path d="M 28 37 C 22 27 15 19 9 16 C 11 20 18 29 24 39 Z" fill="#FFF8DC" stroke="#C89A00" stroke-width="1"/>
    <path d="M 53 20 C 51 12 49 6 47 3 C 47 7 48 14 48 21 Z"   fill="#FFF8DC" stroke="#C89A00" stroke-width="1"/>
    <path d="M 70 21 C 72 12 73 6 75 3 C 75 7 74 14 74 21 Z"   fill="#FFF8DC" stroke="#C89A00" stroke-width="1"/>
    <path d="M 93 37 C 100 27 106 19 112 16 C 110 20 103 29 98 39 Z" fill="#FFF8DC" stroke="#C89A00" stroke-width="1"/>
    <!-- Toe pads -->
    <ellipse cx="28" cy="48" rx="16" ry="13" fill="#F5C518" stroke="#C89A00" stroke-width="1.5"/>
    <ellipse cx="50" cy="32" rx="16" ry="13" fill="#F5C518" stroke="#C89A00" stroke-width="1.5"/>
    <ellipse cx="72" cy="32" rx="16" ry="13" fill="#F5C518" stroke="#C89A00" stroke-width="1.5"/>
    <ellipse cx="94" cy="48" rx="16" ry="13" fill="#F5C518" stroke="#C89A00" stroke-width="1.5"/>
    <!-- Main pad -->
    <ellipse cx="61" cy="88" rx="36" ry="30" fill="#F5C518" stroke="#C89A00" stroke-width="1.5"/>
    <!-- Inner pads (pink) -->
    <ellipse cx="28" cy="49" rx="9" ry="7" fill="#FFB0C0"/>
    <ellipse cx="50" cy="33" rx="9" ry="7" fill="#FFB0C0"/>
    <ellipse cx="72" cy="33" rx="9" ry="7" fill="#FFB0C0"/>
    <ellipse cx="94" cy="49" rx="9" ry="7" fill="#FFB0C0"/>
    <ellipse cx="61" cy="90" rx="20" ry="16" fill="#FFB0C0"/>
  </svg>`;
  document.body.appendChild(paw);

  setTimeout(() => { paw.remove(); style.remove(); }, 1000);
}
// --------------------------------

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "toggleState") {
    isActive = request.status;
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
  showCatAnimation(); // must come after isolateForPDF — otherwise the paw div gets hidden as a sibling
  chrome.runtime.sendMessage({ action: "printSelectionDirect" });
}, true);
