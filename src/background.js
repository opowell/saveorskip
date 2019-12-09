import store from './store';
import Vue from 'vue';
import * as idb from './store/idb.js';

global.browser = require('webextension-polyfill');

/*
 * gotoNext - whether or not to move to a new page after saving.
 **/
function saveOrSkip(gotoNext, action) {
  // idb.saveOrSkipLink({
  //   link: store.state.curLink,
  //   action: action,
  //   targetId: store.state.targetId,
  // });
  let cb = null;
  if (gotoNext === true) {
    cb = showNextPage;
  }
  saveSourcesOfUrl(store.state.curLink.url, cb, action);
}

// function saveOrSkipLink(gotoNext, action, link) {
//   idb.saveOrSkipLink({
//     link: link,
//     action: action,
//     targetId: store.state.targetId,
//   });
//   let cb = null;
//   if (gotoNext === true) {
//     cb = showNextPage;
//   }
//   saveSourcesOfUrl(link.url, cb, action);
// }

// Save a list of sources to storage.
function saveSources(sourcesToSave, callback) {
  if (sourcesToSave == null) return;
  storeDispatch('addSources', {
    sources: sourcesToSave,
    targetId: store.state.targetId,
  });
  if (callback != null) {
    callback();
  }
}

// function saveSourcesOfTab(tab) {
//   let action = 'save';
//   console.log(action + ' sources of ' + tab.url);

//   // Save sources from open pages that link to this item.
//   chrome.tabs.query({}, function(tabs) {
//     for (let i = 0; i < tabs.length; i++) {
//       if (tabs[i].id === tab.id) {
//         // Check tab itself for sources.
//         console.log('scraping own sources from tabId=' + store.state.activeTabId);
//         chrome.tabs.sendMessage(tab.id, { action: 'getSources', saveOrSkip: action }, function(response) {
//           if (response != null) {
//             for (let j = 0; j < response.sources.length; j++) {
//               if (response.sources[j].url === store.state.sourceForCurUrl) {
//                 response.sources.splice(j, 1);
//               }
//             }
//             saveSources(response.sources);
//           }
//         });
//       }
//       let otherTab = tabs[i];
//       chrome.tabs.sendMessage(otherTab.id, { action: 'getUrlSources', url: tab.url, saveOrSkip: action }, function(response) {
//         if (response == null || response.sources == null) {
//           console.log(otherTab.url + ' returned no sources of ' + tab.url);
//           return;
//         }

//         for (let j = 0; j < response.sources.length; j++) {
//           if (response.sources[j] == store.state.sourceForCurUrl) {
//             response.sources.splice(j, 1);
//           }
//         }
//         saveSources(response.sources);
//       });
//     }
//   });
// }

