import store from './index.js';
import {
  dbPromise,
  STORE_LINKS,
  STORE_PROFILES,
  STORE_SOURCES,
  INDEX_LINKS_PROFILEID,
  INDEX_SOURCES_CONSUMERID,
  INDEX_LINKS_PROFILEID_TIMEADDED,
  STORE_LINKS_TIME_ADDED,
  STORE_SOURCES_CONSUMERID,
  STORE_SOURCES_PROVIDERID,
} from './Constants.ts';
import * as AutoGenProfile from '../models/AutoGenProfile.js';
import * as types from './mutation-types.js';

function trimmedUrl(url) {
  if (url == null) {
    return null;
  }

  if (url.includes == null) {
    return url;
  }

  if (url.includes('://')) {
    url = url.substring(url.indexOf('://') + '://'.length);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }

  return url;
}

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

export async function setCurLink(payload) {
  await dispatchToStores('setCurUrl', payload);
  await setCurUrlLinkStatus();
  await setCurUrlSourceStatus();
}

export async function loadProfile(payload) {
  let profileId = payload.profileId;
  if (!isNaN(profileId)) {
    profileId = profileId - 0;
  }
  const db = await dbPromise;
  let profile = await db.get(STORE_PROFILES, profileId);
  profile['Links'] = await db.countFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, profile.id);
  profile['Sources'] = await db.countFromIndex(STORE_SOURCES, INDEX_SOURCES_CONSUMERID, profile.id);
  dispatchToStores('loadProfile', profile);
}

export async function loadSources(payload) {
  let db = await dbPromise;
  let out = await db.getAllFromIndex(STORE_SOURCES, INDEX_SOURCES_CONSUMERID, payload.profileId - 0);
  for (let i = 0; i < out.length; i++) {
    // eslint-disable-next-line prettier/prettier
    out[i]['Links'] = await db.countFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, [out[i].profileId, out[i].url]);
  }
  dispatchToStores('loadSources', out);
}

export async function setSkippedLinkIfNew(profileId, link) {
  if (link == null || link.url == null) {
    return;
  }
  link.url = trimmedUrl(link.url);
  let storeItem = null;
  const db = await dbPromise;
  storeItem = await db.get(STORE_LINKS, [profileId - 0, link.url]);
  if (storeItem != null) {
    return;
  }
  saveOrSkipLink({
    action: 'skip',
    targetId: profileId,
    link,
  });
}

export async function setSkippedSourceIfNew(profileId, source) {
  if (source == null || source.url == null) {
    console.log('no url given');
    return;
  }
  source.id = trimmedUrl(source.url);
  source.name = source.title;
  delete source.url;
  delete source.title;
  const db = await dbPromise;
  let storeItem = await db.get(STORE_PROFILES, source.id);
  if (storeItem != null) {
    await addLinks({
      links: source.links,
      profileId: source.id,
    });
    AutoGenProfile.incrementScrapeDate(storeItem);
    await db.put(STORE_PROFILES, storeItem);
    return;
  }
  source.points = 0;
  AutoGenProfile.incrementScrapeDate(source);
  await saveOrSkipSource({
    action: 'skip',
    targetId: profileId,
    source,
  });
}

