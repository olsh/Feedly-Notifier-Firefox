document.documentElement.addEventListener('feeds-updated', function(event) {
    renderFeeds(event.detail);
}, false);

document.documentElement.addEventListener('feeds-mark-as-read', function(event) {
    removeFeedFromList(event.detail);
}, false);

function requestFeeds(){
    $("body").children("div").hide();
    $("#loading").show();
    var event = new CustomEvent('CustomEvent');
    event.initCustomEvent("get-feeds", true, true, null);
    document.documentElement.dispatchEvent(event);
}

function markAsRead(feedId, isLinkOpened) {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent("mark-read", true, true, {feedId: feedId, isLinkOpened: isLinkOpened});
    document.documentElement.dispatchEvent(event);
}

function removeFeedFromList(feedId){
    $(".item[data-id='"+ feedId + "']").fadeOut();
    if ($("#feed").find(".item[data-is-read!='true']").size() === 0) {
        requestFeeds();
    }
    resizeWindows();
}

function renderFeeds(data) {
    $("#loading").hide();
    $("#feed").empty();

    if (data.isLoggedIn === false) {
        $("#login").show();
    } else {
        $("#login").hide();
        $("#popup-content").show();

        if (data.feeds.length === 0) {
            $("#feed-empty").html("No unread articles");
        } else {
            $("#feed-empty").html("");
            $('#entryTemplate').tmpl(data.feeds).appendTo('#feed');
            $(".timeago").timeago();
        }
    }
    resizeWindows();
}

function resizeWindows(){
    var body = $(document);
    var maxWidth = 500;
    var maxHeight = 600;
    var width = body.width() > maxWidth ? maxWidth : body.width();
    var height = body.height() > maxHeight ? maxHeight : body.height();
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent("resize-panel", true, true, {width: width, height: height});
    document.documentElement.dispatchEvent(event);
}

$("#login").click(function () {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent("update-token", true, true, null);
    document.documentElement.dispatchEvent(event);
});

$("#feed").on("mousedown", "a.title", function (event) {
    if(event.which === 1 || event.which === 2){
        markAsRead($(this).closest(".item").data("id"), true);
    }
});

$("#feed").on("click", ".mark-read", function (event) {
    var feed = $(this).closest(".item");
    markAsRead(feed.data("id"), false);
});