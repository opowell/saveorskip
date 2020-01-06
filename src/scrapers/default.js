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

sos.getLinks = function() {
  let links = [];
  let linkEls = document.querySelectorAll('a');
  for (let i = 0; i < linkEls.length; i++) {
    let url = linkEls[i].getAttribute('href');
    if (url == null) {
      continue;
    }
    url = sos.buildUrl(url);
    if (sos.isParentUrl(url)) {
      continue;
    }
    if (!links.includes(url)) {
      links.push(url);
    }
  }
  return links;
};

sos.isParentUrl = function(url) {
  let curUrl = sos.buildUrl(window.location.href);
  if (curUrl.includes(url) && url !== curUrl) {
    return true;
  }
  return false;
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

sos.getSourcesForUrl = function(url, sendResponse) {
  let sources = [];
  let linkEls = document.querySelectorAll('a');
  for (let i = 0; i < linkEls.length; i++) {
    let linkUrl = linkEls[i].getAttribute('href');
    linkUrl = sos.buildUrl(linkUrl);
    if (url === linkUrl) {
      sources.push(sos.trimmedUrl(location.href));
      break;
    }
  }
  sendResponse(sources);
};

sos.getSources = function() {
  let sources = [];
  let linkEls = document.querySelectorAll('a');
  for (let i = 0; i < linkEls.length; i++) {
    let url = linkEls[i].getAttribute('href');
    if (url == null) {
      continue;
    }
    url = sos.buildUrl(url);
    if (!sos.isParentUrl(url)) {
      continue;
    }
    if (!sources.includes(url)) {
      sources.push(url);
    }
  }
  return sources;
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

sos.getLink = function() {
  let links = sos.getLinks();
  let sources = sos.getSources();
  let out = {
    url: sos.trimmedUrl(location.href),
    title: document.title,
    sources,
    links,
  };
  return out;
};

let link = sos.getLink();

console.log('finished running, sending pageLoaded message');

let callback = function(data) {
  eval(`sos.getLinks = function() {
    let links = [];
    ${data.getLinks}
    console.log('returning links: ' + links.join('\n'));
    return links;
  };`);

  eval(`sos.getSources = function() {
    let sources = [];
    ${data.getSources}
    console.log('returning sources: ' + sos.objJoin(sources, '\n'));
    return sources;    
  }`);
};

chrome.runtime.sendMessage(
  {
    action: 'pageLoaded',
    link,
  },
  callback
);
