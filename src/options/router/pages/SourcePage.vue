<template>
  <div>
      <h2>{{$route.params.id}}</h2>
      <div>
        <button @click='renameProfile'>rename</button>
        <button @click='duplicateProfile'>duplicate</button>
        <button @click='deleteProfile'>delete</button>
      </div>
      <h3>sources</h3>
      <div style='display: flex; flex-direction: column;'>
        <div>
            Url: <input type='text' v-model='sourceInput'>
        </div>
        <div>
            Points: <input style='width: 50px' type='number' min=0 v-model='sourcePointsInput'>
            </div>
        <div>
            <button @click='addSource'>add</button>
        </div>
      </div>
      <div class='props'>
        <source-div v-for='source in sources' :key='source.url' :source='source'></source-div>
      </div>
    <h3>links ({{numLinks}})</h3>
      <div style='display: flex; align-items: center'>
        <input type='text' v-model='newLinkUrl'>
<div>
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
import SourceDiv from './Source.vue';
import store from '../../../store';

export default {
  name: 'ProfilePage',
  components: {
    LinkDiv,
    SourceDiv,
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
      sourceInput: '',
      sourcePointsInput: 1,
      newLinkUrl: '',
      newLinkSaved: '',
    };
  },
  methods: {
    addSource: function() {
      let sourceUrl = this.sourceInput;
      let points = this.sourcePointsInput;
      console.log('trying to add source: ' + sourceUrl + ', ' + points + ', ' + this.profileId);

      store.dispatch('addSources', {
        sources: [
          {
            url: sourceUrl,
            points: points,
          },
        ],
        targetId: this.profileId,
      });
      this.fetchData();
    },

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
      this.profileId = this.$route.params.id;
      this.profile = null;
      let profiles = this.$store.getters.profileObjs;
      for (let i = 0; i < profiles.length; i++) {
        if (profiles[i].name === this.profileId) {
          this.profile = profiles[i];
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
