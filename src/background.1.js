import store from './store';
import Vue from 'vue';

global.browser = require('webextension-polyfill');

function removeLink() {
  let targetId = store.getters.curTarget.name;
  let url = store.state.curUrl;
  store.dispatch('removeLink', {
    link: url,
    targetId: targetId,
  });
}

/*
 * gotoNext - whether or not to move to a new page after saving.
 **/
function saveOrSkip(gotoNext, action) {
  let targetId = store.getters.curTarget.name;
  let url = store.state.curUrl;
  console.log(targetId + ' - ' + action + ' current link: ' + url);
  let actionPast = null;
  if (action === 'save') {
    actionPast = 'Saved';
  } else {
    actionPast = 'Skipped';
  }
  store.dispatch('saveOrSkipLink', {
    link: url,
    action: action,
    targetId: targetId,
  });
  console.log(targetId + ' - ' + actionPast + ' link: ' + JSON.stringify(url));

  let cb = null;
  if (gotoNext === true) {
    cb = showNextPage;
  }

  saveSourcesOfUrl(url, cb, action);
}

// Save a list of sources to storage.
function saveSources(sourcesToSave, callback) {
  if (sourcesToSave == null) return;

  console.log('SAVING suggested sources:\n' + arrJoin(sourcesToSave));

  store.dispatch('addSources', {
    sources: sourcesToSave,
    targetId: store.getters.curTarget.name,
  });

  if (callback != null) {
    callback();
  }
}

// Save sources from open pages that link to this item.
function saveSourcesOfUrl(url, cb, action) {
  console.log(action + ' sources of ' + url);
  chrome.tabs.query({ active: false }, function(tabs) {
    for (let i = 0; i < tabs.length; i++) {
      let otherTab = tabs[i];
      chrome.tabs.sendMessage(otherTab.id, { action: 'scrapeSourcesOfUrl', url: url, saveOrSkip: action }, function(response) {
        if (response == null || response.sources == null) {
          console.log(otherTab.url + ' returned no sources of ' + url);
          return;
        }

        for (let j = 0; j < response.sources.length; j++) {
          if (response.sources[j] == store.state.sourceForCurUrl) {
            response.sources.splice(j, 1);
          }
        }
        saveSources(response.sources);
      });
    }
    // Check tab itself for sources.
    console.log('scraping own sources from tabId=' + store.state.activeTabId);
    chrome.tabs.sendMessage(store.state.activeTabId, { action: 'scrapeOwnSources', saveOrSkip: action }, function(response) {
      if (response != null) {
        for (let j = 0; j < response.sources.length; j++) {
          if (response.sources[j] == store.state.sourceForCurUrl) {
            response.sources.splice(j, 1);
          }
        }
        saveSources(response.sources, cb);
      } else {
        if (cb != null) {
          cb();
        }
      }
    });
  });
}

// Selects a random source, with prob. of selecting source i proportional to source i's points.
function showNextPage() {
  // If next suggestion already exists, use it and find a new one.
  console.log('show next link');
  if (store.state.nextSuggestion != null) {
    console.log('next suggestion exists');
    changeActiveTabToUrl(store.state.nextSuggestion);
    store.dispatch('setCurSuggestion', {
      url: store.state.nextSuggestion,
    });
    store.dispatch('setNextSuggestion', {
      url: null,
    });
    store.dispatch('setNeedCurSuggestion', {
      value: false,
    });
  } else {
    console.log('no next suggestion');
    store.dispatch('setNeedCurSuggestion', {
      value: true,
    });
  }
  loadNextSuggestion();
}

