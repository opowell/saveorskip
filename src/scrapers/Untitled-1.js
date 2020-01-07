let sos = {};

sos.getLinks = function() {
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
