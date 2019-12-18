import Link from './Link';
import { Source } from './Source';
import Vue from 'vue';

export default class {
  constructor(name) {
    this.name = name;
  }

  static addSources(profile, sources) {
    if (sources == null || profile == null) {
      return;
    }
    console.log('adding sources: ' + profile.name + ', ' + JSON.stringify(sources));
    for (let i = 0; i < sources.length; i++) {
      let source = sources[i];
      var srcObj = profile.sources[source.url] ? profile.sources[source.url] : Source(source.url);
      srcObj.points = srcObj.points + source.points;
      if (source.saved != null) {
        srcObj.saved = source.saved;
      }
      Vue.set(profile.sources, source.url, srcObj);
    }
  }

  static setLink(profile, link, saved) {
    if (profile == null) {
      return;
    }

    if (typeof link !== 'object') {
      link = { url: link };
    }

    if (profile.links[link.url] != null) {
      profile.links[link.url].saved = saved;
      return;
    }
    let newLink = new Link(link.url, saved, link.keyProps);
    Vue.set(profile.links, link.url, newLink);
  }

  static removeLink(profile, url) {
    Vue.delete(profile.links, url);
  }

  static removeSource(profile, url) {
    Vue.delete(profile.sources, url);
  }

  static setSourceSaved(profile, url, saved) {
    if (profile == null) {
      return;
    }
    let source = profile.sources[url];
    if (source == null) {
      return;
    }

    source.saved = saved;
  }

  static saveLink(profile, url) {
    this.setLink(profile, url, true);
  }

  static skipLink(profile, url) {
    this.setLink(profile, url, false);
  }
}
