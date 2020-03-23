import store from './index.js';
import { openDB } from 'idb';
import {
  getDBPromise,
  STORE_LINKS,
  STORE_LOGS,
  STORE_PROFILES,
  STORE_SOURCES,
  STORE_LINKS_TIME_ADDED,
  STORE_SOURCES_CONSUMERID,
  STORE_SOURCES_PROVIDERID,
  STORE_SCRAPERS,
  STORE_LINKS_PROFILEID,
  DB_NAME,
  getDBVersion,
  INDEX_STORES,
  KEYPATH_SEPARATOR,
  setDBPromise,
} from './Constants.ts';
import * as AutoGenProfile from '../models/AutoGenProfile.js';
import * as types from './mutation-types.js';
// eslint-disable-next-line prettier/prettier
import { trimmedUrl, drawRandomElFromObject, scoreFnJustPoints, setIfNotNull } from '../Utils.js';

/**
 * Should not call Vuex store directly. Instead, broadcast messages to all tabs with the corresponding store modification. Tabs then update their own stores (and Vue instances).
 */
export async function dispatchToStores(functionName, payload) {
  // Call for this page.
  await store.dispatch(functionName, payload);

  // Call for all other pages.
  chrome.runtime.sendMessage({
    action: 'storeDispatch',
    storeAction: functionName,
    storePayload: payload,
  });
}

export async function setCurPage(payload) {
  if (payload == null) {
    return;
  }
  if (payload.id != null && payload.url == null) {
    payload.url = payload.id;
  }
  if (payload.title != null && payload.name == null) {
    payload.title = payload.name;
  }
  await dispatchToStores('setCurPage', payload);
  await setCurUrlLinkStatus();
  await setCurUrlSourceStatus();
}

export async function storePage(page, profileId, linkAction, sourceAction) {
  if (page == null) {
    return;
  }

  let numNewLinksFound = 0;

  // Page as a profile.
  for (let i in page.links) {
    let link = page.links[i];
    if (typeof link === 'string') {
      link = { url: link };
    }
    link.url = trimmedUrl(link.url);
    if (link.saved == null) {
      link.saved = 1;
    }
    link.profileId = profileId;
    numNewLinksFound += await addLink(link);
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
    source.consumerId = profileId;
  }
  // await addSources({
  //   sources,
  // });

  page.generatedBy = 'auto';
  await storeProfile(page, { overwriteProps: false, updateScrapeSettings: true, numNewLinksFound });
  store.commit(types.REMOVE_URL_TO_SCRAPE, profileId);

  // Page as link and source for current consumer profile.
  if (store.state.targetId != null) {
    await saveOrSkipLink({
      link: page,
      targetId: store.state.targetId,
      action: linkAction,
    });
    // await saveOrSkipSource({
    //   source: page,
    //   targetId: store.state.targetId,
    //   action: sourceAction,
    // });
  }
}

export async function addProfileChildrenCounts(profile) {
  profile['Links'] = await getNumResults({
    storeName: STORE_LINKS,
    filters: [
      {
        field: STORE_LINKS_PROFILEID,
        lowerValue: profile.id,
        upperValue: profile.id,
      },
    ],
  });
  profile['Sources'] = await getNumResults({
    storeName: STORE_SOURCES,
    filters: [
      {
        field: STORE_SOURCES_CONSUMERID,
        lowerValue: profile.id,
        upperValue: profile.id,
      },
    ],
  });
  profile['Logs'] = await getNumResults({
    storeName: STORE_LOGS,
    filters: [
      {
        field: 'objectType',
        lowerValue: 'Profile',
        upperValue: 'Profile',
      },
      {
        field: 'objectKeys',
        lowerValue: profile.id,
        upperValue: profile.id,
      },
    ],
  });
}

export async function loadProfile(payload) {
  let profileId = payload.profileId;
  const db = await getDBPromise();
  let profile = await db.get(STORE_PROFILES, profileId);
  await addProfileChildrenCounts(profile);
  return profile;
}

export async function loadPopupProfile() {
  let profileId = store.state.targetId;
  const db = await getDBPromise();
  let profile = await db.get(STORE_PROFILES, profileId);
  await dispatchToStores('setPopupProfile', profile);
}

export async function loadSources(payload) {
  let out = await getProfileSources(payload.profileId);
  await dispatchToStores('loadSources', out);
}

export async function setSkippedLinkIfNew(profileId, link) {
  if (link == null || link.url == null) {
    return;
  }
  link.url = trimmedUrl(link.url);
  const db = await getDBPromise();
  let storeItem = await db.get(STORE_LINKS, [profileId, link.url]);
  if (storeItem != null) {
    return;
  }
  await saveOrSkipLink({
    action: 'skip',
    targetId: profileId,
    link,
  });
}

