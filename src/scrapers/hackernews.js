var sos = {};

sos.SUGGESTIONS_PER_SAVE = 2;

sos.trimmedUrl = function(url) {
  if (url.includes('://')) {
    url = url.substring(url.indexOf('://') + '://'.length);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }
  if (url.startsWith('/')) {
    url = url.substring(1);
  }
  return url;
};

sos.buildUrl = function(url) {
  if (!url.includes('://')) {
    url = sos.trimmedUrl(location.origin) + '/' + sos.trimmedUrl(url);
  } else {
    url = sos.trimmedUrl(url);
  }
  return url;
};

// TODO
sos.getSources = function(sendResponse) {
  let sources = [];
  let userEls = document.querySelectorAll('.hnuser');
  for (let i = 0; i < userEls; i++) {
    let url = userEls.getAttribute('href');
    url = sos.buildUrl(url);
  }
  sendResponse(links);
  sendResponse({ sources: sources });
};

sos.getLinks = function(sendResponse) {
  let links = [];
  let linkEls = document.querySelectorAll('.storyLink');
  for (let i = 0; i < linkEls.length; i++) {
    let url = linkEls.getAttribute('href');
    url = sos.buildUrl(url);
    links.push(url);
  }
  sendResponse(links);
  window.close();
};

sos.getUrlSources = function(targetUrl, sendResponse) {
  let sources = [];
  let linkEls = document.querySelectorAll('a');
  for (let i = 0; i < linkEls.length; i++) {
    let url = linkEls[i].getAttribute('href');
    url = sos.buildUrl(url);
    if (targetUrl === url) {
      sources.push(sos.trimmedUrl(location.href));
      break;
    }
  }
  sendResponse(sources);
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('sos received message: ' + request.action);

  if (request.action === 'getSources') {
    sos.getSources(sendResponse);
  } else if (request.action == 'getUrlSources') {
    sos.getUrlSources(request.url, sendResponse);
  } else if (request.action == 'getLinks') {
    sos.getLinks(sendResponse);
  } else {
    console.log('sos unknown message: ' + request.action);
    sendResponse({}); // Send nothing..
  }
});

chrome.runtime.sendMessage('pageLoaded');
