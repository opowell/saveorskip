<template>
  <div>
    <b-modal id="addLinkModal" title="Add Link" @ok="addLink" no-fade>
      <div>
        <span>url:</span>
        <input type="text" />
      </div>
      <div>
        <span>title:</span>
        <input type="text" />
      </div>
      <div>
        <span>saved:</span>
        <input type="text" />
      </div>
    </b-modal>
    <objects-table
      ref="table"
      :object="links"
      @create="addLinkPrompt"
      @click="openLink"
      :colNamesToSkip="['profileId']"
      :colLabels="{ timeAdded: 'Time added' }"
      :crumbs="crumbs"
    />
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { convertId } from '../../../Utils.js';

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
    fetchData() {
      idb.loadLinks({ profileId: this.profileId });
      idb.loadProfile({ profileId: this.profileId });
    },
    addLinkPrompt() {
      this.$bvModal.show('addLinkModal');
    },
    async addLink(inputStr) {
      let link = {
        targetId: this.profileId,
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
      return convertId(this.$route.params.id);
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
          href: '#/profile/' + encodeURIComponent(this.profileId),
        },
        {
          text: 'Links',
          href: '#/profile/' + encodeURIComponent(this.profileId) + '/links',
        },
      ];
    },
  },
};
</script>