export async function setTestPage(page) {}

export async function setSkippedSourceIfNew(profileId, source) {
  if (source == null || source.url == null) {
    console.log('no url given');
    return;
  }
  source.id = trimmedUrl(source.url);
  source.name = source.title;
  let prevUrl = source.id;
  let prevTitle = source.title;
  delete source.url;
  delete source.title;
  const db = await getDBPromise();
  let storeItem = await db.get(STORE_PROFILES, source.id);
  if (storeItem != null) {
    for (let i in source.links) {
      if (typeof source.links[i] === 'string') {
        source.links[i] = { url: source.links[i] };
      }
      source.links[i].saved = 1;
    }
    await addLinks({
      links: source.links,
      profileId: source.id,
    });
    for (let i in source.sources) {
      if (typeof source.sources[i] === 'string') {
        source.sources[i] = { providerId: source.sources[i] };
      }
      source.sources[i].consumerId = source.id;
      source.sources[i].points = 0;
      source.sources[i].generatedBy = 'auto';
    }
    await addSources({
      sources: source.sources,
    });
    AutoGenProfile.incrementScrapeDate(storeItem);
    await db.put(STORE_PROFILES, storeItem);
    source.url = prevUrl;
    source.title = prevTitle;
    return;
  }
  source.points = 0;
  source.generatedBy = 'auto';
  AutoGenProfile.incrementScrapeDate(source);
  await saveOrSkipSource({
    action: 'skip',
    targetId: profileId,
    source,
  });
  source.url = prevUrl;
  source.title = prevTitle;
}

export async function setDefaultLinkAction(profileId, action) {
  let profile = await getProfile(profileId);
  if (profile == null) {
    return;
  }
  profile.defaultLinkAction = action;
  let db = await getDBPromise();
  await db.put(STORE_PROFILES, profile);
  if (store.state.popup.profile.id === profileId) {
    store.commit(types.SET_POPUP_PROFILE, profile);
  }
}

export async function setDefaultSourceAction(profileId, action) {
  let profile = await getProfile(profileId);
  if (profile == null) {
    return;
  }
  profile.defaultSourceAction = action;
  let db = await getDBPromise();
  await db.put(STORE_PROFILES, profile);
  if (store.state.popup.profile.id === profileId) {
    store.commit(types.SET_POPUP_PROFILE, profile);
  }
}

export async function getLink({ profileId, linkId, createIfNecessary }) {
  let db = await getDBPromise();
  let out = await db.get(STORE_LINKS, [profileId, linkId]);
  if (out == null && createIfNecessary) {
    out = {
      profileId,
      url: linkId,
    };
    await db.put(STORE_LINKS, out);
  }
  return out;
}

export async function loadLink({ profileId, linkId }) {
  let out = await getLink({ profileId, linkId });
  if (out == null) {
    return;
  }
  store.commit(types.LOAD_LINK, out);
}

export async function loadSource(key) {
  const db = await getDBPromise();
  let out = await db.get(STORE_SOURCES, key);
  if (out == null) {
    return;
  }
  // out.Links = await db.countFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, key[1]);
  store.commit(types.LOAD_SOURCE, out);
}

export async function deleteLink({ profileId, linkId }) {
  let db = await getDBPromise();
  await db.delete(STORE_LINKS, [profileId, linkId]);
  store.commit(types.LOAD_LINK, undefined);
  store.commit(types.DELETE_LINK, { profileId, url: linkId });
}

export async function deleteObject(store, key) {
  let db = await getDBPromise();
  try {
    await db.delete(store, key);
  } catch (e) {
    console.log(e);
    console.log(e.stack);
  }
}

export async function saveLink(link) {
  let db = await getDBPromise();
  try {
    await db.put(STORE_LINKS, link);
  } catch (e) {
    console.log(e);
    console.log(e.stack);
  }
}

export async function saveObject(storeName, object) {
  let db = await getDBPromise();
  try {
    let objKey = await db.put(storeName, object);
    return objKey;
  } catch (e) {
    console.log(e);
    console.log(e.stack);
  }
}

export async function getProfile(id) {
  if (id == null) {
    return null;
  }
  try {
    let db = await getDBPromise();
    let out = await db.get(STORE_PROFILES, id);
    return out;
  } catch (err) {
    console.log('Error getting profile ' + id, err);
    return null;
  }
}

