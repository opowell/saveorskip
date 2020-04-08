import Vue from 'vue';
import Vuex, { Store } from 'vuex';
import VuexPersistence from 'vuex-persist';

import mutations from './mutations';
import * as actions from './actions';

Vue.use(Vuex);

const vuexLocal = new VuexPersistence({
  key: 'saveorskip',
  storage: window.localStorage,
});

const initState = {
  // Active tab id
  activeTabId: '',

  // Set of profiles.
  profile: null,
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
  urlToScrape: null,

  popup: {
    profile: null,
  },

  urlsToScrape: {},

  testPageUrl: '',
  testPage: null,

  status: 'Waiting',
};

const store: Store<unknown> = new Vuex.Store({
  state: initState,
  // @ts-ignore
  mutations,
  actions,
  // @ts-ignore
  plugins: [vuexLocal.plugin],
});

export default store;
const initialStateCopy = JSON.parse(JSON.stringify(initState));
export function resetState() {
  store.replaceState(JSON.parse(JSON.stringify(initialStateCopy)));
}
