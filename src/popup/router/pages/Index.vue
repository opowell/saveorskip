<template>
    <div id='menu'>
      <div style='display: flex;'>
        <span class='menu-tile' @click="saveAndGo">
          <div class='large-tile'>
            <i class="far fa-star" style='color: green'></i>
            <i class="fas fa-arrow-right" style='color: #444;'></i>
          </div>
          <div>
            save and go
            </div>
        </span>
        <span class='menu-tile' @click="skipAndGo">
          <div class='large-tile'>
            <i class="far fa-star" style='color: red'></i>
            <i class="fas fa-arrow-right" style='color: #444;'></i>
          </div>
          <div>
            skip and go
            </div>
        </span>
        <span class='menu-tile' @click="go">
          <div class='large-tile'>
            <i class="fas fa-arrow-right" style='color: #444;'></i>
          </div>
          <div>
            go
            </div>
        </span>
        </div>
        <div class='menu-divider'></div>
<div style='display: flex;'>
  Link: 
  <span class='button-group'>
    <i class="far fa-star" @click='save' :class='{bgselected: linkSaved}' style='color: green'></i>
    <i class="far fa-star" @click='skip' :class='{bgselected: linkSkipped}' style='color: red'></i>
    <i class="fas fa-trash" @click='removeLink' :class='{bgselected: linkNeither}' style='color: grey'></i>
  </span>
</div>
<div style='display: flex;'>
  Source: 
  <span class='button-group'>
    <i class="far fa-star" @click='saveAsSource(true)' :class='{bgselected: sourceSaved}' style='color: green'></i>
    <i class="far fa-star" @click='saveAsSource(false)' :class='{bgselected: sourceSkipped}' style='color: red'></i>
    <i class="fas fa-trash" @click='deleteSource' :class='{bgselected: sourceNeither}' style='color: grey'></i>
  </span>
</div>
        <div class='menu-item' :title='nextLink'>Next Link: {{nextLink}}</div>
        <div class='menu-divider'></div>
        <div class='menu-item'>Target:
            <select id='target-select' @change='setTarget'>
                <option v-for='profile in profiles' 
                    :key='profile.id' 
                    :value='profile.id'
                    :selected='profile.id == targetId'
                >
                    {{profile.name}}
                </option>
                <option value='__new'>(new)</option>
            </select>
            </div>
        <div class='menu-divider'></div>
        <div class='menu-item' @click='showOptions'>Manage...</div>
    </div>
</template>

<script>
export default {
  data() {
    return {
      selectTargetId: this.$store.state.targetId,
      // linkStatus: 'neither',
    };
  },
  created() {
    this.$store.dispatch('fetchProfiles');
    this.$store.dispatch('setCurUrlLinkStatus');
  },
  computed: {
    linkStatus() {
      // return this.$store.getters.getUrlLinkStatus(this.$store.state.curLink.url);
      return this.$store.state.curUrlAsLink;
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
      return this.$store.getters.curSourceStatus;
    },
    sourceSaved() {
      return this.sourceStatus === 'saved';
    },
    sourceSkipped() {
      return this.sourceStatus === 'not saved';
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
    target() {
      return this.$store.getters.curTarget;
    },
    nextLink() {
      return this.$store.state.nextSuggestion;
    },
  },
  methods: {
    deleteSource() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'removeSource',
        storePayload: {
          targetId: this.targetId,
          url: this.$store.state.curLink.url,
        },
      });
    },
    setTarget(event) {
      this.$store.dispatch('setTarget', event.target.value);
    },
    save() {
      chrome.runtime.sendMessage('save');
    },
    skip() {
      chrome.runtime.sendMessage('skip');
    },
    saveAndGo() {
      chrome.runtime.sendMessage('saveAndGo');
    },
    go() {
      chrome.runtime.sendMessage('go');
    },
    skipAndGo() {
      chrome.runtime.sendMessage('skipAndGo');
    },
    saveAsSource(save) {
      this.$store.dispatch('addSources', {
        targetId: this.targetId,
        sources: [
          {
            url: this.$store.state.curLink.url,
            saved: save,
          },
        ],
      });
      // chrome.runtime.sendMessage({
      //   action: 'storeDispatch',
      //   storeAction: 'addSources',
      //   storePayload: {
      //     targetId: this.targetId,
      //     sources: [
      //       {
      //         url: this.$store.state.curLink.url,
      //         saved: save,
      //       },
      //     ],
      //   },
      // });
    },
    showOptions() {
      chrome.runtime.openOptionsPage();
    },
    removeLink() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'removeLink',
        storePayload: {
          targetId: this.targetId,
          url: this.$store.state.curLink.url,
        },
      });
      chrome.runtime.sendMessage('removeLink');
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
  align-items: center;
}

.inline-item {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.large-tile {
  font-size: 2em;
}

.menu-item:hover {
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
  width: 300px;
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
