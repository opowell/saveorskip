var sos = {};

sos.SUGGESTIONS_PER_SAVE = 2;

sos.getLinks = function(sendResponse) {
  let links = [];
  let linkEls = [];

  let tableEls = document.querySelectorAll('table');
  for (let i = 0; i < tableEls.length; i++) {
    let el = tableEls[i];
    if (el.innerText.trim().startsWith('FAVORITE STORIES')) {
      linkEls = el.querySelectorAll(':scope a.bb');
    }
  }

  // console.log('found ' + linkEls.length + ' links');

  for (let i = 0; i < linkEls.length; i++) {
    let url = linkEls[i].getAttribute('href');
    url = sos.buildUrl(url);
    links.push({
      url: url,
      title: linkEls[i].innerText,
    });
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

sos.getSources = function(sendResponse) {
  // If not on last page of story, redirect to last page and getSources there.
  let pageSelect = document.querySelector('select');
  if (pageSelect != null) {
    // console.log('not last page');
    // Open last page in background and scrape sources from there.
    let pageLinks = document.querySelectorAll('.b-pager-pages a');
    let lastLink = pageLinks[pageLinks.length - 1].href;
    chrome.runtime.sendMessage({
      action: 'openAndScrape',
      url: lastLink,
    });
    sendResponse({});
  }

  let sources = [];
  let author = document.querySelector('span.b-story-user-y > a');
  if (author != null) {
    sources.push({
      url: sos.buildUrl(author.getAttribute('href')),
      points: 5,
    });
  }
  let favUsers = document.querySelectorAll('p.b-favorites-users > a.user-name');
  for (let i = 0; i < favUsers.length; i++) {
    let url = favUsers[i].getAttribute('href') + '&page=favorites';
    url = sos.trimmedUrl(url);
    sources.push({
      url: url,
      points: 3,
    });
  }

  let topic = document.querySelector('.b-breadcrumbs > a');
  if (topic != null) {
    let url = topic.getAttribute('href');
    url = sos.trimmedUrl(url);
    sources.push({
      url: url,
      points: 1,
    });
  }

  let tags = document.querySelectorAll('.b-s-story-tag-list a');
  for (let i = 0; i < tags.length; i++) {
    let url = tags[i].getAttribute('href');
    url = sos.trimmedUrl(url);
    sources.push({
      url: url,
      points: 1,
    });
  }

  sendResponse({ sources: sources });
  // console.log('sent sources: ' + sources.join('\n'));
};

sos.buildUrl = function(url) {
  if (!url.includes('://')) {
    url = sos.trimmedUrl(location.origin) + '/' + sos.trimmedUrl(url);
  } else {
    url = sos.trimmedUrl(url);
  }
  return url;
};

sos.trimmedUrl = function(url) {
  if (url.includes('://')) {
    url = url.substring(url.indexOf('://') + '://'.length);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }
  return url;
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  // console.log('sos received message: ' + request.action);

  if (request.action === 'getSources') {
    sos.getSources(sendResponse);
  } else if (request.action == 'getUrlSources') {
    sos.getUrlSources(request.url, sendResponse);
  } else if (request.action == 'getLinks') {
    sos.getLinks(sendResponse);
  } else {
    // console.log('sos unknown message: ' + request.action);
    sendResponse({}); // Send nothing..
  }
});

chrome.runtime.sendMessage('pageLoaded');
