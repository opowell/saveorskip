export default class {
  url: any;
  saved: any;
  constructor(url: any, saved: any, props: { [x: string]: any } | null) {
    this.url = url;
    this.saved = saved;
    if (props != null) {
      let propKeys = Object.keys(props);
      for (let i = 0; i < propKeys.length; i++) {
        let propKey = propKeys[i];
        this[propKey] = props[propKey];
      }
    }
  }
}
