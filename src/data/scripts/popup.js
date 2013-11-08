"use strict";

var popupGlobal = {
    feeds: [],
    savedFeeds: [],
    showCategories: false
}

window.onresize = resizeWindows;

self.port.on("feedsUpdated", function (feedsData) {
    renderFeeds(feedsData);
});

self.port.on("feedMarkedAsRead", function (feedsData) {
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

    popupGlobal.showCategories = interfaceData.showCategories;
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
            setPopupExpand(true);
        } else {
            setPopupExpand(false);
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

$("#popup-content").on("click", "#website", function(){
    openFeedlyTab();
});

$("#popup-content").on("click", ".categories > span", function (){
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

function openFeedlyTab() {
    self.port.emit("openFeedlyTab", null);
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
        $(".item").css("width", "700px");
        $("#feedly").css("width", "700px");
        $(".article-title, .blog-title").css("width", $("#popup-content").hasClass("tabs") ? "635px" : "650px");
    } else {
        $(".item").css("width", $("#popup-content").hasClass("tabs") ? "380px" : "350px");
        $("#feedly").css("width", $("#popup-content").hasClass("tabs") ? "380px" : "350px");
        $(".article-title, .blog-title").css("width", $("#popup-content").hasClass("tabs") ? "310px" : "295px");
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

            container.append($("#feed-template").mustache({feeds: data.feeds}));
            container.find(".timeago").timeago();

            showFunction();
        }
    }
    resizeWindows();
}

function getUniqueCategories(feeds){
    var categories = [];
    var addedIds = [];
    feeds.forEach(function(feed){
        if (feed.categories) {
            feed.categories.forEach(function(category){
                if(addedIds.indexOf(category.id) === -1){
                    categories.push(category);
                    addedIds.push(category.id);
                }
            });
        }
    });
    return categories;
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
    var margin = 2;
    self.port.emit("resizePanel", {width: width, height: height + margin});
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