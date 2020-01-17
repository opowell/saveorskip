import store from './store';
import * as idb from './store/idb.js';
import * as types from './store/mutation-types.js';
import { trimmedUrl, joinArray, drawRandomElFromObject, scoreFnJustPoints } from './Utils.js';

global.browser = require('webextension-polyfill');

/*
 * gotoNext - whether or not to move to a new page after saving.
 **/
async function saveOrSkip(gotoNext, action) {
  console.log('background: saveOrSkip ' + JSON.stringify(action));
  store.state.curPage.profileId = store.state.targetId;
  store.state.curPage.saved = action === 'save';
  // await idb.saveLink(store.state.curPage);
  // let cb = null;
  if (gotoNext === true) {
    // cb = showNextPage;
    showNextPage();
  }
  // saveSourcesOfUrl(store.state.curPage.url, cb, action);
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
    sourcesToSave[i].consumerId = store.state.targetId;
    sourcesToSave[i].autoGenerated = true;
  }
  idb.addSources({
    sources: sourcesToSave,
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
  if (source.nextScrape == null || new Date(source.nextScrape) < now) {
    scrapeProfile(source.providerId);
  }
}

async function loadNextSuggestion(profileId) {
  try {
    console.log('Loading next link');
    let sources = await idb.getProfileSources(profileId);
    if (sources == null) {
      console.log('no sources found');
      return;
    }

    while (true) {
      let [source, index] = drawRandomElFromObject(sources, scoreFn);
      if (source == null) {
        console.log('error loading suggestion: no source found');
        return;
      }
      scrapeIfNecessary(source);

      console.log('DRAWING SUGGESTION from ' + source.url);
      await idb.dispatchToStores('setSourceForCurUrl', trimmedUrl(source.url));
      let linksCursor = await idb.getLinksByTimeAdded(profileId);
      if (linksCursor == null) {
        console.log('no links, skipping ' + source.url);
        sources.splice(index, 1);
        continue;
      }
      let nextUrl = null;
      while (nextUrl === null) {
        // Check if current link already exists on profile.
        let storeLink = await idb.getLink({
          profileId,
          linkId: linksCursor.value.url,
        });
        let alreadyExists = storeLink != null;
        if (!alreadyExists) {
          nextUrl = linksCursor.value.url;
        } else {
          try {
            await idb.deleteLink({
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
  } catch (err) {
    console.log(err);
  }
}

chrome.tabs.onActivated.addListener(function(activeInfo) {
  console.log('tab activated: ' + JSON.stringify(activeInfo));
  store.commit(types.SET_ACTIVE_TAB_ID, {
    tabId: activeInfo.tabId,
  });
  chrome.tabs.sendMessage(activeInfo.tabId, { action: 'getPage' }, getPageCB);
});

chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  if (tabId === store.state.activeTabId) {
    chrome.tabs.sendMessage(tab.id, { action: 'getPage' }, getPageCB);
  }
});

async function getPageCB(page) {
  doGetPage('', { page });
}

async function doGetPage(senderUrl, message) {
  await idb.setCurPage(message.page);
  if (senderUrl === store.state.testPageUrl) {
    idb.dispatchToStores('setTestPage', { page: message.page });
  }
  await storePage(message.page, senderUrl, store.state.popup.profile.defaultLinkAction, store.state.popup.profile.defaultSourceAction);
}

chrome.runtime.onMessage.addListener(async function(message, sender, sendResponse) {
  let senderUrl = trimmedUrl(sender.url);
  console.log('message received from ' + senderUrl, message);

  let action = message;
  if (message.action != null) {
    action = message.action;
  }

  switch (action) {
    case 'testPage':
      idb.dispatchToStores('setTestPageUrl', {
        url: message.url,
      });
      chrome.tabs.create({ url: 'http://' + message.url, active: false });
      break;
    case 'storeDispatch':
      idb.dispatchToStores(message.storeAction, message.storePayload);
      break;
    case 'saveSourcesOfUrl':
      store.commit(types.SET_URL_TO_SCRAPE, message.url);
      saveSourcesOfUrl(message.url, null, 'save');
      break;
    case 'getPage':
      doGetPage(senderUrl, message);
      break;
    case 'pageLoaded':
      let closeWhenDone = false;
      if (senderUrl === store.state.testPageUrl) {
        closeWhenDone = true;
      }
      let scraper = getScraper(senderUrl);
      sendResponse({
        scraper,
        closeWhenDone,
      });
      break;
    case 'scrapeProfile':
      scrapeProfile(message.url);
      break;
    // NOT SURE NEEDED
    case 'showNextPage':
      showNextPage();
      break;
    // let tUrl = trimmedUrl(sender.tab.url);
    // if (tUrl === store.state.urlToScrape) {
    //   saveSourcesOfUrl(tUrl, null, 'save');
    // } else if (tUrl === store.state.sourceToScrape) {
    //   saveAsSource(sender.tab, store.state.targetId, tUrl);
    // } else if (sender.tab.id !== store.state.curSuggestionTabId) {
    //   if (sender.tab.active) {
    //     // store.commit(types.SET_CUR_PAGE, {
    //     //   url: sender.tab.url,
    //     // });
    //     // idb.setCurPage(sender.tab.url);
    //     store.commit(types.SET_ACTIVE_TAB_ID, {
    //       tabId: sender.tab.id,
    //     });
    //     await idb.setSkippedLinkIfNew(store.state.targetId, message.link);
    //     await idb.setSkippedSourceIfNew(store.state.targetId, message.link);
    //     await idb.setCurPage(message.link);
    //   }
    // } else {
    //   saveAsSource(sender.tab, store.state.targetId, tUrl);
    // }
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
  }
});

async function storePage(page, url, linkAction, sourceAction) {
  if (page == null) {
    return;
  }

  // Page as a profile.
  for (let i in page.links) {
    let link = page.links[i];
    if (typeof link === 'string') {
      link = { url: link };
    }
    link.url = trimmedUrl(link.url);
    link.timeAdded = new Date();
    link.saved = true;
    link.profileId = url;
    await idb.addLink(link);
  }

  let sources = page.sources;

  for (let i in sources) {
    let source = sources[i];
    if (typeof source === 'string') {
      source = {
        providerId: source,
      };
      sources[i] = source;
    }
    source.consumerId = url;
  }
  await idb.addSources({
    sources,
  });

  page.autoGenerated = true;
  await idb.storeProfile(page, false);
  store.commit(types.REMOVE_URL_TO_SCRAPE, url);

  // Page as link and source for current consumer profile.
  if (store.state.targetId != null) {
    idb.saveOrSkipLink({
      link: page,
      targetId: store.state.targetId,
      action: linkAction,
    });
    idb.saveOrSkipSource({
      source: page,
      targetId: store.state.targetId,
      action: sourceAction,
    });
  }
}

function getScraper(url) {
  let scraper = null;
  for (let i in store.state.scrapers) {
    let curScraper = store.state.scrapers[i];
    if (url.startsWith(curScraper.domain) && (scraper == null || scraper.priority < curScraper.priority)) {
      scraper = curScraper;
    }
  }
  return scraper;
}

function scrapeProfile(url) {
  console.log('scraping ' + url);
  store.commit(types.ADD_PROFILE_TO_SCRAPE, url);
  chrome.tabs.create({ url: 'http://' + url, active: false });
}

// Save current tab as a source.
function saveAsSource(tab, profileId, sourceUrl) {
  chrome.tabs.sendMessage(tab.id, { action: 'getLinks' }, getLinksCB);
  idb.updateProfileScrapeDate({
    sourceUrl,
  });
}

async function getLinksCB(links) {
  console.log('received ' + links.length + ' new suggestions for ' + store.state.sourceToScrape + ':\n' + JSON.stringify(links));

  for (let i in links) {
    let link = links[i];
    link.url = trimmedUrl(link.url);
    link.timeAdded = new Date();
    link.saved = true;
    link.profileId = store.state.sourceToScrape;
    idb.addLink(link);
  }

  store.commit(types.SET_SOURCE_TO_SCRAPE, '');
}

// Whether or not an array of links contains a particular link
// eslint-disable-next-line no-unused-vars
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
// eslint-disable-next-line no-unused-vars
function objContainsLink(links, linkToFind) {
  let urlToFind = trimmedUrl(linkToFind.url);
  return links[urlToFind] != null;
}

// Open URL and get suggestion from it.
// eslint-disable-next-line no-unused-vars
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

idb.loadScrapers();

idb.loadPopupProfile();
