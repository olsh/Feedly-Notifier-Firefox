"use strict";

var popupGlobal = {
    feeds: [],
    savedFeeds: [],
    showCategories: false
};

window.onresize = resizeWindows;

self.port.on("feedsUpdated", function (feedsData) {
    renderFeeds(feedsData);
});

self.port.on("feedMarkedAsRead", function () {
    if ($("#feed").find(".item").size() === 0) {
        requestFeeds();
    }
});

self.port.on("showLoader", function () {
    showLoader();
    resizeWindows();
});

self.port.on("setPopupInterface", function (interfaceData) {
    if (interfaceData.abilitySaveFeeds) {
        $("#popup-content").addClass("tabs");
    } else {
        $("#popup-content").removeClass("tabs");
    }

    $("#feed, #feed-saved").css("font-size", interfaceData.popupFontSize / 100 + "em");
    setPopupExpand(false);

    popupGlobal.expandFeeds = interfaceData.expandFeeds;
    popupGlobal.showCategories = interfaceData.showCategories;
    popupGlobal.popupWidth = interfaceData.popupWidth;
    popupGlobal.expandedPopupWidth = interfaceData.expandedPopupWidth;
    popupGlobal.popupMaxHeight = interfaceData.popupMaxHeight;
    popupGlobal.openFeedsInBackground = interfaceData.openFeedsInBackground;
    resizeWindows();
});

self.port.on("removeFeedsFromPopup", function (feedIds) {
    removeFeedFromList(feedIds);
});

$("#login").click(function () {
    self.port.emit("updateToken", null);
});

$("#feed, #feed-saved").on("mousedown", "a.title", function (event) {
    var inBackground;
    if (event.which === 1 || event.which === 2) {
        inBackground = (event.ctrlKey || event.which === 2 || popupGlobal.openFeedsInBackground);
    }
    var self = $(this);
    var isSaved = self.closest("#feed-saved").size() > 0;
    openFeedTab(self.data("link"), inBackground, self.closest(".item").data("id"), isSaved);
});

$("#feed").on("click", ".mark-read", function () {
    var feed = $(this).closest(".item");
    markAsRead([feed.data("id")]);
});

var popupContent = $("#popup-content");

popupContent.on("click", ".show-content", function () {
    var $this = $(this);
    var feed = $this.closest(".item");
    var contentContainer = feed.find(".content");
    var feedId = feed.data("id");
    if (contentContainer.html() === "") {
        var feeds = $("#feed").is(":visible") ? popupGlobal.feeds : popupGlobal.savedFeeds;

        for (var i = 0; i < feeds.length; i++) {
            if (feeds[i].id === feedId) {
                contentContainer.html($("#feed-content").mustache(feeds[i]));

                //For open links in new tab
                contentContainer.find("a").each(function (key, value) {
                    var link = $(value);
                    link.attr("target", "_blank");
                });
            }
        }
    }
    contentContainer.slideToggle("fast", function () {
        $this.css("background-position", contentContainer.is(":visible") ? "-288px -120px" : "-313px -119px");
        if ($(".content").is(":visible")) {
            setPopupExpand(true);
        } else {
            setPopupExpand(false);
        }
        resizeWindows();
    });
});

popupContent.on("click", "#mark-all-read", markAllAsRead);

popupContent.on("click", "#open-all-news", function () {
    $("#feed").find("a.title[data-link]").filter(":visible").each(function (key, value) {
        var news = $(value);
        openFeedTab(news.data("link"), true, news.data("id"), false, true, true);
    });
    markAllAsRead();
});

$("#feedly").on("click", "#update-feeds", function () {
    requestFeeds(true, true);
});

popupContent.on("click", "#btn-feeds-saved", function () {
    requestSavedFeeds(true);
});

popupContent.on("click", "#btn-feeds", function () {
    requestFeeds(true);
});

/* Save or unsave feed */
popupContent.on("click", ".save-feed", function () {
    var $this = $(this);
    var feed = $this.closest(".item");
    var feedId = feed.data("id");
    var saveStatus = !$this.data("saved");
    saveFeed(feedId, saveStatus);
    $this.data("saved", saveStatus);
    $this.toggleClass("saved");
});

popupContent.on("click", "#website", openFeedlyTab);

popupContent.on("click", ".categories > span", function (){
    $(".categories").find("span").removeClass("active");
    var button = $(this).addClass("active");
    var categoryId = button.data("id");
    if (categoryId) {
        $(".item").hide();
        $(".item[data-categories~='" + categoryId + "']").show();
    } else {
        $(".item").show();
    }
    resizeWindows();
});

popupContent.on("click", "#feedly-logo", function (event) {
    if (event.ctrlKey) {
        toggleSavedFeedsInterface();
    }
});

function openFeedTab(url, inBackground, feedId, isSaved, leaveUnread, isOpenAll) {
    self.port.emit("openFeedTab", {url: url, inBackground: inBackground, feedId: feedId, isSaved: isSaved, leaveUnread: leaveUnread, isOpenAll: isOpenAll});
}

