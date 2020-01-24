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
    >
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';

export default {
  name: 'Logs',
  components: {
    ObjectsTable,
  },
  mounted() {
    this.fetchData();
  },
  data() {
    return {
      logs: [],
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
      this.logs.push(...(await idb.getLogs()));
    },
  },
};
</script>
