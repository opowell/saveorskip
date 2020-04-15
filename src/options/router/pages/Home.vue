<template>
  <div style="height: 100%;">
    <b-modal id="deleteAllModal" title="Reset database" @ok="resetDB" no-fade>
      <p class="my-4">Are you sure you want to permanently delete all of your data?</p>
    </b-modal>
    <objects-table ref="table" :object="tableRows" :showAdd="false" @click="clickRow" :selectable="false" thClass="hidden_header" :crumbs="crumbs">
      <template v-slot:header>
        <button @click="resetDBPrompt">Reset DB...</button>
      </template>
    </objects-table>
  </div>
</template>

<script>
import { DB_NAME, createDB } from '../../../store/Constants';
import ObjectsTable from '../components/ObjectsTable.vue';
import { LINKS } from '../../Constants';
import { deleteDB } from 'idb';

export default {
  name: 'Home',
  components: {
    ObjectsTable,
  },
  data() {
    return {
      tableRows: [
        {
          name: 'Profiles',
          description: 'A combination of properties, links and sources.',
        },
        {
          name: 'Scrapers',
          description: 'Code for extracting links and sources from webpages.',
        },
        {
          name: 'Settings',
          description: 'Change extension-wide settings.',
        },
        {
          name: 'Logs',
          description: 'Log of actions.',
        },
        {
          name: 'Indices',
          description: 'Stored indices. These are required for searches, but slow down writes.',
        },
      ],
    };
  },
  computed: {
    crumbs() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
      ];
    },
  },
  methods: {
    clickRow({ item, index, event }) {
      switch (item.name) {
        case 'Profiles':
          this.$router.push(LINKS.PROFILES);
          break;
        case 'Scrapers':
          this.$router.push('scrapers');
          break;
        case 'Settings':
          this.$router.push('settings');
          break;
        case 'Logs':
          this.$router.push(LINKS.LOGS);
          break;
        case 'Indices':
          this.$router.push('indices');
          break;
      }
    },
    resetDBPrompt() {
      this.$bvModal.show('deleteAllModal');
    },
    async resetDB() {
      console.log('Starting reset...');
      await deleteDB(DB_NAME, {
        blocked() {
          console.log('call was blocked!');
        },
      });
      createDB();
    },
  },
};
</script>

<style>
.hidden_header {
  display: none;
}
.breadcrumb {
  padding: 0.2rem 0.5rem !important;
}
</style>
