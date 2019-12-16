<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <ppl-table :links="links"></ppl-table>
  </div>
</template>

<script>
import PplTable from './ProfilePageLinksTable.vue';
import * as idb from '../../../store/idb.js';

export default {
  name: 'SourceLinks',
  components: {
    PplTable,
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
      idb.loadLinks({ profileId: this.$route.params.id });
      idb.loadProfile({ profileId: this.$route.params.id });
    },
  },
  computed: {
    links() {
      return this.$store.state.links;
    },
    numLinks: function() {
      return Object.keys(this.links).length;
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
          text: this.profileName + ' (' + this.profileId + ')',
          href: '#/profile/' + this.profileId,
        },
        {
          text: 'Links',
          to: '{ name: "profileLinks", params: { id: this.$route.params.id }}',
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
