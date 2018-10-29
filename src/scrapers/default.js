var sos = sos || {};

sos.SUGGESTIONS_PER_SAVE = 2;

sos.trimmedUrl = function(url) {
    if (url.includes('://')) {
        url = url.substring(url.indexOf('://') + '://'.length);
    } 
    if (url.endsWith('/')) {
        url = url.substring(0, url.length - 1);
    }
    return url;
}

sos.getSavedItems = function(sendResponse) {
    let links = [];
    let linkEls = document.querySelectorAll('a');
    for (let i=0; i<linkEls.length; i++) {
        let url = linkEls[i].getAttribute('href');
        url = sos.buildUrl(url);
        links.push(url);
    }
    sendResponse(links);
    window.close();
}

sos.buildUrl = function(url) {
    if (!url.includes('://')) {
        url = sos.trimmedUrl(location.origin) + '/' + sos.trimmedUrl(url);
    } else {
        url = sos.trimmedUrl(url);
    }
    return url;
}

sos.scrapeSourcesOfUrl = function(targetUrl, sendResponse) {
    let sources = [];
    let linkEls = document.querySelectorAll('a');
    for (let i=0; i<linkEls.length; i++) {
        let url = linkEls[i].getAttribute('href');
        url = sos.buildUrl(url);
        if (targetUrl === url) {
            sources.push(sos.trimmedUrl(location.href));
            break;
        }
    }
    sendResponse(sources);
}

sos.scrapeOwnSources = function(sendResponse) {
    let sources = [];
    sendResponse({"sources": sources});
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('sos received message: ' + request.action);

    if (request.action === "scrapeOwnSources") {
        sos.scrapeOwnSources(sendResponse);        
    }
    else if (request.action == 'scrapeSourcesOfUrl') {
        sos.scrapeSourcesOfUrl(request.url, sendResponse);
    }
    else if (request.action == 'getSavedItems') {
        sos.getSavedItems(sendResponse);
    }
    else {
        console.log('sos unknown message: ' + request.action);
        sendResponse({}); // Send nothing..
    }
});

chrome.runtime.sendMessage('pageLoaded');
