import Vue from 'vue';
import Vuex from 'vuex';

import mutations from './mutations';
import * as actions from './actions';

Vue.use(Vuex);

const initState = {
  curPage: '',
};

const store = new Vuex.Store({
  state: initState,
  // @ts-ignore
  mutations,
  actions,
});

export default store;