function loadNextSuggestion() {
  console.log('Loading next link');
  let sources = store.getters.curTarget.sources;
  if (sources == null) {
    console.log('no sources found');
    return;
  }
  let source = drawRandomElFromObject(sources, scoreFn);

  if (source == null) {
    console.log('error loading suggestion: no source found');
  }

  console.log('DRAWING SUGGESTION from ' + source.url);
  store.dispatch('setSourceForCurUrl', {
    url: trimmedUrl(source.url),
  });
  // If too early to scrape, proceed without scraping.
  let now = new Date();
  console.log('comparing now to next scrape date: ' + now + ' vs. ' + source.nextScrape);
  if (new Date(source.nextScrape) > now) {
    console.log('drawing item from previously scraped links: ' + source.url);
    getSavedItemsCB();
  }
  // Otherwise, open the page and scrape it.
  else {
    console.log('scraping items from ' + source.url);
    let newURL = 'http://' + trimmedUrl(source.url);
    store.dispatch('setCurUrl', {
      url: trimmedUrl(newURL),
    });
    openUrl(newURL);
  }
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  // console.log('saw onActivate event: ' + JSON.stringify(activeInfo));
  store.dispatch('setActiveTabId', {
    tabId: activeInfo.tabId,
  });
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    store.dispatch('setCurUrl', {
      url: tab.url,
    });
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // console.log('saw onUpdated event: ' + tabId + ', ' + JSON.stringify(changeInfo) + ', ' + JSON.stringify(tab));
  if (tabId === store.activeTabId && changeInfo.url != null) {
    // console.log('processing');
    store.dispatch('setCurUrl', {
      url: changeInfo.url,
    });
  }
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('message received from ' + trimmedUrl(sender.url) + ': ' + request);

  let action = request;
  if (request.action != null) {
    action = request.action;
  }

  switch (action) {
    case 'storeDispatch':
      store.dispatch(request.storeAction, request.storePayload);
      break;
    case 'showNextPage':
      showNextPage();
      break;
    case 'pageLoaded':
      if (sender.tab.id !== store.state.curSuggestionTabId) {
        console.log('not current suggestion tab: ' + store.state.curSuggestionTab);
        chrome.tabs.query({ active: true }, function(tabs) {
          if (trimmedUrl(tabs[0].url) === trimmedUrl(sender.tab.url)) {
            store.dispatch('setCurUrl', {
              url: sender.tab.url,
            });
            store.dispatch('setActiveTabId', {
              tabId: sender.tab.id,
            });
          }
        });
      } else {
        saveAsSource(sender.tab);
      }
      break;
    case 'saveAndGo':
      saveOrSkip(true, 'save');
      break;
    case 'skipAndGo':
      saveOrSkip(true, 'skip');
      break;
    case 'save':
      saveOrSkip(false, 'save');
      break;
    case 'skip':
      saveOrSkip(false, 'skip');
      break;
    case 'go':
      showNextPage();
      break;
    case 'removeLink':
      removeLink();
      break;
    case 'saveAsSource':
      break;
  }
});

// Save current tab as a source.
function saveAsSource(tab) {
  store.dispatch('setCurSavedItemsTab', {
    url: tab.url,
  });

  let sources = store.getters.curTarget.sources;

  let sourceName = trimmedUrl(tab.url);
  if (sources[sourceName] == null) {
    Vue.set(sources, sourceName, Source(sourceName));
    sources[sourceName].points += 2;
  }
  let source = sources[sourceName];
  source.lastScraped = new Date().toJSON();

  // Set earliest time of next scrape.
  let now = new Date().getTime();
  console.log('current time: ' + new Date(now).toJSON());
  source.nextScrape = new Date(now + store.state.scrapeDelayMS).toJSON();
  console.log(source.url + ': next scrape not before ' + source.nextScrape);
  chrome.tabs.sendMessage(tab.id, { action: 'getSavedItems' }, getSavedItemsCB);
}

function getSavedItemsCB(items) {
  if (items == null) {
    items = [];
  }
  console.log('received ' + items.length + ' new suggestions from/for ' + store.state.sourceForCurUrl + ':\n' + items.join('\n'));

  let sources = store.getters.curTarget.sources;
  let targetLinks = store.getters.curTarget.links;

  let sourceName = trimmedUrl(store.state.sourceForCurUrl);
  if (sources[sourceName] == null) {
    Vue.set(sources, sourceName, Source(sourceName));
    sources[sourceName].points += 2;
  }
  let source = sources[sourceName];
  if (source.scrapedLinks == null) {
    source.scrapedLinks = [];
  }

  // Assumes newest links are at the front of the array. Start with oldest links first.
  for (let i = items.length - 1; i >= 0; i--) {
    let item = items[i];
    let link = item;
    if (typeof item === 'object') {
      link = item.link;
    }
    if (!source.scrapedLinks.includes(link) && !alreadyViewed(targetLinks, link)) {
      source.scrapedLinks.unshift(item);
    }
  }

  let updated = false;
  for (let i = 0; i < source.scrapedLinks.length; i++) {
    let item = trimmedUrl(source.scrapedLinks[i]);
    console.log('checking sug. item: ' + item);
    if (store.state.curSuggestion != item && !alreadyViewed(targetLinks, item)) {
      console.log('found new link: ' + item);
      if (store.state.needCurSuggestion) {
        console.log('saving cur suggestion as ' + item);
        changeActiveTabToUrl(item);
        store.dispatch('setSourceForCurUrl', {
          url: sourceName,
        });
        store.dispatch('setNeedCurSuggestion', {
          value: false,
        });
        loadNextSuggestion();
      } else {
        console.log('saving next suggestion as ' + item);
        store.dispatch('setNextSuggestion', {
          url: item,
        });
      }
      updated = true;
      break;
    } else {
      source.scrapedLinks.splice(i, 1);
      i--;
    }
  }
  // Try again.
  if (!updated) {
    console.log('no update found, trying again');
    showNextPage();
  }
}

