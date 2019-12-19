<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <objects-table ref="table" :object="links" @create="addLink" @click="openLink" />
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';

export default {
  name: 'ProfileSourceLinks',
  components: {
    ObjectsTable,
  },
  watch: {
    '$route.params.id': function() {
      this.fetchData();
    },
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      let profileId = this.$route.params.profileId - 0;
      let sourceId = this.$route.params.sourceId;
      idb.loadSource([profileId, sourceId]);
      idb.loadProfile({ profileId });
      idb.loadProfileSourceLinks({
        profileId,
        sourceId,
      });
    },
    async addLink(inputStr) {
      let link = {
        profileId: this.$route.params.profileId,
        sourceId: this.$route.params.sourceId,
        url: inputStr,
      };
      await idb.addProfileSourceLink(link);
      this.fetchData();
    },
    openLink({ item, index, event }) {
      this.$router.push({
        name: 'profileSourceLink',
        params: {
          profileId: this.profileId,
          source: this.sourceId,
          linkId: item.url,
        },
      });
    },
  },
  computed: {
    links() {
      return this.$store.state.profileSourceLinks;
    },
    numLinks() {
      return Object.keys(this.links).length;
    },
    profileId() {
      return this.$route.params.profileId;
    },
    sourceId() {
      return this.$route.params.sourceId;
    },
    profile() {
      return this.$store.state.profile;
    },
    profileName() {
      return this.profile == null ? '' : this.profile.name;
    },
    crumbs() {
      let profileId = encodeURIComponent(this.$route.params.profileId);
      let sourceId = encodeURIComponent(this.$route.params.sourceId);
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
          href: '#/profile/' + profileId,
        },
        {
          text: 'Sources',
          href: '#/profile/' + profileId + '/sources',
        },
        {
          text: this.$route.params.sourceId,
          href: '#/profile/' + profileId + '/sources/' + sourceId,
        },
        {
          text: 'Links',
          href: '#/profile/' + profileId + '/sources/' + sourceId + '/links',
        },
      ];
    },
  },
};
</script>
