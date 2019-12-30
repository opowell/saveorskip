export function Profile(name) {
  let out = {};
  out.name = name;
  initNextScrape(out);
  return out;
}

export function incrementScrapeDate(source) {
  source.nextScrape = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
}

export function initNextScrape(source) {
  source.nextScrape = new Date();
}
