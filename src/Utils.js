export function trimmedUrl(url) {
  if (url == null) {
    debugger;
    console.log('error trying to trim url');
  }

  if (url.includes == null) {
    debugger;
    console.log('error trying to trim url, url.includes is not defined');
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
