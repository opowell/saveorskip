// @ts-nocheck
var sos = <any>{};

sos.name = 'The Guardian';
sos.domain = 'www.theguardian.com';

sos.getLinks = function() {
  let links = [];
  let linkEls = document.querySelectorAll('a[data-link-name="article"]');
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
  let linkEls = document.querySelectorAll('a[data-link-name="article"]');
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
  let sources: any[] = [];
  // eslint-disable-next-line prettier/prettier
  let selectorStrings = ['.submeta__link', '[rel="author"]', '.pillar-link--current-section'];
  for (let sel in selectorStrings) {
    let els = document.querySelectorAll(selectorStrings[sel]);
    for (let i = 0; i < els.length; i++) {
      let url = els[i].getAttribute('href');
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
  }
  return sources;
};

sos.getPageAttributes = function(page: any) {
  sos.title = document.title;
};

export default sos;
