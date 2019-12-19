import * as types from './mutation-types';

export const setTarget = ({ commit }, payload) => {
  commit(types.SET_TARGET, payload);
};

export const setCurUrl = ({ commit }, payload) => {
  commit(types.SET_CUR_URL, payload);
};

export const setCurUrlLinkStatus = ({ commit }, payload) => {
  commit(types.SET_CUR_URL_LINK_STATUS, payload);
};

export const setCurUrlSourceStatus = ({ commit }, payload) => {
  commit(types.SET_CUR_URL_SOURCE_STATUS, payload);
};

export const setUrlToScrape = ({ commit }, payload) => {
  commit(types.SET_URL_TO_SCRAPE, payload);
};

export const addProfile = ({ commit }, payload) => {
  commit(types.ADD_PROFILE, payload);
};

export const saveOrSkipLink = ({ commit }, payload) => {
  commit(types.SAVE_OR_SKIP_LINK, payload);
};

export const addSources = ({ commit }, payload) => {
  commit(types.ADD_SOURCES, payload);
};

export const removeSource = ({ commit }, payload) => {
  commit(types.REMOVE_SOURCE, payload);
};

export const deleteProfile = ({ commit }, payload) => {
  commit(types.DELETE_PROFILE, payload);
};

// export const renameProfile = ({ commit }, payload) => {
//   commit(types.RENAME_PROFILE, payload);
// };

export const duplicateProfile = ({ commit }, payload) => {
  commit(types.DUPLICATE_PROFILE, payload);
};

// export const renameSource = ({ commit }, payload) => {
//   commit(types.RENAME_SOURCE, payload);
// };

export const duplicateSource = ({ commit }, payload) => {
  commit(types.DUPLICATE_SOURCE, payload);
};

export const setNeedCurSuggestion = ({ commit }, payload) => {
  commit(types.SET_NEED_CUR_SUGGESTION, payload);
};

export const setSourceForCurUrl = ({ commit }, payload) => {
  commit(types.SET_SOURCE_FOR_CUR_URL, payload);
};

export const setSourceSaved = ({ commit }, payload) => {
  commit(types.SET_SOURCE_SAVED, payload);
};

export const setCurSuggestionTabId = ({ commit }, payload) => {
  commit(types.SET_CUR_SUGGESTION_TAB_ID, payload);
};

export const setCurSuggestion = ({ commit }, payload) => {
  commit(types.SET_CUR_SUGGESTION, payload);
};

export const setActiveTabId = ({ commit }, payload) => {
  commit(types.SET_ACTIVE_TAB_ID, payload);
};

export const setNextSuggestion = ({ commit }, payload) => {
  commit(types.SET_NEXT_SUGGESTION, payload);
};

export const fetchProfiles = ({ commit }, payload) => {
  commit(types.FETCH_PROFILES, payload);
};

export const loadLinks = ({ commit }, payload) => {
  commit(types.LOAD_LINKS, payload);
};

export const loadProfile = ({ commit }, payload) => {
  commit(types.LOAD_PROFILE, payload);
};
