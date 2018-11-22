<template>
  <div>
      <b-breadcrumb :items="crumbs"/>
      <h2>{{$route.params.sourceId}}</h2>
      <div>
        <button @click='renameSource'>rename</button>
        <button @click='duplicateSource'>duplicate</button>
        <button @click='deleteSource'>delete</button>
      </div>
      <div style='display: flex; flex-direction: column;'>
        <div>
            Url: <input type='text' v-model='sourceInput'>
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
import store from '../../../store';

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
      sourcePointsInput: 1,
    };
  },
  methods: {
    addLink: function() {
      store.dispatch('saveOrSkipLink', {
        targetId: this.$route.params.id,
        action: this.newLinkSaved ? 'save' : 'skip',
        link: this.newLinkUrl,
      });
    },

    deleteProfile: function() {
      this.$store.dispatch('deleteProfile', {
        profileId: this.$route.params.id,
      });
      this.$router.push({ name: 'profiles' });
    },

    fetchData: function() {
      this.profileId = this.$route.params.profileId;
      this.sourceId = this.$route.params.sourceId;
      this.profile = null;
      this.source = null;
      let profiles = this.$store.state.profiles;
      for (let i = 0; i < profiles.length; i++) {
        if (profiles[i].name === this.profileId) {
          this.profile = profiles[i];
          this.source = this.profile.sources[this.sourceId];
          break;
        }
      }
    },

    renameProfile: function() {
      var newName = prompt('Enter new name:');
      if (newName == null) {
        return;
      }
      this.$store.dispatch('renameProfile', {
        profileId: this.$route.params.id,
        newName: newName,
      });
      this.$router.push(newName);
    },

    duplicateProfile: function() {
      this.$store.dispatch('duplicateProfile', {
        profileId: this.$route.params.id,
      });
      this.$router.push(this.$store.getters.profileDuplicate.name);
    },
  },
  computed: {
    sources: function() {
      return this.profile == null ? [] : this.profile.sources;
    },
    links: function() {
      return this.profile == null ? [] : this.profile.links;
    },
    savedLinks: function() {
      return this.links.filter(link => link.saved === true);
    },
    skippedLinks: function() {
      return this.links.filter(link => link.saved === false);
    },
    numLinks: function() {
      return this.links.length;
    },
    numSavedLinks: function() {
      return this.savedLinks.length;
    },
    numSkippedLinks: function() {
      return this.skippedLinks.length;
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
