import { openDB } from 'idb';
import { resetState } from './index.js';
import { storeProfile, addScraper, storeSource, addLog } from './idb.ts';
import RedditScraper from '../scrapers/reddit.js';
import HackerNewsScraper from '../scrapers/hackernews.js';
import DefaultScraper from '../scrapers/default.js';
import TheGuardianScraper from '../scrapers/theguardian.js';
export const DB_NAME = 'saveorskip';

export const STORE_LINKS = 'links';
export const STORE_LINKS_PROFILEID = 'profileId';
export const STORE_LINKS_TIME_ADDED = 'timeAdded';
export const STORE_LINKS_URL = 'url';

export const STORE_PROFILES = 'profiles';

export const STORE_SOURCES = 'sources';
export const STORE_SOURCES_CONSUMERID = 'consumerId'; // The user of links.
export const STORE_SOURCES_PROVIDERID = 'providerId'; // The provider of links.

export const STORE_LOGS = 'logs';
export const STORE_LOGS_PROFILEID = 'profileId';
export const STORE_SCRAPERS = 'scrapers';

export const INDEX_STORES = [STORE_PROFILES, STORE_SOURCES, STORE_LINKS];
export const KEYPATH_SEPARATOR = '_';

export const getDBVersion = async function() {
  return (await dbPromise).version;
};

export const setDBVersion = async function(x) {
  localStorage.setItem('dbVersion', x);
};

if (!('indexedDB' in window)) {
  console.log("This browser doesn't support IndexedDB");
}

export const reset = async function() {
  addLog({
    objectKeys: [],
    objectType: 'System',
    message: 'Reset database.',
  });
  await storeProfile(
    {
      name: 'myProfile',
      defaultLinkAction: 'save',
      defaultSourceAction: 'forget',
    },
    {}
  );
  let sources = ['www.reddit.com', 'news.ycombinator.com', 'www.theguardian.com/international'];
  for (let i in sources) {
    let srcObj = {
      source: {
        saved: 0,
      },
      providerId: sources[i],
      consumerId: 1,
      pointsChange: 5,
      overwrite: 0,
    };
    await storeSource(srcObj);
  }
  await addScraper(DefaultScraper);
  await addScraper(RedditScraper);
  await addScraper(HackerNewsScraper);
  await addScraper(TheGuardianScraper);
  resetState();
};

export const setDBPromise = async function(dbp) {
  dbPromise = dbp;
  setDBVersion(await dbp.version);
};

export const getDBPromise = function() {
  return dbPromise;
};

let dbVersion = +localStorage.getItem('dbVersion');
if (dbVersion === 0) {
  dbVersion = 1;
}

// When anything below changes, increment DB_VERSION or delete existing database. This forces the database schema to be updated.
let dbPromise = openDB(DB_NAME, dbVersion, {
  async upgrade(db, oldVersion, newVersion, transaction) {
    if (oldVersion === 0) {
      console.log('Creating stores');

      db.createObjectStore(STORE_PROFILES, {
        keyPath: 'id',
        autoIncrement: true,
      });
      db.createObjectStore(STORE_LINKS, {
        keyPath: [STORE_LINKS_PROFILEID, 'url'],
      });

      db.createObjectStore(STORE_SOURCES, { keyPath: [STORE_SOURCES_CONSUMERID, STORE_SOURCES_PROVIDERID] });
      db.createObjectStore(STORE_SCRAPERS, {
        keyPath: 'id',
        autoIncrement: true,
      });

      db.createObjectStore(STORE_LOGS, {
        keyPath: 'id',
        autoIncrement: true,
      });

      await reset();
    }
  },
  async blocking() {
    (await dbPromise).close();
  },
});
