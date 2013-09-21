"use strict";

var self = require("sdk/self");
var tabs = require("sdk/tabs");
var ffStorage = require("sdk/simple-storage");
var timers = require("sdk/timers");
var panelSdk = require("sdk/panel");
var options = require("sdk/simple-prefs");
var notifications = require("sdk/notifications");
var _ = require("sdk/l10n").get;
var events = require("sdk/system/events");
var { Ci } = require("chrome");
var feedlyApi = require("./feedly.api");
var widgetSdk = require("toolbarwidget");

var appGlobal = {
    feedlyApiClient: feedlyApi.getClient(),
    feedlyUrl: "feedly.com",
    feedlyTab: null,
    icons: {
        default: "images/icon20.png",
        inactive: "images/icon20_inactive.png"
    },
    options: {
        _updateInterval: 1,
        _maxNumberOfFeeds: 20,

        markReadOnClick: true,
        showDesktopNotifications: true,
        showFullFeedContent: false,
        openSiteOnIconClick: false,
        showCounter: true,

        get maxNumberOfFeeds() {
            return this._maxNumberOfFeeds;
        },
        set maxNumberOfFeeds(value) {
            var defaultValue = 1;
            this._maxNumberOfFeeds = value ? value >= defaultValue ? value : defaultValue : defaultValue;
        },

        get updateInterval() {
            return this._updateInterval;
        },
        set updateInterval(value) {
            var defaultValue = 1;
            return this._updateInterval = value ? value >= defaultValue ? value : defaultValue : defaultValue;
        }
    },
    get globalGroup(){
        return "user/" + ffStorage.storage.feedlyUserId + "/category/global.all";
    },
    //Firefox sdk doesn't support more than 1 notification at once
    maxNotificationsCount: 1,
    cachedFeeds: [],
    isLoggedIn: false,
    intervalIds: [],
    widget: null,
    panel: null,
    clientId: "",
    clientSecret: ""
};

(function(){
    options.on("", function (optionName) {
        appGlobal.options[optionName] = options.prefs[optionName];
        options.prefs[optionName] = appGlobal.options[optionName];
        initialize();
    });

    options.on("logout", function () {
        ffStorage.storage.accessToken = "";
        initialize();
    });
})();

/* Initialization button, panel and callback.
 * @param {Boolean} showPanel, if true, panel will be attached to widget
 * @param {function} if defined, will be attache onClick to widget
 * */
function controlsInitialization(showPanel, callback){

    if(appGlobal.panel){
        appGlobal.panel.destroy();
    }

    if(appGlobal.widget){
        appGlobal.widget.destroy();
    }

    if(showPanel){
        appGlobal.panel = panelSdk.Panel({
            width: 400,
            height: 500,
            contentURL: self.data.url("popup.html"),
            contentScriptFile: [self.data.url("scripts/jquery-2.0.3.min.js"),
                self.data.url("scripts/timeago/jquery.timeago.js"),
                self.data.url(_("TimeAgoLocalizedLink")),
                self.data.url("scripts/popup.js")]
        });

        appGlobal.panel.port.on("resizePanel", function (size) {
            appGlobal.panel.resize(size.width, size.height);
        });

        appGlobal.panel.port.on("markRead", function (markReadData) {
            if (!markReadData.isLinkOpened || appGlobal.options.markReadOnClick) {
                markAsRead(markReadData.feedIds);
            }
        });

        appGlobal.panel.on("show", function () {
            showPopupLoader();
            getFeeds(function (data) {
                sendFeedsToPopup(data);
            });
        });

        appGlobal.panel.port.on("getFeeds", function () {
            showPopupLoader();
            getFeeds(function (data) {
                sendFeedsToPopup(data);
            });
        });

        appGlobal.panel.port.on("updateToken", function () {
            getAccessToken();
        });
    }

    appGlobal.widget = widgetSdk.ToolbarWidget({
        toolbarID: "nav-bar",
        insertbefore: [ "search-container", "downloads-button", "home-button" ],
        forceMove: false,
        height: 20,
        width: 28,
        id: "main-widget",
        label: "Feedly Notifier",
        tooltip: "Feedly Notifier",
        contentURL: self.data.url("widget.html"),
        contentScriptFile: self.data.url("scripts/widget.js"),
        panel: appGlobal.panel,
        onClick: callback
    });

    appGlobal.widget.on("attach", function(){
        updateFeeds();
    });
}

