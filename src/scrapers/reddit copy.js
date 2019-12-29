let scraper = {};

// This page represented as an object: url, title, links, sources and anything else.
scraper.getObject = function() {};
// Links of this page, if it were a source.
scraper.getLinks = function() {};
// Get sources of the given url, typically this page.
scraper.getSourcesOf = function(url) {};
// Get sources of the given page.
scraper.getSourcesOfSelf = function() {};

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

sos.SUBREDDIT_CLASS = '_19bCWnxeTjqzBElWZfIlJb';

sos.MAX_COMMENTERS = 3;

sos.closeAfterScrape = true;

sos.trimmedUrl = function(url) {
  if (url.includes('://')) {
    url = url.substring(url.indexOf('://') + '://'.length);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }
  return url;
};

sos.isOverlaidPost = function() {
  return document.getElementById('overlayScrollContainer') != null;
};

sos.isPageWithLinks = function() {
  return document.getElementsByClassName('rpBJOHq2PR60pnwJlUyP0').length > 0;
};

sos.getSubredditName = function() {
  let name = null;
  if (sos.isOverlaidPost()) {
    let els = document.getElementsByClassName('_3ryJoIoycVkA88fy40qNJc');
    name = els[els.length - 1].getAttribute('href');
  } else {
    name = document.getElementsByClassName('_2D7eYuDY6cYGtybECmsxvE')[0].innerText;
  }
  return name;
};

sos.isRegularPost = function() {
  return document.getElementsByClassName('_2M2wOqmeoPVvcSsJ6Po9-V').length === 1;
};

sos.getLinks = function() {
  console.log('get links');

  let links = [];
  if (sos.isOverlaidPost()) {
    return links;
  }

  let linkEls = document.getElementsByClassName('SQnoC3ObvgnGjWt90zD9Z');

  for (let i = 0; i < linkEls.length; i++) {
    let linkEl = linkEls[i];

    // Skip sticky posts.
    if (linkEl.parentElement.parentElement.parentElement.querySelector('.icon-sticky')) {
      continue;
    }

    links.push({
      url: 'http://www.reddit.com' + linkEl.getAttribute('href'),
      title: linkEl.text,
    });
  }
  console.log('returning links: ' + links.join('\n'));
  return links;
};

// Get the links from this page.
sos.getLinksWithResponse = function(sendResponse) {
  let links = sos.getLinks();
  if (sendResponse != null) {
    sendResponse(links);
  }
  if (links.length > 0 && sos.closeAfterScrape) {
    window.close();
  }
};

sos.getPosterName = function() {
  return document.getElementsByClassName('_2tbHP6ZydRpjI44J3syuqC _23wugcdiaj44hdfugIAlnX oQctV4n0yUb0uiHDdGnmE')[0].innerText;
};

// Get the sources of this page.
sos.getSources = function(saveOrSkip) {
  console.log('get sources (' + saveOrSkip + ')');
  let sources = [];

  // REDDIT
  if (sos.trimmedUrl(window.location.href) !== 'www.reddit.com') {
    sources.push({
      url: 'www.reddit.com',
      points: sos[saveOrSkip].SUGGESTIONS_DOMAIN,
    });
  }

  // SUBREDDIT
  try {
    let subreddit = null;
    let name = sos.getSubredditName();
    subreddit = sos.buildUrl(name);
    sources.push({
      url: subreddit,
      points: sos[saveOrSkip].SUGGESTIONS_SUBREDDIT,
    });
  } catch (err) {}

  let posterLink = null;
  try {
    if (sos.isPost()) {
      // let userEl = document.querySelector('[data-test-id="post-content"] .s1461iz-1');
      let user = sos.getPosterName();
      posterLink = sos.buildUrl(user);
      sources.push({
        url: posterLink,
        points: sos[saveOrSkip].SUGGESTIONS_POSTER,
      });
    }
  } catch (err) {}

  if (sos.isPost()) {
    try {
      let commenters = document.getElementsByClassName('_23wugcdiaj44hdfugIAlnX');
      console.log('found ' + commenters.length + ' commenters');
      // Skip author and logged-in user.
      let startAt = 2;
      let skipNames = [];
      let numFound = 0;
      skipNames.push(commenters[0].getAttribute('href'));
      skipNames.push(commenters[1].getAttribute('href'));
      for (let i = startAt; i < commenters.length; i++) {
        let commenterLink = sos.buildUrl(commenters[i].getAttribute('href'));
        if (posterLink !== commenterLink && !skipNames.includes(commenters[i].getAttribute('href'))) {
          skipNames.push(commenters[i].getAttribute('href'));
          numFound++;
          sources.push({
            url: commenterLink,
            points: sos[saveOrSkip].SUGGESTIONS_COMMENTER,
          });
          if (numFound >= sos.MAX_COMMENTERS) {
            break;
          }
        }
      }
    } catch (err) {
      console.log(err);
    }
  }

  console.log('returning sources: ' + sos.objJoin(sources, '\n'));
  return sources;
};

