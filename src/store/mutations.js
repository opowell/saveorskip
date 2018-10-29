import * as types from './mutation-types';
import Profile from '../models/Profile';

export default {
  [types.UPDATE_FOO](state, payload) {
    state.foo = payload;
  },

  [types.ADD_PROFILE](state, payload) {
    let profile = new Profile(payload);
    state.profileObjs.push(profile);
    state.profiles.push(payload);
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

  [types.ADD_SUGGESTED_SOURCES](state, payload) {
    let profile = findProfile(state, payload.targetId);
    Profile.addSuggestedSources(profile, payload.sources);
  },

  [types.REMOVE_SUGGESTED_SOURCE](state, payload) {
    let profile = findProfile(state, payload.targetId);
    Profile.removeSuggestedSource(profile, payload.url);
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
};

function findProfile(state, id) {
  let profile = null;
  for (let i = 0; i < state.profileObjs.length; i++) {
    if (state.profileObjs[i].name === id) {
      profile = state.profileObjs[i];
    }
  }
  return profile;
}