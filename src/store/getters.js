import { dbPromise, STORE_SOURCES, STORE_LINKS } from './Constants.ts';
import { trimmedUrl } from '../Utils.js';

export const curTarget = state => {
  for (let i = 0; i < state.profiles.length; i++) {
    if (state.profiles[i].id === state.targetId) {
      return state.profiles[i];
    }
  }
  if (state.profiles.length > 0) {
    return state.profiles[0];
  }
  return null;
};

export const curSourceStatus = function(state, getters) {
  if (getters.curTarget == null) {
    return 'neither';
  }
  dbPromise.then(async function(db) {
    var tx = db.transaction(STORE_SOURCES, 'readonly');
    try {
      let source = await db.get(STORE_SOURCES, [state.targetId, state.curLink.url]);
      if (source == null) {
        return 'neither';
      }
      return source.saved ? 'saved' : 'unsaved';
    } catch (e) {
      console.log(e);
      console.log(e.stack);
      tx.abort();
    }
  });
};

// export const curLinkStatus = function(state, getters) {
//   if (getters.curTarget == null) {
//     console.log('no current target');
//     return 'neither';
//   }
//   if (state.curLink == null || state.curLink.url == null) {
//     console.log('no current link');
//     return 'neither';
//   }
//   console.log('checking link status of ' + state.targetId + '/' + state.curLink.url);
//   dbPromise.then(async function(db) {
//     try {
//       let link = await db.get(STORE_LINKS, [state.targetId, state.curLink.url]);
//       if (link == null) {
//         return 'neither';
//       }
//       return link.saved ? 'saved' : 'unsaved';
//     } catch (e) {
//       console.log(e);
//       console.log(e.stack);
//     }
//   });
// };

// export const curLinkStatus = function(state, getters) {
//   let target = getters.curTarget;
//   if (target == null) {
//     return 'error';
//   }

//   if (target.links[state.curLink.url] == null) {
//     return 'neither';
//   }

//   return target.links[state.curLink.url].saved ? 'saved' : 'not saved';
// };

export const getUrlLinkStatus = function(state, getters) {
  return function(url) {
    if (state.targetId == null) {
      console.log('no current target');
      return 'neither';
    }
    if (url == null) {
      console.log('no link');
      return 'neither';
    }
    url = trimmedUrl(url);
    console.log('1. checking link status of ' + state.targetId + '/' + url);
    dbPromise.then(async function(db) {
      try {
        console.log('2. running query');
        let link = await db.get(STORE_LINKS, [state.targetId - 0, url]);
        console.log('3. check null');
        if (link == null) {
          return 'neither';
        }
        console.log('4. returning ' + link.saved);
        state.curLinkStatus = link.saved ? 'saved' : 'unsaved';
        return state.curLinkStatus;
      } catch (e) {
        console.log(e);
        console.log(e.stack);
      }
    });
  };
};

export const getUrlSourceStatus = function(state, getters) {
  return function(url) {
    if (getters.curTarget == null) {
      console.log('no current target');
      return 'neither';
    }
    if (url == null) {
      console.log('no source');
      return 'neither';
    }
    console.log('checking source status of ' + state.targetId + '/' + url);
    dbPromise.then(async function(db) {
      try {
        let source = await db.get(STORE_SOURCES, [state.targetId, url]);
        if (source == null) {
          return 'neither';
        }
        return source.saved ? 'saved' : 'unsaved';
      } catch (e) {
        console.log(e);
        console.log(e.stack);
      }
    });
  };
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
