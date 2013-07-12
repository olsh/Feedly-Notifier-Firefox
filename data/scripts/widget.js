self.port.on("onFeedsUpdate", function(data){

    //TODO: Set properly icon
    if(data.isLoggedIn){

    }else{

    }

    var counter = document.getElementById("counter");
    if(data.unreadFeedsCount > 0){
        counter.innerHTML = data.unreadFeedsCount;
    }else{
        //For test only
        counter.innerHTML = 0;
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