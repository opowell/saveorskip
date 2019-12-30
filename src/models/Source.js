export function Source(url, profileId) {
  let out = {};
  out.url = url;
  out.profileId = profileId - 0;
  out.firstSaved = new Date().toJSON();
  out.lastSaved = new Date().toJSON();
  out.nextScrape = new Date().toJSON();
  out.points = 0;
  out.saved = false;
  return out;
}

export function incrementScrapeDate(source) {
  source.nextScrape += new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toJSON();
}
