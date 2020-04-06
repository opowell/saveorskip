export function Source(url: string | number, profileId: string | number) {
  let out = {
    consumerId: profileId,
    providerId: url,
    timeAdded: new Date(),
    points: 0,
    saved: 0,
  };
  return out;
}
