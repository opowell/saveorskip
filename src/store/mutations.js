import * as types from './mutation-types';
import Profile from '../models/Profile';
import { Source } from '../models/Source';
import { dbPromise, STORE_PROFILES } from './Constants.ts';
import { trimmedUrl } from '../Utils.js';

/**
 * Mutations are synchronous.
 */
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

  [types.SET_CUR_URL_SOURCE_STATUS](state, payload) {
    state.curUrlAsSource = payload;
  },

  [types.ADD_PROFILE](state, payload) {
    let profile = new Profile(payload);
    state.profiles.push(profile);
  },

  [types.ADD_SOURCE](state, payload) {
    state.sources.push(payload);
  },

  [types.LOAD_PROFILE](state, payload) {
    state.profile = payload;
  },

  [types.LOAD_PROFILE_STATS](state, payload) {
    state.profileStats = payload;
  },

  [types.LOAD_LINKS](state, payload) {
    state.links.splice(0, state.links.length);
    for (let i = 0; i < payload.length; i++) {
      state.links.push(payload[i]);
    }
  },

  [types.LOAD_LINK](state, payload) {
    state.link = payload;
  },

  [types.LOAD_SOURCE](state, payload) {
    state.source = payload;
  },

  [types.LOAD_SOURCES](state, payload) {
    state.sources.splice(0, state.sources.length);
    for (let i = 0; i < payload.length; i++) {
      state.sources.push(payload[i]);
    }
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
    state.targetId = payload - 0;
  },

  [types.DELETE_PROFILE](state, payload) {
    for (let i = 0; i < state.profiles.length; i++) {
      if (state.profiles[i].id === payload.profileId) {
        state.profiles.splice(i, 1);
        break;
      }
    }
  },

  [types.DELETE_PROFILE_SOURCE](state, payload) {
    for (let i = 0; i < state.sources.length; i++) {
      if (state.sources[i].url === payload.sourceId) {
        state.sources.splice(i, 1);
        break;
      }
    }
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
    state.urlToScrape = trimmedUrl(payload);
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
    let copy = Source(name);
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
