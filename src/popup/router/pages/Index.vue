<template>
  <div id="menu">
    <div style="display: flex; padding-bottom: 2px; justify-content: center; font-size: 200%;">
      <span class="menu-tile" @click="go" title="Go to the next suggestion."> go forward&nbsp;<i class="fas fa-arrow-right" style="color: #444;"></i> </span>
    </div>
    <div class="menu-item" :title="curPage.url">
      <span style="flex: 1 1 auto; margin-right: 10px;">Current page: </span>
      <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">{{ curPageUrl }}</span>
    </div>
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
        <option v-for="profile in personalProfiles" :key="profile.id" :value="profile.id" :selected="profile.id == targetId">
          {{ profile.name }}
        </option>
      </select>
      <div v-else>----</div>
    </div>
    <div class="menu-item" title="Default link action to take on newly opened pages.">
      <span style="flex: 1 1 auto;">Default link action:&nbsp;</span>
      <select v-if="profiles.length > 0" @change="setDefaultLinkActionEv">
        <option v-for="action in ['save', 'skip', 'nothing']" :key="action" :value="action" :selected="action == defaultLinkAction">
          {{ action }}
        </option>
      </select>
      <div v-else>----</div>
    </div>
    <div class="menu-item" title="Default source action to take on newly opened pages.">
      <span style="flex: 1 1 auto;">Default source action:&nbsp;</span>
      <select v-if="profiles.length > 0" @change="setDefaultSourceActionEv">
        <option v-for="action in ['save', 'skip', 'nothing']" :key="action" :value="action" :selected="action == defaultSourceAction">
          {{ action }}
        </option>
      </select>
      <div v-else>----</div>
    </div>
    <!-- <div class="menu-divider" /> -->

    <!-- <div class="menu-item">Current page</div>
    <template v-for="(value, name) in curLink">
      <div :key="name" v-if="name !== 'links' && name !== 'sources' && name !== 'profileId'" class="menu-item" :title="value">
        <span style="flex: 1 1 auto; margin-right: 10px;">{{ name }}: </span>
        <span>{{ value }}</span>
      </div>
    </template>
    <div class="menu-item">
      <span style="flex: 1 1 auto;">Links:</span>
      <span>{{ numLinks }}</span>
    </div> -->

    <!-- <div class="menu-item" style="word-break: break-all; white-space: initial;" v-for="(link, index) in links" :title="link" :key="link.url">{{ index + 1 }}. {{ link }}</div>
    <div class="menu-divider" /> -->
    <!-- <div class="menu-item">
      <span style="flex: 1 1 auto;">Sources:</span>
      <span>{{ numSources }}</span>
    </div> -->
    <!-- <div class="menu-item" style="word-break: break-all; white-space: initial;" v-for="(source, index) in sources" :title="source" :key="source.url">
      {{ index + 1 }}. {{ source }}
    </div> -->
    <div class="menu-divider" />
    <!-- <div class="menu-item" :title="nextLink">Next Link: {{ nextLink }}</div> -->
    <div class="menu-item menu-button" @click="showOptions">Manage...</div>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';
import { Source } from '../../../models/Source.js';
import { convertId } from '../../../Utils.js';

export default {
  async mounted() {
    await idb.fetchProfiles();
    if (!this.hasValidTarget && this.profiles != null && this.profiles.length > 0) {
      this.setTarget(this.personalProfiles[0].id);
    } else {
      this.setTarget(this.targetId);
    }
    await idb.setCurUrlLinkStatus();
    await idb.setCurUrlSourceStatus();
  },
  computed: {
    defaultLinkAction() {
      if (this.$store.state.targetId == null) {
        return 'nothing';
      }
      if (this.$store.state.popup.profile == null) {
        return 'nothing';
      }
      switch (this.$store.state.popup.profile.defaultLinkAction) {
        case 'save':
          return 'save';
        case 'skip':
          return 'skip';
      }
      return 'nothing';
    },
    defaultSourceAction() {
      if (this.$store.state.targetId == null) {
        return 'nothing';
      }
      if (this.$store.state.popup.profile == null) {
        return 'nothing';
      }
      switch (this.$store.state.popup.profile.defaultSourceAction) {
        case 'save':
          return 'save';
        case 'skip':
          return 'skip';
      }
      return 'nothing';
    },
    personalProfiles() {
      let out = [];
      for (let i in this.profiles) {
        if (this.profiles[i].autoGenerated !== true) {
          out.push(this.profiles[i]);
        }
      }
      return out;
    },
    hasTarget() {
      return this.targetId != null && this.targetId != '';
    },
    hasValidTarget() {
      for (let i in this.profiles) {
        if (this.profiles[i].id === this.targetId) {
          return true;
        }
      }
      return false;
    },
    linkStatus() {
      return this.$store.state.curUrlAsLink;
    },
    links() {
      return this.curPage == null ? [] : this.curPage.links;
    },
    sources() {
      return this.curPage == null ? [] : this.curPage.sources;
    },
    linkSaved() {
      return this.linkStatus === true;
    },
    linkSkipped() {
      return this.linkStatus === false;
    },
    linkNeither() {
      return this.linkStatus === 'neither';
    },
    sourceStatus() {
      return this.$store.state.curUrlAsSource;
    },
    sourceSaved() {
      return this.sourceStatus === true;
    },
    sourceSkipped() {
      return this.sourceStatus === false;
    },
    sourceNeither() {
      return this.sourceStatus === 'neither';
    },
    profiles() {
      return this.$store.state.profiles;
    },
    targetId() {
      return this.$store.state.targetId;
    },
    curPage() {
      return this.$store.state.curPage;
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
    setDefaultLinkActionEv(event) {
      idb.setDefaultLinkAction(this.targetId, event.target.value);
    },
    setDefaultSourceActionEv(event) {
      idb.setDefaultSourceAction(this.targetId, event.target.value);
    },
    deleteSource() {
      this.$store.dispatch('removeSource', {
        targetId: this.targetId,
        url: this.$store.state.curPage.url,
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
        link: this.$store.state.curPage,
        action: 'save',
        targetId: this.targetId,
      });
    },
    async skip() {
      idb.saveOrSkipLink({
        link: this.$store.state.curPage,
        action: 'not save',
        targetId: this.targetId,
      });
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
      let source = Source(this.$store.state.curPage.url, this.targetId);
      source.autoGenerated = true;
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
        url: this.$store.state.curPage.url,
      });
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
