<template>
  <div style="height: 100%;">
    <b-modal id="addProfileModal" title="Add Profile" @shown="focusModalElement" @ok="addProfile" no-fade>
      <div>
        <span>Name:</span>
        <input ref="input" id="addProfileNameInput" type="text" v-on:keyup.enter="addProfile" />
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
      :selectable="true"
      :storeNames="['profiles']"
    >
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import { STORE_PROFILES } from '../../../store/Constants';
import { Hrefs } from '../../Constants';

export default {
  name: 'Profiles',
  components: {
    ObjectsTable,
  },
  data() {
    return {
      numResults: 0,
    };
  },
  computed: {
    crumbs() {
      return [
        {
          text: 'Home',
          href: Hrefs.home(),
        },
        {
          text: 'Profiles',
          href: Hrefs.profiles(),
        },
      ];
    },
  },
  methods: {
    focusModalElement() {
      this.$refs.input.focus();
    },
    deleteProfiles(selection) {
      chrome.runtime.sendMessage({ action: 'deleteProfiles', profiles: selection }, function(response) {
        this.$refs.table.callFetchData();
      });
    },
    async fetchInitialData() {
      const self = this;
      chrome.runtime.sendMessage({ action: 'fetchNumResults', object: 'profiles', storeName: STORE_PROFILES, filters: this.$refs.table.filters }, function(numResults) {
        self.numResults = numResults;
        console.log('fid', this, self, self.numResults, self.$refs.table.numResults);
        self.$nextTick(() => self.$refs.table.checkIfNeedData());
      });
    },
    async fetchRows() {
      const self = this;
      console.log('fetching rows');
      chrome.runtime.sendMessage(
        {
          action: 'getProfiles',
          filters: this.$refs.table.filters,
          offset: this.$refs.table.items.length,
          numRows: 100,
          sortOrder: this.$refs.table.sortOrder,
        },
        function(items) {
          console.log('sending message', this);
          self.$refs.table.setRows(items);
        }
      );
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
      chrome.runtime.sendMessage({ action: 'storeProfile', profile }, function(response) {
        this.$refs.table.callFetchData();
      });
    },
    openProfile({ item, index, event }) {
      this.$router.push({ name: 'profile', params: { id: item.id } });
    },
  },
};
</script>
