import Vue from 'vue';
import App from './App';
import store from '../store';
import router from './router';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import { Breadcrumb } from 'bootstrap-vue/es/components';
Vue.use(Breadcrumb);

global.browser = require('webextension-polyfill');

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App),
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('message received from ' + sender.url + ': ' + JSON.stringify(request));
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
