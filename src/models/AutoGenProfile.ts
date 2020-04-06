export function Profile(name: any) {
  let out = {
    name,
  };
  initNextScrape(out);
  return out;
}

export function incrementScrapeDate(source: { nextScrape: Date }) {
  source.nextScrape = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
}

export function initNextScrape(source: { name: any; nextScrape?: any }) {
  source.nextScrape = new Date();
}
