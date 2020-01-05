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
  INDEX_PROFILES_AUTOGENERATED,
} from './Constants.ts';
import * as AutoGenProfile from '../models/AutoGenProfile.js';
import * as types from './mutation-types.js';
import Vue from 'vue';

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

export async function loadProfile(payload) {
  let profileId = payload.profileId;
  const db = await dbPromise;
  let profile = await db.get(STORE_PROFILES, profileId);
  profile['Links'] = await db.countFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, profile.id);
  profile['Sources'] = await db.countFromIndex(STORE_SOURCES, INDEX_SOURCES_CONSUMERID, profile.id);
  dispatchToStores('loadProfile', profile);
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
  const db = await dbPromise;
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
  const db = await dbPromise;
  let storeItem = await db.get(STORE_PROFILES, source.id);
  if (storeItem != null) {
    for (let i in source.links) {
      if (typeof source.links[i] === 'string') {
        source.links[i] = { url: source.links[i] };
      }
      source.links[i].saved = true;
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
      source.sources[i].autoGenerated = true;
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
  source.autoGenerated = true;
  AutoGenProfile.incrementScrapeDate(source);
  await saveOrSkipSource({
    action: 'skip',
    targetId: profileId,
    source,
  });
  source.url = prevUrl;
  source.title = prevTitle;
}

export async function loadLinks(payload) {
  let out = await getLinks(payload.profileId);
  store.commit(types.LOAD_LINKS, out);
}

export async function getLink({ profileId, linkId }) {
  let db = await dbPromise;
  let out = await db.get(STORE_LINKS, [profileId, linkId]);
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
  // out.Links = await db.countFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, key[1]);
  store.commit(types.LOAD_SOURCE, out);
}

export async function deleteLink({ profileId, linkId }) {
  let db = await dbPromise;
  await db.delete(STORE_LINKS, [profileId, linkId]);
  store.commit(types.LOAD_LINK, undefined);
}

export async function deleteObject(store, key) {
  let db = await dbPromise;
  try {
    await db.delete(store, key);
  } catch (e) {
    console.log(e);
    console.log(e.stack);
  }
}

export async function saveLink(link) {
  let db = await dbPromise;
  try {
    await db.put(STORE_LINKS, link);
  } catch (e) {
    console.log(e);
    console.log(e.stack);
  }
}

export async function saveObject(storeName, object) {
  let db = await dbPromise;
  try {
    await db.put(storeName, object);
  } catch (e) {
    console.log(e);
    console.log(e.stack);
  }
}

export async function fetchRegularProfiles() {
  const db = await dbPromise;
  let values = await db.getAllFromIndex(STORE_PROFILES, INDEX_PROFILES_AUTOGENERATED, false);
  let profiles = [];
  // if (values.length === 0) {
  //   await addProfile({
  //     name: 'myProfile',
  //   });
  // }
  for (let i = 0; i < values.length; i++) {
    values[i].links = await db.countFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, values[i].id);
    values[i].sources = await db.countFromIndex(STORE_SOURCES, INDEX_SOURCES_CONSUMERID, values[i].id);
    profiles.push(values[i]);
  }
  return profiles;
}

export async function fetchProfiles() {
  const db = await dbPromise;
  const values = await db.getAll(STORE_PROFILES);
  let profiles = [];
  // let foundNormalProfile = false;
  for (let i = 0; i < values.length; i++) {
    values[i].links = await db.countFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, values[i].id);
    values[i].sources = await db.countFromIndex(STORE_SOURCES, INDEX_SOURCES_CONSUMERID, values[i].id);
    profiles.push(values[i]);
    // if (values[i].autoGenerated !== true) {
    //   foundNormalProfile = true;
    // }
  }
  // if (!foundNormalProfile) {
  //   await addProfile({
  //     name: 'myProfile',
  //   });
  // }
  await dispatchToStores('fetchProfiles', profiles);
}

export async function getProfileSources(profileId) {
  let db = await dbPromise;
  let out = await db.getAllFromIndex(STORE_SOURCES, INDEX_SOURCES_CONSUMERID, profileId);
  return out;
}