export async function storeProfile(profile, { overwriteProps, updateScrapeSettings, numNewLinksFound, keepExistingProps }) {
  if (keepExistingProps == null) {
    keepExistingProps = true;
  }

  if (profile.id == null && profile.url != null) {
    profile.id = profile.url;
  }
  if (profile.name == null && profile.title != null) {
    profile.name = profile.title;
  }
  if (profile.timeAdded == null) {
    profile.timeAdded = new Date();
  }

  let fieldsToStore = ['saved', 'points', 'profileId', 'links', 'sources', 'url', 'title'];
  let tempStorage = [];
  for (let i in fieldsToStore) {
    let field = fieldsToStore[i];
    tempStorage.push({
      field,
      value: profile[field],
    });
    delete profile[field];
  }

  let storeProfile = null;
  if (keepExistingProps) {
    storeProfile = await getProfile(profile.id);
  }
  if (storeProfile == null) {
    storeProfile = profile;
  }
  for (let i in profile) {
    if (overwriteProps || storeProfile[i] == null) {
      storeProfile[i] = profile[i];
    }
  }

  if (storeProfile.generatedBy == null) {
    storeProfile.generatedBy = 'user';
  }

  if (updateScrapeSettings) {
    if (storeProfile.scrapeIncrement == null) {
      storeProfile.scrapeIncrement = 24 * 60 * 60 * 1000;
    }
    let factor = numNewLinksFound;
    if (numNewLinksFound > 0) {
      storeProfile.scrapeIncrement = storeProfile.scrapeIncrement / factor;
    } else {
      storeProfile.scrapeIncrement = storeProfile.scrapeIncrement * 2;
    }
    let x = new Date().getTime() + storeProfile.scrapeIncrement;
    storeProfile.nextScrape = new Date(x);
  }

  let objKey = await saveObject(STORE_PROFILES, storeProfile);

  addLog({
    objectKeys: objKey,
    objectType: 'Profile',
    message: 'Store',
  });

  for (let i in tempStorage) {
    let { field, value } = tempStorage[i];
    if (value != null) {
      profile[field] = value;
    }
  }
}

export async function fetchProfiles(filters) {
  const values = await getStoreResults({ storeName: 'profiles', filters, offset: 0, numRows: 100 });
  for (let i = 0; i < values.length; i++) {
    addProfileChildrenCounts(values[i]);
  }
  return values;
}

export async function getScrapers() {
  const db = await getDBPromise();
  const values = await db.getAll(STORE_SCRAPERS);
  return values;
}

export async function scrapeIfNecessary(source) {
  let profileId = source.id;
  if (source.providerId != null) {
    profileId = source.providerId;
  }
  let now = new Date();
  let profile = await getProfile(profileId);
  console.log('comparing now to next scrape date: ' + now + ' vs. ' + profile.nextScrape);
  if (profile.nextScrape == null || new Date(profile.nextScrape) < now) {
    scrapeProfile(profileId);
  }
}

export async function scrapeProfile(url) {
  if (url == null || url.length < 1) {
    return;
  }
  console.log('scraping ' + url);
  store.commit(types.ADD_PROFILE_TO_SCRAPE, url);
  chrome.tabs.create({ url: 'http://' + url, active: false });
}

export async function getSuggestion(profileId) {
  try {
    let sources = await getProfileSources(profileId);
    if (sources == null) {
      console.log('no sources found');
      return;
    }

    let consumer = await getProfile(profileId);
    while (true) {
      let [source, index] = drawRandomElFromObject(sources, scoreFnJustPoints);
      if (source == null) {
        console.log('error loading suggestion: no source found');
        return;
      }

      // TODO: Make customizable.
      source.points--;
      let db = await getDBPromise();
      await db.put(STORE_SOURCES, source);

      let provider = await getProfile(source.providerId);
      await scrapeIfNecessary(provider);

      let linksCursor = null;
      try {
        linksCursor = await getLinksByTimeAdded(source.providerId);
        let nextUrl = null;
        while (nextUrl === null) {
          // Check if current link already exists on profile.
          let storeLink = await getLink({
            profileId,
            linkId: linksCursor.value.url,
          });
          let alreadyExists = storeLink != null;
          if (!alreadyExists) {
            nextUrl = linksCursor.value;
          } else {
            await linksCursor.continue();
          }
        }

        if (nextUrl !== null) {
          return nextUrl;
        }
      } catch (err) {
        sources.splice(index, 1);
        continue;
      }
    }
  } catch (err) {
    console.log(err);
  }
}

export async function getProfileSources(profileId) {
  let db = await getDBPromise();
  let out = await db.getAllFromIndex(STORE_SOURCES, STORE_SOURCES_CONSUMERID, profileId);
  return out;
}

