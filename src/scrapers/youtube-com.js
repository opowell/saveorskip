var sos = {
  save: {
    SUGGESTIONS_SUBREDDIT: 3,
    SUGGESTIONS_POSTER: 3,
    SUGGESTIONS_COMMENTER: 1,
    SUGGESTIONS_DOMAIN: 1,
    URL_SOURCE: 1,
  },
  skip: {
    SUGGESTIONS_SUBREDDIT: -2,
    SUGGESTIONS_POSTER: -2,
    SUGGESTIONS_COMMENTER: -1,
    SUGGESTIONS_DOMAIN: 1,
    URL_SOURCE: -1,
  },
};

sos.MAX_COMMENTERS = 3;

sos.highlightLinks = true;
sos.closeAfterScrape = true;

// Get the links from this page.
sos.getSavedItems = function(sendResponse) {
  console.log('get saved items');
  let linkEls = document.querySelectorAll('a#video-title');

  let links = [];
  for (let i = 0; i < linkEls.length; i++) {
    let linkEl = linkEls[i];

    links.push(sos.buildUrl(linkEl.getAttribute('href')));
  }
  console.log('returning saved links: ' + links.join('\n'));
  sendResponse(links);
  if (links.length > 0 && sos.closeAfterScrape) {
    window.close();
  }
};

// Get the sources of this page.
sos.scrapeOwnSources = function(saveOrSkip) {
  console.log('scraping own sources (' + saveOrSkip + ')');
  let sources = [
    {
      url: 'www.youtube.com',
      points: sos[saveOrSkip].SUGGESTIONS_DOMAIN,
    },
  ];

  let userEl = document.querySelector('yt-formatted-string#owner-name > a');
  let posterLink = null;
  if (userEl != null) {
    posterLink = sos.buildUrl(userEl.getAttribute('href'));
    sources.push({
      url: posterLink,
      points: sos[saveOrSkip].SUGGESTIONS_POSTER,
    });
  }

  let commenters = document.querySelectorAll('a#author-text');
  for (let i = 0; i < commenters.length; i++) {
    let commenterLink = sos.buildUrl(commenters[i].getAttribute('href'));
    if (posterLink != commenterLink) {
      sources.push({
        url: commenterLink,
        points: sos[saveOrSkip].SUGGESTIONS_COMMENTER,
      });
      if (i >= sos.MAX_COMMENTERS - 1) {
        break;
      }
    }
  }

  console.log('returning own sources: ' + sos.objJoin(sources, '\n'));
  return sources;
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

// Check if the current page contains a certain link.
sos.scrapeSourcesOfUrl = function(targetUrl, sendResponse, saveOrSkip) {
  console.log('scraping sources (' + saveOrSkip + ') of url: ' + targetUrl);
  let sources = [];
  let linkEls = document.querySelectorAll('a#video-title');
  for (let i = 0; i < linkEls; i++) {
    let url = linkEls[i].getAttribute('href');

    if (url == null) {
      debugger;
    }

    if (!url.includes('://')) {
      url = location.host + '/' + sos.trimmedUrl(url);
    } else {
      url = sos.trimmedUrl(url);
    }
    if (targetUrl === url) {
      sources.push({
        url: sos.trimmedUrl(location.href),
        points: sos[saveOrSkip].URL_SOURCE,
      });
      break;
    }
  }

  console.log('returning sources (' + saveOrSkip + ') of url ' + targetUrl + ':\n' + sos.objJoin(sources, '\n'));

  sendResponse(sources);
};

sos.buildUrl = function(url) {
  if (url.startsWith('/')) {
    url = url.substring(1);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }
  return 'www.youtube.com/' + url;
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('sos received message: ' + request.action);

  if (request.action === 'scrapeOwnSources') {
    let sources = sos.scrapeOwnSources(request.saveOrSkip);
    sendResponse({ sources: sources });
  } else if (request.action === 'scrapeSourcesOfUrl') {
    sos.scrapeSourcesOfUrl(request.url, sendResponse, request.saveOrSkip);
  } else if (request.action === 'getSavedItems') {
    sos.getSavedItems(sendResponse);
  } else {
    console.log('sos unknown message: ' + JSON.stringify(request));
    sendResponse({}); // Send nothing..
  }
});

chrome.runtime.sendMessage('pageLoaded');
