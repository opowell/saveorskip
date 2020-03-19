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
  // mounted() {
  //   // idb.fetchProfiles();
  // },
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('received message: ' + JSON.stringify(request));
  let action = request;
  if (request.action != null) {
    action = request.action;
  }

  switch (action) {
    case 'storeDispatch':
      store.dispatch(request.storeAction, request.storePayload);
      break;
  }
});
