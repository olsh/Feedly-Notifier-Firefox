var popupGlobal = {
    feeds : []
}

self.port.on("feedsUpdated", function(feedsData){
    renderFeeds(feedsData);
});

self.port.on("feedMarkedAsRead", function(feedsData){
    removeFeedFromList(feedsData);
});

self.port.on("showLoader", function(){
    showLoader();
    resizeWindows();
});

function requestFeeds(){
    self.port.emit("getFeeds", null);
}

function markAsRead(feedIds, isLinkOpened) {
    self.port.emit("markRead",{feedIds: feedIds, isLinkOpened: isLinkOpened});
}

function removeFeedFromList(feedIds){
    for(var i = 0; i < feedIds.length; i++){
        $(".item[data-id='"+ feedIds[i] + "']").fadeOut("fast", function(){
            $(window).trigger("resize");
            if ($("#feed").find(".item:visible").size() === 0) {
                requestFeeds();
            }
        });
    }
}

function showLoader(){
    $("body").children("div").hide();
    $("#loading").show();
}

function showLogin(){
    $("body").children("div").hide();
    $("#login").show();
}

function showContent(){
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
            for(var i = 0; i < feeds.length; i++){
                var item = $("<div class='item'/>").attr("data-id", feeds[i].id)
                    .append($("<a target='_blank' href='" + feeds[i].url + "' class='title' />").text(feeds[i].title + " "))
                    .append($("<span class='mark-read' title='Mark as read' />"))
                    .append($("<span class='show-content' title='Show content' />"));
                var blogTitle = $("<div class='blog-title' />")
                    .append($("<a target='_blank'/>")
                        .attr("href", feeds[i].blogUrl)
                        .text(feeds[i].blog + ", ")
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

window.onresize = resizeWindows;

function resizeWindows(){
    var scrollOffset = 25;
    var maxWidth = 700;
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
        markAsRead([$(this).closest(".item").data("id")], true);
    }
});

$("#feed").on("click", ".mark-read", function (event) {
    var feed = $(this).closest(".item");
    markAsRead([feed.data("id")], false);
});

$("#feed").on("click", ".show-content", function(){
    var $this = $(this);
    var feed = $this.closest(".item");
    var contentContainer = feed.find(".content");
    var feedId = feed.data("id");
    if(contentContainer.html() === ""){
        var content;
        for(var i = 0; i < popupGlobal.feeds.length; i++){
            if(popupGlobal.feeds[i].id === feedId){
                content = popupGlobal.feeds[i].content
            }
        }
        if(content){
            contentContainer.html(content);
            //For open links in new tab
            contentContainer.find("a").each(function(key, value){
                var link = $(value);
                link.attr("target", "_blank");
            });
        }
    }
    contentContainer.slideToggle(function () {
        $this.css("background-position", contentContainer.is(":visible") ? "-288px -120px" :"-313px -119px");
        if (contentContainer.is(":visible") && contentContainer.text().length > 350){
            feed.css("width",  "700px");
        } else{
            feed.css("width",  "350px");
        }
        resizeWindows();
    });
});

$("#popup-content").on("click", "#mark-all-read",function(event){
    var feedIds = [];
    $(".item").each(function(key, value){
        feedIds.push($(value).data("id"));
    });
    markAsRead(feedIds);
});