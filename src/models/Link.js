export default class {
  constructor(link, saved) {
    this.url = link.url;
    this.saved = saved;
    let propKeys = Object.keys(link);
    for (let i = 0; i < propKeys.length; i++) {
      let propKey = propKeys[i];
      this[propKey] = link[propKey];
    }
  }
}
