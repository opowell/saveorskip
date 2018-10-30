<template>
    <div id='menu'>
        <div class='menu-item' id="saveAndGo">Save and go</div>
        <div class='menu-item' id="skipAndGo">Skip and go</div>
        <div class='menu-divider'></div>
        <div class='menu-item'>Cur Url: {{curUrl}}</div>
        <div class='menu-item'>Status: {{linkStatus}}</div>
        <div class='menu-item' id="save">Save</div>
        <div class='menu-item' id="skip">Skip</div>
        <div class='menu-item' id="go">Go</div>
        <div class='menu-divider'></div>
        <div class='menu-item' id="saveAsSource">Save as source</div>
        <div class='menu-item' id="removeAsSavedSource">Remove as saved source</div>
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
            </select>
            </div>
        <div class='menu-item' id="item-types">Viewing: suggested items</div>
        <div class='menu-item' id="source">From: cute_babies</div>
        <div class='menu-divider'></div>
        <div class='source-prob-formula'>
            Source prob. formula:
            <select>
                <option value='100000 / (now - lastSaved)'>last saved (rand.)</option>
                <option value='points'>points (rand.)</option>
                <option value='points / ((now - lastSaved)/(1000*60*60)+2)^1.8)'>hot (HN)</option>
                <option value=''>custom</option>
              </select>
        </div>
        <div class='menu-divider'></div>
        <div class='menu-item' id='options'>Options</div>
        <div class='menu-item' id="account">User: opowell</div>
        <div class='menu-divider'></div>
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
    profiles() {
      return this.$store.getters.profileObjs;
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
    curUrl() {
        return this.$store.state.curUrl;
    }
  },
  methods: {
      setTarget() {
        this.$store.dispatch('setTarget', this.selectTargetId);
      }
  }
};

const sos = {};

sos.log = function(message) {
    console.log('popup.js received message: ' + JSON.stringify(message));
    let div = document.createElement('div');
    div.appendChild(document.createTextNode(JSON.stringify(message)));
    document.getElementById('messages').appendChild(div);
}

sos.sendMessage = function(text) {
    chrome.runtime.sendMessage(text);
}

sos.save = function() {
    chrome.runtime.sendMessage('save');
}

sos.saveAndGo = function() {
    chrome.runtime.sendMessage('saveAndGo');
}

sos.skip = function() {
    chrome.runtime.sendMessage('skip');
}

sos.go = function() {
    chrome.runtime.sendMessage('go');
}

sos.skipAndGo = function() {
    chrome.runtime.sendMessage('skipAndGo');
}

sos.saveAsSource = function() {
    chrome.runtime.sendMessage('saveAsSource');
}

sos.showNextPage = function() {
    chrome.runtime.sendMessage('showNextPage');
}

sos.showOptions = function() {
    chrome.runtime.openOptionsPage();
}

// Listen to messages from the scraper.js script
chrome.runtime.onMessage.addListener(function (message) {
//    sos.log('Pop up heard: ' + message);
});

window.onload = function(e) {
    document.getElementById('save').onclick         = sos.save;
    document.getElementById('skip').onclick         = sos.skip;
    document.getElementById('saveAndGo').onclick    = sos.saveAndGo;
    document.getElementById('skipAndGo').onclick    = sos.skipAndGo;
    document.getElementById('saveAsSource').onclick = sos.saveAsSource;
    document.getElementById('options').onclick      = sos.showOptions;
}
</script>

<style lang="scss" scoped>
p {
  font-size: 20px;
}

.menu-item {
    padding: 5px 5px;
}

.menu-item:hover {
    background-color: #CCC;
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
}

body {
    padding: 0px;
    margin: 0px;
}

</style>
