<template>
  <div style="height: 100%;">
    <b-modal id="addScraperModal" title="Add Scraper" @ok="addScraper" no-fade>
      <div>
        <span>Domain:</span>
        <input id="addScraperDomainInput" type="text" v-on:keyup.enter="addScraper" />
      </div>
    </b-modal>
    <objects-table
      ref="table"
      @click="openScraper"
      @create="addScraperPrompt"
      @deleteSelectedRows="deleteScrapers"
      :ineditable-row-names="[]"
      :crumbs="crumbs"
      :givenCols="['id', 'priority', 'name', 'domain']"
      :fetchInitialData="fetchInitialData"
      :fetchRows="fetchRows"
      :numResults="numResults"
      :addItemText="'Add Scraper...'"
    />
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.ts';
import { STORE_SCRAPERS } from '../../../store/Constants';

export default {
  name: 'Scrapers',
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
          href: '#/',
        },
        {
          text: 'Scrapers',
          href: '#/scrapers',
        },
      ];
    },
  },
  methods: {
    deleteScrapers(selection) {
      for (let i in selection) {
        idb.deleteScraper({
          scraperId: selection[i].id,
        });
      }
    },
    async fetchInitialData() {
      this.numResults = await idb.getNumResults({ storeName: STORE_SCRAPERS, filters: this.$refs.table.filters });
    },
    async fetchRows() {
      let fetchedData = await idb.getScrapers();
      return fetchedData;
    },
    addScraperPrompt() {
      this.$bvModal.show('addScraperModal');
    },
    addScraper() {
      this.$bvModal.hide('addScraperModal');
      let domainInput = document.getElementById('addScraperDomainInput').value;
      if (domainInput.length < 1) {
        return;
      }
      let scraper = {
        doman: domainInput,
      };
      idb.addScraper(scraper);
    },
    openScraper({ item, index, event }) {
      this.$router.push({ name: 'scraper', params: { id: item.id } });
    },
  },
};
</script>
