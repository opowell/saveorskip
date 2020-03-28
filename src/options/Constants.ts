export const LINKS = {
  PROFILES: 'profiles?filters=user,generatedBy,user%5D%5D,timeAdded,&sort=decr',
  PROFILE_LINKS: '',
  PROFILE_SOURCES: '',
};

export const Hrefs = {
  profiles() {
    return '#/' + LINKS.PROFILES;
  },
  profile(id: string | number) {
    return '#/profile/' + encodeURIComponent(id);
  },
};
