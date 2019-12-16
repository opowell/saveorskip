<template>
  <div>
    <b-breadcrumb :items="crumbs" />
    <ol>
      <li>
        <router-link :to="{ name: 'profiles' }">Profiles {{ numProfilesText }}</router-link>
      </li>
      <li><router-link :to="{ name: 'account' }">Account</router-link></li>
      <li><router-link :to="{ name: 'scrapers' }">Scrapers</router-link></li>
    </ol>
    <button @click="resetDB">Reset DB</button>
  </div>
</template>

<script>
export default {
  name: 'Home',
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
  },
};
</script>
