<template>
  <div>
      <h2>{{$route.params.id}}</h2>
      <div>
        <button @click='renameProfile'>rename</button>
        <button @click='duplicateProfile'>duplicate</button>
        <button @click='deleteProfile'>delete</button>
      </div>
      <h3>suggested sources</h3>
      <div style='display: flex; flex-direction: column;'>
        <div>
            Url: <input type='text' v-model='sugSourceInput'>
        </div>
        <div>
            Points: <input style='width: 50px' type='number' min=0 v-model='sugSourcePointsInput'>
            </div>
        <div>
            <button @click='addSuggestedSource'>add</button>
        </div>
      </div>
      <div class='props'>
        <suggested-source-div v-for='source in suggestedSources' :key='source.url' :source='source'></suggested-source-div>
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
import SuggestedSourceDiv from './SuggestedSource.vue';
import store from '../../../store';

export default {
  name: 'ProfilePage',
  components: {
    LinkDiv,
    SuggestedSourceDiv,
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
      sugSourceInput: '',
      sugSourcePointsInput: 1,
      newLinkUrl: '',
      newLinkSaved: '',
    };
  },
  methods: {
    addSuggestedSource: function() {
      let sourceUrl = this.sugSourceInput;
      let points = this.sugSourcePointsInput;
      console.log('trying to add source: ' + sourceUrl + ', ' + points + ', ' + this.profileId);

      store.dispatch('addSuggestedSources', {
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
    suggestedSources: function() {
      return this.profile == null ? [] : this.profile.suggestedSources;
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
