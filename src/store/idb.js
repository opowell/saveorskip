import store from './index.js';
import {
  dbPromise,
  STORE_LINKS,
  STORE_PROFILES,
  STORE_LINKS_PROFILEID,
  STORE_SOURCES_PROFILEID,
  STORE_SOURCES,
  STORE_PROFILE_SOURCE_LINKS,
  STORE_PROFILE_SOURCE_LINKS_INDEX_PROFILEID_SOURCEID,
} from './Constants.ts';
import { trimmedUrl } from '../Utils.js';
import Profile from '../models/Profile.js';
import * as types from './mutation-types.js';

export function loadProfile(payload) {
  dbPromise.then(async function(db) {
    try {
      let profile = await db.get(STORE_PROFILES, payload.profileId - 0);
      store.commit(types.LOAD_PROFILE, profile);
      if (profile != null) {
        let stats = {};
        stats.numLinks = await db.countFromIndex(STORE_LINKS, 'profileId', profile.id);
        stats.numSources = await db.countFromIndex(STORE_SOURCES, 'profileId', profile.id);
        store.commit(types.LOAD_PROFILE_STATS, stats);
      }
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export function loadSources(payload) {
  dbPromise.then(async function(db) {
    try {
      let out = await db.getAllFromIndex(STORE_SOURCES, STORE_SOURCES_PROFILEID, payload.profileId - 0);
      if (out == null) {
        return;
      }
      store.commit(types.LOAD_SOURCES, out);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export async function loadLinks(payload) {
  await dbPromise.then(async function(db) {
    try {
      let out = await db.getAllFromIndex(STORE_LINKS, STORE_LINKS_PROFILEID, payload.profileId - 0);
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

export async function loadProfileSourceLinks(payload) {
  await dbPromise.then(async function(db) {
    try {
      let out = await db.getAllFromIndex(STORE_PROFILE_SOURCE_LINKS, STORE_PROFILE_SOURCE_LINKS_INDEX_PROFILEID_SOURCEID, [payload.profileId - 0, payload.sourceId]);
      if (out == null) {
        return;
      }
      store.commit(types.LOAD_PROFILE_SOURCE_LINKS, out);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export function loadProfileSourceLink({ profileId, sourceId, linkId }) {
  dbPromise.then(async function(db) {
    try {
      let out = await db.get(STORE_PROFILE_SOURCE_LINKS, [profileId - 0, sourceId, linkId]);
      if (out == null) {
        return;
      }
      store.commit(types.LOAD_PROFILE_SOURCE_LINK, out);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export function loadLink({ profileId, linkId }) {
  dbPromise.then(async function(db) {
    try {
      let out = await db.get(STORE_LINKS, [profileId - 0, linkId]);
      if (out == null) {
        return;
      }
      store.commit(types.LOAD_LINK, out);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export function loadSource(key) {
  dbPromise.then(async function(db) {
    try {
      let out = await db.get(STORE_SOURCES, key);
      if (out == null) {
        return;
      }
      let stats = {};
      stats.numLinks = await db.countFromIndex(STORE_PROFILE_SOURCE_LINKS, STORE_PROFILE_SOURCE_LINKS_INDEX_PROFILEID_SOURCEID, key);
      store.commit(types.LOAD_PROFILE_SOURCE_STATS, stats);
      store.commit(types.LOAD_SOURCE, out);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
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

export function saveLink(link) {
  link.profileId = link.profileId - 0;
  dbPromise.then(async function(db) {
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
  await dbPromise.then(async function(db) {
    const tx = db.transaction(STORE_PROFILES);
    const profilesStore = tx.objectStore(STORE_PROFILES);
    const values = await profilesStore.getAll();
    let profiles = [];
    if (values.length === 0) {
      await addProfile('myProfile');
    }
    for (let i = 0; i < values.length; i++) {
      values[i].links = await db.countFromIndex(STORE_LINKS, STORE_LINKS_PROFILEID, values[i].id);
      values[i].sources = await db.countFromIndex(STORE_SOURCES, STORE_SOURCES_PROFILEID, values[i].id);
      profiles.push(values[i]);
    }
    await tx.done;
    await store.dispatch('fetchProfiles', profiles);
  });
}

export function deleteProfile(payload) {
  dbPromise.then(async function(db) {
    var tx = db.transaction(STORE_PROFILES, 'readwrite');
    var profilesStore = tx.objectStore(STORE_PROFILES);
    try {
      await profilesStore.delete(payload.profileId);
      store.dispatch('deleteProfile', payload);
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
    } catch (e) {
      tx.abort();
      console.log(e);
      console.log(e.stack);
    }
  });
}

export function addProfileSourceLink(payload) {
  dbPromise.then(function(db) {
    let storeName = STORE_PROFILE_SOURCE_LINKS;
    payload.url = trimmedUrl(payload.url);
    db.put(storeName, payload);
  });
}

export function addSources(payload) {
  dbPromise.then(function(db) {
    var tx = db.transaction(STORE_SOURCES, 'readwrite');
    var sourcesStore = tx.objectStore(STORE_SOURCES);
    return Promise.all(
      payload.sources.map(async function(item) {
        console.log('Storing source:', item);
        let storeItem = await sourcesStore.get([item.profileId, item.url]);
        if (storeItem != null) {
          item.points += storeItem.points;
        }
        sourcesStore.put(item);
        store.commit(types.ADD_SOURCE, item);
      })
    )
      .catch(function(e) {
        tx.abort();
        console.log(e);
      })
      .then(async function() {
        console.log('Sources "' + JSON.stringify(payload.sources) + '" stored successfully.');
        await setCurUrlSourceStatus();
      });
  });
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
        link[propKeys[i]] = payload.props[i];
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
  await dbPromise.then(async function(db) {
    let storeName = STORE_LINKS;
    let link = {
      url: trimmedUrl(payload.link.url),
      title: payload.link.title,
      saved: payload.action === 'save',
      profileId: payload.targetId - 0,
      timeSaved: new Date(),
    };
    if (payload.props != null) {
      let propKeys = Object.keys(payload.props);
      for (let i = 0; i < propKeys.length; i++) {
        link[propKeys[i]] = payload.props[i];
      }
    }
    console.log('Storing link:', link);
    await db.put(storeName, link);
    console.log('Link "' + payload.link.url + '" stored successfully.');
    await setCurUrlLinkStatus();
    store.commit(types.SET_CUR_URL, payload.link.url);
    store.commit(types.SET_URL_TO_SCRAPE, payload.link.url);
    chrome.runtime.sendMessage('save');
  });
}

export async function removeLink(payload) {
  await dbPromise.then(async function(db) {
    let storeName = STORE_LINKS;
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

export function addProfile(payload) {
  let profile = new Profile(payload);
  dbPromise.then(async function(db) {
    var tx = db.transaction(STORE_PROFILES, 'readwrite');
    var profilesStore = tx.objectStore(STORE_PROFILES);
    try {
      await Promise.all(
        [profile].map(function(item) {
          let toSave = {
            name: item.name,
          };
          profilesStore.put(toSave);
          store.commit(types.ADD_PROFILE, toSave.name);
        })
      );
      fetchProfiles();
    } catch (e) {
      tx.abort();
      console.log(e);
      console.log(e.stack);
    }
  });
}

export async function setCurUrlLinkStatus() {
  let url = store.state.curLink.url;
  console.log('setting current url as link: ' + store.state.targetId + '/' + url);
  if (store.state.targetId == null) {
    console.log('no current target');
    store.commit(types.SET_CUR_URL_LINK_STATUS, 'neither');
    return;
  }
  if (url == null) {
    console.log('no link');
    store.commit(types.SET_CUR_URL_LINK_STATUS, 'neither');
    return;
  }
  url = trimmedUrl(url);
  await dbPromise.then(async function(db) {
    try {
      let link = await db.get(STORE_LINKS, [store.state.targetId - 0, url]);
      if (link == null) {
        console.log('link is null, return neither');
        store.commit(types.SET_CUR_URL_LINK_STATUS, 'neither');
      } else {
        store.commit(types.SET_CUR_URL_LINK_STATUS, link.saved);
      }
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
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
  dbPromise.then(async function(db) {
    try {
      let link = await db.get(STORE_SOURCES, [store.state.targetId - 0, url]);
      if (link == null) {
        store.commit(types.SET_CUR_URL_SOURCE_STATUS, 'neither');
      } else {
        store.commit(types.SET_CUR_URL_SOURCE_STATUS, link.saved);
      }
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}
