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
      @create="addLinkPrompt"
      @click="openLink"
      @deleteSelectedRows="deleteLinks"
      :addItemText="'Add Link...'"
      :colNamesToSkip="['profileId']"
      :colLabels="{ timeAdded: 'Time added' }"
      :crumbs="crumbs"
      :displayIndexFn="displayIndexFn"
      :fetchInitialData="fetchInitialData"
      :fetchRows="fetchRows"
      :givenCols="['saved', 'url', 'title', 'timeAdded']"
      :numResults="numResults"
      :selectable="true"
      :storeNames="['links']"
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
  data() {
    return {
      profile: null,
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
    async fetchInitialData() {
      this.profile = await idb.getProfile(this.profileId);
      let resultsFilters = [{ field: 'profileId', lowerValue: this.profileId, upperValue: this.profileId }, ...this.$refs.table.filters];
      this.numResults = await idb.getNumResults({ storeName: STORE_LINKS, filters: resultsFilters });
    },
    async fetchRows() {
      let resultsFilters = [{ field: 'profileId', lowerValue: this.profileId, upperValue: this.profileId }, ...this.$refs.table.filters];
      let items = await idb.getStoreResults({
        storeName: STORE_LINKS,
        filters: resultsFilters,
        offset: this.$refs.table.items.length,
        numRows: 100,
        sortOrder: this.$refs.table.sortOrder,
      });
      return items;
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
      await this.fetchInitialData();
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
