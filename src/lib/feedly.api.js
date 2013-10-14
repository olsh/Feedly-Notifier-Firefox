"use strict";

var Request = require("sdk/request").Request;
var xhr = require("sdk/net/xhr");
var timers = require("sdk/timers");

var FeedlyApiClient = function (accessToken) {

    this.accessToken = accessToken;

    var apiUrl = "http://cloud.feedly.com/v3/";
    var apiSecureUrl = "https://cloud.feedly.com/v3/";

    this.getMethodUrl = function (methodName, parameters, useSecureConnection) {
        if (methodName === undefined) {
            return "";
        }
        var methodUrl = (useSecureConnection ? apiSecureUrl : apiUrl) + methodName;
        var queryString;
        if (parameters) {
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

    this.request = function (methodName, settings) {
        var url = this.getMethodUrl(methodName, settings.parameters, settings.useSecureConnection);
        var verb = settings.method || "GET";

        // For bypassing the cache
        if (verb === "GET"){
            url += ((/\?/).test(url) ? "&" : "?") + "ck=" + (new Date()).getTime();
        }

        /* Firefox addon SDK support native XMLHttpRequest with limitations,
         * therefore we use sdk/request for get */
        if (verb === "GET" || settings.useSdkRequest) {
            var headers;
            if (this.accessToken) {
                headers = {
                    Authorization: "OAuth " + this.accessToken
                };
            }
            var request = Request({
                url: url,
                headers: headers,
                content: body,
                onComplete: function (response) {
                    if (response.json && !response.json.errorCode) {
                        if (typeof settings.onSuccess === "function") {
                            settings.onSuccess(response.json);
                        }
                    } else if (response.json && response.json.errorCode === 401) {
                        if (typeof settings.onAuthorizationRequired === "function") {
                            settings.onAuthorizationRequired(settings.accessToken);
                        }
                    } else {
                        if (typeof settings.onError === "function") {
                            settings.onError(response.json);
                        }
                    }
                }
            });

            if (verb === "POST") {
                request.post();
            } else {
                request.get();
            }
        }
        /* sdk/request recognizes symbol '=' in string as parameter=value
         * and feedly api doesn't recognize encoded string,
         * therefore we use sdk/net/xhr for non GET requests.
         * The XMLHttpRequest object is currently fairly limited,
         * and does not yet implement the addEventListener() or removeEventListener() methods.
         * */
        else {
            var request = new xhr.XMLHttpRequest();
            request.open(verb, url, true);
            if (this.accessToken) {
                request.setRequestHeader("Authorization", "OAuth " + this.accessToken);
            }

            var body;
            if (settings.body) {
                body = JSON.stringify(settings.body);
            }

            request.onreadystatechange = function(){
                if (request.readyState === 4){
                    if (request.status === 200) {
                        settings.onSuccess();
                    } else if (request.status === 401) {
                        settings.onAuthorizationRequired();
                    } else {
                        settings.onError();
                    }
                }
            };

            request.send(body);
        }
    };
};

function getClient(accessToken) {
    return new FeedlyApiClient(accessToken);
}

exports.getClient = getClient;