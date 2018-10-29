export default class {
  constructor(url, saved, props) {
    this.url = url;
    this.saved = saved;
    for (let key in props) {
      this[key] = props[key];
    }
  }
}