export async function getLinks(profileId) {
  let db = await getDBPromise();
  let out = await db.getAllFromIndex(STORE_LINKS, STORE_LINKS_PROFILEID, profileId);
  return out;
}

// export async function getLinksByTimeAdded(profileId) {
//   let out = null;
//   const db = await getDBPromise();
//   let tx = await db.transaction(STORE_LINKS);
//   let objStore = await tx.objectStore(STORE_LINKS);
//   let index = await objStore.index(INDEX_LINKS_PROFILEID_TIMEADDED, profileId);
//   let keyRng = IDBKeyRange.bound([profileId, new Date(2019, 1)], [profileId, new Date()]);
//   let cursor = await index.openCursor(keyRng, 'prev');
//   out = cursor;
//   await tx.done;
//   return out;
// }

export async function deleteProfile(payload) {
  let db = await getDBPromise();
  await db.delete(STORE_PROFILES, payload.profileId);
  store.dispatch('deleteProfile', payload);
}

export async function loadScrapers() {
  let scrapers = await getScrapers();
  store.commit(types.LOAD_SCRAPERS, scrapers);
  console.log('scrapers: ' + JSON.stringify(store.state.scrapers));
}

export async function deleteScraper({ scraperId }) {
  let db = await getDBPromise();
  await db.delete(STORE_SCRAPERS, scraperId);
}

export async function deleteProfileSource({ profileId, sourceId }) {
  let db = await getDBPromise();
  await db.delete(STORE_SOURCES, [profileId, sourceId]);
  store.commit(types.DELETE_PROFILE_SOURCE, { profileId, sourceId });
}

export async function addLink(payload) {
  let numNewLinks = 0;

  if (payload.profileId === payload.url) {
    return;
  }
  payload.url = trimmedUrl(payload.url);

  let db = await getDBPromise();
  let count = await db.count(STORE_LINKS, [payload.profileId, payload.url]);
  if (count === 0) {
    numNewLinks = 1;
  }

  let linksProp = payload.links;
  delete payload.links;

  let autoGenProp = payload.generatedBy;
  delete payload.generatedBy;

  let pointsProp = payload.points;
  delete payload.points;

  let deletedName = false;
  if (payload.title === payload.name) {
    delete payload.name;
    deletedName = true;
  }
  let deletedId = false;
  if (payload.url === payload.id) {
    delete payload.id;
    deletedId = true;
  }
  payload[STORE_LINKS_TIME_ADDED] = new Date();
  let objectKeys = await db.put(STORE_LINKS, payload);

  addLog({
    objectKeys,
    objectType: 'Link',
    message: 'Store',
  });

  if (deletedName) {
    payload.name = payload.title;
  }
  if (deletedId) {
    payload.id = payload.url;
  }
  if (linksProp != null) {
    payload.links = linksProp;
  }
  if (pointsProp != null) {
    payload.points = pointsProp;
  }
  if (autoGenProp != null) {
    payload.generatedBy = autoGenProp;
  }

  return numNewLinks;
}

export async function addSources({ sources }) {
  if (!Array.isArray(sources)) {
    return;
  }
  for (let i = 0; i < sources.length; i++) {
    let source = sources[i];
    await saveOrSkipSource({
      source,
      targetId: source.consumerId,
      action: 'save',
    });
  }
  await setCurUrlSourceStatus();
}

export async function setSourceSaved(payload) {
  let db = await getDBPromise();
  let storeName = STORE_SOURCES;
  let link = {
    url: trimmedUrl(payload.link.url),
    title: payload.link.title,
    saved: payload.action === 'save' ? 1 : 0,
    profileId: payload.targetId,
  };
  if (payload.props != null) {
    let propKeys = Object.keys(payload.props);
    for (let i = 0; i < propKeys.length; i++) {
      let propKey = propKeys[i];
      link[propKey] = payload.props[propKey];
    }
  }
  console.log('Storing source:', link);
  await db.put(storeName, link);
  console.log('Source "' + payload.link.url + '" stored successfully.');
  await setCurUrlSourceStatus();
  // chrome.runtime.sendMessage('save');
}

