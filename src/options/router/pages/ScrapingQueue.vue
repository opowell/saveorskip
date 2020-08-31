<template>
  <div style="height: 100%;">
    <b-modal id="addIndexModal" title="Add Page" @ok="addIndex" no-fade>
      <div>
        <span>Object:</span>
        <select id="addIndexObjectInput">
          <option v-for="(value, index) in indexStores" :key="index" :value="value">{{ value }}</option>
        </select>
      </div>
      <div>
        <div class="my-3">
          Keypath:
          <span @click="removeKeyPath(index)" class="filter" v-for="(path, index) in curKeyPath" :key="index">{{ path }}</span>
        </div>
        <div class="my-3">
          <input id="addIndexKeypathInput" type="text" v-on:keyup.enter="addKeyToPath" />
          <b-button @click="addKeyToPath">Add Key to Path</b-button>
        </div>
      </div>
    </b-modal>
    <objects-table
      ref="table"
      @create="addIndexPrompt"
      @deleteSelectedRows="deleteIndices"
      :addItemText="'Add Page...'"
      :crumbs="crumbs"
      :fetchInitialData="fetchInitialData"
      :fetchRows="fetchRows"
      :givenCols="[idColumn]"
      :selectable="true"
      :numResults="numResults"
    >
      <template v-slot:header>
        <button @click="startScraping" title="Start scraping history.">Start scraping</button>
      </template>
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.ts';
import { INDEX_STORES, STORE_SCRAPING_QUEUE_PROFILEID } from '../../../store/Constants';
import { Hrefs } from '../../Constants';

export default {
  name: 'ScrapingQueue',
  components: {
    ObjectsTable,
  },
  data() {
    return {
      numResults: 0,
      indexStores: INDEX_STORES,
      curKeyPath: [],
    };
  },
  computed: {
    idColumn() {
      return STORE_SCRAPING_QUEUE_PROFILEID;
    },
    crumbs() {
      return [
        {
          text: 'Home',
          href: Hrefs.home(),
        },
        {
          text: 'Scraping queue',
          href: Hrefs.scrapingQueue(),
        },
      ];
    },
  },
  methods: {
    startScraping() {
      chrome.runtime.sendMessage('startScraping');
    },
    removeKeyPath(index) {
      this.curKeyPath.splice(index, 1);
    },
    addKeyToPath() {
      let keyPathInput = document.getElementById('addIndexKeypathInput').value;
      if (keyPathInput.length < 1) {
        return;
      }
      this.curKeyPath.push(keyPathInput);
    },
    async addIndex() {
      this.$bvModal.hide('addIndexModal');
      let storeNameInput = document.getElementById('addIndexObjectInput').value;
      if (storeNameInput.length < 1) {
        return;
      }
      if (this.curKeyPath.length < 1) {
        return;
      }
      await idb.createIndex(storeNameInput, this.curKeyPath);
      this.fetchData();
    },
    addIndexPrompt() {
      this.$bvModal.show('addPageToQueueModal');
    },
    async deleteIndices(selection) {
      for (let i in selection) {
        await idb.deleteIndex(selection[i].object, selection[i].keyPath);
      }
      this.fetchData();
    },
    async fetchInitialData() {
      this.numResults = await idb.getLengthScrapingQueue({ filters: this.$refs.table.filters });
    },
    async fetchRows() {
      let items = await idb.getScrapingQueue({
        filters: this.$refs.table.filters,
        offset: this.$refs.table.items.length,
        numRows: 100,
        sortOrder: this.$refs.table.sortOrder,
      });
      return items;
    },
  },
};
</script>
