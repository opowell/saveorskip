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

  return target.sources[state.curUrl].saved ? 'saved' : 'unsaved';
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
