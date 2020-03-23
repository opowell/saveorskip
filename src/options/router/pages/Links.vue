<template>
  <div style="height: 100%;">
    <b-modal id="addLinkModal" title="Add Link" @ok="addLink" no-fade>
      <div>
        <span>url:</span>
        <input type="text" id="addLinkUrlInput" v-on:keyup.enter="addLink" />
      </div>
      <div>
        <span>title:</span>
        <input type="text" id="addLinkTitleInput" v-on:keyup.enter="addLink" />
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
      @deleteSelectedRows="deleteLinks"
      sortBy="timeAdded"
      :sortDesc="true"
      :givenCols="['saved', 'url', 'title', 'timeAdded']"
      :fetchData="fetchData"
      :addItemText="'Add Link...'"
      :numResults="numResults"
      :fetchDataFn="fetchDataFn"
      :storeNames="['links']"
      :displayIndexFn="displayIndexFn"
      :selectable="true"
    />
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { convertId } from '../../../Utils.js';
import { STORE_LINKS } from '../../../store/Constants.ts';

export default {
  name: 'ProfileLinks',
  components: {
    ObjectsTable,
  },
  watch: {
    $route: async function() {
      await this.fetchData();
    },
  },
  data() {
    return {
      profile: null,
      links: [],
      numResults: 0,
    };
  },
  methods: {
    deleteLinks(selection) {
      for (let i in selection) {
        idb.deleteLink({
          profileId: selection[i].profileId,
          linkId: selection[i].url,
        });
      }
    },
    displayIndexFn(index) {
      let tokens = index.keyPath.split('_');
      tokens.splice(0, 1);
      let out = tokens.join(',');
      index.tokens = tokens;
      return out;
    },
    async fetchData() {
      this.profile = await idb.getProfile(this.profileId);
      this.links.splice(0, this.links.length);
      let resultsFilters = [{ field: 'profileId', lowerValue: this.profileId, upperValue: this.profileId }, ...this.$refs.table.filters];
      this.numResults = await idb.getNumResults({ storeName: STORE_LINKS, filters: resultsFilters });
      this.fetchMoreData();
    },
    checkIfNeedData(event) {
      if (this.links.length < this.numResults && this.links.length < this.$refs.table.perPage * (event - 1) + 1) {
        this.fetchMoreData();
      }
    },
    async fetchDataFn() {
      let resultsFilters = [{ field: 'profileId', lowerValue: this.profileId, upperValue: this.profileId }, ...this.$refs.table.filters];
      let items = await idb.getStoreResults({ storeName: STORE_LINKS, filters: resultsFilters, offset: this.links.length, numRows: 100 });
      return items;
    },
    async fetchMoreData() {
      let resultsFilters = [{ field: 'profileId', lowerValue: this.profileId, upperValue: this.profileId }, ...this.$refs.table.filters];

      let items = await idb.getStoreResults({ storeName: STORE_LINKS, filters: resultsFilters, offset: this.links.length, numRows: 100 });
      this.links.push(...items);
      this.$nextTick(async function() {
        this.checkIfNeedData();
      });
    },

    addLinkPrompt() {
      this.$bvModal.show('addLinkModal');
    },
    async addLink() {
      let url = document.getElementById('addLinkUrlInput').value;
      let title = document.getElementById('addLinkTitleInput').value;
      let link = {
        targetId: this.profileId,
        action: 'save',
        link: { url, title },
      };
      await idb.saveOrSkipLink(link);
      await this.fetchData();
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
    profileId() {
      return convertId(this.$route.params.id);
    },
    profileName() {
      if (this.profile == null) {
        return '';
      }
      if (typeof this.profile.name === 'object') {
        return JSON.stringify(this.profile.name);
      }
      if (this.profile.name == null || this.profile.name === '') {
        return decodeURIComponent(this.profile.id);
      }
      return this.profile.name;
    },
    crumbs() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
        {
          text: 'Profiles',
          href: '#/profiles?filters=user,generatedBy,user',
        },
        {
          text: this.profileName,
          href: '#/profile/' + encodeURIComponent(this.profileId),
        },
        {
          text: 'Links',
          href: '#/profile/' + encodeURIComponent(this.profileId) + '/links?filters=1,saved,1',
        },
      ];
    },
  },
};
</script>
