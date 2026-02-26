document.getElementById('startBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.runtime.sendMessage({ action: "startMode", tabId: tab.id });
  window.close();
});

document.getElementById('fullPageBtn').addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // Print the current tab directly via CDP — no re-rendering, exact visual match
  chrome.runtime.sendMessage({ action: "fullPagePDF", tabId: tab.id });
  window.close();
});