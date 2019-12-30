import { openDB } from 'idb';
import store from '../store/index.js';

export const DB_NAME = 'saveorskip';

export const STORE_LINKS = 'links';
export const STORE_LINKS_PROFILEID = 'profileId';
export const STORE_LINKS_TIME_ADDED = 'timeAdded';
export const STORE_LINKS_URL = 'url';
export const INDEX_LINKS_PROFILEID = STORE_LINKS_PROFILEID;
export const INDEX_LINKS_PROFILEID_TIMEADDED = STORE_LINKS_PROFILEID + '_' + STORE_LINKS_TIME_ADDED;

export const STORE_PROFILES = 'profiles';

export const STORE_SOURCES = 'sources';
export const STORE_SOURCES_CONSUMERID = 'consumerId'; // The user of links.
export const STORE_SOURCES_PROVIDERID = 'providerId'; // The provider of links.
export const INDEX_SOURCES_CONSUMERID = STORE_SOURCES_CONSUMERID;

const DB_VERSION = 4;

if (!('indexedDB' in window)) {
  console.log("This browser doesn't support IndexedDB");
}

// When anything below changes, increment DB_VERSION. This forces the database schema to be updated.
export const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db, oldVersion, newVersion, transaction) {
    store.state.dbPromise = this;
    if (oldVersion === 0) {
      console.log('Creating stores');

      db.createObjectStore(STORE_PROFILES, { keyPath: 'id', autoIncrement: true });

      let linksStore = db.createObjectStore(STORE_LINKS, { keyPath: [STORE_LINKS_PROFILEID, 'url'] });
      linksStore.createIndex('saved', 'saved', { unique: false });
      linksStore.createIndex(INDEX_LINKS_PROFILEID, INDEX_LINKS_PROFILEID, { unique: false });
      linksStore.createIndex(INDEX_LINKS_PROFILEID_TIMEADDED, ['profileId', 'timeScraped']);

      let sourcesStore = db.createObjectStore(STORE_SOURCES, { keyPath: [STORE_SOURCES_CONSUMERID, STORE_SOURCES_PROVIDERID] });
      sourcesStore.createIndex(STORE_SOURCES_CONSUMERID, STORE_SOURCES_CONSUMERID);
      sourcesStore.createIndex('saved', 'saved');
      sourcesStore.createIndex('url', 'url');
    }
  },
});
