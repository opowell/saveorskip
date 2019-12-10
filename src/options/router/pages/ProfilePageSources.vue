<template>
  <div>
      <b-breadcrumb :items="crumbs"/>
      <h2>Sources</h2>
      <pps-table :sources='sources'></pps-table>
  </div>
</template>

<script>
import SourceDiv from './Source.vue';
import PpsTable from './ProfilePageSourcesTable.vue';
import * as idb from '../../../store/idb.js';

export default {
  name: 'ProfilePage',
  components: {
    SourceDiv,
    PpsTable,
  },
  watch: {
    '$route.params.id': function() {
      this.fetchData();
    },
  },
  created: function() {
    this.fetchData();
  },
  methods: {
    fetchData: function() {
      idb.loadSources({ profileId: this.$route.params.id });
    },
  },
  computed: {
    sources() {
      return this.$store.state.sources;
    },
    numSources: function() {
      return Object.keys(this.sources).length;
    },
    profileId() {
      return this.$route.params.id;
    },
    profile() {
      return this.$store.state.profile;
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
          text: this.profileId + '',
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
