$(document).ready(function () {
    try {
        var feedlyToken = JSON.parse(localStorage.getItem('session@cloud'))['feedlyToken'];
        self.port.emit("accessTokenReceived", feedlyToken);
    } catch (exception) {

    }
});