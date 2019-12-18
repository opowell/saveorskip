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
