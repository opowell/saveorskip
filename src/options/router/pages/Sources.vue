<template>
  <div style="height: 100%;">
    <b-modal id="addSourceModal" title="Add Source" @ok="addSource" no-fade>
      <div>
        <span>id/url:</span>
        <input id="addSourceIdInput" type="text" v-on:keyup.enter="addSource" />
      </div>
      <div>
        <span>points:</span>
        <input id="addSourcePointsInput" type="number" min="0" value="0" v-on:keyup.enter="addSource" />
      </div>
    </b-modal>
    <objects-table
      ref="table"
      @create="addSourcePrompt"
      @click="openSource"
      :colNamesToSkip="['consumerId']"
      :colLabels="{ providerId: 'Profile' }"
      :crumbs="crumbs"
      @deleteSelectedRows="deleteSources"
      :givenCols="['points', 'saved', 'providerId', 'timeAdded']"
      addItemText="Add Source..."
      :numResults="numResults"
      :storeNames="['sources']"
      :displayIndexFn="displayIndexFn"
      :selectable="true"
      :fetchInitialData="fetchInitialData"
      :fetchRows="fetchRows"
    />
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb';
import { Source } from '../../../models/Source';
import { convertId } from '../../../Utils';
import { STORE_SOURCES } from '../../../store/Constants';

export default {
  name: 'ProfilePage',
  components: {
    ObjectsTable,
  },
  watch: {
    $route() {
      this.fetchData();
    },
  },
  data() {
    return {
      profile: null,
      numResults: 0,
    };
  },
  methods: {
    deleteSources(selection) {
      for (let i in selection) {
        idb.deleteProfileSource({
          profileId: selection[i].consumerId,
          sourceId: selection[i].providerId,
        });
      }
    },
    async fetchInitialData() {
      this.profile = await idb.getProfile(this.profileId);
      this.numResults = await idb.getNumResults({
        storeName: STORE_SOURCES,
        filters: [{ field: 'consumerId', lowerValue: this.profile.id, upperValue: this.profile.id }, ...this.$refs.table.filters],
      });
    },
    async fetchRows() {
      let items = await idb.getStoreResults({
        storeName: STORE_SOURCES,
        filters: [{ field: 'consumerId', lowerValue: this.profile.id, upperValue: this.profile.id }, ...this.$refs.table.filters],
        offset: this.$refs.table.items.length,
        numRows: 100,
        sortOrder: this.$refs.table.sortOrder,
      });
      // for (let i in items) {
      //   await idb.addProfileChildrenCounts(items[i]);
      // }
      return items;
    },

    addSourcePrompt() {
      this.$bvModal.show('addSourceModal');
    },
    async addSource() {
      this.$bvModal.hide('addSourceModal');
      let urlInput = document.getElementById('addSourceIdInput').value;
      if (urlInput.length < 1) {
        return;
      }
      let source = Source(urlInput, this.profileId);
      source.points = document.getElementById('addSourcePointsInput').value;
      source.generatedBy = 'user';
      await idb.addSources({ sources: [source] });
      this.fetchData();
    },
    openSource({ item, index, event }) {
      this.$router.push({ name: 'profileSource', params: { profileId: this.profileId, sourceId: item.providerId } });
    },
    displayIndexFn(index) {
      let tokens = index.keyPath.split('_');
      tokens.splice(0, 1);
      let out = tokens.join(',');
      index.tokens = tokens;
      return out;
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
          text: 'Sources',
          href: '#/profile/' + encodeURIComponent(this.profileId) + '/sources',
        },
      ];
    },
  },
};
</script>
