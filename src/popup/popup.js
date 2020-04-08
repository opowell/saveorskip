import Vue from 'vue';
import App from './App';
import store from './store';
import router from './router';

global.browser = require('webextension-polyfill');

/* eslint-disable no-new */
window.vue = new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App),
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  let action = request;
  if (request.action != null) {
    action = request.action;
  }

  switch (action) {
    case 'storeDispatch':
      try {
        store.dispatch(request.storeAction, request.storePayload);
      } catch (e) {}
      break;
  }
});
