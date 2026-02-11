let isModeOn = false;

// 1. Toggle on/off when icon is clicked
chrome.action.onClicked.addListener(async (tab) => {
  isModeOn = !isModeOn;
  updateState(tab.id, isModeOn);
});

// Receive messages sent from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startMode") {
    // Update badge and activate feature
    updateState(request.tabId, true);
  } else if (request.action === "turnOff") {
    updateBadge(false);
  }
});

async function updateState(tabId, isOn) {
  await updateBadge(isOn);
  chrome.tabs.sendMessage(tabId, { action: "toggleState", status: isOn })
    .catch(err => console.log("Tab communication error"));
}

async function updateBadge(isOn) {
  const text = isOn ? "ON" : "";
  await chrome.action.setBadgeText({ text: text });
  await chrome.action.setBadgeBackgroundColor({ color: "#00D2D3" });
}