import * as types from './mutation-types';
import Profile from '../models/Profile';
import Source from '../models/Source';
import { dbPromise, STORE_PROFILES, STORE_LINKS, STORE_SOURCES, STORE_LINKS_PROFILEID } from './Constants.ts';
import { trimmedUrl } from './Utils.ts';

export default {
  [types.FETCH_PROFILES](state, payload) {
    state.profiles.splice(0, state.profiles.length);
    for (let i = 0; i < payload.length; i++) {
      state.profiles.push(payload[i]);
    }
  },

  [types.SET_CUR_URL_LINK_STATUS](state, payload) {
    state.curUrlAsLink = payload;
  },

  [types.ADD_PROFILE](state, payload) {
    let profile = new Profile(payload);
    state.profiles.push(profile);
  },

  [types.LOAD_PROFILE](state, payload) {
    state.profile = null;
    dbPromise.then(async function(db) {
      try {
        let out = await db.get(STORE_PROFILES, payload.profileId - 0);
        if (out != null) {
          out.numLinks = await db.countFromIndex(STORE_LINKS, 'profileId', out.id);
        }
        state.profile = out;
      } catch (e) {
        console.log(e);
        console.log(e.stack);
      }
    });
  },

  [types.LOAD_LINKS](state, payload) {
    state.links.splice(0, state.links.length);
    dbPromise.then(async function(db) {
      try {
        let out = await db.getAllFromIndex(STORE_LINKS, STORE_LINKS_PROFILEID, payload.profileId - 0);
        if (out == null) {
          return;
        }
        for (let i = 0; i < out.length; i++) {
          state.links.push(out[i]);
        }
      } catch (e) {
        console.log(e);
        console.log(e.stack);
      }
    });
  },

  [types.LOAD_SOURCES](state, payload) {
    state.sources.splice(0, state.sources.length);
    dbPromise.then(async function(db) {
      try {
        let out = await db.getAllFromIndex(STORE_SOURCES, 'profileId', payload.profileId);
        if (out == null) {
          return;
        }
        for (let i = 0; i < out.length; i++) {
          state.sources.push(out[i]);
        }
      } catch (e) {
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
    dbPromise.then(function(db) {
      let storeName = STORE_LINKS;
      var tx = db.transaction(storeName, 'readwrite');
      var store = tx.objectStore(storeName);
      let link = {
        url: payload.link.url,
        title: payload.link.title,
        saved: payload.action === 'save',
        profileId: payload.targetId - 0,
      };
      return Promise.all(
        [link].map(function(item) {
          if (payload.props != null) {
            let propKeys = Object.keys(payload.props);
            for (let i = 0; i < propKeys.length; i++) {
              item[propKeys[i]] = payload.props[i];
            }
          }
          console.log('Storing link:', item);
          return store.put(item);
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
      var tx = db.transaction(STORE_PROFILES, 'readwrite');
      var profilesStore = tx.objectStore(STORE_PROFILES);
      try {
        await profilesStore.delete(payload.profileId);
        for (let i = 0; i < state.profiles.length; i++) {
          if (state.profiles[i].id === payload.profileId) {
            state.profiles.splice(i, 1);
            break;
          }
        }
      } catch (e) {
        tx.abort();
        console.log(e);
        console.log(e.stack);
      }
    });
  },

  [types.RENAME_PROFILE](state, payload) {
    dbPromise.then(async function(db) {
      var tx = db.transaction(STORE_PROFILES, 'readwrite');
      // var profilesStore = tx.objectStore(storeName);
      try {
        let profile = await db.get(STORE_PROFILES, payload.profileId);
        profile.name = payload.newName;
        await db.put(STORE_PROFILES, profile);
        for (let i = 0; i < state.profiles.length; i++) {
          if (state.profiles[i].name === payload.profileId) {
            state.profiles[i].name = payload.newName;
            return;
          }
        }
      } catch (e) {
        console.log(e);
        console.log(e.stack);
        tx.abort();
      }
    });
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

function findProfile(state, id) {
  let profile = null;
  for (let i = 0; i < state.profiles.length; i++) {
    if (state.profiles[i].name === id) {
      profile = state.profiles[i];
    }
  }
  return profile;
}
