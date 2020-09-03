// CAREFUL ABOUT EXPORTING FUNCTIONS FROM HERE. DO NOT IMPORT GENERAL CODE RUNNING OUTSIDE OF THE BACKGROUND PAGE.

import store from './store';
import * as idb from './store/idb';
import * as types from './store/mutation-types';
import { trimmedUrl, convertId } from './Utils';
import { LINK_STATUS, STORE_PROFILES, STORE_SCRAPING_QUEUE_PROFILEID, DB_NAME, createDB } from './store/Constants.ts';
import { deleteDB } from 'idb';

global.browser = require('webextension-polyfill');

// Save a list of sources to storage.
function saveSources(sourcesToSave, callback) {
  if (sourcesToSave == null) return;
  for (let i in sourcesToSave) {
    sourcesToSave[i].consumerId = store.state.profileId;
    sourcesToSave[i].generatedBy = 'auto';
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
async function showNextPage(profileId) {
  await store.dispatch('gettingSuggestion', profileId);
  await store.dispatch('status', 'Getting suggestion');
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

async function loadNextSuggestion(profileId) {
  await store.dispatch('status', 'Getting suggestion');
  try {
    console.log('Loading next link');
    let nextLink = await idb.getSuggestion(profileId);
    if (nextLink != null) {
      changeActiveTabToUrl(nextLink.url);
      return;
    } else {
      await store.dispatch('status', 'Waiting for suggestion');
    }
  } catch (err) {
    console.log(err);
  }
}

function setPageUrl(tabId) {
  const getTabFn = async function(tab) {
    state.pageUrl = trimmedUrl(tab.url);
    if (state.page == null || state.page.url !== state.pageUrl) {
      state.page = null;
      getPageObj(tab.id);
    }
    state.linkStatus = await idb.getLinkStatus(state.profileId, state.pageUrl);
    state.sourceStatus = await idb.getSourceStatus(state.profileId, state.pageUrl);
    chrome.runtime.sendMessage({
      action: 'setPageUrl',
      pageUrl: state.pageUrl,
      linkStatus: state.linkStatus,
      sourceStatus: state.sourceStatus,
    });
  };
  if (tabId != null) {
    chrome.tabs.get(tabId, getTabFn);
  } else {
    chrome.tabs.getSelected(null, getTabFn);
  }
}

async function getCurrentPageObj(sender) {
  chrome.tabs.getSelected(null, async function(tab) {
    getPageObj(tab.id);
  });
}

async function getPageObj(tabId) {
  // 'tabId' must be at least 0.
  if (tabId < 0) {
    return;
  }
  chrome.tabs.sendMessage(tabId, { action: 'getPage' });
}

async function doGetPage(senderUrl, message, sender) {
  if (senderUrl === state.testPageUrl) {
    store.dispatch('setTestPage', { page: message.page });
  }
  let profile = await idb.getProfile(state.profileId);
  if (profile != null && message.page != null) {
    message.page.url = senderUrl;
    await idb.storePage(message.page, state.profileId, profile.defaultLinkAction, profile.defaultSourceAction);
    setPageUrl();
    setPage(message.page);
  } else {
    console.log('no page, skipping');
  }

  console.log('scraper tab id', store.state, sender.tab.id, state.scraperTabId);
  await idb.removePageToScrape(senderUrl);
  if (sender.tab.id === state.scraperTabId) {
    console.log('was a page to scrape');
    let nextPageToScrape = await idb.getNextPageToScrape();
    console.log('next page', nextPageToScrape);
    if (nextPageToScrape != null) {
      console.log('scrape next');
      chrome.tabs.update(sender.tab.id, { url: 'http://' + nextPageToScrape[STORE_SCRAPING_QUEUE_PROFILEID] });
      // chrome.tabs.sendMessage(sender.tab.id, { action: 'setUrl', url: 'http://' + nextPageToScrape[STORE_SCRAPING_QUEUE_PROFILEID] });
    }
  }
}

function setPage(page) {
  state.page = page;
  chrome.runtime.sendMessage({
    action: 'setPage',
    page: state.page,
  });
}

async function getSourcesOfUrl({ url, profileId }) {
  chrome.tabs.query({}, function(tabs) {
    for (let i = 0; i < tabs.length; i++) {
      let tab = tabs[i];
      chrome.tabs.sendMessage(tab.id, { action: 'getUrlSources', url: url }, function(response) {
        if (response == null || response.sources == null) {
          console.log(tab.url + ' returned no sources of ' + url);
          return;
        }
        idb.storeLinkSources(response.sources, profileId);
      });
    }
  });
}

async function handleMessage(message, sender) {
  let senderUrl = trimmedUrl(sender.url);
  console.log('message received from ' + senderUrl, message);

  let action = message;
  if (message.action != null) {
    action = message.action;
  }

  switch (action) {
    case 'startScraping':
      idb.startScraping();
      break;
    case 'getUrlStatus':
      let statusData = {};
      statusData.linkStatus = await idb.getLinkStatus(message.profileId, message.pageUrl);
      statusData.sourceStatus = await idb.getSourceStatus(message.profileId, message.pageUrl);
      return statusData;
    case 'getPopupData':
      const popupData = {};
      popupData.profileId = state.profileId;
      popupData.pageUrl = state.pageUrl;
      popupData.page = state.page;
      popupData.profiles = await idb.fetchProfiles([{ field: 'generatedBy', lowerValue: 'user', upperValue: 'user' }], 100);

      // If no page, ask for it to be loaded.
      if (state.page == null) {
        getCurrentPageObj(senderUrl, message, sender);
      }
      return popupData;
    case 'deleteProfiles':
      for (let i in message.profiles) {
        await idb.deleteProfile({
          profileId: message.profiles[i].id,
        });
      }
      break;
    case 'parseBrowserHistory':
      await idb.parseBrowserHistory(state, { consumerId: message.consumerId });
      break;
    case 'deleteProfileSource':
      await idb.removeSource({ targetId: message.targetId, url: message.url });
      break;
    case 'fetchNumResults':
      const numResults = await idb.getNumResults({ storeName: message.storeName, filters: message.filters });
      return numResults;
    case 'getIndices':
      let indices = await idb.getIndices({ offset: message.offset, numRows: message.numRows, storeNames: message.storeNames });
      return indices;
    case 'getProfiles':
      let profiles = await idb.getStoreResults({
        storeName: STORE_PROFILES,
        filters: message.filters,
        offset: message.offset,
        numRows: message.numRows,
        sortOrder: message.sortOrder,
      });
      for (let i in profiles) {
        try {
          await idb.addProfileChildrenCounts(profiles[i]);
        } catch (e) {}
      }
      return profiles;
    case 'removeLink':
      await idb.removeLink({
        targetId: message.targetId,
        url: message.url,
      });
      break;
    case 'setLinkStatus':
      await idb.setLinkStatus(message.url, message.status, message.profileId, message.page);
      break;
    case 'setTestPageUrl':
      state.testPageUrl = message.url;
      chrome.tabs.create({ url: 'http://' + message.url, active: false });
      break;
    case 'saveOrSkipSource':
      await idb.saveOrSkipSource(message.status, message.profileId, message.source);
      break;
    case 'saveSourcesOfUrl':
      state.urlToScrape = message.url;
      saveSourcesOfUrl(message.url, null, LINK_STATUS.SAVED);
      break;
    case 'storeProfile':
      await idb.storeProfile(message.profile, {});
      break;
    case 'getPage':
      doGetPage(senderUrl, message, sender);
      break;
    case 'pageLoaded':
      let closeWhenDone = false;
      if (senderUrl === state.testPageUrl) {
        closeWhenDone = true;
      }
      console.log('loaded page', sender, state);
      let isScraperPage = state.scraperTabId === sender.tab.id;

      if (state.urlsToScrape[senderUrl] === true) {
        closeWhenDone = !isScraperPage;
        delete state.urlsToScrape[senderUrl];
      }

      let scraper = await getScraper(senderUrl);
      console.log('sending response for ' + senderUrl + ' with scraper' + scraper.id, scraper);
      let payload = {
        scraper,
        closeWhenDone,
        isScraperPage,
      };
      chrome.tabs.sendMessage(sender.tab.id, { action: 'getScraper', payload });
      // sendResponse(payload);
      getSourcesOfUrl({
        url: senderUrl,
        profileId: state.profileId,
      });
      break;
    case 'scrapeProfile':
      idb.scrapeProfile(message.url);
      break;
    // NOT SURE NEEDED
    case 'showNextPage':
      showNextPage();
      break;
    case 'createIndex':
      await idb.createIndex(message.storeName, message.keyPath);
      break;
    case 'go':
      showNextPage(message.profileId);
      break;
    case 'saveAsSource':
      break;
    case 'reset':
      console.log('Starting reset...');
      await deleteDB(DB_NAME, {
        blocked() {
          console.log('call was blocked!');
        },
      });
      console.log('DB deleted');
      createDB(state);
      break;
  }
}

let DEFAULT_SCRAPER_PRIORITY = 1;

async function getScraper(url) {
  let scrapers = await idb.getScrapers();
  let scraper = null;
  for (let i in scrapers) {
    let curScraper = scrapers[i];
    if (!url.startsWith(curScraper.domain)) {
      continue;
    }
    if (scraper == null) {
      scraper = curScraper;
      continue;
    }
    let selScraperPriority = scraper.priority == null ? DEFAULT_SCRAPER_PRIORITY : scraper.priority;
    let curScraperPriority = curScraper.priority == null ? DEFAULT_SCRAPER_PRIORITY : curScraper.priority;
    if (selScraperPriority >= curScraperPriority) {
      continue;
    }
    scraper = curScraper;
  }
  if (scraper == null) {
    console.log('Error, no scraper found for ' + url);
  }
  return scraper;
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
    link.saved = 1;
    link.profileId = store.state.sourceToScrape;
    idb.addLink(link);
  }

  store.commit(types.SET_SOURCE_TO_SCRAPE, '');
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

// LISTEN TO TAB CHANGES / ACTIVATIONS
chrome.tabs.onActivated.addListener(function(activeInfo) {
  console.log('tab activated', activeInfo);

  setPageUrl(activeInfo.tabId);
  state.activeTabId = activeInfo.tabId;

  chrome.tabs.sendMessage(activeInfo.tabId, { action: 'getPage' });
});

chrome.tabs.onUpdated.addListener(async function(tabId, changeInfo, tab) {
  console.log('tab updated', tabId, changeInfo, tab, state.scraperTabId, store, state);
  if (tabId === state.activeTabId) {
    setPageUrl(tabId);
    chrome.tabs.sendMessage(tabId, { action: 'getPage' });
  }
});
// END TAB CHANGES / ACTIVATIONS.

// MESSAGING
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Cannot use async / await directly in addListener.
  handleMessage(message, sender).then(sendResponse);
  return true;
});

const state = {
  pageUrl: null,
  page: null,
  linkStatus: null,
  sourceStatus: null,
  urlsToScrape: {},
  scraperTabId: null,
};

idb.loadScrapers();

state.profileId = localStorage.getItem('profileId');
if (state.profileId == null) {
  let profiles = idb.fetchProfiles([{ field: 'generatedBy', lowerValue: 'user', upperValue: 'user' }], 1);
  profiles.then(value => {
    state.profileId = value[0].id;
    console.log('set profile id to ' + state.profileId);
  });
} else {
  state.profileId = convertId(state.profileId);
}

setPageUrl();
