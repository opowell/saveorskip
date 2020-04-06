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
      :numResults="numLogs"
      :fetchInitialData="fetchInitialData"
      :fetchRows="fetchRows"
    >
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb';
import { STORE_LOGS } from '../../../store/Constants';
import { Hrefs } from '../../Constants.ts';

export default {
  name: 'Logs',
  components: {
    ObjectsTable,
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
          href: Hrefs.logs(),
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
    async fetchInitialData() {
      this.logs.splice(0, this.logs.length);
      this.numLogs = await idb.getNumLogs();
    },
    async fetchRows() {
      let items = await idb.getStoreResults({ storeName: STORE_LOGS, filters: this.$refs.table.filters, offset: this.logs.length, numRows: 100 });
      return items;
    },
  },
};
</script>
