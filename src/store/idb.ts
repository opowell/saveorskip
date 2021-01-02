import store from './index';
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
  LINK_STATUS,
  STORE_SCRAPING_QUEUE,
  STORE_SCRAPING_QUEUE_PROFILEID,
  STORE_SCRAPING_QUEUE_TIMEQUEUED,
} from './Constants';
import * as types from './mutation-types';
import { trimmedUrl, drawRandomElFromObject, scoreFnJustPoints, convertId } from '../Utils';
import { MessageEventBus } from '../options/Constants';
import Profile from '../models/Profile';

const state: any = store.state;

export async function getLinkStatus(profileId: string | number, pageUrl: string, bgState: Object) {
  // console.log('getLinkStatus', profileId, pageUrl);
  try {
    if (typeof profileId === 'number' && isNaN(profileId)) return;
    let db = await getDBPromise(bgState);
    profileId = convertId(profileId);
    let link = await db.get(STORE_LINKS, [profileId, pageUrl]);
    if (link == null) {
      return 'neither';
    }
    return link.saved;
  } catch (err) {
    // console.log('getLinkStatus', err, profileId, pageUrl);
  }
  return 'neither';
}

export async function getSourceStatus(profileId: string | number, pageUrl: string, bgState: Object) {
  if (typeof profileId === 'number') {
    if (isNaN(profileId)) return;
  }
  let db = await getDBPromise(bgState);
  profileId = convertId(profileId);
  try {
    let link = await db.get(STORE_SOURCES, [profileId, pageUrl]);
    if (link == null) {
      return 'neither';
    } else {
      return link.saved;
    }
  } catch (err) {
    // console.log('getSourceStatus: error, returning neither', err, profileId, pageUrl);
    return 'neither';
  }
}

export async function removePageToScrape(url: string, bgState: Object) {
  let db = await getDBPromise(bgState);
  url = convertId(url);
  await db.delete(STORE_SCRAPING_QUEUE, url);
}

export async function getNextPageToScrape(bgState: Object) {
  let db = await getDBPromise(bgState);
  let out = await db.getAllFromIndex(STORE_SCRAPING_QUEUE, STORE_SCRAPING_QUEUE_TIMEQUEUED);
  if (out.length < 1) return null;
  out[0].status = 'started';
  await db.put(STORE_SCRAPING_QUEUE, out[0]);
  return out[0];
}