export async function saveOrSkipLink(payload) {
  let link = payload.link;

  let linksProp = link.links;
  delete link.links;

  link.url = trimmedUrl(link.url);
  link.saved = payload.action === 'save' ? 1 : 0;
  link.profileId = payload.targetId;
  link.timeAdded = new Date();

  let db = await getDBPromise();
  let storeObject = await db.get(STORE_LINKS, [link.profileId, link.url]);

  // If necessary, reverse previous action.
  if (storeObject != null && storeObject.saved !== link.saved) {
    let sources = link.sources;
    for (let i in sources) {
      let source = sources[i];
      storeSource({
        source,
        providerId: source.id,
        consumerId: source.profileId,
        overwrite: false,
        pointsChange: source.points,
      });
      // await saveOrSkipSource({
      //   targetId: sources[i].profileId,
      //   source: sources[i],
      //   action: storeObject.saved ? 'save' : 'skip',
      // });
    }
  }

  // Process sources.
  let sources = link.sources;
  for (let i in sources) {
    let source = sources[i];
    if (typeof source === 'string') {
      source = {
        id: source,
        generatedBy: 'auto',
      };
    }
    if (source.points == null) {
      if (payload.action === 'save') {
        source.points = source.pointsSave;
      } else {
        source.points = source.pointsSkip;
      }
    }
    await saveOrSkipSource({
      targetId: payload.targetId,
      source,
      action: 'skip', // TODO: check if source exists. update, instead of overwrite.
    });
  }

  addLink(link);
  await setCurUrlLinkStatus();
}

export async function storeSource({ source, providerId, consumerId, pointsChange, overwrite }) {
  const db = await getDBPromise();

  let profile = await db.get(STORE_PROFILES, consumerId);
  if (profile == null) {
    debugger;
    return;
  }
  if (profile.storeSource != null) {
    setIfNotNull(profile, 'storeSource');
    profile.storeSource({ source, providerId, consumerId, pointsChange, overwrite });
    return;
  }

  let storeObject = null;
  if (!overwrite) {
    storeObject = await db.get(STORE_SOURCES, [consumerId, providerId]);
    if (storeObject != null) {
      for (let i in source) {
        storeObject[i] = source[i];
      }
      if (pointsChange != null) {
        storeObject.points = storeObject.points + (pointsChange - 0);
      }
    } else {
      source.points = pointsChange;
    }
  }
  if (storeObject == null) {
    storeObject = source;
    storeObject.timeAdded = new Date();
  }

  storeObject.consumerId = consumerId;
  storeObject.providerId = providerId;
  await db.put(STORE_SOURCES, storeObject);

  source.id = providerId;
  source.generatedBy = 'auto';
  delete source.providerId;
  delete source.consumerId;
  await storeProfile(source, { overwriteProps: false, updateScrapeSettings: false });

  console.log('Source ' + consumerId + ' <-- ' + providerId + ' stored successfully.');
  await setCurUrlSourceStatus();
}

export async function saveOrSkipSource({ source, targetId, action }) {
  const consumerId = targetId;
  const db = await getDBPromise();

  let providerId = source.id;
  if (source.id == null) {
    providerId = source.url;
  }
  if (source.providerId != null) {
    providerId = source.providerId;
  }
  if (typeof providerId === 'object') {
    if (providerId.id != null) {
      providerId = providerId.id;
    }
    if (providerId.url != null) {
      providerId = providerId.url;
    }
  }

  if (source.points == null) {
    source.points = action === 'save' ? 1 : -1;
  }

  let sourceConnection = {};
  sourceConnection.points = source.points;
  sourceConnection[STORE_SOURCES_PROVIDERID] = trimmedUrl(providerId);
  sourceConnection[STORE_SOURCES_CONSUMERID] = consumerId;
  sourceConnection.saved = action === 'save' ? 1 : 0;
  sourceConnection.timeAdded = new Date();

  let storeObject = await db.get(STORE_SOURCES, [consumerId, providerId]);
  if (storeObject != null) {
    sourceConnection.points = sourceConnection.points - 0 + (storeObject.points - 0);
  }
  await db.put(STORE_SOURCES, sourceConnection);

  source.id = providerId;
  source.generatedBy = 'auto';
  delete source.providerId;
  delete source.consumerId;
  await storeProfile(source, { overwriteProps: false, updateScrapeSettings: false });

  console.log('Source ' + consumerId + ' <-- ' + providerId + ' stored successfully.');
  await setCurUrlSourceStatus();
}

export async function addLinks({ links, profileId }) {
  if (links == null) {
    return;
  }
  for (let i = 0; i < links.length; i++) {
    let link = links[i];
    if (typeof link === 'string') {
      link = { url: link };
    }
    link.profileId = profileId;
    link.timeAdded = new Date();
    await addLink(link);
  }
}

export async function updateProfileScrapeDate({ sourceUrl }) {
  let db = await getDBPromise();
  let source = await db.get(STORE_PROFILES, sourceUrl);
  if (source != null) {
    AutoGenProfile.incrementScrapeDate(source);
    await db.put(STORE_PROFILES, source);
  }
}

