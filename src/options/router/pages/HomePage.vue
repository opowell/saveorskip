<template>
  <div>
      <b-breadcrumb :items="crumbs"/>
<h2>      save or skip: surfing without borders</h2>
      <ol>
<li>        <router-link :to='{ name: "profiles" }'>Profiles {{numProfilesText}}</router-link></li>
<li>        <router-link :to='{ name: "account" }'>Account</router-link></li>
<li>        <router-link :to='{ name: "scrapers" }'>Scrapers</router-link></li>
      </ol>
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
      return this.$store.getters.profileObjs.length;
    },
    numProfilesText: function() {
      return this.numProfiles > 0 ? '(' + this.numProfiles + ')' : '';
    },
  },
};
</script>
