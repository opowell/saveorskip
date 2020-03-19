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
      :object="sources"
      @create="addSourcePrompt"
      @click="openSource"
      :colNamesToSkip="['consumerId']"
      :colLabels="{ providerId: 'Profile' }"
      :crumbs="crumbs"
      @deleteSelectedRows="deleteSources"
      :givenCols="['points', 'saved', 'providerId', 'timeAdded']"
      sortBy="points"
      :sortDesc="true"
      :fetchData="fetchData"
      addItemText="Add Source..."
    />
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { Source } from '../../../models/Source.js';
import { convertId } from '../../../Utils.js';
import { STORE_SOURCES } from '../../../store/Constants.ts';

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

    async fetchData() {
      this.profile = await idb.getProfile(this.profileId);
      this.sources.splice(0, this.sources.length);
      this.numResults = await idb.getNumResults({
        storeName: STORE_SOURCES,
        filters: [{ field: 'consumerId', operator: 'eq', value: this.profile.id }, ...this.$refs.table.filters],
      });
      this.fetchMoreData();
    },
    checkIfNeedData(event) {
      if (this.sources.length < this.numResults && this.sources.length < this.$refs.table.perPage * (event - 1) + 1) {
        this.fetchMoreData();
      }
    },
    async fetchMoreData() {
      let items = await idb.getStoreResults({
        storeName: STORE_SOURCES,
        filters: [{ field: 'consumerId', operator: 'eq', value: this.profile.id }, ...this.$refs.table.filters],
        offset: this.sources.length,
        numRows: 100,
      });
      // for (let i in items) {
      //   await idb.addProfileChildrenCounts(items[i]);
      // }
      this.sources.push(...items);
      this.$nextTick(async function() {
        if (this.$refs.table.items.length < this.$refs.table.perPage) {
          if (this.sources.length < this.numResults) {
            await this.fetchMoreData();
          }
        }
      });
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
  },
  computed: {
    sources() {
      return this.$store.state.sources;
    },
    numSources() {
      return Object.keys(this.sources).length;
    },
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
          href: '#/profiles?filters=generatedBy,eq,user',
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
