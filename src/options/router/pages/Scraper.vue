<template>
  <div style="height: 100%;">
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
      @deleteObject="askDeleteObject"
      @save="saveObject"
      :crumbs="crumbs"
      :object="scraper"
      :ineditable-row-names="['id', 'domain', 'priority']"
      :ineditable-col-names="['id']"
      :rowDescriptions="{
        id: 'Unique identifier.',
        domain: 'The domain to use this scraper on.',
        priority: 'The order in which scrapers are processed. Higher values take precendence. Missing value is given a value of 1.',
        getLinks: 'Function that returns an array of this page\'s links. Links should be strings.',
        getSources:
          'Function that returns an array of this page\'s sources. Each source can either be a string (with the url of the source), or an object with the properties \'url\' and \'points\'. Alternatively, you can return \'pointsSave\' and \'pointsSkip\' to differentiate points changes for save and skip actions. For the save action, the points are added to the source score. For skip actions, the points are deducted from the source score.',
      }"
      :fetchInitialData="fetchInitialData"
      :addItemText="'Add Field...'"
      :numResults="numResults"
    >
      <template v-slot:header>
        <button @click="scrapePagePrompt" title="Open and scrape a page.">Test...</button>
      </template>
    </objects-table>
  </div>
</template>

<script>
import ObjectsTable from '../components/ObjectsTable.vue';
import * as idb from '../../../store/idb.ts';
import { convertId } from '../../../Utils.ts';
import { Hrefs } from '../../Constants';

export default {
  name: 'Scraper',
  components: {
    ObjectsTable,
  },
  watch: {
    testPage(x) {
      if (x !== null) {
        this.message = 'Finished scraping.';
      } else {
        this.message = '';
      }
    },
  },
  data() {
    return {
      scraper: {},
      message: '',
      numResults: 0,
      testPage: null,
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
      chrome.runtime.sendMessage({ action: 'setTestPageUrl', url });
      chrome.tabs.create({ url: 'http://' + url, active: false });
    },
    askDeleteObject() {
      this.$bvModal.show('deleteScraperModal');
    },
    async saveObject() {
      await idb.saveScraper(this.scraper);
      this.fetchData();
    },
    async deleteObject() {
      await idb.deleteScraper({
        scraperId: this.$route.params.id,
      });
      this.$router.push({ name: 'scrapers' });
    },
    async fetchInitialData() {
      this.scraper = await idb.getScraper({ scraperId: this.scraperId });
      this.$refs.table.changesPending = false;
      this.numResults = Object.keys(this.scraper).length;
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
          href: Hrefs.home(),
        },
        {
          text: 'Scrapers',
          href: Hrefs.scrapers(),
        },
        {
          text: this.scraperName,
          href: Hrefs.scraper(this.scraperId),
        },
      ];
    },
  },
};
</script>
