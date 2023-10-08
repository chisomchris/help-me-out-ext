chrome.runtime.onMessage.addListener((request: { redirect: string }, sender) => {
  if (sender.tab?.id) {
    chrome.tabs.update(sender.tab.id, { url: request.redirect });
  }
});
