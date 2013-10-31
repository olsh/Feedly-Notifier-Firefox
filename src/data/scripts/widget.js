"use strict";

var widgetGlobal = {
    icons: {
        default: "images/icon20.png",
        inactive: "images/icon20_inactive.png"
    }
};

self.port.on("onFeedsUpdate", function (data) {
    if (!document) return; //Prevent bug when widget didn't initialized yet, but events already emit

    var icon = document.getElementById("feedly-notifier-icon");
    if (data.isLoggedIn) {
        icon.src = widgetGlobal.icons.default;
    } else {
        icon.src = widgetGlobal.icons.inactive;
    }

    var counter = document.getElementById("feedly-notifier-counter");
    if (data.unreadFeedsCount > 0) {
        counter.innerHTML = data.unreadFeedsCount > 9999 ? "&#8734" /* ∞ */ : data.unreadFeedsCount;
        counter.style.display = "block";
    } else {
        counter.innerHTML = "";
        counter.style.display = "none";
    }
});

self.port.on("decrementFeedsCount", function (decrementCount) {
    var counter = document.getElementById("feedly-notifier-counter");
    counter.innerHTML = Number(counter.innerHTML) - decrementCount;
    if (Number(counter.innerHTML) < 1) {
        counter.style.display = "none";
    }
});

self.port.on("startWidgetUpdateAnimation", function (){
    document.getElementById("feedly-notifier-counter").style.display = "none";
    document.getElementById("feedly-notifier-loader").style.display = "inline-block";
});

self.port.on("stopWidgetUpdateAnimation", function (){
    document.getElementById("feedly-notifier-counter").style.display = "block";
    document.getElementById("feedly-notifier-loader").style.display = "none";
});

window.addEventListener("click", function (event) {
    if (event.button === 1) {
        self.port.emit("middle-click", null);
    } else if (event.button === 0){
        self.port.emit("left-click", null);
    }
    event.preventDefault();
}, true);