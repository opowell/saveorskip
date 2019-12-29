let MESSAGES = ['getObject', 'getLinks', 'getSourcesOf', 'getSourcesOfSelf'];

let scraper = {};

// This page represented as an object: url, title, links, sources and anything else.
scraper.getObject = function() {};
// Links of this page, if it were a source.
scraper.getLinks = function() {};
// Get sources of the given url, typically this page.
scraper.getSourcesOf = function(url) {};
// Get sources of the given page.
scraper.getSourcesOfSelf = function() {};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('sos received message: ' + JSON.stringify(request));
  if (scraper[request.action] != null) {
    scraper[request.action](request.payload, sender, sendResponse);
  }

  if (request.action === 'getSourcesOf') {
    let sources = sos.getSources(request.saveOrSkip);
    sendResponse({ sources: sources });
  } else if (request.action === 'getUrlSources') {
    sos.getUrlSources(request.url, sendResponse, request.saveOrSkip);
  } else if (request.action === 'getLinks') {
    sos.getLinksWithResponse(sendResponse);
  } else if (request.action === 'getLink') {
    let link = sos.getLink();
    console.log('got link: ' + JSON.stringify(link));
    sendResponse(link);
  } else {
    console.log('sos unknown message: ' + JSON.stringify(request));
    sendResponse({}); // Send nothing..
  }
});

sos.pageLoaded = false;

sos.getLink = function() {
  let links = sos.getLinks();
  let sourcesForSave = sos.getSources('save');
  let sourcesForSkip = sos.getSources('skip');
  let out = {
    url: sos.trimmedUrl(location.href),
    title: document.title,
    sourcesForSave,
    sourcesForSkip,
    links,
  };
  if (sos.isRegularPost()) {
    out.subreddit = sos.getSubredditName();
    out.poster = sos.getPosterName();
  }
  return out;
};
