<template>
  <table>
    <thead>
      <th v-for='header in headers' :key='header'>{{ header }}</th>
      </thead>
      <tbody>
          <profilestablerow v-for='profile in profiles' :profile="profile" :key='profile.name'></profilestablerow>
      </tbody>
  </table>
</template>

<script>
import Profilestablerow from './Profilestablerow.vue';

export default {
  name: 'Profilestable',
  components: {
    Profilestablerow,
  },
  data: function() {
    return {
      profiles: this.$store.state.profiles,
      headers: ['', 'Name', 'Links', 'Sources'],
    };
  },
  computed: {
    profilesComp() {
      return this.$store.state.profiles;
    },
  },
};
</script>

<style>
td {
  padding: 5px;
}
th {
  padding: 5px;
}
</style>