function saveSourcesOfUrl(url, cb, action) {
  console.log(action + ' sources of ' + url);

  // Save sources from open pages that link to this item.
  chrome.tabs.query({}, function(tabs) {
    for (let i = 0; i < tabs.length; i++) {
      let tab = tabs[i];
      if (trimmedUrl(tab.url) === trimmedUrl(url)) {
        // Check tab itself for sources.
        console.log('scraping own sources from tabId=' + tab.id);
        chrome.tabs.sendMessage(tab.id, { action: 'getSources', saveOrSkip: action }, function(response) {
          if (response != null) {
            for (let j = 0; j < response.sources.length; j++) {
              if (response.sources[j].url === store.state.sourceForCurUrl) {
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
      } else {
        let otherTab = tabs[i];
        chrome.tabs.sendMessage(otherTab.id, { action: 'getUrlSources', url: url, saveOrSkip: action }, function(response) {
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
    }
  });
}

// Selects a random source, with prob. of selecting source i proportional to source i's points.
function showNextPage() {
  // If next suggestion already exists, use it and find a new one.
  console.log('show next link');
  if (store.state.nextSuggestion != null) {
    console.log('next suggestion exists');
    changeActiveTabToUrl(store.state.nextSuggestion);
    storeDispatch('setCurSuggestion', {
      url: store.state.nextSuggestion,
    });
    storeDispatch('setNextSuggestion', {
      url: null,
    });
    storeDispatch('setNeedCurSuggestion', {
      value: false,
    });
  } else {
    console.log('no next suggestion');
    storeDispatch('setNeedCurSuggestion', {
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
  storeDispatch('setSourceForCurUrl', {
    url: trimmedUrl(source.url),
  });
  // If too early to scrape, proceed without scraping.
  let now = new Date();
  console.log('comparing now to next scrape date: ' + now + ' vs. ' + source.nextScrape);
  if (new Date(source.nextScrape) > now) {
    console.log('drawing item from previously scraped links: ' + source.url);
    getLinksCB();
  }
  // Otherwise, open the page and scrape it.
  else {
    console.log('scraping items from ' + source.url);
    let newURL = 'http://' + trimmedUrl(source.url);
    storeDispatch('setCurUrl', {
      url: trimmedUrl(newURL),
    });
    openUrl(newURL, true);
  }
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  store.dispatch('setActiveTabId', {
    tabId: activeInfo.tabId,
  });
  chrome.tabs.get(activeInfo.tabId, function(tab) {
    storeDispatch('setCurUrl', {
      url: tab.url,
      title: tab.title,
    });
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tabId === store.activeTabId && changeInfo.url != null) {
    storeDispatch('setCurUrl', {
      url: changeInfo.url,
      title: tab.title,
    });
  }
});

// Mutate store, and inform other pages of mutation.
let storeDispatch = function(action, payload) {
  store.dispatch(action, payload);
  // chrome.runtime.sendMessage({
  //   action: 'storeDispatch',
  //   storeAction: action,
  //   storePayload: payload,
  // });
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('message received from ' + trimmedUrl(sender.url) + ': ' + JSON.stringify(request));

  let action = request;
  if (request.action != null) {
    action = request.action;
  }

  switch (action) {
    // case 'openAndScrape':
    //   let url = request.url;
    //   storeDispatch('setUrlToScrape', url);
    //   saveOrSkipLink(
    //     {
    //       url: request.url,
    //       title: sender.title,
    //     },
    //     false
    //   );
    //   break;
    case 'storeDispatch':
      storeDispatch(request.storeAction, request.storePayload);
      break;
    case 'showNextPage':
      showNextPage();
      break;
    case 'pageLoaded':
      if (sender.tab.url === store.state.urlToScrape) {
        saveSourcesOfUrl(sender.tab.url);
      } else if (sender.tab.id !== store.state.curSuggestionTabId) {
        console.log('not current suggestion tab: ' + store.state.curSuggestionTab);
        chrome.tabs.query({ active: true }, function(tabs) {
          if (trimmedUrl(tabs[0].url) === trimmedUrl(sender.tab.url)) {
            storeDispatch('setCurUrl', {
              url: sender.tab.url,
            });
            storeDispatch('setActiveTabId', {
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
    case 'saveAsSource':
      break;
  }
});

// Save current tab as a source.
function saveAsSource(tab) {
  let sources = store.getters.curTarget.sources;
  let sourceName = trimmedUrl(tab.url);
  let source = sources[sourceName];
  if (source == null) {
    debugger;
    return;
    // storeDispatch('addSources', [
    //   {
    //     url: trimmedUrl(tab.url),
    //     points: 2,
    //     saved: false,
    //   },
    // ]);
  }
  source.lastScraped = new Date().toJSON();

  // Set earliest time of next scrape.
  let now = new Date().getTime();
  console.log('current time: ' + new Date(now).toJSON());
  source.nextScrape = new Date(now + store.state.scrapeDelayMS).toJSON();
  console.log(source.url + ': next scrape not before ' + source.nextScrape);
  chrome.tabs.sendMessage(tab.id, { action: 'getLinks' }, getLinksCB);
}

function getLinksCB(links) {
  if (links == null) {
    links = [];
  }
  console.log('received ' + links.length + ' new suggestions from/for ' + store.state.sourceForCurUrl + ':\n' + joinArray(links));

  let sources = store.getters.curTarget.sources;
  let targetLinks = store.getters.curTarget.links;

  let sourceName = trimmedUrl(store.state.sourceForCurUrl);
  let source = sources[sourceName];

  // Store new links on the source.
  // Newest links are at the front of the array. Start with oldest links first.
  for (let i = links.length - 1; i >= 0; i--) {
    let link = links[i];
    // If the given link is not already on the source, add it (to the start) of the list.
    if (!arrayContainsLink(source.scrapedLinks, link) && !objContainsLink(targetLinks, link)) {
      source.scrapedLinks.unshift(link);
    }
  }

  let updated = false;
  for (let i = 0; i < source.scrapedLinks.length; i++) {
    let link = source.scrapedLinks[i];
    console.log('checking sug. link: ' + link.url);
    if (store.state.curSuggestion !== link.url && !objContainsLink(targetLinks, link)) {
      console.log('found new link: ' + link.url);
      if (store.state.needCurSuggestion) {
        console.log('saving cur suggestion as ' + link.url);
        changeActiveTabToUrl(link.url);
        storeDispatch('setSourceForCurUrl', {
          url: sourceName,
        });
        storeDispatch('setNeedCurSuggestion', {
          value: false,
        });
        loadNextSuggestion();
      } else {
        console.log('saving next suggestion as ' + link.url);
        storeDispatch('setNextSuggestion', {
          url: link.url,
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

// Whether or not an array of links contains a particular link
function arrayContainsLink(array, linkToFind) {
  let urlToFind = trimmedUrl(linkToFind.url);
  for (let i = 0; i < array.length; i++) {
    let link = array[i];
    if (typeof link === 'object') {
      link = link.url;
    }
    if (trimmedUrl(link) === urlToFind) {
      return true;
    }
  }
  return false;
}

// Whether or not an object of links contains a particular link.
function objContainsLink(links, linkToFind) {
  let urlToFind = trimmedUrl(linkToFind.url);
  return links[urlToFind] != null;
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
function openUrl(newURL, getSuggestion) {
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

function joinArray(array) {
  let out = '';
  for (let i = 0; i < array.length; i++) {
    out += JSON.stringify(array[i]) + '\n';
  }
  return out;
}
// SETTINGS
let scoreFn = scoreFnJustPoints;
