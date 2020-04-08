<template>
  <div id="menu">
    <div style="display: flex; padding-bottom: 2px; justify-content: center; font-size: 200%;">
      <span class="menu-tile" @click="go" title="Go to the next suggestion."> go forward&nbsp;<i class="fas fa-arrow-right" style="color: #444;"></i> </span>
    </div>
    <div class="menu-item" :title="curPageUrl">
      <span style="flex: 1 1 auto; margin-right: 10px;">Current page: </span>
      <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">{{ curPageUrl }}</span>
    </div>
    <div class="menu-item" :title="curPageUrl">
      <span style="flex: 1 1 auto; margin-right: 10px;">Status: </span>
      <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">{{ status }}</span>
    </div>
    <div class="menu-divider" />
    <div class="menu-item" title="The status of the current link on the current profile as a link.">
      <span style="flex: 1 1 auto;">Link:&nbsp;</span>
      <span class="button-group">
        <i title="Current link is a saved link." class="far fa-star" @click="save" :class="{ bgselected: linkSaved }" style="color: green"></i>
        <i title="Current link is a not saved link." class="far fa-star" @click="skip" :class="{ bgselected: linkSkipped }" style="color: red"></i>
        <i title="Current link is a not a link on the current profile." class="fas fa-trash" @click="removeLink" :class="{ bgselected: linkNeither }" style="color: grey"></i>
      </span>
    </div>
    <div class="menu-item" title="The status of the current link on the current profile as a source.">
      <span style="flex: 1 1 auto;">Source:&nbsp;</span>
      <span class="button-group">
        <i title="Current link is a saved source." class="far fa-star" @click="saveAsSource(true)" :class="{ bgselected: sourceSaved }" style="color: green"></i>
        <i title="Current link is a not saved link." class="far fa-star" @click="saveAsSource(false)" :class="{ bgselected: sourceSkipped }" style="color: red"></i>
        <i title="Current link is a not a source on the current profile." class="fas fa-trash" @click="deleteSource" :class="{ bgselected: sourceNeither }" style="color: grey"></i>
      </span>
    </div>
    <div class="menu-divider" />
    <div class="menu-item" title="The current profile to save links and sources to.">
      <span style="flex: 1 1 auto;">Profile:&nbsp;</span>
      <select v-if="profiles.length > 0" id="target-select" @change="setTargetEv">
        <option v-for="profile in profiles" :key="profile.id" :value="profile.id" :selected="profile.id == targetId">
          {{ profile.name }}
        </option>
      </select>
      <div v-else>----</div>
    </div>
    <div class="menu-divider" />
    <div class="menu-item menu-button" @click="showOptions">Manage...</div>
  </div>
</template>

<script>
import * as idb from '../../../store/idb';
import { Source } from '../../../models/Source';
import { convertId } from '../../../Utils';

