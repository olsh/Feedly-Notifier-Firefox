function getToken() {
    try {
        var sessionData = localStorage.getItem("session@cloud");
        if (sessionData) {
            var feedlyToken = JSON.parse(localStorage.getItem('session@cloud'))['feedlyToken'];
            self.port.emit("accessTokenReceived", feedlyToken);
        }else{
            setTimeout(getToken, 3000);
        }
    } catch (exception) {

    }
}

getToken();