var widgetGlobal = {
    icons: {
        default: "images/icon24.png",
        inactive: "images/icon24_inactive.png"
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
        counter.style.display = "block";
    }else{
        counter.innerHTML = "";
        counter.style.display = "none";
    }
});

self.port.on("decrementFeedsCount", function(decrementCount){
    var counter = document.getElementById("counter");
    counter.innerHTML = Number(counter.innerHTML) - decrementCount;
});