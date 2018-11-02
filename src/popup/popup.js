import Vue from 'vue';
import App from './App';
import store from '../store';
import router from './router';

global.browser = require('webextension-polyfill');

/* eslint-disable no-new */
new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App),
  created: function() {
    chrome.tabs.query({ active: true }, function(tabs) {
      store.dispatch('setCurUrl', tabs[0].url);
    });
  },
});
