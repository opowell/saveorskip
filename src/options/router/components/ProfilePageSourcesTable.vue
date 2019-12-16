<template>
  <b-container style="margin-left: 0px;">
    <!-- User Interface controls -->
    <b-row>
      <b-col class="my-1">
        <b-input-group>
          <b-form-input v-model="filter" placeholder="Add / filter" />
          <b-input-group-append>
            <b-btn variant="primary" :disabled="!filter" @click="addSource">Add</b-btn>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>

    <!-- Main table element -->
    <b-table hover show-empty stacked="md" :items="sources" :fields="fields" :filter="filter" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc" @row-clicked="openSource">
      <template slot="HEAD_select" slot-scope="data">
        <!-- We use click.native.stop here to prevent 'sort-changed' or 'head-clicked' events -->
        <b-form-checkbox @click.native.stop />
      </template>
      <template slot="HEAD_saved" slot-scope="data">
        <i class="fas fa-star" style="color: green"></i>
      </template>
      <template slot="HEAD_skipped" slot-scope="data">
        <i class="fas fa-star" style="color: red"></i>
      </template>

      <template slot="links" slot-scope="data">{{ Object.keys(data.item.scrapedLinks).length }}</template>
      <template slot="saved" slot-scope="data">
        <i @click="setSaved(true, data.item.url)" class="fa-star" style="color: green" v-bind:class="{ fas: data.item.saved, far: !data.item.saved }"></i>
      </template>

      <template slot="skipped" slot-scope="data">
        <i @click="setSaved(false, data.item.url)" class="fa-star" style="color: red" v-bind:class="{ fas: !data.item.saved, far: data.item.saved }"></i>
      </template>

      <template slot="actions" slot-scope="data">
        <span style="display: flex;">
          <i class="fas fa-trash" @click="removeSource(data.item.url)"></i>
          <router-link :to="{ name: 'source', params: { profileId: profileId, sourceId: data.item.url } }">
            <i class="fas fa-pen"></i>
          </router-link>
          <i class="fas fa-external-link-alt" @click="openInNewTab(data.item.url)"></i>
        </span>
      </template>
    </b-table>
  </b-container>
</template>

<script>
import * as idb from '../../../store/idb.js';

export default {
  props: ['sources'],
  data() {
    return {
      fields: [
        { key: 'saved', sortable: true },
        { key: 'skipped', sortable: true },
        { key: 'points', label: 'Points', sortable: true },
        { key: 'links', label: 'Links', sortable: true },
        { key: 'lastScraped', label: 'Last scraped', sortable: true, class: 'nowrap' },
        { key: 'nextScrape', label: 'Next scrape', sortable: true, class: 'nowrap' },
        { key: 'url', label: 'Url', sortable: true, class: 'nowrap' },
      ],
      sortBy: 'points',
      sortDesc: true,
      filter: null,
      selected: [],
    };
  },
  methods: {
    addSource() {
      let sourceData = {
        sources: [
          {
            url: this.filter,
            points: 0,
          },
        ],
        targetId: this.profileId,
      };
      this.$store.dispatch('addSources', sourceData);
      this.sources.push(sourceData.sources[0]);
    },

    openInNewTab: function(url) {
      window.open('http://' + url, '_blank');
    },

    removeSource: function(sourceId) {
      idb.removeSource({
        url: sourceId,
        targetId: this.profileId,
      });
      this.$parent.fetchData();
    },

    setSaved: function(saved, sourceId) {
      idb.setSourceSaved({
        source: sourceId,
        saved: saved,
        targetId: this.$route.params.id,
      });
    },
    openSource(item, index, event) {
      this.$router.push({ name: 'source', params: { profileId: this.profileId, sourceId: item.url } });
    },
  },
  computed: {
    profileId() {
      return this.profile == null ? '' : this.profile.id;
    },
    profile() {
      return this.$store.state.profile;
    },
    sortOptions() {
      // Create an options list from our fields
      return this.fields
        .filter(f => f.sortable)
        .map(f => {
          return { text: f.label, value: f.key };
        });
    },
  },
};
</script>
<style scoped>
.nowrap > div {
  overflow-wrap: break-word;
  max-width: 300px;
}
</style>
