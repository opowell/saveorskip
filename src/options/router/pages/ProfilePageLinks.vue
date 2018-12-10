<template>
  <div>
    <b-breadcrumb :items="crumbs"/>
    <h2>Links ({{numLinks}})</h2>
      <div style='display: flex; align-items: center'>
        <input type='text' v-model='newLinkUrl'>
          <div style='padding: 0.5em'>
            <input type="radio" id="one" value=true v-model="newLinkSaved">
            <label for="one">saved</label>
            <br>
            <input type="radio" id="two" value=false v-model="newLinkSaved">
            <label for="two">not saved</label>
            <br>
          </div>
        <button @click='addLink'>add</button>
      </div>
      <div class='props'>
        <link-div v-for='link in links' :key='link.url' :initialLink='link'></link-div>
      </div>
  </div>
</template>

<script>
import LinkDiv from './Link.vue';

export default {
  name: 'ProfilePage',
  components: {
    LinkDiv,
  },
  watch: {
    '$route.params.id': function(id) {
      this.fetchData();
    },
  },
  created: function() {
    this.fetchData();
  },
  data() {
    return {
      profile: {},
      profileId: '',
      newLinkUrl: '',
      newLinkSaved: '',
    };
  },
  methods: {
    addLink: function() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'saveOrSkipLink',
        storePayload: {
          targetId: this.$route.params.id,
          action: this.newLinkSaved ? 'save' : 'skip',
          link: { url: this.newLinkUrl },
        },
      });
    },

    fetchData: function() {
      this.profileId = this.$route.params.id;
      this.profile = null;
      let profiles = this.$store.state.profiles;
      for (let i = 0; i < profiles.length; i++) {
        if (profiles[i].name === this.profileId) {
          this.profile = profiles[i];
          break;
        }
      }
    },
  },
  computed: {
    links: function() {
      return this.profile == null ? {} : this.profile.links;
    },
    savedLinks: function() {
      return this.links.filter(link => link.saved === true);
    },
    skippedLinks: function() {
      return this.links.filter(link => link.saved === false);
    },
    numLinks: function() {
      return Object.keys(this.links).length;
    },
    numSavedLinks: function() {
      return Object.keys(this.savedLinks).length;
    },
    numSkippedLinks: function() {
      return Object.keys(this.skippedLinks).length;
    },
    suggestedSources: function() {
      return this.profile == null ? [] : this.profile.suggestedSources;
    },
    crumbs: function() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
        {
          text: 'Profiles',
          href: '#/profiles',
        },
        {
          text: this.profileId,
          href: '#/profile/' + this.profileId,
        },
        {
          text: 'Links',
          to: '{ name: "profileLinks", params: { id: this.profileId }}',
        },
      ];
    },
  },
};
</script>

<style scoped>
div.props {
  color: #444;
  display: flex;
  font-size: 1rem;
  flex-direction: column;
}

div.props > div {
  padding: 5px;
}

button {
  margin: 5px;
  align-self: center;
}
</style>
