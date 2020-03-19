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
      :object="profiles"
      @create="addProfilePrompt"
      @click="openProfile"
      :ineditable-row-names="[]"
      :crumbs="crumbs"
      @deleteSelectedRows="deleteProfiles"
      :givenCols="['timeAdded', 'Links', 'Sources', 'id', 'name']"
      :fetchData="fetchData"
      :addItemText="'Add Profile...'"
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
  watch: {
    $route() {
      this.fetchData();
    },
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
          href: '#/profiles?filters=generatedBy,eq,user',
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
    async fetchData() {
      this.profiles.splice(0, this.profiles.length);
      this.numResults = await idb.getNumResults({ storeName: STORE_PROFILES, filters: this.$refs.table.filters });
      this.fetchMoreData();
    },
    checkIfNeedData(event) {
      if (this.profiles.length < this.numProfiles && this.profiles.length < this.$refs.table.perPage * (event - 1) + 1) {
        this.fetchMoreData();
      }
    },
    async fetchMoreData() {
      let items = await idb.getStoreResults({ storeName: STORE_PROFILES, filters: this.$refs.table.filters, offset: this.profiles.length, numRows: 100 });
      for (let i in items) {
        await idb.addProfileChildrenCounts(items[i]);
      }
      this.profiles.push(...items);
      this.$nextTick(async function() {
        if (this.$refs.table.items.length < this.$refs.table.perPage) {
          if (this.profiles.length < this.numResults) {
            await this.fetchMoreData();
          }
        }
      });
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
      this.fetchData();
    },
    openProfile({ item, index, event }) {
      this.$router.push({ name: 'profile', params: { id: item.id } });
    },
  },
};
</script>
