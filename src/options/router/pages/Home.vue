<template>
  <div>
    <b-modal id="deleteAllModal" title="Reset database" @ok="resetDB">
      <p class="my-4">Are you sure you want to delete all your data and reset the database?</p>
    </b-modal>
    <b-breadcrumb :items="crumbs" />
    <ol>
      <li>
        <router-link :to="{ name: 'profiles' }">Profiles {{ numProfilesText }}</router-link>
      </li>
      <li><router-link :to="{ name: 'scrapers' }">Scrapers</router-link></li>
      <li><router-link :to="{ name: 'settings' }">Settings</router-link></li>
    </ol>
    <button @click="resetDBPrompt">Reset DB...</button>
    <b-card bg-variant="light" title="Welcome" style="max-width: 40rem; margin-top: 1rem;">
      <b-card-text>
        Save or skip links, and get new link recommendations based on your history.
      </b-card-text>
      <b-card-text> A <b>Profile</b> is a collection of links and sources for links. </b-card-text>
      <b-card-text>
        A <b>Source</b> is a link that provides link recommendations. Sources have a score (points) - the more points, the more often they offer suggestions.
      </b-card-text>
      <b-card-text> A <b>Link</b> is a reference to a webpage, and is either saved or not. </b-card-text>
    </b-card>
  </div>
</template>

<script>
import { DB_NAME, dbPromise } from '../../../store/Constants.ts';
import * as idb from '../../../store/idb.js';
import { deleteDB } from 'idb';

export default {
  name: 'Home',
  computed: {
    crumbs() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
      ];
    },
    numProfiles() {
      return this.$store.state.profiles.length;
    },
    numProfilesText() {
      return this.numProfiles > 0 ? '(' + this.numProfiles + ')' : '';
    },
  },
  methods: {
    resetDBPrompt() {
      this.$bvModal.show('deleteAllModal');
    },
    async resetDB() {
      // await dbPromise.close();
      // let delDBRequest = window.indexedDB.deleteDatabase(DB_NAME);
      // delDBRequest.onsuccess = function(event) {
      //   debugger;
      //   idb.fetchProfiles();
      // }
      // delDBRequest.onerror = function(event) {
      //   debugger;
      // }
      await deleteDB(DB_NAME, {
        blocked() {
          debugger;
        },
      });
    },
  },
};
</script>
