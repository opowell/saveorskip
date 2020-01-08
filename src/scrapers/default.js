var sos = {};

sos.priority = 1; // higher value, higher priority

sos.name = 'All other pages.';
sos.domain = ''; // match any url.

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

sos.getSourcesForUrl = function(url) {
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
  return sources;
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

sos.onScriptLoad = function() {
  sos.SUGGESTIONS_PER_SAVE = 2;

  sos.isParentUrl = function(url) {
    let curUrl = sos.buildUrl(window.location.href);
    if (curUrl.includes(url) && url !== curUrl) {
      return true;
    }
    return false;
  };
};

export default sos;
