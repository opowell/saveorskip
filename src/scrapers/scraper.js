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

  if (request.action === 'getSources') {
    let sources = sos.getSources();
    sendResponse({ sources });
  } else if (request.action === 'getUrlSources') {
    sos.getSourcesForUrl(request.url, sendResponse);
  } else if (request.action === 'getLinks') {
    sos.getLinksWithResponse(sendResponse);
  } else if (request.action === 'getLink') {
    let link = sos.getLink();
    console.log('got link: ' + JSON.stringify(link));
    sendResponse(link);
  } else {
    console.log('sos unknown message: ' + request.action);
    sendResponse({}); // Send nothing..
  }
});

sos.getPage = function() {
  let links = sos.getLinks();
  let sources = sos.getSources();
  let out = {
    url: sos.trimmedUrl(location.href),
    title: document.title,
    sources,
    links,
  };
  sos.getPageAttributes(out);
  return out;
};

sos.setIfNotNull = function(scraper, field) {
  if (scraper[field] != null) {
    eval(`sos[field] = ${scraper[field]}`);
  }
};

let getScraperCallback = function({ scraper, closeWhenDone }) {
  sos.scraper = scraper;
  sos.closeWhenDone = closeWhenDone;

  sos.setIfNotNull(scraper, 'getPageAttributes');
  sos.setIfNotNull(scraper, 'getLinks');
  sos.setIfNotNull(scraper, 'getSources');
  sos.setIfNotNull(scraper, 'getSourcesOfUrl');
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

  debugger;

  if (sos.closeWhenDone === true) {
    window.close();
  }
};

console.log('finished running, sending pageLoaded message');
chrome.runtime.sendMessage(
  {
    action: 'pageLoaded',
  },
  getScraperCallback
);

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
