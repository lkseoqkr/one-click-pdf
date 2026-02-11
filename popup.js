document.getElementById('startBtn').addEventListener('click', async () => {
  // Get the currently active tab info
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Send "activate PDF mode" signal to background script
  chrome.runtime.sendMessage({ action: "startMode", tabId: tab.id });
  
  // Close popup
  window.close();
});