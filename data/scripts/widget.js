var widgetGlobal = {
    icons: {
        default: "images/icon.png",
        inactive: "images/icon_inactive.png"
    }
}

self.port.on("onFeedsUpdate", function(data){
    var image = document.getElementById("image");
    if(data.isLoggedIn){
        image.src = widgetGlobal.icons.default;
    }else{
        image.src = widgetGlobal.icons.inactive;
    }

    var counter = document.getElementById("counter");
    if(data.unreadFeedsCount > 0){
        counter.innerHTML = data.unreadFeedsCount;
    }else{
        counter.innerHTML = "";
    }
});

window.addEventListener('click', function(event) {
    if(event.button == 0 && event.shiftKey == false)
    {
        self.port.emit('getFeeds');
    }
    event.preventDefault();
}, true);

self.port.on("decrementFeedsCount", function(decrementCount){
    var counter = document.getElementById("counter");
    counter.innerHTML = Number(counter.innerHTML) - decrementCount;
});