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
      :object="scrapers"
      @create="addScraperPrompt"
      @click="openScraper"
      :ineditable-row-names="[]"
      :crumbs="crumbs"
      @deleteSelectedRows="deleteScrapers"
      :givenCols="['id', 'priority', 'name', 'domain']"
      :fetchData="fetchData"
      :addItemText="'Add Scraper...'"
    />
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.ts';

export default {
  name: 'Scrapers',
  components: {
    ObjectsTable,
  },
  data() {
    return {
      scrapers: [],
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
    async fetchData() {
      this.scrapers.splice(this.scrapers.length);
      let fetchedData = await idb.getScrapers();
      this.scrapers.push(...fetchedData);
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
