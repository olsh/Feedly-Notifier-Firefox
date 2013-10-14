"use strict";

var popupGlobal = {
    feeds: [],
    savedFeeds: []
}

window.onresize = resizeWindows;

self.port.on("feedsUpdated", function (feedsData) {
    renderFeeds(feedsData);
});

self.port.on("feedMarkedAsRead", function (feedsData) {
    removeFeedFromList(feedsData);
});

self.port.on("showLoader", function () {
    showLoader();
    resizeWindows();
});

self.port.on("setSavingInterface", function (enable) {
    setSavingInterface(enable);
});

$("#login").click(function () {
    self.port.emit("updateToken", null);
});

$("#feed, #feed-saved").on("mousedown", "a.title", function (event) {
    var inBackground;
    if (event.which === 1 || event.which === 2) {
        inBackground = (event.ctrlKey || event.which === 2);
    }
    var self = $(this);
    var isSaved = self.closest("#feed-saved").size() > 0;
    openFeedTab(self.data("link"), inBackground, self.closest(".item").data("id"), isSaved);
});

$("#feed").on("click", ".mark-read", function (event) {
    var feed = $(this).closest(".item");
    markAsRead([feed.data("id")]);
});

$("#popup-content").on("click", ".show-content", function () {
    var $this = $(this);
    var feed = $this.closest(".item");
    var contentContainer = feed.find(".content");
    var feedId = feed.data("id");
    if (contentContainer.html() === "") {
        var content;
        var feeds = $("#feed").is(":visible") ? popupGlobal.feeds : popupGlobal.savedFeeds;

        for (var i = 0; i < feeds.length; i++) {
            if (feeds[i].id === feedId) {
                content = feeds[i].content
            }
        }
        if (content) {
            contentContainer.html(content);
            //For open links in new tab
            contentContainer.find("a").each(function (key, value) {
                var link = $(value);
                link.attr("target", "_blank");
            });
        }
    }
    contentContainer.slideToggle(function () {
        $this.css("background-position", contentContainer.is(":visible") ? "-288px -120px" : "-313px -119px");
        if (contentContainer.is(":visible") && contentContainer.text().length > 350) {
            $(".item").css("width", "700px");
            $("#feedly").css("width", "700px");
            $(".article-title").css("width", $("#popup-content").hasClass("tabs") ? "645px" : "660px");
        } else {
            $(".item").css("width", $("#popup-content").hasClass("tabs") ? "380px" : "350px");
            $("#feedly").css("width", $("#popup-content").hasClass("tabs") ? "380px" : "350px");
            $(".article-title").css("width", $("#popup-content").hasClass("tabs") ? "325px" : "310px");
        }
        resizeWindows();
    });
});

$("#popup-content").on("click", "#mark-all-read", function (event) {
    var feedIds = [];
    $(".item").each(function (key, value) {
        feedIds.push($(value).data("id"));
    });
    markAsRead(feedIds);
});

$("#feedly").on("click", "#btn-feeds-saved", function () {
    requestSavedFeeds();
});

$("#feedly").on("click", "#btn-feeds", function () {
    requestFeeds();
});

/* Save or unsave feed */
$("#popup-content").on("click", ".save-feed", function () {
    var $this = $(this);
    var feed = $this.closest(".item");
    var feedId = feed.data("id");
    var saveStatus = !$this.data("saved");
    saveFeed(feedId, saveStatus);
    $this.data("saved", saveStatus);
    $this.toggleClass("saved");
});

function openFeedTab(url, inBackground, feedId, isSaved) {
    self.port.emit("openFeedTab", {url: url, inBackground: inBackground, feedId: feedId, isSaved: isSaved});
}

function requestFeeds() {
    self.port.emit("getFeeds", false);
}

function requestSavedFeeds() {
    self.port.emit("getFeeds", true);
}

function markAsRead(feedIds) {
    self.port.emit("markRead", feedIds);
}

function saveFeed(feedId, saveStatus) {
    self.port.emit("saveFeed", {feedId: feedId, saveStatus: saveStatus});
}

function removeFeedFromList(feedIds) {
    for (var i = 0; i < feedIds.length; i++) {
        $(".item[data-id='" + feedIds[i] + "']").fadeOut("fast", function () {
            $(this).remove();
            resizeWindows();
            if ($("#feed").find(".item").size() === 0) {
                requestFeeds();
            }
        });
    }
}

function showLoader() {
    $("body").children("div").hide();
    $("#loading").show();
}

function showLogin() {
    $("body").children("div").hide();
    $("#login").show();
}

function showEmptyContent(isSavedFeedsActive) {
    $("body").children("div").hide();
    $("#popup-content").show().children("div").hide().filter("#feed-empty").show();
    $("#feedly").show().find("#all-read-section").hide();
}

function showFeeds() {
    $("body").children("div").hide();
    $("#popup-content").show().children("div").hide().filter("#feed").show();
    $("#feedly").show().find("#all-read-section").show();
    setSavingAsActiveTab(false);
}

function showSavedFeeds() {
    $("body").children("div").hide();
    $("#popup-content").show().children("div").hide().filter("#feed-saved").show().find(".mark-read").hide();
    $("#feedly").show().find("#all-read-section").hide();
    setSavingAsActiveTab(true);
}

function setSavingInterface(enable) {
    if (enable) {
        $("#popup-content").addClass("tabs");
    } else {
        $("#popup-content").removeClass("tabs");
    }
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

function renderFeeds(data) {
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
            showEmptyContent(data.isSavedFeeds);
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

            container.append($("#feed-template").mustache({feeds: data.feeds}));
            container.find(".timeago").timeago();

            showFunction();
        }
    }
    resizeWindows();
}

function resizeWindows() {
    var maxHeight = 600;
    var width = $("body").outerWidth(true);
    var height = $("body").outerHeight(true);
    if (height > maxHeight) {
        height = maxHeight;
        width += getScrollbarWidth();
    }
    var height = height > maxHeight ? maxHeight : height;

    //For fix bug with scroll on Mac
    var verticalMargin = 2;
    self.port.emit("resizePanel", {width: width, height: height + verticalMargin});
}

function getScrollbarWidth() {
    var div = document.createElement('div');

    div.style.overflowY = 'scroll';
    div.style.width =  '50px';
    div.style.height = '50px';

    div.style.visibility = 'hidden';

    document.body.appendChild(div);
    var scrollWidth = div.offsetWidth - div.clientWidth;
    document.body.removeChild(div);

    return scrollWidth;
}