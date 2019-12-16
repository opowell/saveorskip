<template>
  <b-container style="margin-left: 0px;">
    <!-- User Interface controls -->
    <b-row>
      <b-col class="my-1">
        <b-input-group style="align-items: center;">
          <b-form-input v-model="filter" placeholder="Add / filter" />
          <b-input-group-append>
            <b-btn variant="primary" :disabled="!filter" @click="addLink">Add</b-btn>
          </b-input-group-append>
        </b-input-group>
      </b-col>
    </b-row>

    <!-- Main table element -->
    <b-table show-empty hover stacked="md" :items="links" :fields="fields" :filter="filter" :sort-by.sync="sortBy" :sort-desc.sync="sortDesc" @row-clicked="openLink">
      <template slot="HEAD_select">
        <!-- We use click.native.stop here to prevent 'sort-changed' or 'head-clicked' events -->
        <b-form-checkbox @click.native.stop />
      </template>
      <!-- <template slot="HEAD_saved" slot-scope="data"> -->
      <template slot="HEAD_saved">
        <i class="fas fa-star"></i>
      </template>

      <template slot="saved" slot-scope="data">
        <i @click="toggleSaved(data.item)" class="fa-star" v-bind:class="{ fas: data.item.saved, far: !data.item.saved }"></i>
      </template>

      <template slot="actions" slot-scope="data">
        <span style="display: flex;">
          <i class="fas fa-trash" @click="removeLink(data.item.url)"></i>
          <router-link :to="{ name: 'link', params: { profileId: profileId, linkId: data.item.url } }">
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
  props: ['links'],
  data() {
    return {
      fields: [
        { key: 'saved', sortable: true },
        { key: 'timeSaved', label: 'Time saved', sortable: true, class: 'nowrap' },
        { key: 'title', label: 'Title', sortable: true, class: 'nowrap' },
        { key: 'url', label: 'Url', sortable: true, class: 'nowrap' },
        { key: 'actions', label: '' },
      ],
      sortBy: 'saved',
      sortDesc: true,
      filter: null,
    };
  },

  methods: {
    addLink() {
      let link = {
        targetId: this.$route.params.id,
        action: 'save',
        link: { url: this.filter },
      };
      idb.saveOrSkipLink(link);
      this.links.push(link);
    },

    openLink(item, index, event) {
      this.$router.push({ name: 'link', params: { profileId: this.profileId, linkId: item.url } });
    },

    removeLink(url) {
      idb.removeLink({
        url: url,
        targetId: this.profileId,
      });
      this.$parent.fetchData();
    },
    toggleSaved(link) {
      idb.saveOrSkipLink({
        link: link.url,
        action: link.saved ? 'skip' : 'save',
        targetId: this.profileId,
      });
    },

    setSaved(saved, sourceId) {
      idb.setSourceSaved({
        source: sourceId,
        saved: saved,
        targetId: this.$route.params.id,
      });
    },
  },
  computed: {
    profileId() {
      return this.$route.params.id;
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
<style>
.nowrap > div {
  overflow-wrap: break-word;
  max-width: 300px;
}
</style>
