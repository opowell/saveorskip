<template>
  <div style="height: 100%;">
    <b-modal id="addProfileModal" title="Add Profile" @ok="addProfile" no-fade>
      <div>
        <span>Name:</span>
        <input id="addProfileNameInput" type="text" v-on:keyup.enter="addProfile" />
      </div>
    </b-modal>
    <objects-table
      ref="table"
      @click="openProfile"
      @create="addProfilePrompt"
      @deleteSelectedRows="deleteProfiles"
      :addItemText="'Add Profile...'"
      :crumbs="crumbs"
      :fetchInitialData="fetchInitialData"
      :fetchRows="fetchRows"
      :givenCols="['timeAdded', 'Links', 'Sources', 'id', 'name']"
      :numResults="numResults"
      :object="profiles"
      :selectable="true"
      :storeNames="['profiles']"
    >
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { STORE_PROFILES } from '../../../store/Constants.ts';
export default {
  name: 'Profiles',
  components: {
    ObjectsTable,
  },
  data() {
    return {
      profiles: [],
      numResults: 0,
    };
  },
  computed: {
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
      ];
    },
  },
  methods: {
    deleteProfiles(selection) {
      for (let i in selection) {
        idb.deleteProfile({
          profileId: selection[i].id,
        });
      }
    },
    async fetchInitialData() {
      this.profiles.splice(0, this.profiles.length);
      this.numResults = await idb.getNumResults({ storeName: STORE_PROFILES, filters: this.$refs.table.filters });
    },
    async fetchRows() {
      let items = await idb.getStoreResults({ storeName: STORE_PROFILES, filters: this.$refs.table.filters, offset: this.profiles.length, numRows: 100 });
      for (let i in items) {
        await idb.addProfileChildrenCounts(items[i]);
      }
      return items;
    },
    addProfilePrompt() {
      this.$bvModal.show('addProfileModal');
    },
    async addProfile() {
      this.$bvModal.hide('addProfileModal');
      let nameInput = document.getElementById('addProfileNameInput').value;
      if (nameInput.length < 1) {
        return;
      }
      let profile = {
        name: nameInput,
        generatedBy: 'user',
      };
      await idb.storeProfile(profile, {});
      this.fetchInitialData();
    },
    openProfile({ item, index, event }) {
      this.$router.push({ name: 'profile', params: { id: item.id } });
    },
  },
};
</script>
