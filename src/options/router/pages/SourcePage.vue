<template>
  <div>
      <b-breadcrumb :items="crumbs"/>
      <h2>{{$route.params.sourceId}}</h2>
      <div>
        <button @click='rename'>rename</button>
        <button @click='duplicate'>duplicate</button>
        <button @click='deleteS'>delete</button>
      </div>
      <div style='display: flex; flex-direction: column;'>
        <div>
            Url: <input type='text' v-model='sourceUrlInput'>
        </div>
        <div>
            Points: <input style='width: 50px' type='number' min=0 v-model='sourcePointsInput'>
            </div>
        <div>
            <button>edit</button>
        </div>
      </div>
      <div class='props'>
        <scraped-link-div v-for='link in source.scrapedLinks' :key='link.url' :initialLink='link'></scraped-link-div>
      </div>
  </div>
</template>

<script>
import ScrapedLinkDiv from './ScrapedLink.vue';

export default {
  name: 'SourcePage',
  components: {
    ScrapedLinkDiv,
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
      source: {},
      sourceId: '',
      sourceInput: '',
      sourcePointsInput: '',
      sourceUrlInput: '',
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
          link: this.newLinkUrl,
        },
      });
    },

    deleteS: function() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'deleteSource',
        storePayload: {
          profileId: this.$route.params.id,
        },
      });
      this.$router.push({ name: 'profiles' });
    },

    fetchData: function() {
      this.profileId = this.$route.params.profileId;
      this.sourceId = this.$route.params.sourceId;
      this.sourceUrlInput = this.sourceId;
      this.profile = null;
      this.source = null;
      let profiles = this.$store.state.profiles;
      for (let i = 0; i < profiles.length; i++) {
        if (profiles[i].name === this.profileId) {
          this.profile = profiles[i];
          this.source = this.profile.sources[this.sourceId];
          this.sourcePointsInput = this.source.points;
          break;
        }
      }
    },

    rename: function() {
      var newName = prompt('Enter new name:');
      if (newName == null) {
        return;
      }
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'renameSource',
        storePayload: {
          profileId: this.$route.params.targetId,
          sourceId: this.$route.params.sourceId,
          newName: newName,
        },
      });
      this.$router.push(newName);
    },

    duplicate: function() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'duplicateSource',
        storePayload: {
          profileId: this.$route.params.profileId,
          sourceId: this.$route.params.sourceId,
        },
      });
      this.$router.push(this.$store.getters.sourceDuplicate.name);
    },
  },
  computed: {
    links: function() {
      return this.source == null ? [] : this.source.links;
    },
    numLinks: function() {
      return this.links.length;
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
          text: 'Sources',
          href: '#/profile/' + this.profileId + '/sources',
        },
        {
          text: this.sourceId,
          href: '#/profile/' + this.profileId + '/sources/' + this.sourceId,
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
