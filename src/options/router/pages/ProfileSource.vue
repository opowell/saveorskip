<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <objects-table
      ref="table"
      :object="source"
      @create="addProperty"
      @save="saveObject"
      :fetchData="fetchData"
      :ineditable-row-names="['saved', 'skipped', 'profileId', 'url', 'points', 'lastScraped', 'nextScrape']"
      :ineditable-col-names="['profileId']"
    >
      <template v-slot:header>
        <button @click="scrape">Scrape</button>
        <button @click="openLink">Open</button>
      </template>
      <template v-slot:subpages>
        <router-link :to="{ name: 'profileSourceLinks', params: { profileId: profileId, sourceId: sourceId } }">Scraped links ()</router-link>
      </template>
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { STORE_PROFILES } from '../../../store/Constants.ts';
import * as types from '../../../store/mutation-types.js';
import Vue from 'vue';

export default {
  name: 'Profile',
  components: {
    ObjectsTable,
  },
  watch: {
    '$route.params.id': function(id) {
      this.fetchData();
    },
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async scrape() {
      await this.$store.commit(types.SET_URL_TO_SCRAPE, this.source.url);
      this.openLink();
      chrome.runtime.sendMessage({ action: 'saveSourcesOfUrl', url: this.source.url });
    },
    openLink() {
      window.open('http://' + this.source.url, '_blank');
    },
    addProperty(inputStr) {
      Vue.set(this.source, inputStr, '');
      this.$refs.table.changesPending = true;
    },
    saveObject() {
      idb.saveObject(STORE_SOURCES, this.source);
      this.fetchData();
    },
    deleteObject: function() {
      idb.deleteProfile({
        profileId: this.$route.params.profileId,
      });
      this.$router.push({ name: 'profiles' });
    },
    fetchData() {
      let profileId = this.$route.params.profileId - 0;
      let sourceId = this.$route.params.sourceId;
      idb.loadSource([profileId, sourceId]);
      idb.loadProfile({
        profileId,
      });
      this.$refs.table.changesPending = false;
    },
  },
  computed: {
    profileId() {
      return this.$route.params.profileId - 0;
    },
    profile() {
      return this.$store.state.profile;
    },
    profileName() {
      if (this.profile == null) {
        return '';
      }
      if (typeof this.profile.name == 'object') {
        return JSON.stringify(this.profile.name);
      }
      return this.profile.name;
    },
    sourceId() {
      return this.$route.params.sourceId;
    },
    source() {
      return this.$store.state.source;
    },
    profileStats() {
      return this.$store.state.profileStats;
    },
    fields() {
      let out = [];
      for (let i = 0; i < this.fieldNames.length; i++) {
        let fieldName = this.fieldNames[i];
        out.push({
          name: fieldName,
          value: this.profile[fieldName],
        });
      }
      return out;
    },
    removableFieldNames() {
      let out = [];
      for (let i in this.fieldNames) {
        let fieldName = this.fieldNames[i];
        if (!['id', 'name'].includes(fieldName)) {
          out.push(fieldName);
        }
      }
      return out;
    },
    fieldNames() {
      let out = [];
      for (let a in this.profile) {
        out.push(a);
      }
      return out;
    },
    crumbs() {
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
          text: 'Sources',
          href: '#/profile/' + this.profileId + '/sources',
        },
        {
          text: this.sourceId,
          href: '#/profile/' + this.profileId + '/sources/' + this.sourceId,
        },
      ];
    },
  },
};
</script>
