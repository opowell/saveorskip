<template>
  <b-container style='margin-left: 0px;'>
    <!-- User Interface controls -->
    <b-row>
      <b-col class="my-1">
          <b-input-group>
            <b-form-input v-model="filter" placeholder="Add / filter" />
            <b-input-group-append>
              <b-btn variant='primary' :disabled="!filter" @click="addSource">Add</b-btn>
            </b-input-group-append>
          </b-input-group>
      </b-col>
      <b-col md="auto" class="my-1">
        <b-form-group horizontal label="Per&nbsp;page" class="mb-0">
          <b-form-select :options="pageOptions" style='width: 5em;' v-model="perPage" />
        </b-form-group>
      </b-col>
      <b-col md="auto" class="my-1">
        <b-pagination :total-rows="totalRows" :per-page="perPage" v-model="currentPage" class="my-0" />
      </b-col>
    </b-row>

    <!-- Main table element -->
    <b-table show-empty
             stacked="md"
             :items="sources"
             :fields="fields"
             :current-page="currentPage"
             :per-page="perPage"
             :filter="filter"
             :sort-by.sync="sortBy"
             :sort-desc.sync="sortDesc"
             @filtered="onFiltered"
    >
      <template slot="HEAD_select" slot-scope="foo">
          <!-- We use click.native.stop here to prevent 'sort-changed' or 'head-clicked' events -->
          <b-form-checkbox @click.native.stop/>
      </template>
      <template slot="HEAD_saved" slot-scope="data">
          <i class="fas fa-star" style='color: green'></i>
      </template>
      <template slot="HEAD_skipped" slot-scope="data">
          <i class="fas fa-star" style='color: red'></i>
      </template>
      
      <template slot='select' slot-scope="data">
          <b-form-checkbox @click.native.stop :value="data.column" v-model="selected"/>
      </template>
      <template slot="name" slot-scope="row">{{row.value.first}} {{row.value.last}}</template>
      <template slot="isActive" slot-scope="row">{{row.value?'Yes :)':'No :('}}</template>
      <template slot="links" slot-scope="data">{{Object.keys(data.item.scrapedLinks).length}}</template>
      <template slot='saved' slot-scope='data'>
          <i @click='setSaved(true, data.item.url)' class="fa-star" style='color: green' v-bind:class='{fas: data.item.saved, far: !data.item.saved}'></i>
      </template>

      <template slot='skipped' slot-scope='data'>
        <i @click='setSaved(false, data.item.url)' class="fa-star" style='color: red' v-bind:class='{fas: !data.item.saved, far: data.item.saved}'></i>
      </template>

      <template slot="actions" slot-scope="data">
        <!-- We use @click.stop here to prevent a 'row-clicked' event from also happening -->
        <!-- <b-button size="sm" @click.stop="row.toggleDetails">
          {{ row.detailsShowing ? 'Hide' : 'Show' }} Details
        </b-button> -->
        <span style='display: flex;'>
            <i class='fas fa-trash' @click='removeSource(data.item.url)'></i>
            <router-link :to='{ name: "source", params: { profileId: profileId, sourceId: data.item.url }}'>
                <i class="fas fa-edit"></i>
            </router-link>
            <i class="fas fa-external-link-alt" @click='openInNewTab(data.item.url)'></i>
        </span>
      </template>
      <template slot="row-details" slot-scope="row">
        <b-card>
          <ul>
            <li v-for="(value, key) in row.item" :key="key">{{ key }}: {{ value}}</li>
          </ul>
        </b-card>
      </template>
    </b-table>

  </b-container>
</template>

<script>
export default {
  data() {
    return {
      fields: [
        { key: 'select' },
        { key: 'saved', sortable: true },
        { key: 'skipped', sortable: true },
        { key: 'points', label: 'Points', sortable: true },
        { key: 'url', label: 'Url', sortable: true },
        { key: 'links', label: 'Links', sortable: true },
        { key: 'lastScraped', label: 'Last scraped', sortable: true },
        { key: 'nextScrape', label: 'Next scrape', sortable: true },
        { key: 'actions', label: '' },
      ],
      currentPage: 1,
      perPage: 25,
      totalRows: 0,
      pageOptions: [25, 50, 100],
      sortBy: 'points',
      sortDesc: true,
      filter: null,

      profile: {},
      profileId: '',
    };
  },
  watch: {
    '$route.params.id': function(id) {
      this.fetchData();
    },
  },
  created: function() {
    this.fetchData();
  },

  methods: {
    addSource: function() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'addSources',
        storePayload: {
          sources: [
            {
              url: this.filter,
              points: 0,
            },
          ],
          targetId: this.profileId,
        },
      });
    },

    openInNewTab: function(url) {
      window.open('http://' + url, '_blank');
    },

    fetchData: function() {
      this.profileId = this.$route.params.id;
      this.profile = null;
      let profiles = this.$store.state.profiles;
      for (let i = 0; i < profiles.length; i++) {
        if (profiles[i].name === this.profileId) {
          this.profile = profiles[i];
          break;
        }
      }
      this.totalRows = Object.keys(this.profile.sources).length;
    },

    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length;
      this.currentPage = 1;
    },

    removeSource: function(sourceId) {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'removeSource',
        storePayload: {
          url: sourceId,
          targetId: this.$route.params.profileId,
        },
      });
      this.$parent.fetchData();
    },

    setSaved: function(saved, sourceId) {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'setSourceSaved',
        storePayload: {
          source: sourceId,
          saved: saved,
          targetId: this.$route.params.id,
        },
      });
    },
  },
  computed: {
    sources: function() {
      let out = [];
      if (this.profile == null) {
        return out;
      }
      for (let i in this.profile.sources) {
        out.push(this.profile.sources[i]);
      }
      return out;
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
          text: this.profileId,
          href: '#/profile/' + this.profileId,
        },
        {
          text: 'Sources',
          to: '{ name: "profileSources", params: { id: this.profileId }}',
        },
      ];
    },
    sortOptions() {
      // Create an options list from our fields
      return this.fields.filter(f => f.sortable).map(f => {
        return { text: f.label, value: f.key };
      });
    },
  },
};
</script>

<!-- table-complete-1.vue -->
