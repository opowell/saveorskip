import store from './store';
global.browser = require('webextension-polyfill');

const sos = {};

sos.ITEMS_SAVED = 'pages-saved';
sos.ITEMS_SKIPPED = 'pages-skipped';
sos.SOURCES_SUGGESTED = 'sources-suggested';

sos.SCRAPE_DELAY_MS = 1000 * 60 * 60;

sos.needCurSuggestion = true;

sos.getCurTarget = function() {
  // let targetId = document.getElementById('target-input').value;
  // if (targetId.length == 0) {
  //     targetId = 'default';
  // }
  // return targetId;
  return store.getters.curTarget.name;
};

sos.getCurTargetSaved = function() {
  return 'sos-' + sos.getCurTarget() + '-' + sos.ITEMS_SAVED;
};

sos.getCurTargetSkipped = function() {
  return 'sos-' + sos.getCurTarget() + '-' + sos.ITEMS_SKIPPED;
};

sos.getCurTargetSourcesSuggested = function() {
  return 'sos-' + sos.getCurTarget() + '-' + sos.SOURCES_SUGGESTED;
};

/*
 * gotoNext - whether or not to move to a new page after saving.
 **/
sos.saveOrSkip = function(gotoNext, action) {
  // Save data from the current tab.
  let targetId = sos.getCurTarget();
  console.log(targetId + ' - ' + action + ' current link');
  chrome.tabs.query({ active: true }, function(tabs) {
    if (tabs[0] == null) {
      debugger;
    }
    var url = sos.trimmedUrl(tabs[0].url);
    console.log(targetId + ' - ' + action + ' link: ' + JSON.stringify(url));
    sos.activeTab = tabs[0];
    let arrName = null;
    let actionPast = null;
    if (action === 'save') {
      arrName = sos.getCurTargetSaved();
      actionPast = 'Saved';
    } else {
      arrName = sos.getCurTargetSkipped();
      actionPast = 'Skipped';
    }

    store.dispatch('saveOrSkipLink', {
      link: url,
      action: action,
      targetId: targetId,
    });

    sos.addToArray(arrName, url, function() {
      console.log(targetId + ' - ' + actionPast + ' link: ' + JSON.stringify(url));
      let cb;
      if (gotoNext === true) {
        cb = sos.showNextPage;
      }
      sos.saveSourcesOfUrl(tabs[0], url, cb, action);
    });
  });
};

// Save a list of sources to storage.
sos.saveSources = function(sourcesToSave, callback) {
  if (sourcesToSave == null) return;

  console.log('SAVING suggested sources:\n' + sos.arrJoin(sourcesToSave));

  store.dispatch('addSuggestedSources', {
    sources: sourcesToSave,
    targetId: sos.getCurTarget(),
  });

  chrome.storage.local.get([sos.getCurTargetSourcesSuggested()], function(result) {
    if (result[sos.getCurTargetSourcesSuggested()] == null) {
      result[sos.getCurTargetSourcesSuggested()] = {};
    }
    var sources = result[sos.getCurTargetSourcesSuggested()];
    for (let i = 0; i < sourcesToSave.length; i++) {
      let source = sourcesToSave[i];
      var srcObj = sources[source.url] ? sources[source.url] : sos.Source(source.url);
      srcObj.points = srcObj.points + source.points;
      sources[source.url] = srcObj;
    }
    chrome.storage.local.set(result, function() {
      console.log('SAVED sources');
      if (callback != null) {
        callback();
      }
    });
  });
};

// Save sources from other open pages that link to this item.
sos.saveSourcesOfUrl = function(tab, url, cb, action) {
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
          if (response.sources[j] == sos.sourceForCurURL) {
            response.sources.splice(j, 1);
          }
        }
        sos.saveSources(response.sources);
      });
    }
    // Check tab itself for sources.
    chrome.tabs.sendMessage(tab.id, { action: 'scrapeOwnSources', saveOrSkip: action }, function(response) {
      if (response != null) {
        for (let j = 0; j < response.sources.length; j++) {
          if (response.sources[j] == sos.sourceForCurURL) {
            response.sources.splice(j, 1);
          }
        }
        sos.saveSources(response.sources, cb);
      }
    });
  });
};

// Selects a random source, with prob. of selecting source i proportional to source i's points.
sos.showNextPage = function() {
  // If next suggestion already exists, use it and find a new one.
  console.log('show next link');
  if (sos.nextSuggestion != null) {
    console.log('next suggestion exists');
    sos.changeActiveTabToUrl(sos.nextSuggestion);
    sos.curSuggestion = sos.nextSuggestion;
    sos.nextSuggestion = null;
    sos.needCurSuggestion = false;
  } else {
    console.log('no next suggestion');
    sos.needCurSuggestion = true;
  }
  sos.loadNextSuggestion();
};

