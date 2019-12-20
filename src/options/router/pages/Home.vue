<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <ol>
      <li>
        <router-link :to="{ name: 'profiles' }">Profiles {{ numProfilesText }}</router-link>
      </li>
      <li><router-link :to="{ name: 'scrapers' }">Scrapers</router-link></li>
      <li><router-link :to="{ name: 'settings' }">Settings</router-link></li>
    </ol>
    <button @click="resetDB">Reset DB...</button>
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
  },
};
</script>
