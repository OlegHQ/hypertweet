// Use a unified API reference for Chrome & Firefox
const browserApi = (typeof browser !== 'undefined') ? browser : chrome;

browserApi.action.onClicked.addListener((tab) => {
  browserApi.tabs.sendMessage(tab.id, { action: "copyTweets" });
});
