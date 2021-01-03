import { getDBPromise, LINK_STATUS, STORE_LINKS, STORE_SOURCES } from '../store/Constants';
import { drawRandomElFromObject, scoreFnJustPoints } from '../Utils';
import { addLink, getLink, getProfileSources, scrapeIfNecessary, storeProfile } from '../store/idb';

export default class {
  name: string;
  defaultLinkAction: number;
  defaultSourceAction: string;
  id: string | number;
  constructor(name: string) {
    this.name = name;
    this.defaultLinkAction = LINK_STATUS.SAVED;
    this.defaultSourceAction = 'nothing';
  }
  async storeSource(
    {
      source,
      providerId,
      pointsChange,
      overwrite,
    }: {
      source: { [k: string]: any };
      providerId: string | number;
      pointsChange: number;
      overwrite: boolean;
    },
    bgState: any
  ) {
    // console.log('idb.storeSource', source, providerId, consumerId, pointsChange, overwrite);

    const db = await getDBPromise(bgState);

    if (providerId == null) {
      providerId = source.url;
    }

    let storeObject = null;
    if (!overwrite) {
      storeObject = await db.get(STORE_SOURCES, [this.id, providerId]);
      if (storeObject != null) {
        for (let i in source) {
          storeObject[i] = source[i];
        }
        if (pointsChange != null) {
          storeObject.points = storeObject.points + (pointsChange - 0);
        }
      } else {
        source.points = pointsChange;
      }
    }
    if (storeObject == null) {
      storeObject = source;
      storeObject.timeAdded = new Date();
    }

    storeObject.consumerId = this.id;
    storeObject.providerId = providerId;
    await db.put(STORE_SOURCES, storeObject);

    source.id = providerId;
    source.generatedBy = 'auto';
    delete source.providerId;
    delete source.consumerId;
    await storeProfile(source, { overwriteProps: false, updateScrapeSettings: false }, bgState);

    // console.log('Source ' + consumerId + ' <-- ' + providerId + ' stored successfully.');
  }
  async storeLink(idb, link, bgState) {
    let db = await getDBPromise(bgState);

    // If necessary, reverse previous action.
    let storeObject = await db.get(STORE_LINKS, [this.id, link.url]);

    if (storeObject != null && storeObject.saved !== link.saved) {
      let sources = link.sources;
      for (let i in sources) {
        let source = sources[i];
        let consumerId = source.profileId;
        if (consumerId == null) consumerId = source.consumerId;
        this.storeSource(
          {
            source,
            providerId: source.id,
            overwrite: false,
            pointsChange: source.points,
          },
          bgState
        );
        // await saveOrSkipSource({
        //   targetId: sources[i].profileId,
        //   source: sources[i],
        //   action: storeObject.saved ? 'save' : 'skip',
        // });
      }
    }

    // Process sources.
    let sources = link.sources;
    for (let i in sources) {
      let source = sources[i];
      if (typeof source === 'string') {
        source = {
          id: source,
          generatedBy: 'auto',
        };
      }
      if (source.points == null) {
        if (link.saved === LINK_STATUS.SAVED) {
          source.points = source.pointsSave;
        } else {
          source.points = source.pointsSkip;
        }
      }
      await idb.saveOrSkipSource(
        LINK_STATUS.SKIPPED, // TODO: check if source exists. update, instead of overwrite.
        this.id,
        source,
        bgState
      );
    }

    await addLink(link, bgState);
  }
  async getSuggestion(idb, bgState) {
    let sources = await getProfileSources(this.id, bgState);
    if (sources == null) {
      console.log('no sources found');
      return;
    }

    while (true) {
      let [source, index] = drawRandomElFromObject(sources, scoreFnJustPoints);
      if (source == null) {
        console.log('error loading suggestion: no source found');
        return;
      }

      source.points--;
      let db = await getDBPromise(bgState);
      await db.put(STORE_SOURCES, source);

      let provider = await idb.getProfile(source.providerId, bgState);
      await scrapeIfNecessary(bgState, provider);

      let linksCursor = null;
      try {
        // linksCursor = await getLinksByTimeAdded(source.providerId);
        let query = {
          storeName: STORE_LINKS,
          lowerBounds: [source.providerId],
          upperBounds: [source.providerId],
        };
        linksCursor = await idb.getCursor(query, bgState);
        if (linksCursor == null) {
          continue;
        }
        let nextUrl = null;
        while (nextUrl === null) {
          // Check if current link already exists on profile.
          let storeLink = await getLink(
            {
              profileId: this.name,
              linkId: linksCursor.value.url,
              createIfNecessary: false,
            },
            bgState
          );
          let alreadyExists = storeLink != null;
          if (!alreadyExists) {
            nextUrl = linksCursor.value;
          } else {
            await linksCursor.continue();
          }
        }

        if (nextUrl !== null) {
          return nextUrl;
        }
      } catch (err) {
        sources.splice(index, 1);
        continue;
      }
    }
  }
}