export async function changeSourcePoints(payload) {
  let source = payload.source;
  let db = await getDBPromise();
  source.url = trimmedUrl(source.url);
  source.profileId = payload.targetId;
  let storeObject = await db.get(STORE_SOURCES, [source.profileId, source.url]);
  if (storeObject != null) {
    storeObject.points += payload.pointsChange;
  }
  await db.put(STORE_SOURCES, source);
}

export async function removeLink(payload) {
  let db = await getDBPromise();
  let storeObj = await db.get(STORE_LINKS, [payload.targetId, payload.url]);
  if (storeObj != null && storeObj.sources != null) {
    for (let i = 0; i < storeObj.sources.length; i++) {
      let source = storeObj.sources[i];
      await changeSourcePoints({
        targetId: source.profileId,
        source,
        changePoints: -source.points,
      });
    }
  }
  await db.delete(STORE_LINKS, [payload.targetId, payload.url]);
  await setCurUrlLinkStatus();
}

export async function removeSource(payload) {
  let db = await getDBPromise();
  await db.delete(STORE_SOURCES, [payload.targetId, payload.url]);
  await setCurUrlSourceStatus();
}

export async function getScraper({ scraperId }) {
  let db = await getDBPromise();
  let out = db.get(STORE_SCRAPERS, scraperId);
  return out;
}

// export async function addScraper({ domain, getLinks, getSources, getSourcesOfLink, getPageAttributes, onScriptLoad }) {
export async function addScraper(scraper) {
  let db = await getDBPromise();
  for (let i in scraper) {
    if (typeof scraper[i] === 'function') {
      scraper[i] = scraper[i].toString();
    }
  }
  await db.put(STORE_SCRAPERS, scraper);
  await loadScrapers();
}

export async function saveScraper(scraper) {
  await saveObject(STORE_SCRAPERS, scraper);
  await loadScrapers();
}

export async function storeLinkSources(sources, profileId) {
  for (let i in sources) {
    let source = sources[i];
    source.profileId = profileId;
    storeLinkSource(source);
  }
}

export async function storeLinkSource(source) {
  let link = await getLink({ profileId: source.profileId, linkId: source.linkId });
  if (link == null) {
    return;
  }

  if (link.sources == null) {
    link.sources = [];
  }
  for (let i in link.sources) {
    if (link.sources[i].id === source.source.id) {
      return;
    }
  }

  if (source.source.generatedBy == null) {
    source.source.generatedBy = 'auto';
  }
  if (source.source.timeAdded == null) {
    source.source.timeAdded = new Date();
  }

  link.sources.push(source.source);

  let db = await getDBPromise();
  await db.put(STORE_LINKS, link);

  await storeSource({
    source,
    providerId: source.source.id,
    consumerId: source.profileId,
    pointsChange: source.source.points,
    overwrite: true,
  });
}

// export async function getLogsCursor() {
//   let out = null;
//   const db = await getDBPromise();
//   let tx = await db.transaction(STORE_LOGS);
//   let objStore = await tx.objectStore(STORE_LOGS);
//   let index = await objStore.index(INDEX_LOGS_TIME);
//   let cursor = await index.openCursor(null, 'prev');
//   // await tx.done;
//   out = cursor;
//   return out;
// }

function getIndexFromKeyPath(keyPath) {
  return keyPath.join(KEYPATH_SEPARATOR);
}

async function getCursor(query) {
  try {
    let out = null;
    let index = await getIndex(query);
    let cursor;
    if (query.lowerBounds.length > 0) {
      let keyRng = IDBKeyRange.bound(query.lowerBounds, query.upperBounds);
      cursor = await index.openCursor(keyRng);
    } else {
      cursor = await index.openCursor();
    }
    out = cursor;
    return out;
  } catch (e) {
    console.log('error getting cursor', e, query);
    debugger;
  }
}

async function getIndexFn(query) {
  const db = await getDBPromise();
  let tx = await db.transaction(query.storeName);
  let objStore = await tx.objectStore(query.storeName);
  if (query.keyPath.length === 0) {
    return objStore;
  }
  let index = await objStore.index(getIndexFromKeyPath(query.keyPath));
  return index;
}

export async function getIndex(query) {
  console.log('getting ' + query.storeName + ' by ', query);
  let index;
  try {
    index = await getIndexFn(query);
  } catch (e) {
    if (e.name === 'NotFoundError') {
      await createIndex(query.storeName, query.keyPath);
      index = await getIndexFn(query);
      if (index == null) {
        debugger;
      }
    }
  }
  return index;
}

