import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import * as getters from './getters';
import mutations from './mutations';
import * as actions from './actions';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    // Active tab id
    activeTabId: '',

    // Input for new profile
    profileInput: '',

    // Set of profiles.
    profiles: [],

    // Id of current target.
    targetId: '',
    curUrl: '',
    curSavedItemsTab: null,
    curSuggestion: null,
    curSuggestionTabId: null,
    profileDuplicate: null,
    needCurSuggestion: true,
    sourceForCurUrl: null,
    nextSuggestion: null,
    scrapeDelayMS: 1000 * 60 * 60 * 24,
  },
  getters,
  mutations,
  actions,
  plugins: [createPersistedState()],
});
