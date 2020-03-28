<template>
  <div style="height: 100%;">
    <objects-table
      ref="table"
      :object="logs"
      :crumbs="crumbs"
      @deleteSelectedRows="deleteLogs"
      sortBy="time"
      :sortDesc="true"
      :givenCols="['id', 'time', 'message', 'objectType', 'objectKeys']"
      :showAdd="false"
      :hoverProp="false"
      :totalRows="numLogs"
      @pageChanged="checkIfNeedData"
      :fetchData="fetchData"
    >
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { STORE_LOGS } from '../../../store/Constants.js';

export default {
  name: 'Logs',
  components: {
    ObjectsTable,
  },
  watch: {
    $route() {
      this.fetchData();
    },
  },
  data() {
    return {
      logs: [],
      cursor: null,
      numLogs: 0,
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
          text: 'Logs',
          href: '#/logs',
        },
      ];
    },
  },
  methods: {
    deleteLogs(selection) {
      for (let i in selection) {
        idb.deleteLog(selection[i].id);
      }
    },
    async fetchData() {
      this.logs.splice(0, this.logs.length);
      this.numLogs = await idb.getNumLogs();
      this.fetchMoreData();
    },
    checkIfNeedData(event) {
      if (this.logs.length < this.numLogs && this.logs.length < this.$refs.table.perPage * (event - 1) + 1) {
        this.fetchMoreData();
      }
    },
    async fetchMoreData() {
      let items = await idb.getStoreResults({ storeName: STORE_LOGS, filters: this.$refs.table.filters, offset: this.logs.length, numRows: 100 });
      this.logs.push(...items);
      this.$nextTick(async function() {
        if (this.$refs.table.items.length < this.$refs.table.perPage) {
          if (this.logs.length < this.numLogs) {
            await this.fetchMoreData();
          }
        }
      });
    },
  },
};
</script>
