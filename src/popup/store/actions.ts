import * as types from './mutation-types';

export const setCurPage = ({ commit }: { commit: any }, payload: any) => {
  commit(types.SET_CUR_PAGE2, payload);
};
