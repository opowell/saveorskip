export const LINKS = {
  PROFILES: 'profiles?filters=user,generatedBy,user%5D%5D,timeAdded,&sort=decr',
  PROFILE_LINKS: '',
  PROFILE_SOURCES: '',
  LOGS: 'logs?filters=,time,&sort=decr',
};

import Vue from 'vue';

export const MessageEventBus = new Vue();

export const Hrefs = {
  home() {
    return '#/';
  },
  indices() {
    return '#/indices';
  },
  scrapingQueue() {
    return '#/scraping-queue';
  },
  link(profileId: string | number, linkUrl: string | number) {
    return '#/profile/' + encodeURIComponent(profileId) + '/links/' + encodeURIComponent(linkUrl);
  },
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
  scraper(id: string | number) {
    return '#/scrapers/' + encodeURIComponent(id);
  },
  scrapers() {
    return '#/scrapers';
  },
  sources(id: string | number) {
    return '#/profile/' + encodeURIComponent(id) + '/sources?filters=,timeAdded,&sort=decr';
  },
  source(profileId: string | number, sourceId: string | number) {
    return Hrefs.profile(profileId) + '/source/' + encodeURIComponent(sourceId);
  },
};