export async function createIndex(storeName, keyPath) {
  let version = (await getDBVersion()) + 1;
  let keyPathName = keyPath.join(KEYPATH_SEPARATOR);

  let newDBPromise = await openDB(DB_NAME, version, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      console.log(db, oldVersion, newVersion, transaction, keyPath, keyPathName);
      const store = transaction.objectStore(storeName);
      store.createIndex(keyPathName, keyPath);
    },
    blocked() {
      debugger;
    },
    async blocking() {
      (await newDBPromise).close();
    },
    terminated() {
      debugger;
    },
  });
  setDBPromise(newDBPromise);
}

export async function deleteIndex(storeName, keyPathName) {
  let version = (await getDBVersion()) + 1;

  let newDBPromise = await openDB(DB_NAME, version, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      const store = transaction.objectStore(storeName);
      store.deleteIndex(keyPathName);
    },
    async blocking() {
      (await newDBPromise).close();
    },
  });
  setDBPromise(newDBPromise);
}

function getQueryFromFilters(filters, storeName) {
  let query = {
    keyPath: [],
    lowerBounds: [],
    upperBounds: [],
    storeName,
  };
  if (filters != null) {
    for (let i = 0; i < filters.length; i++) {
      let filter = filters[i];
      if (filter == null) {
        continue;
      }
      query.keyPath.push(filter.field);
      let lv = filter.lowerValue;
      if (lv == 'undefined' || lv === '' || lv == null) {
        lv = -Infinity;
      }
      let uv = filter.upperValue;
      if (uv == 'undefined' || uv === '' || uv == null) {
        uv = [Infinity, Infinity, Infinity];
      }
      if (!isNaN(+lv)) {
        lv = +lv;
      }
      if (!isNaN(+uv)) {
        uv = +uv;
      }
      query.lowerBounds.push(lv);
      query.upperBounds.push(uv);
    }
  }
  return query;
}

export async function getStoreResults({ storeName, filters, offset, numRows, newestFirst }) {
  let out = [];
  let query = getQueryFromFilters(filters, storeName);
  let cursor = await getCursor(query);
  if (cursor == null) {
    console.log('error getting cursor for ', query);
    debugger;
    return out;
  }

  if (offset > 0) {
    await cursor.advance(offset);
  }
  let hasMoreItems = true;
  for (let i = 0; i < numRows; i++) {
    if (!hasMoreItems) {
      break;
    }
    console.log('adding ', cursor.value);
    if (cursor.value === out[out.length - 1]) {
      break;
    }
    out.push(cursor.value);
    try {
      await cursor.continue();
    } catch (err) {
      console.log('no more items, stopping');
      hasMoreItems = false;
    }
  }
  return out;
}

export async function getNumResults({ storeName, filters }) {
  let query = getQueryFromFilters(filters, storeName);
  let index = await getIndex(query);
  if (index == null) {
    console.log('error getting index for ', query);
    debugger;
    return -1;
  }

  try {
    let keyRng = IDBKeyRange.bound(query.lowerBounds, query.upperBounds);
    let out = index.count(keyRng);
    return out;
  } catch (e) {
    console.log('error getting numResults', e, storeName, filters);
    debugger;
  }

  return -1;
}

export async function getIndices({ offset, numRows, storeNames }) {
  let out = [];
  const db = await getDBPromise();
  let indices = [];
  for (let s in storeNames) {
    let storeName = storeNames[s];
    let tx = await db.transaction(storeName);
    let objStore = await tx.objectStore(storeName);
    for (let i = 0; i < objStore.indexNames.length; i++) {
      indices.push({
        object: storeName,
        keyPath: objStore.indexNames[i],
      });
    }
    await tx.done;
  }

  if (offset >= indices.length) {
    return [];
  }

  numRows = Math.min(indices.length - offset, numRows);

  out = indices.splice(offset, numRows);

  return out;
}

// export async function getLogs({ offset, numRows, newestFirst }) {
//   let out = [];
//   const db = await getDBPromise();
//   let tx = await db.transaction(STORE_LOGS);
//   let objStore = await tx.objectStore(STORE_LOGS);
//   let index = await objStore.index(INDEX_LOGS_TIME);
//   let direction = 'next';
//   if (newestFirst) {
//     direction = 'prev';
//   }
//   let cursor = await index.openCursor(null, direction);
//   if (offset > 0) {
//     await cursor.advance(offset);
//   }
//   let hasMoreItems = true;
//   for (let i = 0; i < numRows; i++) {
//     if (!hasMoreItems) {
//       break;
//     }
//     console.log('adding ', cursor.value);
//     if (cursor.value === out[out.length - 1]) {
//       break;
//     }
//     out.push(cursor.value);
//     try {
//       await cursor.continue();
//     } catch (err) {
//       console.log('no more items, stopping');
//       hasMoreItems = false;
//     }
//   }
//   await tx.done;
//   return out;
// }

