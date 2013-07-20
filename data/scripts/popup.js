self.port.on("feedsUpdated", function(feedsData){
    renderFeeds(feedsData);
});

self.port.on("feedMarkedAsRead", function(feedsData){
    removeFeedFromList(feedsData);
});

self.port.on("showLoader", function(){
    showLoader();
});

function requestFeeds(){
    self.port.emit("getFeeds", null);
}

function markAsRead(feedId, isLinkOpened) {
    self.port.emit("markRead",{feedId: feedId, isLinkOpened: isLinkOpened});
}

function removeFeedFromList(feedId){
    $(".item[data-id='"+ feedId + "']").fadeOut("fast", function(){
        $(window).trigger("resize");
        if ($("#feed").find(".item:visible").size() === 0) {
            requestFeeds();
        }
    });
}

function showLoader(){
    $("body").children("div").hide();
    $("#loading").show();
    resizeWindows();
}

window.onresize = resizeWindows;

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

            var feeds = data.feeds;
            var container = $("#feed");
            for(var i = 0; i < feeds.length; i++){
                var item = $("<div class='item'/>").attr("data-id", feeds[i].id)
                    .append($("<a target='_blank' href='" + feeds[i].url + "' class='title' />").text(feeds[i].title + " "))
                    .append($("<span class='mark-read' title='Mark as read' />"));
                var blogTitle = $("<div class='blog-title' />")
                    .append($("<a target='_blank' href='" + feeds[i].blogUrl + "' />").text(feeds[i].blog + ", "))
                    .append($("<span class='timeago' title='" + feeds[i].date + "' />"));

                item.append(blogTitle);
                container.append(item);
            }
            $(".timeago").timeago();
        }
    }
    resizeWindows();
}

function resizeWindows(){
    var scrollOffset = 25;
    var maxWidth = 500;
    var maxHeight = 600;
    var width = document.body.scrollWidth > maxWidth ? maxWidth : document.body.scrollWidth;
    var height = document.body.scrollHeight > maxHeight ? maxHeight : document.body.scrollHeight ;
    self.port.emit("resizePanel", {width: width, height: height + scrollOffset});
}

$("#login").click(function () {
    self.port.emit("updateToken", null);
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