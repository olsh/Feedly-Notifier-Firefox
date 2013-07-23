function getToken() {
    try {
        var feedlyToken = JSON.parse(localStorage.getItem('session@cloud'))['feedlyToken'];
        self.port.emit("accessTokenReceived", feedlyToken);
    } catch (exception) {
        setTimeout(getToken, 3000);
    }
}

getToken();