export default {
  async mounted() {
    let loadedProfiles = await idb.fetchProfiles([{ field: 'generatedBy', lowerValue: 'user', upperValue: 'user' }]);
    this.profiles.push(...loadedProfiles);
    if (!this.hasValidTarget && this.profiles.length > 0) {
      await this.setTarget(this.profiles[0].id);
    } else {
      await this.setTarget(this.targetId);
    }
    this.linkStatus = await idb.getCurUrlLinkStatus();
    this.sourceStatus = await idb.getCurUrlSourceStatus();

    const thisComponent = this;

    chrome.runtime.sendMessage('getCurPage', async function(response) {
      // thisComponent.curPage = response;
      thisComponent.linkStatus = await idb.getCurUrlLinkStatus();
    });

    // this.curPage = this.$store.state.curPage;
  },
  data() {
    return {
      profiles: [],
      linkStatus: '',
      sourceStatus: '',
    };
  },
  computed: {
    curPage() {
      return this.$store.state.curPage;
    },
    status() {
      return this.$store.state.status;
    },
    hasTarget() {
      return this.targetId != null && this.targetId !== '';
    },
    hasValidTarget() {
      for (let i in this.profiles) {
        if (this.profiles[i].id === this.targetId) {
          return true;
        }
      }
      return false;
    },
    linkSaved() {
      return this.linkStatus === 1;
    },
    linkSkipped() {
      return this.linkStatus === 0;
    },
    linkNeither() {
      return !this.linkSaved && !this.linkSkipped;
    },
    sourceSaved() {
      return this.sourceStatus === 1;
    },
    sourceSkipped() {
      return this.sourceStatus === 0;
    },
    sourceNeither() {
      return !this.sourceSaved && !this.sourceSkipped;
    },
    targetId() {
      return this.$store.state.targetId;
    },
    target() {
      return this.$store.getters.curTarget;
    },
    nextLink() {
      return this.$store.state.nextSuggestion;
    },
    numLinks() {
      return this.links == null ? '-' : this.links.length;
    },
    numSources() {
      return this.sources == null ? '-' : this.sources.length;
    },
    curPageUrl() {
      if (this.curPage == null) {
        return '---';
      }
      if (this.curPage.url == null) {
        return this.curPage.id;
      }
      return this.curPage.url;
    },
  },
  methods: {
    deleteSource() {
      this.$store.dispatch('removeSource', {
        targetId: this.targetId,
        url: this.curPage.url,
      });
    },
    setTargetEv(event) {
      this.setTarget(event.target.value);
    },
    async setTarget(profileId) {
      await idb.setTarget(convertId(profileId));
    },
    async save() {
      await idb.saveOrSkipLink({
        link: this.curPage,
        action: 'save',
        targetId: this.targetId,
      });
      this.linkStatus = 1;
    },
    async skip() {
      idb.saveOrSkipLink({
        link: this.curPage,
        action: 'not save',
        targetId: this.targetId,
      });
      this.linkStatus = 0;
    },
    saveAndGo() {
      this.save();
      this.go();
    },
    go() {
      chrome.runtime.sendMessage({ action: 'go', profileId: this.targetId });
    },
    skipAndGo() {
      this.skip();
      this.go();
    },
    async saveAsSource(save) {
      let source = Source(this.curPage.url, this.targetId);
      source.generatedBy = 'user';
      await idb.saveOrSkipSource({
        source,
        targetId: this.targetId,
        action: save ? 'save' : 'skip',
      });
    },
    showOptions() {
      chrome.runtime.openOptionsPage();
    },
    async removeLink() {
      await idb.removeLink({
        targetId: this.targetId,
        url: this.curPage.url,
      });
      this.linkStatus = 'neither';
    },
  },
};
</script>

<style lang="scss" scoped>
p {
  font-size: 20px;
}

.menu-item {
  padding: 5px 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: flex;
  align-items: baseline;
}

.inline-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.large-tile {
  font-size: 2em;
}

.menu-button:hover {
  background-color: #ccc;
  cursor: pointer;
}

.menu-divider {
  border-bottom: 1px solid #888;
  margin: 2px 5px;
}

#menu {
  display: flex;
  flex-direction: column;
  white-space: nowrap;
  max-width: 300px;
}

.menu-tile {
  border: 1px solid #888;
  margin: 1px;
  padding: 5px;
  display: flex;
  background-color: #efefef;
  align-items: center;
  border-radius: 4px;
}

.menu-tile:hover {
  background-color: rgb(245, 245, 245);
  border-color: #000;
  cursor: pointer;
}

.muted {
  color: #888;
}

.muted:hover {
  color: #000;
}

body {
  padding: 0px;
  margin: 0px;
}

.button-group {
  display: flex;
}

.button-group > * {
  padding: 5px;
  background-color: #bbb;
  cursor: pointer;
}

.bgselected {
  background-color: #efefef;
}

.button-group > *:hover {
  background-color: #fff;
}

.button-group > *:not(:first-child) {
  border-right: solid 1px #888;
  border-top: solid 1px #888;
  border-bottom: solid 1px #888;
}

.button-group > *:first-child {
  border-top-left-radius: 4px;
  border-bottom-left-radius: 4px;
  border-left: solid 1px #888;
  border-right: solid 1px #888;
  border-top: solid 1px #888;
  border-bottom: solid 1px #888;
}

.button-group > *:last-child {
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
}
</style>
