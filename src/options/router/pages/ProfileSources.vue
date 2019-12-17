<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <pps-table :sources="sources"></pps-table>
  </div>
</template>

<script>
import PpsTable from '../components/ProfilePageSourcesTable.vue';
import * as idb from '../../../store/idb.js';

export default {
  name: 'ProfilePage',
  components: {
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
      idb.loadProfile({ profileId: this.$route.params.id });
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
    profileName() {
      return this.profile == null ? '' : this.profile.name;
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
          text: this.profileName,
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
