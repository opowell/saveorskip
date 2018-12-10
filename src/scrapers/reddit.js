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
  let linkEls = document.getElementsByClassName('SQnoC3ObvgnGjWt90zD9Z');

  let links = [];
  for (let i = 0; i < linkEls.length; i++) {
    let linkEl = linkEls[i];

    // Skip sticky posts.
    if (linkEl.parentElement.parentElement.parentElement.querySelector('.icon-sticky')) {
      continue;
    }

    if (sos.highlightLinks) {
      linkEl.style.color = 'white';
      linkEl.style['background-color'] = '#1A73E8';
      linkEl.style.padding = '3px';
      linkEl.style.margin = '2px';
    }
    links.push({
      link: 'http://www.reddit.com' + linkEl.getAttribute('href'),
      title: linkEl.text,
    });
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
      url: 'www.reddit.com',
      points: sos[saveOrSkip].SUGGESTIONS_DOMAIN,
    },
  ];
  // SUBREDDIT
  let subreddit = null;
  if (document.getElementsByClassName('s1wtsv0-8').length > 0) {
    // ON PAGE
    let els = document.getElementsByClassName('s1wtsv0-8');
    subreddit = sos.buildUrl(els[0].getAttribute('href'));
  } else {
    // ON PREVIEW
    let els = document.querySelectorAll("[data-test-id='post-content'] [data-click-id='subreddit']");
    if (els.length > 0) {
      subreddit = sos.buildUrl(els[0].getAttribute('href'));
    }
  }

  sources.push({
    url: subreddit,
    points: sos[saveOrSkip].SUGGESTIONS_SUBREDDIT,
  });

  let userEl = document.querySelector('[data-test-id="post-content"] .s1461iz-1');
  let posterLink = null;
  if (userEl != null) {
    posterLink = sos.buildUrl(userEl.innerText);
    sources.push({
      url: posterLink,
      points: sos[saveOrSkip].SUGGESTIONS_POSTER,
    });
  }

  let commenters = document.querySelectorAll('.wx076j-0 > .s1461iz-1');
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

var observeDOM = (function() {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  return function(obj, callback) {
    if (!obj || !obj.nodeType === 1) return; // validation

    if (MutationObserver) {
      // define a new observer
      var obs = new MutationObserver(function(mutations, observer) {
        if (mutations[0].addedNodes.length || mutations[0].removedNodes.length) callback(mutations[0]);
      });
      // have the observer observe foo for changes in children
      obs.observe(obj, { childList: true, subtree: true });
    } else if (window.addEventListener) {
      obj.addEventListener('DOMNodeInserted', callback, false);
      obj.addEventListener('DOMNodeRemoved', callback, false);
    }
  };
})();

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

sos.pageLoaded = false;

// let contentEl = document.querySelectorAll('.vz95qm-0.grqCvq')[1];
let contentEl = document.querySelectorAll('.sogqxs-0.dpKXTN')[1];
try {
  if (contentEl == null) {
    console.log('SOS: page loaded, no content found');
    chrome.runtime.sendMessage('pageLoaded');
    sos.pageLoaded = true;
  } else {
    if (contentEl.innerText.length > 0) {
      console.log('SOS: page loaded immediately');
      chrome.runtime.sendMessage('pageLoaded');
      sos.pageLoaded = true;
    } else {
      observeDOM(contentEl, function(m) {
        if (sos.pageLoaded) {
          return;
        }
        sos.pageLoaded = true;
        console.log('SOS: page loaded after observe');
        setTimeout(function() {
          chrome.runtime.sendMessage('pageLoaded');
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
