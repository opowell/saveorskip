<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <div>
      <router-link :to="{ name: 'sourceLinks', params: { profileId: profileId, sourceId: sourceId } }">scraped links ({{ numLinks }})</router-link>
    </div>
    <div>
      <button>scrape</button>
    </div>
    <objects-table ref="table" :object="sources" @create="addSource" @click="openSource" :ineditable-row-names="[]" />
  </div>
</template>

<script>
import * as idb from '../../../store/idb.js';
import { dbPromise, STORE_LINKS, STORE_PROFILES, STORE_LINKS_PROFILEID, STORE_SOURCES_PROFILEID, STORE_SOURCES } from '../../../store/Constants.ts';
import Vue from 'vue';

export default {
  name: 'ProfileSource',
  watch: {
    '$route.params.profileId'(id) {
      this.fetchData();
    },
    '$route.params.sourceId'(id) {
      this.fetchData();
    },
  },
  data() {
    return {
      fieldDefns: [
        { key: 'name', label: 'Name', sortable: true, class: 'col-name' },
        { key: 'value', label: 'Value', sortable: true, class: 'col-value' },
      ],
      filter: null,
      removePropertySelect: null,
      changesPending: false,
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    changeFieldName(field, event) {
      let val = this.object[field];
      delete this.object[field];
      this.object[event.target.value] = val;
      this.changesPending = true;
    },
    changeFieldValue(field, event) {
      this.object[field] = event.target.value;
      this.changesPending = true;
    },
    tryToAddProperty() {
      if (this.canAddProperty) {
        this.addProperty();
      }
    },
    addProperty() {
      Vue.set(this.object, this.filter, '');
      this.changesPending = true;
    },
    removeProperty() {
      if (this.removePropertySelect == null) {
        return;
      }
      Vue.delete(this.object, this.removePropertySelect);
      this.changesPending = true;
    },
    saveObject() {
      idb.deleteObject(STORE_SOURCES, [this.$route.params.profileId - 0, this.$route.params.sourceId]);
      idb.saveObject(STORE_SOURCES, this.object);
      if (this.object.profileId != this.profileId || this.object.url != this.objectId) {
        this.$router.push({
          name: 'source',
          params: {
            profileId: this.object.profileId,
            sourceId: this.object.url,
          },
        });
      }
      this.fetchData();
    },
    deleteObject() {
      idb.deleteObject(STORE_SOURCES, [this.$route.params.profileId - 0, this.$route.params.sourceId]);
      this.$router.push({ name: 'profileSources', params: { id: this.profileId } });
    },
    fetchData() {
      idb.loadSource([this.profileId - 0, this.objectId]);
      idb.loadProfile({
        profileId: this.$route.params.profileId,
      });
      this.changesPending = false;
    },
    reset() {
      this.filter = '';
      this.fetchData();
    },
  },
  computed: {
    fixedFieldNames() {
      return ['saved', 'skipped', 'profileId', 'url', 'points', 'lastScraped', 'nextScrape'];
    },
    canAddProperty() {
      return this.filter != null && this.filter.length > 0 && (this.object == null || this.object[this.filter] == null);
    },
    profiles() {
      return this.$store.state.profiles;
    },
    fields() {
      let out = [];
      for (let i = 0; i < this.fieldNames.length; i++) {
        let fieldName = this.fieldNames[i];
        out.push({
          name: fieldName,
          value: this.object[fieldName],
        });
      }
      return out;
    },
    removableFieldNames() {
      let out = [];
      for (let i in this.fieldNames) {
        let fieldName = this.fieldNames[i];
        if (!this.fixedFieldNames.includes(fieldName)) {
          out.push(fieldName);
        }
      }
      return out;
    },
    fieldNames() {
      let out = [];
      for (let a in this.object) {
        out.push(a);
      }
      return out;
    },
    objectId() {
      return this.$route.params.sourceId;
    },
    object() {
      return this.$store.state.source;
    },
    profileId() {
      return this.$route.params.profileId;
    },
    profile() {
      return this.$store.state.profile;
    },
    profileName() {
      return this.profile == null ? '' : this.profile.name;
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
          text: this.objectId,
          href: '#/profile/' + this.profileId + '/sources/' + this.objectId,
        },
      ];
    },
  },
};
</script>
