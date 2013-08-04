var self = require("sdk/self");
var tabs = require("sdk/tabs");
var ffStorage = require("sdk/simple-storage");
var timers = require("sdk/timers");
var panelSdk = require("sdk/panel");
var options = require("sdk/simple-prefs");
var notifications = require("sdk/notifications");
var _ = require("sdk/l10n").get;
var feedlyApi = require("./feedly.api");
var userstyles = require("./userstyles");

var appGlobal = {
    feedlyApiClient: feedlyApi.getClient(),
    feedlyUrl: "feedly.com",
    icons: {
        default: "images/icon20.png",
        inactive: "images/icon20_inactive.png"
    },
    options: {
        updateInterval: 1,
        markReadOnClick: true,
        showDesktopNotifications: true,
        showFullFeedContent: false
    },
    //Firefox sdk doesn't support more than 1 notification at once
    maxNotificationsCount: 1,
    cachedFeeds: [],
    isLoggedIn: false,
    intervalId : 0,
    lastFeedTime: new Date(),
    toolbarButton: null
};

/* Create controls */

var panel = panelSdk.Panel({
    width: 400,
    height: 500,
    contentURL: self.data.url("popup.html"),
    contentScriptFile: [self.data.url("scripts/jquery-2.0.3.min.js"),
                        self.data.url("scripts/timeago/jquery.timeago.js"),
                        self.data.url(_("TimeAgoLocalizedLink")),
                        self.data.url("scripts/popup.js")]
});

/* Listeners */
panel.port.on("updateToken", function(){
    getAccessToken();
});

panel.port.on("resizePanel", function(size){
    console.log(JSON.stringify(size));
    panel.resize(size.width, size.height);
});

