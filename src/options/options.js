import Vue from 'vue';
import App from './App';
import * as idb from '../store/idb.js';
import store from '../store';
import router from './router';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import BootstrapVue from 'bootstrap-vue';
Vue.use(BootstrapVue);

global.browser = require('webextension-polyfill');

/* eslint-disable no-new */
window.vue = new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App),
  mounted() {
    idb.fetchProfiles();
  },
});
