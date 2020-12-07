import Vue from 'vue';
import App from './App';
import store from '../store';
import router from './router';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import BootstrapVue from 'bootstrap-vue';
Vue.use(BootstrapVue);

global.browser = require('webextension-polyfill');

Vue.config.productionTip = false;
/* eslint-disable no-new */
window.vue = new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App),
});
