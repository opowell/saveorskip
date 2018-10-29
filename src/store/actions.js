import * as types from './mutation-types';

export const setFoo = ({ commit }, payload) => {
  commit(types.UPDATE_FOO, payload);
};

export const setTarget = ({ commit }, payload) => {
  commit(types.SET_TARGET, payload);
};

export const addProfile = ({ commit }, payload) => {
  commit(types.ADD_PROFILE, payload);
};

export const saveOrSkipLink = ({ commit }, payload) => {
  commit(types.SAVE_OR_SKIP_LINK, payload);
};

export const removeLink = ({ commit }, payload) => {
  commit(types.REMOVE_LINK, payload);
};

export const addSuggestedSources = ({ commit }, payload) => {
  commit(types.ADD_SUGGESTED_SOURCES, payload);
};

export const removeSuggestedSource = ({ commit }, payload) => {
  commit(types.REMOVE_SUGGESTED_SOURCE, payload);
};

export const deleteProfile = ({ commit }, payload) => {
  commit(types.DELETE_PROFILE, payload);
};

export const renameProfile = ({ commit }, payload) => {
  commit(types.RENAME_PROFILE, payload);
}
