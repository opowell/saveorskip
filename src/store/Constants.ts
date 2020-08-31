import { openDB, IDBPDatabase } from 'idb';
import { resetState } from './index';
import { storeProfile, addLink, addScraper, storeSource, addLog, parseBrowserHistory } from './idb';
import RedditScraper from '../scrapers/reddit';
import HackerNewsScraper from '../scrapers/hackernews';
import DefaultScraper from '../scrapers/default';
import TheGuardianScraper from '../scrapers/theguardian';
import { trimmedUrl } from '../Utils';
export const DB_NAME = 'saveorskip';

export const STORE_LINKS = 'links';
export const STORE_LINKS_PROFILEID = 'profileId';
export const STORE_LINKS_TIME_ADDED = 'timeAdded';
export const STORE_LINKS_URL = 'url';

export const STORE_SCRAPING_QUEUE = 'scraping-queue';
export const STORE_SCRAPING_QUEUE_PROFILEID = 'profileId';
export const STORE_SCRAPING_QUEUE_TIMEQUEUED = 'timeQueued';

export const STORE_PROFILES = 'profiles';

export const STORE_SOURCES = 'sources';
export const STORE_SOURCES_CONSUMERID = 'consumerId'; // The user of links.
export const STORE_SOURCES_PROVIDERID = 'providerId'; // The provider of links.

export const STORE_LOGS = 'logs';
export const STORE_LOGS_PROFILEID = 'profileId';
export const STORE_SCRAPERS = 'scrapers';

export const INDEX_STORES = [STORE_PROFILES, STORE_SOURCES, STORE_LINKS];
export const KEYPATH_SEPARATOR = '_';

export const LINK_STATUS = {
  SKIPPED: 0,
  SAVED: 1,
};

export const getDBVersion = async function() {
  return (await dbPromise).version;
};

export const setDBVersion = function(x: number) {
  localStorage.setItem('dbVersion', x + '');
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
      defaultLinkAction: LINK_STATUS.SAVED,
      defaultSourceAction: 'forget',
    },
    {}
  );

  await parseBrowserHistory({ consumerId: 1, maxScrapes: 10 });

  await addScraper(DefaultScraper);
  await addScraper(RedditScraper);
  await addScraper(HackerNewsScraper);
  await addScraper(TheGuardianScraper);
  resetState();
};

export const setDBPromise = async function(dbp: Promise<IDBPDatabase<unknown>>) {
  try {
    dbPromise = dbp;
    let x = await dbp;
    setDBVersion(x.version);
  } catch (e) {
    console.log(e);
    debugger;
  }
};

export const getDBPromise = function() {
  return dbPromise;
};

export const createDB = function() {
  // When anything below changes, increment DB_VERSION or delete existing database. This forces the database schema to be updated.
  let dbPromise = openDB(DB_NAME, dbVersion, {
    async upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion === 0) {
        console.log('Creating stores');

        db.createObjectStore(STORE_PROFILES, {
          keyPath: 'id',
          autoIncrement: true,
        });

        let scrapingQueueStore = db.createObjectStore(STORE_SCRAPING_QUEUE, { keyPath: STORE_SCRAPING_QUEUE_PROFILEID });

        scrapingQueueStore.createIndex(STORE_SCRAPING_QUEUE_TIMEQUEUED, STORE_SCRAPING_QUEUE_TIMEQUEUED);

        db.createObjectStore(STORE_LINKS, {
          keyPath: [STORE_LINKS_PROFILEID, 'url'],
        });

        db.createObjectStore(STORE_SOURCES, {
          keyPath: [STORE_SOURCES_CONSUMERID, STORE_SOURCES_PROVIDERID],
        });

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
      console.log('blocking something, closing');
      this.close();
    },

    blocked() {
      console.log('blocked');
    },
  });
  setDBPromise(dbPromise);
};

// @ts-ignore
let dbVersion = +localStorage.getItem('dbVersion');
if (dbVersion === 0) {
  dbVersion = 1;
}

let dbPromise: Promise<IDBPDatabase<unknown>>;

createDB();