export async function loadLinks(payload) {
  await dbPromise.then(async function(db) {
    try {
      let out = await db.getAllFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, payload.profileId - 0);
      if (out == null) {
        return;
      }
      store.commit(types.LOAD_LINKS, out);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export async function getLink({ profileId, linkId }) {
  let out = null;
  await dbPromise.then(async function(db) {
    try {
      out = await db.get(STORE_LINKS, [profileId - 0, linkId]);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
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
  const db = await dbPromise;
  let out = await db.get(STORE_SOURCES, key);
  if (out == null) {
    return;
  }
  out['Links'] = await db.countFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, key[1]);
  store.commit(types.LOAD_SOURCE, out);
}

export function deleteLink({ profileId, linkId }) {
  dbPromise.then(async function(db) {
    try {
      await db.delete(STORE_LINKS, [profileId - 0, linkId]);
      store.commit(types.LOAD_LINK, undefined);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export function deleteObject(store, key) {
  dbPromise.then(async function(db) {
    try {
      await db.delete(store, key);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export async function saveLink(link) {
  link.profileId = link.profileId - 0;
  await dbPromise.then(async function(db) {
    try {
      await db.put(STORE_LINKS, link);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export function saveObject(storeName, object) {
  dbPromise.then(async function(db) {
    try {
      await db.put(storeName, object);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export async function fetchProfiles() {
  const db = await dbPromise;
  const tx = db.transaction(STORE_PROFILES);
  const profilesStore = tx.objectStore(STORE_PROFILES);
  const values = await profilesStore.getAll();
  let profiles = [];
  if (values.length === 0) {
    await addProfile({
      name: 'myProfile',
    });
  }
  for (let i = 0; i < values.length; i++) {
    values[i].links = await db.countFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, values[i].id);
    values[i].sources = await db.countFromIndex(STORE_SOURCES, INDEX_SOURCES_CONSUMERID, values[i].id);
    profiles.push(values[i]);
  }
  await tx.done;
  dispatchToStores('fetchProfiles', profiles);
}

export async function getProfileSources(profileId) {
  let out = null;
  await dbPromise.then(async function(db) {
    out = await db.getAllFromIndex(STORE_SOURCES, INDEX_SOURCES_CONSUMERID, profileId - 0);
  });
  return out;
}

export async function getLinks(profileId) {
  let out = null;
  await dbPromise.then(async function(db) {
    out = await db.getAllFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, [profileId - 0]);
  });
  return out;
}

export async function getLinksByTimeAdded(profileId, sourceId) {
  let out = null;
  const db = await dbPromise;
  let tx = await db.transaction(STORE_LINKS);
  let objStore = await tx.objectStore(STORE_LINKS);
  let index = await objStore.index(INDEX_LINKS_PROFILEID_TIMEADDED, profileId);
  let keyRng = IDBKeyRange.bound([profileId, new Date(2019, 1)], [profileId, new Date()]);
  let cursor = await index.openCursor(keyRng, 'prev');
  out = cursor;
  await tx.done;
  return out;
}

export function deleteProfile(payload) {
  dbPromise.then(async function(db) {
    var tx = db.transaction(STORE_PROFILES, 'readwrite');
    var profilesStore = tx.objectStore(STORE_PROFILES);
    try {
      await profilesStore.delete(payload.profileId);
      store.dispatch('deleteProfile', payload);
      await tx.done;
    } catch (e) {
      tx.abort();
      console.log(e);
      console.log(e.stack);
    }
  });
}

export function deleteProfileSource(payload) {
  dbPromise.then(async function(db) {
    var tx = db.transaction(STORE_SOURCES, 'readwrite');
    var objStore = tx.objectStore(STORE_SOURCES);
    try {
      await objStore.delete([payload.profileId, payload.sourceId]);
      store.commit(types.DELETE_PROFILE_SOURCE, payload);
      await tx.done;
    } catch (e) {
      tx.abort();
      console.log(e);
      console.log(e.stack);
    }
  });
}

export async function addLink(payload) {
  let db = await dbPromise;
  let storeName = STORE_LINKS;
  payload.url = trimmedUrl(payload.url);
  payload[STORE_LINKS_TIME_ADDED] = new Date();
  await db.put(storeName, payload);
}

export async function addSources({ sources }) {
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
  await dbPromise.then(async function(db) {
    let storeName = STORE_SOURCES;
    let link = {
      url: trimmedUrl(payload.link.url),
      title: payload.link.title,
      saved: payload.action === 'save',
      profileId: payload.targetId - 0,
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
  });
}

export async function saveOrSkipLink(payload) {
  let link = payload.link;

  let linksProp = link.links;
  delete link.links;

  link.url = trimmedUrl(link.url);
  link.saved = payload.action === 'save';
  link.profileId = payload.targetId - 0;
  link.timeSaved = new Date();

  let storeObject = null;
  await dbPromise.then(async function(db) {
    storeObject = await db.get(STORE_LINKS, [link.profileId, link.url]);
  });

  if (storeObject != null && storeObject.saved !== link.saved) {
    let sources = link.sources;
    if (storeObject.saved && storeObject.sourcesForSave != null) {
      sources = storeObject.sourcesForSave;
    } else if (!storeObject.saved && storeObject.sourcesForSkip != null) {
      sources = storeObject.sourcesForSkip;
    }
    for (let i in sources) {
      let source = sources[i];
      await saveOrSkipSource({
        targetId: source.profileId,
        source,
        action: storeObject.saved ? 'save' : 'skip',
      });
    }
  }

  // Process sources.
  let sources = link.sources;
  if (payload.action === 'save' && link.sourcesForSave != null) {
    sources = link.sourcesForSave;
  } else if (payload.action === 'skip' && link.sourcesForSkip != null) {
    sources = link.sourcesForSkip;
  }
  for (let i in sources) {
    let source = sources[i];
    await saveOrSkipSource({
      targetId: payload.targetId,
      source,
      action: 'skip', // TODO: check if source exists. update, instead of overwrite.
    });

    link.links = linksProp;
  }

  // Process link itself.
  await dbPromise.then(async function(db) {
    let storeName = STORE_LINKS;
    console.log('Storing link:', link);
    await db.put(storeName, link);
    console.log('Link "' + payload.link.url + '" stored successfully.');
    await setCurUrlLinkStatus();
    // await dispatchToStores('setCurUrl', payload);
    // await dispatchToStores('setUrlToScrape', payload.link.url);
    // chrome.runtime.sendMessage('save');
  });
}

export async function saveOrSkipSource({ source, targetId, action }) {
  const db = await dbPromise;

  let sourceConnection = {};
  sourceConnection.points = source.points;
  sourceConnection[STORE_SOURCES_PROVIDERID] = trimmedUrl(source.id);
  sourceConnection[STORE_SOURCES_CONSUMERID] = targetId - 0;
  sourceConnection.saved = action === 'save';
  sourceConnection.timeAdded = new Date();

  let storeObject = await db.get(STORE_SOURCES, [targetId, source.id]);
  if (storeObject != null) {
    sourceConnection.points = sourceConnection.points - 0 + (storeObject.points - 0);
  }
  await db.put(STORE_SOURCES, sourceConnection);

  addProfile(source);

  console.log('Source "' + source.id + '" stored successfully.');
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

export async function updateSourceScrapeDate({ profileId, sourceUrl }) {
  await dbPromise.then(async function(db) {
    let source = await db.get(STORE_SOURCES, [profileId, sourceUrl]);
    if (source != null) {
      AutoGenProfile.incrementScrapeDate(source);
      await db.put(STORE_SOURCES, source);
    }
  });
}

export async function changeSourcePoints(payload) {
  let source = payload.source;
  await dbPromise.then(async function(db) {
    source.url = trimmedUrl(source.url);
    source.profileId = payload.targetId - 0;
    let storeObject = await db.get(STORE_SOURCES, [source.profileId, source.url]);
    if (storeObject != null) {
      storeObject.points += payload.pointsChange;
    }
    await db.put(STORE_SOURCES, source);
  });
}

export async function removeLink(payload) {
  await dbPromise.then(async function(db) {
    let storeName = STORE_LINKS;
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
    await db.delete(storeName, [payload.targetId, payload.url]);
    await setCurUrlLinkStatus();
  });
}

export async function removeSource(payload) {
  await dbPromise.then(async function(db) {
    let storeName = STORE_SOURCES;
    await db.delete(storeName, [payload.targetId, payload.url]);
    await setCurUrlSourceStatus();
  });
}

export async function addProfile(profile) {
  if (profile.autoGenerated == null) {
    profile.autoGenerated = false;
  }

  const db = await dbPromise;
  let links = profile.links;
  let sources = profile.sources;
  let sourcesForSave = profile.sourcesForSave;
  let sourcesForSkip = profile.sourcesForSkip;

  delete profile.links;
  delete profile.sources;
  delete profile.sourcesForSave;
  delete profile.sourcesForSkip;
  console.log('Storing source profile:', profile);

  addLinks({
    links,
    profileId: profile.id,
  });

  profile.links = links;
  profile.sources = sources;
  profile.sourcesForSave = sourcesForSave;
  profile.sourcesForSkip = sourcesForSkip;

  await db.put(STORE_PROFILES, profile);
  store.commit(types.ADD_PROFILE, profile.name);
  fetchProfiles();
}

export async function setTarget(profileId) {
  dispatchToStores('setTarget', profileId);
  setCurUrlLinkStatus();
  setCurUrlSourceStatus();
}

export async function setCurUrlLinkStatus() {
  let url = store.state.curLink.url;
  if (store.state.targetId == null) {
    console.log('no current target');
    dispatchToStores('setCurUrlLinkStatus', 'neither');
    return;
  }
  if (url == null) {
    console.log('no link');
    dispatchToStores('setCurUrlLinkStatus', 'neither');
    return;
  }
  url = trimmedUrl(url);

  dbPromise.then(function(db) {
    let payload = 'neither';
    db.get(STORE_LINKS, [store.state.targetId - 0, url]).then(function(link) {
      if (link == null) {
      } else {
        payload = link.saved;
      }
      dispatchToStores('setCurUrlLinkStatus', payload);
    });
  });
}

export async function setCurUrlSourceStatus() {
  let url = store.state.curLink.url;
  if (store.state.targetId == null) {
    store.commit(types.SET_CUR_URL_SOURCE_STATUS, 'neither');
    return;
  }
  if (url == null) {
    store.commit(types.SET_CUR_URL_SOURCE_STATUS, 'neither');
    return;
  }
  url = trimmedUrl(url);
  dbPromise.then(function(db) {
    db.get(STORE_SOURCES, [store.state.targetId - 0, url]).then(function(link) {
      if (link == null) {
        store.commit(types.SET_CUR_URL_SOURCE_STATUS, 'neither');
      } else {
        store.commit(types.SET_CUR_URL_SOURCE_STATUS, link.saved);
      }
    });
  });
}
