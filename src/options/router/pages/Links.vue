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
import * as idb from '../../../store/idb';
import { convertId } from '../../../Utils';
import { STORE_LINKS, LINK_STATUS } from '../../../store/Constants.ts';
import { Hrefs } from '../../Constants';

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
      let link = { url, title };
      await idb.saveOrSkipLink(LINK_STATUS.SAVE, this.profileId, link);
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
          href: Hrefs.home(),
        },
        {
          text: 'Profiles',
          href: Hrefs.profiles(),
        },
        {
          text: this.profileName,
          href: Hrefs.profile(this.profileId),
        },
        {
          text: 'Links',
          href: Hrefs.links(this.profileId),
        },
      ];
    },
  },
};
</script>
