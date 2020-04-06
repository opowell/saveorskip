import * as types from './mutation-types';
import { trimmedUrl } from '../../Utils';

/**
 * Mutations are synchronous.
 */
export default {
  [types.SET_CUR_PAGE2](state: { curPage: any }, payload: { url: null; name: any; id: any } | null) {
    if (payload == null || payload.url == null) {
      console.log('no url given');
      return;
    }
    payload.url = trimmedUrl(payload.url);
    delete payload.name;
    delete payload.id;
    state.curPage = payload;
  },
};
