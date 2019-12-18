<template>
  <div>
    <b-modal id="deleteProfileModal" title="Delete Profile" @ok="deleteObject">
      <p class="my-4">Are you sure you want to delete this profile?</p>
    </b-modal>
    <b-breadcrumb :items="crumbs" />
    <objects-table
      ref="table"
      :object="profile"
      @create="addProperty"
      :ineditable-row-names="['id', 'name']"
      :ineditable-col-names="['id']"
      @save="saveObject"
      :fetchData="fetchData"
      @deleteObject="askDeleteObject"
    >
      <template v-slot:header>
        <button @click="exportProfile">Export</button>
      </template>
      <template v-slot:subpages>
        <router-link style="margin: 4px; padding: 1px;" :to="{ name: 'profileLinks', params: { id: profileId } }">Links ({{ numLinks }})</router-link>
        <router-link style="margin: 4px; padding: 1px;" :to="{ name: 'profileSources', params: { id: profileId } }">Sources ({{ numSources }})</router-link>
      </template>
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { STORE_PROFILES } from '../../../store/Constants.ts';
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
  data() {
    return {
      fieldDefns: [
        { key: 'name', label: 'Name', sortable: true, class: 'col-name' },
        { key: 'value', label: 'Value', sortable: true, class: 'col-value' },
      ],
      filter: null,
      removePropertySelect: null,
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async exportProfile() {
      let csvContent = 'data:text/csv;charset=utf-8,';
      for (let i = 0; i < this.fieldNames.length; i++) {
        let fieldName = this.fieldNames[i];
        if (fieldName === 'profileId') {
          continue;
        }
        csvContent += fieldName + ': ' + this.profile[fieldName] + '\n';
      }
      await idb.loadLinks({ profileId: this.$route.params.id });
      let links = this.$store.state.links;
      let fieldNames = ['profileId', 'saved', 'url'];
      for (let i = 0; i < links.length; i++) {
        let link = links[i];
        for (let a in link) {
          if (!fieldNames.includes(a)) {
            fieldNames.push(a);
          }
        }
      }
      csvContent += 'LINKS\n';
      csvContent += fieldNames.join(',') + '\n';
      for (let i = 0; i < links.length; i++) {
        let link = links[i];
        let line = '';
        for (let j = 0; j < fieldNames.length; j++) {
          let fieldName = fieldNames[j];
          if (link[fieldName] !== undefined) {
            line += link[fieldName];
          }
          line += ',';
        }
        line += '\n';
        csvContent += line;
      }
      const data = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', data);
      link.setAttribute('download', this.profileName + '.csv');
      link.click();
    },
    askDeleteObject() {
      this.$bvModal.show('deleteProfileModal');
    },
    addProperty(inputStr) {
      Vue.set(this.profile, inputStr, '');
      this.$refs.table.changesPending = true;
    },
    saveObject() {
      idb.saveObject(STORE_PROFILES, this.profile);
      this.fetchData();
    },
    deleteObject() {
      idb.deleteProfile({
        profileId: this.$route.params.id,
      });
      this.$router.push({ name: 'profiles' });
    },
    fetchData() {
      idb.loadProfile({
        profileId: this.$route.params.id,
      });
      this.$refs.table.changesPending = false;
    },
  },
  computed: {
    canAddProperty() {
      return this.filter != null && this.filter.length > 0 && (this.profile == null || this.profile[this.filter] == null);
    },
    profileId() {
      return this.$route.params.id - 0;
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
    profileStats() {
      return this.$store.state.profileStats;
    },
    numProps() {
      return this.profile == null ? 0 : Object.keys(this.profile).length;
    },
    numLinks() {
      if (this.profileStats == null) {
        return 0;
      }
      return this.profileStats.numLinks;
    },
    numSources() {
      if (this.profileStats == null) {
        return 0;
      }
      return this.profileStats.numSources;
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
          text: this.profileName,
          href: '#/profile/' + this.profileId,
        },
      ];
    },
  },
};
</script>