/* Senders */
function sendFeedsToPopup(feedsData) {
    appGlobal.panel.port.emit("feedsUpdated", feedsData);
}

function showPopupLoader() {
    appGlobal.panel.port.emit("showLoader", null);
}

function sendMarkAsReadResult(feedIds) {
    appGlobal.panel.port.emit("feedMarkedAsRead", feedIds);
}

function sendUnreadFeedsCount(unreadFeedsData) {
    if(!appGlobal.options.showCounter) unreadFeedsData.unreadFeedsCount = 0;
    appGlobal.widget.port.emit("onFeedsUpdate", unreadFeedsData);
}

function decrementFeedsCount(number){
    appGlobal.widget.port.emit("decrementFeedsCount", number);
};

/* Core functional */

/* Initializes api client, stops scheduler and runs new one */
function initialize() {

    if (appGlobal.options.openSiteOnIconClick) {
        controlsInitialization(false, function () {
            if (appGlobal.isLoggedIn) {
                openFeedlyTab();
            } else {
                getAccessToken();
            }
        });
    } else {
        controlsInitialization(true);
    }

    appGlobal.feedlyApiClient.accessToken = ffStorage.storage.accessToken;

    //TODO: Remove this fallback in next versions
    if (!ffStorage.storage.feedlyUserId) {
        apiRequestWrapper("profile", {
            onSuccess: function(response){
                ffStorage.storage.feedlyUserId = response.id;
                startSchedule(appGlobal.options.updateInterval);
            }
        })
    } else {
        startSchedule(appGlobal.options.updateInterval);
    }

}

/* Starts new scheduler */
function startSchedule(updateInterval) {
    stopSchedule();
    updateCounter();
    updateFeeds();

    if(appGlobal.options.showCounter){
        appGlobal.intervalIds.push(timers.setInterval(updateCounter, updateInterval * 60000));
    }
    if (appGlobal.options.showDesktopNotifications || !appGlobal.options.openSiteOnIconClick) {
        appGlobal.intervalIds.push(timers.setInterval(updateFeeds, updateInterval * 60000));
    }
}

/* Stops scheduler */
function stopSchedule() {
    appGlobal.intervalIds.forEach(function(intervalId){
        timers.clearInterval(intervalId);
    });
    appGlobal.intervalIds = [];
}

