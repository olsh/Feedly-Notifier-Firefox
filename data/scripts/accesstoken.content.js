function getToken() {
    try {
        var feedlyToken = JSON.parse(getCookie("session@cloud")).feedlyToken;
        console.log(feedlyToken);
        self.port.emit("accessTokenReceived", feedlyToken);
    } catch (exception) {
        setTimeout(getToken, 3000);
        console.log(exception.message);
    }
}

getToken();

function getCookie(cookieName) {
    return unescape(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + escape(cookieName).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
}