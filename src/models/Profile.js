export default class {
  constructor(name) {
    this.name = name;
    this.getSuggestion = `
async function loadNextSuggestion() {
  try {
    let sources = await idb.getProfileSources(this.id);
    while (true) {
      let source = drawRandomElFromObject(sources, this.scoreFunction);
      if (source == null) {
        console.log('error loading suggestion: no source found');
        return;
      }
      scrapeIfNecessary(source);

      console.log('DRAWING SUGGESTION from ' + source.url);
      await idb.dispatchToStores('setSourceForCurUrl', trimmedUrl(source.url));
      let linksCursor = await idb.getLinksByTimeAdded(profileId);
      if (linksCursor == null) {
        console.log('no links, skipping ' + source.url);
        for (let i = 0; i < sources.length; i++) {
          if (sources[i] === source) {
            sources.splice(i, 1);
            break;
          }
        }
        continue;
      }
      let nextUrl = null;
      while (nextUrl === null) {
        // Check if current link already exists on profile.
        let storeLink = await idb.getLink({
          profileId,
          linkId: linksCursor.value.url,
        });
        let alreadyExists = storeLink != null;
        if (!alreadyExists) {
          nextUrl = linksCursor.value.url;
        } else {
          try {
            await idb.deleteLink({
              profileId,
              sourceId: source.url,
              linkId: linksCursor.value.url,
            });
            await linksCursor.continue();
          } catch (err) {
            nextUrl = null;
          }
        }
      }

      if (nextUrl !== null) {
        changeActiveTabToUrl(linksCursor.value.url);
        return;
      }
    }
  } catch (err) {
    console.log(err);
  }
}
    `;
  }
}