export async function storePage(page: any, profileId: number | string, linkAction: any, sourceAction: any, bgState: Object) {
  if (page == null) {
    return;
  }

  let numNewLinksFound = 0;

  for (let i in page.links) {
    let link = page.links[i];
    if (typeof link === 'string') {
      link = { url: link };
    }
    link.url = trimmedUrl(link.url);
    if (link.saved == null) {
      link.saved = LINK_STATUS.SAVED;
    }
    link.profileId = page.url;
    numNewLinksFound += await addLink(link, bgState);
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

  page.generatedBy = 'auto';
  await storeProfile(page, { overwriteProps: false, updateScrapeSettings: true, numNewLinksFound }, bgState);
  await saveOrSkipLink(linkAction, profileId, page, bgState);
  await saveOrSkipSource(sourceAction, profileId, page, bgState);
}

export async function parseBrowserHistory(bgState: Object, { consumerId, maxScrapes = 20 }) {
  state.isScraperRunning = true;

  const microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  const oneWeekAgo = new Date().getTime() - microsecondsPerWeek;
  let numMatches = 0;

  let parseSearch = async function(historyItems) {
    for (let i = 0; i < historyItems.length; ++i) {
      if (numMatches >= maxScrapes) break;
      let url = historyItems[i].url;
      url = trimmedUrl(url);
      if (url.startsWith('chrome-extension://')) continue;
      let srcObj = {
        source: {
          saved: 1,
        },
        providerId: url,
        consumerId,
        pointsChange: 3,
        overwrite: false,
      };
      await storeSource(srcObj, bgState);
      await addLink({ profileId: consumerId, url }, bgState);
      await scrapeIfNecessary(bgState, { id: url });
      numMatches++;
    }
    state.isScraperRunning = false;
    await startScraping(bgState);
  };

  chrome.history.search(
    {
      text: '',
      startTime: oneWeekAgo,
    },
    parseSearch
  );
}

export async function addProfileChildrenCounts(profile: { [k: string]: any; id: string | number }, bgState: Object) {
  profile['Links'] = await getNumResults(
    {
      storeName: STORE_LINKS,
      filters: [
        {
          field: STORE_LINKS_PROFILEID,
          lowerValue: profile.id,
          upperValue: profile.id,
        },
      ],
    },
    bgState
  );
  profile['Sources'] = await getNumResults(
    {
      storeName: STORE_SOURCES,
      filters: [
        {
          field: STORE_SOURCES_CONSUMERID,
          lowerValue: profile.id,
          upperValue: profile.id,
        },
      ],
    },
    bgState
  );
  profile['Logs'] = await getNumResults(
    {
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
    },
    bgState
  );
}

export async function loadProfile(payload: any, bgState: Object) {
  let profileId = payload.profileId;
  const db = await getDBPromise(bgState);
  let profile = await db.get(STORE_PROFILES, profileId);
  await addProfileChildrenCounts(profile, bgState);
  return profile;
}

export async function setSkippedLinkIfNew(profileId: string | number, link: any, bgState: Object) {
  if (link == null || link.url == null) {
    return;
  }
  link.url = trimmedUrl(link.url);
  const db = await getDBPromise(bgState);
  let storeItem = await db.get(STORE_LINKS, [profileId, link.url]);
  if (storeItem != null) {
    return;
  }
  await saveOrSkipLink(LINK_STATUS.SKIPPED, profileId, link, bgState);
}

export async function setTestPage(page: any) {}

export async function setSkippedSourceIfNew(profileId: number | string, source: any, bgState: Object) {
  if (source == null || source.url == null) {
    // console.log('no url given');
    return;
  }
  source.id = trimmedUrl(source.url);
  source.name = source.title;
  let prevUrl = source.id;
  let prevTitle = source.title;
  delete source.url;
  delete source.title;
  const db = await getDBPromise(bgState);
  let storeItem = await db.get(STORE_PROFILES, source.id);
  if (storeItem != null) {
    for (let i in source.links) {
      if (typeof source.links[i] === 'string') {
        source.links[i] = { url: source.links[i] };
      }
      source.links[i].saved = 1;
    }
    await addLinks(
      {
        links: source.links,
        profileId: source.id,
      },
      bgState
    );
    for (let i in source.sources) {
      if (typeof source.sources[i] === 'string') {
        source.sources[i] = { providerId: source.sources[i] };
      }
      source.sources[i].consumerId = source.id;
      source.sources[i].points = 0;
      source.sources[i].generatedBy = 'auto';
    }
    await addSources(
      {
        sources: source.sources,
      },
      bgState
    );
    incrementScrapeDate(storeItem);
    await db.put(STORE_PROFILES, storeItem);
    source.url = prevUrl;
    source.title = prevTitle;
    return;
  }
  source.points = 0;
  source.generatedBy = 'auto';
  incrementScrapeDate(source);
  await saveOrSkipSource(LINK_STATUS.SKIPPED, profileId, source, bgState);
  source.url = prevUrl;
  source.title = prevTitle;
}

export async function setDefaultLinkAction(profileId: number | string, action: string, bgState: Object) {
  let profile = await getProfile(profileId, bgState);
  if (profile == null) {
    return;
  }
  profile.defaultLinkAction = action;
  let db = await getDBPromise(bgState);
  await db.put(STORE_PROFILES, profile);
}

export async function setDefaultSourceAction(profileId: number | string, action: string, bgState: Object) {
  let profile = await getProfile(profileId, bgState);
  if (profile == null) {
    return;
  }
  profile.defaultSourceAction = action;
  let db = await getDBPromise(bgState);
  await db.put(STORE_PROFILES, profile);
}

export async function getLink({ profileId, linkId, createIfNecessary = false }: { profileId: string | number; linkId: string; createIfNecessary?: boolean }, bgState: Object) {
  let db = await getDBPromise(bgState);
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

export async function loadLink({ profileId, linkId }: { profileId: string | number; linkId: string }, bgState: Object) {
  let out = await getLink({ profileId, linkId, createIfNecessary: false }, bgState);
  return out;
}

export async function loadSource(key: any, bgState: Object) {
  const db = await getDBPromise(bgState);
  let out = await db.get(STORE_SOURCES, key);
  // out.Links = await db.countFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, key[1]);
  return out;
}

export async function deleteLink({ profileId, linkId }: { profileId: string | number; linkId: string }, bgState: Object) {
  let db = await getDBPromise(bgState);
  await db.delete(STORE_LINKS, [profileId, linkId]);
}

export async function deleteObject(store: string, key: any, bgState: Object) {
  let db = await getDBPromise(bgState);
  try {
    await db.delete(store, key);
  } catch (e) {
    // console.log(e);
    // console.log(e.stack);
  }
}

export async function saveLink(link: Object, bgState: Object) {
  let db = await getDBPromise(bgState);
  try {
    await db.put(STORE_LINKS, link);
  } catch (e) {
    // console.log(e);
    // console.log(e.stack);
  }
}

export async function saveObject(storeName: string, object: Object, bgState: Object) {
  let db = await getDBPromise(bgState);
  try {
    let objKey = await db.put(storeName, object);
    return objKey;
  } catch (e) {
    // console.log(storeName, object);
    // console.log(e);
    // console.log(e.stack);
  }
}

export async function getProfile(id: string | number, bgState: Object) {
  if (!id) {
    return null;
  }
  if (typeof id === 'number' && isNaN(id)) {
    return null;
  }
  try {
    let db = await getDBPromise(bgState);
    let out = await db.get(STORE_PROFILES, id);
    Object.setPrototypeOf(out, Profile.prototype);
    for (let i in out) {
      if (i.startsWith('__fnStr_')) {
        const fieldName = i.replace('__fnStr_', '');
        eval(`out[${fieldName}] = ${out.i}`);
      }
    }
    return out;
  } catch (err) {
    // console.log('Error getting profile ' + id, err);
    return null;
  }
}

export async function storeProfile(
  profile: any,
  {
    overwriteProps = false,
    updateScrapeSettings = false,
    numNewLinksFound = 0,
    keepExistingProps = true,
  }: { overwriteProps?: boolean; updateScrapeSettings?: boolean; numNewLinksFound?: number; keepExistingProps?: boolean },
  bgState: Object
) {
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
    storeProfile = await getProfile(profile.id, bgState);
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

  // for (let i in profile.links) {
  //   let link = profile.links[i];
  //   if (typeof link === 'string') {
  //     link = { url: link };
  //   }
  //   link.profileId = profile.id;
  //   numNewLinksFound += await addLink(link);
  // }

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

  let objKey = await saveObject(STORE_PROFILES, storeProfile, bgState);

  addLog(
    {
      objectKeys: objKey,
      objectType: 'Profile',
      message: 'Store',
    },
    bgState
  );

  for (let i in tempStorage) {
    let { field, value } = tempStorage[i];
    if (value != null) {
      profile[field] = value;
    }
  }
}

export async function fetchProfiles(filters: Array<any>, numRows: number, bgState: Object) {
  const values = await getStoreResults({ storeName: 'profiles', filters, offset: 0, numRows }, bgState);
  for (let i = 0; i < values.length; i++) {
    addProfileChildrenCounts(values[i], bgState);
  }
  return values;
}

export async function getScrapers(bgState: Object) {
  try {
    const db = await getDBPromise(bgState);
    const values = await db.getAll(STORE_SCRAPERS);
    return values;
  } catch (err) {
    // console.log(err);
    return;
  }
}

export async function scrapeIfNecessary(bgState: Object, source: { [k: string]: any; id: string | number; providerId?: string | number }) {
  let profileId = source.id;
  if (source.providerId != null) {
    profileId = source.providerId;
  }
  let now = new Date();
  let profile = await getProfile(profileId, bgState);
  addLog(
    {
      objectKeys: 'general',
      objectType: 'none',
      message: 'comparing now to next scrape date: ' + now + ' vs. ' + profile.nextScrape,
    },
    bgState
  );
  if (profile.nextScrape == null || new Date(profile.nextScrape) < now) {
    scrapeProfile(profileId, bgState);
  }
}

export async function scrapeProfile(url: string | number, bgState: Object) {
  if (typeof url !== 'string') {
    return;
  }
  if (url.startsWith('chrome://')) return;
  if (url.startsWith('chrome-extension://')) return;
  // console.log('queueing url to scrape ' + url);
  let db = await getDBPromise(bgState);
  let payload = {
    status: 'not started', // started
  };
  payload[STORE_SCRAPING_QUEUE_PROFILEID] = url;
  payload[STORE_SCRAPING_QUEUE_TIMEQUEUED] = new Date();
  let objectKeys = await db.put(STORE_SCRAPING_QUEUE, payload);
  // Check that scraper is running. If not, start.
  // state.urlsToScrape[url] = true;
  // chrome.tabs.create({ url: 'http://' + url, active: false });
  // console.log('CHECKING');
  if (!state.isScraperRunning) {
    // console.log('STARTING');
    state.isScraperRunning = true;
    // chrome.runtime.sendMessage('startScraping');
    await startScraping(bgState);
  }
}

export async function startScraping(bgState: any) {
  // console.log('starting scraper!');
  state.isScraperRunning = true;
  const nextUrl = await getNextPageToScrape(bgState);
  chrome.tabs.create({ url: 'http://' + nextUrl[STORE_SCRAPING_QUEUE_PROFILEID], active: false }, tab => {
    // console.log('storing scraper tab id', tab, store.state);
    if (bgState == null) {
      // console.log('no bg state, returning')
      return;
    }
    bgState.scraperTabId = tab.id;
    // console.log('bgState', bgState, bgState.scraperTabId);
  });
}

export async function getSuggestion(bgState: Object, profileId: string | number) {
  try {
    let consumer = await getProfile(profileId, bgState);
    const suggestion = consumer.getSuggestion(this, bgState);
    return suggestion;
  } catch (err) {
    // console.log(err);
  }
}

export async function getProfileSources(profileId: string | number, bgState: Object) {
  console.log('getProfileSources', STORE_SOURCES, STORE_SOURCES_CONSUMERID, profileId);
  let db = await getDBPromise(bgState);
  let out = await db.getAllFromIndex(STORE_SOURCES, STORE_SOURCES_CONSUMERID, [profileId]);
  return out;
}

export async function getLinks(profileId: string | number, bgState: Object) {
  let db = await getDBPromise(bgState);
  let out = await db.getAllFromIndex(STORE_LINKS, STORE_LINKS_PROFILEID, profileId);
  return out;
}

export async function getScrapingQueue({ filters, offset, numRows, sortOrder }, bgState: Object) {
  let db = await getDBPromise(bgState);
  // let out = await db.getAllFromIndex(STORE_SCRAPING_QUEUE, STORE_SCRAPING_QUEUE_PROFILEID, profileId);
  let items = await this.getStoreResults({
    storeName: STORE_SCRAPING_QUEUE,
    filters,
    offset,
    numRows,
    sortOrder,
  });
  return items;
}

export async function deleteProfile(payload: any, bgState: Object) {
  let db = await getDBPromise(bgState);
  await db.delete(STORE_PROFILES, payload.profileId);
  return true;
}

export async function loadScrapers(bgState: Object) {
  let scrapers = await getScrapers(bgState);
  store.commit(types.LOAD_SCRAPERS, scrapers);
  // console.log('scrapers: ' + JSON.stringify(state.scrapers));
}

export async function deleteScraper({ scraperId }: { scraperId: number }, bgState: Object) {
  let db = await getDBPromise(bgState);
  await db.delete(STORE_SCRAPERS, scraperId);
}

export async function deleteProfileSource({ profileId, sourceId }: { profileId: string | number; sourceId: string | number }, bgState: Object) {
  let db = await getDBPromise(bgState);
  await db.delete(STORE_SOURCES, [profileId, sourceId]);
}

export async function addLink(payload: any, bgState: Object): Promise<number> {
  let numNewLinks = 0;

  if (payload.profileId === payload.url) {
    return 0;
  }
  payload.url = trimmedUrl(payload.url);

  let db = await getDBPromise(bgState);
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
  try {
    let objectKeys = await db.put(STORE_LINKS, payload);
    await addLog(
      {
        objectKeys,
        objectType: 'Link',
        message: 'Store',
      },
      bgState
    );
  } catch (err) {
    console.log('error storing link', payload, err);
  }

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

export async function addSources({ sources }: { sources: Array<any> }, bgState: Object) {
  if (!Array.isArray(sources)) {
    return;
  }
  for (let i = 0; i < sources.length; i++) {
    let source = sources[i];
    await saveOrSkipSource(LINK_STATUS.SAVED, source.consumerId, source, bgState);
  }
  // await setCurUrlSourceStatus();
}

export async function setSourceSaved(payload: any, bgState: Object) {
  let db = await getDBPromise(bgState);
  let storeName = STORE_SOURCES;
  let link: { [k: string]: any; [k: number]: any } = {
    url: trimmedUrl(payload.link.url),
    title: payload.link.title,
    saved: payload.action,
    profileId: payload.profileId,
  };
  if (payload.props != null) {
    let propKeys = Object.keys(payload.props);
    for (let i = 0; i < propKeys.length; i++) {
      let propKey = propKeys[i];
      link[propKey] = payload.props[propKey];
    }
  }
  // console.log('Storing source:', link);
  await db.put(storeName, link);
  // console.log('Source "' + payload.link.url + '" stored successfully.');
  // await setCurUrlSourceStatus();
  // chrome.runtime.sendMessage('save');
}

export async function setLinkStatus(url: string, action: number, profileId: number | string, page: Object, bgState: Object) {
  return await saveOrSkipLink(action, profileId, page, bgState);
}

export async function saveOrSkipLink(action: number, profileId: number | string, link = <any>{}, bgState: Object) {
  link.url = trimmedUrl(link.url);
  link.saved = action;
  link.profileId = profileId;
  link.timeAdded = new Date();

  let db = await getDBPromise(bgState);
  // console.log('saving or skipping', action, profileId, link);
  let storeObject = await db.get(STORE_LINKS, [profileId, link.url]);

  // If necessary, reverse previous action.
  if (storeObject != null && storeObject.saved !== link.saved) {
    let sources = link.sources;
    for (let i in sources) {
      let source = sources[i];
      let consumerId = source.profileId;
      if (consumerId == null) consumerId = source.consumerId;
      storeSource(
        {
          source,
          providerId: source.id,
          consumerId,
          overwrite: false,
          pointsChange: source.points,
        },
        bgState
      );
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
      if (action === LINK_STATUS.SAVED) {
        source.points = source.pointsSave;
      } else {
        source.points = source.pointsSkip;
      }
    }
    await saveOrSkipSource(
      LINK_STATUS.SKIPPED, // TODO: check if source exists. update, instead of overwrite.
      profileId,
      source,
      bgState
    );
  }

  addLink(link, bgState);
}

export async function storeLink(profileId: number | string, link = <any>{}, bgState: Object) {
  link.url = trimmedUrl(link.url);
  link.profileId = profileId;
  link.timeAdded = new Date();

  // console.log('saving or skipping', profileId, link);
  let profile = await getProfile(profileId, bgState);
  await profile.storeLink(this, link, bgState);
}

export async function storeSource(
  {
    source,
    providerId,
    consumerId,
    pointsChange,
    overwrite,
  }: {
    source: { [k: string]: any };
    providerId: string | number;
    consumerId: string | number;
    pointsChange: number;
    overwrite: boolean;
  },
  bgState: Object
) {
  // console.log('idb.storeSource', source, providerId, consumerId, pointsChange, overwrite);

  const db = await getDBPromise(bgState);

  if (providerId == null) {
    providerId = source.url;
  }

  if (consumerId == null) {
    // console.log('no consumer given, stopping...');
    return;
  }
  let profile = await db.get(STORE_PROFILES, consumerId);
  if (profile == null) {
    return;
  }
  if (profile.storeSource != null) {
    // setIfNotNull(profile, 'storeSource');
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
  await storeProfile(source, { overwriteProps: false, updateScrapeSettings: false }, bgState);

  // console.log('Source ' + consumerId + ' <-- ' + providerId + ' stored successfully.');
  // await setCurUrlSourceStatus();
}

export async function saveOrSkipSource(
  action: number,
  profileId: number | string,
  source: {
    generatedBy: string;
    id: string | number;
    url: string;
    points: number;
    providerId:
      | string
      | number
      | {
          id: string | number;
        };
    consumerId?: string | number;
  },
  bgState: Object
) {
  const consumerId = profileId;
  const db = await getDBPromise(bgState);

  let providerId = source.id;
  if (source.id == null) {
    providerId = source.url;
  }
  if (source.providerId != null) {
    // @ts-ignore
    providerId = source.providerId;
  }
  if (typeof providerId === 'object') {
    // @ts-ignore
    if (providerId.id != null) {
      // @ts-ignore
      providerId = providerId.id;
    }
    // @ts-ignore
    if (providerId.url != null) {
      // @ts-ignore
      providerId = providerId.url;
    }
  }

  if (source.points == null) {
    source.points = action === LINK_STATUS.SAVED ? 1 : -1;
  }

  let sourceConnection: { [k: string]: any; points?: number; saved?: number; timeAdded?: Date } = {};
  sourceConnection.points = source.points;
  sourceConnection[STORE_SOURCES_PROVIDERID] = trimmedUrl(providerId);
  sourceConnection[STORE_SOURCES_CONSUMERID] = consumerId;
  sourceConnection.saved = action === LINK_STATUS.SAVED ? 1 : 0;
  sourceConnection.timeAdded = new Date();

  let storeObject = await db.get(STORE_SOURCES, [consumerId, providerId]);
  if (storeObject != null) {
    sourceConnection.points = sourceConnection.points - 0 + (storeObject.points - 0);
  }
  let objKey = await db.put(STORE_SOURCES, sourceConnection);

  addLog(
    {
      objectKeys: objKey,
      objectType: 'Source',
      message: 'Store',
    },
    bgState
  );

  source.id = providerId;
  source.generatedBy = 'auto';
  delete source.providerId;
  delete source.consumerId;
  await storeProfile(source, { overwriteProps: false, updateScrapeSettings: false }, bgState);
}

export async function addLinks({ links, profileId }: { links: Array<any>; profileId: string | number }, bgState: Object) {
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
    await addLink(link, bgState);
  }
}

export function incrementScrapeDate(source: { nextScrape: Date }) {
  source.nextScrape = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
}

export async function updateProfileScrapeDate({ sourceUrl }: { sourceUrl: string }, bgState: Object) {
  let db = await getDBPromise(bgState);
  let source = await db.get(STORE_PROFILES, sourceUrl);
  if (source != null) {
    incrementScrapeDate(source);
    await db.put(STORE_PROFILES, source);
  }
}

export async function changeSourcePoints(payload: any, bgState: Object) {
  let source = payload.source;
  let db = await getDBPromise(bgState);
  source.url = trimmedUrl(source.url);
  source.profileId = payload.targetId;
  let storeObject = await db.get(STORE_SOURCES, [source.profileId, source.url]);
  if (storeObject != null) {
    storeObject.points += payload.pointsChange;
  }
  await db.put(STORE_SOURCES, source);
}

export async function removeLink(payload: any, bgState: Object) {
  let db = await getDBPromise(bgState);
  let storeObj = await db.get(STORE_LINKS, [payload.targetId, payload.url]);
  if (storeObj != null && storeObj.sources != null) {
    for (let i = 0; i < storeObj.sources.length; i++) {
      let source = storeObj.sources[i];
      await changeSourcePoints(
        {
          targetId: source.profileId,
          source,
          changePoints: -source.points,
        },
        bgState
      );
    }
  }
  await db.delete(STORE_LINKS, [payload.targetId, payload.url]);
  // await setCurUrlLinkStatus();
}

export async function removeSource(payload: { targetId: string | number; url: string | number }, bgState: Object) {
  let db = await getDBPromise(bgState);
  await db.delete(STORE_SOURCES, [payload.targetId, payload.url]);
}

export async function getScraper({ scraperId }: { scraperId: number }, bgState: Object) {
  let db = await getDBPromise(bgState);
  let out = db.get(STORE_SCRAPERS, scraperId);
  return out;
}

// export async function addScraper({ domain, getLinks, getSources, getSourcesOfLink, getPageAttributes, onScriptLoad }) {
export async function addScraper(scraper: { [k: string]: any }, bgState: Object) {
  let db = await getDBPromise(bgState);
  for (let i in scraper) {
    if (typeof scraper[i] === 'function') {
      scraper[i] = scraper[i].toString();
    }
  }
  await db.put(STORE_SCRAPERS, scraper);
  await loadScrapers(bgState);
}

export async function saveScraper(scraper: Object, bgState: Object) {
  await saveObject(STORE_SCRAPERS, scraper, bgState);
  await loadScrapers(bgState);
}

export async function storeLinkSources(sources: Array<any>, profileId: string | number, bgState: Object) {
  for (let i in sources) {
    let source = sources[i];
    source.profileId = profileId;
    storeLinkSource(source, bgState);
  }
}

export async function storeLinkSource(source: any, bgState: Object) {
  if (source.profileId == null) {
    // console.log('no profileId, stopping');
    return;
  }

  let link = await getLink({ profileId: source.profileId, linkId: source.linkId }, bgState);
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

  let db = await getDBPromise(bgState);
  await db.put(STORE_LINKS, link);

  await storeSource(
    {
      source,
      providerId: source.source.id,
      consumerId: source.profileId,
      pointsChange: source.source.points,
      overwrite: true,
    },
    bgState
  );
}

function getIndexFromKeyPath(keyPath: Array<string | number>) {
  return keyPath.join(KEYPATH_SEPARATOR);
}

async function getCursor(query: any, bgState: Object) {
  try {
    let out = null;
    let index = await getIndex(query, bgState);
    if (index == null) {
      return;
    }
    let cursor;
    if (query.lowerBounds.length > 0) {
      let keyRng = IDBKeyRange.bound(query.lowerBounds, query.upperBounds);
      cursor = await index.openCursor(keyRng, query.direction);
    } else {
      cursor = await index.openCursor();
    }
    out = cursor;
    return out;
  } catch (e) {
    // console.log('error getting cursor', e, query);
  }
}

async function getIndexFn(query: any, bgState: Object) {
  try {
    const db = await getDBPromise(bgState);
    let tx = db.transaction(query.storeName);
    let objStore = tx.objectStore(query.storeName);
    if (query.keyPath.length === 0) {
      return objStore;
    }
    let index = objStore.index(getIndexFromKeyPath(query.keyPath));
    return index;
  } catch (e) {
    throw e;
  }
}

export async function getIndex(query: any, bgState: Object) {
  // console.log('getting ' + query.storeName + ' by ', query);
  let index;
  try {
    index = await getIndexFn(query, bgState);
  } catch (e) {
    if (e.name === 'NotFoundError') {
      await createIndex(query.storeName, query.keyPath);
      index = await getIndexFn(query, bgState);
    } else {
      console.log(e);
    }
  }
  if (index == null) {
    console.log('error getting index for ', query);
  }
  return index;
}

export async function createIndex(storeName: string, keyPath: Array<string>) {
  let version = (await getDBVersion()) + 1;
  let keyPathName = keyPath.join(KEYPATH_SEPARATOR);

  let newDBPromise = openDB(DB_NAME, version, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      // console.log(db, oldVersion, newVersion, transaction, keyPath, keyPathName);
      const store = transaction.objectStore(storeName);
      store.createIndex(keyPathName, keyPath);
    },
    async blocking() {
      // console.log('blocking something, closing');
      this.close();
    },

    blocked() {
      // console.log('blocked');
    },
  });
  setDBPromise(newDBPromise);
  await newDBPromise;
}

export async function deleteIndex(storeName: string, keyPathName: string) {
  let version = (await getDBVersion()) + 1;

  let newDBPromise = openDB(DB_NAME, version, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      const store = transaction.objectStore(storeName);
      store.deleteIndex(keyPathName);
    },
    async blocking() {
      // console.log('blocking something, closing');
      this.close();
    },

    blocked() {
      // console.log('blocked');
    },
  });
  setDBPromise(newDBPromise);
  await newDBPromise;
}

