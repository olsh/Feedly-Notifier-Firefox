"use strict";

var popupGlobal = {
    feeds: []
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

$("#login").click(function () {
    self.port.emit("updateToken", null);
});

$("#feed").on("mousedown", "a.title", function (event) {
    if (event.which === 1 || event.which === 2) {
        markAsRead([$(this).closest(".item").data("id")], true);
    }
});

$("#feed").on("click", ".mark-read", function (event) {
    var feed = $(this).closest(".item");
    markAsRead([feed.data("id")], false);
});

$("#feed").on("click", ".show-content", function () {
    var $this = $(this);
    var feed = $this.closest(".item");
    var contentContainer = feed.find(".content");
    var feedId = feed.data("id");
    if (contentContainer.html() === "") {
        var content;
        for (var i = 0; i < popupGlobal.feeds.length; i++) {
            if (popupGlobal.feeds[i].id === feedId) {
                content = popupGlobal.feeds[i].content
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
            $(".article-title").css("width", "660px");
        } else {
            $(".item").css("width", "350px");
            $("#feedly").css("width", "350px");
            $(".article-title").css("width", "310px");
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

function requestFeeds() {
    self.port.emit("getFeeds", null);
}

function markAsRead(feedIds, isLinkOpened) {
    self.port.emit("markRead", {feedIds: feedIds, isLinkOpened: isLinkOpened});
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

function showContent() {
    $("body").children("div").hide();
    $("#popup-content").show();
}

function renderFeeds(data) {

    $("#feed").empty();

    popupGlobal.feeds = data.feeds;
    if (data.isLoggedIn === false) {
        showLogin();
    } else {
        if (data.feeds.length === 0) {
            $("#feed-empty").show();
            $("#all-read-section").hide();
        } else {
            $("#all-read-section").show();
            $("#feed-empty").hide();

            var feeds = data.feeds;
            var container = $("#feed");
            for (var i = 0; i < feeds.length; i++) {
                var item = $("<div class='item'/>").attr("data-id", feeds[i].id);
                var articleTitle = $("<span class='article-title' />")
                    .append($("<a target='_blank' href='" + feeds[i].url + "' class='title' />").text(feeds[i].title + " "));
                item.append(articleTitle);
                var articleMenu = $("<span class='article-menu'/>").append($("<span class='mark-read' title='Mark as read' />"))
                    .append($("<span class='show-content' title='Show content' />"));
                item.append(articleMenu);

                var blogTitle = $("<div class='blog-title' />")
                    .append($("<img class='blog-icon' />").attr("src", feeds[i].blogIcon))
                    .append($("<a target='_blank'/>")
                        .attr("href", feeds[i].blogUrl)
                        .text(" " + feeds[i].blog + ", ")
                        .addClass(feeds[i].titleDirection))
                    .append($("<span class='timeago' />").attr("title", feeds[i].isoDate));

                var content = $("<div class='content' />").addClass(feeds[i].contentDirection);

                item.append(blogTitle);
                item.append(content);
                container.append(item);
            }
            $(".timeago").timeago();
        }
        showContent();
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
    self.port.emit("resizePanel", {width: width, height: height});
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