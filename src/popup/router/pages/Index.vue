<template>
  <div id="menu">
    <div style="display: flex; padding-bottom: 2px; justify-content: center; font-size: 200%;">
      <span class="menu-tile" @click="go" title="Go to the next suggestion."> go forward&nbsp;<i class="fas fa-arrow-right" style="color: #444;"></i> </span>
    </div>
    <div class="menu-item" :title="pageUrl">
      <span style="flex: 1 1 auto; margin-right: 10px;">Page: </span>
      <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">{{ pageUrl }}</span>
    </div>
    <div class="menu-item" :title="pageUrl">
      <span style="flex: 1 1 auto; margin-right: 10px;">Page Obj: </span>
      <span style="text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">{{ page == null ? 'null' : page.url }}</span>
    </div>
    <div class="menu-divider" />
    <div class="menu-item" title="The status of the page on the profile as a link.">
      <span style="flex: 1 1 auto;">Link:&nbsp;</span>
      <span class="button-group">
        <i title="Page is a saved link." class="far fa-star" @click="storeLinkStatus(LINK_STATUS.SAVED)" :class="{ bgselected: linkSaved }" style="color: green"></i>
        <i title="Page is not a saved link." class="far fa-star" @click="storeLinkStatus(LINK_STATUS.SKIPPED)" :class="{ bgselected: linkSkipped }" style="color: red"></i>
        <i title="Page is a not a link on the current profile." class="fas fa-trash" @click="removeLink" :class="{ bgselected: linkNeither }" style="color: grey"></i>
      </span>
    </div>
    <div class="menu-item" title="The status of the page on the profile as a source.">
      <span style="flex: 1 1 auto;">Source:&nbsp;</span>
      <span class="button-group">
        <i title="Page is a saved source." class="far fa-star" @click="saveAsSource(LINK_STATUS.SAVED)" :class="{ bgselected: sourceSaved }" style="color: green"></i>
        <i title="Page is not a saved source." class="far fa-star" @click="saveAsSource(LINK_STATUS.SKIPPED)" :class="{ bgselected: sourceSkipped }" style="color: red"></i>
        <i title="Page is a not a source on the profile." class="fas fa-trash" @click="deleteSource" :class="{ bgselected: sourceNeither }" style="color: grey"></i>
      </span>
    </div>
    <div class="menu-divider" />
    <div class="menu-item" title="The current profile to save links and sources to.">
      <span style="flex: 1 1 auto;">Profile:&nbsp;</span>
      <select v-if="profiles.length > 0" id="target-select" @change="setTargetEv">
        <option v-for="profile in profiles" :key="profile.id" :value="profile.id" :selected="profile.id == profileId">
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
import { LINK_STATUS } from '../../../store/Constants.ts';

export default {
  data() {
    return {
      profiles: [],
      status: 'ready',
      profile: null,
      page: null,
      linkStatus: null,
      sourceStatus: null,
      pageUrl: null,
      profileId: null,
      LINK_STATUS,
    };
  },
  async mounted() {
    let loadedProfiles = await idb.fetchProfiles([{ field: 'generatedBy', lowerValue: 'user', upperValue: 'user' }], 100);
    this.profiles.push(...loadedProfiles);
    if (!this.hasValidTarget && this.profiles.length > 0) {
      this.profileId = this.profiles[0].id;
    }
    console.log('this profile = ' + this.profileId);

    const thisComponent = this;

    chrome.runtime.sendMessage('getPopupData', function(response) {
      thisComponent.pageUrl = response.pageUrl;
      thisComponent.profileId = response.profileId;
      thisComponent.page = response.page;
    });

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
      switch (request.action) {
        case 'setPageUrl':
          this.pageUrl = request.pageUrl;
          break;
        case 'setProfileId':
          this.profileId = request.profileId;
          break;
        case 'setPage':
          this.page = request.page;
          break;
      }
    });
  },
  watch: {
    pageUrl() {
      this.updateStatuses();
    },
    profileId() {
      this.updateStatuses();
    },
  },
  computed: {
    hasTarget() {
      return this.profileId != null && this.profileId !== '';
    },
    hasValidTarget() {
      for (let i in this.profiles) {
        if (this.profiles[i].id === this.profileId) {
          return true;
        }
      }
      return false;
    },
    linkSaved() {
      return this.linkStatus === LINK_STATUS.SAVED;
    },
    linkSkipped() {
      return this.linkStatus === LINK_STATUS.SKIPPED;
    },
    linkNeither() {
      return !this.linkSaved && !this.linkSkipped;
    },
    sourceSaved() {
      return this.sourceStatus === LINK_STATUS.SAVED;
    },
    sourceSkipped() {
      return this.sourceStatus === LINK_STATUS.SKIPPED;
    },
    sourceNeither() {
      return !this.sourceSaved && !this.sourceSkipped;
    },
  },
  methods: {
    async updateStatuses() {
      if (this.profileId == null) {
        return;
      }
      if (this.pageUrl == null) {
        return;
      }
      console.log('updating popup', this.profileId, this.pageUrl);
      this.linkStatus = await idb.getLinkStatus(this.profileId, this.pageUrl);
      this.sourceStatus = await idb.getSourceStatus(this.profileId, this.pageUrl);
    },
    deleteSource() {
      idb.removeSource({ targetId: this.profileId, url: this.pageUrl });
    },
    setTargetEv(event) {
      this.profileId = event.target.value;
    },
    async storeLinkStatus(status) {
      await idb.setLinkStatus(this.pageUrl, status, this.profileId, this.page);
      this.linkStatus = status;
    },
    go() {
      chrome.runtime.sendMessage({ action: 'go', profileId: this.profileId });
    },
    async saveAsSource(action) {
      let source = Source(this.pageUrl, this.profileId);
      source.generatedBy = 'user';
      await idb.saveOrSkipSource(action, this.profileId, source);
      this.sourceStatus = action;
    },
    showOptions() {
      chrome.runtime.openOptionsPage();
    },
    async removeLink() {
      await idb.removeLink({
        targetId: this.profileId,
        url: this.pageUrl,
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
