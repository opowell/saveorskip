export const foo = state => state.foo;

export const profiles = state => state.profiles;

export const profileObjs = state => state.profileObjs;

export const curTarget = state => {
  console.log('checking for new target');
  for (let i = 0; i < profileObjs; i++) {
    if (profileObjs[i].name === state.targetId) {
      return profileObjs[i];
    }
  }
  return null;
};

export const curUrlSaved = state => state.curUrlSaved;
