export const profileObjs = state => state.profileObjs;

export const profileDuplicate = state => state.profileDuplicate;

export const curTarget = state => {
  for (let i = 0; i < state.profileObjs.length; i++) {
    if (state.profileObjs[i].name === state.targetId) {
      return state.profileObjs[i];
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
    return 'not set';
  }
  return getters.curLinkOnTarget.saved ? 'saved' : 'not saved';
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
