<template>
  <div>
    <b-breadcrumb :items="crumbs"/>
    <h2>save or skip</h2>
    <ol>
      <li><router-link :to='{ name: "profiles" }'>Profiles {{numProfilesText}}</router-link></li>
      <li><router-link :to='{ name: "account" }'>Account</router-link></li>
      <li><router-link :to='{ name: "scrapers" }'>Scrapers</router-link></li>
    </ol>
    <button @click="resetDB">Reset DB</button>
    <button @click="fetchProfiles">Fetch profiles</button>
  </div>
</template>

<script>
import Profile from './Profile.vue';

export default {
  name: 'App',
  computed: {
    crumbs: function() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
      ];
    },
    numProfiles: function() {
      return this.$store.state.profiles.length;
    },
    numProfilesText: function() {
      return this.numProfiles > 0 ? '(' + this.numProfiles + ')' : '';
    },
  },
  methods: {
    resetDB() {
      indexedDB.deleteDatabase('saveorskip');
    },
    fetchProfiles() {
      chrome.runtime.sendMessage({
        action: 'storeDispatch',
        storeAction: 'fetchProfiles',
        storePayload: {},
      });
      // this.$store.dispatch('fetchProfiles');
    },
  },
};
</script>
