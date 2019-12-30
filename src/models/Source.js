export function Source(url, profileId) {
  let out = {};
  out.consumerId = profileId - 0;
  out.providerId = url;
  out.timeAdded = new Date();
  out.points = 0;
  out.saved = false;
  return out;
}
