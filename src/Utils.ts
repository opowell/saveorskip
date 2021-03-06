export function convertId(id: any) {
  if (isNaN(id)) {
    return id;
  }
  return Number.parseInt(id);
}

// export function setIfNotNull(obj: Object, field: string) {
//   if (obj[field] != null) {
//     eval(`obj[field] = ${obj[field]}`);
//   }
// }

// eslint-disable-next-line no-unused-vars
export function scoreFnHot(src: any) {
  if (src.points < 1) {
    return 0;
  }

  let now = new Date();
  if (src.nextScrape != null && src.scrapedLinks != null && new Date(src.nextScrape) > now && src.scrapedLinks.length === 0) {
    return 0;
  }

  return src.points / Math.pow((new Date().getTime() - new Date(src.lastSaved).getTime()) / (1000 * 60 * 60) + 2, 2);
}

export function scoreFnJustPoints(src: { points: number }) {
  let p = src.points - 0;
  if (p < 1) {
    return 0;
  }

  // TODO: If source is not due to be scraped, and has no scraped links, return 0.
  // let now = new Date();
  // // eslint-disable-next-line prettier/prettier
  // if (src.nextScrape != null && src.scrapedLinks != null && new Date(src.nextScrape) > now && src.scrapedLinks.length === 0) {
  //   return 0;
  // }

  return p;
}

export function drawRandomElFromObject(object: Array<any>, scoreFn: Function) {
  let sum = 0;
  // console.log('DRAWING RANDOM ELEMENT');
  let scores = [];
  for (let i = 0; i < object.length; i++) {
    let score = scoreFn(object[i]);
    scores.push(score);
    if (score > 0) {
      sum = sum + score;
    }
  }

  if (sum === 0) {
    // console.log('Error drawing item from list: no item with any points');
    return [null, -1];
  }

  let selected = null;
  let selectedInd = -1;

  let draw = Math.random() * sum; // random number between 0 (incl.) and sum (excl.)
  let curSum = 0;
  for (let j = 0; j < object.length; j++) {
    let score = scores[j];
    if (score > 0) {
      curSum = curSum + score;
      if (curSum > draw && selectedInd === -1) {
        selected = object[j];
        selectedInd = j;
        break;
      }
    }
  }

  for (let k = 0; k < object.length; k++) {
    let score = scores[k];
    let selText = '  ';
    if (k === selectedInd) {
      selText = '>>';
    }
    let obj = object[k];
    try {
      // console.log(selText + ' ' + score + ' - ' + obj.saved + ' - ' + obj.points + ' - ' + obj.providerId);
    } catch (err) {
      console.error('ERROR2');
    }
  }

  return [selected, selectedInd];
}

export function trimmedUrl(url: any) {
  if (url == null) {
    return null;
  }

  if (url.includes == null) {
    return url;
  }

  url = trimString(url, 'http://');
  url = trimString(url, 'https://');

  if (url.endsWith('/')) {
    url = url.substring(0, url.length - 1);
  }

  return url;
}

export function trimString(url: string, toRemove: string) {
  if (url.includes(toRemove)) {
    url = url.substring(url.indexOf(toRemove) + toRemove.length);
  }
  return url;
}

export function joinArray(array: Array<any>) {
  let out = '';
  for (let i = 0; i < array.length; i++) {
    out += JSON.stringify(array[i]) + '\n';
  }
  return out;
}
