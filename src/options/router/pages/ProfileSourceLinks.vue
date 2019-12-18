<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <objects-table ref="table" :object="links" @create="addLink" @click="openLink" :ineditable-row-names="[]" />
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
      idb.loadLinks({ profileId: this.$route.params.id });
      idb.loadProfile({ profileId: this.$route.params.id });
    },
    addLink() {},
    openLink() {},
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
    crumbs() {
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
          text: 'Links',
          to: '{ name: "profileLinks", params: { id: this.$route.params.id }}',
        },
      ];
    },
  },
};
</script>
