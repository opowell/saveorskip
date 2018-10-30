import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import * as getters from './getters';
import mutations from './mutations';
import * as actions from './actions';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    foo: 'bar',
    profiles: [],
    profileInput: '',
    profileObjs: [],
    targetId: '',
    curUrlSaved: null,
    curUrl: '',
    profileDuplicate: null,
  },
  getters,
  mutations,
  actions,
  plugins: [createPersistedState()],
});
