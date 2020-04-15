import * as types from './mutation-types';
import { trimmedUrl } from '../Utils';

/**
 * Mutations are synchronous.
 */
export default {
  [types.LOAD_SCRAPERS](state: { scrapers: any[] }, payload: any) {
    state.scrapers.splice(0, state.scrapers.length);
    state.scrapers.push(...payload);
  },

  [types.LOAD_PROFILE_SOURCE_LINKS](state: { profileSourceLinks: any[] }, payload: string | any[]) {
    state.profileSourceLinks.splice(0, state.profileSourceLinks.length);
    for (let i = 0; i < payload.length; i++) {
      state.profileSourceLinks.push(payload[i]);
    }
  },

  [types.SET_URL_TO_SCRAPE](state: { urlToScrape: any }, payload: any) {
    state.urlToScrape = trimmedUrl(payload);
  },

  [types.SET_SOURCE_TO_SCRAPE](state: { sourceToScrape: any }, payload: any) {
    state.sourceToScrape = trimmedUrl(payload);
  },

  // [types.DUPLICATE_PROFILE](state: { profiles: { name: any }[]; profileDuplicate: Profile }, payload: { profileId: any }) {
  //   let profile = findProfile(state, payload.profileId);

  //   let nameExists = true;
  //   let i = 0;
  //   let name;
  //   while (nameExists) {
  //     i++;
  //     name = profile.name + i;
  //     nameExists = false;
  //     for (let j = 0; j < state.profiles.length; j++) {
  //       if (state.profiles[j].name === name) {
  //         nameExists = true;
  //         break;
  //       }
  //     }
  //   }

  //   let copy = new Profile(name);
  //   for (let i in profile.links) {
  //     // Profile.setLink(copy, profile.links[i], profile.links[i].saved);
  //   }
  //   for (let i in profile.sources) {
  //     // Profile.addSources(copy, [profile.sources[i]]);
  //   }
  //   state.profiles.push(copy);
  //   state.profileDuplicate = copy;
  // },

  [types.SET_TEST_PAGE](state: { testPage: any }, payload: { page: any }) {
    state.testPage = payload.page;
  },

  [types.SET_NEED_CUR_SUGGESTION](state: { needCurSuggestion: any }, payload: { value: any }) {
    state.needCurSuggestion = payload.value;
  },

  [types.SET_SOURCE_FOR_CUR_URL](state: { sourceForCurUrl: any }, payload: { url: any }) {
    state.sourceForCurUrl = payload.url;
  },

  [types.SET_CUR_SUGGESTION_TAB_ID](state: { curSuggestionTabId: any }, payload: { tabId: any }) {
    state.curSuggestionTabId = payload.tabId;
  },

  [types.SET_ACTIVE_TAB_ID](state: { activeTabId: any }, payload: { tabId: any }) {
    state.activeTabId = payload.tabId;
  },

  [types.SET_CUR_SUGGESTION](state: { curSuggestion: any }, payload: { url: any }) {
    state.curSuggestion = payload.url;
  },

  [types.SET_NEXT_SUGGESTION](state: { nextSuggestion: any }, payload: { url: any }) {
    state.nextSuggestion = payload.url;
  },
};

function findProfile(state: { profiles: string | any[] }, id: any) {
  let profile = null;
  for (let i = 0; i < state.profiles.length; i++) {
    if (state.profiles[i].name === id) {
      profile = state.profiles[i];
    }
  }
  return profile;
}
