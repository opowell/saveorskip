import { openDB } from 'idb';
import store from '../store/index.js';
const dbName = 'saveorskip';

let dbPromise = openDB(dbName, 1, {
  upgrade(db, oldVersion, newVersion, transaction) {
    store.state.dbPromise = this;
    if (oldVersion === 0) {
      console.log('Creating stores');

      db.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });

      let linksStore = db.createObjectStore('links', { keyPath: ['profileId', 'url'] });
      linksStore.createIndex('saved', 'saved', { unique: false });
      linksStore.createIndex('profileId', 'profileId', { unique: false });
      linksStore.createIndex('url', 'url', { unique: false });

      let sourcesStore = db.createObjectStore('sources', { keyPath: ['profileId', 'url'] });
      sourcesStore.createIndex('profileId', 'profileId');
      sourcesStore.createIndex('saved', 'saved');
      sourcesStore.createIndex('url', 'url');
    }
  },
});

export const curTarget = state => {
  for (let i = 0; i < state.profiles.length; i++) {
    if (state.profiles[i].name === state.targetId) {
      return state.profiles[i];
    }
  }
  return null;
};

export const curSourceStatus = function(state, getters) {
  let target = getters.curTarget;
  if (target == null) {
    return 'error';
  }

  if (target.sources[state.curLink.url] == null) {
    return 'neither';
  }

  return target.sources[state.curLink.url].saved ? 'saved' : 'unsaved';
};

export const curLinkStatus = function(state, getters) {
  let target = getters.curTarget;
  if (target == null) {
    return 'error';
  }

  if (target.links[state.curLink.url] == null) {
    return 'neither';
  }

  return target.links[state.curLink.url].saved ? 'saved' : 'not saved';
};

export const getLinks = function(state, getters) {
  return function(profileId) {
    let out = [];
    dbPromise.then(async function(db) {
      let storeName = 'links';
      var tx = db.transaction(storeName, 'readonly');
      try {
        console.log('Get links: Profile.id=' + profileId);
        out = await db.getAllFromIndex(storeName, 'profileId');
        console.log('found ' + out.length + ' links');
      } catch (e) {
        tx.abort();
        console.log(e);
        console.log(e.stack);
      }
    });
    return out;
  };
};
