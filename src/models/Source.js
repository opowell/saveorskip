export default class {
  constructor(url) {
    this.firstSaved = new Date().toJSON();
    this.lastSaved = new Date().toJSON();
    this.lastScraped = null;
    this.nextScrape = new Date().toJSON();
    this.points = 0;
    this.scrapedLinks = [];
    this.url = url;
  }
}
