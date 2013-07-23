var Request = require("sdk/request").Request;
var xhr = require("sdk/net/xhr").XMLHttpRequest;

var FeedlyApiClient = function (accessToken) {

    this.accessToken = accessToken;
    var apiUrl = "http://cloud.feedly.com/v3/";

    var getMethodUrl = function (methodName, parameters) {
        if (methodName === undefined) {
            return "";
        }
        var methodUrl = apiUrl + methodName;
        var queryString;
        if (parameters !== null) {
            queryString = "?";
            for (var parameterName in parameters) {
                queryString += parameterName + "=" + parameters[parameterName] + "&";
            }
            queryString = queryString.replace(/&$/, "");
        }

        if (queryString !== undefined) {
            methodUrl += queryString;
        }

        return methodUrl;
    };


    this.get = function (methodName, parameters, callback) {
        var methodUrl = getMethodUrl(methodName, parameters);
        getRequest(methodUrl, callback, this.accessToken, null);
    };

    this.post = function (methodName, parameters, body, callback) {
        var methodUrl = getMethodUrl(methodName, parameters);
        postRequest(methodUrl, callback, this.accessToken, JSON.stringify(body));
    }

    /* sdk/request recognizes symbol '=' in string as parameter=value
     * and feedly api doesn't recognize encoded string,
     * therefore we use sdk/net/xhr
     * */
    var postRequest = function (url, callback, accessToken, body) {
        var request = new xhr();
        request.open("POST", url, true);
        if (accessToken !== undefined) {
            request.setRequestHeader("Authorization", "OAuth " + accessToken);
        }

        // Doesn't support by sdk/net/xhr yet
        request.onload = function (e) {

            var json;
            try {
                json = JSON.parse(e.target.response);
            } catch (exception) {
                json = {
                    Error: exception.message,
                    errorCode: 500
                }
            }
            callback(json);
        };
        request.send(body);
    };

    /* Firefox addon SDK support native XMLHttpRequest with limitations,
     * therefore we use sdk/request for get */
    var getRequest = function ( url, callback, accessToken, body) {
        var headers;
        if(accessToken !== undefined){
            headers = {
                Authorization: "OAuth " + accessToken
            };
        }
        var request = Request({
            url: url,
            headers: headers,
            content: body,
            onComplete: callback
        });

        request.get();
    }
};

function getClient(accessToken) {
    return new FeedlyApiClient(accessToken);
}

exports.getClient = getClient;