export async function getNumLogs() {
  let db = await getDBPromise();
  let out = await db.count(STORE_LOGS);
  return out;
}

export async function getNumIndices() {
  let db = await getDBPromise();
  let out = 0;
  for (let s in INDEX_STORES) {
    let indexStore = INDEX_STORES[s];
    const tx = db.transaction(indexStore);
    const store = tx.store;
    out += store.indexNames.length;
    await tx.done;
  }
  return out;
}

// export async function getNumProfiles() {
//   let db = await getDBPromise();
//   let out = await db.count(STORE_PROFILES);
//   return out;
// }

export async function deleteLog(id) {
  let db = await getDBPromise();
  await db.delete(STORE_LOGS, id);
}

export async function addLog({ objectKeys, objectType, message }) {
  let db = await getDBPromise();
  let msgObj = {
    objectKeys,
    objectType,
    message,
    time: new Date(),
  };
  await db.put(STORE_LOGS, msgObj);
}

// export async function addProfile(profile) {
//   if (profile.defaultLinkAction == null) {
//     profile.defaultLinkAction = 'save';
//   }
//   if (profile.defaultSourceAction == null) {
//     profile.defaultSourceAction = 'nothing';
//   }
//   if (profile.autoGenerated == null) {
//     profile.autoGenerated = false;
//   }
//   if (profile.name == null) {
//     profile.name = profile.id;
//   }

//   const db = await getDBPromise();
//   let links = profile.links;
//   let sources = profile.sources;
//   let pointsSave = profile.pointsSave;
//   let pointsSkip = profile.pointsSkip;
//   let points = profile.points;

//   await addLinks({
//     links,
//     profileId: profile.id,
//   });

//   Vue.delete(profile, 'links');
//   Vue.delete(profile, 'sources');

//   delete profile.saved;
//   delete profile.points;
//   delete profile.profileId;
//   delete profile.title;
//   delete profile.url;
//   delete profile.timeSaved;

//   profile.timeAdded = new Date();

//   console.log('Storing profile:', profile);

//   await db.put(STORE_PROFILES, profile);
//   await fetchProfiles();

//   profile.links = links;
//   profile.sources = sources;

//   if (pointsSave != null) profile.pointsSave = pointsSave;
//   if (pointsSkip != null) profile.pointsSkip = pointsSkip;
//   if (points != null) profile.points = points;
// }

export async function setTarget(profileId) {
  await dispatchToStores('setTarget', profileId);
  await setCurUrlLinkStatus();
  await setCurUrlSourceStatus();
  let profile = await getProfile(profileId);
  store.commit(types.SET_POPUP_PROFILE, profile);
}

export async function setCurUrlLinkStatus() {
  try {
    if (store.state.targetId == null) {
      console.log('no current target');
      await dispatchToStores('setCurUrlLinkStatus', 'neither');
      return;
    }
    if (store.state.curPage == null) {
      console.log('no current target');
      await dispatchToStores('setCurUrlLinkStatus', 'neither');
      return;
    }
    let url = store.state.curPage.url;
    if (url == null) {
      console.log('no link');
      await dispatchToStores('setCurUrlLinkStatus', 'neither');
      return;
    }
    url = trimmedUrl(url);

    let db = await getDBPromise();
    let link = await db.get(STORE_LINKS, [store.state.targetId, url]);
    if (link == null) {
      return;
    }
    await dispatchToStores('setCurUrlLinkStatus', link.saved);
  } catch (err) {
    console.log(err);
  }
}

export async function setCurUrlSourceStatus() {
  if (store.state.targetId == null) {
    store.commit(types.SET_CUR_URL_SOURCE_STATUS, 'neither');
    return;
  }
  if (store.state.curPage == null) {
    return;
  }
  let url = store.state.curPage.url;
  if (url == null) {
    store.commit(types.SET_CUR_URL_SOURCE_STATUS, 'neither');
    return;
  }
  url = trimmedUrl(url);
  let db = await getDBPromise();
  let link = await db.get(STORE_SOURCES, [store.state.targetId, url]);
  if (link == null) {
    store.commit(types.SET_CUR_URL_SOURCE_STATUS, 'neither');
  } else {
    store.commit(types.SET_CUR_URL_SOURCE_STATUS, link.saved);
  }
}
