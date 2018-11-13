import * as types from './mutation-types';
import Profile from '../models/Profile';

export default {
  [types.UPDATE_FOO](state, payload) {
    state.foo = payload;
  },

  [types.ADD_PROFILE](state, payload) {
    let profile = new Profile(payload);
    state.profileObjs.push(profile);
  },

  [types.REMOVE_LINK](state, payload) {
    let profile = findProfile(state, payload.targetId);
    Profile.removeLink(profile, payload.url);
  },

  [types.SAVE_OR_SKIP_LINK](state, payload) {
    let profile = findProfile(state, payload.targetId);
    if (payload.action === 'save') {
      Profile.saveLink(profile, payload.link);
    }
    if (payload.action === 'skip') {
      Profile.skipLink(profile, payload.link);
    }
  },

  [types.ADD_SOURCES](state, payload) {
    let profile = findProfile(state, payload.targetId);
    Profile.addSources(profile, payload.sources);
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
    for (let i = 0; i < state.profileObjs.length; i++) {
      if (state.profileObjs[i].name === payload.profileId) {
        state.profileObjs.splice(i, 1);
        return;
      }
    }
  },

  [types.RENAME_PROFILE](state, payload) {
    for (let i = 0; i < state.profileObjs.length; i++) {
      if (state.profileObjs[i].name === payload.profileId) {
        state.profileObjs[i].name = payload.newName;
        return;
      }
    }
  },

  [types.SET_CUR_URL](state, payload) {
    state.curUrl = trimmedUrl(payload.url);
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
      for (let j = 0; j < state.profileObjs.length; j++) {
        if (state.profileObjs[j].name === name) {
          nameExists = true;
          break;
        }
      }
    }

    let copy = new Profile(name);
    for (let i = 0; i < profile.links.length; i++) {
      Profile.setLink(copy, profile.links[i].url, profile.links[i].saved);
    }
    for (let i = 0; i < Object.keys(profile.suggestedSources).length; i++) {
      let key = Object.keys(profile.suggestedSources)[i];
      Profile.addSuggestedSources(copy, profile.suggestedSources[key]);
    }
    state.profileObjs.push(copy);
    state.profileDuplicate = copy;
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

  [types.SET_CUR_SAVED_ITEMS_TAB](state, payload) {
    state.curSavedItemsTab = payload.url;
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
  for (let i = 0; i < state.profileObjs.length; i++) {
    if (state.profileObjs[i].name === id) {
      profile = state.profileObjs[i];
    }
  }
  return profile;
}
