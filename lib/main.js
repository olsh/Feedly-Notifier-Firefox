var self = require("sdk/self");
var tabs = require("sdk/tabs");
var ffStorage = require("sdk/simple-storage");
var timers = require("sdk/timers");
var panelSdk = require("sdk/panel");
var options = require("sdk/simple-prefs");
var widgetSdk = require("toolbarwidget");
var feedlyApi = require("./feedly.api");

var appGlobal = {
    feedlyApiClient: feedlyApi.getClient(),
    feedlyUrl: "feedly.com",
    icons: {
        default: "/images/icon.png",
        inactive: "/images/icon_inactive.png"
    },
    options: {
        updateInterval: 1,
        markReadOnClick: true
    },
    cachedFeeds: [],
    isLoggedIn: false,
    intervalId : 0
};

/* Create controls */

var panel = panelSdk.Panel({
    width: 400,
    height: 500,
    contentURL: self.data.url("popup.html"),
    contentScriptFile: [self.data.url("scripts/jquery-2.0.3.min.js"),
                        self.data.url("scripts/jquery.timeago.js"),
                        self.data.url("scripts/popup.js")]
});

var widget = widgetSdk.ToolbarWidget({
    toolbarID: "nav-bar",
    height: 24,
    width: 24,
    id: "main-widget",
    label: "Feedly Notifier",
    contentURL: self.data.url("widget.html"),
    contentScriptFile: self.data.url("scripts/widget.js"),
    panel: panel
});

/* Listeners */
panel.port.on("updateToken", function(){
    getAccessToken();
});

panel.port.on("resizePanel", function(size){
    panel.resize(size.width, size.height);
});

panel.port.on("markRead", function(markReadData){
    if(!markReadData.isLinkOpened || appGlobal.options.markReadOnClick){
        markAsRead(markReadData.feedId);
    }
});

panel.on("show", function(){
    showPopupLoader();
    getFeeds(function(data){
        sendFeedsToPopup(data);
    });
});

panel.port.on("getFeeds", function(){
    showPopupLoader();
    getFeeds(function(data){
        sendFeedsToPopup(data);
    });
});

options.on("", function (optionName) {
    appGlobal.options[optionName] = options.prefs[optionName];
    if (optionName === "updateInterval") {
        initialize();
    }
});

options.on("logout", function() {
    ffStorage.storage.accessToken = "";
    initialize();
});

/* Senders */
function sendFeedsToPopup(feedsData){
    panel.port.emit("feedsUpdated", feedsData);
}

function showPopupLoader(){
    panel.port.emit("showLoader", null);
}

function sendUnreadFeedsCount(unreadFeedsData){
    widget.port.emit("onFeedsUpdate", unreadFeedsData);
}

function decrementFeedsCount(number){
    widget.port.emit("decrementFeedsCount", number);
}

function sendMarkAsReadResult(feedId){
    panel.port.emit("feedMarkedAsRead", feedId);
}

/* Core functional */

/* Initializes api client, stops scheduler and runs new one */
function initialize() {
    appGlobal.feedlyApiClient.accessToken = ffStorage.storage.accessToken;
    startSchedule(appGlobal.options.updateInterval);
}

/* Starts new scheduler */
function startSchedule(updateInterval) {
    stopSchedule(appGlobal.intervalId);
    updateFeeds();
    appGlobal.intervalId = timers.setInterval(updateFeeds, updateInterval * 60000);
}

/* Stops scheduler */
function stopSchedule(intervalId) {
    timers.clearInterval(appGlobal.intervalId);
}

/* Runs feeds update and stores unread feeds in cache
 * Callback will be started after function complete */
function updateFeeds(callback) {
    getUnreadFeedsCount(function (unreadFeedsCount, globalCategoryId, isLoggedIn) {
        appGlobal.isLoggedIn = isLoggedIn;
        if (isLoggedIn === true) {
            fetchEntries(globalCategoryId, function (feeds, isLoggedIn) {
                appGlobal.isLoggedIn = isLoggedIn;
                if (isLoggedIn === true) {
                    appGlobal.cachedFeeds = feeds;
                } else {
                    appGlobal.cachedFeeds = [];
                }
                if (typeof callback === "function") {
                    callback();
                }
            });
        } else {
            stopSchedule();
            if (typeof callback === "function") {
                callback();
            }
        }
        sendUnreadFeedsCount({unreadFeedsCount: unreadFeedsCount, isLoggedIn: isLoggedIn});
    });
}

