document.documentElement.addEventListener('feeds-updated', function(event) {
    renderFeeds(event.detail);
}, false);

function requestFeeds(){
    $("body").children("div").hide();
    $("#loading").show();
    var event = new CustomEvent('CustomEvent');
    event.initCustomEvent("get-feeds", true, true, feedsData);
    document.documentElement.dispatchEvent(event);
}

function markAsRead(feedId) {
    $(".item[data-id='"+ feedId + "']").fadeOut();
    if ($("#feed").find(".item[data-is-read!='true']").size() === 0) {
        requestFeeds();
    }
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent("mark-read", true, true, feedId);
    document.documentElement.dispatchEvent(event);
}

function renderFeeds(data) {
    $("#loading").hide();
    $("#feed").empty();

    if (data.isLoggedIn === false) {
        $("#login").show();
    } else {
        $("#popup-content").show();

        if (data.feeds.length === 0) {
            $("#feed-empty").html("No unread articles");
        } else {
            $("#feed-empty").html("");
            $('#entryTemplate').tmpl(data.feeds).appendTo('#feed');
            $(".timeago").timeago();
        }
    }
}

$("#login").click(function () {
    var event = document.createEvent('CustomEvent');
    event.initCustomEvent("update-token", true, true, null);
    document.documentElement.dispatchEvent(event);
});

$("#feed").on("mousedown", "a.title", function (event) {
    if(event.which === 1 || event.which === 2){
        markAsRead($(this).closest(".item").data("id"));
    }
});

$("#feed").on("click", ".mark-read", function (event) {
    var feed = $(this).closest(".item");
    markAsRead(feed.data("id"));
});