function getQueryFromFilters(
  storeName: string,
  filters?: Array<{ field: string; lowerValue: string | number; upperValue: string | number; [k: string]: any }>,
  sortOrder = 'increasing'
) {
  let query = {
    keyPath: [],
    lowerBounds: [],
    upperBounds: [],
    storeName,
    direction: 'next',
  };

  if (sortOrder === 'decreasing') {
    query.direction = 'prev';
  }

  if (filters != null) {
    for (let i = 0; i < filters.length; i++) {
      let filter = filters[i];
      if (filter == null) {
        continue;
      }
      query.keyPath.push(filter.field);
      let lv: string | number = filter.lowerValue;
      if (lv == 'undefined' || lv === '' || lv == null) {
        lv = -Infinity;
      }
      let uv: string | number | Array<any> | null = filter.upperValue;
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

export async function getStoreResults(
  {
    storeName,
    filters = [],
    offset = 0,
    numRows = 100,
    sortOrder = 'increasing',
  }: {
    storeName: string;
    filters: Array<any>;
    offset: number;
    numRows: number;
    sortOrder?: string;
  },
  bgState: Object
) {
  // console.log('getStoreResults', storeName, filters, offset, numRows, sortOrder);
  let out: Array<any> = [];
  let query = getQueryFromFilters(storeName, filters, sortOrder);
  let cursor = await getCursor(query, bgState);
  if (cursor == null) {
    console.log('error getting cursor for ', query);
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
    if (cursor.value === out[out.length - 1]) {
      break;
    }
    out.push(cursor.value);
    try {
      await cursor.continue();
    } catch (err) {
      // console.log('no more items, stopping');
      hasMoreItems = false;
    }
  }
  return out;
}

export async function getNumResults({ storeName, filters }: { storeName: string; filters: Array<any> }, bgState: Object) {
  // console.log('getNumResults', storeName, filters)
  let query = getQueryFromFilters(storeName, filters);
  let index = await getIndex(query, bgState);
  if (index == null) {
    return -1;
  }

  try {
    let out;
    if (query.lowerBounds.length > 0) {
      let keyRng = IDBKeyRange.bound(query.lowerBounds, query.upperBounds);
      out = await index.count(keyRng);
    } else {
      out = await index.count();
    }
    return out;
  } catch (e) {
    console.log('error getting numResults', e, storeName, filters);
  }

  return -1;
}

export async function getIndices(
  {
    offset,
    numRows,
    filters,
    storeNames,
    sortOrder,
  }: {
    offset: number;
    numRows: number;
    filters: Array<any>;
    storeNames: Array<string>;
    sortOrder: string;
  },
  bgState: Object
) {
  let out = [];
  const db = await getDBPromise(bgState);
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

export async function getNumLogs(bgState: Object) {
  let db = await getDBPromise(bgState);
  let out = await db.count(STORE_LOGS);
  return out;
}

export async function getNumIndices(bgState: Object) {
  let db = await getDBPromise(bgState);
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

export async function getLengthScrapingQueue(filters) {
  return await this.getNumResults({ storeName: STORE_SCRAPING_QUEUE, filters });
}

export async function deleteLog(id: number | string, bgState: Object) {
  let db = await getDBPromise(bgState);
  await db.delete(STORE_LOGS, id);
}

export async function addLog({ objectKeys, objectType, message }: { objectKeys: any; objectType: string; message: string }, bgState: Object) {
  let db = await getDBPromise(bgState);
  let msgObj = {
    objectKeys,
    objectType,
    message,
    time: new Date(),
  };
  await db.put(STORE_LOGS, msgObj);
  let popupMessage = objectType + ' ' + JSON.stringify(objectKeys) + ': ' + message;
  MessageEventBus.$emit('showMessage', popupMessage);
}

export async function getCurUrlLinkStatus(bgState: Object) {
  try {
    if (state.profileId == null) {
      return 'neither';
    }
    if (state.pageUrl == null) {
      return 'neither';
    }
    let url = state.pageUrl;
    url = trimmedUrl(url);

    let db = await getDBPromise(bgState);
    let link = await db.get(STORE_LINKS, [state.profileId, url]);
    if (link == null) {
      return 'neither';
    }
    return link.saved;
  } catch (err) {
    console.log(err);
  }
  return 'neither';
}

export async function getCurUrlSourceStatus(bgState: Object) {
  if (state.profileId == null) {
    return 'neither';
  }
  let url = state.pageUrl;
  if (url == null) {
    return 'neither';
  }
  url = trimmedUrl(url);
  let db = await getDBPromise(bgState);
  let link = await db.get(STORE_SOURCES, [state.profileId, url]);
  if (link == null) {
    return 'neither';
  } else {
    return link.saved;
  }
}
