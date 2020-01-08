import Vue from 'vue';
import Vuex from 'vuex';
import VuexPersistence from 'vuex-persist';

import * as getters from './getters';
import mutations from './mutations';
import * as actions from './actions';

Vue.use(Vuex);

// Store things here that need to be loaded by new pages upon load (i.e. popup).
const stateReducer = function(state) {
  return {
    activeTabId: state.activeTabId,
    curPage: state.curPage,
    targetId: state.targetId,
  };
};

const vuexLocal = new VuexPersistence({
  key: 'saveorskip',
  storage: window.localStorage,
  reducer: stateReducer,
});

const initState = {
  // Active tab id
  activeTabId: '',

  // Set of profiles.
  profile: null,
  profileStats: null,
  profiles: [],
  links: [],
  scrapers: [],
  source: null,
  profileSourceStats: null,
  sources: [],
  link: null,
  profileSourceLink: null,
  profileSourceLinks: [],
  sourceToScrape: null,

  // Id of current target.
  targetId: 1,
  curLink: null,
  curUrlAsLink: null,
  curUrlAsSource: null,
  curSuggestion: null,
  curSuggestionTabId: null,
  profileDuplicate: null,
  sourceDuplicate: null,
  needCurSuggestion: true,
  sourceForCurUrl: null,
  nextSuggestion: null,
  scrapeDelayMS: 1000 * 60 * 60 * 24,
  urlToScrape: null,

  urlsToScrape: {},

  testPageUrl: '',
  testPage: null,
};

const store = new Vuex.Store({
  state: initState,
  getters,
  mutations,
  actions,
  plugins: [vuexLocal.plugin],
});

export default store;
const initialStateCopy = JSON.parse(JSON.stringify(initState));
export function resetState() {
  store.replaceState(JSON.parse(JSON.stringify(initialStateCopy)));
}
