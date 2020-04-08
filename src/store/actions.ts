import * as types from './mutation-types';

export const setTarget = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_TARGET, payload);
};

export const setTestPage = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_TEST_PAGE, payload);
};

export const setTestPageUrl = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_TEST_PAGE_URL, payload);
};

export const setCurPage = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_CUR_PAGE, payload);
};

export const setUrlToScrape = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_URL_TO_SCRAPE, payload);
};

export const addProfile = ({ commit }: { commit: any }, payload: any) => {
  commit(types.ADD_PROFILE, payload);
};

export const saveOrSkipLink = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SAVE_OR_SKIP_LINK, payload);
};

export const addSources = ({ commit }: { commit: any }, payload: any) => {
  commit(types.ADD_SOURCES, payload);
};

export const removeSource = ({ commit }: { commit: any }, payload: any) => {
  commit(types.REMOVE_SOURCE, payload);
};

export const deleteProfile = ({ commit }: { commit: any }, payload: any) => {
  commit(types.DELETE_PROFILE, payload);
};

// export const renameProfile = ({ commit }: { commit: any }, payload: any) => {
//   commit(types.RENAME_PROFILE, payload);
// };

export const duplicateProfile = ({ commit }: { commit: any }, payload: any) => {
  commit(types.DUPLICATE_PROFILE, payload);
};

// export const renameSource = ({ commit }: { commit: any }, payload: any) => {
//   commit(types.RENAME_SOURCE, payload);
// };

export const duplicateSource = ({ commit }: { commit: any }, payload: any) => {
  commit(types.DUPLICATE_SOURCE, payload);
};

export const setNeedCurSuggestion = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_NEED_CUR_SUGGESTION, payload);
};

export const setSourceForCurUrl = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_SOURCE_FOR_CUR_URL, payload);
};

export const setSourceSaved = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_SOURCE_SAVED, payload);
};

export const setCurSuggestionTabId = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_CUR_SUGGESTION_TAB_ID, payload);
};

export const setCurSuggestion = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_CUR_SUGGESTION, payload);
};

export const setActiveTabId = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_ACTIVE_TAB_ID, payload);
};

export const setNextSuggestion = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_NEXT_SUGGESTION, payload);
};

export const loadProfile = ({ commit }: { commit: any }, payload: any) => {
  commit(types.LOAD_PROFILE, payload);
};

export const loadSources = ({ commit }: { commit: any }, payload: any) => {
  commit(types.LOAD_SOURCES, payload);
};
