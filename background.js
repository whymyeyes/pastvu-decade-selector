"use strict";

const GET_COOKIE = "getCookie";
const COOKIE_NOT_FOUND = "Cookie not found";

addGetCookieMessageListener();

function addGetCookieMessageListener() {

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === GET_COOKIE) {
            chrome.cookies.get({ url: message.url, name: message.name }, (cookie) => {
                if (cookie) {
                    sendResponse({ value: cookie.value });
                } else {
                    sendResponse({ error: COOKIE_NOT_FOUND });
                }
            });
            return true;
        }
    });
}
