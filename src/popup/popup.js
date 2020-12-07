import Vue from 'vue';
import App from './App';
import router from './router';

global.browser = require('webextension-polyfill');

Vue.config.productionTip = false;
/* eslint-disable no-new */
window.vue = new Vue({
  el: '#app',
  router,
  render: h => h(App),
});