/* Sends desktop notifications */
function sendDesktopNotification(feeds) {
    //if notifications too many, then to show only count
    if (feeds.length > appGlobal.maxNotificationsCount) {
        //We can detect only limit count of new feeds at time, but actually count of feeds may be more
        var count = feeds.length === appGlobal.options.maxNumberOfFeeds ? _("many") : feeds.length.toString();
        notifications.notify({
            title: _("NewFeeds"),
            text: _("YouHaveNewFeeds", count),
            iconURL: self.data.url(appGlobal.icons.default)
        });
    } else {
        for (var i = 0; i < feeds.length; i++) {
            notifications.notify({
                title: feeds[i].blog,
                text: feeds[i].title,
                iconURL: feeds[i].blogIcon,
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
function filterByNewFeeds(feeds) {
    var lastFeedTime = new Date(ffStorage.storage.lastFeedTime || 0);
    var maxFeedTime = lastFeedTime;
    var newFeeds = [];

    for (var i = 0; i < feeds.length; i++) {
        if (feeds[i].date > lastFeedTime) {
            newFeeds.push(feeds[i]);
            if (feeds[i].date > maxFeedTime) {
                maxFeedTime = feeds[i].date;
            }
        }
    }

    ffStorage.storage.lastFeedTime = maxFeedTime.getTime();
    return newFeeds;
}

/* Removes feeds from cache by feed ID */
function removeFeedFromCache(feedId) {
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

function openFeedlyTab() {
    if (appGlobal.feedlyTab) {
        appGlobal.feedlyTab.reload();
        appGlobal.feedlyTab.activate();
    } else {
        tabs.open({
            url: appGlobal.feedlyUrl,
            onOpen: function (tab) {
                appGlobal.feedlyTab = tab;
            },
            onClose: function () {
                appGlobal.feedlyTab = null;
            }
        });
    }

}

/* Stops scheduler, sets badge as inactive and resets counter */
function setInactiveStatus() {
    sendUnreadFeedsCount({unreadFeedsCount: 0, isLoggedIn: false});
    appGlobal.cachedFeeds = [];
    appGlobal.isLoggedIn = false;
    stopSchedule();
}

/* Sets badge as active */
function setActiveStatus() {
    appGlobal.isLoggedIn = true;
}

/* Runs feeds update and stores unread feeds in cache
 * Callback will be started after function complete
 * */
function updateCounter() {
    apiRequestWrapper("markers/counts", {
        onSuccess: function (response) {
            var unreadCounts = response.unreadcounts;
            var unreadFeedsCount = 0;

                for (var i = 0; i < unreadCounts.length; i++) {
                    if (appGlobal.globalGroup === unreadCounts[i].id) {
                        unreadFeedsCount = unreadCounts[i].count;
                        break;
                    }
                }
            sendUnreadFeedsCount({unreadFeedsCount: unreadFeedsCount, isLoggedIn: true});
        }
    });
}

/* Runs feeds update and stores unread feeds in cache
 * Callback will be started after function complete
 * If silentUpdate is true, then notifications will not be shown
 *  */
function updateFeeds(callback, silentUpdate) {
    apiRequestWrapper("streams/" + encodeURIComponent(appGlobal.globalGroup) + "/contents", {
        parameters: {
            unreadOnly: true,
            count: appGlobal.options.maxNumberOfFeeds
        },
        onSuccess: function (response) {
            appGlobal.cachedFeeds = parseFeeds(response);
            if (appGlobal.options.showDesktopNotifications) {
                var newFeeds = filterByNewFeeds(appGlobal.cachedFeeds);
                if (!silentUpdate) {
                    sendDesktopNotification(newFeeds);
                }
            }
            if (typeof callback === "function") {
                callback();
            }
        },
        onAuthorizationRequired: function () {
            setInactiveStatus();
            if (typeof callback === "function") {
                callback();
            }
        }
    });

}

/* Converts feedly response to feeds */
function parseFeeds(feedlyResponse) {
    var feeds = feedlyResponse.items.map(function (item) {
        var blogUrl;
        try {
            blogUrl = item.origin.htmlUrl.match(/http(?:s)?:\/\/[^/]+/i).pop();
        } catch (exception) {
            blogUrl = "#";
        }

        //Set content
        var content = "";
        var contentDirection = "";
        if (appGlobal.options.showFullFeedContent) {
            if (item.content !== undefined) {
                content = item.content.content;
                contentDirection = item.content.direction;
            }
        }
        if (content === "") {
            if (item.summary !== undefined) {
                content = item.summary.content;
                contentDirection = item.summary.direction;
            }
        }

        //Set title
        var title = "";
        var titleDirection = "";
        if (item.title !== undefined) {
            if (item.title.indexOf("direction:rtl") !== -1) {
                //Feedly wraps rtl titles in div, we remove div because desktopNotification supports only text
                title = item.title.replace(/<\/?div.*?>/gi, "");
                titleDirection = "rtl";
            } else {
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
            blogIcon: "https://www.google.com/s2/favicons?domain=" + blogUrl + "&alt=feed",
            id: item.id,
            content: content,
            contentDirection: contentDirection,
            isoDate: item.crawled === undefined ? "" : new Date(item.crawled).toISOString(),
            date: item.crawled === undefined ? "" : new Date(item.crawled)
        };
    });
    return feeds;
}

/* Marks feed as read, remove it from the cache and decrement badge.
 * array of the ID of feeds
 */
function markAsRead(feedIds) {
    apiRequestWrapper("markers", {
        method: "POST",
        body: {
            action: "markAsRead",
            type: "entries",
            entryIds: feedIds
        }
    });

    for (var i = 0; i < feedIds.length; i++) {
        removeFeedFromCache(feedIds[i]);
    }
    decrementFeedsCount(feedIds.length);
    sendMarkAsReadResult(feedIds);
}

/* Reads all options from the storage */
function readOptions() {
    for (var optionName in appGlobal.options) {
        appGlobal.options[optionName] = options.prefs[optionName];
    }
}

/* Runs authenticating a user process,
 * then read access token and stores in chrome.storage */
function getAccessToken() {
    var url = appGlobal.feedlyApiClient.getMethodUrl("auth/auth", {
        response_type: "code",
        client_id: appGlobal.clientId,
        redirect_uri: "http://localhost",
        scope: "https://cloud.feedly.com/subscriptions"
    });

    tabs.open({
        url: url,
        onReady: function(tab){
            var codeParse = /code=(.+?)&/i;
            var matches = codeParse.exec(tab.url);
            if (matches) {

                appGlobal.feedlyApiClient.request("auth/token", {
                    method: "POST",
                    useSdkRequest: true,
                    parameters: {
                        code: matches[1],
                        client_id: appGlobal.clientId,
                        client_secret: appGlobal.clientSecret,
                        redirect_uri: "http://localhost",
                        grant_type: "authorization_code"
                    },
                    onSuccess: function (response) {
                        ffStorage.storage.accessToken = response.access_token;
                        ffStorage.storage.refreshToken = response.refresh_token;
                        ffStorage.storage.feedlyUserId = response.id;

                        tab.close();
                        initialize();
                    }
                });
            }
        }
    });
}

/* Tries refresh access token if possible */
function refreshAccessToken(){
    if(!appGlobal.options.refreshToken) return;

    appGlobal.feedlyApiClient.request("auth/token", {
        method: "POST",
        useSdkRequest: true,
        parameters: {
            refresh_token: ffStorage.storage.refreshToken,
            client_id: appGlobal.clientId,
            client_secret: appGlobal.clientSecret,
            grant_type: "refresh_token"
        },
        onSuccess: function (response) {
            ffStorage.storage.accessToken = response.access_token;
            ffStorage.storage.refreshToken = response.refresh_token;
            initialize();
        }
    });
}

/* Returns feeds from the cache.
 If the cache is empty, then it will be updated before return */
function getFeeds(callback) {
    if (appGlobal.cachedFeeds.length > 0) {
        callback({feeds: appGlobal.cachedFeeds.slice(0), isLoggedIn: appGlobal.isLoggedIn});
    } else {
        updateFeeds(function () {
            callback({feeds: appGlobal.cachedFeeds.slice(0), isLoggedIn: appGlobal.isLoggedIn});
        }, true);
    }
}

function apiRequestWrapper(methodName, settings) {
    var onSuccess = settings.onSuccess;
    settings.onSuccess = function (response) {
        setActiveStatus();
        if (typeof onSuccess === "function") {
            onSuccess(response);
        }
    }

    var onAuthorizationRequired = settings.onAuthorizationRequired;

    settings.onAuthorizationRequired = function (accessToken) {
        setInactiveStatus();
        refreshAccessToken();
        if (typeof onAuthorizationRequired === "function") {
            onAuthorizationRequired(accessToken);
        }
    }

    appGlobal.feedlyApiClient.request(methodName, settings);
}

exports.main = function (options, callbacks) {
    readOptions();
    initialize();
};
