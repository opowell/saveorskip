export const LINKS = {
  PROFILES: 'profiles?filters=user,generatedBy,user%5D%5D,timeAdded,&sort=decr',
  PROFILE_LINKS: '',
  PROFILE_SOURCES: '',
  LOGS: 'logs?filters=,time,&sort=decr',
};

export const Hrefs = {
  links(id: string | number) {
    return '#/profile/' + encodeURIComponent(id) + '/links?filters=,timeAdded,&sort=decr';
  },
  profileLogs(id: string | number) {
    return '#/logs?filters=Profile,objectType,Profile]]' + encodeURIComponent(id) + ',objectKeys,' + encodeURIComponent(id) + ']]';
  },
  logs(id: string | number) {
    return '#/' + LINKS.LOGS;
  },
  profiles() {
    return '#/' + LINKS.PROFILES;
  },
  profile(id: string | number) {
    return '#/profile/' + encodeURIComponent(id);
  },
  sources(id: string | number) {
    return '#/profile/' + encodeURIComponent(id) + '/sources?filters=,timeAdded,&sort=decr';
  },
  source(profileId: string | number, sourceId: string | number) {
    return Hrefs.profile(profileId) + '/source/' + encodeURIComponent(sourceId);
  },
};
