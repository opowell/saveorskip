<template>
  <div>
    <b-modal id="deleteModal" title="Delete Source" @ok="deleteObject">
      <p class="my-4">Are you sure you want to delete this source?</p>
    </b-modal>
    <b-breadcrumb :items="crumbs" />
    <objects-table
      ref="table"
      :object="source"
      @create="addProperty"
      @save="saveObject"
      :fetchData="fetchData"
      :ineditable-row-names="['points', 'consumerId', 'providerId']"
      :ineditable-col-names="['consumerId', 'providerId']"
      :links="fieldLinks"
      @deleteObject="askDeleteObject"
    >
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { STORE_SOURCES } from '../../../store/Constants.ts';
import Vue from 'vue';

export default {
  name: 'Source',
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
    askDeleteObject() {
      this.$bvModal.show('deleteModal');
    },
    deleteObject() {
      idb.deleteProfileSource({
        profileId: this.profileId,
        sourceId: this.sourceId,
      });
      this.$router.push({
        name: 'profileSources',
        params: {
          id: this.$route.params.profileId,
        },
      });
    },
    addProperty(inputStr) {
      Vue.set(this.source, inputStr, '');
      this.$refs.table.changesPending = true;
    },
    saveObject() {
      idb.saveObject(STORE_SOURCES, this.source);
      this.fetchData();
    },
    fetchData() {
      let profileId = this.$route.params.profileId - 0;
      let sourceId = this.$route.params.sourceId;
      idb.loadSource([profileId, sourceId]);
      idb.loadProfile({ profileId });
      this.$refs.table.changesPending = false;
    },
  },
  computed: {
    fieldLinks() {
      return {
        'Scraped links': '#/profile/' + this.$route.params.profileId + '/sources/' + encodeURIComponent(this.$route.params.sourceId) + '/links',
      };
    },
    profileSourceStats() {
      return this.$store.state.profileSourceStats;
    },
    numLinks() {
      if (this.profileSourceStats == null) {
        return '';
      }
      return this.profileSourceStats.numLinks;
    },
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
      if (typeof this.profile.name === 'object') {
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
    // fields() {
    //   let out = [];
    //   for (let i = 0; i < this.fieldNames.length; i++) {
    //     let fieldName = this.fieldNames[i];
    //     out.push({
    //       name: fieldName,
    //       value: this.profile[fieldName],
    //     });
    //   }
    //   return out;
    // },
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
          href: '#/profile/' + this.$route.params.profileId,
        },
        {
          text: 'Sources',
          href: '#/profile/' + this.$route.params.profileId + '/sources',
        },
        {
          text: this.sourceId,
          href: '#/profile/' + this.$route.params.profileId + '/sources/' + this.$route.params.sourceId,
        },
      ];
    },
  },
};
</script>
