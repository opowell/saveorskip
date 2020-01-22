var sos = {};

sos.priority = 0; // higher value, higher priority

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
    let alreadyInArray = false;
    for (let j in sources) {
      if (sources[j].url === url) {
        alreadyInArray = true;
        break;
      }
    }
    if (!alreadyInArray) {
      sources.push({
        url,
        points: 3,
      });
    }
  }
  return sources;
};

sos.onScriptLoad = function() {
  sos.isParentUrl = function(url) {
    let curUrl = sos.buildUrl(window.location.href);
    if (curUrl.includes(url) && url !== curUrl) {
      return true;
    }
    return false;
  };
};

sos.getPageAttributes = function(page) {
  sos.title = document.title;
};

export default sos;
