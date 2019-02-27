import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
// import { firebase } from '@firebase/app';
// import '@firebase/firestore';
// import createEasyFirestore from 'vuex-easy-firestore';

import * as getters from './getters';
import mutations from './mutations';
import * as actions from './actions';

Vue.use(Vuex);

// Initialize Firebase
// var config = {
//   apiKey: 'AIzaSyBaBNMQJc7MeuzjM4Jy-UYNjQAXmyoFZJs',
//   authDomain: 'saveorskip-firestore.firebaseapp.com',
//   databaseURL: 'https://saveorskip-firestore.firebaseio.com',
//   projectId: 'saveorskip-firestore',
//   storageBucket: 'saveorskip-firestore.appspot.com',
//   messagingSenderId: '329820220176',
// };
// firebase.initializeApp(config);

// const myModule = {
//   firestorePath: 'profiles',
//   firestoreRefType: 'collection', // or 'doc'
//   moduleName: 'fsProfiles', // field in 'store'
//   statePropName: 'data', // store[moduleName][statePropName]
//   namespaced: true, // automatically added
//   // you can also add your own state/getters/mutations/actions
// };

// // do the magic 🧙🏻‍♂️
// const easyFirestore = createEasyFirestore(myModule, { logging: true });

export default new Vuex.Store({
  state: {
    // Active tab id
    activeTabId: '',

    // Input for new profile
    profileInput: '',

    // Set of profiles.
    profiles: [],

    // Id of current target.
    targetId: '',
    curLink: {
      url: '',
      title: '',
    },
    curSuggestion: null,
    curSuggestionTabId: null,
    profileDuplicate: null,
    sourceDuplicate: null,
    needCurSuggestion: true,
    sourceForCurUrl: null,
    nextSuggestion: null,
    scrapeDelayMS: 1000 * 60 * 60 * 24,
    urlToScrape: null,
  },
  getters,
  mutations,
  actions,
  plugins: [
    createPersistedState(),
    // easyFirestore
  ],
});

// // open the DB channel
// store.dispatch('myModule/openDBChannel')