function requestFeeds(keepPopup, force) {
    self.port.emit("getFeeds", {keepPopup: keepPopup, isSavedFeeds: false, force: force});
}

function requestSavedFeeds(keepPopup, force) {
    self.port.emit("getFeeds", {keepPopup: keepPopup, isSavedFeeds: true, force: force});
}

function markAsRead(feedIds) {
    self.port.emit("markRead", feedIds);
}

function saveFeed(feedId, saveStatus) {
    self.port.emit("saveFeed", {feedId: feedId, saveStatus: saveStatus});
}

function openFeedlyTab() {
    self.port.emit("openFeedlyTab", null);
}

function toggleSavedFeedsInterface() {
    self.port.emit("toggleSavedFeedsInterface", null);
}

function removeFeedFromList(feedIds) {
    for (var i = 0; i < feedIds.length; i++) {
        $(".item[data-id='" + feedIds[i] + "']").fadeOut("fast", function () {
            $(this).remove();
            resizeWindows();
            if ($("#feed").find(".item").size() === 0) {
                showLoader();
            }
        });
    }
}

function markAllAsRead() {
    var feedIds = [];
    $(".item:visible").each(function (key, value) {
        feedIds.push($(value).data("id"));
    });
    markAsRead(feedIds);
}

function showLoader() {
    $("body").children("div").hide();
    $("#loading").show();
}

function showLogin() {
    $("body").children("div").hide();
    $("#login").show();
}

function showEmptyContent() {
    $("body").children("div").hide();
    $("#popup-content").show().children("div").hide().filter("#feed-empty").show();
    $("#feedly").show().find("#popup-actions").hide();
}

function showFeeds() {
    $("body").children("div").hide();
    $("#popup-content").show().children("div").hide().filter("#feed").show();
    $("#feedly").show().find("#popup-actions").show();
    setSavingAsActiveTab(false);
}

function showSavedFeeds() {
    $("body").children("div").hide();
    $("#popup-content").show().children("div").hide().filter("#feed-saved").show().find(".mark-read").hide();
    $("#feedly").show().find("#popup-actions").hide();
    setSavingAsActiveTab(true);
}

function setSavingAsActiveTab(savingActive){
    if (savingActive) {
        $("#btn-feeds-saved").addClass("active-tab");
        $("#btn-feeds").removeClass("active-tab");
    } else {
        $("#btn-feeds").addClass("active-tab");
        $("#btn-feeds-saved").removeClass("active-tab");
    }
}

function setPopupExpand(isExpand){
    if (isExpand){
        $("#feed, #feed-saved").width(popupGlobal.expandedPopupWidth);
    } else {
        $("#feed, #feed-saved").width(popupGlobal.popupWidth);
    }
}

function renderFeeds(data) {
    setPopupExpand(false);

    if (data.isSavedFeeds){
        $("#feed-saved").empty();
        popupGlobal.savedFeeds = data.feeds;
    } else {
        $("#feed").empty();
        popupGlobal.feeds = data.feeds;
    }

    if (data.isLoggedIn === false) {
        showLogin();
    } else {

        if (data.feeds.length === 0) {
            showEmptyContent();
            setSavingAsActiveTab(data.isSavedFeeds);
        } else {
            var container;
            var showFunction;
            if (data.isSavedFeeds){
                container = $("#feed-saved");
                showFunction = showSavedFeeds;
            } else {
                container = $("#feed");
                showFunction = showFeeds;
            }

            if (popupGlobal.showCategories) {
                var categories = getUniqueCategories(data.feeds);
                container.append($("#categories-template").mustache({categories: categories}));
            }

            if (popupGlobal.expandFeeds) {
                var partials = { content: $("#feed-content").html() };
            }
            container.append($("#feed-template").mustache({feeds: data.feeds}, partials));
            container.find(".timeago").timeago();

            if (popupGlobal.expandFeeds) {
                container.find(".show-content").click();
            }

            showFunction();
        }
    }
    resizeWindows();
}

function getUniqueCategories(feeds){
    var categories = [];
    var addedIds = [];
    feeds.forEach(function(feed){
        feed.categories.forEach(function(category){
            if(addedIds.indexOf(category.id) === -1){
                categories.push(category);
                addedIds.push(category.id);
            }
        });
    });
    return categories;
}

function resizeWindows() {
    var maxHeight = popupGlobal.popupMaxHeight;
    var body = $("body");
    var width = body.outerWidth(true);
    var height = body.outerHeight(true);
    if (height > maxHeight) {
        height = maxHeight;
        width += getScrollbarWidth();
    }
    height = height > maxHeight ? maxHeight : height;

    //For fix bug with scroll on Mac
    var margin = 2;
    self.port.emit("resizePanel", {width: width, height: height + margin});
}

function getScrollbarWidth() {
    var div = document.createElement("div");

    div.style.overflowY = "scroll";
    div.style.width =  "50px";
    div.style.height = "50px";

    div.style.visibility = "hidden";

    document.body.appendChild(div);
    var scrollWidth = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);

    return scrollWidth;
}