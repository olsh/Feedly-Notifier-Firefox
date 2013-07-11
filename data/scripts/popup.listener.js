self.port.on("feedsUpdated", function(feedsData){
    var event = new CustomEvent('CustomEvent');
    event.initCustomEvent("feeds-updated", true, true, feedsData);
    document.documentElement.dispatchEvent(event);
});

document.documentElement.addEventListener('update-token', function(event) {
    self.port.emit("updateToken", null);
}, false);

document.documentElement.addEventListener('get-feeds', function(event) {
    self.port.emit("getFeeds", null);
}, false);

document.documentElement.addEventListener('mark-read', function(event) {
    self.port.emit("markRead", event.detail);
}, false);