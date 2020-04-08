<template>
  <div style="height: 100%;">
    <b-modal id="deleteModal" title="Delete Source" @ok="deleteObject" no-fade>
      <p class="my-4">Are you sure you want to delete this source?</p>
    </b-modal>
    <objects-table
      ref="table"
      :object="source"
      :crumbs="crumbs"
      @save="saveObject"
      :fetchInitialData="fetchInitialData"
      :ineditable-row-names="['points', 'consumerId', 'providerId', 'saved', 'timeAdded']"
      :ineditable-col-names="['consumerId']"
      :links="fieldLinks"
      :rowNamesToSkip="['consumerId']"
      @deleteObject="askDeleteObject"
      :rowLabels="{ providerId: 'Profile' }"
      addItemText="Add Field..."
    >
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb';
import { STORE_SOURCES } from '../../../store/Constants';
import { convertId } from '../../../Utils';
import { Hrefs } from '../../Constants';

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
  data() {
    return {
      profile: null,
      source: null,
    };
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
    saveObject() {
      idb.saveObject(STORE_SOURCES, this.source);
      this.fetchInitialData();
    },
    async fetchInitialData() {
      let profileId = this.profileId;
      let sourceId = this.$route.params.sourceId;
      this.source = await idb.loadSource([profileId, sourceId]);
      this.profile = await idb.getProfile(this.profileId);
    },
  },
  computed: {
    fieldLinks() {
      return {
        providerId: Hrefs.profile(this.$route.params.sourceId),
      };
    },
    profileId() {
      return convertId(this.$route.params.profileId);
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
    sourceId() {
      return this.$route.params.sourceId;
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
          href: Hrefs.profiles(),
        },
        {
          text: this.profileName,
          href: Hrefs.profile(this.$route.params.profileId),
        },
        {
          text: 'Sources',
          href: Hrefs.sources(this.$route.params.profileId),
        },
        {
          text: this.sourceId,
          href: '#/profile/' + encodeURIComponent(this.$route.params.profileId) + '/sources/' + encodeURIComponent(this.$route.params.sourceId),
        },
      ];
    },
  },
};
</script>
