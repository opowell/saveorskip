<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <objects-table ref="table" :object="links" @create="addLink" @click="openLink" :show-del="false" :ineditable-row-names="[]" :itemKeyField="'id'" :itemNameField="'url'" />
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';

export default {
  name: 'ProfileLinks',
  components: {
    ObjectsTable,
  },
  watch: {
    '$route.params.id': function() {
      this.fetchData();
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    fetchData: function() {
      idb.loadLinks({ profileId: this.$route.params.id });
      idb.loadProfile({ profileId: this.$route.params.id });
    },
    async addLink(inputStr) {
      let link = {
        targetId: this.$route.params.id,
        action: 'save',
        link: { url: inputStr },
      };
      await idb.saveOrSkipLink(link);
      this.fetchData();
      // this.links.push(link);
    },
    openLink({ item, index, event }) {
      this.$router.push({
        name: 'profileLink',
        params: {
          profileId: this.profileId,
          linkId: item.url,
        },
      });
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
