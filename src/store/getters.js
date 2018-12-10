export const curTarget = state => {
  for (let i = 0; i < state.profiles.length; i++) {
    if (state.profiles[i].name === state.targetId) {
      return state.profiles[i];
    }
  }
  return null;
};

export const curLinkOnTarget = function(state, getters) {
  let target = getters.curTarget;
  if (target == null) {
    return 'error';
  }
  for (let i = 0; i < target.links.length; i++) {
    if (target.links[i].url === state.curUrl) {
      return target.links[i];
    }
  }
  return null;
};

export const curLinkOnTargetStatus = function(state, getters) {
  if (getters.curLinkOnTarget == null) {
    return 'neither';
  }
  return getters.curLinkOnTarget.saved ? 'saved' : 'not saved';
};

export const curSourceStatus = function(state, getters) {
  let target = getters.curTarget;
  if (target == null) {
    return 'error';
  }

  if (target.sources[state.curUrl] == null) {
    return 'no';
  }

  return target.sources[state.curUrl].saved ? 'saved' : 'unsaved';
};

export const curLinkStatus = function(state, getters) {
  let target = getters.curTarget;
  if (target == null) {
    return 'error';
  }
  for (let i = 0; i < target.links.length; i++) {
    if (target.links[i].url === state.curUrl) {
      return target.links[i].saved ? 'saved' : 'not saved';
    }
  }
  return 'neither';
};
