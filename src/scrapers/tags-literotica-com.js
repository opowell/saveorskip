var sos = sos || {};

sos.SUGGESTIONS_PER_SAVE = 2;

sos.getSavedItems = function(sendResponse) {
    let links = [];
    let linkEls = document.querySelectorAll('.StoryCardComponent__story__title___3FXmU');
    for (let i=0; i<linkEls.length; i++) {
        let url = linkEls[i].getAttribute('href');
        url = sos.buildUrl(url);
        links.push(url);
    }
    if (links.length > 0) {
       sendResponse(links);
       window.close();
} else {
    console.log(document.documentElement.outerHTML);
        debugger;
    }
}

sos.scrapeSourcesOfUrl = function(targetUrl, sendResponse) {
    let sources = [];
    let linkEls = document.querySelectorAll('.StoryCardComponent__story__title___3FXmU');
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
    let author = document.querySelector('span.b-story-user-y > a');
    if (author != null) {
        sources.push({
            url: sos.buildUrl(author.getAttribute('href')),
            points: 5
        });
    }
    let favUsers = document.querySelectorAll('p.b-favorites-users > a.user-name');
    for (let i=0; i<favUsers.length; i++) {
        let url = favUsers[i].getAttribute('href') + '&page=favorites';
        url = sos.trimmedUrl(url);
        sources.push({
            url: url,
            points: 3
        });
    }

    let topic = document.querySelector('.b-breadcrumbs > a');
    if (topic != null) {
        let url = topic.getAttribute('href');
        url = sos.trimmedUrl(url);
        sources.push({
            url: url,
            points: 1
        });
    }

    let tags = document.querySelectorAll('.b-s-story-tag-list a');
    for (let i=0; i<tags.length; i++) {
        let url = tags[i].getAttribute('href');
        url = sos.trimmedUrl(url);
        sources.push({
            url: url,
            points: 1
        });
    }

    sendResponse({"sources": sources});
}

sos.buildUrl = function(url) {
    if (!url.includes('://')) {
        url = sos.trimmedUrl(location.origin) + '/' + sos.trimmedUrl(url);
    } else {
        url = sos.trimmedUrl(url);
    }
    return url;
}

sos.trimmedUrl = function(url) {
    if (url.includes('://')) {
        url = url.substring(url.indexOf('://') + '://'.length);
    } 
    if (url.endsWith('/')) {
        url = url.substring(0, url.length - 1);
    }
    return url;
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