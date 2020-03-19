<template>
  <div style="height: 100%;">
    <b-modal id="addIndexModal" title="Add Index" @ok="addIndex" no-fade>
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
      :object="indices"
      @create="addIndexPrompt"
      :crumbs="crumbs"
      @deleteSelectedRows="deleteIndices"
      :givenCols="['object', 'keyPath']"
      :totalRows="numIndices"
      @pageChanged="checkIfNeedData"
      :fetchData="fetchData"
      :addItemText="'Add Index...'"
      :selectable="true"
    >
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { INDEX_STORES, KEYPATH_SEPARATOR } from '../../../store/Constants.ts';

export default {
  name: 'Indices',
  components: {
    ObjectsTable,
  },
  data() {
    return {
      indices: [],
      cursor: null,
      numIndices: 0,
      indexStores: INDEX_STORES,
      curKeyPath: [],
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
          text: 'Indices',
          href: '#/indices',
        },
      ];
    },
  },
  methods: {
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
      this.$bvModal.show('addIndexModal');
    },
    async deleteIndices(selection) {
      for (let i in selection) {
        await idb.deleteIndex(selection[i].object, selection[i].keyPath);
      }
      this.fetchData();
    },
    async fetchData() {
      this.indices.splice(0, this.indices.length);
      this.numLogs = await idb.getNumIndices();
      this.fetchMoreData();
    },
    checkIfNeedData(event) {
      if (this.logs.length < this.numLogs && this.logs.length < this.$refs.table.perPage * (event - 1) + 1) {
        this.fetchMoreData();
      }
    },
    async fetchMoreData() {
      let items = await idb.getIndices({ offset: this.indices.length, numRows: 100 });
      this.indices.push(...items);
      this.$nextTick(async function() {
        if (this.$refs.table.items.length < this.$refs.table.perPage) {
          if (this.indices.length < this.numIndices) {
            await this.fetchMoreData();
          }
        }
      });
    },
  },
};
</script>
