<template>
    <div id='menu'>
        <div class='menu-item' @click="saveAndGo">Save and go</div>
        <div class='menu-item' @click="skipAndGo">Skip and go</div>
        <div class='menu-divider'></div>
        <div class='menu-item'>
          <span class='inline-item' @click='toggleSaved' :title='curUrl'>
            <i v-show='linkSaved || linkSkipped' class="fa-star muted" v-bind:class='{fas: linkSaved, far: linkSkipped}'></i>
            <i v-show='!linkSaved && !linkSkipped' class="fas fa-star-half-alt muted"></i>
            {{curUrl}}
          </span>
          <i @click='deleteLink' class="fas fa-times"></i>
        </div>
        <div class='menu-item' :title='nextLink'>Next Link: {{nextLink}}</div>
        <div class='menu-item' @click="go">Go</div>
        <div class='menu-divider'></div>
        <div class='menu-item'>Source status: {{sourceStatus}}</div>
        <div class='menu-item' @click="saveAsSource(true)">Save</div>
        <div class='menu-item' @click="saveAsSource(false)">Unsave</div>
        <div class='menu-item' @click="deleteSource">Delete</div>
        <div class='menu-divider'></div>
        <div class='menu-item'>Target:
            <select id='target-select' v-model='selectTargetId' @change='setTarget'>
                <option v-for='profile in profiles' 
                    :key='profile.name' 
                    :value='profile.name'
                    :selected='profile.name == targetId'
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
    };
  },
  computed: {
    linkSaved() {
      return this.linkStatus === 'saved';
    },
    linkSkipped() {
      return this.linkStatus === 'not saved';
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
    linkStatus() {
      return this.$store.getters.curLinkStatus;
    },
    sourceStatus() {
      return this.$store.getters.curSourceStatus;
    },
    curUrl() {
      return this.$store.state.curUrl;
    },
    nextLink() {
      return this.$store.state.nextSuggestion;
    },
  },
  watch: {
    nextSuggestion: function(val) {
      console.log('new val=' + val);
      vm.$forceUpdate();
    },
  },
  methods: {
    deleteSource() {
      this.$store.dispatch('removeSource', {
        targetId: this.targetId,
        url: this.$store.state.curUrl,
      });
    },
    toggleSaved() {
      if (!this.linkSaved) {
        this.save();
      } else {
        this.skip();
      }
    },
    setTarget() {
      this.$store.dispatch('setTarget', this.selectTargetId);
    },
    save() {
      // cannot send messages to background via chrome.runtime.sendMessage.
      this.$store.dispatch('saveOrSkipLink', {
        link: this.curUrl,
        action: 'save',
        targetId: this.targetId,
      });
      chrome.runtime.sendMessage('save');
    },
    skip() {
      this.$store.dispatch('saveOrSkipLink', {
        link: this.curUrl,
        action: 'skip',
        targetId: this.targetId,
      });
      chrome.runtime.sendMessage('skip');
    },
    saveAndGo() {
      this.$store.dispatch('saveOrSkipLink', {
        link: this.curUrl,
        action: 'save',
        targetId: this.targetId,
      });
      chrome.runtime.sendMessage('saveAndGo');
    },
    go() {
      chrome.runtime.sendMessage('go');
    },
    skipAndGo() {
      this.$store.dispatch('saveOrSkipLink', {
        link: this.curUrl,
        action: 'skip',
        targetId: this.targetId,
      });
      chrome.runtime.sendMessage('skipAndGo');
    },
    saveAsSource(save) {
      this.$store.dispatch('addSources', {
        targetId: this.targetId,
        sources: [
          {
            url: this.$store.state.curUrl,
            saved: save,
          },
        ],
      });
    },
    showOptions() {
      chrome.runtime.openOptionsPage();
    },
    deleteLink() {},
  },
};

import store from '../../../store';

const sos = {};

sos.log = function(message) {
  console.log('popup.js received message: ' + JSON.stringify(message));
  let div = document.createElement('div');
  div.appendChild(document.createTextNode(JSON.stringify(message)));
  document.getElementById('messages').appendChild(div);
};

sos.sendMessage = function(text) {
  chrome.runtime.sendMessage(text);
};

sos.showNextPage = function() {
  chrome.runtime.sendMessage('showNextPage');
};

// Listen to messages from the scraper.js script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('sos received message: ' + request.action + '\n' + JSON.stringify(request));
  switch (request.action) {
    case 'store':
      store.dispatch(request.mutationType, request.mutationData);
      break;
  }
});
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
</style>
