/* eslint-disable prettier/prettier */
var sos = sos || {};

sos.SUGGESTIONS_PER_SAVE = 2;
sos.doFinish = true;

sos.trimmedUrl = function(url) {
  if (url.includes('://')) {
    url = url.substring(url.indexOf('://') + '://'.length);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }
  return url;
};

sos.objJoin = function(obj, separator) {
  var arr = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      arr.push(JSON.stringify(obj[key]));
    }
  }
  return arr.join(separator || '\n');
};

sos.getLinksWithResponse = function(sendResponse) {
  let links = sos.getLinks();
  if (sendResponse != null) {
    sendResponse(links);
  }
  if (links.length > 0 && sos.closeAfterScrape) {
    window.close();
  }
};

sos.buildUrl = function(url) {
  if (url.includes('#')) {
    let hashIndex = url.indexOf('#');
    let questionIndex = url.indexOf('?');
    url = url.substring(0, hashIndex) + questionIndex > -1 ? url.substring(questionIndex) : '';
  }
  if (!url.includes('://')) {
    url = sos.trimmedUrl(location.origin) + (url.startsWith('/') ? '' : '/') + sos.trimmedUrl(url);
    url = sos.trimmedUrl(url);
  } else {
    url = sos.trimmedUrl(url);
  }
  return url;
};

sos.getLinksWithResponse = function(sendResponse) {
  let links = sos.getLinks();
  if (sendResponse != null) {
    sendResponse(links);
  }
  if (links.length > 0 && sos.closeAfterScrape) {
    window.close();
  }
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('sos received message: ' + request.action);

  if (request.action === 'getScraper') {
    getScraperCallback(request.payload);
  } else if (request.action === 'getSources') {
    let sources = sos.getSources();
    sendResponse({ sources });
  } else if (request.action === 'getUrlSources') {
    let sources = sos.getSourcesForUrl(request.url);
    sendResponse({ sources });
  } else if (request.action === 'getLinks') {
    sos.getLinksWithResponse(sendResponse);
  } else if (request.action === 'getPage') {
    let page = sos.getPage();
    console.log('got page: ' + JSON.stringify(page));
    chrome.runtime.sendMessage({ action: 'getPage', page });
  } else {
    console.log('sos unknown message: ' + request.action, request);
    sendResponse({}); // Send nothing..
  }
});

sos.getPage = function() {
  if (sos.scraper == null) {
    console.log('No scraper, stopping.');
    return;
  }
  let links = sos.getLinks();
  let sources = sos.getSources();
  let out = {
    url: sos.trimmedUrl(location.href),
    title: document.title,
    sources,
    links,
    scraperId: sos.scraper.id,
  };
  sos.getPageAttributes(out);
  return out;
};

sos.setIfNotNull = function(scraper, field) {
  if (scraper[field] != null) {
    eval(`sos[field] = ${scraper[field]}`);
  }
};

let getScraperCallback = function(response) {
  if (response == null) {
    return;
  }
  if (response.scraper == null) {
    return;
  }
  let { scraper, closeWhenDone } = response;
  console.log('got scraper ' + scraper.id);
  sos.scraper = scraper;
  sos.closeWhenDone = closeWhenDone;

  sos.setIfNotNull(scraper, 'getPageAttributes');
  sos.setIfNotNull(scraper, 'getLinks');
  sos.setIfNotNull(scraper, 'getSources');
  sos.setIfNotNull(scraper, 'getSourcesForUrl');
  sos.setIfNotNull(scraper, 'onScriptLoad');

  sos.onScriptLoad();

  if (sos.doFinish) {
    sos.finishScraperLoad();
  }
};

sos.finishScraperLoad = function() {
  let page = sos.getPage();

  chrome.runtime.sendMessage({
    action: 'getPage',
    page,
  });

  if (sos.closeWhenDone === true) {
    window.close();
  }
};

console.log('finished running, sending pageLoaded message');
chrome.runtime.sendMessage({ action: 'pageLoaded' });

// Functions to overwrite in scraper instances.
sos.getLinks = function() {
  return [];
};
sos.getSources = function() {
  return [];
};
sos.getSourcesOfUrl = function() {
  return [];
};
sos.getPageAttributes = function(page) {};
sos.onScriptLoad = function() {};
