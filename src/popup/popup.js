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
      store.dispatch(request.storeAction, request.storePayload);
      break;
  }
});

// const sos = {};

// sos.log = function(message) {
//   console.log('popup.js received message: ' + JSON.stringify(message));
//   let div = document.createElement('div');
//   div.appendChild(document.createTextNode(JSON.stringify(message)));
//   document.getElementById('messages').appendChild(div);
// };

// sos.sendMessage = function(text) {
//   chrome.runtime.sendMessage(text);
// };

// sos.showNextPage = function() {
//   chrome.runtime.sendMessage('showNextPage');
// };