function drawRandomElFromObject(object, scoreFn) {
  let sum = 0;
  console.log('DRAWING RANDOM ELEMENT');
  let keys = Object.keys(object);
  let scores = [];
  for (let i = 0; i < keys.length; i++) {
    let score = scoreFn(object[keys[i]]);
    scores.push(score);
    if (score > 0) {
      sum = sum + score;
    }
  }

  if (sum === 0) {
    console.log('Error drawing item from list: no item with any points');
    return;
  }

  let selected = null;
  let selectedInd = -1;

  let draw = Math.random() * sum; // random number between 0 (incl.) and sum (excl.)
  let curSum = 0;
  for (let j = 0; j < keys.length; j++) {
    let score = scores[j];
    if (score > 0) {
      curSum = curSum + score;
      if (curSum > draw && selectedInd === -1) {
        selected = object[[keys[j]]];
        selectedInd = j;
        break;
      }
    }
  }

  for (let k = 0; k < keys.length; k++) {
    let score = scores[k];
    let selText = '  ';
    if (k === selectedInd) {
      selText = '>>';
    }
    let obj = object[keys[k]];
    try {
      console.log(selText + ' ' + score + ' - ' + obj.points + ' - ' + obj.scrapedLinks.length + ' - ' + obj.nextScrape + ' - ' + obj.url);
    } catch (err) {
      console.error('ERROR');
    }
  }

  return selected;
}

function scoreFnHot(src) {
  if (src.points < 1) {
    return 0;
  }

  let now = new Date();
  if (src.nextScrape != null && src.scrapedLinks != null && new Date(src.nextScrape) > now && src.scrapedLinks.length == 0) {
    return 0;
  }

  return src.points / Math.pow((new Date() - new Date(src.lastSaved)) / (1000 * 60 * 60) + 2, 2);
}

function scoreFnJustPoints(src) {
  if (src.points < 1) {
    return 0;
  }

  let now = new Date();
  if (src.nextScrape != null && src.scrapedLinks != null && new Date(src.nextScrape) > now && src.scrapedLinks.length == 0) {
    return 0;
  }

  return src.points;
}

// Whether or not the url is contained in the list.
function alreadyViewed(links, url) {
  for (let i = 0; i < links.length; i++) {
    let link = links[i];
    if (typeof link === 'object') {
      link = link.url;
    }
    if (trimmedUrl(link) === trimmedUrl(url)) {
      return true;
    }
  }
  return false;
}

function arrJoin(arr, separator) {
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    out.push(JSON.stringify(arr[i]));
  }
  return out.join(separator || '\n');
}

// Sorted alphabetically in storage.
function Source(url) {
  return {
    firstSaved: new Date().toJSON(),
    lastSaved: new Date().toJSON(),
    lastScraped: null,
    nextScrape: new Date().toJSON(),
    points: 0,
    scrapedLinks: [],
    url: url,
  };
}

// Open URL and get suggestion from it.
function openUrl(newURL) {
  console.log('creating new tab: ' + newURL);
  chrome.tabs.create({ url: newURL, active: false }, function(tab) {
    console.log('tab created: ' + newURL);
    store.dispatch('setCurSuggestionTabId', {
      tabId: tab.id,
    });
  });
}

function changeActiveTabToUrl(newURL) {
  console.log('changing active tab (' + store.state.activeTabId + ') to ' + newURL);
  chrome.tabs.get(store.state.activeTabId, function(activeTab) {
    if (activeTab == null) {
      console.log('no active tab, aborting');
      return;
    }
    store.dispatch('setCurSuggestion', {
      url: trimmedUrl(newURL),
    });
    chrome.tabs.update(activeTab.id, { url: 'http://' + store.state.curSuggestion });
  });
}

function trimmedUrl(url) {
  if (url == null) {
    debugger;
    console.log('error trying to trim url');
  }

  if (url.includes == null) {
    debugger;
    console.log('error trying to trim url, url.includes is not defined');
  }

  if (url.includes('://')) {
    url = url.substring(url.indexOf('://') + '://'.length);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }

  return url;
}

// SETTINGS
let scoreFn = scoreFnJustPoints;