sos.isPost = function() {
  return sos.isOverlaidPost() || sos.hasRegularPosts();
};

sos.hasRegularPosts = function() {
  return document.getElementsByClassName('_2D7eYuDY6cYGtybECmsxvE').length > 0;
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
sos.getUrlSources = function(targetUrl, sendResponse, saveOrSkip) {
  console.log('get sources (' + saveOrSkip + ') of url: ' + targetUrl);
  let sources = [];
  let linkEls = document.getElementsByClassName('SQnoC3ObvgnGjWt90zD9Z');
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

// var observeDOM = (function() {
//   var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

//   return function(obj, callback) {
//     if (!obj || !obj.nodeType === 1) return; // validation

//     if (MutationObserver) {
//       // define a new observer
//       var obs = new MutationObserver(function(mutations, observer) {
//         if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) callback(mutations[0]);
//       });
//       // have the observer observe foo for changes in children
//       obs.observe(obj, { childList: true, subtree: true });
//     } else if (window.addEventListener) {
//       obj.addEventListener('DOMNodeInserted', callback, false);
//       obj.addEventListener('DOMNodeRemoved', callback, false);
//     }
//   };
// })();

//   https://stackoverflow.com/questions/3219758/detect-changes-in-the-dom
// Observe the DOM element for the list of posts:
// Note: CSS classes change regularly?
// let contentEl = document.querySelector('.ml7q64-0, .fszIwr, .zm3sux-0, .eaAbQI');

sos.buildUrl = function(url) {
  url = url.replace('\n', '');
  url = url.replace('u/', 'user/');
  if (url.startsWith('/')) {
    url = url.substring(1);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }
  return 'www.reddit.com/' + url;
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('sos received message: ' + JSON.stringify(request));

  if (request.action === 'getSources') {
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

sos.onPageLoad = function() {
  // let contentEl = document.querySelectorAll('.vz95qm-0.grqCvq')[1];
  let contentEl = document.querySelectorAll('.sogqxs-0.dpKXTN')[1];
  try {
    if (contentEl == null) {
      console.log('SOS: page loaded, no content found');
      let link = sos.getLink();
      sos.pageLoaded = true;
      chrome.runtime.sendMessage({
        action: 'pageLoaded',
        link,
      });
    } else {
      if (contentEl.innerText.length > 0) {
        console.log('SOS: page loaded immediately');
        sos.pageLoaded = true;
        let link = sos.getLink();
        chrome.runtime.sendMessage({
          action: 'pageLoaded',
          link,
        });
      } else {
        observeDOM(contentEl, function(m) {
          if (sos.pageLoaded) {
            return;
          }
          sos.pageLoaded = true;
          let link = sos.getLink();
          console.log('SOS: page loaded after observe');
          setTimeout(function() {
            chrome.runtime.sendMessage({
              action: 'pageLoaded',
              link,
            });
          }, 200);
        });
      }
    }
  } catch (err) {
    setTimeout(function() {
      console.log('SOS: page loaded after error');
      console.log(err);
      chrome.runtime.sendMessage('pageLoaded');
    }, 200);
  }
};

// // if (sos.isPageWithLinks()) {
setTimeout(sos.onPageLoad, 7000);
// } else {
//   sos.onPageLoad();
// }