sos.loadNextSuggestion = function() {
  console.log('Loading next link');
  let listName = sos.getCurTargetSourcesSuggested();
  chrome.storage.local.get([listName], function(result) {
    let sources = result[listName];
    if (sources == null) {
      console.log('no sources found');
      return;
    }
    let source = sos.drawRandomElFromObject(sources, sos.scoreFn);

    if (source == null) {
      console.log('error loading suggestion: no source found');
    }

    console.log('DRAWING SUGGESTION from ' + source.url);

    sos.sourceForCurURL = sos.trimmedUrl(source.url);
    // If too early to scrape, proceed without scraping.
    let now = new Date();
    console.log('comparing now to next scrape date: ' + now + ' vs. ' + source.nextScrape);
    if (new Date(source.nextScrape) > now) {
      console.log('drawing item from previously scraped links: ' + source.url);
      sos.getSavedItemsCB();
    }
    // Otherwise, open the page and scrape it.
    else {
      console.log('scraping items from ' + source.url);
      let newURL = 'http://' + sos.trimmedUrl(source.url);
      sos.curURL = sos.trimmedUrl(newURL);
      sos.openUrl(newURL);
    }
  });
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('message received from ' + sos.trimmedUrl(sender.url) + ': ' + request);

  let action = request;
  if (request.action != null) {
    action = request.action;
  }

  switch (action) {
    case 'showNextPage':
      sos.showNextPage();
      break;
    case 'pageLoaded':
      if (sender.tab.id !== sos.getSuggestionTab) {
        console.log('not current suggestion tab: ' + sos.getSuggestionTab);
        chrome.tabs.query({ active: true }, function(tabs) {
          if (sos.trimmedUrl(tabs[0].url) === sos.trimmedUrl(sender.tab.url)) {
            store.dispatch('setCurUrl', sender.tab.url);
          }
        });
      } else {
        sos.saveAsSource(sender.tab);
      }
      break;
    case 'skip':
      sos.saveOrSkip(false, 'skip');
      break;
    case 'save':
      sos.saveOrSkip(false, 'save');
      break;
    case 'saveAndGo':
      sos.saveOrSkip(true, 'save');
      break;
    case 'skipAndGo':
      sos.saveOrSkip(true, 'skip');
      break;
    case 'go':
      sos.showNextPage();
      break;
    case 'saveAsSource':
      break;
  }
});

// chrome.storage.local.get(['targetId'], function(result) {
//   sos.curTarget = result['targetId'];
// });

// Save current tab as a source.
sos.saveAsSource = function(tab) {
  sos.getSavedItemsTab = tab;
  chrome.storage.local.get([sos.getCurTargetSourcesSuggested()], function(result) {
    let sources = result[sos.getCurTargetSourcesSuggested()];
    let sourceName = sos.trimmedUrl(tab.url);
    if (sources[sourceName] == null) {
      sources[sourceName] = sos.Source(sourceName);
      sources[sourceName].points += 2;
    }
    let source = sources[sourceName];
    source.lastScraped = new Date().toJSON();

    // Set earliest time of next scrape.
    // For now, in 24 hours.
    let now = new Date().getTime();
    console.log('current time: ' + new Date(now).toJSON());
    source.nextScrape = new Date(now + 1000 * 60 * 60 * 24).toJSON();
    console.log(source.url + ': next scrape not before ' + source.nextScrape);
    chrome.storage.local.set(result, function() {
      chrome.tabs.sendMessage(tab.id, { action: 'getSavedItems' }, sos.getSavedItemsCB);
    });
  });
};

sos.nextSuggestion = null;

sos.getSavedItemsCB = function(items) {
  // let tab = sos.getSavedItemsTab;

  if (items == null) {
    items = [];
  }
  console.log('received ' + items.length + ' new suggestions from/for ' + sos.sourceForCurURL + ':\n' + items.join('\n'));
  chrome.storage.local.get(null, function(result) {
    var savedItems = result[sos.getCurTargetSaved()] ? result[sos.getCurTargetSaved()] : [];
    var skippedItems = result[sos.getCurTargetSkipped()] ? result[sos.getCurTargetSkipped()] : [];

    let sources = result[sos.getCurTargetSourcesSuggested()];
    let sourceName = sos.trimmedUrl(sos.sourceForCurURL);
    if (sources[sourceName] == null) {
      sources[sourceName] = sos.Source(sourceName);
      sources[sourceName].points += 2;
    }
    let source = sources[sourceName];

    if (source.scrapedItems == null) {
      source.scrapedItems = [];
    }

    // Assumes newest links are at the front of the array. Start with oldest links first.
    for (let i = items.length - 1; i >= 0; i--) {
      let item = items[i];
      if (!source.scrapedItems.includes(item) && !sos.alreadyViewed(savedItems, item) && !sos.alreadyViewed(skippedItems, item)) {
        source.scrapedItems.unshift(item);
      }
    }

    chrome.storage.local.set(result, function() {
      let updated = false;
      for (let i = 0; i < source.scrapedItems.length; i++) {
        let item = sos.trimmedUrl(source.scrapedItems[i]);
        console.log('checking sug. item: ' + item);
        if (sos.curSuggestion != item && !sos.alreadyViewed(savedItems, item) && !sos.alreadyViewed(skippedItems, item)) {
          console.log('found new link: ' + item);

          chrome.storage.local.set(result, function() {
            if (sos.needCurSuggestion) {
              sos.changeActiveTabToUrl(item);
              sos.sourceForCurURL = sourceName;
              sos.needCurSuggestion = false;
              sos.loadNextSuggestion();
            } else {
              console.log('saving next suggestion as ' + item);
              sos.nextSuggestion = item;
            }
          });
          updated = true;
          break;
        } else {
          source.scrapedItems.splice(i, 1);
          i--;
        }
      }
      // Try again.
      if (!updated) {
        console.log('no update found, trying again');
        chrome.storage.local.set(result, function() {
          sos.showNextPage();
        });
      }
    });
  });
};

