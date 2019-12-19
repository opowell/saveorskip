export function trimmedUrl(url) {
  if (url == null) {
    return null;
  }

  if (url.includes == null) {
    return url;
  }

  if (url.includes('://')) {
    url = url.substring(url.indexOf('://') + '://'.length);
  }
  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }

  return url;
}

export function joinArray(array) {
  let out = '';
  for (let i = 0; i < array.length; i++) {
    out += JSON.stringify(array[i]) + '\n';
  }
  return out;
}