/* Returns unread feeds count.
 * The callback parameter should specify a function that looks like this:
 * function(number unreadFeedsCount, string globalCategoryId, boolean isLoggedIn) {...};*/
function getUnreadFeedsCount(callback) {
    appGlobal.feedlyApiClient.get("markers/counts", null, function (response) {
        var unreadFeedsCount = -1;
        var globalCategoryId = "";
        var isLoggedIn;
        if (response.json && response.json.errorCode === undefined) {
            var unreadCounts = response.json.unreadcounts;
            for (var i = 0; i < unreadCounts.length; i++) {
                if (unreadFeedsCount < unreadCounts[i].count) {
                    unreadFeedsCount = unreadCounts[i].count;

                    //Search category(global or uncategorized) with max feeds
                    globalCategoryId = unreadCounts[i].id;
                }
            }
            isLoggedIn = true;
        } else {
            isLoggedIn = false;
        }
        if(typeof  callback === "function"){
            callback(Number(unreadFeedsCount), globalCategoryId, isLoggedIn);
        }
    });
}

/* Download unread feeds.
 * categoryId is feedly category ID.
 * The callback parameter should specify a function that looks like this:
 * function(array feeds, boolean isLoggedIn) {...};*/
function fetchEntries(categoryId, callback) {
    appGlobal.feedlyApiClient.get("streams/" + encodeURIComponent(categoryId) + "/contents", {
        unreadOnly: true
    }, function (response) {
        var isLoggedIn;
        var feeds = [];
        if (response.json && response.json.errorCode === undefined) {
            feeds = response.json.items.map(function (item) {
                var blogUrl;
                try{
                    blogUrl = item.origin.htmlUrl.match(/http(?:s)?:\/\/[^/]+/i).pop();
                }catch(exception) {
                    blogUrl = "#";
                }
                return {
                    title: item.title,
                    url: item.alternate === undefined || item.alternate[0] === undefined ? "" : item.alternate[0].href,
                    blog: item.origin === undefined ? "" : item.origin.title,
                    blogUrl: blogUrl,
                    id: item.id,
                    /*content: item.summary === undefined || appGlobal.options.compactPopupMode ? "" : item.summary.content,*/
                    date: item.crawled === undefined ? "" : new Date(item.crawled).toISOString()
                };
            });
            isLoggedIn = true;
        }else{
            isLoggedIn = false;
        }
        if(typeof callback === "function"){
            callback(feeds, isLoggedIn);
        }
    });
}

/* Marks feed as read, remove it from the cache and decrement badge.
 * categoryId is feedly category ID.*/
function markAsRead(feedId) {
    appGlobal.feedlyApiClient.post("markers", null, {
        action: "markAsRead",
        type: "entries",
        entryIds: [feedId]
    }, null);

    var indexFeedForRemove;
    for (var i = 0; i < appGlobal.cachedFeeds.length; i++) {
        if (appGlobal.cachedFeeds[i].id === feedId) {
            indexFeedForRemove = i;
            break;
        }
    }

    //Remove feed from unreadItems
    if (indexFeedForRemove !== undefined) {
        appGlobal.cachedFeeds.splice(indexFeedForRemove, 1);
        decrementFeedsCount(1);
    }

    sendMarkAsReadResult(feedId);
}

/* Reads all options from the storage */
function readOptions(){
    for(var optionName in appGlobal.options){
        appGlobal.options[optionName] = options.prefs[optionName];
    }
}

/* Opens feedly site and if user are logged in,
 * then read access token, stores in the storage and initializes scheduler */
function getAccessToken() {
    tabs.open({
        url: appGlobal.feedlyUrl,
        onReady: function (feedlytab) {
            var worker = feedlytab.attach({
                contentScriptFile: self.data.url("scripts/accesstoken.content.js")
            });
            worker.port.on("accessTokenReceived", function (accessToken) {
                ffStorage.storage.accessToken = accessToken;
                initialize();
            });
        }
    });
}

/* Returns feeds from the cache.
 If the cache is empty, then it will be updated before return */
function getFeeds(callback){
    if(appGlobal.cachedFeeds.length > 0){
        callback({feeds: appGlobal.cachedFeeds, isLoggedIn: appGlobal.isLoggedIn});
    }else{
        updateFeeds(function(){
            callback({feeds: appGlobal.cachedFeeds, isLoggedIn: appGlobal.isLoggedIn});
        });
    }
}

exports.main = function (options, callbacks) {
    readOptions();
    initialize();
};
