import store from './index.js';
import { dbPromise, STORE_LINKS, STORE_PROFILES, STORE_LINKS_PROFILEID, STORE_SOURCES_PROFILEID, STORE_SOURCES } from './Constants.ts';
import { trimmedUrl } from './Utils.ts';
import Profile from '../models/Profile.js';
import * as types from './mutation-types.js';

export function loadProfile(payload) {
  dbPromise.then(async function(db) {
    try {
      let out = await db.get(STORE_PROFILES, payload.profileId - 0);
      if (out != null) {
        out.numLinks = await db.countFromIndex(STORE_LINKS, 'profileId', out.id);
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
      store.dispatch('loadSources', out);
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
      payload.sources.map(function(item) {
        item.profileId = payload.targetId;
        console.log('Storing source:', item);
        return store.add(item);
      })
    )
      .catch(function(e) {
        tx.abort();
        console.log(e);
      })
      .then(function() {
        console.log('Sources "' + payload.sources + '" stored successfully.');
      });
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
    let x = await db.get(storeName, [link.profileId, link.url]);
    console.log(x);
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

export async function setCurUrlLinkStatus(payload) {
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