sos.drawRandomElFromObject = function(object, scoreFn) {
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
  for (let i = 0; i < keys.length; i++) {
    let score = scores[i];
    if (score > 0) {
      curSum = curSum + score;
      if (curSum > draw && selectedInd === -1) {
        selected = object[[keys[i]]];
        selectedInd = i;
      }
    }
  }

  for (let i = 0; i < keys.length; i++) {
    let score = scores[i];
    let selText = '  ';
    if (i === selectedInd) {
      selText = '>>';
    }
    let obj = object[keys[i]];
    try {
      console.log(selText + ' - ' + score + ' - ' + obj.points + ' - ' + obj.scrapedItems.length + ' - ' + obj.nextScrape + ' - ' + obj.url);
    } catch (err) {
      console.error('ERROR');
    }
  }

  return selected;
};

sos.scoreFnHot = function(src) {
  if (src.points < 1) {
    return 0;
  }

  let now = new Date();
  if (src.nextScrape != null && src.scrapedItems != null && new Date(src.nextScrape) > now && src.scrapedItems.length == 0) {
    return 0;
  }

  return src.points / Math.pow((new Date() - new Date(src.lastSaved)) / (1000 * 60 * 60) + 2, 2);
};

sos.scoreFnJustPoints = function(src) {
  if (src.points < 1) {
    return 0;
  }

  let now = new Date();
  if (src.nextScrape != null && src.scrapedItems != null && new Date(src.nextScrape) > now && src.scrapedItems.length == 0) {
    return 0;
  }

  return src.points;
};

// Whether or not the url is contained in the list.
sos.alreadyViewed = function(items, url) {
  for (let i = 0; i < items.length; i++) {
    if (sos.trimmedUrl(items[i]) == sos.trimmedUrl(url)) {
      return true;
    }
  }
  return false;
};

// Write a value to storage.
sos.addToArray = function(arrName, toAdd, cb) {
  chrome.storage.local.get([arrName], function(result) {
    console.log('Saving ' + arrName + ': ' + JSON.stringify(toAdd));
    var array = result[arrName] ? result[arrName] : [];
    array.unshift(toAdd);
    result[arrName] = array;
    chrome.storage.local.set(result, cb);
  });
};

sos.objJoin = function(obj, separator) {
  var arr = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      arr.push(JSON.stringify(obj[key]));
    }
  }
  return arr.join(separator || '\n');
};

sos.arrJoin = function(arr, separator) {
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    out.push(JSON.stringify(arr[i]));
  }
  return out.join(separator || '\n');
};

// Sorted alphabetically in storage.
sos.Source = function(url) {
  return {
    firstSaved: new Date().toJSON(),
    lastSaved: new Date().toJSON(),
    lastScraped: null,
    nextScrape: new Date().toJSON(),
    points: 0,
    scrapedItems: [],
    url: url,
  };
};

// Open URL and get suggestion from it.
sos.openUrl = function(newURL) {
  console.log('creating new tab: ' + newURL);
  chrome.tabs.create({ url: newURL, active: false }, function(tab) {
    console.log('tab created: ' + newURL);
    sos.getSuggestionTab = tab.id;
  });
};

sos.changeActiveTabToUrl = function(newURL) {
  console.log('changing active tab to ' + sos.curSuggestion);
  if (sos.activeTab == null) {
    console.log('no active tab, aborting');
    return;
  }

  sos.curSuggestion = sos.trimmedUrl(newURL);
  chrome.tabs.update(sos.activeTab.id, { url: 'http://' + sos.curSuggestion });
  sos.activeTab = null;
};

sos.trimmedUrl = function(url) {
  if (url.includes('://')) {
    url = url.substring(url.indexOf('://') + '://'.length);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }

  return url;
};

// SETTINGS
sos.scoreFn = sos.scoreFnJustPoints;
