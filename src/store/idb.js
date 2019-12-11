import store from './index.js';
import { dbPromise, STORE_LINKS, STORE_PROFILES, STORE_LINKS_PROFILEID, STORE_SOURCES_PROFILEID, STORE_SOURCES } from './Constants.ts';
import { trimmedUrl } from '../Utils.js';
import Profile from '../models/Profile.js';
import * as types from './mutation-types.js';

export function loadProfile(payload) {
  dbPromise.then(async function(db) {
    try {
      let out = await db.get(STORE_PROFILES, payload.profileId - 0);
      if (out != null) {
        out.numLinks = await db.countFromIndex(STORE_LINKS, 'profileId', out.id);
        out.numSources = await db.countFromIndex(STORE_SOURCES, 'profileId', out.id);
      }
      store.dispatch('loadProfile', out);
    } catch (e) {
      console.log(e);
      console.log(e.stack);
    }
  });
}

export function loadSources(payload) {
  dbPromise.then(async function(db) {
    try {
      let out = await db.getAllFromIndex(STORE_SOURCES, 'profileId', payload.profileId);
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

export function loadLinks(payload) {
  dbPromise.then(async function(db) {
    try {
      let out = await db.getAllFromIndex(STORE_LINKS, STORE_LINKS_PROFILEID, payload.profileId - 0);
      if (out == null) {
        return;
      }
      store.dispatch('loadLinks', out);
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

export function fetchProfiles() {
  dbPromise.then(async function(db) {
    const tx = db.transaction(STORE_PROFILES);
    const profilesStore = tx.objectStore(STORE_PROFILES);
    const values = await profilesStore.getAll();
    console.log(JSON.stringify(values));
    let profiles = [];
    for (let i = 0; i < values.length; i++) {
      values[i].numLinks = await db.countFromIndex(STORE_LINKS, STORE_LINKS_PROFILEID, values[i].id);
      values[i].numSources = await db.countFromIndex(STORE_SOURCES, STORE_SOURCES_PROFILEID, values[i].id);
      profiles.push(values[i]);
    }
    await tx.done;
    store.dispatch('fetchProfiles', profiles);
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

export function addSources(payload) {
  dbPromise.then(function(db) {
    var tx = db.transaction(STORE_SOURCES, 'readwrite');
    var store = tx.objectStore(STORE_SOURCES);
    return Promise.all(
      payload.sources.map(async function(item) {
        let storeItem = await store.get(STORE_SOURCES, [payload.targetId - 0, item.url]);
        if (storeItem == null) {
          item.profileId = payload.targetId - 0;
          storeItem = item;
        } else {
          storeItem.points += item.points;
        }
        console.log('Storing source:', storeItem);
        return store.put(item);
      })
    )
      .catch(function(e) {
        tx.abort();
        console.log(e);
      })
      .then(function() {
        console.log('Sources "' + JSON.stringify(payload.sources) + '" stored successfully.');
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
          console.log('Adding profile:', toSave);
          profilesStore.put(toSave);
          store.dispatch('addProfile', toSave);
          console.log('Profile added successfully!');
        })
      );
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
  dbPromise.then(async function(db) {
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
