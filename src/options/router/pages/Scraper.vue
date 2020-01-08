<template>
  <div>
    <b-modal id="deleteScraperModal" title="Delete Scraper" @ok="deleteObject" no-fade>
      <p class="my-4">Are you sure you want to delete this scraper?</p>
    </b-modal>
    <b-modal size="xl" id="scrapePageModal" title="Test scraper" no-fade>
      <p>Enter the page you wish to scrape:</p>
      <div>
        <input id="testScraperUrlInput" type="text" v-on:keyup.enter="scrapePage" :value="defaultTestUrl" />
      </div>
      <button @click="scrapePage">Scrape</button>
      <div>{{ message }}</div>
      <div v-if="testPage !== null">
        <div><b>Page</b></div>
        <div v-for="(value, field) in testPage" :key="field">
          <template v-if="!['links', 'sources'].includes(field)"> {{ field }}: {{ value }} </template>
        </div>
        <div><b>Links</b></div>
        <div v-for="link in testPage.links" :key="link.url">
          {{ JSON.stringify(link) }}
        </div>
        <div><b>Sources</b></div>
        <div v-for="source in testPage.sources" :key="source.id">
          {{ JSON.stringify(source) }}
        </div>
      </div>
    </b-modal>
    <objects-table
      ref="table"
      :crumbs="crumbs"
      :object="scraper"
      @create="addProperty"
      :ineditable-row-names="['id', 'domain', 'priority']"
      :ineditable-col-names="['id']"
      :rowDescriptions="{
        id: 'Unique identifier.',
        domain: 'The domain to use this scraper on.',
        priority: 'The order in which scrapers are processed. Higher values take precendence.',
      }"
      @save="saveObject"
      :fetchData="fetchData"
      @deleteObject="askDeleteObject"
    >
      <template v-slot:header>
        <button @click="scrapePagePrompt" title="Open and scrape a page.">Test...</button>
      </template>
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.js';
import { STORE_SCRAPERS } from '../../../store/Constants.ts';
import { convertId } from '../../../Utils.js';
import Vue from 'vue';
import * as types from '../../../store/mutation-types.js';

export default {
  name: 'Scraper',
  components: {
    ObjectsTable,
  },
  watch: {
    '$route.params.id': function(id) {
      this.fetchData();
    },
    testPage: function(x) {
      if (x !== null) {
        this.message = 'Finished scraping.';
      } else {
        this.message = '';
      }
    },
  },
  mounted() {
    this.fetchData();
  },
  data() {
    return {
      scraper: {},
      message: '',
    };
  },
  methods: {
    scrapePagePrompt() {
      this.$bvModal.show('scrapePageModal');
    },
    async scrapePage() {
      this.message = 'Scraping...';
      let url = document.getElementById('testScraperUrlInput').value;
      if (url.length < 1) {
        return;
      }
      // chrome.runtime.sendMessage({ action: 'testPage', url });
      await idb.dispatchToStores('setTestPageUrl', {
        url,
      });
      chrome.tabs.create({ url: 'http://' + url, active: false });
    },
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
    defaultTestUrl() {
      if (this.scraper == null) {
        return '';
      }
      if (this.scraper.defaultTestUrl == null) {
        return this.scraper.domain;
      }
      return this.scraper.defaultTestUrl;
    },
    testPage() {
      return this.$store.state.testPage;
    },
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
