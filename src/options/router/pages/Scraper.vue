<template>
  <div>
    <b-modal id="deleteScraperModal" title="Delete Scraper" @ok="deleteObject" no-fade>
      <p class="my-4">Are you sure you want to delete this scraper?</p>
    </b-modal>
    <objects-table
      ref="table"
      :crumbs="crumbs"
      :object="scraper"
      @create="addProperty"
      :ineditable-row-names="['id', 'domain', 'getLinks', 'getSources', 'getSourcesOfLink', 'getPageAttributes', 'onScriptLoad']"
      :ineditable-col-names="['id']"
      :rowDescriptions="{
        id: 'Unique identifier.',
        domain: 'The domain to use this scraper on.',
      }"
      @save="saveObject"
      :fetchData="fetchData"
      @deleteObject="askDeleteObject"
    >
      <template v-slot:header> </template>
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { STORE_SCRAPERS } from '../../../store/Constants.ts';
import { convertId } from '../../../Utils.js';
import Vue from 'vue';

export default {
  name: 'Scraper',
  components: {
    ObjectsTable,
  },
  watch: {
    '$route.params.id': function(id) {
      this.fetchData();
    },
  },
  mounted() {
    this.fetchData();
  },
  data() {
    return {
      scraper: {},
    };
  },
  methods: {
    askDeleteObject() {
      this.$bvModal.show('deleteScraperModal');
    },
    addProperty(inputStr) {
      Vue.set(this.scraper, inputStr, '');
      this.$refs.table.changesPending = true;
    },
    async saveObject() {
      await idb.saveObject(STORE_SCRAPERS, this.scraper);
      this.fetchData();
    },
    async deleteObject() {
      await idb.deleteScraper({
        scraperId: this.$route.params.id,
      });
      this.$router.push({ name: 'scrapers' });
    },
    async fetchData() {
      this.scraper = await idb.getScraper({ scraperId: this.scraperId });
      this.$refs.table.changesPending = false;
    },
  },
  computed: {
    scraperId() {
      return convertId(this.$route.params.id);
    },
    scraperName() {
      if (this.scraper == null) {
        return '';
      }
      if (this.scraper.domain === '') {
        return decodeURIComponent(this.scraper.id);
      }
      return this.scraper.domain;
    },
    crumbs: function() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
        {
          text: 'Scrapers',
          href: '#/scrapers',
        },
        {
          text: this.scraperName,
          href: '#/scrapers/' + encodeURIComponent(this.scraperId),
        },
      ];
    },
  },
};
</script>
