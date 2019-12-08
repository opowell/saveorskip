import store from './index.js';
import { dbPromise, STORE_LINKS, STORE_PROFILES, STORE_LINKS_PROFILEID, STORE_SOURCES_PROFILEID, STORE_SOURCES } from './Constants';
import { trimmedUrl } from './Utils';
import Profile from '../models/Profile.js';
import * as types from './mutation-types';

export default {
  [types.FETCH_PROFILES](state) {
    dbPromise.then(async function(db) {
      const tx = db.transaction(STORE_PROFILES);
      const profilesStore = tx.objectStore(STORE_PROFILES);
      const values = await profilesStore.getAll();
      console.log(JSON.stringify(values));
      let profiles = [];
      for (let i = 0; i < values.length; i++) {
        values[i].numLinks = await db.countFromIndex(STORE_LINKS, STORE_LINKS_PROFILEID, values[i].id);
        values[i].numSources = await db.countFromIndex(STORE_SOURCES, STORE_SOURCES_PROFILEID, values[i].id);
        profiles.push(values[i]);
      }
      await tx.done;
      store.dispatch('fetchProfiles', profiles);
    });
  },

  [types.ADD_PROFILE](payload) {
    let profile = new Profile(payload);
    dbPromise.then(async function(db) {
      var tx = db.transaction(STORE_PROFILES, 'readwrite');
      var profilesStore = tx.objectStore(STORE_PROFILES);
      try {
        await Promise.all(
          [profile].map(function(item) {
            let toSave = {
              name: item.name,
            };
            console.log('Adding profile:', toSave);
            profilesStore.put(toSave);
            store.dispatch('addProfile', toSave);
            console.log('Profile added successfully!');
          })
        );
      } catch (e) {
        tx.abort();
        console.log(e);
        console.log(e.stack);
      }
    });
  },

  [types.SET_CUR_URL_LINK_STATUS](payload) {
    let url = store.state.curLink.url;
    if (store.state.targetId == null) {
      console.log('no current target');
      store.dispatch('setCurUrlLinkStatus', 'neither');
      return;
    }
    if (url == null) {
      console.log('no link');
      store.dispatch('setCurUrlLinkStatus', 'neither');
      return;
    }
    url = trimmedUrl(url);
    console.log('1. checking link status of ' + store.state.targetId + '/' + url);
    dbPromise.then(async function(db) {
      try {
        console.log('2. running query');
        let link = await db.get(STORE_LINKS, [store.state.targetId - 0, url]);
        console.log('3. check null');
        if (link == null) {
          store.dispatch('setCurUrlLinkStatus', 'neither');
          return;
        }
        console.log('4. returning ' + link.saved);
        store.dispatch('setCurUrlLinkStatus', link.saved);
        return;
      } catch (e) {
        console.log(e);
        console.log(e.stack);
      }
    });
  },
};
