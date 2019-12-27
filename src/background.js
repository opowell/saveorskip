import store from './store';
import * as idb from './store/idb.js';
import * as types from './store/mutation-types.js';
import { trimmedUrl, joinArray } from './Utils.js';

global.browser = require('webextension-polyfill');

/*
 * gotoNext - whether or not to move to a new page after saving.
 **/
async function saveOrSkip(gotoNext, action) {
  console.log('background: saveOrSkip ' + JSON.stringify(action));
  store.state.curLink.profileId = store.state.targetId;
  store.state.curLink.saved = action === 'save';
  // await idb.saveLink(store.state.curLink);
  // let cb = null;
  if (gotoNext === true) {
    // cb = showNextPage;
    showNextPage();
  }
  // saveSourcesOfUrl(store.state.curLink.url, cb, action);
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
  for (let i in sourcesToSave) {
    sourcesToSave[i].profileId = store.state.targetId;
  }
  idb.addSources({
    sources: sourcesToSave,
    // targetId: store.state.targetId,
  });
  try {
    callback();
  } catch (err) {
    console.log('callback is not a function.');
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
              try {
                cb();
              } catch (err) {
                console.log('Scraping sources: Error evaluating callback.');
              }
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
            if (response.sources[j] === store.state.sourceForCurUrl) {
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
function showNextPage(profileId) {
  // If next suggestion already exists, use it and find a new one.
  console.log('show next link');
  if (store.state.nextSuggestion != null) {
    console.log('next suggestion exists');
    changeActiveTabToUrl(store.state.nextSuggestion);
    store.commit(types.SET_CUR_SUGGESTION, {
      url: store.state.nextSuggestion,
    });
    store.commit(types.SET_NEXT_SUGGESTION, {
      url: null,
    });
    store.commit(types.SET_NEED_CUR_SUGGESTION, {
      value: false,
    });
  } else {
    console.log('no next suggestion');
    store.commit(types.SET_NEED_CUR_SUGGESTION, {
      value: true,
    });
  }
  loadNextSuggestion(profileId);
}

function scrapeIfNecessary(source) {
  let now = new Date();
  console.log('comparing now to next scrape date: ' + now + ' vs. ' + source.nextScrape);
  if (new Date(source.nextScrape) < now) {
    console.log('scraping items from ' + source.url);
    scrapeSource(source.url);
  }
}

async function loadNextSuggestion(profileId) {
  console.log('Loading next link');
  let sources = await idb.getProfileSources(profileId);
  if (sources == null) {
    console.log('no sources found');
    return;
  }

  while (true) {
    let source = drawRandomElFromObject(sources, scoreFn);
    if (source == null) {
      console.log('error loading suggestion: no source found');
      return;
    }
    scrapeIfNecessary(source);

    console.log('DRAWING SUGGESTION from ' + source.url);
    store.commit(types.SET_SOURCE_FOR_CUR_URL, {
      url: trimmedUrl(source.url),
    });
    let linksCursor = await idb.getProfileSourceLinksByTimeScraped(profileId, source.url);
    let nextUrl = null;
    while (nextUrl === null) {
      // Check if current link already exists on profile.
      let storeLink = await idb.getProfileLink({
        profileId,
        linkId: linksCursor.value.url,
      });
      let alreadyExists = storeLink != null;
      if (!alreadyExists) {
        nextUrl = linksCursor.value.url;
      } else {
        try {
          await idb.deleteProfileSourceLink({
            profileId,
            sourceId: source.url,
            linkId: linksCursor.value.url,
          });
          await linksCursor.continue();
        } catch (err) {
          nextUrl = null;
        }
      }
    }

    if (nextUrl !== null) {
      changeActiveTabToUrl(linksCursor.value.url);
      return;
    }
  }
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  console.log('tab activated: ' + JSON.stringify(activeInfo));
  store.commit(types.SET_ACTIVE_TAB_ID, {
    tabId: activeInfo.tabId,
  });
  chrome.tabs.sendMessage(activeInfo.tabId, { action: 'getLink' }, getLinkCB);
  // chrome.tabs.get(activeInfo.tabId, function(tab) {
  // store.commit(types.SET_CUR_URL, {
  //   url: tab.url,
  //   title: tab.title,
  // });
  // idb.setCurUrlLinkStatus();
  // idb.setCurUrlSourceStatus();
  // });
});

chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  if (tabId === store.state.activeTabId) {
    chrome.tabs.sendMessage(tab.id, { action: 'getLink' }, getLinkCB);
  }
  // if (tabId === store.state.activeTabId && tab.url != null) {
  //   store.commit(types.SET_CUR_URL, {
  //     url: tab.url,
  //     title: tab.title,
  //   });
  //   await idb.setSkippedIfNew(store.state.targetId, {url: tab.url, title: tab.title});
  //   await idb.setCurUrlLinkStatus();
  //   await idb.setCurUrlSourceStatus();
  // }
});

async function getLinkCB(link) {
  await idb.setCurLink(link);
  await idb.setSkippedLinkIfNew(store.state.targetId, link);
  await idb.setSkippedSourceIfNew(store.state.targetId, link);
  await idb.setCurUrlLinkStatus();
  await idb.setCurUrlSourceStatus();
}

chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
  console.log('message received from ' + trimmedUrl(sender.url) + ': ' + JSON.stringify(message));

  let action = message;
  if (message.action != null) {
    action = message.action;
  }

  switch (action) {
    case 'saveSourcesOfUrl':
      store.commit(types.SET_URL_TO_SCRAPE, message.url);
      saveSourcesOfUrl(message.url, null, 'save');
      break;
    // case 'openAndScrape':
    //   let url = request.url;
    //   storeDispatch('setUrlToScrape', url);
    //   saveOrSkip(
    //     {
    //       url: request.url,
    //       title: sender.title,
    //     },
    //     false
    //   );
    //   break;
    case 'showNextPage':
      showNextPage();
      break;
    case 'pageLoaded':
      let tUrl = trimmedUrl(sender.tab.url);
      if (tUrl === store.state.urlToScrape) {
        saveSourcesOfUrl(sender.tab.url, null, 'save');
      } else if (tUrl === store.state.sourceToScrape) {
        saveAsSource(sender.tab);
      } else if (sender.tab.id !== store.state.curSuggestionTabId) {
        if (sender.tab.active) {
          // store.commit(types.SET_CUR_URL, {
          //   url: sender.tab.url,
          // });
          store.commit(types.SET_ACTIVE_TAB_ID, {
            tabId: sender.tab.id,
          });
          console.log('sender.tab.url: ' + sender.tab.url);
          console.log('message.link.url: ' + message.link.url);
          await idb.setCurLink(message.link);
          await idb.setSkippedLinkIfNew(store.state.targetId, message.link);
          await idb.setSkippedSourceIfNew(store.state.targetId, message.link);
          await idb.setCurUrlLinkStatus();
          await idb.setCurUrlSourceStatus();
        }
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
      showNextPage(message.profileId);
      break;
    case 'saveAsSource':
      break;
    case 'scrapeSource':
      scrapeSource(message.url);
      break;
  }
});

function scrapeSource(url) {
  store.commit(types.SET_SOURCE_TO_SCRAPE, url);
  chrome.tabs.create({ url: 'http://' + url, active: false });
}

// Save current tab as a source.
function saveAsSource(tab) {
  chrome.tabs.sendMessage(tab.id, { action: 'getLinks' }, getLinksCB);
}

async function getLinksCB(links) {
  if (links == null) {
    links = [];
  }
  console.log('received ' + links.length + ' new suggestions from/for ' + store.state.sourceToScrape + ':\n' + joinArray(links));

  for (let i in links) {
    let link = links[i];
    link.url = trimmedUrl(link.url);
    link.timeScraped = new Date();
    link.profileId = store.state.targetId;
    link.sourceId = store.state.sourceToScrape;
    idb.addProfileSourceLink(link);
  }
}

function drawRandomElFromObject(object, scoreFn) {
  let sum = 0;
  console.log('DRAWING RANDOM ELEMENT');
  let keys = Object.keys(object);
  let scores = [];
  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    let score = scoreFn(object[key]);
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
      console.log(selText + ' ' + score + ' - ' + obj.points + ' - ' + obj.nextScrape + ' - ' + obj.url);
    } catch (err) {
      console.error('ERROR');
    }
  }

  return selected;
}

// eslint-disable-next-line no-unused-vars
function scoreFnHot(src) {
  if (src.points < 1) {
    return 0;
  }

  let now = new Date();
  if (src.nextScrape != null && src.scrapedLinks != null && new Date(src.nextScrape) > now && src.scrapedLinks.length === 0) {
    return 0;
  }

  return src.points / Math.pow((new Date() - new Date(src.lastSaved)) / (1000 * 60 * 60) + 2, 2);
}

function scoreFnJustPoints(src) {
  let p = src.points - 0;
  if (p < 1) {
    return 0;
  }

  // TODO: If source is not due to be scraped, and has no scraped links, return 0.
  // let now = new Date();
  // // eslint-disable-next-line prettier/prettier
  // if (src.nextScrape != null && src.scrapedLinks != null && new Date(src.nextScrape) > now && src.scrapedLinks.length === 0) {
  //   return 0;
  // }

  return p;
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
// function Source(url) {
//   return {
//     firstSaved: new Date().toJSON(),
//     lastSaved: new Date().toJSON(),
//     lastScraped: null,
//     nextScrape: new Date().toJSON(),
//     points: 0,
//     scrapedLinks: [],
//     url: url,
//   };
// }

// Open URL and get suggestion from it.
function openUrl(newURL, getSuggestion) {
  console.log('creating new tab: ' + newURL);
  chrome.tabs.create({ url: newURL, active: false }, function(tab) {
    console.log('tab created: ' + newURL);
    store.commit(types.SET_CUR_SUGGESTION_TAB_ID, {
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
    store.commit(types.SET_CUR_SUGGESTION, {
      url: trimmedUrl(newURL),
    });
    chrome.tabs.update(activeTab.id, { url: 'http://' + store.state.curSuggestion });
  });
}

// SETTINGS
let scoreFn = scoreFnJustPoints;

// // Load scrapers
// import ScraperReddit from './scrapers/reddit.js';

// let reddit = {};
