<template>
  <div id="menu">
    <div style="display: flex; padding-bottom: 2px;">
      <span class="menu-tile" @click="saveAndGo" title="Set current link as saved, and go to the next suggestion.">
        <div class="large-tile">
          <i class="far fa-star" style="color: green"></i>
          <i class="fas fa-arrow-right" style="color: #444;"></i>
        </div>
        <div>
          save and go
        </div>
      </span>
      <span class="menu-tile" @click="skipAndGo" title="Set current link as not saved, and go to the next suggestion.">
        <div class="large-tile">
          <i class="far fa-star" style="color: red"></i>
          <i class="fas fa-arrow-right" style="color: #444;"></i>
        </div>
        <div>
          skip and go
        </div>
      </span>
      <span class="menu-tile" @click="go" title="Go to the next suggestion.">
        <div class="large-tile">
          <i class="fas fa-arrow-right" style="color: #444;"></i>
        </div>
        <div>
          go
        </div>
      </span>
    </div>
    <div class="menu-item" title="The current profile to save links and sources to.">
      <span style="flex: 1 1 auto;">Profile:&nbsp;</span>
      <select v-if="profiles.length > 0" id="target-select" @change="setTargetEv">
        <option v-for="profile in profiles" :key="profile.id" :value="profile.id" :selected="profile.id == targetId">
          {{ profile.name }}
        </option>
      </select>
      <div v-else>----</div>
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
    <div class="menu-item">Current page</div>
    <template v-for="(value, name) in curLink">
      <div :key="value" v-if="name !== 'links' && name !== 'sources'" class="menu-item" :title="value">
        <span style="flex: 1 1 auto; margin-right: 10px;">{{ name }}: </span>
        <span>{{ value }}</span>
      </div>
    </template>
    <div class="menu-divider" />
    <div class="menu-item">Links</div>
    <div class="menu-item" style="word-break: break-all; white-space: initial;" v-for="(link, index) in links" :title="link" :key="link.url">{{ index + 1 }}. {{ link }}</div>
    <div class="menu-divider" />
    <div class="menu-item">Sources</div>
    <div class="menu-item" style="word-break: break-all; white-space: initial;" v-for="(source, index) in sources" :title="source" :key="source.url">
      {{ index + 1 }}. {{ source }}
    </div>
    <div class="menu-divider" />
    <div class="menu-item" :title="nextLink">Next Link: {{ nextLink }}</div>
    <div class="menu-item menu-button" @click="showOptions">Manage...</div>
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';
import * as types from '../../../store/mutation-types.js';

export default {
  async mounted() {
    await idb.fetchProfiles();
    if (!this.hasTarget && this.profiles != null && this.profiles.length > 0) {
      this.setTarget(this.profiles[0].id);
    }
    idb.setCurUrlLinkStatus();
    idb.setCurUrlSourceStatus();
  },
  computed: {
    hasTarget() {
      return this.targetId != null && this.targetId != '';
    },
    linkStatus() {
      return this.$store.state.curUrlAsLink;
    },
    links() {
      return this.curLink == null ? [] : this.curLink.links;
    },
    sources() {
      return this.curLink == null ? [] : this.curLink.sources;
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
    curLink() {
      return this.$store.state.curLink;
    },
    target() {
      return this.$store.getters.curTarget;
    },
    nextLink() {
      return this.$store.state.nextSuggestion;
    },
  },
  methods: {
    deleteSource() {
      this.$store.dispatch('removeSource', {
        targetId: this.targetId,
        url: this.$store.state.curLink.url,
      });
    },
    setTargetEv(event) {
      this.setTarget(event.target.value);
    },
    setTarget(profileId) {
      // this.$store.commit(types.SET_TARGET, profileId - 0);
      // idb.setCurUrlLinkStatus();
      // idb.setCurUrlSourceStatus();
      idb.setTarget(profileId - 0);
    },
    save() {
      idb.saveOrSkipLink({
        link: this.$store.state.curLink,
        action: 'save',
        targetId: this.targetId,
      });
    },
    skip() {
      idb.saveOrSkipLink({
        link: this.$store.state.curLink,
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
    saveAsSource(save) {
      idb.addSources({
        sources: [
          {
            profileId: this.targetId,
            url: this.$store.state.curLink.url,
            saved: save,
          },
        ],
      });
    },
    showOptions() {
      chrome.runtime.openOptionsPage();
    },
    removeLink() {
      idb.removeLink({
        targetId: this.targetId - 0,
        url: this.$store.state.curLink.url,
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
  flex-direction: column;
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
