export function Source(url, profileId) {
  let out = {};
  out.consumerId = profileId;
  out.providerId = url;
  out.timeAdded = new Date();
  out.points = 0;
  out.saved = 0;
  return out;
}
