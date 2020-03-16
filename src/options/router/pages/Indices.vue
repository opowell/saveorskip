<template>
  <div style="height: 100%;">
    <b-modal id="addIndexModal" title="Add Index" @ok="addIndex" no-fade>
      <div>
        <span>Object:</span>
        <select id="addIndexObjectInput">
          <option v-for="(value, index) in INDEX_STORES" :key="index" :value="value">{{ value }}</option>
          <option value="sources">sources</option>
          <option value="link">links</option>
        </select>
      </div>
      <div>
        <span>Index:</span>
        <input id="addProfileNameInput" type="text" v-on:keyup.enter="addProfile" />
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
    >
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';

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
    addIndexPrompt() {
      this.$bvModal.show('addIndexModal');
    },
    deleteIndices(selection) {
      for (let i in selection) {
        idb.deleteIndex(selection[i].id);
      }
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
