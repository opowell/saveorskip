var sos = {};

sos.name = 'Hacker News';
sos.domain = 'news.ycombinator.com'; // match any url.

sos.getLinks = function() {
  let links = [];
  let linkEls = document.querySelectorAll('.storyLink');
  for (let i = 0; i < linkEls.length; i++) {
    let url = linkEls[i].getAttribute('href');
    url = sos.buildUrl(url);
    if (!links.includes(url)) {
      links.push({
        url,
        title: linkEls[i].innerText,
      });
    }
  }
  return links;
};

sos.getSourcesForUrl = function(targetUrl) {
  let sources = [];
  let linkEls = document.querySelectorAll('a');
  for (let i = 0; i < linkEls.length; i++) {
    let linkUrl = linkEls[i].getAttribute('href');
    linkUrl = sos.buildUrl(linkUrl);
    console.log('compare ' + targetUrl + ' vs. ' + linkUrl);
    if (targetUrl === linkUrl) {
      sources.push({
        linkId: targetUrl,
        source: {
          id: sos.trimmedUrl(location.href),
          points: 1,
        },
      });
      break;
    }
  }
  return sources;
};

sos.getSources = function() {
  let sources = [];
  let userEls = document.querySelectorAll('.hnuser');
  for (let i = 0; i < userEls; i++) {
    let url = userEls.getAttribute('href');
    url = sos.buildUrl(url);
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

sos.getPageAttributes = function(page) {
  sos.title = document.title;
};

export default sos;
