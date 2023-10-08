"use strict";
chrome.runtime.onMessage.addListener((request, sender) => {
    var _a;
    if ((_a = sender.tab) === null || _a === void 0 ? void 0 : _a.id) {
        chrome.tabs.update(sender.tab.id, { url: request.redirect });
    }
});
