<template>
  <div>
      <b-breadcrumb :items="crumbs"/>
      <h2>Sources</h2>
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
      <table class='props'>
        <thead>
          <th v-for='header in sourceHeaders' :key='header'><span v-html='header'></span></th>
          </thead>
          <tbody>
            <source-div v-for='source in sources' :key='source.url' :source='source'></source-div>
          </tbody>
      </table>
  </div>
</template>

<script>
import SourceDiv from './Source.vue';
import store from '../../../store';

export default {
  name: 'ProfilePage',
  components: {
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
      sourceHeaders: ['del', '<i class="fa-star-half-alt fas"></i>', 'points', 'links', 'next scrape', 'url'],
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
  },
  computed: {
    sources: function() {
      return this.profile == null ? [] : this.profile.sources;
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
          to: '{ name: "profileSources", params: { id: this.profileId }}',
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
