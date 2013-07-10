var self = require("sdk/self");
var tabs = require("sdk/tabs");
var pageMod = require("sdk/page-mod");

var widget = require("sdk/widget").Widget({
  id: "open-popup-btn",
  label: "Feedly Notifier",
  contentURL: self.data.url("widget.html"),
  contentScriptFile: [self.data.url("scripts/feedly.api.js"), self.data.url("scripts/core.js")]
});

pageMod.PageMod({
    include: "*.feedly.com",
    contentScriptFile: [self.data.url("scripts/jquery-1.8.3.min.js"), self.data.url("scripts/accesstoken.content.js")],
    onAttach: function(worker) {
        worker.port.on("accessTokenReceived", function(accessToken) {
            console.log(accessToken);
        });
    }
});