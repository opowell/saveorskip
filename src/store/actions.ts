import * as types from './mutation-types';
import { loadProfile } from './idb';

export const setTestPage = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_TEST_PAGE, payload);
};

export const setUrlToScrape = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_URL_TO_SCRAPE, payload);
};

export const setNeedCurSuggestion = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_NEED_CUR_SUGGESTION, payload);
};

export const setSourceForCurUrl = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_SOURCE_FOR_CUR_URL, payload);
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
