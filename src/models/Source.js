import { convertId } from '../Utils.js';

export function Source(url, profileId) {
  let out = {};
  out.consumerId = convertId(profileId);
  out.providerId = url;
  out.timeAdded = new Date();
  out.points = 0;
  out.saved = false;
  return out;
}