panel.port.on("markRead", function(markReadData){
    if(!markReadData.isLinkOpened || appGlobal.options.markReadOnClick){
        markAsRead(markReadData.feedIds);
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
    initialize();
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

function sendUnreadFeedsCount(unreadFeedsData) {
    appGlobal.toolbarButton.setIcon({image: unreadFeedsData.isLoggedIn ? self.data.url(appGlobal.icons.default) : self.data.url(appGlobal.icons.inactive)});
    appGlobal.toolbarButton.setBadge(unreadFeedsData.unreadFeedsCount);
}

function decrementFeedsCount(number){
    appGlobal.toolbarButton.badge = +appGlobal.toolbarButton.badge - number;
}

function sendMarkAsReadResult(feedIds){
    panel.port.emit("feedMarkedAsRead", feedIds);
}

/* Load styles */
userstyles.load(self.data.url("styles/widget.css"));

/* Core functional */

/* Initializes api client, stops scheduler and runs new one */
function initialize() {
    appGlobal.lastFeedTime = new Date();
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

/* Sends desktop notifications */
function sendDesktopNotification(feeds){
    //if notifications too many, then to show only count
    if (feeds.length > appGlobal.maxNotificationsCount) {
        //We can detect only 20 new feeds at time, but actually count of feeds may be more than 20
        var count = feeds.length === 20 ? _("many") : feeds.length.toString();
        notifications.notify({
            title: "New Feeds",
            text: _("YouHaveNewFeeds", count),
            iconURL: self.data.url(appGlobal.icons.default)
        });
    } else {
        for (var i = 0; i < feeds.length; i++) {
            notifications.notify({
                title: _("NewFeed"),
                text: feeds[i].title,
                iconURL: self.data.url(appGlobal.icons.default),
                data: JSON.stringify(feeds[i]),
                onClick: function (feed) {
                    var feed = JSON.parse(feed);
                    tabs.open({
                        url: feed.url
                    });
                    if (appGlobal.options.markReadOnClick) {
                        markAsRead([feed.id]);
                    }
                }
            });
        }
    }
}

/* Returns only new feeds and set date of last feed */
function filterByNewFeeds(feeds){
    var lastFeedTime = appGlobal.lastFeedTime;
    var newFeeds = [];
    for (var i = 0; i < feeds.length; i++) {
        if (feeds[i].date > appGlobal.lastFeedTime) {
            newFeeds.push(feeds[i]);
            if (feeds[i].date > lastFeedTime) {
                lastFeedTime = feeds[i].date;
            }
        }
    }
    appGlobal.lastFeedTime = lastFeedTime;
    return newFeeds;
}

/* Removes feeds from cache by feed ID */
function removeFeedFromCache(feedId){
    var indexFeedForRemove;
    for (var i = 0; i < appGlobal.cachedFeeds.length; i++) {
        if (appGlobal.cachedFeeds[i].id === feedId) {
            indexFeedForRemove = i;
            break;
        }
    }

    //Remove feed from cached feeds
    if (indexFeedForRemove !== undefined) {
        appGlobal.cachedFeeds.splice(indexFeedForRemove, 1);
    }
}

/* Runs feeds update and stores unread feeds in cache
 * Callback will be started after function complete */
function updateFeeds(callback, silentUpdate) {
    getUnreadFeedsCount(function (unreadFeedsCount, globalCategoryId, isLoggedIn) {
        appGlobal.isLoggedIn = isLoggedIn;
        if (isLoggedIn === true) {
            fetchEntries(globalCategoryId, function (feeds, isLoggedIn) {
                appGlobal.isLoggedIn = isLoggedIn;
                if (isLoggedIn === true) {
                    appGlobal.cachedFeeds = feeds;
                    if (appGlobal.options.showDesktopNotifications) {
                        var newFeeds = filterByNewFeeds(feeds);
                        if(!silentUpdate ){
                            sendDesktopNotification(newFeeds);
                        }
                    }
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

                //Set content
                var content = "";
                var contentDirection = "";
                if(appGlobal.options.showFullFeedContent){
                    if(item.content !== undefined){
                        content = item.content.content;
                        contentDirection = item.content.direction;
                    }
                }
                if(content === ""){
                    if(item.summary !== undefined){
                        content = item.summary.content;
                        contentDirection = item.summary.direction;
                    }
                }

                //Set title
                var title = "";
                var titleDirection = "";
                if(item.title !== undefined){
                    if(item.title.indexOf("direction:rtl") !== -1){
                        //Feedly wraps rtl titles in div, we remove div because desktopNotification supports only text
                        title = item.title.replace(/<\/?div.*?>/gi, "");
                        titleDirection = "rtl";
                    }else{
                        title = item.title;
                    }
                }

                return {
                    //Feedly wraps rtl titles in div, we remove div because desktopNotification supports only text
                    title: title,
                    titleDirection: titleDirection,
                    url: item.alternate === undefined || item.alternate[0] === undefined ? "" : item.alternate[0].href,
                    blog: item.origin === undefined ? "" : item.origin.title,
                    blogUrl: blogUrl,
                    id: item.id,
                    content: content,
                    contentDirection: contentDirection,
                    isoDate: item.crawled === undefined ? "" : new Date(item.crawled).toISOString(),
                    date: item.crawled === undefined ? "" : new Date(item.crawled)
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
 * array of the ID of feeds
 */
function markAsRead(feedIds) {
    appGlobal.feedlyApiClient.post("markers", null, {
        action: "markAsRead",
        type: "entries",
        entryIds: feedIds
    }, null);

    for(var i = 0; i < feedIds.length; i++){
        removeFeedFromCache(feedIds[i]);
    }
    decrementFeedsCount(feedIds.length);
    sendMarkAsReadResult(feedIds);
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
        callback({feeds: appGlobal.cachedFeeds.slice(0), isLoggedIn: appGlobal.isLoggedIn});
    }else{
        updateFeeds(function(){
            callback({feeds: appGlobal.cachedFeeds.slice(0), isLoggedIn: appGlobal.isLoggedIn});
        }, true);
    }
}

exports.main = function (options, callbacks) {
    // create toolbarbutton
    appGlobal.toolbarButton = require("toolbarbutton").ToolbarButton({
        id: "feedlynotifier",
        tooltiptext: "Feedly Notifier",
        label: "Feedly notifier",
        badge: "",
        image: self.data.url(appGlobal.icons.inactive),
        panel: panel
    });

    appGlobal.toolbarButton.moveTo({
        toolbarID: "nav-bar",
        forceMove: false,
        insertbefore: "home-button"
    });

    readOptions();
    initialize();
};