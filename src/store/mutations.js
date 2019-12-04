import * as types from './mutation-types';
import Profile from '../models/Profile';
import Source from '../models/Source';
import { openDB } from 'idb';
import store from '../store/index.js';
const dbName = 'saveorskip';

let dbPromise = openDB(dbName, 1, {
  upgrade(db, oldVersion, newVersion, transaction) {
    store.state.dbPromise = this;
    if (oldVersion === 0) {
      console.log('Creating stores');

      db.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });

      let linksStore = db.createObjectStore('links', { keyPath: ['profileId', 'url'] });
      linksStore.createIndex('saved', 'saved', { unique: false });
      linksStore.createIndex('profileId', 'profileId', { unique: false });
      linksStore.createIndex('url', 'url', { unique: false });

      let sourcesStore = db.createObjectStore('sources', { keyPath: ['profileId', 'url'] });
      sourcesStore.createIndex('profileId', 'profileId');
      sourcesStore.createIndex('saved', 'saved');
      sourcesStore.createIndex('url', 'url');
    }
  },
});

export default {
  async [types.FETCH_PROFILES](state, payload) {
    let STORE_NAME = 'profiles';
    const db = await openDB(dbName, 1);
    const tx = db.transaction(STORE_NAME);
    const store = tx.objectStore(STORE_NAME);
    const values = await store.getAll();
    console.log(JSON.stringify(values));
    state.profiles.splice(0, state.profiles.length);
    for (let i = 0; i < values.length; i++) {
      state.profiles.push(values[i]);
    }
    await tx.done;
  },

  [types.ADD_PROFILE](state, payload) {
    let profile = new Profile(payload);
    dbPromise.then(async function(db) {
      let storeName = 'profiles';
      var tx = db.transaction(storeName, 'readwrite');
      var profilesStore = tx.objectStore(storeName);
      try {
        await Promise.all(
          [profile].map(function(item) {
            let toSave = {
              name: item.name,
            };
            console.log('Adding profile:', toSave);
            return profilesStore.add(toSave);
          })
        );
        state.profiles.push(profile);
        console.log('Profiles added successfully!');
      } catch (e) {
        tx.abort();
        console.log(e);
        console.log(e.stack);
      }
    });
  },

  [types.REMOVE_LINK](state, payload) {
    let profile = findProfile(state, payload.targetId);
    Profile.removeLink(profile, payload.url);
  },

  [types.SAVE_OR_SKIP_LINK](state, payload) {
    // let profile = findProfile(state, payload.targetId);
    // if (payload.action === 'save') {
    //   Profile.saveLink(profile, payload.link);
    // }
    // if (payload.action === 'skip') {
    //   Profile.skipLink(profile, payload.link);
    // }
    dbPromise.then(function(db) {
      let storeName = 'links';
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      let link = {
        url: payload.link.url,
        saved: payload.action === 'save',
        profileId: payload.targetId,
      };
      return Promise.all(
        [link].map(function(item) {
          if (item.props != null) {
            let propKeys = Object.keys(item.props);
            for (let i = 0; i < propKeys.length; i++) {
              link[propKeys[i]] = item.props[i];
            }
          }
          console.log('Storing link:', item);
          return store.add(item);
        })
      )
        .catch(function(e) {
          tx.abort();
          console.log(e);
        })
        .then(function() {
          console.log('Link "' + payload.link.url + '" stored successfully.');
        });
    });
  },

  [types.ADD_SOURCES](state, payload) {
    let profile = findProfile(state, payload.targetId);
    Profile.addSources(profile, payload.sources);
    dbPromise.then(function(db) {
      let storeName = 'sources';
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      return Promise.all(
        [payload.sources].map(function(item) {
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
          console.log('Source "' + payload.source.url + '" stored successfully.');
        });
    });
  },

  [types.SET_SOURCE_SAVED](state, payload) {
    let profile = findProfile(state, payload.targetId);
    Profile.setSourceSaved(profile, payload.source, payload.saved);
  },

  [types.REMOVE_SOURCE](state, payload) {
    let profile = findProfile(state, payload.targetId);
    Profile.removeSource(profile, payload.url);
  },

  [types.SET_TARGET](state, payload) {
    state.targetId = payload;
  },

  [types.DELETE_PROFILE](state, payload) {
    dbPromise.then(async function(db) {
      let storeName = 'profiles';
      var tx = db.transaction(storeName, 'readwrite');
      var profilesStore = tx.objectStore(storeName);
      try {
        console.log('Remove profile:' + payload.profileId);
        await profilesStore.delete(payload.profileId);
        for (let i = 0; i < state.profiles.length; i++) {
          if (state.profiles[i].id === payload.profileId) {
            state.profiles.splice(i, 1);
            break;
          }
        }
        console.log('Profile removed successfully!');
      } catch (e) {
        tx.abort();
        console.log(e);
        console.log(e.stack);
      }
    });
  },

  [types.RENAME_PROFILE](state, payload) {
    for (let i = 0; i < state.profiles.length; i++) {
      if (state.profiles[i].name === payload.profileId) {
        state.profiles[i].name = payload.newName;
        return;
      }
    }
  },

  [types.RENAME_SOURCE](state, payload) {
    for (let i = 0; i < state.profiles.length; i++) {
      if (state.profiles[i].name === payload.profileId) {
        let profile = state.profiles[i];
        let keys = Object.keys(profile.sources);
        for (let j = 0; j < keys.length; j++) {
          if (profile.sources[keys[j]] === payload.sourceId) {
            let key = keys[j];
            let source = profile.sources[key];
            source.url = payload.newName;
            delete profile.sources[key];
            profile.sources[payload.newName] = source;
            return;
          }
        }
      }
    }
  },

  [types.SET_CUR_URL](state, payload) {
    payload.url = trimmedUrl(payload.url);
    state.curLink = payload;
  },

  [types.SET_URL_TO_SCRAPE](state, payload) {
    state.urlToScrape = payload;
  },

  [types.DUPLICATE_PROFILE](state, payload) {
    let profile = findProfile(state, payload.profileId);

    let nameExists = true;
    let i = 0;
    let name;
    while (nameExists) {
      i++;
      name = profile.name + i;
      nameExists = false;
      for (let j = 0; j < state.profiles.length; j++) {
        if (state.profiles[j].name === name) {
          nameExists = true;
          break;
        }
      }
    }

    let copy = new Profile(name);
    for (let i in profile.links) {
      Profile.setLink(copy, profile.links[i], profile.links[i].saved);
    }
    for (let i in profile.sources) {
      Profile.addSources(copy, [profile.sources[i]]);
    }
    state.profiles.push(copy);
    state.profileDuplicate = copy;
  },

  [types.DUPLICATE_SOURCE](state, payload) {
    let profile = findProfile(state, payload.profileId);

    let nameExists = true;
    let i = 0;
    let name;
    while (nameExists) {
      i++;
      name = payload.sourceId + i;
      nameExists = profile.sources[name] == null;
    }

    let source = profile.sources[payload.sourceId];
    let copy = new Source(name);
    copy.saved = source.saved;
    copy.lastScraped = source.lastScraped;
    copy.nextScrape = source.nextScrape;
    copy.points = source.points;
    // TODO: Also copy scrapedLinks.
    profile.sources[name] = copy;
    state.sourceDuplicate = copy;
  },

  [types.SET_NEED_CUR_SUGGESTION](state, payload) {
    state.needCurSuggestion = payload.value;
  },

  [types.SET_SOURCE_FOR_CUR_URL](state, payload) {
    state.sourceForCurUrl = payload.url;
  },

  [types.SET_CUR_SUGGESTION_TAB_ID](state, payload) {
    state.curSuggestionTabId = payload.tabId;
  },

  [types.SET_ACTIVE_TAB_ID](state, payload) {
    state.activeTabId = payload.tabId;
  },

  [types.SET_CUR_SUGGESTION](state, payload) {
    state.curSuggestion = payload.url;
  },

  [types.SET_NEXT_SUGGESTION](state, payload) {
    state.nextSuggestion = payload.url;
  },
};

function trimmedUrl(url) {
  if (url.includes('://')) {
    url = url.substring(url.indexOf('://') + '://'.length);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }

  return url;
}

function findProfile(state, id) {
  let profile = null;
  for (let i = 0; i < state.profiles.length; i++) {
    if (state.profiles[i].name === id) {
      profile = state.profiles[i];
    }
  }
  return profile;
}