export async function getLinks(profileId) {
  let db = await dbPromise;
  let out = await db.getAllFromIndex(STORE_LINKS, INDEX_LINKS_PROFILEID, profileId);
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

export async function deleteProfile(payload) {
  let db = await dbPromise;
  await db.delete(STORE_PROFILES, payload.profileId);
  store.dispatch('deleteProfile', payload);
}

export async function deleteProfileSource(payload) {
  let db = await dbPromise;
  await db.delete(STORE_SOURCES, [payload.profileId, payload.sourceId]);
  store.commit(types.DELETE_PROFILE_SOURCE, payload);
}

export async function addLink(payload) {
  let db = await dbPromise;
  let storeName = STORE_LINKS;
  payload.url = trimmedUrl(payload.url);
  payload[STORE_LINKS_TIME_ADDED] = new Date();
  await db.put(storeName, payload);
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
  let db = await dbPromise;
  let storeName = STORE_SOURCES;
  let link = {
    url: trimmedUrl(payload.link.url),
    title: payload.link.title,
    saved: payload.action === 'save',
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
  link.saved = payload.action === 'save';
  link.profileId = payload.targetId;
  link.timeAdded = new Date();

  let db = await dbPromise;
  let storeObject = await db.get(STORE_LINKS, [link.profileId, link.url]);

  if (storeObject != null && storeObject.saved !== link.saved) {
    let sources = link.sources;
    if (storeObject.saved && storeObject.sourcesForSave != null) {
      sources = storeObject.sourcesForSave;
    } else if (!storeObject.saved && storeObject.sourcesForSkip != null) {
      sources = storeObject.sourcesForSkip;
    }
    for (let i in sources) {
      let source = {
        id: sources[i],
        points: 0,
        saved: false,
      };
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
    let source = {
      id: sources[i],
      points: 0,
      autoGenerated: true,
    };
    await saveOrSkipSource({
      targetId: payload.targetId,
      source,
      action: 'skip', // TODO: check if source exists. update, instead of overwrite.
    });
  }

  // Process link itself.
  if (link.url == null) {
    link.url = link.id;
  }
  if (link.title == null) {
    link.title = link.name;
  }
  if (link.profileId === link.url) {
    return;
  }
  console.log('Storing link:', link);
  await db.put(STORE_LINKS, link);
  console.log('Link "' + link.url + '" stored successfully.');
  await setCurUrlLinkStatus();

  // Reset content.
  if (linksProp != null) {
    link.links = linksProp;
  }
}

export async function saveOrSkipSource({ source, targetId, action }) {
  const consumerId = targetId;
  const db = await dbPromise;

  let providerId = source.id;
  if (source.id == null) {
    providerId = source.url;
  }
  if (source.providerId != null) {
    providerId = source.providerId;
  }

  let sourceConnection = {};
  sourceConnection.points = source.points;
  sourceConnection[STORE_SOURCES_PROVIDERID] = trimmedUrl(providerId);
  sourceConnection[STORE_SOURCES_CONSUMERID] = consumerId;
  sourceConnection.saved = action === 'save';
  sourceConnection.timeAdded = new Date();

  let storeObject = await db.get(STORE_SOURCES, [consumerId, providerId]);
  if (storeObject != null) {
    sourceConnection.points = sourceConnection.points - 0 + (storeObject.points - 0);
  }
  await db.put(STORE_SOURCES, sourceConnection);

  source.id = providerId;
  delete source.providerId;
  delete source.consumerId;
  await addProfile(source);

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
  let db = await dbPromise;
  let source = await db.get(STORE_PROFILES, sourceUrl);
  if (source != null) {
    AutoGenProfile.incrementScrapeDate(source);
    await db.put(STORE_PROFILES, source);
  }
}

export async function changeSourcePoints(payload) {
  let source = payload.source;
  let db = await dbPromise;
  source.url = trimmedUrl(source.url);
  source.profileId = payload.targetId;
  let storeObject = await db.get(STORE_SOURCES, [source.profileId, source.url]);
  if (storeObject != null) {
    storeObject.points += payload.pointsChange;
  }
  await db.put(STORE_SOURCES, source);
}

export async function removeLink(payload) {
  let db = await dbPromise;
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
  let db = await dbPromise;
  await db.delete(STORE_SOURCES, [payload.targetId, payload.url]);
  await setCurUrlSourceStatus();
}

export async function addProfile(profile) {
  if (profile.autoGenerated == null) {
    profile.autoGenerated = false;
  }
  if (profile.name == null) {
    profile.name = profile.id;
  }

  const db = await dbPromise;
  let links = profile.links;
  let sources = profile.sources;
  let sourcesForSave = profile.sourcesForSave;
  let sourcesForSkip = profile.sourcesForSkip;

  await addLinks({
    links,
    profileId: profile.id,
  });

  Vue.delete(profile, 'links');
  Vue.delete(profile, 'sources');
  Vue.delete(profile, 'sourcesForSave');
  Vue.delete(profile, 'sourcesForSkip');

  delete profile.saved;
  delete profile.points;
  delete profile.profileId;
  delete profile.title;
  delete profile.url;
  delete profile.timeSaved;

  profile.timeAdded = new Date();

  console.log('Storing source profile:', profile);

  await db.put(STORE_PROFILES, profile);
  await fetchProfiles();

  profile.links = links;
  profile.sources = sources;
  profile.sourcesForSave = sourcesForSave;
  profile.sourcesForSkip = sourcesForSkip;
}

export async function setTarget(profileId) {
  await dispatchToStores('setTarget', profileId);
  await setCurUrlLinkStatus();
  await setCurUrlSourceStatus();
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

    let db = await dbPromise;
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
  let db = await dbPromise;
  let link = await db.get(STORE_SOURCES, [store.state.targetId, url]);
  if (link == null) {
    store.commit(types.SET_CUR_URL_SOURCE_STATUS, 'neither');
  } else {
    store.commit(types.SET_CUR_URL_SOURCE_STATUS, link.saved);
  }
}
