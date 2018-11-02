import Link from './Link';
import Source from './Source';
import Vue from 'vue';

export default class {
  constructor(name) {
    this.name = name;
    this.links = []; // TODO: Change to object.
    this.suggestedSources = {};
    this.savedSources = {};
  }

  static removeSuggestedSource(profile, url) {
    if (url == null || profile == null) {
      return;
    }
    console.log('Profile ' + profile.name + ': removing suggested source ' + url);
    delete profile.suggestedSources[url];
  }

  static addSuggestedSources(profile, sources) {
    if (sources == null || profile == null) {
      return;
    }
    console.log('adding suggested sources: ' + profile.name + ', ' + JSON.stringify(sources));
    for (let i = 0; i < sources.length; i++) {
      let source = sources[i];
      var srcObj = profile.suggestedSources[source.url] ? profile.suggestedSources[source.url] : new Source(source.url);
      srcObj.points = srcObj.points + source.points;
      profile.suggestedSources[source.url] = srcObj;
    }
  }

  static removeLink(profile, url) {
    if (profile == null) {
      return;
    }

    for (let i = 0; i < profile.links.length; i++) {
      if (profile.links[i].url === url) {
        profile.links.splice(i, 1);
        return;
      }
    }
  }

  static setLink(profile, url, saved) {
    if (profile == null) {
      return;
    }
    for (let i = 0; i < profile.links.length; i++) {
      if (profile.links[i].url === url) {
        profile.links[i].saved = saved;
        return;
      }
    }

    let link = new Link(url, saved);
    console.log('set link: ' + saved + ', ' + url);
    profile.links.push(link);
  }

  static saveLink(profile, url) {
    this.setLink(profile, url, true);
  }

  static skipLink(profile, url) {
    this.setLink(profile, url, false);
  }
}
