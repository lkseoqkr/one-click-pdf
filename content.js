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

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "toggleState") {
    isActive = request.status;
    if (!isActive && hoverElement) {
      hoverElement.classList.remove("pdf-target-highlight");
      hoverElement = null;
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
