<template>
  <div>
      <b-breadcrumb :items="crumbs"/>
        <h2>Profiles</h2>
        <div style='display: flex'>
          <input v-model='profileInput' v-on:keyup.enter="addProfile">
          <button id='addProfile' @click='addProfile'>add</button>
        </div>
        <profilestable></profilestable>
  </div>
</template>

<script>
import Profilestable from './Profilestable.vue';

export default {
  name: 'ProfilesPage',
  components: {
    Profilestable,
  },
  data: function() {
    return {
      profileInput: this.$store.getters.profileInput,
    };
  },
  computed: {
    crumbs: function() {
      return [
        {
          text: 'Home',
          href: '#/',
        },
        {
          text: 'Profiles',
          href: '#/profiles',
        },
      ];
    },
  },
  methods: {
    addProfile: function() {
      this.$store.dispatch('addProfile', this.profileInput);
      this.profileInput = '';
    },
  },
};
</script>

<style scoped>
p {
  font-size: 20px;
}
</style>
