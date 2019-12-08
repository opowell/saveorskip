<template>
  <div>
    <b-breadcrumb :items="crumbs"/>
    <h2>Links ({{numLinks}})</h2>
    <ppl-table :links='links'></ppl-table>
  </div>
</template>

<script>
import LinkDiv from './Link.vue';
import PplTable from './ProfilePageLinksTable.vue';

export default {
  name: 'ProfilePage',
  components: {
    LinkDiv,
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
      this.$store.dispatch('loadLinks', { profileId: this.$route.params.id });
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
