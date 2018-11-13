import Link from './Link';
import Source from './Source';

export default class {
  constructor(name) {
    this.name = name;
    this.links = []; // TODO: Change to object.
    this.sources = {};
  }

  static removeSource(profile, url) {
    if (url == null || profile == null) {
      return;
    }
    console.log('Profile ' + profile.name + ': removing source ' + url);
    delete profile.sources[url];
  }

  static addSources(profile, sources) {
    if (sources == null || profile == null) {
      return;
    }
    console.log('adding sources: ' + profile.name + ', ' + JSON.stringify(sources));
    for (let i = 0; i < sources.length; i++) {
      let source = sources[i];
      var srcObj = profile.sources[source.url] ? profile.sources[source.url] : new Source(source.url);
      srcObj.points = srcObj.points + source.points;
      profile.sources[source.url] = srcObj;
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
